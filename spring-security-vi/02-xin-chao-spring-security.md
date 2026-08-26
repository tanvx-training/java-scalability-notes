# Chương 2: Xin chào, Spring Security

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

> **Nội dung chính của chương này**
>
> - Khởi tạo dự án đầu tiên tích hợp Spring Security
>
> - Thiết kế các tính năng đơn giản bằng cách sử dụng những thành phần cơ bản phục vụ cho quá trình xác thực và phân quyền
>
> - Tìm hiểu khái niệm cốt lõi và cách áp dụng vào một dự án cụ thể
>
> - Áp dụng các giao ước (contract) cơ bản và nắm được mối tương quan giữa chúng
>
> - Tự viết các lớp triển khai tùy chỉnh cho các nhiệm vụ chính
>
> - Ghi đè cấu hình mặc định của Spring Boot dành cho Spring Security

Spring Boot ra đời như một bước tiến hóa trong quá trình phát triển ứng dụng với Spring Framework. Thay vì bắt buộc lập trình viên phải tự tay thiết lập mọi cấu hình, Spring Boot cung cấp sẵn các cấu hình mặc định, cho phép bạn chỉ cần ghi đè những phần không tương thích với cách triển khai của mình. Cách tiếp cận này còn được gọi là cấu hình theo quy ước (convention-over-configuration) [4]. Giờ đây, Spring Boot đã không còn là một khái niệm xa lạ, và chúng ta đang được trải nghiệm việc xây dựng ứng dụng trên phiên bản thứ ba của nó.

Trước khi có Spring Boot, các nhà phát triển thường phải viết đi viết lại hàng chục dòng mã cấu hình cho mỗi ứng dụng cần xây dựng. Hạn chế này vốn ít bị phát hiện hơn trong quá khứ khi hầu hết hệ thống đều được phát triển theo kiến trúc nguyên khối (monolith). Với kiến trúc nguyên khối, bạn chỉ cần thiết lập cấu hình một lần duy nhất lúc khởi đầu và hiếm khi phải động đến chúng sau đó. Tuy nhiên, cùng với sự phát triển của các kiến trúc phần mềm hướng dịch vụ, chúng ta bắt đầu thấm thía nỗi đau từ những đoạn mã lặp lại rườm rà (boilerplate code) khi phải cấu hình cho từng dịch vụ riêng lẻ. Nếu cảm thấy tò mò, bạn có thể tham khảo Chương 3 trong cuốn Spring in Practice của Willie Wheeler và Joshua White (Manning, 2013). Chương này mô tả cách xây dựng một ứng dụng web với Spring 3, qua đó bạn sẽ thấy mình từng phải viết nhiều cấu hình đến mức nào chỉ để chạy một ứng dụng web một trang (single-page) nhỏ gọn. Bạn có thể truy cập chương sách này tại http://mng.bz/46la.

Chính vì lý do đó, khi các ứng dụng hiện đại phát triển—đặc biệt là các hệ thống microservices—Spring Boot ngày càng trở nên phổ biến. Nó cung cấp khả năng tự động cấu hình (autoconfiguration) cho dự án và rút ngắn đáng kể thời gian thiết lập ban đầu. Có thể nói, Spring Boot mang trong mình triết lý phát triển phần mềm cực kỳ phù hợp với thời đại ngày nay.

Trong chương này, chúng ta sẽ bắt đầu với ứng dụng đầu tiên sử dụng Spring Security. Đối với các ứng dụng phát triển trên nền tảng Spring Framework, Spring Security là một lựa chọn tuyệt vời để triển khai bảo mật ở cấp độ ứng dụng. Chúng ta sẽ sử dụng Spring Boot và thảo luận về các thiết lập mặc định được cấu hình theo quy ước, đồng thời giới thiệu sơ lược về cách ghi đè các thiết lập này. Việc nghiên cứu các cấu hình mặc định là bước nhập môn tuyệt vời để làm quen với Spring Security, đồng thời giúp minh họa rõ nét khái niệm xác thực.

Sau khi khởi động dự án đầu tiên, chúng ta sẽ thảo luận chi tiết hơn về các phương thức xác thực khác nhau. Trong các chương từ 3 đến 6, chúng ta sẽ tiếp tục đi sâu vào các cấu hình cụ thể cho từng nhiệm vụ riêng biệt mà bạn sẽ bắt gặp trong ví dụ đầu tiên này. Bạn cũng sẽ được tiếp cận nhiều cách thức áp dụng các cấu hình đó tùy thuộc vào phong cách kiến trúc của hệ thống. Các bước chúng ta sẽ thực hiện trong chương này bao gồm:

1. Khởi tạo một dự án chỉ với các dependency của Spring Security và Web để quan sát hành vi của hệ thống khi không thêm bất kỳ cấu hình nào. Bằng cách này, bạn sẽ hiểu được những gì cấu hình mặc định cung cấp cho quá trình xác thực và phân quyền.

2. Chỉnh sửa dự án để bổ sung tính năng quản lý người dùng bằng cách ghi đè cấu hình mặc định, qua đó định nghĩa tài khoản và mật khẩu tùy chỉnh.

3. Sau khi quan sát thấy ứng dụng mặc định yêu cầu xác thực cho tất cả các endpoint, chúng ta sẽ học cách tùy biến hành vi này.

4. Áp dụng các phong cách cấu hình khác nhau cho cùng một thiết lập để hiểu rõ các thực hành tốt nhất (best practices).

## 2.1 Khởi động dự án đầu tiên

Hãy cùng khởi tạo dự án đầu tiên để làm ví dụ thực hành. Dự án này là một ứng dụng web nhỏ gọn cung cấp một endpoint REST. Bạn sẽ thấy Spring Security bảo mật endpoint này bằng phương thức xác thực HTTP Basic một cách dễ dàng như thế nào mà không cần tốn nhiều công sức. HTTP Basic là phương thức mà ứng dụng web dùng để xác thực người dùng thông qua một tập hợp thông tin đăng nhập (tên đăng nhập và mật khẩu) nhận được trong header của yêu cầu HTTP.

> **LƯU Ý** Với cấu hình mặc định, ứng dụng được thiết lập sẵn hai cơ chế xác thực khác nhau: HTTP Basic và Đăng nhập qua Biểu mẫu (Form Login). Tuy nhiên, tôi muốn hướng dẫn ví dụ này theo từng bước và sẽ thảo luận về Form Login trong các chương sau. Nếu thử truy cập URL bằng trình duyệt, bạn sẽ thấy ứng dụng hiển thị một giao diện biểu mẫu đăng nhập khá đẹp mắt để xác thực người dùng, thay vì hiện ra hộp thoại HTTP Basic đơn điệu. Tôi giải thích điều này để bạn không bị bối rối nếu có ý định thử nghiệm trên trình duyệt, nhưng trọng tâm của chúng ta trong phần này sẽ là cơ chế HTTP Basic.

