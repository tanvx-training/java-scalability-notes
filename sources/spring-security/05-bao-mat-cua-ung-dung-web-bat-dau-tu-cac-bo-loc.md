# Chương 5: Bảo mật của ứng dụng web bắt đầu từ các bộ lọc

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm các nội dung chính:**

- Làm việc với chuỗi bộ lọc (filter chain)

- Định nghĩa các bộ lọc tùy chỉnh (custom filters)

- Sử dụng các lớp của Spring Security có triển khai giao diện `Filter`

Trong Spring Security, các bộ lọc HTTP (HTTP filters) chịu trách nhiệm áp dụng các nhiệm vụ khác nhau lên một yêu cầu HTTP. Hơn nữa, chúng thường quản lý từng tác vụ bảo mật cần áp dụng cho yêu cầu đó. Do đó, các bộ lọc này liên kết lại tạo thành một chuỗi các trách nhiệm (chain of responsibilities). Một bộ lọc nhận yêu cầu, thực thi logic của nó, và cuối cùng chuyển giao yêu cầu đó cho bộ lọc tiếp theo trong chuỗi (Hình 5.1).

*Hình 5.1 Yêu cầu được chuyển đến chuỗi bộ lọc. Mỗi bộ lọc sẽ kích hoạt một trình quản lý để thực thi logic cụ thể trên yêu cầu đó, sau đó chuyển nó xuống cho bộ lọc tiếp theo trong chuỗi.*

Hãy lấy một hình ảnh so sánh thực tế làm ví dụ. Khi bạn đến sân bay, kể từ lúc bước vào nhà ga cho đến khi lên máy bay, bạn phải đi qua rất nhiều lớp kiểm tra (Hình 5.2). Đầu tiên bạn xuất trình vé, tiếp theo là kiểm tra hộ chiếu, và sau đó bạn đi qua cửa kiểm ninh. Tại cổng ra máy bay, nhiều bộ lọc khác có thể tiếp tục được áp dụng. Chẳng hạn, trong một số trường hợp, ngay trước khi lên máy bay, hộ chiếu và thị thực của bạn sẽ được kiểm tra lại một lần nữa. Đây là một hình ảnh tương đồng tuyệt vời cho chuỗi bộ lọc trong Spring Security. Bằng cách tương tự, bạn có thể tùy chỉnh các bộ lọc trong chuỗi bộ lọc với Spring Security. Spring Security cung cấp sẵn các triển khai bộ lọc để bạn tích hợp vào chuỗi thông qua việc cấu hình, nhưng bạn cũng hoàn toàn có thể tự định nghĩa các bộ lọc tùy chỉnh của riêng mình.

*Hình 5.2 Tại sân bay, bạn phải đi qua một loạt các trạm kiểm soát trước khi chính thức lên máy bay. Tương tự, Spring Security triển khai một chuỗi các bộ lọc để xử lý các yêu cầu HTTP mà ứng dụng nhận được.*

Chương này sẽ thảo luận về cách sử dụng Spring Security để tùy chỉnh các bộ lọc nằm trong kiến trúc xác thực (authentication) và phân quyền (authorization) của một ứng dụng web. Ví dụ, bạn có thể muốn tăng cường bảo mật bằng cách thêm một bước xác thực cho người dùng, chẳng hạn như kiểm tra địa chỉ email của họ hoặc sử dụng mật khẩu dùng một lần (OTP). Bạn cũng có thể thêm chức năng ghi nhật ký (auditing) các sự kiện xác thực. Bạn sẽ tìm thấy rất nhiều kịch bản thực tế cần sử dụng việc kiểm tra các sự kiện xác thực này, từ mục đích gỡ lỗi (debugging) cho đến việc phân tích hành vi của người dùng. Công nghệ và các thuật toán học máy ngày nay có thể cải thiện chất lượng ứng dụng, ví dụ bằng cách học hỏi hành vi của người dùng và phát hiện xem có ai đó đã xâm nhập tài khoản hoặc giả mạo người dùng hay không.

Biết cách tùy chỉnh chuỗi bộ lọc HTTP là một kỹ năng vô cùng giá trị. Trong thực tế, các ứng dụng luôn đi kèm với nhiều yêu cầu phức tạp mà các cấu hình mặc định không thể đáp ứng được. Bạn sẽ cần thêm mới hoặc thay thế các thành phần hiện có trong chuỗi. Với triển khai mặc định, bạn sử dụng phương thức xác thực HTTP Basic, cho phép xác thực dựa trên tên đăng nhập và mật khẩu. Tuy nhiên, trong các tình huống thực tế, có rất nhiều trường hợp bạn sẽ cần nhiều hơn thế. Có thể bạn cần triển khai một chiến lược xác thực khác, thông báo cho một hệ thống bên ngoài về một sự kiện phân quyền, hoặc ghi nhật ký xác thực thành công hay thất bại để sử dụng cho việc truy vết và kiểm toán sau này (Hình 5.3). Dù kịch bản của bạn là gì, Spring Security đều cung cấp cho bạn sự linh hoạt tối đa để thiết kế chuỗi bộ lọc chính xác theo nhu cầu.

*Hình 5.3 Bạn có tùy chọn cá nhân hóa chuỗi bộ lọc bằng cách chèn các bộ lọc mới vào trước, vào sau hoặc thay thế cho các bộ lọc hiện tại. Bằng cách này, bạn không chỉ tùy biến được quy trình xác thực mà còn can thiệp được vào toàn bộ quá trình xử lý yêu cầu và phản hồi.*

