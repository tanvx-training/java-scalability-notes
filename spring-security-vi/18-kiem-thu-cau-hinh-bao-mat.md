# Chương 18: Kiểm thử cấu hình bảo mật

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm**

- Kiểm thử tích hợp cấu hình Spring Security cho các endpoint

- Định nghĩa người dùng giả lập cho các kiểm thử

- Kiểm thử tích hợp Spring Security đối với bảo mật cấp phương thức

- Kiểm thử các triển khai Spring dạng phản ứng

> Truyền thuyết kể rằng việc viết các bài kiểm thử đơn vị (unit test) và kiểm thử tích hợp (integration test) được bắt đầu bằng bài thơ ngắn sau:
>
> 99 con bọ nhỏ trong đoạn mã, 99 con bọ nhỏ. Tìm diệt một con, vá víu xung quanh, Lại có tận 113 con bọ nhỏ trong đoạn mã.
>
> —Khuyết danh

Theo thời gian, phần mềm ngày càng trở nên phức tạp và các đội ngũ phát triển cũng ngày một lớn hơn. Việc một cá nhân có thể nắm bắt toàn bộ các tính năng do người khác triển khai qua từng thời kỳ là điều bất khả thi. Các lập trình viên cần một phương thức để đảm bảo rằng họ không làm hỏng các tính năng hiện có trong quá trình sửa lỗi hoặc phát triển tính năng mới.

Trong quá trình phát triển ứng dụng, chúng ta liên tục viết các bài kiểm thử để xác nhận rằng các tính năng được triển khai hoạt động đúng như mong đợi. Lý do chính để chúng ta viết kiểm thử đơn vị và kiểm thử tích hợp là nhằm đảm bảo không làm phá vỡ các chức năng hiện tại khi thay đổi mã nguồn để sửa lỗi hoặc bổ sung tính năng mới. Quy trình này còn được gọi là kiểm thử hồi quy (regression testing).

Ngày nay, khi một lập trình viên hoàn thành việc thay đổi mã nguồn, họ sẽ tải các thay đổi đó lên một máy chủ quản lý phiên bản chung của toàn đội ngũ. Hành động này tự động kích hoạt một công cụ tích hợp liên tục (CI) để chạy toàn bộ các bài kiểm thử hiện có. Nếu bất kỳ thay đổi nào làm hỏng một tính năng đang hoạt động, các bài kiểm thử sẽ thất bại và công cụ tích hợp liên tục sẽ lập tức thông báo cho cả đội. Nhờ vậy, rủi ro chuyển giao các thay đổi gây ảnh hưởng xấu đến các tính năng hiện tại sẽ được giảm thiểu tối đa.

> **LƯU Ý** Việc tôi lấy ví dụ về Jenkins không có nghĩa đây là công cụ tích hợp liên tục duy nhất hay tốt nhất được sử dụng. Bạn có rất nhiều giải pháp thay thế khác để lựa chọn như Bamboo, GitLab CI, CircleCI, v.v.

Khi kiểm thử ứng dụng, bạn cần nhớ rằng đối tượng kiểm thử không chỉ giới hạn ở mã nguồn ứng dụng của bạn. Bạn cũng phải đảm bảo kiểm thử cả khả năng tích hợp với các thư viện và framework mà mình sử dụng. Trong tương lai, chắc chắn sẽ có lúc bạn cần nâng cấp các thư viện hoặc framework đó lên phiên bản mới. Khi thay đổi phiên bản của các dependency này, bạn muốn đảm bảo ứng dụng của mình vẫn tích hợp mượt mà với phiên bản mới. Nếu sự tích hợp không còn diễn ra như trước, bạn sẽ muốn dễ dàng định vị được những nơi cần chỉnh sửa để khắc phục các sự cố tích hợp đó.

Đó chính là lý do tại sao bạn cần nắm vững những nội dung sẽ được trình bày trong chương này — cách kiểm thử sự tích hợp giữa ứng dụng của bạn với Spring Security. Giống như hệ sinh thái Spring Framework nói chung, Spring Security phát triển rất nhanh chóng. Bạn có thể sẽ nâng cấp ứng dụng của mình lên các phiên bản mới, và chắc chắn bạn muốn biết liệu việc nâng cấp lên một phiên bản cụ thể nào đó có gây ra lỗ hổng bảo mật, lỗi hệ thống hay sự không tương thích nào trong ứng dụng hay không. Hãy nhớ lại điều chúng ta đã nhấn mạnh ngay từ chương đầu tiên: bạn cần phải xem xét vấn đề bảo mật ngay từ những bước thiết kế ứng dụng đầu tiên và phải thực sự nghiêm túc với nó. Việc viết các bài kiểm thử cho bất kỳ cấu hình bảo mật nào phải là một nhiệm vụ bắt buộc và cần được đưa vào định nghĩa về sự hoàn thành (definition of done) của bạn. Đừng bao giờ coi một nhiệm vụ là hoàn thành nếu các bài kiểm thử bảo mật chưa sẵn sàng.

Trong chương này, chúng ta sẽ thảo luận về một số phương pháp thực hành để kiểm thử khả năng tích hợp của ứng dụng với Spring Security. Chúng ta sẽ quay lại một số ví dụ đã thực hiện trong các chương trước, và bạn sẽ học cách viết các bài kiểm thử tích hợp cho các tính năng đã triển khai. Nhìn chung, kiểm thử luôn là một câu chuyện quan trọng, và việc tìm hiểu sâu chủ đề này sẽ mang lại cho bạn rất nhiều lợi ích.

Trong chương này, chúng ta sẽ tập trung vào việc kiểm thử tích hợp giữa ứng dụng và Spring Security. Trước khi bắt đầu các ví dụ, tôi muốn đề xuất một vài tài liệu đã giúp tôi hiểu sâu sắc về chủ đề này. Nếu bạn cần tìm hiểu chi tiết hơn, hoặc thậm chí chỉ muốn ôn lại kiến thức, bạn có thể đọc những cuốn sách sau. Tôi tin chắc rằng chúng sẽ hỗ trợ bạn rất nhiều!

- JUnit in Action, Third Edition viết bởi Cătălin Tudose và các cộng sự (Manning, 2020)

- Unit Testing Principles, Practices, and Patterns viết bởi Vladimir Khorikov (Manning, 2020)

- Testing Java Microservices viết bởi Alex Soto Bueno và các cộng sự (Manning, 2018)

Hành trình viết mã kiểm thử cho các triển khai bảo mật của chúng ta sẽ bắt đầu bằng việc kiểm thử các cấu hình phân quyền (authorization). Trong phần 18.1, bạn sẽ học cách bỏ qua bước xác thực (authentication) và định nghĩa người dùng giả lập để kiểm thử cấu hình phân quyền ở cấp độ endpoint. Tiếp theo, trong phần 18.2, bạn sẽ biết cách kiểm thử cấu hình phân quyền bằng cách sử dụng người dùng lấy từ một `UserDetailsService`. Trong phần 18.3, chúng ta sẽ thảo luận về cách thiết lập toàn bộ ngữ cảnh bảo mật (security context) trong trường hợp bạn cần sử dụng các triển khai cụ thể của đối tượng `Authentication`. Cuối cùng, trong phần 18.4, bạn sẽ áp dụng các phương pháp đã học ở các phần trước để kiểm thử cấu hình phân quyền đối với bảo mật cấp phương thức (method security).

