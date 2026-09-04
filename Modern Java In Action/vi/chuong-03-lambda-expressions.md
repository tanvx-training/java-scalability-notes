# Chương 3. Lambda expressions

> **Nội dung chương này**
>
> - Tổng quan nhanh về lambda
> - Dùng lambda ở đâu và như thế nào
> - Execute-around pattern
> - Functional interface, type inference
> - Method reference
> - Kết hợp (composing) các lambda

Ở chương trước, bạn đã thấy rằng việc truyền code bằng behavior parameterization (tham số hoá hành vi) rất hữu ích để đối phó với những thay đổi yêu cầu liên tục trong code của bạn. Nó cho phép bạn định nghĩa một khối code biểu diễn một hành vi rồi truyền khối code đó đi khắp nơi. Bạn có thể quyết định chạy khối code đó khi một sự kiện nào đó xảy ra (ví dụ, khi người dùng nhấn một nút) hoặc tại một số điểm nhất định trong một thuật toán (ví dụ, một predicate như “chỉ những quả táo nặng hơn 150 g” trong thuật toán lọc, hoặc phép so sánh tuỳ biến trong bài toán sắp xếp). Nói chung, dùng khái niệm này bạn có thể viết code linh hoạt hơn và tái sử dụng được nhiều hơn.

Nhưng bạn cũng đã thấy rằng dùng anonymous class để biểu diễn các hành vi khác nhau thì không mấy hài lòng. Cách viết đó dài dòng, điều này không khuyến khích lập trình viên áp dụng behavior parameterization trong thực tế. Trong chương này, chúng tôi sẽ giới thiệu cho bạn một tính năng mới trong Java 8 giải quyết vấn đề này: lambda expression. Chúng cho phép bạn biểu diễn một hành vi hoặc truyền code đi một cách ngắn gọn. Tạm thời, bạn có thể coi lambda expression như những hàm vô danh (anonymous function), tức là những phương thức không có tên khai báo, nhưng cũng có thể được truyền làm đối số cho một phương thức giống như bạn làm với anonymous class.

Chúng tôi sẽ chỉ cho bạn cách xây dựng chúng, dùng chúng ở đâu, và cách làm cho code của bạn ngắn gọn hơn nhờ chúng. Chúng tôi cũng giải thích một số điều mới mẻ thú vị như type inference và những interface mới quan trọng có sẵn trong API của Java 8. Cuối cùng, chúng tôi giới thiệu method reference, một tính năng mới hữu ích đi song hành cùng lambda expression.

Chương này được tổ chức theo cách dạy bạn từng bước cách viết code ngắn gọn và linh hoạt hơn. Ở cuối chương, chúng tôi gom tất cả các khái niệm đã dạy vào một ví dụ cụ thể; chúng tôi lấy ví dụ sắp xếp đã trình bày ở chương 2 và cải tiến dần bằng lambda expression cùng method reference để nó ngắn gọn và dễ đọc hơn. Chương này quan trọng cả tự thân nó lẫn vì bạn sẽ dùng lambda rất nhiều trong suốt cuốn sách.

## 3.1. Tổng quan nhanh về lambda

Một lambda expression có thể được hiểu là cách biểu diễn ngắn gọn của một hàm vô danh có thể được truyền đi. Nó không có tên, nhưng nó có một danh sách tham số, một thân hàm, một kiểu trả về, và cũng có thể có một danh sách các ngoại lệ có thể được ném ra. Đó là một định nghĩa khá dài; hãy cùng phân tách nó ra:

- **Anonymous (vô danh)** — Chúng ta nói vô danh vì nó không có một tên tường minh như một phương thức thông thường; đỡ phải viết và đỡ phải nghĩ!
- **Function (hàm)** — Chúng ta nói hàm vì lambda không gắn với một class cụ thể như phương thức. Nhưng giống như một phương thức, lambda có một danh sách tham số, một thân hàm, một kiểu trả về, và có thể có một danh sách các ngoại lệ có thể được ném ra.
- **Passed around (truyền đi được)** — Một lambda expression có thể được truyền làm đối số cho một phương thức hoặc được lưu vào một biến.
- **Concise (ngắn gọn)** — Bạn không phải viết nhiều code khuôn mẫu (boilerplate) như khi dùng anonymous class.

Nếu bạn đang thắc mắc thuật ngữ *lambda* đến từ đâu, nó bắt nguồn từ một hệ thống được phát triển trong giới học thuật gọi là lambda calculus, được dùng để mô tả các phép tính toán.

Tại sao bạn nên quan tâm đến lambda expression? Bạn đã thấy ở chương trước rằng việc truyền code trong Java hiện tại rất tẻ nhạt và dài dòng. Tin tốt đây! Lambda khắc phục vấn đề này; chúng cho phép bạn truyền code một cách ngắn gọn. Về mặt kỹ thuật, lambda không cho bạn làm được điều gì mà bạn không thể làm trước Java 8. Nhưng bạn không còn phải viết code lóng ngóng bằng anonymous class để hưởng lợi từ behavior parameterization nữa! Lambda expression sẽ khuyến khích bạn áp dụng phong cách behavior parameterization mà chúng tôi đã mô tả ở chương trước. Kết quả cuối cùng là code của bạn sẽ rõ ràng hơn và linh hoạt hơn. Ví dụ, dùng lambda expression bạn có thể tạo một đối tượng Comparator tuỳ biến một cách ngắn gọn hơn.

Trước đây:

```java
Comparator<Apple> byWeight = new Comparator<Apple>() {
    public int compare(Apple a1, Apple a2) {
        return a1.getWeight().compareTo(a2.getWeight());
    }
};
```

Sau này (với lambda expression):

```java
Comparator<Apple> byWeight =
        (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
```

Bạn phải thừa nhận rằng code trông rõ ràng hơn hẳn! Đừng lo nếu tất cả các phần của lambda expression chưa có ý nghĩa gì với bạn; chúng tôi sẽ giải thích mọi thành phần sớm thôi. Tạm thời, hãy lưu ý rằng theo đúng nghĩa đen bạn chỉ đang truyền đi phần code cần thiết để so sánh hai quả táo dựa trên cân nặng của chúng. Trông như thể bạn đang truyền đi thân của phương thức `compare`. Bạn sẽ sớm học được rằng còn có thể đơn giản hoá code hơn nữa. Chúng tôi sẽ giải thích chính xác ở mục kế tiếp về nơi và cách bạn có thể dùng lambda expression.

Lambda mà chúng tôi vừa cho bạn xem gồm ba phần, như minh hoạ ở hình 3.1:

> **Hình 3.1.** Một lambda expression gồm các tham số, một mũi tên, và một thân hàm.

- **Danh sách tham số** — Trong trường hợp này nó phản chiếu các tham số của phương thức `compare` của một `Comparator` — hai đối tượng `Apple`.
- **Một mũi tên** — Mũi tên `->` ngăn cách danh sách tham số với thân của lambda.
- **Thân của lambda** — So sánh hai `Apple` dựa trên cân nặng của chúng. Biểu thức này được coi là giá trị trả về của lambda.

Để minh hoạ thêm, listing dưới đây trình bày năm ví dụ về lambda expression hợp lệ trong Java 8.

**Listing 3.1. Các lambda expression hợp lệ trong Java 8**

```java
// Nhận một tham số kiểu String và trả về một int.
// Không có câu lệnh return vì return được ngầm hiểu.
(String s) -> s.length()

// Nhận một tham số kiểu Apple và trả về một boolean
// (quả táo có nặng hơn 150 g hay không).
(Apple a) -> a.getWeight() > 150

// Nhận hai tham số kiểu int và không trả về giá trị nào (kiểu trả về void).
// Thân của nó chứa hai câu lệnh.
(int x, int y) -> {
    System.out.println("Result:");
    System.out.println(x + y);
}

// Không nhận tham số nào và trả về số int 42
() -> 42

// Nhận hai tham số kiểu Apple và trả về một int biểu diễn
// kết quả so sánh cân nặng của chúng
(Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight())
```

Cú pháp này được các nhà thiết kế ngôn ngữ Java chọn vì nó đã được đón nhận tốt trong các ngôn ngữ khác, chẳng hạn như C# và Scala. JavaScript cũng có cú pháp tương tự. Cú pháp cơ bản của một lambda hoặc là (được gọi là lambda dạng biểu thức — expression-style lambda)

```java
(parameters) -> expression
```

hoặc là (chú ý cặp ngoặc nhọn cho các câu lệnh; lambda này thường được gọi là lambda dạng khối — block-style lambda)

```java
(parameters) -> { statements; }
```

Như bạn thấy, lambda expression tuân theo một cú pháp đơn giản. Làm quiz 3.1 sẽ giúp bạn biết mình đã hiểu mẫu hình này hay chưa.

---

**Quiz 3.1: Cú pháp lambda**

Dựa trên các quy tắc cú pháp vừa nêu, những biểu thức nào sau đây **không** phải là lambda expression hợp lệ?

1. `() -> {}`
2. `() -> "Raoul"`
3. `() -> { return "Mario"; }`
4. `(Integer i) -> return "Alan" + i;`
5. `(String s) -> { "Iron Man"; }`

**Đáp án:**

Số 4 và 5 là lambda không hợp lệ; các trường hợp còn lại đều hợp lệ. Chi tiết:

1. Lambda này không có tham số nào và trả về `void`. Nó tương tự một phương thức có thân rỗng: `public void run() { }`. Một chi tiết vui: nó thường được gọi là *burger lambda* (lambda hamburger). Hãy nhìn nó từ bên hông, và bạn sẽ thấy nó có hình dáng một chiếc hamburger với hai lát bánh mì.
2. Lambda này không có tham số nào và trả về một `String` dưới dạng một biểu thức.
3. Lambda này không có tham số nào và trả về một `String` (dùng câu lệnh `return` tường minh, bên trong một khối).
4. `return` là một câu lệnh điều khiển luồng. Để lambda này hợp lệ, cần có cặp ngoặc nhọn như sau: `(Integer i) -> { return "Alan" + i; }`.
5. `"Iron Man"` là một biểu thức, không phải một câu lệnh. Để lambda này hợp lệ, bạn có thể bỏ cặp ngoặc nhọn và dấu chấm phẩy như sau: `(String s) -> "Iron Man"`. Hoặc nếu bạn thích, bạn có thể dùng câu lệnh `return` tường minh như sau: `(String s) -> { return "Iron Man"; }`.

---

Bảng 3.1 cung cấp danh sách các lambda mẫu kèm ví dụ về các tình huống sử dụng.

**Bảng 3.1. Ví dụ về lambda**

| Tình huống sử dụng | Ví dụ lambda |
|---|---|
| Một biểu thức boolean | `(List<String> list) -> list.isEmpty()` |
| Tạo đối tượng | `() -> new Apple(10)` |
| Tiêu thụ (consume) từ một đối tượng | `(Apple a) -> { System.out.println(a.getWeight()); }` |
| Chọn/trích xuất từ một đối tượng | `(String s) -> s.length()` |
| Kết hợp hai giá trị | `(int a, int b) -> a * b` |
| So sánh hai đối tượng | `(Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight())` |

## 3.2. Dùng lambda ở đâu và như thế nào

Bây giờ có lẽ bạn đang tự hỏi mình được phép dùng lambda expression ở đâu. Trong ví dụ trước, bạn đã gán một lambda cho một biến kiểu `Comparator<Apple>`. Bạn cũng có thể dùng một lambda khác với phương thức `filter` mà bạn đã cài đặt ở chương trước:

```java
List<Apple> greenApples =
        filter(inventory, (Apple a) -> GREEN.equals(a.getColor()));
```

Vậy chính xác thì bạn có thể dùng lambda ở đâu? Bạn có thể dùng một lambda expression trong ngữ cảnh của một functional interface. Trong đoạn code vừa trình bày, bạn có thể truyền một lambda làm đối số thứ hai cho phương thức `filter` bởi vì nó mong đợi một đối tượng kiểu `Predicate<T>`, vốn là một functional interface. Đừng lo nếu điều này nghe có vẻ trừu tượng; ngay bây giờ chúng tôi sẽ giải thích chi tiết điều này nghĩa là gì và functional interface là gì.

### 3.2.1. Functional interface

Bạn còn nhớ interface `Predicate<T>` mà bạn đã tạo ở chương 2 để có thể tham số hoá hành vi của phương thức `filter` chứ? Nó là một functional interface! Tại sao? Bởi vì `Predicate` chỉ khai báo đúng một phương thức trừu tượng:

```java
public interface Predicate<T> {
    boolean test(T t);
}
```

Nói ngắn gọn, một functional interface là một interface khai báo đúng một phương thức trừu tượng. Bạn đã biết vài functional interface khác trong Java API như `Comparator` và `Runnable`, những thứ chúng ta đã khám phá ở chương 2:

```java
public interface Comparator<T> {                                // java.util.Comparator
    int compare(T o1, T o2);
}

public interface Runnable {                                     // java.lang.Runnable
    void run();
}

public interface ActionListener extends EventListener {         // java.awt.event.ActionListener
    void actionPerformed(ActionEvent e);
}

public interface Callable<V> {                                  // java.util.concurrent.Callable
    V call() throws Exception;
}

public interface PrivilegedAction<T> {                          // java.security.PrivilegedAction
    T run();
}
```

> **Ghi chú**
>
> Bạn sẽ thấy ở chương 13 rằng interface bây giờ cũng có thể có default method (một phương thức có thân, cung cấp một phần cài đặt mặc định cho một phương thức trong trường hợp nó không được cài đặt bởi một class). Một interface vẫn là functional interface nếu nó có nhiều default method, miễn là nó chỉ khai báo đúng một phương thức trừu tượng.

Để kiểm tra mức độ hiểu bài của bạn, quiz 3.2 sẽ cho bạn biết mình đã nắm được khái niệm functional interface hay chưa.

---

**Quiz 3.2: Functional interface**

Interface nào trong số này là functional interface?

```java
public interface Adder {
    int add(int a, int b);
}

public interface SmartAdder extends Adder {
    int add(double a, double b);
}

public interface Nothing {
}
```

**Đáp án:**

Chỉ có `Adder` là functional interface.

`SmartAdder` không phải functional interface vì nó khai báo hai phương thức trừu tượng tên `add` (một cái được kế thừa từ `Adder`).

`Nothing` không phải functional interface vì nó không khai báo phương thức trừu tượng nào cả.

---

Bạn có thể làm gì với functional interface? Lambda expression cho phép bạn cung cấp phần cài đặt của phương thức trừu tượng của một functional interface trực tiếp ngay tại chỗ (inline) và coi toàn bộ biểu thức đó như một thể hiện của functional interface (nói chính xác hơn về mặt kỹ thuật, một thể hiện của một lớp cài đặt cụ thể của functional interface đó). Bạn có thể đạt được điều tương tự với một anonymous inner class, mặc dù cách đó lóng ngóng hơn: bạn cung cấp phần cài đặt và khởi tạo nó trực tiếp ngay tại chỗ. Đoạn code sau đây là hợp lệ vì `Runnable` là một functional interface chỉ định nghĩa một phương thức trừu tượng duy nhất, `run`:

```java
Runnable r1 = () -> System.out.println("Hello World 1");    // Dùng một lambda

Runnable r2 = new Runnable() {                              // Dùng một anonymous class
    public void run() {
        System.out.println("Hello World 2");
    }
};

public static void process(Runnable r) {
    r.run();
}

process(r1);    // In ra “Hello World 1”
process(r2);    // In ra “Hello World 2”

// In ra “Hello World 3” với một lambda được truyền trực tiếp
process(() -> System.out.println("Hello World 3"));
```

### 3.2.2. Function descriptor

Chữ ký (signature) của phương thức trừu tượng của functional interface mô tả chữ ký của lambda expression. Chúng tôi gọi phương thức trừu tượng này là một **function descriptor**. Ví dụ, interface `Runnable` có thể được xem như chữ ký của một hàm không nhận gì và không trả về gì (`void`), bởi vì nó chỉ có một phương thức trừu tượng duy nhất tên `run`, vốn không nhận gì và không trả về gì (`void`).[1]

> [1] Một số ngôn ngữ như Scala cung cấp các chú thích kiểu tường minh trong hệ thống kiểu của chúng để mô tả kiểu của một hàm (gọi là *function type*). Java tái sử dụng các kiểu định danh (nominal type) sẵn có do các functional interface cung cấp và ánh xạ chúng thành một dạng function type ở phía sau hậu trường.

Chúng tôi dùng một ký hiệu đặc biệt xuyên suốt chương này để mô tả chữ ký của các lambda và các functional interface. Ký hiệu `() -> void` biểu diễn một hàm có danh sách tham số rỗng và trả về `void`. Đây chính xác là điều mà interface `Runnable` biểu diễn. Một ví dụ khác, `(Apple, Apple) -> int` biểu thị một hàm nhận hai đối tượng `Apple` làm tham số và trả về một `int`. Chúng tôi sẽ cung cấp thêm thông tin về function descriptor ở mục 3.4 và bảng 3.2 ở phần sau của chương.

Có lẽ bạn đang tự hỏi lambda expression được kiểm tra kiểu (type check) như thế nào. Chúng tôi trình bày chi tiết cách compiler kiểm tra xem một lambda có hợp lệ trong một ngữ cảnh cho trước hay không ở mục 3.5. Tạm thời, chỉ cần hiểu rằng một lambda expression có thể được gán cho một biến hoặc được truyền cho một phương thức mong đợi một functional interface làm đối số, với điều kiện lambda expression đó có cùng chữ ký với phương thức trừu tượng của functional interface. Chẳng hạn, trong ví dụ trước đó, bạn có thể truyền một lambda trực tiếp cho phương thức `process` như sau:

```java
public void process(Runnable r) {
    r.run();
}

process(() -> System.out.println("This is awesome!!"));
```

Đoạn code này khi thực thi sẽ in ra “This is awesome!!”. Lambda expression `() -> System.out.println("This is awesome!!")` không nhận tham số nào và trả về `void`. Đây chính xác là chữ ký của phương thức `run` được định nghĩa trong interface `Runnable`.

> **Lambda và lời gọi phương thức trả về void**
>
> Mặc dù điều này có thể khiến bạn thấy lạ, lambda expression sau đây là hợp lệ:
>
> ```java
> process(() -> System.out.println("This is awesome"));
> ```
>
> Suy cho cùng, `System.out.println` trả về `void` nên rõ ràng đây không phải một biểu thức! Tại sao chúng ta không phải bọc thân hàm bằng cặp ngoặc nhọn như thế này?
>
> ```java
> process(() -> { System.out.println("This is awesome"); });
> ```
>
> Hoá ra có một quy tắc đặc biệt dành cho lời gọi phương thức trả về `void` được định nghĩa trong Java Language Specification. Bạn không phải bọc một lời gọi phương thức `void` đơn lẻ trong cặp ngoặc nhọn.

Có lẽ bạn đang thắc mắc: “Tại sao chúng ta chỉ có thể truyền một lambda ở nơi mà một functional interface được mong đợi?” Các nhà thiết kế ngôn ngữ đã cân nhắc những cách tiếp cận thay thế, chẳng hạn thêm function type vào Java (hơi giống ký hiệu đặc biệt mà chúng tôi đã giới thiệu để mô tả chữ ký của lambda expression — chúng ta sẽ trở lại chủ đề này ở chương 20 và 21). Nhưng họ đã chọn cách này bởi nó ăn khớp một cách tự nhiên mà không làm tăng độ phức tạp của ngôn ngữ. Ngoài ra, hầu hết lập trình viên Java vốn đã quen thuộc với ý tưởng về một interface chỉ có một phương thức trừu tượng duy nhất (ví dụ, để xử lý sự kiện). Tuy nhiên, lý do quan trọng nhất là các functional interface đã được sử dụng rộng rãi từ trước Java 8. Điều này nghĩa là chúng cung cấp một lộ trình chuyển đổi thuận lợi để sử dụng lambda expression. Thực tế, nếu bạn đã và đang dùng các functional interface như `Comparator` và `Runnable`, hoặc thậm chí những interface của riêng bạn tình cờ chỉ định nghĩa một phương thức trừu tượng duy nhất, thì bây giờ bạn có thể dùng lambda expression mà không cần thay đổi API của mình. Hãy thử quiz 3.3 để kiểm tra kiến thức của bạn về nơi có thể dùng lambda.

---

**Quiz 3.3: Bạn có thể dùng lambda ở đâu?**

Trường hợp nào sau đây là cách dùng lambda expression hợp lệ?

1.
```java
execute(() -> {});
public void execute(Runnable r) {
    r.run();
}
```

2.
```java
public Callable<String> fetch() {
    return () -> "Tricky example ;-)";
}
```

3.
```java
Predicate<Apple> p = (Apple a) -> a.getWeight();
```

**Đáp án:**

Chỉ có 1 và 2 là hợp lệ.

Ví dụ thứ nhất hợp lệ vì lambda `() -> {}` có chữ ký `() -> void`, khớp với chữ ký của phương thức trừu tượng `run` được định nghĩa trong `Runnable`. Lưu ý rằng chạy đoạn code này sẽ chẳng làm gì cả vì thân của lambda rỗng!

Ví dụ thứ hai cũng hợp lệ. Thật vậy, kiểu trả về của phương thức `fetch` là `Callable<String>`. `Callable<String>` định nghĩa một phương thức có chữ ký `() -> String` khi `T` được thay bằng `String`. Bởi vì lambda `() -> "Tricky example ;-)"` có chữ ký `() -> String`, lambda này có thể được dùng trong ngữ cảnh đó.

Ví dụ thứ ba không hợp lệ vì lambda expression `(Apple a) -> a.getWeight()` có chữ ký `(Apple) -> Integer`, khác với chữ ký của phương thức `test` được định nghĩa trong `Predicate<Apple>`: `(Apple) -> boolean`.

---

> **Còn `@FunctionalInterface` thì sao?**
>
> Nếu bạn khám phá API mới của Java, bạn sẽ nhận thấy các functional interface thường được đánh dấu bằng annotation `@FunctionalInterface`. (Chúng tôi trình bày một danh sách đầy đủ ở mục 3.4, nơi chúng ta khám phá sâu cách sử dụng functional interface.) Annotation này được dùng để chỉ ra rằng interface đó được thiết kế với ý định trở thành một functional interface, và vì vậy nó hữu ích cho mục đích tài liệu. Ngoài ra, compiler sẽ trả về một thông báo lỗi có ý nghĩa nếu bạn định nghĩa một interface có annotation `@FunctionalInterface` mà nó lại không phải functional interface. Ví dụ, một thông báo lỗi có thể là “Multiple non-overriding abstract methods found in interface Foo” để chỉ ra rằng có nhiều hơn một phương thức trừu tượng. Lưu ý rằng annotation `@FunctionalInterface` không bắt buộc, nhưng dùng nó là một thực hành tốt khi một interface được thiết kế cho mục đích đó. Bạn có thể coi nó giống như ký hiệu `@Override` dùng để chỉ ra rằng một phương thức được override.

