# 2. Xin chào, Spring Security (Hello, Spring Security)

> Bản dịch tiếng Việt của chương 2 — *Spring Security in Action, Second Edition* (Laurentiu Spilca, Manning).

**Nội dung chương này bao gồm:**

- Tạo project đầu tiên của bạn với Spring Security
- Thiết kế các chức năng đơn giản bằng những thành phần cơ bản cho authentication (xác thực) và authorization (phân quyền)
- Khái niệm nền tảng và cách sử dụng nó trong một project cụ thể
- Áp dụng các contract (giao ước) cơ bản và hiểu cách chúng liên hệ với nhau
- Viết các hiện thực tùy chỉnh cho những trách nhiệm chính
- Ghi đè (override) các cấu hình mặc định của Spring Boot dành cho Spring Security

Spring Boot xuất hiện như một bước tiến hóa trong việc phát triển ứng dụng với Spring Framework. Thay vì bắt bạn phải viết toàn bộ cấu hình, Spring Boot mang tới một số cấu hình đã được thiết lập sẵn, để bạn chỉ cần ghi đè những cấu hình không phù hợp với hiện thực của mình. Chúng ta cũng gọi cách tiếp cận này là **convention-over-configuration** (quy ước thay cho cấu hình). Spring Boot không còn là một khái niệm mới nữa, và ngày nay chúng ta đang tận hưởng việc viết ứng dụng với phiên bản thứ ba của nó.

Trước khi có Spring Boot, các lập trình viên thường phải viết đi viết lại hàng chục dòng code cho mọi ứng dụng mà họ tạo ra. Tình trạng này ít lộ rõ hơn trong quá khứ, khi phần lớn kiến trúc được phát triển theo kiểu monolithic (nguyên khối). Với kiến trúc monolithic, bạn chỉ phải viết những cấu hình đó một lần ở đầu dự án, và sau đó hiếm khi phải đụng tới chúng nữa. Cùng với sự tiến hóa của các kiến trúc phần mềm hướng dịch vụ (service-oriented), chúng ta bắt đầu thấm nỗi đau của lượng boilerplate code (code lặp khuôn mẫu) phải viết khi cấu hình từng service. Nếu bạn thấy thú vị, bạn có thể xem chương 3 của cuốn *Spring in Practice* của Willie Wheeler và Joshua White (Manning, 2013). Chương đó mô tả việc viết một web application với Spring 3. Qua đó, bạn sẽ hiểu mình từng phải viết bao nhiêu cấu hình chỉ cho một web application nhỏ một trang. Chương này có tại <http://mng.bz/46la>.

Vì lý do đó, cùng với sự phát triển của các app gần đây, đặc biệt là các app microservices, Spring Boot ngày càng trở nên phổ biến. Spring Boot cung cấp autoconfiguration (tự động cấu hình) cho project của bạn và rút ngắn thời gian cần thiết để thiết lập. Có thể nói nó mang một triết lý phù hợp với việc phát triển phần mềm ngày nay.

Trong chương này, chúng ta sẽ bắt đầu với ứng dụng đầu tiên sử dụng Spring Security. Với những app bạn phát triển bằng Spring Framework, Spring Security là lựa chọn tuyệt vời để hiện thực bảo mật ở tầng ứng dụng (application-level security). Chúng ta sẽ dùng Spring Boot và bàn về các giá trị mặc định được cấu hình theo quy ước, kèm phần giới thiệu ngắn gọn về cách ghi đè chúng. Việc xem xét các cấu hình mặc định là một cách giới thiệu tuyệt vời về Spring Security, đồng thời minh họa được khái niệm authentication.

Khi đã bắt đầu với project đầu tiên, chúng ta sẽ bàn chi tiết hơn về các lựa chọn khác nhau cho authentication. Ở các chương 3 đến 6, chúng ta sẽ tiếp tục với những cấu hình cụ thể hơn cho từng trách nhiệm khác nhau mà bạn sẽ thấy trong ví dụ đầu tiên này. Bạn cũng sẽ thấy các cách áp dụng những cấu hình đó khác nhau tùy theo phong cách kiến trúc. Các bước mà chúng ta sẽ bàn trong chương hiện tại là:

1. Tạo một project chỉ với dependency Spring Security và web để xem nó hoạt động thế nào nếu không thêm cấu hình nào. Qua đó, bạn sẽ hiểu mình nên mong đợi gì từ cấu hình mặc định cho authentication và authorization.
2. Thay đổi project để thêm chức năng quản lý user bằng cách ghi đè các mặc định nhằm định nghĩa user và mật khẩu tùy chỉnh.
3. Sau khi quan sát thấy rằng ứng dụng mặc định yêu cầu authentication cho tất cả endpoint, học rằng điều này cũng có thể tùy chỉnh được.
4. Áp dụng các phong cách khác nhau cho cùng một cấu hình để hiểu về best practice.

---

## 2.1 Khởi động project đầu tiên của bạn

Hãy tạo project đầu tiên để chúng ta có một thứ gì đó làm ví dụ mở đầu. Project này là một web application nhỏ expose (phơi bày) ra một REST endpoint. Bạn sẽ thấy rằng dù không làm gì nhiều, Spring Security vẫn bảo vệ endpoint này bằng HTTP Basic authentication. HTTP Basic là cách một web app xác thực một user thông qua một bộ credential (thông tin đăng nhập — username và password) mà app nhận được trong header của HTTP request.

> **NOTE** Với cấu hình mặc định, app có sẵn hai cơ chế authentication khác nhau: HTTP Basic và Form Login. Tuy nhiên, tôi quyết định trình bày ví dụ theo từng bước và sẽ bàn về Form Login ở các chương sau. Nhưng nếu bạn thử truy cập URL bằng trình duyệt, bạn sẽ thấy app của mình hiện thực một form đăng nhập đẹp mắt cho user chứ không hiển thị hộp thoại HTTP Basic xấu xí. Tôi không muốn bạn bị nhầm lẫn nếu quyết định thử nghiệm với trình duyệt, nhưng chúng ta sẽ tập trung vào điều này ở mục nói về HTTP Basic.

Chỉ bằng việc tạo project và thêm đúng các dependency, Spring Boot sẽ áp dụng các cấu hình mặc định, bao gồm cả một username và một password, khi bạn khởi động ứng dụng.

