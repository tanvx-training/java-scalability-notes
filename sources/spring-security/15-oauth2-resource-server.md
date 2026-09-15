# 15. Hiện thực một OAuth 2 resource server

> Bản dịch tiếng Việt của chương 15 — *Spring Security in Action, Second Edition* (Laurentiu Spilca, Manning).

**Nội dung chương này bao gồm:**

- Hiện thực một Spring Security OAuth 2 resource server
- Sử dụng JWT token với claim tùy chỉnh
- Cấu hình introspection cho opaque token hoặc revocation (thu hồi)
- Hiện thực những tình huống phức tạp hơn và multitenancy (đa thuê bao)

Chương này bàn về việc bảo vệ một ứng dụng backend trong một hệ thống OAuth 2. Thứ mà chúng ta gọi là **resource server** trong thuật ngữ OAuth 2 đơn giản là một backend service. Trong khi ở chương 14 bạn đã học cách hiện thực trách nhiệm authorization server dùng Spring Security, giờ là lúc bàn về cách sử dụng token mà authorization server sinh ra.

Trong các tình huống thực tế, bạn có thể hiện thực hoặc không hiện thực một authorization server tùy chỉnh như chúng ta đã làm ở chương 14. Tổ chức của bạn có thể dùng một hiện thực của bên thứ ba thay vì tạo phần mềm tùy chỉnh. Bạn có thể tìm thấy nhiều lựa chọn thay thế ngoài kia, từ những giải pháp mã nguồn mở như Keycloak tới các sản phẩm doanh nghiệp như Okta, Cognito, hay Azure AD. Một ví dụ với Keycloak có ở chương 18 của ấn bản đầu tiên cuốn sách.

Dù bạn có lựa chọn cấu hình một authorization server mà không cần tự hiện thực, bạn vẫn sẽ phải hiện thực authentication (xác thực) và authorization (phân quyền) trên backend của mình một cách đúng đắn. Vì lý do đó, tôi nghĩ chương này rất thiết yếu; những kỹ năng bạn học được khi đọc nó có xác suất cao sẽ giúp ích cho công việc của bạn. Hình 15.1 nhắc bạn về các actor OAuth 2 và chúng ta đang ở đâu trong kế hoạch học tập cho phần sách này.

![Hình 15.1](images/ch15/ch15-fig01.png)

**Hình 15.1** Trong OAuth 2, backend của app được gọi là resource server vì nó bảo vệ tài nguyên của user và client (dữ liệu và những hành động có thể thực hiện trên dữ liệu).

Chúng ta sẽ bắt đầu chương này ở mục 15.1 bằng việc bàn về cấu hình resource server cho JSON Web Token (JWT). Ngày nay bạn sẽ thường thấy JWT được dùng với hệ thống OAuth 2; đó là lý do chúng ta cũng bắt đầu với chúng. Ở mục 15.2, chúng ta bàn về việc tùy chỉnh JWT và dùng các giá trị tùy chỉnh trong body hoặc header claim.

Ở mục 15.3, chúng ta bàn về việc cấu hình resource server để dùng introspection cho việc kiểm chứng token. Tiến trình introspection hữu ích khi dùng opaque token hoặc khi bạn muốn hệ thống của mình có thể thu hồi token trước ngày hết hạn của chúng.

Chúng ta sẽ kết thúc chương bằng việc bàn về những trường hợp cấu hình nâng cao hơn như multitenancy ở mục 15.4.

---

## 15.1 Cấu hình việc kiểm chứng JWT

Trong mục này, chúng ta bàn về việc cấu hình một resource server để kiểm chứng và dùng JWT — vốn là những non-opaque token (chúng chứa dữ liệu mà resource server dùng cho authorization). Để dùng JWT, resource server sẽ cần chứng minh chúng là xác thực, nghĩa là authorization server được mong đợi quả thực đã cấp phát chúng như một bằng chứng authentication của một user và/hoặc một client. Thứ hai, resource server sẽ cần đọc dữ liệu trong token và dùng nó để hiện thực các quy tắc authorization.

Chúng ta sẽ học cách cấu hình một resource server bằng cách đưa nó vào thực hành, tức là hiện thực một cái và cấu hình nó từ đầu. Chúng ta sẽ bắt đầu bằng cách tạo một project Spring Boot mới và thêm những dependency cần thiết. Rồi chúng ta sẽ hiện thực một endpoint demo (một tài nguyên để dùng cho mục đích test) và làm việc với cấu hình cho authentication và authorization. Đây là các bước chúng ta sẽ theo:

1. Thêm các dependency cần thiết vào project (trong file *pom.xml* vì chúng ta dùng Maven).
2. Khai báo một endpoint giả để chúng ta dùng test hiện thực của mình.
3. Hiện thực authentication cho JWT bằng cách cấu hình service với public key set URI.
4. Hiện thực các quy tắc authorization.
5. Test hiện thực bằng cách:
   a. Sinh một token với authorization server.
   b. Dùng token để gọi endpoint giả chúng ta đã tạo ở bước 2.

Listing sau đây trình bày những dependency cần thiết. Ngoài các dependency web và Spring Security, chúng ta cũng sẽ thêm resource server starter.

**Listing 15.1 Các dependency để hiện thực một resource server**

```xml
<dependency>                                    <!-- ① -->
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

① Resource server starter cung cấp những dependency cần thiết để hiện thực một app như một OAuth 2 resource server.

Khi đã có các dependency, chúng ta tạo một endpoint giả mà chúng ta sẽ dùng để test hiện thực ở cuối. Listing sau đây trình bày một controller đơn giản expose một endpoint tại path `/demo`.

**Listing 15.2 Khai báo một endpoint đơn giản cho mục đích test**

```java
@RestController
public class DemoController {

