# Chương 15: Triển khai một máy chủ tài nguyên OAuth 2

> ⚠️ **Ghi chú về nguồn:** File PDF gốc bị thiếu phần mở đầu của Chương 15 và toàn bộ mục 15.1 (Cấu hình xác thực JWT); chỉ còn lại một đoạn cuối của mục 15.1 rồi tiếp nối từ mục 15.2. Nội dung dưới đây được giữ nguyên như trong nguồn.

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

Đoạn mã dưới đây minh họa lệnh cURL mà bạn có thể dùng để gửi yêu cầu đến điểm cuối (endpoint) `/demo` bằng cách sử dụng access token nhận được từ máy chủ ủy quyền:

```bash
curl 'http://localhost:9090/demo' \
--header 'Authorization: Bearer eyJraW…'
```

## 15.2 Sử dụng JWT tùy chỉnh

Mỗi hệ thống đều có những nhu cầu bảo mật khác nhau, ngay cả đối với cơ chế xác thực và cấp quyền. Trong nhiều trường hợp, bạn cần truyền tải các giá trị tùy chỉnh giữa máy chủ ủy quyền và máy chủ tài nguyên (resource server) thông qua access token. Máy chủ tài nguyên có thể khai thác các giá trị này để áp dụng những quy tắc phân quyền khác nhau.

Trong phần này, chúng ta sẽ triển khai một ví dụ minh họa cách máy chủ ủy quyền và máy chủ tài nguyên sử dụng các claim tùy chỉnh trong access token. Máy chủ ủy quyền sẽ tùy biến JWT bằng cách bổ sung một claim có tên là "priority" (mức độ ưu tiên). Máy chủ tài nguyên sau đó sẽ đọc claim "priority" này và nạp giá trị của nó vào đối tượng xác thực (authentication instance) trong ngữ cảnh bảo mật (security context). Từ đó, máy chủ tài nguyên có thể sử dụng thông tin này khi áp dụng bất kỳ quy tắc phân quyền nào.

Chúng ta sẽ thực hiện theo các bước sau:

1. Cấu hình máy chủ ủy quyền để bổ sung claim tùy chỉnh vào access token.

2. Cấu hình máy chủ tài nguyên để đọc claim tùy chỉnh và lưu trữ vào ngữ cảnh bảo mật.

3. Triển khai quy tắc phân quyền sử dụng claim tùy chỉnh này.

Nhưng trước tiên, chúng ta cần bổ sung một giá trị tùy chỉnh vào phần thân (payload) của access token trong lớp `SecurityConfig`. Trên máy chủ ủy quyền, bạn thực hiện việc này bằng cách định nghĩa một bean kiểu `OAuth2TokenCustomizer`. Đoạn mã tiếp theo sẽ minh họa cách định nghĩa bean này. Để đơn giản hóa và giúp bạn tập trung vào ví dụ chính, tôi đã gán một giá trị giả định (dummy) vào trường có tên là "priority". Trong các ứng dụng thực tế, những trường tùy chỉnh này sẽ phục vụ một mục đích nghiệp vụ cụ thể và bạn có thể sẽ phải viết thêm logic để xác định giá trị của chúng:

```java
@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
    return context -> {
        JwtClaimsSet.Builder claims = context.getClaims();
        claims.claim("priority", "HIGH");
    };
}
```

Chỉ với thay đổi nhỏ này, các access token giờ đây đã chứa thêm trường "priority" tùy chỉnh. Đoạn mã tiếp theo hiển thị một access token dạng JWT được mã hóa Base64 mà tôi đã tạo ra, và Danh sách 15.7 sẽ trình bày phần thân (body) sau khi giải mã để bạn có thể quan sát trường "priority" này:

```
eyJraWQiOiI5ZTBjOTQ5Ny0zYmMyLTQ4Y2YtODU5MC04N2JmZjE2ZjczOTAiLCJhbGciOiJSUzI1NiJ9.eyJzd […]
```

