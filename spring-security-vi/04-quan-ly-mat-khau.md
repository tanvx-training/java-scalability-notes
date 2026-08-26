# Chương 4: Quản lý mật khẩu

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chương này gồm**

- Triển khai và làm việc với `PasswordEncoder`

- Sử dụng các công cụ được cung cấp bởi mô-đun Crypto của Spring Security

Trong Chương 3, chúng ta đã thảo luận về việc quản lý người dùng trong một ứng dụng được triển khai với Spring Security. Nhưng còn mật khẩu thì sao? Chúng chắc chắn là một phần thiết yếu trong luồng xác thực. Trong chương này, bạn sẽ học cách quản lý mật khẩu và các bí mật (secret) trong một ứng dụng được triển khai với Spring Security. Chúng ta sẽ thảo luận về giao ước `PasswordEncoder` và các công cụ do mô-đun Spring Security Crypto (SSCM) cung cấp để quản lý mật khẩu.

## 4.1 Sử dụng các bộ mã hóa mật khẩu

Từ Chương 3, giờ đây bạn hẳn đã có một hình dung rõ ràng về interface `UserDetails` là gì, cũng như nhiều cách khác nhau để sử dụng triển khai của nó. Tuy nhiên, như bạn đã học ở Chương 2, các tác nhân khác nhau sẽ quản lý việc biểu diễn người dùng trong suốt quá trình xác thực và phân quyền. Bạn cũng đã biết rằng một số thành phần này có các giá trị mặc định, chẳng hạn như `UserDetailsService` và `PasswordEncoder`. Giờ đây bạn đã biết cách ghi đè các cấu hình mặc định này. Chúng ta sẽ tiếp tục đi sâu tìm hiểu về các bean này và cách triển khai chúng, vì vậy trong phần này, chúng ta sẽ phân tích `PasswordEncoder`. Hình 4.1 nhắc lại cho bạn vị trí của `PasswordEncoder` trong quá trình xác thực.

*Hình 4.1: Quá trình xác thực của Spring Security. `AuthenticationProvider` sử dụng `PasswordEncoder` để xác thực mật khẩu của người dùng trong quá trình xác thực.*

Vì nhìn chung, một hệ thống không quản lý mật khẩu dưới dạng văn bản thô (plain text), các mật khẩu này thường trải qua một số bước biến đổi để giúp việc đọc và đánh cắp chúng trở nên khó khăn hơn. Đối với trách nhiệm này, Spring Security định nghĩa một giao ước riêng biệt. Để giải thích một cách đơn giản trong phần này, tôi cung cấp nhiều ví dụ mã nguồn liên quan đến triển khai `PasswordEncoder`. Chúng ta sẽ bắt đầu bằng việc tìm hiểu giao ước này, sau đó tự viết triển khai của mình trong một dự án. Tiếp theo, ở phần 4.1.3, tôi sẽ cung cấp cho bạn danh sách các triển khai phổ biến nhất và được sử dụng rộng rãi nhất của `PasswordEncoder` do Spring Security cung cấp.

### 4.1.1 Giao ước PasswordEncoder

Trong phần này, chúng ta sẽ thảo luận về định nghĩa của giao ước `PasswordEncoder`. Bạn triển khai giao ước này để chỉ ra cho Spring Security biết cách xác thực mật khẩu của người dùng. Trong quá trình xác thực, `PasswordEncoder` sẽ quyết định xem mật khẩu có hợp lệ hay không. Mọi hệ thống đều lưu trữ mật khẩu đã được mã hóa theo một cách nào đó. Bạn nên lưu trữ chúng dưới dạng băm (hashed) để không ai có cơ hội đọc được chúng. `PasswordEncoder` cũng có khả năng mã hóa mật khẩu. Các phương thức `encode()` và `matches()` mà giao ước này khai báo thực chất chính là định nghĩa cho trách nhiệm của nó. Cả hai phương thức đều là một phần của cùng một giao ước vì chúng có mối liên kết chặt chẽ với nhau. Cách ứng dụng mã hóa một mật khẩu có liên quan mật thiết đến cách mật khẩu đó được xác thực. Đầu tiên, hãy cùng xem xét lại nội dung của interface `PasswordEncoder`:

```java
public interface PasswordEncoder {
 String encode(CharSequence rawPassword);
 boolean matches(CharSequence rawPassword, String encodedPassword);
 default boolean upgradeEncoding(String encodedPassword) {
 return false;
 }
}
```

Interface này định nghĩa hai phương thức trừu tượng và một phương thức có triển khai mặc định. Các phương thức trừu tượng `encode()` và `matches()` cũng là những phương thức bạn thường nghe nói đến nhiều nhất khi làm việc với một triển khai `PasswordEncoder`.

Mục đích của phương thức `encode(CharSequence rawPassword)` là trả về một chuỗi đã qua biến đổi từ một chuỗi được cung cấp. Xét về mặt chức năng của Spring Security, nó được sử dụng để cung cấp tính năng mã hóa (encryption) hoặc băm (hash) cho một mật khẩu cụ thể. Sau đó, bạn có thể sử dụng phương thức `matches(CharSequence rawPassword, String encodedPassword)` để kiểm tra xem một chuỗi đã mã hóa có khớp với một mật khẩu thô hay không. Bạn sử dụng phương thức `matches()` trong quá trình xác thực để kiểm thử một mật khẩu được cung cấp so với một tập hợp các thông tin xác thực đã biết. Phương thức thứ ba, có tên là `upgradeEncoding(String encodedPassword)`, mặc định trả về `false` trong giao ước. Nếu bạn ghi đè nó để trả về `true`, thì mật khẩu đã mã hóa sẽ được mã hóa lại một lần nữa để tăng tính bảo mật.