  @GetMapping("/demo")         // ①
  public String demo() {
    return "Demo";
  }
}
```

① Định nghĩa endpoint giả mà chúng ta cần để test cấu hình của mình sau khi hoàn thành hiện thực.

Với ví dụ này, bạn cần dùng một authorization server. Bạn có thể dùng cái chúng ta đã tạo ở chương 14 trong project `ssia-ch14-ex1`.

Vì chúng ta muốn khởi động cả authorization server lẫn resource server đồng thời trên cùng một hệ thống, chúng ta sẽ cần cấu hình những cổng khác nhau cho chúng. Vì authorization server có cổng mặc định 8080, chúng ta có thể đổi cổng của resource server sang một cổng khác. Tôi đổi nó thành 9090, nhưng bạn có thể dùng bất kỳ cổng nào rảnh trên hệ thống của mình. Đoạn code kế tiếp cho thấy property cần thêm vào file *application.properties* của bạn để đổi cổng:

```properties
server.port=9090
```

Khởi động cả authorization server trong project `ssia-ch14-ex1` lẫn ứng dụng hiện tại. Bạn có thể tìm thấy ví dụ này trong project `ssia-ch15-ex1` cùng các project mà sách cung cấp.

Hãy nhớ từ chương 14 rằng một OpenID Connect authorization server expose một URL mà bạn có thể dùng để lấy cấu hình của nó (bao gồm URL cho authorization, token, public key set, và những cái khác). Đoạn code kế tiếp trình bày cái được gọi là well-known URL:

```
http://localhost:8080/.well-known/openid-configuration
```

Bạn cần liên kết này để lấy thông tin về URL mà authorization server expose nhằm cung cấp public key set mà resource server có thể dùng để kiểm chứng token. Resource server cần gọi endpoint này và lấy tập public key. Rồi resource server dùng một trong những khóa này để kiểm chứng chữ ký của access token (hình 15.2).

![Hình 15.2](images/ch15/ch15-fig02.png)

**Hình 15.2** Resource server truy xuất một tập public key từ authorization server thông qua một endpoint được authorization server cung cấp. Resource server sau đó dùng những khóa này để kiểm chứng chữ ký của access token.

Listing 15.3 nhắc bạn về response bạn nhận được khi gọi well-known configuration endpoint mà authorization server expose. Như bạn có thể quan sát, public key set URI nằm trong số các dữ liệu được cung cấp. Public key set URI là thứ chúng ta cần cấu hình trong resource server để nó có thể kiểm chứng JWT.

**Listing 15.3 Response của well-known OpenID configuration, chứa key set URI**

```json
{
    "issuer": "http://localhost:8080",
    "authorization_endpoint": "http://localhost:8080/oauth2/authorize",
    "device_authorization_endpoint":
      "http://localhost:8080/oauth2/device_authorization",
    "token_endpoint": "http://localhost:8080/oauth2/token",
    …
    "jwks_uri": "http://localhost:8080/oauth2/jwks",
    …
}
```

Key set endpoint (`jwks_uri`) cung cấp phần public của các cặp khóa bất đối xứng được cấu hình ở phía authorization server. Authorization server dùng phần private để ký token. Resource server có thể dùng phần public để kiểm chứng chúng.

Để cấu hình public key set URI, trước hết chúng ta sẽ khai báo nó trong file *application.properties* của project. Configuration class có thể inject nó vào một field thuộc tính rồi dùng nó để cấu hình authentication cho resource server:

```properties
keySetURI=http://localhost:8080/oauth2/jwks
```

Listing 15.4 cho thấy configuration class inject giá trị public key set URI vào một thuộc tính. Configuration class cũng định nghĩa một bean kiểu `SecurityFilterChain`. Ứng dụng sẽ dùng bean `SecurityFilterChain` để cấu hình authentication, tương tự những gì chúng ta đã làm ở các chương trước của cuốn sách.

**Listing 15.4 Inject giá trị property vào configuration class**

```java
@Configuration
public class ProjectConfig {

  @Value("${keySetURI}")          // ①
  private String keySetUri;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    return http.build();
  }
}
```

① Inject giá trị key set URI vào một thuộc tính của configuration class. Bạn sẽ cần nó cho cấu hình filter chain.

Để cấu hình authentication, chúng ta sẽ dùng phương thức `oauth2ResourceServer()` của object `HttpSecurity`. Phương thức này tương tự `httpBasic()` và `formLogin()`, những cái chúng ta đã dùng ở phần hai và ba của cuốn sách.

Tương tự `httpBasic()` và `formLogin()`, bạn cần cung cấp một hiện thực của interface `Customizer` để cấu hình authentication. Ở listing 15.5, bạn có thể quan sát cách tôi dùng phương thức `jwt()` của object `Customizer` để cấu hình JWT authentication. Rồi tôi dùng một `Customizer` trên phương thức `jwt()` để cấu hình public key set URI (dùng phương thức `jwkSetUri()`).

**Listing 15.5 Cấu hình authentication với JWT**

```java
@Configuration
public class ProjectConfig {

  @Value("${keySetURI}")
  private String keySetUri;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    http.oauth2ResourceServer(             // ①
      c -> c.jwt(                          // ②
         j -> j.jwkSetUri(keySetUri)       // ③
      )
    );

    return http.build();
  }
}
```

① Cấu hình app như một OAuth 2 resource server.

② Cấu hình resource server dùng JWT cho authentication.

③ Cấu hình public key set URL mà resource server sẽ dùng để kiểm chứng token.

Hãy nhớ làm cho các endpoint yêu cầu authentication. Mặc định, các endpoint không được bảo vệ, nên để test authentication, trước hết bạn cần đảm bảo endpoint `/demo` của mình yêu cầu authentication. Đoạn code sau đây cấu hình các quy tắc authorization của app. Với ví dụ này, chúng ta có thể cấu hình tất cả endpoint đều yêu cầu authentication:

```java
http.authorizeHttpRequests(
    c -> c.anyRequest().authenticated()
);
```

Listing sau đây trình bày nội dung đầy đủ của configuration class.

**Listing 15.6 Configuration class đầy đủ**

```java
@Configuration
public class ProjectConfig {

  @Value("${keySetURI}")
  private String keySetUri;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    http.oauth2ResourceServer(
      c -> c.jwt(
         j -> j.jwkSetUri(keySetUri)
      )
    );

    http.authorizeHttpRequests(
      c -> c.anyRequest().authenticated()
    );

