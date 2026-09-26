// Ngân hàng câu hỏi phỏng vấn PostgreSQL 14 Internals — phần 1 (pg-iq01–pg-iq12).
// Gộp vào interview.js ở Task 6. Hợp đồng theo cấp giống hệt ngân hàng DDIA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)

export const pgInterviewPart1 = [
  // ===== pg-mvcc (pg-iq01–pg-iq04) =====
  {
    id: "pg-iq01",
    field: "pg-internals",
    topic: "pg-mvcc",
    level: 1,
    minutes: 5,
    question:
      "PostgreSQL công bố hỗ trợ bốn isolation level của chuẩn SQL, nhưng cách nó triển khai lại khác chuẩn khá nhiều. So sánh: mỗi mức chặn được anomaly nào, vì sao đặt Read Uncommitted thực ra vẫn chạy như Read Committed, và Repeatable Read của PostgreSQL khác gì Repeatable Read trong chuẩn?",
    mustCover: [
      "Chuẩn SQL định nghĩa bốn mức bằng danh sách anomaly cho phép: Read Uncommitted cho phép dirty read, non-repeatable read, phantom read; Read Committed cấm dirty read; Repeatable Read cấm thêm non-repeatable read nhưng vẫn cho phantom read; Serializable cấm mọi anomaly",
      "PostgreSQL cấm dirty read triệt để ngay từ thiết kế snapshot/MVCC, nên dù khai báo Read Uncommitted, hành vi thực tế giống hệt Read Committed",
      "Repeatable Read của PostgreSQL dùng một snapshot chụp một lần ở đầu transaction nên chặn cả non-repeatable read lẫn phantom read — chặt hơn yêu cầu tối thiểu của chuẩn cho mức này",
      "Dù chặt hơn chuẩn, Repeatable Read và Serializable của PostgreSQL vẫn có thể để lọt hai anomaly chuẩn không nhắc tới: write skew và anomaly của transaction chỉ đọc",
      "default_transaction_isolation mặc định là read committed",
    ],
    model:
      "Chuẩn SQL định nghĩa bốn isolation level hoàn toàn qua danh sách anomaly bị cấm ở mỗi mức: Read Uncommitted cho phép cả dirty read, non-repeatable read và phantom read; Read Committed cấm dirty read nhưng vẫn cho hai anomaly còn lại; Repeatable Read cấm thêm non-repeatable read nhưng vẫn để lọt phantom read; còn Serializable phải cấm mọi anomaly, kể cả những anomaly chuẩn chưa liệt kê. PostgreSQL không triển khai đúng y hệt bảng này. Vì tính cô lập được xây trên snapshot isolation đa phiên bản — mỗi transaction chỉ nhìn thấy các thay đổi đã commit trước khi snapshot của nó được tạo — dirty read bị cấm ngay từ thiết kế, không cần lock nào cả. Vì vậy nếu khai báo tường minh BEGIN ISOLATION LEVEL READ UNCOMMITTED, PostgreSQL vẫn chấp nhận cú pháp nhưng hành vi thực tế giống hệt Read Committed: dirty read không thể xảy ra dù mức này về lý thuyết cho phép — 'Read Uncommitted' trong PostgreSQL chỉ là một cái tên rỗng. Ở chiều ngược lại, Repeatable Read của PostgreSQL chặt hơn yêu cầu tối thiểu của chuẩn: vì nó chụp một snapshot duy nhất ở câu lệnh đầu tiên và giữ nguyên tới hết transaction, mọi câu lệnh sau đều nhìn thấy đúng một bức tranh dữ liệu — nên không chỉ non-repeatable read mà cả phantom read cũng bị chặn, dù chuẩn chỉ yêu cầu Repeatable Read chặn non-repeatable read và vẫn cho phép phantom read. Nhưng 'chặt hơn chuẩn' không có nghĩa là 'chặn mọi anomaly': Repeatable Read (và cả Serializable, vì nó xây trên cùng nền snapshot isolation) vẫn để lọt đúng hai anomaly ngoài danh sách của chuẩn — write skew và anomaly của transaction chỉ đọc — nên PostgreSQL cần một cơ chế phát hiện phụ thuộc đọc/ghi riêng ở mức Serializable để thực sự cấm 'mọi' anomaly như tên gọi hứa hẹn. Mức mặc định trong PostgreSQL, được xác định bởi default_transaction_isolation, là read committed.",
    redFlags: [
      "Nghĩ rằng đặt isolation level Read Uncommitted trong PostgreSQL sẽ cho phép dirty read",
      "Cho rằng Repeatable Read của PostgreSQL vẫn cho phantom read giống chuẩn",
      "Bỏ qua write skew khi khẳng định Repeatable Read của PostgreSQL đã đủ chặn mọi anomaly",
    ],
    probes: [
      "Vì sao PostgreSQL không cần lock để cấm dirty read?",
      "Nêu một anomaly mà Repeatable Read không chặn được dù đã chặn hết mọi anomaly trong chuẩn",
      "default_transaction_isolation mặc định là gì?",
    ],
    refs: ["pg-02"],
  },
  {
    id: "pg-iq02",
    field: "pg-internals",
    topic: "pg-mvcc",
    level: 2,
    minutes: 7,
    code: {
      lang: "sql",
      text: `-- Phiên 1                              -- Phiên 2
BEGIN;
SELECT amount FROM accounts
  WHERE id = 1;
--  amount
-- --------
--  800.00

                                         BEGIN;
                                         SELECT amount FROM accounts
                                           WHERE id = 1;
                                         --  amount
                                         -- --------
                                         --  800.00

UPDATE accounts SET amount = 800.00 + 100
  WHERE id = 1
  RETURNING amount;
--  amount
-- --------
--  900.00
COMMIT;

                                         UPDATE accounts SET amount = 800.00 + 100
                                           WHERE id = 1
                                           RETURNING amount;
                                         --  amount
                                         -- --------
                                         --  900.00
                                         COMMIT;`,
    },
    question:
      "Ứng dụng đọc amount của Alice, cộng thêm 100 ở tầng code, rồi ghi lại — chạy ở Read Committed (mặc định). Đoạn transcript trên chạy hai phiên xen kẽ. Dự đoán số dư cuối cùng của Alice, giải thích vì sao, rồi nêu ít nhất một cách sửa để không mất tiền.",
    mustCover: [
      "Cả hai phiên đều đọc amount = 800.00 trước khi phiên nào commit, rồi cộng riêng 100 ở tầng ứng dụng, nên cả hai UPDATE đều ghi cùng giá trị 900.00 — kết quả cuối cùng Alice chỉ có 900 thay vì 1000, mất 100",
      "PostgreSQL không biết giá trị 800.00 đã đọc trước đó có liên quan gì tới accounts.amount, nên ở Read Committed cả hai UPDATE đều hợp lệ theo đúng quy tắc visibility — không có gì để chặn lại",
      "Cách sửa rẻ và triệt để nhất khi làm được: gộp thành một câu lệnh SQL duy nhất UPDATE accounts SET amount = amount + 100, để PostgreSQL tự đọc giá trị mới nhất ngay trong câu lệnh",
      "Cách sửa thứ hai: SELECT amount FROM accounts WHERE id = 1 FOR UPDATE ngay từ đầu để khoá dòng khi đọc, buộc phiên thứ hai đợi rồi đọc lại giá trị đã cập nhật",
      "Cách sửa thứ ba: chuyển sang Repeatable Read, chấp nhận transaction commit sau bị lỗi could not serialize access due to concurrent update và phải có logic retry",
    ],
    model:
      "Ở đây ứng dụng đọc amount, cộng 100 ở tầng code, rồi ghi lại — đây chính là anti-pattern kinh điển đọc-rồi-ghi. Cả hai phiên đều BEGIN, đọc amount = 800.00 gần như cùng lúc trước khi phiên nào commit, nên cả hai đều tính ra 900.00 và ghi giá trị đó. Phiên nào commit sau cũng ghi đè đúng số 900.00 mà phiên trước đã ghi, nên rốt cuộc Alice có 900 thay vì 1000 đáng lẽ phải có sau hai lần +100 — mất đúng 100. PostgreSQL không hề sai ở đây: tại thời điểm UPDATE chạy, dữ liệu trong bảng thực sự chưa bị ai khác sửa (transaction kia còn chưa commit), nên UPDATE hợp lệ theo mọi quy tắc visibility của Read Committed. Vấn đề là hệ quản trị cơ sở dữ liệu không biết giá trị 800.00 đã đọc trước đó ở tầng ứng dụng có liên quan gì đến accounts.amount hay không — với nó, hai UPDATE là hai thao tác độc lập, đều hợp lệ. Có ba cách sửa. Rẻ và triệt để nhất khi làm được: viết lại thành một câu lệnh SQL duy nhất, UPDATE accounts SET amount = amount + 100 WHERE id = 1, để PostgreSQL tự đọc giá trị mới nhất ngay trong câu lệnh thay vì dựa vào giá trị đã đọc trước đó. Khi bắt buộc phải đọc rồi tính toán ở tầng ứng dụng trước khi ghi, cách thứ hai là SELECT amount FROM accounts WHERE id = 1 FOR UPDATE ngay từ đầu: nó khoá dòng ngay khi đọc, buộc phiên thứ hai phải đợi tới khi phiên thứ nhất commit rồi mới đọc được giá trị đã cập nhật, nên không còn đọc trùng giá trị cũ nữa. Cách thứ ba là chuyển cả hai transaction sang Repeatable Read: khi đó phiên commit sau sẽ nhận lỗi could not serialize access due to concurrent update ngay tại câu UPDATE hoặc COMMIT, và ứng dụng phải có logic retry — đọc lại giá trị mới rồi thử lại toàn bộ transaction. Với các transaction chỉ đọc thì Repeatable Read không bao giờ gặp lỗi này, nhưng với transaction ghi kiểu này thì phải chấp nhận chi phí retry.",
    redFlags: [
      "Cho rằng Read Committed đã đủ an toàn vì mỗi transaction chỉ thấy dữ liệu đã commit",
      "Chọn Serializable cho mọi transaction ghi mà không nhắc tới chi phí retry",
      "Quên rằng dùng Repeatable Read vẫn cần code xử lý serialization failure",
    ],
    probes: [
      "Vì sao SELECT ... FOR UPDATE giải quyết được nhưng SELECT thường thì không?",
      "Nếu chuyển sang Repeatable Read, ứng dụng phải xử lý lỗi gì khi COMMIT?",
      "Trong ba cách sửa, cách nào rẻ nhất về mặt khoá?",
    ],
    refs: ["pg-02"],
  },
  {
    id: "pg-iq03",
    field: "pg-internals",
    topic: "pg-mvcc",
    level: 3,
    minutes: 10,
    question:
      "Bạn thiết kế một hệ đặt chỗ nơi mỗi phòng chỉ được có tối đa một lượt đặt trong cùng khung giờ — ràng buộc này liên quan đến nhiều dòng cùng lúc nên không viết được thành một CHECK constraint đơn giản. Chọn isolation level nào cho transaction tạo booking, và đánh đổi ra sao giữa ba mức?",
    tradeoffs: [
      {
        option: "Read Committed",
        when: "Chỉ đủ an toàn nếu toàn bộ việc kiểm tra 'còn trống' và ghi dòng mới được gộp vào một câu lệnh (kiểu INSERT ... WHERE NOT EXISTS) hoặc dùng khoá tường minh trên các dòng liên quan; nếu tách thành hai câu lệnh riêng, hai transaction đặt chỗ song song có thể cùng đọc thấy còn trống rồi cùng ghi.",
      },
      {
        option: "Repeatable Read",
        when: "Chặn được non-repeatable read và phantom read nhưng KHÔNG chặn được write skew: snapshot được chụp một lần ở đầu transaction nên cả hai bên vẫn thấy 'còn trống' dù bên kia đã chèn dòng mới — vấn đề cần predicate lock chứ không phải row lock, và Repeatable Read không có predicate lock.",
      },
      {
        option: "Serializable",
        when: "Chặn được cả write skew nhờ theo dõi phụ thuộc đọc/ghi giữa các transaction rồi abort bằng serialization failure, nhưng ứng dụng phải retry, thông lượng giảm vì chi phí theo dõi phụ thuộc, và cách triển khai hiện tại có thể sinh dương tính giả tuỳ vào index sẵn có và RAM.",
      },
    ],
    mustCover: [
      "Ràng buộc 'không hai lượt đặt chồng khung giờ trong một phòng' là ràng buộc liên dòng, không thể phát biểu bằng CHECK constraint trên một bảng",
      "Ở Repeatable Read và Serializable, snapshot được chụp một lần ở câu lệnh đầu tiên và giữ nguyên tới hết transaction, nên hai transaction đặt chỗ song song đều thấy chung một bức tranh 'còn trống' dù có ai chen vào ở giữa",
      "Write skew (cùng với anomaly của transaction chỉ đọc) là những anomaly duy nhất mà snapshot isolation không chặn được, bất kể Repeatable Read đã chặn hết mọi anomaly có tên trong chuẩn SQL",
      "Serializable trong PostgreSQL vẫn xây trên nền snapshot isolation, chỉ thêm một lớp theo dõi phụ thuộc đọc/ghi để phát hiện write skew rồi abort bằng serialization failure, không dùng predicate lock tường minh kiểu System R",
      "Serializable có thể sinh dương tính giả, phải được toàn bộ ứng dụng tuân theo (trộn mức khác thì nó chỉ hoạt động như Repeatable Read mà không báo), và không được hỗ trợ trên replica",
    ],
    model:
      "Ràng buộc 'không phòng nào có hai lượt đặt chồng lấp thời gian' là ràng buộc liên dòng — nó so sánh nhiều bản ghi với nhau chứ không kiểm tra được trong phạm vi một dòng, nên không thể viết thành một CHECK constraint trên bảng bookings; PostgreSQL không tự bảo vệ được nó bằng ràng buộc toàn vẹn thông thường. Ở Read Committed, mỗi câu lệnh có snapshot riêng, nên nếu logic kiểm tra 'còn phòng trống' và logic ghi dòng đặt chỗ mới nằm trong hai câu lệnh khác nhau, hai transaction đặt chỗ đồng thời hoàn toàn có thể cùng đọc thấy phòng trống rồi cùng ghi — trừ khi mọi việc gộp được vào một câu lệnh (kiểu INSERT ... WHERE NOT EXISTS) hoặc dùng khoá tường minh trên các dòng liên quan. Chuyển sang Repeatable Read không giải quyết được vấn đề gốc: ở mức này, snapshot được chụp một lần ở câu lệnh đầu tiên của transaction và giữ nguyên tới khi kết thúc, nên hai transaction đặt chỗ song song đều thấy đúng một bức tranh 'phòng trống' ngay từ đầu, kể cả khi bên kia đã chèn dòng đặt chỗ mới ở giữa — đây chính là kịch bản write skew kinh điển: mỗi transaction riêng lẻ đều đúng nếu chạy một mình, nhưng chạy cùng nhau thì vi phạm ràng buộc. Write skew (cùng với anomaly của transaction chỉ đọc) là hai anomaly duy nhất mà snapshot isolation không chặn được, bất kể Repeatable Read đã chặn hết mọi anomaly có tên trong chuẩn SQL. Chỉ có Serializable mới chặn được write skew, nhưng cách nó làm không phải bằng predicate lock tường minh kiểu System R — PostgreSQL vẫn xây Serializable trên nền snapshot isolation, chỉ thêm một lớp theo dõi phụ thuộc đọc/ghi giữa các transaction để phát hiện các cặp có nguy cơ vi phạm tuần tự hoá rồi abort một trong hai bằng serialization failure. Cái giá phải trả: chi phí theo dõi phụ thuộc làm giảm thông lượng, ứng dụng phải sẵn sàng retry mọi transaction bị abort, và cách triển khai hiện tại có thể sinh dương tính giả — abort một transaction hoàn toàn an toàn chỉ vì 'không may', tuỳ thuộc những yếu tố khó đoán trước như index sẵn có hay lượng RAM. Ngoài ra Serializable phải được toàn bộ ứng dụng tuân theo (trộn với mức khác thì nó chỉ hoạt động như Repeatable Read mà không báo gì), và không được hỗ trợ trên replica. Với một hệ đặt chỗ, tôi chọn Serializable cho đúng transaction tạo booking (chi phí retry chấp nhận được vì đây là đường ghi quan trọng), giữ Read Committed cho các truy vấn chỉ đọc để không kéo cả hệ thống vào chi phí theo dõi phụ thuộc.",
    redFlags: [
      "Cho rằng Repeatable Read đã đủ vì nó chặn được phantom read",
      "Chọn Serializable mà không nhắc tới chi phí retry hoặc dương tính giả",
      "Nghĩ PostgreSQL triển khai predicate lock kiểu khoá điều kiện tường minh",
    ],
    probes: [
      "Vẽ kịch bản hai transaction cùng đặt phòng ở Repeatable Read dẫn tới write skew",
      "Dương tính giả của Serializable phụ thuộc vào yếu tố nào?",
      "Vì sao không thể trộn Serializable với Repeatable Read trong cùng ứng dụng?",
    ],
    refs: ["pg-02", "pg-04"],
  },
  {
    id: "pg-iq04",
    field: "pg-internals",
    topic: "pg-mvcc",
    level: 4,
    minutes: 15,
    incident: {
      symptom:
        "Bảng orders bị cập nhật liên tục (trạng thái đơn hàng đổi nhiều lần mỗi giây) bắt đầu phình to bất thường. Log cho thấy autovacuum chạy trên bảng này gần như liên tục, nhưng n_dead_tup trong pg_stat_all_tables gần như không giảm giữa các lần chạy.",
      scale:
        "Bảng orders có khoảng 2 triệu dòng, khoảng 500 UPDATE/giây vào giờ cao điểm. Có một job báo cáo nội bộ chạy BEGIN ISOLATION LEVEL REPEATABLE READ để tổng hợp số liệu, đôi khi treo hàng giờ vì chờ một API bên ngoài trả kết quả trước khi COMMIT. Một endpoint web khác cũng mở transaction rồi gọi ra ngoài trước khi UPDATE, đôi khi khiến kết nối rơi vào trạng thái idle in transaction 20-30 phút.",
      constraints:
        "Không sửa được code của job báo cáo trong tuần này (đội khác sở hữu). Không được tăng mạnh dung lượng đĩa vì ổ đã gần đầy. Phải giữ autovacuum bật, không được tắt để 'đỡ tải' vì bảng đang phình nhanh.",
    },
    question:
      "Autovacuum chạy đều đặn nhưng dead tuple không giảm — chẩn đoán nguyên nhân gốc và nêu việc cần làm ngay, việc cần làm để tránh tái diễn.",
    mustCover: [
      "Database horizon chỉ có MỘT cho toàn bộ cơ sở dữ liệu, nên nếu bất kỳ transaction nào (kể cả không đụng tới bảng orders) đang giữ horizon cũ, vacuum trên orders không thể dọn bất kỳ dead tuple nào nằm trong horizon đó dù chúng đã hết hạn từ lâu",
      "Một transaction ở Read Committed đang idle in transaction vẫn giữ database horizon y hệt một transaction Repeatable Read đang chạy dài, vì horizon dựa trên backend_xmin của cả phiên, không phải trên câu lệnh đang thực thi",
      "Job báo cáo Repeatable Read treo hàng giờ chờ API ngoài là thủ phạm cổ điển: nó giữ nguyên snapshot từ đầu transaction nên horizon không tiến, bất kể job có đang đụng tới bảng orders hay không",
      "VACUUM VERBOSE trên bảng sẽ cho thấy dòng kiểu 'N dead row versions cannot be removed yet, oldest xmin: X' — đúng bằng chứng để xác nhận chẩn đoán",
      "Việc cần làm ngay: tìm session giữ backend_xmin cũ nhất qua pg_stat_activity rồi xử lý nó; việc cần làm lâu dài: đặt idle_in_transaction_session_timeout để tự abort session rỗi, và tách job báo cáo Repeatable Read khỏi việc gọi I/O ngoài giữa lúc transaction đang mở",
    ],
    model:
      "Chìa khoá ở đây là database horizon chỉ có DUY NHẤT một cho toàn bộ cơ sở dữ liệu — nó được xác định bằng cách lấy horizon của mọi transaction đang có mặt và chọn cái xa nhất, tức cái có xmin cũ nhất. Nếu bất kỳ transaction nào, dù không hề đụng tới bảng orders, đang giữ một horizon cũ, thì vacuum trên orders không thể dọn bất kỳ dead tuple nào nằm bên trong horizon đó, kể cả khi chúng đã hết hạn từ rất lâu — đây chính là lý do autovacuum vẫn chạy đều (nó vẫn quét bảng, ghi log, cập nhật thống kê) nhưng n_dead_tup không giảm: nó tìm thấy dead tuple nhưng không được phép loại bỏ, y hệt kết quả VACUUM VERBOSE kiểu 'N dead row versions cannot be removed yet, oldest xmin: X' mà ta thấy khi có một transaction khác đang mở. Nghi phạm số một là job báo cáo BEGIN ISOLATION LEVEL REPEATABLE READ treo hàng giờ chờ API ngoài: vì Repeatable Read chụp snapshot một lần ở đầu transaction và giữ nó tới khi COMMIT, session này giữ horizon suốt thời gian treo, bất kể lúc đó nó có đang chạy câu lệnh nào trên bảng orders hay không. Nhưng đừng chủ quan cho rằng chỉ Repeatable Read mới nguy hiểm: một transaction thực ở Read Committed đang 'idle in transaction' (đã BEGIN nhưng đứng yên giữa các câu lệnh) cũng giữ database horizon y hệt vậy, vì horizon được xác định qua backend_xmin của cả phiên, không phải qua câu lệnh đang chạy — nên endpoint web mở transaction rồi gọi API ngoài trước khi UPDATE cũng là thủ phạm tiềm năng không kém. Việc cần làm ngay: truy vấn pg_stat_activity, sắp theo age(backend_xmin) giảm dần để tìm chính xác session nào đang giữ horizon cũ nhất, rồi cân nhắc chấm dứt nó (hoặc đợi nó tự xong nếu sắp hoàn tất). Về lâu dài: đặt idle_in_transaction_session_timeout để tự động abort các session rỗi quá lâu, và tách job báo cáo Repeatable Read sang một luồng không gọi I/O ra ngoài giữa lúc transaction đang mở — hoặc chuyển nó về Read Committed và gộp việc đọc thành một câu lệnh duy nhất nếu logic cho phép. Tôi sẽ không chạy VACUUM FULL trong lúc này: nó tốn một exclusive lock hoàn toàn không cần thiết trong khi nguyên nhân gốc — horizon bị giữ — vẫn còn đó.",
    redFlags: [
      "Kết luận ngay là do autovacuum cấu hình sai mà không kiểm tra pg_stat_activity.backend_xmin",
      "Đề xuất tăng autovacuum_vacuum_cost_limit hoặc giảm cost_delay mà bỏ qua nguyên nhân horizon bị giữ",
      "Không phân biệt được transaction idle in transaction ở Read Committed vẫn giữ horizon dù không có câu lệnh nào đang chạy",
      "Đề xuất VACUUM FULL ngay lập tức trong khi vẫn còn transaction giữ horizon",
    ],
    probes: [
      "Truy vấn nào tìm ra session đang giữ database horizon cũ nhất?",
      "Vì sao một transaction ảo ở Read Committed không giữ horizon lâu như một transaction thực?",
      "idle_in_transaction_session_timeout hoạt động như thế nào khi bị kích hoạt?",
    ],
    refs: ["pg-04", "pg-06"],
  },

  // ===== pg-vacuum (pg-iq05–pg-iq08) =====
  {
    id: "pg-iq05",
    field: "pg-internals",
    topic: "pg-vacuum",
    level: 1,
    minutes: 5,
    question:
      "Giải thích HOT update trong PostgreSQL: nó tránh được lãng phí gì, một UPDATE cần thoả điều kiện nào để trở thành HOT, và fillfactor liên quan thế nào?",
    mustCover: [
      "Nếu không có HOT, mỗi lần UPDATE tạo tuple mới thì MỌI index trên bảng đều phải nhận thêm một entry trỏ tới tuple mới, kể cả những index không đụng tới cột bị sửa",
      "Điều kiện thứ nhất để một UPDATE là HOT: cột bị sửa đổi không thuộc bất kỳ index nào trên bảng — nếu không, index đó buộc phải có entry riêng cho tuple mới",
      "Điều kiện thứ hai: tuple mới phải đặt vừa trong CÙNG heap page với tuple cũ — nếu page hết chỗ, HOT chain bị cắt (chain split) và một index entry mới phải được thêm ở page khác",
      "Trong một HOT chain, index chỉ giữ một entry duy nhất trỏ tới đầu chuỗi; các version tiếp theo được nối bằng con trỏ ctid trong tuple header, đánh dấu bằng bit Heap Hot Updated và Heap Only Tuple",
      "fillfactor mặc định 100 nghĩa là page có thể lấp đầy hoàn toàn khi INSERT; giảm fillfactor sẽ chừa sẵn không gian trống trong page cho các UPDATE sau này, tăng khả năng UPDATE là HOT",
    ],
    model:
      "HOT — Heap-Only Tuple update — giải quyết một sự lãng phí cụ thể của MVCC: nếu không có nó, mỗi lần UPDATE tạo ra một tuple mới thì mọi index trên bảng đều phải nhận thêm một entry trỏ tới tuple này, kể cả những index không hề đụng tới cột vừa bị sửa — càng nhiều index trên bảng thì chi phí này càng nặng, và các index còn phải tự prune dần các entry trỏ tới tuple lịch sử. Một UPDATE chỉ được coi là HOT nếu thoả hai điều kiện. Thứ nhất, cột bị sửa đổi không được thuộc bất kỳ index nào của bảng — nếu một cột có index bị đổi giá trị, index đó bắt buộc phải có entry riêng trỏ tới tuple mới, phá vỡ toàn bộ ý tưởng của tối ưu hoá này. Thứ hai, tuple mới phải đặt vừa trong CÙNG một heap page với tuple cũ; nếu page đã đầy, PostgreSQL phải thêm tuple ở page khác và tạo một index entry mới cho nó — HOT chain bị 'tách' (chain split). Khi cả hai điều kiện thoả, index chỉ giữ đúng một entry, trỏ tới đầu của một chuỗi (HOT chain) các row version nằm trong cùng page; các version tiếp theo được nối với nhau bằng con trỏ ctid ngay trong tuple header, đánh dấu bằng bit Heap Hot Updated ở đầu chuỗi và Heap Only Tuple ở các tuple không được index tham chiếu trực tiếp. Một index scan gặp tuple đánh dấu Heap Hot Updated sẽ tự đi tiếp theo chuỗi ctid để tìm phiên bản đang hiển thị, nên việc duyệt luôn nằm gọn trong một page, không bao giờ phải nhảy sang page khác. fillfactor liên quan trực tiếp tới điều kiện thứ hai: giá trị mặc định 100 nghĩa là một INSERT có thể lấp đầy page hoàn toàn, không chừa chỗ nào cho UPDATE sau này — page đầy ngay từ đầu thì UPDATE đầu tiên đã có thể phải tách chain. Nếu bảng có cột không đánh index nhưng bị sửa thường xuyên, hạ fillfactor xuống (ví dụ 70-90) sẽ chủ động chừa một phần trống trong mỗi page dành riêng cho UPDATE, giữ HOT hoạt động lâu hơn — đổi lại kích thước vật lý ban đầu của bảng tăng lên vì mỗi page chứa ít dữ liệu hơn.",
    redFlags: [
      "Cho rằng HOT update áp dụng được bất kể cột nào bị sửa, miễn dòng không đổi kích thước",
      "Quên điều kiện cùng page và nghĩ HOT chain có thể trải dài nhiều page",
      "Không biết fillfactor mặc định là 100, tức không chừa chỗ nào trừ khi được đặt lại",
    ],
    probes: [
      "Điều gì xảy ra khi HOT chain bị buộc phải tách sang page khác?",
      "Vì sao fillfactor thấp làm bảng chiếm nhiều đĩa hơn dù ít phải tách HOT chain hơn?",
      "Vì sao index chỉ cần một entry cho cả một HOT chain?",
    ],
    refs: ["pg-05"],
  },
  {
    id: "pg-iq06",
    field: "pg-internals",
    topic: "pg-vacuum",
    level: 2,
    minutes: 8,
    code: {
      lang: "sql",
      text: `=> SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
     FROM pg_stat_user_tables WHERE relname = 'events';
 relname | n_live_tup | n_dead_tup |    last_autovacuum
---------+------------+------------+------------------------
 events  |     950000 |     210000 | 2026-09-26 08:14:02+00

=> SELECT reltuples FROM pg_class WHERE relname = 'events';
 reltuples
-----------
    950000

=> SHOW autovacuum_vacuum_threshold;
 autovacuum_vacuum_threshold
------------------------------
 50

=> SHOW autovacuum_vacuum_scale_factor;
 autovacuum_vacuum_scale_factor
---------------------------------
 0.2`,
    },
    question:
      "Bảng events nhận khoảng 3.000 UPDATE/phút. Với kết quả pg_stat_user_tables và cấu hình autovacuum mặc định ở trên, tính ngưỡng kích hoạt autovacuum cho bảng này, cho biết autovacuum có nên đã chạy chưa, và đề xuất chỉnh tham số nào riêng cho bảng.",
    mustCover: [
      "Ngưỡng kích hoạt = autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × reltuples = 50 + 0.2 × 950000 = 190050",
      "n_dead_tup hiện tại (210000) đã vượt ngưỡng 190050 nên autovacuum về lý thuyết phải đã kích hoạt hoặc đang chạy — last_autovacuum gần đây khớp với điều đó",
      "Giá trị mặc định scale_factor = 0.2 cho phép tới 20% bảng là dead tuple trước khi vacuum chạy — với bảng gần một triệu dòng, đó là hàng trăm nghìn dòng bloat, quá lớn cho một bảng cập nhật liên tục",
      "Nên hạ autovacuum_vacuum_scale_factor (và có thể tăng autovacuum_vacuum_threshold) riêng cho bảng này bằng storage parameter qua ALTER TABLE, vì giá trị tối ưu phụ thuộc kích thước bảng và loại tải",
      "Phải dùng pg_class.reltuples chứ không phải n_live_tup để tính ngưỡng — hai giá trị chỉ trùng khớp ngay sau một lần ANALYZE, và reltuples = -1 (coi như 0) nếu bảng chưa từng được phân tích",
    ],
    model:
      "Công thức kích hoạt autovacuum theo dead tuple là: pg_stat_all_tables.n_dead_tup > autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × pg_class.reltuples. Với cấu hình mặc định (threshold = 50, scale_factor = 0.2) và reltuples = 950000 như trong pg_class ở trên, ngưỡng là 50 + 0.2 × 950000 = 190050. n_dead_tup hiện tại của bảng là 210000, đã vượt ngưỡng này, nên về lý thuyết autovacuum phải đã kích hoạt hoặc đang chạy — và last_autovacuum gần đây (2026-09-26 08:14:02) khớp với điều đó, nên hệ thống đang hoạt động đúng như thiết kế chứ chưa hẳn có gì sai. Vấn đề tôi thấy là ở chính giá trị mặc định: scale_factor = 0.2 cho phép tới 20% số dòng của bảng là dead tuple trước khi vacuum được kích hoạt — với một bảng gần một triệu dòng, 20% là gần 200.000 dòng bloat tồn tại thường trực, khá lớn cho một bảng đang nhận 3.000 UPDATE/phút. Tôi sẽ hạ scale_factor riêng cho bảng này bằng storage parameter: ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_threshold = 200); vì giá trị tối ưu phụ thuộc kích thước bảng cụ thể và loại tải chứ không có một con số chung tốt cho mọi bảng — bảng lớn nên dùng scale_factor thấp hơn nhiều so với mặc định. Một điểm cần lưu ý khi tính tay: phải dùng pg_class.reltuples chứ không phải n_live_tup — hai giá trị này chỉ trùng khớp ngay sau một lần ANALYZE, và nếu bảng chưa từng được phân tích thì reltuples = -1 (được coi như 0 trong công thức), khiến ngưỡng thực tế nhỏ hơn nhiều so với công thức lý thuyết gợi ý. Cuối cùng, vì autovacuum_max_workers mặc định chỉ là 3, nếu nhiều bảng lớn cùng vượt ngưỡng một lúc, worker có thể không rảnh kịp — nên tôi sẽ theo dõi thêm qua một view kiểu need_vacuum (so sánh trực tiếp dead_tup với max_dead_tup) thay vì chỉ tin vào ngưỡng lý thuyết.",
    redFlags: [
      "Tính ngưỡng bằng n_live_tup thay vì pg_class.reltuples",
      "Đề xuất tắt autovacuum ở bảng vì nó chạy quá thường xuyên, thay vì điều chỉnh scale_factor/threshold",
      "Quên rằng reltuples = -1 khi bảng chưa có statistics, khiến công thức tính sai nếu áp dụng máy móc",
    ],
    probes: [
      "Nếu reltuples = -1, công thức tính ngưỡng cho ra kết quả gì?",
      "Vì sao scale_factor quan trọng hơn threshold tuyệt đối với bảng lớn?",
      "Ghi đè scale_factor cho một bảng cụ thể bằng lệnh nào?",
    ],
    refs: ["pg-06"],
  },
  {
    id: "pg-iq07",
    field: "pg-internals",
    topic: "pg-vacuum",
    level: 3,
    minutes: 11,
    question:
      "Một bảng 200 GB đã phình khoảng 60% (chỉ còn khoảng 40% không gian là dữ liệu hữu ích). Bạn có ba lựa chọn để lấy lại không gian: VACUUM FULL, một công cụ xây dựng lại bảng gần như không khoá, hoặc chỉ chỉnh autovacuum/fillfactor rồi chờ. So sánh đánh đổi.",
    tradeoffs: [
      {
        option: "VACUUM FULL",
        when: "Chấp nhận được downtime — nó khoá exclusive hoàn toàn bảng (cả đọc lẫn ghi) suốt quá trình, xây dựng lại bảng rồi lần lượt từng index; cần thêm không gian đĩa tạm vì file cũ và file mới cùng tồn tại lúc xây dựng lại; đổi lại mật độ dữ liệu sau cùng rất cao, với index thậm chí cao hơn ban đầu vì dựng B-tree từ dữ liệu có sẵn hiệu quả hơn chèn dần.",
      },
      {
        option: "pg_repack (hoặc công cụ tương tự)",
        when: "Cần tránh downtime dài — chỉ giữ exclusive lock ngắn ở đầu và cuối; suốt thời gian xây dựng lại, thay đổi trên bảng gốc được một trigger ghi lại rồi áp dụng vào bảng mới, cuối cùng hoán đổi bảng trong system catalog; đổi lại phức tạp hơn để vận hành, vẫn cần đủ không gian đĩa cho một bản sao gần đầy đủ của bảng, và đây là công cụ ngoài lõi PostgreSQL.",
      },
      {
        option: "Chỉnh autovacuum/fillfactor rồi chờ vacuum thường xuyên dọn dần",
        when: "Không có ngân sách downtime lẫn không gian đĩa tạm — nhưng vacuum thường (không FULL) hầu như không giảm được số page đã cấp phát, chỉ trả không gian về hệ điều hành nếu có vài page trống liên tục ở cuối file; với bảng đã phình sẵn 60%, cách này giữ nguyên kích thước file hiện tại và chỉ ngăn phình thêm, không thu hồi lại dung lượng đã mất.",
      },
    ],
    mustCover: [
      "VACUUM FULL xây lại cả bảng lẫn từng index, khoá exclusive toàn bộ bảng (cả đọc lẫn ghi) suốt quá trình, và cần giữ cả file cũ lẫn file mới trên đĩa cùng lúc nên đòi hỏi thêm không gian trống",
      "pg_repack đạt được gần như zero-downtime bằng cách dùng trigger ghi lại thay đổi trên bảng gốc rồi áp vào bảng mới, chỉ cần exclusive lock ngắn ở đầu và cuối để hoán đổi bảng trong system catalog",
      "Vacuum thường (không FULL) hiếm khi giảm số page của file — chỉ page trống ở ngay cuối file mới được cắt trả cho hệ điều hành — nên chỉ chỉnh autovacuum sẽ không thu hồi được dung lượng đã phình, chỉ ngăn bloat thêm",
      "REINDEX là lệnh nền mà cả VACUUM FULL lẫn CLUSTER đều gọi bên dưới khi xây dựng lại index; nếu chỉ index bị phình còn bảng vẫn ổn, chạy REINDEX riêng cho index đó rẻ hơn nhiều so với làm lại cả ba phương án trên",
      "Một cách tiếp cận trung gian khác, kiểu pgcompacttable, chạy nhiều lần UPDATE giả (không đổi dữ liệu) để dịch dần các row version hiện hành về đầu file, xen giữa là các đợt vacuum loại bỏ tuple lỗi thời và cắt ngắn dần phần đuôi trống — tốn nhiều thời gian/tài nguyên hơn nhưng không cần thêm không gian đĩa và không gây tăng tải đột biến",
    ],
    model:
      "Với một bảng 200 GB đã phình 60%, tôi sẽ không nhảy thẳng vào VACUUM FULL. VACUUM FULL xây dựng lại toàn bộ bảng rồi lần lượt từng index, và trong suốt quá trình đó nó khoá exclusive hoàn toàn — cả đọc lẫn ghi đều bị chặn, không có ngoại lệ. Vì cả file cũ lẫn file mới phải cùng tồn tại trên đĩa trong lúc xây dựng lại, tôi cần thêm không gian trống đáng kể trước khi file cũ được xoá. Đổi lại, mật độ dữ liệu sau cùng rất cao, thậm chí với index còn cao hơn ban đầu vì dựng B-tree từ dữ liệu có sẵn hiệu quả hơn chèn dần từng entry. Nếu ngân sách downtime không cho phép một cửa sổ bảo trì dài, tôi chuyển sang một công cụ như pg_repack: nó đạt được gần như zero-downtime bằng cách chỉ giữ exclusive lock ngắn ở đầu và cuối quá trình; toàn bộ thời gian xây dựng lại, mọi thay đổi trên bảng gốc được một trigger ghi lại rồi áp dụng dần vào bảng mới, và bước cuối cùng chỉ đơn giản là hoán đổi bảng này với bảng kia trong system catalog. Tôi nêu công cụ này vì sách có nhắc đến nó đúng ở phần bàn về các cách giảm downtime khi xây dựng lại bảng và index — không phải một gợi ý tuỳ tiện ngoài phạm vi. Cái giá của cách này là độ phức tạp vận hành cao hơn (một công cụ ngoài lõi PostgreSQL, cần trigger và bảng phụ) và vẫn cần đủ không gian đĩa cho gần như một bản sao đầy đủ của bảng trong lúc chạy. Sách còn nhắc tới một cách tiếp cận trung gian khác, kiểu pgcompacttable: nó chạy nhiều lần UPDATE giả (không đổi dữ liệu) để dịch dần các row version hiện hành về đầu file, xen giữa các đợt là vacuum loại bỏ tuple lỗi thời và cắt ngắn dần phần đuôi trống — tốn nhiều thời gian và tài nguyên hơn hẳn hai cách trên, nhưng không cần thêm không gian đĩa để xây dựng lại và không gây ra các đợt tăng tải đột biến, dù vẫn giữ các exclusive lock ngắn hạn khi bảng bị cắt ngắn. Lựa chọn thứ ba trong ba phương án ban đầu — chỉ chỉnh autovacuum/fillfactor rồi chờ — tôi loại ngay cho mục tiêu 'lấy lại không gian đã mất': vacuum thường gần như không giảm được số page đã cấp phát cho file, nó chỉ trả không gian về hệ điều hành nếu có vài page trống liên tục ngay ở cuối file, điều hiếm khi xảy ra tự nhiên. Với một bảng đã phình sẵn 60%, cách này chỉ ngăn bloat tăng thêm chứ không thu hồi được dung lượng đã mất — nó là biện pháp phòng ngừa cho tương lai, không phải cách xử lý sự cố hiện tại. Một điểm đáng nhắc thêm: nếu vấn đề chỉ nằm ở index bị phình còn bảng vẫn ổn, tôi sẽ không động tới cả bảng — REINDEX chính là lệnh nền mà cả VACUUM FULL lẫn CLUSTER đều gọi bên dưới khi xây dựng lại index, nên chạy REINDEX riêng cho index đó rẻ hơn nhiều so với làm lại theo bất kỳ phương án nào ở trên. Nếu có thể chấp nhận một cửa sổ bảo trì ngắn, tôi chọn VACUUM FULL vì đơn giản và có sẵn trong lõi; nếu không, pg_repack; và song song, tôi vẫn chỉnh lại autovacuum_vacuum_scale_factor cho bảng này để nó không phình lại như cũ.",
    redFlags: [
      "Đề xuất VACUUM FULL trên hệ production giờ cao điểm mà không nhắc tới việc nó khoá đọc lẫn ghi",
      "Nghĩ rằng chỉ cần bật hoặc tăng tốc autovacuum là đủ để bảng nhỏ lại",
      "Gọi pg_repack là tính năng có sẵn trong lõi PostgreSQL",
    ],
    probes: [
      "Vì sao VACUUM FULL cần thêm không gian đĩa tạm gần bằng kích thước bảng?",
      "pg_repack tránh downtime bằng cơ chế nào ở bước hoán đổi cuối cùng?",
      "Vì sao vacuum thường không trả lại được dung lượng đã phình từ giữa file?",
    ],
    refs: ["pg-08", "pg-06"],
  },
  {
    id: "pg-iq08",
    field: "pg-internals",
    topic: "pg-vacuum",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Log server liên tục in cảnh báo dạng database ... must be vacuumed within N transactions, và tuổi (age) của relfrozenxid trên một bảng log lịch sử rất lớn, gần như chỉ insert-only, đang tiến sát ngưỡng cấu hình cho autovacuum cưỡng bức.",
      scale:
        "Cluster xử lý trung bình 1.000 transaction/giây suốt ngày đêm. Bảng audit_log có hàng tỷ dòng, hầu như chỉ được INSERT, gần như không UPDATE/DELETE. autovacuum_freeze_max_age vẫn giữ giá trị mặc định. Đội vận hành phát hiện relfrozenxid của bảng này có tuổi hơn 180 triệu transaction.",
      constraints:
        "Không được tắt autovacuum để giảm tải — đó chính là thứ duy nhất đang ngăn wraparound. Không thể tăng autovacuum_freeze_max_age tuỳ tiện vì tham số này đổi cần khởi động lại server, và giá trị lớn hơn làm tăng nguy cơ không kịp freeze. Cần một kế hoạch xử lý trong vài giờ tới trước khi cảnh báo leo thang.",
    },
    question:
      "Cảnh báo wraparound này nghĩa là gì, tại sao lại xảy ra trên một bảng gần như chỉ insert, và bạn xử lý ra sao trong vài giờ tới lẫn về lâu dài?",
    mustCover: [
      "Transaction ID chỉ có 32 bit; ở tải trung bình 1.000 TPS, không gian này có thể cạn trong khoảng sáu tuần hoạt động liên tục nếu không có freezing — đây là lý do PostgreSQL phải chủ động freeze tuple cũ",
      "Autovacuum bị cưỡng bức chạy (kể cả khi bảng bị tắt autovacuum cấp bảng) khi tuổi transaction chưa freeze có nguy cơ vượt autovacuum_freeze_max_age (mặc định 200 triệu), dựa trên relfrozenxid cũ nhất trong toàn bộ pg_class",
      "Một bảng insert-only vẫn cần được vacuum để freeze các heap tuple cũ và đẩy relfrozenxid lên, dù nó không hề tích luỹ dead tuple — nếu vacuum không kịp chạy, relfrozenxid của nó sẽ ngày càng già đi",
      "Nếu tuổi tiếp tục tăng và có nguy cơ vượt vacuum_failsafe_age (mặc định 1,6 tỷ), chế độ freezing failsafe sẽ bật: autovacuum bỏ qua vacuum_cost_delay và ngừng vacuum index để freeze heap tuple nhanh nhất có thể",
      "Hành động ngay: chạy thủ công VACUUM FREEZE trên bảng audit_log thay vì chờ autovacuum tự nhận ra; hành động lâu dài: đảm bảo autovacuum không bị tắt trên các bảng insert-only lớn, vì vacuum vẫn cần chạy trên chúng dù không có dead tuple, chỉ để freeze",
    ],
    model:
      "Cảnh báo này liên quan tới transaction ID wraparound: mỗi transaction ID chỉ chiếm 32 bit, và ở tải 1.000 TPS liên tục, không gian này có thể cạn trong khoảng sáu tuần nếu không có gì ngăn lại — đó là lý do PostgreSQL phải chủ động 'đóng băng' (freeze) các tuple cũ để tái sử dụng an toàn transaction ID của chúng. Autovacuum thông thường chỉ chạy khi dead tuple tích luỹ đủ nhiều, nhưng còn một cơ chế hoàn toàn khác: autovacuum bị CƯỠNG BỨC chạy — kể cả khi đã bị tắt ở cấp bảng — nếu có nguy cơ tuổi của transaction chưa được freeze trong cơ sở dữ liệu vượt quá autovacuum_freeze_max_age (mặc định 200 triệu), dựa trên relfrozenxid cũ nhất trong toàn bộ pg_class. Đây chính xác là tình huống của audit_log: nó gần như chỉ INSERT nên hầu như không có dead tuple, nhưng vẫn cần được vacuum định kỳ để freeze các heap tuple cũ và đẩy relfrozenxid của nó lên — nếu vì lý do nào đó (bảng quá lớn nên mỗi lần vacuum quá lâu, hoặc từng bị tắt autovacuum cấp bảng) việc đó không xảy ra kịp, relfrozenxid cứ già đi và log bắt đầu cảnh báo. Với tuổi hiện tại hơn 180 triệu, gần sát 200 triệu mặc định, tôi coi đây là tình huống cần xử lý ngay chứ không đợi autovacuum tự nhận ra: tôi chạy thủ công VACUUM FREEZE trên audit_log (có thể kèm storage parameter vacuum_index_cleanup false để bỏ qua bước dọn index, freeze nhanh nhất có thể, đúng tinh thần chế độ failsafe) để chủ động đẩy relfrozenxid lên trước khi chạm ngưỡng. Nếu tuổi tiếp tục tăng và có nguy cơ vượt vacuum_failsafe_age (mặc định 1,6 tỷ — cao hơn hẳn autovacuum_freeze_max_age), PostgreSQL sẽ tự bật chế độ freezing failsafe: autovacuum bỏ qua hoàn toàn vacuum_cost_delay và ngừng cả việc vacuum index để dồn toàn lực freeze heap tuple — nhưng tôi không muốn để tình huống đi xa tới mức đó. Về lâu dài, tôi sẽ kiểm tra lại mọi bảng lớn insert-only trong cluster để chắc chắn autovacuum không bị tắt trên bất kỳ bảng nào trong số đó, vì vacuum vẫn phải chạy trên chúng dù không có dead tuple nào — chỉ để làm đúng một việc: freeze. Tôi tuyệt đối không tăng autovacuum_freeze_max_age lên cao hơn để 'câu giờ' — giá trị càng lớn thì nguy cơ không kịp freeze trước khi thực sự wraparound càng cao, đúng như chính lý do tham số này có giới hạn mặc định thấp hơn nhiều so với trần 2 tỷ của nó.",
    redFlags: [
      "Coi cảnh báo này là lỗi vô hại có thể bỏ qua vì bảng không ai xoá gì",
      "Đề xuất tắt autovacuum trên bảng để giảm tải I/O trong lúc cảnh báo đang leo thang",
      "Không phân biệt được autovacuum thông thường (dựa trên dead tuple) với autovacuum cưỡng bức (dựa trên tuổi transaction chưa freeze)",
      "Tăng autovacuum_freeze_max_age lên rất cao để 'câu giờ' mà không hiểu điều đó làm tăng nguy cơ wraparound thật sự",
    ],
    probes: [
      "Vì sao một bảng chỉ INSERT vẫn cần vacuum dù không có dead tuple?",
      "Nếu server thực sự chạm ngưỡng wraparound thì điều gì xảy ra?",
      "VACUUM FREEZE khác gì so với VACUUM thông thường?",
    ],
    refs: ["pg-07"],
  },

  // ===== pg-wal (pg-iq09–pg-iq12) =====
  {
    id: "pg-iq09",
    field: "pg-internals",
    topic: "pg-wal",
    level: 1,
    minutes: 5,
    question:
      "Giải thích vì sao PostgreSQL cần WAL thay vì chỉ ghi thẳng các page dữ liệu đã sửa xuống đĩa, quy tắc bắt buộc giữa việc ghi WAL và ghi page, checkpoint làm gì, và recovery sau sự cố bắt đầu đọc WAL từ đâu.",
    mustCover: [
      "Nếu chỉ ghi thẳng page dữ liệu, server phải liên tục ghi các page ngẫu nhiên xuống đĩa theo một thứ tự đảm bảo nhất quán tại mọi thời điểm — rất khó đạt được, đặc biệt với các cấu trúc index phức tạp; WAL cho phép hoãn việc ghi page mà vẫn khôi phục được sau sự cố",
      "Quy tắc bắt buộc: một mục WAL liên quan đến việc sửa page phải được ghi xuống đĩa TRƯỚC chính page đã sửa đó — nguồn gốc tên gọi write-ahead",
      "WAL là một dòng ghi tuần tự, rẻ hơn nhiều so với ghi ngẫu nhiên các page, kể cả trên HDD",
      "Checkpoint tạo ra một điểm mà từ đó recovery có thể bắt đầu an toàn: nó đánh dấu các dirty buffer tại thời điểm bắt đầu rồi lần lượt ghi chúng xuống đĩa; khi mọi buffer đã đánh dấu được ghi xong, checkpoint được coi là hoàn tất và mọi mục WAL trước điểm bắt đầu của nó có thể bị xoá",
      "Khi khởi động lại sau sự cố, tiến trình startup đọc pg_control để lấy LSN bắt đầu (REDO location) của checkpoint hoàn tất gần nhất, rồi phát lại các mục WAL từ đó theo chiều tiến, chỉ áp dụng mục có LSN lớn hơn LSN đã lưu trong page",
    ],
    model:
      "Nếu PostgreSQL chỉ ghi thẳng các page dữ liệu đã sửa xuống đĩa, để giữ tính nhất quán tại MỌI thời điểm, server sẽ phải ghi các page theo một thứ tự đảm bảo không bao giờ để lộ trạng thái nửa vời — cực kỳ khó đạt được, nhất là với các cấu trúc index phức tạp — và còn phải ghi ngẫu nhiên xuống đĩa liên tục, đắt hơn nhiều so với ghi tuần tự. WAL giải quyết việc này bằng cách cho phép hoãn việc ghi page: mỗi thay đổi trong RAM trước tiên được ghi thành một mục nhật ký (log entry) chứa đủ thông tin để lặp lại thao tác đó, và mục nhật ký này được ghi xuống đĩa dưới dạng một dòng dữ liệu liên tục — ngay cả HDD cũng xử lý tốt kiểu ghi tuần tự này. Quy tắc bắt buộc và cũng là nguồn gốc cái tên 'ghi trước' (write-ahead): một mục WAL liên quan đến việc sửa đổi page phải được ghi xuống đĩa TRƯỚC chính page đã sửa đổi đó. Nhờ quy tắc này, nếu có sự cố, PostgreSQL luôn có đủ thông tin trong WAL để phát lại (replay) mọi thay đổi mà kết quả của chúng chưa kịp xuống đĩa. Checkpoint giải quyết câu hỏi 'recovery nên bắt đầu từ đâu': nó là một điểm dịch chuyển dần về phía trước, đánh dấu rằng mọi dirty buffer tại thời điểm bắt đầu checkpoint đã được ghi xuống đĩa xong (checkpoint hoàn tất) — từ đó, mọi mục WAL trước điểm bắt đầu của checkpoint này không còn cần thiết cho recovery và có thể bị xoá. Tiến trình checkpointer thực hiện việc này theo từng bước: đánh dấu (tag) các buffer đang dirty tại thời điểm bắt đầu, rồi lần lượt ghi chúng xuống đĩa, và chỉ khi tất cả các buffer đã đánh dấu được ghi xong, checkpoint mới được coi là hoàn tất — lúc đó file pg_control mới được cập nhật để trỏ tới checkpoint mới này. Khi server khởi động lại sau sự cố, tiến trình startup đọc pg_control để lấy LSN bắt đầu (REDO location) của checkpoint hoàn tất gần nhất, rồi đọc và phát lại các mục WAL từ vị trí đó theo chiều tiến, chỉ áp dụng những mục có LSN lớn hơn LSN đã lưu trong page tương ứng — vì WAL được thiết kế để phát lại tuần tự nghiêm ngặt, không được áp dụng một mục có LSN nhỏ hơn LSN hiện tại của page.",
    redFlags: [
      "Nghĩ rằng recovery luôn bắt đầu lại từ đầu file WAL",
      "Cho rằng ghi WAL và ghi page dữ liệu có thể theo thứ tự bất kỳ miễn cả hai đều xong trước khi transaction coi là an toàn",
      "Nhầm checkpoint là thời điểm dữ liệu được coi là consistent ngay khi nó bắt đầu, thay vì khi nó hoàn tất",
    ],
    probes: [
      "Vì sao ghi tuần tự WAL rẻ hơn ghi ngẫu nhiên các page?",
      "File nào lưu vị trí checkpoint hoàn tất gần nhất, và trường nào chứa REDO location?",
      "Điều gì xảy ra nếu recovery bắt đầu từ một điểm quá muộn?",
    ],
    refs: ["pg-10"],
  },
  {
    id: "pg-iq10",
    field: "pg-internals",
    topic: "pg-wal",
    level: 2,
    minutes: 8,
    code: {
      lang: "sql",
      text: `-- Ngay sau một checkpoint lớn
=> CHECKPOINT;
=> SELECT pg_current_wal_lsn();
 pg_current_wal_lsn
---------------------
 0/5A001000

=> UPDATE accounts SET amount = amount - 50 WHERE id = 1;
=> SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/5A001000');
 pg_wal_lsn_diff
------------------
             8236

-- Lặp lại cùng UPDATE trên cùng dòng, không CHECKPOINT ở giữa
=> SELECT pg_current_wal_lsn();
 pg_current_wal_lsn
---------------------
 0/5A003040

=> UPDATE accounts SET amount = amount - 50 WHERE id = 1;
=> SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/5A003040');
 pg_wal_lsn_diff
------------------
              108`,
    },
    question:
      "Đo lượng WAL do từng câu UPDATE tạo ra bằng pg_current_wal_lsn() và pg_wal_lsn_diff. Lần UPDATE đầu tiên (ngay sau CHECKPOINT) tạo ra 8.236 byte WAL, còn lần UPDATE thứ hai trên cùng dòng chỉ tạo 108 byte. Giải thích chênh lệch, và cho biết điều gì sẽ khiến hai lần UPDATE tiếp theo cũng nặng như lần đầu.",
    mustCover: [
      "Để tránh áp dụng một WAL record thông thường lên một page có thể chỉ được ghi một phần khi crash, PostgreSQL ghi một full page image (FPI) vào WAL ở lần sửa đổi ĐẦU TIÊN của một page kể từ khi checkpoint hiện tại bắt đầu",
      "UPDATE đầu tiên xảy ra ngay sau CHECKPOINT, page của dòng đó chưa có FPI nào trong chu kỳ mới, nên WAL record của nó phải kèm gần như toàn bộ ảnh trang — lớn hơn hẳn một WAL record thông thường",
      "UPDATE thứ hai trên cùng dòng, cùng page, xảy ra trong cùng chu kỳ checkpoint nên page đã có FPI rồi — WAL record chỉ cần ghi phần thay đổi nhỏ, nên nhẹ hơn nhiều",
      "full_page_writes (mặc định on) là tham số kiểm soát hành vi này; tắt nó có thể giảm WAL nhưng có nguy cơ hỏng dữ liệu nghiêm trọng khi ghi không nguyên tử xảy ra lúc crash",
      "Một CHECKPOINT mới (theo lịch checkpoint_timeout hoặc do vượt max_wal_size) sẽ khiến lần sửa đổi tiếp theo trên page đó lại phải ghi FPI một lần nữa, nên WAL lại nặng như lần đầu",
    ],
    model:
      "Sự chênh lệch tới hai bậc độ lớn giữa hai lần UPDATE (8.236 byte so với 108 byte) không liên quan gì tới bản thân câu lệnh UPDATE — cả hai đều sửa cùng một dòng theo cùng một cách. Nguyên nhân nằm ở quy tắc full page image: để tránh tình huống một WAL record thông thường (chỉ mô tả phần thay đổi nhỏ trong page) bị áp dụng lên một page có thể đã bị ghi DỞ (torn page) nếu crash xảy ra giữa lúc ghi, PostgreSQL ghi kèm một bản sao toàn bộ nội dung page — full page image, FPI — vào WAL ngay lần sửa đổi ĐẦU TIÊN của page đó kể từ khi checkpoint hiện tại bắt đầu. Vì tôi vừa chạy CHECKPOINT ngay trước UPDATE đầu tiên, page chứa dòng đó chưa có FPI nào trong chu kỳ checkpoint mới, nên WAL record của UPDATE này phải cõng theo gần như toàn bộ nội dung page (khoảng 8 kB, trừ phần không gian trống được loại khỏi FPI) — đó là lý do nó nặng tới 8.236 byte. UPDATE thứ hai, dù sửa đúng dòng đó, xảy ra trong CÙNG chu kỳ checkpoint, nên page đã có FPI rồi; PostgreSQL chỉ cần ghi một WAL record thông thường mô tả phần thay đổi, nên kích thước rơi xuống mức vài trăm byte — khớp với 108 byte quan sát được. Hai lần UPDATE tiếp theo sẽ lại nặng như lần đầu nếu một checkpoint MỚI xảy ra ở giữa — dù đó là checkpoint theo lịch (khi chạm checkpoint_timeout) hay checkpoint bị kích hoạt sớm vì WAL sinh ra vượt max_wal_size — vì bất kỳ checkpoint mới nào cũng đặt lại yêu cầu 'lần sửa đầu tiên sau checkpoint phải kèm FPI' cho mọi page. Tham số kiểm soát toàn bộ cơ chế này là full_page_writes (mặc định on); tắt nó có thể giảm đáng kể dung lượng WAL — trong một benchmark thực tế, FPI có thể chiếm hơn một nửa tổng WAL sinh ra — nhưng đổi lại là nguy cơ hỏng dữ liệu nghiêm trọng nếu một page thực sự bị ghi không nguyên tử lúc crash, nên gần như không nên tắt trong production. Nếu muốn giảm chi phí mà vẫn an toàn, cách đúng là bật wal_compression để nén các FPI, hoặc kéo dài checkpoint_timeout/tăng max_wal_size để checkpoint xảy ra thưa hơn, giảm số lần mỗi page phải trả 'phí FPI' lặp lại.",
    redFlags: [
      "Cho rằng WAL luôn có kích thước cố định cho mỗi UPDATE bất kể trạng thái checkpoint",
      "Đề xuất tắt full_page_writes để giảm dung lượng WAL mà không nhắc tới rủi ro ghi không nguyên tử",
      "Nhầm FPI là do dòng bị TOAST hoặc do index cập nhật, thay vì do quy tắc lần sửa đầu tiên sau checkpoint",
    ],
    probes: [
      "wal_compression giúp gì cho tình huống này?",
      "Nếu tăng checkpoint_timeout, tần suất xuất hiện FPI thay đổi ra sao?",
      "full_page_writes tắt thì rủi ro gì xảy ra khi crash giữa lúc ghi page?",
    ],
    refs: ["pg-10", "pg-11"],
  },
  {
    id: "pg-iq11",
    field: "pg-internals",
    topic: "pg-wal",
    level: 3,
    minutes: 10,
    question:
      "So sánh ba lựa chọn cấu hình synchronous_commit, fsync và full_page_writes: cái gì có thể mất khi crash ở mỗi lựa chọn, và cái gì đổi lại được về độ trễ/thông lượng?",
    tradeoffs: [
      {
        option: "synchronous_commit = on (mặc định) hoặc off",
        when: "on: COMMIT chỉ trả quyền điều khiển sau khi mọi WAL entry của transaction đã được đồng bộ xuống đĩa — durability đầy đủ nhưng độ trễ commit cao; off: COMMIT trả về ngay, WAL được walwriter ghi và đồng bộ sau (mặc định wal_writer_delay 200ms) — nhanh hơn và thông lượng OLTP cao hơn hẳn, đổi lại có thể mất các transaction đã commit trong khoảng khoảng 3 × wal_writer_delay nếu crash xảy ra trước khi WAL được flush; đặt được riêng theo từng transaction.",
      },
      {
        option: "fsync = on (mặc định) hoặc off",
        when: "on: mọi lần đồng bộ WAL và các thao tác cần bền vững khác thực sự gọi lệnh đồng bộ hoá xuống thiết bị lưu trữ; off: các lệnh ghi trông như hoàn tất nhanh hơn, nhưng bất kỳ sự cố nào cũng có nguy cơ hỏng dữ liệu nghiêm trọng vì thứ tự ghi thật xuống đĩa không còn được đảm bảo khớp với thứ tự WAL — không chỉ mất vài giao dịch gần nhất.",
      },
      {
        option: "full_page_writes = on (mặc định) hoặc off",
        when: "on: lần sửa đổi đầu tiên của mỗi page sau khi checkpoint bắt đầu được ghi kèm một full page image, cho phép recovery phục hồi đúng ngay cả khi page bị ghi dở lúc crash — cái giá là WAL sinh ra lớn hơn đáng kể; off: WAL nhẹ hơn nhiều, nhưng nếu một page bị ghi không nguyên tử ngay trước khi crash, việc áp WAL record thông thường lên phần page hỏng có thể tạo ra dữ liệu sai mà không phát hiện được.",
      },
    ],
    mustCover: [
      "synchronous_commit=off chỉ trì hoãn việc flush WAL — cửa sổ mất dữ liệu bị giới hạn bằng khoảng vài trăm mili giây (khoảng 3 × wal_writer_delay), và dữ liệu vẫn phục hồi về trạng thái NHẤT QUÁN sau crash, chỉ mất vài giao dịch gần nhất",
      "fsync=off khác về chất so với synchronous_commit=off: nó loại bỏ hẳn đảm bảo thứ tự ghi thật xuống thiết bị lưu trữ, nên sự cố có thể phá vỡ tính nhất quán ở mức nghiêm trọng hơn nhiều, không chỉ mất vài commit gần nhất",
      "full_page_writes bảo vệ khỏi torn page (ghi không nguyên tử) chứ không liên quan gì tới việc mất giao dịch do trễ flush — tắt nó là một đánh đổi hoàn toàn khác",
      "Cả ba tham số độc lập với nhau: có thể giữ fsync=on và full_page_writes=on trong khi chỉ tắt synchronous_commit để tăng thông lượng OLTP mà chấp nhận rủi ro nhỏ, có giới hạn thời gian",
      "synchronous_commit có thể đặt theo từng transaction/session, còn fsync và full_page_writes là tham số toàn cục ảnh hưởng mọi transaction",
    ],
    model:
      "Ba tham số này bảo vệ ba thứ khác nhau, nên rủi ro khi tắt mỗi cái cũng khác nhau về CHẤT chứ không chỉ về mức độ. synchronous_commit (mặc định on) chỉ quyết định COMMIT có phải CHỜ WAL được đồng bộ xuống đĩa hay không. Ở chế độ on, COMMIT không trả quyền điều khiển cho tới khi mọi WAL entry của transaction — kể cả entry COMMIT — đã được flush và đồng bộ thật sự, nên tính bền vững được đảm bảo đầy đủ ngay khi ứng dụng nhận phản hồi thành công; cái giá là mỗi commit tốn một lần đồng bộ hoá thực sự, độ trễ cao hơn hẳn. Tắt nó, COMMIT trả về ngay lập tức, còn tiến trình walwriter ghi và đồng bộ WAL sau đó theo chu kỳ (mặc định wal_writer_delay 200ms); một benchmark thực tế cho thấy TPS có thể tăng gấp ba trong khi độ trễ trung bình giảm mạnh. Đổi lại, nếu crash xảy ra trước khi WAL của một transaction kịp flush, transaction đó — dù ứng dụng đã nhận phản hồi 'đã commit' — có thể biến mất sau recovery; cửa sổ mất mát này bị giới hạn khá chặt, khoảng 3 × wal_writer_delay (mặc định chưa tới một giây), và quan trọng là dữ liệu vẫn phục hồi về một trạng thái NHẤT QUÁN, chỉ thiếu vài giao dịch gần nhất — đây cũng là tham số duy nhất trong ba cái có thể đặt riêng theo từng transaction. fsync (mặc định on) là chuyện hoàn toàn khác về chất: nó quyết định các thao tác cần bền vững (đồng bộ WAL, flush dữ liệu lúc checkpoint, các thao tác file) có thực sự gọi lệnh đồng bộ hoá xuống thiết bị lưu trữ hay không. Tắt fsync không chỉ trì hoãn — nó loại bỏ hẳn đảm bảo về THỨ TỰ dữ liệu thực sự chạm tới đĩa, nên một sự cố có thể để lại một cluster không nhất quán ở mức nghiêm trọng hơn nhiều so với 'mất vài giao dịch gần nhất': có thể là dữ liệu hỏng không thể phục hồi được bằng recovery thông thường. full_page_writes (mặc định on) lại bảo vệ một thứ thứ ba, không liên quan gì tới việc mất giao dịch do trễ: nó đảm bảo lần sửa đổi đầu tiên của mỗi page sau khi checkpoint bắt đầu được kèm một full page image, để recovery vẫn phục hồi đúng ngay cả khi chính page đó bị ghi DỞ (torn page) lúc crash — vì việc ghi vật lý xảy ra theo block nhỏ hơn kích thước page. Tắt nó giảm WAL đáng kể, nhưng nếu một torn page thực sự xảy ra đúng lúc crash, việc áp một WAL record thông thường lên phần page hỏng có thể tạo ra dữ liệu sai mà không hề được phát hiện — nguy cơ này không giới hạn theo thời gian như synchronous_commit=off, nó phụ thuộc việc torn page có xảy ra hay không. Vì cả ba độc lập với nhau, lựa chọn thực tế của tôi thường là giữ fsync=on và full_page_writes=on làm nền tảng an toàn, rồi chỉ cân nhắc tắt synchronous_commit cho các transaction ít quan trọng (ví dụ ghi log sự kiện) để đổi lấy thông lượng, trong khi giữ nguyên on cho các transaction tài chính.",
    redFlags: [
      "Coi ba tham số này tương đương nhau về mức độ rủi ro khi tắt",
      "Nghĩ tắt fsync chỉ mất vài giao dịch gần nhất giống synchronous_commit=off",
      "Đề xuất tắt full_page_writes để tăng tốc mà không nhắc tới nguy cơ torn page",
    ],
    probes: [
      "Vì sao synchronous_commit=off vẫn giữ được tính nhất quán sau crash còn fsync=off thì không?",
      "wal_compression liên quan thế nào tới chi phí của full_page_writes=on?",
      "Khi nào nên đặt synchronous_commit=off cho một transaction cụ thể?",
    ],
    refs: ["pg-11"],
  },
  {
    id: "pg-iq12",
    field: "pg-internals",
    topic: "pg-wal",
    level: 4,
    minutes: 14,
    incident: {
      symptom:
        "Độ trễ ghi của ứng dụng tăng vọt theo chu kỳ vài phút một lần, kéo dài vài giây rồi trở lại bình thường. Trong log server xuất hiện liên tục cảnh báo dạng checkpoint được thực hiện thường xuyên hơn mức cấu hình cho phép. Chỉ số I/O của ổ đĩa chứa dữ liệu bão hoà đúng vào các đợt tăng vọt đó.",
      scale:
        "Hệ thống OLTP ghi khoảng 8.000 UPDATE/giây liên tục suốt giờ hành chính. max_wal_size vẫn ở giá trị mặc định, checkpoint_timeout đã được tăng lên 30 phút theo khuyến nghị chung nhưng chưa ai chỉnh max_wal_size theo tải thực tế. shared_buffers được cấp 8GB.",
      constraints:
        "Không thể giảm tải ghi của ứng dụng trong ngắn hạn. Đổi checkpoint_timeout/max_wal_size chỉ cần reload chứ không cần khởi động lại server, nhưng đội muốn hiểu rõ cơ chế trước khi chỉnh để tránh chỉnh ngược hướng. Phải có số liệu để biện minh giá trị mới trước khi áp dụng lên production.",
    },
    question:
      "I/O bão hoà theo chu kỳ vài phút và log cảnh báo checkpoint xảy ra quá thường xuyên. Chẩn đoán nguyên nhân, giải thích cơ chế gây ra đợt tăng vọt độ trễ, và nêu cách xác định giá trị max_wal_size phù hợp.",
    mustCover: [
      "Cảnh báo checkpoint được thực hiện thường xuyên hơn mức cấu hình xuất hiện khi checkpoint bị kích hoạt theo kích thước (vượt max_wal_size) dồn dập hơn ngưỡng checkpoint_warning, chứ không phải theo lịch checkpoint_timeout — với tải ghi cao và max_wal_size mặc định nhỏ, WAL vượt ngưỡng rất nhanh dù checkpoint_timeout đã tăng lên 30 phút",
      "Mỗi lần checkpoint mới bắt đầu, thẻ dirty được đặt lại cho các buffer, nên lần sửa đổi kế tiếp trên mỗi page lại phải ghi một full page image mới vào WAL — checkpoint càng dồn dập, tỷ lệ FPI trong WAL càng cao, khuếch đại thêm khối lượng ghi",
      "Trong giai đoạn thực thi checkpoint, checkpointer ghi toàn bộ dirty buffer được đánh dấu tại thời điểm bắt đầu xuống đĩa — nếu nhiều checkpoint dồn sát nhau về thời điểm, lượng I/O ghi dồn vào cùng một khoảng ngắn thay vì trải đều, gây bão hoà đĩa và độ trễ tăng vọt",
      "Nếu shared_buffers không đủ lớn so với working set, các backend cũng phải tự ghi buffer bẩn xuống đĩa mỗi khi cần evict để đọc page mới — cộng dồn cùng lúc với đợt ghi của checkpointer làm bão hoà I/O nặng hơn, nên nên đối chiếu buffers_backend với tổng buffers_checkpoint + buffers_clean trong pg_stat_bgwriter",
      "Cách xác định max_wal_size phù hợp: đo tốc độ sinh WAL thực tế ở tải bình thường (chênh lệch LSN theo thời gian), nhân với 1 + checkpoint_completion_target để ước lượng dung lượng WAL cần giữ giữa các checkpoint, rồi đặt max_wal_size theo con số đó thay vì theo cảm tính",
      "Nên đối chiếu checkpoints_timed với checkpoints_req trong pg_stat_bgwriter: checkpoints_req cao bất thường so với checkpoints_timed xác nhận checkpoint đang bị kích hoạt theo kích thước WAL thay vì theo lịch, khớp với log cảnh báo",
    ],
    model:
      "Cảnh báo 'checkpoint được thực hiện thường xuyên hơn mức cấu hình cho phép' chỉ xuất hiện khi checkpoint bị kích hoạt theo KÍCH THƯỚC — tức WAL sinh ra vượt max_wal_size — dồn dập hơn ngưỡng checkpoint_warning, chứ không phải theo lịch checkpoint_timeout. Với 8.000 UPDATE/giây liên tục và max_wal_size vẫn ở giá trị mặc định 1GB, lượng WAL sinh ra vượt ngưỡng này rất nhanh, nên dù checkpoint_timeout đã được kéo lên 30 phút, checkpoint thực tế vẫn bị ép chạy dồn dập theo kích thước — đúng như log đang báo. Đây là cơ chế gây ra đợt tăng vọt độ trễ theo chu kỳ: mỗi lần một checkpoint MỚI bắt đầu, thẻ dirty trên các buffer được đặt lại, nên lần sửa đổi kế tiếp trên mỗi page lại phải ghi một full page image mới vào WAL — checkpoint càng dồn dập thì tỷ lệ FPI trong tổng WAL càng cao, khuếch đại thêm khối lượng ghi đúng vào những thời điểm checkpoint cũng đang chạy. Trong giai đoạn thực thi, chính checkpointer phải ghi toàn bộ các buffer đã được đánh dấu dirty tại thời điểm bắt đầu xuống đĩa; nếu các checkpoint xảy ra sát nhau về thời gian, lượng I/O ghi của chúng dồn vào cùng một khoảng ngắn thay vì trải đều, gây bão hoà đĩa và độ trễ tăng vọt cho mọi ghi khác của ứng dụng — đúng với hiện tượng quan sát được. Một yếu tố cộng hưởng khác đáng kiểm tra: nếu shared_buffers (ở đây 8GB) không đủ lớn so với working set thực tế, các backend cũng phải tự ghi buffer bẩn xuống đĩa mỗi khi cần một buffer để đọc page mới vào — cộng dồn đúng lúc checkpointer cũng đang ghi hàng loạt sẽ làm I/O bão hoà nặng hơn nữa; tôi sẽ đối chiếu buffers_backend với tổng buffers_checkpoint + buffers_clean trong pg_stat_bgwriter để biết backend có đang phải tự ghi nhiều bất thường hay không. Để xác nhận toàn bộ chẩn đoán trước khi đổi cấu hình, tôi so sánh checkpoints_timed với checkpoints_req trong cùng view: checkpoints_req cao vượt trội so với checkpoints_timed xác nhận chắc chắn checkpoint đang bị kích hoạt theo kích thước WAL chứ không theo lịch, khớp với log cảnh báo. Để chọn max_wal_size mới có căn cứ thay vì đoán, tôi đo tốc độ sinh WAL thực tế ở tải bình thường bằng cách ghi lại LSN hiện tại, đợi một khoảng thời gian đại diện, rồi tính hiệu LSN; nhân con số đó (quy đổi ra kích thước cho khoảng thời gian bằng checkpoint_timeout mong muốn) với 1 + checkpoint_completion_target để ước lượng dung lượng WAL cần giữ giữa các checkpoint — đó chính là giá trị tôi đặt cho max_wal_size, thay vì tăng bừa lên một con số tròn.",
    redFlags: [
      "Kết luận ngay là do shared_buffers quá nhỏ mà không kiểm tra pg_stat_bgwriter hoặc log checkpoint",
      "Tăng checkpoint_timeout thêm nữa mà không đụng tới max_wal_size, trong khi nguyên nhân là checkpoint bị kích hoạt theo kích thước",
      "Đề xuất tắt full_page_writes để giảm I/O mà không nhắc tới nguy cơ torn page khi crash",
      "Không phân biệt được checkpoints_timed và checkpoints_req khi đọc pg_stat_bgwriter",
    ],
    probes: [
      "Công thức nào ước lượng max_wal_size cần thiết từ tốc độ sinh WAL đo được?",
      "checkpoint_completion_target ảnh hưởng thế nào tới việc chọn max_wal_size?",
      "Vì sao checkpoint dồn dập lại làm tăng tỷ lệ full page image trong WAL?",
    ],
    refs: ["pg-10", "pg-09"],
  },
];