Sau khi hoàn tất phần thảo luận về kiểm thử phân quyền, phần 18.5 sẽ hướng dẫn bạn cách kiểm thử luồng xác thực. Sau đó, trong các phần 18.6 và 18.7, chúng ta sẽ thảo luận về việc kiểm thử các cấu hình bảo mật khác, chẳng hạn như chống giả mạo yêu cầu chéo trang (CSRF) và chia sẻ tài nguyên chéo nguồn (CORS). Chương này sẽ khép lại với phần 18.8, thảo luận về các bài kiểm thử tích hợp giữa Spring Security và các ứng dụng phản ứng.

## 18.1 Sử dụng người dùng giả lập cho các kiểm thử

Phần này thảo luận về việc sử dụng người dùng giả lập (mock user) để kiểm thử cấu hình phân quyền. Đây là phương pháp đơn giản nhất và thường xuyên được sử dụng nhất để kiểm thử các cấu hình phân quyền. Khi sử dụng người dùng giả lập, bài kiểm thử sẽ hoàn toàn bỏ qua quá trình xác thực.

Việc triển khai các bài kiểm thử bỏ qua bước xác thực để tập trung vào phân quyền là rất phổ biến. Bạn không cần phải xác thực lại quá trình đăng nhập mỗi khi muốn kiểm tra xem hệ thống có áp dụng đúng quy tắc phân quyền hay không. Hãy nhớ rằng mặc dù xác thực và phân quyền phụ thuộc lẫn nhau, nhưng chúng lại hoàn toàn độc lập thông qua ngữ cảnh bảo mật (security context). Vì vậy, nếu muốn kiểm thử một cấu hình phân quyền một cách độc lập, bạn có thể định nghĩa một ngữ cảnh bảo mật giả lập và kiểm soát nó để kiểm thử tất cả các kịch bản phân quyền cần thiết. Trong hầu hết các trường hợp, một ứng dụng chỉ triển khai một số ít phương thức xác thực (thậm chí thường chỉ có một), nhưng lại có rất nhiều quy tắc phân quyền áp dụng cho các trường hợp sử dụng hoặc endpoint khác nhau. Do đó, việc viết các bài kiểm thử phân quyền độc lập sẽ tối ưu hơn, giúp bạn không phải lặp lại các bước kiểm thử xác thực mỗi khi muốn kiểm tra xem cấu hình phân quyền của một thành phần cụ thể có hoạt động tốt hay không.

Người dùng giả lập chỉ có hiệu lực trong suốt quá trình thực thi bài kiểm thử, và bạn có thể cấu hình bất kỳ đặc tính nào cho người dùng này để xác thực một kịch bản cụ thể. Ví dụ, bạn có thể cấp cho người dùng các vai trò cụ thể (ADMIN, MANAGER, v.v.) hoặc sử dụng các quyền hạn (authority) khác nhau để xác nhận ứng dụng hoạt động đúng như mong đợi trong các điều kiện đó.

> **LƯU Ý** Việc hiểu rõ các thành phần nào của framework tham gia vào bài kiểm thử tích hợp là vô cùng quan trọng. Bằng cách này, bạn sẽ biết mình đang kiểm thử phần tích hợp nào. Ví dụ, người dùng giả lập chỉ có thể được sử dụng để kiểm thử phần phân quyền (trong phần 18.5, bạn sẽ học cách xử lý phần xác thực). Đôi khi tôi thấy các lập trình viên bị nhầm lẫn ở khía cạnh này. Họ nghĩ rằng khi làm việc với một người dùng giả lập thì họ cũng đang kiểm thử cả một triển khai tùy chỉnh của `AuthenticationProvider`, nhưng thực tế không phải vậy. Hãy đảm bảo bạn hiểu chính xác những gì mình đang kiểm thử.

Để minh họa cách viết một bài kiểm thử như vậy, hãy quay lại ví dụ đơn giản nhất mà chúng ta đã thực hiện trong cuốn sách này: dự án `ssia-ch2-ex1`. Dự án này cung cấp một endpoint tại đường dẫn `/hello` chỉ với cấu hình mặc định của Spring Security. Chúng ta kỳ vọng điều gì sẽ xảy ra?

- Khi gọi endpoint mà không có thông tin người dùng, trạng thái phản hồi HTTP phải là 401 Unauthorized.

- Khi gọi endpoint với một người dùng đã được xác thực, trạng thái phản hồi HTTP phải là 200 OK, và thân phản hồi phải là `Hello!`.

Hãy cùng kiểm thử hai kịch bản này! Chúng ta cần một vài dependency trong tệp `pom.xml` để viết các bài kiểm thử. Đoạn mã dưới đây hiển thị các thư viện mà chúng ta sẽ sử dụng xuyên suốt các ví dụ trong chương này. Bạn nên đảm bảo rằng đã khai báo chúng trong tệp `pom.xml` trước khi bắt đầu viết mã kiểm thử. Dưới đây là các dependency cần thiết:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

> **LƯU Ý** Trong các ví dụ của chương này, chúng ta sử dụng JUnit 5 để viết mã kiểm thử. Tuy nhiên, đừng nản lòng nếu bạn vẫn đang làm việc với JUnit 4. Đứng từ góc độ tích hợp của Spring Security, các annotation và các lớp còn lại mà bạn sắp tìm hiểu hoạt động hoàn toàn tương tự. Chương 4 của cuốn sách JUnit in Action viết bởi Cătălin Tudose và các cộng sự (Manning, 2020), phần thảo luận chuyên sâu về việc chuyển đổi từ JUnit 4 sang JUnit 5, chứa một số bảng đối chiếu thú vị cho thấy sự tương quan giữa các lớp và annotation của phiên bản 4 và 5. Bạn có thể truy cập liên kết sau: http://mng.bz/OPJn.

Trong thư mục kiểm thử (test) của dự án Maven Spring Boot, chúng ta thêm một lớp có tên là `MainTests`. Lớp này được viết bên trong gói (package) chính của ứng dụng. Tên của gói chính là `com.laurentiuspilca.ssia`. Trong đoạn mã dưới đây, bạn sẽ thấy định nghĩa của lớp kiểm thử trống này. Chúng ta sử dụng annotation `@SpringBootTest`, đây là một cách tiện lợi để quản lý Spring context cho bộ kiểm thử của mình.

**Listing 18.1 Lớp dùng để viết các bài kiểm thử**

```java
@SpringBootTest
public class MainTests {
}
```

Một cách tiện lợi để triển khai kiểm thử cho hành vi của một endpoint là sử dụng công cụ `MockMvc` của Spring. Trong một ứng dụng Spring Boot, bạn can tự động cấu hình tiện ích `MockMvc` nhằm kiểm thử các cuộc gọi endpoint bằng cách thêm một annotation phía trên lớp kiểm thử, như minh họa trong đoạn mã dưới đây.