Danh sách 15.7 hiển thị phần thân đã giải mã của access token được giới thiệu trước đó. Hãy nhớ rằng bạn có thể dễ dàng sử dụng công cụ trực tuyến jwt.io để xem dạng giải mã của JWT. Ngoài ra, bạn cũng có thể giải mã Base64 riêng lẻ phần tiêu đề (header) hoặc phần thân (body) của access token bằng bất kỳ công cụ giải mã Base64 nào khác. Danh sách tiếp theo chứng minh rằng các thay đổi của chúng ta trên máy chủ ủy quyền hoạt động hoàn toàn chính xác.

**Danh sách 15.7 Phần thân giải mã Base64 của JWT access token tùy chỉnh**

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

Ở bước thứ hai, chúng ta tiến hành thực hiện các thay đổi trên máy chủ tài nguyên. Bạn có thể tiếp tục phát triển dựa trên ví dụ đã sử dụng ở phần 15.1, nhưng để giúp bạn dễ tiếp thu hơn, tôi đã tạo một dự án riêng biệt cho ví dụ này. Bạn có thể tìm thấy mã nguồn triển khai chi tiết trong dự án `ssia-ch15-ex2`.

Dưới đây là các bước cần thực hiện để máy chủ tài nguyên có thể nhận diện và xử lý các claim tùy chỉnh trong access token:

1. Tạo một đối tượng xác thực tùy chỉnh (custom authentication object). Đối tượng này sẽ định nghĩa cấu trúc mới của thông tin xác thực, bao gồm cả dữ liệu tùy chỉnh.

2. Tạo một đối tượng chuyển đổi xác thực JWT (JWT authentication converter object). Đối tượng này chịu trách nhiệm định nghĩa logic chuyển đổi JWT thành đối tượng xác thực tùy chỉnh nói trên.

3. Cấu hình bộ chuyển đổi xác thực JWT vừa tạo ở bước 2 vào cơ chế xác thực của ứng dụng.

4. Thay đổi điểm cuối `/demo` để trả về đối tượng xác thực lấy từ ngữ cảnh bảo mật.

5. Kiểm thử điểm cuối và xác nhận đối tượng xác thực đã chứa trường "priority" tùy chỉnh.

Danh sách 15.8 trình bày cách định nghĩa đối tượng xác thực. Đối tượng xác thực phải là một lớp kế thừa trực tiếp hoặc gián tiếp từ lớp `AbstractAuthenticationToken`. Vì chúng ta sử dụng JWT, việc kế thừa lớp chuyên biệt hơn là `JwtAuthenticationToken` sẽ tiện lợi hơn cả. Bằng cách này, bạn sẽ mở rộng trực tiếp cấu trúc thông thường của một đối tượng xác thực được thiết kế riêng cho các access token dạng JWT. Hãy chú ý rằng phần tùy chỉnh trong Danh sách 15.8 đã bổ sung thêm một trường có tên là "priority". Trường này sẽ lưu giữ giá trị lấy từ claim tùy chỉnh trong phần thân của access token. Bằng cách tương tự, bạn có thể bổ sung thêm bất kỳ thông tin tùy chỉnh nào khác mà ứng dụng yêu cầu cho mục đích phân quyền. Việc lưu trữ trực tiếp các chi tiết này trong đối tượng xác thực của ngữ cảnh bảo mật giúp đơn giản hóa việc cấu hình, bất kể chúng ta áp dụng chúng ở cấp độ điểm cuối (Chương 7 và 8) hay cấp độ phương thức (Chương 11 và 12).

**Danh sách 15.8 Định nghĩa đối tượng xác thực tùy chỉnh**

