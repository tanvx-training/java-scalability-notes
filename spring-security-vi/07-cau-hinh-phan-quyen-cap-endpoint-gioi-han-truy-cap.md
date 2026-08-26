# Chương 7: Cấu hình phân quyền cấp endpoint: Giới hạn truy cập

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chương này bao gồm**

- Định nghĩa quyền hạn (authorities) và vai trò (roles)

- Áp dụng các quy tắc phân quyền trên các endpoint

Vài năm trước, khi đang trượt tuyết trên dãy núi Carpathian [8] thơ mộng, tôi đã chứng kiến một cảnh tượng khá hài hước. Khoảng 10 đến 15 người đang xếp hàng để vào cabin lên đỉnh dốc trượt tuyết. Bỗng một ca sĩ nhạc pop nổi tiếng xuất hiện, đi cùng hai vệ sĩ. Anh ta tự tin sải bước tiến lên phía trước, đinh ninh rằng mình sẽ được ưu tiên bỏ qua hàng dài chờ đợi nhờ danh tiếng của bản thân. Thế nhưng, ngay khi chạm đến đầu hàng, anh ta đã phải ngỡ ngàng. “Xin vui lòng cho kiểm tra vé!” người soát vé lên cabin lên tiếng, rồi ôn tồn giải thích: “Ồ, thưa anh, trước hết anh cần phải có vé, và thứ hai là ở đây không có lối đi ưu tiên, rất tiếc. Cuối hàng ở đằng kia ạ.” Người soát vé vừa nói vừa chỉ tay về phía cuối hàng. Trong cuộc sống, nhiều khi bạn là ai không quan trọng. Điều này hoàn toàn đúng đối với các ứng dụng phần mềm. Việc bạn là ai chẳng có ý nghĩa gì khi bạn cố gắng truy cập vào một chức năng hoặc dữ liệu cụ thể mà không có quyền!

Từ trước đến nay, chúng ta mới chỉ thảo luận về xác thực (authentication) – quy trình mà ứng dụng dùng để xác định danh tính của chủ thể gọi tài nguyên. Trong các ví dụ trước, chúng ta chưa hề triển khai bất kỳ quy tắc nào để quyết định xem có nên phê duyệt một yêu cầu hay không. Chúng ta mới chỉ quan tâm xem hệ thống có nhận biết được người dùng đó hay không mà thôi. Trong hầu hết các ứng dụng thực tế, không phải mọi người dùng được hệ thống nhận diện đều có thể truy cập vào bất kỳ tài nguyên nào. Trong chương này, chúng ta sẽ thảo luận về phân quyền (authorization). Phân quyền là quá trình hệ thống quyết định xem một máy khách (client) đã xác định danh tính có quyền truy cập vào tài nguyên được yêu cầu hay không. Trong Spring Security, sau khi ứng dụng hoàn tất luồng xác thực, nó sẽ ủy quyền yêu cầu cho một bộ lọc phân quyền (authorization filter). Bộ lọc này sẽ cho phép hoặc từ chối yêu cầu dựa trên các quy tắc phân quyền đã được cấu hình.

Để nắm vững tất cả các chi tiết thiết yếu về phân quyền, trong chương này, chúng ta sẽ:

- Hiểu rõ thế nào là một quyền hạn (authority) và áp dụng các quy tắc truy cập trên tất cả các endpoint dựa trên quyền hạn của người dùng.

- Học cách nhóm các quyền hạn vào các vai trò (roles) và cách áp dụng các quy tắc phân quyền dựa trên vai trò của người dùng.

Trong chương 8, chúng ta sẽ tiếp tục tìm hiểu cách lựa chọn các endpoint cụ thể để áp dụng các quy tắc phân quyền. Còn bây giờ, hãy cùng xem xét quyền hạn và vai trò, cũng như cách chúng giới hạn quyền truy cập vào ứng dụng của chúng ta như thế nào.

## 7.1 Giới hạn truy cập dựa trên quyền hạn và vai trò

Trong phần này, bạn sẽ tìm hiểu về các khái niệm phân quyền và vai trò. Bạn sử dụng chúng để bảo mật tất cả các endpoint trong ứng dụng của mình. Việc hiểu rõ các khái niệm này là bắt buộc trước khi áp dụng chúng vào các tình huống thực tế, nơi các người dùng khác nhau sở hữu những đặc quyền khác nhau. Dựa trên các đặc quyền này, họ chỉ có thể thực hiện một số hành động cụ thể. Ứng dụng cung cấp các đặc quyền này dưới dạng các quyền hạn (authorities) và vai trò (roles).