    return http.build();
  }
}
```

Giờ bạn nên khởi động ứng dụng resource server bạn vừa tạo. Hãy đảm bảo authorization server của bạn vẫn đang chạy. Bạn sẽ cần dùng những kỹ năng đã học ở chương 14 để sinh một access token. Hãy nhắc lại các bước cho authorization code grant type (nhưng hãy nhớ bạn có thể lấy token bằng bất kỳ grant type nào khác — việc bạn lấy access token thế nào không liên quan tới resource server miễn là bạn có một cái).

Các bước bạn cần theo với authorization code grant type là (hình 15.3):

1. Chuyển hướng user tới đăng nhập ở endpoint `/authorize` của authorization server.
2. Dùng credential của user để authentication. Authorization server sẽ chuyển hướng bạn tới redirect URI và cung cấp authorization code.
3. Lấy authorization code được cung cấp sau khi chuyển hướng, và dùng endpoint `/token` để yêu cầu một access token mới.

![Hình 15.3](images/ch15/ch15-fig03.png)

**Hình 15.3** Authorization code grant type. Client chuyển hướng user tới trang đăng nhập của authorization server. Sau khi user authentication thành công, authorization server chuyển hướng trở lại client, cung cấp một authorization code. Client dùng authorization code để lấy một access token.

Đoạn code kế tiếp (ngay sau các gạch đầu dòng) cho thấy URL bạn có thể dùng trong trình duyệt để chuyển hướng tới endpoint `/authorize` của authorization server. Hãy nhớ bạn cần cung cấp một vài tham số, và giá trị của chúng phải tuân thủ những gì bạn đã cấu hình trong authorization server. Các tham số bạn phải gửi là:

- `response_type` — Dùng giá trị `"code"` nếu bạn muốn dùng authorization code grant type.
- `client_id` — Client ID.
- `scope` — Scope bạn muốn truy cập. Nó có thể là bất kỳ scope nào được cấu hình trong authorization server.
- `redirect_uri` — URI mà authorization server chuyển hướng client tới sau khi authentication thành công. Redirect URI nên là một trong những cái đã được cấu hình trong authorization server.
- `code_challenge` — Nếu dùng PKCE (proof key for code exchange), bạn cần cung cấp code challenge từ cặp code challenge và verifier.
- `code_challenge_method` — Nếu dùng PKCE, bạn phải chỉ định hàm hash bạn đã dùng để mã hóa code verifier (ví dụ, SHA-256):

```
http://localhost:8080/oauth2/authorize?
response_type=code&
client_id=client&
scope=openid&
redirect_uri=https://www.manning.com/authorized&
code_challenge=<challenge>&
code_challenge_method=S256
```

> **Ghi chú của người dịch:** URL authorization ở trên bị PDF gốc cắt cụt ở `&scope=`. Phần còn lại đã được khôi phục theo danh sách tham số mà đoạn văn ngay trên mô tả và theo ví dụ tương ứng ở chương 14.

> **NOTE** Hãy nhớ rằng bạn phải dán authorization URL vào thanh địa chỉ của trình duyệt để gửi request.

Đăng nhập bằng credential user hợp lệ đã cấu hình trong authorization server, rồi chờ được chuyển hướng tới redirect URI được yêu cầu. Authorization server cung cấp authorization code mà bạn phải dùng trong request tới endpoint `/token`.

Đoạn code kế tiếp cho thấy một ví dụ về lệnh cURL gửi request tới endpoint `/token` để lấy một access token. Lưu ý rằng tôi đã cắt bớt giá trị authorization code để vừa trang:

```bash
curl -X POST 'http://localhost:8080/oauth2/token? \
client_id=client& \
redirect_uri=https://www.manning.com/authorized& \
grant_type=authorization_code& \
code=IhKRpq7GJ7P5VQI_...& \
code_verifier=qPsH306-ZDDaOE8DFzVn05TkN3ZZoVmI_6x4LsVglQI' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Đoạn code sau đây trình bày một response body cho request `/token`. Tôi cũng đã cắt bớt giá trị token trong đoạn code:

```json
{
    "access_token": "eyJraWQiOiI2Zjk5ZmE3MC…",
    "scope": "openid",
    "id_token": "eyJraWQiOiI2Zjk5ZmE3MC0xNTQ2LTRkMjM…",
    "token_type": "Bearer",
    "expires_in": 299
}
```

Giờ bạn có thể dùng access token khi gọi bất kỳ endpoint nào yêu cầu authentication. Đoạn code sau đây cho thấy một lệnh cURL để gửi request tới endpoint `/demo`. Hãy quan sát rằng access token phải được gửi trong header `Authorization` dùng prefix `Bearer` (hình 15.4). Prefix `Bearer` ngụ ý rằng người có giá trị access token có thể dùng nó theo cùng cách như bất kỳ bên nào khác có nó.

![Hình 15.4](images/ch15/ch15-fig04.png)

**Hình 15.4** Phép so sánh với tiểu thuyết *Chúa tể những chiếc nhẫn* của J.R.R. Tolkien. Access token là một tài nguyên quý giá. Nó cho phép truy cập nhiều tài nguyên cho bất kỳ ai sở hữu nó.

Đoạn code sau đây cho thấy lệnh cURL bạn có thể dùng để gửi request tới endpoint `/demo` dùng access token từ authorization server:

```bash
curl 'http://localhost:9090/demo' \
--header 'Authorization: Bearer eyJraW…'
```

---

## 15.2 Sử dụng JWT được tùy chỉnh

Nhu cầu của các hệ thống khác nhau, kể cả về authentication và authorization. Thường xảy ra chuyện bạn cần truyền những giá trị tùy chỉnh giữa authorization server và resource server thông qua access token. Resource server có thể dùng những giá trị như vậy để áp dụng nhiều quy tắc authorization khác nhau.

Trong mục này, chúng ta sẽ hiện thực một ví dụ mà authorization server và resource server dùng các claim tùy chỉnh trong access token. Authorization server tùy chỉnh JWT bằng cách thêm một claim tên là `"priority"` vào JWT. Resource server đọc claim `"priority"` và thêm giá trị của nó vào instance authentication trong security context. Từ đó, resource server có thể dùng nó khi hiện thực bất kỳ quy tắc authorization nào.

Chúng ta sẽ theo các bước sau:

1. Thay đổi authorization server để thêm claim tùy chỉnh vào access token.
2. Thay đổi resource server để đọc claim tùy chỉnh và lưu nó trong security context.
3. Hiện thực một quy tắc authorization dùng claim tùy chỉnh.

Nhưng trước hết, việc trước! Chúng ta cần thêm một giá trị tùy chỉnh vào body của access token trong class `SecurityConfig`. Trong authorization server, bạn làm điều này bằng cách thêm một bean kiểu `OAuth2TokenCustomizer`. Đoạn code kế tiếp minh họa định nghĩa của một bean như vậy. Để đơn giản hóa mọi thứ và cho phép bạn tập trung vào ví dụ, tôi đã thêm một giá trị giả vào một field tôi đặt tên là `"priority"`. Trong các app thực tế, những field tùy chỉnh như vậy sẽ có mục đích, và bạn có thể phải viết logic nhất định để đặt giá trị của chúng:

