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

  // ===== ocnj-cloud — Phần cứng, OS và cloud stack (ocnj-iq13–ocnj-iq16) =====
  {
    id: "ocnj-iq13",
    field: "ocnj",
    topic: "ocnj-cloud",
    level: 1,
    minutes: 5,
    question: "\"Mechanical sympathy\" nghĩa là gì, và với một lập trình viên Java — vốn làm việc trên một máy ảo — thì hiểu biết về phần cứng còn giúp được gì?",
    mustCover: [
      "Mechanical sympathy là ý tưởng rằng **hiểu biết về phần cứng là vô giá** khi ta cần vắt kiệt thêm hiệu năng",
      "Nguồn gốc là câu của Jackie Stewart: không cần là kỹ sư để đua xe, nhưng phải có mechanical sympathy",
      "Nó **không chỉ** dùng cho các trường hợp cực đoan — hiểu biết nền tảng cũng hữu ích khi xử lý vấn đề production",
      "Với Java, JVM che phần cứng nhưng **không xoá** nó: tính cục bộ bộ nhớ, cache line, dự đoán nhánh vẫn quyết định hiệu năng thật",
      "Đây là lý do những thứ như **compaction** của GC lại quan trọng: object gần nhau thì có nhiều khả năng nằm sẵn trong cache line đúng",
    ],
    model: "Mechanical sympathy là ý tưởng rằng hiểu biết về phần cứng là vô giá cho những trường hợp ta cần vắt kiệt thêm hiệu năng. Cụm từ này do Martin Thompson đặt ra, tham chiếu trực tiếp tới câu của Jackie Stewart: bạn không cần phải là kỹ sư để trở thành tay đua, nhưng bạn phải có mechanical sympathy. Điểm tôi muốn nhấn là sách không đặt nó riêng cho các trường hợp cực đoan: có hiểu biết nền tảng về phần cứng và hệ điều hành cũng hữu ích khi xử lý các vấn đề production thông thường và khi tìm cách cải thiện hiệu năng tổng thể. Với Java thì lập luận \"tôi làm việc trên máy ảo nên không cần biết phần cứng\" nghe hợp lý mà sai, vì JVM che phần cứng nhưng không xoá nó. Tính cục bộ bộ nhớ vẫn quyết định: một vòng lặp đi qua dữ liệu liền kề nhanh hơn nhiều lần cùng vòng lặp đi qua dữ liệu rải rác, dù bytecode gần như giống nhau. Cache line vẫn là đơn vị thật của việc đọc bộ nhớ. Dự đoán nhánh vẫn quyết định chi phí của một điều kiện trong vòng lặp nóng. Và có một chỗ hai tầng gặp nhau rất rõ: compaction của garbage collector có xu hướng đặt các object liên quan gần nhau, mà gần nhau thì đọc hiệu quả hơn vì có nhiều khả năng đã nằm sẵn trong cache line đúng — nên một đặc tính tưởng như thuần túy thuộc GC lại là một quyết định về tính cục bộ bộ nhớ. Nói cách khác, mechanical sympathy với lập trình viên Java không có nghĩa là viết mã như C, mà là biết đủ để hiểu vì sao hai đoạn mã tương đương về logic lại khác nhau về hiệu năng, và để không bị bất ngờ khi một phép đo không khớp với trực giác về số lệnh.",
    redFlags: [
      "Nói phần cứng không liên quan vì JVM đã trừu tượng hoá — JVM che chứ không xoá",
      "Coi mechanical sympathy chỉ dành cho mã tần suất cực cao, trong khi sách nói nó hữu ích cả cho vấn đề production thường ngày",
      "Không nối được phần cứng với bất cứ quyết định nào ở tầng JVM, chẳng hạn compaction",
    ],
    probes: [
      "Cho một cặp đoạn mã tương đương logic mà khác nhau về tính cục bộ bộ nhớ",
      "Vì sao compaction của GC lại là một quyết định về phần cứng?",
      "Một mô hình hệ thống đơn giản giúp bạn suy luận về những giới hạn nào?",
    ],
    refs: ["ocnj-07"],
  },
  {
    id: "ocnj-iq14",
    field: "ocnj",
    topic: "ocnj-cloud",
    level: 2,
    minutes: 8,
    code: {
      lang: "yaml",
      text: `# Deployment của một dịch vụ Java, JDK 11 sớm
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: api
          image: registry.local/api:1.9
          resources:
            limits:
              memory: "1Gi"
              cpu: "2"
            requests:
              memory: "1Gi"
              cpu: "500m"
          env:
            - name: JAVA_OPTS
              value: "-Xmx900m"
          # không có readinessProbe, chỉ có livenessProbe
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 10`,
      },
    question: "Cấu hình này có mấy vấn đề riêng của Java khi chạy trong container? Chỉ ra từng cái và nói hậu quả quan sát được của nó.",
    mustCover: [
      "`-Xmx900m` sát `limits.memory` 1Gi nhưng **heap không phải toàn bộ** bộ nhớ JVM: metaspace, thread stack, code cache, bộ nhớ ngoài heap đều nằm ngoài `-Xmx`",
      "Hậu quả: tiến trình bị **kernel giết** vì vượt giới hạn bộ nhớ, biểu hiện là container bị khởi động lại chứ không phải `OutOfMemoryError`",
      "Đặt `-Xmx` cứng làm mất khả năng **thích ứng theo giới hạn container** — nên dùng tỉ lệ theo bộ nhớ khả dụng",
      "`requests.cpu` 500m trong khi `limits` 2 nghĩa là pod có thể bị **tiết chế CPU**, và JVM lại nhìn số CPU để chọn số thread GC và kích thước pool mặc định",
      "**Thiếu `readinessProbe`** là vấn đề nặng nhất về độ trễ: lưu lượng vào ngay khi tiến trình lên, tức vào đúng giai đoạn chưa nóng máy",
      "`livenessProbe` không thay được `readinessProbe`: nó trả lời \"còn sống\", không trả lời \"sẵn sàng nhận tải\"",
    ],
    model: "Có bốn vấn đề, xếp theo mức ảnh hưởng. Vấn đề nặng nhất về độ trễ là thiếu `readinessProbe`. Khi chỉ có `livenessProbe`, lưu lượng được đưa vào ngay khi pod được coi là chạy, tức đúng vào giai đoạn JVM còn thông dịch và JIT chưa biên dịch các đường nóng — quan sát được là một đợt độ trễ cao sau mỗi lần triển khai. Hai probe trả lời hai câu khác nhau: liveness nói \"tiến trình còn sống, đừng giết tôi\", readiness nói \"tôi sẵn sàng nhận tải\", và cái thứ hai là cái load balancer cần. Vấn đề nặng nhất về ổn định là quan hệ giữa `-Xmx900m` và `limits.memory` 1Gi. Heap không phải toàn bộ bộ nhớ của JVM: metaspace, stack của từng thread, code cache của JIT, bộ đệm ngoài heap và bộ nhớ mà thư viện native dùng đều nằm ngoài `-Xmx`. Nên tổng bộ nhớ tiến trình sẽ vượt 900m khá xa, và khi vượt 1Gi thì kernel giết tiến trình — quan sát được là container bị khởi động lại đột ngột, **không** phải một `OutOfMemoryError` trong log, và đó chính là điểm làm nhiều đội truy sai hướng. Vấn đề thứ ba là việc đặt `-Xmx` cứng: nó làm cấu hình mất khả năng thích ứng, nên mỗi lần đổi giới hạn container lại phải sửa hai chỗ và rất dễ lệch; đặt heap theo tỉ lệ bộ nhớ khả dụng an toàn hơn. Vấn đề thứ tư là khoảng cách giữa `requests.cpu` 500m và `limits.cpu` 2: pod có thể bị tiết chế khi cụm đông, và điều này tương tác xấu với Java vì JVM nhìn số CPU nó thấy để chọn số thread GC cùng kích thước một số pool mặc định — nên một pod bị tiết chế có thể đồng thời đang chạy một cấu hình GC được chọn cho một máy rộng hơn thực tế nó được dùng. Quan sát được là độ trễ dao động theo mức đông của cụm, thứ rất khó truy nếu không biết cơ chế.",
    redFlags: [
      "Chỉ nói \"nên tăng memory limit\" mà không nêu heap chỉ là một phần bộ nhớ JVM",
      "Tìm `OutOfMemoryError` trong log khi container bị kernel giết — sẽ không có dòng nào",
      "Coi `livenessProbe` là đủ vì \"nó cũng kiểm tra HTTP\"",
      "Bỏ qua việc JVM chọn tham số mặc định theo số CPU nó quan sát được",
    ],
    probes: [
      "Ngoài heap, còn những vùng bộ nhớ nào của JVM mà `-Xmx` không kiểm soát?",
      "Bạn phân biệt container bị kernel giết với JVM ném lỗi hết bộ nhớ bằng cách nào?",
      "`readinessProbe` của bạn nên kiểm gì để thật sự nói được \"sẵn sàng nhận tải\"?",
    ],
    refs: ["ocnj-09", "ocnj-08"],
  },
  {
    id: "ocnj-iq15",
    field: "ocnj",
    topic: "ocnj-cloud",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ Java cần thêm năng lực. Bạn chọn cho pod to hơn hay chạy nhiều pod hơn?",
    tradeoffs: [
      {
        option: "Nhiều pod nhỏ",
        when: "Workload chia nhỏ được và không có state dùng chung. Cô lập lỗi tốt hơn, co giãn mịn hơn, và dễ lấp chỗ trống trên cụm. Cái giá riêng của Java là **mỗi pod phải nóng máy lại**, nên tổng chi phí nóng máy tăng theo số pod và theo tần suất thay pod.",
      },
      {
        option: "Ít pod nhưng to",
        when: "Khi có bộ đệm trong tiến trình đáng kể, hoặc khi chi phí nóng máy và bộ nhớ nền của JVM chiếm tỉ lệ lớn. JVM dùng bộ nhớ hiệu quả hơn ở một tiến trình to so với nhiều tiến trình nhỏ cộng lại, và heap to cho GC nhiều không gian xoay xở hơn.",
      },
      {
        option: "Đo cả hai trên workload thật rồi chọn",
        when: "Luôn là bước cuối trước khi chốt, vì hai hướng trên đổi nhau ở những đại lượng khác nhau — thông lượng trên mỗi đơn vị tài nguyên, độ trễ đuôi, thời gian phục hồi — và không có thứ tự ưu tiên chung cho mọi dịch vụ.",
      },
    ],
    mustCover: [
      "Java có một chi phí **cố định theo tiến trình** mà nhiều runtime khác không có: bộ nhớ nền và giai đoạn nóng máy",
      "Vì vậy nhân số pod lên là nhân cả chi phí đó lên, khác với việc chia một tiến trình lớn thành nhiều tiến trình nhỏ ở runtime khởi động tức thì",
      "Bộ đệm trong tiến trình **không chia sẻ được** giữa các pod, nên nhiều pod nhỏ làm giảm tỉ lệ hit của cache",
      "Đổi lại, nhiều pod cho **cô lập lỗi** và co giãn mịn hơn, và dễ xếp lên cụm hơn",
      "Phải xét cả tương tác với `requests`/`limits`: pod to dễ bị cụm từ chối xếp chỗ hơn",
      "Quyết định cuối phải dựa trên **đo trên workload thật**, không dựa trên nguyên tắc chung",
    ],
    model: "Câu này với một dịch vụ Java khác với cùng câu hỏi cho một runtime khởi động tức thì, vì Java có một chi phí cố định theo tiến trình: bộ nhớ nền của JVM, và giai đoạn nóng máy trước khi JIT biên dịch các đường nóng. Nhân số pod lên là nhân cả hai thứ đó lên. Nên tôi bắt đầu bằng việc hỏi hai câu định lượng: bộ nhớ nền chiếm bao nhiêu phần trăm giới hạn của một pod, và một pod sống bao lâu so với thời gian nó cần để nóng. Nếu bộ nhớ nền chiếm phần lớn và pod bị thay thường xuyên thì nhiều pod nhỏ là một cách trả tiền cho chi phí cố định nhiều lần mà không nhận thêm năng lực tương ứng. Yếu tố thứ hai là bộ đệm trong tiến trình: nó không chia sẻ được giữa các pod, nên chia cùng một lượng tải cho gấp bốn số pod nghĩa là mỗi cache chỉ thấy một phần tư lưu lượng và tỉ lệ hit giảm — với dịch vụ dựa nhiều vào cache nội bộ thì đây thường là yếu tố quyết định. Ngược lại, nhiều pod nhỏ có những lợi thế thật mà tôi không bỏ qua: một pod hỏng ảnh hưởng phần nhỏ năng lực thay vì phần lớn, co giãn mịn hơn nên theo tải sát hơn, và pod nhỏ dễ được cụm tìm chỗ xếp hơn — pod to có thể nằm chờ vì không node nào còn đủ chỗ, thứ biến một quyết định kiến trúc thành một vấn đề vận hành. Heap to cũng cho GC nhiều không gian xoay xở hơn, dù điều đó đi kèm lần dừng có thể dài hơn nên phải đối chiếu với yêu cầu độ trễ. Vì hai hướng đổi nhau ở những đại lượng khác nhau — thông lượng trên mỗi đơn vị tài nguyên, độ trễ đuôi, thời gian phục hồi — tôi không chốt bằng nguyên tắc mà dựng cả hai cấu hình trên workload thật, đo đủ ba đại lượng đó, rồi chọn theo cái nào đang là ràng buộc của dịch vụ này.",
    redFlags: [
      "Trả lời \"cứ nhiều pod nhỏ vì đó là cloud native\" mà không xét chi phí cố định theo tiến trình của Java",
      "Bỏ qua việc bộ đệm trong tiến trình không chia sẻ được giữa các pod",
      "Không xét việc pod to khó được xếp chỗ trên cụm",
      "Chốt mà không đo trên workload thật",
    ],
    probes: [
      "Bộ nhớ nền của JVM chiếm bao nhiêu trong một pod 512Mi, và bạn đo nó thế nào?",
      "Dịch vụ dựa nhiều vào cache nội bộ thì lựa chọn của bạn đổi ra sao?",
      "Heap to giúp gì và làm xấu gì cho GC?",
    ],
    refs: ["ocnj-09", "ocnj-08"],
  },
  {
    id: "ocnj-iq16",
    field: "ocnj",
    topic: "ocnj-cloud",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ chạy tốt hàng tuần rồi đột ngột có 3 pod bị khởi động lại trong 10 phút, lặp lại vài ngày một lần. Log ứng dụng dừng giữa câu, không có `OutOfMemoryError`, không có exception. GC log cho thấy heap ổn định quanh 60% suốt thời gian đó. Pod có `limits.memory` 2Gi và `-Xmx1600m`.",
      scale: "52 pod. Mỗi đợt khởi động lại làm mất khoảng 6% năng lực trong 90 giây, và vì trùng giờ cao điểm nên đã gây hai lần vượt SLA trong tháng.",
      constraints: "Không được nâng `limits.memory` — trần bộ nhớ toàn cụm đã chốt và 11 đội khác đang dùng chung. Không đổi được ứng dụng sang runtime khác. Phải đưa ra chẩn đoán có bằng chứng, vì lần trước đội đã đoán sai và tốn hai tuần.",
      },
    question: "Heap ổn định 60% và không có `OutOfMemoryError` — vậy vì sao pod chết? Nêu chẩn đoán và cách bạn chứng minh nó.",
    mustCover: [
      "Không có `OutOfMemoryError` mà tiến trình dừng giữa câu là dấu hiệu tiến trình bị **kernel giết**, không phải JVM tự kết thúc",
      "Heap ổn định 60% chỉ nói về **heap**, và heap **không phải** toàn bộ bộ nhớ JVM",
      "Thủ phạm nằm ở vùng **ngoài heap**: metaspace, code cache, stack của thread, bộ đệm trực tiếp, bộ nhớ thư viện native",
      "`-Xmx1600m` trên `limits` 2Gi chỉ để lại khoảng 400Mi cho **tất cả** phần còn lại — quá mỏng",
      "Tính chất \"chạy tốt hàng tuần rồi đột ngột\" gợi một vùng ngoài heap **tăng dần**, chẳng hạn số thread hoặc bộ đệm trực tiếp bị rò",
      "Chứng minh bằng cách theo dõi **bộ nhớ toàn tiến trình** và từng vùng ngoài heap, không chỉ heap",
      "Trong ràng buộc không nâng limit: **giảm `-Xmx`** để chừa chỗ, và chặn nguồn tăng ở vùng ngoài heap",
    ],
    model: "Ba dấu hiệu cùng chỉ một hướng. Log dừng giữa câu và không có `OutOfMemoryError` nghĩa là JVM không tự kết thúc — nếu hết heap thì nó sẽ ném lỗi và ghi được ít nhất một dòng. Tiến trình biến mất không kịp ghi gì là hành vi của việc bị kernel giết vì vượt giới hạn bộ nhớ của container. Và heap ổn định 60% không mâu thuẫn với điều đó chút nào, vì nó chỉ nói về heap: metaspace, code cache của JIT, stack của từng thread, bộ đệm trực tiếp ngoài heap và bộ nhớ mà thư viện native cấp phát đều nằm ngoài `-Xmx` nhưng đều tính vào giới hạn container. Làm số học thì thấy ngay chỗ mỏng: `-Xmx1600m` trên `limits.memory` 2Gi chỉ chừa khoảng 400Mi cho tất cả phần còn lại, mà riêng metaspace cộng code cache cộng stack của vài trăm thread đã ăn gần hết. Tính chất \"chạy tốt hàng tuần rồi đột ngột chết theo đợt\" gợi thêm một điều: có một vùng ngoài heap tăng dần cho tới khi vượt ngưỡng — ứng viên hàng đầu là số thread tăng không giới hạn, hoặc bộ đệm trực tiếp bị cấp phát mà không được giải phóng, hoặc một thư viện native rò rỉ. Việc ba pod chết trong 10 phút rồi lặp lại vài ngày một lần khớp với việc chúng cùng khởi động cùng thời điểm nên cùng đạt ngưỡng cùng lúc. Về cách chứng minh, và đây là phần đề bài đòi vì đội đã đoán sai một lần: tôi không đổi gì trước khi có dữ liệu. Việc cần làm là theo dõi bộ nhớ **toàn tiến trình** thay vì chỉ heap, tách theo từng vùng — heap, metaspace, code cache, thread, bộ đệm trực tiếp — và vẽ chúng theo thời gian trên một pod cho tới khi nó chết. Vùng nào có đường tăng đơn điệu chính là thủ phạm, và đó là bằng chứng chứ không phải giả thuyết. Song song, tôi ghi lại số thread theo thời gian vì nó là đại lượng rẻ nhất để kiểm và là nguyên nhân thường gặp nhất. Về can thiệp trong ràng buộc không được nâng giới hạn: giảm `-Xmx` để chừa chỗ thật cho vùng ngoài heap là việc làm được ngay và an toàn vì heap chỉ dùng 60%; nhưng phải nói rõ đó là cầm máu, không phải cách sửa — nếu có một vùng đang tăng đơn điệu thì giảm heap chỉ dời thời điểm chết, và cách sửa thật là chặn nguồn tăng đó.",
    redFlags: [
      "Đi tìm `OutOfMemoryError` trong log rồi kết luận \"không phải vấn đề bộ nhớ\"",
      "Lấy heap ổn định 60% làm bằng chứng bộ nhớ khoẻ — heap không phải toàn bộ bộ nhớ tiến trình",
      "Đòi nâng `limits.memory` — ràng buộc đã cấm, và nó cũng chỉ dời thời điểm chết",
      "Giảm `-Xmx` rồi tuyên bố đã sửa xong mà không tìm nguồn tăng ở vùng ngoài heap",
      "Đoán thêm một giả thuyết nữa mà không đo, đúng sai lầm đã tốn hai tuần lần trước",
    ],
    probes: [
      "Bạn theo dõi bộ nhớ ngoài heap bằng những đại lượng nào?",
      "Vì sao ba pod lại chết gần như cùng lúc rồi lặp lại theo chu kỳ?",
      "Nếu không vùng nào tăng đơn điệu mà pod vẫn chết thì bạn nghĩ tới gì tiếp?",
    ],
    refs: ["ocnj-09", "ocnj-07"],
  },

  // ===== ocnj-observe — Observability và profiling (ocnj-iq17–ocnj-iq20) =====
  {
    id: "ocnj-iq17",
    field: "ocnj",
    topic: "ocnj-observe",
    level: 1,
    minutes: 5,
    question: "Ba trụ cột của observability là gì? Nói mỗi trụ cột trả lời được câu hỏi nào mà hai trụ cột kia không trả lời được.",
    mustCover: [
      "Ba trụ cột là **metrics**, **logs** và **traces**",
      "Chúng khác nhau ở những khía cạnh **nền tảng về hình dáng và hình thức** của dữ liệu, không chỉ khác về công cụ",
      "**Metrics** là đại lượng tổng hợp theo thời gian — trả lời \"có gì đang bất thường, và từ khi nào\"",
      "**Logs** là sự kiện rời rạc có ngữ cảnh — trả lời \"chuyện gì đã xảy ra với trường hợp cụ thể này\"",
      "**Traces** nối các bước của **một** request xuyên nhiều thành phần — trả lời \"thời gian dồn ở tầng nào\"",
      "Với hệ phân tán thì trace là trụ cột không thay thế được: metrics và logs đều mất quan hệ **nhân quả xuyên dịch vụ**",
    ],
    model: "Ba trụ cột là metrics, logs và traces, và sách nhấn rằng chúng chỉ những nguồn dữ liệu khác nhau ở các khía cạnh nền tảng về hình dáng và hình thức — nghĩa là khác biệt không nằm ở công cụ mà ở bản chất dữ liệu, nên không trụ cột nào thay được trụ cột khác. Metrics là đại lượng tổng hợp theo thời gian: rẻ để lưu, rẻ để truy vấn trên khoảng dài, nên nó là thứ trả lời \"có gì đang bất thường, và bất thường từ khi nào\". Cái nó không làm được là nói cho ta biết chuyện gì xảy ra với một trường hợp cụ thể, vì tổng hợp đã xoá mất từng cá thể. Logs là sự kiện rời rạc kèm ngữ cảnh, nên nó trả lời đúng câu kia: request này thất bại vì sao, giá trị đầu vào là gì, nhánh nào đã chạy. Cái nó không làm được là cho một cái nhìn tổng hợp — đọc log để trả lời \"độ trễ p99 tuần này thế nào\" là dùng sai công cụ — và trong hệ phân tán thì log của từng dịch vụ không tự nối lại thành một câu chuyện. Traces lấp đúng khoảng đó: chúng nối các bước của **một** request xuyên nhiều thành phần, nên trả lời được \"thời gian dồn ở tầng nào\" và \"thành phần nào gọi thành phần nào theo thứ tự nào\". Đó là câu hỏi mà cả metrics lẫn logs đều không trả lời được, vì cả hai đều mất quan hệ nhân quả xuyên dịch vụ — metrics mất vì tổng hợp, logs mất vì rời rạc theo từng tiến trình. Trong thực hành thì ba trụ cột thường dùng theo thứ tự: metrics báo có vấn đề và khoanh thời gian, traces khoanh tầng, logs cho chi tiết ở tầng đó.",
    redFlags: [
      "Coi ba trụ cột là ba công cụ thay thế nhau, chọn một là đủ",
      "Dùng log để trả lời câu hỏi tổng hợp, hoặc dùng metrics để điều tra một request cụ thể",
      "Không nêu được vì sao trace là thứ không thay thế được trong hệ phân tán",
    ],
    probes: [
      "Bạn dùng ba trụ cột theo thứ tự nào khi có sự cố, và vì sao thứ tự đó?",
      "Thêm nhiều metric có bù được việc thiếu trace không?",
      "Antipattern nào hay gặp trong kiến trúc observability?",
    ],
    refs: ["ocnj-10"],
  },
  {
    id: "ocnj-iq18",
    field: "ocnj",
    topic: "ocnj-observe",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `@RestController
public class OrderController {

    private final MeterRegistry registry;

    @PostMapping("/orders")
    public Order create(@RequestBody OrderRequest req) {
        // Đo thời gian xử lý
        long start = System.nanoTime();
        Order o = service.create(req);
        registry.timer("order.create",
                       "customer", req.getCustomerId(),      // (1)
                       "orderId",  o.getId().toString())     // (2)
                .record(System.nanoTime() - start, NANOSECONDS);

        log.info("Đã tạo đơn {} cho khách {}", o.getId(), req.getCustomerId());
        return o;
    }
}`,
    },
    question: "Đoạn instrumentation này làm sập hệ thống giám sát sau hai tuần chạy. Chỉ ra nguyên nhân, rồi viết lại cho đúng.",
    mustCover: [
      "Hai tag `customer` và `orderId` có **lực lượng không giới hạn**: mỗi giá trị mới tạo ra một chuỗi thời gian mới",
      "`orderId` là **duy nhất cho mỗi request**, nên nó sinh một chuỗi thời gian cho **mỗi đơn hàng** — đây là nguyên nhân chính",
      "Đó là hiện tượng **nổ lực lượng** (cardinality explosion): chi phí ở hệ thống metrics tăng theo **số tổ hợp tag**, không theo số request",
      "Metrics là dữ liệu **tổng hợp** — định danh từng cá thể thuộc về logs hoặc traces, không thuộc về metrics",
      "Sửa: bỏ hẳn `orderId` khỏi tag; `customer` chỉ giữ nếu số khách **có giới hạn và nhỏ**, nếu không thì thay bằng một tag phân nhóm",
      "Định danh cần cho việc điều tra thì đặt vào **log** và vào **trace**, nơi chi phí tỉ lệ với số sự kiện chứ không nhân lên theo tổ hợp",
    ],
    model: "Nguyên nhân là nổ lực lượng, và thủ phạm chính là tag `orderId`. Một hệ thống metrics lưu dữ liệu theo chuỗi thời gian, và mỗi tổ hợp tag khác nhau là một chuỗi thời gian riêng cần được lập chỉ mục và giữ trong bộ nhớ. `orderId` là duy nhất cho mỗi đơn hàng, nên đoạn mã này tạo ra một chuỗi thời gian mới cho **mỗi request** — sau hai tuần thì đó là hàng triệu chuỗi, mỗi chuỗi chỉ có đúng một điểm dữ liệu và không bao giờ được ghi thêm. Chi phí của hệ thống metrics tăng theo số tổ hợp tag chứ không theo số request, nên đây không phải vấn đề khối lượng mà là vấn đề hình dạng dữ liệu. `customer` là thủ phạm thứ hai, nhẹ hơn nhưng vẫn thật: nó có giới hạn về lý thuyết nhưng giới hạn đó tăng theo thời gian và không nằm dưới kiểm soát của ta. Sai lầm nền tảng là dùng metrics để làm việc của logs và traces: metrics là dữ liệu tổng hợp, và định danh từng cá thể vốn không thuộc về nó. Viết lại thì tôi bỏ hẳn `orderId`. Với `customer`, nếu số khách hàng thật sự nhỏ và có giới hạn thì giữ được; nếu không thì thay bằng một tag phân nhóm có lực lượng cố định — hạng khách, vùng, hoặc kênh — vì đó vẫn đủ để trả lời câu hỏi tổng hợp \"nhóm nào đang chậm\". Những tag nên có thay vào đó là các chiều có lực lượng hữu hạn và ổn định: kết quả thành công hay thất bại, loại đơn, phiên bản API. Còn định danh cần cho việc điều tra thì đặt đúng chỗ: `orderId` và `customerId` vào log, và quan trọng hơn là vào trace kèm trace id — ở đó chi phí tỉ lệ với số sự kiện chứ không nhân lên theo tổ hợp, và ta vẫn đi từ một metric bất thường xuống tới đúng request cụ thể. Đó cũng là minh hoạ cho việc ba trụ cột khác nhau về hình dạng dữ liệu nên phải dùng đúng việc.",
    redFlags: [
      "Chỉ nói \"quá nhiều metric\" mà không nêu cơ chế nổ lực lượng theo tổ hợp tag",
      "Đề nghị giữ `orderId` nhưng lấy mẫu bớt — vẫn sinh chuỗi thời gian mới cho mỗi id được lấy",
      "Tăng dung lượng hệ thống giám sát thay vì sửa hình dạng dữ liệu",
      "Bỏ luôn cả instrumentation cho an toàn, mất khả năng quan sát",
    ],
    probes: [
      "Tag nào an toàn để thêm, và tiêu chí của bạn là gì?",
      "Bạn đi từ một metric bất thường xuống tới một request cụ thể bằng đường nào?",
      "Vì sao lấy mẫu không cứu được bài toán lực lượng?",
    ],
    refs: ["ocnj-11", "ocnj-10"],
  },
  {
    id: "ocnj-iq19",
    field: "ocnj",
    topic: "ocnj-observe",
    level: 3,
    minutes: 10,
    question: "Bạn cần tìm nguyên nhân một dịch vụ production đang chậm. Chọn công cụ nào để quan sát, và điều gì làm bạn đổi công cụ?",
    tradeoffs: [
      {
        option: "JFR — luôn bật với chi phí thấp",
        when: "Điểm khởi đầu cho production. Chi phí đủ thấp để bật liên tục, nên nó bắt được cả những sự cố **không tái hiện theo yêu cầu** — thứ mà một phiên profiling bật sau khi sự cố đã qua không bao giờ thấy.",
      },
      {
        option: "Profiler lấy mẫu, gắn vào tiến trình đang chạy",
        when: "Khi cần biết thời gian CPU dồn ở đâu với độ phân giải cao hơn. Chi phí thấp và không đòi khởi động lại, nhưng nó trả lời \"ở đâu\" chứ không phải \"vì sao\", và có thể bỏ sót thời gian chờ nếu chỉ lấy mẫu thread đang chạy.",
      },
      {
        option: "Memory profiling",
        when: "Khi triệu chứng liên quan tới cấp phát hoặc GC — allocation rate cao, mức chiếm dụng sau GC tăng dần. Nó trả lời câu hỏi khác hẳn CPU profiling, và bật sai loại là mất thời gian.",
      },
    ],
    mustCover: [
      "Chọn công cụ theo **câu hỏi cần trả lời**, không theo thứ quen dùng: CPU dồn ở đâu, thời gian chờ ở đâu, hay bộ nhớ đi đâu",
      "Profiling trên production có **khía cạnh vận hành** phải cân: chi phí, ảnh hưởng tới chính thứ đang đo, và quyền truy cập",
      "Chi phí thu thập tự nó ảnh hưởng tới phép đo — quan sát một hệ thống làm hệ thống đó chậm đi đôi chút",
      "JFR đủ rẻ để **bật liên tục**, nên nó bắt được sự cố không tái hiện theo yêu cầu",
      "Profiler lấy mẫu chỉ nói **ở đâu**, không nói **vì sao** — vẫn cần đọc mã và giả thuyết",
      "Nếu triệu chứng là độ trễ đuôi chứ không phải CPU cao thì profiling CPU có thể **không thấy gì**, phải đo thời gian chờ",
    ],
    model: "Tôi chọn theo câu hỏi cần trả lời chứ không theo công cụ quen. Có ba câu hỏi khác nhau và ba loại công cụ tương ứng: thời gian CPU dồn ở đâu, thời gian **chờ** dồn ở đâu, và bộ nhớ đi đâu. Bật sai loại là mất thời gian, và đây là sai lầm hay gặp nhất — chạy CPU profiler cho một sự cố độ trễ đuôi rồi không thấy gì, vì thời gian đang nằm ở chờ chứ ở tính. Điểm khởi đầu của tôi trên production là JFR, và lý do nằm ở khía cạnh vận hành: nó đủ rẻ để bật liên tục, nên khi sự cố xảy ra ta **đã có** dữ liệu của khoảng thời gian đó. Điều này quan trọng hơn vẻ ngoài vì phần lớn sự cố production không tái hiện theo yêu cầu; một phiên profiling bật sau khi sự cố đã qua thì đo một hệ thống đang khoẻ. Khi cần độ phân giải cao hơn về CPU, tôi gắn một profiler lấy mẫu vào tiến trình đang chạy — chi phí thấp, không cần khởi động lại — nhưng phải nói rõ hai giới hạn: nó trả lời \"ở đâu\" chứ không \"vì sao\", nên vẫn cần đọc mã và dựng giả thuyết; và nếu nó chỉ lấy mẫu thread đang chạy thì thời gian chờ khoá hay chờ I/O sẽ vắng mặt hoàn toàn, đúng lúc ta cần nhất. Memory profiling thì tôi chuyển sang khi triệu chứng chỉ về hướng đó — allocation rate cao, hoặc mức chiếm dụng sau GC tăng dần. Xuyên suốt cả ba, có một điều phải giữ trong đầu: chi phí thu thập tự nó ảnh hưởng tới phép đo. Quan sát một hệ thống làm nó chậm đi đôi chút, và với những phép đo chi tiết thì mức ảnh hưởng đó có thể đủ để đổi kết luận — nên tôi luôn hỏi mình đang trả bao nhiêu cho dữ liệu, và liệu cái giá đó có làm sai lệch chính thứ mình muốn thấy hay không.",
    redFlags: [
      "Chạy CPU profiler cho một sự cố độ trễ đuôi rồi kết luận \"không tìm ra gì\"",
      "Chỉ bật profiling sau khi sự cố đã qua và mong thấy được nguyên nhân",
      "Bỏ qua chi phí của việc thu thập, nhất là khi bật ở mức chi tiết cao trên production",
      "Đọc kết quả profiler như câu trả lời cuối cùng thay vì như một giả thuyết cần kiểm",
    ],
    probes: [
      "Vì sao một profiler chỉ lấy mẫu thread đang chạy lại bỏ sót đúng thứ bạn cần?",
      "Bạn quyết định mức chi tiết của JFR trên production thế nào?",
      "Khi kết quả profiler chỉ vào một method thư viện, bước tiếp theo của bạn là gì?",
    ],
    refs: ["ocnj-12", "ocnj-10"],
  },
  {
    id: "ocnj-iq20",
    field: "ocnj",
    topic: "ocnj-observe",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ có dashboard \"tất cả xanh\" — CPU 40%, heap 55%, tỉ lệ lỗi 0,02%, độ trễ p95 60ms — nhưng khách hàng liên tục báo trang tải chậm. Đội đã thêm 30 metric mới trong ba tháng qua và vẫn không tìm ra gì. Dịch vụ gọi 6 dịch vụ nội bộ khác; không có trace, chỉ có metrics và log.",
      scale: "9.000 request mỗi giây. Khiếu nại tập trung vào một luồng nghiệp vụ chiếm khoảng 4% lưu lượng. Ba tháng điều tra không kết luận được.",
      constraints: "Không được thêm metric nữa — hệ thống giám sát đã chạm trần chi phí. Phải có kết quả trong 2 tuần. Sáu dịch vụ kia thuộc bốn đội khác, không thể yêu cầu họ đổi mã trong thời gian đó.",
    },
    question: "Vì sao 30 metric mới không giúp gì? Nêu điều bạn thiếu và cách bạn lấy được nó trong 2 tuần mà không thêm metric.",
    mustCover: [
      "Đọc đúng bằng chứng: 30 metric trong ba tháng không cải thiện gì, nghĩa là thứ thiếu **không phải thêm dữ liệu cùng loại**",
      "Khoảng trống cụ thể là **trace** — với một dịch vụ gọi 6 dịch vụ khác, câu \"thời gian dồn ở tầng nào\" chỉ trace trả lời được",
      "p95 60ms là số **tổng hợp trên toàn bộ lưu lượng**, nên một luồng chiếm 4% có thể rất chậm mà vẫn bị che hoàn toàn",
      "Phải đo **theo luồng nghiệp vụ** và nhìn **đuôi** phân bố, không phải p95 toàn cục",
      "Tỉ lệ lỗi 0,02% cũng không nói gì vì vấn đề là **chậm**, không phải lỗi",
      "Cách lấy trace trong 2 tuần mà không đổi mã 6 dịch vụ kia: truyền **trace id** và đo ở phía gọi của chính dịch vụ mình",
      "Đo ở phía gọi đã đủ khoanh được **dịch vụ nào** chậm, rồi mới đi thương lượng với đúng một đội thay vì bốn",
    ],
    model: "30 metric mới không giúp gì vì chúng bổ sung vào đúng trụ cột đã có sẵn. Metrics, logs và traces khác nhau ở những khía cạnh nền tảng về hình dáng và hình thức dữ liệu, nên thiếu trace thì không lượng metric nào bù được — với một dịch vụ gọi 6 dịch vụ khác, câu hỏi \"thời gian dồn ở tầng nào\" là câu mà metrics không trả lời được vì tổng hợp đã xoá mất quan hệ nhân quả, và logs cũng không, vì chúng rời rạc theo từng tiến trình. Còn một vấn đề thứ hai độc lập với trace và cũng đủ để giải thích ba tháng bế tắc: p95 60ms là con số tổng hợp trên toàn bộ 9.000 request mỗi giây, trong khi khiếu nại tập trung vào một luồng chiếm 4% lưu lượng. Một luồng chiếm 4% có thể chậm hàng giây mà p95 toàn cục vẫn đẹp — nó nằm hoàn toàn trong phần đuôi bị phép tổng hợp che đi. Tỉ lệ lỗi 0,02% cũng không nói gì vì vấn đề là chậm, không phải lỗi. Nên hai thứ tôi thiếu là: phân tách theo luồng nghiệp vụ, và quan hệ nhân quả xuyên dịch vụ. Trong hai tuần và không được thêm metric, tôi làm theo thứ tự này. Việc đầu tiên, rẻ nhất và làm được ngay: đo độ trễ **của riêng luồng 4% đó** và nhìn đuôi phân bố chứ không nhìn p95 — dữ liệu này lấy từ log vốn đã có, không cần metric mới. Chỉ riêng bước đó có thể xác nhận hay loại bỏ toàn bộ giả thuyết trong một ngày. Việc thứ hai là lấy quan hệ nhân quả mà không cần bốn đội kia đổi mã: sinh một trace id ở biên vào của dịch vụ mình, truyền nó xuống theo header của 6 lời gọi, và **đo ở phía gọi** — tức ghi lại thời gian mỗi lời gọi đi ra mất bao lâu, kèm trace id. Điều này hoàn toàn nằm trong mã của tôi. Đo ở phía gọi không cho thấy bên trong 6 dịch vụ kia, nhưng nó đủ để trả lời câu hỏi quyết định là **dịch vụ nào** đang chậm và chậm ở phần đuôi nào — và khi đã có con số đó, tôi đi thương lượng với đúng một đội có bằng chứng trong tay, thay vì đề nghị cả bốn đội cùng đổi mã dựa trên phỏng đoán. Đó cũng là cách biến ràng buộc \"không thể yêu cầu họ đổi mã\" từ vật cản thành thứ không còn cần thiết.",
    redFlags: [
      "Đề nghị thêm metric hoặc dashboard — ràng buộc đã cấm, và ba tháng qua đã chứng minh cách đó không hiệu quả",
      "Tin dashboard xanh nghĩa là hệ thống khoẻ, trong khi p95 toàn cục che được một luồng chiếm 4%",
      "Đòi triển khai trace đầy đủ trên cả 6 dịch vụ trước khi làm được gì — không khả thi trong 2 tuần",
      "Dùng tỉ lệ lỗi để lập luận về một vấn đề độ trễ",
      "Bỏ qua bước rẻ nhất là tách độ trễ theo luồng nghiệp vụ từ log đã có",
    ],
    probes: [
      "Đo ở phía gọi thấy được gì và không thấy được gì?",
      "Vì sao p95 toàn cục che được một luồng chiếm 4% lưu lượng?",
      "Sau khi khoanh được dịch vụ chậm, bạn trình bày bằng chứng cho đội kia thế nào?",
    ],
    refs: ["ocnj-10", "ocnj-11"],
  },

  // ===== ocnj-concurrent — Hiệu năng đồng thời và hệ phân tán (ocnj-iq21–ocnj-iq24) =====
  {
    id: "ocnj-iq21",
    field: "ocnj",
    topic: "ocnj-concurrent",
    level: 1,
    minutes: 6,
    question: "Virtual thread giải quyết bài toán gì mà thread nền tảng không giải được, và nó **không** giúp gì?",
    mustCover: [
      "Virtual thread làm cho mô hình **một thread một task** khả thi ở số lượng rất lớn, vì chúng rẻ để tạo và rẻ để chặn",
      "Nó nhắm vào workload **chờ nhiều** — I/O, gọi mạng — nơi thread nền tảng bị giới hạn bởi chi phí của chính thread",
      "Nó **không** làm tăng năng lực CPU: với task thiên tính toán, số lõi vẫn là trần",
      "Nó **không** làm mã đồng thời tự đúng: JMM, tranh chấp và bất biến chia sẻ vẫn nguyên như cũ",
      "Nó cho phép viết mã **tuần tự dễ đọc** mà đạt được mức mở rộng trước đây phải dùng lối bất đồng bộ",
    ],
    model: "Bài toán mà virtual thread giải là chi phí của chính thread. Với thread nền tảng, mỗi thread tương ứng một thread hệ điều hành và tốn bộ nhớ stack cùng chi phí lập lịch, nên số thread bị giới hạn ở bậc nghìn — và điều đó buộc ta từ bỏ mô hình một thread một task khi cần phục vụ hàng chục nghìn kết nối đồng thời. Lối thoát trước đây là lập trình bất đồng phóng: callback, future, reactive — mã mở rộng tốt nhưng khó đọc, khó debug, và stack trace mất nghĩa. Virtual thread làm thread trở nên rẻ để tạo và rẻ để chặn, nên mô hình một thread một task quay lại khả thi ở số lượng rất lớn; giá trị lớn nhất của nó là ta viết được mã tuần tự dễ đọc mà vẫn đạt mức mở rộng trước đây phải trả bằng lối bất đồng bộ. Phần \"không giúp gì\" quan trọng không kém và là chỗ hay bị nói sai. Thứ nhất, nó không làm tăng năng lực CPU: với task thiên tính toán, trần vẫn là số lõi, và tạo một triệu virtual thread để chạy một triệu vòng lặp tính toán chỉ làm mọi thứ chậm hơn. Nó nhắm vào workload chờ nhiều, nơi nút thắt là chi phí thread chứ không phải chu kỳ CPU. Thứ hai, và tôi cho là điểm đáng nhấn nhất, nó không làm mã đồng thời tự đúng: Java Memory Model không đổi, tranh chấp khoá không đổi, các bất biến trải trên nhiều biến vẫn cần được bảo vệ như cũ. Đổi sang virtual thread mà mã vốn đã có race thì chỉ là chạy cùng lỗi đó ở quy mô lớn hơn — và với nhiều thread hơn thì cửa sổ tranh chấp được thăm dò nhiều hơn, nên lỗi vốn hiếm có thể bắt đầu xuất hiện thường xuyên.",
    redFlags: [
      "Nói virtual thread làm ứng dụng nhanh hơn nói chung, không phân biệt workload chờ nhiều với tính nhiều",
      "Tin rằng nó thay thế được việc phải suy nghĩ về JMM và tranh chấp",
      "Cho rằng nó luôn thay được lối reactive trong mọi trường hợp",
    ],
    probes: [
      "Với task thiên tính toán, virtual thread đổi gì?",
      "Mã đang có race chuyển sang virtual thread thì chuyện gì xảy ra?",
      "Fork/Join và parallel stream nhắm vào loại workload nào?",
    ],
    refs: ["ocnj-13"],
  },
  {
    id: "ocnj-iq22",
    field: "ocnj",
    topic: "ocnj-concurrent",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class ReportService {

    // Gọi 4 dịch vụ, mỗi lời gọi khoảng 200ms, đều là chờ mạng
    public Report build(Long id) {
        return orders.stream()
            .parallel()
            .map(o -> enrich(o))        // enrich() gọi HTTP, chặn ~200ms
            .collect(toReport());
    }

    // Ở một chỗ khác trong cùng JVM:
    public long countPrimes(long limit) {
        return LongStream.rangeClosed(2, limit)
            .parallel()
            .filter(this::isPrime)      // thuần tính toán
            .count();
    }
}`,
    },
    question: "Hai method này dùng cùng một cơ chế song song nhưng chỉ một trong hai dùng đúng. Chỉ ra cái nào sai, vì sao, và sửa.",
    mustCover: [
      "`parallel()` trên stream chạy trên một pool **dùng chung toàn JVM** với số thread theo số lõi",
      "`countPrimes` dùng đúng: thuần tính toán, số lõi là trần thật, pool theo số lõi là cấu hình hợp lý",
      "`build` dùng sai: các lời gọi **chặn** chiếm thread của pool dùng chung trong 200ms mỗi lần",
      "Hệ quả là nó **làm chậm mọi phần khác** của JVM đang dùng cùng pool — ảnh hưởng vượt ra ngoài method này",
      "Số thread theo số lõi cũng là **sai cấu hình** cho workload chờ: với I/O ta cần nhiều thread hơn số lõi",
      "Sửa `build` bằng cơ chế phù hợp cho việc chờ — virtual thread hoặc một executor riêng có kích thước theo tỉ lệ chờ trên tính",
    ],
    model: "`countPrimes` dùng đúng và `build` dùng sai, và cả hai đều quy về một sự thật: `parallel()` trên stream chạy trên một pool dùng chung của cả JVM, với số thread chọn theo số lõi. Với `countPrimes` thì đó là cấu hình hợp lý — công việc thuần tính toán, trần thật là số lõi, nên một pool cỡ số lõi là đúng thứ cần, và không có thread nào bị chặn nên không ai bị giữ chỗ. `build` thì ngược lại trên mọi mặt. Mỗi lần `enrich` chặn khoảng 200ms để chờ mạng, và trong suốt 200ms đó nó chiếm một thread của pool dùng chung mà không tiêu một chu kỳ CPU nào. Hai hậu quả. Thứ nhất, chính `build` cũng không nhanh như mong: pool chỉ có vài thread nên bốn lời gọi không thực sự chạy song song hết, và với workload chờ thì số thread đúng phải nhiều hơn số lõi, tính theo tỉ lệ giữa thời gian chờ và thời gian tính. Thứ hai, và nghiêm trọng hơn vì nó vượt ra ngoài method này: pool ấy dùng chung toàn JVM, nên trong lúc `build` giữ thread để chờ mạng thì `countPrimes` và mọi đoạn `parallel()` khác trong ứng dụng đều bị chậm theo. Một quyết định cục bộ trở thành một điểm tắc toàn cục, và đó là dạng lỗi rất khó truy vì triệu chứng xuất hiện ở nơi khác với nguyên nhân. Sửa thì tôi không cố chỉnh pool dùng chung mà đổi cơ chế cho đúng loại việc: `build` là workload chờ nhiều nên nó thuộc về virtual thread, nơi việc chặn là rẻ và không giữ chỗ của ai; nếu chưa dùng được virtual thread thì tách một executor riêng cho các lời gọi ra ngoài, kích thước đặt theo tỉ lệ chờ trên tính, và tuyệt đối không dùng chung với pool tính toán. `countPrimes` giữ nguyên.",
    redFlags: [
      "Nói `parallel()` luôn nhanh hơn nên cả hai đều ổn",
      "Đề nghị tăng kích thước pool dùng chung — biến một cấu hình đúng cho tính toán thành sai cho cả hai",
      "Không nhận ra pool dùng chung khiến ảnh hưởng vượt ra ngoài method đang sửa",
      "Chuyển `countPrimes` sang virtual thread vì \"virtual thread mới hơn\"",
    ],
    probes: [
      "Vì sao dùng chung pool giữa việc chờ và việc tính lại nguy hiểm?",
      "Bạn tính kích thước executor cho `build` thế nào?",
      "Fork/Join phù hợp với hình dạng công việc nào?",
    ],
    refs: ["ocnj-13"],
  },
  {
    id: "ocnj-iq23",
    field: "ocnj",
    topic: "ocnj-concurrent",
    level: 3,
    minutes: 11,
    question: "Một dịch vụ cần trạng thái dùng chung giữa nhiều instance. Bạn chọn mô hình nhất quán nào, và điều gì buộc bạn đổi?",
    tradeoffs: [
      {
        option: "Nhất quán cuối cùng — replication bất đồng bộ",
        when: "Khi nghiệp vụ chịu được việc đọc ra dữ liệu hơi cũ. Độ trễ thấp, chịu được phân vùng mạng, mở rộng tốt. Cái giá là phải **thiết kế cho xung đột**: mọi đường đọc phải hiểu dữ liệu có thể cũ, và phải có quy tắc hoà giải.",
      },
      {
        option: "Nhất quán mạnh qua giao thức đồng thuận",
        when: "Khi có bất biến **không được vi phạm dù chỉ một khoảnh khắc** — số dư, tồn kho, quyền. Đổi lại là độ trễ ghi cao hơn vì phải chờ đa số đồng ý, và khi mất đa số thì hệ thống **từ chối ghi** chứ không chấp nhận sai.",
      },
      {
        option: "Không chia sẻ — phân vùng trạng thái theo khoá",
        when: "Khi trạng thái chia được theo một khoá tự nhiên và mỗi instance sở hữu một phần. Khử hẳn bài toán nhất quán thay vì giải nó, đổi lại là bài toán định tuyến và tái cân bằng khi số instance đổi.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **bất biến nào không được phép vi phạm**, và trong bao lâu",
      "Giao thức đồng thuận mua tính nhất quán bằng **độ trễ ghi** và bằng việc **từ chối ghi** khi mất đa số",
      "Nhất quán cuối cùng không phải \"yếu hơn\" mà là **dịch chi phí** sang tầng ứng dụng: phải có quy tắc hoà giải xung đột",
      "Phương án thứ ba đáng xét trước hai phương án kia: **khử** bài toán bằng phân vùng thường rẻ hơn giải nó",
      "Phải nói được **chế độ hỏng**: mỗi lựa chọn hỏng theo cách khác nhau khi mạng phân vùng",
      "Đừng chọn theo tiếng tăm — phải đối chiếu với yêu cầu nghiệp vụ cụ thể và đo trên workload thật",
    ],
    model: "Tôi bắt đầu bằng một câu hỏi nghiệp vụ chứ không kỹ thuật: có bất biến nào không được phép vi phạm dù chỉ một khoảnh khắc hay không, và nếu có thì hậu quả của việc vi phạm là gì. Với những bất biến kiểu số dư không được âm, tồn kho không được bán vượt, hay quyền truy cập, thì câu trả lời là có và tôi cần nhất quán mạnh qua một giao thức đồng thuận. Điều phải nói rõ khi chọn hướng này là cái giá và chế độ hỏng: mỗi lần ghi phải chờ đa số đồng ý nên độ trễ ghi cao hơn, và khi mất đa số thì hệ thống **từ chối ghi** — đó là một quyết định thiết kế có chủ ý, chọn dừng phục vụ thay vì chấp nhận dữ liệu sai. Với phần lớn trạng thái khác thì nghiệp vụ chịu được dữ liệu hơi cũ, và nhất quán cuối cùng cho độ trễ thấp cùng khả năng chịu phân vùng. Nhưng tôi không gọi nó là \"yếu hơn\": nó dịch chi phí sang tầng ứng dụng. Chọn nó nghĩa là cam kết rằng mọi đường đọc đều hiểu dữ liệu có thể cũ, và rằng có quy tắc hoà giải xung đột rõ ràng — nếu hai instance cùng sửa một bản ghi thì bên nào thắng, và theo tiêu chí gì. Bỏ qua phần cam kết đó chính là cách nhất quán cuối cùng biến thành dữ liệu sai âm thầm. Phương án tôi luôn xét **trước** cả hai là phân vùng trạng thái theo khoá để mỗi instance sở hữu một phần và không chia sẻ gì: nó khử bài toán nhất quán thay vì giải nó, và khử một bài toán thường rẻ hơn giải nó. Cái giá là bài toán định tuyến — request phải tới đúng instance sở hữu khoá — và bài toán tái cân bằng khi số instance đổi, hai thứ này cụ thể và giải được, khác với việc sống chung với xung đột. Quyết định cuối tôi đặt cạnh yêu cầu nghiệp vụ và đo trên workload thật, vì cùng một mô hình có thể đúng cho một phần trạng thái và sai cho phần khác của cùng dịch vụ.",
    redFlags: [
      "Chọn nhất quán mạnh cho mọi thứ \"để an toàn\", trả độ trễ ghi cho cả dữ liệu không cần tới nó",
      "Chọn nhất quán cuối cùng mà không định nghĩa quy tắc hoà giải xung đột",
      "Không xét phương án phân vùng, vốn thường khử được bài toán",
      "Không nói được hệ thống hỏng thế nào khi mạng phân vùng",
    ],
    probes: [
      "Hệ thống của bạn làm gì khi mất đa số?",
      "Hai instance cùng sửa một bản ghi — bên nào thắng, và theo tiêu chí gì?",
      "Phân vùng theo khoá tạo ra bài toán mới nào?",
    ],
    refs: ["ocnj-14"],
  },
  {
    id: "ocnj-iq24",
    field: "ocnj",
    topic: "ocnj-concurrent",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Sau khi đổi tầng HTTP sang virtual thread, thông lượng tăng 3 lần đúng như kỳ vọng, nhưng độ trễ p99 xấu đi 5 lần và xuất hiện những đợt treo 8–20 giây. GC log bình thường. Thread dump cho thấy hàng nghìn virtual thread đứng chờ cùng một `synchronized` block bọc một `HashMap` dùng làm cache trong bộ nhớ.",
      scale: "Trước đổi: 1.400 request/giây, p99 90ms. Sau đổi: 4.200 request/giây, p99 460ms, và mỗi giờ vài đợt treo. Pool nền tảng cũ có 200 thread.",
      constraints: "Không được quay lại thread nền tảng — quyết định kiến trúc đã chốt và ba dịch vụ khác đã chuyển theo. Cache phải giữ trong bộ nhớ vì độ trễ yêu cầu dưới 1ms cho lần đọc hit. Phải xử lý trong sprint này.",
      },
    question: "Vì sao cùng đoạn mã cache đó chạy tốt với 200 thread nền tảng mà vỡ với virtual thread? Nêu chẩn đoán và cách sửa.",
    mustCover: [
      "Virtual thread **không** làm mã đồng thời tự đúng: tranh chấp khoá vẫn là tranh chấp khoá",
      "Trước đây pool 200 thread **đã đóng vai một cơ chế giới hạn ngầm** cho số bên tranh chấp lock",
      "Bỏ giới hạn đó nghĩa là hàng nghìn bên cùng tranh một lock, nên hàng đợi chờ dài ra và **độ trễ đuôi nổ**",
      "Đây là ví dụ cho việc gỡ một nút thắt làm **lộ ra** nút thắt kế tiếp — thông lượng tăng thật, chỗ tắc chỉ dịch sang chỗ khác",
      "Sửa đúng bản chất: bỏ lock khỏi đường nóng bằng **cấu trúc dữ liệu đồng thời** thay cho `HashMap` bọc `synchronized`",
      "Nếu vẫn còn chỗ phải giới hạn, hãy giới hạn **tường minh** bằng semaphore thay vì dựa vào kích thước pool",
      "Đo lại bằng **phân bố độ trễ**, không chỉ thông lượng — vì chính việc chỉ nhìn thông lượng đã che mất vấn đề này",
    ],
    model: "Đoạn mã cache không đổi, nhưng số bên tranh chấp thì đổi hai bậc độ lớn. Trước đây pool 200 thread nền tảng đóng một vai mà không ai khai ra: nó là cơ chế giới hạn ngầm cho số bên có thể đồng thời tranh một lock. Với tối đa 200 bên xếp hàng trước `synchronized` block, hàng đợi ngắn và thời gian chờ nằm trong ngân sách. Chuyển sang virtual thread bỏ mất giới hạn đó — giờ hàng nghìn virtual thread cùng chạy tới cùng một lock, hàng đợi dài ra tương ứng, và vì thời gian chờ tỉ lệ với độ dài hàng đợi nên độ trễ đuôi nổ đúng như quan sát. Những đợt treo 8–20 giây là khi hàng đợi tích tụ đủ lớn. Điều quan trọng phải nói với đội là chẩn đoán này không phủ định quyết định kiến trúc: thông lượng tăng 3 lần là thật, virtual thread đã làm đúng việc của nó. Cái đã xảy ra là gỡ một nút thắt làm lộ ra nút thắt kế tiếp — và nút thắt kế tiếp là cái lock ấy, vốn đã luôn ở đó nhưng bị pool 200 thread che khuất. Đây cũng là minh hoạ trực tiếp cho điều virtual thread **không** làm: nó không khiến mã đồng thời tự đúng, JMM và tranh chấp khoá vẫn nguyên. Cách sửa đúng bản chất là bỏ lock khỏi đường nóng thay vì đi chỉnh mức song song: thay `HashMap` bọc `synchronized` bằng một cấu trúc dữ liệu đồng thời, thứ cho nhiều bên đọc chạy song song và chỉ khoá mịn khi ghi. Riêng việc này giải quyết ca đang có và giữ được yêu cầu độ trễ dưới 1ms cho lần đọc hit, vì đường hit không còn phải xếp hàng. Điểm thứ hai tôi sẽ đưa vào cùng sprint như một nguyên tắc: nếu ở đâu đó thật sự cần giới hạn số bên đồng thời — chẳng hạn tầng gọi ra một dịch vụ ngoài — thì phải giới hạn **tường minh** bằng semaphore, chứ không dựa vào kích thước pool làm giới hạn ngầm; vì đúng chỗ dựa ngầm ấy là thứ vừa biến mất và gây ra sự cố này. Cuối cùng là cách đo: tiêu chí nghiệm thu phải là phân bố độ trễ chứ không chỉ thông lượng, bởi chính việc chỉ nhìn thông lượng đã khiến lần đổi vừa rồi được coi là thành công trong khi nó đang phá p99.",
    redFlags: [
      "Đề nghị quay lại thread nền tảng — ràng buộc đã cấm, và nó chỉ che lại nút thắt thay vì sửa",
      "Nói virtual thread \"chưa trưởng thành\" thay vì nhận ra lock là nút thắt đã luôn tồn tại",
      "Giới hạn số virtual thread cho giống pool cũ: tái lập giới hạn ngầm, bỏ luôn lợi ích vừa đạt",
      "Chỉnh tham số GC — GC log đã bình thường",
      "Nghiệm thu lần sửa bằng thông lượng, đúng sai lầm đã che mất vấn đề lần này",
    ],
    probes: [
      "Vì sao thời gian chờ lại tỉ lệ với số bên tranh chấp?",
      "Sau khi đổi sang cấu trúc dữ liệu đồng thời, còn chỗ nào trong đường nóng dựa vào giới hạn ngầm không?",
      "Bạn đặt tiêu chí nghiệm thu nào cho lần sửa này?",
    ],
    refs: ["ocnj-13", "ocnj-14"],
  },
];
