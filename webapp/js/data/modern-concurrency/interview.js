// Ngân hàng câu hỏi phỏng vấn Modern Concurrency in Java — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Modern Concurrency in Java (O'Reilly).
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js.
//
// GIỮ NGUYÊN id (modconc-iq01–modconc-iq24) — thống kê tự chấm lưu theo id.

export const modernConcurrencyInterview = [
  // ===== mc-vthread (modconc-iq01–modconc-iq04) =====
  {
    id: "modconc-iq01",
    field: "modern-concurrency",
    topic: "mc-vthread",
    level: 1,
    minutes: 5,
    question: "Virtual thread làm mô hình \"một thread một task\" khả thi lại. Nêu điều gì trước đây khiến mô hình đó không dùng được, và virtual thread đổi chính xác cái gì.",
    mustCover: [
      "Thread nền tảng tương ứng một thread hệ điều hành, nên nó tốn **bộ nhớ stack** và **chi phí lập lịch**",
      "Vì vậy số thread bị giới hạn ở bậc nghìn, và mô hình một thread một task vỡ khi cần hàng chục nghìn kết nối",
      "Lối thoát trước đây là lập trình bất đồng bộ, đổi khả năng mở rộng bằng **khả năng đọc**",
      "Virtual thread làm thread **rẻ để tạo** và **rẻ để chặn**, nên chặn thôi là một thao tác tốn kém",
      "Điều đổi chính xác: khi virtual thread chặn, runtime **nhả thread nền tảng** thay vì để nó bị treo",
      "Nhờ vậy ta viết mã tuần tự — stack trace có nghĩa, debug bình thường — mà vẫn mở rộng được",
    ],
    model: "Vấn đề gốc là chi phí của chính thread. Một thread nền tảng tương ứng một thread hệ điều hành: nó cần một vùng stack được cấp trước và nó tham gia vào việc lập lịch của kernel, nên số thread khả dụng bị giới hạn ở bậc nghìn. Điều đó buộc ta từ bỏ mô hình một thread một task ngay khi cần phục vụ hàng chục nghìn kết nối đồng thời — dù mô hình ấy là mô hình dễ viết và dễ đọc nhất, vì nó cho mỗi luồng công việc một ngăn xếp riêng, một stack trace có nghĩa, và một luồng điều khiển đọc từ trên xuống. Lối thoát trước đây là lập trình bất đồng bộ: callback, future, reactive. Nó mở rộng tốt nhưng ta trả bằng khả năng đọc — luồng điều khiển bị cắt vụn, stack trace mất nghĩa vì nó chỉ cho thấy cơ chế điều phối chứ không cho thấy đường đi nghiệp vụ, và việc debug trở nên khó hơn nhiều bậc. Virtual thread đổi đúng một thứ, và mọi lợi ích khác suy ra từ đó: nó làm thread trở nên rẻ để tạo và rẻ để **chặn**. Trước đây chặn là thao tác đắt vì nó giữ một thread hệ điều hành ở trạng thái không làm gì; với virtual thread, khi nó gặp một điểm chờ mà runtime hiểu được, runtime lưu trạng thái của nó lại và nhả thread nền tảng cho virtual thread khác dùng. Nên chặn thôi là vấn đề. Hệ quả thực hành là ta lấy lại được mô hình một thread một task ở quy mô rất lớn: viết mã tuần tự, đọc mã tuần tự, debug mã tuần tự, mà vẫn đạt mức mở rộng trước đây phải trả bằng lối bất đồng bộ. Đó là một sự đổi trục — không phải làm mã nhanh hơn mà là bỏ đi lý do buộc ta viết mã khó đọc.",
    redFlags: [
      "Nói virtual thread làm ứng dụng nhanh hơn",
      "Mô tả nó như một thread hệ điều hành nhẹ hơn",
      "Không nêu được rằng cái đổi là chi phí của việc chặn",
    ],
    probes: [
      "Vì sao stack trace của mã reactive lại mất nghĩa?",
      "Với workload thuần tính toán thì virtual thread đổi gì?",
      "Điểm chờ nào runtime hiểu được và điểm nào không?",
    ],
    refs: ["modconc-02", "modconc-01"],
  },
  {
    id: "modconc-iq02",
    field: "modern-concurrency",
    topic: "mc-vthread",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `// Đội đo hai cấu hình, mỗi request gọi HTTP mất ~200ms
// A: pool 200 thread nền tảng
// B: virtual thread cho mỗi request

// Kết quả đo:
//   A: 980 request/giây,  p99 = 240ms
//   B: 9.400 request/giây, p99 = 255ms

// Đội kết luận: "virtual thread nhanh hơn 9,6 lần"

// Và họ áp cùng cách đó cho một endpoint khác — thuần tính toán,
// mỗi request ~80ms CPU trên máy 8 core:
//   A: 98 request/giây,  p99 = 82ms
//   B: 101 request/giây, p99 = 790ms      // (!)`,
    },
    question: "Sửa lại kết luận của đội cho đúng. Rồi giải thích vì sao ở endpoint thứ hai, p99 lại **xấu đi gần 10 lần** trong khi thông lượng gần như không đổi.",
    mustCover: [
      "Kết luận sai ở chữ \"nhanh hơn\": p99 gần như **không đổi** (240 so với 255ms) — một request không nhanh hơn",
      "Cái tăng là **thông lượng**, tức số request đồng thời máy gánh được",
      "Phát biểu đúng: virtual thread cho **scale**, không cho **speed**",
      "Endpoint thứ hai thuần tính toán nên trần là **số core**, và cả hai cấu hình đều đạt trần đó — thông lượng không đổi",
      "Nhưng virtual thread nhận **tất cả** request vào cùng lúc thay vì xếp hàng ở pool",
      "Nên mọi request cùng tranh 8 core, mỗi cái tiến chậm hơn, và p99 nổ",
      "Ở cấu hình A, pool 200 thread đóng vai **hàng đợi**: request chờ ngoài rồi được xử lý nhanh",
      "Bài học: với workload CPU-bound, bỏ giới hạn đồng thời làm độ trễ đuôi xấu đi mà không được gì",
    ],
    model: "Kết luận của đội sai ở đúng một từ, và số liệu của chính họ chứng minh điều đó: p99 đi từ 240ms lên 255ms, tức một request **không** nhanh hơn chút nào — thậm chí nhỉnh lên vì chi phí mount và unmount. Cái tăng 9,6 lần là thông lượng, tức số request đồng thời mà một máy gánh được. Phát biểu đúng là virtual thread sinh ra cho scale chứ không cho speed, và với một endpoint chờ I/O thì đó chính là điều ta cần — 200 thread nền tảng bị chặn 200ms mỗi request nên trần là khoảng một nghìn request mỗi giây, còn virtual thread nhả thread nền tảng trong lúc chờ nên trần cao hơn nhiều bậc. Endpoint thứ hai là ca đáng nói hơn, và nó cho thấy hệ quả của việc áp cùng một công cụ cho một hình dạng tải khác. Công việc thuần tính toán trên máy 8 core có trần cứng là số core: khoảng 100 request mỗi giây với 80ms CPU mỗi request, và cả hai cấu hình đều đạt đúng trần đó — nên thông lượng không đổi là hoàn toàn hợp lý, virtual thread không tạo thêm core nào. Nhưng p99 xấu đi gần 10 lần vì một lý do khác: virtual thread **nhận tất cả** request vào xử lý cùng lúc, thay vì để chúng xếp hàng bên ngoài. Ở cấu hình A, pool 200 thread đóng vai một hàng đợi ngầm: request thứ 201 chờ bên ngoài, và khi nó được nhận thì nó chạy gần như trọn 80ms liên tục, nên p99 sát với thời gian xử lý thật. Ở cấu hình B, hàng nghìn virtual thread cùng tranh 8 core, mỗi cái chỉ được một lát thời gian nhỏ rồi bị gạt ra, nên một request mất rất lâu mới hoàn thành dù CPU vẫn chạy hết công suất. Bài học rút ra và là điều tôi muốn đội nhớ: với workload CPU-bound, bỏ giới hạn đồng thời không được gì về thông lượng mà làm độ trễ đuôi xấu đi — nên phần tính toán cần một trần đồng thời tường minh, đặt gần số core.",
    redFlags: [
      "Chấp nhận \"nhanh hơn 9,6 lần\" vì con số thông lượng có thật",
      "Giải thích p99 xấu đi bằng chi phí mount/unmount — nó quá nhỏ so với 10 lần",
      "Đề nghị tăng số core làm cách sửa cho endpoint thứ hai",
      "Kết luận virtual thread không dùng được cho ứng dụng có cả hai loại endpoint",
    ],
    probes: [
      "Bạn đặt trần đồng thời cho phần tính toán bằng cách nào?",
      "Vì sao pool 200 thread lại hoạt động như một hàng đợi?",
      "Với ứng dụng có cả hai loại endpoint, bạn thiết kế thế nào?",
    ],
    refs: ["modconc-02", "modconc-03"],
  },
  {
    id: "modconc-iq03",
    field: "modern-concurrency",
    topic: "mc-vthread",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ có ba phần: tầng nhận request gọi bốn API, một job nén ảnh, và một tuyến reactive đang chạy tốt. Phần nào nhận virtual thread, phần nào không, và bạn kiểm gì trước khi bật?",
    tradeoffs: [
      {
        option: "Áp cho tầng **nhận request** và mọi đường **chờ I/O**",
        when: "Đúng bài: mỗi request một virtual thread, mọi lời gọi ra ngoài chặn bình thường. Mã tuần tự, stack trace có nghĩa, và mở rộng theo số việc chờ chứ không theo số thread.",
      },
      {
        option: "Giữ pool nền tảng cho phần **tính toán**",
        when: "Công việc CPU-bound cần một trần đồng thời gần số core. Virtual thread ở đây không tăng thông lượng mà làm độ trễ đuôi xấu đi, nên pool có kích thước cố định là công cụ đúng.",
      },
      {
        option: "Giữ nguyên phần đã viết reactive",
        when: "Khi nó đang hoạt động và không phải nút thắt. Viết lại một tuyến reactive thành tuần tự là công việc lớn với rủi ro thật, nên chỉ làm khi có lý do khác ngoài việc thống nhất phong cách.",
      },
    ],
    mustCover: [
      "Trước khi chuyển phải rà **ghim**: chặn trong `synchronized` hoặc trong lời gọi native làm virtual thread không nhả được carrier",
      "Ghim thường đến từ **thư viện** chứ không từ mã của mình — driver hoặc pool cũ",
      "Phải bật cơ chế theo dõi ghim và **đo** thay vì tin rằng đã ổn",
      "Kích thước pool từng là **giới hạn ngầm** cho số việc đồng thời; bỏ nó thì phải thay bằng giới hạn tường minh",
      "Tài nguyên bên dưới vẫn có trần: connection pool, API đối tác, bộ nhớ cho request đang xử lý",
      "`ThreadLocal` dùng cho ngữ cảnh sẽ tốn kém khi có hàng chục nghìn thread — đó là chỗ scoped value vào",
      "Không chuyển phần tính toán, và không viết lại phần reactive đang chạy tốt chỉ để thống nhất phong cách",
    ],
    model: "Tôi chia dịch vụ theo hình dạng công việc chứ không chuyển đồng loạt. Phần áp virtual thread là tầng nhận request và mọi đường chờ I/O: mỗi request một virtual thread, các lời gọi ra ngoài cứ chặn bình thường, và ta được mã tuần tự với stack trace có nghĩa. Phần giữ nguyên pool nền tảng là phần tính toán, vì ở đó trần là số core và việc nhận tất cả vào cùng lúc chỉ làm độ trễ đuôi xấu đi — pool có kích thước cố định là công cụ đúng cho công việc CPU-bound, không phải di sản cần loại bỏ. Trước khi chuyển, việc bắt buộc là rà ghim. Virtual thread không nhả được carrier khi nó chặn bên trong một khối `synchronized` hoặc đang trong lời gọi native, và khi đó ta quay lại đúng giới hạn cũ — carrier bị giữ y như một thread nền tảng bị chặn. Điều đáng lưu ý là ghim thường không nằm trong mã của mình mà trong thư viện: một driver cũ hay một connection pool cũ đầy `synchronized`, và đó chính là lý do nhiều đội bật virtual thread lên rồi không thấy cải thiện gì. Nên tôi bật cơ chế theo dõi ghim và đo, chứ không tuyên bố thành công dựa trên suy luận. Điểm thứ hai phải xử lý là một thứ vô hình: kích thước pool cũ đang đóng vai giới hạn ngầm cho số việc đồng thời trong toàn hệ thống. Bỏ nó nghĩa là bỏ một cơ chế bảo vệ mà không ai khai ra, nên phải thay bằng giới hạn tường minh — semaphore ở từng đường gọi ra ngoài, và một trần ở tầng vào để bảo vệ bộ nhớ. Tài nguyên bên dưới vẫn có trần như cũ: connection pool vẫn 20 connection, API đối tác vẫn chịu được một mức nhất định. Điểm thứ ba là ngữ cảnh: nếu dịch vụ dùng `ThreadLocal` để truyền ngữ cảnh request thì với hàng chục nghìn thread nó trở nên tốn kém, và đó chính là chỗ scoped value thay thế được. Cuối cùng, phần đã viết reactive và đang chạy tốt thì tôi để yên — viết lại nó thành tuần tự là công việc lớn với rủi ro thật, và \"thống nhất phong cách\" không phải một lý do đủ.",
    redFlags: [
      "Chuyển đồng loạt cả phần tính toán",
      "Không rà ghim trong thư viện trước khi chuyển",
      "Bỏ pool mà không thay bằng giới hạn tường minh nào",
      "Viết lại phần reactive đang chạy tốt để thống nhất phong cách",
    ],
    probes: [
      "Bạn phát hiện ghim trong một thư viện bên thứ ba thế nào?",
      "Giới hạn tường minh của bạn đặt ở đâu và bằng gì?",
      "`ThreadLocal` tốn kém ra sao khi có 50.000 thread?",
    ],
    refs: ["modconc-02", "modconc-07"],
  },
  {
    id: "modconc-iq04",
    field: "modern-concurrency",
    topic: "mc-vthread",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Sau khi bật virtual thread, một dịch vụ chịu tải tốt hơn nhưng bắt đầu có những đợt 20–40 giây gần như không xử lý được request nào, mỗi giờ vài lần. CPU trong đợt đó rất thấp. Dump virtual thread cho thấy hàng nghìn thread đứng ở cùng một điểm: một lời gọi vào thư viện ghi log của đội, và method đó khai `synchronized`.",
      scale: "Trước: 1.200 request/giây. Sau: 4.800 request/giây, nhưng với các đợt treo. Máy 8 core nên có 8 carrier thread.",
      constraints: "Không đổi được thư viện ghi log — nó là thư viện nội bộ dùng bởi 12 dịch vụ và đội sở hữu không có kế hoạch sửa trong quý này. Không quay lại thread nền tảng. Phải giải thích được vì sao CPU thấp mà hệ thống đứng.",
      },
    question: "Nối `synchronized` trong thư viện log với các đợt treo. Làm phép tính, rồi nêu cách sửa khi không đổi được thư viện.",
    mustCover: [
      "Chặn bên trong `synchronized` làm virtual thread bị **ghim** vào carrier — nó không nhả được",
      "Chỉ có **8 carrier thread**, nên chỉ cần 8 virtual thread bị ghim đồng thời là **cạn** toàn bộ carrier",
      "Khi cạn carrier, mọi virtual thread khác không được chạy — kể cả những cái không liên quan tới log",
      "CPU thấp vì các thread bị ghim đang **chờ**, không tính toán — đây là dấu hiệu phân biệt với quá tải CPU",
      "Ghi log có I/O đĩa, nên khoảng chờ bên trong `synchronized` đủ dài để 8 carrier bị chiếm cùng lúc",
      "Sửa khi không đổi được thư viện: **đưa việc ghi log ra khỏi đường request** — hàng đợi cộng một thread nền tảng riêng ghi",
      "Cách thứ hai: gọi thư viện log trong một **executor nền tảng riêng**, để việc bị ghim không chạm tới carrier",
      "Và bật theo dõi ghim làm cổng kiểm chứng, để lần sau lỗi này lộ ra ngay chứ không sau nhiều tuần",
    ],
    model: "Chuỗi nối rất ngắn và phép tính làm nó hiển nhiên. Virtual thread bị ghim vào carrier khi nó chặn bên trong một khối `synchronized`, và ở đây method ghi log khai `synchronized` trong khi bên trong nó có I/O đĩa — nên mỗi lần một virtual thread ghi log, nó chiếm một carrier thread và không nhả được cho tới khi ghi xong. Máy 8 core nên chỉ có 8 carrier thread. Vậy chỉ cần **8** virtual thread cùng ghi log là toàn bộ carrier bị chiếm, và từ giây phút đó không virtual thread nào khác được chạy — kể cả hàng nghìn thread đang làm việc chẳng liên quan gì tới log. Với 4.800 request mỗi giây, mỗi request ghi ít nhất một dòng log, thì việc có 8 thread cùng ở trong đoạn ghi log không phải khả năng xa xôi mà là chuyện xảy ra liên tục; nó chỉ biến thành đợt treo dài khi I/O đĩa chậm lại — một lần xả bộ đệm, một lần cạnh tranh đĩa với tiến trình khác. Chi tiết CPU rất thấp là bằng chứng xác nhận và cũng là thứ phân biệt ca này với quá tải: các thread bị ghim đang **chờ** I/O chứ không tính toán, nên hệ thống đứng mà CPU rảnh. Nếu là quá tải CPU thì ta sẽ thấy ngược lại. Điều đáng nói là sự cố này chỉ xuất hiện **sau** khi bật virtual thread, nhưng `synchronized` trong thư viện log đã ở đó từ trước: với thread nền tảng, một thread bị chặn trong log chỉ ảnh hưởng chính nó, còn với virtual thread nó chiếm một trong tám carrier và ảnh hưởng toàn bộ. Cùng một đoạn mã, hai hệ quả khác nhau về bậc. Về cách sửa trong ràng buộc không đổi được thư viện: tôi không cần đổi nó, tôi chỉ cần nó đừng chạy trên carrier. Cách tốt nhất là đưa việc ghi log ra khỏi đường request hoàn toàn — request đẩy bản ghi log vào một hàng đợi trong bộ nhớ, và một hoặc vài thread nền tảng riêng lấy ra rồi gọi thư viện. Khi đó việc bị ghim xảy ra trên thread nền tảng, nơi nó vô hại, và đường request không bao giờ chạm vào `synchronized` ấy. Cách thứ hai đơn giản hơn nếu không muốn dựng hàng đợi: gọi thư viện log trong một executor nền tảng riêng. Và tôi sẽ bật cơ chế theo dõi ghim thành một cổng kiểm chứng thường trực, vì bài học lớn hơn ở đây là bất kỳ `synchronized` nào bọc I/O trong bất kỳ thư viện nào cũng là một quả bom tương tự — và ta cần thấy nó ngay chứ không sau nhiều tuần.",
    redFlags: [
      "Kết luận quá tải rồi đi giảm tải — CPU thấp đã loại giả thuyết đó",
      "Tăng số carrier thread làm cách sửa chính",
      "Quay lại thread nền tảng — ràng buộc đã cấm, và nó chỉ che lại vấn đề",
      "Yêu cầu đội sở hữu thư viện sửa như điều kiện để tiếp tục",
      "Bỏ ghi log để hết ghim",
    ],
    probes: [
      "Vì sao cùng đoạn mã đó vô hại với thread nền tảng?",
      "Bạn đặt kích thước hàng đợi log thế nào, và làm gì khi nó đầy?",
      "Còn chỗ nào khác trong stack của bạn có `synchronized` bọc I/O?",
    ],
    refs: ["modconc-02", "modconc-03"],
  },

  // ===== mc-mechanics (modconc-iq05–modconc-iq08) =====
  {
    id: "modconc-iq05",
    field: "modern-concurrency",
    topic: "mc-mechanics",
    level: 1,
    minutes: 5,
    question: "Continuation là gì, và nó là cơ chế nằm dưới thứ gì trong Java hiện đại?",
    mustCover: [
      "Continuation là khả năng **lưu lại trạng thái thực thi** của một luồng công việc rồi **tiếp tục** nó sau",
      "Cụ thể là lưu ngăn xếp lời gọi cùng vị trí đang chạy, để khôi phục đúng chỗ đã dừng",
      "Nó là cơ chế nằm dưới **virtual thread**: unmount là lưu continuation, mount là khôi phục nó",
      "Nhờ vậy việc chặn không cần giữ một thread hệ điều hành — trạng thái nằm trên heap thay vì trên stack của kernel",
      "Đó cũng là lý do virtual thread rẻ: cái đắt là thread OS, không phải bản thân ngăn xếp logic",
      "Continuation trong Java là chi tiết **nội bộ**, không phải API công khai để dùng trực tiếp",
    ],
    model: "Continuation là khả năng lưu lại trạng thái thực thi của một luồng công việc — ngăn xếp lời gọi cùng vị trí đang chạy — rồi tiếp tục nó sau, đúng từ chỗ đã dừng. Ý tưởng không mới trong khoa học máy tính, nhưng việc nó có mặt trong JVM là điều làm virtual thread khả thi. Quan hệ giữa hai thứ rất trực tiếp: khi một virtual thread gặp điểm chờ và unmount, điều thực sự diễn ra là runtime lưu continuation của nó; khi dữ liệu về và nó mount lại, runtime khôi phục continuation đó lên một carrier thread, có thể là một carrier khác với lần trước. Nhìn theo cách này thì lợi ích của virtual thread hiện ra rõ hơn: điều đắt đỏ trong mô hình cũ không phải bản thân ngăn xếp logic của một luồng công việc mà là việc mỗi ngăn xếp đó phải gắn với một thread hệ điều hành. Continuation cho phép tách hai thứ đó: trạng thái luồng công việc nằm trên heap dưới dạng dữ liệu, còn thread nền tảng chỉ là tài nguyên để chạy nó trong lúc nó thực sự cần CPU. Đó là lý do có thể có hàng trăm nghìn virtual thread trong khi chỉ có vài carrier — phần lớn chúng tồn tại dưới dạng trạng thái đã lưu, không dưới dạng thread đang tồn tại ở kernel. Một điểm đáng nói để không nhầm: continuation trong Java là chi tiết nội bộ của runtime, không phải API công khai để ta dùng trực tiếp. Biết nó có ích để hiểu vì sao virtual thread hành xử như vậy — vì sao unmount chỉ xảy ra ở những điểm chờ mà runtime hiểu được, và vì sao chặn bên trong một khối `synchronized` hay trong lời gọi native lại không unmount được: ở những chỗ đó trạng thái không nằm hoàn toàn trong tầm kiểm soát của runtime nên nó không lưu được continuation một cách an toàn.",
    redFlags: [
      "Mô tả continuation như một API để gọi trực tiếp",
      "Không nối được continuation với cơ chế mount/unmount của virtual thread",
      "Nói virtual thread rẻ vì \"nó nhỏ hơn\" mà không nêu việc tách trạng thái khỏi thread OS",
    ],
    probes: [
      "Vì sao chặn trong `synchronized` lại không unmount được, xét theo continuation?",
      "Trạng thái của một virtual thread đang chờ nằm ở đâu?",
      "Điều gì giới hạn số virtual thread nếu không phải số thread OS?",
    ],
    refs: ["modconc-03"],
  },
  {
    id: "modconc-iq06",
    field: "modern-concurrency",
    topic: "mc-mechanics",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Đội muốn "dùng virtual thread" nên đổi mọi executor sang virtual
ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor();

// (A) Gọi 6 dịch vụ song song cho mỗi request
List<Future<Part>> parts = new ArrayList<>();
for (var url : urls) parts.add(exec.submit(() -> httpGet(url)));   // chờ mạng

// (B) Nén 200 ảnh trong một job nền, cùng executor
List<Future<byte[]>> imgs = new ArrayList<>();
for (var img : images) imgs.add(exec.submit(() -> compress(img))); // CPU 300ms

// (C) Một tác vụ định kỳ giữ trạng thái trong ThreadLocal
private static final ThreadLocal<Cache> CACHE = ThreadLocal.withInitial(Cache::new);`,
    },
    question: "Ba chỗ dùng này có một chỗ đúng và hai chỗ sai. Chỉ ra, giải thích, rồi sửa hai chỗ sai.",
    mustCover: [
      "(A) **đúng**: sáu lời gọi chờ mạng là đúng bài của virtual thread, và mỗi tác vụ một thread là mô hình mong muốn",
      "(B) **sai**: 200 tác vụ CPU 300ms chạy đồng thời trên số carrier bằng số core — chúng tranh nhau chứ không nhanh hơn",
      "Với CPU-bound thì cần **trần đồng thời gần số core**, nên dùng một pool nền tảng cố định",
      "Tệ hơn: 200 tác vụ nén ảnh chiếm carrier, nên chúng làm chậm cả những virtual thread ở (A)",
      "(C) **sai**: `ThreadLocal` với mô hình một thread một tác vụ nghĩa là mỗi tác vụ tạo một `Cache` **mới**",
      "Nên cache không bao giờ được dùng lại, và với số lượng lớn thì nó còn tạo áp lực bộ nhớ",
      "Sửa (B): tách một executor nền tảng riêng cho việc nén, kích thước đặt theo số core",
      "Sửa (C): bỏ `ThreadLocal` và dùng một cache **chia sẻ** thread-safe, hoặc truyền ngữ cảnh bằng scoped value nếu đó là ngữ cảnh chứ không phải cache",
    ],
    model: "Chỗ đúng là (A). Sáu lời gọi HTTP là công việc chờ mạng, nên mỗi lời gọi một virtual thread là đúng mô hình: chúng unmount trong lúc chờ, carrier được dùng cho việc khác, và mã đọc tuần tự. Chỗ sai thứ nhất là (B). Nén ảnh là công việc thuần CPU, mỗi tác vụ 300ms, và virtual thread không tạo thêm core nào — số carrier vẫn xấp xỉ số core. Nên 200 tác vụ submit cùng lúc không chạy nhanh hơn; chúng tranh nhau cùng một lượng CPU, mỗi cái tiến chậm hơn, và tổng thời gian gần như không đổi trong khi thời gian hoàn thành của từng tác vụ xấu đi rất nhiều. Nhưng hậu quả nghiêm trọng hơn nằm ở chỗ chúng **dùng chung executor** với (A): các tác vụ CPU-bound chiếm carrier trong những khoảng dài, nên các virtual thread ở (A) không được chạy dù chúng chỉ cần vài microsecond để xử lý phản hồi. Một quyết định về job nền làm chậm đường phục vụ request — đúng dạng ảnh hưởng lan ra ngoài phạm vi mà ta hay gặp khi dùng chung pool. Sửa bằng cách tách một executor nền tảng riêng cho việc nén, kích thước cố định đặt gần số core, và để job nền chạy chậm hơn một cách có kiểm soát thay vì tranh với đường nóng. Chỗ sai thứ hai là (C), và nó tinh vi hơn. `ThreadLocal` lưu giá trị theo thread, nên với mô hình một thread cho mỗi tác vụ thì **mỗi tác vụ** nhận một `Cache` mới toanh — cache không bao giờ được dùng lại, tức nó hoàn toàn vô ích, và nếu số tác vụ lớn thì ta còn cấp phát hàng nghìn object cache rồi bỏ đi. Với thread pool nền tảng thì mã này vô tình hoạt động vì thread được tái sử dụng; chuyển sang virtual thread làm giả định ngầm ấy sụp. Cách sửa phụ thuộc ý định thật: nếu nó là một cache thì nó phải là cache **chia sẻ** và thread-safe, không phải cache theo thread; nếu nó thực ra là ngữ cảnh cần truyền xuống chuỗi lời gọi thì đó chính là chỗ scoped value thay thế được `ThreadLocal`.",
    redFlags: [
      "Nói cả ba đều đúng vì virtual thread \"tốt hơn thread nền tảng\"",
      "Sửa (B) bằng cách giới hạn số submit mà vẫn dùng chung executor với (A)",
      "Giữ `ThreadLocal` và chỉ thêm logic dọn",
      "Không nhận ra (B) làm chậm (A) qua carrier dùng chung",
    ],
    probes: [
      "Vì sao mã (C) vô tình hoạt động với thread pool nền tảng?",
      "Bạn đặt kích thước executor nén ảnh bằng bao nhiêu?",
      "Nếu (C) thực ra là ngữ cảnh request thì bạn dùng gì?",
    ],
    refs: ["modconc-03", "modconc-05"],
  },
  {
    id: "modconc-iq07",
    field: "modern-concurrency",
    topic: "mc-mechanics",
    level: 3,
    minutes: 10,
    question: "Bạn cần chạy nhiều tác vụ đồng thời. Chọn `ExecutorService` với pool nền tảng, executor virtual thread, hay `ForkJoinPool`?",
    tradeoffs: [
      {
        option: "Executor virtual thread — một thread cho mỗi tác vụ",
        when: "Tác vụ **chờ nhiều** và số lượng lớn. Không cần chọn kích thước pool, và chặn là rẻ. Nhưng nó **không có trần**, nên phải tự đặt giới hạn đồng thời cho những tài nguyên bên dưới có trần.",
      },
      {
        option: "Pool nền tảng kích thước cố định",
        when: "Tác vụ **CPU-bound**, hoặc khi ta cần chính kích thước pool làm trần đồng thời. Kích thước đặt gần số core cho CPU-bound. Đây vẫn là công cụ đúng, không phải di sản.",
      },
      {
        option: "`ForkJoinPool`",
        when: "Thuật toán **đệ quy chia để trị** với các nhánh không đều nhau — cơ chế cướp việc cân bằng tải tốt. Không phù hợp cho tác vụ chặn, và không phù hợp cho những tác vụ độc lập phẳng.",
      },
    ],
    mustCover: [
      "Trục phân loại đầu tiên là **chờ hay tính**, vì nó quyết định trần thật của hệ thống",
      "Với chờ nhiều thì virtual thread bỏ được việc phải chọn kích thước pool — một tham số vốn khó đặt đúng",
      "Với CPU-bound thì pool cố định gần số core là đúng, và virtual thread làm độ trễ đuôi xấu đi",
      "`ForkJoinPool` đúng cho hình dạng **đệ quy**, và cơ chế cướp việc là lý do chọn nó",
      "Không bao giờ trộn tác vụ chờ với tác vụ tính trong **cùng** một executor",
      "Với virtual thread, mất trần ngầm nên phải thay bằng semaphore ở từng đường ra ngoài",
      "Nếu chọn executor virtual thread thì phải biết **thư viện nào** tác vụ đi qua, vì một chỗ chặn trong `synchronized` biến cả executor về đúng trần cũ",
    ],
    model: "Tôi phân loại trước bằng một câu hỏi: tác vụ này phần lớn thời gian **chờ** hay **tính**? Câu trả lời quyết định trần thật của hệ thống, và mọi lựa chọn sau đó suy ra từ nó. Nếu chờ nhiều và số lượng lớn thì executor virtual thread là lựa chọn đúng, và lợi ích lớn nhất không phải hiệu năng mà là bỏ được một tham số khó: kích thước pool. Với pool nền tảng cho tác vụ chờ, ta phải ước lượng tỉ lệ chờ trên tính rồi chọn một con số, và con số đó sai ngay khi độ trễ của phụ thuộc thay đổi; với virtual thread thì câu hỏi ấy biến mất. Đổi lại, nó **không có trần**, nên tôi phải thay trần ngầm cũ bằng trần tường minh: semaphore ở từng đường gọi ra ngoài, đặt theo dung lượng thật của tài nguyên bên dưới. Nếu CPU-bound thì pool nền tảng kích thước cố định gần số core là công cụ đúng, và tôi sẽ nói rõ đây không phải di sản cần loại bỏ — với công việc tính toán, việc nhận tất cả vào cùng lúc chỉ làm độ trễ đuôi xấu đi mà không tăng thông lượng, nên một trần cứng là điều ta **muốn**. `ForkJoinPool` giải một hình dạng khác: thuật toán đệ quy chia để trị, nơi một tác vụ tự chia thành các tác vụ con và các nhánh không đều nhau. Cơ chế cướp việc của nó cân bằng tải giữa các worker, và đó là lý do chọn nó — không phải vì nó nhanh hơn nói chung. Nó không phù hợp cho tác vụ chặn, và cũng không phù hợp cho một tập tác vụ độc lập phẳng, nơi một pool thường là đủ. Nguyên tắc xuyên suốt mà tôi coi quan trọng hơn cả ba lựa chọn: không bao giờ trộn tác vụ chờ với tác vụ tính trong cùng một executor. Trộn chúng nghĩa là không thể đặt kích thước đúng cho cả hai, và một loại sẽ chiếm tài nguyên của loại kia — đó là nguồn của những sự cố mà triệu chứng xuất hiện ở nơi hoàn toàn khác với nguyên nhân. Và nếu dùng virtual thread thì bước bắt buộc là kiểm ghim, vì một thư viện dùng `synchronized` bọc I/O sẽ biến mọi lợi ích thành con số không.",
    redFlags: [
      "Chọn virtual thread cho mọi thứ vì nó mới hơn",
      "Trộn tác vụ chờ và tác vụ tính trong cùng executor",
      "Coi pool nền tảng là di sản cần loại bỏ",
      "Dùng virtual thread mà không đặt trần đồng thời nào",
    ],
    probes: [
      "Bạn đặt permit cho semaphore ở đường gọi database bằng bao nhiêu?",
      "Vì sao cơ chế cướp việc quan trọng với nhánh không đều?",
      "Trộn hai loại tác vụ gây ra triệu chứng gì, và ở đâu?",
    ],
    refs: ["modconc-03", "modconc-02"],
  },
  {
    id: "modconc-iq08",
    field: "modern-concurrency",
    topic: "mc-mechanics",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ dùng virtual thread bị cạn bộ nhớ sau 3–5 giờ chạy ở tải cao, và bị kernel giết. Heap dump cho thấy khoảng 240.000 virtual thread đang tồn tại, phần lớn đứng chờ ở một lời gọi HTTP tới một dịch vụ đối tác. Đối tác đó có p99 khoảng 8 giây và không có timeout nào được đặt ở phía gọi.",
      scale: "3.000 request/giây, mỗi request tạo một virtual thread và gọi đối tác một lần. Container 3Gi. Trước khi bật virtual thread, dịch vụ dùng pool 300 thread và chưa từng cạn bộ nhớ.",
      constraints: "Không sửa được dịch vụ đối tác. Không quay lại thread nền tảng. Phải giữ được năng lực đã tăng, không đánh đổi hết để lấy ổn định.",
      },
    question: "Vì sao cùng một đối tác chậm mà trước đây không cạn bộ nhớ? Làm phép tính, rồi nêu cách sửa giữ được năng lực.",
    mustCover: [
      "Trước đây pool 300 thread là **trần ngầm**: quá 300 request đồng thời thì phần còn lại **xếp hàng ngoài**, chưa chiếm tài nguyên xử lý",
      "Bật virtual thread bỏ trần đó, nên mọi request được **nhận vào** và mỗi cái giữ trạng thái của nó",
      "Phép tính: 3.000 request/giây × 8 giây chờ ≈ **24.000** virtual thread cùng tồn tại ở trạng thái ổn định",
      "Nếu đối tác chậm hơn hoặc treo thì con số tăng không giới hạn — 240.000 là hệ quả của việc không có trần lẫn không có timeout",
      "Bộ nhớ bị ăn bởi stack của virtual thread cộng **toàn bộ object trong phạm vi mỗi request** đang xử lý dở",
      "Chế độ hỏng đổi từ **suy giảm mềm** (request chậm, xếp hàng) sang **đổ sập** (cạn bộ nhớ, bị giết)",
      "Sửa mà giữ năng lực: đặt **timeout** cho lời gọi đối tác, và **semaphore** giới hạn số lời gọi đồng thời",
      "Trần đó suy từ ngân sách bộ nhớ chia cho bộ nhớ mỗi request, nên nó cao hơn 300 nhiều nhưng hữu hạn",
    ],
    model: "Câu trả lời nằm ở việc bật virtual thread đã vô tình bỏ một cơ chế bảo vệ mà không ai khai ra. Pool 300 thread trước đây là một trần ngầm: khi có hơn 300 request đồng thời, phần còn lại xếp hàng ở tầng vào và chưa chiếm tài nguyên xử lý nào — bộ nhớ đang dùng tỉ lệ với 300 request, không với số request đến. Đối tác chậm 8 giây khi đó chỉ làm request xếp hàng lâu hơn, tức một sự suy giảm mềm. Bật virtual thread bỏ trần đó, và giờ mọi request được nhận vào cùng lúc, mỗi cái giữ trạng thái của nó trong lúc chờ. Phép tính theo định luật Little cho ngay con số: 3.000 request mỗi giây nhân 8 giây chờ là khoảng 24.000 virtual thread cùng tồn tại ở trạng thái ổn định. Mỗi cái mang stack của nó cộng — và đây là phần nặng hơn — toàn bộ object trong phạm vi xử lý request đó: dữ liệu đã nạp, DTO đang dựng, bộ đệm. Nhân 24.000 lên đã đáng kể với 3Gi, và con số 240.000 trong heap dump nói rằng đối tác đã có những khoảng chậm hơn nhiều p99, hoặc treo hẳn — mà vì **không có timeout**, không gì kéo những virtual thread đó ra khỏi trạng thái chờ. Hai thiếu sót cộng lại: không có trần đồng thời và không có timeout. Điều nghiêm trọng nhất không phải bản thân sự cố mà là chế độ hỏng đã đổi: từ suy giảm mềm sang đổ sập. Cách sửa giữ được năng lực gồm hai việc, và cả hai nằm trong mã của tôi. Thứ nhất, đặt timeout cho lời gọi đối tác, chọn theo p99 thật cộng một biên — nó chặn phần đuôi vô hạn và bảo đảm mỗi virtual thread có tuổi thọ hữu hạn. Riêng việc này đã đưa số thread tồn tại về một con số bị chặn. Thứ hai, đặt một semaphore giới hạn số lời gọi đồng thời ra đối tác, với trần suy từ ngân sách bộ nhớ chia cho lượng bộ nhớ trung bình một request đang xử lý chiếm — đo bằng profiling chứ không đoán. Nếu mỗi request chiếm chừng 30KB thì vài chục nghìn vẫn nằm trong ngân sách, tức trần mới cao hơn 300 rất nhiều và ta giữ được phần lớn năng lực đã tăng, nhưng hệ thống có điểm dừng. Và khi trần bị đạt thì hành vi phải là từ chối sớm với mã lỗi rõ ràng, vì cho client biết ngay tốt hơn là để họ chờ rồi vẫn thất bại.",
    redFlags: [
      "Đặt trần mới bằng 300 cho giống cũ — bỏ hết năng lực đã tăng",
      "Tăng bộ nhớ container — chỉ dời ngưỡng đổ sập",
      "Chỉ đặt timeout mà không đặt trần đồng thời, hoặc ngược lại",
      "Quay lại thread nền tảng — ràng buộc đã cấm",
      "Đặt trần theo cảm giác thay vì suy từ ngân sách bộ nhớ",
    ],
    probes: [
      "Áp định luật Little vào đây và ra con số nào?",
      "Bạn đo bộ nhớ trung bình một request đang xử lý bằng cách nào?",
      "Vì sao chỉ timeout thôi vẫn chưa đủ?",
    ],
    refs: ["modconc-02", "modconc-07"],
  },

  // ===== mc-structured (modconc-iq09–modconc-iq12) =====
  {
    id: "modconc-iq09",
    field: "modern-concurrency",
    topic: "mc-structured",
    level: 1,
    minutes: 6,
    question: "Structured concurrency giải những thách thức nào của `ExecutorService` cộng `Future`? Nêu cụ thể những gì lối cũ để hở.",
    mustCover: [
      "`ExecutorService` và `Future` cho phép chạy đồng thời nhưng **không** giúp phối hợp các tác vụ với nhau",
      "Hở thứ nhất: **không có ranh giới sống** — một tác vụ con có thể sống lâu hơn phương thức đã tạo ra nó",
      "Hở thứ hai: **huỷ không lan truyền** — huỷ tác vụ cha không tự huỷ các tác vụ con",
      "Hở thứ ba: nếu một tác vụ con thất bại, các tác vụ con khác **vẫn tiếp tục** chạy vô ích",
      "Hở thứ tư: lỗi chỉ lộ ra khi gọi `get()`, nên nếu không ai gọi thì nó **biến mất im lặng**",
      "Structured concurrency đóng cả bốn: phạm vi có ranh giới rõ, tác vụ con không sống quá phạm vi, huỷ lan truyền, lỗi được quan sát",
      "Nhờ vậy quan hệ cha–con hiện ra trong **cấu trúc mã**, nên nó cũng hiện ra trong stack trace",
    ],
    model: "`ExecutorService` cùng `Future` cung cấp phương tiện để thực thi tác vụ đồng thời, nhưng chúng đặt ra thách thức đúng ở chỗ các tác vụ cần được **phối hợp** với nhau — và phần lớn công việc thực tế là như vậy. Có bốn chỗ hở cụ thể. Thứ nhất là không có ranh giới sống: khi ta `submit` ba tác vụ rồi phương thức trả về, ba tác vụ đó vẫn chạy, nên vòng đời của chúng không gắn với vòng đời của phạm vi đã tạo ra chúng — và điều đó nghĩa là không ai chịu trách nhiệm dọn. Thứ hai là huỷ không lan truyền: huỷ tác vụ cha không tự huỷ các tác vụ con, nên ta phải tự giữ danh sách và tự huỷ từng cái, và bất kỳ đường ngoại lệ nào bỏ sót bước đó đều để lại tác vụ mồ côi. Thứ ba là khi một tác vụ con thất bại thì các tác vụ con khác vẫn tiếp tục chạy tới cùng, dù kết quả của chúng chắc chắn sẽ bị bỏ — ta đốt tài nguyên cho một câu trả lời không ai cần. Thứ tư, và là chỗ hở nguy hiểm nhất, là lỗi chỉ lộ ra khi gọi `get()`; nếu không ai gọi hoặc gọi ở một đường mã khác, ngoại lệ nằm trong `Future` rồi bị thu gom mà không ai từng đọc — mất việc trong im lặng. Structured concurrency đóng cả bốn bằng một ý tưởng duy nhất: các tác vụ đồng thời được mở trong một **phạm vi có ranh giới rõ**, và phạm vi đó không kết thúc cho tới khi mọi tác vụ con đã xong hoặc đã bị huỷ. Từ đó suy ra: tác vụ con không sống quá phạm vi, huỷ lan truyền xuống, một tác vụ thất bại thì các tác vụ còn lại được huỷ, và lỗi được quan sát ở chỗ phạm vi đóng. Lợi ích thêm mà tôi đánh giá cao là quan hệ cha–con giờ hiện ra trong chính cấu trúc mã — nên nó cũng hiện ra trong stack trace, thứ mà lối cũ không cho.",
    redFlags: [
      "Chỉ nói structured concurrency \"gọn hơn\" mà không nêu chỗ hở nào của lối cũ",
      "Bỏ qua việc lỗi trong `Future` biến mất nếu không ai gọi `get()`",
      "Không nhắc tới việc huỷ không lan truyền",
    ],
    probes: [
      "Cho một ca mà tác vụ mồ côi gây sự cố thật",
      "Vì sao quan hệ cha–con hiện trong stack trace lại có ích?",
      "Một tác vụ con thất bại — bạn muốn năm cái còn lại hành xử thế nào?",
    ],
    refs: ["modconc-04"],
  },
  {
    id: "modconc-iq10",
    field: "modern-concurrency",
    topic: "mc-structured",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Lấy sản phẩm và danh sách đánh giá song song
public ProductInfo getProductInfo(Long id) throws Exception {
    var exec = Executors.newFixedThreadPool(2);
    Future<Product> pf = exec.submit(() -> productClient.find(id));
    Future<List<Review>> rf = exec.submit(() -> reviewClient.findByProduct(id));

    Product p = pf.get();                       // (1)
    List<Review> rs = rf.get();                 // (2)
    exec.shutdown();                            // (3)
    return new ProductInfo(p, rs);
}`,
    },
    question: "Chỉ ra ba vấn đề của đoạn này, rồi viết lại bằng structured concurrency và nói bản mới sửa được gì.",
    mustCover: [
      "Vấn đề 1: nếu `pf.get()` ném ở dòng (1) thì dòng (3) **không chạy** — executor rò rỉ, và tác vụ review vẫn chạy tới cùng vô ích",
      "Vấn đề 2: tạo một executor **cho mỗi lời gọi** là lãng phí, và nếu rò rỉ thì nó tích tụ",
      "Vấn đề 3: không có timeout và không có huỷ — nếu `productClient` treo thì method treo vô hạn",
      "Cũng đáng nêu: `get()` tuần tự nghĩa là nếu tác vụ review thất bại sớm, ta vẫn chờ product xong mới biết",
      "Bản structured: mở một phạm vi, fork hai tác vụ, `join` rồi đọc kết quả — phạm vi tự đóng trong `try`",
      "Bản mới sửa: một tác vụ thất bại thì tác vụ kia **được huỷ** ngay, không chờ vô ích",
      "Và không thể rò rỉ tác vụ vì phạm vi không kết thúc khi còn tác vụ con",
      "Phạm vi cũng cho đặt **hạn thời gian** cho cả nhóm, thay vì timeout rời từng lời gọi",
    ],
    model: "Ba vấn đề, và cả ba đến từ việc lối cũ không có ranh giới sống. Vấn đề thứ nhất là đường ngoại lệ: nếu `pf.get()` ném ở dòng (1) thì dòng (3) không bao giờ chạy, nên executor rò rỉ cùng với hai thread của nó — và tác vụ review vẫn chạy tới cùng dù kết quả chắc chắn bị bỏ. Với một `finally` thì ta sửa được phần rò rỉ, nhưng phải nhớ viết, và cái nhớ đó là thứ hỏng dần theo thời gian. Vấn đề thứ hai là tạo một executor cho mỗi lời gọi phương thức: bản thân nó đã lãng phí, và kết hợp với rò rỉ ở trên thì mỗi lần ngoại lệ là hai thread bị bỏ lại — sau vài nghìn lần là một sự cố cạn thread. Vấn đề thứ ba là không có timeout và không có huỷ: nếu `productClient` treo thì `pf.get()` chờ vô hạn, và method này giữ cả thread gọi cùng hai thread của executor. Còn một điểm nữa đáng nêu dù nó không phải lỗi đúng nghĩa: hai lời gọi `get()` tuần tự nghĩa là nếu tác vụ review thất bại sau 50ms, ta vẫn phải chờ product xong — có thể 8 giây — rồi mới biết cả việc đã thất bại. Bản structured concurrency mở một phạm vi trong `try`, fork hai tác vụ, chờ cả nhóm rồi đọc kết quả; phạm vi đóng lại khi ra khỏi `try`, kể cả trên đường ngoại lệ. Bốn thứ được sửa. Không thể rò rỉ tác vụ, vì phạm vi về nguyên tắc không kết thúc khi còn tác vụ con đang chạy — điều này không phụ thuộc việc ta có nhớ viết `finally` hay không. Một tác vụ thất bại thì tác vụ còn lại được huỷ ngay, nên ta biết thất bại sau 50ms thay vì sau 8 giây, và không đốt tài nguyên cho kết quả sẽ bị bỏ. Huỷ lan truyền, nên nếu ai đó huỷ request thì cả hai lời gọi con được huỷ theo. Và ta đặt được một hạn thời gian cho **cả nhóm** thay vì timeout rời cho từng lời gọi — điều này đúng hơn về mặt nghiệp vụ, vì ngân sách thời gian của một request là một con số, không phải hai.",
    redFlags: [
      "Chỉ thêm `finally` để sửa rò rỉ và coi là đủ",
      "Không nhận ra tác vụ review vẫn chạy khi product thất bại",
      "Viết lại bằng structured concurrency nhưng không nêu việc huỷ lan truyền",
      "Giữ executor tạo mới mỗi lời gọi trong bản viết lại",
    ],
    probes: [
      "Vì sao hạn thời gian cho cả nhóm đúng hơn timeout rời từng lời gọi?",
      "Nếu muốn lấy kết quả của cái nào xong trước thì bạn dùng gì?",
      "Bản structured xử lý trường hợp cả hai thất bại thế nào?",
    ],
    refs: ["modconc-04"],
  },
  {
    id: "modconc-iq11",
    field: "modern-concurrency",
    topic: "mc-structured",
    level: 3,
    minutes: 10,
    question: "Bạn fan-out tới nhiều dịch vụ rồi gộp kết quả. Chọn chiến lược nào khi một dịch vụ thất bại?",
    tradeoffs: [
      {
        option: "Thất bại nhanh — một cái lỗi thì huỷ tất cả",
        when: "Khi **mọi** kết quả đều bắt buộc để trả lời. Biết thất bại sớm nhất có thể, và không đốt tài nguyên cho kết quả sẽ bị bỏ. Đây là mặc định tôi dùng khi các phần là bắt buộc.",
      },
      {
        option: "Lấy cái xong trước — có một kết quả là đủ",
        when: "Khi các nguồn **tương đương** và ta chỉ cần một câu trả lời: nhiều bản sao của cùng dịch vụ, nhiều nhà cung cấp cùng loại. Huỷ những cái còn lại ngay khi có kết quả đầu tiên.",
      },
      {
        option: "Thu hết, chấp nhận thiếu một phần",
        when: "Khi một số phần là **tuỳ chọn** — gợi ý, đánh giá, dữ liệu bổ trợ. Trả về những gì có kèm dấu hiệu rõ phần nào thiếu. Đòi hợp đồng API phải diễn đạt được trạng thái thiếu.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **phần nào bắt buộc và phần nào tuỳ chọn** — đây là quyết định nghiệp vụ",
      "Nếu chọn thu hết thì phải **phân biệt được** \"không có dữ liệu\" với \"không lấy được dữ liệu\"",
      "Gộp hai trạng thái đó thành một là cách tạo ra lỗi âm thầm ở hệ thống hạ nguồn",
      "Thất bại nhanh có lợi thế cụ thể: biết sớm và **huỷ** những tác vụ còn lại, tiết kiệm tài nguyên thật",
      "Mọi chiến lược đều cần một **ngân sách thời gian cho cả nhóm**, không chỉ timeout từng lời gọi",
      "Structured concurrency cung cấp sẵn cả ba dạng phối hợp này, nên không cần tự dựng",
      "Phải quyết định trước: hết ngân sách thời gian mà phần bắt buộc chưa về thì trả lỗi hay trả một phần",
    ],
    model: "Tôi bắt đầu bằng một câu hỏi nghiệp vụ chứ không kỹ thuật: trong các phần cần lấy, phần nào **bắt buộc** để trả lời được và phần nào là **tuỳ chọn**? Không trả lời được câu đó thì không chọn được chiến lược, và đây là chỗ tôi thấy các cuộc thảo luận kỹ thuật hay bỏ qua rồi chọn theo thói quen. Nếu mọi phần đều bắt buộc thì thất bại nhanh là đúng, và lợi ích của nó cụ thể: ta biết thất bại ở thời điểm sớm nhất có thể thay vì chờ cái chậm nhất, và những tác vụ còn lại được huỷ nên ta không đốt tài nguyên cho kết quả sẽ bị bỏ. Nếu các nguồn tương đương và chỉ cần một câu trả lời — nhiều bản sao, nhiều nhà cung cấp cùng loại — thì lấy cái xong trước là đúng, và điểm quan trọng là phải huỷ những cái còn lại ngay khi có kết quả đầu tiên, nếu không ta trả chi phí cho tất cả. Nếu một số phần là tuỳ chọn thì thu hết và chấp nhận thiếu, nhưng đây là chiến lược đòi nhiều kỷ luật nhất và là chỗ dễ tạo lỗi âm thầm nhất. Điều bắt buộc phải làm: response phải **phân biệt được** \"nguồn trả lời rằng không có dữ liệu\" với \"ta không lấy được dữ liệu\". Gộp hai trạng thái đó thành cùng một biểu diễn — thường là một danh sách rỗng — nghĩa là hệ thống hạ nguồn không thể biết mình đang xem dữ liệu đầy đủ hay dữ liệu khuyết, và sau vài tháng sẽ có ai đó dựng logic nghiệp vụ trên dữ liệu khuyết mà không biết. Một yêu cầu áp cho cả ba chiến lược: phải có ngân sách thời gian cho **cả nhóm**, không chỉ timeout cho từng lời gọi, vì ngân sách của một request là một con số duy nhất. Và phải quyết định trước hành vi khi hết ngân sách mà phần bắt buộc chưa về: trả lỗi, hay trả một phần kèm dấu hiệu. Điểm cuối đáng nêu: structured concurrency cung cấp sẵn cả ba dạng phối hợp này như những chiến lược có tên, nên ta không phải tự dựng bằng cách đếm `Future` và tự huỷ.",
    redFlags: [
      "Chọn thu hết vì \"trả được gì thì trả\" mà không phân biệt hai trạng thái thiếu",
      "Chọn theo thói quen mà không hỏi phần nào bắt buộc",
      "Lấy cái xong trước mà không huỷ những cái còn lại",
      "Đặt timeout từng lời gọi mà không có ngân sách cho cả nhóm",
    ],
    probes: [
      "Response của bạn diễn đạt \"không lấy được\" bằng cách nào?",
      "Hết ngân sách mà phần bắt buộc chưa về — bạn trả gì?",
      "Vì sao phải huỷ khi đã có kết quả đầu tiên?",
    ],
    refs: ["modconc-04"],
  },
  {
    id: "modconc-iq12",
    field: "modern-concurrency",
    topic: "mc-structured",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ tổng hợp bắt đầu tạo ra tác vụ mồ côi: sau mỗi lần một request bị client ngắt kết nối, các lời gọi tới ba dịch vụ hạ nguồn vẫn tiếp tục chạy tới cùng. Sau 4 giờ tải cao, số lời gọi ra ngoài gấp 3 lần số request thực tế, và ba dịch vụ hạ nguồn bắt đầu tiết chế ta.",
      scale: "2.000 request/giây, khoảng 8% bị client ngắt sớm. Mỗi request fan-out 3 lời gọi. Mã dùng `ExecutorService` với một pool dùng chung và `Future.get()`.",
      constraints: "Không giảm được tỉ lệ client ngắt sớm — đó là hành vi người dùng. Phải chặn việc gọi vô ích, không chỉ giảm. Ba dịch vụ hạ nguồn thuộc ba đội khác và đã yêu cầu ta giảm tải.",
      },
    question: "Vì sao việc client ngắt kết nối lại không dừng được các lời gọi con? Nêu chẩn đoán và cách sửa.",
    mustCover: [
      "Với `ExecutorService`, tác vụ con **không có quan hệ** nào với tác vụ cha ngoài việc cha giữ `Future`",
      "Nên khi request bị huỷ, **không có gì lan truyền** việc huỷ xuống các tác vụ đã submit",
      "`Future.cancel` phải được gọi **tường minh** cho từng cái, và phải có mã bắt được sự kiện client ngắt",
      "Ngay cả khi gọi `cancel`, tác vụ chỉ dừng nếu nó **phản ứng với interrupt** — một lời gọi HTTP không kiểm thì vẫn chạy tới cùng",
      "Số học: 8% của 2.000 request/giây là 160 request/giây bị ngắt, mỗi cái để lại 3 lời gọi — đủ để gấp bội tải",
      "Sửa đúng bản chất: structured concurrency — phạm vi đóng lại thì tác vụ con **bị huỷ** theo, không cần mã dọn",
      "Kèm theo: lời gọi HTTP phải có **timeout** và phải phản ứng với interrupt, nếu không huỷ vẫn không dừng được",
      "Và phải có mã nối sự kiện client ngắt vào việc đóng phạm vi, nếu không không gì kích hoạt việc huỷ",
    ],
    model: "Lý do nằm ở chỗ với `ExecutorService`, tác vụ con không có quan hệ cấu trúc nào với tác vụ cha. Cha giữ một `Future` cho mỗi tác vụ, nhưng đó chỉ là một tay cầm để đọc kết quả — nó không tạo ra quan hệ vòng đời. Nên khi request bị client ngắt và luồng xử lý cha kết thúc, không có gì lan truyền việc đó xuống ba tác vụ đã submit; chúng tiếp tục chạy, gọi ba dịch vụ hạ nguồn, nhận kết quả, rồi kết quả bị bỏ vì không ai đọc. Để dừng chúng bằng lối cũ thì cần hai thứ mà mã hiện tại đều thiếu: một chỗ bắt được sự kiện client ngắt, và mã gọi `Future.cancel` tường minh cho từng tác vụ. Nhưng ngay cả khi có đủ hai thứ đó, việc huỷ cũng chỉ hiệu quả nếu tác vụ **phản ứng với interrupt** — một lời gọi HTTP không kiểm trạng thái interrupt và không có timeout sẽ chạy tới cùng dù `cancel` đã được gọi. Đây là điểm hay bị bỏ qua và nó giải thích vì sao nhiều nỗ lực sửa nửa vời không có tác dụng. Số học cho thấy quy mô: 8% của 2.000 request mỗi giây là 160 request bị ngắt mỗi giây, mỗi cái để lại 3 lời gọi vô ích; và vì những lời gọi đó vẫn chiếm thread trong pool dùng chung cho tới khi xong, chúng còn làm chậm những request đang sống — nên tải ra ngoài tăng và thông lượng hữu ích giảm cùng lúc, khớp với việc số lời gọi gấp 3 lần số request. Cách sửa đúng bản chất là chuyển sang structured concurrency: mở một phạm vi cho mỗi request, fork ba lời gọi trong đó, và khi phạm vi đóng — kể cả vì request bị huỷ — thì các tác vụ con bị huỷ theo. Điểm quyết định là ta không còn phụ thuộc vào việc có ai nhớ viết mã dọn hay không; quan hệ vòng đời nằm trong cấu trúc mã. Nhưng tôi sẽ làm đủ ba việc chứ không chỉ một: chuyển sang phạm vi có cấu trúc, đặt timeout cho từng lời gọi HTTP và bảo đảm client HTTP phản ứng với interrupt, và nối sự kiện client ngắt vào việc đóng phạm vi — vì nếu thiếu việc thứ ba thì không gì kích hoạt việc huỷ, và hai việc kia không được dùng tới. Cuối cùng tôi sẽ mang số liệu sang ba đội hạ nguồn để họ biết tải sẽ giảm về đâu, thay vì để họ tự tiết chế theo phỏng đoán.",
    redFlags: [
      "Gọi `Future.cancel` mà không kiểm tác vụ có phản ứng với interrupt hay không",
      "Chỉ đặt timeout cho lời gọi HTTP mà không có cơ chế huỷ — vẫn gọi vô ích tới hết timeout",
      "Nhờ ba đội hạ nguồn nới hạn mức thay vì giảm gọi vô ích",
      "Giảm tỉ lệ client ngắt — đó là hành vi người dùng, ràng buộc đã nói",
      "Chuyển sang structured concurrency mà không nối sự kiện client ngắt vào việc đóng phạm vi",
    ],
    probes: [
      "Client HTTP của bạn có phản ứng với interrupt không, và bạn kiểm bằng cách nào?",
      "Bạn bắt sự kiện client ngắt ở tầng nào?",
      "Sau khi sửa, tải ra ngoài giảm về bao nhiêu — tính ra con số",
    ],
    refs: ["modconc-04", "modconc-07"],
  },

  // ===== mc-scoped (modconc-iq13–modconc-iq16) =====
  {
    id: "modconc-iq13",
    field: "modern-concurrency",
    topic: "mc-scoped",
    level: 1,
    minutes: 5,
    question: "`ScopedValue` giải bài toán gì mà `ThreadLocal` không giải được? Nêu ba đặc tính chính của nó.",
    mustCover: [
      "Cả hai giải cùng một bài toán nền: truyền ngữ cảnh qua chuỗi lời gọi **mà không** khai trong chữ ký từng phương thức",
      "`ScopedValue` hoạt động như một **tham số phương thức ngầm định**",
      "Đặc tính 1 — **bất biến**: giá trị không đổi được trong phạm vi, nên không có ai sửa nó ở giữa chuỗi",
      "Đặc tính 2 — **phạm vi có ranh giới rõ**: nó chỉ tồn tại trong khối được khai, và tự hết khi ra khỏi khối",
      "Đặc tính 3 — **kế thừa có kiểm soát** xuống các tác vụ con của structured concurrency",
      "`ThreadLocal` thì khả biến, không có ranh giới, và phải **dọn thủ công** — nếu quên thì rò rỉ trong thread pool",
      "Với hàng chục nghìn virtual thread, `ThreadLocal` còn tốn kém về bộ nhớ vì mỗi thread giữ bản riêng",
    ],
    model: "Hai thứ này giải cùng một bài toán nền: truyền dữ liệu qua một chuỗi lời gọi phương thức mà không phải khai tường minh trong chữ ký của từng phương thức — điều làm mã gọn hơn, đặc biệt khi các lời gọi lồng nhau sâu hoặc đi qua callback. Cách sách mô tả `ScopedValue` rất đúng tinh thần: nó hoạt động như một tham số phương thức ngầm định. Ba đặc tính chính của nó là chỗ khác `ThreadLocal`. Thứ nhất là tính bất biến: giá trị được đặt khi mở phạm vi và không đổi được bên trong, nên không có chuyện một tầng ở giữa chuỗi lời gọi sửa nó rồi tầng dưới thấy thứ khác với tầng trên — với `ThreadLocal` thì điều đó hoàn toàn xảy ra được, và nó là nguồn của những lỗi rất khó truy. Thứ hai là phạm vi có ranh giới rõ: `ScopedValue` chỉ tồn tại trong khối được khai và tự hết hiệu lực khi ra khỏi khối, nên không cần dọn. `ThreadLocal` ngược lại: giá trị gắn với **thread**, nên trong một thread pool nó sống lâu hơn request và phải được dọn thủ công — quên dọn là rò rỉ bộ nhớ, và tệ hơn là một request đọc được ngữ cảnh của request trước, tức rò rỉ dữ liệu giữa những người dùng khác nhau. Thứ ba là kế thừa có kiểm soát: khi dùng cùng structured concurrency, giá trị truyền được xuống các tác vụ con của phạm vi, và điều đó có nghĩa một cách xác định thay vì phụ thuộc vào việc thread nào chạy tác vụ nào. Còn một lý do thực dụng nữa đẩy sự thay thế này: với hàng chục nghìn virtual thread, `ThreadLocal` trở nên tốn kém về bộ nhớ vì mỗi thread giữ bản riêng của mọi giá trị — mô hình vốn hợp lý khi có vài trăm thread thì không còn hợp lý khi có năm mươi nghìn.",
    redFlags: [
      "Nói `ScopedValue` chỉ là `ThreadLocal` phiên bản mới",
      "Bỏ qua tính bất biến như một đặc tính có chủ ý",
      "Không nhắc tới việc `ThreadLocal` trong thread pool có thể rò rỉ dữ liệu giữa các request",
    ],
    probes: [
      "Vì sao tính bất biến lại là một đặc tính chứ không phải một hạn chế?",
      "`ThreadLocal` rò rỉ dữ liệu giữa các request bằng cách nào?",
      "Giá trị truyền xuống tác vụ con theo cơ chế nào?",
    ],
    refs: ["modconc-05"],
  },
  {
    id: "modconc-iq14",
    field: "modern-concurrency",
    topic: "mc-scoped",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class RequestContext {
    private static final ThreadLocal<User> CURRENT = new ThreadLocal<>();

    public static void set(User u) { CURRENT.set(u); }
    public static User get() { return CURRENT.get(); }
    // không có remove()                                   // (1)
}

// Filter đặt user cho mỗi request:
CURRENT.set(authenticate(request));
chain.doFilter(request, response);
// không gọi remove sau đó                                 // (2)

// Một service tầng sâu đọc:
User u = RequestContext.get();
auditLog.record(u.getId(), action);                        // (3)

// Sau khi chuyển sang virtual thread, xuất hiện thêm:
// (4) một số bản ghi audit mang userId của NGƯỜI DÙNG KHÁC`,
    },
    question: "Giải thích cả hai chế độ hỏng — trên thread pool và trên virtual thread. Rồi viết lại bằng `ScopedValue` và nói nó đóng chỗ nào.",
    mustCover: [
      "Trên **thread pool**: thread được tái sử dụng, nên giá trị của request trước còn nguyên khi request sau vào",
      "Nếu request sau không xác thực được hoặc đi qua đường không đặt giá trị, nó **đọc được user của request trước**",
      "Đó là rò rỉ dữ liệu giữa người dùng — một lỗi bảo mật, không chỉ lỗi logic",
      "Cũng là rò rỉ bộ nhớ: giá trị bị thread giữ mãi vì thread pool sống lâu hơn request",
      "Trên **virtual thread**: mỗi request một thread mới nên không rò rỉ chéo, nhưng `ThreadLocal` tốn bộ nhớ và không truyền xuống tác vụ con đúng cách",
      "Dòng (4) khớp với việc một số đường mã chạy trên thread **tái sử dụng** — pool cho phần tính toán hoặc thư viện",
      "Bản `ScopedValue`: mở phạm vi quanh `chain.doFilter`, giá trị tự hết khi ra khỏi phạm vi",
      "Nó đóng cả ba: không cần dọn nên không quên được, không rò rỉ chéo, và bất biến nên không tầng nào sửa được",
    ],
    model: "Hai chế độ hỏng khác nhau và đều nghiêm trọng. Trên thread pool, thread được tái sử dụng giữa các request, nên giá trị đặt cho request trước vẫn nằm nguyên trong `ThreadLocal` khi request sau được gán cùng thread đó. Nếu request sau đi qua một đường mã không đặt giá trị — xác thực thất bại, một endpoint công khai, một đường lỗi — thì dòng (3) đọc được `User` của **request trước**, và bản ghi audit mang userId sai. Đây không phải lỗi logic mà là lỗi bảo mật: dữ liệu của một người dùng rò sang ngữ cảnh xử lý của người dùng khác. Kèm theo là rò rỉ bộ nhớ, vì `User` bị thread giữ mãi cho tới lần `set` tiếp theo, và thread pool sống bằng tuổi ứng dụng. Cả hai đều bắt nguồn từ việc thiếu `remove` ở (1) và (2) — mà đó chính là điểm yếu cấu trúc: tính đúng đắn phụ thuộc vào việc **mọi** đường mã đều nhớ dọn, kể cả đường ngoại lệ. Trên virtual thread thì bức tranh đổi: mỗi request có một thread mới nên rò rỉ chéo giữa các request không xảy ra theo con đường đó, nhưng `ThreadLocal` trở nên tốn kém vì mỗi thread giữ bản riêng, và nó không truyền xuống tác vụ con của structured concurrency theo cách xác định. Chi tiết (4) nói rằng vẫn còn rò rỉ chéo sau khi chuyển, và điều đó khớp với việc một số đường mã vẫn chạy trên thread **tái sử dụng** — một pool cho phần tính toán, hay một thread do thư viện quản lý; nên việc chuyển tầng HTTP sang virtual thread không khử được lỗi ở những đường đó. Bản viết lại bằng `ScopedValue` mở một phạm vi quanh `chain.doFilter` với giá trị `User`, và mọi tầng sâu đọc từ phạm vi đó. Nó đóng cả ba chỗ hở cùng lúc: giá trị tự hết hiệu lực khi ra khỏi phạm vi nên không có gì để quên dọn — kể cả trên đường ngoại lệ; không có thread nào giữ lại gì nên không rò rỉ chéo bất kể thread được tái sử dụng hay không; và vì bất biến nên không tầng trung gian nào sửa được nó, thứ mà `ThreadLocal` cho phép.",
    redFlags: [
      "Chỉ thêm `remove()` trong `finally` và coi là đủ",
      "Cho rằng chuyển sang virtual thread tự khử lỗi rò rỉ chéo",
      "Không nhận ra đây là lỗi bảo mật chứ không chỉ lỗi logic",
      "Bỏ qua dòng (4) như một hiện tượng riêng lẻ",
    ],
    probes: [
      "Vì sao thêm `remove()` vẫn là giải pháp mong manh?",
      "Đường mã nào trong ứng dụng của bạn vẫn chạy trên thread tái sử dụng?",
      "`ScopedValue` xử lý trường hợp tầng sâu cần một giá trị **khác** thế nào?",
    ],
    refs: ["modconc-05"],
  },
  {
    id: "modconc-iq15",
    field: "modern-concurrency",
    topic: "mc-scoped",
    level: 3,
    minutes: 9,
    question: "Bạn cần truyền ngữ cảnh request xuống các tầng sâu. Chọn tham số tường minh, `ScopedValue`, hay `ThreadLocal`?",
    tradeoffs: [
      {
        option: "Tham số tường minh",
        when: "Khi chuỗi lời gọi **ngắn** và ngữ cảnh là một phần của bài toán. Rõ ràng nhất: chữ ký nói đúng những gì phương thức cần, kiểm thử không cần dựng gì. Đổi lại là phải sửa mọi tầng trung gian khi thêm một giá trị.",
      },
      {
        option: "`ScopedValue`",
        when: "Khi chuỗi **sâu** và ngữ cảnh là thứ mọi tầng có thể cần nhưng không tầng nào nên biết — id trace, người dùng, ngôn ngữ. Phạm vi có ranh giới, bất biến, không cần dọn.",
      },
      {
        option: "`ThreadLocal`",
        when: "Gần như chỉ còn vì tương thích với mã cũ hoặc thư viện đòi nó. Nó là lựa chọn kém hơn ở mọi trục: khả biến, không ranh giới, phải dọn thủ công, và tốn kém với số thread lớn.",
      },
    ],
    mustCover: [
      "Tham số tường minh là **mặc định đúng** cho dữ liệu thuộc bài toán — đừng ẩn thứ nên hiện",
      "Ngữ cảnh **xuyên suốt** như id trace là thứ khác: ẩn nó là đúng, vì mọi chữ ký mang nó sẽ thành tiếng ồn",
      "Ranh giới phân định: giá trị này có ảnh hưởng tới **quyết định nghiệp vụ** của phương thức hay không",
      "Nếu có thì nên là tham số; nếu chỉ để quan sát hoặc để truyền tiếp thì ngữ cảnh ngầm định là hợp",
      "`ScopedValue` bất biến nên nó **không** thay được chỗ cần truyền giá trị đổi theo tầng",
      "Nhược điểm của ngữ cảnh ngầm định: kiểm thử phải dựng phạm vi, và phụ thuộc không hiện trong chữ ký",
      "Với `ThreadLocal` thì tính đúng đắn phụ thuộc kỷ luật dọn ở **mọi** đường mã — một giả định yếu dần",
    ],
    model: "Tôi phân định bằng một câu hỏi: giá trị này có ảnh hưởng tới **quyết định nghiệp vụ** của phương thức hay không? Nếu có — một mã tiền tệ quyết định cách tính, một hạn mức quyết định cho phép hay từ chối — thì nó là dữ liệu của bài toán và nên là tham số tường minh. Ẩn nó đi làm chữ ký nói dối về những gì phương thức thật sự phụ thuộc, và điều đó làm mã khó suy luận cùng khó kiểm thử. Nếu không — id trace, thông tin người dùng chỉ để ghi audit, ngôn ngữ hiển thị — thì nó là ngữ cảnh xuyên suốt, và ẩn nó là đúng: nếu mọi chữ ký trong mười tầng đều phải mang thêm ba tham số ấy thì chúng trở thành tiếng ồn che mất những tham số thật sự quan trọng. Đó là chỗ `ScopedValue` vào, và nó là lựa chọn của tôi cho loại này. Điều tôi thích nhất ở nó là ranh giới rõ: giá trị tồn tại trong một khối và tự hết, nên không có trạng thái nào sống ngoài phạm vi nó thuộc về, và không có mã dọn nào để quên. Tính bất biến cũng là một đặc tính chứ không phải hạn chế — nó bảo đảm mọi tầng trong chuỗi thấy cùng một giá trị, nên không có chuyện một tầng giữa đường đổi nó rồi tầng dưới hành xử khác. Nhưng chính vì bất biến, nó **không** thay được những chỗ ta cần một giá trị đổi theo tầng; ở đó tham số là công cụ đúng. Nhược điểm chung của mọi ngữ cảnh ngầm định mà tôi luôn nêu: phụ thuộc không hiện trong chữ ký, nên người đọc phải biết nó tồn tại, và kiểm thử phải dựng phạm vi trước khi gọi. Đó là cái giá thật, và nó là lý do tôi không dùng ngữ cảnh ngầm định cho dữ liệu nghiệp vụ. `ThreadLocal` thì tôi chỉ giữ vì tương thích: nó kém hơn ở mọi trục — khả biến nên tầng giữa sửa được, không có ranh giới nên phải dọn thủ công ở mọi đường mã kể cả đường ngoại lệ, và tốn kém khi số thread lớn.",
    redFlags: [
      "Dùng ngữ cảnh ngầm định cho dữ liệu ảnh hưởng quyết định nghiệp vụ",
      "Truyền mọi thứ bằng tham số kể cả id trace, làm chữ ký đầy tiếng ồn",
      "Chọn `ThreadLocal` cho mã mới",
      "Không nêu nhược điểm rằng phụ thuộc không hiện trong chữ ký",
    ],
    probes: [
      "Cho một giá trị mà bạn dứt khoát truyền bằng tham số, và một giá trị bạn để ngầm",
      "Kiểm thử một phương thức đọc `ScopedValue` trông thế nào?",
      "Nếu tầng sâu cần một giá trị đổi theo tầng thì bạn làm gì?",
    ],
    refs: ["modconc-05"],
  },
  {
    id: "modconc-iq16",
    field: "modern-concurrency",
    topic: "mc-scoped",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một hệ thống đa khách hàng phát hiện 1.100 bản ghi bị ghi vào **kho dữ liệu của khách hàng khác** trong ba tháng. Định danh khách hàng được truyền qua `ThreadLocal`, đặt ở filter và dùng để chọn kho dữ liệu ở tầng sâu. Filter có `remove()` trong `finally`, nhưng một tác vụ nền đọc cùng `ThreadLocal` đó khi xử lý lô.",
      scale: "40 khách hàng, 8.000 request/giây. Tác vụ nền chạy mỗi 5 phút trên một pool riêng 4 thread. 1.100 bản ghi đã phải xoá và thông báo cho 6 khách hàng.",
      constraints: "Không đổi được mô hình đa khách hàng theo kho dữ liệu riêng. Phải chặn về mặt **cấu trúc**, không chỉ sửa tác vụ nền. Phải xác định được toàn bộ bản ghi bị ghi sai.",
      },
    question: "Filter đã có `remove()` trong `finally` — vậy rò rỉ xảy ra ở đâu? Nêu chẩn đoán và cách chặn về mặt cấu trúc.",
    mustCover: [
      "Filter dọn đúng cho **thread của nó**, nhưng tác vụ nền chạy trên **pool riêng** mà không ai đặt giá trị",
      "Trên pool 4 thread đó, giá trị `ThreadLocal` là **bất kỳ thứ gì còn lại** từ lần dùng trước — hoặc `null`",
      "Nếu tác vụ nền từng được gọi từ một đường request nào đó, giá trị của khách hàng đó còn lại trong thread",
      "Nên tác vụ nền chọn kho dữ liệu theo một định danh **không thuộc về nó** — ghi sang khách hàng khác",
      "Lỗi cấu trúc: định danh khách hàng là dữ liệu **quyết định nghiệp vụ** mà lại được truyền ngầm định",
      "Chặn về cấu trúc: đưa định danh khách hàng thành **tham số tường minh** trên mọi API chọn kho dữ liệu",
      "Khi đó tác vụ nền **không biên dịch được** nếu không cung cấp định danh — lỗi bị bắt lúc build",
      "`ScopedValue` cải thiện được nhưng **chưa đủ** ở đây: nó vẫn là ngữ cảnh ngầm, và tác vụ nền vẫn có thể chạy ngoài phạm vi",
    ],
    model: "Filter dọn hoàn toàn đúng — nhưng nó chỉ dọn cho thread mà nó đang chạy. Tác vụ nền chạy trên một pool riêng 4 thread, và trên những thread đó không filter nào từng đặt giá trị, cũng không ai dọn. Giá trị mà tác vụ nền đọc được là bất kỳ thứ gì còn lại trong `ThreadLocal` của thread đó từ lần dùng trước. Nếu đường mã của tác vụ nền — hoặc một thư viện nó gọi — từng được chạy từ một luồng request, hoặc nếu pool đó từng được dùng chung cho việc khác, thì định danh của khách hàng đó còn nằm lại. Tác vụ nền dùng nó để chọn kho dữ liệu, và ghi dữ liệu của khách hàng này vào kho của khách hàng kia. Với 40 khách hàng thì xác suất trúng sai là rất cao, và 1.100 bản ghi trong ba tháng khớp với việc tác vụ nền chạy mỗi 5 phút. Chẩn đoán sâu hơn bản thân cơ chế là một lỗi thiết kế: định danh khách hàng ở đây là dữ liệu **quyết định nghiệp vụ** — nó quyết định dữ liệu đi vào kho nào — mà lại được truyền bằng ngữ cảnh ngầm định. Ngữ cảnh ngầm định đúng cho những thứ như id trace, nơi đọc sai chỉ làm log khó truy; nó sai cho những thứ mà đọc sai gây ghi dữ liệu sai chỗ. Đó là ranh giới tôi luôn dùng để phân định, và ở đây nó đã bị vượt qua. Cách chặn về mặt cấu trúc, đúng như ràng buộc đòi: đưa định danh khách hàng thành tham số tường minh trên mọi API chọn kho dữ liệu và mọi API ghi. Khi đó tác vụ nền **không biên dịch được** nếu nó không cung cấp định danh, nên nó buộc phải lấy định danh từ chính dữ liệu lô nó đang xử lý — đúng nguồn sự thật. Lỗi chuyển từ một sai sót lúc chạy phụ thuộc trạng thái thread sang một lỗi biên dịch, và đó là loại chặn mà không kỷ luật nào cần thiết để duy trì. Tôi sẽ nói rõ rằng chuyển sang `ScopedValue` là một cải thiện thật — nó có ranh giới nên không còn giá trị sót lại — nhưng nó **chưa đủ** cho ca này, vì nó vẫn là ngữ cảnh ngầm và tác vụ nền vẫn có thể chạy ngoài mọi phạm vi, khi đó nó đọc giá trị rỗng và ta lại cần mã xử lý trường hợp đó. Còn về việc xác định toàn bộ bản ghi bị ghi sai: tôi truy trên dữ liệu, tìm những bản ghi trong mỗi kho mà định danh khách hàng bên trong không khớp với kho chứa nó — vì mô hình có kho riêng cho từng khách hàng, sự không khớp đó là một điều kiện kiểm được chính xác.",
    redFlags: [
      "Chỉ thêm `remove()` vào tác vụ nền và coi là đã chặn",
      "Chuyển sang `ScopedValue` rồi tuyên bố đã chặn về cấu trúc",
      "Dùng một pool riêng hoàn toàn cho tác vụ nền như giải pháp — vẫn là ngữ cảnh ngầm",
      "Không nhận ra đây là dữ liệu quyết định nghiệp vụ nên không được truyền ngầm",
      "Tìm bản ghi sai bằng log thay vì bằng điều kiện không khớp trong dữ liệu",
    ],
    probes: [
      "Vì sao `ScopedValue` chưa đủ ở ca này?",
      "Tác vụ nền nên lấy định danh khách hàng từ đâu?",
      "Bạn viết điều kiện kiểm không khớp giữa bản ghi và kho thế nào?",
    ],
    refs: ["modconc-05", "modconc-07"],
  },

  // ===== mc-reactive (modconc-iq17–modconc-iq20) =====
  {
    id: "modconc-iq17",
    field: "modern-concurrency",
    topic: "mc-reactive",
    level: 1,
    minutes: 6,
    question: "Sau khi có virtual thread, reactive còn chỗ đứng nào? Nêu thứ reactive làm mà virtual thread không làm.",
    mustCover: [
      "Virtual thread giải bài toán **chi phí của thread**, nên nó thay được lý do chính người ta chọn reactive",
      "Thứ reactive làm mà virtual thread không làm: **áp lực ngược** — người tiêu thụ điều tiết được tốc độ người sản xuất",
      "Reactive cũng mô hình hoá **dòng** nhiều giá trị theo thời gian, còn virtual thread nói về một luồng điều khiển",
      "Nó cho một tập toán tử để **kết hợp** dòng: lọc, gộp, cửa sổ, hợp nhất nhiều dòng",
      "Nên nếu bài toán là fan-out rồi gộp thì virtual thread đủ và đơn giản hơn nhiều",
      "Nếu bài toán là một dòng dữ liệu không biên cần điều tiết thì reactive vẫn đúng chỗ",
      "Và trộn nửa vời là tệ nhất: một tầng còn chặn là mất hết lợi ích của toàn tuyến reactive",
    ],
    model: "Cần tách rõ reactive giải hai bài toán khác nhau mà người ta thường gộp. Bài toán thứ nhất là chi phí của thread: trước virtual thread, muốn phục vụ hàng chục nghìn kết nối đồng thời thì không thể mỗi kết nối một thread, nên phải viết bất đồng bộ — và reactive là một cách viết bất đồng bộ có cấu trúc. Bài toán này virtual thread giải trực tiếp và giải tốt hơn về khả năng đọc, nên với phần lớn dịch vụ web thì lý do chính để chọn reactive đã biến mất. Bài toán thứ hai reactive vẫn độc quyền: **áp lực ngược**. Đó là khả năng người tiêu thụ báo cho người sản xuất biết mình chịu được bao nhiêu, để dòng tự điều tiết thay vì tích tụ trong một bộ đệm nào đó rồi cạn bộ nhớ. Virtual thread không mô hình hoá điều này vì nó nói về một luồng điều khiển, không nói về một dòng dữ liệu — nếu người sản xuất nhanh hơn người tiêu thụ thì virtual thread không có cơ chế nào để làm chậm người sản xuất lại. Liên quan tới đó là điểm thứ hai: reactive mô hình hoá một dòng nhiều giá trị theo thời gian và cho một tập toán tử để kết hợp các dòng — lọc, gộp theo cửa sổ, hợp nhất nhiều nguồn. Với những bài toán có hình dạng đó thì viết bằng mã tuần tự cũng được nhưng ta phải tự dựng lại các toán tử ấy. Nên cách tôi chọn trong thực tế: nếu bài toán là fan-out tới vài dịch vụ rồi gộp kết quả, virtual thread cộng structured concurrency là đủ và đơn giản hơn nhiều bậc. Nếu bài toán là một dòng dữ liệu không biết trước độ dài cần điều tiết tốc độ, reactive vẫn là công cụ đúng. Và điều tệ nhất là trộn nửa vời: một tuyến reactive mà có một tầng còn chặn thì mất hết lợi ích, vì tầng đó giữ thread và toàn bộ mô hình sụp — nên nếu chọn reactive thì phải chọn cho cả tuyến.",
    redFlags: [
      "Nói reactive đã lỗi thời hoàn toàn",
      "Nói virtual thread giải được cả bài toán áp lực ngược",
      "Không phân biệt \"một luồng điều khiển\" với \"một dòng dữ liệu\"",
    ],
    probes: [
      "Cho một ca mà thiếu áp lực ngược gây sự cố thật",
      "Vì sao một tầng chặn làm sụp cả tuyến reactive?",
      "Bạn dựng lại một toán tử cửa sổ bằng mã tuần tự thế nào?",
    ],
    refs: ["modconc-06", "modconc-02"],
  },
  {
    id: "modconc-iq18",
    field: "modern-concurrency",
    topic: "mc-reactive",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Tuyến "reactive" của một dịch vụ
public Mono<Report> buildReport(Long id) {
    return Mono.fromCallable(() -> jdbcTemplate.query(SQL, id))   // (1) JDBC chặn
        .map(this::transform)
        .flatMap(rows -> webClient.post()                         // (2) non-blocking
            .bodyValue(rows).retrieve(Report.class))
        .doOnNext(r -> auditRepo.save(r));                        // (3) JPA chặn
}

// Chạy trên một event loop 8 thread. Ở tải cao, thông lượng thấp hơn
// hẳn bản tuần tự cũ dùng pool 200 thread nền tảng.`,
    },
    question: "Vì sao bản \"reactive\" này chậm hơn bản tuần tự? Chỉ ra các lỗi, rồi nêu hai hướng sửa khác bản chất nhau.",
    mustCover: [
      "Dòng (1) và (3) là lời gọi **chặn** đặt trên **event loop** — mỗi cái giữ một trong 8 thread của loop",
      "Event loop được thiết kế với số thread rất nhỏ vì nó giả định **không bao giờ chặn**",
      "Nên chỉ cần 8 lời gọi chặn đồng thời là **toàn bộ** loop bị chiếm, và mọi request khác đứng — kể cả những cái chỉ cần (2)",
      "Đó là lý do thông lượng thấp hơn bản tuần tự: bản cũ có 200 thread để chặn, bản mới chỉ có 8",
      "`Mono.fromCallable` **không** làm lời gọi trở nên non-blocking — nó chỉ bọc lại, việc chặn vẫn xảy ra",
      "Hướng sửa 1 — giữ reactive: đẩy hai lời gọi chặn sang một **scheduler riêng** cho việc chặn, không để trên loop",
      "Hướng sửa 2 — bỏ reactive: viết tuần tự trên **virtual thread**, khi đó chặn là rẻ và mã đọc được",
      "Hướng 2 thường đúng hơn ở đây vì hai trong ba bước vốn đã chặn, nên tuyến này chưa bao giờ thật sự non-blocking",
    ],
    model: "Bản này chậm hơn vì nó mang hình thức reactive mà không mang bản chất. Dòng (1) gọi JDBC và dòng (3) gọi JPA — cả hai đều chặn — và chúng đang chạy trên event loop. Event loop được thiết kế với số thread rất nhỏ, ở đây là 8, chính vì giả định nền của nó là không bao giờ có ai chặn: mỗi thread chỉ chạy những đoạn xử lý ngắn rồi nhả ra. Khi giả định đó bị phá, chỉ cần 8 lời gọi chặn đồng thời là toàn bộ loop bị chiếm, và mọi request khác đứng lại — kể cả những request chỉ cần bước (2) vốn thật sự non-blocking. So sánh với bản cũ thì con số nói hết: bản tuần tự có 200 thread nền tảng để chặn, bản mới chỉ có 8. Nên việc thông lượng giảm không phải nghịch lý mà là hệ quả số học. Điểm tôi muốn nhấn vì nó là ngộ nhận phổ biến nhất: `Mono.fromCallable` không làm một lời gọi trở nên non-blocking. Nó chỉ bọc một phép tính vào kiểu `Mono` để nó ghép được vào chuỗi; việc chặn vẫn xảy ra y nguyên, chỉ là bây giờ nó xảy ra trên thread của event loop. Bọc một thứ chặn vào một kiểu reactive là đổi hình thức chứ không đổi hành vi. Hai hướng sửa khác bản chất nhau. Hướng thứ nhất là giữ reactive nhưng tôn trọng giả định của nó: đẩy hai lời gọi chặn sang một scheduler riêng dành cho việc chặn, để event loop không bao giờ bị giữ. Nó hoạt động, nhưng ta đang duy trì hai mô hình cùng lúc và mọi người sau phải biết quy tắc đó. Hướng thứ hai là bỏ reactive cho tuyến này và viết tuần tự trên virtual thread: khi đó chặn là rẻ, và mã đọc từ trên xuống với stack trace có nghĩa. Tôi thấy hướng thứ hai đúng hơn cho ca này, và lý do nằm trong chính mã: hai trong ba bước vốn đã chặn, nên tuyến này chưa bao giờ thật sự non-blocking — ta đang trả toàn bộ chi phí về khả năng đọc của reactive mà chỉ nhận được lợi ích cho một bước trong ba.",
    redFlags: [
      "Tin `Mono.fromCallable` biến lời gọi chặn thành non-blocking",
      "Tăng số thread của event loop làm cách sửa chính",
      "Kết luận reactive chậm hơn tuần tự nói chung",
      "Chỉ sửa một trong hai lời gọi chặn",
    ],
    probes: [
      "Vì sao event loop lại được thiết kế với rất ít thread?",
      "Nếu giữ reactive, bạn đặt scheduler cho việc chặn thế nào?",
      "Làm sao bạn phát hiện một lời gọi chặn lọt lên event loop?",
    ],
    refs: ["modconc-06"],
  },
  {
    id: "modconc-iq19",
    field: "modern-concurrency",
    topic: "mc-reactive",
    level: 3,
    minutes: 11,
    question: "Đội bạn có một dịch vụ reactive đang chạy. Có nên viết lại sang virtual thread?",
    tradeoffs: [
      {
        option: "Giữ nguyên",
        when: "Đang chạy tốt, không phải nút thắt, và đội đã quen. Viết lại một tuyến reactive là công việc lớn với rủi ro thật, và \"dễ đọc hơn\" một mình không phải lý do đủ để trả giá đó.",
      },
      {
        option: "Viết lại phần **không** cần áp lực ngược",
        when: "Khi phần lớn tuyến chỉ là fan-out rồi gộp, và reactive đang được dùng chỉ vì nó là khuôn của dự án. Ở đó virtual thread cho cùng khả năng mở rộng với mã dễ đọc và debug hơn nhiều.",
      },
      {
        option: "Viết lại toàn bộ",
        when: "Chỉ khi có lý do cụ thể ngoài phong cách: đội không bảo trì được mã hiện tại, hoặc việc debug sự cố đang tốn quá nhiều, hoặc cần tích hợp với thư viện chỉ hỗ trợ mô hình chặn.",
      },
    ],
    mustCover: [
      "Câu hỏi đúng không phải \"cái nào tốt hơn\" mà là **lợi ích đủ trả chi phí viết lại hay không**",
      "Phải xác định phần nào của tuyến thật sự cần **áp lực ngược** — đó là phần virtual thread không thay được",
      "Chi phí viết lại gồm cả rủi ro hồi quy ở những đường lỗi ít được kiểm thử",
      "Lợi ích cụ thể và đo được: thời gian debug một sự cố, thời gian đưa người mới vào việc",
      "Không viết lại nửa vời — trộn hai mô hình trong một tuyến là trạng thái tệ nhất",
      "Nếu viết lại thì phải rà **ghim**, vì mã cũ có thể dùng thư viện đầy `synchronized`",
      "Và phải thay các giới hạn ngầm của mô hình reactive bằng giới hạn tường minh",
    ],
    model: "Tôi đổi câu hỏi từ \"cái nào tốt hơn\" sang \"lợi ích có đủ trả chi phí viết lại hay không\", vì với mã đang chạy thì đó mới là câu hỏi thật. Bước đầu tiên là xác định phần nào của tuyến thật sự cần áp lực ngược — đó là phần virtual thread không thay được, và nếu nó là phần cốt lõi thì câu trả lời là không viết lại. Kinh nghiệm của tôi là với phần lớn dịch vụ web thì phần đó rất nhỏ hoặc không có: tuyến chỉ là nhận request, gọi vài dịch vụ, gộp kết quả, trả về — và reactive đang được dùng vì nó là khuôn của dự án, không vì bài toán cần nó. Với phần đó thì virtual thread cho cùng khả năng mở rộng, và lợi ích là những thứ đo được: thời gian debug một sự cố giảm vì stack trace trở lại có nghĩa, và thời gian đưa một người mới vào việc giảm vì mã đọc từ trên xuống. Tôi sẽ lấy hai con số đó làm căn cứ thay vì lập luận về phong cách. Chi phí thì phải tính đủ, và phần hay bị đánh giá thấp là rủi ro hồi quy ở những đường lỗi: một tuyến reactive có nhiều toán tử xử lý lỗi, thử lại, dự phòng, và chúng thường ít được kiểm thử hơn đường thành công — viết lại nghĩa là viết lại cả những đường đó. Nguyên tắc tôi giữ chặt: không viết lại nửa vời. Một tuyến trộn hai mô hình là trạng thái tệ nhất, vì người đọc phải biết mỗi đoạn chơi theo luật nào, và chỗ giao nhau giữa hai mô hình là nơi lỗi tập trung. Nên nếu quyết định viết lại một tuyến thì viết lại trọn tuyến; nếu không đủ nguồn lực cho trọn tuyến thì hoãn. Hai việc kỹ thuật đi kèm nếu viết lại: rà ghim, vì mã cũ có thể dùng những thư viện đầy `synchronized` mà mô hình reactive không quan tâm nhưng virtual thread thì rất quan tâm; và thay các giới hạn ngầm của mô hình reactive — kích thước event loop, dung lượng bộ đệm của các toán tử — bằng giới hạn tường minh, vì bỏ chúng mà không thay là cách đổi chế độ hỏng từ suy giảm mềm sang đổ sập.",
    redFlags: [
      "Viết lại vì \"virtual thread là tương lai\"",
      "Không xác định phần nào cần áp lực ngược trước khi quyết định",
      "Viết lại nửa tuyến rồi để hai mô hình trộn lẫn",
      "Bỏ qua rủi ro hồi quy ở các đường xử lý lỗi",
    ],
    probes: [
      "Phần nào trong tuyến của bạn cần áp lực ngược, cụ thể?",
      "Bạn đo \"thời gian debug một sự cố\" bằng cách nào?",
      "Những giới hạn ngầm nào của mô hình reactive bạn phải thay?",
    ],
    refs: ["modconc-06", "modconc-08"],
  },
  {
    id: "modconc-iq20",
    field: "modern-concurrency",
    topic: "mc-reactive",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một tuyến reactive đọc từ một hàng đợi rồi ghi vào database bắt đầu cạn bộ nhớ khi nguồn đẩy nhanh hơn bình thường. Heap dump cho thấy hàng triệu phần tử đang nằm trong một bộ đệm của toán tử. Mã dùng một toán tử đệm không giới hạn để \"làm mượt\" tốc độ, và phía ghi database có giới hạn 20 kết nối.",
      scale: "Bình thường nguồn đẩy 3.000 phần tử/giây, ghi database xử lý được 2.800/giây. Trong đợt cao điểm nguồn đẩy 12.000/giây trong 6 phút. Container 4Gi.",
      constraints: "Không tăng được số kết nối database. Không bỏ được đợt cao điểm — đó là hành vi nguồn. Phải xử lý trong cấu trúc reactive hiện tại, không viết lại sang virtual thread trong đợt này.",
      },
    question: "Mã đã dùng reactive — vốn có áp lực ngược. Vậy vì sao nó vẫn cạn bộ nhớ? Làm phép tính, rồi nêu cách sửa.",
    mustCover: [
      "Áp lực ngược là một **năng lực**, không phải một bảo đảm tự động — một toán tử đệm **không giới hạn** phá vỡ nó",
      "Bộ đệm không giới hạn nói với người sản xuất rằng \"tôi nhận được bao nhiêu cũng được\", nên tín hiệu điều tiết bị chặn lại tại đó",
      "Phép tính: chênh 12.000 trừ 2.800 là khoảng **9.200 phần tử/giây** tích tụ, trong 6 phút là **3,3 triệu** phần tử",
      "Nhân với kích thước một phần tử là vượt 4Gi — cạn bộ nhớ là kết quả số học, không phải bất thường",
      "Mọi bộ đệm không giới hạn trong một tuyến đều là chỗ áp lực ngược **bị cắt**",
      "Sửa: đổi sang bộ đệm **có giới hạn** kèm chiến lược khi đầy — chặn người sản xuất, hoặc bỏ phần tử, hoặc báo lỗi",
      "Với dữ liệu không được mất thì chiến lược đúng là **chặn người sản xuất**, tức để áp lực ngược đi tới nguồn",
      "Và trần bộ đệm phải suy từ **ngân sách bộ nhớ**, không đặt theo cảm giác",
    ],
    model: "Câu hỏi đã chứa mấu chốt: reactive **cung cấp** áp lực ngược nhưng không **bảo đảm** nó. Áp lực ngược hoạt động bằng cách người tiêu thụ báo ngược lên chuỗi rằng nó chịu được bao nhiêu, và tín hiệu đó truyền từ dưới lên tới nguồn. Một toán tử đệm không giới hạn ở giữa chuỗi cắt đứt chính tín hiệu đó: nó nói với người sản xuất rằng \"cứ đẩy, tôi nhận được bao nhiêu cũng được\", nên nguồn không bao giờ bị làm chậm và toàn bộ phần chênh lệch tích tụ trong bộ nhớ. Mã đã tự vô hiệu hoá đúng cơ chế mà nó chọn reactive để có. Phép tính cho thấy đây là kết quả số học chứ không phải một bất thường. Ở đợt cao điểm, nguồn đẩy 12.000 phần tử mỗi giây trong khi phía ghi chỉ xử lý được 2.800 — giới hạn bởi 20 kết nối database, và con số đó là một trần cứng không đổi được. Chênh lệch 9.200 phần tử mỗi giây, nhân với 6 phút là khoảng 3,3 triệu phần tử phải nằm đâu đó; và chỗ duy nhất chúng nằm được là bộ đệm không giới hạn kia. Nhân với kích thước một phần tử thì vượt 4Gi, nên cạn bộ nhớ là điều phải xảy ra. Cách sửa nằm hoàn toàn trong cấu trúc reactive hiện tại, nên ràng buộc không viết lại không cản gì: đổi bộ đệm không giới hạn thành bộ đệm **có giới hạn**, kèm một chiến lược tường minh cho lúc đầy. Có ba chiến lược và việc chọn là quyết định nghiệp vụ: chặn người sản xuất, bỏ phần tử, hoặc báo lỗi. Với dữ liệu không được mất thì lựa chọn đúng là chặn người sản xuất — tức để áp lực ngược đi trọn đường tới nguồn, đúng như thiết kế ban đầu của mô hình. Khi đó đợt cao điểm biến thành một khoảng nguồn bị làm chậm, và hàng đợi ở nguồn phình lên thay vì bộ nhớ của ta; điều đó chấp nhận được vì hàng đợi vốn được thiết kế để chứa. Trần của bộ đệm tôi suy từ ngân sách bộ nhớ chia cho kích thước một phần tử, giữ một biên an toàn, chứ không đặt theo cảm giác. Điều tôi cũng sẽ làm ngay là rà toàn tuyến tìm mọi bộ đệm không giới hạn khác — vì một tuyến có nhiều toán tử thì thường có hơn một chỗ như vậy, và chỉ cần một chỗ còn lại là áp lực ngược vẫn bị cắt.",
    redFlags: [
      "Kết luận reactive không đáng tin vì nó vẫn cạn bộ nhớ",
      "Tăng bộ nhớ container — chỉ dời ngưỡng, và với chênh 9.200/giây thì không lượng nào đủ",
      "Đặt bộ đệm có giới hạn nhưng chọn chiến lược bỏ phần tử cho dữ liệu không được mất",
      "Đòi tăng số kết nối database — ràng buộc đã cấm",
      "Sửa một bộ đệm rồi dừng, không rà những chỗ không giới hạn khác trong tuyến",
    ],
    probes: [
      "Ba chiến lược khi bộ đệm đầy — bạn chọn theo tiêu chí nào?",
      "Chặn người sản xuất thì hệ quả ở phía nguồn là gì?",
      "Bạn tính trần bộ đệm ra con số bao nhiêu, từ đâu?",
    ],
    refs: ["modconc-06"],
  },

  // ===== mc-framework (modconc-iq21–modconc-iq24) =====
  {
    id: "modconc-iq21",
    field: "modern-concurrency",
    topic: "mc-framework",
    level: 1,
    minutes: 5,
    question: "Bật virtual thread trong một framework web thường chỉ là một dòng cấu hình. Nêu những gì dòng đó **không** làm, và việc bạn vẫn phải tự làm.",
    mustCover: [
      "Dòng cấu hình chỉ đổi **nơi request được chạy** — từ pool nền tảng sang một virtual thread mỗi request",
      "Nó **không** rà `synchronized` trong mã của bạn hay trong thư viện, nên ghim vẫn có thể xảy ra",
      "Nó **không** thay thế giới hạn ngầm mà kích thước pool cũ đang cung cấp",
      "Nó **không** đổi `ThreadLocal` thành scoped value, nên ngữ cảnh vẫn tốn kém và vẫn có thể sai",
      "Nó **không** làm những tác vụ CPU-bound chạy tốt hơn — chúng cần một pool riêng có trần",
      "Và nó không đặt **timeout** cho các lời gọi ra ngoài, thứ trở nên quan trọng hơn khi không còn trần thread",
    ],
    model: "Dòng cấu hình đó làm đúng một việc: đổi nơi request được chạy, từ một pool thread nền tảng sang một virtual thread cho mỗi request. Đó là việc quan trọng nhất và nó cho phần lớn lợi ích, nhưng nó để lại năm việc mà ta phải tự làm, và bỏ qua chúng là lý do nhiều đội bật lên rồi gặp sự cố. Thứ nhất, nó không rà `synchronized` trong mã của ta hay trong thư viện ta dùng. Một lời gọi chặn bên trong khối `synchronized` làm virtual thread bị ghim vào carrier, và vì số carrier chỉ xấp xỉ số core nên chỉ cần vài chỗ ghim đồng thời là cạn carrier — hệ thống đứng dù CPU rảnh. Thư viện ghi log, driver cũ, connection pool cũ đều là những chỗ tôi kiểm trước. Thứ hai, nó không thay thế giới hạn ngầm mà kích thước pool cũ đang cung cấp: pool 200 thread từng là trần cho số việc đồng thời trong toàn hệ thống, và bỏ nó nghĩa là bỏ một cơ chế bảo vệ mà không ai khai ra — nên phải thay bằng giới hạn tường minh cho những tài nguyên bên dưới vốn có trần. Thứ ba, nó không đổi `ThreadLocal` thành scoped value; ngữ cảnh vẫn được truyền theo thread, nên nó vẫn tốn bộ nhớ khi số thread lớn và vẫn có thể đọc sai ở những đường mã chạy trên thread tái sử dụng. Thứ tư, nó không làm tác vụ CPU-bound chạy tốt hơn — với công việc tính toán thì virtual thread làm độ trễ đuôi xấu đi, nên phần đó cần một pool riêng có trần gần số core. Thứ năm, nó không đặt timeout cho các lời gọi ra ngoài, và điều đó trở nên quan trọng hơn trước: khi không còn trần thread thì một phụ thuộc chậm không còn bị chặn bởi kích thước pool, nên số việc đang chờ có thể tăng tới mức cạn bộ nhớ.",
    redFlags: [
      "Coi dòng cấu hình là đủ để hoàn tất việc chuyển đổi",
      "Không nhắc tới ghim",
      "Bỏ qua việc mất trần ngầm",
    ],
    probes: [
      "Bạn rà ghim trước khi bật bằng cách nào?",
      "Trần ngầm cũ của bạn là bao nhiêu, và bạn thay bằng gì?",
      "Vì sao timeout trở nên quan trọng hơn sau khi bật?",
    ],
    refs: ["modconc-07", "modconc-02"],
  },
  {
    id: "modconc-iq22",
    field: "modern-concurrency",
    topic: "mc-framework",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Danh mục kiểm tra của một đội trước khi bật virtual thread:

  [x] Bật cấu hình virtual thread cho tầng web
  [x] Nâng JDK lên bản hỗ trợ
  [x] Chạy bộ kiểm thử — tất cả xanh
  [x] Đo thông lượng trên môi trường thử — tăng 4 lần
  [ ] ... (đội cho là đã đủ)

Sau khi phát hành: thông lượng chỉ tăng 15%, và có những
đợt 10 giây không xử lý được request nào.`,
    },
    question: "Danh mục này thiếu những mục nào? Với mỗi mục thiếu, nói nó lẽ ra sẽ bắt được triệu chứng nào.",
    mustCover: [
      "Thiếu mục **rà ghim**: bật cờ theo dõi ghim và chạy tải — nó bắt được đúng nguyên nhân của các đợt 10 giây",
      "Ghim giải thích cả hai triệu chứng: thông lượng chỉ tăng 15% vì carrier bị chiếm, và đợt treo khi nhiều chỗ ghim trùng nhau",
      "Thiếu mục **đo trên tải và dữ liệu giống production**: môi trường thử có thể không đi qua thư viện gây ghim",
      "Thiếu mục **rà `ThreadLocal`**: nó bắt được lỗi ngữ cảnh sai ở những đường chạy trên thread tái sử dụng",
      "Thiếu mục **thay trần ngầm bằng trần tường minh**: nó chặn nguy cơ cạn bộ nhớ và quá tải phụ thuộc",
      "Thiếu mục **timeout cho mọi lời gọi ra ngoài**",
      "Thiếu mục **tách tác vụ CPU-bound sang pool riêng**",
      "Bộ kiểm thử xanh không nói gì vì nó chạy ở mức đồng thời thấp — nơi mọi vấn đề trên đều không lộ ra",
    ],
    model: "Danh mục này kiểm những thứ dễ kiểm và bỏ qua đúng những thứ quyết định. Mục thiếu quan trọng nhất là rà ghim: bật cờ theo dõi ghim rồi chạy một đợt tải, và đếm số lần ghim cùng chỗ gây ra. Nó sẽ bắt được trực tiếp nguyên nhân của cả hai triệu chứng sau phát hành — thông lượng chỉ tăng 15% vì carrier liên tục bị chiếm bởi những virtual thread ghim, và những đợt 10 giây không xử lý được gì khi đủ nhiều chỗ ghim xảy ra trùng nhau để cạn toàn bộ carrier. Mục thiếu thứ hai giải thích vì sao môi trường thử cho 4 lần mà production chỉ 15%: đo phải chạy trên tải và dữ liệu giống production. Môi trường thử thường không đi qua cùng những thư viện, không có cùng kích thước dữ liệu, và quan trọng nhất là không có cùng mức đồng thời — mà ghim chỉ biểu hiện thành sự cố khi số chỗ ghim đồng thời tiến tới số carrier. Mục thiếu thứ ba là rà `ThreadLocal`: nó bắt được lỗi ngữ cảnh đọc sai ở những đường mã chạy trên thread tái sử dụng, và đó là loại lỗi không làm bộ kiểm thử đỏ mà làm dữ liệu sai âm thầm. Mục thiếu thứ tư là thay trần ngầm bằng trần tường minh, và nó chặn một lớp sự cố khác chưa xuất hiện trong đề bài nhưng sẽ tới: cạn bộ nhớ khi một phụ thuộc chậm, và quá tải những dịch vụ hạ nguồn vốn được bảo vệ bởi kích thước pool cũ. Mục thiếu thứ năm là timeout cho mọi lời gọi ra ngoài, cùng lý do. Mục thiếu thứ sáu là tách tác vụ CPU-bound sang pool riêng. Và điểm tôi muốn nói rõ về mục \"bộ kiểm thử xanh\": nó không sai nhưng nó không nói gì về việc chuyển đổi này, vì bộ kiểm thử chạy ở mức đồng thời thấp — nơi ghim không cạn được carrier, nơi `ThreadLocal` không bị tái sử dụng đủ để lộ lỗi, và nơi không có trần nào bị chạm. Coi nó là bằng chứng an toàn là sai lầm về loại bằng chứng.",
    redFlags: [
      "Coi bộ kiểm thử xanh là bằng chứng chuyển đổi an toàn",
      "Chỉ thêm mục rà ghim mà bỏ qua trần tường minh và timeout",
      "Không nhận ra vì sao môi trường thử cho kết quả khác production",
      "Đề nghị quay lại thread nền tảng",
    ],
    probes: [
      "Vì sao ghim chỉ biểu hiện thành sự cố ở mức đồng thời cao?",
      "Bạn dựng tải giống production thế nào cho phép đo này?",
      "Mục nào trong danh mục của bạn có tiêu chí đạt/không đạt rõ ràng?",
    ],
    refs: ["modconc-07"],
  },
  {
    id: "modconc-iq23",
    field: "modern-concurrency",
    topic: "mc-framework",
    level: 3,
    minutes: 10,
    question: "Bạn lên kế hoạch chuyển một hệ thống 20 dịch vụ sang virtual thread. Chuyển theo thứ tự nào, và dừng ở đâu?",
    tradeoffs: [
      {
        option: "Bắt đầu từ dịch vụ **chờ I/O nhiều, ít phụ thuộc**",
        when: "Luôn là bước đầu: lợi ích rõ nhất, rủi ro thấp nhất, và nó cho đội học cách đo ghim cùng cách đặt trần tường minh trên một ca dễ. Kết quả của nó cũng là bằng chứng để quyết định tiếp.",
      },
      {
        option: "Chuyển dịch vụ **chịu tải cao nhất** trước",
        when: "Khi có áp lực về năng lực và cần kết quả nhanh. Lợi ích lớn nhất nhưng rủi ro cũng lớn nhất, và nếu đội chưa có kinh nghiệm đo ghim thì đây là chỗ tệ nhất để học.",
      },
      {
        option: "Không chuyển một số dịch vụ",
        when: "Dịch vụ thuần **CPU-bound**, dịch vụ đã reactive và chạy tốt, và dịch vụ phụ thuộc thư viện đầy `synchronized` mà không sửa được. Đây là câu trả lời đúng cho một phần trong 20, không phải thất bại.",
      },
    ],
    mustCover: [
      "Phải phân loại 20 dịch vụ theo **hình dạng tải** trước khi lên thứ tự — chờ nhiều, tính nhiều, hay đã reactive",
      "Chuyển từng dịch vụ một, mỗi lần đo và rút bài học, thay vì chuyển đồng loạt",
      "Dịch vụ đầu tiên nên là ca **dễ** để đội học cách đo ghim và đặt trần — không phải ca quan trọng nhất",
      "Mỗi lần chuyển phải có **tiêu chí nghiệm thu** gồm cả thông lượng và phân bố độ trễ, không chỉ thông lượng",
      "Một số dịch vụ **không nên** chuyển, và nói ra điều đó là một phần của kế hoạch",
      "Phải để ý **hiệu ứng lan**: một dịch vụ chuyển xong đẩy tải cao hơn sang các dịch vụ hạ nguồn chưa chuyển",
      "Nên trần tường minh ở đường gọi ra ngoài phải được đặt **trước** khi thông lượng tăng",
    ],
    model: "Bước đầu tiên không phải chuyển gì mà là phân loại 20 dịch vụ theo hình dạng tải: chờ I/O nhiều, thuần tính toán, hay đã viết reactive. Ba nhóm đó có ba câu trả lời khác nhau, và trộn chúng vào một kế hoạch chung là cách chắc chắn để có sự cố. Tôi bắt đầu từ một dịch vụ chờ I/O nhiều và ít phụ thuộc — không phải dịch vụ quan trọng nhất, mà dịch vụ **dễ nhất**. Lý do là đội cần học ba việc cụ thể trên một ca mà sai cũng không đắt: cách bật và đọc kết quả theo dõi ghim, cách suy ra trần tường minh từ tài nguyên bên dưới, và cách đặt tiêu chí nghiệm thu. Chuyển dịch vụ chịu tải cao nhất trước thì lợi ích lớn hơn nhưng đó là chỗ tệ nhất để học. Từ ca thứ hai trở đi tôi chuyển từng dịch vụ một, mỗi lần đo và ghi lại bài học, vì phần lớn vấn đề đến từ thư viện cụ thể mà dịch vụ đó dùng — nên kinh nghiệm tích luỹ được có giá trị thật cho những ca sau. Tiêu chí nghiệm thu cho mỗi lần chuyển phải gồm cả thông lượng **và** phân bố độ trễ, vì chỉ nhìn thông lượng là cách bỏ lọt đúng những vấn đề mà virtual thread gây ra ở đuôi. Phần tôi cho là quan trọng nhất trong kế hoạch và hay bị thiếu: **hiệu ứng lan**. Khi một dịch vụ chuyển xong và thông lượng của nó tăng bốn lần, nó đẩy tải cao hơn sang các dịch vụ hạ nguồn vốn chưa chuyển và vẫn còn trần thread cũ — nên ta có thể sửa xong một chỗ rồi gây sự cố ở chỗ khác. Vì vậy trần tường minh ở đường gọi ra ngoài phải được đặt **trước** khi thông lượng tăng, không phải sau; và thứ tự chuyển nên đi theo chiều từ hạ nguồn lên, hoặc ít nhất phải thông báo và chuẩn bị cho các đội hạ nguồn. Cuối cùng, một phần của kế hoạch là nói rõ những dịch vụ **không** chuyển: thuần tính toán, đã reactive và chạy tốt, hoặc phụ thuộc thư viện đầy `synchronized` mà không sửa được. Đó không phải thất bại của kế hoạch mà là kết luận đúng cho những ca đó.",
    redFlags: [
      "Chuyển đồng loạt cả 20 dịch vụ",
      "Bắt đầu từ dịch vụ quan trọng nhất để \"có kết quả nhanh\"",
      "Không tính hiệu ứng lan sang các dịch vụ hạ nguồn",
      "Coi việc không chuyển một số dịch vụ là thất bại",
      "Nghiệm thu chỉ bằng thông lượng",
    ],
    probes: [
      "Hiệu ứng lan cụ thể trông thế nào, và bạn chuẩn bị cho nó ra sao?",
      "Tiêu chí nghiệm thu của bạn cho một lần chuyển gồm những gì?",
      "Bạn phân loại 20 dịch vụ bằng dữ liệu nào?",
    ],
    refs: ["modconc-07", "modconc-08"],
  },
  {
    id: "modconc-iq24",
    field: "modern-concurrency",
    topic: "mc-framework",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Đội chuyển dịch vụ A sang virtual thread và thông lượng tăng 4 lần như kỳ vọng. Hai ngày sau, dịch vụ B và C — nằm hạ nguồn của A — bắt đầu có p99 tăng gấp 6 và tỉ lệ lỗi 3%. Hai đội kia nói họ không đổi gì. Dịch vụ A vẫn khoẻ và các chỉ số của nó đều tốt.",
      scale: "A xử lý 1.200 request/giây trước, 4.800 sau. Mỗi request của A gọi B một lần và C hai lần. B và C vẫn dùng pool 150 thread nền tảng. Ba dịch vụ thuộc ba đội khác nhau.",
      constraints: "Không giảm thông lượng của A — đó là mục tiêu của việc chuyển đổi. B và C không chuyển được sang virtual thread trong quý này. Phải xử lý mà không cần ba đội cùng phát hành đồng thời.",
      },
    question: "Cả ba đội đều nói mình không sai. Ai đúng? Nêu chẩn đoán và cách xử lý.",
    mustCover: [
      "Cả ba đội đều đúng về phạm vi của mình — đây là **hiệu ứng lan**, không phải lỗi của bên nào",
      "A chuyển xong nên nó gửi đi tải cao hơn 4 lần; B và C nhận tải đó với trần thread cũ",
      "Phép tính: A ở 4.800 request/giây gọi C hai lần là **9.600 lời gọi/giây** tới C, so với 2.400 trước đây",
      "Việc bỏ trần thread của A đã bỏ luôn cơ chế **bảo vệ ngầm** cho B và C",
      "Đó là lỗi **kế hoạch chuyển đổi**, không phải lỗi mã của ai: thiếu bước đặt trần tường minh trước khi tăng thông lượng",
      "Xử lý ngay, chỉ cần A phát hành: đặt **semaphore riêng** cho đường gọi B và đường gọi C ở phía A",
      "Trần đó suy từ năng lực thật của B và C, và đặt **riêng từng đường** để một bên hỏng không tiêu năng lực của bên kia",
      "Kèm timeout, và một quy ước cho những lần chuyển đổi sau: đặt trần trước, tăng thông lượng sau",
    ],
    model: "Cả ba đội đều đúng trong phạm vi của mình, và đó chính là điều làm ca này khó nhìn. Đội A đã làm đúng việc của họ và mọi chỉ số của A đều tốt. Đội B và C thật sự không đổi gì. Cái đổi là **tải đi vào** B và C, và nó đổi vì một lý do nằm ở A nhưng không biểu hiện thành lỗi ở A. Phép tính cho thấy quy mô: A đi từ 1.200 lên 4.800 request mỗi giây, mỗi request gọi C hai lần, nên C nhận khoảng 9.600 lời gọi mỗi giây thay vì 2.400 — gấp bốn, và B cũng gấp bốn. Với trần pool 150 thread nền tảng, B và C không thể mở rộng theo nên chúng xếp hàng, p99 nổ, và một phần request timeout thành tỉ lệ lỗi 3%. Nguyên nhân sâu hơn là điều tôi muốn nói rõ với cả ba đội: pool thread của A trước đây đang đóng vai một cơ chế **bảo vệ ngầm** cho B và C. Với 1.200 request mỗi giây bị giới hạn bởi kích thước pool, A về nguyên tắc không thể gửi quá một lượng nhất định tới hạ nguồn. Bỏ trần đó nghĩa là bỏ luôn lớp bảo vệ ấy, và không ai nhận ra vì nó chưa bao giờ được khai ra ở đâu. Nên đây là lỗi của **kế hoạch chuyển đổi** chứ không của mã ai: thiếu đúng một bước — đặt trần tường minh cho các đường gọi ra ngoài **trước** khi thông lượng tăng. Về xử lý, điều tốt là nó chỉ cần A phát hành, nên ràng buộc không cần ba đội đồng thời được thoả: tôi đặt semaphore ở phía A cho đường gọi B và đường gọi C, mỗi đường một trần riêng suy từ năng lực thật của B và C — không phải từ mong muốn của A. Đặt riêng từng đường là quan trọng vì nó cho cô lập lỗi: khi C chậm, chỉ số permit của C bị chiếm còn đường gọi B vẫn chạy. Kèm theo là timeout cho cả hai đường, để một lời gọi treo không giữ chỗ vô hạn. Hệ quả là thông lượng của A có thể bị giới hạn lại ở những đường phụ thuộc hạ nguồn, và tôi sẽ nói thẳng điều đó: mục tiêu \"không giảm thông lượng của A\" chỉ đạt được tới mức mà B và C chịu được — muốn hơn thì phải nâng năng lực của B và C, và đó là việc của quý sau. Cuối cùng, tôi đưa bài học này thành một quy ước cho những lần chuyển đổi còn lại: đặt trần trước, tăng thông lượng sau, và thông báo cho đội hạ nguồn kèm con số dự kiến.",
    redFlags: [
      "Kết luận B và C phải tự chịu vì A đã làm đúng",
      "Yêu cầu B và C chuyển sang virtual thread ngay — ràng buộc đã cấm trong quý này",
      "Giảm thông lượng của A về mức cũ, tức bỏ hết kết quả chuyển đổi",
      "Đặt một trần dùng chung cho cả hai đường gọi, mất khả năng cô lập lỗi",
      "Không rút ra quy ước cho những lần chuyển đổi còn lại",
    ],
    probes: [
      "Bạn suy trần cho đường gọi C từ số liệu nào của C?",
      "Vì sao trần riêng từng đường quan trọng hơn một trần dùng chung?",
      "Bạn thông báo gì cho đội hạ nguồn trước lần chuyển đổi tiếp theo?",
    ],
    refs: ["modconc-07", "modconc-02"],
  },
];