```java
public class CustomAuthentication extends JwtAuthenticationToken {
    private final String priority;

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

Sau khi đã có cấu trúc tùy chỉnh cho đối tượng xác thực, việc tiếp theo cần làm là hướng dẫn ứng dụng cách chuyển đổi JWT thành đối tượng tùy chỉnh này. Bạn có thể thực hiện việc này bằng cách cấu hình một `Converter` chuyên biệt như trong Danh sách 15.9. Hãy lưu ý hai kiểu generic được sử dụng: `Jwt` và `CustomAuthentication`. Kiểu generic đầu tiên (`Jwt`) là dữ liệu đầu vào của bộ chuyển đổi, trong khi kiểu thứ hai (`CustomAuthentication`) là kết quả đầu ra. Như vậy, bộ chuyển đổi này sẽ chuyển một đối tượng `Jwt` (đóng vai trò là hợp đồng chuẩn trong Spring Security về cách đọc một JWT access token) thành kiểu tùy chỉnh mà chúng ta đã triển khai ở Danh sách 15.8 (xem Hình 15.5).

**Danh sách 15.9 Chuyển đổi access token thành đối tượng xác thực**

```java
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, CustomAuthentication […]
    @Override
    public CustomAuthentication convert(Jwt source) {
        List<GrantedAuthority> authorities = List.of(() -> "read");
        String priority = String.valueOf(source.getClaims().get("priority"));
        return new CustomAuthentication(source, authorities, priority);
    }
}
```

Trong Danh sách 15.9, bạn cũng có thể thấy tôi đã định nghĩa một quyền hạn giả định (dummy authority). Trong thực tế, bạn sẽ lấy các quyền hạn này từ chính access token (nếu chúng được quản lý ở cấp độ máy chủ ủy quyền), hoặc từ cơ sở dữ liệu hay một hệ thống bên thứ ba khác (nếu chúng được quản lý theo logic nghiệp vụ). Trong trường hợp này, để đơn giản hóa ví dụ, tôi đã gán cứng quyền hạn "read" cho mọi yêu cầu. Tuy nhiên, cần nhớ rằng đây cũng chính là nơi bạn sẽ xử lý các quyền hạn (authority) — vốn là những thông tin thiết yếu cho các quy tắc phân quyền và cần phải được nạp vào đối tượng xác thực trong ngữ cảnh bảo mật.

Danh sách tiếp theo minh họa cách cấu hình bộ chuyển đổi tùy chỉnh này. Ở đây, tôi sử dụng cơ chế tiêm phụ thuộc (dependency injection) để lấy bean bộ chuyển đổi từ ngữ cảnh Spring. Sau đó, tôi truyền nó vào phương thức `jwtAuthenticationConverter()` của trình cấu hình xác thực JWT.

**Danh sách 15.10 Cấu hình bộ chuyển đổi xác thực tùy chỉnh**

```java
@Configuration
public class ProjectConfig {
    // lược bớt mã nguồn
    private final JwtAuthenticationConverter converter;

    // lược bớt phương thức khởi tạo

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2ResourceServer(c -> c.jwt(
            j -> j.jwkSetUri(keySetUri)
                  .jwtAuthenticationConverter(converter)
        ));
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}
```

Đó là toàn bộ cấu hình cần thiết để ứng dụng có thể khai thác claim tùy chỉnh trong access token. Hãy cùng kiểm thử và chứng minh rằng cấu hình hoạt động đúng như mong đợi. Đoạn mã tiếp theo thể hiện các thay đổi mà tôi đã áp dụng cho điểm cuối `/demo`. Tôi đã điều chỉnh để điểm cuối `/demo` trả về chính đối tượng xác thực lấy từ ngữ cảnh bảo mật. Nhờ cơ chế tự động tiêm giá trị của Spring vào tham số có kiểu `Authentication`, tôi chỉ cần khai báo tham số này và yêu cầu phương thức xử lý của điểm cuối trả về chính nó:

```java
@GetMapping("/demo")
public Authentication demo(Authentication a) {
    return a;
}
```

Nếu mọi thứ hoạt động bình thường, khi gửi yêu cầu đến điểm cuối `/demo`, bạn sẽ nhận được phản hồi có phần thân tương tự như trong danh sách dưới đây. Hãy quan sát thuộc tính "priority" tùy chỉnh đã xuất hiện chính xác trong đối tượng xác thực với giá trị là "HIGH".

**Danh sách 15.11 Phản hồi từ điểm cuối /demo chứa trường priority**

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
  ...
  "name": "bill",
  "priority": "HIGH"
}
```

## 15.3 Cấu hình xác thực token thông qua cơ chế thẩm định (introspection)

Trong phần này, chúng sau đây sẽ thảo luận về việc sử dụng cơ chế thẩm định (introspection) để xác thực access token. Nếu ứng dụng của bạn sử dụng token dạng đục (opaque token), hoặc nếu bạn muốn xây dựng một hệ thống cho phép thu hồi token ngay tại máy chủ ủy quyền, thì thẩm định (introspection) là quy trình bắt buộc phải sử dụng để xác thực token. Hình 15.6 sẽ giúp bạn ôn lại quy trình thẩm định này, vốn đã được thảo luận chi tiết trong phần 14.4.