```java
@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
  return context -> {
    JwtClaimsSet.Builder claims = context.getClaims();
    claims.claim("priority", "HIGH");
  };
}
```

Với thay đổi tối thiểu này, các access token giờ chứa một field `"priority"` tùy chỉnh. Đoạn code kế tiếp cho thấy một JWT access token tôi đã sinh ra ở định dạng encode Base64, và listing 15.7 cho thấy body đã giải mã, nơi bạn có thể quan sát field `"priority"`:

```
eyJraWQiOiI5ZTBjOTQ5Ny0zYmMyLTQ4Y2YtODU5MC04N2JmZjE2ZjczOTAiLCJhbGciOiJSUzI
1NiJ9.eyJzdWIiOiJiaWxsIiwiYXVkIjoiY2xpZW50IiwibmJmIjoxNjg3MjYzMzI5LCJzY29wZ
SI6WyJvcGVuaWQiXSwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwIiwiZXhwIjoxNjg3MjYz
NjI5LCJwcmlvcml0eSI6IkhJR0giLCJpYXQiOjE2ODcyNjMzMjl9.HrQECSO17tZD8HKXP0U7gm
dmea01vPgVypvcf3oR3uawiMdI_joQBsLY0zNWBIgktKn2w9rvgtjD2xmhWZgSxRsDW_GZofqOz…
```

Listing 15.7 cho thấy body đã giải mã của access token được trình bày trước đó. Hãy nhớ bạn có thể dễ dàng dùng công cụ trực tuyến jwt.io để lấy dạng đã giải mã của một JWT. Ngoài ra, bạn có thể giải mã Base64 riêng từng phần header hoặc body của access token bằng bất kỳ bộ giải mã Base64 nào khác. Listing kế tiếp minh họa rằng những thay đổi của chúng ta trên authorization server hoạt động đúng.

**Listing 15.7 Body của JWT access token tùy chỉnh sau khi giải mã Base64**

```json
{
  "sub": "bill",
  "aud": "client",
  "nbf": 1687263329,
  "scope": [
    "openid"
  ],
  "iss": "http://localhost:8080",
  "exp": 1687263629,
  "priority": "HIGH",
  "iat": 1687263329
}
```

`"priority"` là claim tùy chỉnh chúng ta đã thêm vào access token.

Ở bước thứ hai, chúng ta thực hiện các thay đổi trên resource server. Bạn có thể tiếp tục làm việc trên ví dụ đã dùng ở mục 15.1, nhưng để việc học của bạn dễ hơn, tôi đã tạo một project riêng cho ví dụ này. Bạn có thể tìm thấy hiện thực mà chúng ta bàn tiếp trong mục này ở project `ssia-ch15-ex2`.

Danh sách các bước chúng ta cần theo để resource server hiểu được các claim tùy chỉnh trong access token là:

1. Tạo một object authentication tùy chỉnh. Object này sẽ định nghĩa hình dạng mới, bao gồm dữ liệu tùy chỉnh.
2. Tạo một object JWT authentication converter. Object này sẽ định nghĩa logic để chuyển đổi JWT thành object authentication tùy chỉnh.
3. Cấu hình JWT authentication converter bạn tạo ở bước 2 để được cơ chế authentication sử dụng.
4. Thay đổi endpoint `/demo` để trả về object authentication từ security context.
5. Test endpoint, và kiểm tra rằng object authentication chứa field `"priority"` tùy chỉnh.

Listing 15.8 trình bày định nghĩa của object authentication. Object authentication nên là bất kỳ class nào trực tiếp hoặc gián tiếp kế thừa class `AbstractAuthenticationToken`. Vì chúng ta dùng JWT, sẽ thoải mái hơn khi kế thừa `JwtAuthenticationToken` cụ thể hơn. Bằng cách này, bạn sẽ trực tiếp mở rộng hình dạng thông thường của một object authentication như được thiết kế cho JWT access token.

Hãy quan sát rằng tùy chỉnh ở listing 15.8 thêm một field tên là `"priority"`. Field này sẽ giữ giá trị từ claim tùy chỉnh trong body của access token. Theo cách tương tự, bạn có thể thêm bất kỳ chi tiết tùy chỉnh nào khác mà app của bạn có thể cần cho mục đích authorization. Việc có những chi tiết này trực tiếp trong object authentication từ security context khiến cấu hình dễ viết bất kể chúng ta chọn áp dụng chúng ở mức endpoint (chương 7 và 8) hay mức method (chương 11 và 12).

**Listing 15.8 Định nghĩa một object authentication tùy chỉnh**

```java
public class CustomAuthentication
  extends JwtAuthenticationToken {      // ①

  private final String priority;        // ②

  public CustomAuthentication(
    Jwt jwt,
    Collection<? extends GrantedAuthority> authorities,
    String priority) {

    super(jwt, authorities);
    this.priority = priority;
  }

  public String getPriority() {
    return priority;
  }
}
```

① Tùy chỉnh object authentication bằng cách kế thừa class `JwtAuthenticationToken`.

② Thêm field tùy chỉnh "priority".

Bạn có một hình dạng tùy chỉnh của object authentication, và việc tiếp theo bạn cần làm là chỉ dẫn app của mình cách chuyển đổi JWT thành object tùy chỉnh này. Bạn có thể làm điều này bằng cách cấu hình một `Converter` cụ thể, như trình bày ở listing 15.9. Hãy quan sát hai generic type chúng ta dùng: `Jwt` và `CustomAuthentication`. Generic type đầu tiên, `Jwt`, là đầu vào cho converter, trong khi type thứ hai, `CustomAuthentication`, là đầu ra. Vậy converter này chuyển một object `Jwt` (vốn là một contract chuẩn trong Spring Security về cách JWT access token được đọc) thành type tùy chỉnh mà chúng ta đã hiện thực ở listing 15.8 (xem hình 15.5).

![Hình 15.5](images/ch15/ch15-fig05.png)

**Hình 15.5** Một converter tùy chỉnh hiện thực logic để đưa thông tin từ access token vào một hình dạng authentication tùy chỉnh.

**Listing 15.9 Chuyển đổi access token thành object authentication**

```java
@Component
public class JwtAuthenticationConverter
  implements Converter<Jwt, CustomAuthentication> {

  @Override
  public CustomAuthentication convert(Jwt source) {
    List<GrantedAuthority> authorities =
       List.of(() -> "read");

    String priority =                                      // ①
       String.valueOf(source.getClaims().get("priority"));

    return new CustomAuthentication(source,
                                    authorities,
                                    priority);             // ②
  }
}
```

