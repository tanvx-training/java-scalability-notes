# Chương 16: Triển khai một client OAuth 2

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm**

- Triển khai đăng nhập bằng OAuth 2

- Triển khai một Client OAuth 2 với Spring Security

- Sử dụng phương thức ủy quyền client credentials grant

Thông thường, việc thiết lập giao tiếp giữa các ứng dụng backend là vô cùng cần thiết, đặc biệt là đối với các hệ thống backend gồm nhiều dịch vụ (multi-service). Trong những trường hợp này, khi các hệ thống đã xây dựng cơ chế xác thực và ủy quyền dựa trên OAuth 2, bạn nên xác thực các cuộc gọi giữa các ứng dụng bằng chính phương thức đó. Dù trong một số trường hợp, các lập trình viên thường chọn phương thức xác thực HTTP Basic hoặc API Key (Chương 6) để đơn giản hóa, nhưng để giữ cho hệ thống nhất quán và bảo mật hơn, sử dụng phương thức ủy quyền client credentials grant của OAuth 2 vẫn là lựa chọn tối ưu.

Bạn còn nhớ các thực thể trong mô hình OAuth 2 (Hình 16.1) chứ? Chúng ta đã thảo luận về máy chủ ủy quyền (authorization server) ở Chương 14 và máy chủ tài nguyên (resource server) ở Chương 15. Chương này sẽ dành riêng cho bên khách (client). Chúng ta sẽ thảo luận về cách sử dụng Spring Security để triển khai một Client OAuth 2, cũng như thời điểm và cách thức một ứng dụng backend trở thành client trong hệ thống OAuth 2.

Được rồi, có lẽ Hình 16.1 chưa minh họa đầy đủ những gì chúng ta sắp bàn luận. Chúng ta sẽ bắt đầu bằng việc thảo luận về tính năng đăng nhập dành cho người dùng, nhưng đồng thời cũng tập trung vào cách biến một ứng dụng backend thành client của một ứng dụng backend khác. Các ứng dụng backend được thiết kế với Spring Security cũng có thể đóng vai trò là client. Hình 16.2 trình bày trường hợp còn lại mà chúng ta sẽ thảo luận tại đây. Trong chương này, chúng ta sẽ giải quyết bài toán thiết lập giao tiếp giữa hai ứng dụng backend, biến một trong hai ứng dụng thành một Client OAuth 2 thực thụ. Trong trường hợp đó, chúng ta cần sử dụng Spring Security để xây dựng một Client OAuth 2.

Mục 16.1 sẽ thảo luận về cách dễ dàng triển khai tính năng đăng nhập OAuth 2 cho một ứng dụng web Spring MVC bằng Spring Security. Chúng ta sẽ sử dụng một nhà cung cấp máy chủ ủy quyền bên ngoài, chẳng hạn như Google và GitHub. Bạn sẽ học được cách triển khai tính năng đăng nhập cho ứng dụng của mình, nơi người dùng có thể xác thực bằng tài khoản Google hoặc GitHub của họ. Bằng cách tiếp cận tương tự, bạn cũng có thể triển khai tính năng đăng nhập này với một máy chủ ủy quyền tùy chỉnh (tự sở hữu).

Trong Mục 16.2, chúng ta sẽ áp dụng cách triển khai tùy chỉnh của client thông qua một dịch vụ và thảo luận về việc sử dụng phương thức ủy quyền client credentials grant.

## 16.1 Triển khai đăng nhập bằng OAuth 2

Phần này thảo luận về cách triển khai tính năng đăng nhập bằng OAuth 2 cho ứng dụng web Spring của bạn. Với Spring Boot, việc cấu hình xác thực cho các trường hợp tiêu chuẩn (những trường hợp mà máy chủ ủy quyền đáp ứng chính xác các đặc tả của OAuth 2 và OpenID Connect) là vô cùng dễ dàng. Chúng ta sẽ bắt đầu với một trường hợp điển hình (mà bạn có thể áp dụng với hầu hết các nhà cung cấp phổ biến như Google, GitHub, Facebook và Okta).

Sau đó, tôi sẽ chỉ cho bạn những gì diễn ra đằng sau hậu trường của cấu hình tự động, nhờ đó bạn có thể xử lý cả các trường hợp tùy chỉnh. Sau phần này, bạn sẽ có thể triển khai tính năng đăng nhập cho ứng dụng web Spring của mình với bất kỳ nhà cung cấp OAuth 2 nào, thậm chí cho phép người dùng lựa chọn giữa nhiều nhà cung cấp khác nhau khi xác thực.

### 16.1.1 Triển khai xác thực với một nhà cung cấp phổ biến

Trong phần này, chúng ta sẽ triển khai trường hợp đăng nhập đơn giản nhất, cho phép người dùng ứng dụng đăng nhập bằng một nhà cung cấp duy nhất. Trong phần minh họa này, tôi chọn Google làm nhà cung cấp dịch vụ xác thực cho người dùng.