Chúng ta sẽ triển khai một máy chủ tài nguyên để minh họa cách áp dụng cơ chế thẩm định. Để đạt được mục tiêu này, chúng ta cần thực hiện các bước sau:

1. Đảm bảo máy chủ ủy quyền nhận diện máy chủ tài nguyên như một ứng dụng khách (client). Máy chủ tài nguyên cần có thông tin xác thực ứng dụng khách (client credentials) được đăng ký trên máy chủ ủy quyền.

2. Cấu hình cơ chế xác thực trên máy chủ tài nguyên để sử dụng cơ chế thẩm định.

3. Lấy một access token từ máy chủ ủy quyền.

4. Sử dụng một điểm cuối demo để chứng minh rằng cấu hình hoạt động đúng kỳ vọng với access token nhận được ở bước 3.

Đoạn mã tiếp theo minh họa ví dụ về việc tạo một thực thể client để đăng ký phía máy chủ ủy quyền. Thực thể này đại diện cho máy chủ tài nguyên của chúng ta. Như bạn có thể thấy từ Hình 15.6, máy chủ tài nguyên sẽ gửi các yêu cầu thẩm định đến máy chủ ủy quyền, do đó, bản thân nó cũng trở thành một ứng dụng khách của máy chủ ủy quyền.

Để gửi các yêu cầu thẩm định, máy chủ tài nguyên cần có thông tin xác thực để tự xác thực, tương tự như bất kỳ ứng dụng khách nào khác. Trong ví dụ này, tôi sẽ điều chỉnh dự án `ssia-ch14-ex4` mà chúng ta đã tạo khi thảo luận về token dạng đục ở Chương 14:

```java
RegisteredClient resourceServer = RegisteredClient.withId(UUID.randomUUID().toString() […]
    .clientId("resource_server")
    .clientSecret("resource_server_secret")
    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
    .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
    .build();
```

Hãy lưu ý rằng mật khẩu và dữ liệu cấu hình tuyệt đối không được ghi cứng (hardcode) trực tiếp như tôi đã làm trong đoạn mã trên. Tôi đã đơn giản hóa các ví dụ này hết mức có thể để giúp bạn tập trung vào chủ đề chính. Trong một ứng dụng thực tế, bạn nên đưa các cấu hình này vào các tệp nằm ngoài mã nguồn và lưu trữ an toàn các thông tin nhạy cảm (như thông tin xác thực) ở một nơi bảo mật.

Danh sách dưới đây minh họa cách bổ sung cả hai thông tin cấu hình ứng dụng khách (của ứng dụng khách thông thường và của máy chủ tài nguyên) vào thành phần `RegisteredClientRepository` của máy chủ ủy quyền.

