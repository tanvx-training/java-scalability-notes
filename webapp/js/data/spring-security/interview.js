// Ngân hàng câu hỏi phỏng vấn Spring Security — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Spring Security in Action, 2nd ed.
// (Laurenţiu Spilcă, Manning 2024).
//
// LƯU Ý: chương 14 (máy chủ uỷ quyền OAuth 2) chỉ còn phần đầu trong nguồn,
// nên không câu nào neo vào nó. Nội dung OAuth 2 lấy từ ch 13, 15, 16.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA.
//
// GIỮ NGUYÊN id (springsec-iq01–springsec-iq24).

export const springSecurityInterview = [

  // ===== ssec-auth (springsec-iq01–springsec-iq04) =====
  {
    id: "springsec-iq01",
    field: "spring-security",
    topic: "ssec-auth",
    level: 1,
    minutes: 5,
    question: "Kể lại luồng xác thực của Spring Security theo từng thành phần, và nói rõ mỗi thành phần chịu trách nhiệm gì.",
    mustCover: [
      "**Bộ lọc xác thực** chặn request đến và chuyển trách nhiệm xác thực cho `AuthenticationManager`",
      "`AuthenticationManager` không tự xác thực — nó dùng một hoặc nhiều **`AuthenticationProvider`**",
      "`AuthenticationProvider` là nơi chứa **logic xác thực**; muốn đổi cách xác thực thì đổi ở đây",
      "Để so khớp tên đăng nhập và mật khẩu, provider dựa vào **`UserDetailsService`** và **`PasswordEncoder`**",
      "`UserDetailsService` chỉ có một việc: **tìm người dùng theo tên đăng nhập**",
      "`UserDetails` là cách Spring Security hiểu về một người dùng; quyền hạn của người dùng là các **`GrantedAuthority`**",
      "`PasswordEncoder` mô tả cách mật khẩu được băm và cách **kiểm tra** một chuỗi thô có khớp chuỗi băm",
      "Xác thực xong, bộ lọc lưu đối tượng `Authentication` vào **`SecurityContext`** cho phần còn lại của request",
      "Và thứ tự cố định: ứng dụng **xác thực trước, phân quyền sau**",
    ],
    model: "Tôi kể theo đường đi của request vì đó là cách nhớ nó không nhầm. Bộ lọc xác thực đứng trong chuỗi bộ lọc HTTP, chặn request đến và không tự làm gì cả — nó chuyển trách nhiệm cho `AuthenticationManager`. `AuthenticationManager` cũng không tự xác thực; nhiệm vụ của nó là chọn và gọi một `AuthenticationProvider` phù hợp. `AuthenticationProvider` là nơi chứa logic xác thực thật, và đây là điểm mở rộng quan trọng nhất của kiến trúc: khi cần một cách xác thực khác — mã một lần, xác thực qua một hệ thống ngoài, thêm một bước kiểm tra — thì đó là chỗ ta viết. Với cách xác thực bằng tên đăng nhập và mật khẩu, provider dựa vào hai thành phần: `UserDetailsService` để lấy người dùng, và `PasswordEncoder` để so khớp mật khẩu. `UserDetailsService` được thiết kế rất hẹp — nó chỉ tìm người dùng theo tên đăng nhập, vì đó là hành động duy nhất framework cần để hoàn tất xác thực. Nếu ứng dụng còn cần thêm, sửa, xoá người dùng thì có `UserDetailsManager` mở rộng từ nó; việc tách đôi như vậy nghĩa là ứng dụng chỉ xác thực thì không bị buộc phải cài đặt những hành vi nó không dùng. Người dùng được biểu diễn bằng `UserDetails`, và những gì người dùng được phép làm là một tập `GrantedAuthority`. `PasswordEncoder` thì tôi muốn nhấn rằng nó mô tả **hai** việc chứ không một: cách băm mật khẩu, và cách kiểm tra một chuỗi thô có khớp với chuỗi băm đã lưu — vì băm là hàm một chiều nên phải luôn có hàm so khớp đi kèm. Cuối luồng, sau khi xác thực thành công, bộ lọc lưu đối tượng `Authentication` vào `SecurityContext`, và từ đó controller hay bất kỳ lớp nào cũng đọc được người dùng hiện tại. Chi tiết cuối và nó giải thích nhiều hành vi gây bối rối: ứng dụng luôn xác thực trước rồi mới phân quyền. Nên một endpoint mở cho mọi người vẫn trả 401 nếu ta gửi kèm thông tin đăng nhập sai — request không bao giờ tới được bộ lọc phân quyền.",
    redFlags: [
      "Nói `AuthenticationManager` tự thực hiện logic xác thực",
      "Cho rằng `UserDetailsService` cũng lo việc tạo và sửa người dùng",
      "Không biết `PasswordEncoder` phải có cả hàm so khớp",
      "Đảo thứ tự: cho rằng phân quyền chạy trước xác thực",
    ],
    probes: [
      "Muốn thêm một bước xác thực bằng mã một lần thì bạn viết ở thành phần nào?",
      "Vì sao `UserDetailsService` và `UserDetailsManager` lại được tách làm hai?",
      "Endpoint `permitAll()` mà gửi mật khẩu sai thì nhận status gì, vì sao?",
    ],
    refs: ["springsec-03", "springsec-04"],
  },
  {
    id: "springsec-iq02",
    field: "spring-security",
    topic: "ssec-auth",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@Service
public class ReportService {
    @Async                                                     // (1)
    public void generateReport() {
        SecurityContext ctx = SecurityContextHolder.getContext();
        String username = ctx.getAuthentication().getName();   // (2) NPE ở đây
        // ... dựng báo cáo cho username
    }
}

@RestController
public class ReportController {
    private final ReportService reportService;
    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    @PostMapping("/report")
    public void report() {
        reportService.generateReport();                        // (3)
        pool.submit(() -> auditLog.record(                     // (4)
            SecurityContextHolder.getContext()
                .getAuthentication().getName()));              // (5) cũng NPE
    }
}`,
    },
    question: "Hai chỗ cùng ném `NullPointerException` khi đọc người dùng hiện tại. Giải thích cơ chế, rồi sửa từng chỗ.",
    mustCover: [
      "Chiến lược mặc định là **`MODE_THREADLOCAL`**: mỗi thread có `SecurityContext` riêng của nó",
      "Bộ lọc xác thực đặt `Authentication` vào context của **thread đang phục vụ request**",
      "Dòng (1) làm phương thức chạy trên **thread khác**, nên context của nó rỗng → `getAuthentication()` trả `null`",
      "Dòng (4) cũng vậy: thread trong pool do ta tạo, Spring không biết nó tồn tại",
      "Sửa chỗ (1): đổi chiến lược sang **`MODE_INHERITABLETHREADLOCAL`** để context được sao sang thread của `@Async`",
      "Sửa chỗ (4): Spring **không** quản lý được thread ta tự tạo, nên phải sao context **tường minh**",
      "Cách tường minh: bọc tác vụ bằng `DelegatingSecurityContextRunnable`, hoặc bọc chính pool bằng `DelegatingSecurityContextExecutorService`",
      "**Không** dùng `MODE_GLOBAL` — nó cho mọi thread thấy **một** context duy nhất, tức mọi người dùng lẫn vào nhau",
      "Cách đơn giản và tôi ưa hơn cả hai: **truyền tên người dùng làm tham số** thay vì đọc từ context ở thread khác",
    ],
    model: "Cả hai chỗ cùng một cơ chế. Chiến lược mặc định quản lý `SecurityContext` là `MODE_THREADLOCAL`, nghĩa là context được giữ trong một `ThreadLocal` và mỗi thread chỉ thấy phần của riêng nó. Bộ lọc xác thực đặt `Authentication` vào context của thread đang phục vụ request; bất kỳ thread nào khác đều bắt đầu với một context rỗng, nên `getAuthentication()` trả `null` và dòng sau ném `NullPointerException`. Dòng (1) đưa phương thức sang một thread khác, nên nó rơi đúng vào trường hợp đó; dòng (4) cũng vậy, và tệ hơn một chút vì thread đó do ta tạo nên Spring còn không biết nó tồn tại. Cách sửa khác nhau ở hai chỗ, và đó là điểm chính. Với `@Async`, Spring biết thread đó nên ta chỉ cần đổi chiến lược sang `MODE_INHERITABLETHREADLOCAL`; khi ấy context được sao từ thread cha sang thread chạy phương thức bất đồng bộ. Với pool ta tự tạo thì đổi chiến lược không giúp gì, vì Spring không có chỗ nào để chèn việc sao chép — ta phải làm tường minh, bằng cách bọc tác vụ trong `DelegatingSecurityContextRunnable`, hoặc gọn hơn là bọc chính `ExecutorService` bằng `DelegatingSecurityContextExecutorService` để mọi tác vụ nộp vào đó đều mang context theo. Tôi sẽ chọn bọc pool, vì bọc từng tác vụ nghĩa là ai cũng phải nhớ, và lỗi này chỉ lộ ra khi chạy. Có một lựa chọn thứ ba mà tôi nói rõ để loại: `MODE_GLOBAL` cho mọi thread thấy cùng một context duy nhất. Nó làm cả hai `NullPointerException` biến mất, nên rất dễ bị chọn — nhưng trong một ứng dụng web nhiều người dùng thì nó có nghĩa là danh tính của người dùng này bị thread của người dùng khác đọc thấy, tức một lỗ hổng rò rỉ danh tính nghiêm trọng hơn nhiều lần lỗi ban đầu. Cuối cùng, nếu được thiết kế lại, tôi sẽ không đọc context ở thread khác chút nào: lấy tên người dùng ở ranh giới request rồi **truyền nó làm tham số** vào tác vụ. Khi đó thông tin đi theo dữ liệu chứ không theo thread, và cả lớp vấn đề này biến mất thay vì được cấu hình quanh.",
    redFlags: [
      "Đặt `MODE_GLOBAL` để \"cho gọn\" — rò rỉ danh tính giữa các người dùng",
      "Đổi chiến lược sang `MODE_INHERITABLETHREADLOCAL` rồi tin rằng pool tự tạo cũng được chữa",
      "Kiểm tra `null` rồi bỏ qua, ghi báo cáo với người dùng \"unknown\"",
      "Đọc người dùng từ một field của service để \"khỏi phải lấy từ context\"",
    ],
    probes: [
      "Vì sao `MODE_INHERITABLETHREADLOCAL` không cứu được pool bạn tự tạo?",
      "`MODE_GLOBAL` gây hậu quả cụ thể gì trong ứng dụng web?",
      "Truyền tên người dùng làm tham số có nhược điểm nào không?",
    ],
    refs: ["springsec-06"],
  },
  {
    id: "springsec-iq03",
    field: "spring-security",
    topic: "ssec-auth",
    level: 3,
    minutes: 10,
    question: "Hệ thống cũ lưu mật khẩu băm bằng SHA-256. Bạn cần chuyển sang bcrypt mà không buộc 400.000 người dùng đổi mật khẩu. Chọn cách nào?",
    tradeoffs: [
      {
        option: "`DelegatingPasswordEncoder`, di trú dần khi người dùng đăng nhập",
        when: "Lựa chọn mặc định. Tiền tố `{...}` trong chuỗi băm cho biết thuật toán, nên hệ thống đọc được cả hai loại; người dùng mới và người đăng nhập lại được băm bằng bcrypt. Không ai bị buộc đổi mật khẩu, và số bản ghi yếu giảm dần.",
      },
      {
        option: "Băm lại toàn bộ ngay",
        when: "Không làm được. Băm là hàm một chiều, nên ta **không có** mật khẩu thô để băm lại — chỉ có chuỗi băm SHA-256. Muốn bcrypt thì phải có mật khẩu thô, tức phải chờ người dùng nhập.",
      },
      {
        option: "Băm bọc: bcrypt lên trên chuỗi SHA-256 đã có",
        when: "Chạy được ngay cho toàn bộ người dùng, nhưng độ mạnh vẫn bị chặn bởi lớp trong: kẻ tấn công vẫn dò được mật khẩu yếu qua SHA-256 nếu lấy được cả hai tầng. Và nó tạo ra một lược đồ phi tiêu chuẩn phải tự duy trì mãi.",
      },
    ],
    mustCover: [
      "Ràng buộc nền: băm là **một chiều**, nên ta không có mật khẩu thô để băm lại hàng loạt",
      "Vì thế mọi lời giải đều phải chờ người dùng **nhập mật khẩu** một lần",
      "`DelegatingPasswordEncoder` giải đúng bài này: nó chọn bộ mã hoá theo **tiền tố** của chuỗi băm",
      "Cần đánh tiền tố cho dữ liệu cũ (ví dụ `{sha256}`), vì bản ghi cũ không có tiền tố nào",
      "Hoặc đặt bộ mã hoá mặc định là loại cũ để chuỗi không tiền tố vẫn khớp — nhưng khi đó bản ghi **mới** cũng nhận mặc định đó, nên đây là bẫy",
      "Cách đúng: mặc định là **bcrypt**, và tiền tố hoá tường minh các bản ghi cũ",
      "Khi người dùng đăng nhập thành công bằng chuỗi cũ, **băm lại** mật khẩu vừa nhập bằng bcrypt rồi ghi đè",
      "Phải theo dõi tiến độ: còn bao nhiêu bản ghi `{sha256}`, và có mốc thời gian để cưỡng chế đổi mật khẩu với phần còn lại",
      "Vì nếu không có mốc kết thúc, ta sẽ mang hai lược đồ mãi mãi — và bản ghi yếu vẫn là bản ghi yếu",
    ],
    model: "Điều quyết định toàn bộ bài này là một tính chất của băm: nó một chiều. Ta chỉ có chuỗi băm SHA-256, không có mật khẩu thô, nên không thể băm lại bằng bcrypt hàng loạt — dù có muốn. Từ đó mọi lời giải hợp lý đều phải chờ người dùng nhập mật khẩu một lần, và câu hỏi thật là ta chịu đựng thế nào trong khoảng thời gian chuyển tiếp. Lời giải tôi chọn là `DelegatingPasswordEncoder`. Nó là một `PasswordEncoder` không tự băm mà uỷ cho các bộ mã hoá khác, chọn dựa trên tiền tố trong dấu ngoặc nhọn ở đầu chuỗi băm — `{bcrypt}` thì đi bcrypt, `{sha256}` thì đi bộ mã hoá cũ. Nghĩa là hệ thống đọc được đồng thời hai loại chuỗi băm mà không cần một nhánh `if` nào trong mã nghiệp vụ. Có một chi tiết cài đặt mà tôi thấy dễ làm sai và nó quan trọng: dữ liệu cũ **không có** tiền tố, và chuỗi không tiền tố sẽ được giao cho bộ mã hoá mặc định. Cách dễ nghĩ ra là đặt bộ mã hoá cũ làm mặc định để chuỗi cũ vẫn khớp — nhưng như vậy thì mật khẩu **mới** cũng bị băm bằng thuật toán cũ, và ta đứng yên tại chỗ trong khi tin rằng mình đang tiến. Cách đúng là đặt bcrypt làm mặc định rồi chạy một câu cập nhật để tiền tố hoá tường minh toàn bộ bản ghi cũ thành `{sha256}...`. Đó là một phép biến đổi chuỗi thuần, không cần biết mật khẩu, nên nó làm được ngay cho cả 400.000 bản ghi. Phần thứ hai là di trú dần: khi một người dùng đăng nhập thành công và chuỗi băm của họ còn là loại cũ, ta đã có mật khẩu thô trong tay ở đúng thời điểm đó — băm lại bằng bcrypt và ghi đè. Người dùng không thấy gì cả, và mỗi lần đăng nhập là một bản ghi được nâng cấp. Điều cuối tôi luôn kèm theo, vì nó là chỗ những cuộc di trú kiểu này chết: phải đo và phải có mốc kết thúc. Đếm số bản ghi còn tiền tố cũ theo tuần; những người dùng không đăng nhập trong, chẳng hạn, sáu tháng sẽ không tự nâng cấp, nên phải có một mốc mà sau đó ta cưỡng chế đặt lại mật khẩu cho phần còn lại. Không có mốc đó thì ta không di trú, ta chỉ thêm một lược đồ nữa để duy trì — và những bản ghi yếu nhất, thuộc về người dùng ít hoạt động nhất, sẽ tồn tại vô hạn.",
    redFlags: [
      "Đề nghị băm lại toàn bộ mật khẩu ngay, không nhận ra băm là một chiều",
      "Đặt bộ mã hoá cũ làm mặc định của `DelegatingPasswordEncoder` — mật khẩu mới cũng thành yếu",
      "Buộc toàn bộ 400.000 người đổi mật khẩu, trái yêu cầu",
      "Không băm lại khi người dùng đăng nhập thành công, nên không có tiến độ nào",
      "Không đặt mốc kết thúc cho cuộc di trú",
    ],
    probes: [
      "Bạn xử lý những bản ghi cũ không có tiền tố như thế nào?",
      "Bạn đo tiến độ di trú bằng con số nào?",
      "Người dùng hai năm không đăng nhập thì cuối cùng xử lý ra sao?",
    ],
    refs: ["springsec-04"],
  },
  {
    id: "springsec-iq04",
    field: "spring-security",
    topic: "ssec-auth",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một ứng dụng nội bộ dùng `UserDetailsService` tự viết, truy vấn bảng `users` theo tên đăng nhập. Sau khi phát hành bản có tính năng \"đăng nhập bằng email\", đội bảo mật phát hiện có thể đăng nhập vào tài khoản quản trị bằng một mật khẩu **bất kỳ**. Lỗi chỉ xảy ra với 3 tài khoản, và cả 3 đều là tài khoản được tạo từ thời hệ thống cũ.",
      scale: "12.000 tài khoản, 3 tài khoản bị ảnh hưởng — trong đó 2 có quyền quản trị. Truy vết log cho thấy chưa ai ngoài đội bảo mật khai thác được. Bản có lỗi đã chạy 11 ngày.",
      constraints: "Không được tắt đăng nhập của toàn hệ thống. Phải xác định chắc chắn còn tài khoản nào cùng dạng hay không. Phải giải thích được vì sao kiểm thử tự động không bắt được lỗi này.",
      },
    question: "\"Mật khẩu bất kỳ cũng vào được\" chỉ tới nguyên nhân nào? Nêu chẩn đoán, cách khoanh vùng, và vì sao kiểm thử không bắt được.",
    mustCover: [
      "\"Mật khẩu nào cũng đúng\" là dấu hiệu rất hẹp: việc **so khớp mật khẩu bị bỏ qua hoặc luôn trả `true`**",
      "Giả thuyết mạnh nhất: 3 bản ghi cũ có chuỗi băm mang tiền tố `{noop}`, hoặc không băm",
      "`NoOpPasswordEncoder` giữ mật khẩu ở dạng thô và so khớp bằng phép so sánh chuỗi — nó chỉ dành cho ví dụ",
      "Với `DelegatingPasswordEncoder`, một bản ghi `{noop}` khiến **chính bản ghi đó** được so khớp bằng thuật toán rỗng",
      "Nên lỗ hổng nằm ở **dữ liệu**, không ở mã — và đó là lý do nó chỉ ảnh hưởng 3 tài khoản",
      "Khoanh vùng ngay: truy vấn bảng tìm mọi chuỗi băm không mang tiền tố mong đợi, hoặc mang `{noop}`",
      "Đó là một câu truy vấn, không cần đăng nhập của ai, nên thoả ràng buộc không tắt hệ thống",
      "Xử lý ngay: vô hiệu hoá 3 tài khoản đó và buộc đặt lại mật khẩu, ưu tiên 2 tài khoản quản trị",
      "Vì sao kiểm thử không bắt: kiểm thử dùng người dùng **giả lập** hoặc dữ liệu tạo mới, nên nó không bao giờ chạm vào bản ghi cũ",
      "Bài học cấu trúc: thêm một **bất biến trên dữ liệu** — không bản ghi nào được mang tiền tố yếu — kiểm ở cả di trú và lúc khởi động",
      "Và bỏ `NoOpPasswordEncoder` khỏi map của `DelegatingPasswordEncoder` để lớp lỗi này không thể tái diễn",
    ],
    model: "\"Mật khẩu bất kỳ cũng vào được\" là một triệu chứng hẹp đến mức nó gần như nêu luôn nguyên nhân: bước so khớp mật khẩu không thực sự so khớp gì. Trong Spring Security, đường phổ biến nhất dẫn tới đó là `NoOpPasswordEncoder` — nó giữ mật khẩu ở dạng thô và \"so khớp\" bằng một phép so sánh chuỗi. Nếu bản ghi lưu chuỗi rỗng, hoặc nếu mã ở đâu đó coi mật khẩu trống là khớp, thì mọi mật khẩu đều qua. Chi tiết \"chỉ 3 tài khoản, cả 3 từ hệ thống cũ\" chỉnh giả thuyết cho tôi rất nhiều: nếu lỗi nằm trong mã thì nó sẽ ảnh hưởng toàn bộ, nên lỗ hổng nằm ở **dữ liệu** — 3 bản ghi đó có chuỗi băm mang tiền tố `{noop}` hoặc không có tiền tố hợp lệ, và `DelegatingPasswordEncoder` trung thành làm đúng điều tiền tố yêu cầu: uỷ cho bộ mã hoá rỗng. Tôi coi đây là một tính chất đáng nhớ của thiết kế đó: tiền tố nằm trong dữ liệu, nên một bản ghi có thể tự hạ cấp thuật toán của chính nó, và mã hoàn toàn không sai. Khoanh vùng thì nhanh và thoả được ràng buộc không tắt hệ thống: một câu truy vấn trên bảng tìm mọi chuỗi băm không bắt đầu bằng tiền tố mong đợi, cộng với mọi chuỗi mang `{noop}` hay rỗng. Nó không cần ai đăng nhập và cho câu trả lời dứt khoát về việc còn tài khoản nào cùng dạng. Xử lý ngay theo thứ tự rủi ro: vô hiệu hoá 3 tài khoản, ưu tiên 2 tài khoản quản trị, và buộc đặt lại mật khẩu qua một kênh đã xác thực. Song song, dù log cho thấy chưa ai khai thác, tôi vẫn coi 11 ngày là một cửa sổ phải điều tra: rà log đăng nhập của 3 tài khoản đó trong toàn bộ khoảng thời gian, và vì hai trong số đó là quản trị thì phải rà cả những hành động đã thực hiện dưới danh nghĩa chúng. Câu hỏi về kiểm thử là phần tôi thấy giá trị nhất. Kiểm thử bảo mật thường dùng người dùng giả lập — ta khai một người dùng có vai trò cho trước rồi kiểm phân quyền — hoặc dùng dữ liệu được tạo mới trong chính bài kiểm thử. Cả hai cách đều không bao giờ chạm vào bản ghi cũ trong cơ sở dữ liệu thật, nên một khiếm khuyết chỉ tồn tại trong dữ liệu di trú thì không có bài kiểm thử nào nhìn thấy. Đó không phải lỗi của đội viết kiểm thử; đó là giới hạn của việc kiểm thử mã khi lỗ hổng nằm ở dữ liệu. Nên biện pháp cấu trúc tôi đề xuất không phải thêm bài kiểm thử mà là thêm một **bất biến trên dữ liệu**: không bản ghi nào được mang tiền tố yếu, kiểm ở cuối mỗi lần di trú và kiểm lại lúc ứng dụng khởi động, và ứng dụng từ chối khởi động nếu vi phạm. Kèm theo đó, tôi bỏ `NoOpPasswordEncoder` khỏi map của `DelegatingPasswordEncoder` hoàn toàn — nếu thuật toán rỗng không có trong map thì một bản ghi `{noop}` sẽ **thất bại** thay vì cho qua, và lớp lỗi này chuyển từ \"mở cửa im lặng\" sang \"báo lỗi ồn ào\", đúng hướng ta muốn với mọi sai sót về bảo mật.",
    redFlags: [
      "Đi tìm lỗi trong mã đăng nhập bằng email mà không xét dữ liệu",
      "Kết luận đây là tấn công và tập trung điều tra kẻ xâm nhập",
      "Sửa 3 bản ghi rồi coi là xong, không rà toàn bảng",
      "Giữ `NoOpPasswordEncoder` trong map \"để tương thích\"",
      "Nói kiểm thử bắt được nếu viết nhiều hơn — bỏ qua việc lỗ hổng nằm ở dữ liệu",
      "Không rà hành động đã thực hiện dưới danh nghĩa 2 tài khoản quản trị trong 11 ngày",
    ],
    probes: [
      "Câu truy vấn khoanh vùng của bạn tìm chính xác điều kiện gì?",
      "Vì sao bỏ `NoOpPasswordEncoder` khỏi map lại là biện pháp cấu trúc?",
      "Bất biến dữ liệu của bạn chạy ở những thời điểm nào?",
    ],
    refs: ["springsec-04", "springsec-03"],
  },

  // ===== ssec-filter (springsec-iq05–springsec-iq08) =====
  {
    id: "springsec-iq05",
    field: "spring-security",
    topic: "ssec-filter",
    level: 1,
    minutes: 5,
    question: "Chuỗi bộ lọc HTTP của Spring Security là gì, và có những cách nào để đưa một bộ lọc của mình vào đó?",
    mustCover: [
      "Bộ lọc trong Spring Security là **bộ lọc HTTP tiêu chuẩn** — ta cài `Filter` và ghi đè `doFilter`",
      "`doFilter` nhận request, response và **`FilterChain`**; muốn request đi tiếp thì phải gọi `FilterChain`",
      "Chuỗi là một tập bộ lọc chạy theo **thứ tự xác định**, mỗi bộ lọc có một chỉ số",
      "Chuỗi **không cố định**: nó dài hay ngắn tuỳ cấu hình — gọi `httpBasic()` mới thêm `BasicAuthenticationFilter`",
      "Ba cách chèn: đặt bộ lọc **trước**, **sau**, hoặc **tại vị trí** của một bộ lọc đã biết",
      "Nhiều bộ lọc có thể cùng một vị trí, và khi đó **thứ tự gọi giữa chúng không được định nghĩa**",
      "Nên không được dựa vào thứ tự giữa hai bộ lọc cùng vị trí",
      "Chọn vị trí là một quyết định có ý nghĩa: đặt trước bộ lọc xác thực thì logic chạy khi **chưa** có người dùng",
    ],
    model: "Bộ lọc ở đây không phải khái niệm riêng của Spring Security — chúng là bộ lọc HTTP tiêu chuẩn, ta cài giao diện `Filter` và ghi đè `doFilter`. `doFilter` nhận ba thứ: request, response, và `FilterChain`; chi tiết dễ quên nhất là request chỉ đi tiếp khi ta **gọi** `FilterChain` — không gọi thì ta đã chặn request lại, và đó vừa là cách chặn hợp lệ vừa là chỗ dễ gây lỗi nếu bỏ sót một nhánh. Chuỗi bộ lọc là một tập bộ lọc chạy theo thứ tự xác định, mỗi bộ lọc có một chỉ số hay \"thứ tự\". Điều tôi muốn nhấn là chuỗi không cố định: nó được dựng theo cấu hình của ta. Chẳng hạn `BasicAuthenticationFilter` chỉ có mặt nếu ta gọi `httpBasic()`; `CsrfFilter` và `CorsFilter` cũng vậy. Nên khi một hành vi không xảy ra, câu hỏi đầu tiên là bộ lọc tương ứng có nằm trong chuỗi hay không. Về cách chèn bộ lọc của mình, có ba cách và chúng khác nhau về ý nghĩa: đặt **trước** một bộ lọc đã biết, đặt **sau**, hoặc đặt **tại** vị trí của nó. Chọn vị trí là một quyết định thật, không phải chi tiết kỹ thuật. Đặt trước bộ lọc xác thực nghĩa là logic của ta chạy khi chưa có người dùng nào được xác thực — đúng cho việc kiểm tra định dạng request, vì ta muốn loại request sai dạng trước khi tốn công truy vấn cơ sở dữ liệu để xác thực. Đặt sau bộ lọc xác thực thì ta đã có `SecurityContext`, nên đó là chỗ cho việc ghi nhật ký ai đăng nhập hay thông báo cho hệ thống khác. Còn một điều cần biết để không bị bối rối: hai bộ lọc có thể cùng một vị trí, và khi đó thứ tự gọi giữa chúng **không** được định nghĩa. Nên nếu logic của tôi phụ thuộc vào việc chạy trước hay sau một bộ lọc khác, tôi phải diễn đạt điều đó bằng vị trí tương đối, chứ không được đặt cùng chỗ rồi hy vọng.",
    redFlags: [
      "Quên rằng phải gọi `FilterChain` để request đi tiếp",
      "Cho rằng chuỗi bộ lọc là cố định, giống nhau ở mọi ứng dụng",
      "Đặt hai bộ lọc cùng vị trí rồi dựa vào thứ tự giữa chúng",
      "Không phân biệt được ý nghĩa của trước và sau bộ lọc xác thực",
    ],
    probes: [
      "Vì sao kiểm tra định dạng request nên đặt trước bộ lọc xác thực?",
      "Bộ lọc của bạn muốn đọc người dùng hiện tại thì phải đặt ở đâu?",
      "Chuỗi bộ lọc của một ứng dụng thay đổi theo điều gì?",
    ],
    refs: ["springsec-05"],
  },
  {
    id: "springsec-iq06",
    field: "spring-security",
    topic: "ssec-filter",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `public class TenantHeaderFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        var request  = (HttpServletRequest) req;
        var response = (HttpServletResponse) res;

        String tenant = request.getHeader("X-Tenant-Id");
        if (tenant != null && tenantRegistry.isKnown(tenant)) {
            TenantContext.set(tenant);                       // (1)
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);   // (2)
        }
    }
}

