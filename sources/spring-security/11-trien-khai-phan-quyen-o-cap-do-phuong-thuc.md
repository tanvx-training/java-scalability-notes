# Chương 11: Triển khai phân quyền ở cấp độ phương thức

**Nội dung chương này gồm**

- Bảo mật cấp độ phương thức trong các ứng dụng Spring

- Ủy quyền trước (Preauthorization) các phương thức dựa trên quyền hạn (authorities), vai trò (roles) và quyền truy cập (permissions)

- Ủy quyền sau (Postauthorization) các phương thức dựa trên quyền hạn, vai trò và quyền truy cập

Cho đến lúc này, chúng ta mới chỉ nghiên cứu các phương thức cấu hình xác thực (authentication) khác nhau. Chúng ta đã tiếp cận giải pháp cơ bản nhất là HTTP Basic ở Chương 2, và sau đó tìm hiểu cách thiết lập trang đăng nhập (form login) ở Chương 6. Tuy nhiên, về mặt phân quyền (authorization), chúng ta chỉ mới dừng lại ở việc cấu hình ở cấp độ endpoint (URL). Vậy giả sử ứng dụng của bạn không phải là một ứng dụng web thì sao? Liệu bạn có thể tận dụng Spring Security cho các tác vụ xác thực và phân quyền hay không? Câu trả lời là có. Spring Security hoàn toàn tương thích và hoạt động xuất sắc ngay cả trong các kịch bản ứng dụng không sử dụng các endpoint HTTP. Trong chương này, bạn sẽ học cách thiết lập phân quyền trực tiếp ở cấp độ phương thức (method level). Chúng ta sẽ áp dụng giải pháp này cho cả ứng dụng web lẫn phi web, và kỹ thuật này được gọi là bảo mật phương thức (method security).

Đối với các ứng dụng phi web, bảo mật phương thức cho phép chúng ta áp dụng các quy tắc phân quyền chặt chẽ ngay cả khi hệ thống hoàn toàn không có các endpoint HTTP. Còn đối với các ứng dụng web, hướng tiếp cận này đem lại sự linh hoạt tối đa, cho phép áp dụng các chính sách phân quyền sâu vào các tầng (layer) khác nhau của mã nguồn chứ không chỉ giới hạn ở tầng tiếp nhận yêu cầu (endpoint). Hãy cùng đi sâu vào nội dung chương này để khám phá cách thức thiết lập phân quyền cấp độ phương thức bằng tính năng bảo mật phương thức.

## 11.1 Kích hoạt bảo mật phương thức

Phần này sẽ hướng dẫn bạn cách kích hoạt cơ chế phân quyền ở cấp độ phương thức, đồng thời giới thiệu các tùy chọn linh hoạt mà Spring Security cung cấp để thực thi các chính sách kiểm soát truy cập khác nhau. Đây là một kỹ năng cực kỳ quan trọng và không thể thiếu, giúp bạn giải quyết triệt để những bài toán phân quyền phức tạp mà việc cấu hình ở cấp độ endpoint đơn thuần không thể đáp ứng được.

Theo mặc định, tính năng bảo mật phương thức sẽ bị tắt. Do đó, để khai thác chức năng này, bước đầu tiên bạn cần làm là kích hoạt nó. Bảo mật phương thức mang lại nhiều giải pháp khác nhau để thực thi phân quyền. Chúng ta sẽ cùng thảo luận về các giải pháp này và tiến hành hiện thực hóa chúng qua các ví dụ thực tiễn trong chương này cũng như ở Chương 12. Nhìn chung, tính năng bảo mật phương thức toàn cục (global method security) tập trung vào hai cơ chế cốt lõi sau:

- Ủy quyền cuộc gọi (Call authorization) — Quyết định xem một người dùng có quyền gọi một phương thức hay không dựa trên các quy tắc đặc quyền được thiết lập (tiền ủy quyền - preauthorization), hoặc quyết định xem họ có thể truy cập vào kết quả trả về sau khi phương thức đã thực thi xong hay không (hậu ủy quyền - postauthorization).

- Lọc dữ liệu (Filtering) — Quyết định những dữ liệu nào mà một phương thức được phép tiếp nhận thông qua các tham số đầu vào (tiền lọc - prefiltering), cũng như những dữ liệu nào mà phía gọi sẽ nhận lại từ phương thức sau khi thực thi hoàn tất (hậu lọc - postfiltering). Chúng ta sẽ thảo luận chi tiết và triển khai cơ chế lọc này trong Chương 12.

### 11.1.1 Tìm hiểu về ủy quyền cuộc gọi (Call Authorization)

Một trong những hướng tiếp cận cấu hình bảo mật phương thức phổ biến nhất chính là ủy quyền cuộc gọi (call authorization). Cơ chế này thiết lập các quy tắc để kiểm soát xem một phương thức có được phép kích hoạt hay không, hoặc cho phép phương thức đó chạy bình thường rồi mới quyết định xem đối tượng gọi có quyền nhận về kết quả trả về hay không. Thông thường, việc cho phép truy cập vào một khối logic nghiệp vụ nào đó sẽ phụ thuộc trực tiếp vào các tham số đầu vào hoặc kết quả đầu ra của chính nó. Ngay sau đây, chúng ta sẽ phân tích sâu hơn về ủy quyền cuộc gọi và ứng dụng nó qua các ví dụ cụ thể.

Cơ chế vận hành của bảo mật phương thức hoạt động như thế nào? Khi chúng ta kích hoạt tính năng bảo mật phương thức, Spring Security sẽ tự động thiết lập và kích hoạt một Spring aspect 13. Aspect này sẽ can thiệp và chặn (intercept) mọi cuộc gọi hướng tới các phương thức đã được áp dụng quy tắc phân quyền. Dựa vào các quy tắc này, nó sẽ quyết định xem có cho phép tiếp tục chuyển tiếp cuộc gọi đến phương thức đích hay không.

Rất nhiều tính năng cốt lõi trong Spring Framework được xây dựng dựa trên nền tảng lập trình hướng khía cạnh (AOP). Bảo mật phương thức chỉ là một trong số rất nhiều thành phần của Spring hoạt động dựa trên cơ chế này. Nếu cần ôn lại kiến thức về khía cạnh (aspect) và AOP, bạn có thể tham khảo Chương 6 trong cuốn sách Spring Start Here (Manning, 2021) do chính tôi biên soạn. Nhìn chung, chúng ta có thể phân loại ủy quyền cuộc gọi thành hai dạng chính:

- Tiền ủy quyền (Preauthorization) — Khung công nghệ (framework) tiến hành kiểm tra các quy tắc phân quyền trước khi phương thức được gọi.

- Hậu ủy quyền (Postauthorization) — Khung công nghệ thực hiện kiểm tra các quy tắc phân quyền sau khi phương thức đã thực thi xong.

Hãy cùng phân tích chi tiết cả hai hướng tiếp cận này và hiện thực hóa chúng qua các ví dụ cụ thể.

