# 14. Hiện thực một OAuth 2 authorization server

> Bản dịch tiếng Việt của chương 14 — *Spring Security in Action, Second Edition* (Laurentiu Spilca, Manning).

**Nội dung chương này bao gồm:**

- Hiện thực một Spring Security OAuth 2 authorization server
- Sử dụng authorization code và client credentials grant type
- Cấu hình opaque và non-opaque access token
- Sử dụng token revocation (thu hồi token) và introspection

Chương 13 đã bao quát OAuth 2 và OpenID Connect. Chúng ta đã bàn về các actor (thành phần tham gia) đóng vai trò trong một hệ thống mà authentication (xác thực) và authorization (phân quyền) dựa trên đặc tả OAuth 2. Authorization server là một trong những actor đó. Vai trò của nó là authentication một user và app họ dùng (client), cũng như cấp phát token đóng vai trò bằng chứng authentication để truy cập tài nguyên được bảo vệ bởi một backend. Đôi khi, client làm điều đó thay mặt một user.

Hệ sinh thái Spring cung cấp một cách hoàn toàn tùy chỉnh được để hiện thực một OAuth 2/OpenID Connect authorization server. Spring Security authorization server là cách thực tế (de facto) để hiện thực một authorization server bằng Spring ngày nay. Trong chương này, chúng ta sẽ xem xét những khả năng chính mà framework này cung cấp và hiện thực một authorization server tùy chỉnh. Hình 14.1 ở đây để nhắc bạn về các actor OAuth 2 và vai trò của authorization server đã bàn ở chương 13.

![Hình 14.1](images/ch14/ch14-fig01.png)

**Hình 14.1** Các actor trên sân khấu OAuth 2. Authorization server bảo vệ chi tiết user và client, và cấp phát token mà client có thể dùng để được authorize khi gọi các endpoint của resource server.

Chúng ta bắt đầu bằng việc hiện thực một ví dụ đơn giản ở mục 14.1, dùng cấu hình mặc định. Cấu hình mặc định ngụ ý rằng authorization server sẽ cấp phát non-opaque token. Ở mục 14.2, chúng ta chứng minh rằng hiện thực của mình hoạt động với authorization code grant type, rồi ở mục 14.3, chúng ta minh họa cả client credentials grant type. Ở mục 14.4, chúng ta tiếp tục với việc cấu hình authorization server để làm việc với opaque token và introspection. Chúng ta kết thúc phần thảo luận của chương này ở mục 14.5 với token revocation.

Trước khi bắt đầu, tôi muốn cho bạn biết rằng cách hiện thực một authorization server với Spring Security hoàn toàn khác so với những năm trước. Trong chương này, chúng ta bàn về cách tiếp cận mới, nhưng bạn cũng có thể cần biết cách hiện thực một authorization server theo cách cũ (ví dụ, nếu bạn cần làm việc với một app hiện có chưa được nâng cấp). Trong trường hợp đó, tôi khuyến nghị đọc chương 13 của ấn bản đầu tiên cuốn sách.

---

## 14.1 Hiện thực authentication cơ bản bằng JSON Web Token

Trong mục này, chúng ta triển khai một OAuth 2 authorization server cơ bản dùng framework Spring Security authorization server. Chúng ta sẽ đi qua tất cả các component chính bạn cần cắm vào cấu hình để nó hoạt động và bàn về chúng từng cái một. Rồi chúng ta sẽ test app bằng hai grant type OAuth 2 thiết yếu nhất: authorization code và client credentials grant type. Bạn sẽ tìm thấy ví dụ này được hiện thực trong project `ssia-ch14-ex1`.

Các component chính bạn cần thiết lập để authorization server hoạt động đúng cách là:

1. **Configuration filter cho protocol endpoint** — Giúp bạn định nghĩa các cấu hình đặc thù cho những khả năng của authorization server, bao gồm nhiều tùy chỉnh khác nhau (mà chúng ta sẽ bàn ở mục 14.3).
2. **Authentication configuration filter** — Tương tự bất kỳ web application nào được bảo vệ bằng Spring Security, bạn sẽ dùng filter này để định nghĩa các cấu hình authentication và authorization cùng cấu hình cho bất kỳ cơ chế bảo mật nào khác như cross-origin resource sharing (CORS) và cross-site request forgery (CSRF) (xem chương 2 đến 10).
3. **Các component quản lý user details** — Như bất kỳ tiến trình authentication nào được hiện thực với Spring Security, chúng được thiết lập qua một bean `UserDetailsService` và một `PasswordEncoder`. Chúng hoạt động như đã bàn ở chương 3 và 4.
4. **Quản lý client details** — Authorization server dùng một component gọi là `RegisteredClientRepository` để quản lý credential của client và các chi tiết khác.
5. **Quản lý cặp khóa (dùng để ký và kiểm chứng token)** — Khi dùng non-opaque token, authorization server dùng một private key để ký token. Authorization server cũng cung cấp quyền truy cập tới một public key mà resource server có thể dùng để kiểm chứng token. Authorization server quản lý các cặp khóa private–public thông qua một component "key source".
6. **Các thiết lập chung của app** — Một component tên là `AuthorizationServerSettings` giúp bạn cấu hình những tùy chỉnh tổng quát như các endpoint mà app expose.

Hình 14.2 minh họa những component chúng ta cần cắm vào và cấu hình để một app authorization server tối thiểu hoạt động.

![Hình 14.2](images/ch14/ch14-fig02.png)

**Hình 14.2** Các component chúng ta cần cấu hình và cắm vào để một authorization server được hiện thực với Spring Security hoạt động.

Để bắt đầu, chúng ta phải thêm những dependency cần thiết vào project. Ở đoạn code kế tiếp, bạn tìm thấy các dependency bạn cần thêm vào file *pom.xml* của project:

```xml
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-oauth2-authorization-server</artifactId>
</dependency>
```

Chúng ta viết các cấu hình trong những configuration class Spring chuẩn như ở đoạn code kế tiếp.

```java
@Configuration
public class SecurityConfig {
}
```

Hãy nhớ rằng như với bất kỳ app Spring nào khác, các bean có thể được định nghĩa trong nhiều configuration class, hoặc chúng có thể được định nghĩa bằng stereotype annotation (tùy trường hợp). Nếu bạn cần ôn lại về việc quản lý Spring context, tôi khuyến nghị phần đầu của cuốn *Spring Start Here* (Manning, 2021), một cuốn sách khác do tôi viết.

Hãy xem listing 14.1, thứ trình bày configuration filter cho các protocol endpoint. Phương thức `applyDefaultSecurity()` là một phương thức tiện ích chúng ta dùng để định nghĩa một tập cấu hình tối thiểu mà bạn có thể ghi đè sau này nếu cần. Sau khi gọi phương thức này, listing cho thấy cách bật giao thức OpenID Connect bằng phương thức `oidc()` của object configurer `OAuth2AuthorizationServerConfigurer`.

Hơn nữa, filter ở listing 14.1 chỉ định trang authentication mà app cần chuyển hướng user tới khi được yêu cầu đăng nhập. Chúng ta cần cấu hình này vì chúng ta mong đợi bật authorization code grant type cho ví dụ của mình, thứ ngụ ý rằng user phải authentication. Path mặc định trong một web app Spring là `/login`, nên trừ khi chúng ta cấu hình một cái tùy chỉnh, chúng ta sẽ dùng cái này cho cấu hình authorization server.

**Listing 14.1 Hiện thực filter để cấu hình các protocol endpoint**

```java
@Bean
@Order(1)
public SecurityFilterChain asFilterChain(HttpSecurity http)
  throws Exception {

    OAuth2AuthorizationServerConfiguration                 // ①
       .applyDefaultSecurity(http);

    http.getConfigurer(
      OAuth2AuthorizationServerConfigurer.class)           // ②
        .oidc(Customizer.withDefaults());

    http.exceptionHandling((e) ->
      e.authenticationEntryPoint(
         new LoginUrlAuthenticationEntryPoint("/login"))   // ③
    );

    return http.build();
  }
```

① Gọi phương thức tiện ích để áp dụng cấu hình mặc định cho các endpoint của authorization server.

② Bật giao thức OpenID Connect.

③ Chỉ định trang authentication cho user.

Listing 14.2 cấu hình authentication và authorization. Những cấu hình này hoạt động tương tự bất kỳ web app nào (như chúng ta đã bàn ở chương 2 đến 10). Ở listing 14.2, tôi thiết lập những cấu hình tối thiểu:

1. Bật phương thức form login authentication để app cung cấp cho user một trang đăng nhập đơn giản để authentication
2. Chỉ định rằng app chỉ cho phép những user đã authentication truy cập bất kỳ endpoint nào

Những cấu hình khác bạn có thể viết ở đây, ngoài authentication và authorization, có thể dành cho các cơ chế bảo vệ cụ thể như CSRF (bàn ở chương 9) hoặc CORS (bàn ở chương 10).

Hãy cũng quan sát annotation `@Order` tôi dùng ở listing 14.1 và 14.2. Annotation này là cần thiết vì chúng ta có nhiều instance `SecurityFilterChain` được cấu hình trong app context, và chúng ta cần cung cấp thứ tự ưu tiên của chúng trong cấu hình.

**Listing 14.2 Hiện thực filter cho cấu hình authorization**

```java
@Bean
@Order(2)                                                 // ①
public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)
  throws Exception {

  http.formLogin(Customizer.withDefaults());              // ②

  http.authorizeHttpRequests(                             // ③
    c -> c.anyRequest().authenticated()
  );

  return http.build();
}
```

① Chúng ta đặt filter này được diễn giải sau filter cho protocol endpoint.

② Chúng ta bật phương thức form login authentication.

③ Chúng ta cấu hình tất cả endpoint đều yêu cầu authentication.

Nếu bạn mong đợi client sẽ dùng authorization server bạn xây dựng cho những grant type ngụ ý việc user authentication (chẳng hạn authorization code grant type), thì server của bạn cần quản lý chi tiết user! May mắn thay, để hiện thực việc quản lý user details, bạn có thể dùng cùng cách tiếp cận bạn đã học ở chương 3 và 4. Tất cả những gì bạn cần là một hiện thực `UserDetailsService` và một `PasswordEncoder`.

Listing 14.3 trình bày định nghĩa cho hai component này. Trong ví dụ này, chúng ta dùng một hiện thực in-memory cho `UserDetailsService`, nhưng hãy nhớ rằng bạn đã học cách viết một hiện thực tùy chỉnh cho nó ở chương 3. Trong hầu hết trường hợp, như bạn làm với các web app khác, bạn sẽ lưu những chi tiết như vậy trong một database. Do đó, bạn phải viết một hiện thực tùy chỉnh cho contract `UserDetailsService`.

Ngoài ra, hãy nhớ rằng ở chương 4, chúng ta đã bàn rằng `NoOpPasswordEncoder` là thứ bạn chỉ nên dùng với các mẫu học tập. `NoOpPasswordEncoder` không biến đổi password theo bất kỳ cách nào, để chúng ở dạng clear text và sẵn sàng cho bất kỳ ai có thể truy cập chúng, điều này không tốt. Bạn nên luôn dùng một password encoder với hàm hash mạnh như BCrypt.

**Listing 14.3 Định nghĩa việc quản lý user details**