① Lấy giá trị priority từ claim tùy chỉnh của token.

② Đặt giá trị priority vào object authentication.

Bạn cũng có thể quan sát ở listing 15.9 rằng tôi đã định nghĩa một authority giả. Trong một tình huống thực tế, bạn sẽ lấy chúng từ access token (xét tới việc chúng được quản lý ở mức authorization server), hoặc từ một database hay hệ thống bên thứ ba khác (xét tới việc chúng được quản lý từ góc độ nghiệp vụ). Trong trường hợp này, tôi đã đơn giản hóa ví dụ và thêm một authority `"read"` giả cho tất cả request. Nhưng điều quan trọng cần nhớ là đây cũng là nơi bạn sẽ xử lý các authority (thứ cũng nên kết thúc trong object authentication từ security context, vì chúng là những chi tiết thiết yếu cho các quy tắc authorization trong hầu hết trường hợp).

Listing kế tiếp cho thấy cách cấu hình converter tùy chỉnh. Trong trường hợp này, tôi dùng dependency injection để lấy bean converter từ Spring context. Rồi tôi dùng phương thức `jwtAuthenticationConverter()` của JWT authentication configurer.

**Listing 15.10 Cấu hình authentication converter tùy chỉnh**

```java
@Configuration
public class ProjectConfig {

  // Phần code được lược bỏ

  private final JwtAuthenticationConverter converter;       // ①

  // constructor được lược bỏ

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    http.oauth2ResourceServer(
       c -> c.jwt(
          j -> j.jwkSetUri(keySetUri)
                .jwtAuthenticationConverter(converter)      // ②
          )
    );

    http.authorizeHttpRequests(
      c -> c.anyRequest().authenticated()
    );

    return http.build();
  }
}
```

① Inject object converter vào một field của class.

② Cấu hình object converter bên trong cơ chế authentication.

Đó là tất cả cấu hình chúng ta cần hiện thực để dùng claim tùy chỉnh của access token. Hãy test hiện thực của mình và chứng minh rằng nó hoạt động như mong đợi. Đoạn code kế tiếp cho thấy những thay đổi tôi đã thực hiện với endpoint `/demo`. Tôi làm cho endpoint `/demo` trả về instance authentication từ security context. Vì Spring biết cách inject giá trị tự động vào một tham số kiểu `Authentication`, tôi chỉ cần thêm tham số này rồi làm cho action method của endpoint trả về nó nguyên trạng:

```java
@GetMapping("/demo")
public Authentication demo(Authentication a) {
  return a;
}
```

Nếu mọi thứ hoạt động như mong muốn, khi gửi một request tới endpoint `/demo`, bạn sẽ nhận được một response với body tương tự cái được trình bày ở listing sau đây. Hãy quan sát rằng thuộc tính `"priority"` tùy chỉnh xuất hiện đúng trong object authentication với giá trị `"HIGH"`.

**Listing 15.11 Response của endpoint /demo chứa field priority**

```json
{
  "authorities": [
    {
      "authority": "read"
    }
  ],
  "details": {
     "remoteAddress": "0:0:0:0:0:0:0:1",
     "sessionId": null
  },
  "authenticated": true,
    …
  "name": "bill",
  "priority": "HIGH"
}
```

Giá trị claim tùy chỉnh xuất hiện trong instance authentication.

---

## 15.3 Cấu hình kiểm chứng token thông qua introspection

Trong mục này, chúng ta bàn về việc dùng introspection cho việc kiểm chứng access token. Nếu app của bạn dùng opaque token, hoặc nếu bạn muốn một hệ thống mà bạn có thể thu hồi token ở mức authorization server, thì introspection là tiến trình bạn phải dùng để kiểm chứng token. Hình 15.6 sẽ nhắc bạn về tiến trình introspection, đã bàn chi tiết ở mục 14.4.

![Hình 15.6](images/ch15/ch15-fig06.png)

**Hình 15.6** Token introspection. Trong những tình huống mà resource server không thể phụ thuộc vào việc kiểm chứng access token dựa trên chữ ký (chẳng hạn khi cần thu hồi token), hoặc khi token không chứa thông tin chi tiết (như với opaque token), resource server buộc phải gửi truy vấn tới authorization server. Việc này được thực hiện để xác định tính hợp lệ của một token và thu thập thông tin bổ sung về nó.

Chúng ta sẽ hiện thực một resource server để minh họa việc dùng introspection. Để đạt mục tiêu, chúng ta phải theo các bước sau:

1. Đảm bảo authorization server nhận diện resource server như một client. Resource server cần client credential được đăng ký ở phía authorization server.
2. Cấu hình authentication ở phía resource server để dùng introspection.
3. Lấy một access token từ authorization server.
4. Dùng một endpoint demo để chứng minh cấu hình hoạt động theo cách chúng ta mong đợi với access token đã lấy ở bước 3.

Đoạn code kế tiếp cho bạn thấy một ví dụ về việc tạo một instance client, thứ chúng ta sẽ đăng ký ở phía authorization server. Client này biểu diễn resource server của chúng ta. Như bạn quan sát từ hình 15.6, resource server gửi request tới authorization server (để introspection), nên bằng cách này, nó cũng trở thành một client của authorization server.

Để gửi các request introspection, resource server cần client credential để authentication, tương tự bất kỳ client nào khác. Với ví dụ này, tôi sẽ thay đổi project `ssia-ch14-ex4` mà chúng ta đã tạo khi bàn về opaque token ở chương 14:

```java
RegisteredClient resourceServer =
   RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("resource_server")
            .clientSecret("resource_server_secret")
            .clientAuthenticationMethod(
               ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .authorizationGrantType(
               AuthorizationGrantType.CLIENT_CREDENTIALS)
            .build();
```

Hãy nhớ rằng password và dữ liệu cấu hình không bao giờ nên được hardcode như tôi đã làm ở đoạn code trên. Tôi đã đơn giản hóa những ví dụ này nhiều nhất có thể để bạn tập trung vào chủ đề đang bàn. Trong một app thực tế, bạn nên đặt các cấu hình trong file bên ngoài hiện thực và lưu bền những chi tiết bí mật (như credential) ở đâu đó một cách an toàn.

Listing sau đây cho thấy cách thêm cả hai instance chi tiết client (của client và của resource server) vào component `RegisteredClientRepository` của authorization server.