Trong chương 3, bạn đã triển khai interface `GrantedAuthority`. Khế ước (contract) này đã được giới thiệu khi chúng ta thảo luận về một thành phần thiết yếu khác: interface `UserDetails`. Khi đó chúng ta chưa làm việc với `GrantedAuthority` vì interface này chủ yếu liên quan đến quá trình phân quyền. Giờ đây, chúng ta có thể quay lại với `GrantedAuthority` để xem xét mục đích của nó. Sau khi thảo luận xong về khế ước này, bạn sẽ học cách sử dụng các quy tắc này cho từng trường hợp riêng lẻ hoặc cho các yêu cầu cụ thể. Đoạn mã 7.1 hiển thị định nghĩa của khế ước `GrantedAuthority`. Một quyền hạn đại diện cho một hành động mà người dùng có thể thực hiện đối với một tài nguyên hệ thống. Mỗi quyền hạn có một tên gọi, được trả về dưới dạng một chuỗi `String` thông qua phương thức `getAuthority()` của đối tượng. Chúng ta sử dụng tên của quyền hạn này khi định nghĩa quy tắc phân quyền tùy biến. Thông thường, một quy tắc phân quyền sẽ có dạng: “Jane được phép xóa các bản ghi sản phẩm,” hoặc “John được phép đọc các bản ghi tài liệu.” Trong các trường hợp này, xóa và đọc chính là các quyền hạn được cấp. Ứng dụng cho phép người dùng Jane và John thực hiện các hành động này, vốn thường có những tên gọi như `read` (đọc), `write` (ghi), hoặc `delete` (xóa).

```java
// Đoạn mã 7.1 Khế ước GrantedAuthority
public interface GrantedAuthority extends Serializable {
    String getAuthority();
}
```

`UserDetails`, khế ước mô tả thông tin người dùng trong Spring Security, sở hữu một tập hợp các thực thể `GrantedAuthority`. Bạn có thể cấp cho một người dùng một hoặc nhiều đặc quyền. Phương thức `getAuthorities()` sẽ trả về tập hợp các thực thể `GrantedAuthority` này. Trong đoạn mã 7.2, bạn có thể xem lại phương thức này trong khế ước `UserDetails`. Chúng ta triển khai phương thức này để nó trả về tất cả các quyền hạn được cấp cho người dùng. Sau khi quá trình xác thực hoàn tất, các quyền hạn này sẽ trở thành một phần thông tin chi tiết về người dùng đã đăng nhập, giúp ứng dụng căn cứ vào đó để cấp quyền truy cập.

```java
// Đoạn mã 7.2 Phương thức getAuthorities() từ khế ước UserDetails
public interface UserDetails extends Serializable {
    Collection<? extends GrantedAuthority> getAuthorities();
    // Phần mã nguồn được bỏ qua
}
```

### 7.1.1 Giới hạn truy cập cho tất cả các endpoint dựa trên quyền hạn của người dùng

Phần này thảo luận về cách giới hạn quyền truy cập vào các endpoint đối với những người dùng cụ thể. Trong các ví dụ trước đây, bất kỳ người dùng nào đã xác thực đều có thể gọi mọi endpoint của ứng dụng. Bây giờ, bạn sẽ học cách tùy biến quyền truy cập này. Trong các ứng dụng thực tế chạy trên môi trường production, bạn có thể gọi một số endpoint của ứng dụng ngay cả khi chưa xác thực, trong khi với các endpoint khác, bạn lại cần có những đặc quyền đặc biệt. Chúng ta sẽ viết một vài ví dụ để bạn tìm hiểu các cách thức khác nhau nhằm áp dụng các giới hạn này với Spring Security.

Bây giờ, khi đã nhớ lại các khế ước `UserDetails`, `GrantedAuthority` và mối quan hệ giữa chúng, đã đến lúc chúng ta viết một ứng dụng nhỏ để áp dụng quy tắc phân quyền. Qua ví dụ này, bạn sẽ học được một vài phương án thay thế để cấu hình quyền truy cập vào các endpoint dựa trên quyền hạn của người dùng. Chúng ta sẽ bắt đầu một dự án mới với tên gọi `ssia-ch7-ex1`. Tôi sẽ trình bày ba cách cấu hình quyền truy cập bằng các phương thức sau:

- `hasAuthority()`—Chỉ nhận vào duy nhất một quyền hạn làm tham số để ứng dụng thiết lập giới hạn. Chỉ những người dùng sở hữu quyền hạn đó mới có thể gọi endpoint.

- `hasAnyAuthority()`—Có thể nhận vào nhiều quyền hạn để ứng dụng thiết lập giới hạn. Bạn có thể hiểu phương thức này là "sở hữu bất kỳ quyền hạn nào trong số các quyền hạn được chỉ định". Người dùng chỉ cần có ít nhất một trong các quyền hạn được liệt kê là đã có thể thực hiện yêu cầu. Tôi khuyến khích sử dụng phương thức này hoặc phương thức `hasAuthority()` vì sự đơn giản của chúng, tùy thuộc vào số lượng đặc quyền bạn muốn gán. Chúng rất dễ đọc trong các tệp cấu hình và giúp mã nguồn của bạn trở nên sáng sủa hơn.

