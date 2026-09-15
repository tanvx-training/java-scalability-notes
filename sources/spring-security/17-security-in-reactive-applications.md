# 17. Hiện thực bảo mật trong ứng dụng reactive

> Bản dịch tiếng Việt của chương 17 — *Spring Security in Action, Second Edition* (Laurentiu Spilca, Manning).

**Nội dung chương này bao gồm:**

- Sử dụng Spring Security với các ứng dụng reactive
- Sử dụng app reactive trong một hệ thống được thiết kế dùng OAuth 2 authentication

Reactive là một mô hình lập trình (paradigm) mà ở đó chúng ta áp dụng một cách tư duy khác khi phát triển ứng dụng. Lập trình reactive là một cách mạnh mẽ để phát triển web app, đã được chấp nhận rộng rãi. Tôi thậm chí sẽ nói rằng nó trở thành thời thượng vài năm trước, khi bất kỳ hội nghị quan trọng nào cũng có ít nhất vài bài trình bày bàn về các app reactive. Tuy nhiên, như bất kỳ công nghệ nào khác trong phát triển phần mềm, lập trình reactive không phải là giải pháp áp dụng được cho mọi tình huống.

Trong một số trường hợp, cách tiếp cận reactive rất phù hợp. Trong những trường hợp khác, nó có thể chỉ làm cuộc sống của bạn phức tạp hơn. Nhưng suy cho cùng, cách tiếp cận reactive tồn tại vì nó giải quyết một số hạn chế của lập trình mệnh lệnh (imperative) và do đó được dùng để tránh những hạn chế đó. Một trong số đó liên quan tới việc thực thi những tác vụ lớn có thể phân mảnh được. Với cách tiếp cận imperative, bạn giao cho ứng dụng một tác vụ để thực thi, và ứng dụng có trách nhiệm giải quyết nó. Nếu tác vụ lớn, có thể mất một lượng thời gian đáng kể để ứng dụng giải quyết nó. Client giao tác vụ cần chờ tác vụ được giải quyết hoàn toàn trước khi nhận một response. Với lập trình reactive, bạn có thể chia nhỏ tác vụ để app có cơ hội tiếp cận một số subtask đồng thời. Bằng cách này, client nhận được dữ liệu đã xử lý nhanh hơn.

Chương này bàn về bảo mật ở tầng ứng dụng trong các app reactive với Spring Security. Như với bất kỳ ứng dụng nào khác, bảo mật là một khía cạnh quan trọng của các app reactive. Tuy nhiên, vì app reactive được thiết kế khác đi, Spring Security đã điều chỉnh cách chúng ta hiện thực những tính năng đã bàn trước đó trong cuốn sách này.

Chúng ta sẽ bắt đầu với một cái nhìn tổng quan ngắn gọn về việc hiện thực app reactive với Spring framework ở mục 17.1. Rồi chúng ta sẽ áp dụng những tính năng bảo mật bạn đã học xuyên suốt cuốn sách này lên các app. Ở mục 17.2, chúng ta sẽ bàn về việc quản lý user trong app reactive, và ở mục 17.3, chúng ta tiếp tục áp dụng các quy tắc authorization (phân quyền). Cuối cùng, ở mục 17.4, bạn sẽ học cách hiện thực các ứng dụng reactive trong một hệ thống được thiết kế trên OAuth 2. Bạn sẽ học những gì thay đổi từ góc nhìn Spring Security khi nói tới các ứng dụng reactive, và tất nhiên, bạn sẽ học cách áp dụng điều này qua các ví dụ.

---

## 17.1 App reactive là gì?

Trong mục này, chúng ta bàn ngắn gọn về app reactive. Chương này nói về việc áp dụng bảo mật cho app reactive, nên ở đây, tôi muốn đảm bảo bạn nắm được những điều thiết yếu về app reactive trước khi đi sâu vào cấu hình Spring Security. Vì chủ đề ứng dụng reactive rất rộng, tôi chỉ điểm lại những khía cạnh chính của app reactive như một phần ôn tập. Nếu bạn chưa biết app reactive hoạt động thế nào, hoặc bạn cần hiểu chúng chi tiết hơn, tôi khuyến nghị bạn đọc phần 3 của cuốn *Spring in Action, Sixth Edition* của Craig Walls (Manning, 2022).

Khi hiện thực app, chúng ta dùng hai cách để hiện thực chức năng. Danh sách sau đây trình bày chi tiết những cách tiếp cận này:

- Với **cách tiếp cận imperative**, app của bạn xử lý toàn bộ khối dữ liệu cùng một lúc. Ví dụ, một app client gọi một endpoint được server expose và gửi tất cả dữ liệu cần xử lý tới backend. Giả sử bạn hiện thực một chức năng mà user upload file. Nếu user chọn một số file, và tất cả những file này được app backend nhận để xử lý cùng lúc, bạn đang làm việc với cách tiếp cận imperative.
- Với **cách tiếp cận reactive**, app của bạn nhận và xử lý dữ liệu theo từng mảnh. Không phải tất cả dữ liệu đều phải có sẵn đầy đủ ngay từ đầu để được xử lý. Backend nhận và xử lý dữ liệu khi nó nhận được. Giả sử user chọn một số file, và backend cần upload và xử lý chúng. Backend không chờ nhận tất cả file cùng lúc trước khi xử lý. Backend có thể nhận từng file một và xử lý mỗi cái trong khi chờ thêm file tới.

Hình 17.1 trình bày một phép so sánh cho hai cách tiếp cận lập trình này. Hãy hình dung một nhà máy đóng chai sữa. Nếu nhà máy nhận tất cả sữa vào buổi sáng và giao sữa khi hoàn thành việc đóng chai, chúng ta nói nó là non-reactive (imperative). Nếu nhà máy nhận sữa suốt cả ngày và giao đơn hàng khi hoàn thành việc đóng chai đủ sữa, chúng ta nói nó là reactive. Rõ ràng, với nhà máy sữa, việc dùng cách tiếp cận reactive có lợi hơn cách tiếp cận non-reactive.

![Hình 17.1](images/ch17/ch17-fig01.png)

**Hình 17.1** Non-reactive vs. reactive. Trong cách tiếp cận non-reactive, nhà máy sữa nhận tất cả sữa cần đóng gói vào buổi sáng và giao tất cả các thùng vào buổi tối. Trong cách tiếp cận reactive, khi sữa được mang tới nhà máy, nó được đóng gói rồi giao đi. Với tình huống này, cách tiếp cận reactive tốt hơn vì nó cho phép sữa được thu gom suốt cả ngày và giao tới khách hàng sớm hơn.