**Listing 18.2 Thêm MockMvc để triển khai các kịch bản kiểm thử**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;
}
```

Bây giờ, khi đã có công cụ để kiểm thử hành vi của endpoint, chúng ta hãy bắt đầu với kịch bản đầu tiên. Khi gọi endpoint `/hello` mà không có người dùng đã được xác thực, trạng thái phản hồi HTTP phải là 401 Unauthorized.

Bài kiểm thử sẽ gọi endpoint nhưng sử dụng một `SecurityContext` giả lập. Chúng ta có quyền quyết định những gì được thêm vào `SecurityContext` này. Đối với bài kiểm thử này, chúng ta cần kiểm tra xem nếu không thêm người dùng (tượng trưng cho tình huống ai đó gọi endpoint mà không đăng nhập), ứng dụng sẽ từ chối cuộc gọi bằng một phản hồi HTTP có trạng thái 401 Unauthorized. Ngược lại, khi chúng ta thêm một người dùng vào `SecurityContext`, ứng dụng sẽ chấp nhận cuộc gọi và trạng thái phản hồi HTTP sẽ là 200 OK.

Đoạn mã dưới đây trình bày cách triển khai kịch bản này.

**Listing 18.3 Kiểm thử việc không thể gọi endpoint nếu không có người dùng được xác thực**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    public void helloUnauthenticated() throws Exception {
        mvc.perform(get("/hello"))
           .andExpect(status().isUnauthorized());
    }
}
```

Lưu ý rằng chúng ta đã import tĩnh (statically import) các phương thức `get()` và `status()`. Bạn có thể tìm thấy phương thức `get()` cùng các phương thức tương tự liên quan đến yêu cầu (request) được sử dụng trong các ví dụ của chương này tại lớp sau:

```
org.springframework.test.web.servlet.request.MockMvcRequestBuilders
```

Tương tự, bạn có thể tìm thấy phương thức `status()` cùng các phương thức liên quan đến kết quả của các cuộc gọi được sử dụng trong các ví dụ tiếp theo của chương này tại lớp sau:

```
org.springframework.test.web.servlet.result.MockMvcResultMatchers
```

Bây giờ bạn có thể chạy các bài kiểm thử và quan sát trạng thái trên môi trường phát triển tích hợp (IDE) của mình. Thông thường, trên bất kỳ IDE nào, để chạy kiểm thử, bạn chỉ cần nhấp chuột phải vào lớp kiểm thử rồi chọn Run. IDE sẽ hiển thị bài kiểm thử thành công bằng màu xanh lá cây và bài kiểm thử thất bại bằng màu khác (thường là đỏ hoặc vàng).

> **LƯU Ý** Trong các dự án đi kèm với cuốn sách này, phía trên mỗi phương thức triển khai kiểm thử, tôi còn sử dụng thêm annotation `@DisplayName`. Annotation này cho phép chúng ta đưa vào một mô tả dài và chi tiết hơn về kịch bản kiểm thử. Để tiết kiệm không gian và giúp bạn tập trung tối đa vào chức năng của các bài kiểm thử đang thảo luận, tôi đã lược bỏ annotation `@DisplayName` khỏi các danh sách mã nguồn trong sách.

Để kiểm thử kịch bản thứ hai, chúng ta cần một người dùng giả lập. Nhằm xác thực hành vi gọi endpoint `/hello` với một người dùng đã được xác thực, chúng ta sử dụng annotation `@WithMockUser`. Bằng việc thêm annotation này phía trên phương thức kiểm thử, chúng ta chỉ thị cho Spring thiết lập một `SecurityContext` chứa một thực thể triển khai của `UserDetails`. Về cơ bản, điều này giúp bỏ qua bước xác thực. Lúc này, việc gọi endpoint sẽ hoạt động giống như khi người dùng được định nghĩa bởi annotation `@WithMockUser` đã xác thực thành công.

Với ví dụ đơn giản này, chúng ta chưa cần bận tâm đến các chi tiết của người dùng giả lập như tên đăng nhập, vai trò hay quyền hạn. Do đó, chúng ta chỉ cần thêm annotation `@WithMockUser` để sử dụng các giá trị thuộc tính mặc định cho người dùng giả lập. Ở phần sau của chương này, bạn sẽ học cách cấu hình các thuộc tính của người dùng cho những kịch bản kiểm thử yêu cầu các giá trị này phải chính xác. Đoạn mã dưới đây trình bày cách triển khai cho kịch bản kiểm thử thứ hai.

**Listing 18.4 Sử dụng @WithMockUser để định nghĩa một người dùng giả lập đã xác thực**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    // Omitted code

    @Test
    @WithMockUser
    public void helloAuthenticated() throws Exception {
        mvc.perform(get("/hello"))
           .andExpect(content().string("Hello!"))
           .andExpect(status().isOk());
    }
}
```

Hãy chạy thử bài kiểm thử này và quan sát kết quả thành công. Tuy nhiên, trong một số tình huống, chúng ta cần sử dụng một tên gọi cụ thể hoặc gán cho người dùng các vai trò hay quyền hạn nhất định để thực hiện kiểm thử. Giả sủ chúng ta muốn kiểm thử các endpoint đã được định nghĩa trong dự án `ssia-ch5-ex2`. Trong ví dụ này, các endpoint trả về một phản hồi tùy thuộc vào tên của người dùng đã xác thực. Để viết bài kiểm thử, chúng ta cần gán cho người dùng một tên đăng nhập cụ thể. Đoạn mã tiếp theo chỉ ra cách cấu hình chi tiết cho người dùng giả lập bằng cách viết một bài kiểm thử cho endpoint `/hello` trong dự án `ssia-ch5-ex2`.

**Listing 18.5 Cấu hình thông tin chi tiết cho người dùng giả lập**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    // Omitted code

    @Test
    @WithMockUser(username = "mary")
    public void helloAuthenticated() throws Exception {
        mvc.perform(get("/hello"))
           .andExpect(content().string("Hello, mary!"))
           .andExpect(status().isOk());
    }
}
```

Framework sẽ thông dịch các annotation như `@WithMockUser` trước khi thực thi phương thức kiểm thử. Nhờ vậy, phương thức kiểm thử có thể tạo ra yêu cầu kiểm thử và thực thi nó trong một môi trường bảo mật đã được cấu hình sẵn. Khi sử dụng một `RequestPostProcessor`, framework sẽ gọi phương thức kiểm thử và xây dựng yêu cầu kiểm thử trước. Sau đó, framework mới áp dụng `RequestPostProcessor` để sửa đổi yêu cầu hoặc môi trường thực thi trước khi gửi đi. Trong trường hợp này, các thành phần phụ thuộc của bài kiểm thử như người dùng giả lập và `SecurityContext` sẽ được cấu hình sau khi yêu cầu kiểm thử được xây dựng. Tương tự như việc thiết lập tên đăng nhập, bạn cũng có thể thiết lập các quyền hạn (authority) và vai trò (role) để kiểm thử các quy tắc phân quyền. Một phương pháp thay thế cho việc tạo người dùng giả lập bằng annotation là sử dụng `RequestPostProcessor`. Chúng ta có thể truyền một `RequestPostProcessor` vào phương thức `with()`, như được trình bày ở Listing 18.6. Lớp `SecurityMockMvcRequestPostProcessors` do Spring Security cung cấp mang đến rất nhiều triển khai của `RequestPostProcessor`, giúp chúng ta kiểm thử được đa dạng các kịch bản khác nhau.

