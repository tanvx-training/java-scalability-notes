# Chương 17: Triển khai bảo mật trong các ứng dụng phản ứng

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm các nội dung:**

- Sử dụng Spring Security với các ứng dụng phản ứng

- Sử dụng ứng dụng phản ứng trong hệ thống được thiết kế dựa trên cơ chế xác thực OAuth 2

Phản ứng (Reactive) là một mô hình lập trình đòi hỏi chúng ta phải áp dụng một tư duy khác biệt khi phát triển ứng dụng. Lập trình phản ứng là một phương thức mạnh mẽ để phát triển các ứng dụng web và đã được đón nhận rộng rãi. Tôi thậm chí có thể nói rằng nó đã trở thành một xu hướng thời thượng từ vài năm trước, thời điểm mà bất kỳ hội thảo công nghệ lớn nào cũng có ít nhất vài bài tham luận thảo luận về ứng dụng phản ứng. Tuy nhiên, giống như mọi công nghệ khác trong lĩnh vực phát triển phần mềm, lập trình phản ứng không phải là giải pháp vạn năng cho mọi tình huống.

Trong một số trường hợp, cách tiếp cận phản ứng là một sự lựa chọn hoàn hảo. Nhưng trong những trường hợp khác, nó có thể chỉ khiến cuộc sống của bạn thêm phức tạp. Dù vậy, suy cho cùng, cách tiếp cận phản ứng tồn tại là để giải quyết một số hạn chế của lập trình mệnh lệnh (imperative programming), và do đó nó được dùng để né tránh các rào cản này. Một trong số đó liên quan đến việc thực thi các tác vụ lớn có khả năng phân rã. Với cách tiếp cận mệnh lệnh, bạn giao cho ứng dụng một tác vụ để thực thi, và ứng dụng có trách nhiệm giải quyết tác vụ đó. Nếu tác vụ quá lớn, ứng dụng có thể mất một khoảng thời gian đáng kể để hoàn thành. Phía client yêu cầu tác vụ sẽ phải đợi cho đến khi công việc được xử lý xong hoàn toàn mới nhận được phản hồi. Với lập trình phản ứng, bạn có thể chia nhỏ tác vụ để ứng dụng có cơ hội tiếp cận đồng thời một số tác vụ con. Nhờ vậy, client sẽ nhận được dữ liệu đã xử lý nhanh hơn.

Chương này thảo luận về bảo mật ở cấp độ ứng dụng trong các ứng dụng phản ứng bằng Spring Security. Tương tự như bất kỳ ứng dụng nào khác, bảo mật là một khía cạnh tối quan trọng của các ứng dụng phản ứng. Tuy nhiên, vì các ứng dụng phản ứng có thiết kế khác biệt, Spring Security đã điều chỉnh cách chúng ta triển khai các tính năng đã thảo luận ở các chương trước của cuốn sách này.

Chúng ta sẽ bắt đầu bằng một phần tổng quan ngắn gọn về cách triển khai ứng dụng phản ứng với Spring Framework trong mục 17.1. Sau đó, chúng ta sẽ áp dụng các tính năng bảo mật mà bạn đã học xuyên suốt cuốn sách này vào các ứng dụng phản ứng. Trong mục 17.2, chúng ta sẽ thảo luận về quản lý người dùng trong ứng dụng phản ứng, và trong mục 17.3, chúng ta sẽ tiếp tục áp dụng các quy tắc phân quyền. Cuối cùng, ở mục 17.4, bạn sẽ học cách triển khai các ứng dụng phản ứng trong một hệ thống được thiết kế trên nền tảng OAuth 2. Bạn sẽ hiểu được những điểm thay đổi dưới góc nhìn của Spring Security khi đối mặt với ứng dụng phản ứng, và dĩ nhiên, bạn cũng sẽ học cách áp dụng chúng thông qua các ví dụ thực tế.

## 17.1 Ứng dụng phản ứng là gì?

Trong mục này, chúng ta sẽ thảo luận ngắn gọn về các ứng dụng phản ứng. Vì trọng tâm của chương này là áp dụng bảo mật cho ứng dụng phản ứng, tôi muốn đảm bảo bạn đã nắm chắc các khái niệm cốt lõi của ứng dụng phản ứng trước khi đi sâu vào các cấu hình của Spring Security. Do chủ đề ứng dụng phản ứng rất rộng lớn, tôi sẽ chỉ điểm lại các khía cạnh chính của chúng như một bước khởi động. Nếu bạn chưa biết cách hoạt động của ứng dụng phản ứng, hoặc cần tìm hiểu chi tiết hơn, tôi khuyên bạn nên đọc phần 3 của cuốn sách Spring in Action, Sixth Edition, tác giả Craig Walls (Manning, 2022).

Khi hiện thực hóa các chức năng của ứng dụng, chúng ta thường sử dụng hai phương thức lập trình. Danh sách dưới đây sẽ làm rõ hai cách tiếp cận này:

- Với cách tiếp cận mệnh lệnh, ứng dụng của bạn sẽ xử lý phần lớn dữ liệu cùng một lúc. Ví dụ, một ứng dụng client gọi đến một endpoint do máy chủ cung cấp và gửi toàn bộ dữ liệu cần xử lý về phía backend. Giả sử bạn triển khai một chức năng cho phép người dùng tải tệp lên. Nếu người dùng chọn nhiều tệp và toàn bộ số tệp này được ứng dụng backend tiếp nhận để xử lý cùng một lúc, bạn đang làm việc với cách tiếp cận mệnh lệnh.

- Với cách tiếp cận phản ứng, ứng dụng của bạn tiếp nhận và xử lý dữ liệu theo từng phân đoạn. Không nhất thiết toàn bộ dữ liệu phải sẵn sàng ngay từ đầu thì mới có thể xử lý. Backend sẽ tiếp nhận và xử lý dữ liệu ngay khi nhận được. Giả sử người dùng chọn một số tệp và backend cần tải lên cũng như xử lý chúng. Backend sẽ không đợi nhận đủ tất cả các tệp cùng lúc rồi mới xử lý. Thay vào đó, nó có thể nhận từng tệp một và xử lý tệp đó trong lúc chờ đợi các tệp tiếp theo được gửi đến.