- `access()`—Mang lại khả năng cấu hình truy cập không giới hạn vì ứng dụng sẽ xây dựng các quy tắc phân quyền dựa trên một đối tượng tùy biến do bạn tự triển khai có tên là `AuthorizationManager`. Bạn có thể cung cấp bất kỳ triển khai nào cho khế ước `AuthorizationManager` tùy theo bài toán của mình. Spring Security cũng cung cấp sẵn một vài bộ triển khai. Bộ triển khai phổ biến nhất là `WebExpressionAuthorizationManager`, giúp bạn áp dụng các quy tắc phân quyền dựa trên Ngôn ngữ Biểu thức Spring (SpEL) [9]. Tuy nhiên, việc sử dụng phương thức `access()` có thể khiến các quy tắc phân quyền trở nên khó đọc và khó hiểu hơn. Vì lý do này, tôi chỉ khuyến nghị coi đây là giải pháp cuối cùng và chỉ sử dụng khi bạn không thể áp dụng các phương thức `hasAnyAuthority()` hay `hasAuthority()`.

Các dependency duy nhất cần thiết trong tệp `pom.xml` của bạn là `spring-boot-starter-web` và `spring-boot-starter-security`. Những dependency này là đã đủ để tiếp cận cả ba giải pháp được liệt kê ở trên. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch7-ex1`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Chúng ta cũng thêm một endpoint vào ứng dụng để kiểm tra cấu hình phân quyền:

```java
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }
}
```

Trong một lớp cấu hình, chúng ta khai báo một `InMemoryUserDetailsManager` đóng vai trò là `UserDetailsService` và thêm hai người dùng John và Jane vào hệ thống quản lý. Mỗi người dùng sẽ sở hữu một quyền hạn khác nhau. Bạn có thể xem cách thực hiện trong đoạn mã dưới đây.

```java
// Đoạn mã 7.3 Khai báo UserDetailsService và gán người dùng
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        var manager = new InMemoryUserDetailsManager();

        var user1 = User.withUsername("john")
            .password("12345")
            .authorities("READ")
            .build();

        var user2 = User.withUsername("jane")
            .password("12345")
            .authorities("WRITE")
            .build();

        manager.createUser(user1);
        manager.createUser(user2);
        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Công việc tiếp theo là thêm cấu hình phân quyền. Trong chương 2, khi thực hiện ví dụ đầu tiên, bạn đã thấy cách chúng ta cho phép mọi người đều có thể truy cập vào tất cả các endpoint. Để làm được điều đó, chúng ta đã tạo một bean `SecurityFilterChain` trong ngữ cảnh của ứng dụng, tương tự như những gì được trình bày trong đoạn mã tiếp theo.

```java
// Đoạn mã 7.4 Cho phép mọi người truy cập tất cả các endpoint mà không cần xác thực
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().permitAll());
        return http.build();
    }
}
```

Phương thức `authorizeHttpRequests()` cho phép chúng ta tiếp tục chỉ định các quy tắc phân quyền trên các endpoint. Phương thức `anyRequest()` chỉ ra rằng quy tắc này áp dụng cho mọi yêu cầu, bất kể URL hay phương thức HTTP được sử dụng là gì. Phương thức `permitAll()` cho phép truy cập vào tất cả các yêu cầu phù hợp, dù đã xác thực hay chưa.

Giả sử chúng ta muốn đảm bảo rằng chỉ những người dùng có quyền `WRITE` mới có thể truy cập vào tất cả các endpoint. Trong ví dụ này, điều đó đồng nghĩa với việc chỉ có Jane mới được phép. Chúng ta có thể đạt được mục tiêu này và giới hạn quyền truy cập dựa trên quyền hạn của người dùng. Hãy quan sát đoạn mã sau đây.

```java
// Đoạn mã 7.5 Giới hạn quyền truy cập chỉ cho người dùng có quyền WRITE
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().hasAuthority("WRITE"));
        return http.build();
    }
}
```

Bạn có thể thấy rằng phương thức `permitAll()` đã được thay thế bằng phương thức `hasAuthority()`. Bạn truyền tên của quyền hạn được phép truy cập vào làm tham số cho phương thức `hasAuthority()`. Trước tiên, ứng dụng cần xác thực yêu cầu, sau đó, dựa trên các quyền hạn của người dùng, ứng dụng sẽ quyết định xem có cho phép thực hiện cuộc gọi đó hay không.

Giờ đây, chúng ta có thể bắt đầu kiểm tra ứng dụng bằng cách gọi endpoint với tài khoản của từng người dùng trong hai người dùng trên. Khi chúng ta gọi endpoint bằng người dùng Jane, trạng thái phản hồi HTTP trả về là `200 OK`, và chúng ta nhìn thấy thân phản hồi là "Hello!". Khi gọi bằng người dùng John, trạng thái phản hồi HTTP là `403 Forbidden` (Bị cấm), và chúng ta nhận lại một thân phản hồi rỗng. Ví dụ, khi gọi endpoint này bằng người dùng Jane:

```bash
curl -u jane:12345 http://localhost:8080/hello
```

chúng ta nhận được phản hồi sau:

```
Hello!
```

Còn khi gọi endpoint này bằng người dùng John:

```bash
curl -u john:12345 http://localhost:8080/hello
```