> **NOTE** Bạn có nhiều lựa chọn khác nhau để tạo project Spring Boot. Một số môi trường phát triển cho phép tạo project trực tiếp. Để biết thêm chi tiết, tôi khuyến nghị cuốn *Spring Boot: Up and Running* của Mark Heckler (O'Reilly Media, 2021) và *Spring Boot in Practice* (Manning, 2022) của Somnath Musib, hoặc thậm chí *Spring Start Here* (Manning, 2021), một cuốn sách khác do tôi viết.

Các ví dụ trong sách này tham chiếu tới source code đi kèm sách. Với mỗi ví dụ, tôi cũng chỉ rõ những dependency mà bạn cần thêm vào file `pom.xml`. Bạn có thể, và tôi khuyến nghị bạn nên, tải về các project cung cấp kèm sách và source code có tại <https://www.manning.com/downloads/2105>. Các project này sẽ giúp bạn khi bị mắc kẹt ở đâu đó. Bạn cũng có thể dùng chúng để đối chiếu với lời giải cuối cùng của mình.

> **NOTE** Các ví dụ trong sách này không phụ thuộc vào build tool mà bạn chọn. Bạn có thể dùng Maven hoặc Gradle. Để nhất quán, tôi đã xây dựng tất cả ví dụ bằng Maven.

Project đầu tiên cũng là project nhỏ nhất. Đó là một ứng dụng đơn giản expose một REST endpoint mà bạn có thể gọi và sau đó nhận về một response, như mô tả trong hình 2.1. Project này là đủ để bạn học những bước đầu tiên khi phát triển một ứng dụng dùng Spring Security và Spring Boot. Nó trình bày những điều cơ bản của kiến trúc Spring Security cho authentication và authorization.

![Hình 2.1](images/ch02/ch02-fig01.png)

**Hình 2.1** Ứng dụng khởi đầu của chúng ta sử dụng HTTP Basic cho việc authentication và authorization user khi truy cập một endpoint. Nó cung cấp một REST endpoint tại một route xác định (`/hello`). Khi request thành công, nó trả về thông điệp trạng thái HTTP 200 kèm một response body. Ví dụ này minh họa các cơ chế authentication và authorization mặc định do Spring Security thiết lập.

Chúng ta bắt đầu học Spring Security bằng cách tạo một project rỗng và đặt tên là `ssia-ch2-ex1`. (Bạn cũng sẽ tìm thấy ví dụ này với cùng tên trong các project được cung cấp kèm.) Những dependency duy nhất bạn cần khai báo cho project đầu tiên là `spring-boot-starter-web` và `spring-boot-starter-security`, như trình bày ở listing 2.1. Sau khi tạo project, hãy đảm bảo bạn đã thêm các dependency này vào file `pom.xml`. Mục đích chính của việc làm project này là để thấy hành vi của một ứng dụng được cấu hình mặc định với Spring Security. Chúng ta cũng muốn hiểu những component nào là một phần của cấu hình mặc định đó, cũng như mục đích của chúng.

**Listing 2.1 Các dependency Spring Security cho web app đầu tiên của chúng ta**

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

Chúng ta có thể khởi động ứng dụng ngay lúc này. Spring Boot áp dụng cấu hình mặc định của Spring context giúp chúng ta, dựa trên những dependency mà chúng ta thêm vào project. Tuy nhiên, chúng ta sẽ không học được nhiều về bảo mật nếu không có ít nhất một endpoint được bảo vệ. Hãy tạo một endpoint đơn giản và gọi nó để xem điều gì xảy ra. Để làm việc này, chúng ta thêm một class vào project rỗng và đặt tên class này là `HelloController`. Cụ thể, chúng ta thêm class vào một package tên là `controllers` nằm đâu đó trong namespace chính của project Spring Boot.

> **NOTE** Spring Boot chỉ quét tìm component trong package (và các subpackage của nó) chứa class được annotate bằng `@SpringBootApplication`. Nếu bạn annotate các class bằng bất kỳ stereotype component nào của Spring ở ngoài package chính, bạn phải khai báo vị trí một cách tường minh bằng annotation `@ComponentScan`.

Trong listing sau đây, class `HelloController` định nghĩa một REST controller và một REST endpoint cho ví dụ của chúng ta.

**Listing 2.2 Class `HelloController` và một REST endpoint**

```java
@RestController
public class HelloController {

  @GetMapping("/hello")
  public String hello() {
    return "Hello!";
  }
}
```

Annotation `@RestController` đăng ký bean vào context và nói cho Spring biết rằng ứng dụng dùng instance này làm một web controller. Ngoài ra, annotation này chỉ định rằng ứng dụng phải đặt response body của HTTP response từ giá trị trả về của phương thức. Annotation `@GetMapping` ánh xạ đường dẫn `/hello` tới phương thức đã hiện thực thông qua một GET request. Khi bạn chạy ứng dụng, bên cạnh các dòng khác trên console, bạn sẽ thấy một thứ trông như sau:

```
Using generated security password: 93a01cf0-794b-4b98-86ef-54860f36f7f3
```

Mỗi lần bạn chạy ứng dụng, nó sinh ra một password mới và in password này ra console, như trình bày ở đoạn code trên. Bạn phải dùng password này để gọi bất kỳ endpoint nào của ứng dụng bằng HTTP Basic authentication. Trước hết, hãy thử gọi endpoint mà không dùng header `Authorization`:

```bash
curl http://localhost:8080/hello
```

> **NOTE** Trong sách này, chúng ta dùng cURL để gọi endpoint trong tất cả các ví dụ. Tôi cho rằng cURL là giải pháp dễ đọc nhất. Nhưng nếu bạn thích, bạn có thể dùng công cụ mình chọn. Ví dụ, bạn có thể muốn có giao diện đồ họa tiện lợi hơn. Trong trường hợp này, Postman, Insomnia, hoặc Bruno là những lựa chọn tuyệt vời. Nếu hệ điều hành bạn dùng chưa cài sẵn bất kỳ công cụ nào trong số này, có lẽ bạn cần tự cài đặt chúng.

Và response của lời gọi là

```json
{
  "status":401,
  "error":"Unauthorized",
  "message":"Unauthorized",
  "path":"/hello"
}
```

Trạng thái response là HTTP 401 Unauthorized. Chúng ta đã lường trước kết quả này, vì chúng ta không dùng credential đúng để authentication. Mặc định, Spring Security mong đợi username mặc định (`user`) với password được cung cấp (trong trường hợp của tôi là cái bắt đầu bằng `93a01`). Hãy thử lại nhưng lần này với credential đúng:

```bash
curl -u user:93a01cf0-794b-4b98-86ef-54860f36f7f3 http://localhost:8080/hello
```

Response của lời gọi là

```
Hello!
```

> **NOTE** Mã trạng thái HTTP 401 Unauthorized hơi mơ hồ. Thông thường, nó được dùng để biểu thị một authentication thất bại hơn là authorization. Lập trình viên sử dụng nó trong thiết kế ứng dụng cho các trường hợp như thiếu hoặc sai credential. Với một authorization thất bại, chúng ta có lẽ sẽ dùng trạng thái 403 Forbidden. Nói chung, HTTP 403 nghĩa là server đã định danh được người gọi request, nhưng họ không có đủ đặc quyền cần thiết cho lời gọi mà họ đang cố thực hiện.

Một khi chúng ta gửi đúng credential, bạn có thể thấy trong body của response chính xác những gì mà phương thức `HelloController` chúng ta định nghĩa trước đó trả về.

---

> ### Gọi endpoint với HTTP Basic authentication
>
> Với cURL, bạn có thể thiết lập username và password của HTTP Basic bằng cờ `-u`. Ở phía sau hậu trường, cURL encode chuỗi `<username>:<password>` theo Base64 và gửi nó làm giá trị của header `Authorization` với tiền tố là chuỗi `Basic`. Và với cURL, có lẽ dùng cờ `-u` sẽ dễ hơn cho bạn. Nhưng việc biết request thật sự trông như thế nào cũng rất quan trọng. Vậy hãy thử và tự tay tạo header `Authorization`.
>
> Ở bước đầu tiên, lấy chuỗi `<username>:<password>` và encode nó bằng **Base64**. Khi ứng dụng của chúng ta gửi lời gọi, chúng ta cần biết cách tạo ra giá trị đúng cho header `Authorization`. Bạn làm việc này bằng công cụ `base64` trong console Linux. Bạn cũng có thể tìm một trang web encode chuỗi sang Base64, chẳng hạn <https://www.base64encode.org>. Đoạn code này cho thấy lệnh trong console Linux hoặc Git Bash (tham số `-n` nghĩa là không thêm ký tự xuống dòng ở cuối):
>
> ```bash
> echo -n user:93a01cf0-794b-4b98-86ef-54860f36f7f3 | base64
> ```
>
> Chạy lệnh này trả về chuỗi được encode Base64 sau:
>
> ```
> dXNlcjo5M2EwMWNmMC03OTRiLTRiOTgtODZlZi01NDg2MGYzNmY3ZjM=
> ```
>
> Giờ bạn có thể dùng giá trị đã encode Base64 này làm giá trị của header `Authorization` cho lời gọi. Lời gọi này sẽ tạo ra cùng kết quả như lời gọi dùng tùy chọn `-u`:
>
> ```bash
> curl -H "Authorization: Basic dXNlcjo5M2EwMWNmMC03OTRiLTRiOTgtODZlZi01NDg2MGYzNmY3ZjM=" http://localhost:8080/hello
> ```
>
> Kết quả của lời gọi là
>
> ```
> Hello!
> ```

---

Với một project mặc định thì không có nhiều cấu hình bảo mật đáng kể để bàn. Chúng ta chủ yếu dùng cấu hình mặc định để chứng minh rằng các dependency đúng đã có mặt. Nó làm được rất ít cho authentication và authorization. Hiện thực này không phải thứ chúng ta muốn thấy trong một ứng dụng sẵn sàng chạy production. Nhưng project mặc định là một ví dụ tuyệt vời để bạn khởi đầu.

Với ví dụ đầu tiên này chạy được, ít nhất chúng ta biết rằng Spring Security đã có mặt. Bước tiếp theo là thay đổi các cấu hình sao cho chúng phù hợp với yêu cầu của project. Trước hết, chúng ta sẽ đi sâu hơn vào những gì Spring Boot cấu hình liên quan tới Spring Security, rồi sau đó sẽ xem cách ghi đè những cấu hình đó.

---

## 2.2 Bức tranh tổng thể về thiết kế class của Spring Security

Trong mục này, chúng ta bàn về những actor (thành phần tham gia) chính trong kiến trúc tổng thể, những thành phần tham gia vào tiến trình authentication và authorization. Bạn cần nắm khía cạnh này vì bạn sẽ phải ghi đè những component được cấu hình sẵn đó cho phù hợp với nhu cầu ứng dụng của mình. Tôi sẽ bắt đầu bằng cách mô tả kiến trúc Spring Security cho authentication và authorization hoạt động ra sao, rồi áp dụng nó vào các project trong chương này. Sẽ là quá nhiều nếu bàn tất cả cùng lúc, nên để giảm thiểu công sức học của bạn trong chương này, tôi sẽ trình bày bức tranh ở mức cao (high-level) cho từng component. Bạn sẽ học chi tiết về từng cái ở các chương sau.

Ở mục 2.1, bạn đã thấy một số logic được thực thi cho authentication và authorization. Chúng ta có một user mặc định, và chúng ta nhận được một password ngẫu nhiên mỗi lần khởi động ứng dụng. Chúng ta đã có thể dùng user và password mặc định này để gọi một endpoint. Nhưng toàn bộ logic đó được hiện thực ở đâu? Như có lẽ bạn đã biết, Spring Boot thiết lập sẵn một số component cho bạn, tùy thuộc vào những dependency bạn dùng (tức là convention-over-configuration mà chúng ta đã bàn ở đầu chương này).

Hình 2.2 cho thấy bức tranh tổng thể về những actor (component) chính trong kiến trúc Spring Security và các mối quan hệ giữa chúng. Những component này có hiện thực được cấu hình sẵn trong project đầu tiên. Trong chương này, tôi minh họa những gì Spring Boot cấu hình trong ứng dụng của bạn liên quan tới Spring Security. Chúng ta cũng sẽ bàn về mối quan hệ giữa các thực thể tham gia vào luồng authentication được trình bày.

![Hình 2.2](images/ch02/ch02-fig02.png)

**Hình 2.2** Trọng tâm ở đây là các thành phần cốt lõi tham gia vào tiến trình authentication của Spring Security và các mối liên kết giữa chúng. Khung này tạo nên cấu trúc thiết yếu để thực thi authentication bằng Spring Security. Xuyên suốt cuốn sách, chúng ta sẽ thường xuyên tham chiếu lại kiến trúc này khi khảo sát các chiến lược authentication và authorization khác nhau.

Hình 2.2 cho thấy rằng:

1. **Authentication filter** ủy quyền (delegate) request authentication cho **authentication manager**, và dựa trên phản hồi, nó thiết lập **security context**.
2. **Authentication manager** sử dụng **authentication provider** để xử lý authentication.
3. **Authentication provider** hiện thực logic authentication.
4. **User details service** hiện thực trách nhiệm quản lý user, thứ mà authentication provider dùng trong logic authentication.
5. **Password encoder** hiện thực việc quản lý password, thứ mà authentication provider dùng trong logic authentication.
6. **Security context** giữ dữ liệu authentication sau tiến trình authentication. Security context sẽ giữ dữ liệu cho đến khi hành động kết thúc. Thông thường, trong một app kiểu thread-per-request (mỗi request một thread), điều đó có nghĩa là cho đến khi app gửi response về cho client.

Ở các đoạn tiếp theo, tôi sẽ bàn về những bean được autoconfigure sau:

- `UserDetailsService`
- `PasswordEncoder`

Một object hiện thực interface `UserDetailsService` với Spring Security sẽ quản lý thông tin chi tiết về user. Cho đến giờ, chúng ta đã dùng hiện thực mặc định do Spring Boot cung cấp. Hiện thực này chỉ đăng ký credential mặc định trong bộ nhớ nội bộ của ứng dụng. Credential mặc định này là "user" với một password mặc định là một universally unique identifier (UUID). Password mặc định được sinh ngẫu nhiên khi Spring context được nạp (lúc app khởi động). Vào lúc đó, ứng dụng ghi password ra console để bạn có thể thấy. Nhờ vậy, bạn có thể dùng nó trong ví dụ mà chúng ta vừa làm ở chương này.

Hiện thực mặc định này chỉ có tác dụng như một proof of concept (bằng chứng khái niệm) và cho phép chúng ta thấy rằng dependency đã có mặt. Hiện thực này lưu credential trong bộ nhớ (in-memory) — ứng dụng không lưu bền (persist) credential. Cách tiếp cận này phù hợp với các ví dụ hoặc proof of concept, nhưng bạn nên tránh nó trong một ứng dụng sẵn sàng chạy production.

Tiếp theo chúng ta có `PasswordEncoder`. `PasswordEncoder` làm hai việc:

- Encode một password (thường bằng một thuật toán encryption hoặc hashing)
- Kiểm chứng xem password có khớp với một giá trị đã encode hay không

Dù không hiển nhiên như object `UserDetailsService`, `PasswordEncoder` là bắt buộc đối với luồng Basic authentication. Hiện thực đơn giản nhất quản lý password ở dạng plain text và không encode chúng. Chúng ta sẽ bàn chi tiết hơn về hiện thực của object này ở chương 4. Còn bây giờ, bạn cần biết rằng một `PasswordEncoder` tồn tại song hành cùng `UserDetailsService` mặc định. Khi chúng ta thay thế hiện thực mặc định của `UserDetailsService`, chúng ta cũng phải chỉ định một `PasswordEncoder`.

Spring Boot cũng chọn một phương thức authentication khi cấu hình các mặc định: HTTP Basic access authentication. Đây là phương thức access authentication đơn giản nhất. Basic authentication chỉ yêu cầu client gửi username và password qua header HTTP `Authorization`. Trong giá trị của header, client gắn tiền tố `Basic`, theo sau là bản encode Base64 của chuỗi chứa username và password, phân tách bởi dấu hai chấm (`:`).

> **NOTE** HTTP Basic authentication không đảm bảo tính bí mật (confidentiality) của credential. Base64 chỉ là một phương pháp encode cho tiện việc truyền tải; nó không phải phương pháp encryption hay hashing. Trong lúc truyền, nếu bị chặn bắt, bất kỳ ai cũng có thể thấy credential. Nhìn chung, chúng ta không dùng HTTP Basic authentication mà không có ít nhất HTTPS để đảm bảo tính bí mật. Bạn có thể đọc định nghĩa chi tiết về HTTP Basic trong RFC 7617 (<https://tools.ietf.org/html/rfc7617>).

`AuthenticationProvider` định nghĩa logic authentication, ủy quyền việc quản lý user và password. Một hiện thực mặc định của `AuthenticationProvider` sử dụng các hiện thực mặc định được cung cấp cho `UserDetailsService` và `PasswordEncoder`. Một cách ngầm định, ứng dụng của bạn bảo vệ tất cả các endpoint. Do đó, điều duy nhất chúng ta cần làm cho ví dụ của mình là thêm endpoint. Ngoài ra, chỉ có một user duy nhất có thể truy cập mọi endpoint, nên có thể nói rằng trong trường hợp này không có nhiều việc phải làm với authorization.

---

> ### HTTP vs. HTTPS
>
> Bạn có thể đã để ý rằng trong các ví dụ được trình bày, tôi chỉ dùng HTTP. Tuy nhiên trong thực tế, ứng dụng của bạn chỉ giao tiếp qua HTTPS. Với các ví dụ mà chúng ta bàn trong cuốn sách này, các cấu hình liên quan tới Spring Security không khác nhau, dù ta dùng HTTP hay HTTPS. Chúng ta sẽ không cấu hình HTTPS cho các endpoint trong ví dụ để bạn có thể tập trung vào những ví dụ liên quan tới Spring Security. Nhưng nếu muốn, bạn có thể bật HTTPS cho bất kỳ endpoint nào, như trình bày trong sidebar này.
>
> Có nhiều pattern để cấu hình HTTPS trong một hệ thống. Trong một số trường hợp, lập trình viên cấu hình HTTPS ở tầng ứng dụng; trong những trường hợp khác, họ có thể dùng service mesh, hoặc có thể chọn thiết lập HTTPS ở tầng hạ tầng (infrastructure). Với Spring Boot, bạn có thể dễ dàng bật HTTPS ở tầng ứng dụng, như bạn sẽ học trong ví dụ tiếp theo của sidebar này.
>
> Trong bất kỳ kịch bản cấu hình nào, bạn đều cần một certificate (chứng chỉ) được ký bởi một certification authority (CA). Bằng certificate này, client gọi endpoint biết được response có đến từ authentication server hay không và rằng không ai chặn bắt cuộc giao tiếp. Bạn có thể mua một certificate như vậy nếu cần. Nếu bạn chỉ cần cấu hình HTTPS để kiểm thử ứng dụng, bạn có thể sinh một self-signed certificate (chứng chỉ tự ký) bằng một công cụ như OpenSSL (<https://www.openssl.org/>). Hãy sinh self-signed certificate của chúng ta rồi cấu hình nó trong project:
>
> ```bash
> openssl req -newkey rsa:2048 -x509 -keyout key.pem -out cert.pem -days 365
> ```
>
> Sau khi chạy lệnh `openssl` trong terminal, bạn sẽ được hỏi password và thông tin chi tiết về CA của bạn. Vì đây chỉ là self-signed certificate dùng để test, bạn có thể nhập dữ liệu bất kỳ; chỉ cần nhớ password. Lệnh này xuất ra hai file: *key.pem* (private key) và *cert.pem* (public certificate). Chúng ta sẽ dùng các file này tiếp theo để sinh self-signed certificate nhằm bật HTTPS. Trong hầu hết trường hợp, certificate có định dạng Public Key Cryptography Standards #12 (PKCS12). Ít gặp hơn, chúng ta dùng định dạng Java KeyStore (JKS). Hãy tiếp tục ví dụ với định dạng PKCS12 (để có phần thảo luận tuyệt vời về mật mã học, tôi khuyến nghị cuốn *Real-World Cryptography* của David Wong [Manning, 2020]):
>
> ```bash
> openssl pkcs12 -export -in cert.pem -inkey key.pem -out certificate.p12 -name "certificate"
> ```
>
> Lệnh thứ hai chúng ta dùng nhận đầu vào là hai file được sinh ra bởi lệnh thứ nhất và xuất ra self-signed certificate.
>
> Lưu ý rằng nếu bạn chạy những lệnh này trong Bash shell trên hệ thống Windows, bạn có thể cần thêm `winpty` phía trước:
>
> ```bash
> winpty openssl req -newkey rsa:2048 -x509 -keyout key.pem -out cert.pem -days 365
> winpty openssl pkcs12 -export -in cert.pem -inkey key.pem -out certificate.p12 -name "certificate"
> ```
>
> Cuối cùng, khi đã có self-signed certificate, bạn có thể cấu hình HTTPS cho các endpoint của mình. Copy file *certificate.p12* vào thư mục *resources* của project Spring Boot, và thêm các dòng sau vào file *application.properties*:
>
> ```properties
> server.ssl.key-store-type=PKCS12
> server.ssl.key-store=classpath:certificate.p12
> server.ssl.key-store-password=12345                # ①
> ```
>
> ① Giá trị của password là cái bạn đã chỉ định khi chạy lệnh thứ hai để sinh file certificate PKCS12.
>
> Password (trong trường hợp của tôi là `12345`) đã được hỏi ở dấu nhắc sau khi chạy lệnh sinh certificate. Đây là lý do bạn không thấy nó trong lệnh. Giờ hãy thêm một endpoint test vào ứng dụng rồi gọi nó bằng HTTPS:
>
> ```java
> @RestController
> public class HelloController {
>
>   @GetMapping("/hello")
>   public String hello() {
>     return "Hello!";
>   }
> }
> ```
>
> Nếu bạn dùng self-signed certificate, bạn nên cấu hình công cụ dùng để gọi endpoint sao cho nó bỏ qua việc kiểm tra tính xác thực của certificate. Nếu công cụ kiểm tra tính xác thực của certificate, nó sẽ không nhận ra certificate là hợp lệ, và lời gọi sẽ không hoạt động. Với cURL, bạn có thể dùng tùy chọn `-k` để bỏ qua việc kiểm tra tính xác thực của certificate:
>
> ```bash
> curl -k -u user:93a01cf0-794b-4b98-86ef-54860f36f7f3 https://localhost:8080/hello
> ```
>
> Response của lời gọi là
>
> ```
> Hello!
> ```
>
> Hãy nhớ rằng ngay cả khi bạn dùng HTTPS, việc giao tiếp giữa các thành phần trong hệ thống của bạn cũng không phải là bất khả xâm phạm. Nhiều lần tôi nghe người ta nói: "Tôi không mã hóa cái này nữa. Tôi sẽ dùng HTTPS!" Dù hữu ích trong việc bảo vệ giao tiếp, HTTPS chỉ là một viên gạch trong bức tường bảo mật của hệ thống. Hãy luôn đối xử với bảo mật hệ thống một cách có trách nhiệm và chăm lo cho mọi tầng liên quan.

> **Ghi chú của người dịch:** Trong PDF gốc, hai lệnh `openssl pkcs12 ...` bị cắt cụt ở `-name "cert` và `-nam` do tràn khỏi khung hiển thị. Phần còn lại đã được khôi phục thành `-name "certificate"` theo ngữ cảnh.

---

## 2.3 Ghi đè các cấu hình mặc định

Giờ đây khi bạn đã biết các giá trị mặc định của project đầu tiên, đã đến lúc xem cách thay thế chúng. Bạn cần hiểu những lựa chọn mình có để ghi đè các component mặc định, bởi đây là cách bạn cắm (plug in) hiện thực tùy chỉnh của mình vào và áp dụng bảo mật sao cho phù hợp với ứng dụng. Và như bạn sẽ học trong mục này, quá trình phát triển cũng liên quan tới việc bạn viết cấu hình thế nào để giữ cho ứng dụng dễ bảo trì. Với các project mà chúng ta làm, bạn sẽ thường thấy nhiều cách để ghi đè một cấu hình. Sự linh hoạt này có thể gây nhầm lẫn. Tôi thường xuyên thấy sự pha trộn các phong cách cấu hình khác nhau cho các phần khác nhau của Spring Security trong cùng một ứng dụng, điều này là không mong muốn. Vì vậy, sự linh hoạt đi kèm một lời cảnh báo. Bạn cần học cách chọn lựa trong số đó, nên mục này cũng là về việc biết mình có những lựa chọn nào.

Trong một số trường hợp, lập trình viên chọn dùng bean trong Spring context để cấu hình. Trong những trường hợp khác, họ ghi đè các phương thức khác nhau cho cùng mục đích. Tốc độ tiến hóa của hệ sinh thái Spring có lẽ là một trong những yếu tố chính tạo ra nhiều cách tiếp cận như vậy. Cấu hình một project với sự pha trộn nhiều phong cách là điều không mong muốn, vì nó khiến code khó hiểu và ảnh hưởng tới khả năng bảo trì của ứng dụng. Biết các lựa chọn của mình và cách dùng chúng là một kỹ năng giá trị, và nó giúp bạn hiểu rõ hơn cách nên cấu hình bảo mật ở tầng ứng dụng trong một project.

Trong mục này, bạn sẽ học cách cấu hình một `UserDetailsService` và một `PasswordEncoder`. Hai component này thường tham gia vào authentication, và hầu hết ứng dụng đều tùy chỉnh chúng tùy theo yêu cầu. Dù chúng ta sẽ bàn chi tiết về việc tùy chỉnh chúng ở chương 3 và 4, việc thấy cách cắm một hiện thực tùy chỉnh vào là rất cần thiết. Các hiện thực chúng ta dùng trong chương này đều do Spring Security cung cấp.

### 2.3.1 Tùy chỉnh việc quản lý user details

Component đầu tiên chúng ta bàn tới trong chương này là `UserDetailsService`. Như bạn đã thấy, ứng dụng dùng component này trong tiến trình authentication. Trong mục này, bạn sẽ học cách định nghĩa một bean tùy chỉnh kiểu `UserDetailsService`. Chúng ta làm vậy để ghi đè cái mặc định do Spring Boot cấu hình. Như bạn sẽ thấy chi tiết hơn ở chương 3, bạn có lựa chọn tạo hiện thực của riêng mình hoặc dùng một hiện thực định sẵn do Spring Security cung cấp. Trong chương này, chúng ta chưa đi sâu vào các hiện thực do Spring Security cung cấp hay tạo hiện thực của riêng mình. Tôi sẽ dùng một hiện thực do Spring Security cung cấp, tên là `InMemoryUserDetailsManager`. Với ví dụ này, bạn sẽ học cách cắm loại object này vào kiến trúc của mình.

> **NOTE** Interface trong Java định nghĩa các contract giữa các object. Trong thiết kế class của ứng dụng, chúng ta dùng interface để tách rời (decouple) các object sử dụng lẫn nhau. Để nhấn mạnh đặc tính này của interface khi bàn về chúng trong cuốn sách này, tôi chủ yếu gọi chúng là **contract**.

Để cho bạn thấy cách ghi đè component này bằng một hiện thực do chúng ta chọn, chúng ta sẽ thay đổi những gì đã làm trong ví dụ đầu tiên. Làm vậy cho phép chúng ta có credential do chính mình quản lý cho việc authentication. Với ví dụ này, chúng ta không hiện thực class của riêng mình, mà dùng một hiện thực do Spring Security cung cấp.

Trong ví dụ này, chúng ta dùng hiện thực `InMemoryUserDetailsManager`. Dù nó có nhiều hơn một chút so với chỉ là một `UserDetailsService`, hiện tại chúng ta chỉ nhìn nó từ góc độ một `UserDetailsService`. Hiện thực này lưu credential trong bộ nhớ, và Spring Security có thể dùng chúng để authentication một request.

> **NOTE** Hiện thực `InMemoryUserDetailsManager` không dành cho các ứng dụng sẵn sàng chạy production, nhưng nó là công cụ tuyệt vời cho các ví dụ hoặc proof of concept. Trong một số trường hợp, tất cả những gì bạn cần là user. Bạn không cần dành thời gian hiện thực phần chức năng này. Trong trường hợp của chúng ta, chúng ta dùng nó để hiểu cách ghi đè hiện thực `UserDetailsService` mặc định.

Chúng ta bắt đầu bằng việc định nghĩa một configuration class. Nói chung, chúng ta khai báo các configuration class trong một package riêng tên là *config*. Listing sau đây trình bày định nghĩa cho configuration class. Bạn cũng có thể tìm thấy ví dụ này trong project `ssia-ch2-ex2`.

**Listing 2.3 Configuration class cho bean `UserDetailsService`**

```java
@Configuration                 // ①
public class ProjectConfig {

  @Bean                        // ②
  UserDetailsService userDetailsService() {
    return new InMemoryUserDetailsManager();
  }
}
```

① Annotation `@Configuration` đánh dấu class này là một configuration class.

② Annotation `@Bean` chỉ thị cho Spring thêm giá trị trả về vào Spring context dưới dạng một bean.

Chúng ta annotate class bằng `@Configuration`. Annotation `@Bean` chỉ thị cho Spring thêm instance được phương thức trả về vào Spring context. Nếu bạn chạy code chính xác như hiện tại, bạn sẽ không còn thấy password tự sinh trên console nữa. Ứng dụng giờ dùng instance kiểu `UserDetailsService` mà bạn đã thêm vào context thay vì cái được autoconfigure mặc định. Nhưng đồng thời, bạn cũng sẽ không thể truy cập endpoint được nữa vì hai lý do:

- Bạn không có user nào.
- Bạn không có `PasswordEncoder`.

Trong hình 2.2, bạn đã thấy rằng authentication cũng phụ thuộc vào một `PasswordEncoder`. Hãy giải quyết hai vấn đề này từng bước một. Chúng ta cần:

1. Tạo ít nhất một user có một bộ credential (username và password)
2. Thêm user đó để được quản lý bởi hiện thực `UserDetailsService` của chúng ta
3. Định nghĩa một bean kiểu `PasswordEncoder` mà ứng dụng có thể dùng để kiểm chứng một password cho trước với password đã được lưu và quản lý bởi `UserDetailsService`

Trước tiên, chúng ta khai báo và thêm một bộ credential có thể dùng cho authentication vào instance của `InMemoryUserDetailsManager`. Ở chương 3, chúng ta sẽ bàn nhiều hơn về user và cách quản lý chúng. Còn lúc này, hãy dùng một builder định sẵn để tạo một object kiểu `UserDetails`.

> **NOTE** Đôi khi bạn sẽ thấy tôi dùng `var` trong code. Java 10 giới thiệu tên kiểu dành riêng `var`, và bạn chỉ có thể dùng nó cho các khai báo cục bộ. Mặc dù trong một số trường hợp, cách `var` được dùng trong cuốn sách này có thể bị coi là cách làm không tốt xét từ góc độ clean code, việc này nhằm làm cú pháp ngắn gọn hơn, cũng như ẩn đi kiểu của biến. Cách tiếp cận này giúp bạn tập trung vào những gì thật sự liên quan trong ví dụ đang xét. Chúng ta sẽ bàn về những kiểu bị `var` che đi ở các chương sau, nên bạn không phải lo về kiểu đó cho tới khi đến lúc phân tích nó một cách đúng đắn.

Khi xây dựng instance, chúng ta phải cung cấp username, password, và ít nhất một authority (quyền hạn). Authority là một hành động được cho phép đối với user đó, và chúng ta có thể dùng chuỗi bất kỳ cho nó. Trong listing tiếp theo, tôi đặt tên authority là `read`, nhưng vì chúng ta chưa dùng đến authority này lúc này, tên đó không thật sự quan trọng.

**Listing 2.4 Tạo một user bằng builder class `User` cho `UserDetailsService`**

```java
@Configuration
public class ProjectConfig {

  @Bean
  UserDetailsService userDetailsService() {
    var user = User.withUsername("john")               // ①
                 .password("12345")                    // ①
                 .authorities("read")                  // ①
                 .build();                             // ①

     return new InMemoryUserDetailsManager(user);      // ②
  }
}
```

① Xây dựng user với username, password, và danh sách authority cho trước.

② Thêm user để được quản lý bởi `UserDetailsService`.

> **NOTE** Bạn sẽ tìm thấy class `User` trong package `org.springframework.security.core.userdetails`. Đó là hiện thực builder mà chúng ta dùng để tạo object biểu diễn user. Hơn nữa, như một quy tắc chung trong cuốn sách này, nếu tôi không trình bày cách viết một class trong một code listing, điều đó nghĩa là Spring Security đã cung cấp nó.

Như trình bày ở listing 2.4, chúng ta phải cung cấp giá trị cho username, cho password, và ít nhất một authority. Tuy nhiên, như vậy vẫn chưa đủ để cho phép chúng ta gọi endpoint. Chúng ta còn cần khai báo một `PasswordEncoder`.

Khi dùng `UserDetailsService` mặc định, một `PasswordEncoder` cũng được autoconfigure. Bởi vì chúng ta đã ghi đè `UserDetailsService`, chúng ta cũng phải khai báo một `PasswordEncoder`. Nếu thử ví dụ ngay bây giờ, bạn sẽ thấy một exception khi gọi endpoint. Khi cố thực hiện authentication, Spring Security nhận ra nó không biết cách quản lý password và thất bại. Exception trông giống đoạn code kế tiếp, và bạn sẽ thấy nó trong console của ứng dụng. Client nhận về thông điệp HTTP 401 Unauthorized và một response body rỗng:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Kết quả của lời gọi trong console của app là

```
java.lang.IllegalArgumentException:
There is no PasswordEncoder mapped for the id "null"
    at
org.springframework.security.crypto.
➥password.DelegatingPasswordEncoder$
➥UnmappedIdPasswordEncoder.matches(
➥DelegatingPasswordEncoder.java:289)
➥~[spring-security-crypto-6.0.0.jar:6.0.0]
    at org.springframework.security.crypto.
➥password.DelegatingPasswordEncoder.matches(
➥DelegatingPasswordEncoder.java:237)
➥~[spring-security-crypto-6.0.0.jar:6.0.0]
```

Để giải quyết vấn đề này, chúng ta có thể thêm một bean `PasswordEncoder` vào context, giống như đã làm với `UserDetailsService`. Với bean này, chúng ta dùng một hiện thực có sẵn của `PasswordEncoder`:

```java
@Bean
public PasswordEncoder passwordEncoder() {
  return NoOpPasswordEncoder.getInstance();
}
```

> **NOTE** Instance `NoOpPasswordEncoder` xử lý password ở dạng plain text. Nó không encrypt hay hash chúng. Để đối chiếu, `NoOpPasswordEncoder` chỉ so sánh các chuỗi bằng phương thức `equals(Object o)` bên dưới của class `String`. Bạn không nên dùng loại `PasswordEncoder` này trong một app sẵn sàng chạy production. `NoOpPasswordEncoder` là lựa chọn tốt cho những ví dụ mà bạn không muốn tập trung vào thuật toán hashing của password. Vì vậy, những người phát triển class này đã đánh dấu nó là `@Deprecated`, và môi trường phát triển của bạn sẽ hiển thị tên nó với một dấu gạch ngang.

Bạn có thể xem đầy đủ code của configuration class trong listing sau đây.

**Listing 2.5 Định nghĩa đầy đủ của configuration class**

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

  @Bean                               // ①
  PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
  }
}
```

① Một phương thức mới được annotate bằng `@Bean` để thêm một `PasswordEncoder` vào context.

Hãy thử endpoint với user mới có username là `john` và password là `12345`:

```bash
curl -u john:12345 http://localhost:8080/hello
```

```
Hello!
```

> **NOTE** Biết tầm quan trọng của unit test và integration test, một số bạn có lẽ đã tự hỏi tại sao chúng ta không viết test cho các ví dụ. Bạn thực ra sẽ tìm thấy các integration test liên quan tới Spring Security đi kèm tất cả ví dụ được cung cấp trong cuốn sách này. Tuy nhiên, để giúp bạn tập trung vào chủ đề được trình bày ở từng chương, tôi đã tách riêng phần thảo luận về việc testing các tích hợp Spring Security và trình bày chi tiết ở chương 18.

### 2.3.2 Áp dụng authorization ở mức endpoint

Với cơ chế quản lý user mới đã sẵn sàng, như mô tả ở mục 2.3.1, giờ chúng ta có thể bàn về phương thức authentication và cấu hình cho các endpoint. Bạn sẽ học rất nhiều điều về cấu hình authorization ở các chương 7 đến 12. Nhưng trước khi đi vào chi tiết, bạn phải hiểu bức tranh tổng thể. Cách tốt nhất để đạt được điều đó là qua ví dụ đầu tiên của chúng ta. Với cấu hình mặc định, tất cả endpoint đều giả định rằng bạn có một user hợp lệ được ứng dụng quản lý. Ngoài ra, mặc định app của bạn dùng HTTP Basic authentication, nhưng bạn có thể dễ dàng ghi đè cấu hình này.

Như bạn sẽ học ở các chương tiếp theo, HTTP Basic authentication không phù hợp với hầu hết kiến trúc ứng dụng. Đôi khi chúng ta muốn thay đổi nó cho khớp với ứng dụng của mình. Tương tự, không phải mọi endpoint của một ứng dụng đều cần được bảo vệ, và với những endpoint cần bảo vệ, chúng ta có thể cần chọn các phương thức authentication và quy tắc authorization khác nhau. Để tùy chỉnh việc xử lý authentication và authorization, chúng ta sẽ cần định nghĩa một bean kiểu `SecurityFilterChain`. Với ví dụ này, tôi sẽ tiếp tục viết code trong project `ssia-ch2-ex3`.

**Listing 2.6 Định nghĩa một bean `SecurityFilterChain`**

```java
@Configuration
public class ProjectConfig {

  @Bean
  SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    return http.build();
  }

  // Phần code được lược bỏ
}
```

Sau đó chúng ta có thể thay đổi cấu hình bằng các phương thức khác nhau của object `HttpSecurity`, như trình bày ở listing kế tiếp.

**Listing 2.7 Dùng tham số `HttpSecurity` để thay đổi cấu hình**

```java
@Configuration
public class ProjectConfig {

