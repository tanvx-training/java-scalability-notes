# Chương 3: Quản lý người dùng

**Nội dung chương này gồm**

- Mô tả người dùng bằng interface `UserDetails`

- Sử dụng `UserDetailsService` trong luồng xác thực

- Tạo triển khai tùy chỉnh của `UserDetailsService`

- Tạo triển khai tùy chỉnh của `UserDetailsManager`

- Sử dụng `JdbcUserDetailsManager` trong luồng xác thực

Một người đồng nghiệp của tôi hồi đại học nấu ăn khá ngon. Anh ấy không phải là đầu bếp trong một nhà hàng sang trọng, nhưng lại rất đam mê nấu nướng. Một hôm, khi cùng trò chuyện, tôi hỏi làm thế nào anh có thể nhớ được nhiều công thức nấu ăn đến vậy. Anh trả lời rằng điều đó rất dễ dàng: "Cậu không cần phải nhớ toàn bộ công thức, mà chỉ cần nhớ cách các nguyên liệu cơ bản kết hợp với nhau. Nó giống như các giao ước trong thế giới thực, cho biết thứ gì có thể trộn lẫn hoặc không nên trộn lẫn. Sau đó, với mỗi công thức, cậu chỉ cần nhớ thêm vài mẹo nhỏ thôi."

Sự so sánh này cũng tương tự như cách các kiến trúc phần mềm vận hành. Với bất kỳ framework mạnh mẽ nào, chúng ta đều sử dụng các giao ước để tách biệt (decouple) các phần triển khai của framework khỏi ứng dụng được xây dựng trên đó. Trong Java, chúng ta sử dụng interface để định nghĩa các giao ước. Lập trình viên cũng giống như một người đầu bếp, hiểu rõ các nguyên liệu tương tác với nhau thế nào để chọn ra phương án triển khai phù hợp nhất. Người lập trình nắm vững các lớp trừu tượng (abstraction) của framework và sử dụng chúng để tích hợp vào hệ thống.

Chương này sẽ giúp bạn hiểu rõ chi tiết một trong những vai trò nền tảng mà bạn đã gặp trong ví dụ đầu tiên ở Chương 2—đó là `UserDetailsService`. Bên cạnh `UserDetailsService`, chúng ta sẽ thảo luận về các interface (giao ước) sau:

- `UserDetails`: Mô tả người dùng cho Spring Security.

- `GrantedAuthority`: Cho phép chúng ta định nghĩa các hành động mà người dùng có thể thực thi.

- `UserDetailsManager`: Mở rộng giao ước `UserDetailsService`. Ngoài các hành vi được kế thừa, nó còn mô tả các hành động như tạo người dùng, sửa đổi hoặc xóa mật khẩu của người dùng.

Từ Chương 2, bạn đã có hình dung sơ bộ về vai trò của `UserDetailsService` và `PasswordEncoder` trong quá trình xác thực. Tuy nhiên, chúng ta mới chỉ thảo luận về cách tích hợp một instance do bạn tự định nghĩa thay vì sử dụng instance mặc định do Spring Boot cấu hình. Chúng ta còn nhiều chi tiết cần thảo luận, chẳng hạn như:

- Các triển khai do Spring Security cung cấp và cách sử dụng chúng.

- Cách định nghĩa một triển khai tùy chỉnh cho các giao ước và khi nào nên làm như vậy.

- Các cách triển khai interface mà bạn sẽ gặp trong các ứng dụng thực tế.

- Các thực hành tốt nhất (best practices) khi sử dụng các interface này.

Kế hoạch là bắt đầu từ cách Spring Security hiểu định nghĩa về người dùng. Để làm được điều này, chúng ta sẽ thảo luận về các giao ước `UserDetails` và `GrantedAuthority`. Tiếp theo, chúng ta sẽ đi sâu vào `UserDetailsService` và cách `UserDetailsManager` mở rộng giao ước này. Bạn sẽ áp dụng các triển khai cho các interface này (ví dụ: `InMemoryUserDetailsManager`, `JdbcUserDetailsManager` và `LdapUserDetailsManager`). Khi các triển khai này không phù hợp với hệ thống của bạn, bạn sẽ tự viết một triển khai tùy chỉnh.

## 3.1 Triển khai xác thực trong Spring Security

Trong chương trước, chúng ta đã khởi đầu với Spring Security. Trong ví dụ đầu tiên, chúng ta đã thảo luận về cách Spring Boot thiết lập một số cấu hình mặc định để định nghĩa cách một ứng dụng mới hoạt động ban đầu. Bạn cũng đã học cách ghi đè (override) các cấu hình mặc định này bằng nhiều giải pháp thay thế thường gặp trong các ứng dụng. Tuy nhiên, chúng ta mới chỉ xem xét bề nổi của chúng để bạn có hình dung sơ bộ về những gì chúng ta sẽ làm. Trong chương này, cũng như Chương 4 và Chương 5, chúng ta sẽ thảo luận chi tiết hơn về các interface này, cùng với các triển khai khác nhau và những nơi bạn có thể gặp chúng trong các ứng dụng thực tế.

Hình 3.1 trình bày luồng xác thực trong Spring Security. Kiến trúc này là xương sống của quá trình xác thực được triển khai bởi Spring Security. Việc thấu hiểu nó là vô cùng quan trọng vì bạn sẽ phải dựa vào nó trong bất kỳ triển khai Spring Security nào. Bạn sẽ thấy rằng chúng ta thảo luận về các phần của kiến trúc này trong hầu hết các chương của cuốn sách. Bạn sẽ bắt gặp nó thường xuyên đến mức có thể sẽ học thuộc lòng, và đó là một điều tốt. Nếu nắm rõ kiến trúc này, bạn sẽ giống như một người đầu bếp hiểu rõ các nguyên liệu của mình và có thể kết hợp để tạo ra bất kỳ món ăn nào.

Trong Hình 3.1, các hộp tô xám đại diện cho các thành phần mà chúng ta bắt đầu: `UserDetailsService` và `PasswordEncoder`. Hai thành phần này tập trung vào phần luồng công việc mà tôi thường gọi là "phần quản lý người dùng". Trong chương này, `UserDetailsService` và `PasswordEncoder` là các thành phần tương tác trực tiếp với thông tin chi tiết của người dùng và thông tin xác thực (credentials) của họ. Chúng ta sẽ thảo luận chi tiết về `PasswordEncoder` trong Chương 4.

*Hình 3.1: Luồng xác thực của Spring Security. `AuthenticationFilter` đón nhận yêu cầu (request) gửi đến và chuyển giao nhiệm vụ xác thực cho `AuthenticationManager`. Đến lượt mình, `AuthenticationManager` sử dụng một bộ cung cấp xác thực (authentication provider) để thực hiện quá trình xác thực. Để xác minh tên đăng nhập và mật khẩu, `AuthenticationProvider` sẽ dựa vào một `UserDetailsService` và một `PasswordEncoder`.*

