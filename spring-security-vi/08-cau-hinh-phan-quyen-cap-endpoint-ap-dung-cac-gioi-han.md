# Chương 8: Cấu hình phân quyền cấp endpoint: Áp dụng các giới hạn

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chính của chương này**

- Lựa chọn các yêu cầu để áp dụng hạn chế bằng các phương thức matcher

- Tìm hiểu các kịch bản áp dụng tối ưu cho từng phương thức matcher

Ở chương 7, bạn đã biết cách cấu hình quyền truy cập dựa trên quyền hạn và vai trò. Tuy nhiên, chúng ta mới chỉ áp dụng các cấu hình đó cho toàn bộ endpoint. Trong chương này, bạn sẽ học cách áp dụng các ràng buộc phân quyền cho một nhóm yêu cầu cụ thể. Trong các ứng dụng thực tế (production), việc áp dụng cùng một quy tắc cho mọi yêu cầu là rất hiếm khi xảy ra. Sẽ có những endpoint chỉ cho phép một số người dùng cụ thể gọi, trong khi các endpoint khác lại mở cho tất cả mọi người. Tùy thuộc vào yêu cầu nghiệp vụ, mỗi ứng dụng sẽ có cấu hình phân quyền tùy chỉnh riêng. Hãy cùng thảo luận về các tùy chọn có sẵn để tham chiếu đến những yêu cầu khác nhau khi viết cấu hình truy cập.

Dù có thể bạn không để ý, phương thức matcher đầu tiên mà chúng ta sử dụng chính là `anyRequest()`. Và vì đã xuất hiện ở các chương trước, giờ đây bạn đã biết rằng phương thức này tham chiếu đến mọi yêu cầu, bất kể đường dẫn hay phương thức HTTP nào. Đây là cách để chỉ định "mọi yêu cầu", hoặc đôi khi là "mọi yêu cầu còn lại".

Trước hết, chúng ta hãy thảo luận về việc lựa chọn yêu cầu theo đường dẫn; sau đó, chúng ta sẽ kết hợp thêm phương thức HTTP vào kịch bản này. Để chọn các yêu cầu cần áp dụng cấu hình phân quyền, chúng ta sử dụng phương thức `requestMatchers()`.

## 8.1 Sử dụng phương thức requestMatchers() để lựa chọn endpoint

Trong phần này, bạn sẽ tìm hiểu cách sử dụng phương thức `requestMatchers()` một cách tổng quan, làm tiền đề để chúng ta tiếp tục đi sâu vào các cách tiếp cận khác nhau trong việc lựa chọn yêu cầu HTTP cần áp dụng hạn chế phân quyền ở các phần từ 8.2 đến 8.4. Sau khi kết thúc chương này, bạn sẽ có thể áp dụng phương thức `requestMatchers()` vào bất kỳ cấu hình phân quyền nào để đáp ứng các yêu cầu nghiệp vụ của ứng dụng. Hãy bắt đầu với một ví dụ đơn giản.

Chúng ta sẽ xây dựng một ứng dụng cung cấp hai endpoint: `/hello` và `/ciao`. Chúng ta muốn đảm bảo rằng chỉ những người dùng có vai trò `ADMIN` mới có thể gọi endpoint `/hello`. Tương tự, chỉ những người dùng có vai trò `MANAGER` mới được phép gọi endpoint `/ciao`. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch8-ex1`. Đoạn mã dưới đây định nghĩa lớp controller.

**Đoạn mã 8.1 Định nghĩa lớp controller**

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }

    @GetMapping("/ciao")
    public String ciao() {
        return "Ciao!";
    }
}
```

Trong lớp cấu hình, chúng ta khai báo một `InMemoryUserDetailsManager` làm triển khai cho `UserDetailsService` và thêm vào hai người dùng có vai trò khác nhau. Người dùng John có vai trò `ADMIN`, còn Jane có vai trò `MANAGER`. Để chỉ định rằng chỉ người dùng có vai trò `ADMIN` mới được phép gọi endpoint `/hello` khi thực hiện phân quyền yêu cầu, chúng ta sử dụng phương thức `requestMatchers()`. Đoạn mã tiếp theo trình bày định nghĩa của lớp cấu hình.

**Đoạn mã 8.2 Định nghĩa lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        var manager = new InMemoryUserDetailsManager();

        var user1 = User.withUsername("john")
            .password("12345")
            .roles("ADMIN")
            .build();

        var user2 = User.withUsername("jane")
            .password("12345")
            .roles("MANAGER")
            .build();

        manager.createUser(user1);
        manager.createUser(user2);

        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers("/hello").hasRole("ADMIN")   // Chỉ cho phép gọi đường dẫ […]
            .requestMatchers("/ciao").hasRole("MANAGER")  // Chỉ cho phép gọi đường dẫ […]
        );

        return http.build();
    }
}
```

Bạn có thể chạy và kiểm tra thử ứng dụng này. Khi gọi endpoint `/hello` bằng tài khoản của John, bạn sẽ nhận được phản hồi thành công. Nhưng nếu gọi chính endpoint đó bằng tài khoản của Jane, mã trạng thái phản hồi trả về sẽ là HTTP 403 Forbidden. Tương tự, với endpoint `/ciao`, chỉ khi sử dụng tài khoản của Jane bạn mới nhận được kết quả thành công, còn với John, hệ thống sẽ trả về mã lỗi HTTP 403 Forbidden. Bạn có thể quan sát các lượt gọi mẫu bằng cURL trong các đoạn mã dưới đây.

Để gọi endpoint `/hello` bằng tài khoản John, hãy dùng lệnh:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi trả về:

```
Hello!
```

Để gọi endpoint `/hello` bằng tài khoản Jane, hãy dùng lệnh:

```bash
curl -u jane:12345 http://localhost:8080/hello
```

Thân phản hồi trả về:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/hello"
}
```

