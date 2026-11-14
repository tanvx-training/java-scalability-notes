// Chặng 4 — Quản lý mật khẩu (chương 4 của sách). Hai buổi đã phát hành.
// Script lab: labs/ssia/sessions/s07, s08 (test ở order/src/test/java/lab/<buổi>/).
// Mọi lớp, log, mã trạng thái dưới đây đo trên labs/ssia/app với Spring Boot 4.1.2 / Spring Security 7.1.2.

export const sessions = [
  // ───────────────────────────── s07 ─────────────────────────────
  {
    id: "s07",
    stage: "st04",
    title: "PasswordEncoder và DelegatingPasswordEncoder: băm lại mật khẩu kiểu cũ khi user đăng nhập",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s06"],
    status: "published",
    pieces: ["password-encoding"],
    goals: [
      "Đọc contract `PasswordEncoder` trên bản 7.1.2 và đo trên máy bạn giá của BCrypt, PBKDF2, SCrypt, Argon2 với tham số mặc định hiện hành.",
      "Đọc map `{id}` → encoder mà `PasswordEncoderFactories.createDelegatingPasswordEncoder()` dựng, và chỉ ra encoder nào thực sự được gọi cho từng giá trị trong cột `password`.",
      "Cho user đến từ hệ thống cũ (SHA-256 hex, không tiền tố) đăng nhập được, rồi để Spring Security tự băm lại mật khẩu của họ sang `{bcrypt}` ở lần đăng nhập đúng đầu tiên.",
      "Chẩn đoán hai lỗi của việc đổi thuật toán: mọi user 401 sau khi \"siết\" encoder, và băm lại không bao giờ xảy ra mà không có dòng log nào.",
    ],
    skills: [
      { skill: "int-passwordencoder-contract", level: "Giải thích được" },
      { skill: "cfg-delegating-encoder", level: "Viết được không tra" },
      { skill: "cfg-passwordencoder-bean", level: "Viết được không tra" },
      { skill: "int-password-upgrade", level: "Giải thích được" },
      { skill: "dx-encoder-benchmark", level: "Làm được có tra" },
    ],
    uses: ["cfg-userdetailsmanager", "cfg-userdetailsservice-db", "dx-security-debug-log", "int-debug-breakpoint-filter"],
    foundation: null,
    mindset: `**\`PasswordEncoder\` có ba phương thức, và phương thức thứ ba mới là chuyện của chương này.** \`encode\` và \`matches\` thì bạn đã dùng từ s02. \`upgradeEncoding(encoded)\` trả lời câu "băm đã lưu này có cần làm lại không?". Trên bản 7.1.2, người hỏi câu đó là \`DaoAuthenticationProvider\`, ngay sau một lần đăng nhập đúng. Nếu câu trả lời là có, provider băm lại *mật khẩu người dùng vừa gõ* bằng encoder hiện hành, rồi giao kết quả cho một \`UserDetailsPasswordService\` để ghi vào DB. Luồng dưới đây đọc từ mã nguồn 7.1.2 và đối chiếu với log SQL trên order khi dave (băm SHA-256 cũ) đăng nhập:

\`\`\`mermaid
sequenceDiagram
  participant F as BasicAuthenticationFilter
  participant P as DaoAuthenticationProvider
  participant M as ShopUserDetailsManager
  participant D as DelegatingPasswordEncoder
  participant L as MessageDigestPasswordEncoder("SHA-256")
  participant B as BCryptPasswordEncoder
  F->>P: authenticate(dave, "54321")
  P->>M: loadUserByUsername("dave")
  M-->>P: password = 20f37658…(không tiền tố)
  P->>D: matches("54321", "20f37658…")
  Note over D: extractId → null → không có trong map<br/>→ defaultPasswordEncoderForMatches
  D->>L: matches("54321", "20f37658…") → true
  P->>D: upgradeEncoding("20f37658…")
  Note over D: id null ≠ "bcrypt" → true
  P->>D: encode("54321")
  D->>B: encode → $2a$10$…
  D-->>P: {bcrypt}$2a$10$…
  P->>M: updatePassword(user, "{bcrypt}$2a$10$…")
  M->>M: UPDATE shop_users SET password = ? WHERE username = ?
  P-->>F: Authentication (principal = user đã nạp)
\`\`\`

Bốn điều rút ra, mỗi điều đều đo được trên order:

- **\`DelegatingPasswordEncoder\` chọn encoder theo tiền tố của *giá trị đã lưu*, không theo cấu hình.** Map của \`createDelegatingPasswordEncoder()\` có 14 id. Bảy id trỏ tới lớp mang \`@Deprecated\` (đọc bằng reflection trên chính bean). Các id \`pbkdf2\`, \`scrypt\`, \`argon2\` không có hậu tố trỏ tới bản tham số cũ để đọc băm cũ: chúng được dựng bằng factory \`…defaultsForSpringSecurity_v5_5/_v4_1/_v5_2\`, mà chính các factory đó đã deprecated. Còn \`…@SpringSecurity_v5_8\` là tham số hiện hành. Chỉ \`bcrypt\` được dùng để *băm mới* (\`idForEncode\`).
- **Giá trị không có tiền tố không đi tới bcrypt.** Nó đi tới \`defaultPasswordEncoderForMatches\`, mặc định là \`UnmappedIdPasswordEncoder\`, và lớp này luôn ném \`IllegalArgumentException\`. Đó chính là lỗi của s02: trên order, dave:54321 nhận 401 và log ERROR \`Given that there is no default password encoder configured, each password must have a password encoding prefix…\`. Muốn đọc băm không tiền tố thì gọi \`setDefaultPasswordEncoderForMatches(...)\`. Đó là biện pháp tạm: khi đã đặt, *mọi* giá trị không tiền tố đều được coi là SHA-256 không salt, mãi mãi, kể cả dòng mới do job nhập ghi vào. Cách sửa thật nằm ở nguồn: job nhập ghi kèm tiền tố \`{SHA-256}\` hoặc bọc băm cũ bằng bcrypt. Khi không còn dòng nào không tiền tố (đếm bằng \`WHERE password NOT LIKE '{%'\`), bỏ encoder mặc định đó đi.
- **Băm lại chỉ xảy ra khi provider có một \`UserDetailsPasswordService\` thật.** \`InitializeUserDetailsBeanManagerConfigurer\` (Spring Security, đã gặp ở s05–s06) lấy bean kiểu đó bằng \`getBeanProvider(...).getIfUnique()\`. Có đúng một bean thì nối vào, không có hoặc có hai bean thì provider giữ \`UserDetailsPasswordService.NOOP\` và bỏ qua bước băm lại. Trường hợp hai bean không có WARN nào (drill 2), khác hẳn trường hợp hai bean \`UserDetailsService\` ở s06.
- **Đăng nhập sai không ghi gì; đăng nhập đúng lần hai cũng không.** Băm lại chạy trong \`createSuccessAuthentication\`, tức chỉ sau khi \`matches\` đúng. Với \`{bcrypt}$2a$10$…\`, \`upgradeEncoding\` hỏi tiếp \`BCryptPasswordEncoder\`: strength đã lưu (10) có nhỏ hơn strength hiện hành không. Bằng nhau thì không ghi. Đo trên order với log SQL: dave đăng nhập lần đầu có \`UPDATE shop_users SET password = ?\` mang \`{bcrypt}$2a$10$…\`, lần hai không có UPDATE, \`dave:sai\` → 401 cũng không có UPDATE.

**Giá của một lần băm, đo trên máy lab** (một scratch test, mật khẩu \`12345\`, trung bình 5 lần \`encode\`, JDK 25). Số của bạn sẽ khác, nhưng tỉ lệ thì giữ:

| Encoder (tham số mặc định 7.1.2) | encode | Định dạng |
|---|---|---|
| \`new BCryptPasswordEncoder()\` (strength 10) | ~90–110 ms | \`$2a$10$…\` 60 ký tự |
| \`new BCryptPasswordEncoder(12)\` / \`(14)\` | ~350–470 ms / ~1,4–1,8 s | mỗi +1 strength gấp đôi |
| \`Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()\` (salt 16, 310 000 vòng, SHA-256) | ~60–80 ms | hex 96 ký tự |
| \`SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()\` | ~140 ms (cần BouncyCastle) | \`$100801$salt$hash\` |
| \`Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()\` (m=16384, t=2, p=1) | ~25 ms (cần BouncyCastle) | \`$argon2id$v=19$m=16384,t=2,p=1$…\` |

Không có BouncyCastle trên classpath (order mặc định không có), \`createDelegatingPasswordEncoder()\` vẫn dựng được và app vẫn khởi động. Lỗi chỉ đến khi có một băm \`{scrypt}\` hoặc \`{argon2}\` cần so: \`NoClassDefFoundError: org/bouncycastle/crypto/generators/SCrypt\`. Chậm là chủ ý: kẻ có bản sao DB phải trả cùng giá cho mỗi lần đoán. Nhưng mỗi lần đăng nhập Basic cũng trả giá đó, vì Basic gửi mật khẩu ở *mọi* request (log của t3: mỗi \`GET /orders\` đều có lại dòng \`Authenticated user\`).`,
    bookDiff: [
      { book: "Mục 4.1.4: nếu giá trị không có tiền tố, `DelegatingPasswordEncoder` dùng encoder mặc định, tức encoder truyền làm tham số đầu của constructor (bcrypt trong listing 4.4).", now: "7.1.2: tham số đầu (`idForEncode`) chỉ quyết định encoder để *băm mới*. Giá trị không tiền tố đi tới `defaultPasswordEncoderForMatches`, mặc định là `UnmappedIdPasswordEncoder` và luôn ném `IllegalArgumentException`. Đo trên order: dave (SHA-256 hex) nhận 401 và log ERROR `…each password must have a password encoding prefix…`. Phải gọi `setDefaultPasswordEncoderForMatches(...)`.", why: "Mã nguồn `DelegatingPasswordEncoder` 7.1.2 tách hai vai `passwordEncoderForEncode` và `defaultPasswordEncoderForMatches`. Tài liệu 7.1 (Password Storage → Password Matching) mô tả đúng như vậy." },
      { book: "Listing 4.4 tạo `new SCryptPasswordEncoder()`.", now: "7.1.2 chỉ có constructor 5 tham số `SCryptPasswordEncoder(int, int, int, int, int)`. Biên dịch listing 4.4 trên order báo `constructor SCryptPasswordEncoder … cannot be applied to given types; required: int,int,int,int,int, found: no arguments`. Dùng `SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()`. Dù dựng được, encoder vẫn cần `org.bouncycastle:bcprov-jdk18on`, thiếu thì `NoClassDefFoundError` ở lần `encode`/`matches` đầu tiên.", why: "Tham số mặc định được gắn tên theo phiên bản (`_v4_1` deprecated, `_v5_8` hiện hành), để băm cũ vẫn đọc được qua id `scrypt` còn băm mới dùng tham số mạnh hơn. BouncyCastle không phải phụ thuộc của `spring-security-crypto` (POM 7.1.2 không khai)." },
      { book: "Mục 4.1.1: ghi đè `upgradeEncoding` để trả `true` thì \"mật khẩu đã encode sẽ được encode thêm một lần nữa\".", now: "Không ai băm chồng lên băm. `DaoAuthenticationProvider.createSuccessAuthentication` hỏi `upgradeEncoding(băm đã lưu)` sau một lần đăng nhập đúng. Nếu `true` và provider có `UserDetailsPasswordService`, nó `encode` lại *mật khẩu vừa gõ* bằng encoder hiện hành rồi gọi `updatePassword`. Đo trên order: `UPDATE shop_users SET password = ?` với `{bcrypt}$2a$10$…` ở lần đăng nhập đầu của dave, lần sau không có.", why: "Cơ chế nâng cấp băm khi đăng nhập (password upgrade) dùng `upgradeEncoding` làm câu hỏi \"có cần băm lại không\"; mã nguồn provider và configurer 7.1.2 là nguồn." },
    ],
    refs: [
      { label: "Sách, chương 4 — mục 4.1.1 Contract PasswordEncoder, 4.1.2 Tự viết PasswordEncoder, 4.1.3 Các encoder có sẵn, 4.1.4 DelegatingPasswordEncoder", href: "#/docs/springsec-04" },
      { label: "Spring Security 7.1 — Password Storage: DelegatingPasswordEncoder, định dạng {id}", href: "https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-password-storage-dpe" },
      { label: "Spring Security 7.1 — Password Storage: Password Matching (setDefaultPasswordEncoderForMatches)", href: "https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-password-storage-dpe-matching" },
      { label: "Spring Security 7.1 — Password Storage: BCrypt, SCrypt và các encoder khác", href: "https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-password-storage-bcrypt" },
      { label: "Spring Security 7.1 — Password Storage: kiểm mật khẩu đã lộ (CompromisedPasswordChecker)", href: "https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-compromised-password-check" },
    ],
    stateIn: "Đầu ra s06: một bean `ShopUserDetailsManager` trên `shop_users` (vừa `UserDetailsService` vừa `UserDetailsManager`), bean `PasswordEncoder` = `PasswordEncoderFactories.createDelegatingPasswordEncoder()`. john, mary, bill lưu `{noop}…`, user tạo qua `POST /users` lưu `{bcrypt}…`. `./labs/lab begin ssia s07` kiểm đầu vào bằng verify của s06, chép test vào `order/src/test/java/lab/s07/` và **gỡ `lab/s04/S04AnswersTest.java`**: khoá `PRINCIPAL_PASSWORD_AFTER_LOGIN={noop}67890` của s04 mô tả mật khẩu trước chương 4, sau buổi này lần đăng nhập đầu của mary đã đổi nó thành `{bcrypt}…`. Test hành vi của s04 (`S04LoginTest`, `S04PrincipalTest`) ở lại.",
    stateOut: "Bean `PasswordEncoder` của order là `DelegatingPasswordEncoder`: băm mới `{bcrypt}`, đọc được băm SHA-256 hex không tiền tố của hệ thống cũ. `ShopUserDetailsManager` còn hiện thực `UserDetailsPasswordService`, nên mọi user có băm kiểu cũ (`{noop}`, SHA-256) được băm lại sang `{bcrypt}` ở lần đăng nhập đúng đầu tiên. `data.sql` có thêm dave; `answers/s07.env` mô tả encoder được gọi cho từng kiểu băm.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s07`. Trong IDE mở `PasswordEncoder`, `AbstractValidatingPasswordEncoder` và `PasswordEncoderFactories` (jar `spring-security-crypto` 7.1.2). Viết một test nháp (ví dụ `order/src/test/java/scratch/EncoderBenchTest.java`, không cần Spring context) đo thời gian `encode` và `matches` của `new BCryptPasswordEncoder()`, `new BCryptPasswordEncoder(12)`, `Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()`, `SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()`, `Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()` với cùng mật khẩu, in cả hai lần `encode` liên tiếp. Chạy `cd labs/ssia/work && mvn -q -pl order -am test -Dtest='scratch.EncoderBenchTest' -Dsurefire.failIfNoSpecifiedTests=false`. SCrypt, Argon2 báo gì? Bọc từng phép đo trong `try { … } catch (Throwable t) { System.out.println(…); }`: `NoClassDefFoundError` không bị bắt sẽ làm đỏ cả `mvn -q test` của bạn. Đo xong thì xoá lớp nháp hoặc gắn `@Disabled`. Tuỳ chọn, nếu còn thời gian: commit (`git add -A && git commit -m t1`), thêm `org.bouncycastle:bcprov-jdk18on:1.85.2` scope `test` vào `order/pom.xml`, đo lại SCrypt và Argon2, rồi `git stash -u`. `SCRYPT_ERROR` của t4 chỉ cần lần chạy không có BouncyCastle; order thật không có nó." },
      { id: "t2", text: "Bằng chứng s02 của chương 4: thêm vào `data.sql` user **dave** đến từ hệ thống cũ, mật khẩu `54321` lưu dạng SHA-256 hex không salt, **không tiền tố**: `20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a` (authority `read`). Build, chạy, gọi `curl -i -u dave:54321 localhost:8082/orders`. Mã gì, log ERROR nói gì? Job nhập user từ hệ thống cũ sẽ còn chạy và **vẫn ghi băm SHA-256 không tiền tố**, nên không sửa dữ liệu được: sửa ở bean `PasswordEncoder`. Giữ `createDelegatingPasswordEncoder()` để băm mới vẫn là `{bcrypt}` (verify đòi đúng tiền tố này), và cho băm không tiền tố đi tới `new MessageDigestPasswordEncoder(\"SHA-256\")`. Đây là bước tạm cho tới khi job nhập được sửa để ghi tiền tố (xem Tư duy và Tips), không phải trạng thái cuối." },
      { id: "t3", text: "Băm lại khi đăng nhập: cho bean manager của s06 hiện thực thêm `UserDetailsPasswordService`. `updatePassword(user, newPassword)` ghi `newPassword` (đã mã hoá, Spring Security đưa vào) vào cột `password` rồi trả về user mang mật khẩu mới. Vẫn **một** bean cho cả ba vai. Chạy với `--logging.level.org.springframework.security=DEBUG --logging.level.org.springframework.jdbc.core.JdbcTemplate=DEBUG --logging.level.org.springframework.jdbc.core.StatementCreatorUtils=TRACE`, gọi lần lượt `dave:54321`, `dave:54321`, `dave:sai`, `john:12345`, `john:12345`. Lần nào có `UPDATE shop_users SET password = ?`, với giá trị gì?" },
      { id: "t4", kind: "dissect", text: "Chạy `OrderApplication` ở chế độ Debug, breakpoint trong `DelegatingPasswordEncoder.matchesNonNull` và trong `DaoAuthenticationProvider.createSuccessAuthentication` ở dòng gọi `updatePassword`. Đăng nhập john, dave, và một user vừa tạo qua `POST /users`. Dùng Evaluate Expression trên bean `PasswordEncoder` để xem trường `idToPasswordEncoder` và `defaultPasswordEncoderForMatches`. Viết `answers/s07.env`: `ENCODE_ID` (id dùng khi encode), `ENCODER_IDS` (mọi id trong map, cách nhau dấu phẩy, không phân biệt hoa thường), `DEPRECATED_ENCODERS` (simple name các lớp encoder trong map mang `@Deprecated`), rồi với bốn giá trị đã lưu `{noop}12345`, `{bcrypt}$2a$10$…`, `20f37658…` (không tiền tố) và `{SHA-256}20f37658…`, simple name của encoder được gọi `matches`: `MATCHER_NOOP`, `MATCHER_BCRYPT`, `MATCHER_UNPREFIXED`, `MATCHER_SHA256_PREFIXED`. Thêm `SCRYPT_ERROR` (simple name lỗi khi bean so một băm `{scrypt}…` trên classpath của order, `none` nếu không có lỗi), `UPGRADE_CALLER` (`Lớp.phươngThức` gọi `updatePassword`) và `PASSWORD_SERVICE_BEAN` (tên bean mà provider của Basic đang giữ làm `UserDetailsPasswordService`). Verify đọc map của bean thật, so một băm `{scrypt}` thật, ghi lại khung gọi `updatePassword`, và tìm bean mà provider thật đang giữ." },
      { id: "t5", text: "`./labs/lab verify ssia s07` đạt 8/8. Verify chèn thẳng vào `shop_users` các user ngẫu nhiên có băm SHA-256 không tiền tố hoặc `{noop}`, đăng nhập qua MockMvc, rồi đọc lại cột `password`. Chạy cả bộ test: `cd labs/ssia/work && mvn -q test`, các test của s01–s06 vẫn xanh dù john, mary giờ bị băm lại ngay lần đăng nhập đầu." },
    ],
    hints: [
      "`setDefaultPasswordEncoderForMatches` là phương thức của `DelegatingPasswordEncoder`, không có trên interface `PasswordEncoder`: ép kiểu kết quả của `PasswordEncoderFactories.createDelegatingPasswordEncoder()` (javadoc của factory ghi rõ nó trả về `DelegatingPasswordEncoder`).",
      "`MessageDigestPasswordEncoder` mang `@Deprecated` (javadoc: chỉ để tương thích với băm cũ, không có kế hoạch gỡ). Dùng nó *chỉ để đọc* băm cũ là đúng mục đích; `@SuppressWarnings(\"deprecation\")` trên phương thức bean và ghi chú lý do.",
      "Đừng dùng `NoOpPasswordEncoder` làm encoder mặc định \"cho chạy được\": khi đó chuỗi băm cũ bị so như chữ thường, gõ đúng chuỗi hex `20f37658…` làm mật khẩu là vào được. Verify thử đúng cách đó và đòi 401.",
      "Băm lại không xảy ra, không có log nào: đặt breakpoint ở `createSuccessAuthentication` và xem trường `userDetailsPasswordService` của provider. Nếu nó là chính hằng `UserDetailsPasswordService.NOOP` (một lambda khai trong interface) thì configurer đã không nối bean của bạn. Đếm bean kiểu `UserDetailsPasswordService` trong context.",
      "`ENCODER_IDS`: đừng chép javadoc của `PasswordEncoderFactories`, hãy đọc map của bean đang chạy. Lưu ý `SHA-256` (MessageDigest) và `sha256` (`StandardPasswordEncoder`) là hai id khác nhau.",
      "`SCRYPT_ERROR`: verify so một băm `{scrypt}` trên classpath test hiện tại của order. Nếu bạn quên `git stash` sau t1 (còn BouncyCastle trong pom) thì giá trị đo được sẽ khác giá trị bạn thấy khi chạy jar.",
    ],
    solution: `**1. Contract và giá của một lần băm**

\`PasswordEncoder\` 7.1.2 có \`encode\` và \`matches\` (đều chấp nhận \`@Nullable\`), cùng \`default boolean upgradeEncoding(...) { return false; }\`. Mọi encoder có sẵn kế thừa \`AbstractValidatingPasswordEncoder\`, trong đó \`encode\`, \`matches\`, \`upgradeEncoding\` là \`final\`. Lớp này xử lý \`null\` trước: \`matches\` với mật khẩu hoặc băm rỗng trả \`false\` mà không gọi thuật toán. Kết quả đo ở bảng trong Tư duy. Không có BouncyCastle:

\`\`\`text
PROBE scrypt_v5_8 FAILED java.lang.NoClassDefFoundError: org/bouncycastle/crypto/generators/SCrypt
PROBE argon2_v5_8 FAILED java.lang.NoClassDefFoundError: org/bouncycastle/crypto/params/Argon2Parameters$Builder
\`\`\`

Hai lần \`encode\` liên tiếp của mọi encoder cho hai chuỗi khác nhau, vì salt ngẫu nhiên nằm ngay trong chuỗi. Vì vậy \`matches\` không băm lại rồi so chuỗi như listing 4.2, mà đọc salt từ băm đã lưu.

**2. dave trước khi sửa**

\`\`\`text
HTTP/1.1 401
ERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception
java.lang.IllegalArgumentException: Given that there is no default password encoder configured, each password must have a password encoding prefix. Please either prefix this password with '{noop}' or set a default password encoder in \`DelegatingPasswordEncoder\`.
\`\`\`

Cùng đường với s02: ngoại lệ không phải \`AuthenticationException\` → 500 → lượt \`/error\` → 401. \`dave:sai\` cũng y hệt, vì encoder ném lỗi trước khi biết mật khẩu đúng hay sai.

**3. Bean PasswordEncoder**

\`\`\`java
@Bean
@SuppressWarnings("deprecation") // MessageDigestPasswordEncoder: chỉ để đọc băm cũ, không bao giờ để băm mới
PasswordEncoder passwordEncoder() {
  DelegatingPasswordEncoder encoder =
      (DelegatingPasswordEncoder) PasswordEncoderFactories.createDelegatingPasswordEncoder();
  encoder.setDefaultPasswordEncoderForMatches(new MessageDigestPasswordEncoder("SHA-256"));
  return encoder;
}
\`\`\`

\`MessageDigestPasswordEncoder\` đọc salt dạng \`{salt}\` ở đầu chuỗi. Không có thì salt rỗng, đúng với băm SHA-256 hex trần của hệ thống cũ.

**4. Băm lại: manager thêm một vai**

\`\`\`java
public class ShopUserDetailsManager implements UserDetailsManager, UserDetailsPasswordService {
  // … như s06
  /** newPassword đã mã hoá ({bcrypt}…). Spring Security gọi phương thức này, không phải ứng dụng. */
  @Override
  public UserDetails updatePassword(UserDetails user, String newPassword) {
    users.updatePassword(user.getUsername(), newPassword);
    return loadUserByUsername(user.getUsername());
  }
}
\`\`\`

Log khởi động vẫn \`Global AuthenticationManager configured with UserDetailsService bean with name userDetailsService\`, không có dòng nào báo việc nối \`UserDetailsPasswordService\`. Log của t3 (rút gọn):

\`\`\`text
Securing GET /orders                                              ← dave:54321 lần 1
Executing prepared SQL statement [SELECT id, username, password, enabled, locked FROM shop_users WHERE username = ?]
Executing prepared SQL statement [UPDATE shop_users SET password = ? WHERE username = ?]
  parameter value [{bcrypt}$2a$10$fgC28rPgaq95GDqQMr/gZuzytaKhcwlbPJf6GVXr3L2O9tfrxU7aq] … [dave]
DaoAuthenticationProvider : Authenticated user
Securing GET /orders                                              ← dave:54321 lần 2: không UPDATE
DaoAuthenticationProvider : Authenticated user
Securing GET /orders                                              ← dave:sai: không UPDATE
DaoAuthenticationProvider : Failed to authenticate since password does not match stored value
Securing GET /orders                                              ← john:12345 lần 1
Executing prepared SQL statement [UPDATE shop_users SET password = ? WHERE username = ?]
  parameter value [{bcrypt}$2a$10$05umDuKlaRd14nmmHz7UsOtq95LOiPN8OzumQ4Y/2oII5hV98.gGa] … [john]
\`\`\`

Cả năm request trả 200, 200, 401, 200, 200. Principal của lần đầu vẫn là user đã nạp *trước* khi băm lại: provider truyền \`principal\` cũ cho \`createSuccessAuthentication\`, chỉ đối tượng \`user\` được thay bằng kết quả của \`updatePassword\`. Đó là lý do \`S04AnswersTest\` bị gỡ: \`getPassword()\` của principal giờ phụ thuộc mary đã đăng nhập trước đó hay chưa.

**5. Mổ xẻ**

\`\`\`bash
cat > answers/s07.env <<'EOF'
ENCODE_ID=bcrypt
ENCODER_IDS=bcrypt,ldap,MD4,MD5,noop,pbkdf2,pbkdf2@SpringSecurity_v5_8,scrypt,scrypt@SpringSecurity_v5_8,SHA-1,SHA-256,sha256,argon2,argon2@SpringSecurity_v5_8
DEPRECATED_ENCODERS=LdapShaPasswordEncoder,Md4PasswordEncoder,MessageDigestPasswordEncoder,NoOpPasswordEncoder,StandardPasswordEncoder
MATCHER_NOOP=NoOpPasswordEncoder
MATCHER_BCRYPT=BCryptPasswordEncoder
MATCHER_UNPREFIXED=MessageDigestPasswordEncoder
MATCHER_SHA256_PREFIXED=MessageDigestPasswordEncoder
SCRYPT_ERROR=NoClassDefFoundError
UPGRADE_CALLER=DaoAuthenticationProvider.createSuccessAuthentication
PASSWORD_SERVICE_BEAN=userDetailsService
EOF
\`\`\`

Bảy id có lớp deprecated (MD4, MD5, SHA-1, SHA-256, ldap, noop, sha256) nhưng chỉ năm lớp, vì ba id MessageDigest dùng chung một lớp. \`MATCHER_UNPREFIXED\` và \`MATCHER_SHA256_PREFIXED\` cùng một lớp nhưng đi hai đường: giá trị có \`{SHA-256}\` được tra trong map, còn giá trị không tiền tố đi qua \`defaultPasswordEncoderForMatches\`. Bản lời giải: \`labs/ssia/sessions/s07/solution/\`.`,
    work: {
      patterns: [
        "Đổi thuật toán băm của một hệ thống đang chạy (SHA/MD5 tự viết → bcrypt) mà không bắt user đặt lại mật khẩu: `DelegatingPasswordEncoder` với encoder cho băm cũ + `UserDetailsPasswordService` để băm lại khi đăng nhập.",
        "Nhập user từ hệ thống khác: hoặc thêm tiền tố `{id}` vào dữ liệu khi nhập (nếu sửa được job nhập), hoặc `setDefaultPasswordEncoderForMatches` cho dữ liệu không sửa được.",
        "Chọn tham số băm (strength của BCrypt, số vòng PBKDF2) bằng số đo trên máy chạy thật, nhân với số request có Basic mỗi giây.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Sự cố: một PR \"siết bảo mật\" đổi bean thành `return new BCryptPasswordEncoder();`. Sau khi deploy, john, mary, dave đều nhận 401, kể cả user vừa tạo hôm qua qua `POST /users`. Trong 6 phút, tìm bằng chứng và sửa.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** `curl -u john:12345` → 401, `dave:54321` → 401, `mary:67890` → 401. Log không có ERROR.\n\n**Bằng chứng.** Log mặc định (INFO) đã có, mỗi lần đăng nhập một dòng:\n```text\nWARN … o.s.s.c.bcrypt.BCryptPasswordEncoder : Encoded password does not look like BCrypt\n```\n`BCryptPasswordEncoder.matches` kiểm giá trị đã lưu bằng regex `\\A\\$2(a|y|b)?\\$(\\d\\d)\\$…` trước khi so. Không khớp thì ghi WARN và trả `false` → `BadCredentialsException` → 401.\n\n**Nguyên nhân.** Cột `password` chứa `{noop}12345`, `20f37658…`, và cả `{bcrypt}$2a$10$…`. Cả ba đều không bắt đầu bằng `$2`, kể cả băm bcrypt thật, vì tiền tố `{bcrypt}` nằm trong chuỗi đã lưu (đo: `new BCryptPasswordEncoder().matches(\"12345\", \"{bcrypt}$2a$10$…\")` → `false` và WARN, bỏ `{bcrypt}` thì `true`). Bỏ `DelegatingPasswordEncoder` là bỏ luôn bước tách tiền tố.\n\n**Sửa.** Trả lại bean của t2 (`createDelegatingPasswordEncoder()` + encoder cho băm không tiền tố). Muốn \"mạnh hơn\" thì tăng strength cho băm *mới*: dựng `DelegatingPasswordEncoder(\"bcrypt\", map)` với `\"bcrypt\" → new BCryptPasswordEncoder(12)`. `BCryptPasswordEncoder.upgradeEncoding` trả `true` cho băm strength 10 (đo: `new BCryptPasswordEncoder(12).upgradeEncoding(băm $2a$10$…)` → `true`), nên băm cũ được nâng dần qua đường của t3.",
        },
        {
          text: "Sự cố: ba tuần sau khi bật băm lại, báo cáo bảo mật cho thấy cột `password` của phần lớn user vẫn là SHA-256 hex, dù họ đăng nhập hằng ngày. Một đồng nghiệp đã thêm một lớp `@Configuration` khai `@Bean UserDetailsPasswordService passwordUpgrader(...)` (\"tách cho rõ\"). Đăng nhập vẫn 200. Trong 6 phút, chứng minh vì sao băm lại không chạy.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** `dave:54321` → 200 nhiều lần; log `JdbcTemplate` DEBUG không có `UPDATE shop_users`; log khởi động không có WARN nào, vẫn là `Global AuthenticationManager configured with UserDetailsService bean with name userDetailsService`.\n\n**Bằng chứng.** Breakpoint ở `DaoAuthenticationProvider.createSuccessAuthentication`: trường `userDetailsPasswordService` là lambda `NOOP` của interface `UserDetailsPasswordService`, nên `upgradeEncoding` đúng là `true` nhưng điều kiện `!Objects.equals(this.userDetailsPasswordService, UserDetailsPasswordService.NOOP)` sai. Đếm bean: `ctx.getBeanNamesForType(UserDetailsPasswordService.class)` → `[userDetailsService, passwordUpgrader]`.\n\n**Nguyên nhân.** `InitializeUserDetailsBeanManagerConfigurer` lấy `UserDetailsPasswordService` bằng `getBeanProvider(...).getIfUnique()`. Hai bean thì kết quả là `null`, provider giữ NOOP. Configurer này chỉ in WARN cho trường hợp nhiều `UserDetailsService`, không in gì cho `UserDetailsPasswordService` (đọc mã nguồn 7.1.2; đo trên order: không có dòng nào).\n\n**Sửa.** Giữ đúng một bean kiểu `UserDetailsPasswordService`: xoá bean thêm, hoặc bỏ `implements UserDetailsPasswordService` khỏi manager. Verify s07 kiểm cả hành vi (cột `password` thành `{bcrypt}`) lẫn `PASSWORD_SERVICE_BEAN`. Với bản thêm bean, verify còn 4/8.",
        },
      ],
    },
    tips: [
      "Băm lại khi đăng nhập chỉ nâng được user *có đăng nhập*. User bỏ đi từ lâu vẫn giữ băm yếu: sau một thời hạn, buộc đặt lại mật khẩu cho số còn lại, hoặc bọc băm cũ bằng thuật toán mới (bcrypt của SHA-256) rồi đánh dấu id riêng.",
      "Nếu sửa được dữ liệu, thêm tiền tố là cách gọn nhất: `UPDATE shop_users SET password = '{SHA-256}' || password WHERE password NOT LIKE '{%'`. Map của `createDelegatingPasswordEncoder()` đã có id `SHA-256`. Buổi này chưa dùng được cách đó vì job nhập vẫn ghi băm không tiền tố. Khi job đã sửa và câu `SELECT COUNT(*) FROM shop_users WHERE password NOT LIKE '{%'` trả 0, bỏ `setDefaultPasswordEncoderForMatches` để băm không tiền tố lại bị từ chối.",
      "Listing 4.3 của sách nối `Integer.toHexString(0xFF & b)` nên mất số 0 đứng đầu của mỗi byte nhỏ hơn 0x10. Đo bằng jshell: SHA-512 của `12345` ra 126 ký tự thay vì 128. Băm như thế không so được với hex chuẩn của hệ thống khác, nên dùng `HexFormat.of().formatHex(...)`.",
      "Spring Security 7.1.2 có `CompromisedPasswordChecker`: `InitializeUserDetailsBeanManagerConfigurer` nối bean kiểu này (nếu có đúng một) vào provider, và `DaoAuthenticationProvider` ném `CompromisedPasswordException` khi mật khẩu đã lộ. Buổi này không bật vì bản có sẵn gọi API bên ngoài (tài liệu 7.1, Password Storage → Compromised Password Checking).",
      "Băm lại chạy trong cùng request đăng nhập: lần đăng nhập đầu của mỗi user cũ tốn thêm một lần `encode` bcrypt (~100 ms trên máy lab) và một câu UPDATE. Nếu `updatePassword` ném lỗi thì cả lần đăng nhập thất bại, nên giữ nó đơn giản.",
    ],
    outcome: {
      md: `Mật khẩu của order giờ đổi thuật toán được mà không ai phải đặt lại: user cũ (\`{noop}\`, SHA-256 không tiền tố) vẫn vào được, và được băm lại sang \`{bcrypt}\` ở lần đăng nhập đúng đầu tiên. Bạn biết chính xác encoder nào chạy cho từng giá trị trong cột \`password\`. Trên máy:

\`\`\`bash
./labs/lab verify ssia s07
\`\`\`

Verify chèn user ngẫu nhiên có băm SHA-256 không tiền tố hoặc \`{noop}\` thẳng vào \`shop_users\`, đăng nhập qua MockMvc (đúng, sai, và gõ chính chuỗi băm cũ), đọc lại cột \`password\` sau mỗi lần, rồi đọc map của bean \`PasswordEncoder\` thật, ghi lại ai gọi \`updatePassword\`, và so với \`answers/s07.env\`.`,
      verifyOutput: "lab: kiểm s07\n  ✓ user băm SHA-256 kiểu cũ (không tiền tố) đăng nhập được, sau đó cột password là {bcrypt}\n  ✓ user {noop} được băm lại một lần, lần sau không ghi nữa\n  ✓ mật khẩu sai (kể cả gõ chuỗi băm cũ) → 401, cột password không đổi\n  ✓ dữ liệu mẫu: dave (SHA-256 của 54321) đăng nhập được và được băm lại\n  ✓ answers/s07.env: ENCODE_ID, ENCODER_IDS\n  ✓ answers/s07.env: DEPRECATED_ENCODERS\n  ✓ answers/s07.env: MATCHER_NOOP, MATCHER_BCRYPT, MATCHER_UNPREFIXED, MATCHER_SHA256_PREFIXED, SCRYPT_ERROR\n  ✓ answers/s07.env: UPGRADE_CALLER, PASSWORD_SERVICE_BEAN\n  → 8/8 đạt",
      projectDelta: "Bean `PasswordEncoder` của order băm mới bằng `{bcrypt}`, đọc được băm SHA-256 không tiền tố của hệ thống cũ, và băm lại mật khẩu kiểu cũ khi user đăng nhập (`ShopUserDetailsManager` là `UserDetailsPasswordService`). Thêm user dave từ hệ thống cũ.",
    },
    review: [
      { q: "`DelegatingPasswordEncoder(\"bcrypt\", map)`: tham số `\"bcrypt\"` quyết định gì, và không quyết định gì?", a: "Nó quyết định encoder dùng để *băm mới* (`encode` trả `{bcrypt}…`) và là chuẩn để `upgradeEncoding` so. Nó không quyết định cách so một giá trị không tiền tố: giá trị đó đi tới `defaultPasswordEncoderForMatches`, mặc định `UnmappedIdPasswordEncoder` ném `IllegalArgumentException`, đổi bằng `setDefaultPasswordEncoderForMatches`." },
      { q: "Ba điều kiện nào phải cùng đúng thì Spring Security ghi băm mới sau một lần đăng nhập?", a: "Mật khẩu khớp (băm lại chạy trong `createSuccessAuthentication`); provider có `UserDetailsPasswordService` khác NOOP (configurer chỉ nối khi context có đúng một bean kiểu đó); và `passwordEncoder.upgradeEncoding(băm đã lưu)` trả `true`. Với `DelegatingPasswordEncoder`, điều này đúng khi id khác `idForEncode`, hoặc khi id giống nhưng encoder của id đó tự báo cần nâng (ví dụ strength bcrypt thấp hơn)." },
      { q: "Vì sao `new BCryptPasswordEncoder()` làm cả user có băm `{bcrypt}$2a$10$…` bị 401?", a: "Chuỗi đã lưu có tiền tố `{bcrypt}`, mà `BCryptPasswordEncoder.matches` đòi chuỗi bắt đầu bằng `$2…`. Không khớp thì WARN `Encoded password does not look like BCrypt` và trả `false`. Chỉ `DelegatingPasswordEncoder` mới tách tiền tố." },
      { q: "Map của `createDelegatingPasswordEncoder()` có cả `scrypt` lẫn `scrypt@SpringSecurity_v5_8`. Vì sao hai id, và chuyện gì xảy ra trên order khi gặp một băm `{scrypt}`?", a: "`scrypt` dùng tham số cũ (`defaultsForSpringSecurity_v4_1`, deprecated) để băm đã có vẫn đọc được; `@SpringSecurity_v5_8` là tham số hiện hành. Order không có BouncyCastle nên so một băm `{scrypt}` ném `NoClassDefFoundError: org/bouncycastle/crypto/generators/SCrypt`. App vẫn khởi động, lỗi chỉ đến lúc so." },
      { q: "Sau khi bật băm lại, principal trong `SecurityContext` của lần đăng nhập đầu mang mật khẩu nào?", a: "Băm cũ. `DaoAuthenticationProvider` thay biến `user` bằng kết quả của `updatePassword` nhưng truyền `principal` đã nạp từ trước cho `createSuccessAuthentication`. Từ lần sau, principal mang `{bcrypt}…` vì DB đã đổi." },
    ],
  },

  // ───────────────────────────── s08 ─────────────────────────────
  {
    id: "s08",
    stage: "st04",
    title: "Crypto module: khoá, IV, và mã hoá địa chỉ giao hàng của đơn khi lưu",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s07"],
    status: "published",
    pieces: [],
    goals: [
      "Phân biệt băm mật khẩu (một chiều, chỉ cần so) với mã hoá dữ liệu phải đọc lại (hai chiều, cần khoá), và nói rõ salt, IV, khoá mỗi thứ để làm gì.",
      "Dùng `KeyGenerators` sinh một khoá AES 256 bit, đưa nó vào order qua cấu hình (không nằm trong code), và cho order từ chối khởi động khi thiếu khoá.",
      "Mã hoá địa chỉ giao hàng của đơn bằng `AesGcmBytesEncryptor` khi lưu, chỉ giải mã cho người đặt khi đọc, và chứng minh hai lần mã hoá cùng địa chỉ cho hai bản mã khác nhau.",
      "Đo crypto module 7.1.2: factory nào của `Encryptors` đã deprecated, GCM khác CBC thế nào khi bản mã bị sửa. Chẩn đoán `AEADBadTagException: Tag mismatch` khi khoá đổi.",
    ],
    skills: [
      { skill: "pro-hash-vs-encrypt", level: "Giải thích được" },
      { skill: "cfg-crypto-encryptors", level: "Viết được không tra" },
      { skill: "cfg-data-key-config", level: "Viết được không tra" },
      { skill: "dx-decrypt-tag-mismatch", level: "Làm được có tra" },
    ],
    uses: ["int-passwordencoder-contract", "cfg-multiple-config-classes", "dx-security-debug-log"],
    foundation: null,
    mindset: `**Mật khẩu thì băm, địa chỉ thì mã hoá.** s07 lưu mật khẩu bằng một hàm một chiều: không ai, kể cả order, lấy lại được \`54321\` từ \`{bcrypt}$2a$10$…\`. Chỉ cần so được, nên vậy là đủ. Địa chỉ giao hàng thì khác: kho cần đọc lại đúng chữ đó, nên phải mã hoá hai chiều bằng một *khoá*. Rủi ro dời sang khoá: ai có khoá và bản sao DB là đọc được hết. Ba thứ dễ lẫn:

- **Khoá**: bí mật, một giá trị cho cả bảng (256 bit ngẫu nhiên). Nằm ngoài code và ngoài DB.
- **IV**: 16 byte ngẫu nhiên *mỗi lần* mã hoá, không bí mật, lưu ngay đầu bản mã. Nhờ nó, cùng một địa chỉ hai lần cho hai bản mã khác nhau, và người đọc DB không biết hai đơn có cùng địa chỉ.
- **Salt** (của \`withPassword(password, salt)\`, \`Encryptors.text(password, salt)\` trong sách): chỉ cần khi khoá được *suy ra* từ một mật khẩu người nhớ được (PBKDF2, 600 000 vòng trong \`AesGcmBytesEncryptor\`). Salt phải là chuỗi **hex** (mã nguồn gọi \`Hex.decode(salt)\`), ví dụ từ \`KeyGenerators.string()\` (8 byte, 16 ký tự hex). Đo: \`AesGcmBytesEncryptor.withPassword("secret", "not-hex!")\` và \`Encryptors.text("secret", "salt")\` cùng ném \`IllegalArgumentException: Detected a Non-hex character at 1 or 2 position\`; salt \`"abc"\` ném \`Hex-encoded string must have an even number of characters\`. Có sẵn một khoá ngẫu nhiên 256 bit thì không cần mật khẩu, không cần salt: \`withSecretKey(...)\`.

Luồng trên order sau buổi này (đọc mã nguồn \`AesGcmBytesEncryptor\` 7.1.2, đối chiếu log SQL):

\`\`\`mermaid
sequenceDiagram
  participant C as curl (john)
  participant O as OrderController
  participant T as TextEncryptor (hex)
  participant G as AesGcmBytesEncryptor
  participant D as orders
  C->>O: POST /orders {"deliveryAddress":"12 Lê Lợi, Quận 1"}
  O->>T: encrypt("12 Lê Lợi, Quận 1")
  T->>G: encrypt(UTF-8 bytes)
  Note over G: iv = KeyGenerators.secureRandom(16).generateKey()<br/>AES/GCM/NoPadding, khoá app.data-key, tag 128 bit
  G-->>T: iv ‖ bản mã ‖ tag
  T-->>O: hex (32 byte thêm vào bản rõ)
  O->>D: INSERT … owner = 'john', delivery_address = '787cb187…'
  C->>O: GET /orders (john)
  O->>D: SELECT … owner, delivery_address
  O->>T: decrypt(hex) chỉ khi owner = người gọi
  Note over G: tag sai (khoá khác, dữ liệu bị sửa)<br/>→ IllegalStateException ← AEADBadTagException
  O-->>C: deliveryAddress bản rõ cho john, user khác không có trường này
\`\`\`

**Crypto module 7.1.2 khác sách ở chỗ nào.** Bốn factory sách dùng (\`Encryptors.standard\`, \`stronger\`, \`text\`, \`delux\`) đều mang \`@Deprecated\`; chỉ \`noOpText\` còn nguyên. Chúng dựng \`AesBytesEncryptor\` (cũng deprecated), lớp này suy khoá bằng PBKDF2WithHmacSHA1 với 1024 vòng. Thay thế là \`AesGcmBytesEncryptor\` và \`AesCbcBytesEncryptor\`, dựng bằng builder \`withSecretKey(key)\` hoặc \`withPassword(password, salt)\` (PBKDF2WithHmacSHA256, 600 000 vòng). \`TextEncryptor\` hex mà \`text\`/\`delux\` trả về là lớp \`HexEncodingTextEncryptor\` không public: muốn chuỗi thì tự hex hoá, khoảng mười dòng.

**Vì sao GCM chứ không CBC.** Cả hai đều giấu nội dung. Chỉ GCM phát hiện được bản mã bị sửa. Đo trong buổi: lật một bit của bản mã GCM thì giải mã ném \`IllegalStateException: Unable to invoke Cipher due to bad padding\` với cause \`AEADBadTagException\`. Lật bit thấp nhất của byte đầu IV ở CBC thì giải mã *không lỗi* và trả về \`02 Le Loi, Q1\` thay vì \`12 Le Loi, Q1\`. Kẻ sửa được DB đổi được số nhà mà không cần khoá.

**GCM bảo vệ đến đâu.** Tag của GCM chỉ phủ *bên trong một bản mã*: sửa bất kỳ byte nào của nó thì giải mã thất bại. Nó không biết bản mã thuộc dòng nào. \`AesGcmBytesEncryptor\` 7.1.2 không có tham số dữ liệu liên kết (AAD): mã nguồn chỉ có \`withSecretKey\`/\`withPassword\`, \`ivGenerator\`, \`encrypt(byte[])\`, \`decrypt(byte[])\`, không gọi \`Cipher.updateAAD\`. Đo trên order (test nháp, hai user alice và mallory): chép nguyên \`delivery_address\` của đơn alice sang đơn của mallory, \`GET /orders\` của mallory trả \`12 Lê Lợi, Quận 1 (của alice)\`. Đổi cột \`owner\` (bản rõ) của đơn alice thành mallory, mallory cũng đọc được địa chỉ đó. Muốn gắn bản mã với dòng thì cần AAD (id đơn, owner), mà builder này không có, nên phải dùng \`Cipher\` của JDK trực tiếp hoặc thêm một MAC trên (id, owner, bản mã). **Mô hình mối đe doạ của buổi này**: bảo vệ khi bản sao DB hoặc bản sao lưu bị *đọc* trộm, không bảo vệ trước người *ghi* được vào DB.

**Khoá đến từ đâu, trong lab và ngoài lab.** Lab: sinh một lần bằng \`KeyGenerators.secureRandom(32)\` (hoặc \`openssl rand -hex 32\`), đưa vào biến môi trường \`ORDER_DATA_KEY\`. \`application.yml\` có \`app.data-key: \${ORDER_DATA_KEY}\` *không có giá trị mặc định*, nên quên đặt thì order không khởi động. Test có khoá riêng trong \`src/test/resources/application.properties\`. Ngoài lab: khoá do kho bí mật của nền tảng cấp (secret manager, KMS) và được tiêm vào lúc chạy, không bao giờ nằm trong repo hay image. Khoá nên mang phiên bản để xoay được: giữ khoá cũ để đọc, mã hoá lại dần bằng khoá mới. Buổi này chỉ có một khoá và nói rõ giới hạn đó (drill 1).

**Giới hạn của buổi.** Chủ đơn được quyết định bằng một phép so \`owner\` trong controller; chương 11–12 dời việc này sang method security. \`GET /orders\` vẫn liệt kê mọi đơn như trước, chỉ ẩn địa chỉ của đơn không phải của bạn.`,
    bookDiff: [
      { book: "Mục 4.2.2: tạo encryptor bằng `Encryptors.standard(password, salt)` / `Encryptors.stronger(...)` (bytes) và `Encryptors.text(...)` / `Encryptors.delux(...)` (text).", now: "7.1.2: cả bốn phương thức mang `@Deprecated` (đo bằng reflection: `delux, standard, stronger, text`). Javadoc trỏ tới `AesCbcBytesEncryptor.withPassword(...)` / `AesGcmBytesEncryptor.withPassword(...)`, và có thêm `withSecretKey(SecretKey)`. Tài liệu 7.1 (Spring Security Crypto Module → Encryptors) chỉ còn trình bày hai builder này.", why: "Bốn factory cũ dựng `AesBytesEncryptor` (deprecated), lớp này suy khoá bằng PBKDF2WithHmacSHA1 1024 vòng (mã nguồn 7.1.2). Builder mới dùng PBKDF2WithHmacSHA256 600 000 vòng (đo `DEFAULT_PBKDF2_ITERATIONS` trong buổi), và cho dùng thẳng một khoá ngẫu nhiên." },
      { book: "Mục 4.2.2: `TextEncryptor` lấy từ `Encryptors.text(...)` hoặc `Encryptors.delux(...)`.", now: "Ngoài `Encryptors.noOpText()`, 7.1.2 không còn factory `TextEncryptor` nào chưa deprecated. Lớp hex mà `text`/`delux` trả về là `HexEncodingTextEncryptor`, package-private. order tự viết một `TextEncryptor` bọc `AesGcmBytesEncryptor` và hex hoá đầu ra.", why: "Tài liệu 7.1 cho `TextEncryptor` chỉ còn hướng dẫn mã hoá bytes rồi tự hex hoá để lưu. Đo trong buổi: `Encryptors.delux(...)` là `HexEncodingTextEncryptor` bọc `AesBytesEncryptor`." },
    ],
    refs: [
      { label: "Sách, chương 4 — mục 4.2 Spring Security Crypto module, 4.2.1 Key generator, 4.2.2 Encryptor; khung \"Encoding vs. encrypting vs. hashing\" cuối mục 4.1.4", href: "#/docs/springsec-04" },
      { label: "Spring Security 7.1 — Crypto Module: Encryptors (AesGcmBytesEncryptor, AesCbcBytesEncryptor)", href: "https://docs.spring.io/spring-security/reference/7.1/features/integrations/cryptography.html#spring-security-crypto-encryption" },
      { label: "Spring Security 7.1 — Crypto Module: Key Generators", href: "https://docs.spring.io/spring-security/reference/7.1/features/integrations/cryptography.html#spring-security-crypto-keygenerators" },
      { label: "Spring Security 7.1 — Crypto Module: TextEncryptor (không còn queryable text)", href: "https://docs.spring.io/spring-security/reference/7.1/features/integrations/cryptography.html#spring-security-crypto-encryption-text" },
    ],
    stateIn: "Đầu ra s07: bảng `orders (id, product_id, qty, created_at)` chưa biết ai đặt đơn; mật khẩu đã băm và băm lại được. `./labs/lab begin ssia s08` kiểm đầu vào bằng verify của s07 và chép test vào `order/src/test/java/lab/s08/`. Không gỡ test nào: bốn test gốc của order (`OrderTest`, `OrderCatalogDownTest`) gửi đơn **không có** địa chỉ và phải vẫn xanh. Tên cột, trường JSON, property và định dạng lưu ở t3–t4 là cố định, vì test của lab đọc thẳng DB và tự giải mã.",
    stateOut: "Đơn của order có `owner` (username người đặt) và `delivery_address` lưu dạng hex của IV ‖ bản mã ‖ tag AES-GCM. Khoá 256 bit đọc từ `app.data-key` = biến môi trường `ORDER_DATA_KEY`; thiếu hoặc sai thì order không khởi động. Người đặt thấy bản rõ trong `POST`/`GET /orders`, user khác không thấy. `answers/s08.env` mô tả crypto module 7.1.2.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin ssia s08`. Sinh một khoá AES 256 bit bằng crypto module, không viết code: `printf '%s\\n' 'System.out.println(new String(org.springframework.security.crypto.codec.Hex.encode(org.springframework.security.crypto.keygen.KeyGenerators.secureRandom(32).generateKey())))' | jshell -q --class-path ~/.m2/repository/org/springframework/security/spring-security-crypto/7.1.2/spring-security-crypto-7.1.2.jar 2>/dev/null | grep -Eo '[0-9a-f]{64}'`. Kết quả là 64 ký tự hex. Giữ nó trong biến môi trường của terminal (`export ORDER_DATA_KEY=…`), không ghi vào tệp nào trong repo. Chạy lại lệnh: khoá có đổi không? `openssl rand -hex 32` cho kết quả cùng dạng." },
      { id: "t2", kind: "dissect", text: "Viết một test nháp không cần Spring context (ví dụ `order/src/test/java/scratch/CryptoProbeTest.java`) và đo. Ghi kết quả vào `answers/s08.env`: `GCM_OVERHEAD_BYTES` (độ dài đầu ra của `AesGcmBytesEncryptor.withSecretKey(k).build().encrypt(b)` trừ độ dài `b`); `CBC_LENGTH_FOR_16` (độ dài đầu ra của `AesCbcBytesEncryptor` cho 16 byte); `DEPRECATED_FACTORIES` (các phương thức public static của `Encryptors` mang `@Deprecated`); `DELUX_CLASS` và `DELUX_DELEGATE` (simple name lớp của `Encryptors.delux(...)` và lớp `BytesEncryptor` trong trường `encryptor` của nó); `GCM_TAMPER_EXCEPTION`, `GCM_TAMPER_CAUSE` (lật bit thấp của byte cuối bản mã GCM rồi giải mã: lớp ngoại lệ và lớp của `getCause()`); `CBC_IV_FLIP_RESULT` (mã hoá `12 Le Loi, Q1` bằng `AesCbcBytesEncryptor`, lật bit thấp của byte đầu tiên, tức byte đầu của IV, rồi giải mã: chuỗi nhận được); `WITH_PASSWORD_ITERATIONS` (số vòng PBKDF2 của `AesGcmBytesEncryptor.withPassword`, đọc mã nguồn hoặc reflection). Verify đo lại từng giá trị bằng jar đang dùng. Đo xong, xoá lớp nháp hoặc gắn `@Disabled` để nó không chạy trong `mvn -q test`." },
      { id: "t3", text: "Lược đồ và khoá, với **đúng các tên này**: trong `schema.sql`, bảng `orders` thêm `owner VARCHAR(50)` và `delivery_address VARCHAR(1000)`. Trong `application.yml`, dưới `app:` thêm `data-key: ${ORDER_DATA_KEY}` không có giá trị mặc định. Tạo `order/src/test/resources/application.properties` với `app.data-key=<một khoá 64 hex chỉ dành cho test>`. Khai một bean (ví dụ `TextEncryptor orderDataEncryptor(@Value(\"${app.data-key}\") String key)`) dựng `AesGcmBytesEncryptor.withSecretKey(new SecretKeySpec(Hex.decode(key), \"AES\")).build()` và hex hoá đầu ra. Khoá không đúng 64 ký tự hex thì ném lỗi lúc khởi động, thông báo có chữ `app.data-key` hoặc `ORDER_DATA_KEY`. Thử `java -jar order/target/order.jar` không đặt biến môi trường: dòng `Caused by` cuối nói gì?" },
      { id: "t4", text: "`OrderController`: `POST /orders` nhận thêm trường tuỳ chọn `\"deliveryAddress\"`, lưu `owner` = tên user đang đăng nhập (`Principal`) và `delivery_address` = hex của **đầu ra `AesGcmBytesEncryptor`** (IV 16 byte ‖ bản mã ‖ tag), hoặc `NULL` khi không có địa chỉ. Phản hồi `201` và `GET /orders` có `deliveryAddress` bản rõ **chỉ** cho đơn mà `owner` là người gọi; đơn của người khác thì không có trường này (order đã cấu hình `default-property-inclusion: non_null`). Không đổi gì khác của `/orders`: test gốc vẫn tạo đơn không có địa chỉ." },
      { id: "t5", text: "Tuỳ chọn (~15 phút, drill 1 dựng lại đúng lần chạy này với H2 dạng tệp). Chạy thật. Terminal 1: `cd labs/ssia/work && mvn -q package -DskipTests && java -jar catalog/target/catalog.jar`. Terminal 2 (đã `export ORDER_DATA_KEY=…` từ t1): `cd labs/ssia/work && java -jar order/target/order.jar --logging.level.org.springframework.jdbc.core.StatementCreatorUtils=TRACE`. Lấy token CSRF như s06 (`curl -s -c jar -u john:12345 localhost:8082/csrf`), tạo hai đơn của john cùng địa chỉ `12 Lê Lợi, Quận 1`, rồi `curl -u john:12345 localhost:8082/orders` và `curl -u mary:67890 localhost:8082/orders`. Trong log TRACE, tham số thứ 4 của hai câu INSERT là gì, có giống nhau không, dài bao nhiêu ký tự?" },
      { id: "t6", text: "`./labs/lab verify ssia s08` đạt 8/8. Verify đặt `app.data-key` là một khoá ngẫu nhiên sinh lúc chấm, nên khoá viết cứng trong code sẽ trượt dòng \"giải mã được bằng khoá app.data-key\". `cd labs/ssia/work && mvn -q test` vẫn xanh." },
    ],
    hints: [
      "`Hex` của Spring nằm ở `org.springframework.security.crypto.codec.Hex` (`encode` trả `char[]`, `decode` nhận `CharSequence`). `java.util.HexFormat.of()` của JDK cũng được; verify đọc hex chữ thường hoặc chữ hoa đều được.",
      "Verify báo không giải mã được: kiểm ba thứ theo thứ tự. (1) Khoá có lấy từ `app.data-key` không, hay từ một hằng trong code. (2) Có lưu cả IV ở đầu không: `AesGcmBytesEncryptor.encrypt` đã tự ghép IV, đừng bỏ đi. (3) Có hex hoá đúng đầu ra hay lại Base64 hoặc hex của chuỗi.",
      "Verify báo hai bản mã giống nhau: bạn đang dùng một encryptor với IV cố định, ví dụ `new AesBytesEncryptor(password, salt)` hai tham số. Constructor này dùng CBC với IV toàn số 0 (`NULL_IV_GENERATOR` trong mã nguồn 7.1.2; đo: hai lần mã hoá cùng bản rõ cho cùng bản mã).",
      "`Principal` vào được tham số phương thức controller vì Spring MVC lấy nó bằng `HttpServletRequest.getUserPrincipal()` (`PrincipalMethodArgumentResolver` của spring-webmvc 7.0.10). Trong chain của order, request đã được `SecurityContextHolderAwareRequestFilter` bọc, nên phương thức đó trả `Authentication` hiện tại. `principal.getName()` là username, như `owner` cần.",
      "`S08KeyConfigTest` khởi động order thật trên cổng ngẫu nhiên với `--app.data-key=` (rỗng), `abcd`, và một chuỗi 64 ký tự không phải hex. Cả ba phải làm khởi động thất bại, còn một khoá hợp lệ thì phải khởi động được.",
    ],
    solution: `**1. Khoá**

\`\`\`bash
printf '%s\\n' 'System.out.println(new String(org.springframework.security.crypto.codec.Hex.encode(org.springframework.security.crypto.keygen.KeyGenerators.secureRandom(32).generateKey())))' \\
  | jshell -q --class-path ~/.m2/repository/org/springframework/security/spring-security-crypto/7.1.2/spring-security-crypto-7.1.2.jar 2>/dev/null | grep -Eo '[0-9a-f]{64}'
# c9e4fb494ea0e975d66b56da97ac1242b247790eba01a17e87f673c1b4cb758a   (mỗi lần một khoá khác)
\`\`\`

\`KeyGenerators.secureRandom(32)\` là \`SecureRandomBytesKeyGenerator\` trên \`SecureRandom\`, mỗi \`generateKey()\` cho 32 byte mới. Đừng nhầm với \`KeyGenerators.shared(16)\`: nó sinh một lần lúc dựng rồi trả lại đúng giá trị đó mãi.

**2. Mổ xẻ crypto module**

\`\`\`bash
cat > answers/s08.env <<'EOF'
GCM_OVERHEAD_BYTES=32
CBC_LENGTH_FOR_16=48
DEPRECATED_FACTORIES=delux,standard,stronger,text
DELUX_CLASS=HexEncodingTextEncryptor
DELUX_DELEGATE=AesBytesEncryptor
GCM_TAMPER_EXCEPTION=IllegalStateException
GCM_TAMPER_CAUSE=AEADBadTagException
CBC_IV_FLIP_RESULT=02 Le Loi, Q1
WITH_PASSWORD_ITERATIONS=600000
EOF
\`\`\`

32 = IV 16 byte + tag 16 byte; GCM không đệm. CBC với 16 byte bản rõ ra 48 = IV 16 + hai khối, vì PKCS#5 luôn thêm một khối đệm khi bản rõ đủ khối. Lật bit ở IV của CBC lật đúng bit đó của khối bản rõ đầu tiên (\`'1'\` 0x31 → \`'0'\` 0x30) mà không ai biết. Với GCM, mọi thay đổi *bên trong* bản mã làm tag sai, nhưng thay cả bản mã hợp lệ của dòng khác thì không (Tư duy). Ngoài phần chấm: \`KeyGenerators.string()\` sinh 8 byte và hex hoá thành 16 ký tự, đủ làm salt, không đủ làm khoá; \`Encryptors.text(...)\` là CBC (trường \`alg\`), \`delux\` là GCM.

**3. Lược đồ, cấu hình, bean**

\`\`\`sql
CREATE TABLE IF NOT EXISTS orders (
  id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL,
  qty        INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  owner            VARCHAR(50),
  delivery_address VARCHAR(1000)
);
\`\`\`

\`\`\`yaml
app:
  version: \${APP_VERSION:1.0}
  catalog-url: \${CATALOG_URL:http://localhost:8081}
  data-key: \${ORDER_DATA_KEY}     # không có mặc định: thiếu là không khởi động
\`\`\`

\`\`\`java
@Configuration
public class DataEncryptionConfig {
  @Bean
  TextEncryptor orderDataEncryptor(@Value("\${app.data-key}") String hexKey) {
    String k = hexKey == null ? "" : hexKey.strip();
    if (!k.matches("[0-9a-fA-F]{64}")) {
      throw new IllegalStateException("app.data-key (ORDER_DATA_KEY) phải là 64 ký tự hex = khoá AES 256 bit, đang có "
          + k.length() + " ký tự");
    }
    AesGcmBytesEncryptor aes = AesGcmBytesEncryptor.withSecretKey(new SecretKeySpec(Hex.decode(k), "AES")).build();
    return new HexTextEncryptor(aes);   // encrypt: hex(aes.encrypt(utf8)); decrypt: utf8(aes.decrypt(hex))
  }
}
\`\`\`

Đo khi khởi động \`java -jar order/target/order.jar\`:

\`\`\`text
# không đặt ORDER_DATA_KEY
Caused by: org.springframework.util.PlaceholderResolutionException: Could not resolve placeholder 'ORDER_DATA_KEY' in value "\${ORDER_DATA_KEY}" <-- "\${app.data-key}"
# ORDER_DATA_KEY=abcd
Caused by: java.lang.IllegalStateException: app.data-key (ORDER_DATA_KEY) phải là 64 ký tự hex = khoá AES 256 bit, đang có 4 ký tự
\`\`\`

**4. Controller**

\`\`\`java
public record NewOrder(long productId, int qty, String deliveryAddress) {
  @Override public String toString() {   // không để địa chỉ vào log DEBUG của Spring MVC
    return "NewOrder[productId=" + productId + ", qty=" + qty + ", deliveryAddress=" + mask(deliveryAddress) + "]";
  }
}
public record Order(long id, long productId, int qty, Instant createdAt, String deliveryAddress) {
  @Override public String toString() { /* như trên, deliveryAddress=*** */ … }
}

@PostMapping("/orders")
public ResponseEntity<?> create(@RequestBody NewOrder req, Principal principal) {
  // … kiểm qty, gọi catalog như cũ
  String encrypted = req.deliveryAddress() == null ? null : encryptor.encrypt(req.deliveryAddress());
  jdbc.sql("INSERT INTO orders (product_id, qty, owner, delivery_address) VALUES (?, ?, ?, ?)")
      .param(req.productId()).param(req.qty()).param(principal.getName()).param(encrypted)
      .update(keys, "id");
  // … đọc lại đơn vừa tạo bằng map(rs, principal.getName())
}

private Order map(ResultSet rs, String caller) throws SQLException {
  String stored = rs.getString("delivery_address");
  String address = stored != null && caller.equals(rs.getString("owner")) ? encryptor.decrypt(stored) : null;
  return new Order(rs.getLong("id"), rs.getLong("product_id"), rs.getInt("qty"),
      rs.getTimestamp("created_at").toInstant(), address);
}
\`\`\`

**5. Chạy thật** (đo trên order với khoá vừa sinh)

\`\`\`text
POST /orders (john) → 201 {"id":1,"productId":1,"qty":2,"createdAt":"…","deliveryAddress":"12 Lê Lợi, Quận 1"}
POST /orders (john) → 201 {"id":2,…,"deliveryAddress":"12 Lê Lợi, Quận 1"}
TRACE … column index 4, parameter value [787cb1874462cea66385c955316e9f076c4b43f9cf223505521d66df6eaa34befd37408192caf24d0c93bb1a5841eda9140cba3cf56c]
TRACE … column index 4, parameter value [d4c28e5f78f268d5bbd623635f9a8dd7d244d391e843fc17e05cd2622491589deca9e68c58d1f0640209b6a11540e4e45eac52b49be1]
GET /orders (john) → [{"id":1,…,"deliveryAddress":"12 Lê Lợi, Quận 1"},{"id":2,…,"deliveryAddress":"12 Lê Lợi, Quận 1"}]
GET /orders (mary) → [{"id":1,"productId":1,"qty":2,"createdAt":"…"},{"id":2,"productId":1,"qty":1,"createdAt":"…"}]
\`\`\`

Hai bản mã khác nhau, mỗi bản 108 ký tự hex = 54 byte = 22 byte UTF-8 của địa chỉ (chữ có dấu chiếm 2–3 byte) + 32. Bản lời giải: \`labs/ssia/sessions/s08/solution/\`.`,
    work: {
      patterns: [
        "Một cột chứa dữ liệu cá nhân (địa chỉ, số điện thoại, số tài khoản) phải được mã hoá khi lưu: `AesGcmBytesEncryptor.withSecretKey`, khoá từ cấu hình không có mặc định, lưu IV cùng bản mã, giải mã ở đúng một chỗ.",
        "Review một PR dùng `Encryptors.text(password, salt)` hoặc `new AesBytesEncryptor(password, salt)`: chỉ ra factory đã deprecated, chế độ CBC không xác thực, và constructor hai tham số dùng IV cố định.",
        "Yêu cầu \"tìm đơn theo địa chỉ\" trên cột đã mã hoá: bản mã ngẫu nhiên nên không `WHERE delivery_address = ?` được. Cần một cột chỉ mục riêng (ví dụ HMAC của giá trị đã chuẩn hoá), không quay lại IV cố định.",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Sự cố: order chạy hai instance trên DB thật. Sau khi deploy lại instance B, john gọi `GET /orders` lúc được lúc không: khi thì 200 có địa chỉ, khi thì 500; mary luôn 200. Tái hiện bằng H2 dạng tệp (`DB_URL=jdbc:h2:file:<một thư mục tạm>/shopdb java -jar order/target/order.jar`): chạy order với khoá A, tạo đơn có địa chỉ cho john, dừng, chạy lại với một khoá B mới sinh. Trong 6 phút, tìm bằng chứng và sửa.",
          timeLimitMin: 6,
          solution: "**Triệu chứng.** Với khoá B: `curl -i -u john:12345 localhost:8082/orders` → `HTTP/1.1 500`; `curl -u mary:67890 …` → `200` (mary không có đơn nào có địa chỉ, nên không có gì để giải mã).\n\n**Bằng chứng.** Log mặc định đã có ERROR:\n```text\nERROR … [dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] … threw exception [Request processing failed: java.lang.IllegalStateException: Unable to invoke Cipher due to bad padding] with root cause\njavax.crypto.AEADBadTagException: Tag mismatch\n\tat …CipherUtils.doFinal(CipherUtils.java:138)\n\tat …AesGcmBytesEncryptor.decrypt(AesGcmBytesEncryptor.java:123)\n\tat shop.order.crypto.HexTextEncryptor.decrypt(HexTextEncryptor.java:28)\n\tat shop.order.OrderController.map(OrderController.java:81)\n```\n\"bad padding\" là chữ chung của `CipherUtils` cho mọi `BadPaddingException`. Cause thật là `AEADBadTagException`: tag GCM không khớp, tức khoá khác khoá lúc ghi hoặc dữ liệu đã bị sửa.\n\n**Nguyên nhân.** Instance B được deploy với `ORDER_DATA_KEY` mới sinh, không phải khoá của A. Load balancer chia request cho hai instance, nên lúc 200 lúc 500.\n\n**Sửa.** Mọi instance phải đọc cùng một khoá từ cùng một nguồn bí mật (đo: chạy lại với khoá A → 200 có địa chỉ). Dữ liệu đã ghi bằng khoá B trong thời gian sự cố chỉ đọc được bằng khoá B, nên giữ cả hai và đánh dấu khoá cho từng bản ghi. Đó là lý do hệ thật lưu kèm id/phiên bản khoá, còn buổi này mới có một khoá.",
        },
        {
          text: "Đồng nghiệp đề xuất: \"bỏ cấu hình đi, lúc khởi động sinh khoá bằng `KeyGenerators.shared(32)` cho tiện, giống Spring Boot sinh mật khẩu cho user mặc định\". Trong 5 phút, dự đoán hậu quả từ mã nguồn `KeyGenerators` rồi kiểm bằng một test.",
          timeLimitMin: 5,
          solution: "Mã nguồn 7.1.2: `shared(keyLength)` là `new SharedKeyGenerator(secureRandom(keyLength).generateKey())`. Nó sinh 32 byte ngẫu nhiên *một lần lúc dựng*, rồi mọi `generateKey()` trả lại đúng mảng đó. Trong một lần chạy, khoá ổn định, nên mọi thứ có vẻ chạy. Nhưng mỗi lần khởi động lại, mỗi instance được một khoá mới, và dữ liệu đã lưu thành rác: đúng sự cố của drill 1, lần nào deploy cũng xảy ra.\n\nKiểm: trong một test, dựng hai `KeyGenerators.shared(32)` (tương đương hai lần khởi động). Mã hoá bằng khoá của cái thứ nhất, giải mã bằng khoá của cái thứ hai → `IllegalStateException` với cause `AEADBadTagException`. Cùng một generator thì `Arrays.equals(g.generateKey(), g.generateKey())` → `true`.\n\nSo với user mặc định của Boot (s01): mật khẩu sinh ra chỉ sống trong bộ nhớ, mất thì sinh lại, không làm hỏng dữ liệu nào. Khoá mã hoá thì sống lâu hơn mọi tiến trình, nên phải đến từ ngoài và thiếu là phải dừng. Order làm đúng như vậy với `${ORDER_DATA_KEY}` không có mặc định.",
        },
      ],
    },
    tips: [
      "Đừng log bản rõ hay khoá. `toString()` mặc định của record in mọi trường, và Spring MVC ở `logging.level.org.springframework.web=DEBUG` log thân request/response bằng `toString()`. Đo trên order trước khi sửa: `Read \"application/json;charset=UTF-8\" to [NewOrder[productId=1, qty=2, deliveryAddress=12 Lê Lợi, Quận 1]]` và `Writing [Order[…, deliveryAddress=12 Lê Lợi, Qu (truncated)...]`. Lời giải ghi đè `toString()` của `NewOrder` và `Order` để in `deliveryAddress=***`; sau đó cùng log chỉ còn `NewOrder[productId=1, qty=2, deliveryAddress=***]`. JSON trả về không đổi, vì Jackson đọc accessor chứ không dùng `toString()`.",
      "Log TRACE của `StatementCreatorUtils` trong t5 in tham số SQL, tức bản mã: an toàn với cột đã mã hoá, nhưng in luôn cả mật khẩu và mọi cột khác. Chỉ bật lúc học.",
      "IV không phải bí mật và không cần lưu riêng: `AesGcmBytesEncryptor` ghép nó vào đầu bản mã, `decrypt` tự tách ra. Cái phải giữ kín là khoá.",
      "`AesGcmBytesEncryptor.withPassword(password, salt)` chạy PBKDF2 600 000 vòng ngay lúc `build()`. Dựng một lần làm bean; đừng dựng lại cho mỗi request (javadoc 7.1.2 cũng dặn vậy).",
      "Javadoc của `withPassword` trong 7.1.2 ghi \"PBKDF2WithHmacSHA1\", nhưng mã nguồn và javadoc lớp ghi PBKDF2WithHmacSHA256. Khi tài liệu và mã khác nhau, tin mã của đúng phiên bản bạn chạy.",
      "Cột mã hoá dài hơn bản rõ: hex gấp đôi số byte, cộng 64 ký tự cho IV và tag. Địa chỉ 500 ký tự tiếng Việt (tới ~1 500 byte UTF-8) không vừa `VARCHAR(1000)`, nên tính độ dài trước khi chọn kiểu cột.",
    ],
    outcome: {
      md: `Địa chỉ giao hàng của order nằm trong DB dưới dạng bản mã AES-GCM. Khoá 256 bit đến từ cấu hình, không nằm trong code; người đặt đọc được bản rõ, người khác không. Bạn đo được crypto module 7.1.2 khác sách ở đâu và vì sao GCM chứ không CBC. Trên máy:

\`\`\`bash
./labs/lab verify ssia s08
\`\`\`

Verify đặt \`app.data-key\` là một khoá ngẫu nhiên sinh lúc chấm và tạo đơn qua MockMvc bằng hai user ngẫu nhiên. Nó đọc thẳng cột \`orders.delivery_address\` để chắc đó không phải bản rõ (kể cả dạng hex, Base64), tự giải mã bằng khoá đó, so hai bản mã của cùng một địa chỉ, khởi động order với khoá thiếu hoặc sai, và đo crypto module để so với \`answers/s08.env\`.`,
      verifyOutput: "lab: kiểm s08\n  ✓ người đặt đọc được đúng địa chỉ (POST và GET /orders), user khác không thấy\n  ✓ cột orders.delivery_address không chứa bản rõ (kể cả dạng hex, Base64)\n  ✓ cột orders.delivery_address giải mã được bằng khoá app.data-key (AES-GCM)\n  ✓ cùng một địa chỉ mã hoá hai lần → hai bản mã khác nhau\n  ✓ app.data-key thiếu hoặc sai → order không khởi động, lỗi nói rõ\n  ✓ answers/s08.env: GCM_OVERHEAD_BYTES, CBC_LENGTH_FOR_16, WITH_PASSWORD_ITERATIONS\n  ✓ answers/s08.env: DEPRECATED_FACTORIES, DELUX_CLASS, DELUX_DELEGATE\n  ✓ answers/s08.env: GCM_TAMPER_EXCEPTION, GCM_TAMPER_CAUSE, CBC_IV_FLIP_RESULT\n  → 8/8 đạt",
      projectDelta: "Đơn hàng có `owner` và `delivery_address` mã hoá AES-GCM; khoá từ biến môi trường `ORDER_DATA_KEY`. Chương 11–12 thay phép so `owner` trong controller bằng method security.",
    },
    review: [
      { q: "Vì sao mật khẩu thì băm còn địa chỉ thì mã hoá? Mỗi cách để lộ cái gì nếu mất DB?", a: "Mật khẩu chỉ cần so, nên dùng băm một chiều có salt và chậm. Mất DB thì kẻ tấn công phải đoán từng mật khẩu. Địa chỉ phải đọc lại, nên mã hoá hai chiều bằng khoá. Mất DB mà không mất khoá thì chỉ có bản mã; mất cả khoá thì lộ hết. Vì vậy khoá phải nằm ở chỗ khác DB." },
      { q: "Salt, IV và khoá: cái nào bí mật, cái nào đổi mỗi lần, cái nào order cần?", a: "Khoá bí mật, cố định cho cả cột (order đọc từ `app.data-key`). IV không bí mật, ngẫu nhiên mỗi lần mã hoá, lưu ở đầu bản mã. Salt chỉ dùng khi suy khoá từ một mật khẩu (`withPassword`). Order có sẵn khoá ngẫu nhiên nên không cần salt." },
      { q: "Trong 7.1.2, cái gì thay `Encryptors.stronger(password, salt)`, và khác ở đâu?", a: "`AesGcmBytesEncryptor.withPassword(password, salt).build()`, hoặc `withSecretKey(key)` nếu đã có khoá. Cả hai đều AES-256-GCM, IV 16 byte. Bản cũ suy khoá bằng PBKDF2WithHmacSHA1 1024 vòng; bản mới dùng PBKDF2WithHmacSHA256 600 000 vòng, và có thêm đường dùng thẳng khoá." },
      { q: "Lật một bit của bản mã: GCM và CBC phản ứng thế nào?", a: "GCM: `decrypt` ném `IllegalStateException` (\"Unable to invoke Cipher due to bad padding\") với cause `AEADBadTagException`: sửa bên trong một bản mã không lọt qua. Nhưng GCM của `AesGcmBytesEncryptor` không có AAD, nên chép nguyên một bản mã hợp lệ sang dòng khác, hoặc sửa cột `owner` bản rõ, vẫn giải mã được (đo trên order). CBC: lật bit ở IV thì giải mã thành công và bit tương ứng của khối đầu bị lật (`12 Le Loi, Q1` → `02 Le Loi, Q1`), không ai biết." },
      { q: "Sau một lần deploy, `GET /orders` của một user trả 500 với `AEADBadTagException: Tag mismatch`. Nghĩ tới gì trước, và vì sao user khác vẫn 200?", a: "Khoá lúc đọc khác khoá lúc ghi (instance mới, biến môi trường sai), hoặc dữ liệu bị sửa. User khác không có đơn nào cần giải mã, vì order chỉ giải mã đơn của chính người gọi. Kiểm mọi instance cùng đọc một khoá; giữ khoá cũ để đọc dữ liệu đã ghi bằng nó." },
    ],
  },
];
