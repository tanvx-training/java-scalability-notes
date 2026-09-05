// Lộ trình đọc Designing Data-Intensive Applications — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Designing Data-Intensive Applications", ấn bản 2
// (Martin Kleppmann, O'Reilly). Thư mục nguồn: sources/ddia/
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
      { label: "hdrhistogram.github.io — HdrHistogram", href: "https://hdrhistogram.github.io/HdrHistogram/" },
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
  {
    id: "dd-w4",
    week: "Tuần 4",
    title: "Encoding và tiến hoá schema",
    goal: "Chọn được định dạng encoding cho dữ liệu đi qua ranh giới process, và phát biểu được thay đổi schema nào an toàn cho một đợt rolling upgrade.",
    practice: "Lấy một message hoặc một payload API thật trong hệ thống của bạn: viết schema của nó bằng Protocol Buffers và bằng Avro, encode cùng một bản ghi bằng JSON, protobuf và Avro rồi so ba kích thước byte. Sau đó thêm một trường, xóa một trường, đổi kiểu một trường; với mỗi thay đổi ghi ra nó phá vỡ tương thích xuôi, tương thích ngược, hay không phá vỡ gì — và kiểm chứng bằng cách decode dữ liệu cũ bằng schema mới rồi làm ngược lại.",
    resources: [
      { label: "DDIA 05 — Encoding và Tiến hóa", href: "#/docs/ddia-05" },
      { label: "protobuf.dev — Language Guide (proto 3)", href: "https://protobuf.dev/programming-guides/proto3/" },
    ],
    items: [
      {
        id: "dd-w4-1",
        text: "JSON, Protocol Buffers, Avro — và tương thích xuôi/ngược",
        lesson: `**Mục tiêu.** Chọn được một định dạng encoding cho dữ liệu đi giữa các phiên bản mã, và phát biểu chính xác điều kiện phá vỡ tương thích của Protocol Buffers và của Avro.

**Đọc.** [Các định dạng encoding dữ liệu](#/docs/ddia-05) mở đầu bằng cặp encoding/decoding cùng khung XUNG ĐỘT THUẬT NGỮ — đọc khung này, vì chữ *serialization* sẽ mang nghĩa hoàn toàn khác ở chương 8. [Các định dạng đặc thù theo ngôn ngữ](#/docs/ddia-05) chỉ cần lướt lấy ba lý do đừng dùng chúng. [JSON, XML và các biến thể nhị phân](#/docs/ddia-05) đọc kỹ đoạn về các số lớn hơn 2⁵³ và cách X trả ID bài đăng hai lần; [JSON Schema](#/docs/ddia-05) và [Các encoding nhị phân](#/docs/ddia-05) đọc vừa phải, nhưng ghi lại các con số byte để so: MessagePack 66 byte so với JSON dạng văn bản 81 byte. Trọng tâm là [Protocol Buffers](#/docs/ddia-05) (33 byte) cùng [Field tag và schema evolution](#/docs/ddia-05), rồi [Avro](#/docs/ddia-05) (32 byte) cùng [Writer’s schema và reader’s schema](#/docs/ddia-05), [Các quy tắc schema evolution](#/docs/ddia-05), [Nhưng writer’s schema là gì?](#/docs/ddia-05) và [Schema được tạo động](#/docs/ddia-05). Kết bằng [Ưu điểm của schema](#/docs/ddia-05).

**Bẫy.** Đổi số tag của một trường protobuf cho schema gọn hơn. Sách tách bạch rất rõ: bạn có thể đổi *tên* một trường vì dữ liệu đã encode không bao giờ tham chiếu tên trường, nhưng bạn không thể đổi tag của nó, vì điều đó làm toàn bộ dữ liệu đã encode hiện có trở nên không hợp lệ — và tag của một trường đã xóa không bao giờ được dùng lại, nên hãy đánh dấu nó reserved. Bẫy thứ hai: tưởng \`null\` là giá trị mặc định dùng được cho mọi trường Avro. Sách nói trong Avro thì không: muốn một trường nhận \`null\`, bạn phải khai một union type, và chỉ được lấy \`null\` làm mặc định nếu nó là nhánh *đầu tiên* của union.

**Tự kiểm tra.** Thêm một trường không có giá trị mặc định vào Avro schema phá vỡ tương thích theo hướng nào — xuôi hay ngược? Và vì sao Avro hợp với schema được tạo động từ một database quan hệ, còn Protocol Buffers thì không?`,
      },
      {
        id: "dd-w4-2",
        text: "Dataflow qua database và qua service (REST, RPC)",
        lesson: `**Mục tiêu.** Nói được vì sao database đòi cả tương thích xuôi lẫn ngược trong khi service chỉ cần một chiều mỗi phía, và kể được sáu khác biệt giữa một lời gọi hàm cục bộ và một request qua mạng.

**Đọc.** [Các phương thức dataflow](#/docs/ddia-05) mở đầu ngắn, đặt câu hỏi ai encode và ai decode. [Dataflow qua database](#/docs/ddia-05) cùng hai phần con [Các giá trị khác nhau được ghi vào những thời điểm khác nhau](#/docs/ddia-05) và [Lưu trữ dài hạn (archival storage)](#/docs/ddia-05) đọc chậm — đây là chỗ nối thẳng về LSM-tree và Parquet ở tuần 3. Rồi [Dataflow qua dịch vụ: REST và RPC](#/docs/ddia-05) với [Web service](#/docs/ddia-05) (Ví dụ 5-3 OpenAPI và Ví dụ 5-4 FastAPI chỉ cần lướt), [Những vấn đề của remote procedure call](#/docs/ddia-05) — sáu gạch đầu dòng, đọc kỹ nhất cả mục — [Load balancer, service discovery, và service mesh](#/docs/ddia-05) với năm giải pháp có tên riêng, và [Encoding dữ liệu và tiến hóa cho RPC](#/docs/ddia-05). [Durable Execution và Workflow](#/docs/ddia-05) khép lại phần dịch vụ; đọc lấy ngữ nghĩa exactly-once và lý do mã workflow trở nên mong manh.

**Bẫy.** Triển khai xong mã mới rồi coi như dữ liệu cũng đã mới theo. Sách tóm nhận xét này thành *dữ liệu sống lâu hơn mã*: bạn thay hết phiên bản server trong vài phút, nhưng dữ liệu năm năm tuổi vẫn nằm đó trong encoding ban đầu trừ khi bạn đã chủ động ghi lại nó — nên forward compatibility là bắt buộc với database. Bẫy thứ hai: tin vào location transparency của RPC. Sách nói cách tiếp cận này có khiếm khuyết căn bản, và chỉ ra kết cục mà lời gọi cục bộ không có: một request qua mạng có thể trả về mà không có kết quả do timeout, và khi đó bạn đơn giản không biết request đã tới đích hay chưa — nên thử lại chỉ an toàn khi giao thức có idempotence.

**Tự kiểm tra.** Vì sao với dataflow qua service, sách nói bạn chỉ cần tương thích ngược cho request và tương thích xuôi cho response? Và vì sao DNS là lựa chọn service discovery tồi khi các server được khởi động, dừng và di chuyển thường xuyên?`,
      },
      {
        id: "dd-w4-3",
        text: "Dataflow qua truyền message bất đồng bộ",
        lesson: `**Mục tiêu.** Kể được năm lợi thế mà message broker mang lại so với RPC trực tiếp, và nói được vì sao chuyển sang actor cũng không giải thoát bạn khỏi bài toán tương thích.

**Đọc.** [Kiến trúc hướng sự kiện (Event-Driven Architecture)](#/docs/ddia-05) là mục ngắn nhưng dựng hết khung: một request giờ được gọi là event hay message, bên gửi thường không chờ bên nhận xử lý, và trung gian lưu message tạm thời là message broker. Năm gạch đầu dòng về lợi thế so với RPC trực tiếp nên đọc như một checklist mang ra dùng thật. [Message broker](#/docs/ddia-05) cho hai mẫu phân phối message — thêm vào một queue có tên thì *một* consumer nhận, publish tới một topic thì *tất cả* subscriber nhận — kèm nhận xét rằng broker thường không áp đặt mô hình dữ liệu nào, nên schema registry là việc của bạn. [Distributed actor framework](#/docs/ddia-05) khép chương: mỗi actor xử lý một message tại một thời điểm, và location transparency hoạt động tốt hơn ở đây so với RPC vì mô hình actor đã giả định sẵn message có thể mất. Đọc luôn [Tóm tắt](#/docs/ddia-05) như bản đồ ba chế độ dataflow.

**Bẫy.** Để một consumer đọc message, sửa, rồi publish lại sang topic khác qua một model object không giữ những trường nó không hiểu. Sách cảnh báo đúng chỗ này: nếu một consumer publish lại message sang topic khác, bạn có thể cần cẩn thận bảo toàn các trường không xác định, để không tái diễn vấn đề mất dữ liệu của Hình 5-1. Bẫy thứ hai: nghĩ actor framework lo giúp việc quản lý phiên bản. Sách nói ngược lại — nếu bạn muốn rolling upgrade một ứng dụng dựa trên actor, bạn *vẫn* phải lo tương thích xuôi và ngược, vì message có thể được gửi từ một node chạy phiên bản mới tới một node chạy phiên bản cũ, và ngược lại.

**Tự kiểm tra.** Message broker khác database ở điểm nào về vòng đời một message, và bạn phải cấu hình gì nếu muốn dùng nó cho event sourcing? Và vì sao giao tiếp qua broker là bất đồng bộ mà vẫn dựng được một mô hình đồng bộ kiểu RPC?`,
      },
    ],
  },
  {
    id: "dd-w5",
    week: "Tuần 5",
    title: "Replication",
    goal: "Chọn được kiểu replication cho một yêu cầu cụ thể, và gọi đúng tên bảo đảm nhất quán mà ứng dụng của bạn thật sự cần thay vì nói chung chung là \"nhất quán\".",
    practice: "Trên một database bạn đang chạy, tìm chỉ số replication lag và ghi lại giá trị p50 cùng giá trị lớn nhất trong 7 ngày qua (lấy từ dashboard thật). Sau đó liệt kê mọi màn hình trong ứng dụng có đọc từ replica và đánh dấu màn hình nào sẽ hỏng nếu lag lên 5 phút; với mỗi màn hình hỏng, ghi rõ nó cần read-your-writes, monotonic reads hay consistent prefix reads. Cuối cùng, viết ra n, w, r cho một cluster leaderless bạn đang dùng — hoặc cho một cụm giả định n = 5 — và kiểm tra điều kiện w + r > n.",
    resources: [
      { label: "DDIA 06 — Replication", href: "#/docs/ddia-06" },
      { label: "jepsen.io — Consistency Models", href: "https://jepsen.io/consistency" },
    ],
    items: [
      {
        id: "dd-w5-1",
        text: "Single-leader: đồng bộ hay bất đồng bộ, và cách dựng follower mới",
        lesson: `**Mục tiêu.** Nói được vì sao không hệ thống thực nào replicate đồng bộ tới mọi follower, dựng lại được bốn bước thiết lập một follower mới, và gọi tên ba cách triển khai replication log.

**Đọc.** [Single-Leader Replication](#/docs/ddia-06) mở đầu bằng ba bước của một lần ghi — chép cả ba ra, vì mọi thứ sau đó dựa trên chúng — kèm Hình 6-1 và khung LƯU Ý về thuật ngữ nên tránh. [Replication đồng bộ so với bất đồng bộ](#/docs/ddia-06) là mục đọc chậm nhất, với Hình 6-2 và khái niệm semisynchronous. [Thiết lập follower mới](#/docs/ddia-06) cho bốn bước đánh số; chú ý bước 3 và việc snapshot phải gắn với một vị trí chính xác trong replication log (PostgreSQL gọi là log sequence number, MySQL có binlog coordinates và GTID). Khung CƠ SỞ DỮ LIỆU DỰA TRÊN OBJECT STORAGE đọc lướt. [Xử lý node ngừng hoạt động](#/docs/ddia-06) với [Follower hỏng: Khôi phục bắt kịp (catch-up recovery)](#/docs/ddia-06) và [Leader hỏng: Failover](#/docs/ddia-06) — ba bước của failover tự động, rồi danh sách những thứ có thể hỏng. Kết bằng [Triển khai replication log](#/docs/ddia-06) với [Replication dựa trên statement](#/docs/ddia-06), [Vận chuyển write-ahead log (WAL shipping)](#/docs/ddia-06) và [Replication bằng logical log (dựa trên hàng)](#/docs/ddia-06).

**Bẫy.** Cấu hình mọi follower đều đồng bộ cho "an toàn". Sách nói điều đó không thực tế: chỉ một node ngừng hoạt động cũng khiến toàn bộ hệ thống đình trệ, nên trong thực tế chỉ *một* follower là đồng bộ và số còn lại bất đồng bộ. Bẫy thứ hai: tin rằng một lần ghi đã được xác nhận là bền vững. Với replication bất đồng bộ, giải pháp phổ biến nhất khi failover là loại bỏ các lần ghi chưa được replicate của leader cũ — sách dẫn sự cố GitHub, nơi một follower MySQL lỗi thời được thăng cấp, bộ đếm tự tăng của nó tụt lại nên nó gán lại những khóa chính đã dùng, gây lệch dữ liệu giữa MySQL và Redis và làm lộ dữ liệu riêng tư cho sai người dùng.

**Tự kiểm tra.** Vì sao WAL shipping thường khiến việc nâng cấp phần mềm database không downtime trở nên bất khả thi, còn logical log thì không? Và leader phải chọn giữa hai điều gì khi một follower offline quá lâu?`,
      },
      {
        id: "dd-w5-2",
        text: "Replication lag và ba bảo đảm chữa nó",
        lesson: `**Mục tiêu.** Gọi đúng tên ba bảo đảm chữa ba bất thường của replication lag, và chọn được kỹ thuật hiện thực read-your-writes phù hợp cho một ứng dụng cụ thể.

**Đọc.** [Các vấn đề với replication lag](#/docs/ddia-06) đặt khung read-scaling và định nghĩa eventual consistency — đừng bỏ khung LƯU Ý ngay sau đó. Rồi ba bất thường, mỗi cái một mục. [Đọc lại những gì chính mình đã ghi](#/docs/ddia-06) với Hình 6-3 và ba gạch đầu dòng kỹ thuật (đọc từ leader theo một tiêu chí, ghi nhớ timestamp lần ghi cuối, và rắc rối khi replica trải trên nhiều region), kèm phần cross-device ở cuối mục và khung [REGION VÀ AVAILABILITY ZONE](#/docs/ddia-06). [Monotonic reads](#/docs/ddia-06) với Hình 6-4 và mẹo chọn replica theo hash của ID người dùng thay vì ngẫu nhiên. [Consistent prefix reads](#/docs/ddia-06) với đoạn đối thoại ông Poons và bà Cake ở Hình 6-5 — đọc kỹ vì đây là mối nối sang chương 7. Đóng lại bằng [Các giải pháp cho replication lag](#/docs/ddia-06).

**Bẫy.** Viết mã ứng dụng như thể replication là đồng bộ. Sách phát biểu thẳng: giả vờ rằng replication là đồng bộ trong khi thực tế nó bất đồng bộ là công thức dẫn đến rắc rối về sau — nếu trải nghiệm người dùng hỏng khi lag lên vài phút, phải thiết kế một bảo đảm mạnh hơn chứ không phải hy vọng lag nhỏ. Bẫy thứ hai: coi eventual consistency là đặc sản của NoSQL. Khung LƯU Ý nói rõ các follower trong một database quan hệ được replicate bất đồng bộ cũng có đúng đặc tính đó, và chữ "eventually" là cố ý mơ hồ: nói chung không có giới hạn nào cho việc một replica có thể tụt lại bao xa.

**Tự kiểm tra.** Vì sao consistent prefix reads là vấn đề đặc biệt của database được sharding, và giải pháp đơn giản nào sách nêu ra? Và vì sao read-your-writes xuyên thiết bị khó hơn hẳn so với trên cùng một thiết bị?`,
      },
      {
        id: "dd-w5-3",
        text: "Multi-leader: topology và xử lý xung đột ghi",
        lesson: `**Mục tiêu.** So được single-leader với multi-leader trên bốn trục mà sách dùng cho triển khai đa region, và chọn được chiến lược giải quyết xung đột thay vì mặc định bật LWW.

**Đọc.** [Multi-Leader Replication](#/docs/ddia-06) mở đầu bằng lý do sách bỏ qua multi-leader đồng bộ. [Vận hành phân tán theo địa lý](#/docs/ddia-06) là bản so sánh bốn trục — hiệu năng, khả năng chịu sự cố ngừng hoạt động của region, khả năng chịu các vấn đề về mạng, tính nhất quán — đọc kỹ trục cuối, vì nó nói vì sao bạn không thể đảm bảo một tài khoản không âm hay một username là duy nhất. [Các topology của multi-leader replication](#/docs/ddia-06) cho ba topology ở Hình 6-7 và mẹo gắn thẻ định danh node để chặn vòng lặp replication vô hạn; [Các vấn đề với những topology khác nhau](#/docs/ddia-06) cho Hình 6-8. [Sync Engine và phần mềm Local-First](#/docs/ddia-06) cùng hai phần con đọc vừa phải. Phần còn lại là trọng tâm: [Xử lý các thao tác ghi xung đột](#/docs/ddia-06) với [Tránh xung đột](#/docs/ddia-06), [Last write wins (loại bỏ các thao tác ghi đồng thời)](#/docs/ddia-06), [Giải quyết xung đột thủ công](#/docs/ddia-06), [Giải quyết xung đột tự động](#/docs/ddia-06), [Conflict-free replicated datatypes và operational transformation](#/docs/ddia-06) và [Các loại xung đột](#/docs/ddia-06).

**Bẫy.** Bật LWW rồi coi như đã "xử lý xung đột". Sách nói chính cái tên gây hiểu lầm: khi hai lần ghi là đồng thời thì lần nào mới hơn là không xác định, nên thứ tự timestamp của chúng về bản chất là ngẫu nhiên — ý nghĩa thật của LWW là một lần ghi được chọn ngẫu nhiên làm bên thắng còn các lần còn lại bị loại bỏ âm thầm, đạt được hội tụ với cái giá là mất dữ liệu. Bẫy thứ hai: merge sibling bằng phép hợp tập hợp cho chắc. Sách kể chuyện giỏ hàng Amazon: giữ lại mọi mặt hàng xuất hiện ở bất kỳ sibling nào khiến mặt hàng khách đã xóa bất ngờ quay lại giỏ, đúng như Hình 6-10.

**Tự kiểm tra.** Trong chiến lược tránh xung đột, vì sao việc cho phép đổi leader được chỉ định của một bản ghi lại làm hỏng cả chiến lược? Và OT khác CRDT ở chỗ nào khi hai người chèn vào cùng một vị trí?`,
      },
      {
        id: "dd-w5-4",
        text: "Leaderless: quorum, read repair, sloppy quorum",
        lesson: `**Mục tiêu.** Tính được điều kiện w + r > n cho một cấu hình cụ thể, và nói được vì sao thỏa điều kiện đó vẫn chưa phải một bảo đảm.

**Đọc.** [Leaderless Replication (Replication không có leader)](#/docs/ddia-06) mở đầu, kèm khung LƯU Ý phân biệt Dynamo nguyên bản với DynamoDB ngày nay. [Ghi vào Database khi một Node ngừng hoạt động](#/docs/ddia-06) với Hình 6-12, rồi [Bắt kịp các thao tác ghi bị bỏ lỡ](#/docs/ddia-06) — ba cơ chế read repair, hinted handoff và anti-entropy, thuộc cả ba cùng điểm yếu riêng của từng cái. [Dùng quorum cho việc đọc và ghi](#/docs/ddia-06) là mục đọc chậm nhất: n, w, r, lựa chọn phổ biến w = r = (n + 1) / 2 làm tròn lên, và Hình 6-13. [Hiểu các giới hạn của tính nhất quán quorum (quorum consistency)](#/docs/ddia-06) có năm gạch đầu dòng trường hợp biên — đọc từng cái một. [Giám sát độ cũ của dữ liệu (staleness)](#/docs/ddia-06) và [Hiệu năng của Single-Leader so với Leaderless Replication](#/docs/ddia-06) cho request hedging, gray failure và sloppy quorum; [Vận hành đa vùng (Multi-Region)](#/docs/ddia-06) ngắn. Kết bằng [Phát hiện các thao tác ghi đồng thời](#/docs/ddia-06), [Quan hệ happens-before và tính đồng thời](#/docs/ddia-06), [Ghi nhận quan hệ happens-before](#/docs/ddia-06) — bám năm bước giỏ hàng ở Hình 6-15 — và [Version vector](#/docs/ddia-06).

**Bẫy.** Đọc w + r > n như một bảo đảm rằng mọi lần đọc thấy giá trị mới nhất. Sách nói thẳng rằng trên thực tế điều đó không đơn giản như vậy, và khuyên đừng coi w với r là những đảm bảo tuyệt đối — chúng chỉ cho bạn điều chỉnh *xác suất* đọc phải giá trị cũ; rebalancing, một lần ghi thất bại không được rollback, hay đồng hồ chạy lệch đều có thể phá điều kiện đó. Bẫy thứ hai: bật sloppy quorum rồi vẫn kỳ vọng đọc thấy giá trị vừa ghi. Sách nói rõ không có đảm bảo nào rằng các thao tác đọc sau đó sẽ thấy giá trị vừa ghi, vì lần ghi có thể nằm trên những node không phải replica thông thường của khóa đó.

**Tự kiểm tra.** Với n = 5, w = 3, r = 3 thì hệ thống chịu được mấy node không khả dụng? Và vì sao một số phiên bản duy nhất là không đủ khi có nhiều replica cùng chấp nhận ghi?`,
      },
    ],
  },
  {
    id: "dd-w6",
    week: "Tuần 6",
    title: "Sharding",
    goal: "Quyết định được một hệ thống đã cần shard hay chưa, và nếu cần thì chia theo key range hay theo hash, với secondary index cục bộ hay toàn cục.",
    practice: "Đây là tuần nhẹ nhất cả lộ trình: chương 7 chỉ khoảng 11 nghìn từ, trong khi tuần 7 — chương 8, Transaction — là chương nặng nhất với khoảng 33 nghìn từ. Hãy cố ý dùng phần thời gian dư của tuần này để đọc trước chương 8. Phần việc tay chân: chọn bảng lớn nhất trong hệ thống của bạn, viết ra partition key bạn sẽ chọn, liệt kê ba truy vấn phổ biến nhất chạm vào bảng đó và với mỗi truy vấn ghi rõ nó chạm một shard hay tất cả các shard. Rồi liệt kê mọi secondary index của bảng và đánh dấu cái nào buộc phải trở thành global index.",
    resources: [
      { label: "DDIA 07 — Sharding", href: "#/docs/ddia-07" },
      { label: "zookeeper.apache.org — Apache ZooKeeper", href: "https://zookeeper.apache.org/" },
    ],
    items: [
      {
        id: "dd-w6-1",
        text: "Vì sao phải shard, và sharding cho multitenancy",
        lesson: `**Mục tiêu.** Trả lời được câu hỏi "hệ thống này đã cần shard chưa" bằng lập luận của sách, và kể được bảy lợi ích mà sharding theo tenant mang lại ngoài khả năng mở rộng.

**Đọc.** Phần mở đầu chương cho Hình 7-1 — mỗi node là leader của vài shard và follower của vài shard khác — cùng khung [SHARDING VÀ PARTITIONING](#/docs/ddia-07); chép lại danh sách tên gọi khác nhau của shard (partition trong Kafka, range trong CockroachDB, region trong HBase và TiDB, vnode trong Riak, token-range trong Cassandra, tablet trong Bigtable và ScyllaDB), vì trong tài liệu sản phẩm bạn sẽ gặp những chữ đó chứ hiếm khi gặp chữ "shard". [Ưu và nhược điểm của Sharding](#/docs/ddia-07) là mục quyết định: khái niệm partition key, cái giá của distributed transaction, và cả trường hợp sharding ngay trên một máy để tận dụng từng lõi CPU và kiến trúc NUMA. [Sharding cho Multitenancy](#/docs/ddia-07) liệt kê bảy lợi ích — đọc kỹ cell-based architecture và hai lợi ích mang tính pháp lý — rồi ba thách thức chính ở cuối mục.

**Bẫy.** Shard vì thấy dữ liệu đã "nhiều". Sách gọi sharding là một giải pháp nặng nề chủ yếu chỉ phù hợp ở quy mô lớn, và dặn rằng nếu khối lượng dữ liệu cùng thông lượng ghi của bạn vẫn ở mức một máy đơn lẻ xử lý được — mà ngày nay một máy làm được rất nhiều — thì thường tốt hơn là tránh sharding và giữ một database chỉ có một shard. Bẫy thứ hai: shard để chữa thông lượng đọc. Ngay câu mở mục, sách nói nếu vấn đề nằm ở thông lượng đọc thì bạn không nhất thiết cần sharding; read scaling ở chương 6 mới là công cụ đúng.

**Tự kiểm tra.** Vì sao chọn sai partition key lại đắt đến vậy, và chuyện gì xảy ra với một truy vấn không biết trước partition key? Và mô hình một shard mỗi tenant gãy ở đâu khi bạn có rất nhiều tenant rất nhỏ?`,
      },
      {
        id: "dd-w6-2",
        text: "Chia theo khoảng hay theo hash — hot spot và rebalancing",
        lesson: `**Mục tiêu.** Chọn được giữa chia theo key range và chia theo hash cho một tập dữ liệu cụ thể, và mô tả chính xác thứ gì phải di chuyển khi bạn thêm một node.

**Đọc.** [Sharding dữ liệu Key-Value](#/docs/ddia-07) định nghĩa skew, hot shard và hot key — ba từ bạn sẽ dùng suốt phần còn lại. [Sharding theo Key Range](#/docs/ddia-07) với Hình 7-2 (bộ bách khoa toàn thư in giấy) và ví dụ mạng cảm biến lấy timestamp làm khóa; [Rebalancing dữ liệu được shard theo key range](#/docs/ddia-07) cho presplitting và ngưỡng tách mặc định 10 GB của HBase. Rồi [Sharding theo Hash của khóa](#/docs/ddia-07) cùng ba lược đồ nối tiếp: [Hash modulo số node](#/docs/ddia-07) với Hình 7-3 — tự tính lại ví dụ ba node thêm node thứ tư; [Số shard cố định](#/docs/ddia-07) với cụm 10 node chia sẵn 1.000 shard, mỗi node 100 shard; [Sharding theo khoảng hash](#/docs/ddia-07) với Hình 7-5 và Hình 7-6 (mặc định 16 khoảng mỗi node trong Cassandra, 256 trong ScyllaDB). [Consistent hashing](#/docs/ddia-07) ngắn nhưng đọc kỹ đoạn nói chữ *consistent* ở đây không liên quan gì tới tính nhất quán của replica hay của ACID. Kết bằng [Workload lệch và giảm tải cho hot spot](#/docs/ddia-07) và [Vận hành: Rebalancing tự động và thủ công](#/docs/ddia-07).

**Bẫy.** Nối hai chữ số ngẫu nhiên vào một hot key rồi coi như đã xong. Sách nói mẹo đó chia tải *ghi* ra 100 khóa, nhưng mọi thao tác đọc từ đó phải đọc dữ liệu từ cả 100 khóa rồi kết hợp lại — khối lượng đọc tới mỗi shard của hot key không hề giảm — và bạn còn phải theo dõi sổ sách xem khóa nào đang được chia nhỏ. Bẫy thứ hai: bật rebalancing tự động cạnh phát hiện lỗi tự động. Sách dựng đúng kịch bản hỏng: một node quá tải phản hồi chậm, các node khác kết luận nó đã chết và tự động chuyển tải ra khỏi nó, việc đó lại đặt thêm tải lên mạng và các node còn lại — rủi ro là hỏng hóc dây chuyền.

**Tự kiểm tra.** Vì sao mod N buộc phần lớn khóa phải di chuyển khi N đổi, còn lược đồ số shard cố định thì không? Và vì sao một hot shard có thể bị tách ngay cả khi nó không lưu nhiều dữ liệu?`,
      },
      {
        id: "dd-w6-3",
        text: "Định tuyến request, và secondary index cục bộ so với toàn cục",
        lesson: `**Mục tiêu.** Nêu được ba cách đưa một request tới đúng node, và chọn được giữa secondary index cục bộ và toàn cục dựa trên tỷ lệ đọc/ghi của ứng dụng.

**Đọc.** [Định tuyến request](#/docs/ddia-07) đặt bài toán cạnh service discovery ở tuần 4 và nêu khác biệt cốt lõi: với database được shard, một request cho một khóa chỉ có thể được xử lý bởi node là replica của shard chứa khóa đó. Ba cách tiếp cận ở Hình 7-7 nên chép ra, cùng ba câu hỏi then chốt đi kèm — ai quyết định shard nằm ở node nào, bên định tuyến biết về thay đổi bằng cách nào, và xử lý ra sao với những request còn trên đường trong lúc cutover. Rồi Hình 7-8 với ZooKeeper, và đoạn về gossip protocol của Riak. Nửa sau là [Sharding và secondary index](#/docs/ddia-07): [Local secondary index](#/docs/ddia-07) với Hình 7-9, postings list và khung CẢNH BÁO; [Global Secondary Index](#/docs/ddia-07) với Hình 7-10 và khái niệm term-partitioned. Đọc luôn [Tóm tắt](#/docs/ddia-07) để chốt chương.

**Bẫy.** Tự dựng một secondary index trong mã ứng dụng trên một database chỉ hỗ trợ key-value. Khung CẢNH BÁO nói thẳng: bạn cần hết sức cẩn trọng, vì race condition và các lỗi ghi không liên tục — một số thay đổi được lưu còn số khác thì không — rất dễ khiến index mất đồng bộ với dữ liệu bên dưới. Bẫy thứ hai: nghĩ rằng thêm shard sẽ làm truy vấn qua local secondary index nhanh hơn. Sách nói ngược lại: thêm shard cho phép bạn lưu nhiều dữ liệu hơn nhưng không làm tăng throughput truy vấn, vì dù sao mọi shard cũng phải xử lý mọi truy vấn kiểu đó — và cách hỏi scatter-gather này dễ bị khuếch đại tail latency.

**Tự kiểm tra.** Vì sao một truy vấn chỉ có một điều kiện trên global index chạm đúng một shard, nhưng lấy về bản ghi thay vì ID thì vẫn phải chạm nhiều shard? Và vì sao database leaderless như Riak chấp nhận được split brain trong việc gán shard, còn HBase thì không?`,
      },
    ],
  },
];