Chỉ cần khởi tạo dự án và thêm đúng các dependency cần thiết, Spring Boot sẽ tự động áp dụng các cấu hình mặc định, bao gồm cả việc tạo sẵn một tài khoản và mật khẩu khi bạn khởi chạy ứng dụng.

> **LƯU Ý** Bạn có nhiều cách khác nhau để tạo một dự án Spring Boot. Một số môi trường phát triển (IDE) hỗ trợ khởi tạo dự án trực tiếp. Để biết thêm chi tiết, tôi khuyên bạn nên đọc cuốn Spring Boot: Up and Running của Mark Heckler (OʼReilly Media, 2021), cuốn Spring Boot in Practice của Somnath Musib (Manning, 2022) hoặc cuốn Spring Start Here (Manning, 2021)—một cuốn sách khác do chính tôi biên soạn.

Các ví dụ trong cuốn sách này đều tham chiếu đến mã nguồn đi kèm. Trong mỗi ví dụ, tôi sẽ chỉ rõ các dependency cần thêm vào tệp `pom.xml` của bạn. Bạn nên tải về các dự án mẫu và mã nguồn đi kèm sách tại địa chỉ https://www.manning.com/downloads/2105. Những dự án mẫu này sẽ là cứu cánh đắc lực nếu bạn gặp trục trặc trong quá trình thực hành, đồng thời giúp bạn đối chiếu để xác thực giải pháp cuối cùng của mình.

> **LƯU Ý** Các ví dụ trong sách không phụ thuộc vào công cụ đóng gói (build tool) mà bạn chọn. Bạn có thể sử dụng Maven hoặc Gradle đều được. Để đảm bảo tính nhất quán, tôi đã xây dựng tất cả các ví dụ bằng Maven.

Dự án đầu tiên này cũng là dự án có quy mô tối giản nhất. Đó là một ứng dụng đơn giản cung cấp một endpoint REST để bạn có thể gọi và nhận phản hồi. Dự án này hoàn toàn đủ để bạn chập chững những bước đầu tiên trong việc phát triển ứng dụng tích hợp Spring Security và Spring Boot. Nó sẽ trình bày những nét cơ bản nhất trong kiến trúc của Spring Security phục vụ cho việc xác thực và phân quyền.

```bash
curl -u user:pass http://localhost:8080/hello
```

Phản hồi:

```text
200 OK Hello!
```

Chúng ta sẽ bắt đầu làm quen với Spring Security bằng cách tạo một dự án rỗng và đặt tên là `ssia-ch2-ex1` (bạn cũng sẽ tìm thấy ví dụ này với tên gọi tương tự trong thư mục mã nguồn đi kèm). Các dependency duy nhất cần khai báo cho dự án đầu tiên là `spring-boot-starter-web` và `spring-boot-starter-security`, như được trình bày trong Danh sách mã nguồn 2.1. Sau khi tạo xong dự án, hãy đảm bảo rằng bạn đã thêm các dependency này vào tệp `pom.xml`. Mục đích chính của việc thực hành trên dự án này là để quan sát hành vi của một ứng dụng được cấu hình mặc định với Spring Security, từ đó hiểu rõ những thành phần nào nằm trong cấu hình mặc định này và vai trò của chúng ra sao.

**Danh sách mã nguồn 2.1 Các dependency của Spring Security cho ứng dụng web đầu tiên**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

Lúc này chúng ta đã có thể khởi chạy ứng dụng ngay lập tức. Spring Boot sẽ tự động thiết lập cấu hình mặc định cho Spring context dựa trên các dependency đã khai báo. Tuy nhiên, chúng ta sẽ chẳng học hỏi được gì nhiều về bảo mật nếu không có ít nhất một endpoint được bảo vệ. Hãy cùng tạo một endpoint đơn giản và gọi thử xem điều gì sẽ xảy ra. Để làm việc này, chúng ta thêm một lớp (class) vào dự án rỗng và đặt tên là `HelloController`. Lớp này sẽ được đặt trong một package tên là `controllers` nằm bên trong không gian tên (namespace) chính của dự án Spring Boot.

> **LƯU Ý** Theo mặc định, Spring Boot chỉ quét tìm các thành phần (component) trong package chứa lớp được đánh dấu bằng annotation `@SpringBootApplication` (và các package con của nó). Nếu bạn đánh dấu các lớp bằng bất kỳ annotation thành phần nào của Spring bên ngoài package chính này, bạn phải khai báo rõ vị trí của chúng bằng cách sử dụng annotation `@ComponentScan`.

Trong danh sách mã nguồn dưới đây, lớp `HelloController` sẽ định nghĩa một REST controller và một REST endpoint cho ví dụ của chúng ta.

**Danh sách mã nguồn 2.2 Lớp HelloController và một REST endpoint**

```java
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }
}
```

Annotation `@RestController` dùng để đăng ký bean vào context và báo cho Spring biết rằng ứng dụng sẽ sử dụng thực thể (instance) này làm một web controller. Ngoài ra, annotation này cũng chỉ định ứng dụng phải thiết lập phần thân phản hồi (response body) của phản hồi HTTP bằng chính giá trị trả về từ phương thức. Annotation `@GetMapping` sẽ ánh xạ đường dẫn `/hello` tới phương thức được triển khai thông qua một yêu cầu GET. Khi bạn khởi chạy ứng dụng, bên cạnh các dòng thông tin khác hiển thị trên màn hình console, bạn sẽ thấy một dòng trông như thế này:

```text
Using generated security password: 93a01cf0-794b-4b98-86ef-54860f36f7f3
```

Mỗi khi khởi chạy ứng dụng, hệ thống sẽ tạo ra một mật khẩu mới ngẫu nhiên và in ra màn hình console như dòng mã trên. Bạn bắt buộc phải dùng mật khẩu này để gọi bất kỳ endpoint nào của ứng dụng thông qua phương thức xác thực HTTP Basic. Trước tiên, hãy thử gọi endpoint mà không truyền header `Authorization`:

```bash
curl http://localhost:8080/hello
```

> **LƯU Ý** Trong cuốn sách này, chúng ta sẽ sử dụng cURL để gọi các endpoint trong tất cả các ví dụ. Tôi nhận thấy cURL là giải pháp dễ đọc và rõ ràng nhất. Tuy nhiên, nếu muốn, bạn hoàn toàn có thể sử dụng bất kỳ công cụ nào khác theo sở thích cá nhân. Chẳng hạn, nếu bạn ưa chuộng một giao diện đồ họa trực quan và dễ thao tác hơn, Postman, Insomnia hoặc Bruno sẽ là những lựa chọn tuyệt vời. Nếu hệ điều hành bạn đang dùng chưa cài đặt sẵn các công cụ này, bạn sẽ cần tự cài đặt chúng.