Trong chương này, chúng ta cũng sẽ thảo luận về các triển khai của `RequestPostProcessor` thường xuyên được sử dụng. Phương thức `user()` của lớp `SecurityMockMvcRequestPostProcessors` trả về một `RequestPostProcessor` mà chúng ta có thể dùng như một giải pháp thay thế cho annotation `@WithMockUser`.

**Listing 18.6 Sử dụng RequestPostProcessor để định nghĩa một người dùng giả lập**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    // Omitted code

    @Test
    public void helloAuthenticatedWithUser() throws Exception {
        mvc.perform(
            get("/hello")
            .with(user("mary"))
        )
        .andExpect(content().string("Hello!"))
        .andExpect(status().isOk());
    }
}
```

Như bạn đã thấy trong phần này, việc viết các bài kiểm thử cho cấu hình phân quyền vừa thú vị lại vừa đơn giản! Phần lớn các bài kiểm thử tích hợp Spring Security mà bạn viết cho ứng dụng của mình đều tập trung vào cấu hình phân quyền. Có thể bạn đang tự hỏi tại sao chúng ta lại không kiểm thử luôn cả phần xác thực. Trong phần 18.5, chúng ta sẽ thảo luận chi tiết về việc kiểm thử xác thực. Tuy nhiên, nhìn chung, như đã thảo luận trước đó trong phần này, việc kiểm thử riêng biệt hai quy trình phân quyền và xác thực là hoàn toàn hợp lý. Thông thường, một ứng dụng chỉ sử dụng một cơ chế duy nhất để xác thực người dùng nhưng lại có hàng tá endpoint với các cấu hình phân quyền khác nhau. Do đó, bạn nên kiểm thử luồng xác thực riêng bằng một số ít bài kiểm thử chuyên biệt, sau đó triển khai kiểm thử phân quyền độc lập cho từng endpoint. Việc lặp lại kiểm thử xác thực cho mỗi endpoint được kiểm thử sẽ gây lãng phí thời gian thực thi một cách vô ích, trừ khi logic xác thực có sự thay đổi.

## 18.2 Kiểm thử với người dùng lấy từ UserDetailsService

Phần này thảo luận về việc lấy thông tin người dùng từ một `UserDetailsService` để phục vụ cho các bài kiểm thử. Phương pháp này là một giải pháp thay thế cho việc tạo người dùng giả lập. Điểm khác biệt là thay vì tạo ra một người dùng giả hoàn toàn, lần này chúng ta sẽ lấy thông tin người dùng từ một `UserDetailsService` cụ thể. Bạn nên sử dụng cách tiếp cận này nếu muốn kiểm thử cả sự tích hợp với nguồn dữ liệu nơi ứng dụng của bạn tải thông tin người dùng.

Để minh họa cho cách tiếp cận này, hãy mở dự án `ssia-ch2-ex2` và triển khai các bài kiểm thử cho endpoint tại đường dẫn `/hello`. Chúng ta sẽ sử dụng bean `UserDetailsService` đã được dự án khai báo sẵn trong context. Lưu ý rằng khi đi theo hướng này, bắt buộc phải có một bean `UserDetailsService` tồn tại trong context. Để chỉ định người dùng cần xác thực từ `UserDetailsService` này, chúng ta đánh dấu phương thức kiểm thử bằng annotation `@WithUserDetails`. Với annotation `@WithUserDetails`, bạn chỉ cần khai báo tên đăng nhập (username) để tìm kiếm người dùng. Đoạn mã dưới đây trình bày cách thực thi bài kiểm thử cho endpoint `/hello` bằng cách sử dụng annotation `@WithUserDetails` để định nghĩa người dùng đã được xác thực.

**Listing 18.7 Định nghĩa người dùng được xác thực bằng annotation @WithUserDetails**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    @WithUserDetails("john")
    public void helloAuthenticated() throws Exception {
        mvc.perform(get("/hello"))
           .andExpect(status().isOk());
    }
}
```

## 18.3 Sử dụng các đối tượng Authentication tùy chỉnh để kiểm thử

Thông thường, khi sử dụng người dùng giả lập cho một bài kiểm thử, bạn không cần quan tâm đến việc framework sử dụng lớp (class) nào để khởi tạo các thực thể `Authentication` bên trong `SecurityContext`. Nhưng giả sử bạn có một số logic nghiệp vụ trong controller phụ thuộc vào kiểu dữ liệu cụ thể của đối tượng này. Liệu bạn có thể chỉ thị cho framework tạo đối tượng `Authentication` cho bài kiểm thử bằng một kiểu dữ liệu tùy chỉnh hay không? Câu trả lời là có, và đó chính là nội dung chúng ta sẽ thảo luận trong phần này. Ý tưởng đằng sau phương pháp này rất đơn giản. Chúng ta sẽ định nghĩa một lớp nhà máy (factory class) chịu trách nhiệm xây dựng `SecurityContext`. Bằng cách này, chúng ta có toàn quyền kiểm soát cách `SecurityContext` của bài kiểm thử được tạo ra, bao gồm cả các thành phần chứa bên trong nó. Chẳng hạn, chúng ta có thể chủ động cấu hình để sử dụng một đối tượng `Authentication` tùy chỉnh.

Hãy mở dự án `ssia-ch2-ex4` và viết một bài kiểm thử mà tại đó chúng ta cấu hình `SecurityContext` giả lập cũng như hướng dẫn framework cách tạo đối tượng `Authentication`. Một khía cạnh thú vị cần lưu ý ở ví dụ này là chúng ta sử dụng nó để minh họa cho việc triển khai một `AuthenticationProvider` tùy chỉnh. Trong trường hợp này, `AuthenticationProvider` tùy chỉnh chỉ xác thực người dùng có tên là John. Tuy nhiên, tương tự như hai phương pháp trước đó được thảo luận ở phần 18.1 và 18.2, cách tiếp cận hiện tại cũng bỏ qua bước xác thực thực tế. Vì lý do đó, ở phần cuối của ví dụ, bạn sẽ thấy chúng ta hoàn toàn có thể đặt bất kỳ cái tên nào cho người dùng giả lập của mình. Chúng ta sẽ thực hiện ba bước sau để đạt được hành vi mong muốn:

1. Viết một annotation tùy chỉnh để sử dụng phía trên phương thức kiểm thử, tương tự như cách dùng `@WithMockUser` hoặc `@WithUserDetails`.

2. Viết một lớp triển khai interface `WithSecurityContextFactory`. Lớp này sẽ hiện thực hóa phương thức `createSecurityContext()`, có nhiệm vụ trả về `SecurityContext` giả lập mà framework sẽ sử dụng cho bài kiểm thử.

3. Liên kết annotation tùy chỉnh vừa tạo ở bước 1 với lớp factory ở bước 2 thông qua annotation `@WithSecurityContext`.

### Bước 1: Định nghĩa một annotation tùy chỉnh

