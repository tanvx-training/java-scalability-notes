# Chương 9: Cấu hình bảo vệ chống CSRF

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chương này**

- Tìm hiểu về các cuộc tấn công CSRF

- Triển khai cơ chế bảo vệ CSRF

- Tùy chỉnh cơ chế bảo vệ CSRF

Bạn đã được tìm hiểu về chuỗi bộ lọc (filter chain) và vai trò của nó trong kiến trúc Spring Security. Chúng ta cũng đã thực hành một số ví dụ tùy chỉnh chuỗi bộ lọc ở Chương 5. Tuy nhiên, Spring Security còn tự động bổ sung các bộ lọc riêng của mình vào chuỗi này. Chương này sẽ thảo luận về bộ lọc đảm nhận nhiệm vụ cấu hình cơ chế bảo vệ chống giả mạo yêu cầu chéo trang — CSRF (Cross-Site Request Forgery)12. Bạn sẽ học cách tùy chỉnh các bộ lọc này để chúng hoạt động hoàn hảo nhất trong các tình huống thực tế của mình. Có lẽ bạn đã nhận ra rằng trong hầu hết các ví dụ trước đây, chúng ta chỉ triển khai các endpoint bằng phương thức HTTP GET. Hơn nữa, mỗi khi cần cấu hình phương thức HTTP POST, chúng ta buộc phải thêm một chỉ thị phụ trong cấu hình để vô hiệu hóa tính năng bảo vệ CSRF. Lý do bạn không thể gọi trực tiếp một endpoint bằng phương thức HTTP POST là vì cơ chế bảo vệ CSRF luôn được bật theo mặc định trong Spring Security.

Bây giờ, chúng ta sẽ thảo luận về cơ chế bảo vệ CSRF và thời điểm cần áp dụng nó trong ứng dụng của bạn. CSRF là một hình thức tấn công rất phổ biến. Những ứng dụng gặp phải lỗ hổng này có thể bị kẻ xấu lợi dụng để ép buộc người dùng (sau khi đã đăng nhập thành công) thực hiện các hành động ngoài ý muốn trên ứng dụng web đó. Chắc chắn bạn không hề muốn ứng dụng do mình phát triển dính phải lỗ hổng CSRF và để kẻ tấn công dễ dàng lừa gạt người dùng của mình.

Để hiểu rõ cách giảm thiểu các lỗ hổng này, trước hết chúng ta cần ôn lại khái niệm CSRF và nguyên lý hoạt động của nó. Sau đó, chúng ta sẽ thảo luận về cơ chế sử dụng token CSRF mà Spring Security áp dụng để ngăn chặn lỗ hổng này. Tiếp theo, chúng ta sẽ tìm hiểu cách lấy token và sử dụng nó để gọi một endpoint bằng phương thức HTTP POST, thông qua một ứng dụng minh họa nhỏ có các REST endpoint. Khi đã nắm chắc cách Spring Security triển khai cơ chế token CSRF, chúng ta sẽ bàn về cách áp dụng nó vào các kịch bản thực tế. Cuối cùng, bạn sẽ học cách tùy chỉnh cơ chế này trong Spring Security sao cho phù hợp với nhu cầu.

## 9.1 Cơ chế bảo vệ CSRF hoạt động như thế nào trong Spring Security

Phần này sẽ thảo luận về cách Spring Security triển khai cơ chế bảo vệ CSRF. Điều cốt lõi là trước tiên bạn phải nắm được nguyên lý cơ bản của cơ chế này. Tôi từng gặp rất nhiều trường hợp lập trình viên do hiểu sai cách thức hoạt động của tính năng bảo vệ CSRF dẫn đến việc sử dụng sai cách — hoặc là tắt nó đi trong những tình huống bắt buộc phải bật, hoặc ngược lại. Giống như bất kỳ tính năng nào khác trong một framework, bạn phải sử dụng nó đúng cách thì mới mang lại giá trị thực sự cho ứng dụng của mình.

Hãy thử tưởng tượng kịch bản sau: Bạn đang ở nơi làm việc và sử dụng một công cụ web để lưu trữ cũng như quản lý các tệp tin của mình. Thông qua giao diện web của công cụ này, bạn có thể thêm tệp mới, cập nhật phiên bản mới cho các hồ sơ, và thậm chí là xóa chúng. Đột nhiên, bạn nhận được một email yêu cầu mở một trang web vì một lý do đặc biệt nào đó (chẳng hạn như chương trình khuyến mãi tại cửa hàng yêu thích của bạn). Bạn nhấp vào và mở trang web đó ra, nhưng trang hiển thị hoàn toàn trống trơn hoặc tự động chuyển hướng bạn đến một trang web quen thuộc (như cửa hàng trực tuyến kia). Khi quay trở lại với công việc của mình, bạn bàng hoàng nhận ra toàn bộ tệp tin của mình đã biến mất!

Chuyện gì đã xảy ra vậy? Bạn đang đăng nhập vào ứng dụng công việc để quản lý tệp tin của mình. Khi bạn thêm, sửa hoặc xóa một tệp, trang web mà bạn tương tác sẽ gọi các endpoint từ máy chủ để thực thi các thao tác này. Khi bạn mở trang web lạ kia bằng cách nhấp vào liên kết không rõ nguồn gốc trong email, chính trang web đó đã âm thầm gọi đến backend của ứng dụng công việc của bạn và thực thi các hành động dưới danh nghĩa của bạn (cụ thể ở đây là xóa sạch các tệp tin của bạn).

Kẻ tấn công làm được điều đó là vì bạn đã đăng nhập trước đó, nên máy chủ hoàn toàn tin tưởng rằng các hành động này xuất phát từ bạn. Bạn có thể nghĩ rằng không dễ gì ai đó lừa được mình nhấp vào một liên kết từ email hay tin nhắn lạ, nhưng hãy tin tôi đi, việc này xảy ra với rất nhiều người. Hầu hết người dùng ứng dụng web đều không hề có ý thức về các rủi ro bảo mật. Vì vậy, thay vì trông chờ vào việc người dùng tự bảo vệ mình, sẽ khôn ngoan hơn nếu chính bạn — người hiểu rõ mọi mánh khóe của kẻ tấn công — chủ động bảo vệ người dùng bằng cách xây dựng những ứng dụng an toàn.

Các cuộc tấn công CSRF luôn dựa trên giả định rằng người dùng đã đăng nhập vào một ứng dụng web nào đó. Kẻ tấn công sẽ lừa người dùng mở một trang web chứa các đoạn mã độc hại (script). Các đoạn mã này sẽ âm thầm thực thi các hành động trên chính ứng dụng mà người dùng đang làm việc. Vì người dùng đã đăng nhập trước đó (như giả định ban đầu), mã độc giả mạo lúc này có thể mạo danh người dùng và thực hiện các thao tác thay cho họ.