**Danh sách 15.12 Định nghĩa RegisteredClientRepository**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
    RegisteredClient registeredClient = RegisteredClient.withId(UUID.randomUUID().toSt […]
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
        .tokenSettings(TokenSettings.builder()
            .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
            .accessTokenTimeToLive(Duration.ofHours(12))
            .build())
        .scope("CUSTOM")
        .build();

    RegisteredClient resourceServer = RegisteredClient.withId(UUID.randomUUID().toStri […]
        .clientId("resource_server")
        .clientSecret("resource_server_secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
        .build();

    return new InMemoryRegisteredClientRepository(
        registeredClient,
        resourceServer
    );
}
```

Với những thay đổi trong Danh sách 15.12, chúng ta hiện đã có một bộ thông tin xác thực mà máy chủ tài nguyên có thể sử dụng để gọi đến điểm cuối thẩm định do máy chủ ủy quyền cung cấp. Bây giờ, chúng ta có thể bắt đầu triển khai máy chủ tài nguyên. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch15-ex3`. Danh sách 15.13 cho thấy cách tôi cấu hình ba giá trị thiết yếu cần thiết cho quá trình thẩm định trong tệp cấu hình thuộc tính (`application.properties`):

- URI thẩm định do máy chủ ủy quyền cung cấp, cho phép máy chủ tài nguyên xác thực các token.

- Client ID của máy chủ tài nguyên, giúp máy chủ tài nguyên tự định danh khi gọi điểm cuối thẩm định.

- Client secret của máy chủ tài nguyên, được sử dụng cùng với client ID để xác thực khi gửi yêu cầu đến điểm cuối thẩm định.

Song song đó, tôi cũng đổi cổng của máy chủ tài nguyên thành 9090 (khác với cổng 8080 của máy chủ ứng dụng), qua đó cho phép cả hai ứng dụng chạy đồng thời.

**Danh sách 15.13 Tệp application.properties của máy chủ tài nguyên**

```properties
server.port=9090
introspectionUri=http://localhost:8080/oauth2/introspect
resourceserver.clientID=resource_server
resourceserver.secret=resource_server_secret
```

Sau đó, bạn có thể tiêm các giá trị trong tệp thuộc tính vào các trường của lớp cấu hình để thiết lập cơ chế xác thực. Danh sách dưới đây minh họa lớp cấu hình thực hiện việc tiêm các giá trị này.

**Danh sách 15.14 Tiêm các giá trị vào các trường của lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
    @Value("${introspectionUri}")
    private String introspectionUri;

    @Value("${resourceserver.clientID}")
    private String resourceServerClientID;

    @Value("${resourceserver.secret}")
    private String resourceServerSecret;
}
```

Hãy sử dụng URI thẩm định và thông tin xác thực để cấu hình cơ chế xác thực. Bạn sẽ thực hiện việc này tương tự như cách cấu hình cho JWT access token — sử dụng phương thức `oauth2ResourceServer()` của đối tượng `HttpSecurity`. Tuy nhiên, chúng ta sẽ gọi một phương thức cấu hình khác trên đối tượng tùy chỉnh của `oauth2ResourceServer()` là `opaqueToken()`. Với phương thức `opaqueToken()`, chúng ta tiến hành cấu hình URI thẩm định và các thông tin xác thực liên quan. Danh sách dưới đây minh họa thiết lập này.

**Danh sách 15.15 Cấu hình cơ chế xác thực của máy chủ tài nguyên cho token dạng đục**

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2ResourceServer(c -> c.opaqueToken(
            o -> o.introspectionUri(introspectionUri)
                  .introspectionClientCredentials(
                      resourceServerClientID,
                      resourceServerSecret
                  )
        ));
        return http.build();
    }
}
```

Hãy nhớ bổ sung cả các cấu hình phân quyền. Đoạn mã tiếp theo thể hiện cách thức tiêu chuẩn mà bạn đã học ở Chương 7 và 8 để yêu cầu tất cả các điểm cuối phải xác thực yêu cầu truy cập:

```java
http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
```

Danh sách dưới đây trình bày toàn bộ nội dung của lớp cấu hình.

**Danh sách 15.16 Toàn bộ nội dung của lớp cấu hình**

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2ResourceServer(c -> c.opaqueToken(
            o -> o.introspectionUri(introspectionUri)
                  .introspectionClientCredentials(
                      resourceServerClientID,
                      resourceServerSecret
                  )
        ));
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}
```

Một điểm cuối `/demo` đơn giản như trong đoạn mã dưới đây là đủ để chúng ta kiểm tra xem cơ chế xác thực có hoạt động chính xác hay không:

```java
@RestController
public class DemoController {
    @GetMapping("/demo")
    public String demo() {
        return "Demo";
    }
}
```

Giờ đây, bạn có thể khởi chạy cả hai ứng dụng: máy chủ ủy quyền và máy chủ tài nguyên. Cả hai ứng dụng này phải hoạt động đồng thời. Đoạn mã tiếp theo cung cấp lệnh cURL bạn có thể dùng để gửi yêu cầu đến điểm cuối `/token`. Để đơn giản hóa ví dụ này, tôi sử dụng phương thức cấp quyền `client_credentials`, tuy nhiên bạn có thể sử dụng bất kỳ phương thức cấp quyền nào đã học ở Chương 14 để lấy access token. Hãy nhớ rằng cấu hình của máy chủ tài nguyên là hoàn toàn như nhau, không phụ thuộc vào cách bạn nhận được access token:

```bash
curl -X POST 'http://localhost:8080/oauth2/token? \
client_id=client& \
grant_type=client_credentials' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Nếu yêu cầu thành công, bạn sẽ nhận được access token trong phản hồi. Phần thân phản hồi sẽ tương tự như đoạn mã dưới đây. Tôi đã lược bớt giá trị của token để hiển thị vừa vặn trên trang sách:

```json
{
  "access_token": "2zLyYA8b6Q54-…",
  "token_type": "Bearer",
  "expires_in": 43199
}
```

Tương tự như đối với JWT access token, khi gửi yêu cầu đến một điểm cuối được bảo vệ, hãy truyền token vào phần giá trị của tiêu đề "Authorization". Giá trị của access token phải được bắt đầu bằng chuỗi "Bearer ". Đoạn mã tiếp theo minh họa lệnh cURL dùng để gửi yêu cầu đến điểm cuối `/demo`. Nếu mọi thứ hoạt động chính xác, bạn sẽ nhận lại chuỗi "Demo" trong phần thân phản hồi với mã trạng thái `200 OK`:

```bash
curl 'http://localhost:9090/demo' \
--header 'Authorization: Bearer 2zLyYA8b6Q54-…'
```

## 15.4 Triển khai hệ thống đa khách thuê (multitenant)

Trong các ứng dụng thực tế, không phải lúc nào mọi thứ cũng diễn ra lý tưởng. Đôi khi chúng ta buộc phải điều chỉnh mã nguồn để tương thích với một số trường hợp phi tiêu chuẩn khi tích hợp với bên thứ ba. Ngoài ra, cũng có lúc hệ thống backend cần dựa vào nhiều máy chủ ủy quyền khác nhau để thực hiện xác thực và phân quyền (hệ thống đa khách thuê - multitenant). Trong những trường hợp như vậy, chúng ta nên thiết lập cấu hình của ứng dụng ra sao?

Thật may mắn, Spring Security cung cấp sự linh hoạt vượt trội để đáp ứng mọi kịch bản. Trong phần này, chúng ta sẽ thảo luận về cách cấu hình máy chủ tài nguyên cho các trường hợp phức tạp hơn, chẳng hạn như hệ thống đa khách thuê hoặc khi tương tác với các ứng dụng không tuân thủ các chuẩn chung.

Hãy quan sát Hình 15.7 để ôn lại thiết kế xác thực của Spring Security mà chúng ta đã thảo luận chi tiết ở hai phần đầu của cuốn sách. Một bộ lọc (filter) sẽ chặn yêu cầu HTTP. Trách nhiệm xác thực sau đó được ủy quyền cho một trình quản lý xác thực (authentication manager). Trình quản lý này sẽ tiếp tục sử dụng một nhà cung cấp xác thực (authentication provider) — nơi trực tiếp triển khai logic xác thực.

Vì sao việc ghi nhớ thiết kế này lại quan trọng? Bởi vì đối với máy chủ tài nguyên, tương tự như bất kỳ phương pháp xác thực nào khác, bạn cần thay đổi nhà cung cấp xác thực nếu muốn tùy biến cách thức hoạt động của cơ chế xác thực.

Trong trường hợp của máy chủ tài nguyên, Spring Security cho phép bạn tích hợp vào cấu hình một thành phần gọi là bộ phân giải trình quản lý xác thực (authentication manager resolver - xem Hình 15.8). Thành phần này cho phép ứng dụng quyết định trình quản lý xác thực nào sẽ được gọi trong quá trình thực thi. Nhờ đó, bạn có thể ủy quyền xác thực cho bất kỳ trình quản lý xác thực tùy chỉnh nào có sử dụng nhà cung cấp xác thực tùy chỉnh tương ứng.

Nếu bạn muốn ứng dụng của mình làm việc với nhiều máy chủ ủy quyền khác nhau và tất cả đều sử dụng JWT, Spring Security thậm chí còn cung cấp sẵn một lớp triển khai bộ phân giải trình quản lý xác thực (Hình 15.9). Trong trường hợp này, bạn chỉ cần tích hợp lớp triển khai tùy chỉnh `JwtIssuerAuthenticationManagerResolver` do Spring Security hỗ trợ.