Trong Listing 18.8, bạn sẽ thấy định nghĩa của annotation tùy chỉnh có tên là `@WithCustomUser` dùng cho bài kiểm thử. Bạn có thể định nghĩa bất kỳ thuộc tính nào cho annotation này để phục vụ cho việc tạo đối tượng `Authentication` giả lập. Ở đây, tôi chỉ thêm thuộc tính tên đăng nhập (username) để làm ví dụ minh họa. Ngoài ra, đừng quên khai báo annotation `@Retention(RetentionPolicy.RUNTIME)` để thiết lập chính sách lưu giữ (retention policy) ở chế độ runtime. Spring cần đọc thông tin từ annotation này bằng kỹ thuật phản chiếu (reflection) trong lúc ứng dụng đang chạy. Để cho phép Spring thực hiện việc này, bạn bắt buộc phải chuyển chính sách lưu giữ sang `RetentionPolicy.RUNTIME`.

**Listing 18.8 Định nghĩa annotation @WithCustomUser**

```java
@Retention(RetentionPolicy.RUNTIME)
public @interface WithCustomUser {
    String username();
}
```

### Bước 2: Tạo lớp factory cho SecurityContext giả lập

Bước thứ hai bao gồm việc viết mã nguồn để xây dựng nên `SecurityContext` mà framework sẽ sử dụng trong quá trình thực thi kiểm thử. Đây là nơi chúng ta quyết định loại `Authentication` nào sẽ được áp dụng cho bài kiểm thử. Đoạn mã dưới đây minh họa cách triển khai lớp factory này.

**Listing 18.9 Triển khai lớp factory cho SecurityContext**

```java
public class CustomSecurityContextFactory
    implements WithSecurityContextFactory<WithCustomUser> {

    @Override
    public SecurityContext createSecurityContext(WithCustomUser withCustomUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        var a = new UsernamePasswordAuthenticationToken(
            withCustomUser.username(), null, null
        );

        context.setAuthentication(a);
        return context;
    }
}
```

### Bước 3: Liên kết annotation tùy chỉnh với lớp factory

Bằng cách sử dụng annotation `@WithSecurityContext`, giờ đây chúng ta có thể liên kết annotation tùy chỉnh đã tạo ở bước 1 với lớp factory xử lý `SecurityContext` được triển khai ở bước 2. Đoạn mã tiếp theo thể hiện việc sửa đổi annotation `@WithCustomUser` để liên kết nó với lớp factory của `SecurityContext`.

**Listing 18.10 Liên kết annotation tùy chỉnh với lớp factory của SecurityContext**

```java
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = CustomSecurityContextFactory.class)
public @interface WithCustomUser {
    String username();
}
```

Sau khi hoàn tất việc thiết lập, chúng ta có thể viết bài kiểm thử sử dụng `SecurityContext` tùy chỉnh này. Đoạn mã dưới đây định nghĩa bài kiểm thử đó.

**Listing 18.11 Viết bài kiểm thử sử dụng SecurityContext tùy chỉnh**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    @WithCustomUser(username = "mary")
    public void helloAuthenticated() throws Exception {
        mvc.perform(get("/hello"))
           .andExpect(status().isOk());
    }
}
```

Khi chạy thử bài kiểm thử này, bạn sẽ thấy một kết quả thành công. Bạn có thể tự hỏi: "Khoan đã! Trong ví dụ này, chúng ta đã triển khai một `AuthenticationProvider` tùy chỉnh vốn chỉ xác thực cho người dùng tên là john. Tại sao bài kiểm thử vẫn thành công với tên người dùng là mary?" Tương tự như trường hợp của `@WithMockUser` và `@WithUserDetails`, phương thức này cũng bỏ qua hoàn toàn logic xác thực thực tế. Vì thế, bạn chỉ nên sử dụng nó để kiểm thử những phần liên quan đến cấu hình phân quyền và các khía cạnh khác sau khi xác thực.

## 18.4 Kiểm thử bảo mật cấp phương thức

Phần này thảo luận về việc kiểm thử bảo mật ở cấp độ phương thức (method security). Tất cả các bài kiểm thử chúng ta đã viết từ đầu chương tới giờ đều xoay quanh các endpoint. Nhưng chuyện gì sẽ xảy ra nếu ứng dụng của bạn không hề có endpoint? Thực tế là, nếu đó không phải là một ứng dụng web, nó hoàn toàn không có endpoint nào cả! Tuy nhiên, bạn vẫn có thể đã áp dụng Spring Security với tính năng bảo mật phương thức toàn cục (global method security) như chúng ta đã thảo luận ở các chương 11 và 12. Bạn vẫn cần phải kiểm thử các cấu hình bảo mật của mình trong những kịch bản như vậy.

May mắn thay, bạn có thể thực hiện việc này bằng cách sử dụng chính các hướng tiếp cận mà chúng ta đã thảo luận trong các phần trước. Bạn vẫn có thể sử dụng `@WithMockUser`, `@WithUserDetails` hoặc một annotation tùy chỉnh để thiết lập `SecurityContext` của riêng mình. Tuy nhiên, thay vì sử dụng `MockMvc`, bạn sẽ trực tiếp tiêm (inject) bean định nghĩa phương thức cần kiểm thử từ Spring context.

Hãy mở dự án `ssia-ch11-ex1` và triển khai các bài kiểm thử cho phương thức `getName()` trong lớp `NameService`. Chúng ta đã bảo vệ phương thức `getName()` này bằng cách sử dụng annotation `@PreAuthorize`. Trong Listing 18.12, bạn sẽ thấy cách triển khai của lớp kiểm thử chứa ba bài kiểm thử tương ứng với các kịch bản sau:

1. Gọi phương thức mà không có người dùng đã xác thực, phương thức sẽ ném ra ngoại lệ `AuthenticationException`.

2. Gọi phương thức với một người dùng đã được xác thực nhưng lại có quyền hạn khác với quyền hạn mong đợi (quyền "write"), phương thức sẽ ném ra ngoại lệ `AccessDeniedException`.

3. Gọi phương thức với một người dùng đã được xác thực và sở hữu đúng quyền hạn mong đợi sẽ trả về kết quả như mong muốn.

**Listing 18.12 Triển khai ba kịch bản kiểm thử cho phương thức getName()**

```java
@SpringBootTest
class MainTests {

    @Autowired
    private NameService nameService;

    @Test
    void testNameServiceWithNoUser() {
        assertThrows(AuthenticationException.class,
            () -> nameService.getName());
    }

    @Test
    @WithMockUser(authorities = "read")
    void testNameServiceWithUserButWrongAuthority() {
        assertThrows(AccessDeniedException.class,
            () -> nameService.getName());
    }

