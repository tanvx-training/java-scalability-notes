// Lộ trình đọc Spring Security in Action — Phần 2 (Tuần 6–9).
//
// Xem chú thích đầu roadmap-part1.js cho quy ước chung và phân bổ 9 tuần.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Tuần 8 gom cả ba vai OAuth 2 (authorization server ch14, resource server ch15,
// client ch16) vào một tuần có chủ ý: dựng rời từng vai thì không thấy được
// token đi qua hệ thống, mà đó mới là thứ cần hiểu.

export const springsecWeeksPart2 = [
  {
    id: "ss-w6",
    week: "Tuần 6",
    title: "Method security và filtering",
    goal: "Đưa quy tắc authorization xuống tầng service thay vì chỉ ở endpoint, và dùng filtering để kiểm soát thứ đi vào và đi ra khỏi một method.",
    practice: "Lấy một service có phương thức trả về danh sách bản ghi của nhiều user. Bảo vệ nó ba lần: bằng `@PreAuthorize`, bằng `@PostAuthorize`, rồi bằng `@PostFilter` — và ghi lại xem cách nào trả về cái gì khi user chỉ được xem bản ghi của chính mình.",
    resources: [
      { label: "SSIA 11 — Hiện thực authorization ở mức method", href: "#/docs/springsec-11" },
      { label: "SSIA 12 — Hiện thực filtering ở mức method", href: "#/docs/springsec-12" },
      { label: "SSIA 07 — Authority và role (SpEL dùng lại các hàm này)", href: "#/docs/springsec-07" },
    ],
    items: [
      {
        id: "ss-w6-1",
        text: "Bật method security và áp dụng `@PreAuthorize`",
        lesson: `**Mục tiêu.** Bật được method security, giải thích được nó chạy nhờ cơ chế nào, và viết được biểu thức SpEL cho preauthorization.

**Đọc.** [§11.1.1 Hiểu về call authorization](#/docs/springsec-11) → [§11.1.2 Bật method security trong project của bạn](#/docs/springsec-11) → [§11.2 Áp dụng quy tắc preauthorization](#/docs/springsec-11).

**Bẫy.** Method security chạy qua proxy Spring AOP, nên một lời gọi **nội bộ** trong cùng class (\`this.method()\`) không đi qua proxy và quy tắc không được áp. Đây là lỗi im lặng nguy hiểm nhất của chương này. Bẫy thứ hai: quên \`@EnableMethodSecurity\` — annotation vẫn nằm đó, không báo lỗi, và không bảo vệ gì cả.

**Tự kiểm tra.** Trong biểu thức \`@PreAuthorize\`, bạn tham chiếu tham số của method bằng cú pháp nào? Vì sao gọi một method có \`@PreAuthorize\` từ một method khác trong cùng class lại không kích hoạt kiểm tra?`,
      },
      {
        id: "ss-w6-2",
        text: "`@PostAuthorize` và tách logic phức tạp ra `PermissionEvaluator`",
        lesson: `**Mục tiêu.** Biết khi nào phải quyết định *sau* khi method chạy, và dọn biểu thức SpEL dài ra khỏi annotation.

**Đọc.** [§11.3 Áp dụng quy tắc postauthorization](#/docs/springsec-11) → [§11.4 Hiện thực permission cho method](#/docs/springsec-11).

**Bẫy.** Dùng \`@PostAuthorize\` cho method có tác dụng phụ. Method **đã chạy xong** rồi mới bị từ chối — nếu nó đã ghi database hay gửi email thì việc chặn giá trị trả về chẳng cứu được gì. \`@PostAuthorize\` chỉ an toàn với method chỉ đọc.

**Tự kiểm tra.** Trong biểu thức \`@PostAuthorize\`, bạn tham chiếu giá trị trả về bằng gì? Sách nói gì về \`@Secured\` và \`@RolesAllowed\` so với \`@PreAuthorize\`/\`@PostAuthorize\`?`,
      },
      {
        id: "ss-w6-3",
        text: "`@PreFilter`, `@PostFilter` và cái bẫy khi dùng với Spring Data",
        lesson: `**Mục tiêu.** Phân biệt authorization (cho gọi hay không) với filtering (cho đi qua cái gì), và biết vì sao \`@PostFilter\` trên repository hầu như luôn sai.

**Đọc.** [§12.1 Áp dụng prefiltering](#/docs/springsec-12) → [§12.2 Áp dụng postfiltering](#/docs/springsec-12) → [§12.3 Dùng filtering trong Spring Data repository](#/docs/springsec-12).

**Bẫy.** Cái sách nói thẳng: \`@PostFilter\` trên method của Spring Data repository là lựa chọn tồi về hiệu năng — nó nạp **toàn bộ** bản ghi từ database rồi mới vứt bớt trong bộ nhớ. Việc lọc phải đẩy xuống tận database. Bẫy thứ hai: \`@PreFilter\` chỉ làm việc với collection hoặc array; đặt lên tham số kiểu khác thì không có tác dụng.

**Tự kiểm tra.** Trong biểu thức của \`@PreFilter\` và \`@PostFilter\`, bạn tham chiếu từng phần tử bằng tên gì? Nêu một trường hợp mà \`@PreFilter\` hợp lý hơn là kiểm tra thủ công trong thân method.`,
      },
    ],
  },
  {
    id: "ss-w7",
    week: "Tuần 7",
    title: "OAuth 2 và OpenID Connect — nền lý thuyết",
    goal: "Gọi tên được bốn actor và trách nhiệm của từng vai, phân biệt opaque và non-opaque token, và chọn đúng grant type cho một tình huống cụ thể.",
    practice: "Không code tuần này. Vẽ tay sơ đồ authorization code grant với đầy đủ mũi tên giữa user, client, authorization server và resource server — rồi vẽ lại client credentials grant và đánh dấu mũi tên nào biến mất, vì sao.",
    resources: [
      { label: "SSIA 13 — OAuth 2 và OpenID Connect là gì?", href: "#/docs/springsec-13" },
      { label: "SSIA 06 — Hiện thực authentication (đối chiếu với luồng cũ)", href: "#/docs/springsec-06" },
    ],
    items: [
      {
        id: "ss-w7-1",
        text: "Bốn actor và hai loại token",
        lesson: `**Mục tiêu.** Nói rõ vai trò của user, client, resource server và authorization server; giải thích được đánh đổi giữa opaque và non-opaque token.

**Đọc.** [§13.1 Bức tranh tổng thể về OAuth 2 và OpenID Connect](#/docs/springsec-13) → [§13.2.1 Sử dụng opaque token](#/docs/springsec-13) → [§13.2.2 Sử dụng non-opaque token](#/docs/springsec-13).

**Bẫy.** Nhầm client với user. Client là **ứng dụng** cần được cho phép, user là **người**; một client có thể hành động thay mặt user (authorization code) hoặc nhân danh chính nó (client credentials). Bẫy thứ hai: tưởng JWT được mã hoá. Nó được **ký**, không mã hoá — ai cầm token cũng đọc được payload, nên đừng nhét dữ liệu nhạy cảm vào claim.

**Tự kiểm tra.** Với opaque token, resource server làm gì mỗi khi nhận request, và cái giá phải trả là gì? Với non-opaque token thì cái giá đổi lại là gì?`,
      },
      {
        id: "ss-w7-2",
        text: "Grant type, PKCE, refresh token và phần OIDC bổ sung",
        lesson: `**Mục tiêu.** Chọn đúng grant type theo tình huống, và giải thích PKCE giải quyết lỗ hổng nào.

**Đọc.** [§13.3.1 Authorization code grant type](#/docs/springsec-13) → [§13.3.2 Bảo vệ PKCE](#/docs/springsec-13) → [§13.3.3 Client credentials grant type](#/docs/springsec-13) → [§13.3.4 Refresh token](#/docs/springsec-13) → [§13.4 OpenID Connect mang lại gì cho OAuth 2](#/docs/springsec-13) → [§13.5 Những "tội lỗi" của OAuth 2](#/docs/springsec-13).

**Bẫy.** Dùng client credentials cho luồng có user. Grant type đó dành cho service gọi service, không mang danh tính user nào — dùng sai thì resource server mất hoàn toàn thông tin ai đang thao tác. Đừng bỏ qua §13.5: nó liệt kê đúng những chỗ người ta hay làm sai trong thực tế.

**Tự kiểm tra.** PKCE bảo vệ chống lại kịch bản tấn công nào mà authorization code grant thuần không chống được? OpenID Connect thêm gì vào OAuth 2 mà OAuth 2 thuần không có?`,
      },
    ],
  },
  {
    id: "ss-w8",
    week: "Tuần 8",
    title: "Dựng đủ ba vai OAuth 2",
    goal: "Tự tay dựng authorization server, resource server và client rồi cho chúng nói chuyện với nhau — nhìn thấy token được cấp, được mang đi, và được kiểm chứng.",
    practice: "Ba project chạy cùng lúc trên ba cổng. Lấy token bằng authorization code grant, gọi resource server bằng token đó, rồi thu hồi token và gọi lại để thấy nó bị từ chối. Bắt lại toàn bộ request bằng log hoặc proxy để xem đúng cái gì đi qua dây.",
    resources: [
      { label: "SSIA 14 — Hiện thực một OAuth 2 authorization server", href: "#/docs/springsec-14" },
      { label: "SSIA 15 — Hiện thực một OAuth 2 resource server", href: "#/docs/springsec-15" },
      { label: "SSIA 16 — Hiện thực một OAuth 2 client", href: "#/docs/springsec-16" },
      { label: "SSIA 13 — Ôn lại grant type trước khi code", href: "#/docs/springsec-13" },
    ],
    items: [
      {
        id: "ss-w8-1",
        text: "Authorization server: `UserDetailsService`, `RegisteredClientRepository`, `JWKSource`",
        lesson: `**Mục tiêu.** Dựng được authorization server tối thiểu và gọi tên ba component bạn phải tự cung cấp.

**Đọc.** [§14.1 Hiện thực authentication cơ bản bằng JSON Web Token](#/docs/springsec-14). Chú ý sự đối xứng: quản lý **user** vẫn dùng \`UserDetailsService\` quen thuộc từ chương 3; quản lý **client** thì cần contract mới là \`RegisteredClientRepository\`; và vì token được ký nên cần thêm \`JWKSource\` giữ cặp khóa.

**Bẫy.** Đăng ký một client dùng đồng thời cả grant type phụ thuộc user (authorization code) lẫn grant type độc lập user (client credentials) — sách khuyên tách hẳn ra hai client. Bẫy thứ hai: sinh cặp khóa mới mỗi lần khởi động; mọi token đã cấp lập tức không kiểm chứng được nữa.

**Tự kiểm tra.** Authorization server cần \`UserDetailsService\` để làm gì, khác gì với vai trò của \`RegisteredClientRepository\`? Resource server lấy public key ở đâu để kiểm chứng chữ ký?`,
      },
      {
        id: "ss-w8-2",
        text: "Chạy hai grant type, rồi opaque token, introspection và revocation",
        lesson: `**Mục tiêu.** Thực sự lấy được token bằng cả hai luồng, và cấu hình được thu hồi token.

**Đọc.** [§14.2 Chạy authorization code grant type](#/docs/springsec-14) → [§14.3 Chạy client credentials grant type](#/docs/springsec-14) → [§14.4 Sử dụng opaque token và introspection](#/docs/springsec-14) → [§14.5 Thu hồi token](#/docs/springsec-14).

**Bẫy.** Điều sách nhấn ở tóm tắt và rất dễ quên: khi bật revocation, resource server phải **luôn introspect** token — kể cả token non-opaque. Lý do đơn giản: chữ ký của một JWT đã thu hồi vẫn hợp lệ, chỉ authorization server mới biết nó đã bị vô hiệu hoá. Không introspect thì tính năng thu hồi coi như không tồn tại.

**Tự kiểm tra.** Introspection endpoint trả về những gì ngoài "hợp lệ / không hợp lệ"? Vì sao resource server gọi introspection lại cần client credential của riêng nó?`,
      },
      {
        id: "ss-w8-3",
        text: "Resource server: `jwt()` hay `opaqueToken()`, và multitenancy",
        lesson: `**Mục tiêu.** Cấu hình \`oauth2ResourceServer()\` đúng theo loại token hệ thống dùng, và biết điểm mở rộng khi bài toán phức tạp hơn.

**Đọc.** [§15.1 Cấu hình việc kiểm chứng JWT](#/docs/springsec-15) → [§15.2 Sử dụng JWT được tùy chỉnh](#/docs/springsec-15) → [§15.3 Cấu hình kiểm chứng token thông qua introspection](#/docs/springsec-15) → [§15.4 Hiện thực hệ thống multitenant](#/docs/springsec-15).

**Bẫy.** Cấu hình public key set URI trỏ tới một authorization server mà không kiểm claim \`iss\`/\`aud\` — token do đúng server đó cấp nhưng dành cho ứng dụng khác vẫn lọt. Bẫy thứ hai: dùng \`jwt()\` trong hệ thống có revocation (xem lại mục trước).

**Tự kiểm tra.** Hai phương thức \`jwt()\` và \`opaqueToken()\` của customizer khác nhau ở chỗ resource server phải cấu hình URI nào? Component nào cho phép bạn chọn cách authentication theo từng tenant?`,
      },
      {
        id: "ss-w8-4",
        text: "Client: OAuth 2 login và service gọi service",
        lesson: `**Mục tiêu.** Cho user đăng nhập bằng nhà cung cấp ngoài, và cho một backend tự lấy token để gọi backend khác.

**Đọc.** [§16.1.1 Authentication với một nhà cung cấp phổ biến](#/docs/springsec-16) → [§16.1.2 Cho user nhiều lựa chọn hơn](#/docs/springsec-16) → [§16.1.3 Dùng một authorization server tùy chỉnh](#/docs/springsec-16) → [§16.1.4 Thêm sự linh hoạt](#/docs/springsec-16) → [§16.1.5 Quản lý authorization cho OAuth 2 login](#/docs/springsec-16) → [§16.2 Hiện thực một OAuth 2 client](#/docs/springsec-16).

**Bẫy.** Nghĩ rằng đăng nhập qua GitHub/Google là một cơ chế hoàn toàn khác nên authorization phải làm lại từ đầu. Sách nói rõ ở tóm tắt: dù xác thực qua hệ thống ngoài, chi tiết user vẫn được lưu vào security context theo đúng thiết kế chuẩn — nên bạn cấu hình authorization y như mọi phương thức authentication khác.

**Tự kiểm tra.** Với nhà cung cấp không nằm trong nhóm phổ biến, ba URI nào bạn buộc phải khai báo? Client manager giải quyết việc gì trong luồng service gọi service?`,
      },
    ],
  },
  {
    id: "ss-w9",
    week: "Tuần 9",
    title: "Reactive và kiểm thử",
    goal: "Áp dụng lại toàn bộ kiến thức lên stack reactive, rồi khoá mọi cấu hình bảo mật đã viết bằng test — thứ duy nhất giữ cho chúng không vỡ khi refactor.",
    practice: "Viết test cho đúng những cấu hình bạn đã dựng ở tuần 4, 6 và 8: một test cho endpoint authorization bằng `MockMvc`, một test cho method security, và một test cho resource server. Cố tình phá cấu hình rồi chạy lại để xác nhận test thật sự bắt được.",
    resources: [
      { label: "SSIA 17 — Hiện thực bảo mật trong ứng dụng reactive", href: "#/docs/springsec-17" },
      { label: "SSIA 18 — Kiểm thử các cấu hình bảo mật", href: "#/docs/springsec-18" },
      { label: "SSIA 06 — `SecurityContext` (đối chiếu với bản reactive)", href: "#/docs/springsec-06" },
    ],
    items: [
      {
        id: "ss-w9-1",
        text: "App reactive: `ReactiveUserDetailsService`, `SecurityWebFilterChain`, `authorizeExchange()`",
        lesson: `**Mục tiêu.** Ánh xạ từng component non-reactive đã học sang bản reactive tương ứng, và biết chỗ nào tên gọi đổi.

**Đọc.** [§17.1 App reactive là gì?](#/docs/springsec-17) → [§17.2 Quản lý user trong app reactive](#/docs/springsec-17) → [§17.3.1 Authorization ở tầng endpoint trong app reactive](#/docs/springsec-17) → [§17.3.2 Dùng method security trong app reactive](#/docs/springsec-17).

**Bẫy.** Gọi \`SecurityContextHolder.getContext()\` trong code reactive. Nó dựa vào \`ThreadLocal\`, mà trong mô hình reactive một request không gắn chặt với một thread — phải dùng \`ReactiveSecurityContextHolder\`, và nó trả về một kiểu reactive chứ không phải giá trị trực tiếp. Bẫy thứ hai: chặn (\`block()\`) bên trong luồng reactive để lấy user cho nhanh.

**Tự kiểm tra.** \`authorizeHttpRequests()\` bên non-reactive tương ứng với phương thức nào bên reactive? Bạn tạo \`SecurityWebFilterChain\` bằng builder nào?`,
      },
      {
        id: "ss-w9-2",
        text: "Reactive OAuth 2 resource server",
        lesson: `**Mục tiêu.** Dựng lại resource server của tuần 8 trên stack reactive và thấy phần nào giữ nguyên, phần nào đổi.

**Đọc.** [§17.4 Tạo một reactive OAuth 2 resource server](#/docs/springsec-17). Đọc kèm [§15.1](#/docs/springsec-15) mở song song để so từng dòng cấu hình.

**Bẫy.** Trộn dependency \`spring-boot-starter-web\` và \`spring-boot-starter-webflux\` trong cùng project rồi tự hỏi vì sao cấu hình reactive không có tác dụng — khi cả hai cùng có mặt, ứng dụng khởi động theo stack servlet.

**Tự kiểm tra.** Cấu hình kiểm chứng JWT ở bản reactive khác bản servlet ở những tên class/method nào? Còn khái niệm nào của chương 15 **không** đổi khi sang reactive?`,
      },
      {
        id: "ss-w9-3",
        text: "Kiểm thử: mock user, `MockMvc`, method security và `WebTestClient`",
        lesson: `**Mục tiêu.** Viết được test cho cả bốn nhóm cấu hình đã học — endpoint, method, CSRF/CORS, và reactive — và chọn đúng công cụ cho từng nhóm.

**Đọc.** [§18.1 Dùng mock user](#/docs/springsec-18) → [§18.2 Test với user từ một \`UserDetailsService\`](#/docs/springsec-18) → [§18.3 Dùng object \`Authentication\` tùy chỉnh](#/docs/springsec-18) → [§18.4 Test method security](#/docs/springsec-18) → [§18.5 Test authentication](#/docs/springsec-18) → [§18.6 Test cấu hình CSRF](#/docs/springsec-18) → [§18.7 Test cấu hình CORS](#/docs/springsec-18) → [§18.8 Test các hiện thực reactive](#/docs/springsec-18).

**Bẫy.** Viết test authentication cho mọi tình huống rồi bỏ quên authorization. Sách khuyên ngược lại: cần **ít** test authentication và **nhiều** test authorization, vì authentication chỉ có vài luồng còn authorization thì nhân lên theo số endpoint và số quyền. Bẫy thứ hai: dùng mock user ở khắp nơi rồi không bao giờ kiểm chứng luồng đăng nhập thật.

**Tự kiểm tra.** \`MockMvc\` dùng cho stack nào và \`WebTestClient\` cho stack nào? Khi cần một đối tượng \`Authentication\` tùy chỉnh cho test, ba bước sách hướng dẫn ở §18.3 là gì?`,
      },
    ],
  },
];
