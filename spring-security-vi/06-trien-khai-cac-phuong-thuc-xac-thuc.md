# Chương 6: Triển khai các phương thức xác thực

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Nội dung chương này bao gồm**

- Triển khai logic xác thực bằng cách sử dụng một `AuthenticationProvider` tùy chỉnh

- Sử dụng phương thức xác thực HTTP Basic và đăng nhập bằng biểu mẫu (form-based login)

- Tìm hiểu và quản lý thành phần `SecurityContext`

Chương 3 và Chương 4 đã giới thiệu một số thành phần tham gia vào luồng xác thực. Chúng ta đã thảo luận về `UserDetails` và cách định nghĩa khuôn mẫu để mô tả người dùng trong Spring Security. Tiếp theo, chúng ta đã áp dụng `UserDetails` vào các ví dụ thực tế để minh họa cách thức hoạt động cũng như cách triển khai hai hợp đồng `UserDetailsService` và `UserDetailsManager`. Chúng ta cũng đã thảo luận và sử dụng các triển khai phổ biến của các giao diện này trong các ví dụ thực hành. Cuối cùng, bạn đã tìm hiểu cách `PasswordEncoder` quản lý mật mã, cách áp dụng nó vào dự án, cũng như cách sử dụng mô-đun mã hóa của Spring Security (SSCM) với các bộ mã hóa và bộ tạo khóa đi kèm.

Tuy nhiên, tầng `AuthenticationProvider` mới là nơi chịu trách nhiệm xử lý logic xác thực. Đây là nơi chứa các điều kiện và chỉ dẫn để quyết định xem một yêu cầu có được xác thực thành công hay không. Thành phần ủy thác trách nhiệm này cho `AuthenticationProvider` chính là `AuthenticationManager` – nơi tiếp nhận yêu cầu từ tầng bộ lọc HTTP (đã được thảo luận trong Chương 5). Trong chương này, chúng ta sẽ đi sâu vào quá trình xác thực, một quá trình chỉ có hai kết quả khả thi:

- Thực thể gửi yêu cầu không được xác thực: Người dùng không được hệ thống nhận diện, và ứng dụng sẽ từ chối yêu cầu ngay lập tức mà không chuyển tiếp đến quá trình phân quyền. Thông thường, trạng thái phản hồi gửi về cho phía máy khách (client) trong trường hợp này là HTTP 401 Unauthorized.

- Thực thể gửi yêu cầu được xác thực thành công: Thông tin chi tiết về người gửi yêu cầu sẽ được lưu trữ lại để ứng dụng sử dụng cho quá trình phân quyền tiếp theo. Như bạn sẽ tìm hiểu trong chương này, `SecurityContext` là thành phần chịu trách nhiệm lưu trữ các thông tin chi tiết liên quan đến yêu cầu đã được xác thực hiện tại.

Để giúp bạn hình dung lại các thành phần tham gia và mối liên kết giữa chúng, hình 6.1 hiển thị sơ đồ mà chúng ta đã từng làm quen ở Chương 2.

Luồng xác thực trong Spring Security phác thảo phương thức mà ứng dụng sử dụng để nhận diện cá nhân đang gửi yêu cầu. Các thành phần trọng tâm của chương này sẽ được làm nổi bật. Trong bối cảnh này, `AuthenticationProvider` chịu trách nhiệm thực thi quy trình xác thực, và `SecurityContext` có nhiệm vụ lưu giữ thông tin của yêu cầu đã được xác thực đó.

Chương này sẽ bao quát các phần còn lại của luồng xác thực. Sau đó, trong Chương 7 và Chương 8, bạn sẽ tìm hiểu cách thức hoạt động của quá trình phân quyền — bước tiếp theo ngay sau khi xác thực thành công một yêu cầu HTTP. Trước tiên, chúng ta cần thảo luận về cách triển khai giao diện `AuthenticationProvider`. Bạn cần hiểu cách Spring Security diễn giải một yêu cầu trong suốt quá trình xác thực.

Để đưa ra mô tả rõ ràng về cách biểu diễn một yêu cầu xác thực, chúng ta sẽ bắt đầu với giao diện `Authentication`. Sau khi thảo luận về giao diện này, chúng ta sẽ đi sâu hơn để quan sát những gì xảy ra với thông tin chi tiết của một yêu cầu sau khi xác thực thành công. Tiếp đó, chúng ta sẽ thảo luận về giao diện `SecurityContext` và cách Spring Security quản lý nó. Ở phần cuối của chương, bạn sẽ học cách tùy biến phương thức xác thực HTTP Basic. Chúng ta cũng sẽ thảo luận về một lựa chọn xác thực khác có thể áp dụng cho các ứng dụng của mình — đăng nhập bằng biểu mẫu.

## 6.1 Tìm hiểu về AuthenticationProvider

Trong các ứng dụng doanh nghiệp, bạn có thể gặp phải tình huống mà cơ chế xác thực mặc định dựa trên tên đăng nhập và mật khẩu không còn phù hợp. Ngoài ra, ứng dụng của bạn có thể đòi hỏi phải triển khai nhiều kịch bản xác thực khác nhau. Ví dụ, bạn có thể muốn người dùng chứng minh danh tính bằng mã xác thực gửi qua tin nhắn SMS hoặc hiển thị trên một ứng dụng chuyên biệt. Hoặc bạn cần triển khai các kịch bản xác thực yêu cầu người dùng cung cấp một loại khóa bảo mật lưu trữ trong tệp tin. Thậm chí, bạn có thể cần sử dụng dữ liệu vân tay của người dùng để thực hiện logic xác thực. Mục tiêu của một framework là phải đủ linh hoạt để cho phép bạn triển khai bất kỳ kịch bản nào trong số này.

Một ứng dụng có thể đòi hỏi nhiều phương thức triển khai xác thực khác nhau. Mặc dù tên đăng nhập và mật khẩu là đủ cho hầu hết các tình huống, vẫn có những trường hợp quy trình xác thực người dùng đòi hỏi sự phức tạp hơn.

Một framework thường cung cấp sẵn một tập hợp các triển khai phổ biến nhất, nhưng tất nhiên, nó không thể bao quát mọi phương án có thể xảy ra. Trong Spring Security, bạn có thể sử dụng hợp đồng `AuthenticationProvider` để định nghĩa bất kỳ logic xác thực tùy chỉnh nào. Trong phần này, bạn sẽ học cách biểu diễn sự kiện xác thực bằng cách triển khai giao diện `Authentication`, sau đó tạo logic xác thực tùy chỉnh của riêng mình với `AuthenticationProvider`. Để đạt được mục tiêu này:

- Trong mục 6.1.1, chúng ta sẽ phân tích cách Spring Security biểu diễn sự kiện xác thực.

- Trong mục 6.1.2, chúng ta thảo luận về hợp đồng `AuthenticationProvider`, thành phần chịu trách nhiệm xử lý logic xác thực.

- Trong mục 6.1.3, bạn sẽ viết một logic xác thực tùy chỉnh bằng cách triển khai hợp đồng `AuthenticationProvider` thông qua một ví dụ thực tế.

### 6.1.1 Biểu diễn yêu cầu trong quá trình xác thực

Phần này thảo luận về cách Spring Security diễn giải một yêu cầu trong quá trình xác thực. Đây là bước đệm quan trọng trước khi đi sâu vào việc triển khai logic xác thực tùy chỉnh. Như bạn sẽ tìm hiểu trong mục 6.1.2, để triển khai một `AuthenticationProvider` tùy chỉnh, trước tiên bạn cần hiểu cách mô tả sự kiện xác thực. Tại đây, chúng ta sẽ xem xét hợp đồng biểu diễn việc xác thực và thảo luận về các phương thức cần lưu ý. `Authentication` là một trong những giao diện thiết yếu tham gia vào quá trình xác thực cùng tên. Giao diện `Authentication` biểu diễn sự kiện của yêu cầu xác thực và lưu giữ thông tin chi tiết của thực thể đang yêu cầu quyền truy cập vào ứng dụng. Bạn có thể sử dụng thông tin liên quan đến sự kiện yêu cầu xác thực này trong và sau khi quá trình xác thực diễn ra. Người dùng yêu cầu truy cập vào ứng dụng được gọi là chủ thể (principal) 7. Nếu đã từng sử dụng Java Security trong bất kỳ ứng dụng nào, bạn có thể đã biết giao diện mang tên `Principal` cũng biểu diễn khái niệm tương tự. Giao diện `Authentication` của Spring Security kế thừa chính hợp đồng này.

Hợp đồng `Authentication` trong Spring Security không chỉ biểu diễn một chủ thể, mà nó còn bổ sung thông tin về việc quá trình xác thực đã hoàn tất hay chưa, cùng với một danh sách các quyền hạn (authorities). Việc thiết kế hợp đồng này kế thừa từ hợp đồng `Principal` của Java Security là một điểm cộng lớn về mặt tương thích với các triển khai của các framework và ứng dụng khác. Sự linh hoạt này giúp việc chuyển đổi sang Spring Security từ các ứng dụng triển khai xác thực theo cách khác trở nên dễ dàng hơn. Hãy cùng tìm hiểu kỹ hơn về thiết kế của giao diện `Authentication` trong đoạn mã dưới đây.

**Mã nguồn 6.1 Khai báo giao diện Authentication trong Spring Security**

```java
public interface Authentication extends Principal, Serializable {

    Collection<? extends GrantedAuthority> getAuthorities();
    Object getCredentials();
    Object getDetails();
    Object getPrincipal();
    boolean isAuthenticated();
    void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException;
}
```

Tại thời điểm này, những phương thức duy nhất trong hợp đồng này mà bạn cần ghi nhớ là:

- `isAuthenticated()` — Trả về `true` nếu quá trình xác thực đã hoàn tất hoặc `false` nếu quá trình xác thực vẫn đang diễn ra.

- `getCredentials()` — Trả về mật khẩu hoặc bất kỳ thông tin bí mật nào được sử dụng trong quá trình xác thực.

- `getAuthorities()` — Trả về một tập hợp các quyền hạn được cấp cho yêu cầu đã xác thực.