    @Test
    @WithMockUser(authorities = "write")
    void testNameServiceWithUserButCorrectAuthority() {
        var result = nameService.getName();
        assertEquals("Fantastico", result);
    }
}
```

Chúng ta không cần cấu hình `MockMvc` nữa vì không cần gọi một endpoint nào cả. Thay vào đó, chúng ta trực tiếp tiêm thực thể `NameService` để gọi phương thức cần kiểm thử. Ở đây, chúng ta sử dụng annotation `@WithMockUser` như đã thảo luận trong phần 18.1. Tương tự, bạn cũng có thể sử dụng `@WithUserDetails` như phần 18.2, hoặc thiết kế một giải pháp tùy chỉnh để xây dựng `SecurityContext` giống như đã thảo luận trong phần 18.3.

## 18.5 Kiểm thử xác thực

Trong phần này, chúng ta sẽ thảo luận về việc kiểm thử quy trình xác thực. Trước đó trong chương này, bạn đã học cách định nghĩa người dùng giả lập và kiểm thử các cấu hình phân quyền. Nhưng còn việc xác thực thì sao? Liệu chúng ta có thể kiểm thử logic xác thực hay không? Bạn cần thực hiện việc này nếu ứng dụng của bạn triển khai một logic xác thực tùy chỉnh và bạn muốn đảm bảo toàn bộ luồng hoạt động chuẩn xác. Khi kiểm thử quy trình xác thực, các yêu cầu kiểm thử sẽ được gửi đi giống như các yêu cầu bình thường từ phía client.

Ví dụ, quay trở lại dự án `ssia-ch2-ex4`, làm thế nào để chứng minh rằng bộ cung cấp dịch vụ xác thực tùy chỉnh (`AuthenticationProvider`) mà chúng ta đã xây dựng hoạt động chính xác và được bảo vệ bằng các bài kiểm thử? Trong dự án này, chúng ta đã triển khai một `AuthenticationProvider` tùy chỉnh, và chúng ta muốn đảm bảo rằng mình cũng đã bảo vệ logic xác thực tùy chỉnh này bằng các bài kiểm thử tương ứng. Hoàn toàn có thể thực hiện được việc này.

Logic được triển khai ở đây khá đơn giản. Chỉ có duy nhất một bộ thông tin đăng nhập được chấp nhận: tên đăng nhập "john" và mật khẩu "12345". Chúng ta cần chứng minh rằng khi sử dụng thông tin đăng nhập hợp lệ, cuộc gọi sẽ thành công, trong khi nếu sử dụng thông tin đăng nhập khác, trạng thái phản hồi HTTP sẽ trả về là 401 Unauthorized. Hãy mở lại dự án `ssia-ch2-ex4` và triển khai một vài bài kiểm thử để xác nhận rằng quy trình xác thực hoạt động đúng đắn.

**Listing 18.13 Kiểm thử xác thực bằng RequestPostProcessor httpBasic()**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class AuthenticationTests {

    @Autowired
    private MockMvc mvc;

    @Test
    public void helloAuthenticatingWithValidUser() throws Exception {
        mvc.perform(
            get("/hello")
            .with(httpBasic("john","12345"))
        )
        .andExpect(status().isOk());
    }

    @Test
    public void helloAuthenticatingWithInvalidUser() throws Exception {
        mvc.perform(
            get("/hello")
            .with(httpBasic("mary","12345"))
        )
        .andExpect(status().isUnauthorized());
    }
}
```

Bằng cách sử dụng bộ hậu xử lý yêu cầu (request postprocessor) `httpBasic()`, chúng ta chỉ thị cho bài kiểm thử thực thi quy trình xác thực thực tế. Qua đó, chúng ta có thể kiểm tra hành vi của endpoint khi xác thực bằng thông tin đăng nhập hợp lệ hoặc không hợp lệ. Bạn cũng có thể áp dụng cách tiếp cận tương tự để kiểm thử quy trình xác thực bằng biểu mẫu đăng nhập (form login). Hãy mở dự án `ssia-ch6-ex4`, nơi chúng ta đã sử dụng form login để xác thực, và viết một số bài kiểm thử để chứng minh quy trình xác thực hoạt động ổn định. Chúng ta sẽ kiểm thử hành vi của ứng dụng qua các kịch bản sau:

- Khi thực hiện xác thực với một bộ thông tin đăng nhập không chính xác

- Khi thực hiện xác thực với một bộ thông tin đăng nhập hợp lệ, nhưng người dùng lại không có quyền hạn hợp lệ theo cấu hình đã viết trong lớp `AuthenticationSuccessHandler`

- Khi thực hiện xác thực với một bộ thông tin đăng nhập hợp lệ và người dùng sở hữu đúng quyền hạn được yêu cầu theo cấu hình đã viết trong lớp `AuthenticationSuccessHandler`

Trong Listing 18.14, bạn sẽ thấy cách triển khai cho kịch bản đầu tiên. Nếu chúng ta xác thực bằng thông tin đăng nhập không hợp lệ, ứng dụng sẽ không cấp quyền truy cập cho người dùng và chèn thêm tiêu đề (header) "failed" vào phản hồi HTTP. Chúng ta đã tùy chỉnh ứng dụng và thêm header "failed" này thông qua một `AuthenticationFailureHandler` khi thảo luận về quy trình xác thực ở Chương 6.

**Listing 18.14 Kiểm thử lỗi xác thực qua biểu mẫu đăng nhập**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    public void loggingInWithWrongUser() throws Exception {
        mvc.perform(formLogin()
           .user("joey").password("12345"))
           .andExpect(header().exists("failed"))
           .andExpect(unauthenticated());
    }
}
```

Quay lại Chương 6, chúng ta đã tùy chỉnh logic xác thực bằng cách sử dụng một `AuthenticationSuccessHandler`. Trong triển khai của mình, nếu người dùng có quyền đọc (read authority), ứng dụng sẽ chuyển hướng họ đến trang `/home`. Ngược lại, ứng dụng sẽ chuyển hướng người dùng đến trang `/error`. Đoạn mã dưới đây trình bày cách triển khai cho hai kịch bản này.

**Listing 18.15 Kiểm thử hành vi của ứng dụng khi xác thực người dùng**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    // Omitted code

    @Test
    public void loggingInWithWrongAuthority() throws Exception {
        mvc.perform(formLogin()
           .user("bill").password("12345")
        )
        .andExpect(redirectedUrl("/error"))
        .andExpect(status().isFound())
        .andExpect(authenticated());
    }

    @Test
    public void loggingInWithCorrectAuthority() throws Exception {
        mvc.perform(formLogin()
           .user("john").password("12345")
        )
        .andExpect(redirectedUrl("/home"))
        .andExpect(status().isFound())
        .andExpect(authenticated());
    }
}
```

Nếu ứng dụng là một máy chủ tài nguyên (resource server) OAuth 2/OpenID Connect (Chương 15), bạn sẽ cần sử dụng token để kiểm thử quy trình xác thực. Một resource server có thể sử dụng định dạng token dạng tường minh (JWT) hoặc token dạng ẩn đục (opaque token). Spring Security cung cấp các công cụ hỗ trợ kiểm thử ứng dụng cho cả hai hướng tiếp cận này. Tương tự như phương thức `with(httpBasic())` đã dùng ở phần trước, bạn có thể sử dụng `with(jwt())` để cấu hình một JWT giả lập cho bài kiểm thử của mình, hoặc sử dụng `with(opaqueToken())` để cấu hình một opaque token giả lập.

Đoạn mã dưới đây minh họa một bài kiểm thử mẫu được lấy từ dự án `ssia-ch15-ex1`. Bài kiểm thử này áp dụng phương pháp sử dụng `with(jwt())` để gán một token giả lập nhằm kiểm tra quy trình xác thực của máy chủ tài nguyên.

**Listing 18.16 Sử dụng JWT giả lập để kiểm thử xác thực trên máy chủ tài nguyên**