**Sử dụng tiền ủy quyền (preauthorization) để bảo vệ quyền truy cập phương thức**

Hãy tưởng tượng chúng ta có một phương thức `findDocumentsByUser(String username)` dùng để tìm kiếm và trả về các tài liệu của một người dùng cụ thể. Người gọi phương thức sẽ truyền vào tham số `username` để chỉ định đối tượng cần lấy tài liệu. Giả sử yêu cầu nghiệp vụ đặt ra là người dùng sau khi đăng nhập chỉ được phép truy xuất tài liệu của chính họ. Liệu chúng ta có thể áp dụng một quy tắc bảo mật để phương thức này chỉ thực thi khi tham số `username` truyền vào trùng khớp với tên của người dùng đang đăng nhập hay không? Câu trả lời là hoàn toàn có thể! Và đó chính là nhiệm vụ của cơ chế tiền ủy quyền (preauthorization).

Khi chúng ta thiết lập các quy tắc phân quyền nhằm ngăn chặn tuyệt đối việc thực thi một phương thức trong các điều kiện không hợp lệ, kỹ thuật đó được gọi là tiền ủy quyền (preauthorization). Với giải pháp này, framework sẽ xác thực các điều kiện bảo mật trước khi cho phép phương thức chạy. Nếu người gọi không đáp ứng đủ các tiêu chuẩn bảo mật mà chúng ta đã định nghĩa, framework sẽ lập tức chặn cuộc gọi lại và ném ra ngoại lệ `AccessDeniedException` thay vì chuyển tiếp yêu cầu đến phương thức đích. Đây là giải pháp được áp dụng phổ biến nhất trong bảo mật phương thức toàn cục.

Về mặt bảo mật, nguyên tắc tối ưu là không cho phép bất kỳ khối logic nào được chạy nếu các điều kiện tiên quyết chưa được thỏa mãn. Bạn hoàn toàn có thể cấu hình các điều kiện này dựa trên thông tin của người dùng hiện tại, đồng thời đối chiếu trực tiếp với các giá trị tham số được truyền vào phương thức.

**Sử dụng hậu ủy quyền (postauthorization) để bảo vệ cuộc gọi phương thức**

Trong trường hợp chúng ta cho phép người dùng kích hoạt phương thức nhưng lại muốn kiểm soát việc họ có được quyền nhận kết quả đầu ra hay không, chúng ta sẽ áp dụng cơ chế hậu ủy quyền (postauthorization). Với giải pháp này, Spring Security sẽ chỉ thực hiện kiểm tra các điều kiện bảo mật sau khi phương thức đã chạy xong. Bạn có thể tận dụng cơ chế này để hạn chế quyền truy cập vào dữ liệu trả về dựa trên các điều kiện động. Vì quá trình xác thực diễn ra sau khi logic phương thức hoàn tất, bạn có toàn quyền kiểm tra và đánh giá trực tiếp trên chính đối tượng kết quả trả về.

Thông thường, hậu ủy quyền được sử dụng để thực thi các quy tắc kiểm soát truy cập dựa trên nội dung cụ thể của đối tượng trả về. Tuy nhiên, hãy cực kỳ lưu ý khi sử dụng cơ chế này! Nếu phương thức có thực hiện các thao tác thay đổi dữ liệu (mutation) trong quá trình chạy, những thay đổi đó vẫn sẽ được ghi nhận vào hệ thống bất kể quá trình phân quyền sau đó có thành công hay thất bại.

> **LƯU Ý** Ngay cả khi sử dụng annotation `@Transactional`, các thay đổi dữ liệu cũng sẽ không được hoàn tác (rollback) nếu quá trình hậu ủy quyền thất bại. Lý do là bởi ngoại lệ do cơ chế hậu ủy quyền ném ra chỉ xuất hiện sau khi bộ quản lý giao dịch (transaction manager) đã thực hiện cam kết (commit) giao dịch thành công.

### 11.1.2 Kích hoạt bảo mật phương thức trong dự án của bạn

Trong phần này, chúng ta sẽ bắt tay vào xây dựng một dự án thực tế để áp dụng các tính năng tiền ủy quyền và hậu ủy quyền của cơ chế bảo mật phương thức. Cần lưu ý rằng tính năng này không được bật sẵn trong các dự án Spring Security. Để sử dụng, bạn phải chủ động kích hoạt nó bằng cách khai báo annotation `@EnableMethodSecurity` ngay phía trên lớp cấu hình chính của ứng dụng.

Tôi đã khởi tạo một dự án mới cho ví dụ này với tên gọi `ssia-ch11-ex1`. Trong dự án, tôi xây dựng lớp cấu hình `ProjectConfig` như được mô tả trong Mã nguồn 11.1. Tại lớp cấu hình này, chúng ta sẽ khai báo annotation `@EnableMethodSecurity`. Bảo mật phương thức mang lại ba hướng tiếp cận chính để thiết lập các quy tắc phân quyền mà chúng ta sẽ lần lượt nghiên cứu trong chương này:

- Các annotation tiền/hậu ủy quyền (được kích hoạt theo mặc định)

- Annotation tiêu chuẩn JSR 250: `@RolesAllowed`

- Annotation `@Secured`

Vì trong hầu hết các dự án thực tế, các annotation tiền/hậu ủy quyền là giải pháp tối ưu và được sử dụng rộng rãi nhất, chúng ta sẽ tập trung phân tích sâu vào cơ chế này. Tiền/hậu ủy quyền sẽ tự động được kích hoạt ngay khi bạn khai báo annotation `@EnableMethodSecurity`. Một vài nét tổng quan về hai tùy chọn còn lại sẽ được giới thiệu ngắn gọn ở phần cuối của chương.

**Mã nguồn 11.1 Kích hoạt bảo mật phương thức**

```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {
}
```

Bạn có thể kết hợp cơ chế bảo mật phương thức toàn cục với bất kỳ giải pháp xác thực nào, từ xác thực cơ bản HTTP Basic cho đến mô hình nâng cao OAuth 2 (sẽ được giới thiệu chi tiết ở phần ba của cuốn sách này). Để đơn giản hóa luồng xử lý giúp bạn tập trung hoàn toàn vào các kiến thức mới, chúng ta sẽ triển khai bảo mật phương thức song hành cùng xác thực HTTP Basic. Do đó, tệp cấu hình `pom.xml` của dự án trong chương này chỉ cần khai báo các dependency của Spring Web và Spring Security như sau:

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

> **LƯU Ý** Trong các phiên bản Spring Security cũ hơn (trước bản 6), chúng ta phải sử dụng annotation `@EnableGlobalMethodSecurity` và các tính năng tiền/hậu ủy quyền không tự động được kích hoạt sẵn. Nếu bạn đang làm việc trên các dự án cũ sử dụng các phiên bản này, nội dung Chương 16 trong ấn bản đầu tiên của cuốn Spring Security in Action sẽ là một tài liệu tham khảo rất hữu ích cho bạn.

## 11.2 Áp dụng các quy tắc tiền ủy quyền