Là một phần của quản lý người dùng, chúng ta sử dụng các interface `UserDetailsService` và `UserDetailsManager`. `UserDetailsService` chỉ chịu trách nhiệm truy xuất người dùng theo tên đăng nhập (username). Hành động này là hành động duy nhất mà framework cần để hoàn tất quá trình xác thực. `UserDetailsManager` bổ sung các hành vi liên quan đến việc thêm, sửa hoặc xóa người dùng, vốn là những chức năng bắt buộc trong hầu hết các ứng dụng. Sự phân tách giữa hai giao ước này là một ví dụ tuyệt vời về nguyên lý phân tách interface (interface segregation principle) 6. Việc chia tách các interface giúp mang lại tính linh hoạt cao hơn vì framework không ép buộc bạn phải triển khai một hành vi nếu ứng dụng của bạn không cần đến nó. Nếu ứng dụng chỉ cần xác thực người dùng, thì việc triển khai giao ước `UserDetailsService` là đã đủ để đáp ứng chức năng mong muốn. Để quản lý người dùng, các thành phần `UserDetailsService` và `UserDetailsManager` cần một cách thức để biểu diễn họ.

Spring Security cung cấp giao ước `UserDetails`, bạn phải triển khai giao ước này để mô tả người dùng theo cách mà framework có thể hiểu được. Như bạn sẽ học trong chương này, trong Spring Security, một người dùng có một tập hợp các đặc quyền, chính là những hành động mà người dùng đó được phép thực hiện. Chúng ta sẽ làm việc rất nhiều với các đặc quyền này từ Chương 7 đến Chương 12 khi thảo luận về phân quyền (authorization). Nhưng hiện tại, Spring Security biểu diễn các hành động mà người dùng có thể thực hiện thông qua interface `GrantedAuthority`. Chúng ta thường gọi chúng là quyền hạn (authorities), và một người dùng sở hữu một hoặc nhiều quyền hạn như vậy. Trong Hình 3.2, bạn sẽ thấy sơ đồ biểu diễn mối quan hệ giữa các thành phần thuộc phần quản lý người dùng trong luồng xác thực.

*Hình 3.2: Các mối quan hệ phụ thuộc giữa các thành phần tham gia vào quá trình quản lý người dùng. `UserDetailsService` truy xuất thông tin chi tiết của người dùng bằng cách tìm kiếm theo tên đăng nhập. Người dùng được mô tả bởi giao ước `UserDetails`. Mỗi người dùng sở hữu một hoặc nhiều quyền hạn, được biểu diễn bởi interface `GrantedAuthority`. Để tích hợp các thao tác như tạo, xóa hoặc sửa đổi mật khẩu cho người dùng, giao ước `UserDetailsManager` (mở rộng từ `UserDetailsService`) được sử dụng để bổ sung các chức năng này.*

Việc thấu hiểu các liên kết giữa các đối tượng này trong kiến trúc Spring Security cùng các cách triển khai chúng sẽ mang lại cho bạn nhiều lựa chọn đa dạng khi phát triển ứng dụng. Bất kỳ lựa chọn nào trong số này cũng có thể là mảnh ghép hoàn hảo cho ứng dụng bạn đang xây dựng, và bạn cần phải đưa ra quyết định một cách sáng suốt. Tuy nhiên, để có thể lựa chọn, trước tiên bạn cần biết mình có những phương án nào.

## 3.2 Mô tả người dùng

Trong phần này, bạn sẽ học cách mô tả người dùng trong ứng dụng của mình sao cho Spring Security có thể hiểu được. Học cách biểu diễn người dùng và giúp framework nhận biết được họ là một bước thiết yếu trong việc xây dựng luồng xác thực. Dựa trên thông tin người dùng, ứng dụng sẽ đưa ra quyết định—liệu một lệnh gọi đến một chức năng cụ thể có được phép hay không. Để làm việc với người dùng, trước tiên bạn cần hiểu cách định nghĩa nguyên mẫu (prototype) của người dùng trong ứng dụng của mình. Phần này sẽ mô tả thông qua ví dụ cách thiết lập một bản thiết kế (blueprint) cho người dùng trong ứng dụng Spring Security. Đối với Spring Security, một định nghĩa người dùng phải đáp ứng giao ước `UserDetails`. Giao ước `UserDetails` biểu diễn người dùng theo cách hiểu của Spring Security. Lớp (class) mô tả người dùng trong ứng dụng của bạn phải triển khai interface này, và bằng cách đó, framework mới có thể hiểu được thông tin người dùng.

### 3.2.1 Mô tả người dùng bằng giao ước UserDetails

Trong phần này, bạn sẽ học cách triển khai interface `UserDetails` để mô tả người dùng trong ứng dụng của mình. Chúng ta sẽ thảo luận về các phương thức được khai báo bởi giao ước `UserDetails` để hiểu cách thức và lý do chúng ta triển khai từng phương thức đó. Đầu tiên, hãy cùng xem xét interface này như được trình bày trong đoạn mã dưới đây.

**Đoạn mã 3.1 Interface UserDetails**

```java
public interface UserDetails extends Serializable {
    String getUsername();
    String getPassword();
    Collection<? extends GrantedAuthority> getAuthorities();
    boolean isAccountNonExpired();
    boolean isAccountNonLocked();
    boolean isCredentialsNonExpired();
    boolean isEnabled();
}
```

Các phương thức `getUsername()` and `getPassword()` trả về tên đăng nhập và mật khẩu đúng như bạn mong đợi. Ứng dụng sử dụng các giá trị này trong quá trình xác thực, và đây là những chi tiết duy nhất liên quan đến việc xác thực từ giao ước này. Năm phương thức còn lại đều liên quan đến việc phân quyền cho người dùng truy cập vào tài nguyên của ứng dụng.

Nhìn chung, ứng dụng nên cho phép người dùng thực hiện một số hành động có ý nghĩa trong ngữ cảnh của ứng dụng. Ví dụ, người dùng cần có quyền đọc, ghi hoặc xóa dữ liệu. Chúng ta nói rằng một người dùng có hoặc không có đặc quyền để thực hiện một hành động, và một quyền hạn (authority) đại diện cho đặc quyền mà người dùng đó sở hữu. Chúng ta triển khai phương thức `getAuthorities()` để trả về nhóm các quyền hạn được cấp cho một người dùng.

> **LƯU Ý** Như bạn sẽ học trong Chương 6, Spring Security sử dụng các quyền hạn (authorities) để ám chỉ các đặc quyền được phân tách chi tiết (fine-grained privileges) hoặc các vai trò (roles) vốn là các nhóm đặc quyền. Để giúp bạn đọc dễ theo dõi hơn, trong cuốn sách này, tôi sẽ gọi các đặc quyền chi tiết này là các quyền hạn (authorities).

Hơn nữa, như đã thấy trong giao ước `UserDetails`, một tài khoản người dùng có thể:

- Bị hết hạn (expire)

- Bị khóa (lock)

- Bị hết hạn thông tin xác thực (credentials expire)

- Bị vô hiệu hóa (disable)

Giả sử bạn chọn triển khai các hạn chế người dùng này trong logic ứng dụng của mình. Trong trường hợp đó, bạn cần triển khai các phương thức `isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()`, và `isEnabled()`, sao cho những trạng thái cần được kích hoạt sẽ trả về `true`. Không phải ứng dụng nào cũng có các tài khoản bị hết hạn hoặc bị khóa theo những điều kiện nhất định. Nếu không cần triển khai các chức năng này trong ứng dụng, bạn chỉ cần đơn giản cho bốn phương thức này trả về `true`.