Hình 17.1 đưa ra một hình ảnh ẩn dụ cho hai cách tiếp cận lập trình này. Hãy tưởng tượng một nhà máy đóng chai sữa. Nếu nhà máy nhận toàn bộ sữa vào buổi sáng và chỉ giao sữa sau khi đã hoàn thành việc đóng chai cho tất cả, chúng ta gọi đó là quy trình không phản ứng (mệnh lệnh). Nếu nhà máy nhận sữa rải rác trong ngày và giao các đơn hàng ngay khi đóng chai đủ số lượng cần thiết, chúng ta gọi đó là quy trình phản ứng. Rõ ràng, đối với nhà máy sữa, việc sử dụng cách tiếp cận phản ứng mang lại nhiều lợi thế hơn so với cách tiếp cận không phản ứng.

Để triển khai các ứng dụng phản ứng, đặc tả Reactive Streams (http://www.reactive-streams.org/) cung cấp một phương thức chuẩn hóa cho việc xử lý luồng bất đồng bộ. Một trong những thư viện triển khai đặc tả này là Project Reactor17, nền tảng cấu thành nên mô hình lập trình phản ứng của Spring. Project Reactor cung cấp một API hướng hàm (functional API) để xây dựng các Reactive Streams.

Để có trải nghiệm thực tế hơn, hãy bắt đầu bằng việc triển khai một ứng dụng phản ứng đơn giản. Chúng ta sẽ tiếp tục phát triển ứng dụng này trong mục 17.2 khi thảo luận về quản lý người dùng trong ứng dụng phản ứng. Tôi đã tạo một dự án mới có tên `ssia-ch17-ex1`, tại đây chúng ta sẽ phát triển một ứng dụng web phản ứng cung cấp một endpoint demo. Trong tệp `pom.xml`, chúng ta phải thêm dependency web phản ứng như được trình bày trong đoạn mã dưới đây. Dependency này chứa Project Reactor và cho phép chúng ta sử dụng các class cũng như interface liên quan của nó trong dự án:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

Tiếp theo, chúng ta định nghĩa một `HelloController` đơn giản để chứa định nghĩa của endpoint demo. Đoạn mã 17.1 trình bày định nghĩa của class `HelloController`. Trong định nghĩa endpoint, bạn sẽ thấy tôi sử dụng `Mono` làm kiểu trả về. `Mono` là một trong những khái niệm cốt lõi được định nghĩa bởi thư viện triển khai Reactor. Khi làm việc với Reactor, bạn sẽ thường xuyên sử dụng `Mono` và `Flux`, cả hai đều định nghĩa các publisher (nguồn dữ liệu). Trong đặc tả Reactive Streams, một publisher được mô tả bởi interface `Publisher`. Interface này thể hiện một trong những giao kèo (contract) thiết yếu được sử dụng với Reactive Streams. Giao kèo còn lại là `Subscriber`. Giao kèo này mô tả thành phần tiêu thụ dữ liệu.

Khi thiết kế một endpoint trả về một kết quả nào đó, endpoint đó sẽ đóng vai trò là một publisher, vì vậy nó phải trả về một đối tượng triển khai interface `Publisher`. Nếu sử dụng Project Reactor, đối tượng này sẽ là một `Mono` hoặc một `Flux`. `Mono` là publisher cho một giá trị đơn lẻ, trong khi `Flux` là publisher cho nhiều giá trị. Hình 17.2 mô tả các thành phần này và mối quan hệ giữa chúng.

Để cách giải thích này trở nên trực quan hơn nữa, hãy quay lại phép ẩn dụ về nhà máy sữa. Nhà máy sữa là một triển khai backend phản ứng cung cấp một endpoint để tiếp nhận sữa cần xử lý. Endpoint này tạo ra một thành phẩm (sữa đóng chai), vì vậy nó cần trả về một `Publisher`. Nếu có nhiều hơn một chai sữa được yêu cầu, nhà máy sữa cần trả về một `Flux` — chính là triển khai `Publisher` của Project Reactor chuyên xử lý các trường hợp có từ không đến nhiều giá trị được tạo ra.

```java
// Đoạn mã 17.1 Định nghĩa class HelloController
@RestController
public class HelloController {
    @GetMapping("/hello")
    public Mono<String> hello() {
        return Mono.just("Hello!");
    }
}
```

Bây giờ bạn có thể khởi động và kiểm thử ứng dụng. Điều đầu tiên bạn nhận thấy khi nhìn vào terminal của ứng dụng là Spring Boot không còn cấu hình máy chủ Tomcat nữa. Theo mặc định, Spring Boot thường cấu hình Tomcat cho một ứng dụng web, và bạn có thể đã quan sát thấy khía cạnh này trong bất kỳ ví dụ nào được phát triển trước đó trong cuốn sách. Thay vào đó, giờ đây Spring Boot tự động cấu hình Netty18 làm máy chủ web phản ứng mặc định cho một dự án Spring Boot.

Điều thứ hai bạn có thể nhận thấy khi gọi endpoint là nó không có hành vi nào khác biệt so với một endpoint được phát triển theo cách tiếp cận không phản ứng. Bạn vẫn tìm thấy trong phần thân phản hồi HTTP thông điệp `Hello!` mà endpoint trả về trong luồng `Mono` đã định nghĩa. Đoạn mã tiếp theo thể hiện hành vi của ứng dụng khi gọi endpoint:

```bash
curl http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello!
```

Nhưng tại sao cách tiếp cận phản ứng lại khác biệt dưới góc độ của Spring Security? Đằng sau hậu trường, một triển khai phản ứng sử dụng nhiều thread (luồng) để xử lý các tác vụ trên luồng dữ liệu. Nói cách khác, nó thay đổi triết lý "mỗi yêu cầu một luồng" (one-thread-per-request) vốn được áp dụng cho các ứng dụng web thiết kế theo cách tiếp cận mệnh lệnh (hình 17.3). Và từ đây, nhiều điểm khác biệt xuất hiện:

- Triển khai `SecurityContext` không hoạt động theo cùng một cách trong các ứng dụng phản ứng. Hãy nhớ rằng, `SecurityContext` dựa trên cơ chế `ThreadLocal`19, trong khi hiện tại chúng ta lại có nhiều hơn một thread xử lý cho mỗi yêu cầu.

- Do những thay đổi của `SecurityContext`, bất kỳ cấu hình phân quyền nào giờ đây cũng bị ảnh hưởng. Hãy nhớ lại từ Chương 5 rằng các quy tắc phân quyền thường dựa vào instance `Authentication` được lưu trữ trong `SecurityContext`. Giờ đây, các cấu hình bảo mật được áp dụng ở lớp endpoint, cũng như tính năng bảo mật phương thức toàn cục (global method security), đều bị ảnh hưởng.

- `UserDetailsService`, thành phần chịu trách nhiệm truy xuất thông tin chi tiết của người dùng, là một nguồn dữ liệu. Do đó, service quản lý thông tin người dùng này cũng cần hỗ trợ cách tiếp cận phản ứng. (Chúng ta đã tìm hiểu về giao kèo này trong Chương 2.)

Hình 17.4 trình bày một cách nhìn nhận khác về cách tiếp cận này. Hãy tưởng tượng một nhóm người cùng giải quyết một tập hợp các tác vụ. Mỗi người có thể nhận một tác vụ và tạm gác lại khi họ bị nghẽn. Không phải lúc nào cũng chính thread đó sẽ tiếp tục thực hiện phần việc còn dang dở của tác vụ đã bị bỏ lại. Do đó, ngữ cảnh bảo mật không thể gán cố định cho một thread nữa, mà bằng cách nào đó nó phải được liên kết chặt chẽ với chính tác vụ đó.

May mắn thay, Spring Security cung cấp sự hỗ trợ toàn diện cho các ứng dụng phản ứng và bao quát tất cả các trường hợp mà bạn không thể sử dụng các triển khai dành cho ứng dụng không phản ứng được nữa. Trong phần tiếp theo của chương này, chúng ta sẽ thảo luận về cách bạn triển khai các cấu hình bảo mật với Spring Security cho các ứng dụng phản ứng. Chúng ta sẽ bắt đầu trong mục 17.2 với việc triển khai quản lý người dùng và tiếp tục trong mục 17.3 với việc áp dụng các quy tắc phân quyền cho endpoint, nơi chúng ta sẽ khám phá cách thức hoạt động của ngữ cảnh bảo mật trong các ứng dụng phản ứng. Sau đó, chúng ta sẽ tiếp tục thảo luận về bảo mật phương thức phản ứng (reactive method security), cơ chế thay thế cho bảo mật phương thức toàn cục của các ứng dụng mệnh lệnh.

## 17.2 Quản lý người dùng trong ứng dụng phản ứng

Thông thường trong các ứng dụng, phương thức xác thực người dùng dựa trên cặp thông tin định danh gồm username và password. Đây là cách tiếp cận cơ bản và chúng ta đã thảo luận về nó ngay từ ứng dụng đơn giản nhất được triển khai ở Chương 2. Tuy nhiên, với các ứng dụng phản ứng, việc triển khai thành phần đảm nhận nhiệm vụ quản lý người dùng cũng thay đổi theo. Trong mục này, chúng ta sẽ thảo luận về việc triển khai quản lý người dùng trong một ứng dụng phản ứng.

Chúng ta tiếp tục triển khai ứng dụng `ssia-ch17-ex1` đã bắt đầu ở mục 17.1 bằng cách thêm một `ReactiveUserDetailsService` vào context của ứng dụng. Chúng ta muốn đảm bảo rằng endpoint `/hello` chỉ có thể được gọi bởi một người dùng đã xác thực. Đúng như tên gọi của nó, giao kèo `ReactiveUserDetailsService` định nghĩa dịch vụ quản lý thông tin người dùng dành cho một ứng dụng phản ứng.

Định nghĩa của giao kèo này cũng đơn giản như định nghĩa của `UserDetailsService`. `ReactiveUserDetailsService` khai báo một phương thức được Spring Security sử dụng để truy xuất thông tin người dùng dựa trên username của họ. Điểm khác biệt là phương thức được mô tả bởi `ReactiveUserDetailsService` trực tiếp trả về một đối tượng kiểu `Mono<UserDetails>` chứ không phải `UserDetails` như của `UserDetailsService`. Đoạn mã tiếp theo hiển thị định nghĩa của interface `ReactiveUserDetailsService`:

```java
public interface ReactiveUserDetailsService {
    Mono<UserDetails> findByUsername(String username);
}
```

Tương tự như trường hợp của `UserDetailsService`, bạn có thể viết một triển khai tùy chỉnh của `ReactiveUserDetailsService` để cung cấp cho Spring Security một phương thức lấy thông tin chi tiết của người dùng. Để đơn giản hóa phần minh họa này, chúng ta sẽ sử dụng một triển khai có sẵn do Spring Security cung cấp. Triển khai `MapReactiveUserDetailsService` lưu trữ thông tin chi tiết của người dùng trong bộ nhớ trong (tương tự như `InMemoryUserDetailsManager` mà bạn đã tìm hiểu ở Chương 2). Chúng ta thay đổi tệp `pom.xml` của dự án `ssia-ch17-ex1` và thêm dependency Spring Security như đoạn mã dưới đây:

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

Sau đó, chúng ta tạo một class cấu hình và thêm một `ReactiveUserDetailsService` cùng một `PasswordEncoder` vào ngữ cảnh của Spring Security. Tôi đặt tên cho class cấu hình này là `ProjectConfig`. Bạn có thể tìm thấy định nghĩa của class này trong đoạn mã 17.2. Sử dụng một `ReactiveUserDetailsService`, chúng ta định nghĩa một người dùng với username là john, password là 12345, và một quyền hạn (authority) mà tôi đặt tên là read. Như bạn có thể thấy, công việc này tương tự như khi làm việc với `UserDetailsService`. Sự khác biệt chính trong triển khai của `ReactiveUserDetailsService` là phương thức trả về một đối tượng `Publisher` phản ứng chứa `UserDetails` thay vì chính instance `UserDetails` đó. Spring Security sẽ đảm nhận phần việc tích hợp còn lại.

```java
// Đoạn mã 17.2 Class ProjectConfig
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
}
```

Giờ đây, khi khởi động và chạy thử ứng dụng, bạn sẽ nhận thấy rằng bạn chỉ có thể gọi endpoint khi đã xác thực bằng thông tin đăng nhập hợp lệ. Trong trường hợp của chúng ta, chúng ta chỉ có thể sử dụng tài khoản john với password 12345, vì đó là bản ghi người dùng duy nhất được thêm vào. Đoạn mã sau đây hiển thị hành vi của ứng dụng khi gọi endpoint với thông tin đăng nhập hợp lệ:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello!
```

Hình 17.5 giải thích kiến trúc mà chúng ta sử dụng trong ứng dụng này. Đằng sau hậu trường, một `AuthenticationWebFilter` sẽ chặn yêu cầu HTTP. Filter này ủy quyền xử lý xác thực cho một authentication manager (trình quản lý xác thực). Trình quản lý xác thực này triển khai giao kèo `ReactiveAuthenticationManager`. Không giống như các ứng dụng không phản ứng, chúng ta không có các bộ cung cấp xác thực (authentication providers). `ReactiveAuthenticationManager` trực tiếp thực thi logic xác thực.

Nếu muốn tạo logic xác thực tùy chỉnh của riêng mình, bạn hãy triển khai interface `ReactiveAuthenticationManager`. Kiến trúc dành cho các ứng dụng phản ứng không khác biệt nhiều so với kiến trúc của các ứng dụng không phản ứng mà chúng ta đã thảo luận xuyên suốt cuốn sách này. Như được trình bày trong hình 17.4, nếu quá trình xác thực liên quan đến thông tin đăng nhập của người dùng, chúng ta sẽ sử dụng một `ReactiveUserDetailsService` để lấy thông tin người dùng và một `PasswordEncoder` để kiểm tra password.

Hơn thế nữa, framework vẫn biết cách inject một instance authentication khi bạn yêu cầu. Bạn yêu cầu thông tin chi tiết của `Authentication` bằng cách thêm `Mono<Authentication>` làm tham số cho phương thức trong class controller. Đoạn mã 17.3 trình bày các thay đổi được thực hiện đối với class controller. Một lần nữa, thay đổi đáng kể là bạn sử dụng các publisher phản ứng. Hãy lưu ý rằng chúng ta cần sử dụng `Mono<Authentication>` thay vì đối tượng `Authentication` thông thường như chúng ta vẫn làm trong các ứng dụng không phản ứng.

```java
// Đoạn mã 17.3 Class HelloController
@RestController
public class HelloController {
    @GetMapping("/hello")
    public Mono<String> hello(Mono<Authentication> auth) {
        Mono<String> message = auth.map(a -> "Hello " + a.getName());
        return message;
    }
}
```

Chạy lại ứng dụng và gọi endpoint, bạn sẽ quan sát thấy hành vi như được trình bày trong đoạn mã tiếp theo:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello john
```

Và giờ chắc hẳn bạn đang tự hỏi: Đối tượng `Authentication` này từ đâu mà có? Vì đây là một ứng dụng phản ứng, chúng ta không thể sử dụng `ThreadLocal` được nữa bởi vì framework được thiết kế để quản lý `SecurityContext` theo cách khác. Tuy nhiên, Spring Security cung cấp cho chúng ta một triển khai khác của bộ lưu trữ ngữ cảnh dành cho các ứng dụng phản ứng, đó là `ReactiveSecurityContextHolder`. Chúng ta sử dụng class này để làm việc với `SecurityContext` trong một ứng dụng phản ứng. Vì vậy, chúng ta vẫn có `SecurityContext`, nhưng hiện tại nó được quản lý theo một cơ chế khác. Hình 17.6 mô tả giai đoạn kết thúc của quá trình xác thực sau khi `ReactiveAuthenticationManager` xác thực yêu cầu thành công. Đoạn mã 17.4 hướng dẫn bạn cách viết lại class controller nếu bạn muốn lấy thông tin xác thực trực tiếp từ ngữ cảnh bảo mật. Cách tiếp cận này là một giải pháp thay thế cho việc để framework tự động inject thông tin qua tham số của phương thức. Bạn có thể tìm thấy thay đổi này được triển khai trong dự án `ssia-ch17-ex2`.

```java
// Đoạn mã 17.4 Làm việc với ReactiveSecurityContextHolder
@RestController
public class HelloController {
    @GetMapping("/hello")
    public Mono<String> hello() {
        Mono<String> message = ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication())
            .map(auth -> "Hello " + auth.getName());
        return message;
    }
}
```

Nếu bạn chạy lại ứng dụng và kiểm thử lại endpoint, bạn có thể thấy nó hoạt động hoàn toàn giống như các ví dụ trước trong mục này. Đây là câu lệnh:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello john
```

Bây giờ bạn đã biết Spring Security cung cấp một giải pháp để quản lý `SecurityContext` một cách hợp lý trong môi trường phản ứng, bạn hiểu rằng đây chính là cách ứng dụng của bạn áp dụng các quy tắc phân quyền. Và những chi tiết bạn vừa tìm hiểu sẽ mở đường cho việc cấu hình các quy tắc phân quyền mà chúng ta sẽ thảo luận trong mục 17.3.

## 17.3 Cấu hình các quy tắc phân quyền trong ứng dụng phản ứng

Trong mục này, chúng ta thảo luận về việc cấu hình các quy tắc phân quyền (authorization rules). Như bạn đã biết từ các chương trước, quá trình phân quyền sẽ tiếp nối sau khi xác thực thành công. Chúng ta đã thảo luận trong mục 17.1 và 17.2 về cách Spring Security quản lý người dùng và `SecurityContext` trong các ứng dụng phản ứng. Nhưng một khi ứng dụng hoàn tất việc xác thực và lưu trữ thông tin chi tiết của yêu cầu đã được xác thực vào `SecurityContext`, đó là lúc quy trình phân quyền bắt đầu hoạt động.

Giống như bất kỳ ứng dụng nào khác, bạn có lẽ cũng cần cấu hình các quy tắc phân quyền khi phát triển ứng dụng phản ứng. Để hướng dẫn bạn cách thiết lập các quy tắc phân quyền trong ứng dụng phản ứng, trước tiên chúng ta sẽ thảo luận trong mục 17.3.1 về cách thực hiện cấu hình ở lớp endpoint. Sau khi hoàn tất phần thảo luận về cấu hình phân quyền ở lớp endpoint, bạn sẽ tìm hiểu trong mục 17.3.2 cách áp dụng nó ở bất kỳ lớp nào khác của ứng dụng bằng cơ chế bảo mật phương thức.

### 17.3.1 Áp dụng phân quyền ở lớp endpoint trong các ứng dụng phản ứng

Trong mục này, chúng ta thảo luận về việc cấu hình phân quyền ở lớp endpoint trong các ứng dụng phản ứng. Thiết lập các quy tắc phân quyền ở lớp endpoint là cách tiếp cận phổ biến nhất để cấu hình phân quyền trong một ứng dụng web. Bạn đã khám phá ra điều này khi làm việc với các ví dụ trước đó trong cuốn sách. Cấu hình phân quyền ở lớp endpoint là vô cùng thiết yếu — bạn sử dụng nó trong hầu hết mọi ứng dụng. Do đó, bạn cần biết cách áp dụng nó cho cả các ứng dụng phản ứng.

Từ các chương trước, bạn đã học cách thiết lập các quy tắc phân quyền bằng cách thêm một bean kiểu `SecurityFilterChain` vào ngữ cảnh của ứng dụng. Tuy nhiên, cách tiếp cận này không hoạt động trong các ứng dụng phản ứng. Để hướng dẫn bạn cách cấu hình chuẩn xác các quy tắc phân quyền cho lớp endpoint trong ứng dụng phản ứng, chúng ta sẽ bắt đầu làm việc trên một dự án mới, tôi đặt tên là `ssia-ch17-ex3`.

Trong các ứng dụng phản ứng, Spring Security sử dụng một giao kèo mang tên `SecurityWebFilterChain` để áp dụng các cấu hình mà chúng ta thường thực hiện bằng cách sử dụng một bean kiểu `SecurityFilterChain` trong các ứng dụng không phản ứng. Với ứng dụng phản ứng, chúng ta thêm một bean kiểu `SecurityWebFilterChain` vào Spring context. Để tìm hiểu cách thực hiện việc này, hãy triển khai một ứng dụng cơ bản có hai endpoint được bảo mật độc lập. Trong tệp `pom.xml` của dự án `ssia-ch17-ex3` mới tạo, hãy thêm các dependency cho ứng dụng web phản ứng và Spring Security:

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

Tạo một class controller để định nghĩa hai endpoint mà chúng ta sẽ cấu hình các quy tắc phân quyền. Các endpoint này có thể truy cập được tại các đường dẫn `/hello` và `/ciao`. Để gọi endpoint `/hello`, người dùng cần phải xác thực, nhưng bạn có thể gọi endpoint `/ciao` mà không cần xác thực. Đoạn mã dưới đây trình bày định nghĩa của controller.

```java
// Đoạn mã 17.5 Class HelloController định nghĩa các endpoint cần bảo mật
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

Trong class cấu hình, chúng ta khai báo một `ReactiveUserDetailsService` và một `PasswordEncoder` để định nghĩa một người dùng, như bạn đã tìm hiểu ở mục 17.2. Đoạn mã dưới đây định nghĩa các khai báo này.

```java
// Đoạn mã 17.6 Class cấu hình khai báo các thành phần quản lý người dùng
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

Trong đoạn mã 17.7, chúng ta làm việc trên chính class cấu hình đã khai báo ở đoạn mã 17.6, nhưng lược bớt phần khai báo của `ReactiveUserDetailsService` và `PasswordEncoder` để bạn có thể tập trung vào cấu hình phân quyền đang được thảo luận. Trong đoạn mã 17.7, bạn có thể nhận thấy chúng ta thêm một bean kiểu `SecurityWebFilterChain` vào Spring context. Phương thức này nhận một tham số là đối tượng kiểu `ServerHttpSecurity`, được inject bởi Spring. `ServerHttpSecurity` cho phép chúng ta xây dựng một instance của `SecurityWebFilterChain`. `ServerHttpSecurity` cung cấp các phương thức cấu hình tương tự như các phương thức bạn đã sử dụng khi cấu hình phân quyền cho các ứng dụng không phản ứng.

```java
// Đoạn mã 17.7 Cấu hình phân quyền endpoint cho các ứng dụng phản ứng
@Configuration
public class ProjectConfig {
    // Phần mã lược bỏ
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeExchange(c -> c.pathMatchers(HttpMethod.GET, "/hello")
            .authenticated()
            .anyExchange()
            .permitAll()
        );
        return http.build();
    }
}
```

Chúng ta bắt đầu cấu hình phân quyền bằng phương thức `authorizeExchange()`. Chúng ta gọi phương thức này tương tự như cách chúng ta gọi phương thức `authorizeHttpRequests()` khi cấu hình phân quyền endpoint cho các ứng dụng không phản ứng. Sau đó, chúng ta tiếp tục bằng cách sử dụng phương thức `pathMatchers()`. Bạn có thể coi phương thức này tương đương với việc sử dụng `requestMatchers()` khi cấu hình phân quyền endpoint cho các ứng dụng không phản ứng.

Tương tự như đối với các ứng dụng không phản ứng, một khi đã sử dụng phương thức khớp đường dẫn (matcher) để nhóm các yêu cầu cần áp dụng quy tắc phân quyền, sau đó chúng ta sẽ chỉ định quy tắc phân quyền cụ thể là gì. Trong ví dụ của mình, chúng ta đã gọi phương thức `authenticated()`, phương thức này tuyên bố rằng chỉ các yêu cầu đã xác thực mới được chấp nhận. Bạn cũng đã sử dụng một phương thức tên là `authenticated()` khi cấu hình phân quyền endpoint cho các ứng dụng không phản ứng. Các phương thức dành cho ứng dụng phản ứng được đặt tên giống hệt nhau để giúp chúng trở nên trực quan hơn. Tương tự như phương thức `authenticated()`, bạn cũng có thể gọi các phương thức sau:

- `permitAll()` — Cấu hình ứng dụng để cho phép các yêu cầu truy cập mà không cần xác thực

- `denyAll()` — Từ chối tất cả các yêu cầu

- `hasRole()` và `hasAnyRole()` — Áp dụng các quy tắc dựa trên vai trò (role)

- `hasAuthority()` và `hasAnyAuthority()` — Áp dụng các quy tắc dựa trên quyền hạn (authority)

Dường như có điều gì đó còn thiếu, phải không? Liệu chúng ta có phương thức `access()` như khi cấu hình các quy tắc phân quyền trong ứng dụng không phản ứng hay không? Có. Nhưng nó hơi khác một chút, vì vậy chúng ta sẽ làm việc trên một ví dụ riêng biệt để chứng minh điều đó. Một điểm tương đồng khác trong cách đặt tên là phương thức `anyExchange()` đảm nhận vai trò của những gì từng là `anyRequest()` trong các ứng dụng không phản ứng.

> **LƯU Ý**: Tại sao nó được gọi là `anyExchange()`, và tại sao các nhà phát triển không giữ nguyên tên phương thức là `anyRequest()`? Tại sao lại là `authorizeExchange()` chứ không phải `authorizeHttpRequests()`? Sự khác biệt này bắt nguồn từ thuật ngữ được sử dụng với các ứng dụng phản ứng. Chúng ta thường gọi việc giao tiếp giữa hai thành phần theo mô hình phản ứng là trao đổi dữ liệu (exchanging data). Điều này củng cố hình ảnh dữ liệu được gửi đi dưới dạng phân đoạn trong một luồng liên tục chứ không phải là một khối lớn trong một yêu cầu duy nhất.

Chúng ta cũng cần chỉ định phương thức xác thực tương tự như bất kỳ cấu hình liên quan nào khác. Chúng ta thực hiện việc này với cùng một instance `ServerHttpSecurity`, sử dụng các phương thức có cùng tên và theo cùng một cách thức mà bạn đã học đối với các ứng dụng không phản ứng: `httpBasic()`, `formLogin()`, `csrf()`, `cors()`, thêm các filter và tùy chỉnh chuỗi filter (filter chain), v.v. Cuối cùng, chúng ta gọi phương thức `build()` để tạo instance của `SecurityWebFilterChain`, rồi trả về để thêm nó vào Spring context.

Tôi đã nói với bạn ở phần trước của mục này rằng bạn cũng có thể sử dụng phương thức `access()` trong cấu hình phân quyền endpoint của ứng dụng phản ứng tương tự như đối với ứng dụng không phản ứng. Nhưng như tôi đã đề cập khi thảo luận về cấu hình ứng dụng không phản ứng ở Chương 7 và 8, bạn chỉ nên sử dụng phương thức `access()` khi không thể áp dụng cấu hình của mình bằng cách nào khác. Phương thức `access()` mang lại cho bạn sự linh hoạt tuyệt vời nhưng cũng khiến cấu hình của ứng dụng trở nên khó đọc hơn. Hãy luôn ưu tiên giải pháp đơn giản hơn thay vì giải pháp phức tạp hơn. Tuy nhiên, bạn sẽ gặp những tình huống cần đến sự linh hoạt này. Ví dụ, giả sử bạn phải áp dụng một quy tắc phân quyền phức tạp hơn, và việc sử dụng `hasAuthority()` hay `hasRole()` cùng các phương thức đồng hành của nó là không đủ. Vì lý do này, tôi cũng sẽ hướng dẫn bạn cách sử dụng phương thức `access()`. Tôi đã tạo một dự án mới có tên `ssia-ch17-ex4` cho ví dụ này. Trong đoạn mã tiếp theo, bạn có thể thấy cách tôi xây dựng đối tượng `SecurityWebFilterChain` để chỉ cho phép truy cập vào đường dẫn `/hello` nếu người dùng có vai trò admin. Ngoài ra, quyền truy cập chỉ có thể được cho phép trước thời điểm giữa trưa. Đối với tất cả các endpoint khác, tôi hạn chế quyền truy cập hoàn toàn.

```java
// Đoạn mã 17.8 Sử dụng phương thức access() khi triển khai các quy tắc cấu hình
@Configuration
public class ProjectConfig {
    // Phần mã lược bỏ
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeExchange(c -> c.anyExchange()
            .access(this::getAuthorizationDecisionMono)
        );
        return http.build();
    }

    private Mono<AuthorizationDecision> getAuthorizationDecisionMono(
        Mono<Authentication> a,
        AuthorizationContext c) {
        String path = getRequestPath(c);
        boolean restrictedTime = LocalTime.now().isAfter(LocalTime.NOON);
        if (path.equals("/hello")) {
            return a.map(isAdmin())
                .map(auth -> auth && !restrictedTime)
                .map(AuthorizationDecision::new);
        }
        return Mono.just(new AuthorizationDecision(false));
    }
    // Phần mã lược bỏ
}
```

Trông có vẻ phức tạp nhưng thực ra không đến mức đó. Khi sử dụng phương thức `access()`, bạn cung cấp một hàm nhận tất cả các thông tin chi tiết có thể có về yêu cầu, bao gồm đối tượng `Authentication` và `AuthorizationContext`. Sử dụng đối tượng `Authentication`, bạn có được thông tin chi tiết của người dùng đã xác thực: username, các vai trò hoặc quyền hạn, và các thông tin tùy chỉnh khác tùy thuộc vào cách bạn triển khai logic xác thực. `AuthorizationContext` cung cấp thông tin về yêu cầu: đường dẫn, các header, tham số truy vấn (query params), cookie, v.v.

Hàm bạn cung cấp làm tham số cho phương thức `access()` sẽ trả về một đối tượng kiểu `AuthorizationDecision`. Như bạn đã đoán, `AuthorizationDecision` là câu trả lời cho biết yêu cầu đó có được phép truy cập hay không. Khi bạn tạo một instance bằng lệnh `new AuthorizationDecision(true)`, điều đó có nghĩa là bạn cho phép yêu cầu truy cập. Nếu bạn tạo nó bằng lệnh `new AuthorizationDecision(false)`, điều đó có nghĩa là bạn từ chối yêu cầu.

Trong đoạn mã 17.9, bạn sẽ tìm thấy hai phương thức mà tôi đã lược bỏ trong đoạn mã 17.8 để thuận tiện cho bạn theo dõi: `getRequestPath()` và `isAdmin()`. Bằng cách lược bớt chúng, tôi muốn bạn tập trung vào logic được sử dụng bởi phương thức `access()`. Như bạn có thể thấy, các phương thức này rất đơn giản. Phương thức `isAdmin()` trả về một hàm cho kết quả true đối với một instance `Authentication` sở hữu thuộc tính `ROLE_ADMIN`. Phương thức `getRequestPath()` chỉ đơn thuần trả về đường dẫn của yêu cầu.

```java
// Đoạn mã 17.9 Định nghĩa các phương thức getRequestPath() và isAdmin()
@Configuration
public class ProjectConfig {
    // Phần mã lược bỏ
    private String getRequestPath(AuthorizationContext c) {
        return c.getExchange()
            .getRequest()
            .getPath()
            .toString();
    }