## 5.1 Triển khai các bộ lọc trong kiến trúc Spring Security

Phần này thảo luận về cách thức hoạt động của các bộ lọc và chuỗi bộ lọc trong kiến trúc Spring Security. Bạn cần có cái nhìn tổng quan này trước để hiểu rõ các ví dụ triển khai mà chúng ta sẽ thực hành trong các phần tiếp theo. Trong Chương 2 và Chương 3, chúng ta đã biết rằng bộ lọc xác thực sẽ chặn yêu cầu và chuyển giao trách nhiệm xác thực cho trình quản lý phân quyền. Nếu muốn thực thi một logic nào đó trước khi xác thực, chúng ta thực hiện bằng cách chèn một bộ lọc vào trước bộ lọc xác thực.

Các bộ lọc trong kiến trúc Spring Security là các bộ lọc HTTP tiêu chuẩn. Chúng ta có thể tạo ra các bộ lọc bằng cách triển khai giao diện `Filter` từ gói `jakarta.servlet`. Giống như bất kỳ bộ lọc HTTP nào khác, bạn cần ghi đè (override) phương thức `doFilter()` để triển khai logic của nó. Phương thức này nhận các tham số `ServletRequest`, `ServletResponse` và `FilterChain`:

- `ServletRequest` — Đại diện cho yêu cầu HTTP. Chúng ta sử dụng đối tượng `ServletRequest` để lấy các thông tin chi tiết về yêu cầu.

- `ServletResponse` — Đại diện cho phản hồi HTTP. Chúng ta sử dụng đối tượng `ServletResponse` để thay đổi phản hồi trước khi gửi trả lại cho khách hàng hoặc chuyển tiếp dọc theo chuỗi bộ lọc.

- `FilterChain` — Đại diện cho chuỗi các bộ lọc. Chúng ta sử dụng đối tượng `FilterChain` để chuyển tiếp yêu cầu đến bộ lọc tiếp theo trong chuỗi.

> **LƯU Ý**
>
> Bắt đầu từ Spring Boot 3, Jakarta EE đã chính thức thay thế đặc tả Java EE cũ. Do sự thay đổi này, bạn sẽ thấy một số gói chuyển tiền tố từ "javax" sang "jakarta". Ví dụ, các kiểu dữ liệu như `Filter`, `ServletRequest` và `ServletResponse` trước đây nằm trong gói `javax.servlet`, nhưng giờ đây bạn sẽ tìm thấy chúng trong gói `jakarta.servlet`.

Chuỗi bộ lọc đại diện cho một tập hợp các bộ lọc hoạt động theo một thứ tự được định nghĩa rõ ràng. Spring Security cung cấp sẵn cho chúng ta một số triển khai bộ lọc cùng thứ tự sắp xếp của chúng. Dưới đây là một số bộ lọc tiêu biểu được cung cấp sẵn:

- `BasicAuthenticationFilter` xử lý việc xác thực HTTP Basic, nếu có.

- `CsrfFilter` xử lý việc bảo vệ chống tấn công giả mạo yêu cầu chéo trang (CSRF), vấn đề chúng ta sẽ thảo luận ở Chương 9.

- `CorsFilter` xử lý các quy tắc phân quyền chia sẻ tài nguyên nguồn gốc chéo (CORS), nội dung sẽ được thảo luận ở Chương 10.

Bạn không cần phải nhớ hết tất cả các bộ lọc, vì có thể bạn sẽ không tương tác trực tiếp với chúng trong mã nguồn của mình, nhưng bạn cần hiểu cách chuỗi bộ lọc hoạt động và nhận biết một vài triển khai quan trọng. Trong cuốn sách này, tôi chỉ giải thích các bộ lọc thực sự thiết yếu đối với các chủ đề khác nhau mà chúng ta thảo luận.

Một điều quan trọng cần hiểu là một ứng dụng không nhất thiết phải có tất cả các bộ lọc này trong chuỗi. Chuỗi có thể dài hay ngắn tùy thuộc vào cách bạn cấu hình ứng dụng. Ví dụ, trong Chương 2 và Chương 3, bạn đã biết rằng bạn cần gọi phương thức `httpBasic()` của lớp `HttpSecurity` nếu muốn sử dụng phương thức xác thực HTTP Basic. Điều thực sự xảy ra là nếu bạn gọi phương thức `httpBasic()`, một thực thể của `BasicAuthenticationFilter` sẽ được thêm vào chuỗi. Tương tự, tùy thuộc vào các cấu hình bạn viết, định nghĩa của chuỗi bộ lọc sẽ bị ảnh hưởng tương ứng.

Bạn thêm một bộ lọc mới vào chuỗi dựa trên vị trí tương đối của một bộ lọc khác (Hình 5.4). Hoặc bạn có thể thêm một bộ lọc vào trước, vào sau, hoặc ngay tại vị trí của một bộ lọc đã biết. Mỗi vị trí thực chất là một chỉ số (index - một con số), và bạn cũng có thể nghe thấy nó được gọi là "thứ tự" (order).

*Hình 5.4 Mỗi bộ lọc có một số thứ tự, quyết định trình tự áp dụng các bộ lọc lên một yêu cầu. Bạn có thể thêm các bộ lọc tùy chỉnh bên cạnh các bộ lọc do Spring Security cung cấp.*