Để hiện thực app reactive, đặc tả Reactive Streams (<http://www.reactive-streams.org/>) cung cấp một cách chuẩn để xử lý stream bất đồng bộ. Một trong những hiện thực của đặc tả này là Project Reactor, thứ xây dựng nền tảng cho mô hình lập trình reactive của Spring. Project Reactor cung cấp một API hàm (functional API) để kết hợp Reactive Streams.

Để có cảm nhận thực hành hơn, hãy bắt đầu một hiện thực đơn giản của một app reactive. Chúng ta sẽ tiếp tục với cùng ứng dụng này ở mục 17.2 khi bàn về việc quản lý user trong app reactive. Tôi đã tạo một project mới tên là `ssia-ch17-ex1`, và chúng ta sẽ phát triển một web app reactive expose một endpoint demo. Trong file *pom.xml*, chúng ta phải thêm dependency reactive web như trình bày ở đoạn code sau đây. Dependency này chứa Project Reactor và cho phép chúng ta dùng các class và interface liên quan của nó trong project:

```xml
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

Tiếp theo, chúng ta định nghĩa một `HelloController` đơn giản để chứa định nghĩa của endpoint demo. Listing 17.1 cho thấy định nghĩa của class `HelloController`. Trong định nghĩa endpoint, bạn sẽ thấy tôi dùng một `Mono` làm kiểu trả về. `Mono` là một trong những khái niệm thiết yếu do hiện thực Reactor định nghĩa. Khi làm việc với Reactor, bạn thường dùng `Mono` và `Flux`, cả hai đều định nghĩa **publisher** (nguồn dữ liệu). Trong đặc tả Reactive Streams, một publisher được mô tả bởi interface `Publisher`. Interface này mô tả một trong những contract (giao ước) thiết yếu được dùng với Reactive Streams. Contract còn lại là `Subscriber`. Contract này mô tả component tiêu thụ dữ liệu.

Khi thiết kế một endpoint trả về thứ gì đó, endpoint trở thành một publisher, nên nó phải trả về một hiện thực `Publisher`. Nếu dùng Project Reactor, đây sẽ là một `Mono` hoặc một `Flux`. `Mono` là một publisher cho một giá trị duy nhất, trong khi `Flux` là một publisher cho nhiều giá trị. Hình 17.2 mô tả những component này và mối quan hệ giữa chúng.

![Hình 17.2](images/ch17/ch17-fig02.png)

**Hình 17.2** Trong một reactive stream, một publisher tạo ra các giá trị, và một subscriber tiêu thụ chúng. Các contract được đặc tả Reactive Streams định nghĩa mô tả publisher và subscriber. Project Reactor hiện thực đặc tả Reactive Streams và hiện thực các contract `Publisher` và `Subscriber`. Trong hình, các component chúng ta dùng trong những ví dụ ở chương này được tô đậm.

Để phần giải thích này còn chính xác hơn nữa, hãy quay lại phép so sánh nhà máy sữa. Nhà máy sữa là một hiện thực backend reactive expose một endpoint để nhận sữa cần xử lý. Endpoint này tạo ra thứ gì đó (sữa đã đóng chai), nên nó cần trả về một `Publisher`. Nếu yêu cầu nhiều hơn một chai sữa, thì nhà máy sữa cần trả về một `Flux`, vốn là hiện thực `Publisher` của Project Reactor xử lý không hoặc nhiều giá trị được tạo ra.

**Listing 17.1 Định nghĩa của class `HelloController`**

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  public Mono<String> hello() {
    return Mono.just("Hello!");       // ①
  }
}
```

① Tạo và trả về một nguồn stream `Mono` với một giá trị trên stream.

Giờ bạn có thể khởi động và test ứng dụng. Điều đầu tiên bạn quan sát được khi nhìn vào terminal của app là Spring Boot không còn cấu hình một Tomcat server nữa. Spring Boot vốn cấu hình Tomcat cho một web application mặc định, và bạn có thể đã quan sát thấy khía cạnh này trong bất kỳ ví dụ nào đã phát triển trước đó trong cuốn sách này. Thay vào đó, Spring Boot giờ tự động cấu hình Netty làm reactive web server mặc định cho một project Spring Boot.

Điều thứ hai bạn có thể quan sát được khi gọi endpoint là nó không hoạt động khác so với một endpoint được phát triển bằng cách tiếp cận non-reactive. Bạn vẫn tìm thấy trong HTTP response body thông điệp `Hello!` mà endpoint trả về trong stream `Mono` đã định nghĩa của nó. Đoạn code kế tiếp trình bày hành vi của app khi gọi endpoint:

```bash
curl http://localhost:8080/hello
```

Response body là

```
Hello!
```

Nhưng tại sao cách tiếp cận reactive lại khác biệt về mặt Spring Security? Ở phía sau hậu trường, một hiện thực reactive dùng nhiều thread để giải quyết các tác vụ trên stream. Nói cách khác, nó thay đổi triết lý one-thread-per-request (một thread cho mỗi request), thứ chúng ta dùng cho một web app được thiết kế theo cách tiếp cận imperative (hình 17.3). Và từ đây, có thêm nhiều khác biệt:

- Hiện thực `SecurityContext` không hoạt động theo cùng cách trong các ứng dụng reactive. Hãy nhớ, `SecurityContext` dựa trên `ThreadLocal`, và giờ chúng ta có nhiều hơn một thread cho mỗi request.
- Vì `SecurityContext`, bất kỳ cấu hình authorization nào giờ cũng bị ảnh hưởng. Hãy nhớ từ chương 5 rằng các quy tắc authorization nói chung dựa vào instance `Authentication` được lưu trong `SecurityContext`. Giờ các cấu hình bảo mật áp dụng ở tầng endpoint, cũng như chức năng global method security, đều bị ảnh hưởng.
- `UserDetailsService`, component chịu trách nhiệm truy xuất chi tiết user, là một nguồn dữ liệu. Vì điều này, user details service cũng cần hỗ trợ cách tiếp cận reactive. (Chúng ta đã học về contract này ở chương 2.)

![Hình 17.3](images/ch17/ch17-fig03.png)

**Hình 17.3** Trong hình, mỗi mũi tên biểu diễn dòng thời gian của một thread khác nhau, và các ô vuông biểu diễn những tác vụ đã xử lý từ request A, B, và C. Vì trong một app reactive, các tác vụ từ một request có thể được xử lý trên nhiều thread, chi tiết authentication không thể được lưu ở mức thread nữa.

Hình 17.4 trình bày một cách khác để nhìn nhận cách tiếp cận này. Hãy hình dung một nhóm người làm việc trên một tập các tác vụ. Mỗi người có thể nhận một tác vụ và bỏ nó lại khi họ bị chặn. Không phải lúc nào cũng là cùng một thread sẽ tiếp tục tác vụ bị bỏ lại. Vậy nên security context không thể gắn với một thread nữa, mà nó phải được liên kết bằng cách nào đó với tác vụ.

May mắn thay, Spring Security cung cấp hỗ trợ cho app reactive và bao phủ tất cả các trường hợp mà bạn không thể dùng những hiện thực cho app non-reactive nữa. Chúng ta sẽ tiếp tục trong chương này bằng việc bàn về cách bạn hiện thực các cấu hình bảo mật với Spring Security cho app reactive. Chúng ta sẽ bắt đầu ở mục 17.2 với việc hiện thực quản lý user và tiếp tục ở mục 17.3 với việc áp dụng các quy tắc authorization cho endpoint, nơi chúng ta sẽ tìm hiểu security context hoạt động thế nào trong app reactive. Rồi chúng ta sẽ tiếp tục phần thảo luận với reactive method security, thứ thay thế global method security của các app imperative.

![Hình 17.4](images/ch17/ch17-fig04.png)

**Hình 17.4** Một phép so sánh về cách một app reactive hoạt động. Một thread không nhận các tác vụ của một request theo thứ tự và chờ khi nó bị chặn. Thay vào đó, tất cả tác vụ từ tất cả request nằm trong một backlog. Bất kỳ thread rảnh nào cũng có thể làm việc trên tác vụ từ bất kỳ request nào. Bằng cách này, các tác vụ độc lập có thể được giải quyết song song, và các thread không nằm nhàn rỗi.

---

## 17.2 Quản lý user trong app reactive

Thông thường trong các ứng dụng, cách một user authentication dựa trên một cặp credential username và password. Cách tiếp cận này là cơ bản, và chúng ta đã bàn về nó, bắt đầu từ ứng dụng đơn giản nhất mà chúng ta hiện thực ở chương 2. Nhưng với app reactive, hiện thực của component lo việc quản lý user cũng thay đổi. Trong mục này, chúng ta bàn về việc hiện thực quản lý user trong một app reactive.

Chúng ta tiếp tục hiện thực ứng dụng `ssia-ch17-ex1` đã bắt đầu ở mục 17.1 bằng cách thêm một `ReactiveUserDetailsService` vào context của ứng dụng. Chúng ta muốn đảm bảo endpoint `/hello` chỉ có thể được gọi bởi một user đã authentication. Như tên gọi gợi ý, contract `ReactiveUserDetailsService` định nghĩa user details service cho một app reactive.

Định nghĩa của contract này đơn giản như cái cho `UserDetailsService`. `ReactiveUserDetailsService` định nghĩa một method được Spring Security dùng để truy xuất một user theo username của nó. Khác biệt là method được `ReactiveUserDetailsService` mô tả trực tiếp trả về một `Mono<UserDetails>` chứ không phải `UserDetails` như với `UserDetailsService`. Đoạn code kế tiếp cho thấy định nghĩa của interface `ReactiveUserDetailsService`:

```java
public interface ReactiveUserDetailsService {
  Mono<UserDetails> findByUsername(String username);
}
```

Như trong trường hợp của `UserDetailsService`, bạn có thể viết một hiện thực tùy chỉnh của `ReactiveUserDetailsService` để cho Spring Security một cách lấy chi tiết user. Để đơn giản hóa phần minh họa này, chúng ta dùng một hiện thực do Spring Security cung cấp. Hiện thực `MapReactiveUserDetailsService` lưu chi tiết user trong bộ nhớ (giống như với `InMemoryUserDetailsManager` mà bạn đã học ở chương 2). Chúng ta thay đổi file *pom.xml* của project `ssia-ch17-ex1` và thêm dependency Spring Security, như đoạn code kế tiếp cho thấy:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

Sau đó chúng ta tạo một configuration class và thêm một `ReactiveUserDetailsService` cùng một `PasswordEncoder` vào Spring Security context. Tôi đặt tên configuration class là `ProjectConfig`. Bạn có thể tìm thấy định nghĩa của class này ở listing 17.2. Dùng một `ReactiveUserDetailsService`, chúng ta định nghĩa một user với username `john`, password `12345`, và một authority tôi đặt tên là `read`. Như bạn có thể quan sát, nó tương tự việc làm việc với một `UserDetailsService`. Khác biệt chính trong hiện thực của `ReactiveUserDetailsService` là method trả về một object `Publisher` reactive chứa `UserDetails` thay vì chính instance `UserDetails`. Spring Security lo phần còn lại của việc tích hợp.

**Listing 17.2 Class `ProjectConfig`**

```java
@Configuration
public class ProjectConfig {

  @Bean                                                        // ①
  public ReactiveUserDetailsService userDetailsService() {
    var u = User.withUsername("john")                          // ②
              .password("12345")
              .authorities("read")
              .build();

    var uds = new MapReactiveUserDetailsService(u);            // ③

    return uds;
  }

  @Bean                                                        // ④
  public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
  }
}
```

① Thêm một `ReactiveUserDetailsService` vào Spring context.

② Tạo một user mới với username, password, và authority của nó.

③ Tạo một `MapReactiveUserDetailsService` để quản lý các instance `UserDetails`.

④ Thêm một `PasswordEncoder` vào Spring context.

Giờ, khi khởi động và test ứng dụng, bạn có thể nhận thấy rằng bạn chỉ có thể gọi endpoint khi authentication bằng credential đúng. Trong trường hợp của chúng ta, chúng ta chỉ có thể dùng `john` với password `12345`, vì đó là bản ghi user duy nhất chúng ta đã thêm vào. Đoạn code sau đây cho thấy hành vi của app khi gọi endpoint với credential hợp lệ:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello!
```

Hình 17.5 giải thích kiến trúc chúng ta dùng trong ứng dụng này. Ở phía sau hậu trường, một `AuthenticationWebFilter` chặn HTTP request. Filter này ủy quyền trách nhiệm authentication cho một authentication manager. Authentication manager hiện thực contract `ReactiveAuthenticationManager`. Không giống app non-reactive, chúng ta không có authentication provider. `ReactiveAuthenticationManager` trực tiếp hiện thực logic authentication.

![Hình 17.5](images/ch17/ch17-fig05.png)

**Hình 17.5** Một `AuthenticationWebFilter` chặn request và ủy quyền trách nhiệm authentication cho một `ReactiveAuthenticationManager`. Nếu logic authentication liên quan tới user và password, `ReactiveAuthenticationManager` dùng một `ReactiveUserDetailsService` để tìm chi tiết user và một `PasswordEncoder` để kiểm chứng password.

Nếu bạn muốn tạo logic authentication tùy chỉnh của riêng mình, hãy hiện thực interface `ReactiveAuthenticationManager`. Kiến trúc cho app reactive không khác nhiều so với kiến trúc cho các ứng dụng non-reactive mà chúng ta đã bàn xuyên suốt cuốn sách này. Như trình bày ở hình 17.5, nếu authentication liên quan tới credential của user, thì chúng ta dùng một `ReactiveUserDetailsService` để lấy chi tiết user và một `PasswordEncoder` để kiểm chứng password.

Hơn nữa, framework vẫn biết cách inject một instance authentication khi bạn yêu cầu nó. Bạn yêu cầu chi tiết `Authentication` bằng cách thêm `Mono<Authentication>` làm tham số cho method trong controller class. Listing 17.3 trình bày những thay đổi đã thực hiện với controller class. Một lần nữa, thay đổi quan trọng là bạn dùng các reactive publisher. Hãy quan sát rằng chúng ta cần dùng `Mono<Authentication>` thay vì `Authentication` thuần túy như chúng ta đã làm trong app non-reactive.

**Listing 17.3 Class `HelloController`**

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  public Mono<String> hello(
    Mono<Authentication> auth) {      // ①

    Mono<String> message =            // ②
      auth.map(a -> "Hello " + a.getName());

    return message;
  }
}
```

① Yêu cầu framework cung cấp object authentication.

② Trả về tên của principal trong response.

Chạy lại ứng dụng và gọi endpoint, bạn quan sát thấy hành vi như trình bày ở đoạn code kế tiếp:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello john
```

Và giờ có lẽ bạn đang thắc mắc: Object `Authentication` đến từ đâu? Vì đây là một app reactive, chúng ta không thể dùng một `ThreadLocal` nữa bởi framework được thiết kế để quản lý `SecurityContext`. Nhưng Spring Security cung cấp cho chúng ta một hiện thực khác của context holder cho app reactive — `ReactiveSecurityContextHolder`. Chúng ta dùng cái này để làm việc với `SecurityContext` trong một app reactive. Vậy chúng ta vẫn có `SecurityContext`, nhưng giờ nó được quản lý khác đi. Hình 17.6 mô tả phần cuối của tiến trình authentication khi `ReactiveAuthenticationManager` authentication request thành công.

![Hình 17.6](images/ch17/ch17-fig06.png)

**Hình 17.6** Khi `ReactiveAuthenticationManager` authentication request thành công, nó trả về object `Authentication` cho filter. Filter lưu instance `Authentication` trong `SecurityContext`.

Listing 17.4 cho bạn thấy cách viết lại controller class nếu bạn muốn lấy chi tiết authentication trực tiếp từ security context. Cách tiếp cận này là một lựa chọn thay thế cho việc để framework inject nó qua tham số của method. Bạn sẽ tìm thấy thay đổi này được hiện thực trong project `ssia-ch17-ex2`.

**Listing 17.4 Làm việc với `ReactiveSecurityContextHolder`**

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public Mono<String> hello() {
      Mono<String> message =
        ReactiveSecurityContextHolder.getContext()     // ①
          .map(ctx -> ctx.getAuthentication())         // ②
          .map(auth -> "Hello " + auth.getName());     // ③

      return message;
    }
}
```

① Từ `ReactiveSecurityContextHolder`, nó lấy một `Mono<SecurityContext>`.

② Ánh xạ `SecurityContext` sang object `Authentication`.

③ Ánh xạ object `Authentication` sang thông điệp trả về.

Nếu bạn chạy lại ứng dụng và test lại endpoint, bạn có thể quan sát thấy nó hoạt động giống như trong các ví dụ trước ở mục này. Đây là lệnh:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello john
```

Giờ khi bạn biết Spring Security cung cấp một hiện thực để quản lý `SecurityContext` đúng cách trong môi trường reactive, bạn biết đây là cách app của bạn áp dụng các quy tắc authorization. Và những chi tiết bạn vừa học mở đường cho việc cấu hình các quy tắc authorization, điều chúng ta sẽ bàn ở mục 17.3.

---

## 17.3 Cấu hình quy tắc authorization trong app reactive

Trong mục này, chúng ta bàn về việc cấu hình quy tắc authorization. Như bạn đã biết từ các chương trước, authorization diễn ra sau authentication. Chúng ta đã bàn ở mục 17.1 và 17.2 về cách Spring Security quản lý user và `SecurityContext` trong app reactive. Nhưng khi app hoàn thành authentication và lưu chi tiết của request đã authentication trong `SecurityContext`, đã đến lúc authorization.

Như với bất kỳ ứng dụng nào khác, bạn có lẽ cũng cần cấu hình quy tắc authorization khi phát triển app reactive. Để dạy bạn cách thiết lập quy tắc authorization trong app reactive, trước hết chúng ta sẽ bàn ở mục 17.3.1 về cách bạn cấu hình ở tầng endpoint. Khi bàn xong về cấu hình authorization ở tầng endpoint, bạn sẽ học ở mục 17.3.2 cách áp dụng nó ở bất kỳ tầng nào khác của ứng dụng bằng method security.

### 17.3.1 Áp dụng authorization ở tầng endpoint trong app reactive

Trong mục này, chúng ta bàn về việc cấu hình authorization ở tầng endpoint trong app reactive. Việc thiết lập quy tắc authorization ở tầng endpoint là cách tiếp cận phổ biến nhất để cấu hình authorization trong một web app. Bạn đã khám phá điều này khi làm việc với các ví dụ trước trong cuốn sách. Cấu hình authorization ở tầng endpoint là thiết yếu — bạn dùng nó trong gần như mọi app. Vì vậy, bạn cần biết cách áp dụng nó cho app reactive nữa.

Bạn đã học từ các chương trước cách thiết lập quy tắc authorization bằng cách thêm một bean kiểu `SecurityFilterChain` vào context của app. Cách tiếp cận này không hoạt động trong app reactive. Để dạy bạn cách cấu hình quy tắc authorization cho tầng endpoint một cách đúng đắn với app reactive, chúng ta bắt đầu bằng cách làm một project mới, mà tôi đặt tên là `ssia-ch17-ex3`.

Trong app reactive, Spring Security dùng một contract tên là `SecurityWebFilterChain` để áp dụng những cấu hình mà chúng ta vốn làm bằng cách dùng một bean kiểu `SecurityFilterChain`, như đã bàn ở các chương trước. Với app reactive, chúng ta thêm một bean kiểu `SecurityWebFilterChain` vào Spring context. Để dạy bạn cách làm điều này, hãy hiện thực một ứng dụng cơ bản có hai endpoint mà chúng ta bảo vệ độc lập. Trong file *pom.xml* của project `ssia-ch17-ex3` mới tạo, hãy thêm các dependency cho app reactive web và tất nhiên là Spring Security:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

Tạo một controller class để định nghĩa hai endpoint mà chúng ta cấu hình quy tắc authorization cho chúng. Những endpoint này truy cập được ở các path `/hello` và `/ciao`. Để gọi endpoint `/hello`, một user cần authentication, nhưng bạn có thể gọi endpoint `/ciao` mà không cần authentication. Listing sau đây trình bày định nghĩa của controller.

**Listing 17.5 Class `HelloController` định nghĩa các endpoint cần bảo vệ**

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  public Mono<String> hello(Mono<Authentication> auth) {
    Mono<String> message = auth.map(a -> "Hello " + a.getName());
    return message;
  }

  @GetMapping("/ciao")
  public Mono<String> ciao() {
    return Mono.just("Ciao!");
  }
}
```

Trong configuration class, chúng ta đảm bảo khai báo một `ReactiveUserDetailsService` và một `PasswordEncoder` để định nghĩa một user, như bạn đã học ở mục 17.2. Listing sau đây định nghĩa những khai báo này.

**Listing 17.6 Configuration class khai báo các component cho việc quản lý user**

```java
@Configuration
public class ProjectConfig {

  @Bean
  public ReactiveUserDetailsService userDetailsService() {
    var u = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();

    var uds = new MapReactiveUserDetailsService(u);

    return uds;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
  }

  // ...
}
```

Ở listing 17.7, chúng ta làm việc trong cùng configuration class đã khai báo ở listing 17.6, nhưng lược bỏ phần khai báo `ReactiveUserDetailsService` và `PasswordEncoder` để bạn có thể tập trung vào cấu hình authorization mà chúng ta bàn. Ở listing 17.7, bạn có thể nhận thấy rằng chúng ta thêm một bean kiểu `SecurityWebFilterChain` vào Spring context. Method nhận tham số là một object kiểu `ServerHttpSecurity`, thứ được Spring inject vào. `ServerHttpSecurity` cho phép chúng ta xây dựng một instance của `SecurityWebFilterChain`. `ServerHttpSecurity` cung cấp các method để cấu hình tương tự những cái bạn đã dùng khi cấu hình authorization cho app non-reactive.

**Listing 17.7 Cấu hình endpoint authorization cho app reactive**

```java
@Configuration
public class ProjectConfig {

  // Phần code được lược bỏ

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(
    ServerHttpSecurity http) {

    http.httpBasic(Customizer.withDefaults());

    http.authorizeExchange(                             // ①
      c -> c.pathMatchers(HttpMethod.GET, "/hello")     // ②
                .authenticated()                        // ③
            .anyExchange()                              // ④
                .permitAll()                            // ⑤
    );

    return http.build();                                // ⑥
  }
}
```

① Bắt đầu cấu hình endpoint authorization.

② Chọn những request mà chúng ta áp dụng quy tắc authorization lên.

③ Cấu hình các request được chọn chỉ truy cập được khi đã authentication.

④ Tham chiếu tới bất kỳ request nào khác.

⑤ Cho phép request được gọi mà không cần authentication.

⑥ Xây dựng object `SecurityWebFilterChain` để trả về.

Chúng ta bắt đầu cấu hình authorization với method `authorizeExchange()`. Chúng ta gọi method này tương tự cách chúng ta gọi method `authorizeHttpRequests()` khi cấu hình endpoint authorization cho app non-reactive. Rồi chúng ta tiếp tục bằng cách dùng method `pathMatchers()`. Bạn có thể xem method này như tương đương với việc dùng `requestMatchers()` khi cấu hình endpoint authorization cho app non-reactive.

Cũng như với app non-reactive, khi chúng ta dùng matcher method để nhóm các request mà chúng ta áp dụng quy tắc authorization lên, chúng ta sau đó chỉ định quy tắc authorization là gì. Trong ví dụ của chúng ta, chúng ta gọi method `authenticated()`, thứ nêu rằng chỉ những request đã authentication mới được chấp nhận. Bạn cũng đã dùng một method tên là `authenticated()` khi cấu hình endpoint authorization cho app non-reactive. Các method cho app reactive được đặt tên giống nhau để trực quan hơn. Tương tự method `authenticated()`, bạn cũng có thể gọi những method này:

- `permitAll()` — Cấu hình app cho phép request mà không cần authentication
- `denyAll()` — Từ chối tất cả request
- `hasRole()` và `hasAnyRole()` — Áp dụng quy tắc dựa trên role
- `hasAuthority()` và `hasAnyAuthority()` — Áp dụng quy tắc dựa trên authority

Có vẻ như thiếu thứ gì đó, phải không? Chúng ta cũng có method `access()` như khi cấu hình quy tắc authorization trong app non-reactive chứ? Có. Nhưng nó hơi khác một chút, nên chúng ta sẽ làm một ví dụ riêng để chứng minh điều đó. Một điểm tương đồng khác trong cách đặt tên là method `anyExchange()`, thứ đảm nhận vai trò của `anyRequest()` trong app non-reactive.

> **NOTE** Tại sao nó được gọi là `anyExchange()`, và tại sao các nhà phát triển không giữ nguyên tên method là `anyRequest()`? Tại sao `authorizeExchange()` mà không phải `authorizeHttpRequests()`? Khác biệt này bắt nguồn từ thuật ngữ được dùng với app reactive. Chúng ta nói chung gọi việc giao tiếp giữa hai component theo kiểu reactive là **trao đổi (exchanging)** dữ liệu. Điều này củng cố hình ảnh dữ liệu được gửi đi dưới dạng phân đoạn trong một stream liên tục chứ không phải một khối lớn trong một request.

Chúng ta cũng cần chỉ định phương thức authentication như bất kỳ cấu hình liên quan nào khác. Chúng ta làm điều này với cùng instance `ServerHttpSecurity`, dùng các method có cùng tên và theo cùng cách bạn đã học dùng cho app non-reactive: `httpBasic()`, `formLogin()`, `csrf()`, `cors()`, thêm filter và tùy chỉnh filter chain, v.v. Cuối cùng, chúng ta gọi method `build()` để tạo instance của `SecurityWebFilterChain`, thứ mà cuối cùng chúng ta trả về để thêm vào Spring context.

Tôi đã nói với bạn ở đầu mục này rằng bạn cũng có thể dùng method `access()` trong cấu hình endpoint authorization của app reactive, giống như bạn có thể làm với app non-reactive. Nhưng như tôi đã nói khi bàn về cấu hình app non-reactive ở chương 7 và 8, chỉ dùng method `access()` khi bạn không thể áp dụng cấu hình của mình theo cách khác. Method `access()` mang lại cho bạn sự linh hoạt lớn, nhưng cũng làm cấu hình của app khó đọc hơn. Hãy luôn ưu tiên giải pháp đơn giản hơn thay vì giải pháp phức tạp hơn. Tuy nhiên, bạn sẽ gặp những tình huống mà bạn cần sự linh hoạt này. Ví dụ, giả sử bạn phải áp dụng một quy tắc authorization phức tạp hơn, và việc dùng `hasAuthority()` hoặc `hasRole()` cùng các method đồng hành là không đủ. Vì lý do này, tôi cũng sẽ dạy bạn cách dùng method `access()`. Tôi đã tạo một project mới tên là `ssia-ch17-ex4` cho ví dụ này. Ở listing kế tiếp, bạn có thể thấy cách tôi xây dựng object `SecurityWebFilterChain` để chỉ cho phép truy cập path `/hello` nếu user có role admin. Ngoài ra, việc truy cập chỉ có thể được cho phép trước buổi trưa. Với tất cả các endpoint khác, tôi hạn chế truy cập hoàn toàn.

**Listing 17.8 Dùng method `access()` khi hiện thực quy tắc cấu hình**

```java
@Configuration
public class ProjectConfig {

  // Phần code được lược bỏ

  @Bean
  public SecurityWebFilterChain
    securityWebFilterChain(ServerHttpSecurity http) {

    http.httpBasic(Customizer.withDefaults());

    http.authorizeExchange(
      c -> c.anyExchange()                                 // ①
               .access(this::getAuthorizationDecisionMono)
    );

    return http.build();
   }

  private Mono<AuthorizationDecision>
    getAuthorizationDecisionMono(                          // ②
            Mono<Authentication> a,
            AuthorizationContext c) {

    String path = getRequestPath(c);                       // ③
    boolean restrictedTime =
      LocalTime.now().isAfter(LocalTime.NOON);

    if(path.equals("/hello")) {                            // ④
      return  a.map(isAdmin())
               .map(auth -> auth && !restrictedTime)
               .map(AuthorizationDecision::new);
    }

      return Mono.just(new AuthorizationDecision(false));
  }

  // Phần code được lược bỏ
}
```

① Với bất kỳ request nào, nó áp dụng một quy tắc authorization tùy chỉnh.

② Method định nghĩa quy tắc authorization tùy chỉnh nhận `Authentication` và context của request làm tham số.

③ Từ context, nó lấy path của request.

④ Với path `/hello`, nó áp dụng quy tắc authorization tùy chỉnh.

Nó có thể trông khó, nhưng không phức tạp đến thế. Khi bạn dùng method `access()`, bạn cung cấp một hàm nhận tất cả chi tiết khả dĩ về request, đó là object `Authentication` và `AuthorizationContext`. Dùng object `Authentication`, bạn có chi tiết của user đã authentication: username, role hoặc authority, và các chi tiết tùy chỉnh khác tùy thuộc vào cách bạn hiện thực logic authentication. `AuthorizationContext` cung cấp thông tin về request: path, header, query param, cookie, v.v.

Hàm bạn cung cấp làm tham số cho method `access()` nên trả về một object kiểu `AuthorizationDecision`. Như bạn đoán, `AuthorizationDecision` là câu trả lời nói cho app biết request có được cho phép hay không. Khi bạn tạo một instance bằng `new AuthorizationDecision(true)`, nghĩa là bạn cho phép request. Nếu bạn tạo nó bằng `new AuthorizationDecision(false)`, nghĩa là bạn không cho phép request.

Ở listing 17.9, bạn tìm thấy hai method tôi đã lược bỏ ở listing 17.8 để bạn tiện theo dõi: `getRequestPath()` và `isAdmin()`. Bằng cách lược bỏ chúng, tôi để bạn tập trung vào logic được method `access()` sử dụng. Như bạn có thể quan sát, các method này rất đơn giản. Method `isAdmin()` trả về một hàm trả về `true` cho một instance `Authentication` có thuộc tính `ROLE_ADMIN`. Method `getRequestPath()` đơn giản trả về path của request.

**Listing 17.9 Định nghĩa của method `getRequestPath()` và `isAdmin()`**

```java
@Configuration
public class ProjectConfig {

  // Phần code được lược bỏ

  private String getRequestPath(AuthorizationContext c) {
    return c.getExchange()
            .getRequest()
            .getPath()
            .toString();
  }

  private Function<Authentication, Boolean> isAdmin() {
    return p ->
      p.getAuthorities().stream()
       .anyMatch(e -> e.getAuthority().equals("ROLE_ADMIN"));
  }
}
```

Chạy ứng dụng và gọi endpoint sẽ dẫn tới trạng thái response 403 Forbidden nếu bất kỳ quy tắc authorization nào chúng ta áp dụng không được thỏa mãn, hoặc đơn giản hiển thị một thông điệp trong HTTP response body:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello john
```

Điều gì đã xảy ra phía sau hậu trường trong các ví dụ ở mục này? Khi authentication kết thúc, một filter khác chặn request. `AuthorizationWebFilter` ủy quyền trách nhiệm authorization cho một `ReactiveAuthorizationManager` (hình 17.7).

![Hình 17.7](images/ch17/ch17-fig07.png)

**Hình 17.7** Sau khi tiến trình authentication kết thúc thành công, một filter khác, tên là `AuthorizationWebFilter`, chặn request. Filter này ủy quyền trách nhiệm authorization cho một `ReactiveAuthorizationManager`.

Khoan! Điều này có nghĩa là chúng ta chỉ có một `ReactiveAuthorizationManager` sao? Component này biết cách authorize một request dựa trên cấu hình chúng ta đã làm như thế nào? Để trả lời câu hỏi đầu tiên: không, thực ra có nhiều hiện thực của `ReactiveAuthorizationManager`. `AuthorizationWebFilter` dùng bean `SecurityWebFilterChain` mà chúng ta đã thêm vào Spring context. Với bean này, filter quyết định ủy quyền trách nhiệm authorization cho hiện thực `ReactiveAuthorizationManager` nào (hình 17.8).

![Hình 17.8](images/ch17/ch17-fig08.png)

**Hình 17.8** `AuthorizationFilter` dùng bean `SecurityWebFilterChain` (được tô đậm) mà chúng ta đã thêm vào context để biết nên dùng `ReactiveAuthorizationManager` nào.

### 17.3.2 Dùng method security trong app reactive

Trong mục này, chúng ta bàn về việc áp dụng quy tắc authorization cho tất cả các tầng của app reactive. Với app non-reactive, chúng ta dùng method security, và ở chương 11 và 12, bạn đã học các cách tiếp cận khác nhau để áp dụng quy tắc authorization ở mức method. Việc có thể áp dụng quy tắc authorization ở những tầng khác ngoài tầng endpoint mang lại cho bạn sự linh hoạt lớn và cho phép bạn áp dụng authorization cho các ứng dụng không phải web. Để dạy bạn cách dùng method security cho app reactive, chúng ta làm một ví dụ riêng, mà tôi đặt tên là `ssia-ch17-ex5`.

Thay vì global method security như khi làm việc với app non-reactive, chúng ta gọi cách tiếp cận này là **reactive method security**, nơi chúng ta áp dụng quy tắc authorization trực tiếp ở mức method. Với ví dụ của chúng ta, chúng ta dùng `@PreAuthorize` để kiểm chứng rằng một user có một role cụ thể để gọi một endpoint test. Để giữ ví dụ đơn giản, chúng ta dùng annotation `@PreAuthorize` trực tiếp trên method định nghĩa endpoint. Nhưng bạn có thể dùng nó theo cùng cách chúng ta đã bàn ở chương 11 và 12 cho app non-reactive: trên bất kỳ method component nào khác trong ứng dụng reactive của bạn. Listing 17.10 cho thấy định nghĩa của controller class. Hãy quan sát rằng chúng ta dùng `@PreAuthorize`, tương tự những gì bạn đã học ở chương 11. Dùng biểu thức SpEL, chúng ta khai báo rằng chỉ một admin mới có thể gọi method được annotate.

**Listing 17.10 Định nghĩa của controller class**

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  @PreAuthorize("hasRole('ADMIN')")       // ①
  public Mono<String> hello() {
    return Mono.just("Hello");
  }
}
```

① Dùng `@PreAuthorize` để hạn chế quyền truy cập tới method.

Ở đây bạn tìm thấy configuration class trong đó chúng ta dùng annotation `@EnableReactiveMethodSecurity` để bật tính năng reactive method security. Tương tự method security, chúng ta cần dùng tường minh một annotation để bật nó. Bên cạnh annotation này, trong configuration class, bạn cũng tìm thấy phần định nghĩa quản lý user thường lệ.

**Listing 17.11 Configuration class**

```java
@Configuration
@EnableReactiveMethodSecurity       // ①
public class ProjectConfig {

  @Bean
  public ReactiveUserDetailsService userDetailsService() {
    var u1 = User.withUsername("john")
            .password("12345")
            .roles("ADMIN")
            .build();

    var u2 = User.withUsername("bill")
            .password("12345")
            .roles("REGULAR_USER")
            .build();

    var uds = new MapReactiveUserDetailsService(u1, u2);

    return uds;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
  }
}
```

① Bật tính năng reactive method security.

Giờ bạn có thể khởi động ứng dụng và test hành vi của endpoint bằng cách gọi nó cho từng user. Bạn sẽ quan sát thấy rằng chỉ John có thể gọi endpoint vì chúng ta đã định nghĩa anh ta là admin. Bill chỉ là một user thông thường, nên nếu chúng ta thử gọi endpoint và authentication bằng Bill, chúng ta nhận về một response với trạng thái HTTP 403 Forbidden. Gọi endpoint `/hello` và authentication bằng user John trông như thế này:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello!
```

Gọi endpoint `/hello` và authentication bằng user Bill trông như thế này:

```bash
curl -u bill:12345 http://localhost:8080/hello
```

Response body là

```
Access Denied
```

Ở phía sau hậu trường, chức năng này hoạt động giống như với app non-reactive. Ở chương 11 và 12, bạn đã học rằng một aspect chặn lời gọi tới method và hiện thực authorization. Nếu lời gọi không thỏa mãn các quy tắc preauthorization đã chỉ định, aspect không ủy quyền lời gọi tới method (hình 17.9).

![Hình 17.9](images/ch17/ch17-fig09.png)

**Hình 17.9** Khi dùng method security, một aspect chặn lời gọi tới một method được bảo vệ. Nếu lời gọi không thỏa mãn các quy tắc preauthorization, aspect không ủy quyền lời gọi tới method.

---

## 17.4 Tạo một reactive OAuth 2 resource server

Có lẽ đến giờ bạn đang thắc mắc liệu chúng ta có thể dùng ứng dụng reactive trong một hệ thống được thiết kế trên framework OAuth 2 hay không. Trong mục này, chúng ta bàn về việc hiện thực một resource server như một app reactive. Bạn học cách cấu hình ứng dụng reactive của mình để dựa vào một cách tiếp cận authentication được hiện thực trên OAuth 2. Vì việc dùng OAuth 2 rất phổ biến ngày nay, bạn có thể gặp những yêu cầu mà ứng dụng resource server của bạn cần được thiết kế như một reactive server. Tôi đã tạo một project mới tên là `ssia-ch17-ex6`, và chúng ta sẽ hiện thực một ứng dụng reactive resource server. Bạn cần thêm các dependency trong *pom.xml*, như đoạn code kế tiếp minh họa:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-oauth2</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

Chúng ta cần một endpoint để test ứng dụng, nên chúng ta thêm một controller class. Đoạn code kế tiếp trình bày controller class:

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  public Mono<String> hello() {
    return Mono.just("Hello!");
  }
}
```

Và giờ là phần quan trọng nhất của ví dụ: cấu hình bảo mật. Với ví dụ này, chúng ta cấu hình resource server để dùng public key do authorization server expose nhằm kiểm chứng chữ ký của token. Để cấu hình phương thức authentication, chúng ta dùng `SecurityWebFilterChain`, như bạn đã học ở mục 17.3. Tuy nhiên, thay vì dùng method `httpBasic()`, chúng ta gọi method `oauth2ResourceServer()`. Rồi bằng cách gọi method `jwt()`, chúng ta định nghĩa loại token chúng ta dùng, và bằng cách dùng một object `Customizer`, chúng ta chỉ định cách chữ ký của token được kiểm chứng. Ở listing kế tiếp, bạn có thể tìm thấy định nghĩa của configuration class.

**Listing 17.12 Định nghĩa cấu hình security web filter chain**

```java
@Configuration
public class ProjectConfig {

  @Value("${jwk.endpoint}")
  private String jwkEndpoint;

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(
    ServerHttpSecurity http) {

    http.oauth2ResourceServer(               // ①
        c -> c.jwt(
           j -> j.jwkSetUri(jwkEndpoint)     // ②
        )
    );

    http.authorizeExchange(
       c -> c.anyExchange().authenticated()
    );

    return http.build();
  }
}
```

① Cấu hình phương thức authentication của resource server.

② Chỉ định cách token được kiểm chứng.

> **Ghi chú của người dịch:** Trong sách gốc, listing 17.12 có dấu `;` thừa bên trong biểu thức lambda (`j.jwkSetUri(jwkEndpoint);`). Tôi đã bỏ nó để đoạn code biên dịch được.

Theo cùng cách, chúng ta có thể đã cấu hình trực tiếp public key thay vì chỉ định một URI nơi public key được expose. Thay đổi duy nhất là gọi method `publicKey()` của instance `jwtSpec` và cung cấp một public key hợp lệ làm tham số. Bạn có thể dùng bất kỳ cách tiếp cận nào mà chúng ta đã bàn ở chương 15, nơi chúng ta phân tích chi tiết các cách tiếp cận để resource server kiểm chứng access token.

Tiếp theo, chúng ta thay đổi file *application.properties* để thêm giá trị cho URI nơi key set được expose, cũng như đổi cổng server thành 9090. Bằng cách này, chúng ta cho phép authorization server chạy trên cổng 8080. Ở đoạn code kế tiếp, bạn sẽ tìm thấy nội dung của file *application.properties*:

```properties
server.port=9090
jwk.endpoint=http://localhost:8080/auth/realms/master/protocol/openid-connect/certs
```

Hãy chạy và chứng minh rằng app có hành vi như mong đợi. Chúng ta sinh một access token dùng authorization server:

```bash
curl -XPOST 'http://localhost:8080/auth/realms/master/protocol/openid-connect/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'username=bill' \
--data-urlencode 'password=12345' \
--data-urlencode 'client_id=fitnessapp' \
--data-urlencode 'scope=fitnessapp'
```

Trong HTTP response body, chúng ta nhận được access token như trình bày ở đây:

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI…",
    "expires_in": 6000,
    "refresh_expires_in": 1800,
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5c… ",
    "token_type": "bearer",
    "not-before-policy": 0,
    "session_state": "610f49d7-78d2-4532-8b13-285f64642caa",
    "scope": "fitnessapp"
}
```

Dùng access token, chúng ta gọi endpoint `/hello` của ứng dụng như thế này:

```bash
curl -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJMjhQbVpYQTlUVW9QNTZoWU90YzNWT2swa1V2ajVVIn…' \
'http://localhost:9090/hello'
```

Response body là

```
Hello!
```

---

## Tóm tắt

- Các ứng dụng reactive có phong cách khác trong việc xử lý dữ liệu và trao đổi thông điệp với những component khác. App reactive có thể là lựa chọn tốt hơn trong một số tình huống, chẳng hạn khi chúng ta có thể chia dữ liệu thành những phân đoạn nhỏ hơn riêng biệt để xử lý và trao đổi.
- Như với bất kỳ ứng dụng nào khác, bạn cũng cần bảo vệ app reactive bằng các cấu hình bảo mật. Spring Security cung cấp một bộ công cụ tuyệt vời mà bạn có thể dùng để áp dụng cấu hình bảo mật cho app reactive, cũng như cho app non-reactive.
- Để hiện thực việc quản lý user trong app reactive với Spring Security, chúng ta dùng contract `ReactiveUserDetailsService`. Component này có cùng mục đích như `UserDetailsService` với app non-reactive: nó nói cho app biết cách lấy chi tiết user.
- Để hiện thực các quy tắc endpoint authorization cho một ứng dụng web reactive, bạn cần tạo một instance kiểu `SecurityWebFilterChain` và thêm nó vào Spring context. Bạn tạo instance `SecurityWebFilterChain` bằng cách dùng builder `ServerHttpSecurity`.
- Nói chung, tên của các method bạn dùng để định nghĩa cấu hình authorization giống với tên các method bạn dùng cho app non-reactive. Tuy nhiên, bạn sẽ thấy những khác biệt nhỏ về cách đặt tên liên quan tới thuật ngữ reactive. Ví dụ, thay vì dùng `authorizeHttpRequests()`, tên của cái tương ứng cho app reactive là `authorizeExchange()`.
- Spring Security cũng cung cấp một cách để định nghĩa quy tắc authorization ở mức method, gọi là reactive method security, và nó mang lại sự linh hoạt lớn trong việc áp dụng quy tắc authorization ở bất kỳ tầng nào của một app reactive. Nó tương tự cái chúng ta gọi là global method security với app non-reactive.