Và phản hồi nhận được cho lượt gọi này là:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "path": "/hello"
}
```

Mã trạng thái phản hồi trả về là HTTP 401 Unauthorized. Kết quả này hoàn toàn nằm trong dự tính vì chúng ta chưa cung cấp thông tin đăng nhập hợp lệ để xác thực. Theo mặc định, Spring Security sẽ chờ đợi tên đăng nhập mặc định là `user` đi kèm với mật khẩu được cấp (trong trường hợp của tôi là chuỗi bắt đầu bằng `93a01`). Hãy thử lại một lần nữa, nhưng lần này với thông tin xác thực chính xác:

```bash
curl -u user:93a01cf0-794b-4b98-86ef-54860f36f7f3 http://localhost:8080/hello
```

Phản hồi:

```text
Hello!
```

> **LƯU Ý** Mã trạng thái HTTP 401 Unauthorized đôi khi hơi gây mơ hồ. Thông thường, nó được dùng để biểu thị việc xác thực thất bại (failed authentication) chứ không phải là lỗi phân quyền (authorization). Các nhà phát triển thường thiết kế mã này cho các trường hợp thiếu thông tin đăng nhập hoặc thông tin đăng nhập bị sai. Còn đối với trường hợp phân quyền thất bại, chúng ta thường sử dụng mã trạng thái 403 Forbidden. Về mặt tổng quan, mã HTTP 403 có nghĩa là máy chủ đã xác định được danh tính người gửi yêu cầu, nhưng người đó lại không có đủ đặc quyền cần thiết để thực hiện hành động đang yêu cầu.

Sau khi truyền đi thông tin xác thực chính xác, bạn sẽ thấy phần thân phản hồi hiển thị đúng những gì mà phương thức trong `HelloController` đã định nghĩa trước đó.

> **Gọi endpoint bằng phương thức xác thực HTTP Basic**
>
> Với cURL, bạn có thể truyền tên đăng nhập và mật khẩu phục vụ xác thực HTTP Basic bằng cờ `-u`. Phía sau hậu trường, cURL sẽ tiến hành mã hóa chuỗi `<username>:<password>` sang chuẩn Base64, sau đó gửi chuỗi này làm giá trị của header `Authorization` kèm theo tiền tố `Basic`. Khi làm việc với cURL, việc sử dụng cờ `-u` sẽ tiện lợi hơn nhiều. Tuy nhiên, việc hiểu rõ cấu trúc của một yêu cầu thực tế cũng vô cùng quan trọng. Vì vậy, chúng ta hãy thử tự tay tạo header `Authorization` xem sao. Bước đầu tiên, hãy lấy chuỗi dạng `<username>:<password>` và mã hóa nó sang Base64. Để gửi yêu cầu thành công, chúng ta cần biết cách tạo ra giá trị chính xác cho header `Authorization`. Bạn có thể thực hiện việc này bằng cách sử dụng công cụ Base64 có sẵn trong console Linux hoặc Git Bash (tham số `-n` nhằm đảm bảo không có ký tự xuống dòng ở cuối chuỗi):
>
> ```bash
> echo -n user:93a01cf0-794b-4b98-86ef-54860f36f7f3 | base64
> ```
>
> Chạy lệnh này sẽ trả về chuỗi đã được mã hóa Base64 như sau:
>
> ```text
> dXNlcjo5M2EwMWNmMC03OTRiLTRiOTgtODZlZi01NDg2MGYzNmY3ZjM=
> ```
>
> Bây giờ, bạn có thể sử dụng giá trị mã hóa Base64 này làm giá trị cho header `Authorization` của yêu cầu gửi đi. Yêu cầu này sẽ cho ra kết quả hoàn toàn tương tự như khi chúng ta sử dụng tùy chọn `-u`:
>
> ```bash
> curl -H "Authorization: Basic dXNlcjo5M2EwMWNmMC03OTRiLTRiOTgtODZlZi01NDg2MGYzNmY3Zj
> ```
>
> Kết quả của cuộc gọi là:
>
> ```text
> Hello!
> ```

Đối với một dự án cấu hình mặc định, chúng ta không có nhiều thiết lập bảo mật đáng ch […]

Với việc ví dụ đầu tiên đã chạy thành công, ít nhất chúng ta đã xác nhận được Spring S […]

## 2.2 Bức tranh tổng thể về thiết kế lớp trong Spring Security

Trong phần này, chúng ta sẽ thảo luận về những "diễn viên chính" trong kiến trúc tổng […]

Trong phần 2.1, bạn đã thấy một số logic xác thực và phân quyền được thực thi. Chúng t […]

Sơ đồ 2.2 khái quát bức tranh tổng thể về các thành phần cốt lõi trong kiến trúc Sprin […]

Các thành phần trong quy trình xác thực bao gồm:

1.  Bộ lọc xác thực (authentication filter) ủy quyền xử lý yêu cầu xác thực cho bộ quả […]
2.  Bộ quản lý xác thực sử dụng bộ cung cấp xác thực (authentication provider) để xử l […]
3.  Bộ cung cấp xác thực chịu trách nhiệm triển khai logic xác thực thực tế.
4.  Dịch vụ thông tin người dùng (user details service) đảm nhận trách nhiệm quản lý t […]
5.  Bộ mã hóa mật khẩu (password encoder) thực hiện nhiệm vụ quản lý mật khẩu, được bộ […]
6.  Ngữ cảnh bảo mật (security context) lưu trữ dữ liệu xác thực sau khi quy trình xác […]

Trong các phần tiếp theo, tôi sẽ thảo luận về các bean được tự động cấu hình sau:

*   `UserDetailsService`
*   `PasswordEncoder`

Trong Spring Security, một đối tượng triển khai giao diện (interface) `UserDetailsServ […]