Nếu muốn tìm hiểu thêm về các bộ lọc mà Spring Security cung cấp cũng như thứ tự cấu hình của chúng, bạn có thể xem qua lớp enum `SecurityWebFiltersOrder` tại địa chỉ http://mng.bz/yZEG.

Bạn có thể thêm hai hoặc nhiều bộ lọc vào cùng một vị trí (Hình 5.5). Trong phần 5.4, chúng ta sẽ bắt gặp một trường hợp rất phổ biến mà điều này xảy ra, một tình huống thường gây bối rối cho các lập trình viên.

> **LƯU Ý**
>
> Nếu nhiều bộ lọc có cùng một vị trí, thứ tự gọi của chúng sẽ không được định nghĩa rõ ràng trước.

*Hình 5.5 Bạn có thể có nhiều bộ lọc với cùng một giá trị thứ tự trong chuỗi. Trong trường hợp này, Spring Security không đảm bảo thứ tự mà chúng được gọi.*

## 5.2 Thêm một bộ lọc vào trước một bộ lọc hiện có trong chuỗi

Phần này thảo luận về việc áp dụng các bộ lọc HTTP tùy chỉnh vào trước một bộ lọc hiện có trong chuỗi bộ lọc. Bạn có thể gặp những tình huống thực tế mà kỹ thuật này vô cùng hữu ích. Để giải quyết vấn đề này một cách trực quan, chúng ta sẽ thực hành trên một dự án mẫu, qua đó bạn sẽ học được cách dễ dàng triển khai một bộ lọc tùy chỉnh và đưa nó vào trước một bộ lọc sẵn có trong chuỗi bộ lọc. Sau đó, bạn có thể áp dụng ví dụ này cho bất kỳ yêu cầu tương tự nào trong các ứng dụng thực tế.

Đối với triển khai bộ lọc tùy chỉnh đầu tiên, hãy xem xét một kịch bản đơn giản. Chúng ta muốn đảm bảo rằng mọi yêu cầu gửi lên đều phải chứa một tiêu đề (header) có tên là `Request-Id` (xem dự án `ssia-ch5-ex1`). Chúng ta giả định rằng ứng dụng sử dụng tiêu đề này để theo vết các yêu cầu và đây là tiêu đề bắt buộc. Đồng thời, chúng ta muốn xác thực giả định này trước khi ứng dụng thực hiện quy trình xác thực người dùng. Quá trình xác thực có thể liên quan đến việc truy vấn cơ sở dữ liệu hoặc các hành động tốn tài nguyên khác mà chúng ta không muốn ứng dụng thực thi nếu định dạng yêu cầu không hợp lệ. Làm thế nào để thực hiện việc này? Để giải quyết yêu cầu hiện tại, chúng ta chỉ cần thực hiện hai bước, và cuối cùng chuỗi bộ lọc sẽ trông giống như Hình 5.6:

1. Triển khai bộ lọc. Tạo một lớp `RequestValidationFilter` để kiểm tra xem tiêu đề cần thiết có tồn tại trong yêu cầu hay không.

2. Thêm bộ lọc vào chuỗi bộ lọc. Thực hiện việc này trong lớp cấu hình, sử dụng bean `SecurityFilterChain`.

*Hình 5.6 Trong ví dụ này, chúng ta thêm một RequestValidationFilter hoạt động trước bộ lọc xác thực. RequestValidationFilter đảm bảo rằng quá trình xác thực sẽ không diễn ra nếu việc kiểm tra yêu cầu bị thất bại. Trong trường hợp của chúng ta, yêu cầu bắt buộc phải có một tiêu đề tên là Request-Id.*

Để hoàn thành bước 1 — triển khai bộ lọc — chúng ta định nghĩa một bộ lọc tùy chỉnh. Đoạn mã dưới đây trình bày cấu trúc triển khai.

**Đoạn mã 5.1 Triển khai một bộ lọc tùy chỉnh**

```java
public class RequestValidationFilter implements Filter {

 @Override
 public void doFilter(
 ServletRequest servletRequest,
 ServletResponse servletResponse,
 FilterChain filterChain)
 throws IOException, ServletException {
 // ...
 }
}
```

Bên trong phương thức `doFilter()`, chúng ta viết logic xử lý của bộ lọc. Trong ví dụ này, chúng ta kiểm tra xem tiêu đề `Request-Id` có tồn tại hay không. Nếu có, chúng ta chuyển tiếp yêu cầu đến bộ lọc tiếp theo trong chuỗi bằng cách gọi phương thức `doFilter()`. Nếu tiêu đề không tồn tại, chúng ta thiết lập mã trạng thái HTTP 400 Bad Request cho phản hồi mà không chuyển tiếp yêu cầu đến bộ lọc tiếp theo trong chuỗi bộ lọc nữa (Hình 5.7). Đoạn mã 5.2 trình bày logic xử lý này.

*Hình 5.7 Bộ lọc tùy chỉnh chúng ta thêm vào trước bước xác thực sẽ kiểm tra xem tiêu đề Request-Id có tồn tại hay không. Nếu tiêu đề tồn tại trong yêu cầu, ứng dụng sẽ chuyển tiếp yêu cầu để xác thực. Nếu tiêu đề không tồn tại, ứng dụng sẽ thiết lập trạng thái HTTP 400 Bad Request và trả về ngay cho khách hàng.*

**Đoạn mã 5.2 Triển khai logic trong phương thức doFilter()**