    private Function<Authentication, Boolean> isAdmin() {
        return p -> p.getAuthorities().stream()
            .anyMatch(e -> e.getAuthority().equals("ROLE_ADMIN"));
    }
}
```

Chạy ứng dụng và gọi endpoint sẽ dẫn đến kết quả là mã trạng thái phản hồi 403 Forbidden nếu bất kỳ quy tắc phân quyền nào chúng ta áp dụng không được đáp ứng, hoặc hiển thị một thông điệp trong phần thân phản hồi HTTP nếu thành công:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello john
```

Điều gì đã diễn ra đằng sau hậu trường trong các ví dụ của mục này? Khi quá trình xác thực kết thúc, một filter khác sẽ chặn yêu cầu. `AuthorizationWebFilter` sẽ ủy quyền xử lý phân quyền cho một `ReactiveAuthorizationManager` (hình 17.7).

Khoan đã! Điều này có nghĩa là chúng ta chỉ có duy nhất một `ReactiveAuthorizationManager`? Làm thế nào thành phần này biết cách phân quyền cho một yêu cầu dựa trên các cấu hình mà chúng ta đã thực hiện? Để trả lời cho câu hỏi thứ nhất: không, trên thực tế có nhiều triển khai khác nhau của `ReactiveAuthorizationManager`. `AuthorizationWebFilter` sử dụng bean `SecurityWebFilterChain` mà chúng ta đã thêm vào Spring context. Nhờ có bean này, filter sẽ quyết định nên ủy thác trách nhiệm phân quyền cho triển khai `ReactiveAuthorizationManager` cụ thể nào (hình 17.8).