Chúng ta sẽ thảo luận về các phương thức khác của hợp đồng `Authentication` trong các chương sau, khi đi vào các triển khai cụ thể phù hợp hơn.

### 6.1.2 Triển khai logic xác thực tùy chỉnh

Phần này giải quyết việc triển khai logic xác thực tùy chỉnh. Chúng ta sẽ phân tích hợp đồng của Spring Security liên quan đến trách nhiệm này để hiểu rõ định nghĩa của nó. Với những chi tiết này, bạn có thể tự tay triển khai logic xác thực tùy chỉnh thông qua một ví dụ mã nguồn ở mục 6.1.3.

`AuthenticationProvider` trong Spring Security đảm nhận việc xử lý logic xác thực. Triển khai mặc định của giao diện `AuthenticationProvider` ủy thác trách nhiệm tìm kiếm người dùng của hệ thống cho một `UserDetailsService`. Nó cũng sử dụng `PasswordEncoder` để quản lý mật khẩu trong quá trình xác thực. Đoạn mã dưới đây cung cấp định nghĩa của `AuthenticationProvider`, giao diện mà bạn cần hiện thực hóa để định nghĩa một bộ cung cấp xác thực tùy chỉnh cho ứng dụng của mình.

**Mã nguồn 6.2 Giao diện AuthenticationProvider**

```java
public interface AuthenticationProvider {

    Authentication authenticate(Authentication authentication)
        throws AuthenticationException;

    boolean supports(Class<?> authentication);
}
```

Trách nhiệm của `AuthenticationProvider` gắn kết chặt chẽ với hợp đồng `Authentication`. Phương thức `authenticate()` nhận vào một đối tượng `Authentication` làm tham số và trả về một đối tượng `Authentication`. Chúng ta triển khai phương thức `authenticate()` để định nghĩa logic xác thực. Dưới đây là tóm tắt nhanh về cách bạn nên triển khai phương thức `authenticate()`:

- Phương thức này sẽ ném ra một ngoại lệ `AuthenticationException` nếu quá trình xác thực thất bại. Nếu phương thức nhận được một đối tượng xác thực không được hỗ trợ bởi triển khai `AuthenticationProvider` của bạn, nó sẽ trả về `null`. Nhờ đó, chúng ta có khả năng sử dụng nhiều loại `Authentication` khác nhau, được phân tách rõ ràng ở tầng bộ lọc HTTP.

- Phương thức này sẽ trả về một thực thể `Authentication` biểu diễn cho một đối tượng đã được xác thực hoàn toàn. Đối với thực thể này, phương thức `isAuthenticated()` trả về `true`, và nó chứa đầy đủ các thông tin chi tiết cần thiết về thực thể đã được xác thực đó. Thông thường, ứng dụng cũng sẽ loại bỏ các dữ liệu nhạy cảm, chẳng hạn như mật khẩu, khỏi thực thể này. Sau khi xác thực thành công, mật khẩu không còn cần thiết nữa, và việc lưu giữ các thông tin này có thể vô tình để lộ chúng trước những cặp mắt không mong muốn.

Phương thức thứ hai trong giao diện `AuthenticationProvider` là `supports(Class<?> authentication)`. Bạn có thể triển khai phương thức này để trả về `true` nếu `AuthenticationProvider` hiện tại hỗ trợ kiểu đối tượng được truyền vào dưới dạng `Authentication`. Lưu ý rằng ngay cả khi phương thức này trả về `true` cho một đối tượng, vẫn có khả năng phương thức `authenticate()` sẽ từ chối yêu cầu bằng cách trả về `null`. Spring Security được thiết kế linh hoạt hơn, cho phép người dùng triển khai một `AuthenticationProvider` có thể từ chối một yêu cầu xác thực dựa trên thông tin chi tiết của nó, chứ không chỉ dựa vào kiểu của yêu cầu đó.

Để dễ hình dung cách thức hoạt động song hành của bộ quản lý xác thực (authentication manager) và bộ cung cấp xác thực (authentication provider) nhằm chấp nhận hoặc từ chối một yêu cầu xác thực, hãy tưởng tượng bạn có một ổ khóa cửa thông minh phức tạp. Bạn có thể mở ổ khóa này bằng thẻ từ hoặc bằng chìa khóa vật lý truyền thống. Bản thân ổ khóa chính là bộ quản lý xác thực – nơi quyết định xem có mở cửa hay không. Để đưa ra quyết định đó, nó ủy thác cho hai bộ cung cấp xác thực: một bộ biết cách xác thực thẻ từ và bộ còn lại biết cách kiểm tra chìa khóa vật lý. Nếu bạn đưa thẻ từ để mở cửa, bộ cung cấp xác thực vốn chỉ hoạt động với chìa khóa vật lý sẽ báo cáo rằng nó không nhận diện được kiểu xác thực này. Tuy nhiên, bộ cung cấp còn lại hỗ trợ kiểu xác thực đó và sẽ tiến hành kiểm tra xem thẻ từ có hợp lệ để mở cửa hay không. Đây chính là mục đích của các phương thức `supports()`.

Bên cạnh việc kiểm tra kiểu xác thực, Spring Security còn bổ sung thêm một tầng linh hoạt khác. Ổ khóa cửa có thể nhận diện được nhiều loại thẻ từ khác nhau. Trong trường hợp này, khi bạn đưa thẻ từ vào, một trong các bộ cung cấp xác thực có thể nói: "Tôi hiểu đây là một chiếc thẻ từ. Nhưng đây không phải là loại thẻ mà tôi có quyền xác thực!" Điều này xảy ra khi phương thức `supports()` trả về `true` nhưng phương thức `authenticate()` lại trả về `null`.

`AuthenticationManager` ủy quyền cho một trong các bộ cung cấp xác thực sẵn có.

`AuthenticationProvider` có thể không hỗ trợ kiểu xác thực được cung cấp. Tuy nhiên, ngay cả khi hỗ trợ kiểu đối tượng đó, nó vẫn có thể không biết cách xác thực đối tượng cụ thể ấy. Quá trình xác thực được đánh giá, và một `AuthenticationProvider` có khả năng xác định yêu cầu đó có chính xác hay không sẽ phản hồi lại cho `AuthenticationManager`.

Hình 6.5 mô tả kịch bản thay thế, nơi một trong các đối tượng `AuthenticationProvider` nhận diện được `Authentication` nhưng quyết định rằng nó không hợp lệ. Trong trường hợp này, kết quả sẽ là một ngoại lệ `AuthenticationException`, cuối cùng được chuyển đổi thành trạng thái HTTP 401 Unauthorized trong phản hồi HTTP của ứng dụng web.

Nếu không có đối tượng `AuthenticationProvider` nào nhận diện được `Authentication`, hoặc tất cả chúng đều từ chối, kết quả trả về sẽ là một `AuthenticationException`.

### 6.1.3 Áp dụng logic xác thực tùy chỉnh

Trong phần này, chúng ta sẽ tiến hành triển khai logic xác thực tùy chỉnh. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch6-ex1`. Với ví dụ này, bạn sẽ áp dụng những kiến thức đã học về giao diện `Authentication` và `AuthenticationProvider` trong mục 6.1.1 và 6.1.2. Trong các đoạn mã 6.3 và 6.4, chúng ta sẽ xây dựng một ví dụ về cách triển khai một `AuthenticationProvider` tùy chỉnh. Các bước thực hiện như sau:

1. Khai báo một lớp triển khai hợp đồng `AuthenticationProvider`.

2. Xác định các loại đối tượng `Authentication` được hỗ trợ bởi `AuthenticationProvider` mới.

3. Triển khai phương thức `supports(Class<?> c)` để chỉ định kiểu xác thực nào được hỗ trợ bởi `AuthenticationProvider` mà chúng ta định nghĩa.

4. Triển khai phương thức `authenticate(Authentication a)` để thực hiện logic xác thực.

5. Đăng ký một thực thể của lớp triển khai `AuthenticationProvider` mới với Spring Security.

**Mã nguồn 6.3 Ghi đè phương thức supports() của AuthenticationProvider**

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    // Mã nguồn được lược bỏ

    @Override
    public boolean supports(Class<?> authenticationType) {
        return authenticationType.equals(UsernamePasswordAuthenticationToken.class);
    }
}
```

Trong đoạn mã 6.3, chúng ta định nghĩa một lớp mới triển khai giao diện `AuthenticationProvider`. Chúng ta đánh dấu lớp này với `@Component` để có một thực thể thuộc kiểu của nó trong ngữ cảnh (context) được quản lý bởi Spring. Tiếp theo, chúng ta phải quyết định xem triển khai `AuthenticationProvider` này hỗ trợ loại giao diện `Authentication` nào. Điều đó phụ thuộc vào kiểu đối tượng mà chúng ta mong đợi được truyền làm tham số cho phương thức `authenticate()`. Nếu không tùy biến bất kỳ điều gì ở tầng bộ lọc xác thực (như đã thảo luận trong Chương 5), thì lớp `UsernamePasswordAuthenticationToken` sẽ định nghĩa kiểu đó. Lớp này là một triển khai của giao diện `Authentication` và đại diện cho một yêu cầu xác thực tiêu chuẩn bằng tên đăng nhập và mật khẩu.

Với định nghĩa này, chúng ta đã làm cho `AuthenticationProvider` hỗ trợ một loại khóa cụ thể. Sau khi đã xác định phạm vi hoạt động của `AuthenticationProvider`, chúng ta sẽ triển khai logic xác thực bằng cách ghi đè phương thức `authenticate()`, như được trình bày trong đoạn mã dưới đây.

**Mã nguồn 6.4 Triển khai logic xác thực**

```java
@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    // Khởi tạo (constructor) được lược bỏ

    @Override
    public Authentication authenticate(Authentication authentication) {
        String username = authentication.getName();
        String password = authentication.getCredentials().toString();

        UserDetails u = userDetailsService.loadUserByUsername(username);

        if (passwordEncoder.matches(password, u.getPassword())) {
            return new UsernamePasswordAuthenticationToken(
                username,
                password,
                u.getAuthorities()
            );
        } else {
            throw new BadCredentialsException("Something went wrong!");
        }
    }

    // Mã nguồn được lược bỏ
}
```