chúng ta nhận được phản hồi sau:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/hello"
}
```

Tương tự, chúng ta có thể sử dụng phương thức `hasAnyAuthority()`. Phương thức này nhận tham số dưới dạng danh sách đối số biến đổi (varargs); nhờ vậy, nó có thể nhận nhiều tên quyền hạn cùng lúc. Ứng dụng sẽ cho phép yêu cầu nếu người dùng sở hữu ít nhất một trong số các quyền hạn được truyền vào làm tham số. Bạn có thể thay thế `hasAuthority()` trong đoạn mã trước bằng `hasAnyAuthority("WRITE")`, khi đó ứng dụng vẫn hoạt động theo cách hoàn toàn tương tự. Tuy nhiên, nếu bạn thay thế bằng `hasAnyAuthority("WRITE", "READ")`, thì các yêu cầu từ người dùng sở hữu một trong hai quyền hạn này đều sẽ được chấp nhận. Trong trường hợp của chúng ta, ứng dụng sẽ cho phép các yêu cầu từ cả John lẫn Jane. Đoạn mã dưới đây minh họa cách áp dụng phương thức `hasAnyAuthority()`.

```java
// Đoạn mã 7.6 Áp dụng phương thức hasAnyAuthority()
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().hasAnyAuthority("WRITE", "READ" […]
        return http.build();
    }
}
```

Giờ đây bạn đã có thể gọi endpoint thành công bằng bất kỳ tài khoản nào trong hai người dùng của chúng ta. Dưới đây là cuộc gọi của John:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi trả về là:

```
Hello!
```

Và cuộc gọi của Jane là:

```bash
curl -u jane:12345 http://localhost:8080/hello
```

Thân phản hồi trả về là:

```
Hello!
```

Để chỉ định quyền truy cập dựa trên quyền hạn của người dùng, cách thứ ba mà bạn thường gặp trong thực tế là sử dụng phương thức `access()`. Tuy nhiên, phương thức `access()` mang tính tổng quát hơn. Nó nhận vào một đối tượng triển khai `AuthorizationManager` làm tham số. Bạn có thể cung cấp bất kỳ bộ triển khai nào cho đối tượng này để áp dụng bất kỳ loại logic nào định nghĩa nên các quy tắc phân quyền. Phương thức này rất mạnh mẽ và không chỉ giới hạn ở việc kiểm tra quyền hạn. Thế nhưng, phương thức này cũng làm cho mã nguồn trở nên khó đọc và khó hiểu hơn. Vì lý do đó, tôi khuyên bạn nên coi nó là lựa chọn cuối cùng, và chỉ dùng khi không thể áp dụng các phương thức `hasAuthority()` hoặc `hasAnyAuthority()` đã được giới thiệu trước đó trong phần này.

Để giúp bạn dễ hiểu hơn về phương thức này, trước tiên tôi xin trình bày nó như một giải pháp thay thế cho việc chỉ định quyền hạn bằng các phương thức `hasAuthority()` và `hasAnyAuthority()`. Trong ví dụ này, bạn sẽ sử dụng một bộ triển khai `AuthorizationManager`, nơi bạn phải truyền vào một biểu thức SpEL làm tham số. Quy tắc phân quyền mà chúng ta định nghĩa sẽ trở nên khó đọc hơn, đó là lý do vì sao tôi không khuyến khích cách tiếp cận này đối với các quy tắc đơn giản. Dù vậy, phương thức `access()` lại có ưu điểm là cho phép bạn tự do tùy biến các quy tắc thông qua bộ triển khai `AuthorizationManager` mà bạn truyền vào làm tham số. Và điều này thực sự vô cùng mạnh mẽ! Với các biểu thức SpEL, về cơ bản bạn có thể định nghĩa bất kỳ điều kiện nào mình muốn.

> **LƯU Ý** Trong hầu hết các tình huống, các giới hạn yêu cầu hoàn toàn có thể được triển khai bằng các phương thức `hasAuthority()` và `hasAnyAuthority()`, và tôi khuyên bạn nên ưu tiên sử dụng chúng. Hãy chỉ sử dụng phương thức `access()` nếu hai tùy chọn kia không đáp ứng được và bạn muốn triển khai các quy tắc phân quyền mang tính tổng quát hơn.

Chúng ta bắt đầu bằng một ví dụ đơn giản để đáp ứng cùng một yêu cầu như các trường hợp trước. Nếu chỉ cần kiểm tra xem người dùng có các quyền hạn cụ thể hay không, biểu thức bạn cần sử dụng với phương thức `access()` có thể là một trong các biểu thức sau:

- `hasAuthority('WRITE')`—Quy định rằng người dùng cần có quyền `WRITE` để gọi endpoint.

- `hasAnyAuthority('READ', 'WRITE')`—Chỉ rõ rằng người dùng cần có một trong hai quyền `READ` hoặc `WRITE`. Với biểu thức này, bạn có thể liệt kê tất cả các quyền hạn mà bạn muốn cho phép truy cập.

Hãy lưu ý rằng các biểu thức này có tên trùng với các phương thức đã trình bày trước đó trong phần này. Đoạn mã dưới đây minh họa cách sử dụng phương thức `access()`.

```java
// Đoạn mã 7.7 Sử dụng phương thức access() để cấu hình quyền truy cập vào các endpoin […]
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest()
            .access(new WebExpressionAuthorizationManager("hasAuthority('WRITE')"))
        );
        return http.build();
    }
}
```

Ví dụ được trình bày trong đoạn mã 7.7 chứng minh rằng phương thức `access()` làm phức tạp hóa cú pháp như thế nào nếu bạn sử dụng nó cho các yêu cầu đơn giản. Trong trường hợp đó, bạn nên sử dụng trực tiếp phương thức `hasAuthority()` hoặc `hasAnyAuthority()`. Nhưng phương thức `access()` không phải là hoàn toàn vô dụng. Như đã nói ở trên, nó mang lại sự linh hoạt rất lớn. Bạn sẽ gặp những tình huống trong thực tế khi cần viết các biểu thức phức tạp hơn để ứng dụng dựa vào đó cấp quyền truy cập. Bạn sẽ không thể triển khai các kịch bản này nếu thiếu đi phương thức `access()`.

Trong đoạn mã 7.8, bạn sẽ thấy phương thức `access()` được áp dụng với một biểu thức mà nếu viết theo cách khác sẽ không hề dễ dàng. Cụ thể, cấu hình trong đoạn mã 7.8 định nghĩa hai người dùng John và Jane với các quyền hạn khác nhau. Người dùng John chỉ có quyền đọc (`read`), trong khi Jane có cả ba quyền đọc (`read`), ghi (`write`) và xóa (`delete`). Endpoint này sẽ chỉ cho phép những người dùng có quyền đọc truy cập, nhưng phải loại trừ những ai có thêm quyền xóa.

> **LƯU Ý** Trong các ứng dụng Spring, bạn sẽ bắt gặp nhiều phong cách và quy ước đặt tên quyền hạn khác nhau. Một số nhà phát triển sử dụng toàn bộ chữ in hoa, trong khi những người khác lại sử dụng toàn bộ chữ in thường. Theo quan điểm của tôi, tất cả những lựa chọn này đều ổn miễn là bạn giữ tính nhất quán trong suốt ứng dụng của mình. Trong cuốn sách này, tôi sử dụng các phong cách khác nhau trong các ví dụ để bạn có thể quan sát nhiều cách tiếp cận có thể gặp trong thực tế.

Đây tất nhiên là một ví dụ giả định, nhưng nó đủ đơn giản để dễ hiểu và đủ phức tạp để chứng minh tại sao phương thức `access()` lại mạnh mẽ hơn. Để triển khai yêu cầu này bằng phương thức `access()`, bạn có thể sử dụng một bộ triển khai `AuthorizationManager` nhận vào một biểu thức SpEL. Biểu thức SpEL này phải phản ánh chính xác yêu cầu đề ra. Ví dụ:

```
"hasAuthority('read') and !hasAuthority('delete')"
```

Đoạn mã tiếp theo minh họa cách áp dụng phương thức `access()` với một biểu thức phức tạp hơn. Bạn có thể tìm thấy ví dụ này trong dự án mang tên `ssia-ch7-ex2`.

```java
// Đoạn mã 7.8 Áp dụng phương thức access() với một biểu thức phức tạp hơn
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        var manager = new InMemoryUserDetailsManager();

        var user1 = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();

        var user2 = User.withUsername("jane")
            .password("12345")
            .authorities("read", "write", "delete")
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

        String expression = """
            hasAuthority('read') and
            !hasAuthority('delete')
            """;

        http.authorizeHttpRequests(c -> c.anyRequest()
            .access(new WebExpressionAuthorizationManager(expression))
        );

        return http.build();
    }
}
```

Bây giờ chúng ta hãy kiểm tra ứng dụng bằng cách gọi endpoint `/hello` cho người dùng John:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi trả về là:

```
Hello!
```

Và khi gọi endpoint với người dùng Jane:

```bash
curl -u jane:12345 http://localhost:8080/hello
```

thân phản hồi nhận được là:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/hello"
}
```