  @Bean
  SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    http.httpBasic(Customizer.withDefaults());      // ①
    http.authorizeHttpRequests(
      c -> c.anyRequest().authenticated()           // ②
    );

    return http.build();
  }

  // Phần code được lược bỏ
}
```

① App dùng HTTP Basic authentication.

② Tất cả request đều yêu cầu authentication.

Code trong listing 2.7 cấu hình authorization ở mức endpoint với hành vi giống hệt hành vi mặc định. Bạn có thể gọi lại endpoint để xem nó có hoạt động giống như trong lần test trước ở mục 2.3.1 hay không. Chỉ với một thay đổi nhỏ, bạn có thể làm cho tất cả endpoint truy cập được mà không cần credential. Bạn sẽ thấy cách làm điều này ở listing sau đây.

**Listing 2.8 Dùng `permitAll()` để thay đổi cấu hình authorization**

```java
@Configuration
public class ProjectConfig {

  @Bean
  public SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    http.httpBasic(Customizer.withDefaults());

    http.authorizeHttpRequests(
      c -> c.anyRequest().permitAll()       // ①
    );

    return http.build();
  }

  // Phần code được lược bỏ
}
```

① Không request nào cần được authentication.

Giờ chúng ta có thể gọi endpoint `/hello` mà không cần credential. Lời gọi `permitAll()` trong cấu hình, cùng với phương thức `anyRequest()`, khiến tất cả endpoint truy cập được mà không cần credential:

```bash
curl http://localhost:8080/hello
```

Response body của lời gọi là

```
Hello!
```

Trong ví dụ này, chúng ta đã dùng hai phương thức cấu hình:

- `httpBasic()` — giúp chúng ta cấu hình cách tiếp cận authentication. Bằng cách gọi phương thức này, bạn chỉ thị cho app chấp nhận HTTP Basic làm phương thức authentication.
- `authorizeHttpRequests()` — giúp chúng ta cấu hình các quy tắc authorization ở mức endpoint. Bằng cách gọi phương thức này, bạn chỉ thị cho app cách authorize những request nhận được trên các endpoint cụ thể.

Với cả hai phương thức, bạn đều phải dùng một object `Customizer` làm tham số. `Customizer` là một contract bạn hiện thực để định nghĩa việc tùy chỉnh cho bất kỳ phần tử Spring Security nào mà bạn cấu hình: authentication, authorization, hoặc các cơ chế bảo vệ cụ thể như CSRF hay CORS (sẽ bàn ở chương 9 và 10). Đoạn code dưới đây cho thấy định nghĩa của interface `Customizer`. Hãy để ý rằng `Customizer` là một functional interface (nên chúng ta có thể dùng biểu thức lambda để hiện thực nó), và phương thức `withDefaults()` mà tôi dùng ở listing 2.8 thực chất chỉ là một hiện thực `Customizer` không làm gì cả:

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

Ở các phiên bản Spring Security trước đây, bạn có thể áp dụng cấu hình mà không cần object `Customizer` bằng cú pháp chuỗi (chaining syntax), như đoạn code sau. Hãy để ý rằng thay vì cung cấp một object `Customizer` cho phương thức `authorizeHttpRequests()`, cấu hình chỉ đơn giản đi theo sau lời gọi phương thức:

```java
http.authorizeHttpRequests()
       .anyRequest().authenticated()