> **LƯU Ý** Tên của bốn phương thức cuối trong interface `UserDetails` nghe có vẻ hơi lạ. Có ý kiến cho rằng những tên gọi này chưa được lựa chọn một cách khôn ngoan xét về khía cạnh mã nguồn sạch (clean code) và khả năng bảo trì. Ví dụ, tên gọi `isAccountNonExpired()` trông giống như một phép phủ định kép, và thoạt nhìn, nó có thể gây ra sự bối rối. Nhưng hãy cùng phân tích kỹ cả bốn tên phương thức này. Chúng được đặt tên sao cho đều trả về `false` khi quá trình phân quyền thất bại và trả về `true` trong trường hợp ngược lại. Đây là một hướng tiếp cận đúng đắn vì tâm trí con người có xu hướng liên tưởng từ "false" với các kịch bản tiêu cực và từ "true" với các kịch bản tích cực.

### 3.2.2 Chi tiết về giao ước GrantedAuthority

Như bạn đã quan sát trong định nghĩa của interface `UserDetails` ở phần 3.2.1, các hành động được cấp phép cho một người dùng được gọi là các quyền hạn (authorities). Từ Chương 7 đến Chương 12, chúng ta sẽ viết các cấu hình phân quyền dựa trên các quyền hạn này của người dùng. Do đó, việc biết cách định nghĩa chúng là vô cùng quan trọng.

Các quyền hạn đại diện cho những gì người dùng có thể làm trong ứng dụng của bạn. Nếu không có chúng, mọi người dùng sẽ như nhau. Mặc dù có những ứng dụng đơn giản mà ở đó mọi người dùng đều bình đẳng, nhưng trong hầu hết các kịch bản thực tế, một ứng dụng sẽ định nghĩa nhiều loại người dùng khác nhau. Một ứng dụng có thể có những người dùng chỉ có thể đọc các thông tin cụ thể, trong khi những người khác cũng có thể sửa đổi dữ liệu đó. Và bạn cần làm cho ứng dụng của mình phân biệt được giữa họ, tùy thuộc vào các yêu cầu chức năng của ứng dụng, tức là các quyền hạn mà một người dùng cần có. Để mô tả các quyền hạn trong Spring Security, bạn sử dụng interface `GrantedAuthority`.

Trước khi thảo luận về việc triển khai `UserDetails`, hãy cùng tìm hiểu về interface `GrantedAuthority`. Chúng ta sử dụng interface này trong định nghĩa chi tiết của người dùng. Nó đại diện cho một đặc quyền được cấp cho người dùng. Một người dùng phải có ít nhất một quyền hạn. Dưới đây là phần triển khai định nghĩa của `GrantedAuthority`:

```java
public interface GrantedAuthority extends Serializable {
    String getAuthority();
}
```

Để tạo một quyền hạn, bạn chỉ cần tìm một cái tên cho đặc quyền đó để có thể tham chiếu lại sau này khi viết các quy tắc phân quyền. Ví dụ, một người dùng có thể đọc các bản ghi do ứng dụng quản lý hoặc xóa chúng. Bạn sẽ viết các quy tắc phân quyền dựa trên những cái tên mà bạn đặt cho các hành động này.

Trong chương này, chúng ta sẽ triển khai phương thức `getAuthority()` để trả về tên của quyền hạn dưới dạng một chuỗi `String`. Interface `GrantedAuthority` chỉ có duy nhất một phương thức trừu tượng, và trong cuốn sách này, bạn sẽ thường xuyên thấy các ví dụ sử dụng biểu thức lambda để triển khai phương thức này. Một khả năng khác là sử dụng lớp `SimpleGrantedAuthority` để tạo ra các instance của quyền hạn. Lớp `SimpleGrantedAuthority` cung cấp một cách để tạo ra các instance bất biến (immutable) có kiểu `GrantedAuthority`. Bạn cung cấp tên quyền hạn khi khởi tạo instance đó. Trong đoạn mã tiếp theo, bạn sẽ tìm thấy hai ví dụ về việc triển khai một `GrantedAuthority`. Ở đây, chúng ta sử dụng một biểu thức lambda và sau đó sử dụng lớp `SimpleGrantedAuthority`:

```java
GrantedAuthority g1 = () -> "READ";
GrantedAuthority g2 = new SimpleGrantedAuthority("READ");
```

### 3.2.3 Viết một triển khai tối giản của UserDetails

Trong phần này, bạn sẽ viết bản triển khai đầu tiên của mình cho giao ước `UserDetails`. Chúng ta bắt đầu với một triển khai cơ bản, trong đó mỗi phương thức trả về một giá trị tĩnh. Sau đó, chúng ta sẽ chuyển nó sang một phiên bản mà bạn dễ gặp hơn trong các kịch bản thực tế, phiên bản cho phép bạn có nhiều instance người dùng khác nhau. Bây giờ, khi đã biết cách triển khai các interface `UserDetails` và `GrantedAuthority`, chúng ta có thể viết định nghĩa người dùng đơn giản nhất cho một ứng dụng.

Với một lớp có tên là `DummyUser`, hãy cùng triển khai một mô tả tối giản cho người dùng, như trong đoạn mã dưới đây. Tôi sử dụng lớp này chủ yếu để minh họa việc triển khai các phương thức cho giao ước `UserDetails`. Các instance của lớp này luôn chỉ tham chiếu đến một người dùng duy nhất là "bill", người có mật khẩu là "12345" và một quyền hạn có tên là "READ".

**Đoạn mã 3.2 Lớp DummyUser**

```java
public class DummyUser implements UserDetails {

    @Override
    public String getUsername() {
        return "bill";
    }

    @Override
    public String getPassword() {
        return "12345";
    }

    // Omitted code
}
```

Lớp trong Đoạn mã 3.2 triển khai interface `UserDetails` và cần phải triển khai tất cả các phương thức của nó. Bạn sẽ tìm thấy ở đây phần triển khai của `getUsername()` và `getPassword()`. Trong ví dụ này, các phương thức này chỉ trả về một giá trị cố định cho mỗi thuộc tính.

Tiếp theo, chúng ta thêm định nghĩa cho danh sách các quyền hạn. Đoạn mã tiếp theo trình bày phần triển khai của phương thức `getAuthorities()`. Phương thức này trả về một collection chỉ chứa một triển khai duy nhất của interface `GrantedAuthority`.

**Đoạn mã 3.3 Triển khai phương thức getAuthorities()**

```java
public class DummyUser implements UserDetails {
    // Omitted code

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(() -> "READ");
    }

    // Omitted code
}
```

Cuối cùng, bạn phải thêm triển khai cho bốn phương thức cuối của interface `UserDetails`. Đối với lớp `DummyUser`, các phương thức này luôn trả về `true`, nghĩa là người dùng luôn hoạt động và có thể sử dụng được. Bạn có thể tìm thấy các ví dụ trong đoạn mã dưới đây.

**Đoạn mã 3.4 Triển khai bốn phương thức cuối của interface UserDetails**

```java
public class DummyUser implements UserDetails {
    // Omitted code

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // Omitted code
}
```