### 17.3.2 Sử dụng bảo mật phương thức trong các ứng dụng phản ứng

Trong mục này, chúng ta thảo luận về việc áp dụng các quy tắc phân quyền cho tất cả các lớp của ứng dụng phản ứng. Đối với các ứng dụng không phản ứng, chúng ta đã sử dụng cơ chế bảo mật phương thức (method security), và trong Chương 11 và 12, bạn đã tìm hiểu các cách tiếp cận khác nhau để áp dụng quy tắc phân quyền ở cấp độ phương thức. Khả năng áp dụng quy tắc phân quyền ở các lớp khác ngoài lớp endpoint mang lại cho bạn sự linh hoạt cao và cho phép bạn áp dụng bảo mật cho cả các ứng dụng không phải ứng dụng web. Để tìm hiểu cách sử dụng bảo mật phương thức cho các ứng dụng phản ứng, chúng ta sẽ làm việc trên một ví dụ riêng biệt, tôi đặt tên dự án này là `ssia-ch17-ex5`.

Thay vì bảo mật phương thức toàn cục (global method security) như khi làm việc với các ứng dụng không phản ứng, chúng ta gọi cách tiếp cận này là bảo mật phương thức phản ứng (reactive method security), tại đây chúng ta áp dụng các quy tắc phân quyền trực tiếp ở cấp độ phương thức. Đối với ví dụ của mình, chúng ta sử dụng `@PreAuthorize` để xác thực rằng người dùng có một vai trò cụ thể để gọi một endpoint kiểm thử. Để giữ cho ví dụ đơn giản, chúng ta sử dụng annotation `@PreAuthorize` trực tiếp ngay trên phương thức định nghĩa endpoint. Tuy nhiên, bạn hoàn toàn có thể sử dụng nó theo cách tương tự như chúng ta đã thảo luận trong Chương 11 và 12 cho các ứng dụng không phản ứng: trên bất kỳ phương thức của thành phần nào khác trong ứng dụng phản ứng của bạn. Đoạn mã 17.10 hiển thị định nghĩa của class controller. Hãy chú ý rằng chúng ta sử dụng `@PreAuthorize`, tương tự như những gì bạn đã học ở Chương 11. Sử dụng các biểu thức SpEL20, chúng ta khai báo rằng chỉ có admin mới có thể gọi phương thức được đánh dấu bằng annotation này.