```

Lý do cách tiếp cận này bị bỏ lại phía sau là vì object `Customizer` cho bạn nhiều linh hoạt hơn trong việc di chuyển cấu hình tới nơi cần thiết. Chắc chắn là với những ví dụ đơn giản, dùng biểu thức lambda rất thoải mái. Nhưng trong các app thực tế, cấu hình có thể phình to rất nhiều. Trong những trường hợp đó, khả năng chuyển các cấu hình này sang những class riêng biệt giúp bạn giữ cấu hình dễ bảo trì và dễ test hơn.

Mục đích của ví dụ này là cho bạn cảm nhận về cách ghi đè cấu hình mặc định. Chúng ta sẽ đi vào chi tiết về authorization ở các chương 7 đến 10.

> **NOTE** Ở các phiên bản Spring Security trước đây, một security configuration class cần kế thừa một class tên là `WebSecurityConfigurerAdapter`. Chúng ta không dùng cách làm này nữa. Nếu app của bạn dùng một codebase cũ hơn, hoặc bạn cần nâng cấp một codebase cũ, tôi khuyến nghị bạn đọc thêm ấn bản đầu tiên của *Spring Security in Action*.

### 2.3.3 Cấu hình theo nhiều cách khác nhau

Một trong những khía cạnh gây nhầm lẫn khi tạo cấu hình với Spring Security là việc có nhiều cách để cấu hình cùng một thứ. Trong mục này, bạn sẽ học các cách thay thế để cấu hình `UserDetailsService` và `PasswordEncoder`. Việc biết những lựa chọn mình có là rất cần thiết để bạn có thể nhận ra chúng trong các ví dụ bạn gặp trong cuốn sách này hoặc từ những nguồn khác như blog và bài viết. Điều quan trọng nữa là bạn hiểu cách và khi nào nên dùng chúng trong ứng dụng của mình. Các chương sau sẽ trình bày những ví dụ khác nhau mở rộng thông tin trong mục này.

Hãy lấy project đầu tiên. Sau khi tạo một ứng dụng mặc định, chúng ta đã ghi đè được `UserDetailsService` và `PasswordEncoder` bằng cách thêm các hiện thực mới dưới dạng bean trong Spring context. Hãy tìm một cách khác để thực hiện cùng những cấu hình đó cho `UserDetailsService` và `PasswordEncoder`.

Chúng ta có thể dùng trực tiếp bean `SecurityFilterChain` để thiết lập cả `UserDetailsService` lẫn `PasswordEncoder`, như trình bày ở listing sau. Bạn có thể tìm thấy ví dụ này trong project `ssia-ch2-ex3`.

**Listing 2.9 Thiết lập `UserDetailsService` bằng bean `SecurityFilterChain`**

```java
@Configuration
public class ProjectConfig {

