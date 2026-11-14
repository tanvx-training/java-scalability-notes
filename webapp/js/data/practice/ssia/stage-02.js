// Chặng 2 — Hello Spring Security (chương 2 của sách). Ba buổi đã phát hành.
// Script lab: labs/ssia/sessions/s01…s03 (test ở order/src/test/java/lab/<buổi>/), sự cố labs/ssia/breaks/st02-no-prefix.
// Mọi lớp, log, mã trạng thái dưới đây đo trên labs/ssia/app với Spring Boot 4.1.2 / Spring Security 7.1.2.

export const sessions = [
  // ───────────────────────────── s01 ─────────────────────────────
  {
    id: "s01",
    stage: "st02",
    title: "Thêm Spring Security vào order: mặc định sinh ra gì",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: [],
    status: "published",
    pieces: ["order-secured"],
    goals: [
      "Thêm `spring-boot-starter-security` vào service `order` và giải thích từng mã trả về: 401 cho `/orders`, 200 cho `/actuator/health`, 302 về `/login` khi request đòi HTML.",
      "Đọc từ log khởi động mật khẩu sinh ra và chain bảo mật đang chạy; gọi được `/orders` bằng HTTP Basic, cả bằng `curl -u` lẫn header `Authorization` tự dựng.",
      "Liệt kê đúng thứ tự các filter của chain mặc định trên app đang chạy và chỉ ra auto-configuration nào tạo chain đó.",
      "Giữ bốn test gốc của `order` xanh mà không tắt bảo mật.",
    ],
    skills: [
      { skill: "cfg-starter-security", level: "Gõ được không tra" },
      { skill: "dx-default-user-password", level: "Gõ được không tra" },
      { skill: "int-autoconfig-security", level: "Giải thích được" },
    ],
    uses: [],
    foundation: null,
    mindset: `**Thêm starter là cắm một filter servlet trước DispatcherServlet.** Spring Boot đăng ký một \`DelegatingFilterProxy\` tên \`springSecurityFilterChain\`; nó chuyển mọi request cho bean cùng tên, một \`FilterChainProxy\`. \`FilterChainProxy\` chọn **một** \`SecurityFilterChain\` khớp request và chạy lần lượt các filter của chain đó. Chỉ khi filter cuối cho qua, request mới tới controller. Hệ quả đầu tiên bạn sẽ thấy: \`GET /khong-co\` trả **401**, không phải 404 — chain chạy trước khi Spring MVC biết đường dẫn có tồn tại hay không.

\`\`\`mermaid
flowchart LR
  c[curl / trình duyệt] --> t[Tomcat]
  t --> d[DelegatingFilterProxy<br/>springSecurityFilterChain]
  d --> p[FilterChainProxy]
  p --> q{chain nào khớp?}
  q --> ch[SecurityFilterChain<br/>filter 1 … n]
  ch -- cho qua --> mvc[DispatcherServlet → OrderController]
  ch -- chưa đăng nhập --> ep{entry point}
  ep -- Accept: text/html --> r302[302 Location: /login]
  ep -- còn lại --> r401[401 + WWW-Authenticate: Basic]
\`\`\`

**Chain nào đang chạy trên order?** Không phải chain "mặc định" trong sách. \`order\` có actuator, nên Boot 4.1.2 dùng \`ManagementWebSecurityAutoConfiguration\`: một bean \`SecurityFilterChain\` cho phép endpoint health (\`permitAll\`), đòi xác thực cho mọi thứ khác, bật \`cors\`, \`formLogin\` và \`httpBasic\`. Vì vậy probe \`/actuator/health\` vẫn 200 ngay sau khi thêm bảo mật. Không có actuator thì Boot dùng \`defaultSecurityFilterChain\` (của \`ServletWebSecurityAutoConfiguration\`), không mở gì. Cả hai đều lùi lại hoàn toàn khi bạn khai một bean \`SecurityFilterChain\` của riêng mình (buổi s03).

**User từ đâu ra.** \`UserDetailsServiceAutoConfiguration\` tạo bean \`inMemoryUserDetailsManager\` chứa một user \`user\` với mật khẩu UUID sinh lại mỗi lần khởi động và in nó ở mức WARN. Ngay sau đó \`InitializeUserDetailsBeanManagerConfigurer\` báo \`Global AuthenticationManager configured with UserDetailsService bean with name inMemoryUserDetailsManager\`: bean đó được nối vào bộ xác thực toàn cục. Buổi s02 sẽ lần theo đúng đường nối này.

**Đọc phản hồi trước khi đọc code.** Những gì \`curl -i\` cho thấy trên order (đo trên bản 7.1.2):

| Request | Kết quả | Ai gây ra |
|---|---|---|
| \`GET /orders\` không credential | \`401\`, \`WWW-Authenticate: Basic realm="Realm"\`, \`Set-Cookie: JSESSIONID\`, \`Content-Length: 0\` | entry point của Basic; cookie là do request được lưu lại để chuyển tiếp sau khi đăng nhập (\`HttpSessionRequestCache\`) |
| \`GET /orders\` với \`Accept: text/html\` | \`302 Location: http://localhost:8082/login\` | entry point chọn trang form login cho trình duyệt |
| \`GET /orders -u user:<mật khẩu>\` | \`200 []\`, **không** có \`Set-Cookie\` | Basic xác thực lại mỗi request, không lưu vào session |
| mật khẩu sai | \`401\` | |
| \`GET /actuator/health\` | \`200 {"groups":["liveness","readiness"],"status":"UP"}\` | \`permitAll\` của chain actuator |
| \`GET /khong-co\` | \`401\` (đăng nhập rồi thì \`404\`) | chain chạy trước DispatcherServlet |

Mọi phản hồi, kể cả 200, có thêm \`X-Content-Type-Options: nosniff\`, \`X-Frame-Options: DENY\`, \`Cache-Control: no-cache, no-store…\` — một filter của chain ghi các header này.

**Bộ test có sẵn cũng là người dùng.** Ba trong bốn test gốc của order đỏ ngay: \`expected: 201 but was: 401\`. Test \`readinessIsUp\` vẫn xanh — cùng lý do với probe. Cách sửa không phải tắt bảo mật trong test mà cho test đi qua chuỗi filter với một user giả: MockMvc + \`@WithMockUser\`, và gửi token CSRF cho POST (\`.with(csrf())\`). Chương 18 của sách nói kỹ về test; ở đây chỉ cần đủ để bộ test xanh lại.`,
    bookDiff: [
      { book: "Dependency `spring-boot-starter-web` + `spring-boot-starter-security`.", now: "Boot 4 dùng `spring-boot-starter-webmvc` (module `common` của shop đã có); POM của `spring-boot-starter-web` 4.1.2 tự ghi là *deprecated in favor of spring-boot-starter-webmvc*. Chỉ cần thêm `spring-boot-starter-security` vào `order`.", why: "Boot 4 tách starter theo công nghệ web; starter cũ còn trong BOM để chuyển dần." },
      { book: "401 kèm body JSON `{status, error, message, path}`.", now: "`curl -i` trên order: 401 với `Content-Length: 0`, không body.", why: "Lỗi được chuyển sang `/error`, nhưng chính `/error` cũng bị chain chặn với người dùng ẩn danh (TRACE: `Securing GET /error` rồi `Sending AnonymousAuthenticationToken … to authentication entry point`) — s02 lần kỹ đường này." },
      { book: "App mẫu chỉ có web: mọi endpoint bị chặn.", now: "order có actuator: chain là `managementSecurityFilterChain`, `/actuator/health` (và `liveness`, `readiness`) mở sẵn, chain có thêm `CorsFilter`.", why: "`ManagementWebSecurityAutoConfiguration` của Boot 4.1.2 thay chain mặc định khi actuator có mặt." },
    ],
    refs: [
      { label: "Sách, chương 2 — mục 2.1 Khởi động project đầu tiên (và khung \"Gọi endpoint với HTTP Basic\")", href: "#/docs/springsec-02" },
      { label: "Spring Security 7.1 — Architecture: FilterChainProxy, SecurityFilterChain, in danh sách filter", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/architecture.html#servlet-print-filters" },
      { label: "Spring Security 7.1 — HTTP Basic Authentication", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/basic.html" },
      { label: "Spring Boot 4.1 — Spring Security (auto-configuration cho Spring MVC)", href: "https://docs.spring.io/spring-boot/4.1/reference/web/spring-security.html#web.security.spring-mvc" },
      { label: "Spring Boot 4.1 — Actuator: bảo mật endpoint", href: "https://docs.spring.io/spring-boot/4.1/reference/actuator/endpoints.html#actuator.endpoints.security" },
      { label: "Spring Security 7.1 — Testing: MockMvc setup", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/setup.html" },
    ],
    stateIn: "Máy cần `git`, Maven và JDK 21 hoặc 25 (`./labs/lab up ssia` kiểm và dừng nếu thiếu); yêu cầu máy, cách chọn JDK cho Maven và cách lấy lại code nằm ở tệp `labs/ssia/README.md` của repo, đọc trước buổi đầu. Bản gốc shop ở `labs/ssia/app`, chưa có bảo mật. `./labs/lab up ssia` tạo workspace `labs/ssia/work/` (một kho git riêng); `./labs/lab begin ssia s01` chép test của buổi vào `order/src/test/java/lab/s01/`. Các test này dùng lớp của Spring Security nên chưa biên dịch được cho tới khi bạn thêm starter: verify lúc này đỏ toàn bộ (`không chạy`).",
    stateOut: "order có Spring Security mặc định: chain `managementSecurityFilterChain`, user `user` với mật khẩu sinh mỗi lần khởi động; `answers/s01.env` mô tả đúng chain; bốn test gốc của order xanh lại qua MockMvc.",
    tasks: [
      { id: "t1", text: "`./labs/lab up ssia` rồi `./labs/lab begin ssia s01`. Thêm dependency `org.springframework.boot:spring-boot-starter-security` (không ghi version: BOM của Boot quản lý) vào `labs/ssia/work/order/pom.xml`. Build và chạy: `cd labs/ssia/work && mvn -q -pl order -am package -DskipTests && java -jar order/target/order.jar`. Mọi lệnh `./labs/lab …` chỉ chạy được từ gốc repo, còn Maven và `java -jar` chạy trong `labs/ssia/work`: giữ hai terminal, một ở gốc repo, một ở workspace." },
      { id: "t2", text: "Trong log khởi động, tìm dòng `Using generated security password: …` và dòng `Global AuthenticationManager configured with UserDetailsService bean with name …` ngay sau nó. Ghi lại logger của từng dòng và tên bean." },
      { id: "t3", text: "Gọi bằng `curl -i` và giải thích từng kết quả theo sơ đồ ở Tư duy: `/orders` không credential; `-u user:<mật khẩu>`; mật khẩu sai; `-H 'Accept: text/html'`; `/actuator/health`; `/khong-co` (có và không credential). Rồi tự dựng header: `H=$(printf 'user:%s' <mật khẩu> | base64)` và `curl -H \"Authorization: Basic $H\" localhost:8082/orders`." },
      { id: "t4", kind: "dissect", text: "Dừng app, chạy lại với `--logging.level.org.springframework.security=TRACE` và gọi `/orders` một lần. Từ dòng DEBUG `Will secure any request with filters: …` và dòng TRACE `Trying to match request against DefaultSecurityFilterChain defined as '…'`, viết `labs/ssia/work/answers/s01.env` (mỗi dòng `KHOÁ=giá trị`) với năm khoá: `CHAIN_BEAN` (tên bean của chain), `FILTERS` (simple name của mọi filter, cách nhau dấu phẩy, đúng thứ tự), `FILTER_COUNT`, `BEFORE_BASIC` (filter đứng ngay trước `BasicAuthenticationFilter`), `AFTER_CSRF` (filter đứng ngay sau `CsrfFilter`). Verify đo lại từ `FilterChainProxy` của context lúc chấm." },
      { id: "t5", text: "Chạy `./labs/lab verify ssia s01`: ba dòng \"test gốc\" đỏ với `expected: 201 but was: 401`. Sửa `OrderTest` và `OrderCatalogDownTest` mà không tắt bảo mật: thêm `spring-boot-starter-security-test` (scope `test`), chuyển sang `@AutoConfigureMockMvc` + `MockMvc`, gắn `@WithMockUser` lên lớp, thêm `.with(csrf())` cho mỗi POST. Giữ nguyên tên lớp và tên phương thức (verify chấm theo tên). Đừng \"xanh hoá\" bằng `@AutoConfigureMockMvc(addFilters = false)` hay loại auto-configuration bảo mật: verify dựng lại đúng context của hai lớp test đó, gửi một `GET /orders` ẩn danh qua MockMvc của chúng và đòi 401. Cũng đừng thêm cho test một `SecurityFilterChain` riêng có `csrf(c -> c.disable())` thay cho `.with(csrf())`: verify gửi thêm một `POST /orders` đã đăng nhập nhưng không có token CSRF qua cùng MockMvc đó và đòi 403." },
      { id: "t6", text: "`./labs/lab verify ssia s01` phải đạt 15/15." },
    ],
    hints: [
      "Starter vào `<dependencies>` của `order/pom.xml`, không phải pom cha: chặng này chỉ bảo vệ `order`. Sau khi sửa pom phải `package` lại, nếu không `java -jar` vẫn chạy jar cũ không có bảo mật.",
      "Mật khẩu đổi mỗi lần khởi động, kể cả mỗi lần chạy test. Đừng chép nó vào đâu: `S01DefaultUserTest` đọc tên và mật khẩu từ bean `SecurityProperties` của chính context test.",
      "Không thấy dòng `Will secure any request with filters`? Nó ở mức DEBUG của logger `o.s.s.web.DefaultSecurityFilterChain`, in một lần lúc khởi động. Các dòng TRACE `Invoking <Filter> (i/n)` khi bạn gọi một request cũng cho thứ tự và tổng số.",
      "`FILTERS` dùng simple name (`CsrfFilter`, không `org.springframework.security.web.csrf.CsrfFilter`). Có một filter không thuộc gói `org.springframework.security` — vẫn tính.",
      "Test gốc không biên dịch sau khi sửa? Boot 4 chuyển `AutoConfigureMockMvc` sang gói `org.springframework.boot.webmvc.test.autoconfigure`; `@WithMockUser` và `csrf()` nằm trong `spring-security-test`, do `spring-boot-starter-security-test` kéo vào.",
    ],
    solution: `**1. Thêm starter rồi chạy**

\`\`\`xml
<!-- order/pom.xml, trong <dependencies> -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
\`\`\`

\`\`\`bash
cd labs/ssia/work
mvn -q -pl order -am package -DskipTests && java -jar order/target/order.jar
\`\`\`

Log khởi động (rút gọn cột thời gian):

\`\`\`text
WARN … .s.a.UserDetailsServiceAutoConfiguration :

Using generated security password: f0332fca-09eb-4311-bf48-2cbbcf405573

This generated password is for development use only. Your security configuration must be updated before running your application in production.

INFO … r$InitializeUserDetailsManagerConfigurer : Global AuthenticationManager configured with UserDetailsService bean with name inMemoryUserDetailsManager
\`\`\`

**2. Đọc phản hồi**

\`\`\`bash
curl -i localhost:8082/orders
# HTTP/1.1 401 · Set-Cookie: JSESSIONID=… · WWW-Authenticate: Basic realm="Realm", charset="UTF-8" · Content-Length: 0
curl -i -u user:f0332fca-09eb-4311-bf48-2cbbcf405573 localhost:8082/orders
# HTTP/1.1 200 · Content-Type: application/json · []          (không có Set-Cookie)
curl -i -H 'Accept: text/html' localhost:8082/orders
# HTTP/1.1 302 · Location: http://localhost:8082/login
curl -i localhost:8082/actuator/health
# HTTP/1.1 200 · {"groups":["liveness","readiness"],"status":"UP"}
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/khong-co                 # 401
curl -s -o /dev/null -w '%{http_code}\\n' -u user:<mật khẩu> localhost:8082/khong-co   # 404
H=$(printf 'user:%s' <mật khẩu> | base64)
curl -H "Authorization: Basic $H" localhost:8082/orders                          # []
\`\`\`

401 hay 302 là do entry point: log DEBUG cho thấy \`DelegatingAuthenticationEntryPoint\` thử các matcher (request có phải XHR không, có đòi \`text/html\` không) rồi \`No match found. Using default entry point …BasicAuthenticationEntryPoint\` với curl.

**3. Mổ xẻ chain bằng log**

\`\`\`bash
java -jar order/target/order.jar --logging.level.org.springframework.security=TRACE
\`\`\`

\`\`\`text
DEBUG … o.s.s.web.DefaultSecurityFilterChain : Will secure any request with filters: DisableEncodeUrlFilter, WebAsyncManagerIntegrationFilter, SecurityContextHolderFilter, HeaderWriterFilter, CorsFilter, CsrfFilter, LogoutFilter, UsernamePasswordAuthenticationFilter, DefaultResourcesFilter, DefaultLoginPageGeneratingFilter, DefaultLogoutPageGeneratingFilter, BasicAuthenticationFilter, RequestCacheAwareFilter, SecurityContextHolderAwareRequestFilter, AnonymousAuthenticationFilter, ExceptionTranslationFilter, AuthorizationFilter
TRACE … o.s.security.web.FilterChainProxy : Trying to match request against DefaultSecurityFilterChain defined as 'managementSecurityFilterChain' in [class path resource [org/springframework/boot/security/autoconfigure/actuate/web/servlet/ManagementWebSecurityAutoConfiguration.class]] matching [any request] …
\`\`\`

\`\`\`bash
mkdir -p answers
cat > answers/s01.env <<'EOF'
CHAIN_BEAN=managementSecurityFilterChain
FILTERS=DisableEncodeUrlFilter,WebAsyncManagerIntegrationFilter,SecurityContextHolderFilter,HeaderWriterFilter,CorsFilter,CsrfFilter,LogoutFilter,UsernamePasswordAuthenticationFilter,DefaultResourcesFilter,DefaultLoginPageGeneratingFilter,DefaultLogoutPageGeneratingFilter,BasicAuthenticationFilter,RequestCacheAwareFilter,SecurityContextHolderAwareRequestFilter,AnonymousAuthenticationFilter,ExceptionTranslationFilter,AuthorizationFilter
FILTER_COUNT=17
BEFORE_BASIC=DefaultLogoutPageGeneratingFilter
AFTER_CSRF=LogoutFilter
EOF
\`\`\`

\`CorsFilter\` là của \`org.springframework.web.filter\` (chain actuator gọi \`http.cors(withDefaults())\`). Ba filter \`Default…\` vẽ trang login/logout và tài nguyên của chúng — có mặt vì chain bật \`formLogin\`.

**4. Test gốc đỏ — chẩn đoán rồi sửa**

*Triệu chứng.* Verify sau khi thêm starter: \`test gốc: catalog sập → 503 (thực tế: thất bại (failure): … expected: 503 … but was: 401)\`, tương tự 201 và 422; riêng \`readinessIsUp\` xanh.
*Bằng chứng.* Test gốc gửi request thật bằng \`HttpClient\` không có \`Authorization\` — đúng như \`curl -i localhost:8082/orders\` ở bước 2: chain trả 401 trước khi tới controller. Health mở nên readiness xanh.
*Nguyên nhân.* Không phải bug nghiệp vụ: test chưa có danh tính. *Sửa:* cho test một user giả mà vẫn đi qua chuỗi filter.

Thêm vào \`order/pom.xml\`:

\`\`\`xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security-test</artifactId>
  <scope>test</scope>
</dependency>
\`\`\`

\`\`\`java
@SpringBootTest
@AutoConfigureMockMvc          // org.springframework.boot.webmvc.test.autoconfigure
@WithMockUser                  // mọi test chạy với một user đã xác thực, không phụ thuộc user thật
class OrderTest {
  @Autowired MockMvc mvc;

  @Test
  void createsOrderAndListsIt() throws Exception {
    mvc.perform(post("/orders").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\\"productId\\":1,\\"qty\\":2}"))
        .andExpect(status().isCreated());
    mvc.perform(get("/orders")).andExpect(status().isOk());
  }
  // … unknownProductIs422, readinessIsUp tương tự; OrderCatalogDownTest cũng vậy
}
\`\`\`

\`@AutoConfigureMockMvc\` gắn các filter của context (gồm \`springSecurityFilterChain\`) vào MockMvc, nên test vẫn đi qua chain. Phần \`spring-boot-starter-security-test\` thêm là \`SecurityMockMvcAutoConfiguration\`, nối SecurityContext của test vào request để \`@WithMockUser\` có tác dụng. Đo trên order: thay starter bằng riêng \`org.springframework.security:spring-security-test\` thì vẫn biên dịch, chain vẫn chạy, nhưng ba test đỏ lại với \`Status expected:<201> but was:<401>\` — user giả không tới được request. Bản đầy đủ: \`labs/ssia/sessions/s01/solution/order/src/test/java/shop/order/\`.`,
    work: {
      patterns: [
        "Thêm Spring Security vào một service đang chạy: thứ hỏng đầu tiên là bộ test hiện có (401 khắp nơi), và POST vẫn hỏng dù đã đăng nhập vì CSRF.",
        "Có người hỏi \"service này đang được bảo vệ bởi chain nào, filter nào\": trả lời từ log DEBUG/TRACE hoặc từ `FilterChainProxy`, không đoán theo tài liệu.",
        "Probe Kubernetes vào `/actuator/health` vẫn sống sau khi bật bảo mật — nhờ chain của actuator; tự viết chain thì phải tự mở lại (s03).",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 4 phút, chỉ dùng `curl`, chứng minh rằng chain bảo mật chạy trước khi Spring MVC xử lý đường dẫn.",
          timeLimitMin: 4,
          solution: "```bash\ncurl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/khong-co                     # 401\ncurl -s -o /dev/null -w '%{http_code}\\n' -u user:<mật khẩu> localhost:8082/khong-co   # 404\n```\nKhông đăng nhập: 401 cho một đường dẫn không tồn tại — chưa ai hỏi DispatcherServlet. Đăng nhập rồi mới tới MVC và nhận 404.",
        },
        {
          text: "Sự cố: bạn đã chuyển `OrderTest` sang MockMvc + `@WithMockUser`, test GET xanh, nhưng `createsOrderAndListsIt` và `unknownProductIs422` đỏ với `Status expected:<201> but was:<403>` (và `<422> but was:<403>`). Trong 6 phút, tìm bằng chứng trong log xem ai trả 403 và sửa — không tắt bảo mật.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** 403 chỉ ở POST; GET cùng lớp xanh, nên user giả đã tới request (không phải 401).\n\n**Bằng chứng.** Chạy lại riêng lớp đó với log DEBUG của security truyền cho JVM test, rồi đọc tệp output:\n```bash\ncd labs/ssia/work\nmvn -q -pl order -am test -Dtest='shop.order.OrderTest' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true \"-DargLine=-Xshare:off -Dlogging.level.org.springframework.security=DEBUG\"\ngrep -E 'Securing POST|CsrfFilter|AccessDeniedHandlerImpl' order/target/surefire-reports/shop.order.OrderTest-output.txt\n```\n```text\nDEBUG o.s.security.web.FilterChainProxy      : Securing POST /orders\nDEBUG o.s.security.web.csrf.CsrfFilter       : Invalid CSRF token found for http://localhost/orders\nDEBUG o.s.s.w.access.AccessDeniedHandlerImpl : Responding with 403 status code\n```\n**Nguyên nhân.** `CsrfFilter` chặn mọi POST không mang token CSRF, kể cả khi đã đăng nhập. MockMvc không có lượt `/error` nên bạn thấy đúng 403 (curl qua cổng thật thì thấy 401 — s02 giải thích).\n\n**Sửa.** Thêm `.with(csrf())` (`SecurityMockMvcRequestPostProcessors.csrf`) cho mỗi POST: MockMvc gửi kèm một token hợp lệ. Tắt CSRF cho API là quyết định của chương 9, không phải cách làm test xanh.",
        },
      ],
    },
    tips: [
      "`curl -i` trước khi nghĩ: mã trạng thái, `WWW-Authenticate`, `Set-Cookie`, `Location` đã kể gần hết câu chuyện.",
      "Thấy `Using generated security password` trong log của một môi trường thật nghĩa là cấu hình bảo mật thật chưa được nạp — coi là lỗi, không phải cảnh báo vô hại.",
      "401 cho một đường dẫn không tồn tại là bình thường: chain chạy trước DispatcherServlet.",
      "Tự chạy `mvn -q test` trong workspace bạn sẽ thấy dòng `OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended` (đo được trên cả JDK 21 và 25): JVM chạy test tắt chia sẻ class (CDS) cho phần còn lại vì Mockito tự gắn agent. Vô hại; verify thêm `-DargLine=-Xshare:off` để không in dòng này.",
      "Verify ghi log của test vào `order/target/surefire-reports/<lớp>-output.txt` thay vì in ra màn hình: muốn xem Spring Boot đã khởi động thế nào trong test, mở tệp đó.",
      "Bí hẳn ở một buổi, hoặc muốn so với lời giải tham chiếu: `./labs/lab restore ssia <buổi đang làm>` (ở đây `s01`). Lệnh hỏi xác nhận, commit mọi thay đổi của bạn (kể cả tệp chưa theo dõi) vào một nhánh `backup/<thời điểm>` rồi dựng workspace ở cuối buổi đó bằng lời giải tham chiếu và chạy verify. Lấy lại code của mình: mục \"Lấy lại code của bạn\" trong `labs/ssia/README.md`.",
    ],
    outcome: {
      md: `order đã có Spring Security mặc định, bạn biết chain nào đang chạy và từng filter đứng ở đâu, bộ test gốc xanh lại mà bảo mật vẫn bật. Trên máy:

\`\`\`bash
./labs/lab verify ssia s01
\`\`\`

Verify chạy Maven một lần (test của buổi ở \`order/src/test/java/lab/s01/\` và bốn test gốc của order), đo chain từ \`FilterChainProxy\` của context test để so với \`answers/s01.env\`. Output của test nằm trong \`order/target/surefire-reports/\`.`,
      verifyOutput: "lab: kiểm s01\n  ✓ GET /orders không credential → 401\n  ✓ 401 kèm WWW-Authenticate: Basic\n  ✓ user mặc định + mật khẩu sinh ra → 200\n  ✓ mật khẩu sai → 401\n  ✓ answers/s01.env: CHAIN_BEAN khớp bean đang chạy\n  ✓ answers/s01.env: FILTERS đúng thứ tự thật\n  ✓ answers/s01.env: FILTER_COUNT, BEFORE_BASIC, AFTER_CSRF\n  ✓ test gốc: tạo và liệt kê đơn (POST có CSRF)\n  ✓ test gốc: sản phẩm không có → 422\n  ✓ test gốc: readiness UP\n  ✓ test gốc: catalog sập → 503\n  ✓ MockMvc của OrderTest vẫn chặn GET /orders ẩn danh\n  ✓ MockMvc của OrderCatalogDownTest vẫn chặn GET /orders ẩn danh\n  ✓ MockMvc của OrderTest vẫn đòi CSRF cho POST đã đăng nhập\n  ✓ MockMvc của OrderCatalogDownTest vẫn đòi CSRF cho POST đã đăng nhập\n  → 15/15 đạt",
      projectDelta: "order là service đầu tiên của shop có bảo mật: endpoint nghiệp vụ đòi HTTP Basic, health vẫn mở cho probe, bộ test gốc đi qua chuỗi filter bảo mật bằng MockMvc.",
    },
    review: [
      { q: "Ngay sau khi thêm starter, vì sao `/actuator/health` vẫn 200 khi không đăng nhập?", a: "order có actuator nên chain là `managementSecurityFilterChain` của `ManagementWebSecurityAutoConfiguration`: nó `permitAll()` endpoint health rồi `anyRequest().authenticated()`. Không có actuator thì Boot dùng `defaultSecurityFilterChain`, không mở gì." },
      { q: "Cùng `GET /orders` không credential: curl nhận 401, trình duyệt bị chuyển tới `/login`. Ai quyết định?", a: "Entry point mà `ExceptionTranslationFilter` gọi: `DelegatingAuthenticationEntryPoint` chọn theo request — đòi `text/html` (không phải XHR) thì trang form login (302), còn lại dùng `BasicAuthenticationEntryPoint` (401 + `WWW-Authenticate: Basic`)." },
      { q: "Sau một request Basic thành công, request sau có cần gửi lại credential không? Bằng chứng?", a: "Có. Response 200 không có `Set-Cookie`: `BasicAuthenticationFilter` không lưu SecurityContext vào session, mỗi request xác thực lại. Cookie `JSESSIONID` chỉ xuất hiện ở response 401, do request được lưu lại để chuyển tiếp sau khi đăng nhập." },
      { q: "Vì sao `readinessIsUp` vẫn xanh còn ba test gốc khác đỏ 401?", a: "`/actuator/health/readiness` thuộc endpoint health mà chain actuator mở sẵn; ba test kia gọi `/orders`, cần xác thực." },
      { q: "`answers/s01.env` được chấm thế nào mà không có đáp án viết sẵn trong test?", a: "Test lấy `FilterChainProxy` từ ApplicationContext, chọn chain khớp `GET /orders`, đọc danh sách filter và tên bean của chain đó ngay lúc chấm, rồi so với tệp của bạn." },
    ],
  },

  // ───────────────────────────── s02 ─────────────────────────────
  {
    id: "s02",
    stage: "st02",
    title: "Bức tranh class của Spring Security: lần theo một request",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s01"],
    status: "published",
    pieces: [],
    goals: [
      "Lần bằng debugger một lần đăng nhập Basic vào order, từ `BasicAuthenticationFilter` tới `SecurityContextHolder`, gọi đúng lớp cụ thể của từng bước trên bản 7.1.2.",
      "Đọc log TRACE của `org.springframework.security` cho ba trường hợp — đúng, sai mật khẩu, không credential — và chỉ ra chỗ chúng tách nhau.",
      "Chẩn đoán sự cố `st02-no-prefix` theo trình tự triệu chứng → log → stack trace → nguyên nhân → sửa.",
      "Giải thích vì sao một 401 có thể đang che một lỗi khác (500, 403) qua lượt `/error`.",
    ],
    skills: [
      { skill: "int-auth-flow-diagram", level: "Giải thích được" },
      { skill: "dx-security-debug-log", level: "Gõ được không tra" },
      { skill: "int-debug-breakpoint-filter", level: "Làm được có tra" },
      { skill: "dx-401-error-dispatch", level: "Giải thích được" },
    ],
    uses: ["dx-default-user-password"],
    foundation: null,
    mindset: `**Hình 2.2 của sách là một chuỗi contract; trên app thật mỗi ô là một lớp cụ thể.** Sách vẽ: filter xác thực → authentication manager → authentication provider → user details service + password encoder → security context. Trên order, đường đi đó chạy trong \`BasicAuthenticationFilter\` (filter thứ 12 của chain bạn đã liệt kê ở s01):

\`\`\`mermaid
sequenceDiagram
  participant C as curl
  participant B as BasicAuthenticationFilter
  participant M as AuthenticationManager
  participant P as AuthenticationProvider
  participant U as UserDetailsService
  participant E as PasswordEncoder
  participant H as SecurityContextHolder
  participant Z as AuthorizationFilter
  C->>B: GET /orders + Authorization: Basic …
  B->>B: BasicAuthenticationConverter tách username, password
  B->>M: authenticate(token chưa xác thực)
  M->>P: supports(UsernamePasswordAuthenticationToken)? rồi authenticate
  P->>U: loadUserByUsername(user)
  U-->>P: UserDetails kèm mật khẩu đã lưu
  P->>E: matches(mật khẩu gửi lên, mật khẩu đã lưu)
  E-->>P: true
  P-->>B: token đã xác thực, có authorities
  B->>H: setContext(SecurityContext mới)
  B->>Z: chain.doFilter qua các filter còn lại
  Z->>Z: AuthenticatedAuthorizationManager: đã xác thực?
  Z-->>C: tới OrderController, 200
\`\`\`

Ba điều sách không vẽ mà bạn sẽ gặp trong debugger:

- **AuthenticationManager không phải một đối tượng.** \`ProviderManager\` là hiện thực chính; nó hỏi từng provider \`supports()\`, provider nào nhận thì gọi \`authenticate()\`. Một \`ProviderManager\` có thể có **cha**: nếu không provider nào của nó trả kết quả, nó hỏi cha. Chain của bạn có một ProviderManager riêng (do \`HttpSecurity\` dựng), còn bean \`UserDetailsService\` được nối vào AuthenticationManager **toàn cục** (dòng log \`Global AuthenticationManager configured with …\` ở s01). Provider nào nằm ở tầng nào — bạn tự tìm.
- **Lỗi xác thực và lỗi trong lúc xác thực đi hai đường khác nhau.** Mật khẩu sai là \`BadCredentialsException\` (một \`AuthenticationException\`): \`ProviderManager\` gom lại, \`BasicAuthenticationFilter\` bắt, gọi entry point → 401, log chỉ ở mức DEBUG. Một ngoại lệ khác (ví dụ \`IllegalArgumentException\` từ encoder) không ai bắt: nó thoát khỏi chain, Tomcat ghi \`ERROR … Servlet.service() … threw exception\` và chuyển request sang \`/error\`.
- **Lượt \`/error\` biến mọi thứ thành 401.** Request \`/error\` đi lại qua cả chain. \`BasicAuthenticationFilter\` là một \`OncePerRequestFilter\` — loại filter mặc định bỏ qua lượt error dispatch — nên lần này không ai đọc header \`Authorization\`, người dùng là ẩn danh, \`AuthorizationFilter\` từ chối, entry point trả 401. Client thấy y hệt "sai mật khẩu". Cùng cơ chế: \`POST /orders\` với Basic đúng bị \`CsrfFilter\` (đứng trước Basic) trả 403, rồi lượt \`/error\` thành 401.

\`\`\`mermaid
flowchart TD
  req[Request có Authorization: Basic] --> basic[BasicAuthenticationFilter → AuthenticationManager]
  basic -- BadCredentialsException --> ep[entry point: 401]
  basic -- ngoại lệ khác --> tom[Tomcat: ERROR Servlet.service, mã 500]
  csrf[CsrfFilter từ chối POST: 403] --> err
  tom --> err[forward /error: đi lại cả chain]
  err --> skip[BasicAuthenticationFilter bỏ qua error dispatch]
  skip --> anon[AnonymousAuthenticationFilter: ẩn danh]
  anon --> deny[AuthorizationFilter từ chối] --> ep
\`\`\`

**SecurityContext sống ở đâu.** Sau khi xác thực, \`BasicAuthenticationFilter\` tạo SecurityContext mới, đặt vào \`SecurityContextHolder\` (mặc định một ThreadLocal theo request) và gọi \`securityContextRepository.saveContext(…)\` — với Basic, repository mặc định chỉ lưu vào attribute của request. Đó là lý do response 200 ở s01 không có \`Set-Cookie\`.`,
    bookDiff: [
      { book: "Thiếu PasswordEncoder: `java.lang.IllegalArgumentException: There is no PasswordEncoder mapped for the id \"null\"`.", now: "7.1.2: `Given that there is no default password encoder configured, each password must have a password encoding prefix. Please either prefix this password with '{noop}' or set a default password encoder in DelegatingPasswordEncoder.`, ném từ `DelegatingPasswordEncoder$UnmappedIdPasswordEncoder.matchesNonNull`.", why: "Thông báo của `DelegatingPasswordEncoder` được viết lại để chỉ thẳng hai cách sửa; trường hợp \"có `{id}` nhưng không có encoder cho id đó\" có thông báo riêng." },
      { book: "Hình 2.2: filter gọi một authentication manager, manager gọi provider.", now: "Trên order, đối tượng mà `BasicAuthenticationFilter` gọi là một lớp bọc, phía sau là hai `ProviderManager` lồng nhau (của chain và toàn cục); provider xác thực username/password nằm ở một trong hai.", why: "Sách vẽ ở mức contract; đây là chi tiết hiện thực của bản đang chạy — chính là đáp án của nhiệm vụ mổ xẻ." },
    ],
    refs: [
      { label: "Sách, chương 2 — mục 2.2 Bức tranh tổng thể về thiết kế class (hình 2.2) và mục 2.3.1 (lỗi thiếu PasswordEncoder)", href: "#/docs/springsec-02" },
      { label: "Spring Security 7.1 — Servlet Authentication Architecture: SecurityContextHolder, ProviderManager (có cha), AuthenticationProvider", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/architecture.html#servlet-authentication-providermanager" },
      { label: "Spring Security 7.1 — DaoAuthenticationProvider", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/dao-authentication-provider.html" },
      { label: "Spring Security 7.1 — Password Storage: DelegatingPasswordEncoder và định dạng {id}", href: "https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-password-storage-dpe" },
      { label: "Spring Security 7.1 — Architecture: Logging", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/architecture.html#servlet-logging" },
    ],
    stateIn: "Đầu ra s01: order có bảo mật mặc định, `answers/s01.env` đúng, test gốc xanh. `./labs/lab begin ssia s02` kiểm đầu vào bằng verify của s01, chép test vào `order/src/test/java/lab/s02/` và gỡ `S01DefaultUserTest` (khai trong `labs/ssia/sessions/s02/retire`): sau sự cố của buổi này order có user riêng, user mặc định của Boot không còn. Debugger: mở `labs/ssia/work` trong IDE như một project Maven và chạy `shop.order.OrderApplication` ở chế độ Debug.",
    stateOut: "order có bean `UserDetailsService` với user `john` / `12345` (mật khẩu lưu dạng `{noop}12345`), không còn user mặc định; `answers/s02.env` mô tả đúng đường đi của một lần đăng nhập Basic.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s02`. Chạy order với `--logging.level.org.springframework.security=TRACE`, gọi `/orders` ba lần: mật khẩu đúng, mật khẩu sai, không credential. Lưu ba đoạn log và đánh dấu dòng đầu tiên mà chúng khác nhau." },
      { id: "t2", kind: "dissect", text: "Chạy `OrderApplication` từ IDE ở chế độ Debug, đặt breakpoint trong `BasicAuthenticationFilter.doFilterInternal` (ở lời gọi `authenticate`), gọi `curl -u user:<mật khẩu> localhost:8082/orders`, rồi Step Into cho tới `PasswordEncoder.matches`. Viết `answers/s02.env` (simple name của lớp): `MANAGER_WRAPPER` (lớp của đối tượng mà filter gọi `authenticate()`), `LOCAL_PROVIDERS` (provider của ProviderManager đầu tiên, cách nhau dấu phẩy), `PROVIDER` (provider thực sự xác thực username/password), `PROVIDER_IN` (`local` nếu provider đó thuộc ProviderManager đầu tiên, `parent` nếu thuộc ProviderManager cha), `USER_DETAILS_SERVICE` và `PASSWORD_ENCODER` (lớp mà provider đó giữ — không phải lớp bên trong encoder gọi tới)." },
      { id: "t3", text: "Vẫn tại breakpoint: xem `SecurityContextHolder.getContextHolderStrategy()` và trường `securityContextRepository` của filter. SecurityContext nằm ở đâu, có vào session không? Đối chiếu với `curl -i`: response 200 có `Set-Cookie` không?" },
      { id: "t4", text: "Gây sự cố: `./labs/lab break ssia st02-no-prefix` (lab commit code của bạn trước). Một đồng nghiệp vừa thêm user `john` / `12345` cho order. Build, chạy, `curl -i -u john:12345 localhost:8082/orders`. Chẩn đoán theo trình tự (triệu chứng → log → stack trace → nguyên nhân) rồi sửa sao cho john đăng nhập được bằng đúng `12345`, không đổi username/mật khẩu, không tắt bảo mật. Đừng đọc `labs/ssia/breaks/` trước khi làm xong." },
      { id: "t5", text: "Sau khi sửa, kiểm lại `answers/s02.env`: verify đo trên app lúc chấm, nên nếu cách sửa của bạn đổi lớp mà provider giữ thì đáp án cũng đổi. `./labs/lab verify ssia s02` phải đạt 7/7." },
    ],
    hints: [
      "Ba đoạn TRACE giống nhau tới `Invoking BasicAuthenticationFilter (12/17)`. Dòng ngay sau tách chúng: `Found username 'user' in Basic Authorization header` hoặc `Did not process authentication request since failed to find username and password in Basic Authorization header`. Với mật khẩu sai, tiếp theo là `Failed to authenticate since password does not match stored value`.",
      "Step Into từ `authenticate()` đưa bạn vào một lớp bọc trước khi tới `ProviderManager`. Ở `ProviderManager`, xem danh sách `providers` và trường `parent` trong cửa sổ Variables; log TRACE `Authenticating request with <Provider> (i/n)` cho biết provider nào được thử.",
      "Sự cố: 401 giống hệt sai mật khẩu, nhưng log có `ERROR … Servlet.service() for servlet [dispatcherServlet] … threw exception` và một `java.lang.IllegalArgumentException`. Đọc vài frame trên cùng của stack trace: lớp nào ném, ai gọi nó.",
      "Không có bean `PasswordEncoder` thì provider tự tạo một encoder chọn thuật toán theo tiền tố `{id}` của mật khẩu đã lưu. Mật khẩu sinh ra ở s01 chạy được vì Boot tự thêm tiền tố cho nó; mật khẩu đồng nghiệp viết tay thì không ai thêm.",
      "Sửa ở dữ liệu (tiền tố `{id}`) hay ở cấu hình (bean `PasswordEncoder`) đều làm john đăng nhập được, nhưng đổi thứ provider giữ. Nếu chọn bean `NoOpPasswordEncoder`, mật khẩu phải là `12345` trần: NoOp so nguyên chuỗi, `{noop}12345` khác `12345`.",
    ],
    solution: `**1. Ba request trong log TRACE** (bỏ cột thời gian và PID)

\`\`\`text
# đúng mật khẩu
TRACE o.s.security.web.FilterChainProxy      : Invoking BasicAuthenticationFilter (12/17)
TRACE o.s.s.w.a.www.BasicAuthenticationFilter: Found username 'user' in Basic Authorization header
TRACE o.s.s.authentication.ProviderManager   : Authenticating request with DaoAuthenticationProvider (1/1)
DEBUG o.s.s.a.dao.DaoAuthenticationProvider  : Authenticated user
DEBUG o.s.s.w.a.www.BasicAuthenticationFilter: Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=…User [Username=user, Password=[PROTECTED], …
TRACE estMatcherDelegatingAuthorizationManager : Checking authorization on GET /orders using …AuthenticatedAuthorizationManager@…
DEBUG o.s.security.web.FilterChainProxy      : Secured GET /orders

# sai mật khẩu
DEBUG o.s.s.a.dao.DaoAuthenticationProvider  : Failed to authenticate since password does not match stored value
DEBUG o.s.s.authentication.ProviderManager   : Authentication failed with provider DaoAuthenticationProvider since Bad credentials
DEBUG o.s.s.authentication.ProviderManager   : Denying authentication since all attempted providers failed
DEBUG o.s.s.w.a.www.BasicAuthenticationFilter: Failed to process authentication request
org.springframework.security.authentication.BadCredentialsException: Bad credentials

# không credential
TRACE o.s.s.w.a.www.BasicAuthenticationFilter: Did not process authentication request since failed to find username and password in Basic Authorization header
TRACE o.s.s.w.a.AnonymousAuthenticationFilter: Set SecurityContextHolder to AnonymousAuthenticationToken [Principal=anonymousUser, … Granted Authorities=[ROLE_ANONYMOUS]]
TRACE o.s.s.w.a.ExceptionTranslationFilter   : Sending AnonymousAuthenticationToken [...] to authentication entry point since access is denied
org.springframework.security.authorization.AuthorizationDeniedException: Access Denied
\`\`\`

Hai trường hợp lỗi đều kết thúc bằng thêm một lượt \`Securing GET /error\` với người dùng ẩn danh.

**2. Debugger: đường đi thật trên 7.1.2**

1. \`BasicAuthenticationFilter.doFilterInternal\`: \`BasicAuthenticationConverter\` tạo \`UsernamePasswordAuthenticationToken\` chưa xác thực, rồi \`authenticationManager.authenticate(authRequest)\`.
2. Đối tượng đó là \`ObservationAuthenticationManager\` (ghi observation cho Micrometer), nó gọi \`delegate\` — một \`ProviderManager\` của chain.
3. ProviderManager của chain chỉ có \`AnonymousAuthenticationProvider\`, không \`supports\` token username/password → không có kết quả → gọi \`parent.authenticate(…)\`.
4. ProviderManager cha (AuthenticationManager toàn cục) có \`DaoAuthenticationProvider\` → \`AbstractUserDetailsAuthenticationProvider.authenticate\` → \`retrieveUser\` → \`InMemoryUserDetailsManager.loadUserByUsername("user")\`.
5. \`DaoAuthenticationProvider.additionalAuthenticationChecks\` → \`passwordEncoder.matches(…)\` trên một \`DelegatingPasswordEncoder\`; mật khẩu lưu là \`{noop}<uuid>\` nên nó giao cho encoder của id \`noop\`.
6. \`createSuccessAuthentication\` trả token đã xác thực về filter; filter \`setContext\` vào \`SecurityContextHolder\` (\`ThreadLocalSecurityContextHolderStrategy\`) và \`saveContext\` bằng \`RequestAttributeSecurityContextRepository\` → không có session, không \`Set-Cookie\`.

\`\`\`bash
cat > answers/s02.env <<'EOF'
MANAGER_WRAPPER=ObservationAuthenticationManager
LOCAL_PROVIDERS=AnonymousAuthenticationProvider
PROVIDER=DaoAuthenticationProvider
PROVIDER_IN=parent
USER_DETAILS_SERVICE=InMemoryUserDetailsManager
PASSWORD_ENCODER=DelegatingPasswordEncoder
EOF
\`\`\`

Sau khi sửa sự cố bằng tiền tố \`{noop}\`, cả sáu giá trị không đổi (bean của đồng nghiệp cũng là \`InMemoryUserDetailsManager\`).

**3. Sự cố st02-no-prefix — chẩn đoán**

*Triệu chứng.* \`curl -i -u john:12345 localhost:8082/orders\` → \`401\`, \`WWW-Authenticate: Basic …\`, giống hệt sai mật khẩu. Log khởi động không còn dòng \`Using generated security password\`, và ghi \`Global AuthenticationManager configured with UserDetailsService bean with name userDetailsService\`: đã có bean UserDetailsService mới.

*Log của request.* Có mức ERROR — sai mật khẩu thì không bao giờ có:

\`\`\`text
ERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception

java.lang.IllegalArgumentException: Given that there is no default password encoder configured, each password must have a password encoding prefix. Please either prefix this password with '{noop}' or set a default password encoder in \`DelegatingPasswordEncoder\`.
	at …DelegatingPasswordEncoder$UnmappedIdPasswordEncoder.matchesNonNull(DelegatingPasswordEncoder.java:304)
	at …AbstractValidatingPasswordEncoder.matches(AbstractValidatingPasswordEncoder.java:51)
	at …DelegatingPasswordEncoder.matchesNonNull(DelegatingPasswordEncoder.java:245)
	at …DaoAuthenticationProvider.additionalAuthenticationChecks(DaoAuthenticationProvider.java:89)
	at …AbstractUserDetailsAuthenticationProvider.performPreCheck(AbstractUserDetailsAuthenticationProvider.java:198)
	at …AbstractUserDetailsAuthenticationProvider.authenticate(AbstractUserDetailsAuthenticationProvider.java:159)
	at …ProviderManager.authenticate(ProviderManager.java:185)
	at …ProviderManager.authenticate(ProviderManager.java:217)
	…
	at …BasicAuthenticationFilter.doFilterInternal(BasicAuthenticationFilter.java:204)
\`\`\`

Hai frame \`ProviderManager.authenticate\` (dòng 217 rồi 185) là ProviderManager của chain gọi cha, cha gọi provider — đúng đường đi ở bước 2.

*Nguyên nhân.* Tệp mới \`order/src/main/java/shop/order/config/ProjectConfig.java\` khai \`User.withUsername("john").password("12345")\`. Không có bean \`PasswordEncoder\` nên \`DaoAuthenticationProvider\` dùng encoder mặc định của nó (\`PasswordEncoderFactories.createDelegatingPasswordEncoder()\`). Encoder này đọc \`{id}\` ở đầu mật khẩu đã lưu để chọn thuật toán; \`12345\` không có \`{…}\` nên rơi vào \`UnmappedIdPasswordEncoder\`, và nó ném \`IllegalArgumentException\`. Đây không phải \`AuthenticationException\`: không ai bắt, request thành 500, lượt \`/error\` thành 401.

*Sửa.*

\`\`\`java
UserDetails john = User.withUsername("john")
    .password("{noop}12345")     // DelegatingPasswordEncoder giao cho encoder "noop": so nguyên văn
    .authorities("read")
    .build();
\`\`\`

\`curl -u john:12345 localhost:8082/orders\` → \`[]\`. Chọn tiền tố thay vì bean \`NoOpPasswordEncoder\`: \`NoOpPasswordEncoder\` mang \`@Deprecated\` trong 7.1.2, còn tiền tố giữ đường để chương 4 chuyển sang \`{bcrypt}\` mà không đổi cấu hình. Bản lời giải: \`labs/ssia/sessions/s02/solution/\`.`,
    work: {
      patterns: [
        "Sau một thay đổi cấu hình, đăng nhập trả 401 cho cả mật khẩu đúng: trước khi sửa gì, phân biệt \"sai thông tin\" (chỉ DEBUG, `Bad credentials`) với \"lỗi trong lúc xác thực\" (ERROR + stack trace).",
        "Ticket \"POST trả 401 dù đã đăng nhập\": đọc TRACE theo thứ tự filter, tìm filter đầu tiên từ chối, rồi lần lượt `/error`.",
        "Giải thích cho đồng đội vì sao thêm một bean (UserDetailsService, PasswordEncoder) làm mất user mặc định hoặc đổi cách so mật khẩu.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Trên order sau buổi này: `curl -i -u john:12345 -H 'Content-Type: application/json' -d '{\"productId\":1,\"qty\":1}' localhost:8082/orders` trả 401 dù john đúng mật khẩu. Trong 6 phút, chỉ từ log TRACE, chỉ ra filter nào chặn và vì sao mã cuối là 401 chứ không phải 403.",
          timeLimitMin: 6,
          solution: "```text\nTRACE o.s.security.web.FilterChainProxy    : Invoking CsrfFilter (6/17)\nTRACE o.s.s.web.csrf.CsrfTokenRequestHandler : Did not find a CSRF token in the [X-CSRF-TOKEN] request header\nTRACE o.s.s.web.csrf.CsrfTokenRequestHandler : Did not find a CSRF token in the [_csrf] request parameter\nDEBUG o.s.security.web.csrf.CsrfFilter       : Invalid CSRF token found for http://localhost:8082/orders\nDEBUG o.s.s.w.access.AccessDeniedHandlerImpl : Responding with 403 status code\nDEBUG o.s.security.web.FilterChainProxy      : Securing GET /error\n… AnonymousAuthenticationFilter : Set SecurityContextHolder to AnonymousAuthenticationToken …\n```\n`CsrfFilter` (vị trí 6) chạy trước `BasicAuthenticationFilter` (12): POST bị trả 403 khi chưa ai đọc credential. 403 đi qua `sendError` → lượt `/error`, nơi Basic bỏ qua error dispatch, người dùng ẩn danh bị từ chối → 401. Cách xử lý CSRF cho API là việc của chương 9.",
        },
        {
          text: "Trong 4 phút, chỉ từ log (DEBUG trở lên), phân biệt ba lần 401: mật khẩu sai, username không tồn tại, mật khẩu lưu thiếu tiền tố `{id}`.",
          timeLimitMin: 4,
          solution: "- Mật khẩu sai: `DaoAuthenticationProvider : Failed to authenticate since password does not match stored value`, rồi `BadCredentialsException: Bad credentials`.\n- Username không tồn tại: `DaoAuthenticationProvider : Failed to find user '<tên>'`, rồi cũng `Bad credentials` (provider che `UsernameNotFoundException` — chương 3 nói vì sao).\n- Thiếu tiền tố: không có dòng `Bad credentials` nào; có `ERROR … Servlet.service() … threw exception` với `IllegalArgumentException: Given that there is no default password encoder configured…`.",
        },
      ],
    },
    tips: [
      "Bật TRACE theo gói hẹp khi chỉ cần một đoạn: `--logging.level.org.springframework.security.authentication=TRACE` cho ProviderManager và provider; cả `org.springframework.security` khi cần thấy từng filter.",
      "Một 401 đi kèm `ERROR … Servlet.service()` trong log không phải lỗi đăng nhập: đó là 500 bị lượt `/error` biến thành 401. Tìm stack trace, đừng đi đổi mật khẩu.",
      "Đặt breakpoint ở `ProviderManager.authenticate` khi chưa biết provider nào xử lý: mọi provider đều được ProviderManager gọi, và bạn thấy luôn danh sách `providers` cùng `parent`.",
      "Đừng sửa lỗi thiếu tiền tố bằng `NoOpPasswordEncoder`: nó `@Deprecated` và khoá bạn vào mật khẩu chữ thường; `{noop}` vẫn đi qua `DelegatingPasswordEncoder` nên đổi sang `{bcrypt}` sau này không cần đổi cấu hình.",
    ],
    outcome: {
      md: `Bạn đã đi trọn một lần đăng nhập Basic qua các lớp thật của 7.1.2, phân biệt được "sai mật khẩu" với "lỗi trong lúc xác thực", và sửa sự cố \`st02-no-prefix\`. Trên máy:

\`\`\`bash
./labs/lab verify ssia s02
\`\`\`

Verify đăng nhập bằng HTTP vào một context test chạy trên cổng ngẫu nhiên, rồi đi theo các đối tượng mà \`BasicAuthenticationFilter\` đang giữ (lớp bọc, các ProviderManager, provider, UserDetailsService, encoder) để so với \`answers/s02.env\`.`,
      verifyOutput: "lab: kiểm s02\n  ✓ john:12345 → 200, john + mật khẩu sai → 401\n  ✓ user mặc định của Spring Boot không còn\n  ✓ answers/s02.env: MANAGER_WRAPPER\n  ✓ answers/s02.env: LOCAL_PROVIDERS\n  ✓ answers/s02.env: PROVIDER, PROVIDER_IN\n  ✓ answers/s02.env: USER_DETAILS_SERVICE\n  ✓ answers/s02.env: PASSWORD_ENCODER\n  → 7/7 đạt",
      projectDelta: "order có user nội bộ `john` khai bằng bean `UserDetailsService` (mật khẩu `{noop}12345`, sẽ chuyển sang băm ở chương 4); user mặc định của Boot không còn.",
    },
    review: [
      { q: "Trên order, ai tạo `DaoAuthenticationProvider` và nó nằm ở ProviderManager nào?", a: "`InitializeUserDetailsBeanManagerConfigurer` tạo nó từ bean UserDetailsService duy nhất (log `Global AuthenticationManager configured with UserDetailsService bean with name …`) và đặt vào AuthenticationManager toàn cục — ProviderManager cha. ProviderManager của chain chỉ có `AnonymousAuthenticationProvider`." },
      { q: "Vì sao `password(\"12345\")` làm hỏng đăng nhập còn mật khẩu sinh ra ở s01 thì không?", a: "Không có bean PasswordEncoder nên provider dùng `DelegatingPasswordEncoder`, chọn encoder theo tiền tố `{id}` của mật khẩu đã lưu. Boot thêm `{noop}` cho mật khẩu nó sinh ra khi không có bean encoder; mật khẩu tự khai không ai thêm, nên rơi vào `UnmappedIdPasswordEncoder` và ném `IllegalArgumentException`." },
      { q: "Một ngoại lệ 500 trong lúc xác thực mà client nhận 401. Lần lại đường đi.", a: "Ngoại lệ không phải `AuthenticationException` nên thoát khỏi chain; Tomcat ghi ERROR và forward sang `/error`. Lượt `/error` đi lại qua chain, `BasicAuthenticationFilter` (một `OncePerRequestFilter`) bỏ qua error dispatch, người dùng thành ẩn danh, `AuthorizationFilter` từ chối, entry point Basic trả 401." },
      { q: "Sau khi Basic thành công, SecurityContext được giữ ở đâu và bao lâu?", a: "Trong `SecurityContextHolder` với `ThreadLocalSecurityContextHolderStrategy`, cho tới hết request. `BasicAuthenticationFilter` lưu bằng `RequestAttributeSecurityContextRepository` nên không vào session; request sau phải gửi lại credential." },
      { q: "`POST /orders` với Basic đúng trả 401. Filter nào từ chối đầu tiên và vì sao không thấy 403?", a: "`CsrfFilter` (vị trí 6, trước `BasicAuthenticationFilter`) không thấy token → `AccessDeniedHandlerImpl` trả 403 bằng `sendError`; lượt `/error` không còn credential nên thành 401." },
    ],
  },

  // ───────────────────────────── s03 ─────────────────────────────
  {
    id: "s03",
    stage: "st02",
    title: "Ghi đè các cấu hình mặc định",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s02"],
    status: "published",
    pieces: [],
    goals: [
      "Viết `SecurityFilterChain` của riêng bạn cho order — health mở cho probe, mọi thứ khác cần HTTP Basic — và giải thích vì sao việc đó làm biến mất cả chain của actuator lẫn form login.",
      "Khai `UserDetailsService` và `PasswordEncoder` thành bean và chứng minh provider dùng đúng hai bean đó.",
      "Tách quản lý user và luật web thành hai lớp cấu hình.",
      "So ba cách cắm cấu hình của mục 2.3 (bean, `http.userDetailsService(...)`, `AuthenticationProvider` tự viết) trên Spring Boot và chỉ ra cách nào để lại cửa hậu.",
    ],
    skills: [
      { skill: "cfg-userdetailsservice-bean", level: "Viết được không tra" },
      { skill: "cfg-securityfilterchain-bean", level: "Viết được không tra" },
      { skill: "cfg-multiple-config-classes", level: "Làm được có tra" },
      { skill: "int-custom-provider-sketch", level: "Giải thích được" },
    ],
    uses: ["cfg-starter-security", "int-auth-flow-diagram", "dx-security-debug-log", "dx-401-error-dispatch"],
    foundation: null,
    mindset: `**Auto-configuration lùi lại khi thấy bean của bạn — và lùi trọn gói.** Mọi thứ Boot làm hộ ở s01 đều có điều kiện:

\`\`\`mermaid
flowchart TD
  ctx[Context khởi động] --> q1{Có bean SecurityFilterChain nào?}
  q1 -- không, có actuator --> m[managementSecurityFilterChain<br/>health permitAll, còn lại authenticated<br/>cors + formLogin + httpBasic]
  q1 -- không, không actuator --> d[defaultSecurityFilterChain<br/>anyRequest authenticated<br/>formLogin + httpBasic]
  q1 -- có --> y[chỉ chain của bạn<br/>Boot không thêm gì vào chain]
  ctx --> q2{Có bean UserDetailsService,<br/>AuthenticationProvider<br/>hoặc AuthenticationManager?}
  q2 -- không --> g[inMemoryUserDetailsManager<br/>user + mật khẩu sinh ra]
  q2 -- có --> n[không có user mặc định]
  g --> gl[AuthenticationManager toàn cục<br/>DaoAuthenticationProvider]
  n --> gl2[toàn cục: DaoAuthenticationProvider từ bean UserDetailsService duy nhất,<br/>hoặc chính bean AuthenticationProvider]
\`\`\`

(\`UserDetailsServiceAutoConfiguration\` còn vài điều kiện về OAuth2 — chương 13 trở đi.)

**Viết chain riêng: được gì, mất gì.** Chain \`httpBasic\` + \`authorizeHttpRequests\` trên order có ít filter hơn chain mặc định — những filter mà \`formLogin()\` và \`cors()\` của chain actuator thêm vào không còn. Hệ quả quan sát được: \`/login\` không còn trang form, request đòi HTML nhận 401 + \`WWW-Authenticate\` thay vì 302, và \`/actuator/health/liveness\` bị chặn cho tới khi bạn tự mở. Những gì \`HttpSecurity\` tự bật thì vẫn còn: CSRF, logout, header bảo mật, request cache, anonymous, xử lý ngoại lệ.

**Ba cách cắm UserDetailsService và PasswordEncoder (mục 2.3.1, 2.3.3, 2.3.4) — đo trên order:**

| Cách | Provider nằm ở đâu | Điều bất ngờ trên Boot 4.1.2 |
|---|---|---|
| Bean \`UserDetailsService\` + bean \`PasswordEncoder\` | \`DaoAuthenticationProvider\` ở AuthenticationManager toàn cục, dùng đúng hai bean | Không — Boot lùi lại, không còn user mặc định |
| \`http.userDetailsService(...)\` trong chain, **không** có bean UserDetailsService | Một \`DaoAuthenticationProvider\` ở ProviderManager của chain | Không có bean nên Boot **vẫn** tạo \`inMemoryUserDetailsManager\` (log vẫn có \`Using generated security password\`) ở AuthenticationManager cha. Với bean \`NoOpPasswordEncoder\` như listing 2.10, \`curl -u user:<mật khẩu sinh ra>\` trả **200** |
| \`@Component\` hiện thực \`AuthenticationProvider\` | Provider của bạn thay \`DaoAuthenticationProvider\` ở toàn cục | WARN \`Global AuthenticationManager configured with an AuthenticationProvider bean. UserDetailsService beans will not be used…\` — bean UserDetailsService bị bỏ qua |

Cách thứ hai là lý do sách khuyên "chọn một kiểu và bám theo": nhìn code chỉ thấy user \`john\`, nhưng ProviderManager cha vẫn giữ một user khác. Trình tự của s02 giải thích: provider ở chain không biết \`user\` → \`Bad credentials\` → ProviderManager hỏi cha → cha xác thực thành công.`,
    bookDiff: [
      { book: "`SecurityFilterChain configure(HttpSecurity http) throws Exception`.", now: "Trong 7.1.2, `HttpSecurity.build()`, `httpBasic(...)`, `authorizeHttpRequests(...)` không khai checked exception; lời giải viết không có `throws Exception` và biên dịch được.", why: "API cấu hình của Spring Security 7 bỏ `throws Exception` khỏi chữ ký." },
      { book: "Listing 2.9/2.10: đăng ký user bằng `http.userDetailsService(...)` + bean `NoOpPasswordEncoder`, \"lựa chọn thứ hai cũng tốt không kém\".", now: "Trên Boot 4.1.2, không có bean UserDetailsService nên Boot vẫn tạo user `user` với mật khẩu sinh ra trong AuthenticationManager cha; với bean NoOp, `curl -u user:<mật khẩu sinh ra> /orders` trả 200.", why: "Sách viết như thể chỉ có một AuthenticationManager; auto-configuration chỉ lùi khi thấy bean, không nhìn vào `HttpSecurity`." },
      { book: "Chain tự viết: `anyRequest().authenticated()` hoặc `permitAll()` cho mọi request.", now: "Phải tự mở health: `requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()` (Boot 4: `org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest`, `org.springframework.boot.health.actuate.endpoint.HealthEndpoint`).", why: "Khi có bean SecurityFilterChain, `ManagementWebSecurityAutoConfiguration` lùi lại hoàn toàn; app của sách không có actuator nên không gặp." },
    ],
    refs: [
      { label: "Sách, chương 2 — mục 2.3 Ghi đè các cấu hình mặc định (2.3.1 → 2.3.5)", href: "#/docs/springsec-02" },
      { label: "Spring Security 7.1 — Java Configuration: HttpSecurity, nhiều lớp cấu hình", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/configuration/java.html" },
      { label: "Spring Security 7.1 — In-Memory Authentication", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/in-memory.html" },
      { label: "Spring Boot 4.1 — Spring Security: khi nào auto-configuration lùi lại", href: "https://docs.spring.io/spring-boot/4.1/reference/web/spring-security.html#web.security.spring-mvc" },
      { label: "Spring Boot 4.1 — Actuator: bảo mật endpoint (EndpointRequest)", href: "https://docs.spring.io/spring-boot/4.1/reference/actuator/endpoints.html#actuator.endpoints.security" },
    ],
    stateIn: "Đầu ra s02: order có `ProjectConfig` với bean UserDetailsService (john, `{noop}12345`), chain vẫn là `managementSecurityFilterChain`. `./labs/lab begin ssia s03` kiểm đầu vào bằng verify của s02, chép test vào `order/src/test/java/lab/s03/`, và gỡ `S01AnswersTest`, `S02AnswersTest` (khai trong `labs/ssia/sessions/s03/retire`): đáp án của hai buổi đó mô tả chain và provider trước khi bạn ghi đè. `answers/s01.env` vẫn ở lại — buổi này đọc khoá `FILTERS` của nó.",
    stateOut: "order có hai lớp cấu hình của bạn: một lớp khai `SecurityFilterChain` (health mở, còn lại HTTP Basic), một lớp khai `UserDetailsService` và `PasswordEncoder`; `ProjectConfig` đã xoá; `answers/s03.env` mô tả chain mới.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s03`. Trên app hiện tại, ghi lại `curl -i localhost:8082/actuator/health/liveness` và `curl -i localhost:8082/login` để so sau." },
      { id: "t2", text: "Viết lớp cấu hình luật web (tên tuỳ bạn, ví dụ `WebAuthorizationConfig` trong `shop.order.config`) với một bean `SecurityFilterChain`: `httpBasic`; `/actuator/health` cùng các đường dẫn con của nó (`liveness`, `readiness`) mở cho người chưa đăng nhập; mọi request khác `authenticated()`. Không mở `/actuator` hay `/actuator/**`." },
      { id: "t3", text: "Viết lớp cấu hình quản lý user (ví dụ `UserManagementConfig`) với bean `UserDetailsService` giữ user `john` / `12345` và bean `PasswordEncoder`. Xoá `ProjectConfig`. Verify kiểm: đúng một bean mỗi loại, provider xác thực Basic dùng đúng instance đó, và bean chain không nằm cùng lớp với hai bean kia." },
      { id: "t4", kind: "dissect", text: "Chạy lại với `--logging.level.org.springframework.security=DEBUG`, đọc dòng `Will secure any request with filters:` mới và viết `answers/s03.env`: `FILTER_COUNT` (số filter của chain của bạn), `REMOVED_FILTERS` (các filter có trong `FILTERS` của `answers/s01.env` mà nay không còn, cách nhau dấu phẩy, thứ tự tuỳ ý), `LOGIN_PAGE_STATUS` (mã trạng thái của `curl -i localhost:8082/login` khi không đăng nhập). Với mỗi filter đã mất, viết một câu: lời gọi nào của chain actuator đã thêm nó." },
      { id: "t5", text: "Thử cách của listing 2.10 rồi bỏ đi: bỏ bean UserDetailsService, đăng ký john bằng `http.userDetailsService(new InMemoryUserDetailsManager(...))` trong chain, bean PasswordEncoder là `NoOpPasswordEncoder` (mật khẩu `12345` trần). Khởi động: log còn `Using generated security password` không? Gọi `/orders` bằng `user` và mật khẩu đó. Giải thích kết quả bằng hai ProviderManager của s02. Trước khi thử, commit t3 vào git của workspace (`git add -A && git commit -m t3` trong `labs/ssia/work`); thử xong chạy `git stash -u` — cả tệp đã sửa lẫn tệp mới tạo vào stash, cây làm việc về đúng t3 (`git stash drop` nếu không cần giữ)." },
      { id: "t6", text: "`./labs/lab verify ssia s03` đạt 11/11. Chạy thêm cả bộ test: `cd labs/ssia/work && mvn -q test` — test còn hiệu lực của s01, s02 và test gốc vẫn xanh." },
    ],
    hints: [
      "Chỉ ghi `.requestMatchers(\"/actuator/health\").permitAll()` thì `/actuator/health/liveness` vẫn 401: mẫu đường dẫn đó chỉ khớp đúng một đường dẫn. Cách Boot tự làm: `.requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()` — khớp health và mọi nhóm con, theo `management.endpoints.web.base-path`.",
      "`john:12345` bị 401 sau khi thêm bean `NoOpPasswordEncoder`? NoOp so nguyên chuỗi: mật khẩu đã lưu `{noop}12345` khác `12345`. Hoặc bỏ tiền tố, hoặc dùng `PasswordEncoderFactories.createDelegatingPasswordEncoder()` làm bean (nó hiểu `{noop}`).",
      "Verify báo SecurityFilterChain và UserDetailsService \"cùng khai trong\" một lớp: test nhìn lớp chứa phương thức `@Bean`, không nhìn tên. Chuyển bean chain sang một lớp `@Configuration` khác.",
      "`REMOVED_FILTERS`: đặt dòng `Will secure any request with filters` của s01 cạnh dòng mới. Mỗi filter mất đi đều do một lời gọi của chain actuator mà chain của bạn không có — xem lại mã của `managementSecurityFilterChain` ở mục Tư duy của s01.",
      "Đừng thêm `throws Exception` chỉ vì sách có: trong 7.1.2 `HttpSecurity.build()` và các phương thức cấu hình không khai checked exception.",
    ],
    solution: `**1. Luật web — một lớp riêng**

\`\`\`java
package shop.order.config;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class WebAuthorizationConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http.httpBasic(withDefaults());
    http.authorizeHttpRequests(c -> c
        .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
        .anyRequest().authenticated());
    return http.build();
  }
}
\`\`\`

**2. User và mật khẩu — lớp thứ hai**

\`\`\`java
@Configuration
public class UserManagementConfig {

  @Bean
  UserDetailsService userDetailsService() {
    UserDetails john = User.withUsername("john").password("{noop}12345").authorities("read").build();
    return new InMemoryUserDetailsManager(john);
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
\`\`\`

Xoá \`ProjectConfig.java\`. Log khởi động giờ chỉ còn \`Global AuthenticationManager configured with UserDetailsService bean with name userDetailsService\`, không có mật khẩu sinh ra.

**3. Kiểm từ ngoài vào**

\`\`\`bash
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/actuator/health             # 200
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/actuator/health/liveness    # 200
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/actuator                    # 401
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/orders                      # 401
curl -s -o /dev/null -w '%{http_code}\\n' -u john:12345 localhost:8082/orders        # 200
curl -s -o /dev/null -w '%{http_code}\\n' localhost:8082/login                       # 401 (đăng nhập rồi: 404)
curl -i -H 'Accept: text/html' localhost:8082/orders    # 401 + WWW-Authenticate: Basic — không còn 302
\`\`\`

**4. Mổ xẻ chain mới**

\`\`\`text
DEBUG … o.s.s.web.DefaultSecurityFilterChain : Will secure any request with filters: DisableEncodeUrlFilter, WebAsyncManagerIntegrationFilter, SecurityContextHolderFilter, HeaderWriterFilter, CsrfFilter, LogoutFilter, BasicAuthenticationFilter, RequestCacheAwareFilter, SecurityContextHolderAwareRequestFilter, AnonymousAuthenticationFilter, ExceptionTranslationFilter, AuthorizationFilter
\`\`\`

\`\`\`bash
cat > answers/s03.env <<'EOF'
FILTER_COUNT=12
REMOVED_FILTERS=CorsFilter,UsernamePasswordAuthenticationFilter,DefaultResourcesFilter,DefaultLoginPageGeneratingFilter,DefaultLogoutPageGeneratingFilter
LOGIN_PAGE_STATUS=401
EOF
\`\`\`

\`CorsFilter\` do \`http.cors(withDefaults())\` của chain actuator; bốn filter còn lại do \`formLogin(withDefaults())\` (xử lý \`POST /login\`, vẽ trang login/logout và tài nguyên của chúng). \`LogoutFilter\` vẫn còn vì \`HttpSecurity\` bật logout sẵn.

**5. Listing 2.10 trên Boot — cửa hậu**

Với \`http.userDetailsService(...)\` + bean \`NoOpPasswordEncoder\` và không có bean UserDetailsService:

\`\`\`text
WARN … .s.a.UserDetailsServiceAutoConfiguration : Using generated security password: 12ae74f4-…
INFO … r$InitializeUserDetailsManagerConfigurer : Global AuthenticationManager configured with UserDetailsService bean with name inMemoryUserDetailsManager
\`\`\`

\`\`\`bash
curl -s -o /dev/null -w '%{http_code}\\n' -u user:12ae74f4-… localhost:8082/orders   # 200
curl -s -o /dev/null -w '%{http_code}\\n' -u john:12345 localhost:8082/orders        # 200
\`\`\`

Đi theo ProviderManager như s02: ProviderManager của chain có \`AnonymousAuthenticationProvider\` và một \`DaoAuthenticationProvider\` (UserDetailsService của bạn, encoder là \`HttpSecurityConfiguration$LazyPasswordEncoder\` bọc bean PasswordEncoder); cha có một \`DaoAuthenticationProvider\` khác với \`inMemoryUserDetailsManager\` của Boot. Với \`user\`, provider ở chain báo \`Failed to find user 'user'\` → \`Bad credentials\`, ProviderManager hỏi cha, cha xác thực thành công. (Nếu bean encoder là \`DelegatingPasswordEncoder\` thì lần đó lại hỏng theo kiểu s02: Boot lưu mật khẩu sinh ra **không** tiền tố khi đã có bean encoder.) Sửa: dùng bean UserDetailsService như bước 2.

**6. Provider tự viết (mục 2.3.4) — để biết, không giữ**

Một \`@Component\` hiện thực \`AuthenticationProvider\` (listing 2.13) làm log khởi động có \`WARN … Global AuthenticationManager configured with an AuthenticationProvider bean. UserDetailsService beans will not be used by Spring Security for automatically configuring username/password login…\`, và ProviderManager cha chỉ còn provider đó. Chương 6 mới viết provider thật. Bản lời giải: \`labs/ssia/sessions/s03/solution/\`.`,
    work: {
      patterns: [
        "Bật bảo mật cho một service có probe Kubernetes: viết chain riêng mà quên health thì pod không bao giờ Ready (probe nhận 401).",
        "Review một PR cấu hình bảo mật: còn user mặc định của Boot không (log `Using generated security password`), chain nào đang chạy, provider dùng encoder nào.",
        "Dọn một cấu hình trộn nhiều kiểu (bean + `http.userDetailsService` + provider tự viết) về một kiểu, và chứng minh không còn đường đăng nhập thừa.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Một PR đổi order sang `http.userDetailsService(...)` với bean `NoOpPasswordEncoder` và bỏ bean UserDetailsService; test của PR đều xanh. Trong 5 phút, chứng minh PR mở thêm một đường đăng nhập và chỉ ra vì sao.",
          timeLimitMin: 5,
          solution: "Khởi động `java -jar order/target/order.jar`: log vẫn có `Using generated security password: …` và `Global AuthenticationManager configured with UserDetailsService bean with name inMemoryUserDetailsManager`.\n```bash\ncurl -s -o /dev/null -w '%{http_code}\\n' -u user:<mật khẩu đó> localhost:8082/orders   # 200\n```\nKhông có bean UserDetailsService nên `UserDetailsServiceAutoConfiguration` vẫn tạo `inMemoryUserDetailsManager`; nó vào AuthenticationManager toàn cục, là cha của ProviderManager trong chain. Provider ở chain không biết `user` → `Bad credentials` → cha xác thực. Sửa: khai UserDetailsService thành bean.",
        },
        {
          text: "Trong 4 phút: thêm tạm một `@Component` hiện thực `AuthenticationProvider` (chấp nhận john/12345, `supports` cho `UsernamePasswordAuthenticationToken`) vào order và đọc log khởi động. Dòng nào cho biết bean UserDetailsService của bạn không còn được dùng? Xong thì xoá lớp đó.",
          timeLimitMin: 4,
          solution: "```text\nWARN … r$InitializeUserDetailsManagerConfigurer : Global AuthenticationManager configured with an AuthenticationProvider bean. UserDetailsService beans will not be used by Spring Security for automatically configuring username/password login. Consider removing the AuthenticationProvider bean. …\n```\nBean `AuthenticationProvider` được đặt vào AuthenticationManager toàn cục trước; `InitializeUserDetailsManagerConfigurer` thấy manager đã được cấu hình nên không tạo `DaoAuthenticationProvider` từ bean UserDetailsService nữa. Provider tự viết phải tự lo tìm user và so mật khẩu.",
        },
      ],
    },
    tips: [
      "Thấy `Using generated security password` sau khi đã viết cấu hình nghĩa là vẫn còn một user mặc định ở AuthenticationManager cha: tìm xem bean UserDetailsService nào còn thiếu.",
      "Bean encoder của lời giải là `PasswordEncoderFactories.createDelegatingPasswordEncoder()` chứ không phải `NoOpPasswordEncoder` như sách: Delegating chọn encoder theo tiền tố `{noop}`, nên chương 4 đổi sang băm mà không phải đổi bean.",
      "Một app, một kiểu cấu hình: bean `UserDetailsService` + bean `PasswordEncoder` là kiểu khớp với Spring Boot, vì Boot lùi lại khi thấy bean.",
      "Buổi này `begin` gỡ `S01AnswersTest` và `S02AnswersTest` (`labs/ssia/sessions/s03/retire`): đáp án của chúng mô tả chain và provider trước khi ghi đè. `S01ProtectedTest`, `S02LoginTest` vẫn đúng và vẫn chạy trong `mvn test`; nếu chạy lại `./labs/lab verify ssia s01`, các dòng của test đã gỡ sẽ báo `không chạy`.",
      "Không có `formLogin` thì không có `/login`: trình duyệt gọi `/orders` sẽ thấy hộp thoại Basic thay vì trang form.",
    ],
    outcome: {
      md: `Cấu hình bảo mật của order giờ là của bạn, tách hai lớp, không còn user hay chain nào do Boot thêm hộ — và bạn biết vì sao cách viết của listing 2.10 nguy hiểm trên Boot. Trên máy:

\`\`\`bash
./labs/lab verify ssia s03
\`\`\`

Verify chỉ nhìn bean theo kiểu của Spring Security và lớp khai báo chúng, nên tên lớp của bạn tuỳ ý; \`REMOVED_FILTERS\` được so với chain đang chạy và khoá \`FILTERS\` trong \`answers/s01.env\`.`,
      verifyOutput: "lab: kiểm s03\n  ✓ /actuator/health không đăng nhập → 200\n  ✓ /actuator/health/liveness không đăng nhập → 200\n  ✓ /actuator không đăng nhập → 401\n  ✓ /orders không đăng nhập → 401\n  ✓ john:12345 → 200\n  ✓ đúng một SecurityFilterChain, do bạn khai\n  ✓ provider dùng bean UserDetailsService và PasswordEncoder của bạn\n  ✓ user/mật khẩu và luật web ở hai lớp cấu hình khác nhau\n  ✓ answers/s03.env: FILTER_COUNT\n  ✓ answers/s03.env: REMOVED_FILTERS\n  ✓ answers/s03.env: LOGIN_PAGE_STATUS\n  → 11/11 đạt",
      projectDelta: "order có `WebAuthorizationConfig` (luật endpoint) và `UserManagementConfig` (user, encoder). Các chương sau sửa đúng hai lớp này: chương 3 thay user trong bộ nhớ bằng DB, chương 4 đổi encoder, chương 5 thêm filter vào chain.",
    },
    review: [
      { q: "Thêm một bean `SecurityFilterChain` vào order thì những gì Boot làm hộ biến mất?", a: "Cả `managementSecurityFilterChain`: không còn `permitAll` cho health, không còn `cors`, không còn `formLogin` (trang `/login`, xử lý `POST /login`, trang logout). Những gì `HttpSecurity` tự bật vẫn còn: CSRF, logout, header, request cache, anonymous, ExceptionTranslationFilter." },
      { q: "Vì sao listing 2.10 để lại cửa hậu trên Spring Boot?", a: "Không có bean UserDetailsService nên Boot vẫn tạo user `user` với mật khẩu sinh ra trong AuthenticationManager toàn cục — cha của ProviderManager trong chain. Provider ở chain từ chối `user`, ProviderManager hỏi cha, cha chấp nhận; với NoOp encoder, `curl -u user:<mật khẩu sinh ra>` trả 200." },
      { q: "Test kiểm \"provider dùng đúng bean PasswordEncoder của bạn\" thế nào mà không biết tên lớp bạn đặt?", a: "Lấy `BasicAuthenticationFilter` trong chain của `GET /orders`, đi qua lớp bọc và các ProviderManager tới provider đầu tiên `supports` `UsernamePasswordAuthenticationToken`, gọi `getPasswordEncoder()` và so `isSameAs` với bean PasswordEncoder duy nhất trong context." },
      { q: "Có một `@Component AuthenticationProvider`, bean UserDetailsService còn được dùng không?", a: "Không cho đăng nhập username/password tự động: `InitializeUserDetailsManagerConfigurer` thấy AuthenticationManager toàn cục đã có provider, in WARN `…UserDetailsService beans will not be used…` và không tạo `DaoAuthenticationProvider`." },
      { q: "Sau khi viết chain, probe `/actuator/health/liveness` nhận 401. Sửa ở đâu, bằng gì?", a: "Trong chain của bạn: `requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()` trước `anyRequest().authenticated()`. Chỉ ghi `\"/actuator/health\"` thì không khớp đường dẫn con." },
    ],
  },
];
