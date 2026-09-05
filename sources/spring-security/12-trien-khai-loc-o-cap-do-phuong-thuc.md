# Chương 12: Triển khai lọc ở cấp độ phương thức

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm các nội dung chính:**

- Sử dụng tiền lọc (prefiltering) để giới hạn giá trị tham số mà phương thức tiếp nhận

- Sử dụng hậu lọc (postfiltering) để giới hạn dữ liệu trả về của phương thức

- Tích hợp cơ chế lọc với Spring Data

Trong Chương 11, bạn đã tìm hiểu cách áp dụng các quy tắc phân quyền bằng tính năng bảo mật phương thức toàn cục. Chúng ta đã cùng thực hành qua các ví dụ sử dụng hai annotation `@PreAuthorize` và `@PostAuthorize`. Khi áp dụng các annotation này, ứng dụng sẽ cho phép thực thi cuộc gọi phương thức hoặc từ chối nó hoàn toàn. Tuy nhiên, hãy tưởng tượng một tình huống: bạn không muốn cấm hoàn toàn việc gọi phương thức, mà chỉ muốn đảm bảo các tham số truyền vào phải tuân theo một số quy tắc nhất định. Hoặc trong một kịch bản khác, bạn muốn đảm bảo rằng sau khi phương thức được thực thi, phía gọi phương thức chỉ nhận được phần dữ liệu được phép trong tổng số kết quả trả về. Tính năng này được gọi là lọc dữ liệu (filtering), và được chia làm hai loại:

- Tiền lọc (Prefiltering) — Khung công tác (framework) sẽ lọc các giá trị của tham số trước khi gọi phương thức.

- Hậu lọc (Postfiltering) — Khung công tác sẽ lọc giá trị trả về sau khi phương thức được thực thi.

Cơ chế lọc hoạt động khác với cơ chế ủy quyền cuộc gọi. Đối với cơ chế lọc, framework vẫn thực thi cuộc gọi phương thức và không ném ra bất kỳ ngoại lệ nào nếu một tham số hoặc giá trị trả về không tuân thủ quy tắc phân quyền đã định sẵn. Thay vào đó, nó sẽ loại bỏ các phần tử không thỏa mãn điều kiện được chỉ ra. Một điểm quan trọng cần lưu ý ngay từ đầu là bạn chỉ có thể áp dụng cơ chế lọc cho các collection và array (mảng). Bạn chỉ sử dụng tiền lọc khi phương thức tiếp nhận tham số đầu vào là một mảng hoặc một tập hợp các đối tượng. Framework sẽ lọc tập hợp hoặc mảng này dựa theo các quy tắc bạn định nghĩa. Điều tương tự cũng áp dụng cho hậu lọc: bạn chỉ có thể triển khai phương pháp này nếu phương thức trả về một collection hoặc một mảng. Framework sẽ lọc kết quả trả về của phương thức dựa trên các quy tắc được bạn chỉ định.

## 12.1 Áp dụng tiền lọc trong phân quyền phương thức

Phần này sẽ thảo luận về cơ chế vận hành của tiền lọc, sau đó chúng ta sẽ cùng triển khai tính năng này qua một ví dụ thực tế. Bạn có thể sử dụng cơ chế lọc để chỉ thị cho framework kiểm tra tính hợp lệ của các giá trị được truyền qua tham số phương thức khi có cuộc gọi diễn ra. Framework sẽ loại bỏ các giá trị không khớp với tiêu chí đã đưa ra và chỉ thực thi phương thức với những giá trị đáp ứng yêu cầu. Tính năng này được gọi là tiền lọc (prefiltering).

Trong thực tế, bạn sẽ gặp nhiều yêu cầu nghiệp vụ rất phù hợp để áp dụng tiền lọc, bởi nó giúp tách biệt các quy tắc phân quyền ra khỏi logic nghiệp vụ của phương thức. Giả sử bạn cần triển khai một ca sử dụng (use case) chỉ xử lý các thông tin chi tiết thuộc sở hữu của người dùng đã được xác thực. Ca sử dụng này có thể được gọi từ nhiều nơi khác nhau trong hệ thống, nhưng trách nhiệm của nó luôn là: bất kể ai gọi đi chăng nữa, nó chỉ được phép xử lý dữ liệu của chính người dùng đang đăng nhập. Thay vì phải đảm bảo bên gọi ca sử dụng áp dụng đúng các quy tắc phân quyền, bạn có thể để bản thân ca sử dụng tự thực thi quy tắc của riêng nó. Tất nhiên, bạn hoàn toàn có thể viết logic này bên trong phương thức. Nhưng việc tách biệt logic phân quyền khỏi logic nghiệp vụ sẽ giúp mã nguồn dễ bảo trì hơn, đồng thời giúp người khác dễ đọc và dễ hiểu code của bạn hơn.

Tương tự như cơ chế ủy quyền cuộc gọi đã thảo luận ở Chương 11, Spring Security cũng triển khai cơ chế lọc thông qua việc sử dụng các aspect 15. Các aspect này sẽ chặn các cuộc gọi phương thức cụ thể và bổ sung thêm các chỉ thị xử lý khác. Đối với tiền lọc, một aspect sẽ chặn các phương thức được đánh dấu bằng annotation `@PreFilter` và lọc các giá trị trong collection được truyền vào làm tham số theo tiêu chí bạn đã định nghĩa.