```java
@Override
public void doFilter(
 ServletRequest request,
 ServletResponse response,
 FilterChain filterChain)
 throws IOException, ServletException {

 var httpRequest = (HttpServletRequest) request;
 var httpResponse = (HttpServletResponse) response;
 String requestId = httpRequest.getHeader("Request-Id");
 if (requestId == null || requestId.isBlank()) {
 httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
 return;
 }

 filterChain.doFilter(request, response);
}
```

Để thực hiện bước 2, đưa bộ lọc vào hoạt động trong lớp cấu hình, chúng ta sử dụng phương thức `addFilterBefore()` của đối tượng `HttpSecurity` vì chúng ta muốn ứng dụng thực thi bộ lọc tùy chỉnh này trước khi xác thực. Phương thức này nhận vào hai tham số:

- Một thực thể của bộ lọc tùy chỉnh mà chúng ta muốn thêm vào chuỗi — Trong ví dụ của chúng ta, đây là một thực thể của lớp `RequestValidationFilter` đã trình bày trong Đoạn mã 5.1.

- Kiểu của bộ lọc mà trước nó chúng ta muốn chèn thực thể mới — Trong ví dụ này, vì yêu cầu là thực thi logic bộ lọc trước khi xác thực, chúng ta cần thêm thực thể bộ lọc tùy chỉnh của mình vào trước bộ lọc xác thực. Lớp `BasicAuthenticationFilter` định nghĩa kiểu mặc định của bộ lọc xác thực này.

Cho đến nay, chúng ta vẫn gọi bộ lọc xử lý việc xác thực nói chung là bộ lọc xác thực. Bạn sẽ thấy trong các chương tiếp theo rằng Spring Security còn cấu hình các bộ lọc khác nữa. Ở Chương 9, chúng ta sẽ thảo luận về tính năng bảo vệ chống giả mạo yêu cầu chéo trang (CSRF), và ở Chương 10, chúng ta sẽ thảo luận về chia sẻ tài nguyên nguồn gốc chéo (CORS). Cả hai tính năng này cũng hoạt động dựa trên các bộ lọc. Đoạn mã tiếp theo chỉ ra cách thêm bộ lọc tùy chỉnh vào trước bộ lọc xác thực trong lớp cấu hình. Để đơn giản hóa ví dụ, chúng ta sử dụng phương thức `permitAll()` để cho phép tất cả các yêu cầu chưa được xác thực đi qua.

**Đoạn mã 5.3 Cấu hình bộ lọc tùy chỉnh trước khi xác thực**

```java
@Configuration
public class ProjectConfig {

 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.addFilterBefore(
 new RequestValidationFilter(), BasicAuthenticationFilter.class)
 .authorizeRequests(c -> c.anyRequest().permitAll());

 return http.build();
 }
}
```

Chúng ta cũng cần một lớp controller và một endpoint để kiểm thử tính năng này. Đoạn mã dưới đây định nghĩa lớp controller.

**Đoạn mã 5.4 Lớp controller**

```java
@RestController
public class HelloController {

 @GetMapping("/hello")
 public String hello() {
 return "Hello!";
 }
}
```

Bây giờ bạn có thể khởi chạy và kiểm thử ứng dụng. Việc gọi đến endpoint mà không truyền tiêu đề sẽ tạo ra phản hồi với mã trạng thái HTTP 400 Bad Request. Nếu bạn thêm tiêu đề vào yêu cầu, mã trạng thái phản hồi sẽ trở thành HTTP 200 OK, và bạn cũng sẽ nhìn thấy nội dung phản hồi là `Hello!`. Để gọi endpoint mà không có tiêu đề `Request-Id`, chúng ta sử dụng lệnh cURL sau:

```bash
curl -v http://localhost:8080/hello
```

Lệnh gọi này tạo ra phản hồi (đã được lược bớt) như sau:

```text
...
< HTTP/1.1 400
...
```

Để gọi endpoint và cung cấp tiêu đề `Request-Id`, chúng ta sử dụng lệnh cURL sau:

```bash
curl -H "Request-Id:12345" http://localhost:8080/hello
```

Lệnh gọi này trả về phần thân phản hồi như sau:

```text
Hello!
```

## 5.3 Thêm một bộ lọc vào sau một bộ lọc hiện có trong chuỗi

Phần này minh họa cách thêm một bộ lọc vào sau một bộ lọc sẵn có trong chuỗi bộ lọc. Cách tiếp cận này được sử dụng khi bạn muốn thực thi một logic nào đó sau khi một tác vụ nào đó đã hoàn thành trong chuỗi bộ lọc. Giả sử bạn phải thực thi một số logic sau khi quá trình xác thực hoàn tất. Các ví dụ thực tế cho việc này có thể là thông báo cho một hệ thống khác sau khi xảy ra các sự kiện xác thực nhất định hoặc chỉ đơn giản là phục vụ cho mục đích ghi nhật ký và truy vết (Hình 5.8). Tương tự như trong phần 5.1, chúng ta sẽ triển khai một ví dụ để chỉ ra cách thực hiện việc này. Bạn có thể tùy biến nó theo nhu cầu thực tế của mình. Trong ví dụ này, chúng ta sẽ ghi nhật ký tất cả các sự kiện xác thực thành công bằng cách thêm một bộ lọc vào sau bộ lọc xác thực (Hình 5.8). Chúng ta coi những gì vượt qua được bộ lọc xác thực đại diện cho một sự kiện xác thực thành công và chúng ta muốn ghi lại sự kiện đó. Tiếp tục ví dụ từ phần 5.1, chúng ta cũng ghi lại ID yêu cầu nhận được qua tiêu đề HTTP.