Người dùng John chỉ có quyền đọc (`read`) nên có thể gọi endpoint thành công. Tuy nhiên, Jane lại có cả quyền xóa (`delete`) nên không được phép gọi endpoint này. Trạng thái HTTP trả về cho cuộc gọi của Jane là `403 Forbidden`.

Thông qua các ví dụ này, bạn đã thấy cách thiết lập các ràng buộc liên quan đến quyền hạn mà người dùng bắt buộc phải có để truy cập vào một số endpoint được chỉ định. Tất nhiên, chúng ta vẫn chưa thảo luận về việc lựa chọn yêu cầu nào cần được bảo vệ dựa trên đường dẫn hoặc phương thức HTTP. Thay vào đó, chúng ta đã áp dụng các quy tắc cho mọi yêu cầu bất kể endpoint nào được ứng dụng công khai. Sau khi hoàn thành cấu hình tương tự cho vai trò người dùng (user roles), chúng ta sẽ thảo luận về cách lựa chọn các endpoint cụ thể để áp dụng cấu hình phân quyền.

### 7.1.2 Giới hạn truy cập cho tất cả các endpoint dựa trên vai trò của người dùng

Trong phần này, chúng ta sẽ thảo luận về việc giới hạn truy cập vào các endpoint dựa trên vai trò (roles). Vai trò là một cách khác để biểu thị những gì một người dùng được phép thực hiện. Bạn cũng sẽ gặp chúng trong các ứng dụng thực tế, đó là lý do tại sao việc hiểu rõ vai trò cũng như sự khác biệt giữa vai trò và quyền hạn lại quan trọng đến vậy. Trong phần này, chúng ta sẽ thực hành một vài ví dụ sử dụng vai trò để bạn nắm được tất cả các tình huống thực tế mà ứng dụng sử dụng vai trò và cách viết cấu hình cho các trường hợp đó. Spring Security hiểu quyền hạn (authorities) là các đặc quyền ở mức độ chi tiết (fine-grained) mà chúng ta dùng để áp dụng các giới hạn truy cập. Trong khi đó, vai trò (roles) giống như những chiếc "phù hiệu" định danh cho người dùng. Chúng cung cấp cho người dùng các đặc quyền đối với cả một nhóm hành động. Một số ứng dụng luôn cung cấp cùng một nhóm quyền hạn cho những người dùng cụ thể. Hãy tưởng tượng rằng trong ứng dụng của bạn, một người dùng chỉ có thể có quyền đọc hoặc có tất cả các quyền (đọc, ghi và xóa). Trong trường hợp này, sẽ tiện lợi hơn nếu chúng ta coi những người dùng chỉ có quyền đọc là mang vai trò `READER` (Người đọc), trong khi những người khác mang vai trò `ADMIN` (Quản trị viên). Việc sở hữu vai trò `ADMIN` đồng nghĩa với việc ứng dụng cấp cho bạn các đặc quyền đọc, ghi, cập nhật và xóa. Bạn hoàn toàn có thể có nhiều vai trò hơn nữa. Ví dụ, nếu tại một thời điểm nào đó, yêu cầu hệ thống phát sinh thêm một người dùng chỉ được phép đọc và ghi, bạn có thể tạo vai trò thứ ba với tên gọi `MANAGER` (Quản lý) cho ứng dụng của mình.