Để gọi endpoint `/ciao` bằng tài khoản Jane, hãy dùng lệnh:

```bash
curl -u jane:12345 http://localhost:8080/ciao
```

Thân phản hồi trả về:

```
Ciao!
```

Để gọi endpoint `/ciao` bằng tài khoản John, hãy dùng lệnh:

```bash
curl -u john:12345 http://localhost:8080/ciao
```

Thân phản hồi trả về:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/ciao"
}
```

Lúc này, nếu bạn thêm bất kỳ endpoint nào khác vào ứng dụng, theo mặc định, nó sẽ mở cho tất cả mọi người, kể cả những người dùng chưa xác thực. Giả sử chúng ta thêm một endpoint mới `/hola` như trong đoạn mã tiếp theo.

**Đoạn mã 8.3 Thêm endpoint mới cho đường dẫn /hola vào ứng dụng**

```java
@RestController
public class HelloController {

    // Phần mã được lược bớt

    @GetMapping("/hola")
    public String hola() {
        return "Hola!";
    }
}
```

Khi truy cập vào endpoint mới này, bạn sẽ thấy nó có thể được gọi thành công dù bạn có cung cấp thông tin người dùng hợp lệ hay không. Các đoạn mã dưới đây minh họa cho hành vi này.

Để gọi endpoint `/hola` mà không cần xác thực:

```bash
curl http://localhost:8080/hola
```

Thân phản hồi trả về:

```
Hola!
```

Để gọi endpoint `/hola` bằng tài khoản John:

```bash
curl -u john:12345 http://localhost:8080/hola
```

Thân phản hồi trả về:

```
Hola!
```

Nếu muốn, bạn có thể làm cho hành vi này trở nên rõ ràng tường minh hơn bằng cách sử dụng phương thức `permitAll()`. Bạn thực hiện việc này bằng cách đặt phương thức matcher `anyRequest()` ở cuối chuỗi cấu hình phân quyền yêu cầu, như được trình bày trong đoạn mã 8.4.

> **LƯU Ý:** Việc viết tường minh tất cả các quy tắc cấu hình là một thói quen lập trình tốt. Đoạn mã 8.4 thể hiện một cách rõ ràng và dứt khoát ý định cho phép mọi người truy cập các endpoint khác, ngoại trừ hai endpoint `/hello` và `/ciao`.

**Đoạn mã 8.4 Đánh dấu tường minh các yêu cầu bổ sung được phép truy cập không cần xác thực**

```java
@Configuration
public class ProjectConfig {

    // Phần mã được lược bớt

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers("/hello").hasRole("ADMIN")
            .requestMatchers("/ciao").hasRole("MANAGER")
            .anyRequest().permitAll() // Phương thức permitAll() chỉ định rằng tất cả […]
        );

        return http.build();
    }
}
```

> **LƯU Ý:** Khi sử dụng các bộ khớp matcher để tham chiếu đến các yêu cầu, thứ tự của các quy tắc phải đi từ cụ thể đến tổng quát. Đó là lý do tại sao phương thức `anyRequest()` không được phép gọi trước một phương thức `requestMatchers()` cụ thể hơn.

### Chưa xác thực so với Xác thực thất bại

Nếu bạn thiết kế một endpoint để ai cũng có thể truy cập, bạn có thể gọi nó mà không cần cung cấp tên đăng nhập và mật khẩu để xác thực. Trong trường hợp này, Spring Security sẽ không thực hiện quá trình xác thực. Tuy nhiên, nếu bạn vẫn cung cấp tên đăng nhập và mật khẩu, Spring Security sẽ đưa chúng vào quy trình đối soát để xác thực. Nếu thông tin đó sai (không tồn tại trên hệ thống), quá trình xác thực sẽ thất bại và mã trạng thái phản hồi trả về sẽ là 401 Unauthorized. Cụ thể hơn, nếu bạn gọi endpoint `/hola` với cấu hình trong đoạn mã 8.4, ứng dụng sẽ trả về nội dung phản hồi là `Hola!` như mong đợi cùng mã trạng thái 200 OK. Ví dụ:

```bash
curl http://localhost:8080/hola
```

Thân phản hồi trả về:

```
Hola!
```

Thế nhưng, nếu bạn gọi endpoint đó với thông tin xác thực không hợp lệ, mã trạng thái phản hồi sẽ là 401 Unauthorized. Trong lượt gọi tiếp theo dưới đây, tôi sử dụng một mật khẩu không đúng:

```bash
curl -u bill:abcde http://localhost:8080/hola
```

Thân phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/hola"
}
```