Bản triển khai mặc định này chỉ đóng vai trò như một bản thử nghiệm khái niệm (proof o […]

Tiếp theo, chúng có `PasswordEncoder`. Thành phần `PasswordEncoder` này đảm nhận hai n […]

*   Mã hóa mật khẩu (thông thường bằng một thuật toán mã hóa hoặc băm dữ liệu)
*   Xác minh xem mật khẩu truyền vào có khớp với bản mã hóa đã lưu trữ hay không

Mặc dù vai trò của nó có vẻ kém nổi bật hơn so với đối tượng `UserDetailsService`, như […]

Spring Boot cũng tự chọn một phương thức xác thực khi thiết lập các cấu hình mặc định: […]

> **LƯU Ý** Phương thức xác thực HTTP Basic hoàn toàn không đảm bảo tính bảo mật cho t […]

Thành phần `AuthenticationProvider` là nơi định nghĩa logic xác thực, đồng thời ủy thá […]

> ### HTTP và HTTPS
>
> Bạn có thể nhận thấy rằng trong các ví dụ đã trình bày, tôi chỉ sử dụng giao thức HT […]
>
> Có nhiều mô hình khác nhau để cấu hình HTTPS trong một hệ thống. Trong một số trường […]
>
> Dù cấu hình theo mô hình nào, bạn cũng cần có một chứng chỉ được ký bởi một tổ chức […]
>
> ```bash
> openssl req -newkey rsa:2048 -x509 -keyout key.pem -out cert.pem -days 365
> ```
>
> Sau khi chạy lệnh `openssl` trong cửa sổ dòng lệnh, hệ thống sẽ yêu cầu bạn nhập mật […]
>
> ```bash
> openssl pkcs12 -export -in cert.pem -inkey key.pem -out certificate.p12 -name "certi […]
> ```
>
> Lệnh thứ hai này sẽ nhận đầu vào là hai tệp vừa được tạo ra từ lệnh trước đó và xuất […]
>
> Lưu ý rằng nếu bạn thực thi các lệnh này trên môi trường Bash của hệ điều hành Windo […]
>
> ```bash
> winpty openssl req -newkey rsa:2048 -x509 -keyout key.pem -out cert.pem -days 365
> winpty openssl pkcs12 -export -in cert.pem -inkey key.pem -out certificate.p12 -name […]
> ```
>
> Cuối cùng, sau khi đã có chứng chỉ tự ký, bạn có thể tiến hành cấu hình HTTPS cho cá […]
>
> ```properties
> server.ssl.key-store-type=PKCS12
> server.ssl.key-store=classpath:certificate.p12
> server.ssl.key-store-password=12345
> ```
>
> Mật khẩu (trong ví dụ của tôi là 12345) là mật khẩu đã được yêu cầu nhập trong quá t […]
>
> ```java
> @RestController
> public class HelloController {
>     @GetMapping("/hello")
>     public String hello() {
>         return "Hello!";
>     }
> }
> ```
>
> Khi làm việc với chứng chỉ tự ký, bạn cần cấu hình công cụ gọi endpoint sao cho bỏ q […]
>
> ```bash
> curl -k -u user:93a01cf0-794b-4b98-86ef-54860f36f7f3 https://localhost:8080/hello
> ```
>
> Phản hồi cho cuộc gọi là:
>
> ```text
> Hello!
> ```
>
> Hãy nhớ rằng ngay cả khi bạn đã sử dụng HTTPS, việc truyền thông giữa các thành phần […]

## 2.3 Ghi đè cấu hình mặc định

Giờ đây, khi đã nắm rõ các cấu hình mặc định của dự án đầu tiên, đã đến lúc chúng ta t […]

Trong một số trường hợp, các nhà phát triển lựa chọn khai báo các bean trong Spring co […]

Trong phần này, bạn sẽ học cách cấu hình các thành phần `UserDetailsService` và `Passw […]

### 2.3.1 Tùy biến trình quản lý thông tin chi tiết người dùng

Thành phần đầu tiên chúng ta đề cập trong chương này là `UserDetailsService`. Như bạn […]

> **LƯU Ý** Trong ngôn ngữ Java, các interface đóng vai trò định nghĩa các ràng buộc ( […]

Để minh họa cách ghi đè thành phần này bằng một bản triển khai tự chọn, chúng ta sẽ ti […]

Cụ thể, chúng ta sẽ sử dụng bản triển khai `InMemoryUserDetailsManager`. Mặc dù lớp nà […]

> **LƯU Ý** Bản triển khai `InMemoryUserDetailsManager` không được thiết kế cho các ứn […]

Chúng ta bắt đầu bằng việc định nghĩa một lớp cấu hình. Thông thường, các lớp cấu hình […]

#### Danh sách mã nguồn 2.3 Lớp cấu hình cho bean UserDetailsService

```java
@Configuration
public class ProjectConfig {
    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager();
    }
}
```

Chúng ta đánh dấu lớp này bằng annotation `@Configuration`. Annotation `@Bean` sẽ chỉ thị cho Spring thêm thực thể được phương thức này trả về vào Spring context. Nếu chạy mã nguồn chính xác như hiện tại, bạn sẽ không còn thấy mật khẩu tự động tạo hiển thị trên console nữa. Lúc này, ứng dụng đã chuyển sang sử dụng thực thể `UserDetailsService` mà bạn vừa khai báo trong context thay vì thực thể mặc định được tự động cấu hình. Tuy nhiên, song song với đó, bạn cũng sẽ không thể truy cập vào endpoint được nữa vì hai lý do sau:

- Hệ thống chưa có bất kỳ người dùng nào.

- Hệ thống chưa được khai báo `PasswordEncoder`.

Như đã thấy trong sơ đồ 2.2, quá trình xác thực còn phụ thuộc vào cả thành phần `PasswordEncoder`. Chúng ta hãy lần lượt giải quyết từng vấn đề này. Các bước cần thực hiện bao gồm:

1. Khởi tạo ít nhất một người dùng sở hữu thông tin đăng nhập (gồm tên đăng nhập và mật khẩu).

2. Đưa người dùng đó vào diện quản lý của bản triển khai `UserDetailsService` mà chúng ta cấu hình.

3. Định nghĩa một bean có kiểu `PasswordEncoder` để ứng dụng sử dụng trong việc so khớp mật khẩu người dùng truyền vào với mật khẩu được lưu trữ và quản lý bởi `UserDetailsService`.

Trước hết, chúng ta cần khai báo và đưa một bộ thông tin đăng nhập dùng để xác thực vào thực thể `InMemoryUserDetailsManager`. Ở Chương 3, chúng ta sẽ bàn luận sâu hơn về đối tượng người dùng và cách thức quản lý họ. Còn hiện tại, hãy sử dụng một lớp dựng (builder) có sẵn để khởi tạo một đối tượng kiểu `UserDetails`.

> **LƯU Ý** Thỉnh thoảng bạn sẽ thấy tôi sử dụng từ khóa `var` trong mã nguồn. Phiên bản Java 10 đã giới thiệu từ khóa `var` dành riêng cho việc khai báo các biến cục bộ. Mặc dù trong một số trường hợp, việc lạm dụng `var` trong cuốn sách này có thể coi là chưa thực sự tối ưu dưới góc nhìn viết mã sạch (clean code), tuy nhiên điều này giúp cú pháp ngắn gọn hơn, đồng thời ẩn đi kiểu dữ liệu của biến. Cách tiếp cận này giúp bạn tập trung tối đa vào các nội dung cốt lõi của ví dụ đang xét. Chúng ta sẽ làm rõ các kiểu dữ liệu thực tế được ẩn sau từ khóa `var` trong các chương sau, nên bạn chưa cần quá bận tâm về chúng cho đến khi chúng ta phân tích chi tiết.

Khi khởi tạo thực thể, chúng ta bắt buộc phải cung cấp tên đăng nhập, mật khẩu và ít nhất một quyền hạn (authority). Quyền hạn đại diện cho một hành động mà người dùng đó được phép thực hiện trong hệ thống, và bạn có thể sử dụng bất kỳ chuỗi văn bản nào để định nghĩa quyền này. Trong danh sách mã nguồn tiếp theo, tôi đặt tên quyền hạn này là `read`, nhưng vì tạm thời chúng ta chưa dùng tới nó, nên tên gọi cụ thể lúc này chưa thực sự quan trọng.

**Danh sách mã nguồn 2.4 Tạo người dùng bằng lớp dựng User cho UserDetailsService**

```java
@Configuration
public class ProjectConfig {
    @Bean
    UserDetailsService userDetailsService() {
        var user = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();
        return new InMemoryUserDetailsManager(user);
    }
}
```

> **LƯU Ý** Bạn có thể tìm thấy lớp `User` trong package `org.springframework.security.core.userdetails`. Đây là một lớp dựng (builder) được sử dụng để khởi tạo đối tượng đại diện cho người dùng. Thêm vào đó, có một quy ước chung xuyên suốt cuốn sách này: nếu một lớp được sử dụng mà không được trình bày chi tiết cách viết trong danh sách mã nguồn, điều đó có nghĩa là lớp đó đã được Spring Security cung cấp sẵn.

Như được trình bày trong Danh sách mã nguồn 2.4, chúng ta phải truyền vào các giá trị cho tên đăng nhập, mật khẩu và khai báo ít nhất một quyền hạn. Tuy nhiên, chừng đó vẫn chưa đủ để gọi thành công endpoint. Chúng ta cần phải khai báo thêm một `PasswordEncoder` nữa.

Khi sử dụng `UserDetailsService` mặc định, một bean `PasswordEncoder` cũng sẽ tự động được cấu hình theo. Nhưng do chúng ta đã tiến hành ghi đè `UserDetailsService`, chúng ta cũng bắt buộc phải tự khai báo `PasswordEncoder`. Nếu bạn chạy thử ví dụ lúc này, hệ thống sẽ ném ra ngoại lệ (exception) ngay khi bạn gọi tới endpoint. Trong quá trình xác thực, Spring Security nhận thấy nó không biết phải xử lý mật khẩu này theo cách nào và lập tức báo lỗi. Ngoại lệ trả về sẽ tương tự như đoạn mã dưới đây hiển thị trên console của ứng dụng. Phía client sẽ nhận về mã HTTP 401 Unauthorized cùng phần thân phản hồi rỗng:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Kết quả cuộc gọi hiển thị trên console của ứng dụng:

```text
java.lang.IllegalArgumentException: There is no PasswordEncoder mapped for the id "nul […]
    at org.springframework.security.crypto.password.DelegatingPasswordEncoder$Unmapped […]
    at org.springframework.security.crypto.password.DelegatingPasswordEncoder.matches( […]
```

Để giải quyết triệt để lỗi này, chúng ta có thể bổ sung một bean `PasswordEncoder` vào context tương tự như cách đã làm với `UserDetailsService`. Với bean này, chúng ta sẽ sử dụng một bản triển khai có sẵn của giao ước `PasswordEncoder`:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
}
```

> **LƯU Ý** Thực thể `NoOpPasswordEncoder` xử lý mật khẩu hoàn toàn dưới dạng văn bản thuần túy (plain text), không thực hiện bất kỳ hoạt động mã hóa hay băm dữ liệu nào. Khi so khớp, `NoOpPasswordEncoder` chỉ so sánh hai chuỗi ký tự bằng cách gọi phương thức `equals(Object o)` của lớp `String`. Bạn tuyệt đối không nên sử dụng loại `PasswordEncoder` này cho các ứng dụng thực tế trên môi trường production. `NoOpPasswordEncoder` chỉ là một giải pháp tình thế phù hợp cho các ví dụ minh họa khi chúng ta không muốn bị phân tâm bởi các thuật toán băm mật khẩu phức tạp. Do đó, các nhà phát triển lớp này đã đánh dấu nó là `@Deprecated` (không còn khuyến nghị sử dụng), và môi trường phát triển của bạn sẽ hiển thị tên lớp này kèm theo một đường gạch ngang.

Bạn có thể quan sát toàn bộ mã nguồn của lớp cấu hình trong danh sách mã nguồn dưới đây.

**Danh sách mã nguồn 2.5 Định nghĩa đầy đủ của lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
    @Bean
    UserDetailsService userDetailsService() {
        var user = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();
        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Hãy cùng gọi thử endpoint với thông tin người dùng mới có tên đăng nhập là `john` và mật khẩu là `12345`:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Phản hồi:

```text
Hello!
```

> **LƯU Ý** Hiểu rõ tầm quan trọng cốt lõi của kiểm thử đơn vị (unit test) và kiểm thử tích hợp (integration test), có lẽ một số bạn đang tự hỏi tại sao chúng ta không viết các đoạn mã kiểm thử cho những ví dụ này. Trên thực tế, bạn sẽ tìm thấy các mã kiểm thử tích hợp liên quan đến Spring Security đi kèm trong tất cả các dự án mẫu của cuốn sách này. Tuy nhiên, để giúp bạn tập trung tối đa vào các chủ đề cốt lõi của từng chương, tôi đã tách riêng phần thảo luận về kiểm thử tích hợp với Spring Security sang Chương 18.

### 2.3.2 Áp dụng phân quyền ở cấp độ endpoint

Sau khi đã thiết lập cơ chế quản lý người dùng mới như mô tả ở phần 2.3.1, lúc này chúng ta có thể bàn luận về phương thức xác thực và cách cấu hình cho các endpoint. Bạn sẽ được tìm hiểu rất nhiều khía cạnh liên quan đến cấu hình phân quyền từ Chương 7 đến Chương 12. Nhưng trước khi đi vào chi tiết, bạn cần nắm được bức tranh tổng thể. Cách tốt nhất để tiếp cận là thông qua ví dụ đầu tiên này. Với cấu hình mặc định, tất cả các endpoint đều mặc định rằng bạn đã có một người dùng hợp lệ được quản lý bởi ứng dụng. Đồng thời, ứng dụng cũng mặc định sử dụng xác thực HTTP Basic, nhưng bạn có thể ghi đè cấu hình này một cách dễ dàng.

Như bạn sẽ thấy trong các chương tiếp theo, phương thức xác thực HTTP Basic không thực sự phù hợp với phần lớn kiến trúc ứng dụng hiện nay. Đôi khi, chúng ta cần thay đổi nó để tương thích tốt nhất với hệ thống của mình. Tương tự như vậy, không phải mọi endpoint trong ứng dụng đều cần phải bảo mật nghiêm ngặt; và đối với những endpoint cần bảo vệ, chúng ta có thể muốn áp dụng các phương thức xác thực cùng quy tắc phân quyền khác nhau. Để tùy biến cách thức xử lý xác thực và phân quyền, chúng ta cần định nghĩa một bean có kiểu `SecurityFilterChain`. Trong ví dụ này, tôi sẽ tiếp tục thực hiện trên dự án mẫu `ssia-ch2-ex3`.

**Danh sách mã nguồn 2.6 Định nghĩa một bean SecurityFilterChain**

```java
@Configuration
public class ProjectConfig {
    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {
        return http.build();
    }
    // Omitted code
}
```

Sau đó, chúng ta có thể tùy chỉnh cấu hình bằng cách gọi các phương thức khác nhau của đối tượng `HttpSecurity`, như được trình bày trong danh sách mã nguồn tiếp theo.

**Danh sách mã nguồn 2.7 Sử dụng tham số HttpSecurity để thay đổi cấu hình**

```java
@Configuration
public class ProjectConfig {

    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(
            c -> c.anyRequest().authenticated()
        );
        return http.build();
    }
    // Omitted code
}
```

Đoạn mã trong Danh sách mã nguồn 2.7 thiết lập cấu hình phân quyền cho endpoint với hành vi hoàn toàn tương đương cấu hình mặc định. Bạn có thể gọi lại endpoint này một lần nữa để xác nhận xem nó có hoạt động giống với thử nghiệm trước đó ở phần 2.3.1 hay không. Chỉ cần một thay đổi nhỏ, bạn có thể cho phép truy cập tự do vào tất cả các endpoint mà không yêu cầu thông tin đăng nhập. Hãy cùng quan sát cách thực hiện trong danh sách mã nguồn dưới đây.

**Danh sách mã nguồn 2.8 Sử dụng permitAll() để thay đổi cấu hình phân quyền**

```java
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(
            c -> c.anyRequest().permitAll()
        );
        return http.build();
    }
    // Omitted code
}
```

Giờ đây chúng ta có thể thoải mái gọi endpoint `/hello` mà không cần cung cấp bất kỳ thông tin xác thực nào nữa. Việc gọi phương thức `permitAll()` trong cấu hình kết hợp cùng phương thức `anyRequest()` đã cho phép mọi yêu cầu gửi đến toàn bộ các endpoint đều được thông qua một cách tự do:

```bash
curl http://localhost:8080/hello
```

Phần thân phản hồi của cuộc gọi là:

```text
Hello!
```

Trong ví dụ này, chúng ta đã áp dụng hai phương thức cấu hình chính:

- `httpBasic()`: giúp chúng ta cấu hình phương thức xác thực. Bằng cách gọi phương thức này, bạn chỉ thị cho ứng dụng chấp nhận HTTP Basic làm cơ chế xác thực.

- `authorizeHttpRequests()`: hỗ trợ thiết lập các quy tắc phân quyền ở cấp độ endpoint. Việc triệu gọi phương thức này nhằm hướng dẫn ứng dụng cách thức kiểm tra quyền truy cập đối với các yêu cầu gửi tới các endpoint cụ thể.

Với cả hai phương thức trên, bạn đều phải truyền vào một đối tượng kiểu `Customizer` làm tham số. `Customizer` thực chất là một giao ước giúp bạn định nghĩa phần tùy biến cho các thành phần cấu hình của Spring Security: từ xác thực, phân quyền cho đến các cơ chế bảo vệ chuyên biệt như CSRF hay CORS (sẽ được bàn luận chi tiết ở Chương 9 và Chương 10). Đoạn mã dưới đây trình bày định nghĩa của interface `Customizer`. Hãy lưu ý rằng `Customizer` là một functional interface (cho phép chúng ta sử dụng biểu thức lambda để triển khai nhanh), và phương thức `withDefaults()` mà tôi sử dụng trong Danh sách mã nguồn 2.8 thực chất chỉ là một bản triển khai rỗng của `Customizer`:

```java
@FunctionalInterface
public interface Customizer<T> {
    void customize(T t);
    static <T> Customizer<T> withDefaults() {
        return (t) -> {
        };
    }
}
```

Trong các phiên bản Spring Security trước đây, bạn có thể thiết lập cấu hình trực tiếp mà không cần đến đối tượng `Customizer` nhờ vào cú pháp liên chuỗi (chaining syntax) như ví dụ dưới đây. Bạn có thể thấy, thay vì phải truyền một đối tượng `Customizer` vào phương thức `authorizeHttpRequests()`, các cấu hình được viết nối tiếp ngay sau lời gọi phương thức:

```java
http.authorizeHttpRequests()
    .anyRequest().authenticated()
```

Lý do cách tiếp cận cũ này dần bị loại bỏ là bởi đối tượng `Customizer` mang lại sự linh hoạt vượt trội, cho phép bạn dễ dàng di chuyển các khối cấu hình đến bất kỳ vị trí nào cần thiết. Với các ví dụ đơn giản, việc sử dụng biểu thức lambda trực tiếp mang lại cảm giác rất tiện lợi. Tuy nhiên, trong các ứng dụng thực tế, quy mô của các lớp cấu hình có thể phình to rất nhanh. Trong trường hợp đó, khả năng tách riêng các cấu hình này sang các lớp độc lập sẽ giúp cấu trúc mã nguồn trở nên gọn gàng, dễ dàng bảo trì và viết mã kiểm thử hơn rất nhiều.

Mục tiêu cốt lõi của ví dụ này chỉ nhằm giúp bạn bước đầu làm quen và cảm nhận được cách ghi đè các cấu hình mặc định. Chúng ta sẽ cùng đi sâu vào các khía cạnh chi tiết của phân quyền trong các chương từ 7 đến 10.

> **LƯU Ý** Trong các phiên bản Spring Security cũ hơn, một lớp cấu hình bảo mật bắt buộc phải kế thừa lớp `WebSecurityConfigurerAdapter`. Hiện nay, thực hành này đã hoàn toàn bị loại bỏ. Nếu ứng dụng của bạn đang chạy trên một nền tảng mã nguồn cũ hoặc bạn đang có nhiệm vụ nâng cấp hệ thống cũ, tôi khuyên bạn nên tìm đọc thêm ấn bản đầu tiên của cuốn Spring Security in Action để nắm rõ cách xử lý.

### 2.3.3 Các phương thức cấu hình khác nhau

Một trong những khía cạnh dễ gây nhầm lẫn nhất khi thiết lập cấu hình với Spring Security là sự tồn tại của nhiều con đường khác nhau để đạt cùng một kết quả. Trong phần này, bạn sẽ được tìm hiểu các phương án thay thế để cấu hình `UserDetailsService` và `PasswordEncoder`. Việc nắm vững các tùy chọn này là vô cùng cần thiết, giúp bạn dễ dàng nhận diện chúng khi tham khảo các ví dụ trong cuốn sách này hoặc từ các nguồn tài liệu bên ngoài như blog và bài viết công nghệ. Đồng thời, nó cũng giúp bạn định hình rõ ràng cách thức và thời điểm thích hợp để áp dụng từng phương án vào ứng dụng thực tế của mình. Các chương sau sẽ tiếp tục cung cấp thêm nhiều ví dụ đa dạng để mở rộng cho phần nội dung này.

Hãy cùng quay lại với dự án đầu tiên. Sau khi khởi tạo một ứng dụng mặc định, chúng ta đã tiến hành ghi đè thành công `UserDetailsService` và `PasswordEncoder` bằng cách khai báo các bản triển khai mới dưới dạng các bean trong Spring context. Bây giờ, chúng ta sẽ cùng khám phá một cách khác để thực hiện các cấu hình tương tự cho hai thành phần này.

Chúng ta có thể trực tiếp sử dụng bean `SecurityFilterChain` để thiết lập cả `UserDetailsService` và `PasswordEncoder` như minh họa trong danh sách mã nguồn dưới đây. Bạn có thể tìm thấy ví dụ thực tế này trong dự án mẫu `ssia-ch2-ex3`.

**Danh sách mã nguồn 2.9 Thiết lập UserDetailsService bằng bean SecurityFilterChain**

```java
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(
            c -> c.anyRequest().authenticated()
        );
        var user = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();
        var userDetailsService = new InMemoryUserDetailsManager(user);
        http.userDetailsService(userDetailsService);
        return http.build();
    }
    // Omitted code
}
```

Trong Danh sách mã nguồn 2.9, bạn có thể thấy chúng ta khai báo `UserDetailsService` hoàn toàn tương tự như ở Danh sách mã nguồn 2.5. Điểm khác biệt duy nhất là việc khai báo này hiện được thực hiện cục bộ ngay bên trong phương thức tạo bean `SecurityFilterChain`. Chúng ta cũng gọi phương thức `userDetailsService()` trực tiếp từ đối tượng `HttpSecurity` để đăng ký thực thể `UserDetailsService` này. Danh sách mã nguồn tiếp theo sẽ trình bày toàn bộ nội dung của lớp cấu hình hoàn chỉnh.

**Danh sách mã nguồn 2.10 Định nghĩa đầy đủ của lớp cấu hình**

```java
@Configuration
public class ProjectConfig {
    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(
            c -> c.anyRequest().authenticated()
        );
        var user = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();
        var userDetailsService = new InMemoryUserDetailsManager(user);
        http.userDetailsService(userDetailsService);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Cả hai phương án cấu hình trên đều hoàn toàn chính xác. Phương án đầu tiên—khai báo trực tiếp các bean vào context—sẽ cho phép bạn dễ dàng tiêm (inject) các giá trị này vào bất kỳ lớp nào khác khi có nhu cầu sử dụng sau này. Tuy nhiên, nếu nghiệp vụ của bạn không yêu cầu điều đó, phương án thứ hai cũng là một lựa chọn tốt không kém.

### 2.3.4 Định nghĩa logic xác thực tùy chỉnh

Như bạn đã thấy, các thành phần của Spring Security mang lại sự linh hoạt rất lớn, cung cấp nhiều phương án đa dạng để thích ứng với mọi mô hình kiến trúc của ứng dụng. Cho đến thời điểm này, bạn đã hiểu rõ vai trò của `UserDetailsService` và `PasswordEncoder` trong kiến trúc bảo mật của Spring Security, cũng như nắm được một số cách thức cấu hình chúng. Giờ là lúc chúng ta tìm hiểu cách tùy biến thành phần trực tiếp triệu gọi hai bộ phận trên: đó là `AuthenticationProvider`. Thành phần `AuthenticationProvider` chịu trách nhiệm triển khai logic xác thực thực tế, đồng thời ủy thác nhiệm vụ quản lý người dùng và mật khẩu cho `UserDetailsService` và `PasswordEncoder`. Vì vậy, có thể coi phần này là bước tiến sâu hơn một cấp vào kiến trúc xác thực để học cách tự xây dựng logic xác thực tùy chỉnh thông qua `AuthenticationProvider`. Vì đây mới chỉ là ví dụ nhập môn, tôi sẽ chỉ phác thảo một bức tranh khái quát để bạn dễ dàng hình dung mối liên hệ giữa các thành phần trong cấu trúc tổng thể. Chúng ta sẽ cùng mổ xẻ chi tiết hơn vấn đề này trong các chương từ 3 đến 6.

Tôi khuyên bạn nên tôn trọng sự phân chia nhiệm vụ như thiết kế nguyên bản của kiến trúc Spring Security. Kiến trúc này vốn được thiết kế theo mô hình liên kết lỏng (loosely coupled) với các trách nhiệm được phân rã cực kỳ chi tiết. Chính tư duy thiết kế này đã giúp Spring Security trở nên vô cùng linh hoạt và dễ dàng tích hợp vào mọi ứng dụng. Tùy thuộc vào cách bạn khai thác sự linh hoạt này, bạn hoàn toàn có thể thay đổi cấu trúc thiết kế ban đầu. Tuy nhiên, bạn cần hết sức cẩn trọng với những cách tiếp cận như vậy vì chúng có thể làm phức tạp hóa giải pháp của bạn. Chẳng hạn, bạn có thể chọn ghi đè `AuthenticationProvider` mặc định theo hướng loại bỏ hoàn toàn sự phụ thuộc vào `UserDetailsService` hay `PasswordEncoder`. Với lưu ý đó, Danh sách mã nguồn 2.11 dưới đây sẽ hướng dẫn bạn cách khởi tạo một bộ cung cấp xác thực tùy chỉnh. Bạn có thể tìm thấy ví dụ thực tế này trong dự án mẫu `ssia-ch2-ex4`.

**Danh sách mã nguồn 2.11 Triển khai interface AuthenticationProvider**

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {
    @Override
    public Authentication authenticate(Authentication authentication) throws Authentic […]
        // authentication logic here
    }
}

@Override
public boolean supports(Class<?> authenticationType) {
    // type of the Authentication implementation here
}
```

Phương thức `authenticate(Authentication authentication)` là nơi tập trung toàn bộ logic xử lý xác thực, vì vậy chúng ta sẽ viết một bản triển khai tương tự như trong Danh sách mã nguồn 2.12. Tôi sẽ giải thích chi tiết cách sử dụng phương thức `supports()` ở Chương 6. Hiện tại, tôi khuyên bạn nên tạm thời chấp nhận bản triển khai của nó như một điều hiển nhiên, bởi nó không quá quan trọng đối với ví dụ này.

**Danh sách mã nguồn 2.12 Triển khai logic xác thực**

```java
@Override
public Authentication authenticate(Authentication authentication)
     throws AuthenticationException {

    String username = authentication.getName();
    String password = String.valueOf(authentication.getCredentials());

    if ("john".equals(username) && "12345".equals(password)) {
        return new UsernamePasswordAuthenticationToken(
            username,
            password,
            Arrays.asList());
    } else {
        throw new AuthenticationCredentialsNotFoundException("Error!");
    }
}
```

Trong đoạn mã trên, điều kiện của mệnh đề `if-else` đã thay thế hoàn toàn vai trò của cả `UserDetailsService` và `PasswordEncoder`. Bạn không bắt buộc phải sử dụng hai bean này, nhưng nếu nghiệp vụ xác thực của ứng dụng xoay quanh tài khoản và mật khẩu, tôi đặc biệt khuyến nghị bạn nên tách biệt rõ ràng logic quản lý chúng. Hãy tuân thủ đúng triết lý thiết kế của kiến trúc Spring Security, ngay cả khi bạn đang tiến hành ghi đè bản triển khai xác thực mặc định.

Việc thay thế logic xác thực bằng cách tự triển khai `AuthenticationProvider` riêng biệt sẽ cực kỳ hữu ích nếu bản triển khai mặc định không đáp ứng trọn vẹn các yêu cầu đặc thù của ứng dụng. Bản triển khai `AuthenticationProvider` đầy đủ sẽ trông tương tự như danh sách mã nguồn dưới đây.

**Danh sách mã nguồn 2.13 Bản triển khai đầy đủ của bộ cung cấp xác thực**

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication)
         throws AuthenticationException {
        String username = authentication.getName();
        String password = String.valueOf(authentication.getCredentials());

        if ("john".equals(username) && "12345".equals(password)) {
            return new UsernamePasswordAuthenticationToken(
                username, password, Arrays.asList());
        } else {
            throw new AuthenticationCredentialsNotFoundException("Error!");
        }
    }

    @Override
    public boolean supports(Class<?> authenticationType) {
        return UsernamePasswordAuthenticationToken
            .class
            .isAssignableFrom(authenticationType);
    }
}
```

Trong lớp cấu hình, bạn có thể tiến hành đăng ký `AuthenticationProvider` bằng cách sử dụng phương thức `authenticationProvider()` của đối tượng `HttpSecurity` như trình bày trong danh sách mã nguồn dưới đây.

**Danh sách mã nguồn 2.14 Đăng ký bản triển khai mới của AuthenticationProvider**

```java
@Configuration
public class ProjectConfig {

