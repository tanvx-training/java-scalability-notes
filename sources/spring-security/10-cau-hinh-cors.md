# Chương 10: Cấu hình CORS

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chương này gồm**

- Định nghĩa CORS

- Áp dụng các cấu hình CORS

Trong chương này, chúng ta sẽ thảo luận về cơ chế chia sẻ tài nguyên giữa các nguồn khác nhau (CORS - Cross-Origin Resource Sharing) và cách áp dụng cơ chế này trong Spring Security. Trước tiên, CORS là gì và tại sao bạn cần bận tâm về nó? Nhu cầu sử dụng CORS bắt nguồn từ đặc thù của các ứng dụng web. Theo mặc định, trình duyệt không cho phép gửi yêu cầu tới bất kỳ tên miền nào khác ngoài tên miền gốc tải trang web đó. Ví dụ, nếu bạn truy cập một trang web từ `example.com`, trình duyệt sẽ ngăn không cho trang web này gửi yêu cầu đến `api.example.com`.

Có thể hiểu một cách ngắn gọn rằng, ứng dụng sử dụng cơ chế CORS để nới lỏng chính sách nghiêm ngặt này, từ đó cho phép thực hiện các yêu cầu giữa các nguồn (origin) khác nhau trong một số điều kiện nhất định. Việc nắm vững kiến thức này là vô cùng cần thiết, bởi nhiều khả năng bạn sẽ phải áp dụng nó vào các ứng dụng thực tế, đặc biệt là trong bối cảnh hiện nay khi frontend và backend thường là các ứng dụng độc lập. Việc một ứng dụng frontend được phát triển bằng các nền tảng như Angular, ReactJS hoặc Vue và triển khai trên tên miền `example.com` nhưng lại gọi các endpoint của backend đặt tại một tên miền khác như `api.example.com` là một mô hình rất phổ biến.

Chương này cung cấp một số ví dụ thực tiễn giúp bạn hiểu cách áp dụng các chính sách CORS cho ứng dụng web của mình, đồng thời hướng dẫn cách phòng tránh các lỗ hổng bảo mật có thể phát sinh trong quá trình cấu hình.

## 10.1 CORS hoạt động như thế nào?

Phần này sẽ đi sâu vào cách thức CORS hoạt động trong các ứng dụng web. Giả sử bạn là chủ sở hữu của tên miền `example.com`. Nếu vì một lý do nào đó, các nhà phát triển của trang `example.org` muốn gọi trực tiếp đến các endpoint REST của bạn (`api.example.com`) từ trang web của họ, trình duyệt sẽ ngăn chặn hành động đó. Tình huống tương tự cũng xảy ra nếu một tên miền khác tìm cách tải ứng dụng của bạn thông qua một thẻ `iframe`.

> **LƯU Ý** Thẻ `iframe` là một phần tử HTML dùng để nhúng nội dung của một trang web này vào trong một trang web khác (ví dụ: tích hợp nội dung của trang `example.org` vào trong một trang thuộc `example.com`).

Về mặt nguyên tắc, mọi tình huống ứng dụng thực hiện các cuộc gọi liên miền giữa hai tên miền khác nhau đều bị nghiêm cấm. Tuy nhiên, trong thực tế, chắc chắn sẽ có lúc bạn bắt buộc phải thực hiện các cuộc gọi liên miền này. Đó chính là lúc bạn cần đến CORS để chỉ rõ tên miền nào được phép gửi yêu cầu đến ứng dụng của bạn, cũng như những thông tin chi tiết nào được phép chia sẻ. Cơ chế CORS vận hành dựa trên các HTTP header.

Các tiêu đề quan trọng nhất bao gồm:

- `Access-Control-Allow-Origin` — Chỉ định các tên miền bên ngoài (nguồn gốc) có thể truy cập tài nguyên trên tên miền của bạn.

- `Access-Control-Allow-Methods` — Cho phép giới hạn quyền truy cập từ tên miền khác chỉ đối với một số phương thức HTTP cụ thể. Ví dụ: bạn sử dụng tiêu đề này nếu muốn cho phép `example.com` gọi đến một endpoint nào đó, nhưng chỉ được phép dùng phương thức HTTP GET.