Hành vi này thoạt nhìn có vẻ kỳ lạ, nhưng nó hoàn toàn hợp lý, bởi vì framework sẽ luôn đối soát bất kỳ cặp tên đăng nhập và mật khẩu nào nếu bạn truyền chúng kèm theo yêu cầu. Như bạn đã biết ở chương 7, ứng dụng luôn thực hiện bước xác thực trước khi tiến hành phân quyền.

Bộ lọc phân quyền (authorization filter) cho phép mọi yêu cầu gửi tới đường dẫn `/hola`. Tuy nhiên, vì ứng dụng thực thi logic xác thực trước, yêu cầu này thậm chí còn chưa được chuyển tiếp tới bộ lọc phân quyền. Thay vào đó, bộ lọc xác thực (authentication filter) đã trực tiếp phản hồi lại bằng mã lỗi HTTP 401 Unauthorized.

Tóm lại, bất kỳ tình huống nào mà quá trình xác thực bị thất bại đều sẽ tạo ra phản hồi có mã trạng thái 401 Unauthorized, và ứng dụng sẽ không chuyển tiếp cuộc gọi đó đến endpoint. Phương thức `permitAll()` chỉ liên quan đến cấu hình phân quyền; do đó, nếu bước xác thực thất bại, yêu cầu sẽ không thể đi tiếp. Tất nhiên, bạn cũng có thể quyết định chỉ cho phép những người dùng đã xác thực mới được truy cập tất cả các endpoint còn lại. Để thực hiện việc này, bạn hãy thay thế phương thức `permitAll()` bằng `authenticated()` như trình bày trong đoạn mã dưới đây. Tương tự, bạn thậm chí có thể từ chối tất cả các yêu cầu khác bằng phương thức `denyAll()`.

**Đoạn mã 8.5 Cho phép mọi người dùng đã xác thực truy cập các yêu cầu khác**

```java
@Configuration
public class ProjectConfig {
    // Phần mã được lược bớt

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers("/hello").hasRole("ADMIN")
            .requestMatchers("/ciao").hasRole("MANAGER")
            .anyRequest().authenticated() // Tất cả các yêu cầu khác chỉ có thể được t […]
        );

        return http.build();
    }
}
```

Bạn đã làm quen với việc sử dụng các phương thức matcher để tham chiếu đến các yêu cầu cần cấu hình hạn chế phân quyền. Giờ là lúc chúng ta đi sâu hơn vào các cú pháp mà bạn có thể áp dụng.

Trong hầu hết các tình huống thực tế, nhiều endpoint có thể chia sẻ chung các quy tắc phân quyền, vì vậy bạn không nhất thiết phải cấu hình thủ công cho từng endpoint một. Hơn nữa, đôi khi bạn cần chỉ định cả phương thức HTTP chứ không chỉ riêng đường dẫn như chúng ta đã làm từ đầu đến giờ.

Trong những trường hợp khác, bạn có thể chỉ muốn cấu hình quy tắc cho một endpoint khi đường dẫn của nó được gọi bằng phương thức HTTP GET. Khi đó, bạn sẽ cần định nghĩa các quy tắc khác cho phương thức HTTP POST và HTTP DELETE. Trong phần tiếp theo, chúng ta sẽ xem xét chi tiết từng loại phương thức matcher để làm rõ những khía cạnh này.

## 8.2 Lựa chọn các yêu cầu để áp dụng hạn chế phân quyền

Trong phần này, chúng ta sẽ đi sâu vào việc cấu hình các bộ khớp yêu cầu (request matcher). Sử dụng phương thức `requestMatchers()` là một cách tiếp cận phổ biến để tham chiếu đến các yêu cầu khi áp dụng cấu hình phân quyền. Vì vậy, tôi tin rằng bạn sẽ có rất nhiều cơ hội sử dụng phương thức này trong các ứng dụng mà mình phát triển.

Bộ khớp matcher này sử dụng cú pháp ANT tiêu chuẩn (Bảng 8.1) để tham chiếu đến các đường dẫn [10]. Cú pháp này hoàn toàn trùng khớp với cú pháp bạn dùng khi khai báo ánh xạ endpoint thông qua các annotation như `@RequestMapping`, `@GetMapping`, `@PostMapping`, v.v. Hai phương thức bạn có thể dùng để khai báo các bộ khớp MVC matcher là:

- `requestMatchers(HttpMethod method, String... patterns)` — Cho phép bạn chỉ định cả phương thức HTTP lẫn các đường dẫn cần áp dụng hạn chế truy cập. Phương thức này rất hữu ích khi bạn muốn áp dụng các mức độ hạn chế khác nhau cho các phương thức HTTP khác nhau trên cùng một đường dẫn.