    private final CustomAuthenticationProvider authenticationProvider;

    public ProjectConfig(CustomAuthenticationProvider authenticationProvider) {
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());

        http.authenticationProvider(authenticationProvider);
        http.authorizeHttpRequests(
            c -> c.anyRequest().authenticated()
        );
        return http.build();
    }
}
```

Bây giờ, bạn có thể gọi thử endpoint. Hệ thống sẽ chỉ cho phép truy cập đối với người dùng hợp lệ duy nhất được định nghĩa trong logic xác thực là `john` đi kèm mật khẩu `12345`:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Phản hồi:

```text
Hello!
```

Trong Chương 6, bạn sẽ được tìm hiểu sâu hơn về `AuthenticationProvider` cùng phương thức ghi đè hành vi của nó trong suốt quy trình xác thực. Cũng trong chương này, chúng ta sẽ thảo luận chi tiết về interface `Authentication` cùng các bản triển khai của nó, tiêu biểu là `UsernamePasswordAuthenticationToken`5.

### 2.3.5 Sử dụng nhiều lớp cấu hình

Trong các ví dụ thực hành trước đó, chúng ta chỉ sử dụng duy nhất một lớp cấu hình. Tuy nhiên, một thực hành tốt trong lập trình là nên tách biệt rõ ràng các trách nhiệm ngay cả đối với các lớp cấu hình. Sự phân tách này là cần thiết khi quy mô cấu hình bắt đầu trở nên phức tạp hơn. Trong các ứng dụng thực tế trên môi trường production, số lượng tài nguyên cần khai báo chắc chắn sẽ đồ sộ hơn nhiều so với các ví dụ nhập môn của chúng ta. Việc tổ chức cấu hình trên nhiều lớp khác nhau sẽ giúp dự án trở nên rõ ràng và dễ đọc hơn rất nhiều.

Quy tắc vàng luôn là: mỗi lớp chỉ nên đảm nhận một trách nhiệm duy nhất. Đối với ví dụ này, chúng ta có thể tách biệt hoàn toàn cấu hình quản lý người dùng ra khỏi cấu hình phân quyền. Chúng ta thực hiện điều đó bằng cách định nghĩa hai lớp cấu hình riêng biệt: `UserManagementConfig` (được định nghĩa trong danh sách mã nguồn tiếp theo) và `WebAuthorizationConfig` (được định nghĩa trong Danh sách mã nguồn 2.16). Bạn có thể tìm thấy ví dụ mẫu này trong dự án `ssia-ch2-ex5`.

**Danh sách mã nguồn 2.15 Định nghĩa lớp cấu hình cho việc quản lý người dùng và mật khẩu**

```java
@Configuration
public class UserManagementConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var userDetailsService = new InMemoryUserDetailsManager();

        var user = User.withUsername("john")
            .password("12345")
            .authorities("read")
            .build();

        userDetailsService.createUser(user);
        return userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Trong trường hợp này, lớp `UserManagementConfig` sẽ chỉ tập trung chứa hai bean chịu trách nhiệm quản lý người dùng: `UserDetailsService` và `PasswordEncoder`. Danh sách mã nguồn tiếp theo sẽ trình bày chi tiết định nghĩa này.