```java
@Bean
public UserDetailsService userDetailsService() {
  UserDetails userDetails = User.withUsername("bill")
        .password("password")
        .roles("USER")
        .build();

  return new InMemoryUserDetailsManager(userDetails);
}

@Bean
public PasswordEncoder passwordEncoder() {
  return NoOpPasswordEncoder.getInstance();
}
```

Authorization server cần một component `RegisteredClientRepository` để quản lý chi tiết client. Interface `RegisteredClientRepository` hoạt động tương tự `UserDetailsService`, nhưng nó được thiết kế để truy xuất chi tiết client. Tương tự, framework cung cấp object `RegisteredClient`, mục đích của nó là mô tả một app client mà authorization server biết.

Để so sánh với những gì bạn đã học ở chương 3 và 4, `RegisteredClient` với client cũng như `UserDetails` với user. Tương tự, `RegisteredClientRepository` hoạt động với chi tiết client theo cách mà `UserDetailsService` hoạt động với chi tiết user (hình 14.3).

Trong ví dụ này, chúng ta sẽ dùng một hiện thực in-memory để bạn có thể tập trung vào hiện thực tổng thể của authorization server. Tuy vậy, trong một app thực tế, bạn nhiều khả năng sẽ cần cung cấp một hiện thực cho interface này để lấy dữ liệu từ database. Để điều này hoạt động, bạn hiện thực interface `RegisteredClientRepository` tương tự cách bạn hiện thực interface `UserDetailsService` ở chương 3.

![Hình 14.3](images/ch14/ch14-fig03.png)

**Hình 14.3** Để quản lý chi tiết client, chúng ta dùng một hiện thực `RegisteredClientRepository`. `RegisteredClientRepository` dùng các object `RegisteredClient` để biểu diễn chi tiết client.

Listing kế tiếp cho thấy định nghĩa của bean `RegisteredClientRepository` in-memory. Phương thức này tạo một instance `RegisteredClient` với những chi tiết cần thiết và lưu nó trong bộ nhớ để được authorization server dùng trong quá trình authentication.

