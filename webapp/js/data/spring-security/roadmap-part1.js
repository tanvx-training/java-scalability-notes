// Lộ trình đọc Spring Security in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Spring Security in Action", ấn bản 2 —
// Laurentiu Spilca, Manning. Thư mục nguồn: sources/spring-security/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Bản dịch hiện tại trích từ 17 PDF chương gốc và đủ nội dung — không còn chỗ
// nào bị cắt cụt như bản trước. Sách bắt đầu ở chương 2; lộ trình vì thế cũng
// mở màn bằng chương 2 thay vì một chương dẫn nhập.
//
// Phân bổ 9 tuần / 17 chương: T1 ch2 · T2 ch3–4 · T3 ch5–6 · T4 ch7–8 ·
// T5 ch9–10 · T6 ch11–12 · T7 ch13 · T8 ch14–16 · T9 ch17–18.

export const springsecWeeksPart1 = [
  {
    id: "ss-w1",
    week: "Tuần 1",
    title: "Project đầu tiên và bức tranh tổng thể",
    goal: "Dựng được một ứng dụng Spring Boot có Spring Security, giải thích được điều gì xảy ra khi bạn chỉ thêm dependency mà chưa viết dòng cấu hình nào, và gọi tên được từng component trong luồng authentication.",
    practice: "Tạo project Spring Boot với `spring-boot-starter-security`, chạy lên, gọi `/hello` bằng `curl` không kèm credential rồi kèm credential mặc định, đọc mật khẩu sinh ra trong log. Sau đó ghi đè lần lượt `UserDetailsService`, `PasswordEncoder` và quy tắc authorization, mỗi lần chỉ đổi một thứ và xem response đổi ra sao.",
    resources: [
      { label: "SSIA 02 — Xin chào, Spring Security", href: "#/docs/springsec-02" },
      { label: "docs.spring.io — Spring Security Reference", href: "https://docs.spring.io/spring-security/reference/" },
      { label: "🌱 Sang lĩnh vực Spring Start Here — lộ trình đọc 8 tuần", href: "#/roadmap/spring-start" },
    ],
    items: [
      {
        id: "ss-w1-1",
        text: "Dựng project đầu tiên và đọc hiểu cấu hình mặc định của Spring Boot",
        lesson: `**Mục tiêu.** Chạy được project của §2.1, gọi endpoint \`/hello\` ở cả hai trạng thái có và không có credential, và đọc đúng thứ Spring Boot in ra console.

**Đọc.** [§2.1 Khởi động project đầu tiên của bạn](#/docs/springsec-02) — gõ lại hai listing đầu (chỉ hai dependency, rồi \`HelloController\`), chạy hết các lệnh \`curl\` trong mục. Khối giải thích về HTTP Basic cho bạn thấy cờ \`-u\` của \`curl\` thực chất làm gì: nó dựng header \`Authorization\` chứ không phải một cơ chế riêng.

**Bẫy.** Tưởng mật khẩu sinh tự động là cố định. Nó đổi sau mỗi lần khởi động, nên đừng chép nó vào script. Bẫy thứ hai, tinh vi hơn: thấy \`/hello\` trả 401 rồi kết luận "Spring Security chặn endpoint này". Không — mặc định nó chặn **mọi** endpoint; \`/hello\` không có gì đặc biệt.

**Tự kiểm tra.** Không cấu hình gì, Spring Boot tạo sẵn cho bạn user tên gì? Gọi \`/hello\` không kèm credential thì nhận status nào, và header \`WWW-Authenticate\` trong response nói lên điều gì?`,
      },
      {
        id: "ss-w1-2",
        text: "Bức tranh tổng thể: ai gọi ai trong luồng authentication",
        lesson: `**Mục tiêu.** Vẽ lại từ trí nhớ sơ đồ §2.2 và nói được trách nhiệm của từng mắt xích: authentication filter → \`AuthenticationManager\` → \`AuthenticationProvider\` → \`UserDetailsService\` + \`PasswordEncoder\` → \`SecurityContext\`.

**Đọc.** [§2.2 Bức tranh tổng thể về thiết kế class của Spring Security](#/docs/springsec-02). Đây là mục quan trọng nhất của cả chương: mọi chương sau chỉ là thay một mắt xích trong sơ đồ này. Đọc chậm, đối chiếu với hình trong mục.

**Bẫy.** Nghĩ \`AuthenticationManager\` là nơi chứa logic xác thực. Nó không xác thực gì cả — nó chọn và gọi một \`AuthenticationProvider\`. Muốn đổi *cách* xác thực thì viết \`AuthenticationProvider\`, không phải \`AuthenticationManager\`. Bẫy thứ hai: gộp \`UserDetailsService\` với \`PasswordEncoder\` làm một trách nhiệm. Chúng tách rời có chủ ý — cái tìm user, cái so khớp mật khẩu.

**Tự kiểm tra.** Nếu ứng dụng cần xác thực bằng mã một lần gửi qua SMS thay vì mật khẩu, bạn viết lại component nào trong sơ đồ? Sau khi xác thực xong, đối tượng \`Authentication\` được cất ở đâu để controller đọc được?`,
      },
      {
        id: "ss-w1-3",
        text: "Ghi đè cấu hình mặc định — bốn điểm can thiệp đầu tiên",
        lesson: `**Mục tiêu.** Tự khai \`UserDetailsService\`, \`PasswordEncoder\`, quy tắc authorization mức endpoint và một \`AuthenticationProvider\` tối giản; chọn được một phong cách cấu hình và bám theo nó.

**Đọc.** [§2.3.1 Tùy chỉnh việc quản lý user details](#/docs/springsec-02) → [§2.3.2 Áp dụng authorization ở mức endpoint](#/docs/springsec-02) → [§2.3.3 Cấu hình theo nhiều cách khác nhau](#/docs/springsec-02) → [§2.3.4 Định nghĩa logic authentication tùy chỉnh](#/docs/springsec-02) → [§2.3.5 Sử dụng nhiều configuration class](#/docs/springsec-02).

**Bẫy.** Dùng \`NoOpPasswordEncoder\` rồi quên gỡ. Sách dùng nó để ví dụ đọc được, và nói thẳng: không dành cho production. Bẫy thứ hai là cái §2.3.3 cảnh báo — trộn nhiều phong cách cấu hình trong cùng một ứng dụng. Chọn một cách, giữ nguyên cách đó; code trộn lẫn là code không ai đọc nổi sau ba tháng.

**Tự kiểm tra.** \`InMemoryUserDetailsManager\` phù hợp cho loại ứng dụng nào và vì sao không dùng nó ở production? Khi bạn khai một bean \`UserDetailsService\` của riêng mình, mật khẩu tự sinh trong log còn xuất hiện nữa không — vì sao?`,
      },
    ],
  },
  {
    id: "ss-w2",
    week: "Tuần 2",
    title: "User và mật khẩu",
    goal: "Mô tả được user theo cách Spring Security hiểu, cắm được nguồn user của riêng bạn vào luồng authentication, và chọn đúng `PasswordEncoder` kèm lý do.",
    practice: "Viết một hiện thực `UserDetails` gắn với entity user của bạn, rồi một `UserDetailsService` đọc từ database. Sau đó đổi `PasswordEncoder` sang `BCryptPasswordEncoder`, và thử `DelegatingPasswordEncoder` với hai thuật toán để thấy tiền tố `{bcrypt}` trong cột mật khẩu.",
    resources: [
      { label: "SSIA 03 — Quản lý user", href: "#/docs/springsec-03" },
      { label: "SSIA 04 — Quản lý mật khẩu", href: "#/docs/springsec-04" },
      { label: "SSIA 02 — Xin chào, Spring Security (ôn sơ đồ §2.2)", href: "#/docs/springsec-02" },
    ],
    items: [
      {
        id: "ss-w2-1",
        text: "`UserDetails` và `GrantedAuthority` — mô tả một user",
        lesson: `**Mục tiêu.** Viết được một hiện thực \`UserDetails\` tối giản và giải thích được vì sao authority lại là một collection chứ không phải một chuỗi.

**Đọc.** [§3.1 Hiện thực authentication trong Spring Security](#/docs/springsec-03) để định vị lại mình trong sơ đồ, rồi [§3.2.1 Mô tả user bằng contract \`UserDetails\`](#/docs/springsec-03) → [§3.2.2 Đi sâu vào contract \`GrantedAuthority\`](#/docs/springsec-03) → [§3.2.3 Viết một hiện thực tối giản](#/docs/springsec-03) → [§3.2.4 Dùng builder](#/docs/springsec-03) → [§3.2.5 Kết hợp nhiều trách nhiệm liên quan tới user](#/docs/springsec-03).

**Bẫy.** Trả về \`null\` từ \`getAuthorities()\` cho user "không có quyền gì". Hãy trả về collection rỗng — \`null\` sẽ nổ ở tầng authorization. Bẫy thứ hai là bốn phương thức \`isAccountNonExpired\`, \`isAccountNonLocked\`, \`isCredentialsNonExpired\`, \`isEnabled\`: hiện thực cẩu thả trả \`false\` một trong bốn cái sẽ khiến user đăng nhập hỏng mà thông báo lỗi không chỉ vào đúng chỗ.

**Tự kiểm tra.** §3.2.5 bàn về việc gộp entity JPA và \`UserDetails\` vào một class — sách nói lợi và hại của cách đó là gì? Khi nào dùng builder \`User.withUsername(...)\` thay vì tự viết class?`,
      },
      {
        id: "ss-w2-2",
        text: "`UserDetailsService`, `UserDetailsManager` và `JdbcUserDetailsManager`",
        lesson: `**Mục tiêu.** Phân biệt được hai contract và giải thích được vì sao chúng bị tách đôi; cấu hình được \`JdbcUserDetailsManager\` trên schema của chính bạn.

**Đọc.** [§3.3.1 Hiểu contract \`UserDetailsService\`](#/docs/springsec-03) → [§3.3.2 Hiện thực contract \`UserDetailsService\`](#/docs/springsec-03) → [§3.3.3 Hiện thực contract \`UserDetailsManager\`](#/docs/springsec-03).

**Bẫy.** Nhét việc tạo/sửa/xóa user vào \`UserDetailsService\`. Contract đó cố tình chỉ có **một** phương thức — tìm user theo username — vì đó là việc duy nhất framework cần để hoàn tất authentication. Ứng dụng nào cũng cần quản lý user thì mới dùng \`UserDetailsManager\`. Bẫy thứ hai: \`loadUserByUsername\` trả \`null\` khi không tìm thấy; contract yêu cầu ném \`UsernameNotFoundException\`.

**Tự kiểm tra.** Sách nêu lợi thế gì của \`JdbcUserDetailsManager\` so với một hiện thực dựa trên JPA? Kể tên ba hiện thực \`UserDetailsManager\` mà Spring Security cung cấp sẵn.`,
      },
      {
        id: "ss-w2-3",
        text: "`PasswordEncoder` — hợp đồng hai chiều và cách chọn thuật toán",
        lesson: `**Mục tiêu.** Nói được vì sao contract này phải có **hai** phương thức, và chọn được hiện thực phù hợp thay vì chọn theo thói quen.

**Đọc.** [§4.1.1 Contract \`PasswordEncoder\`](#/docs/springsec-04) → [§4.1.2 Hiện thực \`PasswordEncoder\` của riêng bạn](#/docs/springsec-04) → [§4.1.3 Lựa chọn trong số các hiện thực có sẵn](#/docs/springsec-04) → [§4.1.4 Nhiều chiến lược encode với \`DelegatingPasswordEncoder\`](#/docs/springsec-04).

**Bẫy.** Nghĩ \`encode()\` là đủ. Băm là hàm một chiều, nên luôn phải có \`matches()\` đi kèm — và \`matches()\` không phải là "băm lại rồi so chuỗi" với mọi thuật toán, vì các thuật toán có salt sinh ra kết quả khác nhau mỗi lần. Bẫy thứ hai: đổi thuật toán băm trên hệ thống đang chạy mà không qua \`DelegatingPasswordEncoder\` — mọi mật khẩu cũ trong database lập tức không so khớp được nữa.

**Tự kiểm tra.** \`DelegatingPasswordEncoder\` nhận biết mật khẩu nào dùng thuật toán nào bằng cách nào? Nếu bạn phải chuyển dần từ một thuật toán yếu sang \`bcrypt\` mà không bắt user đặt lại mật khẩu, bạn làm thế nào?`,
      },
      {
        id: "ss-w2-4",
        text: "Spring Security Crypto module — key generator và encryptor",
        lesson: `**Mục tiêu.** Phân biệt được hashing và encryption, và biết SSCM cho sẵn những tiện ích nào để không phải tự viết.

**Đọc.** [§4.2.1 Sử dụng key generator](#/docs/springsec-04) → [§4.2.2 Encrypt và decrypt secret bằng encryptor](#/docs/springsec-04).

**Bẫy.** Dùng encryptor cho mật khẩu user. Mật khẩu thì **băm**, không mã hoá — mã hoá có nghĩa là ai có khoá thì đọc lại được, đúng điều bạn không muốn với mật khẩu. Encryptor dành cho những bí mật mà ứng dụng cần đọc lại được (ví dụ token của bên thứ ba).

**Tự kiểm tra.** Sách phân biệt \`BytesKeyGenerator\` và \`StringKeyGenerator\` ở chỗ nào? Một encryptor "text" và một encryptor "byte" khác nhau thế nào về đầu vào/đầu ra?`,
      },
    ],
  },
  {
    id: "ss-w3",
    week: "Tuần 3",
    title: "Filter chain và hiện thực authentication",
    goal: "Đọc được filter chain như một chuỗi có thứ tự, chèn được filter của riêng bạn đúng chỗ, và viết được một `AuthenticationProvider` hoàn chỉnh kèm hiểu biết về `SecurityContext`.",
    practice: "Bật `logging.level.org.springframework.security=DEBUG` và đọc danh sách filter mà ứng dụng in ra lúc khởi động. Sau đó viết một filter ghi log mã request rồi chèn nó trước `BasicAuthenticationFilter`, và kiểm chứng thứ tự bằng log.",
    resources: [
      { label: "SSIA 05 — Bảo mật của web app bắt đầu từ filter", href: "#/docs/springsec-05" },
      { label: "SSIA 06 — Hiện thực authentication", href: "#/docs/springsec-06" },
      { label: "SSIA 03 — Quản lý user (ôn `UserDetailsService`)", href: "#/docs/springsec-03" },
    ],
    items: [
      {
        id: "ss-w3-1",
        text: "Filter chain và ba cách chèn filter của bạn vào",
        lesson: `**Mục tiêu.** Giải thích được filter chain nằm ở đâu trong kiến trúc, và chọn đúng một trong ba cách chèn: trước, sau, hay tại vị trí của một filter có sẵn.

**Đọc.** [§5.1 Hiện thực filter trong kiến trúc Spring Security](#/docs/springsec-05) → [§5.2 Thêm filter vào trước](#/docs/springsec-05) → [§5.3 Thêm filter vào sau](#/docs/springsec-05) → [§5.4 Thêm filter tại vị trí của một filter khác](#/docs/springsec-05).

**Bẫy.** Cái sách nói thẳng ở phần tóm tắt: nhiều filter đặt **tại cùng một vị trí** thì thứ tự thực thi giữa chúng là **không xác định**. Đừng dựa vào thứ tự đó. Bẫy thứ hai: quên gọi \`filterChain.doFilter(request, response)\` trong filter của mình — request chết im lặng, không lỗi, không response.

**Tự kiểm tra.** Đặt một filter *sau* \`BasicAuthenticationFilter\` thì trong filter đó bạn đọc được gì mà đặt *trước* thì không? "Tại vị trí của" có nghĩa là thay thế filter cũ không?`,
      },
      {
        id: "ss-w3-2",
        text: "Các hiện thực `Filter` mà Spring Security cho sẵn",
        lesson: `**Mục tiêu.** Biết trước khi tự viết filter thì framework đã có sẵn cái gì, để không viết lại thứ đã có.

**Đọc.** [§5.5 Các hiện thực filter do Spring Security cung cấp](#/docs/springsec-05). Đọc kèm danh sách filter mà log DEBUG in ra ở phần thực hành — đối chiếu tên trong log với tên trong mục này.

**Bẫy.** Tự viết filter để làm việc mà một filter có sẵn đã làm (ghi log request, xử lý CORS, đọc CSRF token). Mỗi filter tự viết là một chỗ có thể sai thứ tự và một chỗ phải tự bảo trì.

**Tự kiểm tra.** Trong log DEBUG lúc khởi động, filter nào đứng đầu chuỗi và filter nào đứng cuối? Vì sao \`OncePerRequestFilter\` lại là lớp cha đáng dùng cho filter tự viết?`,
      },
      {
        id: "ss-w3-3",
        text: "Viết `AuthenticationProvider` tùy chỉnh",
        lesson: `**Mục tiêu.** Hiện thực đủ hai phương thức của contract và biết \`supports()\` quyết định điều gì.

**Đọc.** [§6.1.1 Biểu diễn request trong quá trình authentication](#/docs/springsec-06) → [§6.1.2 Hiện thực logic authentication tùy chỉnh](#/docs/springsec-06) → [§6.1.3 Áp dụng logic authentication tùy chỉnh](#/docs/springsec-06).

**Bẫy.** Viết hết logic vào \`authenticate()\` — tự tìm user, tự so khớp mật khẩu. Sách nhấn mạnh ở tóm tắt: giữ trách nhiệm tách rời, provider **ủy quyền** việc tìm user cho \`UserDetailsService\` và việc kiểm chứng mật khẩu cho \`PasswordEncoder\`. Bẫy thứ hai: \`authenticate()\` trả về đối tượng \`Authentication\` vẫn còn mang mật khẩu thô.

**Tự kiểm tra.** \`supports()\` trả \`false\` cho một kiểu \`Authentication\` thì chuyện gì xảy ra với request? Khi authentication thất bại, bạn trả \`null\` hay ném exception — và hai cách đó khác nhau ở đâu?`,
      },
      {
        id: "ss-w3-4",
        text: "`SecurityContext`, ba chiến lược lưu giữ, và HTTP Basic vs form login",
        lesson: `**Mục tiêu.** Lấy được user hiện tại ở bất kỳ tầng nào, và biết chuyện gì xảy ra khi code của bạn tự tạo thread.

**Đọc.** [§6.2.1 Chiến lược lưu giữ cho security context](#/docs/springsec-06) → [§6.2.2 cho lời gọi bất đồng bộ](#/docs/springsec-06) → [§6.2.3 cho ứng dụng standalone](#/docs/springsec-06) → [§6.2.4 \`DelegatingSecurityContextRunnable\`](#/docs/springsec-06) → [§6.2.5 \`DelegatingSecurityContextExecutorService\`](#/docs/springsec-06), rồi [§6.3.1 HTTP Basic](#/docs/springsec-06) và [§6.3.2 form-based login](#/docs/springsec-06).

**Bẫy.** Cái sách cảnh báo rõ nhất: \`MODE_INHERITABLETHREADLOCAL\` chỉ áp dụng cho thread **do Spring quản lý**. Thread bạn tự \`new Thread(...)\` sẽ không có security context, và \`SecurityContextHolder.getContext().getAuthentication()\` trả về rỗng — đó là lúc cần \`DelegatingSecurityContextRunnable\` / \`...Callable\` / \`...ExecutorService\`.

**Tự kiểm tra.** Ba chế độ \`MODE_THREADLOCAL\`, \`MODE_INHERITABLETHREADLOCAL\`, \`MODE_GLOBAL\` khác nhau ở phạm vi nào? Dùng chung \`formLogin()\` và \`httpBasic()\` trong một ứng dụng có được không, và khi đó request không kèm credential nhận về gì?`,
      },
    ],
  },
  {
    id: "ss-w4",
    week: "Tuần 4",
    title: "Authorization ở mức endpoint",
    goal: "Phân biệt dứt khoát authority và role, và chọn đúng matcher để áp quy tắc lên đúng tập request — không rộng hơn, không hẹp hơn.",
    practice: "Trong một ứng dụng có ba endpoint, cấu hình: một endpoint mở cho tất cả, một chỉ cho authority `read`, một chỉ cho role `ADMIN`. Rồi viết `curl` cho cả bốn trường hợp (không credential, sai credential, đúng nhưng thiếu quyền, đủ quyền) và ghi lại status nhận được.",
    resources: [
      { label: "SSIA 07 — Authorization ở mức endpoint: hạn chế quyền truy cập", href: "#/docs/springsec-07" },
      { label: "SSIA 08 — Authorization ở mức endpoint: áp dụng các hạn chế", href: "#/docs/springsec-08" },
    ],
    items: [
      {
        id: "ss-w4-1",
        text: "Authority và role — hai thứ khác nhau, một cơ chế",
        lesson: `**Mục tiêu.** Nói được role thực chất là gì dưới lớp vỏ, và vì sao \`hasRole("ADMIN")\` lại đi cùng authority \`ROLE_ADMIN\`.

**Đọc.** [§7.1.1 Hạn chế truy cập dựa trên authority của user](#/docs/springsec-07) → [§7.1.2 Hạn chế truy cập dựa trên role của user](#/docs/springsec-07).

**Bẫy.** Cái bẫy kinh điển: khai authority là \`"ADMIN"\` rồi cấu hình \`hasRole("ADMIN")\` — không khớp, vì role được lưu dưới dạng authority có tiền tố \`ROLE_\`. Hoặc ngược lại: khai \`"ROLE_ADMIN"\` rồi gọi \`hasRole("ROLE_ADMIN")\`, thành \`ROLE_ROLE_ADMIN\`. Đọc kỹ chỗ sách nói ai thêm tiền tố và thêm lúc nào.

**Tự kiểm tra.** \`hasAuthority("ROLE_ADMIN")\` và \`hasRole("ADMIN")\` có tương đương không? Khi nào bạn nên mô hình hoá bằng authority mịn thay vì bằng role?`,
      },
      {
        id: "ss-w4-2",
        text: "`permitAll()`, `denyAll()` và thứ tự authentication → authorization",
        lesson: `**Mục tiêu.** Giải thích được vì sao một endpoint \`permitAll()\` vẫn có thể trả 401, và dùng \`denyAll()\` đúng mục đích.

**Đọc.** [§7.1.3 Chặn quyền truy cập tới tất cả endpoint](#/docs/springsec-07) và đọc lại phần đầu chương về quan hệ authentication–authorization.

**Bẫy.** Tưởng \`permitAll()\` nghĩa là "bỏ qua bảo mật cho endpoint này". Không phải. Authorization luôn chạy **sau** authentication, nên nếu request kèm credential sai, nó chết ở bước authentication và không bao giờ tới được quy tắc \`permitAll()\`. Bẫy thứ hai: dùng \`denyAll()\` cho endpoint "nội bộ" rồi ngạc nhiên vì chính service của mình cũng không gọi được — \`denyAll()\` chặn tất cả, không có ngoại lệ.

**Tự kiểm tra.** Gọi một endpoint \`permitAll()\` kèm mật khẩu sai thì nhận status nào, vì sao? 401 và 403 khác nhau thế nào về ý nghĩa?`,
      },
      {
        id: "ss-w4-3",
        text: "Chọn request bằng `requestMatchers()` — theo path và theo HTTP method",
        lesson: `**Mục tiêu.** Áp được quy tắc khác nhau cho các request khác nhau, và đọc được thứ tự các quy tắc trong cấu hình.

**Đọc.** [§8.1 Dùng phương thức \`requestMatchers()\` để chọn endpoint](#/docs/springsec-08) → [§8.2 Chọn request để áp dụng hạn chế authorization](#/docs/springsec-08).

**Bẫy.** Thứ tự khai báo có ý nghĩa: quy tắc khớp **đầu tiên** thắng. Đặt \`anyRequest().permitAll()\` lên trên thì mọi quy tắc phía dưới thành vô nghĩa. Bẫy thứ hai: quên rằng \`GET /product\` và \`POST /product\` là hai request khác nhau — cấu hình theo path mà không kèm HTTP method sẽ mở cả hai.

**Tự kiểm tra.** Cùng một path nhưng muốn \`GET\` cho mọi user đã đăng nhập và \`DELETE\` chỉ cho admin thì viết thế nào? Nếu không có dòng \`anyRequest()\` nào thì những request không khớp quy tắc nào sẽ ra sao?`,
      },
      {
        id: "ss-w4-4",
        text: "Khi path expression không đủ: matcher bằng regex",
        lesson: `**Mục tiêu.** Biết lúc nào phải bỏ path matcher để chuyển sang regex, và trả giá gì khi làm vậy.

**Đọc.** [§8.3 Dùng biểu thức chính quy với request matcher](#/docs/springsec-08).

**Bẫy.** Dùng regex khi path expression vẫn làm được — regex khó đọc, khó test, và một dấu \`.\` quên escape có thể mở rộng phạm vi khớp ra ngoài ý định. Sách đặt regex ở cuối chương là có lý do: đó là phương án khi các cách trước không đủ, không phải mặc định.

**Tự kiểm tra.** Nêu một yêu cầu authorization mà path expression không diễn đạt nổi nhưng regex thì được. Khi dùng regex matcher, bạn kiểm chứng nó đúng bằng cách nào trước khi lên production?`,
      },
    ],
  },
  {
    id: "ss-w5",
    week: "Tuần 5",
    title: "CSRF và CORS",
    goal: "Hiểu hai cơ chế thường bị tắt bừa nhất: giải thích được CSRF tấn công kiểu gì và Spring Security chặn nó ở đâu, và nói được CORS là nới lỏng chứ không phải siết chặt.",
    practice: "Dựng một form HTML gửi POST tới ứng dụng của bạn: lần một không kèm CSRF token (xem nó bị chặn), lần hai có token. Sau đó viết một trang tĩnh chạy ở cổng khác gọi API bằng `fetch` để tự mình thấy lỗi CORS trong console trình duyệt, rồi sửa bằng cấu hình.",
    resources: [
      { label: "SSIA 09 — Cấu hình bảo vệ CSRF", href: "#/docs/springsec-09" },
      { label: "SSIA 10 — Cấu hình CORS", href: "#/docs/springsec-10" },
      { label: "SSIA 05 — Filter chain (CSRF và CORS đều là filter)", href: "#/docs/springsec-05" },
    ],
    items: [
      {
        id: "ss-w5-1",
        text: "CSRF hoạt động thế nào và Spring Security chặn nó ở đâu",
        lesson: `**Mục tiêu.** Kể lại được kịch bản tấn công CSRF bằng lời của bạn, và chỉ đúng vào filter chịu trách nhiệm chặn nó.

**Đọc.** [§9.1 Bảo vệ CSRF hoạt động thế nào trong Spring Security](#/docs/springsec-09) → [§9.2 Dùng bảo vệ CSRF trong các tình huống thực tế](#/docs/springsec-09).

**Bẫy.** Tắt CSRF vì "API của tôi là REST nên không cần". Điều kiện thật sự không phải là REST hay không, mà là trình duyệt có tự động đính kèm thông tin xác thực (cookie session) vào request hay không. API dùng token trong header \`Authorization\` thì không bị CSRF; API dùng cookie session thì có, dù nó có "REST" đến đâu.

**Tự kiểm tra.** Vì sao CSRF chỉ nhắm vào các request làm thay đổi trạng thái chứ hiếm khi nhắm vào \`GET\`? Điểm vào của logic bảo vệ CSRF trong kiến trúc Spring Security là gì?`,
      },
      {
        id: "ss-w5-2",
        text: "Tùy chỉnh bảo vệ CSRF qua ba contract",
        lesson: `**Mục tiêu.** Biết ba điểm mở rộng và chọn đúng cái cần thay khi kiến trúc của bạn không hợp với mặc định.

**Đọc.** [§9.3 Tùy chỉnh bảo vệ CSRF](#/docs/springsec-09). Ba contract cần nhớ: \`CsrfToken\` (bản thân token), \`CsrfTokenRepository\` (tạo, lưu, nạp token), \`CsrfTokenRequestHandler\` (đặt token lên request).

**Bẫy.** Lưu CSRF token vào session mặc định rồi chạy nhiều instance sau load balancer không có session dính. Đó chính là lúc cần \`CsrfTokenRepository\` tùy chỉnh — lưu token ở nơi mọi instance đọc được, thay vì tắt CSRF cho xong.

**Tự kiểm tra.** Nếu frontend là một SPA gọi API cùng domain bằng cookie session, bạn cần thay contract nào trong ba cái trên? Token được sinh ra ở request nào và được kiểm ở request nào?`,
      },
      {
        id: "ss-w5-3",
        text: "CORS — nới lỏng có kiểm soát, bằng `@CrossOrigin` hoặc tập trung",
        lesson: `**Mục tiêu.** Nói đúng bản chất: trình duyệt mặc định **cấm** cross-origin, và CORS là cách bạn cho phép có chọn lọc. Cấu hình được cả hai kiểu.

**Đọc.** [§10.1 CORS hoạt động thế nào?](#/docs/springsec-10) → [§10.2 Áp dụng chính sách CORS bằng annotation \`@CrossOrigin\`](#/docs/springsec-10) → [§10.3 Áp dụng CORS bằng \`CorsConfigurer\`](#/docs/springsec-10).

**Bẫy.** Nghĩ CORS là một cơ chế bảo mật phía server bảo vệ API của bạn. Nó là quy ước của **trình duyệt**; \`curl\` và mọi client không phải trình duyệt bỏ qua nó hoàn toàn. Nên cấu hình CORS rộng rãi không "mở toang" API — nhưng cũng đừng nhầm rằng CORS chặt sẽ bảo vệ được API. Bẫy thứ hai: rắc \`@CrossOrigin\` khắp controller rồi không ai biết chính sách thật của hệ thống là gì.

**Tự kiểm tra.** Vì sao sách khuyên cấu hình CORS tập trung bằng \`cors()\` của \`HttpSecurity\` thay vì rắc annotation? Request preflight \`OPTIONS\` xuất hiện khi nào?`,
      },
    ],
  },
];
