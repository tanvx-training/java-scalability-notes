// Ngân hàng câu hỏi phỏng vấn The Well-Grounded Java Developer — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt The Well-Grounded Java Developer, ấn bản 2
// (Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning).
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js. Tóm lại:
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
//
// GIỮ NGUYÊN id (wgjd-iq01–wgjd-iq24) — thống kê tự chấm lưu theo id.

export const wgjdInterview = [
  // ===== wg-modern — Java hiện đại (wgjd-iq01–wgjd-iq04) =====
  {
    id: "wgjd-iq01",
    field: "wgjd",
    topic: "wg-modern",
    level: 1,
    minutes: 5,
    question: "`record` và `sealed` phối hợp với pattern matching để làm được điều gì mà ba thứ riêng lẻ không làm được?",
    mustCover: [
      "`record` cho một kiểu dữ liệu **bất biến**, khai báo ngắn, với `equals`, `hashCode` và `toString` sinh tự động",
      "`sealed` giới hạn **tập lớp con hợp lệ**, nên trình biên dịch biết trước danh sách đầy đủ các nhánh",
      "Nhờ biết tập đầy đủ, `switch` trên một sealed hierarchy kiểm được **tính bao phủ** — thiếu nhánh là lỗi biên dịch",
      "Vì vậy không cần nhánh `default`, và thêm một lớp con mới sẽ làm mọi `switch` liên quan **báo đỏ** thay vì âm thầm rơi vào `default`",
      "Ba thứ cộng lại cho phép mô hình hoá **tổng của các kiểu** — một giá trị là một trong N dạng — điều mà Java trước đây phải giả lập bằng kế thừa cộng ép kiểu",
    ],
    model: "Từng thứ riêng lẻ đã hữu ích, nhưng giá trị thật nằm ở chỗ chúng khớp vào nhau. `record` cho một kiểu dữ liệu bất biến với rất ít mã: các thành phần là `final`, và `equals`, `hashCode`, `toString` được sinh theo đúng các thành phần đó, nên nó diễn đạt \"đây là một chùm dữ liệu\" mà không có chỗ cho sai sót thủ công. `sealed` làm một việc ngược với tinh thần mở của kế thừa thông thường: nó khai rõ **tập lớp con hợp lệ**, nên từ góc nhìn trình biên dịch, danh sách các dạng có thể của kiểu đó là hữu hạn và biết trước. Pattern matching trên `switch` là chỗ hai điều trên trả cổ tức: vì biết tập đầy đủ, trình biên dịch kiểm được tính bao phủ của `switch` — nếu ta bỏ sót một dạng thì mã không biên dịch. Hệ quả thực hành mới là điều tôi coi quan trọng nhất: ta không cần nhánh `default`, và khi thêm một lớp con mới thì **mọi** `switch` trên kiểu đó đồng loạt báo đỏ, buộc ta đi xử lý từng chỗ. So với lối cũ dùng kế thừa mở cộng một `default` để đỡ, khác biệt là giữa \"trình biên dịch chỉ cho ta danh sách việc cần làm\" và \"một nhánh `default` âm thầm nuốt dạng mới rồi hỏng ở production\". Nói theo ngôn ngữ mô hình hoá, ba thứ này cùng nhau cho Java diễn đạt được **tổng của các kiểu** — một giá trị là một trong N dạng, mỗi dạng mang dữ liệu riêng — thứ mà trước đây phải giả lập bằng cây kế thừa cộng ép kiểu, và luôn thiếu bảo đảm về tính bao phủ.",
    redFlags: [
      "Mô tả `record` chỉ như \"cách viết ngắn cho POJO\", bỏ qua tính bất biến",
      "Không nêu được rằng `sealed` cho phép kiểm tính bao phủ của `switch`",
      "Vẫn thêm nhánh `default` vào `switch` trên sealed hierarchy — tự bỏ đúng lợi ích vừa nói",
    ],
    probes: [
      "Vì sao thêm `default` lại làm mất lợi ích của sealed?",
      "`record` có phù hợp làm entity ánh xạ database không, và vì sao?",
      "Bạn mô hình hoá một trạng thái nghiệp vụ có 5 dạng bằng những thứ này thế nào?",
    ],
    refs: ["wgjd-03", "wgjd-01"],
  },
  {
    id: "wgjd-iq02",
    field: "wgjd",
    topic: "wg-modern",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `public sealed interface Payment permits Card, Transfer, Wallet {}
public record Card(String last4, int expMonth) implements Payment {}
public record Transfer(String iban) implements Payment {}
public record Wallet(String providerId) implements Payment {}

public class FeeCalculator {
    public BigDecimal fee(Payment p) {
        return switch (p) {
            case Card c     -> new BigDecimal("0.02");
            case Transfer t -> BigDecimal.ZERO;
            default         -> new BigDecimal("0.01");   // (!) cho mọi thứ còn lại
        };
    }
}

// Sáu tháng sau, một đội thêm:
public record Crypto(String chain) implements Payment {}   // và sửa permits`,
    },
    question: "Sau khi `Crypto` được thêm, `FeeCalculator` vẫn biên dịch và chạy — nhưng đó là vấn đề. Giải thích, sửa lại, và nói bản sửa đổi chế độ hỏng thành gì.",
    mustCover: [
      "Nhánh `default` khiến `switch` **không cần** biết đủ tập lớp con, nên trình biên dịch không kiểm được tính bao phủ",
      "`Crypto` âm thầm rơi vào `default` và bị tính phí 1% — một quyết định nghiệp vụ chưa ai duyệt",
      "Lỗi không lộ ra lúc biên dịch, không lộ ra lúc chạy, chỉ lộ ra khi có người đối soát số tiền",
      "Sửa bằng cách **bỏ `default`** và liệt kê đủ các dạng — khi đó thêm lớp con mới làm mã **không biên dịch**",
      "Chế độ hỏng đổi từ **sai âm thầm ở production** sang **báo đỏ lúc build**",
      "Nếu thật sự cần một hành vi chung thì khai tường minh từng case chia sẻ nhánh, không dùng `default`",
    ],
    model: "Vấn đề là `switch` này vẫn biên dịch được, và đó chính xác là điều không nên xảy ra. Nhánh `default` nói với trình biên dịch rằng ta đã lo mọi trường hợp còn lại, nên nó thôi kiểm tính bao phủ — toàn bộ lợi ích của việc khai `sealed` bị vô hiệu bởi một dòng. Khi `Crypto` được thêm sáu tháng sau, nó rơi vào `default` và được tính phí 1%. Không ai quyết định con số đó cho `Crypto`; nó là mức phí được viết cho \"mọi thứ còn lại\" ở một thời điểm mà `Crypto` chưa tồn tại. Đây là dạng lỗi tệ nhất trong nhóm này vì nó không lộ ra ở đâu cả: biên dịch sạch, chạy không ném gì, và chỉ khi có người đối soát doanh thu thì mới phát hiện một loại thanh toán đang bị tính phí theo mặc định lịch sử. Cách sửa là bỏ `default` và liệt kê đủ ba dạng. Khi đó, ngay lúc `Crypto` được thêm vào `permits`, `FeeCalculator` **không biên dịch được**, và đội thêm `Crypto` buộc phải đi qua mọi chỗ tính phí để quyết định mức phí — đúng việc họ nên làm. Phần tôi muốn nhấn là bản sửa không làm mã \"đúng hơn\" theo nghĩa logic; nó đổi **chế độ hỏng**: từ một quyết định nghiệp vụ sai âm thầm ở production sang một lỗi biên dịch ồn ào lúc build, kèm danh sách chính xác những chỗ cần xem. Một chi tiết thực hành: nếu nhiều dạng thật sự chia sẻ cùng mức phí thì vẫn khai tường minh chúng trong một nhánh chung thay vì dùng `default` — cách viết dài hơn vài ký tự nhưng giữ được tính bao phủ, và đó là toàn bộ điểm của việc dùng `sealed`.",
    redFlags: [
      "Giữ `default` và chỉ thêm một case cho `Crypto` — lần sau lại lặp lại đúng lỗi này",
      "Đổi `default` thành ném ngoại lệ và coi là đã đủ — chuyển lỗi sang lúc chạy thay vì lúc build",
      "Không nhận ra vấn đề là mã **vẫn biên dịch được**",
      "Nói `sealed` không có lợi ích gì vì \"vẫn phải sửa mã khi thêm dạng mới\"",
    ],
    probes: [
      "Vì sao ném ngoại lệ ở `default` vẫn kém hơn bỏ `default`?",
      "Nhiều dạng chia sẻ cùng hành vi thì bạn viết thế nào?",
      "Điều gì xảy ra nếu `Payment` không khai `sealed`?",
    ],
    refs: ["wgjd-03"],
  },
  {
    id: "wgjd-iq03",
    field: "wgjd",
    topic: "wg-modern",
    level: 3,
    minutes: 9,
    question: "Bạn mô hình hoá một kiểu dữ liệu nghiệp vụ. Chọn `record`, class bất biến viết tay, hay class khả biến thông thường?",
    tradeoffs: [
      {
        option: "`record`",
        when: "Kiểu là một **chùm dữ liệu** mà định danh của nó chính là giá trị các thành phần. Ngắn nhất, bất biến sẵn, `equals` theo giá trị sẵn. Giới hạn: không kế thừa được, mọi thành phần **public** qua accessor, và `equals` theo **tất cả** thành phần.",
      },
      {
        option: "Class bất biến viết tay",
        when: "Khi cần bất biến nhưng `record` không vừa: cần ẩn một thành phần, cần `equals` chỉ theo một phần, cần kiểm tính hợp lệ phức tạp, hoặc cần kế thừa.",
      },
      {
        option: "Class khả biến",
        when: "Khi object có **định danh** độc lập với giá trị và có vòng đời — một entity ánh xạ database là ví dụ điển hình. Ở đó `equals` theo mọi field là **sai**, vì hai bản ghi cùng id vẫn là một dù giá trị khác.",
      },
    ],
    mustCover: [
      "Trục quyết định là **định danh theo giá trị** hay **định danh riêng** — không phải cú pháp nào ngắn hơn",
      "`record` sinh `equals` theo **toàn bộ** thành phần, nên nó sai cho những kiểu có định danh riêng",
      "`record` phơi mọi thành phần qua accessor, nên không dùng được khi cần che một phần state",
      "`record` không kế thừa được từ class khác, nên nó không vừa mọi cây phân cấp",
      "Với entity database, dùng `record` làm sai ngữ nghĩa **đồng nhất**: hai bản ghi cùng id phải là một",
      "`record` vẫn cho kiểm tính hợp lệ trong **constructor gọn**, nên đừng loại nó chỉ vì cần validate",
    ],
    model: "Tôi chọn theo một câu hỏi: định danh của kiểu này là **giá trị các thành phần**, hay là một thứ riêng độc lập với giá trị? Nếu là giá trị — một điểm toạ độ, một khoảng tiền, một cặp khoá và nhãn — thì `record` đúng và nên là mặc định: nó bất biến sẵn, `equals` theo giá trị sẵn, và không có chỗ cho sai sót khi viết tay ba method quen thuộc. Một điểm hay bị hiểu sai và đáng làm rõ: `record` vẫn cho kiểm tính hợp lệ, qua constructor gọn, nên đừng loại nó chỉ vì cần validate đầu vào. Nếu định danh là thứ riêng thì `record` **sai về ngữ nghĩa**, không chỉ bất tiện. Ví dụ rõ nhất là entity ánh xạ database: hai instance cùng id phải được coi là một dù các field khác đang lệch nhau, còn `record` sinh `equals` theo toàn bộ thành phần nên nó nói chúng khác nhau — và mọi collection dựa trên `equals` sẽ hành xử sai theo. Đó là lý do một entity thuộc về class khả biến với `equals` theo id, chứ không thuộc về `record`. Giữa hai đầu đó là class bất biến viết tay, và tôi chọn nó khi cần tính bất biến nhưng `record` không vừa ở một trong ba chỗ: cần ẩn một phần state — `record` phơi mọi thành phần qua accessor nên không che được gì; cần `equals` chỉ theo một phần thành phần; hoặc cần kế thừa từ một class khác, thứ `record` không làm được. Cái giá là ta phải tự viết và tự bảo trì `equals`, `hashCode`, `toString`, và mỗi lần thêm field là một lần có thể quên — nên tôi chỉ trả giá đó khi có lý do cụ thể, không trả vì phản xạ.",
    redFlags: [
      "Dùng `record` làm entity ánh xạ database",
      "Loại `record` vì \"không validate được\" — constructor gọn làm được",
      "Chọn theo độ ngắn của cú pháp thay vì theo ngữ nghĩa định danh",
      "Viết tay class bất biến khi `record` vừa khít, rồi tự bảo trì ba method sinh được",
    ],
    probes: [
      "`equals` của một entity nên dựa trên gì, và vì sao?",
      "Bạn ẩn một thành phần trong một kiểu bất biến bằng cách nào nếu không dùng `record`?",
      "Constructor gọn của `record` làm được và không làm được gì?",
    ],
    refs: ["wgjd-03", "wgjd-01"],
  },
  {
    id: "wgjd-iq04",
    field: "wgjd",
    topic: "wg-modern",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Sau khi một đội chuyển 40 DTO từ class viết tay sang `record`, một cache trong bộ nhớ bắt đầu phình to bất thường và tỉ lệ hit tụt từ 82% xuống 6%. Không có ngoại lệ nào. Các DTO cũ có `equals` so theo **hai** field định danh; `record` mới so theo cả **chín** thành phần, trong đó có một `timestamp` sinh lúc tạo object.",
      scale: "Cache giữ 2 triệu entry ở trạng thái bình thường. Sau khi chuyển, nó đạt trần 8 triệu entry trong 40 phút và bắt đầu đẩy entry ra liên tục. Độ trễ p99 tăng gấp 5 vì gần như mọi lần đọc đều phải xuống database.",
      constraints: "Không quay lại class viết tay — việc chuyển sang `record` là quyết định kiến trúc đã áp cho cả 40 DTO. Không tăng được kích thước cache. Phải sửa trong ngày vì đang ảnh hưởng production.",
      },
    question: "Nối `equals` của `record` với việc cache mất tác dụng. Nêu chẩn đoán và cách sửa giữ được `record`.",
    mustCover: [
      "`record` sinh `equals` và `hashCode` theo **toàn bộ** thành phần, không theo tập định danh mà nghiệp vụ dùng",
      "Có một thành phần là `timestamp` sinh lúc tạo, nên hai object mô tả **cùng một thứ** lại không bằng nhau",
      "Cache dựa trên `equals`/`hashCode` nên mỗi lần tạo object là một khoá **mới** — hit gần như không bao giờ xảy ra",
      "Đó giải thích cả hai triệu chứng cùng lúc: entry phình vì khoá không trùng, và hit tụt vì cùng lý do",
      "Sửa giữ `record`: **bỏ `timestamp` ra khỏi record**, chuyển nó thành dữ liệu đi kèm chứ không thuộc định danh",
      "Nếu buộc phải giữ mọi thành phần thì dùng một **khoá cache tường minh** — một record nhỏ chỉ chứa hai field định danh",
      "Bài học: chuyển sang `record` hàng loạt là đổi **ngữ nghĩa `equals`** của 40 kiểu, không phải đổi cú pháp",
    ],
    model: "Nối hai đầu rất ngắn: `record` sinh `equals` và `hashCode` theo toàn bộ thành phần của nó, còn cache thì định danh entry bằng đúng hai method đó. Các DTO cũ so theo hai field định danh, nên hai object mô tả cùng một thực thể là bằng nhau và cache dùng lại được. Sau khi chuyển, `equals` so cả chín thành phần — trong đó có một `timestamp` sinh lúc tạo object. Nghĩa là hai object mô tả cùng một thứ, tạo cách nhau một milliseconds, không còn bằng nhau. Từ đó mọi thứ suy ra trực tiếp: mỗi lần tạo object là một khoá mới, nên không bao giờ có hit, và cache tích tụ entry mới cho tới khi đạt trần. Hai triệu chứng — phình to và hit tụt — không phải hai vấn đề mà là hai mặt của cùng một nguyên nhân, và tôi sẽ nói rõ điều đó vì nó ngăn đội đi sửa hai hướng. Cách sửa giữ được `record` và làm được trong ngày. Hướng chính là bỏ `timestamp` ra khỏi record: nó không phải phần định danh của dữ liệu mà là metadata về thời điểm ta tạo bản sao, nên nó vốn không nên nằm trong một kiểu mà `equals` được định nghĩa theo giá trị. Chuyển nó thành dữ liệu đi kèm — một trường riêng ở tầng cache, hoặc một wrapper — thì `equals` của record quay lại phản ánh đúng dữ liệu nghiệp vụ. Nếu vì lý do nào đó phải giữ đủ chín thành phần, hướng thứ hai là tách khoá cache ra tường minh: định nghĩa một record nhỏ chỉ chứa hai field định danh và dùng nó làm khoá, thay vì dùng cả DTO. Cách này còn tốt hơn về thiết kế vì nó nói rõ ràng cái gì định danh một entry, thay vì để điều đó phụ thuộc vào việc DTO có bao nhiêu field. Bài học lớn hơn đáng đưa vào review của đội: chuyển 40 kiểu sang `record` không phải một thay đổi cú pháp mà là thay đổi **ngữ nghĩa `equals`** của 40 kiểu cùng lúc — nên trước khi làm phải rà xem kiểu nào đang được dùng làm khoá của map hoặc phần tử của set, vì đó chính là những chỗ ngữ nghĩa `equals` quyết định hành vi.",
    redFlags: [
      "Tăng kích thước cache — ràng buộc đã cấm, và tỉ lệ hit 6% cho thấy cache đang vô dụng chứ không nhỏ",
      "Kết luận `record` không dùng được cho DTO",
      "Override `equals` bên trong `record` để so hai field — làm được nhưng đánh mất lý do dùng `record` và dễ lệch với `hashCode`",
      "Coi phình cache và tụt hit là hai vấn đề riêng",
      "Sửa một DTO rồi dừng, không rà 39 cái còn lại xem cái nào đang làm khoá",
    ],
    probes: [
      "Bạn rà 40 DTO để tìm cái nào đang được dùng làm khoá bằng cách nào?",
      "Vì sao tách khoá cache tường minh lại tốt hơn về thiết kế?",
      "`timestamp` sinh lúc tạo object nên nằm ở đâu?",
    ],
    refs: ["wgjd-03"],
  },

  // ===== wg-module — Hệ thống module (wgjd-iq05–wgjd-iq08) =====
  {
    id: "wgjd-iq05",
    field: "wgjd",
    topic: "wg-module",
    level: 1,
    minutes: 5,
    question: "Hệ thống module giải bài toán gì mà classpath không giải được? Và vì sao Mark Reinhold nói không có nhu cầu phải chuyển sang module?",
    mustCover: [
      "Classpath là một **danh sách phẳng**: không có khái niệm phụ thuộc giữa các JAR, và không có ranh giới đóng gói ngoài `public`",
      "Hệ quả thứ nhất: lỗi thiếu class chỉ lộ ra **lúc chạy**, khi nạp tới class đó",
      "Hệ quả thứ hai: `public` nghĩa là mọi nơi dùng được, nên không cách nào phơi một phần API và giấu phần nội bộ",
      "Module khai **tường minh** nó cần gì và phơi gì, nên thiếu phụ thuộc bị bắt **lúc khởi động** chứ không lúc chạy",
      "Nó cũng cho đóng gói thật: package không `exports` thì bên ngoài **không dùng được** dù class là `public`",
      "Nhưng module **không bắt buộc**: classpath và JAR kiểu cũ tiếp tục hoạt động, nên đội áp dụng khi sẵn sàng",
    ],
    model: "Classpath là một danh sách phẳng các nơi để tìm class, và hai thứ nó thiếu gây ra hai lớp vấn đề. Thứ nhất, nó không biết gì về quan hệ phụ thuộc: không có chỗ nào khai rằng thư viện A cần thư viện B, nên nếu B thiếu thì chương trình vẫn khởi động bình thường và chỉ vỡ vào lúc nạp tới class cần nó — có thể là ba tuần sau, trên một đường mã ít đi qua. Thứ hai, nó không có ranh giới đóng gói nào ngoài `public`: một class `public` trong một package nội bộ thì mọi nơi dùng được, nên tác giả thư viện không có cách nào nói \"đây là API, còn đây là ruột, đừng chạm\". Hệ thống module giải cả hai bằng cách bắt khai tường minh: một module nói nó **cần** những module nào và **phơi** những package nào. Thiếu phụ thuộc bị phát hiện lúc khởi động, và một package không được `exports` thì bên ngoài không dùng được dù class trong đó là `public` — đóng gói trở thành thứ được thực thi chứ không còn là quy ước. Về câu thứ hai, Mark Reinhold nói không có nhu cầu phải chuyển sang module, và đó là một tuyên bố về **tương thích** chứ không phải đánh giá thấp module: classpath và JAR kiểu cũ tiếp tục hoạt động, nên một đội dùng Java hiện đại không buộc phải modular hoá gì cả. Điều này quan trọng trong thực hành vì nó đổi câu hỏi từ \"khi nào ta phải chuyển\" thành \"chuyển thì được gì cho trường hợp của ta\" — và với một ứng dụng nội bộ triển khai nguyên khối thì câu trả lời có thể là không đủ để đáng công, trong khi với một thư viện nhiều người dùng thì lợi ích về đóng gói là rất thật.",
    redFlags: [
      "Nói module là bắt buộc từ Java 9 trở lên",
      "Chỉ nêu lợi ích về kích thước runtime, bỏ qua hai vấn đề gốc của classpath",
      "Không nhận ra `public` mất ý nghĩa đóng gói trên classpath",
    ],
    probes: [
      "Cho một ca mà lỗi thiếu phụ thuộc chỉ lộ ra rất muộn trên classpath",
      "Với ứng dụng nội bộ của bạn, module đem lại gì cụ thể?",
      "Điều gì xảy ra khi một thư viện chưa modular hoá nằm trên module path?",
    ],
    refs: ["wgjd-02"],
  },
  {
    id: "wgjd-iq06",
    field: "wgjd",
    topic: "wg-module",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// module-info.java của một thư viện nội bộ
module com.acme.billing {
    requires java.sql;
    requires com.fasterxml.jackson.databind;

    exports com.acme.billing;
    exports com.acme.billing.internal;      // (1)
    exports com.acme.billing.model;
}

// Và một consumer dùng reflection để đọc model:
// jackson cần truy cập field của com.acme.billing.model.Invoice
// -> chạy lên ném InaccessibleObjectException                    (2)`,
    },
    question: "Chỉ ra hai vấn đề trong file này — một về thiết kế, một về lỗi lúc chạy ở dòng (2) — rồi sửa cả hai.",
    mustCover: [
      "Vấn đề thiết kế: `exports` một package tên `internal` là **tự phá** lý do dùng module",
      "Phơi package nội bộ ra nghĩa là bên ngoài phụ thuộc được vào nó, và ta mất quyền đổi nó",
      "Nếu một consumer cụ thể thật sự cần thì dùng **`exports ... to`** để phơi có chọn lọc, không phơi cho mọi người",
      "Lỗi lúc chạy: `exports` cho phép **truy cập lúc biên dịch và lúc chạy qua API công khai**, nhưng **không** cho phép reflection sâu vào field",
      "Reflection sâu cần **`opens`**, khác `exports` — đó là phân biệt cốt lõi của hệ thống module",
      "Sửa: `opens com.acme.billing.model to com.fasterxml.jackson.databind;`",
      "Dùng `opens ... to` thay vì `opens` mở cho mọi người, để giữ đóng gói với phần còn lại",
    ],
    model: "Hai vấn đề nằm ở hai tầng khác nhau. Vấn đề thiết kế là dòng `exports com.acme.billing.internal`. Toàn bộ giá trị của việc khai module nằm ở chỗ ta phân biệt được API với ruột; phơi một package mà chính tên nó nói là nội bộ thì ta đã tự bỏ điều đó — và tệ hơn là không thể lấy lại, vì từ khi ai đó ngoài kia phụ thuộc vào nó thì mọi thay đổi của ta là thay đổi phá vỡ. Nếu có một consumer cụ thể thật sự cần, cách đúng là `exports com.acme.billing.internal to <tên module đó>`, tức phơi có chọn lọc cho đúng một bên đã biết, thay vì phơi cho toàn thế giới. Vấn đề thứ hai là lỗi lúc chạy, và nó chỉ ra một phân biệt mà nhiều người bỏ qua: `exports` và `opens` không phải hai mức độ của cùng một thứ. `exports` cho phép truy cập kiểu và thành viên công khai của package, lúc biên dịch và lúc chạy — nhưng nó **không** cho phép reflection sâu vào các field, kể cả field `public`. Đó là lý do Jackson ném lỗi khi cố đọc field của `Invoice` dù package đã được `exports`. Thứ cho phép reflection sâu là `opens`, và nó là một cấp phép hoàn toàn riêng. Nên bản sửa là thêm `opens com.acme.billing.model to com.fasterxml.jackson.databind;`. Tôi dùng dạng `opens ... to` chứ không phải `opens` trần, vì mở reflection sâu cho mọi module nghĩa là cho bất kỳ ai cũng chạm được vào ruột object của ta — đúng thứ đóng gói của module đang cố ngăn. Nói gọn lại thì file này đang quá mở ở chỗ không cần (`internal`) và quá kín ở chỗ cần (`model`), và cả hai đều đến từ việc chưa tách bạch `exports` với `opens`.",
    redFlags: [
      "Sửa lỗi (2) bằng cách thêm `exports` — không giải quyết gì vì reflection sâu cần `opens`",
      "Dùng `opens` trần cho mọi module thay vì `opens ... to`",
      "Mở cả module bằng `open module` để cho nhanh",
      "Không thấy vấn đề thiết kế ở dòng `exports ... internal`",
    ],
    probes: [
      "Phân biệt chính xác `exports` và `opens`",
      "`open module` khác `opens` từng package thế nào, và khi nào bạn chấp nhận nó?",
      "Nếu Jackson được thay bằng một thư viện khác thì khai báo của bạn đổi thế nào?",
    ],
    refs: ["wgjd-02", "wgjd-04"],
  },
  {
    id: "wgjd-iq07",
    field: "wgjd",
    topic: "wg-module",
    level: 3,
    minutes: 10,
    question: "Đội bạn có một ứng dụng Java lớn trên classpath. Bạn có modular hoá nó không?",
    tradeoffs: [
      {
        option: "Giữ classpath",
        when: "Ứng dụng nội bộ triển khai nguyên khối, không ai ngoài đội dùng mã của bạn như thư viện. Sách dẫn lời kiến trúc sư trưởng của Java: **không có nhu cầu** phải chuyển sang module, và JAR kiểu cũ tiếp tục hoạt động. Chi phí chuyển là thật còn lợi ích về đóng gói thì mờ.",
      },
      {
        option: "Modular hoá phần **thư viện dùng chung**, giữ ứng dụng trên classpath",
        when: "Khuyến nghị của tôi cho phần lớn trường hợp. Lợi ích đóng gói tập trung đúng ở chỗ nhiều người dùng chung mã, còn ứng dụng đầu cuối không phải trả chi phí chuyển đổi.",
      },
      {
        option: "Modular hoá toàn bộ",
        when: "Khi cần **runtime thu gọn** cho ảnh container nhỏ, hoặc khi phát hành mã cho nhiều bên ngoài tổ chức. Đổi lại là phải xử lý mọi thư viện chưa modular hoá, mọi chỗ dùng reflection, và mọi phụ thuộc lẫn nhau giữa các phần.",
      },
    ],
    mustCover: [
      "Câu hỏi đúng là **được gì cho trường hợp cụ thể**, không phải \"có nên hiện đại hoá hay không\"",
      "Lợi ích lớn nhất là **đóng gói được thực thi** — và nó chỉ đáng giá khi có người khác dùng mã của bạn",
      "Lợi ích thứ hai là bắt lỗi phụ thuộc **lúc khởi động** thay vì lúc chạy",
      "Chi phí thật: thư viện chưa modular hoá, reflection, phụ thuộc vòng giữa các phần hiện có",
      "Không cần chuyển tất cả một lần — áp dụng dần là đường đi được nền tảng hỗ trợ có chủ ý",
      "Với ứng dụng nội bộ nguyên khối, câu trả lời trung thực thường là **chưa cần**",
    ],
    model: "Tôi đặt câu hỏi theo hướng lợi ích cụ thể chứ không theo hướng hiện đại hoá, vì nền tảng đã nói rõ lập trường: sách dẫn lời Mark Reinhold rằng không có nhu cầu phải chuyển sang module, và classpath cùng JAR kiểu cũ tiếp tục hoạt động cho tới khi đội sẵn sàng. Nên đây là một quyết định đầu tư, và tôi cân hai lợi ích với ba chi phí. Lợi ích thứ nhất và lớn nhất là đóng gói được thực thi: một package không `exports` thì bên ngoài không dùng được, nên ta giữ được quyền thay đổi phần nội bộ. Nhưng lợi ích này chỉ có giá trị khi **có người khác** dùng mã của ta — trong một ứng dụng mà cả cây mã thuộc một đội và triển khai nguyên khối, nó gần như không đổi gì, vì ranh giới có thể giữ bằng review và quy ước. Lợi ích thứ hai là lỗi phụ thuộc bị bắt lúc khởi động thay vì lúc chạy, và nó thật nhưng khiêm tốn nếu ta đã có một hệ thống build quản lý phụ thuộc chặt. Ba chi phí thì cụ thể: thư viện chưa modular hoá phải được xử lý, mọi chỗ dùng reflection phải khai `opens` cho đúng bên, và phụ thuộc vòng giữa các phần hiện có phải được tháo — cái thứ ba thường là phần tốn nhất vì nó buộc đối diện với những chỗ thiết kế đã trôi. Vì vậy khuyến nghị của tôi cho phần lớn trường hợp là ở giữa: modular hoá phần thư viện dùng chung, nơi nhiều đội cùng dùng và lợi ích đóng gói tập trung, còn ứng dụng đầu cuối thì để trên classpath. Tôi chuyển toàn bộ khi có một lý do cụ thể — cần runtime thu gọn cho ảnh container nhỏ, hoặc phát hành mã ra ngoài tổ chức. Và trong mọi trường hợp thì không chuyển tất cả một lần, vì việc áp dụng dần là đường đi mà nền tảng hỗ trợ có chủ ý.",
    redFlags: [
      "Trả lời \"nên, vì đó là cách hiện đại\" mà không nêu lợi ích cụ thể",
      "Bỏ qua chi phí xử lý thư viện chưa modular hoá và các chỗ dùng reflection",
      "Cho rằng phải chuyển toàn bộ cùng lúc",
      "Nói classpath sẽ bị bỏ nên phải chuyển sớm",
    ],
    probes: [
      "Lợi ích đóng gói của module khác gì với việc chỉ dùng quy ước và review?",
      "Phụ thuộc vòng giữa hai phần hiện có thì bạn tháo thế nào?",
      "Runtime thu gọn đáng giá bao nhiêu trong ngữ cảnh container?",
    ],
    refs: ["wgjd-02", "wgjd-12"],
  },
  {
    id: "wgjd-iq08",
    field: "wgjd",
    topic: "wg-module",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ chạy tốt nhiều tháng, rồi sau khi nâng một thư viện phụ, nó ném `NoSuchMethodError` trên một đường mã ít đi qua — nhưng chỉ ở môi trường production, không ở staging. Cả hai môi trường dùng cùng ảnh container. Ứng dụng chạy trên classpath với 214 JAR.",
      scale: "Đường mã đó chạy khoảng 300 lần mỗi ngày, và mỗi lần đều thất bại. Đã ba ngày trước khi có người nối được khiếu nại của khách với lỗi.",
      constraints: "Không modular hoá được ứng dụng trong đợt này. Phải giải thích được vì sao staging không tái hiện, vì đội đang định phát hành lại và hy vọng nó tự hết. Phải chặn được lớp lỗi này tái diễn, không chỉ sửa ca này.",
      },
    question: "Vì sao cùng một ảnh container mà hai môi trường hành xử khác nhau? Nêu chẩn đoán và cách chặn lớp lỗi này khi không modular hoá được.",
    mustCover: [
      "`NoSuchMethodError` lúc chạy là dấu hiệu **phiên bản class được nạp khác** phiên bản lúc biên dịch",
      "Trên classpath, khi hai JAR chứa cùng một class thì **JAR nào đứng trước thắng** — không có lỗi, không có cảnh báo",
      "Nâng thư viện phụ đã kéo theo một phụ thuộc bắc cầu trùng class với một JAR khác",
      "Cùng ảnh container nhưng **thứ tự classpath có thể khác** nếu nó phụ thuộc thứ tự liệt kê thư mục hoặc biến môi trường",
      "Đó giải thích vì sao staging không tái hiện — và nghĩa là **phát hành lại không giúp gì**, chỉ đổi xác suất",
      "Chặn lớp lỗi mà không cần module: bắt build **báo lỗi khi có class trùng** giữa các JAR",
      "Cộng thêm: khoá phiên bản phụ thuộc bắc cầu, và kiểm cây phụ thuộc mỗi lần nâng",
      "Đường mã ít đi qua là lý do lỗi sống ba ngày — nên cần kiểm ở build chứ không dựa vào kiểm thử",
    ],
    model: "`NoSuchMethodError` lúc chạy hầu như luôn có nghĩa một chuyện: class được nạp lúc chạy không phải class đã dùng lúc biên dịch. Trên classpath thì điều đó rất dễ xảy ra và xảy ra im lặng, vì classpath là một danh sách phẳng và khi hai JAR chứa cùng một tên class thì JAR nào đứng trước sẽ thắng — không có lỗi, không có cảnh báo, chỉ là một trong hai bản bị che hoàn toàn. Việc nâng thư viện phụ gần như chắc chắn đã kéo theo một phụ thuộc bắc cầu trùng class với một JAR khác trong 214 cái. Phần khó nhất của câu hỏi là vì sao cùng một ảnh container mà hai môi trường khác nhau, và câu trả lời cũng là phần quan trọng nhất: nếu classpath được dựng theo thứ tự liệt kê một thư mục, hoặc từ một biến môi trường, hoặc bằng ký tự đại diện, thì **thứ tự** có thể khác nhau giữa hai lần chạy và giữa hai môi trường — cùng tập JAR nhưng khác thứ tự thì khác bản class được nạp. Hệ quả tôi sẽ nói ngay với đội vì họ đang định làm sai: phát hành lại **không** giúp gì, nó chỉ tung lại xúc xắc; và staging không tái hiện không phải bằng chứng rằng staging đúng, mà là bằng chứng rằng thứ tự ở đó đang tình cờ thuận lợi. Việc đầu tiên cần làm để xác nhận là in ra classpath thật ở cả hai môi trường và tìm class bị trùng — rẻ và cho câu trả lời dứt khoát. Về việc chặn lớp lỗi khi không modular hoá được: điều tôi muốn nhất là chuyển việc phát hiện từ lúc chạy sang lúc build. Hệ thống build có thể kiểm và báo lỗi khi hai JAR cùng chứa một class, nên xung đột trở thành một build đỏ thay vì một lỗi ba ngày sau trên một đường mã ít đi qua. Kèm theo là khoá phiên bản các phụ thuộc bắc cầu để mỗi lần nâng một thư viện không âm thầm đổi năm thư viện khác, và thêm một bước xem cây phụ thuộc vào quy trình nâng cấp. Và tôi sẽ ghi lại rằng đây chính là lớp vấn đề mà hệ thống module giải bằng cách bắt khai tường minh — nên việc modular hoá phần thư viện dùng chung là món nợ có lý do rõ ràng, không phải một mong muốn hiện đại hoá.",
    redFlags: [
      "Phát hành lại và hy vọng lỗi tự hết",
      "Kết luận staging đúng và production có gì bất thường về hạ tầng",
      "Sửa bằng cách ghim một phiên bản rồi dừng, không chặn lớp lỗi ở build",
      "Dựa vào kiểm thử để bắt lớp lỗi này, trong khi đường mã chỉ chạy 300 lần mỗi ngày",
      "Đòi modular hoá ngay như điều kiện để sửa — ràng buộc đã cấm và không cần thiết",
    ],
    probes: [
      "Bạn xác nhận giả thuyết class trùng bằng cách nào, cụ thể?",
      "Vì sao cùng tập JAR mà thứ tự classpath lại khác giữa hai môi trường?",
      "Kiểm ở build phát hiện được gì mà kiểm thử không?",
    ],
    refs: ["wgjd-02", "wgjd-11"],
  },

  // ===== wg-bytecode — Class file, bytecode và nội tại JVM (wgjd-iq09–wgjd-iq12) =====
  {
    id: "wgjd-iq09",
    field: "wgjd",
    topic: "wg-bytecode",
    level: 1,
    minutes: 6,
    question: "Mô tả đường đi từ một file `.class` trên đĩa tới một object dùng được trong bộ nhớ. Class loader đóng vai gì, và vì sao có nhiều class loader?",
    mustCover: [
      "Class loader **nạp** bytecode, JVM **kiểm chứng** nó, rồi **chuẩn bị** và **phân giải** tham chiếu, cuối cùng **khởi tạo** class",
      "Khởi tạo class là thời điểm chạy static initializer, và nó xảy ra **lười** — lần đầu class thực sự được dùng",
      "Mỗi class được định danh bằng **tên đầy đủ cộng class loader đã nạp nó**, không chỉ bằng tên",
      "Vì vậy hai class cùng tên nạp bởi hai loader khác nhau là **hai kiểu khác nhau**, và ép kiểu giữa chúng thất bại",
      "Nhiều class loader để **cách ly**: ứng dụng trong máy chủ, plugin, hoặc nạp lại mã lúc chạy",
      "Mô hình phân cấp mặc định: loader con hỏi loader cha trước, nên class nền tảng không bị mã ứng dụng thay thế",
    ],
    model: "Đường đi có mấy chặng rõ rệt. Trước hết một class loader tìm và nạp byte của file `.class`. Rồi JVM kiểm chứng bytecode — bước này bảo đảm mã không làm những việc phá vỡ an toàn kiểu, và nó là lý do ta không thể nạp bytecode bất kỳ để lách hệ thống kiểu. Tiếp đến là chuẩn bị, cấp bộ nhớ cho các field static với giá trị mặc định, rồi phân giải các tham chiếu tượng trưng tới class và thành viên khác. Cuối cùng là khởi tạo class, tức chạy static initializer — và điểm đáng nhớ là bước này **lười**: nó xảy ra lần đầu class thực sự được dùng, không phải lúc nạp. Đó là lý do một static initializer có lỗi có thể nằm im rất lâu rồi mới nổ, và nó nổ dưới dạng lỗi khởi tạo class chứ không phải ngoại lệ gốc. Phần class loader thì có một chi tiết quyết định mà nhiều người bỏ qua: **một class được định danh bằng tên đầy đủ cộng với class loader đã nạp nó**, chứ không chỉ bằng tên. Nên hai class cùng tên, cùng nội dung, nạp bởi hai loader khác nhau là hai kiểu hoàn toàn khác nhau với JVM — gán cái này cho biến kiểu cái kia sẽ ném lỗi ép kiểu, kèm một thông báo trông vô lý kiểu \"không thể ép `Foo` sang `Foo`\". Biết điều này là biết cách đọc đúng một lớp lỗi rất khó chịu. Vì sao có nhiều loader? Vì cách ly: một máy chủ ứng dụng cần mỗi ứng dụng thấy phiên bản thư viện của riêng nó, một hệ thống plugin cần nạp và bỏ mã lúc chạy, và một công cụ phát triển cần nạp lại class đã sửa. Mô hình mặc định là phân cấp — loader con hỏi loader cha trước — và nó bảo đảm mã ứng dụng không thay thế được class nền tảng.",
    redFlags: [
      "Mô tả class loader chỉ như \"nó đọc file class\", bỏ qua kiểm chứng và khởi tạo lười",
      "Không biết định danh class gồm cả class loader",
      "Nói mọi class được nạp lúc khởi động ứng dụng",
    ],
    probes: [
      "Bạn đã gặp lỗi ép kiểu \"Foo sang Foo\" chưa, và nó nói gì?",
      "Static initializer ném ngoại lệ thì bạn thấy lỗi gì?",
      "Mô hình phân cấp bảo vệ được điều gì?",
    ],
    refs: ["wgjd-04", "wgjd-17"],
  },
  {
    id: "wgjd-iq10",
    field: "wgjd",
    topic: "wg-bytecode",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class Config {
    private static final Map<String, String> DEFAULTS = loadDefaults();
    private static final String REGION = System.getenv("REGION");

    static {
        if (REGION == null)
            throw new IllegalStateException("REGION chưa được đặt");
    }

    private static Map<String, String> loadDefaults() {
        return Files.readAllLines(Path.of("/etc/app/defaults.conf"))  // ném IOException
            .stream().collect(toMap(...));
    }

    public static String get(String key) { ... }
}

// Ở production, log chỉ có một dòng:
//   java.lang.NoClassDefFoundError: Could not initialize class Config
//   ... và KHÔNG có nguyên nhân gốc nào`,
    },
    question: "Vì sao log chỉ có `NoClassDefFoundError` mà không có nguyên nhân gốc? Giải thích cơ chế khởi tạo class, rồi sửa để lỗi thật lộ ra.",
    mustCover: [
      "Lần **đầu** class được dùng, static initializer chạy; nếu nó ném thì JVM bọc lại thành `ExceptionInInitializerError`",
      "Từ lần **thứ hai** trở đi, class bị đánh dấu **lỗi** và mọi lần dùng sau ném `NoClassDefFoundError` — **không** mang theo nguyên nhân gốc",
      "Nên log chỉ có `NoClassDefFoundError` nghĩa là ta đang xem **lần thứ hai trở đi**; lần đầu đã bị mất ở đâu đó",
      "Việc cần làm đầu tiên: tìm lại **lần đầu tiên** trong log, nơi có `ExceptionInInitializerError` kèm nguyên nhân thật",
      "Sửa gốc: **không** đặt việc có thể thất bại — đọc tệp, đọc biến môi trường — vào static initializer",
      "Chuyển sang khởi tạo tường minh ở lúc khởi động ứng dụng, nơi lỗi ném ra có ngữ cảnh và dừng được tiến trình một cách có kiểm soát",
      "Nếu buộc phải giữ static thì **bắt và ghi log** trong initializer trước khi ném lại, để nguyên nhân không bị mất",
    ],
    model: "Cơ chế nằm ở vòng đời khởi tạo class. Lần đầu `Config` được dùng, JVM chạy static initializer; nếu nó ném ngoại lệ thì JVM bọc lại thành `ExceptionInInitializerError` — và lần đó **có** mang theo nguyên nhân gốc, ở đây sẽ là `IOException` về tệp `/etc/app/defaults.conf` hoặc `IllegalStateException` về `REGION`. Nhưng JVM cũng đánh dấu class ở trạng thái lỗi vĩnh viễn, và từ lần thứ hai trở đi mọi cố gắng dùng class này ném `NoClassDefFoundError` với thông báo \"Could not initialize class\" mà **không** mang nguyên nhân gốc — vì nguyên nhân đã xảy ra một lần rồi, ở quá khứ. Nên điều log đang nói với ta là: ta đang xem lần thứ hai trở đi, còn lần đầu tiên nằm ở đâu đó sớm hơn trong log, có thể ở một request khác hoặc lúc khởi động. Việc đầu tiên tôi làm không phải sửa mã mà là tìm lại dòng đầu tiên đó — nó có `ExceptionInInitializerError` kèm nguyên nhân thật, và nó trả lời câu hỏi trong một phút thay vì một buổi. Về cách sửa thì vấn đề gốc là thiết kế: static initializer đang làm hai việc có thể thất bại vì lý do môi trường — đọc một tệp trên đĩa và đọc một biến môi trường. Cả hai là những thứ nên được kiểm ở lúc khởi động ứng dụng, tường minh, nơi ta kiểm soát được thứ tự và nơi lỗi ném ra kèm đủ ngữ cảnh rồi dừng tiến trình một cách sạch sẽ — thà không khởi động được còn hơn khởi động rồi hỏng ở request thứ một nghìn với một thông báo vô nghĩa. Nếu vì lý do nào đó phải giữ static, thì tối thiểu phải bắt ngoại lệ trong initializer, ghi log kèm ngữ cảnh, rồi mới ném lại — như vậy nguyên nhân được lưu ngay cả khi thông báo bị JVM thay thế ở những lần sau.",
    redFlags: [
      "Kết luận thiếu class trên classpath — tên lỗi gây nhầm nhưng thông báo đã nói rõ là không khởi tạo được",
      "Thêm try-catch quanh chỗ **gọi** `Config.get` — không lấy lại được nguyên nhân gốc",
      "Không nghĩ tới việc đi tìm lần xảy ra đầu tiên trong log",
      "Giữ nguyên static initializer và chỉ thêm giá trị mặc định cho `REGION`",
    ],
    probes: [
      "Bạn tìm lần xảy ra đầu tiên trong log bằng cách nào?",
      "Vì sao \"thà không khởi động được\" lại tốt hơn ở đây?",
      "Nếu `DEFAULTS` phải nạp lười thì bạn thiết kế thế nào?",
    ],
    refs: ["wgjd-04"],
  },
  {
    id: "wgjd-iq11",
    field: "wgjd",
    topic: "wg-bytecode",
    level: 3,
    minutes: 10,
    question: "Bạn cần gọi một method mà chỉ biết tên lúc chạy. Chọn reflection, `MethodHandle`, hay sinh mã?",
    tradeoffs: [
      {
        option: "Reflection",
        when: "Việc gọi **thưa** và tính linh hoạt quan trọng hơn tốc độ: đọc cấu hình, dựng object trong framework, công cụ phát triển. API quen, không cần chuẩn bị. Cái giá: kiểm quyền truy cập mỗi lần gọi, không thân thiện với tối ưu của JIT, và trên module path cần `opens`.",
      },
      {
        option: "`MethodHandle`",
        when: "Khi cùng một lời gọi động lặp lại **rất nhiều lần** trên đường nóng. Tra cứu và kiểm quyền làm **một lần** lúc tạo handle, còn lời gọi sau đó gần với lời gọi thường. Đổi lại là API khó hơn và phải tự quản lý handle.",
      },
      {
        option: "Sinh mã",
        when: "Khi cần hiệu năng của mã tĩnh cho một tập thao tác biết trước tại thời điểm build hoặc khởi động — thứ mà nhiều thư viện ánh xạ dữ liệu làm. Nhanh nhất, nhưng thêm một tầng phức tạp vào build và làm mã khó debug.",
      },
    ],
    mustCover: [
      "Reflection kiểm quyền truy cập **mỗi lần gọi** và không cho JIT tối ưu như lời gọi tĩnh",
      "`MethodHandle` dồn phần đắt vào **lúc tạo** thay vì lúc gọi, nên nó thắng khi lời gọi lặp nhiều",
      "Nên trục quyết định là **số lần gọi**, không phải \"cái nào nhanh hơn\" nói chung",
      "Trên module path, reflection sâu cần `opens` — nên lựa chọn này có hệ quả tới cả khai báo module",
      "Reflection cũng làm mất **an toàn kiểu lúc biên dịch**: sai tên method chỉ lộ ra lúc chạy",
      "Trước cả ba, phải hỏi: có thật cần động không, hay một interface cộng một map là đủ?",
    ],
    model: "Trước khi chọn trong ba, tôi hỏi một câu rẻ hơn: có thật cần gọi động hay không? Rất nhiều trường hợp \"chỉ biết tên lúc chạy\" thực ra là một tập hữu hạn biết trước, và khi đó một interface cộng một map từ tên tới implementation cho ta mọi thứ cần với an toàn kiểu đầy đủ — nhanh hơn, đọc được, và lỗi bị bắt lúc biên dịch. Tôi chỉ đi vào ba phương án kia khi tập thao tác thật sự mở. Khi đó trục quyết định là **số lần gọi**, không phải cái nào nhanh hơn nói chung. Reflection dồn chi phí vào mỗi lần gọi: nó phải kiểm quyền truy cập lần nào cũng như lần nào, và lời gọi qua reflection không được JIT tối ưu như một lời gọi tĩnh. Với việc gọi thưa — đọc cấu hình lúc khởi động, framework dựng object một lần cho mỗi bean — chi phí đó không đáng kể và ta được đổi lấy một API quen thuộc, không cần chuẩn bị gì. `MethodHandle` đảo ngược cấu trúc chi phí: phần tra cứu và kiểm quyền xảy ra một lần lúc tạo handle, còn mỗi lời gọi sau đó gần với lời gọi thường. Nên nếu cùng một lời gọi động lặp hàng triệu lần trên đường nóng thì nó thắng rõ rệt; cái giá là API khó hơn và ta phải tự giữ handle ở đâu đó, tức tự quản lý một cache. Sinh mã là bậc cuối, và đó là thứ nhiều thư viện ánh xạ dữ liệu làm: với một tập thao tác biết trước tại thời điểm build hoặc khởi động, sinh ra mã tĩnh rồi gọi như mã thường cho hiệu năng tốt nhất, nhưng nó thêm một tầng vào build và làm việc debug khó hơn vì thứ đang chạy không phải thứ ta viết. Hai hệ quả áp cho cả ba mà tôi luôn nêu: dùng reflection sâu trên module path thì phải khai `opens` cho đúng module, nên lựa chọn kỹ thuật này chạm cả tới khai báo module; và mọi lời gọi động đều đánh đổi an toàn kiểu lúc biên dịch — một cái tên method viết sai chỉ lộ ra lúc chạy, nên phải có kiểm thử phủ đúng những đường đó.",
    redFlags: [
      "Chọn ngay reflection mà không hỏi có thật cần động hay không",
      "So sánh theo \"cái nào nhanh hơn\" mà không gắn với số lần gọi",
      "Quên rằng reflection sâu cần `opens` trên module path",
      "Bỏ qua việc mất an toàn kiểu lúc biên dịch",
    ],
    probes: [
      "Cho một ca mà một interface cộng một map thay được reflection",
      "Bạn cache `MethodHandle` ở đâu và theo khoá gì?",
      "Sinh mã làm việc debug khó hơn ở chỗ nào?",
    ],
    refs: ["wgjd-04", "wgjd-17"],
  },
  {
    id: "wgjd-iq12",
    field: "wgjd",
    topic: "wg-bytecode",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một ứng dụng có hệ thống plugin nạp mã lúc chạy bắt đầu rò rỉ bộ nhớ sau mỗi lần nạp lại plugin. Heap dump cho thấy nhiều bản của cùng các class plugin, mỗi bản thuộc một class loader khác, và các loader cũ không bị thu gom. Một trong các class plugin có một `ThreadLocal` và một thread pool tĩnh.",
      scale: "Plugin được nạp lại khoảng 30 lần mỗi ngày khi đội nghiệp vụ đổi quy tắc. Sau chừng 200 lần nạp lại, ứng dụng phải khởi động lại. Metaspace tăng đều chứ không chỉ heap.",
      constraints: "Không bỏ được tính năng nạp lại nóng — nó là lý do hệ thống plugin tồn tại. Không sửa được mã plugin do đội nghiệp vụ viết, chỉ sửa được phần khung nạp plugin. Phải chẩn đoán được lớp lỗi này cho cả những plugin sẽ viết trong tương lai.",
      },
    question: "Vì sao class loader cũ không được thu gom? Nêu chẩn đoán, và cách phần khung chặn được lớp lỗi này khi không sửa được mã plugin.",
    mustCover: [
      "Một class loader chỉ được thu gom khi **không còn tham chiếu** tới chính nó, tới class nó nạp, hay tới instance của những class đó",
      "Metaspace tăng đều là dấu hiệu đặc trưng: **class** đang tích tụ, không chỉ object",
      "`ThreadLocal` là thủ phạm kinh điển: giá trị bị giữ bởi **thread**, mà thread pool sống lâu hơn plugin",
      "Một thread pool tĩnh trong plugin còn tệ hơn: thread do nó tạo giữ **context class loader** của plugin",
      "Mọi tham chiếu từ mã sống lâu tới object của plugin đều neo cả loader — kể cả listener đã đăng ký, shutdown hook, timer",
      "Khung chặn được bằng cách **cách ly vòng đời**: chạy plugin trong một khung có đường dọn tường minh, và thu hồi mọi thứ nó đăng ký",
      "Cụ thể: khung cấp thread pool và registry **của khung**, plugin không tự tạo, nên khung dọn được",
      "Cộng thêm một kiểm chứng: sau khi nạp lại, khung kiểm loader cũ **đã** được thu gom và báo động nếu chưa",
    ],
    model: "Class loader là một object bình thường về mặt thu gom rác, nhưng nó có một mạng tham chiếu rộng khác thường: nó bị giữ sống bởi tham chiếu tới chính nó, tới bất kỳ class nó đã nạp, hoặc tới bất kỳ instance của những class đó. Nên chỉ cần một tham chiếu duy nhất từ mã sống lâu là cả loader cùng toàn bộ class nó nạp không thể bị thu gom — và vì class nằm ở metaspace, dấu hiệu đặc trưng là metaspace tăng đều chứ không chỉ heap, đúng như đề bài mô tả. Với hai thứ trong plugin thì tôi đã có hai giả thuyết mạnh. `ThreadLocal` là thủ phạm kinh điển vì cơ chế lưu của nó là ngược với trực giác: giá trị được giữ bởi **thread**, không bởi object đặt nó; nên nếu thread thuộc một pool sống lâu hơn plugin thì giá trị đó — và class của nó, và loader của class đó — bị neo lại sau khi plugin đã bị gỡ. Thread pool tĩnh trong plugin còn tệ hơn một bậc: mỗi thread nó tạo giữ context class loader tại thời điểm tạo, tức giữ chính loader của plugin, và nếu pool không được shutdown thì thread sống mãi. Ngoài hai cái đó tôi sẽ soát cả những đường neo cùng họ: listener đã đăng ký vào registry của khung, shutdown hook, timer, và bất kỳ cache nào của khung đang giữ object plugin. Về cách chặn khi không sửa được mã plugin — và đây là phần đề bài đòi — tôi đổi từ \"yêu cầu plugin cư xử tốt\" sang \"khung không cho plugin có cơ hội cư xử tệ\". Cụ thể là cách ly vòng đời: khung cấp thread pool và registry của **khung** cho plugin dùng thay vì để plugin tự tạo, nên khi nạp lại thì khung dọn sạch mọi thread và mọi đăng ký gắn với phiên bản plugin đó. Với `ThreadLocal` thì khung dọn giá trị của các thread nó quản lý sau mỗi lần trả thread về pool. Đó là nguyên tắc chung: mọi tài nguyên có vòng đời dài hơn plugin phải do khung sở hữu, vì chỉ khung mới biết khi nào plugin kết thúc. Cuối cùng, để lớp lỗi này không âm thầm quay lại với những plugin tương lai, tôi thêm một kiểm chứng vào chính quy trình nạp lại: giữ một tham chiếu yếu tới loader cũ, và sau khi nạp lại cùng một vòng thu gom thì kiểm xem nó đã được thu gom chưa — nếu chưa thì báo động ngay, kèm thông tin giúp truy đường neo. Như vậy sự cố chuyển từ \"phát hiện sau 200 lần nạp lại\" sang \"phát hiện ngay lần đầu\".",
    redFlags: [
      "Nâng metaspace — chỉ dời thời điểm phải khởi động lại",
      "Yêu cầu đội nghiệp vụ viết plugin cẩn thận hơn, trong khi ràng buộc nói không sửa được mã plugin",
      "Gọi `System.gc()` sau mỗi lần nạp lại",
      "Chỉ nhìn heap mà bỏ qua dấu hiệu metaspace tăng",
      "Sửa hai thủ phạm đã biết rồi dừng, không dựng kiểm chứng cho plugin tương lai",
    ],
    probes: [
      "Vì sao `ThreadLocal` neo được cả một class loader?",
      "Context class loader của một thread được đặt lúc nào?",
      "Kiểm chứng bằng tham chiếu yếu hoạt động thế nào, và nó có thể báo động oan không?",
    ],
    refs: ["wgjd-04", "wgjd-17"],
  },

  // ===== wg-concurrent — Lập trình đồng thời và thư viện JDK (wgjd-iq13–wgjd-iq16) =====
  {
    id: "wgjd-iq13",
    field: "wgjd",
    topic: "wg-concurrent",
    level: 1,
    minutes: 6,
    question: "Vì sao thư viện `java.util.concurrent` gần như luôn là lựa chọn tốt hơn tự viết cơ chế đồng bộ bằng `synchronized` và `wait`/`notify`?",
    mustCover: [
      "`wait`/`notify` đòi viết đúng nhiều chi tiết: luôn chờ trong **vòng lặp** kiểm điều kiện, vì có thể bị **đánh thức giả**",
      "Phải chọn đúng giữa `notify` và `notifyAll`, và chọn sai gây **treo** hoặc **đánh thức vô ích** hàng loạt",
      "Thư viện cung cấp những **khối xây dựng đã đúng**: hàng đợi chặn, latch, semaphore, biến atomic, collection đồng thời",
      "Nó cũng cho những thứ `synchronized` **không** làm được: khoá có timeout, khoá có thể interrupt, khoá đọc-ghi tách biệt",
      "Các collection đồng thời dùng khoá **mịn** nên mở rộng tốt hơn nhiều so với bọc `synchronized` quanh collection thường",
      "Mã dùng thư viện cũng **đọc được ý định**: thấy `CountDownLatch` là biết đang chờ một sự kiện, thấy `Semaphore` là biết đang giới hạn",
    ],
    model: "Lý do đầu tiên là tự viết bằng `wait`/`notify` đòi làm đúng một loạt chi tiết mà không có gì nhắc khi ta làm sai. Phải luôn chờ trong một vòng lặp kiểm lại điều kiện, vì thread có thể bị đánh thức giả — nghĩa là tỉnh dậy mà điều kiện chưa thoả; viết `if` thay vì `while` là một lỗi im lặng, chạy đúng trong kiểm thử và hỏng dưới tải. Phải quyết định giữa `notify` và `notifyAll`: chọn `notify` khi có nhiều bên chờ những điều kiện khác nhau thì có thể đánh thức đúng bên không làm được việc, và hệ thống treo; chọn `notifyAll` thì an toàn hơn nhưng đánh thức vô ích hàng loạt. Và phải giữ đúng quan hệ giữa khối `synchronized` với biến điều kiện. Đây là loại mã mà một người viết đúng còn người sửa lỗi ba năm sau thì không. Lý do thứ hai là thư viện cho những năng lực mà `synchronized` về bản chất không có: khoá có timeout, khoá có thể interrupt, khoá đọc-ghi tách biệt để nhiều bên đọc chạy song song. Khoá có timeout đặc biệt đáng giá vì nó là công cụ biến một nguy cơ treo vĩnh viễn thành một thất bại tạm thời quan sát được. Lý do thứ ba là hiệu năng khi có tranh chấp: các collection đồng thời trong thư viện dùng khoá mịn hoặc thuật toán không khoá, nên chúng mở rộng tốt hơn hẳn so với việc bọc `synchronized` quanh một collection thường — nơi mọi thao tác, kể cả đọc, phải xếp hàng qua một lock duy nhất. Và lý do thứ tư, thứ tôi coi là quan trọng nhất về lâu dài: mã dùng thư viện đọc được ý định. Thấy `CountDownLatch` là biết đang chờ một sự kiện xảy ra một lần; thấy `Semaphore` là biết đang giới hạn số việc đồng thời; thấy `BlockingQueue` là biết có producer và consumer. Cùng ý định đó viết bằng `wait`/`notify` thì người đọc phải dựng lại từ đầu.",
    redFlags: [
      "Chỉ nói thư viện \"tiện hơn\" mà không nêu các chi tiết dễ sai của `wait`/`notify`",
      "Không biết về đánh thức giả nên không giải thích được vì sao phải chờ trong vòng lặp",
      "Cho rằng `synchronized` làm được khoá có timeout",
    ],
    probes: [
      "Vì sao phải chờ trong `while` chứ không `if`?",
      "Cho một ca mà `notify` gây treo còn `notifyAll` thì không",
      "Khoá đọc-ghi đáng dùng khi tỉ lệ đọc/ghi ra sao?",
    ],
    refs: ["wgjd-05", "wgjd-06"],
  },
  {
    id: "wgjd-iq14",
    field: "wgjd",
    topic: "wg-concurrent",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class BoundedBuffer<T> {
    private final Queue<T> items = new LinkedList<>();
    private final int capacity;

    public synchronized void put(T item) throws InterruptedException {
        if (items.size() == capacity) {        // (1)
            wait();
        }
        items.add(item);
        notify();                              // (2)
    }

    public synchronized T take() throws InterruptedException {
        if (items.isEmpty()) {                 // (3)
            wait();
        }
        T item = items.poll();
        notify();                              // (4)
        return item;
    }
}`,
    },
    question: "Class này có hai lỗi nghiêm trọng và cả hai chỉ lộ ra dưới tải. Chỉ ra chúng, nói triệu chứng của từng cái, rồi sửa — hoặc đề xuất thay thế.",
    mustCover: [
      "Lỗi thứ nhất: dùng `if` thay vì `while` khi chờ — thread bị **đánh thức giả** sẽ đi tiếp với điều kiện chưa thoả",
      "Triệu chứng của lỗi này: `add` vào buffer đã đầy, hoặc `poll` trả `null` rồi nổ ở chỗ khác",
      "Lỗi thứ hai: `notify` đánh thức **một** thread bất kỳ đang chờ, mà ở đây có **hai loại** bên chờ với hai điều kiện khác nhau",
      "Triệu chứng: một producer đánh thức một producer khác thay vì đánh thức consumer — cả hai lại chờ, hệ thống **treo**",
      "Sửa: đổi `if` thành `while`, và đổi `notify` thành `notifyAll`",
      "Đề xuất tốt hơn: dùng một `BlockingQueue` có giới hạn sẵn trong thư viện, bỏ hẳn class này",
      "Hoặc nếu tự viết thì dùng `ReentrantLock` với **hai** điều kiện riêng, để đánh thức đúng loại bên chờ",
    ],
    model: "Hai lỗi, và cả hai đều là những lỗi kinh điển mà thư viện tồn tại để ta không phải gặp. Lỗi thứ nhất ở dòng (1) và (3): dùng `if` thay vì `while` để kiểm điều kiện trước khi chờ. Một thread có thể bị đánh thức mà điều kiện chưa thoả — đánh thức giả, cộng với việc một thread khác có thể đã chen vào giữa lúc ta tỉnh dậy và lúc ta giành lại lock. Với `if`, thread tỉnh dậy rồi đi tiếp bất chấp: `put` sẽ `add` vào một buffer đã đầy, và `take` sẽ `poll` trên buffer rỗng rồi trả `null` — mà `null` đó đi ra ngoài và nổ ở một chỗ hoàn toàn khác, nên khi debug thì dấu vết đã mất. Lỗi thứ hai ở dòng (2) và (4): `notify` đánh thức đúng **một** thread đang chờ, chọn tuỳ ý. Nhưng ở đây có hai loại bên chờ với hai điều kiện đối nghịch — producer chờ có chỗ trống, consumer chờ có phần tử. Nên một producer sau khi thêm phần tử có thể đánh thức một producer khác thay vì một consumer; producer đó thấy buffer vẫn đầy nên chờ lại, và không ai đánh thức consumer. Cả hệ thống treo, không exception, không CPU — đúng loại sự cố phải đọc thread dump mới hiểu. Bản sửa tối thiểu là đổi `if` thành `while` và `notify` thành `notifyAll`. Nhưng đề xuất tôi thật sự muốn đưa ra là bỏ class này: thư viện đã có hàng đợi chặn với giới hạn, nó đã đúng, đã được kiểm thử bởi rất nhiều người, và nó cho thêm những thứ bản tự viết không có như chờ có timeout. Nếu vì lý do nào đó buộc phải tự viết, thì cách đúng không phải `notifyAll` mà là `ReentrantLock` với **hai** điều kiện riêng — một cho \"có chỗ trống\", một cho \"có phần tử\" — để mỗi lần ta đánh thức đúng loại bên đang chờ thay vì đánh thức tất cả rồi để phần lớn ngủ lại. Đó cũng là ví dụ trực tiếp cho việc thư viện cho những năng lực mà `wait`/`notify` không có.",
    redFlags: [
      "Chỉ sửa `if` thành `while` mà để nguyên `notify` — vẫn treo",
      "Chỉ đổi `notify` thành `notifyAll` mà để nguyên `if` — vẫn ghi vào buffer đầy",
      "Đồng bộ hoá `LinkedList` bằng cách bọc collection thay vì sửa logic chờ",
      "Không đề xuất dùng hàng đợi chặn có sẵn",
    ],
    probes: [
      "Vì sao `notifyAll` đúng nhưng vẫn không phải cách tốt nhất?",
      "Hai điều kiện riêng của `ReentrantLock` cho lợi ích gì cụ thể?",
      "Bạn viết bài kiểm nào để bắt được lỗi treo này?",
    ],
    refs: ["wgjd-05", "wgjd-06"],
  },
  {
    id: "wgjd-iq15",
    field: "wgjd",
    topic: "wg-concurrent",
    level: 3,
    minutes: 10,
    question: "Bạn cần chia sẻ một cấu trúc dữ liệu đọc nhiều ghi ít giữa nhiều luồng. Chọn cơ chế nào?",
    tradeoffs: [
      {
        option: "Collection đồng thời có sẵn",
        when: "Lựa chọn đầu tiên nếu cấu trúc khớp một collection sẵn có. Khoá mịn hoặc không khoá, iterator không ném lỗi sửa đổi đồng thời, và đã được kiểm thử rộng. Đổi lại là một số thao tác toàn cục như đếm chỉ còn là **ước lượng**.",
      },
      {
        option: "Immutable object sau một tham chiếu `volatile`",
        when: "Khi ghi **rất** thưa và mỗi lần ghi thay cả cấu trúc. Đọc không khoá gì và luôn thấy một ảnh nhất quán. Đổi lại là mỗi lần ghi dựng lại cấu trúc, nên nó sai cho tần suất ghi cao.",
      },
      {
        option: "Khoá đọc-ghi",
        when: "Khi cần cả cái nhìn nhất quán trên **nhiều** thao tác **và** cấu trúc quá lớn để dựng lại mỗi lần ghi. Nhiều bên đọc chạy song song, bên ghi độc quyền. Cái giá: phức tạp hơn, và nếu ghi không thật sự thưa thì bên ghi bị bỏ đói hoặc thông lượng đọc sụp.",
      },
    ],
    mustCover: [
      "Trục thứ nhất là **tỉ lệ đọc so với ghi**; trục thứ hai là **phạm vi nhất quán** cần giữ",
      "Collection đồng thời chỉ bảo đảm từng thao tác atomic, **không** bảo đảm một chuỗi thao tác",
      "Nếu cần bất biến trải trên nhiều thao tác thì collection đồng thời **không đủ**, phải khoá",
      "Immutable sau `volatile` cho nhất quán trọn vẹn khi đọc mà không khoá, vì mỗi lần ghi thay nguyên khối",
      "Đặt object **khả biến** sau `volatile` thì không đủ — `volatile` bảo đảm thấy tham chiếu mới, không bảo đảm state bên trong nhất quán",
      "Khoá đọc-ghi chỉ lợi khi ghi **thật sự** thưa; nếu không, chi phí quản lý và nguy cơ bỏ đói lấn hết lợi ích",
      "Phải đo trước: \"đọc nhiều ghi ít\" là một mô tả định tính, và các phương án phân định theo con số",
    ],
    model: "Tôi cần hai con số trước khi chọn: tỉ lệ đọc so với ghi thực tế, và phạm vi nhất quán mà nghiệp vụ đòi. Trục thứ hai hay bị bỏ qua nhưng nó quyết định nhiều hơn. Nếu chỉ cần từng thao tác đúng — đọc một khoá, ghi một khoá — thì collection đồng thời là lựa chọn đầu tiên và thường là lựa chọn cuối: khoá mịn nên nhiều bên đọc chạy song song, iterator chịu được sửa đổi đồng thời, và nó đã được kiểm thử bởi rất nhiều người. Cái giá phải nói ra là một số thao tác toàn cục như đếm số phần tử chỉ còn là ước lượng, nên đừng dùng chúng để ra quyết định nghiệp vụ. Nhưng nếu cần một **bất biến trải trên nhiều thao tác** — đọc hai khoá và chúng phải nhất quán với nhau, hay kiểm rồi ghi như một đơn vị — thì collection đồng thời không đủ, vì nó chỉ bảo đảm từng thao tác atomic chứ không bảo đảm chuỗi. Đó là lúc phải khoá thật. Giữa hai cách khoá, tôi ưu tiên immutable object sau một tham chiếu `volatile` khi ghi rất thưa: mỗi lần ghi dựng một cấu trúc mới rồi gán một lần, nên người đọc lấy tham chiếu một lần là có ảnh nhất quán trọn vẹn mà không khoá gì. Có một cái bẫy tôi luôn nêu ở đây vì nó rất phổ biến: đặt một object **khả biến** sau `volatile` thì không đủ — `volatile` bảo đảm ta thấy tham chiếu mới nhất, nhưng không bảo đảm state bên trong object đó nhất quán. Immutability phải làm đủ. Khi cấu trúc quá lớn để dựng lại mỗi lần ghi, hoặc ghi không đủ thưa, tôi chuyển sang khoá đọc-ghi. Nó cho nhiều bên đọc song song và bên ghi độc quyền, nhưng chỉ lợi khi ghi thật sự thưa: nếu ghi thường xuyên thì chi phí quản lý khoá cộng với việc bên đọc liên tục bị chặn làm thông lượng sụp, và tuỳ chính sách công bằng mà bên ghi có thể bị bỏ đói. Nên tôi coi \"đọc nhiều ghi ít\" là một giả thuyết cần đo chứ không phải một tiền đề.",
    redFlags: [
      "Chọn khoá đọc-ghi theo phản xạ khi nghe \"đọc nhiều ghi ít\" mà chưa đo",
      "Dùng collection đồng thời cho một bất biến trải nhiều thao tác",
      "Đặt object khả biến sau `volatile` rồi coi là an toàn",
      "Trông cậy vào số đếm của collection đồng thời cho quyết định nghiệp vụ",
    ],
    probes: [
      "Cho một bất biến mà collection đồng thời không bảo vệ được",
      "Vì sao số đếm của collection đồng thời chỉ là ước lượng?",
      "Ghi chiếm 20% thao tác — lựa chọn của bạn đổi thế nào?",
    ],
    refs: ["wgjd-06", "wgjd-16"],
  },
  {
    id: "wgjd-iq16",
    field: "wgjd",
    topic: "wg-concurrent",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ có thông lượng **giảm** khi tăng số worker thread từ 8 lên 32: ở 8 thread nó xử lý 4.100 request/giây, ở 32 thread chỉ còn 2.600. CPU ở cả hai cấu hình đều khoảng 95%. Thread dump ở cấu hình 32 thread cho thấy phần lớn thread ở `BLOCKED`, chờ cùng một monitor bọc một `HashMap` dùng làm cache tra cứu.",
      scale: "Máy 16 core. Cache có tỉ lệ hit 94%, tra cứu khoảng 40.000 lần mỗi giây. Mỗi lần tra cứu trong cache mất khoảng 200 nanosecond, còn khi miss thì gọi database mất 3ms.",
      constraints: "Không bỏ được cache — bỏ nó thì tải database tăng gấp 16 lần. Không đổi được số core. Phải giải thích được vì sao **thêm** thread lại **giảm** thông lượng, vì đội đang định tăng lên 64.",
      },
    question: "Đội đang định tăng lên 64 thread. Hãy tính ra cho họ thấy điều đó sẽ làm gì, rồi nói chỗ tuần tự thật nằm ở đâu và sửa nó thế nào mà vẫn giữ cache.",
    mustCover: [
      "Một monitor bọc cả cache nghĩa là **mọi** tra cứu, kể cả 94% hit, phải xếp hàng qua **một** lock",
      "Đây là phần **tuần tự** của hệ thống, nên định luật Amdahl đặt trần: thêm thread không vượt được nó",
      "Tệ hơn trần: thêm thread làm **tăng tranh chấp**, nên chi phí treo và đánh thức thread lấn vào thông lượng thật",
      "Đó là lý do thông lượng **giảm** chứ chỉ là không tăng — đúng hiện tượng \"tỉ lệ giữa chi phí lập lịch và công việc hữu ích\" khi thao tác rất mịn",
      "Số học: tra cứu 200ns × 40.000 lần/giây là 8ms công việc mỗi giây, nên lock **không** bão hoà — thủ phạm là chi phí tranh chấp, không phải thời lượng giữ lock",
      "CPU 95% ở cả hai cấu hình là dấu hiệu: ở 32 thread, phần lớn CPU đi vào chuyển ngữ cảnh chứ không vào việc",
      "Sửa: thay `HashMap` bọc monitor bằng **collection đồng thời**, để 94% hit không còn xếp hàng",
      "Và trả lời thẳng ý định tăng lên 64: nó sẽ làm thông lượng giảm thêm",
    ],
    model: "Hiện tượng này là một trong những chỗ phản trực giác nhất của lập trình đồng thời, nên tôi sẽ giải thích bằng số. Một monitor bọc cả cache nghĩa là mọi tra cứu phải đi qua một lock duy nhất — kể cả 94% lần hit vốn chỉ mất 200 nanosecond. Đó là phần tuần tự của hệ thống, và định luật Amdahl nói phần tuần tự đặt trần cho mức tăng tốc bất kể thêm bao nhiêu thread. Nhưng ở đây có chuyện tệ hơn một cái trần: thông lượng **giảm**. Cơ chế nằm ở chi phí tranh chấp. Khi nhiều thread cùng xin một lock, JVM phải nhờ hệ điều hành, thread bị treo rồi phải được đánh thức, và khi tỉnh lại nó có thể còn phải chờ các thread khác dùng hết lượng thời gian lập lịch. Chi phí đó lớn, và nó tỉ lệ với số bên tranh chấp — nên tăng từ 8 lên 32 thread là tăng số bên tranh lên bốn lần trong khi công việc hữu ích không đổi. Với một thao tác cực mịn như tra cứu 200 nanosecond thì tỉ lệ giữa chi phí lập lịch và công việc hữu ích trở nên rất xấu: ta đang trả hàng microsecond chi phí để làm 200 nanosecond việc. Phép tính xác nhận rằng lock không bão hoà về thời lượng: 200 nanosecond nhân 40.000 lần mỗi giây chỉ là 8ms công việc trong mỗi giây, tức lock rảnh hơn 99% thời gian. Nên thủ phạm không phải giữ lock lâu mà là **chi phí của chính việc tranh chấp**. Chi tiết CPU 95% ở cả hai cấu hình khớp hoàn hảo và là bằng chứng mạnh nhất: ở 32 thread, CPU vẫn bận nhưng phần lớn nó bận vào việc chuyển ngữ cảnh và quản lý hàng đợi lock chứ không vào việc phục vụ request. Cách sửa giữ được cache và rất trực tiếp: thay `HashMap` bọc monitor bằng một collection đồng thời. Khi đó 94% lần hit đi qua đường đọc không xếp hàng sau ai, phần tuần tự co lại gần bằng không, và trần Amdahl được dời đi thay vì bị chạm. Còn về ý định tăng lên 64 thread thì tôi sẽ nói thẳng: với cấu hình hiện tại nó sẽ làm thông lượng giảm thêm, vì nó làm đúng cái việc đang gây hại. Thứ tự đúng là sửa điểm tuần tự trước, rồi mới đo lại xem số thread nào là tối ưu — và rất có thể con số đó gần với số core chứ không phải 64.",
    redFlags: [
      "Tăng lên 64 thread như đề xuất tiếp theo",
      "Kết luận cache là nguyên nhân và đề nghị bỏ nó",
      "Nhìn CPU 95% rồi kết luận hệ thống đã dùng hết năng lực",
      "Chỉ đổi `HashMap` sang `Hashtable` hoặc bọc `synchronizedMap` — vẫn một lock duy nhất",
      "Đi chỉnh GC hoặc kích thước heap",
    ],
    probes: [
      "Làm phép tính cho thấy lock không bão hoà về thời lượng giữ",
      "Vì sao CPU 95% lại không có nghĩa hệ thống đang làm việc hiệu quả?",
      "Sau khi sửa, bạn chọn số thread bằng cách nào?",
    ],
    refs: ["wgjd-06", "wgjd-07"],
  },

  // ===== wg-perf — Hiểu về hiệu năng Java (wgjd-iq17–wgjd-iq20) =====
  {
    id: "wgjd-iq17",
    field: "wgjd",
    topic: "wg-perf",
    level: 1,
    minutes: 6,
    question: "Sách nói tinh chỉnh hiệu năng trên JVM khó hơn trên mã không được quản lý. Vì sao? Nêu ba khía cạnh của nền tảng góp phần vào cái khó đó.",
    mustCover: [
      "Điểm mấu chốt của một runtime được quản lý là **nhường một phần kiểm soát** cho runtime để lập trình viên năng suất hơn",
      "Đổi lại, hệ thống khó suy luận hơn vì runtime là một **hộp mờ** với lập trình viên",
      "Ba khía cạnh sách nêu: **lập lịch luồng**, **thu gom rác**, và **biên dịch just-in-time**",
      "Lựa chọn thay thế là từ bỏ mọi lợi thế của runtime được quản lý, buộc lập trình viên tự làm gần như mọi thứ",
      "Và cam kết thời gian tổng thể của cách đó hầu như luôn **cao hơn** công sức bổ sung cho việc tinh chỉnh",
      "Hệ quả thực hành: không thể suy luận từ mã nguồn ra hiệu năng — phải **đo**",
    ],
    model: "Lý do gốc là một đánh đổi có chủ ý của nền tảng. Toàn bộ điểm mấu chốt của một runtime được quản lý là cho runtime nắm một phần kiểm soát môi trường, để lập trình viên không phải đối phó với mọi chi tiết — và điều đó khiến lập trình viên năng suất hơn nhiều về tổng thể. Nhưng một phần kiểm soát phải bị từ bỏ, và sự chuyển trọng tâm ấy làm hệ thống như một tổng thể khó suy luận hơn, bởi runtime là một hộp mờ đối với lập trình viên. Sách nêu ba khía cạnh quan trọng nhất góp phần vào cái khó đó. Thứ nhất là lập lịch luồng: ta không quyết định thread nào chạy lúc nào, nên cùng một chương trình có thể cho hai hình dạng hiệu năng khác nhau ở hai lần chạy. Thứ hai là thu gom rác: thời điểm và chi phí của nó không nằm trong mã ta viết, nên một đoạn mã có thể nhanh hay chậm tuỳ nó có rơi vào một lần thu gom hay không. Thứ ba là biên dịch just-in-time: hiệu năng của cùng một đoạn mã thay đổi theo thời gian chạy, và nó phụ thuộc vào những gì JVM đã quan sát được — nên hiệu năng không còn là thuộc tính của mã nguồn mà là thuộc tính của mã nguồn cộng lịch sử thực thi. Điều tôi muốn nhấn là sách không kết luận rằng nên quay về mã không được quản lý. Lựa chọn thay thế là từ bỏ mọi lợi thế mà runtime mang lại, buộc lập trình viên phải tự làm gần như mọi thứ, và cam kết thời gian tổng thể của cách đó hầu như luôn cao hơn nhiều so với công sức bổ sung cần cho việc tinh chỉnh. Nên kết luận thực hành không phải \"JVM tệ\" mà là \"không suy luận từ mã nguồn ra hiệu năng\" — phải đo, vì ba thứ quyết định nhiều nhất đều nằm ngoài tầm nhìn của mã.",
    redFlags: [
      "Kết luận nên tránh runtime được quản lý nếu cần hiệu năng",
      "Chỉ nêu GC mà bỏ qua lập lịch luồng và JIT",
      "Nói có thể suy ra hiệu năng từ việc đọc mã nếu đủ kinh nghiệm",
    ],
    probes: [
      "Ba khía cạnh đó ảnh hưởng tới phép đo của bạn thế nào?",
      "Vì sao hiệu năng là thuộc tính của mã cộng lịch sử thực thi?",
      "Đánh đổi năng suất so với khả năng suy luận — bạn thấy nó đáng không?",
    ],
    refs: ["wgjd-07"],
  },
  {
    id: "wgjd-iq18",
    field: "wgjd",
    topic: "wg-perf",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Đội gửi kết quả "chứng minh StringBuilder nhanh hơn 300 lần"
public class StringBench {
    public static void main(String[] args) {
        long t0 = System.currentTimeMillis();
        String s = "";
        for (int i = 0; i < 50_000; i++) s += i;          // nối chuỗi
        System.out.println("concat: " + (System.currentTimeMillis() - t0));

        t0 = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 50_000; i++) sb.append(i);
        sb.toString();
        System.out.println("builder: " + (System.currentTimeMillis() - t0));
    }
}`,
    },
    question: "Kết luận \"nhanh hơn 300 lần\" tình cờ đúng về hướng nhưng phép đo thì không đáng tin. Liệt kê các lỗi, và nói đâu là lỗi làm con số vô nghĩa nhất.",
    mustCover: [
      "Không có **warmup**: khối đầu chạy khi JIT chưa biên dịch, khối sau được hưởng JVM đã nóng",
      "Vì vậy **thứ tự** hai khối tự nó là một sai số hệ thống — đảo chỗ là con số đổi",
      "Chỉ **một** phép đo, không lặp lại, nên không biết phân tán và không biết con số có ổn định hay không",
      "Kết quả `sb.toString()` **không được dùng**, nên về nguyên tắc JIT có thể loại bỏ phần mã đó",
      "Cả hai khối cũng có thể bị ảnh hưởng bởi **GC** vì nối chuỗi sinh rất nhiều rác",
      "Lỗi làm con số vô nghĩa nhất là thiếu warmup cộng thứ tự — nó đủ tạo ra chênh lệch hàng chục lần **một cách giả**",
      "So sánh vẫn đúng về **hướng** vì hai thuật toán có độ phức tạp khác nhau, nhưng \"300 lần\" là con số của phép đo, không phải của thuật toán",
    ],
    model: "Kết luận về hướng thì đúng, và đúng vì lý do thuật toán chứ không vì phép đo: nối chuỗi trong vòng lặp tạo một chuỗi mới mỗi lần và sao chép toàn bộ nội dung cũ, nên tổng công việc tăng theo bình phương số vòng, còn `StringBuilder` ghi vào một bộ đệm nên tăng tuyến tính. Với 50.000 vòng thì khác biệt là thật và rất lớn. Nhưng con số 300 lần là con số của phép đo này, không phải của hai thuật toán, và phép đo có mấy lỗi. Lỗi làm con số vô nghĩa nhất là thiếu warmup kết hợp với thứ tự: khối thứ nhất chạy khi JIT chưa biên dịch phần mã nóng nên nó gánh cả chi phí thông dịch, còn khối thứ hai chạy trên một JVM đã nóng. Riêng điều đó đủ tạo ra chênh lệch hàng chục lần một cách giả, và hệ quả kiểm chứng được là đảo chỗ hai khối sẽ đổi con số — nên bất kỳ kết quả nào đổi khi đảo thứ tự đều không phải kết quả. Lỗi thứ hai là chỉ có một phép đo: không lặp lại thì không có phân tán, và không có phân tán thì ta không biết 300 là tín hiệu hay nhiễu. Lỗi thứ ba, tinh tế hơn nhưng thật: `sb.toString()` được gọi mà kết quả không được dùng vào đâu, nên về nguyên tắc JIT có thể nhận ra phần mã đó không có tác dụng quan sát được và loại bỏ nó — khi đó ta đang đo một vòng lặp đã bị tối ưu đi một phần. Lỗi thứ tư là GC: nối chuỗi sinh ra rất nhiều rác, nên một lần thu gom rơi vào giữa khối nào sẽ làm khối đó xấu đi, mà ta không kiểm soát được điều đó. Cách đo lại thì phải có warmup tường minh, lặp nhiều lần trong các tiến trình riêng, đảo thứ tự giữa các lần, tiêu thụ kết quả để nó không bị loại bỏ, và báo cáo phân bố thay vì một con số — hoặc đơn giản hơn là dùng một bộ công cụ microbenchmark chuyên dụng vốn đã lo sẵn tất cả những điều đó.",
    redFlags: [
      "Chấp nhận con số vì kết luận về hướng đúng",
      "Chỉ nói \"thiếu warmup\" rồi dừng",
      "Không nhận ra kết quả không được dùng có thể bị loại bỏ",
      "Tăng số vòng lặp lên 5 triệu và coi đó là cách làm phép đo đáng tin hơn",
    ],
    probes: [
      "Vì sao \"đảo thứ tự thì con số đổi\" là một bài kiểm tốt cho mọi benchmark?",
      "Bạn tiêu thụ kết quả thế nào để nó không bị loại bỏ?",
      "Nếu chỉ có 10 vòng lặp thì kết luận còn đúng không?",
    ],
    refs: ["wgjd-07"],
  },
  {
    id: "wgjd-iq19",
    field: "wgjd",
    topic: "wg-perf",
    level: 3,
    minutes: 11,
    question: "Một dịch vụ có p99 tệ. Bạn bắt đầu điều tra từ đâu, và dùng công cụ nào?",
    tradeoffs: [
      {
        option: "JDK Flight Recorder, luôn bật",
        when: "Điểm khởi đầu cho production. Chi phí đủ thấp để bật liên tục, nên khi sự cố xảy ra ta **đã có** dữ liệu của khoảng thời gian đó — quan trọng vì phần lớn sự cố không tái hiện theo yêu cầu.",
      },
      {
        option: "GC log và các đại lượng về thu gom rác",
        when: "Khi triệu chứng có dạng **đợt** — độ trễ nhảy lên rồi về bình thường. Rẻ để bật, và nó loại hoặc xác nhận một trong những nghi phạm phổ biến nhất chỉ trong vài phút.",
      },
      {
        option: "Profiler lấy mẫu gắn vào tiến trình đang chạy",
        when: "Khi cần biết **thời gian đi đâu** ở độ phân giải cao hơn. Nhưng phải chọn đúng loại: nếu thời gian nằm ở **chờ** thì một profiler chỉ lấy mẫu thread đang chạy sẽ không thấy gì.",
      },
    ],
    mustCover: [
      "Trước mọi công cụ: phải biết p99 đang được **đo ở đâu** — ở tầng ứng dụng hay ở phía client",
      "Vì độ trễ người dùng thấy gồm cả thời gian **xếp hàng** trước khi mã ứng dụng chạy",
      "Ba nghi phạm cần loại sớm vì chúng phổ biến và rẻ để kiểm: **GC**, **tranh chấp lock**, và **chờ I/O**",
      "Ba thứ đó cho ba dấu hiệu khác nhau về CPU: GC thì CPU tăng theo đợt, tranh chấp thì CPU cao mà thông lượng không tăng, chờ I/O thì CPU thấp",
      "Nên **CPU** là đại lượng phân định đầu tiên, rẻ nhất và loại được nhiều giả thuyết nhất",
      "JFR đáng bật liên tục vì sự cố p99 thường **không tái hiện theo yêu cầu**",
      "Chọn sai loại profiler là cách phổ biến nhất để mất một ngày mà không kết luận được gì",
    ],
    model: "Tôi bắt đầu bằng một câu hỏi không cần công cụ nào: p99 này đang được đo ở đâu? Nếu đo ở tầng ứng dụng thì nó không bao gồm thời gian request xếp hàng trước khi mã của ta chạy, nên một p99 ứng dụng rất đẹp vẫn có thể đi kèm một p99 client rất tệ — và nếu ta không phân biệt được hai con số thì ta có thể đi tối ưu một thứ vốn không phải vấn đề. Sau đó tôi loại nghi phạm theo thứ tự rẻ dần. Đại lượng phân định đầu tiên là CPU, vì ba nghi phạm phổ biến nhất cho ba dấu hiệu khác nhau: thu gom rác thì CPU tăng theo đợt trùng với các đợt độ trễ; tranh chấp lock thì CPU có thể rất cao mà thông lượng không tăng, thậm chí giảm khi thêm thread; chờ I/O thì CPU thấp trong khi độ trễ cao. Chỉ cần con số CPU cùng hình dạng theo thời gian là tôi đã loại được hai trong ba. Tiếp đến tôi xem GC log, vì nó rẻ để bật và loại hoặc xác nhận nghi phạm phổ biến nhất trong vài phút — và điều cần nhìn không phải chỉ thời gian dừng mà cả mức chiếm dụng **sau** mỗi lần thu gom, vì một đường tăng đơn điệu ở đó nói về rò rỉ chứ không về tinh chỉnh. Công cụ tôi muốn có sẵn từ trước là JDK Flight Recorder bật liên tục, vì chi phí của nó đủ thấp cho production và vì sự cố p99 hiếm khi tái hiện theo yêu cầu — một phiên profiling bật sau khi sự cố đã qua thì đo một hệ thống đang khoẻ. Cuối cùng, nếu cần độ phân giải cao hơn thì tôi gắn một profiler lấy mẫu, và đây là chỗ dễ mất một ngày vô ích nhất: phải chọn đúng loại. Nếu thời gian đang nằm ở chờ — chờ lock, chờ mạng — thì một profiler chỉ lấy mẫu thread đang chạy sẽ báo về một hệ thống rảnh rỗi, đúng lúc ta cần nó nhất. Nguyên tắc xuyên suốt là mỗi bước phải **loại** được một giả thuyết, chứ không chỉ thu thêm dữ liệu.",
    redFlags: [
      "Bật profiler trước khi biết p99 đang đo ở đâu",
      "Chạy profiler CPU cho một sự cố mà thời gian nằm ở chờ, rồi kết luận không tìm ra gì",
      "Chỉ nhìn thời gian dừng GC, bỏ qua mức chiếm dụng sau GC",
      "Thu thập thêm dữ liệu mà không bước nào loại được giả thuyết",
    ],
    probes: [
      "Ba nghi phạm cho ba dấu hiệu CPU nào?",
      "p99 ứng dụng đẹp mà p99 client tệ — bạn nghi gì?",
      "Vì sao bật JFR sau khi sự cố đã qua thì vô ích?",
    ],
    refs: ["wgjd-07", "wgjd-12"],
  },
  {
    id: "wgjd-iq20",
    field: "wgjd",
    topic: "wg-perf",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ có p99 tăng dần trong suốt vòng đời mỗi pod: 60ms lúc mới lên, 90ms sau 6 giờ, 240ms sau 24 giờ. GC log bình thường, mức chiếm dụng sau GC phẳng, không rò rỉ. Khởi động lại pod đưa p99 về 60ms. Đội đã đặt lịch khởi động lại mỗi 12 giờ và coi vấn đề đã xử lý.",
      scale: "24 pod, 5.000 request/giây. Mỗi lần khởi động lại gây một đợt độ trễ 90 giây, nên với 24 pod mỗi 12 giờ thì có gần 50 đợt mỗi ngày.",
      constraints: "Không tăng được số pod. Phải giải thích được nguyên nhân, vì việc khởi động lại theo lịch đang tạo ra một sự cố khác. Không có JFR bật sẵn trong lịch sử, nhưng bật được từ giờ.",
      },
    question: "Rò rỉ bộ nhớ đã bị loại. Vậy còn những gì có thể tăng dần theo tuổi của một tiến trình JVM? Nêu các giả thuyết và cách phân định.",
    mustCover: [
      "Rò rỉ bộ nhớ bị loại bởi dữ liệu, nhưng **không** phải mọi thứ tăng dần đều là rò rỉ heap",
      "Giả thuyết 1: một cấu trúc dữ liệu **tăng không giới hạn** nhưng vẫn được dùng — cache không có trần, danh sách đăng ký",
      "Nó không phải rò rỉ theo nghĩa \"không ai dùng\", nên mức chiếm dụng sau GC có thể phẳng nếu nó bị giới hạn bởi đuổi entry, mà **thời gian tra cứu** vẫn tăng",
      "Giả thuyết 2: **hủy tối ưu** lặp lại — một điểm gọi từng đơn hình dần thấy nhiều kiểu, nên mã tốt bị bỏ",
      "Giả thuyết 3: **phân mảnh** hoặc sự suy giảm của bộ nhớ đệm CPU do dữ liệu trải rộng dần",
      "Giả thuyết 4: một tài nguyên ngoài heap tăng dần — số thread, kết nối, file descriptor",
      "Phân định bằng cách đo **một đại lượng theo tuổi pod**: kích thước cấu trúc, số thread, số lần hủy tối ưu",
      "Lịch khởi động lại đang đổi một sự cố âm thầm thành 50 đợt độ trễ mỗi ngày — đó là làm tệ hơn, không phải xử lý",
    ],
    model: "Việc đội loại được rò rỉ bộ nhớ là bước đúng, nhưng kết luận \"không rò rỉ nên không có nguyên nhân\" thì sai, vì rất nhiều thứ tăng dần theo tuổi một tiến trình mà không hiện ra ở mức chiếm dụng heap sau GC. Tôi có bốn giả thuyết và mỗi cái có một phép đo phân định riêng. Giả thuyết thứ nhất, và tôi cho là mạnh nhất: một cấu trúc dữ liệu trong bộ nhớ tăng không giới hạn nhưng **vẫn được dùng** — một cache không có trần, một danh sách đăng ký, một map thống kê theo khoá. Nó không phải rò rỉ theo nghĩa \"không ai tham chiếu\" nên heap dump không tố cáo nó, và nếu có cơ chế đuổi entry thì mức chiếm dụng thậm chí phẳng; nhưng thời gian tra cứu tăng theo kích thước, và với 5.000 request mỗi giây thì đó đủ để giải thích p99 bốn lần sau 24 giờ. Phép đo phân định: ghi lại kích thước các cấu trúc lớn theo tuổi pod. Giả thuyết thứ hai là hủy tối ưu lặp lại: một điểm gọi ban đầu chỉ thấy một kiểu nên JIT inline nó, rồi dần dần thấy nhiều kiểu hơn khi lưu lượng đa dạng dần, nên mã đã tối ưu bị bỏ và không bao giờ tối ưu lại được như cũ. Phép đo: theo dõi số lần hủy tối ưu và các quyết định biên dịch theo thời gian. Giả thuyết thứ ba là tính cục bộ bộ nhớ suy giảm — dữ liệu sống lâu bị trải rộng dần nên tỉ lệ trúng bộ nhớ đệm CPU giảm; cái này khó đo hơn và tôi để sau. Giả thuyết thứ tư là một tài nguyên ngoài heap tăng dần: số thread, số kết nối, số file descriptor — tất cả đều có thể tăng đơn điệu và làm mọi thứ chậm đi mà heap không đổi. Phép đo: đếm chúng theo tuổi pod, rẻ nhất trong cả bốn nên tôi làm đầu tiên. Nguyên tắc chung của cách phân định: tìm **một đại lượng tăng đơn điệu cùng với p99**, vì thủ phạm gần như chắc chắn có hình dạng đó. Với JFR bật được từ giờ, tôi sẽ để một pod chạy đủ 24 giờ có JFR và so bản ghi ở giờ thứ nhất với giờ thứ hai mươi bốn. Còn về lịch khởi động lại mỗi 12 giờ, tôi sẽ nói thẳng rằng nó không phải cách xử lý mà là một đánh đổi tệ: nó đổi một sự cố âm thầm thành gần 50 đợt độ trễ 90 giây mỗi ngày trên 24 pod, tức tạo ra một sự cố mới có thể đo được để che một sự cố chưa hiểu. Nó chấp nhận được như biện pháp tạm thời có thời hạn, nhưng phải ghi rõ là tạm.",
    redFlags: [
      "Kết luận \"không rò rỉ nên không có gì sai\" và giữ lịch khởi động lại",
      "Coi lịch khởi động lại là cách xử lý thay vì biện pháp tạm",
      "Chỉ đi tìm ở heap vì triệu chứng giống rò rỉ",
      "Bật thêm nhiều dashboard mà không tìm một đại lượng tăng đơn điệu cùng p99",
      "Đòi tăng số pod — ràng buộc đã cấm, và nó không chạm tới nguyên nhân",
    ],
    probes: [
      "Một cache không có trần làm p99 tăng thế nào dù bộ nhớ không đổi?",
      "Bạn theo dõi số lần hủy tối ưu bằng cách nào?",
      "Vì sao \"tìm một đại lượng tăng đơn điệu cùng p99\" là cách phân định hiệu quả?",
    ],
    refs: ["wgjd-07", "wgjd-17"],
  },

  // ===== wg-build — Build, container và kiểm thử (wgjd-iq21–wgjd-iq24) =====
  {
    id: "wgjd-iq21",
    field: "wgjd",
    topic: "wg-build",
    level: 1,
    minutes: 5,
    question: "Vì sao container lại quan trọng với một lập trình viên Java, chứ không chỉ với đội vận hành? Nêu những gì nó đổi trong cách bạn viết và chạy mã.",
    mustCover: [
      "Container làm **môi trường chạy** trở thành một phần của thứ ta phát hành, nên nó là quyết định của lập trình viên chứ không chỉ của vận hành",
      "Nó khử được lớp lỗi \"chạy trên máy tôi\" vì cùng một ảnh chạy ở mọi nơi",
      "Nhưng nó đưa vào **giới hạn tài nguyên**, và JVM chọn nhiều mặc định theo tài nguyên nó **quan sát được**",
      "Nên phải bảo đảm JVM đọc đúng giới hạn container, nếu không nó cấu hình cho một máy rộng hơn thực tế",
      "Heap **không** phải toàn bộ bộ nhớ JVM, nên đặt `-Xmx` sát giới hạn container là cách bị kernel giết",
      "Nó cũng đổi cách nghĩ về **khởi động**: pod bị thay thường xuyên, nên thời gian nóng máy trở thành một đại lượng đáng quan tâm",
    ],
    model: "Container quan trọng với lập trình viên vì nó xoá ranh giới cũ giữa \"mã của tôi\" và \"môi trường của vận hành\": môi trường chạy giờ nằm trong thứ ta phát hành, nên chọn ảnh nền, chọn tham số JVM, quyết định giới hạn tài nguyên đều trở thành quyết định kỹ thuật của người viết mã. Lợi ích trực tiếp là khử được lớp lỗi \"chạy trên máy tôi\", vì cùng một ảnh chạy ở mọi nơi. Nhưng nó đưa vào ba thứ mà lập trình viên Java phải biết, và cả ba đều là nguồn sự cố thật. Thứ nhất, container có giới hạn tài nguyên, còn JVM thì chọn rất nhiều mặc định theo tài nguyên nó **quan sát được** — số thread thu gom rác, mức song song của một số pool, kích thước heap mặc định. Nếu JVM không đọc đúng giới hạn của container thì nó cấu hình cho một máy rộng hơn thực tế nó được dùng, và kết quả là bị tiết chế CPU cộng chi phí chuyển ngữ cảnh. Thứ hai, heap không phải toàn bộ bộ nhớ của JVM: metaspace, stack của từng thread, code cache, bộ đệm ngoài heap đều nằm ngoài `-Xmx` nhưng đều tính vào giới hạn container — nên đặt `-Xmx` sát giới hạn là cách chắc chắn để bị kernel giết, và dấu hiệu là container khởi động lại đột ngột **không** kèm lỗi hết bộ nhớ trong log. Thứ ba, container đổi cách nghĩ về khởi động: pod bị thay thường xuyên hơn nhiều so với một tiến trình trên máy ảo, nên thời gian từ lúc lên tới lúc JIT nóng trở thành một đại lượng đáng quan tâm — và nó cũng là lý do phải phân biệt probe \"còn sống\" với probe \"sẵn sàng nhận tải\". Nói gọn, container không làm Java khó hơn, nhưng nó khiến những chi tiết vốn thuộc về vận hành trở thành thứ lập trình viên phải hiểu.",
    redFlags: [
      "Coi container thuần là việc của vận hành",
      "Không biết heap chỉ là một phần bộ nhớ JVM",
      "Bỏ qua việc JVM chọn mặc định theo tài nguyên quan sát được",
    ],
    probes: [
      "Ngoài heap, còn vùng bộ nhớ nào tính vào giới hạn container?",
      "Container bị kernel giết khác JVM ném lỗi hết bộ nhớ ở dấu hiệu nào?",
      "Vì sao probe sẵn sàng khác probe còn sống?",
    ],
    refs: ["wgjd-12"],
  },
  {
    id: "wgjd-iq22",
    field: "wgjd",
    topic: "wg-build",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `# Dockerfile hiện tại của một dịch vụ Spring Boot
FROM openjdk:17
WORKDIR /app
COPY . .
RUN ./gradlew build
CMD ["java", "-jar", "build/libs/app.jar"]

# Số liệu: ảnh 1,4GB; build lại sau khi sửa một dòng mã mất 6 phút;
# container thỉnh thoảng bị OOMKilled dù -Xmx chưa được đặt.`,
    },
    question: "Chỉ ra các vấn đề của Dockerfile này theo ba trục: kích thước ảnh, thời gian build lại, và hành vi lúc chạy. Với mỗi cái nói cách sửa.",
    mustCover: [
      "Kích thước: ảnh nền chứa **cả JDK và công cụ build**, còn lúc chạy chỉ cần runtime — nên dùng **build nhiều tầng**",
      "Build lại: `COPY . .` trước `RUN ./gradlew build` làm **mọi** thay đổi tệp phá cache tầng, kể cả sửa một dòng",
      "Sửa bằng cách copy **tệp khai phụ thuộc trước**, tải phụ thuộc, rồi mới copy mã nguồn — để tầng phụ thuộc được dùng lại",
      "Lúc chạy: không đặt `-Xmx` nghĩa là JVM tự chọn theo bộ nhớ nó **quan sát được**",
      "Nếu nó không đọc đúng giới hạn container thì heap mặc định có thể vượt giới hạn, và tiến trình bị kernel giết — không có lỗi hết bộ nhớ trong log",
      "Sửa: bảo đảm JVM đọc giới hạn cgroup, và đặt heap theo **tỉ lệ** bộ nhớ khả dụng thay vì một số cứng",
      "Cũng nên chạy bằng **người dùng không đặc quyền** thay vì root, và ghim phiên bản ảnh nền thay vì dùng thẻ trôi",
    ],
    model: "Ba trục, ba nhóm vấn đề. Về kích thước, ảnh 1,4GB đến từ việc dùng một ảnh nền chứa cả JDK rồi build ngay trong đó, nên mọi thứ chỉ cần lúc build — trình biên dịch, công cụ build, cache phụ thuộc, mã nguồn — đều nằm trong ảnh cuối. Cách sửa là build nhiều tầng: một tầng để build, rồi copy đúng cái jar sang một ảnh nền chỉ có runtime. Riêng việc đó thường cắt được phần lớn kích thước, và nó còn giảm diện tích bị tấn công vì ảnh cuối không còn trình biên dịch. Về thời gian build lại, thủ phạm là thứ tự hai dòng: `COPY . .` đưa toàn bộ cây mã vào một tầng, nên bất kỳ thay đổi tệp nào cũng làm tầng đó và mọi tầng sau nó mất cache — kể cả sửa một dòng comment. Vì tầng sau là `RUN ./gradlew build`, ta tải lại toàn bộ phụ thuộc mỗi lần. Cách sửa là tách theo tần suất đổi: copy tệp khai phụ thuộc trước, chạy một bước chỉ tải phụ thuộc, rồi mới copy mã nguồn và build. Phụ thuộc đổi hàng tuần còn mã đổi hàng giờ, nên tầng phụ thuộc sẽ được dùng lại gần như luôn, và 6 phút rút xuống còn thời gian biên dịch thật. Về hành vi lúc chạy, việc không đặt `-Xmx` nghĩa là JVM tự chọn heap theo lượng bộ nhớ nó quan sát được. Nếu nó đọc đúng giới hạn cgroup thì đó thường là lựa chọn tốt; nếu không thì nó nhìn thấy bộ nhớ của cả máy và chọn một heap lớn hơn giới hạn container, rồi tiến trình bị kernel giết — và dấu hiệu nhận biết là container bị khởi động lại đột ngột mà log không có lỗi hết bộ nhớ nào, đúng như triệu chứng OOMKilled đã nêu. Cách sửa là bảo đảm JVM đọc giới hạn cgroup và đặt heap theo tỉ lệ bộ nhớ khả dụng thay vì một số cứng, để hai thứ luôn khớp khi ai đó đổi giới hạn. Thêm hai việc tôi sẽ làm cùng lúc dù đề bài không hỏi: chạy bằng người dùng không đặc quyền chứ không phải root, và ghim phiên bản ảnh nền thay vì dùng một thẻ trôi theo thời gian — vì một ảnh nền đổi dưới chân là nguồn của những lỗi không tái hiện được.",
    redFlags: [
      "Chỉ đổi ảnh nền sang bản nhỏ hơn mà giữ nguyên việc build trong cùng ảnh",
      "Đặt `-Xmx` bằng đúng giới hạn container",
      "Sửa thứ tự copy nhưng không tách bước tải phụ thuộc",
      "Bỏ qua việc chạy bằng root và dùng thẻ ảnh nền trôi",
    ],
    probes: [
      "Vì sao tách theo tần suất đổi lại là nguyên tắc đúng cho thứ tự tầng?",
      "Bạn kiểm JVM có đọc đúng giới hạn cgroup bằng cách nào?",
      "Ghim phiên bản ảnh nền ngăn được lớp lỗi nào?",
    ],
    refs: ["wgjd-12", "wgjd-11"],
  },
  {
    id: "wgjd-iq23",
    field: "wgjd",
    topic: "wg-build",
    level: 3,
    minutes: 10,
    question: "Bạn thiết kế bộ kiểm thử cho một dịch vụ Java. Phân bổ thế nào giữa unit test, test tích hợp, và test đầu-cuối?",
    tradeoffs: [
      {
        option: "Đa số **unit test** cho logic nghiệp vụ thuần",
        when: "Nền của bộ kiểm thử. Nhanh, chạy song song được, chỉ rõ chỗ hỏng, và không cần hạ tầng. Điều kiện để chúng có giá trị là logic nghiệp vụ **tách được** khỏi I/O — nếu mã trộn hai thứ thì unit test sẽ toàn là mock, và mock kiểm chính thứ ta đã dạy nó.",
      },
      {
        option: "Test tích hợp cho **mọi ranh giới ra ngoài**",
        when: "Bắt buộc cho tầng persistence và mọi giao tiếp với hệ thống khác. Chạy trên hạ tầng **thật cùng loại** với production, vì chính khác biệt phương ngữ và hành vi là thứ tầng này phải bắt. Chậm hơn nên số lượng ít hơn, nhưng không thay được bằng unit test.",
      },
      {
        option: "Rất ít test đầu-cuối, chỉ cho **đường sống**",
        when: "Chỉ cho vài luồng quan trọng nhất. Chúng bắt được lỗi tích hợp mà không tầng nào khác thấy, nhưng chậm, dễ vỡ vì lý do không liên quan, và khi đỏ thì không chỉ được chỗ hỏng.",
      },
    ],
    mustCover: [
      "Hình dạng tổng thể là **kim tự tháp**: nhiều ở đáy, ít ở đỉnh, vì chi phí và thời gian phản hồi tăng theo tầng",
      "Tiêu chí phân bổ không phải số lượng mà là **loại rủi ro** mỗi tầng bắt được",
      "Unit test nhiều mock là **dấu hiệu thiết kế**, không phải dấu hiệu kiểm thử tốt",
      "Test tích hợp phải dùng hạ tầng **cùng loại** production; database nhúng bỏ lọt đúng lớp lỗi nguy hiểm nhất",
      "Test đầu-cuối dễ vỡ vì lý do không liên quan, nên nhiều test đầu-cuối làm đội **mất niềm tin** vào bộ kiểm thử",
      "Một bộ kiểm thử chạy chậm sẽ bị **bỏ qua**, nên thời gian phản hồi là một yêu cầu thiết kế chứ không phải chi tiết phụ",
      "Đánh giá bộ kiểm thử bằng **lỗi nó bắt được** và bằng **niềm tin** nó tạo ra, không bằng độ phủ",
    ],
    model: "Tôi phân bổ theo hình kim tự tháp, nhưng lý do không phải vì đó là quy ước mà vì chi phí và thời gian phản hồi tăng theo từng tầng, trong khi khả năng chỉ ra chỗ hỏng thì giảm. Đáy là unit test cho logic nghiệp vụ thuần: nhanh, chạy song song, và khi đỏ thì nó nói đúng method nào sai. Nhưng có một điều kiện tiên quyết mà tôi coi là chẩn đoán quan trọng nhất về sức khoẻ của mã: unit test chỉ có giá trị nếu logic nghiệp vụ tách được khỏi I/O. Nếu một unit test cần năm mock để chạy thì ta không đang kiểm logic, ta đang kiểm rằng mình đã dạy mock đúng — và số lượng mock là dấu hiệu về thiết kế, không phải về kiểm thử. Nên khi thấy nhiều mock, việc cần làm là đẩy I/O ra biên chứ không phải viết thêm test. Tầng giữa là test tích hợp cho mọi ranh giới ra ngoài, và ở đây tôi cứng rắn về một điểm: hạ tầng phải cùng loại và cùng phiên bản với production. Một database nhúng trong bộ nhớ chạy nhanh hơn nhưng nó có phương ngữ khác, nên đúng lớp lỗi nguy hiểm nhất — cú pháp SQN khác nhau, kiểu cột ánh xạ khác, hành vi khoá khác — là lớp nó không thể bắt. Đỉnh là test đầu-cuối, và tôi giữ rất ít, chỉ cho vài đường sống. Lý do không phải chúng vô giá trị mà là chúng dễ vỡ vì những lý do chẳng liên quan gì tới mã, và một bộ kiểm thử thỉnh thoảng đỏ vô cớ sẽ nhanh chóng bị đội bỏ qua — mất niềm tin vào bộ kiểm thử tốn hơn nhiều so với việc thiếu vài test. Cùng logic đó, tôi coi thời gian chạy là một yêu cầu thiết kế: một bộ kiểm thử mất bốn mươi phút sẽ không được chạy trước khi đẩy mã, nên nó không bảo vệ được gì. Và tôi đánh giá bộ kiểm thử bằng những lỗi nó thật sự bắt được cùng mức tự tin nó tạo ra khi ta sửa mã, không bằng con số độ phủ — vì độ phủ đo dòng mã đã chạy qua, không đo hành vi đã được kiểm chứng.",
    redFlags: [
      "Phân bổ theo con số độ phủ thay vì theo loại rủi ro",
      "Viết nhiều unit test với rất nhiều mock rồi coi tầng persistence đã được kiểm",
      "Dùng database nhúng cho test tích hợp rồi tin là đủ",
      "Xây nhiều test đầu-cuối vì \"nó giống người dùng thật nhất\"",
      "Coi thời gian chạy bộ kiểm thử là chi tiết phụ",
    ],
    probes: [
      "Một unit test cần năm mock nói gì về thiết kế?",
      "Nêu một lỗi cụ thể mà chỉ test tích hợp trên hạ tầng thật bắt được",
      "Bạn làm gì khi bộ kiểm thử thỉnh thoảng đỏ vô cớ?",
    ],
    refs: ["wgjd-13", "wgjd-14"],
  },
  {
    id: "wgjd-iq24",
    field: "wgjd",
    topic: "wg-build",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Bộ kiểm thử 2.100 bài của một đội có khoảng 15 bài \"thỉnh thoảng đỏ\". Đội đã đánh dấu chúng là được phép thất bại và cấu hình CI tự chạy lại ba lần. Sáu tháng sau, một lỗi đồng thời thật lọt lên production và gây mất dữ liệu — và hoá ra một trong 15 bài đó đã bắt được nó từ bốn tháng trước.",
      scale: "Bộ kiểm thử chạy 40 lần mỗi ngày. Sự cố production ảnh hưởng khoảng 3.000 bản ghi và mất hai ngày để hoà giải. Việc chạy lại ba lần làm CI thêm 12 phút mỗi lần có bài đỏ.",
      constraints: "Không xoá được 15 bài đó — chúng phủ những đường quan trọng. Không kéo dài được thời gian CI, hiện đã 18 phút. Phải đưa ra quy trình dùng lại được, không chỉ sửa 15 bài này.",
      },
    question: "Cấu hình chạy lại ba lần đã làm gì với thông tin mà bộ kiểm thử tạo ra? Nêu quy trình bạn thiết lập.",
    mustCover: [
      "Chạy lại ba lần biến một bài kiểm **xác suất** thành một bài kiểm luôn xanh — nó **xoá tín hiệu** thay vì xử lý nó",
      "Một bài thỉnh thoảng đỏ trên mã đồng thời thường **không** phải bài kiểm tệ mà là bài kiểm đang làm đúng việc",
      "Vì lỗi đồng thời tự nó mang tính xác suất, nên biểu hiện đúng của nó **là** thỉnh thoảng đỏ",
      "Đánh dấu được phép thất bại là quyết định **bỏ thông tin**, và nó phải là quyết định có chủ ý và có thời hạn",
      "Quy trình: phân loại từng bài đỏ thất thường thành **bài kiểm hỏng** hay **mã hỏng** — không được gộp hai loại",
      "Bài kiểm hỏng thì sửa hoặc xoá; **mã hỏng** thì đó là lỗi production đang chờ, phải mở việc và ưu tiên",
      "Cấm chạy lại như chính sách mặc định; nếu dùng thì phải **ghi lại** mọi lần đỏ để tần suất vẫn quan sát được",
      "Giữ ngân sách 18 phút bằng cách tách nhóm bài chậm hoặc dễ dao động ra một luồng riêng, không bằng cách chạy lại",
    ],
    model: "Điều cấu hình chạy lại đã làm là xoá thông tin. Một bài kiểm thỉnh thoảng đỏ mang một tín hiệu có xác suất; chạy lại ba lần rồi lấy kết quả tốt nhất biến nó thành một bài luôn xanh, nên tín hiệu biến mất trong khi nguyên nhân vẫn nguyên. Và với mã đồng thời thì điều này đặc biệt nguy hiểm, vì lỗi đồng thời tự nó mang tính xác suất — nó phụ thuộc thời điểm các luồng giao nhau. Nghĩa là **biểu hiện đúng** của một lỗi đồng thời **chính là** một bài kiểm thỉnh thoảng đỏ. Nên cái đội gọi là bài kiểm tệ thật ra là bài kiểm duy nhất trong 2.100 bài đang nói sự thật, và họ đã dạy CI cách không nghe nó. Bốn tháng và 3.000 bản ghi là giá của việc đó. Quy trình tôi thiết lập bắt đầu bằng một quy tắc phân loại, vì mọi thứ khác phụ thuộc nó: mỗi bài đỏ thất thường phải được xếp vào một trong hai loại — **bài kiểm hỏng** hoặc **mã hỏng** — và không bao giờ được để ở giữa. Bài kiểm hỏng là khi nó phụ thuộc thời gian thực, thứ tự chạy, tài nguyên dùng chung hay một cổng cố định; cái đó thì sửa, hoặc xoá nếu nó không phủ gì. Mã hỏng là khi bài kiểm đang phơi ra một điều kiện tranh chấp thật; cái đó không phải vấn đề của bộ kiểm thử mà là một lỗi production đang chờ, và nó phải được mở thành một việc có mức ưu tiên tương ứng với hậu quả. Quy tắc thứ hai: cấm chạy lại làm chính sách mặc định. Nếu vì lý do vận hành phải chạy lại thì mọi lần đỏ vẫn phải được ghi lại, để tần suất đỏ của từng bài là một đại lượng quan sát được — vì chính tần suất đó là dữ liệu quý nhất ta có về một lỗi xác suất. Quy tắc thứ ba là một hạn ngạch: không bài nào được ở trạng thái \"được phép thất bại\" quá một khoảng thời gian định trước mà không có người sở hữu và một quyết định. Về ràng buộc 18 phút, tôi giữ nó không bằng cách chạy lại mà bằng cách tách nhóm bài chậm hoặc dễ dao động sang một luồng riêng chạy song song, hoặc chạy sau khi hợp nhất — nên chúng vẫn cho tín hiệu mà không nằm trên đường chặn. Và với 15 bài hiện có, việc đầu tiên tôi làm là chạy mỗi bài vài trăm lần để đo tần suất đỏ thật, vì con số đó phân loại chúng nhanh hơn bất kỳ cuộc thảo luận nào.",
    redFlags: [
      "Giữ cấu hình chạy lại và chỉ sửa 15 bài hiện có",
      "Xoá các bài đỏ thất thường để CI xanh",
      "Gộp \"bài kiểm hỏng\" và \"mã hỏng\" thành một loại \"test flaky\"",
      "Kéo dài thời gian CI để chạy lại nhiều hơn",
      "Coi lỗi đồng thời không tái hiện được là bằng chứng nó không tồn tại",
    ],
    probes: [
      "Bạn đo tần suất đỏ thật của một bài bằng cách nào?",
      "Vì sao với mã đồng thời thì \"thỉnh thoảng đỏ\" lại là biểu hiện đúng?",
      "Ai sở hữu một bài đã được xếp loại \"mã hỏng\", và trong bao lâu?",
    ],
    refs: ["wgjd-13", "wgjd-14"],
  },
];