**Listing 15.12 Định nghĩa `RegisteredClientRepository`**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
  RegisteredClient registeredClient =                               // ①
    RegisteredClient.withId(UUID.randomUUID().toString())
      .clientId("client")
      .clientSecret("secret")
      .clientAuthenticationMethod(
         ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
      .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
      .tokenSettings(TokenSettings.builder()
          .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
          .accessTokenTimeToLive(Duration.ofHours(12))
          .build())
      .scope("CUSTOM")
      .build();

  RegisteredClient resourceServer =                                 // ②
    RegisteredClient.withId(UUID.randomUUID().toString())
      .clientId("resource_server")
      .clientSecret("resource_server_secret")
      .clientAuthenticationMethod(
         ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
      .authorizationGrantType(
         AuthorizationGrantType.CLIENT_CREDENTIALS)
      .build();

    return new InMemoryRegisteredClientRepository(
                    registeredClient,                               // ③
                    resourceServer);
  }
```

① Định nghĩa một instance chi tiết client cho app client.

② Định nghĩa một instance chi tiết client cho resource server (thứ cũng trở thành một client khi gọi introspection endpoint).

③ Thêm cả hai instance chi tiết client vào repository của authorization server.

Với những thay đổi ở listing 15.12, giờ chúng ta có một bộ credential mà resource server có thể dùng để gọi introspection endpoint mà authorization server expose. Chúng ta có thể bắt đầu hiện thực resource server. Bạn có thể tìm thấy ví dụ này trong project `ssia-ch15-ex3`. Listing 15.13 cho thấy cách, trong file properties, tôi đã cấu hình ba giá trị thiết yếu cần cho introspection:

- Introspection URI mà authorization server expose, cho phép resource server kiểm chứng token
- Client ID của resource server, cho phép resource server tự định danh khi gọi introspection endpoint
- Client secret của resource server, thứ resource server dùng cùng client ID của nó để authentication khi gửi request tới introspection endpoint

Cùng với những cái này, tôi cũng đổi cổng server thành 9090, khác với cổng của application server (8080), nhờ đó cho phép cả hai app chạy đồng thời.

**Listing 15.13 File application.properties của resource server**

```properties
server.port=9090                                 # ①
introspectionUri=http://localhost:8080/oauth2/introspect   # ②
resourceserver.clientID=resource_server          # ③
resourceserver.secret=resource_server_secret     # ④
```

① Đổi cổng của resource server để cho phép cả resource server lẫn authorization server chạy đồng thời.

② Cấu hình introspection URI dưới dạng một property.

③ Cấu hình client ID của resource server dưới dạng một property.

④ Cấu hình client secret của resource server dưới dạng một property.

Sau đó bạn có thể inject các giá trị trong file properties vào các field của configuration class và dùng chúng để thiết lập authentication. Listing sau đây cho thấy configuration class inject các giá trị từ file properties vào các field.

**Listing 15.14 Inject các giá trị vào field của configuration class**

```java
@Configuration
public class ProjectConfig {

  @Value("${introspectionUri}")              // ①
  private String introspectionUri;

  @Value("${resourceserver.clientID}")       // ①
  private String resourceServerClientID;

  @Value("${resourceserver.secret}")         // ①
  private String resourceServerSecret;

}
```

① Inject introspection URI, introspection client ID, và introspection secret từ file properties vào các field của configuration class.

Dùng introspection URI và credential để cấu hình authentication. Bạn cấu hình authentication tương tự cách chúng ta đã cấu hình cho JWT access token — dùng phương thức `oauth2ResourceServer()` của object `HttpSecurity`. Tuy nhiên, chúng ta gọi một phương thức cấu hình khác trên object customizer của `oauth2ResourceServer()`: `opaqueToken()`. Với phương thức `opaqueToken()`, chúng ta cấu hình introspection URI và credential. Listing sau đây trình bày thiết lập này.

**Listing 15.15 Cấu hình authentication của resource server cho opaque token**

```java
@Configuration
public class ProjectConfig {

  @Value("${introspectionUri}")
  private String introspectionUri;

  @Value("${resourceserver.clientID}")
  private String resourceServerClientID;

  @Value("${resourceserver.secret}")
  private String resourceServerSecret;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

     http.oauth2ResourceServer(
        c -> c.opaqueToken(                             // ①
          o -> o.introspectionUri(introspectionUri)     // ②
                .introspectionClientCredentials(        // ③
                    resourceServerClientID,
                    resourceServerSecret)
            )
     );

     return http.build();
  }
}
```

① Cấu hình authentication của resource server cho opaque token.

② Cấu hình introspection URI mà resource server nên dùng để kiểm chứng và lấy chi tiết về token.

③ Cấu hình credential mà resource server phải dùng để authentication khi gọi introspection URI của authorization server.

Hãy nhớ cũng thêm các cấu hình authorization. Đoạn code kế tiếp cho thấy cách chuẩn mà bạn đã học ở chương 7 và 8 để làm cho tất cả endpoint yêu cầu request phải authentication:

```java
http.authorizeHttpRequests(
  c -> c.anyRequest().authenticated()
);
```

Listing sau đây cho thấy nội dung đầy đủ của configuration class.

**Listing 15.16 Nội dung đầy đủ của configuration class**

```java
@Configuration
public class ProjectConfig {

  @Value("${introspectionUri}")
  private String introspectionUri;

  @Value("${resourceserver.clientID}")
  private String resourceServerClientID;

  @Value("${resourceserver.secret}")
  private String resourceServerSecret;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

     http.oauth2ResourceServer(
        c -> c.opaqueToken(
          o -> o.introspectionUri(introspectionUri)
                .introspectionClientCredentials(
                    resourceServerClientID,
                    resourceServerSecret)
            )
     );

     http.authorizeHttpRequests(               // ①
        c -> c.anyRequest().authenticated()
     );

     return http.build();
  }
}
```

① Thêm cấu hình authorization cho endpoint. Request tới bất kỳ endpoint nào cũng yêu cầu authentication.

Một endpoint `/demo` đơn giản như cái ở đoạn code kế tiếp là đủ để chúng ta test rằng authentication hoạt động đúng:

```java
@RestController
public class DemoController {