Danh sách 15.17 cho thấy cách sử dụng phương thức `authenticationManagerResolver()` khi cấu hình cơ chế xác thực. Trong ví dụ này, bạn có thể thấy tôi chỉ cần khởi tạo một đối tượng của lớp `JwtIssuerAuthenticationManagerResolver` và cung cấp toàn bộ địa chỉ phát hành (issuer address) của các máy chủ ủy quyền cho đối tượng này. Bạn có thể tìm thấy ví dụ thực tế này trong dự án `ssia-ch15-ex4`.

> **LƯU Ý** Đừng bao giờ ghi cứng các URL (hoặc bất kỳ thông tin cấu hình tương tự nào khác) trực tiếp trong mã nguồn. Chúng tôi chỉ sử dụng cách tiếp cận này trong các ví dụ để đơn giản hóa mã nguồn và giúp bạn tập trung vào những kiến thức cốt lõi cần tiếp thu. Mọi thông tin có thể thay đổi luôn phải được đưa vào các tệp cấu hình hoặc các biến môi trường.

**Danh sách 15.17 Làm việc với hai máy chủ ủy quyền sử dụng JWT access token**

```java
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2ResourceServer(j -> j.authenticationManagerResolver(
            authenticationManagerResolver()
        ));
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public AuthenticationManagerResolver<HttpServletRequest> authenticationManagerReso […]
        var a = new JwtIssuerAuthenticationManagerResolver(
            "http://localhost:7070",
            "http://localhost:8080"
        );
        return a;
    }
}
```

Với cấu hình như trong Hình 15.10, máy chủ tài nguyên của bạn có thể làm việc đồng thời với hai máy chủ ủy quyền chạy trên các cổng 7070 và 8080.

Tuy nhiên, thực tế đôi khi phức tạp hơn thế rất nhiều. Spring Security không thể cung cấp sẵn mọi cấu hình tùy chỉnh khả dĩ. Trong trường hợp cần tùy biến sâu hơn nữa các khả năng của máy chủ tài nguyên, bạn bắt buộc phải tự triển khai bộ phân giải trình quản lý xác thực của riêng mình.

Hãy xem xét kịch bản sau: bạn cần máy chủ tài nguyên của mình hoạt động được với cả JWT lẫn token dạng đục từ hai máy chủ ủy quyền khác nhau. Giả sử máy chủ tài nguyên sẽ phân biệt các yêu cầu dựa trên giá trị của một tham số có tên là "type". Nếu giá trị của tham số "type" là "jwt", máy chủ tài nguyên phải xác thực yêu cầu thông qua máy chủ ủy quyền sử dụng JWT access token; ngược lại, nó sẽ sử dụng máy chủ ủy quyền sử dụng token dạng đục.

Danh sách 15.18 triển khai kịch bản này. Máy chủ tài nguyên sẽ sử dụng các máy chủ ủy quyền khác nhau tùy thuộc vào giá trị của tiêu đề "type" trong yêu cầu HTTP. Để đạt được điều đó, máy chủ tài nguyên sẽ linh hoạt chuyển đổi trình quản lý xác thực dựa trên giá trị của tiêu đề này.

**Danh sách 15.18 Sử dụng đồng thời cả JWT và token dạng đục**

```java
@Configuration
public class ProjectConfig {
    // Lược bớt mã nguồn

    @Bean
    public AuthenticationManagerResolver<HttpServletRequest> authenticationManagerReso […]
        JwtDecoder jwtDecoder,
        OpaqueTokenIntrospector opaqueTokenIntrospector
    ) {
        AuthenticationManager jwtAuth = new ProviderManager(
            new JwtAuthenticationProvider(jwtDecoder)
        );

        AuthenticationManager opaqueAuth = new ProviderManager(
            new OpaqueTokenAuthenticationProvider(opaqueTokenIntrospector)
        );

        return (request) -> {
            if ("jwt".equals(request.getHeader("type"))) {
                return jwtAuth;
            } else {
                return opaqueAuth;
            }
        };
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder
            .withJwkSetUri("http://localhost:7070/oauth2/jwks")
            .build();
    }

    @Bean
    public OpaqueTokenIntrospector opaqueTokenIntrospector() {
        return new SpringOpaqueTokenIntrospector(
            "http://localhost:6060/oauth2/introspect",
            "client", "secret"
        );
    }
}
```