Tất nhiên, việc triển khai tối giản này đồng nghĩa với việc mọi instance của lớp đều biểu diễn cùng một người dùng. Đây là một điểm khởi đầu tốt để hiểu về giao ước, nhưng không phải là thứ bạn sẽ làm trong một ứng dụng thực tế. Đối với một ứng dụng thực tế, bạn nên tạo một lớp mà bạn có thể sử dụng để tạo ra các instance biểu diễn các người dùng khác nhau. Trong trường hợp này, định nghĩa của bạn ít nhất sẽ có tên đăng nhập và mật khẩu làm các thuộc tính trong lớp, như được trình bày trong đoạn mã tiếp theo.

**Đoạn mã 3.5 Một triển khai thực tế hơn của interface UserDetails**

```java
public class SimpleUser implements UserDetails {

    private final String username;
    private final String password;

    public SimpleUser(String username, String password) {
        this.username = username;
        this.password = password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    // Omitted code
}
```

### 3.2.4 Sử dụng một builder để tạo các instance kiểu UserDetails

Một số ứng dụng có cấu trúc đơn giản và không cần đến một triển khai tùy chỉnh của interface `UserDetails`. Trong phần này, chúng ta sẽ xem xét việc sử dụng một lớp dựng (builder class) do Spring Security cung cấp để tạo ra các instance người dùng đơn giản. Thay vì khai báo thêm một lớp trong ứng dụng của mình, bạn có thể nhanh chóng có được một instance biểu diễn người dùng bằng cách sử dụng lớp dựng `User`.

Lớp `User` thuộc package `org.springframework.security.core.userdetails` là một cách đơn giản để xây dựng các instance kiểu `UserDetails`. Sử dụng lớp này, bạn có thể tạo ra các instance bất biến của `UserDetails`. Bạn cần cung cấp ít nhất một tên đăng nhập và một mật khẩu, và tên đăng nhập không được là một chuỗi rỗng. Đoạn mã dưới đây minh họa cách sử dụng lớp dựng này. Xây dựng người dùng theo cách này, bạn không cần phải có một triển khai tùy chỉnh cho giao ước `UserDetails`.

**Đoạn mã 3.6 Khởi tạo một người dùng bằng lớp dựng User**

```java
UserDetails u = User.withUsername("bill")
    .password("12345")
    .authorities("read", "write")
    .accountExpired(false)
    .disabled(true)
    .build();
```

Lấy đoạn mã trước làm ví dụ, hãy cùng đi sâu hơn vào cấu trúc của lớp dựng `User`. Phương thức `User.withUsername(String username)` trả về một instance của lớp dựng `UserBuilder` được lồng bên trong lớp `User`. Một cách khác để tạo ra lớp dựng này là bắt đầu từ một instance `UserDetails` khác. Trong Đoạn mã 3.7, dòng đầu tiên khởi dựng một `UserBuilder`, bắt đầu bằng tên đăng nhập được cung cấp dưới dạng một chuỗi. Sau đó, chúng ta sẽ minh họa cách tạo ra một lớp dựng bắt đầu bằng một instance `UserDetails` đã tồn tại sẵn.

**Đoạn mã 3.7 Khởi tạo instance User.UserBuilder**

```java
User.UserBuilder builder1 = User.withUsername("bill");
UserDetails u1 = builder1
    .password("12345")
    .authorities("read", "write")
    .passwordEncoder(p -> encode(p))
    .accountExpired(false)
    .disabled(true)
    .build();

User.UserBuilder builder2 = User.withUserDetails(u);
UserDetails u2 = builder2.build();
```

Bạn có thể thấy với bất kỳ lớp dựng nào được định nghĩa trong Đoạn mã 3.7, chúng ta hoàn toàn có thể sử dụng lớp dựng đó để có được một người dùng được biểu diễn bởi giao ước `UserDetails`. Ở cuối chuỗi xử lý (build pipeline), bạn gọi phương thức `build()`. Phương thức này sẽ áp dụng hàm được định nghĩa để mã hóa mật khẩu nếu bạn cung cấp, khởi tạo instance của `UserDetails` và trả nó về.

> **LƯU Ý** Lưu ý rằng bộ mã hóa mật khẩu ở đây được cung cấp dưới dạng một `Function<String, String>` chứ không phải dưới dạng interface `PasswordEncoder` do Spring Security cung cấp. Trách nhiệm duy nhất của hàm này là chuyển đổi một mật khẩu sang một kiểu mã hóa nhất định. Trong phần tiếp theo, chúng ta sẽ thảo luận chi tiết về giao ước `PasswordEncoder` của Spring Security mà chúng ta đã sử dụng ở Chương 2. Chúng ta sẽ thảo luận chi tiết hơn về giao ước `PasswordEncoder` trong Chương 4.

### 3.2.5 Kết hợp nhiều trách nhiệm liên quan đến người dùng

Trong phần trước, bạn đã học cách triển khai interface `UserDetails`. Trong các kịch bản thực tế, mọi thứ thường phức tạp hơn thế nhiều. Trong hầu hết các trường hợp, bạn sẽ thấy có nhiều trách nhiệm liên quan đến một người dùng. Và nếu bạn lưu trữ người dùng trong một cơ sở dữ liệu, thì trong ứng dụng, bạn cũng sẽ cần một lớp để đại diện cho thực thể lưu trữ (persistence entity). Hoặc nếu bạn truy xuất người dùng thông qua một dịch vụ web (web service) từ một hệ thống khác, thì có lẽ bạn sẽ cần một đối tượng chuyển giao dữ liệu (data transfer object - DTO) để biểu diễn các instance người dùng đó. Giả định trường hợp đầu tiên, một trường hợp đơn giản nhưng cũng rất điển hình, chúng ta hãy xem xét việc có một bảng trong cơ sở dữ liệu SQL nơi chúng ta lưu trữ người dùng. Để làm cho ví dụ ngắn gọn hơn, chúng ta chỉ cấp cho mỗi người dùng một quyền hạn duy nhất. Đoạn mã dưới đây trình bày lớp thực thể (entity class) ánh xạ với bảng đó.

**Đoạn mã 3.8 Định nghĩa lớp thực thể JPA User**

```java
@Entity
public class User {

    @Id
    private Long id;
    private String username;
    private String password;
    private String authority;

    // Omitted getters and setters
}
```

Nếu bạn bắt chính lớp đó triển khai luôn cả giao ước của Spring Security dành cho thông tin người dùng, lớp này sẽ trở nên phức tạp hơn rất nhiều. Bạn nghĩ sao về việc mã nguồn sẽ trông như thế nào trong đoạn mã tiếp theo? Theo quan điểm của tôi, đó là một đống hỗn độn. Tôi sẽ bị lạc lối trong đó mất.

**Đoạn mã 3.9 Lớp User gánh vác hai trách nhiệm**

```java
@Entity
public class User implements UserDetails {

    @Id
    private int id;
    private String username;
    private String password;
    private String authority;

    @Override
    public String getUsername() {
        return this.username;
    }
    @Override
    public String getPassword() {
        return this.password;
    }

    public String getAuthority() {
        return this.authority;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(() -> authority);
    }

    // Omitted code
}
```