### Kịch bản tấn công

1. Carlos là một kế toán viên: Anh ấy đăng nhập vào ứng dụng quản lý tài khoản của công ty.

2. Nhưng anh ấy cũng là người yêu âm nhạc: Trong giờ làm việc, anh truy cập vào một trang web nghe nhạc miễn phí.

3. Trang web đó chứa mã độc: Bên cạnh âm nhạc, các trang của nó còn ẩn chứa mã độc giả mạo. Carlos hoàn toàn không biết điều này; anh chỉ nghĩ đơn giản đó là một trang web chia sẻ nhạc miễn phí thông thường.

4. Hậu quả: Đoạn mã độc hoạt động dưới danh nghĩa của người dùng đã đăng nhập, âm thầm thực hiện các thay đổi ngoài ý muốn. Sau đó, Carlos nhận ra một số tài khoản mà mình đang quản lý đã bị thay đổi hoặc bị xóa sạch.

Làm thế nào để chúng ta bảo vệ người dùng khỏi những kịch bản như vậy? Mục tiêu của cơ chế bảo vệ CSRF là đảm bảo rằng chỉ có phần frontend của chính ứng dụng web đó mới có quyền thực hiện các thao tác thay đổi dữ liệu (theo quy ước, đây là các phương thức HTTP khác ngoài GET, HEAD, TRACE hoặc OPTIONS). Nhờ vậy, một trang web lạ như trong ví dụ trên sẽ không thể hành động thay cho người dùng được nữa.

Chúng ta đạt được điều này bằng cách nào? Có một thực tế chắc chắn là trước khi thực hiện bất kỳ hành động nào có khả năng thay đổi dữ liệu, người dùng phải gửi một yêu cầu bằng phương thức HTTP GET để tải trang web đó ít nhất một lần. Khi sự kiện này diễn ra, ứng dụng sẽ tự động tạo ra một token duy nhất. Từ thời điểm đó, ứng dụng sẽ chỉ chấp nhận các yêu cầu thay đổi dữ liệu (POST, PUT, DELETE, v.v.) nếu chúng có chứa giá trị token duy nhất này trong phần header.

Ứng dụng coi việc biết được giá trị của token này là bằng chứng xác thực rằng chính bản thân ứng dụng đang thực hiện yêu cầu thay đổi dữ liệu, chứ không phải một hệ thống nào khác bên ngoài. Bất kỳ trang nào chứa các lệnh gọi thay đổi dữ liệu như POST, PUT, DELETE, v.v., đều phải nhận được token CSRF từ phản hồi của máy chủ, và trang đó bắt buộc phải đính kèm token này khi thực hiện các cuộc gọi thay đổi dữ liệu tiếp theo. Điểm khởi đầu của cơ chế bảo vệ CSRF là một bộ lọc nằm trong chuỗi bộ lọc mang tên `CsrfFilter`. `CsrfFilter` sẽ chặn các yêu cầu và cho phép tất cả các yêu cầu sử dụng các phương thức HTTP sau đi qua: GET, HEAD, TRACE và OPTIONS. Đối với tất cả các yêu cầu còn lại, bộ lọc yêu cầu phải nhận được một header chứa token hợp lệ. Nếu header này không tồn tại hoặc chứa giá trị token không chính xác, ứng dụng sẽ từ chối yêu cầu và trả về trạng thái phản hồi HTTP 403 Forbidden.

Vậy token này là gì và nó từ đâu ra? Thực chất, các token này chỉ là những chuỗi ký tự thông thường. Bạn bắt buộc phải thêm token này vào header của yêu cầu khi sử dụng bất kỳ phương thức nào khác ngoài GET, HEAD, TRACE hoặc OPTIONS. Nếu không làm vậy, ứng dụng sẽ không chấp nhận yêu cầu của bạn. `CsrfFilter` sử dụng một thành phần có tên là `CsrfTokenRepository` để quản lý các giá trị token CSRF — bao gồm việc tạo mới, lưu trữ và cuối cùng là vô hiệu hóa chúng. Theo mặc định, `CsrfTokenRepository` lưu trữ token trong session HTTP (HTTP session) và tạo ra các token dưới dạng một chuỗi ký tự ngẫu nhiên. Trong hầu hết các trường hợp, cấu hình này là đủ dùng. Tuy nhiên, như bạn sẽ tìm hiểu ở mục 9.3, bạn hoàn toàn có thể tự triển khai `CsrfTokenRepository` của riêng mình nếu cơ chế mặc định không đáp ứng được các yêu cầu đặc thù của dự án.

Trong phần này, tôi đã giải thích khá chi tiết bằng cả văn bản và hình vẽ về cách hoạt động của cơ chế bảo vệ CSRF trong Spring Security. Thế nhưng, tôi muốn giúp bạn củng cố thêm hiểu biết của mình thông qua một ví dụ code nhỏ. Bạn có thể tìm thấy mã nguồn này trong dự án mang tên `ssia-ch9-ex1`. Hãy cùng tạo một ứng dụng cung cấp hai endpoint: một endpoint có thể gọi bằng phương thức HTTP GET và endpoint còn lại gọi bằng HTTP POST.

Như bạn đã biết cho đến lúc này, bạn không thể gọi trực tiếp các endpoint bằng phương thức POST nếu không tắt cơ chế bảo vệ CSRF. Trong ví dụ này, bạn sẽ học cách gọi endpoint POST mà không cần phải vô hiệu hóa tính năng bảo vệ CSRF. Bạn cần lấy được token CSRF để đính kèm vào header của cuộc gọi sử dụng phương thức HTTP POST.

Qua ví dụ này, bạn sẽ thấy rằng `CsrfFilter` sẽ thêm token CSRF được tạo ra vào một thuộc tính của HTTP request có tên là `_csrf`. Một khi đã biết điều này, chúng ta hiểu rằng sau khi yêu cầu đi qua `CsrfFilter`, chúng ta có thể tìm thấy thuộc tính này và lấy ra giá trị token từ đó. Đối với ứng dụng nhỏ này, chúng ta chọn cách thêm một bộ lọc tùy chỉnh (custom filter) đứng sau `CsrfFilter`, tương tự như những gì bạn đã học ở Chương 5. Bộ lọc tùy chỉnh này sẽ làm nhiệm vụ in token CSRF ra console của ứng dụng khi chúng ta gọi endpoint bằng phương thức HTTP GET. Sau đó, chúng ta có thể sao chép giá trị token này từ console và sử dụng nó để thực hiện cuộc gọi thay đổi dữ liệu bằng phương thức HTTP POST. Trong Listing 9.1, bạn sẽ thấy định nghĩa của lớp controller chứa hai endpoint dùng để thử nghiệm.