Trong phần này, chúng ta sẽ cùng xây dựng một ví dụ thực tế về tiền ủy quyền (preauthorization). Chúng ta sẽ tiếp tục phát triển trên dự án `ssia-ch11-ex1` đã khởi tạo ở phần 11.1. Như đã phân tích, cơ chế tiền ủy quyền cho phép chúng ta định nghĩa các quy tắc bảo mật nghiêm ngặt để Spring Security kiểm tra trước khi quyết định có cho phép thực thi một phương thức cụ thể hay không. Nếu các quy tắc này bị vi phạm, phương thức đích chắc chắn sẽ không được chạy.

Kịch bản của ứng dụng mẫu này vô cùng đơn giản: hệ thống cung cấp một endpoint `/hello` trả về chuỗi `"Hello"` kèm theo tên của người dùng. Để lấy được tên này, lớp controller sẽ gọi đến một phương thức dịch vụ (service method). Phương thức dịch vụ này đã được áp dụng quy tắc tiền ủy quyền để kiểm tra xem người dùng hiện tại có sở hữu quyền ghi (`write`) hay không.

Tôi đã cấu hình thêm `UserDetailsService` và `PasswordEncoder` nhằm khởi tạo sẵn một số tài khoản người dùng thử nghiệm phục vụ cho việc xác thực. Để kiểm chứng tính đúng đắn của giải pháp, chúng ta sẽ tạo ra hai tài khoản: một người có quyền ghi (`write`) và người còn lại thì không. Chúng ta sẽ chứng minh rằng người dùng đầu tiên có thể truy cập endpoint một cách bình thường, trong khi người dùng thứ hai sẽ bị hệ thống chặn lại và ném ra ngoại lệ bảo mật ngay khi cố gắng gọi phương thức dịch vụ. Đoạn cấu hình hoàn chỉnh của lớp `ProjectConfig` được mô tả trong đoạn mã dưới đây.

**Mã nguồn 11.2 Lớp cấu hình cho UserDetailsService và PasswordEncoder**

```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {
 @Bean
 public UserDetailsService userDetailsService() {
 var service = new InMemoryUserDetailsManager();
 var u1 = User.withUsername("natalie")
 .password("12345")
 .authorities("read")
 .build();
 var u2 = User.withUsername("emma")
 .password("12345")
 .authorities("write")
 .build();
 service.createUser(u1);
 service.createUser(u2);
 return service;
 }
}

service.createUser(u2);
return service;
}

@Bean
public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
}
}
```

Để thiết lập quy tắc bảo mật cho phương thức dịch vụ này, chúng ta sử dụng annotation `@PreAuthorize`. Annotation này nhận tham số đầu vào là một biểu thức ngôn ngữ biểu diễn Spring (SpEL - Spring Expression Language) 14 mô tả chi tiết điều kiện phân quyền. Trong trường hợp này, chúng ta sẽ bắt đầu với một quy tắc vô cùng đơn giản.

Bạn có thể giới hạn quyền truy cập của người dùng dựa trên các quyền hạn (authorities) được cấp thông qua phương thức `hasAuthority()`. Phương thức này đã được chúng ta nghiên cứu kỹ lưỡng ở Chương 7 khi tìm hiểu về bảo mật cấp độ endpoint. Đoạn mã dưới đây định nghĩa lớp dịch vụ thực hiện nhiệm vụ cung cấp dữ liệu tên người dùng.

**Mã nguồn 11.3 Lớp dịch vụ định nghĩa quy tắc tiền ủy quyền trên phương thức**
```java
@Service
public class NameService {

    @PreAuthorize("hasAuthority('write')")
    public String getName() {
        return "Fantastico";
    }
}
```

Tiếp theo, chúng ta định nghĩa lớp controller trong đoạn mã dưới đây, sử dụng `NameService` làm thành phần phụ thuộc (dependency).

**Mã nguồn 11.4 Lớp controller triển khai endpoint và sử dụng dịch vụ**
```java
@RestController
public class HelloController {

    private final NameService nameService;

    // omitted constructor

    @GetMapping("/hello")
    public String hello() {
        return "Hello, " + nameService.getName();
    }
}
```

Lúc này, bạn có thể khởi động ứng dụng và kiểm thử tính năng bảo mật. Theo đúng cấu hình, chỉ tài khoản Emma mới được phép truy cập endpoint vì cô ấy là người duy nhất sở hữu quyền ghi (`write`). Đoạn mã dưới đây minh họa việc thực hiện các cuộc gọi API bằng hai tài khoản Emma và Natalie. Để gọi tới endpoint `/hello` dưới tư cách tài khoản Emma, hãy sử dụng lệnh cURL sau:

```bash
curl -u emma:12345 http://localhost:8080/hello
```

Phản hồi nhận được là:

```text
Hello, Fantastico
```

Để gọi tới endpoint `/hello` dưới tư cách tài khoản Natalie, hãy sử dụng lệnh cURL sau:

```bash
curl -u natalie:12345 http://localhost:8080/hello
```

Phản hồi nhận được là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/hello"
}
```

Hoàn toàn tương tự, bạn có thể áp dụng bất kỳ biểu thức SpEL nào khác đã được giới thiệu ở Chương 7 để bảo vệ phương thức của mình. Dưới đây là bảng tổng hợp nhanh các biểu thức phổ biến:

- `hasAnyAuthority()` — Chỉ định danh sách nhiều quyền hạn. Người dùng phải sở hữu ít nhất một trong số các quyền hạn này để được phép gọi phương thức.

- `hasRole()` — Chỉ định một vai trò cụ thể mà người dùng bắt buộc phải có để thực thi phương thức.

- `hasAnyRole()` — Chỉ định danh sách nhiều vai trò. Người dùng chỉ cần có ít nhất một trong các vai trò này để kích hoạt phương thức.

Hãy cùng nâng cấp ví dụ này để tìm hiểu cách tận dụng trực tiếp giá trị của các tham số truyền vào phương thức nhằm thiết lập các quy tắc phân quyền động. Toàn bộ mã nguồn minh họa cho phần này nằm trong thư mục dự án `ssia-ch11-ex2`.

Trong dự án này, tôi vẫn giữ nguyên lớp cấu hình `ProjectConfig` như ở ví dụ trước để chúng ta tiếp tục kiểm thử với hai tài khoản người dùng Emma và Natalie. Endpoint mới này sẽ tiếp nhận một giá trị thông qua tham số đường dẫn (path variable), sau đó gọi sang lớp dịch vụ để lấy ra các "biệt danh bí mật" (secret names) tương ứng với tên người dùng được truyền vào. Thực chất, khái niệm "biệt danh bí mật" ở đây chỉ là một giả định của tôi nhằm mô phỏng loại dữ liệu nhạy cảm của người dùng mà hệ thống cần bảo mật chặt chẽ. Lớp controller được định nghĩa chi tiết trong đoạn mã dưới đây.

**Mã nguồn 11.5 Lớp controller định nghĩa một endpoint để kiểm thử**
```java
@RestController
public class HelloController {