- `Access-Control-Allow-Headers` — Bổ sung các hạn chế về những tiêu đề có thể sử dụng trong một yêu cầu cụ thể. Ví dụ: bạn không muốn client gửi một tiêu đề nhất định cho một yêu cầu cụ thể nào đó.

Theo mặc định, Spring Security không tự động thêm bất kỳ tiêu đề nào trong số này vào phản hồi (response). Do đó, hãy bắt đầu từ câu hỏi cơ bản nhất: Điều gì sẽ xảy ra khi bạn thực hiện một cuộc gọi liên nguồn (cross-origin) mà không cấu hình CORS trong ứng dụng? Khi ứng dụng phía client gửi yêu cầu, nó mong đợi phản hồi nhận về phải chứa tiêu đề `Access-Control-Allow-Origin` xác định các nguồn được máy chủ chấp nhận. Nếu phản hồi thiếu đi tiêu đề này (giống như hành vi mặc định của Spring Security), trình duyệt sẽ lập tức từ chối phản hồi đó. Hãy cùng minh họa điều này qua một ứng dụng web nhỏ dưới đây. Chúng ta sẽ khởi tạo một dự án mới với các thư viện phụ thuộc (dependency) được mô tả trong đoạn mã sau (bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch10-ex1`):

```xml
<dependency>
 <groupId>org.springframework.boot</groupId>
 <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
 <groupId>org.springframework.boot</groupId>
 <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
 <groupId>org.springframework.boot</groupId>
 <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

Chúng ta định nghĩa một lớp controller chứa một hành động (action) điều hướng đến trang chính và một endpoint REST. Vì đây là một lớp `@Controller` Spring MVC thông thường, chúng ta phải khai báo tường minh annotation `@ResponseBody` tại endpoint. Đoạn mã dưới đây mô tả chi tiết lớp controller này.

**Mã nguồn 10.1 Định nghĩa lớp controller**

```java
@Controller
public class MainController {
 private Logger logger =
 Logger.getLogger(MainController.class.getName());
 @GetMapping("/")
 public String main() {
 return "main.html";
 }
 @PostMapping("/test")
 @ResponseBody
 public String test() {
 logger.info("Test method called");
 return "HELLO";
 }
}
```

Tiếp theo, chúng ta cần xây dựng một lớp cấu hình. Trong đó, chúng ta sẽ tạm thời vô hiệu hóa cơ chế bảo mật CSRF nhằm tối giản hóa ví dụ, giúp bạn tập trung hoàn toàn vào cơ chế CORS. Đồng thời, chúng ta cũng cho phép mọi yêu cầu chưa qua xác thực (unauthenticated) được phép truy cập vào tất cả các endpoint. Lớp cấu hình này được định nghĩa như sau.

**Mã nguồn 10.2 Định nghĩa lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.csrf(
  c -> c.disable()
 );
 http.authorizeHttpRequests(
  c -> c.anyRequest().permitAll()
 );

 return http.build();
 }
}
```

Đương nhiên, chúng ta cũng cần tạo tệp `main.html` trong thư mục `resources/templates` của dự án. Tệp này chứa mã JavaScript để gọi đến endpoint `/test`. Để mô phỏng một cuộc gọi liên nguồn, chúng ta sẽ truy cập trang web này trên trình duyệt thông qua tên miền `localhost`. Trong khi đó, đoạn mã JavaScript bên dưới lại thực hiện cuộc gọi API bằng địa chỉ IP `127.0.0.1`. Dù `localhost` và `127.0.0.1` cùng trỏ về một máy chủ vật lý, trình duyệt vẫn nhận diện chúng là hai chuỗi ký tự khác nhau và coi chúng là hai tên miền độc lập. Tệp `main.html` được cấu trúc như sau.

**Mã nguồn 10.3 Trang main.html**

```html
<!DOCTYPE HTML>
<html lang="en">
 <head>
 <script>
 const http = new XMLHttpRequest();
 const url='http://127.0.0.1:8080/test';
 http.open("POST", url);
 http.send();
 http.onreadystatechange = (e) => {
 document
 .getElementById("output")
 .innerHTML = http.responseText;
 }
 </script>
 </head>
 <body>
 <div id="output"></div>
 </body>