**Listing 9.1 Lớp controller chứa hai endpoint**

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String getHello() {
        return "Get Hello!";
    }

    @PostMapping("/hello")
    public String postHello() {
        return "Post Hello!";
    }
}
```

Listing 9.2 định nghĩa bộ lọc tùy chỉnh dùng để in giá trị của token CSRF ra console. Tôi đặt tên cho bộ lọc tùy chỉnh này là `CsrfTokenLogger`. Khi được gọi, bộ lọc này sẽ lấy giá trị của token CSRF từ thuộc tính request `_csrf` và in ra console. Tên thuộc tính request `_csrf` chính là nơi `CsrfFilter` gán giá trị của token CSRF dưới dạng một thể hiện (instance) của lớp `CsrfToken`. Thể hiện `CsrfToken` này chứa giá trị chuỗi của token CSRF, và bạn có thể lấy nó bằng cách gọi phương thức `getToken()`.

**Listing 9.2 Định nghĩa lớp bộ lọc tùy chỉnh (custom filter)**

```java
public class CsrfTokenLogger implements Filter {

    private Logger logger = Logger.getLogger(CsrfTokenLogger.class.getName());

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain […]
            throws IOException, ServletException {

        CsrfToken o = (CsrfToken) request.getAttribute("_csrf"); // Lấy giá trị của to […]

        logger.info("CSRF token " + o.getToken()); // và in ra console.

        filterChain.doFilter(request, response);
    }
}
```

Trong lớp cấu hình, chúng ta sẽ thêm bộ lọc tùy chỉnh này vào. Listing tiếp theo sẽ trình bày lớp cấu hình đó. Hãy lưu ý rằng tôi không hề vô hiệu hóa cơ chế bảo vệ CSRF trong đoạn mã này.

**Listing 9.3 Thêm bộ lọc tùy chỉnh vào lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.addFilterAfter(
            new CsrfTokenLogger(), CsrfFilter.class
        )
        .authorizeHttpRequests(c -> c
            .anyRequest().permitAll()
        );

        return http.build();
    }
}
```

Giờ đây chúng ta đã có thể kiểm tra các endpoint. Chúng ta bắt đầu bằng cách gọi endpoint bằng phương thức HTTP GET. Do cơ chế triển khai mặc định của interface `CsrfTokenRepository` sử dụng HTTP session để lưu trữ giá trị token phía server, chúng ta cũng cần phải ghi nhớ ID của session (session ID). Vì lý do này, tôi thêm cờ `-v` vào lệnh gọi để có thể quan sát thêm thông tin chi tiết từ phản hồi, bao gồm cả session ID. Gọi endpoint:

```bash
curl -v http://localhost:8080/hello
```

trả về phản hồi (đã được rút ngắn) sau:

```text
...
< Set-Cookie: JSESSIONID=21ADA55E10D70BA81C338FFBB06B0206;
...
Get Hello!
```

Tiếp sau yêu cầu đó, trong console của ứng dụng bạn sẽ tìm thấy một dòng log chứa token CSRF:

```text
INFO 21412 --- [nio-8080-exec-1] c.l.ssia.filters.CsrfTokenLogger : CSRF token tAlE3LB […]
```

> **LƯU Ý:** Bạn có thể tự hỏi làm thế nào client lấy được token CSRF khi họ không thể đoán được cũng như không thể đọc log của server. Tôi thiết kế ví dụ này cốt để bạn dễ dàng nắm được cách thức hoạt động của cơ chế bảo vệ CSRF. Như bạn sẽ thấy ở mục 9.2, ứng dụng backend có trách nhiệm đưa giá trị token CSRF vào phản hồi HTTP (HTTP response) để client có thể sử dụng.

Nếu bạn gọi endpoint bằng phương thức HTTP POST mà không cung cấp token CSRF, trạng thái phản hồi trả về sẽ là 403 Forbidden, giống như kết quả chạy dòng lệnh sau đây:

```bash
curl -XPOST http://localhost:8080/hello
```

Phần thân của phản hồi (response body) là:

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Forbidden",
  "path": "/hello"
}
```

Thế nhưng, nếu bạn cung cấp đúng giá trị của token CSRF, lệnh gọi sẽ thành công. Bạn cũng cần phải chỉ định rõ session ID (`JSESSIONID`) vì cơ chế triển khai mặc định của `CsrfTokenRepository` lưu trữ giá trị token CSRF trong session:

```bash
curl -X POST http://localhost:8080/hello \
-H 'Cookie: JSESSIONID=21ADA55E10D70BA81C338FFBB06B0206' \
-H 'X-CSRF-TOKEN: tAlE3LB_R_KN48DFlRChc…'
```

Phần thân của phản hồi là:

```text
Post Hello!
```

## 9.2 Sử dụng cơ chế bảo vệ CSRF trong các kịch bản thực tế

Trong phần này, chúng ta sẽ thảo luận về việc áp dụng cơ chế bảo vệ CSRF trong các tình huống thực tế. Giờ đây khi đã nắm vững nguyên lý hoạt động của cơ chế bảo vệ CSRF trong Spring Security, bạn cần biết mình nên áp dụng nó ở đâu trong thế giới thực. Những loại ứng dụng nào thì cần sử dụng cơ chế bảo vệ CSRF? Bạn nên sử dụng cơ chế bảo vệ CSRF cho các ứng dụng web chạy trên trình duyệt — nơi mà bạn dự kiến các thao tác thay đổi dữ liệu có thể được thực thi bởi chính trình duyệt tải nội dung hiển thị của ứng dụng đó. Ví dụ cơ bản nhất mà tôi có thể đưa ra ở đây là một ứng dụng web đơn giản được phát triển dựa trên luồng Spring MVC tiêu chuẩn. Chúng ta đã từng xây dựng một ứng dụng như vậy khi thảo luận về tính năng đăng nhập bằng biểu mẫu (form login) ở Chương 6, và ứng dụng web đó thực chất đã sử dụng cơ chế bảo vệ CSRF. Bạn có nhận ra rằng thao tác đăng nhập trong ứng dụng đó đã sử dụng phương thức HTTP POST không? Vậy tại sao lúc đó chúng ta không cần phải làm bất cứ điều gì cụ thể liên quan đến CSRF? Lý do chúng ta không nhận thấy điều này là vì chúng ta chưa phát triển bất kỳ thao tác thay đổi dữ liệu nào tại thời điểm đó.

Đối với tính năng đăng nhập bằng biểu mẫu mặc định, Spring Security đã tự động áp dụng chính xác cơ chế bảo vệ CSRF cho chúng ta. Framework này tự lo liệu việc thêm token CSRF vào yêu cầu đăng nhập. Bây giờ, chúng ta hãy phát triển một ứng dụng tương tự để quan sát kỹ hơn cách hoạt động của cơ chế bảo vệ CSRF. Trong phần này chúng ta sẽ:

- Xây dựng một ứng dụng web mẫu có biểu mẫu đăng nhập

- Quan sát cách cơ chế triển khai mặc định của chức năng đăng nhập sử dụng token CSRF

- Triển khai một cuộc gọi HTTP POST từ trang chính

Trong ứng dụng ví dụ này, bạn sẽ nhận thấy rằng cuộc gọi HTTP POST sẽ không hoạt động cho đến khi chúng ta sử dụng đúng cách các token CSRF. Tại đây, bạn sẽ học cách áp dụng token CSRF vào một biểu mẫu (form) trên một trang web như vậy. Để triển khai ứng dụng này, trước tiên chúng ta tạo một dự án Spring Boot mới. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch9-ex2`. Đoạn code tiếp theo trình bày các dependency cần thiết:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Tiếp theo, tất nhiên, chúng ta cần cấu hình chức năng đăng nhập bằng biểu mẫu và tạo ít nhất một người dùng. Listing dưới đây trình bày lớp cấu hình, trong đó định nghĩa `UserDetailsService`, thêm một người dùng, và cấu hình phương thức `formLogin`.

