// Ngân hàng câu hỏi phỏng vấn Spring Security — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
//
// Nguồn: bản dịch tiếng Việt Spring Security in Action, ấn bản 2
// (Laurentiu Spilca, Manning) — 17 chương (2–18) trong sources/spring-security/.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (springsec-iq01–springsec-iq24) — tiến độ localStorage lưu theo id này.

export const springSecurityInterview = [

  // ===== ssec-auth (springsec-iq01–springsec-iq04) =====
  {
    id: "springsec-iq01",
    field: "spring-security",
    topic: "ssec-auth",
    level: 1,
    minutes: 5,
    question: "Đi theo một request từ lúc nó chạm vào ứng dụng cho tới lúc controller biết được người gọi là ai. Kể tên từng component tham gia và nói rõ mỗi component chịu trách nhiệm gì.",
    mustCover: [
      "Một **authentication filter** trong filter chain chặn request và không tự xác thực — nó chuyển việc cho `AuthenticationManager`",
      "`AuthenticationManager` cũng không xác thực: nó chọn và gọi một `AuthenticationProvider` phù hợp",
      "`AuthenticationProvider` là nơi chứa **logic xác thực thật**, và là điểm mở rộng khi cần một cách xác thực khác",
      "Với username/password, provider ủy quyền tìm user cho **`UserDetailsService`** và so khớp mật khẩu cho **`PasswordEncoder`**",
      "`UserDetails` mô tả user; quyền của user là tập **`GrantedAuthority`**",
      "Xác thực xong, đối tượng `Authentication` được cất vào **`SecurityContext`** cho phần còn lại của request",
      "Thứ tự là cố định: **authentication trước, authorization sau**",
    ],
    model: "Tôi kể theo đường đi của request vì đó là cách nhớ không nhầm. Trước hết, mọi thứ bắt đầu ở filter chain — đây là tầng đầu tiên chặn HTTP request, và một filter xác thực nằm trong chuỗi đó. Filter này không tự làm gì cả, nó chuyển trách nhiệm cho `AuthenticationManager`. Đến lượt mình, `AuthenticationManager` cũng không xác thực; việc của nó là chọn và gọi một `AuthenticationProvider` phù hợp với kiểu `Authentication` đang có. `AuthenticationProvider` mới là nơi chứa logic thật, và đây là điểm mở rộng quan trọng nhất của kiến trúc: khi cần xác thực bằng mã một lần, bằng chứng chỉ, hay bằng một hệ thống ngoài, đó là chỗ ta viết. Với cách xác thực bằng username và mật khẩu, provider dựa vào hai thành phần tách rời có chủ ý: `UserDetailsService` để lấy user, và `PasswordEncoder` để so khớp mật khẩu. Tôi muốn nhấn vào chữ tách rời — `UserDetailsService` được thiết kế rất hẹp, chỉ có đúng một phương thức tìm user theo username, vì đó là hành động duy nhất framework cần để hoàn tất xác thực; nếu ứng dụng còn cần tạo, sửa, xoá user thì đã có `UserDetailsManager` mở rộng từ nó. Bản thân user được biểu diễn bằng `UserDetails`, và những gì user được phép làm là một tập `GrantedAuthority`. Cuối luồng, filter lưu đối tượng `Authentication` vào `SecurityContext`, và từ đó bất kỳ tầng nào cũng đọc được người dùng hiện tại. Chi tiết cuối cùng, và nó giải thích nhiều hành vi gây bối rối: ứng dụng luôn xác thực trước rồi mới phân quyền. Nên một endpoint mở cho tất cả vẫn trả 401 nếu request gửi kèm thông tin đăng nhập sai — nó chết ở bước xác thực, không bao giờ đi tới bước phân quyền.",
    redFlags: [
      "Nói `AuthenticationManager` tự thực hiện logic xác thực",
      "Cho rằng `UserDetailsService` cũng lo việc tạo và sửa user",
      "Không biết filter chain là tầng đầu tiên, nghĩ Spring Security chặn ở tầng controller",
      "Đảo thứ tự: cho rằng phân quyền chạy trước xác thực",
    ],
    probes: [
      "Muốn thêm một bước xác thực bằng mã một lần thì bạn viết ở component nào?",
      "Vì sao `UserDetailsService` và `UserDetailsManager` lại được tách làm hai contract?",
      "Endpoint `permitAll()` mà gửi mật khẩu sai thì nhận status gì, vì sao?",
    ],
    refs: ["springsec-02", "springsec-03", "springsec-06"],
  },
  {
    id: "springsec-iq02",
    field: "spring-security",
    topic: "ssec-auth",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Service
public class DbUserDetailsService implements UserDetailsService {

    private final UserRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User u = repo.findByUsername(username);
        if (u == null) {
            return null;                                   // (1)
        }
        return new SimpleUser(u);
    }
}

@Component
public class DbAuthenticationProvider implements AuthenticationProvider {

    private final DbUserDetailsService users;

    @Override
    public Authentication authenticate(Authentication a) {
        String username = a.getName();
        String password = String.valueOf(a.getCredentials());

        UserDetails u = users.loadUserByUsername(username);

        if (u.getPassword().equals(password)) {            // (2)
            return new UsernamePasswordAuthenticationToken(
                    username, password, u.getAuthorities()); // (3)
        }
        throw new BadCredentialsException("Sai thông tin đăng nhập");
    }

    @Override
    public boolean supports(Class<?> type) {
        return true;                                        // (4)
    }
}`,
    },
    question: "Đoạn code này là một cặp UserDetailsService + AuthenticationProvider tự viết, chạy được trong đường đi thuận lợi. Bốn chỗ đánh số đều có vấn đề — chỉ ra từng chỗ, nói hậu quả cụ thể, và sửa lại.",
    mustCover: [
      "(1) trả `null` là sai contract — phải ném `UsernameNotFoundException`; hệ quả là dòng dưới ném `NullPointerException` thay vì lỗi xác thực có nghĩa",
      "(2) so sánh mật khẩu bằng `equals` nghĩa là mật khẩu đang được lưu ở dạng thô; phải dùng `passwordEncoder.matches(raw, encoded)`",
      "Băm là hàm một chiều nên không thể \"băm lại rồi so chuỗi\" với thuật toán có salt — đó là lý do contract có sẵn `matches`",
      "(3) đối tượng `Authentication` trả về vẫn mang **mật khẩu thô**; nó sẽ nằm trong `SecurityContext` suốt request",
      "(3) nên trả về principal là `UserDetails` và truyền `null` cho credentials",
      "(4) `supports()` trả `true` cho mọi kiểu khiến provider nhận cả những `Authentication` nó không hiểu; phải kiểm đúng kiểu được hỗ trợ",
      "Provider nên **ủy quyền** cho `UserDetailsService` và `PasswordEncoder` thay vì tự xử lý mật khẩu",
    ],
    model: "Tôi đi lần lượt bốn chỗ. Chỗ (1): contract của `loadUserByUsername` không cho phép trả `null` — khi không tìm thấy user thì phải ném `UsernameNotFoundException`. Hậu quả ở đây rất cụ thể và rất khó chẩn đoán: provider gọi xong nhận `null`, rồi dòng ngay dưới gọi `u.getPassword()` và ném `NullPointerException`. Người vận hành nhìn log sẽ thấy một NPE ở tầng bảo mật thay vì một lỗi đăng nhập bình thường, và không biết chuyện gì đã xảy ra. Chỗ (2) là chỗ nặng nhất. Việc so sánh mật khẩu bằng `equals` chỉ đúng khi mật khẩu trong database đang ở dạng thô — nghĩa là cả kho mật khẩu đang nằm trần trong database. Cách sửa là băm khi lưu và dùng `passwordEncoder.matches(password, u.getPassword())` khi kiểm tra. Ở đây tôi muốn nói rõ vì sao contract lại có hai phương thức chứ không một: băm là hàm một chiều, và các thuật toán tử tế đều có salt, nên cùng một mật khẩu băm hai lần cho ra hai chuỗi khác nhau. Vì thế không thể tự băm lại rồi so chuỗi được — phải để chính thuật toán nói \"chuỗi thô này có khớp chuỗi băm kia không\". Chỗ (3): đối tượng trả về nhận `password` làm credentials, nên mật khẩu thô sẽ đi tiếp vào `SecurityContext` và sống đến hết request; bất kỳ chỗ nào log security context ra là mật khẩu rơi vào log. Tôi trả về principal là `UserDetails` và credentials là `null`, vì sau khi xác thực xong thì không ai cần tới mật khẩu nữa. Chỗ (4): `supports()` trả `true` vô điều kiện nghĩa là provider này nhận cả những kiểu `Authentication` nó không hiểu — nếu sau này hệ thống thêm một cơ chế xác thực khác, provider này vẫn nhảy vào xử lý và làm hỏng luồng đó. Nó phải kiểm đúng kiểu mình hỗ trợ. Nhìn tổng thể, cả bốn lỗi có chung một gốc: provider đang tự làm mọi thứ. Thiết kế mà sách nhấn là giữ các trách nhiệm tách rời — provider ủy quyền việc tìm user cho `UserDetailsService`, việc kiểm chứng mật khẩu cho `PasswordEncoder`, và chỉ điều phối hai thứ đó.",
    redFlags: [
      "Chỉ thấy lỗi mật khẩu thô mà bỏ qua ba chỗ còn lại",
      "Sửa (2) thành `passwordEncoder.encode(password).equals(u.getPassword())` — vẫn sai với thuật toán có salt",
      "Cho rằng trả `null` ở (1) là chấp nhận được vì \"provider tự kiểm tra null\"",
      "Không nhận ra mật khẩu thô đi vào `SecurityContext` ở (3)",
    ],
    probes: [
      "Nếu database đang lưu mật khẩu thô của 50.000 user, bạn chuyển sang băm thế nào mà không bắt ai đặt lại mật khẩu?",
      "`supports()` trả `false` thì `AuthenticationManager` làm gì tiếp?",
      "Vì sao contract `PasswordEncoder` phải có cả `encode` lẫn `matches`?",
    ],
    refs: ["springsec-03", "springsec-04", "springsec-06"],
  },
  {
    id: "springsec-iq03",
    field: "spring-security",
    topic: "ssec-auth",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ mới cần nguồn user. Bạn có ba lựa chọn quen thuộc trong Spring Security cho việc này. Chọn một và bảo vệ lựa chọn đó — giả định là một ứng dụng nội bộ, vài nghìn người dùng, đã có sẵn PostgreSQL.",
    tradeoffs: [
      {
        option: "`InMemoryUserDetailsManager`",
        when: "Chỉ dùng cho ví dụ học tập, proof of concept, và các bài test. User nằm trong bộ nhớ ứng dụng nên mất sạch khi khởi động lại và không chia sẻ được giữa các instance. Với tình huống đề bài thì đây là lựa chọn sai, nhưng nên nói ra để cho thấy mình biết ranh giới của nó.",
      },
      {
        option: "`JdbcUserDetailsManager`",
        when: "Đã có database quan hệ và không muốn kéo thêm framework nào vào tầng bảo mật. Lợi thế sách nêu là nó dùng thẳng JDBC nên không khoá ứng dụng vào một ORM. Đổi lại, nó mong đợi một schema nhất định; schema của bạn khác thì phải cấu hình lại các câu truy vấn, và bạn được thêm sẵn cả hành vi tạo/sửa/xoá user mà có thể bạn không cần.",
      },
      {
        option: "`UserDetailsService` tự viết trên repository sẵn có",
        when: "Bảng user đã tồn tại với cấu trúc riêng, hoặc thông tin user phải lấy từ nhiều nguồn (bảng user + bảng phân quyền + một dịch vụ ngoài). Bạn viết đúng một phương thức, kiểm soát hoàn toàn truy vấn, và tái dùng tầng dữ liệu sẵn có. Đổi lại phải tự lo hiệu năng truy vấn và tự ném đúng `UsernameNotFoundException`.",
      },
      {
        option: "`LdapUserDetailsManager`",
        when: "Tổ chức đã có thư mục LDAP hoặc Active Directory là nguồn danh tính chuẩn. Khi đó mọi lựa chọn trên đều sai hướng vì chúng tạo ra nguồn danh tính thứ hai — thứ sẽ lệch với nguồn thật trong vòng vài tháng.",
      },
    ],
    mustCover: [
      "Nêu được rằng lựa chọn phụ thuộc trước hết vào việc **nguồn danh tính thật** của tổ chức nằm ở đâu",
      "`InMemoryUserDetailsManager` bị loại vì mất dữ liệu khi khởi động lại và không dùng chung giữa nhiều instance",
      "Phân biệt `UserDetailsService` (chỉ tìm user) với `UserDetailsManager` (thêm tạo/sửa/xoá) và chọn đúng cái ứng dụng cần",
      "Lợi thế của `JdbcUserDetailsManager` là dùng thẳng JDBC, không khoá ứng dụng vào framework khác",
      "Cái giá của `JdbcUserDetailsManager` là schema mà nó mong đợi",
      "Nêu được một lựa chọn cụ thể kèm lý do, không liệt kê rồi bỏ lửng",
    ],
    model: "Câu hỏi đầu tiên tôi đặt không phải \"dùng class nào\" mà \"nguồn danh tính thật của tổ chức nằm ở đâu\". Nếu công ty đã có LDAP hoặc Active Directory thì mọi lựa chọn dựa trên bảng trong database đều sai hướng, vì chúng tạo ra một nguồn danh tính thứ hai, và hai nguồn danh tính sẽ lệch nhau trong vòng vài tháng — người nghỉ việc bị khoá ở một nơi mà vẫn đăng nhập được ở nơi kia. Giả sử đề bài nói rõ là không có, chỉ có PostgreSQL, thì tôi loại ngay `InMemoryUserDetailsManager`: user nằm trong bộ nhớ, mất khi khởi động lại, và không chia sẻ được giữa các instance. Nó tốt cho test và ví dụ, không tốt cho thứ đang chạy thật. Còn lại hai lựa chọn, và tôi phân biệt bằng một câu hỏi: bảng user đã tồn tại chưa? Nếu đây là dịch vụ hoàn toàn mới và tôi được tự do đặt schema, tôi chọn `JdbcUserDetailsManager`. Lợi thế mà sách nêu rất thực tế: nó dùng thẳng JDBC nên không buộc tầng bảo mật phụ thuộc vào ORM tôi đang dùng, và tôi được sẵn phần quản lý user. Nếu bảng user đã tồn tại với cấu trúc riêng — và ở một ứng dụng nội bộ thì gần như luôn thế — tôi viết `UserDetailsService` của mình. Lý do là cân nhắc về sự khớp: `JdbcUserDetailsManager` mong đợi một schema nhất định, và ép schema sẵn có vào khuôn đó, hoặc cấu hình lại từng câu truy vấn, tốn công hơn là viết một phương thức đọc từ repository đã có. Thêm một cân nhắc về phạm vi: nếu ứng dụng chỉ cần đăng nhập chứ không quản lý user trong chính nó — chẳng hạn user được tạo từ một hệ thống nhân sự khác — thì tôi cố tình chọn `UserDetailsService` chứ không phải `UserDetailsManager`, để không hiện thực những hành vi mà ứng dụng không dùng. Đó cũng chính là lý do hai contract này bị tách đôi. Tôi sẽ chọn phương án tự viết cho tình huống đề bài, và đánh dấu một việc phải làm ngay: đo truy vấn tìm user, vì nó chạy trên mọi request có xác thực.",
    redFlags: [
      "Chọn theo thói quen mà không hỏi nguồn danh tính của tổ chức nằm ở đâu",
      "Không phân biệt được `UserDetailsService` và `UserDetailsManager`",
      "Liệt kê cả ba lựa chọn rồi không chốt phương án nào",
      "Cho rằng `InMemoryUserDetailsManager` dùng được ở production nếu nạp user lúc khởi động",
    ],
    probes: [
      "Ứng dụng chỉ đăng nhập chứ không tạo/sửa user thì bạn hiện thực contract nào, vì sao?",
      "Nếu phải đọc user từ hai nguồn — bảng nội bộ và một API nhân sự — bạn đặt việc gộp đó ở đâu?",
      "Truy vấn tìm user chạy trên mọi request có xác thực; bạn làm gì để nó không thành nút thắt?",
    ],
    refs: ["springsec-03", "springsec-02"],
  },
  {
    id: "springsec-iq04",
    field: "spring-security",
    topic: "ssec-auth",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Sau khi một đội thêm xử lý nền cho tính năng xuất báo cáo, log bắt đầu xuất hiện lỗi rải rác: một số tác vụ nền ném `AuthenticationCredentialsNotFoundException`, số khác ghi tên người thực hiện là rỗng trong bảng nhật ký. Endpoint gọi tác vụ thì vẫn trả 200 bình thường. Lỗi không tái hiện được trên máy lập trình viên, và trên môi trường thật thì lúc có lúc không.",
      scale: "Ứng dụng nội bộ, khoảng 800 người dùng, 4 instance sau load balancer. Tính năng xuất báo cáo được gọi vài trăm lần mỗi ngày; ước tính 30–40% lượt bị lỗi hoặc ghi nhật ký sai.",
      constraints: "Bảng nhật ký dùng cho kiểm toán nội bộ nên các bản ghi thiếu tên người thực hiện phải được truy lại. Không được tắt tính năng xuất báo cáo. Đội chỉ có một cửa sổ phát hành mỗi tuần.",
    },
    question: "Bạn được giao xử lý sự cố này. Trình bày cách bạn khoanh vùng nguyên nhân, cách sửa, và cách bạn ngăn nó tái diễn.",
    mustCover: [
      "Nhận ra triệu chứng chập chờn trỏ tới việc security context không đi cùng sang thread khác",
      "Chiến lược mặc định gắn security context vào thread xử lý request, nên thread mới không thấy nó",
      "Chế độ kế thừa chỉ áp dụng cho **thread do Spring quản lý**; thread tự tạo vẫn trắng tay",
      "Cách sửa đúng là bọc tác vụ bằng `DelegatingSecurityContextRunnable` / `...Callable`, hoặc bọc executor bằng `DelegatingSecurityContextExecutorService`",
      "Giải thích được vì sao lỗi không tái hiện trên máy lập trình viên (khác cấu hình thread pool, tải thấp, pool tái dùng thread còn sót context)",
      "Việc thread pool **tái dùng** thread có thể khiến tác vụ đọc nhầm context của một người dùng khác — đây là lỗ hổng, không chỉ là bug",
      "Kế hoạch truy lại các bản ghi nhật ký thiếu tên người thực hiện",
      "Ngăn tái diễn: một test chạy tác vụ qua executor và khẳng định danh tính được truyền đúng",
    ],
    model: "Điều đầu tiên tôi bám vào là hình dạng của triệu chứng chứ không phải thông báo lỗi: nó chập chờn, và nó bắt đầu đúng lúc có xử lý nền. Hai dấu hiệu đó gộp lại gần như luôn chỉ về một thứ — trạng thái gắn với thread không đi theo sang thread khác. Ở Spring Security, `SecurityContext` mặc định được giữ theo thread xử lý request. Khi endpoint đẩy việc sang một thread khác, thread đó không có context, nên mọi thứ đọc danh tính từ đó đều rỗng: chỗ nào gọi thẳng thì ghi tên rỗng vào nhật ký, chỗ nào đi qua một kiểm tra phân quyền thì ném lỗi thiếu thông tin xác thực. Điều đó cũng khớp với việc endpoint vẫn trả 200: request chính đã xác thực xong xuôi, phần hỏng nằm ở nhánh chạy nền. Để khẳng định trước khi sửa, tôi log id thread cùng với danh tính đọc được ở hai chỗ — trong controller và trong tác vụ nền — trên vài request. Thấy hai id thread khác nhau và danh tính chỉ có ở chỗ đầu là đủ kết luận. Về cách sửa, có một lối đi sai mà tôi muốn nói trước vì nó rất hay được chọn: đổi sang chế độ kế thừa context cho thread con. Nó chỉ áp dụng cho những thread do Spring quản lý; framework không sao chép context sang những thread mà nó không biết tới, nên nếu đội đang tự tạo executor thì đổi chế độ chẳng giải quyết gì, chỉ làm lỗi hiếm đi và khó tìm hơn. Cách đúng là dùng đúng những lớp tiện ích sinh ra cho việc này: bọc tác vụ bằng `DelegatingSecurityContextRunnable` hoặc `DelegatingSecurityContextCallable`, hoặc gọn hơn, bọc chính executor bằng `DelegatingSecurityContextExecutorService` để mọi tác vụ nộp vào đều mang context theo. Tôi chọn bọc executor, vì bọc từng tác vụ thì người viết tác vụ tiếp theo sẽ quên. Còn một điều tôi muốn nêu rõ với đội, vì nó biến chuyện này từ bug thành vấn đề bảo mật: thread pool tái dùng thread. Một thread từng phục vụ người dùng A mà không được dọn context có thể khiến tác vụ của người dùng B đọc ra danh tính của A. Điều đó khớp với chi tiết \"lúc có lúc không\" và giải thích vì sao trên máy lập trình viên, tải thấp và pool khác cấu hình, không ai thấy gì. Nên tôi không chỉ đi tìm bản ghi rỗng, tôi đi tìm cả bản ghi **sai người** — đối chiếu bảng nhật ký với log truy cập của endpoint theo mốc thời gian để phát hiện những lượt mà người ghi nhật ký không phải người gọi. Việc truy lại thì làm theo cùng cách đó: ghép bản ghi nhật ký với request tương ứng theo thời gian và mã báo cáo, điền lại tên, và đánh dấu những bản ghi không ghép được thay vì đoán. Để ngăn tái diễn, tôi thêm một test nộp tác vụ qua executor rồi khẳng định danh tính đọc được bên trong tác vụ đúng bằng danh tính bên ngoài — test này sẽ đỏ ngay nếu ai đó tạo một executor trần. Và tôi bổ sung một ghi chú vào hướng dẫn nội bộ: mọi executor trong ứng dụng phải là bản đã bọc, không có ngoại lệ.",
    redFlags: [
      "Kết luận ngay là lỗi cấu hình phân quyền mà không giải thích được vì sao chập chờn",
      "Sửa bằng cách đổi sang chế độ kế thừa context mà không kiểm xem thread có do Spring quản lý không",
      "Sửa bằng cách truyền tên người dùng qua tham số ở một chỗ, bỏ qua những chỗ khác",
      "Bỏ qua khả năng tác vụ đọc nhầm danh tính người khác do thread pool tái dùng thread",
      "Không có kế hoạch nào cho các bản ghi nhật ký đã sai",
    ],
    probes: [
      "Vì sao lỗi không tái hiện trên máy lập trình viên?",
      "Nếu đội dùng `@Async` của Spring thay vì executor tự tạo thì câu trả lời có khác không?",
      "Bạn viết test thế nào để nó đỏ khi ai đó thêm một executor trần vào tháng sau?",
    ],
    refs: ["springsec-06", "springsec-11"],
  },

  // ===== ssec-filter (springsec-iq05–springsec-iq08) =====
  {
    id: "springsec-iq05",
    field: "spring-security",
    topic: "ssec-filter",
    level: 1,
    minutes: 5,
    question: "Giải thích tầng đầu tiên của kiến trúc Spring Security cho một đồng nghiệp mới. Bạn có thể can thiệp vào nó theo những cách nào, và cách nào có cái bẫy riêng?",
    mustCover: [
      "Tầng đầu tiên chặn HTTP request là một **filter chain** — một chuỗi filter có thứ tự",
      "Bản thân việc xác thực và phân quyền cũng do các filter trong chuỗi này thực hiện",
      "Ba cách can thiệp: thêm filter **trước**, **sau**, hoặc **tại vị trí** của một filter có sẵn",
      "Nhiều filter đặt tại cùng một vị trí thì **thứ tự thực thi giữa chúng là không xác định**",
      "Đặt filter trước hay sau filter xác thực quyết định việc filter đó có đọc được danh tính hay không",
      "Spring Security đã cung cấp sẵn nhiều hiện thực filter, nên nên xem trước khi tự viết",
    ],
    model: "Tôi bắt đầu bằng hình dung: request HTTP không đi thẳng vào controller, nó phải đi qua một chuỗi filter trước đã, và đó chính là chỗ Spring Security sống. Điều này quan trọng vì nhiều người nghĩ framework chặn ở tầng controller — không phải, đến lúc controller chạy thì mọi quyết định về xác thực và phân quyền đã xong từ lâu. Bản thân việc xác thực cũng là một filter trong chuỗi, việc kiểm tra CSRF cũng là một filter, xử lý CORS cũng vậy. Hiểu như thế thì việc tuỳ chỉnh trở nên tự nhiên: muốn thêm hành vi thì thêm filter của mình vào chuỗi. Có ba cách: đặt trước một filter có sẵn, đặt sau nó, hoặc đặt tại vị trí của nó. Việc chọn cách nào không phải chuyện thẩm mỹ mà quyết định filter của tôi nhìn thấy gì. Đặt trước filter xác thực thì lúc filter của tôi chạy, chưa ai biết người gọi là ai — phù hợp cho việc như ghi log request thô hay chặn theo địa chỉ IP. Đặt sau thì tôi đọc được danh tính đã xác thực — phù hợp cho việc ghi nhật ký kiểm toán. Cái bẫy đáng nhớ nhất nằm ở cách thứ ba: nếu có nhiều filter cùng đặt tại một vị trí, thứ tự thực thi giữa chúng là không xác định. Nên đừng bao giờ viết hai filter mà cái này ngầm giả định chạy sau cái kia rồi đặt chung một chỗ; nó sẽ chạy đúng trên máy bạn và sai ở đâu đó khác. Điều cuối tôi sẽ nói với đồng nghiệp mới: trước khi viết filter, xem danh sách filter mà framework đã cho sẵn đã — phần lớn nhu cầu thông thường đã có người làm rồi.",
    redFlags: [
      "Nghĩ Spring Security chặn request ở tầng controller hoặc bằng interceptor của Spring MVC",
      "Không biết rằng nhiều filter cùng vị trí thì thứ tự không xác định",
      "Không thấy sự khác nhau giữa đặt trước và đặt sau filter xác thực",
      "Cho rằng phải tự viết filter cho mọi nhu cầu",
    ],
    probes: [
      "Muốn ghi log tên người dùng của mọi request thì đặt filter ở đâu trong chuỗi?",
      "Làm sao để xem thứ tự filter thật sự của ứng dụng đang chạy?",
      "\"Đặt tại vị trí của\" một filter có nghĩa là thay thế nó không?",
    ],
    refs: ["springsec-05", "springsec-02"],
  },
  {
    id: "springsec-iq06",
    field: "spring-security",
    topic: "ssec-filter",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `// Yêu cầu: gắn một mã truy vết vào mọi request để tra log,
// và ghi lại ai đã gọi endpoint nào.
public class TracingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        String traceId = UUID.randomUUID().toString();
        MDC.put("traceId", traceId);

        Authentication auth = SecurityContextHolder.getContext()
                                                   .getAuthentication();
        log.info("request của user {}", auth.getName());   // (1)

        chain.doFilter(req, res);                           // (2)
    }
}

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http.addFilterBefore(new TracingFilter(),
                             BasicAuthenticationFilter.class);  // (3)
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}`,
    },
    question: "Filter này được viết để gắn mã truy vết và ghi nhật ký người gọi. Nó biên dịch được và chạy được, nhưng có ba vấn đề. Tìm chúng và sửa lại.",
    mustCover: [
      "(3) filter đang được đặt **trước** filter xác thực, nên tại thời điểm nó chạy chưa có ai được xác thực",
      "(1) vì thế `getAuthentication()` trả về `null` (hoặc một danh tính ẩn danh) và dòng log ném `NullPointerException`",
      "Sửa bằng cách chuyển sang `addFilterAfter(...)` nếu muốn đọc danh tính, hoặc tách làm hai filter cho hai việc",
      "(2) `MDC` không được dọn — phải đặt `chain.doFilter` trong `try` và xoá trong `finally`",
      "Thread pool tái dùng thread nên mã truy vết cũ sẽ dính sang request sau nếu không dọn",
      "Nên kế thừa `OncePerRequestFilter` thay vì hiện thực `Filter` trần, để filter không chạy lại khi request được forward",
    ],
    model: "Ba vấn đề, và cái nặng nhất là chỗ (3) kéo theo chỗ (1). Filter đang được đặt **trước** filter xác thực HTTP Basic. Nghĩa là khi nó chạy, chưa ai xác thực gì cả, nên `getAuthentication()` trả về `null` — hoặc một danh tính ẩn danh, tuỳ cấu hình — và dòng log ngay dưới ném `NullPointerException`. Cái khó chịu là lỗi này xảy ra trong filter chain, trước khi bất cứ xử lý lỗi nào của ứng dụng kịp can thiệp, nên client nhận một lỗi 500 trần trụi. Đây chính là minh hoạ cho việc chọn vị trí filter không phải chuyện thẩm mỹ: nó quyết định filter nhìn thấy gì. Cách sửa phụ thuộc vào ý định. Nếu chỉ cần ghi nhật ký người gọi thì chuyển sang `addFilterAfter` để filter chạy sau khi xác thực xong. Nhưng ở đây filter đang làm hai việc có yêu cầu vị trí trái ngược nhau: mã truy vết phải có từ đầu để log của chính quá trình xác thực cũng mang mã đó, còn tên người dùng thì chỉ có sau khi xác thực. Nên lựa chọn tôi thấy sạch hơn là tách làm hai filter — một đặt sớm để gắn mã truy vết, một đặt sau filter xác thực để ghi danh tính. Vấn đề thứ hai ở chỗ (2): `MDC` được đặt nhưng không bao giờ được dọn. Vì thread được tái dùng giữa các request, mã truy vết của request cũ sẽ dính lại và xuất hiện trong log của request sau — đúng loại lỗi khiến việc tra log trở nên còn tệ hơn là không có mã truy vết. Phải bọc `chain.doFilter` trong `try` và gọi `MDC.remove` trong `finally`, để cả khi có exception thì vẫn dọn. Vấn đề thứ ba nằm ở khai báo class: hiện thực `Filter` trần nghĩa là filter có thể chạy nhiều lần cho cùng một request khi request được forward nội bộ — và thế là một request sinh ra hai mã truy vết. Kế thừa `OncePerRequestFilter` là cách framework giải quyết sẵn chuyện này, và đó là lớp cha nên dùng cho hầu hết filter tự viết.",
    redFlags: [
      "Chỉ thấy lỗi `null` mà không chỉ ra gốc là vị trí filter trong chuỗi",
      "Sửa bằng cách thêm kiểm tra `if (auth != null)` rồi coi như xong",
      "Không nhận ra `MDC` bị rò rỉ giữa các request qua thread được tái dùng",
      "Không biết `OncePerRequestFilter` tồn tại hoặc không giải thích được nó giải quyết gì",
    ],
    probes: [
      "Nếu bạn cần cả mã truy vết từ sớm lẫn tên người dùng, bạn bố trí thế nào?",
      "Filter chạy hai lần cho một request xảy ra trong tình huống nào?",
      "Vì sao phải dọn `MDC` trong `finally` chứ không phải sau `doFilter`?",
    ],
    refs: ["springsec-05", "springsec-06"],
  },
  {
    id: "springsec-iq07",
    field: "spring-security",
    topic: "ssec-filter",
    level: 3,
    minutes: 9,
    question: "Hệ thống cần chấp nhận thêm một cách nhận diện người gọi: các dịch vụ nội bộ sẽ gửi một khoá bí mật trong header thay vì đăng nhập. Bạn cài đặt việc này ở đâu trong kiến trúc, và vì sao không phải ở những chỗ còn lại?",
    tradeoffs: [
      {
        option: "Viết một `AuthenticationProvider` mới (kèm một filter mỏng dựng `Authentication` từ header)",
        when: "Lựa chọn mặc định. Logic nhận diện nằm đúng chỗ kiến trúc dành cho nó, nên kết quả đi vào `SecurityContext` như mọi cách xác thực khác và toàn bộ phân quyền hiện có — cả ở endpoint lẫn ở method — hoạt động không cần sửa. Đổi lại phải viết hai mảnh nhỏ thay vì một.",
      },
      {
        option: "Một `Filter` tự viết làm hết: đọc header, tra khoá, rồi tự đặt vào `SecurityContext`",
        when: "Chấp nhận được khi đây là một ngoại lệ thật sự hẹp và tạm thời. Nhanh, một tệp duy nhất. Nhưng logic nhận diện nằm ngoài chỗ kiến trúc dành cho nó, nên cách xác thực thứ ba sau này sẽ lại đẻ ra một filter nữa, và không còn chỗ nào nhìn thấy toàn cảnh.",
      },
      {
        option: "Kiểm khoá trong controller hoặc trong một interceptor của Spring MVC",
        when: "Gần như luôn sai. Đến lúc controller chạy thì các filter bảo mật đã quyết định xong — request không có danh tính hợp lệ đã bị từ chối trước đó. Nghĩa là để cách này hoạt động, bạn buộc phải mở `permitAll()` cho các endpoint liên quan, và thế là mất luôn mọi quy tắc phân quyền của Spring Security trên chính những endpoint nhạy cảm nhất.",
      },
      {
        option: "Không tự làm: dùng OAuth 2 client credentials giữa các dịch vụ",
        when: "Khi số dịch vụ nội bộ còn tăng, hoặc khi cần thu hồi quyền của một dịch vụ mà không phát hành lại tất cả. Khoá tĩnh trong header không có hạn dùng, không thu hồi được lẻ, và thường bị chép vào biến môi trường ở nhiều nơi. Đây là câu trả lời đúng về lâu dài dù tốn công dựng hơn.",
      },
    ],
    mustCover: [
      "Đặt logic nhận diện vào `AuthenticationProvider` — nơi kiến trúc dành cho việc đó",
      "Cần một filter mỏng để dựng đối tượng `Authentication` từ header rồi giao cho `AuthenticationManager`",
      "Lợi ích quyết định: kết quả vào `SecurityContext` nên mọi quy tắc phân quyền hiện có dùng lại được nguyên vẹn",
      "`supports()` phân biệt kiểu `Authentication` nên hai cách xác thực cùng tồn tại được",
      "Giải thích vì sao kiểm trong controller là sai: filter bảo mật đã chạy xong trước controller",
      "Nêu được giới hạn của khoá tĩnh (không hạn dùng, khó thu hồi lẻ) và khi nào nên chuyển sang OAuth 2",
    ],
    model: "Tôi bắt đầu từ nguyên tắc: đây là một cách **xác thực** mới, nên nó phải nằm ở chỗ kiến trúc dành cho việc xác thực. Cụ thể là một `AuthenticationProvider`, cộng thêm một filter mỏng làm đúng một việc — đọc header, dựng một đối tượng `Authentication` chưa xác thực rồi đưa cho `AuthenticationManager`. Manager sẽ chọn provider dựa trên `supports()`, và vì thế cách xác thực bằng khoá này sống song song với cách đăng nhập hiện có mà không cái nào biết tới cái nào. Lý do tôi chọn thế không phải vì nó đúng bài, mà vì một lợi ích rất cụ thể: khi provider trả về, kết quả đi vào `SecurityContext` giống hệt mọi cách xác thực khác. Nghĩa là toàn bộ cấu hình phân quyền đã có — quy tắc ở endpoint, các annotation ở tầng method — chạy y nguyên cho các dịch vụ nội bộ, không phải viết lại dòng nào. Tôi gán cho dịch vụ nội bộ một tập authority riêng và thế là xong. Phương án viết một filter tự làm hết thì nhanh hơn, và tôi không nói nó luôn sai — cho một ngoại lệ hẹp, tạm thời, nó chấp nhận được. Nhưng nó đặt logic nhận diện ra ngoài chỗ dành cho nó, nên khi có cách xác thực thứ ba, người sau lại thêm một filter nữa, và cuối cùng không ai chỉ ra được ứng dụng chấp nhận những cách xác thực nào. Phương án kiểm trong controller thì tôi loại dứt khoát, vì nó hiểu sai thứ tự thi hành. Đến lúc controller chạy thì các filter bảo mật đã quyết định xong từ lâu; request không có danh tính hợp lệ đã bị chặn rồi. Để việc kiểm trong controller có cơ hội chạy, ta buộc phải mở các endpoint đó bằng `permitAll()` — và như thế là tự tay gỡ bỏ mọi quy tắc phân quyền khỏi đúng những endpoint nhạy cảm nhất, đổi lấy một lần kiểm tra thủ công mà người viết endpoint tiếp theo sẽ quên. Điều cuối tôi muốn nêu ngay trong buổi thiết kế, không đợi đến khi hỏng: một khoá bí mật tĩnh trong header không có hạn dùng và không thu hồi lẻ được. Rò một khoá là phải xoay khoá cho tất cả. Nếu số dịch vụ nội bộ còn tăng, tôi đề xuất đi thẳng tới client credentials của OAuth 2 — mỗi dịch vụ một danh tính riêng, token có hạn, thu hồi được từng cái. Tốn công dựng hơn, nhưng là thứ ta sẽ phải làm dù sớm hay muộn.",
    redFlags: [
      "Chọn kiểm khoá trong controller hoặc interceptor mà không thấy vấn đề thứ tự thi hành",
      "Viết filter tự đặt `SecurityContext` mà không biết vì sao `AuthenticationProvider` tồn tại",
      "Không nhận ra lợi ích lớn nhất là dùng lại được toàn bộ cấu hình phân quyền",
      "Không nói gì về vòng đời và việc thu hồi khoá bí mật",
    ],
    probes: [
      "Hai cách xác thực cùng tồn tại thì `AuthenticationManager` chọn provider bằng gì?",
      "Bạn gán quyền cho một dịch vụ nội bộ thế nào để phân biệt với người dùng thật?",
      "Nếu một khoá bị rò, quy trình xoay khoá của bạn là gì?",
    ],
    refs: ["springsec-05", "springsec-06", "springsec-16"],
  },
  {
    id: "springsec-iq08",
    field: "spring-security",
    topic: "ssec-filter",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một API công khai bắt đầu trả 403 rải rác cho những request lẽ ra hợp lệ. Tỉ lệ lỗi khác nhau rõ rệt giữa các instance: một instance gần như không lỗi, một instance lỗi khoảng một phần ba số request. Khởi động lại instance đang lỗi thì tỉ lệ đổi, có khi hết hẳn vài ngày rồi quay lại. Bản phát hành gần nhất có thêm một filter kiểm giới hạn tần suất gọi.",
      scale: "API phục vụ khoảng 2 triệu request mỗi ngày trên 6 instance. Khoảng 4% tổng số request bị ảnh hưởng, tập trung vào hai instance.",
      constraints: "Đây là API mà đối tác bên ngoài gọi, nên không thể yêu cầu họ thử lại. Đội đã quay lui một lần và sự cố biến mất, nhưng tính năng giới hạn tần suất là bắt buộc theo yêu cầu vận hành nên phải đưa lại vào.",
    },
    question: "Sự cố này có một đặc điểm khiến nó khác với lỗi cấu hình thông thường. Hãy nói bạn đọc ra điều gì từ đó, rồi trình bày cách khoanh vùng và sửa.",
    mustCover: [
      "Đặc điểm quyết định: tỉ lệ lỗi **khác nhau giữa các instance** và đổi sau khi khởi động lại — trỏ tới thứ tự thi hành không xác định, không phải cấu hình sai",
      "Cấu hình giống nhau trên mọi instance thì lỗi phụ thuộc instance không thể do giá trị cấu hình",
      "Nguyên nhân: filter mới được đặt **tại cùng vị trí** với một filter có sẵn, mà thứ tự giữa các filter cùng vị trí là không xác định",
      "Hệ quả cụ thể: filter giới hạn tần suất khi chạy trước filter xác thực thì đếm theo một khoá sai (hoặc từ chối trước khi biết người gọi là ai)",
      "Cách khẳng định: in danh sách filter theo thứ tự thật trên từng instance và so sánh",
      "Cách sửa: dùng `addFilterBefore` / `addFilterAfter` để ghim thứ tự thay vì đặt cùng vị trí",
      "Ngăn tái diễn: một test khẳng định thứ tự filter, vì cấu hình đúng trên máy này không bảo đảm đúng ở nơi khác",
    ],
    model: "Đặc điểm tôi bám vào ngay là: cùng một bản build, cùng một cấu hình, nhưng tỉ lệ lỗi khác nhau giữa các instance và đổi sau mỗi lần khởi động lại. Điều đó gần như loại trừ hoàn toàn nhóm nguyên nhân \"cấu hình sai\", vì cấu hình sai thì sai đều ở mọi nơi. Khi hành vi phụ thuộc vào từng lần khởi động, thứ đang khác nhau phải là một thứ được quyết định lúc khởi động và không được định nghĩa chặt. Đặt cạnh chi tiết \"bản phát hành gần nhất có thêm một filter\", tôi nghĩ ngay tới thứ tự filter trong chuỗi. Spring Security cho phép đặt một filter tại cùng vị trí với một filter có sẵn, và khi có nhiều filter ở cùng vị trí thì thứ tự thực thi giữa chúng là không xác định — nó có thể khác nhau giữa các lần khởi động. Đó chính xác là hình dạng triệu chứng đang thấy. Về mặt hậu quả thì rất dễ hình dung: nếu filter giới hạn tần suất chạy **sau** filter xác thực, nó biết người gọi là ai và đếm theo đúng đối tác; nếu nó chạy **trước**, nó chưa biết gì và buộc phải đếm theo một khoá thô hơn — thường là địa chỉ IP. Nhiều đối tác đi chung một cổng NAT là gộp hết vào một bộ đếm, và thế là những request hoàn toàn hợp lệ bị từ chối. Instance nào bốc được thứ tự bất lợi thì lỗi nhiều, instance khác thì không. Để khẳng định trước khi sửa, tôi in ra danh sách filter theo đúng thứ tự thật trên từng instance — bật log gỡ lỗi của Spring Security lúc khởi động là đủ — rồi so sánh hai instance có tỉ lệ lỗi khác nhau. Nếu thứ tự khác nhau thì không cần bàn thêm. Cách sửa thì đơn giản một khi đã biết nguyên nhân: bỏ cách đặt tại vị trí, dùng `addFilterAfter` để ghim filter giới hạn tần suất chạy sau filter xác thực. Thứ tự lúc đó là tất định, và bộ đếm có danh tính thật để đếm. Tôi cũng xem lại chính logic đếm: khi chưa xác thực được thì nên chọn một hành vi rõ ràng và cố ý, chứ không để nó rơi vào một nhánh mặc định nào đó. Về phía đối tác, tôi rà log để lấy danh sách các lượt bị từ chối oan và chủ động báo cho những đối tác bị ảnh hưởng nặng, vì họ không thử lại được. Để ngăn tái diễn, tôi thêm một test khẳng định thứ tự các filter trong chuỗi — lấy chuỗi filter đã dựng và so với thứ tự mong đợi. Loại lỗi này không bao giờ lộ ra trên máy lập trình viên, nên phải có một thứ tự động canh nó. Và tôi ghi lại trong hướng dẫn nội bộ: không đặt filter tại cùng vị trí với filter khác, luôn ghim bằng trước hoặc sau.",
    redFlags: [
      "Đi tìm lỗi trong logic giới hạn tần suất mà không giải thích được vì sao lỗi khác nhau giữa các instance",
      "Kết luận do cấu hình lệch giữa các môi trường dù cùng một bản build",
      "Sửa bằng cách nới ngưỡng giới hạn tần suất cho hết lỗi",
      "Không biết rằng thứ tự giữa các filter cùng vị trí là không xác định",
      "Không có cách nào canh thứ tự filter sau khi sửa",
    ],
    probes: [
      "Bạn xem thứ tự filter thật của một instance đang chạy bằng cách nào?",
      "Nếu filter giới hạn tần suất buộc phải chạy trước xác thực, bạn đếm theo khoá gì?",
      "Test khẳng định thứ tự filter của bạn trông thế nào?",
    ],
    refs: ["springsec-05", "springsec-08"],
  },

  // ===== ssec-authz (springsec-iq09–springsec-iq12) =====
  {
    id: "springsec-iq09",
    field: "spring-security",
    topic: "ssec-authz",
    level: 1,
    minutes: 5,
    question: "Trong Spring Security có hai khái niệm rất hay bị dùng lẫn lộn khi mô tả quyền của người dùng. Phân biệt chúng, và nói xem một endpoint mở cho tất cả có thể trả về 401 trong tình huống nào.",
    mustCover: [
      "Role thực chất **cũng là một authority**, chỉ khác ở chỗ nó mang tiền tố `ROLE_`",
      "`hasRole(\"ADMIN\")` tự thêm tiền tố, nên authority phải được khai là `ROLE_ADMIN`",
      "`hasAuthority(\"ROLE_ADMIN\")` và `hasRole(\"ADMIN\")` là tương đương",
      "Role dùng để mô tả **nhóm người**, authority mịn dùng để mô tả **hành động cụ thể**",
      "Authorization luôn chạy **sau** authentication, không bao giờ trước",
      "Vì thế request kèm credential sai chết ở bước xác thực và không bao giờ chạm tới quy tắc `permitAll()` — trả 401",
      "401 nghĩa là \"không biết bạn là ai\", 403 nghĩa là \"biết rồi nhưng không đủ quyền\"",
    ],
    model: "Hai khái niệm đó là authority và role, và điều quan trọng nhất cần nói ngay là chúng không phải hai cơ chế: role thực chất cũng là một authority, chỉ khác ở chỗ theo quy ước nó mang tiền tố `ROLE_`. Framework biết quy ước đó, nên `hasRole(\"ADMIN\")` sẽ tự thêm tiền tố vào trước khi so khớp. Đây là nguồn gốc của cái bẫy kinh điển: người ta khai authority của user là chuỗi `ADMIN` rồi cấu hình `hasRole(\"ADMIN\")`, và không khớp — vì framework đang đi tìm `ROLE_ADMIN`. Chiều ngược lại cũng sai theo cùng một cách: khai `ROLE_ADMIN` rồi gọi `hasRole(\"ROLE_ADMIN\")` thành ra đi tìm `ROLE_ROLE_ADMIN`. Mẹo nhớ là `hasAuthority` so khớp nguyên văn, còn `hasRole` thêm tiền tố giúp bạn. Về mặt mô hình hoá thì tôi dùng chúng cho hai mục đích khác nhau. Role mô tả nhóm người — quản trị viên, kế toán, khách. Authority mịn mô tả hành động cụ thể — đọc báo cáo, duyệt đơn, xoá bản ghi. Hệ thống nhỏ thì role là đủ; hệ thống mà quyền hạn cắt ngang các nhóm thì nên mô hình theo authority, vì thêm một hành động mới không phải đẻ thêm một role mới. Câu hỏi thứ hai chạm đúng vào một điều nhiều người hiểu sai. `permitAll()` không có nghĩa là \"bỏ qua bảo mật cho endpoint này\". Thứ tự trong Spring Security là cố định: xác thực trước, phân quyền sau. Nếu request gửi kèm thông tin đăng nhập sai, nó chết ngay ở bước xác thực và không bao giờ đi tới bước phân quyền — nên endpoint dù có `permitAll()` vẫn trả 401. Nói cách khác, `permitAll()` chỉ nói \"ai cũng được vào\", nó không nói \"credential sai cũng không sao\". Cách phân biệt hai mã trạng thái tôi dùng là: 401 nghĩa là ứng dụng không biết bạn là ai, 403 nghĩa là nó biết rồi nhưng bạn không đủ quyền.",
    redFlags: [
      "Cho rằng role và authority là hai cơ chế tách biệt trong framework",
      "Không biết `hasRole` tự thêm tiền tố `ROLE_`",
      "Cho rằng `permitAll()` khiến endpoint bỏ qua hoàn toàn Spring Security",
      "Dùng lẫn 401 và 403, hoặc nói 403 khi chưa xác thực",
    ],
    probes: [
      "Khai authority là chuỗi `ADMIN` rồi cấu hình `hasRole(\"ADMIN\")` thì chuyện gì xảy ra?",
      "Khi nào bạn mô hình quyền bằng authority mịn thay vì bằng role?",
      "`denyAll()` dùng cho tình huống nào trong thực tế?",
    ],
    refs: ["springsec-07", "springsec-08"],
  },
  {
    id: "springsec-iq10",
    field: "spring-security",
    topic: "ssec-authz",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@Configuration
public class MethodSecurityConfig {                         // (1)
    // ... không có annotation nào khác ở đây
}

@Service
public class DocumentService {

    private final DocumentRepository repo;
    private final AuditService audit;

    public Document openForCurrentUser(long id) {
        audit.record("mở tài liệu " + id);
        return loadDocument(id);                            // (2)
    }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Document loadDocument(long id) {
        return repo.findById(id).orElseThrow();
    }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Document archiveDocument(long id) {              // (3)
        Document d = repo.findById(id).orElseThrow();
        d.setArchived(true);
        repo.save(d);
        return d;
    }
}`,
    },
    question: "Đoạn code này định bảo vệ tài liệu để mỗi người chỉ xem được tài liệu của mình. Có ba chỗ khiến việc bảo vệ không đạt mục đích. Chỉ ra và sửa.",
    mustCover: [
      "(1) thiếu `@EnableMethodSecurity` — không bật thì các annotation nằm đó mà **không có tác dụng gì**, và không có lỗi nào được báo",
      "(2) đây là lời gọi nội bộ trong cùng class nên không đi qua proxy Spring AOP, quy tắc không được áp",
      "Sửa (2) bằng cách tách `loadDocument` sang một bean khác, hoặc để người gọi bên ngoài gọi thẳng nó",
      "(3) `@PostAuthorize` chạy **sau** khi method đã thực thi, mà method này đã ghi vào database",
      "Việc chặn giá trị trả về ở (3) không hoàn tác được thay đổi đã ghi — tài liệu vẫn bị lưu trữ",
      "`@PostAuthorize` chỉ an toàn với method chỉ đọc; method có tác dụng phụ phải dùng `@PreAuthorize`",
      "Nêu được rằng cả ba lỗi đều **im lặng** — code chạy bình thường, không có dấu hiệu gì",
    ],
    model: "Ba chỗ, và điểm chung đáng sợ của chúng là không chỗ nào báo lỗi cả — code chạy trơn tru, test đường đi thuận lợi xanh, và việc bảo vệ thì không tồn tại. Chỗ (1) là gốc: thiếu `@EnableMethodSecurity`. Method security mặc định bị tắt. Không bật thì mọi annotation `@PreAuthorize`, `@PostAuthorize` trong toàn ứng dụng chỉ là chú thích trang trí — framework không đọc tới chúng, và không có cảnh báo nào cho bạn biết. Đây là loại lỗi hay đi qua được cả code review vì annotation nằm sờ sờ ra đó, nhìn rất yên tâm. Chỗ (2) là cái bẫy proxy. Method security được thi hành qua proxy Spring AOP: bean được bọc, và quy tắc chỉ được kiểm khi lời gọi đi **qua** lớp bọc đó. Ở đây `openForCurrentUser` gọi `loadDocument` bằng lời gọi nội bộ trong cùng một đối tượng, nên nó đi thẳng, không qua proxy, và `@PostAuthorize` không bao giờ chạy. Nghĩa là ai gọi `openForCurrentUser` cũng mở được tài liệu của người khác. Cách sửa là tách `loadDocument` sang một bean riêng để lời gọi phải đi qua proxy — tôi thích cách này hơn là các mẹo tự tiêm chính mình, vì tách ra thì ranh giới rõ và người đọc sau hiểu ngay. Chỗ (3) là lỗi về ngữ nghĩa của annotation. `@PostAuthorize` chạy sau khi method đã thực thi xong, và ở đây method đã kịp ghi vào database trước khi bị kiểm. Framework sẽ chặn giá trị trả về và ném lỗi cho người gọi, nhưng thay đổi đã nằm trong database rồi — tài liệu của người khác đã bị đánh dấu lưu trữ. Người gọi nhận 403 và tin rằng mình đã bị chặn, trong khi hành động đã xảy ra. Nguyên tắc tôi rút ra: `@PostAuthorize` chỉ dùng cho method chỉ đọc, đúng những trường hợp mà ta buộc phải thấy kết quả rồi mới quyết định được. Method có tác dụng phụ thì phải kiểm trước bằng `@PreAuthorize` — ở đây là nạp chủ sở hữu rồi kiểm trước khi chạm vào dữ liệu. Nếu quyết định phụ thuộc vào chính dữ liệu, tôi tách thành hai bước: một method chỉ đọc có `@PostAuthorize`, rồi mới gọi method ghi có `@PreAuthorize`.",
    redFlags: [
      "Chỉ thấy lỗi self-invocation mà bỏ qua việc method security chưa được bật",
      "Cho rằng thiếu `@EnableMethodSecurity` sẽ khiến ứng dụng báo lỗi lúc khởi động",
      "Không thấy vấn đề ở `@PostAuthorize` trên method có ghi dữ liệu",
      "Sửa self-invocation bằng cách bỏ annotation và kiểm tra thủ công trong thân method",
    ],
    probes: [
      "Vì sao lời gọi trong cùng một class lại không kích hoạt kiểm tra?",
      "Nếu quyết định cho phép phụ thuộc vào chính dữ liệu vừa đọc, bạn bố trí hai method thế nào?",
      "Bạn viết test nào để bắt được việc quên bật method security?",
    ],
    refs: ["springsec-11", "springsec-12"],
  },
  {
    id: "springsec-iq11",
    field: "spring-security",
    topic: "ssec-authz",
    level: 3,
    minutes: 10,
    question: "Một endpoint trả về danh sách đơn hàng, nhưng mỗi người chỉ được thấy đơn của chính mình. Có mấy chỗ trong hệ thống đặt được luật đó. Chọn chỗ bạn muốn, và nói rõ bạn từ chối những chỗ kia vì lý do gì.",
    tradeoffs: [
      {
        option: "Lọc ngay trong truy vấn ở tầng dữ liệu",
        when: "Lựa chọn mặc định cho danh sách. Database chỉ trả về đúng phần được phép, nên phân trang đúng, bộ đếm đúng, và khối lượng dữ liệu đi qua mạng đúng bằng cái cần. Đổi lại, luật nằm rải trong các truy vấn nên phải có kỷ luật để không ai viết một truy vấn mới mà quên mất điều kiện.",
      },
      {
        option: "`@PostFilter` trên method trả về danh sách",
        when: "Chỉ hợp khi tập dữ liệu nhỏ, có giới hạn trên rõ ràng và không phân trang. Ưu điểm là luật hiện ngay trên chữ ký method, ai đọc cũng thấy. Với repository của Spring Data thì sách nói thẳng đây là lựa chọn tồi: toàn bộ bản ghi được nạp từ database rồi mới vứt bớt trong bộ nhớ.",
      },
      {
        option: "`@PreAuthorize` kiểm quyền truy cập ở mức method",
        when: "Đúng cho câu hỏi \"có được gọi hay không\", tức là truy cập một đơn hàng cụ thể theo id. Nhưng nó không giải được bài toán danh sách, vì ở đây câu hỏi không phải có được gọi hay không mà là được thấy những phần tử nào.",
      },
      {
        option: "Lọc ở tầng controller hoặc ở giao diện",
        when: "Không bao giờ đủ một mình. Lọc ở giao diện thì dữ liệu đã rời khỏi máy chủ; lọc ở controller thì luật đứng ngoài tầng chứa nghiệp vụ và sẽ bị bỏ sót khi có người gọi thứ hai — một job nền, một endpoint xuất Excel.",
      },
    ],
    mustCover: [
      "Phân biệt hai câu hỏi khác nhau: **có được gọi không** (authorization) và **được thấy phần tử nào** (filtering)",
      "Với danh sách, lọc ở tầng dữ liệu là mặc định vì nó giữ đúng phân trang và bộ đếm",
      "`@PostFilter` nạp toàn bộ bản ghi rồi mới loại bớt trong bộ nhớ — vấn đề hiệu năng thật sự, không phải lý thuyết",
      "`@PostFilter` phá vỡ phân trang: trang 20 phần tử có thể còn 3 sau khi lọc",
      "`@PreAuthorize` phù hợp cho truy cập một bản ghi theo id, không phù hợp cho danh sách",
      "Lọc ở controller hoặc giao diện không đủ vì sẽ có người gọi thứ hai không đi qua đó",
      "Nêu được cách giữ kỷ luật khi luật nằm trong truy vấn (một chỗ dựng điều kiện, test cho từng truy vấn)",
    ],
    model: "Tôi tách bài toán làm hai câu hỏi khác nhau, vì Spring Security cũng có hai công cụ khác nhau cho chúng. Câu hỏi thứ nhất là có được gọi hay không — đó là authorization, và công cụ là `@PreAuthorize`. Câu hỏi thứ hai là được thấy những phần tử nào trong một tập — đó là filtering, và công cụ là `@PreFilter`/`@PostFilter`. Đề bài này là loại thứ hai, nên `@PreAuthorize` bị loại ngay: nó trả lời đúng cho trường hợp lấy một đơn hàng theo id, nhưng với danh sách thì nó chỉ nói được \"anh có quyền xem danh sách\" chứ không nói được danh sách gồm những gì. Còn lại hai ứng viên thật. `@PostFilter` hấp dẫn vì luật hiện ngay trên chữ ký method — ai đọc code cũng thấy, không phải lần vào truy vấn. Nhưng nó có hai vấn đề mà tôi không vượt qua được trong tình huống danh sách. Thứ nhất là hiệu năng, và đây chính là điều sách cảnh báo về việc dùng nó với repository của Spring Data: database trả về toàn bộ bản ghi, rồi ứng dụng vứt bớt trong bộ nhớ. Với bảng đơn hàng thì lượng bị vứt lớn hơn lượng giữ lại rất nhiều lần. Thứ hai, và tôi thấy còn nặng hơn: nó phá vỡ phân trang. Bạn xin 20 bản ghi, database trả 20, lọc xong còn 3 — người dùng thấy một trang gần như rỗng và bộ đếm tổng thì sai hoàn toàn. Không có cách nào vá chuyện đó mà vẫn giữ `@PostFilter`. Nên tôi chọn lọc ngay trong truy vấn: điều kiện chủ sở hữu đi vào câu truy vấn, database chỉ trả đúng phần được phép, phân trang và bộ đếm tự khắc đúng, và lượng dữ liệu đi qua mạng đúng bằng cái cần. Cái giá phải trả là luật không còn hiện trên chữ ký method nữa mà nằm trong các truy vấn, nên tôi phải bù lại bằng kỷ luật: dựng điều kiện chủ sở hữu ở đúng một chỗ dùng chung thay vì chép vào từng truy vấn, và có một test cho mỗi truy vấn trả danh sách, khẳng định nó không trả về bản ghi của người khác. Test đó rẻ và nó bắt được đúng cái lỗi mà cách này dễ mắc — một người viết truy vấn mới và quên điều kiện. Cuối cùng, lọc ở controller hoặc ở giao diện thì tôi không coi là một lựa chọn: sớm muộn sẽ có người gọi thứ hai không đi qua chỗ đó, một job nền hay một endpoint xuất Excel, và luật biến mất mà không ai biết. Tôi vẫn giữ `@PreAuthorize` cho endpoint lấy một đơn theo id — hai công cụ cho hai câu hỏi, không thay nhau được.",
    redFlags: [
      "Chọn `@PostFilter` cho danh sách lớn mà không nói gì tới hiệu năng",
      "Không nhận ra `@PostFilter` phá vỡ phân trang và bộ đếm",
      "Dùng `@PreAuthorize` để giải bài toán lọc danh sách",
      "Cho rằng lọc ở giao diện là đủ vì người dùng không thấy phần còn lại",
      "Không nói gì về cách giữ cho luật không bị quên khi nó nằm trong truy vấn",
    ],
    probes: [
      "`@PreFilter` và `@PostFilter` tham chiếu từng phần tử bằng tên gì trong biểu thức?",
      "Nếu bắt buộc phải dùng `@PostFilter`, bạn xử lý phân trang ra sao?",
      "Có tình huống nào `@PreFilter` là lựa chọn đúng không?",
    ],
    refs: ["springsec-11", "springsec-12", "springsec-07"],
  },
  {
    id: "springsec-iq12",
    field: "spring-security",
    topic: "ssec-authz",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một khách hàng báo rằng khi đổi số trên thanh địa chỉ, họ xem được hoá đơn của công ty khác. Đội kiểm tra code và thấy method lấy hoá đơn có `@PreAuthorize` với biểu thức đúng, được viết từ sáu tháng trước. Giao diện không có lỗi gì và vẫn chỉ hiển thị hoá đơn của chính khách hàng. Trên môi trường kiểm thử, gọi thẳng API bằng tài khoản khác cũng lấy được hoá đơn.",
      scale: "Hệ thống SaaS cho khoảng 400 doanh nghiệp, mỗi doanh nghiệp vài chục người dùng. API hoá đơn được gọi khoảng 50.000 lượt mỗi ngày. Chưa rõ có bao nhiêu lượt truy cập chéo đã thật sự xảy ra.",
      constraints: "Đây là dữ liệu tài chính, có nghĩa vụ báo cáo nếu xác định có rò rỉ thật. Không được để hệ thống ngừng phục vụ. Đội nghi ngờ lỗi đã tồn tại từ lâu nhưng không có cách nào biết chắc.",
    },
    question: "Một quy tắc phân quyền viết đúng nhưng không có hiệu lực. Trình bày cách bạn xác định chính xác vì sao, cách chặn máu ngay, và cách xác định phạm vi thiệt hại đã xảy ra.",
    mustCover: [
      "Nhận ra vấn đề không nằm ở biểu thức mà ở chỗ quy tắc **không được thi hành**",
      "Ba nguyên nhân cần loại trừ theo thứ tự: chưa bật method security, lời gọi nội bộ không qua proxy, hoặc bean không phải bean Spring",
      "Cách kiểm nhanh và dứt điểm: viết một test gọi method với tài khoản không đủ quyền và xem có bị chặn không",
      "Chặn máu trước: thêm điều kiện chủ sở hữu vào chính truy vấn, không chờ sửa xong tầng phân quyền",
      "Sửa gốc: bật method security và/hoặc tách bean để lời gọi đi qua proxy",
      "Xác định phạm vi bằng log truy cập: đối chiếu định danh người gọi với chủ sở hữu của hoá đơn được trả về",
      "Nếu log không đủ để kết luận thì nói rõ là không đủ, thay vì đoán — đây là dữ liệu tài chính có nghĩa vụ báo cáo",
      "Rà soát toàn bộ các annotation phân quyền khác trong ứng dụng, vì nếu chưa bật thì **tất cả** đều đang vô hiệu",
    ],
    model: "Điều đầu tiên tôi tách bạch: biểu thức đúng và quy tắc có hiệu lực là hai chuyện khác nhau. Đội đã kiểm tra chuyện thứ nhất và thấy ổn, nên tôi dành toàn bộ sự chú ý cho chuyện thứ hai — quy tắc này có thật sự được thi hành không. Có ba nguyên nhân làm một annotation phân quyền trở thành vô hiệu mà không báo lỗi, và tôi loại trừ theo thứ tự từ rộng tới hẹp. Rộng nhất: method security chưa được bật. Mặc định nó tắt, và nếu thiếu `@EnableMethodSecurity` thì mọi annotation trong toàn ứng dụng đều chỉ là chú thích — không có cảnh báo, không có lỗi khởi động. Nếu đúng là nguyên nhân này thì phạm vi sự cố rộng hơn hẳn một endpoint, và đó là điều tôi phải biết ngay. Thứ hai: lời gọi nội bộ. Method security chạy qua proxy, nên nếu method có annotation được gọi từ một method khác trong cùng class, lời gọi đi thẳng không qua proxy và quy tắc không chạy. Thứ ba, ít gặp hơn: đối tượng chứa method không phải là bean do Spring quản lý, nên chẳng có proxy nào. Cách phân biệt tôi không đi bằng mắt mà bằng một test: gọi method đó bằng một tài khoản chắc chắn không đủ quyền và xem có bị chặn không. Test đỏ hay xanh cho tôi câu trả lời trong vài phút, và nó ở lại làm hàng rào về sau. Sau đó, chỉ cần nhìn xem annotation khác trong ứng dụng có hoạt động không là tách được nguyên nhân một với hai. Về thứ tự hành động, tôi chặn máu trước khi sửa gốc. Việc chặn máu là thêm điều kiện chủ sở hữu vào chính truy vấn lấy hoá đơn — một thay đổi nhỏ, hiểu được ngay, không phụ thuộc vào việc tầng phân quyền có chạy hay không, và triển khai được trong ngày. Tôi không chờ đến khi hiểu hết mọi thứ mới đóng lỗ hổng. Sau đó mới sửa gốc: bật method security nếu đó là nguyên nhân, hoặc tách bean để lời gọi đi qua proxy. Và nếu nguyên nhân là chưa bật, tôi phải coi việc bật lên là một thay đổi có rủi ro — hàng loạt quy tắc lâu nay ngủ yên sẽ đồng loạt có hiệu lực, và rất có thể vài luồng hợp lệ sẽ bị chặn vì biểu thức viết sai mà lâu nay không ai phát hiện. Nên tôi rà toàn bộ annotation trong ứng dụng trước, chạy bộ test đầy đủ, và phát hành có theo dõi. Phần khó nhất là xác định thiệt hại đã xảy ra. Tôi lấy log truy cập của endpoint hoá đơn và đối chiếu định danh người gọi với chủ sở hữu của hoá đơn được trả về; mọi lượt hai giá trị đó lệch nhau là một lượt truy cập chéo. Nếu log không ghi đủ — chẳng hạn không ghi mã hoá đơn, hoặc chỉ giữ 30 ngày trong khi lỗi đã tồn tại sáu tháng — thì tôi nói thẳng rằng không thể kết luận phạm vi từ dữ liệu hiện có, và đưa ra ước lượng kèm đúng giới hạn của nó. Với dữ liệu tài chính và nghĩa vụ báo cáo, một con số đoán bừa còn tệ hơn là thừa nhận không biết. Cuối cùng, tôi bổ sung log đủ để lần sau trả lời được câu hỏi này, và thêm vào bộ test một nhóm kiểm tra truy cập chéo cho từng tài nguyên thuộc về một khách hàng cụ thể.",
    redFlags: [
      "Đi sửa biểu thức trong annotation dù đã xác định biểu thức đúng",
      "Không nghĩ tới khả năng method security chưa được bật cho toàn ứng dụng",
      "Bật method security ngay trên production mà không rà các quy tắc khác đang ngủ",
      "Sửa gốc trước rồi mới nghĩ tới việc chặn lỗ hổng",
      "Đưa ra con số thiệt hại mà không kiểm xem log có đủ dữ liệu để kết luận không",
    ],
    probes: [
      "Test của bạn để phân biệt \"chưa bật\" với \"lời gọi nội bộ\" trông thế nào?",
      "Bật method security trên một hệ thống đang chạy có rủi ro gì?",
      "Log cần ghi những trường nào để lần sau trả lời được câu hỏi phạm vi?",
    ],
    refs: ["springsec-11", "springsec-07", "springsec-18"],
  },

  // ===== ssec-csrf (springsec-iq13–springsec-iq16) =====
  {
    id: "springsec-iq13",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 1,
    minutes: 5,
    question: "Hai cơ chế hay bị tắt đi cho nhanh là bảo vệ CSRF và cấu hình CORS. Giải thích từng cái bảo vệ chống điều gì, và nói xem điều kiện thật sự để một API cần tới bảo vệ CSRF là gì.",
    mustCover: [
      "CSRF là tấn công lừa trình duyệt của người đã đăng nhập gửi request thay mặt họ tới một ứng dụng khác",
      "Bảo vệ CSRF mặc định **được bật** trong Spring Security, và điểm vào của nó là một filter",
      "Điều kiện cần bảo vệ CSRF không phải \"REST hay không\" mà là trình duyệt có **tự động đính kèm** thông tin xác thực không",
      "API dùng cookie session thì cần; API dùng token trong header `Authorization` thì không, vì trình duyệt không tự gắn header đó",
      "CORS là cơ chế của **trình duyệt**: mặc định trình duyệt cấm gọi chéo nguồn gốc, CORS là cách cho phép có chọn lọc",
      "Vì là quy ước của trình duyệt nên CORS không bảo vệ API khỏi các client không phải trình duyệt",
    ],
    model: "Hai cơ chế này hay bị gộp vào một câu \"tắt đi cho đỡ vướng\", nhưng chúng giải quyết hai chuyện hoàn toàn khác nhau và đều không nên tắt theo quán tính. CSRF là tấn công mà kẻ tấn công lừa trình duyệt của một người đang đăng nhập gửi một request tới ứng dụng của bạn thay mặt họ. Điểm mấu chốt là kẻ tấn công không cần đọc được gì và không cần biết mật khẩu — họ chỉ cần khiến trình duyệt gửi request, còn trình duyệt thì tự động đính kèm cookie phiên vào, và ứng dụng của bạn thấy một request hợp lệ từ người dùng thật. Spring Security bật bảo vệ này mặc định, và nó được thi hành bằng một filter trong chuỗi: request làm thay đổi trạng thái phải mang kèm một token mà kẻ tấn công không đoán được. Điều tôi muốn nói rõ nhất là điều kiện để cần bảo vệ CSRF, vì đây là chỗ hay bị lập luận sai. Người ta hay nói \"API của tôi là REST nên không cần CSRF\". Chữ REST không liên quan gì. Điều kiện thật sự là: trình duyệt có tự động đính kèm thông tin xác thực vào request hay không. Nếu ứng dụng dùng cookie phiên thì có — và API đó cần bảo vệ CSRF dù nó REST đến đâu. Nếu client tự gắn token vào header `Authorization` thì không, vì trình duyệt không tự thêm header đó giúp kẻ tấn công. Nên câu hỏi đúng để tự hỏi là \"cái gì chứng minh danh tính trong request này, và ai gắn nó vào\". CORS thì là chuyện khác hẳn, và tôi thấy nó hay bị hiểu ngược. Mặc định trình duyệt **cấm** một trang ở nguồn gốc này đọc kết quả gọi tới nguồn gốc khác; CORS là cách máy chủ nói \"tôi cho phép nguồn gốc kia\". Tức là nó nới lỏng, không phải siết chặt. Hệ quả thực tế cần nhớ: đây là quy ước của trình duyệt, nên `curl` hay bất kỳ client nào không phải trình duyệt đều bỏ qua nó hoàn toàn. Cấu hình CORS chặt chẽ không bảo vệ API của bạn khỏi ai cả — nó chỉ quyết định trang web nào trong trình duyệt được phép gọi bạn.",
    redFlags: [
      "Nói \"API REST thì không cần CSRF\" mà không nêu điều kiện thật",
      "Cho rằng CORS là một cơ chế bảo vệ API khỏi truy cập trái phép",
      "Không biết bảo vệ CSRF mặc định đã được bật",
      "Lẫn lộn CSRF với XSS",
    ],
    probes: [
      "Một SPA cùng domain dùng cookie phiên thì có cần bảo vệ CSRF không?",
      "Vì sao CSRF hiếm khi nhắm vào request `GET`?",
      "Request preflight `OPTIONS` xuất hiện khi nào?",
    ],
    refs: ["springsec-09", "springsec-10"],
  },
  {
    id: "springsec-iq14",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Configuration
public class WebSecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());                      // (1)
        http.cors(Customizer.withDefaults());
        http.formLogin(Customizer.withDefaults());              // (2)
        http.authorizeHttpRequests(c -> c
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll());
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("*"));                      // (3)
        c.setAllowedMethods(List.of("*"));
        c.setAllowCredentials(true);                            // (4)

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}`,
    },
    question: "Cấu hình này được viết để một giao diện chạy ở tên miền khác gọi được API. Nó có một lỗi bảo mật nghiêm trọng và một chỗ sẽ khiến trình duyệt từ chối thẳng. Chỉ ra cả hai, giải thích cơ chế, và viết lại cho đúng.",
    mustCover: [
      "(1) kết hợp với (2) là lỗ hổng: ứng dụng xác thực bằng phiên qua cookie mà lại tắt bảo vệ CSRF",
      "Trình duyệt tự đính kèm cookie phiên, nên mọi endpoint làm thay đổi trạng thái đều bị tấn công thay mặt người dùng",
      "(3) và (4) mâu thuẫn nhau: đặc tả CORS **cấm** dùng `*` cho nguồn gốc khi cho phép gửi kèm thông tin xác thực",
      "Trình duyệt sẽ từ chối response, nên tính năng gọi chéo nguồn gốc không chạy — lỗi lộ ra ngay lúc chạy",
      "Sửa (3) bằng danh sách nguồn gốc cụ thể thay vì ký tự đại diện",
      "Sửa (1) bằng cách giữ bảo vệ CSRF, hoặc chuyển hẳn sang xác thực bằng token trong header rồi mới tắt được",
      "Nhận xét rằng `setAllowedMethods(List.of(\"*\"))` cũng nên thu hẹp về đúng các method thật sự dùng",
    ],
    model: "Tôi tách hai vấn đề ra vì chúng khác hẳn nhau về mức nghiêm trọng. Lỗ hổng nằm ở sự kết hợp của (1) và (2), và phải nhìn cả hai mới thấy. Dòng (2) bật đăng nhập bằng form, nghĩa là ứng dụng xác thực người dùng bằng phiên và phiên đó được giữ bằng cookie. Dòng (1) tắt bảo vệ CSRF. Ghép lại là đúng kịch bản mà CSRF sinh ra để chống: trình duyệt tự động đính kèm cookie phiên vào mọi request gửi tới tên miền của bạn, kể cả request do một trang khác kích hoạt. Kẻ tấn công dựng một trang bất kỳ, đặt trên đó một form tự gửi tới endpoint đổi mật khẩu hoặc chuyển tiền của bạn, dụ người đang đăng nhập ghé vào — và request đi tới với phiên hợp lệ. Không có token CSRF để chặn, ứng dụng thực hiện hành động đó. Nên với cấu hình này, mọi endpoint làm thay đổi trạng thái đều đang hở. Cách sửa phụ thuộc vào việc muốn giữ kiểu xác thực nào. Nếu giữ đăng nhập bằng form và phiên, thì phải giữ bảo vệ CSRF, và phía giao diện phải đọc token rồi gửi kèm. Nếu muốn giao diện ở tên miền khác gọi API gọn hơn, tôi chuyển sang xác thực bằng token đặt trong header — lúc đó trình duyệt không tự gắn gì nữa, tấn công CSRF không còn đường, và việc tắt bảo vệ CSRF mới có cơ sở. Điều tôi muốn nhấn là thứ tự lập luận: tắt CSRF không phải nguyên nhân, nó là hệ quả của việc chọn cơ chế xác thực. Chọn cơ chế trước, rồi mới nói tới CSRF. Chỗ thứ hai, (3) và (4), thì không phải lỗ hổng mà là một cấu hình tự mâu thuẫn. Đặc tả CORS cấm dùng ký tự đại diện cho nguồn gốc khi đồng thời cho phép gửi kèm thông tin xác thực — nếu cho phép cả hai thì bất kỳ trang nào trên internet cũng đọc được dữ liệu của người đang đăng nhập, nên trình duyệt chặn thẳng. Kết quả thực tế là trình duyệt từ chối response và tính năng gọi chéo nguồn gốc đơn giản là không chạy; đây là loại lỗi lộ ra ngay lần thử đầu tiên. Cách sửa là liệt kê nguồn gốc cụ thể thay cho ký tự đại diện. Nhân tiện tôi cũng thu hẹp danh sách method về đúng những cái thật sự dùng — không phải vì nó nguy hiểm, mà vì một cấu hình nói rõ ý định thì người sau đọc mới biết hệ thống định cho phép cái gì.",
    redFlags: [
      "Chỉ nói \"không nên tắt CSRF\" mà không chỉ ra đăng nhập bằng phiên mới là thứ khiến nó nguy hiểm",
      "Không biết ký tự đại diện và việc cho phép gửi kèm thông tin xác thực loại trừ nhau",
      "Cho rằng cấu hình CORS rộng là lỗ hổng cho mọi loại client",
      "Sửa bằng cách bật lại CSRF mà không nói phía giao diện phải làm gì",
    ],
    probes: [
      "Nếu chuyển sang xác thực bằng token trong header, bạn còn cần bảo vệ CSRF không?",
      "Vì sao đặc tả lại cấm dùng ký tự đại diện cùng với thông tin xác thực?",
      "Cấu hình CORS rộng có làm API dễ bị tấn công bởi một script chạy ngoài trình duyệt không?",
    ],
    refs: ["springsec-09", "springsec-10", "springsec-06"],
  },
  {
    id: "springsec-iq15",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 3,
    minutes: 10,
    question: "Bạn đang chốt cách một giao diện đơn trang giữ trạng thái đăng nhập khi gọi API. Lựa chọn ở bước này kéo theo hệ quả cho cả bảo vệ CSRF lẫn cách triển khai nhiều instance. Trình bày các phương án và chốt một cái.",
    tradeoffs: [
      {
        option: "Cookie phiên + giữ bảo vệ CSRF, giao diện cùng nguồn gốc với API",
        when: "Lựa chọn mặc định khi giao diện và API phục vụ từ cùng một nguồn gốc. Cookie đánh dấu chỉ dành cho HTTP nên script không đọc được, nghĩa là một lỗ hổng chèn script không lấy được phiên. Đổi lại phải xử lý token CSRF ở phía giao diện, và phải giải bài toán lưu token khi chạy nhiều instance.",
      },
      {
        option: "Token trong header `Authorization`, lưu ở bộ nhớ của trang",
        when: "Khi giao diện nằm ở nguồn gốc khác, hoặc khi có cả ứng dụng di động dùng chung API. Trình duyệt không tự đính kèm header nên tấn công CSRF không còn đường, và máy chủ không giữ trạng thái phiên nên thêm instance là chuyện tầm thường. Đổi lại token nằm trong tầm với của script, nên một lỗ hổng chèn script là mất token, và việc thu hồi sớm cần thêm cơ chế.",
      },
      {
        option: "Token lưu trong `localStorage`",
        when: "Tiện nhất để viết và tệ nhất về bảo mật trong ba lựa chọn: token sống qua cả lần đóng tab và bất kỳ script nào chạy trên trang đều đọc được. Chỉ chấp nhận cho công cụ nội bộ có phạm vi rủi ro nhỏ.",
      },
      {
        option: "Cookie phiên + `CsrfTokenRepository` tùy chỉnh",
        when: "Khi đã chọn phiên nhưng chạy nhiều instance sau bộ cân bằng tải không có phiên dính. Thay vì tắt bảo vệ CSRF cho hết lỗi, thay chỗ lưu token sang nơi mọi instance đọc được. Đây là câu trả lời đúng cho tình huống mà người ta hay tắt CSRF nhất.",
      },
    ],
    mustCover: [
      "Nêu được rằng lựa chọn cơ chế giữ đăng nhập **quyết định** việc có cần bảo vệ CSRF hay không",
      "Cookie được trình duyệt tự đính kèm → cần bảo vệ CSRF; header do client tự gắn → không cần",
      "Đánh đổi thật sự là giữa rủi ro CSRF và rủi ro chèn script (token nằm trong tầm với của script)",
      "Cookie đánh dấu chỉ dành cho HTTP thì script không đọc được, đó là ưu thế thật của phương án phiên",
      "Nêu bài toán nhiều instance: phiên và token CSRF phải dùng chung được giữa các instance",
      "Biết rằng có thể thay `CsrfTokenRepository` thay vì tắt bảo vệ CSRF",
      "Chốt một phương án kèm điều kiện, không liệt kê rồi bỏ lửng",
    ],
    model: "Tôi bắt đầu từ chỗ mà nhiều người bỏ qua: câu hỏi \"có cần bảo vệ CSRF không\" không phải là một quyết định độc lập, nó là hệ quả của cách ta giữ trạng thái đăng nhập. Nên tôi quyết định cái kia trước. Có hai họ phương án. Họ thứ nhất là cookie phiên. Ưu điểm lớn nhất, và tôi cho là hay bị đánh giá thấp, là cookie có thể đánh dấu chỉ dành cho HTTP — script trên trang không đọc được nó. Nghĩa là nếu ứng dụng dính một lỗ hổng chèn script, kẻ tấn công vẫn không lấy được phiên mang đi nơi khác. Nhược điểm là vì trình duyệt tự đính kèm cookie, ta rơi thẳng vào vùng CSRF và bắt buộc phải giữ bảo vệ, kèm việc giao diện phải gửi token theo. Họ thứ hai là token đặt trong header. Trình duyệt không tự gắn header giúp ai cả, nên CSRF hết đường — nhưng để gắn được header thì script phải cầm được token, và cái gì script cầm được thì một lỗ hổng chèn script cũng lấy được. Nên đánh đổi thật sự ở đây không phải \"tiện hay không tiện\" mà là đổi rủi ro CSRF lấy rủi ro chèn script. Nói được câu đó thì phần còn lại dễ. Trong họ thứ hai, tôi loại `localStorage`: token sống qua cả lần đóng tab và mọi script đều đọc được, tiện nhất nhưng tệ nhất. Giữ token trong bộ nhớ của trang thì thu hẹp cửa sổ rủi ro đáng kể. Quyết định của tôi phụ thuộc vào một câu hỏi duy nhất: giao diện có cùng nguồn gốc với API không, và có client nào khác ngoài trình duyệt không. Nếu giao diện phục vụ từ cùng nguồn gốc và chỉ có trình duyệt, tôi chọn cookie phiên và giữ nguyên bảo vệ CSRF — vì lợi ích cookie không đọc được bằng script là thật, và cái giá chỉ là một lần dựng luồng token ở giao diện. Nếu có ứng dụng di động dùng chung API, hoặc giao diện nằm ở nguồn gốc khác, tôi chọn token trong header, vì phương án phiên lúc đó kéo theo cả một đống việc về cookie liên nguồn gốc mà không đáng. Còn một việc tôi muốn nêu trước vì nó là lý do phổ biến nhất khiến người ta tắt CSRF: khi chạy nhiều instance sau bộ cân bằng tải không có phiên dính, token CSRF lưu trong phiên của instance này thì instance kia không thấy, và lỗi xuất hiện ngẫu nhiên. Phản ứng quen thuộc là tắt bảo vệ cho hết lỗi. Cách đúng là thay `CsrfTokenRepository` bằng một hiện thực lưu token ở nơi mọi instance đọc được. Giữ được cơ chế bảo vệ, chỉ đổi chỗ cất token.",
    redFlags: [
      "Chọn token trong header chỉ vì \"stateless\" mà không nói gì tới rủi ro chèn script",
      "Chọn `localStorage` mà không nêu nhược điểm",
      "Không liên hệ được lựa chọn cơ chế đăng nhập với nhu cầu bảo vệ CSRF",
      "Giải bài toán nhiều instance bằng cách tắt bảo vệ CSRF",
    ],
    probes: [
      "Cookie đánh dấu chỉ dành cho HTTP bảo vệ khỏi loại tấn công nào, và không bảo vệ khỏi loại nào?",
      "Với nhiều instance và phiên không dính, bạn thay contract nào trong cơ chế CSRF?",
      "Nếu có cả ứng dụng di động lẫn giao diện web thì câu trả lời của bạn đổi thế nào?",
    ],
    refs: ["springsec-09", "springsec-10", "springsec-06"],
  },
  {
    id: "springsec-iq16",
    field: "spring-security",
    topic: "ssec-csrf",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Sau khi phát hành giao diện mới, người dùng báo rằng thao tác lưu biểu mẫu thỉnh thoảng thất bại với lỗi 403, nhưng bấm lại lần hai thì thành công. Lỗi tăng vào giờ cao điểm. Một lập trình viên đã gửi bản vá tắt bảo vệ CSRF cho các đường dẫn bắt đầu bằng `/api`, kèm ghi chú rằng như thế là chuẩn cho REST và chờ được duyệt.",
      scale: "Ứng dụng nội bộ cho khoảng 3.000 nhân viên, 8 instance sau bộ cân bằng tải. Khoảng 6% thao tác lưu bị lỗi vào giờ cao điểm, gần như không có lỗi vào buổi tối.",
      constraints: "Ứng dụng xác thực bằng đăng nhập form và phiên qua cookie; đổi sang cơ chế khác là việc của quý sau, không làm trong tuần này. Bản vá đang chờ duyệt và đội đang chịu áp lực phải cho qua.",
    },
    question: "Bản vá đang chờ duyệt sẽ làm lỗi biến mất. Cho biết bạn duyệt hay không và vì sao, rồi trình bày cách bạn thật sự xử lý sự cố này.",
    mustCover: [
      "Từ chối bản vá: ứng dụng xác thực bằng phiên qua cookie nên tắt bảo vệ CSRF là mở lỗ hổng thật",
      "Chỉ ra lập luận sai trong ghi chú: điều kiện không phải \"REST hay không\" mà là ai đính kèm thông tin xác thực",
      "Đọc đúng triệu chứng: lỗi rải rác, tăng theo tải, thử lại thì được → trỏ tới token không dùng chung được giữa các instance",
      "Token CSRF mặc định lưu trong phiên; nhiều instance không có phiên dính thì instance nhận request không có token để đối chiếu",
      "Cách khẳng định: ghim một người dùng vào một instance và xem lỗi có biến mất không, hoặc đối chiếu log theo instance",
      "Cách sửa đúng: thay `CsrfTokenRepository` sang nơi dùng chung được, hoặc bật phiên dính như biện pháp tạm",
      "Nói rõ rằng bản vá kia làm mất triệu chứng chứ không sửa nguyên nhân, và để lại lỗ hổng",
      "Đề xuất đường dài: chuyển sang token trong header thì mới có cơ sở để bỏ bảo vệ CSRF",
    ],
    model: "Tôi không duyệt bản vá, và lý do không phải là nguyên tắc chung mà là một sự thật cụ thể của hệ thống này: nó xác thực bằng đăng nhập form và giữ phiên bằng cookie. Trình duyệt tự đính kèm cookie phiên vào mọi request gửi tới tên miền này, kể cả request do một trang khác kích hoạt. Tắt bảo vệ CSRF trong hoàn cảnh đó là mở đúng cánh cửa mà cơ chế này sinh ra để đóng — và mở cho toàn bộ nhóm đường dẫn làm thay đổi dữ liệu. Ghi chú trong bản vá cũng cho thấy một lập luận sai mà tôi muốn nói rõ với người viết, vì nó sẽ còn quay lại: chữ REST không quyết định gì cả. Điều quyết định là ai đính kèm thông tin xác thực vào request. Client tự gắn token vào header thì không cần bảo vệ CSRF; trình duyệt tự gắn cookie thì cần, bất kể API được thiết kế theo phong cách nào. Sau đó tôi quay lại triệu chứng, vì bản vá đang chữa triệu chứng chứ chưa ai tìm nguyên nhân. Ba chi tiết đi cùng nhau: lỗi rải rác chứ không phải luôn luôn, tăng theo tải, và thử lại thì thành công. Hình dạng đó không giống một cấu hình sai — cấu hình sai thì sai đều. Nó giống một request rơi vào đúng chỗ không có dữ liệu nó cần. Với tám instance sau bộ cân bằng tải, điều đó có nghĩa rất cụ thể: token CSRF mặc định được lưu trong phiên, phiên lại nằm ở instance đã phục vụ lần trước, nên khi request tiếp theo rơi sang instance khác thì instance đó không có gì để đối chiếu và trả 403. Giờ cao điểm nhiều instance bận hơn, request bị phân tán nhiều hơn, tỉ lệ lỗi tăng — khớp hoàn toàn. Thử lại đôi khi rơi trúng instance cũ nên thành công, và điều đó càng củng cố giả thuyết chứ không bác bỏ nó. Để khẳng định, tôi ghim tạm một nhóm người dùng vào một instance và xem lỗi có biến mất trong nhóm đó không; hoặc gọn hơn, đối chiếu log 403 với instance xử lý và so với instance đã cấp token. Cách sửa đúng là giữ nguyên bảo vệ CSRF và đổi chỗ cất token: thay `CsrfTokenRepository` bằng một hiện thực lưu token ở nơi mọi instance đọc được. Nếu cần chặn lỗi ngay trong hôm nay thì bật phiên dính ở bộ cân bằng tải như biện pháp tạm — nó chữa được triệu chứng mà không mở lỗ hổng nào, và tôi nói rõ đó là tạm thời kèm hạn hoàn thành cho cách sửa thật. Về đường dài, tôi đồng ý với lập trình viên kia ở một điểm: hệ thống này sẽ dễ thở hơn nếu chuyển sang token đặt trong header. Nhưng thứ tự phải đúng — chuyển cơ chế xác thực trước, rồi việc bỏ bảo vệ CSRF mới có cơ sở. Làm ngược lại là bỏ hàng rào trước khi có cái thay thế.",
    redFlags: [
      "Duyệt bản vá vì \"API REST thì không cần CSRF\"",
      "Từ chối bản vá bằng nguyên tắc chung mà không đọc ra nguyên nhân thật của lỗi 403",
      "Không liên hệ được lỗi rải rác tăng theo tải với việc token nằm trong phiên",
      "Đề xuất đổi cơ chế xác thực ngay trong tuần dù ràng buộc đã nói rõ là không",
      "Coi phiên dính là cách sửa cuối cùng chứ không phải biện pháp tạm",
    ],
    probes: [
      "Bạn khẳng định giả thuyết bằng quan sát nào trước khi sửa?",
      "Phiên dính chữa được triệu chứng — vì sao bạn vẫn coi nó là tạm thời?",
      "Sau khi chuyển sang token trong header, còn thứ gì cần kiểm trước khi bỏ bảo vệ CSRF?",
    ],
    refs: ["springsec-09", "springsec-06", "springsec-10"],
  },

  // ===== ssec-oauth (springsec-iq17–springsec-iq20) =====
  {
    id: "springsec-iq17",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 1,
    minutes: 6,
    question: "Mô tả một hệ thống OAuth 2 cho người chưa từng làm: có những bên nào tham gia, ai giữ vai gì, và hai cách đóng gói thông tin vào thẻ ra vào khác nhau ở chỗ nào.",
    mustCover: [
      "**User** — con người muốn thực hiện một việc gì đó",
      "**Client** — ứng dụng cần được cho phép để truy cập tài nguyên, có thể hành động thay mặt user",
      "**Resource server** — backend giữ tài nguyên và cần biết có nên cho phép request này không",
      "**Authorization server** — nơi quản lý chi tiết user và client, xác thực họ, và cấp phát token",
      "Token là thẻ ra vào mà client lấy từ authorization server để được phép gọi resource server",
      "**Opaque token** không chứa thông tin, nên resource server phải gọi introspection để kiểm chứng",
      "**Non-opaque token** (thường là JWT) chứa sẵn thông tin nên kiểm chứng được tại chỗ",
      "JWT được **ký chứ không mã hoá** — ai cầm cũng đọc được payload",
    ],
    model: "Tôi hay dùng hình ảnh khách sạn để mở đầu vì nó đúng một cách đáng ngạc nhiên. Có bốn vai. User là con người muốn làm gì đó — là khách. Client là ứng dụng cần được cho phép để làm việc đó, thường là thay mặt user; nó giống người lễ tân đi lấy thẻ hộ bạn. Resource server là backend giữ tài nguyên và phải quyết định có cho request này đi tiếp không — là cái cửa phòng. Còn authorization server là nơi quản lý chi tiết của cả user lẫn client, xác thực họ, và cấp ra tấm thẻ — là quầy lễ tân. Điều tôi muốn nhấn ngay là phân biệt user với client, vì đây là chỗ hay lẫn. Client là **ứng dụng**, user là **người**. Một client có thể hành động thay mặt user, hoặc hành động nhân danh chính nó khi không có người nào liên quan — đó là lý do có nhiều luồng lấy token khác nhau. Token chính là tấm thẻ: client lấy nó từ authorization server rồi mang theo mỗi lần gọi resource server. Và có hai cách đóng gói tấm thẻ đó. Loại thứ nhất là opaque — token không chứa thông tin gì, chỉ là một chuỗi không nói lên điều gì. Resource server cầm nó thì không tự biết được gì cả, nên mỗi lần nhận request nó phải gọi ngược lại authorization server để hỏi \"token này còn hợp lệ không, và nó thuộc về ai\" — thao tác đó gọi là introspection. Loại thứ hai là non-opaque, phổ biến nhất là JWT: bản thân token chứa sẵn thông tin về user và client, và có chữ ký để resource server kiểm chứng ngay tại chỗ mà không cần gọi ai. Đánh đổi thì rõ: opaque tốn một lượt gọi mạng cho mỗi request nhưng authorization server luôn có tiếng nói cuối cùng; JWT nhanh hơn nhiều nhưng resource server tự quyết dựa trên thứ nó cầm trong tay. Một chi tiết rất hay bị hiểu sai mà tôi luôn nói ra: JWT được **ký**, không phải được mã hoá. Ai cầm token cũng đọc được nội dung bên trong, chữ ký chỉ bảo đảm nội dung đó không bị sửa. Nên đừng bao giờ nhét dữ liệu nhạy cảm vào token.",
    redFlags: [
      "Lẫn lộn user với client, coi client là người dùng",
      "Cho rằng JWT được mã hoá nên nhét được dữ liệu nhạy cảm vào",
      "Không giải thích được vì sao opaque token cần introspection",
      "Không phân biệt được vai của authorization server và resource server",
    ],
    probes: [
      "Với opaque token, resource server phải làm gì trên mỗi request và cái giá là gì?",
      "Vì sao lại có luồng lấy token không liên quan tới user nào?",
      "OpenID Connect thêm gì vào bức tranh này?",
    ],
    refs: ["springsec-13", "springsec-15"],
  },
  {
    id: "springsec-iq18",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// ===== Ở authorization server =====
@Bean
RegisteredClientRepository clients() {
    RegisteredClient c = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("portal")
            .clientSecret("{noop}secret")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)  // (1)
            .redirectUri("https://portal.example.com/callback")
            .scope("read")
            .build();
    return new InMemoryRegisteredClientRepository(c);
}