```java
// Đoạn mã 17.10 Định nghĩa class controller
@RestController
public class HelloController {
    @GetMapping("/hello")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<String> hello() {
        return Mono.just("Hello");
    }
}
```

Dưới đây bạn sẽ tìm thấy class cấu hình, trong đó chúng ta sử dụng annotation `@EnableReactiveMethodSecurity` để kích hoạt tính năng bảo mật phương thức phản ứng. Tương tự như cơ chế bảo mật phương thức thông thường, chúng ta cần sử dụng một cách rõ ràng một annotation để kích hoạt nó. Bên cạnh annotation này, trong class cấu hình, bạn cũng tìm thấy phần định nghĩa quản lý người dùng quen thuộc.

```java
// Đoạn mã 17.11 Class cấu hình
@Configuration
@EnableReactiveMethodSecurity
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
        return new MapReactiveUserDetailsService(u1, u2);
    }
}

        var uds = new MapReactiveUserDetailsService(u1, u2);
        return uds;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Giờ đây bạn có thể khởi động ứng dụng và kiểm thử hành vi của endpoint bằng cách gọi nó với từng người dùng. Bạn sẽ quan sát thấy rằng chỉ có John mới có thể gọi endpoint vì chúng ta đã định nghĩa anh ấy là admin. Bill chỉ là một người dùng thông thường, do đó nếu chúng ta cố gắng gọi endpoint và xác thực dưới danh nghĩa Bill, chúng ta sẽ nhận được một phản hồi với mã trạng thái HTTP 403 Forbidden. Gọi endpoint `/hello` xác thực với người dùng John sẽ trông như thế này:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Hello!
```