*Hình 5.8 Chúng ta thêm AuthenticationLoggingFilter vào sau BasicAuthenticationFilter để ghi nhật ký các yêu cầu mà ứng dụng đã xác thực thành công.*

Đoạn mã dưới đây trình bày định nghĩa của bộ lọc thực hiện việc ghi nhật ký các yêu cầu vượt qua bộ lọc xác thực.

**Đoạn mã 5.5 Định nghĩa bộ lọc để ghi nhật ký yêu cầu**

```java
public class AuthenticationLoggingFilter implements Filter {

 private final Logger logger =
 Logger.getLogger(
 AuthenticationLoggingFilter.class.getName());

 @Override
 public void doFilter(
 ServletRequest request,
 ServletResponse response,
 FilterChain filterChain)
 throws IOException, ServletException {

 var httpRequest = (HttpServletRequest) request;
 var requestId = httpRequest.getHeader("Request-Id");

 logger.info("Successfully authenticated request with id " + requestId);

 filterChain.doFilter(request, response);
 }
}
```

Để thêm bộ lọc tùy chỉnh vào chuỗi sau bộ lọc xác thực, bạn gọi phương thức `addFilterAfter()` của `HttpSecurity`. Đoạn mã tiếp theo trình bày cấu trúc triển khai.

**Đoạn mã 5.6 Thêm bộ lọc tùy chỉnh vào sau một bộ lọc hiện có trong chuỗi**

```java
@Configuration
public class ProjectConfig {

 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.addFilterBefore(
 new RequestValidationFilter(),
 BasicAuthenticationFilter.class)
 .addFilterAfter(
 new AuthenticationLoggingFilter(),
 BasicAuthenticationFilter.class)
 .authorizeRequests(c -> c.anyRequest().permitAll());

 return http.build();
 }
}
```

Sau khi chạy ứng dụng và gọi endpoint, chúng ta quan sát thấy rằng với mỗi lần gọi endpoint thành công, ứng dụng sẽ in ra một dòng nhật ký trong bảng điều khiển (console). Đối với lệnh gọi:

```bash
curl -H "Request-Id:12345" http://localhost:8080/hello
```

thân phản hồi nhận được là:

```text
Hello!
```

Trong bảng điều khiển, bạn có thể nhìn thấy một dòng tương tự như:

```text
INFO 5876 --- [nio-8080-exec-2] [CA]c.l.s.f.AuthenticationLoggingFilter: [CA]Successfu […]
```

## 5.4 Thêm một bộ lọc tại vị trí của một bộ lọc khác trong chuỗi

Phần này thảo luận về việc thêm một bộ lọc ngay tại vị trí của một bộ lọc khác trong chuỗi bộ lọc. Cách tiếp cận này đặc biệt hữu ích khi bạn muốn cung cấp một triển khai khác cho một trách nhiệm vốn đã được đảm nhận bởi một trong các bộ lọc mà Spring Security hỗ trợ. Một kịch bản điển hình cho việc này chính là quy trình xác thực.

Hãy giả định rằng thay vì luồng xác thực HTTP Basic mặc định, bạn muốn triển khai một cơ chế khác. Thay vì sử dụng tên đăng nhập và mật khẩu làm thông tin đăng nhập đầu vào để ứng dụng xác thực người dùng, bạn cần áp dụng một hướng tiếp cận khác. Một vài kịch bản thực tế mà bạn có thể bắt gặp là:

- Nhận diện dựa trên một giá trị tiêu đề tĩnh để xác thực.

- Sử dụng một khóa đối xứng để ký vào yêu cầu xác thực.

- Sử dụng mật khẩu dùng một lần (OTP) trong quá trình xác thực.

Trong kịch bản đầu tiên của chúng ta (nhận diện dựa trên một khóa tĩnh để xác thực), máy khách gửi một chuỗi ký tự cố định đến ứng dụng trong tiêu đề của yêu cầu HTTP. Ứng dụng lưu trữ các giá trị này ở một nơi nào đó, thông thường là trong cơ sở dữ liệu hoặc một kho lưu trữ bí mật (secrets vault). Dựa trên giá trị tĩnh này, ứng dụng sẽ định danh máy khách.

Cách tiếp cận này (Hình 5.9) mang lại mức độ bảo mật khá yếu liên quan đến xác thực, nhưng các kiến trúc sư và lập trình viên thường chọn nó trong các cuộc gọi giữa các ứng dụng backend nội bộ vì sự đơn giản của nó. Triển khai này cũng thực thi rất nhanh vì nó không cần thực hiện các phép tính phức tạp, chẳng hạn như khi áp dụng chữ ký mã hóa. Bằng cách này, các khóa tĩnh dùng để xác thực đại diện cho một sự thỏa hiệp khi các lập trình viên tin tưởng hơn vào mức độ an toàn của hạ tầng mạng, đồng thời không để các endpoint hoàn toàn không được bảo vệ.

*Hình 5.9 Yêu cầu chứa một tiêu đề mang giá trị của khóa tĩnh. Nếu giá trị này khớp với giá trị mà ứng dụng đã biết, ứng dụng sẽ chấp nhận yêu cầu.*