Trong một số trường hợp, việc mã hóa một mật khẩu đã được mã hóa có thể khiến việc lấy lại mật khẩu văn bản rõ (cleartext password) từ kết quả trở nên khó khăn hơn. Nhìn chung, đây là một kiểu che giấu bảo mật (obscurity) mà cá nhân tôi không thích. Tuy nhiên, framework vẫn cung cấp khả năng này nếu bạn thấy nó phù hợp với trường hợp của mình.

### 4.1.2 Tự triển khai PasswordEncoder của riêng bạn

Như bạn đã quan sát, hai phương thức `matches()` và `encode()` có một mối quan hệ mật thiết. Nếu bạn ghi đè chúng, chúng phải luôn tương ứng với nhau về mặt chức năng: một chuỗi được trả về bởi phương thức `encode()` phải luôn có thể được xác minh bằng phương thức `matches()` của cùng một `PasswordEncoder`. Trong phần này, bạn sẽ triển khai giao ước `PasswordEncoder` và định nghĩa hai phương thức trừu tượng được khai báo bởi interface này. Khi đã biết cách triển khai `PasswordEncoder`, bạn có thể lựa chọn cách ứng dụng quản lý mật khẩu cho quá trình xác thực. Triển khai đơn giản nhất là một bộ mã hóa mật khẩu coi mật khẩu là văn bản thô: tức là nó không thực hiện bất kỳ hoạt động mã hóa nào trên mật khẩu.

Quản lý mật khẩu ở dạng văn bản rõ (cleartext) chính xác là những gì instance `NoOpPasswordEncoder` thực hiện. Chúng ta đã sử dụng lớp này trong ví dụ đầu tiên ở Chương 2. Nếu bạn muốn tự viết một bộ mã hóa như vậy, nó sẽ trông tương tự như đoạn mã dưới đây.

**Đoạn mã 4.1 Triển khai đơn giản nhất của một PasswordEncoder**

```java
public class PlainTextPasswordEncoder implements PasswordEncoder {

 @Override
 public String encode(CharSequence rawPassword) {
 return rawPassword.toString();
 }

 @Override
 public boolean matches(CharSequence rawPassword, String encodedPassword) {
 return rawPassword.equals(encodedPassword);
 }
}
```

Kết quả của việc mã hóa luôn trùng khớp với mật khẩu ban đầu. Vì vậy, để kiểm tra xem chúng có khớp nhau hay không, bạn chỉ cần so sánh các chuỗi bằng phương thức `equals()`. Một triển khai đơn giản của `PasswordEncoder` sử dụng thuật toán băm SHA-512 sẽ trông giống như đoạn mã tiếp theo.

**Đoạn mã 4.2 Triển khai một PasswordEncoder sử dụng SHA-512**

```java
public class Sha512PasswordEncoder implements PasswordEncoder {

 @Override
 public String encode(CharSequence rawPassword) {
 return hashWithSHA512(rawPassword.toString());
 }

 @Override
 public boolean matches(CharSequence rawPassword, String encodedPassword) {
 String hashedPassword = encode(rawPassword);
 return encodedPassword.equals(hashedPassword);
 }

 // Omitted code
}
```

Trong Đoạn mã 4.2, chúng ta sử dụng một phương thức để băm giá trị chuỗi được cung cấp bằng thuật toán SHA-512. Tôi tạm thời bỏ qua phần triển khai của phương thức này trong Đoạn mã 4.2, nhưng bạn có thể tìm thấy nó trong Đoạn mã 4.3. Chúng ta gọi phương thức này từ phương thức `encode()`, lúc này phương thức này sẽ trả về giá trị băm cho đầu vào của nó. Để xác thực một giá trị băm so với một đầu vào, phương thức `matches()` sẽ băm mật khẩu thô ở đầu vào của nó và so sánh xem nó có bằng với giá trị băm mà nó đang dùng để xác thực hay không.

**Đoạn mã 4.3 Triển khai phương thức băm đầu vào bằng SHA-512**

```java
private String hashWithSHA512(String input) {
 StringBuilder result = new StringBuilder();
 try {
 MessageDigest md = MessageDigest.getInstance("SHA-512");
 byte [] digested = md.digest(input.getBytes());
 for (int i = 0; i < digested.length; i++) {
 result.append(Integer.toHexString(0xFF & digested[i]));
 }
 } catch (NoSuchAlgorithmException e) {
 throw new RuntimeException("Bad algorithm");
 }
 return result.toString();
}
```

Bạn sẽ được tìm hiểu các phương án tốt hơn để thực hiện việc này trong phần tiếp theo, vì vậy hiện tại không cần quá bận tâm đến đoạn mã này.

### 4.1.3 Lựa chọn từ các triển khai PasswordEncoder có sẵn

Mặc dù việc biết cách tự triển khai `PasswordEncoder` mang lại sự linh hoạt rất lớn, bạn cũng cần biết rằng Spring Security đã cung cấp sẵn một số triển khai vô cùng hữu ích. Nếu một trong số chúng phù hợp với ứng dụng của bạn, bạn sẽ không cần phải tự viết lại từ đầu. Trong phần này, chúng ta sẽ thảo luận về các tùy chọn triển khai `PasswordEncoder` mà Spring Security cung cấp. Đó là:

- `NoOpPasswordEncoder` — Không mã hóa mật khẩu mà giữ nguyên ở dạng văn bản thô. Chúng ta chỉ sử dụng triển khai này cho các ví dụ minh họa. Vì nó không băm mật khẩu, bạn tuyệt đối không được dùng nó trong các môi trường thực tế.

- `StandardPasswordEncoder` — Sử dụng SHA-256 để băm mật khẩu. Triển khai này hiện đã bị khai tử (deprecated) và bạn không nên dùng nó cho các dự án mới. Lý do là thuật toán băm này không còn được coi là đủ an toàn nữa, nhưng bạn vẫn có thể bắt gặp nó trong các ứng dụng cũ. Tốt nhất, nếu phát hiện nó trong các ứng dụng hiện có, bạn nên thay thế bằng một bộ mã hóa mật khẩu khác mạnh mẽ hơn.

- `Pbkdf2PasswordEncoder` — Sử dụng hàm dẫn xuất khóa dựa trên mật khẩu phiên bản 2 (PBKDF2).

- `BCryptPasswordEncoder` — Sử dụng hàm băm mạnh bcrypt để mã hóa mật khẩu.

- `SCryptPasswordEncoder` — Sử dụng hàm băm scrypt để mã hóa mật khẩu.

Để tìm hiểu thêm về kỹ thuật băm và các thuật toán này, bạn có thể tham khảo phần thảo luận rất chi tiết tại Chương 2 của cuốn sách Real-World Cryptography tác giả David Wong (Manning, 2021) tại địa chỉ http://mng.bz/QRJw.

Hãy cùng xem qua một vài ví dụ về cách tạo các thể hiện (instance) của các triển khai `PasswordEncoder` này. `NoOpPasswordEncoder` không hề mã hóa mật khẩu. Nó có cấu trúc triển khai tương tự như lớp `PlainTextPasswordEncoder` trong ví dụ ở Đoạn mã 4.1. Vì lý do này, chúng ta chỉ sử dụng bộ mã hóa mật khẩu này trong các ví dụ lý thuyết. Ngoài ra, lớp `NoOpPasswordEncoder` được thiết kế theo dạng singleton. Bạn không thể gọi trực tiếp phương thức khởi tạo của nó từ bên ngoài lớp, nhưng có thể sử dụng phương thức `NoOpPasswordEncoder.getInstance()` để lấy thực thể của lớp như sau:

```java
PasswordEncoder p = NoOpPasswordEncoder.getInstance();
```

Triển khai `StandardPasswordEncoder` do Spring Security cung cấp sử dụng SHA-256 để băm mật khẩu. Với `StandardPasswordEncoder`, bạn có thể cung cấp một chuỗi bí mật (secret) để sử dụng trong quá trình băm. Giá trị bí mật này được thiết lập thông qua tham số của phương thức khởi tạo. Nếu chọn gọi phương thức khởi tạo không tham số, hệ thống sẽ sử dụng một chuỗi rỗng làm giá trị cho khóa. Tuy nhiên, `StandardPasswordEncoder` hiện đã bị khai tử (deprecated), và tôi không khuyến khích bạn sử dụng nó cho các triển khai mới của mình. Bạn vẫn có thể bắt gặp các ứng dụng cũ hoặc mã nguồn di sản vẫn đang dùng nó, vì thế bạn cần phải biết đến sự tồn tại của nó. Đoạn mã tiếp theo chỉ ra cách tạo các thể hiện của bộ mã hóa mật khẩu này:

```java
PasswordEncoder p = new StandardPasswordEncoder();
PasswordEncoder p = new StandardPasswordEncoder("secret");
```

Một lựa chọn khác do Spring Security cung cấp là triển khai `Pbkdf2PasswordEncoder` sử dụng PBKDF2 để mã hóa mật khẩu. Để tạo các thể hiện của `Pbkdf2PasswordEncoder`, bạn có thể thực hiện như sau:

```java
PasswordEncoder p = new Pbkdf2PasswordEncoder("secret", 16, 310000, Pbkdf2PasswordEnco […]
```

PBKDF2 là một hàm băm chậm khá đơn giản, thực hiện thuật toán HMAC theo số lần được chỉ định bởi tham số vòng lặp (iterations). Ba tham số đầu tiên trong lệnh gọi trên lần lượt là: giá trị của khóa dùng cho quá trình mã hóa, số vòng lặp để mã hóa mật khẩu, và độ rộng của chuỗi băm. Tham số thứ hai và thứ ba quyết định độ mạnh của kết quả đầu ra. Tham số thứ tư xác định thuật toán băm. Bạn có thể chọn các phương án sau:

- `PBKDF2WithHmacSHA1`

- `PBKDF2WithHmacSHA256`

- `PBKDF2WithHmacSHA512`

Bạn hoàn toàn có thể tùy chọn tăng hoặc giảm số vòng lặp, cũng như độ dài của kết quả. Chuỗi băm càng dài thì mật khẩu càng bảo mật (điều này cũng đúng với độ rộng của chuỗi băm). Tuy nhiên, hãy lưu ý rằng hiệu năng sẽ bị ảnh hưởng bởi các giá trị này: số vòng lặp càng nhiều thì ứng dụng của bạn càng tiêu tốn nhiều tài nguyên hơn. Bạn nên đưa ra một sự thỏa hiệp khôn ngoan giữa tài nguyên tiêu hao để tạo chuỗi băm và độ mạnh cần thiết của việc mã hóa.