Tương tự các annotation `@PreAuthorize` và `@PostAuthorize` đã thảo luận ở Chương 11, bạn thiết lập các quy tắc phân quyền dưới dạng giá trị của annotation `@PreFilter`. Trong các quy tắc này (được biểu diễn dưới dạng biểu thức SpEL), bạn sử dụng biến `filterObject` để tham chiếu đến bất kỳ phần tử nào bên trong collection hoặc mảng được truyền vào làm tham số của phương thức.

Để thấy cách áp dụng tiền lọc, hãy cùng xây dựng một dự án thực tế. Tôi đặt tên cho dự án này là `ssia-ch12-ex1`. Giả sử bạn có một ứng dụng mua bán sản phẩm, và phía backend của nó cung cấp một endpoint là `/sell`. Frontend của ứng dụng sẽ gọi endpoint này khi người dùng thực hiện bán một sản phẩm. Nhưng người dùng đã đăng nhập chỉ có thể bán những sản phẩm do chính họ sở hữu. Chúng ta hãy cùng triển khai một kịch bản đơn giản: một phương thức dịch vụ được gọi để bán các sản phẩm nhận được từ tham số đầu vào. Qua ví dụ này, bạn sẽ học được cách áp dụng annotation `@PreFilter` để đảm bảo phương thức chỉ tiếp nhận những sản phẩm thuộc sở hữu của người dùng hiện đang đăng nhập.

Sau khi tạo dự án, chúng ta sẽ viết một lớp cấu hình (configuration class) nhằm đảm bảo có sẵn một vài tài khoản người dùng để kiểm thử chương trình. Bạn có thể thấy định nghĩa đơn giản của lớp cấu hình này trong Listing 12.1. Lớp cấu hình được đặt tên là `ProjectConfig` này chỉ khai báo một `UserDetailsService` và một `PasswordEncoder`, đồng thời được đánh dấu bằng `@EnableMethodSecurity`. Để sử dụng các annotation hỗ trợ lọc dữ liệu, chúng ta vẫn cần dùng đến `@EnableMethodSecurity` nhằm kích hoạt các annotation tiền/hậu phân quyền. `UserDetailsService` được cung cấp sẽ định nghĩa hai người dùng phục vụ cho việc kiểm thử: Nikolai và Julien.

**Listing 12.1: Cấu hình người dùng và kích hoạt bảo mật phương thức**
```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var uds = new InMemoryUserDetailsManager();

        var u1 = User.withUsername("nikolai")
            .password("12345")
            .authorities("read")
            .build();

        var u2 = User.withUsername("julien")
            .password("12345")
            .authorities("write")
            .build();

        uds.createUser(u1);
        uds.createUser(u2);
        return uds;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Tôi mô tả thực thể sản phẩm bằng cách sử dụng lớp mô hình (model class) được trình bày trong listing tiếp theo.

**Listing 12.2: Định nghĩa lớp Product**
```java
public class Product {
    private String name;
    private String owner;
    // Omitted constructor, getters, and setters
}
```

Lớp `ProductService` định nghĩa phương thức dịch vụ mà chúng ta sẽ bảo vệ bằng `@PreFilter`. Bạn có thể tìm thấy lớp `ProductService` trong Listing 12.3. Trong listing đó, phía trên phương thức `sellProducts()`, bạn có thể thấy sự xuất hiện của annotation `@PreFilter`. Biểu thức ngôn ngữ SpEL (Spring Expression Language) được sử dụng cùng với annotation này là `filterObject.owner == authentication.name`, chỉ cho phép các giá trị có thuộc tính `owner` của `Product` trùng với tên đăng nhập của người dùng hiện tại. Ở vế bên trái của toán tử so sánh bằng trong biểu thức SpEL, chúng ta sử dụng `filterObject`. Biến `filterObject` này dùng để tham chiếu tới các đối tượng trong danh sách tham số đầu vào. Vì ở đây chúng ta truyền vào một danh sách các sản phẩm, nên `filterObject` trong trường hợp này có kiểu dữ liệu là `Product`. Do đó, chúng ta có thể truy cập trực tiếp vào thuộc tính `owner` của sản phẩm. Ở vế bên phải của toán tử so sánh bằng, chúng ta sử dụng đối tượng `authentication`. Đối với hai annotation `@PreFilter` và `@PostFilter`, chúng ta có thể tham chiếu trực tiếp đến đối tượng `authentication` vốn đã sẵn có trong `SecurityContext` sau khi quá trình xác thực hoàn tất.

Phương thức dịch vụ này trả về danh sách chính xác như những gì nó nhận được. Bằng cách này, chúng ta có thể kiểm thử và xác nhận xem framework có lọc danh sách đúng như mong đợi hay không thông qua việc kiểm tra danh sách được trả về trong thân phản hồi HTTP (response body).

**Listing 12.3: Sử dụng annotation @PreFilter trong lớp ProductService**
```java
@Service
public class ProductService {