**Danh sách mã nguồn 2.16 Định nghĩa lớp cấu hình cho việc quản lý phân quyền**

```java
@Configuration
public class WebAuthorizationConfig {

    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        http.authorizeHttpRequests(
            c -> c.anyRequest().authenticated()
        );
        return http.build();
    }
}
```

Tại đây, lớp `WebAuthorizationConfig` chỉ cần đảm nhận việc định nghĩa một bean kiểu `SecurityFilterChain` nhằm thiết lập các quy tắc xác thực và phân quyền cho ứng dụng.

## Tóm tắt chương

- Spring Boot cung cấp sẵn một số cấu hình mặc định khi bạn tích hợp thư viện Spring Security vào các dependency của ứng dụng.

- Bạn có thể tự mình triển khai các thành phần cơ bản phục vụ cho việc xác thực và phân quyền, bao gồm: `UserDetailsService`, `PasswordEncoder`, và `AuthenticationProvider`.

- Lớp `User` hỗ trợ bạn trong việc định nghĩa các đối tượng người dùng. Một tài khoản người dùng tối thiểu phải bao gồm tên đăng nhập, mật khẩu và ít nhất một quyền hạn (authority). Quyền hạn đại diện cho các hành động cụ thể mà người dùng được phép thực thi trong phạm vi ứng dụng.