Gọi endpoint `/hello` xác thực với người dùng Bill sẽ trông như thế này:

```bash
curl -u bill:12345 http://localhost:8080/hello
```

Thân phản hồi nhận được là:

```
Access Denied
```

Đằng sau hậu trường, tính năng này hoạt động tương tự như đối với các ứng dụng không phản ứng. Trong Chương 11 và 12, bạn đã biết rằng một khía cạnh (aspect) sẽ chặn cuộc gọi đến phương thức và thực thi việc phân quyền. Nếu cuộc gọi không đáp ứng các quy tắc tiền kiểm tra (preauthorization) đã chỉ định, khía cạnh đó sẽ không chuyển tiếp cuộc gọi đến phương thức thực tế.

## 17.4 Tạo một reactive OAuth 2 resource server

Chắc hẳn lúc này bạn đang thắc mắc liệu chúng ta có thể sử dụng các ứng dụng phản ứng trong một hệ thống được thiết kế trên nền tảng OAuth 2 hay không. Trong mục này, chúng ta thảo luận về việc triển khai một resource server dưới dạng một ứng dụng phản ứng. Bạn sẽ học cách cấu hình ứng dụng phản ứng của mình để dựa vào một phương thức xác thực được triển khai trên nền tảng OAuth 2. Bởi vì việc sử dụng OAuth 2 hiện nay vô cùng phổ biến, bạn có thể gặp phải các yêu cầu mà ứng dụng resource server của bạn cần được thiết kế như một máy chủ phản ứng. Tôi đã tạo một dự án mới có tên `ssia-ch17-ex6`, và chúng ta sẽ triển khai một ứng dụng resource server phản ứng. Bạn cần thêm các dependency trong tệp `pom.xml`, như đoạn mã tiếp theo minh họa:

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