  @Bean
  public SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    http.httpBasic(Customizer.withDefaults());
    http.authorizeHttpRequests(
        c -> c.anyRequest().authenticated()
    );

    var user = User.withUsername("john")              // ①
        .password("12345")
        .authorities("read")
        .build();

    var userDetailsService =                          // ②
      new InMemoryUserDetailsManager(user);

    http.userDetailsService(userDetailsService);      // ③

    return http.build();
  }

  // Phần code được lược bỏ
}
```

① Định nghĩa một user với đầy đủ thông tin của nó.

② Khai báo một `UserDetailsService` để lưu user trong bộ nhớ và thêm user để được quản lý bởi `UserDetailsService` của chúng ta.

③ `UserDetailsService` giờ được thiết lập thông qua bean `SecurityFilterChain`.

Ở listing 2.9, bạn có thể thấy chúng ta khai báo `UserDetailsService` theo cùng cách như ở listing 2.5. Khác biệt là việc này giờ được thực hiện cục bộ bên trong phương thức bean tạo ra `SecurityFilterChain`. Chúng ta cũng gọi phương thức `userDetailsService()` từ `HttpSecurity` để đăng ký instance `UserDetailsService`. Listing kế tiếp cho thấy toàn bộ nội dung của configuration class.

**Listing 2.10 Định nghĩa đầy đủ của configuration class**

```java
@Configuration
public class ProjectConfig {