Logic trong đoạn mã 6.4 rất đơn giản. Chúng ta sử dụng triển khai `UserDetailsService` để lấy về đối tượng `UserDetails`. Nếu người dùng không tồn tại, phương thức `loadUserByUsername()` sẽ ném ra một ngoại lệ `AuthenticationException`. Trong trường hợp này, quá trình xác thực dừng lại, và bộ lọc HTTP sẽ thiết lập trạng thái phản hồi là HTTP 401 Unauthorized. Nếu tên đăng nhập tồn tại, chúng ta tiếp tục kiểm tra mật khẩu của người dùng bằng phương thức `matches()` của `PasswordEncoder` lấy từ ngữ cảnh. Nếu mật khẩu không khớp, một ngoại lệ `AuthenticationException` lại được ném ra. Nếu mật khẩu chính xác, `AuthenticationProvider` sẽ trả về một thực thể `Authentication` được đánh dấu là "đã xác thực" (authenticated), chứa đầy đủ thông tin chi tiết của yêu cầu.

`AuthenticationProvider` thực thi một quy trình xác thực được thiết kế riêng. Nó xác nhận yêu cầu xác thực bằng cách truy xuất thông tin chi tiết của người dùng thông qua một triển khai `UserDetailsService` cụ thể, và xác thực mật khẩu bằng cách sử dụng `PasswordEncoder` nếu mật khẩu chính xác. Nếu không tìm thấy người dùng hoặc mật khẩu không chính xác, `AuthenticationProvider` sẽ đưa ra ngoại lệ `AuthenticationException`.

Để tích hợp triển khai mới của `AuthenticationProvider` vào hệ thống, chúng ta định nghĩa một bean kiểu `SecurityFilterChain`. Điều này được minh họa trong đoạn mã dưới đây.

**Mã nguồn 6.5 Đăng ký AuthenticationProvider trong lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    private final AuthenticationProvider authenticationProvider;

    // Khởi tạo (constructor) được lược bỏ

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {

        http.httpBasic(Customizer.withDefaults());
        http.authenticationProvider(authenticationProvider);
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());

        return http.build();
    }

    // Mã nguồn được lược bỏ
}
```

> **LƯU Ý** Trong đoạn mã 6.5, cơ chế tiêm phụ thuộc (dependency injection) được áp dụng với một trường được khai báo bằng giao diện `AuthenticationProvider`. Spring nhận diện `AuthenticationProvider` là một giao diện (một lớp trừu tượng). Tuy nhiên, Spring biết rằng nó cần phải tìm kiếm một thực thể của một lớp triển khai trong ngữ cảnh của nó cho giao diện cụ thể đó. Trong trường hợp của chúng ta, triển khai đó là thực thể của lớp `CustomAuthenticationProvider` — thực thể duy nhất thuộc kiểu này mà chúng ta đã khai báo và đưa vào ngữ cảnh Spring bằng cách sử dụng chú thích `@Component`. Để ôn lại kiến thức về tiêm phụ thuộc, tôi đề xuất cuốn sách Spring Start Here (Manning, 2021), một tác phẩm khác do tôi biên soạn.

Chỉ đơn giản như vậy! Bạn đã tùy biến thành công triển khai của `AuthenticationProvider`. Giờ đây, bạn có thể tự do thiết kế logic xác thực cho ứng dụng của mình tại bất kỳ nơi nào cần thiết.

> **Làm thế nào để thất bại khi thiết kế ứng dụng**
>
> Việc áp dụng sai cách một framework sẽ dẫn đến một ứng dụng khó bảo trì hơn. Tệ hơn nữa, đôi khi những người thất bại trong việc sử dụng framework lại tin rằng lỗi nằm ở chính bản thân framework đó. Hãy để tôi kể cho bạn nghe một câu chuyện.
>
> Vào một mùa đông, trưởng bộ phận phát triển của một công ty mà tôi đang hợp tác với tư cách là cố vấn đã gọi điện nhờ tôi hỗ trợ triển khai một tính năng mới. Họ cần áp dụng một phương thức xác thực tùy chỉnh vào một thành phần trong hệ thống được phát triển bằng Spring từ những phiên bản đầu tiên. Thật không may, khi thiết kế các lớp cho ứng dụng, các lập trình viên đã không dựa vào kiến trúc xương sống của Spring Security một cách đúng đắn.
>
> Họ chỉ sử dụng chuỗi bộ lọc (filter chain), rồi tự viết lại hoàn toàn các tính năng của Spring Security dưới dạng mã nguồn tùy chỉnh.
>
> Các nhà phát triển nhận thấy rằng theo thời gian, việc tùy biến ngày càng trở nên khó khăn. Tuy nhiên, không một ai hành động để thiết kế lại thành phần đó một cách đúng đắn và sử dụng các hợp đồng như mong đợi của Spring Security. Phần lớn khó khăn xuất phát từ việc không nắm rõ các khả năng của Spring. Một trong những lập trình viên chủ chốt đã phát biểu: "Tất cả là tại cái Spring Security này! Framework này vừa khó áp dụng, vừa khó tùy biến." Tôi đã có chút ngỡ ngàng trước nhận định của anh ta. Tôi biết Spring Security đôi khi rất khó hiểu và framework này nổi tiếng là có lộ trình học tập không hề dễ dàng. Nhưng tôi chưa bao giờ gặp phải tình huống nào mà mình không thể tìm ra cách thiết kế một lớp dễ tùy biến với Spring Security!
>
> Chúng tôi đã cùng nhau tìm hiểu vấn đề, và tôi nhận ra các lập trình viên của ứng dụng này có lẽ mới chỉ sử dụng khoảng 10% những gì Spring Security có thể cung cấp. Sau đó, tôi đã tổ chức một buổi hội thảo kéo dài hai ngày về Spring Security, tập trung vào những gì chúng tôi có thể làm cho thành phần hệ thống cụ thể mà họ cần thay đổi và cách thực hiện nó.
>
> Mọi chuyện khép lại với quyết định viết lại hoàn toàn phần lớn mã nguồn tùy chỉnh để dựa vào Spring Security một cách chính xác, từ đó giúp ứng dụng dễ dàng mở rộng hơn nhằm đáp ứng các yêu cầu triển khai bảo mật của họ. Chúng tôi cũng phát hiện ra một vài vấn đề khác không liên quan đến Spring Security, nhưng đó lại là một câu chuyện khác.
>
> Dưới đây là một vài bài học mà bạn có thể rút ra từ câu chuyện này:
>
> - Một framework, đặc biệt là loại được sử dụng rộng rãi trong các ứng dụng, được viết bởi rất nhiều cá nhân xuất chúng, và thật khó tin rằng nó lại được thiết kế tồi. Hãy luôn phân tích kỹ ứng dụng của bạn trước khi đưa ra kết luận rằng mọi vấn đề đều do lỗi của framework.
>
> - Khi quyết định sử dụng một framework, hãy chắc chắn rằng bạn đã hiểu rõ, ít nhất là những khái niệm cơ bản của nó.
>
> - Hãy thận trọng với các nguồn tài liệu mà bạn sử dụng để học về framework. Đôi khi, các bài viết trên mạng chỉ chỉ ra cách khắc phục nhanh chóng (workaround) chứ không nhất thiết hướng dẫn cách thiết kế lớp một cách chuẩn xác.
>
> - Hãy sử dụng nhiều nguồn tài liệu khác nhau trong quá trình nghiên cứu của bạn. Để làm sáng tỏ những điểm chưa hiểu, hãy viết một bản thử nghiệm kiểm chứng khái niệm (proof of concept) khi chưa chắc chắn về cách sử dụng một tính năng nào đó.
>
> - Nếu đã quyết định dùng một framework, hãy tận dụng nó tối đa cho mục đích thiết kế ban đầu của nó. Ví dụ, nếu bạn dùng Spring Security mà lại thấy mình có xu hướng tự viết thêm nhiều mã nguồn tùy chỉnh thay vì dựa vào những gì framework cung cấp, bạn nên tự hỏi tại sao lại xảy ra điều đó.

Khi dựa vào các chức năng đã được triển khai sẵn bởi một framework, chúng ta sẽ được hưởng nhiều lợi ích. Chúng ta biết rằng chúng đã được kiểm thử kỹ lưỡng, và có ít thay đổi phát sinh lỗ hổng bảo mật hơn. Tương tự như vậy, một framework tốt luôn dựa trên các lớp trừu tượng (abstractions), giúp bạn tạo ra các ứng dụng dễ bảo trì. Hãy nhớ rằng khi tự viết các triển khai của riêng mình, bạn sẽ dễ vô tình để lại các lỗ hổng bảo mật hơn.

## 6.2 Sử dụng SecurityContext

Phần này thảo luận về ngữ cảnh bảo mật (security context). Chúng ta sẽ phân tích cách thức hoạt động, cách truy cập dữ liệu và cách ứng dụng quản lý nó trong các kịch bản liên quan đến các luồng (thread) khác nhau. Sau khi hoàn thành phần này, bạn sẽ biết cách cấu hình ngữ cảnh bảo mật cho nhiều tình huống khác nhau. Bằng cách này, bạn có thể sử dụng thông tin chi tiết về người dùng đã xác thực được lưu trữ bởi ngữ cảnh bảo mật để cấu hình phân quyền trong Chương 7 và Chương 8.

Rất có thể bạn sẽ cần đến thông tin chi tiết về thực thể đã được xác thực sau khi quá trình xác thực hoàn tất. Ví dụ, bạn có thể cần tham chiếu đến tên đăng nhập hoặc các quyền hạn của người dùng hiện đang đăng nhập. Liệu thông tin này có còn truy cập được sau khi quá trình xác thực kết thúc không? Một khi `AuthenticationManager` hoàn thành xuất sắc quá trình xác thực, nó sẽ lưu trữ thực thể `Authentication` cho phần còn lại của yêu cầu. Thực thể lưu trữ đối tượng `Authentication` này được gọi là ngữ cảnh bảo mật (security context).

Sau khi xác thực thành công, bộ lọc xác thực sẽ lưu trữ thông tin chi tiết của thực thể đã xác thực vào ngữ cảnh bảo mật. Từ đó, bộ điều khiển (controller) thực hiện hành động được ánh xạ với yêu cầu có thể truy cập các thông tin chi tiết này khi cần thiết.

Ngữ cảnh bảo mật của Spring Security được mô tả bởi giao diện `SecurityContext` và được định nghĩa trong đoạn mã dưới đây.

**Mã nguồn 6.6 Giao diện SecurityContext**

```java
public interface SecurityContext extends Serializable {