**Listing 9.4 Định nghĩa lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public UserDetailsService uds() {
        var uds = new InMemoryUserDetailsManager(); // Thêm một bean UserDetailsServic […]

        var u1 = User.withUsername("mary")
            .password("12345")
            .authorities("READ")
            .build();

        uds.createUser(u1);
        return uds;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance(); // Thêm một PasswordEncoder
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.formLogin(c -> c
            .defaultSuccessUrl("/main", true)
        );

        http.authorizeHttpRequests(c -> c
            .anyRequest().authenticated()
        );

        return http.build();
    }
}
```

Chúng ta thêm một lớp controller cho trang chính trong một package tên là `controllers` và một tệp `main.html` trong thư mục `resources/templates` của dự án Maven. Tệp `main.html` hiện tại có thể để trống, vì trong lần chạy đầu tiên của ứng dụng, chúng ta chỉ tập trung vào cách trang đăng nhập sử dụng các token CSRF. Listing dưới đây trình bày lớp `MainController` dùng để điều hướng và hiển thị trang chính.

**Listing 9.5 Định nghĩa lớp MainController**

```java
@Controller
public class MainController {

    @GetMapping("/main")
    public String main() {
        return "main.html";
    }
}
```

Sau khi chạy ứng dụng, bạn có thể truy cập vào trang đăng nhập mặc định. Nếu bạn kiểm tra biểu mẫu bằng tính năng "kiểm tra phần tử" (inspect element) của trình duyệt, bạn sẽ thấy cơ chế triển khai mặc định của biểu mẫu đăng nhập tự động gửi kèm token CSRF. Đây chính là lý do vì sao thao tác đăng nhập của bạn vẫn hoạt động bình thường khi bật tính năng bảo vệ CSRF, mặc dù nó sử dụng một yêu cầu HTTP POST! Trang đăng nhập mặc định đã sử dụng một thẻ input ẩn (`hidden`) để gửi kèm token CSRF trong yêu cầu.

Thế còn việc tự phát triển các endpoint sử dụng các phương thức HTTP như POST, PUT hoặc DELETE thì sao? Với những trường hợp này, chúng ta buộc phải chủ động gửi kèm giá trị của token CSRF nếu tính năng bảo vệ CSRF đang được kích hoạt. Để kiểm thử điều này, chúng ta hãy thêm một endpoint sử dụng phương thức HTTP POST vào ứng dụng. Chúng ta sẽ gọi endpoint này từ trang chính, và chúng ta tạo một controller thứ hai tên là `ProductController` để xử lý. Trong controller này, chúng ta định nghĩa một endpoint `/product/add` sử dụng HTTP POST. Kế đó, chúng ta dùng một biểu mẫu trên trang chính để gọi endpoint này. Listing dưới đây định nghĩa lớp `ProductController`.

**Listing 9.6 Định nghĩa lớp ProductController**

```java
@Controller
@RequestMapping("/product")
public class ProductController {

    private Logger logger = Logger.getLogger(ProductController.class.getName());

    @PostMapping("/add")
    public String add(@RequestParam String name) {
        logger.info("Adding product " + name);
        return "main.html";
    }
}
```

Endpoint này nhận một tham số yêu cầu (request parameter) và in nó ra console của ứng dụng. Listing dưới đây trình bày định nghĩa của biểu mẫu nằm trong tệp `main.html`.

**Listing 9.7 Định nghĩa biểu mẫu trong trang main.html**

```html
<form action="/product/add" method="post">
    <span>Name:</span>
    <span><input type="text" name="name" /></span>
    <span><button type="submit">Add</button></span>
</form>
```

Giờ đây bạn có thể chạy lại ứng dụng và thử nghiệm biểu mẫu này. Bạn sẽ thấy rằng khi gửi yêu cầu (submit), một trang lỗi mặc định sẽ hiển thị, xác nhận trạng thái HTTP 403 Forbidden từ máy chủ phản hồi. Lý do dẫn đến lỗi này là do thiếu token CSRF trong yêu cầu gửi đi.

Để giải quyết vấn đề này và giúp máy chủ chấp nhận yêu cầu, chúng ta cần đưa token CSRF vào yêu cầu gửi đi từ biểu mẫu. Cách đơn giản nhất để làm điều này là sử dụng một thành phần input ẩn, tương tự như những gì bạn thấy ở biểu mẫu đăng nhập mặc định. Việc triển khai có thể được thực hiện như trong listing dưới đây.

**Listing 9.8 Thêm token CSRF vào yêu cầu được thực hiện qua biểu mẫu**

```html
<form action="/product/add" method="post">
 <span>Name:</span>
 <span><input type="text" name="name" /></span>
 <span><button type="submit">Add</button></span>
 <input type="hidden"
 th:name="${_csrf.parameterName}"
 th:value="${_csrf.token}" />