Chúng ta bắt đầu bằng cách thêm một vài tài nguyên vào dự án để triển khai một ứng dụng web Spring đơn giản có khả năng đăng nhập nêu trên. Đoạn mã 16.1 trình bày các dependency cho ứng dụng demo. Bạn có thể tìm thấy ứng dụng này trong dự án mẫu `ssia-ch16-ex1`. Bạn sẽ nhận ra một dependency mới mà chúng ta chưa từng sử dụng ở các chương trước: dependency dành cho Client OAuth 2.

**Đoạn mã 16.1 Các dependency cần thiết cho phần minh họa**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
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

Nếu bạn cần ôn lại cách xây dựng ứng dụng web với Spring Boot, Chương 7 và 8 của cuốn Spring Start Here (Manning, 2020) — một cuốn sách khác do tôi viết — sẽ giúp bạn nhanh chóng củng cố lại những kiến thức này. Đoạn mã dưới đây thể hiện một controller đơn giản của ứng dụng web demo, vốn chỉ có duy nhất một trang chủ:

```java
@Controller
public class HomeController {
    @GetMapping("/")
    public String home() {
        return "index.html";
    }
}
```

Đoạn mã tiếp theo thể hiện trang HTML demo ngắn gọn mà chúng ta mong muốn truy cập sau khi quá trình xác thực hoàn tất thành công:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    <h1>Home</h1>
</body>
</html>
```

Đoạn mã 16.2 trình bày cấu hình đăng nhập OAuth 2 làm phương thức xác thực cho ứng dụng web. Việc cấu hình ứng dụng theo cách này sẽ tự động áp dụng phương thức ủy quyền authorization code grant, chuyển hướng người dùng đến đăng nhập tại một máy chủ ủy quyền cụ thể, và chuyển hướng họ quay trở lại sau khi xác thực thành công. Quy trình này tuân thủ chính xác những gì chúng ta đã thảo luận từ Chương 13 đến Chương 15 và đã được minh họa nhiều lần trong các chương đó bằng cURL.

**Đoạn mã 16.2 Cấu hình đăng nhập OAuth 2**

```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2Login(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}
```

Tôi cá là bạn đang nghĩ: Chẳng phải chúng ta vẫn phải điền đầy đủ các thông tin chi tiết đã học ở Chương 13 đến 15 sao, ví dụ như URL ủy quyền, URL token, client ID, client secret, v.v.? Đúng vậy, tất cả những thông tin đó đều cần thiết. Nhưng thật may mắn, Spring Security sẽ một lần nữa hỗ trợ bạn. Nếu ứng dụng của bạn sử dụng một trong các nhà cung cấp mà Spring Security coi là phổ biến (well-known), hầu hết các thông tin chi tiết này đã được điền sẵn. Bạn chỉ cần cấu hình thông tin xác thực client (client credentials) của ứng dụng. Spring Security mặc định hỗ trợ sẵn các nhà cung cấp phổ biến sau:

- Google

- GitHub

- Okta

- Facebook

Spring Security cấu hình sẵn các thông tin chi tiết cho các nhà cung cấp này trong lớp `CommonOAuth2Provider`. Do đó, nếu sử dụng bất kỳ nhà cung cấp nào trong số này, bạn chỉ cần cấu hình client credentials trong tệp thuộc tính (properties) của ứng dụng là hệ thống có thể hoạt động được ngay. Đoạn mã dưới đây hiển thị hai thuộc tính bạn cần để cấu hình client ID và client secret khi sử dụng Google (tôi đã rút gọn giá trị thông tin xác thực của mình):

```properties
spring.security.oauth2.client.registration.google.client-id=790…
spring.security.oauth2.client.registration.google.client-secret=GOC…
```

Ở đây tôi giả định rằng bạn đã đăng ký ứng dụng của mình trên Google Developer Console — đó là nơi bạn nhận được bộ thông tin xác thực duy nhất cho ứng dụng của mình. Nếu bạn chưa từng làm việc này và muốn cấu hình xác thực bằng Google cho ứng dụng, bạn có thể tìm thấy tài liệu hướng dẫn chi tiết của Google về cách đăng ký ứng dụng OAuth 2 tại địa chỉ http://mng.bz/eEvz. Hình 16.3 minh họa cách ứng dụng hiển thị giao diện đăng nhập Google khi nhà cung cấp phổ biến này được cấu hình đúng cách.

### 16.1.2 Cung cấp cho người dùng nhiều lựa chọn hơn

Chắc chắn bạn đã trải nghiệm internet đủ nhiều để nhận thấy rằng rất nhiều ứng dụng cung cấp cho người dùng nhiều hơn một phương thức đăng nhập. Đôi khi, bạn thậm chí có thể chọn giữa bốn hoặc năm nhà cung cấp để đăng nhập vào một ứng dụng. Cách tiếp cận này rất có lợi vì không phải ai trong chúng ta cũng có sẵn tài khoản trên một mạng xã hội nhất định. Có người dùng Facebook, nhưng người khác lại thích dùng LinkedIn hơn. Một số lập trình viên thích đăng nhập bằng tài khoản GitHub, trong khi những người khác lại sử dụng địa chỉ Gmail của họ.

Với Spring Security, bạn có thể triển khai tính năng này một cách cực kỳ đơn giản, ngay cả khi sử dụng nhiều nhà cung cấp. Giả sử tôi muốn cho phép người dùng ứng dụng đăng nhập bằng cả Google hoặc GitHub. Tôi chỉ cần cấu hình thông tin xác thực cho cả hai nhà cung cấp theo cách tương tự. Đoạn mã sau đây hiển thị các thuộc tính cần thiết trong tệp `application.properties` để thêm GitHub làm một phương thức xác thực. Hãy nhớ rằng bạn phải giữ lại các thuộc tính đã cấu hình cho Google ở Mục 16.1.1:

```properties
spring.security.oauth2.client.registration.github.client-id=03…
spring.security.oauth2.client.registration.github.client-secret=c5d…
```

Tương tự như bất kỳ nhà cung cấp nào khác, trước tiên bạn phải đăng ký ứng dụng của mình, sau đó cấu hình client ID và client secret trong tệp `application.properties`. Quy trình đăng ký ứng dụng sẽ khác nhau tùy theo từng nhà cung cấp. Đối với GitHub, bạn có thể tìm thấy tài liệu hướng dẫn đăng ký ứng dụng tại địa chỉ http://mng.bz/p1YG.

Trước khi yêu cầu bạn xác thực, ứng dụng sẽ đưa ra hai tùy chọn đăng nhập mà chúng ta đã cấu hình trước đó (Hình 16.4). Bạn phải chọn Google hoặc GitHub để đăng nhập. Sau khi chọn nhà cung cấp mong muốn, ứng dụng sẽ chuyển hướng bạn đến trang xác thực riêng của nhà cung cấp đó.

### 16.1.3 Sử dụng máy chủ ủy quyền tùy chỉnh

Spring Security định nghĩa sẵn một danh sách gồm bốn nhà cung cấp phổ biến như đã thảo luận ở Mục 16.1.1 và 16.1.2. Nhưng nếu bạn muốn sử dụng một nhà cung cấp không nằm trong danh sách này thì sao? Bạn vẫn còn nhiều giải pháp thay thế khác như LinkedIn, Twitter, Yahoo, v.v. Hoặc bạn có thể muốn sử dụng chính máy chủ ủy quyền tùy chỉnh do mình tự xây dựng như đã học ở Chương 14.

Bạn hoàn toàn có thể cấu hình đăng nhập OAuth 2 với bất kỳ nhà cung cấp nào, kể cả máy chủ tùy chỉnh do bạn tự xây dựng. Trong phần này, chúng ta sẽ sử dụng máy chủ ủy quyền đã xây dựng ở Chương 14 để minh họa cách cấu hình đăng nhập OAuth 2 tùy chỉnh. Để giúp bạn dễ theo dõi và giữ cho các ví dụ độc lập với nhau, tôi đã sao chép nội dung của dự án `ssia-ch14-ex1` (được thảo luận ở Chương 14) vào một dự án mới cho chương này với tên gọi `ssia-ch16-ex1-as`.

Chúng ta chỉ cần đảm bảo rằng cấu hình client của mình khớp với những gì muốn triển khai trong chương này. Đoạn mã 16.2 cho thấy client đã được đăng ký và cấu hình trong máy chủ ủy quyền của chúng ta. Điều quan trọng nhất ở đây là phải đảm bảo URI chuyển hướng (redirect URI) khớp với URI mà ứng dụng (nơi chúng ta triển khai chức năng đăng nhập) mong đợi nhận được:

```
http://localhost:8080/login/oauth2/code/my_authorization_server
```

Hình 16.5 phân tích cấu trúc của redirect URI. Hãy quan sát rằng redirect URI tiêu chuẩn sử dụng đường dẫn `/login/oauth2/code` theo sau là tên của máy chủ ủy quyền. Trong ví dụ này, tên tôi đặt cho máy chủ ủy quyền là `my_authorization_server`.

Đoạn mã tiếp theo trình bày phần cấu hình đăng ký thông tin chi tiết của client từ phía máy chủ ủy quyền. Bạn sẽ cần đến các thông tin chi tiết này ở phần sau của mục này; chúng ta cũng sẽ cấu hình chúng ở phía ứng dụng client.

**Đoạn mã 16.3 Thông tin chi tiết của client được đăng ký phía máy chủ ủy quyền**

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
    var registeredClient = RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("http://localhost:8080/login/oauth2/code/my_authorization_server" […]
        .scope(OidcScopes.OPENID)
        .build();

    return new InMemoryRegisteredClientRepository(registeredClient);
}
```