    @PreFilter("filterObject.owner == authentication.name")
    public List<Product> sellProducts(List<Product> products) {
        // sell products and return the sold products list
        return products;
    }
}
```

Để việc kiểm thử trở nên dễ dàng hơn, tôi định nghĩa một endpoint để gọi phương thức dịch vụ đã được bảo vệ. Listing 12.4 định nghĩa endpoint này trong một lớp controller có tên là `ProductController`. Tại đây, để đơn giản hóa việc gọi endpoint, tôi khởi tạo trực tiếp một danh sách rồi truyền nó làm tham số cho phương thức dịch vụ. Trong các dự án thực tế, danh sách này thường do phía client gửi lên thông qua thân yêu cầu (request body). Bạn cũng có thể nhận thấy tôi sử dụng `@GetMapping` cho một thao tác thay đổi trạng thái dữ liệu (mutation) — một cách làm không đúng chuẩn thiết kế REST. Tuy nhiên, xin lưu ý rằng tôi làm vậy để tránh phải xử lý cơ chế bảo vệ CSRF trong ví dụ này, giúp bạn hoàn toàn tập trung vào chủ đề chính đang thảo luận. Bạn đã được tìm hiểu về cơ chế bảo vệ CSRF trong Chương 9.

**Listing 12.4: Lớp controller triển khai endpoint dùng để kiểm thử**
```java
@RestController
public class ProductController {

    private final ProductService productService;

    // omitted constructor

    @GetMapping("/sell")
    public List<Product> sellProduct() {
        List<Product> products = new ArrayList<>();
        products.add(new Product("beer", "nikolai"));
        products.add(new Product("candy", "nikolai"));
        products.add(new Product("chocolate", "julien"));
        return productService.sellProducts(products);
    }
}
```

Hãy khởi động ứng dụng và xem điều gì xảy ra khi chúng ta gọi endpoint `/sell`. Hãy chú ý đến ba sản phẩm trong danh sách được truyền làm tham số cho phương thức dịch vụ. Tôi gán quyền sở hữu hai sản phẩm cho người dùng Nikolai và sản phẩm còn lại cho người dùng Julien. Khi gọi endpoint và xác thực dưới danh nghĩa Nikolai, chúng ta mong đợi phản hồi trả về chỉ chứa hai sản phẩm liên quan đến tài khoản này. Khi gọi endpoint và xác thực bằng tài khoản Julien, trong phản hồi trả về sẽ chỉ xuất hiện duy nhất một sản phẩm của Julien. Trong đoạn mã dưới đây, bạn sẽ thấy các cuộc gọi kiểm thử và kết quả tương ứng. Để gọi endpoint `/sell` và xác thực với tài khoản Nikolai, hãy sử dụng lệnh sau:

```bash
curl -u nikolai:12345 http://localhost:8080/sell
```

Thân phản hồi trả về là:

```json
[
  {"name":"beer","owner":"nikolai"},
  {"name":"candy","owner":"nikolai"}
]
```

Để gọi endpoint `/sell` và xác thực với tài khoản Julien, hãy dùng lệnh:

```bash
curl -u julien:12345 http://localhost:8080/sell
```

Thân phản hồi trả về là:

```json
[
  {"name":"chocolate","owner":"julien"}
]
```

Bạn cần đặc biệt lưu ý một thực tế là aspect sẽ thay đổi trực tiếp trên collection được truyền vào. Trong trường hợp này, đừng mong đợi nó sẽ trả về một thực thể `List` mới. Thực tế, đó vẫn chính là thực thể danh sách ban đầu nhưng đã bị aspect loại bỏ đi các phần tử không đáp ứng tiêu chí. Đây là điểm cực kỳ quan trọng cần cân nhắc. Bạn phải luôn đảm bảo rằng thực thể collection truyền vào không phải là một tập hợp bất biến (immutable). Việc truyền một collection bất biến vào để xử lý sẽ dẫn đến ngoại lệ tại thời điểm chạy (runtime exception), bởi aspect thực hiện chức năng lọc dữ liệu sẽ không thể chỉnh sửa nội dung của tập hợp đó.

Listing tiếp theo trình bày cùng một dự án mà chúng ta đã làm việc trước đó, nhưng tôi đã thay đổi định nghĩa `List` thành một thực thể bất biến được trả về bởi phương thức `List.of()` để kiểm thử xem điều gì sẽ xảy ra trong tình huống này.

**Listing 12.5: Sử dụng một collection bất biến**
```java
@RestController
public class ProductController {

    private final ProductService productService;

    // omitted constructor