Lớp này chứa các annotation của JPA, các getter và setter, trong đó cả `getUsername()` và `getPassword()` đều ghi đè các phương thức trong giao ước `UserDetails`. Nó có một phương thức `getAuthority()` trả về một `String`, cũng như một phương thức `getAuthorities()` trả về một `Collection`. Phương thức `getAuthority()` chỉ là một getter thông thường trong lớp, trong khi `getAuthorities()` lại triển khai phương thức trong interface `UserDetails`. Mọi thứ thậm chí còn phức tạp hơn khi thêm các mối quan hệ với các thực thể khác. Một lần nữa, đoạn mã này không hề thân thiện một chút nào!

Làm thế nào chúng ta có thể viết mã nguồn này sạch sẽ hơn? Gốc rễ của khía cạnh rối rắm trong ví dụ mã nguồn trước đó là việc trộn lẫn hai trách nhiệm. Mặc dù đúng là bạn cần cả hai trong ứng dụng, nhưng trong trường hợp này, không ai bắt buộc bạn phải đặt chúng vào cùng một lớp. Hãy thử tách biệt chúng bằng cách định nghĩa một lớp riêng biệt có tên là `SecurityUser`, lớp này sẽ đóng vai trò tương thích (adapt) với lớp `User`. Như đoạn mã tiếp theo trình bày, lớp `SecurityUser` triển khai giao ước `UserDetails` và sử dụng nó để tích hợp người dùng của chúng ta vào kiến trúc của Spring Security. Lớp `User` giờ đây chỉ còn giữ lại duy nhất trách nhiệm làm thực thể JPA của nó.

**Đoạn mã 3.10 Triển khai lớp User chỉ với vai trò thực thể JPA**

```java
@Entity
public class User {

    @Id
    private int id;
    private String username;
    private String password;
    private String authority;

    // Omitted getters and setters
}
```

Lớp `User` trong Đoạn mã 3.10 chỉ còn giữ lại duy nhất trách nhiệm làm thực thể JPA của nó, và do đó, nó trở nên dễ đọc hơn nhiều. Khi đọc đoạn mã này, giờ đây bạn có thể tập trung hoàn toàn vào các chi tiết liên quan đến việc lưu trữ dữ liệu, vốn là những thứ không quan trọng dưới góc nhìn của Spring Security. Trong đoạn mã tiếp theo, chúng ta triển khai lớp `SecurityUser` để bao bọc (wrap) thực thể `User`.

**Đoạn mã 3.11 Lớp SecurityUser triển khai giao ước UserDetails**

```java
public class SecurityUser implements UserDetails {

    private final User user;

    public SecurityUser(User user) {
        this.user = user;
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(() -> user.getAuthority());
    }

    // Omitted code
}
```

Như bạn có thể quan sát, chúng ta sử dụng lớp `SecurityUser` chỉ để ánh xạ thông tin chi tiết của người dùng trong hệ thống sang giao ước `UserDetails` mà Spring Security hiểu được. Để đánh dấu thực tế rằng `SecurityUser` sẽ không có ý nghĩa gì nếu thiếu một thực thể `User`, chúng ta khai báo trường này là `final`. Bạn phải cung cấp người dùng thông qua constructor. Lớp `SecurityUser` tương thích với lớp thực thể `User` và bổ sung thêm mã nguồn cần thiết liên quan đến giao ước của Spring Security mà không trộn lẫn mã nguồn đó vào một thực thể JPA, nhờ đó tránh được việc phải thực hiện nhiều tác vụ khác nhau cùng lúc.

> **LƯU Ý** Bạn có thể tìm thấy các cách tiếp cận khác nhau để tách biệt hai trách nhiệm này. Tôi không muốn nói rằng cách tiếp cận tôi trình bày trong phần này là tốt nhất hoặc duy nhất. Thông thường, cách bạn chọn để triển khai thiết kế lớp sẽ khác nhau rất nhiều tùy thuộc vào từng trường hợp cụ thể. Tuy nhiên, ý tưởng chủ đạo vẫn là: tránh trộn lẫn các trách nhiệm và cố gắng viết mã nguồn của bạn sao cho các thành phần tách biệt (decoupled) nhất có thể để tăng khả năng bảo trì cho ứng dụng của bạn.

## 3.3 Hướng dẫn Spring Security cách quản lý người dùng

Trong phần trước, bạn đã triển khai giao ước `UserDetails` để mô tả người dùng sao cho Spring Security có thể hiểu được họ. Nhưng Spring Security quản lý người dùng như thế nào? Họ được lấy từ đâu ra khi so sánh thông tin xác thực, và làm thế nào bạn có thể thêm người dùng mới hoặc thay đổi những người dùng hiện có? Trong Chương 2, bạn đã biết rằng framework định nghĩa một thành phần cụ thể mà quá trình xác thực sẽ ủy quyền quản lý người dùng cho nó: đó là instance `UserDetailsService`. Chúng ta thậm chí đã định nghĩa một `UserDetailsService` để ghi đè triển khai mặc định do Spring Boot cung cấp.

Trong phần này, chúng ta sẽ thử nghiệm các cách khác nhau để triển khai lớp `UserDetailsService`. Bạn sẽ hiểu cách thức hoạt động của việc quản lý người dùng bằng cách triển khai trách nhiệm được mô tả bởi giao ước `UserDetailsService` trong ví dụ của chúng ta. Sau đó, bạn sẽ tìm hiểu cách interface `UserDetailsManager` bổ sung thêm nhiều hành vi vào giao ước được định nghĩa bởi `UserDetailsService`. Ở cuối phần này, chúng ta sẽ sử dụng các triển khai có sẵn của interface `UserDetailsManager` do Spring Security cung cấp. Chúng ta sẽ viết một dự án ví dụ sử dụng một trong những triển khai nổi tiếng nhất của Spring Security, lớp `JdbcUserDetailsManager`. Sau khi học xong phần này, bạn sẽ biết cách chỉ ra cho Spring Security nơi tìm kiếm người dùng, đây là một phần thiết yếu trong luồng xác thực.

### 3.3.1 Tìm hiểu giao ước UserDetailsService

Trong phần này, bạn sẽ tìm hiểu về định nghĩa của interface `UserDetailsService`. Trước khi hiểu cách thức và lý do triển khai nó, trước tiên bạn phải nắm được giao ước này. Đã đến lúc đi vào chi tiết hơn về `UserDetailsService` và cách làm việc với các triển khai của thành phần này. Interface `UserDetailsService` chỉ chứa duy nhất một phương thức như sau:

```java
public interface UserDetailsService {
    UserDetails loadUserByUsername(String username)
        throws UsernameNotFoundException;
}
```

Triển khai xác thực sẽ gọi phương thức `loadUserByUsername(String username)` để lấy thông tin chi tiết của một người dùng dựa trên tên đăng nhập được cung cấp (Hình 3.3). Tên đăng nhập tất nhiên được coi là duy nhất. Người dùng được phương thức này trả về là một triển khai của giao ước `UserDetails`. Nếu tên đăng nhập không tồn tại, phương thức sẽ ném ra ngoại lệ `UsernameNotFoundException`.

> **LƯU Ý** Ngoại lệ `UsernameNotFoundException` là một `RuntimeException`. Mệnh đề `throws` trong interface `UserDetailsService` chỉ nhằm mục đích tài liệu hóa. `UsernameNotFoundException` kế thừa trực tiếp từ kiểu `AuthenticationException`, đây là lớp cha của tất cả các ngoại lệ liên quan đến quá trình xác thực. `AuthenticationException` tiếp tục kế thừa lớp `RuntimeException`.