  @Bean
  SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    http.httpBasic(Customizer.withDefaults());
    http.authorizeHttpRequests(
        c -> c.anyRequest().authenticated()
    );

    var user = User.withUsername("john")              // ①
        .password("12345")
        .authorities("read")
        .build();

    var userDetailsService =                          // ②
        new InMemoryUserDetailsManager(user);

    http.userDetailsService(userDetailsService);      // ③

    return http.build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
  }
}
```

① Tạo một user mới.

② Thêm user để được quản lý bởi `UserDetailsService` của chúng ta.

③ Cấu hình `UserDetailsService`.

Bất kỳ lựa chọn cấu hình nào trong số này cũng đều đúng. Lựa chọn đầu tiên, nơi chúng ta thêm các bean vào context, cho phép bạn inject các giá trị đó vào một class khác nơi bạn có thể cần đến chúng. Nhưng nếu bạn không cần điều đó cho trường hợp của mình, lựa chọn thứ hai cũng tốt không kém.

### 2.3.4 Định nghĩa logic authentication tùy chỉnh

Như bạn đã quan sát, các component của Spring Security cung cấp rất nhiều linh hoạt, mang tới nhiều lựa chọn khi điều chỉnh chúng cho phù hợp với kiến trúc ứng dụng của chúng ta. Cho tới giờ, bạn đã học được mục đích của `UserDetailsService` và `PasswordEncoder` trong kiến trúc Spring Security. Bạn cũng đã thấy một vài cách cấu hình chúng. Đã đến lúc học cách bạn cũng có thể tùy chỉnh component ủy quyền cho hai cái đó — `AuthenticationProvider`, như trình bày ở hình 2.3.

`AuthenticationProvider` hiện thực logic authentication và ủy quyền cho `UserDetailsService` và `PasswordEncoder` để quản lý user và password. Vì thế, có thể nói rằng với mục này, chúng ta tiến sâu thêm một bước vào kiến trúc authentication để học cách hiện thực logic authentication tùy chỉnh với `AuthenticationProvider`.

Vì đây là ví dụ đầu tiên, tôi chỉ cho bạn một bức tranh sơ lược để bạn hiểu rõ hơn mối quan hệ giữa các component trong kiến trúc. Nhưng chúng ta sẽ đi vào chi tiết hơn ở các chương 3 đến 6.

Tôi khuyến nghị bạn nên cân nhắc các trách nhiệm đúng như chúng được thiết kế trong kiến trúc Spring Security. Kiến trúc này có tính liên kết lỏng (loosely coupled) với các trách nhiệm được phân chia mịn (fine-grained). Thiết kế đó là một trong những điều làm cho Spring Security linh hoạt và dễ tích hợp với ứng dụng của bạn. Tùy vào cách bạn tận dụng sự linh hoạt của nó, bạn cũng có thể thay đổi cả thiết kế. Bạn phải cẩn trọng với những cách tiếp cận này vì chúng có thể làm phức tạp giải pháp của bạn. Ví dụ, bạn có thể chọn ghi đè `AuthenticationProvider` mặc định theo cách mà bạn không còn cần tới `UserDetailsService` hay `PasswordEncoder` nữa. Với điều đó trong đầu, listing 2.11 cho thấy cách tạo một authentication provider tùy chỉnh. Bạn có thể tìm thấy ví dụ này trong project `ssia-ch2-ex4`.

![Hình 2.3](images/ch02/ch02-fig03.png)

**Hình 2.3** `AuthenticationProvider` hiện thực logic authentication. Nó nhận request từ `AuthenticationManager` và ủy quyền việc tìm user cho một `UserDetailsService`, việc kiểm chứng password cho một `PasswordEncoder`.

**Listing 2.11 Hiện thực interface `AuthenticationProvider`**

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

  @Override
  public Authentication authenticate(Authentication authentication)
      throws AuthenticationException {
    // logic authentication ở đây
  }

  @Override
  public boolean supports(Class<?> authenticationType) {
    // kiểu của hiện thực Authentication ở đây
  }
}
```