Hãy nhớ rằng, bạn không thể khởi chạy hai ứng dụng sử dụng cùng một cổng (port) trên cùng một hệ thống. Vì ứng dụng web đã sử dụng cổng 8080, chúng ta phải chuyển cổng của máy chủ ủy quyền sang một cổng khác. Như được trình bày trong đoạn mã dưới đây, tôi chọn cổng 7070 cho ví dụ này và cấu hình nó trong tệp `application.properties`:

```properties
server.port=7070
```

Bây giờ chúng ta có thể chuyển sang cấu hình của ứng dụng web. Vì đã sử dụng một nhà cung cấp phổ biến trong các ví dụ ở Mục 16.1.1 và 16.1.2, chúng ta không cần phải định nghĩa nó. Spring Security đã biết rõ mọi thông tin chi tiết cần thiết về các nhà cung cấp phổ biến. Tuy nhiên, để sử dụng một nhà cung cấp khác, chúng ta cần phải tự cấu hình một vài thứ. Spring Security cần biết những thông tin sau (như đã thảo luận ở Chương 13 và 14):

- Endpoint ủy quyền (authorization endpoint) của nhà cung cấp để biết nơi cần chuyển hướng người dùng trong luồng mã ủy quyền (authorization code flow).

- Endpoint lấy token (token endpoint) mà ứng dụng phải gọi để nhận access token.