</form>
```

> **LƯU Ý:** Trong ví dụ này, chúng ta sử dụng Thymeleaf vì nó cung cấp một cách rất đơn giản để lấy giá trị thuộc tính request ngay trong view. Trong trường hợp của chúng ta, chúng ta cần hiển thị token CSRF. Hãy nhớ rằng `CsrfFilter` đã thêm giá trị của token vào thuộc tính `_csrf` của request. Việc sử dụng Thymeleaf ở đây không phải là bắt buộc. Bạn hoàn toàn có thể dùng bất kỳ giải pháp thay thế nào khác mà bạn thích để hiển thị giá trị token ra phản hồi.

Sau khi chạy lại ứng dụng, bạn có thể thử nghiệm lại biểu mẫu một lần nữa. Lần này, máy chủ đã chấp nhận yêu cầu và ứng dụng sẽ in ra dòng log trong console, chứng minh rằng thao tác thực thi đã thành công. Ngoài ra, nếu bạn kiểm tra phần tử trên biểu mẫu, bạn sẽ tìm thấy thẻ input ẩn chứa giá trị của token CSRF. Sau khi gửi biểu mẫu, bạn sẽ thấy một dòng log tương tự như sau trong console của ứng dụng:

```text
INFO 20892 --- [nio-8080-exec-7] c.l.s.controllers.ProductController : Adding product […]
```

Tất nhiên, đối với bất kỳ hành động nào hoặc yêu cầu JavaScript bất đồng bộ (asynchronous JavaScript request) nào mà trang của bạn sử dụng để gọi một tác vụ thay đổi dữ liệu, bạn đều cần gửi kèm một token CSRF hợp lệ. Đây là phương thức phổ biến nhất được các ứng dụng áp dụng để đảm bảo yêu cầu đó không xuất phát từ bên thứ ba. Một yêu cầu từ bên thứ ba có thể cố gắng mạo danh người dùng để thực thi các tác vụ ngoài ý muốn dưới danh nghĩa của họ.

Cơ chế token CSRF hoạt động rất tốt trong kiến trúc mà ở đó cùng một máy chủ đảm nhận cả phần frontend lẫn backend, chủ yếu là nhờ tính đơn giản của nó. Tuy nhiên, token CSRF lại không mấy hiệu quả khi client hoạt động độc lập với giải pháp backend mà nó kết nối. Kịch bản này xảy ra khi bạn dùng ứng dụng di động làm client, hoặc một ứng dụng frontend web được phát triển độc lập. Một web client được xây dựng bằng các framework như Angular, ReactJS hoặc Vue.js đã trở nên cực kỳ phổ biến trong kiến trúc ứng dụng web ngày nay, và đó là lý do tại sao bạn cũng cần biết cách triển khai giải pháp bảo mật cho các trường hợp này. Chúng ta sẽ cùng thảo luận về các kiểu thiết kế như vậy trong phần 4 của cuốn sách này.

Ở các chương từ 13 đến 16, bạn sẽ được học cách triển khai đặc tả OAuth 2, một giải pháp mang lại những lợi thế tuyệt vời trong việc phân tách (decouple) các thành phần hệ thống. Điều này giúp tách biệt quá trình xác thực khỏi các tài nguyên mà ứng dụng cấp quyền cho client truy cập.

> **LƯU Ý:** Nghe có vẻ giống như một sai sót ngớ ngẩn, nhưng theo kinh nghiệm của tôi, lỗi này xuất hiện quá nhiều lần trong các ứng dụng thực tế — tuyệt đối không sử dụng HTTP GET cho các thao tác thay đổi dữ liệu! Đừng bao giờ triển khai các hành vi làm thay đổi dữ liệu mà lại cho phép gọi chúng qua một endpoint HTTP GET. Hãy nhớ rằng các cuộc gọi đến endpoint HTTP GET không yêu cầu token CSRF.

## 9.3 Tùy chỉnh cơ chế bảo vệ CSRF

Trong phần này, bạn sẽ học cách tùy chỉnh giải pháp bảo vệ CSRF do Spring Security cung cấp. Vì mỗi ứng dụng lại có những yêu cầu khác nhau, nên bất kỳ cơ chế triển khai nào của một framework cũng đều phải đủ linh hoạt để có thể dễ dàng điều chỉnh cho phù hợp với các kịch bản đa dạng. Cơ chế bảo vệ CSRF trong Spring Security cũng không phải ngoại lệ. Ở phần này, các ví dụ thực hành sẽ giúp bạn áp dụng các nhu cầu thường gặp nhất khi tùy chỉnh cơ chế bảo vệ CSRF. Đó là:

- Cấu hình các đường dẫn áp dụng bảo vệ CSRF

- Quản lý các token CSRF

Chúng ta chỉ sử dụng cơ chế bảo vệ CSRF khi trang web sử dụng tài nguyên do máy chủ cung cấp cũng được tạo ra bởi chính máy chủ đó. Đó có thể là một ứng dụng web nơi các endpoint được gọi nằm ở một nguồn gốc (origin) khác như chúng ta đã thảo luận ở mục 9.2, hoặc một ứng dụng di động. Trong trường hợp ứng dụng di động, bạn có thể sử dụng luồng OAuth 2 mà chúng ta sẽ thảo luận chi tiết ở các chương từ 13 đến 16.

Theo mặc định, cơ chế bảo vệ CSRF áp dụng cho bất kỳ đường dẫn nào của các endpoint được gọi bằng các phương thức HTTP khác ngoài GET, HEAD, TRACE hoặc OPTIONS. Bạn đã biết cách vô hiệu hóa hoàn toàn cơ chế bảo vệ CSRF ở Chương 5. Nhưng nếu bạn chỉ muốn tắt nó cho một vài đường dẫn cụ thể trong ứng dụng thì sao? Bạn có thể nhanh chóng thực hiện cấu hình này bằng một đối tượng `Customizer`, tương tự như cách chúng ta tùy chỉnh phương thức HTTP Basic cho tính năng form-login ở Chương 6.

Tại đây, chúng ta tạo một dự án mới và chỉ thêm các dependency cho web và bảo mật, như được trình bày trong đoạn code tiếp theo. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch9-ex3`. Dưới đây là các dependency:

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

Trong ứng dụng này, chúng ta thêm hai endpoint được gọi bằng phương thức HTTP POST, nhưng chúng ta muốn loại trừ một trong hai endpoint này khỏi việc áp dụng bảo vệ CSRF. Listing 9.9 định nghĩa lớp controller phục vụ cho việc này, được tôi đặt tên là `HelloController`.

**Listing 9.9 Định nghĩa lớp HelloController**

```java
@RestController
public class HelloController {
 @PostMapping("/hello")
 public String postHello() {
 return "Post Hello!";
 }

 @PostMapping("/ciao")
 public String postCiao() {
 return "Post Ciao";
 }
}
```

Để thực hiện các tùy chỉnh về bảo vệ CSRF, bạn có thể gọi phương thức `csrf()` của đối tượng `HttpSecurity` trong phương thức `securityFilterChain()`, có truyền vào một đối tượng `Customizer`. Listing tiếp theo sẽ trình bày cách tiếp cận này.

**Listing 9.10 Đối tượng Customizer để cấu hình cơ chế bảo vệ CSRF**

```java
@Configuration
public class ProjectConfig {
 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {
 http.csrf(c -> {
  c.ignoringRequestMatchers("/ciao");
 });
 http.authorizeHttpRequests(
  c -> c.anyRequest().permitAll()
 );
 return http.build();
 }
}
```