Trong kịch bản thứ hai, sử dụng các khóa đối xứng để ký và xác thực yêu cầu, cả máy khách và máy chủ đều biết giá trị của một khóa (khóa dùng chung). Máy khách sử dụng khóa này để ký một phần của yêu cầu (ví dụ, ký vào giá trị của các tiêu đề cụ thể), và máy chủ sẽ kiểm tra xem chữ ký đó có hợp lệ hay không bằng cách sử dụng chính khóa đó (Hình 5.10). Máy chủ có thể lưu trữ các khóa riêng biệt cho từng máy khách trong cơ sở dữ liệu hoặc kho lưu trữ bí mật. Tương tự, bạn cũng có thể sử dụng một cặp khóa bất đối xứng.

*Hình 5.10 Tiêu đề Authorization chứa một giá trị được mã hóa bằng khóa dùng chung giữa máy khách và máy chủ (hoặc được mã hóa bằng khóa bí mật mà máy chủ sở hữu khóa công khai tương ứng). Nếu ứng dụng xác minh chữ ký hợp lệ, ứng dụng sẽ cho phép yêu cầu tiếp tục xử lý.*

Cuối cùng, đối với kịch bản thứ ba, sử dụng mã OTP trong quá trình xác thực, người dùng nhận được mã OTP qua tin nhắn hoặc bằng cách sử dụng một ứng dụng cung cấp mã xác thực như Google Authenticator (Hình 5.11).

*Hình 5.11 Để truy cập tài nguyên, máy khách phải sử dụng mật khẩu dùng một lần (OTP). Mã OTP này được lấy từ một máy chủ xác thực bên ngoài. Thông thường, các ứng dụng áp dụng phương pháp này cho các quy trình đăng nhập yêu cầu xác thực nhiều yếu tố (MFA).*

Hãy cùng triển khai một ví dụ để minh họa cách áp dụng một bộ lọc tùy chỉnh. Để giữ cho ví dụ vừa mang tính thực tế vừa đơn giản, chúng ta sẽ tập trung vào cấu hình và giả định một logic xác thực cơ bản. Trong kịch bản này, chúng ta có một giá trị khóa tĩnh giống nhau cho mọi yêu cầu. Để được xác thực, người dùng phải đưa đúng giá trị của khóa tĩnh này vào tiêu đề `Authorization`, như trình bày trong Hình 5.12. Bạn có thể tìm thấy mã nguồn của ví dụ này trong dự án `ssia-ch5-ex2`.

*Hình 5.12 Máy khách thêm một khóa tĩnh vào tiêu đề Authorization của yêu cầu HTTP. Máy chủ kiểm tra xem nó có biết khóa này hay không trước khi cho phép yêu cầu đi qua.*

Chúng ta bắt đầu bằng việc triển khai lớp bộ lọc có tên là `StaticKeyAuthenticationFilter`. Lớp này đọc giá trị của khóa tĩnh từ tệp cấu hình và xác minh xem giá trị của tiêu đề `Authorization` có trùng khớp với nó hay không. Nếu trùng khớp, bộ lọc sẽ chuyển tiếp yêu cầu đến thành phần tiếp theo trong chuỗi bộ lọc. Nếu không, bộ lọc sẽ thiết lập mã trạng thái 401 Unauthorized cho phản hồi mà không chuyển tiếp yêu cầu đi tiếp trong chuỗi nữa. Đoạn mã dưới đây định nghĩa lớp `StaticKeyAuthenticationFilter`.

**Đoạn mã 5.7 Định nghĩa lớp StaticKeyAuthenticationFilter**

```java
@Component
public class StaticKeyAuthenticationFilter implements Filter {

    @Value("${authorization.key}")
    private String authorizationKey;

    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain filterChain)
                         throws IOException, ServletException {

        var httpRequest = (HttpServletRequest) request;
        var httpResponse = (HttpServletResponse) response;

        String authentication = httpRequest.getHeader("Authorization");

        if (authorizationKey.equals(authentication)) {
            filterChain.doFilter(request, response);
        } else {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }
    }
}
```

Khi bộ lọc đã được định nghĩa, chúng ta đưa nó vào chuỗi bộ lọc tại vị trí của lớp `BasicAuthenticationFilter` bằng cách sử dụng phương thức `addFilterAt()`.

Chúng ta thêm bộ lọc xác thực tùy chỉnh của mình vào đúng vị trí mà lớp `BasicAuthenticationFilter` đáng lẽ sẽ đứng nếu chúng ta sử dụng HTTP Basic làm phương thức xác thực. Điều này có nghĩa là bộ lọc tùy chỉnh của chúng ta sẽ có cùng giá trị thứ tự sắp xếp.

Nhưng hãy nhớ những gì chúng ta đã thảo luận ở phần 5.1. Khi thêm một bộ lọc vào một vị trí cụ thể, Spring Security không hề coi nó là bộ lọc duy nhất ở vị trí đó. Bạn có thể thêm nhiều bộ lọc vào cùng một vị trí trong chuỗi. Trong trường hợp này, Spring Security không đảm bảo thứ tự mà các bộ lọc này sẽ hoạt động. Tôi phải lặp lại điều này vì tôi đã chứng kiến rất nhiều người bị bối rối về cách thức hoạt động của nó. Một số lập trình viên nghĩ rằng khi bạn áp dụng một bộ lọc vào vị trí của một bộ lọc đã biết, bộ lọc cũ sẽ bị thay thế hoàn toàn. Thực tế không phải như vậy! Chúng ta phải chắc chắn rằng mình không thêm vào những bộ lọc không cần thiết.

