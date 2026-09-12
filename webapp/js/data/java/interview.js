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
];