    private final NameService nameService;

    // omitted constructor

    @GetMapping("/secret/names/{name}")
    public List<String> names(@PathVariable String name) {
        return nameService.getSecretNames(name);
    }
}
```

Bây giờ, hãy cùng quan sát cách triển khai lớp `NameService` trong Mã nguồn 11.6. Biểu thức SpEL được sử dụng để phân quyền lúc này là `#name == authentication.principal.username`. Trong biểu thức này, cú pháp `#name` cho phép chúng ta tham chiếu trực tiếp đến giá trị của đối số `name` truyền vào phương thức `getSecretNames()`. Đồng thời, chúng ta cũng có quyền truy cập trực tiếp vào đối tượng `authentication` của Spring Security để lấy thông tin tài khoản đang đăng nhập. Biểu thức này thiết lập một ràng buộc: phương thức chỉ được phép thực thi khi và chỉ khi tên tài khoản đang đăng nhập trùng khớp hoàn toàn với giá trị tham số truyền vào. Nói một cách đơn giản, người dùng chỉ được phép truy xuất các biệt danh bí mật của chính họ.

**Mã nguồn 11.6 Lớp NameService định nghĩa phương thức được bảo vệ**
```java
@Service
public class NameService {

    private Map<String, List<String>> secretNames =
        Map.of(
            "natalie", List.of("Energico", "Perfecto"),
            "emma", List.of("Fantastico")
        );

    @PreAuthorize("#name == authentication.principal.username")
    public List<String> getSecretNames(String name) {
        return secretNames.get(name);
    }
}
```

Hãy cùng chạy thử ứng dụng và kiểm chứng kết quả. Đoạn mã dưới đây minh họa hành vi của hệ thống khi chúng ta gửi yêu cầu lên endpoint với tham số đường dẫn trùng khớp với tên tài khoản đang thực hiện đăng nhập:

```bash
curl -u emma:12345 http://localhost:8080/secret/names/emma
```

Kết quả trả về là:

```json
["Fantastico"]
```

Khi đăng nhập bằng tài khoản Emma nhưng lại cố gắng truy xuất danh sách biệt danh bí mật của Natalie, trình duyệt lập tức chặn phản hồi và trả về mã lỗi:

```bash
curl -u emma:12345 http://localhost:8080/secret/names/natalie
```

Kết quả trả về là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/secret/names/natalie"
}
```

Ngược lại, nếu tài khoản Natalie tự truy xuất thông tin của chính mình, yêu cầu sẽ được thực thi thành công. Đoạn mã dưới đây minh họa cho kịch bản này:

```bash
curl -u natalie:12345 http://localhost:8080/secret/names/natalie
```

Kết quả trả về là:

```json
["Energico","Perfecto"]
```

> **LƯU Ý** Đừng quên rằng bạn có thể áp dụng cơ chế bảo mật phương thức lên bất kỳ phân tầng nào của ứng dụng. Mặc dù các ví dụ trong chương này chủ yếu minh họa việc khai báo các quy tắc phân quyền trên tầng dịch vụ (service class), bạn hoàn toàn có thể triển khai chúng tại bất cứ đâu: từ controller, repository, cho đến các lớp quản lý (manager), proxy, v.v.

## 11.3 Áp dụng các quy tắc hậu ủy quyền

Giả sử nghiệp vụ yêu cầu cho phép phương thức thực thi bình thường, nhưng trong một số điều kiện đặc biệt, bạn cần ngăn không cho đối tượng gọi nhận được kết quả đầu ra. Khi cần kiểm tra các quy tắc bảo mật sau khi logic phương thức đã hoàn tất, chúng ta sử dụng kỹ thuật hậu ủy quyền (postauthorization). Ý tưởng này ban đầu nghe có vẻ khá kỳ lạ: tại sao lại cho phép chạy mã nguồn rồi lại giấu kết quả đi? Hãy tưởng tượng phương thức này có nhiệm vụ truy xuất dữ liệu nhạy cảm từ cơ sở dữ liệu hoặc từ một API bên ngoài. Các điều kiện phân quyền chỉ có thể được đánh giá chính xác sau khi dữ liệu thực tế đã được lấy ra thành công. Vì vậy, giải pháp tối ưu là cho phép phương thức chạy trước để lấy dữ liệu, sau đó kiểm tra dữ liệu kết quả trả về, nếu không thỏa mãn các tiêu chí bảo mật thì sẽ ngăn chặn không cho phía gọi tiếp cận dữ liệu đó. Để triển khai các quy tắc hậu ủy quyền trong Spring Security, chúng ta sử dụng annotation `@PostAuthorize`. Cách thức khai báo của nó hoàn toàn tương đồng với annotation `@PreAuthorize` đã học ở phần 11.2. `@PostAuthorize` cũng chấp nhận một biểu thức SpEL để mô tả điều kiện phân quyền. Tiếp theo, chúng ta sẽ cùng xây dựng một ví dụ cụ thể để xem cách thức vận hành của `@PostAuthorize` trong thực tế.

Kịch bản thử nghiệm lần này được hiện thực hóa trong dự án mang tên `ssia-ch11-ex3`. Chúng ta sẽ định nghĩa một đối tượng `Employee` đại diện cho thông tin nhân viên, bao gồm tên (`name`), danh sách sách (`books`) và danh sách vai trò (`roles`). Mỗi đối tượng `Employee` sẽ được liên kết chặt chẽ với một tài khoản người dùng của ứng dụng. Để duy trì tính đồng bộ xuyên suốt chương, chúng ta vẫn sử dụng hai tài khoản Emma và Natalie. Yêu cầu đặt ra là phía gọi chỉ được phép xem thông tin chi tiết của một nhân viên nếu nhân viên đó sở hữu vai trò là người đọc (`reader`). Vì chúng ta hoàn toàn không biết nhân viên đó có vai trò gì trước khi dữ liệu được truy xuất lên từ cơ sở dữ liệu, chúng ta bắt buộc phải thực hiện kiểm tra phân quyền sau khi phương thức dịch vụ chạy xong. Đó là lý do tại sao `@PostAuthorize` là sự lựa chọn duy nhất và tối ưu nhất trong tình huống này.

Lớp cấu hình chính của dự án này hoàn toàn tương tự như các ví dụ trước đó. Tuy nhiên, để bạn tiện theo dõi, tôi xin trình bày lại chi tiết lớp cấu hình này trong đoạn mã dưới đây.

**Mã nguồn 11.7 Kích hoạt bảo mật phương thức và định nghĩa danh sách người dùng**
```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var service = new InMemoryUserDetailsManager();

        var u1 = User.withUsername("natalie")
            .password("12345")
            .authorities("read")
            .build();

        var u2 = User.withUsername("emma")
            .password("12345")
            .authorities("write")
            .build();

        service.createUser(u1);
        service.createUser(u2);
        return service;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Chúng ta cần khai báo một lớp POJO đơn giản để biểu diễn đối tượng dữ liệu `Employee`. Lớp `Employee` được định nghĩa cụ thể trong đoạn mã dưới đây.