    Authentication getAuthentication();
    void setAuthentication(Authentication authentication);
}
```

Như bạn có thể thấy từ định nghĩa hợp đồng, trách nhiệm chính của `SecurityContext` là lưu trữ đối tượng `Authentication`. Nhưng bản thân `SecurityContext` được quản lý như thế nào? Spring Security cung cấp ba chiến lược để quản lý `SecurityContext` thông qua một đối tượng đóng vai trò quản lý, mang tên `SecurityContextHolder`:

- `MODE_THREADLOCAL` — Cho phép mỗi luồng (thread) lưu trữ thông tin chi tiết của riêng mình trong ngữ cảnh bảo mật. Trong một ứng dụng web áp dụng mô hình "mỗi luồng xử lý một yêu cầu" (thread-per-request), đây là hướng tiếp cận phổ biến, vì mỗi yêu cầu có một luồng riêng biệt.

- `MODE_INHERITABLETHREADLOCAL` — Tương tự như `MODE_THREADLOCAL`, nhưng nó cũng chỉ dẫn Spring Security sao chép ngữ cảnh bảo mật sang luồng tiếp theo trong trường hợp gọi một phương thức bất đồng bộ (asynchronous). Bằng cách này, chúng ta có thể nói rằng luồng mới chạy phương thức `@Async` sẽ thừa hưởng ngữ cảnh bảo mật từ luồng cha. Chú thích `@Async` được sử dụng với các phương thức để chỉ thị Spring gọi phương thức được chú thích trên một luồng riêng biệt.

- `MODE_GLOBAL` — Làm cho tất cả các luồng của ứng dụng cùng nhìn thấy một thực thể ngữ cảnh bảo mật duy nhất.

Bên cạnh ba chiến lược quản lý ngữ cảnh bảo mật do Spring Security cung cấp, phần này cũng minh họa những gì xảy ra khi bạn tự định nghĩa các luồng của riêng mình mà Spring không hề hay biết. Như bạn sẽ tìm hiểu, đối với những trường hợp này, bạn cần phải sao chép một cách rõ ràng các thông tin chi tiết từ ngữ cảnh bảo mật sang luồng mới. Spring Security không thể tự động quản lý các đối tượng nằm ngoài ngữ cảnh của Spring, nhưng nó cung cấp một số lớp tiện ích rất tuyệt vời để hỗ trợ việc này.

### 6.2.1 Sử dụng chiến lược lưu giữ mặc định cho ngữ cảnh bảo mật

Chiến lược đầu tiên để quản lý ngữ cảnh bảo mật là `MODE_THREADLOCAL`, và đây cũng là chiến lược mặc định được Spring Security sử dụng. Với chiến lược này, Spring Security sử dụng `ThreadLocal` để quản lý ngữ cảnh. `ThreadLocal` là một triển khai do JDK cung cấp. Triển khai này hoạt động như một tập hợp dữ liệu nhưng đảm bảo rằng mỗi luồng của ứng dụng chỉ có thể nhìn thấy dữ liệu được lưu trữ trong phần dành riêng cho nó trong tập hợp đó. Bằng cách này, mỗi yêu cầu đều có quyền truy cập vào ngữ cảnh bảo mật của riêng mình. Không một luồng nào có quyền truy cập vào `ThreadLocal` của luồng khác. Điều đó có nghĩa là trong một ứng dụng web, mỗi yêu cầu chỉ có thể nhìn thấy ngữ cảnh bảo mật của chính nó. Chúng ta có thể nói rằng đây cũng là những gì bạn thường mong muốn đối với một ứng dụng web phía máy chủ (backend). Hình 6.8 cung cấp một cái nhìn tổng quan về chức năng này. Mỗi yêu cầu (A, B và C) đều có luồng được cấp phát riêng (T1, T2 và T3), do đó mỗi yêu cầu chỉ nhìn thấy thông tin chi tiết được lưu trữ trong ngữ cảnh bảo mật của chính nó. Tuy nhiên, điều này cũng có nghĩa là nếu một luồng mới được tạo ra (ví dụ: khi một phương thức bất đồng bộ được gọi), luồng mới đó cũng sẽ có ngữ cảnh bảo mật riêng của nó. Các thông tin chi tiết từ luồng cha (luồng ban đầu của yêu cầu) không được tự động sao chép sang ngữ cảnh bảo mật của luồng mới.

> **LƯU Ý** Ở đây chúng ta đang thảo luận về một ứng dụng servlet truyền thống, nơi mỗi yêu cầu được gắn chặt với một luồng. Kiến trúc này chỉ áp dụng cho ứng dụng servlet truyền thống, nơi mỗi yêu cầu được chỉ định một luồng riêng. Nó không áp dụng cho các ứng dụng phản ứng (reactive). Chúng ta sẽ thảo luận chi tiết về bảo mật cho các phương pháp phản ứng trong Chương 17.

Là chiến lược mặc định để quản lý ngữ cảnh bảo mật, quy trình này không cần phải cấu hình một cách rõ ràng. Bạn chỉ cần yêu cầu ngữ cảnh bảo mật từ bộ lưu giữ bằng cách sử dụng phương thức tĩnh `getContext()` tại bất kỳ nơi nào cần thiết sau khi quá trình xác thực kết thúc. Trong đoạn mã 6.7, bạn sẽ tìm thấy một ví dụ về việc lấy ngữ cảnh bảo mật tại một trong các điểm cuối (endpoints) của ứng dụng. Từ ngữ cảnh bảo mật, bạn có thể tiếp tục lấy ra đối tượng `Authentication`, nơi lưu trữ thông tin chi tiết về thực thể đã được xác thực. Bạn có thể tìm thấy các ví dụ được thảo luận trong phần này thuộc dự án `ssia-ch6-ex2`.

**Mã nguồn 6.7 Lấy SecurityContext từ SecurityContextHolder**

```java
@GetMapping("/hello")
public String hello() {
    SecurityContext context = SecurityContextHolder.getContext();
    Authentication a = context.getAuthentication();
    return "Hello, " + a.getName() + "!";
}
```

Việc lấy thông tin xác thực từ ngữ cảnh thậm chí còn thuận tiện hơn ở cấp độ điểm cuối, vì Spring biết cách tiêm trực tiếp đối tượng này vào các tham số của phương thức. Bạn không cần phải tham chiếu rõ ràng đến lớp `SecurityContextHolder` mỗi lần sử dụng. Hướng tiếp cận này, như được trình bày trong đoạn mã dưới đây, là tối ưu hơn.

**Mã nguồn 6.8 Spring tiêm giá trị Authentication vào tham số của phương thức**

```java
@GetMapping("/hello")
public String hello(Authentication a) {
    return "Hello, " + a.getName() + "!";
}
```

Khi gọi điểm cuối với một người dùng hợp lệ, thân phản hồi (response body) sẽ chứa tên đăng nhập. Ví dụ:

```bash
curl -u user:99ff79e3-8ca0-401c-a396-0a8625ab3bad http://localhost:8080/hello

Hello, user!
```

### 6.2.2 Sử dụng chiến lược lưu giữ cho các cuộc gọi bất đồng bộ

Thật dễ dàng để tiếp tục sử dụng chiến lược mặc định để quản lý ngữ cảnh bảo mật. Trong rất nhiều trường hợp, đó là tất cả những gì bạn cần. `MODE_THREADLOCAL` mang lại khả năng cô lập ngữ cảnh bảo mật cho từng luồng, giúp ngữ cảnh bảo mật trở nên tự nhiên hơn để thấu hiểu và quản lý. Tuy nhiên, cũng có những trường hợp điều này không còn đúng nữa.

Tình hình trở nên phức tạp hơn nếu chúng ta phải xử lý nhiều luồng cho mỗi yêu cầu. Hãy xem điều gì xảy ra nếu bạn biến điểm cuối thành bất đồng bộ. Luồng thực thi phương thức không còn là luồng phục vụ yêu cầu ban đầu nữa. Hãy nghĩ về một điểm cuối như điểm cuối được trình bày trong đoạn mã tiếp theo.

**Mã nguồn 6.9 Một phương thức @Async được phục vụ bởi một luồng khác**

```java
@GetMapping("/bye")
@Async
public void goodbye() {
    SecurityContext context = SecurityContextHolder.getContext();
    String username = context.getAuthentication().getName();
    // xử lý công việc với tên đăng nhập
}
```

Để kích hoạt chức năng của chú thích `@Async`, tôi cũng đã tạo một lớp cấu hình và đánh dấu nó bằng `@EnableAsync`:

```java
@Configuration
@EnableAsync
public class ProjectConfig {
}
```

> **LƯU Ý** Đôi khi trong các bài viết hoặc trên các diễn đàn, các chú thích cấu hình được đặt ngay trên lớp chính (main class). Ví dụ, bạn có thể thấy một số ví dụ sử dụng chú thích `@EnableAsync` trực tiếp trên lớp chính. Cách tiếp cận này về mặt kỹ thuật là chính xác vì chúng ta đánh dấu lớp chính của một ứng dụng Spring Boot bằng chú thích `@SpringBootApplication`, vốn đã bao gồm đặc tính `@Configuration`. Tuy nhiên, trong một ứng dụng thực tế, chúng ta muốn giữ các trách nhiệm tách biệt và không bao giờ sử dụng lớp chính làm lớp cấu hình. Để giúp mọi thứ rõ ràng nhất có thể cho các ví dụ trong cuốn sách này, tôi muốn giữ các chú thích này trên lớp `@Configuration`, tương tự như cách bạn sẽ thấy chúng trong các kịch bản thực tế.

Nếu bạn chạy thử đoạn mã như hiện tại, nó sẽ ném ra ngoại lệ `NullPointerException` tại dòng lệnh lấy tên từ đối tượng xác thực, cụ thể là:

```java
String username = context.getAuthentication().getName()
```

Điều này xảy ra do phương thức hiện được thực thi trên một luồng khác vốn không thừa hưởng ngữ cảnh bảo mật. Vì lý do đó, đối tượng `Authentication` bị `null`, và trong bối cảnh của đoạn mã được trình bày, nó gây ra lỗi `NullPointerException`. Trong trường hợp này, bạn có thể giải quyết vấn đề bằng cách sử dụng chiến lược `MODE_INHERITABLETHREADLOCAL`. Chiến lược này có thể được thiết lập bằng cách gọi phương thức `SecurityContextHolder.setStrategyName()` hoặc bằng cách sử dụng thuộc tính hệ thống `spring.security.strategy`. Bằng cách thiết lập chiến lược này, framework biết cách sao chép thông tin chi tiết của luồng ban đầu của yêu cầu sang luồng mới được tạo của phương thức bất đồng bộ.

Đoạn mã tiếp theo trình bày một cách để thiết lập chiến lược quản lý ngữ cảnh bảo mật bằng cách gọi phương thức `setStrategyName()`.

**Mã nguồn 6.10 Sử dụng InitializingBean để thiết lập chế độ SecurityContextHolder**

```java
@Configuration
@EnableAsync
public class ProjectConfig {