    @GetMapping("/sell")
    public List<Product> sellProduct() {
        List<Product> products = List.of(
            new Product("beer", "nikolai"),
            new Product("candy", "nikolai"),
            new Product("chocolate", "julien")
        );
        return productService.sellProducts(products);
    }
}
```

Tôi đã tách riêng ví dụ này vào thư mục dự án `ssia-ch12-ex2` để bạn cũng có thể tự mình kiểm thử. Khi chạy ứng dụng và gọi endpoint `/sell`, kết quả trả về sẽ là một phản hồi HTTP với trạng thái lỗi `500 Internal Server Error` cùng một ngoại lệ được ghi nhận trong nhật ký hệ thống (console log), như được trình bày trong đoạn mã tiếp theo:

```bash
curl -u julien:12345 http://localhost:8080/sell
```

Thân phản hồi trả về là:

```json
{
  "status":500,
  "error":"Internal Server Error",
  "path":"/sell"
}
```

Trong cửa sổ console của ứng dụng, bạn sẽ thấy một ngoại lệ tương tự như ngoại lệ được trình bày dưới đây:

```text
java.lang.UnsupportedOperationException: null
 at java.base/java.util.ImmutableCollections.uoe(ImmutableCollections.java:73) ~[na:na […]
 ...
```

## 12.2 Áp dụng hậu lọc trong phân quyền phương thức

Trong phần này, chúng ta sẽ tiến hành triển khai tính năng hậu lọc (postfiltering). Giả sử chúng ta có một kịch bản như sau: Một ứng dụng có phần frontend viết bằng Angular và backend chạy trên nền tảng Spring đang quản lý một số sản phẩm. Người dùng sở hữu các sản phẩm và họ chỉ có quyền lấy thông tin chi tiết về các sản phẩm của chính mình. Để lấy thông tin chi tiết này, phía frontend sẽ gọi các endpoint do backend cung cấp.

Ở phía backend, trong một lớp dịch vụ (service class), lập trình viên đã viết phương thức `List<Product> findProducts()` để lấy về thông tin chi tiết sản phẩm. Ứng dụng client sau đó sẽ hiển thị các thông tin này lên giao diện người dùng. Làm thế nào lập trình viên có thể đảm bảo rằng bất kỳ ai gọi phương thức này cũng chỉ nhận về sản phẩm do chính họ sở hữu chứ không phải sản phẩm của người khác? Một giải pháp giúp triển khai tính năng này mà vẫn giữ cho các quy tắc phân quyền hoàn toàn tách biệt khỏi các quy tắc nghiệp vụ của ứng dụng được gọi là hậu lọc (postfiltering). Phần này sẽ thảo luận về nguyên lý hoạt động của hậu lọc và minh họa cách triển khai nó trong một ứng dụng.

Tương tự như tiền lọc, hậu lọc cũng hoạt động dựa trên một aspect. Aspect này cho phép cuộc gọi phương thức diễn ra bình thường, nhưng ngay khi phương thức trả về kết quả, aspect sẽ tiếp nhận giá trị trả về đó và đảm bảo nó tuân thủ các quy tắc do bạn định nghĩa. Giống như tiền lọc, hậu lọc sẽ làm thay đổi trực tiếp trên collection hoặc mảng được trả về bởi phương thức. Bạn cần cung cấp các tiêu chí mà những phần tử nằm trong collection trả về phải đáp ứng. Aspect đảm nhận nhiệm vụ hậu lọc sẽ lọc bỏ khỏi collection hoặc mảng trả về những phần tử không tuân thủ quy tắc của bạn.

Để áp dụng hậu lọc, bạn cần sử dụng annotation `@PostFilter`. Annotation `@PostFilter` hoạt động tương tự như tất cả các annotation tiền/hậu phân quyền khác mà chúng ta đã sử dụng trong Chương 11 và chương này. Bạn cung cấp quy tắc phân quyền dưới dạng biểu thức SpEL làm giá trị cho annotation, và aspect thực hiện việc lọc sẽ sử dụng quy tắc đó. Ngoài ra, giống như tiền lọc, hậu lọc chỉ hoạt động được với các mảng và collection. Hãy đảm bảo bạn chỉ áp dụng annotation `@PostFilter` cho những phương thức có kiểu trả về là một mảng hoặc một collection.

Chúng ta hãy cùng áp dụng hậu lọc vào một ví dụ trong dự án có tên là `ssia-ch12-ex3`. Để đảm bảo tính nhất quán, tôi vẫn giữ nguyên các tài khoản người dùng như trong các ví dụ trước của chương này để không phải thay đổi lớp cấu hình. Nhằm giúp bạn tiện theo dõi, tôi xin trình bày lại lớp cấu hình trong listing dưới đây.

**Listing 12.6: Lớp cấu hình**
```java
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        var uds = new InMemoryUserDetailsManager();

        var u1 = User.withUsername("nikolai")
            .password("12345")
            .authorities("read")
            .build();

        var u2 = User.withUsername("julien")
            .password("12345")
            .authorities("write")
            .build();

        uds.createUser(u1);
        uds.createUser(u2);
        return uds;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Đoạn mã tiếp theo cho thấy lớp `Product` cũng được giữ nguyên không thay đổi:

```java
public class Product {
    private String name;
    private String owner;
    // Omitted constructor, getters, and setters
}
```

Trong lớp `ProductService`, bây giờ chúng ta sẽ triển khai một phương thức trả về danh sách các sản phẩm. Trong thực tế, thông thường ứng dụng sẽ đọc thông tin sản phẩm từ một cơ sở dữ liệu hoặc một nguồn dữ liệu nào đó. Để giữ cho ví dụ ngắn gọn và giúp bạn tập trung hoàn toàn vào các khía cạnh đang được thảo luận, chúng ta sẽ sử dụng một tập hợp đơn giản như được trình bày trong Listing 12.7.

Tôi đánh dấu phương thức `findProducts()` (phương thức trả về danh sách sản phẩm) bằng annotation `@PostFilter`. Điều kiện được thiết lập làm giá trị cho annotation này là `filterObject.owner == authentication.name`, chỉ cho phép trả về các sản phẩm có thuộc tính chủ sở hữu trùng với người dùng đã thực hiện xác thực. Ở vế bên trái của toán tử so sánh bằng, chúng ta sử dụng `filterObject` để tham chiếu đến các phần tử bên trong collection được trả về. Ở vế bên phải của toán tử, chúng ta sử dụng `authentication` để tham chiếu đến đối tượng `Authentication` được lưu trữ trong `SecurityContext`.

```java
// Listing 12.7 Lớp ProductService
@Service
public class ProductService {

  // Thêm điều kiện lọc cho các đối tượng trong collection được trả về bởi phương thức […]
  @PostFilter("filterObject.owner == authentication.name")
  public List<Product> findProducts() {
    List<Product> products = new ArrayList<>();
    products.add(new Product("beer", "nikolai"));
    products.add(new Product("candy", "nikolai"));
    products.add(new Product("chocolate", "julien"));
    return products;
  }
}
```

Chúng ta định nghĩa một lớp controller để có thể truy cập phương thức này thông qua một endpoint. Listing tiếp theo trình bày lớp controller đó.

```java
// Listing 12.8 Lớp ProductController
@RestController
public class ProductController {

  private final ProductService productService;

  // Bỏ qua constructor

  @GetMapping("/find")
  public List<Product> findProducts() {
    return productService.findProducts();
  }
}
```

Đã đến lúc chạy ứng dụng và kiểm thử hoạt động của nó bằng cách gọi endpoint `/find`. Chúng ta mong đợi sẽ chỉ thấy các sản phẩm thuộc sở hữu của người dùng đã xác thực xuất hiện trong thân phản hồi HTTP. Các đoạn mã tiếp theo hiển thị kết quả gọi endpoint lần lượt với từng người dùng là Nikolai và Julien. Để gọi endpoint `/find` và xác thực bằng tài khoản Julien, hãy sử dụng lệnh cURL sau:

```bash
curl -u julien:12345 http://localhost:8080/find
```

Thân phản hồi trả về là:

```json
[
  {"name":"chocolate","owner":"julien"}
]
```

Để gọi endpoint `/find` và xác thực bằng tài khoản Nikolai, hãy sử dụng lệnh cURL sau:

```bash
curl -u nikolai:12345 http://localhost:8080/find
```

Thân phản hồi trả về là:

```json
[
  {"name":"beer","owner":"nikolai"},
  {"name":"candy","owner":"nikolai"}
]
```

## 12.3 Sử dụng cơ chế lọc trong các repository Spring Data

Trong phần này, chúng ta sẽ thảo luận về việc áp dụng cơ chế lọc đối với các repository Spring Data. Việc hiểu rõ phương pháp này là vô cùng quan trọng bởi chúng ta thường xuyên sử dụng cơ sở dữ liệu để lưu trữ dữ liệu của ứng dụng. Hiện nay, việc phát triển các ứng dụng Spring Boot sử dụng Spring Data làm tầng trừu tượng cấp cao để kết nối với cơ sở dữ liệu (dù là SQL hay NoSQL) là rất phổ biến. Chúng ta sẽ cùng thảo luận về hai phương pháp áp dụng cơ chế lọc ở tầng repository khi sử dụng Spring Data, đồng thời hiện thực hóa chúng qua các ví dụ thực tế.

Phương pháp đầu tiên chúng ta tiếp cận là phương pháp bạn đã tìm hiểu trước đó trong chương này: sử dụng hai annotation `@PreFilter` và `@PostFilter`. Phương pháp thứ hai là tích hợp trực tiếp các quy tắc phân quyền vào trong các câu truy vấn. Như bạn sẽ thấy trong phần này, cần phải cân nhắc kỹ lưỡng khi lựa chọn cách áp dụng cơ chế lọc trong các repository Spring Data. Như đã đề cập, chúng ta có hai sự lựa chọn:

- Sử dụng các annotation `@PreFilter` và `@PostFilter`

- Áp dụng cơ chế lọc trực tiếp bên trong các câu truy vấn

Việc sử dụng annotation `@PreFilter` đối với các repository cũng tương tự như việc áp dụng nó ở bất kỳ tầng nào khác trong ứng dụng của bạn. Tuy nhiên, đối với hậu lọc, câu chuyện lại hoàn toàn khác. Việc sử dụng `@PostFilter` trên các phương thức của repository về mặt kỹ thuật thì hoạt động hoàn toàn bình thường, nhưng xét dưới góc độ hiệu năng, đây hiếm khi là một lựa chọn tối ưu.

Giả sử bạn có một ứng dụng quản lý tài liệu của công ty. Lập trình viên cần triển khai tính năng hiển thị toàn bộ danh sách tài liệu trên một trang web sau khi người dùng đăng nhập thành công. Người này quyết định sử dụng phương thức `findAll()` của repository Spring Data và đánh dấu nó bằng annotation `@PostFilter` để Spring Security tự động lọc tài liệu, sao cho phương thức chỉ trả về những tài liệu thuộc sở hữu của người dùng hiện tại. Cách tiếp cận này rõ ràng là sai lầm, bởi nó khiến ứng dụng phải tải toàn bộ các bản ghi từ cơ sở dữ liệu lên bộ nhớ rồi mới tiến hành lọc. Nếu hệ thống có số lượng tài liệu cực kỳ lớn, việc gọi `findAll()` mà không có cơ chế phân trang có thể dẫn đến lỗi tràn bộ nhớ `OutOfMemoryError`. Ngay cả khi lượng tài liệu chưa đủ lớn để làm đầy bộ nhớ heap, việc thực hiện lọc dữ liệu trên ứng dụng vẫn luôn kém hiệu quả hơn rất nhiều so với việc chỉ lấy đúng những gì cần thiết ngay từ cơ sở dữ liệu.

Tại tầng dịch vụ (service level), bạn không còn lựa chọn nào khác ngoài việc phải tiến hành lọc dữ liệu ngay trong ứng dụng. Tuy nhiên, nếu có thể can thiệp ngay từ tầng repository và biết chắc rằng mình chỉ cần lấy các bản ghi thuộc sở hữu của người dùng hiện tại, bạn nên thiết kế một câu truy vấn để chỉ rút trích đúng những tài liệu cần thiết từ cơ sở dữ liệu.

> **LƯU Ý**
>
> Trong mọi tình huống cần lấy dữ liệu từ một nguồn cung cấp dữ liệu bất kỳ — dù là cơ sở dữ liệu, dịch vụ web, luồng dữ liệu đầu vào (input stream) hay bất cứ thứ gì khác — hãy luôn đảm bảo rằng ứng dụng chỉ tải lên đúng phần dữ liệu mà nó thực sự cần. Hãy hạn chế tối đa việc phải thực hiện lọc dữ liệu bên trong ứng dụng.

Chúng ta hãy cùng xây dựng một ứng dụng, trong đó ban đầu chúng ta sẽ sử dụng annotation `@PostFilter` trực tiếp trên phương thức của repository Spring Data, sau đó sẽ chuyển sang phương pháp thứ hai là viết điều kiện trực tiếp bên trong câu truy vấn. Bằng cách này, chúng ta sẽ có cơ hội trải nghiệm thực tế cả hai phương pháp và đưa ra so sánh.

Tôi đã khởi tạo một dự án mới mang tên `ssia-ch12-ex4`, sử dụng cùng một lớp cấu hình giống các ví dụ trước trong chương. Tương tự như các ví dụ trên, chúng ta sẽ xây dựng ứng dụng quản lý sản phẩm, nhưng lần này dữ liệu chi tiết về sản phẩm sẽ được lấy từ một bảng trong cơ sở dữ liệu. Trong ví dụ này, chúng ta sẽ triển khai chức năng tìm kiếm sản phẩm. Chúng ta sẽ viết một endpoint tiếp nhận một chuỗi ký tự và trả về danh sách các sản phẩm có tên chứa chuỗi ký tự đó. Đồng thời, chúng ta phải đảm bảo chỉ trả về những sản phẩm thuộc sở hữu của chính người dùng đã đăng nhập.

Chúng ta sẽ sử dụng Spring Data JPA để kết nối tới cơ sở dữ liệu. Vì lý do này, chúng ta cần bổ sung dependency `spring-boot-starter-data-jpa` vào tệp `pom.xml`, cùng với một driver kết nối tương thích với hệ quản trị cơ sở dữ liệu mà bạn đang sử dụng. Đoạn mã tiếp theo cung cấp các dependency mà tôi sử dụng trong tệp `pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
  <scope>runtime</scope>
</dependency>
```

Trong tệp `application.properties`, chúng ta cấu hình các thuộc tính mà Spring Boot yêu cầu để thiết lập data source (nguồn dữ liệu). Trong đoạn mã dưới đây là các cấu hình mà tôi đã thêm vào tệp `application.properties` của mình:

```properties
spring.datasource.url=jdbc:mysql://localhost/spring?useLegacyDatetimeCode=false&server […]
spring.datasource.username=root
spring.datasource.password=
spring.datasource.initialization-mode=always
```

Chúng ta cũng cần có một bảng trong cơ sở dữ liệu để lưu trữ thông tin sản phẩm mà ứng dụng sẽ truy xuất. Chúng ta sẽ định nghĩa một tệp `schema.sql` chứa mã kịch bản tạo bảng, và một tệp `data.sql` chứa các câu lệnh chèn dữ liệu mẫu vào bảng. Bạn cần đặt cả hai tệp này (`schema.sql` và `data.sql`) vào thư mục tài nguyên `resources` của dự án Spring Boot để hệ thống tự động tìm thấy và thực thi chúng khi khởi động ứng dụng. Đoạn mã tiếp theo mô tả câu lệnh SQL dùng để tạo bảng mà chúng ta cần viết trong tệp `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS `spring`.`product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  `owner` VARCHAR(45) NULL,
  PRIMARY KEY (`id`)
);
```

Trong tệp `data.sql`, tôi viết ba câu lệnh `INSERT` như trình bày trong đoạn mã tiếp theo. Các câu lệnh này sẽ khởi tạo dữ liệu mẫu để chúng ta kiểm chứng hoạt động của ứng dụng sau đó:

```sql
INSERT IGNORE INTO `spring`.`product` (`id`, `name`, `owner`) VALUES ('1', 'beer', 'ni […]
INSERT IGNORE INTO `spring`.`product` (`id`, `name`, `owner`) VALUES ('2', 'candy', 'n […]
INSERT IGNORE INTO `spring`.`product` (`id`, `name`, `owner`) VALUES ('3', 'chocolate' […]
```

> **LƯU Ý**
>
> Hãy nhớ rằng chúng ta đã sử dụng cùng tên bảng này trong các ví dụ khác xuyên suốt cuốn sách. Nếu bạn đã có sẵn các bảng trùng tên từ những ví dụ trước, bạn nên xóa bỏ (drop) chúng trước khi bắt đầu dự án này. Một giải pháp thay thế là sử dụng một schema khác.

Để ánh xạ bảng sản phẩm vào ứng dụng, chúng ta cần viết một lớp thực thể (entity class). Listing dưới đây định nghĩa thực thể `Product`.

```java
// Listing 12.9 Lớp thực thể Product
@Entity
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private int id;
  private String name;
  private String owner;

  // Bỏ qua các getter và setter
}
```

Đối với thực thể `Product`, chúng ta cũng định nghĩa một interface repository Spring Data như trong listing tiếp theo. Hãy chú ý rằng lần này chúng ta áp dụng trực tiếp annotation `@PostFilter` ngay trên phương thức được khai báo bởi interface repository.

```java
// Listing 12.10 Interface ProductRepository
public interface ProductRepository extends JpaRepository<Product, Integer> {
  // Sử dụng annotation @PostFilter cho phương thức khai báo bởi repository Spring Dat […]
  @PostFilter("filterObject.owner == authentication.name")
  List<Product> findProductByNameContains(String text);
}
```

Listing tiếp theo sẽ hướng dẫn cách định nghĩa một lớp controller để triển khai endpoint mà chúng ta dùng để kiểm thử hoạt động của ứng dụng.

```java
// Listing 12.11 Lớp ProductController
@RestController
public class ProductController {
  private final ProductRepository productRepository;

  // Bỏ qua constructor
  @GetMapping("/products/{text}")
  public List<Product> findProductsContaining(@PathVariable String text) {
    return productRepository.findProductByNameContains(text);
  }
}
```

Khởi chạy ứng dụng, chúng ta có thể kiểm thử xem điều gì xảy ra khi gọi endpoint `/products/{text}`. Bằng cách tìm kiếm với ký tự `c` trong khi xác thực dưới danh nghĩa tài khoản Nikolai, phản hồi HTTP trả về chỉ chứa duy nhất sản phẩm `candy`. Mặc dù từ `chocolate` cũng chứa chữ `c`, nhưng do sản phẩm này thuộc sở hữu của Julien nên nó sẽ không xuất hiện trong phản hồi. Bạn có thể xem các cuộc gọi kiểm thử cùng kết quả trả về trong đoạn mã dưới đây. Để gọi endpoint `/products` và xác thực với tài khoản Nikolai, hãy sử dụng lệnh sau:

```bash
curl -u nikolai:12345 http://localhost:8080/products/c
```

Thân phản hồi trả về là:

```json
[
  {"id":2,"name":"candy","owner":"nikolai"}
]
```

Để gọi endpoint `/products` và xác thực với tài khoản Julien, hãy dùng lệnh:

```bash
curl -u julien:12345 http://localhost:8080/products/c
```

Thân phản hồi trả về là:

```json
[
  {"id":3,"name":"chocolate","owner":"julien"}
]
```

Chúng ta đã thảo luận ở phần trước rằng việc sử dụng `@PostFilter` trong repository không phải là giải pháp tối ưu. Thay vào đó, chúng ta nên đảm bảo không tải từ cơ sở dữ liệu lên những gì không cần thiết. Vậy làm thế nào để thay đổi ví dụ hiện tại nhằm mục đích chỉ lấy đúng phần dữ liệu cần dùng thay vì phải truy vấn toàn bộ rồi mới tiến hành lọc? Chúng ta hoàn toàn có thể nhúng trực tiếp các biểu thức SpEL vào bên trong các câu truy vấn được sử dụng bởi lớp repository. Để thực hiện điều này, chúng ta tiến hành qua hai bước đơn giản sau:

1. Chúng ta thêm một đối tượng có kiểu `SecurityEvaluationContextExtension` vào Spring context. Điều này có thể được thực hiện dễ dàng thông qua một phương thức `@Bean` trong lớp cấu hình.

2. Chúng ta điều chỉnh các câu truy vấn trong lớp repository bằng cách bổ sung thêm các điều kiện lọc dữ liệu phù hợp.

Trong dự án của chúng ta, để đưa bean `SecurityEvaluationContextExtension` vào trong context, cần điều chỉnh lớp cấu hình như được trình bày trong listing tiếp theo. Nhằm lưu giữ lại toàn bộ mã nguồn của từng ví dụ trong cuốn sách, tôi sẽ sử dụng một dự án khác có tên là `ssia-ch12-ex5`.

```java
// Listing 12.12 Thêm SecurityEvaluationContextExtension vào context
@Configuration
@EnableMethodSecurity
public class ProjectConfig {

  // Bổ sung một SecurityEvaluationContextExtension vào Spring context
  @Bean
  public SecurityEvaluationContextExtension securityEvaluationContextExtension() {
    return new SecurityEvaluationContextExtension();
  }

  // Bỏ qua phần khai báo UserDetailsService và PasswordEncoder
}
```

Trong interface `ProductRepository`, chúng ta thêm câu lệnh truy vấn ngay phía trên phương thức và điều chỉnh mệnh đề `WHERE` bằng một điều kiện thích hợp sử dụng biểu thức SpEL. Listing dưới đây thể hiện sự thay đổi này.

```java
// Listing 12.13 Sử dụng SpEL trong câu truy vấn của interface repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

  // Sử dụng SpEL trong câu truy vấn để thêm điều kiện lọc theo chủ sở hữu của bản ghi […]
  @Query("""
    SELECT p FROM Product p WHERE
    p.name LIKE %:text% AND
    p.owner=?#{authentication.name}
    """)
  List<Product> findProductByNameContains(String text);
}
```

Bây giờ chúng ta có thể khởi động ứng dụng và kiểm thử bằng cách gọi endpoint `/products/{text}`. Chúng ta mong đợi hành vi của ứng dụng vẫn được giữ nguyên giống như khi sử dụng `@PostFilter`. Tuy nhiên, lúc này chỉ những bản ghi thuộc về đúng chủ sở hữu mới được truy xuất từ cơ sở dữ liệu, giúp cho tính năng hoạt động nhanh hơn và đáng tin cậy hơn nhiều. Các đoạn mã tiếp theo trình bày các cuộc gọi tới endpoint này. Để gọi endpoint `/products` và xác thực với tài khoản Nikolai, chúng ta dùng:

```bash
curl -u nikolai:12345 http://localhost:8080/products/c
```

Thân phản hồi trả về là:

```json
[
  {"id":2,"name":"candy","owner":"nikolai"}
]
```

Để gọi endpoint `/products` và xác thực với tài khoản Julien, chúng ta sử dụng:

```bash
curl -u julien:12345 http://localhost:8080/products/c
```

Thân phản hồi trả về là:

```json
[
  {"id":3,"name":"chocolate","owner":"julien"}
]
```

## Tóm tắt

- Lọc dữ liệu (Filtering) là một giải pháp phân quyền mà trong đó framework sẽ kiểm tra các tham số đầu vào hoặc giá trị trả về của một phương thức, rồi loại bỏ những phần tử không đáp ứng được các tiêu chí do bạn định nghĩa. Với tư cách là một phương pháp phân quyền, cơ chế lọc tập trung kiểm soát các giá trị đầu vào và đầu ra của phương thức thay vì tác động lên chính quá trình thực thi của phương thức đó. Bạn sử dụng cơ chế lọc để đảm bảo phương thức không tiếp nhận các giá trị nằm ngoài phạm vi được phép xử lý, đồng thời không trả về các dữ liệu mà phía gọi phương thức không có quyền tiếp cận. Khi sử dụng cơ chế lọc, bạn không giới hạn quyền truy cập vào phương thức, mà giới hạn những gì có thể truyền vào qua tham số hoặc những gì phương thức trả ra. Phương pháp này cho phép bạn kiểm soát chặt chẽ cả đầu vào và đầu ra của phương thức.

- Để giới hạn các giá trị có thể truyền qua tham số phương thức, bạn sử dụng annotation `@PreFilter`. Annotation này tiếp nhận điều kiện lọc để xác định xem những giá trị nào được phép truyền vào làm tham số. Framework sẽ lọc bỏ khỏi collection tham số đầu vào tất cả các giá trị không tuân thủ quy tắc đã thiết lập.

- Để sử dụng annotation `@PreFilter`, tham số của phương thức bắt buộc phải là một collection hoặc một mảng. Trong biểu thức SpEL định nghĩa quy tắc lọc của annotation, chúng ta tham chiếu đến các đối tượng bên trong collection bằng từ khóa `filterObject`.

- Để giới hạn các giá trị trả về của phương thức, bạn sử dụng annotation `@PostFilter`. Khi sử dụng annotation này, kiểu trả về của phương thức bắt buộc phải là một collection hoặc một mảng. Framework sẽ lọc các giá trị trong collection trả về dựa theo quy tắc được định nghĩa làm giá trị của annotation `@PostFilter`.

- Bạn cũng có thể sử dụng các annotation `@PreFilter` và `@PostFilter` với các repository Spring Data. Tuy nhiên, việc áp dụng `@PostFilter` trên một phương thức repository Spring Data hiếm khi là một lựa chọn tốt. Để tránh gặp phải các vấn đề về hiệu năng, việc lọc kết quả trong trường hợp này nên được thực hiện trực tiếp ở cấp độ cơ sở dữ liệu.

- Spring Security cung cấp khả năng tích hợp dễ dàng với Spring Data, và bạn nên tận dụng tính năng này để tránh việc lạm dụng `@PostFilter` trên các phương thức của repository Spring Data.