// Cấu hình:
http.addFilterAfter(new TenantHeaderFilter(),
                    BasicAuthenticationFilter.class);        // (3)

// Ba hiện tượng trong môi trường thực tế:
// A. Sau một đợt tải, request của khách thuê A đôi khi đọc dữ liệu của khách thuê B.
// B. Request thiếu header vẫn làm ứng dụng truy vấn bảng users (thấy trong log DB).
// C. Request thiếu header nhận 400 với thân rỗng, client không biết thiếu gì.`,
    },
    question: "Ba hiện tượng, ba nguyên nhân khác nhau. Giải thích từng cái rồi sửa cả bộ lọc lẫn cấu hình.",
    mustCover: [
      "Hiện tượng A: dòng (1) đặt giá trị vào một biến theo thread nhưng **không bao giờ xoá**",
      "Thread được **tái sử dụng** từ pool của servlet container, nên giá trị cũ còn lại cho request sau",
      "Nên request thiếu header — hoặc request của khách thuê khác trước khi kịp ghi đè — đọc được giá trị của người trước",
      "Sửa A: bọc trong `try/finally` và **xoá** giá trị ở `finally`, không phải ở cuối nhánh thành công",
      "Hiện tượng B: dòng (3) đặt bộ lọc **sau** bộ lọc xác thực, nên xác thực đã chạy trước khi ta kiểm header",
      "Sửa B: đặt bộ lọc **trước** bộ lọc xác thực, vì kiểm định dạng request không cần biết người dùng",
      "Hiện tượng C: dòng (2) đặt status nhưng không ghi gì vào thân response",
      "Sửa C: ghi một thông điệp nêu rõ header nào thiếu hoặc không hợp lệ — nhưng **không** tiết lộ danh sách khách thuê hợp lệ",
      "Và phân biệt hai trường hợp: thiếu header là 400; header có nhưng không thuộc quyền của người dùng là **403**",
    ],
    model: "Ba hiện tượng, ba nguyên nhân độc lập, và tôi thấy hiện tượng A là nghiêm trọng nhất nên nói trước. Dòng (1) đặt giá trị khách thuê vào một biến theo thread nhưng không có chỗ nào xoá nó. Servlet container tái sử dụng thread từ pool, nên khi một thread phục vụ request tiếp theo, giá trị của request trước vẫn còn đó. Với request thiếu header thì nhánh `else` chạy và ta trả 400 — nhưng nếu mã nào khác chạy trên thread đó lại đọc `TenantContext`, nó đọc được khách thuê của người trước. Và ngay cả trên đường thành công, việc để lại giá trị cũ là một quả bom chờ. Đây là dạng rò rỉ dữ liệu giữa các khách thuê, tức lỗi tệ nhất một hệ thống nhiều khách thuê có thể mắc, và nó thưa nên rất khó bắt. Sửa thì phải bọc `try/finally` và xoá ở `finally`, không phải ở cuối nhánh thành công — vì nếu một ngoại lệ được ném ra từ phần chuỗi phía sau thì đường dọn dẹp bị bỏ qua, và đúng những request lỗi lại là những request để lại rác. Hiện tượng B là lỗi về vị trí: dòng (3) đặt bộ lọc sau `BasicAuthenticationFilter`, nên khi ta mới kiểm header thì việc xác thực đã chạy xong — kể cả truy vấn bảng `users`. Việc kiểm định dạng request không cần biết người dùng là ai, nên nó phải chạy **trước** xác thực; đổi sang chèn trước là đủ, và nó cũng làm ứng dụng khó bị làm mệt bằng request rác hơn. Hiện tượng C nhỏ hơn nhưng ảnh hưởng mọi đội tích hợp: dòng (2) đặt status mà không ghi gì vào thân, nên client nhận 400 trống và không biết sai ở đâu. Tôi sẽ ghi một thông điệp nêu rõ thiếu hay không hợp lệ ở header nào — nhưng có một ranh giới phải giữ: không liệt kê các khách thuê hợp lệ, vì đó là thông tin giúp dò. Và khi sửa chỗ này tôi sẽ tách hai trường hợp mà mã hiện tại gộp làm một: header thiếu hoặc sai dạng là lỗi của request, trả 400; còn header hợp lệ nhưng người dùng không có quyền với khách thuê đó là vấn đề **phân quyền**, phải trả 403 — và quan trọng hơn, việc kiểm đó không thể nằm ở bộ lọc trước xác thực, vì lúc đó ta chưa biết người dùng. Nên thiết kế đúng là hai lớp: một bộ lọc trước xác thực kiểm dạng, và một lớp sau xác thực kiểm quyền với khách thuê.",
    redFlags: [
      "Xoá `TenantContext` ở cuối nhánh thành công thay vì trong `finally`",
      "Đổi biến theo thread thành một field của bộ lọc — bộ lọc là một instance dùng chung, còn tệ hơn",
      "Giữ bộ lọc sau bộ lọc xác thực vì \"nó vẫn chạy\"",
      "Ghi ra danh sách khách thuê hợp lệ trong thông điệp lỗi",
      "Gộp \"thiếu header\" và \"không có quyền với khách thuê\" vào cùng một status",
    ],
    probes: [
      "Vì sao xoá trong `finally` mới đủ?",
      "Nếu không gọi `chain.doFilter` thì điều gì xảy ra với request?",
      "Kiểm quyền với khách thuê đặt ở đâu, và vì sao không đặt ở bộ lọc này?",
    ],
    refs: ["springsec-05", "springsec-06"],
  },
  {
    id: "springsec-iq07",
    field: "spring-security",
    topic: "ssec-filter",
    level: 3,
    minutes: 10,
    question: "Cần thêm một bước xác thực bằng mã một lần. Viết một bộ lọc, viết một `AuthenticationProvider`, hay dùng dịch vụ ngoài?",
    tradeoffs: [
      {
        option: "`AuthenticationProvider` tự viết",
        when: "Khi bước thêm vào **là một cách xác thực** — nó nhận thông tin và quyết định danh tính. Nó nằm đúng chỗ kiến trúc dành cho logic xác thực, nên `SecurityContext`, phân quyền và kiểm thử đều hoạt động như bình thường.",
      },
      {
        option: "Bộ lọc tự viết",
        when: "Khi việc cần làm **không phải** xác thực: kiểm định dạng request, ghi nhật ký, chặn theo tần suất, đọc một header. Chèn trước hay sau bộ lọc xác thực tuỳ việc đó cần biết người dùng hay không.",
      },
      {
        option: "Dịch vụ nhận diện bên ngoài",
        when: "Khi ta không muốn tự giữ và tự bảo vệ yếu tố thứ hai — mã một lần đòi kênh gửi, chống dò, giới hạn số lần thử, đồng bộ thời gian. Đổi lại là một phụ thuộc ngoài và một luồng OAuth 2 phải hiểu.",
      },
    ],
    mustCover: [
      "Câu hỏi phân định: việc này **là xác thực** hay chỉ là logic quanh xác thực?",
      "Mã một lần là một bước quyết định danh tính, nên nó thuộc về `AuthenticationProvider`",
      "Viết nó thành bộ lọc thì ta đặt logic xác thực ngoài chỗ kiến trúc dành cho nó",
      "Hệ quả cụ thể: ta phải tự đặt `SecurityContext`, tự xử lý lỗi, và mất phần hỗ trợ kiểm thử sẵn có",
      "Ngược lại, bộ lọc là đúng chỗ cho kiểm định dạng, ghi nhật ký, chặn theo tần suất — những việc **không** quyết định danh tính",
      "Nhưng phần khó nhất của mã một lần không nằm ở chỗ viết nó ở đâu",
      "Nó nằm ở **giới hạn số lần thử**, thời gian sống của mã, và kênh gửi — vì mã 6 số dò được rất nhanh nếu không giới hạn",
      "Nên nếu không tự tin làm đủ những thứ đó, dùng dịch vụ ngoài là quyết định đúng, không phải né việc",
      "Và dù chọn cách nào, bước thứ hai phải **không thể bỏ qua** — không có đường nào vào hệ thống mà không qua nó",
    ],
    model: "Câu hỏi tôi dùng để phân định là: việc này **là** xác thực, hay nó chỉ là logic đứng quanh xác thực? Kiểm tra một mã một lần là việc nhận thông tin từ người dùng và quyết định danh tính, nên nó là xác thực, và chỗ kiến trúc dành cho nó là một `AuthenticationProvider`. Viết nó ở đó không chỉ là cho đúng chỗ — nó mua được những thứ cụ thể: `AuthenticationManager` gọi nó theo luồng chuẩn, `SecurityContext` được đặt cho ta, lỗi xác thực trả về đúng status, và phần hỗ trợ kiểm thử của framework hoạt động. Nếu tôi nhồi logic đó vào một bộ lọc thì tôi phải tự làm lại từng thứ trong danh sách trên, và mỗi thứ tôi làm lại là một chỗ có thể sai. Bộ lọc thì đúng cho họ việc khác: kiểm định dạng request, ghi nhật ký sự kiện xác thực, chặn theo tần suất, đọc một header định tuyến — chúng không quyết định danh tính, và với chúng thì `AuthenticationProvider` là chỗ sai. Nhưng tôi muốn nói thẳng phần quan trọng nhất, vì nó không nằm trong câu hỏi: chỗ đặt mã không phải phần khó của xác thực hai yếu tố. Phần khó là giới hạn số lần thử, thời gian sống của mã, kênh gửi, và chống dò. Một mã sáu số chỉ có một triệu khả năng; nếu ta không giới hạn số lần thử cho mỗi người dùng và mỗi khoảng thời gian thì bước thứ hai gần như không thêm sức mạnh nào, mà chỉ thêm một bước cho người dùng. Cộng thêm việc gửi mã cần một kênh, và kênh đó có thể hỏng, chậm hoặc bị chiếm. Nên nếu đội không có đủ thời gian làm đúng những thứ đó, tôi coi việc dùng một dịch vụ nhận diện bên ngoài là quyết định kỹ thuật đúng, không phải né việc — ta đổi một phụ thuộc và một luồng OAuth 2 phải hiểu, để lấy một phần bảo mật đã được làm cẩn thận hơn ta có thể làm trong một quý. Và điều cuối, đúng với cả ba phương án: bước thứ hai chỉ có giá trị nếu **không thể bỏ qua**. Tôi sẽ kiểm rằng không có đường nào vào hệ thống mà không đi qua nó — không có endpoint nào cấp phiên đầy đủ ngay sau bước thứ nhất, không có luồng \"đăng nhập bằng token cũ\" nào lách được — vì một bước bảo mật có đường đi vòng thì bằng không.",
    redFlags: [
      "Viết logic xác thực vào bộ lọc rồi tự đặt `SecurityContext`",
      "Dùng `AuthenticationProvider` cho việc ghi nhật ký hay kiểm định dạng",
      "Không nói gì tới giới hạn số lần thử",
      "Không kiểm xem có đường nào vào hệ thống mà bỏ qua bước thứ hai",
      "Cho mã một lần thời gian sống dài để \"người dùng đỡ vội\"",
    ],
    probes: [
      "`AuthenticationProvider` cho bạn những gì mà bộ lọc không cho?",
      "Bạn giới hạn số lần thử theo chiều nào — người dùng, IP, hay cả hai?",
      "Bạn tìm đường đi vòng qua bước thứ hai bằng cách nào?",
    ],
    refs: ["springsec-05", "springsec-06"],
  },
  {
    id: "springsec-iq08",
    field: "spring-security",
    topic: "ssec-filter",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một bộ lọc tự viết ghi nhật ký mọi lần xác thực thất bại để đội bảo mật theo dõi dò mật khẩu. Sau 6 tuần, đội bảo mật báo nhật ký \"gần như trống\" dù bảng đếm của hệ thống cho thấy 240.000 lần xác thực thất bại trong kỳ. Bộ lọc được chèn bằng `addFilterAt` tại vị trí của `BasicAuthenticationFilter`.",
      scale: "240.000 lần thất bại được đếm, 1.900 lần được ghi nhật ký — khoảng 0,8%. Trong 6 tuần đó có một đợt dò mật khẩu kéo dài 4 ngày nhắm vào 80 tài khoản mà không ai phát hiện.",
      constraints: "Không đổi được hệ thống thu gom nhật ký. Phải giải thích được con số 0,8%. Phải bảo đảm không bỏ sót sự kiện nào sau khi sửa, và chứng minh được điều đó.",
      },
    question: "0,8% nói gì? Nêu chẩn đoán, cách sửa, và cách bạn chứng minh lần này không còn bỏ sót.",
    mustCover: [
      "Manh mối: 0,8% không phải \"đôi khi lỗi\" mà là \"gần như **không bao giờ** chạy\"",
      "`addFilterAt` đặt bộ lọc **cùng vị trí** với `BasicAuthenticationFilter`, và khi cùng vị trí thì **thứ tự không được định nghĩa**",
      "Nên bộ lọc của ta chỉ chạy trong ít trường hợp nó tình cờ được gọi trước — 0,8% chính là tỉ lệ tình cờ đó",
      "Và khi `BasicAuthenticationFilter` chạy trước rồi từ chối request, chuỗi dừng, nên bộ lọc của ta không bao giờ được gọi",
      "Lỗi sâu hơn: `addFilterAt` **không thay thế** bộ lọc kia, nó chỉ thêm vào cùng chỗ — người viết có thể đã tưởng ngược lại",
      "Sửa cơ học: không dùng `addFilterAt`; đặt bộ lọc ở vị trí **xác định** so với bộ lọc xác thực",
      "Nhưng sửa đúng hơn: **bộ lọc là chỗ sai** để nghe sự kiện xác thực thất bại",
      "Vì một bộ lọc đứng trước thì chưa biết kết quả, còn đứng sau thì request đã bị chặn và không tới nó",
      "Chỗ đúng là cơ chế **sự kiện xác thực** của framework, hoặc một điểm mở rộng được gọi đúng khi xác thực thất bại",
      "Chứng minh không bỏ sót: đối chiếu số nhật ký với bảng đếm sẵn có và đòi **khớp**, đặt cảnh báo khi lệch",
      "Và điều tra ngược đợt dò 4 ngày: 80 tài khoản đó phải được kiểm xem có tài khoản nào bị chiếm không",
      "Bài học: một cơ chế quan sát **không được quan sát** thì không phải cơ chế quan sát",
    ],
    model: "0,8% là con số nói lên gần hết. Nếu bộ lọc chạy nhưng đôi khi lỗi, ta sẽ thấy một tỉ lệ như 90% hay 99%; 0,8% nghĩa là nó gần như không bao giờ chạy, và thứ chạy 0,8% thời gian thường là một cuộc đua. `addFilterAt` đặt bộ lọc của ta **cùng vị trí** với `BasicAuthenticationFilter`, và với hai bộ lọc cùng vị trí thì thứ tự gọi giữa chúng không được định nghĩa. Khi bộ lọc của ta tình cờ được gọi trước, nó chạy — nhưng lúc đó việc xác thực còn chưa diễn ra nên nó cũng chẳng có kết quả nào để ghi; khi `BasicAuthenticationFilter` được gọi trước và request thất bại xác thực, nó trả 401 và chuỗi dừng lại, nên bộ lọc của ta không bao giờ được gọi. Nói cách khác cơ chế này sai theo cả hai nhánh, và 0,8% là tỉ lệ ngẫu nhiên của nhánh thứ nhất. Tôi cũng nghi rằng người viết đã hiểu `addFilterAt` là \"thay thế bộ lọc kia\" — cái tên gợi ý như vậy — trong khi nó chỉ thêm vào cùng chỗ; nếu nó thực sự thay thế thì xác thực Basic đã ngừng hoạt động hoàn toàn và lỗi sẽ bị phát hiện ngay ngày đầu. Sửa phần cơ học thì đơn giản: bỏ `addFilterAt`, đặt bộ lọc ở một vị trí xác định so với bộ lọc xác thực. Nhưng tôi sẽ không dừng ở đó, vì sửa vị trí không sửa được vấn đề gốc: bộ lọc là chỗ sai để nghe một sự kiện \"xác thực thất bại\". Đứng trước bộ lọc xác thực thì ta chưa biết kết quả; đứng sau thì với request thất bại ta không được gọi, vì chuỗi đã dừng. Không có vị trí nào trong chuỗi cho ta đúng thứ ta cần, nên đây là lỗi chọn cơ chế, không phải lỗi cấu hình. Chỗ đúng là cơ chế sự kiện xác thực của framework — nó được phát ra đúng lúc xác thực thành công hay thất bại, bất kể request bị chặn ở đâu — và tôi ghi nhật ký từ đó. Về việc chứng minh lần này không bỏ sót, và tôi cho đây là phần quan trọng nhất của bài học: lỗi này sống được 6 tuần vì không ai so nhật ký với bất cứ thứ gì. Hệ thống đã có bảng đếm số lần xác thực thất bại, nên tôi đối chiếu số bản ghi nhật ký với bảng đếm đó và đòi hai con số khớp nhau, rồi đặt cảnh báo khi chúng lệch quá một ngưỡng nhỏ. Như vậy cơ chế quan sát tự nó được quan sát — và nguyên tắc tôi rút ra là: một cơ chế quan sát không được quan sát thì không phải cơ chế quan sát, nó chỉ là một niềm tin. Việc tôi làm song song, không đợi sửa xong: đợt dò 4 ngày nhắm vào 80 tài khoản phải được điều tra ngược từ dữ liệu còn lại — bảng đếm, nhật ký truy cập, nhật ký đăng nhập thành công trong cùng khoảng — để xác định có tài khoản nào bị chiếm hay không. Sửa cơ chế ghi nhật ký không trả lời được câu hỏi đó, và nó là câu hỏi cấp bách hơn.",
    redFlags: [
      "Chỉ đổi `addFilterAt` thành `addFilterAfter` rồi coi là xong",
      "Kết luận hệ thống thu gom nhật ký mất dữ liệu",
      "Cho rằng `addFilterAt` thay thế bộ lọc kia",
      "Không nhận ra không vị trí nào trong chuỗi cho được sự kiện cần ghi",
      "Không đối chiếu nhật ký với bảng đếm sau khi sửa",
      "Bỏ qua việc điều tra 80 tài khoản trong đợt dò",
    ],
    probes: [
      "Vì sao đặt bộ lọc sau bộ lọc xác thực cũng không ghi được request thất bại?",
      "Bạn chứng minh không bỏ sót bằng con số nào, đối chiếu với cái gì?",
      "Với đợt dò đã qua, bạn còn dữ liệu nào để điều tra?",
    ],
    refs: ["springsec-05"],
  },

  // ===== ssec-authz (springsec-iq09–springsec-iq12) =====
  {
    id: "springsec-iq09",
    field: "spring-security",
    topic: "ssec-authz",
    level: 1,
    minutes: 5,
    question: "Phân biệt quyền hạn và vai trò trong Spring Security. Ở tầng cài đặt, cái gì thực sự phân biệt hai khái niệm đó?",
    mustCover: [
      "**Quyền hạn** là đặc quyền chi tiết — đọc, ghi, xoá; ta viết quy tắc dựa trên tên ta tự đặt",
      "**Vai trò** là một \"phù hiệu\" bao quát hơn, gộp một nhóm đặc quyền",
      "Ở tầng cài đặt, cả hai đều được biểu diễn bằng **cùng một** giao ước `GrantedAuthority`",
      "Điều duy nhất phân biệt chúng là **tiền tố `ROLE_`** ở đầu tên",
      "Nên khi khai một vai trò, tên bắt buộc bắt đầu bằng `ROLE_`",
      "Nhưng khi viết quy tắc thì `hasRole(\"ADMIN\")` **không** kèm tiền tố — framework tự thêm",
      "Còn `hasAuthority()` thì so khớp tên **đúng nguyên văn**",
      "Sự bất đối xứng đó là chỗ sai phổ biến nhất: khai `ROLE_ADMIN` rồi viết `hasAuthority(\"ADMIN\")` sẽ không bao giờ khớp",
    ],
    model: "Về mặt khái niệm, quyền hạn là đặc quyền chi tiết — quyền đọc, quyền ghi, quyền xoá — và ta viết quy tắc phân quyền dựa trên những tên ta tự đặt cho chúng. Vai trò thì bao quát hơn: nó giống một phù hiệu định danh người dùng và gộp cả một nhóm đặc quyền. Chọn giữa hai cách phụ thuộc vào việc ứng dụng có luôn cấp cùng một nhóm quyền cho cùng một loại người dùng hay không: nếu có, dùng vai trò thì gọn hơn, và khi đó ta thường không cần định nghĩa quyền hạn riêng nữa. Nhưng phần thú vị của câu hỏi là ở tầng cài đặt, và ở đó câu trả lời gọn đến mức đáng nhớ: cả quyền hạn và vai trò đều được biểu diễn bằng **cùng một** giao ước `GrantedAuthority`. Không có kiểu riêng cho vai trò. Điều duy nhất phân biệt chúng là quy ước đặt tên: tên của một vai trò bắt buộc bắt đầu bằng tiền tố `ROLE_`. Nghĩa là \"vai trò\" thực chất là một quyền hạn có tên theo một quy ước nhất định — và đó là lý do tôi luôn nói rằng nếu nắm được `GrantedAuthority` thì cả hai khái niệm đều không còn gì bí ẩn. Có một bất đối xứng phải nhớ vì nó là chỗ sai phổ biến nhất trong chủ đề này: khi khai người dùng, tôi phải ghi đủ tiền tố — `ROLE_ADMIN`; nhưng khi viết quy tắc thì `hasRole(\"ADMIN\")` **không** kèm tiền tố, vì framework tự thêm vào. Ngược lại, `hasAuthority()` so khớp tên đúng nguyên văn, không thêm gì. Nên cặp sai kinh điển là khai `ROLE_ADMIN` rồi viết `hasAuthority(\"ADMIN\")`: nó không bao giờ khớp, và nó không báo lỗi — người dùng chỉ nhận 403 và ta đi tìm nguyên nhân ở chỗ khác. Ngược lại cũng đáng ngại hơn: một quy tắc dùng `hasRole` cho thứ được khai là quyền hạn cũng lặng lẽ không khớp. Đây là kiểu lỗi mà hai chữ đọc gần giống nhau lại có hành vi khác nhau, nên tôi thường chọn một trong hai cách trong toàn bộ một ứng dụng thay vì trộn cả hai.",
    redFlags: [
      "Cho rằng vai trò có một kiểu riêng, khác `GrantedAuthority`",
      "Khai vai trò mà thiếu tiền tố `ROLE_`",
      "Viết `hasRole(\"ROLE_ADMIN\")` — tiền tố bị thêm hai lần",
      "Không biết `hasAuthority()` so khớp nguyên văn",
    ],
    probes: [
      "Khai `ROLE_ADMIN` rồi viết `hasAuthority(\"ADMIN\")` thì người dùng nhận status gì?",
      "Khi nào bạn chọn quyền hạn thay vì vai trò?",
      "Vì sao lỗi này khó phát hiện?",
    ],
    refs: ["springsec-07", "springsec-03"],
  },
  {
    id: "springsec-iq10",
    field: "spring-security",
    topic: "ssec-authz",
    level: 2,
    minutes: 10,
    code: {
      lang: "java",
      text: `@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.httpBasic(Customizer.withDefaults());
    http.authorizeHttpRequests(c -> c
        .requestMatchers("/api/**").authenticated()          // (1)
        .requestMatchers("/api/admin/**").hasRole("ADMIN")   // (2)
        .requestMatchers("/health").permitAll()
        .anyRequest().authenticated()
    );
    return http.build();
}

@Service
public class AccountService {
    @PostAuthorize("returnObject.ownerId == authentication.name")   // (3)
    @Transactional
    public Account closeAccount(long id) {
        Account a = repo.findById(id);
        a.setStatus(CLOSED);          // (4) thay đổi dữ liệu
        repo.save(a);
        return a;
    }
}

// Hai báo cáo:
// A. Người dùng thường gọi được /api/admin/users và nhận 200.
// B. Người dùng đóng được tài khoản của NGƯỜI KHÁC: họ nhận 403,
//    nhưng tài khoản đó đã bị chuyển sang CLOSED trong database.`,
    },
    question: "Giải thích cả hai lỗ hổng. Vì sao `@Transactional` ở dòng (3) không cứu được trường hợp B? Sửa cả hai.",
    mustCover: [
      "Lỗ hổng A: quy tắc phân quyền được đánh giá **theo thứ tự khai**, và quy tắc đầu khớp sẽ thắng",
      "`/api/**` ở dòng (1) khớp luôn cả `/api/admin/users`, nên dòng (2) **không bao giờ** được xét",
      "Sửa A: khai quy tắc **cụ thể trước, tổng quát sau** — `/api/admin/**` phải đứng trên `/api/**`",
      "Đây là lỗi im lặng: không có cảnh báo nào cho một quy tắc không bao giờ với tới được",
      "Lỗ hổng B: `@PostAuthorize` chỉ kiểm **sau khi** phương thức chạy xong",
      "Nên dòng (4) đã thay đổi dữ liệu trước khi quy tắc được đánh giá",
      "`@Transactional` **không** cứu được, vì ngoại lệ của hậu uỷ quyền được ném **sau khi** transaction đã commit",
      "Đó là một tính chất của cơ chế, không phải một lỗi cấu hình — nên không có cách nào chỉnh để nó rollback",
      "Sửa B: dùng **`@PreAuthorize`** và kiểm quyền sở hữu **trước** khi chạy, bằng một truy vấn chủ sở hữu",
      "Nguyên tắc rút ra: `@PostAuthorize` chỉ dùng cho phương thức **chỉ đọc**",
      "Và lỗ hổng B nghiêm trọng hơn A: A là mất bảo mật, B là mất bảo mật **cộng** mất toàn vẹn dữ liệu",
    ],
    model: "Hai lỗ hổng độc lập và tôi xếp B nghiêm trọng hơn, nên sẽ nói kỹ hơn về nó. Lỗ hổng A là chuyện thứ tự: các quy tắc phân quyền được đánh giá theo thứ tự khai, và quy tắc **đầu tiên** khớp với request là quy tắc được áp dụng. Dòng (1) khai `/api/**`, mà mẫu đó khớp luôn cả `/api/admin/users`, nên dòng (2) không bao giờ được xét tới — nó là mã chết. Sửa thì đảo thứ tự: quy tắc cụ thể phải đứng trước quy tắc tổng quát, tức `/api/admin/**` lên trên `/api/**`. Điều khiến lỗi này đáng chú ý là nó hoàn toàn im lặng: không có cảnh báo nào cho một quy tắc bị che, và mã đọc lên rất thuyết phục vì cả hai dòng đều có mặt. Đây là lý do tôi luôn viết một bài kiểm thử cho mỗi quy tắc chứ không chỉ đọc cấu hình. Lỗ hổng B thì thuộc về bản chất của hậu uỷ quyền. `@PostAuthorize` kiểm quy tắc **sau khi** phương thức đã chạy xong, vì có những điều kiện chỉ đánh giá được trên kết quả trả về. Nhưng phương thức này không chỉ đọc — dòng (4) đổi trạng thái tài khoản sang `CLOSED` và lưu. Nên đến lúc quy tắc được đánh giá và từ chối, thiệt hại đã xảy ra rồi: người gọi nhận 403 và tin rằng mình bị chặn, còn tài khoản của người khác đã bị đóng. Về `@Transactional`, và đây là điểm tôi muốn nói chính xác: nó không cứu được, và không phải vì cấu hình sai. Ngoại lệ do hậu uỷ quyền ném ra xuất hiện **sau khi** bộ quản lý transaction đã commit, nên không còn transaction nào để rollback. Đó là một tính chất của trình tự các lớp chặn, nên không có tham số nào chỉnh được — cách duy nhất là đừng đặt mình vào tình huống đó. Sửa B là chuyển sang `@PreAuthorize` và kiểm quyền sở hữu trước khi chạy. Điều này đòi một thay đổi nhỏ trong thiết kế, vì `@PostAuthorize` được chọn ban đầu chính bởi ta chưa biết chủ sở hữu trước khi đọc bản ghi: nên tôi thêm một truy vấn chỉ lấy chủ sở hữu theo id và kiểm nó trong biểu thức của `@PreAuthorize`, hoặc ép quyền sở hữu vào chính câu cập nhật bằng một điều kiện trên chủ sở hữu để một người dùng không thể đóng tài khoản họ không sở hữu, bất kể lớp nào gọi. Tôi ưa cách thứ hai hơn vì nó đặt bảo đảm ở chỗ không ai lách được. Nguyên tắc tôi rút ra và sẽ đưa vào danh mục review: `@PostAuthorize` chỉ dùng cho phương thức chỉ đọc. Nếu một phương thức thay đổi dữ liệu thì việc kiểm quyền phải xảy ra trước khi nó chạy, không có ngoại lệ.",
    redFlags: [
      "Thêm `rollbackFor` hay đổi cấu hình transaction để \"hoàn tác\" hậu uỷ quyền",
      "Giữ `@PostAuthorize` rồi thêm mã hoàn tác thủ công trong nhánh lỗi",
      "Chỉ sửa thứ tự quy tắc và bỏ qua lỗ hổng B",
      "Đổi `/api/**` thành `/api/*` mà không kiểm lại các đường dẫn sâu hơn",
      "Không nhận ra dòng (2) là mã chết",
    ],
    probes: [
      "Vì sao không cấu hình nào làm hậu uỷ quyền rollback được transaction?",
      "Bạn kiểm quyền sở hữu trước khi chạy bằng cách nào mà không đọc cả bản ghi?",
      "Bạn viết bài kiểm thử nào để lỗi thứ tự quy tắc không tái diễn?",
    ],
    refs: ["springsec-08", "springsec-11"],
  },
  {
    id: "springsec-iq11",
    field: "spring-security",
    topic: "ssec-authz",
    level: 3,
    minutes: 11,
    question: "Quy tắc \"người dùng chỉ xem được dữ liệu của mình\" nên đặt ở đâu: phân quyền endpoint, bảo mật phương thức, hay trong câu truy vấn?",
    tradeoffs: [
      {
        option: "Trong câu truy vấn",
        when: "Lựa chọn mạnh nhất cho quyền sở hữu dữ liệu: điều kiện chủ sở hữu nằm trong chính câu truy vấn, nên **không đường nào** lấy được dữ liệu của người khác — kể cả một endpoint mới ai đó thêm vào tuần sau.",
      },
      {
        option: "Bảo mật phương thức (`@PreAuthorize`)",
        when: "Khi quy tắc phụ thuộc vào **tham số** và cần áp ở một lớp sâu hơn endpoint. Nó gần chỗ nghiệp vụ và đọc ra ý định. Nhưng nó dựa trên proxy, nên lời gọi nội bộ không được áp.",
      },
      {
        option: "Phân quyền endpoint",
        when: "Đúng cho câu hỏi thô — ai được **vào** đường dẫn này. Nó không biết gì về dữ liệu, nên nó không trả lời được \"bản ghi này của ai\".",
      },
    ],
    mustCover: [
      "Phải tách hai loại quy tắc: **ai vào được endpoint** và **bản ghi này thuộc về ai**",
      "Phân quyền endpoint chỉ trả lời loại thứ nhất — nó không thấy dữ liệu",
      "Quyền sở hữu là loại thứ hai, nên nó không thể được bảo đảm ở tầng endpoint",
      "`@PreAuthorize` đọc được tham số nên nó biểu diễn được quy tắc sở hữu, và nó ở gần nghiệp vụ",
      "Nhưng nó dựa trên **proxy**, nên lời gọi nội bộ trong cùng class **không** được áp — một lỗ im lặng",
      "Đặt điều kiện chủ sở hữu vào **câu truy vấn** là bảo đảm mạnh nhất: không có đường vòng",
      "Vì nó không phụ thuộc vào việc ai nhớ thêm annotation ở endpoint mới",
      "Đổi lại: quy tắc bảo mật nằm rải trong tầng truy cập dữ liệu, khó đọc thành một bức tranh tổng thể",
      "Lựa chọn của tôi: **cả hai tầng** — truy vấn là chỗ bảo đảm, `@PreAuthorize` là chỗ tuyên bố ý định",
      "Và phải nhất quán một chuyện: không bao giờ dùng `@PostAuthorize` cho phương thức thay đổi dữ liệu",
    ],
    model: "Điều đầu tiên tôi làm là tách câu hỏi thành hai loại quy tắc khác nhau, vì chúng thường bị gộp: \"ai được vào endpoint này\" và \"bản ghi này thuộc về ai\". Phân quyền endpoint chỉ trả lời được loại thứ nhất — nó nhìn thấy đường dẫn, phương thức HTTP và quyền hạn của người dùng, nhưng nó không thấy dữ liệu, nên nó không thể biết bản ghi số 4.812 là của ai. Vì thế quyền sở hữu dữ liệu về nguyên tắc không thể bảo đảm ở tầng đó, và tôi nêu điều này trước vì nó loại một phương án ra khỏi cuộc. Còn lại hai chỗ. `@PreAuthorize` đọc được tham số của phương thức, nên nó biểu diễn được quy tắc \"tham số này phải trùng với người dùng đang đăng nhập\", và nó nằm gần nghiệp vụ nên mã đọc ra ý định rất rõ. Điểm yếu của nó là cơ chế: bảo mật phương thức hoạt động bằng một aspect, tức bằng proxy, nên một lời gọi từ bên trong cùng class không đi qua proxy và quy tắc không được áp — hoàn toàn im lặng, không cảnh báo nào. Với một quy tắc phân quyền thì \"đôi khi không được áp\" là điều tôi không chấp nhận được. Đặt điều kiện chủ sở hữu vào chính câu truy vấn cho bảo đảm mạnh nhất: nếu mọi truy vấn đọc bản ghi đều mang điều kiện chủ sở hữu, thì không có đường nào lấy được dữ liệu của người khác — kể cả một endpoint mới mà ai đó thêm vào tuần sau và quên annotation, kể cả một lời gọi nội bộ. Đó là lập luận quyết định với tôi: bảo đảm không được phụ thuộc vào việc người sau **nhớ** làm gì. Cái giá phải nói rõ là quy tắc bảo mật khi đó nằm rải trong tầng truy cập dữ liệu, nên không ai đọc được một bức tranh tổng thể về chính sách phân quyền, và một truy vấn viết tay mới vẫn có thể thiếu điều kiện. Nên lựa chọn của tôi là cả hai tầng, với vai trò rõ ràng cho từng tầng: câu truy vấn là chỗ **bảo đảm**, vì nó không bỏ sót đường nào; `@PreAuthorize` là chỗ **tuyên bố ý định**, vì nó làm quy tắc hiện ra ở nơi người ta đọc mã nghiệp vụ, và nó chặn sớm nên ta không tốn một truy vấn cho request chắc chắn bị từ chối. Còn phân quyền endpoint tôi giữ cho đúng việc của nó: chặn theo vai trò ở ranh giới, và đặt `anyRequest().authenticated()` làm mặc định để một endpoint mới không vô tình mở. Cuối cùng, một quy tắc tôi giữ tuyệt đối bất kể chọn tầng nào: không dùng `@PostAuthorize` cho phương thức thay đổi dữ liệu, vì nó kiểm sau khi thay đổi đã xảy ra và transaction đã commit.",
    redFlags: [
      "Dựa hoàn toàn vào phân quyền endpoint cho quy tắc sở hữu dữ liệu",
      "Dùng `@PreAuthorize` mà không nói tới giới hạn proxy",
      "Đặt điều kiện chủ sở hữu chỉ ở tầng nghiệp vụ, còn truy vấn lấy mọi bản ghi",
      "Dùng `@PostAuthorize` cho phương thức có thay đổi dữ liệu",
      "Không đặt quy tắc mặc định cho các endpoint chưa khai",
    ],
    probes: [
      "Một đồng nghiệp thêm endpoint mới và quên annotation — mỗi phương án hành xử thế nào?",
      "Bạn bảo đảm mọi truy vấn đều mang điều kiện chủ sở hữu bằng cách nào?",
      "Vì sao vẫn nên có `@PreAuthorize` khi truy vấn đã an toàn?",
    ],
    refs: ["springsec-11", "springsec-08"],
  },
  {
    id: "springsec-iq12",
    field: "spring-security",
    topic: "ssec-authz",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một API nội bộ có endpoint `GET /api/invoices/{id}`. Kiểm toán phát hiện trong 5 tháng có 61.000 lượt truy cập hoá đơn mà người gọi **không** phải chủ sở hữu. Cấu hình phân quyền có `.requestMatchers(\"/api/invoices/**\").hasAuthority(\"INVOICE_READ\")` và mọi người dùng đều có quyền `INVOICE_READ`. Không có kiểm tra chủ sở hữu ở bất kỳ đâu.",
      scale: "61.000 lượt trên 4,3 triệu lượt gọi. 340 người dùng khác nhau đã truy cập hoá đơn không thuộc về mình; phần lớn có vẻ do dò id tuần tự. 19 khách hàng doanh nghiệp bị ảnh hưởng, trong đó dữ liệu là giá hợp đồng.",
      constraints: "Không được ngừng API — 6 hệ thống nội bộ phụ thuộc vào nó. Phải xác định chính xác dữ liệu của khách hàng nào đã bị đọc. Bộ phận pháp chế cần biết trong 48 giờ liệu có phải thông báo cho khách hàng hay không.",
      },
    question: "Pháp chế cần biết trong 48 giờ: dữ liệu của khách hàng nào **đã** bị đọc — không phải có thể bị đọc. Bạn làm gì trước?",
    mustCover: [
      "Chẩn đoán: cấu hình kiểm **có quyền đọc hoá đơn hay không**, không kiểm **hoá đơn này của ai**",
      "Hai câu hỏi đó khác nhau về bản chất, và tầng endpoint chỉ trả lời được câu thứ nhất",
      "Nên đây không phải lỗi cài đặt mà là **thiếu hẳn một lớp kiểm tra** — lớp tham chiếu đối tượng",
      "Dấu hiệu \"dò id tuần tự\" khớp với id tăng dần: id đoán được biến lỗ hổng thành khai thác dễ",
      "Trong 48 giờ, ưu tiên 1 là **chặn máu** mà không ngừng API: thêm điều kiện chủ sở hữu vào truy vấn",
      "Ưu tiên 2 là **xác định phạm vi**: đối chiếu nhật ký truy cập với bảng chủ sở hữu để ra danh sách chính xác",
      "Đó là việc phân tích dữ liệu, làm được song song với việc sửa, và nó là thứ pháp chế cần",
      "Phải phân biệt \"có thể đã bị đọc\" với \"đã bị đọc\" — nhật ký cho câu trả lời thật, không cần suy đoán",
      "Sửa cấu trúc: điều kiện chủ sở hữu nằm trong **câu truy vấn**, nên không endpoint nào lách được",
      "Thêm một bài kiểm thử cho mỗi endpoint: người dùng A đọc bản ghi của B phải nhận 404 hoặc 403",
      "Trả **404** thay vì 403 cho bản ghi không thuộc về người gọi — 403 tiết lộ rằng id đó tồn tại",
      "Dài hạn: id khó đoán, và giới hạn tần suất để việc dò không còn rẻ",
      "Và nêu rõ: quyền `INVOICE_READ` cấp cho mọi người dùng nghĩa là nó không phân biệt gì — nó nên được xem lại",
    ],
    model: "Chẩn đoán thì không có gì bí ẩn và tôi muốn phát biểu nó chính xác: cấu hình kiểm rằng người gọi **có quyền đọc hoá đơn**, còn điều cần kiểm là **hoá đơn này có thuộc về người gọi**. Hai câu hỏi đó khác nhau về bản chất, và tầng phân quyền endpoint chỉ trả lời được câu thứ nhất vì nó không nhìn thấy dữ liệu. Nên đây không phải một quy tắc viết sai mà là **thiếu hẳn một lớp kiểm tra** — lớp kiểm tham chiếu đối tượng. Việc mọi người dùng đều có `INVOICE_READ` làm rõ thêm: một quyền hạn mà ai cũng có thì không phân biệt được gì, nên cấu hình hiện tại về thực chất tương đương với \"người dùng nào đã đăng nhập cũng đọc được mọi hoá đơn\". Chi tiết \"dò id tuần tự\" là phần biến một lỗ hổng thành một cuộc rò rỉ quy mô lớn: khi id tăng dần thì người ta chỉ cần đổi một con số, nên không cần kỹ năng gì. Về 48 giờ, tôi chạy hai luồng song song vì chúng không phụ thuộc nhau. Luồng thứ nhất là chặn máu mà không ngừng API, vì ràng buộc không cho ngừng và 6 hệ thống đang phụ thuộc: thêm điều kiện chủ sở hữu vào chính câu truy vấn đọc hoá đơn. Đó là một thay đổi nhỏ, ở một chỗ, và nó chặn mọi đường — kể cả những endpoint tôi chưa kịp rà. Tôi chọn nó thay vì thêm annotation vào từng endpoint đúng vì lý do đó. Một quyết định cần nói rõ khi làm việc này: với bản ghi không thuộc về người gọi, tôi trả **404** chứ không phải 403 — vì 403 xác nhận rằng id đó tồn tại, và với id tuần tự thì đó chính là thông tin kẻ dò cần. Luồng thứ hai là xác định phạm vi, và nó là thứ pháp chế cần trong 48 giờ. Tôi không suy đoán \"có thể đã bị đọc\"; tôi đối chiếu nhật ký truy cập — từng lượt gọi với người gọi và id hoá đơn — với bảng chủ sở hữu, và ra một danh sách chính xác: hoá đơn nào, của khách hàng nào, bị ai đọc, lúc nào. Phân biệt giữa \"có thể\" và \"đã\" rất quan trọng ở đây, vì nghĩa vụ thông báo và mức độ tổn hại phụ thuộc vào danh sách thật, và dữ liệu là giá hợp đồng nên sai sót về phạm vi rất tốn kém. Tôi cũng tách riêng những trường hợp có dấu hiệu dò hệ thống — một người gọi đi qua nhiều id liên tiếp — khỏi những trường hợp có thể là nhầm lẫn, vì hai nhóm đó cần xử lý khác nhau về mặt nhân sự và pháp lý. Về việc sửa để lớp lỗ hổng không tái diễn, tôi không tin vào việc rà một lần. Điều kiện chủ sở hữu phải nằm trong tầng truy cập dữ liệu để nó là mặc định chứ không phải một bước ai cũng phải nhớ; và cho mỗi endpoint trả về dữ liệu thuộc về người dùng, tôi thêm một bài kiểm thử rất đơn giản — người dùng A đọc bản ghi của người dùng B phải không nhận được dữ liệu. Bài kiểm thử đó rẻ, và nó là thứ duy nhất khiến lớp lỗi này không quay lại qua một endpoint mới. Dài hạn tôi đề xuất hai việc nữa: chuyển sang id khó đoán để việc dò không còn cơ học, và giới hạn tần suất để nếu ai đó vẫn dò thì việc đó vừa chậm vừa nhìn thấy được. Và tôi sẽ nêu ra việc xem lại chính quyền `INVOICE_READ`: một quyền cấp cho tất cả mọi người là dấu hiệu mô hình phân quyền chưa được nghĩ xong, và sự cố này là cơ hội để nghĩ lại nó.",
    redFlags: [
      "Thêm `@PreAuthorize` vào từng endpoint rồi coi là đã chặn hết",
      "Trả 403 cho bản ghi không thuộc về người gọi, tiết lộ id tồn tại",
      "Suy đoán phạm vi ảnh hưởng thay vì đối chiếu nhật ký",
      "Ngừng API để \"an toàn\", trái ràng buộc",
      "Chỉ đổi sang id khó đoán và coi đó là biện pháp bảo mật",
      "Không tách nhóm dò hệ thống khỏi nhóm truy cập lẻ",
      "Không đặt câu hỏi về việc mọi người dùng đều có `INVOICE_READ`",
    ],
    probes: [
      "Vì sao 404 tốt hơn 403 ở đây, và nó có nhược điểm gì?",
      "Bạn dựng danh sách khách hàng bị ảnh hưởng từ những nguồn dữ liệu nào?",
      "Vì sao đặt điều kiện chủ sở hữu ở truy vấn mạnh hơn đặt ở từng endpoint?",
    ],
    refs: ["springsec-08", "springsec-11", "springsec-07"],
  },

  // ===== ssec-csrf (springsec-iq13–springsec-iq16) =====
  {
    id: "springsec-iq13",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 1,
    minutes: 6,
    question: "CSRF và CORS đều liên quan tới nguồn gốc chéo, nhưng chúng làm hai việc trái ngược nhau. Giải thích từng cái.",
    mustCover: [
      "**CSRF** là một dạng tấn công: trang web lạ khiến trình duyệt của người dùng **đã đăng nhập** gửi request thay đổi dữ liệu tới ứng dụng của ta",
      "Nó hoạt động được vì trình duyệt tự gửi kèm phiên của người dùng — server tin đó là người dùng",
      "Chống CSRF là một **giới hạn ta thêm vào**: chỉ frontend của chính ứng dụng mới thực hiện được thao tác thay đổi dữ liệu",
      "Cách làm: một token sinh khi tải trang, và mọi request thay đổi dữ liệu phải mang token đó",
      "`CsrfFilter` cho GET, HEAD, TRACE, OPTIONS đi qua; các method còn lại phải có token, không thì **403**",
      "**CORS** thì ngược lại: nó **nới lỏng** một giới hạn mà trình duyệt vốn áp",
      "Trình duyệt mặc định cấm gọi liên nguồn; CORS là cách server nói \"tôi cho phép nguồn này\"",
      "Điều quan trọng nhất: CORS **không** phải cơ chế phân quyền — endpoint vẫn có thể được thực thi dù CORS chặn response",
      "Nên đừng bao giờ dựa vào CORS để bảo vệ endpoint; nó chỉ chặn **trình duyệt** đọc response",
    ],
    model: "Chúng đi ngược chiều nhau và tôi thấy nói rõ điều đó là cách nhớ chắc nhất. CSRF là một dạng tấn công. Người dùng đã đăng nhập vào ứng dụng của ta, rồi họ mở một trang web khác — trong ví dụ điển hình là một liên kết trong thư. Trang đó chứa mã âm thầm gửi request tới backend của ta, và vì trình duyệt tự động gửi kèm phiên của người dùng, server tin rằng chính người dùng đang yêu cầu. Kẻ tấn công không cần biết mật khẩu; họ chỉ cần người dùng đang đăng nhập và mở một trang. Chống CSRF là một giới hạn **ta thêm vào**: mục tiêu là chỉ frontend của chính ứng dụng mới thực hiện được thao tác thay đổi dữ liệu. Cơ chế dựa trên một quan sát đơn giản — trước khi làm gì thay đổi dữ liệu, người dùng phải tải trang bằng một request GET ít nhất một lần. Lúc đó ứng dụng sinh một token, và từ đó nó chỉ chấp nhận request thay đổi dữ liệu nếu request mang token ấy. Biết được token là bằng chứng request phát ra từ trang do chính server cung cấp. `CsrfFilter` cho GET, HEAD, TRACE và OPTIONS đi qua không cần token; với mọi method còn lại, thiếu token hay token sai thì nó trả 403. Từ đó ra một quy tắc hệ quả rất quan trọng: **không bao giờ** dùng GET cho thao tác thay đổi dữ liệu, vì GET không đòi token nên nó ở ngoài toàn bộ lớp bảo vệ này. CORS thì hoàn toàn khác về ý định: nó nới lỏng một giới hạn mà trình duyệt vốn đã áp. Theo mặc định trình duyệt không cho một trang ở nguồn này gọi tài nguyên ở nguồn khác; CORS là cách server nói \"tôi cho phép nguồn này, với những method và header này\", thông qua các header phản hồi. Và đây là ngộ nhận tôi thấy nhiều nhất, nên tôi luôn nói ra: CORS không phải cơ chế phân quyền. Khi một lời gọi liên nguồn vi phạm chính sách, trong nhiều trường hợp endpoint ở backend **vẫn được thực thi** — trình duyệt chỉ từ chối cho trang đọc response. Đôi khi trình duyệt gửi một request thăm dò bằng OPTIONS trước, và nếu request thăm dò bị từ chối thì request thật không được gửi; nhưng nó bỏ qua bước thăm dò với GET, POST hoặc OPTIONS dùng header cơ bản. Nên kết luận thực dụng: CORS bảo vệ người dùng trong trình duyệt, không bảo vệ endpoint của ta — bảo vệ endpoint là việc của xác thực và phân quyền.",
    redFlags: [
      "Coi CORS là một lớp bảo vệ endpoint",
      "Nói CSRF là giới hạn của trình duyệt thay vì một dạng tấn công",
      "Không biết `CsrfFilter` bỏ qua GET, HEAD, TRACE, OPTIONS",
      "Tin rằng vi phạm CORS luôn ngăn được endpoint thực thi",
    ],
    probes: [
      "Vì sao \"không dùng GET để thay đổi dữ liệu\" lại là hệ quả của cách CSRF hoạt động?",
      "Request thăm dò bằng OPTIONS xảy ra khi nào?",
      "Cấu hình CORS cho phép mọi nguồn thì rủi ro cụ thể là gì?",
    ],
    refs: ["springsec-09", "springsec-10"],
  },
  {
    id: "springsec-iq14",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(c -> c.disable());                       // (1)
    http.cors(c -> {
        CorsConfigurationSource source = request -> {
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowedOrigins(List.of("*"));    // (2)
            config.setAllowedHeaders(List.of("*"));
            config.setAllowCredentials(true);          // (3)
            return config;                             // (4) không khai method
        };
        c.configurationSource(source);
    });
    http.formLogin(Customizer.withDefaults());         // (5)
    http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
    return http.build();
}`,
    },
    question: "Cấu hình này được viết để \"cho frontend gọi được\". Nêu từng vấn đề, xếp theo mức nghiêm trọng, rồi viết lại.",
    mustCover: [
      "Vấn đề nghiêm trọng nhất: dòng (1) tắt chống CSRF trong khi dòng (5) dùng **đăng nhập bằng biểu mẫu**",
      "Đăng nhập bằng biểu mẫu nghĩa là phiên nằm trong cookie, và cookie **tự được trình duyệt gửi kèm**",
      "Đó là đúng điều kiện để CSRF khai thác được — nên tắt nó ở đây mở hẳn một lỗ hổng",
      "Vấn đề thứ hai: dòng (2) và (3) cùng nhau — cho phép **mọi nguồn** cộng với **gửi kèm thông tin xác thực**",
      "Tổ hợp đó nghĩa là bất kỳ trang web nào cũng gọi được API của ta với phiên của người dùng",
      "Dòng (4) thiếu khai method, nên một `CorsConfiguration` trống **không cho phép method nào** — cấu hình sẽ từ chối mọi request",
      "Nên nghịch lý: cấu hình vừa quá mở về nguồn vừa hoàn toàn không hoạt động về method",
      "Viết lại: bật lại chống CSRF, hoặc nếu client là ứng dụng độc lập thì chuyển sang xác thực bằng **token** thay vì phiên cookie",
      "Liệt kê **nguồn cụ thể** thay vì `*`, và khai method tường minh",
      "`setAllowCredentials(true)` chỉ dùng khi thật cần và **không bao giờ** đi cùng `*`",
    ],
    model: "Tôi xếp theo mức nghiêm trọng vì ba vấn đề này không tương đương. Nghiêm trọng nhất là tổ hợp dòng (1) với dòng (5): cấu hình tắt chống CSRF trong khi vẫn dùng đăng nhập bằng biểu mẫu. Đăng nhập bằng biểu mẫu nghĩa là phiên được giữ trong cookie, và cookie thì trình duyệt tự gửi kèm cho mọi request tới miền đó — đó chính xác là điều kiện mà tấn công CSRF cần. Nên ở đây việc tắt không phải một lựa chọn đánh đổi mà là mở một lỗ hổng: một trang web bất kỳ có thể khiến trình duyệt của người dùng đang đăng nhập gửi request thay đổi dữ liệu, và server sẽ thực hiện. Tôi nhấn điều này vì tắt chống CSRF là thao tác rất phổ biến khi \"cho frontend gọi được\", và nó thường được làm mà không ai hỏi phiên đang nằm ở đâu. Nghiêm trọng thứ hai là dòng (2) cùng dòng (3): cho phép mọi nguồn, đồng thời cho phép gửi kèm thông tin xác thực. Từng cái đã đáng lo, nhưng tổ hợp thì nghĩa là bất kỳ trang web nào trên Internet cũng gọi được API của ta **với phiên của người dùng** — nó biến mọi endpoint thành công khai đối với mã của người khác chạy trong trình duyệt của người dùng ta. Với nguồn thì tôi không dùng `*` kể cả trong môi trường kiểm thử, vì môi trường kiểm thử và môi trường thực tế hay dùng chung hạ tầng hơn ta tưởng, và một cấu hình mở vô tình đi theo bản phát hành. Vấn đề thứ ba mang tính cơ học nhưng thú vị: dòng (4) trả về một `CorsConfiguration` không khai method nào. Một cấu hình trống thì **không cho phép** method nào cả, nên cấu hình này sẽ từ chối mọi request liên nguồn. Kết quả là một nghịch lý đáng nhớ: nó vừa quá mở về nguồn — trên giấy — vừa hoàn toàn không hoạt động trong thực tế, và người viết có thể sẽ đi tắt thêm thứ khác để \"cho nó chạy\". Viết lại thì tôi hỏi một câu trước: client là gì? Nếu đây là một ứng dụng web do cùng server phục vụ, tôi bật lại chống CSRF và đưa token vào các biểu mẫu cùng các lời gọi bất đồng bộ — đó là cơ chế hoạt động tốt nhất trong kiến trúc ấy nhờ tính đơn giản. Nếu client là một ứng dụng frontend độc lập hay ứng dụng di động, thì token CSRF vốn không phù hợp, và câu trả lời đúng không phải \"tắt CSRF\" mà là **đổi cách xác thực**: chuyển sang token thay vì phiên cookie, và khi đó không còn cookie tự gửi kèm nên lớp CSRF không còn là điều phải bù. Về CORS, tôi liệt kê nguồn cụ thể, khai method tường minh, chỉ mở những header thật cần, và chỉ đặt `setAllowCredentials(true)` nếu kiến trúc thực sự dùng cookie — và trong trường hợp đó thì nó tuyệt đối không đi cùng `*`.",
    redFlags: [
      "Giữ `csrf().disable()` và coi đó là chuyện bình thường của API",
      "Đổi `*` thành danh sách nguồn nhưng vẫn để CSRF tắt với phiên cookie",
      "Không phát hiện việc thiếu khai method làm cấu hình từ chối mọi request",
      "Giữ `allowCredentials(true)` cùng với mọi nguồn",
      "Bật lại CSRF cho một client di động mà không đổi cách xác thực",
    ],
    probes: [
      "Vì sao \"mọi nguồn\" cộng \"gửi kèm thông tin xác thực\" tệ hơn từng cái riêng lẻ?",
      "Client là ứng dụng di động thì bạn chọn cơ chế nào, vì sao?",
      "Cấu hình thiếu khai method biểu hiện ra sao khi chạy?",
    ],
    refs: ["springsec-09", "springsec-10"],
  },
  {
    id: "springsec-iq15",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 3,
    minutes: 10,
    question: "Kiến trúc nào thì cần token CSRF, kiến trúc nào thì không? Và khi \"không cần\", thứ gì thay thế nó?",
    tradeoffs: [
      {
        option: "Ứng dụng web do cùng server render — **cần** token CSRF",
        when: "Phiên nằm trong cookie và trình duyệt tự gửi kèm, nên tấn công CSRF khai thác được. Token là cơ chế đơn giản và phù hợp nhất ở đây; framework lo phần lớn việc, kể cả cho biểu mẫu đăng nhập.",
      },
      {
        option: "Frontend độc lập hoặc ứng dụng di động — token CSRF **không phù hợp**",
        when: "Client không được server render nên không có chỗ tự nhiên để nhận token. Lời giải đúng là đổi cách xác thực: dùng **token mang trong header** thay vì phiên cookie, và khi ấy không còn thông tin nào tự gửi kèm.",
      },
      {
        option: "Giữ cookie mà bỏ token CSRF — dựa vào thuộc tính cookie",
        when: "Có tác dụng, và là một lớp tốt để cộng thêm. Nhưng nó là cơ chế của **trình duyệt**, nên nó phụ thuộc vào phiên bản trình duyệt của người dùng — tôi không dùng nó làm lớp duy nhất.",
      },
    ],
    mustCover: [
      "Câu hỏi phân định không phải \"API hay web\" mà **thông tin xác thực có tự được gửi kèm hay không**",
      "Cookie tự được trình duyệt gửi kèm → CSRF khai thác được → cần token",
      "Token mang trong header **không** tự được gửi kèm, vì mã của trang lạ phải tự thêm nó và nó không đọc được token của ta",
      "Nên chuyển sang xác thực bằng token là một cách **loại bỏ** lớp vấn đề, không phải bỏ qua nó",
      "\"Tắt CSRF cho API\" chỉ đúng khi API **không** dùng phiên cookie — nếu còn cookie thì đó là một lỗ hổng",
      "Nhưng token mang trong header đổi lấy một vấn đề khác: nó phải được **lưu ở đâu đó** trong trình duyệt",
      "Lưu ở nơi mã JavaScript đọc được thì một lỗ XSS sẽ lấy được token — nên rủi ro dịch chỗ, không mất đi",
      "Thuộc tính cookie giới hạn việc gửi kèm liên nguồn là lớp bổ sung tốt, nhưng phụ thuộc trình duyệt người dùng",
      "Và quy tắc đúng với mọi kiến trúc: **không dùng GET cho thao tác thay đổi dữ liệu**",
    ],
    model: "Tôi không phân định bằng \"đây là API hay ứng dụng web\", vì cách đặt đó dẫn tới kết luận sai rất thường xuyên. Câu hỏi đúng là: thông tin xác thực có **tự được gửi kèm** với mọi request hay không? Nếu phiên nằm trong cookie thì có — trình duyệt gửi kèm cookie cho mọi request tới miền đó, bất kể request phát ra từ trang nào. Đó chính là điều kiện mà CSRF khai thác, và khi điều kiện đó có mặt thì ta cần token CSRF, dù ứng dụng tự gọi mình là API. Ngược lại, nếu thông tin xác thực là một token mà client phải **tự đặt vào header**, thì mã của một trang lạ không thể gửi request hợp lệ: nó buộc phải biết token, và nó không đọc được token của ta. Nên chuyển sang xác thực bằng token không phải là bỏ qua CSRF mà là loại bỏ điều kiện làm nó khả thi — một lời giải mạnh hơn hẳn việc thêm một lớp kiểm tra. Từ đó, câu \"tắt CSRF cho API\" mà tôi nghe rất nhiều chỉ đúng có điều kiện: đúng khi API không dùng phiên cookie, và là một lỗ hổng khi nó vẫn dùng. Với ứng dụng web do cùng server render thì token CSRF là cơ chế phù hợp nhất, chủ yếu nhờ tính đơn giản: framework sinh token, đưa nó vào thuộc tính của request, và ta chỉ cần gắn nó vào biểu mẫu cùng các lời gọi bất đồng bộ. Với frontend độc lập hay ứng dụng di động thì token CSRF không có chỗ tự nhiên để sống, vì client không do server render — và đó là dấu hiệu nên đổi kiến trúc xác thực chứ không phải cố nhét cơ chế cũ vào. Nhưng tôi muốn nói rõ cái giá của hướng token, vì nó hay bị trình bày như lời giải không có nhược điểm: token phải được lưu ở đâu đó trong trình duyệt, và nếu nó nằm ở nơi mã JavaScript đọc được thì một lỗ XSS sẽ lấy được nó. Nghĩa là ta không xoá rủi ro, ta dịch nó từ CSRF sang XSS — và XSS thì khó phòng toàn diện hơn. Đó là lý do tôi không coi \"dùng token nên không cần nghĩ về CSRF\" là một câu trả lời đủ. Lớp thứ ba đáng nhắc là các thuộc tính của cookie giới hạn việc gửi kèm trong bối cảnh liên nguồn: nó có tác dụng thật và tôi luôn bật, nhưng nó là cơ chế của trình duyệt nên hiệu lực phụ thuộc vào trình duyệt người dùng đang chạy — tôi dùng nó như lớp bổ sung, không bao giờ làm lớp duy nhất. Cuối cùng, một quy tắc đúng với cả ba kiến trúc và tôi không bao giờ nhượng bộ: không dùng GET cho thao tác thay đổi dữ liệu. GET không đòi token CSRF, nên một endpoint GET thay đổi dữ liệu nằm ngoài toàn bộ lớp bảo vệ này bất kể ta cấu hình cẩn thận đến đâu.",
    redFlags: [
      "Phân định bằng \"API thì không cần CSRF\" mà không hỏi phiên nằm ở đâu",
      "Tắt CSRF trong khi vẫn dùng phiên cookie",
      "Trình bày token trong header như lời giải không có nhược điểm",
      "Dựa duy nhất vào thuộc tính cookie",
      "Không nêu quy tắc về GET",
    ],
    probes: [
      "Chuyển sang token trong header thì rủi ro dịch sang đâu?",
      "Bạn lưu token ở chỗ nào trong trình duyệt, và vì sao?",
      "Một ứng dụng vừa có web render phía server vừa có ứng dụng di động thì bạn làm thế nào?",
    ],
    refs: ["springsec-09", "springsec-13"],
  },
  {
    id: "springsec-iq16",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một cổng quản trị nội bộ dùng đăng nhập bằng biểu mẫu, phiên trong cookie. Ba tuần trước, đội frontend tách giao diện ra một miền riêng và để API chạy được đã thêm cấu hình CORS cho miền mới **và** tắt chống CSRF. Sáng nay, 47 tài khoản người dùng bị đổi quyền thành quản trị. Log cho thấy các request đến từ phiên hợp lệ của 4 nhân viên khác nhau, rải trong 2 giờ, và cả 4 đều nói không làm gì cả.",
      scale: "47 tài khoản bị nâng quyền, trong đó 6 đã được dùng để tải dữ liệu khách hàng. 4 nhân viên bị lợi dụng phiên đều thuộc bộ phận chăm sóc khách hàng và đều đã mở một liên kết trong một thư nội bộ giả mạo sáng nay.",
      constraints: "Không được ngừng cổng quản trị — bộ phận chăm sóc khách hàng đang dùng. Phải hạ quyền 47 tài khoản và xác định 6 tài khoản đã tải gì. Phải trả lời được vì sao cấu hình CORS \"đã giới hạn miền\" mà tấn công vẫn xảy ra.",
      },
    question: "Nêu chẩn đoán. Và trả lời trực tiếp: vì sao việc giới hạn miền trong CORS không ngăn được cuộc tấn công này?",
    mustCover: [
      "Chẩn đoán: đây là tấn công CSRF, và điều kiện cho nó là phiên trong **cookie** cộng với việc chống CSRF bị **tắt**",
      "Dấu hiệu khớp hoàn toàn: request đến từ phiên hợp lệ, người dùng không hay biết, và họ đều đã mở một liên kết",
      "Log **không sai** — request thật đến từ phiên của họ; trang lạ chỉ khiến trình duyệt gửi nó",
      "Trả lời câu hỏi trung tâm: CORS **không** ngăn được vì nó không phải cơ chế phân quyền",
      "Trình duyệt chặn trang lạ **đọc response**, nhưng request vẫn được gửi và backend vẫn **thực thi**",
      "Với một cuộc tấn công đổi quyền, kẻ tấn công **không cần đọc response** — họ chỉ cần thao tác xảy ra",
      "Nên CORS bảo vệ dữ liệu khỏi bị đọc liên nguồn, còn CSRF bảo vệ **thao tác** khỏi bị gọi liên nguồn — hai việc khác nhau",
      "Và với một số dạng request, trình duyệt còn không gửi request thăm dò, nên không có chỗ nào để CORS chặn trước",
      "Xử lý ngay: bật lại chống CSRF; nó không cần ngừng cổng và chặn đúng cơ chế",
      "Đồng thời vô hiệu hoá phiên đang hoạt động của 4 nhân viên, vì phiên bị lợi dụng vẫn còn giá trị",
      "Hạ quyền 47 tài khoản, và tách riêng 6 tài khoản đã tải dữ liệu để điều tra phạm vi",
      "Sửa đúng cho kiến trúc mới: frontend ở miền riêng thì nên chuyển sang xác thực bằng **token trong header**",
      "Vì khi đó không còn cookie tự gửi kèm, và CSRF không còn là điều kiện phải bù",
      "Bài học: \"để API chạy được\" đã dẫn tới việc tắt một lớp bảo mật mà không ai định giá — cần một cổng chặn cho loại thay đổi này",
    ],
    model: "Chẩn đoán thì các dấu hiệu khớp đến mức không cần giả thuyết thứ hai: request đến từ phiên hợp lệ của người dùng thật, người dùng không hay biết, và cả bốn người đều đã mở một liên kết sáng nay. Đó là hình dạng chuẩn của một cuộc tấn công CSRF. Điều kiện để nó xảy ra có hai phần và cả hai đều có mặt: phiên nằm trong cookie, nên trình duyệt tự gửi kèm cho mọi request tới miền đó; và chống CSRF đã bị tắt ba tuần trước, nên không có token nào để kiểm. Một chi tiết tôi muốn làm rõ ngay vì nó ảnh hưởng tới cách xử lý con người: log không sai và bốn nhân viên đó không nói dối. Request thật sự đến từ phiên của họ; trang lạ chỉ khiến trình duyệt của họ gửi nó đi. Bây giờ câu hỏi trung tâm, và tôi trả lời thẳng: giới hạn miền trong CORS không ngăn được cuộc tấn công này vì CORS không phải cơ chế phân quyền. Khi một trang ở nguồn không được phép gọi API của ta, trình duyệt chặn **trang đó đọc response** — nhưng request đã được gửi và backend đã thực thi nó. Với một cuộc tấn công đổi quyền, kẻ tấn công không cần đọc response chút nào; họ chỉ cần thao tác xảy ra, và nó đã xảy ra. Nói cách khác CORS bảo vệ **dữ liệu** khỏi bị đọc liên nguồn, còn chống CSRF bảo vệ **thao tác** khỏi bị gọi liên nguồn. Đội frontend đã cấu hình đúng một cơ chế và tắt đúng cơ chế còn lại, và hai cơ chế đó không thay thế nhau được. Tôi sẽ thêm một chi tiết cơ học để câu trả lời trọn vẹn: trình duyệt chỉ gửi request thăm dò bằng OPTIONS với một số dạng request, và nó **bỏ qua** bước đó với những request đơn giản dùng header cơ bản — nên với đúng những request kiểu ấy, không có thời điểm nào để CORS can thiệp trước khi backend thực thi. Xử lý theo thứ tự. Việc đầu tiên là bật lại chống CSRF: nó chặn đúng cơ chế đang bị khai thác, và nó không cần ngừng cổng nên thoả ràng buộc — giao diện ở miền riêng sẽ hỏng phần gọi ghi cho tới khi đội frontend gắn token, nhưng đó là đánh đổi tôi chấp nhận và nói rõ, vì phương án còn lại là để lỗ hổng mở. Gần như đồng thời, tôi vô hiệu hoá mọi phiên đang hoạt động của bốn nhân viên đó: phiên bị lợi dụng vẫn còn giá trị, nên chừng nào nó còn sống thì cuộc tấn công còn lặp được. Rồi hạ quyền 47 tài khoản, và tách riêng 6 tài khoản đã tải dữ liệu khách hàng thành một luồng điều tra riêng — đối chiếu nhật ký tải để biết chính xác dữ liệu nào đã ra ngoài, vì đó là câu hỏi mà bộ phận pháp chế và khách hàng cần, và nó không được trả lời bằng suy đoán. Về cách sửa đúng cho kiến trúc mới, bật lại CSRF chỉ là biện pháp chặn máu. Khi frontend đã tách ra miền riêng thì token CSRF không còn là cơ chế phù hợp, vì client không do server render nên không có chỗ tự nhiên nhận token. Hướng đúng là chuyển sang xác thực bằng token mang trong header: khi ấy không còn thông tin nào tự được gửi kèm, nên CSRF không còn là điều kiện phải bù — ta loại bỏ lớp vấn đề thay vì thêm một lớp kiểm tra. Tôi sẽ nêu rõ cái giá kèm theo, rằng rủi ro dịch sang XSS và token phải được lưu cẩn thận, chứ không trình bày nó như lời giải miễn phí. Bài học tổ chức là phần tôi muốn ghi lại rõ nhất: ba tuần trước có một thay đổi mang nhãn \"để API chạy được\", và nó đã tắt một lớp bảo mật mà không ai định giá việc tắt đó. Nên tôi đề nghị một cổng chặn cụ thể: mọi thay đổi làm yếu một cấu hình bảo mật — tắt CSRF, mở rộng nguồn CORS, hạ yêu cầu xác thực — phải được đánh dấu và được một người thứ hai duyệt, với lý do viết ra. Không phải để làm chậm đội, mà vì đây đúng là loại thay đổi mà người thực hiện không có đủ bối cảnh để tự đánh giá hậu quả.",
    redFlags: [
      "Kết luận bốn nhân viên đó có lỗi hoặc nói dối",
      "Coi log là sai",
      "Thắt chặt cấu hình CORS và coi đó là biện pháp chống CSRF",
      "Bật lại CSRF mà không vô hiệu hoá các phiên đang bị lợi dụng",
      "Hạ quyền 47 tài khoản rồi coi là xong, không điều tra 6 tài khoản đã tải dữ liệu",
      "Đề nghị chuyển sang token mà không nêu rủi ro dịch sang XSS",
    ],
    probes: [
      "Vì sao kẻ tấn công không cần đọc response vẫn đạt mục đích?",
      "Vì sao phải vô hiệu hoá phiên đang hoạt động, chứ không chỉ đổi mật khẩu?",
      "Cổng chặn cho \"thay đổi làm yếu cấu hình bảo mật\" của bạn trông như thế nào?",
    ],
    refs: ["springsec-09", "springsec-10"],
  },

  // ===== ssec-oauth (springsec-iq17–springsec-iq20) =====
  {
    id: "springsec-iq17",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 1,
    minutes: 6,
    question: "Kể bốn thực thể trong một hệ thống OAuth 2 và trách nhiệm của từng cái. OpenID Connect thêm gì vào đó?",
    mustCover: [
      "**Người dùng** — người sử dụng ứng dụng; không phải hệ thống OAuth 2 nào cũng có người dùng",
      "**Client** — ứng dụng gọi tới backend để lấy dữ liệu hay chức năng; có thể là web, di động, hoặc một dịch vụ backend",
      "**Máy chủ tài nguyên** — backend phân quyền và phục vụ các request từ client",
      "**Máy chủ uỷ quyền** — nơi xác thực người dùng và **giữ an toàn thông tin đăng nhập**",
      "Luồng: client xin token từ máy chủ uỷ quyền, rồi gắn token khi gọi máy chủ tài nguyên",
      "Điểm cốt lõi của OAuth 2 là **tách trách nhiệm xác thực** ra khỏi nơi giữ tài nguyên",
      "Nhờ vậy nhiều ứng dụng dùng chung một nơi xác thực, và không ứng dụng nào phải tự giữ mật khẩu",
      "Access token có **thời gian sống ngắn**, thường vài phút — nên token bị lộ chỉ dùng được trong khoảng ngắn",
      "OAuth 2 là đặc tả về **uỷ quyền**; OpenID Connect là một giao thức dựng trên nó, bổ sung phần **định danh** người dùng",
    ],
    model: "Bốn thực thể, và tôi thấy cách nhớ chắc nhất là gắn mỗi cái với một trách nhiệm duy nhất. Người dùng là người sử dụng ứng dụng — và điều đáng biết là không phải hệ thống OAuth 2 nào cũng có người dùng; khi client là một dịch vụ backend gọi một dịch vụ backend khác thì không có ai đăng nhập cả. Client là ứng dụng gọi tới backend để lấy dữ liệu hoặc chức năng; nó có thể là ứng dụng web, ứng dụng di động, ứng dụng máy tính, hay chính một dịch vụ backend. Máy chủ tài nguyên là backend giữ tài nguyên: nó nhận request từ client, phân quyền và phục vụ. Máy chủ uỷ quyền là nơi xác thực người dùng và giữ an toàn thông tin đăng nhập. Luồng thì ngắn: người dùng làm một thao tác trên client; client biết nó không gọi được backend mà không có token, nên nó xin máy chủ uỷ quyền cấp một access token; nó gắn token vào request tới máy chủ tài nguyên; máy chủ tài nguyên kiểm token, và nếu hợp lệ thì phục vụ. Điều tôi muốn nhấn là **vì sao** kiến trúc này có giá trị, chứ không chỉ nó gồm những gì: cốt lõi của OAuth 2 là tách trách nhiệm xác thực ra khỏi nơi giữ tài nguyên. Hệ quả rất thực dụng — nhiều ứng dụng dùng chung một nơi xác thực nên người dùng chỉ đăng nhập một lần; không ứng dụng nào trong số đó phải tự lưu và tự bảo vệ mật khẩu; và người dùng không phải tạo thêm một bộ thông tin đăng nhập cho mỗi ứng dụng nhỏ họ dùng. Một tính chất của token cũng nên nói kèm: access token có thời gian sống ngắn, thường vài phút, rồi client phải xin cái mới. Đó là một lựa chọn có chủ ý — token là thứ được truyền qua mạng nên nó có nguy cơ bị chặn bắt, và thời gian sống ngắn giới hạn thiệt hại của việc bị lộ. Về OpenID Connect, sự phân biệt khá gọn: OAuth 2 là đặc tả về uỷ quyền — nó nói về việc client được phép làm gì. Nó không nói cho ta biết người dùng **là ai** theo một cách chuẩn hoá. OpenID Connect là một giao thức dựng trên OAuth 2 và bổ sung đúng phần đó, tức phần định danh người dùng. Nên khi ta cần đăng nhập bằng một tài khoản có sẵn và cần biết thông tin về người đăng nhập, thứ ta dùng thực chất là OpenID Connect.",
    redFlags: [
      "Gộp máy chủ uỷ quyền và máy chủ tài nguyên thành một vai trò",
      "Nói OAuth 2 là một giao thức xác thực",
      "Cho rằng luôn phải có người dùng trong hệ thống OAuth 2",
      "Không biết access token có thời gian sống ngắn",
    ],
    probes: [
      "Khi nào hệ thống OAuth 2 không có người dùng?",
      "Vì sao access token sống ngắn, và điều đó tạo ra nhu cầu gì?",
      "OpenID Connect bổ sung chính xác điều gì mà OAuth 2 không có?",
    ],
    refs: ["springsec-13"],
  },
  {
    id: "springsec-iq18",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Máy chủ uỷ quyền nhúng các claim này vào JWT:
// { "sub": "u-8841", "roles": ["USER"], "tenant": "acme", "plan": "pro" }

@RestController
public class OrderController {

    @GetMapping("/orders")
    public List<Order> orders(@AuthenticationPrincipal Jwt jwt) {
        String tenant = jwt.getClaimAsString("tenant");
        return repo.findByTenant(tenant);
    }

    @PostMapping("/orders/{id}/refund")
    public void refund(@PathVariable long id,
                       @AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");   // (1)
        if (roles.contains("USER")) {                             // (2)
            refundService.refund(id);
        }
    }

    @GetMapping("/admin/stats")
    public Stats stats(@AuthenticationPrincipal Jwt jwt) {
        if ("pro".equals(jwt.getClaimAsString("plan"))) {         // (3)
            return statsService.compute();
        }
        throw new AccessDeniedException("cần gói pro");
    }
}

// Sự việc: một người dùng đã bị thu hồi toàn bộ quyền lúc 09:12
// vẫn hoàn tiền thành công một đơn hàng lúc 09:19.`,
    },
    question: "Vì sao người dùng đã bị thu hồi quyền vẫn hoàn tiền được? Và nêu các vấn đề khác trong cách controller này dùng JWT.",
    mustCover: [
      "Nguyên nhân sự việc: JWT là token **tự chứa**, nên máy chủ tài nguyên kiểm nó bằng **chữ ký**, không gọi lại máy chủ uỷ quyền",
      "Vì thế quyền đã thu hồi ở máy chủ uỷ quyền **không** có hiệu lực với token đã cấp",
      "Token vẫn hợp lệ tới khi **hết hạn** — 7 phút là hoàn toàn nằm trong thời gian sống thông thường",
      "Đây không phải lỗi cài đặt mà là **tính chất** của token tự chứa: không thu hồi được ngay",
      "Muốn thu hồi ngay thì phải dùng **thẩm định token** (introspection), tức máy chủ tài nguyên hỏi máy chủ uỷ quyền mỗi lần",
      "Hoặc thu hẹp thời gian sống của token để cửa sổ rủi ro nhỏ lại — giảm nhẹ, không giải quyết",
      "Vấn đề thứ hai, dòng (2): kiểm quyền viết tay trong controller bằng `if` thay vì dùng phân quyền của framework",
      "Nên quy tắc rải trong mã, không ai đọc được tổng thể, và thiếu một `if` là một lỗ hổng im lặng",
      "Vấn đề thứ ba, dòng (3): dùng claim `plan` — một thuộc tính **thương mại** — làm điều kiện phân quyền",
      "Gói dịch vụ thay đổi theo hợp đồng, nên nó không nên nằm cùng chỗ với quyền hạn",
      "Vấn đề thứ tư, dòng (1): không xử lý trường hợp claim **thiếu** — `roles` thiếu thì `getClaimAsStringList` cho `null` và ném lỗi",
      "Và `refund` không kiểm chủ sở hữu hay khách thuê của đơn hàng — một người dùng hoàn được tiền đơn của khách thuê khác",
    ],
    model: "Câu hỏi chính có một câu trả lời rõ và nó không phải lỗi của ai: JWT là token tự chứa, nên máy chủ tài nguyên xác thực nó bằng cách kiểm chữ ký chứ không gọi lại máy chủ uỷ quyền. Nghĩa là quyền đã bị thu hồi lúc 09:12 chỉ tồn tại ở máy chủ uỷ quyền; token đã cấp trước đó vẫn mang các claim cũ và vẫn có chữ ký hợp lệ, nên nó vẫn được chấp nhận tới khi hết hạn. Bảy phút hoàn toàn nằm trong thời gian sống thông thường của một access token, nên đây là hành vi đúng theo thiết kế, không phải khiếm khuyết cài đặt. Tôi nói rõ điều đó vì cách phản ứng phụ thuộc vào việc hiểu đúng: không có tham số nào chỉnh để token tự chứa trở nên thu hồi được. Nếu nghiệp vụ đòi thu hồi có hiệu lực ngay — và với thao tác hoàn tiền thì tôi cho là đòi — thì phải đổi cơ chế xác thực token sang **thẩm định**: máy chủ tài nguyên gửi token sang máy chủ uỷ quyền để hỏi nó còn hiệu lực không và lấy thông tin kèm theo. Cái giá là một lời gọi mạng cho mỗi request, cộng với việc máy chủ tài nguyên trở thành một client của máy chủ uỷ quyền nên nó cần thông tin đăng nhập riêng. Một lựa chọn nhẹ hơn là thu hẹp thời gian sống của token, nhưng tôi sẽ gọi đúng tên nó: giảm nhẹ cửa sổ rủi ro, không giải quyết. Còn một cách thực dụng mà tôi thường chọn khi không muốn thẩm định cho mọi endpoint: dùng JWT cho phần lớn request, và thẩm định **chỉ cho những thao tác nhạy cảm** như hoàn tiền — đổi chi phí mạng ở đúng chỗ nó xứng đáng. Các vấn đề khác trong controller này thì đáng nói vì chúng thuộc cùng một họ: nó lấy quyết định bảo mật từ nội dung token bằng mã viết tay. Dòng (2) kiểm quyền bằng một `if` trong controller, nên quy tắc phân quyền rải rác trong mã nghiệp vụ, không ai đọc được bức tranh tổng thể, và một endpoint mới thiếu `if` là một lỗ hổng không ai thấy — đó chính xác là việc mà phân quyền của framework làm được với một biểu thức khai báo. Dòng (3) tệ theo cách khác: nó dùng claim `plan` làm điều kiện phân quyền. Gói dịch vụ là một thuộc tính thương mại, nó đổi theo hợp đồng và do bộ phận khác quyết định; trộn nó vào cùng chỗ với quyền hạn nghĩa là một thay đổi hợp đồng có thể lặng lẽ mở hoặc đóng quyền truy cập. Dòng (1) là một khiếm khuyết nhỏ hơn nhưng sẽ gây sự cố: nó không xử lý trường hợp claim thiếu, nên một token do một máy chủ uỷ quyền khác cấp, hay một cấu hình đổi tên claim, sẽ làm endpoint ném lỗi thay vì từ chối gọn gàng. Và điều tôi muốn nêu cuối cùng vì nó là lỗ hổng nghiêm trọng nhất trong cả đoạn mã: `refund` không kiểm gì về **đơn hàng** — không chủ sở hữu, không khách thuê. Endpoint `/orders` thì lọc theo khách thuê rất cẩn thận, nhưng `refund` nhận một id bất kỳ, nên một người dùng hoàn được tiền cho đơn hàng của khách thuê khác chỉ bằng cách đổi con số. Đó là cùng lớp lỗi với sự việc đang điều tra nhưng có hậu quả tài chính trực tiếp, nên tôi sẽ đưa nó lên đầu danh sách sửa.",
    redFlags: [
      "Kết luận máy chủ uỷ quyền thu hồi quyền không thành công",
      "Đề nghị lưu danh sách token đã thu hồi ở máy chủ tài nguyên mà không nói tới việc nó phải được đồng bộ",
      "Chỉ giảm thời gian sống của token và coi đó là lời giải",
      "Giữ các `if` kiểm quyền trong controller",
      "Không phát hiện `refund` thiếu kiểm chủ sở hữu và khách thuê",
      "Coi claim `plan` là một quyền hạn hợp lệ",
    ],
    probes: [
      "Bạn dùng thẩm định cho mọi endpoint hay chỉ một số, và căn cứ vào đâu?",
      "Claim thiếu thì endpoint nên hành xử thế nào?",
      "Vì sao trộn thuộc tính thương mại vào phân quyền là rủi ro?",
    ],
    refs: ["springsec-15", "springsec-13"],
  },
  {
    id: "springsec-iq19",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 3,
    minutes: 11,
    question: "Máy chủ tài nguyên của bạn xác thực token bằng JWT hay bằng thẩm định? Lập luận theo yêu cầu thu hồi và độ nhạy của dữ liệu.",
    tradeoffs: [
      {
        option: "JWT — kiểm chữ ký tại chỗ",
        when: "Mặc định cho phần lớn hệ thống. Không có lời gọi mạng nào cho mỗi request, nên máy chủ tài nguyên vẫn phục vụ được khi máy chủ uỷ quyền gặp sự cố. Đổi lại: **không thu hồi được ngay**, và dữ liệu trong token ai lấy được token cũng đọc được.",
      },
      {
        option: "Thẩm định — hỏi máy chủ uỷ quyền mỗi lần",
        when: "Khi cần thu hồi có hiệu lực ngay, hoặc khi token là loại đục. Đổi lại: một lời gọi mạng cho mỗi request, máy chủ uỷ quyền trở thành **điểm phụ thuộc bắt buộc**, và máy chủ tài nguyên cần thông tin đăng nhập riêng.",
      },
      {
        option: "Kết hợp — JWT làm mặc định, thẩm định cho thao tác nhạy cảm",
        when: "Khi chỉ một phần nhỏ thao tác thực sự đòi thu hồi tức thì — chuyển tiền, hoàn tiền, thay đổi quyền. Trả chi phí mạng đúng chỗ nó xứng đáng.",
      },
    ],
    mustCover: [
      "Trục thứ nhất: thu hồi **có cần hiệu lực ngay** hay chấp nhận trễ tới khi token hết hạn?",
      "JWT tự chứa nên máy chủ tài nguyên không hỏi ai — đó là ưu điểm về hiệu năng và cũng là giới hạn về thu hồi",
      "Thu hồi với JWT chỉ có hiệu lực khi token hết hạn, nên **thời gian sống token trở thành một quyết định bảo mật**",
      "Trục thứ hai: dữ liệu trong token — JWT mang dữ liệu qua mạng, ai lấy được token đều **đọc được** nội dung",
      "Nên không nhồi dữ liệu nhạy cảm vào token; nếu buộc phải mang dữ liệu nhạy cảm thì token đục cộng thẩm định là phương án đúng",
      "Trục thứ ba, về vận hành: thẩm định làm máy chủ uỷ quyền thành **điểm phụ thuộc bắt buộc** trên mọi request",
      "Nếu nó chậm thì máy chủ tài nguyên chậm theo; nếu nó chết thì máy chủ tài nguyên **không phục vụ được gì**",
      "Với JWT thì máy chủ uỷ quyền chết chỉ làm **không cấp được token mới**, các token đang dùng vẫn hoạt động",
      "Đó là một khác biệt lớn về khả năng chịu lỗi và tôi luôn nêu nó ra",
      "Với JWT cần cấu hình **URI khoá công khai**: máy chủ uỷ quyền ký bằng khoá bí mật, máy chủ tài nguyên kiểm bằng khoá công khai",
      "Lựa chọn của tôi: JWT làm mặc định, thẩm định cho nhóm nhỏ thao tác đòi thu hồi tức thì",
      "Và với JWT phải có sẵn một đường thu hồi khẩn cấp — vì \"chờ token hết hạn\" không phải câu trả lời trong một sự cố",
    ],
    model: "Tôi phân định bằng ba trục, và chúng cho câu trả lời khác nhau nên đáng tách rời. Trục thứ nhất là thu hồi: thu hồi có cần hiệu lực ngay hay chấp nhận trễ? Với JWT, máy chủ tài nguyên kiểm chữ ký tại chỗ và không hỏi ai, nên việc thu hồi ở máy chủ uỷ quyền chỉ có hiệu lực khi token hết hạn. Hệ quả đáng nói là thời gian sống của token biến thành một quyết định bảo mật chứ không phải một tham số tiện dụng: đặt 15 phút nghĩa là chấp nhận rằng một tài khoản bị khoá vẫn hoạt động tới 15 phút. Với phần lớn hệ thống thì điều đó chấp nhận được; với thao tác chuyển tiền thì không. Trục thứ hai là dữ liệu trong token. JWT mang dữ liệu và client truyền nó qua mạng, nên bất kỳ ai lấy được token đều đọc được nội dung bên trong — không phải sửa được, chữ ký lo việc đó, nhưng đọc được. Nên tôi tránh nhồi dữ liệu nhạy cảm vào token; và nếu hệ thống buộc phải mang nhiều dữ liệu hoặc dữ liệu nhạy cảm thì token đục cộng với thẩm định là phương án đúng, vì khi đó token chỉ là một cái chìa và dữ liệu không rời khỏi máy chủ uỷ quyền. Trục thứ ba là vận hành, và tôi thấy nó bị bỏ quên nhiều nhất trong các cuộc thảo luận về chủ đề này. Thẩm định nghĩa là mỗi request tới máy chủ tài nguyên sinh ra một lời gọi tới máy chủ uỷ quyền, nên máy chủ uỷ quyền trở thành điểm phụ thuộc bắt buộc: nó chậm thì ta chậm theo, và nó chết thì ta **không phục vụ được gì**. Với JWT thì máy chủ uỷ quyền chết chỉ có nghĩa là không cấp được token mới; mọi token đang lưu hành vẫn hoạt động, nên hệ thống suy giảm dần chứ không sập. Đó là một khác biệt lớn về khả năng chịu lỗi và nó thường là lập luận quyết định. Về cài đặt, với JWT tôi cần cấu hình URI khoá công khai mà máy chủ uỷ quyền công bố — nó ký token bằng khoá bí mật, máy chủ tài nguyên kiểm bằng khoá công khai; với thẩm định thì cần URI thẩm định, và thêm một chi tiết dễ quên là máy chủ tài nguyên khi đó tự trở thành một client của máy chủ uỷ quyền nên nó cần thông tin đăng nhập riêng. Lựa chọn của tôi trong hầu hết trường hợp là kết hợp: JWT làm mặc định cho toàn bộ lưu lượng, và thẩm định cho nhóm nhỏ thao tác thực sự đòi thu hồi tức thì — chuyển tiền, hoàn tiền, thay đổi quyền. Cách đó trả chi phí mạng đúng chỗ nó xứng đáng, thay vì trả cho mọi request hay không trả ở đâu cả. Và dù chọn gì, với JWT tôi luôn dựng sẵn một đường thu hồi khẩn cấp — chẳng hạn một danh sách chặn được các máy chủ tài nguyên tham khảo, hoặc một khả năng đổi khoá ký để vô hiệu hoá toàn bộ token đang lưu hành. Lý do đơn giản: trong một sự cố thật, \"chờ token hết hạn\" không phải một câu trả lời ta muốn đưa ra.",
    redFlags: [
      "Chọn thẩm định cho mọi endpoint mà không nói tới việc nó tạo điểm phụ thuộc bắt buộc",
      "Chọn JWT mà không nói tới giới hạn thu hồi",
      "Cho rằng JWT bảo mật vì được mã hoá — nó chỉ được ký",
      "Nhồi dữ liệu nhạy cảm vào claim",
      "Không có đường thu hồi khẩn cấp khi dùng JWT",
    ],
    probes: [
      "Máy chủ uỷ quyền chết — mỗi phương án hành xử thế nào?",
      "Bạn đặt thời gian sống token bao nhiêu, và căn cứ vào đâu?",
      "Đường thu hồi khẩn cấp của bạn hoạt động ra sao?",
    ],
    refs: ["springsec-15", "springsec-13"],
  },
  {
    id: "springsec-iq20",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Hệ thống gồm một máy chủ uỷ quyền và 9 máy chủ tài nguyên, dùng JWT. Lúc 02:40, khoá ký của máy chủ uỷ quyền được luân chuyển theo lịch định kỳ. Từ 02:41, **8 trong 9** máy chủ tài nguyên trả 401 cho mọi request. Máy chủ tài nguyên thứ 9 hoạt động bình thường. Đội vận hành khôi phục khoá cũ lúc 03:25 và mọi thứ trở lại bình thường.",
      scale: "Ngừng phục vụ 45 phút lúc thấp điểm, khoảng 14.000 request lỗi. Đây là lần luân chuyển khoá thứ ba; hai lần trước không có sự cố. Máy chủ tài nguyên thứ 9 được một đội khác viết và triển khai 4 tháng trước.",
      constraints: "Khoá ký vẫn phải được luân chuyển — đó là yêu cầu tuân thủ, mỗi 90 ngày. Không được khôi phục khoá cũ lần sau. Phải giải thích được vì sao máy chủ tài nguyên thứ 9 không bị ảnh hưởng, và vì sao hai lần luân chuyển trước không có sự cố.",
      },
    question: "\"8 trong 9\" và \"hai lần trước không sao\" nói gì? Nêu chẩn đoán, và thiết kế để luân chuyển khoá không gây ngừng phục vụ.",
    mustCover: [
      "Máy chủ tài nguyên kiểm JWT bằng **khoá công khai** lấy từ URI mà máy chủ uỷ quyền công bố",
      "Chẩn đoán: 8 máy chủ đó **giữ khoá công khai trong bộ đệm** và không lấy lại sau khi khoá đổi",
      "Nên chúng kiểm token mới bằng khoá cũ → chữ ký không khớp → 401 cho mọi request",
      "Máy chủ thứ 9 không bị ảnh hưởng vì nó lấy lại khoá theo **định danh khoá trong header token**, hoặc bộ đệm của nó hết hạn nhanh",
      "\"Hai lần trước không sao\" là manh mối mạnh: rất có thể hai lần đó **đi kèm một lần triển khai**, nên tiến trình khởi động lại và lấy khoá mới",
      "Nghĩa là hai lần thành công trước là **tình cờ**, không phải bằng chứng quy trình đúng — đó là điều quan trọng nhất phải nói ra",
      "Khôi phục khoá cũ đã chữa được triệu chứng, nhưng nó xác nhận chẩn đoán chứ không sửa gì",
      "Thiết kế đúng, phần cốt lõi: luân chuyển khoá phải có **giai đoạn hai khoá cùng hiệu lực**",
      "Máy chủ uỷ quyền công bố cả khoá cũ và khoá mới, ký token mới bằng khoá mới, và chỉ bỏ khoá cũ sau khi mọi token cũ đã hết hạn",
      "Máy chủ tài nguyên phải chọn khoá theo **định danh khoá trong header của token**, không giả định chỉ có một khoá",
      "Và phải lấy lại tập khoá khi gặp một định danh khoá lạ, thay vì từ chối ngay",
      "Kiểm chứng trước khi làm thật: diễn tập luân chuyển ở môi trường thử **mà không triển khai gì**, để không lặp lại sự tình cờ",
      "Bài học rộng hơn: một quy trình chỉ thành công khi tình cờ đi kèm việc khác thì nó chưa được kiểm chứng",
    ],
    model: "Bắt đầu từ cơ chế: máy chủ tài nguyên xác thực JWT bằng khoá công khai, lấy từ một URI mà máy chủ uỷ quyền công bố. Máy chủ uỷ quyền ký bằng khoá bí mật, máy chủ tài nguyên kiểm bằng khoá công khai tương ứng. Nếu khoá ký đổi mà máy chủ tài nguyên vẫn dùng khoá công khai cũ, thì mọi token mới đều không khớp chữ ký, và cách duy nhất nó có thể phản ứng là từ chối — 401 cho mọi request, đúng như quan sát. Nên chẩn đoán của tôi là 8 máy chủ đó giữ khoá công khai trong bộ đệm và không lấy lại sau khi khoá thay đổi. Việc khôi phục khoá cũ chữa được triệu chứng lúc 03:25 cũng là bằng chứng ủng hộ: nó làm các khoá trong bộ đệm khớp lại. Nhưng tôi nói rõ rằng đó là xác nhận chẩn đoán, không phải một cách sửa — và với yêu cầu tuân thủ 90 ngày thì nó cũng không dùng lại được. Hai chi tiết còn lại của đề bài đều là manh mối và tôi thấy chúng là phần giá trị nhất. Máy chủ thứ 9 không bị ảnh hưởng, và nó do một đội khác viết gần đây — giải thích khả dĩ nhất là nó chọn khoá theo định danh khoá nằm trong header của token và lấy lại tập khoá khi gặp một định danh lạ, hoặc đơn giản là bộ đệm khoá của nó có thời gian sống ngắn. Dù là cách nào, nó cho tôi một mẫu hình đúng đang tồn tại ngay trong hệ thống, nên tôi không phải thiết kế từ đầu mà đi xem nó làm gì rồi áp cho tám cái còn lại. Chi tiết \"hai lần luân chuyển trước không có sự cố\" thì tôi đọc theo hướng ngược với trực giác thông thường: nó không phải bằng chứng rằng quy trình từng đúng. Giả thuyết của tôi là hai lần đó trùng với một đợt triển khai — luân chuyển khoá theo lịch quý hay được xếp cạnh việc phát hành — nên các tiến trình khởi động lại và lấy khoá mới một cách tình cờ. Việc này kiểm chứng được: đối chiếu thời điểm hai lần luân chuyển trước với lịch triển khai. Nếu đúng thì kết luận phải nói thẳng ra, vì nó là bài học quan trọng nhất của sự cố: quy trình này chưa bao giờ đúng, nó chỉ chưa bao giờ bị thử một mình. Về thiết kế để luân chuyển khoá không gây ngừng phục vụ, phần cốt lõi là bỏ giả định rằng có đúng một khoá tại một thời điểm. Luân chuyển phải có một giai đoạn hai khoá cùng hiệu lực: máy chủ uỷ quyền công bố cả khoá cũ và khoá mới trong tập khoá công khai, bắt đầu ký token mới bằng khoá mới, và chỉ loại khoá cũ khỏi tập sau khi mọi token được ký bằng nó đã hết hạn — với token sống vài phút thì giai đoạn đó rất ngắn, nhưng nó phải tồn tại. Phía máy chủ tài nguyên, mỗi JWT mang định danh khoá trong header, nên nó phải dùng đúng định danh đó để chọn khoá thay vì giả định chỉ có một; và khi gặp một định danh không có trong bộ đệm, nó phải lấy lại tập khoá **rồi mới** quyết định, chứ không từ chối ngay. Hai thay đổi đó cùng nhau làm việc luân chuyển trở thành vô hại, và chúng cũng loại luôn nhu cầu phối hợp thời điểm giữa đội hạ tầng và chín đội ứng dụng. Cuối cùng, về cách tôi kiểm chứng trước lần luân chuyển tới, và điều này trực tiếp trả lời bài học vừa rút ra: diễn tập một lần luân chuyển ở môi trường thử mà **không** triển khai gì cùng lúc, rồi quan sát chín máy chủ tài nguyên có tiếp tục phục vụ hay không. Nếu tôi chỉ sửa mã và chờ tới lần luân chuyển thật, tôi lại không biết mình đã sửa xong hay chỉ gặp may thêm một lần nữa.",
    redFlags: [
      "Khôi phục khoá cũ như biện pháp lâu dài, hoặc đề nghị ngừng luân chuyển",
      "Coi hai lần luân chuyển trước là bằng chứng quy trình đúng",
      "Đề nghị khởi động lại toàn bộ máy chủ tài nguyên sau mỗi lần luân chuyển như lời giải chính",
      "Không xét vì sao máy chủ thứ 9 không bị ảnh hưởng",
      "Tắt việc kiểm chữ ký để \"tránh vấn đề khoá\"",
      "Sửa mã rồi chờ lần luân chuyển thật để biết kết quả",
    ],
    probes: [
      "Giai đoạn hai khoá cùng hiệu lực cần kéo dài bao lâu, suy từ đâu?",
      "Máy chủ tài nguyên gặp định danh khoá lạ thì nên làm gì, và làm sao để việc đó không bị lợi dụng?",
      "Bạn kiểm chứng giả thuyết về hai lần luân chuyển trước bằng dữ liệu nào?",
    ],
    refs: ["springsec-15", "springsec-13"],
  },

  // ===== ssec-reactive (springsec-iq21–springsec-iq24) =====
  {
    id: "springsec-iq21",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 1,
    minutes: 5,
    question: "Cấu hình bảo mật cho ứng dụng phản ứng khác gì so với ứng dụng thường? Nêu những chỗ khác tên và chỗ khác bản chất.",
    mustCover: [
      "Khác tên: `UserDetailsService` → **`ReactiveUserDetailsService`**, cùng mục đích là chỉ cách lấy thông tin người dùng",
      "Khác tên: `SecurityFilterChain` → **`SecurityWebFilterChain`**, dựng bằng **`ServerHttpSecurity`**",
      "Khác tên: `authorizeHttpRequests()` → **`authorizeExchange()`**",
      "Có bảo mật phương thức bản phản ứng, tương tự bảo mật phương thức toàn cục",
      "Khác bản chất quan trọng nhất: mô hình **một thread cho một request không còn đúng**",
      "Nên `SecurityContextHolder` dựa trên `ThreadLocal` **không** áp dụng được — danh tính không đi theo thread",
      "Trong ứng dụng phản ứng, ngữ cảnh bảo mật đi theo **chuỗi xử lý**, không theo thread",
      "Hệ quả thực dụng: mọi mẹo về `MODE_INHERITABLETHREADLOCAL` hay sao context sang thread khác đều không còn nghĩa",
      "Máy chủ mặc định cũng khác: Spring Boot cấu hình **Netty** thay vì Tomcat",
    ],
    model: "Tôi chia câu trả lời làm hai phần vì phần khác tên thì dễ và phần khác bản chất mới đáng nói. Về tên: `UserDetailsService` trở thành `ReactiveUserDetailsService`, mục đích y nguyên — nó chỉ cho ứng dụng biết cách lấy thông tin người dùng. Cấu hình phân quyền endpoint dựng một `SecurityWebFilterChain` bằng builder `ServerHttpSecurity` thay vì `SecurityFilterChain` với `HttpSecurity`. Tên các phương thức phần lớn giống nhau, với một số chỗ đổi theo thuật ngữ phản ứng — rõ nhất là `authorizeHttpRequests()` thành `authorizeExchange()`. Và có bản phản ứng của bảo mật phương thức, cho phép đặt quy tắc ở bất kỳ lớp nào, tương tự bảo mật phương thức toàn cục bên phía không phản ứng. Nếu chỉ có vậy thì đây là bài tập đổi tên. Nhưng có một khác biệt về bản chất và nó là thứ tôi muốn nói kỹ: trong ứng dụng servlet truyền thống, mỗi request được gắn với một thread, và toàn bộ cách quản lý `SecurityContext` dựa trên điều đó — `SecurityContextHolder` mặc định giữ context trong một `ThreadLocal`, nên \"người dùng hiện tại\" nghĩa là \"người dùng của thread này\". Mô hình phản ứng không có tính chất đó: một request được xử lý bởi nhiều thread khác nhau theo từng chặng, và một thread phục vụ nhiều request. Nên `ThreadLocal` không còn là chỗ đúng để giữ danh tính, và trong ứng dụng phản ứng ngữ cảnh bảo mật đi theo **chuỗi xử lý** chứ không theo thread. Hệ quả thực dụng khá lớn và tôi thấy nó là chỗ người ta mang kiến thức cũ sang rồi mắc lỗi: toàn bộ những mẹo bên phía servlet — đổi chiến lược sang `MODE_INHERITABLETHREADLOCAL`, bọc tác vụ để sao context sang thread khác — đều không còn nghĩa gì ở đây. Đọc danh tính bằng cách gọi một phương thức tĩnh trên `SecurityContextHolder` cũng vậy; nó phải được lấy từ chuỗi xử lý. Một chi tiết nhỏ nữa nhưng hữu ích khi đọc log lúc khởi động: Spring Boot không cấu hình Tomcat cho ứng dụng phản ứng mà cấu hình Netty.",
    redFlags: [
      "Cho rằng chỉ cần đổi tên các phương thức là xong",
      "Dùng `SecurityContextHolder` theo kiểu `ThreadLocal` trong ứng dụng phản ứng",
      "Nói mô hình một thread một request vẫn đúng",
      "Không biết `authorizeExchange()` là tên tương đương",
    ],
    probes: [
      "Vì sao `ThreadLocal` không phù hợp trong mô hình phản ứng?",
      "Bạn đọc người dùng hiện tại trong một chuỗi phản ứng bằng cách nào?",
      "Ứng dụng phản ứng có còn khái niệm chuỗi bộ lọc không?",
    ],
    refs: ["springsec-17", "springsec-06"],
  },
  {
    id: "springsec-iq22",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@SpringBootTest
@AutoConfigureMockMvc
class InvoiceControllerTests {

    @Autowired MockMvc mvc;

    @Test
    @WithMockUser(username = "mary", roles = "USER")        // (1)
    void userCanReadOwnInvoice() throws Exception {
        mvc.perform(get("/api/invoices/1"))
           .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "mary", roles = "USER")
    void userCannotReadOthersInvoice() throws Exception {
        mvc.perform(get("/api/invoices/2"))                 // hoá đơn của john
           .andExpect(status().isOk());                     // (2) test này ĐANG XANH
    }

    @Test
    void adminCanDeleteInvoice() throws Exception {
        mvc.perform(delete("/api/invoices/1")
                .with(user("admin").roles("ADMIN")))
           .andExpect(status().isForbidden());               // (3) cũng đang xanh
    }
}

// Bộ test 128 bài, tất cả đều xanh. Nhưng hai lỗ hổng đã lọt lên môi trường thực tế.`,
    },
    question: "Bộ kiểm thử này xanh mà vẫn để lọt lỗ hổng. Chỉ ra từng vấn đề và viết lại theo cách bắt được lỗi.",
    mustCover: [
      "Vấn đề ở dòng (2): bài kiểm thử **khẳng định hành vi sai** — nó đòi 200 cho việc đọc hoá đơn của người khác",
      "Nên nó xanh đúng như viết, và nó **khoá** lỗ hổng lại: ai sửa cho đúng sẽ làm test đỏ",
      "Đó là dạng nguy hiểm nhất: tên bài kiểm thử nói một điều, khẳng định nói điều trái ngược",
      "Vấn đề ở dòng (3): tên nói quản trị **xoá được**, nhưng khẳng định là **403**",
      "Nó cũng xanh, và nó ghi nhận rằng chức năng của quản trị đang hỏng như thể đó là điều mong đợi",
      "Sửa hai chỗ: khẳng định phải khớp với **yêu cầu**, không khớp với hành vi hiện tại",
      "Vấn đề sâu hơn: `@WithMockUser` chỉ tạo người dùng **giả lập** với vai trò cho trước",
      "Nó không dùng `UserDetailsService` thật, nên nó **không** kiểm được luồng xác thực hay dữ liệu người dùng thật",
      "Nên nó là công cụ đúng cho việc kiểm **phân quyền**, và là công cụ sai để tin rằng xác thực hoạt động",
      "Cách tổ chức đúng: vài bài kiểm thử cho luồng xác thực, rồi nhiều bài cho từng quy tắc phân quyền",
      "Với ứng dụng phản ứng thì thay `MockMvc` bằng **`WebTestClient`**",
      "Và bài học chính: một bộ kiểm thử toàn xanh chỉ chứng minh mã khớp với những gì đã viết ra, không chứng minh nó đúng",
    ],
    model: "Hai vấn đề đầu là cùng một lỗi và nó là lỗi nguy hiểm nhất một bộ kiểm thử có thể mắc: khẳng định được viết theo hành vi **hiện tại** chứ không theo **yêu cầu**. Ở dòng (2), tên bài kiểm thử nói rõ người dùng không được đọc hoá đơn của người khác, nhưng khẳng định lại đòi 200. Nó xanh, đúng như nó được viết. Và tác hại lớn hơn việc không bắt được lỗi: nó **khoá** lỗ hổng lại, vì người nào sửa cho đúng sẽ thấy test đỏ và có thể kết luận rằng mình đã làm sai. Dòng (3) cùng dạng nhưng ở chiều ngược: tên nói quản trị xoá được hoá đơn, khẳng định lại là 403. Nó ghi nhận một chức năng đang hỏng như thể đó là điều mong đợi, nên chẳng ai phát hiện rằng quản trị không xoá được gì. Tôi đoán cả hai được viết theo thói quen chạy test, xem nó đỏ, rồi sửa khẳng định cho khớp kết quả thực tế — đó là cách nhanh nhất để có một bộ kiểm thử toàn xanh mà không kiểm được gì. Sửa thì đơn giản về mã nhưng cần nói rõ nguyên tắc: khẳng định phải khớp với yêu cầu. Việc đọc hoá đơn của người khác phải trả 404 — tôi chọn 404 thay vì 403 để không tiết lộ rằng id đó tồn tại — và việc quản trị xoá hoá đơn phải trả thành công. Cả hai bài sẽ đỏ ngay, và đó chính là giá trị: hai bài đỏ đó là hai lỗ hổng đang có trong môi trường thực tế. Có một vấn đề sâu hơn trong cách bộ kiểm thử này được xây dựng. `@WithMockUser` tạo một người dùng giả lập với vai trò ta khai; nó không đi qua `UserDetailsService` thật, không đi qua `PasswordEncoder`, không chạm vào dữ liệu người dùng thật. Điều đó khiến nó là công cụ rất tốt cho việc kiểm **phân quyền** — nhanh, và ta khai được chính xác vai trò cần thử — nhưng nó hoàn toàn không nói gì về việc luồng **xác thực** có hoạt động không. Nếu cả 128 bài đều dùng người dùng giả lập thì bộ kiểm thử này chưa từng xác thực ai, và một khiếm khuyết trong `UserDetailsService` hay trong dữ liệu người dùng sẽ đi qua nó mà không bị chạm. Cách tổ chức tôi dùng là tách hai nhóm: một số ít bài kiểm thử luồng xác thực thật từ đầu đến cuối, rồi nhiều bài kiểm phân quyền cho từng endpoint và từng phương thức bằng người dùng giả lập. Số kịch bản xác thực vốn ít hơn số quy tắc phân quyền rất nhiều, nên cách chia này vừa đúng về phạm vi vừa giữ thời gian chạy thấp. Và nếu đây là ứng dụng phản ứng thì `MockMvc` không phải công cụ đúng — bản tương đương là `WebTestClient`. Bài học tôi muốn ghi lại từ trường hợp này: một bộ kiểm thử toàn xanh chỉ chứng minh mã khớp với những gì đã được viết ra trong các khẳng định. Nó không chứng minh mã đúng, và khi các khẳng định được sao từ hành vi hiện tại thì nó không chứng minh gì cả.",
    redFlags: [
      "Xem 128 bài xanh là bằng chứng cấu hình bảo mật đúng",
      "Sửa khẳng định theo kết quả chạy thực tế để test xanh lại",
      "Tin rằng `@WithMockUser` kiểm được cả luồng xác thực",
      "Trả 403 cho hoá đơn không thuộc về người gọi mà không xét việc tiết lộ id tồn tại",
      "Dùng `MockMvc` cho ứng dụng phản ứng",
    ],
    probes: [
      "Vì sao một bài kiểm thử khẳng định sai còn tệ hơn không có bài nào?",
      "Bạn kiểm luồng xác thực thật bằng cách nào, và bao nhiêu bài là đủ?",
      "Bạn phát hiện những bài kiểm thử kiểu này trong một bộ 128 bài ra sao?",
    ],
    refs: ["springsec-18"],
  },
  {
    id: "springsec-iq23",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 3,
    minutes: 10,
    question: "Bạn kiểm thử cấu hình bảo mật ở tầng nào: người dùng giả lập, luồng xác thực đầy đủ, hay bảo mật cấp phương thức?",
    tradeoffs: [
      {
        option: "Người dùng giả lập, kiểm theo endpoint",
        when: "Nơi phần lớn công sức nên đổ vào. Số quy tắc phân quyền rất lớn, và mỗi bài chạy nhanh vì bỏ qua xác thực. Nhưng nó **không** nói gì về việc xác thực có hoạt động.",
      },
      {
        option: "Luồng xác thực đầy đủ",
        when: "Cần, nhưng chỉ vài bài. Số kịch bản xác thực ít hơn hẳn số quy tắc phân quyền, và mỗi bài đắt hơn. Đây là chỗ duy nhất kiểm được `UserDetailsService`, `PasswordEncoder` và dữ liệu người dùng thật.",
      },
      {
        option: "Bảo mật cấp phương thức",
        when: "Khi quy tắc nằm ở tầng nghiệp vụ và phụ thuộc tham số hay kết quả — kiểm nó ở tầng endpoint thì ta không phân biệt được quy tắc nào đã từ chối.",
      },
    ],
    mustCover: [
      "Nguyên tắc phân bổ: **tách kiểm phân quyền khỏi kiểm xác thực** và đầu tư khác nhau cho hai loại",
      "Số quy tắc phân quyền lớn, nên chúng cần nhiều bài, và mỗi bài phải nhanh — dùng người dùng giả lập",
      "Số kịch bản xác thực nhỏ, nên vài bài đầy đủ là đủ, và chúng đắt hơn nên không nên nhân lên",
      "Cách chia đó vừa đúng về phạm vi kiểm, vừa giữ thời gian chạy của toàn bộ bộ kiểm thử thấp",
      "Nhưng người dùng giả lập có một điểm mù phải nói rõ: nó dùng dữ liệu **ta khai trong bài kiểm thử**",
      "Nên khiếm khuyết nằm trong **dữ liệu thật** — bản ghi cũ, chuỗi băm sai định dạng — không bài nào thấy",
      "Vì thế với những bất biến về dữ liệu, kiểm thử không phải công cụ đúng; phải kiểm ở di trú hoặc lúc khởi động",
      "Bảo mật cấp phương thức cần được kiểm **tại phương thức**, không chỉ qua endpoint",
      "Vì qua endpoint thì một 403 không cho biết quy tắc nào đã từ chối, nên bài kiểm thử không định vị được lỗi",
      "Và với quy tắc phụ thuộc quyền sở hữu, phải có bài kiểm thử **chéo**: người dùng A truy cập dữ liệu của B",
      "Đó là lớp bài kiểm thử rẻ nhất và bị bỏ sót thường xuyên nhất",
    ],
    model: "Nguyên tắc tôi dùng để phân bổ công sức là tách hai loại quy tắc ra và đầu tư khác nhau cho từng loại. Quy tắc phân quyền thì rất nhiều — mỗi endpoint, mỗi method HTTP, mỗi vai trò là một trường hợp — nên chúng cần số lượng bài kiểm thử lớn, và vì số lượng lớn thì mỗi bài phải nhanh. Người dùng giả lập là công cụ đúng cho việc đó: nó bỏ qua toàn bộ bước xác thực, cho tôi khai chính xác vai trò cần thử, và chạy rất nhanh. Ngược lại, số kịch bản xác thực ít hơn hẳn — đăng nhập đúng, sai mật khẩu, tài khoản bị khoá, tài khoản hết hạn — nên vài bài đầy đủ là đủ, và vì mỗi bài đắt hơn thì càng không nên nhân chúng lên cho từng endpoint. Cách chia này vừa đúng về phạm vi vừa giữ thời gian chạy thấp, và nó là lý do tôi không thấy \"kiểm mọi thứ qua luồng đầy đủ\" là lựa chọn tốt dù nghe có vẻ chắc chắn hơn. Nhưng tôi muốn nêu rõ điểm mù của hướng người dùng giả lập, vì nó là chỗ tôi từng thấy lỗ hổng lọt qua: người dùng giả lập dùng dữ liệu ta khai ngay trong bài kiểm thử, nên không bài nào chạm vào dữ liệu người dùng thật. Một khiếm khuyết nằm trong dữ liệu — một bản ghi cũ từ đợt di trú, một chuỗi băm sai định dạng, một người dùng không có quyền hạn nào — sẽ đi qua toàn bộ bộ kiểm thử mà không bị phát hiện. Đây là giới hạn của việc kiểm thử mã khi vấn đề nằm ở dữ liệu, không phải chuyện viết thêm bài. Nên với những bất biến về dữ liệu, tôi không dùng kiểm thử mà kiểm ở cuối mỗi lần di trú và kiểm lại lúc ứng dụng khởi động. Về bảo mật cấp phương thức, tôi kiểm nó tại chính phương thức chứ không chỉ qua endpoint. Lý do thực dụng: nếu tôi chỉ gọi endpoint và nhận 403 thì tôi không biết quy tắc nào đã từ chối — quy tắc ở endpoint, hay quy tắc ở phương thức, hay điều kiện quyền sở hữu — nên bài kiểm thử báo có vấn đề mà không định vị được. Kiểm tại phương thức cho tôi câu trả lời chính xác, và nó cũng bắt được trường hợp quy tắc ở phương thức không được áp vì lời gọi nội bộ không đi qua proxy. Còn một lớp bài kiểm thử mà tôi coi là quan trọng nhất trên mỗi đơn vị công sức: bài kiểm thử **chéo** — người dùng A truy cập dữ liệu của người dùng B phải không nhận được gì. Nó rẻ, viết trong vài dòng, và nó bắt đúng lớp lỗ hổng hay gây rò rỉ dữ liệu nhất trong thực tế. Nó cũng là lớp bị bỏ sót thường xuyên nhất, vì bài kiểm thử tự nhiên nhất người ta viết là \"người dùng đọc được dữ liệu của mình\", và bài đó xanh dù quy tắc sở hữu hoàn toàn không tồn tại.",
    redFlags: [
      "Dùng luồng xác thực đầy đủ cho mọi bài kiểm thử phân quyền",
      "Chỉ dùng người dùng giả lập và tin rằng xác thực đã được kiểm",
      "Không có bài kiểm thử chéo giữa hai người dùng",
      "Kiểm bảo mật cấp phương thức chỉ qua endpoint",
      "Tin rằng kiểm thử bắt được khiếm khuyết nằm trong dữ liệu",
    ],
    probes: [
      "Bao nhiêu bài cho luồng xác thực là đủ, và chúng bao những kịch bản nào?",
      "Bài kiểm thử chéo của bạn khẳng định status nào, vì sao?",
      "Bất biến về dữ liệu người dùng thì bạn kiểm ở đâu, nếu không phải trong kiểm thử?",
    ],
    refs: ["springsec-18", "springsec-11"],
  },
  {
    id: "springsec-iq24",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ phản ứng mới được viết lại từ một dịch vụ servlet. Sau khi phát hành, đội hỗ trợ báo rằng nhật ký kiểm toán ghi **sai người thực hiện**: khoảng 3% bản ghi gán hành động cho một người dùng khác. Mã ghi kiểm toán được sao nguyên từ dịch vụ cũ và đọc người dùng hiện tại bằng một phương thức tĩnh trên `SecurityContextHolder`.",
      scale: "2,1 triệu bản ghi kiểm toán trong 6 tuần, khoảng 63.000 bản ghi nghi sai. Nhật ký kiểm toán được dùng cho tranh chấp với khách hàng và cho báo cáo tuân thủ. Phân quyền vẫn hoạt động đúng — không có lỗ hổng truy cập nào được báo.",
      constraints: "Không quay lại bản servlet — việc viết lại đã giải một bài toán khả năng chịu tải. Phải xác định được bản ghi nào đáng tin và bản ghi nào không. Phải trả lời được vì sao phân quyền đúng mà kiểm toán sai.",
      },
    question: "Vì sao 3% và vì sao phân quyền vẫn đúng? Nêu chẩn đoán, cách phân loại 2,1 triệu bản ghi, và cách sửa.",
    mustCover: [
      "Chẩn đoán: `SecurityContextHolder` giữ ngữ cảnh trong **`ThreadLocal`**, đúng cho mô hình một thread một request",
      "Mô hình phản ứng **không** có tính chất đó: một request đi qua nhiều thread, một thread phục vụ nhiều request",
      "Nên phương thức tĩnh đó đọc `ThreadLocal` của thread **đang chạy**, chứ không phải của request hiện tại",
      "Thread được tái sử dụng, nên nó có thể còn giữ ngữ cảnh của một request **khác** — đó là nguồn của 3%",
      "3% thấp vì phần lớn thời điểm `ThreadLocal` rỗng hoặc tình cờ đúng; nó là một cuộc đua, nên tỉ lệ phụ thuộc tải",
      "Cảnh báo: tỉ lệ đó **không ổn định** — tải cao hơn có thể làm nó tăng, nên 3% không phải giới hạn",
      "Vì sao phân quyền đúng: framework **không** lấy danh tính từ `ThreadLocal` mà từ **chuỗi xử lý**",
      "Nên phần bảo mật hoạt động đúng; chỉ mã tự viết đọc sai chỗ — đó là lý do sự cố im lặng suốt 6 tuần",
      "Sửa: lấy người dùng từ chuỗi xử lý phản ứng, hoặc **truyền danh tính làm tham số** vào hàm ghi kiểm toán",
      "Tôi ưa cách truyền tham số: nó khiến không thể viết mã sai, thay vì phải nhớ dùng API đúng",
      "Phân loại 2,1 triệu bản ghi: đối chiếu từng bản ghi kiểm toán với dữ liệu **độc lập** — nhật ký truy cập, chủ sở hữu bản ghi bị tác động",
      "Nhiều hành động chỉ người sở hữu mới thực hiện được, nên quyền sở hữu cho ta kiểm chứng được phần lớn",
      "Phải công bố rõ phần **không xác định được**, thay vì gộp nó vào phần đáng tin",
      "Và với nhật ký dùng cho tuân thủ, phải thông báo cho bộ phận pháp chế — 6 tuần dữ liệu bị nghi ngờ là một sự kiện phải báo",
      "Bài học: mã sao từ mô hình servlet sang mô hình phản ứng phải được rà theo danh sách, vì phần lớn lỗi loại này **im lặng**",
    ],
    model: "Chẩn đoán bắt đầu từ một sự khác biệt về mô hình. `SecurityContextHolder` mặc định giữ ngữ cảnh bảo mật trong một `ThreadLocal`, và điều đó hoàn toàn đúng trong ứng dụng servlet nơi mỗi request được gắn với đúng một thread — \"người dùng của thread này\" chính là \"người dùng của request này\". Mô hình phản ứng không có tính chất đó: một request đi qua nhiều thread theo từng chặng xử lý, và một thread phục vụ nhiều request khác nhau. Nên một phương thức tĩnh đọc `ThreadLocal` sẽ trả về ngữ cảnh của thread **đang chạy**, mà thread đó không có quan hệ nào bảo đảm với request hiện tại. Vì thread được tái sử dụng, nó có thể còn giữ ngữ cảnh của một request khác, và khi đó mã kiểm toán ghi tên người khác. Đó là nguồn của 3%. Con số 3% thấp vì phần lớn thời điểm `ThreadLocal` rỗng — và khi rỗng thì mã có lẽ ghi một giá trị mặc định hoặc bỏ qua — hoặc nó tình cờ chứa đúng người. Tôi muốn nêu rõ một điều về con số đó: nó là kết quả của một cuộc đua, nên nó **không ổn định**. Tải cao hơn, số thread khác đi, hay một thay đổi nhỏ trong chuỗi xử lý đều có thể làm tỉ lệ tăng. Nên 3% là giá trị quan sát được trong sáu tuần vừa rồi, không phải một giới hạn để dựa vào. Câu hỏi thứ hai của đề bài là phần tôi thấy quan trọng nhất: vì sao phân quyền vẫn đúng? Vì framework không lấy danh tính từ `ThreadLocal`. Trong ứng dụng phản ứng, ngữ cảnh bảo mật đi theo chuỗi xử lý, và các cơ chế phân quyền của Spring Security đọc nó từ đó — nên chúng luôn thấy đúng người dùng của request. Chỉ mã tự viết, sao nguyên từ dịch vụ cũ, là đọc sai chỗ. Điều đó giải thích trọn vẹn vì sao sự cố sống được sáu tuần mà không ai phát hiện: không có ai bị từ chối sai, không có lỗ hổng truy cập nào, không có ngoại lệ nào trong log. Hệ thống bảo mật hoạt động đúng, còn hệ thống ghi lại nó thì nói sai — và không có gì đối chiếu hai thứ đó với nhau. Về cách sửa, có hai hướng. Hướng trực tiếp là lấy người dùng từ chuỗi xử lý phản ứng thay vì từ phương thức tĩnh. Nó đúng, nhưng nó đòi mọi người phải nhớ dùng API đúng, và toàn bộ sự cố này bắt nguồn từ việc một người đã không nhớ. Hướng tôi ưa hơn là truyền danh tính làm **tham số** vào hàm ghi kiểm toán: lấy nó một lần ở ranh giới request rồi truyền xuống theo dữ liệu. Khi hàm ghi kiểm toán không thể được gọi mà thiếu người thực hiện, thì lỗi này không thể viết ra được nữa — tôi luôn ưu tiên làm cho mã sai trở nên không viết được, hơn là dựa vào việc nhớ. Phần khó nhất là phân loại 2,1 triệu bản ghi, và tôi sẽ không dùng suy đoán. Tôi đối chiếu từng bản ghi kiểm toán với những dữ liệu **độc lập** với nó: nhật ký truy cập ở tầng vào của hệ thống, thời điểm và phiên, và quan trọng nhất là quyền sở hữu của bản ghi bị tác động. Rất nhiều hành động trong một hệ thống chỉ người sở hữu mới thực hiện được — và phân quyền đã hoạt động đúng, nên nếu bản ghi kiểm toán nói người X sửa dữ liệu mà X không có quyền với dữ liệu đó, thì bản ghi đó sai, và ta biết chắc. Cách này cho tôi phân ba nhóm: xác nhận đúng, xác nhận sai, và không xác định được. Tôi sẽ công bố rõ nhóm thứ ba với đúng số lượng của nó thay vì gộp nó vào nhóm đáng tin — vì nhật ký này được dùng cho tranh chấp với khách hàng, nên một bản ghi \"không xác định được\" mà bị trình bày như bằng chứng là một rủi ro lớn hơn nhiều so với việc thừa nhận khoảng trống. Và vì nhật ký còn dùng cho báo cáo tuân thủ, tôi thông báo cho bộ phận pháp chế ngay: sáu tuần dữ liệu kiểm toán bị nghi ngờ là một sự kiện phải báo, không phải một việc kỹ thuật để sửa im lặng. Bài học tôi muốn ghi lại rộng hơn sự cố này: khi viết lại từ mô hình servlet sang mô hình phản ứng, mã được sao nguyên là chỗ nguy hiểm nhất, vì nó biên dịch được, chạy được, và phần lớn lỗi loại này **im lặng**. Nên tôi sẽ dựng một danh sách rà cụ thể cho lần viết lại tới — mọi chỗ đọc `SecurityContextHolder`, mọi chỗ dùng `ThreadLocal`, mọi chỗ giả định một request một thread — và rà theo danh sách đó thay vì tin vào việc mã \"đã chạy tốt ở dịch vụ cũ\".",
    redFlags: [
      "Kết luận nhật ký kiểm toán bị mất hoặc ghi trùng",
      "Chấp nhận 3% như một tỉ lệ sai số ổn định",
      "Sửa bằng cách đổi chiến lược `SecurityContextHolder`",
      "Coi đây là lỗi nhỏ vì phân quyền vẫn đúng",
      "Suy đoán phạm vi thay vì đối chiếu với dữ liệu độc lập",
      "Gộp nhóm \"không xác định được\" vào nhóm đáng tin",
      "Không thông báo cho pháp chế dù nhật ký dùng cho tuân thủ",
    ],
    probes: [
      "Vì sao tỉ lệ 3% không phải một con số đáng tin để dựa vào?",
      "Quyền sở hữu bản ghi giúp bạn xác nhận được bao nhiêu phần, và phần còn lại thì sao?",
      "Danh sách rà cho lần viết lại tới của bạn gồm những mục nào?",
    ],
    refs: ["springsec-17", "springsec-06"],
  },
];