- Endpoint chứa tập hợp khóa (key set endpoint) mà ứng dụng cần để xác thực các access token.

Tin vui là nếu nhà cung cấp (máy chủ ủy quyền) của bạn tuân thủ đúng giao thức OpenID Connect, bạn chỉ cần cấu hình URI nhà phát hành (issuer URI). Sau đó, ứng dụng sẽ sử dụng issuer URI để tìm kiếm tất cả các thông tin chi tiết cần thiết khác, chẳng hạn như URI ủy quyền, URI token và URI tập hợp khóa. Nếu máy chủ ủy quyền không tuân thủ giao thức OpenID Connect, bạn sẽ phải cấu hình rõ ràng ba thông tin chi tiết này trong tệp `application.properties`.

Vì các máy chủ ủy quyền chúng ta xây dựng ở Chương 14 đều triển khai đúng giao thức OpenID Connect, chúng ta có thể dựa vào issuer URI. Đoạn mã tiếp theo hướng dẫn cách cấu hình issuer URI. Hãy chú ý rằng tôi đã đặt tên cho nhà cung cấp này. Trong ví dụ này, tôi chọn định danh nó bằng tên `my_authorization_server`, nhưng bạn có thể chọn bất kỳ tên nào khác để định danh nhà cung cấp của mình:

```properties
spring.security.oauth2.client.provider.my_authorization_server.issuer-uri=http://127.0 […]
```

> **LƯU Ý** Chúng ta đang chạy cả hai ứng dụng, máy chủ ủy quyền và ứng dụng web, trên cùng một hệ thống cục bộ (local). Việc chạy các ứng dụng này trên cùng một hệ thống và truy cập chúng từ trình duyệt có thể gây ra xung đột với cookie mà trình duyệt sử dụng để lưu trữ phiên làm việc (session) của người dùng. Vì lý do này, tôi khuyên bạn nên sử dụng địa chỉ IP "127.0.0.1" để tham chiếu đến một ứng dụng và tên miền "localhost" cho ứng dụng còn lại. Mặc dù cả hai đều giống nhau về mặt mạng và đều trỏ tới cùng một hệ thống (máy cục bộ), trình duyệt sẽ coi chúng là hai nguồn khác nhau, nhờ đó quản lý các phiên làm việc một cách chính xác. Trong ví dụ này, tôi sử dụng "127.0.0.1" cho máy chủ ủy quyền và "localhost" cho ứng dụng web.

Đoạn mã 16.4 trình bày cấu hình đăng ký client. Ngoài việc khai báo nhà cung cấp là ai, phần cấu hình đăng ký client này cũng dài hơn một chút so với những gì chúng ta đã viết ở Mục 16.1.1 và 16.1.2 khi sử dụng các nhà cung cấp phổ biến. Bên cạnh client ID và client secret, bạn cũng cần điền các thông tin sau:

- Tên nhà cung cấp (provider name) — Tên bạn đặt cho nhà cung cấp mà bạn muốn sử dụng trong trường hợp đó không phải là nhà cung cấp phổ biến.

- Phương thức xác thực client (client authentication method) — Phương thức xác thực của ứng dụng để gọi đến các endpoint được bảo mật của nhà cung cấp (thường là HTTP Basic).

- URI chuyển hướng (redirect URI) — URI mà ứng dụng mong đợi nhà cung cấp sẽ chuyển hướng người dùng quay lại sau khi xác thực thành công. URI này phải trùng khớp với một trong những URI đã đăng ký ở phía máy chủ ủy quyền (xem Đoạn mã 16.3).

- Phạm vi yêu cầu của ứng dụng web (scope) — Phạm vi truy cập mà ứng dụng web yêu cầu, chỉ được phép là một trong những phạm vi đã đăng ký ở phía máy chủ ủy quyền (xem Đoạn mã 16.3).