Bằng cách gọi phương thức `ignoringRequestMatchers(String paths)`, bạn có thể chỉ định các biểu thức đường dẫn đại diện cho các đường dẫn mà bạn muốn loại trừ khỏi cơ chế bảo vệ CSRF. Một cách tiếp cận tổng quát hơn là sử dụng một `RequestMatcher`. Cách này cho phép bạn áp dụng các quy tắc loại trừ bằng cả biểu thức đường dẫn thông thường lẫn biểu thức chính quy (regex - regular expression). Khi sử dụng phương thức `ignoringRequestMatchers()` của đối tượng `CsrfCustomizer`, bạn có thể truyền vào bất kỳ `RequestMatcher` nào làm tham số. Đoạn code tiếp theo minh họa cách sử dụng phương thức `ignoringRequestMatchers()` với một `MvcRequestMatcher` thay vì truyền vào một giá trị String:

```java
HandlerMappingIntrospector i = new HandlerMappingIntrospector();
MvcRequestMatcher r = new MvcRequestMatcher(i, "/ciao");
c.ignoringRequestMatchers(r);
```

Hoặc bạn cũng có thể sử dụng một bộ khớp biểu thức chính quy (regex matcher) tương tự như sau:

```java
String pattern = ".*[0-9].*";
String httpMethod = HttpMethod.POST.name();
RegexRequestMatcher r = new RegexRequestMatcher(pattern, httpMethod);
c.ignoringRequestMatchers(r);
```

Một yêu cầu thực tế khác cũng rất hay gặp là tùy chỉnh việc quản lý các token CSRF. Như bạn đã biết, theo mặc định, ứng dụng lưu trữ các token CSRF trong HTTP session ở phía máy chủ. Cách tiếp cận đơn giản này phù hợp với các ứng dụng quy mô nhỏ, nhưng nó lại bộc lộ hạn chế lớn đối với các ứng dụng phải phục vụ lượng lớn yêu cầu và đòi hỏi khả năng mở rộng quy mô theo chiều ngang (horizontal scaling). Việc sử dụng HTTP session sẽ duy trì trạng thái kết nối (stateful) và từ đó làm giảm khả năng mở rộng của ứng dụng. Giả sử bạn muốn thay đổi cách ứng dụng quản lý token và lưu trữ chúng vào cơ sở dữ liệu thay vì lưu trong HTTP session. Spring Security cung cấp ba giao ước (contract) mà bạn cần phải hiện thực hóa (implement) để thực hiện điều này:

- `CsrfToken` — Mô tả chính bản thân token CSRF

- `CsrfTokenRepository` — Mô tả đối tượng đảm nhận việc tạo, lưu trữ và tải các token CSRF

- `CsrfTokenRequestHandler` — Mô tả đối tượng quản lý cách thức thiết lập token CSRF đã được tạo lên đối tượng HTTP request

Đối tượng `CsrfToken` có ba thuộc tính chính mà bạn cần chỉ định rõ khi triển khai giao ước này:

- Tên của header trong request chứa giá trị của token CSRF (mặc định tên là `X-CSRF-TOKEN`)

- Tên thuộc tính của request dùng để lưu trữ giá trị của token (mặc định tên là `_csrf`)

- Giá trị của chính token đó

**Listing 9.11 Định nghĩa interface CsrfToken**

```java
public interface CsrfToken extends Serializable {
 String getHeaderName();
 String getParameterName();
 String getToken();
}
```

Thông thường, bạn chỉ cần một thể hiện của kiểu `CsrfToken` để lưu trữ ba thông tin chi tiết kể trên trong các thuộc tính của nó. Để phục vụ chức năng này, Spring Security cung cấp một lớp triển khai sẵn mang tên `DefaultCsrfToken` và chúng ta cũng sẽ sử dụng nó trong ví dụ của mình. Lớp `DefaultCsrfToken` hiện thực hóa giao ước `CsrfToken` và tạo ra các thể hiện bất biến (immutable) chứa các giá trị cần thiết gồm: tên thuộc tính request, tên header, và chính giá trị token đó.

Interface `CsrfTokenRepository` là giao ước đại diện cho thành phần quản lý các token CSRF. Để thay đổi cách ứng dụng quản lý token, bạn cần triển khai interface `CsrfTokenRepository` này, từ đó cho phép bạn tích hợp (plug) phần mã triển khai tùy chỉnh của mình vào framework. Hãy cùng điều chỉnh ứng dụng hiện tại trong phần này để bổ sung một cơ chế triển khai `CsrfTokenRepository` mới, giúp lưu trữ token trong cơ sở dữ liệu.

Trong ví dụ của mình, chúng ta sử dụng một bảng trong cơ sở dữ liệu để lưu trữ các token CSRF. Chúng ta giả định rằng client có một mã định danh (ID) để tự xác định một cách duy nhất. Ứng dụng sẽ cần mã định danh này để lấy ra token CSRF và tiến hành xác thực nó. Thông thường, mã ID duy nhất này sẽ được cấp trong quá trình đăng nhập và sẽ khác nhau sau mỗi lần người dùng đăng nhập. Chiến lược quản lý token này tương tự như việc lưu trữ chúng trong bộ nhớ (in-memory). Trong trường hợp đó, bạn sử dụng một session ID. Do đó, mã định danh mới trong ví dụ này chỉ đơn thuần đóng vai trò thay thế cho session ID.

Một phương án thay thế cho cách tiếp cận này là sử dụng các token CSRF có thời hạn sử dụng xác định. Với cách tiếp cận này, các token sẽ hết hạn sau một khoảng thời gian do bạn quy định. Bạn có thể lưu trữ các token trong cơ sở dữ liệu mà không cần phải liên kết chúng với một ID người dùng cụ thể nào cả. Bạn chỉ cần kiểm tra xem token được cung cấp qua HTTP request có tồn tại trong hệ thống hay không và đã hết hạn chưa để quyết định xem có cho phép yêu cầu đó đi qua hay không.

> **BÀI TẬP THỰC HÀNH:** Sau khi bạn hoàn thành ví dụ sử dụng mã định danh được gán kèm token CSRF này, hãy thử tự triển khai cách tiếp cận thứ hai là sử dụng các token CSRF có thời hạn hết hạn.

Để giữ cho ví dụ của chúng ta ngắn gọn và tập trung hơn, chúng ta sẽ chỉ chú trọng vào việc triển khai `CsrfTokenRepository` và coi như client đã sở hữu sẵn một mã định danh được tạo từ trước. Để làm việc với cơ sở dữ liệu, chúng ta cần thêm một vài dependency vào tệp `pom.xml`:

```xml
<dependency>
 <groupId>org.springframework.boot</groupId>
 <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
 <groupId>com.mysql</groupId>
 <artifactId>mysql-connector-j</artifactId>
</dependency>
```

Trong tệp `application.properties`, chúng ta cần thêm các cấu hình kết nối cơ sở dữ liệu:

```properties
spring.datasource.url=jdbc:mysql://localhost/spring?useLegacyDatetimeCode=false&server […]
spring.datasource.username=root
spring.datasource.password=
spring.sql.init.mode=always
```

Để cho phép ứng dụng tự động tạo bảng cần thiết trong cơ sở dữ liệu ngay khi khởi động, bạn có thể thêm tệp `schema.xml` vào thư mục resources của dự án. Tệp này sẽ chứa câu lệnh truy vấn dùng để tạo bảng:

```sql
CREATE TABLE IF NOT EXISTS `spring`.`token` (
 `id` INT NOT NULL AUTO_INCREMENT,
 `identifier` VARCHAR(45) NULL,
 `token` TEXT NULL,
 PRIMARY KEY (`id`));
```

Chúng ta sử dụng Spring Data với cơ chế triển khai JPA để kết nối với cơ sở dữ liệu, vì thế chúng ta cần định nghĩa lớp thực thể (entity class) và lớp `JpaRepository`. Trong một package có tên là `entities`, chúng ta định nghĩa thực thể JPA như trình bày trong listing dưới đây.

**Listing 9.12 Định nghĩa lớp thực thể JPA (JPA entity class)**

```java
@Entity
public class Token {
 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private int id;
 private String identifier;
 private String token;
 // Mã nguồn được lược bỏ
}
```

`JpaTokenRepository`, vốn là giao ước `JpaRepository` của chúng ta, có thể được định nghĩa như trong listing dưới đây. Phương thức duy nhất bạn cần là `findTokenByIdentifier()`, dùng để lấy token CSRF từ cơ sở dữ liệu dựa trên một định danh client cụ thể.

**Listing 9.13 Định nghĩa interface JpaTokenRepository**

```java
public interface JpaTokenRepository
 extends JpaRepository<Token, Integer> {
 Optional<Token> findTokenByIdentifier(String identifier);
}
```

Sau khi thiết lập xong phần kết nối cơ sở dữ liệu, giờ đây chúng ta có thể bắt tay vào viết lớp triển khai của `CsrfTokenRepository`, được tôi đặt tên là `CustomCsrfTokenRepository`. Listing tiếp theo sẽ định nghĩa lớp này, trong đó ghi đè (override) ba phương thức của interface `CsrfTokenRepository`.

**Listing 9.14 Triển khai giao ước CsrfTokenRepository**

```java
@Component
public class CustomCsrfTokenRepository implements CsrfTokenRepository {
 private final JpaTokenRepository jpaTokenRepository;
 // Constructor đã được lược bỏ

 @Override
 public CsrfToken generateToken(
 HttpServletRequest httpServletRequest) {
 // ...
 }

 @Override
 public void saveToken(
 CsrfToken csrfToken,
 HttpServletRequest httpServletRequest,
 HttpServletResponse httpServletResponse) {
 // ...
 }

 @Override
 public CsrfToken loadToken(
 HttpServletRequest httpServletRequest) {
 // ...
 }
}
```

`CustomCsrfTokenRepository` tiêm (inject) một thể hiện của `JpaTokenRepository` từ Spring context để có quyền truy cập vào cơ sở dữ liệu. Lớp `CustomCsrfTokenRepository` sử dụng thực thể này để truy xuất hoặc lưu trữ các token CSRF vào cơ sở dữ liệu. Cơ chế bảo vệ CSRF sẽ gọi phương thức `generateToken()` khi ứng dụng cần tạo ra một token mới. Listing 9.15 minh họa cách triển khai phương thức này cho bài tập của chúng ta. Chúng ta sử dụng lớp `UUID` để tạo ra một giá trị `UUID` ngẫu nhiên mới, đồng thời giữ nguyên tên của request header và attribute là `X-CSRF-TOKEN` và `_csrf` tương tự như trong cơ chế triển khai mặc định của Spring Security.

**Listing 9.15 Triển khai phương thức generateToken()**

```java
@Override
public CsrfToken generateToken(HttpServletRequest httpServletRequest) {
 String uuid = UUID.randomUUID().toString();
 return new DefaultCsrfToken("X-CSRF-TOKEN", "_csrf", uuid);
}
```

Phương thức `saveToken()` thực hiện nhiệm vụ lưu trữ một token đã được tạo cho một client cụ thể. Trong trường hợp của cơ chế bảo vệ CSRF mặc định, ứng dụng sử dụng HTTP session để xác định token CSRF. Trong ví dụ của chúng ta, chúng ta giả sử rằng client sở hữu một mã định danh duy nhất. Client này sẽ gửi giá trị ID duy nhất của mình trong request thông qua một header có tên là `X-IDENTIFIER`. Trong logic xử lý của phương thức, chúng ta kiểm tra xem giá trị định danh này đã tồn tại trong cơ sở dữ liệu hay chưa. Nếu đã tồn tại, chúng ta cập nhật cơ sở dữ liệu với giá trị token mới. Nếu chưa, chúng ta tạo một bản ghi mới cho ID này tương ứng với giá trị token CSRF mới. Listing dưới đây trình bày cách triển khai phương thức `saveToken()`.

**Listing 9.16 Triển khai phương thức saveToken()**

```java
@Override
public void saveToken(
 CsrfToken csrfToken,
 HttpServletRequest httpServletRequest,
 HttpServletResponse httpServletResponse) {
 String identifier =
 httpServletRequest.getHeader("X-IDENTIFIER");
 Optional<Token> existingToken =
jpaTokenRepository.findTokenByIdentifier(identifier);
 if (existingToken.isPresent()) { // Nếu token đã tồn tại, cập nhật giá trị mới
 Token token = existingToken.get();
 token.setToken(csrfToken.getToken());
 } else { // Nếu chưa tồn tại, tạo mới bản ghi
 Token token = new Token();
 token.setToken(csrfToken.getToken());
 token.setIdentifier(identifier);
 jpaTokenRepository.save(token);
 }
}
```

Việc triển khai phương thức `loadToken()` sẽ thực hiện tải các thông tin chi tiết của token (nếu chúng tồn tại), ngược lại sẽ trả về giá trị null. Listing dưới đây minh họa phần triển khai này.

**Listing 9.17 Triển khai phương thức loadToken()**

```java
@Override
public CsrfToken loadToken(
 HttpServletRequest httpServletRequest) {
 String identifier = httpServletRequest.getHeader("X-IDENTIFIER");
 Optional<Token> existingToken =
 jpaTokenRepository
 .findTokenByIdentifier(identifier);
 if (existingToken.isPresent()) {
 Token token = existingToken.get();
 return new DefaultCsrfToken(
 "X-CSRF-TOKEN",
 "_csrf",
 token.getToken());
 }

 return null;
}
```

