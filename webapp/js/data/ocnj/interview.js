// Ngân hàng câu hỏi phỏng vấn Optimizing Cloud Native Java — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Optimizing Cloud Native Java, ấn bản 2
// (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly). Mỗi câu trỏ
// chương nguồn qua `refs` để tra ngược.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js. Tóm lại:
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (ocnj-iq01–ocnj-iq24) — thống kê tự chấm lưu theo id.

export const ocnjInterview = [
  // ===== ocnj-method — Phương pháp luận đo và thống kê (ocnj-iq01–ocnj-iq04) =====
  {
    id: "ocnj-iq01",
    field: "ocnj",
    topic: "ocnj-method",
    level: 1,
    minutes: 6,
    question: "Sách đưa ra một hệ phân loại các đại lượng hiệu năng quan sát được. Kể chúng ra, và nói vì sao một dự án tuning không thể tối ưu tất cả cùng lúc.",
    mustCover: [
      "Bảy đại lượng: **throughput**, **latency**, **capacity**, **utilization**, **efficiency**, **scalability**, **degradation**",
      "Chúng cung cấp **từ vựng** để đóng khung mục tiêu tuning bằng ngôn ngữ định lượng — đó chính là các yêu cầu phi chức năng",
      "Không phải mọi metric đều tối ưu được đồng thời; thực tế phổ biến là chỉ vài metric được cải thiện trong **một vòng lặp**",
      "Tối ưu một metric **rất có thể gây tổn hại** cho một metric hoặc một nhóm metric khác",
      "Con số throughput chỉ có nghĩa khi kèm mô tả **nền tảng tham chiếu** — phần cứng, OS, software stack, một server hay một cluster",
      "Đơn vị công việc phải **giống nhau giữa các lần đo**, nếu không các con số không so sánh được",
      "Các đại lượng này không nhất thiết có sẵn trực tiếp; một số phải **suy ra** từ con số thô",
    ],
    model: "Bảy đại lượng là throughput, latency, capacity, utilization, efficiency, scalability và degradation. Giá trị của việc có một hệ phân loại như vậy không phải để thuộc lòng danh sách mà để có từ vựng: nó cho phép đóng khung mục tiêu của một dự án tuning bằng ngôn ngữ định lượng, và chính những mục tiêu đó là các yêu cầu phi chức năng của hệ thống. Câu hỏi thứ hai quan trọng hơn. Với hầu hết dự án hiệu năng, không phải mọi metric đều được tối ưu đồng thời; sách nói trường hợp phổ biến hơn nhiều là chỉ một vài metric được cải thiện trong mỗi vòng lặp, và đó có lẽ cũng là số lượng tối đa có thể tinh chỉnh cùng lúc. Lý do là trong dự án thực tế, tối ưu một metric rất có thể gây tổn hại cho metric khác — cặp kinh điển là throughput và latency, nơi việc gom lô để đẩy thông lượng lên hầu như luôn kéo độ trễ đuôi lên theo. Vì vậy việc đầu tiên của một dự án tuning không phải là chỉnh gì mà là chọn metric nào được ưu tiên và metric nào được phép xấu đi. Có hai điều kiện nữa phải nói vì thiếu chúng thì con số vô nghĩa. Thứ nhất, một con số throughput chỉ có ý nghĩa khi kèm mô tả nền tảng tham chiếu mà nó được đo trên đó: cấu hình phần cứng, OS, software stack, và việc hệ thống là một server đơn lẻ hay một cluster. Thứ hai, đơn vị công việc phải được giữ nhất quán giữa các lần chạy — workload khác nhau thì hai con số không so sánh được. Và cuối cùng, không phải đại lượng nào cũng đọc ra trực tiếp; một số cần chút công để suy ra từ các con số thô mà hệ thống cung cấp.",
    redFlags: [
      "Kể danh sách rồi dừng, không nói tối ưu một metric có thể làm xấu metric khác",
      "Báo cáo throughput mà không nêu nền tảng tham chiếu và workload",
      "Nhận trong một vòng lặp sẽ cải thiện đồng thời cả thông lượng, độ trễ và mức dùng tài nguyên",
      "Lẫn utilization với efficiency, hoặc lẫn capacity với throughput",
    ],
    probes: [
      "Một thay đổi làm throughput tăng 30% nhưng latency p99 tăng gấp đôi — bạn nhận hay từ chối?",
      "Degradation đo cái gì mà scalability không đo?",
      "Bạn suy ra đại lượng nào từ con số thô, và suy thế nào?",
    ],
    refs: ["ocnj-01"],
  },
  {
    id: "ocnj-iq02",
    field: "ocnj",
    topic: "ocnj-method",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Bài "benchmark" một đội gửi lên để chứng minh cache mới nhanh hơn 40×
public class CacheBenchmark {

    public static void main(String[] args) {
        Cache cache = new Cache();
        long start = System.currentTimeMillis();

        for (int i = 0; i < 1_000_000; i++) {
            cache.get("key");                 // luôn cùng một key
        }

        long elapsed = System.currentTimeMillis() - start;
        System.out.println("Cache: " + elapsed + "ms");

        start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            database.lookup("key");
        }
        System.out.println("DB: " + (System.currentTimeMillis() - start) + "ms");
    }
}`,
    },
    question: "Con số \"nhanh hơn 40 lần\" này không đáng tin. Liệt kê các lỗi phương pháp, xếp theo mức ảnh hưởng tới kết quả, rồi nói bạn đo lại thế nào.",
    mustCover: [
      "Không có **warmup**: vòng đầu chạy khi JIT chưa biên dịch, nên đoạn đo trước bị phạt còn đoạn sau được hưởng lợi từ JVM đã nóng",
      "Thứ tự thực thi tự nó là một sai số hệ thống — chỉ cần đảo hai khối là con số đổi",
      "Chỉ một **đúng một** phép đo, không lặp lại, nên không có phân tán để biết con số có ổn định hay không",
      "Chỉ báo thời gian tổng, tức chỉ đo **throughput**; không nói gì về **latency** hay đuôi phân bố",
      "Workload không thực tế: luôn cùng một key nên cache luôn hit và bộ nhớ đệm CPU cũng luôn hit — không phản ánh tải thật",
      "`System.currentTimeMillis` là đồng hồ tường, có thể bị điều chỉnh; đo khoảng thời gian phải dùng đồng hồ đơn điệu",
      "Đo lại bằng cách lặp nhiều lần, báo cáo **phân bố** chứ không phải một con số, và tách đo throughput với đo latency",
    ],
    model: "Xếp theo mức ảnh hưởng thì lỗi nặng nhất là không có warmup. Vòng lặp đầu chạy khi JIT chưa kịp biên dịch phần mã nóng, nên nó gánh toàn bộ chi phí thông dịch và biên dịch; đến vòng thứ hai thì JVM đã nóng và được hưởng lợi. Riêng điều đó đủ tạo ra chênh lệch hàng chục lần, và nó cũng có nghĩa thứ tự hai khối là một sai số hệ thống: đảo chỗ chúng thì con số đổi. Lỗi thứ hai là chỉ có đúng một phép đo. Không lặp lại thì không có phân tán, mà không có phân tán thì không biết 40× là tín hiệu hay nhiễu — đây là chỗ sách nhấn khi bàn về thống kê cho hiệu năng JVM, và cũng là lý do một con số đơn lẻ không phải kết quả. Lỗi thứ ba là chỉ đo thời gian tổng, tức chỉ nói về throughput và im lặng hoàn toàn về latency cùng đuôi phân bố — với một cache thì đuôi mới là chỗ vấn đề nằm. Lỗi thứ tư là workload: luôn cùng một key nên cache luôn hit, và cả bộ nhớ đệm CPU cũng luôn hit, nên phép đo này nói về một tình huống không tồn tại trong production. Lỗi thứ năm, nhỏ hơn nhưng thật: `System.currentTimeMillis` là đồng hồ tường, có thể bị điều chỉnh giữa hai lần đọc; đo khoảng thời gian thì phải dùng đồng hồ đơn điệu. Cách đo lại: chạy mỗi cấu hình nhiều lần trong các tiến trình riêng, có warmup tường minh, đảo thứ tự giữa các lần chạy, dùng phân bố key phản ánh tỉ lệ hit thật, rồi báo cáo phân bố kèm khoảng tin cậy thay vì một con số — và tách rõ phép đo throughput khỏi phép đo latency vì hai thứ đó cần thiết kế thí nghiệm khác nhau.",
    redFlags: [
      "Chỉ nói \"thiếu warmup\" rồi dừng, bỏ qua việc không lặp lại và workload không thực tế",
      "Đề nghị tăng số vòng lặp lên 10 triệu — vẫn là một phép đo duy nhất, chỉ dài hơn",
      "Chấp nhận con số vì \"chênh lệch quá lớn nên chắc chắn có thật\"",
      "Không nhận ra thứ tự hai khối tự nó đã là một sai số hệ thống",
    ],
    probes: [
      "Vì sao đảo thứ tự hai khối lại đổi kết quả?",
      "Bạn báo cáo kết quả dưới dạng gì thay cho một con số?",
      "Phân bố key nên trông thế nào để phép đo có nghĩa?",
    ],
    refs: ["ocnj-02", "ocnj-01"],
  },
  {
    id: "ocnj-iq03",
    field: "ocnj",
    topic: "ocnj-method",
    level: 3,
    minutes: 10,
    question: "Đội của bạn phát hiện độ trễ tăng đúng lúc lưu lượng tăng và kết luận lưu lượng là nguyên nhân. Bạn kiểm chứng kết luận đó thế nào?",
    tradeoffs: [
      {
        option: "Tìm biến ẩn gây ra cả hai — kiểm tra trước khi tin vào nhân quả",
        when: "Luôn là bước đầu. Với hai sự kiện tương quan, sách liệt kê các khả năng: A gây ra B, B gây ra A, hoặc cả hai cùng chịu tác động của một yếu tố thứ ba. Lưu lượng cao và độ trễ cao thường **cùng** xảy ra vào giờ cao điểm, khi cả job batch, backup và deploy cũng chạy.",
      },
      {
        option: "Thí nghiệm có kiểm soát — tăng lưu lượng nhân tạo ngoài giờ cao điểm",
        when: "Khi cần bằng chứng nhân quả thật. Nếu tăng tải mà độ trễ **không** tăng, tương quan kia là giả và thủ phạm nằm ở thứ khác cùng giờ. Đây là cách rẻ nhất để loại một giả thuyết sai trước khi tối ưu sai chỗ.",
      },
      {
        option: "Phân tích top-down theo tầng",
        when: "Khi thí nghiệm có kiểm soát không khả thi. Đi từ metric mức hệ thống xuống dần từng tầng, tìm tầng nào có đại lượng thay đổi trước — thứ tự thời gian giữa các tầng là bằng chứng mạnh hơn tương quan thô.",
      },
    ],
    mustCover: [
      "\"Tương quan không hàm ý nhân quả\" — và phải kể được các khả năng thay thế, không chỉ trích châm ngôn",
      "Các khả năng: A gây ra B, **B gây ra A** (nhân quả ngược), hoặc một yếu tố thứ ba gây ra cả hai",
      "**Nhân quả ngược** là khả năng thật ở đây: độ trễ tăng làm request tồn đọng, làm số kết nối đồng thời tăng, trông như lưu lượng tăng",
      "**Tương quan giả** là cái bẫy sách gọi tên: hai biến hành xử giống nhau không có nghĩa có liên hệ nền tảng",
      "Thí nghiệm có kiểm soát là cách phân định: thay đổi một biến và xem biến kia có đi theo hay không",
      "Việc diễn giải kết quả thường là phần **khó nhất**, khó hơn cả việc đo",
    ],
    model: "Tôi sẽ không bắt đầu bằng việc tối ưu, mà bằng việc kiểm tra chính kết luận, vì sách nói rất đúng rằng một trong những công việc khó nhất lại nằm ở diễn giải kết quả đo. Châm ngôn \"tương quan không hàm ý nhân quả\" chỉ hữu ích nếu kể được các khả năng thay thế. Với hai sự kiện tương quan A và B: A gây ra B, B gây ra A, hoặc cả hai cùng chịu tác động của một yếu tố thứ ba — và sách gọi trường hợp không có liên hệ nền tảng nào là tương quan giả. Áp vào ca này, khả năng đội đã bỏ qua chính là nhân quả ngược, và nó rất hợp lý: nếu độ trễ tăng vì một nguyên nhân khác, request sẽ tồn đọng, số kết nối đồng thời và số request đang xử lý tăng lên — và nếu \"lưu lượng\" đang được đo bằng số kết nối đồng thời chứ bằng số request mới đến, thì chính độ trễ đang tạo ra cái trông như lưu lượng tăng. Khả năng thứ ba cũng đáng nghi không kém: giờ cao điểm là lúc nhiều thứ khác cùng chạy — job batch, backup, deploy, snapshot — nên một yếu tố thứ ba gây ra cả hai là giả thuyết mặc định chứ không phải giả thuyết xa xôi. Cách phân định rẻ nhất là một thí nghiệm có kiểm soát: tăng lưu lượng nhân tạo ngoài giờ cao điểm, giữ mọi thứ khác nguyên. Nếu độ trễ không tăng, ta vừa loại xong một giả thuyết sai trước khi tốn hàng tuần tối ưu sai chỗ. Nếu không thể chạy thí nghiệm, tôi chuyển sang phân tích top-down theo tầng và tìm thứ tự thời gian: tầng nào có đại lượng thay đổi **trước** là ứng viên nhân quả mạnh hơn nhiều so với hai đường cong chỉ đi song song.",
    redFlags: [
      "Trích châm ngôn về tương quan rồi vẫn đi tối ưu theo giả thuyết ban đầu",
      "Không xét nhân quả ngược, dù ở đây nó rất hợp lý",
      "Quên rằng giờ cao điểm cũng là giờ nhiều thứ khác cùng chạy",
      "Đòi thêm dashboard thay vì một thí nghiệm có kiểm soát phân định được giả thuyết",
    ],
    probes: [
      "\"Lưu lượng\" của đội đang được đo bằng đại lượng nào, và điều đó đổi gì?",
      "Thí nghiệm có kiểm soát của bạn cụ thể ra sao, và kết quả nào sẽ làm bạn đổi ý?",
      "Thứ tự thời gian giữa các tầng là bằng chứng mạnh hơn tương quan ở điểm nào?",
    ],
    refs: ["ocnj-02", "ocnj-01"],
  },
  {
    id: "ocnj-iq04",
    field: "ocnj",
    topic: "ocnj-method",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một đội chạy bài benchmark trước và sau khi nâng JVM, kết luận bản mới chậm hơn 18% và chặn việc nâng cấp. Sáu tuần sau, một đội khác chạy lại cùng bài và ra nhanh hơn 6%. Bài benchmark chạy 3 lần mỗi cấu hình, lấy trung bình, trên một máy dùng chung với CI.",
      scale: "Quyết định này đang giữ 140 dịch vụ ở JVM cũ, vốn hết hỗ trợ bảo mật trong 4 tháng. Mỗi lần chạy bài benchmark mất 50 phút.",
      constraints: "Không có máy riêng để đo — hạ tầng dùng chung là thứ duy nhất có. Phải ra quyết định nâng cấp trong 3 tuần. Không được nâng cấp mà không có bằng chứng, vì lần trước một bản nâng JVM đã gây sự cố production.",
    },
    question: "Hai kết quả trái ngược nói lên điều gì về bài benchmark? Nêu cách bạn ra được quyết định đáng tin trong 3 tuần với hạ tầng dùng chung.",
    mustCover: [
      "Hai kết quả trái ngược trước hết nói rằng **phân tán của phép đo lớn hơn hiệu ứng** cần đo — nên chưa bên nào có bằng chứng",
      "3 lần chạy rồi lấy trung bình là quá ít để nói gì; và **trung bình** là đại lượng sai cho dữ liệu hiệu năng vốn có đuôi dài",
      "Máy dùng chung với CI đưa vào nhiễu **không kiểm soát được** và không độc lập — CI chạy nhiều hay ít tuỳ ngày",
      "Cách sửa phương pháp: nhiều lần chạy hơn, **xen kẽ** hai cấu hình thay vì chạy khối này rồi khối kia, và báo cáo phân bố kèm khoảng tin cậy",
      "Xen kẽ là mấu chốt với hạ tầng dùng chung: nó biến nhiễu của môi trường thành nhiễu **chung cho cả hai** nhánh thay vì thành sai số hệ thống",
      "Cùng với đó, đo trên **tải production thật** qua triển khai canary — bằng chứng mạnh hơn mọi bài benchmark tổng hợp",
      "Rủi ro bảo mật 4 tháng là một đại lượng phải đặt lên cùng bàn cân, không phải chuyện riêng của đội bảo mật",
    ],
    model: "Điều đầu tiên phải nói với cả hai đội là không ai trong hai bên đang có bằng chứng. Khi hai phép đo cùng bài cho ra 18% chậm hơn và 6% nhanh hơn, kết luận đúng là phân tán của phép đo lớn hơn hiệu ứng mà ta muốn phát hiện — nên cả hai con số đều nằm trong nhiễu. Ba nguyên nhân cộng lại. Thứ nhất, 3 lần chạy mỗi cấu hình là quá ít để nói gì về phân tán, và việc lấy **trung bình** còn làm tình hình xấu hơn: dữ liệu hiệu năng có đuôi dài, nên trung bình bị vài lần chạy xấu kéo lệch và che mất hình dạng thật của phân bố. Thứ hai, máy dùng chung với CI đưa vào nhiễu không kiểm soát được, và tệ hơn là nhiễu ấy không độc lập với thời điểm đo — CI chạy nhiều hay ít tuỳ ngày, nên hai đội đo cách nhau sáu tuần thực ra đã đo hai môi trường khác nhau. Thứ ba, việc chạy hết khối cấu hình cũ rồi mới sang khối cấu hình mới biến mọi biến động theo thời gian thành sai số hệ thống gán thẳng vào hiệu ứng. Trong ba tuần và với hạ tầng dùng chung, tôi làm hai việc song song. Việc thứ nhất là sửa phương pháp mà không cần máy riêng: tăng số lần chạy, và quan trọng nhất là **xen kẽ** hai cấu hình — chạy A, B, A, B luân phiên thay vì AAA rồi BBB. Xen kẽ không loại được nhiễu của máy dùng chung, nhưng nó biến nhiễu đó thành nhiễu chung cho cả hai nhánh thay vì thành sai số hệ thống, và đó chính là thứ cứu được phép đo trên hạ tầng không sạch. Kèm theo là báo cáo phân bố với khoảng tin cậy, và một kết luận trung thực có thể là \"không phát hiện được khác biệt lớn hơn ±10%\" — vốn đã là câu trả lời đủ để ra quyết định. Việc thứ hai, và là bằng chứng mạnh hơn, là đo trên tải thật: triển khai canary một tỉ lệ nhỏ lưu lượng lên JVM mới, so độ trễ và thông lượng với nhóm đối chứng. Điều đó cũng trực tiếp trả lời nỗi lo chính đáng của đội về sự cố lần trước, vì canary phát hiện được cả những vấn đề mà bài benchmark tổng hợp không mô phỏng. Cuối cùng, tôi sẽ đặt rủi ro hết hỗ trợ bảo mật trong 4 tháng lên cùng bàn cân: chặn nâng cấp cũng là một quyết định có chi phí, và nó đang được ra dựa trên một con số nằm trong nhiễu.",
    redFlags: [
      "Tin con số của một trong hai đội chỉ vì nó chạy sau, hoặc vì nó khớp với kỳ vọng sẵn có",
      "Đòi máy riêng làm điều kiện tiên quyết — ràng buộc đã nói không có, và xen kẽ giải quyết được phần lớn vấn đề",
      "Chạy nhiều lần hơn nhưng vẫn theo khối AAA rồi BBB, để nguyên sai số hệ thống",
      "Giữ trung bình làm đại lượng báo cáo cho dữ liệu có đuôi dài",
      "Bỏ qua rủi ro bảo mật vì nó không nằm trong phạm vi bài benchmark",
    ],
    probes: [
      "Vì sao xen kẽ hai cấu hình lại quan trọng hơn việc tăng số lần chạy?",
      "Bạn báo cáo kết quả dưới dạng nào để đội ra được quyết định?",
      "Canary phát hiện được thứ gì mà bài benchmark tổng hợp không?",
    ],
    refs: ["ocnj-02"],
  },

  // ===== ocnj-jvm — Nội tại JVM và thực thi mã (ocnj-iq05–ocnj-iq08) =====
  {
    id: "ocnj-iq05",
    field: "ocnj",
    topic: "ocnj-jvm",
    level: 1,
    minutes: 5,
    question: "Giải thích vì sao một method Java có thể chạy chậm ở lần gọi thứ nhất và nhanh gấp nhiều lần ở lần gọi thứ mười nghìn. Điều đó ràng buộc gì lên cách bạn đo hiệu năng?",
    mustCover: [
      "JVM khởi đầu bằng **thông dịch** bytecode, rồi **biên dịch JIT** những phần mã nóng sang mã máy khi phát hiện chúng chạy nhiều",
      "JIT dùng **thông tin lúc chạy** — profile thật của chương trình — nên nó tối ưu được những thứ biên dịch trước không làm được",
      "Vì vậy hiệu năng của cùng một đoạn mã **thay đổi theo thời gian chạy**, không phải một hằng số",
      "Hệ quả cho phép đo: phải có **warmup** trước khi đo, nếu không ta đang đo trạng thái quá độ",
      "Hệ quả thứ hai: mã có thể bị **hủy tối ưu** khi giả định của JIT bị phá, nên hiệu năng có thể **xấu đi** giữa lúc chạy",
    ],
    model: "Java không biên dịch trước ra mã máy rồi chạy; nó thông dịch bytecode trước, và trong lúc thông dịch thì đếm xem đoạn mã nào chạy nhiều. Khi một method hoặc một vòng lặp vượt ngưỡng nóng, JVM biên dịch nó sang mã máy — đó là biên dịch JIT. Lần gọi thứ nhất chạy ở chế độ thông dịch nên chậm; đến lần thứ mười nghìn thì đoạn mã ấy đã là mã máy đã tối ưu, nên nhanh hơn nhiều lần. Điểm đáng nói thêm là JIT không chỉ dịch: nó dùng thông tin lúc chạy — kiểu thật của object tại điểm gọi, nhánh nào thường được chọn, vòng lặp chạy bao nhiêu vòng — nên nó làm được những tối ưu mà một trình biên dịch trước lúc chạy không có đủ dữ kiện để làm, chẳng hạn inline một lời gọi ảo khi thấy thực tế chỉ có một kiểu đi qua. Cái giá là hiệu năng của cùng một đoạn mã không còn là hằng số mà là một hàm của thời gian chạy. Ràng buộc đầu tiên lên phép đo là phải có warmup: đo trước khi JIT kịp làm việc là đo một trạng thái quá độ không tồn tại trong production. Ràng buộc thứ hai ít người nói tới nhưng quan trọng: vì tối ưu dựa trên giả định, JVM phải giữ đường lùi, và khi một giả định bị phá — một kiểu mới xuất hiện ở điểm gọi từng đơn hình — mã bị hủy tối ưu và quay về thông dịch. Nghĩa là hiệu năng có thể **xấu đi** giữa lúc chạy, không chỉ tốt lên; nên một phép đo dài, chạm nhiều nhánh, mới nói được điều gì về hành vi thật.",
    redFlags: [
      "Nói Java \"biên dịch sang mã máy lúc build\" hoặc \"luôn thông dịch\" — cả hai đều bỏ mất cơ chế JIT",
      "Chỉ nhắc warmup mà không nói lý do là JIT dùng thông tin lúc chạy",
      "Không biết mã đã tối ưu có thể bị hủy tối ưu, nên tưởng hiệu năng chỉ đi lên rồi bằng phẳng",
    ],
    probes: [
      "JIT làm được tối ưu nào mà biên dịch trước lúc chạy không làm được, và nhờ đâu?",
      "Điều gì kích hoạt việc hủy tối ưu?",
      "Warmup bao lâu là đủ, và bạn biết bằng cách nào?",
    ],
    refs: ["ocnj-06", "ocnj-03"],
  },
  {
    id: "ocnj-iq06",
    field: "ocnj",
    topic: "ocnj-jvm",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public interface Handler { void handle(Event e); }

// Trong production chỉ có duy nhất một implementation được nạp:
class DefaultHandler implements Handler {
    public void handle(Event e) { /* ... */ }
}

public class Dispatcher {
    private final Handler handler;          // luôn là DefaultHandler

    public void dispatch(List<Event> events) {
        for (Event e : events) {
            handler.handle(e);              // điểm gọi ảo trong vòng lặp nóng
        }
    }
}

// Tháng sau, một đội thêm class thứ hai và nạp nó trong cùng JVM:
class AuditHandler implements Handler {
    public void handle(Event e) { /* ... */ }
}`,
    },
    question: "Sau khi class thứ hai được nạp, thông lượng của `dispatch` tụt khoảng 30% dù không dòng mã nào trong `Dispatcher` thay đổi. Giải thích bằng cơ chế JIT, rồi nói bạn xác nhận giả thuyết đó bằng cách nào.",
    mustCover: [
      "Trước đó điểm gọi là **đơn hình**: JIT thấy chỉ một kiểu đi qua nên **inline** thẳng thân method vào vòng lặp",
      "Inline mở đường cho các tối ưu tiếp theo, nên lợi ích lớn hơn việc chỉ bỏ một lần nhảy",
      "Khi class thứ hai được nạp, giả định đơn hình bị phá — JIT phải **hủy tối ưu** và biên dịch lại",
      "Điểm gọi trở thành **đa hình**, nên phải kiểm kiểu lúc chạy và inline không còn vô điều kiện được",
      "Đây là ví dụ cho việc hiệu năng JVM phụ thuộc **trạng thái lúc chạy**, không suy được từ mã nguồn",
      "Xác nhận bằng cách quan sát **quyết định biên dịch** của JVM — log biên dịch, hoặc công cụ đọc log đó",
    ],
    model: "Không dòng mã nào đổi, nhưng thứ JIT biết về chương trình thì đổi. Trước khi class thứ hai xuất hiện, điểm gọi `handler.handle(e)` là đơn hình: trong suốt thời gian chạy chỉ có đúng một kiểu đi qua đó, nên JIT có thể coi lời gọi ảo ấy như một lời gọi tĩnh và inline thẳng thân method vào vòng lặp. Việc inline quan trọng hơn vẻ ngoài: nó không chỉ bỏ được một lần nhảy mà còn mở đường cho mọi tối ưu tiếp theo — hằng số được gấp, nhánh chết bị loại, mã trong vòng lặp được sắp lại — vì giờ trình biên dịch thấy được cả thân method trong cùng một phạm vi. Đó là lý do lợi ích có thể lên tới hàng chục phần trăm. Khi `AuditHandler` được nạp, giả định \"chỉ một kiểu\" bị phá. JVM buộc phải hủy tối ưu đoạn mã đã biên dịch dựa trên giả định đó, quay về thông dịch, rồi biên dịch lại — và lần này điểm gọi là đa hình nên phải kiểm kiểu lúc chạy, còn inline không thể làm vô điều kiện nữa. Thông lượng tụt là hệ quả trực tiếp. Bài học tổng quát hơn, và là điều tôi muốn nói với người phỏng vấn: hiệu năng của một ứng dụng Java là thuộc tính của **trạng thái lúc chạy**, không phải của mã nguồn — hai JVM chạy cùng một file jar có thể có hình dạng hiệu năng khác nhau chỉ vì tập class được nạp khác nhau. Để xác nhận giả thuyết, tôi không đoán mà đi xem quyết định biên dịch: bật log biên dịch của JVM và tìm đúng method đó, xem nó có bị hủy tối ưu và biên dịch lại vào thời điểm class mới được nạp, và xem điểm gọi được xếp là đơn hình hay đa hình. Nếu log cho thấy đúng chuỗi đó thì giả thuyết được xác nhận; nếu không, tôi đã loại được nó rẻ hơn nhiều so với việc đi tối ưu mò.",
    redFlags: [
      "Kết luận việc thêm một class làm \"JVM nặng hơn\" nên chậm đi — không nêu cơ chế nào",
      "Nói nguyên nhân là dispatch ảo tốn một lần tra bảng, bỏ qua việc mất inline mới là phần lớn chi phí",
      "Đề xuất tối ưu mà chưa xem log biên dịch để xác nhận giả thuyết",
      "Cho rằng vì mã nguồn không đổi thì hiệu năng không thể đổi",
    ],
    probes: [
      "Vì sao mất inline lại đắt hơn nhiều so với chi phí của một lần dispatch ảo?",
      "Nếu vòng lặp gặp hai kiểu thay vì một, JIT còn làm được gì?",
      "Bạn thiết kế lại `Dispatcher` thế nào nếu cần giữ hiệu năng mà vẫn cho phép nhiều handler?",
    ],
    refs: ["ocnj-06"],
  },
  {
    id: "ocnj-iq07",
    field: "ocnj",
    topic: "ocnj-jvm",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ cần khởi động nhanh vì nó tự co giãn theo tải và thường xuyên có instance mới. Bạn chọn cách thực thi nào?",
    tradeoffs: [
      {
        option: "JVM tiêu chuẩn, chấp nhận thời gian nóng máy",
        when: "Instance sống đủ lâu để JIT trả lại phần đã đầu tư. Thông lượng đỉnh cao nhất vì JIT tối ưu dựa trên profile thật, và không mất gì về tính linh hoạt lúc chạy.",
      },
      {
        option: "Biên dịch trước lúc chạy (AOT / native image)",
        when: "Instance sống ngắn hoặc khởi động là đại lượng bị ràng buộc — đúng tình huống tự co giãn theo tải. Khởi động nhanh và bộ nhớ thấp, đổi lại **mất** những tối ưu dựa trên thông tin lúc chạy, nên thông lượng đỉnh thường thấp hơn; và mọi thứ phản chiếu hay nạp động phải khai trước.",
      },
      {
        option: "Giữ JVM nhưng rút ngắn đường tới trạng thái nóng",
        when: "Khi không muốn từ bỏ thông lượng đỉnh: giảm số instance bị thay bằng cách co giãn thô hơn, cho instance sống lâu hơn, hoặc dùng các cơ chế lưu lại trạng thái đã nóng. Phương án trung dung, và là nơi những hướng phát triển mới của nền tảng đang nhắm tới.",
      },
    ],
    mustCover: [
      "Trục đánh đổi là **thông lượng đỉnh** so với **thời gian khởi động và bộ nhớ**, và nó quy về vòng đời một instance",
      "JIT mạnh nhờ **thông tin lúc chạy**; biên dịch trước không có thông tin đó nên mất chính lợi thế ấy",
      "Câu hỏi định lượng cần trả lời: instance sống bao lâu so với thời gian để đạt trạng thái nóng",
      "Biên dịch trước còn ràng buộc tính **linh hoạt**: phản chiếu, nạp class động, proxy lúc chạy đều phải khai trước",
      "Không có lựa chọn nào thắng ở mọi trục — phải **đo** trên workload thật thay vì chọn theo tiếng tăm",
    ],
    model: "Tôi đóng khung câu hỏi thành một phép so sánh định lượng: một instance sống bao lâu, so với bao lâu thì nó đạt trạng thái nóng. Nếu instance sống hàng giờ thì thời gian nóng máy là một chi phí trả một lần, và JVM tiêu chuẩn cho thông lượng đỉnh cao nhất — vì JIT tối ưu dựa trên profile thật của chương trình, thứ mà không cách nào có được trước lúc chạy. Nhưng đề bài nói dịch vụ tự co giãn theo tải và thường xuyên có instance mới, nên rất có thể phần lớn đời một instance nằm trong giai đoạn chưa nóng — và khi đó thông lượng đỉnh là một con số ta trả tiền cho mà không bao giờ dùng tới. Đó chính là vùng mà biên dịch trước lúc chạy thắng: khởi động nhanh, bộ nhớ thấp, hành vi ổn định ngay từ request đầu. Cái giá phải nói rõ vì nó không nhỏ. Thứ nhất là thông lượng đỉnh: bỏ JIT là bỏ đúng thứ làm JIT mạnh — tối ưu dựa trên thông tin lúc chạy, như inline một lời gọi ảo khi thấy thực tế chỉ có một kiểu đi qua. Thứ hai là tính linh hoạt: mọi thứ phản chiếu, nạp class động hay tạo proxy lúc chạy đều phải được khai trước, nên một số thư viện cần cấu hình thêm hoặc không dùng được. Phương án thứ ba đáng cân nhắc trước khi nhảy sang biên dịch trước: giữ JVM nhưng rút ngắn đường tới trạng thái nóng — co giãn thô hơn để instance sống lâu hơn, hoặc dùng các cơ chế lưu lại trạng thái đã nóng để instance mới không phải bắt đầu từ số không. Đây là nơi những hướng phát triển gần đây của nền tảng đang nhắm tới, và nó hấp dẫn vì không buộc phải chọn một trong hai đầu. Quyết định cuối tôi không ra theo tiếng tăm mà theo phép đo trên workload thật: dựng cả hai, đo phân bố độ trễ trong 60 giây đầu và ở trạng thái ổn định, rồi đối chiếu với hình dạng co giãn thật của dịch vụ.",
    redFlags: [
      "Chọn native image chỉ vì \"khởi động nhanh\" mà không hỏi instance sống bao lâu",
      "Nói biên dịch trước luôn nhanh hơn — nó nhanh hơn ở khởi động, thường chậm hơn ở thông lượng đỉnh",
      "Bỏ qua ràng buộc về phản chiếu và nạp động, vốn là nơi việc chuyển đổi thực sự tốn công",
      "Quyết định mà không đo cả giai đoạn đầu lẫn trạng thái ổn định",
    ],
    probes: [
      "Bạn đo \"thời gian tới trạng thái nóng\" bằng cách nào?",
      "Thư viện nào trong stack của bạn sẽ gặp vấn đề với biên dịch trước, và vì sao?",
      "Nếu instance sống trung bình 4 phút thì lựa chọn của bạn là gì?",
    ],
    refs: ["ocnj-06", "ocnj-15"],
  },
  {
    id: "ocnj-iq08",
    field: "ocnj",
    topic: "ocnj-jvm",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Sau mỗi lần triển khai, dịch vụ có khoảng 90 giây độ trễ p99 cao gấp 8 lần bình thường rồi trở lại tốt. Đội đã thử tăng CPU request, tăng heap, và nới probe khởi động — không thay đổi gì. Load balancer đưa lưu lượng vào ngay khi probe sẵn sàng trả về OK.",
      scale: "38 pod, triển khai 6–10 lần mỗi ngày, mỗi lần thay lần lượt toàn bộ pod. Trong 90 giây đó khoảng 4% request vượt ngưỡng SLA độ trễ.",
      constraints: "Không được giảm tần suất triển khai — đây là yêu cầu của đội sản phẩm. Không chuyển sang native image trong quý này vì stack đang dùng vài thư viện phụ thuộc phản chiếu nặng. Phải giữ khả năng cuộn ngược trong 2 phút.",
    },
    question: "Vì sao tăng CPU và heap không giúp gì? Nêu chẩn đoán và những can thiệp bạn làm được trong ràng buộc đã cho.",
    mustCover: [
      "Đây là **giai đoạn nóng máy**: pod mới bắt đầu ở chế độ thông dịch, JIT chưa biên dịch những đường mã nóng",
      "Tăng CPU và heap không giúp vì nút thắt không phải tài nguyên mà là **thời gian tích luỹ profile** để JIT hành động",
      "Probe sẵn sàng đang trả lời sai câu hỏi: nó báo \"tiến trình đã lên\", không báo \"đã sẵn sàng nhận tải sản xuất\"",
      "Can thiệp thứ nhất: **hâm nóng trước** — cho pod chạy một lượng lưu lượng tổng hợp qua các đường nóng **trước khi** probe báo sẵn sàng",
      "Can thiệp thứ hai: **đưa lưu lượng vào từ từ** thay vì bật hết ngay, để pod nóng dần dưới tải thật",
      "Can thiệp thứ ba: giảm số pod thay cùng lúc, kéo dài quá trình thay để phần trăm năng lực đang nguội luôn nhỏ",
      "Xác nhận chẩn đoán bằng **log biên dịch** hoặc profiling trong 90 giây đầu, không bằng suy đoán",
    ],
    model: "Việc tăng CPU và heap không giúp gì chính là bằng chứng mạnh nhất cho chẩn đoán. Nếu nút thắt là tài nguyên thì thêm tài nguyên phải cải thiện được ít nhiều; nó không đổi gì nghĩa là nút thắt là **thời gian**, không phải dung lượng. Cụ thể ở đây là giai đoạn nóng máy: một pod vừa lên bắt đầu bằng thông dịch bytecode, và JIT chỉ biên dịch một đường mã sau khi nó chạy đủ nhiều để vượt ngưỡng nóng. Trong khoảng đó, cùng một mã nguồn chạy chậm hơn nhiều lần — và 90 giây là đúng bậc độ lớn của việc tích luỹ profile rồi biên dịch cho một dịch vụ web có nhiều đường mã. Lỗi thiết kế nằm ở probe: nó đang trả lời câu \"tiến trình đã lên chưa\" trong khi load balancer cần câu trả lời cho \"pod này đã sẵn sàng nhận tải sản xuất chưa\". Nới probe khởi động không giúp vì nó chỉ cho thêm thời gian **chờ**, mà JIT không nóng lên khi không có lưu lượng — nó cần công việc thật đi qua, không cần thời gian trôi. Từ đó ra ba can thiệp, đều nằm trong ràng buộc. Thứ nhất và hiệu quả nhất là hâm nóng trước: sau khi tiến trình lên, pod tự chạy một lượng lưu lượng tổng hợp qua đúng các đường mã nóng — các endpoint chịu tải chính — rồi mới cho probe sẵn sàng trả về OK. Điều quan trọng là lưu lượng hâm nóng phải đi qua **đường thật**, vì JIT tối ưu theo profile thật; hâm nóng sai đường thì vô ích. Thứ hai là đưa lưu lượng vào từ từ thay vì bật hết ngay, để phần đầu của giai đoạn nguội chỉ phục vụ một tỉ lệ nhỏ request. Thứ ba là giảm số pod thay cùng lúc và kéo dài quá trình thay, để tại mọi thời điểm chỉ một phần nhỏ năng lực đang nguội — cách này không cần đổi mã, chỉ đổi cấu hình triển khai, nên làm được ngay và vẫn giữ được yêu cầu cuộn ngược trong 2 phút. Trước khi làm cả ba, tôi xác nhận chẩn đoán bằng dữ liệu: bật log biên dịch trên một pod và profiling trong 90 giây đầu, xem có đúng là thời gian dồn vào mã chưa biên dịch hay không — vì nếu thủ phạm thật là một cache lạnh hay một lần nạp cấu hình chậm thì cả ba can thiệp trên đều lệch đích.",
    redFlags: [
      "Tiếp tục tăng tài nguyên — việc nó không giúp gì đã loại giả thuyết tài nguyên",
      "Nới probe khởi động thêm nữa: JIT nóng lên nhờ lưu lượng đi qua, không nhờ thời gian trôi",
      "Đề xuất native image — ràng buộc đã loại trong quý này, và stack phụ thuộc phản chiếu nặng",
      "Giảm tần suất triển khai, trong khi đó là yêu cầu sản phẩm đã chốt",
      "Hâm nóng bằng một endpoint kiểm tra sức khoẻ thay vì các đường mã thật chịu tải",
    ],
    probes: [
      "Vì sao nới probe khởi động không giúp mà hâm nóng trước lại giúp?",
      "Bạn chọn đường nào để hâm nóng, và biết đó là đường đúng bằng cách nào?",
      "Giả thuyết nào khác cũng khớp triệu chứng, và bạn loại nó ra sao?",
    ],
    refs: ["ocnj-06", "ocnj-09"],
  },

  // ===== ocnj-gc — Garbage collection (ocnj-iq09–ocnj-iq12) =====
  {
    id: "ocnj-iq09",
    field: "ocnj",
    topic: "ocnj-gc",
    level: 1,
    minutes: 6,
    question: "Hai động lực chính của hành vi GC trong một ứng dụng Java là gì? Cái nào khó đo hơn, và vì sao điều đó quan trọng?",
    mustCover: [
      "Hai động lực là **allocation rate** và **object lifetime**",
      "Allocation rate là lượng bộ nhớ các object mới dùng trong một khoảng thời gian, thường đo bằng MB/s",
      "JVM **không phơi bày** allocation rate trực tiếp theo mặc định, nhưng nó tương đối dễ ước lượng và công cụ như JFR cung cấp được",
      "Object lifetime **khó đo hoặc thậm chí khó ước lượng** hơn nhiều — và nếu có gì thì nó còn **nền tảng hơn** cả allocation rate",
      "Độ phức tạp của việc hiểu vòng đời object là một trong những **lập luận chính chống lại** quản lý bộ nhớ thủ công",
      "Giả định then chốt của mọi kỹ thuật GC là bộ nhớ vật lý **tái sử dụng được** nhờ các object có vòng đời ngắn",
    ],
    model: "Hai động lực là allocation rate và object lifetime. Allocation rate là lượng bộ nhớ mà các object mới tạo sử dụng trong một khoảng thời gian, thường tính bằng MB/s; JVM không phơi bày nó trực tiếp theo mặc định nhưng đây là một đại lượng tương đối dễ ước lượng, và công cụ như JFR cung cấp được — kèm lưu ý rằng bản thân việc thu thập cũng có thể có hệ quả hiệu năng. Object lifetime thì khác hẳn về độ khó: sách nói nó thường khó đo, hoặc thậm chí khó ước lượng, hơn nhiều — và đưa ra một nhận định đáng nhớ là nếu có gì thì object lifetime còn nền tảng hơn cả allocation rate. Lý do nó nền tảng nằm ở chính cách GC hoạt động: garbage collection có thể hiểu là thu hồi và tái sử dụng bộ nhớ, và khả năng dùng đi dùng lại cùng một mẩu bộ nhớ vật lý nhờ các object có vòng đời ngắn là một giả định then chốt của các kỹ thuật GC. Nếu giả định đó không đúng với ứng dụng của ta — nếu phần lớn object sống lâu — thì GC sẽ phải làm việc theo cách khác và tốn kém hơn nhiều, bất kể allocation rate là bao nhiêu. Vì sao điều này quan trọng trong thực hành? Vì nó nói cho ta biết chỉnh cái gì. Một ứng dụng có allocation rate cao nhưng object chết non thì GC thế hệ mới xử lý rất rẻ, và câu trả lời có thể chỉ là nới vùng non trẻ. Cùng một allocation rate ấy mà object sống lâu hơn một chút — vừa đủ để thoát khỏi vùng non trẻ — thì áp lực dồn sang vùng lâu dài và bài toán hoàn toàn khác. Một chi tiết lịch sử đáng nêu: chính độ phức tạp của việc thực sự hiểu vòng đời object cho một ứng dụng thực là một trong những lập luận chính chống lại việc dùng quản lý bộ nhớ thủ công.",
    redFlags: [
      "Chỉ nói tới kích thước heap và tham số GC, không nhắc allocation rate hay object lifetime",
      "Cho rằng allocation rate là đại lượng khó đo hơn — thực tế ngược lại",
      "Nói \"cấp phát ít là tốt\" mà không xét vòng đời: cấp phát nhiều object chết non thường rất rẻ",
    ],
    probes: [
      "Bạn ước lượng allocation rate bằng cách nào nếu không có công cụ chuyên dụng?",
      "Vì sao object chết non lại rẻ với GC thế hệ mới?",
      "Điều gì xảy ra khi giả định \"phần lớn object chết non\" không đúng với ứng dụng của bạn?",
    ],
    refs: ["ocnj-04"],
  },
  {
    id: "ocnj-iq10",
    field: "ocnj",
    topic: "ocnj-gc",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Trích GC log của một dịch vụ đang bị báo "GC quá nhiều"
[15.231s] Pause Young (Normal) 512M->498M(4096M) 41.2ms
[15.902s] Pause Young (Normal) 514M->501M(4096M) 43.8ms
[16.588s] Pause Young (Normal) 517M->505M(4096M) 44.1ms
[17.301s] Pause Young (Normal) 520M->509M(4096M) 45.6ms
...
[402.11s] Pause Young (Normal) 3812M->3801M(4096M) 88.4ms
[403.02s] Pause Full (Allocation Failure) 3801M->3799M(4096M) 2841ms
[404.90s] Pause Full (Allocation Failure) 3799M->3798M(4096M) 2903ms
[406.81s] Pause Full (Allocation Failure) 3798M->3797M(4096M) 2914ms`,
    },
    question: "Đọc log này và nói vấn đề thật là gì. Đội đang muốn nới heap lên 8G — bạn đồng ý hay không, và vì sao?",
    mustCover: [
      "Mỗi lần Young GC chỉ thu hồi được **rất ít**: 512M về 498M, tức phần lớn object **sống sót** qua lần thu gom",
      "Mức chiếm dụng sau mỗi lần GC **tăng đơn điệu** từ 498M lên 3801M — đó là dấu hiệu của một tập object sống ngày càng lớn",
      "Cuối log là các **Full GC liên tiếp** vì cấp phát thất bại, mỗi lần gần 3 giây mà thu hồi được gần như **không gì**",
      "Chuỗi Full GC không thu hồi được gì là dấu hiệu kinh điển của **rò rỉ bộ nhớ**, không phải của heap quá nhỏ",
      "Vì vậy **không** nên nới heap: nó chỉ dời thời điểm sự cố ra xa hơn và làm mỗi lần Full GC còn lâu hơn",
      "Việc đúng cần làm là lấy **heap dump** rồi tìm xem cái gì đang giữ tham chiếu",
    ],
    model: "Log này không nói về việc GC chạy quá nhiều mà nói về việc GC không thu hồi được gì. Đọc theo từng chi tiết: mỗi lần Young GC đi từ 512M xuống 498M, tức chỉ giải phóng khoảng 14M trong khi phần lớn object sống sót qua lần thu gom — với GC thế hệ mới thì tỉ lệ sống sót cao như vậy đã là bất thường, vì giả định nền tảng là phần lớn object chết non. Quan trọng hơn là mức chiếm dụng **sau** mỗi lần GC tăng đơn điệu suốt cả log, từ 498M lên 3801M; đó không phải dao động mà là một tập object sống ngày càng lớn. Đoạn cuối chốt lại chẩn đoán: các Full GC liên tiếp do cấp phát thất bại, mỗi lần gần 3 giây mà đi từ 3801M xuống 3799M — gần như không thu hồi được gì. Một Full GC không giải phóng được gì nghĩa là những object ấy vẫn còn tham chiếu sống, tức chúng không phải rác; và đó là dấu hiệu kinh điển của rò rỉ bộ nhớ, không phải của heap quá nhỏ. Nên tôi không đồng ý nới heap lên 8G, và lý do phải nói rõ hơn là \"không giải quyết gốc rễ\": nó làm tình hình **xấu hơn** theo hai cách. Nó dời thời điểm sự cố ra xa nên bằng chứng loãng đi và lỗi khó truy hơn; và vì thời gian Full GC tăng theo lượng bộ nhớ sống phải quét, mỗi lần dừng sẽ còn lâu hơn 3 giây khi nó thực sự đến. Việc đúng là lấy heap dump ngay trong giai đoạn Full GC liên tiếp — lúc đó tập object sống chính là tập thủ phạm, dễ đọc hơn nhiều so với dump lấy lúc mới khởi động — rồi tìm dominator và đường tham chiếu từ GC root để biết cái gì đang giữ chúng. Nới heap chỉ nên là biện pháp tình thế có thời hạn, kèm một cảnh báo dựa trên mức chiếm dụng sau GC chứ không dựa trên mức chiếm dụng đỉnh, vì chính đường tăng đơn điệu đó mới là chỉ báo sớm.",
    redFlags: [
      "Nới heap và coi đó là cách sửa — chuỗi Full GC không thu hồi được gì đã loại giả thuyết heap nhỏ",
      "Chỉ nhìn thời gian dừng và kết luận \"cần collector độ trễ thấp\"",
      "Đổi tham số GC trước khi lấy heap dump",
      "Nhìn mức chiếm dụng đỉnh thay vì mức chiếm dụng **sau** mỗi lần GC",
    ],
    probes: [
      "Đại lượng nào trong log là chỉ báo sớm đáng đặt cảnh báo?",
      "Vì sao heap dump lấy trong giai đoạn Full GC lại dễ đọc hơn?",
      "Nếu mức chiếm dụng sau GC bằng phẳng mà thời gian dừng vẫn cao thì chẩn đoán đổi thế nào?",
    ],
    refs: ["ocnj-04", "ocnj-05"],
  },
  {
    id: "ocnj-iq11",
    field: "ocnj",
    topic: "ocnj-gc",
    level: 3,
    minutes: 11,
    question: "Bạn chọn garbage collector cho hai workload: một API giao dịch nhạy độ trễ, và một job batch chạy đêm. Bạn chọn thế nào, và vì sao không có câu trả lời chung?",
    tradeoffs: [
      {
        option: "Collector ưu tiên **throughput** cho job batch",
        when: "Với nhiều batch job, thời gian dừng **hàng chục giây cũng không thực sự liên quan**, miễn thông lượng cao và công việc xong trong cửa sổ đã định. Sách nói thẳng một thuật toán ưu tiên hiệu suất CPU của GC được ưa chuộng hơn rất nhiều so với một thuật toán low-pause bằng mọi giá.",
      },
      {
        option: "Collector **độ trễ thấp** cho API giao dịch",
        when: "Khi độ trễ đuôi là yêu cầu nghiệp vụ. Đổi lại là chi phí CPU cao hơn cho GC và thường cần nhiều bộ nhớ hơn — ta trả thông lượng để mua tính nhất quán của các lần dừng.",
      },
      {
        option: "Giữ mặc định và **đo trước khi đổi**",
        when: "Luôn là điểm khởi đầu. Sách nhấn: không có thuật toán GC đa dụng nào tối ưu đồng thời mọi mối quan tâm, nên việc chọn phải dựa trên số liệu của workload cụ thể chứ không dựa trên tiếng tăm của collector.",
      },
    ],
    mustCover: [
      "GC là hệ thống con **cắm được**: cùng một chương trình chạy với collector khác nhau **không đổi ngữ nghĩa**, chỉ đổi hiệu năng",
      "Không có thuật toán GC đa dụng nào tối ưu đồng thời **tất cả** các mối quan tâm — đó là lý do có nhiều collector",
      "Năm mối quan tâm phải cân: độ dài lần dừng, throughput, **tần suất** dừng, hiệu suất thu hồi, và **tính nhất quán** của các lần dừng",
      "Pause time thu hút **chú ý không tương xứng**; với nhiều workload nó không phải đặc tính hữu ích",
      "Định nghĩa throughput theo tỉ lệ thời gian trong GC có **bẫy**: ứng dụng chạy kém sẽ tạo ít rác hơn nên tỉ lệ GC thấp hơn, mà không hề tốt hơn",
      "**Compaction** đặt object liên quan gần nhau, nên có thể **đáng** trả thêm thời gian GC để đổi lấy đọc bộ nhớ hiệu quả hơn",
    ],
    model: "Câu \"không có câu trả lời chung\" có nền tảng kỹ thuật, không phải lời nói tránh: trong OpenJDK, GC là một hệ thống con cắm được, nên cùng một chương trình chạy với các collector khác nhau mà không đổi ngữ nghĩa — chỉ hiệu năng biến động, và biến động đáng kể. Lý do tồn tại nhiều collector là GC quá tổng quát để một thuật toán phù hợp mọi workload, nên mỗi thuật toán là một thoả hiệp; sách phát biểu thẳng rằng không có thuật toán GC đa dụng đơn lẻ nào tối ưu đồng thời tất cả các mối quan tâm. Năm mối quan tâm cần cân là độ dài lần dừng, throughput tính theo tỉ lệ thời gian GC, tần suất dừng, hiệu suất thu hồi, và tính nhất quán của các lần dừng. Với job batch, tôi chọn collector ưu tiên throughput, và lý do đáng nói vì nó ngược trực giác nhiều người: với nhiều batch job, thời gian dừng thậm chí hàng chục giây cũng không thực sự liên quan, miễn thông lượng cao và công việc hoàn thành trong cửa sổ đã định — nên một thuật toán low-pause bằng mọi giá là trả tiền cho thứ không dùng. Với API giao dịch thì ngược lại, độ trễ đuôi là yêu cầu nghiệp vụ nên tôi trả thêm CPU và bộ nhớ để mua tính nhất quán của các lần dừng. Hai cái bẫy tôi sẽ nêu chủ động. Thứ nhất, pause time thu hút lượng chú ý không tương xứng và với nhiều workload nó không phải đặc tính hiệu năng hữu ích — nhìn nó tách biệt dễ dẫn tới quyết định sai. Thứ hai, định nghĩa throughput theo tỉ lệ thời gian trong GC có một nghịch lý: nếu ứng dụng đang hoạt động kém vì một yếu tố bên ngoài thì nó tạo ra ít rác hơn, GC có ít việc hơn, và tỉ lệ thời gian GC **giảm** — con số trông đẹp hơn trong khi hệ thống tệ hơn. Cuối cùng, một điểm hay bị bỏ qua: compaction có xu hướng đặt các object liên quan gần nhau, mà object gần nhau thì đọc hiệu quả hơn vì có nhiều khả năng đã nằm trong cache line đúng; ứng dụng dành rất nhiều thời gian cấp phát và đọc bộ nhớ, nên bỏ thêm chút thời gian trong GC để đổi lấy điều đó có thể là khoản đầu tư tốt. Và như mọi khi, phải đo chứ không đoán.",
    redFlags: [
      "Chọn collector độ trễ thấp cho mọi thứ, kể cả batch — trả CPU cho một đặc tính không ai dùng",
      "Lấy tỉ lệ thời gian trong GC làm chỉ số sức khoẻ mà không thấy nghịch lý \"ứng dụng kém thì tỉ lệ đẹp hơn\"",
      "Nhìn pause time tách biệt khỏi tần suất dừng và tính nhất quán",
      "Đổi collector mà chưa đo, dựa vào tiếng tăm",
      "Bỏ qua compaction như thể nó chỉ là chi phí, không phải khoản đầu tư vào tính cục bộ bộ nhớ",
    ],
    probes: [
      "Ứng dụng của bạn đang có tỉ lệ thời gian GC rất thấp — điều đó chắc chắn là tin tốt không?",
      "Vì sao tính nhất quán của các lần dừng có thể quan trọng hơn độ dài lần dừng?",
      "Compaction giúp gì cho tốc độ đọc bộ nhớ?",
    ],
    refs: ["ocnj-05", "ocnj-04"],
  },
  {
    id: "ocnj-iq12",
    field: "ocnj",
    topic: "ocnj-gc",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một dịch vụ định tuyến có p99 độ trễ 40ms nhưng p999 là 1,8 giây. Đội đã đổi sang một collector độ trễ thấp và p999 chỉ giảm còn 1,6 giây. GC log cho thấy lần dừng dài nhất là 22ms. Mức chiếm dụng heap sau GC bằng phẳng, allocation rate khoảng 340MB/s.",
      scale: "26.000 request mỗi giây, nên p999 tương ứng khoảng 26 request mỗi giây vượt 1,5 giây. Khách hàng lớn nhất có SLA p999 dưới 500ms và đang chuẩn bị gia hạn hợp đồng.",
      constraints: "Không được tăng bộ nhớ container — trần đã chốt cho cả cụm. Không đổi được ngôn ngữ hay framework. Phải có kết luận trong 1 tuần vì kỳ gia hạn hợp đồng.",
    },
    question: "GC log nói lần dừng dài nhất là 22ms mà p999 lại 1,8 giây. Điều đó cho bạn kết luận gì, và bạn đi tìm thủ phạm thế nào?",
    mustCover: [
      "Lần dừng dài nhất 22ms **không thể** tạo ra đuôi 1,8 giây — nên GC gần như chắc chắn **không** phải thủ phạm chính",
      "Việc đổi collector chỉ giảm được 0,2 giây cũng là **bằng chứng loại** GC, không phải bằng chứng cần chỉnh tiếp",
      "Mức chiếm dụng sau GC bằng phẳng nghĩa là **không rò rỉ** — loại thêm một giả thuyết",
      "Phải nghi những nguồn dừng **không phải GC**: safepoint kéo dài, biên dịch lại, hoán trang, khoá, hàng đợi, bên thứ ba",
      "Một đuôi 1,8 giây trên nền p99 40ms thường là **xếp hàng** ở đâu đó, không phải một thao tác chậm",
      "Cách tìm: đo **phân bố** theo từng tầng để xác định thời gian dồn ở tầng nào, thay vì chỉnh tiếp GC",
      "Allocation rate 340MB/s là số cần đối chiếu với ngân sách bộ nhớ, nhưng nó **không** giải thích được đuôi khi các lần dừng đều ngắn",
    ],
    model: "Con số quan trọng nhất trong đề bài là sự bất tương xứng: lần dừng GC dài nhất 22ms, mà đuôi p999 là 1,8 giây — chênh nhau gần hai bậc độ lớn. Kể cả nếu nhiều lần dừng rơi trúng một request thì cũng không cộng lại thành 1,8 giây. Vậy kết luận đầu tiên, và là kết luận đội đã bỏ qua, là GC không phải thủ phạm chính. Việc đổi sang collector độ trễ thấp mà chỉ cải thiện 0,2 giây củng cố thêm điều đó: đó là một thí nghiệm đã cho kết quả âm, nên nên đọc là bằng chứng loại bỏ GC chứ không phải tín hiệu cần chỉnh GC sâu hơn. Mức chiếm dụng heap sau GC bằng phẳng cũng loại giả thuyết rò rỉ. Nên tôi sẽ dừng hẳn việc chỉnh GC và đi tìm ở nơi khác. Hình dạng \"p99 rất tốt, p999 rất xấu\" thường không phải một thao tác chậm mà là hiện tượng **xếp hàng**: phần lớn request đi qua bình thường, còn một số nhỏ chờ sau một thứ gì đó bị chiếm. Những ứng viên tôi xét theo thứ tự: các nguồn dừng không phải GC như safepoint kéo dài hay một đợt biên dịch lại; hoán trang hoặc áp lực bộ nhớ ở mức hệ điều hành, đáng nghi vì trần bộ nhớ container đã chốt và allocation rate 340MB/s không nhỏ; tranh chấp khoá hoặc hàng đợi nội bộ đầy; và một lời gọi ra bên ngoài có đuôi dài mà p99 của ta che mất. Cách tìm thì tôi không đoán mà đo phân bố theo tầng: gắn mốc thời gian ở biên mỗi tầng rồi xem với những request thuộc nhóm chậm nhất, thời gian dồn ở đâu — đó là câu hỏi mà một con số p999 tổng hợp không bao giờ trả lời được. Song song, tôi bật profiling lấy mẫu để xem trong những khoảng có đuôi thì thread đang ở đâu. Về ràng buộc một tuần: tôi sẽ ưu tiên đúng bước đo phân bố theo tầng, vì nó là bước duy nhất chắc chắn thu hẹp được không gian giả thuyết, và tránh lặp lại sai lầm vừa rồi là đầu tư vào một giả thuyết mà dữ liệu đã loại từ đầu. Còn allocation rate 340MB/s tôi vẫn ghi lại và đối chiếu với ngân sách bộ nhớ, nhưng nói rõ: với các lần dừng đều ngắn thì nó chưa giải thích được đuôi, nên nó là một hướng phụ chứ không phải hướng chính.",
    redFlags: [
      "Tiếp tục chỉnh tham số GC sau khi log đã cho thấy lần dừng dài nhất chỉ 22ms",
      "Đọc việc đổi collector không hiệu quả như dấu hiệu \"cần collector khác nữa\" thay vì như bằng chứng loại GC",
      "Đề nghị tăng bộ nhớ — ràng buộc đã cấm, và chưa có bằng chứng bộ nhớ là nguyên nhân",
      "Báo cáo p999 tổng hợp cho khách hàng mà không phân tích được thời gian dồn ở tầng nào",
      "Bỏ qua hoàn toàn khả năng thủ phạm nằm ngoài JVM",
    ],
    probes: [
      "Hình dạng \"p99 tốt, p999 xấu\" gợi cơ chế gì, và vì sao?",
      "Bạn đo phân bố theo tầng cụ thể bằng cách nào trong một tuần?",
      "Nếu thủ phạm là safepoint kéo dài, bạn sẽ thấy dấu hiệu gì?",
    ],
    refs: ["ocnj-05", "ocnj-12"],
  },
];