```java
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationTests {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void demoEndpointSuccessfulAuthenticationTest() throws Exception {
        mockMvc.perform(
            get("/demo").with(jwt())
        )
        .andExpect(status().isOk());
    }
}
```

Khi đi theo hướng tiếp cận này, đôi khi bạn cũng cần phải thiết lập một số trường tùy chỉnh bên trong token, chẳng hạn như quyền hạn (authority). Bạn có thể gọi thêm các phương thức cấu hình đi sau phương thức `jwt()` để chỉ định các quyền hạn tùy chỉnh hoặc thậm chí là cấu hình lại toàn bộ cấu trúc của JWT. Đoạn mã ngắn dưới đây mô tả cách khai báo các quyền hạn tùy chỉnh trên JWT bằng việc thêm một quyền hạn có tên là "read" vào token giả lập được sử dụng để xác thực:

```java
jwt().authorities(() -> "read")
```

Một bài kiểm thử tương tự như Listing 18.16 nhưng dành cho opaque token có thể tìm thấy trong dự án `ssia-ch15-ex3`. Đoạn mã dưới đây trình bày cách triển khai bài kiểm thử này.

**Listing 18.17 Sử dụng opaque token giả lập để kiểm thử xác thực trên máy chủ tài nguyên**

```java
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void demoEndpointSuccessfulAuthenticationTest() throws Exception {
        mockMvc.perform(
            get("/demo").with(opaqueToken())
        )
        .andExpect(status().isOk());
    }
}
```

Ngay cả khi sử dụng opaque token, bạn vẫn có thể yêu cầu những quyền hạn cụ thể phải có mặt trong security context sau khi xác thực thành công. Bạn hoàn toàn có thể kiểm soát các quyền hạn mà thực thể xác thực được đưa vào context sẽ sở hữu. Để làm được điều đó, bạn có thể chuỗi tiếp phương thức cấu hình `authorities()` sau phương thức `opaqueToken()` như minh họa trong đoạn mã dưới đây. Đoạn mã này sẽ cấu hình quyền hạn có tên là "read" cho thực thể xác thực được chèn vào ngữ cảnh bảo mật của bài kiểm thử:

```java
opaqueToken().authorities(() -> "read")
```

## 18.6 Kiểm thử các cấu hình CSRF

Trong phần này, chúng ta sẽ thảo luận về việc kiểm thử cấu hình bảo vệ chống giả mạo yêu cầu chéo trang (CSRF) cho ứng dụng. Khi một ứng dụng tồn tại lỗ hổng CSRF, kẻ tấn công có thể lừa người dùng thực hiện những hành động ngoài ý muốn sau khi họ đã đăng nhập vào hệ thống. Như đã thảo luận ở Chương 9, Spring Security sử dụng cơ chế token CSRF để giảm thiểu những rủi ro bảo mật này. Bằng cách đó, đối với bất kỳ thao tác thay đổi dữ liệu nào (POST, PUT, DELETE), yêu cầu gửi đi bắt buộc phải đính kèm một token CSRF hợp lệ trong phần header. Tất nhiên, đến một thời điểm nào đó, bạn sẽ cần kiểm thử nhiều hơn là chỉ các yêu cầu HTTP GET thông thường. Tùy thuộc vào cách bạn xây dựng ứng dụng, như đã bàn ở Chương 9, bạn có thể cần tiến hành kiểm thử tính năng bảo vệ CSRF để đảm bảo rằng nó hoạt động đúng như mong đợi và bảo vệ tốt các endpoint thực thi các hành động thay đổi trạng thái dữ liệu.

May mắn là Spring Security hỗ trợ một phương pháp vô cùng đơn giản để kiểm thử tính năng bảo vệ CSRF thông qua một `RequestPostProcessor`. Hãy mở dự án `ssia-ch9-ex1` và cùng kiểm tra xem tính năng bảo vệ CSRF có được kích hoạt đúng cách cho endpoint `/hello` khi được gọi bằng phương thức HTTP POST qua các kịch bản sau hay không:

- Nếu không gửi kèm token CSRF, trạng thái phản hồi HTTP sẽ là 403 Forbidden.

- Nếu có gửi kèm token CSRF, trạng thái phản hồi HTTP sẽ là 200 OK.

Đoạn mã dưới đây trình bày cách thực thi hai kịch bản này. Hãy quan sát cách chúng ta có thể chèn một token CSRF vào yêu cầu một cách dễ dàng chỉ bằng việc sử dụng `RequestPostProcessor csrf()`.

**Listing 18.18 Triển khai các kịch bản kiểm thử bảo vệ chống CSRF**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    public void testHelloPOST() throws Exception {
        mvc.perform(post("/hello"))
           .andExpect(status().isForbidden());
    }

    @Test
    public void testHelloPOSTWithCSRF() throws Exception {
        mvc.perform(post("/hello").with(csrf()))
           .andExpect(status().isOk());
    }
}
```

## 18.7 Kiểm thử các cấu hình CORS

Phần này thảo luận về việc kiểm thử các cấu hình cơ chế chia sẻ tài nguyên chéo nguồn (CORS). Như bạn đã biết ở Chương 10, nếu một trình duyệt tải ứng dụng web từ một nguồn (origin) này (ví dụ: `example.com`), nó sẽ không cho phép ứng dụng sử dụng phản hồi HTTP đến từ một nguồn khác (ví dụ: `example.org`). Chúng ta áp dụng các chính sách CORS để nới lỏng các rào cản này, nhờ đó ứng dụng có thể phối hợp làm việc linh hoạt với nhiều nguồn khác nhau. Tất nhiên, giống như bất kỳ cấu hình bảo mật nào khác, bạn cũng cần kiểm thử các chính sách CORS này. Ở Chương 10, bạn đã tìm hiểu rằng CORS xoay quanh các tiêu đề (header) đặc thù trong phản hồi, giá trị của các header này sẽ quyết định xem phản hồi HTTP đó có được chấp nhận hay không. Hai trong số các header liên quan chặt chẽ đến đặc tả kỹ thuật CORS là `Access-Control-Allow-Origin` và `Access-Control-Allow-Methods`. Chúng ta đã dùng các header này ở Chương 10 để cấu hình hỗ trợ nhiều nguồn truy cập khác nhau cho ứng dụng.

Khi viết các bài kiểm thử cho các chính sách CORS, tất cả những gì chúng ta cần làm là đảm bảo rằng các header này (và có thể là các header khác liên quan đến CORS, tùy thuộc vào độ phức tạp của cấu hình) thực sự tồn tại và chứa giá trị chính xác. Để xác thực điều này, chúng ta có thể giả lập chính xác hành vi của trình duyệt khi thực hiện một yêu cầu thăm dò sơ bộ (preflight request). Chúng ta sẽ gửi một yêu cầu bằng phương thức HTTP OPTIONS để truy vấn giá trị của các header CORS. Hãy mở dự án `ssia-ch10-ex1` và viết một bài kiểm thử để xác thực giá trị của các header CORS này. Đoạn mã dưới đây định nghĩa bài kiểm thử đó.

**Listing 18.19 Triển khai kiểm thử cho các chính sách CORS**

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MainTests {

    @Autowired
    private MockMvc mvc;

    @Test
    public void testCORSForTestEndpoint() throws Exception {
        mvc.perform(options("/test")
           .header("Access-Control-Request-Method", "POST")
           .header("Origin", "http://www.example.com")
        )
        .andExpect(header().exists("Access-Control-Allow-Origin"))
        .andExpect(header().string("Access-Control-Allow-Origin", "*"))
        .andExpect(header().exists("Access-Control-Allow-Methods"))
        .andExpect(header().string("Access-Control-Allow-Methods", "POST"))
        .andExpect(status().isOk());
    }
}
```