**Listing 14.4 Hiện thực việc quản lý client details**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
  RegisteredClient registeredClient =                         // ①
    RegisteredClient
        .withId(UUID.randomUUID().toString())
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(
           ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(
           AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("https://www.manning.com/authorized")
        .scope(OidcScopes.OPENID)
        .build();

  return new InMemoryRegisteredClientRepository(registeredClient);   // ②
}
```

① Tạo một instance `RegisteredClient`.

② Thêm nó để được quản lý bởi hiện thực `RegisteredClientRepository` in-memory.

Những chi tiết chúng ta chỉ định khi tạo instance `RegisteredClient` là:

- **Một ID nội bộ duy nhất** — Giá trị định danh client một cách duy nhất và chỉ có mục đích trong các tiến trình nội bộ của app.
- **Một client ID** — Định danh client bên ngoài, tương tự như username đối với user.
- **Một client secret** — Tương tự như password đối với user.
- **Client authentication method** — Cho biết authorization server mong đợi client authentication thế nào khi gửi request lấy access token.
- **Authorization grant type** — Một grant type được authorization server cho phép với client này. Một client có thể dùng nhiều grant type.
- **Redirect URI** — Một trong những địa chỉ URI mà authorization server cho phép client yêu cầu chuyển hướng tới để cung cấp authorization code trong trường hợp authorization code grant type.
- **Một scope** — Định nghĩa một mục đích cho request lấy access token. Scope có thể được dùng sau này trong các quy tắc authorization.

Trong ví dụ này, client chỉ dùng authorization code grant type. Tuy nhiên, bạn có thể có những client dùng nhiều grant type. Trong trường hợp bạn muốn một client có thể dùng nhiều grant type, bạn cần chỉ định chúng như trình bày ở đoạn code kế tiếp. Client được định nghĩa ở đây có thể dùng bất kỳ grant type nào (authorization code, client credentials, hoặc refresh token):

```java
RegisteredClient registeredClient =
    RegisteredClient
        .withId(UUID.randomUUID().toString())
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(
           ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(
           AuthorizationGrantType.AUTHORIZATION_CODE)
        .authorizationGrantType(
           AuthorizationGrantType.CLIENT_CREDENTIALS)
        .authorizationGrantType(
           AuthorizationGrantType.REFRESH_TOKEN)
        .redirectUri("https://www.manning.com/authorized")
        .scope(OidcScopes.OPENID)
        .build();
```

Tương tự, bằng cách gọi lặp lại phương thức `redirectUri()`, bạn có thể chỉ định nhiều redirect URI được cho phép. Tương tự, một client cũng có thể có quyền truy cập tới nhiều scope. Trong một app thực tế, app sẽ lưu tất cả những chi tiết này trong một database, nơi mà hiện thực `RegisteredClientRepository` tùy chỉnh của bạn sẽ truy xuất chúng.

Bên cạnh việc có chi tiết user và client, bạn phải cấu hình việc quản lý cặp khóa nếu authorization server dùng non-opaque token (đã bàn ở chương 13). Với non-opaque token, authorization server dùng private key để ký token và cung cấp cho client public key mà họ có thể dùng để kiểm chứng tính xác thực của token.

`JWKSource` là object cung cấp việc quản lý khóa cho Spring Security authorization server. Listing 14.5 cho thấy cách cấu hình một `JWKSource` trong context của app. Với ví dụ này, tôi tạo một cặp khóa bằng code và thêm nó vào tập khóa mà authorization server có thể dùng. Trong một app thực tế, app sẽ đọc các khóa từ một vị trí nơi chúng được lưu trữ an toàn (chẳng hạn một vault được cấu hình trong môi trường).

Việc cấu hình một môi trường giống hệt một hệ thống thực tế sẽ quá phức tạp, và tôi muốn bạn tập trung vào hiện thực authorization server. Tuy nhiên, hãy nhớ rằng trong một app thực, việc sinh khóa mới mỗi lần app khởi động lại (như trường hợp của chúng ta) là không hợp lý. Nếu điều đó xảy ra với một app thực, mỗi lần một lần deploy mới diễn ra, những token đã được cấp phát sẽ không còn hoạt động nữa (vì chúng không thể được kiểm chứng bằng các khóa hiện có nữa).

Vậy nên, với ví dụ của chúng ta, việc sinh khóa bằng code hoạt động được và sẽ giúp chúng ta minh họa cách authorization server hoạt động. Trong một app thực tế, bạn phải giữ các khóa được bảo mật ở đâu đó và đọc chúng từ vị trí đã cho.

**Listing 14.5 Hiện thực việc quản lý tập cặp khóa**

```java
@Bean
public JWKSource<SecurityContext> jwkSource()
  throws NoSuchAlgorithmException {

    KeyPairGenerator keyPairGenerator =                       // ①
      KeyPairGenerator.getInstance("RSA");
    keyPairGenerator.initialize(2048);
    KeyPair keyPair = keyPairGenerator.generateKeyPair();

    RSAPublicKey publicKey =
      (RSAPublicKey) keyPair.getPublic();
    RSAPrivateKey privateKey =
      (RSAPrivateKey) keyPair.getPrivate();

    RSAKey rsaKey = new RSAKey.Builder(publicKey)
        .privateKey(privateKey)
        .keyID(UUID.randomUUID().toString())
        .build();

    JWKSet jwkSet = new JWKSet(rsaKey);                     // ②

    return new ImmutableJWKSet<>(jwkSet);                   // ③
}
```

① Sinh một cặp khóa public–private bằng code, dùng thuật toán mật mã RSA.

② Thêm cặp khóa vào tập mà authorization server dùng để ký các token được cấp phát.

③ Bọc tập khóa vào một hiện thực `JWKSource` và trả về nó để được thêm vào Spring context.

Cuối cùng, component cuối cùng chúng ta cần thêm vào cấu hình tối thiểu của mình là một object `AuthorizationServerSettings` (listing 14.6). Object này cho phép bạn tùy chỉnh tất cả các đường dẫn endpoint mà authorization server expose. Nếu bạn tạo object như trình bày ở listing kế tiếp, các đường dẫn endpoint sẽ nhận một số giá trị mặc định mà chúng ta sẽ phân tích sau trong mục này.

**Listing 14.6 Cấu hình các thiết lập chung của authorization server**

```java
@Bean
public AuthorizationServerSettings authorizationServerSettings() {
  return AuthorizationServerSettings.builder().build();
}
```

Giờ chúng ta có thể khởi động app và test xem nó có hoạt động không. Ở mục 14.2, chúng ta sẽ chạy luồng authorization code. Rồi ở mục 14.3, chúng ta sẽ test rằng luồng client credentials hoạt động như mong đợi với hiện thực authorization code của chúng ta.

---

## 14.2 Chạy authorization code grant type

Trong mục này, chúng ta test authorization server đã hiện thực ở mục 14.1. Chúng ta mong đợi rằng bằng cách dùng chi tiết client đã đăng ký, chúng ta sẽ có thể theo luồng authorization code và lấy được một access token. Chúng ta sẽ theo các bước sau:

1. Kiểm tra các endpoint mà authorization server expose
2. Dùng authorization endpoint để lấy một authorization code
3. Dùng authorization code để lấy một access token

Bước đầu tiên là tìm các đường dẫn endpoint mà authorization server expose. Vì chúng ta không cấu hình các đường dẫn tùy chỉnh, chúng ta phải dùng các giá trị mặc định. Nhưng đâu là các giá trị mặc định? Bạn có thể gọi OpenID configuration endpoint ở đoạn code kế tiếp để khám phá những chi tiết này. Request này dùng HTTP GET method, và không cần authentication:

```
http://localhost:8080/.well-known/openid-configuration
```

Khi gọi OpenID configuration endpoint, bạn sẽ nhận được một response trông giống cái được trình bày ở listing sau đây.

**Listing 14.7 Response của request OpenID configuration**

```json
{
    "issuer": "http://localhost:8080",
    "authorization_endpoint":
    "http://localhost:8080/oauth2/authorize",
    "token_endpoint": "http://localhost:8080/oauth2/token",
    "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "client_secret_jwt",
        "private_key_jwt"
    ],
    "jwks_uri": "http://localhost:8080/oauth2/jwks",
    "userinfo_endpoint": "http://localhost:8080/userinfo",
    "response_types_supported": [
        "code"
    ],
    "grant_types_supported": [
        "authorization_code",
        "client_credentials",
        "refresh_token"
    ],
    "revocation_endpoint": "http://localhost:8080/oauth2/revoke",
    "revocation_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "client_secret_jwt",
        "private_key_jwt"
    ],
    "introspection_endpoint":
      "http://localhost:8080/oauth2/introspect",
    "introspection_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "client_secret_jwt",
        "private_key_jwt"
    ],
    "subject_types_supported": [
        "public"
    ],
    "id_token_signing_alg_values_supported": [
        "RS256"
    ],
    "scopes_supported": [
        "openid"
    ]
}
```

- `authorization_endpoint` — Authorization endpoint mà client sẽ chuyển hướng user tới để authentication.
- `token_endpoint` — Token endpoint mà client sẽ gọi để yêu cầu một access token.
- `jwks_uri` — Key-set endpoint mà một resource server sẽ gọi để lấy các public key nó có thể dùng để kiểm chứng token.
- `introspection_endpoint` — Introspection endpoint mà một resource server có thể gọi để kiểm chứng opaque token.

Hãy xem hình 14.4 để nhớ lại luồng authorization code đã bàn ở chương 13. Chúng ta sẽ dùng nó bây giờ để minh họa rằng authorization server chúng ta xây dựng hoạt động tốt.

Vì chúng ta không có một client cho ví dụ của mình, chúng ta cần đóng vai như một client. Giờ khi bạn đã biết authorization endpoint, bạn có thể đặt nó vào thanh địa chỉ trình duyệt để mô phỏng cách client sẽ chuyển hướng user tới đó. Đoạn code kế tiếp cho thấy authorization request:

```
http://localhost:8080/oauth2/authorize?
response_type=code&
client_id=client&
scope=openid&
redirect_uri=https://www.manning.com/authorized&
code_challenge=QYPAZ5NU8yvtlQ9erXrUYR-T5AGCjCF47vN-KsaI2A8&
code_challenge_method=S256
```

![Hình 14.4](images/ch14/ch14-fig04.png)

**Hình 14.4** Authorization code grant type. Sau khi authentication thành công, client nhận một authorization code. Mã này sau đó được client dùng để lấy một access token, thứ tạo điều kiện truy cập các tài nguyên được resource server bảo vệ.

Với authorization request, bạn có thể thấy tôi đã thêm một vài tham số:

- `response_type=code` — Tham số request này chỉ định cho authorization server biết rằng client muốn dùng authorization code grant type. Hãy nhớ rằng một client có thể đã cấu hình nhiều grant type. Nó cần nói cho authorization server biết nó muốn dùng grant type nào.
- `client_id=client` — Định danh client giống như "username" đối với user. Nó định danh client một cách duy nhất trong hệ thống.
- `scope=openid` — Chỉ định client muốn được cấp scope nào với lần thử authentication này.
- `redirect_uri=https://www.manning.com/authorized` — Chỉ định URI mà authorization server sẽ chuyển hướng tới sau một lần authentication thành công. URI này phải là một trong những cái đã được cấu hình trước cho client hiện tại.
- `code_challenge=QYPAZ5NU8yvtlQ…` — Nếu dùng authorization code được tăng cường bằng PKCE (bàn ở chương 13), bạn phải cung cấp code challenge cùng authorization request. Khi yêu cầu token, client phải gửi verifier tương ứng để chứng minh họ chính là ứng dụng đã gửi request này ban đầu. Luồng PKCE được bật mặc định.
- `code_challenge_method=S256` — Tham số request này chỉ định phương pháp hash nào đã được dùng để tạo challenge từ verifier. Trong trường hợp này, `S256` nghĩa là SHA-256 đã được dùng làm hàm hash.