</html>
```

Khi chạy ứng dụng và truy cập vào địa chỉ `localhost:8080` trên trình duyệt, bạn sẽ thấy trang web hoàn toàn trống trơn. Lẽ ra trang web phải hiển thị chữ `HELLO`, vốn là kết quả trả về từ endpoint `/test`. Tuy nhiên, khi mở công cụ nhà phát triển (console) của trình duyệt, bạn sẽ thấy một thông báo lỗi phát sinh từ cuộc gọi JavaScript với nội dung như sau:

```text
Access to XMLHttpRequest at 'http://127.0.0.1:8080/test' from origin 'http://localhost […]
```

Thông báo lỗi này cho biết phản hồi đã bị từ chối do thiếu tiêu đề HTTP `Access-Control-Allow-Origin`. Điều này hoàn toàn dễ hiểu bởi chúng ta chưa hề thiết lập bất kỳ cấu hình CORS nào trong ứng dụng Spring Boot, và theo mặc định, hệ thống sẽ không tự động thêm các tiêu đề CORS vào phản hồi. Do đó, việc trình duyệt ngăn chặn hiển thị kết quả là hoàn toàn chính xác. Tuy nhiên, tôi muốn bạn chú ý một chi tiết quan trọng: trong console của ứng dụng, dòng nhật ký (log) chứng minh rằng phương thức của chúng ta thực tế đã được thực thi. Đoạn mã dưới đây hiển thị log xuất hiện trong console của ứng dụng:

```text
INFO 25020 --- [nio-8080-exec-2] c.l.s.controllers.MainController : Test method called […]
```

Khía cạnh này cực kỳ quan trọng! Tôi đã gặp rất nhiều nhà phát triển lầm tưởng CORS là một rào cản hạn chế tương tự như cơ chế phân quyền (authorization) hay chống giả mạo yêu cầu chéo trang (CSRF). Thực tế hoàn toàn ngược lại: CORS được sinh ra để nới lỏng các ràng buộc bảo mật nghiêm ngặt của trình duyệt đối với các cuộc gọi liên miền. Thậm chí, ngay cả khi các chính sách CORS bị vi phạm, trong some tình huống, endpoint phía backend vẫn thực sự được thực thi. Tuy nhiên, hành vi này không phải lúc nào cũng giống nhau. Đôi khi, trình duyệt sẽ chủ động gửi một yêu cầu thử nghiệm bằng phương thức HTTP OPTIONS trước để thăm dò xem máy chủ có chấp nhận yêu cầu thực tế hay không. Cuộc gọi thử nghiệm này được gọi là yêu cầu preflight (preflight request). Nếu yêu cầu preflight này bị từ chối, trình duyệt sẽ dừng lại và không gửi yêu cầu thực tế đi nữa.

Việc khởi tạo yêu cầu preflight và quyết định có gửi nó đi hay không hoàn toàn do trình duyệt tự động xử lý. Bạn không cần phải viết mã để thực hiện logic này. Dẫu vậy, việc thấu hiểu cơ chế này là rất quan trọng để bạn không phải ngỡ ngàng khi thấy các cuộc gọi liên nguồn vẫn tiếp cận được backend, ngay cả khi bạn chưa hề cấu hình bất kỳ chính sách CORS nào cho các tên miền tương ứng. Hiện tượng này thường xảy ra khi bạn vận hành các ứng dụng client-side xây dựng bằng Angular hoặc ReactJS. Trình duyệt sẽ bỏ qua bước gửi yêu cầu preflight nếu yêu cầu thực tế sử dụng phương thức GET, POST hoặc OPTIONS và chỉ chứa các tiêu đề cơ bản (được định nghĩa chi tiết trong tài liệu đặc tả chính thức tại `https://fetch.spec.whatwg.org/#http-cors-protocol`).

Trong ví dụ trên, trình duyệt vẫn gửi yêu cầu và máy chủ vẫn xử lý, nhưng trình duyệt sẽ từ chối hiển thị dữ liệu phản hồi vì nguồn gốc không nằm trong danh sách được phép (như mô tả trong Hình 10.1 và 10.2). Suy cho cùng, CORS là một cơ chế bảo vệ ở phía trình duyệt chứ không phải là giải pháp bảo mật trực tiếp cho các endpoint. Vai trò duy nhất của nó là đảm bảo rằng chỉ những tên miền nguồn được bạn cấp phép mới có thể thực hiện thành công các yêu cầu API từ các trang web chạy trên trình duyệt.