*Hình 3.3: `AuthenticationProvider` là thành phần chịu trách nhiệm thực thi quá trình xác thực và sử dụng `UserDetailsService` để thu thập thông tin chi tiết của người dùng. Nó gọi phương thức `loadUserByUsername(String username)` để định vị người dùng dựa trên tên đăng nhập của họ.*

### 3.3.2 Triển khai giao ước UserDetailsService

Trong phần này, chúng ta sẽ làm việc trên một ví dụ thực tế để minh họa việc triển khai `UserDetailsService`. Ứng dụng của bạn quản lý các chi tiết về thông tin xác thực và các khía cạnh khác của người dùng. Những thông tin này có thể được lưu trữ trong một cơ sở dữ liệu hoặc được xử lý bởi một hệ thống khác mà bạn truy cập thông qua một dịch vụ web hoặc bằng các phương tiện khác (Hình 3.3). Bất kể điều này diễn ra như thế nào trong hệ thống của bạn, điều duy nhất mà Spring Security cần ở bạn là một triển khai để truy xuất người dùng theo tên đăng nhập.

Trong ví dụ tiếp theo, chúng ta sẽ viết một `UserDetailsService` quản lý một danh sách người dùng trong bộ nhớ (in-memory). Trong Chương 2, bạn đã sử dụng một triển khai có sẵn thực hiện điều tương tự, đó là `InMemoryUserDetailsManager`. Vì bạn đã quen thuộc với cách hoạt động của triển khai này, tôi chọn một chức năng tương tự nhưng lần này là tự chúng ta triển khai. Chúng ta cung cấp một danh sách người dùng khi tạo một instance của lớp `UserDetailsService` của riêng mình. Bạn có thể tìm thấy ví dụ này trong dự án `ssia-ch3-ex1`. Trong package có tên là `model`, chúng ta định nghĩa `UserDetails` như được trình bày trong đoạn mã dưới đây.

**Đoạn mã 3.12 Triển khai interface UserDetails**

```java
public class User implements UserDetails {

    private final String username;
    private final String password;
    private final String authority;

    public User(String username, String password, String authority) {
        this.username = username;
        this.password = password;
        this.authority = authority;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(() -> authority);
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    @Override
    public boolean isEnabled() {
        return true;
    }
}
```

Trong package có tên là `services`, chúng ta tạo một lớp gọi là `InMemoryUserDetailsService`. Đoạn mã tiếp theo trình bày cách chúng ta triển khai lớp này.

**Đoạn mã 3.13 Triển khai interface UserDetailsService**

```java
public class InMemoryUserDetailsService implements UserDetailsService {

    private final List<UserDetails> users;

    public InMemoryUserDetailsService(List<UserDetails> users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        return users.stream()
            .filter(u -> u.getUsername().equals(username))
            .findFirst()
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
```

Phương thức `loadUserByUsername(String username)` tìm kiếm trong danh sách người dùng theo tên đăng nhập được cung cấp và trả về instance `UserDetails` mong muốn. Nếu không có instance nào có tên đăng nhập đó, nó sẽ ném ra ngoại lệ `UsernameNotFoundException`. Giờ đây chúng ta có thể sử dụng triển khai này làm `UserDetailsService` của mình. Đoạn mã tiếp theo trình bày cách chúng ta thêm nó dưới dạng một bean trong lớp cấu hình và đăng ký một người dùng bên trong đó.

**Đoạn mã 3.14 UserDetailsService được đăng ký dưới dạng một bean trong lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails u = new User("john", "12345", "read");
        List<UserDetails> users = List.of(u);
        return new InMemoryUserDetailsService(users);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Cuối cùng, chúng ta tạo một endpoint đơn giản và kiểm tra kết quả triển khai. Đoạn mã dưới đây định nghĩa endpoint này.