> **LƯU Ý** Tôi khuyên bạn không nên thêm nhiều bộ lọc vào cùng một vị trí trong chuỗi. Khi bạn chèn nhiều bộ lọc vào cùng một vị trí, thứ tự thực thi của chúng sẽ không được định nghĩa rõ ràng trước. Việc có một thứ tự gọi bộ lọc rõ ràng, xác định sẽ giúp ứng dụng của bạn dễ hiểu và dễ bảo trì hơn rất nhiều.

Trong Đoạn mã 5.8, bạn sẽ tìm thấy định nghĩa của lớp cấu hình thực hiện việc thêm bộ lọc. Hãy chú ý rằng chúng ta không gọi phương thức `httpBasic()` từ lớp `HttpSecurity` ở đây vì chúng ta không muốn thực thể `BasicAuthenticationFilter` được tự động thêm vào chuỗi bộ lọc.

**Đoạn mã 5.8 Thêm bộ lọc trong lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    private final StaticKeyAuthenticationFilter filter;

    // phương thức khởi tạo được lược bỏ

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {

        http.addFilterAt(filter, BasicAuthenticationFilter.class)
            .authorizeRequests(c -> c.anyRequest().permitAll());

        return http.build();
    }
}
```

Để kiểm thử ứng dụng, chúng ta cũng cần một endpoint. Với mục đích đó, chúng ta định nghĩa một controller tương tự như trong Đoạn mã 5.4. Bạn nên cấu hình một giá trị cho khóa tĩnh trên máy chủ trong tệp `application.properties`, như sau:

```properties
authorization.key=SD9cICjl1e
```

> **LƯU Ý** Việc lưu trữ mật khẩu, khóa hoặc bất kỳ dữ liệu nhạy cảm nào không muốn người khác nhìn thấy trực tiếp trong tệp cấu hình properties không bao giờ là một ý tưởng hay đối với một ứng dụng thực tế. Trong các ví dụ của mình, chúng ta sử dụng cách tiếp cận này nhằm tối giản hóa vấn đề và giúp bạn tập trung vào các cấu hình Spring Security. Nhưng trong các kịch bản thực tế, hãy đảm bảo rằng bạn sử dụng một kho lưu trữ bí mật (secrets vault) để cất giữ những thông tin nhạy cảm loại này.

Bây giờ chúng ta có thể kiểm thử ứng dụng. Đúng như kỳ vọng, ứng dụng sẽ cho phép các yêu cầu có giá trị chính xác của tiêu đề `Authorization` đi qua và từ chối các yêu cầu khác bằng cách trả về mã trạng thái HTTP 401 Unauthorized. Các đoạn mã tiếp theo trình bày các lệnh gọi `curl` dùng để kiểm thử ứng dụng. Nếu bạn sử dụng đúng giá trị đã được thiết lập trên máy chủ cho tiêu đề `Authorization`, cuộc gọi sẽ thành công và bạn sẽ nhận được thân phản hồi là "Hello!". Lệnh gọi:

```bash
curl -H "Authorization:SD9cICjl1e" http://localhost:8080/hello
```

trả về phần thân phản hồi sau:

```text
Hello!
```

Với lệnh gọi tiếp theo, nếu tiêu đề `Authorization` bị thiếu hoặc không chính xác, mã trạng thái phản hồi sẽ là HTTP 401 Unauthorized:

```bash
curl -v http://localhost:8080/hello
```

Trạng thái phản hồi nhận được là:

```text
...
< HTTP/1.1 401
...
```

Trong trường hợp này, vì chúng ta không cấu hình một `UserDetailsService`, Spring Boot sẽ tự động cấu hình một bộ mặc định, như bạn đã biết ở Chương 2. Nhưng trong kịch bản của chúng ta, bạn hoàn toàn không cần đến `UserDetailsService` vì khái niệm người dùng không hề tồn tại. Chúng ta chỉ xác thực xem người dùng đang cố gắng gọi endpoint trên máy chủ có biết một giá trị cho trước hay không. Các kịch bản ứng dụng thông thường không đơn giản như thế này và chúng thường yêu cầu một `UserDetailsService`. Tuy nhiên, nếu bạn dự đoán hoặc gặp phải trường hợp thành phần này thực sự không cần thiết, bạn có thể tắt tính năng tự động cấu hình này đi. Để tắt cấu hình mặc định của `UserDetailsService`, bạn có thể sử dụng thuộc tính `exclude` của chú thích `@SpringBootApplication` trên lớp khởi chạy chính:

```java
@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class })
```

## 5.5 Các triển khai bộ lọc do Spring Security cung cấp

Phần này thảo luận về các lớp do Spring Security cung cấp có triển khai giao diện `Filter`. Trong các ví dụ trước, chúng ta định nghĩa bộ lọc bằng cách trực tiếp triển khai giao diện này.

Spring Security cung cấp một vài lớp trừu tượng (abstract classes) có triển khai giao diện `Filter` mà bạn có thể kế thừa để định nghĩa các bộ lọc của mình. Các lớp này cũng bổ sung thêm các tính năng hữu ích mà triển khai của bạn có thể tận dụng khi mở rộng chúng. Ví dụ, bạn có thể kế thừa lớp `GenericFilterBean`, lớp này cho phép bạn sử dụng các tham số khởi tạo mà bạn định nghĩa trong tệp mô tả `web.xml` khi cần thiết. Một lớp hữu ích hơn kế thừa từ lớp `GenericFilterBean` là `OncePerRequestFilter`. Khi thêm một bộ lọc vào chuỗi, framework không đảm bảo rằng bộ lọc đó sẽ chỉ được gọi duy nhất một lần cho mỗi yêu cầu. `OncePerRequestFilter`, đúng như tên gọi của nó, triển khai logic để đảm bảo chắc chắn rằng phương thức `doFilter()` của bộ lọc sẽ chỉ được thực thi đúng một lần cho mỗi yêu cầu.

Nếu bạn cần tính năng này trong ứng dụng của mình, hãy sử dụng các lớp mà Spring cung cấp. Tuy nhiên, nếu bạn không cần đến chúng, tôi luôn khuyên bạn nên giữ cho các triển khai của mình đơn giản nhất có thể. Đã quá nhiều lần tôi thấy các lập trình viên kế thừa lớp `GenericFilterBean` thay vì triển khai giao diện `Filter` trực tiếp cho những tính năng không hề đòi hỏi logic tùy chỉnh được bổ sung bởi lớp `GenericFilterBean`. Khi được hỏi tại sao làm vậy, có vẻ như họ cũng không biết câu trả lời. Có lẽ họ chỉ sao chép lại cách làm từ các ví dụ tìm thấy trên mạng.

Để làm sáng tỏ cách sử dụng một lớp như vậy, hãy cùng viết một ví dụ. Tính năng ghi nhật ký mà chúng ta đã triển khai ở phần 5.3 là một ứng cử viên tuyệt vời cho việc sử dụng `OncePerRequestFilter`. Chúng ta muốn tránh việc ghi nhật ký cùng một yêu cầu nhiều lần. Spring Security không đảm bảo bộ lọc sẽ không bị gọi nhiều hơn một lần, vì vậy chúng ta phải tự mình xử lý việc này. Cách đơn giản nhất là triển khai bộ lọc sử dụng lớp `OncePerRequestFilter`. Tôi đã viết nó trong một dự án riêng biệt có tên là `ssia-ch5-ex3`. Trong Đoạn mã 5.9, bạn sẽ thấy sự thay đổi tôi đã thực hiện cho lớp `AuthenticationLoggingFilter`. Thay vì triển khai trực tiếp giao diện `Filter` như trong ví dụ ở phần 5.3, giờ đây nó kế thừa từ lớp `OncePerRequestFilter`. Phương thức mà chúng ta ghi đè ở đây là `doFilterInternal()`. Bạn có thể tìm thấy mã nguồn này trong dự án `ssia-ch5-ex3`.

**Đoạn mã 5.9 Kế thừa lớp OncePerRequestFilter**

```java
public class AuthenticationLoggingFilter extends OncePerRequestFilter {