> **LƯU Ý** Khi sử dụng cách tiếp cận dựa trên vai trò trong ứng dụng, bạn sẽ không cần phải tự định nghĩa các quyền hạn nữa. Các quyền hạn khi đó vẫn tồn tại dưới dạng khái niệm và có thể xuất hiện trong các yêu cầu triển khai. Nhưng trong ứng dụng, bạn chỉ cần định nghĩa một vai trò để bao quát một hoặc nhiều hành động mà người dùng được phép thực hiện.

Tên gọi mà bạn đặt cho các vai trò—cũng giống như tên gọi của quyền hạn—hoàn toàn là do bạn tự quyết định. Chúng ta có thể nói rằng vai trò ở mức độ bao quát (coarse-grained) hơn khi so sánh với quyền hạn. Dù vậy, ở tầng bên dưới, các vai trò vẫn được biểu diễn thông qua cùng một khế ước trong Spring Security, đó là `GrantedAuthority`. Khi định nghĩa một vai trò, tên của nó bắt buộc phải bắt đầu bằng tiền tố `ROLE_`. Ở cấp độ triển khai, tiền tố này chính là dấu hiệu phân biệt giữa một vai trò và một quyền hạn. Bạn sẽ tìm thấy ví dụ chúng ta thực hành trong phần này tại dự án `ssia-ch7-ex3`. Trong đoạn mã tiếp theo, hãy cùng xem xét sự thay đổi mà tôi đã thực hiện đối với ví dụ trước.

```java
// Đoạn mã 7.9 Thiết lập vai trò cho người dùng
@Configuration
public class ProjectConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        var manager = new InMemoryUserDetailsManager();

        var user1 = User.withUsername("john")
            .password("12345")
            .authorities("ROLE_ADMIN")
            .build();

        var user2 = User.withUsername("jane")
            .password("12345")
            .authorities("ROLE_MANAGER")
            .build();

        manager.createUser(user1);
        manager.createUser(user2);
        return manager;
    }
    // Phần mã nguồn được bỏ qua
}
```

Để thiết lập các ràng buộc cho vai trò của người dùng, bạn có thể sử dụng một trong các phương thức sau:

- `hasRole()`—Nhận vào tham số là tên vai trò mà ứng dụng dùng để cho phép yêu cầu.

- `hasAnyRole()`—Nhận vào các tham số là tên các vai trò mà ứng dụng dùng để chấp thuận yêu cầu.

- `access()`—Sử dụng một `AuthorizationManager` để chỉ định vai trò hoặc các vai trò mà ứng dụng dùng để cho phép yêu cầu. Về mặt vai trò, bạn có thể sử dụng `hasRole()` hoặc `hasAnyRole()` dưới dạng các biểu thức SpEL kết hợp với bộ triển khai `WebExpressionAuthorizationManager`.