**Đoạn mã 3.15 Định nghĩa endpoint được sử dụng để kiểm tra việc triển khai**

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }
}
```

Khi gọi endpoint này bằng cách sử dụng cURL, chúng ta quan sát thấy rằng đối với người dùng `john` với mật khẩu `12345`, chúng ta nhận về phản hồi HTTP 200 OK. Nếu sử dụng thông tin khác, ứng dụng sẽ trả về phản hồi 401 Unauthorized:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Thân phản hồi (response body) trả về là:

```text
Hello!
```

### 3.3.3 Triển khai giao ước UserDetailsManager

Trong phần này, chúng ta sẽ thảo luận về việc sử dụng và triển khai interface `UserDetailsManager`. Interface này mở rộng và bổ sung thêm nhiều phương thức cho giao ước `UserDetailsService`. Spring Security cần giao ước `UserDetailsService` để thực hiện xác thực. Nhưng nhìn chung, trong các ứng dụng, nhu cầu quản lý người dùng cũng xuất hiện. Phần lớn thời gian, một ứng dụng cần có khả năng thêm người dùng mới hoặc xóa những người dùng hiện có. Trong trường hợp này, chúng ta triển khai một interface đặc thù hơn do Spring Security định nghĩa là `UserDetailsManager`. Nó mở rộng `UserDetailsService` và bổ sung thêm các thao tác mà chúng ta cần triển khai:

```java
public interface UserDetailsManager extends UserDetailsService {
    void createUser(UserDetails user);
    void updateUser(UserDetails user);
    void deleteUser(String username);
    void changePassword(String oldPassword, String newPassword);
    boolean userExists(String username);
}
```

Đối tượng `InMemoryUserDetailsManager` mà chúng ta đã sử dụng ở Chương 2 trên thực tế chính là một `UserDetailsManager`. Ở thời điểm đó, chúng ta mới chỉ xem xét các đặc tính `UserDetailsService` của nó. Dự án `ssia-ch3-ex2` đi kèm với ví dụ trong phần này.

**Sử dụng JdbcUserDetailsManager để quản lý người dùng**

Bên cạnh `InMemoryUserDetailsManager`, chúng ta thường sử dụng một triển khai `UserDetailsManager` khác là `JdbcUserDetailsManager`. Lớp `JdbcUserDetailsManager` quản lý người dùng trong một cơ sở dữ liệu SQL. Nó kết nối trực tiếp đến cơ sở dữ liệu thông qua JDBC. Bằng cách này, `JdbcUserDetailsManager` độc lập với bất kỳ framework hoặc đặc tả (specification) nào khác liên quan đến kết nối cơ sở dữ liệu. Để hiểu cách hoạt động của `JdbcUserDetailsManager`, tốt nhất là bạn nên đưa nó vào hoạt động thực tế bằng một ví dụ. Trong ví dụ sau, bạn sẽ triển khai một ứng dụng quản lý người dùng trong cơ sở dữ liệu MySQL bằng cách sử dụng `JdbcUserDetailsManager`. Hình 3.4 cung cấp một cái nhìn tổng quan về vị trí của triển khai `JdbcUserDetailsManager` trong luồng xác thực.

*Hình 3.4: Luồng xác thực của Spring Security. Ở đây chúng ta sử dụng một `JdbcUserDetailsManager` làm thành phần `UserDetailsService`. `JdbcUserDetailsManager` sử dụng một cơ sở dữ liệu để quản lý người dùng.*

Bạn sẽ bắt đầu phát triển ứng dụng demo sử dụng `JdbcUserDetailsManager` bằng cách tạo một cơ sở dữ liệu và hai bảng. Trong trường hợp của chúng ta, chúng ta đặt tên cơ sở dữ liệu là `spring`, một bảng tên là `users` và bảng còn lại tên là `authorities`. Đây là các tên bảng mặc định mà `JdbcUserDetailsManager` nhận biết. Như bạn sẽ học ở cuối phần này, triển khai `JdbcUserDetailsManager` rất linh hoạt và cho phép bạn ghi đè các tên mặc định này nếu muốn. Mục đích của bảng `users` là để lưu giữ các bản ghi của người dùng. Triển khai `JdbcUserDetailsManager` mong đợi ba cột trong bảng `users`—gồm `username`, `password`, và `enabled`—cột cuối cùng này có thể được sử dụng để vô hiệu hóa người dùng.

Bạn có thể chọn tự mình tạo cơ sở dữ liệu và cấu trúc của nó bằng cách sử dụng công cụ dòng lệnh của hệ quản trị cơ sở dữ liệu (DBMS) hoặc một ứng dụng client. Ví dụ, đối với MySQL, bạn có thể chọn sử dụng MySQL Workbench để thực hiện việc này. Nhưng cách dễ dàng nhất là để chính Spring Boot tự động chạy các script cho bạn. Để thực hiện việc này, bạn chỉ cần thêm hai tệp tin nữa vào thư mục resources của dự án: `schema.sql` và `data.sql`. Trong tệp `schema.sql`, bạn thêm các câu truy vấn liên quan đến cấu trúc cơ sở dữ liệu, chẳng hạn như tạo, thay đổi hoặc xóa bảng. Trong tệp `data.sql`, bạn thêm các câu truy vấn làm việc với dữ liệu bên trong các bảng, chẳng hạn như `INSERT`, `UPDATE`, hoặc `DELETE`. Spring Boot sẽ tự động chạy các tệp này cho bạn khi khởi động ứng dụng. Một giải pháp đơn giản hơn để xây dựng các ví dụ cần cơ sở dữ liệu là sử dụng cơ sở dữ liệu trong bộ nhớ H2. Bằng cách này, bạn không cần phải cài đặt một giải pháp DBMS độc lập.

> **LƯU Ý** Nếu muốn, bạn cũng có thể chọn đi theo hướng sử dụng H2 (như tôi làm trong dự án `ssia-ch3-ex2`) khi phát triển các ứng dụng được trình bày trong cuốn sách này. Tuy nhiên, trong hầu hết các trường hợp, tôi chọn triển khai các ví dụ với một DBMS bên ngoài để làm rõ rằng đó là một thành phần bên ngoài hệ thống và tránh gây ra sự nhầm lẫn theo cách này.

Bạn sử dụng mã nguồn trong đoạn mã dưới đây để tạo bảng `users` trên một MySQL server. Bạn có thể thêm script này vào tệp `schema.sql` trong dự án Spring Boot của mình.

**Đoạn mã 3.16 Câu truy vấn SQL để tạo bảng users**

```sql
CREATE TABLE IF NOT EXISTS `spring`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `enabled` INT NOT NULL,
  PRIMARY KEY (`id`)
);
```

Bảng `authorities` lưu trữ các quyền hạn của từng người dùng. Mỗi bản ghi lưu trữ một tên đăng nhập và một quyền hạn được cấp cho người dùng có tên đăng nhập đó.

**Đoạn mã 3.17 Câu truy vấn SQL để tạo bảng authorities**

```sql
CREATE TABLE IF NOT EXISTS `spring`.`authorities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `authority` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`)
);
```

> **LƯU Ý** Để cho đơn giản và giúp bạn tập trung vào các cấu hình Spring Security mà chúng ta thảo luận, trong các ví dụ đi kèm với cuốn sách này, tôi sẽ bỏ qua các định nghĩa về chỉ mục (index) hoặc khóa ngoại (foreign key).

Để đảm bảo bạn có một người dùng phục vụ cho việc kiểm thử, hãy chèn một bản ghi vào mỗi bảng. Bạn có thể thêm các câu truy vấn này vào tệp `data.sql` trong thư mục resources của dự án Spring Boot:

```sql
INSERT INTO `spring`.`authorities`
(username, authority)
VALUES
('john', 'write');

INSERT INTO `spring`.`users`
(username, password, enabled)
VALUES
('john', '12345', '1');
```

Đối với dự án của mình, bạn cần thêm ít nhất các dependency được nêu ra trong đoạn mã dưới đây. Hãy kiểm tra tệp `pom.xml` của bạn để đảm bảo đã thêm các dependency này.

**Đoạn mã 3.18 Các dependency cần thiết để phát triển dự án ví dụ**

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
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
</dependency>
```

> **LƯU Ý** Trong các ví dụ của mình, bạn có thể sử dụng bất kỳ công nghệ cơ sở dữ liệu SQL nào miễn là bạn thêm đúng driver JDBC tương ứng vào phần dependency.

Hãy nhớ rằng, bạn cần thêm driver JDBC tùy theo công nghệ cơ sở dữ liệu mà bạn sử dụng. Ví dụ, nếu sử dụng MySQL, bạn cần thêm dependency cho driver MySQL như được trình bày trong đoạn mã tiếp theo:

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```

Bạn có thể cấu hình một datasource (nguồn dữ liệu) trong tệp `application.properties` của dự án hoặc dưới dạng một bean riêng biệt. Nếu chọn sử dụng tệp `application.properties`, bạn cần thêm các dòng sau vào tệp đó:

```properties
spring.datasource.url=jdbc:h2:mem:ssia
spring.datasource.username=sa
spring.datasource.password=
spring.sql.init.mode=always
```

Trong lớp cấu hình của dự án, bạn định nghĩa `UserDetailsService` và `PasswordEncoder`. `JdbcUserDetailsManager` cần `DataSource` để kết nối đến cơ sở dữ liệu. Data source có thể được tiêm tự động (autowired) thông qua một tham số của phương thức (như được trình bày trong đoạn mã tiếp theo) hoặc thông qua một thuộc tính của lớp.

**Đoạn mã 3.19 Đăng ký JdbcUserDetailsManager trong lớp cấu hình**

```java
@Configuration
public class ProjectConfig {

