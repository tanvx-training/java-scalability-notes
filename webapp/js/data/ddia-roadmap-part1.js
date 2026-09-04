// Lộ trình đọc Designing Data-Intensive Applications — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Designing Data-Intensive Applications", ấn bản 2
// (Martin Kleppmann, O'Reilly). Thư mục nguồn: ddia-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (dd-w<N> / dd-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Một chương một tuần, trừ tuần 1 (gộp ch.1+2) và tuần 12 (gộp ch.13+14).

export const ddiaWeeksPart1 = [
  {
    id: "dd-w1",
    week: "Tuần 1",
    title: "Đánh đổi, và cách phát biểu yêu cầu phi chức năng",
    goal: "Phân biệt được hệ thống vận hành với hệ thống phân tích, và phát biểu được yêu cầu phi chức năng của một dịch vụ bằng ngôn ngữ đo được thay vì tính từ.",
    practice: "Lấy một dịch vụ bạn đang bảo trì và viết một trang: nó là system of record hay hệ dẫn xuất; tải hiện tại đo bằng chỉ số nào; p50/p95/p99 của nó là bao nhiêu (lấy từ dashboard thật, không đoán); nó chịu được fault nào và không chịu được fault nào. Chỗ nào bạn không trả lời được, ghi lại là khoảng trống cần đo.",
    resources: [
      { label: "DDIA 01 — Những sự đánh đổi trong kiến trúc hệ thống dữ liệu", href: "#/docs/ddia-01" },
      { label: "DDIA 02 — Xác định các yêu cầu phi chức năng", href: "#/docs/ddia-02" },
      { label: "hdrhistogram.org — HdrHistogram", href: "http://hdrhistogram.org/" },
    ],
    items: [
      {
        id: "dd-w1-1",
        text: "Hệ thống vận hành và hệ thống phân tích — hai thế giới, hai loại yêu cầu",
        lesson: `**Mục tiêu.** Nói được OLTP khác phân tích ở mẫu đọc, mẫu ghi và cỡ dữ liệu, và xếp đúng một hệ thống bất kỳ vào ô system of record hay dữ liệu dẫn xuất.

**Đọc.** [Hệ thống vận hành và hệ thống phân tích](#/docs/ddia-01) — mục mở đầu chỉ giới thiệu bốn vai trò, đọc lướt. Trọng tâm là [Đặc trưng của xử lý transaction và phân tích](#/docs/ddia-01): Bảng 1-1 có tám dòng so sánh, chép cả tám dòng ra giấy vì cả cuốn sách dựa trên sự phân đôi này. Rồi [Data Warehousing (Kho dữ liệu)](#/docs/ddia-01) cho ba lý do không truy vấn thẳng OLTP và cho quy trình ETL ở Hình 1-1, tiếp đến hai phần con "Từ data warehouse đến data lake" và "Vượt ra ngoài data lake". Kết bằng [Hệ thống lưu trữ gốc (System of Record) và Dữ liệu dẫn xuất (Derived Data)](#/docs/ddia-01) — mục ngắn nhưng là cặp khái niệm bạn sẽ dùng lại ở tuần 2 và tuần 5.

**Bẫy.** Nghe "HTAP" rồi kết luận data warehouse hết thời. Sách nói thẳng HTAP không thay thế data warehouse, và nhiều hệ HTAP bên trong vẫn là một hệ OLTP ghép một hệ phân tích riêng, chỉ ẩn sau một giao diện chung — nên sự phân biệt vẫn quan trọng để hiểu chúng chạy thế nào. Bẫy thứ hai: đọc chữ *online* trong OLAP thành một điều gì đó chính xác về kỹ thuật. Khung LƯU Ý ngay sau Bảng 1-1 thừa nhận ý nghĩa của nó không rõ ràng; nó có lẽ chỉ hàm ý chuyên viên phân tích dùng hệ thống một cách tương tác cho các truy vấn khám phá.

**Tự kiểm tra.** Theo Bảng 1-1, mẫu ghi chính của hệ vận hành và của hệ phân tích khác nhau thế nào? Và data lake khác data warehouse ở đúng điểm nào khiến các data scientist thích nó hơn?`,
      },
      {
        id: "dd-w1-2",
        text: "Cloud hay tự vận hành, và khi nào mới thật sự cần hệ phân tán",
        lesson: `**Mục tiêu.** Nêu được điều kiện nào khiến cloud rẻ hơn self-hosting và điều kiện nào khiến điều ngược lại đúng, rồi liệt kê được những lý do chính đáng để một hệ thống trở thành phân tán.

**Đọc.** [Cloud so với Tự vận hành (Self-Hosting)](#/docs/ddia-01) cho phổ quyết định ở Hình 1-2, rồi [Ưu và Nhược điểm của các Dịch vụ Cloud](#/docs/ddia-01) — đọc kỹ bốn gạch đầu dòng về việc mất quyền kiểm soát, đó là phần bạn sẽ phải trích lại khi tranh luận trong đội. Tiếp theo [Kiến trúc Hệ thống Cloud Native](#/docs/ddia-01) với hai phần con "Phân tầng các dịch vụ cloud" và "Tách biệt lưu trữ (storage) và tính toán (compute)"; [Vận hành (Operations) trong Kỷ nguyên Cloud](#/docs/ddia-01) chỉ cần lướt lấy ý "lập kế hoạch dung lượng trở thành lập kế hoạch tài chính". Đóng lại bằng [Hệ phân tán so với hệ đơn nút](#/docs/ddia-01) — chín lý do có tên riêng — và [Các vấn đề của hệ phân tán](#/docs/ddia-01). Mục "Điện toán đám mây so với siêu máy tính" đọc lướt.

**Bẫy.** Mặc định cloud rẻ hơn. Sách đặt điều kiện rõ: nếu bạn đã có kinh nghiệm vận hành hệ thống đó và tải khá dễ dự đoán, thường sẽ rẻ hơn nếu tự mua máy — cloud thắng khi tải biến động mạnh, như các workload phân tích. Bẫy thứ hai: cho rằng thêm node thì nhanh hơn. Trong "Các vấn đề của hệ phân tán", sách nói nhiều node không phải lúc nào cũng nhanh hơn, và dẫn trường hợp một chương trình đơn luồng trên một máy đạt hiệu năng tốt hơn đáng kể một cluster hơn 100 nhân CPU.

**Tự kiểm tra.** Vì sao hệ cloud native coi đĩa cục bộ của một instance là cache tạm thời chứ không phải lưu trữ dài hạn? Và theo sách, vì sao thuật ngữ "serverless" có thể gây hiểu nhầm?`,
      },
      {
        id: "dd-w1-3",
        text: "Home timeline: một case study đọc-nhiều dựng sẵn khung cả cuốn sách",
        lesson: `**Mục tiêu.** Tính lại được bằng tay hai con số chi phí mà sách đưa ra cho hai thiết kế timeline, và nói được vì sao đẩy việc sang lúc ghi lại rẻ hơn ở đây.

**Đọc.** [Nghiên cứu tình huống: Home timeline của mạng xã hội](#/docs/ddia-02) — các con số ở đoạn mở đầu (500 triệu bài mỗi ngày, tức trung bình 5.800 bài mỗi giây, có lúc vọt lên 150.000, và trung bình 200 người theo dõi) là dữ kiện cho mọi phép tính sau đó, chép chúng ra. [Biểu diễn người dùng, bài đăng và quan hệ theo dõi](#/docs/ddia-02) đưa truy vấn SQL ba bảng và dẫn tới con số 400 triệu lượt tra cứu mỗi giây; tự nhân lại phép tính đó thay vì đọc qua. Rồi [Vật chất hóa và cập nhật timeline](#/docs/ddia-02): khái niệm fan-out ở Hình 2-2, con số hơn 1 triệu lượt ghi timeline mỗi giây, và hai trường hợp cực đoan ở cuối mục. Case study này quay lại ở chương 3 và chương 6, nên đừng đọc nó như một ví dụ dùng một lần.

**Bẫy.** Kết luận "fan-out lúc ghi luôn thắng" rồi đóng sách. Sách nêu ngay hai ca cực đoan: với người dùng theo dõi quá nhiều tài khoản thì hoàn toàn có thể bỏ bớt lượt ghi và chỉ hiển thị một mẫu, nhưng với tài khoản người nổi tiếng thì bỏ qua lượt ghi là *không chấp nhận được* — phải lưu bài của họ riêng và hợp nhất lúc đọc, và ngay cả vậy vẫn đòi hỏi rất nhiều hạ tầng. Bẫy thứ hai: thiết kế theo con số trung bình. Sách nhắc ngay từ đoạn đầu rằng phạm vi biến thiên rất rộng — phần lớn người dùng có ít người theo dõi, còn một vài tài khoản có hơn 100 triệu.

**Tự kiểm tra.** Con số 400 triệu lượt tra cứu mỗi giây ghép từ những thừa số nào? Và vì sao khi tốc độ đăng bài tăng vọt, timeline vẫn tải nhanh?`,
      },
      {
        id: "dd-w1-4",
        text: "Mô tả hiệu năng bằng percentile, không bằng trung bình",
        lesson: `**Mục tiêu.** Dùng đúng bốn thuật ngữ mà sách tách bạch — response time, service time, queueing delay, latency — và giải thích được vì sao p95/p99 mới nói lên trải nghiệm người dùng.

**Đọc.** [Mô tả hiệu năng](#/docs/ddia-02) cho cặp response time / throughput và Hình 2-3, kèm khung [KHI MỘT HỆ THỐNG QUÁ TẢI KHÔNG THỂ PHỤC HỒI](#/docs/ddia-02) — khung này ngắn nhưng đặt tên cho retry storm, metastable failure, exponential backoff, circuit breaker, load shedding và backpressure. Rồi [Độ trễ và thời gian phản hồi](#/docs/ddia-02) với Hình 2-4, và [Trung bình, trung vị và percentile](#/docs/ddia-02) — đây là mục đọc chậm nhất, kèm Hình 2-5 và câu chuyện p999 của Amazon. Khung [TÁC ĐỘNG CỦA THỜI GIAN PHẢN HỒI ĐỐI VỚI NGƯỜI DÙNG](#/docs/ddia-02) đáng đọc vì nó dạy cách hoài nghi số liệu. Kết bằng [Sử dụng các chỉ số thời gian phản hồi](#/docs/ddia-02) và khung [TÍNH TOÁN PERCENTILE](#/docs/ddia-02).

**Bẫy.** Lấy trung bình các p99 của nhiều máy để ra một con số cho cả cụm. Khung TÍNH TOÁN PERCENTILE nói việc lấy trung bình các percentile là vô nghĩa về mặt toán học; cách đúng là cộng các histogram lại với nhau. Bẫy thứ hai: dùng "latency" và "response time" thay cho nhau. Sách cố ý tách: response time là thứ client nhìn thấy, còn latency là khoảng thời gian request nằm chờ mà không được xử lý — và vì queueing delay chiếm phần lớn biến thiên, phải đo ở phía client.

**Tự kiểm tra.** Vì sao Amazon nhắm p999 mà không nhắm p9999? Và tail latency amplification xảy ra khi nào, kể cả khi các lời gọi backend chạy song song?`,
      },
      {
        id: "dd-w1-5",
        text: "Ba trụ: độ tin cậy, khả năng mở rộng, khả năng bảo trì",
        lesson: `**Mục tiêu.** Dùng đúng cặp fault/failure, đặt câu hỏi về scalability thay vì dán nhãn, và gọi tên được ba nguyên tắc bảo trì mà sách dùng xuyên suốt.

**Đọc.** [Độ tin cậy và khả năng chịu lỗi](#/docs/ddia-02) cho định nghĩa fault so với failure, rồi [Khả năng chịu lỗi](#/docs/ddia-02) (SPOF, fault injection, chaos engineering) và [Lỗi phần cứng và lỗi phần mềm](#/docs/ddia-02) với hai phần con — các con số tỷ lệ hỏng đĩa và RAM đáng ghi lại. [Con người và độ tin cậy](#/docs/ddia-02) đọc chậm, kể cả khung "ĐỘ TIN CẬY QUAN TRỌNG ĐẾN MỨC NÀO?" với vụ Post Office Horizon. Sang [Khả năng mở rộng](#/docs/ddia-02): "Hiểu về tải", "Kiến trúc Shared-Memory, Shared-Disk và Shared-Nothing" (ba kiến trúc, học thuộc ba cái tên), "Các nguyên tắc cho khả năng mở rộng". Kết bằng [Khả năng bảo trì](#/docs/ddia-02) và ba mục con Operability, Simplicity, Evolvability.

**Bẫy.** Nói "hệ thống này có khả năng mở rộng". Sách gọi đó là một nhãn một chiều vô nghĩa; scalability phải được phát biểu thành câu hỏi — nếu tải tăng theo cách cụ thể nào thì ta có lựa chọn nào — và sách còn đặt tên chế giễu "magic scaling sauce" cho niềm tin vào một kiến trúc mở rộng vạn năng. Bẫy thứ hai: kết luận sự cố là "lỗi con người" rồi siết quy trình. Sách nói đổ lỗi cho con người là phản tác dụng: cái gọi là lỗi con người là triệu chứng của vấn đề trong hệ thống kỹ thuật-xã hội, và một nghiên cứu cho thấy thay đổi cấu hình do người vận hành là nguyên nhân hàng đầu gây gián đoạn, còn lỗi phần cứng chỉ chiếm 10%–25%.

**Tự kiểm tra.** Vì sao sách nói lỗi phần mềm nguy hiểm hơn lỗi phần cứng dù phần cứng hỏng thường xuyên hơn? Và vì sao tự động hóa nhiều hơn không phải lúc nào cũng tốt hơn cho operability?`,
      },
    ],
  },
  {
    id: "dd-w2",
    week: "Tuần 2",
    title: "Mô hình dữ liệu và ngôn ngữ truy vấn",
    goal: "Chọn được mô hình dữ liệu cho một bài toán cụ thể dựa trên hình dạng quan hệ trong dữ liệu, chứ không dựa trên công nghệ đang thịnh hành.",
    practice: "Lấy một thực thể trong hệ thống của bạn và mô hình hóa nó ba lần: schema quan hệ chuẩn hóa, một document JSON, và một property graph. Với mỗi bản, viết ra một truy vấn mà bản đó làm dễ và một truy vấn mà bản đó làm khó. Sau đó viết lại một thao tác ghi bất kỳ dưới dạng event log kèm hai materialized view.",
    resources: [
      { label: "DDIA 03 — Mô hình dữ liệu và ngôn ngữ truy vấn", href: "#/docs/ddia-03" },
      { label: "opencypher.org — openCypher", href: "https://opencypher.org/" },
    ],
    items: [
      {
        id: "dd-w2-1",
        text: "Quan hệ so với document — hình dạng dữ liệu quyết định mô hình",
        lesson: `**Mục tiêu.** Quyết định giữa quan hệ và document bằng câu hỏi "dữ liệu của tôi có bao nhiêu quan hệ nhiều-nhiều", và nói được chuẩn hóa đánh đổi cái gì lấy cái gì.

**Đọc.** [Mô hình quan hệ so với mô hình document](#/docs/ddia-03) — [Sự không tương thích giữa object và quan hệ](#/docs/ddia-03) và phần con "Ánh xạ object-quan hệ" liệt kê năm phê bình ORM, trong đó vấn đề truy vấn N+1 đáng đọc kỹ. [Mô hình dữ liệu document cho quan hệ một-nhiều](#/docs/ddia-03) đưa hồ sơ LinkedIn ở Hình 3-1 và Ví dụ 3-1; đừng bỏ khung LƯU Ý về "một-ít". Trọng tâm tuần này là [Chuẩn hóa, phi chuẩn hóa và join](#/docs/ddia-03) cùng hai phần con "Những đánh đổi của chuẩn hóa" và "Phi chuẩn hóa trong nghiên cứu tình huống mạng xã hội" — mục sau nối thẳng về case study tuần 1. Rồi [Quan hệ nhiều-một và nhiều-nhiều](#/docs/ddia-03), [Star và Snowflake: Các schema cho phân tích](#/docs/ddia-03), và [Khi nào dùng mô hình nào](#/docs/ddia-03) với ba phần con về schema-on-read, locality và sự hội tụ.

**Bẫy.** Gọi document database là "schemaless". Sách nói thuật ngữ đó gây hiểu nhầm: mã đọc dữ liệu vẫn giả định một cấu trúc, tức là có schema ngầm định, chỉ là database không áp đặt — thuật ngữ chính xác là schema-on-read. Bẫy thứ hai: nhồi mọi thứ vào một document để lấy locality. Sách cảnh báo lợi thế locality chỉ áp dụng khi bạn cần phần lớn document cùng lúc; database thường phải nạp cả document, và khi cập nhật thường phải ghi lại cả document — nên hãy giữ document nhỏ và tránh những cập nhật nhỏ diễn ra thường xuyên.

**Tự kiểm tra.** Vì sao timeline được materialize của X chỉ lưu ID bài đăng chứ không lưu nội dung bài? Và "hydrating" các ID thực chất là thao tác gì?`,
      },
      {
        id: "dd-w2-2",
        text: "Mô hình đồ thị: property graph, triple-store và ngôn ngữ truy vấn của chúng",
        lesson: `**Mục tiêu.** Đọc hiểu một truy vấn Cypher và bản SPARQL tương đương, và nói được vì sao SQL cần \`WITH RECURSIVE\` cho cùng câu hỏi.

**Đọc.** [Các mô hình dữ liệu dạng đồ thị](#/docs/ddia-03) cho ranh giới quyết định giữa document và graph, rồi [Đồ thị thuộc tính (Property Graph)](#/docs/ddia-03) — gõ lại Ví dụ 3-3, hai bảng \`vertices\` và \`edges\` cùng hai index, vì cả mục dựa trên hình dung đó. [Ngôn ngữ truy vấn Cypher](#/docs/ddia-03) với Ví dụ 3-5 bốn dòng, rồi [Truy vấn đồ thị trong SQL](#/docs/ddia-03) với bản SQL 31 dòng — đặt hai bản cạnh nhau. [Triple Store và SPARQL](#/docs/ddia-03) và phần con "Mô hình dữ liệu RDF" đọc vừa phải; khung SEMANTIC WEB chỉ cần lướt. [Datalog: Truy vấn quan hệ đệ quy](#/docs/ddia-03) đọc kỹ ba bước áp dụng rule ở Hình 3-7. Kết bằng [GraphQL](#/docs/ddia-03).

**Bẫy.** Xếp GraphQL vào cùng nhóm với Cypher và SPARQL vì cái tên. Sách nói ngược lại: GraphQL bị giới hạn *có chủ ý* vì truy vấn đến từ nguồn không đáng tin cậy — nó không cho truy vấn đệ quy, không cho điều kiện tìm kiếm tùy ý trừ khi chủ dịch vụ chủ động mở, và nó có thể được triển khai trên bất kỳ loại database nào. Bẫy thứ hai: tưởng edge biểu diễn được mọi quan hệ. Khung LƯU Ý trong mục property graph nêu rõ một hạn chế: một edge chỉ nối được hai vertex, còn một bảng join quan hệ biểu diễn được quan hệ ba ngôi trở lên; muốn làm điều đó trong đồ thị phải thêm một vertex trung gian hoặc dùng hypergraph.

**Tự kiểm tra.** \`:WITHIN*0..\` trong Cypher tương ứng với cấu trúc SQL nào, và vì sao SQL cần nó? Và trong triple store, khi nào predicate là một property còn khi nào nó là một edge?`,
      },
      {
        id: "dd-w2-3",
        text: "Event Sourcing và CQRS — lưu sự kiện thay vì lưu trạng thái",
        lesson: `**Mục tiêu.** Phân biệt được command với event, và kể được sáu ưu điểm cùng ba nhược điểm mà sách liệt kê cho cặp event sourcing / CQRS.

**Đọc.** [Event Sourcing và CQRS](#/docs/ddia-03) là một mục liền mạch, không chia phần con — đọc trọn. Bám theo ví dụ hệ thống quản lý hội nghị ở Hình 3-8: một event log bất biến làm nguồn sự thật, và ba materialized view dẫn xuất từ nó (trạng thái đặt chỗ, biểu đồ dashboard, file in thẻ đeo). Đọc chậm đoạn định nghĩa ranh giới giữa command và event, rồi đoạn so sánh event sourcing với bảng fact của star schema ở tuần trước. Danh sách ưu điểm và danh sách nhược điểm nên đọc như hai checklist bạn sẽ mang ra dùng thật, không phải như văn xuôi. Câu cuối mục — mọi materialized view phải xử lý event đúng thứ tự trong log — là dây nối sang chương 10 và chương 12.

**Bẫy.** Để consumer từ chối một event vì thấy nó không hợp lệ. Sách quy định rõ thứ tự: request đến là một command, phải được kiểm tra hợp lệ trước; chỉ khi đã hợp lệ nó mới trở thành fact và được thêm vào log — nên event log chỉ chứa event hợp lệ, và consumer xây materialized view *không được phép* từ chối một event. Bẫy thứ hai: gọi ra ngoài trong lúc xử lý event. Sách lấy đúng ví dụ tỷ giá hối đoái: lấy tỷ giá từ nguồn bên ngoài khi xử lý event sẽ cho kết quả khác nếu bạn tính lại view vào một ngày khác; muốn logic deterministic thì phải nhúng tỷ giá vào chính event, hoặc truy vấn được tỷ giá lịch sử theo timestamp của event.

**Tự kiểm tra.** Vì sao sách dặn đặt tên event ở thì quá khứ? Và crypto-shredding giải quyết vấn đề gì, đồng thời làm khó điều gì?`,
      },
      {
        id: "dd-w2-4",
        text: "DataFrame, ma trận và mảng — dữ liệu cho phân tích và ML",
        lesson: `**Mục tiêu.** Nói được DataFrame khác bảng quan hệ ở đâu ngoài cú pháp, và mô tả được đường đi từ một bảng quan hệ tới ma trận số mà thuật toán ML nhận vào.

**Đọc.** [DataFrame, Ma trận và Mảng](#/docs/ddia-03) là mục ngắn nhất chương — đọc trọn, không lướt. Ba đoạn đầu định vị DataFrame trong hệ sinh thái R, Pandas, Spark, ArcticDB, Dask và nói rõ nó được thao tác bằng một chuỗi lệnh chứ không phải một ngôn ngữ khai báo. Trọng tâm là Hình 3-9: một bảng quan hệ đánh giá phim được biến thành ma trận thưa, mỗi cột một bộ phim, mỗi hàng một người dùng — dừng lại ở hình này cho đến khi bạn tự vẽ lại được. Rồi đoạn về các kỹ thuật đưa dữ liệu phi số vào ma trận, đặc biệt là one-hot encoding cho cột phân loại. Hai đoạn cuối mở ra array database (TileDB, dữ liệu không gian địa lý, ảnh y khoa) và dữ liệu chuỗi thời gian trong tài chính.

**Bẫy.** Xem DataFrame chỉ là "bảng quan hệ với API khác". Sách mở mục bằng đúng ấn tượng đó — "thoạt nhìn, một DataFrame tương tự như một bảng trong database quan hệ" — rồi bác lại: API của DataFrame cung cấp rất nhiều thao tác vượt xa những gì database quan hệ có, và mô hình này thường được dùng theo những cách rất khác với mô hình hóa dữ liệu quan hệ điển hình. Bẫy thứ hai: nghĩ ma trận đó vẫn nên nằm trong database quan hệ. Sách nói ma trận ví dụ có thể có hàng nghìn cột và do đó *sẽ không phù hợp* với database quan hệ, còn DataFrame và các thư viện mảng thưa như NumPy xử lý nó dễ dàng.

**Tự kiểm tra.** Phép "join" của database quan hệ được gọi là gì trên DataFrame? Và one-hot encoding biến một cột thể loại phim thành cái gì, kể cả khi một phim thuộc nhiều thể loại?`,
      },
    ],
  },
  {
    id: "dd-w3",
    week: "Tuần 3",
    title: "Lưu trữ và truy xuất — LSM-tree, B-tree, cột",
    goal: "Giải thích được vì sao một storage engine chọn LSM-tree hay B-tree, và vì sao kho phân tích lưu theo cột chứ không theo hàng.",
    practice: "Gõ lại hai hàm bash `db_set`/`db_get` của chương 4 và đo thời gian `db_get` khi file có 1.000 rồi 100.000 dòng — tự thấy đường cong O(n). Sau đó lấy một bảng thật, xuất nó ra CSV và ra Parquet, so kích thước hai file; rồi chạy một truy vấn `SUM` trên một cột và so thời gian giữa hai định dạng.",
    resources: [
      { label: "DDIA 04 — Lưu trữ và Truy xuất", href: "#/docs/ddia-04" },
      { label: "github.com — RocksDB Wiki: Compaction", href: "https://github.com/facebook/rocksdb/wiki/Compaction" },
    ],
    items: [
      {
        id: "dd-w3-1",
        text: "Log-structured storage: SSTable và LSM-tree",
        lesson: `**Mục tiêu.** Kể lại bốn bước của vòng đời một thao tác ghi trong LSM storage engine, và nói được Bloom filter cứu được thao tác đọc nào.

**Đọc.** [Lưu trữ và Đánh index cho OLTP](#/docs/ddia-04) mở đầu bằng database hai hàm bash — chạy thật, vì cả chương dựng trên nó, và đọc kỹ đoạn nói index là cấu trúc *bổ sung* làm nhanh đọc nhưng làm chậm ghi. Rồi [Lưu trữ Log-Structured](#/docs/ddia-04) với bốn hạn chế của hash index trong bộ nhớ, [Định dạng file SSTable](#/docs/ddia-04) và Hình 4-2 (sparse index, block nén), [Xây dựng và gộp (merge) các SSTable](#/docs/ddia-04) — bốn bước đánh số ở đây là phần đáng thuộc nhất mục này, kèm memtable, tombstone và Hình 4-3. Tiếp theo [Bloom filter](#/docs/ddia-04) với Hình 4-4, rồi [Các chiến lược compaction](#/docs/ddia-04) so size-tiered với leveled. Khung CÁC STORAGE ENGINE NHÚNG chỉ cần lướt.

**Bẫy.** Đọc Bloom filter theo chiều ngược. Sách phát biểu bất đối xứng rất rõ: nếu ít nhất một bit là 0 thì khóa *chắc chắn* không có trong SSTable; còn nếu mọi bit đều là 1 thì khóa chỉ *nhiều khả năng* có, vì các bit đó có thể đã bị các khóa khác đặt lên — đó là false positive, và khi đó bạn vẫn phải giải mã block để kiểm tra. Bẫy thứ hai: để mặc chiến lược compaction. Sách nói size-tiered hợp với workload chủ yếu ghi còn leveled hợp với workload chủ yếu đọc, và cảnh báo size-tiered có thể tạo ra những SSTable rất lớn, đòi hỏi rất nhiều dung lượng đĩa tạm khi gộp.

**Tự kiểm tra.** Tombstone được ghi khi nào và bị bỏ đi ở thời điểm nào? Và theo kinh nghiệm sách đưa ra, cần bao nhiêu bit Bloom filter mỗi khóa để có tỷ lệ false positive 1%?`,
      },
      {
        id: "dd-w3-2",
        text: "B-tree, và bảng đối chiếu LSM-tree với B-tree",
        lesson: `**Mục tiêu.** Mô tả được một lần tách page trong B-tree và vai trò của WAL, rồi so LSM với B-tree trên bốn trục mà sách dùng thay vì trên cảm giác.

**Đọc.** [B-Tree](#/docs/ddia-04) — bám Hình 4-5 (tra khóa 251) và Hình 4-6 (tách page tại khóa 337); nắm branching factor và con số minh họa cây bốn tầng lưu được 250 TB. [Làm cho B-tree đáng tin cậy](#/docs/ddia-04) ngắn nhưng quan trọng: torn page và write-ahead log. [Sử dụng các biến thể của B-tree](#/docs/ddia-04) lướt cũng được. Trọng tâm là [So sánh B-Tree và LSM-Tree](#/docs/ddia-04) với bốn phần con "Hiệu năng đọc", "Ghi tuần tự so với ghi ngẫu nhiên" (kèm khung về SSD và garbage collection), "Write amplification (khuếch đại ghi)", "Mức sử dụng không gian đĩa". Đọc thêm [Index đa cột và Secondary Index](#/docs/ddia-04), [Lưu trữ giá trị bên trong Index](#/docs/ddia-04) cho clustered index và covering index, và [Giữ toàn bộ dữ liệu trong bộ nhớ](#/docs/ddia-04).

**Bẫy.** Benchmark một LSM-tree trên database còn trống rồi công bố con số. Sách dặn phải chạy thử nghiệm đủ lâu để tác động của write amplification lộ ra: khi LSM-tree còn trống thì chưa có compaction nào, toàn bộ băng thông đĩa dành cho ghi mới; database lớn dần thì ghi mới phải chia băng thông với compaction. Bẫy thứ hai: giải thích in-memory database nhanh vì "không phải đọc đĩa". Sách nói trái với trực giác: một engine trên đĩa cũng có thể chẳng bao giờ đọc đĩa nếu đủ RAM, vì hệ điều hành đã cache các block; cái mà in-memory database tránh được là chi phí encoding cấu trúc dữ liệu trong bộ nhớ sang dạng ghi được ra đĩa.

**Tự kiểm tra.** Vì sao ghi ngẫu nhiên làm SSD hao mòn nhanh hơn ghi tuần tự? Và vì sao Bloom filter không giúp gì cho range query?`,
      },
      {
        id: "dd-w3-3",
        text: "Vì sao kho phân tích lưu theo cột, và nén cột hiệu quả tới đâu",
        lesson: `**Mục tiêu.** Giải thích được vì sao một truy vấn chạm bốn cột trong bảng hơn trăm cột lại rẻ hơn hẳn khi lưu theo cột, và nói được thứ tự sắp xếp ảnh hưởng thế nào tới tỷ lệ nén.

**Đọc.** [Lưu trữ dữ liệu cho phân tích](#/docs/ddia-04) mở đầu, rồi [Data Warehouse trên Cloud](#/docs/ddia-04) — bốn thành phần đã tách rời (query engine, định dạng lưu trữ, định dạng bảng, data catalog) là bản đồ để đọc mọi kiến trúc lakehouse hiện nay. Trọng tâm là [Lưu trữ hướng cột (Column-Oriented Storage)](#/docs/ddia-04) với Ví dụ 4-1 và Hình 4-7, rồi [Nén cột](#/docs/ddia-04) — Hình 4-8 dựng bitmap encoding và run-length encoding, tự tính lại hai truy vấn \`IN\` và \`AND\` bằng phép OR và AND theo bit. [Thứ tự sắp xếp trong lưu trữ theo cột](#/docs/ddia-04) và [Ghi vào lưu trữ hướng cột](#/docs/ddia-04) ngắn nhưng nối thẳng về LSM ở mục 1. Kết bằng [Thực thi truy vấn: Biên dịch và Vector hóa](#/docs/ddia-04) và [Materialized View và Data Cube](#/docs/ddia-04).

**Bẫy.** Nhầm database hướng cột với mô hình dữ liệu wide-column. Sách dành hẳn một khung LƯU Ý cho việc này: dù tên gọi tương tự, các database wide-column như Bigtable, Accumulo và HBase là *hướng hàng*, vì chúng lưu tất cả giá trị của một hàng cùng nhau. Bẫy thứ hai: sắp xếp từng cột một cách độc lập cho gọn. Sách nói làm vậy không có ý nghĩa gì, vì khi đó ta mất khả năng biết mục nào thuộc hàng nào — cả cách bố trí theo cột dựa vào việc mục thứ *k* của mọi cột thuộc cùng một hàng; muốn sắp xếp thì phải sắp theo từng hàng trọn vẹn.

**Tự kiểm tra.** Vì sao hiệu ứng nén mạnh nhất ở khóa sắp xếp đầu tiên và yếu dần ở các khóa sau? Và vì sao data cube không trả lời được câu hỏi về tỷ lệ doanh số đến từ các mặt hàng giá trên 100 đô?`,
      },
      {
        id: "dd-w3-4",
        text: "Index đa chiều và index toàn văn",
        lesson: `**Mục tiêu.** Nói được vì sao index ghép không thay được index đa chiều, và mô tả được inverted index cùng ba loại vector index mà sách liệt kê.

**Đọc.** [Index đa chiều và Index toàn văn](#/docs/ddia-04) mở đầu bằng concatenated index và ví dụ danh bạ (*lastname*, *firstname*), rồi truy vấn nhà hàng theo vĩ độ và kinh độ — đọc kỹ đoạn giải thích vì sao index ghép thất bại ở đây, và lướt qua danh sách giải pháp (space-filling curve, R-tree, Bkd-tree, PostGIS). [Tìm kiếm toàn văn (Full-Text Search)](#/docs/ddia-04) là mục đáng đọc chậm: cách sách quy full-text search về một dạng truy vấn đa chiều, inverted index với postings list, mối nối về bitmap Hình 4-8 và phép AND vector hóa Hình 4-9, rồi Lucene, n-gram và Levenshtein automaton. [Vector Embedding](#/docs/ddia-04) khép lại chương với ba loại index — flat, IVF, HNSW ở Hình 4-11; đừng bỏ khung LƯU Ý giữa mục.

**Bẫy.** Tạo một index ghép trên \`(latitude, longitude)\` rồi tưởng đã xong truy vấn bản đồ. Sách nói rõ index đó chỉ cho bạn *hoặc* tất cả nhà hàng trong một khoảng vĩ độ ở bất kỳ kinh độ nào, *hoặc* tất cả nhà hàng trong một khoảng kinh độ ở bất kỳ đâu giữa hai cực — không thể cả hai đồng thời. Bẫy thứ hai: gộp hai nghĩa của chữ "vector". Khung LƯU Ý trong mục vector embedding tách bạch: trong vectorized processing, vector là một batch các bit được xử lý bằng mã tối ưu; còn trong embedding model, vector là mảng số dấu phẩy động chỉ một vị trí trong không gian đa chiều.

**Tự kiểm tra.** Postings list của một term có thể được biểu diễn bằng cấu trúc nào đã gặp ở mục lưu trữ theo cột? Và trong ba loại vector index, loại nào cho kết quả chính xác, loại nào chỉ xấp xỉ?`,
      },
    ],
  },
];