Tôi khuyến nghị dùng authorization code grant type với PKCE, nhưng nếu bạn thực sự cần tắt tính năng tăng cường PKCE của luồng, bạn có thể làm điều đó như trình bày ở đoạn code kế tiếp. Hãy quan sát phương thức `clientSettings()` nhận một instance `ClientSettings`, nơi bạn có thể chỉ định việc tắt proof key for code exchange:

```java
RegisteredClient registeredClient = RegisteredClient
        .withId(UUID.randomUUID().toString())
        .clientId("client")
        // …
        .clientSettings(ClientSettings.builder()
            .requireProofKey(false)
            .build())
        .build();
```

Trong ví dụ này, chúng ta minh họa authorization code với PKCE, vốn là cách mặc định và được khuyến nghị. Bằng cách gửi authorization request qua thanh địa chỉ trình duyệt, chúng ta mô phỏng bước 2 từ hình 14.4. Authorization server sẽ chuyển hướng chúng ta tới trang đăng nhập của nó, và chúng ta có thể authentication bằng username và password. Đây là bước 3 từ hình 14.4. Hình 14.5 cho thấy trang đăng nhập mà authorization server trình bày cho user.

![Hình 14.5](images/ch14/ch14-fig05.png)

**Hình 14.5** Trang đăng nhập mà authorization server trình bày cho user để phản hồi authorization request.

Với hiện thực của chúng ta, chúng ta chỉ có một user (xem listing 14.3). Credential của họ là username `bill` và password `password`. Khi user điền đúng credential và chọn nút Sign In, authorization server chuyển hướng user tới redirect URI được yêu cầu và cung cấp một authorization code (như trình bày ở hình 14.6; bước 4 trong hình 14.4).

![Hình 14.6](images/ch14/ch14-fig06.png)

**Hình 14.6** Sau khi authentication thành công, authorization server dẫn user tới redirect URI đã chỉ định và cấp phát một authorization code. Client sau đó dùng mã này để lấy một access token.

Khi client đã có authorization code, nó có thể yêu cầu một access token. Client có thể yêu cầu access token bằng token endpoint. Đoạn code kế tiếp cho thấy một request cURL lấy token. Request dùng HTTP POST method. Vì chúng ta đã chỉ định rằng HTTP Basic authentication được yêu cầu khi đăng ký client, token request cần authentication bằng HTTP Basic với client ID và secret:

```bash
curl -X POST 'http://localhost:8080/oauth2/token?
client_id=client&
redirect_uri=https://www.manning.com/authorized&
grant_type=authorization_code&
code=ao2oz47zdM0D5gbAqtZVB…&
code_verifier=qPsH306-…' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Các tham số request chúng ta dùng là:

- `client_id=client` — Cần thiết để định danh client
- `redirect_uri=https://www.manning.com/authorized` — Redirect URI mà qua đó authorization server đã cung cấp authorization code sau khi user authentication thành công
- `grant_type=authorization_code` — Cho biết client dùng luồng nào để yêu cầu access token
- `code=ao2oz47zdM0D5…` — Giá trị của authorization code mà authorization server đã cung cấp cho client
- `code_verifier=qPsH306-ZDD…` — Verifier mà dựa trên nó challenge mà client đã gửi lúc authorization được tạo ra