**Đoạn mã 16.4 Cấu hình đăng ký client**

```properties
spring.security.oauth2.client.registration.my_authorization_server.client-id=client
spring.security.oauth2.client.registration.my_authorization_server.client-name=Custom […]
spring.security.oauth2.client.registration.my_authorization_server.client-secret=secre […]
spring.security.oauth2.client.registration.my_authorization_server.provider=my_authori […]
spring.security.oauth2.client.registration.my_authorization_server.client-authenticati […]
spring.security.oauth2.client.registration.my_authorization_server.redirect-uri=http:/ […]
spring.security.oauth2.client.registration.my_authorization_server.scope[0]=openid
```

Bây giờ bạn có thể khởi chạy máy chủ ủy quyền và ứng dụng web. Hãy nhớ rằng bạn phải khởi động máy chủ ủy quyền trước. Khi ứng dụng web khởi chạy, nó sẽ gọi tới issuer URI để lấy các thông tin chi tiết còn lại cần thiết. Sau khi đã khởi động thành công cả hai ứng dụng, hãy truy cập ứng dụng web trên trình duyệt bằng địa chỉ http://localhost:8080. Hình 16.6 cho thấy nhà cung cấp tùy chỉnh hiện đã xuất hiện trong danh sách và người dùng có thể lựa chọn để xác thực.

### 16.1.4 Tăng tính linh hoạt cho cấu hình của bạn

Thông thường, chúng ta cần sự linh hoạt cao hơn những gì các tệp cấu hình thuộc tính (properties) có thể cung cấp. Đôi khi, chúng ta cần thay đổi thông tin xác thực một cách động mà không cần phải triển khai lại ứng dụng. Trong các trường hợp khác, chúng ta muốn bật hoặc tắt các nhà cung cấp cụ thể, hoặc thậm chí cấp quyền truy cập dựa trên một logic định trước. Với những yêu cầu như vậy, việc khai báo thông tin xác thực trong tệp thuộc tính rồi để Spring Boot tự động xử lý phép màu sẽ không còn khả thi nữa.

Tuy nhiên, nếu hiểu rõ những gì diễn ra đằng sau hậu trường, bạn hoàn toàn có thể tùy biến các thông tin chi tiết của nhà cung cấp theo ý muốn. Chỉ có hai kiểu dữ liệu cốt lõi mà bạn cần ghi nhớ:

- `ClientRegistration` — Đối tượng này được sử dụng để định nghĩa các thông tin chi tiết mà client cần để giao tiếp với máy chủ ủy quyền (thông tin xác thực, redirect URI, URI ủy quyền, v.v.).

- `ClientRegistrationRepository` — Giao ước (contract) này được triển khai để định nghĩa logic truy xuất các đăng ký client. Ví dụ, bạn có thể tự triển khai một kho lưu trữ đăng ký client để yêu cầu ứng dụng lấy thông tin đăng ký từ một cơ sở dữ liệu hoặc một kho lưu trữ bảo mật tùy chỉnh (vault).

Trong ví dụ này, tôi sẽ giữ mọi thứ đơn giản. Tôi sẽ tiếp tục sử dụng tệp `application.properties` nhưng với các tên thuộc tính khác để chứng minh rằng Spring Boot không còn tự động cấu hình mọi thứ cho chúng ta nữa. Dù đơn giản, ví dụ này vẫn minh họa chính xác cách tiếp cận mà bạn sẽ sử dụng nếu muốn lưu trữ các thông tin chi tiết trong cơ sở dữ liệu hoặc lấy chúng bằng cách gọi một endpoint cho trước. Trong bất kỳ trường hợp nào như vậy, bạn đều phải tự triển khai giao ước `ClientRegistrationRepository` một cách phù hợp.

Bạn định nghĩa thành phần `ClientRegistrationRepository` như một Spring bean. Ứng dụng sẽ sử dụng bản triển khai của bạn để lấy thông tin chi tiết về đăng ký client. Đoạn mã 16.5 trình bày một ví dụ sử dụng bản triển khai lưu trữ trong bộ nhớ (in-memory). Trong ví dụ này, tôi thực hiện ba việc:

1. Tiêm (inject) các giá trị thông tin xác thực từ tệp thuộc tính.

2. Tạo một đối tượng `ClientRegistration` với đầy đủ các thông tin chi tiết cần thiết.

3. Cấu hình nó trong một bản triển khai `ClientRegistrationRepository` dạng in-memory.

Bạn có thể tìm thấy ví dụ này trong dự án mẫu `ssia-ch16-ex2`.

**Đoạn mã 16.5 Triển khai logic tùy chỉnh**

```java
@Configuration
public class SecurityConfig {
    @Value("${client-id}")
    private String clientId;

    @Value("${client-secret}")
    private String clientSecret;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2Login(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(
            this.googleClientRegistration()
        );
    }

    private ClientRegistration googleClientRegistration() {
        return CommonOAuth2Provider.GOOGLE.getBuilder("google")
            .clientId(clientId)
            .clientSecret(clientSecret)
            .build();
    }
}
```