    @Bean
    public UserDetailsService userDetailsService(DataSource dataSource) {
        return new JdbcUserDetailsManager(dataSource);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

Giờ đây, để truy cập bất kỳ endpoint nào của ứng dụng, bạn cần sử dụng phương thức xác thực HTTP Basic với một trong những người dùng được lưu trữ trong cơ sở dữ liệu. Để chứng minh điều này, chúng ta tạo một endpoint mới như được trình bày trong đoạn mã dưới đây, sau đó gọi nó bằng cURL.

**Đoạn mã 3.20 Endpoint kiểm thử để xác minh việc triển khai**

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello!";
    }
}
```

Trong đoạn mã tiếp theo, bạn sẽ thấy kết quả khi gọi endpoint với tên đăng nhập và mật khẩu chính xác:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Phản hồi trả về cho cuộc gọi là:

```text
Hello!
```

`JdbcUserDetailsManager` cũng cho phép bạn cấu hình các câu truy vấn được sử dụng. Trong ví dụ trước, chúng ta đã đảm bảo sử dụng chính xác tên của các bảng và các cột như triển khai của `JdbcUserDetailsManager` mong đợi. Tuy nhiên, có thể các tên này không phải là lựa chọn tốt nhất cho ứng dụng của bạn. Đoạn mã tiếp theo trình bày cách ghi đè các câu truy vấn dành cho `JdbcUserDetailsManager`.

**Đoạn mã 3.21 Thay đổi các truy vấn của JdbcUserDetailsManager để tìm kiếm người dùng**

```java
@Bean
public UserDetailsService userDetailsService(DataSource dataSource) {
    String usersByUsernameQuery =
        "select username, password, enabled from users where username = ?";
    String authsByUserQuery =
        "select username, authority from spring.authorities where username = ?";

    var userDetailsManager = new JdbcUserDetailsManager(dataSource);
    userDetailsManager.setUsersByUsernameQuery(usersByUsernameQuery);
    userDetailsManager.setAuthoritiesByUsernameQuery(authsByUserQuery);
    return userDetailsManager;
}
```

Bằng cách tương tự, chúng ta can thiệp để thay đổi tất cả các câu truy vấn được sử dụng bởi triển khai `JdbcUserDetailsManager`.

> **BÀI TẬP** Hãy viết một ứng dụng tương tự, trong đó bạn đặt tên cho các bảng và các cột trong cơ sở dữ liệu khác đi. Ghi đè các câu truy vấn cho triển khai `JdbcUserDetailsManager` (ví dụ: cơ chế xác thực sẽ hoạt động với cấu trúc bảng mới). Dự án `ssia-ch3-ex2` cung cấp một giải pháp khả thi.

**Sử dụng LdapUserDetailsManager để quản lý người dùng**

Spring Security cũng cung cấp một triển khai của `UserDetailsManager` dành cho LDAP. Ngay cả khi nó ít phổ biến hơn so với `JdbcUserDetailsManager`, bạn vẫn có thể tin dùng nó nếu cần tích hợp với một hệ thống LDAP để quản lý người dùng. Trong dự án `ssia-ch3-ex3`, bạn có thể tìm thấy một phần minh họa đơn giản về việc sử dụng `LdapUserDetailsManager`. Vì tôi không thể sử dụng một LDAP server thực tế cho phần minh họa này, tôi đã thiết lập một server nhúng (embedded server) ngay trong ứng dụng Spring Boot của mình. Để thiết lập LDAP server nhúng này, tôi đã định nghĩa một tệp định dạng trao đổi dữ liệu LDAP (LDAP Data Interchange Format - LDIF) đơn giản. Đoạn mã dưới đây trình bày nội dung của tệp LDIF của tôi.

**Đoạn mã 3.22 Định nghĩa tệp LDIF**

```text
dn: dc=springframework,dc=org
objectclass: top
objectclass: domain
objectclass: extensibleObject
dc: springframework

dn: ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: groups

dn: uid=john,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: John
sn: John
uid: john
userPassword: 12345
```

Trong tệp LDIF, tôi chỉ thêm duy nhất một người dùng mà chúng ta cần sử dụng để kiểm thử hành vi của ứng dụng ở cuối ví dụ này. Chúng ta có thể thêm tệp LDIF trực tiếp vào thư mục resources. Bằng cách này, nó sẽ tự động nằm trong classpath, giúp chúng ta có thể dễ dàng tham chiếu đến nó sau này. Tôi đặt tên cho tệp LDIF này là `server.ldif`. Để làm việc với LDAP và cho phép Spring Boot khởi động một LDAP server nhúng, bạn cần thêm dependency sau vào tệp `pom.xml` của mình:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-ldap</artifactId>
</dependency>
```

com.unboundid unboundid-ldapsdk

Trong tệp `application.properties`, bạn cũng cần thêm các cấu hình cho LDAP server nhúng, như được trình bày trong đoạn mã dưới đây. Các giá trị mà ứng dụng cần để khởi chạy LDAP server nhúng bao gồm vị trí của tệp LDIF, một cổng cho LDAP server và các giá trị nhãn thành phần miền cơ sở (base domain component - DN):

```properties
spring.ldap.embedded.ldif=classpath:server.ldif
spring.ldap.embedded.base-dn=dc=springframework,dc=org
spring.ldap.embedded.port=33389
```

Khi đã có một LDAP server phục vụ cho việc xác thực, bạn có thể cấu hình ứng dụng của mình để sử dụng nó. Đoạn mã tiếp theo trình bày cách cấu hình `LdapUserDetailsManager` nhằm cho phép ứng dụng của bạn xác thực người dùng thông qua LDAP server.

**Đoạn mã 3.23 Định nghĩa LdapUserDetailsManager trong tệp cấu hình**

```java
@Configuration
public class ProjectConfig {

 @Bean
 public UserDetailsService userDetailsService() {
 var cs = new DefaultSpringSecurityContextSource(
"ldap://127.0.0.1:33389/dc=springframework,dc=org");
 cs.afterPropertiesSet();
 var manager = new LdapUserDetailsManager(cs);
 manager.setUsernameMapper(
new DefaultLdapUsernameToDnMapper("ou=groups", "uid"));
 manager.setGroupSearchBase("ou=groups");
 return manager;
 }

 @Bean
 public PasswordEncoder passwordEncoder() {
 return NoOpPasswordEncoder.getInstance();
 }
}
```

Chúng ta hãy cùng tạo một endpoint đơn giản để kiểm thử cấu hình bảo mật này. Tôi đã thêm một lớp controller như được trình bày trong đoạn mã tiếp theo:

```java
@RestController
public class HelloController {

 @GetMapping("/hello")
 public String hello() {
 return "Hello!";
 }
}
```

Bây giờ hãy khởi động ứng dụng và gọi endpoint `/hello`. Bạn cần xác thực với người dùng `john` nếu muốn ứng dụng cho phép bạn gọi endpoint này. Đoạn mã tiếp theo hiển thị kết quả của việc gọi endpoint bằng cURL:

```bash
curl -u john:12345 http://localhost:8080/hello
```

Phản hồi trả về cho cuộc gọi là

```text
Hello!
```

## Tóm tắt

- Interface `UserDetails` là giao ước bạn sử dụng để mô tả một người dùng trong Spring Security. Interface `UserDetailsService` là giao ước mà Spring Security mong đợi bạn triển khai trong kiến trúc xác thực để mô tả cách thức ứng dụng lấy thông tin chi tiết của người dùng.

- Interface `UserDetailsManager` mở rộng `UserDetailsService` và bổ sung thêm các hành vi liên quan đến việc tạo, thay đổi hoặc xóa người dùng.

- Spring Security cung cấp một vài triển khai của giao ước `UserDetailsManager`. Trong số đó có `InMemoryUserDetailsManager`, `JdbcUserDetailsManager`, và `LdapUserDetailsManager`. Lớp `JdbcUserDetailsManager` có ưu điểm là sử dụng trực tiếp JDBC và không khóa chặt ứng dụng vào các framework khác.