Chúng ta sử dụng lớp triển khai tùy chỉnh của `CsrfTokenRepository` để khai báo một bean trong lớp cấu hình. Sau đó, chúng ta tích hợp bean này vào cơ chế bảo vệ CSRF bằng cách gọi phương thức `csrfTokenRepository()` của `CsrfConfigurer`. Listing tiếp theo định nghĩa lớp cấu hình này.

**Listing 9.18 Lớp cấu hình cho CsrfTokenRepository tùy chỉnh**

```java
@Configuration
public class ProjectConfig {
 private final CustomCsrfTokenRepository customTokenRepository;
 // Constructor đã được lược bỏ

 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.csrf(c -> {
  c.csrfTokenRepository(customTokenRepository);
 });
 http.authorizeHttpRequests(
  c -> c.anyRequest().permitAll()
 );

 return http.build();
 }
}
```

Mảnh ghép cuối cùng chúng ta cần tích hợp để mọi thứ hoạt động trơn tru là một `CsrfTokenRequestHandler`. Thật may mắn, chúng ta có thể sử dụng một cơ chế triển khai có sẵn mà Spring Security cung cấp — lớp `CsrfTokenRequestAttributeHandler`. Cơ chế triển khai này chỉ đơn giản sử dụng phương thức `generateToken()` của `CsrfTokenRepository` để tạo ra một token mới khi một endpoint được gọi bằng phương thức HTTP GET. Có như vậy, nó mới gán đối tượng `CsrfToken` vừa được tạo lên request dưới dạng một thuộc tính (attribute).

Bạn hoàn toàn có thể tùy chỉnh hành vi đơn giản của đối tượng `CsrfTokenRequestAttributeHandler` bằng cách kế thừa lớp này. Chẳng hạn, cơ chế triển khai mặc định mà Spring Security sử dụng (mang tên `XorCsrfTokenRequestAttributeHandler`) sở hữu một hành vi phức tạp hơn nhiều. Cơ chế này tự động tạo ra một giá trị ngẫu nhiên bằng cách sử dụng đối tượng `SecureRandom`, sau đó trộn mảng byte của nó với token do `CsrfTokenRepository` tạo ra bằng phép toán logic XOR.

Tuy nhiên, để tránh làm tăng độ phức tạp không cần thiết cho ví dụ và giúp bạn tập trung tối đa vào phần cấu hình, chúng ta sẽ thiết lập một `CsrfTokenRequestAttributeHandler` đơn giản để xử lý việc quản lý token CSRF trên đối tượng HTTP request. Listing tiếp theo minh họa cách cấu hình `CsrfTokenRequestAttributeHandler` trong lớp cấu hình.

**Listing 9.19 Lớp cấu hình cho CsrfTokenRepository và Request Handler tùy chỉnh**

```java
@Configuration
public class ProjectConfig {
 private final CustomCsrfTokenRepository customTokenRepository;
 // Constructor đã được lược bỏ

 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.csrf(c -> {
  c.csrfTokenRepository(customTokenRepository);
  c.csrfTokenRequestHandler(
  new CsrfTokenRequestAttributeHandler()
  );
 });
 http.authorizeHttpRequests(
  c -> c.anyRequest().permitAll()
 );
 return http.build();
 }
}
```

Trong định nghĩa của lớp controller trình bày ở listing 9.9, chúng ta cũng thêm vào một endpoint sử dụng phương thức HTTP GET. Chúng ta cần phương thức này để lấy được token CSRF khi chạy thử nghiệm phần triển khai của mình:

```java
@GetMapping("/hello")
public String getHello() {
 return "Get Hello!";
}
```

Giờ đây bạn có thể khởi động ứng dụng và kiểm thử cơ chế quản lý token mới này. Chúng ta gọi endpoint bằng phương thức HTTP GET để lấy giá trị token CSRF. Khi thực hiện cuộc gọi, chúng ta bắt buộc phải truyền mã ID của client trong header `X-IDENTIFIER` đúng như yêu cầu nghiệp vụ đã đề ra. Một giá trị mới của token CSRF sẽ được tạo ra và lưu trữ vào cơ sở dữ liệu. Dưới đây là cuộc gọi mẫu:

```bash
curl -H "X-IDENTIFIER:12345" http://localhost:8080/hello
Get Hello!
```

Nếu bạn truy vấn bảng `token` trong cơ sở dữ liệu, bạn sẽ thấy ứng dụng đã thêm một bản ghi mới cho client có mã định danh 12345. Trong trường hợp của tôi, giá trị token CSRF được tạo ra và ghi nhận trong cơ sở dữ liệu là `2bc652f5-258b-4a26-b456-928e9bad71f8`. Chúng ta sẽ sử dụng giá trị này để gọi endpoint `/hello` bằng phương thức HTTP POST, tương tự như ví dụ trong đoạn code tiếp theo. Tất nhiên, chúng ta cũng bắt buộc phải cung cấp mã ID của client, bởi ứng dụng sẽ dùng ID này để truy vấn lấy token từ cơ sở dữ liệu và đối chiếu với token được gửi kèm trong request:

```bash
curl -XPOST -H "X-IDENTIFIER:12345" -H "X-CSRF-TOKEN:2bc652f5-258b-4a26-b456-928e9bad7 […]
Post Hello!
```

Nếu chúng ta cố tình gọi endpoint `/hello` bằng phương thức POST mà không cung cấp các header cần thiết, chúng ta sẽ nhận về một phản hồi có trạng thái HTTP 403 Forbidden. Để xác nhận điều này, hãy gọi endpoint bằng lệnh:

```bash
curl -XPOST http://localhost:8080/hello
```

Phần thân của phản hồi là:

```json
{
 "status":403,
 "error":"Forbidden",
 "message":"Forbidden",
 "path":"/hello"
}
```

## Tóm tắt

- CSRF là một hình thức tấn công mà ở đó người dùng bị lừa truy cập vào một trang web có chứa mã độc giả mạo. Đoạn mã này có thể mạo danh một người dùng đã đăng nhập vào ứng dụng và thay mặt họ thực hiện các hành động ngoài ý muốn.

- Cơ chế bảo vệ CSRF được kích hoạt theo mặc định trong Spring Security.

- Điểm khởi đầu của logic bảo vệ CSRF trong kiến trúc Spring Security là một bộ lọc HTTP (HTTP filter). Bạn có thể tùy chỉnh khả năng bảo vệ CSRF. Spring Security cung cấp ba giao ước đơn giản mà bạn có thể tự triển khai và tích hợp để định nghĩa các tính năng bảo vệ CSRF tùy chỉnh của riêng mình:

    - `CsrfToken` — Mô tả chính bản thân token CSRF

    - `CsrfTokenRepository` — Mô tả đối tượng đảm nhận việc tạo, lưu trữ và tải các token CSRF

    - `CsrfTokenRequestHandler` — Mô tả đối tượng quản lý cách thức thiết lập token CSRF đã được tạo lên đối tượng HTTP request