- `requestMatchers(String... patterns)` — Đơn giản và dễ dùng hơn nếu bạn chỉ cần áp dụng các hạn chế phân quyền dựa trên đường dẫn. Ràng buộc này sẽ tự động áp dụng cho bất kỳ phương thức HTTP nào được gọi tới đường dẫn đó.

Trong phần này, chúng ta sẽ tiếp cận nhiều cách sử dụng khác nhau của các phương thức `requestMatchers()`. Để minh họa, trước hết chúng ta sẽ viết một ứng dụng cung cấp nhiều endpoint. Đây là lần đầu tiên chúng ta viết các endpoint có thể gọi bằng các phương thức HTTP khác ngoài GET. Có thể bạn đã nhận ra từ đầu đến giờ tôi luôn tránh dùng các phương thức HTTP khác. Nguyên nhân là do Spring Security theo mặc định sẽ kích hoạt tính năng bảo vệ chống tấn công giả mạo yêu cầu chéo trang (CSRF) [11]. Trong chương 9, chúng ta sẽ thảo luận chi tiết về cách Spring Security giảm thiểu lỗ hổng bảo mật này bằng cách sử dụng các token CSRF. Nhưng để đơn giản hóa ví dụ hiện tại và giúp chúng ta có thể gọi tất cả các endpoint, bao gồm cả những endpoint sử dụng POST, PUT hoặc DELETE, chúng ta cần tạm thời tắt tính năng bảo vệ CSRF trong phương thức `securityFilterChain()` của mình:

```java
http.csrf(c -> c.disable());
```

> **LƯU Ý:** Chúng ta tạm thời vô hiệu hóa cơ chế bảo vệ CSRF lúc này chỉ nhằm giúp bạn tập trung hoàn toàn vào chủ đề đang thảo luận: các phương thức matcher. Bạn tuyệt đối không nên xem đây là một cách làm tốt trong thực tế. Trong chương 9, chúng ta sẽ mổ xẻ kỹ lưỡng về cơ chế bảo vệ CSRF do Spring Security cung cấp.

Trước tiên, chúng ta định nghĩa bốn endpoint để sử dụng trong các bài kiểm tra của mình:

- `/a` sử dụng phương thức HTTP GET

- `/a` sử dụng phương thức HTTP POST

- `/a/b` sử dụng phương thức HTTP GET

- `/a/b/c` sử dụng phương thức HTTP GET

Với các endpoint này, chúng ta có thể mô phỏng nhiều kịch bản cấu hình phân quyền khác nhau. Đoạn mã tiếp theo cung cấp định nghĩa cho các endpoint này. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch8-ex2`.

**Đoạn mã 8.6 Định nghĩa bốn endpoint được dùng để cấu hình phân quyền**

```java
@RestController
public class TestController {

    @PostMapping("/a")
    public String postEndpointA() {
        return "Works!";
    }

    @GetMapping("/a")
    public String getEndpointA() {
        return "Works!";
    }

    @GetMapping("/a/b")
    public String getEnpointB() {
        return "Works!";
    }

    @GetMapping("/a/b/c")
    public String getEnpointC() {
        return "Works!";
    }
}
```

Chúng ta cũng cần một vài người dùng với các vai trò khác nhau. Để đơn giản hóa, chúng ta tiếp tục sử dụng `InMemoryUserDetailsManager`. Trong đoạn mã dưới đây, bạn có thể thấy định nghĩa của `UserDetailsService` trong lớp cấu hình.

**Đoạn mã 8.7 Định nghĩa UserDetailsService**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var manager = new InMemoryUserDetailsManager(); // Định nghĩa một InMemoryUser […]

        var user1 = User.withUsername("john")
            .password("12345")
            .roles("ADMIN") // Người dùng John có vai trò ADMIN.
            .build();

        var user2 = User.withUsername("jane")
            .password("12345")
            .roles("MANAGER") // Người dùng Jane có vai trò MANAGER.
            .build();

        manager.createUser(user1);
        manager.createUser(user2);
        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance(); // Đừng quên bạn cũng cần phải khai […]
    }
}
```

Hãy bắt đầu với kịch bản đầu tiên. Đối với các yêu cầu gửi tới đường dẫn `/a` bằng phương thức HTTP GET, ứng dụng yêu cầu người dùng phải được xác thực. Ngược lại, đối với cùng đường dẫn đó, các yêu cầu sử dụng phương thức HTTP POST lại không cần xác thực. Ứng dụng sẽ từ chối tất cả các yêu cầu còn lại. Đoạn mã dưới đây mô tả cấu hình cần thiết để thiết lập sơ đồ này.

**Đoạn mã 8.8 Cấu hình phân quyền cho kịch bản thứ nhất, /a**

```java
@Configuration
public class ProjectConfig {

    // Phần mã được lược bớt
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers(HttpMethod.GET, "/a").authenticated() // Đối với các yêu […]
            .requestMatchers(HttpMethod.POST, "/a").permitAll()    // Cho phép bất kỳ […]
            .anyRequest().denyAll()                                // Từ chối mọi yêu […]
        );

        http.csrf(c -> c.disable()); // Vô hiệu hóa CSRF để cho phép gọi tới đường dẫn […]

        return http.build();
    }
}
```