> **NOTE** Hãy chú ý kỹ tới tất cả các chi tiết. Nếu bất kỳ giá trị nào không khớp đúng với những gì app biết hoặc những gì đã được gửi trong authorization request, token request sẽ không thành công.

Đoạn code kế tiếp cho thấy response body của token request. Giờ client có một access token nó có thể dùng để gửi request tới resource server:

```json
{
    "access_token": "eyJraWQiOiI4ODlhNGFmO…",
    "scope": "openid",
    "id_token": "eyJraWQiOiI4ODlhNGFmOS1…",
    "token_type": "Bearer",
    "expires_in": 299
}
```

Vì chúng ta đã bật giao thức OpenID Connect, nên chúng ta không chỉ dựa vào OAuth 2, một ID token cũng có mặt trong token response. Nếu client đã được đăng ký dùng refresh token grant type, một refresh token cũng sẽ được sinh ra và gửi qua response.

---

> ### Sinh code verifier và challenge
>
> Trong ví dụ chúng ta đã làm ở mục này, tôi dùng authorization code với PKCE. Trong các authorization request và token request, tôi dùng giá trị challenge và verifier mà tôi đã sinh trước đó. Tôi không chú ý quá nhiều tới những giá trị này vì chúng là việc của client chứ không phải thứ mà authorization server hay resource server sinh ra. Trong một app thực tế, app JavaScript hoặc mobile của bạn sẽ phải sinh cả hai giá trị khi dùng chúng trong luồng OAuth 2.
>
> Nhưng trong trường hợp bạn thắc mắc, tôi sẽ giải thích cách tôi sinh hai giá trị này trong sidebar này. Bạn tìm thấy ví dụ này trong project `ssia-ch14-ex2`.
>
> Code verifier là một mẩu dữ liệu ngẫu nhiên 32 byte. Để dễ truyền qua một HTTP request, dữ liệu này cần được encode Base64 dùng một URL encoder và không có padding. Đoạn code kế tiếp cho thấy cách làm điều đó trong Java:
>
> ```java
> SecureRandom secureRandom = new SecureRandom();
> byte [] code = new byte[32];
> secureRandom.nextBytes(code);
>
> String codeVerifier = Base64.getUrlEncoder()
>         .withoutPadding()
>         .encodeToString(code);
> ```
>
> Khi đã có code verifier, bạn dùng một hàm hash để sinh challenge. Đoạn code kế tiếp cho thấy cách tạo challenge bằng hàm hash SHA-256. Cũng như với verifier, bạn cần dùng Base64 để chuyển mảng byte thành một giá trị `String`, khiến nó dễ truyền qua HTTP request hơn:
>
> ```java
> MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
>
> byte [] digested = messageDigest.digest(verifier.getBytes());
>
> String codeChallenge = Base64.getUrlEncoder()
>           .withoutPadding()
>           .encodeToString(digested);
> ```
>
> Giờ bạn có một verifier và một challenge. Bạn có thể dùng chúng trong các authorization request và token request như đã bàn ở mục này.

---

## 14.3 Chạy client credentials grant type

Trong mục này, chúng ta sẽ thử client credentials grant type dùng authorization server đã hiện thực ở mục 14.1. Hãy nhớ rằng client grant type là một luồng cho phép client lấy một access token mà không cần user authentication hay đồng ý. Tốt hơn hết, bạn không nên có một client có thể dùng cả một grant type phụ thuộc user (chẳng hạn authorization code) lẫn một grant type độc lập với client (chẳng hạn client credentials).

Như bạn sẽ học ở chương 15, nơi chúng ta bàn về resource server, hiện thực authorization có thể không phân biệt được giữa một access token có được qua authorization code grant type và một cái mà client có được qua client credential grant type. Vậy nên tốt nhất là dùng những đăng ký khác nhau cho những trường hợp như vậy và tốt hơn hết là phân biệt việc sử dụng token qua những scope khác nhau.

Listing 14.8 cho thấy một registered client có thể dùng client credentials grant type. Hãy quan sát rằng tôi cũng đã cấu hình một scope khác. Trong trường hợp này, `"CUSTOM"` chỉ là một cái tên tôi chọn; bạn có thể chọn bất kỳ tên nào cho scope. Cái tên bạn chọn nói chung nên làm cho mục đích của scope dễ hiểu hơn. Ví dụ, nếu app này cần dùng client credentials grant type để lấy một token nhằm kiểm tra trạng thái liveness của resource server, thì có lẽ tốt hơn là đặt tên scope là `"LIVENESS"` để mọi thứ trở nên rõ ràng.

Bạn có thể tìm thấy ví dụ được bàn ở mục này trong project `ssia-ch14-ex3`.

**Listing 14.8 Cấu hình một registered client cho client credentials grant type**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
  RegisteredClient registeredClient =
    RegisteredClient.withId(UUID.randomUUID().toString())
      .clientId("client")
      .clientSecret("secret")
      .clientAuthenticationMethod(
         ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
      .authorizationGrantType(
         AuthorizationGrantType.CLIENT_CREDENTIALS)      // ①
      .scope("CUSTOM")                                   // ②
      .build();

    return new InMemoryRegisteredClientRepository(registeredClient);
}
```

① Cho phép registered client dùng client credentials grant type.

② Cấu hình một scope khớp với mục đích của request lấy access token.

Hình 14.7 cho thấy luồng client credentials mà chúng ta đã bàn ở chương 13. Để lấy một access token, client đơn giản gửi một request và authentication bằng credential của họ (client ID và secret).

![Hình 14.7](images/ch14/ch14-fig07.png)

**Hình 14.7** Client credentials grant type. Một app có thể lấy một access token chỉ bằng cách authentication với credential client của nó.

Đoạn code sau đây cho thấy một token request bằng cURL. Nếu bạn so sánh nó với request chúng ta đã dùng ở mục 14.2 khi chạy authorization code grant type, bạn sẽ thấy cái này đơn giản hơn. Client chỉ cần nêu rằng họ dùng client credentials grant type và scope mà họ yêu cầu token. Client dùng credential của mình với HTTP Basic trên request để authentication:

```bash
curl -X POST 'http://localhost:8080/oauth2/token?
grant_type=client_credentials&
scope=CUSTOM' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Đoạn code kế tiếp cho thấy HTTP response body chứa access token được yêu cầu:

```json
{
    "access_token": "eyJraWQiOiI4N2E3YjJiNS…",
    "scope": "CUSTOM",
    "token_type": "Bearer",
    "expires_in": 300
}
```

---

## 14.4 Sử dụng opaque token và introspection

Cho tới giờ trong chương này, chúng ta đã minh họa authorization code grant type (mục 14.2) và client credentials grant type (mục 14.3). Với cả hai, chúng ta đã cấu hình được những client có thể lấy non-opaque access token. Tuy nhiên, bạn cũng có thể dễ dàng cấu hình client để dùng opaque token. Trong mục này, tôi sẽ cho bạn thấy cách cấu hình registered client để lấy opaque token và cách authorization server giúp kiểm chứng opaque token. Bạn tìm thấy ví dụ được bàn ở mục này trong project `ssia-ch14-ex4`.

Listing 14.9 cho thấy cách cấu hình một registered client để dùng opaque token. Hãy nhớ rằng opaque token có thể dùng với bất kỳ grant type nào. Trong mục này, tôi sẽ dùng client credentials grant type để giữ mọi thứ đơn giản và cho phép bạn tập trung vào chủ đề đang bàn. Bạn cũng có thể sinh opaque token với authorization code grant type.

**Listing 14.9 Cấu hình client để dùng opaque token**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
  RegisteredClient registeredClient =
    RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(
           ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(
           AuthorizationGrantType.CLIENT_CREDENTIALS)
        .tokenSettings(TokenSettings.builder()
           .accessTokenFormat(OAuth2TokenFormat.REFERENCE)        // ①
            .build())
        .scope("CUSTOM")
        .build();

    return new InMemoryRegisteredClientRepository(registeredClient);
  }
```

① Cấu hình client dùng opaque access token.

Nếu bạn yêu cầu một access token như bạn đã học ở mục 14.3, bạn sẽ nhận được một opaque token. Token này ngắn hơn và không chứa dữ liệu. Đoạn code kế tiếp là một request cURL lấy access token:

```bash
curl -X POST 'http://localhost:8080/oauth2/token?
grant_type=client_credentials&
scope=CUSTOM' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Đoạn code sau đây cho thấy response tương tự cái bạn nhận được khi chúng ta mong đợi non-opaque token. Khác biệt duy nhất là chính token, thứ không còn là một JWT token mà là một opaque token:

```json
{
    "access_token": "iED8-...",
    "scope": "CUSTOM",
    "token_type": "Bearer",
    "expires_in": 299
}
```

Đoạn code kế tiếp cho thấy một ví dụ về một opaque token đầy đủ. Lưu ý rằng nó ngắn hơn nhiều và không có cấu trúc giống JWT (ba phần phân tách bởi dấu chấm bị thiếu):

```
iED8-aUd5QLTfihDOTGUhKgKwzhJFzY
WnGdpNT2UZWO3VVDqtMONNdozq1
r9r7RiP0aNWgJipcEu5HecAJ75V
yNJyNuj-kaJvjpWL5Ns7Ndb7Uh6
DI6M1wMuUcUDEjJP
```

Vì một opaque token không chứa dữ liệu, làm sao ai đó có thể kiểm chứng nó và lấy thêm chi tiết về client (và có thể cả user) mà authorization server đã sinh nó cho họ? Cách dễ nhất (và được dùng nhiều nhất) là hỏi trực tiếp authorization server. Authorization server expose một endpoint nơi người ta có thể gửi một request kèm token. Authorization server phản hồi bằng những chi tiết cần thiết về token. Tiến trình này gọi là **introspection** (hình 14.8).

![Hình 14.8](images/ch14/ch14-fig08.png)

**Hình 14.8** Token introspection. Khi dùng opaque token, resource server cần gửi request tới authorization server để khám phá xem token có hợp lệ hay không và thêm chi tiết về việc nó được cấp cho ai.

Đoạn code kế tiếp cho thấy lời gọi cURL tới introspection endpoint mà authorization server expose. Client phải dùng HTTP Basic để authentication bằng credential của họ khi gửi request. Client gửi token dưới dạng một request parameter và nhận chi tiết về token trong response:

```bash
curl -X POST 'http://localhost:8080/oauth2/introspect?token=iED8-…' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Đoạn code kế tiếp cho thấy một ví dụ về response cho introspection request với một token hợp lệ. Khi token hợp lệ, trạng thái của nó xuất hiện là `"active"`, và response cung cấp tất cả chi tiết mà authorization server có về token:

```json
{
    "active": true,
    "sub": "client",
    "aud": [
        "client"
    ],
    "nbf": 1682941720,
    "scope": "CUSTOM",
    "iss": "http://localhost:8080",
    "exp": 1682942020,
    "iat": 1682941720,
    "jti": "ff14b844-1627-4567-8657-bba04cac0370",
    "client_id": "client",
    "token_type": "Bearer"
}
```

Nếu token không tồn tại hoặc đã hết hạn, trạng thái `active` của nó là `false`, như trình bày ở đoạn code kế tiếp:

```json
{
    "active": false
}
```

Thời gian hoạt động mặc định cho một token là 300 giây. Trong các ví dụ, bạn sẽ muốn làm cho vòng đời của token dài hơn. Nếu không, bạn sẽ không có đủ thời gian để dùng token cho việc test, điều này có thể trở nên bực bội. Listing 14.10 cho thấy cách thay đổi thời gian sống của token. Tôi thích làm nó rất dài cho mục đích ví dụ (như 12 giờ trong trường hợp này), nhưng hãy nhớ đừng bao giờ cấu hình nó dài như vậy cho một app thực tế. Trong một app thực, bạn thường sẽ dùng thời gian sống từ 10 đến tối đa 30 phút.

**Listing 14.10 Thay đổi thời gian sống của access token**

```java
RegisteredClient registeredClient = RegisteredClient
        .withId(UUID.randomUUID().toString())
        .clientId("client")
         // …
        .authorizationGrantType(
           AuthorizationGrantType.CLIENT_CREDENTIALS)
        .tokenSettings(TokenSettings.builder()
            .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
            .accessTokenTimeToLive(Duration.ofHours(12))     // ①
            .build())
        .scope("CUSTOM")
        .build();
```

① Đặt 12 giờ làm thời gian sống của access token.

---

## 14.5 Thu hồi token (Revoking tokens)

Giả sử bạn phát hiện một token đã bị đánh cắp. Làm sao bạn có thể khiến một token không còn dùng được? **Token revocation** là một cách để vô hiệu hóa một token mà authorization server đã cấp phát trước đó. Thông thường, vòng đời của một access token là ngắn, nên việc đánh cắp một token vẫn khiến kẻ xấu khó dùng được nó. Nhưng đôi khi bạn muốn cẩn trọng hơn nữa.

Đoạn code sau đây cho thấy một lệnh cURL bạn có thể dùng để gửi một request tới token revocation endpoint mà authorization server expose. Bạn có thể dùng bất kỳ project nào chúng ta đã làm trong chương này để test. Tính năng revocation được kích hoạt mặc định trong một Spring Security authorization server. Request chỉ yêu cầu token bạn muốn thu hồi và HTTP Basic authentication với client credential. Khi bạn gửi request, token không thể dùng được nữa:

```bash
curl -X POST 'http://localhost:8080/oauth2/revoke?token=N7BruErWm-44-…' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Nếu bạn dùng introspection endpoint với một token bạn đã thu hồi, bạn sẽ thấy rằng token không còn active sau khi thu hồi (ngay cả khi thời gian sống của nó chưa hết hạn):

```bash
curl -X POST 'http://localhost:8080/oauth2/introspect?token=N7BruErWm-44-…' \
--header 'Authorization: Basic Y2xpZW50OnNlY3JldA=='
```

Việc dùng token revocation đôi khi hợp lý, nhưng nó không phải thứ bạn luôn mong muốn. Hãy nhớ rằng nếu bạn muốn dùng tính năng revocation, điều này cũng ngụ ý bạn cần dùng introspection (ngay cả với non-opaque token) với mọi lời gọi để kiểm chứng rằng token vẫn còn active. Việc dùng introspection thường xuyên như vậy có thể có tác động lớn tới hiệu năng. Bạn nên luôn tự hỏi: Tôi có thực sự cần tầng bảo vệ bổ sung này không? Hãy nhớ phần thảo luận của chúng ta ở chương đầu tiên. Đôi khi, giấu chìa khóa dưới tấm thảm là đủ; những lúc khác, bạn cần hệ thống báo động phức tạp, tiên tiến và đắt tiền. Bạn dùng gì phụ thuộc vào thứ bạn bảo vệ.

> **Ghi chú của người dịch:** Một số dòng trong các đoạn code của chương này bị PDF gốc cắt cụt ở cuối dòng (thẻ `</artifactId>`, dấu `)` đóng lời gọi `authorizationGrantType(...)`, dấu `)` đóng tham số method, và phần cuối của các lệnh cURL). Phần thiếu đã được khôi phục theo ngữ cảnh để các đoạn code hoàn chỉnh.

---

## Tóm tắt

- Framework Spring Security authorization server giúp bạn xây dựng một OAuth 2/OpenID Connect authorization server tùy chỉnh từ đầu.
- Vì authorization server quản lý chi tiết user và client, bạn phải hiện thực những component định nghĩa cách app thu thập dữ liệu này:
  - Để quản lý chi tiết user, authorization server cần một component Spring Security tương tự như bất kỳ web app nào khác: một hiện thực của `UserDetailsService`.
  - Để quản lý chi tiết client, authorization server cung cấp một contract khác mà bạn phải hiện thực: `RegisteredClientRepository`.
- Bạn có thể đăng ký những client dùng nhiều luồng authentication (grant type) khác nhau. Tốt hơn hết, cùng một client không nên dùng cả luồng phụ thuộc user (như authorization code grant type) lẫn luồng độc lập với user (như client credentials grant type).
- Khi dùng non-opaque token (thường là JWT), bạn cũng phải cấu hình một component để quản lý các cặp khóa mà authorization server dùng để ký token. Component này có tên là `JWKSource`.
- Khi dùng opaque token (những token không chứa dữ liệu), resource server phải dùng introspection endpoint để kiểm chứng tính hợp lệ của một token và thu thập dữ liệu cần thiết cho authorization.
- Đôi khi bạn cần một cách để vô hiệu hóa những token đã được cấp phát. Authorization server cung cấp revocation endpoint cho khả năng này. Khi dùng revocation, resource server phải luôn introspect các token (ngay cả những cái non-opaque) để kiểm chứng tính hợp lệ của chúng.
