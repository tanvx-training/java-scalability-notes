// Ngân hàng câu hỏi phỏng vấn PostgreSQL 14 Internals — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
//
// Nguồn: bản dịch tiếng Việt PostgreSQL 14 Internals (Egor Rogov, Postgres Professional 2023)
// — 31 tài liệu trong sources/pg-internals/.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng DDIA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (pg-iq01–pg-iq24) — tiến độ localStorage lưu theo id này.

export const pgInternalsInterview = [
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

  // ===== pg-lock (pg-iq13–pg-iq16) =====
  {
    id: "pg-iq13",
    field: "pg-internals",
    topic: "pg-lock",
    level: 1,
    minutes: 5,
    question:
      "Lock ở mức relation trong PostgreSQL có tới tám mode. Giải thích vì sao một SELECT đang chạy không chặn được một UPDATE trên cùng bảng, nhưng một ALTER TABLE lại có thể chặn được mọi thao tác khác — kể cả SELECT. Nêu tên vài mode và ví dụ lệnh SQL lấy chúng.",
    mustCover: [
      "SELECT lấy Access Share — mode yếu nhất trong tám mode, tương thích với mọi mode khác ngoại trừ Access Exclusive",
      "INSERT, UPDATE, DELETE lấy Row Exclusive — mode này tương thích với Access Share (và với chính nó), nên một UPDATE hoàn toàn có thể chạy song song với một SELECT đang đọc cùng bảng",
      "Phần lớn các biến thể phổ biến của ALTER TABLE (ví dụ đổi kiểu một cột, xoá một cột) đòi hỏi Access Exclusive — mode duy nhất không tương thích với TẤT CẢ các mode khác kể cả Access Share, nên nó chặn cả đọc lẫn ghi",
      "Một số lệnh khác dùng mode nhẹ hơn nhiều: CREATE INDEX CONCURRENTLY và VACUUM thường dùng Share Update Exclusive, CREATE INDEX dùng Share — các mode này vẫn cho phép một số thao tác đồng thời thay vì chặn tuyệt đối",
      "Granularity thô của lock mức relation là đánh đổi có chủ đích: nó chặn đồng thời cả bảng bất kể phần nào bị đụng tới, đổi lại chi phí quản lý rẻ hơn hẳn so với việc theo dõi lock cho từng dòng riêng lẻ",
    ],
    model:
      "PostgreSQL cung cấp tám mode khoá relation chính xác để tối đa hoá số lệnh có thể chạy đồng thời trên cùng một bảng, và câu trả lời nằm trọn trong ma trận tương thích của chúng chứ không phải trong ý nghĩa từng cái tên. SELECT lấy mode Access Share — mode yếu nhất trong cả tám, tương thích với mọi mode khác ngoại trừ đúng một mode duy nhất là Access Exclusive. UPDATE (cùng với INSERT, DELETE) lấy mode Row Exclusive, và mode này tương thích với Access Share cũng như với chính nó, nên một UPDATE hoàn toàn có thể chạy song song với một hoặc nhiều SELECT đang đọc cùng bảng — đó là lý do một SELECT không chặn được một UPDATE. Ngược lại, phần lớn các biến thể phổ biến của ALTER TABLE — đổi kiểu một cột, xoá một cột, thêm ràng buộc mới — đòi hỏi mode Access Exclusive, mode DUY NHẤT trong tám mode không tương thích với bất kỳ mode nào khác, kể cả Access Share yếu ớt của SELECT. Vì vậy một ALTER TABLE như vậy phải chờ mọi giao dịch khác trên bảng kết thúc trước khi được cấp lock, và ngược lại, nó chặn mọi SELECT/UPDATE/DELETE mới tới sau. Không phải mọi ALTER TABLE đều nặng như nhau: một số lệnh dùng mode nhẹ hơn hẳn, ví dụ VACUUM (không FULL) và CREATE INDEX CONCURRENTLY chỉ cần Share Update Exclusive, cho phép các cập nhật dữ liệu bình thường tiếp tục chạy; CREATE INDEX (không CONCURRENTLY) dùng Share, tương thích với chính nó (nên tạo nhiều index song song được) và với các thao tác chỉ đọc, nhưng chặn INSERT/UPDATE/DELETE. Tất cả những khác biệt này bắt nguồn từ một thiết kế nhất quán: granularity của lock mức relation vốn thô — nó chặn cả bảng bất kể thao tác chỉ đụng tới một phần nhỏ của bảng — nhưng đổi lại, chi phí duy trì chỉ tám mode với hạ tầng wait queue chung rẻ hơn nhiều so với việc phải theo dõi lock riêng cho từng dòng ở mức bộ nhớ.",
    redFlags: [
      "Nghĩ rằng SELECT và UPDATE luôn tương thích bất kể bảng đang bị khoá ở mode nào",
      "Cho rằng mọi biến thể của ALTER TABLE đều dùng cùng một mode khoá như nhau",
      "Không phân biệt được Row Exclusive (ghi dữ liệu) với Access Exclusive (đổi cấu trúc bảng)",
    ],
    probes: [
      "Vì sao CREATE INDEX CONCURRENTLY chọn Share Update Exclusive thay vì Share?",
      "Kể tên một lệnh khác ngoài ALTER TABLE cũng cần Access Exclusive",
      "SELECT ... FOR UPDATE lấy mode nào ở mức relation, khác gì với SELECT thường?",
    ],
    refs: ["pg-12"],
  },
  {
    id: "pg-iq14",
    field: "pg-internals",
    topic: "pg-lock",
    level: 2,
    minutes: 8,
    code: {
      lang: "sql",
      text: `-- Phiên 1 (pid 30723)                    -- Phiên 2 (pid 30794)
BEGIN;
UPDATE customers SET note = 'VIP'
  WHERE id = 42;

                                           BEGIN;
                                           INSERT INTO orders(customer_id, item)
                                             VALUES (42, 'Ghế văn phòng');

=> SELECT locktype, pid, mode, granted
FROM pg_locks
WHERE relation = 'customers'::regclass
ORDER BY pid;
 locktype |  pid  |       mode        | granted
----------+-------+-------------------+---------
 relation | 30723 | RowExclusiveLock  | t
 relation | 30794 | RowExclusiveLock  | t
(2 rows)
-- Không dòng nào có granted = f: cả hai phiên đều được cấp lock ngay,
-- pg_locks không cho thấy bất kỳ tranh chấp nào ở mức dòng.

=> SELECT locked_row, locker, multi, modes
FROM pgrowlocks('customers')
WHERE locked_row = '(0,7)';
 locked_row | locker | multi |              modes
------------+--------+-------+----------------------------------
 (0,7)      |    901 | t     | {"No Key Update","Key Share"}
(1 row)`,
    },
    question:
      "Bảng orders có foreign key orders.customer_id → customers.id. Phiên 1 UPDATE một dòng customers chỉ sửa cột note (không đụng khoá), phiên 2 INSERT một dòng orders mới tham chiếu tới đúng customer đó. Đọc output pg_locks và pgrowlocks ở trên, giải thích vì sao hai phiên không chặn nhau, và vai trò của No Key Update cùng Key Share trong đó.",
    mustCover: [
      "UPDATE ở phiên 1 chỉ sửa cột note, không phải cột nằm trong bất kỳ unique index nào của customers, nên PostgreSQL tự động chọn mode lock mức dòng yếu nhất có thể là No Key Update thay vì Update",
      "INSERT một dòng orders tham chiếu foreign key buộc PostgreSQL kiểm tra dòng cha còn tồn tại, và việc kiểm tra này lấy lock mức dòng Key Share trên dòng customers — đây là mode chia sẻ DUY NHẤT mà lõi PostgreSQL tự dùng",
      "Theo ma trận tương thích của bốn mode lock mức dòng, No Key Update và Key Share TƯƠNG THÍCH với nhau, nên hai phiên cùng đụng một dòng mà không chặn nhau",
      "pg_locks không hiển thị dòng nào granted = f vì lock mức dòng không phải heavyweight lock thật sự — nó chỉ là thuộc tính trong trường xmax và hint bit của heap tuple, hoàn toàn không được phản ánh trong shared memory; phải dùng pgrowlocks hoặc pageinspect mới thấy cả hai mode cùng tồn tại qua một multixact",
      "Nếu UPDATE ở phiên 1 sửa luôn cột nằm trong unique index của customers, nó sẽ phải chọn mode Update thay vì No Key Update — và Update không tương thích với Key Share, nên khi đó phiên 2 sẽ phải chờ",
    ],
    model:
      "Cả hai phiên đều đụng tới cùng một dòng của customers nhưng không chặn nhau, và lời giải thích nằm ở việc PostgreSQL không lúc nào cũng chọn mode lock mức dòng nặng nhất có thể. UPDATE ở phiên 1 chỉ sửa cột note — cột này không nằm trong bất kỳ unique index nào của customers — nên PostgreSQL tự động chọn mode yếu nhất có thể cho lệnh UPDATE, đó là No Key Update, thay vì mode Update đầy đủ. Về phía phiên 2, việc INSERT một dòng orders có customer_id tham chiếu tới customers buộc PostgreSQL phải kiểm tra ràng buộc referential integrity: dòng cha customers.id = 42 phải còn tồn tại. Để làm việc này an toàn dưới điều kiện đồng thời, PostgreSQL lấy một lock mức dòng ở mode Key Share trên chính dòng cha đó — và đây là mode chia sẻ DUY NHẤT mà lõi PostgreSQL tự dùng ở bất kỳ đâu, luôn luôn cho mục đích kiểm tra foreign key. Chìa khoá để hai phiên không chặn nhau nằm ở ma trận tương thích bốn mode lock mức dòng: No Key Update tương thích với Key Share (chỉ không tương thích với Share, với chính nó, và với Update), nên việc phiên 1 giữ No Key Update không hề cản trở phiên 2 lấy Key Share trên cùng dòng. Điều thú vị hơn là cách quan sát: pg_locks hoàn toàn không hiển thị dòng nào có granted = f, vì lock mức dòng trong PostgreSQL không phải là heavyweight lock thật sự nằm trong shared memory — nó chỉ là một thuộc tính được ghi vào trường xmax cùng vài hint bit ngay trong header của heap tuple, và không hề được phản ánh trong RAM dưới bất kỳ hình thức nào. Muốn thấy cả hai mode cùng tồn tại trên một dòng, phải tra trực tiếp heap tuple qua pgrowlocks (hoặc pageinspect): kết quả cho thấy một multixact (locker = 901, multi = t) gộp cả No Key Update lẫn Key Share, đúng như dự đoán từ ma trận tương thích. Nếu kịch bản đổi một chút — UPDATE ở phiên 1 sửa luôn một cột thuộc unique index của customers — PostgreSQL buộc phải chọn mode Update đầy đủ thay vì No Key Update, và vì Update không tương thích với bất kỳ mode nào khác kể cả Key Share, phiên 2 khi đó sẽ phải chờ phiên 1 hoàn tất mới lấy được lock để hoàn thành việc kiểm tra foreign key.",
    redFlags: [
      "Cho rằng mọi UPDATE luôn lấy mode lock mức dòng Update bất kể cột nào bị sửa",
      "Nghĩ pg_locks sẽ hiển thị một dòng granted = f nếu có tranh chấp ở mức dòng",
      "Không biết Key Share là mode duy nhất lõi PostgreSQL tự dùng để kiểm tra foreign key",
    ],
    probes: [
      "Nếu UPDATE ở phiên 1 sửa luôn cột id (khoá chính) của customers thì mode lock đổi thành gì?",
      "Vì sao lock mức dòng không cần một cấu trúc dữ liệu riêng trong shared memory?",
      "Kể một mode lock mức dòng khác ngoài No Key Update và Key Share, và khi nào ứng dụng nên tự dùng nó",
    ],
    refs: ["pg-13"],
  },
  {
    id: "pg-iq15",
    field: "pg-internals",
    topic: "pg-lock",
    level: 3,
    minutes: 11,
    question:
      "Bạn xây một hàng đợi job trong một bảng PostgreSQL thường: nhiều worker cùng lấy một dòng 'sẵn sàng', xử lý, rồi đánh dấu hoàn tất. Có bốn cách khoá dòng đang được xử lý: SELECT ... FOR UPDATE thường, FOR UPDATE SKIP LOCKED, advisory lock, và chuyển toàn bộ transaction sang Serializable. So sánh đánh đổi giữa bốn cách này.",
    tradeoffs: [
      {
        option: "SELECT ... FOR UPDATE (thường)",
        when: "Đơn giản và đúng theo nghĩa 'khoá dòng khi đọc để xử lý', nhưng nếu nhiều worker cùng chạy một truy vấn kiểu ORDER BY id LIMIT 1 để lấy dòng sẵn sàng, chúng sẽ xếp hàng chờ đúng MỘT dòng đang bị worker đầu tiên khoá — dù có hàng trăm dòng sẵn sàng khác đang chờ, cả hàng đợi vô tình biến thành xử lý tuần tự.",
      },
      {
        option: "SELECT ... FOR UPDATE SKIP LOCKED",
        when: "Đúng cơ chế được thiết kế cho hàng đợi job: mỗi worker bỏ qua các dòng đã bị worker khác khoá và lấy ngay dòng sẵn sàng tiếp theo, cho phép nhiều worker xử lý song song thật sự; đổi lại không có bảo đảm thứ tự xử lý nghiêm ngặt, và nếu worker crash giữa chừng, dòng vẫn bị khoá cho tới khi transaction của nó kết thúc hoặc bị huỷ.",
      },
      {
        option: "Advisory lock",
        when: "Hữu ích khi cần khoá một tài nguyên trừu tượng không tương ứng đúng một dòng cụ thể — ví dụ khoá theo loại job để giới hạn số worker xử lý song song một loại — hoặc cần giữ khoá xuyên suốt phiên chứ không chỉ trong một transaction; đổi lại toàn bộ giao thức khoá (sinh id, gọi lock, gọi unlock) do ứng dụng tự quản lý, không có gì tự động ngăn một worker quên giải phóng lock hoặc dùng sai thứ tự khoá.",
      },
      {
        option: "Serializable",
        when: "Muốn PostgreSQL tự phát hiện mọi tranh chấp đọc/ghi nguy hiểm giữa các worker mà không phải tự nghĩ ra logic khoá tường minh; đổi lại chi phí theo dõi phụ thuộc làm giảm thông lượng, ứng dụng phải retry mọi transaction bị abort vì serialization failure, dễ gặp dương tính giả, và không thể trộn với worker chạy ở mức cô lập khác trong cùng hệ thống.",
      },
    ],
    mustCover: [
      "FOR UPDATE thường kết hợp với truy vấn kiểu 'lấy dòng đầu tiên thoả điều kiện' khiến các worker xếp hàng chờ đúng một dòng đang bị khoá thay vì tự do lấy dòng sẵn sàng khác — hàng đợi mất tính song song dù còn nhiều việc để làm",
      "FOR UPDATE SKIP LOCKED giải quyết đúng vấn đề đó: bỏ qua dòng đã bị lock và lấy dòng sẵn sàng tiếp theo, cho phép nhiều worker cùng dequeue song song mà không worker nào phải chờ worker khác xử lý xong",
      "Advisory lock hoàn toàn do ứng dụng quản lý bằng cách sinh id, gọi lock rồi gọi unlock; nó phù hợp khi tài nguyên cần khoá không map một-một với một dòng cụ thể, nhưng thiếu kỷ luật gọi unlock (hoặc quên dùng biến thể theo transaction) sẽ để lại lock treo",
      "Serializable phát hiện tranh chấp qua theo dõi phụ thuộc đọc/ghi xây trên nền snapshot isolation, không dùng predicate lock tường minh, rồi abort bằng serialization failure — đòi hỏi ứng dụng phải retry và chấp nhận giảm thông lượng",
      "Serializable phải áp dụng cho MỌI transaction liên quan tới cùng dữ liệu — trộn với một worker chạy mức cô lập khác sẽ khiến bảo đảm Serializable âm thầm hạ xuống Repeatable Read mà không có lỗi nào báo trước",
    ],
    model:
      "Với một hàng đợi job nhiều worker, tôi loại ngay SELECT ... FOR UPDATE thường nếu nó được viết theo kiểu phổ biến là ORDER BY id LIMIT 1 FOR UPDATE để lấy dòng sẵn sàng đầu tiên. Vấn đề không nằm ở bản thân việc khoá dòng mà ở chỗ nhiều worker cùng chạy đúng truy vấn đó sẽ cùng nhắm tới đúng một dòng đầu tiên: worker thứ nhất khoá được nó, còn mọi worker khác phải xếp hàng chờ đúng dòng đó được giải phóng — dù có hàng trăm dòng sẵn sàng khác trong bảng đang chờ xử lý. Kết quả là một hàng đợi lẽ ra xử lý song song lại vô tình chạy tuần tự. SELECT ... FOR UPDATE SKIP LOCKED sửa đúng lỗ hổng này: khi một worker gặp dòng đã bị khoá bởi worker khác, nó bỏ qua ngay và lấy dòng sẵn sàng tiếp theo, nên nhiều worker có thể cùng dequeue song song thật sự mà không ai phải chờ ai. Cái giá là hàng đợi không còn bảo đảm xử lý đúng theo thứ tự tuyệt đối (một dòng cũ có thể tạm thời bị bỏ qua nếu một worker chậm đang giữ nó), và nếu worker giữ dòng rồi crash giữa chừng mà chưa commit hay rollback, dòng đó vẫn bị khoá cho tới khi transaction của nó thực sự kết thúc — cần có cơ chế timeout hoặc giám sát riêng cho tình huống này. Advisory lock đi theo một hướng khác hẳn: nó không gắn với bất kỳ dòng cụ thể nào, ứng dụng tự sinh một id số nguyên đại diện cho tài nguyên cần khoá — hữu ích nếu tôi cần giới hạn số worker xử lý song song một LOẠI job chứ không phải một dòng, việc mà lock mức dòng không biểu diễn được. Nhưng toàn bộ giao thức — sinh id, gọi lock, và quan trọng nhất là gọi unlock đúng lúc — hoàn toàn do ứng dụng tự quản lý; nếu quên gọi unlock (hoặc không dùng biến thể giữ lock theo transaction), lock có thể bị treo tới khi phiên kết thúc mà không ai hay biết. Serializable là cách tiếp cận triệt để nhất: thay vì tự nghĩ ra logic khoá, tôi để PostgreSQL theo dõi phụ thuộc đọc/ghi giữa các worker (vẫn xây trên nền snapshot isolation, không phải predicate lock tường minh) và tự abort bằng serialization failure bất kỳ cặp transaction nào có nguy cơ vi phạm tuần tự hoá. Đổi lại, ứng dụng phải có logic retry cho mọi transaction bị abort, thông lượng giảm vì chi phí theo dõi phụ thuộc, dương tính giả vẫn có thể xảy ra, và điều quan trọng nhất: bảo đảm này chỉ đúng nếu MỌI transaction liên quan tới cùng dữ liệu đều chạy Serializable — chỉ cần một worker lỡ chạy ở mức khác, cả hệ thống âm thầm mất bảo đảm mà không hề có cảnh báo. Với hàng đợi job thuần tuý, tôi chọn SKIP LOCKED làm mặc định vì nó vừa đơn giản vừa cho song song thật sự; tôi chỉ cân nhắc Serializable khi logic xử lý job phức tạp tới mức khó liệt kê hết mọi tranh chấp cần khoá tường minh.",
    redFlags: [
      "Chọn FOR UPDATE thường cho hàng đợi nhiều worker mà không nhận ra vấn đề cả hàng đợi xếp hàng chờ đúng một dòng",
      "Coi advisory lock là giải pháp không cần kỷ luật gọi unlock",
      "Chọn Serializable mà không nhắc tới chi phí retry hoặc yêu cầu mọi transaction liên quan phải cùng mức cô lập",
    ],
    probes: [
      "Vì sao FOR UPDATE thường lại khiến nhiều worker vô tình xử lý tuần tự?",
      "Điều gì xảy ra với một dòng bị khoá qua SKIP LOCKED nếu worker giữ nó crash giữa chừng?",
      "Trộn một worker chạy Read Committed vào một hệ thống đang dùng Serializable cho các worker khác gây hậu quả gì?",
    ],
    refs: ["pg-13", "pg-14"],
  },
  {
    id: "pg-iq16",
    field: "pg-internals",
    topic: "pg-lock",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Một migration ALTER TABLE ADD COLUMN chạy vào giờ cao điểm bị treo phía sau một truy vấn báo cáo đang chạy dài. Vài phút sau, mọi truy vấn mới tới cùng bảng đó — kể cả SELECT đơn giản — cũng đứng yên không chạy được; connection pool của ứng dụng nhanh chóng cạn kiệt và dịch vụ ngừng đáp ứng trong vài phút.",
      scale:
        "Bảng orders khoảng 40 triệu dòng, phục vụ khoảng 2.000 request/giây vào giờ cao điểm qua connection pool giới hạn 100 kết nối. Truy vấn báo cáo đang chạy là một SELECT tổng hợp mất khoảng 6 phút để hoàn tất. Migration chạy ALTER TABLE orders ADD COLUMN priority integer;.",
      constraints:
        "Không thể huỷ truy vấn báo cáo giữa chừng vì nó phục vụ một dashboard khách hàng đang mở. Migration cần chạy trong giờ làm việc vì đội không có cửa sổ bảo trì riêng. Phải có cách phát hiện và ngăn sự cố này tái diễn mà không cấm hẳn migration vào giờ cao điểm.",
    },
    question:
      "Vì sao một ALTER TABLE đứng sau một SELECT lại kéo theo việc mọi truy vấn đến SAU ĐÓ cũng bị chặn, dù về lý thuyết một SELECT khác hoàn toàn tương thích với thao tác đang chạy trên bảng? Chẩn đoán cơ chế, và nêu việc cần làm ngay lẫn việc cần làm về lâu dài.",
    mustCover: [
      "ALTER TABLE ADD COLUMN cần lock Access Exclusive trên bảng để đổi an toàn cấu trúc catalog và tuple descriptor, và Access Exclusive không tương thích với BẤT KỲ mode nào khác kể cả Access Share mà SELECT báo cáo đang giữ, nên ALTER phải xếp hàng chờ SELECT báo cáo kết thúc",
      "Wait queue của heavyweight lock trong PostgreSQL công bằng theo thứ tự đến chứ không theo mode: một khi ALTER TABLE đã vào hàng đợi chờ Access Exclusive, MỌI request đến sau nó — kể cả một SELECT khác mà Access Share của nó vốn hoàn toàn tương thích với lock hiện tại — cũng phải xếp hàng phía sau ALTER thay vì được cấp ngay",
      "Đây là hệ quả trực tiếp của tính công bằng trong hàng đợi: các request đến sau bị chặn theo THỨ TỰ đến, không được 'chen' qua chỉ vì chúng tương thích với lock đang được giữ",
      "Kết quả: mọi truy vấn mới trên orders đứng yên phía sau ALTER, kết nối trong pool bị giữ ngày càng nhiều cho tới khi cạn hết 100 kết nối, khiến dịch vụ ngừng đáp ứng dù nguyên nhân gốc chỉ là một câu SELECT báo cáo và một câu ALTER TABLE",
      "Việc cần làm ngay: chờ truy vấn báo cáo kết thúc (hoặc chấm dứt nó nếu có thể) để ALTER trôi qua và giải phóng hàng đợi; việc cần làm lâu dài: đặt lock_timeout ngắn cho câu ALTER kèm logic retry để nó thất bại nhanh thay vì xếp hàng vô thời hạn, và kiểm tra pg_stat_activity tìm truy vấn dài đang chạy trước khi thực thi DDL vào giờ cao điểm",
    ],
    model:
      "Điều gây bối rối nhất trong sự cố này — một SELECT tương thích hoàn toàn với các thao tác khác lại vẫn bị chặn — chỉ có thể giải thích được bằng cách nhìn vào chính hàng đợi chờ lock, không phải vào ma trận tương thích một mình. ALTER TABLE orders ADD COLUMN priority integer cần đổi cấu trúc catalog và tuple descriptor của bảng, và để làm việc đó an toàn, PostgreSQL yêu cầu lock Access Exclusive — mode không tương thích với bất kỳ mode nào khác, kể cả Access Share yếu ớt mà truy vấn báo cáo đang giữ. Vì truy vấn báo cáo chưa kết thúc, ALTER TABLE không lấy được lock ngay và phải tham gia hàng đợi chờ. Đến đây mọi thứ vẫn còn hợp lý. Nhưng chi tiết quyết định của sự cố nằm ở cách PostgreSQL vận hành wait queue: nó công bằng theo THỨ TỰ đến, không theo mode lock. Một khi ALTER TABLE đã đứng trong hàng đợi chờ Access Exclusive, mọi request tới bảng orders SAU ĐÓ — kể cả một SELECT khác mà Access Share của nó lẽ ra hoàn toàn tương thích với Access Share mà truy vấn báo cáo đang giữ — cũng buộc phải xếp hàng phía SAU ALTER TABLE, thay vì được cấp lock ngay lập tức chỉ vì nó tương thích với lock hiện có. Nói cách khác, các request không được phép 'chen' qua một request đang chờ, dù chúng có tương thích với trạng thái lock hiện tại đến đâu. Đây chính xác là cơ chế khiến toàn bộ 2.000 request/giây tới bảng orders lần lượt bị dồn ứ ngay sau khi ALTER TABLE bắt đầu chờ, dù nguyên nhân trực tiếp chỉ có đúng một truy vấn báo cáo kéo dài sáu phút. Mỗi truy vấn mới bị chặn vẫn giữ một kết nối trong pool suốt thời gian chờ, nên pool 100 kết nối cạn kiệt trong vài phút, và dịch vụ trông như sập hoàn toàn dù không hề có sự cố về CPU hay I/O. Việc cần làm ngay là chờ (hoặc nếu thực sự cần, chấm dứt) truy vấn báo cáo để ALTER TABLE trôi qua, giải phóng toàn bộ hàng đợi phía sau nó cùng lúc — công cụ đầu tiên tôi dùng để xác nhận đúng chuỗi này là pg_blocking_pids() và pg_stat_activity, tìm chính xác truy vấn nào đang giữ lock mà ALTER đang chờ. Về lâu dài, tôi luôn đặt một lock_timeout ngắn (vài giây) riêng cho câu ALTER TABLE, kèm logic retry ở tầng migration: nếu không lấy được lock trong thời gian đó, ALTER thất bại nhanh và không hề vào hàng đợi, nên nó không thể chặn bất kỳ request nào khác — thất bại một lần rồi thử lại còn tốt hơn nhiều so với việc giữ cả dịch vụ đứng yên vài phút. Song song, tôi kiểm tra pg_stat_activity tìm các truy vấn chạy dài trên bảng mục tiêu trước khi chạy bất kỳ DDL nào vào giờ cao điểm, thay vì cấm hẳn việc chạy migration giờ cao điểm — điều mà ràng buộc của tình huống này không cho phép.",
    redFlags: [
      "Cho rằng SELECT và ALTER TABLE không bao giờ ảnh hưởng tới các SELECT khác vì SELECT 'chỉ đọc'",
      "Kết luận sự cố do quá tải CPU hoặc I/O thay vì do hàng đợi lock",
      "Đề xuất chạy ALTER TABLE vào giờ cao điểm mà không kiểm tra truy vấn dài đang chạy hoặc không đặt lock_timeout",
    ],
    probes: [
      "Nếu ALTER TABLE đến SAU một SELECT khác thay vì đến trước, các SELECT tiếp theo sau đó có bị chặn theo cùng cách không?",
      "lock_timeout khác statement_timeout ở điểm nào trong chính tình huống này?",
      "Vì sao pg_blocking_pids() là công cụ đầu tiên nên dùng khi chẩn đoán sự cố kiểu này?",
    ],
    refs: ["pg-12"],
  },

  // ===== pg-plan (pg-iq17–pg-iq20) =====
  {
    id: "pg-iq17",
    field: "pg-internals",
    topic: "pg-plan",
    level: 1,
    minutes: 5,
    question:
      "Mô tả bốn giai đoạn một câu lệnh SQL trải qua trong giao thức truy vấn đơn giản của PostgreSQL: parse, rewrite, plan, execute. Prepared statement thay đổi điều này ra sao, và khi nào PostgreSQL chuyển từ custom plan sang generic plan?",
    mustCover: [
      "Giai đoạn parse: lexer tách văn bản truy vấn thành lexeme, parser dựng parse tree theo ngữ pháp SQL, rồi phân tích ngữ nghĩa kiểm tra các đối tượng được tham chiếu có tồn tại và người dùng có quyền truy cập hay không",
      "Giai đoạn rewrite: parse tree có thể bị biến đổi, ví dụ thay tên một view bằng truy vấn cơ sở của nó hoặc áp dụng row-level security — mọi thao tác vẫn diễn ra trên cây, không phải trên văn bản gốc",
      "Giai đoạn plan: planner là một cost-based optimizer, duyệt nhiều plan khả thi, ước lượng cost dựa trên statistics đã thu thập, rồi chọn plan có cost thấp nhất",
      "Giai đoạn execute: executor mở một portal và thực thi cây plan từ gốc, các node kéo dòng dữ liệu qua lại như một dây chuyền lắp ráp",
      "Prepared statement tách riêng giai đoạn chuẩn bị (parse và rewrite, giữ lại parse tree trong bộ nhớ backend) khỏi giai đoạn gắn tham số và thực thi, tránh phải phân tích cú pháp lại cùng một truy vấn nhiều lần",
      "Năm lần thực thi đầu tiên của một prepared statement có tham số luôn dùng custom plan dựa trên giá trị tham số thực tế; từ lần thực thi thứ SÁU trở đi, nếu cost trung bình của generic plan (không phụ thuộc giá trị tham số) rẻ hơn cost trung bình của các custom plan đã thấy — có tính cả chi phí phải xây lại custom plan mỗi lần — planner giữ generic plan và bỏ qua việc tối ưu hoá lại cho các lần thực thi sau",
    ],
    model:
      "Một câu lệnh SQL gửi tới PostgreSQL qua giao thức truy vấn đơn giản trải qua đúng bốn giai đoạn tuần tự. Đầu tiên là parse: lexer tách văn bản truy vấn thành các lexeme (từ khoá, định danh, hằng số...), parser dùng chúng để dựng một parse tree theo đúng ngữ pháp SQL, rồi bộ phân tích ngữ nghĩa duyệt lại cây này để xác nhận các bảng/cột được tham chiếu có thật sự tồn tại và người dùng có quyền truy cập hay không — kết quả là một parse tree đã được làm giàu bằng tham chiếu tới các đối tượng cụ thể trong system catalog. Giai đoạn thứ hai là rewrite (biến đổi): parse tree có thể bị viết lại, chẳng hạn thay tên một view bằng chính truy vấn cơ sở định nghĩa nó, hoặc áp dụng các quy tắc row-level security — quan trọng là mọi phép biến đổi này diễn ra trên CÂY, PostgreSQL không bao giờ quay lại thao tác trên văn bản truy vấn gốc. Giai đoạn thứ ba, plan, là nơi planner — một cost-based optimizer — vào cuộc: vì SQL là ngôn ngữ khai báo, cùng một câu hỏi có rất nhiều cách thực thi vật lý khác nhau (quét tuần tự hay qua index, nested loop hay hash join...), nên planner phải duyệt qua nhiều plan khả thi, ước lượng cost của mỗi cái dựa trên statistics đã thu thập được, rồi chọn ra plan có cost thấp nhất. Giai đoạn cuối, execute, là lúc executor mở một portal lưu trạng thái thực thi và bắt đầu chạy cây plan từ gốc: các node kéo (pull) dòng dữ liệu từ node con của mình, giống hệt một dây chuyền lắp ráp, cho tới khi đủ dữ liệu trả về cho client. Prepared statement thay đổi bức tranh này bằng cách tách hẳn giai đoạn CHUẨN BỊ — chỉ gồm parse và rewrite — ra khỏi giai đoạn gắn tham số và thực thi: parse tree được giữ lại trong bộ nhớ của chính backend đó, nên các lần gọi EXECUTE sau không cần phân tích cú pháp lại từ đầu. Nhưng việc LẬP KẾ HOẠCH thì phức tạp hơn một chút vì giá trị tham số ảnh hưởng trực tiếp tới cost và cả lựa chọn plan. Năm lần thực thi đầu tiên của một prepared statement có tham số luôn dùng custom plan — lập kế hoạch lại hoàn toàn dựa trên giá trị tham số thực tế của lần gọi đó, cho ra cost chính xác nhất cho đúng bộ giá trị đó. Bắt đầu từ lần thực thi thứ SÁU, planner so sánh cost trung bình của năm custom plan đã thấy (cộng thêm chi phí phải xây lại chúng mỗi lần) với cost của một generic plan — một plan duy nhất không phụ thuộc giá trị tham số cụ thể nào. Nếu generic plan rẻ hơn, PostgreSQL giữ nó lại và bỏ qua hẳn việc tối ưu hoá cho những lần thực thi tiếp theo, đổi lấy tốc độ thực thi nhanh hơn nhưng có nguy cơ chọn nhầm nếu phân bố dữ liệu thực ra rất lệch giữa các giá trị tham số khác nhau — khi đó có thể ép buộc chọn lại bằng tham số plan_cache_mode.",
    redFlags: [
      "Gộp giai đoạn parse và plan làm một, không phân biệt được parse tree với plan tree",
      "Nghĩ rằng prepared statement luôn dùng generic plan ngay từ lần thực thi đầu tiên",
      "Không biết có thể ép buộc plan_cache_mode để chọn tường minh giữa custom và generic plan",
    ],
    probes: [
      "Điều gì được giữ lại trong bộ nhớ backend sau giai đoạn chuẩn bị của một prepared statement?",
      "Nếu năm custom plan đầu tiên đều rẻ hơn generic plan thì điều gì xảy ra ở lần thực thi thứ sáu?",
      "plan_cache_mode dùng để làm gì khi planner chọn sai giữa generic và custom plan?",
    ],
    refs: ["pg-16"],
  },
  {
    id: "pg-iq18",
    field: "pg-internals",
    topic: "pg-plan",
    level: 2,
    minutes: 8,
    code: {
      lang: "sql",
      text: `-- Trước khi sửa
=> EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM flights f
  JOIN ticket_flights tf ON tf.flight_id = f.flight_id
WHERE f.flight_no = 'PG0007' AND f.departure_airport = 'VKO';
                                          QUERY PLAN
------------------------------------------------------------------------------------------
 Nested Loop  (cost=4.60..1988.11 rows=1 width=99)
              (actual time=0.08..842.61 rows=48000 loops=1)
   Buffers: shared hit=51248
   -> Bitmap Heap Scan on flights f  (cost=4.31..24.85 rows=1 width=63)
                                     (actual time=0.05..1.62 rows=400 loops=1)
        Recheck Cond: (flight_no = 'PG0007'::bpchar)
        Filter: (departure_airport = 'VKO'::bpchar)
        Rows Removed by Filter: 0
        Heap Blocks: exact=248
        -> Bitmap Index Scan on flights_flight_no_idx
              (cost=0.00..4.31 rows=277 width=0)
              (actual time=0.03..0.03 rows=400 loops=1)
              Index Cond: (flight_no = 'PG0007'::bpchar)
   -> Index Scan using ticket_flights_pkey on ticket_flights tf
        (cost=0.29..1963.14 rows=1 width=36)
        (actual time=0.15..2.09 rows=120 loops=400)
        Index Cond: (flight_id = f.flight_id)
 Planning Time: 0.4 ms
 Execution Time: 855.02 ms

-- Sửa
=> CREATE STATISTICS flights_dep (dependencies)
   ON flight_no, departure_airport FROM flights;
=> ANALYZE flights;

-- Sau khi sửa
=> EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM flights f
  JOIN ticket_flights tf ON tf.flight_id = f.flight_id
WHERE f.flight_no = 'PG0007' AND f.departure_airport = 'VKO';
                                          QUERY PLAN
------------------------------------------------------------------------------------------
 Hash Join  (cost=32.85..1180.22 rows=48120 width=99)
            (actual time=0.61..38.40 rows=48000 loops=1)
   Hash Cond: (tf.flight_id = f.flight_id)
   -> Seq Scan on ticket_flights tf (actual time=0.01..12.30 rows=8391852 loops=1)
   -> Hash (actual time=0.42..0.42 rows=400 loops=1)
        -> Bitmap Heap Scan on flights f (actual time=0.05..0.30 rows=400 loops=1)
             Recheck Cond: (flight_no = 'PG0007'::bpchar)
             Filter: (departure_airport = 'VKO'::bpchar)
 Planning Time: 0.6 ms
 Execution Time: 41.20 ms`,
    },
    question:
      "Trước khi sửa, planner ước lượng rows=1 cho vế flights nhưng thực tế trả về 48.000 dòng, và chọn nested loop. Chẩn đoán vì sao ước lượng sai tới mức đó, giải thích tại sao nested loop trở thành lựa chọn tệ trong trường hợp này, và giải thích cách CREATE STATISTICS cùng ANALYZE sửa được vấn đề.",
    mustCover: [
      "Ước lượng rows=1 cho flights sai vì planner mặc định giả định flight_no và departure_airport ĐỘC LẬP với nhau rồi nhân riêng hai selectivity, trong khi thực tế departure_airport gần như bị xác định hoàn toàn bởi flight_no (một chuyến bay chỉ khởi hành từ một sân bay) — đây đúng là vấn đề vị từ tương quan",
      "Vì ước lượng outer chỉ có 1 dòng, planner chọn nested loop join: hợp lý cho một outer siêu nhỏ vì chi phí quét lại inner qua index gần như không đáng kể nếu chỉ phải lặp một lần",
      "Thực tế outer trả về 400 dòng chứ không phải 1, nên nested loop phải chạy lại Index Scan trên ticket_flights 400 lần (loops=400), mỗi lần khoảng 120 dòng, cộng dồn thành 48.000 dòng thực tế — cost bùng nổ theo đúng số lần lặp thật chứ không theo ước lượng sai ban đầu",
      "Dấu hiệu chẩn đoán nằm ngay trong EXPLAIN ANALYZE: so sánh rows ước lượng trong ngoặc cost=... của node Bitmap Heap Scan trên flights với actual rows của chính node đó — lệch nhau hàng trăm lần là dấu hiệu ước lượng selectivity sai do các cột tương quan, không phải statistics đơn giản bị lỗi thời",
      "Cách sửa: CREATE STATISTICS ... (dependencies) ON flight_no, departure_airport FROM flights rồi ANALYZE lại bảng giúp planner học được mức độ phụ thuộc hàm giữa hai cột, từ đó ước lượng đúng khoảng 400 dòng cho vế flights và chuyển sang hash join — phương thức phù hợp hơn hẳn cho một outer lớn cỡ đó",
    ],
    model:
      "Chênh lệch giữa rows=1 ước lượng và 48.000 dòng thực tế không phải do statistics lỗi thời theo nghĩa thông thường — nó là hậu quả của một giả định toán học mà planner luôn dùng khi ước lượng selectivity của nhiều điều kiện AND: nó nhân riêng selectivity của flight_no = 'PG0007' với selectivity của departure_airport = 'VKO', coi như hai điều kiện độc lập với nhau. Nhưng trong thực tế, một chuyến bay chỉ khởi hành từ đúng một sân bay, nên biết flight_no gần như đã biết luôn departure_airport — hai cột này phụ thuộc hàm gần như hoàn toàn vào nhau. Vì vậy tích hai selectivity nhỏ cho ra một ước lượng cực nhỏ (rows=1), trong khi số dòng thực sự khớp cả hai điều kiện gần bằng số dòng chỉ khớp một điều kiện flight_no (400 dòng). Với ước lượng outer chỉ có 1 dòng, việc planner chọn nested loop hoàn toàn hợp lý theo đúng mô hình cost của nó: nested loop rất rẻ nếu chỉ phải quét tập trong (ticket_flights, qua index trên flight_id) đúng một lần. Nhưng thực tế outer trả về 400 dòng chứ không phải 1, nên executor phải LẶP LẠI Index Scan trên ticket_flights 400 lần — mỗi lần trả về trung bình 120 dòng — cộng dồn thành 48.000 dòng và 855 mili giây thay vì gần như tức thời. Đây chính là bản chất của việc nested loop 'trừng phạt' một ước lượng outer sai: cost thực tế không tăng theo con số ước lượng mà tăng theo SỐ LẦN LẶP THẬT. Để chẩn đoán, tôi so sánh trực tiếp giá trị rows trong ngoặc cost=... (ước lượng) với actual rows (thực tế) của đúng node Bitmap Heap Scan trên flights — chênh lệch 400 lần ngay tại node lá là dấu hiệu rõ ràng của một vấn đề ước lượng selectivity, khoanh vùng được ngay là do vị từ tương quan chứ không phải do bảng ticket_flights hay do thiếu index (index đã được dùng đúng ở cả hai plan). Cách sửa đúng là dạy cho planner biết về mối phụ thuộc hàm này bằng CREATE STATISTICS flights_dep (dependencies) ON flight_no, departure_airport FROM flights, sau đó ANALYZE flights để thu thập statistic mới; một lần ANALYZE thông thường không có CREATE STATISTICS đi kèm sẽ không sửa được vấn đề này, vì statistics ở mức cột không bao giờ ghi lại mối quan hệ GIỮA hai cột. Sau khi có statistics mở rộng, planner ước lượng đúng khoảng 400 dòng cho vế flights (chính xác gần như tuyệt đối, thấy trong rows=48120 của plan mới), và với một outer lớn cỡ đó, nó chuyển hẳn sang hash join — quét toàn bộ ticket_flights một lần, xây hash table trên vế flights nhỏ hơn, đưa thời gian thực thi xuống còn 41 mili giây, nhanh hơn khoảng 20 lần so với plan cũ.",
    redFlags: [
      "Đề xuất tăng default_statistics_target chung chung mà không xác định đúng vấn đề là phụ thuộc hàm giữa hai cột cụ thể",
      "Kết luận statistics 'lỗi thời' rồi chỉ chạy ANALYZE thường mà không hiểu ANALYZE mặc định không ghi lại quan hệ giữa các cột",
      "Nhầm nguyên nhân là do thiếu index trên ticket_flights, trong khi index đã được dùng đúng ở cả hai plan",
    ],
    probes: [
      "Vì sao một lần ANALYZE thường (không kèm CREATE STATISTICS) không sửa được ước lượng sai này?",
      "Nếu vế outer thực sự chỉ có 1 dòng đúng như ước lượng ban đầu, nested loop có còn là lựa chọn tệ không?",
      "CREATE STATISTICS ... (dependencies) khác CREATE STATISTICS ... (mcv) ở điểm nào?",
    ],
    refs: ["pg-17", "pg-21"],
  },
  {
    id: "pg-iq19",
    field: "pg-internals",
    topic: "pg-plan",
    level: 3,
    minutes: 11,
    question:
      "So sánh ba phương thức join của PostgreSQL — nested loop, hash join, merge join — theo kích thước tập dữ liệu, bộ nhớ cần thiết, việc dữ liệu có sẵn thứ tự hay không, và khả năng xử lý điều kiện join không phải đẳng thức.",
    tradeoffs: [
      {
        option: "Nested loop",
        when: "Không có điều kiện tiên quyết nào và có thể trả về dòng đầu tiên ngay lập tức — lý tưởng cho truy vấn OLTP ngắn với tập trong nhỏ hoặc truy cập được qua index; là phương thức join DUY NHẤT hỗ trợ mọi loại điều kiện join kể cả non-equi-join, nhưng độ phức tạp tiến gần bậc hai nếu không có index trên tập trong, và một ước lượng cardinality outer quá thấp có thể khiến nó bị chọn nhầm cho một outer thực ra rất lớn.",
      },
      {
        option: "Hash join",
        when: "Hiệu quả nhất trên tập dữ liệu lớn nếu hash table của tập nhỏ hơn vừa trong work_mem × hash_mem_multiplier — khi đó chỉ cần một lượt duyệt qua cả hai tập, độ phức tạp gần tuyến tính; nhưng chỉ hỗ trợ equi-join, không trả dòng nào cho tới khi hash table xây xong hoàn tất, và nếu không đủ bộ nhớ nó phải chia nhiều batch tràn ra đĩa, làm cost tăng vọt.",
      },
      {
        option: "Merge join",
        when: "Tốt cho cả truy vấn ngắn lẫn truy vấn dài nếu CẢ HAI tập đã có sẵn thứ tự theo khoá join — thường nhờ lấy được miễn phí từ một index scan — chỉ cần một lượt duyệt, gần như không tốn thêm bộ nhớ, và kết quả trả về đã sắp xếp sẵn hữu ích nếu truy vấn có ORDER BY cùng cột; nhưng nếu chưa có thứ tự sẵn thì phải trả cost sắp xếp trước khi trộn, và cũng chỉ hỗ trợ equi-join với kiểu dữ liệu có operator class B-tree.",
      },
    ],
    mustCover: [
      "Nested loop không có điều kiện tiên quyết, có thể trả dòng đầu tiên ngay, và là phương thức duy nhất hỗ trợ non-equi-join — nhưng nếu tập trong phải quét toàn bộ vì không có index phù hợp, độ phức tạp tiến gần bậc hai, nên nó hợp với OLTP ngắn có index tốt trên tập trong hơn là khối lượng OLAP lớn",
      "Hash join phải xây xong toàn bộ hash table của tập trong trước khi trả bất kỳ dòng nào nên độ trễ dòng đầu kém, nhưng nếu hash table vừa work_mem thì độ phức tạp gần tuyến tính và thường thắng trên tập lớn; hết bộ nhớ thì phải chia batch tràn đĩa, cost tăng theo bậc thang",
      "Merge join cần cả hai tập đã sắp xếp theo khoá join — rẻ nhất khi lấy được thứ tự đó miễn phí qua index scan, nhưng nếu phải tự sắp xếp thì cost tăng theo O(n log n) và tốn bộ nhớ, khi đó hash join hầu như luôn rẻ hơn trừ khi kết quả cần được sắp sẵn",
      "Cả hash join lẫn merge join đều CHỈ hỗ trợ equi-join; riêng merge join còn đòi kiểu dữ liệu phải có operator class B-tree, còn hash join chỉ cần kiểu hỗ trợ hashing",
      "Không có phương thức nào luôn thắng — planner phải ước lượng cost cụ thể cho từng trường hợp dựa trên statistics, và một ước lượng cardinality sai có thể khiến planner chọn nhầm nested loop cho một outer bị đánh giá thấp trong khi thực tế nó rất lớn",
    ],
    model:
      "Ba phương thức join này hoàn toàn không thay thế cho nhau — mỗi cái tối ưu cho một hình dạng bài toán khác nhau, và câu hỏi đúng luôn là 'kích thước tập, bộ nhớ khả dụng, và điều kiện join là gì' trước khi hỏi 'cái nào nhanh hơn'. Nested loop là phương thức đơn giản nhất về mặt điều kiện tiên quyết: nó không cần gì cả, có thể trả về dòng kết quả đầu tiên ngay lập tức, và là phương thức DUY NHẤT trong ba cái hỗ trợ được bất kỳ điều kiện join nào, kể cả non-equi-join mà hai phương thức kia hoàn toàn bó tay. Nhưng thuật toán của nó — với mỗi dòng của tập ngoài, quét lại tập trong để tìm dòng khớp — có độ phức tạp tiến gần tới bậc hai nếu tập trong không có index phù hợp và phải bị quét toàn bộ mỗi lần; nó chỉ thực sự rẻ khi tập trong truy cập được qua index, nên hợp nhất với các truy vấn OLTP ngắn làm việc trên tập dòng nhỏ. Một rủi ro riêng của nested loop là nó cực kỳ nhạy với sai số ước lượng cardinality của tập ngoài: nếu planner nghĩ tập ngoài chỉ có vài dòng nhưng thực tế có hàng trăm nghìn, nested loop bị chọn nhầm và phải lặp lại việc quét tập trong nhiều lần hơn hẳn dự tính. Hash join đi theo hướng ngược lại: nó xây một hash table đầy đủ trên tập nhỏ hơn trước, rồi mới quét tập lớn hơn để đối chiếu — nghĩa là nó không trả về BẤT KỲ dòng nào cho tới khi toàn bộ hash table xây xong, độ trễ dòng đầu rất kém, nhưng nếu hash table vừa trong work_mem × hash_mem_multiplier thì chỉ cần một lượt duyệt cho mỗi tập, độ phức tạp gần tuyến tính — đây là lý do nó thường thắng áp đảo trên khối lượng dữ liệu lớn kiểu OLAP. Cái giá khi không đủ bộ nhớ là phải chia dữ liệu thành nhiều batch, ghi và đọc lại từ file tạm, khiến cost tăng theo từng 'bậc thang' mỗi khi số batch tăng gấp đôi. Merge join lại đặt cược vào một điều kiện khác hẳn: cả hai tập phải có sẵn thứ tự theo đúng khoá join. Nếu có sẵn — điển hình là lấy được miễn phí từ một index scan — merge join chỉ cần một lượt duyệt song song qua cả hai tập, gần như không tốn thêm bộ nhớ nào, và một lợi ích phụ đáng giá là kết quả trả về đã có sẵn thứ tự sắp xếp, hữu ích nếu truy vấn có ORDER BY trùng với khoá join. Nhưng nếu chưa có thứ tự sẵn, PostgreSQL phải tự sắp xếp cả hai tập trước — cost O(n log n) và tốn bộ nhớ đáng kể — và trong trường hợp đó hash join hầu như luôn rẻ hơn, trừ khi bản thân truy vấn cần kết quả được sắp xếp theo đúng cột đó. Một ràng buộc chung của cả hash join lẫn merge join là chúng chỉ hỗ trợ equi-join; merge join còn đòi thêm kiểu dữ liệu phải có operator class B-tree, trong khi hash join chỉ cần kiểu hỗ trợ hashing — một dải kiểu rộng hơn nhiều. Cuối cùng, không phương thức nào luôn thắng một cách tuyệt đối: planner phải tính cost cụ thể cho từng truy vấn dựa trên statistics thực tế, và chính vì thế một ước lượng cardinality sai — như trường hợp các cột tương quan bị đánh giá độc lập với nhau — hoàn toàn có thể khiến nó chọn nhầm nested loop cho một tập outer thực ra rất lớn.",
    redFlags: [
      "Nói hash join luôn tốt hơn nested loop mà không nhắc tới điều kiện work_mem",
      "Cho rằng merge join luôn cần sắp xếp trước, bỏ qua trường hợp lấy thứ tự miễn phí từ index scan",
      "Nghĩ nested loop hỗ trợ được full join",
      "Không phân biệt được equi-join và non-equi-join khi so sánh khả năng áp dụng của ba phương thức",
    ],
    probes: [
      "Vì sao hash join không trả được dòng nào cho tới khi hash table xây xong?",
      "Khi nào merge join là lựa chọn đúng dù dữ liệu chưa được sắp xếp sẵn?",
      "Điều gì khiến planner chọn nhầm nested loop cho một tập outer thực ra rất lớn?",
    ],
    refs: ["pg-21", "pg-22", "pg-23"],
  },
  {
    id: "pg-iq20",
    field: "pg-internals",
    topic: "pg-plan",
    level: 4,
    minutes: 17,
    incident: {
      symptom:
        "Report tổng hợp cuối tháng chạy chậm gấp khoảng 20 lần so với các lần chạy hằng ngày trong tháng. EXPLAIN (ANALYZE, BUFFERS) cho thấy một node Sort với 'Sort Method: external merge Disk' và một Hash Join báo số Batches cao hơn hẳn bình thường. Đội đề xuất tăng work_mem toàn cục lên gấp bốn lần để 'cho query đủ RAM'.",
      scale:
        "Server có 32GB RAM, shared_buffers 8GB, trung bình 300 kết nối đồng thời qua connection pool vào lúc report chạy (đầu tháng, nhiều job báo cáo khác cũng chạy song song). work_mem hiện tại là 64MB. Report cuối tháng xử lý toàn bộ giao dịch tích luỹ trong 30 ngày thay vì một ngày như thường lệ, nên tập dữ liệu cần sort/hash lớn hơn nhiều lần so với các lần chạy hằng ngày.",
      constraints:
        "Không thể tách report sang instance riêng trong tuần này. Không được để server hết RAM và bắt đầu OOM-kill tiến trình PostgreSQL. Phải đưa ra khuyến nghị work_mem cụ thể có căn cứ, không phải một con số đoán mò.",
    },
    question:
      "EXPLAIN cho thấy external merge sort tràn đĩa và hash join phải chia nhiều batch. Chẩn đoán nguyên nhân, đánh giá đề xuất tăng work_mem toàn cục, và nêu cách chọn giá trị work_mem có căn cứ cho tình huống này.",
    mustCover: [
      "'Sort Method: external merge Disk' nghĩa là tập dữ liệu cần sắp xếp không vừa trong work_mem, buộc PostgreSQL ghi nhiều file tạm đã sắp xếp một phần rồi trộn lại — chậm hơn nhiều so với quicksort trong bộ nhớ, và dung lượng tràn đĩa hiển thị ngay trong dòng Disk: XXXkB của EXPLAIN ANALYZE",
      "Hash Join báo số Batches cao hơn bình thường nghĩa là hash table của tập bên trong không vừa work_mem × hash_mem_multiplier, nên tập bên trong phải được chia nhỏ, ghi ra file tạm rồi xử lý riêng từng batch — chi phí I/O tăng vọt so với hash join một lượt hoàn toàn trong bộ nhớ",
      "work_mem không phải một giới hạn TOÀN CỤC cho một truy vấn: một plan có thể cấp phát nhiều vùng work_mem cùng lúc, mỗi node Sort/Hash một vùng riêng, và mỗi kết nối trong số hàng trăm kết nối đồng thời đang chạy truy vấn khác cũng cấp phát work_mem riêng — nên tăng work_mem toàn cục gấp bốn lần nhân chi phí bộ nhớ theo cả số node lẫn số kết nối đồng thời, có nguy cơ vượt RAM và gây OOM đúng lúc tải cao nhất trong tháng",
      "Cách làm đúng là chỉ tăng work_mem cho phiên hoặc vai trò chạy report — bằng SET work_mem trong đúng session/transaction đó, hoặc gán riêng cho role chạy report — chứ không đổi giá trị mặc định của toàn server",
      "Cách chọn giá trị có căn cứ: đọc dung lượng đã tràn ra đĩa trong EXPLAIN ANALYZE (dòng Disk: XXXkB của Sort, và temp read/written của Hash) ở một lần chạy đại diện, rồi đặt work_mem cho phiên report lớn hơn con số đó một biên an toàn — thay vì đoán một bội số tuỳ tiện như gấp bốn lần",
    ],
    model:
      "Hai triệu chứng trong EXPLAIN đều chỉ về cùng một nguyên nhân gốc: work_mem hiện tại không đủ cho khối lượng dữ liệu của riêng report cuối tháng, vốn lớn hơn hẳn các lần chạy hằng ngày vì nó gộp cả 30 ngày giao dịch. 'Sort Method: external merge Disk' nghĩa là tập cần sắp xếp không vừa trong work_mem, nên PostgreSQL buộc phải chia nhỏ dữ liệu, sắp xếp từng phần bằng quicksort trong bộ nhớ rồi ghi ra nhiều file tạm, sau đó trộn các file đã sắp xếp một phần đó lại với nhau — chậm hơn nhiều so với quicksort thuần trong bộ nhớ, và EXPLAIN ANALYZE cho biết chính xác đã tràn bao nhiêu qua dòng Disk: XXXkB. Việc Hash Join báo số Batches cao hơn bình thường là cùng một câu chuyện ở phía hash table: hash table của tập bên trong không vừa work_mem × hash_mem_multiplier, nên PostgreSQL phải chia tập này (và cả phần tương ứng của tập bên ngoài) thành nhiều batch, ghi ra file tạm rồi xử lý riêng từng batch một — chi phí I/O tăng vọt so với việc xử lý trong một lượt hoàn toàn trong bộ nhớ. Cả hai triệu chứng đều đúng: dữ liệu lớn hơn work_mem hiện có. Nhưng đề xuất tăng work_mem TOÀN CỤC gấp bốn lần lại nguy hiểm hơn nhiều so với vẻ ngoài của nó, vì work_mem không phải một giới hạn tổng cho MỘT truy vấn — nó là giới hạn cho MỖI vùng bộ nhớ mà MỖI node Sort hoặc Hash trong plan cấp phát riêng, và một plan phức tạp hoàn toàn có thể có nhiều node như vậy cùng lúc. Tệ hơn, mỗi trong số khoảng 300 kết nối đồng thời đang chạy các truy vấn khác — không chỉ report cuối tháng — cũng cấp phát work_mem của RIÊNG nó theo đúng giá trị mặc định mới. Kết quả là việc tăng work_mem toàn cục nhân chi phí bộ nhớ tiềm năng lên theo CẢ số node trong một plan LẪN số kết nối đồng thời, và với 32GB RAM cùng shared_buffers đã chiếm 8GB, một work_mem 256MB nhân với hàng trăm kết nối hoàn toàn có thể vượt RAM khả dụng và khiến hệ điều hành OOM-kill chính tiến trình PostgreSQL — đúng vào lúc tải cao điểm đầu tháng, tệ hơn hẳn tình trạng ban đầu. Cách làm đúng là chỉ tăng work_mem cho ĐÚNG phiên hoặc vai trò chạy report: gọi SET work_mem = '...' ngay trong session/transaction thực thi report, hoặc ALTER ROLE report_runner SET work_mem = '...' nếu report luôn chạy dưới một role riêng — không đổi giá trị mặc định server ảnh hưởng tới mọi kết nối khác. Để chọn con số cụ thể thay vì đoán mò, tôi đọc chính xác dung lượng đã tràn ra đĩa ở lần chạy vừa rồi: dòng Disk: XXXkB của node Sort và temp read/written của node Hash Join cho biết đúng bao nhiêu dữ liệu đã phải ghi/đọc lại từ file tạm — tôi đặt work_mem cho phiên report bằng con số đó cộng thêm một biên an toàn hợp lý (ví dụ 20–30%), thay vì nhân bừa work_mem mặc định lên gấp bốn.",
    redFlags: [
      "Đồng ý tăng work_mem toàn cục ngay mà không tính tới việc nó nhân theo số node trong plan lẫn số kết nối đồng thời",
      "Coi 'external merge Disk' và 'nhiều Batches' là hai triệu chứng của hai nguyên nhân khác nhau thay vì cùng một vấn đề thiếu bộ nhớ",
      "Đề xuất một giá trị work_mem mới mà không dựa trên dung lượng tràn đĩa đã đo được thực tế",
      "Không phân biệt được work_mem cấp phát theo mỗi node/mỗi kết nối với một giới hạn tổng duy nhất của cả server",
    ],
    probes: [
      "Vì sao tăng work_mem toàn cục nguy hiểm hơn hẳn tăng riêng cho một session?",
      "EXPLAIN ANALYZE cho biết chính xác cần bao nhiêu work_mem bằng cách nào?",
      "Nếu chỉ tăng work_mem cho riêng report mà vẫn còn tràn đĩa, bước tiếp theo là gì?",
    ],
    refs: ["pg-22", "pg-23"],
  },

  // ===== pg-index (pg-iq21–pg-iq24) =====
  {
    id: "pg-iq21",
    field: "pg-internals",
    topic: "pg-index",
    level: 1,
    minutes: 5,
    question:
      "Mô tả cấu trúc B-tree trong PostgreSQL và các toán tử nó hỗ trợ trực tiếp. Vì sao một điều kiện như WHERE lower(email) = 'x' hay WHERE email LIKE '%abc' thường không dùng được một index B-tree thông thường trên cột email?",
    mustCover: [
      "B-tree là cấu trúc cân bằng (mọi nút lá cùng độ sâu) và rậm (mỗi nút chứa nhiều phần tử, thường hàng trăm), gồm nút trong tham chiếu tới nút con và nút lá tham chiếu tới heap tuple; dữ liệu được sắp thứ tự cả trong một nút lẫn xuyên suốt các nút cùng mức, các nút lá nối thành danh sách hai chiều để duyệt được cả hai hướng mà không cần quay lại gốc",
      "Mọi operator class của B-tree bắt buộc phải định nghĩa đủ năm toán tử so sánh (nhỏ hơn, nhỏ hơn hoặc bằng, bằng, lớn hơn hoặc bằng, lớn hơn) — B-tree chỉ hỗ trợ tìm kiếm dựa trên đúng năm toán tử này, không hỗ trợ toán tử tuỳ ý",
      "Điều kiện phải viết đúng dạng 'cột-được-đánh-index toán-tử biểu-thức' và toán tử đó phải thuộc operator class của cột — nếu cột bị bọc trong một lời gọi hàm như lower(email), điều kiện không còn đúng dạng đó nữa nên B-tree trên chính cột email không dùng được, trừ khi tạo một expression index trên lower(email)",
      "LIKE '%abc' có ký tự đại diện % ở ĐẦU mẫu nên không xác định được một điểm bắt đầu cố định trong thứ tự đã sắp xếp của B-tree; khác với LIKE 'abc%' (đại diện ở cuối), vốn viết lại được thành một điều kiện khoảng (lớn hơn hoặc bằng 'abc' và nhỏ hơn giá trị kế tiếp) và tận dụng được B-tree",
      "Cách khắc phục: tạo expression index trên lower(email) cho trường hợp đầu; với LIKE có đại diện ở đầu thì B-tree hoàn toàn bất lực, phải dùng một access method khác hỗ trợ tìm kiếm theo chuỗi con bất kỳ vị trí",
    ],
    model:
      "B-tree trong PostgreSQL là một cấu trúc cân bằng và rậm: mọi nút lá của cây luôn nằm ở cùng một độ sâu, và mỗi nút thường chứa hàng trăm phần tử thay vì chỉ vài phần tử, nên độ sâu của cây luôn nhỏ ngay cả với bảng rất lớn. Nút trong chứa các cặp khoá-con trỏ tham chiếu tới nút ở mức kế tiếp, còn nút lá tham chiếu trực tiếp tới các heap tuple. Dữ liệu được sắp thứ tự cả bên trong một nút lẫn xuyên suốt các nút cùng mức, và các nút lá được nối với nhau thành một danh sách hai chiều, nên có thể lấy ra một dải giá trị đã sắp xếp chỉ bằng cách duyệt danh sách theo một hướng, không cần quay lại gốc mỗi lần. Về toán tử, mọi operator class của B-tree bắt buộc phải định nghĩa đủ năm toán tử so sánh — nhỏ hơn, nhỏ hơn hoặc bằng, bằng, lớn hơn hoặc bằng, lớn hơn — và B-tree chỉ hỗ trợ tìm kiếm dựa trên đúng năm toán tử này; nó hoàn toàn không biết gì về bất kỳ toán tử nào khác dù index đã tồn tại sẵn trên cột đó. Để một điều kiện dùng được index, nó còn phải viết đúng dạng 'cột-được-đánh-index toán-tử biểu-thức', và toán tử đó phải thuộc operator class đã gán cho cột khi tạo index. Với WHERE lower(email) = 'x', cột email bị bọc trong lời gọi hàm lower(), nên về mặt cú pháp điều kiện không còn đúng dạng 'cột toán-tử biểu-thức' nữa — B-tree trên chính cột email không thể dùng được, vì nó chỉ biết giá trị thô của email chứ không biết gì về kết quả của việc gọi lower() trên đó. Cách khắc phục là tạo một expression index — một B-tree được xây trực tiếp trên biểu thức lower(email) thay vì trên cột — khi đó điều kiện lower(email) = 'x' lại đúng dạng cần thiết và dùng được index bình thường. Với WHERE email LIKE '%abc', vấn đề còn căn bản hơn: ký tự đại diện % nằm ở ĐẦU mẫu tìm kiếm, nghĩa là không có cách nào xác định một điểm bắt đầu cố định trong thứ tự đã sắp xếp của B-tree để bắt đầu duyệt — mọi giá trị kết thúc bằng 'abc' có thể nằm rải rác ở bất kỳ đâu trong cây, không hề tập trung liền kề nhau. Điều này khác hẳn với LIKE 'abc%' (đại diện ở cuối): mẫu đó viết lại được thành một điều kiện khoảng tương đương — lớn hơn hoặc bằng 'abc' và nhỏ hơn giá trị kế tiếp ngay sau 'abc' trong thứ tự sắp xếp — và một điều kiện khoảng như vậy hoàn toàn tận dụng được B-tree. Vì vậy với lower(email) = 'x', giải pháp là expression index; nhưng với LIKE '%abc', B-tree hoàn toàn bất lực bất kể tạo expression index kiểu gì, và phải chuyển sang một access method khác hỗ trợ tìm chuỗi con ở bất kỳ vị trí, ví dụ GIN kết hợp với extension pg_trgm dựa trên trigram.",
    redFlags: [
      "Nghĩ B-tree hỗ trợ được toán tử tuỳ ý miễn index đã tồn tại trên cột đó",
      "Không phân biệt được LIKE 'abc%' (dùng được B-tree qua viết lại thành khoảng) với LIKE '%abc' (không dùng được)",
      "Đề xuất tạo index thường trên email để tăng tốc lower(email) = 'x' thay vì một expression index",
    ],
    probes: [
      "Vì sao LIKE 'abc%' đôi khi vẫn cần một operator class riêng như text_pattern_ops để dùng được B-tree?",
      "Nêu chính xác cách tạo index để tăng tốc WHERE lower(email) = 'x'",
      "Kể tên một access method khác có thể tăng tốc tìm kiếm chuỗi con ở bất kỳ vị trí",
    ],
    refs: ["pg-25", "pg-19"],
  },
  {
    id: "pg-iq22",
    field: "pg-internals",
    topic: "pg-index",
    level: 2,
    minutes: 8,
    code: {
      lang: "sql",
      text: `=> CREATE INDEX ON orders(a, b);

-- Q1
=> EXPLAIN (analyze, costs off, timing off, summary off)
SELECT a, b, c FROM orders WHERE a = 5 AND b = 10;
                       QUERY PLAN
--------------------------------------------------------
 Index Scan using orders_a_b_idx on orders (actual rows=3 loops=1)
   Index Cond: ((a = 5) AND (b = 10))
   Heap Fetches: 3
(3 rows)

-- Q2
=> EXPLAIN (analyze, costs off, timing off, summary off)
SELECT a, b FROM orders WHERE a = 5;
                       QUERY PLAN
--------------------------------------------------------
 Index Only Scan using orders_a_b_idx on orders (actual rows=420 loops=1)
   Index Cond: (a = 5)
   Heap Fetches: 37
(3 rows)

-- Q3
=> EXPLAIN (analyze, costs off, timing off, summary off)
SELECT a, b, c FROM orders WHERE a = 5;
                          QUERY PLAN
---------------------------------------------------------------
 Bitmap Heap Scan on orders (actual rows=420 loops=1)
   Recheck Cond: (a = 5)
   Heap Blocks: exact=95
   -> Bitmap Index Scan on orders_a_b_idx (actual rows=420 loops=1)
        Index Cond: (a = 5)
(5 rows)

-- Q4
=> EXPLAIN (analyze, costs off, timing off, summary off)
SELECT a, b, c FROM orders WHERE b = 10;
                    QUERY PLAN
--------------------------------------------------
 Seq Scan on orders (actual rows=380 loops=1)
   Filter: (b = 10)
   Rows Removed by Filter: 49620
(3 rows)`,
    },
    question:
      "Bảng orders có index B-tree trên (a, b). Với bốn truy vấn ở trên (đọc kỹ SELECT list và điều kiện WHERE của từng câu), xác định câu nào dùng index scan, index-only scan, bitmap scan, và seq scan — giải thích vì sao. Riêng câu dùng index-only scan, vì sao nó vẫn có Heap Fetches khác 0, và visibility map liên quan thế nào?",
    mustCover: [
      "Q1 (điều kiện a=5 AND b=10, SELECT thêm cột c) dùng Index Scan thường vì điều kiện lọc bao phủ đúng cả hai cột đầu của index theo thứ tự khai báo, nhưng SELECT list có cột c không nằm trong index nên vẫn phải truy cập heap để lấy c",
      "Q2 (điều kiện a=5, SELECT chỉ a và b) dùng Index Only Scan vì cả cột trong điều kiện lọc lẫn mọi cột trong SELECT list đều nằm trong index — index có thể trả dữ liệu mà không cần đọc heap, miễn là page tương ứng được đánh dấu all-visible trong visibility map",
      "Q3 (điều kiện a=5, SELECT thêm cột c) dùng Bitmap Heap Scan cộng Bitmap Index Scan vì SELECT list cần cột c ngoài index nên vẫn phải đọc heap, và điều kiện a=5 khớp đủ nhiều dòng để việc gom TID thành bitmap rồi đọc heap page theo thứ tự tăng dần rẻ hơn index scan tuần tự nếu correlation thấp",
      "Q4 (điều kiện chỉ trên b, không có điều kiện trên a) dùng Seq Scan vì điều kiện lọc không bao phủ một dãy cột liên tục bắt đầu từ cột ĐẦU TIÊN của index — B-tree nhiều cột sắp dữ liệu theo a trước rồi mới tới b, nên tìm theo b một mình không thu hẹp được phạm vi tìm kiếm trong cây",
      "Index-only scan (Q2) vẫn có Heap Fetches khác 0 vì bản thân index không lưu thông tin visibility của tuple — mọi TID thoả điều kiện đều được trả về kể cả tuple mà transaction hiện tại không thấy được; chỉ những page đã được vacuum đánh dấu ALL-VISIBLE trong visibility map mới được bỏ qua việc kiểm tra heap, nên thay đổi nào chưa kịp vacuum sẽ buộc phải Heap Fetches để kiểm tra visibility trực tiếp trên heap tuple",
    ],
    model:
      "Bốn plan này minh hoạ đúng bốn cách khác nhau mà cùng một index B-tree trên (a, b) được dùng, và khác biệt nằm ở cả điều kiện WHERE lẫn danh sách cột được SELECT. Q1 có điều kiện a=5 AND b=10 — bao phủ đúng cả hai cột đầu của index theo thứ tự khai báo — nên planner có thể thu hẹp phạm vi tìm kiếm trong cây xuống chỉ còn đúng những dòng thoả cả hai điều kiện, dùng Index Scan thường. Nhưng vì SELECT list còn yêu cầu cột c, một cột không nằm trong index, executor vẫn phải nhảy sang heap để lấy c cho mỗi dòng tìm được — đây không thể là index-only scan dù điều kiện lọc hoàn toàn nằm gọn trong index. Q2 mới thực sự là ứng viên cho index-only scan: điều kiện chỉ có a=5, và quan trọng hơn, SELECT list chỉ xin đúng a và b — cả hai đều đã có sẵn trong index — nên về nguyên tắc không cần đọc heap chút nào. Q3 lặp lại đúng điều kiện của Q2 (a=5) nhưng SELECT list lại có thêm c, buộc phải đọc heap giống Q1; điểm khác với Q1 là ở đây planner chọn Bitmap Heap Scan cùng Bitmap Index Scan thay vì Index Scan thường, vì điều kiện a=5 khớp một lượng dòng đủ lớn (420 dòng) khiến việc gom hết TID thành một bitmap rồi đọc các heap page theo đúng thứ tự tăng dần — mỗi page chỉ đọc một lần — rẻ hơn việc index scan tuần tự phải nhảy qua lại giữa các page nếu correlation giữa thứ tự vật lý và thứ tự logic của index thấp. Q4 là trường hợp khác hẳn: điều kiện chỉ có b=10, hoàn toàn không đụng tới cột a — cột ĐẦU TIÊN của index. Vì B-tree nhiều cột sắp dữ liệu theo cột đầu trước rồi mới tới cột sau, việc tìm theo b một mình không thu hẹp được phạm vi tìm kiếm trong cây chút nào — mọi giá trị b có thể nằm rải rác khắp cây ứng với mọi giá trị a khác nhau — nên planner bỏ qua index hoàn toàn và chọn Seq Scan, quét thẳng qua bảng và lọc bằng Filter. Câu hỏi thú vị nhất là vì sao Q2, dù là index-only scan, vẫn có Heap Fetches = 37 khác 0. Lý do nằm ở chính giới hạn thiết kế của index trong PostgreSQL: index hoàn toàn không lưu thông tin visibility của từng tuple — nó trả về TẤT CẢ các TID thoả điều kiện lọc, kể cả những tuple mà transaction hiện tại, theo snapshot của nó, không được phép thấy. Để tránh phải kiểm tra visibility bằng cách đọc heap cho MỌI tuple như vậy — điều sẽ biến index-only scan thành index scan thường về bản chất — PostgreSQL dựa vào visibility map: mỗi bit trong bản đồ này đánh dấu một heap page CHỈ chứa toàn tuple all-visible (mọi transaction, bất kể snapshot nào, đều thấy được), và bit này chỉ được đặt bởi vacuum. Nếu TID trả về nằm trong một page đã được đánh dấu như vậy, index-only scan bỏ qua hẳn việc đọc heap. Nhưng 37 trong số 420 dòng của Q2 rơi vào các page CHƯA được đánh dấu all-visible — có thể vì chúng vừa mới được ghi và chưa kịp vacuum — nên với riêng 37 dòng đó, executor buộc phải Heap Fetches, đọc trực tiếp heap tuple để tự kiểm tra visibility.",
    redFlags: [
      "Nghĩ Q1 phải là index-only scan vì điều kiện dùng cả hai cột của index",
      "Cho rằng Heap Fetches khác 0 nghĩa là index-only scan 'thất bại' hoàn toàn và tệ như index scan thường",
      "Không giải thích được vì sao Q4 không dùng được index dù index có chứa cả cột b",
    ],
    probes: [
      "Nếu chạy VACUUM orders trước Q2, Heap Fetches có khả năng đổi thế nào?",
      "Có thể ép planner dùng index cho Q4 bằng cách nào, và tại sao nó vẫn chậm hơn Seq Scan?",
      "Nếu đổi thứ tự index thành (b, a), Q4 sẽ đổi hành vi ra sao?",
    ],
    refs: ["pg-20", "pg-25"],
  },
  {
    id: "pg-iq23",
    field: "pg-internals",
    topic: "pg-index",
    level: 3,
    minutes: 12,
    question:
      "Bạn phải chọn loại index — B-tree, GIN, GiST, hoặc BRIN — cho bốn tình huống: kiểm tra bao hàm jsonb bằng @>, tìm kiếm toàn văn, lọc bảng log append-only theo thời gian, và ràng buộc không cho hai khoảng thời gian đặt phòng chồng lấn trên cùng một phòng. So sánh đánh đổi giữa bốn loại index cho các tình huống này.",
    tradeoffs: [
      {
        option: "B-tree",
        when: "Không phải lựa chọn tốt cho bất kỳ tình huống nào trong bốn tình huống trên khi dùng trực tiếp — nó chỉ hỗ trợ năm toán tử so sánh trên giá trị vô hướng có thứ tự, không hiểu toán tử 'chứa' trên jsonb, không tách được từ trong văn bản, và không tự nhiên biểu diễn được ràng buộc chồng lấn khoảng; nhưng vẫn hữu ích gián tiếp qua các extension btree_gist/btree_gin khi cần trộn một cột so sánh thường vào một index GiST hoặc GIN đa cột.",
      },
      {
        option: "GIN",
        when: "Đúng lựa chọn cho kiểm tra bao hàm jsonb bằng @> (operator class jsonb_ops hoặc jsonb_path_ops) và cho tìm kiếm toàn văn (operator class tsvector_ops) — GIN tách giá trị phức hợp thành các phần tử rồi ánh xạ từng phần tử tới danh sách TID, cho độ chính xác tìm kiếm cao; đổi lại cập nhật chậm hơn hẳn B-tree vì một dòng có thể đóng góp nhiều phần tử cùng lúc vào cây, dù fastupdate và pending list giảm bớt chi phí này với cái giá đọc chậm hơn.",
      },
      {
        option: "GiST",
        when: "Phù hợp cho ràng buộc không chồng lấn — EXCLUDE USING gist với toán tử && trên một range type biểu diễn khoảng đặt phòng — vì GiST hỗ trợ strategy 'chồng lấn' mà B-tree và hash không có; cũng dùng được cho tìm kiếm toàn văn qua cây chữ ký (kém chính xác hơn GIN, sinh dương tính giả phải kiểm tra lại) khi tốc độ ghi quan trọng hơn độ chính xác đọc; không phù hợp cho log append-only lọc theo thời gian vì kích thước GiST tỉ lệ với số dòng, không gọn bằng BRIN cho dữ liệu khổng lồ chỉ cần lọc thô.",
      },
      {
        option: "BRIN",
        when: "Lý tưởng cho log append-only lọc theo thời gian trên bảng cực lớn: mỗi block range chỉ lưu giá trị nhỏ nhất/lớn nhất của thời gian, kích thước index nhỏ hơn B-tree hàng trăm tới hàng nghìn lần, hiệu quả cao MIỄN LÀ correlation giữa thời gian và vị trí vật lý cao — đúng bản chất của log append-only vì dòng mới luôn nối vào cuối file; không dùng được cho jsonb @>, tìm kiếm toàn văn hay ràng buộc chồng lấn vì BRIN không lưu TID từng dòng, chỉ trả về bitmap lossy theo cả range.",
      },
    ],
    mustCover: [
      "jsonb @> nên dùng GIN với operator class jsonb_ops (index từng khoá/giá trị/phần tử mảng riêng lẻ của tài liệu) hoặc jsonb_path_ops (index cả path, nhỏ gọn và chính xác hơn nhưng chỉ tăng tốc được @>, @? và @@)",
      "Tìm kiếm toàn văn nên dùng GIN với operator class tsvector_ops vì độ chính xác tìm kiếm cao hơn GiST hẳn, chỉ đánh đổi bằng tốc độ cập nhật chậm hơn — GiST vẫn là lựa chọn hợp lý nếu dữ liệu bị cập nhật liên tục và cần ưu tiên tốc độ ghi hơn độ chính xác đọc",
      "Log append-only lọc theo thời gian nên dùng BRIN trên cột thời gian, tận dụng correlation cao có được tự nhiên từ việc dữ liệu chỉ được nối thêm theo thứ tự thời gian — kích thước index nhỏ hơn nhiều bậc so với B-tree trên cùng cột, đổi lấy kết quả không chính xác tuyệt đối phải kiểm tra lại từng dòng trong các block range được chọn",
      "Ràng buộc không chồng lấn giữa các khoảng thời gian đặt phòng cùng một phòng cần một exclusion constraint dùng GiST, ví dụ EXCLUDE USING gist (room_id WITH =, during WITH &&) với extension btree_gist để cho phép so sánh đẳng thức room_id cùng lớp GiST với toán tử && trên range — B-tree không hỗ trợ khái niệm chồng lấn, còn GIN và BRIN không hỗ trợ exclusion constraint",
      "Không loại index nào thắng cả bốn tình huống: lựa chọn phụ thuộc dữ liệu có cần 'chứa phần tử' (GIN), có ràng buộc hình học/khoảng (GiST), có kích thước khổng lồ với correlation vật lý cao (BRIN), hay chỉ cần so sánh giá trị vô hướng thông thường (B-tree)",
    ],
    model:
      "Bốn tình huống này thực ra là bốn bài kiểm tra khác nhau cho câu hỏi 'dữ liệu của tôi có hình dạng gì', và mỗi loại index chỉ giỏi đúng một hình dạng. Với jsonb @>, tôi cần kiểm tra một tài liệu jsonb có 'chứa' một tập khoá/giá trị con hay không — đây đúng là bài toán GIN được sinh ra để giải: nó tách một giá trị phức hợp thành các phần tử rời rạc rồi ánh xạ mỗi phần tử tới danh sách TID chứa nó. Operator class jsonb_ops index mọi khoá, giá trị và phần tử mảng của tài liệu, hỗ trợ rộng nhất; jsonb_path_ops chỉ index toàn bộ path từ gốc tới giá trị, nhỏ gọn và chính xác hơn nhưng chỉ tăng tốc được đúng ba toán tử @>, @? và @@ — tôi chọn jsonb_path_ops nếu chỉ cần đúng những toán tử này. Với tìm kiếm toàn văn, GIN với operator class tsvector_ops cũng là lựa chọn mặc định đúng đắn, vì độ chính xác tìm kiếm của nó vượt hẳn GiST — GiST dựa trên cây chữ ký (signature tree) vốn có thể sinh dương tính giả cần kiểm tra lại bằng bảng. Cái giá của GIN là tốc độ cập nhật chậm hơn hẳn B-tree, vì một dòng văn bản mới có thể đóng góp hàng chục lexeme cùng lúc vào cây, mỗi lexeme là một lần sửa cấu trúc index; nếu dữ liệu bị cập nhật cực kỳ tích cực và tốc độ ghi quan trọng hơn độ chính xác đọc, tôi mới cân nhắc chuyển sang GiST để đánh đổi lấy ghi nhanh hơn. Với bảng log append-only lọc theo thời gian, tôi chọn hẳn sang một hướng khác: BRIN. Vì dữ liệu log chỉ được nối thêm vào cuối file theo đúng thứ tự thời gian, correlation giữa giá trị cột thời gian và vị trí vật lý trên đĩa gần như hoàn hảo một cách tự nhiên — đúng điều kiện tiên quyết để BRIN hoạt động tốt. BRIN chỉ lưu giá trị nhỏ nhất và lớn nhất của mỗi block range (mặc định 128 page) thay vì TID của từng dòng, nên kích thước index nhỏ hơn B-tree trên cùng cột tới hàng trăm, có khi hàng nghìn lần — cái giá là kết quả trả về luôn là một bitmap lossy theo cả range, cần kiểm tra lại từng dòng trong các range được chọn, nhưng với một bảng log khổng lồ, đánh đổi này gần như luôn đáng giá. Tình huống cuối, ràng buộc không cho hai khoảng thời gian đặt phòng cùng một phòng chồng lấn nhau, cần một cơ chế hoàn toàn khác cả ba loại trên: một exclusion constraint. Chỉ GiST mới có strategy 'chồng lấn' (toán tử &&) cần thiết cho việc này — tôi định nghĩa EXCLUDE USING gist (room_id WITH =, during WITH &&), trong đó during là một range type (ví dụ tsrange) biểu diễn khoảng thời gian đặt phòng; vì điều kiện đẳng thức trên room_id vốn là 'ngôn ngữ' của B-tree chứ không phải GiST, tôi cần cài extension btree_gist để GiST hiểu được cả toán tử đẳng thức đó trong cùng một index đa cột. B-tree không có khái niệm 'chồng lấn' nên không dùng trực tiếp được; GIN thì luôn trả bitmap và không hỗ trợ thuộc tính CAN EXCLUDE nên không hỗ trợ exclusion constraint; BRIN cũng vậy vì cùng lý do không lưu TID riêng lẻ. Tổng kết lại, không loại index nào thắng cả bốn tình huống — lựa chọn luôn bắt đầu từ câu hỏi dữ liệu cần 'chứa phần tử' hay hình học/khoảng, có kích thước khổng lồ với correlation vật lý cao hay không, hay chỉ đơn giản là so sánh giá trị vô hướng thông thường.",
    redFlags: [
      "Đề xuất B-tree cho jsonb @> hoặc tìm kiếm toàn văn",
      "Chọn BRIN cho ràng buộc chồng lấn hoặc cho tìm kiếm toàn văn",
      "Không nhắc tới correlation khi giải thích vì sao BRIN phù hợp cho log append-only",
      "Nghĩ GIN hỗ trợ được exclusion constraint",
    ],
    probes: [
      "Vì sao jsonb_path_ops thường nhỏ gọn và nhanh hơn jsonb_ops nhưng lại hỗ trợ ít toán tử hơn?",
      "Điều gì xảy ra với hiệu quả của BRIN nếu bảng log bị UPDATE nhiều thay vì chỉ INSERT?",
      "Vì sao GIN không hỗ trợ CAN EXCLUDE trong khi GiST thì có?",
    ],
    refs: ["pg-26", "pg-28", "pg-29"],
  },
  {
    id: "pg-iq24",
    field: "pg-internals",
    topic: "pg-index",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Bảng articles có một GIN index trên cột tsvector phục vụ tìm kiếm toàn văn. Độ trễ ghi (INSERT/UPDATE bài viết) thỉnh thoảng nhảy vọt lên gấp chục lần bình thường trong vài trăm mili giây, không theo chu kỳ cố định. Một số truy vấn tìm kiếm toàn văn cũng thỉnh thoảng chậm bất thường dù bảng không hề lớn hơn mọi khi.",
      scale:
        "Bảng articles khoảng 3 triệu dòng, khoảng 40 lượt INSERT/UPDATE bài viết mỗi phút vào giờ cao điểm biên tập. GIN index dùng storage parameter mặc định (fastupdate = on, gin_pending_list_limit mặc định 4MB). Không có job nền nào chủ động gọi vacuum ngoài autovacuum theo lịch thông thường.",
      constraints:
        "Không thể tắt tìm kiếm toàn văn hoặc chuyển sang extension ngoài trong tuần này. Không được chấp nhận độ trễ ghi tăng vọt ảnh hưởng tới trải nghiệm biên tập viên. Cần một thay đổi cấu hình có thể áp dụng ngay mà không cần rebuild index.",
    },
    question:
      "Độ trễ ghi nhảy vọt không theo chu kỳ cố định, và một số truy vấn tìm kiếm cũng chậm bất thường — cả hai đều liên quan tới cùng một cơ chế của GIN. Giải thích cơ chế đó, chẩn đoán vì sao nó gây ra cả hai triệu chứng, và nêu hướng xử lý.",
    mustCover: [
      "Theo mặc định (fastupdate = on), mỗi lần INSERT/UPDATE, các lexeme mới không được ghi ngay vào cây phần tử chính của GIN mà được thêm nhanh vào một pending list không có thứ tự nằm trong các page riêng ngoài cây — rẻ hơn hẳn sửa trực tiếp cây vì mỗi tài liệu thường đóng góp nhiều lexeme cùng lúc",
      "Khi pending list đầy tới giới hạn gin_pending_list_limit (mặc định 4MB), toàn bộ nội dung của nó phải được merge vào cây phần tử chính trong MỘT lần — đây chính là thao tác gây ra đợt trễ ghi đột biến: bất kỳ INSERT/UPDATE nào vô tình làm đầy pending list đều phải gánh chi phí merge đồng bộ ngay trong transaction của chính nó, nên độ trễ tăng vọt không theo chu kỳ cố định mà theo tốc độ tích luỹ lexeme thực tế",
      "Cùng một pending list cũng là nguyên nhân của các truy vấn đọc chậm bất thường: mọi lần tìm kiếm phải quét cả cây phần tử chính LẪN toàn bộ pending list không có thứ tự để không bỏ sót cập nhật gần đây — pending list càng lớn (gần chạm giới hạn) thì phần quét thêm này càng tốn thời gian",
      "Việc merge cũng có thể được thực hiện bất đồng bộ trong lúc vacuum index, nhưng nếu không có job chủ động gọi vacuum thường xuyên, phần lớn việc merge sẽ dồn vào đúng lúc một INSERT/UPDATE làm đầy pending list, khiến chi phí đó luôn rơi vào đường ghi của người dùng thay vì được san sẻ ra nền",
      "Hướng xử lý không cần rebuild index: giảm gin_pending_list_limit riêng cho index này bằng ALTER INDEX ... SET để mỗi lần merge nhỏ hơn và đều đặn hơn, đồng thời gọi gin_clean_pending_list định kỳ hoặc vacuum bảng thường xuyên hơn để chủ động dọn pending list trong lúc nền thay vì để nó dồn vào đường ghi của biên tập viên; cân nhắc tắt fastupdate nếu chấp nhận mỗi lần ghi chậm đều đặn hơn để đổi lấy việc loại bỏ hẳn đợt trễ đột biến",
    ],
    model:
      "Cả hai triệu chứng — độ trễ ghi nhảy vọt không đều và độ trễ đọc thỉnh thoảng tăng bất thường — đều bắt nguồn từ đúng một cơ chế: pending list của GIN, được bật mặc định qua storage parameter fastupdate = on. Vì mỗi tài liệu mới thường đóng góp hàng chục lexeme cùng lúc vào index, việc sửa trực tiếp cây phần tử chính của GIN cho mọi lexeme đó ngay lập tức sẽ rất tốn kém. Thay vào đó, các lexeme mới được thêm nhanh vào một pending list không có thứ tự, nằm trong các page riêng biệt ngoài cây chính — chèn vào một danh sách không cần sắp xếp rẻ hơn nhiều so với sửa cấu trúc B-tree bên trong của cây phần tử. Nhưng pending list không thể phình vô hạn: khi nó đầy tới giới hạn gin_pending_list_limit (mặc định 4MB), toàn bộ nội dung của nó phải được merge vào cây phần tử chính trong đúng MỘT lần. Đây chính là nguồn gốc của đợt trễ ghi đột biến: bất kỳ INSERT hay UPDATE nào — hoàn toàn ngẫu nhiên về mặt thời điểm — vô tình là thao tác làm pending list vượt ngưỡng sẽ phải gánh toàn bộ chi phí merge đó NGAY TRONG transaction của chính nó, khiến độ trễ của đúng transaction xui xẻo đó tăng vọt lên gấp chục lần, còn những transaction khác thì hoàn toàn bình thường — giải thích tại sao đợt trễ không theo chu kỳ cố định nào mà theo tốc độ tích luỹ lexeme thực tế của việc biên tập. Cùng một pending list cũng chính là thủ phạm của các truy vấn đọc chậm bất thường: để không bỏ sót bất kỳ cập nhật gần đây nào, MỌI lần tìm kiếm toàn văn đều phải quét cả cây phần tử chính LẪN toàn bộ pending list không có thứ tự — và pending list càng lớn (càng gần chạm ngưỡng 4MB trước khi bị merge) thì phần quét thêm này càng tốn thời gian, nên độ trễ đọc dao động theo đúng kích thước pending list tại từng thời điểm chứ không cố định. Sách có nhắc rằng việc merge cũng có thể được thực hiện bất đồng bộ trong lúc vacuum index chạy nền, nhưng trong tình huống này không có job nào chủ động gọi vacuum thường xuyên ngoài lịch autovacuum thông thường — nên phần lớn việc merge bị dồn vào đúng lúc một INSERT/UPDATE của biên tập viên vô tình làm đầy pending list, thay vì được san sẻ ra một tiến trình nền vô hại. Vì ràng buộc cấm rebuild index và cấm tắt tìm kiếm toàn văn, hướng xử lý của tôi là: giảm gin_pending_list_limit riêng cho index này bằng ALTER INDEX articles_tsv_idx SET (gin_pending_list_limit = '512kB') — áp dụng ngay không cần rebuild — để mỗi lần merge nhỏ và đều đặn hơn nhiều thay vì một lần merge lớn bất ngờ; đồng thời lên lịch gọi gin_clean_pending_list('articles_tsv_idx') định kỳ (hoặc tăng tần suất vacuum trên bảng articles) để chủ động dọn pending list trong lúc nền, giảm khả năng một transaction ghi của biên tập viên vô tình phải gánh chi phí merge. Nếu vẫn chưa đủ, tôi mới cân nhắc tắt hẳn fastupdate cho index này — chấp nhận mỗi lần ghi chậm hơn đều đặn một chút (vì mọi lexeme đều sửa trực tiếp cây chính ngay lập tức) để đổi lấy việc loại bỏ hoàn toàn đợt trễ đột biến khó lường.",
    redFlags: [
      "Kết luận ngay là do bảng phình to hoặc thiếu VACUUM FREEZE mà không nhắc tới fastupdate và pending list",
      "Đề xuất tắt hẳn GIN index để tránh trễ ghi, bỏ qua ràng buộc vẫn phải giữ tìm kiếm toàn văn",
      "Không giải thích được vì sao CẢ ghi lẫn đọc đều bị ảnh hưởng bởi cùng một cơ chế",
      "Đề xuất rebuild index trong khi ràng buộc đã cấm thay đổi cần rebuild",
    ],
    probes: [
      "Vì sao việc merge pending list trong tình huống này lại xảy ra 'đồng bộ' thay vì luôn chạy nền qua vacuum?",
      "gin_clean_pending_list làm gì khác so với việc chờ pending list tự đầy rồi merge?",
      "Nếu tắt hẳn fastupdate, đánh đổi cụ thể là gì cho mỗi lần ghi?",
    ],
    refs: ["pg-28"],
  },
];