Trong các đoạn mã tiếp theo, chúng ta sẽ phân tích kết quả của các lượt gọi đến endpoint dựa trên cấu hình được trình bày trong đoạn mã 8.8.

Để gọi tới đường dẫn `/a` bằng phương thức HTTP POST mà không cần xác thực, hãy sử dụng lệnh cURL sau:

```bash
curl -XPOST http://localhost:8080/a
```

Thân phản hồi trả về:

```
Works!
```

Khi gọi tới đường dẫn `/a` bằng phương thức HTTP GET mà không xác thực:

```bash
curl -XGET http://localhost:8080/a
```

Khớp phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/a"
}
```

Nếu muốn nhận được phản hồi thành công, bạn buộc phải xác thực bằng một tài khoản hợp lệ. Với lượt gọi sau:

```bash
curl -u john:12345 -XGET http://localhost:8080/a
```

Thân phản hồi trả về:

```
Works!
```

Tuy nhiên, người dùng John không có quyền gọi tới đường dẫn `/a/b`, do đó việc xác thực bằng thông tin của anh ta cho lượt gọi này sẽ trả về lỗi 403 Forbidden:

```bash
curl -u john:12345 -XGET http://localhost:8080/a/b
```

Khớp phản hồi trả về:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/a/b"
}
```

Qua ví dụ này, giờ đây bạn đã biết cách phân biệt các yêu cầu dựa trên phương thức HTTP. Nhưng điều gì sẽ xảy ra nếu nhiều đường dẫn có cùng chung quy tắc phân quyền? Tất nhiên, chúng ta có thể liệt kê thủ công mọi đường dẫn cần áp dụng quy tắc; nhưng nếu số lượng đường dẫn quá lớn, việc này sẽ làm cho mã nguồn trở nên rối rắm và khó đọc. Thêm vào đó, ngay từ đầu chúng ta có thể đã biết rằng một nhóm đường dẫn có cùng tiền tố sẽ luôn có chung quy tắc phân quyền. Chúng ta muốn đảm bảo rằng việc bổ sung một đường dẫn mới vào nhóm đó sau này sẽ không đòi hỏi phải thay đổi cấu hình phân quyền hiện tại. Để giải quyết những trường hợp này, chúng ta sử dụng các biểu thức đường dẫn. Hãy cùng chứng minh điều đó qua một ví dụ cụ thể.

Trong dự án hiện tại, chúng ta muốn đảm bảo áp dụng chung một quy tắc cho tất cả các yêu cầu gửi đến các đường dẫn bắt đầu bằng `/a/b`. Trong trường hợp này, đó là các đường dẫn `/a/b` và `/a/b/c`. Để đạt được điều này, chúng ta sử dụng toán tử `**`. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch8-ex3`.

**Đoạn mã 8.9 Thay đổi trong lớp cấu hình để áp dụng cho nhiều đường dẫn**

```java
@Configuration
public class ProjectConfig {

    // Phần mã được lược bớt

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers("/a/b/**").authenticated() // Biểu thức /a/b/** đại diện […]
            .anyRequest().permitAll()
        );

        http.csrf(c -> c.disable());

        return http.build();
    }
}
```

Với cấu hình được đưa ra trong đoạn mã 8.9, bạn có thể gọi đường dẫn `/a` mà không cần xác thực, nhưng đối với tất cả các đường dẫn có tiền tố `/a/b`, ứng dụng bắt buộc phải xác thực người dùng. Các đoạn mã dưới đây trình bày kết quả khi gọi các endpoint `/a`, `/a/b`, và `/a/b/c`.

Đầu tiên, để gọi đường dẫn `/a` mà không cần xác thực:

```bash
curl http://localhost:8080/a
```

Thân phản hồi trả về:

```
Works!
```

Để gọi đường dẫn `/a/b` mà không cần xác thực:

```bash
curl http://localhost:8080/a/b
```

Khớp phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/a/b"
}
```

Để gọi đường dẫn `/a/b/c` mà không cần xác thực:

```bash
curl http://localhost:8080/a/b/c
```