Chúng ta cần một endpoint để kiểm thử ứng dụng, vì vậy chúng ta thêm một class controller. Đoạn mã tiếp theo trình bày class controller này:

```java
@RestController
public class HelloController {
    @GetMapping("/hello")
    public Mono<String> hello() {
        return Mono.just("Hello!");
    }
}
```

Và bây giờ là phần quan trọng nhất của ví dụ: cấu hình bảo mật. Đối với ví dụ này, chúng ta cấu hình resource server để sử dụng public key do authorization server cung cấp nhằm xác thực chữ ký của token.

Để cấu hình phương thức xác thực, chúng ta sử dụng `SecurityWebFilterChain` như bạn đã tìm hiểu ở mục 17.3. Tuy nhiên, thay vì sử dụng phương thức `httpBasic()`, chúng ta gọi phương thức `oauth2ResourceServer()`. Sau đó, bằng cách gọi phương thức `jwt()`, chúng ta định nghĩa loại token mình sử dụng, và bằng cách sử dụng một đối tượng `Customizer`, chúng ta chỉ định cách thức xác thực chữ ký của token. Trong đoạn mã tiếp theo, bạn có thể tìm thấy định nghĩa của class cấu hình.

**Đoạn mã 17.12 Định nghĩa cấu hình chuỗi bộ lọc web bảo mật**