> **LƯU Ý**
>
> Trong cuốn sách này, tôi có đề cập đến một số khái niệm mã hóa mà bạn có thể muốn tìm hiểu thêm. Để biết thêm thông tin hữu ích về HMAC và các chi tiết mã hóa khác, tôi đề xuất cuốn sách Real-World Cryptography của David Wong (Manning, 2021). Chương 3 của cuốn sách đó cung cấp thông tin rất chi tiết về HMAC. Bạn có thể tìm đọc tại http://mng.bz/XqJG.

Một lựa chọn tuyệt vời khác mà Spring Security cung cấp là `BCryptPasswordEncoder`, sử dụng hàm băm mạnh bcrypt để mã hóa mật khẩu. Bạn có thể khởi tạo `BCryptPasswordEncoder` bằng cách gọi phương thức khởi tạo không tham số. Tuy nhiên, bạn cũng có tùy chọn chỉ định hệ số độ mạnh đại diện cho số vòng lặp log (vòng lặp logarit) được sử dụng trong quá trình mã hóa. Hơn nữa, bạn cũng có thể thay đổi thực thể `SecureRandom` được dùng để mã hóa:

```java
PasswordEncoder p = new BCryptPasswordEncoder();
PasswordEncoder p = new BCryptPasswordEncoder(4);
SecureRandom s = SecureRandom.getInstanceStrong();
PasswordEncoder p = new BCryptPasswordEncoder(4, s);
```

Giá trị số vòng lặp log mà bạn cung cấp sẽ ảnh hưởng đến số lần lặp mà thao tác băm sử dụng. Số vòng lặp thực tế sẽ là $2^{\text{log rounds}}$. Để tính toán số vòng lặp, giá trị của vòng lặp log chỉ có thể nằm trong khoảng từ 4 đến 31. Bạn có thể chỉ định giá trị này bằng cách gọi một trong các phương thức khởi tạo nạp chồng (overloaded constructor) thứ hai hoặc thứ ba, như đã trình bày trong đoạn mã trước.

Tùy chọn cuối cùng mà tôi muốn giới thiệu tới bạn là `SCryptPasswordEncoder` (Hình 4.2). Bộ mã hóa mật khẩu này sử dụng hàm băm scrypt. Đối với `SCryptPasswordEncoder`, bạn có thể tạo các thể hiện của nó như minh họa trong Hình 4.2.

```java
PasswordEncoder p = new SCryptPasswordEncoder(16384, 8, 1, 32, 64);
```

- 16384: Chi phí CPU (CPU cost)

- 8: Chi phí bộ nhớ (Memory cost)

- 1: Hệ số song song hóa (Parallelization coefficient)

- 32: Độ dài khóa (Key length)

- 64: Độ dài muối (Salt length)

*Hình 4.2 Phương thức khởi tạo của SCryptPasswordEncoder nhận vào năm tham số, cho phép bạn cấu hình chi phí CPU, chi phí bộ nhớ, hệ số song song, độ dài khóa và độ dài muối.*

### 4.1.4 Nhiều chiến lược mã hóa với DelegatingPasswordEncoder

Trong phần này, chúng ta sẽ thảo luận về các trường hợp mà luồng xác thực phải áp dụng nhiều triển khai khác nhau để so khớp mật khẩu. Bạn cũng sẽ học cách áp dụng một công cụ hữu ích đóng vai trò là một `PasswordEncoder` trong ứng dụng của mình. Thay vì tự có triển khai riêng, công cụ này sẽ ủy quyền (delegate) cho các đối tượng khác triển khai giao ước `PasswordEncoder`.

Trong một số ứng dụng, bạn sẽ thấy việc sở hữu nhiều bộ mã hóa mật khẩu khác nhau và lựa chọn giữa chúng dựa trên một số cấu hình cụ thể là rất hữu ích. Một kịch bản phổ biến mà tôi thường thấy `DelegatingPasswordEncoder` được áp dụng trong các ứng dụng thực tế là khi thuật toán mã hóa bị thay đổi kể từ một phiên bản cụ thể nào đó của ứng dụng. Hãy tưởng tượng ai đó phát hiện ra lỗ hổng bảo mật trong thuật toán hiện tại, và bạn muốn đổi sang thuật toán mới cho những người dùng mới đăng ký, nhưng lại không muốn thay đổi thông tin đăng nhập của những người dùng hiện tại. Hệ quả là bạn sẽ có nhiều loại chuỗi băm khác nhau trong hệ thống. Bạn sẽ xử lý tình huống này thế nào? Mặc dù đây không phải là cách tiếp cận duy nhất cho kịch bản này, nhưng sử dụng một đối tượng `DelegatingPasswordEncoder` là một lựa chọn tối ưu.

`DelegatingPasswordEncoder` là một triển khai của giao ước `PasswordEncoder`. Thay vì tự mình thực hiện thuật toán mã hóa, nó sẽ ủy quyền cho một thực thể triển khai khác của cùng giao ước này. Chuỗi băm sẽ bắt đầu bằng một tiền tố (prefix) chỉ tên thuật toán được dùng để tạo ra chuỗi băm đó. `DelegatingPasswordEncoder` sẽ dựa vào tiền tố này để ủy quyền cho đúng triển khai `PasswordEncoder` tương ứng.

