// Lộ trình đọc Spring Security in Action — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Spring Security in Action", ấn bản 2 —
// Laurențiu Spilcă, Manning 2024. Thư mục nguồn: sources/spring-security/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Ba khiếm khuyết của nguồn trong phạm vi tuần 6–9, đã kiểm bằng grep:
//
// 1. Chương 14 (máy chủ ủy quyền OAuth 2) KHÔNG CÓ THÂN CHƯƠNG trong bản PDF
//    gốc: tệp 14-*.md chỉ còn phần mở đầu và một khối cảnh báo, không có một
//    tiêu đề `##` nào. Toàn bộ §14.1–14.5 mất. Vì vậy tuần 8 không giao đọc
//    §14.1–14.5, và bù bằng tài liệu chính thức của Spring Authorization Server.
//
// 2. Chương 15 THIẾU phần mở đầu và toàn bộ §15.1; tệp bắt đầu từ đoạn cuối
//    §15.1 rồi nhảy thẳng sang `## 15.2`. Tuần 8 không giao đọc §15.1.
//
// 3. Các dòng bị cắt cụt ở mép trang PDF, đánh dấu `[…]` ngay trong tệp nguồn.
//    Số dấu (đã trừ dòng chú thích đầu tệp): ch9: 8 · ch10: 2 · ch11: 0 ·
//    ch12: 8 · ch13: 1 · ch14: 0 · ch15: 12 · ch16: 12 · ch17: 2 · ch18: 4.
//    Nặng nhất là chương 15, 16 và mục §12.3. Ở những chỗ đó, bài học chỉ
//    khẳng định phần văn bản còn nguyên và nói thẳng với người học rằng
//    mục đó đọc sẽ vấp.