## 3.3. Đưa lambda vào thực tế: execute-around pattern

Hãy xem một ví dụ về cách lambda, cùng với behavior parameterization, có thể được dùng trong thực tế để làm cho code của bạn linh hoạt và ngắn gọn hơn. Một mẫu hình lặp đi lặp lại trong việc xử lý tài nguyên (ví dụ, làm việc với file hoặc cơ sở dữ liệu) là mở một tài nguyên, thực hiện một số xử lý trên nó, rồi đóng tài nguyên đó lại. Các giai đoạn thiết lập và dọn dẹp luôn giống nhau và bao quanh phần code quan trọng thực hiện việc xử lý. Đây được gọi là **execute-around pattern**, như minh hoạ ở hình 3.2. Ví dụ, trong đoạn code sau, những dòng được tô sáng là code khuôn mẫu (boilerplate) cần thiết để đọc một dòng từ một file (cũng lưu ý rằng bạn dùng câu lệnh try-with-resources của Java 7, vốn đã giúp đơn giản hoá code, bởi vì bạn không phải đóng tài nguyên một cách tường minh):

> **Hình 3.2.** Tác vụ A và tác vụ B được bao quanh bởi code khuôn mẫu chịu trách nhiệm chuẩn bị/dọn dẹp.

```java
public String processFile() throws IOException {
    try (BufferedReader br =
                 new BufferedReader(new FileReader("data.txt"))) {
        return br.readLine();    // Đây là dòng làm công việc hữu ích.
    }
}
```

### 3.3.1. Bước 1: Nhớ lại behavior parameterization

Đoạn code hiện tại này có giới hạn. Bạn chỉ có thể đọc dòng đầu tiên của file. Nếu bạn muốn trả về hai dòng đầu tiên thay vì vậy, hoặc thậm chí là từ được dùng thường xuyên nhất thì sao? Lý tưởng nhất, bạn muốn tái sử dụng phần code thực hiện thiết lập và dọn dẹp, đồng thời bảo phương thức `processFile` thực hiện những hành động khác nhau trên file. Nghe có quen không? Đúng vậy, bạn cần tham số hoá hành vi của `processFile`. Bạn cần một cách để truyền hành vi vào `processFile` sao cho nó có thể thực thi những hành vi khác nhau bằng một `BufferedReader`.

Truyền hành vi chính xác là điều mà lambda sinh ra để làm. Phương thức `processFile` mới nên trông như thế nào nếu bạn muốn đọc hai dòng cùng lúc? Bạn cần một lambda nhận một `BufferedReader` và trả về một `String`. Ví dụ, đây là cách in hai dòng từ một `BufferedReader`:

```java
String result
        = processFile((BufferedReader br) -> br.readLine() + br.readLine());
```

### 3.3.2. Bước 2: Dùng một functional interface để truyền hành vi

Chúng tôi đã giải thích trước đó rằng lambda chỉ có thể được dùng trong ngữ cảnh của một functional interface. Bạn cần tạo một functional interface khớp với chữ ký `BufferedReader -> String` và có thể ném ra một `IOException`. Hãy gọi interface này là `BufferedReaderProcessor`:

```java
@FunctionalInterface
public interface BufferedReaderProcessor {
    String process(BufferedReader b) throws IOException;
}
```

Bây giờ bạn có thể dùng interface này làm đối số cho phương thức `processFile` mới của mình:

```java
public String processFile(BufferedReaderProcessor p) throws IOException {
    ...
}
```

### 3.3.3. Bước 3: Thực thi một hành vi!

Bất kỳ lambda nào có dạng `BufferedReader -> String` đều có thể được truyền làm đối số, bởi vì chúng khớp với chữ ký của phương thức `process` được định nghĩa trong interface `BufferedReaderProcessor`. Bây giờ bạn chỉ còn cần một cách để thực thi phần code được biểu diễn bởi lambda bên trong thân của `processFile`. Hãy nhớ rằng, lambda expression cho phép bạn cung cấp phần cài đặt của phương thức trừu tượng của một functional interface trực tiếp ngay tại chỗ, và chúng coi toàn bộ biểu thức như một thể hiện của functional interface đó. Do đó bạn có thể gọi phương thức `process` trên đối tượng `BufferedReaderProcessor` kết quả bên trong thân của `processFile` để thực hiện việc xử lý:

```java
public String processFile(BufferedReaderProcessor p) throws IOException {
    try (BufferedReader br =
                 new BufferedReader(new FileReader("data.txt"))) {
        return p.process(br);    // Xử lý đối tượng BufferedReader
    }
}
```

### 3.3.4. Bước 4: Truyền lambda

Bây giờ bạn có thể tái sử dụng phương thức `processFile` và xử lý file theo nhiều cách khác nhau bằng cách truyền vào những lambda khác nhau.

Đoạn sau minh hoạ việc xử lý một dòng:

```java
String oneLine =
        processFile((BufferedReader br) -> br.readLine());
```

Đoạn sau minh hoạ việc xử lý hai dòng:

```java
String twoLines =
        processFile((BufferedReader br) -> br.readLine() + br.readLine());
```

Hình 3.3 tóm tắt bốn bước đã thực hiện để làm cho phương thức `processFile` linh hoạt hơn.

> **Hình 3.3.** Quy trình bốn bước để áp dụng execute-around pattern

Chúng tôi đã chỉ cho bạn cách tận dụng functional interface để truyền lambda. Nhưng bạn đã phải tự định nghĩa interface của riêng mình. Ở mục kế tiếp, chúng ta khám phá những interface mới được thêm vào Java 8 mà bạn có thể tái sử dụng để truyền nhiều lambda khác nhau.

## 3.4. Sử dụng functional interface

Như bạn đã học ở mục 3.2.1, một functional interface khai báo đúng một phương thức trừu tượng. Functional interface hữu ích bởi vì chữ ký của phương thức trừu tượng có thể mô tả chữ ký của một lambda expression. Chữ ký của phương thức trừu tượng của một functional interface được gọi là **function descriptor**. Để có thể dùng nhiều lambda expression khác nhau, bạn cần một tập hợp các functional interface có khả năng mô tả những function descriptor phổ biến. Một số functional interface đã có sẵn trong Java API như `Comparable`, `Runnable`, và `Callable`, những thứ bạn đã thấy ở mục 3.2.

Các nhà thiết kế thư viện Java cho Java 8 đã giúp bạn bằng cách giới thiệu vài functional interface mới bên trong package `java.util.function`. Tiếp theo chúng tôi sẽ mô tả các interface `Predicate`, `Consumer`, và `Function`. Một danh sách đầy đủ hơn có ở bảng 3.2 tại cuối mục này.

### 3.4.1. Predicate

Interface `java.util.function.Predicate<T>` định nghĩa một phương thức trừu tượng tên `test`, nhận một đối tượng thuộc kiểu generic `T` và trả về một `boolean`. Nó chính xác là interface bạn đã tạo trước đó, nhưng nó có sẵn ngay từ đầu! Bạn có thể muốn dùng interface này khi cần biểu diễn một biểu thức boolean sử dụng một đối tượng kiểu `T`. Ví dụ, bạn có thể định nghĩa một lambda nhận các đối tượng `String`, như trong listing sau.

**Listing 3.2. Làm việc với một Predicate**

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
}

public <T> List<T> filter(List<T> list, Predicate<T> p) {
    List<T> results = new ArrayList<>();
    for (T t : list) {
        if (p.test(t)) {
            results.add(t);
        }
    }
    return results;
}

Predicate<String> nonEmptyStringPredicate = (String s) -> !s.isEmpty();
List<String> nonEmpty = filter(listOfStrings, nonEmptyStringPredicate);
```

Nếu bạn tra cứu đặc tả Javadoc của interface `Predicate`, bạn có thể để ý thấy những phương thức bổ sung như `and` và `or`. Đừng bận tâm về chúng lúc này. Chúng ta sẽ quay lại với chúng ở mục 3.8.

### 3.4.2. Consumer

Interface `java.util.function.Consumer<T>` định nghĩa một phương thức trừu tượng tên `accept`, nhận một đối tượng thuộc kiểu generic `T` và không trả về kết quả nào (`void`). Bạn có thể dùng interface này khi cần truy cập một đối tượng kiểu `T` và thực hiện một số thao tác trên nó. Ví dụ, bạn có thể dùng nó để tạo một phương thức `forEach`, nhận một danh sách các `Integer` và áp dụng một thao tác lên từng phần tử của danh sách đó. Trong listing sau, bạn sẽ dùng phương thức `forEach` này kết hợp với một lambda để in ra tất cả các phần tử của danh sách.

**Listing 3.3. Làm việc với một Consumer**

```java
@FunctionalInterface
public interface Consumer<T> {
    void accept(T t);
}

public <T> void forEach(List<T> list, Consumer<T> c) {
    for (T t : list) {
        c.accept(t);
    }
}

forEach(
        Arrays.asList(1, 2, 3, 4, 5),
        // Lambda chính là phần cài đặt của phương thức accept từ Consumer.
        (Integer i) -> System.out.println(i)
);
```

### 3.4.3. Function

Interface `java.util.function.Function<T, R>` định nghĩa một phương thức trừu tượng tên `apply`, nhận đầu vào là một đối tượng thuộc kiểu generic `T` và trả về một đối tượng thuộc kiểu generic `R`. Bạn có thể dùng interface này khi cần định nghĩa một lambda ánh xạ thông tin từ một đối tượng đầu vào sang một đầu ra (ví dụ, trích xuất cân nặng của một quả táo hoặc ánh xạ một chuỗi sang độ dài của nó). Trong listing tiếp theo, chúng tôi trình bày cách bạn có thể dùng nó để tạo một phương thức `map` biến đổi một danh sách các `String` thành một danh sách các `Integer` chứa độ dài của từng `String`.

**Listing 3.4. Làm việc với một Function**

```java
@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);
}

public <T, R> List<R> map(List<T> list, Function<T, R> f) {
    List<R> result = new ArrayList<>();
    for (T t : list) {
        result.add(f.apply(t));
    }
    return result;
}