Phương thức `authenticate(Authentication authentication)` đại diện cho toàn bộ logic authentication, nên chúng ta sẽ thêm một hiện thực như ở listing 2.12. Tôi sẽ giải thích chi tiết cách dùng phương thức `supports()` ở chương 6. Lúc này, tôi khuyến nghị bạn cứ tạm chấp nhận hiện thực của nó. Nó không thiết yếu cho ví dụ hiện tại.

**Listing 2.12 Hiện thực logic authentication**

```java
@Override
public Authentication authenticate(
   Authentication authentication)
     throws AuthenticationException {

   String username = authentication.getName();      // ①
   String password = String.valueOf(
      authentication.getCredentials());

   if ("john".equals(username) &&                   // ②
       "12345".equals(password)) {
     return new UsernamePasswordAuthenticationToken(
                   username,
                   password,
                   Arrays.asList());
   } else {
     throw new AuthenticationCredentialsNotFoundException("Error!");
   }
}
```

① Phương thức `getName()` được `Authentication` kế thừa từ interface `Principal`.

② Điều kiện này thông thường sẽ gọi `UserDetailsService` và `PasswordEncoder` để kiểm tra username và password.

Ở đây điều kiện của mệnh đề if-else đang thay thế trách nhiệm của `UserDetailsService` và `PasswordEncoder`. Bạn không bắt buộc phải dùng hai bean này, nhưng nếu bạn làm việc với user và password cho authentication, tôi rất khuyến nghị bạn tách riêng logic quản lý chúng. Hãy áp dụng nó đúng như kiến trúc Spring Security đã thiết kế, ngay cả khi bạn ghi đè hiện thực authentication.