**Mã nguồn 11.8 Định nghĩa lớp Employee**
```java
public class Employee {
    private String name;
    private List<String> books;
    private List<String> roles;

    // Omitted constructor, getters, and setters
}
```

Trong các dự án thực tế, thông tin nhân viên thường được truy xuất từ cơ sở dữ liệu. Tuy nhiên, để tối giản hóa ví dụ, tôi sẽ sử dụng một cấu trúc `Map` lưu trữ sẵn một vài bản ghi để đóng vai trò là nguồn dữ liệu giả lập. Mã nguồn 11.9 mô tả chi tiết lớp `BookService`, đồng thời chứa phương thức dịch vụ được áp dụng quy tắc phân quyền. Hãy chú ý rằng biểu thức SpEL khai báo trong `@PostAuthorize` sử dụng từ khóa `returnObject` để tham chiếu trực tiếp đến đối tượng kết quả trả về của phương thức. Đây là tính năng đặc trưng của hậu ủy quyền, cho phép chúng ta kiểm tra dữ liệu đầu ra sau khi phương thức đã thực thi hoàn tất.

**Mã nguồn 11.9 Lớp BookService định nghĩa phương thức được phân quyền**
```java
@Service
public class BookService {

    private Map<String, Employee> records =
        Map.of(
            "emma", new Employee("Emma Thompson",
                List.of("Karamazov Brothers"),
                List.of("accountant", "reader")),
            "natalie", new Employee("Natalie Parker",
                List.of("Beautiful Paris"),
                List.of("researcher"))
        );

    @PostAuthorize("returnObject.roles.contains('reader')")
    public Employee getBookDetails(String name) {
        return records.get(name);
    }
}
```

Tiếp theo, chúng ta xây dựng một lớp controller và cấu hình một endpoint để gọi đến phương thức dịch vụ đã được bảo vệ nói trên. Lớp controller này được định nghĩa chi tiết trong đoạn mã dưới đây.

**Mã nguồn 11.10 Lớp controller triển khai endpoint**
```java
@RestController
public class BookController {

    private final BookService bookService;

    // omitted constructor

    @GetMapping("/book/details/{name}")
    public Employee getDetails(@PathVariable String name) {
        return bookService.getBookDetails(name);
    }
}
```

Giờ đây, bạn có thể khởi động ứng dụng và tiến hành thực hiện các cuộc gọi thử nghiệm. Các đoạn mã dưới đây minh họa các kịch bản thử nghiệm khác nhau. Bất kỳ tài khoản nào cũng có thể truy xuất thành công thông tin của Emma bởi danh sách vai trò của cô ấy chứa giá trị `"reader"`. Ngược lại, không tài khoản nào có quyền tiếp cận thông tin của Natalie. Để truy xuất thông tin của Emma dưới tư cách tài khoản Emma, hãy thực hiện lệnh sau:

```bash
curl -u emma:12345 http://localhost:8080/book/details/emma
```

Kết quả trả về là:

```json
{
  "name":"Emma Thompson",
  "books":["Karamazov Brothers"],
  "roles":["accountant","reader"]
}
```

Để truy xuất thông tin của Emma dưới tư cách tài khoản Natalie, chúng ta sử dụng lệnh:

```bash
curl -u natalie:12345 http://localhost:8080/book/details/emma
```

Kết quả trả về là:

```json
{
  "name":"Emma Thompson",
  "books":["Karamazov Brothers"],
  "roles":["accountant","reader"]
}
```

Khi cố gắng truy xuất thông tin của Natalie dưới tư cách tài khoản Emma, cuộc gọi API sẽ bị từ chối và trả về lỗi 403:

```bash
curl -u emma:12345 http://localhost:8080/book/details/natalie
```

Kết quả nhận về là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/book/details/natalie"
}
```

Thậm chí, ngay cả khi chính Natalie tự thực hiện truy xuất thông tin của chính mình, yêu cầu cũng bị chặn lại do tài khoản của cô ấy không có vai trò "reader":

```bash
curl -u natalie:12345 http://localhost:8080/book/details/natalie
```

Kết quả nhận về là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/book/details/natalie"
}
```

> **LƯU Ý** Bạn hoàn toàn có thể kết hợp đồng thời cả hai annotation `@PreAuthorize` và `@PostAuthorize` trên cùng một phương thức nếu nghiệp vụ của ứng dụng đòi hỏi phải thực thi cả hai bước kiểm tra tiền ủy quyền và hậu ủy quyền.

## 11.4 Triển khai quyền truy cập (Permissions) cho phương thức

Cho đến lúc này, bạn mới chỉ dừng lại ở việc áp dụng các biểu thức SpEL đơn giản, ngắn gọn cho các quy tắc tiền ủy quyền và hậu ủy quyền. Tuy nhiên, trong thực tế, các logic phân quyền thường rất phức tạp và khó có thể diễn đạt gãy gọn chỉ trong một dòng mã. Việc cố gắng nhồi nhét một logic nghiệp vụ cồng kềnh vào một biểu thức SpEL dài dằng dặc là một giải pháp cực kỳ tồi. Tôi khuyên bạn tuyệt đối không nên viết các biểu thức SpEL quá dài trong bất kỳ kịch bản nào, bởi nó sẽ làm cho mã nguồn trở nên rối rắm, cực kỳ khó đọc và ảnh hưởng nghiêm trọng đến khả năng bảo trì của hệ thống. Thay vào đó, giải pháp tối ưu nhất là tách biệt hoàn toàn phần logic phân quyền phức tạp đó ra một lớp Java độc lập. Spring Security hỗ trợ cơ chế này thông qua khái niệm quyền truy cập (permission), cho phép chúng ta đóng gói các quy tắc bảo mật vào các lớp chuyên biệt để giữ cho mã nguồn luôn sạch sẽ, trực quan và dễ hiểu.

Trong phần này, chúng ta sẽ cùng thực hành áp dụng các quy tắc phân quyền dựa trên cơ chế kiểm soát quyền hạn (permission) này thông qua dự án mẫu mang tên `ssia-ch11-ex4`. Kịch bản nghiệp vụ đặt ra như sau: chúng ta có một ứng dụng quản lý tài liệu, trong đó mỗi tài liệu sẽ thuộc sở hữu của một người dùng cụ thể (người trực tiếp tạo ra tài liệu đó). Để xem được thông tin chi tiết của một tài liệu, người dùng hiện tại bắt buộc phải là quản trị viên hệ thống (admin) hoặc phải là chính chủ sở hữu của tài liệu đó. Để hiện thực hóa yêu cầu này, chúng ta sẽ xây dựng một bộ đánh giá quyền hạn tùy biến (custom permission evaluator). Đầu tiên, hãy cùng định nghĩa đối tượng tài liệu qua lớp POJO đơn giản dưới đây.