## 18.8 Kiểm thử các triển khai Spring Security dạng phản ứng

Trong phần này, chúng ta sẽ thảo luận về việc kiểm thử khả năng tích hợp của Spring Security với các chức năng được xây dựng trong một ứng dụng dạng phản ứng (reactive). Chắc chắn bạn sẽ không ngạc nhiên khi biết rằng Spring Security cũng hỗ trợ đầy đủ việc kiểm thử các cấu hình bảo mật dành cho ứng dụng phản ứng. Tương tự như với các ứng dụng truyền thống (non-reactive), tính bảo mật của ứng dụng phản ứng là vô cùng quan trọng, kéo theo việc kiểm thử cấu hình bảo mật cho chúng cũng là một phần không thể thiếu. Để minh họa cách triển khai các bài kiểm thử cho cấu hình bảo mật của bạn, chúng ta sẽ quay trở lại các ví dụ đã thực hiện trong Chương 17. Với Spring Security dành cho ứng dụng phản ứng, bạn cần nắm được hai phương pháp viết kiểm thử cơ bản sau:

- Sử dụng người dùng giả lập với các annotation `@WithMockUser`

- Sử dụng công cụ `WebTestClientConfigurer`

Việc sử dụng annotation `@WithMockUser` rất đơn giản vì nó hoạt động hoàn toàn tương tự như đối với các ứng dụng non-reactive mà chúng ta đã thảo luận ở phần 18.1. Tuy nhiên, cách định nghĩa bài kiểm thử sẽ có sự khác biệt bởi vì trong môi trường ứng dụng phản ứng, chúng ta không thể sử dụng `MockMvc` được nữa. Sự thay đổi này thực tế không liên quan đến Spring Security. Thay vào đó, chúng ta có một công cụ tương tự để kiểm thử các ứng dụng phản ứng, đó là `WebTestClient`. Đoạn mã tiếp theo trình bày cách triển khai một bài kiểm thử đơn giản sử dụng người dùng giả lập để kiểm tra hành vi của một endpoint phản ứng.

**Listing 18.20 Sử dụng @WithMockUser khi kiểm thử các triển khai phản ứng**

```java
@SpringBootTest
@AutoConfigureWebTestClient // Yêu cầu Spring Boot tự động cấu hình WebTestClient được […]
class MainTests {

  @Autowired // Tiêm instance WebTestClient đã được Spring Boot cấu hình từ Spring con […]
  private WebTestClient client;

  @Test
  @WithMockUser // Sử dụng annotation @WithMockUser để định nghĩa một người dùng giả l […]
  void testCallHelloWithValidUser() {
    client.get()
      .uri("/hello")
      .exchange() // Thực hiện trao đổi và xác thực kết quả
      .expectStatus().isOk();
  }
}
```

Như bạn có thể thấy, việc sử dụng annotation `@WithMockUser` gần như không có gì khác biệt so với các ứng dụng non-reactive. Framework vẫn tạo ra một `SecurityContext` đi kèm người dùng giả lập. Ứng dụng sẽ bỏ qua bước xác thực và trực tiếp sử dụng thông tin người dùng giả lập từ `SecurityContext` của bài kiểm thử để đối chiếu với các quy tắc phân quyền.

Cách tiếp cận thứ hai mà bạn có thể áp dụng là sử dụng `WebTestClientConfigurer`. Phương pháp này tương tự như việc sử dụng `RequestPostProcessor` trong ứng dụng non-reactive. Đối với ứng dụng phản ứng, chúng ta sẽ gán một `WebTestClientConfigurer` cho `WebTestClient` đang sử dụng để làm thay đổi ngữ cảnh kiểm thử. Ví dụ, chúng ta có thể định nghĩa một người dùng giả lập hoặc đính kèm một token CSRF nhằm kiểm thử tính năng bảo vệ chống CSRF, giống như cách chúng ta đã thực hiện với ứng dụng non-reactive ở phần 18.6. Đoạn mã dưới đây minh họa cách sử dụng `WebTestClientConfigurer`.

**Listing 18.21 Sử dụng WebTestClientConfigurer để định nghĩa một người dùng giả lập**

```java
@SpringBootTest
@AutoConfigureWebTestClient
class MainTests {

  @Autowired
  private WebTestClient client;
  // Omitted code

  @Test
  void testCallHelloWithValidUserWithMockUser() {
    client.mutateWith(mockUser()) // Trước khi thực thi yêu cầu GET, thay đổi cuộc gọi […]
      .get()
      .uri("/hello")
      .exchange()
      .expectStatus().isOk();
  }
}
```

Giả sủ nếu bạn muốn kiểm thử tính năng bảo vệ CSRF đối với một cuộc gọi POST, bạn sẽ viết tương tự như sau:

```java
client.mutateWith(csrf())
  .post()
  .uri("/hello")
  .exchange()
  .expectStatus().isOk();
```

## Tóm tắt

- Viết kiểm thử luôn là một phương pháp thực hành tốt nhất. Việc này đảm bảo các triển khai hoặc chỉnh sửa mới của bạn không làm phá vỡ các tính năng hiện có.

- Bạn không chỉ cần kiểm thử mã nguồn tự viết, mà còn phải kiểm thử tính tích hợp với các thư viện và framework bên thứ ba đang sử dụng.

- Spring Security cung cấp các công cụ hỗ trợ tuyệt vời để triển khai các bài kiểm thử cho cấu hình bảo mật của bạn.

- Bạn có thể trực tiếp kiểm thử phân quyền bằng cách sử dụng người dùng giả lập. Nên phân tách các bài kiểm thử phân quyền độc lập với bước xác thực, bởi số lượng kịch bản xác thực nhìn chung sẽ ít hơn số lượng quy tắc phân quyền.

- Việc kiểm thử luồng xác thực trong một số ít bài kiểm thử riêng biệt, sau đó kiểm thử cấu hình phân quyền cho từng endpoint và phương thức, sẽ giúp tối ưu hóa thời gian thực thi đáng kể.

- Để kiểm thử cấu hình bảo mật cho các endpoint trong ứng dụng non-reactive, Spring Security cung cấp sự hỗ trợ tuyệt vời cho phép viết các bài kiểm thử bằng công cụ `MockMvc`.

- Để kiểm thử cấu hình bảo mật cho các endpoint trong ứng dụng phản ứng, Spring Security hỗ trợ viết các bài kiểm thử một cách mạnh mẽ thông qua `WebTestClient`.

- Bạn hoàn toàn có thể viết mã kiểm thử trực tiếp cho các phương thức được áp dụng cấu hình bảo mật thông qua tính năng bảo mật cấp phương thức (method security).