### 16.1.5 Quản lý ủy quyền đối với đăng nhập bằng OAuth 2

Trong phần này, chúng ta sẽ thảo luận về việc sử dụng thông tin chi tiết của quá trình xác thực. Trong hầu hết các trường hợp, ứng dụng của bạn cần biết ai đã đăng nhập. Yêu cầu này dùng để hiển thị giao diện khác nhau hoặc để áp dụng các hạn chế ủy quyền khác nhau. Thật may mắn, việc sử dụng phương thức xác thực `oauth2Login()` không có gì khác biệt so với bất kỳ phương thức xác thực nào khác ở khía cạnh này. Hãy nhớ lại mô hình thiết kế xác thực của Spring Security mà chúng ta đã thảo luận từ Chương 2 (được tái hiện trong Hình 16.7). Quá trình xác thực thành công luôn kết thúc bằng việc ứng dụng thêm các thông tin chi tiết của phiên xác thực vào ngữ cảnh bảo mật (security context). Việc sử dụng `oauth2Login()` cũng không ngoại lệ.

Khi đã biết thông tin xác thực nằm trong security context, bạn có thể sử dụng chúng hoàn toàn tương tự như với bất kỳ phương thức xác thực nào đã thảo luận trước đó — `httpBasic()`, `formLogin()`, hay `oauth2ResourceServer()`:

- Bạn có thể tiêm đối tượng `Authentication` làm tham số của phương thức.

- Bạn có thể lấy nó từ security context ở bất kỳ nơi nào trong ứng dụng (`SecurityContextHolder.getContext().getAuthentication()`).

- Bạn có thể sử dụng các annotation kiểm tra trước/sau (pre-/post-annotations) như đã thảo luận ở Chương 11 và 12.

Bạn có thể sử dụng giao ước `Authentication` để lấy các thông tin người dùng cơ bản như username và các quyền truy cập (authorities). Nếu cần các thông tin chi tiết tùy chỉnh, bạn có thể sử dụng trực tiếp bản triển khai của giao ước này, như trình bày trong Đoạn mã 16.6. Đối với OAuth 2, lớp `OAuth2AuthenticationPrincipal` định nghĩa bản triển khai của giao ước này. Tuy nhiên, hãy nhớ rằng để đảm bảo khả năng bảo trì của mã nguồn, tôi khuyên bạn nên sử dụng giao ước `Authentication` bất cứ khi nào có thể và chỉ nên dựa vào bản triển khai cụ thể khi không còn lựa chọn nào khác (ví dụ: khi bạn cần lấy một thông tin chi tiết mà tham chiếu của giao ước không cung cấp).

```java
// Đoạn mã 16.6 Lấy thông tin chi tiết của phiên xác thực
@Controller
public class HomeController {
    @GetMapping("/")
    public String home(OAuth2AuthenticationToken authentication) {
        // xử lý thông tin xác thực tại đây
        return "index.html";
    }
}
```

## 16.2 Triển khai một Client OAuth 2

Phần này thảo luận về việc triển khai một dịch vụ đóng vai trò là một Client OAuth 2. Trong các hệ thống phát triển theo kiến trúc hướng dịch vụ (service-oriented), các ứng dụng thường xuyên phải giao tiếp với nhau. Khi đó, ứng dụng gửi yêu cầu đến một ứng dụng khác sẽ trở thành client của ứng dụng nhận yêu cầu. Trong hầu hết các trường hợp, nếu chúng ta quyết định triển khai xác thực cho các yêu cầu qua giao thức OAuth 2, ứng dụng client sẽ sử dụng phương thức ủy quyền client credentials grant để lấy một access token.

Phương thức ủy quyền client credentials grant không liên quan đến một người dùng cụ thể. Vì lý do đó, bạn sẽ không cần đến một redirect URI hay một URI ủy quyền. Thông tin xác thực client (client credentials) là đủ để cho phép một client tự xác thực và lấy access token bằng cách gửi yêu cầu đến URI chứa token. Hình 16.8 nhắc lại luồng hoạt động của phương thức client credentials grant đã thảo luận ở Chương 13.

Hãy cùng xây dựng một ví dụ đơn giản để làm rõ mọi thứ bạn cần biết về việc triển khai các khả năng của Client OAuth 2 với Spring Security. Chúng ta sẽ xây dựng một ứng dụng sử dụng phương thức client credentials grant để lấy access token từ một máy chủ ủy quyền. Để đơn giản hóa ví dụ, chúng ta sẽ chỉ thảo luận về việc lấy access token. Việc bạn tạo yêu cầu như thế nào không quan trọng đối với mục đích minh họa của chúng ta. Miễn là bạn biết cách lấy access token, bạn có thể gửi yêu cầu HTTP bằng bất kỳ cách nào, vì mọi công nghệ đều cho phép bạn dễ dàng thêm giá trị header vào yêu cầu (hãy nhớ rằng bạn cần thêm giá trị access token vào header `Authorization` của yêu cầu với tiền tố "Bearer ").