- `InMemoryUserDetailsManager` là một bản triển khai đơn giản của giao ước `UserDetailsService` được cung cấp sẵn bởi Spring Security. Bạn có thể nạp thông tin người dùng vào thực thể `UserDetailsService` này để quản lý tài khoản trực tiếp trong bộ nhớ tạm thời của ứng dụng.

- Lớp `NoOpPasswordEncoder` là một bản triển khai của giao ước `PasswordEncoder` xử lý mật khẩu hoàn toàn dưới dạng văn bản thuần túy (plain text). Bản triển khai này rất phù hợp cho mục đích học tập, thực hành hoặc thử nghiệm nhanh (proof of concept), nhưng tuyệt đối không được đưa vào sử dụng trong các ứng dụng thực tế chạy trên môi trường production.

- Bạn có thể tận dụng giao ước `AuthenticationProvider` để tự xây dựng và tích hợp các logic xác thực tùy chỉnh riêng cho ứng dụng của mình.

- Có nhiều cách thức khác nhau để thiết lập các cấu hình bảo mật, tuy nhiên trong phạm vi một ứng dụng cụ thể, bạn nên thống nhất và kiên định với một phương án duy nhất. Điều này giúp mã nguồn của bạn trở nên gọn gàng, mạch lạc và dễ hiểu hơn rất nhiều.