Như bạn có thể thấy, các tên gọi này tương tự như các phương thức đã trình bày ở phần 7.1.1. Chúng ta sử dụng chúng theo cùng một cách, nhưng để áp dụng cấu hình cho các vai trò thay vì quyền hạn. Khuyến nghị của tôi cũng tương tự: hãy ưu tiên sử dụng phương thức `hasRole()` hoặc `hasAnyRole()` làm lựa chọn hàng đầu, và chỉ quay lại sử dụng `access()` khi hai phương thức trên không đáp ứng được yêu cầu. Đoạn mã tiếp theo sẽ cho thấy phương thức `securityFilterChain()` trông như thế nào ở thời điểm hiện tại.

```java
// Đoạn mã 7.10 Cấu hình ứng dụng chỉ chấp nhận các yêu cầu từ quản trị viên (admin)
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().hasRole("ADMIN"));
        return http.build();
    }
}
```

> **LƯU Ý** Một chi tiết cực kỳ quan trọng cần lưu ý là chúng ta chỉ sử dụng tiền tố `ROLE_` khi khai báo vai trò. Còn khi sử dụng vai trò đó trong cấu hình phân quyền, chúng ta chỉ gọi bằng tên của vai trò (bỏ tiền tố `ROLE_`).

Khi kiểm tra ứng dụng, bạn sẽ thấy người dùng John có thể truy cập endpoint, trong khi Jane nhận về mã lỗi HTTP `403 Forbidden`. Để gọi endpoint với người dùng John, sử dụng:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi trả về là:

```
Hello!
```

Và để gọi endpoint với người dùng Jane, sử dụng:

```bash
curl -u jane:12345 http://localhost:8080/hello
```