  @GetMapping("/demo")
  public String demo() {
    return "Demo";
  }
}
```

Giờ bạn có thể khởi động cả hai ứng dụng: authorization server và resource server. Cả hai nên chạy đồng thời. Đoạn code kế tiếp bao gồm lệnh cURL bạn có thể dùng để gửi request tới endpoint `/token`. Để đơn giản hóa ví dụ này, tôi dùng client credentials grant type, nhưng bạn có thể dùng bất kỳ grant type nào bạn đã học ở chương 14 để lấy access token. Hãy nhớ rằng cấu hình resource server là giống nhau bất kể bạn lấy access token thế nào:

```bash
curl -X POST 'http://localhost:8080/oauth2/token? \
client_id=client& \
grant_type=client_credentials' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Nếu request thành công, bạn sẽ nhận lại access token trong response. Response body trông như đoạn code kế tiếp. Tôi đã cắt bớt giá trị của token để nó vừa trang hơn:

```json
{
    "access_token": "2zLyYA8b6Q54-…",
    "token_type": "Bearer",
    "expires_in": 43199
}
```

Theo cùng cách như với JWT access token, khi gửi một request tới một endpoint được bảo vệ, hãy thêm token làm giá trị của header `"Authorization"`. Giá trị access token phải có prefix là chuỗi `"Bearer"`. Đoạn code kế tiếp cho thấy lệnh cURL bạn có thể dùng để gửi request tới endpoint `/demo`. Nếu mọi thứ hoạt động đúng, bạn sẽ nhận lại chuỗi `"Demo"` trong body với trạng thái response 200 OK:

```bash
curl 'http://localhost:9090/demo' \
--header 'Authorization: Bearer 2zLyYA8b6Q54-…'
```

---

## 15.4 Hiện thực hệ thống multitenant

Trong các app thực tế, mọi thứ không phải lúc nào cũng hoàn hảo. Đôi khi chúng ta ở trong tình huống phải điều chỉnh hiện thực của mình cho khớp với một trường hợp không chuẩn khi tích hợp với một bên thứ ba. Ngoài ra, đôi khi chúng ta cần hiện thực những backend dựa vào nhiều authorization server cho authentication và authorization (hệ thống multitenant — đa thuê bao). Chúng ta nên hiện thực cấu hình cho app của mình thế nào trong những trường hợp như vậy?

May mắn thay, Spring Security cung cấp sự linh hoạt để hiện thực bất kỳ tình huống nào. Trong mục này, chúng ta bàn về việc hiện thực cấu hình resource server cho những trường hợp phức tạp hơn, chẳng hạn hệ thống multitenant hoặc tương tác với những app không tuân theo chuẩn.

Hãy xem hình 15.7 để ôn lại thiết kế authentication của Spring Security mà chúng ta đã bàn chi tiết ở hai phần đầu của cuốn sách. Một filter chặn HTTP request. Trách nhiệm authentication sau đó được ủy quyền cho một authentication manager. Authentication manager tiếp tục dùng một authentication provider, thứ hiện thực logic authentication.

![Hình 15.7](images/ch15/ch15-fig07.png)

**Hình 15.7** Thiết kế class authentication. Trong thủ tục authentication, filter bắt lấy request và chuyển nó cho một component authentication manager. Manager này sau đó dùng một authentication provider thực thi logic authentication cần thiết. Sau khi authentication thành công, ứng dụng ghi lại chi tiết của principal đã authentication trong security context.

Tại sao việc nhớ thiết kế này lại quan trọng? Bởi với resource server, cũng như bất kỳ cách tiếp cận authentication nào khác, bạn cần thay đổi authentication provider nếu muốn tùy chỉnh cách authentication hoạt động.

Trong trường hợp một resource server, Spring Security cho phép bạn cắm vào cấu hình một component tên là **authentication manager resolver** (hình 15.8). Component này cho phép việc thực thi app quyết định gọi authentication manager nào. Bằng cách này, bạn có thể ủy quyền authentication cho bất kỳ authentication manager tùy chỉnh nào mà có thể dùng một authentication provider tùy chỉnh.

![Hình 15.8](images/ch15/ch15-fig08.png)

**Hình 15.8** Khi hiện thực một authentication manager resolver, bạn nói cho app của mình biết nên ủy quyền trách nhiệm authentication cho authentication manager nào.

Nếu bạn muốn app của mình dùng nhiều authorization server, tất cả đều dùng JWT, Spring Security thậm chí cung cấp sẵn một hiện thực authentication manager resolver (hình 15.9). Với trường hợp như vậy, bạn chỉ cần cắm vào hiện thực tùy chỉnh `JwtIssuerAuthenticationManagerResolver` mà Spring Security cung cấp.

![Hình 15.9](images/ch15/ch15-fig09.png)

**Hình 15.9** Hệ thống của bạn có thể cần dùng nhiều authorization server để authentication user và client.

Listing 15.17 cho thấy cách dùng phương thức `authenticationManagerResolver()` khi cấu hình authentication. Trong ví dụ này, bạn thấy tôi chỉ phải tạo một instance của class `JwtIssuerAuthenticationManagerResolver`, mà tôi đã cung cấp cho nó tất cả các địa chỉ issuer của các authorization server. Bạn có thể tìm thấy ví dụ này được hiện thực trong project `ssia-ch15-ex4`.

> **NOTE** Hãy nhớ đừng bao giờ viết URL (hoặc bất kỳ chi tiết cấu hình được nào tương tự) trực tiếp trong code. Chúng ta chỉ dùng cách tiếp cận này với các ví dụ để đơn giản hóa code và cho phép bạn tập trung vào những gì thiết yếu cần học. Bất cứ thứ gì có thể tùy chỉnh đều nên luôn được viết trong file cấu hình hoặc biến môi trường.

**Listing 15.17 Làm việc với hai authorization server dùng JWT access token**

```java
@Configuration
public class ProjectConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    http.oauth2ResourceServer(
      j -> j.authenticationManagerResolver(
               authenticationManagerResolver())
    );

    http.authorizeHttpRequests(
      c -> c.anyRequest().authenticated()
    );

    return http.build();
  }

  @Bean
  public AuthenticationManagerResolver<HttpServletRequest>
    authenticationManagerResolver() {

    var a = new JwtIssuerAuthenticationManagerResolver(
        "http://localhost:7070",
        "http://localhost:8080");

    return a;
  }
}
```

Với một cấu hình như cái được trình bày ở hình 15.10, resource server của bạn làm việc với hai authorization server chạy trên cổng 7070 và 8080.

Tuy nhiên, đôi khi mọi thứ phức tạp hơn. Spring Security không thể cung cấp mọi tùy chỉnh khả dĩ. Trong trường hợp như vậy, khi bạn cần tùy chỉnh khả năng của resource server sâu hơn nữa, bạn phải hiện thực authorization manager resolver tùy chỉnh của riêng mình.