Vì vậy, những gì chúng ta sẽ thực hiện cụ thể trong ví dụ này là cấu hình một ứng dụng để lấy access token từ một máy chủ ủy quyền OAuth 2 bằng phương thức client credentials grant. Để chứng minh rằng chúng ta đã lấy access token thành công, chúng ta sẽ trả nó về trong phần thân phản hồi (response body) của một endpoint demo. Hình 16.9 minh họa mô hình mà chúng ta muốn xây dựng. Các bước được trình bày trong hình bao gồm:

1. Người dùng (là bạn) gọi đến một endpoint demo có tên là `/token` bằng cách sử dụng cURL (hoặc một công cụ thay thế như Postman).

2. Công cụ (cURL) mô phỏng một ứng dụng gửi yêu cầu đến ứng dụng mà chúng ta xây dựng cho ví dụ này.

3. Ứng dụng của chúng ta sử dụng phương thức client credentials grant để lấy một access token từ máy chủ ủy quyền.

4. Ứng dụng trả lại giá trị access token cho client trong phần thân của phản hồi HTTP.

5. Người dùng (là bạn) nhận được giá trị access token trong phần thân phản hồi HTTP.

Chúng ta sẽ sử dụng cùng một máy chủ ủy quyền mà bạn đã xây dựng ở Chương 14, bạn có thể tìm thấy mã nguồn của nó dành cho chương này trong dự án `ssia-ch16-ex1-as`. Hãy nhớ trước tiên phải thêm một đăng ký client vào máy chủ ủy quyền cho phép sử dụng phương thức client credentials grant. Bạn có thể chỉnh sửa client đã cấu hình trước đó ở Chương 14 (như trình bày trong đoạn mã tiếp theo) hoặc thêm một đăng ký client thứ hai đáp ứng yêu cầu này.

```java
// Đoạn mã 16.7 Thông tin chi tiết của client được đăng ký phía máy chủ ủy quyền
@Bean
public RegisteredClientRepository registeredClientRepository() {
    var registeredClient = RegisteredClient
        .withId(UUID.randomUUID().toString())
        .clientId("client")
        .clientSecret("secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
        .scope(OidcScopes.OPENID)
        .build();
    return new InMemoryRegisteredClientRepository(registeredClient);
}
```

Tương tự như các phương thức xác thực khác, Spring Security cung cấp một phương thức trên đối tượng `HttpSecurity` để cấu hình một ứng dụng làm Client OAuth 2. Hãy gọi phương thức `oauth2Client()` như trình bày trong đoạn mã dưới đây để cấu hình ứng dụng làm Client OAuth 2.

```java
// Đoạn mã 16.8 Cấu hình xác thực cho Client OAuth 2
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.oauth2Client(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().permitAll());
        return http.build();
    }
}
```

Ứng dụng cũng cần biết một số thông tin chi tiết để gửi yêu cầu lấy access token đến máy chủ ủy quyền. Như bạn đã học ở Mục 16.1, chúng ta cung cấp các thông tin này thông qua một thành phần `ClientRegistrationRepository`. Bạn có thể thấy đoạn mã 16.9 trông rất quen thuộc vì nó tương tự như đoạn mã chúng ta đã viết ở Đoạn mã 16.4.

Tuy nhiên, vì tôi không sử dụng một nhà cung cấp phổ biến, tôi phải chỉ định chi tiết hơn, chẳng hạn như scope, URI của token và phương thức xác thực. Hãy chú ý rằng tôi đã cấu hình phương thức ủy quyền là client credentials.

```java
// Đoạn mã 16.9 Cấu hình thông tin đăng ký client cho ứng dụng client
@Configuration
public class ProjectConfig {
    // Phần mã được lược bỏ
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        ClientRegistration c1 = ClientRegistration.withRegistrationId("1")
            .clientId("client")
            .clientSecret("secret")
            .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC […]
            .tokenUri("http://localhost:7070/oauth2/token")
            .scope(OidcScopes.OPENID)
            .build();
        var repository = new InMemoryClientRegistrationRepository(c1);
        return repository;
    }
}
```

Một thành phần quản lý client (client manager) sẽ thực hiện yêu cầu cần thiết để lấy access token. Hình 16.10 minh họa mối quan hệ giữa controller và client manager (trong ví dụ của chúng ta).

Giao diện `OAuth2AuthorizedClientManager` định nghĩa một client manager. Đoạn mã tiếp theo cấu hình một client manager dưới dạng một bean trong ngữ cảnh của ứng dụng.

```java
// Đoạn mã 16.10 Triển khai một bộ quản lý Client OAuth 2
@Configuration
public class ProjectConfig {
    // Phần mã được lược bỏ
    @Bean
    public OAuth2AuthorizedClientManager oAuth2AuthorizedClientManager(
        ClientRegistrationRepository clientRegistrationRepository,
        OAuth2AuthorizedClientRepository auth2AuthorizedClientRepository
    ) {
        var provider = OAuth2AuthorizedClientProviderBuilder.builder()
            .clientCredentials()
            .build();
        var cm = new DefaultOAuth2AuthorizedClientManager(
            clientRegistrationRepository,
            auth2AuthorizedClientRepository);
        cm.setAuthorizedClientProvider(provider);
        return cm;
    }
}
```