## 10.2 Áp dụng các chính sách CORS bằng annotation @CrossOrigin

Phần này sẽ hướng dẫn bạn cách cấu hình CORS để chấp nhận các yêu cầu từ các tên miền khác nhau thông qua annotation `@CrossOrigin`. Bạn có thể khai báo `@CrossOrigin` trực tiếp ngay trên phương thức định nghĩa endpoint, đồng thời chỉ định rõ các nguồn và phương thức HTTP được phép truy cập. Như bạn sẽ thấy dưới đây, ưu điểm lớn nhất của việc sử dụng `@CrossOrigin` là khả năng tùy biến cấu hình CORS linh hoạt cho từng endpoint riêng biệt.

Chúng ta sẽ tiếp tục sử dụng ứng dụng đã xây dựng ở phần 10.1 để minh họa cách thức hoạt động của `@CrossOrigin`. Để cho phép cuộc gọi liên nguồn thực hiện thành công, thay đổi duy nhất bạn cần thực hiện là khai báo thêm annotation `@CrossOrigin` phía trên phương thức `test()` trong lớp controller. Đoạn mã dưới đây hướng dẫn cách cấu hình để chấp nhận yêu cầu từ localhost.

**Mã nguồn 10.4 Cấu hình cho phép truy cập từ localhost**

```java
@PostMapping("/test")
@ResponseBody
@CrossOrigin("http://localhost:8080")
public String test() {
 logger.info("Test method called");
 return "HELLO";
}
```

Giờ đây, bạn có thể khởi động lại và kiểm tra ứng dụng. Trang web lúc này sẽ hiển thị chính xác chuỗi ký tự nhận về từ endpoint `/test`: `HELLO`.

Tham số `value` của `@CrossOrigin` chấp nhận một mảng các giá trị, cho phép bạn định nghĩa nhiều nguồn khác nhau; ví dụ: `@CrossOrigin({"example.com", "example.org"})`. Ngoài ra, bạn cũng có thể giới hạn các tiêu đề và phương thức HTTP được phép thông qua các thuộc tính tương ứng là `allowedHeaders` và `methods` của annotation. Bạn có thể sử dụng ký tự đại diện dấu sao (`*`) để cho phép tất cả các nguồn hoặc tất cả các tiêu đề. Tuy nhiên, tôi đặc biệt khuyên bạn nên cẩn trọng khi áp dụng cấu hình này. Giải pháp tối ưu luôn là khoanh vùng và chỉ định rõ ràng các nguồn cũng như tiêu đề được phép, tránh việc mở rộng cửa cho bất kỳ tên miền lạ nào có thể chạy mã truy cập vào tài nguyên của hệ thống.

Việc cho phép tất cả các nguồn gốc sẽ khiến ứng dụng của bạn dễ bị tổn thương trước các cuộc tấn công chéo trang (XSS - Cross-Site Scripting), và về lâu dài có thể dẫn đến các cuộc tấn công từ chối dịch vụ phân tán (DDoS). Cá nhân tôi luôn tránh cấu hình cho phép tất cả các nguồn (dùng ký tự `*`), ngay cả trong môi trường kiểm thử (test). Trong thực tế, nhiều ứng dụng vô tình được vận hành trên các hệ thống cơ sở hạ tầng cấu hình sai, dùng chung trung tâm dữ liệu giữa môi trường kiểm thử và môi trường thực tế (production). Vì vậy, như đã thảo luận ở Chương 1, cách tiếp cận khôn ngoan nhất là triển khai độc lập các lớp bảo mật, tuyệt đối không được chủ quan cho rằng ứng dụng an toàn chỉ vì nghĩ hạ tầng mạng đã ngăn chặn được các mối đe dọa.