Thân phản hồi trả về là:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/hello"
}
```

Khi tạo người dùng bằng lớp builder `User` giống như chúng ta đã làm trong ví dụ của phần này, bạn có thể chỉ định vai trò bằng cách sử dụng phương thức `roles()`. Phương thức này sẽ tự động tạo đối tượng `GrantedAuthority` và tự động thêm tiền tố `ROLE_` vào trước các tên vai trò mà bạn cung cấp.

> **LƯU Ý** Hãy đảm bảo tham số bạn truyền vào cho phương thức `roles()` không chứa tiền tố `ROLE_`. Nếu vô tình đưa tiền tố đó vào tham số của `roles()`, phương thức sẽ ném ra một ngoại lệ. Nói một cách ngắn gọn, khi sử dụng phương thức `authorities()`, hãy bao gồm cả tiền tố `ROLE_`. Còn khi sử dụng phương thức `roles()`, tuyệt đối không đưa tiền tố `ROLE_` vào.

Trong đoạn mã 7.11, bạn có thể thấy cách sử dụng chính xác phương thức `roles()` thay thế cho phương thức `authorities()` khi thiết kế cơ chế truy cập dựa trên vai trò. Bạn cũng có thể so sánh đoạn mã này với đoạn mã 7.9 để thấy rõ sự khác biệt giữa việc sử dụng quyền hạn và vai trò.

```java
// Đoạn mã 7.11 Thiết lập vai trò bằng phương thức roles()
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
    // Phần mã nguồn được bỏ qua
}
```

> **Tìm hiểu thêm về phương thức access()**
>
> Trong các phần 7.1.1 và 7.1.2, bạn đã học cách sử dụng phương thức `access()` để áp dụng các quy tắc phân quyền liên quan đến quyền hạn và vai trò. Nhìn chung, trong một ứng dụng, các giới hạn phân quyền thường xoay quanh quyền hạn và vai trò. Tuy nhiên, điều quan trọng cần nhớ là phương thức `access()` mang tính tổng quát, và nó hoàn toàn phụ thuộc vào bộ triển khai khế ước `AuthorizationManager` nào được bạn truyền vào làm tham số. Hơn thế nữa, trong ví dụ của chúng ta, chúng ta mới chỉ sử dụng bộ triển khai `WebExpressionAuthorizationManager` để áp dụng các giới hạn phân quyền dựa trên một biểu thức SpEL. Thông qua các ví dụ được trình bày, tôi tập trung hướng dẫn bạn cách áp dụng nó cho quyền hạn và vai trò, nhưng trong thực tế, `WebExpressionAuthorizationManager` có thể nhận vào bất kỳ biểu thức SpEL nào. Biểu thức đó không nhất thiết phải liên quan đến quyền hạn hay vai trò.
>
> Một ví dụ thực tế đơn giản là cấu hình quyền truy cập vào endpoint sao cho chỉ cho phép truy cập sau 12 giờ trưa. Để giải quyết yêu cầu này, bạn có thể sử dụng biểu thức SpEL sau:
>
> ```
> T(java.time.LocalTime).now().isAfter(T(java.time.LocalTime).of(12, 0))
> ```
>
> Để tìm hiểu thêm về các biểu thức SpEL, bạn có thể tham khảo tài liệu của Spring Framework tại: http://mng.bz/M9J7
>
> Chúng ta có thể khẳng định rằng với phương thức `access()`, về mặt lý thuyết bạn có thể triển khai bất kỳ quy tắc nào mình muốn. Khả năng là vô hạn. Chỉ cần đừng quên rằng trong quá trình phát triển ứng dụng, chúng ta luôn cố gắng giữ cho cú pháp đơn giản nhất có thể. Hãy chỉ làm phức tạp các cấu hình khi bạn không còn lựa chọn nào khác. Bạn sẽ tìm thấy ví dụ này được áp dụng trong dự án `ssia-ch7-ex4`.

### 7.1.3 Giới hạn quyền truy cập đối với tất cả các endpoint

Trong phần này, chúng ta bàn về việc giới hạn quyền truy cập đối với tất cả các yêu cầu. Bạn đã học ở phần 5.2 rằng bằng cách sử dụng phương thức `permitAll()`, bạn có thể cho phép truy cập đối với mọi yêu cầu. Bạn cũng đã biết cách áp dụng các quy tắc truy cập dựa trên quyền hạn và vai trò. Nhưng còn một điều nữa bạn có thể làm, đó là từ chối tất cả các yêu cầu. Phương thức `denyAll()` hoạt động hoàn toàn trái ngược với phương thức `permitAll()`. Trong đoạn mã tiếp theo, bạn có thể thấy cách sử dụng phương thức `denyAll()`.

```java
// Đoạn mã 7.12 Sử dụng phương thức denyAll() để giới hạn quyền truy cập vào các endpo […]
@Configuration
public class ProjectConfig {
    // Phần mã nguồn được bỏ qua

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().denyAll());
        return http.build();
    }
}
```

Vậy bạn có thể sử dụng một giới hạn nghiêm ngặt như vậy ở đâu? Bạn sẽ không thấy nó được sử dụng thường xuyên như các phương thức khác, nhưng vẫn có những trường hợp thực tế bắt buộc phải dùng đến. Hãy để tôi chỉ ra một vài trường hợp cụ thể để làm rõ điểm này.

Giả sử bạn có một endpoint nhận vào một địa chỉ email dưới dạng biến đường dẫn (path variable). Bạn chỉ muốn cho phép các yêu cầu có giá trị biến là địa chỉ email kết thúc bằng đuôi `.com`. Bạn không muốn ứng dụng chấp nhận bất kỳ định dạng email nào khác. (Bạn sẽ học cách áp dụng các giới hạn cho một nhóm yêu cầu dựa trên đường dẫn, phương thức HTTP và thậm chí cả các biến đường dẫn trong chương tiếp theo.) Đối với yêu cầu này, bạn sử dụng một biểu thức chính quy để gom nhóm các yêu cầu khớp với quy tắc của mình, rồi sau đó sử dụng phương thức `denyAll()` để chỉ thị cho ứng dụng từ chối tất cả các yêu cầu còn lại. Bạn cũng có thể hình dung một ứng dụng được thiết kế với nhiều cổng kết nối (gateways). Một vài dịch vụ đứng sau sẽ triển khai các ca sử dụng (use cases) của ứng dụng, vốn có thể truy cập được bằng cách gọi các endpoint tại các đường dẫn khác nhau. Nhưng để gọi một endpoint, máy khách phải gửi yêu cầu qua một dịch vụ trung gian mà chúng ta gọi là gateway. Trong kiến trúc này, có hai dịch vụ riêng biệt thuộc loại này: Gateway A và Gateway B. Máy khách sẽ gửi yêu cầu đến Gateway A nếu muốn truy cập đường dẫn `/products`. Nhưng đối với đường dẫn `/articles`, máy khách bắt buộc phải gửi yêu cầu đến Gateway B. Mỗi dịch vụ gateway này được thiết kế để từ chối tất cả các yêu cầu gửi đến các đường dẫn khác mà chúng không phục vụ. Kịch bản đơn giản hóa này có thể giúp bạn dễ dàng hình dung và hiểu rõ hơn về phương thức `denyAll()`. Trong một ứng dụng thực tế chạy trên production, bạn hoàn toàn có thể bắt gặp các trường hợp tương tự trong các kiến trúc phức tạp hơn.

Các ứng dụng trong môi trường thực tế luôn phải đối mặt với các yêu cầu kiến trúc đa dạng, đôi khi có vẻ khá kỳ lạ. Một framework bắt buộc phải cung cấp sự linh hoạt cần thiết cho mọi tình huống mà bạn có thể gặp phải. Vì lý do đó, phương thức `denyAll()` cũng quan trọng tương tự như tất cả các tùy chọn khác mà bạn đã học trong chương này.

## Tóm tắt Chương 7

- Phân quyền (authorization) là quá trình ứng dụng quyết định xem một yêu cầu đã được xác thực có được phép truy cập hay không. Quá trình phân quyền luôn diễn ra sau bước xác thực (authentication). Bạn có thể cấu hình cách ứng dụng phân quyền cho các yêu cầu dựa trên quyền hạn (authorities) và vai trò (roles) của người dùng đã được xác thực.

- Trong ứng dụng của mình, bạn cũng có thể chỉ định rằng một số yêu cầu nhất định được phép truy cập đối với cả những người dùng chưa xác thực.

- Bạn có thể cấu hình ứng dụng từ chối mọi yêu cầu bằng phương thức `denyAll()`, hoặc cho phép mọi yêu cầu bằng phương thức `permitAll()`.