@Bean
JWKSource<SecurityContext> jwkSource() {
    RSAKey key = generateRsaKey();                  // (2) sinh cặp khoá mới mỗi lần
    JWKSet set = new JWKSet(key);
    return (selector, ctx) -> selector.select(set);
}

// ===== Ở resource server (hệ thống đã bật thu hồi token) =====
@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
    http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));   // (3)
    http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
    return http.build();
}`,
    },
    question: "Ba chỗ đánh số trong cấu hình OAuth 2 này đều có vấn đề, mỗi chỗ một kiểu. Chỉ ra từng cái, nói hậu quả người dùng sẽ thấy, và sửa.",
    mustCover: [
      "(1) một client đăng ký cả luồng phụ thuộc user lẫn luồng độc lập với user — sách khuyên tách thành hai client riêng",
      "(1) hệ quả: client tự lấy được token nhân danh chính nó, làm mờ ranh giới ai đang thao tác trong nhật ký",
      "(2) sinh cặp khoá mới mỗi lần khởi động khiến **mọi token đã cấp** không kiểm chứng được nữa",
      "(2) hệ quả người dùng thấy: bị đăng xuất hàng loạt sau mỗi lần phát hành; và nhiều instance thì mỗi instance ký bằng khoá khác nhau",
      "(2) sửa bằng cách nạp cặp khoá từ kho khoá bên ngoài, dùng chung cho mọi instance",
      "(3) hệ thống đã bật thu hồi token mà resource server lại kiểm chứng tại chỗ",
      "(3) hệ quả: token đã thu hồi vẫn dùng được cho tới khi hết hạn, vì chữ ký vẫn hợp lệ",
      "(3) sửa bằng cách chuyển sang introspection để authorization server có tiếng nói cuối cùng",
    ],
    model: "Ba lỗi, ba mức độ khác nhau, tôi đi từ nhẹ tới nặng. Chỗ (1) là lỗi về thiết kế danh tính. Client này đăng ký cả luồng authorization code — luồng có user thật đứng sau — lẫn luồng client credentials, là luồng client hành động nhân danh chính nó. Sách khuyên tách hẳn thành hai client, và lý do rất thực tế: với một client dùng cả hai, bạn không còn phân biệt được trong nhật ký rằng một hành động là do người dùng thực hiện hay do chính ứng dụng tự chạy. Khi cần điều tra một thao tác đáng ngờ, đó đúng là câu hỏi bạn cần trả lời. Tách hai client thì mỗi bên có danh tính riêng, quyền riêng, và thu hồi được riêng. Chỗ (2) là lỗi sẽ nổ ngay. Cặp khoá được sinh mới mỗi lần khởi động, mà đây chính là cặp khoá dùng để ký token. Nghĩa là mỗi lần phát hành, mọi token đã cấp trước đó đều không kiểm chứng được nữa — resource server lấy khoá công khai mới về và thấy chữ ký cũ không khớp. Người dùng sẽ thấy mình bị đăng xuất hàng loạt sau mỗi lần triển khai, và không ai hiểu vì sao. Tệ hơn nữa nếu authorization server chạy nhiều instance: mỗi instance ký bằng một khoá khác nhau, nên token do instance này cấp thì instance kia không nhận, và lỗi trở thành ngẫu nhiên. Cách sửa là nạp cặp khoá từ một kho khoá bên ngoài, dùng chung cho mọi instance, và xoay khoá theo quy trình có kiểm soát chứ không phải ngẫu nhiên theo vòng đời tiến trình. Chỗ (3) là lỗ hổng, và nó chỉ lộ ra khi đọc kỹ dòng ghi chú rằng hệ thống đã bật thu hồi token. Resource server đang cấu hình kiểm chứng JWT tại chỗ — nó nhận token, kiểm chữ ký, thấy hợp lệ thì cho qua. Nhưng chữ ký của một token đã bị thu hồi thì vẫn hợp lệ: thu hồi là trạng thái nằm ở authorization server, không nằm trong token. Nên tính năng thu hồi coi như không tồn tại, và token của một tài khoản vừa bị khoá vẫn dùng được cho tới khi hết hạn. Đây đúng là điều cần nhớ khi bật thu hồi: resource server phải introspect mọi token, kể cả token non-opaque, để authorization server có tiếng nói cuối cùng. Cách sửa là chuyển sang cấu hình introspection. Cái giá là mỗi request tốn thêm một lượt gọi mạng — đó là cái giá của việc thu hồi được, và cần nói rõ khi thiết kế chứ không phát hiện ra sau.",
    redFlags: [
      "Bỏ qua chỗ (3) vì cấu hình trông đúng chuẩn",
      "Không thấy vấn đề sinh khoá mới mỗi lần khởi động, hoặc chỉ coi là bất tiện chứ không phải lỗi",
      "Cho rằng đăng ký nhiều grant type cho một client là bình thường",
      "Đề xuất rút ngắn thời hạn token thay cho introspection mà không nêu đó chỉ là giảm thiểu",
    ],
    probes: [
      "Nếu không muốn introspect mọi request, có cách nào giảm cửa sổ rủi ro của token đã thu hồi?",
      "Xoay khoá ký token trên hệ thống đang chạy cần lưu ý gì để không đăng xuất hàng loạt?",
      "Hai client tách riêng thì bạn cấp quyền cho chúng khác nhau thế nào?",
    ],
    refs: ["springsec-14", "springsec-15", "springsec-13"],
  },
  {
    id: "springsec-iq19",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 3,
    minutes: 11,
    question: "Bạn đang thiết kế tầng token cho một hệ thống nhiều dịch vụ. Yêu cầu vận hành nói rằng khoá một tài khoản thì quyền truy cập phải mất hiệu lực trong vòng một phút. Cân nhắc các phương án đóng gói và kiểm chứng token, rồi chốt.",
    tradeoffs: [
      {
        option: "JWT kiểm chứng tại chỗ, thời hạn dài",
        when: "Nhanh nhất và đơn giản nhất về vận hành: resource server không phụ thuộc vào authorization server lúc chạy. Nhưng nó không đáp ứng được yêu cầu một phút — token đã cấp vẫn hợp lệ tới khi hết hạn, vì trạng thái thu hồi không nằm trong token. Chỉ chọn khi yêu cầu thu hồi không tồn tại.",
      },
      {
        option: "JWT thời hạn rất ngắn + refresh token",
        when: "Đáp ứng yêu cầu bằng cách thu hẹp cửa sổ thay vì thu hồi thật: access token sống dưới một phút, và việc khoá tài khoản chặn ở bước làm mới. Giữ được ưu thế kiểm chứng tại chỗ, đổi lại lưu lượng tới authorization server tăng theo tần suất làm mới và luồng client phức tạp hơn.",
      },
      {
        option: "Opaque token + introspection trên mọi request",
        when: "Đáp ứng yêu cầu một cách trực tiếp và không có cửa sổ trễ: authorization server có tiếng nói cuối cùng ở từng request. Cái giá là một lượt gọi mạng cho mỗi request và authorization server trở thành điểm chết chung của hệ thống. Cần bộ đệm kết quả introspection trong vài giây để chịu tải.",
      },
      {
        option: "JWT + introspection (bắt buộc khi đã bật thu hồi)",
        when: "Khi hệ thống đã phát hành JWT rộng rãi và không thể đổi định dạng, nhưng vẫn cần thu hồi. Đây chính là điều sách nhấn: bật thu hồi thì resource server phải introspect cả token non-opaque. Kết quả là gánh chi phí của cả hai cách mà chỉ được lợi ích của một — nên coi là phương án chuyển tiếp, không phải đích đến.",
      },
    ],
    mustCover: [
      "Nhận ra yêu cầu một phút là yêu cầu về **thu hồi**, và đó là thứ quyết định toàn bộ lựa chọn",
      "JWT kiểm chứng tại chỗ không thu hồi được, vì trạng thái thu hồi không nằm trong token",
      "Khi đã bật thu hồi thì resource server phải introspect **cả token non-opaque**",
      "Phương án thời hạn ngắn là thu hẹp cửa sổ chứ không phải thu hồi thật — nói rõ sự khác nhau",
      "Introspection biến authorization server thành điểm chết chung, cần bộ đệm và kế hoạch chịu tải",
      "Chốt một phương án và gắn nó với chính con số trong yêu cầu",
      "Nêu được cách đo/kiểm chứng rằng yêu cầu một phút thật sự được đáp ứng",
    ],
    model: "Điều đầu tiên tôi làm là dịch yêu cầu vận hành sang ngôn ngữ kỹ thuật: \"khoá tài khoản thì quyền mất hiệu lực trong một phút\" chính là một yêu cầu về thu hồi, và nó quyết định gần như toàn bộ phần còn lại. Nên tôi loại ngay phương án JWT thời hạn dài kiểm chứng tại chỗ, dù nó là phương án rẻ nhất về vận hành. Lý do rất dứt khoát: trạng thái thu hồi nằm ở authorization server chứ không nằm trong token, nên một token đã cấp vẫn có chữ ký hợp lệ và vẫn được chấp nhận cho tới khi hết hạn. Đặt thời hạn một giờ nghĩa là chấp nhận một giờ trễ — vi phạm yêu cầu. Còn lại hai hướng thật. Hướng thứ nhất là giữ JWT nhưng rút thời hạn xuống dưới một phút và dựa vào refresh token: khi tài khoản bị khoá, lần làm mới tiếp theo bị từ chối và quyền truy cập tắt trong vòng một chu kỳ. Ưu điểm là resource server vẫn kiểm chứng tại chỗ, không phụ thuộc vào authorization server lúc chạy, nên đường đi thông thường vẫn nhanh. Nhưng tôi muốn nói thẳng một điều: đây là thu hẹp cửa sổ, không phải thu hồi. Trong cửa sổ đó token vẫn dùng được, và nếu ai đó hỏi \"có chắc chắn không\" thì câu trả lời trung thực là không, chỉ là đủ ngắn. Ngoài ra, thời hạn càng ngắn thì lưu lượng làm mới càng cao, nên authorization server vẫn chịu tải, chỉ là theo một nhịp khác. Hướng thứ hai là opaque token và introspection trên mọi request. Đây là câu trả lời trực tiếp cho yêu cầu: authorization server có tiếng nói cuối cùng ở từng request, không có cửa sổ trễ nào. Cái giá cũng rất rõ và tôi không giấu: một lượt gọi mạng thêm cho mỗi request, và authorization server trở thành điểm chết chung — nó sập thì cả hệ thống đứng. Nên nếu chọn hướng này, tôi kèm ngay hai việc: bộ đệm kết quả introspection trong khoảng vài giây ở phía resource server, và authorization server phải được coi là hạ tầng bậc một về mặt dự phòng. Bộ đệm vài giây vẫn nằm trong ngân sách một phút, nên nó không phá yêu cầu. Quyết định của tôi: chọn introspection, vì yêu cầu nói là một phút chứ không phải \"khoảng một phút\", và tôi không muốn phải giải thích một cửa sổ trễ với đội vận hành khi có sự cố thật. Còn nếu sau này đo ra rằng chi phí introspection không chịu nổi, đường lui là chuyển sang JWT thời hạn cực ngắn, và lúc đó phải nói rõ với bên đưa yêu cầu rằng bảo đảm đã đổi từ \"chắc chắn\" sang \"trong vòng\". Một điều cuối: dù chọn hướng nào tôi cũng viết một bài kiểm tra tự động chạy định kỳ — khoá một tài khoản thử, rồi gọi resource server và đo bao lâu thì bị từ chối. Yêu cầu có con số thì phải có phép đo, không thì vài tháng sau không ai biết nó còn đúng không.",
    redFlags: [
      "Chọn JWT thời hạn dài mà không đối chiếu với yêu cầu thu hồi",
      "Cho rằng rút ngắn thời hạn token là tương đương với thu hồi",
      "Không biết rằng bật thu hồi thì token non-opaque cũng phải introspect",
      "Chọn introspection mà không nói gì tới tải và tính sẵn sàng của authorization server",
      "Không nêu cách kiểm chứng rằng yêu cầu thật sự được đáp ứng",
    ],
    probes: [
      "Bộ đệm introspection bao lâu thì vẫn nằm trong ngân sách một phút?",
      "Authorization server sập thì hệ thống của bạn hành xử thế nào?",
      "Nếu bên đưa yêu cầu chấp nhận năm phút thay vì một phút, câu trả lời của bạn đổi không?",
    ],
    refs: ["springsec-13", "springsec-14", "springsec-15"],
  },
  {
    id: "springsec-iq20",
    field: "spring-security",
    topic: "ssec-oauth",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một nhân viên bị chấm dứt hợp đồng lúc 9 giờ sáng; đội vận hành khoá tài khoản và thu hồi token ngay trong vòng năm phút, có ghi nhận trong nhật ký của authorization server. Đến 11 giờ trưa, nhật ký truy cập của một dịch vụ nội bộ cho thấy vẫn có request thành công mang danh tính tài khoản đó. Một dịch vụ khác thì đã từ chối đúng như mong đợi từ 9 giờ 05.",
      scale: "Kiến trúc nhiều dịch vụ: một authorization server, 9 dịch vụ đóng vai resource server, do 4 đội khác nhau vận hành. Không có tài liệu tập trung về cách từng dịch vụ cấu hình việc kiểm chứng token.",
      constraints: "Sự việc liên quan tới nhân sự nên phải trả lời được chính xác tài khoản đó đã truy cập những gì sau 9 giờ. Không được thay đổi đồng loạt cấu hình của 9 dịch vụ trong một lần phát hành vì rủi ro gián đoạn.",
    },
    question: "Hai dịch vụ cùng nhận một token nhưng xử sự khác nhau. Trình bày cách bạn giải thích sự khác biệt đó, việc bạn làm ngay trong hôm nay, và cách bạn đóng lại khoảng hở này trên cả hệ thống.",
    mustCover: [
      "Sự khác biệt nằm ở **cách từng resource server kiểm chứng token**, không phải ở token hay ở authorization server",
      "Dịch vụ từ chối đúng hạn đang dùng introspection; dịch vụ còn lại kiểm chứng JWT tại chỗ",
      "Chữ ký của token đã thu hồi vẫn hợp lệ — trạng thái thu hồi chỉ authorization server mới biết",
      "Việc làm ngay: xác định phạm vi truy cập của tài khoản sau 9 giờ trên **cả 9 dịch vụ**, không chỉ dịch vụ đã phát hiện",
      "Chặn máu ngay ở tầng ứng dụng cho dịch vụ đang hở (chặn theo định danh) thay vì chờ sửa cấu hình token",
      "Kiểm kê cấu hình kiểm chứng token của cả 9 dịch vụ — vấn đề gốc là không ai biết dịch vụ nào đang làm gì",
      "Chuyển dần sang introspection theo đợt, không đổi đồng loạt, đúng ràng buộc đã nêu",
      "Ngăn tái diễn bằng một phép thử định kỳ: thu hồi một token thử rồi gọi lần lượt từng dịch vụ",
      "Nêu rõ giới hạn của kết luận nếu nhật ký của một số dịch vụ không đủ chi tiết",
    ],
    model: "Điều đầu tiên tôi nói với mọi người trong phòng là: token không có lỗi, authorization server cũng không có lỗi — nó đã thu hồi đúng và có ghi nhận. Sự khác biệt nằm hoàn toàn ở phía nhận, tức là cách từng resource server chọn kiểm chứng token. Dịch vụ từ chối đúng từ 9 giờ 05 gần như chắc chắn đang gọi introspection: mỗi request nó hỏi lại authorization server, và authorization server nói token này đã bị thu hồi. Dịch vụ còn lại đang kiểm chứng JWT tại chỗ: nó nhận token, kiểm chữ ký, thấy hợp lệ và cho qua. Mà chữ ký của một token đã thu hồi thì vẫn hợp lệ — thu hồi là một trạng thái nằm ở authorization server, không phải thứ được viết vào trong token. Đây chính là điều cần nhớ khi bật thu hồi: đã dùng thu hồi thì resource server phải introspect, kể cả với token non-opaque. Một dịch vụ làm đúng, tám dịch vụ còn lại thì chưa ai biết. Trong hôm nay tôi làm ba việc, theo thứ tự. Thứ nhất là xác định phạm vi, vì đây là việc gấp nhất và dữ liệu thì mất dần theo thời gian lưu nhật ký: tôi lấy định danh của tài khoản đó và rà nhật ký truy cập của **cả chín** dịch vụ từ 9 giờ, không chỉ dịch vụ vừa phát hiện. Rất có thể còn dịch vụ khác cũng đang hở mà chưa ai nhìn tới. Nếu nhật ký của dịch vụ nào không ghi đủ định danh người gọi thì tôi ghi nhận rõ là không kết luận được cho dịch vụ đó, thay vì suy đoán — với việc liên quan tới nhân sự, một kết luận sai còn tệ hơn là một khoảng trống được thừa nhận. Thứ hai là chặn máu, và tôi không chờ sửa tầng token: tôi thêm một danh sách chặn theo định danh ngay ở tầng ứng dụng của các dịch vụ đang hở. Đó là giải pháp thô, nhưng nó đóng cửa trong vòng vài giờ và không đụng tới cách kiểm chứng token. Thứ ba là kiểm kê: đi hỏi từng đội trong bốn đội xem dịch vụ của họ cấu hình kiểm chứng token kiểu gì, và ghi lại thành một bảng. Việc không có bảng đó mới là vấn đề gốc — sự cố hôm nay chỉ là triệu chứng của chuyện không ai biết chín dịch vụ đang làm gì. Về việc đóng lại khoảng hở trên toàn hệ thống, ràng buộc đã nói rõ là không đổi đồng loạt, và tôi cũng không muốn thế: chuyển sang introspection nghĩa là thêm một lượt gọi mạng cho mỗi request và biến authorization server thành điểm chết chung, nên nó cần được đo tải trước. Tôi làm theo đợt, bắt đầu từ dịch vụ giữ dữ liệu nhạy cảm nhất, mỗi đợt kèm theo dõi độ trễ và tỉ lệ lỗi, và bổ sung bộ đệm kết quả introspection vài giây để chịu tải. Cuối cùng là phần ngăn tái diễn, và tôi cho đây là phần quan trọng nhất: tôi dựng một phép thử tự động chạy hằng ngày — lấy một token thử, thu hồi nó, rồi gọi lần lượt cả chín dịch vụ và khẳng định tất cả đều từ chối trong ngân sách thời gian đã cam kết. Phép thử đó biến một giả định ngầm thành một thứ đo được, và nó sẽ báo đỏ ngay ngày mà một đội nào đó vô tình đổi cấu hình về kiểm chứng tại chỗ.",
    redFlags: [
      "Đổ lỗi cho authorization server dù nhật ký cho thấy nó đã thu hồi đúng",
      "Chỉ sửa dịch vụ đã phát hiện, không rà tám dịch vụ còn lại",
      "Chờ chuyển xong sang introspection rồi mới chặn truy cập của tài khoản",
      "Đổi cấu hình cả chín dịch vụ trong một lần phát hành dù ràng buộc đã cấm",
      "Kết luận phạm vi truy cập mà không kiểm xem nhật ký có đủ chi tiết không",
      "Không để lại phép thử nào canh chừng việc này về sau",
    ],
    probes: [
      "Vì sao chữ ký của một token đã thu hồi vẫn hợp lệ?",
      "Chuyển sang introspection làm tăng rủi ro gì, và bạn giảm nó thế nào?",
      "Phép thử hằng ngày của bạn sẽ đỏ trong những tình huống nào?",
    ],
    refs: ["springsec-15", "springsec-14", "springsec-13"],
  },

  // ===== ssec-reactive (springsec-iq21–springsec-iq24) =====
  {
    id: "springsec-iq21",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 1,
    minutes: 5,
    question: "Bạn chuyển một dịch vụ sang stack reactive. Những thành phần bảo mật quen thuộc đổi thành gì, và có một thói quen cũ chắc chắn sẽ hỏng — đó là gì?",
    mustCover: [
      "`UserDetailsService` đổi thành **`ReactiveUserDetailsService`**, cùng mục đích: nói cho ứng dụng biết cách lấy chi tiết user",
      "Cấu hình đổi từ `SecurityFilterChain` sang **`SecurityWebFilterChain`**, dựng bằng builder `ServerHttpSecurity`",
      "Tên phương thức đổi theo thuật ngữ reactive: `authorizeHttpRequests()` thành **`authorizeExchange()`**",
      "Thói quen hỏng: đọc security context qua `SecurityContextHolder`, vì nó dựa vào `ThreadLocal`",
      "Trong mô hình reactive, một request không gắn chặt với một thread nên `ThreadLocal` không dùng được",
      "Thay bằng **`ReactiveSecurityContextHolder`**, và nó trả về một kiểu reactive chứ không phải giá trị trực tiếp",
      "Có method security cho reactive, tương tự bên non-reactive",
    ],
    model: "Điều làm tôi yên tâm khi chuyển sang reactive là phần lớn kiến thức cũ vẫn dùng được — các khái niệm không đổi, chủ yếu là đổi tên và đổi kiểu trả về. Việc quản lý user vẫn là nói cho ứng dụng biết cách lấy chi tiết user, chỉ là qua `ReactiveUserDetailsService` thay vì `UserDetailsService`. Cấu hình vẫn là dựng một chuỗi filter và đưa vào context, chỉ là `SecurityWebFilterChain` dựng bằng builder `ServerHttpSecurity` thay vì `SecurityFilterChain` với `HttpSecurity`. Tên các phương thức cấu hình phân quyền thì gần như giữ nguyên, chỉ vài chỗ đổi theo thuật ngữ reactive — rõ nhất là `authorizeHttpRequests()` bên kia thành `authorizeExchange()` bên này, vì trong thế giới reactive đơn vị làm việc được gọi là exchange chứ không phải request. Phân quyền ở mức method cũng có, tương tự bên non-reactive. Còn thói quen chắc chắn hỏng thì chỉ có một, nhưng nó hỏng rất êm: gọi `SecurityContextHolder.getContext()` để lấy người dùng hiện tại. Cách đó dựa vào `ThreadLocal`, mà `ThreadLocal` chỉ hoạt động khi một request được xử lý trọn vẹn trên một thread. Mô hình reactive thì cố tình không như vậy — một chuỗi xử lý có thể chạy trên nhiều thread khác nhau, và thread nào xử lý đoạn nào là do bộ lập lịch quyết định. Nên `ThreadLocal` mất chỗ dựa. Thay thế là `ReactiveSecurityContextHolder`, và điểm khác biệt quan trọng không chỉ là đổi tên: nó trả về một kiểu reactive chứ không phải giá trị trực tiếp, nên ta phải ghép nó vào chuỗi xử lý bằng các toán tử. Từ đó dẫn tới cái bẫy đi kèm mà tôi luôn nhắc: đừng gọi `block()` để lấy giá trị ra cho nhanh. Nó chặn một thread của vòng lặp sự kiện, và trong mô hình reactive số thread đó rất ít, nên chỉ vài lời gọi như vậy là đủ làm cả dịch vụ đứng dưới tải.",
    redFlags: [
      "Cho rằng `SecurityContextHolder` vẫn dùng được bình thường trong code reactive",
      "Không biết `authorizeExchange()` là bản tương ứng của `authorizeHttpRequests()`",
      "Đề xuất `block()` để lấy người dùng hiện tại",
      "Nghĩ rằng reactive cần một mô hình bảo mật hoàn toàn khác",
    ],
    probes: [
      "Vì sao `ThreadLocal` không dùng được trong mô hình reactive?",
      "Hậu quả cụ thể của một lời gọi `block()` trong chuỗi xử lý là gì?",
      "Trộn cả hai bộ dependency web và webflux trong một project thì ứng dụng chạy theo stack nào?",
    ],
    refs: ["springsec-17", "springsec-06"],
  },
  {
    id: "springsec-iq22",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@RestController
public class ReportController {

    private final ReportService reports;

    @GetMapping("/reports")
    public Flux<Report> myReports() {
        Authentication auth = SecurityContextHolder.getContext()
                                                   .getAuthentication();   // (1)
        String username = auth.getName();
        return reports.findByOwner(username);
    }

    @GetMapping("/reports/summary")
    public Mono<Summary> summary() {
        String username = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .block();                                                   // (2)
        return reports.summaryFor(username);
    }
}

@Bean
SecurityWebFilterChain chain(ServerHttpSecurity http) {
    return http
            .authorizeExchange(c -> c.anyExchange().authenticated())
            .csrf(csrf -> csrf.disable())                                   // (3)
            .build();
}`,
    },
    question: "Hai endpoint này cùng cần biết người gọi là ai, và cả hai đều làm sai theo hai kiểu khác nhau. Chỉ ra từng cái, nói rõ triệu chứng sẽ thấy ở môi trường thật, rồi viết lại. Cũng nhận xét về dòng thứ ba.",
    mustCover: [
      "(1) `SecurityContextHolder` dựa vào `ThreadLocal` nên trong chuỗi reactive nó trả về context rỗng",
      "(1) triệu chứng: `NullPointerException` hoặc danh tính rỗng, và có thể **lúc được lúc không** tuỳ thread nào chạy",
      "(2) `block()` chặn một thread của vòng lặp sự kiện — số thread này rất ít nên dịch vụ đứng dưới tải",
      "(2) triệu chứng: chạy tốt khi thử một mình, độ trễ tăng vọt hoặc treo khi có đồng thời",
      "Cách viết đúng: lấy context bằng `ReactiveSecurityContextHolder` rồi **ghép vào chuỗi** bằng `flatMap`/`flatMapMany`, không tách ra ngoài",
      "(3) tắt bảo vệ CSRF phải là quyết định có cơ sở, phụ thuộc cách xác thực chứ không phải mặc định khi chuyển sang reactive",
      "Nêu được rằng cả hai lỗi đều không lộ ra trong test đơn giản một luồng",
    ],
    model: "Hai endpoint, hai lỗi khác nhau, và điểm chung là cả hai đều chạy được trên máy lập trình viên. Endpoint thứ nhất dùng `SecurityContextHolder`, thứ dựa vào `ThreadLocal`. Trong mô hình reactive, một chuỗi xử lý không bị buộc vào một thread, nên ở thời điểm dòng đó chạy, thread đang thực thi có thể không phải thread đã thiết lập context. Kết quả là context rỗng, `getAuthentication()` trả `null`, và dòng dưới ném `NullPointerException`. Triệu chứng đáng chú ý ở môi trường thật là nó có thể lúc được lúc không, vì việc thread nào chạy đoạn nào phụ thuộc vào bộ lập lịch và tải — nên bug này rất dễ bị bỏ qua trong kiểm thử rồi bùng lên ở production. Endpoint thứ hai thì dùng đúng `ReactiveSecurityContextHolder` nhưng lại gọi `block()` để rút giá trị ra. Cái này không sai về mặt logic, code chạy đúng và test một luồng sẽ xanh. Vấn đề là nó chặn một thread của vòng lặp sự kiện, mà trong mô hình reactive số thread đó rất ít — thường chỉ vài cái theo số lõi. Mỗi request chặn một thread thì chỉ cần vài request đồng thời là hết thread, và cả dịch vụ đứng lại. Triệu chứng là độ trễ tăng vọt hoặc dịch vụ treo dưới tải, trong khi thử thủ công thì mọi thứ hoàn hảo — đúng loại sự cố chỉ xuất hiện ở production. Cách viết đúng cho cả hai là giống nhau về nguyên tắc: không rút danh tính ra khỏi chuỗi, mà ghép chuỗi lấy danh tính vào chuỗi xử lý. Lấy context từ `ReactiveSecurityContextHolder`, lấy ra tên người dùng bằng `map`, rồi dùng `flatMap` để nối sang lời gọi service — với endpoint trả về nhiều phần tử thì dùng `flatMapMany`. Toàn bộ vẫn là một chuỗi, không có chỗ nào chặn. Có một cách viết gọn hơn đáng nhắc: tiêm thẳng danh tính vào tham số của phương thức controller và để framework lo phần lấy context. Khi nào dùng được thì nó sạch hơn hẳn và loại bỏ luôn cơ hội mắc cả hai lỗi trên. Về dòng thứ ba, tôi không gọi là lỗi mà là một quyết định chưa có cơ sở. Việc có cần bảo vệ CSRF hay không phụ thuộc vào cách ứng dụng xác thực — nếu nó dùng cookie phiên thì tắt là mở lỗ hổng, còn nếu dùng token trong header thì tắt là hợp lý. Điều tôi phản đối là tắt nó như một bước mặc định khi chuyển sang reactive, vì chuyện chuyển stack không liên quan gì tới câu hỏi ai đính kèm thông tin xác thực vào request.",
    redFlags: [
      "Chỉ thấy lỗi ở endpoint thứ nhất, coi `block()` là chấp nhận được vì code chạy đúng",
      "Sửa endpoint thứ nhất bằng cách thêm kiểm tra `null`",
      "Không giải thích được vì sao lỗi thứ nhất có thể chập chờn",
      "Coi việc tắt bảo vệ CSRF là bước bắt buộc khi sang reactive",
    ],
    probes: [
      "Vì sao `block()` nguy hiểm hơn nhiều trong reactive so với trong stack servlet?",
      "Có cách nào lấy người dùng hiện tại mà không phải chạm tới context không?",
      "Bạn viết test thế nào để bắt được lời gọi chặn luồng?",
    ],
    refs: ["springsec-17", "springsec-06", "springsec-09"],
  },
  {
    id: "springsec-iq23",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 3,
    minutes: 11,
    question: "Đội bạn có 40 endpoint và một tầng service đã gắn quy tắc phân quyền, nhưng chưa có bài kiểm thử nào cho phần bảo mật. Bạn có hai ngày. Lập kế hoạch: viết loại test nào, bao nhiêu, và bỏ qua cái gì.",
    tradeoffs: [
      {
        option: "Nhiều test phân quyền với người dùng giả, ít test xác thực",
        when: "Lựa chọn mặc định, và đúng thứ tự ưu tiên mà sách khuyên. Số luồng xác thực trong một ứng dụng chỉ có vài cái, còn số tổ hợp phân quyền thì nhân lên theo số endpoint và số quyền. Người dùng giả bỏ qua bước đăng nhập nên test chạy nhanh, và cái đang cần khoá lại là các quy tắc phân quyền.",
      },
      {
        option: "Test xác thực đầy đủ cho mọi endpoint",
        when: "Lãng phí trong hai ngày: mỗi test phải đi qua toàn bộ luồng đăng nhập để kiểm lại cùng một thứ. Chỉ giữ vài test cho chính luồng đăng nhập, đăng xuất và trường hợp sai thông tin.",
      },
      {
        option: "Test ở mức method thay vì mức endpoint",
        when: "Khi quy tắc thật nằm ở tầng service. Test ở mức method chỉ đúng vào chỗ có luật, chạy nhanh hơn, và bắt được cả lỗi lời gọi nội bộ không qua proxy. Nhưng nó không kiểm được cấu hình ở mức endpoint, nên không thay thế được hoàn toàn.",
      },
      {
        option: "Người dùng giả lấy từ nguồn user thật thay vì khai trực tiếp",
        when: "Khi quyền của user được tính toán từ dữ liệu chứ không phải gán cứng — chẳng hạn quyền suy ra từ phòng ban. Test sát thực tế hơn vì nó đi qua đúng logic dựng quyền, đổi lại chậm hơn và phụ thuộc dữ liệu mẫu.",
      },
    ],
    mustCover: [
      "Ưu tiên rõ ràng: **ít** test xác thực, **nhiều** test phân quyền — vì số tổ hợp phân quyền lớn hơn nhiều",
      "Người dùng giả cho phép bỏ qua bước đăng nhập nên bộ test chạy nhanh và viết được nhiều",
      "Mỗi endpoint nhạy cảm cần ít nhất hai ca: một người được phép và một người không được phép",
      "Phải có ca **không có danh tính** để phân biệt 401 với 403",
      "Test ở mức method cần thiết khi quy tắc nằm ở tầng service, và nó bắt được lỗi lời gọi nội bộ",
      "Chọn đúng công cụ theo stack: một bộ cho ứng dụng servlet, một bộ cho ứng dụng reactive",
      "Nói rõ cái bỏ qua và vì sao — hai ngày thì phải cắt cái gì đó",
      "Ưu tiên endpoint theo mức nhạy cảm của dữ liệu, không phủ đều",
    ],
    model: "Với hai ngày, điều quan trọng nhất là chọn đúng thứ để khoá lại, và tôi chọn theo nguyên tắc mà sách nêu rất gọn: cần ít test xác thực và nhiều test phân quyền. Lý do là số học. Luồng xác thực trong ứng dụng chỉ có vài cái — đăng nhập đúng, đăng nhập sai, đăng xuất, có thể thêm hết hạn phiên. Còn phân quyền thì nhân lên theo số endpoint và số vai, ở đây là bốn mươi endpoint nhân với số quyền, nên đó mới là chỗ dễ sai và dễ sai âm thầm. Ngoài ra test xác thực đắt hơn nhiều vì phải đi qua cả luồng đăng nhập thật; nếu mỗi test phân quyền cũng phải đăng nhập trước thì bộ test sẽ chậm tới mức không ai chạy. Vì thế tôi dùng người dùng giả: khai thẳng một danh tính có sẵn quyền cần thiết rồi gọi endpoint, bỏ qua hoàn toàn bước đăng nhập. Kế hoạch cụ thể của tôi trong hai ngày như sau. Đầu tiên tôi xếp bốn mươi endpoint theo mức nhạy cảm của dữ liệu và không cố phủ đều — dăm bảy endpoint chạm vào dữ liệu tài chính hay dữ liệu cá nhân được phủ trước và phủ kỹ, những endpoint chỉ đọc dữ liệu tham chiếu thì để sau cùng. Với mỗi endpoint được chọn, tôi viết tối thiểu ba ca: một người dùng có quyền và phải được vào, một người dùng đã đăng nhập nhưng thiếu quyền và phải nhận 403, và một request không kèm danh tính nào phải nhận 401. Ca thứ ba hay bị bỏ và tôi luôn giữ, vì nó là ca duy nhất phân biệt được hai tình huống rất khác nhau: hệ thống không biết bạn là ai, và hệ thống biết rồi nhưng không cho. Song song đó tôi thêm một nhóm test ở mức method cho tầng service, vì đề bài nói quy tắc đã được gắn ở đó. Nhóm này quan trọng hơn vẻ ngoài của nó: nó là thứ duy nhất bắt được lỗi quy tắc không được thi hành vì lời gọi đi trong cùng một class và không qua proxy — loại lỗi mà test qua endpoint sẽ không thấy nếu endpoint đó tình cờ gọi đúng đường. Về công cụ thì tôi chọn theo stack: dịch vụ servlet dùng bộ công cụ mô phỏng request quen thuộc, dịch vụ reactive dùng bộ công cụ tương ứng của nó — dùng nhầm thì test không phản ánh đúng thứ đang chạy. Còn cái tôi bỏ qua, và tôi nói rõ chứ không giấu: tôi không viết test xác thực cho từng endpoint, chỉ giữ vài ca cho chính luồng đăng nhập; tôi không dựng một danh tính tuỳ chỉnh phức tạp trừ khi quyền được tính từ dữ liệu; và tôi để lại hơn một nửa số endpoint ít nhạy cảm cho đợt sau. Đổi lại tôi bàn giao kèm một danh sách những gì chưa được phủ, để nó là một khoảng trống đã biết chứ không phải một giả định sai rằng bảo mật đã có test.",
    redFlags: [
      "Chia đều test cho cả bốn mươi endpoint mà không ưu tiên theo mức nhạy cảm",
      "Viết test đi qua luồng đăng nhập thật cho mọi ca phân quyền",
      "Bỏ qua ca request không kèm danh tính",
      "Không có test nào ở mức method dù quy tắc nằm ở tầng service",
      "Không nói rõ cái gì bị bỏ lại sau hai ngày",
    ],
    probes: [
      "Ca nào phân biệt được 401 với 403, và vì sao nó đáng giữ?",
      "Test nào bắt được lỗi quy tắc không chạy do lời gọi nội bộ?",
      "Khi quyền được tính từ dữ liệu, người dùng giả khai cứng có còn đáng tin không?",
    ],
    refs: ["springsec-18", "springsec-11", "springsec-17"],
  },
  {
    id: "springsec-iq24",
    field: "spring-security",
    topic: "ssec-reactive",
    level: 4,
    minutes: 16,
    incident: {
      symptom: "Một đợt tái cấu trúc gộp hai cấu hình bảo mật làm một. Toàn bộ 300 bài kiểm thử đều xanh và bản phát hành được duyệt. Ba tuần sau, một kỹ sư phát hiện endpoint xuất dữ liệu khách hàng gọi được mà không cần đăng nhập. Xem lại thì trong lần gộp đó, một quy tắc đã bị đặt sau một quy tắc bao trùm hơn nên không bao giờ được áp dụng.",
      scale: "Ứng dụng phục vụ khoảng 60.000 khách hàng. Endpoint xuất dữ liệu trả về danh sách khách hàng theo lô. Nhật ký truy cập được giữ 90 ngày.",
      constraints: "Nếu xác định có truy cập trái phép thì phải thông báo cho khách hàng theo quy định nội bộ. Đội muốn hiểu vì sao 300 bài kiểm thử không bắt được, trước khi viết thêm test mới.",
    },
    question: "Câu hỏi đội đặt ra đúng chỗ: vì sao một bộ kiểm thử đầy đủ lại không thấy gì. Trả lời câu đó, rồi trình bày cách xử lý và cách khiến lần sau không lặp lại.",
    mustCover: [
      "Vì sao test không bắt: chúng kiểm **người được phép thì vào được**, chứ không kiểm **người không được phép thì bị chặn**",
      "Test viết bằng người dùng giả luôn có danh tính, nên không có ca nào gọi endpoint mà **không kèm danh tính**",
      "Đây là lỗ hổng phủ định: bộ test khẳng định điều đúng nhưng không khẳng định điều phải sai",
      "Nguyên nhân kỹ thuật: thứ tự quy tắc — quy tắc khớp đầu tiên thắng, nên quy tắc bao trùm đặt trước làm quy tắc sau vô hiệu",
      "Việc đầu tiên: chặn endpoint ngay, rồi mới điều tra",
      "Xác định phạm vi từ nhật ký truy cập: lọc các lượt gọi endpoint đó không kèm danh tính trong ba tuần",
      "Nêu giới hạn: nhật ký giữ 90 ngày là đủ cho cửa sổ ba tuần — nói rõ điều này thay vì bỏ qua",
      "Sửa gốc: đặt lại thứ tự quy tắc và rà soát toàn bộ cấu hình sau khi gộp, không chỉ một dòng",
      "Ngăn tái diễn: thêm ca phủ định cho mọi endpoint, và một test khẳng định endpoint không nằm trong danh sách công khai thì luôn bị từ chối khi không có danh tính",
    ],
    model: "Tôi trả lời câu hỏi của đội trước vì nó là câu hỏi đúng, và câu trả lời áp dụng cho rất nhiều bộ test chứ không riêng bộ này. Ba trăm bài kiểm thử kia gần như chắc chắn đều có dạng: dựng một người dùng giả có quyền, gọi endpoint, khẳng định nhận được kết quả đúng. Nghĩa là chúng kiểm chiều thuận — người được phép thì vào được. Không bài nào kiểm chiều nghịch — người không được phép thì phải bị chặn. Mà lỗ hổng lần này nằm đúng ở chiều nghịch: endpoint trở nên công khai, và một endpoint công khai thì vẫn trả đúng kết quả cho người dùng giả có quyền. Mọi test vẫn xanh, vì chúng không hỏi câu hỏi mà đáng ra phải hỏi. Nói cách khác, bộ test khẳng định những điều phải đúng nhưng không khẳng định những điều phải sai. Và vì mọi test đều chạy với một danh tính có sẵn, không bài nào từng gọi endpoint mà không kèm danh tính — đúng ca duy nhất lẽ ra phát hiện được vấn đề. Về nguyên nhân kỹ thuật thì đơn giản và rất dễ tái diễn khi gộp cấu hình: các quy tắc phân quyền được so khớp theo thứ tự và quy tắc khớp đầu tiên thắng. Khi gộp hai cấu hình, một quy tắc bao trùm từ tệp này lọt lên trước quy tắc cụ thể của tệp kia, và từ đó quy tắc cụ thể không bao giờ được chạm tới. Nó không gây lỗi, không cảnh báo, chỉ âm thầm đổi hành vi. Về xử lý, việc đầu tiên tôi làm là chặn endpoint đó ngay — trước khi hiểu hết, trước khi họp. Sau đó mới điều tra. Xác định phạm vi thì tôi lọc nhật ký truy cập của endpoint đó trong ba tuần và tìm những lượt gọi không kèm danh tính; nhật ký giữ chín mươi ngày nên cửa sổ ba tuần nằm gọn trong đó, và đây là một điểm may mắn mà tôi nói rõ ra, vì nếu ngược lại thì kết luận sẽ phải kèm một khoảng trống. Tôi cũng xem hình dạng truy cập chứ không chỉ đếm: một vài lượt lẻ từ địa chỉ nội bộ khác hẳn với một chuỗi gọi theo lô từ bên ngoài, và khác nhau đó quyết định việc có phải thông báo cho khách hàng hay không. Sửa gốc thì tôi không chỉ chữa một dòng. Lần gộp đó có thể đã làm vô hiệu nhiều hơn một quy tắc, nên tôi rà lại toàn bộ cấu hình sau gộp, đối chiếu với cấu hình của hai tệp trước đây, và kiểm từng quy tắc xem nó có còn được chạm tới không. Phần ngăn tái diễn mới là phần tôi đầu tư nhiều nhất, và nó phải trả lời đúng câu hỏi của đội. Tôi thêm ca phủ định cho mọi endpoint nhạy cảm: gọi mà không kèm danh tính và khẳng định bị từ chối, gọi bằng danh tính thiếu quyền và khẳng định bị từ chối. Quan trọng hơn, tôi viết một test ở mức danh sách: liệt kê tường minh những endpoint được phép công khai, rồi lặp qua **mọi** endpoint còn lại của ứng dụng và khẳng định chúng bị từ chối khi không có danh tính. Test đó có tính chất mà từng test lẻ không có — nó tự bao phủ cả những endpoint được thêm vào sau này, nên một endpoint mới vô tình để mở sẽ làm nó đỏ ngay mà không cần ai nhớ viết test. Và tôi đưa việc \"đọc lại thứ tự quy tắc\" thành một mục bắt buộc trong danh sách kiểm khi review mọi thay đổi chạm vào cấu hình bảo mật.",
    redFlags: [
      "Chỉ trả lời phần kỹ thuật về thứ tự quy tắc mà không giải thích vì sao test không bắt được",
      "Kết luận rằng cần thêm test mà không nói rõ là thiếu ca phủ định",
      "Điều tra xong mới chặn endpoint",
      "Chỉ sửa đúng một quy tắc, không rà phần còn lại của lần gộp",
      "Không kiểm xem thời gian lưu nhật ký có phủ hết cửa sổ sự cố không",
      "Chỉ thêm test lẻ cho endpoint này, không có cơ chế tự bao phủ endpoint thêm mới",
    ],
    probes: [
      "Test ở mức danh sách của bạn hoạt động thế nào khi có người thêm endpoint mới tuần sau?",
      "Bạn phân biệt truy cập trái phép thật với lượt quét tự động bằng dấu hiệu nào?",
      "Nếu nhật ký chỉ giữ 7 ngày, bạn báo cáo phạm vi ra sao?",
    ],
    refs: ["springsec-18", "springsec-08", "springsec-07"],
  },
];