Nghe có vẻ phức tạp, nhưng thông qua ví dụ dưới đây, bạn sẽ thấy nó cực kỳ đơn giản. Hình 4.3 mô tả mối quan hệ giữa các thực thể `PasswordEncoder`. Lớp `DelegatingPasswordEncoder` nắm giữ một danh sách các triển khai `PasswordEncoder` mà nó sẽ ủy quyền công việc. Nó lưu trữ các thực thể này trong một Map. `NoOpPasswordEncoder` được gán với khóa `noop`, trong khi triển khai `BCryptPasswordEncoder` được gán với khóa `bcrypt`. Khi mật khẩu có tiền tố `{noop}`, `DelegatingPasswordEncoder` sẽ chuyển giao nhiệm vụ cho `NoOpPasswordEncoder`. Nếu tiền tố là `{bcrypt}`, hành động sẽ được chuyển giao cho triển khai `BCryptPasswordEncoder`, như được trình bày trong Hình 4.4.

*Hình 4.3 Trong kịch bản này, DelegatingPasswordEncoder sử dụng NoOpPasswordEncoder để xử lý các mật khẩu có tiền tố {noop}, BCryptPasswordEncoder cho các mật khẩu bắt đầu bằng {bcrypt}, và SCryptPasswordEncoder cho các mật khẩu bắt đầu bằng {scrypt}. Khi mật khẩu đi kèm với tiền tố {noop}, DelegatingPasswordEncoder sẽ chuyển hướng xử lý đến phiên bản NoOpPasswordEncoder.*

*Hình 4.4 Tại đây, DelegatingPasswordEncoder giao nhiệm vụ xử lý mật khẩu có tiền tố {noop} cho NoOpPasswordEncoder, tiền tố {bcrypt} cho BCryptPasswordEncoder, và tiền tố {scrypt} cho SCryptPasswordEncoder. Nếu mật khẩu mang tiền tố {bcrypt}, DelegatingPasswordEncoder sẽ định tuyến quy trình đến cơ chế của BCryptPasswordEncoder.*

Tiếp theo, hãy cùng tìm hiểu cách định nghĩa một `DelegatingPasswordEncoder`. Bạn bắt đầu bằng việc tạo một tập hợp các thực thể triển khai `PasswordEncoder` mong muốn, sau đó nhóm chúng lại trong một `DelegatingPasswordEncoder` như trong đoạn mã dưới đây.

**Đoạn mã 4.4 Tạo một thể hiện của DelegatingPasswordEncoder**

```java
@Configuration
public class ProjectConfig {

 // Mã nguồn được lược bỏ

 @Bean
 public PasswordEncoder passwordEncoder() {
 Map<String, PasswordEncoder> encoders = new HashMap<>();
 encoders.put("noop", NoOpPasswordEncoder.getInstance());
 encoders.put("bcrypt", new BCryptPasswordEncoder());
 encoders.put("scrypt", new SCryptPasswordEncoder());
 return new DelegatingPasswordEncoder("bcrypt", encoders);
 }
}
```

`DelegatingPasswordEncoder` chỉ đơn thuần là một công cụ đóng vai trò như một `PasswordEncoder`, vì vậy bạn có thể sử dụng nó khi cần lựa chọn từ một tập hợp các triển khai. Trong Đoạn mã 4.4, thực thể `DelegatingPasswordEncoder` được khai báo chứa các tham chiếu đến `NoOpPasswordEncoder`, `BCryptPasswordEncoder` và `SCryptPasswordEncoder`, đồng thời thiết lập mặc định sẽ ủy quyền cho triển khai `BCryptPasswordEncoder`. Dựa trên tiền tố của chuỗi băm, `DelegatingPasswordEncoder` sẽ chọn đúng triển khai `PasswordEncoder` phù hợp để so khớp mật khẩu. Tiền tố này chứa khóa giúp nhận diện bộ mã hóa mật khẩu tương ứng trong Map. Nếu không có tiền tố nào, `DelegatingPasswordEncoder` sẽ sử dụng bộ mã hóa mặc định. Bộ mã hóa mặc định chính là bộ mã hóa được truyền vào làm tham số đầu tiên khi khởi tạo thực thể `DelegatingPasswordEncoder`. Đối với đoạn mã trong Đoạn mã 4.4, bộ mã hóa mặc định là `bcrypt`.

> **LƯU Ý**
>
> Cặp dấu ngoặc nhọn `{}` là một phần của tiền tố chuỗi băm và phải bao bọc lấy tên của khóa nhận diện. Ví dụ, nếu chuỗi băm được cung cấp là `{noop}12345`, `DelegatingPasswordEncoder` sẽ ủy quyền cho `NoOpPasswordEncoder` mà chúng ta đã đăng ký với khóa `noop`. Một lần nữa, hãy nhớ rằng cặp dấu ngoặc nhọn này là bắt buộc trong tiền tố.

Nếu chuỗi băm có dạng như đoạn mã tiếp theo, bộ mã hóa mật khẩu được sử dụng sẽ là bộ mã hóa được gán với tiền tố `{bcrypt}`, tức là `BCryptPasswordEncoder`. Đây cũng là bộ mã hóa mà ứng dụng sẽ ủy quyền xử lý nếu hoàn toàn không có tiền tố nào, vì chúng ta đã định nghĩa nó làm triển khai mặc định:

```text
{bcrypt}$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG
```

Để thuận tiện, Spring Security cung cấp một phương thức giúp tạo nhanh một `DelegatingPasswordEncoder` chứa sẵn Map liên kết tới tất cả các triển khai `PasswordEncoder` tiêu chuẩn. Lớp `PasswordEncoderFactories` cung cấp phương thức tĩnh `createDelegatingPasswordEncoder()`, trả về một triển khai `DelegatingPasswordEncoder` với đầy đủ các cấu hình ánh xạ `PasswordEncoder` và sử dụng `bcrypt` làm bộ mã hóa mặc định:

```java
PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEnc […]
```

### Encoding so với encrypting so với hashing

Trong các phần trước, tôi thường xuyên sử dụng các thuật ngữ encoding (mã hóa dữ liệu), encrypting (mã hóa mật mã) và hashing (băm). Tôi muốn làm rõ nhanh các thuật ngữ này cùng cách thức chúng được sử dụng xuyên suốt cuốn sách.

- Encoding (Mã hóa dữ liệu) đề cập đến bất kỳ hình thức biến đổi nào đối với một đầu vào cho trước. Ví dụ, nếu chúng ta có một hàm $x$ đảo ngược chuỗi, hàm $x \to y$ áp dụng cho chuỗi `ABCD` sẽ tạo ra `DCBA`.

- Encryption (Mã hóa mật mã) là một dạng mã hóa dữ liệu đặc biệt, trong đó, để có được kết quả đầu ra, chúng ta phải cung cấp cả dữ liệu đầu vào lẫn một chiếc khóa (key). Chiếc khóa này giúp chúng ta quyết định xem ai sẽ là người có quyền đảo ngược hàm số sau đó (tức là lấy lại dữ liệu đầu vào từ kết quả đầu ra). Dạng biểu diễn đơn giản nhất của mã hóa dưới dạng một hàm số là: $(x, k) \to y$ với $x$ là đầu vào, $k$ là khóa, và $y$ là kết quả của quá trình mã hóa. Bằng cách này, một người biết khóa có thể sử dụng một hàm đã biết để lấy lại đầu vào ban đầu từ kết quả đầu ra: $(y, k) \to x$ Chúng ta gọi hàm đảo ngược này là decryption (giải mã). Nếu khóa dùng để mã hóa trùng với khóa dùng để giải mã, chúng ta thường gọi đó là khóa đối xứng (symmetric key).

- Nếu chúng ta sử dụng hai khóa khác nhau cho quá trình mã hóa $((x, k_1) \to y)$ và giải mã $((y, k_2) \to x)$, thì ta gọi đó là mã hóa bằng khóa bất đối xứng (asymmetric keys). Lúc này, cặp $(k_1, k_2)$ được gọi là một cặp khóa (key pair). Khóa dùng để mã hóa, $k_1$, được gọi là khóa công khai (public key), trong khi $k_2$ được gọi là khóa bí mật (private key). Bằng cách này, chỉ người sở hữu khóa bí mật mới có thể giải mã được dữ liệu.

- Hashing (Băm) là một dạng mã hóa dữ liệu đặc biệt, ngoại trừ việc hàm biến đổi này chỉ hoạt động theo một chiều. Nghĩa là, từ kết quả đầu ra $y$ của hàm băm, bạn không thể tìm lại được dữ liệu đầu vào $x$. Tuy nhiên, luôn phải có cách để kiểm tra xem kết quả đầu ra $y$ có tương ứng với đầu vào $x$ hay không, vì vậy chúng ta có thể hiểu băm là một cặp hàm dùng để mã hóa và so khớp. Nếu băm là $x \to y$, thì chúng ta cũng phải có một hàm so khớp có dạng $(x, y) \to \text{boolean}$.

- Đôi khi, hàm băm cũng có thể sử dụng thêm một giá trị ngẫu nhiên được cộng vào đầu vào: $(x, k) \to y$. Chúng ta gọi giá trị này là muối (salt). Muối giúp hàm băm mạnh hơn, tăng độ khó cho việc áp dụng hàm ngược để tìm lại đầu vào từ kết quả băm.

Để tổng kết lại các giao ước mà chúng ta đã thảo luận và áp dụng từ đầu cuốn sách đến nay, Bảng 4.1 sẽ mô tả ngắn gọn từng thành phần.

**Bảng 4.1 Các giao diện đại diện cho các giao ước chính trong luồng xác thực của Spring Security**

| Giao ước | Mô tả |
|---|---|
| `UserDetails` | Đại diện cho người dùng dưới góc nhìn của Spring Security. |
| `GrantedAuthority` | Định nghĩa một hành động được phép thực hiện bởi người dùng trong phạm vi ứng dụng (ví dụ: đọc, ghi, xóa, v.v.). |
| `UserDetailsService` | Đại diện cho đối tượng dùng để truy xuất thông tin chi tiết của người dùng qua tên đăng nhập. |
| `UserDetailsManager` | Một giao ước đặc thù hơn của `UserDetailsService`. Bên cạnh việc lấy thông tin người dùng bằng tên đăng nhập, nó còn có thể được dùng để thay đổi danh sách người dùng hoặc một người dùng cụ thể. |
| `PasswordEncoder` | Chỉ định cách mật khẩu được mã hóa hoặc băm, và cách kiểm tra xem một chuỗi đã mã hóa cho trước có khớp với mật khẩu dạng văn bản thô hay không. |

## 4.2 Tận dụng tối đa mô-đun Spring Security Crypto

Trong phần này, chúng ta sẽ thảo luận về mô-đun Spring Security Crypto (SSCM), đây là thành phần chịu trách nhiệm xử lý các tác vụ mật mã trong Spring Security. Việc sử dụng các hàm mã hóa, giải mã và tạo khóa vốn không được hỗ trợ sẵn trong ngôn ngữ Java tiêu chuẩn, điều này thường buộc các lập trình viên phải tích hợp thêm các thư viện bên thứ ba để tiếp cận các tính năng này dễ dàng hơn.