// [7, 2, 6]
List<Integer> l = map(
        Arrays.asList("lambdas", "in", "action"),
        (String s) -> s.length()    // Cài đặt phương thức apply của Function
);
```

> **Chuyên biệt hoá cho primitive (primitive specializations)**
>
> Chúng tôi đã mô tả ba functional interface có tính generic: `Predicate<T>`, `Consumer<T>`, và `Function<T, R>`. Còn có những functional interface được chuyên biệt hoá cho một số kiểu nhất định.
>
> Để ôn lại một chút: mọi kiểu trong Java đều hoặc là kiểu tham chiếu (ví dụ, `Byte`, `Integer`, `Object`, `List`) hoặc là kiểu primitive (ví dụ, `int`, `double`, `byte`, `char`). Nhưng tham số generic (ví dụ, `T` trong `Consumer<T>`) chỉ có thể được ràng buộc với các kiểu tham chiếu. Điều này là do cách generic được cài đặt bên trong.[2] Kết quả là, trong Java có một cơ chế để chuyển một kiểu primitive thành kiểu tham chiếu tương ứng. Cơ chế này gọi là **boxing**. Cách tiếp cận ngược lại (chuyển một kiểu tham chiếu thành kiểu primitive tương ứng) gọi là **unboxing**. Java cũng có cơ chế **autoboxing** để giúp công việc của lập trình viên dễ dàng hơn: các thao tác boxing và unboxing được thực hiện tự động. Ví dụ, đây là lý do đoạn code sau là hợp lệ (một `int` được box thành một `Integer`):
>
> > [2] Một số ngôn ngữ khác, chẳng hạn C#, không có hạn chế này. Những ngôn ngữ khác, như Scala, chỉ có kiểu tham chiếu. Chúng ta sẽ xem lại vấn đề này ở chương 20.
>
> ```java
> List<Integer> list = new ArrayList<>();
> for (int i = 300; i < 400; i++) {
>     list.add(i);
> }
> ```
>
> Nhưng điều này đi kèm một cái giá về hiệu năng. Giá trị đã được box là một lớp bọc quanh kiểu primitive và được lưu trên heap. Do đó, các giá trị đã box dùng nhiều bộ nhớ hơn và cần thêm những lần truy xuất bộ nhớ để lấy về giá trị primitive được bọc bên trong.
>
> Java 8 cũng bổ sung phiên bản chuyên biệt hoá của các functional interface mà chúng tôi đã mô tả trước đó nhằm tránh các thao tác autoboxing khi đầu vào hoặc đầu ra là primitive. Ví dụ, trong đoạn code sau, dùng `IntPredicate` giúp tránh thao tác boxing giá trị 1000, trong khi dùng `Predicate<Integer>` sẽ box đối số 1000 thành một đối tượng `Integer`:
>
> ```java
> public interface IntPredicate {
>     boolean test(int t);
> }
>
> IntPredicate evenNumbers = (int i) -> i % 2 == 0;
> evenNumbers.test(1000);                                    // True (không boxing)
>
> Predicate<Integer> oddNumbers = (Integer i) -> i % 2 != 0;
> oddNumbers.test(1000);                                     // False (có boxing)
> ```
>
> Nói chung, kiểu primitive tương ứng được đặt trước tên của những functional interface có bản chuyên biệt hoá cho tham số kiểu đầu vào (ví dụ, `DoublePredicate`, `IntConsumer`, `LongBinaryOperator`, `IntFunction`, v.v.). Interface `Function` cũng có các biến thể cho tham số kiểu đầu ra: `ToIntFunction<T>`, `IntToDoubleFunction`, v.v.

Bảng 3.2 tóm tắt những functional interface được dùng phổ biến nhất có sẵn trong Java API cùng với function descriptor của chúng, kèm theo các bản chuyên biệt hoá cho primitive. Hãy nhớ rằng đây chỉ là bộ khởi đầu, và bạn luôn có thể tự tạo interface của riêng mình nếu cần (quiz 3.7 sáng chế ra `TriFunction` cho mục đích này). Tạo interface của riêng bạn cũng có thể hữu ích khi một cái tên mang tính đặc thù nghiệp vụ giúp cho việc hiểu và bảo trì chương trình dễ dàng hơn. Hãy nhớ, ký hiệu `(T, U) -> R` cho thấy cách nghĩ về một function descriptor. Phía bên trái mũi tên là một danh sách biểu diễn các kiểu của đối số, còn phía bên phải biểu diễn các kiểu của kết quả. Trong trường hợp này, nó biểu diễn một hàm với hai đối số lần lượt thuộc kiểu generic `T` và `U`, có kiểu trả về là `R`.

**Bảng 3.2. Các functional interface phổ biến được thêm vào trong Java 8**

| Functional interface | Function descriptor | Bản chuyên biệt hoá cho primitive |
|---|---|---|
| `Predicate<T>` | `T -> boolean` | `IntPredicate`, `LongPredicate`, `DoublePredicate` |
| `Consumer<T>` | `T -> void` | `IntConsumer`, `LongConsumer`, `DoubleConsumer` |
| `Function<T, R>` | `T -> R` | `IntFunction<R>`, `IntToDoubleFunction`, `IntToLongFunction`, `LongFunction<R>`, `LongToDoubleFunction`, `LongToIntFunction`, `DoubleFunction<R>`, `DoubleToIntFunction`, `DoubleToLongFunction`, `ToIntFunction<T>`, `ToDoubleFunction<T>`, `ToLongFunction<T>` |
| `Supplier<T>` | `() -> T` | `BooleanSupplier`, `IntSupplier`, `LongSupplier`, `DoubleSupplier` |
| `UnaryOperator<T>` | `T -> T` | `IntUnaryOperator`, `LongUnaryOperator`, `DoubleUnaryOperator` |
| `BinaryOperator<T>` | `(T, T) -> T` | `IntBinaryOperator`, `LongBinaryOperator`, `DoubleBinaryOperator` |
| `BiPredicate<T, U>` | `(T, U) -> boolean` | |
| `BiConsumer<T, U>` | `(T, U) -> void` | `ObjIntConsumer<T>`, `ObjLongConsumer<T>`, `ObjDoubleConsumer<T>` |
| `BiFunction<T, U, R>` | `(T, U) -> R` | `ToIntBiFunction<T, U>`, `ToLongBiFunction<T, U>`, `ToDoubleBiFunction<T, U>` |

Đến đây bạn đã thấy rất nhiều functional interface có thể dùng để mô tả chữ ký của nhiều lambda expression khác nhau. Để kiểm tra mức độ hiểu bài của bạn cho tới lúc này, hãy thử quiz 3.4.

---

**Quiz 3.4: Functional interface**

Bạn sẽ dùng functional interface nào cho những function descriptor (chữ ký của lambda expression) sau đây? Bạn sẽ tìm thấy hầu hết đáp án trong bảng 3.2. Như một bài tập nâng cao, hãy nghĩ ra những lambda expression hợp lệ mà bạn có thể dùng với các functional interface này.

1. `T -> R`
2. `(int, int) -> int`
3. `T -> void`
4. `() -> T`
5. `(T, U) -> R`

**Đáp án:**

1. `Function<T, R>` là một ứng viên tốt. Nó thường được dùng để chuyển đổi một đối tượng kiểu `T` thành một đối tượng kiểu `R` (ví dụ, `Function<Apple, Integer>` để trích xuất cân nặng của một quả táo).
2. `IntBinaryOperator` có một phương thức trừu tượng duy nhất tên `applyAsInt`, biểu diễn function descriptor `(int, int) -> int`.
3. `Consumer<T>` có một phương thức trừu tượng duy nhất tên `accept`, biểu diễn function descriptor `T -> void`.
4. `Supplier<T>` có một phương thức trừu tượng duy nhất tên `get`, biểu diễn function descriptor `() -> T`.
5. `BiFunction<T, U, R>` có một phương thức trừu tượng duy nhất tên `apply`, biểu diễn function descriptor `(T, U) -> R`.

---

Để tóm tắt phần thảo luận về functional interface và lambda, bảng 3.3 cung cấp một bản tổng hợp các tình huống sử dụng, ví dụ lambda, và các functional interface có thể dùng.

**Bảng 3.3. Ví dụ về lambda kèm functional interface**

| Tình huống sử dụng | Ví dụ lambda | Functional interface tương ứng |
|---|---|---|
| Một biểu thức boolean | `(List<String> list) -> list.isEmpty()` | `Predicate<List<String>>` |
| Tạo đối tượng | `() -> new Apple(10)` | `Supplier<Apple>` |
| Tiêu thụ từ một đối tượng | `(Apple a) -> System.out.println(a.getWeight())` | `Consumer<Apple>` |
| Chọn/trích xuất từ một đối tượng | `(String s) -> s.length()` | `Function<String, Integer>` hoặc `ToIntFunction<String>` |
| Kết hợp hai giá trị | `(int a, int b) -> a * b` | `IntBinaryOperator` |
| So sánh hai đối tượng | `(Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight())` | `Comparator<Apple>` hoặc `BiFunction<Apple, Apple, Integer>` hoặc `ToIntBiFunction<Apple, Apple>` |

> **Còn ngoại lệ, lambda và functional interface thì sao?**
>
> Lưu ý rằng không có functional interface nào cho phép ném ra một checked exception. Bạn có hai lựa chọn nếu bạn cần thân của một lambda expression ném ra một ngoại lệ: định nghĩa functional interface của riêng bạn có khai báo checked exception đó, hoặc bọc thân của lambda trong một khối `try/catch`.
>
> Ví dụ, ở mục 3.3 chúng tôi đã giới thiệu một functional interface mới là `BufferedReaderProcessor`, khai báo tường minh một `IOException`:
>
> ```java
> @FunctionalInterface
> public interface BufferedReaderProcessor {
>     String process(BufferedReader b) throws IOException;
> }
>
> BufferedReaderProcessor p = (BufferedReader br) -> br.readLine();
> ```
>
> Nhưng có thể bạn đang dùng một API mong đợi một functional interface như `Function<T, R>` và không có lựa chọn tạo cái của riêng bạn. Bạn sẽ thấy ở chương sau rằng Streams API sử dụng rất nhiều các functional interface trong bảng 3.2. Trong trường hợp này, bạn có thể bắt checked exception một cách tường minh:
>
> ```java
> Function<BufferedReader, String> f =
>         (BufferedReader b) -> {
>             try {
>                 return b.readLine();
>             } catch (IOException e) {
>                 throw new RuntimeException(e);
>             }
>         };
> ```

Đến đây bạn đã thấy cách tạo lambda cũng như dùng chúng ở đâu và như thế nào. Tiếp theo, chúng tôi sẽ giải thích một số chi tiết nâng cao hơn: cách lambda được compiler kiểm tra kiểu và những quy tắc bạn nên biết, chẳng hạn như lambda tham chiếu tới biến cục bộ bên trong thân của nó và những lambda tương thích với `void`. Không cần phải hiểu hoàn toàn mục kế tiếp ngay lập tức, và bạn có thể quay lại đọc sau, chuyển tiếp sang mục 3.6 về method reference.

## 3.5. Kiểm tra kiểu, suy luận kiểu và các hạn chế

Khi lần đầu đề cập tới lambda expression, chúng tôi đã nói rằng chúng cho phép bạn sinh ra một thể hiện của một functional interface. Tuy nhiên, bản thân một lambda expression không chứa thông tin về việc nó đang cài đặt functional interface nào. Để hiểu lambda expression một cách hình thức hơn, bạn nên biết kiểu của một lambda là gì.

### 3.5.1. Kiểm tra kiểu (type checking)

Kiểu của một lambda được suy ra từ ngữ cảnh trong đó lambda được sử dụng. Kiểu được mong đợi cho lambda expression bên trong ngữ cảnh đó (ví dụ, một tham số phương thức mà nó được truyền vào, hoặc một biến cục bộ mà nó được gán cho) được gọi là **target type**. Hãy xem một ví dụ để thấy điều gì xảy ra ở phía sau hậu trường khi bạn dùng một lambda expression. Hình 3.4 tóm tắt quá trình kiểm tra kiểu cho đoạn code sau:

> **Hình 3.4.** Phân tách quá trình kiểm tra kiểu của một lambda expression

```java
List<Apple> heavierThan150g =
        filter(inventory, (Apple apple) -> apple.getWeight() > 150);