    private final Logger logger = Logger.getLogger(
        AuthenticationLoggingFilter.class.getName());

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
                                    throws ServletException, IOException {

        String requestId = request.getHeader("Request-Id");
        logger.info("Successfully authenticated request with id " + requestId);
        filterChain.doFilter(request, response);
    }
}
```

Một vài quan sát ngắn gọn về lớp `OncePerRequestFilter` mà bạn có thể thấy hữu ích:

- Nó chỉ hỗ trợ các yêu cầu HTTP, nhưng thực tế đó cũng là tất cả những gì chúng ta thường sử dụng. Lợi thế là nó tự động ép kiểu dữ liệu, và chúng ta trực tiếp nhận được các yêu cầu dưới dạng `HttpServletRequest` và `HttpServletResponse`. Hãy nhớ rằng, đối với giao diện `Filter` tiêu chuẩn, chúng ta đã phải tự ép kiểu cho request và response.

- Bạn có thể triển khai logic để quyết định xem bộ lọc có được áp dụng hay không. Ngay cả khi bạn đã thêm bộ lọc vào chuỗi, bạn vẫn có thể quyết định rằng nó không áp dụng cho các yêu cầu cụ thể nào đó. Bạn thiết lập điều này bằng cách ghi đè phương thức `shouldNotFilter(HttpServletRequest)`. Theo mặc định, bộ lọc được áp dụng cho tất cả các yêu cầu.

- Theo mặc định, một `OncePerRequestFilter` không áp dụng cho các yêu cầu bất đồng bộ (asynchronous requests) hoặc các yêu cầu điều phối lỗi (error dispatch requests). Bạn có thể thay đổi hành vi này bằng cách ghi đè các phương thức `shouldNotFilterAsyncDispatch()` và `shouldNotFilterErrorDispatch()`.

Nếu bạn thấy bất kỳ đặc điểm nào trên đây của `OncePerRequestFilter` hữu ích cho triển khai của mình, tôi khuyến khích bạn sử dụng lớp này để định nghĩa các bộ lọc của bạn.

## Tóm tắt

- Lớp đầu tiên của kiến trúc ứng dụng web tiếp nhận và ngăn chặn các yêu cầu HTTP chính là chuỗi bộ lọc. Tương tự như các thành phần khác trong kiến trúc Spring Security, bạn có thể tùy biến chúng để phù hợp với các yêu cầu của mình.

- Bạn có thể tùy biến chuỗi bộ lọc bằng cách thêm các bộ lọc mới vào trước, vào sau, hoặc ngay tại vị trí của một bộ lọc hiện có.

- Bạn có thể chèn nhiều bộ lọc vào cùng một vị trí với một bộ lọc sẵn có. Trong trường hợp này, thứ tự thực thi của các bộ lọc đó sẽ không được định nghĩa trước.

- Việc thay đổi chuỗi bộ lọc giúp bạn tùy biến quy trình xác thực và phân quyền để đáp ứng chính xác các yêu cầu nghiệp vụ của ứng dụng.