Để đơn giản hóa công việc của chúng ta, Spring Security cung cấp giải pháp tự xây dựng, giúp bạn giảm bớt các phụ thuộc (dependencies) trong dự án bằng cách loại bỏ nhu cầu sử dụng một thư viện riêng biệt. Các bộ mã hóa mật khẩu cũng là một phần của SSCM, mặc dù chúng ta đã tìm hiểu riêng chúng ở các phần trước. Trong phần này, chúng ta sẽ thảo luận về những tùy chọn khác mà SSCM cung cấp liên quan đến mật mã học. Bạn sẽ thấy các ví dụ về cách sử dụng hai tính năng thiết yếu từ SSCM:

- Bộ tạo khóa (Key generators) — Các đối tượng dùng để tạo khóa cho các thuật toán băm và mã hóa.

- Bộ mã hóa (Encryptors) — Các đối tượng dùng để mã hóa và giải mã dữ liệu.

### 4.2.1 Sử dụng bộ tạo khóa

Trong phần này, chúng ta sẽ thảo luận về các bộ tạo khóa. Bộ tạo khóa là một đối tượng dùng để tạo ra một loại khóa cụ thể, thường được yêu cầu bởi một thuật toán mã hóa hoặc băm. Các triển khai bộ tạo khóa mà Spring Security cung cấp là những công cụ vô cùng tiện ích. Bạn sẽ muốn sử dụng các triển khai này thay vì thêm một thư viện phụ thuộc khác vào ứng dụng của mình, đó là lý do tại sao tôi khuyên bạn nên làm quen với chúng. Hãy cùng xem một số ví dụ mã nguồn về cách tạo và áp dụng các bộ tạo khóa.

Có hai giao diện đại diện cho hai loại bộ tạo khóa chính: `BytesKeyGenerator` và `StringKeyGenerator`. Chúng ta có thể khởi tạo chúng trực tiếp bằng cách sử dụng lớp nhà máy (factory class) `KeyGenerators`. Bạn có thể sử dụng bộ tạo khóa dạng chuỗi, đại diện bởi giao ước `StringKeyGenerator`, để thu được một khóa dưới dạng chuỗi. Thông thường, chúng ta sử dụng khóa này làm giá trị muối cho một thuật toán băm hoặc mã hóa. Bạn có thể tìm thấy định nghĩa của giao ước `StringKeyGenerator` trong đoạn mã dưới đây:

```java
public interface StringKeyGenerator {
 String generateKey();
}
```

Bộ tạo khóa này chỉ có duy nhất phương thức `generateKey()` trả về một chuỗi đại diện cho giá trị của khóa. Đoạn mã tiếp theo trình bày ví dụ về cách lấy một thực thể `StringKeyGenerator` và cách sử dụng nó để lấy giá trị muối:

```java
StringKeyGenerator keyGenerator = KeyGenerators.string();
String salt = keyGenerator.generateKey();
```

Bộ tạo khóa này tạo ra một khóa có độ dài 8 byte, sau đó mã hóa nó dưới dạng chuỗi thập lục phân (hexadecimal). Phương thức này trả về kết quả của các thao tác trên dưới dạng một chuỗi. Giao diện thứ hai mô tả bộ tạo khóa là `BytesKeyGenerator`, được định nghĩa như sau:

```java
public interface BytesKeyGenerator {
 int getKeyLength();
 byte[] generateKey();
}
```

Bên cạnh phương thức `generateKey()` trả về khóa dưới dạng mảng `byte[]`, giao diện này còn định nghĩa một phương thức khác trả về độ dài của khóa tính theo số byte. Một `BytesKeyGenerator` mặc định sẽ tạo ra các khóa có độ dài 8 byte:

```java
BytesKeyGenerator keyGenerator = KeyGenerators.secureRandom();
byte [] key = keyGenerator.generateKey();
int keyLength = keyGenerator.getKeyLength();
```

Trong đoạn mã trước, bộ tạo khóa tạo ra các khóa có độ dài 8 byte. Nếu muốn chỉ định một độ dài khóa khác, bạn có thể thực hiện việc này khi khởi tạo thực thể bộ tạo khóa bằng cách truyền giá trị mong muốn vào phương thức `KeyGenerators.secureRandom()`:

```java
BytesKeyGenerator keyGenerator = KeyGenerators.secureRandom(16);
```

Các khóa được tạo ra bởi `BytesKeyGenerator` thông qua phương thức `KeyGenerators.secureRandom()` là duy nhất cho mỗi lần gọi phương thức `generateKey()`. Trong một số trường hợp, chúng ta lại muốn một triển khai trả về cùng một giá trị khóa cho mỗi lần gọi từ cùng một bộ tạo khóa. Lúc này, chúng ta có thể tạo một `BytesKeyGenerator` bằng phương thức `KeyGenerators.shared(int length)`. Trong đoạn mã dưới đây, hai biến `key1` và `key2` sẽ có giá trị hoàn toàn trùng khớp:

```java
BytesKeyGenerator keyGenerator = KeyGenerators.shared(16);
byte [] key1 = keyGenerator.generateKey();
byte [] key2 = keyGenerator.generateKey();
```

### 4.2.2 Mã hóa và giải mã dữ liệu nhạy cảm bằng bộ mã hóa