```java
@Configuration
public class ProjectConfig {

    @Value("${jwk.endpoint}")
    private String jwkEndpoint;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http.oauth2ResourceServer(c ->
            c.jwt(j ->
                j.jwkSetUri(jwkEndpoint)
            )
        );

        http.authorizeExchange(c ->
            c.anyExchange().authenticated()
        );

        return http.build();
    }
}
```

Theo cách tương tự, chúng ta cũng có thể cấu hình public key trực tiếp thay vì chỉ định một URI nơi public key được cung cấp. Thay đổi duy nhất là gọi phương thức `publicKey()` của instance `jwtSpec` và cung cấp một public key hợp lệ làm tham số. Bạn có thể sử dụng bất kỳ cách tiếp cận nào chúng ta đã thảo luận trong Chương 13, nơi chúng ta đã phân tích chi tiết các phương thức để resource server xác thực access token. Tiếp theo, chúng ta thay đổi tệp `application.properties` để thêm giá trị cho URI nơi tập hợp khóa (key set) được cung cấp, cũng như thay đổi cổng máy chủ thành 9090. Bằng cách này, chúng ta cho phép authorization server chạy trên cổng 8080. Trong đoạn mã tiếp theo, bạn sẽ tìm thấy nội dung của tệp `application.properties`:

```properties
server.port=9090
jwk.endpoint=http://localhost:8080/auth/realms/master/protocol/openid-connect/certs
```

Hãy chạy ứng dụng và chứng minh rằng nó hoạt động đúng như mong đợi. Chúng ta tạo một access token bằng cách sử dụng authorization server:

```bash
curl -XPOST 'http://localhost:8080/auth/realms/master/protocol/openid-connect/token' \ […]
-H 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'username=bill' \
--data-urlencode 'password=12345' \
--data-urlencode 'client_id=fitnessapp' \
--data-urlencode 'scope=fitnessapp'
```

Trong phần thân phản hồi HTTP, chúng ta nhận được access token như trình bày ở đây:

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

Sử dụng access token này, chúng ta gọi endpoint `/hello` của ứng dụng như sau:

```bash
curl -H 'Authorization: BearereyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJMSE9z […]
'http://localhost:9090/hello'
```

Thân phản hồi nhận được là:

```
Hello!
```

## Tóm tắt

- Các ứng dụng phản ứng sở hữu một phong cách khác biệt để xử lý dữ liệu và trao đổi thông điệp với các thành phần khác. Ứng dụng phản ứng có thể là một lựa chọn tốt hơn trong một số tình huống, chẳng hạn như khi chúng ta có thể chia nhỏ dữ liệu thành các phân đoạn riêng biệt, nhỏ hơn để xử lý và trao đổi. Giống như bất kỳ ứng dụng nào khác, bạn cũng cần bảo vệ các ứng dụng phản ứng bằng cách sử dụng các cấu hình bảo mật. Spring Security cung cấp một bộ công cụ tuyệt vời mà bạn có thể sử dụng để áp dụng các cấu hình bảo mật cho các ứng dụng phản ứng, cũng như cho các ứng dụng không phản ứng. Để triển khai quản lý người dùng trong ứng dụng phản ứng với Spring Security, chúng ta sử dụng giao kèo `ReactiveUserDetailsService`. Thành phần này có cùng mục đích với `UserDetailsService` trong các ứng dụng không phản ứng: nó chỉ dẫn cho ứng dụng cách thức lấy thông tin chi tiết của người dùng.

- Để triển khai các quy tắc phân quyền endpoint cho một ứng dụng web phản ứng, bạn cần tạo một instance kiểu `SecurityWebFilterChain` và thêm nó vào Spring context. Bạn tạo instance `SecurityWebFilterChain` bằng cách sử dụng builder `ServerHttpSecurity`.

- Nhìn chung, tên của các phương thức bạn sử dụng để định nghĩa cấu hình phân quyền là giống như các phương thức bạn sử dụng cho các ứng dụng không phản ứng. Tuy nhiên, bạn sẽ tìm thấy những khác biệt nhỏ trong cách đặt tên liên quan đến thuật ngữ phản ứng. Ví dụ, thay vì sử dụng `authorizeHttpRequests()`, tên của phương thức tương đương cho các ứng dụng phản ứng là `authorizeExchange()`.

- Spring Security cũng cung cấp một giải pháp để định nghĩa các quy tắc phân quyền ở cấp độ phương thức, được gọi là bảo mật phương thức phản ứng, và nó mang lại sự linh hoạt tuyệt vời trong việc áp dụng các quy tắc phân quyền ở bất kỳ lớp nào của một ứng dụng phản ứng. Cơ chế này tương tự như những gì chúng ta gọi là bảo mật phương thức toàn cục cho các ứng dụng không phản ứng.