```

Quá trình kiểm tra kiểu được phân tách như sau:

- Đầu tiên, bạn tra cứu khai báo của phương thức `filter`.
- Thứ hai, nó mong đợi, ở vị trí tham số hình thức thứ hai, một đối tượng kiểu `Predicate<Apple>` (target type).
- Thứ ba, `Predicate<Apple>` là một functional interface định nghĩa một phương thức trừu tượng duy nhất tên `test`.
- Thứ tư, phương thức `test` mô tả một function descriptor nhận một `Apple` và trả về một `boolean`.
- Cuối cùng, mọi đối số truyền cho phương thức `filter` đều phải khớp với yêu cầu này.

Đoạn code là hợp lệ bởi vì lambda expression mà chúng ta đang truyền vào cũng nhận một `Apple` làm tham số và trả về một `boolean`. Lưu ý rằng nếu lambda expression ném ra một ngoại lệ, thì mệnh đề `throws` được khai báo của phương thức trừu tượng cũng phải khớp.

### 3.5.2. Cùng một lambda, những functional interface khác nhau

Nhờ ý tưởng target typing, cùng một lambda expression có thể được liên kết với những functional interface khác nhau nếu chúng có chữ ký của phương thức trừu tượng tương thích. Ví dụ, cả hai interface `Callable` và `PrivilegedAction` được mô tả trước đó đều biểu diễn những hàm không nhận gì và trả về một kiểu generic `T`. Do đó hai phép gán sau đây đều hợp lệ:

```java
Callable<Integer> c = () -> 42;
PrivilegedAction<Integer> p = () -> 42;
```

Trong trường hợp này phép gán thứ nhất có target type là `Callable<Integer>` còn phép gán thứ hai có target type là `PrivilegedAction<Integer>`.

Trong bảng 3.3 chúng tôi đã trình bày một ví dụ tương tự; cùng một lambda có thể được dùng với nhiều functional interface khác nhau:

```java
Comparator<Apple> c1 =
        (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
ToIntBiFunction<Apple, Apple> c2 =
        (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
BiFunction<Apple, Apple, Integer> c3 =
        (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());
```

> **Toán tử diamond**
>
> Những ai quen thuộc với quá trình phát triển của Java sẽ nhớ rằng Java 7 đã giới thiệu ý tưởng suy luận kiểu từ ngữ cảnh với generic inference dùng toán tử diamond (`<>`) (ý tưởng này thậm chí còn có thể tìm thấy sớm hơn với các phương thức generic). Một biểu thức khởi tạo thể hiện của class có thể xuất hiện trong hai hay nhiều ngữ cảnh khác nhau, và đối số kiểu phù hợp sẽ được suy ra như minh hoạ dưới đây:
>
> ```java
> List<String> listOfStrings = new ArrayList<>();
> List<Integer> listOfIntegers = new ArrayList<>();
> ```

> **Quy tắc đặc biệt về tính tương thích với void**
>
> Nếu một lambda có một biểu thức-câu lệnh (statement expression) làm thân của nó, thì nó tương thích với một function descriptor trả về `void` (với điều kiện danh sách tham số cũng tương thích). Ví dụ, cả hai dòng sau đều hợp lệ mặc dù phương thức `add` của một `List` trả về `boolean` chứ không phải `void` như được mong đợi trong ngữ cảnh `Consumer` (`T -> void`):
>
> ```java
> // Predicate có kiểu trả về boolean
> Predicate<String> p = (String s) -> list.add(s);
>
> // Consumer có kiểu trả về void
> Consumer<String> b = (String s) -> list.add(s);
> ```

Đến giờ bạn hẳn đã hiểu rõ khi nào và ở đâu bạn được phép dùng lambda expression. Chúng có thể lấy target type từ ngữ cảnh gán, ngữ cảnh gọi phương thức (tham số và giá trị trả về), và ngữ cảnh ép kiểu (cast). Để kiểm tra kiến thức của bạn, hãy thử quiz 3.5.

---

**Quiz 3.5: Kiểm tra kiểu — tại sao đoạn code sau không biên dịch được?**

Bạn có thể khắc phục vấn đề như thế nào?

```java
Object o = () -> { System.out.println("Tricky example"); };
```

**Đáp án:**

Ngữ cảnh của lambda expression là `Object` (target type). Nhưng `Object` không phải là một functional interface. Để khắc phục điều này bạn có thể đổi target type thành `Runnable`, vốn biểu diễn function descriptor `() -> void`:

```java
Runnable r = () -> { System.out.println("Tricky example"); };
```

Bạn cũng có thể khắc phục vấn đề bằng cách ép kiểu lambda expression thành `Runnable`, qua đó cung cấp target type một cách tường minh.

```java
Object o = (Runnable) () -> { System.out.println("Tricky example"); };
```

Kỹ thuật này có thể hữu ích trong ngữ cảnh overload với một phương thức nhận hai functional interface khác nhau nhưng có cùng function descriptor. Bạn có thể ép kiểu lambda để chỉ rõ một cách tường minh chữ ký phương thức nào nên được chọn.

Ví dụ, lời gọi `execute(() -> {})` sử dụng phương thức `execute` như dưới đây sẽ mơ hồ, bởi vì cả `Runnable` và `Action` đều có cùng function descriptor:

```java
public void execute(Runnable runnable) {
    runnable.run();
}

public void execute(Action<T> action) {
    action.act();
}

@FunctionalInterface
interface Action {
    void act();
}
```

Nhưng bạn có thể khử mơ hồ một cách tường minh bằng cách dùng một biểu thức ép kiểu: `execute((Action) () -> {});`

---

Bạn đã thấy cách target type có thể được dùng để kiểm tra xem một lambda có thể được dùng trong một ngữ cảnh cụ thể hay không. Nó cũng có thể được dùng để làm một việc hơi khác: suy luận kiểu của các tham số của một lambda.

### 3.5.3. Suy luận kiểu (type inference)

Bạn có thể đơn giản hoá code của mình thêm một bước nữa. Compiler của Java suy ra functional interface nào cần liên kết với một lambda expression từ ngữ cảnh xung quanh nó (target type), nghĩa là nó cũng có thể suy ra chữ ký phù hợp cho lambda bởi vì function descriptor có sẵn thông qua target type. Lợi ích là compiler có quyền truy cập vào kiểu của các tham số của một lambda expression, và chúng có thể được lược bỏ trong cú pháp lambda. Compiler của Java suy luận kiểu của các tham số của một lambda như minh hoạ dưới đây:[3]

> [3] Lưu ý rằng khi một lambda chỉ có một tham số duy nhất mà kiểu của nó được suy ra, cặp ngoặc đơn bao quanh tên tham số cũng có thể được lược bỏ.

```java
// Không có kiểu tường minh trên tham số apple
List<Apple> greenApples =
        filter(inventory, apple -> GREEN.equals(apple.getColor()));
```

Lợi ích về tính dễ đọc của code còn dễ nhận thấy hơn với những lambda expression có nhiều tham số. Ví dụ, đây là cách tạo một đối tượng `Comparator`:

```java
// Không có type inference
Comparator<Apple> c =
        (Apple a1, Apple a2) -> a1.getWeight().compareTo(a2.getWeight());

// Có type inference
Comparator<Apple> c =
        (a1, a2) -> a1.getWeight().compareTo(a2.getWeight());
```

Lưu ý rằng đôi khi ghi kiểu một cách tường minh lại dễ đọc hơn, và đôi khi lược bỏ chúng đi lại dễ đọc hơn. Không có quy tắc nào nói cách nào tốt hơn; các lập trình viên phải tự đưa ra lựa chọn về điều gì làm cho code của họ dễ đọc hơn.

### 3.5.4. Sử dụng biến cục bộ

Tất cả các lambda expression mà chúng tôi trình bày cho tới nay đều chỉ dùng đối số của chính chúng bên trong thân hàm. Nhưng lambda expression cũng được phép dùng các biến tự do (free variable — những biến không phải tham số và được định nghĩa ở phạm vi bên ngoài) giống như anonymous class có thể làm. Chúng được gọi là **capturing lambda** (lambda có bắt biến). Ví dụ, lambda sau đây capture biến `portNumber`:

```java
int portNumber = 1337;
Runnable r = () -> System.out.println(portNumber);
```

Tuy nhiên, có một điểm hơi khác biệt. Có một số hạn chế về những gì bạn có thể làm với các biến này. Lambda được phép capture (tham chiếu trong thân của chúng) các biến thể hiện (instance variable) và biến static mà không có hạn chế nào. Nhưng khi biến cục bộ được capture, chúng phải được khai báo `final` một cách tường minh hoặc phải là effectively final. Lambda expression có thể capture các biến cục bộ chỉ được gán giá trị đúng một lần. (Lưu ý: việc capture một biến thể hiện có thể được xem như capture biến cục bộ `final` là `this`.) Ví dụ, đoạn code sau không biên dịch được vì biến `portNumber` được gán giá trị hai lần:

```java
int portNumber = 1337;
// Lỗi: biến cục bộ portNumber không phải final hoặc effectively final.
Runnable r = () -> System.out.println(portNumber);
portNumber = 31337;
```

> **Các hạn chế đối với biến cục bộ**
>
> Bạn có thể tự hỏi tại sao biến cục bộ lại có những hạn chế này. Thứ nhất, có một khác biệt then chốt trong cách biến thể hiện và biến cục bộ được cài đặt ở phía sau hậu trường. Biến thể hiện được lưu trên heap, trong khi biến cục bộ sống trên stack. Nếu một lambda có thể truy cập trực tiếp biến cục bộ và lambda đó được dùng trong một thread, thì thread đang dùng lambda có thể cố truy cập biến sau khi thread đã cấp phát biến đó đã giải phóng nó. Do đó, Java cài đặt việc truy cập một biến cục bộ tự do dưới dạng truy cập vào một bản sao của nó, thay vì truy cập vào biến gốc. Điều này không tạo ra khác biệt gì nếu biến cục bộ chỉ được gán giá trị đúng một lần — do đó mới có hạn chế này.
>
> Thứ hai, hạn chế này cũng ngăn cản những mẫu hình lập trình mệnh lệnh điển hình (mà, như chúng tôi giải thích ở các chương sau, cản trở việc song song hoá dễ dàng) vốn thay đổi giá trị của một biến ở phạm vi bên ngoài.

> **Closure**
>
> Có thể bạn đã nghe tới thuật ngữ *closure* và đang tự hỏi liệu lambda có đáp ứng định nghĩa của một closure hay không (đừng nhầm với ngôn ngữ lập trình Clojure). Nói một cách khoa học, một closure là một thể hiện của một hàm có thể tham chiếu tới các biến không cục bộ của hàm đó mà không bị hạn chế nào. Ví dụ, một closure có thể được truyền làm đối số cho một hàm khác. Nó cũng có thể truy cập và sửa đổi các biến được định nghĩa bên ngoài phạm vi của nó. Bây giờ, lambda và anonymous class trong Java 8 làm điều gì đó tương tự closure: chúng có thể được truyền làm đối số cho các phương thức và có thể truy cập các biến bên ngoài phạm vi của chúng. Nhưng chúng có một hạn chế: chúng không thể sửa đổi nội dung của các biến cục bộ của phương thức nơi lambda được định nghĩa. Những biến đó phải ngầm định là `final`. Sẽ hữu ích khi nghĩ rằng lambda bao đóng lên *giá trị* chứ không phải lên *biến*. Như đã giải thích ở trên, hạn chế này tồn tại vì biến cục bộ sống trên stack và ngầm định bị giới hạn trong thread mà chúng thuộc về. Cho phép capture các biến cục bộ có thể thay đổi sẽ mở ra những khả năng mới không an toàn với thread, điều này là không mong muốn (biến thể hiện thì không sao vì chúng sống trên heap, vốn được chia sẻ giữa các thread).

Bây giờ chúng tôi sẽ mô tả một tính năng tuyệt vời khác được đưa vào code Java 8: method reference. Hãy coi chúng như phiên bản viết tắt của một số lambda nhất định.

## 3.6. Method reference

Method reference cho phép bạn tái sử dụng những định nghĩa phương thức có sẵn và truyền chúng đi giống như lambda. Trong một số trường hợp chúng trông dễ đọc hơn và cho cảm giác tự nhiên hơn so với dùng lambda expression. Đây là ví dụ sắp xếp của chúng ta được viết bằng method reference với một chút trợ giúp từ API cập nhật của Java 8 (chúng ta sẽ khám phá ví dụ này chi tiết hơn ở mục 3.7).

Trước đây:

```java
inventory.sort((Apple a1, Apple a2) ->
        a1.getWeight().compareTo(a2.getWeight()));
```

Sau này (dùng method reference và `java.util.Comparator.comparing`):

```java
inventory.sort(comparing(Apple::getWeight));    // Method reference đầu tiên của bạn
```

Đừng lo về cú pháp mới và cách mọi thứ hoạt động. Bạn sẽ học điều đó trong vài mục kế tiếp!

### 3.6.1. Tổng quan nhanh

Tại sao bạn nên quan tâm tới method reference? Method reference có thể được xem như cách viết tắt cho những lambda chỉ gọi một phương thức cụ thể. Ý tưởng cơ bản là nếu một lambda biểu diễn “gọi trực tiếp phương thức này”, thì tốt nhất là tham chiếu tới phương thức đó bằng tên thay vì bằng một mô tả về cách gọi nó. Thật vậy, một method reference cho phép bạn tạo một lambda expression từ một phần cài đặt phương thức đã có. Nhưng bằng cách tham chiếu tới tên phương thức một cách tường minh, code của bạn có thể đạt được tính dễ đọc tốt hơn. Nó hoạt động thế nào? Khi bạn cần một method reference, tham chiếu đích được đặt trước dấu phân cách `::` và tên phương thức được cung cấp sau nó. Ví dụ, `Apple::getWeight` là một method reference tới phương thức `getWeight` được định nghĩa trong class `Apple`. (Hãy nhớ rằng không cần cặp ngoặc đơn sau `getWeight` bởi vì bạn không gọi nó ở thời điểm này, bạn chỉ đơn thuần trích dẫn tên của nó.) Method reference này là cách viết tắt cho lambda expression `(Apple apple) -> apple.getWeight()`. Bảng 3.4 đưa ra thêm vài ví dụ về các method reference khả dĩ trong Java 8.

**Bảng 3.4. Ví dụ về lambda và method reference tương đương**

| Lambda | Method reference tương đương |
|---|---|
| `(Apple apple) -> apple.getWeight()` | `Apple::getWeight` |
| `() -> Thread.currentThread().dumpStack()` | `Thread.currentThread()::dumpStack` |
| `(str, i) -> str.substring(i)` | `String::substring` |
| `(String s) -> System.out.println(s)` | `System.out::println` |
| `(String s) -> this.isValidName(s)` | `this::isValidName` |

Bạn có thể coi method reference như đường cú pháp (syntactic sugar) cho những lambda chỉ tham chiếu tới một phương thức duy nhất, bởi vì bạn viết ít hơn để diễn đạt cùng một điều.

> **Công thức xây dựng method reference**
>
> Có ba loại method reference chính:
>
> 1. Một method reference tới một static method (ví dụ, phương thức `parseInt` của `Integer`, viết là `Integer::parseInt`)
> 2. Một method reference tới một phương thức thể hiện của một kiểu bất kỳ (ví dụ, phương thức `length` của `String`, viết là `String::length`)
> 3. Một method reference tới một phương thức thể hiện của một đối tượng hoặc biểu thức đã tồn tại (ví dụ, giả sử bạn có một biến cục bộ `expensiveTransaction` giữ một đối tượng kiểu `Transaction`, vốn hỗ trợ một phương thức thể hiện `getValue`; bạn có thể viết `expensiveTransaction::getValue`)

Loại method reference thứ hai và thứ ba ban đầu có thể hơi khó nắm bắt. Ý tưởng của loại method reference thứ hai, chẳng hạn `String::length`, là bạn đang tham chiếu tới một phương thức trên một đối tượng sẽ được cung cấp dưới dạng một trong các tham số của lambda. Ví dụ, lambda expression `(String s) -> s.toUpperCase()` có thể được viết lại thành `String::toUpperCase`. Còn loại method reference thứ ba đề cập tới tình huống khi bạn đang gọi một phương thức trong một lambda trên một đối tượng bên ngoài đã tồn tại sẵn. Ví dụ, lambda expression `() -> expensiveTransaction.getValue()` có thể được viết lại thành `expensiveTransaction::getValue`. Loại method reference thứ ba này đặc biệt hữu ích khi bạn cần truyền đi một phương thức được định nghĩa như một hàm trợ giúp private. Ví dụ, giả sử bạn định nghĩa một phương thức trợ giúp `isValidName`:

```java
private boolean isValidName(String string) {
    return Character.isUpperCase(string.charAt(0));
}
```

Bây giờ bạn có thể truyền phương thức này đi trong ngữ cảnh của một `Predicate<String>` bằng cách dùng method reference:

```java
filter(words, this::isValidName)
```

Để giúp bạn tiêu hoá kiến thức mới này, các quy tắc viết tắt để refactor một lambda expression thành một method reference tương đương tuân theo những công thức đơn giản, được trình bày ở hình 3.5.

> **Hình 3.5.** Các công thức xây dựng method reference cho ba loại lambda expression khác nhau

Lưu ý rằng cũng có những dạng đặc biệt của method reference dành cho constructor, constructor mảng, và lời gọi `super`. Hãy áp dụng method reference vào một ví dụ cụ thể. Giả sử bạn muốn sắp xếp một `List` các chuỗi, bỏ qua sự khác biệt chữ hoa chữ thường. Phương thức `sort` trên một `List` mong đợi một `Comparator` làm tham số. Bạn đã thấy trước đó rằng `Comparator` mô tả một function descriptor với chữ ký `(T, T) -> int`. Bạn có thể định nghĩa một lambda expression dùng phương thức `compareToIgnoreCase` trong class `String` như sau (lưu ý rằng `compareToIgnoreCase` đã được định nghĩa sẵn trong class `String`):

```java
List<String> str = Arrays.asList("a", "b", "A", "B");
str.sort((s1, s2) -> s1.compareToIgnoreCase(s2));
```

Lambda expression này có chữ ký tương thích với function descriptor của `Comparator`. Dùng các công thức đã mô tả ở trên, ví dụ này cũng có thể được viết bằng một method reference; kết quả là code ngắn gọn hơn, như sau:

```java
List<String> str = Arrays.asList("a", "b", "A", "B");
str.sort(String::compareToIgnoreCase);
```

Lưu ý rằng compiler thực hiện một quá trình kiểm tra kiểu tương tự như đối với lambda expression để xác định xem một method reference có hợp lệ với một functional interface cho trước hay không. Chữ ký của method reference phải khớp với kiểu của ngữ cảnh.

Để kiểm tra mức độ hiểu bài của bạn về method reference, hãy thử quiz 3.6!

---

**Quiz 3.6: Method reference**

Method reference tương đương của các lambda expression sau đây là gì?

1.
```java
ToIntFunction<String> stringToInt =
        (String s) -> Integer.parseInt(s);
```

2.
```java
BiPredicate<List<String>, String> contains =
        (list, element) -> list.contains(element);
```

3.
```java
Predicate<String> startsWithNumber =
        (String string) -> this.startsWithNumber(string);
```

**Đáp án:**

1. Lambda expression này chuyển tiếp đối số của nó cho static method `parseInt` của `Integer`. Phương thức này nhận một `String` để phân tích và trả về một `int`. Kết quả là, lambda có thể được viết lại theo công thức 1 ở hình 3.5 (lambda expression gọi một static method) như sau:

```java
ToIntFunction<String> stringToInt = Integer::parseInt;
```

2. Lambda này dùng đối số đầu tiên của nó để gọi phương thức `contains` trên đối số đó. Bởi vì đối số đầu tiên thuộc kiểu `List`, bạn có thể dùng công thức 2 ở hình 3.5 như sau:

```java
BiPredicate<List<String>, String> contains = List::contains;
```

Điều này là vì target type mô tả một function descriptor `(List<String>, String) -> boolean`, và `List::contains` có thể được khai triển ra thành function descriptor đó.

3. Biểu thức lambda dạng biểu thức này gọi một phương thức trợ giúp private. Bạn có thể dùng công thức 3 ở hình 3.5 như sau:

```java
Predicate<String> startsWithNumber = this::startsWithNumber;
```

---

Chúng tôi mới chỉ trình bày cách tái sử dụng các phần cài đặt phương thức đã có và tạo method reference. Nhưng bạn có thể làm điều tương tự với các constructor của một class.

### 3.6.2. Constructor reference

Bạn có thể tạo một tham chiếu tới một constructor đã có bằng cách dùng tên của nó và từ khoá `new` như sau: `ClassName::new`. Nó hoạt động tương tự như một tham chiếu tới một static method. Ví dụ, giả sử có một constructor không đối số. Nó khớp với chữ ký `() -> Apple` của `Supplier`; bạn có thể làm như sau:

```java
Supplier<Apple> c1 = Apple::new;    // Constructor reference tới constructor mặc định Apple()
Apple a1 = c1.get();                // Gọi phương thức get của Supplier tạo ra một Apple mới.
```

tương đương với

```java
// Lambda expression tạo một Apple dùng constructor mặc định
Supplier<Apple> c1 = () -> new Apple();
Apple a1 = c1.get();    // Gọi phương thức get của Supplier tạo ra một Apple mới.
```

Nếu bạn có một constructor với chữ ký `Apple(Integer weight)`, nó khớp với chữ ký của interface `Function`, nên bạn có thể làm thế này:

```java
Function<Integer, Apple> c2 = Apple::new;    // Constructor reference tới Apple(Integer weight)
// Gọi phương thức apply của Function với một cân nặng cho trước tạo ra một Apple.
Apple a2 = c2.apply(110);
```

tương đương với

```java
// Lambda expression tạo một Apple với một cân nặng cho trước
Function<Integer, Apple> c2 = (weight) -> new Apple(weight);
// Gọi phương thức apply của Function với một cân nặng cho trước
// tạo ra một đối tượng Apple mới.
Apple a2 = c2.apply(110);
```

Trong đoạn code sau, mỗi phần tử của một `List` các `Integer` được truyền cho constructor của `Apple` bằng một phương thức `map` tương tự cái chúng ta đã định nghĩa trước đó, kết quả là một `List` các quả táo với những cân nặng khác nhau:

```java
List<Integer> weights = Arrays.asList(7, 3, 4, 10);
// Truyền một constructor reference cho phương thức map
List<Apple> apples = map(weights, Apple::new);

public List<Apple> map(List<Integer> list, Function<Integer, Apple> f) {
    List<Apple> result = new ArrayList<>();
    for (Integer i : list) {
        result.add(f.apply(i));
    }
    return result;
}
```

Nếu bạn có một constructor hai đối số, `Apple(Color color, Integer weight)`, nó khớp với chữ ký của interface `BiFunction`, nên bạn có thể làm thế này:

```java
// Constructor reference tới Apple(Color color, Integer weight)
BiFunction<Color, Integer, Apple> c3 = Apple::new;
// Phương thức apply của BiFunction với một màu và cân nặng cho trước
// tạo ra một đối tượng Apple mới.
Apple a3 = c3.apply(GREEN, 110);
```

tương đương với

```java
// Lambda expression tạo một Apple với một màu và cân nặng cho trước
BiFunction<String, Integer, Apple> c3 =
        (color, weight) -> new Apple(color, weight);
// Phương thức apply của BiFunction với một màu và cân nặng cho trước
// tạo ra một đối tượng Apple mới.
Apple a3 = c3.apply(GREEN, 110);
```

Khả năng tham chiếu tới một constructor mà không khởi tạo nó mở ra những ứng dụng thú vị. Ví dụ, bạn có thể dùng một `Map` để liên kết các constructor với một giá trị chuỗi. Sau đó bạn có thể tạo một phương thức `giveMeFruit` mà, với một `String` và một `Integer`, có thể tạo ra những loại trái cây khác nhau với những cân nặng khác nhau, như sau:

```java
static Map<String, Function<Integer, Fruit>> map = new HashMap<>();
static {
    map.put("apple", Apple::new);
    map.put("orange", Orange::new);
    // etc...
}

public static Fruit giveMeFruit(String fruit, Integer weight) {
    // Lấy một Function<Integer, Fruit> từ map
    return map.get(fruit.toLowerCase())
            // Phương thức apply của Function với tham số cân nặng kiểu Integer
            // tạo ra loại Fruit được yêu cầu.
            .apply(weight);
}
```

Để kiểm tra mức độ hiểu bài của bạn về method reference và constructor reference, hãy thử quiz 3.7.

---

**Quiz 3.7: Constructor reference**

Bạn đã thấy cách biến các constructor không đối số, một đối số, và hai đối số thành constructor reference. Bạn cần làm gì để dùng một constructor reference cho một constructor ba đối số, chẳng hạn `RGB(int, int, int)`?

**Đáp án:**

Bạn đã thấy rằng cú pháp cho một constructor reference là `ClassName::new`, nên trong trường hợp này nó là `RGB::new`. Nhưng bạn cần một functional interface khớp với chữ ký của constructor reference đó. Bởi vì không có sẵn cái nào trong bộ functional interface khởi đầu, bạn có thể tạo cái của riêng mình:

```java
public interface TriFunction<T, U, V, R> {
    R apply(T t, U u, V v);
}
```

Và bây giờ bạn có thể dùng constructor reference như sau:

```java
TriFunction<Integer, Integer, Integer, RGB> colorFactory = RGB::new;
```

---

Chúng ta đã đi qua rất nhiều thông tin mới: lambda, functional interface, và method reference. Chúng ta sẽ đưa tất cả vào thực hành ở mục kế tiếp.

## 3.7. Đưa lambda và method reference vào thực tế

Để khép lại chương này cùng phần thảo luận của chúng ta về lambda, chúng ta sẽ tiếp tục với bài toán ban đầu là sắp xếp một danh sách các `Apple` với những chiến lược sắp thứ tự khác nhau. Và chúng tôi sẽ chỉ cho bạn cách tiến hoá dần dần một giải pháp ngây thơ thành một giải pháp ngắn gọn, sử dụng tất cả các khái niệm và tính năng đã được giải thích cho tới nay trong cuốn sách: behavior parameterization, anonymous class, lambda expression, và method reference. Giải pháp cuối cùng mà chúng ta hướng tới là như sau (lưu ý rằng toàn bộ mã nguồn có sẵn trên website của cuốn sách: www.manning.com/books/modern-java-in-action):

```java
inventory.sort(comparing(Apple::getWeight));
```

### 3.7.1. Bước 1: Truyền code

Bạn thật may mắn; API của Java 8 đã cung cấp sẵn cho bạn một phương thức `sort` trên `List` nên bạn không phải tự cài đặt nó. Phần khó đã xong! Nhưng làm sao bạn có thể truyền một chiến lược sắp thứ tự cho phương thức `sort`? Vâng, phương thức `sort` có chữ ký sau:

```java
void sort(Comparator<? super E> c)
```

Nó mong đợi một đối tượng `Comparator` làm đối số để so sánh hai quả `Apple`! Đây là cách bạn có thể truyền những chiến lược khác nhau trong Java: chúng phải được bọc trong một đối tượng. Chúng ta nói rằng hành vi của `sort` được tham số hoá: hành vi của nó sẽ khác nhau tuỳ theo những chiến lược sắp thứ tự khác nhau được truyền vào cho nó.

Giải pháp đầu tiên của bạn trông như thế này:

```java
public class AppleComparator implements Comparator<Apple> {
    public int compare(Apple a1, Apple a2) {
        return a1.getWeight().compareTo(a2.getWeight());
    }
}

inventory.sort(new AppleComparator());
```

### 3.7.2. Bước 2: Dùng anonymous class

Thay vì cài đặt `Comparator` chỉ để khởi tạo nó một lần duy nhất, bạn đã thấy rằng bạn có thể dùng một anonymous class để cải tiến giải pháp của mình:

```java
inventory.sort(new Comparator<Apple>() {
    public int compare(Apple a1, Apple a2) {
        return a1.getWeight().compareTo(a2.getWeight());
    }
});
```

### 3.7.3. Bước 3: Dùng lambda expression

Nhưng giải pháp hiện tại của bạn vẫn còn dài dòng. Java 8 giới thiệu lambda expression, thứ cung cấp một cú pháp nhẹ nhàng để đạt được cùng mục tiêu: truyền code. Bạn đã thấy rằng một lambda expression có thể được dùng ở nơi mà một functional interface được mong đợi. Nhắc lại, một functional interface là một interface chỉ định nghĩa một phương thức trừu tượng duy nhất. Chữ ký của phương thức trừu tượng đó (gọi là function descriptor) có thể mô tả chữ ký của một lambda expression. Trong trường hợp này, `Comparator` biểu diễn một function descriptor `(T, T) -> int`. Bởi vì bạn đang dùng `Apple`, nó biểu diễn cụ thể hơn là `(Apple, Apple) -> int`. Do đó giải pháp cải tiến mới của bạn trông như sau:

```java
inventory.sort((Apple a1, Apple a2)
        -> a1.getWeight().compareTo(a2.getWeight())
);
```

Chúng tôi đã giải thích rằng compiler của Java có thể suy ra kiểu của các tham số của một lambda expression bằng cách dùng ngữ cảnh nơi lambda xuất hiện. Do đó bạn có thể viết lại giải pháp của mình như sau:

```java
inventory.sort((a1, a2) -> a1.getWeight().compareTo(a2.getWeight()));
```

Bạn có thể làm cho code của mình dễ đọc hơn nữa không? `Comparator` có một static method trợ giúp tên `comparing`, nhận một `Function` trích xuất một khoá `Comparable` và tạo ra một đối tượng `Comparator` (chúng tôi giải thích tại sao interface có thể có static method ở chương 13). Nó có thể được dùng như sau (lưu ý rằng bây giờ bạn truyền một lambda chỉ có một đối số; lambda này chỉ rõ cách trích xuất khoá dùng để so sánh từ một `Apple`):

```java
Comparator<Apple> c = Comparator.comparing((Apple a) -> a.getWeight());
```

Bây giờ bạn có thể viết lại giải pháp của mình dưới dạng gọn gàng hơn một chút:

```java
import static java.util.Comparator.comparing;
inventory.sort(comparing(apple -> apple.getWeight()));
```

### 3.7.4. Bước 4: Dùng method reference

Chúng tôi đã giải thích rằng method reference là đường cú pháp cho những lambda expression chỉ chuyển tiếp đối số của chúng. Bạn có thể dùng một method reference để làm cho code của mình bớt dài dòng hơn một chút (giả sử đã có static import cho `java.util.Comparator.comparing`):

```java
inventory.sort(comparing(Apple::getWeight));
```

Xin chúc mừng, đây là giải pháp cuối cùng của bạn! Tại sao nó lại tốt hơn code trước Java 8? Không chỉ vì nó ngắn hơn; mà còn vì ý nghĩa của nó quá rõ ràng. Code đọc lên giống như phát biểu của bài toán: “sắp xếp kho hàng bằng cách so sánh cân nặng của các quả táo.”

## 3.8. Những phương thức hữu ích để kết hợp lambda expression

Một số functional interface trong API của Java 8 chứa các phương thức tiện ích. Cụ thể, nhiều functional interface như `Comparator`, `Function`, và `Predicate` vốn được dùng để truyền lambda expression đều cung cấp những phương thức cho phép kết hợp (composition). Điều này nghĩa là gì? Trong thực tế nó có nghĩa là bạn có thể kết hợp vài lambda expression đơn giản để xây dựng những lambda expression phức tạp hơn. Ví dụ, bạn có thể kết hợp hai predicate thành một predicate lớn hơn thực hiện phép `or` giữa hai predicate đó. Hơn nữa, bạn cũng có thể kết hợp các hàm sao cho kết quả của hàm này trở thành đầu vào của hàm kia. Bạn có thể tự hỏi làm sao lại có thể có thêm những phương thức khác trong một functional interface. (Suy cho cùng, điều này đi ngược lại định nghĩa của một functional interface!) Mẹo ở đây là những phương thức mà chúng tôi sắp giới thiệu được gọi là default method (chúng không phải là phương thức trừu tượng). Chúng tôi giải thích chúng chi tiết ở chương 13. Tạm thời, hãy tin chúng tôi và đọc chương 13 sau, khi bạn muốn tìm hiểu thêm về default method và những gì bạn có thể làm với chúng.

### 3.8.1. Kết hợp các Comparator

Bạn đã thấy rằng bạn có thể dùng static method `Comparator.comparing` để trả về một `Comparator` dựa trên một `Function` trích xuất khoá dùng để so sánh, như sau:

```java
Comparator<Apple> c = Comparator.comparing(Apple::getWeight);
```

**Đảo ngược thứ tự**

Nếu bạn muốn sắp xếp các quả táo theo cân nặng giảm dần thì sao? Không cần phải tạo một thể hiện `Comparator` khác. Interface này bao gồm một default method `reversed` đảo ngược thứ tự của một comparator cho trước. Bạn có thể sửa ví dụ trước đó để sắp xếp các quả táo theo cân nặng giảm dần bằng cách tái sử dụng `Comparator` ban đầu:

```java
inventory.sort(comparing(Apple::getWeight).reversed());    // Sắp xếp theo cân nặng giảm dần
```

**Nối chuỗi các Comparator**

Tất cả những điều này đều hay, nhưng nếu bạn gặp hai quả táo có cùng cân nặng thì sao? Quả táo nào nên được ưu tiên trong danh sách đã sắp xếp? Bạn có thể muốn cung cấp một `Comparator` thứ hai để tinh chỉnh thêm phép so sánh. Ví dụ, sau khi hai quả táo được so sánh dựa trên cân nặng, bạn có thể muốn sắp xếp chúng theo quốc gia xuất xứ. Phương thức `thenComparing` cho phép bạn làm điều đó. Nó nhận một hàm làm tham số (giống như phương thức `comparing`) và cung cấp một `Comparator` thứ hai nếu hai đối tượng được xem là bằng nhau theo `Comparator` ban đầu. Bạn có thể giải bài toán một cách thanh lịch một lần nữa như sau:

```java
inventory.sort(comparing(Apple::getWeight)
        .reversed()                            // Sắp xếp theo cân nặng giảm dần
        .thenComparing(Apple::getCountry));    // Sắp xếp tiếp theo quốc gia khi hai quả táo cùng cân nặng
```

### 3.8.2. Kết hợp các Predicate

Interface `Predicate` bao gồm ba phương thức cho phép bạn tái sử dụng một `Predicate` đã có để tạo ra những predicate phức tạp hơn: `negate`, `and`, và `or`. Ví dụ, bạn có thể dùng phương thức `negate` để trả về phủ định của một `Predicate`, chẳng hạn một quả táo *không* đỏ:

```java
// Tạo ra phủ định của đối tượng Predicate redApple đã có
Predicate<Apple> notRedApple = redApple.negate();
```

Bạn có thể muốn kết hợp hai lambda để nói rằng một quả táo vừa đỏ vừa nặng bằng phương thức `and`:

```java
// Nối hai predicate để tạo ra một đối tượng Predicate khác
Predicate<Apple> redAndHeavyApple =
        redApple.and(apple -> apple.getWeight() > 150);
```

Bạn có thể kết hợp predicate kết quả thêm một bước nữa để biểu diễn những quả táo vừa đỏ vừa nặng (trên 150 g) hoặc chỉ là những quả táo xanh:

```java
// Nối ba predicate để tạo ra một đối tượng Predicate phức tạp hơn
Predicate<Apple> redAndHeavyAppleOrGreen =
        redApple.and(apple -> apple.getWeight() > 150)
                .or(apple -> GREEN.equals(a.getColor()));
```

Tại sao điều này lại tuyệt vời? Từ những lambda expression đơn giản hơn, bạn có thể biểu diễn những lambda expression phức tạp hơn mà vẫn đọc lên như phát biểu của bài toán! Lưu ý rằng thứ tự ưu tiên của các phương thức `and` và `or` trong chuỗi là từ trái sang phải — không có gì tương đương với việc đặt dấu ngoặc. Vì vậy `a.or(b).and(c)` phải được đọc là `(a || b) && c`. Tương tự, `a.and(b).or(c)` phải được đọc là `(a && b) || c`.

### 3.8.3. Kết hợp các Function

Cuối cùng, bạn cũng có thể kết hợp những lambda expression được biểu diễn bởi interface `Function`. Interface `Function` đi kèm hai default method cho việc này, `andThen` và `compose`, cả hai đều trả về một thể hiện của `Function`.

Phương thức `andThen` trả về một hàm mà trước tiên áp dụng một hàm cho trước lên một đầu vào rồi sau đó áp dụng một hàm khác lên kết quả của phép áp dụng đó. Ví dụ, cho một hàm `f` tăng một số lên 1 (`x -> x + 1`) và một hàm khác `g` nhân một số với 2, bạn có thể kết hợp chúng để tạo ra một hàm `h` trước tiên tăng một số lên rồi sau đó nhân kết quả với 2:

```java
Function<Integer, Integer> f = x -> x + 1;
Function<Integer, Integer> g = x -> x * 2;
// Trong toán học bạn sẽ viết là g(f(x)) hoặc (g o f)(x).
Function<Integer, Integer> h = f.andThen(g);
int result = h.apply(1);    // Kết quả trả về là 4.
```

Bạn cũng có thể dùng phương thức `compose` một cách tương tự để trước tiên áp dụng hàm được truyền làm đối số cho `compose` rồi sau đó áp dụng hàm gốc lên kết quả. Ví dụ, trong ví dụ trước nếu dùng `compose`, nó sẽ có nghĩa là `f(g(x))` thay vì `g(f(x))` như khi dùng `andThen`:

```java
Function<Integer, Integer> f = x -> x + 1;
Function<Integer, Integer> g = x -> x * 2;
// Trong toán học bạn sẽ viết là f(g(x)) hoặc (f o g)(x).
Function<Integer, Integer> h = f.compose(g);
int result = h.apply(1);    // Kết quả trả về là 3.
```

Hình 3.6 minh hoạ sự khác biệt giữa `andThen` và `compose`.

> **Hình 3.6.** Dùng `andThen` so với `compose`

Tất cả những điều này nghe có vẻ hơi trừu tượng. Làm sao bạn có thể dùng chúng trong thực tế? Giả sử bạn có nhiều phương thức tiện ích thực hiện các phép biến đổi văn bản trên một lá thư được biểu diễn dưới dạng một `String`:

```java
public class Letter {
    public static String addHeader(String text) {
        return "From Raoul, Mario and Alan: " + text;
    }

    public static String addFooter(String text) {
        return text + " Kind regards";
    }

    public static String checkSpelling(String text) {
        return text.replaceAll("labda", "lambda");
    }
}
```

Bây giờ bạn có thể tạo ra nhiều pipeline biến đổi khác nhau bằng cách kết hợp các phương thức tiện ích này. Ví dụ, tạo một pipeline trước tiên thêm header, sau đó kiểm tra chính tả, và cuối cùng thêm footer, như minh hoạ dưới đây (và như được thể hiện ở hình 3.7):

> **Hình 3.7.** Một pipeline biến đổi sử dụng `andThen`

```java
Function<String, String> addHeader = Letter::addHeader;
Function<String, String> transformationPipeline
        = addHeader.andThen(Letter::checkSpelling)
                   .andThen(Letter::addFooter);
```

Một pipeline thứ hai có thể chỉ thêm header và footer mà không kiểm tra chính tả:

```java
Function<String, String> addHeader = Letter::addHeader;
Function<String, String> transformationPipeline
        = addHeader.andThen(Letter::addFooter);
```

## 3.9. Những ý tưởng tương tự từ toán học

Nếu bạn thấy thoải mái với toán học phổ thông, mục này đưa ra một góc nhìn khác về ý tưởng lambda expression và việc truyền hàm đi. Bạn cứ tự nhiên bỏ qua nó; không có phần nào khác trong cuốn sách phụ thuộc vào nó. Nhưng có thể bạn sẽ thích thú khi thấy một góc nhìn khác.

### 3.9.1. Tích phân

Giả sử bạn có một hàm `f` (theo nghĩa toán học, không phải Java), có thể được định nghĩa là

f(x) = x + 10

Khi đó, một câu hỏi thường được đặt ra (ở trường học và trong các ngành khoa học và kỹ thuật) là tìm diện tích bên dưới đồ thị hàm số khi vẽ nó trên giấy (coi trục x là đường số 0). Ví dụ, bạn viết

cho phần diện tích được thể hiện ở hình 3.8.

> **Hình 3.8.** Diện tích bên dưới hàm f(x) = x + 10 với x chạy từ 3 đến 7

Trong ví dụ này, hàm `f` là một đường thẳng, và vì vậy bạn có thể dễ dàng tính ra diện tích này bằng phương pháp hình thang (vẽ các tam giác và hình chữ nhật) để tìm ra lời giải:

1/2 × ((3 + 10) + (7 + 10)) × (7 – 3) = 60

Bây giờ, làm thế nào bạn có thể diễn đạt điều này trong Java? Vấn đề đầu tiên của bạn là dung hoà những ký hiệu lạ lẫm như dấu tích phân hay dy/dx với ký hiệu quen thuộc của ngôn ngữ lập trình.

Thật vậy, suy nghĩ từ những nguyên lý cơ bản, bạn cần một phương thức, có lẽ tên là `integrate`, nhận ba đối số: một là `f`, và những đối số còn lại là các cận (3.0 và 7.0 ở đây). Vì thế, bạn muốn viết trong Java một thứ gì đó trông như thế này, trong đó hàm `f` được truyền làm đối số:

```java
integrate(f, 3, 7)
```

Lưu ý rằng bạn không thể viết một thứ đơn giản như

```java
integrate(x + 10, 3, 7)
```

vì hai lý do. Thứ nhất, phạm vi của `x` không rõ ràng, và thứ hai, cách viết này sẽ truyền một giá trị `x+10` cho `integrate` thay vì truyền hàm `f`.

Thật vậy, vai trò thầm lặng của `dx` trong toán học là để nói rằng “cái hàm nhận đối số x mà kết quả của nó là x + 10.”

### 3.9.2. Kết nối với lambda của Java 8

Như chúng tôi đã đề cập trước đó, Java 8 dùng ký hiệu `(double x) -> x + 10` (một lambda expression) chính xác cho mục đích này; do đó bạn có thể viết

```java
integrate((double x) -> x + 10, 3, 7)
```

hoặc

```java
integrate((double x) -> f(x), 3, 7)
```

hoặc, dùng một method reference như đã đề cập trước đó,

```java
integrate(C::f, 3, 7)
```

nếu `C` là một class chứa `f` như một static method. Ý tưởng là bạn đang truyền code của `f` cho phương thức `integrate`.

Bây giờ có lẽ bạn tự hỏi làm sao để viết chính phương thức `integrate`. Vẫn tiếp tục giả sử rằng `f` là một hàm tuyến tính (đường thẳng). Có lẽ bạn muốn viết theo một dạng tương tự như trong toán học:

```java
// Code Java sai! (Bạn không thể viết hàm như cách bạn viết trong toán học.)
public double integrate((double -> double) f, double a, double b) {
    return (f(a) + f(b)) * (b - a) / 2.0;
}
```

Nhưng bởi vì lambda expression chỉ có thể được dùng trong một ngữ cảnh mong đợi một functional interface (trong trường hợp này là `DoubleFunction`[4]), bạn phải viết nó theo cách sau:

> [4] Dùng `DoubleFunction<Double>` hiệu quả hơn dùng `Function<Double, Double>` vì nó tránh được việc box kết quả.

```java
public double integrate(DoubleFunction<Double> f, double a, double b) {
    return (f.apply(a) + f.apply(b)) * (b - a) / 2.0;
}
```

hoặc dùng `DoubleUnaryOperator`, thứ cũng tránh được việc box kết quả:

```java
public double integrate(DoubleUnaryOperator f, double a, double b) {
    return (f.applyAsDouble(a) + f.applyAsDouble(b)) * (b - a) / 2.0;
}
```

Như một nhận xét bên lề, hơi đáng tiếc là bạn phải viết `f.apply(a)` thay vì chỉ đơn giản viết `f(a)` như trong toán học, nhưng Java đơn giản là không thể thoát khỏi quan điểm rằng mọi thứ đều là đối tượng thay vì ý tưởng rằng một hàm thực sự độc lập!

## Tóm tắt

- Một lambda expression có thể được hiểu như một dạng hàm vô danh: nó không có tên, nhưng nó có một danh sách tham số, một thân hàm, một kiểu trả về, và cũng có thể có một danh sách các ngoại lệ có thể được ném ra.
- Lambda expression cho phép bạn truyền code một cách ngắn gọn.
- Một functional interface là một interface khai báo đúng một phương thức trừu tượng.
- Lambda expression chỉ có thể được dùng ở nơi mà một functional interface được mong đợi.
- Lambda expression cho phép bạn cung cấp phần cài đặt của phương thức trừu tượng của một functional interface trực tiếp ngay tại chỗ và coi toàn bộ biểu thức như một thể hiện của functional interface đó.
- Java 8 đi kèm một danh sách các functional interface phổ biến trong package `java.util.function`, bao gồm `Predicate<T>`, `Function<T, R>`, `Supplier<T>`, `Consumer<T>`, và `BinaryOperator<T>`, được mô tả ở bảng 3.2.
- Các bản chuyên biệt hoá cho primitive của những functional interface generic phổ biến như `Predicate<T>` và `Function<T, R>` có thể được dùng để tránh các thao tác boxing: `IntPredicate`, `IntToLongFunction`, v.v.
- Execute-around pattern (dành cho khi bạn cần thực thi một hành vi cho trước ở giữa phần code khuôn mẫu cần thiết trong một phương thức, ví dụ, cấp phát và dọn dẹp tài nguyên) có thể được dùng cùng với lambda để đạt được tính linh hoạt và khả năng tái sử dụng cao hơn.
- Kiểu được mong đợi cho một lambda expression được gọi là target type.
- Method reference cho phép bạn tái sử dụng một phần cài đặt phương thức đã có và truyền nó đi trực tiếp.
- Các functional interface như `Comparator`, `Predicate`, và `Function` có vài default method có thể được dùng để kết hợp các lambda expression.
