// Lộ trình đọc Spring Security in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Spring Security in Action", ấn bản 2 —
// Laurențiu Spilcă, Manning 2024. Thư mục nguồn: spring-security-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Bản PDF gốc có một số dòng bị cắt cụt ở mép trang, được đánh dấu `[…]` ngay
// trong tệp nguồn (xem cảnh báo đầu spring-security-vi/README.md).
//
// Số dấu (đã trừ dòng chú thích đầu tệp): ch1: 0 · ch2: 42 · ch3: 0 · ch4: 2 ·
// ch5: 1 · ch6: 4 · ch7: 10 · ch8: 23. §2.2 là mục dính nhiều nhất trong tuần
// 1–5 (và của cả chương 2 nói chung). Ở những chỗ đó, bài học chỉ khẳng định
// phần văn bản còn nguyên vẹn — tiêu đề mục, danh sách gạch đầu dòng, đoạn mã —
// và nói rõ với người học rằng mục đó đọc sẽ vấp.

export const springsecWeeksPart1 = [
  {
    id: "ss-w1",
    week: "Tuần 1",
    title: "Nền tảng bảo mật & dự án đầu tiên",
    goal: "Dựng được một ứng dụng Spring Boot có Spring Security, giải thích được điều gì xảy ra khi bạn chỉ thêm dependency mà chưa viết dòng cấu hình nào.",
    practice: "Tạo dự án Spring Boot với `spring-boot-starter-security`, chạy lên, gọi thử một endpoint bằng `curl` không kèm thông tin xác thực rồi kèm thông tin xác thực mặc định, và đọc mật khẩu sinh ra trong log.",
    resources: [
      { label: "SSIA 00 — Lời giới thiệu & về cuốn sách", href: "#/docs/springsec-00" },
      { label: "SSIA 01 — Bảo mật ngày nay", href: "#/docs/springsec-01" },
      { label: "SSIA 02 — Xin chào, Spring Security", href: "#/docs/springsec-02" },
      { label: "SSIA Phụ lục A — Liên kết tài liệu chính thức", href: "#/docs/springsec-pl-a" },
      { label: "docs.spring.io — Spring Security Reference", href: "https://docs.spring.io/spring-security/reference/" },
      { label: "🌱 Sang lĩnh vực Spring Start Here — lộ trình đọc 8 tuần", href: "#/roadmap/spring-start" },
    ],
    items: [
      {
        id: "ss-w1-1",
        text: "Bảo mật phần mềm là gì, và vì sao một lỗ hổng lại đắt đến thế",
        lesson: `**Mục tiêu.** Nói được bảo mật cấp ứng dụng bao gồm những gì, và lập luận được vì sao đầu tư sớm rẻ hơn khắc phục hậu quả.

**Đọc.** [§1.2 Bảo mật phần mềm là gì?](#/docs/springsec-01) rồi [§1.3 Tại sao bảo mật lại quan trọng?](#/docs/springsec-01) — đọc kỹ ba ví dụ giả định gần cuối §1.3. §1.1 và §1.4 chỉ cần lướt: chúng giới thiệu Spring Security và bố cục cuốn sách.

**Bẫy.** Nghĩ "dữ liệu nhạy cảm" chỉ là chi tiết thẻ tín dụng. §1.2 xếp cả số điện thoại, địa chỉ email và số định danh cá nhân vào nhóm nhạy cảm — bất cứ thứ gì người dùng coi là riêng tư. Bẫy thứ hai: coi bảo mật là chuyện của tầng mạng hay tầng triển khai, không phải của bạn. Sách nói bảo mật được áp dụng theo nhiều lớp, và khi lo cho một lớp thì nguyên tắc tốt nhất là **giả định lớp phía trên nó hoàn toàn không tồn tại** — không được ỷ vào tường lửa để bỏ qua việc xác thực yêu cầu giữa hai dịch vụ nội bộ.

**Tự kiểm tra.** Theo ba ví dụ ở §1.3, loại tổn thất nào được sách nói là có thể còn tốn kém hơn cả thiệt hại tiền bạc trực tiếp? Và theo §1.2, dữ liệu "tĩnh" khác dữ liệu "đang truyền tải" ở chỗ nào?`,
      },
      {
        id: "ss-w1-2",
        text: "Dựng dự án Spring Security đầu tiên và đọc hiểu cấu hình mặc định",
        lesson: `**Mục tiêu.** Chạy được dự án \`ssia-ch2-ex1\`, gọi endpoint \`/hello\` ở cả hai trạng thái có và không có thông tin xác thực, và đọc đúng thứ Spring Boot in ra console.

**Đọc.** [§2.1 Khởi động dự án đầu tiên](#/docs/springsec-02) — gõ lại Danh sách mã nguồn 2.1 (chỉ hai dependency) và 2.2 (\`HelloController\`), rồi chạy hết các lệnh \`curl\` trong mục. Khung "Gọi endpoint bằng phương thức xác thực HTTP Basic" cho bạn thấy cờ \`-u\` thực chất làm gì.

**Bẫy.** Tưởng mật khẩu sinh ra là cố định. Sách nói rõ mỗi lần khởi chạy ứng dụng lại sinh một mật khẩu mới và in ra console; tên đăng nhập mặc định là \`user\`. Bẫy thứ hai nằm ở mã trạng thái: gọi không kèm thông tin xác thực trả về **401 Unauthorized**, và sách có hẳn một ghi chú rằng cái tên này gây mơ hồ — 401 thường dùng cho xác thực thất bại, còn phân quyền thất bại mới là **403 Forbidden**.

**Tự kiểm tra.** Vì sao mở \`/hello\` bằng trình duyệt lại hiện biểu mẫu đăng nhập chứ không phải hộp thoại HTTP Basic? Và chuỗi bạn đặt sau chữ \`Basic\` trong header \`Authorization\` được tạo ra bằng phép biến đổi nào?`,
      },
      {
        id: "ss-w1-3",
        text: "Thiết kế lớp: từ bộ lọc tới AuthenticationProvider và UserDetailsService",
        lesson: `**Mục tiêu.** Kể đúng tên và thứ tự sáu thành phần tham gia luồng xác thực, và chỉ ra hai bean nào Spring Boot tự cấu hình sẵn cho bạn.

**Đọc.** [§2.2 Bức tranh tổng thể về thiết kế lớp trong Spring Security](#/docs/springsec-02) — trọng tâm là danh sách sáu thành phần và hai bean được tự động cấu hình. Lưu ý trước: đây là mục dính nhiều dòng bị cắt cụt \`[…]\` nhất trong bản dịch, nên bám vào các gạch đầu dòng còn nguyên và đọc bù bằng Hình 3.1 ở chương sau. Khung "HTTP và HTTPS" ở cuối mục có thể để dành.

**Bẫy.** Gộp \`AuthenticationProvider\` với \`UserDetailsService\` làm một. §2.2 tách bạch: bộ cung cấp xác thực **chịu trách nhiệm triển khai logic xác thực thực tế**, dịch vụ thông tin người dùng lo phần quản lý thông tin người dùng, còn bộ mã hoá mật khẩu là thứ bộ cung cấp xác thực gọi tới. Bẫy thứ hai: tin rằng \`UserDetailsService\` mặc định dùng được cho hệ thống thật — sách gọi bản triển khai mặc định đó chỉ là một bản thử nghiệm khái niệm.

**Tự kiểm tra.** Trong sáu thành phần §2.2 liệt kê, thành phần nào giữ dữ liệu xác thực sau khi quá trình xác thực kết thúc? Và hai nhiệm vụ mà \`PasswordEncoder\` đảm nhận là gì?`,
      },
      {
        id: "ss-w1-4",
        text: "Ghi đè cấu hình mặc định — ba thứ đầu tiên bạn luôn phải thay",
        lesson: `**Mục tiêu.** Ghi đè được \`UserDetailsService\`, \`PasswordEncoder\` và quy tắc phân quyền endpoint, rồi giải thích được vì sao ba thứ này đi liền nhau.

**Đọc.** [§2.3 Ghi đè cấu hình mặc định](#/docs/springsec-02) — làm §2.3.1 theo đúng chuỗi Danh sách mã nguồn 2.3 → 2.5, rồi §2.3.2 với 2.6 → 2.8. §2.3.3 cho thấy cùng một kết quả có hai đường đi (khai bean vào context, hay cấu hình ngay trong bean \`SecurityFilterChain\`). §2.3.4 và §2.3.5 chỉ cần lướt — Chương 6 sẽ quay lại đầy đủ.

**Bẫy.** Khai \`UserDetailsService\` của mình rồi quên \`PasswordEncoder\`. Sách dựng đúng cái bẫy này rồi cho bạn xem vết lỗi: bean \`PasswordEncoder\` chỉ được tự cấu hình khi bạn còn dùng \`UserDetailsService\` mặc định, ghi đè một cái là phải khai cả cái kia, nếu không ứng dụng ném \`IllegalArgumentException: There is no PasswordEncoder mapped for the id "null"\`. Bẫy thứ hai: nghĩ khai bean là xong — một \`new InMemoryUserDetailsManager()\` rỗng thì không có người dùng nào, mà mật khẩu tự sinh cũng đã biến mất khỏi console.

**Tự kiểm tra.** Giữa Danh sách mã nguồn 2.7 và 2.8, việc đổi \`authenticated()\` thành \`permitAll()\` làm thay đổi điều gì khi bạn gọi \`/hello\` không kèm thông tin xác thực? Và \`Customizer.withDefaults()\` thực chất trả về cái gì?`,
      },
    ],
  },
  {
    id: "ss-w2",
    week: "Tuần 2",
    title: "Quản lý người dùng",
    goal: "Mô tả được người dùng theo cách Spring Security hiểu, và tự quyết định lấy người dùng từ đâu — bộ nhớ, cơ sở dữ liệu SQL hay nguồn của riêng bạn.",
    practice: "Lấy dự án tuần 1, thay `InMemoryUserDetailsManager` bằng một `UserDetailsService` bạn tự viết, rồi tách lớp thực thể JPA `User` khỏi lớp `SecurityUser` triển khai `UserDetails` như §3.2.5. Cuối tuần đổi sang `JdbcUserDetailsManager` với hai bảng `users` và `authorities`.",
    resources: [
      { label: "SSIA 03 — Quản lý người dùng", href: "#/docs/springsec-03" },
      { label: "Nhắc lại luồng xác thực: SSIA 02 §2.2", href: "#/docs/springsec-02" },
      { label: "docs.spring.io — Spring Security Reference", href: "https://docs.spring.io/spring-security/reference/" },
    ],
    items: [
      {
        id: "ss-w2-1",
        text: "Các thành phần tham gia luồng xác thực",
        lesson: `**Mục tiêu.** Vẽ lại được luồng xác thực từ bộ lọc tới ngữ cảnh bảo mật, và nói được \`UserDetailsService\` khác \`UserDetailsManager\` ở chỗ nào.

**Đọc.** [§3.1 Triển khai xác thực trong Spring Security](#/docs/springsec-03) — mục ngắn, đọc trọn vẹn. Chú thích của Hình 3.1 và Hình 3.2 mới là phần đáng chép lại: chúng nói ai gọi ai. Chưa cần đụng tới mã nguồn ở mục này.

**Bẫy.** Nghĩ \`UserDetailsManager\` là bản "xịn hơn" luôn nên dùng thay \`UserDetailsService\`. Sách nói: \`UserDetailsService\` **chỉ chịu trách nhiệm truy xuất người dùng theo tên đăng nhập**, và đó là hành động duy nhất framework cần để hoàn tất xác thực; \`UserDetailsManager\` mới bổ sung thêm hành vi thêm, sửa, xoá người dùng. Sách gọi việc tách đôi này là một ví dụ đẹp của nguyên lý phân tách interface — ứng dụng chỉ cần đăng nhập thì triển khai \`UserDetailsService\` là đủ, framework không ép bạn viết những thứ bạn không dùng.

**Tự kiểm tra.** Trong luồng ở Hình 3.1, thành phần nào đón yêu cầu đầu tiên và nó chuyển giao nhiệm vụ xác thực cho ai? Và theo §3.1, cái gì được dùng để biểu diễn một người dùng cho cả hai giao ước trên?`,
      },
      {
        id: "ss-w2-2",
        text: "UserDetails và GrantedAuthority — mô tả người dùng",
        lesson: `**Mục tiêu.** Viết được một lớp triển khai \`UserDetails\`, và giải thích được vì sao tách nó khỏi lớp thực thể JPA lại sạch hơn.

**Đọc.** [§3.2 Mô tả người dùng](#/docs/springsec-03) — §3.2.1 cho bảy phương thức của \`UserDetails\`, §3.2.2 cho \`GrantedAuthority\`, rồi tự gõ Đoạn mã 3.2 ở §3.2.3. §3.2.4 giới thiệu lớp dựng \`User\`. §3.2.5 là mục đáng đọc chậm nhất: nó đặt cạnh nhau một lớp \`User\` gánh hai vai (Đoạn mã 3.9) và cặp \`User\` + \`SecurityUser\` (Đoạn mã 3.10, 3.11).

**Bẫy.** Đọc \`isAccountNonExpired()\` và ba người anh em của nó theo nghĩa ngược. Sách có hẳn ghi chú rằng bốn cái tên cuối trong \`UserDetails\` bị chê là chưa khôn ngoan xét về mã nguồn sạch — trả về \`true\` nghĩa là tài khoản **không** hết hạn, tức là còn dùng được. Bẫy thứ hai: tạo người dùng không quyền hạn nào. §3.2.2 nói thẳng một người dùng phải có ít nhất một quyền hạn.

**Tự kiểm tra.** \`GrantedAuthority\` có mấy phương thức trừu tượng, và hệ quả của con số đó lên cách sách viết các ví dụ là gì? Và trong Đoạn mã 3.11, \`SecurityUser\` lấy dữ liệu từ đâu ra?`,
      },
      {
        id: "ss-w2-3",
        text: "UserDetailsService và UserDetailsManager — tự quản lý người dùng",
        lesson: `**Mục tiêu.** Chọn được giữa việc tự viết \`UserDetailsService\` và dùng \`JdbcUserDetailsManager\`, và biết phải chuẩn bị gì trong cơ sở dữ liệu.

**Đọc.** [§3.3 Hướng dẫn Spring Security cách quản lý người dùng](#/docs/springsec-03) — §3.3.1 cho giao ước một phương thức, §3.3.2 cho ví dụ tự viết một \`UserDetailsService\` in-memory, §3.3.3 là mục dài nhất: đọc phần \`JdbcUserDetailsManager\` cùng hai câu lệnh tạo bảng \`users\` và \`authorities\` (Đoạn mã 3.16, 3.17). Phần \`LdapUserDetailsManager\` ở cuối chỉ cần lướt cho biết là có.

**Bẫy.** Trả về \`null\` từ \`loadUserByUsername()\` khi không tìm thấy người dùng. Giao ước khai \`throws UsernameNotFoundException\`, nhưng sách ghi chú rằng đây là một \`RuntimeException\` kế thừa từ \`AuthenticationException\`, nên mệnh đề \`throws\` chỉ mang tính tài liệu hoá — trình biên dịch sẽ không nhắc bạn. Bẫy thứ hai: nghĩ \`JdbcUserDetailsManager\` bắt bạn đặt tên bảng và cột theo đúng mặc định của nó; §3.3.3 chỉ ra bạn hoàn toàn có thể thay các câu truy vấn mà nó dùng.

**Tự kiểm tra.** \`UserDetailsManager\` thêm những phương thức nào so với \`UserDetailsService\`? Và trong hai bảng của ví dụ \`JdbcUserDetailsManager\`, bảng nào lưu quyền hạn và nó nối với người dùng qua cột nào?`,
      },
    ],
  },
  {
    id: "ss-w3",
    week: "Tuần 3",
    title: "Quản lý mật khẩu",
    goal: "Chọn được bộ mã hoá mật khẩu phù hợp thay vì chép bừa một dòng từ mạng, và xử lý được tình huống phải đổi thuật toán trên hệ thống đang chạy.",
    practice: "Thay `NoOpPasswordEncoder` trong dự án tuần 2 bằng `BCryptPasswordEncoder`, sinh lại chuỗi băm cho người dùng mẫu. Sau đó dựng một `DelegatingPasswordEncoder` chứa cả `noop` lẫn `bcrypt`, lưu song song hai kiểu chuỗi băm trong bảng `users` và kiểm chứng cả hai người dùng đều đăng nhập được.",
    resources: [
      { label: "SSIA 04 — Quản lý mật khẩu", href: "#/docs/springsec-04" },
      { label: "Nhắc lại chỗ PasswordEncoder được gọi: SSIA 03 §3.1", href: "#/docs/springsec-03" },
      { label: "SSIA Phụ lục B — Tài liệu đọc thêm", href: "#/docs/springsec-pl-b" },
      { label: "docs.spring.io — Password Storage", href: "https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html" },
    ],
    items: [
      {
        id: "ss-w3-1",
        text: "Giao ước PasswordEncoder và các cài đặt có sẵn",
        lesson: `**Mục tiêu.** Đọc được giao ước \`PasswordEncoder\` và chọn được một triển khai có sẵn thay vì tự viết lấy.

**Đọc.** [§4.1.1 Giao ước PasswordEncoder](#/docs/springsec-04) cho ba phương thức của interface. [§4.1.2 Tự triển khai PasswordEncoder của riêng bạn](#/docs/springsec-04) đọc nhanh, mục đích chỉ là thấy \`encode()\` và \`matches()\` phải khớp nhau (Đoạn mã 4.1 và 4.2). Rồi [§4.1.3 Lựa chọn từ các triển khai PasswordEncoder có sẵn](#/docs/springsec-04) — đây mới là mục cần đọc kỹ: năm triển khai và tham số khởi tạo của từng cái.

**Bẫy.** Ghi đè \`encode()\` mà quên \`matches()\` phải soi đúng kết quả của nó; sách nhấn rằng hai phương thức này luôn phải tương ứng nhau về mặt chức năng. Bẫy thứ hai là chọn nhầm triển khai: \`NoOpPasswordEncoder\` giữ nguyên mật khẩu ở dạng văn bản thô nên chỉ dùng cho ví dụ minh hoạ, còn \`StandardPasswordEncoder\` (SHA-256) đã bị khai tử và sách khuyên không dùng cho dự án mới.

**Tự kiểm tra.** Trong ba phương thức của giao ước \`PasswordEncoder\`, phương thức nào đã có sẵn triển khai mặc định? Và với \`BCryptPasswordEncoder\`, con số bạn truyền vào phương thức khởi tạo liên hệ thế nào với số vòng lặp thực tế?`,
      },
      {
        id: "ss-w3-2",
        text: "DelegatingPasswordEncoder và bài toán nâng cấp thuật toán",
        lesson: `**Mục tiêu.** Cấu hình được một \`DelegatingPasswordEncoder\`, và giải thích được nó gỡ bài toán đổi thuật toán giữa chừng bằng cách nào.

**Đọc.** [§4.1.4 Nhiều chiến lược mã hóa với DelegatingPasswordEncoder](#/docs/springsec-04) — đọc kịch bản mở đầu (thuật toán cũ lộ lỗ hổng, người dùng cũ không đổi được mật khẩu), rồi Đoạn mã 4.4 và ghi chú về cặp ngoặc nhọn. Cuối mục là lối tắt \`PasswordEncoderFactories.createDelegatingPasswordEncoder()\`. Khung "Encoding so với encrypting so với hashing" nằm ngay sau đó, đọc luôn cho gọn.

**Bẫy.** Nghĩ \`DelegatingPasswordEncoder\` tự mã hoá. Nó **không thực hiện thuật toán nào cả**: nó đọc tiền tố ở đầu chuỗi băm rồi uỷ quyền cho đúng triển khai tương ứng. Bẫy thứ hai: quên cặp ngoặc nhọn. Khoá trong \`Map\` là \`noop\`, \`bcrypt\`, \`scrypt\`, nhưng chuỗi băm lưu trong cơ sở dữ liệu phải viết là \`{noop}12345\` — sách nói rõ dấu \`{}\` là một phần của tiền tố và phải bao lấy tên khoá.

**Tự kiểm tra.** Trong Đoạn mã 4.4, tham số đầu tiên truyền cho \`new DelegatingPasswordEncoder(...)\` quyết định điều gì, và nó được dùng trong trường hợp nào? Và nhờ đâu mà mật khẩu cũ trong cơ sở dữ liệu vẫn đăng nhập được sau khi bạn đổi thuật toán cho người dùng mới?`,
      },
      {
        id: "ss-w3-3",
        text: "Spring Security Crypto: bộ tạo khoá và bộ mã hoá",
        lesson: `**Mục tiêu.** Biết mô-đun Spring Security Crypto cho sẵn những gì, để khỏi kéo thêm một thư viện mã hoá vào dự án.

**Đọc.** [§4.2 Tận dụng tối đa mô-đun Spring Security Crypto](#/docs/springsec-04) — hai gạch đầu dòng ở đầu mục đã chia sẵn bản đồ. [§4.2.1 Sử dụng bộ tạo khóa](#/docs/springsec-04) cho \`StringKeyGenerator\`, \`BytesKeyGenerator\` và lớp nhà máy \`KeyGenerators\`; [§4.2.2 Mã hóa và giải mã dữ liệu nhạy cảm bằng bộ mã hóa](#/docs/springsec-04) cho \`TextEncryptor\`, \`BytesEncryptor\` và lớp nhà máy \`Encryptors\`. Các đoạn mã ở đây rất ngắn và đứng độc lập — gõ thử từng cái.

**Bẫy.** Trộn lẫn bộ tạo khoá với bộ mã hoá. Sách phân vai ngay từ đầu §4.2: bộ tạo khoá tạo ra khoá cho thuật toán băm hoặc mã hoá, còn bộ mã hoá mới là thứ mã hoá và giải mã dữ liệu. Bẫy thứ hai: dùng \`KeyGenerators.secureRandom()\` ở chỗ cần một khoá ổn định — mỗi lần gọi \`generateKey()\` nó trả về một khoá khác; muốn cùng một giá trị khoá cho mọi lần gọi thì phải dùng \`KeyGenerators.shared()\`.

**Tự kiểm tra.** \`Encryptors.standard()\` và \`Encryptors.stronger()\` khác nhau ở điểm nào bên dưới lớp vỏ? Và \`Encryptors.text()\` với \`Encryptors.delux()\` lần lượt dựa trên bộ mã hoá byte nào?`,
      },
    ],
  },
  {
    id: "ss-w4",
    week: "Tuần 4",
    title: "Bộ lọc & phương thức xác thực",
    goal: "Chèn được bộ lọc của bạn vào đúng chỗ trong chuỗi, và thay được logic xác thực mặc định bằng logic của riêng bạn.",
    practice: "Viết một `Filter` kiểm tra header `Request-Id` và gắn nó trước `BasicAuthenticationFilter`; viết tiếp một bộ lọc ghi nhật ký gắn sau nó, rồi chuyển bộ lọc ghi nhật ký sang kế thừa `OncePerRequestFilter`. Sau đó viết một `AuthenticationProvider` riêng và in ra tên người dùng lấy từ `SecurityContext` trong controller.",
    resources: [
      { label: "SSIA 05 — Bảo mật ứng dụng web bắt đầu từ các bộ lọc", href: "#/docs/springsec-05" },
      { label: "SSIA 06 — Triển khai các phương thức xác thực", href: "#/docs/springsec-06" },
      { label: "Nhắc lại vai trò các thành phần: SSIA 02 §2.2", href: "#/docs/springsec-02" },
      { label: "docs.spring.io — Architecture", href: "https://docs.spring.io/spring-security/reference/servlet/architecture.html" },
    ],
    items: [
      {
        id: "ss-w4-1",
        text: "Chuỗi bộ lọc và cách chèn bộ lọc của bạn vào đúng chỗ",
        lesson: `**Mục tiêu.** Viết được một \`Filter\` và đặt nó vào đúng chỗ trong chuỗi bằng \`addFilterBefore()\`, \`addFilterAfter()\` hoặc \`addFilterAt()\`.

**Đọc.** [§5.1 Triển khai các bộ lọc trong kiến trúc Spring Security](#/docs/springsec-05) trước, để nắm ba tham số của \`doFilter()\` và ý niệm thứ tự. Rồi làm lần lượt [§5.2 Thêm một bộ lọc vào trước một bộ lọc hiện có trong chuỗi](#/docs/springsec-05), [§5.3 Thêm một bộ lọc vào sau một bộ lọc hiện có trong chuỗi](#/docs/springsec-05) và [§5.4 Thêm một bộ lọc tại vị trí của một bộ lọc khác trong chuỗi](#/docs/springsec-05) — mỗi mục là một dự án chạy được, đừng chỉ đọc.

**Bẫy.** Nghĩ "thêm tại vị trí" nghĩa là "thay thế". §5.1 cảnh báo bạn có thể có hai hay nhiều bộ lọc ở cùng một vị trí, và khi đó **thứ tự gọi chúng không được định nghĩa trước** — bộ lọc cũ vẫn nằm nguyên đó. Bẫy thứ hai: quên gọi \`filterChain.doFilter(request, response)\` ở nhánh hợp lệ. Không gọi thì yêu cầu dừng ngay tại bộ lọc của bạn — đó chính là cách Đoạn mã 5.2 chặn yêu cầu thiếu header \`Request-Id\` và trả về 400.

**Tự kiểm tra.** Trong ví dụ §5.2, vì sao bộ lọc kiểm tra header phải nằm **trước** \`BasicAuthenticationFilter\` chứ không phải sau? Và ở §5.4, ứng dụng trả về mã trạng thái nào khi giá trị header \`Authorization\` không khớp khoá tĩnh?`,
      },
      {
        id: "ss-w4-2",
        text: "Kế thừa lớp trừu tượng của Spring Security để viết bộ lọc",
        lesson: `**Mục tiêu.** Biết khi nào nên kế thừa một lớp trừu tượng của Spring Security thay vì triển khai thẳng giao diện \`Filter\`.

**Đọc.** [§5.5 Các triển khai bộ lọc do Spring Security cung cấp](#/docs/springsec-05) — mục ngắn, đọc trọn vẹn: \`GenericFilterBean\`, \`OncePerRequestFilter\`, Đoạn mã 5.9 (viết lại bộ lọc ghi nhật ký của §5.3), và ba gạch đầu dòng quan sát ở cuối. Chú ý gạch cuối cùng, về yêu cầu bất đồng bộ và yêu cầu điều phối lỗi.

**Bẫy.** Tin rằng một bộ lọc đã nằm trong chuỗi thì chạy đúng một lần cho mỗi yêu cầu. §5.5 nói thẳng: khi bạn thêm một bộ lọc vào chuỗi, **framework không đảm bảo nó chỉ được gọi duy nhất một lần** — đó chính là lý do \`OncePerRequestFilter\` tồn tại, và là lý do bộ lọc ghi nhật ký ở §5.3 có thể ghi trùng cùng một yêu cầu. Bẫy thứ hai là chọn nhầm lớp cha: kế thừa \`GenericFilterBean\` theo quán tính. Tác giả nói ông đã thấy quá nhiều lập trình viên làm vậy cho những tính năng chẳng đòi hỏi thêm gì, và khi được hỏi tại sao thì chính họ cũng không biết.

**Tự kiểm tra.** Khi kế thừa \`OncePerRequestFilter\`, bạn ghi đè phương thức nào thay cho \`doFilter()\`? Và nếu muốn một bộ lọc đã nằm trong chuỗi bỏ qua một số yêu cầu nhất định, §5.5 chỉ bạn ghi đè phương thức nào?`,
      },
      {
        id: "ss-w4-3",
        text: "AuthenticationProvider — viết logic xác thực của riêng bạn",
        lesson: `**Mục tiêu.** Viết được một \`AuthenticationProvider\` cho cơ chế xác thực không dựa trên cặp tên đăng nhập và mật khẩu.

**Đọc.** [§6.1 Tìm hiểu về AuthenticationProvider](#/docs/springsec-06) — §6.1.1 cho giao diện \`Authentication\` (sách chỉ yêu cầu nhớ ba phương thức, đừng ôm cả sáu), §6.1.2 cho hai phương thức của \`AuthenticationProvider\` và phép so sánh với ổ khoá cửa, §6.1.3 làm theo từng bước dự án \`ssia-ch6-ex1\`.

**Bẫy.** Trả về một đối tượng \`Authentication\` chưa hoàn tất. Sách nêu rõ hai lối ra của \`authenticate()\`: thành công thì trả về một thực thể mà \`isAuthenticated()\` cho \`true\` và mang đầy đủ thông tin chi tiết; thất bại thì ném \`AuthenticationException\`. Bẫy thứ hai: bỏ qua \`supports()\` vì tưởng nó phụ — \`AuthenticationManager\` dựa vào nó để chọn bộ cung cấp, và nếu không bộ cung cấp nào nhận diện được đối tượng \`Authentication\`, hoặc tất cả đều từ chối, kết quả vẫn là một \`AuthenticationException\`.

**Tự kiểm tra.** Phương thức nào của giao diện \`Authentication\` cho biết quá trình xác thực đã hoàn tất hay chưa? Và \`supports()\` trả về \`true\` đã đủ bảo đảm bộ cung cấp sẽ xác thực được yêu cầu đó chưa?`,
      },
      {
        id: "ss-w4-4",
        text: "SecurityContext, chiến lược lưu giữ, HTTP Basic và form login",
        lesson: `**Mục tiêu.** Lấy được người dùng đang đăng nhập trong controller, và biết phải đổi chiến lược nào khi công việc chạy sang luồng khác.

**Đọc.** [§6.2 Sử dụng SecurityContext](#/docs/springsec-06) — ba chiến lược ở đầu mục là phần cốt lõi; làm §6.2.1, rồi §6.2.2 nếu bạn có endpoint \`@Async\`. §6.2.3 tới §6.2.5 để dành cho lúc thực sự cần. Sau đó [§6.3 Tìm hiểu về xác thực HTTP Basic và đăng nhập bằng biểu mẫu](#/docs/springsec-06): §6.3.1 cho \`realmName()\` và \`authenticationEntryPoint()\`, §6.3.2 cho \`formLogin()\` và \`defaultSuccessUrl()\`.

**Bẫy.** Gọi \`SecurityContextHolder.getContext()\` bên trong một luồng do bạn tự tạo rồi ngạc nhiên vì không thấy gì. Chiến lược mặc định là \`MODE_THREADLOCAL\`: mỗi luồng giữ ngữ cảnh của riêng nó. \`MODE_INHERITABLETHREADLOCAL\` mới sao chép ngữ cảnh sang luồng tiếp theo cho lời gọi bất đồng bộ, còn \`MODE_GLOBAL\` cho cả ứng dụng dùng chung một ngữ cảnh duy nhất.

**Tự kiểm tra.** Ngoài \`SecurityContextHolder.getContext()\`, sách còn chỉ cách nào ngắn hơn để lấy đối tượng \`Authentication\` trong một phương thức của controller? Và chỉ đổi \`httpBasic()\` thành \`formLogin()\` thì Spring Security tự cấu hình thêm những trang nào cho bạn?`,
      },
    ],
  },
  {
    id: "ss-w5",
    week: "Tuần 5",
    title: "Phân quyền cấp endpoint",
    goal: "Viết được quy tắc phân quyền cho từng nhóm endpoint, và đọc được một cấu hình phân quyền dài mà không đoán mò thứ tự áp dụng.",
    practice: "Dựng ứng dụng bốn endpoint `/a` (GET và POST), `/a/b`, `/a/b/c` như §8.2 và chạy hết các kịch bản trong mục, mỗi lần ghi lại mã trạng thái nhận được. Sau đó thử đảo `anyRequest()` lên trên một quy tắc cụ thể hơn và xem chuyện gì xảy ra.",
    resources: [
      { label: "SSIA 07 — Phân quyền cấp endpoint: giới hạn truy cập", href: "#/docs/springsec-07" },
      { label: "SSIA 08 — Phân quyền cấp endpoint: áp dụng các giới hạn", href: "#/docs/springsec-08" },
      { label: "Nhắc lại GrantedAuthority: SSIA 03 §3.2", href: "#/docs/springsec-03" },
      { label: "docs.spring.io — Authorize HttpServletRequests", href: "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html" },
    ],
    items: [
      {
        id: "ss-w5-1",
        text: "Quyền hạn (authority) khác vai trò (role) ở đâu",
        lesson: `**Mục tiêu.** Phân biệt được quyền hạn với vai trò ở cả mức khái niệm lẫn mức mã nguồn, và chọn đúng phương thức cấu hình cho từng loại.

**Đọc.** [§7.1 Giới hạn truy cập dựa trên quyền hạn và vai trò](#/docs/springsec-07) — §7.1.1 cho \`hasAuthority()\`, \`hasAnyAuthority()\` và \`access()\`; §7.1.2 cho \`hasRole()\`, \`hasAnyRole()\` và phép so sánh Đoạn mã 7.9 với Đoạn mã 7.11; §7.1.3 cho \`denyAll()\` cùng lý do tồn tại của nó. Khung "Tìm hiểu thêm về phương thức access()" cho bạn một ví dụ SpEL chặn truy cập theo giờ. Lưu ý trước: §7.1.1 là mục dính nhiều dòng bị cắt cụt \`[…]\` thứ ba toàn bản dịch (7 dấu, rơi chủ yếu vào chữ ký \`securityFilterChain(HttpSecurity http)\` của các đoạn mã), nên bám vào phần diễn giải văn xuôi quanh mỗi đoạn mã thay vì tin nguyên văn đoạn mã.

**Bẫy.** Tiền tố \`ROLE_\`. Sách nói vai trò và quyền hạn dùng chung một khế ước \`GrantedAuthority\`, và ở tầng dưới **chính tiền tố \`ROLE_\` là dấu hiệu phân biệt hai thứ**. Từ đó sinh ra ba quy tắc rất dễ nhầm: khai bằng \`authorities()\` thì phải viết đủ \`ROLE_ADMIN\`; khai bằng \`roles()\` thì tuyệt đối không được kèm tiền tố, kèm vào là ném ngoại lệ; còn trong cấu hình thì gọi \`hasRole("ADMIN")\`, cũng không tiền tố.

**Tự kiểm tra.** Người dùng đã xác thực thành công nhưng thiếu vai trò được yêu cầu thì nhận mã trạng thái nào? Và sách xếp vai trò hay quyền hạn ở mức bao quát (coarse-grained) hơn?`,
      },
      {
        id: "ss-w5-2",
        text: "Dùng requestMatchers() để chọn đúng endpoint",
        lesson: `**Mục tiêu.** Gắn được quy tắc phân quyền cho từng endpoint cụ thể, và viết cấu hình tường minh thay vì trông cậy vào hành vi mặc định.

**Đọc.** [§8.1 Sử dụng phương thức requestMatchers() để lựa chọn endpoint](#/docs/springsec-08) — làm dự án hai endpoint \`/hello\` và \`/ciao\` với John (\`ADMIN\`) và Jane (\`MANAGER\`), chạy đủ bốn tổ hợp curl. Rồi thêm endpoint \`/hola\` (Đoạn mã 8.3) để thấy hành vi mặc định, và viết nó ra tường minh bằng Đoạn mã 8.4. Khung "Chưa xác thực so với Xác thực thất bại" ở cuối mục đọc kỹ.

**Bẫy.** Đặt \`anyRequest()\` lên trước các quy tắc cụ thể. Sách ghi chú thứ tự các quy tắc phải đi **từ cụ thể đến tổng quát**, nên \`anyRequest()\` không được gọi trước một bộ khớp cụ thể hơn. Bẫy thứ hai tinh vi hơn: một endpoint đã \`permitAll()\` vẫn có thể trả về 401 — gọi nó **không** kèm thông tin xác thực thì qua, nhưng gọi kèm thông tin xác thực **sai** thì ứng dụng vẫn chạy quá trình xác thực và trượt.

**Tự kiểm tra.** Sau khi bạn cấu hình \`/hello\` và \`/ciao\`, endpoint \`/hola\` mới thêm mặc định mở cho ai? Và làm sao viết điều đó ra một cách tường minh trong lớp cấu hình?`,
      },
      {
        id: "ss-w5-3",
        text: "Chọn yêu cầu để áp hạn chế phân quyền",
        lesson: `**Mục tiêu.** Chọn đúng biến thể \`requestMatchers()\` và viết đúng biểu thức đường dẫn cho cả một nhóm yêu cầu.

**Đọc.** [§8.2 Lựa chọn các yêu cầu để áp dụng hạn chế phân quyền](#/docs/springsec-08) — dựng dự án \`ssia-ch8-ex2\` với bốn endpoint \`/a\` (GET và POST), \`/a/b\`, \`/a/b/c\`, rồi chạy hết các kịch bản cấu hình trong mục và ghi lại mã trạng thái mỗi lần. Kết lại bằng Bảng 8.1 ở cuối mục — bảng này đáng chép ra giấy dán cạnh màn hình. Lưu ý trước: §8.2 là mục dính nhiều dòng bị cắt cụt \`[…]\` nhiều thứ nhì toàn bản dịch (11 dấu, rải trên cả chữ ký phương thức lẫn chú thích cuối dòng như \`// Đối với các yêu…\`), nên đọc bù bằng Bảng 8.1 mỗi khi một đoạn mã hoặc chú thích bị hụt.

**Bẫy.** Lẫn \`*\` với \`**\`. Theo Bảng 8.1, \`/a/*\` thay cho **một** thành phần đường dẫn nên khớp \`/a/b\` nhưng không khớp \`/a/b/c\`; còn \`/a/**\` thay cho nhiều thành phần nên khớp cả \`/a\`, \`/a/b\` lẫn \`/a/b/c\`. Bẫy thứ hai: dùng biến thể \`requestMatchers(String... patterns)\` rồi ngầm hiểu nó chỉ áp cho GET — không kèm \`HttpMethod\` thì ràng buộc tự động áp cho **mọi** phương thức HTTP gọi tới đường dẫn đó.

**Tự kiểm tra.** Bạn muốn GET \`/a\` phải xác thực còn POST \`/a\` thì ai gọi cũng được — cần dùng biến thể \`requestMatchers()\` nào? Và theo Bảng 8.1, biểu thức \`/a/{param:regex}\` khớp trong trường hợp nào?`,
      },
      {
        id: "ss-w5-4",
        text: "Bộ khớp yêu cầu bằng biểu thức chính quy",
        lesson: `**Mục tiêu.** Nhận ra lúc biểu thức đường dẫn hết đủ dùng, và viết được một bộ khớp regex cho quy tắc nhìn vào nhiều biến đường dẫn cùng lúc.

**Đọc.** [§8.3 Sử dụng biểu thức chính quy với bộ khớp yêu cầu](#/docs/springsec-08) — bắt đầu từ ví dụ \`/email/{email:...}\` viết regex ngay bên trong biểu thức đường dẫn, rồi sang endpoint \`/video/{country}/{language}\` và Đoạn mã 8.13 (nguồn tự mâu thuẫn về tên dự án ví dụ ở đoạn này — §8.3 gán \`/video\` cho cả \`ssia-ch8-ex5\` lẫn \`ssia-ch8-ex6\` ở hai chỗ khác nhau, còn \`/email\` mới là ví dụ thực sự nằm trong \`ssia-ch8-ex6\`; đừng lấy tên dự án làm chuẩn). Chạy thử cả hai người dùng John và Jane trên vài tổ hợp quốc gia — ngôn ngữ.

**Bẫy.** Dùng regex ở mọi chỗ vì nó mạnh hơn. Sách nói thẳng điểm yếu lớn nhất của regex là khó đọc, và phần lớn trường hợp biểu thức đường dẫn là đủ; chỉ chuyển sang regex khi quy tắc phải soi nhiều khuôn mẫu đường dẫn và nhiều biến đường dẫn cùng lúc. Bẫy thứ hai: tưởng yêu cầu không khớp bộ khớp sẽ rơi vào 404. Trong ví dụ \`/email/{email:...}\`, gọi với \`jane@example.net\` trả về **401 Unauthorized** — nó không khớp quy tắc \`permitAll()\` nên rơi xuống \`anyRequest().denyAll()\` đứng sau.

**Tự kiểm tra.** Trong Đoạn mã 8.13, John chỉ có quyền \`read\` còn Jane có thêm \`premium\` — mỗi người gọi được nhóm đường dẫn nào? Và theo §8.3, hai loại yêu cầu nghiệp vụ nào khiến tác giả khuyên chuyển từ biểu thức đường dẫn sang bộ khớp regex?`,
      },
    ],
  },
];