Khớp phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/a/b/c"
}
```

Đúng như minh họa từ các ví dụ trước, toán tử `**` có thể đại diện cho số lượng thành phần đường dẫn tùy ý. Bạn có thể sử dụng nó như cách chúng ta vừa làm ở ví dụ trên để so khớp các yêu cầu có chung một tiền tố đường dẫn xác định. Bạn cũng có thể đặt nó ở giữa đường dẫn để đại diện cho số lượng thành phần bất kỳ, hoặc dùng để so khớp các đường dẫn kết thúc bằng một khuôn mẫu cụ thể, ví dụ như `/a/**/c`. Theo đó, biểu thức `/a/**/c` không chỉ khớp với `/a/b/c` nhưng cũng khớp với cả `/a/b/d/c`, `/a/b/c/d/e/c`, v.v. Nếu bạn chỉ muốn so khớp duy nhất một thành phần đường dẫn, hãy sử dụng ký tự `*` đơn. Ví dụ, `/a/*/c` sẽ khớp với `/a/b/c` và `/a/d/c` nhưng sẽ bỏ qua `/a/b/d/c`.

Do chúng ta thường xuyên sử dụng các biến đường dẫn, chúng sẽ cực kỳ hữu dụng trong việc áp dụng các quy tắc phân quyền cho loại yêu cầu này. Thậm chí bạn có thể áp dụng các quy tắc dựa trên chính giá trị của biến đường dẫn đó. Bạn còn nhớ phần thảo luận ở mục 8.1 về phương thức `denyAll()` và việc hạn chế mọi yêu cầu chứ?

Bây giờ, hãy cùng xem một ví dụ thực tế và trực quan hơn áp dụng những gì bạn vừa học được. Chúng ta có một endpoint chứa biến đường dẫn, và chúng ta muốn từ chối tất cả các yêu cầu nếu giá trị của biến đường dẫn đó chứa bất kỳ ký tự nào khác ngoài chữ số. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch8-ex4`. Đoạn mã dưới đây khai báo lớp controller.

**Đoạn mã 8.10 Định nghĩa endpoint chứa biến đường dẫn trong lớp controller**

```java
@RestController
public class ProductController {
    @GetMapping("/product/{code}")
    public String productCode(@PathVariable String code) {
        return code;
    }
}
```

Đoạn mã tiếp theo hướng dẫn cách cấu hình phân quyền sao cho chỉ các lượt gọi truyền vào giá trị gồm toàn chữ số mới được phép truy cập, trong khi tất cả các lượt gọi khác đều bị từ chối.

**Đoạn mã 8.11 Cấu hình phân quyền chỉ cho phép các chữ số cụ thể**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .requestMatchers("/product/{code:^[0-9]*$}").permitAll() // Biểu thức chín […]
            .anyRequest().denyAll()
        );

        return http.build();
    }
}
```

> **LƯU Ý:** Khi sử dụng các biểu thức tham số kèm theo biểu thức chính quy (regex), hãy đảm bảo rằng bạn không để khoảng trắng giữa tên tham số, dấu hai chấm (`:`) và biểu thức regex, như được minh họa trong đoạn mã.

Chạy thử ví dụ này, bạn sẽ nhận được kết quả như minh họa trong các đoạn mã dưới đây. Ứng dụng chỉ chấp nhận cuộc gọi khi giá trị của biến đường dẫn chứa hoàn toàn các chữ số.

Để gọi endpoint với giá trị `1234a`:

```bash
curl http://localhost:8080/product/1234a
```

Khớp phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/product/1234a"
}
```

Để gọi endpoint với giá trị `12345`:

```bash
curl http://localhost:8080/product/12345
```

Khớp phản hồi trả về:

```
12345
```

Chúng ta đã cùng nhau thảo luận chi tiết và xem xét rất nhiều ví dụ về cách tham chiếu đến các yêu cầu bằng phương thức `requestMatchers()`. Bảng 8.1 dưới đây tóm tắt các biểu thức đường dẫn được sử dụng trong phần này. Bạn có thể tra cứu lại bảng này bất cứ khi nào cần ôn tập.

**Bảng 8.1 Các biểu thức khớp đường dẫn phổ biến dùng với bộ khớp MVC matcher**

| Biểu thức | Mô tả |
|---|---|
| `/a` | Chỉ khớp đường dẫn `/a`. |
| `/a/*` | Toán tử `*` thay thế cho một thành phần đường dẫn. Trong trường hợp này, nó khớp với `/a/b` hoặc `/a/c`, nhưng không khớp với `/a/b/c`. |
| `/a/**` | Toán tử `**` thay thế cho nhiều thành phần đường dẫn. Trong trường hợp này, các đường dẫn như `/a`, `/a/b` và `/a/b/c` đều khớp với biểu thức. |
| `/a/{param}` | Biểu thức này áp dụng cho đường dẫn `/a` đi kèm với một tham số đường dẫn cụ thể. |
| `/a/{param:regex}` | Biểu thức này áp dụng cho đường dẫn `/a` đi kèm với một tham số đường dẫn xác định, nhưng chỉ khi giá trị của tham số đó khớp với biểu thức chính quy (regex) tương ứng. |

## 8.3 Sử dụng biểu thức chính quy với bộ khớp yêu cầu

Phần này sẽ bàn về biểu thức chính quy (regex). Có lẽ bạn đã có hiểu biết cơ bản về biểu thức chính quy là gì, nhưng bạn không cần phải là một chuyên gia về lĩnh vực này để theo dõi nội dung. Bất kỳ cuốn sách nào được đề xuất tại địa chỉ https://www.regular-expressions.info/books.html đều là tài liệu tuyệt vời giúp bạn nghiên cứu sâu hơn về chủ đề này. Khi cần viết các biểu thức regex, tôi cũng thường sử dụng các công cụ tạo trực tuyến như https://regexr.com/.

Các phần 8.2 và 8.3 đã chỉ ra rằng trong phần lớn trường hợp, chúng ta hoàn toàn có thể sử dụng cú pháp biểu thức đường dẫn để tham chiếu đến các yêu cầu cần cấu hình phân quyền. Tuy nhiên, đôi khi bạn sẽ gặp phải những yêu cầu đặc thù phức tạp hơn mà các biểu thức đường dẫn thông thường không thể giải quyết được. Một ví dụ tiêu biểu cho yêu cầu dạng này là: "Từ chối tất cả các yêu cầu nếu đường dẫn chứa các ký tự hoặc ký hiệu đặc biệt cụ thể." Đối với những kịch bản như vậy, bạn buộc phải sử dụng một công cụ mạnh mẽ hơn, đó là biểu thức chính quy (regex).

Do regex có khả năng biểu diễn mọi định dạng chuỗi ký tự, chúng mở ra những khả năng gần như vô hạn cho việc lọc yêu cầu. Thế nhưng, điểm yếu lớn nhất của regex lại là tính khó đọc, ngay cả khi áp dụng cho các kịch bản vô cùng đơn giản. Vì lý do này, bạn nên ưu tiên sử dụng các biểu thức đường dẫn thông thường và chỉ tìm đến regex như một giải pháp cuối cùng khi không còn lựa chọn nào khác. Để triển khai một bộ khớp yêu cầu bằng regex, bạn có thể truyền một thực thể của `RegexRequestMatcher` làm tham số vào phương thức `requestMatchers()`.

Để minh họa cách thức hoạt động của các bộ khớp regex matcher, chúng ta hãy cùng bắt tay vào xây dựng một ứng dụng cung cấp nội dung video cho người dùng. Ứng dụng này sẽ tải nội dung video bằng cách gọi đến endpoint `/video/{country}/{language}`. Trong ví dụ này, ứng dụng nhận thông tin quốc gia và ngôn ngữ từ hai biến đường dẫn nơi người dùng gửi yêu cầu. Quy tắc đặt ra là bất kỳ người dùng đã xác thực nào cũng có thể xem nội dung video nếu yêu cầu của họ đến từ Hoa Kỳ, Canada, Vương quốc Anh, hoặc nếu họ sử dụng ngôn ngữ tiếng Anh.

Bạn có thể tìm thấy ví dụ thực tế này trong dự án `ssia-ch8-ex5`. Endpoint mà chúng ta cần bảo vệ chứa hai biến đường dẫn như được mô tả trong đoạn mã dưới đây. Đặc điểm này khiến yêu cầu nghiệp vụ trở nên khá phức tạp nếu chỉ sử dụng các bộ khớp yêu cầu thông thường.

**Đoạn mã 8.12 Định nghĩa endpoint trong lớp controller**

```java
@RestController
public class VideoController {

    @GetMapping("/video/{country}/{language}")
    public String video(@PathVariable String country, @PathVariable String language) { […]
        return "Video allowed for " + country + " " + language;
    }
}
```

Đối với điều kiện áp dụng cho một biến đường dẫn đơn lẻ, chúng ta có thể viết trực tiếp biểu thức regex vào biểu thức đường dẫn. Chúng ta đã từng đề cập đến một ví dụ tương tự ở phần 8.2, nhưng lúc đó tôi chưa đi sâu vào chi tiết vì chúng ta chưa chính thức thảo luận về regex.

Giả sử bạn có endpoint `/email/{email}`. Bạn chỉ muốn áp dụng quy tắc thông qua bộ khớp cho các yêu cầu truyền vào địa chỉ email kết thúc bằng đuôi `.com` ở tham số `email`. Khi đó, bạn sẽ viết một bộ khớp yêu cầu như trong đoạn mã dưới đây. Bạn có thể tìm thấy ví dụ hoàn chỉnh trong dự án `ssia-ch8-ex6`:

```java
http.authorizeHttpRequests(c -> c
    .requestMatchers("/email/{email:.*(?:.+@.+\\.com)}" ).permitAll()
    .anyRequest().denyAll()
);
```

Khi kiểm tra thử ràng buộc này, bạn sẽ thấy ứng dụng chỉ chấp nhận các địa chỉ email kết thúc bằng `.com`. Ví dụ, để gọi endpoint với email `jane@example.com`, bạn có thể dùng lệnh:

```bash
curl http://localhost:8080/email/jane@example.com
```

Thân phản hồi trả về:

```
Allowed for email jane@example.com
```

Và nếu gọi endpoint với email `jane@example.net`, bạn dùng:

```bash
curl http://localhost:8080/email/jane@example.net
```

Thân phản hồi trả về:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/email/jane@example.net"
}
```

Cách cấu hình này khá đơn giản, và nó cũng lý giải tại sao chúng ta ít khi phải dùng tới các bộ khớp regex matcher. Tuy nhiên, như tôi đã đề cập từ trước, các yêu cầu thực tế đôi khi rất phức tạp. Bạn sẽ thấy các bộ khớp regex matcher phát huy thế mạnh rõ rệt nhất trong những trường hợp sau:

- Cần áp dụng cấu hình đặc thù cho tất cả các đường dẫn chứa số điện thoại hoặc địa chỉ email.

- Cần áp dụng cấu hình đặc thù cho mọi đường dẫn tuân theo một định dạng nhất định, bao gồm cả các giá trị được truyền qua toàn bộ các biến đường dẫn.

Quay trở lại với ví dụ về bộ khớp regex matcher của chúng ta (`ssia-ch8-ex6`): Khi cần viết một quy tắc phức tạp hơn, tham chiếu đến nhiều khuôn mẫu đường dẫn và nhiều giá trị biến đường dẫn khác nhau, việc sử dụng bộ khớp regex matcher sẽ dễ dàng hơn nhiều. Đoạn mã 8.13 trình bày định nghĩa của lớp cấu hình sử dụng bộ khớp regex matcher để giải quyết yêu cầu đặt ra cho đường dẫn `/video/{country}/{language}`. Chúng ta cũng thêm vào hai người dùng có quyền hạn khác nhau để kiểm thử chương trình.

**Đoạn mã 8.13 Lớp cấu hình sử dụng bộ khớp regex matcher**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var uds = new InMemoryUserDetailsManager();

        var u1 = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();

        var u2 = User.withUsername("jane")
            .password("12345")
            .authorities("read", "premium")
            .build();

        uds.createUser(u1);
        uds.createUser(u2);
        return uds;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());

        http.authorizeHttpRequests(c -> c
            .regexMatchers(".*/(us|uk|ca)+/(en|fr).*").authenticated() // Chúng ta sử […]
            .anyRequest().hasAuthority("premium")                      // Cấu hình các […]
        );

        return http.build();
    }
}
```

Việc chạy và kiểm thử các endpoint xác nhận rằng ứng dụng đã áp dụng cấu hình phân quyền một cách chính xác. Người dùng John có thể gọi endpoint với mã quốc gia `us` và ngôn ngữ `en`, nhưng anh ta lại bị chặn khi gọi endpoint với mã quốc gia `fr` và ngôn ngữ `fr` do các hạn chế mà chúng ta đã cấu hình. Lượt gọi endpoint `/video` và xác thực tài khoản John cho khu vực Mỹ và ngôn ngữ tiếng Anh sẽ như sau:

```bash
curl -u john:12345 http://localhost:8080/video/us/en
```

Thân phản hồi trả về:

```
Video allowed for us en
```

Lượt gọi endpoint `/video` và xác thực tài khoản John cho khu vực Pháp và ngôn ngữ tiếng Pháp sẽ như sau:

```bash
curl -u john:12345 http://localhost:8080/video/fr/fr
```

Thân phản hồi trả về:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/video/fr/fr"
}
```