export const springsecWeeksPart2 = [
  {
    id: "ss-w6",
    week: "Tuần 6",
    title: "CSRF & CORS",
    goal: "Giải thích được vì sao tắt CSRF là lựa chọn có điều kiện chứ không phải mặc định an toàn, và cấu hình được CORS đúng chỗ thay vì rắc annotation khắp nơi.",
    practice: "Bật CSRF trên một form đơn giản, xem token trong HTML và trong request; rồi gọi cùng endpoint đó từ một trang ở origin khác để tự thấy trình duyệt chặn ở đâu.",
    resources: [
      { label: "SSIA 09 — Cấu hình bảo vệ chống CSRF", href: "#/docs/springsec-09" },
      { label: "SSIA 10 — Cấu hình CORS", href: "#/docs/springsec-10" },
      { label: "Nhắc lại chỗ chèn bộ lọc: SSIA 05 §5.3", href: "#/docs/springsec-05" },
      { label: "docs.spring.io — Cross Site Request Forgery (CSRF)", href: "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html" },
    ],
    items: [
      {
        id: "ss-w6-1",
        text: "CSRF hoạt động thế nào trong Spring Security",
        lesson: `**Mục tiêu.** Kể lại được kịch bản tấn công CSRF, và chỉ đúng thành phần nào của Spring Security chặn yêu cầu, dựa vào cái gì.

**Đọc.** [§9.1 Cơ chế bảo vệ CSRF hoạt động như thế nào trong Spring Security](#/docs/springsec-09) — đọc kịch bản Carlos ở đầu mục, rồi bám vào ba cái tên: \`CsrfFilter\`, \`CsrfTokenRepository\` và thuộc tính request \`_csrf\`. Gõ lại dự án \`ssia-ch9-ex1\` theo Listing 9.1 đến 9.3 và chạy đủ ba lệnh curl cuối mục: GET để lấy \`JSESSIONID\` và token, POST trần, rồi POST kèm header \`X-CSRF-TOKEN\`.

**Bẫy.** Tưởng bảo vệ CSRF áp cho mọi yêu cầu. \`CsrfFilter\` cho GET, HEAD, TRACE và OPTIONS đi qua vô điều kiện; chỉ những yêu cầu còn lại mới bị đòi token, và thiếu hoặc sai token thì ứng dụng trả về **403 Forbidden** chứ không phải 401. Bẫy thứ hai: nghĩ client có sẵn chỗ nào đó để lấy token. Sách có hẳn một ghi chú rằng ví dụ này cố tình in token ra console cho dễ hiểu, còn trong thực tế backend phải chủ động đưa token vào phản hồi HTTP — đó là chuyện của §9.2.

**Tự kiểm tra.** Theo mặc định \`CsrfTokenRepository\` lưu token ở đâu, và vì sao lệnh curl POST thành công lại bắt buộc phải kèm cả \`JSESSIONID\`? Và \`CsrfFilter\` gán đối tượng \`CsrfToken\` vào request dưới tên thuộc tính nào?`,
      },
      {
        id: "ss-w6-2",
        text: "CSRF trong kịch bản thực tế, và khi nào được phép tắt",
        lesson: `**Mục tiêu.** Quyết định được ứng dụng của bạn có cần bảo vệ CSRF hay không, và loại trừ đúng vài đường dẫn thay vì tắt sạch.

**Đọc.** [§9.2 Sử dụng cơ chế bảo vệ CSRF trong các kịch bản thực tế](#/docs/springsec-09) — dựng \`ssia-ch9-ex2\` với Thymeleaf, submit biểu mẫu ở Listing 9.7 để tự nhận 403, rồi sửa thành Listing 9.8 với thẻ input ẩn mang \`\${_csrf.parameterName}\` và \`\${_csrf.token}\`. Sau đó [§9.3 Tùy chỉnh cơ chế bảo vệ CSRF](#/docs/springsec-09): phần đầu — Listing 9.10 với \`ignoringRequestMatchers()\` — là phần bạn dùng hằng ngày; phần \`CustomCsrfTokenRepository\` lưu token xuống cơ sở dữ liệu đọc lấy ý, chưa cần gõ.

**Bẫy.** Tắt CSRF theo phản xạ vì "API của tôi là REST". §9.2 cho tiêu chí rõ ràng: dùng CSRF cho ứng dụng web chạy trên trình duyệt, nơi chính trình duyệt tải nội dung ứng dụng thực hiện thao tác thay đổi dữ liệu; client tách rời — di động, Angular, ReactJS, Vue.js — thì OAuth 2 ở chương 13 đến 16 mới là lời giải. Bẫy thứ hai, sách nhấn vì gặp quá nhiều lần trong thực tế: đừng bao giờ đặt một thao tác thay đổi dữ liệu sau endpoint HTTP GET, vì GET không đòi token CSRF.

**Tự kiểm tra.** Vì sao trang đăng nhập mặc định của Spring Security vẫn POST được trong khi CSRF đang bật? Và §9.3 liệt kê ba giao ước nào để bạn tự định nghĩa cơ chế CSRF của riêng mình?`,
      },
      {
        id: "ss-w6-3",
        text: "CORS: @CrossOrigin và CorsConfigurer",
        lesson: `**Mục tiêu.** Cấu hình được CORS tập trung trong lớp cấu hình, và nói đúng CORS thực sự bảo vệ ai.

**Đọc.** [§10.1 CORS hoạt động như thế nào?](#/docs/springsec-10) — dựng \`ssia-ch10-ex1\`, mở trang qua \`localhost\` trong khi mã JavaScript gọi \`127.0.0.1\` để tự tạo ra một cuộc gọi liên nguồn, rồi đọc **cả console trình duyệt lẫn console ứng dụng**. Tiếp [§10.2 Áp dụng các chính sách CORS bằng annotation @CrossOrigin](#/docs/springsec-10) và [§10.3 Áp dụng CORS bằng CorsConfigurer](#/docs/springsec-10) — Mã nguồn 10.5 là khuôn bạn sẽ dùng thật.

**Bẫy.** Xem CORS như một lớp phân quyền. Sách nói ngược lại: CORS sinh ra để **nới lỏng** ràng buộc nghiêm ngặt của trình duyệt, và dòng log \`Test method called\` chứng minh endpoint backend vẫn chạy dù trình duyệt đã từ chối phản hồi. Bẫy thứ hai nằm ở §10.3: khai \`setAllowedOrigins()\` mà quên \`setAllowedMethods()\` thì ứng dụng từ chối sạch, vì một \`CorsConfiguration\` rỗng mặc định không cho phép phương thức HTTP nào.

**Tự kiểm tra.** Trình duyệt bỏ qua bước gửi yêu cầu preflight trong những điều kiện nào? Và §10.2 nêu hai nhược điểm nào của việc rắc \`@CrossOrigin\` lên từng endpoint?`,
      },
    ],
  },
  {
    id: "ss-w7",
    week: "Tuần 7",
    title: "Phân quyền & lọc cấp phương thức",
    goal: "Đưa quy tắc phân quyền xuống tầng dịch vụ và tầng repository, và biết khi nào phải lọc dữ liệu ngay trong câu truy vấn thay vì lọc trong bộ nhớ ứng dụng.",
    practice: "Bật `@EnableMethodSecurity` cho một dự án hai người dùng, viết `@PreAuthorize` so tham số phương thức với tên đăng nhập như §11.2, rồi tách một quy tắc phức tạp ra lớp `PermissionEvaluator` riêng. Cuối tuần chuyển một phương thức repository từ `@PostFilter` sang câu `@Query` có `?#{authentication.name}` và đếm lại số bản ghi thực sự tải lên.",
    resources: [
      { label: "SSIA 11 — Phân quyền ở cấp độ phương thức", href: "#/docs/springsec-11" },
      { label: "SSIA 12 — Lọc ở cấp độ phương thức", href: "#/docs/springsec-12" },
      { label: "Nhắc lại biểu thức SpEL phân quyền: SSIA 07 §7.1", href: "#/docs/springsec-07" },
      { label: "docs.spring.io — Method Security", href: "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html" },
    ],
    items: [
      {
        id: "ss-w7-1",
        text: "Kích hoạt bảo mật phương thức, tiền ủy quyền và hậu ủy quyền",
        lesson: `**Mục tiêu.** Kích hoạt được bảo mật phương thức, và chọn đúng giữa \`@PreAuthorize\` và \`@PostAuthorize\` cho một yêu cầu nghiệp vụ cụ thể.

**Đọc.** [§11.1 Kích hoạt bảo mật phương thức](#/docs/springsec-11) — hai cơ chế cốt lõi (ủy quyền cuộc gọi và lọc dữ liệu) ở đầu mục, rồi §11.1.1 phân biệt tiền và hậu ủy quyền, §11.1.2 cho \`@EnableMethodSecurity\`. Tiếp [§11.2 Áp dụng các quy tắc tiền ủy quyền](#/docs/springsec-11) với \`ssia-ch11-ex1\` rồi \`ssia-ch11-ex2\` — chạy hết các lệnh curl của Emma và Natalie. Kết bằng [§11.3 Áp dụng các quy tắc hậu ủy quyền](#/docs/springsec-11) và dự án \`ssia-ch11-ex3\`.

**Bẫy.** Dùng \`@PostAuthorize\` cho một phương thức có thay đổi dữ liệu. §11.1.1 cảnh báo thẳng: những thay đổi đó vẫn được ghi nhận dù phân quyền sau đó thất bại, và ghi chú kèm theo nói rõ \`@Transactional\` cũng không cứu được, vì ngoại lệ hậu ủy quyền chỉ xuất hiện sau khi bộ quản lý giao dịch đã commit. Bẫy thứ hai: quên rằng bảo mật phương thức **mặc định bị tắt** — thiếu \`@EnableMethodSecurity\` thì \`@PreAuthorize\` nằm đó vô hại như một dòng chú thích.

**Tự kiểm tra.** Trong Mã nguồn 11.6, biểu thức \`#name == authentication.principal.username\` lấy \`#name\` từ đâu ra? Và ở §11.3, vì sao chính Natalie gọi thông tin của mình cũng nhận 403?`,
      },
      {
        id: "ss-w7-2",
        text: "Permission tuỳ chỉnh cho phương thức",
        lesson: `**Mục tiêu.** Tách một quy tắc phân quyền dài ra khỏi biểu thức SpEL và đặt nó vào một lớp \`PermissionEvaluator\` riêng.

**Đọc.** [§11.4 Triển khai quyền truy cập (Permissions) cho phương thức](#/docs/springsec-11) — làm \`ssia-ch11-ex4\` theo chuỗi Mã nguồn 11.11 → 11.18: lớp \`Document\`, \`DocumentRepository\`, \`DocumentService\` với \`@PostAuthorize("hasPermission(returnObject, 'ROLE_admin')")\`, rồi \`DocumentsPermissionEvaluator\`. Đừng bỏ Mã nguồn 11.16: không đăng ký bean \`MethodSecurityExpressionHandler\` thì bộ đánh giá của bạn không bao giờ được gọi. Sau đó làm tiếp \`ssia-ch11-ex5\` (Mã nguồn 11.19 và 11.20) để thấy phương thức nạp chồng thứ hai. Mục \`@Secured\` và \`@RolesAllowed\` ở cuối chương chỉ cần lướt.

**Bẫy.** Tự truyền đối tượng \`Authentication\` vào \`hasPermission()\`. Sách nhấn mạnh để tránh hiểu lầm: Spring Security tự tìm đối tượng xác thực trong \`SecurityContext\` và tiêm vào, bạn chỉ truyền đối tượng đích và tham số quyền. Bẫy thứ hai: chọn nhầm phương thức nạp chồng. Khi chuyển sang \`@PreAuthorize\`, phương thức dịch vụ chưa chạy nên chưa có \`returnObject\` — phải dùng bản nhận mã định danh, kiểu đối tượng và quyền, và chính bộ đánh giá phải tự truy vấn tài liệu.

**Tự kiểm tra.** Hai phương thức nạp chồng của \`PermissionEvaluator\` khác nhau ở tham số nào, và mỗi bản hợp với annotation nào? Và trong \`ssia-ch11-ex5\`, vì sao Emma không mở được tài liệu \`abc123\`?`,
      },
      {
        id: "ss-w7-3",
        text: "Tiền lọc, hậu lọc, và lọc trong repository Spring Data",
        lesson: `**Mục tiêu.** Lọc được tham số đầu vào và giá trị trả về bằng \`@PreFilter\` và \`@PostFilter\`, và nhận ra lúc phải đẩy việc lọc xuống câu truy vấn.

**Đọc.** [§12.1 Áp dụng tiền lọc trong phân quyền phương thức](#/docs/springsec-12) rồi [§12.2 Áp dụng hậu lọc trong phân quyền phương thức](#/docs/springsec-12) — hai mục cùng một khuôn, chạy \`ssia-ch12-ex1\` và \`ssia-ch12-ex3\` với Nikolai và Julien. Trọng tâm tuần này là [§12.3 Sử dụng cơ chế lọc trong các repository Spring Data](#/docs/springsec-12): làm \`ssia-ch12-ex4\` với \`@PostFilter\` đặt thẳng trên phương thức repository, rồi chuyển sang \`ssia-ch12-ex5\` (Listing 12.12 và 12.13). Lưu ý §12.3 là mục dính nhiều dòng cắt cụt \`[…]\` nhất chương — mấy câu \`INSERT\` mẫu mất đuôi, nên tự viết lại dữ liệu mẫu.

**Bẫy.** Truyền một collection bất biến vào phương thức có \`@PreFilter\`. Aspect **sửa thẳng trên collection được truyền vào** chứ không trả về một \`List\` mới, nên một danh sách bất biến sẽ cho bạn ngoại lệ lúc chạy. Bẫy thứ hai: gắn \`@PostFilter\` lên \`findAll()\`. Sách gọi thẳng đây là cách làm sai — ứng dụng tải toàn bộ bản ghi lên bộ nhớ rồi mới lọc, và không phân trang thì đủ sức ném \`OutOfMemoryError\`.

**Tự kiểm tra.** \`@PreFilter\` và \`@PostFilter\` đòi hỏi gì ở kiểu tham số và kiểu trả về của phương thức? Và để dùng được \`authentication.name\` bên trong một câu \`@Query\`, bạn phải thêm bean kiểu gì vào Spring context?`,
      },
    ],
  },
  {
    id: "ss-w8",
    week: "Tuần 8",
    title: "OAuth 2 & OpenID Connect",
    goal: "Gọi đúng tên từng thực thể trong hệ thống OAuth 2, chọn được loại token và phương thức cấp quyền cho một tình huống cụ thể, rồi cấu hình được cả máy chủ tài nguyên lẫn client bằng Spring Security.",
    practice: "Đăng ký một ứng dụng trên GitHub hoặc Google rồi bật `oauth2Login()` theo §16.1.1 — đây là phần chạy được ngay với chỉ hai dòng thuộc tính. Với máy chủ tài nguyên, dựng máy chủ ủy quyền theo tài liệu chính thức của Spring Authorization Server (bản dịch thiếu toàn bộ thân chương 14), rồi làm §15.2 và §15.3 trên đó.",
    resources: [
      { label: "SSIA 13 — OAuth 2 và OpenID Connect là gì?", href: "#/docs/springsec-13" },
      { label: "SSIA 14 — nguồn THIẾU toàn bộ thân chương (§14.1–14.5); chỉ còn phần mở đầu khái niệm về máy chủ ủy quyền", href: "#/docs/springsec-14" },
      { label: "SSIA 15 — Máy chủ tài nguyên OAuth 2 (nguồn thiếu phần mở đầu và §15.1)", href: "#/docs/springsec-15" },
      { label: "SSIA 16 — Triển khai một client OAuth 2", href: "#/docs/springsec-16" },
      { label: "docs.spring.io — Spring Authorization Server (đọc bù phần chương 14 thiếu)", href: "https://docs.spring.io/spring-authorization-server/reference/" },
      { label: "docs.spring.io — OAuth 2.0 Resource Server (đọc bù §15.1)", href: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html" },
    ],
    items: [
      {
        id: "ss-w8-1",
        text: "Các vai trò trong OAuth 2, và token đục khác token rõ ở đâu",
        lesson: `**Mục tiêu.** Gọi đúng tên bốn thực thể trong hệ thống OAuth 2, và chọn được giữa opaque token và non-opaque token cho một yêu cầu cụ thể.

**Đọc.** [§13.1 Bức tranh toàn cảnh về OAuth 2 và OpenID Connect](#/docs/springsec-13) — phép ẩn dụ buổi phỏng vấn ở đầu mục, rồi bốn thực thể, một luồng bốn bước rút gọn và ngay sau đó là luồng chi tiết sáu bước. Tiếp [§13.2 Các cách thức triển khai token](#/docs/springsec-13) cùng hai mục con [§13.2.1 Sử dụng opaque token](#/docs/springsec-13) và [§13.2.2 Sử dụng non-opaque token](#/docs/springsec-13) — nhớ ba phần của một JWT và cách chúng được nối lại bằng dấu chấm.

**Bẫy.** Nghĩ hệ thống OAuth 2 nào cũng có người dùng. §13.1 nói rõ không phải lúc nào cũng có, và §13.3.3 sẽ cho bạn đúng kịch bản ngược lại. Bẫy thứ hai: coi JWT là "đã mã hoá nên an toàn". Header và body chỉ được **mã hoá Base64** cho gọn khi truyền tải, ai chặn được token cũng đọc được nội dung; chữ ký chỉ chứng minh token do máy chủ ủy quyền phát hành và chưa bị sửa, chứ không giấu gì cả. Vì thế tác giả khuyên đừng nhồi dữ liệu nhạy cảm vào token.

**Tự kiểm tra.** Máy chủ tài nguyên phải làm thêm việc gì khi nhận một opaque token, và thao tác đó tên là gì? Và theo lời khuyên cuối §13.2.2, khi nào bạn mới nên đổi từ non-opaque sang opaque token?`,
      },
      {
        id: "ss-w8-2",
        text: "Các phương thức cấp quyền, PKCE và refresh token",
        lesson: `**Mục tiêu.** Kể lại được luồng authorization code grant, nói được PKCE chặn đúng điều gì, và biết khi nào dùng client credentials grant.

**Đọc.** [§13.3 Nhận token thông qua các phương thức cấp quyền khác nhau](#/docs/springsec-13) — làm lần lượt [§13.3.1 Lấy token bằng phương thức cấp mã ủy quyền (Authorization Code Grant)](#/docs/springsec-13) với bảy bước của Mary, rồi §13.3.2 (PKCE), §13.3.3 (client credentials) và §13.3.4 (refresh token). Sau đó [§13.4 Những giá trị OpenID Connect mang lại cho OAuth 2](#/docs/springsec-13) — ẩn dụ ổ cắm điện dài, nhưng ba gạch đầu dòng cuối mục mới là thứ cần nhớ. §13.5 để dành cho lúc rà soát rủi ro.

**Bẫy.** Lẫn mã ủy quyền với access token. Sách dựng sẵn cảnh báo này: access token mới là đích đến, mã ủy quyền chỉ là bước trung gian — và chính bước trung gian đó là lý do implicit grant bị khai tử, vì chuyển hướng trình duyệt quá dễ bị đánh chặn. Bẫy thứ hai: tưởng PKCE thay thế client secret. Nó vá đúng một lỗ: kẻ đã có secret vẫn không đổi được token vì không biết mã xác thực, thứ client chưa từng truyền lên mạng.

**Tự kiểm tra.** Trong PKCE, giá trị nào đi kèm yêu cầu đăng nhập và giá trị nào chỉ xuất hiện ở bước đổi token? Và theo §13.4, OpenID Connect bổ sung loại token nào mà OAuth 2 thuần không có?`,
      },
      {
        id: "ss-w8-3",
        text: "Resource server: JWT tuỳ chỉnh, introspection, đa khách thuê",
        lesson: `**Mục tiêu.** Cấu hình được máy chủ tài nguyên đọc claim tuỳ chỉnh, chuyển sang xác thực bằng thẩm định, và phục vụ nhiều máy chủ ủy quyền.

**Đọc.** Biết trước mình đang đọc một chương khuyết: bản dịch **thiếu phần mở đầu và toàn bộ §15.1 (cấu hình xác thực JWT)**, tệp bắt đầu ở đoạn cuối §15.1 rồi nhảy thẳng sang §15.2, và đây cũng là chương dính nhiều dòng cắt cụt \`[…]\` nhất — hầu hết rơi vào chữ ký phương thức trong các Danh sách. Đọc bù §15.1 bằng tài liệu OAuth 2.0 Resource Server ở phần tài nguyên, đừng đoán. Rồi [§15.2 Sử dụng JWT tùy chỉnh](#/docs/springsec-15) theo chuỗi Danh sách 15.8 → 15.9 → 15.10, [§15.3 Cấu hình xác thực token thông qua cơ chế thẩm định (introspection)](#/docs/springsec-15) và [§15.4 Triển khai hệ thống đa khách thuê (multitenant)](#/docs/springsec-15).

**Bẫy.** Nghĩ máy chủ tài nguyên chỉ là bên nhận token. Muốn thẩm định, chính nó phải được đăng ký như một client trên máy chủ ủy quyền, có client id và client secret riêng — §15.3 dựng hẳn một \`RegisteredClient\` tên \`resource_server\`. Bẫy thứ hai: thêm claim tuỳ chỉnh rồi tưởng nó tự chảy vào quy tắc phân quyền; bạn phải viết bộ chuyển đổi để nạp nó vào đối tượng xác thực trong ngữ cảnh bảo mật.

**Tự kiểm tra.** §15.3 đặt ba giá trị nào vào \`application.properties\` của máy chủ tài nguyên? Và lớp có sẵn nào cho phép một máy chủ tài nguyên làm việc với nhiều máy chủ ủy quyền cùng dùng JWT?`,
      },
      {
        id: "ss-w8-4",
        text: "Client OAuth 2: đăng nhập và gọi tài nguyên được bảo vệ",
        lesson: `**Mục tiêu.** Bật được đăng nhập OAuth 2 cho một ứng dụng web Spring, và biến một dịch vụ backend thành client tự lấy token.

**Đọc.** [§16.1 Triển khai đăng nhập bằng OAuth 2](#/docs/springsec-16) — làm §16.1.1 với Google hoặc GitHub, rồi [§16.1.4 Tăng tính linh hoạt cho cấu hình của bạn](#/docs/springsec-16) cho \`ClientRegistration\` và \`ClientRegistrationRepository\`, và §16.1.5 cho cách lấy người dùng đang đăng nhập. Sau đó [§16.2 Triển khai một Client OAuth 2](#/docs/springsec-16) với \`OAuth2AuthorizedClientManager\`. Bỏ qua §16.1.3 nếu bạn chưa có máy chủ ủy quyền riêng — nó dựa vào dự án của chương 14, mà chương 14 thì nguồn không có thân chương. Chương này cũng cắt cụt nhiều, và đau nhất là các dòng \`application.properties\`: một nửa số dấu \`[…]\` rơi đúng vào những dòng \`spring.security.oauth2.client.*\` — chép theo sách sẽ thiếu, phải tra lại tên thuộc tính trong tài liệu chính thức.

**Bẫy.** Tưởng phải tự khai đủ authorization URI, token URI, client id và client secret cho mọi nhà cung cấp. Với Google, GitHub, Okta và Facebook, Spring Security đã điền sẵn trong lớp \`CommonOAuth2Provider\`; bạn chỉ cần hai thuộc tính client id và client secret. Bẫy thứ hai: dùng client credentials grant mà vẫn đi tìm redirect URI — phương thức này không gắn với người dùng nào nên không cần redirect URI lẫn URI ủy quyền.

**Tự kiểm tra.** Muốn lấy thông tin đăng ký client từ cơ sở dữ liệu thay vì tệp thuộc tính, bạn triển khai giao ước nào? Và access token phải đặt vào header nào của yêu cầu, với tiền tố gì?`,
      },
    ],
  },
  {
    id: "ss-w9",
    week: "Tuần 9",
    title: "Ứng dụng phản ứng & kiểm thử",
    goal: "Cấu hình bảo mật cho một ứng dụng phản ứng mà không bê nguyên thói quen từ ứng dụng servlet sang, và viết được bộ kiểm thử tự động cho chính các quy tắc bảo mật bạn đã viết.",
    practice: "Chuyển một endpoint đơn giản sang WebFlux, khai `ReactiveUserDetailsService` và bean `SecurityWebFilterChain`, rồi lấy người dùng đăng nhập bằng `ReactiveSecurityContextHolder`. Sau đó viết bộ kiểm thử cho dự án tuần 7: một bài `@WithMockUser` kiểm quy tắc phân quyền, một bài `httpBasic()` kiểm chính luồng xác thực, và một cặp POST có và không có `csrf()`.",
    resources: [
      { label: "SSIA 17 — Bảo mật trong các ứng dụng phản ứng", href: "#/docs/springsec-17" },
      { label: "SSIA 18 — Kiểm thử cấu hình bảo mật", href: "#/docs/springsec-18" },
      { label: "Nhắc lại bảo mật phương thức: SSIA 11 §11.2", href: "#/docs/springsec-11" },
      { label: "docs.spring.io — Reactive Applications", href: "https://docs.spring.io/spring-security/reference/reactive/index.html" },
      { label: "docs.spring.io — Testing", href: "https://docs.spring.io/spring-security/reference/servlet/test/index.html" },
    ],
    items: [
      {
        id: "ss-w9-1",
        text: "Bảo mật trong ứng dụng phản ứng",
        lesson: `**Mục tiêu.** Chỉ ra được những thành phần nào phải đổi kiểu hoặc đổi tên khi sang ứng dụng phản ứng, và cấu hình được cả phân quyền endpoint lẫn phân quyền phương thức trong WebFlux.

**Đọc.** [§17.1 Ứng dụng phản ứng là gì?](#/docs/springsec-17) — đọc để hiểu vì sao \`SecurityContext\` phải đổi cách quản lý, đừng sa đà vào Reactor. [§17.2 Quản lý người dùng trong ứng dụng phản ứng](#/docs/springsec-17) cho \`ReactiveUserDetailsService\`, \`MapReactiveUserDetailsService\` và \`ReactiveSecurityContextHolder\`. [§17.3 Cấu hình các quy tắc phân quyền trong ứng dụng phản ứng](#/docs/springsec-17) là trọng tâm: §17.3.1 cho \`SecurityWebFilterChain\` dựng từ \`ServerHttpSecurity\`, §17.3.2 cho \`@EnableReactiveMethodSecurity\`. Khép lại bằng [§17.4 Tạo một reactive OAuth 2 resource server](#/docs/springsec-17), nối thẳng với tuần 8.

**Bẫy.** Thêm một bean \`SecurityFilterChain\` vào ứng dụng phản ứng rồi ngồi chờ nó có hiệu lực. §17.3.1 nói thẳng cách đó không hoạt động — bạn phải khai bean kiểu \`SecurityWebFilterChain\`. Bẫy thứ hai: giữ nguyên \`SecurityContextHolder\` và tham số \`Authentication\` trần trong controller. Ứng dụng phản ứng dùng nhiều luồng cho một yêu cầu nên cơ chế \`ThreadLocal\` không còn đúng: tham số phải là \`Mono<Authentication>\`, còn ngữ cảnh thì lấy từ \`ReactiveSecurityContextHolder\`.

**Tự kiểm tra.** \`authorizeExchange()\` và \`pathMatchers()\` tương ứng với hai phương thức nào trong ứng dụng không phản ứng, và sách giải thích vì sao tên lại đổi? Và Spring Boot tự cấu hình máy chủ web nào cho một dự án phản ứng?`,
      },
      {
        id: "ss-w9-2",
        text: "Kiểm thử cấu hình bảo mật",
        lesson: `**Mục tiêu.** Viết được kiểm thử tích hợp cho cấu hình phân quyền, cho luồng xác thực và cho CSRF, và nói rõ mỗi bài đang kiểm cái gì.

**Đọc.** [§18.1 Sử dụng người dùng giả lập cho các kiểm thử](#/docs/springsec-18) — \`@SpringBootTest\`, \`@AutoConfigureMockMvc\`, \`@WithMockUser\` và bản thay thế bằng \`RequestPostProcessor\` \`user()\` của lớp \`SecurityMockMvcRequestPostProcessors\`. [§18.2 Kiểm thử với người dùng lấy từ UserDetailsService](#/docs/springsec-18) cho \`@WithUserDetails\`; [§18.3 Sử dụng các đối tượng Authentication tùy chỉnh để kiểm thử](#/docs/springsec-18) đọc theo đúng ba bước sách đánh số. [§18.4 Kiểm thử bảo mật cấp phương thức](#/docs/springsec-18) bỏ \`MockMvc\`, tiêm thẳng bean cần kiểm. [§18.5 Kiểm thử xác thực](#/docs/springsec-18) và [§18.6 Kiểm thử các cấu hình CSRF](#/docs/springsec-18) cho bạn \`httpBasic()\`, \`formLogin()\` và \`csrf()\`. §18.7 và §18.8 để dành.

**Bẫy.** Tưởng \`@WithMockUser\` kiểm luôn \`AuthenticationProvider\` của bạn. Sách nhắc đúng hiểu lầm này hai lần: người dùng giả lập **bỏ qua hoàn toàn quá trình xác thực**, nên nó chỉ chứng minh phần phân quyền — muốn kiểm xác thực thật thì phải sang §18.5. Bẫy thứ hai: quên rằng \`@WithUserDetails\` bắt buộc phải có một bean \`UserDetailsService\` thật trong context.

**Tự kiểm tra.** \`@WithMockUser\` và \`RequestPostProcessor\` \`user()\` được framework áp dụng vào hai thời điểm khác nhau thế nào so với lúc dựng yêu cầu kiểm thử? Và trong §18.6, hai bài kiểm thử POST \`/hello\` khác nhau đúng ở chỗ nào, và cho ra hai mã trạng thái nào?`,
      },
    ],
  },
];
