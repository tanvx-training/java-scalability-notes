// Lộ trình đọc Designing Data-Intensive Applications — Phần 2 (Tuần 7–12).
//
// Nguồn: bản dịch tiếng Việt "Designing Data-Intensive Applications", ấn bản 2
// (Martin Kleppmann, O'Reilly). Thư mục nguồn: ddia-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (dd-w<N> / dd-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const ddiaWeeksPart2 = [
  {
    id: "dd-w7",
    week: "Tuần 7",
    title: "Transaction — ACID, isolation yếu, serializability",
    goal: "Nói được mức cô lập bạn đang chạy thật sự ngăn được race condition nào, và chọn được cách chữa cho những race condition nó để lọt.",
    practice: "Đây là tuần nặng nhất cả lộ trình: chương 8 khoảng 33 nghìn từ, gấp ba chương 7 của tuần trước. Sách cố ý không cắt chương này làm đôi vì nó là một mạch lập luận liền — mỗi mục dựng trên mục trước, và nếu bạn nhảy cóc vào Serializability mà chưa đọc write skew thì phần đó mất hết ý nghĩa. Cách đọc gọn nhất là chia năm buổi, mỗi buổi một mục dưới đây. Phần việc tay chân: mở database bạn đang chạy và tra mức cô lập mặc định của nó bằng truy vấn, không bằng trí nhớ; đối chiếu với Bảng 8-1 để liệt kê các bất thường mức đó để lọt. Rồi mở hai session psql (hoặc mysql) và tự dựng lại một lost update và một write skew bằng tay — gõ từng lệnh, xem chúng thật sự xảy ra.",
    resources: [
      { label: "DDIA 08 — Transaction", href: "#/docs/ddia-08" },
      { label: "postgresql.org — Transaction Isolation", href: "https://www.postgresql.org/docs/current/transaction-iso.html" },
    ],
    items: [
      {
        id: "dd-w7-1",
        text: "ACID nghĩa là gì — và không nghĩa là gì",
        lesson: `**Mục tiêu.** Phát biểu chính xác từng chữ trong ACID theo đúng nghĩa sách dùng, và nói được vì sao một hệ thống "tuân thủ ACID" chưa cho bạn biết gì nhiều.

**Đọc.** [Transaction chính xác là gì?](#/docs/ddia-08) kể lịch sử System R 1975 và làn sóng NoSQL bỏ transaction — đọc lướt, nhưng dừng ở đoạn nói niềm tin "transaction không thể mở rộng" đã được chứng minh là sai. [Ý nghĩa của ACID](#/docs/ddia-08) là trọng tâm, với bốn mục con: [Atomicity](#/docs/ddia-08), [Consistency](#/docs/ddia-08) — chép ra năm nghĩa của chữ *consistency* mà sách liệt kê, bạn sẽ va phải cả năm trong ba tuần tới — [Isolation](#/docs/ddia-08) với Hình 8-1, và [Durability](#/docs/ddia-08). Khung [REPLICATION VÀ DURABILITY](#/docs/ddia-08) đọc chậm: sáu gạch đầu dòng về những cách durability hỏng thật. Rồi [Thao tác đơn đối tượng và đa đối tượng](#/docs/ddia-08) cùng ba mục con, khép bằng [Xử lý lỗi và abort](#/docs/ddia-08) — năm gạch đầu dòng cuối nói vì sao "cứ thử lại" chưa phải câu trả lời đầy đủ.

**Bẫy.** Đọc chữ *atomicity* trong ACID theo nghĩa đa luồng. Sách tách bạch dứt khoát: trong ngữ cảnh ACID, atomicity *không* nói về tính đồng thời — điều đó thuộc về chữ *I* — nó chỉ mô tả chuyện gì xảy ra khi một lỗi ập đến giữa chừng một chuỗi ghi, và sách còn nói *abortability* có lẽ là thuật ngữ tốt hơn. Bẫy thứ hai: tin vào nhãn "tuân thủ ACID". Sách nói thẳng rằng cách triển khai khác nhau giữa các database, có rất nhiều mơ hồ quanh chữ *isolation*, và đáng tiếc là ACID đã trở thành chủ yếu một thuật ngữ marketing — còn BASE thì mơ hồ hơn nữa, định nghĩa hợp lý duy nhất của nó là "không phải ACID".

**Tự kiểm tra.** Vì sao sách nói chữ *C* thường không phải là một thuộc tính của riêng database? Và các "lightweight transaction" của Cassandra bảo đảm gì, không bảo đảm gì?`,
      },
      {
        id: "dd-w7-2",
        text: "Read committed và snapshot isolation, cài bằng MVCC",
        lesson: `**Mục tiêu.** Dựng lại được bốn quy tắc hiển thị của MVCC cho một transaction cụ thể, và vì sao tên gọi "repeatable read" không nói cho bạn biết điều gì.

**Đọc.** Mở [Các mức cô lập yếu (Weak Isolation Levels)](#/docs/ddia-08) — đoạn dẫn kể isolation yếu làm phá sản một sàn giao dịch Bitcoin, và nhắc rằng kẻ tấn công có thể *cố ý* khai thác lỗ hổng đồng thời. [Read Committed](#/docs/ddia-08) cho hai đảm bảo — không dirty read (Hình 8-4), không dirty write (Hình 8-5, vụ mua xe cũ) — rồi [Triển khai read committed](#/docs/ddia-08). [Snapshot Isolation và Repeatable Read](#/docs/ddia-08) mở bằng read skew ở Hình 8-6, 1.000 đô của Aaliyah thành 900, và hai ca không chấp nhận được: sao lưu, và truy vấn phân tích. Trọng tâm kỹ thuật là [Điều khiển đồng thời đa phiên bản (multiversion concurrency control)](#/docs/ddia-08) với Hình 8-7 (\`inserted_by\`, \`deleted_by\`) và [Các quy tắc hiển thị (visibility rules) để quan sát một snapshot nhất quán](#/docs/ddia-08) — bốn quy tắc đánh số, tự áp vào Hình 8-7 cho tới khi ra đúng kết quả. Kết bằng [Index và snapshot isolation](#/docs/ddia-08) và mục cuối về sự nhầm lẫn tên gọi.

**Bẫy.** Đọc tên mức cô lập rồi tưởng đã biết mình được gì. Sách bày ra đúng mớ hỗn độn: snapshot isolation được PostgreSQL gọi là "repeatable read" và Oracle gọi là "serializable"; ở MySQL "repeatable read" yếu hơn snapshot isolation; Db2 dùng chính chữ đó để chỉ serializability — sách kết luận không ai thực sự biết repeatable read nghĩa là gì. Bẫy thứ hai: chặn dirty read bằng cách bắt mọi lần đọc phải giành lock. Sách nói cách đó không hoạt động tốt trong thực tế: một transaction ghi chạy lâu buộc hàng loạt transaction chỉ đọc phải chờ, gây hiệu ứng dây chuyền sang phần hoàn toàn khác của ứng dụng.

**Tự kiểm tra.** Vì sao chuẩn SQL không có khái niệm snapshot isolation? Và câu châm ngôn "người đọc không bao giờ chặn người ghi" đến từ đâu trong cách MVCC lưu dữ liệu?`,
      },
      {
        id: "dd-w7-3",
        text: "Lost update, write skew và phantom — ba bug isolation yếu để lọt",
        lesson: `**Mục tiêu.** Nhận ra được khuôn mẫu ba bước sinh ra write skew trong mã của chính bạn, và chọn đúng biện pháp chữa cho từng loại xung đột ghi.

**Đọc.** [Ngăn chặn Lost Update](#/docs/ddia-08) quay lại Hình 8-1 rồi liệt kê các cách chữa, mỗi cách một mục con: thao tác ghi nguyên tử, [Khóa tường minh (explicit locking)](#/docs/ddia-08) với Ví dụ 8-1 và \`FOR UPDATE\`, tự động phát hiện lost update, và [Ghi có điều kiện (conditional write, compare-and-set)](#/docs/ddia-08); mục cuối về giải quyết xung đột và replication nối thẳng về CRDT và LWW ở tuần 5. Nửa sau là [Write Skew và Phantom](#/docs/ddia-08): hai bác sĩ cùng bỏ ca trực ở Hình 8-8, rồi [Đặc trưng của write skew](#/docs/ddia-08) — đọc kỹ câu nói write skew là dạng tổng quát hóa của lost update. [Thêm các ví dụ về write skew](#/docs/ddia-08) đưa bốn ca nữa (đặt phòng họp, trò chơi nhiều người chơi, giành username, chi tiêu hai lần); [Phantom gây ra write skew](#/docs/ddia-08) rút chúng về một khuôn mẫu ba bước — chép ba bước đó ra. Kết bằng [Vật chất hóa xung đột (materializing conflicts)](#/docs/ddia-08).

**Bẫy.** Cho rằng cứ dùng snapshot isolation thì lost update sẽ tự được phát hiện. Sách nêu đích danh: repeatable read của PostgreSQL, serializable của Oracle và snapshot isolation của SQL Server tự phát hiện và abort, còn repeatable read của MySQL/InnoDB thì *không* — và một số tác giả lập luận rằng theo định nghĩa đó MySQL không cung cấp snapshot isolation. Bẫy thứ hai: rải \`SELECT FOR UPDATE\` khắp nơi rồi coi như đã chặn được write skew. Sách chỉ đúng chỗ gãy: bốn ví dụ còn lại kiểm tra sự *không tồn tại* của hàng khớp điều kiện, và nếu truy vấn không trả về hàng nào thì \`SELECT FOR UPDATE\` không có gì để gắn lock vào.

**Tự kiểm tra.** Vì sao sách xếp materializing conflicts vào loại phương án cuối cùng? Và trong bốn ví dụ write skew, ca nào có một giải pháp đơn giản không cần serializable isolation?`,
      },
      {
        id: "dd-w7-4",
        text: "Ba đường tới serializability: thực thi tuần tự, 2PL, SSI",
        lesson: `**Mục tiêu.** Chọn được một trong ba kỹ thuật serializability cho một workload cụ thể, và nói được cái giá riêng của từng kỹ thuật thay vì chỉ nói "serializable thì chậm".

**Đọc.** [Serializability](#/docs/ddia-08) mở bằng ba lý do khiến isolation yếu là một tình cảnh đáng buồn, rồi nêu đúng ba kỹ thuật mà phần còn lại của chương khai triển. [Thực thi tuần tự thực sự](#/docs/ddia-08) giải thích hai bước phát triển khiến vòng lặp đơn thread trở nên khả thi, kèm stored procedure ở Hình 8-9, phần về sharding — con số khoảng 1.000 thao tác ghi liên shard mỗi giây của VoltDB đáng ghi lại — và bốn ràng buộc ở mục tóm tắt. [Two-Phase Locking (Khóa hai pha)](#/docs/ddia-08) cùng bốn quy tắc khóa (shared mode, exclusive mode, hai pha growing và shrinking), [Hiệu năng của 2PL](#/docs/ddia-08), rồi predicate lock và [Index-range lock (khóa theo khoảng index)](#/docs/ddia-08). Đóng lại bằng [Serializable Snapshot Isolation](#/docs/ddia-08) với [Kiểm soát đồng thời bi quan (pessimistic) so với lạc quan (optimistic)](#/docs/ddia-08), [Quyết định dựa trên một tiền đề đã lỗi thời](#/docs/ddia-08) — chữ *tiền đề* là chìa khóa cả mục — và hai cơ chế phát hiện ở Hình 8-10 và 8-11.

**Bẫy.** Lẫn 2PL với 2PC vì cái tên. Sách dành hẳn một khung cảnh báo: 2PL cung cấp serializable isolation còn 2PC cung cấp atomic commit trong database phân tán, và lời khuyên là xem chúng là hai khái niệm hoàn toàn tách biệt. Bẫy thứ hai: chọn SSI vì "lạc quan thì nhanh hơn". Sách đặt điều kiện rõ: kiểm soát đồng thời lạc quan hoạt động kém khi tranh chấp cao, vì tỷ lệ abort tăng; và nếu hệ thống đã gần thông lượng tối đa, tải từ các transaction được thử lại còn làm hiệu năng tệ hơn.

**Tự kiểm tra.** Vì sao SSI chờ đến lúc commit mới abort chứ không abort ngay khi phát hiện đọc cũ? Và index-range lock đánh đổi cái gì so với predicate lock?`,
      },
      {
        id: "dd-w7-5",
        text: "Transaction phân tán và 2PC",
        lesson: `**Mục tiêu.** Kể lại được sáu bước của 2PC cùng hai điểm không thể quay lại, và vì sao một transaction in doubt làm tê liệt cả một mảng ứng dụng.

**Đọc.** [Transaction phân tán](#/docs/ddia-08) mở bằng nhận xét then chốt: trên một node, chính thứ tự ghi xuống đĩa — dữ liệu trước, commit record sau — là thứ làm commit trở nên nguyên tử; Hình 8-12 cho thấy điều đó gãy thế nào khi có nhiều node. [Two-Phase Commit](#/docs/ddia-08) cho luồng cơ bản ở Hình 8-13 và vai trò coordinator; [Một hệ thống của những lời hứa](#/docs/ddia-08) là mục đọc chậm nhất chương — gõ lại cả sáu bước đánh số, chú ý bước 4 (participant từ bỏ quyền abort) và bước 5 (commit point). [Sự cố của coordinator](#/docs/ddia-08) với Hình 8-14 định nghĩa trạng thái in doubt. Rồi [Transaction phân tán trên các hệ thống khác nhau](#/docs/ddia-08) tách hai loại — nội bộ database và không đồng nhất — với năm mục con, trong đó [Giữ lock trong khi ở trạng thái in doubt](#/docs/ddia-08) là mục quan trọng nhất. Kết bằng [Distributed transaction nội bộ trong database](#/docs/ddia-08), [Nhìn lại xử lý thông điệp exactly-once](#/docs/ddia-08) và [Tóm tắt](#/docs/ddia-08).

**Bẫy.** Coi transaction in doubt là chuyện nhỏ, cứ để đó rồi dọn sau. Sách nói vấn đề nằm ở lock: transaction phải giữ lock suốt thời gian in doubt, coordinator mất 20 phút khởi động lại thì lock bị giữ 20 phút, còn nếu log của coordinator mất hẳn thì lock bị giữ *mãi mãi* — nhiều mảng lớn của ứng dụng trở nên không sẵn sàng. Bẫy thứ hai: kéo 2PC vào chỉ để có exactly-once giữa message broker và database. Sách chỉ ra bạn không cần distributed transaction: một bảng ID thông điệp đã xử lý cộng transaction nội bộ database là đủ, vì nó làm việc xử lý trở nên idempotent.

**Tự kiểm tra.** *Heuristic decision* trong XA thực chất là uyển ngữ cho điều gì? Và vì sao database "NewSQL" dùng 2PC mà không dính các vấn đề của XA?`,
      },
    ],
  },
  {
    id: "dd-w8",
    week: "Tuần 8",
    title: "Những rắc rối của hệ phân tán",
    goal: "Phát biểu được những gì một node thật sự biết và không thể biết về các node khác, và chọn được biện pháp phòng vệ đúng cho từng giả định bị phá.",
    practice: "Lấy một dịch vụ bạn đang chạy và làm ba việc đo được. Một: tìm mọi chỗ trong mã dùng thời gian đồng hồ treo tường để đo khoảng thời gian hoặc để so sánh thứ tự sự kiện giữa các máy, và đánh dấu từng chỗ là monotonic clock hay logical clock mới đúng. Hai: tìm timeout phát hiện lỗi đang được cấu hình, lấy phân phối round-trip time thật trong 7 ngày từ dashboard, rồi ghi ra timeout đó tương ứng với percentile nào. Ba: liệt kê mọi chỗ hệ thống giả định \"chỉ một node đang làm việc này\" — leader, cron, job xử lý file — và với mỗi chỗ ghi rõ nó có fencing token hay không; chỗ nào không có, viết ra hậu quả nếu chủ lease cũ sống lại.",
    resources: [
      { label: "DDIA 09 — Những rắc rối của hệ phân tán", href: "#/docs/ddia-09" },
      { label: "jepsen.io — Analyses", href: "https://jepsen.io/analyses" },
    ],
    items: [
      {
        id: "dd-w8-1",
        text: "Hỏng hóc một phần — thứ làm hệ phân tán khác hẳn máy đơn",
        lesson: `**Mục tiêu.** Phát biểu được vì sao một máy đơn hoặc chạy đúng hoặc hỏng hẳn còn hệ phân tán thì không, và gọi tên tính chất khiến hỏng hóc một phần khó xử lý.

**Đọc.** [Lỗi và hỏng hóc một phần](#/docs/ddia-09) là mục ngắn nhất chương nhưng đặt nền cho mọi thứ sau đó — đọc trọn. Ba đoạn đầu mô tả hợp đồng ngầm của máy đơn: cùng một thao tác luôn cho cùng kết quả, phần cứng hỏng thì hệ thống sập hẳn chứ không trả kết quả sai. Sách nhấn đó là một *lựa chọn có chủ ý trong thiết kế*, rồi ngay sau thừa nhận mô hình lý tưởng ấy không đúng — dữ liệu vẫn hỏng âm thầm và CPU đôi khi trả kết quả sai, chỉ là hiếm đủ để bỏ qua. Trích dẫn của Coda Hale liệt kê những thứ đã thực sự hỏng trong một datacenter, kể cả chiếc xe bán tải lao vào hệ thống HVAC. Hai đoạn cuối định nghĩa *partial failure* rồi lật ngược vấn đề: chính khả năng chịu nó cho phép rolling upgrade, và dựng hệ thống đáng tin cậy từ thành phần không đáng tin cậy.

**Bẫy.** Nghĩ rằng xác suất nhỏ thì bỏ qua được. Sách bác thẳng ngay đoạn mở chương: không quan trọng nếu xác suất chỉ là một phần triệu — trong một hệ thống đủ lớn, các sự kiện một-phần-triệu xảy ra mỗi ngày, và bất cứ điều gì *có thể* hỏng thì *sẽ* hỏng. Bẫy thứ hai: giả định sau mỗi thao tác bạn luôn biết nó đã thành công hay chưa. Sách cảnh báo ngay ở mục này: việc gì liên quan đến nhiều node và mạng đều có thể lúc thành lúc bại không đoán trước — và bạn thậm chí không *biết* nó đã thành công hay chưa.

**Tự kiểm tra.** Vì sao sách gọi tính bất định — chứ không phải bản thân việc có lỗi — là thứ khiến hệ phân tán khó làm? Và khả năng chịu hỏng hóc một phần mở ra thao tác vận hành nào?`,
      },
      {
        id: "dd-w8-2",
        text: "Mạng không đáng tin cậy — và timeout đặt bao nhiêu là đúng",
        lesson: `**Mục tiêu.** Giải thích được vì sao không tồn tại giá trị timeout đúng về lý thuyết, và cách sách khuyên chọn timeout thay vào đó.

**Đọc.** [Mạng không đáng tin cậy](#/docs/ddia-09) mở bằng sáu điều có thể trục trặc với một cặp request/response và Hình 9-1 — ba khả năng không phân biệt được. [Những hạn chế của TCP](#/docs/ddia-09) sửa lại ấn tượng sai phổ biến nhất về chữ "đáng tin cậy". [Lỗi mạng trong thực tế](#/docs/ddia-09) cho các con số đáng chép: một datacenter cỡ trung ghi nhận khoảng 12 lỗi mạng mỗi tháng, nửa ngắt một máy nửa ngắt cả rack; giữa các cloud region đã quan sát được round-trip time lên tới vài *phút* ở percentile cao. [Phát hiện lỗi](#/docs/ddia-09) rồi [Timeout và độ trễ không giới hạn](#/docs/ddia-09) là trọng tâm — tự tính lại công thức 2*d* + *r* và hiểu vì sao nó không dùng được; ba mục con sau đó giải thích nguồn gốc jitter. [Mạng đồng bộ so với mạng bất đồng bộ](#/docs/ddia-09) đọc vừa phải, nhưng khung [ĐỘ TRỄ VÀ MỨC SỬ DỤNG TÀI NGUYÊN](#/docs/ddia-09) thì đọc kỹ.

**Bẫy.** Coi "TCP đáng tin cậy" là đã xong chuyện xử lý lỗi. Sách nói rõ: khi một kết nối TCP đóng với lỗi, bạn không có cách nào biết bao nhiêu dữ liệu đã thực sự được node ở xa xử lý; và một acknowledgment chỉ nghĩa là kernel bên kia đã nhận được packet — ứng dụng có thể đã crash trước khi xử lý, nên muốn chắc chắn thì cần response khẳng định từ chính ứng dụng. Bẫy thứ hai: hạ timeout xuống cho "phát hiện lỗi nhanh". Sách dựng đúng kịch bản hỏng: node chỉ phản hồi chậm vì quá tải chứ chưa chết, bị tuyên bố chết, tải của nó chuyển sang các node khác, đặt thêm tải lên chúng và lên mạng — hỏng hóc dây chuyền.

**Tự kiểm tra.** Vì sao độ trễ biến động không phải một quy luật tự nhiên mà là kết quả của một đánh đổi? Và Phi Accrual failure detector khác một timeout hằng số ở chỗ nào?`,
      },
      {
        id: "dd-w8-3",
        text: "Đồng hồ không đáng tin cậy: time-of-day so với monotonic",
        lesson: `**Mục tiêu.** Chọn đúng loại đồng hồ cho mỗi câu hỏi về thời gian trong mã của bạn, và nói được vì sao một đồng hồ hỏng khó phát hiện hơn một CPU hỏng.

**Đọc.** [Đồng hồ không đáng tin cậy](#/docs/ddia-09) mở bằng tám câu hỏi ứng dụng thường hỏi về thời gian, tách thành hai nhóm: đo *khoảng thời gian* và mô tả *thời điểm*. Xếp mỗi câu hỏi về thời gian trong mã của bạn vào một trong hai nhóm đó là bài tập ở đây. [Đồng hồ monotonic so với đồng hồ time-of-day](#/docs/ddia-09) có hai mục con: time-of-day (\`CLOCK_REALTIME\`, epoch, giây nhuận, DST) và monotonic (\`CLOCK_MONOTONIC\`, slewing tối đa 0,05%). [Đồng bộ hóa đồng hồ và độ chính xác](#/docs/ddia-09) là mục đọc chậm nhất: bảy gạch đầu dòng về những cách NTP và thạch anh làm bạn thất vọng — Google giả định độ trôi tới 200 ppm, tức 17 giây mỗi ngày nếu chỉ đồng bộ một lần; một thí nghiệm cho sai số tối thiểu 35 ms qua internet; MiFID II buộc các quỹ giao dịch tần suất cao đồng bộ trong 100 micro giây so với UTC. Đọc luôn đoạn mở của [Dựa vào đồng hồ được đồng bộ](#/docs/ddia-09).

**Bẫy.** Dùng đồng hồ time-of-day để đo thời gian đã trôi qua. Sách nói nếu đồng hồ cục bộ chạy trước NTP server quá xa, nó có thể bị buộc đặt lại và trông như nhảy lùi về quá khứ — bước nhảy đó, cùng bước nhảy do giây nhuận, khiến time-of-day không phù hợp cho việc này. Bẫy thứ hai: cho rằng đồng hồ sai sẽ tự lộ ra. Sách đối chiếu thẳng: CPU hỏng hay mạng cấu hình sai thì máy thường ngừng hẳn nên được sửa nhanh; còn thạch anh hỏng hoặc NTP client cấu hình sai thì mọi thứ vẫn có vẻ bình thường trong khi đồng hồ trôi dần — kết quả thường là mất dữ liệu âm thầm, không phải một sự cố sập rõ ràng.

**Tự kiểm tra.** Vì sao so sánh giá trị đồng hồ monotonic từ hai máy khác nhau là vô nghĩa? Và *smearing* giải quyết vấn đề gì?`,
      },
      {
        id: "dd-w8-4",
        text: "Dùng đồng hồ làm thứ tự sự kiện, và khoảng tin cậy",
        lesson: `**Mục tiêu.** Nói được vì sao timestamp không bao giờ là một điểm thời gian, và cách Spanner biến độ bất định của đồng hồ thành một bảo đảm về thứ tự.

**Đọc.** [Timestamp để sắp thứ tự sự kiện](#/docs/ddia-09) bám Hình 9-3: lần ghi *x* = 1 mang timestamp 42,004 giây còn lần tăng xảy ra *sau* nó mang 42,003 — đọc chậm, vì cả mục dựng trên ví dụ độ lệch chưa tới 3 ms. Hai gạch đầu dòng về vấn đề của LWW dựa trên đồng hồ client là phần đáng thuộc nhất. [Giá trị đọc đồng hồ với khoảng tin cậy](#/docs/ddia-09) đưa ý niệm timestamp là một *khoảng* chứ không phải một điểm, với TrueTime của Spanner và Amazon ClockBound trả về cặp \`[earliest, latest]\`. [Đồng hồ được đồng bộ cho snapshot toàn cục](#/docs/ddia-09) nối về MVCC ở tuần 7: Spanner cố ý *chờ* đúng bằng độ rộng khoảng tin cậy trước khi commit, và đặt GPS hoặc đồng hồ nguyên tử tại mỗi datacenter để đồng bộ trong khoảng 7 ms. Khép tuần bằng [Tạm dừng process](#/docs/ddia-09) — đoạn mã lease và tám lý do một thread có thể đứng im rất lâu.

**Bẫy.** Bật LWW với timestamp lấy từ đồng hồ client rồi coi như đã có thứ tự. Sách nói hậu quả bằng chữ rất nặng: các lần ghi có thể biến mất một cách bí ẩn, vì node có đồng hồ chạy chậm không ghi đè được giá trị do node có đồng hồ nhanh hơn ghi trước, cho tới khi khoảng lệch trôi qua — một lượng dữ liệu tùy ý bị loại bỏ âm thầm, không lỗi nào báo cho ứng dụng. Bẫy thứ hai: đọc được micro giây thì tưởng chính xác tới micro giây. Sách nói nếu chỉ biết thời gian với sai số ±100 ms thì các chữ số micro giây là vô nghĩa — tệ hơn, \`clock_gettime\` không cho biết sai số đó bao nhiêu.

**Tự kiểm tra.** Vì sao đồng bộ NTP không thể chính xác đủ để chặn thứ tự sai? Và đoạn mã lease trong mục "Tạm dừng process" sai ở hai chỗ nào?`,
      },
      {
        id: "dd-w8-5",
        text: "Tri thức, sự thật, dối trá: quorum, fencing token, mô hình hệ thống",
        lesson: `**Mục tiêu.** Nói được vì sao một node không được tin phán đoán của chính nó, và fencing token chặn đúng kịch bản hỏng nào.

**Đọc.** [Tri thức, Sự thật và Dối trá](#/docs/ddia-09) mở bằng ý niệm system model. [Đa số quyết định](#/docs/ddia-09) kể ba kịch bản node bị tuyên bố chết oan rồi kết luận: node đơn lẻ phải tuân theo quorum và rút lui. [Lock và Lease phân tán](#/docs/ddia-09) dựng hai ca hỏng — Hình 9-4 (tạm dừng process) và Hình 9-5 (request bị trì hoãn) — rồi [Rào chắn (fencing off) các zombie và request bị trì hoãn](#/docs/ddia-09) đưa lời giải ở Hình 9-6 với token 33 và 34; khung LƯU Ý cho các tên gọi khác của fencing token (sequencer trong Chubby, epoch number trong Kafka, ballot và term number trong Paxos và Raft) mà bạn sẽ gặp lại ở tuần 9. [Byzantine Fault](#/docs/ddia-09) đọc vừa phải. [Mô hình hệ thống và thực tế](#/docs/ddia-09) là mục cần thuộc: ba mô hình thời gian, bốn mô hình hỏng node, và [Phân biệt giữa safety và liveness](#/docs/ddia-09). [Phương pháp hình thức và kiểm thử ngẫu nhiên](#/docs/ddia-09) cho model checking, fault injection và deterministic simulation testing (DST), rồi [Tóm tắt](#/docs/ddia-09).

**Bẫy.** Rào chắn zombie bằng cách tắt nó đi. Sách nói STONITH dù sao cũng không đặc biệt hiệu quả: nó không bảo vệ được trước độ trễ mạng lớn như Hình 9-5, tất cả các node có thể tắt lẫn nhau, và đến khi zombie bị phát hiện thì có thể đã quá muộn vì dữ liệu đã hỏng. Bẫy thứ hai: mong một thuật toán Byzantine fault-tolerant che được bug phần mềm. Sách nói thẳng nếu bạn triển khai cùng một phần mềm lên mọi node thì thuật toán đó không cứu được bạn — muốn chống bug theo cách này, bạn phải có bốn cài đặt độc lập và hy vọng một bug chỉ xuất hiện ở một trong bốn.

**Tự kiểm tra.** Vì sao *tính duy nhất* là safety còn *tính sẵn sàng* là liveness, và điều đó đổi cách ta đòi hỏi ở thuật toán ra sao? Và DST làm được gì mà fault injection không làm được?`,
      },
    ],
  },
  {
    id: "dd-w9",
    week: "Tuần 9",
    title: "Tính nhất quán và consensus",
    goal: "Gọi đúng tên bảo đảm nhất quán mà một thao tác cụ thể cần, và nhận ra khi nào bài toán trước mặt bạn thực chất là consensus.",
    practice: "Lấy hệ thống của bạn và làm hai việc. Một: liệt kê mọi chỗ đang dựa vào một thứ \"duy nhất\" — leader của một shard, một username, một chỗ ngồi, một khóa ngoài, một ID tăng dần — rồi với mỗi chỗ ghi rõ nó có thật sự cần linearizability hay chỉ cần một ràng buộc diễn giải lỏng; chỗ nào cần, kiểm tra xem nó đang dựa vào cái gì để có được điều đó. Hai: tìm mọi bộ sinh ID trong hệ thống, phân loại từng cái theo bốn phương án mà chương 10 liệt kê, và với mỗi cái viết ra nó bảo đảm gì về thứ tự — nếu bạn không trả lời được, đó là một khoảng trống cần đo chứ không phải một chi tiết nhỏ.",
    resources: [
      { label: "DDIA 10 — Tính nhất quán và Consensus", href: "#/docs/ddia-10" },
      { label: "raft.github.io — The Raft Consensus Algorithm", href: "https://raft.github.io/" },
    ],
    items: [
      {
        id: "dd-w9-1",
        text: "Linearizability là gì, và cái giá phải trả",
        lesson: `**Mục tiêu.** Đọc được một biểu đồ thời gian và chỉ ra thao tác nào vi phạm linearizability, rồi nói được vì sao bỏ linearizability thường là quyết định về hiệu năng chứ không phải chịu lỗi.

**Đọc.** [Linearizability](#/docs/ddia-10) mở bằng Hình 10-1 (Aaliyah reo tỷ số, Bryce tải lại thấy trận vẫn đang diễn ra) — ví dụ này quay lại nhiều lần trong chương, hãy nhớ nó. [Điều gì làm cho một hệ thống Linearizable?](#/docs/ddia-10) là mục đọc chậm nhất: Hình 10-2 và 10-3 dựng recency guarantee, rồi Hình 10-4 thêm CAS và đánh dấu điểm mỗi thao tác có hiệu lực; tự chỉ ra vì sao lần đọc cuối của client B không linearizable. Khung [LINEARIZABILITY SO VỚI SERIALIZABILITY](#/docs/ddia-10) là phần quan trọng nhất tuần này, đọc khi tuần 7 còn nóng. [Dựa vào Linearizability](#/docs/ddia-10) cho ba ca dùng: bầu chọn leader, ràng buộc duy nhất, và phụ thuộc thời gian giữa hai kênh giao tiếp ở Hình 10-5. [Triển khai hệ thống linearizable](#/docs/ddia-10) xếp bốn cách replication của chương 6 vào bốn ô, với Hình 10-6. Kết bằng [Cái giá của linearizability](#/docs/ddia-10) với [Định lý CAP](#/docs/ddia-10), khung [ĐỊNH LÝ CAP KHÔNG HỮU ÍCH](#/docs/ddia-10) và [Linearizability và độ trễ mạng](#/docs/ddia-10).

**Bẫy.** Dùng "chọn hai trong ba" làm khung tư duy. Sách nói cách diễn đạt đó gây hiểu nhầm: network partition là một loại lỗi, không phải thứ bạn chọn — phát biểu tốt hơn là *hoặc nhất quán hoặc sẵn sàng khi bị phân mảnh*; và CAP có rất ít giá trị thực tiễn cho việc thiết kế. Bẫy thứ hai: đọc w + r > n như một bảo đảm linearizable. Sách dựng Hình 10-6 với n = 3, w = 3, r = 2: điều kiện quorum được thỏa mãn nhưng quá trình thực thi vẫn không linearizable, và kết luận an toàn nhất là giả định hệ leaderless kiểu Dynamo không cung cấp linearizability, kể cả với quorum.

**Tự kiểm tra.** Vì sao RAM trên một CPU đa nhân hiện đại không linearizable, và điều đó nói gì về lý do người ta bỏ linearizability? Và cần thêm hai việc gì để một quorum kiểu Dynamo trở nên linearizable?`,
      },
      {
        id: "dd-w9-2",
        text: "Bộ sinh ID và đồng hồ logic",
        lesson: `**Mục tiêu.** Xếp một bộ sinh ID bất kỳ vào đúng ô — duy nhất, có thứ tự nhân quả, hay linearizable — và biết ứng dụng của bạn thật sự cần cái nào.

**Đọc.** [Bộ sinh ID và đồng hồ logic (logical clock)](#/docs/ddia-10) mở bằng Hình 10-8: ID tự tăng đơn nút cho luồng chat hợp lý, và sách chỉ ra đó là một hệ linearizable — mỗi lần lấy ID là một fetch-and-add. Rồi ba vấn đề của bộ sinh đơn nút, và bốn phương án thay thế: gán ID theo shard, khối ID cấp phát trước, UUID ngẫu nhiên, và timestamp đồng hồ thực được làm cho duy nhất (UUID v7, Snowflake, ULID). Với mỗi phương án, ghi ra nó mất bảo đảm nào. [Đồng hồ logic (Logical Clock)](#/docs/ddia-10) nêu hai yêu cầu chung, rồi [Lamport timestamp](#/docs/ddia-10) — bám Hình 10-9, tự chạy lại quy tắc tăng counter cho ba node tới khi ra đúng thứ tự (1, "Aaliyah") < (1, "Caleb") < (2, "Bryce"). Hai mục con sau đó, về hybrid logical clock và vector clock, nối về version vector ở tuần 5. Kết bằng [Bộ sinh ID linearizable](#/docs/ddia-10) với Hình 10-10 (bức ảnh riêng tư lọt ra).

**Bẫy.** Thấy Lamport timestamp cho thứ tự toàn phần rồi tưởng đã có linearizability. Sách nói dứt khoát chúng *không* cung cấp linearizability — không phải cách đảm bảo một giá trị là mới nhất, chỉ là cách gán ID sao cho nếu A xảy ra trước B thì ID của A nhỏ hơn; Lamport clock chỉ đảm bảo được với những timestamp mà node đã *nhìn thấy*. Bẫy thứ hai: dùng đồng hồ logic để thực thi ràng buộc duy nhất. Sách chỉ ra phần chưa giải được: để biết timestamp của mình là nhỏ nhất, một node cần nhận tin từ *mọi* node khác có thể đã sinh timestamp — một node hỏng là đủ làm cả hệ thống đình trệ, và đó không phải kiểu chịu lỗi ta cần.

**Tự kiểm tra.** Khi nào bạn buộc phải dùng vector clock thay vì Lamport clock hay hybrid logical clock? Và vì sao không thể shard một bộ sinh ID linearizable?`,
      },
      {
        id: "dd-w9-3",
        text: "Total order broadcast, và vì sao nó tương đương consensus",
        lesson: `**Mục tiêu.** Chuyển được một bài toán trước mặt bạn — CAS, lock, ràng buộc duy nhất, atomic commit — về dạng shared log, và nói được vì sao phép quy đổi đi được cả hai chiều.

**Đọc.** [Consensus](#/docs/ddia-10) mở bằng ba câu hỏi "trên một node thì dễ, chịu lỗi thì khó" và điểm danh bốn thuật toán: Viewstamped Replication, Paxos, Raft và Zab. Khung [TÍNH BẤT KHẢ THI CỦA CONSENSUS](#/docs/ddia-10) dọn hiểu lầm về kết quả FLP — đọc kỹ điều kiện FLP giả định, vì nó là lý do consensus vẫn giải được trong thực tế. [Nhiều bộ mặt của Consensus](#/docs/ddia-10) là trục của cả mục: [Consensus đơn giá trị](#/docs/ddia-10) với bốn thuộc tính (đồng thuận thống nhất, toàn vẹn, hợp lệ, kết thúc) — chép cả bốn, chú ý ba cái đầu là safety còn cái cuối là liveness, đúng cặp khái niệm ở tuần 8. Rồi [Compare-and-set như là consensus](#/docs/ddia-10) và [Shared log như là consensus](#/docs/ddia-10) với năm tính chất, khung LƯU Ý nói shared log có thể triển khai bằng total order broadcast, và bốn bước quy consensus về log — đọc chậm bốn bước đó. Đóng bằng [Fetch-and-add như là consensus](#/docs/ddia-10) và [Atomic commitment như là consensus](#/docs/ddia-10), nối về 2PC ở tuần 7.

**Bẫy.** Gộp fetch-and-add vào cùng nhóm với CAS vì cả hai đều "nguyên tử". Sách tách hẳn: fetch-and-add có *consensus number* là 2 — nó giải được consensus cho đúng hai node, vì node đọc được 0 có thể crash trước khi kịp báo mình thắng, để các node còn lại lơ lửng — còn CAS và shared log có consensus number vô hạn. Bẫy thứ hai: xem atomic commitment chỉ là consensus đổi tên. Sách nêu đúng chỗ khác: với consensus, quyết định bất kỳ giá trị nào đã được đề xuất đều chấp nhận được; còn atomic commitment *bắt buộc* abort nếu bất kỳ participant nào bỏ phiếu abort — đó là tính chất validity, cộng thêm nontriviality vào ba thuộc tính chung.

**Tự kiểm tra.** Vì sao single-leader replication không có failover thỏa mãn safety nhưng trượt liveness? Và làm sao dùng một shared log để triển khai fetch-and-add?`,
      },
      {
        id: "dd-w9-4",
        text: "Thuật toán consensus và dịch vụ điều phối trong thực tế",
        lesson: `**Mục tiêu.** Mô tả được hai vòng bỏ phiếu trong một thuật toán consensus dựa trên leader, và biết khi nào nên giao việc điều phối cho ZooKeeper/etcd thay vì tự dựng.

**Đọc.** [Consensus trong thực tế](#/docs/ddia-10) chốt cách phát biểu hữu dụng nhất: hầu hết hệ thống cung cấp shared log. [Sử dụng shared log](#/docs/ddia-10) nối về state machine replication và event sourcing ở tuần 2, và thực thi tuần tự bằng stored procedure ở tuần 7. [Từ single-leader replication đến consensus](#/docs/ddia-10) cần đọc chậm nhất: khái niệm *epoch number* — trong mỗi epoch leader là duy nhất, giữa hai epoch thì epoch cao hơn thắng — và hai vòng bỏ phiếu phải giao nhau; đọc kỹ đoạn cuối so hai vòng này với 2PC, vì chúng chỉ giống nhau ở bề ngoài. [Những điểm tinh tế của consensus](#/docs/ddia-10) so cách Raft và Paxos xử lý leader mới; khung [TÍNH NHẤT QUÁN SO VỚI TÍNH SẴN SÀNG TRONG BẦU LEADER](#/docs/ddia-10) và [Ưu và nhược điểm của consensus](#/docs/ddia-10) là hai phần đáng trích lại khi tranh luận. Kết chương bằng [Dịch vụ điều phối (Coordination Services)](#/docs/ddia-10) với bốn tính năng, ba mục con về cấu hình, phân bổ công việc và service discovery, và [Tóm tắt](#/docs/ddia-10).

**Bẫy.** Bật unclean leader election để cluster hồi phục nhanh hơn. Sách nói cái giá rất rõ: bỏ yêu cầu leader mới phải được cập nhật thì hiệu năng và tính sẵn sàng tốt lên, nhưng bạn đang đi trên lớp băng mỏng vì lý thuyết consensus không còn áp dụng — mọi thứ ổn khi không có lỗi, còn khi có thì các vấn đề ở chương 9 dễ dàng gây mất hoặc hỏng dữ liệu. Bẫy thứ hai: đưa service discovery vào ZooKeeper vì đằng nào cũng đang chạy nó. Sách gọi dùng consensus cho service discovery thường là quá mức cần thiết: ca này không cần linearizability, mà cần sẵn sàng cao và nhanh — nên hãy cache, và đó là lý do ZooKeeper có observer.

**Tự kiểm tra.** Vì sao thêm node vào một cluster consensus không làm tăng thông lượng? Và vì sao một phép đọc linearizable trong etcd cũng phải đi qua một vòng bỏ phiếu quorum?`,
      },
    ],
  },
  {
    id: "dd-w10",
    week: "Tuần 10",
    title: "Batch processing",
    goal: "Chọn được mô hình batch cho một workload cụ thể, và nói được job của bạn xử lý một task chết giữa chừng bằng cách nào thay vì tin rằng framework lo hết.",
    practice: "Lấy pipeline dữ liệu lớn nhất bạn đang chạy và làm ba việc đo được. Một: vẽ ra DAG của nó — đếm số job, và với mỗi cạnh ghi rõ dữ liệu trung gian đi qua đâu: hệ thống file phân tán, object store, hay truyền thẳng từ task này sang task kia; sách nói workflow gồm 50 đến 100 job là chuyện phổ biến, nên nếu không ai trong đội vẽ nổi DAG đó thì chính con số ấy là thứ cần đo trước. Hai: mở lịch sử 30 ngày gần nhất, đếm riêng số task thất bại và số task bị preempt, rồi đặt tỷ lệ đó cạnh lời sách nói rằng preemption xảy ra thường xuyên hơn lỗi phần cứng — nếu bạn đang chạy trên spot instance mà chưa từng nhìn hai con số này thì bạn chưa biết job của mình đang chịu lỗi kiểu gì. Ba: tìm mọi chỗ một batch job ghi thẳng vào database production, đếm số bản ghi mỗi lần chạy, và viết ra chuyện gì xảy ra với phần đã ghi nếu job thất bại giữa chừng rồi được chạy lại.",
    resources: [
      { label: "DDIA 11 — Batch Processing", href: "#/docs/ddia-11" },
      { label: "spark.apache.org — RDD Programming Guide", href: "https://spark.apache.org/docs/latest/rdd-programming-guide.html" },
    ],
    items: [
      {
        id: "dd-w10-1",
        text: "Triết lý Unix: pipeline, và vì sao nó vẫn là khuôn mẫu",
        lesson: `**Mục tiêu.** Nói được vì sao đầu vào bất biến làm một job dễ sửa sai hơn transaction đọc/ghi, và chọn đúng giữa bảng hash trong bộ nhớ và cách sắp xếp cho một phép đếm.

**Đọc.** Đoạn mở chương đặt nền cho cả tuần: bốn gạch đầu dòng về lợi ích của đầu vào bất biến, trong đó *time travel* và *human fault tolerance* đáng ghi lại. [Batch Processing với các công cụ Unix](#/docs/ddia-11) mở bằng một dòng access log NGINX kèm định nghĩa định dạng — tự giải mã dòng đó trước khi đọc lời giải thích. [Phân tích log đơn giản](#/docs/ddia-11) là sáu lệnh nối bằng pipe, mỗi lệnh một chú thích đánh số; gõ lại cả sáu trên máy bạn. [Chuỗi lệnh so với chương trình tùy biến](#/docs/ddia-11) đưa bản Python tương đương: khác biệt thật nằm ở luồng thực thi, không ở cú pháp. [Sắp xếp so với aggregation trong bộ nhớ](#/docs/ddia-11) là mục đọc chậm nhất — khái niệm *working set*, và lý do \`sort\` của GNU Coreutils tự tràn ra đĩa rồi tự song song hóa trên nhiều lõi.

**Bẫy.** Tin rằng rollback code sẽ sửa được dữ liệu sai. Sách đối chiếu thẳng: với batch job, bạn quay về phiên bản code trước rồi chạy lại là đầu ra lại đúng; còn hầu hết database có transaction đọc/ghi *không* có tính chất này — đã ghi dữ liệu sai vào database rồi thì rollback code không sửa được gì. Bẫy thứ hai: giữ một bảng hash trong bộ nhớ rồi coi như xong chuyện quy mô. Sách đặt điều kiện rõ: cách đó chỉ tốt khi working set — số URL riêng biệt, không phải số dòng log — còn nhỏ; lớn hơn bộ nhớ khả dụng thì cách sắp xếp mới có lợi thế, vì nó dùng đĩa hiệu quả.

**Tự kiểm tra.** Vì sao working set của phép đếm URL không tăng khi số dòng log tăng? Và pipeline Unix mất đi lợi thế nào ngay khi dataset không còn vừa một máy?`,
      },
      {
        id: "dd-w10-2",
        text: "MapReduce: shuffle, sort-merge join, và chịu lỗi bằng tính lại",
        lesson: `**Mục tiêu.** Dựng lại được đường đi của một cặp key-value từ mapper tới reducer, và nói được framework của bạn xử lý một task chết giữa chừng bằng cách nào.

**Đọc.** [Batch Processing trong hệ phân tán](#/docs/ddia-11) đối chiếu từng thành phần máy Unix với đối tác phân tán. [Hệ thống file phân tán](#/docs/ddia-11) — block mặc định HDFS 128 MB so với 4.096 byte của ext4, một file 900 MB thành bảy block 128 MB cộng một block 4 MB; khung [HỆ THỐNG FILE PHÂN TÁN VÀ LƯU TRỮ MẠNG](#/docs/ddia-11) đọc nhanh. [Object Store](#/docs/ddia-11) đọc kỹ hai điểm khác biệt khi \`list\` theo prefix. [Điều phối job phân tán](#/docs/ddia-11) cho ba thành phần — task executor, resource manager, scheduler; [Cấp phát tài nguyên](#/docs/ddia-11) dựng bài toán năm node với 160 lõi và hai job mỗi job muốn 100 lõi; [Lên lịch workflow](#/docs/ddia-11) định nghĩa DAG, còn [Xử lý lỗi](#/docs/ddia-11) là mục quan trọng nhất. Rồi [MapReduce](#/docs/ddia-11) với bốn bước đánh số — bước 3 là ngầm định — [Shuffle dữ liệu](#/docs/ddia-11) bám Hình 11-1, và [Join và Grouping](#/docs/ddia-11) với Hình 11-2, Hình 11-3 và *sort-merge join*.

**Bẫy.** Coi object store là một filesystem chỉ vì đã có driver FUSE. Sách vạch đúng chỗ gãy: link và lock thường không được hỗ trợ, còn đổi tên thì *không* nguyên tử — nó là sao chép object sang key mới rồi xóa key cũ, nên đổi tên một "thư mục" nghĩa là đổi tên từng object bên trong; sách dặn phải thận trọng vì những hệ thống này có thể trông như đã hiện thực đủ API mà vẫn không hành xử như bạn mong đợi. Bẫy thứ hai: chạy job trên spot instance rồi coi lỗi phần cứng là rủi ro chính. Sách nói ngược lại: task ưu tiên thấp dễ bị scheduler kill hơn, vì preemption xảy ra thường xuyên hơn lỗi phần cứng.

**Tự kiểm tra.** Vì sao MapReduce phải ghi dữ liệu trung gian trở lại DFS còn Spark thì không, và mỗi cách trả giá gì? Và *secondary sort* tiết kiệm cho reducer thứ gì?`,
      },
      {
        id: "dd-w10-3",
        text: "Vượt khỏi MapReduce — dataflow engine và các trường hợp dùng batch",
        lesson: `**Mục tiêu.** Nói được dataflow engine lấy lại gì so với MapReduce, và chọn đúng đường đưa đầu ra batch job vào hệ thống đang phục vụ người dùng.

**Đọc.** [Các Dataflow Engine](#/docs/ddia-11) là trọng tâm: năm gạch đầu dòng lợi thế so với MapReduce — chỉ sắp xếp nơi thật sự cần, gộp các operator không đổi cách sharding, tối ưu tính cục bộ, giữ trạng thái trung gian trong bộ nhớ hay đĩa cục bộ, và tái dùng process thay vì bật JVM mới mỗi task. [Các ngôn ngữ truy vấn](#/docs/ddia-11) cho thấy vì sao SQL thành ngôn ngữ chung; khung [BATCH PROCESSING VÀ CLOUD DATA WAREHOUSE HỘI TỤ](#/docs/ddia-11) chỉ ra khi nào cloud data warehouse là lựa chọn sai. [DataFrame](#/docs/ddia-11) ngắn mà then chốt. [Các trường hợp sử dụng batch](#/docs/ddia-11) có bốn mục con: [Extract–Transform–Load](#/docs/ddia-11), [Phân tích (Analytics)](#/docs/ddia-11) cùng data lakehouse, [Machine Learning](#/docs/ddia-11) với BSP và Pregel, rồi [Phục vụ dữ liệu dẫn xuất (Serving Derived Data)](#/docs/ddia-11) — đọc kỹ nhất. [Tóm tắt](#/docs/ddia-11) gom chương về ba tầng: điều phối, lưu trữ, tính toán.

**Bẫy.** Dùng thư viện client trong batch job để ghi thẳng từng bản ghi vào database production. Sách gọi đó là ý tưởng tồi: một request mạng cho mỗi bản ghi chậm hơn nhiều bậc so với thông lượng một task batch; nhiều task ghi song song dễ làm database quá tải và kéo theo sự cố nơi khác; và tác dụng phụ nhìn thấy từ bên ngoài phá vỡ bảo đảm all-or-nothing — task thất bại rồi chạy lại để lại đầu ra trùng lặp. Bẫy thứ hai: bê thẳng mã Pandas sang Spark rồi mong nó hành xử y hệt. Sách nói DataFrame cục bộ thường được đánh index và có thứ tự, còn DataFrame phân tán thì nhìn chung không — nguồn của bất ngờ hiệu năng khi di trú.

**Tự kiểm tra.** Vì sao đẩy đầu ra batch qua một Kafka topic không tự nó giải quyết bảo đảm all-or-nothing? Và Spark khác Pandas ở thời điểm nào trong vòng đời một lời gọi DataFrame?`,
      },
    ],
  },
  {
    id: "dd-w11",
    week: "Tuần 11",
    title: "Stream processing",
    goal: "Chọn đúng kiểu broker và kiểu join cho một bài toán stream cụ thể, và phát biểu chính xác hệ thống của bạn bảo đảm gì khi một consumer chết giữa chừng.",
    practice: "Chọn một event stream đang chạy trong hệ thống của bạn và làm bốn việc đo được. Một: phân loại từng consumer của nó theo hai kiểu broker mà chương này đối chiếu, rồi với mỗi consumer viết ra chuyện gì xảy ra khi nó crash giữa lúc xử lý — thông điệp được giao lại cho ai, thứ tự có còn giữ không, bản ghi nào có thể bị xử lý hai lần. Hai: lấy chỉ số lag của consumer chậm nhất trong 7 ngày và đặt cạnh thời gian lưu giữ của topic, rồi ghi ra tỷ lệ giữa hai con số đó; nếu bạn không biết mình còn bao nhiêu giờ đệm trước khi consumer bắt đầu bỏ lỡ thông điệp thì bạn chưa có cảnh báo. Ba: tìm mọi chỗ mã ứng dụng ghi cùng một thay đổi vào hai hệ thống, đánh dấu từng chỗ là dual write hay CDC, và với mỗi dual write viết ra cặp giá trị nào có thể lệch nhau vĩnh viễn mà không lỗi nào báo. Bốn: liệt kê mọi phép tính theo window trong hệ thống và ghi rõ nó đang chia window theo event time hay theo processing time.",
    resources: [
      { label: "DDIA 12 — Stream Processing", href: "#/docs/ddia-12" },
      { label: "kafka.apache.org — Design", href: "https://kafka.apache.org/documentation/#design" },
    ],
    items: [
      {
        id: "dd-w11-1",
        text: "Truyền event: message broker so với log-based broker",
        lesson: `**Mục tiêu.** Chọn được giữa broker kiểu JMS/AMQP và broker dựa trên log cho một workload, và nói được mỗi kiểu đánh mất gì.

**Đọc.** [Truyền tải Event Stream](#/docs/ddia-12) định nghĩa *event* và vì sao poll database không thay được cơ chế thông báo. [Hệ thống Messaging](#/docs/ddia-12) đặt hai câu hỏi phân loại cả chương, kèm ba lựa chọn khi producer nhanh hơn consumer: bỏ thông điệp, buffer, hay backpressure. [Messaging trực tiếp từ producer tới consumer](#/docs/ddia-12) đọc lướt; [Message broker](#/docs/ddia-12) và [So sánh message broker với database](#/docs/ddia-12) đọc kỹ bốn gạch đầu dòng khác biệt. [Nhiều consumer](#/docs/ddia-12) cho hai mẫu ở Hình 12-1; [Xác nhận (acknowledgment) và gửi lại (redelivery)](#/docs/ddia-12) bám Hình 12-2, khép bằng dead letter queue. [Message Broker Dựa trên Log](#/docs/ddia-12): [Dùng log để lưu trữ thông điệp](#/docs/ddia-12) với offset và Hình 12-3, [So sánh log với messaging truyền thống](#/docs/ddia-12) chốt điều kiện chọn bên nào, [Consumer offset](#/docs/ddia-12) nối về log sequence number tuần 5, [Sử dụng dung lượng đĩa](#/docs/ddia-12) với 20 TB ở 250 MB/s ra khoảng 22 giờ đệm, rồi [Khi consumer không theo kịp producer](#/docs/ddia-12) và [Phát lại (replay) các thông điệp cũ](#/docs/ddia-12).

**Bẫy.** Bật load balancing rồi vẫn trông cậy vào thứ tự thông điệp. Sách nói đó là tất yếu: kể cả khi broker cố bảo toàn thứ tự — JMS và AMQP đều yêu cầu thế — load balancing cộng gửi lại chắc chắn làm đảo thứ tự, như Hình 12-2 cho ra chuỗi *m4*, *m3*, *m5*; muốn tránh phải bỏ load balancing. Bẫy thứ hai: coi broker dựa trên log là kho lưu vô hạn. Sách nói log chỉ là circular buffer trên đĩa: segment cũ bị xóa hoặc chuyển sang lưu trữ dài hạn, và nếu offset của consumer trỏ vào segment đã xóa thì nó *bỏ lỡ* thông điệp — không lỗi nào báo, ngoài chỉ số lag bạn phải tự giám sát.

**Tự kiểm tra.** Vì sao head-of-line blocking là cái giá riêng của cách tiếp cận dựa trên log? Và điều gì khiến việc tiêu thụ một log production để gỡ lỗi là an toàn?`,
      },
      {
        id: "dd-w11-2",
        text: "Database và stream: CDC, event sourcing, log compaction",
        lesson: `**Mục tiêu.** Nói được vì sao dual write hỏng mà không ai phát hiện, và chọn giữa CDC và event sourcing cho hệ thống đã có.

**Đọc.** [Database và Stream](#/docs/ddia-12) mở bằng ý niệm mọi lần ghi đều là event. [Giữ các hệ thống đồng bộ với nhau](#/docs/ddia-12) dựng bài toán bằng Hình 12-4 — đọc chậm. [Change Data Capture](#/docs/ddia-12) cùng Hình 12-5 đưa lời giải: database thành leader, hệ thống dẫn xuất thành follower. Bốn mục con: [Triển khai CDC](#/docs/ddia-12) với Debezium, [Snapshot ban đầu](#/docs/ddia-12) — phải ứng với offset đã biết trong change log — [Log compaction](#/docs/ddia-12) với Hình 12-6 và tombstone, [Hỗ trợ API cho change stream](#/docs/ddia-12) và ca khó Cassandra. [CDC so với event sourcing](#/docs/ddia-12): khác biệt ở mức trừu tượng, không ở cơ chế. Khung [CHANGE DATA CAPTURE VÀ SCHEMA CỦA DATABASE](#/docs/ddia-12) giới thiệu outbox pattern. [Trạng thái, Stream và Tính bất biến](#/docs/ddia-12) với Hình 12-7, [Ưu điểm của các sự kiện bất biến](#/docs/ddia-12), [Dẫn xuất nhiều view từ cùng một event log](#/docs/ddia-12), [Kiểm soát đồng thời (concurrency control)](#/docs/ddia-12) và [Hạn chế của tính bất biến](#/docs/ddia-12) với crypto-shredding.

**Bẫy.** Giải bài toán đồng bộ bằng dual write. Sách chỉ ra hai chỗ hỏng độc lập: race condition ở Hình 12-4 khiến database kết thúc ở *B* còn search index ở *A* — không nhất quán *vĩnh viễn* dù không lỗi nào xảy ra, thiếu version vector thì bạn không nhận ra đã có ghi đồng thời; chỗ thứ hai là một lần ghi thành công, lần kia thất bại, tức atomic commit vốn đắt. Bẫy thứ hai: bật CDC rồi vẫn đổi schema database như chi tiết nội bộ. Sách nói CDC biến schema nguồn thành public API: xóa một cột làm hỏng consumer phía sau, và vì CDC thường chạy dưới dạng data stream, consumer đó có thể là service production — hỏng nó là sự cố chạm khách hàng.

**Tự kiểm tra.** Vì sao log compaction làm được cho CDC nhưng không theo cùng cách cho event sourcing? Và outbox pattern có phải dual write không, nếu phải thì thoát thế nào?`,
      },
      {
        id: "dd-w11-3",
        text: "Cửa sổ thời gian, và thời gian sự kiện so với thời gian xử lý",
        lesson: `**Mục tiêu.** Chọn đúng loại window cho một phép aggregation, và nói được kết quả sai thế nào nếu bạn chia window theo đồng hồ máy xử lý.

**Đọc.** [Xử lý Stream](#/docs/ddia-12) mở bằng ba việc làm được với stream — ghi vào kho lưu trữ, đẩy tới người dùng, hay sinh stream dẫn xuất — chương chỉ bàn việc thứ ba. [Các ứng dụng của Stream Processing](#/docs/ddia-12) đi qua sáu mục con: [Complex event processing (xử lý event phức hợp)](#/docs/ddia-12) đảo ngược quan hệ truy vấn–dữ liệu, [Stream analytics (phân tích stream)](#/docs/ddia-12), [Duy trì materialized view](#/docs/ddia-12), khung [DUY TRÌ VIEW TĂNG DẦN (INCREMENTAL VIEW MAINTENANCE)](#/docs/ddia-12), [Tìm kiếm trên stream](#/docs/ddia-12) và [Kiến trúc hướng event (event-driven) và RPC](#/docs/ddia-12). [Suy luận về thời gian](#/docs/ddia-12) là trọng tâm: [Event time so với processing time](#/docs/ddia-12) với thứ tự phát hành *Star Wars* và Hình 12-8, [Xử lý các event đến muộn (straggler)](#/docs/ddia-12), [Rốt cuộc bạn đang dùng đồng hồ của ai?](#/docs/ddia-12) với ba timestamp hiệu chỉnh đồng hồ thiết bị, và [Các loại window](#/docs/ddia-12) với bốn loại — tumbling, hopping, sliding, session.

**Bẫy.** Chia window theo đồng hồ máy xử lý. Sách dựng kịch bản hỏng: triển khai lại stream processor, nó tắt một phút rồi xử lý phần tồn đọng; đo theo processing time, đồ thị hiện đợt tăng vọt request trong khi tốc độ thật vẫn ổn định — Hình 12-8 gọi đó là hiện tượng giả do biến động tốc độ xử lý. Bẫy thứ hai: đặt timeout, tuyên bố window đã đóng, rồi coi con số đó là chung cuộc. Sách nói bạn không bao giờ chắc đã nhận đủ event cho một window: có event còn lưu tạm ở máy khác do gián đoạn mạng. Chỉ còn hai đường — bỏ qua straggler nhưng theo dõi lượng bị loại như một chỉ số, hoặc công bố *correction* kèm rút lại đầu ra trước.

**Tự kiểm tra.** Vì sao Bloom filter hay HyperLogLog không khiến stream processing "vốn dĩ xấp xỉ"? Và sliding window năm phút gom được cặp event nào mà tumbling và hopping năm phút thì không?`,
      },
      {
        id: "dd-w11-4",
        text: "Join trên stream, và exactly-once thực chất nghĩa là gì",
        lesson: `**Mục tiêu.** Phân biệt ba loại join trên stream theo state phải giữ, và phát biểu chính xác exactly-once bảo đảm gì, không bảo đảm gì.

**Đọc.** [Stream Join](#/docs/ddia-12) nói vì sao join trên stream khó hơn batch, rồi tách ba loại. [Join stream–stream (window join)](#/docs/ddia-12) dùng ví dụ tỷ lệ nhấp: state là event một giờ vừa qua, index theo session ID; nhúng chi tiết tìm kiếm vào event nhấp *không* tương đương join. [Join stream–table (stream enrichment)](#/docs/ddia-12) là *hash join*, với bản sao cục bộ database được CDC giữ tươi. [Join table–table (duy trì materialized view)](#/docs/ddia-12) quay lại home timeline mạng xã hội. [Sự phụ thuộc thời gian của join](#/docs/ddia-12) dễ bỏ sót nhất: thuế suất tại thời điểm bán, slowly changing dimension. [Khả năng chịu lỗi](#/docs/ddia-12) định nghĩa exactly-once và nhận xét *effectively-once* mới là chữ sát hơn, rồi bốn mục con: [Microbatching và checkpointing](#/docs/ddia-12) — batch khoảng một giây — [Xem lại atomic commit](#/docs/ddia-12) nối về 2PC tuần 7, [Idempotence](#/docs/ddia-12), và [Xây dựng lại state sau hỏng hóc](#/docs/ddia-12). [Tóm tắt](#/docs/ddia-12) đối chiếu hai kiểu broker và ba loại join.

**Bẫy.** Đọc thấy "Flink cho exactly-once" rồi tưởng đã xong. Sách vạch biên: microbatching và checkpointing chỉ cho exactly-once *trong phạm vi framework*; khi đầu ra rời stream processor — ghi vào database, publish sang broker ngoài, hay gửi email — framework không loại bỏ được đầu ra microbatch thất bại, còn khởi động lại task khiến tác dụng phụ xảy ra hai lần. Bẫy thứ hai: dựa vào idempotence mà bỏ qua giả định của nó. Sách nêu ba điều kiện: task khởi động lại phải phát lại đúng thông điệp theo đúng thứ tự, xử lý phải deterministic, và không node nào khác cập nhật đồng thời cùng giá trị — failover còn có thể cần fencing để chặn node bị cho là đã chết nhưng vẫn sống, đúng cơ chế tuần 8.

**Tự kiểm tra.** Vì sao gán định danh phiên bản cho record được join làm join deterministic nhưng chặn log compaction? Và khi nào không cần replicate state để khôi phục?`,
      },
    ],
  },
];