    @Bean
    public InitializingBean initializingBean() {
        return () -> SecurityContextHolder.setStrategyName(
            SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
    }
}
```

Sau khi gọi điểm cuối, bạn sẽ quan sát thấy ngữ cảnh bảo mật được Spring truyền tải một cách chính xác sang luồng tiếp theo. Ngoài ra, `Authentication` không còn bị `null` nữa.

> **LƯU Ý** Cơ chế này chỉ hoạt động khi chính framework tự tạo ra luồng (ví dụ: trong trường hợp của phương thức `@Async`). Nếu mã nguồn của bạn tự tạo luồng, bạn sẽ gặp phải vấn đề tương tự ngay cả khi đã áp dụng chiến lược `MODE_INHERITABLETHREADLOCAL`. Điều này xảy ra bởi vì trong trường hợp này, framework không hề biết về luồng mà mã nguồn của bạn tự ý tạo ra. Chúng ta sẽ thảo luận về cách giải quyết các vấn đề trong những trường hợp này ở mục 6.2.4 và 6.2.5.

### 6.2.3 Sử dụng chiến lược lưu giữ cho các ứng dụng độc lập (standalone)

Nếu những gì bạn cần là một ngữ cảnh bảo mật được chia sẻ bởi tất cả các luồng của ứng dụng, hãy chuyển đổi chiến lược sang `MODE_GLOBAL`. Bạn sẽ không sử dụng chiến lược này cho một máy chủ web vì nó không phù hợp với bức tranh tổng thể của ứng dụng. Một ứng dụng web phía máy chủ quản lý độc lập các yêu cầu mà nó nhận được, do đó việc phân tách ngữ cảnh bảo mật cho từng yêu cầu sẽ hợp lý hơn nhiều so với việc dùng chung một ngữ cảnh duy nhất cho tất cả. Tuy nhiên, đây có thể là một phương án tốt cho một ứng dụng độc lập (standalone).

Khi sử dụng `MODE_GLOBAL` làm chiến lược quản lý ngữ cảnh bảo mật, tất cả các luồng đều truy cập vào cùng một ngữ cảnh bảo mật duy nhất. Điều này ngụ ý rằng tất cả chúng đều có quyền truy cập vào cùng một dữ liệu và có thể thay đổi thông tin đó. Do đó, các tình trạng tranh chấp dữ liệu (race conditions) có thể xảy ra, và bạn bắt buộc phải xử lý vấn đề đồng bộ hóa (synchronization).

Như đoạn mã dưới đây cho thấy, bạn có thể thay đổi chiến lược tương tự như cách chúng ta đã làm với `MODE_INHERITABLETHREADLOCAL`. Bạn có thể sử dụng phương thức `SecurityContextHolder.setStrategyName()` hoặc thuộc tính hệ thống `spring.security.strategy`:

```java
@Bean
public InitializingBean initializingBean() {
    return () -> SecurityContextHolder.setStrategyName(
        SecurityContextHolder.MODE_GLOBAL);
}
```

Đồng thời, hãy lưu ý rằng `SecurityContext` không phải là một đối tượng an toàn với luồng (thread-safe). Vì vậy, với chiến lược mà tất cả các luồng của ứng dụng đều có thể truy cập vào đối tượng `SecurityContext` này, bạn cần phải hết sức lưu ý đến vấn đề truy cập đồng thời (concurrent access).

### 6.2.4 Chuyển tiếp ngữ cảnh bảo mật bằng DelegatingSecurityContextRunnable

Bạn đã biết rằng mình có thể quản lý ngữ cảnh bảo mật với ba chế độ do Spring Security cung cấp: `MODE_THREADLOCAL`, `MODE_INHERITEDTHREADLOCAL` và `MODE_GLOBAL`. Theo mặc định, framework chỉ đảm bảo cung cấp ngữ cảnh bảo mật cho luồng yêu cầu, và ngữ cảnh bảo mật này chỉ có thể được truy cập bởi chính luồng đó. Tuy nhiên, framework không tự động xử lý các luồng mới được tạo ra (ví dụ: trong trường hợp của phương thức bất đồng bộ). Hơn nữa, bạn đã biết rằng đối với tình huống này, bạn phải thiết lập rõ ràng một chế độ khác cho việc quản lý ngữ cảnh bảo mật. Nhưng chúng ta vẫn còn một trường hợp đặc biệt: Điều gì xảy ra khi mã nguồn của bạn bắt đầu các luồng mới mà framework không hề hay biết? Đôi khi chúng ta gọi đây là các luồng tự quản lý (self-managed) vì chính chúng ta là người quản lý chúng, chứ không phải framework. Trong phần này, chúng ta sẽ áp dụng một số công cụ tiện ích do Spring Security cung cấp để giúp bạn truyền tải ngữ cảnh bảo mật sang các luồng mới được tạo.

Không có chiến lược cụ thể nào của `SecurityContextHolder` cung cấp cho bạn giải pháp cho các luồng tự quản lý. Trong trường hợp này, bạn cần phải tự mình xử lý việc truyền tải ngữ cảnh bảo mật. Một giải pháp cho việc này là sử dụng `DelegatingSecurityContextRunnable` để bao bọc (decorate) các tác vụ mà bạn muốn thực thi trên một luồng riêng biệt. Lớp `DelegatingSecurityContextRunnable` kế thừa từ `Runnable`. Bạn có thể sử dụng nó sau khi thực thi tác vụ khi không mong đợi giá trị trả về. Nếu có giá trị trả về, bạn có thể sử dụng phương án thay thế `Callable<T>`, cụ thể là `DelegatingSecurityContextCallable<T>`. Cả hai lớp đều đại diện cho các tác vụ được thực thi bất đồng bộ, tương tự như bất kỳ `Runnable` hay `Callable` nào khác. Hơn nữa, chúng đảm bảo sao chép ngữ cảnh bảo mật hiện tại cho luồng thực thi tác vụ. Các đối tượng này bao bọc các tác vụ ban đầu và sao chép ngữ cảnh bảo mật sang các luồng mới.

`DelegatingSecurityContextCallable` được thiết kế như một bộ bao bọc (decorator) của đối tượng `Callable`. Khi xây dựng một đối tượng như vậy, bạn cung cấp tác vụ callable mà ứng dụng sẽ thực thi bất đồng bộ. `DelegatingSecurityContextCallable` sao chép các chi tiết từ ngữ cảnh bảo mật sang luồng mới và sau đó thực thi tác vụ.

Đoạn mã tiếp theo trình bày cách sử dụng `DelegatingSecurityContextCallable`. Hãy bắt đầu bằng cách định nghĩa một phương thức điểm cuối đơn giản khai báo một đối tượng `Callable`. Tác vụ `Callable` này trả về tên đăng nhập lấy từ ngữ cảnh bảo mật hiện tại.

**Mã nguồn 6.11 Định nghĩa một đối tượng Callable và thực thi nó như một tác vụ trên một luồng riêng biệt**

```java
@GetMapping("/ciao")
public String ciao() throws Exception {
    Callable<String> task = () -> {
        SecurityContext context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    };

    // Mã nguồn được lược bỏ
}
```

Chúng ta tiếp tục ví dụ bằng cách gửi tác vụ này đến một `ExecutorService`. Kết quả của quá trình thực thi được truy xuất và trả về làm thân phản hồi của điểm cuối.

**Mã nguồn 6.12 Định nghĩa một ExecutorService và gửi tác vụ**

```java
@GetMapping("/ciao")
public String ciao() throws Exception {
    Callable<String> task = () -> {
        SecurityContext context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    };

    ExecutorService e = Executors.newCachedThreadPool();
    try {
        return "Ciao, " + e.submit(task).get() + "!";
    } finally {
        e.shutdown();
    }
}
```

Nếu bạn chạy ứng dụng như hiện tại, bạn sẽ không nhận được gì ngoài một ngoại lệ `NullPointerException`. Bên trong luồng mới được tạo để chạy tác vụ callable, thông tin xác thực không còn tồn tại nữa, và ngữ cảnh bảo mật trống rỗng. Để giải quyết vấn đề này, chúng ta bao bọc tác vụ bằng `DelegatingSecurityContextCallable` — lớp cung cấp ngữ cảnh hiện tại cho luồng mới, như được trình bày trong đoạn mã dưới đây.

**Mã nguồn 6.13 Chạy tác vụ được bao bọc bởi DelegatingSecurityContextCallable**

```java
@GetMapping("/ciao")
public String ciao() throws Exception {
    Callable<String> task = () -> {
        SecurityContext context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    };

    ExecutorService e = Executors.newCachedThreadPool();
    try {
        var contextTask = new DelegatingSecurityContextCallable<>(task);
        return "Ciao, " + e.submit(contextTask).get() + "!";
    } finally {
        e.shutdown();
    }
}
```

Bây giờ khi gọi điểm cuối, bạn có thể quan sát thấy rằng Spring đã truyền tải ngữ cảnh bảo mật sang luồng thực thi các tác vụ:

```bash
curl -u user:2eb3f2e8-debd-420c-9680-48159b2ff905 http://localhost:8080/ciao

Ciao, user!
```

### 6.2.5 Chuyển tiếp ngữ cảnh bảo mật bằng DelegatingSecurityContextExecutorService

Khi làm việc với các luồng mà mã nguồn của chúng ta tự kích hoạt mà không thông báo cho framework, chúng ta phải tự quản lý việc truyền tải thông tin chi tiết từ ngữ cảnh bảo mật sang luồng tiếp theo. Trong mục 6.2.4, bạn đã áp dụng kỹ thuật sao chép thông tin chi tiết từ ngữ cảnh bảo mật bằng cách tận dụng chính tác vụ đó. Spring Security cung cấp một số lớp tiện ích rất tuyệt vời như `DelegatingSecurityContextRunnable` và `DelegatingSecurityContextCallable`. Các lớp này bao bọc các tác vụ bạn thực thi bất đồng bộ, đồng thời chịu trách nhiệm sao chép thông tin từ ngữ cảnh bảo mật để triển khai của bạn có thể truy cập chúng từ luồng mới được tạo. Tuy nhiên, chúng ta còn có một lựa chọn thứ hai để giải quyết việc truyền tải ngữ cảnh bảo mật sang luồng mới, đó là quản lý việc truyền tải từ chính bể luồng (thread pool) thay vì từ bản thân tác vụ. Trong phần này, bạn sẽ học cách áp dụng kỹ thuật này bằng cách sử dụng nhiều lớp tiện ích hữu ích hơn do Spring Security cung cấp.

Một giải pháp thay thế cho việc bao bọc các tác vụ là sử dụng một loại `Executor` đặc biệt. Trong ví dụ tiếp theo, bạn có thể quan sát thấy rằng tác vụ vẫn là một `Callable<T>` đơn giản, nhưng luồng vẫn quản lý được ngữ cảnh bảo mật. Việc truyền tải ngữ cảnh bảo mật diễn ra bởi vì một triển khai có tên là `DelegatingSecurityContextExecutorService` đã bao bọc `ExecutorService`.

`DelegatingSecurityContextExecutorService` cũng đảm nhận trách nhiệm truyền tải ngữ cảnh bảo mật. `DelegatingSecurityContextExecutorService` bao bọc một `ExecutorService` và truyền tải thông tin chi tiết của ngữ cảnh bảo mật sang luồng tiếp theo trước khi gửi tác vụ.

Đoạn mã trong phần tiếp theo chỉ ra cách sử dụng một `DelegatingSecurityContextExecutorService` để bao bọc một `ExecutorService` sao cho khi bạn gửi tác vụ, nó sẽ tự động xử lý việc truyền tải các thông tin chi tiết của ngữ cảnh bảo mật.

**Mã nguồn 6.14 Truyền tải SecurityContext**

```java
@GetMapping("/hola")
public String hola() throws Exception {
    Callable<String> task = () -> {
        SecurityContext context = SecurityContextHolder.getContext();
        return context.getAuthentication().getName();
    };

    ExecutorService e = Executors.newCachedThreadPool();
    e = new DelegatingSecurityContextExecutorService(e);
    try {
        return "Hola, " + e.submit(task).get() + "!";
    } finally {
        e.shutdown();
    }
}
```

Hãy gọi điểm cuối để kiểm tra xem `DelegatingSecurityContextExecutorService` đã ủy thác ngữ cảnh bảo mật một cách chính xác hay chưa:

```bash
curl -u user:5a5124cc-060d-401c-a396-0a8625ab3bad http://localhost:8080/hola

Hola, user!
```

> **LƯU Ý** Trong số các lớp liên quan đến hỗ trợ xử lý đồng thời cho ngữ cảnh bảo mật, bạn nên ghi nhớ những lớp được trình bày trong bảng 6.1.

Spring cung cấp nhiều triển khai khác nhau của các lớp tiện ích có thể được sử dụng trong ứng dụng của bạn để quản lý ngữ cảnh bảo mật khi tạo các luồng của riêng bạn. Trong mục 6.2.4, bạn đã triển khai `DelegatingSecurityContextCallable`. Trong phần này, chúng ta sử dụng `DelegatingSecurityContextExecutorService`. Nếu bạn cần triển khai việc truyền tải ngữ cảnh bảo mật cho một tác vụ được lập lịch (scheduled task), thì bạn sẽ rất vui khi biết rằng Spring Security cũng cung cấp cho bạn một bộ bao bọc mang tên `DelegatingSecurityContextScheduledExecutorService`. Cơ chế này tương tự như `DelegatingSecurityContextExecutorService` được trình bày trong phần này, với điểm khác biệt là nó bao bọc một `ScheduledExecutorService`, cho phép bạn làm việc với các tác vụ được lập lịch.

Ngoài ra, để tăng tính linh hoạt, Spring Security cung cấp cho bạn một phiên bản trừu tượng hơn của bộ bao bọc gọi là `DelegatingSecurityContextExecutor`. Lớp này trực tiếp bao bọc một `Executor` — hợp đồng trừu tượng nhất của hệ thống phân cấp các bể luồng này. Bạn có thể chọn nó cho thiết kế ứng dụng của mình khi muốn có khả năng thay thế triển khai của bể luồng bằng bất kỳ lựa chọn nào mà ngôn ngữ cung cấp.

**Bảng 6.1 Các đối tượng chịu trách nhiệm ủy thác ngữ cảnh bảo mật sang một luồng riêng biệt**

| Lớp | Mô tả |
|---|---|
| `DelegatingSecurityContextExecutor` | Triển khai giao diện `Executor` và được thiết kế để bao bọc một đối tượng `Executor` với khả năng chuyển tiếp ngữ cảnh bảo mật sang các luồng được tạo bởi bể luồng của nó. |
| `DelegatingSecurityContextExecutorService` | Triển khai giao diện `ExecutorService` và được thiết kế để bao bọc một đối tượng `ExecutorService` với khả năng chuyển tiếp ngữ cảnh bảo mật sang các luồng được tạo bởi bể luồng của nó. |
| `DelegatingSecurityContextScheduledExecutorService` | Triển khai giao diện `ScheduledExecutorService` và được thiết kế để bao bọc một đối tượng `ScheduledExecutorService` với khả năng chuyển tiếp ngữ cảnh bảo mật sang các luồng được tạo bởi bể luồng của nó. |
| `DelegatingSecurityContextRunnable` | Triển khai giao diện `Runnable` và đại diện cho một tác vụ được thực thi trên một luồng khác mà không trả về phản hồi. Khác với một `Runnable` thông thường, nó cũng có thể truyền tải một ngữ cảnh bảo mật để sử dụng trên luồng mới. |
| `DelegatingSecurityContextCallable` | Triển khai giao diện `Callable` và đại diện cho một tác vụ được thực thi trên một luồng khác và cuối cùng sẽ trả về phản hồi. Khác với một `Callable` thông thường, nó cũng có thể truyền tải một ngữ cảnh bảo mật để sử dụng trên luồng mới. |

## 6.3 Tìm hiểu về xác thực HTTP Basic và đăng nhập bằng biểu mẫu

Cho đến nay, chúng ta mới chỉ sử dụng HTTP Basic làm phương thức xác thực, nhưng xuyên suốt cuốn sách này, bạn sẽ biết rằng còn có những khả năng khác nữa. Phương thức xác thực HTTP Basic rất đơn giản, điều này làm cho nó trở thành một lựa chọn tuyệt vời cho các ví dụ, mục đích minh họa hoặc thử nghiệm kiểm chứng khái niệm. Nhưng cũng chính vì lý do đó, nó có thể không phù hợp với tất cả các kịch bản thực tế mà bạn cần triển khai.

Trong phần này, bạn sẽ tìm hiểu thêm các cấu hình liên quan đến HTTP Basic. Thêm vào đó, chúng ta sẽ nói về một phương thức xác thực mới có tên là `formLogin`. Trong phần còn lại của cuốn sách, chúng ta sẽ thảo luận về các phương thức xác thực khác — những phương thức phù hợp với các loại kiến trúc khác nhau. Chúng ta sẽ so sánh chúng để bạn có thể nắm được các thực hành tốt nhất, cũng như các phản mẫu (anti-patterns) trong xác thực.

### 6.3.1 Sử dụng và cấu hình HTTP Basic

Bạn đã biết rằng HTTP Basic là phương thức xác thực mặc định, và chúng ta đã thấy cách thức hoạt động của nó trong nhiều ví dụ khác nhau ở Chương 3. Trong phần này, chúng ta sẽ bổ sung thêm các chi tiết liên quan đến việc cấu hình phương thức xác thực này.

Đối với các kịch bản lý thuyết, các thiết lập mặc định đi kèm với xác thực HTTP Basic là rất tuyệt vời. Tuy nhiên, trong một ứng dụng phức tạp hơn, bạn có thể thấy cần phải tùy biến một số thiết lập này. Ví dụ, bạn có thể muốn triển khai một logic cụ thể cho trường hợp quá trình xác thực thất bại. Bạn thậm chí có thể cần thiết lập một số giá trị trên phản hồi gửi ngược lại cho phía máy khách trong trường hợp này. Hãy xem xét các trường hợp này với các ví dụ thực tế để hiểu cách bạn có thể triển khai nó. Tôi muốn chỉ ra một lần nữa cách bạn có thể thiết lập phương thức này một cách rõ ràng, như được trình bày trong đoạn mã dưới đây. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch6-ex3`.

**Mã nguồn 6.15 Thiết lập phương thức xác thực HTTP Basic**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
```

Bạn có thể gọi phương thức `httpBasic()` của thực thể `HttpSecurity` với một tham số thuộc kiểu `Customizer`. Tham số này cho phép bạn thiết lập một số cấu hình liên quan đến phương thức xác thực, ví dụ như tên vùng bảo vệ (realm name), như được trình bày trong đoạn mã 6.16. Bạn có thể coi vùng bảo vệ (realm) như một không gian bảo vệ sử dụng một phương thức xác thực cụ thể. Để có mô tả đầy đủ, hãy tham khảo RFC 2617 tại https://tools.ietf.org/html/rfc2617.

**Mã nguồn 6.16 Cấu hình tên vùng bảo vệ cho phản hồi khi xác thực thất bại**

```java
@Bean
public SecurityFilterChain configure(HttpSecurity http) throws Exception {
    http.httpBasic(c -> {
        c.realmName("OTHER");
        c.authenticationEntryPoint(new CustomEntryPoint());
    });

    http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
    return http.build();
}
```

Đoạn mã 6.16 trình bày một ví dụ về việc thay đổi tên vùng bảo vệ. Biểu thức lambda được sử dụng trên thực tế là một đối tượng thuộc kiểu `Customizer<HttpBasicConfigurer<HttpSecurity>>`. Tham số thuộc kiểu `HttpBasicConfigurer<HttpSecurity>` cho phép chúng ta gọi phương thức `realmName()` để đổi tên vùng bảo vệ. Bạn có thể sử dụng cURL với cờ `-v` để nhận được một phản hồi HTTP chi tiết, trong đó tên vùng bảo vệ thực sự đã được thay đổi. Tuy nhiên, lưu ý rằng bạn sẽ chỉ tìm thấy tiêu đề `WWW-Authenticate` trong phản hồi khi trạng thái phản hồi HTTP là 401 Unauthorized chứ không phải khi trạng thái phản hồi HTTP là 200 OK. Dưới đây là lệnh gọi cURL:

```bash
curl -v http://localhost:8080/hello
```

Phản hồi của cuộc gọi là:

```text
/
...
< WWW-Authenticate: Basic realm="OTHER"
...
```

Ngoài ra, bằng cách sử dụng một `Customizer`, chúng ta có thể tùy biến phản hồi cho một trường hợp xác thực thất bại. Bạn cần làm điều này nếu máy khách của hệ thống mong đợi một điều gì đó cụ thể trong phản hồi khi xác thực không thành công. Bạn có thể cần thêm hoặc bớt một hoặc nhiều tiêu đề. Hoặc bạn có thể có một số logic lọc thân phản hồi để đảm bảo rằng ứng dụng không để lộ bất kỳ dữ liệu nhạy cảm nào cho máy khách.

> **LƯU Ý** Hãy luôn cẩn trọng với dữ liệu mà bạn để lộ ra bên ngoài hệ thống. Một trong những sai lầm phổ biến nhất (vốn cũng nằm trong mười lỗ hổng hàng đầu của OWASP; xem https://owasp.org/www-project-top-ten/) là để lộ dữ liệu nhạy cảm. Việc xử lý các chi tiết mà ứng dụng gửi cho máy khách khi xác thực thất bại luôn là một điểm rủi ro có thể làm rò rỉ thông tin mật.

Để tùy biến phản hồi cho một trường hợp xác thực thất bại, chúng ta có thể triển khai một `AuthenticationEntryPoint`. Phương thức `commence()` của nó nhận vào `HttpServletRequest`, `HttpServletResponse` và ngoại lệ `AuthenticationException` gây ra việc xác thực thất bại. Đoạn mã 6.17 minh họa một cách triển khai `AuthenticationEntryPoint`, trong đó bổ sung một tiêu đề vào phản hồi và thiết lập trạng thái HTTP thành 401 Unauthorized.

> **LƯU Ý** Có một chút mơ hồ khi tên của giao diện `AuthenticationEntryPoint` không phản ánh trực tiếp việc sử dụng nó khi xác thực thất bại. Trong kiến trúc Spring Security, thành phần này được sử dụng trực tiếp bởi một thành phần gọi là `ExceptionTranslationManager` — nơi xử lý bất kỳ ngoại lệ `AccessDeniedException` và `AuthenticationException` nào được ném ra trong chuỗi bộ lọc. Bạn có thể coi `ExceptionTranslationManager` như một cầu nối giữa các ngoại lệ Java và các phản hồi HTTP.

```java
// Mã nguồn 6.17 Triển khai một AuthenticationEntryPoint
public class CustomEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(
        HttpServletRequest httpServletRequest,
        HttpServletResponse httpServletResponse,
        AuthenticationException e) throws IOException, ServletException {

        httpServletResponse.addHeader("message", "Luke, I am your father!");
        httpServletResponse.sendError(HttpStatus.UNAUTHORIZED.value());
    }
}
```

Sau đó, bạn có thể đăng ký `CustomEntryPoint` với phương thức HTTP Basic trong lớp cấu hình. Đoạn mã tiếp theo trình bày lớp cấu hình cho điểm truy cập tùy chỉnh này.

```java
// Mã nguồn 6.18 Thiết lập AuthenticationEntryPoint tùy chỉnh
@Bean
public SecurityFilterChain configure(HttpSecurity http) throws Exception {
    http.httpBasic(c -> {
        c.realmName("OTHER");
        c.authenticationEntryPoint(new CustomEntryPoint());
    });

    http.authorizeHttpRequests().anyRequest().authenticated();
    return http.build();
}
```

Nếu bây giờ bạn thực hiện một cuộc gọi đến một điểm cuối sao cho việc xác thực thất bại, bạn sẽ tìm thấy tiêu đề mới được thêm vào trong phản hồi:

```bash
curl -v http://localhost:8080/hello
```

Phản hồi của cuộc gọi là:

```text
...
< HTTP/1.1 401
< Set-Cookie: JSESSIONID=459BAFA7E0E6246A463AD19B07569C7B; Path=/; HttpOnly
< message: Luke, I am your father!
...
```

### 6.3.2 Triển khai xác thực với đăng nhập bằng biểu mẫu (form-based login)

Khi phát triển một ứng dụng web, bạn có lẽ sẽ muốn hiển thị một biểu mẫu đăng nhập thân thiện với người dùng, nơi họ có thể nhập vào thông tin đăng nhập của mình. Thêm vào đó, bạn có thể muốn người dùng đã xác thực của mình có thể duyệt qua các trang web sau khi họ đã đăng nhập và có thể đăng xuất. Đối với một ứng dụng web quy mô nhỏ, bạn có thể tận dụng phương thức đăng nhập bằng biểu mẫu. Trong phần này, bạn sẽ học cách áp dụng và cấu hình phương thức xác thực này cho ứng dụng của mình. Để đạt được điều này, chúng ta sẽ viết một ứng dụng web nhỏ sử dụng đăng nhập bằng biểu mẫu. Các ví dụ trong phần này là một phần của dự án `ssia-ch6-ex4`.

> **LƯU Ý** Tôi liên kết phương thức này với một ứng dụng web quy mô nhỏ bởi vì bằng cách này, chúng ta sử dụng một phiên làm việc phía máy chủ (server-side session) để quản lý ngữ cảnh bảo mật. Đối với các ứng dụng lớn hơn đòi hỏi khả năng mở rộng theo chiều ngang (horizontal scalability), việc sử dụng phiên làm việc phía máy chủ để quản lý ngữ cảnh bảo mật là không mong muốn. Chúng ta sẽ thảo luận chi tiết hơn về các khía cạnh này trong các chương từ 12 đến 15 khi làm việc với OAuth 2.

Để thay đổi phương thức xác thực thành đăng nhập bằng biểu mẫu, thay vì sử dụng `httpBasic()`, hãy gọi phương thức `formLogin()` của tham số `HttpSecurity` trong bean `SecurityFilterChain`. Đoạn mã dưới đây trình bày sự thay đổi này.

```java
// Mã nguồn 6.19 Thay đổi phương thức xác thực thành đăng nhập bằng biểu mẫu
@Configuration
public class ProjectConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception […]
        http.formLogin(Customizer.withDefaults());
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}
```

Ngay cả với cấu hình tối giản này, Spring Security đã tự động cấu hình một biểu mẫu đăng nhập, cũng như một trang đăng xuất cho dự án của bạn. Khởi động ứng dụng và truy cập nó bằng trình duyệt sẽ chuyển hướng bạn đến một trang đăng nhập.

Bạn có thể đăng nhập bằng các thông tin đăng nhập mặc định được cung cấp miễn là bạn chưa đăng ký `UserDetailsService` của riêng mình. Như chúng ta đã biết ở Chương 2, các thông tin này bao gồm tên đăng nhập là `user` và một mật khẩu UUID được in ra trong bảng điều khiển (console) khi ứng dụng khởi động. Vì không có trang nào khác được định nghĩa, bạn sẽ bị chuyển hướng đến một trang báo lỗi mặc định sau khi đăng nhập thành công. Ứng dụng dựa trên cùng một kiến trúc xác thực mà chúng ta đã gặp trong các ví dụ trước. Vì vậy, bạn cần triển khai một bộ điều khiển (controller) cho trang chủ của ứng dụng. Sự khác biệt là thay vì có một phản hồi định dạng JSON đơn giản, chúng ta muốn điểm cuối trả về mã HTML có thể được trình duyệt diễn giải như trang web của chúng ta. Do đó, chúng ta chọn tuân theo luồng Spring MVC và để chế độ xem (view) được hiển thị từ một tệp tin sau khi thực thi hành động được định nghĩa trong bộ điều khiển.

Để thêm một trang đơn giản vào ứng dụng, trước tiên bạn phải tạo một tệp HTML trong thư mục `resources/static` của dự án. Tôi gọi tệp này là `home.html`. Bên trong nó, hãy gõ một đoạn văn bản mà bạn có thể tìm thấy sau đó trong trình duyệt. Bạn chỉ cần thêm một tiêu đề (ví dụ: `<h1>Welcome</h1>`). Sau khi tạo trang HTML, một bộ điều khiển cần định nghĩa ánh xạ từ đường dẫn đến chế độ xem. Đoạn mã dưới đây trình bày định nghĩa của phương thức hành động cho trang `home.html` trong lớp bộ điều khiển.

```java
// Mã nguồn 6.20 Định nghĩa phương thức hành động của bộ điều khiển cho trang home.htm […]
@Controller
public class HelloController {
    @GetMapping("/home")
    public String home() {
        return "home.html";
    }
}
```

Hãy nhớ rằng đây không phải là một `@RestController` mà là một `@Controller` đơn giản. Vì lý do này, Spring không gửi giá trị được trả về bởi phương thức trong phản hồi HTTP. Thay vào đó, nó tìm kiếm và hiển thị chế độ xem có tên là `home.html`.

Thử truy cập đường dẫn `/home` bây giờ, trước tiên bạn sẽ được hỏi xem có muốn đăng nhập hay không. Sau khi đăng nhập thành công, bạn sẽ được chuyển hướng đến trang chủ, nơi thông báo chào mừng xuất hiện. Giờ đây bạn có thể truy cập đường dẫn `/logout`, và điều này sẽ chuyển hướng bạn đến một trang đăng xuất. Sau khi cố gắng truy cập một đường dẫn mà không đăng nhập, người dùng sẽ tự động bị chuyển hướng đến trang đăng nhập. Sau khi đăng nhập thành công, ứng dụng sẽ chuyển hướng người dùng quay trở lại đường dẫn mà họ đã cố gắng truy cập ban đầu. Nếu đường dẫn đó không tồn tại, ứng dụng sẽ hiển thị một trang báo lỗi mặc định. Phương thức `formLogin()` trả về một đối tượng thuộc kiểu `FormLoginConfigurer<HttpSecurity>`, cho phép chúng ta thực hiện các tùy biến. Ví dụ, bạn có thể làm điều này bằng cách gọi phương thức `defaultSuccessUrl()`, như được trình bày trong đoạn mã dưới đây.

```java
// Mã nguồn 6.21 Thiết lập một URL thành công mặc định cho biểu mẫu đăng nhập
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.formLogin(c -> c.defaultSuccessUrl("/home", true));
    http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
    return http.build();
}
```

Nếu bạn cần đi sâu hơn nữa vào vấn đề này, việc sử dụng các đối tượng `AuthenticationSuccessHandler` và `AuthenticationFailureHandler` sẽ cung cấp một hướng tiếp cận tùy biến chi tiết hơn. Các giao diện này cho phép bạn triển khai một đối tượng để qua đó áp dụng logic được thực thi khi xác thực. Nếu muốn tùy biến logic cho trường hợp xác thực thành công, bạn có thể định nghĩa một `AuthenticationSuccessHandler`. Phương thức `onAuthenticationSuccess()` nhận vào yêu cầu servlet, phản hồi servlet và đối tượng `Authentication` làm tham số. Trong đoạn mã tiếp theo, bạn sẽ tìm thấy một ví dụ về việc triển khai phương thức `onAuthenticationSuccess()` để thực hiện các chuyển hướng khác nhau tùy thuộc vào các quyền hạn được cấp của người dùng đã đăng nhập.

```java
// Mã nguồn 6.22 Triển khai một AuthenticationSuccessHandler
@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandle […]
    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest httpServletRequest,
        HttpServletResponse httpServletResponse,
        Authentication authentication) throws IOException {

        var authorities = authentication.getAuthorities();
        var auth = authorities.stream()
            .filter(a -> a.getAuthority().equals("read"))
            .findFirst();

        if (auth.isPresent()) {
            httpServletResponse.sendRedirect("/home");
        } else {
            httpServletResponse.sendRedirect("/error");
        }
    }
}
```

Có những tình huống trong các kịch bản thực tế khi máy khách mong đợi một định dạng phản hồi nhất định trong trường hợp xác thực thất bại. Họ có thể mong đợi một mã trạng thái HTTP khác với 401 Unauthorized hoặc thông tin bổ sung trong thân phản hồi. Trường hợp điển hình nhất mà tôi tìm thấy trong các ứng dụng liên quan đến việc gửi một định danh yêu cầu (request identifier). Định danh yêu cầu này có một giá trị duy nhất được sử dụng để truy vết yêu cầu giữa nhiều hệ thống, và ứng dụng có thể gửi nó trong thân phản hồi trong trường hợp xác thực thất bại. Một tình huống khác là khi bạn muốn làm sạch phản hồi để đảm bảo rằng ứng dụng không để lộ dữ liệu nhạy cảm ra ngoài hệ thống. Bạn có thể muốn định nghĩa logic tùy chỉnh cho trường hợp xác thực thất bại đơn giản bằng cách ghi nhật ký (logging) sự kiện để phục vụ cho việc điều tra thêm.

Nếu bạn muốn tùy biến logic mà ứng dụng thực thi khi xác thực thất bại, bạn có thể làm điều này tương tự với một triển khai `AuthenticationFailureHandler`. Ví dụ, nếu bạn muốn thêm một tiêu đề cụ thể cho bất kỳ trường hợp xác thực thất bại nào, bạn có thể làm điều gì đó như được trình bày trong đoạn mã 6.23. Tất nhiên, bạn cũng có thể triển khai bất kỳ logic nào ở đây. Đối với `AuthenticationFailureHandler`, phương thức `onAuthenticationFailure()` nhận vào yêu cầu, phản hồi và đối tượng ngoại lệ `AuthenticationException`.

```java
// Mã nguồn 6.23 Triển khai một AuthenticationFailureHandler
@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandle […]
    @Override
    public void onAuthenticationFailure(
        HttpServletRequest httpServletRequest,
        HttpServletResponse httpServletResponse,
        AuthenticationException e) {

        try {
            httpServletResponse.setHeader("failed", LocalDateTime.now().toString());
            httpServletResponse.sendRedirect("/error");
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
    }
}
```

Để sử dụng hai đối tượng này, bạn cần đăng ký chúng trong phương thức `securityFilterChain()` trên đối tượng `FormLoginConfigurer` được trả về bởi phương thức `formLogin()`. Đoạn mã dưới đây chỉ ra cách thực hiện việc này.

```java
// Mã nguồn 6.24 Đăng ký các đối tượng trình xử lý trong lớp cấu hình
@Configuration
public class ProjectConfig {
    private final CustomAuthenticationSuccessHandler authenticationSuccessHandler;
    private final CustomAuthenticationFailureHandler authenticationFailureHandler;