Điểm cộng của việc sử dụng `@CrossOrigin` là tính trực quan, giúp các nhà phát triển dễ dàng theo dõi các quy tắc bảo mật ngay tại nơi định nghĩa endpoint. Tuy nhiên, điểm hạn chế của nó là dễ gây ra tình trạng trùng lặp mã nguồn khi ứng dụng phình to. Bên cạnh đó, phương pháp này cũng tiềm ẩn rủi ro khi lập trình viên có thể vô ý bỏ quên việc khai báo annotation này trên các endpoint mới được phát triển. Trong phần 10.3, chúng ta sẽ cùng nghiên cứu giải pháp quản lý cấu hình CORS tập trung ngay trong lớp cấu hình của ứng dụng.

## 10.3 Áp dụng CORS bằng CorsConfigurer

Mặc dù việc sử dụng `@CrossOrigin` khá đơn giản và trực quan như đã trình bày trong phần 10.2, nhưng trong phần lớn các dự án thực tế, bạn sẽ muốn quản lý tất cả cấu hình CORS tập trung tại một nơi duy nhất. Trong phần này, chúng ta sẽ cải tiến ví dụ trước để thiết lập cấu hình CORS tập trung trong lớp cấu hình thông qua một đối tượng `Customizer`. Đoạn mã dưới đây minh họa các chỉnh sửa cần thiết trong lớp cấu hình nhằm thiết lập danh sách các nguồn được phép truy cập.

**Mã nguồn 10.5 Định nghĩa cấu hình CORS tập trung trong lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
 @Bean
 public SecurityFilterChain securityFilterChain(HttpSecurity http)
 throws Exception {

 http.cors(c -> {
 CorsConfigurationSource source = request -> {
  CorsConfiguration config = new CorsConfiguration();
  config.setAllowedOrigins(
  List.of("example.com", "example.org"));
  config.setAllowedMethods(
  List.of("GET", "POST", "PUT", "DELETE"));
  config.setAllowedHeaders(List.of("*"));
  return config;
 };
 c.configurationSource(source);
 });
 http.csrf(
  c -> c.disable()
 );
 http.authorizeHttpRequests(
  c -> c.anyRequest().permitAll()
 );

 return http.build();
 }
}
```

Phương thức `cors()` được gọi từ đối tượng `HttpSecurity` sẽ nhận một đối tượng `Customizer<CorsConfigurer>` làm đối số đầu vào. Từ đối tượng này, chúng ta thiết lập một `CorsConfigurationSource` để trả về cấu hình `CorsConfiguration` tương ứng với mỗi yêu cầu HTTP. `CorsConfiguration` chính là nơi chúng ta khai báo cụ thể các nguồn, phương thức và tiêu đề được phép truy cập. Lưu ý rằng khi áp dụng phương pháp này, bạn bắt buộc phải chỉ định tối thiểu cả nguồn và phương thức HTTP được phép. Nếu bạn chỉ cấu hình nguồn mà bỏ qua phương thức, ứng dụng sẽ từ chối mọi yêu cầu, bởi theo mặc định, một đối tượng `CorsConfiguration` trống sẽ không cho phép bất kỳ phương thức HTTP nào hoạt động.

Trong ví dụ này, để đơn giản hóa quá trình giải thích, tôi đã triển khai `CorsConfigurationSource` trực tiếp dưới dạng biểu thức lambda ngay trong bean `SecurityFilterChain`. Tuy nhiên, trong các dự án thực tế, tôi đặc biệt khuyên bạn nên tách biệt phần mã nguồn này ra một lớp riêng biệt. Khi ứng dụng phát triển, các quy tắc cấu hình CORS sẽ trở nên phức tạp và dài hơn rất nhiều, việc gộp chung sẽ làm lớp cấu hình chính trở nên rối rắm và khó duy trì.

## Tóm tắt

- CORS (Cross-Origin Resource Sharing) đề cập đến tình huống một ứng dụng web được lưu trữ trên một tên miền cụ thể tìm cách truy cập vào tài nguyên từ một tên miền khác.

- Theo mặc định, trình duyệt không cho phép các yêu cầu liên nguồn diễn ra. Do đó, cấu hình CORS cho phép bạn cấp quyền để một phần tài nguyên của mình được gọi từ các tên miền khác trong một ứng dụng chạy trên trình duyệt.

- Bạn có thể cấu hình CORS độc lập cho từng endpoint bằng annotation `@CrossOrigin` hoặc quản lý tập trung trong lớp cấu hình thông qua phương thức `cors()` của đối tượng `HttpSecurity`.
