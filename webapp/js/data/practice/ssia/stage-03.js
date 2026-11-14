// Chặng 3 — Quản lý user (chương 3 của sách). Ba buổi đã phát hành.
// Script lab: labs/ssia/sessions/s04…s06 (test ở order/src/test/java/lab/<buổi>/), sự cố labs/ssia/breaks/st03-sql-init-off.
// Mọi lớp, log, mã trạng thái dưới đây đo trên labs/ssia/app với Spring Boot 4.1.2 / Spring Security 7.1.2.

export const sessions = [
  // ───────────────────────────── s04 ─────────────────────────────
  {
    id: "s04",
    stage: "st03",
    title: "UserDetails của shop: thực thể riêng, lớp bọc, và Authentication sau đăng nhập",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s03"],
    status: "published",
    pieces: [],
    goals: [
      "Đọc contract `UserDetails` và `GrantedAuthority` trên bản 7.1.2: phương thức nào có hiện thực `default`, provider gọi từng phương thức ở bước nào của lần đăng nhập.",
      "Tách user của shop thành một thực thể không biết gì về Spring Security và một lớp bọc hiện thực `UserDetails`; thêm user thứ hai `mary`.",
      "Mổ xẻ đối tượng `Authentication` mà `BasicAuthenticationFilter` đặt vào `SecurityContext`: principal là gì, credentials còn gì, có những authority nào — kể cả authority không có trong dữ liệu của bạn.",
      "Chẩn đoán lỗi đảo nghĩa một cờ trạng thái tài khoản theo trình tự triệu chứng → log → nguyên nhân → sửa.",
    ],
    skills: [
      { skill: "int-userdetails-contract", level: "Giải thích được" },
      { skill: "int-grantedauthority", level: "Giải thích được" },
      { skill: "cfg-userdetails-impl", level: "Viết được không tra" },
      { skill: "int-userdetails-wrapper", level: "Giải thích được" },
    ],
    uses: ["cfg-userdetailsservice-bean", "cfg-multiple-config-classes", "dx-security-debug-log", "int-debug-breakpoint-filter"],
    foundation: null,
    mindset: `**\`UserDetails\` là hợp đồng giữa dữ liệu của bạn và provider.** Ở s02 bạn thấy \`DaoAuthenticationProvider\` nhận một \`UserDetails\` từ \`UserDetailsService\` rồi so mật khẩu. Buổi này nhìn kỹ hơn: provider đọc *phương thức nào* của đối tượng đó, *khi nào*, và trả lại cho filter cái gì. Đọc từ mã nguồn \`AbstractUserDetailsAuthenticationProvider\` 7.1.2 và đối chiếu với log DEBUG trên order:

\`\`\`mermaid
sequenceDiagram
  participant P as DaoAuthenticationProvider
  participant U as UserDetailsService của bạn
  participant S as SecurityUser (UserDetails)
  participant E as PasswordEncoder
  participant M as ProviderManager
  P->>U: loadUserByUsername("mary")
  U-->>P: new SecurityUser(ShopUser mary)
  P->>S: isAccountNonLocked() · isEnabled() · isAccountNonExpired()
  Note over P,S: false → LockedException / DisabledException / AccountExpiredException
  P->>S: getPassword()
  P->>E: matches("67890", "{noop}67890")
  P->>S: isCredentialsNonExpired()
  P->>S: getAuthorities()
  P-->>M: UsernamePasswordAuthenticationToken(principal = SecurityUser,<br/>authorities = read, write + FACTOR_PASSWORD)
  M->>M: eraseCredentials() trước khi trả về filter
\`\`\`

Ba điều rút ra:

- **Bốn cờ được kiểm lúc xác thực, không phải lúc phân quyền.** Trong 7.1.2 cả bốn là phương thức \`default\` trả \`true\` — lớp của bạn chỉ cần ghi đè cờ nào thật sự có trong dữ liệu. Tên đặt theo kiểu "true = được phép" (\`isAccountNonLocked\`), nên cột \`locked = true\` phải thành \`false\` ở đây; viết ngược là khoá cả shop (drill 1).
- **Authority của \`Authentication\` không chỉ là authority của user.** Provider chép \`getAuthorities()\` rồi thêm một \`FactorGrantedAuthority\` ghi lại *cách* user vừa xác thực (mật khẩu). Trên order, dòng DEBUG của \`BasicAuthenticationFilter\` cho mary: \`Granted Authorities=[read, write, FactorGrantedAuthority [authority=FACTOR_PASSWORD, issuedAt=…]]\`. Chương 7 viết luật theo authority — bạn cần biết danh sách thật trông thế nào.
- **Principal giữ đúng đối tượng \`UserDetailsService\` trả về** — nếu chính \`UserDetailsService\` không đổi nó. \`InMemoryUserDetailsManager\` chép mọi \`UserDetails\` bạn đưa vào thành một \`org.springframework.security.core.userdetails.User\` mới: bọc \`SecurityUser\` rồi đưa cho nó, principal sau đăng nhập vẫn là \`User\` (đo trên order: \`Principal=org.springframework.security.core.userdetails.User [Username=mary, …]\`). Muốn principal là lớp của bạn thì \`UserDetailsService\` phải là của bạn.

**Vì sao tách thực thể và lớp bọc.** \`ShopUser\` là thứ shop lưu (định danh, mật khẩu đã lưu, quyền, trạng thái) và được repository, controller dùng; \`SecurityUser\` chỉ dịch nó sang ngôn ngữ của Spring Security. Thực thể không import gì từ \`org.springframework.security\`, nên s05 đổi nguồn dữ liệu sang DB mà không chạm tới lớp bọc, và chương 7 đổi cách ánh xạ authority mà không chạm tới thực thể (mục 3.2.5 của sách).

**Credentials sau đăng nhập.** \`ProviderManager\` gọi \`eraseCredentials()\` trên kết quả: \`getCredentials()\` của token thành \`null\`, và principal chỉ bị xoá mật khẩu nếu nó hiện thực \`CredentialsContainer\` (lớp \`User\` của Spring có; \`SecurityUser\` thì không). Đo trên order: sau đăng nhập, \`principal.getPassword()\` của mary vẫn là \`{noop}67890\` — mật khẩu đã lưu nằm trong \`SecurityContext\` suốt request (drill 2).`,
    bookDiff: [
      { book: "Listing 3.1: `UserDetails` khai bảy phương thức trừu tượng; lớp hiện thực phải viết cả bốn phương thức trạng thái (listing 3.4).", now: "7.1.2: `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled` là phương thức `default` trả `true`; chỉ `getAuthorities`, `getPassword` (`@Nullable`), `getUsername` là trừu tượng.", why: "Spring Security thêm hiện thực mặc định để lớp không có khái niệm khoá/hết hạn khỏi phải viết bốn dòng `return true`. Đáp án `DEFAULT_METHODS` được đo bằng reflection trên interface của bản đang chạy." },
      { book: "Authority của user là tập authority mà ứng dụng dùng để phân quyền.", now: "Sau đăng nhập bằng mật khẩu, `Authentication.getAuthorities()` có thêm `FactorGrantedAuthority` với authority `FACTOR_PASSWORD` (kèm `issuedAt`), không có trong `UserDetails.getAuthorities()`.", why: "Từ 7.0, các cơ chế xác thực thêm một factor authority ghi lại yếu tố đã dùng — nền cho xác thực nhiều yếu tố (tài liệu 7.1: Multi-Factor Authentication)." },
    ],
    refs: [
      { label: "Sách, chương 3 — mục 3.1 Hiện thực authentication, 3.2.1–3.2.5 Mô tả user (UserDetails, GrantedAuthority, hiện thực tối giản, builder, tách trách nhiệm)", href: "#/docs/springsec-03" },
      { label: "Spring Security 7.1 — UserDetails", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/user-details.html" },
      { label: "Spring Security 7.1 — Authentication Architecture: GrantedAuthority", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/architecture.html#servlet-authentication-granted-authority" },
      { label: "Spring Security 7.1 — Authentication Architecture: ProviderManager xoá credentials", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/architecture.html#servlet-authentication-providermanager-erasing-credentials" },
      { label: "Spring Security 7.1 — Multi-Factor Authentication (FactorGrantedAuthority, FACTOR_PASSWORD)", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/mfa.html" },
    ],
    stateIn: "Đầu ra s03: `UserManagementConfig` giữ john (`{noop}12345`, authority `read`) trong một `InMemoryUserDetailsManager`, `WebAuthorizationConfig` khai chain. `./labs/lab begin ssia s04` kiểm đầu vào bằng verify của s03 và chép test vào `order/src/test/java/lab/s04/`. Buổi này không gỡ test nào: john/12345 vẫn phải đăng nhập được, các bean vẫn đúng một mỗi loại.",
    stateOut: "order có `ShopUser` (thực thể của shop, không import Spring Security), `SecurityUser` (hiện thực `UserDetails`, bọc `ShopUser`) và một `UserDetailsService` của bạn giữ john [read], mary [read, write] trong bộ nhớ; `answers/s04.env` mô tả `Authentication` của mary sau đăng nhập.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s04`. Trong IDE mở `UserDetails` và `GrantedAuthority` (bản 7.1.2 trong jar `spring-security-core`). Ghi lại phương thức nào trừu tượng, phương thức nào `default`. Rồi mở `AbstractUserDetailsAuthenticationProvider` và tìm hai lớp lồng `DefaultPreAuthenticationChecks`, `DefaultPostAuthenticationChecks`: cờ nào được kiểm trước khi so mật khẩu, cờ nào sau, mỗi cờ sai ném ngoại lệ gì." },
      { id: "t2", text: "Viết thực thể user của shop (ví dụ record `ShopUser` trong `shop.order.user`: `id`, `username`, `password` đã lưu, danh sách authority dạng chuỗi, `enabled`, `locked`) — không import gì từ `org.springframework.security`. Viết lớp bọc (ví dụ `SecurityUser`) hiện thực `UserDetails`, giữ thực thể trong một trường `final`, dịch từng phương thức sang dữ liệu của thực thể. Tên lớp tuỳ bạn; verify chỉ đòi principal là một `UserDetails` không thuộc `org.springframework` và có một trường kiểu thực thể của bạn." },
      { id: "t3", text: "Thử trước: trong `UserManagementConfig`, đưa hai `SecurityUser` (john `{noop}12345` [read], mary `{noop}67890` [read, write]) vào `new InMemoryUserDetailsManager(...)`. Chạy `cd labs/ssia/work && mvn -q -pl order -am package -DskipTests && java -jar order/target/order.jar --logging.level.org.springframework.security=DEBUG`, gọi `curl -u mary:67890 localhost:8082/orders` và đọc dòng `Set SecurityContextHolder to …`: principal là lớp nào? Rồi thay bằng `UserDetailsService` của bạn (một `Map` trong bộ nhớ là đủ — s05 chuyển sang DB) trả về `SecurityUser`, ném `UsernameNotFoundException` khi không có user." },
      { id: "t4", kind: "dissect", text: "Chạy `OrderApplication` ở chế độ Debug, đặt breakpoint ở dòng ngay sau `Authentication authResult = this.authenticationManager.authenticate(authRequest)` trong `BasicAuthenticationFilter.doFilterInternal`, gọi `curl -u mary:67890 localhost:8082/orders` và xem `authResult`. Viết `answers/s04.env`: `PRINCIPAL_CLASS` (simple name lớp của principal), `EXTRA_AUTHORITY` (authority có trong `authResult.getAuthorities()` mà không có trong `getAuthorities()` của principal; nhiều thì cách nhau dấu phẩy), `EXTRA_AUTHORITY_CLASS` (simple name lớp của authority đó), `DEFAULT_METHODS` (các phương thức `default` của `UserDetails` bạn ghi ở t1, cách nhau dấu phẩy), `AUTH_CLASS` (simple name lớp của `authResult`), `CREDENTIALS_AFTER_LOGIN` (giá trị `getCredentials()`; `null` thì ghi `null`), `PRINCIPAL_PASSWORD_AFTER_LOGIN` (giá trị `getPassword()` của principal trong `authResult`, ghi nguyên văn; `null` thì ghi `null`). Verify đăng nhập mary qua đúng `AuthenticationManager` của filter lúc chấm và so." },
      { id: "t5", text: "`./labs/lab verify ssia s04` đạt 8/8. Chạy cả bộ test: `cd labs/ssia/work && mvn -q test` — test của s01–s03 và test gốc vẫn xanh." },
    ],
    hints: [
      "Không cần debugger để thấy `Authentication`: dòng DEBUG `o.s.s.w.a.www.BasicAuthenticationFilter : Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=…, Credentials=[PROTECTED], …, Granted Authorities=[…]]` in `toString()` của chính đối tượng đó. Viết `toString()` cho `SecurityUser` để dòng này dễ đọc.",
      "Principal vẫn là `org.springframework.security.core.userdetails.User` dù bạn đã viết `SecurityUser`? Xem `InMemoryUserDetailsManager.loadUserByUsername`: nó trả về `new User(...)` dựng từ dữ liệu đã lưu, không trả đối tượng bạn đưa vào.",
      "`getAuthorities()` của `SecurityUser`: `user.authorities().stream().map(SimpleGrantedAuthority::new).toList()`. Lambda `() -> \"read\"` như sách cũng chạy, nhưng lớp của nó là một lớp ẩn do JVM sinh, khó đọc trong log và debugger.",
      "`CREDENTIALS_AFTER_LOGIN` nhìn ở `authResult`, không ở `authRequest`: `authRequest` là token chưa xác thực vẫn giữ mật khẩu gõ vào; `ProviderManager` xoá credentials trên kết quả trước khi trả về.",
      "Verify báo principal không \"bọc một thực thể user riêng\": test tìm trong lớp principal một trường không tĩnh có kiểu là lớp của bạn (không phải `java.*`, `org.springframework.*`, và không phải `UserDetails`). Giữ thực thể làm trường, đừng chép từng giá trị sang trường `String`.",
    ],
    solution: `**1. Contract trên bản 7.1.2**

\`UserDetails\`: trừu tượng \`getAuthorities()\`, \`getPassword()\` (\`@Nullable\`), \`getUsername()\`; \`default\` (trả \`true\`) \`isAccountNonExpired()\`, \`isAccountNonLocked()\`, \`isCredentialsNonExpired()\`, \`isEnabled()\`. \`GrantedAuthority\`: một phương thức \`getAuthority()\`. Trong \`AbstractUserDetailsAuthenticationProvider\`: trước khi so mật khẩu, \`DefaultPreAuthenticationChecks\` kiểm *locked* (\`LockedException\` "User account is locked"), *enabled* (\`DisabledException\` "User is disabled"), *expired* (\`AccountExpiredException\`); sau khi so, \`DefaultPostAuthenticationChecks\` kiểm *credentials expired* (\`CredentialsExpiredException\`).

**2. Thực thể và lớp bọc**

\`\`\`java
package shop.order.user;

/** User của shop như nghiệp vụ hiểu. Không biết gì về Spring Security. */
public record ShopUser(long id, String username, String password, List<String> authorities,
    boolean enabled, boolean locked) implements Serializable {
  public ShopUser {
    authorities = List.copyOf(authorities);
  }
}
\`\`\`

\`\`\`java
public final class SecurityUser implements UserDetails {
  private final ShopUser user;

  public SecurityUser(ShopUser user) { this.user = Objects.requireNonNull(user, "user"); }
  public ShopUser user() { return user; }

  @Override public String getUsername() { return user.username(); }
  @Override public String getPassword() { return user.password(); }
  @Override public Collection<? extends GrantedAuthority> getAuthorities() {
    return user.authorities().stream().map(SimpleGrantedAuthority::new).toList();
  }
  // Tên phủ định: true nghĩa là "được phép". Cột locked=true phải thành false ở đây.
  @Override public boolean isAccountNonLocked() { return !user.locked(); }
  @Override public boolean isEnabled() { return user.enabled(); }
  @Override public String toString() { return "SecurityUser[" + user.username() + ", " + user.authorities() + "]"; }
}
\`\`\`

(\`ShopUser\` hiện thực \`Serializable\` vì \`UserDetails\` là \`Serializable\`: principal có thể được lưu vào session ở chương sau.)

**3. InMemoryUserDetailsManager đổi lớp của bạn — rồi thay nó**

Với \`new InMemoryUserDetailsManager(new SecurityUser(...), new SecurityUser(...))\`:

\`\`\`text
DEBUG … o.s.s.w.a.www.BasicAuthenticationFilter : Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=org.springframework.security.core.userdetails.User [Username=mary, Password=[PROTECTED], Enabled=true, AccountNonExpired=true, CredentialsNonExpired=true, AccountNonLocked=true, Granted Authorities=[read, write]], Credentials=[PROTECTED], Authenticated=true, Details=WebAuthenticationDetails [RemoteIpAddress=0:0:0:0:0:0:0:1, SessionId=null], Granted Authorities=[read, write, FactorGrantedAuthority [authority=FACTOR_PASSWORD, issuedAt=…]]]
\`\`\`

\`UserDetailsService\` của bạn:

\`\`\`java
@Configuration
public class UserManagementConfig {
  // Tạm giữ trong bộ nhớ; s05 chuyển sang bảng shop_users.
  private static final Map<String, ShopUser> USERS = Map.of(
      "john", new ShopUser(1, "john", "{noop}12345", List.of("read"), true, false),
      "mary", new ShopUser(2, "mary", "{noop}67890", List.of("read", "write"), true, false));

  @Bean
  UserDetailsService userDetailsService() {
    return username -> Optional.ofNullable(USERS.get(username))
        .map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  PasswordEncoder passwordEncoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }
}
\`\`\`

\`\`\`text
DEBUG … BasicAuthenticationFilter : Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=SecurityUser[mary, [read, write]], Credentials=[PROTECTED], Authenticated=true, …, Granted Authorities=[read, write, FactorGrantedAuthority [authority=FACTOR_PASSWORD, issuedAt=2026-11-14T03:22:54.844197Z]]]
DEBUG … BasicAuthenticationFilter : Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=SecurityUser[john, [read]], …, Granted Authorities=[read, FactorGrantedAuthority [authority=FACTOR_PASSWORD, …]]]
\`\`\`

\`curl -u mary:67890\` → 200, \`-u mary:bad\` → 401 (\`Failed to authenticate since password does not match stored value\`), \`-u nobody:x\` → 401 (\`Failed to find user 'nobody'\`).

**4. Mổ xẻ authResult**

\`\`\`bash
cat > answers/s04.env <<'EOF'
PRINCIPAL_CLASS=SecurityUser
EXTRA_AUTHORITY=FACTOR_PASSWORD
EXTRA_AUTHORITY_CLASS=FactorGrantedAuthority
DEFAULT_METHODS=isAccountNonExpired,isAccountNonLocked,isCredentialsNonExpired,isEnabled
AUTH_CLASS=UsernamePasswordAuthenticationToken
CREDENTIALS_AFTER_LOGIN=null
PRINCIPAL_PASSWORD_AFTER_LOGIN={noop}67890
EOF
\`\`\`

\`FACTOR_PASSWORD\` được \`AbstractUserDetailsAuthenticationProvider.createSuccessAuthentication\` thêm bằng \`FactorGrantedAuthority.fromAuthority(FactorGrantedAuthority.PASSWORD_AUTHORITY)\`. Principal vẫn giữ mật khẩu đã lưu vì \`SecurityUser\` không hiện thực \`CredentialsContainer\` (Tư duy, drill 2). Credentials là \`null\` vì \`ProviderManager\` (\`eraseCredentialsAfterAuthentication = true\`) gọi \`eraseCredentials()\` trên kết quả; \`UsernamePasswordAuthenticationToken.eraseCredentials()\` đặt \`credentials = null\`. Bản lời giải: \`labs/ssia/sessions/s04/solution/\`.`,
    work: {
      patterns: [
        "Thiết kế lớp user cho một service mới: thực thể của nghiệp vụ tách khỏi `UserDetails`, để đổi nguồn dữ liệu (bộ nhớ → DB → dịch vụ khác) mà không chạm tầng bảo mật.",
        "Code nghiệp vụ ép kiểu principal sang lớp của bạn và gặp `ClassCastException`: kiểm `UserDetailsService` có trả nguyên đối tượng không (`InMemoryUserDetailsManager` thì không).",
        "Viết luật phân quyền hoặc log audit theo authority: đọc danh sách thật của `Authentication` (có `FACTOR_PASSWORD`), không đoán theo dữ liệu user.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Sự cố: sau một lần refactor `SecurityUser`, cả john lẫn mary nhận 401 dù đúng mật khẩu; test đơn vị của thực thể vẫn xanh. Trong 6 phút, tìm bằng chứng trong log và sửa.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** `curl -i -u john:12345 localhost:8082/orders` → `401`, `WWW-Authenticate: Basic …`; sai mật khẩu cũng 401, nhìn từ client không phân biệt được.\n\n**Bằng chứng.** Chạy lại với `--logging.level.org.springframework.security=DEBUG`:\n```text\nDEBUG o.s.s.a.dao.DaoAuthenticationProvider : Failed to authenticate since user account is locked\nDEBUG o.s.s.authentication.ProviderManager  : Authentication failed for user 'john' since their account status is User account is locked\norg.springframework.security.authentication.LockedException: User account is locked\n\tat …AbstractUserDetailsAuthenticationProvider$DefaultPreAuthenticationChecks.check(AbstractUserDetailsAuthenticationProvider.java:374)\n```\nKhông có dòng `password does not match`: lần đăng nhập dừng ở kiểm tra trước mật khẩu. Gõ sai mật khẩu cũng ra đúng dòng này — khoá được kiểm trước.\n\n**Nguyên nhân.** `isAccountNonLocked()` trả `user.locked()` thay vì `!user.locked()`: mọi user không khoá bị coi là khoá.\n\n**Sửa.** `return !user.locked();`. Tên `isAccountNonLocked` đặt theo kiểu true = được phép (sách, ghi chú cuối mục 3.2.1); cột trong dữ liệu thì đặt theo kiểu true = bị khoá — chỗ dịch là nơi dễ sai nhất.",
        },
        {
          text: "Trong 5 phút, chứng minh mật khẩu đã lưu của mary còn hay không còn trong `SecurityContext` sau khi đăng nhập, và giải thích vì sao kết quả khác nếu principal là `User` của Spring.",
          timeLimitMin: 5,
          solution: "Tại breakpoint của t4, Evaluate `((UserDetails) authResult.getPrincipal()).getPassword()` → `\"{noop}67890\"`; `authResult.getCredentials()` → `null`.\n\n`ProviderManager` gọi `eraseCredentials()` trên token. `AbstractAuthenticationToken.eraseCredentials()` chỉ xoá principal nếu principal hiện thực `CredentialsContainer` — `User` của Spring hiện thực (đặt `password = null`), `SecurityUser` thì không, nên mật khẩu đã lưu ở lại cho tới hết request. Muốn xoá: cho `SecurityUser` hiện thực `CredentialsContainer`. Lưu ý mà tài liệu 7.1 nêu: nếu có cache user, việc xoá làm hỏng đối tượng trong cache — phải sao chép trước.",
        },
      ],
    },
    tips: [
      "Viết `toString()` cho lớp `UserDetails` của bạn: log DEBUG và debugger in principal bằng nó. Đừng in mật khẩu.",
      "Cần thêm thông tin của user trong controller (id, email…)? Lấy principal và ép về `SecurityUser` rồi gọi `user()` — chỉ an toàn khi `UserDetailsService` trả đúng lớp đó, điều mà verify buổi này kiểm.",
      "Không ghi đè cờ nào mà dữ liệu không có: các phương thức `default` của 7.1.2 đã trả `true`. Ghi đè cờ chỉ để trả `true` là thêm chỗ để viết sai.",
      "Khi đọc log, `Granted Authorities=[…]` xuất hiện hai lần trên một dòng: lần trong `Principal=…` là của `UserDetails`, lần cuối là của `Authentication` (có thêm `FACTOR_PASSWORD`).",
    ],
    outcome: {
      md: `User của order giờ có hai lớp rõ vai: thực thể của shop và lớp bọc cho Spring Security; bạn biết chính xác \`Authentication\` sau đăng nhập chứa gì. Trên máy:

\`\`\`bash
./labs/lab verify ssia s04
\`\`\`

Verify đăng nhập john và mary bằng HTTP trên cổng ngẫu nhiên, rồi đăng nhập lại qua đúng \`AuthenticationManager\` mà \`BasicAuthenticationFilter\` giữ để lấy đối tượng \`Authentication\` thật, kiểm principal và authority, và so với \`answers/s04.env\`.`,
      verifyOutput: "lab: kiểm s04\n  ✓ john:12345 và mary:67890 → 200, mary với mật khẩu của john → 401\n  ✓ principal sau đăng nhập là UserDetails của bạn\n  ✓ principal bọc một thực thể user riêng\n  ✓ authority đúng như dữ liệu: john [read], mary [read, write]\n  ✓ answers/s04.env: PRINCIPAL_CLASS\n  ✓ answers/s04.env: EXTRA_AUTHORITY, EXTRA_AUTHORITY_CLASS\n  ✓ answers/s04.env: DEFAULT_METHODS\n  ✓ answers/s04.env: AUTH_CLASS, CREDENTIALS_AFTER_LOGIN, PRINCIPAL_PASSWORD_AFTER_LOGIN\n  → 8/8 đạt",
      projectDelta: "order có thực thể `ShopUser` và lớp bọc `SecurityUser`; user thứ hai `mary` [read, write]. Chương 7 viết luật endpoint theo hai authority này.",
    },
    review: [
      { q: "Provider kiểm bốn cờ của `UserDetails` ở đâu trong lần đăng nhập, và cờ sai cho client thấy gì?", a: "Trong `AbstractUserDetailsAuthenticationProvider.authenticate`: locked, enabled, account expired trước khi so mật khẩu (`DefaultPreAuthenticationChecks`), credentials expired sau (`DefaultPostAuthenticationChecks`). Mỗi cờ sai ném một `AccountStatusException` (vd. `LockedException`); `BasicAuthenticationFilter` bắt như mọi `AuthenticationException` và entry point trả 401." },
      { q: "Vì sao bọc `SecurityUser` rồi đưa vào `InMemoryUserDetailsManager` thì principal sau đăng nhập không phải `SecurityUser`?", a: "`InMemoryUserDetailsManager` lưu một bản sao (`MutableUser`) và `loadUserByUsername` trả `new User(...)` dựng từ bản sao. Principal là đối tượng `UserDetailsService` trả về, nên muốn giữ lớp của mình phải tự viết `UserDetailsService`." },
      { q: "`Authentication` của mary có những authority nào, và cái nào không đến từ dữ liệu?", a: "`read`, `write` (từ `getAuthorities()` của principal) và `FactorGrantedAuthority` `FACTOR_PASSWORD` do provider thêm khi xác thực bằng mật khẩu (từ 7.0)." },
      { q: "Sau đăng nhập, `getCredentials()` là `null` nhưng mật khẩu đã lưu vẫn đọc được từ principal. Vì sao?", a: "`ProviderManager.eraseCredentials` xoá credentials của token, còn principal chỉ bị xoá nếu hiện thực `CredentialsContainer`. `User` của Spring có, `SecurityUser` không." },
      { q: "Lợi ích cụ thể của việc `ShopUser` không import Spring Security?", a: "Repository, controller, test nghiệp vụ dùng nó mà không kéo theo contract bảo mật; đổi nguồn dữ liệu (s05: DB) hay cách ánh xạ authority chỉ sửa đúng một phía. Lớp bọc giữ thực thể trong trường `final`: không có thực thể thì không có `SecurityUser`." },
    ],
  },

  // ───────────────────────────── s05 ─────────────────────────────
  {
    id: "s05",
    stage: "st03",
    title: "UserDetailsService đọc user từ DB: không tồn tại, bị khoá, bị vô hiệu",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s04"],
    status: "published",
    pieces: ["users-db"],
    goals: [
      "Đưa user của order vào hai bảng `shop_users`, `shop_user_authorities` (H2, `schema.sql` + `data.sql`) và viết `UserDetailsService` đọc chúng bằng `JdbcClient`.",
      "Phân biệt năm kiểu từ chối — sai mật khẩu, không có user, bị khoá, bị vô hiệu, DB lỗi — khi client chỉ thấy cùng một 401, bằng log DEBUG và ngoại lệ.",
      "Giải thích vì sao `UsernameNotFoundException` bị che thành `Bad credentials`, cờ nào điều khiển, đổi nó ở đâu và vì sao nên để nguyên.",
      "Chẩn đoán sự cố `st03-sql-init-off`: mọi đăng nhập 401, health vẫn UP, log INFO sạch.",
    ],
    skills: [
      { skill: "cfg-userdetailsservice-db", level: "Viết được không tra" },
      { skill: "dx-username-not-found", level: "Làm được có tra" },
      { skill: "dx-account-status-errors", level: "Làm được có tra" },
    ],
    uses: ["int-userdetails-contract", "cfg-userdetails-impl", "int-userdetails-wrapper", "dx-security-debug-log"],
    foundation: null,
    mindset: `**\`UserDetailsService\` chỉ trả lời một câu: "username này là ai?".** Nó không so mật khẩu, không xét khoá — nó trả một \`UserDetails\` hoặc ném \`UsernameNotFoundException\`. Mọi quyết định còn lại là của provider. Trên order sau buổi này: \`ShopUserRepository\` (JdbcClient, như \`OrderController\`) đọc \`ShopUser\` từ DB, \`UserDetailsService\` bọc thành \`SecurityUser\` của s04. Các nhánh trong \`DaoAuthenticationProvider\` (mã nguồn 7.1.2, đối chiếu log trên order):

\`\`\`mermaid
flowchart TD
  a[DaoAuthenticationProvider.authenticate] --> r[retrieveUser → loadUserByUsername]
  r -- UsernameNotFoundException --> h{hideUserNotFoundExceptions}
  h -- true, mặc định --> bc[BadCredentialsException Bad credentials<br/>cause: UsernameNotFoundException]
  h -- false --> unf[UsernameNotFoundException]
  r -- ngoại lệ khác, vd. lỗi SQL --> ias[InternalAuthenticationServiceException]
  r -- UserDetails --> pre[kiểm trước: locked → enabled → expired]
  pre -- sai --> ase[LockedException / DisabledException / AccountExpiredException]
  pre -- đạt --> pw[PasswordEncoder.matches]
  pw -- sai --> bc2[BadCredentialsException]
  pw -- đúng --> post[kiểm sau: credentials expired] --> ok[token đã xác thực]
  bc --> f[BasicAuthenticationFilter bắt AuthenticationException<br/>entry point: 401 + WWW-Authenticate]
  unf --> f
  ias --> f
  ase --> f
  bc2 --> f
\`\`\`

**Năm lần 401, đo trên order** (\`--logging.level.org.springframework.security=DEBUG\`):

| Request | DEBUG ghi gì | Ngoại lệ ra khỏi AuthenticationManager |
|---|---|---|
| \`john\` sai mật khẩu | \`Failed to authenticate since password does not match stored value\` | \`BadCredentialsException\` |
| \`ghost\` (không có) | \`Failed to find user 'ghost'\` | \`BadCredentialsException\`, \`Caused by: UsernameNotFoundException: User not found\` |
| \`bill\` đúng mật khẩu | \`Failed to authenticate since user account is locked\` · \`Authentication failed for user 'bill' since their account status is User account is locked\` | \`LockedException\` |
| \`bill\` sai mật khẩu | cả \`…account is locked\` lẫn \`…password does not match…\` | vẫn \`LockedException\` |
| DB không có bảng (sự cố) | \`Authentication service failed internally for user 'john'\` | \`InternalAuthenticationServiceException\`, gốc là \`Table "SHOP_USERS" not found\` |

Client thấy cùng một thứ cho cả năm: \`401\` + \`WWW-Authenticate: Basic realm="Realm"\`. Không dòng nào ở mức INFO trở lên.

**Che \`UsernameNotFoundException\` — vì sao, ai điều khiển.** Trường \`hideUserNotFoundExceptions\` (mặc định \`true\`) của \`AbstractUserDetailsAuthenticationProvider\` biến "không có user" thành \`BadCredentialsException\` giống hệt "sai mật khẩu", để không nơi nào vô tình nói cho người ngoài biết username nào tồn tại. Provider còn so mật khẩu gõ vào với một mật khẩu giả đã mã hoá khi không tìm thấy user, để thời gian phản hồi cũng không lộ. Spring Boot không có property cho cờ này, và \`DaoAuthenticationProvider\` toàn cục do \`InitializeUserDetailsBeanManagerConfigurer\` của Spring Security dựng mà không đụng tới nó. Muốn đổi phải tự khai bean provider — và khi đó chính configurer đó in WARN rằng bean \`UserDetailsService\` không còn được dùng tự động. Đo với \`setHideUserNotFoundExceptions(false)\`: \`curl -u ghost:x\` vẫn \`401\` y hệt; chỉ log đổi sang \`Authentication failed with provider DaoAuthenticationProvider since User not found\`. Với HTTP Basic cờ này không giúp được client nào — nó chỉ lộ ra ở nơi code đọc ngoại lệ (failure handler tự viết, sự kiện audit). Để nguyên; khi chẩn đoán, đọc log DEBUG hoặc \`getCause()\`.

**Khoá thắng mật khẩu.** \`bill\` gõ sai mật khẩu vẫn nhận \`LockedException\`: kiểm tra khoá chạy trước, mật khẩu vẫn được so (\`alwaysPerformAdditionalChecksOnUser = true\`) nhưng kết quả bị bỏ. Với Basic client không thấy khác biệt; nhưng một handler in \`ex.getMessage()\` sẽ báo "User account is locked" cho bất kỳ ai đoán đúng username bị khoá.

**DB lỗi cũng là 401.** \`DaoAuthenticationProvider.retrieveUser\` gói mọi ngoại lệ không phải \`UsernameNotFoundException\` thành \`InternalAuthenticationServiceException\` — vẫn là một \`AuthenticationException\`. Khác s02 (ngoại lệ thường thoát ra thành 500 và ERROR của Tomcat): ở đây filter bắt, entry point trả 401, log chỉ có DEBUG. Đó là sự cố của buổi này.`,
    bookDiff: [
      { book: "Listing 3.14: bean `PasswordEncoder` là `NoOpPasswordEncoder.getInstance()`, mật khẩu `12345` lưu trần.", now: "Trong 7.1.2 `NoOpPasswordEncoder` mang `@Deprecated` (javadoc: \"This PasswordEncoder is not secure\"). order giữ bean `PasswordEncoderFactories.createDelegatingPasswordEncoder()` từ s03 và lưu `{noop}12345` trong `shop_users`.", why: "Lớp được đánh dấu deprecated để cảnh báo rằng nó không an toàn (javadoc ghi không có kế hoạch gỡ). Tiền tố `{noop}` đi qua `DelegatingPasswordEncoder`, nên chương 4 đổi sang băm mà không đổi bean." },
    ],
    refs: [
      { label: "Sách, chương 3 — mục 3.3.1 Contract UserDetailsService, 3.3.2 Hiện thực UserDetailsService (và mục 3.2.1 về bốn cờ tài khoản)", href: "#/docs/springsec-03" },
      { label: "Spring Security 7.1 — UserDetailsService", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/user-details-service.html" },
      { label: "Spring Security 7.1 — DaoAuthenticationProvider", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/dao-authentication-provider.html" },
      { label: "Spring Boot 4.1 — Khởi tạo cơ sở dữ liệu bằng schema.sql / data.sql (spring.sql.init)", href: "https://docs.spring.io/spring-boot/4.1/how-to/data-initialization.html#howto.data-initialization.using-basic-sql-scripts" },
    ],
    stateIn: "Đầu ra s04: `ShopUser`, `SecurityUser` và một `UserDetailsService` giữ john, mary trong một `Map`. `./labs/lab begin ssia s05` kiểm đầu vào bằng verify của s04 và chép test vào `order/src/test/java/lab/s05/`. Không gỡ test nào. Test của buổi này ghi thẳng vào hai bảng có tên cố định ở t1 (mỗi test một username ngẫu nhiên, vì mọi context test trong một JVM dùng chung H2 trong bộ nhớ `jdbc:h2:mem:shop`).",
    stateOut: "User của order nằm trong `shop_users` / `shop_user_authorities` (john, mary mở; bill bị khoá), `UserDetailsService` đọc DB ở mỗi lần đăng nhập, không còn user nào giữ trong bộ nhớ; `answers/s05.env` mô tả các nhánh từ chối.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s05`. Thêm vào `order/src/main/resources/schema.sql` (sau bảng `orders`) hai bảng với **đúng tên này** — test của lab đọc, ghi trực tiếp: `shop_users (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(500) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE, locked BOOLEAN NOT NULL DEFAULT FALSE)` và `shop_user_authorities (user_id BIGINT NOT NULL REFERENCES shop_users (id), authority VARCHAR(50) NOT NULL, PRIMARY KEY (user_id, authority))`. Tạo `order/src/main/resources/data.sql` với ba user: john `{noop}12345` [read], mary `{noop}67890` [read, write], bill `{noop}12345` [read] **bị khoá**." },
      { id: "t2", text: "Viết một repository (ví dụ `ShopUserRepository`, `@Repository`, dùng `JdbcClient` như `OrderController`) có `findByUsername` trả `Optional<ShopUser>` kèm authority. Viết `UserDetailsService` dùng nó, trả `SecurityUser`, ném `UsernameNotFoundException` khi không thấy. Không tự kiểm `locked` hay `enabled` trong `UserDetailsService`. Bỏ `Map` trong `UserManagementConfig`; vẫn đúng một bean `UserDetailsService`." },
      { id: "t3", text: "Chạy với `--logging.level.org.springframework.security=DEBUG` và gọi năm lần: `john:12345`, `mary:67890`, `bill:12345`, `bill:sai`, `ghost:x`. Với mỗi lần ghi mã trạng thái và dòng DEBUG của `DaoAuthenticationProvider` / `ProviderManager`. Lần nào client phân biệt được với lần nào?" },
      { id: "t4", kind: "dissect", text: "Từ log của t3 (và mã nguồn `AbstractUserDetailsAuthenticationProvider` trong IDE), viết `answers/s05.env`: `NOT_FOUND_EXCEPTION` (simple name ngoại lệ ra khỏi `AuthenticationManager` khi username không tồn tại), `NOT_FOUND_CAUSE` (lớp của `getCause()` của nó), `HIDE_FLAG` (tên trường boolean quyết định việc che), `HIDE_FLAG_DECLARED_IN` (lớp khai trường đó), `LOCKED_EXCEPTION` (ngoại lệ khi bill đúng mật khẩu), `LOCKED_PARENT` (lớp cha trực tiếp của nó), `LOCKED_WRONG_PASSWORD` (ngoại lệ khi bill gõ sai mật khẩu). Verify đo lại trên `AuthenticationManager` thật; `HIDE_FLAG` được kiểm bằng cách bật/tắt chính trường đó trên một `DaoAuthenticationProvider` mới và xem ngoại lệ có đổi không." },
      { id: "t5", text: "Thử rồi bỏ: commit (`git add -A && git commit -m t4` trong `labs/ssia/work`), thêm vào `UserManagementConfig` một bean `DaoAuthenticationProvider` dùng `UserDetailsService` và `PasswordEncoder` của bạn với `setHideUserNotFoundExceptions(false)`. Log khởi động có thêm dòng nào? `curl -i -u ghost:x` khác gì so với trước — ở client và ở log? Xong thì `git stash -u`." },
      { id: "t6", text: "Sự cố: `./labs/lab break ssia st03-sql-init-off` (lab commit code của bạn trước). Đồng nghiệp vừa chuẩn bị cho order chạy Postgres. Build, chạy **không** bật DEBUG, gọi `curl -i -u john:12345 localhost:8082/orders` và `/actuator/health`. Chẩn đoán theo trình tự (triệu chứng → log → nguyên nhân) rồi sửa, không đổi code Java. Đừng đọc `labs/ssia/breaks/` trước khi làm xong." },
      { id: "t7", text: "`./labs/lab verify ssia s05` đạt 8/8; `cd labs/ssia/work && mvn -q test` vẫn xanh (test của s04 giờ đăng nhập john, mary từ DB)." },
    ],
    hints: [
      "`data.sql` chạy lại mỗi lần một context khởi động; trong test nhiều context dùng chung một H2 nên lần sau gặp trùng `username`. `application.yml` của order đã có `spring.sql.init.continue-on-error: true`, nên các `INSERT` trùng bị bỏ qua. Chèn authority bằng `INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'john'` để khỏi đoán id.",
      "`JdbcClient`: `jdbc.sql(\"SELECT … WHERE username = ?\").param(username).query((rs, i) -> …).optional()`; authority: `.query(String.class).list()`.",
      "Verify báo \"user đã xoá khỏi shop_users vẫn đăng nhập được\" hoặc \"còn bản john ngoài DB\": còn chỗ nào giữ user trong bộ nhớ (Map cũ để dự phòng, một cache). `UserDetailsService` phải đọc DB ở mỗi lần gọi, kể cả cho john và mary.",
      "`HIDE_FLAG`: đọc khối `catch (UsernameNotFoundException ex)` trong `AbstractUserDetailsAuthenticationProvider.authenticate`.",
      "Sự cố t6: mọi đăng nhập 401 mà không có ERROR thì lỗi đã được gói thành một `AuthenticationException`. Bật DEBUG và tìm dòng của `ProviderManager` cho john — rồi đọc tới `Caused by` cuối cùng.",
    ],
    solution: `**1. Lược đồ và dữ liệu**

\`\`\`sql
-- schema.sql (sau bảng orders)
CREATE TABLE IF NOT EXISTS shop_users (
  id       BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  username VARCHAR(50)  NOT NULL UNIQUE,
  password VARCHAR(500) NOT NULL,
  enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
  locked   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS shop_user_authorities (
  user_id   BIGINT      NOT NULL REFERENCES shop_users (id),
  authority VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, authority)
);
\`\`\`

\`\`\`sql
-- data.sql
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('john', '{noop}12345', TRUE, FALSE);
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('mary', '{noop}67890', TRUE, FALSE);
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('bill', '{noop}12345', TRUE, TRUE);
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'john';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'mary';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'write' FROM shop_users WHERE username = 'mary';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'bill';
\`\`\`

**2. Repository và UserDetailsService**

\`\`\`java
@Repository
public class ShopUserRepository {
  private final JdbcClient jdbc;
  public ShopUserRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

  public Optional<ShopUser> findByUsername(String username) {
    return jdbc.sql("SELECT id, username, password, enabled, locked FROM shop_users WHERE username = ?")
        .param(username)
        .query((rs, i) -> new ShopUser(rs.getLong("id"), rs.getString("username"), rs.getString("password"),
            authorities(rs.getLong("id")), rs.getBoolean("enabled"), rs.getBoolean("locked")))
        .optional();
  }

  private List<String> authorities(long userId) {
    return jdbc.sql("SELECT authority FROM shop_user_authorities WHERE user_id = ? ORDER BY authority")
        .param(userId).query(String.class).list();
  }
}
\`\`\`

\`\`\`java
public class ShopUserDetailsService implements UserDetailsService {
  private final ShopUserRepository users;
  public ShopUserDetailsService(ShopUserRepository users) { this.users = users; }

  @Override
  public UserDetails loadUserByUsername(String username) {
    return users.findByUsername(username)
        .map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }
}
\`\`\`

Trong \`UserManagementConfig\`: \`@Bean UserDetailsService userDetailsService(ShopUserRepository users) { return new ShopUserDetailsService(users); }\` và giữ bean \`PasswordEncoder\`.

**3. Năm request** — kết quả ở bảng trong Tư duy. Đoạn log của \`ghost\`:

\`\`\`text
DEBUG o.s.s.a.dao.DaoAuthenticationProvider    : Failed to find user 'ghost'
DEBUG o.s.s.authentication.ProviderManager     : Authentication failed with provider DaoAuthenticationProvider since Bad credentials
DEBUG o.s.s.authentication.ProviderManager     : Denying authentication since all attempted providers failed
DEBUG o.s.s.w.a.www.BasicAuthenticationFilter  : Failed to process authentication request
org.springframework.security.authentication.BadCredentialsException: Bad credentials
	at …AbstractUserDetailsAuthenticationProvider.authenticate(AbstractUserDetailsAuthenticationProvider.java:154)
	…
Caused by: org.springframework.security.core.userdetails.UsernameNotFoundException: User not found
	at shop.order.user.ShopUserDetailsService.lambda$loadUserByUsername$0(ShopUserDetailsService.java:23)
	at …DaoAuthenticationProvider.retrieveUser(DaoAuthenticationProvider.java:106)
\`\`\`

**4. Đáp án**

\`\`\`bash
cat > answers/s05.env <<'EOF'
NOT_FOUND_EXCEPTION=BadCredentialsException
NOT_FOUND_CAUSE=UsernameNotFoundException
HIDE_FLAG=hideUserNotFoundExceptions
HIDE_FLAG_DECLARED_IN=AbstractUserDetailsAuthenticationProvider
LOCKED_EXCEPTION=LockedException
LOCKED_PARENT=AccountStatusException
LOCKED_WRONG_PASSWORD=LockedException
EOF
\`\`\`

**5. Tắt việc che — đo rồi bỏ**

\`\`\`java
@Bean
DaoAuthenticationProvider daoAuthenticationProvider(UserDetailsService uds, PasswordEncoder encoder) {
  DaoAuthenticationProvider p = new DaoAuthenticationProvider(uds);
  p.setPasswordEncoder(encoder);
  p.setHideUserNotFoundExceptions(false);
  return p;
}
\`\`\`

\`\`\`text
INFO … eAuthenticationProviderManagerConfigurer : Global AuthenticationManager configured with AuthenticationProvider bean with name daoAuthenticationProvider
WARN … r$InitializeUserDetailsManagerConfigurer : Global AuthenticationManager configured with an AuthenticationProvider bean. UserDetailsService beans will not be used by Spring Security for automatically configuring username/password login. …
DEBUG … ProviderManager : Authentication failed with provider DaoAuthenticationProvider since User not found
DEBUG … BasicAuthenticationFilter : Failed to process authentication request
org.springframework.security.core.userdetails.UsernameNotFoundException: User not found
\`\`\`

\`curl -i -u ghost:x\` vẫn \`401\` + \`WWW-Authenticate: Basic realm="Realm", charset="UTF-8"\`. Không được gì cho client, mất đường cấu hình mặc định (\`InitializeUserDetailsBeanManagerConfigurer\` không dựng provider từ bean \`UserDetailsService\` nữa). \`git stash -u\`.

**6. Sự cố st03-sql-init-off — chẩn đoán**

*Triệu chứng.* \`curl -i -u john:12345 localhost:8082/orders\` → \`401\`, \`WWW-Authenticate: Basic …\`; \`/actuator/health\` → \`{"groups":["liveness","readiness"],"status":"UP"}\`; log khởi động và log request không có dòng WARN hay ERROR nào.

*Log DEBUG của request.*

\`\`\`text
DEBUG .s.a.DefaultAuthenticationEventPublisher : No event was found for the exception org.springframework.security.authentication.InternalAuthenticationServiceException
DEBUG o.s.s.authentication.ProviderManager     : Authentication service failed internally for user 'john'
org.springframework.security.authentication.InternalAuthenticationServiceException: PreparedStatementCallback; bad SQL grammar [SELECT id, username, password, enabled, locked FROM shop_users WHERE username = ?]
	at …DaoAuthenticationProvider.retrieveUser(DaoAuthenticationProvider.java:121)
Caused by: org.springframework.jdbc.BadSqlGrammarException: PreparedStatementCallback; bad SQL grammar […]
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Table "SHOP_USERS" not found (this database is empty); SQL statement: …
\`\`\`

*Nguyên nhân.* Không phải sai mật khẩu, cũng không phải không có user: DB trống. \`git -C labs/ssia/work diff\` (lab đã commit trước khi gây sự cố): \`application.yml\` có \`spring.sql.init.mode: never\` — Spring Boot không chạy \`schema.sql\`/\`data.sql\` nữa, H2 trong bộ nhớ khởi động rỗng. Health vẫn UP vì kết nối DB vẫn tốt; chỉ bảng không có.

*Sửa.* Đặt lại \`mode: always\` (với H2 nhúng, giá trị mặc định \`embedded\` cũng chạy). Khi order lên Postgres thật, lược đồ sẽ do công cụ migration lo — nhưng phải có trước khi tắt việc này. Bản lời giải: \`labs/ssia/sessions/s05/solution/\`.`,
    work: {
      patterns: [
        "Ticket \"user X không đăng nhập được\" mà ops chỉ gửi được \"Bad credentials\": phân biệt sai mật khẩu / không có user / bị khoá / DB lỗi bằng log DEBUG của một request, không đổi cấu hình bảo mật trên production.",
        "Sau một thay đổi hạ tầng (đổi DB, migration, tắt khởi tạo SQL), mọi đăng nhập 401 mà health vẫn xanh: nghĩ ngay tới `InternalAuthenticationServiceException`.",
        "Review đề xuất \"cho lỗi đăng nhập trả rõ user không tồn tại\": giải thích `hideUserNotFoundExceptions` và vì sao không làm.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Sự cố: support báo mary không đăng nhập được, và gửi đoạn log ops có được ở mức DEBUG: chỉ có `BadCredentialsException: Bad credentials` kèm stack trace. Trong 5 phút, chỉ từ đoạn log đó, xác định mary gõ sai mật khẩu hay username gõ sai.",
          timeLimitMin: 5,
          solution: "**Triệu chứng.** 401, ngoại lệ ở cấp cao nhất là `BadCredentialsException: Bad credentials` — giống nhau cho cả hai trường hợp.\n\n**Bằng chứng.** Đọc hai chỗ:\n- Dòng ngay trước stack trace: `DaoAuthenticationProvider : Failed to find user '<tên>'` (không có user) hay `Failed to authenticate since password does not match stored value` (sai mật khẩu). Tên trong `Failed to find user` cho biết username đã gõ — thường là lỗi chính tả hoặc khác hoa thường.\n- Cuối stack: chỉ trường hợp không có user mới có `Caused by: org.springframework.security.core.userdetails.UsernameNotFoundException: User not found`, đi từ `loadUserByUsername` của bạn qua `DaoAuthenticationProvider.retrieveUser`.\n\n**Nguyên nhân.** `hideUserNotFoundExceptions = true` gói `UsernameNotFoundException` vào `BadCredentialsException` nhưng giữ nó làm `cause`.\n\n**Xử lý.** Không cần tắt cờ: thông tin đã có trong log DEBUG. Trả lời support bằng username thật đã gõ.",
        },
        {
          text: "Một đồng nghiệp sửa `UserDetailsService` để tự ném `LockedException` khi `locked = true` (\"chặn sớm, khỏi tốn công so mật khẩu\"). Trong 5 phút, dự đoán ngoại lệ ra khỏi `AuthenticationManager` cho bill rồi kiểm bằng log DEBUG.",
          timeLimitMin: 5,
          solution: "Dự đoán từ mã nguồn `DaoAuthenticationProvider.retrieveUser` (7.1.2): nó chỉ để `UsernameNotFoundException` và `InternalAuthenticationServiceException` đi qua nguyên vẹn; mọi ngoại lệ khác bị gói `new InternalAuthenticationServiceException(ex.getMessage(), ex)`. Vậy bill nhận `InternalAuthenticationServiceException: User account is locked`. Đo trên order với thay đổi đó: `curl -u bill:12345` vẫn 401, log DEBUG `ProviderManager : Authentication service failed internally for user 'bill'` rồi `org.springframework.security.authentication.InternalAuthenticationServiceException: User account is locked` — cùng dòng với sự cố DB của t6. Client vẫn 401, nhưng log và mọi nơi phân loại theo kiểu ngoại lệ (audit, đếm lần khoá) giờ coi đó là lỗi hệ thống. Kiểm tra khoá thuộc về `UserDetails` (`isAccountNonLocked`) và provider, không thuộc `UserDetailsService`.",
        },
      ],
    },
    tips: [
      "Mỗi lần nghi \"đăng nhập hỏng\", chạy lại một request với `--logging.level.org.springframework.security=DEBUG` trước khi sửa gì: năm kiểu 401 của buổi này khác nhau ngay ở dòng đầu tiên của `DaoAuthenticationProvider` / `ProviderManager`.",
      "`UserDetailsService` đọc DB ở mỗi lần đăng nhập (provider mặc định không cache user): mở khoá bill bằng `UPDATE shop_users SET locked = FALSE …` có hiệu lực ngay ở request sau. Verify kiểm điều ngược lại: xoá dòng thì 401 ngay.",
      "Tên bảng và cột của buổi này (`shop_users`, `shop_user_authorities`) là hợp đồng với test của lab. Đổi tên thì verify đỏ — đó là lý do đề bài ghi rõ.",
      "Đừng đặt tên bảng `users`/`authorities`: đó là lược đồ mặc định của `JdbcUserDetailsManager` mà s06 dựng trên một DB riêng để so.",
    ],
    outcome: {
      md: `User của order đã nằm trong DB; bạn đọc được năm kiểu từ chối dù client chỉ thấy một 401, và biết vì sao Spring Security cố tình không cho phân biệt. Trên máy:

\`\`\`bash
./labs/lab verify ssia s05
\`\`\`

Verify chèn user ngẫu nhiên thẳng vào \`shop_users\` (mở, khoá, vô hiệu), đăng nhập bằng HTTP và qua \`AuthenticationManager\` thật, xoá rồi đăng nhập lại, đổi tạm mật khẩu của john và xoá tạm mary trong DB (rồi trả lại) để chắc không còn bản nào ngoài DB, và đo các ngoại lệ để so với \`answers/s05.env\`.`,
      verifyOutput: "lab: kiểm s05\n  ✓ user chèn vào shop_users đăng nhập được ngay, xoá đi thì 401\n  ✓ john, mary đến từ shop_users: đổi hoặc xoá trong DB có hiệu lực ngay\n  ✓ dữ liệu mẫu: john, mary mở; bill bị khoá\n  ✓ user bị khoá đúng mật khẩu → 401 (LockedException)\n  ✓ user bị vô hiệu đúng mật khẩu → 401 (DisabledException)\n  ✓ answers/s05.env: NOT_FOUND_EXCEPTION, NOT_FOUND_CAUSE\n  ✓ answers/s05.env: HIDE_FLAG, HIDE_FLAG_DECLARED_IN\n  ✓ answers/s05.env: LOCKED_EXCEPTION, LOCKED_PARENT, LOCKED_WRONG_PASSWORD\n  → 8/8 đạt",
      projectDelta: "User của order nằm trong bảng `shop_users` / `shop_user_authorities` (H2): john, mary, và bill bị khoá. `UserDetailsService` đọc DB qua `ShopUserRepository`.",
    },
    review: [
      { q: "`UserDetailsService` của bạn có nên tự kiểm `locked` không? Vì sao?", a: "Không. Nó chỉ tìm user; `isAccountNonLocked()` của `UserDetails` mang trạng thái, provider kiểm và ném `LockedException`. Ném `LockedException` từ `loadUserByUsername` làm `retrieveUser` gói nó thành `InternalAuthenticationServiceException`." },
      { q: "Username không tồn tại ra khỏi AuthenticationManager dưới dạng gì, và thông tin thật nằm ở đâu?", a: "`BadCredentialsException: Bad credentials` do `hideUserNotFoundExceptions = true`; `getCause()` là `UsernameNotFoundException`, và log DEBUG có `Failed to find user '<tên>'`." },
      { q: "Muốn đặt `hideUserNotFoundExceptions = false` trên Spring Boot thì phải làm gì, và client Basic thấy khác gì?", a: "Tự khai bean `DaoAuthenticationProvider` (Spring Boot không có property); `InitializeUserDetailsBeanManagerConfigurer` của Spring Security in WARN rằng bean `UserDetailsService` không còn được dùng tự động. Client vẫn nhận 401 + `WWW-Authenticate` y hệt — chỉ ngoại lệ và log đổi." },
      { q: "bill bị khoá gõ sai mật khẩu nhận ngoại lệ gì? Điều đó nói gì về thứ tự kiểm tra?", a: "`LockedException`: kiểm khoá chạy trước khi so mật khẩu; mật khẩu vẫn được so (`alwaysPerformAdditionalChecksOnUser`) nhưng lỗi kiểm khoá được giữ." },
      { q: "Vì sao sự cố `st03-sql-init-off` cho 401 chứ không phải 500 như sự cố của s02?", a: "Lỗi SQL xảy ra trong `loadUserByUsername`; `DaoAuthenticationProvider.retrieveUser` gói nó thành `InternalAuthenticationServiceException`, một `AuthenticationException`, nên `BasicAuthenticationFilter` bắt và entry point trả 401. Ở s02, `IllegalArgumentException` từ encoder không bị gói, thoát khỏi chain thành 500." },
    ],
  },

  // ───────────────────────────── s06 ─────────────────────────────
  {
    id: "s06",
    stage: "st03",
    title: "UserDetailsManager: tạo user, đổi mật khẩu — và JdbcUserDetailsManager có sẵn",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s05"],
    status: "published",
    pieces: [],
    goals: [
      "Mở rộng `UserDetailsService` của s05 thành một `UserDetailsManager` trên `shop_users`: tạo user qua `POST /users`, đổi mật khẩu của chính mình qua `PUT /users/me/password`.",
      "Giữ CSRF bật cho hai endpoint ghi và gọi được chúng bằng curl, hiểu vì sao token gắn với session.",
      "Đo `JdbcUserDetailsManager` có sẵn và lược đồ mặc định `users.ddl` trên một H2 riêng: nó lưu gì, bỏ gì, `changePassword` kiểm gì.",
      "Chẩn đoán hai lỗi thường gặp của luồng đổi mật khẩu: \"đổi xong không vào được nữa\" và \"401 dù Basic đúng\".",
    ],
    skills: [
      { skill: "cfg-userdetailsmanager", level: "Viết được không tra" },
      { skill: "cfg-user-builder", level: "Gõ được không tra" },
      { skill: "int-jdbcuserdetailsmanager-defaults", level: "Giải thích được" },
    ],
    uses: ["cfg-userdetailsservice-db", "cfg-userdetails-impl", "dx-401-error-dispatch", "dx-security-debug-log"],
    foundation: null,
    mindset: `**\`UserDetailsManager\` = \`UserDetailsService\` + năm thao tác ghi** (\`createUser\`, \`updateUser\`, \`deleteUser\`, \`changePassword\`, \`userExists\`). Spring Security tự nó chỉ gọi \`loadUserByUsername\`; các thao tác ghi là để *ứng dụng* gọi — ở đây là \`UserController\`. Vì vậy trên order chỉ có **một** bean, vừa là \`UserDetailsService\` cho provider vừa là \`UserDetailsManager\` cho controller (thêm bean \`UserDetailsService\` thứ hai thì \`InitializeUserDetailsBeanManagerConfigurer\` của Spring Security không dựng provider toàn cục nữa — đo trên order: WARN \`Found 2 UserDetailsService beans, with names […]. Global Authentication Manager will not use a UserDetailsService for username/password login.\` và mọi đăng nhập 401 với \`ProviderNotFoundException: No AuthenticationProvider found for …UsernamePasswordAuthenticationToken\`).

\`\`\`mermaid
sequenceDiagram
  participant C as curl (john)
  participant F as CsrfFilter · BasicAuthenticationFilter
  participant W as UserController
  participant E as PasswordEncoder
  participant M as ShopUserDetailsManager
  participant D as shop_users
  C->>F: GET /csrf (Basic) → token + JSESSIONID
  C->>F: POST /users, X-CSRF-TOKEN, cookie, Basic
  F->>W: đã xác thực, token CSRF hợp lệ
  W->>M: userExists("kate")?
  W->>E: encode("kpass") → {bcrypt}…
  W->>M: createUser(User.withUsername("kate").password({bcrypt}…).authorities("read"))
  M->>D: INSERT shop_users, shop_user_authorities
  W-->>C: 201
  Note over C,D: PUT /users/me/password: M lấy user từ SecurityContextHolder,<br/>matches(old, đã lưu) rồi mới UPDATE với mật khẩu mới đã mã hoá
\`\`\`

**Hợp đồng có hai chỗ dễ hiểu lầm** (đọc trong \`JdbcUserDetailsManager\` 7.1.2, đo trên một H2 riêng):

- **Mật khẩu truyền vào được lưu nguyên.** \`createUser\` ghi \`user.getPassword()\`, \`changePassword(old, new)\` ghi \`new\` — không ai mã hoá hộ. Nơi gọi phải \`encode\`. Quên là user bị khoá ngoài theo kiểu s02: mật khẩu không có tiền tố \`{id}\` → \`IllegalArgumentException\` trong encoder → 500 → lượt \`/error\` → 401 (drill 1).
- **\`changePassword\` lấy user từ \`SecurityContextHolder\`, và chỉ kiểm mật khẩu cũ nếu được cấu hình.** \`JdbcUserDetailsManager\` chỉ xác thực lại \`oldPassword\` khi đã gọi \`setAuthenticationManager(...)\`; không có thì nó ghi log \`No authentication manager set. Password won't be re-checked.\` và đổi luôn — đo được: \`changePassword("WRONG", …)\` thành công. Manager của bạn tự kiểm bằng \`PasswordEncoder.matches\` — một lựa chọn thiết kế cho gọn: nó chỉ cần bean \`PasswordEncoder\`, không phải lấy \`AuthenticationManager\` (thứ được dựng từ chính bean này).

**So với \`JdbcUserDetailsManager\` và lược đồ mặc định** (đo trên H2 chạy đúng \`org/springframework/security/core/userdetails/jdbc/users.ddl\` trong jar):

| | \`JdbcUserDetailsManager\` + \`users.ddl\` | \`ShopUserDetailsManager\` trên \`shop_users\` |
|---|---|---|
| Bảng | \`users(username PK, password, enabled)\`, \`authorities(username, authority)\` + FK, unique index | \`shop_users(id, username, password, enabled, locked)\`, \`shop_user_authorities(user_id, authority)\` |
| Khoá tài khoản | \`users.ddl\` không có cột; truy vấn mặc định trả 3 cột nên \`createUser\` với \`accountLocked(true)\` rồi đọc lại → \`isAccountNonLocked() = true\`. Truy vấn trả 6 cột thì đọc được (xem dưới) | cột \`locked\`, bill bị từ chối (s05) |
| User không có authority | \`UsernameNotFoundException: User noauth has no GrantedAuthority\` | đăng nhập được, không authority |
| Username | không phân biệt hoa thường (\`varchar_ignorecase\`: \`JOHN\` tìm ra \`john\`) | phân biệt |
| Kiểm mật khẩu cũ | chỉ khi có \`setAuthenticationManager\` | luôn |
| \`UserDetailsPasswordService\` | có hiện thực, nhưng từ 7.0 \`updatePassword\` không ghi gì trừ khi \`setEnableUpdatePassword(true)\` | không (provider giữ \`UserDetailsPasswordService.NOOP\`) |

**\`JdbcUserDetailsManager\` không bị khoá vào lược đồ mặc định** (listing 3.21). \`setUsersByUsernameQuery\` / \`setAuthoritiesByUsernameQuery\` đổi truy vấn. Mã nguồn 7.1.2 của \`JdbcUserDetailsManager.mapToUser\` đọc cột 1–3 là username, password, enabled và, *nếu kết quả có hơn 3 cột*, đọc cột 4–6 là \`acc_locked\`, \`acc_expired\`, \`creds_expired\`; \`createUser\` / \`updateUser\` cũng ghi ba giá trị đó khi câu SQL ghi có hơn 3 tham số. Đo trên chính \`shop_users\` của order (một \`JdbcUserDetailsManager\` + \`DaoAuthenticationProvider\` dựng trong test, không thay bean của app), truy vấn authority \`SELECT u.username, a.authority FROM shop_user_authorities a JOIN shop_users u ON a.user_id = u.id WHERE u.username = ?\`:

| Truy vấn user | mary:67890 | bill:12345 (locked) |
|---|---|---|
| \`SELECT username, password, enabled FROM shop_users WHERE username = ?\` | vào được, [read, write] | **vào được** — cột locked không được đọc |
| thêm cột \`locked\` (4 cột) | \`InternalAuthenticationServiceException: … Invalid value "5" for parameter "columnIndex"\` | như mary |
| \`SELECT username, password, enabled, locked, FALSE, FALSE FROM shop_users WHERE username = ?\` | vào được, [read, write] | \`LockedException\` |

Vậy order *có thể* dùng \`JdbcUserDetailsManager\` cho \`shop_users\`; buổi này vẫn tự viết manager để hiểu hợp đồng (dùng \`JdbcUserDetailsManager\` thì còn phải đặt \`setCreateUserSql\`, \`setCreateAuthoritySql\` theo \`user_id\`, và \`setAuthenticationManager\`).

Dòng \`UserDetailsPasswordService\` của bảng trên là cầu nối sang chương 4: \`InitializeUserDetailsBeanManagerConfigurer\` (Spring Security) lấy bean \`UserDetailsPasswordService\` nếu context có đúng một bean kiểu đó (\`getBeanProvider(...).getIfUnique()\`) và nối vào \`DaoAuthenticationProvider\`, và provider tự mã hoá lại mật khẩu kiểu cũ (\`{noop}…\`) sau một lần đăng nhập thành công. Đo trên H2 riêng với một \`DaoAuthenticationProvider\` nối giống configurer đó (\`setUserDetailsPasswordService(manager)\`): mặc định cột vẫn \`{noop}pw\`; sau \`setEnableUpdatePassword(true)\` một lần đăng nhập biến nó thành \`{bcrypt}$2a$10$…\`.

**CSRF: bật, và trả giá bằng một bước.** \`POST /users\` với Basic đúng mà không có token bị \`CsrfFilter\` từ chối (\`Invalid CSRF token found for http://localhost:8082/users\`) rồi thành 401 qua lượt \`/error\` như s02. Token mặc định nằm trong \`HttpSession\` (\`HttpSessionCsrfTokenRepository\`): curl phải lấy token và giữ cookie của cùng session. Đo trên order: \`GET /csrf\` (Basic) trả \`{"headerName":"X-CSRF-TOKEN","parameterName":"_csrf","token":"…"}\` và \`Set-Cookie: JSESSIONID\`; gửi lại header + cookie → 201; header mà không cookie → 401. \`GET /csrf\` là mẫu tài liệu 7.1 đưa ra cho client không đọc token từ form (mục CSRF → Mobile Applications, "The /csrf endpoint"). Nó chỉ an toàn nhờ same-origin policy: trang của site khác gửi được request tới \`/csrf\` nhưng không đọc được phản hồi. Một cấu hình CORS dễ dãi cho phép origin lạ kèm credential (chương 10) sẽ biến endpoint này thành đường vượt CSRF. Có nên tắt CSRF cho API này? Khi người dùng đã nhập Basic trong trình duyệt, trình duyệt gửi credential đó tới origin này cả khi request do một site khác khởi tạo — nên rủi ro CSRF là thật nếu có người dùng trình duyệt; client máy với máy thì không. Chương 9 quyết định chuyện đó (repository bằng cookie, bỏ qua theo matcher, hay API không trạng thái); buổi này giữ mặc định và verify kiểm rằng thiếu token vẫn là 403.

**Lỗ hổng còn để ngỏ, có chủ ý.** Bất kỳ user đã đăng nhập nào cũng gọi được \`POST /users\` và tự chọn authority cho user mới — kể cả \`write\`. Chương 7 giới hạn endpoint này theo authority; chương 3 chỉ lo việc quản lý user.`,
    bookDiff: [
      { book: "Khung JdbcUserDetailsManager: \"Hiện thực JdbcUserDetailsManager mong đợi ba cột trong bảng users — một username, một password, và enabled\"; listing 3.21 đổi truy vấn nhưng vẫn trả ba cột.", now: "7.1.2: `JdbcUserDetailsManager` có row mapper riêng (`mapToUser`) đọc thêm cột 4–6 là `acc_locked`, `acc_expired`, `creds_expired` khi truy vấn user trả hơn 3 cột; `createUser`/`updateUser` ghi ba giá trị đó khi câu SQL có hơn 3 tham số. Đo trên `shop_users`: truy vấn 6 cột làm bill nhận `LockedException`; truy vấn 4 cột hỏng với `Invalid value \"5\" for parameter \"columnIndex\"`.", why: "Mã nguồn `JdbcUserDetailsManager` 7.1.2 có chú thích `acc_locked, acc_expired and creds_expired are also to be loaded`; lược đồ mặc định và tài liệu chỉ có ba cột, nên phần này chỉ thấy khi đọc mã hoặc đo." },
      { book: "Listing 3.19: `JdbcUserDetailsManager` đi cùng bean `NoOpPasswordEncoder.getInstance()`, dữ liệu mẫu lưu `12345` trần.", now: "`NoOpPasswordEncoder` mang `@Deprecated` trong 7.1.2. order giữ `DelegatingPasswordEncoder` và mã hoá mật khẩu mới bằng `encode` (`{bcrypt}…`).", why: "Spring Security đánh dấu lớp này deprecated vì nó không an toàn; dữ liệu cũ vẫn dùng được qua tiền tố `{noop}` của `DelegatingPasswordEncoder`." },
    ],
    refs: [
      { label: "Sách, chương 3 — mục 3.3.3 Hiện thực UserDetailsManager và khung \"Dùng JdbcUserDetailsManager để quản lý user\" (listing 3.16–3.21)", href: "#/docs/springsec-03" },
      { label: "Spring Security 7.1 — JDBC Authentication: lược đồ mặc định (users.ddl)", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passwords/jdbc.html#servlet-authentication-jdbc-schema-user" },
      { label: "Spring Security 7.1 — CSRF: lưu token trong HttpSession", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html#csrf-token-repository-httpsession" },
      { label: "Spring Security 7.1 — CSRF: Mobile Applications, endpoint /csrf", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html#csrf-integration-mobile" },
      { label: "Spring Security 7.1 — Testing: csrf() và httpBasic() cho MockMvc", href: "https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/csrf.html" },
    ],
    stateIn: "Đầu ra s05: `ShopUserRepository` đọc `shop_users`, một `UserDetailsService` bọc thành `SecurityUser`. `./labs/lab begin ssia s06` kiểm đầu vào bằng verify của s05 và chép test vào `order/src/test/java/lab/s06/`. Không gỡ test nào. Test của buổi gọi endpoint qua MockMvc (đi qua chain thật) với `httpBasic(...)` và `csrf()` của `spring-security-test`; tên endpoint và trường JSON ở t2 là cố định.",
    stateOut: "order có một bean `UserDetailsManager` trên `shop_users` (thay `UserDetailsService` của s05), `UserController` với `POST /users`, `PUT /users/me/password` và `GET /csrf`; CSRF vẫn bật; `answers/s06.env` mô tả `JdbcUserDetailsManager`, lược đồ mặc định và hai truy vấn để nó đọc `shop_users`.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s06`. Biến `UserDetailsService` của s05 thành một lớp hiện thực `UserDetailsManager` (ví dụ `ShopUserDetailsManager`), thêm vào repository các thao tác ghi cần thiết. `changePassword(oldPassword, newPassword)`: lấy user hiện tại từ `SecurityContextHolder`, so `oldPassword` (chữ người dùng gõ) với mật khẩu đã lưu bằng bean `PasswordEncoder`, sai thì ném `BadCredentialsException`; `newPassword` nhận vào **đã mã hoá**, lưu nguyên như `JdbcUserDetailsManager`. Vẫn đúng một bean `UserDetailsService` trong context (chính manager)." },
      { id: "t2", text: "Viết controller với **đúng các tên này**: `POST /users` nhận `{\"username\":…, \"password\":…, \"authorities\":[…]}` → `201` (username đã có → `409`, thiếu trường → `400`); `PUT /users/me/password` nhận `{\"oldPassword\":…, \"newPassword\":…}` → `204` (sai mật khẩu cũ → `400`). Dựng `UserDetails` cho `createUser` bằng `User.withUsername(...).password(passwordEncoder.encode(...)).authorities(...).build()`; mật khẩu lưu phải đi qua `encode` của bean `PasswordEncoder` (không chữ thường, không tự ghép `{noop}`). Không để `BadCredentialsException` thoát khỏi controller." },
      { id: "t3", text: "Build, chạy, rồi bằng curl: (a) `POST /users` với `-u john:12345` mà không token — mã gì, log DEBUG có dòng nào của `CsrfFilter`? (b) Thêm `@GetMapping(\"/csrf\") CsrfToken csrf(CsrfToken token) { return token; }`; lấy token với `curl -c jar -u john:12345 localhost:8082/csrf`, tạo kate bằng `curl -b jar -u john:12345 -H \"X-CSRF-TOKEN: <token>\" -H 'Content-Type: application/json' -d '{\"username\":\"kate\",\"password\":\"kpass\",\"authorities\":[\"read\"]}' localhost:8082/users`; thử lại không `-b jar`. (c) kate đăng nhập, đổi mật khẩu (token và cookie của kate), mật khẩu cũ → 401, mới → 200. Không tắt CSRF: verify kiểm thiếu token vẫn 403." },
      { id: "t4", kind: "dissect", text: "So với `JdbcUserDetailsManager`: viết một test nháp không cần Spring context (ví dụ `order/src/test/java/scratch/JdbcManagerProbeTest.java`) dựng H2 bằng `new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2).addScript(\"classpath:\" + JdbcDaoImpl.DEFAULT_USER_SCHEMA_DDL_LOCATION).build()` và một `new JdbcUserDetailsManager(ds)`. Viết `answers/s06.env`: `DDL_FILE` (đường dẫn classpath của tệp lược đồ), `DEFAULT_TABLES` (các bảng nó tạo), `USERS_COLUMNS` (các cột của bảng `users`), `NO_AUTHORITY_EXCEPTION` (simple name ngoại lệ khi `loadUserByUsername` một user có dòng trong `users` nhưng không có dòng nào trong `authorities`), `LOCKED_AFTER_RELOAD` (`isAccountNonLocked()` của một user tạo bằng `createUser(User…accountLocked(true)…)` rồi đọc lại), `NO_AUTHORITY_MESSAGE` (`getMessage()` của ngoại lệ đó, với user tên `noauth`), `REAUTH_SETTER` (tên setter làm `changePassword` kiểm mật khẩu cũ). Danh sách cách nhau dấu phẩy, không phân biệt hoa thường. Verify dựng lại đúng H2 đó và đo; `REAUTH_SETTER` được gọi thật rồi thử đổi mật khẩu với mật khẩu cũ sai." },
      { id: "t5", kind: "dissect", text: "Listing 3.21 trên dữ liệu của shop: trong một test nháp có Spring context (`@SpringBootTest(classes = OrderApplication.class)`, `@Autowired DataSource`, `@Autowired PasswordEncoder`), dựng `new JdbcUserDetailsManager(dataSource)` trỏ vào `shop_users` bằng `setUsersByUsernameQuery(...)` và `setAuthoritiesByUsernameQuery(...)`, nối vào `new DaoAuthenticationProvider(manager)` + `setPasswordEncoder(...)`, rồi `authenticate` mary:67890, bill:12345, và john với mật khẩu sai. Thử truy vấn user 3 cột trước — bill có vào được không? Rồi 4 cột có `locked`. Tìm quy tắc trong `JdbcUserDetailsManager.mapToUser`, rồi ghi hai khoá `USERS_QUERY`, `AUTHORITIES_QUERY` (nguyên câu SQL, một dòng). Verify chạy đúng hai truy vấn đó trên DB của order: mary phải vào được với [read, write], bill phải nhận `LockedException`, một user `enabled = FALSE` phải nhận `DisabledException`, john sai mật khẩu nhận `BadCredentialsException`. Không thay bean `UserDetailsManager` của app." },
      { id: "t6", text: "`./labs/lab verify ssia s06` đạt 10/10; `cd labs/ssia/work && mvn -q test` xanh (test nháp của t4, t5 cũng chạy trong đó — giữ hoặc xoá tuỳ bạn)." },
    ],
    hints: [
      "Hai bean `UserDetailsService` (manager mới + bean cũ của s05) làm `InitializeUserDetailsBeanManagerConfigurer` không dựng provider toàn cục: log khởi động có WARN `Found 2 UserDetailsService beans…`, john nhận 401 và log DEBUG có `ProviderNotFoundException`. Kiểu trả về của phương thức `@Bean` có thể là `UserDetailsManager`: bean vẫn là một `UserDetailsService`.",
      "Thiếu token CSRF: curl qua cổng thật thấy 401 (403 của `CsrfFilter` rồi lượt `/error`), MockMvc của verify thấy đúng 403 vì không có lượt `/error`.",
      "Token từ `/csrf` mà gửi lại vẫn bị từ chối: kiểm cookie `JSESSIONID` có đi kèm không (`-b jar`). Token được lưu trong session nơi nó sinh ra; request không cùng session thì không có gì để so.",
      "`H2` của test nháp in tên bảng, cột HOA (`USERS`, `USERNAME`) trong `INFORMATION_SCHEMA`; nhớ lọc `TABLE_SCHEMA = 'PUBLIC'`, nếu không bạn sẽ thấy cả bảng hệ thống `INFORMATION_SCHEMA.USERS`.",
      "`REAUTH_SETTER`: đọc thân `JdbcUserDetailsManager.changePassword` — nó rẽ nhánh theo một trường có thể null.",
      "`USERS_QUERY`: truy vấn 3 cột chạy được nhưng bỏ qua `locked` (bill vào được); 4 cột hỏng với `Invalid value \"5\" for parameter \"columnIndex\"` vì `mapToUser` đọc tới cột 6 khi có hơn 3 cột. Hai cột 5, 6 (hết hạn tài khoản, hết hạn mật khẩu) shop không có — trả hằng `FALSE`. `AUTHORITIES_QUERY`: `JdbcDaoImpl` lấy authority ở cột thứ 2.",
    ],
    solution: `**1. Manager trên shop_users**

\`\`\`java
public class ShopUserDetailsManager implements UserDetailsManager {
  private final ShopUserRepository users;
  private final PasswordEncoder passwordEncoder;

  public ShopUserDetailsManager(ShopUserRepository users, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  @Override public UserDetails loadUserByUsername(String username) {
    return users.findByUsername(username).map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }
  @Override public void createUser(UserDetails u) {
    users.insert(u.getUsername(), u.getPassword(), u.isEnabled(), !u.isAccountNonLocked(), names(u));
  }
  @Override public void updateUser(UserDetails u) {
    users.update(u.getUsername(), u.getPassword(), u.isEnabled(), !u.isAccountNonLocked(), names(u));
  }
  @Override public void deleteUser(String username) { users.delete(username); }
  @Override public boolean userExists(String username) { return users.exists(username); }

  /** newPassword đã mã hoá; oldPassword là chữ người dùng gõ. */
  @Override public void changePassword(String oldPassword, String newPassword) {
    Authentication current = SecurityContextHolder.getContext().getAuthentication();
    if (current == null) throw new IllegalStateException("không có user đăng nhập trong SecurityContext");
    ShopUser user = users.findByUsername(current.getName())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.password())) {
      throw new BadCredentialsException("mật khẩu cũ không đúng");
    }
    users.updatePassword(user.username(), newPassword);
  }

  private static List<String> names(UserDetails u) {
    return u.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
  }
}
\`\`\`

Repository thêm \`exists\`, \`insert\`, \`update\` (\`@Transactional\`: dòng user và các dòng authority cùng thành công hoặc cùng không), \`updatePassword\`, \`delete\`. \`UserManagementConfig\`: \`@Bean UserDetailsManager userDetailsService(ShopUserRepository users, PasswordEncoder encoder)\`; xoá \`ShopUserDetailsService\`. Log khởi động vẫn \`Global AuthenticationManager configured with UserDetailsService bean with name userDetailsService\`.

**2. Controller**

\`\`\`java
@PostMapping("/users")
public ResponseEntity<?> create(@RequestBody NewUser req) {
  // … 400 nếu thiếu trường
  if (manager.userExists(req.username())) return error(HttpStatus.CONFLICT, "username đã tồn tại: " + req.username());
  UserDetails user = User.withUsername(req.username())
      .password(passwordEncoder.encode(req.password()))   // {bcrypt}…, không lưu chữ thường
      .authorities(req.authorities().toArray(String[]::new))
      .build();
  manager.createUser(user);
  return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("username", req.username(), "authorities", req.authorities()));
}

@PutMapping("/users/me/password")
public ResponseEntity<?> changePassword(@RequestBody PasswordChange req) {
  // … 400 nếu thiếu trường
  try {
    manager.changePassword(req.oldPassword(), passwordEncoder.encode(req.newPassword()));
  } catch (BadCredentialsException e) {
    return error(HttpStatus.BAD_REQUEST, "mật khẩu cũ không đúng");
  }
  return ResponseEntity.noContent().build();
}

@GetMapping("/csrf")
public CsrfToken csrf(CsrfToken token) { return token; }
\`\`\`

**3. Gọi bằng curl** (đo trên order, \`J='Content-Type: application/json'\`)

\`\`\`bash
curl -si -u john:12345 -H "$J" -d '{"username":"kate","password":"kpass","authorities":["read"]}' localhost:8082/users | head -1
# HTTP/1.1 401        — log: CsrfFilter : Invalid CSRF token found for http://localhost:8082/users
curl -s -c jar -u john:12345 localhost:8082/csrf
# {"headerName":"X-CSRF-TOKEN","parameterName":"_csrf","token":"eG4lbb7o…"}   (jar có JSESSIONID)
T=$(curl -s -b jar -c jar -u john:12345 localhost:8082/csrf | sed 's/.*"token":"\\([^"]*\\)".*/\\1/')
curl -si -b jar -u john:12345 -H "$J" -H "X-CSRF-TOKEN: $T" -d '{"username":"kate","password":"kpass","authorities":["read"]}' localhost:8082/users
# HTTP/1.1 201  {"username":"kate","authorities":["read"]}
curl -si -u john:12345 -H "$J" -H "X-CSRF-TOKEN: $T" -d '{"username":"kate2",…}' localhost:8082/users | head -1
# HTTP/1.1 401        — token đúng nhưng không có cookie của session
# cùng lệnh với username kate → 409 {"error":"username đã tồn tại: kate"}
curl -s -o /dev/null -w '%{http_code}\\n' -u kate:kpass localhost:8082/orders     # 200
\`\`\`

Đổi mật khẩu của kate (token và cookie lấy bằng \`-u kate:kpass\`): \`oldPassword\` sai → \`400 {"error":"mật khẩu cũ không đúng"}\`; đúng → \`204\`; sau đó \`kate:kpass\` → 401, \`kate:k2\` → 200. Cùng cookie session cũ mà gửi mật khẩu cũ cũng 401: Basic xác thực lại ở mỗi request.

**4. Mổ xẻ JdbcUserDetailsManager** — trích test nháp:

\`\`\`java
DataSource ds = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2)
    .addScript("classpath:" + JdbcDaoImpl.DEFAULT_USER_SCHEMA_DDL_LOCATION).build();
JdbcClient j = JdbcClient.create(ds);
j.sql("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC'").query(String.class).list();
// [AUTHORITIES, USERS]
JdbcUserDetailsManager m = new JdbcUserDetailsManager(ds);
m.createUser(User.withUsername("john").password("{noop}12345").authorities("read").accountLocked(true).build());
m.loadUserByUsername("john").isAccountNonLocked();   // true — lược đồ không có cột khoá
m.loadUserByUsername("JOHN").getUsername();          // "john"
j.sql("INSERT INTO users (username, password, enabled) VALUES ('noauth', '{noop}x', TRUE)").update();
m.loadUserByUsername("noauth");  // UsernameNotFoundException: User noauth has no GrantedAuthority
SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated("john", null, List.of()));
m.changePassword("WRONG", "{noop}new1");   // không lỗi — mật khẩu đã thành {noop}new1
m.setAuthenticationManager(new ProviderManager(new DaoAuthenticationProvider(m)));
m.changePassword("WRONG", "{noop}new2");   // BadCredentialsException: Bad credentials, mật khẩu giữ {noop}new1
\`\`\`

\`\`\`bash
cat > answers/s06.env <<'EOF'
DDL_FILE=org/springframework/security/core/userdetails/jdbc/users.ddl
DEFAULT_TABLES=users,authorities
USERS_COLUMNS=username,password,enabled
NO_AUTHORITY_EXCEPTION=UsernameNotFoundException
NO_AUTHORITY_MESSAGE=User noauth has no GrantedAuthority
LOCKED_AFTER_RELOAD=true
REAUTH_SETTER=setAuthenticationManager
USERS_QUERY=SELECT username, password, enabled, locked, FALSE, FALSE FROM shop_users WHERE username = ?
AUTHORITIES_QUERY=SELECT u.username, a.authority FROM shop_user_authorities a JOIN shop_users u ON a.user_id = u.id WHERE u.username = ?
EOF
\`\`\`

**5. JdbcUserDetailsManager trên shop_users** — trích test nháp có Spring context:

\`\`\`java
JdbcUserDetailsManager m = new JdbcUserDetailsManager(dataSource);
m.setUsersByUsernameQuery("SELECT username, password, enabled, locked, FALSE, FALSE FROM shop_users WHERE username = ?");
m.setAuthoritiesByUsernameQuery("SELECT u.username, a.authority FROM shop_user_authorities a JOIN shop_users u ON a.user_id = u.id WHERE u.username = ?");
DaoAuthenticationProvider p = new DaoAuthenticationProvider(m);
p.setPasswordEncoder(passwordEncoder);
p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated("mary", "67890"));  // [read, write, FACTOR_PASSWORD], principal là User
p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated("bill", "12345"));  // LockedException: User account is locked
\`\`\`

Với truy vấn 3 cột, cùng lệnh cho bill trả về token đã xác thực; với 4 cột mọi user hỏng: \`InternalAuthenticationServiceException: PreparedStatementCallback; SQL [SELECT username, password, enabled, locked FROM shop_users WHERE username = ?]; Invalid value "5" for parameter "columnIndex"\`.

Bản lời giải: \`labs/ssia/sessions/s06/solution/\` (\`solution.delete\` gỡ \`ShopUserDetailsService.java\`).`,
    work: {
      patterns: [
        "Thêm chức năng đăng ký / đổi mật khẩu cho một service có sẵn: một bean `UserDetailsManager`, mã hoá ở nơi gọi, kiểm mật khẩu cũ, giữ CSRF.",
        "Đánh giá có dùng `JdbcUserDetailsManager` cho một lược đồ có sẵn không: viết lại truy vấn (6 cột nếu cần khoá/hết hạn), và nhớ rằng nó đòi mỗi user ít nhất một authority, không kiểm mật khẩu cũ nếu thiếu `AuthenticationManager`.",
        "Client tích hợp báo \"POST trả 401 dù đúng mật khẩu\": nghĩ tới CSRF và lượt `/error` trước khi nghi credential.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Sự cố: sau khi đổi mật khẩu qua `PUT /users/me/password` (trả 204), mary không đăng nhập được nữa — cả bằng mật khẩu cũ lẫn mật khẩu mới. Trong 6 phút, tìm bằng chứng và sửa.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** `curl -u mary:67890` → 401, `curl -u mary:m2` → 401; PUT trước đó 204.\n\n**Bằng chứng.** Log mặc định đã có ERROR ở mỗi lần đăng nhập (sai mật khẩu thì không bao giờ có):\n```text\nERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception\njava.lang.IllegalArgumentException: Given that there is no default password encoder configured, each password must have a password encoding prefix. Please either prefix this password with '{noop}' or set a default password encoder in `DelegatingPasswordEncoder`.\n```\nĐúng lỗi của s02: mật khẩu đã lưu không có tiền tố `{id}`.\n\n**Nguyên nhân.** Controller gọi `manager.changePassword(req.oldPassword(), req.newPassword())` — truyền chữ thường. Hợp đồng (như `JdbcUserDetailsManager`) lưu nguyên `newPassword`, nên cột `password` của mary thành `m2` — không có tiền tố `{id}`. Từ đó *mọi* lần đăng nhập của mary, gõ `67890` hay `m2`, đều so với giá trị đã lưu `m2` qua `DelegatingPasswordEncoder`, rơi vào `UnmappedIdPasswordEncoder` và ném `IllegalArgumentException` — đúng hai dòng ERROR cho hai lần thử. Ngoại lệ không phải `AuthenticationException` → 500 → lượt `/error` → 401.\n\n**Sửa.** `manager.changePassword(req.oldPassword(), passwordEncoder.encode(req.newPassword()))`. Với mary đã hỏng: tạo lại mật khẩu đã mã hoá cho cô ấy (hoặc khởi động lại — H2 trong bộ nhớ nạp lại `data.sql`).",
        },
        {
          text: "Sự cố: gửi `oldPassword` sai tới `PUT /users/me/password` với Basic đúng, curl nhận `401` kèm `WWW-Authenticate: Basic` — client tưởng credential sai và hỏi lại mật khẩu. Trong 5 phút, chỉ ra ai trả 401 và sửa sao cho trả 400.",
          timeLimitMin: 5,
          solution: "**Triệu chứng.** `401`, `WWW-Authenticate: Basic realm=\"Realm\"`; cùng credential gọi `/orders` vẫn 200.\n\n**Bằng chứng.** Log DEBUG của request:\n```text\nDEBUG o.s.security.web.FilterChainProxy      : Securing PUT /users/me/password\nDEBUG o.s.s.a.dao.DaoAuthenticationProvider  : Authenticated user\nDEBUG o.s.s.w.a.www.BasicAuthenticationFilter: Set SecurityContextHolder to UsernamePasswordAuthenticationToken [Principal=SecurityUser[mary, [read, write]], …\nDEBUG o.s.security.web.FilterChainProxy      : Secured PUT /users/me/password\nDEBUG s.w.a.DelegatingAuthenticationEntryPoint : No match found. Using default entry point …BasicAuthenticationEntryPoint@…\n```\n`Secured PUT …` nghĩa là chain đã cho qua và controller đã chạy; entry point được gọi *sau* đó.\n\n**Nguyên nhân.** `BadCredentialsException` (một `AuthenticationException`) từ `changePassword` thoát khỏi controller, đi ngược lên chain; `ExceptionTranslationFilter` bắt mọi `AuthenticationException` từ phía sau nó và gọi entry point như thể user chưa đăng nhập.\n\n**Sửa.** Bắt `BadCredentialsException` trong controller và trả `400 {\"error\":\"mật khẩu cũ không đúng\"}`. Nguyên tắc: `AuthenticationException` chỉ dành cho việc xác thực request; lỗi nghiệp vụ dùng mã của nghiệp vụ.",
        },
      ],
    },
    tips: [
      "Một bean cho cả hai vai: kiểu trả về của `@Bean` là `UserDetailsManager`, `InitializeUserDetailsBeanManagerConfigurer` vẫn thấy nó là `UserDetailsService` duy nhất. Hai bean là mất provider toàn cục.",
      "Mã hoá ở nơi gọi, kiểm ở manager: `createUser`/`changePassword` lưu đúng chuỗi nhận được. Đổi encoder ở chương 4 thì chỉ đổi bean `PasswordEncoder`.",
      "`GET /csrf` chỉ an toàn khi trang của origin khác không đọc được phản hồi của nó: đừng mở CORS kèm credential cho origin lạ (chương 10). Trình duyệt và SPA thường lấy token theo cách khác — chương 9.",
      "Dùng `JdbcUserDetailsManager` thật thì nhớ `setAuthenticationManager(...)` trước khi mở endpoint đổi mật khẩu; muốn nó biết \"bị khoá\" thì truy vấn user phải trả đủ 6 cột (lược đồ mặc định chỉ có 3).",
      "MockMvc trong test của buổi: `.with(httpBasic(\"john\", \"12345\")).with(csrf())` — `csrf()` thêm token hợp lệ, không tắt CSRF; thiếu nó vẫn 403.",
    ],
    outcome: {
      md: `order quản lý được user của chính nó: tạo, đổi mật khẩu, kiểm mật khẩu cũ, mật khẩu mới luôn qua encoder, CSRF vẫn bật — và bạn biết chính xác \`JdbcUserDetailsManager\` có sẵn khác gì. Trên máy:

\`\`\`bash
./labs/lab verify ssia s06
\`\`\`

Verify gọi \`POST /users\` và \`PUT /users/me/password\` qua MockMvc (có và không có token CSRF, có và không có Basic), đăng nhập user vừa tạo, đọc cột \`password\` trong \`shop_users\`, dựng một H2 riêng bằng \`users.ddl\` của jar, và chạy hai truy vấn \`USERS_QUERY\`, \`AUTHORITIES_QUERY\` của bạn qua một \`JdbcUserDetailsManager\` trên DB của order để so với \`answers/s06.env\`.`,
      verifyOutput: "lab: kiểm s06\n  ✓ POST /users tạo user, user mới đăng nhập được với đúng authority\n  ✓ POST /users và PUT /users/me/password vẫn đòi CSRF và đăng nhập\n  ✓ username đã có → 409, user cũ không bị ghi đè\n  ✓ mật khẩu lưu đã qua PasswordEncoder\n  ✓ đổi mật khẩu: mật khẩu cũ → 401, mật khẩu mới → 200\n  ✓ sai mật khẩu cũ → 400 không WWW-Authenticate, không đổi gì\n  ✓ answers/s06.env: DDL_FILE, DEFAULT_TABLES, USERS_COLUMNS\n  ✓ answers/s06.env: NO_AUTHORITY_EXCEPTION, NO_AUTHORITY_MESSAGE, LOCKED_AFTER_RELOAD\n  ✓ answers/s06.env: USERS_QUERY, AUTHORITIES_QUERY — JdbcUserDetailsManager đọc shop_users, bill bị khoá\n  ✓ answers/s06.env: REAUTH_SETTER\n  → 10/10 đạt",
      projectDelta: "order có `ShopUserDetailsManager` (một bean, cả hai vai) và `UserController`: `POST /users`, `PUT /users/me/password`, `GET /csrf`. User mới lưu mật khẩu dạng `{bcrypt}…`; chương 4 đưa john, mary, bill cũ sang băm, chương 7 giới hạn ai được tạo user.",
    },
    review: [
      { q: "Spring Security gọi những phương thức nào của `UserDetailsManager`?", a: "Khi đăng nhập chỉ `loadUserByUsername` (và `updatePassword` nếu context có đúng một bean `UserDetailsPasswordService` — `InitializeUserDetailsBeanManagerConfigurer` của Spring Security nối nó vào provider). `createUser`, `changePassword`, … là để ứng dụng gọi." },
      { q: "Vì sao `changePassword(old, new)` không có tham số username, và hệ quả với việc kiểm mật khẩu cũ?", a: "Nó đổi mật khẩu của user hiện tại, lấy từ `SecurityContextHolder`. Kiểm `old` là trách nhiệm hiện thực: `JdbcUserDetailsManager` chỉ kiểm khi có `setAuthenticationManager`, không có thì đổi luôn." },
      { q: "Với `JdbcUserDetailsManager`, vì sao user tạo bằng `accountLocked(true)` đọc lại vẫn mở, và làm sao để nó đọc được cột `locked` của `shop_users`?", a: "`users.ddl` không có cột khoá và truy vấn mặc định trả 3 cột; `mapToUser` chỉ đọc cột 4–6 (`acc_locked`, `acc_expired`, `creds_expired`) khi kết quả có hơn 3 cột, `createUser` chỉ ghi chúng khi câu SQL có hơn 3 tham số. Đặt `setUsersByUsernameQuery(\"SELECT username, password, enabled, locked, FALSE, FALSE FROM shop_users WHERE username = ?\")` cùng một truy vấn authority theo `user_id`: bill nhận `LockedException`. User không có dòng authority nào vẫn bị coi là không tồn tại (`User … has no GrantedAuthority`)." },
      { q: "`POST /users` với Basic đúng, không token: curl thấy gì, MockMvc thấy gì, vì sao khác?", a: "curl 401: `CsrfFilter` trả 403 bằng `sendError`, lượt `/error` không còn credential nên thành 401. MockMvc không có lượt `/error` nên thấy 403." },
      { q: "Token lấy từ `GET /csrf` gửi lại mà không có cookie thì bị từ chối. Vì sao?", a: "Mặc định `HttpSessionCsrfTokenRepository` lưu token trong `HttpSession` của request đã sinh ra nó; request không mang `JSESSIONID` có session mới, rỗng, không có token để so." },
    ],
  },
];