**Mã nguồn 11.11 Lớp Document**
```java
public class Document {
    private String owner;
    // Omitted constructor, getters, and setters
}
```

Nhằm mục đích giả lập cơ sở dữ liệu để giữ cho ví dụ được gọn gàng và trực quan nhất, tôi sẽ tạo một lớp repository để quản lý một vài đối tượng tài liệu thử nghiệm bằng một cấu trúc `Map`. Lớp repository này được mô tả cụ thể trong đoạn mã dưới đây.

**Mã nguồn 11.12 Lớp DocumentRepository quản lý một số thực thể Document**
```java
@Repository
public class DocumentRepository {

    private Map<String, Document> documents =
        Map.of(
            "abc123", new Document("natalie"),
            "qwe123", new Document("natalie"),
            "asd555", new Document("emma")
        );

    public Document findDocument(String code) {
        return documents.get(code);
    }
}
```

Tiếp theo, chúng ta định nghĩa một lớp dịch vụ chứa phương thức gọi sang repository để lấy tài liệu dựa vào mã số (code) của nó. Đây chính là phương thức dịch vụ mà chúng ta sẽ áp dụng các chính sách bảo mật kiểm soát truy cập. Phương thức này sẽ được đánh dấu bằng annotation `@PostAuthorize` kết hợp với biểu thức SpEL sử dụng hàm `hasPermission()`. Hàm `hasPermission()` cho phép chúng ta liên kết trực tiếp tới một bộ đánh giá quyền hạn bên ngoài mà chúng ta sẽ xây dựng ở bước tiếp theo. Hãy chú ý rằng hai tham số được truyền vào hàm `hasPermission()` gồm có: `returnObject` (đối tượng kết quả trả về từ phương thức) và tên của vai trò được phép truy cập mặc định là `'ROLE_admin'`. Lớp dịch vụ này được cấu trúc như sau.

**Mã nguồn 11.13 Lớp DocumentService triển khai phương thức được bảo vệ**
```java
@Service
public class DocumentService {
    private final DocumentRepository documentRepository;

    // omitted constructor

    @PostAuthorize("hasPermission(returnObject, 'ROLE_admin')")
    public Document getDocument(String code) {
        return documentRepository.findDocument(code);
    }
}
```

Công việc cốt lõi của chúng ta lúc này là định nghĩa chi tiết logic đánh giá quyền hạn. Để làm được điều đó, chúng ta cần xây dựng một lớp hiện thực hóa interface (contract) `PermissionEvaluator` của Spring Security. Interface `PermissionEvaluator` cung cấp cho chúng ta hai phương thức nạp chồng để xử lý logic:

- Đánh giá theo đối tượng và quyền hạn (By object and permission) — Được áp dụng trực tiếp trong ví dụ này. Phương thức này tiếp nhận hai đối tượng đầu vào: đối tượng chịu sự kiểm soát của quy tắc phân quyền (target) và đối tượng chứa các thông tin bổ sung cần thiết cho việc đánh giá.

- Đánh giá theo mã định danh, loại đối tượng và quyền hạn (By object ID, object type, and permission) — Thường dùng khi chúng ta chưa có sẵn thực thể đối tượng trong tay mà chỉ có mã định danh (ID) của nó. Phương thức này tiếp nhận mã định danh để hỗ trợ truy xuất đối tượng từ database, chuỗi mô tả kiểu dữ liệu (để định tuyến nếu bộ đánh giá hỗ trợ nhiều kiểu đối tượng khác nhau) và đối tượng chứa thông tin quyền hạn bổ sung.

Đoạn mã dưới đây mô tả cấu trúc chi tiết của interface `PermissionEvaluator` với hai phương thức nạp chồng nói trên.

**Mã nguồn 11.14 Định nghĩa interface PermissionEvaluator**
```java
public interface PermissionEvaluator {

    boolean hasPermission(
        Authentication a,
        Object subject,
        Object permission
    );

    boolean hasPermission(
        Authentication a,
        Serializable id,
        String type,
        Object permission
    );
}
```

Trong phạm vi ví dụ này, chúng ta chỉ cần tập trung hiện thực hóa phương thức đầu tiên. Đối tượng cần đánh giá bảo mật (subject/target) ở đây chính là kết quả trả về từ phương thức dịch vụ, và chúng ta cũng truyền thêm tên vai trò cần kiểm tra là `'ROLE_admin'`. Đương nhiên, nếu muốn tối giản, chúng ta hoàn toàn có thể hard-code tên vai trò này trực tiếp bên trong lớp đánh giá quyền thay vì truyền động qua hàm `hasPermission()`. Tuy nhiên, việc truyền tham số động như ví dụ này sẽ giúp mã nguồn linh hoạt hơn rất nhiều trong các dự án thực tế phức tạp, nơi các phương thức khác nhau có các điều kiện và tham số bảo mật hoàn toàn khác nhau.

Để tránh những hiểu lầm không đáng có, tôi muốn nhấn mạnh rằng bạn không cần phải truyền đối tượng `Authentication` vào biểu thức SpEL của mình một cách thủ công. Spring Security sẽ tự động tìm kiếm đối tượng xác thực hiện tại trong `SecurityContext` và tiêm (inject) vào tham số này khi kích hoạt phương thức `hasPermission()`. Đoạn mã dưới đây định nghĩa chi tiết lớp `DocumentsPermissionEvaluator` thực thi nhiệm vụ đánh giá quyền hạn tùy biến.

**Mã nguồn 11.15 Hiện thực hóa quy tắc phân quyền**
```java
@Component
public class DocumentsPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(
        Authentication authentication,
        Object target,
        Object permission
    ) {
        Document document = (Document) target;
        String p = (String) permission;

        boolean admin = authentication.getAuthorities()
            .stream()
            .anyMatch(a -> a.getAuthority().equals(p));

        return admin || document.getOwner().equals(authentication.getName());
    }

    @Override
    public boolean hasPermission(
        Authentication authentication,
        Serializable targetId,
        String targetType,
        Object permission
    ) {
        return false;
    }
}
```

Để thông báo cho Spring Security biết và áp dụng lớp hiện thực `PermissionEvaluator` mới này, chúng ta bắt buộc phải đăng ký một bean kiểu `MethodSecurityExpressionHandler` ngay trong lớp cấu hình. Đoạn mã dưới đây hướng dẫn cách thiết lập một `MethodSecurityExpressionHandler` tùy biến để đăng ký bộ đánh giá quyền của chúng ta vào hệ thống.

**Mã nguồn 11.16 Cấu hình PermissionEvaluator trong lớp cấu hình**
```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

    private final DocumentsPermissionEvaluator evaluator;

    // omitted constructor

    @Bean
    protected MethodSecurityExpressionHandler createExpressionHandler() {
        var expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(evaluator);
        return expressionHandler;
    }

    // Omitted definition of the UserDetailsService and PasswordEncoder beans
}
```