Trong phần này, chúng ta sẽ áp dụng các triển khai bộ mã hóa mà Spring Security cung cấp thông qua các ví dụ mã nguồn cụ thể. Bộ mã hóa (encryptor) là một đối tượng triển khai một thuật toán mã hóa. Khi bàn về bảo mật, mã hóa và giải mã là những thao tác hết sức phổ biến, vì vậy hãy chuẩn bị tinh thần rằng bạn sẽ cần đến chúng trong ứng dụng của mình.

Chúng ta thường xuyên cần mã hóa dữ liệu khi truyền tải giữa các thành phần của hệ thống hoặc khi lưu trữ lâu dài. Các thao tác do một bộ mã hóa cung cấp gồm có mã hóa (encryption) và giải mã (decryption). Có hai loại bộ mã hóa được định nghĩa bởi SSCM: `BytesEncryptor` và `TextEncryptor`. Mặc dù có vai trò tương tự nhau, chúng xử lý các kiểu dữ liệu khác nhau. `TextEncryptor` quản lý dữ liệu dưới dạng chuỗi ký tự. Các phương thức của nó nhận đầu vào là các chuỗi và trả về đầu ra cũng là các chuỗi, như bạn có thể thấy từ định nghĩa giao diện của nó:

```java
public interface TextEncryptor {
 String encrypt(String text);
 String decrypt(String encryptedText);
}
```

`BytesEncryptor` mang tính tổng quát hơn. Bạn cung cấp dữ liệu đầu vào cho nó dưới dạng một mảng byte:

```java
public interface BytesEncryptor {
 byte[] encrypt(byte[] byteArray);
 byte[] decrypt(byte[] encryptedByteArray);
}
```

Hãy cùng tìm hiểu xem chúng ta có những lựa chọn nào để xây dựng và sử dụng một bộ mã hóa. Lớp nhà máy `Encryptors` mang lại cho chúng ta nhiều khả năng lựa chọn. Đối với `BytesEncryptor`, chúng ta có thể sử dụng phương thức `Encryptors.standard()` hoặc `Encryptors.stronger()` như sau:

```java
String salt = KeyGenerators.string().generateKey();
String password = "secret";
String valueToEncrypt = "HELLO";
BytesEncryptor e = Encryptors.standard(password, salt);
byte [] encrypted = e.encrypt(valueToEncrypt.getBytes());
byte [] decrypted = e.decrypt(encrypted);
```

Phía sau hậu trường, bộ mã hóa byte tiêu chuẩn sử dụng thuật toán mã hóa AES 256-bit để mã hóa đầu vào. Để xây dựng một thực thể bộ mã hóa byte mạnh mẽ hơn, bạn có thể gọi phương thức `Encryptors.stronger()`:

```java
BytesEncryptor e = Encryptors.stronger(password, salt);
```

Sự khác biệt là rất nhỏ và diễn ra ngầm bên dưới hệ thống, nơi thuật toán mã hóa AES 256-bit sử dụng chế độ Galois/Counter Mode (GCM) làm chế độ hoạt động. Trong khi đó, chế độ tiêu chuẩn sử dụng thuật toán liên kết khối mã hóa (CBC), vốn được coi là một phương pháp yếu hơn.

`TextEncryptors` có ba loại chính. Bạn có thể tạo ba loại này bằng cách gọi `Encryptors.text()` hoặc `Encryptors.delux()`. Bên cạnh các phương thức này, còn có một phương thức trả về một bộ mã hóa giả `TextEncryptor` không hề thực hiện mã hóa dữ liệu. Bạn có thể sử dụng bộ mã hóa giả này cho các ví dụ minh họa hoặc các trường hợp muốn kiểm thử hiệu năng của ứng dụng mà không muốn mất thời gian cho việc mã hóa. Phương thức trả về bộ mã hóa "no-op" này là `Encryptors.noOpText()`. Trong đoạn mã dưới đây, bạn sẽ thấy một ví dụ về việc sử dụng `TextEncryptor`. Mặc dù đây là một lệnh gọi đến bộ mã hóa, nhưng trong ví dụ này, giá trị của `encrypted` và `valueToEncrypt` là hoàn toàn như nhau:

```java
String valueToEncrypt = "HELLO";
TextEncryptor e = Encryptors.noOpText();
String encrypted = e.encrypt(valueToEncrypt);
```

Bộ mã hóa `Encryptors.text()` sử dụng phương thức `Encryptors.standard()` để quản lý thao tác mã hóa, trong khi phương thức `Encryptors.delux()` sử dụng một thực thể `Encryptors.stronger()` như sau:

```java
String salt = KeyGenerators.string().generateKey();
String password = "secret";
String valueToEncrypt = "HELLO";
TextEncryptor e = Encryptors.text(password, salt);
String encrypted = e.encrypt(valueToEncrypt);
String decrypted = e.decrypt(encrypted);
```

## Tóm tắt

- `PasswordEncoder` gánh vác một trong những trách nhiệm quan trọng nhất trong logic xác thực — xử lý mật khẩu.

- Spring Security mang lại nhiều giải pháp thay thế đa dạng cho các thuật toán băm, giúp việc triển khai trở nên vô cùng đơn giản và chỉ còn là vấn đề lựa chọn cấu hình.

- Mô-đun Spring Security Crypto (SSCM) cung cấp nhiều phương án triển khai bộ tạo khóa và bộ mã hóa khác nhau.

- Bộ tạo khóa là các đối tượng tiện ích giúp bạn tạo ra các khóa được sử dụng trong các thuật toán mật mã.

- Bộ mã hóa là các đối tượng tiện ích giúp bạn thực hiện việc mã hóa và giải mã dữ liệu một cách dễ dàng.