Hãy xét tình huống sau: bạn cần resource server của mình làm việc với cả JWT lẫn opaque token từ hai authorization server khác nhau. Giả sử resource server của bạn phân biệt các request dựa trên giá trị của một tham số `"type"`. Nếu giá trị của tham số `"type"` là `"jwt"`, resource server phải authentication request với một authorization server dùng JWT access token; nếu không, nó dùng một authorization server với opaque access token.

![Hình 15.10](images/ch15/ch15-fig10.png)

**Hình 15.10** Sử dụng hai authorization server riêng biệt, mỗi cái xử lý một loại token khác nhau. Tùy vào một giá trị cụ thể trong HTTP request header mà client dùng, resource server quyết định dùng authorization server nào để kiểm chứng access token.

Listing 15.18 hiện thực tình huống này. Resource server dùng một authorization server khác nhau dựa trên giá trị của header `"type"` trong HTTP request. Để đạt được điều này, resource server dùng một authentication manager khác nhau dựa trên giá trị của header này.

**Listing 15.18 Dùng cả JWT lẫn opaque token**

```java
@Configuration
public class ProjectConfig {

  // Phần code được lược bỏ

  @Bean
  public AuthenticationManagerResolver<HttpServletRequest>
    authenticationManagerResolver(
        JwtDecoder jwtDecoder,
        OpaqueTokenIntrospector opaqueTokenIntrospector
    ) {

    AuthenticationManager jwtAuth = new ProviderManager(            // ①
      new JwtAuthenticationProvider(jwtDecoder)
    );

    AuthenticationManager opaqueAuth = new ProviderManager(         // ②
      new OpaqueTokenAuthenticationProvider(opaqueTokenIntrospector)
    );

    return (request) -> {                                           // ③
      if ("jwt".equals(request.getHeader("type"))) {
         return jwtAuth;
      } else {
         return opaqueAuth;
      }
    };
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder                                         // ④
            .withJwkSetUri("http://localhost:7070/oauth2/jwks")
            .build();
  }

  @Bean
  public OpaqueTokenIntrospector opaqueTokenIntrospector() {        // ⑤
    return new SpringOpaqueTokenIntrospector(
       "http://localhost:6060/oauth2/introspect",
       "client", "secret");
  }
}
```

① Định nghĩa một authentication manager cho authorization server quản lý JWT access token.

② Định nghĩa một authentication manager khác cho authorization server quản lý opaque token.

③ Định nghĩa logic authentication manager resolver tùy chỉnh để chọn một authentication manager dựa trên header "type" của HTTP request.

④ Cấu hình public key set URI cho authentication manager làm việc với authorization server quản lý JWT access token.

⑤ Cấu hình introspection URI và credential cho authentication manager làm việc với authorization server quản lý opaque token.

> **Ghi chú của người dịch:** Trong sách gốc, tên phương thức ở listing 15.18 bị in nhầm thành `jwt'Decoder()` (thừa một dấu nháy đơn). Tên đúng là `jwtDecoder()`, như được tham chiếu ở listing 15.19.

Listing sau đây trình bày phần còn lại của cấu hình, thứ cấu hình authorization manager resolver tùy chỉnh bằng tham số customizer của phương thức `authenticationManagerResolver()`.

**Listing 15.19 Cấu hình `AuthenticationManagerResolver`**

```java
@Configuration
public class ProjectConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {

    http.oauth2ResourceServer(
      j -> j.authenticationManagerResolver(         // ①
                authenticationManagerResolver(
                  jwtDecoder(),
                  opaqueTokenIntrospector()
                ))
    );

    http.authorizeHttpRequests(
      c -> c.anyRequest().authenticated()
    );

    return http.build();
  }

  // Phần code được lược bỏ
}
```

① Cấu hình authentication manager resolver tùy chỉnh.

Ngay cả trong ví dụ này, chúng ta vẫn dùng những hiện thực authentication provider do Spring Security cung cấp: `JwtAuthenticationProvider` và `OpaqueTokenAuthenticationProvider`. Trong trường hợp này, `JwtAuthenticationProvider` hiện thực logic authentication để làm việc với một authorization server chuẩn dùng JWT access token. `OpaqueTokenAuthenticationProvider` hiện thực logic authentication làm việc với opaque token. Nhưng bạn có thể có những trường hợp còn phức tạp hơn nữa trong các app thực tế.

Nếu bạn cần hiện thực thứ gì đó rất tùy chỉnh, chẳng hạn tích hợp với một hệ thống không tuân theo bất kỳ chuẩn nào, thì bạn thậm chí có thể hiện thực authentication provider tùy chỉnh của riêng mình.

---

## Tóm tắt

- Spring Security cung cấp hỗ trợ để hiện thực OAuth 2/OpenID Connect resource server. Để cấu hình authentication như một OAuth 2/OpenID Connect resource server, dùng phương thức `oauth2ResourceServer()` của object `HttpSecurity`.
- Nếu bạn muốn dùng JWT, bạn cần áp dụng cấu hình bằng phương thức `jwt()` của tham số customizer thuộc `oauth2ResourceServer()`.
- Bạn cũng có thể dùng introspection nếu hệ thống của bạn sử dụng opaque token hoặc nếu bạn muốn có thể thu hồi JWT ở phía authorization server. Trong trường hợp như vậy, bạn phải cấu hình authentication bằng phương thức `opaqueToken()` của tham số customizer thuộc `oauth2ResourceServer()`.
- Khi dùng JWT, bạn phải thiết lập public key set URI. Public key set URI là một URI được authorization server expose. Resource server gọi URI này để lấy phần public của các cặp khóa được cấu hình ở phía authorization server. Authorization server dùng phần private để ký access token, trong khi resource server cần phần public để kiểm chứng chúng.
- Khi dùng introspection, bạn cần cấu hình introspection URI. Resource server gửi request tới introspection URI để hỏi authorization server xem một token có hợp lệ hay không và để lấy thêm chi tiết về nó. Khi gọi introspection URI, resource server hoạt động như một client của authorization server, nên nó cần client credential của riêng mình để authentication.
- Spring Security cung cấp cơ hội tùy chỉnh logic authentication bằng một component authentication manager resolver. Bạn định nghĩa và cấu hình một component tùy chỉnh như vậy khi phải hiện thực một trường hợp cụ thể hơn, chẳng hạn multitenancy hoặc điều chỉnh app của bạn cho một hiện thực không chuẩn.