Bạn có thể thấy hữu ích khi thay thế logic authentication bằng cách hiện thực `AuthenticationProvider` của riêng mình. Nếu hiện thực mặc định không hoàn toàn phù hợp với yêu cầu của ứng dụng, bạn có thể quyết định hiện thực logic authentication tùy chỉnh. Hiện thực `AuthenticationProvider` đầy đủ trông như ở listing kế tiếp.

**Listing 2.13 Hiện thực đầy đủ của authentication provider**

```java
@Component
public class CustomAuthenticationProvider
  implements AuthenticationProvider {

  @Override
  public Authentication authenticate(
     Authentication authentication)
       throws AuthenticationException {

      String username = authentication.getName();
      String password = String.valueOf(authentication.getCredentials());

      if ("john".equals(username) &&
          "12345".equals(password)) {
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

Trong configuration class, bạn có thể đăng ký `AuthenticationProvider` bằng phương thức `authenticationProvider()` của `HttpSecurity`, như trình bày ở listing sau đây.

**Listing 2.14 Đăng ký hiện thực mới của `AuthenticationProvider`**

```java
@Configuration
public class ProjectConfig {

  private final CustomAuthenticationProvider authenticationProvider;

  public ProjectConfig(
    CustomAuthenticationProvider authenticationProvider) {
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

Giờ bạn có thể gọi endpoint, endpoint này truy cập được bởi user duy nhất được nhận diện theo logic authentication đã định nghĩa là `john`, với password `12345`:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Response body là

```
Hello!
```

Ở chương 6, bạn sẽ học thêm về `AuthenticationProvider` và cách ghi đè hành vi của nó trong tiến trình authentication. Cũng trong chương đó, chúng ta sẽ bàn về interface `Authentication` và các hiện thực của nó, chẳng hạn `UserPasswordAuthenticationToken`.

### 2.3.5 Sử dụng nhiều configuration class

Trong những ví dụ đã hiện thực trước đó, chúng ta chỉ dùng một configuration class. Tuy nhiên, việc tách biệt các trách nhiệm ngay cả với configuration class cũng là một thực hành tốt. Chúng ta cần sự tách biệt này vì cấu hình bắt đầu trở nên phức tạp hơn. Trong một ứng dụng sẵn sàng chạy production, bạn có lẽ có nhiều khai báo hơn so với các ví dụ đầu tiên của chúng ta. Bạn cũng có thể thấy hữu ích khi có nhiều hơn một configuration class để làm project dễ đọc hơn.

Luôn là thực hành tốt khi chỉ có một class cho mỗi trách nhiệm. Với ví dụ này, chúng ta có thể tách cấu hình quản lý user khỏi cấu hình authorization. Chúng ta làm điều đó bằng cách định nghĩa hai configuration class: `UserManagementConfig` (định nghĩa ở listing kế tiếp) và `WebAuthorizationConfig` (định nghĩa ở listing 2.16). Bạn có thể tìm thấy ví dụ này trong project `ssia-ch2-ex5`.

**Listing 2.15 Định nghĩa configuration class cho việc quản lý user và password**

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

Trong trường hợp này, class `UserManagementConfig` chỉ chứa hai bean chịu trách nhiệm quản lý user: `UserDetailsService` và `PasswordEncoder`. Listing kế tiếp trình bày định nghĩa này.

**Listing 2.16 Định nghĩa configuration class cho việc quản lý authorization**

```java
@Configuration
public class WebAuthorizationConfig {

  @Bean
  SecurityFilterChain configure(HttpSecurity http)
    throws Exception {

    http.httpBasic(Customizer.withDefaults());
    http.authorizeHttpRequests(
        c -> c.anyRequest().authenticated()
    );

    return http.build();
  }
}
```

Ở đây class `WebAuthorizationConfig` cần định nghĩa một bean kiểu `SecurityFilterChain` để cấu hình các quy tắc authentication và authorization.

---

## Tóm tắt

- Spring Boot cung cấp một số cấu hình mặc định khi bạn thêm Spring Security vào các dependency của ứng dụng.
- Bạn hiện thực những component cơ bản sau cho authentication và authorization: `UserDetailsService`, `PasswordEncoder`, và `AuthenticationProvider`.
- Bạn có thể định nghĩa user bằng class `User`. Một user nên có ít nhất một username, một password, và một authority. Authority là những hành động mà bạn cho phép user thực hiện trong ngữ cảnh của ứng dụng.
- Một hiện thực đơn giản của `UserDetailsService` mà Spring Security cung cấp là `InMemoryUserDetailsManager`. Bạn có thể thêm user vào instance `UserDetailsService` kiểu này để quản lý user trong bộ nhớ của ứng dụng.
- `NoOpPasswordEncoder` là một hiện thực của contract `PasswordEncoder` sử dụng password ở dạng cleartext. Hiện thực này tốt cho các ví dụ học tập và (có thể) cho proof of concept, nhưng không dành cho ứng dụng sẵn sàng chạy production.
- Bạn có thể dùng contract `AuthenticationProvider` để hiện thực logic authentication tùy chỉnh trong ứng dụng.
- Có nhiều cách để viết cấu hình, nhưng trong một ứng dụng đơn lẻ, bạn nên chọn và bám theo một cách tiếp cận. Điều này giúp code của bạn sạch hơn và dễ hiểu hơn.