Sở hữu quyền hạn `premium`, người dùng Jane có thể thực hiện thành công cả hai lượt gọi. Với lượt gọi thứ nhất:

```bash
curl -u jane:12345 http://localhost:8080/video/us/en
```

thân phản hồi trả về:

```
Video allowed for us en
```

Với lượt gọi thứ hai:

```bash
curl -u jane:12345 http://localhost:8080/video/fr/fr
```

thân phản hồi trả về:

```
Video allowed for fr fr
```

Biểu thức chính quy (regex) là một công cụ cực kỳ mạnh mẽ. Bạn có thể sử dụng chúng để tham chiếu đến các đường dẫn cho bất kỳ yêu cầu nghiệp vụ nào. Tuy nhiên, vì regex rất khó đọc và có thể trở nên cực kỳ dài dòng, bạn chỉ nên xem chúng là sự lựa chọn cuối cùng. Hãy chỉ dùng regex khi các biểu thức đường dẫn thông thường không thể cung cấp giải pháp cho bài toán của bạn.

Trong phần này, tôi đã cố gắng sử dụng ví dụ đơn giản nhất có thể để biểu thức regex được ngắn gọn. Nhưng trong các tình huống thực tế phức tạp hơn, biểu thức regex có thể dài hơn rất nhiều. Tất nhiên, bạn sẽ luôn bắt gặp những chuyên gia khẳng định rằng mọi biểu thức regex đều rất dễ đọc. Chẳng hạn, một biểu thức regex dùng để khớp một địa chỉ email có thể trông giống như đoạn mã dưới đây. Liệu bạn có thể đọc và hiểu nó một cách dễ dàng?

```
(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\ […]
```

## Tóm tắt

- Trong các kịch bản thực tế, các quy tắc phân quyền khác nhau sẽ được áp dụng cho những yêu cầu khác nhau.

- Các yêu cầu cần cấu hình quy tắc phân quyền được xác định cụ thể dựa trên đường dẫn và phương thức HTTP. Để làm được điều này, bạn sử dụng phương thức `requestMatchers()`.

- Khi các yêu cầu nghiệp vụ quá phức tạp để có thể giải quyết bằng các biểu thức đường dẫn thông thường, bạn có thể triển khai chúng bằng các biểu thức chính quy (regex) mạnh mẽ hơn.