> **LƯU Ý** Ở đây, chúng ta sử dụng lớp hiện thực có sẵn do Spring Security cung cấp là `DefaultMethodSecurityExpressionHandler`. Trong trường hợp nâng cao, bạn hoàn toàn có thể tự xây dựng một lớp kế thừa từ `MethodSecurityExpressionHandler` để tự định nghĩa các cú pháp SpEL tùy biến của riêng mình. Tuy nhiên, tình huống này rất hiếm khi xảy ra trong thực tế, vì vậy chúng ta sẽ không đi sâu vào xây dựng các thành phần tùy biến phức tạp đó mà chỉ dừng lại ở mức giới thiệu khả năng hỗ trợ của framework.

Để giúp bạn tập trung tối đa vào phần cấu hình bảo mật mới, tôi đã tách biệt phần định nghĩa các bean `UserDetailsService` và `PasswordEncoder` ra một mục riêng. Đoạn mã dưới đây mô tả phần còn lại của lớp cấu hình. Điểm quan trọng duy nhất bạn cần lưu ý chính là vai trò của các tài khoản thử nghiệm: tài khoản Natalie sở hữu vai trò `admin` (cho phép truy cập mọi tài liệu), còn tài khoản Emma sở hữu vai trò `manager` (chỉ được phép xem tài liệu của chính mình).

**Mã nguồn 11.17 Chi tiết toàn bộ lớp cấu hình**
```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

    private final DocumentsPermissionEvaluator evaluator;

    // Omitted constructor

    @Override
    protected MethodSecurityExpressionHandler createExpressionHandler() {
        var expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(evaluator);
        return expressionHandler;
    }
    @Bean
    public UserDetailsService userDetailsService() {
        var service = new InMemoryUserDetailsManager();

        var u1 = User.withUsername("natalie")
            .password("12345")
            .roles("admin")
            .build();

        var u2 = User.withUsername("emma")
            .password("12345")
            .roles("manager")
            .build();

        service.createUser(u1);
        service.createUser(u2);
        return service;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Để kiểm thử toàn bộ luồng hoạt động của ứng dụng, chúng ta khai báo một endpoint điều hướng trong lớp controller dưới đây.

**Mã nguồn 11.18 Định nghĩa lớp controller và triển khai endpoint**
```java
@RestController
public class DocumentController {

    private final DocumentService documentService;

    // Omitted constructor

    @GetMapping("/documents/{code}")
    public Document getDetails(@PathVariable String code) {
        return documentService.getDocument(code);
    }
}
```

Hãy khởi động ứng dụng và tiến hành thực hiện các cuộc gọi thử nghiệm. Natalie có quyền truy cập tất cả tài liệu bất kể chủ sở hữu là ai, trong khi Emma chỉ được phép truy xuất các tài liệu do chính cô tạo ra. Để truy xuất tài liệu của Natalie dưới tư cách tài khoản `"natalie"`, hãy chạy lệnh sau:

```bash
curl -u natalie:12345 http://localhost:8080/documents/abc123
```

Kết quả trả về là:

```json
{
  "owner":"natalie"
}
```

Để lấy thông tin tài liệu của Emma dưới tư cách tài khoản `"natalie"`, chúng ta thực hiện:

```bash
curl -u natalie:12345 http://localhost:8080/documents/asd555
```

Kết quả trả về là:

```json
{
  "owner":"emma"
}
```

Để lấy thông tin tài liệu của Emma dưới tư cách tài khoản `"emma"` (chính chủ sở hữu):

```bash
curl -u emma:12345 http://localhost:8080/documents/asd555
```

Kết quả trả về là:

```json
{
  "owner":"emma"
}
```

Tuy nhiên, khi dùng tài khoản `"emma"` để truy cập vào tài liệu thuộc quyền sở hữu của Natalie, hệ thống sẽ lập tức chặn lại và trả về lỗi 403 Forbidden:

```bash
curl -u emma:12345 http://localhost:8080/documents/abc123
```

Kết quả nhận được là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/documents/abc123"
}
```

Hoàn toàn tương tự, bạn có thể hiện thực hóa phương thức nạp chồng thứ hai của interface `PermissionEvaluator` để xây dựng biểu thức phân quyền cho riêng mình. Phương thức thứ hai này hoạt động dựa trên mã định danh (identifier) và loại đối tượng (target type) thay vì truyền trực tiếp toàn bộ thực thể dữ liệu. Ví dụ, giả sử chúng ta muốn thay đổi yêu cầu nghiệp vụ: thay vì kiểm tra sau khi chạy xong, chúng ta muốn áp dụng kiểm tra phân quyền trước khi thực thi phương thức thông qua annotation `@PreAuthorize`. Trong trường hợp này, vì phương thức dịch vụ chưa được chạy nên chúng ta chưa có đối tượng trả về (`returnObject`). Tuy nhiên, chúng ta lại sở hữu mã số tài liệu (document code) đóng vai trò là khóa chính duy nhất của thực thể. Đoạn mã dưới đây mô tả cách tinh chỉnh lớp đánh giá quyền để hiện thực hóa kịch bản này. Toàn bộ mã nguồn minh họa cho phần này nằm trong dự án mẫu `ssia-ch11-ex5`.

**Mã nguồn 11.19 Thay đổi trong lớp DocumentsPermissionEvaluator**
```java
@Component
public class DocumentsPermissionEvaluator implements PermissionEvaluator {
    private final DocumentRepository documentRepository;

    // Omitted constructor

    @Override
    public boolean hasPermission(
        Authentication authentication,
        Object target,
        Object permission
    ) {
        return false;
    }

    @Override
    public boolean hasPermission(
        Authentication authentication,
        Serializable targetId,
        String targetType,
        Object permission
    ) {
        String code = targetId.toString();
        Document document = documentRepository.findDocument(code);
        String p = (String) permission;

        boolean admin = authentication.getAuthorities()
            .stream()
            .anyMatch(a -> a.getAuthority().equals(p));

        return admin || document.getOwner().equals(authentication.getName());
    }
}
```

Đương nhiên, chúng ta cũng cần khai báo cấu trúc gọi hàm `hasPermission` tương ứng bên trong annotation `@PreAuthorize`. Mã nguồn 11.20 dưới đây mô tả các tinh chỉnh tương ứng trong lớp `DocumentService`.

**Mã nguồn 11.20 Lớp DocumentService**
```java
@Service
public class DocumentService {

    private final DocumentRepository documentRepository;

    // Omitted constructor

    @PreAuthorize("hasPermission(#code, 'document', 'ROLE_admin')")
    public Document getDocument(String code) {
        return documentRepository.findDocument(code);
    }
}
```

Lúc này, bạn có thể khởi động lại ứng dụng và thực hiện kiểm thử endpoint. Kết quả bảo mật thu được hoàn toàn trùng khớp với ví dụ trước đó khi chúng ta sử dụng phương thức đánh giá quyền đầu tiên: Natalie (quản trị viên) có toàn quyền truy xuất mọi tài liệu, trong khi Emma (quản lý) chỉ xem được tài liệu của riêng mình. Để lấy thông tin tài liệu của Natalie dưới tư cách tài khoản `"natalie"`, hãy chạy lệnh:

```bash
curl -u natalie:12345 http://localhost:8080/documents/abc123
```

Kết quả trả về là:

```json
{
  "owner":"natalie"
}
```

Tiếp tục kiểm chứng với tài liệu của Emma:

```bash
curl -u natalie:12345 http://localhost:8080/documents/asd555
```

Kết quả trả về là:

```json
{
  "owner":"emma"
}
```

Và khi Emma tự truy xuất tài liệu của mình:

```bash
curl -u emma:12345 http://localhost:8080/documents/asd555
```

Kết quả trả về là:

```json
{
  "owner":"emma"
}
```

Nhưng khi Emma tìm cách xem tài liệu của Natalie:

```bash
curl -u emma:12345 http://localhost:8080/documents/abc123
```

Hệ thống sẽ từ chối truy cập:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/documents/abc123"
}
```

### Sử dụng các annotation @Secured và @RolesAllowed

Xuyên suốt chương này, chúng ta đã cùng nghiên cứu sâu về các phương án triển khai phân quyền bằng cơ chế bảo mật phương thức toàn cục (global method security). Như đã tìm hiểu, tính năng này mặc định bị tắt và chúng ta cần sử dụng annotation `@EnableMethodSecurity` phía trên lớp cấu hình chính để kích hoạt nó. Điểm đặc biệt là khi khai báo tiền và hậu ủy quyền, bạn không cần phải chỉ định thêm bất cứ tham số hay thuộc tính bổ sung nào bên trong annotation `@EnableMethodSecurity`. Chúng ta chỉ cần khai báo đơn giản như sau:

```java
@EnableMethodSecurity
```

Annotation `@EnableMethodSecurity` cung cấp hai thuộc tính quan trọng để giúp kích hoạt các loại annotation bảo mật thay thế khác. Bạn sử dụng thuộc tính `jsr250Enabled` để kích hoạt annotation `@RolesAllowed` (tiêu chuẩn JSR-250) và thuộc tính `securedEnabled` để kích hoạt annotation `@Secured`. Về mặt tính năng, cả hai annotation này đều kém linh hoạt và mạnh mẽ hơn rất nhiều so với cặp bài trùng `@PreAuthorize` và `@PostAuthorize`, do đó tần suất chúng xuất hiện trong các dự án thực tế ngày nay là rất thấp. Tuy nhiên, tôi vẫn muốn giới thiệu sơ qua để bạn có cái nhìn toàn diện hơn mà không cần mất quá nhiều thời gian đi sâu vào chi tiết.

Để kích hoạt việc sử dụng hai annotation này, chúng ta chỉ cần chuyển giá trị của các thuộc tính tương ứng trong `@EnableMethodSecurity` thành `true`. Đoạn mã dưới đây minh họa cách thức cấu hình kích hoạt đồng thời cả hai thuộc tính này:

```java
@EnableMethodSecurity(
  jsr250Enabled = true,
  securedEnabled = true
)
```

Sau khi đã kích hoạt thành công, bạn có thể sử dụng trực tiếp các annotation `@RolesAllowed` hoặc `@Secured` để chỉ định cụ thể các vai trò hoặc quyền hạn cần có để thực thi phương thức. Đoạn mã dưới đây hướng dẫn cách cấu hình `@RolesAllowed` để chỉ cho phép tài khoản có vai trò `ADMIN` được phép gọi phương thức `getName()`:

```java
@Service
public class NameService {

    @RolesAllowed("ADMIN")
    public String getName() {
        return "Fantastico";
    }
}
```

Hoàn toàn tương tự, bạn có thể lựa chọn giải pháp sử dụng annotation `@Secured` thay thế cho `@RolesAllowed` như sau:

```java
@Service
public class NameService {

    @Secured("ROLE_ADMIN")
    public String getName() {
        return "Fantastico";
    }
}
```

Bây giờ bạn có thể tiến hành chạy thử và kiểm chứng kết quả của ví dụ này thông qua lệnh cURL dưới đây:

```bash
curl -u emma:12345 http://localhost:8080/hello
```

Kết quả trả về là:

```text
Hello, Fantastico
```

Để kiểm tra phản ứng của hệ thống khi dùng tài khoản Natalie không có vai trò phù hợp:

```bash
curl -u natalie:12345 http://localhost:8080/hello
```

Kết quả lỗi trả về là:

```json
{
  "status":403,
  "error":"Forbidden",
  "message":"Forbidden",
  "path":"/hello"
}
```

Bạn có thể tìm thấy toàn bộ mã nguồn hoàn chỉnh của ví dụ sử dụng các annotation `@RolesAllowed` và `@Secured` trong dự án mẫu `ssia-ch9-ex6`.

## Tóm tắt

- Spring Security hỗ trợ cấu hình các quy tắc phân quyền cho mọi phân tầng trong kiến trúc ứng dụng chứ không chỉ giới hạn riêng ở tầng endpoint. Để sử dụng tính năng này, chúng ta cần kích hoạt cơ chế bảo mật phương thức (method security).

- Tính năng bảo mật phương thức mặc định bị vô hiệu hóa. Để kích hoạt, chúng ta khai báo annotation `@EnableMethodSecurity` ngay trên lớp cấu hình chính.

- Bạn có thể thiết lập các chính sách phân quyền để hệ thống kiểm tra trước khi một phương thức được thực thi. Nếu các điều kiện bảo mật này không được thỏa mãn, phương thức đích sẽ bị chặn hoàn toàn. Kỹ thuật này được gọi là tiền ủy quyền (preauthorization).

- Để triển khai tiền ủy quyền, chúng ta sử dụng annotation `@PreAuthorize` đi kèm với một biểu thức SpEL để biểu diễn điều kiện bảo mật.

- Trong trường hợp chỉ muốn kiểm tra quyền truy cập của người dùng trên chính kết quả đầu ra sau khi phương thức đã thực thi xong, chúng ta sử dụng kỹ thuật hậu ủy quyền (postauthorization).

- Để triển khai hậu ủy quyền, chúng ta sử dụng annotation `@PostAuthorize` đi kèm với biểu thức SpEL tương ứng để thiết lập điều kiện kiểm tra.

- Khi gặp các kịch bản phân quyền phức tạp, bạn nên tách biệt hoàn toàn phần logic này ra một lớp riêng biệt để giữ cho mã nguồn luôn sạch sẽ và dễ đọc. Trong Spring Security, giải pháp chuẩn mực nhất là triển khai interface `PermissionEvaluator`.

- Spring Security vẫn duy trì khả năng tương thích ngược với các tiêu chuẩn cũ hơn thông qua các annotation `@RolesAllowed` và `@Secured`. Tuy nhiên, các annotation này kém mạnh mẽ hơn nhiều so với cặp đôi `@PreAuthorize` và `@PostAuthorize`, và chúng cực kỳ hiếm khi xuất hiện trong các dự án thực tế hiện nay.
