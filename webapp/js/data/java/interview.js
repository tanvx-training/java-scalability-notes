// Ngân hàng câu hỏi phỏng vấn Java & Spring Boot Scalability — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: series 10 bài trong sources/java/ — TCP/kernel, Tomcat internals,
// JVM concurrency, capacity planning, transaction. Mỗi câu trỏ bài nguồn qua
// `refs` để tra ngược.
//
// LƯU Ý KHI VIẾT THÊM: mỗi bài nguồn đã có mục "Tự kiểm chứng" hoặc "Câu hỏi
// phỏng vấn" của riêng nó. Câu ở đây KHÔNG chép lại chúng — chúng là chỉ dấu
// tốt về cái gì đáng hỏi, nhưng ngân hàng này cần câu độc lập, có rubric và
// đúng hợp đồng theo cấp.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js. Tóm lại:
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (java-iq01–java-iq24) — thống kê tự chấm lưu theo id.

export const javaInterview = [
  // ===== java-request — Hành trình request và timeout (java-iq01–java-iq04) =====
  {
    id: "java-iq01",
    field: "java",
    topic: "java-request",
    level: 1,
    minutes: 6,
    question: "Kể lại hành trình một request HTTP từ lúc client mở kết nối tới lúc mã nghiệp vụ của bạn chạy. Ở mỗi chặng, hàng đợi nào có thể đầy?",
    mustCover: [
      "Kernel nhận SYN và đưa kết nối vào **hàng đợi chưa hoàn tất bắt tay**, rồi sang **hàng đợi đã chấp nhận** sau khi bắt tay xong",
      "Hàng đợi đã chấp nhận có trần do backlog quy định; đầy thì kernel **bỏ hoặc từ chối** kết nối mới — client thấy lỗi kết nối, không thấy lỗi ứng dụng",
      "Tomcat có luồng riêng nhận kết nối rồi đưa task vào **hàng đợi của thread pool**",
      "Hàng đợi task đầy thì Tomcat **từ chối** request; hàng đợi quá lớn thì request **chờ rất lâu** rồi mới được xử lý",
      "Chỉ tới chặng cuối một worker thread mới chạy mã nghiệp vụ, nơi nó lại có thể chờ **connection pool** của database",
      "Ba tầng hàng đợi nối tiếp nhau nghĩa là độ trễ người dùng thấy là **tổng thời gian chờ ở mọi hàng đợi**, không chỉ thời gian xử lý",
    ],
    model: "Có ít nhất ba tầng hàng đợi nối tiếp, và biết chúng ở đâu là điều kiện để chẩn đoán đúng. Chặng thứ nhất ở kernel: client gửi SYN, kết nối nằm trong hàng đợi chưa hoàn tất bắt tay, rồi sau khi bắt tay xong nó chuyển sang hàng đợi các kết nối đã chấp nhận, chờ ứng dụng gọi nhận. Hàng đợi thứ hai này có trần do backlog quy định, và khi đầy thì kernel bỏ hoặc từ chối kết nối mới — dấu hiệu nhận biết quan trọng là client thấy lỗi ở tầng kết nối, còn log ứng dụng thì hoàn toàn sạch, vì request chưa bao giờ tới được ứng dụng. Chặng thứ hai ở Tomcat: một luồng riêng lấy kết nối ra khỏi hàng đợi kernel rồi đưa công việc vào hàng đợi của thread pool. Hàng đợi này có hai chế độ hỏng ngược nhau — quá nhỏ thì Tomcat từ chối request khi đầy, quá lớn thì không ai bị từ chối nhưng request nằm chờ rất lâu trước khi được xử lý, và người dùng đã bỏ đi từ lâu trước khi ta trả lời. Chặng thứ ba là khi một worker thread lấy được task và chạy mã nghiệp vụ; nhưng ngay ở đó nó thường lại chờ tiếp, lần này là chờ một connection từ pool database. Điều quan trọng phải rút ra là độ trễ người dùng thấy bằng tổng thời gian chờ ở mọi hàng đợi cộng thời gian xử lý thật — nên một hệ thống có thời gian xử lý 5ms vẫn có thể cho độ trễ hàng giây nếu request xếp hàng ở hai chặng trước đó. Đó cũng là lý do đo p99 chỉ ở tầng ứng dụng có thể trông rất đẹp trong khi người dùng đang chịu độ trễ tệ.",
    redFlags: [
      "Bắt đầu câu trả lời từ controller, bỏ qua hoàn toàn hai tầng hàng đợi trước đó",
      "Không phân biệt \"bị từ chối kết nối\" với \"request chậm\" — hai chế độ hỏng khác nhau ở hai tầng khác nhau",
      "Tin rằng hàng đợi lớn hơn thì luôn tốt hơn",
      "Đo độ trễ chỉ ở tầng ứng dụng rồi kết luận hệ thống khoẻ",
    ],
    probes: [
      "Log ứng dụng sạch mà client báo lỗi kết nối — bạn nghi chặng nào?",
      "Hàng đợi task rất lớn thì chế độ hỏng đổi thành gì?",
      "Bạn đo thời gian chờ ở từng chặng bằng cách nào?",
    ],
    refs: ["java-01"],
  },
  {
    id: "java-iq02",
    field: "java",
    topic: "java-request",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Service
public class PaymentGateway {

    private final RestTemplate rest;   // dựng bằng new RestTemplate(), không cấu hình gì

    public PaymentResult charge(ChargeRequest req) {
        // Gọi sang đối tác thanh toán
        return rest.postForObject("https://partner.example/charge", req, PaymentResult.class);
    }
}

// Controller gọi nó:
@PostMapping("/pay")
public ResponseEntity<?> pay(@RequestBody ChargeRequest req) {
    return ResponseEntity.ok(gateway.charge(req));   // không timeout ở tầng nào
}`,
    },
    question: "Khi đối tác thanh toán bị treo mạng, dịch vụ của bạn ngừng phục vụ **toàn bộ** request, kể cả những endpoint không liên quan. Giải thích chuỗi nguyên nhân, rồi nêu các timeout bạn cần đặt và vì sao một cái là không đủ.",
    mustCover: [
      "Không có timeout nghĩa là lời gọi chờ tới khi kernel tự bỏ kết nối — có thể hàng phút",
      "Mỗi lời gọi treo **giữ một worker thread** của Tomcat suốt thời gian đó",
      "Khi mọi worker thread đều bị giữ, hàng đợi task đầy và **mọi endpoint** dừng phục vụ — sự cố lan ra ngoài phạm vi tính năng bị lỗi",
      "Cần **ít nhất hai** timeout khác nhau: timeout kết nối và timeout đọc — chúng bảo vệ hai pha khác nhau",
      "Timeout kết nối chặn trường hợp không bắt tay được; timeout đọc chặn trường hợp đã kết nối nhưng đối tác không trả lời",
      "Chỉ đặt timeout là chưa đủ để **cô lập** lỗi — cần thêm một trần cho số lời gọi đồng thời ra ngoài, hoặc một pool riêng",
    ],
    model: "Chuỗi nguyên nhân đi qua ba bước và bước thứ ba là bước làm sự cố lan rộng. Bước một: `RestTemplate` dựng mặc định không có timeout nào, nên khi đối tác treo mạng, lời gọi sẽ chờ cho tới khi kernel tự bỏ kết nối — có thể hàng phút. Bước hai: trong suốt thời gian đó, worker thread đang chạy `charge` bị giữ lại, không tiêu CPU nhưng không làm được gì khác. Bước ba: các request `/pay` tiếp tục đến và mỗi cái lại giữ thêm một worker; khi toàn bộ worker bị giữ thì hàng đợi task đầy và Tomcat không còn thread nào để phục vụ **bất kỳ** endpoint nào. Đó là lý do một tính năng lỗi làm sập cả dịch vụ, và là điểm quan trọng nhất trong câu trả lời: vấn đề không phải `/pay` chậm, mà là `/pay` tiêu hết tài nguyên dùng chung. Về timeout, một cái là không đủ vì có hai pha hỏng khác nhau. Timeout kết nối bảo vệ pha bắt tay — đối tác không phản hồi ở tầng TCP, cần cắt sớm và cắt ngắn, vì bắt tay lẽ ra chỉ mất vài chục milliseconds. Timeout đọc bảo vệ pha sau khi đã kết nối được nhưng đối tác không trả lời hoặc trả lời nhỏ giọt; giá trị của nó phải đặt theo p99 thật của đối tác cộng một khoảng dự phòng, không đặt theo cảm giác. Nếu chỉ đặt một cái thì luôn còn một pha không được bảo vệ. Nhưng ngay cả khi đặt đủ hai timeout, ta vẫn chưa cô lập được lỗi: nếu timeout đọc là 10 giây và lưu lượng `/pay` đủ lớn, worker vẫn bị giữ hàng loạt trong 10 giây đó. Nên bước cuối là đặt một trần cho số lời gọi đồng thời đi ra đối tác — bằng một semaphore hoặc một pool riêng cho các lời gọi ra ngoài — để khi đối tác hỏng, chỉ một phần năng lực bị ảnh hưởng và các endpoint khác vẫn phục vụ bình thường.",
    redFlags: [
      "Đặt một timeout duy nhất rồi coi là xong, không phân biệt pha kết nối với pha đọc",
      "Đặt timeout rất lớn \"để không làm hỏng giao dịch của khách\" — biến mọi request thành một cách tiêu worker thread",
      "Nói vấn đề là đối tác chậm, không nhận ra vấn đề của mình là chia sẻ tài nguyên không có trần",
      "Tăng số worker thread để chịu được — đẩy ngưỡng lên cao hơn, không cô lập được lỗi",
    ],
    probes: [
      "Bạn chọn giá trị cho timeout đọc dựa vào số liệu nào?",
      "Vì sao đặt đủ hai timeout vẫn chưa cô lập được lỗi?",
      "Nếu đối tác trả lời rất chậm nhưng vẫn trả lời, timeout nào bắt được?",
    ],
    refs: ["java-02", "java-01"],
  },
  {
    id: "java-iq03",
    field: "java",
    topic: "java-request",
    level: 3,
    minutes: 9,
    question: "Một endpoint phụ thuộc một dịch vụ bên ngoài không đáng tin. Bạn chọn chiến lược chịu lỗi nào?",
    tradeoffs: [
      {
        option: "Timeout kèm trần số lời gọi đồng thời",
        when: "Mức tối thiểu, luôn phải có. Timeout chặn một lời gọi giữ thread vô hạn; trần đồng thời chặn việc một phụ thuộc hỏng tiêu hết worker dùng chung. Rẻ, không thêm trạng thái, và giải quyết chế độ hỏng nghiêm trọng nhất.",
      },
      {
        option: "Thêm cầu dao — ngắt khi tỉ lệ lỗi vượt ngưỡng",
        when: "Khi phụ thuộc hỏng theo **đợt dài** chứ không phải lỗi lẻ. Cầu dao ngắt sớm nên không tốn thời gian chờ timeout cho những lời gọi chắc chắn thất bại, và cho phía kia thời gian hồi phục. Đổi lại là trạng thái phải quản lý và nguy cơ ngắt oan khi ngưỡng đặt sai.",
      },
      {
        option: "Thử lại — chỉ với thao tác lặp lại an toàn",
        when: "Khi lỗi là **tạm thời** và thao tác **idempotent**. Cứu được phần lớn lỗi lẻ. Nhưng thử lại trong lúc phía kia đang quá tải là đổ thêm tải vào chỗ đang cháy, nên phải có giãn cách tăng dần và phải nằm dưới cầu dao.",
      },
    ],
    mustCover: [
      "Timeout và trần đồng thời là **mức nền**, không phải một lựa chọn — thiếu chúng thì mọi thứ khác vô nghĩa",
      "Thử lại chỉ đúng khi thao tác **idempotent**; với thanh toán thì thử lại mù là tạo giao dịch trùng",
      "Thử lại không có giãn cách là **đổ thêm tải** vào hệ thống đang quá tải, làm sự cố nặng hơn",
      "Cầu dao giải bài khác hẳn thử lại: nó **ngừng gọi** thay vì gọi lại, nên nó bảo vệ cả hai phía",
      "Thứ tự lồng nhau có ý nghĩa: thử lại phải nằm **dưới** cầu dao, không thì cầu dao đếm cả lần thử lại",
      "Phải quyết định hành vi khi phụ thuộc chết: trả lỗi, trả dữ liệu cũ, hay hạ cấp tính năng — đây là quyết định **nghiệp vụ**",
    ],
    model: "Tôi xếp ba thứ này thành ba tầng chứ không phải ba phương án ngang nhau. Tầng nền là timeout cộng trần số lời gọi đồng thời, và nó không phải lựa chọn — thiếu nó thì mọi cơ chế khác đều vô nghĩa, vì chế độ hỏng nghiêm trọng nhất không phải endpoint này lỗi mà là nó tiêu hết worker thread dùng chung rồi làm sập những endpoint chẳng liên quan. Tầng thứ hai là thử lại, và điều kiện áp dụng phải nói trước lợi ích: thao tác phải idempotent. Với một lời gọi thanh toán thì thử lại mù là cách tạo giao dịch trùng, nên nếu cần thử lại thì phải có khoá idempotent do phía gọi sinh ra. Kèm theo là giãn cách tăng dần cộng một chút nhiễu ngẫu nhiên, vì thử lại ngay và đồng loạt trong lúc phía kia đang quá tải chính là đổ thêm tải vào chỗ đang cháy — và đó là cách một sự cố nhỏ trở thành sự cố lớn. Tầng thứ ba là cầu dao, giải một bài hoàn toàn khác: nó không gọi lại mà **ngừng gọi**. Khi phụ thuộc hỏng theo đợt dài, mỗi lời gọi vẫn tốn trọn thời gian timeout trước khi thất bại, nên cầu dao vừa cứu thời gian của ta vừa cho phía kia khoảng lặng để hồi phục. Thứ tự lồng nhau có ý nghĩa thật: thử lại phải nằm dưới cầu dao, vì nếu ngược lại thì cầu dao đếm mỗi request một lần trong khi thực tế đã có ba lời gọi đi ra, và ngưỡng của nó sai hệ số ba. Cuối cùng, phần mà các thảo luận kỹ thuật thường bỏ qua nhưng lại quyết định: khi phụ thuộc chết thật thì endpoint này trả về gì. Trả lỗi, trả dữ liệu cũ, hay hạ cấp tính năng — đó là quyết định nghiệp vụ, và nó phải được chốt trước khi chọn cơ chế, vì nó quyết định cả giá trị timeout và ngưỡng cầu dao.",
    redFlags: [
      "Thử lại mà không hỏi thao tác có idempotent hay không",
      "Thử lại ngay lập tức, không giãn cách, không nhiễu ngẫu nhiên",
      "Đặt thử lại ngoài cầu dao nên ngưỡng cầu dao sai hệ số",
      "Bàn hết cơ chế mà không chốt endpoint trả về gì khi phụ thuộc chết",
      "Coi timeout là một lựa chọn thay thế cho các cơ chế khác",
    ],
    probes: [
      "Với một lời gọi thanh toán, bạn làm gì để thử lại an toàn?",
      "Vì sao thứ tự lồng giữa thử lại và cầu dao lại quan trọng?",
      "Ngưỡng cầu dao đặt sai theo hướng quá nhạy thì hậu quả là gì?",
    ],
    refs: ["java-02"],
  },
  {
    id: "java-iq04",
    field: "java",
    topic: "java-request",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Mỗi sáng 8:55–9:05, khoảng 2% client báo lỗi \"connection refused\" hoặc \"connection reset\". Log ứng dụng trong khoảng đó hoàn toàn sạch — không lỗi, không cảnh báo, độ trễ p99 thậm chí thấp hơn bình thường. Dashboard ứng dụng toàn xanh.",
      scale: "Bình thường 3.000 request/giây, khung 9 giờ lên đỉnh 11.000/giây trong khoảng 3 phút vì một job đồng bộ của khách hàng. 16 instance sau load balancer.",
      constraints: "Không tăng được số instance vào riêng khung giờ đó — hạ tầng không có tự co giãn theo lịch trong quý này. Không yêu cầu được khách hàng đổi giờ chạy job. Phải giải thích được vì sao log sạch, vì đội đang nghi ngờ bên khách hàng báo sai.",
    },
    question: "Log ứng dụng sạch mà client vẫn báo lỗi kết nối — điều đó khoanh vùng nguyên nhân vào đâu? Nêu chẩn đoán và cách bạn xử lý trong ràng buộc đã cho.",
    mustCover: [
      "Log sạch là **bằng chứng chính**, không phải điều đáng ngờ: request bị từ chối **trước khi** tới được ứng dụng",
      "Vì vậy nguyên nhân nằm ở tầng **dưới** ứng dụng — hàng đợi kết nối của kernel, hoặc trần kết nối của Tomcat",
      "p99 thấp hơn bình thường cũng khớp: những request **chậm nhất bị loại bỏ**, nên phần còn lại trông đẹp hơn — một dạng thiên lệch do chọn mẫu",
      "Đỉnh 11.000/giây trên 3.000 nền là hệ số gần 4, đủ để vượt hàng đợi đã chấp nhận trong vài giây",
      "\"Connection refused\" và \"connection reset\" là hai triệu chứng khác nhau, chỉ vào hàng đợi đầy ở hai thời điểm khác nhau của bắt tay",
      "Đo đúng chỗ: theo dõi **số kết nối bị bỏ ở tầng kernel** và độ dài hàng đợi, không theo dõi metric ứng dụng",
      "Xử lý trong ràng buộc: nới backlog và trần kết nối của Tomcat để **hấp thụ đỉnh ngắn**, và đo lại để xác nhận",
    ],
    model: "Việc log ứng dụng sạch là dữ kiện mạnh nhất ta có, và đội đang đọc nó ngược. Nếu request đã tới được ứng dụng và thất bại thì phải có dấu vết; không có dấu vết nào nghĩa là chúng bị từ chối **trước khi** ứng dụng nhìn thấy. Điều đó khoanh nguyên nhân xuống dưới tầng ứng dụng: hàng đợi các kết nối đã chấp nhận ở kernel bị đầy, hoặc Tomcat đã đạt trần số kết nối nó nhận. Khi hàng đợi đó đầy, kernel bỏ hoặc từ chối kết nối mới, và client thấy đúng hai triệu chứng đề bài mô tả — \"connection refused\" khi bị từ chối thẳng, \"connection reset\" khi kết nối đã hình thành rồi bị bỏ. Chi tiết p99 thấp hơn bình thường cũng khớp và đáng nêu vì nó dễ bị đọc sai thành tin tốt: những request lẽ ra chậm nhất đã bị loại bỏ ngay từ cửa, nên tập request được đo chỉ còn những cái đi qua suôn sẻ — một thiên lệch do chọn mẫu, và nó giải thích vì sao dashboard toàn xanh trong lúc 2% client gặp lỗi. Về số học thì đỉnh 11.000 trên nền 3.000 là hệ số gần bốn, dồn trong khoảng ba phút; chỉ cần tốc độ kết nối mới vượt tốc độ ứng dụng gọi nhận trong vài giây là hàng đợi đầy, không cần cả ba phút. Cách đo là chuyển hẳn sang tầng dưới: theo dõi số kết nối bị bỏ ở kernel và độ dài hàng đợi theo thời gian, cùng số kết nối Tomcat đang giữ so với trần của nó. Nếu đường bỏ kết nối dựng lên đúng khung 8:55 thì chẩn đoán được xác nhận bằng dữ liệu, và đội thôi nghi ngờ khách hàng. Về xử lý trong ràng buộc không thêm instance: bài toán ở đây là một đỉnh ngắn, và đỉnh ngắn thì hấp thụ được bằng hàng đợi — nới backlog của kernel và trần kết nối của Tomcat để hàng đợi chứa được đỉnh ba phút. Đánh đổi phải nói rõ: hàng đợi dài hơn nghĩa là những request vào cuối đỉnh sẽ chờ lâu hơn, nên tôi đổi \"bị từ chối\" thành \"chậm hơn\" — với một job đồng bộ thì đó là đánh đổi đúng, nhưng nó chỉ đúng khi thời gian chờ vẫn nằm dưới timeout của client, nên phải đo và đối chiếu chứ không nới bừa.",
    redFlags: [
      "Kết luận khách hàng báo sai vì log sạch — log sạch chính là bằng chứng cho chẩn đoán",
      "Đọc p99 thấp hơn bình thường là tin tốt, không nhận ra thiên lệch do chọn mẫu",
      "Đi tối ưu mã ứng dụng, trong khi request chưa bao giờ chạm tới mã ứng dụng",
      "Nới hàng đợi mà không đối chiếu thời gian chờ với timeout của client",
      "Đòi thêm instance — ràng buộc đã cấm, và nó cũng không phải cách rẻ nhất cho một đỉnh ba phút",
    ],
    probes: [
      "Vì sao p99 lại đẹp hơn trong lúc 2% client gặp lỗi?",
      "\"Connection refused\" khác \"connection reset\" ở chỗ nào về cơ chế?",
      "Nới hàng đợi có thể làm hỏng chuyện gì, và bạn đo gì để biết?",
    ],
    refs: ["java-01", "java-02"],
  },

  // ===== java-blocking — Blocking, non-blocking và thread lifecycle (java-iq05–java-iq08) =====
  {
    id: "java-iq05",
    field: "java",
    topic: "java-blocking",
    level: 1,
    minutes: 6,
    question: "Phân biệt hai trục sync/async và blocking/non-blocking. Vì sao nhìn chữ ký hàm chỉ biết được một trục?",
    mustCover: [
      "Sync/async là thuộc tính của **API và mô hình giao tiếp**: caller nhận kết quả ngay trên đường return, hay nhận một \"lời hứa\" rồi đi làm việc khác",
      "Blocking/non-blocking là thuộc tính của **trạng thái thread ở tầng OS**: trong lúc chờ, thread có bị hệ điều hành treo hay không",
      "Nhìn chữ ký hàm biết được trục thứ nhất — trả `T` là sync, trả `Future<T>` hoặc nhận callback là async",
      "Nhưng **không** biết được trục thứ hai: phải biết bên dưới nó gọi syscall kiểu gì",
      "Vì hai trục độc lập nên có **bốn** tổ hợp, trong đó async cộng blocking là tổ hợp bẫy — trông như bất đồng bộ mà vẫn giữ thread",
    ],
    model: "Hai trục trả lời hai câu hỏi khác nhau về hai tầng khác nhau, và trộn chúng lại là nguồn của rất nhiều kết luận sai. Trục sync/async là hợp đồng giữa caller và callee: caller gọi xong có nhận kết quả rồi mới đi tiếp, hay nhận về một lời hứa — một `Future`, một callback, một mã đơn hàng — rồi đi làm việc khác trong lúc kết quả được giao sau qua một kênh khác. Đây là thuộc tính của API, nên nhìn chữ ký hàm là biết: trả về `T` là sync, trả về `Future<T>` hay `Mono<T>` hoặc nhận callback là async. Trục blocking/non-blocking thì nói về trạng thái thread ở tầng hệ điều hành: trong lúc chờ, thread có bị OS treo hay không. Blocking nghĩa là thread nằm trong syscall và scheduler gạt nó khỏi CPU tới khi có dữ liệu; non-blocking nghĩa là syscall trả về ngay, hoặc thread được park ở tầng ứng dụng còn thread OS đi làm việc khác. Đây là thuộc tính của thread state, và chỗ mấu chốt là nhìn chữ ký hàm **không** biết được — phải biết bên dưới nó gọi syscall kiểu gì, tức phải biết cả thư viện và cả driver. Vì hai trục độc lập nên có bốn tổ hợp, và tổ hợp cần cảnh giác nhất là async cộng blocking: API trông như bất đồng bộ vì nó trả về một `Future`, nhưng bên dưới vẫn có một thread bị treo chờ I/O — ta chỉ dời việc chờ sang một thread khác chứ không bỏ được nó. Đó là lý do bọc một lời gọi JDBC chặn vào `CompletableFuture.supplyAsync` không biến nó thành non-blocking; nó vẫn tiêu một thread, chỉ là thread của pool khác.",
    redFlags: [
      "Dùng \"async\" và \"non-blocking\" như hai từ đồng nghĩa",
      "Kết luận một hàm là non-blocking chỉ vì nó trả về `Future` hay `Mono`",
      "Không nêu được rằng trục thứ hai đòi phải biết syscall bên dưới",
    ],
    probes: [
      "Bọc một lời gọi JDBC vào `CompletableFuture` thì nó thành ô nào trong ma trận?",
      "Tổ hợp sync cộng non-blocking tồn tại không, và ở đâu?",
      "Bạn xác định một thư viện có blocking hay không bằng cách nào?",
    ],
    refs: ["java-03"],
  },
  {
    id: "java-iq06",
    field: "java",
    topic: "java-blocking",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Thread dump lúc dịch vụ treo cứng (trích 4 trong 200 thread):

"http-nio-8080-exec-12" #45 RUNNABLE
   java.net.SocketInputStream.socketRead0(Native Method)
   com.mysql.cj.protocol.a.SimpleP...readMessage(...)
   org.hibernate...  -> OrderService.findAll(OrderService.java:88)

"http-nio-8080-exec-13" #46 RUNNABLE   (giống hệt stack trên)
"http-nio-8080-exec-14" #47 RUNNABLE   (giống hệt stack trên)

"scheduler-1" #92 BLOCKED
   waiting to lock <0x00000007c0a12345> (a java.lang.Object)
   at CacheRefresher.refresh(CacheRefresher.java:41)

"pool-3-thread-2" #101 WAITING
   at jdk.internal.misc.Unsafe.park(Native Method)
   at java.util.concurrent.locks.LockSupport.park(...)`,
    },
    question: "Đội kết luận \"thread đều RUNNABLE nên hệ thống không bị chặn, chắc là CPU cao\". CPU thực tế 6%. Giải thích vì sao ba thread đó báo `RUNNABLE`, và đọc đúng dump này.",
    mustCover: [
      "JVM chỉ coi thread là `BLOCKED` hoặc `WAITING` khi nó chờ **cơ chế do JVM quản lý** — monitor của `synchronized`, hoặc `LockSupport.park()`",
      "Khi thread nằm trong **syscall I/O**, kernel đưa nó về trạng thái ngủ, nhưng ở góc nhìn JVM nó vẫn báo `RUNNABLE`",
      "`socketRead0` là native method đọc socket — ba thread đó đang **chờ database**, không hề tiêu CPU",
      "CPU 6% là bằng chứng khớp: `RUNNABLE` ở đây **không** có nghĩa đang chạy",
      "`BLOCKED` chỉ xuất hiện khi chờ **monitor lock** của `synchronized`; `ReentrantLock` cho ra `WAITING` vì nó dùng `park()`",
      "Đọc đúng dump: nhóm 200 thread đang chờ cùng một truy vấn là dấu hiệu **database chậm**, không phải CPU cao",
    ],
    model: "Kết luận của đội dựa trên một giả định sai về ngữ nghĩa của `RUNNABLE`. JVM chỉ coi một thread là `BLOCKED` hoặc `WAITING` khi nó chờ những cơ chế do chính JVM quản lý: monitor lock của khối `synchronized` cho ra `BLOCKED`, còn `LockSupport.park()` — thứ mà `ReentrantLock` và phần lớn `java.util.concurrent` dùng — cho ra `WAITING`. Nhưng khi thread thực hiện một syscall I/O, việc chờ diễn ra ở tầng kernel: Linux đưa thread về trạng thái ngủ, còn JVM không biết gì về điều đó nên vẫn báo `RUNNABLE`. Nhìn vào stack thì thấy ngay: `socketRead0` là native method đọc socket, tức ba thread đó đang nằm trong syscall chờ MySQL trả dữ liệu về. Chúng không tiêu một chu kỳ CPU nào, và CPU 6% chính là bằng chứng khớp với chẩn đoán đó chứ không phải điều mâu thuẫn. Nên đọc đúng dump này là: có một nhóm lớn thread cùng đứng ở cùng một stack chờ cùng một truy vấn, dẫn về `OrderService.findAll` — đó là dấu hiệu database chậm hoặc truy vấn đó chậm, và nó đang giữ hết worker của Tomcat. Hai thread còn lại cho thêm thông tin có ích và minh hoạ đúng phần định nghĩa: `scheduler-1` ở `BLOCKED` đang chờ một monitor lock, tức có một khối `synchronized` bị tranh chấp trong `CacheRefresher`; `pool-3-thread-2` ở `WAITING` tại `LockSupport.park` là hành vi bình thường của một thread pool đang chờ việc, không phải vấn đề. Bài học vận hành rút ra: khi đọc thread dump, `RUNNABLE` phải được đọc cùng với stack trên cùng — nếu trên cùng là một native method I/O thì thread đang chờ, và phải đối chiếu với CPU thực tế trước khi kết luận.",
    redFlags: [
      "Tin `RUNNABLE` nghĩa là đang chạy trên CPU",
      "Không đối chiếu kết luận \"CPU cao\" với số CPU thực tế 6%",
      "Bỏ qua stack trên cùng, chỉ đọc tên trạng thái",
      "Nghĩ `ReentrantLock` bị tranh chấp thì cũng cho ra `BLOCKED`",
    ],
    probes: [
      "Trạng thái nào là dấu hiệu chắc chắn của tranh chấp `synchronized`?",
      "Với virtual thread, `jstack` thông thường có thấy chúng không, và bạn dump bằng gì?",
      "Bạn phân biệt \"database chậm\" với \"quá nhiều truy vấn\" từ cùng một dump thế nào?",
    ],
    refs: ["java-04"],
  },
  {
    id: "java-iq07",
    field: "java",
    topic: "java-blocking",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ chờ I/O nhiều đang cạn thread pool. Bạn chọn hướng vượt trần nào?",
    tradeoffs: [
      {
        option: "Virtual threads",
        when: "Mã hiện tại là sync cộng blocking và bạn muốn **giữ nguyên lối viết tuần tự**. Chỉ đổi cơ chế thực thi, mã nghiệp vụ và stack trace vẫn đọc được. Điều kiện: phải rà `synchronized` trong mã **và trong thư viện** vì nó gây ghim, và phải biết mình đang mua **thông lượng** chứ không phải độ trễ.",
      },
      {
        option: "Reactive / non-blocking toàn tuyến",
        when: "Khi cần kiểm soát chi tiết áp lực ngược và luồng dữ liệu, hoặc đã có stack reactive. Đổi lại là **viết lại toàn tuyến** — chỉ một tầng còn blocking là mất hết lợi ích — cộng chi phí học và stack trace khó đọc.",
      },
      {
        option: "Tăng thread pool nền tảng",
        when: "Khi trần hiện tại đặt quá thấp so với tỉ lệ chờ trên tính, và số thread cần thêm còn ở bậc trăm. Rẻ nhất, sửa một dòng cấu hình. Không mở rộng được tới bậc chục nghìn vì mỗi thread nền tảng tốn bộ nhớ stack và chi phí lập lịch.",
      },
    ],
    mustCover: [
      "Phải chẩn đoán đúng bệnh trước: \"nhiều request cùng ngồi chờ I/O, CPU nhàn\" thì virtual thread đúng bài; \"mỗi request tự nó đã chậm\" thì **không** cứu được",
      "Virtual thread là **scale chứ không phải speed**: một request đơn lẻ không nhanh hơn một milliseconds nào, thậm chí nhỉnh thêm chi phí mount/unmount",
      "Với workload CPU-bound thì virtual thread vô ích — nút thắt là số core, và số carrier cũng chỉ xấp xỉ số core",
      "**Ghim** là bẫy lớn nhất khi bật virtual thread: block bên trong `synchronized`, hoặc trong lời gọi native, làm VT không unmount được",
      "Ghim thường đến từ **thư viện** chứ không từ mã của mình — driver hoặc connection pool cũ đầy `synchronized`",
      "Reactive chỉ có lợi khi **toàn tuyến** non-blocking; còn một tầng blocking là mất hết",
    ],
    model: "Việc đầu tiên không phải chọn công cụ mà là xác nhận bệnh, vì ba hướng này chỉ có một hướng đúng cho mỗi bệnh. Nếu triệu chứng là nhiều request cùng ngồi chờ I/O trong khi CPU nhàn thì đúng bài của virtual thread. Nếu là mỗi request tự nó đã chậm vì một truy vấn nặng hay thuật toán tồi thì không hướng nào ở đây cứu được — phải đi tối ưu truy vấn. Nếu là CPU-bound thì virtual thread vô ích vì nút thắt là số core, và số carrier thread cũng chỉ xấp xỉ số core. Nếu p99 tệ vì GC hay tranh chấp thì phải profile trước. Giả sử đã xác nhận là bệnh thứ nhất, tôi chọn virtual thread, và lý do là nó giữ được lối viết tuần tự: mã nghiệp vụ không đổi, stack trace vẫn đọc được, chỉ cơ chế thực thi đổi. Nhưng phải đặt kỳ vọng đúng và đây là điểm tôi sẽ nói rõ với đội: virtual thread sinh ra cho **scale chứ không phải speed** — một request đơn lẻ qua virtual thread không nhanh hơn một milliseconds nào so với thread nền tảng, query vẫn mất đúng từng ấy thời gian, thậm chí còn nhỉnh thêm chút chi phí mount và unmount. Cái được cải thiện là số request đồng thời một máy gánh được. Trước khi bật, việc bắt buộc là rà ghim: virtual thread bị ghim vào carrier và không unmount được khi nó block bên trong một khối `synchronized` hoặc đang trong lời gọi native, và khi đó ta quay lại đúng bệnh cũ. Điều đáng lưu ý là ghim thường không đến từ mã của mình mà từ thư viện — driver JDBC cũ hay connection pool cũ đầy `synchronized` — và đó chính là lý do nhiều đội bật virtual thread lên mà không thấy cải thiện gì. Nên tôi sẽ bật cờ theo dõi ghim rồi đo trước khi tuyên bố thành công. Reactive tôi chỉ chọn khi cần kiểm soát chi tiết áp lực ngược, vì nó đòi viết lại toàn tuyến và chỉ một tầng còn blocking là mất hết lợi ích. Còn tăng thread pool nền tảng thì vẫn là việc nên thử đầu tiên nếu trần hiện tại đặt quá thấp — rẻ nhất, và đôi khi đủ.",
    redFlags: [
      "Bật virtual thread để chữa một request vốn đã chậm, hoặc để chữa workload CPU-bound",
      "Hứa cải thiện độ trễ khi bật virtual thread — nó cho thông lượng, không cho độ trễ",
      "Bật virtual thread mà không rà `synchronized` trong thư viện đang dùng",
      "Chuyển sang reactive nửa tuyến rồi mong có lợi ích",
      "Bỏ qua phương án rẻ nhất là xem trần thread pool hiện tại có đặt quá thấp không",
    ],
    probes: [
      "Bạn phát hiện ghim bằng cách nào?",
      "Khi nào bạn kết luận virtual thread **không** phải câu trả lời?",
      "Vì sao reactive nửa tuyến lại mất hết lợi ích?",
    ],
    refs: ["java-05", "java-03"],
  },
  {
    id: "java-iq08",
    field: "java",
    topic: "java-blocking",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Dịch vụ treo cứng mỗi 2–3 ngày: không trả lời request nào, CPU 4%, không lỗi trong log. Thread dump cho thấy 200/200 worker thread ở `RUNNABLE` với stack trên cùng là `socketRead0`, tất cả cùng dẫn về một method gọi một API nội bộ. API đó vẫn đang chạy và trả lời các client khác bình thường trong 40ms.",
      scale: "6.000 request/giây bình thường. Lời gọi API nội bộ kia chỉ nằm trên một endpoint chiếm 3% lưu lượng. Khởi động lại là hết, nên đã sống 5 tháng.",
      constraints: "Không sửa được API nội bộ — thuộc đội khác và họ khẳng định dịch vụ của họ khoẻ, có số liệu chứng minh. Không tăng được số worker thread vì bộ nhớ container đã sát trần. Phải xử lý trong sprint này.",
      },
    question: "API kia khoẻ và trả lời trong 40ms, vậy vì sao 200 thread của ta đứng chờ đọc socket? Nêu chẩn đoán và cách sửa.",
    mustCover: [
      "`RUNNABLE` với `socketRead0` trên cùng nghĩa là thread nằm trong syscall **chờ dữ liệu về**, không phải đang chạy — CPU 4% khớp",
      "API kia khoẻ nhưng điều đó **không** loại trừ việc một số kết nối bị treo: nó nói về những request nó **nhận được**",
      "Giả thuyết mạnh nhất: kết nối bị đứt **im lặng** ở tầng giữa — thiết bị mạng hoặc NAT bỏ kết nối idle mà không gửi gói đóng",
      "Khi đó phía ta chờ dữ liệu mãi mãi vì **không có timeout đọc**, và không có gì đánh thức nó",
      "Tính tích luỹ giải thích chu kỳ 2–3 ngày: mỗi lần chỉ vài thread bị treo vĩnh viễn, dồn dần tới khi hết 200",
      "Cách sửa bắt buộc: đặt **timeout đọc** — nó biến treo vĩnh viễn thành lỗi hữu hạn quan sát được",
      "Cộng thêm trần số lời gọi đồng thời để một endpoint chiếm 3% lưu lượng không tiêu hết worker dùng chung",
    ],
    model: "Ba dữ kiện cùng khớp một chẩn đoán. Thứ nhất, `RUNNABLE` với `socketRead0` trên cùng stack nghĩa là thread đang nằm trong syscall chờ dữ liệu về; JVM báo `RUNNABLE` vì nó không biết gì về việc kernel đã đưa thread về trạng thái ngủ, nên CPU 4% không mâu thuẫn mà là bằng chứng khớp. Thứ hai, việc API kia khoẻ và trả lời client khác trong 40ms không loại trừ được gì cả, vì số liệu của họ nói về những request họ **nhận được**; nếu một kết nối bị đứt trên đường thì request đó không bao giờ đến, nên nó không xuất hiện trong bất kỳ metric nào của họ. Cả hai đội đều đang nói thật và cả hai đều đang nhìn nửa khác nhau của cùng một sự việc. Thứ ba, chu kỳ 2–3 ngày là dấu hiệu **tích luỹ**: nếu mỗi lần cả 200 thread cùng treo thì sự cố sẽ xảy ra trong vài phút, còn 2–3 ngày nghĩa là mỗi ngày chỉ vài thread bị treo vĩnh viễn rồi không bao giờ được trả lại. Giả thuyết mạnh nhất cho \"treo vĩnh viễn khi đọc socket\" là kết nối bị đứt im lặng ở tầng giữa — một thiết bị mạng hay NAT bỏ kết nối idle mà không gửi gói đóng cho bên nào. Phía ta vẫn tưởng kết nối còn sống và tiếp tục chờ dữ liệu, mà vì không có timeout đọc thì không có gì đánh thức nó; thread ấy bị mất khỏi pool cho tới khi tiến trình khởi động lại. Cách sửa cốt lõi rất rẻ và nằm hoàn toàn trong mã của ta: đặt timeout đọc. Nó không làm kết nối đứt biến mất, nhưng nó biến một treo vĩnh viễn thành một lỗi hữu hạn — thread được trả lại pool, lỗi xuất hiện trong log, và ta có metric để thấy vấn đề thay vì chờ dịch vụ treo. Đi kèm là timeout kết nối, và một trần cho số lời gọi đồng thời ra API đó, để một endpoint chiếm 3% lưu lượng về nguyên tắc không thể tiêu hết 200 worker dùng chung — đó là lỗi thiết kế thứ hai, độc lập với chuyện kết nối đứt. Nếu pool kết nối HTTP có cơ chế kiểm tra kết nối trước khi dùng và loại kết nối idle quá lâu thì bật cả hai, vì chúng chặn đúng nguồn gốc. Cuối cùng, tôi mang số liệu sang đội kia không để tranh luận ai sai mà để hỏi một câu cụ thể: giữa hai bên có thiết bị nào bỏ kết nối idle, và ngưỡng của nó là bao nhiêu.",
    redFlags: [
      "Kết luận API kia nói dối, hoặc ngược lại tin rằng họ khoẻ nghĩa là lỗi không ở đường mạng",
      "Đọc `RUNNABLE` là đang chạy rồi đi tìm nguyên nhân CPU",
      "Tăng số worker thread — ràng buộc đã cấm, và với lỗi tích luỹ thì nó chỉ dời chu kỳ từ 2 ngày sang 4 ngày",
      "Đặt lịch khởi động lại định kỳ và gọi đó là cách sửa",
      "Chỉ đặt timeout đọc mà không đặt trần đồng thời, để nguyên lỗi thiết kế thứ hai",
    ],
    probes: [
      "Vì sao chu kỳ 2–3 ngày lại là bằng chứng cho tính tích luỹ?",
      "Bạn chứng minh giả thuyết kết nối đứt im lặng bằng dữ liệu gì?",
      "Sau khi đặt timeout, bạn mong thấy metric nào xuất hiện?",
    ],
    refs: ["java-04", "java-02"],
  },

  // ===== java-vthread — Virtual threads (java-iq09–java-iq12) =====
  {
    id: "java-iq09",
    field: "java",
    topic: "java-vthread",
    level: 1,
    minutes: 5,
    question: "Virtual thread được mount và unmount lên carrier thread. Giải thích cơ chế đó, và nói nó đổi gì trong cách bạn đọc một thread dump.",
    mustCover: [
      "Virtual thread chạy bằng cách **mount** lên một carrier thread — vốn là một thread nền tảng trong một pool nhỏ cỡ số core",
      "Khi virtual thread gặp một điểm chờ mà runtime hiểu được, nó **unmount** và nhả carrier cho virtual thread khác dùng",
      "Nhờ vậy số virtual thread đồng thời không bị giới hạn bởi số thread OS, chỉ bởi bộ nhớ",
      "Nếu virtual thread **không unmount được** thì nó ghim carrier và ta mất đúng lợi ích ấy",
      "`jstack` thông thường **không** thấy virtual thread — nó chỉ thấy carrier thread",
      "Muốn dump virtual thread phải dùng `jcmd <PID> Thread.dump_to_file`",
    ],
    model: "Virtual thread không phải một thread OS. Nó chạy bằng cách mount lên một carrier thread — một thread nền tảng thật, lấy từ một pool nhỏ cỡ số core. Trong lúc mount, nó thực thi như mã bình thường. Khi nó gặp một điểm chờ mà runtime hiểu được — chẳng hạn một lời gọi I/O đã được viết lại để hợp tác với scheduler — thì thay vì để thread OS bị treo, runtime lưu lại stack của virtual thread, unmount nó khỏi carrier, và nhả carrier cho một virtual thread khác dùng. Khi dữ liệu về, virtual thread được mount lại, có thể lên một carrier khác, rồi chạy tiếp từ đúng chỗ đã dừng. Hệ quả là số virtual thread đồng thời không còn bị giới hạn bởi số thread OS mà chỉ bởi bộ nhớ, nên mô hình một thread một request lại khả thi ở bậc chục nghìn. Điều kiện để cơ chế này có lợi là virtual thread phải **unmount được**; nếu nó bị ghim vào carrier thì carrier bị giữ y như một thread nền tảng bị chặn, và ta mất đúng lợi ích mình vừa bỏ công để có. Về đọc thread dump thì có một thay đổi rất thực tế và dễ mất thời gian nếu không biết: `jstack` thông thường không thấy virtual thread, nó chỉ thấy các carrier thread — nên một dịch vụ có hàng nghìn virtual thread đang chờ sẽ cho ra một dump trông gần như trống, và rất dễ bị đọc thành \"hệ thống nhàn\". Muốn thấy virtual thread phải dùng `jcmd` với `Thread.dump_to_file`. Đây là loại chi tiết chỉ quan trọng vào lúc 2 giờ sáng, nhưng đúng lúc đó thì nó quyết định ta mất mười phút hay mất một tiếng.",
    redFlags: [
      "Mô tả virtual thread như một thread OS nhẹ hơn — bản chất là nó không phải thread OS",
      "Không biết `jstack` thông thường bỏ sót virtual thread",
      "Bỏ qua điều kiện unmount được, nên không giải thích được vì sao có trường hợp bật lên mà không cải thiện",
    ],
    probes: [
      "Số carrier thread mặc định xấp xỉ bao nhiêu, và vì sao lại là con số đó?",
      "Sau khi unmount rồi mount lại, virtual thread có nhất định lên đúng carrier cũ không?",
      "Một dump `jstack` trông trống rỗng trên dịch vụ dùng virtual thread nên được đọc thế nào?",
    ],
    refs: ["java-05", "java-04"],
  },
  {
    id: "java-iq10",
    field: "java",
    topic: "java-vthread",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Service
public class RateCache {

    private final Map<String, Rate> cache = new HashMap<>();

    // Được gọi trên mọi request, sau khi đã bật virtual threads cho tầng HTTP
    public synchronized Rate get(String pair) {         // (1)
        Rate r = cache.get(pair);
        if (r == null || r.isStale()) {
            r = rateClient.fetch(pair);                 // (2) gọi HTTP, ~120ms
            cache.put(pair, r);
        }
        return r;
    }
}`,
    },
    question: "Đội bật virtual thread cho tầng HTTP và thông lượng không tăng chút nào. Chỉ ra chính xác nguyên nhân trong đoạn mã này, rồi sửa.",
    mustCover: [
      "Lời gọi HTTP 120ms nằm **bên trong** khối `synchronized`, nên virtual thread bị **ghim** vào carrier và không unmount được",
      "Carrier thread bị giữ suốt 120ms, và số carrier chỉ xấp xỉ số core — nên trần đồng thời quay về đúng mức cũ",
      "Đó là lý do thông lượng không tăng: ta đã bật virtual thread nhưng vẫn bị chặn ở tầng carrier",
      "Còn một lỗi thứ hai độc lập: `synchronized` **tuần tự hoá** mọi lần đọc cache, kể cả những lần hit không cần gọi HTTP",
      "Sửa lỗi ghim: đổi `synchronized` sang `ReentrantLock`, vốn park được nên không ghim",
      "Sửa đúng bản chất hơn: đưa lời gọi HTTP **ra ngoài** vùng khoá, và dùng cấu trúc dữ liệu đồng thời cho cache",
      "Xác nhận bằng cờ theo dõi ghim thay vì đoán",
    ],
    model: "Nguyên nhân nằm ở quan hệ giữa dòng (1) và dòng (2): một lời gọi HTTP mất 120ms nằm bên trong một khối `synchronized`. Virtual thread bị ghim vào carrier khi nó block bên trong `synchronized`, nên trong suốt 120ms đó nó không unmount được và carrier thread bị giữ lại. Vì số carrier chỉ xấp xỉ số core, trần số request đồng thời quay về đúng mức của thread nền tảng — ta đã bỏ công bật virtual thread nhưng nút thắt chỉ dịch từ pool Tomcat sang pool carrier. Đây chính là lý do nhiều đội bật virtual thread lên rồi không thấy cải thiện gì, và thường thủ phạm còn nằm trong thư viện chứ không lộ ra như ở đây. Có một lỗi thứ hai độc lập với ghim, và nó tệ ngay cả khi không có virtual thread: `synchronized` trên toàn method khiến **mọi** lần đọc cache bị tuần tự hoá, kể cả những lần hit vốn chỉ cần đọc một map. Nên đoạn mã này vừa ghim carrier vừa tự tạo một điểm tắc. Sửa theo hai mức. Mức tối thiểu, gỡ ghim: đổi `synchronized` sang `ReentrantLock` vì nó dùng `park()` nên virtual thread unmount được, carrier được nhả trong lúc chờ HTTP. Mức đúng bản chất, tôi làm cả hai việc: đưa lời gọi HTTP ra ngoài vùng khoá — tính toán giá trị mới rồi mới đặt vào cache — và thay `HashMap` bọc khoá bằng một cấu trúc dữ liệu đồng thời để đường hit không phải xếp hàng chờ ai. Khi đó nhiều request cùng cần một cặp tỉ giá hết hạn có thể cùng gọi HTTP, nên nếu muốn tránh gọi trùng thì dùng một cơ chế tính-một-lần theo khoá thay vì một khoá toàn cục. Cuối cùng, tôi không tuyên bố đã sửa dựa trên suy luận: bật cờ theo dõi ghim và chạy lại tải để xác nhận số lần ghim về không, rồi đo thông lượng.",
    redFlags: [
      "Kết luận \"virtual thread chưa trưởng thành\" thay vì tìm chỗ ghim",
      "Tăng số carrier thread để chữa — đối phó triệu chứng, và bỏ mất chính lợi ích của cơ chế",
      "Chỉ đổi `synchronized` sang `ReentrantLock` mà để nguyên lời gọi HTTP trong vùng khoá, nên vẫn tuần tự hoá mọi request",
      "Tuyên bố đã sửa mà không bật cờ theo dõi ghim để xác nhận",
    ],
    probes: [
      "Ngoài `synchronized`, còn trường hợp nào làm virtual thread bị ghim?",
      "Nếu thủ phạm nằm trong driver JDBC thì bạn làm gì?",
      "Sau khi đưa lời gọi HTTP ra ngoài vùng khoá, bạn tránh gọi trùng bằng cách nào?",
    ],
    refs: ["java-05"],
  },
  {
    id: "java-iq11",
    field: "java",
    topic: "java-vthread",
    level: 3,
    minutes: 10,
    question: "Sau khi bật virtual thread, giới hạn số request đồng thời không còn do thread pool quy định nữa. Bạn giới hạn bằng gì, và vì sao phải giới hạn?",
    tradeoffs: [
      {
        option: "Semaphore đặt ở các đường gọi ra ngoài",
        when: "Lựa chọn mặc định của tôi. Giới hạn đặt đúng chỗ tài nguyên thật bị giới hạn — connection pool, API đối tác, một dịch vụ nội bộ có trần — và mỗi đường có trần riêng nên một phụ thuộc hỏng không tiêu năng lực của phụ thuộc khác.",
      },
      {
        option: "Giữ một trần ở tầng vào, trên tổng số request đồng thời",
        when: "Khi cần bảo vệ bộ nhớ và cần một con số duy nhất dễ hiểu để vận hành. Đơn giản, nhưng thô: nó không phân biệt request nặng với request nhẹ, nên hoặc đặt thấp mà bỏ phí năng lực, hoặc đặt cao mà không bảo vệ được tài nguyên nào cụ thể.",
      },
      {
        option: "Không giới hạn, để tài nguyên bên dưới tự chặn",
        when: "Gần như không bao giờ. Nó nghe hợp lý vì connection pool cũng có trần, nhưng hàng đợi chờ trước pool là **không giới hạn**, nên quá tải biến thành hàng đợi dài vô tận và cạn bộ nhớ thay vì thành từ chối sớm.",
      },
    ],
    mustCover: [
      "Trước đây kích thước thread pool là một **giới hạn ngầm** mà không ai khai ra — bật virtual thread là bỏ mất nó",
      "Phải giới hạn vì các tài nguyên bên dưới **vẫn** có trần: connection pool, API đối tác, bộ nhớ",
      "Giới hạn nên đặt **tường minh** và đặt đúng chỗ tài nguyên bị giới hạn, không đặt ngầm qua kích thước pool",
      "Trần riêng cho từng đường gọi ra ngoài cho **cô lập lỗi**: một phụ thuộc hỏng không tiêu năng lực của các phụ thuộc khác",
      "Không giới hạn gì thì quá tải biến thành **hàng đợi dài vô tận** và cạn bộ nhớ, thay vì từ chối sớm",
      "Từ chối sớm là hành vi **tốt hơn** khi quá tải, vì nó cho client biết ngay thay vì để họ chờ rồi timeout",
    ],
    model: "Điểm phải nhận ra trước tiên là kích thước thread pool trước đây đóng một vai mà không ai khai ra: nó là giới hạn ngầm cho số việc đồng thời trong toàn hệ thống. Với 200 worker thì không bao giờ có quá 200 truy vấn, quá 200 lời gọi ra ngoài, quá 200 bản ghi đang được xử lý trong bộ nhớ. Bật virtual thread là bỏ mất giới hạn đó, và tài nguyên bên dưới thì vẫn có trần như cũ — connection pool vẫn 20 connection, API đối tác vẫn chịu được một mức nhất định, bộ nhớ container vẫn có hạn. Nên câu hỏi không phải có nên giới hạn hay không mà là giới hạn ở đâu. Tôi chọn đặt semaphore ở từng đường gọi ra ngoài, vì nó đặt giới hạn đúng chỗ tài nguyên thật bị giới hạn, và vì nó cho cô lập lỗi: mỗi phụ thuộc có trần riêng nên khi một API đối tác treo, chỉ số permit của nó bị chiếm hết, các đường khác vẫn chạy — đúng thứ mà một trần dùng chung không làm được. Một trần ở tầng vào trên tổng số request đồng thời vẫn hữu ích như lớp bảo vệ bộ nhớ và như một con số dễ hiểu để vận hành, nên tôi thường có cả hai, nhưng tôi không dựa vào nó làm cơ chế chính vì nó thô: nó không phân biệt một request nhẹ với một request gọi bốn dịch vụ, nên đặt thấp thì bỏ phí năng lực, đặt cao thì chẳng bảo vệ được tài nguyên nào cụ thể. Phương án \"không giới hạn, để tài nguyên bên dưới tự chặn\" nghe hợp lý nhưng sai ở một chỗ quyết định: connection pool có trần về số connection nhưng hàng đợi chờ trước nó thường không có trần, nên quá tải không biến thành từ chối mà biến thành một hàng đợi dài vô tận cộng bộ nhớ bị ăn dần — và khi nó đổ thì đổ theo cách khó chẩn đoán nhất. Nguyên tắc tôi giữ là khi quá tải, từ chối sớm tốt hơn chờ lâu: client biết ngay để thử lại hoặc hạ cấp, thay vì chờ tới timeout rồi vẫn thất bại sau khi ta đã tiêu tài nguyên cho họ.",
    redFlags: [
      "Không nhận ra kích thước thread pool từng là một giới hạn ngầm",
      "Dựa vào trần của connection pool để tự chặn, bỏ qua việc hàng đợi chờ trước nó không có trần",
      "Dùng một trần dùng chung duy nhất nên một phụ thuộc hỏng tiêu hết năng lực của mọi phụ thuộc",
      "Coi việc từ chối request khi quá tải là thất bại cần tránh bằng mọi giá",
    ],
    probes: [
      "Bạn chọn giá trị permit cho semaphore ở đường gọi database thế nào?",
      "Vì sao trần dùng chung không cho cô lập lỗi?",
      "Client nên làm gì khi bị từ chối sớm, và bạn báo cho họ bằng cách nào?",
    ],
    refs: ["java-05", "java-08"],
  },
  {
    id: "java-iq12",
    field: "java",
    topic: "java-vthread",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Sau khi bật virtual thread, dịch vụ chịu được 4 lần lưu lượng như kỳ vọng. Nhưng ba tuần sau, một đợt tăng tải làm dịch vụ cạn bộ nhớ và bị kernel giết, trong khi trước đây cùng mức tải chỉ làm request chậm lại rồi tự hồi. Connection pool vẫn để 20 như cũ.",
      scale: "Nền 2.000 request/giây, đợt tăng lên 9.000 trong 4 phút. Trước khi bật virtual thread, pool Tomcat là 200 thread. Container 2Gi.",
      constraints: "Không được quay lại thread nền tảng — đã có ba dịch vụ khác chuyển theo mô hình này. Không tăng được bộ nhớ container. Phải giữ được năng lực gấp 4 đã đạt, không đánh đổi nó để lấy ổn định.",
      },
    question: "Vì sao cùng mức tải mà trước đây chỉ chậm còn giờ thì chết? Nêu chẩn đoán và cách sửa giữ được năng lực gấp 4.",
    mustCover: [
      "Trước đây pool 200 thread là một **giới hạn ngầm**: quá tải biến thành hàng đợi ở tầng vào và request chỉ **chậm**",
      "Bật virtual thread bỏ mất giới hạn đó, nên 9.000 request đồng thời đều được **nhận vào** và mỗi cái chiếm bộ nhớ",
      "Bộ nhớ bị ăn bởi stack của virtual thread cộng **toàn bộ object trong phạm vi mỗi request** đang xử lý dở",
      "Chế độ hỏng đổi từ \"chậm rồi hồi\" sang \"cạn bộ nhớ rồi chết\" — đổi từ **suy giảm mềm** sang **đổ sập**",
      "Connection pool 20 không chặn được gì vì hàng đợi chờ connection **không có trần** — 9.000 request cùng xếp hàng ở đó",
      "Sửa mà giữ năng lực: đặt trần **tường minh** cho số request đồng thời và cho từng đường gọi ra ngoài, ở mức cao hơn 200 nhiều nhưng hữu hạn",
      "Trần đó phải suy từ **ngân sách bộ nhớ** chia cho bộ nhớ mỗi request đang xử lý, không đặt theo cảm giác",
    ],
    model: "Câu trả lời nằm ở việc chế độ hỏng đã đổi, và nó đổi vì ta vô tình bỏ một cơ chế bảo vệ mà không ai khai ra. Trước đây pool 200 thread là một giới hạn ngầm: khi 9.000 request đến, chỉ 200 được xử lý cùng lúc, phần còn lại xếp hàng ở tầng vào; bộ nhớ đang dùng tỉ lệ với 200 request đang xử lý, và triệu chứng là request chậm lại rồi tự hồi khi đỉnh qua — một sự suy giảm mềm. Bật virtual thread bỏ mất trần đó, nên giờ cả 9.000 request đều được nhận vào và cùng tồn tại: mỗi cái có stack của virtual thread, và quan trọng hơn là mỗi cái giữ toàn bộ object trong phạm vi xử lý của nó — bản ghi đã nạp, DTO đang dựng, bộ đệm đang ghi. Nhân với 9.000 thì vượt 2Gi, và tiến trình bị kernel giết. Chế độ hỏng chuyển từ suy giảm mềm sang đổ sập, và đó là điều nghiêm trọng hơn cả bản thân sự cố. Connection pool 20 không cứu được gì, và đây là chỗ dễ hiểu sai nhất: pool có trần về số connection nhưng hàng đợi chờ connection thì không có trần, nên 9.000 request không bị từ chối mà cùng nằm chờ — mỗi cái vẫn chiếm đủ bộ nhớ của nó trong lúc chờ. Nói cách khác trần của pool giới hạn công việc **đang chạy** chứ không giới hạn công việc **đã nhận**. Cách sửa giữ được năng lực gấp 4 là thay giới hạn ngầm bằng giới hạn tường minh, nhưng đặt ở mức cao hơn 200 rất nhiều: tôi suy trần từ ngân sách bộ nhớ chia cho lượng bộ nhớ trung bình một request đang xử lý chiếm — đo bằng profiling chứ không đoán — rồi lấy một phần của con số đó làm trần số request đồng thời ở tầng vào. Nếu mỗi request chiếm chừng 200KB thì vài nghìn request đồng thời vẫn nằm trong ngân sách, tức ta giữ được phần lớn năng lực gấp 4 mà vẫn có điểm dừng. Kèm theo là semaphore riêng cho từng đường gọi ra ngoài, gồm cả đường xuống database, để hàng đợi chờ connection không còn là hàng đợi vô tận. Và khi trần bị đạt thì hành vi phải là từ chối sớm với mã lỗi rõ ràng, vì trong quá tải thì cho client biết ngay tốt hơn là để họ chờ rồi vẫn thất bại.",
    redFlags: [
      "Quay lại thread nền tảng — ràng buộc đã cấm, và nó là bỏ năng lực để mua lại một cơ chế bảo vệ vốn có thể khai tường minh",
      "Đặt trần mới bằng 200 cho \"giống như cũ\" — đánh đổi hết năng lực gấp 4 đã đạt",
      "Tin rằng connection pool 20 tự chặn được, bỏ qua hàng đợi chờ không có trần",
      "Tăng bộ nhớ container — ràng buộc đã cấm, và nó chỉ dời ngưỡng đổ sập",
      "Đặt trần theo cảm giác thay vì suy từ ngân sách bộ nhớ chia cho bộ nhớ mỗi request",
    ],
    probes: [
      "Bạn đo bộ nhớ trung bình một request đang xử lý chiếm bằng cách nào?",
      "Vì sao trần của connection pool không giới hạn được công việc đã nhận?",
      "Khi đạt trần, dịch vụ nên trả về gì và client nên làm gì?",
    ],
    refs: ["java-05", "java-08"],
  },

  // ===== java-tomcat — Tomcat thread pool và sizing (java-iq13–java-iq16) =====
  {
    id: "java-iq13",
    field: "java",
    topic: "java-tomcat",
    level: 1,
    minutes: 6,
    question: "Tomcat thread pool là một `ThreadPoolExecutor` với ba con số cấu hình. Kể chúng, và giải thích vì sao hành vi nạp task của Tomcat **ngược** với `ThreadPoolExecutor` chuẩn.",
    mustCover: [
      "Ba con số là số thread tối thiểu giữ thường trực, số thread tối đa, và dung lượng hàng đợi task",
      "`ThreadPoolExecutor` chuẩn: đầy thread lõi thì **đưa vào hàng đợi trước**, chỉ mở thêm thread khi hàng đợi **đã đầy**",
      "Với hàng đợi lớn thì hành vi chuẩn đó nghĩa là thread tối đa gần như **không bao giờ** được dùng tới",
      "Tomcat đảo lại bằng cách can thiệp vào `offer()` của hàng đợi: nó **từ chối nhận** khi còn chỗ mở thread mới",
      "Nhờ vậy pool **mở thread tới trần trước**, rồi mới xếp hàng — đúng thứ một web server cần",
      "Hệ quả cấu hình: hàng đợi lớn kết hợp pool chuẩn là cái bẫy; hiểu mánh này mới đặt được ba con số có nghĩa",
    ],
    model: "Ba con số là số thread giữ thường trực, số thread tối đa, và dung lượng hàng đợi task. Chỗ đáng nói là hành vi nạp task, vì nó phản trực giác. `ThreadPoolExecutor` chuẩn của Java xử lý theo thứ tự: nếu số thread chưa đạt mức lõi thì tạo thread mới; nếu đã đạt thì **đưa task vào hàng đợi**; chỉ khi hàng đợi đã đầy nó mới mở thêm thread cho tới trần tối đa. Thứ tự đó hợp lý cho một pool tính toán, nhưng với một web server thì nó gây hậu quả kỳ lạ: nếu hàng đợi được đặt lớn — mà mặc định thường lớn — thì hàng đợi gần như không bao giờ đầy, nên số thread tối đa gần như không bao giờ được dùng tới. Ta cấu hình trần 200 thread rồi thấy hệ thống chỉ dùng 10, trong khi request xếp hàng chờ. Tomcat giải quyết bằng cách can thiệp đúng vào điểm quyết định: nó dùng một hàng đợi riêng mà phương thức nhận task được viết lại để **từ chối nhận** khi pool còn chỗ mở thread mới. Executor thấy hàng đợi từ chối thì hiểu là hàng đợi đầy, nên nó mở thread mới — và cứ thế cho tới khi đạt trần tối đa. Chỉ khi đã đạt trần thì hàng đợi mới thật sự nhận task. Kết quả là thứ tự đảo lại: mở thread tới trần trước, xếp hàng sau, đúng thứ một web server cần vì mỗi request đang chờ là một người dùng đang chờ. Hiểu mánh này là điều kiện để đặt ba con số có nghĩa: nếu không biết, ta sẽ đọc sai hành vi của pool và đi chỉnh sai tham số.",
    redFlags: [
      "Mô tả hành vi của `ThreadPoolExecutor` chuẩn rồi áp thẳng cho Tomcat",
      "Cho rằng tăng số thread tối đa luôn có tác dụng, không biết hàng đợi có thể vô hiệu hoá nó",
      "Không nêu được vì sao một web server cần thứ tự ngược lại",
    ],
    probes: [
      "Nếu dùng `ThreadPoolExecutor` chuẩn với hàng đợi 10.000 và trần 200 thread thì chuyện gì xảy ra?",
      "Hàng đợi task nên đặt lớn hay nhỏ, và nó đổi chế độ hỏng thế nào?",
      "Bạn quan sát số thread đang hoạt động của Tomcat bằng gì?",
    ],
    refs: ["java-06"],
  },
  {
    id: "java-iq14",
    field: "java",
    topic: "java-tomcat",
    level: 2,
    minutes: 8,
    code: {
      lang: "yaml",
      text: `# Cấu hình của một dịch vụ sau khi đội "tối ưu để chịu tải"
server:
  tomcat:
    threads:
      max: 4000              # "để không bao giờ bị từ chối"
      min-spare: 4000
    accept-count: 20000      # hàng đợi task rất lớn
    connection-timeout: 300000

# Container: cpu limit 2, memory limit 2Gi
# Đo được: mỗi request ~50ms giữ connection DB, ~55ms tổng
# Hikari maximum-pool-size: 20`,
    },
    question: "Cấu hình này làm thông lượng **giảm** so với trước khi \"tối ưu\". Chỉ ra từng lỗi và giải thích cơ chế, rồi đưa ra bộ số bạn chọn.",
    mustCover: [
      "4000 thread trên 2 core: phần lớn thời gian CPU đi vào **context switch** thay vì công việc hữu ích",
      "4000 thread cũng ăn bộ nhớ stack đáng kể, trên container 2Gi thì đó là rủi ro bị kernel giết",
      "`min-spare` bằng `max` nghĩa là **giữ thường trực** 4000 thread ngay cả khi nhàn — trả giá mà không nhận gì",
      "Hàng đợi 20.000 cộng timeout 300 giây nghĩa là request chờ **rất lâu** rồi mới được xử lý, khi client đã bỏ đi",
      "Trần thật không phải số thread mà là **connection pool 20**: hơn 20 request cùng cần database thì phần còn lại xếp hàng",
      "Bộ số đúng phải suy từ số core và tỉ lệ chờ trên tính, rồi **đối chiếu** với connection pool cho nhất quán",
      "\"Không bao giờ bị từ chối\" là mục tiêu sai: từ chối sớm tốt hơn chờ 300 giây rồi vẫn thất bại",
    ],
    model: "Cấu hình này sai ở cả bốn con số, và chúng sai theo cách cộng dồn. Thứ nhất, 4000 thread trên container 2 core: số thread vượt xa mức song song thật, nên phần lớn thời gian CPU đi vào việc chuyển ngữ cảnh giữa các thread thay vì làm việc hữu ích — đây chính là cơ chế làm thông lượng **giảm** sau khi \"tối ưu\". Thứ hai, 4000 thread ăn bộ nhớ stack đáng kể, và trên container 2Gi thì nó vừa lấn heap vừa đẩy tiến trình tới nguy cơ bị kernel giết. Thứ ba, `min-spare` bằng `max` nghĩa là giữ thường trực toàn bộ 4000 thread kể cả lúc nhàn — trả giá bộ nhớ và lập lịch mà không nhận lại gì. Thứ tư, hàng đợi 20.000 cộng timeout kết nối 300 giây tạo ra chế độ hỏng tệ nhất: không ai bị từ chối, nhưng request nằm chờ hàng chục giây tới vài phút rồi mới được xử lý, lúc đó client đã bỏ đi từ lâu — ta tiêu tài nguyên để trả lời những câu không còn ai nghe. Và điều quan trọng nhất mà cấu hình này bỏ qua hoàn toàn: trần thật của hệ thống không phải số thread mà là connection pool 20. Mỗi request giữ connection 50ms trong tổng 55ms, nên gần như mọi thread đều cần database; quá 20 thread thì phần còn lại chỉ xếp hàng chờ connection chứ không làm gì. Nuôi 4000 thread cho một hệ thống chỉ chạy được 20 việc song song là định nghĩa của việc chỉnh sai chỗ. Bộ số tôi chọn thì suy từ dưới lên: với 2 core và tỉ lệ chờ trên tổng là 50 trên 55, mức song song hữu ích chỉ ở bậc vài chục — nên tôi đặt số thread tối đa ở bậc đó, cho `min-spare` nhỏ hơn nhiều để pool co giãn được, giữ hàng đợi ở mức vừa đủ hấp thụ đỉnh ngắn chứ không phải vài chục nghìn, và hạ timeout kết nối xuống mức có nghĩa với client. Quan trọng hơn cả các con số là đổi mục tiêu: \"không bao giờ bị từ chối\" là mục tiêu sai, vì từ chối sớm cho client biết ngay để thử lại, còn chờ 300 giây rồi vẫn thất bại thì tệ cho cả hai bên.",
    redFlags: [
      "Chỉ nói \"4000 thread là quá nhiều\" mà không nêu cơ chế context switch và không nhắc connection pool 20 là trần thật",
      "Đề nghị nâng connection pool lên 4000 cho khớp số thread",
      "Giữ mục tiêu \"không bao giờ từ chối request\" làm tiêu chí thiết kế",
      "Bỏ qua việc `min-spare` bằng `max` nên chi phí bị trả cả lúc nhàn",
    ],
    probes: [
      "Vì sao nuôi nhiều thread hơn mức song song thật lại làm thông lượng giảm chứ chỉ là không tăng?",
      "Bạn chọn dung lượng hàng đợi theo tiêu chí nào?",
      "Nếu nâng connection pool lên 200 thì chuyện gì xảy ra ở phía database?",
    ],
    refs: ["java-07", "java-06"],
  },
  {
    id: "java-iq15",
    field: "java",
    topic: "java-tomcat",
    level: 3,
    minutes: 10,
    question: "Bạn cần bảo vệ một dịch vụ khỏi quá tải. Đặt \"cái van\" ở tầng nào, và phân biệt giới hạn đồng thời với giới hạn tốc độ.",
    tradeoffs: [
      {
        option: "Giới hạn **đồng thời** — bulkhead, số việc chạy cùng lúc",
        when: "Khi tài nguyên bị giới hạn là **số việc song song**: connection, thread, bộ nhớ cho request đang xử lý. Nó tự điều tiết theo độ chậm của hệ thống — hệ thống chậm đi thì số việc đồng thời đạt trần sớm hơn, nên nó phản ứng đúng ngay cả khi ta không đo lại gì.",
      },
      {
        option: "Giới hạn **tốc độ** — rate limit, số request mỗi giây",
        when: "Khi cần thực thi một hợp đồng về mức dùng: hạn mức theo khách hàng, chống lạm dụng, phân bổ công bằng giữa nhiều bên. Nó **không** tự điều tiết theo độ chậm — 1.000 request mỗi giây vẫn được cho qua dù hệ thống đang chậm gấp mười.",
      },
      {
        option: "Cả hai, ở hai tầng khác nhau",
        when: "Cấu hình tôi dùng thực tế: rate limit ở biên theo từng khách hàng để bảo vệ tính công bằng, và bulkhead ở trong theo từng phụ thuộc để bảo vệ tài nguyên. Hai cái giải hai bài, không thay nhau được.",
      },
    ],
    mustCover: [
      "Hai khái niệm **khác trục**: một cái đếm việc **đang chạy**, cái kia đếm việc **đến trong một đơn vị thời gian**",
      "Giới hạn đồng thời **tự điều tiết** theo độ chậm của hệ thống; giới hạn tốc độ thì không",
      "Vì vậy để bảo vệ tài nguyên thì bulkhead đúng hơn; để thực thi hạn mức thì rate limit đúng hơn",
      "Bulkhead nên đặt **theo từng phụ thuộc** để một phụ thuộc hỏng không tiêu năng lực của các phụ thuộc khác",
      "Đặt van ở biên rẻ hơn nhưng thô hơn; đặt van ở trong chính xác hơn nhưng request đã tiêu tài nguyên để đi tới đó",
      "Khi van đóng, hành vi phải là **từ chối sớm** với tín hiệu rõ ràng để client biết đường xử lý",
    ],
    model: "Hai khái niệm này bị dùng lẫn rất thường xuyên, nhưng chúng ở hai trục khác nhau: giới hạn đồng thời đếm số việc **đang chạy** tại một thời điểm, còn giới hạn tốc độ đếm số việc **đến** trong một đơn vị thời gian. Khác biệt quan trọng nhất suy ra từ đó: giới hạn đồng thời tự điều tiết theo độ chậm của hệ thống. Nếu database chậm đi gấp ba, mỗi việc giữ chỗ lâu hơn gấp ba nên trần đồng thời đạt sớm hơn và hệ thống tự giảm nhận việc — không cần ai đo lại gì. Giới hạn tốc độ thì mù với điều đó: 1.000 request mỗi giây vẫn được cho qua dù hệ thống đang chậm gấp mười, nên nó không bảo vệ được tài nguyên. Từ đó ra nguyên tắc chọn: bảo vệ tài nguyên thì dùng giới hạn đồng thời, thực thi hợp đồng về mức dùng thì dùng giới hạn tốc độ. Và vì hai cái giải hai bài khác nhau nên trong thực tế tôi dùng cả hai ở hai tầng: rate limit ở biên theo từng khách hàng, để một khách hàng chạy job đồng bộ không chiếm hết năng lực của những khách hàng khác — đây là bài toán công bằng; và bulkhead ở trong theo từng phụ thuộc, để khi một API đối tác treo thì chỉ phần năng lực dành cho nó bị chiếm. Về chỗ đặt van thì có một đánh đổi thật: đặt ở biên rẻ hơn vì request bị chặn trước khi tiêu tài nguyên, nhưng thô hơn vì ở đó ta chưa biết request này sẽ chạm những phụ thuộc nào; đặt ở trong chính xác hơn nhưng request đã tiêu một phần tài nguyên để đi tới đó. Cuối cùng, hành vi khi van đóng quan trọng không kém bản thân cái van: phải từ chối sớm với một tín hiệu rõ ràng — mã lỗi đúng, kèm chỉ dẫn về thời điểm thử lại — để client biết đường xử lý thay vì chờ rồi timeout.",
    redFlags: [
      "Dùng rate limit để bảo vệ tài nguyên, không nhận ra nó mù với độ chậm của hệ thống",
      "Đặt một bulkhead dùng chung cho mọi phụ thuộc nên mất khả năng cô lập lỗi",
      "Chỉ đặt van mà không định nghĩa hành vi khi van đóng",
      "Coi hai cơ chế là hai cách làm cùng một việc và chọn một",
    ],
    probes: [
      "Database chậm gấp ba — hai cơ chế phản ứng khác nhau thế nào?",
      "Bạn chọn giá trị cho một bulkhead ở đường gọi database bằng cách nào?",
      "Client nên đọc tín hiệu từ chối của bạn thế nào để không làm sự cố nặng hơn?",
    ],
    refs: ["java-06"],
  },
  {
    id: "java-iq16",
    field: "java",
    topic: "java-tomcat",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một dịch vụ được chuyển từ máy ảo 8 core sang container với `cpu limit` 2. Sau khi chuyển, thông lượng giảm 40% dù cấu hình ứng dụng không đổi, và độ trễ p99 tăng gấp ba. Đội đã thử tăng `cpu limit` lên 4 và chỉ cải thiện được 10%.",
      scale: "Trước: 1.100 request/giây trên mỗi máy ảo. Sau: 660 request/giây mỗi container. Đã chuyển 30 dịch vụ theo cùng cách và nhiều dịch vụ có cùng triệu chứng.",
      constraints: "Không quay lại máy ảo — việc chuyển sang container là chương trình toàn công ty. Ngân sách CPU toàn cụm đã chốt nên không thể nâng limit cho cả 30 dịch vụ. Phải đưa ra hướng dẫn dùng lại được cho 29 dịch vụ kia, không chỉ sửa một cái.",
      },
    question: "Vì sao cấu hình không đổi mà thông lượng giảm, và vì sao tăng CPU limit chỉ giúp được 10%? Nêu hướng dẫn dùng lại được.",
    mustCover: [
      "JVM và các thư viện chọn nhiều tham số mặc định theo **số core quan sát được** — số thread GC, kích thước một số pool, mức song song của fork/join",
      "Trong container, số core JVM thấy có thể **không khớp** với `cpu limit` thật nếu không cấu hình đúng — đây là biến số hay bị quên nhất",
      "Nếu JVM vẫn thấy 8 core trong khi chỉ được dùng 2, nó cấu hình cho một máy rộng hơn thực tế: quá nhiều thread trên quá ít CPU",
      "Hệ quả là **tiết chế CPU** cộng context switch — thông lượng giảm và độ trễ đuôi tăng, đúng triệu chứng",
      "Tăng limit từ 2 lên 4 chỉ cải thiện 10% vì nó **không sửa** sai lệch giữa số core quan sát được và số core thật",
      "Hướng dẫn dùng lại được: bảo đảm JVM đọc đúng giới hạn container, rồi **suy lại** các con số sizing theo số core thật",
      "Và phải **đo lại** từng dịch vụ sau khi sửa, vì mỗi dịch vụ có tỉ lệ chờ trên tính khác nhau",
    ],
    model: "Cụm từ \"cấu hình ứng dụng không đổi\" chính là gốc rễ, vì cấu hình đúng cho 8 core là cấu hình sai cho 2 core — và tệ hơn, một phần cấu hình không nằm trong tay ta mà do JVM và thư viện tự chọn theo số core chúng quan sát được. Số thread GC, mức song song của fork/join, kích thước mặc định của vài pool đều suy từ con số đó. Nên nếu JVM vẫn thấy 8 core trong khi cgroup chỉ cho dùng 2, nó sẽ cấu hình cho một máy rộng gấp bốn thực tế: nhiều thread GC hơn mức CPU cho phép, mức song song cao hơn thực tế. Kết quả là tiết chế CPU cộng chi phí chuyển ngữ cảnh, và biểu hiện đúng như quan sát — thông lượng giảm, độ trễ đuôi tăng mạnh hơn cả thông lượng vì hàng đợi nội bộ dài ra. Đây là biến số hay bị quên nhất khi đếm core trong thế giới container. Việc tăng limit từ 2 lên 4 mà chỉ cải thiện 10% là bằng chứng xác nhận, không phải bằng chứng phản bác: nếu vấn đề thuần là thiếu CPU thì gấp đôi CPU phải cho cải thiện gần gấp đôi; chỉ 10% nghĩa là nút thắt nằm ở sai lệch giữa cấu hình và tài nguyên, và sai lệch đó vẫn còn nguyên khi ta chỉ đổi một phía. Hướng dẫn dùng lại được cho cả 30 dịch vụ gồm ba bước, xếp theo thứ tự bắt buộc. Bước một, kiểm chứng số core mà JVM thật sự quan sát được ở bên trong container và đối chiếu với `cpu limit`; đây là bước chẩn đoán rẻ nhất và nên là mục đầu tiên trong bất kỳ danh mục kiểm tra chuyển container nào. Bước hai, bảo đảm JVM đọc đúng giới hạn cgroup, để mọi mặc định suy theo số core đều tự khớp — riêng bước này có thể lấy lại phần lớn thông lượng đã mất mà không tốn thêm CPU nào. Bước ba, suy lại các con số sizing do ta tự đặt — số worker thread, connection pool — theo số core thật và theo tỉ lệ chờ trên tính của từng dịch vụ. Bước ba không thể làm chung cho cả 30 dịch vụ vì tỉ lệ chờ trên tính khác nhau, nên hướng dẫn phải nói rõ: bước một và hai là công thức chung, bước ba là phép đo riêng cho từng dịch vụ, và tiêu chí nghiệm thu là thông lượng cùng p99 so với mốc trên máy ảo.",
    redFlags: [
      "Kết luận container chậm hơn máy ảo về bản chất",
      "Tiếp tục nâng `cpu limit` — việc gấp đôi CPU chỉ cho 10% đã loại giả thuyết thiếu CPU",
      "Đưa ra một bộ số cố định áp cho cả 30 dịch vụ, bỏ qua việc tỉ lệ chờ trên tính khác nhau",
      "Chỉnh tham số GC bằng tay trước khi sửa việc JVM đọc sai số core",
      "Bỏ qua việc kiểm chứng số core JVM quan sát được — bước chẩn đoán rẻ nhất",
    ],
    probes: [
      "Bạn kiểm chứng số core JVM quan sát được bên trong container bằng cách nào?",
      "Những mặc định nào của JVM suy theo số core?",
      "Vì sao độ trễ p99 tăng mạnh hơn tỉ lệ thông lượng giảm?",
    ],
    refs: ["java-07"],
  },

  // ===== java-pool — Connection pool sizing (java-iq17–java-iq20) =====
  {
    id: "java-iq17",
    field: "java",
    topic: "java-pool",
    level: 1,
    minutes: 6,
    question: "Vì sao tăng số connection lại có thể làm database **chậm đi**? Nêu các loại chi phí mà connection thừa bắt database trả.",
    mustCover: [
      "Khi số connection đang thực thi vượt **khả năng song song thật** của database, connection thừa không giúp gì",
      "Chi phí thứ nhất: **chuyển ngữ cảnh** — mỗi tiến trình hoặc thread của database tranh nhau ít core, đúng bệnh quá nhiều thread nhưng diễn ra trên máy database",
      "Chi phí thứ hai: **tranh chấp tài nguyên chung** — lock manager, buffer pool, WAL; càng đông kẻ tranh thì phần xếp hàng nội bộ trong mỗi truy vấn càng dài",
      "Chi phí thứ ba: **bộ nhớ** — với PostgreSQL mỗi connection là một tiến trình có overhead riêng, nên trăm connection nhàn vẫn ăn RAM đáng kể",
      "Kết quả thực nghiệm đáng nhớ: **thu nhỏ** pool kéo thời gian phản hồi từ khoảng 100ms xuống khoảng 2ms",
      "Nguyên tắc rút ra: muốn một pool **nhỏ và bão hoà** với thread xếp hàng chờ connection, hơn là pool phình to với hàng trăm connection đạp nhau",
    ],
    model: "Trực giác \"nhiều connection thì xử lý được nhiều\" sai vì nó giả định database mở rộng tuyến tính theo số connection, mà thực tế database có một mức song song thật bị giới hạn bởi số core và bởi tốc độ đĩa. Khi số connection đang thực thi vượt mức đó, những connection thừa không giúp gì mà bắt database trả ba loại thuế. Thuế thứ nhất là chuyển ngữ cảnh: mỗi tiến trình hoặc thread của database tranh nhau ít core, đúng căn bệnh quá nhiều thread mà ta gặp ở tầng ứng dụng, chỉ lần này nó diễn ra trên máy database. Thuế thứ hai là tranh chấp các tài nguyên dùng chung bên trong database — lock manager, buffer pool, WAL; càng đông kẻ tranh thì phần thời gian xếp hàng nội bộ trong mỗi truy vấn càng dài, nên mỗi truy vấn tự nó chậm đi dù không có gì đổi ở kế hoạch thực thi. Thuế thứ ba là bộ nhớ: với PostgreSQL mỗi connection là một tiến trình riêng với vùng làm việc và cache catalog của nó, nên hàng trăm connection nhàn rỗi vẫn ăn RAM đáng kể — và RAM đó lẽ ra nên dành cho buffer pool. Con số đáng nhớ nhất là kết quả thực nghiệm của nhóm Oracle Real-World Performance: thu nhỏ pool kéo thời gian phản hồi từ khoảng 100ms xuống khoảng 2ms, tức nhanh hơn khoảng năm chục lần bằng cách **giảm** số connection. Cách diễn đạt của tác giả HikariCP gói lại ý này rất gọn: điều ta muốn là một pool nhỏ và bão hoà, với các thread xếp hàng chờ connection, chứ không phải một pool phình to với hàng trăm connection đạp nhau — một hàng đợi đứng trước một database chạy hết tốc lực vẫn tốt hơn một database nghẹt thở vì đám đông.",
    redFlags: [
      "Nói pool lớn hơn thì luôn tốt hơn, hoặc chỉ nêu \"tốn tài nguyên\" mà không nêu cơ chế nào",
      "Chỉ nhắc bộ nhớ mà bỏ qua chuyển ngữ cảnh và tranh chấp tài nguyên chung",
      "Không phân biệt số connection **đang thực thi** với số connection **đang mở**",
    ],
    probes: [
      "Vì sao hàng đợi ở phía ứng dụng lại tốt hơn hàng đợi bên trong database?",
      "Với một database dùng thread thay vì tiến trình, thuế nào giảm đi và thuế nào vẫn còn?",
      "Bạn biết mức song song thật của database bằng cách nào?",
    ],
    refs: ["java-08"],
  },
  {
    id: "java-iq18",
    field: "java",
    topic: "java-pool",
    level: 2,
    minutes: 9,
    code: {
      lang: "text",
      text: `Số liệu đo được của một dịch vụ:

  Lưu lượng mục tiêu ......... 1600 request/giây
  Thông lượng mỗi instance ... 327 request/giây
  Tomcat threads.max ......... 18
  Thời gian giữ connection ... 50ms mỗi request
  Tổng thời gian mỗi request . 55ms
  PostgreSQL max_connections . 100

Cấu hình hiện tại:
  spring.datasource.hikari.maximum-pool-size: 50
  spring.datasource.hikari.minimum-idle: 5`,
    },
    question: "Tính ra bộ số đúng cho cấu hình này, trình bày từng bước. Rồi nói ba con số nào dễ bị nhầm với nhau ở đây.",
    mustCover: [
      "Số instance: lưu lượng mục tiêu chia thông lượng mỗi instance, khoảng 1600 chia 327 nên **5 instance**",
      "Pool mỗi instance = `threads.max` × (thời gian giữ connection / tổng thời gian request) = 18 × 50/55, khoảng **17**",
      "Công thức **tự ràng buộc**: tỉ lệ luôn nhỏ hơn 1 nên kết quả luôn nhỏ hơn `threads.max`, không bao giờ ra số vô lý",
      "Đây chính là **định luật Little**: số connection đang dùng = tốc độ query × thời gian mỗi connection bị giữ",
      "Cấu hình hiện tại sai hai chỗ: pool 50 **vượt** `threads.max` 18 nên 32 connection không bao giờ dùng tới; `minimum-idle` 5 nghĩa là trả độ trễ tạo connection đúng lúc cao điểm",
      "Ba con số dễ nhầm: **17** là pool mỗi instance, **85** là tổng connection của 5 instance, và **`max_connections` 100** là trần phía database",
      "Phải kiểm 85 nằm dưới 100 — và phải chừa chỗ cho kết nối vận hành, nên biên an toàn ở đây rất mỏng",
    ],
    model: "Tôi đi theo hai phép tính rồi kiểm một ràng buộc. Phép thứ nhất, số instance: lưu lượng mục tiêu chia cho thông lượng mỗi instance, 1600 chia 327 xấp xỉ 5 instance. Phép thứ hai, pool cho mỗi instance: lấy `threads.max` nhân với tỉ lệ giữa thời gian giữ connection và tổng thời gian request, tức 18 nhân 50 trên 55, xấp xỉ 17. Công thức này có một tính chất đáng nêu vì nó bảo vệ ta khỏi sai lầm phổ biến: tỉ lệ luôn nhỏ hơn 1, nên kết quả luôn nhỏ hơn `threads.max` — không bao giờ ra một con số vô lý vượt trần thread. Bản chất của nó chính là định luật Little: số connection đang dùng bằng tốc độ query nhân thời gian mỗi connection bị giữ. Đối chiếu với cấu hình hiện tại thì thấy hai lỗi. Pool 50 vượt cả `threads.max` 18, nên 32 connection trong đó về nguyên tắc không bao giờ được dùng tới — chúng chỉ ăn RAM ở phía database. Và `minimum-idle` 5 nghĩa là pool co lại khi nhàn, nên đúng lúc lưu lượng dựng lên ta phải trả thêm độ trễ tạo connection mới; với một pool nhỏ như 17 thì giữ pool phẳng, đặt `minimum-idle` bằng `maximum-pool-size`, là lựa chọn đúng. Phần ba con số dễ nhầm là chỗ tôi sẽ nói rõ vì nó gây sự cố thật: **17** là pool của **một** instance, **85** là tổng connection khi 5 instance cùng chạy, và **100** là `max_connections` phía PostgreSQL. Ràng buộc phải kiểm là 85 nhỏ hơn 100 — nó thoả, nhưng biên chỉ còn 15, mà database còn cần chỗ cho kết nối vận hành, sao lưu, migration và công cụ quan sát. Nên tôi sẽ coi đây là biên quá mỏng và đề xuất một trong hai hướng: nâng `max_connections` sau khi kiểm bộ nhớ phía database, hoặc giảm nhẹ pool mỗi instance rồi đo lại. Điểm phải nhớ là mỗi lần thêm instance là thêm cả một pool, nên con số 17 chỉ có nghĩa khi đặt cạnh số instance.",
    redFlags: [
      "Đặt pool lớn hơn `threads.max` — phần vượt không bao giờ dùng tới",
      "Tính pool cho một instance rồi quên nhân với số instance khi đối chiếu `max_connections`",
      "Để `minimum-idle` nhỏ hơn nhiều so với `maximum-pool-size` trên một pool vốn đã nhỏ",
      "Kết luận 85 dưới 100 là an toàn mà không chừa chỗ cho kết nối vận hành",
    ],
    probes: [
      "Nếu tự co giãn nâng số instance lên 10 thì chuyện gì xảy ra ở phía database?",
      "Vì sao công thức tự ràng buộc là một tính chất tốt?",
      "`leak-detection-threshold` giúp bạn phát hiện điều gì?",
    ],
    refs: ["java-08", "java-07"],
  },
  {
    id: "java-iq19",
    field: "java",
    topic: "java-pool",
    level: 3,
    minutes: 10,
    question: "Bạn phát hiện các request đang chờ rất lâu để lấy connection từ pool. Bạn xử lý theo hướng nào?",
    tradeoffs: [
      {
        option: "Rút ngắn **thời gian giữ** connection",
        when: "Hướng đầu tiên và hiệu quả nhất, vì số connection cần tỉ lệ thuận với thời gian giữ. Đưa mọi thứ không cần connection ra khỏi vùng transaction — gọi HTTP, tính toán, gửi thư. Không tốn thêm tài nguyên nào ở phía database.",
      },
      {
        option: "Nâng pool",
        when: "Chỉ khi đã xác nhận database còn dư mức song song thật **và** tổng connection của mọi instance vẫn dưới trần. Nếu database đã bão hoà thì nâng pool làm mọi truy vấn chậm đi, tức đổi hàng đợi ở ứng dụng thành hàng đợi bên trong database — chỗ tệ hơn.",
      },
      {
        option: "Giảm nhu cầu — bớt số truy vấn mỗi request",
        when: "Khi nguyên nhân là mỗi request chạm database quá nhiều lần, chẳng hạn N+1. Nó giảm cả thời gian giữ lẫn tải database cùng lúc, nên thường là hướng cho lợi ích lớn nhất — nhưng tốn công sửa mã nhiều nhất.",
      },
    ],
    mustCover: [
      "Phải chẩn đoán trước: chờ connection có thể do **pool nhỏ**, do **giữ quá lâu**, hoặc do **database đã bão hoà** — ba nguyên nhân, ba cách sửa khác nhau",
      "Phân biệt được chúng bằng cách xem thời gian **thực thi truy vấn** có tăng hay không: nếu truy vấn vẫn nhanh thì database chưa bão hoà",
      "Nếu database đã bão hoà thì nâng pool làm mọi thứ **chậm đi** — hàng đợi chuyển vào bên trong database",
      "Rút ngắn thời gian giữ là hướng có lợi nhất về mặt tài nguyên vì nó không đòi thêm gì ở phía database",
      "Phải kiểm ràng buộc toàn cục: tổng connection của **mọi** instance phải dưới trần phía database, có chừa chỗ vận hành",
      "Hàng đợi chờ connection ở phía ứng dụng là thứ **nên** tồn tại — mục tiêu không phải triệt tiêu nó",
    ],
    model: "Trước khi chọn hướng, tôi phân định ba nguyên nhân có cùng triệu chứng. Một là pool đặt quá nhỏ so với nhu cầu thật. Hai là connection bị giữ quá lâu mỗi request, nên số connection cần cao hơn đáng lẽ. Ba là database đã bão hoà, nên connection nào cũng chậm và hàng đợi dài ra. Phân biệt chúng không khó nếu đo đúng: xem thời gian thực thi truy vấn có tăng hay không. Nếu truy vấn vẫn nhanh như bình thường mà request phải chờ lấy connection thì database chưa bão hoà, vấn đề nằm ở phía ta — pool nhỏ hoặc giữ lâu. Nếu chính thời gian truy vấn cũng tăng thì database đã bão hoà, và đây là chỗ quyết định: khi đó nâng pool làm mọi thứ chậm đi, vì nó chỉ chuyển hàng đợi từ phía ứng dụng vào bên trong database — nơi hàng đợi ấy còn kéo theo tranh chấp lock manager và buffer pool. Hàng đợi đứng trước một database chạy hết tốc lực tốt hơn một database nghẹt thở vì đám đông. Giả sử database chưa bão hoà, tôi vẫn thử hướng rút ngắn thời gian giữ trước khi nâng pool, vì số connection cần tỉ lệ thuận với thời gian giữ: đưa mọi thứ không cần connection ra khỏi vùng transaction — lời gọi HTTP, tính toán nặng, gửi thư — thường cắt được thời gian giữ đáng kể mà không đòi thêm tài nguyên nào ở phía database, tức nó cải thiện cả hai phía cùng lúc. Hướng cho lợi ích lớn nhất nhưng tốn công nhất là giảm số truy vấn mỗi request; nếu nguyên nhân là N+1 thì sửa nó vừa giảm thời gian giữ vừa giảm tải database. Nâng pool là hướng tôi làm sau cùng và chỉ khi đã xác nhận hai điều: database còn dư mức song song thật, và tổng connection của mọi instance vẫn dưới trần phía database sau khi chừa chỗ cho kết nối vận hành. Một điểm cuối đáng nói vì nó hay bị hiểu sai: hàng đợi chờ connection là thứ **nên** tồn tại, không phải lỗi cần triệt tiêu — mục tiêu là nó ngắn và ổn định, chứ không phải bằng không.",
    redFlags: [
      "Nâng pool là phản xạ đầu tiên, chưa kiểm thời gian thực thi truy vấn",
      "Nâng pool khi database đã bão hoà — đổi hàng đợi ở ứng dụng thành hàng đợi trong database",
      "Quên kiểm tổng connection của mọi instance so với trần phía database",
      "Coi mục tiêu là không còn ai phải chờ connection",
    ],
    probes: [
      "Bạn dùng đại lượng nào để biết database đã bão hoà hay chưa?",
      "Những việc gì thường bị để lại trong vùng transaction mà không cần connection?",
      "Hàng đợi chờ connection dài bao nhiêu thì bạn coi là bình thường?",
    ],
    refs: ["java-08"],
  },
  {
    id: "java-iq20",
    field: "java",
    topic: "java-pool",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Mỗi khi lưu lượng tăng và tự co giãn thêm instance, dịch vụ **chậm đi** thay vì nhanh lên, và database bắt đầu từ chối kết nối mới với lỗi hết slot. Khi lưu lượng giảm và số instance co lại, mọi thứ trở lại bình thường.",
      scale: "Bình thường 6 instance, cao điểm co giãn tới 24. Mỗi instance có `maximum-pool-size` 20 và `minimum-idle` 20. PostgreSQL `max_connections` là 200.",
      constraints: "Không tắt được tự co giãn — nó là cơ chế duy nhất chịu được đỉnh tải. Không nâng được `max_connections` vì bộ nhớ máy database đã sát trần. Phải giữ được khả năng co giãn tới 24 instance.",
      },
    question: "Hãy làm phép tính cho thấy vấn đề, rồi nêu cách sửa giữ được khả năng co giãn tới 24 instance.",
    mustCover: [
      "Phép tính: 24 instance × 20 connection = **480**, vượt xa `max_connections` 200 — nên database từ chối kết nối",
      "`minimum-idle` bằng 20 nghĩa là mỗi instance **giữ thường trực** 20 connection ngay khi vừa lên, kể cả khi chưa có tải",
      "Vì vậy trần bị vượt ngay ở khoảng 10 instance, không cần tới 24",
      "Việc thêm instance làm **chậm đi** là dấu hiệu database đã bão hoà: connection thừa gây tranh chấp và chuyển ngữ cảnh trên máy database",
      "Lỗi gốc là thiết kế: pool được đặt cho **một** instance mà không có ràng buộc nào ở mức **toàn cụm**",
      "Sửa: pool mỗi instance phải suy từ **trần toàn cụm chia số instance tối đa**, chừa chỗ cho kết nối vận hành",
      "24 instance với biên vận hành nghĩa là pool mỗi instance chỉ ở bậc **6–7**, và phải kiểm lại nó có đủ theo công thức `threads.max` × tỉ lệ giữ hay không",
      "Nếu 6–7 không đủ thì bài toán thật là **giảm thời gian giữ** connection hoặc thêm một tầng pool dùng chung, không phải nâng pool",
    ],
    model: "Phép tính phơi bày vấn đề ngay: 24 instance nhân 20 connection mỗi instance bằng 480, trong khi `max_connections` chỉ 200. Tệ hơn, `minimum-idle` cũng là 20 nên mỗi instance giữ thường trực đủ 20 connection ngay từ lúc vừa lên, kể cả khi chưa nhận request nào — nghĩa là trần bị vượt ở khoảng 10 instance chứ không cần tới 24, và đó giải thích vì sao sự cố xuất hiện ngay khi bắt đầu co giãn. Triệu chứng \"thêm instance mà chậm đi\" là dấu hiệu thứ hai và nó nói về phía database: khi số connection đang thực thi vượt mức song song thật, connection thừa bắt database trả thuế chuyển ngữ cảnh và thuế tranh chấp lock manager cùng buffer pool, nên mỗi truy vấn tự nó chậm đi. Ta đang trả tiền để làm database nghẹt thở. Lỗi gốc không phải một con số sai mà là một thiếu sót thiết kế: pool được đặt cho **một** instance, trong khi ràng buộc thật nằm ở mức **toàn cụm**, và không có gì trong hệ thống ràng hai thứ đó với nhau — nên tự co giãn, vốn là một cơ chế tốt, trở thành cơ chế phá trần. Cách sửa là đảo chiều phép tính: pool mỗi instance phải suy từ trần toàn cụm chia cho số instance tối đa, sau khi chừa chỗ cho kết nối vận hành, sao lưu, migration và công cụ quan sát. Với 200 trừ khoảng 30 cho vận hành, còn 170 chia 24 thì pool mỗi instance chỉ ở bậc 6 hoặc 7. Bước tiếp theo là bước trung thực: kiểm xem 6–7 có đủ hay không theo công thức `threads.max` nhân tỉ lệ thời gian giữ connection trên tổng thời gian request. Nếu đủ thì ta đã xong và còn được lợi vì database thôi bị quá tải. Nếu không đủ thì phải nói rõ rằng bài toán thật không phải nâng pool mà là giảm nhu cầu: rút ngắn thời gian giữ connection bằng cách đưa mọi việc không cần connection ra khỏi vùng transaction, giảm số truy vấn mỗi request, hoặc đặt một tầng pool dùng chung phía trước database để nhiều instance chia sẻ cùng một tập connection thay vì mỗi instance giữ riêng. Đồng thời tôi sẽ hạ `minimum-idle` xuống thấp hơn nhiều so với `maximum-pool-size` cho trường hợp này — trái với nguyên tắc pool phẳng thông thường — vì ở đây chi phí của việc giữ connection nhàn là chiếm slot toàn cụm, và nó lớn hơn lợi ích tránh độ trễ tạo connection.",
    redFlags: [
      "Nâng `max_connections` — ràng buộc đã cấm, và nó cũng không sửa được việc database đã bão hoà",
      "Tắt tự co giãn hoặc giới hạn số instance — bỏ đúng cơ chế chịu đỉnh tải",
      "Chỉ hạ pool mỗi instance mà không suy từ trần toàn cụm chia số instance tối đa",
      "Bỏ qua `minimum-idle` bằng 20, vốn làm trần bị vượt ngay ở 10 instance",
      "Kết luận pool 6–7 là đủ mà không kiểm lại bằng công thức thời gian giữ",
    ],
    probes: [
      "Bao nhiêu instance thì trần bị vượt với cấu hình hiện tại?",
      "Vì sao ở ca này bạn hạ `minimum-idle` dù nguyên tắc thông thường là giữ pool phẳng?",
      "Nếu pool 6 không đủ theo công thức thì bạn làm gì tiếp?",
    ],
    refs: ["java-08", "java-07"],
  },

  // ===== java-tx — @Transactional: proxy, ThreadLocal và bẫy (java-iq21–java-iq24) =====
  {
    id: "java-iq21",
    field: "java",
    topic: "java-tx",
    level: 1,
    minutes: 6,
    question: "`@Transactional` chỉ là một annotation. Giải thích cơ chế thật làm nó hoạt động, và vì sao gọi một method `@Transactional` từ bên trong cùng class lại không có tác dụng.",
    mustCover: [
      "Annotation chỉ là cái nhãn; sức mạnh nằm ở **proxy** mà Spring đặt trước bean",
      "Proxy mở transaction trước khi gọi method thật và commit hoặc rollback sau khi nó trả về",
      "Transaction được gắn vào **thread** qua `ThreadLocal`, nên mọi thứ chạy trong thread đó thấy được cùng một connection",
      "Lời gọi từ bên trong cùng class là **self-invocation**: nó đi thẳng tới method thật, **không** qua proxy",
      "Không qua proxy nghĩa là không ai mở transaction — annotation vẫn nằm đó và hoàn toàn vô tác dụng",
      "Vì transaction bound vào thread, chuyển việc sang thread khác cũng làm mất ngữ cảnh transaction",
    ],
    model: "`@Transactional` không tự làm gì cả; nó là một cái nhãn để Spring biết phải bọc cái gì. Cơ chế thật là proxy: Spring đặt một object đứng trước bean của ta, và mọi lời gọi từ bên ngoài đi qua object đó. Khi một lời gọi tới một method có nhãn, proxy làm ba việc theo thứ tự — lấy một connection và mở transaction, gọi method thật, rồi commit nếu trả về bình thường hoặc rollback nếu có ngoại lệ thuộc loại cần rollback. Chi tiết quan trọng thứ hai là transaction được gắn vào **thread**, qua `ThreadLocal`: connection được cất vào một chỗ gắn với thread hiện hành, nên mọi mã chạy trong thread đó — kể cả những repository nằm sâu vài tầng — đều lấy được đúng connection ấy mà không phải truyền tay. Đó là lý do ta viết mã nghiệp vụ như thể không có transaction nào tồn tại. Từ hai chi tiết đó suy ra ngay câu trả lời cho phần thứ hai. Khi một method của bean gọi một method khác **trong cùng class**, lời gọi đó không đi ra ngoài rồi quay lại mà đi thẳng tới method thật trong cùng object — nó không đi qua proxy. Proxy không biết gì về lời gọi ấy nên không ai mở transaction; annotation vẫn nằm chình ình trên method và hoàn toàn vô tác dụng. Đây là lỗi khó thấy vì mã đọc rất hợp lý và không có cảnh báo nào. Cùng logic đó giải thích một lỗi họ hàng: vì transaction bound vào thread, nếu ta chuyển việc sang một thread khác — một executor, một `@Async` — thì thread mới không thấy `ThreadLocal` của thread cũ, nên nó nằm ngoài transaction dù mã trông như nằm trong.",
    redFlags: [
      "Nói Spring \"đọc annotation lúc chạy rồi tự mở transaction\" mà không nhắc proxy",
      "Không nối được self-invocation với việc lời gọi không đi qua proxy",
      "Bỏ qua việc transaction bound vào thread, nên không giải thích được các lỗi liên quan tới đổi thread",
    ],
    probes: [
      "Bạn kiểm chứng một method có thật sự mở transaction hay không bằng cách nào?",
      "Đặt `@Transactional` trên interface hay trên class impl, và vì sao?",
      "Nếu bắt buộc phải gọi nội bộ mà vẫn cần transaction thì làm thế nào?",
    ],
    refs: ["java-09"],
  },
  {
    id: "java-iq22",
    field: "java",
    topic: "java-tx",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@Service
public class InvoiceService {

    @Transactional
    private void persist(Invoice inv) {          // (1) private
        repo.save(inv);
    }

    @Transactional
    public final void finalize(Invoice inv) {    // (2) final
        repo.save(inv);
    }

    @Transactional
    public void importBatch(List<Invoice> list) throws IOException {
        for (Invoice inv : list) repo.save(inv);
        if (!checksumOk(list))
            throw new IOException("checksum lệch");   // (3)
    }
}`,
    },
    question: "Ba method này có ba lỗi khác nhau, và cả ba đều **không** báo lỗi lúc biên dịch hay lúc khởi động. Chỉ ra từng cái và nói triệu chứng quan sát được.",
    mustCover: [
      "(1) `private`: CGLIB tạo **subclass** và override method để chèn interceptor, nhưng override một method `private` là chuyện **không tồn tại** trong Java",
      "(2) `final`: không kế thừa được thì không bọc được — cùng một lý do thuộc về **bytecode**, không phải Spring",
      "Triệu chứng của (1) và (2) giống nhau: log **không có** dòng mở transaction nào, mỗi `save` tự commit riêng lẻ",
      "(3) Ngoại lệ **checked**: mặc định Spring chỉ rollback với `RuntimeException` và `Error`",
      "Nên `IOException` làm Spring **im lặng commit** phần đã ghi — triệu chứng tệ nhất vì không có lỗi nào lộ ra",
      "Quy ước này kế thừa từ EJB: checked exception được đọc là \"nghiệp vụ đã tính đến\", nên Spring tôn trọng và commit",
      "Muốn khác đi phải khai tường minh loại ngoại lệ cần rollback",
    ],
    model: "Ba lỗi, và điểm chung khiến chúng nguy hiểm là không cái nào báo gì lúc biên dịch hay lúc khởi động. Hai lỗi đầu cùng một gốc và gốc đó nằm ở Java chứ không ở Spring. Spring Boot mặc định dùng CGLIB, tức nó sinh một subclass kế thừa chính class của bean rồi override method để chèn interceptor. Với method `private` thì việc override đơn giản là không tồn tại trong Java, nên không có cách nào bọc nó. Với method `final` thì không kế thừa được nên cũng không bọc được. Triệu chứng của cả hai giống nhau và rất dễ bị bỏ qua: log hoàn toàn không có dòng mở transaction nào, và mỗi `save` chạy ở chế độ tự commit riêng lẻ — nên nếu một bản ghi thất bại giữa chừng thì các bản ghi trước đã nằm vĩnh viễn trong database. Khi thấy annotation nằm chình ình mà không có transaction nào, việc đầu tiên cần soát là method có `private` hay `final` không. Lỗi thứ ba khác bản chất và tệ hơn vì nó im lặng nhất. Mặc định Spring chỉ rollback khi gặp `RuntimeException` và `Error`; một ngoại lệ **checked** như `IOException` sẽ khiến Spring **commit** phần đã ghi. Đây không phải bug mà là quy ước kế thừa từ EJB: Spring đọc checked exception là \"nghiệp vụ đã tính đến trường hợp này rồi\" nên nó tôn trọng và commit. Nhưng một quy ước mà người viết mã không biết thì với người đó nó vẫn là bug — và là loại bug không ném lỗi nào cả: `importBatch` sẽ ghi một nửa lô hoá đơn, ném `IOException` lên tầng trên, và phần đã ghi vẫn nằm đó. Ba tháng sau kế toán phát hiện lệch số. Muốn hành vi khác thì phải khai tường minh loại ngoại lệ cần rollback trên annotation.",
    redFlags: [
      "Nói Spring có lỗi hoặc cấu hình thiếu, không nhận ra giới hạn nằm ở bytecode Java",
      "Tin rằng mọi ngoại lệ đều gây rollback",
      "Chỉ tìm ba lỗi ở tầng cú pháp mà không nêu triệu chứng quan sát được của từng cái",
      "Đổi `IOException` sang `RuntimeException` làm cách sửa duy nhất, không nhắc tới việc khai tường minh",
    ],
    probes: [
      "Nếu bean có interface và dùng JDK proxy thì bảng giới hạn đổi thế nào?",
      "Bạn khai gì trên annotation để rollback cả checked exception?",
      "`readOnly` có chặn được việc ghi không, và nó thật sự là gì?",
    ],
    refs: ["java-10", "java-09"],
  },
  {
    id: "java-iq23",
    field: "java",
    topic: "java-tx",
    level: 3,
    minutes: 11,
    question: "Một method `@Transactional` cần gọi một API bên ngoài rồi ghi kết quả. Bạn đặt ranh giới transaction ở đâu?",
    tradeoffs: [
      {
        option: "Cắt thành hai transaction, lời gọi API nằm **giữa**",
        when: "Mặc định của tôi. Connection chỉ bị giữ trong hai đoạn ghi ngắn, không bị giữ suốt thời gian chờ API. Đổi lại là mất tính nguyên tử tức thời, nên phải có **trạng thái trung gian** và một cơ chế hoà giải cho những bản ghi kẹt.",
      },
      {
        option: "Giữ một transaction bao cả lời gọi API",
        when: "Chỉ khi lời gọi rất nhanh, có timeout chặt, và lưu lượng thấp. Được tính nguyên tử đơn giản, nhưng connection bị giữ **từ lúc method bắt đầu tới lúc kết thúc** — không phải mượn lúc chạy SQL rồi trả — nên nó nhân thời gian giữ connection lên theo độ trễ của bên ngoài.",
      },
      {
        option: "Ghi trước, đẩy lời gọi API sang **sau khi commit**",
        when: "Khi việc gọi API là hệ quả chứ không phải điều kiện của việc ghi — gửi thông báo, đồng bộ hệ thống khác. Transaction ngắn nhất có thể, và việc gọi có thể thử lại độc lập. Cần một hàng đợi hoặc bảng việc cần làm để không mất lời gọi khi tiến trình chết.",
      },
    ],
    mustCover: [
      "Connection bị giữ **suốt cả method** có transaction, không phải chỉ trong lúc chạy câu SQL",
      "Vì vậy một lời gọi mạng trong vùng transaction nhân thời gian giữ connection lên theo độ trễ của bên ngoài",
      "Số connection cần tỉ lệ thuận với thời gian giữ, nên nó **nhân trực tiếp** vào kích thước pool cần thiết",
      "Chế độ hỏng khi bên ngoài chậm là **cạn connection pool** — và nó ảnh hưởng cả những đường đi không liên quan",
      "Cắt transaction là đổi tính nguyên tử tức thời lấy tính nhất quán cuối cùng, nên phải thiết kế trạng thái trung gian",
      "Nếu lời gọi là **hệ quả** chứ không phải điều kiện thì đẩy ra sau commit là lựa chọn tốt nhất",
      "`@Async` cộng `@Transactional` không giải được vì transaction bound vào thread — thread mới nằm ngoài transaction cũ",
    ],
    model: "Điểm xuất phát là một sự thật hay bị hiểu sai: khi một method có transaction, connection được lấy lúc method bắt đầu và giữ tới lúc method kết thúc — không phải mượn trong lúc chạy câu SQL rồi trả ngay. Nên mọi thứ nằm trong thân method đều tính vào thời gian giữ connection, kể cả việc ngồi chờ một API bên ngoài. Hậu quả có thể tính ra được: số connection cần tỉ lệ thuận với thời gian giữ, nên nếu lời gọi API mất 200ms trong khi phần ghi chỉ mất 10ms thì ta vừa nhân nhu cầu connection lên hơn hai chục lần. Và chế độ hỏng thì tệ hơn con số: khi bên ngoài chậm, pool cạn, và mọi đường đi khác cần database cũng đứng theo — một tính năng lỗi làm sập những tính năng không liên quan. Vì vậy mặc định của tôi là cắt: transaction thứ nhất ghi bản ghi ở trạng thái chờ và commit, trả connection về; lời gọi API chạy hoàn toàn ngoài transaction với timeout chặt; transaction thứ hai ghi kết quả và chuyển trạng thái. Cái giá phải nói thẳng là mất tính nguyên tử tức thời, nên tôi bù bằng thiết kế chứ không bằng hy vọng: trạng thái chờ phải là trạng thái hợp lệ mà mọi phần đọc đều hiểu, và phải có một job hoà giải quét những bản ghi kẹt ở trạng thái chờ quá lâu. Nếu lời gọi API thật ra là **hệ quả** của việc ghi chứ không phải điều kiện — gửi thông báo, đồng bộ sang hệ thống khác — thì lựa chọn tốt hơn nữa là ghi trước rồi đẩy lời gọi ra sau commit, qua một hàng đợi hoặc một bảng việc cần làm để nó không bị mất nếu tiến trình chết. Tôi chỉ giữ một transaction bao cả lời gọi khi API rất nhanh, có timeout chặt và lưu lượng thấp, và khi đó vẫn phải tính lại kích thước pool theo thời gian giữ mới. Một lối tắt cần loại ngay: dùng `@Async` để \"đẩy lời gọi ra ngoài\" không giải được bài toán nguyên tử, vì transaction bound vào thread nên thread mới nằm hoàn toàn ngoài transaction cũ — ta được một lời gọi bất đồng bộ nhưng mất luôn bảo đảm về tính nhất quán.",
    redFlags: [
      "Tin rằng connection chỉ bị giữ trong lúc chạy câu SQL",
      "Giữ lời gọi mạng trong vùng transaction rồi nâng pool để chịu được",
      "Dùng `@Async` và nghĩ nó giữ được ngữ cảnh transaction",
      "Cắt transaction mà không thiết kế trạng thái trung gian và cơ chế hoà giải",
    ],
    probes: [
      "Tính ra pool cần thiết trong hai phương án đầu, với API 200ms và phần ghi 10ms",
      "Bản ghi kẹt ở trạng thái chờ thì ai dọn và theo quy tắc nào?",
      "Vì sao `@Async` không mang được transaction sang thread mới?",
    ],
    refs: ["java-10", "java-09"],
  },
  {
    id: "java-iq24",
    field: "java",
    topic: "java-tx",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một luồng nhập liệu báo thành công nhưng khoảng 0,4% lô hàng bị ghi **một nửa** — có bản ghi chi tiết mà không có bản ghi tổng. Không exception nào trong log, không cảnh báo. Ở một luồng khác, đội lại gặp `UnexpectedRollbackException` ném ra từ một method không hề gọi rollback.",
      scale: "Khoảng 8.000 lô mỗi ngày, nên 0,4% là chừng 32 lô lệch mỗi ngày, tích luỹ 6 tháng. Kế toán vừa phát hiện khi đối soát quý.",
      constraints: "Không đổi được chữ ký các method public — 5 module khác đang gọi. Phải xác định được toàn bộ lô đã lệch trong 6 tháng. Phải giải thích được cả hai triệu chứng, vì đội nghi đó là hai lỗi không liên quan.",
      },
    question: "Hai triệu chứng này có liên quan tới nhau không? Nêu chẩn đoán cho từng cái và cách bạn truy lại 6 tháng dữ liệu.",
    mustCover: [
      "Triệu chứng thứ nhất: một ngoại lệ **checked** làm Spring im lặng commit phần đã ghi thay vì rollback",
      "Mặc định chỉ `RuntimeException` và `Error` gây rollback; quy ước này kế thừa từ EJB và **không** báo lỗi gì",
      "Đó là lý do không có exception trong log của dịch vụ: ngoại lệ đã bị bắt ở đâu đó, còn transaction thì đã commit",
      "Triệu chứng thứ hai: một transaction **lồng** bị đánh dấu rollback-only, nhưng transaction ngoài vẫn cố commit",
      "Khi transaction ngoài commit một transaction đã bị đánh dấu, Spring ném `UnexpectedRollbackException` — cái dấu \"hàng hỏng\"",
      "Hai triệu chứng **cùng gốc**: ranh giới transaction và chính sách rollback chưa được thiết kế, chỉ được để mặc định",
      "Sửa: khai tường minh loại ngoại lệ cần rollback, và rà lại propagation ở các lời gọi lồng",
      "Truy lại 6 tháng bằng **đối soát dữ liệu** — tìm bản ghi chi tiết không có bản ghi tổng tương ứng, không dựa vào log",
    ],
    model: "Hai triệu chứng trông khác nhau nhưng cùng một gốc, và tôi sẽ trả lời phần \"có liên quan không\" trước vì nó quyết định cách sửa. Triệu chứng thứ nhất là ngoại lệ checked. Mặc định Spring chỉ rollback với `RuntimeException` và `Error`; một ngoại lệ checked như `IOException` hay một `BusinessException` kế thừa `Exception` sẽ khiến Spring **commit** phần đã ghi. Đây là quy ước kế thừa từ EJB — checked exception được đọc là \"nghiệp vụ đã tính đến trường hợp này\" — nên Spring tôn trọng và commit, hoàn toàn im lặng. Nó khớp trọn bộ triệu chứng: lô được ghi một nửa, luồng báo thành công, và không có exception nào trong log vì ngoại lệ đã bị bắt ở tầng trên rồi xử lý như một trường hợp nghiệp vụ bình thường. Triệu chứng thứ hai là `UnexpectedRollbackException`, và nó là dấu vết của một cơ chế khác: khi một transaction lồng gặp ngoại lệ và bị đánh dấu rollback-only, transaction ngoài vẫn tiếp tục chạy và tới lúc commit thì Spring phát hiện nó đang commit một transaction đã bị đánh dấu — nên nó ném ngoại lệ ấy, như một cái dấu \"hàng hỏng\" dán lên transaction. Method ném ra không hề gọi rollback là đúng, vì bên đánh dấu là một method khác nằm sâu hơn. Gốc chung của hai cái là ranh giới transaction và chính sách rollback chưa bao giờ được thiết kế, chỉ được để mặc định rồi tin rằng mặc định làm điều ta muốn. Nên cách sửa cũng chung một hướng và không cần đổi chữ ký nào — thay đổi nằm trong annotation và trong cách tổ chức lời gọi. Cụ thể: khai tường minh loại ngoại lệ cần rollback trên các method ghi, để một `BusinessException` không còn lặng lẽ commit; và rà lại propagation ở mọi lời gọi lồng để quyết định rõ đâu là một đơn vị công việc, thay vì để transaction lồng đánh dấu chéo lên transaction ngoài. Riêng việc truy lại 6 tháng thì tôi không dựa vào log, vì log chưa từng ghi gì về những lô này. Tôi đối soát trên dữ liệu: tìm mọi bản ghi chi tiết không có bản ghi tổng tương ứng trong toàn bộ 6 tháng — đó chính xác là tập lô đã lệch, đọc được ngay mà không cần bản vá lên trước, và nó vừa để đối soát với kế toán vừa là mốc để xác nhận bản vá đã thật sự chặn được lỗ hổng.",
    redFlags: [
      "Coi hai triệu chứng là hai lỗi không liên quan và sửa riêng lẻ",
      "Tin rằng mọi ngoại lệ đều gây rollback, nên không giải thích được lô ghi một nửa",
      "Bắt `UnexpectedRollbackException` rồi bỏ qua — đó là cái dấu báo dữ liệu đã hỏng, không phải tiếng ồn",
      "Đòi đổi chữ ký method để sửa — ràng buộc đã cấm, và không cần thiết",
      "Dùng log để dựng lại 6 tháng, trong khi log chưa từng ghi gì",
    ],
    probes: [
      "Bạn khai gì để một `BusinessException` gây rollback?",
      "Vì sao method ném `UnexpectedRollbackException` lại không phải method đánh dấu rollback?",
      "Sau khi vá, bạn dùng chỉ số nào để chứng minh lỗ hổng đã bị chặn?",
    ],
    refs: ["java-10", "java-09"],
  },
];