    // Khởi tạo (constructor) được lược bỏ
    @Bean
    public UserDetailsService uds() {
        var uds = new InMemoryUserDetailsManager();
        uds.createUser(
            User.withDefaultPasswordEncoder()
                .username("john")
                .password("12345")
                .authorities("read")
                .build()
        );
        uds.createUser(
            User.withDefaultPasswordEncoder()
                .username("bill")
                .password("12345")
                .authorities("write")
                .build()
        );
        return uds;
    }

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        http.formLogin(c ->
            c.successHandler(authenticationSuccessHandler)
             .failureHandler(authenticationFailureHandler)
        );
        http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
        return http.build();
    }
}
```

Hiện tại, nếu bạn cố gắng truy cập đường dẫn `/home` bằng HTTP Basic với tên đăng nhập và mật khẩu chính xác, bạn sẽ nhận được một phản hồi với trạng thái HTTP 302 Found. Đây là cách ứng dụng báo cho bạn biết rằng nó đang cố gắng thực hiện một chuyển hướng. Ngay cả khi bạn đã cung cấp đúng tên đăng nhập và mật khẩu, nó sẽ không xem xét những thông tin này mà thay vào đó sẽ cố gắng đưa bạn đến biểu mẫu đăng nhập theo yêu cầu của phương thức `formLogin`. Tuy nhiên, bạn có thể thay đổi cấu hình để hỗ trợ cả hai phương thức HTTP Basic và đăng nhập bằng biểu mẫu, như trong đoạn mã dưới đây.

```java
// Mã nguồn 6.25 Sử dụng đăng nhập bằng biểu mẫu và HTTP Basic cùng nhau
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.formLogin(c ->
        c.successHandler(authenticationSuccessHandler)
         .failureHandler(authenticationFailureHandler)
    );
    http.httpBasic(Customizer.withDefaults());
    http.authorizeHttpRequests(c -> c.anyRequest().authenticated());
    return http.build();
}
```

Bây giờ việc truy cập đường dẫn `/home` đã hoạt động tốt với cả hai phương thức đăng nhập bằng biểu mẫu và xác thực HTTP Basic:

```bash
curl -u user:cdd430f6-8ebc-49a6-9769-b0f3ce571d19 http://localhost:8080/home
```

Phản hồi của cuộc gọi là:

```html
<h1>Welcome</h1>
```

## Tóm tắt Chương 6

- `AuthenticationProvider` là thành phần cho phép bạn tự triển khai logic xác thực theo nhu cầu. Khi tự triển khai logic xác thực, bạn nên giữ cho các nhiệm vụ luôn độc lập và tách biệt (decoupled). Để quản lý người dùng, `AuthenticationProvider` sẽ ủy quyền cho `UserDetailsService`, và để xác thực mật khẩu, nó sẽ ủy quyền cho `PasswordEncoder`.

- `SecurityContext` lưu trữ thông tin chi tiết về thực thể đã được xác thực thành công.

- Bạn có thể sử dụng ba chiến lược để quản lý ngữ cảnh bảo mật: `MODE_THREADLOCAL`, `MODE_INHERITABLETHREADLOCAL` và `MODE_GLOBAL`. Khả năng truy cập thông tin chi tiết của ngữ cảnh bảo mật từ các luồng (thread) khác nhau sẽ hoạt động khác nhau tùy thuộc vào chế độ bạn chọn. Hãy lưu ý rằng khi sử dụng chế độ chia sẻ luồng nội bộ (shared-thread local mode), chế độ này chỉ áp dụng cho các luồng do Spring quản lý. Framework sẽ không sao chép ngữ cảnh bảo mật cho các luồng nằm ngoài tầm kiểm soát của nó.

- Spring Security cung cấp các lớp tiện ích tuyệt vời giúp bạn quản lý các luồng tự tạo trong mã nguồn mà framework có thể nhận biết được. Để quản lý `SecurityContext` cho các luồng tự tạo này, bạn có thể sử dụng:

  ```text
  DelegatingSecurityContextRunnable
  DelegatingSecurityContextCallable
  DelegatingSecurityContextExecutor
  ```

- Spring Security tự động cấu hình một trang đăng nhập và tùy chọn đăng xuất thông qua phương thức xác thực đăng nhập bằng biểu mẫu: `formLogin()`. Phương thức này rất dễ sử dụng khi phát triển các ứng dụng web nhỏ.

- Phương thức xác thực `formLogin` có khả năng tùy biến rất cao. Hơn nữa, bạn có thể kết hợp loại xác thực này với phương thức HTTP Basic.