Bây giờ bạn có thể sử dụng client manager ở bất kỳ nơi nào cần lấy access token. Như được trình bày trong Hình 16.10, tôi đã để controller trực tiếp sử dụng client manager nhằm đơn giản hóa ví dụ này và giúp bạn tập trung vào nội dung thảo luận về việc triển khai một Client OAuth 2. Hãy nhớ rằng một ứng dụng thực tế sẽ phức tạp hơn thế nhiều. Trong một thiết kế phân chia đúng trách nhiệm của các đối tượng, client manager thường sẽ được sử dụng bởi một đối tượng ủy quyền (proxy object) chứ không phải trực tiếp bởi một controller (Hình 16.11).

Đoạn mã tiếp theo trình bày cách tiêm instance của client manager và minh họa việc lấy access token thông qua một endpoint. Khi gọi endpoint `/token` mà ứng dụng cung cấp, phần thân phản hồi sẽ chứa giá trị của access token.

```java
// Đoạn mã 16.11 Sử dụng bộ quản lý Client OAuth 2 để lấy token
@RestController
public class DemoController {
    private final OAuth2AuthorizedClientManager clientManager;

    // Constructor được lược bỏ

    @GetMapping("/token")
    public String token() {
        OAuth2AuthorizeRequest request = OAuth2AuthorizeRequest
            .withClientRegistrationId("1")
            .principal("client")
            .build();
        var client = clientManager.authorize(request);
        return client.getAccessToken().getTokenValue();
    }
}
```

Sử dụng lệnh cURL sau để gọi endpoint mà ứng dụng cung cấp:

```bash
curl http://localhost:8080/token
```

Phần thân phản hồi sẽ chứa giá trị của một access token, tương tự như:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImJpbGwiLCJpY […]
```

## Tóm tắt

- Khi triển khai một ứng dụng web Spring, chúng ta thường phải cấu hình các chức năng xác thực. Trong khi chúng ta có thể nhanh chóng triển khai một biểu mẫu đăng nhập bằng phương thức `formLogin()`, chúng ta cũng có thể cho phép người dùng xác thực thông qua một hệ thống khác bằng tài khoản đã đăng ký.

- Việc cho phép người dùng chọn một hệ thống khác để đăng nhập mang lại nhiều lợi thế cho cả người dùng lẫn ứng dụng của chúng ta. Người dùng không cần phải ghi nhớ thêm thông tin xác thực phụ, và ứng dụng của chúng ta cũng không cần phải quản lý thông tin xác thực cho tất cả người dùng của mình. Spring Security coi GitHub, Google, Facebook và Okta là các nhà cung cấp phổ biến. Đối với các nhà cung cấp phổ biến, Spring Security đã biết rõ tất cả các thông tin chi tiết để thiết lập yêu cầu qua framework OAuth 2, vì vậy bạn chỉ cần cấu hình thông tin xác thực client mà nhà cung cấp cung cấp để thiết lập chức năng đăng nhập.

- Bạn có thể cấu hình ứng dụng của mình để sử dụng các nhà cung cấp khác ngoài những nhà cung cấp phổ biến, nhưng bạn cần cấu hình rõ ràng tất cả các thông tin chi tiết mà ứng dụng cần để thiết lập các luồng ủy quyền nhằm lấy access token. Các thông tin chính bạn cần cấu hình là ba URI: URI ủy quyền, URI token và URI tập hợp khóa.

- Khi người dùng đăng nhập vào ứng dụng của bạn, ngay cả khi họ được xác thực thông qua một hệ thống bên ngoài, ứng dụng vẫn nhận được thông tin chi tiết về họ và lưu trữ các thông tin đó trong security context. Quá trình này tuân theo thiết kế xác thực tiêu chuẩn của Spring Security. Vì lý do này, bạn có thể cấu hình ủy quyền hoàn toàn tương tự như tất cả các phương thức xác thực khác.

- Đôi khi, một dịch vụ backend sẽ đóng vai trò là client cho một ứng dụng backend khác. Trong trường hợp đó, một ứng dụng muốn gọi một ứng dụng khác và sử dụng phương pháp OAuth 2 cần phải có một access token để được ứng dụng nhận cuộc gọi xác thực. Một dịch vụ có thể sử dụng phương thức ủy quyền client credentials grant để lấy access token.

- Spring Security cung cấp một đối tượng gọi là client manager. Đối tượng này triển khai logic để thực thi một phương thức ủy quyền cụ thể và lấy access token. Lớp proxy của một ứng dụng gửi các yêu cầu đến ứng dụng khác và cần xác thực các yêu cầu bằng access token sẽ sử dụng client manager để lấy access token đó.