Danh sách tiếp theo trình bày phần cấu hình còn lại, thiết lập bộ phân giải trình quản lý xác thực tùy chỉnh bằng cách sử dụng tham số tùy biến của phương thức `authenticationManagerResolver()`.

**Danh sách 15.19 Cấu hình AuthenticationManagerResolver**

```java
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2ResourceServer(j -> j.authenticationManagerResolver(
            authenticationManagerResolver(
                jwtDecoder(),
                opaqueTokenIntrospector()
            )
        ));
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
    // Lược bớt mã nguồn
}
```

Ngay cả trong ví dụ này, chúng ta vẫn sử dụng các lớp triển khai nhà cung cấp xác thực do Spring Security cung cấp sẵn: `JwtAuthenticationProvider` và `OpaqueTokenAuthenticationProvider`. Ở đây, `JwtAuthenticationProvider` thực hiện logic xác thực để làm việc với một máy chủ ủy quyền tiêu chuẩn sử dụng JWT access token. `OpaqueTokenAuthenticationProvider` đảm nhận logic xác thực đối với các token dạng đục. Tuy nhiên, bạn hoàn toàn có thể gặp phải các trường hợp phức tạp hơn thế trong các ứng dụng thực tế.

Nếu cần triển khai một cơ chế mang tính tùy biến rất cao, chẳng hạn như tích hợp với một hệ thống không tuân theo bất kỳ tiêu chuẩn chung nào, bạn thậm chí có thể tự xây dựng nhà cung cấp xác thực tùy chỉnh của riêng mình.

## Tóm tắt

- Spring Security hỗ trợ đắc lực cho việc triển khai các máy chủ tài nguyên OAuth 2/OpenID Connect. Để cấu hình ứng dụng hoạt động như một máy chủ tài nguyên OAuth 2/OpenID Connect, hãy sử dụng phương thức `oauth2ResourceServer()` của đối tượng `HttpSecurity`.

- Nếu muốn sử dụng JWT, bạn cần áp dụng cấu hình thông qua phương thức `jwt()` nằm trong tham số tùy biến của `oauth2ResourceServer()`.

- Bạn cũng có thể sử dụng cơ chế thẩm định (introspection) nếu hệ thống của bạn sử dụng token dạng đục, hoặc nếu bạn muốn có khả năng thu hồi các JWT ngay tại phía máy chủ ủy quyền. Trong trường hợp đó, bạn phải cấu hình cơ chế xác thực bằng phương thức `opaqueToken()` nằm trong tham số tùy biến của `oauth2ResourceServer()`.

- Khi sử dụng JWT, bạn bắt buộc phải cấu hình URI tập hợp khóa công khai (public key set URI). Đây là một URI được công khai bởi máy chủ ủy quyền. Máy chủ tài nguyên sẽ gọi URI này để lấy phần khóa công khai tương ứng với cặp khóa được cấu hình trên máy chủ ủy quyền. Máy chủ ủy quyền sử dụng khóa bí mật (private key) để ký các access token, trong khi máy chủ tài nguyên cần khóa công khai (public key) để xác thực chúng.

- Khi sử dụng cơ chế thẩm định, bạn cần cấu hình URI thẩm định. Máy chủ tài nguyên sẽ gửi các yêu cầu đến URI thẩm định để truy vấn máy chủ ủy quyền xem token đó có hợp lệ hay không cũng như để lấy thêm thông tin chi tiết về nó. Khi gọi URI thẩm định này, máy chủ tài nguyên đóng vai trò là một ứng dụng khách đối với máy chủ ủy quyền, do đó nó cần có thông tin xác thực ứng dụng khách riêng để thực hiện xác thực.

- Spring Security cung cấp khả năng tùy biến logic xác thực thông qua thành phần bộ phân giải trình quản lý xác thực (authentication manager resolver). Bạn sẽ định nghĩa và cấu hình thành phần tùy chỉnh này khi cần giải quyết các bài toán đặc thù, chẳng hạn như kiến trúc đa khách thuê (multitenancy) hoặc khi cần điều chỉnh ứng dụng để tương thích với một hệ thống không tuân thủ các tiêu chuẩn chung.
