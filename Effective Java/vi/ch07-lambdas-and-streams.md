# Chương 7. Lambda và Stream

Trong Java 8, functional interface, lambda và method reference đã được thêm vào để việc tạo function object (đối tượng hàm) trở nên dễ dàng hơn. Streams API được bổ sung song song với những thay đổi ngôn ngữ này nhằm cung cấp sự hỗ trợ ở mức thư viện cho việc xử lý các chuỗi phần tử dữ liệu. Trong chương này, chúng ta sẽ bàn về cách tận dụng tốt nhất những tiện ích đó.

## Item 42: Ưu tiên lambda hơn anonymous class

Trong lịch sử, các interface (hoặc hiếm hơn là abstract class) chỉ có một abstract method duy nhất được dùng làm *function type* (kiểu hàm). Các instance của chúng, được gọi là *function object* (đối tượng hàm), biểu diễn các hàm hoặc hành động. Kể từ khi JDK 1.1 được phát hành năm 1997, phương tiện chủ yếu để tạo một function object là *anonymous class* (lớp vô danh) (**Item 24**). Dưới đây là một đoạn mã sắp xếp một danh sách chuỗi theo độ dài, dùng anonymous class để tạo hàm so sánh cho phép sắp xếp (hàm này quy định thứ tự sắp xếp):

```java
// Anonymous class instance as a function object - obsolete!
Collections.sort(words, new Comparator<String>() {
    public int compare(String s1, String s2) {
        return Integer.compare(s1.length(), s2.length());
    }
});
```

Anonymous class là đủ dùng cho các mẫu thiết kế hướng đối tượng cổ điển cần đến function object, tiêu biểu là mẫu *Strategy* [**Gamma95**]. Interface `Comparator` biểu diễn một *abstract strategy* (chiến lược trừu tượng) cho việc sắp xếp; anonymous class ở trên là một *concrete strategy* (chiến lược cụ thể) để sắp xếp chuỗi. Tuy nhiên, sự dài dòng của anonymous class khiến lập trình hàm trong Java trở thành một viễn cảnh kém hấp dẫn.

Trong Java 8, ngôn ngữ đã chính thức hóa quan niệm rằng các interface chỉ có một abstract method là đặc biệt và xứng đáng được đối xử đặc biệt. Những interface này giờ đây được gọi là *functional interface*, và ngôn ngữ cho phép bạn tạo instance của chúng bằng *lambda expression* (biểu thức lambda), hay gọi tắt là *lambda*. Lambda có chức năng tương tự anonymous class nhưng súc tích hơn rất nhiều. Đây là đoạn mã ở trên sau khi thay anonymous class bằng lambda. Phần mã rườm rà đã biến mất, và hành vi của nó hiện lên rõ ràng:

```java
// Lambda expression as function object (replaces anonymous class)
Collections.sort(words,
        (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

Hãy để ý rằng kiểu của lambda (`Comparator<String>`), kiểu của các tham số (`s1` và `s2`, đều là `String`), và kiểu của giá trị trả về (`int`) đều không xuất hiện trong mã. Compiler suy ra những kiểu này từ ngữ cảnh, thông qua một quá trình gọi là *type inference* (suy luận kiểu). Trong một số trường hợp, compiler không thể xác định được kiểu, và bạn sẽ phải chỉ định chúng. Các quy tắc của type inference rất phức tạp: chúng chiếm trọn một chương trong JLS [JLS, 18]. Rất ít lập trình viên hiểu tường tận các quy tắc này, nhưng điều đó không sao cả. **Hãy bỏ qua kiểu của mọi tham số lambda trừ khi sự có mặt của chúng làm chương trình rõ ràng hơn.** Nếu compiler báo lỗi rằng nó không thể suy ra kiểu của một tham số lambda, *khi đó* hãy chỉ định kiểu. Đôi khi bạn có thể phải ép kiểu giá trị trả về hoặc toàn bộ biểu thức lambda, nhưng điều này hiếm khi xảy ra.

Có một lưu ý cần bổ sung liên quan đến type inference. **Item 26** khuyên bạn không dùng raw type, **Item 29** khuyên bạn ưu tiên generic type, và **Item 30** khuyên bạn ưu tiên generic method. Lời khuyên này càng quan trọng gấp đôi khi bạn dùng lambda, bởi vì compiler lấy phần lớn thông tin kiểu cho phép nó thực hiện type inference từ generics. Nếu bạn không cung cấp thông tin này, compiler sẽ không thể suy luận kiểu, và bạn sẽ phải chỉ định kiểu thủ công trong các lambda, khiến chúng dài dòng hơn rất nhiều. Ví dụ, đoạn mã ở trên sẽ không biên dịch được nếu biến `words` được khai báo với raw type `List` thay vì parameterized type `List<String>`. Nhân tiện, comparator trong đoạn mã còn có thể được làm ngắn gọn hơn nữa nếu dùng một *comparator construction method* (phương thức xây dựng comparator) thay cho lambda (**Item 14**, **43**):

```java
Collections.sort(words, comparingInt(String::length));
```

Thực tế, đoạn mã còn có thể ngắn hơn nữa bằng cách tận dụng method `sort` đã được thêm vào interface `List` trong Java 8:

```java
words.sort(comparingInt(String::length));
```

Việc bổ sung lambda vào ngôn ngữ khiến việc dùng function object trở nên thực tế ở những nơi mà trước đây điều đó là vô nghĩa. Ví dụ, hãy xem enum type `Operation` trong **Item 34**. Vì mỗi hằng enum cần một hành vi khác nhau cho method `apply`, chúng ta đã dùng constant-specific class body và override method `apply` trong từng hằng enum. Để nhắc lại, đây là đoạn mã đó:

```java
// Enum type with constant-specific class bodies & data (Item 34)
public enum Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };
    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }
    @Override public String toString() { return symbol; }
    public abstract double apply(double x, double y);
}
```

Item 34 nói rằng các instance field của enum được ưa chuộng hơn constant-specific class body. Lambda giúp việc cài đặt hành vi riêng cho từng hằng bằng cách thứ nhất thay vì cách thứ hai trở nên dễ dàng. Chỉ cần truyền một lambda cài đặt hành vi của mỗi hằng enum vào constructor của nó. Constructor lưu lambda vào một instance field, và method `apply` chuyển tiếp lời gọi đến lambda đó. Đoạn mã thu được đơn giản và rõ ràng hơn phiên bản gốc:

```java
// Enum with function object fields & constant-specific behavior
public enum Operation {
    PLUS  ("+", (x, y) -> x + y),
    MINUS ("-", (x, y) -> x - y),
    TIMES ("*", (x, y) -> x * y),
    DIVIDE("/", (x, y) -> x / y);

    private final String symbol;
    private final DoubleBinaryOperator op;

    Operation(String symbol, DoubleBinaryOperator op) {
        this.symbol = symbol;
        this.op = op;
    }

    @Override public String toString() { return symbol; }

    public double apply(double x, double y) {
        return op.applyAsDouble(x, y);
    }
}
```

Lưu ý rằng chúng ta đang dùng interface `DoubleBinaryOperator` cho các lambda biểu diễn hành vi của hằng enum. Đây là một trong nhiều functional interface được định nghĩa sẵn trong `java.util.function` (**Item 44**). Nó biểu diễn một hàm nhận hai đối số `double` và trả về một kết quả `double`.

Nhìn vào enum `Operation` dựa trên lambda, bạn có thể nghĩ rằng constant-specific class body đã hết thời, nhưng thực tế không phải vậy. Khác với method và class, **lambda không có tên và không có tài liệu; nếu một phép tính không tự giải thích được, hoặc vượt quá vài dòng, đừng đặt nó trong lambda.** Một dòng là lý tưởng cho một lambda, và ba dòng là mức tối đa hợp lý. Nếu bạn vi phạm quy tắc này, khả năng đọc hiểu của chương trình có thể bị tổn hại nghiêm trọng. Nếu một lambda quá dài hoặc khó đọc, hãy tìm cách đơn giản hóa nó hoặc tái cấu trúc chương trình để loại bỏ nó. Ngoài ra, các đối số truyền vào constructor của enum được đánh giá trong ngữ cảnh static. Do đó, lambda trong constructor của enum không thể truy cập các instance member của enum. Constant-specific class body vẫn là lựa chọn đúng nếu một enum type có hành vi riêng cho từng hằng mà khó hiểu, không thể cài đặt trong vài dòng, hoặc cần truy cập đến instance field hay instance method.

Tương tự, bạn có thể nghĩ rằng anonymous class đã lỗi thời trong kỷ nguyên lambda. Điều này gần với sự thật hơn, nhưng vẫn có một vài việc bạn làm được với anonymous class mà không làm được với lambda. Lambda bị giới hạn ở functional interface. Nếu bạn muốn tạo instance của một abstract class, bạn có thể làm điều đó với anonymous class, nhưng không thể với lambda. Tương tự, bạn có thể dùng anonymous class để tạo instance của các interface có nhiều abstract method. Cuối cùng, một lambda không thể lấy được tham chiếu đến chính nó. Trong lambda, từ khóa `this` tham chiếu đến instance bao quanh, thường đó chính là điều bạn muốn. Trong anonymous class, từ khóa `this` tham chiếu đến instance của anonymous class. Nếu bạn cần truy cập function object từ bên trong thân của nó, bạn phải dùng anonymous class.

Lambda có chung với anonymous class một đặc điểm là bạn không thể serialize và deserialize chúng một cách đáng tin cậy giữa các implementation khác nhau. Do đó, **bạn hiếm khi, nếu không muốn nói là không bao giờ, nên serialize một lambda** (hoặc một instance của anonymous class). Nếu bạn có một function object muốn làm cho serializable, chẳng hạn một `Comparator`, hãy dùng instance của một private static nested class (**Item 24**).

Tóm lại, kể từ Java 8, lambda cho đến nay là cách tốt nhất để biểu diễn các function object nhỏ. **Đừng dùng anonymous class cho function object trừ khi bạn phải tạo instance của những kiểu không phải là functional interface.** Ngoài ra, hãy nhớ rằng lambda giúp việc biểu diễn các function object nhỏ trở nên dễ dàng đến mức nó mở ra cánh cửa cho các kỹ thuật lập trình hàm mà trước đây không thực tế trong Java.

## Item 43: Ưu tiên method reference hơn lambda

Ưu điểm chính của lambda so với anonymous class là chúng súc tích hơn. Java cung cấp một cách để tạo function object thậm chí còn súc tích hơn cả lambda: *method reference* (tham chiếu phương thức). Dưới đây là một đoạn mã từ một chương trình duy trì một map từ các khóa tùy ý đến các giá trị `Integer`. Nếu giá trị được hiểu là số lần xuất hiện của khóa, thì chương trình này là một cài đặt multiset. Chức năng của đoạn mã là gán số 1 cho khóa nếu khóa chưa có trong map, và tăng giá trị tương ứng lên nếu khóa đã tồn tại:

```java
map.merge(key, 1, (count, incr) -> count + incr);
```

Lưu ý rằng đoạn mã này dùng method `merge`, được thêm vào interface `Map` trong Java 8. Nếu chưa có ánh xạ nào cho khóa đã cho, method chỉ đơn giản chèn giá trị được truyền vào; nếu đã có ánh xạ, `merge` áp dụng hàm đã cho lên giá trị hiện tại và giá trị được truyền vào, rồi ghi đè giá trị hiện tại bằng kết quả. Đoạn mã này là một trường hợp sử dụng điển hình của method `merge`.

Đoạn mã đọc khá trôi chảy, nhưng vẫn còn chút rườm rà. Các tham số `count` và `incr` không đóng góp thêm nhiều giá trị, mà lại chiếm khá nhiều chỗ. Thực ra, tất cả những gì lambda này nói với bạn là hàm trả về tổng của hai đối số. Kể từ Java 8, `Integer` (và tất cả các kiểu boxed primitive số khác) cung cấp một static method `sum` làm chính xác điều đó. Chúng ta chỉ cần truyền một tham chiếu đến method này và nhận được cùng kết quả với ít rối mắt hơn:

```java
map.merge(key, 1, Integer::sum);
```

Method càng có nhiều tham số thì bạn càng loại bỏ được nhiều mã rườm rà bằng method reference. Tuy nhiên, trong một số lambda, tên tham số mà bạn chọn cung cấp tài liệu hữu ích, khiến lambda dễ đọc và dễ bảo trì hơn method reference, ngay cả khi lambda dài hơn.

Không có việc gì bạn làm được với method reference mà không làm được với lambda (với một ngoại lệ ít gặp — xem JLS, 9.9-2 nếu bạn tò mò). Dẫu vậy, method reference thường cho ra mã ngắn hơn và rõ ràng hơn. Chúng cũng cho bạn một lối thoát khi lambda trở nên quá dài hoặc quá phức tạp: bạn có thể tách mã từ lambda ra thành một method mới và thay lambda bằng một tham chiếu đến method đó. Bạn có thể đặt cho method một cái tên hay và viết tài liệu cho nó thỏa thích.

Nếu bạn lập trình với IDE, nó sẽ đề nghị thay lambda bằng method reference ở bất cứ đâu có thể. Bạn thường nên, nhưng không phải lúc nào cũng nên, chấp nhận đề nghị của IDE. Đôi khi, một lambda sẽ súc tích hơn method reference. Điều này xảy ra thường xuyên nhất khi method nằm trong cùng class với lambda. Ví dụ, hãy xem đoạn mã này, giả sử nó nằm trong một class tên là `GoshThisClassNameIsHumongous`:

```java
service.execute(GoshThisClassNameIsHumongous::action);
```

Lambda tương đương trông như sau:

```java
service.execute(() -> action());
```

Đoạn mã dùng method reference chẳng ngắn hơn cũng chẳng rõ ràng hơn đoạn mã dùng lambda, vì vậy hãy ưu tiên cái sau. Theo hướng tương tự, interface `Function` cung cấp một generic static factory method trả về hàm đồng nhất, `Function.identity()`. Thường thì ngắn gọn và sạch sẽ hơn nếu *không* dùng method này mà viết lambda tương đương ngay tại chỗ: `x -> x`.

Nhiều method reference trỏ đến static method, nhưng có bốn loại không như vậy. Hai trong số đó là *bound* (gắn kết) và *unbound* (không gắn kết) instance method reference. Trong bound reference, đối tượng nhận được chỉ định ngay trong method reference. Bound reference có bản chất tương tự static reference: function object nhận cùng các đối số như method được tham chiếu. Trong unbound reference, đối tượng nhận được chỉ định khi function object được áp dụng, thông qua một tham số bổ sung đứng trước các tham số đã khai báo của method. Unbound reference thường được dùng làm hàm ánh xạ và hàm lọc trong các stream pipeline (**Item 45**). Cuối cùng, có hai loại *constructor* reference, cho class và cho mảng. Constructor reference đóng vai trò là các factory object. Cả năm loại method reference được tóm tắt trong bảng dưới đây:

| **Loại Method Ref** | **Ví dụ** | **Lambda tương đương** |
|---|---|---|
| Static | `Integer::parseInt` | `str -> Integer.parseInt(str)` |
| Bound | `Instant.now()::isAfter` | `Instant then = Instant.now(); t -> then.isAfter(t)` |
| Unbound | `String::toLowerCase` | `str -> str.toLowerCase()` |
| Class Constructor | `TreeMap<K,V>::new` | `() -> new TreeMap<K,V>()` |
| Array Constructor | `int[]::new` | `len -> new int[len]` |

Tóm lại, method reference thường là một lựa chọn thay thế súc tích hơn lambda. **Ở đâu method reference ngắn hơn và rõ ràng hơn, hãy dùng chúng; ở đâu không như vậy, hãy giữ nguyên lambda.**

## Item 44: Ưu tiên dùng các functional interface chuẩn

Giờ đây khi Java đã có lambda, các thực hành tốt nhất trong việc viết API đã thay đổi đáng kể. Ví dụ, mẫu *Template Method* [**Gamma95**], trong đó một subclass override một *primitive method* để chuyên biệt hóa hành vi của superclass, trở nên kém hấp dẫn hơn nhiều. Lựa chọn hiện đại thay thế là cung cấp một static factory hoặc constructor nhận vào một function object để đạt được hiệu quả tương tự. Nói rộng hơn, bạn sẽ viết nhiều constructor và method nhận function object làm tham số hơn. Việc chọn đúng kiểu tham số hàm đòi hỏi sự cẩn trọng.

Hãy xem `LinkedHashMap`. Bạn có thể dùng class này làm cache bằng cách override method protected `removeEldestEntry` của nó, method này được `put` gọi mỗi khi một khóa mới được thêm vào map. Khi method này trả về `true`, map sẽ xóa entry cũ nhất, entry này được truyền vào method. Đoạn override sau cho phép map tăng lên đến một trăm entry rồi xóa entry cũ nhất mỗi khi có khóa mới được thêm vào, nhờ đó duy trì một trăm entry gần nhất:

```java
protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
   return size() > 100;
}
```

Kỹ thuật này hoạt động tốt, nhưng bạn có thể làm tốt hơn nhiều với lambda. Nếu `LinkedHashMap` được viết ngày nay, nó sẽ có một static factory hoặc constructor nhận vào một function object. Nhìn vào khai báo của `removeEldestEntry`, bạn có thể nghĩ rằng function object nên nhận một `Map.Entry<K,V>` và trả về một `boolean`, nhưng như vậy chưa đủ: method `removeEldestEntry` gọi `size()` để lấy số entry trong map, điều này hoạt động được vì `removeEldestEntry` là một instance method của map. Function object mà bạn truyền vào constructor không phải là instance method của map và không thể bắt giữ (capture) map, bởi vì map chưa tồn tại khi factory hoặc constructor của nó được gọi. Do đó, map phải tự truyền chính nó vào function object, nghĩa là function object phải nhận cả map lẫn entry cũ nhất làm đầu vào. Nếu bạn khai báo một functional interface như vậy, nó sẽ trông đại loại như sau:

```java
// Unnecessary functional interface; use a standard one instead.
@FunctionalInterface interface EldestEntryRemovalFunction<K,V>{
    boolean remove(Map<K,V> map, Map.Entry<K,V> eldest);
}
```

Interface này sẽ hoạt động tốt, nhưng bạn không nên dùng nó, vì bạn không cần khai báo một interface mới cho mục đích này. Package `java.util.function` cung cấp một bộ sưu tập lớn các functional interface chuẩn để bạn sử dụng. **Nếu một trong các functional interface chuẩn đáp ứng được yêu cầu, bạn nói chung nên dùng nó thay vì một functional interface được xây dựng riêng cho mục đích đó.** Điều này sẽ làm API của bạn dễ học hơn, nhờ giảm diện tích khái niệm của nó, và sẽ mang lại lợi ích đáng kể về khả năng tương tác, bởi nhiều functional interface chuẩn cung cấp các default method hữu ích. Ví dụ, interface `Predicate` cung cấp các method để kết hợp các predicate. Trong trường hợp ví dụ `LinkedHashMap` của chúng ta, nên dùng interface chuẩn `BiPredicate<Map<K,V>, Map.Entry<K,V>>` thay cho interface tự tạo `EldestEntryRemovalFunction`.

Có bốn mươi ba interface trong `java.util.Function`. Không ai kỳ vọng bạn nhớ hết chúng, nhưng nếu bạn nhớ sáu interface cơ bản, bạn có thể suy ra phần còn lại khi cần. Các interface cơ bản hoạt động trên các kiểu tham chiếu đối tượng. Các interface `Operator` biểu diễn những hàm có kiểu kết quả và kiểu đối số giống nhau. Interface `Predicate` biểu diễn một hàm nhận một đối số và trả về `boolean`. Interface `Function` biểu diễn một hàm có kiểu đối số và kiểu trả về khác nhau. Interface `Supplier` biểu diễn một hàm không nhận đối số và trả về (hay "cung cấp") một giá trị. Cuối cùng, `Consumer` biểu diễn một hàm nhận một đối số và không trả về gì, về cơ bản là tiêu thụ đối số của nó. Sáu functional interface cơ bản được tóm tắt dưới đây:

| **Interface** | **Function Signature** | **Ví dụ** |
|---|---|---|
| `UnaryOperator<T>` | `T apply(T t)` | `String::toLowerCase` |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | `BigInteger::add` |
| `Predicate<T>` | `boolean test(T t)` | `Collection::isEmpty` |
| `Function<T,R>` | `R apply(T t)` | `Arrays::asList` |
| `Supplier<T>` | `T get()` | `Instant::now` |
| `Consumer<T>` | `void accept(T t)` | `System.out::println` |

Ngoài ra còn có ba biến thể của mỗi interface trong sáu interface cơ bản để hoạt động trên các kiểu primitive `int`, `long` và `double`. Tên của chúng được tạo từ tên các interface cơ bản bằng cách thêm tiền tố là một kiểu primitive. Chẳng hạn, một predicate nhận một `int` là `IntPredicate`, và một binary operator nhận hai giá trị `long` và trả về một `long` là `LongBinaryOperator`. Không có kiểu biến thể nào trong số này được tham số hóa, ngoại trừ các biến thể của `Function`, được tham số hóa theo kiểu trả về. Ví dụ, `LongFunction<int[]>` nhận một `long` và trả về một `int[]`.

Có chín biến thể bổ sung của interface `Function`, để dùng khi kiểu kết quả là primitive. Kiểu nguồn và kiểu kết quả luôn khác nhau, bởi vì một hàm từ một kiểu đến chính nó là một `UnaryOperator`. Nếu cả kiểu nguồn lẫn kiểu kết quả đều là primitive, hãy thêm tiền tố *Src*`To`*Result* vào trước `Function`, ví dụ `LongToIntFunction` (sáu biến thể). Nếu kiểu nguồn là primitive và kiểu kết quả là tham chiếu đối tượng, hãy thêm tiền tố *Src*`ToObj` vào trước `Function`, ví dụ `DoubleToObjFunction` (ba biến thể).

Có các phiên bản hai đối số của ba functional interface cơ bản mà việc có chúng là hợp lý: `BiPredicate<T,U>`, `BiFunction<T,U,R>` và `BiConsumer<T,U>`. Cũng có các biến thể `BiFunction` trả về ba kiểu primitive liên quan: `ToIntBiFunction<T,U>`, `ToLongBiFunction<T,U>` và `ToDoubleBiFunction<T,U>`. Có các biến thể hai đối số của `Consumer` nhận một tham chiếu đối tượng và một kiểu primitive: `ObjDoubleConsumer<T>`, `ObjIntConsumer<T>` và `ObjLongConsumer<T>`. Tổng cộng, có chín phiên bản hai đối số của các interface cơ bản.

Cuối cùng, có interface `BooleanSupplier`, một biến thể của `Supplier` trả về giá trị `boolean`. Đây là lần duy nhất kiểu `boolean` được nhắc đến tường minh trong tên của bất kỳ functional interface chuẩn nào, nhưng giá trị trả về `boolean` vẫn được hỗ trợ thông qua `Predicate` và bốn dạng biến thể của nó. Interface `BooleanSupplier` cùng với bốn mươi hai interface được mô tả trong các đoạn trước tạo nên toàn bộ bốn mươi ba functional interface chuẩn. Phải thừa nhận rằng đây là một lượng lớn phải tiêu hóa, và không thật sự trực giao. Mặt khác, phần lớn các functional interface mà bạn cần đã được viết sẵn cho bạn, và tên của chúng đủ quy củ để bạn không gặp quá nhiều khó khăn khi cần tìm ra một cái.

Hầu hết các functional interface chuẩn tồn tại chỉ để cung cấp hỗ trợ cho các kiểu primitive. **Đừng bị cám dỗ dùng các functional interface cơ bản với boxed primitive thay vì các functional interface primitive.** Dù nó chạy được, nhưng làm vậy là vi phạm lời khuyên của **Item 61**, "ưu tiên kiểu primitive hơn boxed primitive." Hậu quả về hiệu năng của việc dùng boxed primitive cho các thao tác hàng loạt có thể rất tai hại.

Giờ bạn đã biết rằng bạn thường nên dùng các functional interface chuẩn thay vì tự viết. Nhưng khi nào bạn *nên* tự viết? Tất nhiên bạn cần tự viết nếu không có interface chuẩn nào làm được điều bạn cần, chẳng hạn nếu bạn cần một predicate nhận ba tham số, hoặc một predicate ném checked exception. Nhưng có những lúc bạn nên tự viết functional interface ngay cả khi một interface chuẩn có cấu trúc giống hệt.

Hãy xem người bạn cũ `Comparator<T>` của chúng ta, có cấu trúc giống hệt interface `ToIntBiFunction<T,T>`. Ngay cả nếu interface sau đã tồn tại khi interface trước được thêm vào thư viện, thì việc dùng nó vẫn là sai. Có nhiều lý do khiến `Comparator` xứng đáng có interface riêng. Thứ nhất, tên của nó cung cấp tài liệu tuyệt vời mỗi khi nó được dùng trong một API, và nó được dùng rất nhiều. Thứ hai, interface `Comparator` có những yêu cầu chặt chẽ về việc thế nào là một instance hợp lệ, những yêu cầu này tạo thành *general contract* (hợp đồng tổng quát) của nó. Bằng cách cài đặt interface, bạn cam kết tuân thủ hợp đồng đó. Thứ ba, interface này được trang bị rất nhiều default method hữu ích để biến đổi và kết hợp các comparator.

Bạn nên nghiêm túc cân nhắc viết một functional interface chuyên dụng thay vì dùng interface chuẩn nếu bạn cần một functional interface có chung một hoặc nhiều đặc điểm sau với `Comparator`:

- Nó sẽ được dùng phổ biến và có thể hưởng lợi từ một cái tên mang tính mô tả.

- Nó có một hợp đồng chặt chẽ gắn liền với nó.

- Nó sẽ hưởng lợi từ các default method tùy biến.

Nếu bạn quyết định tự viết functional interface, hãy nhớ rằng đó là một interface và do đó cần được thiết kế hết sức cẩn thận (**Item 21**).

Hãy để ý rằng interface `EldestEntryRemovalFunction` (trang 199) được đánh dấu bằng annotation `@FunctionalInterface`. Annotation type này có tinh thần tương tự `@Override`. Nó là một tuyên bố về ý định của lập trình viên, phục vụ ba mục đích: nó cho người đọc class và tài liệu của class biết rằng interface được thiết kế để dùng với lambda; nó giữ cho bạn trung thực vì interface sẽ không biên dịch được trừ khi nó có đúng một abstract method; và nó ngăn người bảo trì vô tình thêm abstract method vào interface khi nó tiến hóa. **Hãy luôn đánh dấu các functional interface của bạn bằng annotation** `@FunctionalInterface`**.**

Còn một điểm cuối cùng cần nói về việc dùng functional interface trong API. Đừng cung cấp một method với nhiều overloading nhận các functional interface khác nhau ở cùng một vị trí đối số nếu điều đó có thể gây ra sự mơ hồ ở phía client. Đây không chỉ là vấn đề lý thuyết. Method `submit` của `ExecutorService` có thể nhận một `Callable<T>` hoặc một `Runnable`, và hoàn toàn có thể viết một chương trình client cần đến ép kiểu để chỉ ra overloading đúng (**Item 52**). Cách dễ nhất để tránh vấn đề này là không viết các overloading nhận các functional interface khác nhau ở cùng một vị trí đối số. Đây là một trường hợp đặc biệt của lời khuyên trong **Item 52**, "dùng overloading một cách thận trọng."

Tóm lại, giờ đây khi Java đã có lambda, bạn bắt buộc phải thiết kế API với lambda trong tâm trí. Hãy nhận các kiểu functional interface ở đầu vào và trả về chúng ở đầu ra. Nói chung tốt nhất là dùng các interface chuẩn được cung cấp trong `java.util.function`, nhưng hãy để mắt đến những trường hợp tương đối hiếm mà bạn sẽ có lợi hơn khi tự viết functional interface của riêng mình.

## Item 45: Dùng stream một cách thận trọng

Streams API được thêm vào Java 8 để giảm nhẹ công việc thực hiện các thao tác hàng loạt, tuần tự hoặc song song. API này cung cấp hai khái niệm trừu tượng then chốt: *stream* (luồng), biểu diễn một chuỗi hữu hạn hoặc vô hạn các phần tử dữ liệu, và *stream pipeline* (đường ống stream), biểu diễn một phép tính nhiều giai đoạn trên các phần tử đó. Các phần tử trong một stream có thể đến từ bất cứ đâu. Các nguồn phổ biến bao gồm collection, mảng, file, bộ so khớp biểu thức chính quy, bộ sinh số giả ngẫu nhiên, và các stream khác. Các phần tử dữ liệu trong một stream có thể là tham chiếu đối tượng hoặc giá trị primitive. Ba kiểu primitive được hỗ trợ: `int`, `long` và `double`.

Một stream pipeline bao gồm một stream nguồn, theo sau là không hoặc nhiều *intermediate operation* (thao tác trung gian) và một *terminal operation* (thao tác kết thúc). Mỗi intermediate operation biến đổi stream theo một cách nào đó, chẳng hạn ánh xạ mỗi phần tử thành một hàm của phần tử đó hoặc lọc bỏ tất cả các phần tử không thỏa mãn một điều kiện nào đó. Tất cả các intermediate operation đều biến đổi một stream thành một stream khác, mà kiểu phần tử có thể giống hoặc khác kiểu của stream đầu vào. Terminal operation thực hiện một phép tính cuối cùng trên stream thu được từ intermediate operation cuối cùng, chẳng hạn lưu các phần tử của nó vào một collection, trả về một phần tử nhất định, hoặc in ra tất cả các phần tử.

Stream pipeline được đánh giá một cách *lười* (lazily): việc đánh giá không bắt đầu cho đến khi terminal operation được gọi, và các phần tử dữ liệu không cần thiết để hoàn thành terminal operation sẽ không bao giờ được tính. Chính sự đánh giá lười này cho phép làm việc với các stream vô hạn. Lưu ý rằng một stream pipeline không có terminal operation là một no-op âm thầm, vì vậy đừng quên đưa vào một terminal operation.

Streams API mang tính *fluent* (trôi chảy): nó được thiết kế để cho phép tất cả các lời gọi tạo nên một pipeline được nối chuỗi thành một biểu thức duy nhất. Thực tế, nhiều pipeline có thể được nối chuỗi với nhau thành một biểu thức duy nhất.

Theo mặc định, các stream pipeline chạy tuần tự. Việc làm cho một pipeline thực thi song song đơn giản chỉ là gọi method `parallel` trên bất kỳ stream nào trong pipeline, nhưng hiếm khi việc đó là thích hợp (**Item 48**).

Streams API đủ linh hoạt đến mức hầu như bất kỳ phép tính nào cũng có thể thực hiện bằng stream, nhưng làm được không có nghĩa là nên làm. Khi được dùng đúng cách, stream có thể làm chương trình ngắn hơn và rõ ràng hơn; khi dùng sai cách, chúng có thể làm chương trình khó đọc và khó bảo trì. Không có quy tắc cứng nhắc nào về việc khi nào nên dùng stream, nhưng có những kinh nghiệm thực tiễn.

Hãy xem chương trình sau, chương trình này đọc các từ từ một file từ điển và in ra tất cả các nhóm anagram (đảo chữ) có kích thước đạt ngưỡng tối thiểu do người dùng chỉ định. Nhắc lại rằng hai từ là anagram của nhau nếu chúng gồm cùng các chữ cái nhưng theo thứ tự khác nhau. Chương trình đọc từng từ từ file từ điển do người dùng chỉ định và đưa các từ vào một map. Khóa của map là từ với các chữ cái được sắp theo thứ tự bảng chữ cái, vì vậy khóa của `"staple"` là `"aelpst"`, và khóa của `"petals"` cũng là `"aelpst"`: hai từ này là anagram của nhau, và tất cả các anagram đều có chung dạng sắp xếp theo bảng chữ cái (hay *alphagram*, như đôi khi người ta gọi). Giá trị của map là một set chứa tất cả các từ có chung dạng sắp xếp theo bảng chữ cái. Sau khi từ điển đã được xử lý, mỗi set là một nhóm anagram hoàn chỉnh. Chương trình sau đó duyệt qua view `values()` của map và in ra mỗi set có kích thước đạt ngưỡng:

```java
// Prints all large anagram groups in a dictionary iteratively
public class Anagrams {
    public static void main(String[] args) throws IOException {
        File dictionary = new File(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        Map<String, Set<String>> groups = new HashMap<>();
        try (Scanner s = new Scanner(dictionary)) {
            while (s.hasNext()) {
                String word = s.next();
                groups.computeIfAbsent(alphabetize(word),
                    (unused) -> new TreeSet<>()).add(word);
            }
        }

        for (Set<String> group : groups.values())
            if (group.size() >= minGroupSize)
                System.out.println(group.size() + ": " + group);
    }
    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}
```

Một bước trong chương trình này đáng được chú ý. Việc chèn mỗi từ vào map, được in đậm, dùng method `computeIfAbsent`, được thêm vào trong Java 8. Method này tra cứu một khóa trong map: nếu khóa tồn tại, method chỉ đơn giản trả về giá trị gắn với nó. Nếu không, method tính ra một giá trị bằng cách áp dụng function object đã cho lên khóa, gắn giá trị này với khóa, rồi trả về giá trị vừa tính. Method `computeIfAbsent` giúp đơn giản hóa việc cài đặt các map gắn nhiều giá trị với mỗi khóa.

Bây giờ hãy xem chương trình sau, giải quyết cùng bài toán nhưng dùng stream một cách nặng nề. Lưu ý rằng toàn bộ chương trình, ngoại trừ đoạn mã mở file từ điển, nằm gọn trong một biểu thức duy nhất. Lý do duy nhất khiến từ điển được mở trong một biểu thức riêng là để cho phép dùng câu lệnh `try`-with-resources, câu lệnh này đảm bảo file từ điển được đóng lại:

```java
// Overuse of streams - don't do this!
public class Anagrams {
  public static void main(String[] args) throws IOException {
    Path dictionary = Paths.get(args[0]);
    int minGroupSize = Integer.parseInt(args[1]);

      try (Stream<String> words = Files.lines(dictionary)) {
        words.collect(
          groupingBy(word -> word.chars().sorted()
                      .collect(StringBuilder::new,
                        (sb, c) -> sb.append((char) c),
                        StringBuilder::append).toString()))
          .values().stream()
            .filter(group -> group.size() >= minGroupSize)
            .map(group -> group.size() + ": " + group)
            .forEach(System.out::println);
        }
    }
}
```

Nếu bạn thấy đoạn mã này khó đọc, đừng lo; bạn không đơn độc. Nó ngắn hơn, nhưng cũng kém dễ đọc hơn, đặc biệt đối với những lập trình viên không phải là chuyên gia về stream. **Lạm dụng stream khiến chương trình khó đọc và khó bảo trì.**

May mắn thay, có một điểm cân bằng. Chương trình sau giải quyết cùng bài toán, dùng stream mà không lạm dụng chúng. Kết quả là một chương trình vừa ngắn hơn vừa rõ ràng hơn bản gốc:

```java
// Tasteful use of streams enhances clarity and conciseness
public class Anagrams {
   public static void main(String[] args) throws IOException {
      Path dictionary = Paths.get(args[0]);
      int minGroupSize = Integer.parseInt(args[1]);

      try (Stream<String> words = Files.lines(dictionary)) {
         words.collect(groupingBy(word -> alphabetize(word)))
           .values().stream()
           .filter(group -> group.size() >= minGroupSize)
           .forEach(g -> System.out.println(g.size() + ": " + g));
      }
   }

   // alphabetize method is the same as in original version
}
```

Ngay cả khi trước đây bạn ít tiếp xúc với stream, chương trình này cũng không khó hiểu. Nó mở file từ điển trong một khối `try`-with-resources, thu được một stream gồm tất cả các dòng trong file. Biến `stream` được đặt tên là `words` để gợi ý rằng mỗi phần tử trong stream là một từ. Pipeline trên stream này không có intermediate operation nào; terminal operation của nó gom tất cả các từ vào một map nhóm các từ theo dạng sắp xếp bảng chữ cái của chúng (**Item 46**). Về cơ bản đây chính là map đã được xây dựng trong cả hai phiên bản trước của chương trình. Sau đó một `Stream<List<String>>` mới được mở trên view `values()` của map. Các phần tử trong stream này dĩ nhiên là các nhóm anagram. Stream được lọc để bỏ qua tất cả các nhóm có kích thước nhỏ hơn `minGroupSize`, và cuối cùng, các nhóm còn lại được in ra bởi terminal operation `forEach`.

Lưu ý rằng tên các tham số lambda đã được chọn cẩn thận. Tham số `g` thực ra nên được đặt tên là `group`, nhưng dòng mã thu được sẽ quá rộng so với khổ sách. **Khi không có kiểu tường minh, việc đặt tên cẩn thận cho các tham số lambda là thiết yếu đối với khả năng đọc hiểu của stream pipeline.**

Cũng lưu ý rằng việc sắp xếp chữ cái của từ được thực hiện trong một method `alphabetize` riêng. Điều này nâng cao khả năng đọc hiểu bằng cách đặt tên cho thao tác và giữ các chi tiết cài đặt bên ngoài chương trình chính. **Việc dùng các helper method thậm chí còn quan trọng hơn đối với khả năng đọc hiểu trong stream pipeline so với trong mã lặp** bởi vì pipeline thiếu thông tin kiểu tường minh và các biến tạm có tên.

Method `alphabetize` lẽ ra có thể được cài đặt lại bằng stream, nhưng một method `alphabetize` dựa trên stream sẽ kém rõ ràng hơn, khó viết đúng hơn, và có lẽ chậm hơn. Những khiếm khuyết này bắt nguồn từ việc Java thiếu hỗ trợ cho stream primitive `char` (điều này không có ý nói rằng Java lẽ ra nên hỗ trợ stream `char`; việc đó là bất khả thi). Để minh họa những nguy cơ của việc xử lý các giá trị `char` bằng stream, hãy xem đoạn mã sau:

```java
"Hello world!".chars().forEach(System.out::print);
```

Bạn có thể mong đợi nó in ra `Hello world!`, nhưng nếu chạy, bạn sẽ thấy nó in ra `721011081081113211911111410810033`. Điều này xảy ra vì các phần tử của stream được trả về bởi `"Hello world!".chars()` không phải là giá trị `char` mà là giá trị `int`, nên overloading `int` của `print` được gọi. Phải thừa nhận rằng thật khó hiểu khi một method tên là `chars` lại trả về một stream các giá trị `int`. Bạn *có thể* sửa chương trình bằng cách dùng ép kiểu để buộc gọi đúng overloading:

```java
"Hello world!".chars().forEach(x -> System.out.print((char) x));
```

nhưng lý tưởng nhất là bạn nên **tránh dùng stream để xử lý các giá trị** `char`**.**

Khi bắt đầu dùng stream, bạn có thể cảm thấy thôi thúc muốn chuyển tất cả các vòng lặp của mình sang stream, nhưng hãy kìm lại. Dù việc đó có thể khả thi, nó nhiều khả năng sẽ làm tổn hại khả năng đọc hiểu và bảo trì của cơ sở mã. Theo quy tắc chung, ngay cả những tác vụ phức tạp vừa phải cũng được thực hiện tốt nhất bằng sự kết hợp nào đó giữa stream và vòng lặp, như minh họa bởi các chương trình `Anagrams` ở trên. Vì vậy **hãy tái cấu trúc mã hiện có để dùng stream và dùng chúng trong mã mới chỉ ở những nơi hợp lý.**

Như thể hiện trong các chương trình ở item này, stream pipeline diễn đạt phép tính lặp bằng function object (thường là lambda hoặc method reference), trong khi mã lặp diễn đạt phép tính lặp bằng các khối mã. Có một số việc bạn làm được từ khối mã mà không làm được từ function object:

- Từ một khối mã, bạn có thể đọc hoặc sửa bất kỳ biến cục bộ nào trong phạm vi; từ một lambda, bạn chỉ có thể đọc các biến final hoặc effectively final [**JLS 4.12.4**], và bạn không thể sửa bất kỳ biến cục bộ nào.

- Từ một khối mã, bạn có thể `return` khỏi method bao quanh, `break` hoặc `continue` một vòng lặp bao quanh, hoặc ném bất kỳ checked exception nào mà method này khai báo ném ra; từ một lambda bạn không làm được việc nào trong số đó.

Nếu một phép tính được diễn đạt tốt nhất bằng các kỹ thuật này, thì có lẽ nó không phù hợp với stream. Ngược lại, stream giúp một số việc trở nên rất dễ dàng:

- Biến đổi đồng nhất các chuỗi phần tử

- Lọc các chuỗi phần tử

- Kết hợp các chuỗi phần tử bằng một thao tác duy nhất (ví dụ để cộng chúng, nối chúng, hoặc tính giá trị nhỏ nhất của chúng)

- Tích lũy các chuỗi phần tử vào một collection, có thể nhóm chúng theo một thuộc tính chung nào đó

- Tìm kiếm trong một chuỗi phần tử một phần tử thỏa mãn tiêu chí nào đó

Nếu một phép tính được diễn đạt tốt nhất bằng các kỹ thuật này, thì nó là ứng viên tốt cho stream.

Một việc khó làm với stream là truy cập đồng thời các phần tử tương ứng từ nhiều giai đoạn của một pipeline: một khi bạn ánh xạ một giá trị sang giá trị khác, giá trị ban đầu bị mất. Một cách giải quyết là ánh xạ mỗi giá trị thành một *pair object* (đối tượng cặp) chứa cả giá trị ban đầu lẫn giá trị mới, nhưng đây không phải là một giải pháp thỏa đáng, đặc biệt nếu các pair object cần thiết cho nhiều giai đoạn của pipeline. Mã thu được sẽ lộn xộn và dài dòng, đi ngược lại mục đích chính của stream. Khi có thể áp dụng, một cách giải quyết tốt hơn là đảo ngược phép ánh xạ khi bạn cần truy cập giá trị của giai đoạn trước.

Ví dụ, hãy viết một chương trình in ra hai mươi *số nguyên tố Mersenne* đầu tiên. Nhắc lại, một *số Mersenne* là số có dạng 2^p − 1. Nếu *p* là số nguyên tố, số Mersenne tương ứng *có thể* là số nguyên tố; nếu đúng vậy, nó là một số nguyên tố Mersenne. Làm stream khởi đầu cho pipeline của chúng ta, ta muốn có tất cả các số nguyên tố. Đây là một method trả về stream (vô hạn) đó. Chúng ta giả định đã dùng static import để truy cập dễ dàng các static member của `BigInteger`:

```java
static Stream<BigInteger> primes() {
    return Stream.iterate(TWO, BigInteger::nextProbablePrime);
}
```

Tên của method (`primes`) là một danh từ số nhiều mô tả các phần tử của stream. Quy ước đặt tên này rất được khuyến khích cho mọi method trả về stream vì nó nâng cao khả năng đọc hiểu của stream pipeline. Method này dùng static factory `Stream.iterate`, nhận hai tham số: phần tử đầu tiên trong stream, và một hàm để sinh phần tử tiếp theo trong stream từ phần tử trước đó. Đây là chương trình in ra hai mươi số nguyên tố Mersenne đầu tiên:

```java
public static void main(String[] args) {
    primes().map(p -> TWO.pow(p.intValueExact()).subtract(ONE))
        .filter(mersenne -> mersenne.isProbablePrime(50))
        .limit(20)
        .forEach(System.out::println);
}
```

Chương trình này là một sự mã hóa trực tiếp của mô tả bằng lời ở trên: nó bắt đầu với các số nguyên tố, tính các số Mersenne tương ứng, lọc bỏ tất cả trừ các số nguyên tố (con số ma thuật `50` điều khiển phép kiểm tra tính nguyên tố xác suất), giới hạn stream thu được ở hai mươi phần tử, và in chúng ra.

Bây giờ giả sử chúng ta muốn đặt trước mỗi số nguyên tố Mersenne số mũ của nó (*p*). Giá trị này chỉ có mặt trong stream khởi đầu, nên không thể truy cập được trong terminal operation, nơi in ra kết quả. May mắn thay, dễ dàng tính được số mũ của một số Mersenne bằng cách đảo ngược phép ánh xạ đã diễn ra trong intermediate operation đầu tiên. Số mũ đơn giản là số bit trong biểu diễn nhị phân, nên terminal operation sau đây sinh ra kết quả mong muốn:

```java
.forEach(mp -> System.out.println(mp.bitLength() + ": " + mp));
```

Có rất nhiều tác vụ mà việc nên dùng stream hay vòng lặp là không rõ ràng. Ví dụ, hãy xem tác vụ khởi tạo một bộ bài mới. Giả sử `Card` là một value class immutable đóng gói một `Rank` và một `Suit`, cả hai đều là enum type. Tác vụ này đại diện cho bất kỳ tác vụ nào cần tính tất cả các cặp phần tử có thể chọn từ hai tập hợp. Các nhà toán học gọi đây là *tích Descartes* (Cartesian product) của hai tập hợp. Đây là một cài đặt dùng vòng lặp với vòng lặp for-each lồng nhau, hẳn trông rất quen thuộc với bạn:

```java
// Iterative Cartesian product computation
private static List<Card> newDeck() {
    List<Card> result = new ArrayList<>();
    for (Suit suit : Suit.values())
        for (Rank rank : Rank.values())
            result.add(new Card(suit, rank));
    return result;
}
```

Và đây là một cài đặt dựa trên stream, dùng intermediate operation `flatMap`. Thao tác này ánh xạ mỗi phần tử trong một stream thành một stream, rồi nối tất cả các stream mới này thành một stream duy nhất (hay *làm phẳng* chúng). Lưu ý rằng cài đặt này chứa một lambda lồng nhau, được in đậm:

```java
// Stream-based Cartesian product computation
private static List<Card> newDeck() {
    return Stream.of(Suit.values())
        .flatMap(suit ->
            Stream.of(Rank.values())
                .map(rank -> new Card(suit, rank)))
        .collect(toList());
}
```

Phiên bản nào trong hai phiên bản `newDeck` tốt hơn? Điều đó tùy thuộc vào sở thích cá nhân và môi trường bạn đang lập trình. Phiên bản đầu đơn giản hơn và có lẽ cảm giác tự nhiên hơn. Một tỷ lệ lớn hơn các lập trình viên Java sẽ có thể hiểu và bảo trì nó, nhưng một số lập trình viên sẽ cảm thấy thoải mái hơn với phiên bản thứ hai (dựa trên stream). Nó súc tích hơn một chút và không quá khó hiểu nếu bạn khá thành thạo stream và lập trình hàm. Nếu bạn không chắc mình thích phiên bản nào hơn, phiên bản dùng vòng lặp có lẽ là lựa chọn an toàn hơn. Nếu bạn thích phiên bản stream và tin rằng các lập trình viên khác làm việc với mã này sẽ có cùng sở thích, thì bạn nên dùng nó.

Tóm lại, một số tác vụ được thực hiện tốt nhất bằng stream, và một số khác bằng vòng lặp. Nhiều tác vụ được thực hiện tốt nhất bằng cách kết hợp cả hai cách tiếp cận. Không có quy tắc cứng nhắc nào để chọn cách tiếp cận cho một tác vụ, nhưng có một số kinh nghiệm thực tiễn hữu ích. Trong nhiều trường hợp, cách tiếp cận nên dùng sẽ rõ ràng; trong một số trường hợp, thì không. **Nếu bạn không chắc một tác vụ phù hợp hơn với stream hay vòng lặp, hãy thử cả hai và xem cách nào hiệu quả hơn.**

## Item 46: Ưu tiên các hàm không có side effect trong stream

Nếu bạn mới làm quen với stream, có thể sẽ khó nắm bắt được chúng. Chỉ riêng việc diễn đạt phép tính của bạn dưới dạng một stream pipeline đã có thể khó. Khi bạn thành công, chương trình sẽ chạy, nhưng bạn có thể nhận ra mình thu được rất ít lợi ích, nếu có. Stream không chỉ là một API, nó là một mô hình (paradigm) dựa trên lập trình hàm. Để có được sức biểu đạt, tốc độ, và trong một số trường hợp là khả năng song song hóa mà stream mang lại, bạn phải tiếp nhận cả mô hình lẫn API.

Phần quan trọng nhất của mô hình stream là cấu trúc phép tính của bạn thành một chuỗi các phép biến đổi, trong đó kết quả của mỗi giai đoạn càng gần với một *hàm thuần túy* (pure function) của kết quả giai đoạn trước càng tốt. Hàm thuần túy là hàm mà kết quả chỉ phụ thuộc vào đầu vào của nó: nó không phụ thuộc vào bất kỳ trạng thái khả biến nào, cũng không cập nhật bất kỳ trạng thái nào. Để đạt được điều này, mọi function object mà bạn truyền vào các thao tác stream, cả intermediate lẫn terminal, đều phải không có side effect (tác dụng phụ).

Thỉnh thoảng, bạn có thể thấy mã stream trông như đoạn sau, đoạn này xây dựng một bảng tần suất các từ trong một file văn bản:

```java
// Uses the streams API but not the paradigm--Don't do this!
Map<String, Long> freq = new HashMap<>();
try (Stream<String> words = new Scanner(file).tokens()) {
    words.forEach(word -> {
        freq.merge(word.toLowerCase(), 1L, Long::sum);
    });
}
```

Đoạn mã này có gì sai? Suy cho cùng, nó dùng stream, lambda và method reference, và cho ra kết quả đúng. Nói đơn giản, nó hoàn toàn không phải là mã stream; nó là mã lặp đội lốt mã stream. Nó không thu được lợi ích gì từ streams API, và nó dài hơn (một chút), khó đọc hơn, và kém dễ bảo trì hơn mã lặp tương ứng. Vấn đề bắt nguồn từ việc đoạn mã này làm toàn bộ công việc trong terminal operation `forEach`, dùng một lambda thay đổi trạng thái bên ngoài (bảng tần suất). Một thao tác `forEach` làm bất cứ điều gì hơn là trình bày kết quả của phép tính do stream thực hiện là một "mùi xấu trong mã", cũng như một lambda thay đổi trạng thái. Vậy đoạn mã này nên trông như thế nào?

```java
// Proper use of streams to initialize a frequency table
Map<String, Long> freq;
try (Stream<String> words = new Scanner(file).tokens()) {
    freq = words
        .collect(groupingBy(String::toLowerCase, counting()));
}
```

Đoạn mã này làm cùng việc như đoạn trước nhưng dùng streams API đúng cách. Nó ngắn hơn và rõ ràng hơn. Vậy tại sao có người lại viết theo cách kia? Bởi vì nó dùng những công cụ mà họ đã quen thuộc. Các lập trình viên Java biết cách dùng vòng lặp for-each, và terminal operation `forEach` cũng tương tự. Nhưng thao tác `forEach` nằm trong số các terminal operation kém mạnh mẽ nhất và kém thân thiện với stream nhất. Nó mang tính lặp tường minh, và do đó không thích hợp cho song song hóa. **Thao tác** `forEach` **chỉ nên được dùng để báo cáo kết quả của một phép tính stream, chứ không phải để thực hiện phép tính.** Thỉnh thoảng, việc dùng `forEach` cho mục đích khác cũng hợp lý, chẳng hạn thêm kết quả của một phép tính stream vào một collection đã có sẵn.

Đoạn mã cải tiến dùng một *collector*, đây là một khái niệm mới mà bạn phải học để dùng stream. API `Collectors` trông khá đáng sợ: nó có ba mươi chín method, một số trong đó có tới năm type parameter. Tin tốt là bạn có thể thu được phần lớn lợi ích từ API này mà không cần đào sâu vào toàn bộ sự phức tạp của nó. Để bắt đầu, bạn có thể bỏ qua interface `Collector` và coi collector như một đối tượng mờ đục đóng gói một chiến lược *reduction* (rút gọn). Trong ngữ cảnh này, reduction có nghĩa là kết hợp các phần tử của một stream thành một đối tượng duy nhất. Đối tượng do collector tạo ra thường là một collection (điều này giải thích cho cái tên collector).

Các collector để gom các phần tử của một stream vào một `Collection` thực sự khá đơn giản. Có ba collector như vậy: `toList()`, `toSet()` và `toCollection(collectionFactory)`. Chúng lần lượt trả về một list, một set, và một kiểu collection do lập trình viên chỉ định. Với kiến thức này, chúng ta có thể viết một stream pipeline để trích ra danh sách mười từ hàng đầu từ bảng tần suất của mình.

```java
// Pipeline to get a top-ten list of words from a frequency table
List<String> topTen = freq.keySet().stream()
    .sorted(comparing(freq::get).reversed())
    .limit(10)
    .collect(toList());
```

Lưu ý rằng chúng ta không ghi tên class `Collectors` trước method `toList`. **Việc static import tất cả các member của** `Collectors` **là thông lệ và là điều khôn ngoan, bởi nó làm cho stream pipeline dễ đọc hơn.**

Phần khó duy nhất của đoạn mã này là comparator mà chúng ta truyền vào `sorted`, `comparing(freq::get).reversed()`. Method `comparing` là một comparator construction method (**Item 14**) nhận vào một hàm trích xuất khóa. Hàm này nhận một từ, và việc "trích xuất" thực chất là một phép tra bảng: bound method reference `freq::get` tra từ trong bảng tần suất và trả về số lần từ đó xuất hiện trong file. Cuối cùng, chúng ta gọi `reversed` trên comparator, nên chúng ta sắp xếp các từ từ xuất hiện nhiều nhất đến ít nhất. Sau đó chỉ đơn giản là giới hạn stream ở mười từ và gom chúng vào một list.

Các đoạn mã trước dùng method `stream` của `Scanner` để lấy một stream trên scanner. Method này được thêm vào trong Java 9. Nếu bạn dùng bản phát hành cũ hơn, bạn có thể chuyển scanner, vốn cài đặt `Iterator`, thành một stream bằng một adapter tương tự như trong **Item 47** (`streamOf(Iterable<E>)`).

Vậy còn ba mươi sáu method còn lại trong `Collectors` thì sao? Hầu hết chúng tồn tại để cho phép bạn gom stream vào các map, việc này phức tạp hơn nhiều so với gom vào các collection thực sự. Mỗi phần tử stream được gắn với một khóa *và một giá trị*, và nhiều phần tử stream có thể được gắn với cùng một khóa.

Map collector đơn giản nhất là `toMap(keyMapper, valueMapper)`, nhận hai hàm, một hàm ánh xạ phần tử stream thành khóa, hàm kia ánh xạ thành giá trị. Chúng ta đã dùng collector này trong cài đặt `fromString` ở **Item 34** để tạo một map từ dạng chuỗi của một enum đến chính enum đó:

```java
// Using a toMap collector to make a map from string to enum
private static final Map<String, Operation> stringToEnum =
    Stream.of(values()).collect(
        toMap(Object::toString, e -> e));
```

Dạng đơn giản này của `toMap` là hoàn hảo nếu mỗi phần tử trong stream ánh xạ đến một khóa duy nhất. Nếu nhiều phần tử stream ánh xạ đến cùng một khóa, pipeline sẽ kết thúc với một `IllegalStateException`.

Các dạng phức tạp hơn của `toMap`, cũng như method `groupingBy`, cho bạn nhiều cách khác nhau để cung cấp chiến lược xử lý các xung đột như vậy. Một cách là cung cấp cho method `toMap` một *merge function* (hàm hợp nhất) bên cạnh các hàm ánh xạ khóa và giá trị. Merge function là một `BinaryOperator<V>`, trong đó `V` là kiểu giá trị của map. Bất kỳ giá trị bổ sung nào gắn với một khóa sẽ được kết hợp với giá trị hiện có bằng merge function, vì vậy, ví dụ, nếu merge function là phép nhân, bạn sẽ thu được một giá trị là tích của tất cả các giá trị mà hàm ánh xạ giá trị gắn với khóa đó.

Dạng ba đối số của `toMap` cũng hữu ích để tạo một map từ khóa đến một phần tử được chọn gắn với khóa đó. Ví dụ, giả sử chúng ta có một stream các album thu âm của nhiều nghệ sĩ khác nhau, và chúng ta muốn một map từ nghệ sĩ thu âm đến album bán chạy nhất. Collector này sẽ làm được việc đó.

```java
// Collector to generate a map from key to chosen element for key
Map<Artist, Album> topHits = albums.collect(
   toMap(Album::artist, a->a, maxBy(comparing(Album::sales))));
```

Lưu ý rằng comparator dùng static factory method `maxBy`, được static import từ `BinaryOperator`. Method này chuyển một `Comparator<T>` thành một `BinaryOperator<T>` tính giá trị lớn nhất theo comparator được chỉ định. Trong trường hợp này, comparator được trả về bởi comparator construction method `comparing`, nhận hàm trích xuất khóa `Album::sales`. Điều này có vẻ hơi vòng vèo, nhưng mã đọc rất trôi chảy. Nói một cách nôm na, nó nói rằng: "chuyển stream các album thành một map, ánh xạ mỗi nghệ sĩ đến album có doanh số tốt nhất." Điều này gần đến ngạc nhiên với phát biểu bài toán.

Một cách dùng khác của dạng ba đối số của `toMap` là tạo ra một collector áp đặt chính sách ghi-sau-thắng (last-write-wins) khi có xung đột. Với nhiều stream, kết quả sẽ không xác định, nhưng nếu tất cả các giá trị mà các hàm ánh xạ có thể gắn với một khóa đều giống hệt nhau, hoặc nếu tất cả đều chấp nhận được, thì hành vi của collector này có thể chính là điều bạn muốn:

```java
// Collector to impose last-write-wins policy
toMap(keyMapper, valueMapper, (oldVal, newVal) -> newVal)
```

Phiên bản thứ ba và cuối cùng của `toMap` nhận thêm đối số thứ tư, là một map factory, để dùng khi bạn muốn chỉ định một cài đặt map cụ thể như `EnumMap` hoặc `TreeMap`.

Cũng có các dạng biến thể của ba phiên bản đầu của `toMap`, tên là `toConcurrentMap`, chạy hiệu quả khi song song và tạo ra các instance `ConcurrentHashMap`.

Bên cạnh method `toMap`, API `Collectors` cung cấp method `groupingBy`, trả về các collector tạo ra những map nhóm các phần tử vào các danh mục dựa trên một *classifier function* (hàm phân loại). Hàm phân loại nhận một phần tử và trả về danh mục mà phần tử đó thuộc về. Danh mục này đóng vai trò là khóa map của phần tử. Phiên bản đơn giản nhất của method `groupingBy` chỉ nhận một hàm phân loại và trả về một map mà các giá trị là list của tất cả các phần tử trong mỗi danh mục. Đây là collector mà chúng ta đã dùng trong chương trình `Anagram` ở **Item 45** để tạo một map từ từ đã sắp xếp chữ cái đến list các từ có chung dạng sắp xếp đó:

```java
words.collect(groupingBy(word -> alphabetize(word)))
```

Nếu bạn muốn `groupingBy` trả về một collector tạo ra map với giá trị không phải là list, bạn có thể chỉ định một *downstream collector* (collector hạ nguồn) bên cạnh hàm phân loại. Downstream collector tạo ra một giá trị từ một stream chứa tất cả các phần tử trong một danh mục. Cách dùng đơn giản nhất của tham số này là truyền `toSet()`, kết quả là một map mà các giá trị là set các phần tử thay vì list.

Hoặc bạn có thể truyền `toCollection(collectionFactory)`, cho phép bạn tạo các collection mà mỗi danh mục phần tử được đặt vào. Điều này cho bạn sự linh hoạt để chọn bất kỳ kiểu collection nào bạn muốn. Một cách dùng đơn giản khác của dạng hai đối số của `groupingBy` là truyền `counting()` làm downstream collector. Kết quả là một map gắn mỗi danh mục với *số lượng* phần tử trong danh mục đó, thay vì một collection chứa các phần tử. Đó chính là điều bạn đã thấy trong ví dụ bảng tần suất ở đầu item này:

```java
Map<String, Long> freq = words
        .collect(groupingBy(String::toLowerCase, counting()));
```

Phiên bản thứ ba của `groupingBy` cho phép bạn chỉ định một map factory bên cạnh downstream collector. Lưu ý rằng method này vi phạm mẫu danh sách đối số lồng nhau (telescoping) tiêu chuẩn: tham số `mapFactory` đứng trước, thay vì đứng sau, tham số `downStream`. Phiên bản này của `groupingBy` cho bạn quyền kiểm soát cả map chứa lẫn các collection được chứa, vì vậy, ví dụ, bạn có thể chỉ định một collector trả về một `TreeMap` mà các giá trị là các `TreeSet`.

Method `groupingByConcurrent` cung cấp các biến thể của cả ba overloading của `groupingBy`. Các biến thể này chạy hiệu quả khi song song và tạo ra các instance `ConcurrentHashMap`. Cũng có một họ hàng ít dùng của `groupingBy` gọi là `partitioningBy`. Thay vì hàm phân loại, nó nhận một predicate và trả về một map có khóa là `Boolean`. Có hai overloading của method này, một trong số đó nhận thêm một downstream collector bên cạnh predicate.

Các collector được trả về bởi method `counting` được thiết kế *chỉ* để dùng làm downstream collector. Chức năng tương tự có sẵn trực tiếp trên `Stream`, thông qua method `count`, vì vậy **không bao giờ có lý do để viết** `collect(counting())`. Có thêm mười lăm method `Collectors` nữa có tính chất này. Chúng bao gồm chín method có tên bắt đầu bằng `summing`, `averaging` và `summarizing` (mà chức năng có sẵn trên các kiểu stream primitive tương ứng). Chúng cũng bao gồm tất cả các overloading của method `reducing`, và các method `filtering`, `mapping`, `flatMapping` và `collectingAndThen`. Hầu hết lập trình viên có thể yên tâm bỏ qua phần lớn các method này. Từ góc độ thiết kế, các collector này thể hiện một nỗ lực nhân bản một phần chức năng của stream vào trong collector để các downstream collector có thể hoạt động như những "stream thu nhỏ".

Có ba method `Collectors` chúng ta chưa nhắc đến. Dù nằm trong `Collectors`, chúng không liên quan đến collection. Hai method đầu là `minBy` và `maxBy`, nhận một comparator và trả về phần tử nhỏ nhất hoặc lớn nhất trong stream theo comparator đó. Chúng là những tổng quát hóa nhỏ của các method `min` và `max` trong interface `Stream`, và là phiên bản collector tương ứng của các binary operator được trả về bởi các method cùng tên trong `BinaryOperator`. Nhắc lại rằng chúng ta đã dùng `BinaryOperator.maxBy` trong ví dụ album bán chạy nhất.

Method `Collectors` cuối cùng là `joining`, chỉ hoạt động trên các stream gồm các instance `CharSequence` như chuỗi. Ở dạng không tham số, nó trả về một collector chỉ đơn giản nối các phần tử lại. Dạng một đối số của nó nhận một tham số `CharSequence` tên là `delimiter` và trả về một collector nối các phần tử stream, chèn dấu phân cách giữa các phần tử kề nhau. Nếu bạn truyền dấu phẩy làm dấu phân cách, collector trả về một chuỗi các giá trị phân cách bằng dấu phẩy (nhưng hãy cẩn thận vì chuỗi sẽ mơ hồ nếu bất kỳ phần tử nào trong stream chứa dấu phẩy). Dạng ba đối số nhận thêm một tiền tố và một hậu tố bên cạnh dấu phân cách. Collector thu được sinh ra các chuỗi giống như những gì bạn nhận được khi in một collection, ví dụ `[came, saw, conquered]`.

Tóm lại, cốt lõi của việc lập trình stream pipeline là các function object không có side effect. Điều này áp dụng cho tất cả các function object được truyền vào stream và các đối tượng liên quan. Terminal operation `forEach` chỉ nên được dùng để báo cáo kết quả của một phép tính do stream thực hiện, chứ không phải để thực hiện phép tính. Để dùng stream đúng cách, bạn phải hiểu về collector. Các collector factory quan trọng nhất là `toList`, `toSet`, `toMap`, `groupingBy` và `joining`.

## Item 47: Ưu tiên Collection hơn Stream làm kiểu trả về

Nhiều method trả về các chuỗi phần tử. Trước Java 8, các kiểu trả về hiển nhiên cho những method như vậy là các collection interface `Collection`, `Set` và `List`; `Iterable`; và các kiểu mảng. Thông thường, dễ dàng quyết định nên trả về kiểu nào trong số này. Chuẩn mực là một collection interface. Nếu method tồn tại chỉ để cho phép vòng lặp for-each, hoặc chuỗi trả về không thể cài đặt được một method nào đó của `Collection` (thường là `contains(Object)`), thì interface `Iterable` được dùng. Nếu các phần tử trả về là giá trị primitive hoặc có yêu cầu khắt khe về hiệu năng, mảng được dùng. Trong Java 8, stream được thêm vào nền tảng, làm phức tạp đáng kể việc chọn kiểu trả về phù hợp cho một method trả về chuỗi.

Bạn có thể nghe nói rằng stream giờ đây là lựa chọn hiển nhiên để trả về một chuỗi phần tử, nhưng như đã bàn trong **Item 45**, stream không làm cho vòng lặp trở nên lỗi thời: viết mã tốt đòi hỏi kết hợp stream và vòng lặp một cách thận trọng. Nếu một API chỉ trả về stream và một số người dùng muốn duyệt qua chuỗi trả về bằng vòng lặp for-each, những người dùng đó sẽ bực bội một cách chính đáng. Điều này đặc biệt gây khó chịu vì interface `Stream` chứa abstract method duy nhất của interface `Iterable`, và đặc tả của `Stream` cho method này tương thích với đặc tả của `Iterable`. Điều duy nhất ngăn cản lập trình viên dùng vòng lặp for-each để duyệt qua một stream là việc `Stream` không extend `Iterable`.

Đáng buồn là không có cách giải quyết tốt cho vấn đề này. Thoạt nhìn, có vẻ như truyền một method reference đến method `iterator` của `Stream` sẽ hoạt động. Mã thu được có lẽ hơi ồn ào và khó hiểu, nhưng không đến mức vô lý:

```java
// Won't compile, due to limitations on Java's type inference
for (ProcessHandle ph : ProcessHandle.allProcesses()::iterator) {
    // Process the process
}
```

Thật không may, nếu bạn thử biên dịch đoạn mã này, bạn sẽ nhận được thông báo lỗi:

```java
Test.java:6: error: method reference not expected here
for (ProcessHandle ph : ProcessHandle.allProcesses()::iterator) {
                        ^
```

Để mã biên dịch được, bạn phải ép kiểu method reference sang một `Iterable` được tham số hóa thích hợp:

```java
// Hideous workaround to iterate over a stream
for  (ProcessHandle ph : (Iterable<ProcessHandle>)
                        ProcessHandle.allProcesses()::iterator)
```

Mã client này hoạt động, nhưng nó quá ồn ào và khó hiểu để dùng trong thực tế. Cách giải quyết tốt hơn là dùng một adapter method. JDK không cung cấp method như vậy, nhưng viết một cái thì dễ, dùng cùng kỹ thuật đã được dùng trực tiếp trong các đoạn mã ở trên. Lưu ý rằng không cần ép kiểu trong adapter method vì type inference của Java hoạt động đúng trong ngữ cảnh này:

```java
// Adapter from  Stream<E> to Iterable<E>
public static <E> Iterable<E> iterableOf(Stream<E> stream) {
    return stream::iterator;
}
```

Với adapter này, bạn có thể duyệt qua bất kỳ stream nào bằng câu lệnh for-each:

```java
for (ProcessHandle p : iterableOf(ProcessHandle.allProcesses())) {
    // Process the process
}
```

Lưu ý rằng các phiên bản stream của chương trình `Anagrams` trong **Item 45** dùng method `Files.lines` để đọc từ điển, trong khi phiên bản dùng vòng lặp dùng một scanner. Method `Files.lines` ưu việt hơn scanner, vốn âm thầm nuốt bất kỳ exception nào gặp phải khi đọc file. Lý tưởng nhất là chúng ta cũng đã dùng `Files.lines` trong phiên bản vòng lặp. Đây là kiểu thỏa hiệp mà lập trình viên sẽ phải chấp nhận nếu một API chỉ cung cấp truy cập stream đến một chuỗi và họ muốn duyệt qua chuỗi đó bằng câu lệnh for-each.

Ngược lại, một lập trình viên muốn xử lý một chuỗi bằng stream pipeline sẽ bực bội một cách chính đáng với một API chỉ cung cấp `Iterable`. Một lần nữa, JDK không cung cấp adapter, nhưng viết một cái cũng đủ dễ:

```java
// Adapter from Iterable<E> to Stream<E>
public static <E> Stream<E> streamOf(Iterable<E> iterable) {
    return StreamSupport.stream(iterable.spliterator(), false);
}
```

Nếu bạn đang viết một method trả về một chuỗi đối tượng và bạn biết rằng nó sẽ chỉ được dùng trong stream pipeline, thì tất nhiên bạn cứ thoải mái trả về stream. Tương tự, một method trả về chuỗi mà sẽ chỉ được dùng để duyệt thì nên trả về `Iterable`. Nhưng nếu bạn đang viết một public API trả về một chuỗi, bạn nên đáp ứng cả những người dùng muốn viết stream pipeline lẫn những người muốn viết câu lệnh for-each, trừ khi bạn có lý do chính đáng để tin rằng hầu hết người dùng sẽ muốn dùng cùng một cơ chế.

Interface `Collection` là subtype của `Iterable` và có một method `stream`, vì vậy nó đáp ứng cả duyệt lẫn truy cập stream. Do đó, `Collection` **hoặc một subtype thích hợp nói chung là kiểu trả về tốt nhất cho một public method trả về chuỗi.** Mảng cũng cho phép duyệt và truy cập stream dễ dàng với các method `Arrays.asList` và `Stream.of`. Nếu chuỗi bạn trả về đủ nhỏ để dễ dàng chứa trong bộ nhớ, tốt nhất có lẽ bạn nên trả về một trong các cài đặt collection chuẩn, như `ArrayList` hoặc `HashSet`. Nhưng **đừng lưu một chuỗi lớn trong bộ nhớ chỉ để trả về nó dưới dạng collection.**

Nếu chuỗi bạn trả về lớn nhưng có thể được biểu diễn một cách cô đọng, hãy cân nhắc cài đặt một collection chuyên dụng. Ví dụ, giả sử bạn muốn trả về *tập lũy thừa* (power set) của một tập hợp cho trước, tập này gồm tất cả các tập con của nó. Tập lũy thừa của {*a*, *b*, *c*} là {{}, {*a*}, {*b*}, {*c*}, {*a*, *b*}, {*a*, *c*}, {*b*, *c*}, {*a*, *b*, *c*}}. Nếu một tập hợp có *n* phần tử, tập lũy thừa của nó có 2^*n* phần tử. Vì vậy, bạn thậm chí không nên nghĩ đến việc lưu tập lũy thừa trong một cài đặt collection chuẩn. Tuy nhiên, dễ dàng cài đặt một collection tùy biến cho công việc này với sự trợ giúp của `AbstractList`.

Mẹo ở đây là dùng chỉ số của mỗi phần tử trong tập lũy thừa như một vector bit, trong đó bit thứ *n* của chỉ số cho biết sự có mặt hay vắng mặt của phần tử thứ *n* trong tập nguồn. Về bản chất, có một ánh xạ tự nhiên giữa các số nhị phân từ 0 đến 2^*n* − 1 và tập lũy thừa của một tập *n* phần tử. Đây là mã:

```java
// Returns the power set of an input set as custom collection
public class PowerSet {
   public static final <E> Collection<Set<E>> of(Set<E> s) {
      List<E> src = new ArrayList<>(s);
      if (src.size() > 30)
         throw new IllegalArgumentException("Set too big " + s);
      return new AbstractList<Set<E>>() {
         @Override public int size() {
            return 1 << src.size(); // 2 to the power src.size()
         }

         @Override public boolean contains(Object o) {
            return o instanceof Set && src.containsAll((Set)o);
         }

         @Override public Set<E> get(int index) {
            Set<E> result = new HashSet<>();
            for (int i = 0; index != 0; i++, index >>= 1)
               if ((index & 1) == 1)
                  result.add(src.get(i));
            return result;
         }
      };
   }
}
```

Lưu ý rằng `PowerSet.of` ném exception nếu tập đầu vào có hơn 30 phần tử. Điều này làm nổi bật một nhược điểm của việc dùng `Collection` làm kiểu trả về thay vì `Stream` hay `Iterable`: `Collection` có một method `size` trả về `int`, điều này giới hạn độ dài của chuỗi trả về ở `Integer.MAX_VALUE`, tức 2^31 − 1. Đặc tả của `Collection` cho phép method `size` trả về 2^31 − 1 nếu collection lớn hơn, thậm chí vô hạn, nhưng đây không phải là một giải pháp hoàn toàn thỏa đáng.

Để viết một cài đặt `Collection` trên nền `AbstractCollection`, bạn chỉ cần cài đặt hai method ngoài method bắt buộc của `Iterable`: `contains` và `size`. Thường thì dễ dàng viết được các cài đặt hiệu quả cho hai method này. Nếu điều đó không khả thi, có lẽ vì nội dung của chuỗi không được xác định trước khi việc duyệt diễn ra, hãy trả về một stream hoặc iterable, tùy cái nào tự nhiên hơn. Nếu muốn, bạn có thể trả về cả hai bằng hai method riêng biệt.

Có những lúc bạn sẽ chọn kiểu trả về chỉ dựa trên sự dễ dàng khi cài đặt. Ví dụ, giả sử bạn muốn viết một method trả về tất cả các sublist (liên tiếp) của một list đầu vào. Chỉ cần ba dòng mã để sinh ra các sublist này và đặt chúng vào một collection chuẩn, nhưng bộ nhớ cần để chứa collection này là bậc hai theo kích thước của list nguồn. Dù không tệ như tập lũy thừa, vốn là bậc mũ, điều này rõ ràng không thể chấp nhận được. Cài đặt một collection tùy biến, như chúng ta đã làm với tập lũy thừa, sẽ rất tẻ nhạt, càng tẻ nhạt hơn vì JDK thiếu một cài đặt khung (skeletal) cho `Iterator` để giúp chúng ta.

Tuy nhiên, việc cài đặt một stream gồm tất cả các sublist của một list đầu vào lại khá đơn giản, dù nó đòi hỏi một chút tinh ý. Hãy gọi một sublist chứa phần tử đầu tiên của list là một *prefix* (tiền tố) của list. Ví dụ, các prefix của (*a*, *b*, *c*) là (*a*), (*a*, *b*) và (*a*, *b*, *c*). Tương tự, hãy gọi một sublist chứa phần tử cuối cùng là một *suffix* (hậu tố), vậy các suffix của (*a*, *b*, *c*) là (*a*, *b*, *c*), (*b*, *c*) và (*c*). Điều tinh ý ở đây là các sublist của một list đơn giản là các suffix của các prefix (hoặc tương đương, các prefix của các suffix) cộng với list rỗng. Nhận xét này dẫn thẳng đến một cài đặt rõ ràng và khá súc tích:

```java
// Returns a stream of all the sublists of its input list
public class SubLists {
   public static <E> Stream<List<E>> of(List<E> list) {
      return Stream.concat(Stream.of(Collections.emptyList()),
         prefixes(list).flatMap(SubLists::suffixes));
   }

   private static <E> Stream<List<E>> prefixes(List<E> list) {
      return IntStream.rangeClosed(1, list.size())
         .mapToObj(end -> list.subList(0, end));
   }

   private static <E> Stream<List<E>> suffixes(List<E> list) {
      return IntStream.range(0, list.size())
         .mapToObj(start -> list.subList(start, list.size()));
   }
}
```

Lưu ý rằng method `Stream.concat` được dùng để thêm list rỗng vào stream trả về. Cũng lưu ý rằng method `flatMap` (**Item 45**) được dùng để sinh ra một stream duy nhất gồm tất cả các suffix của tất cả các prefix. Cuối cùng, lưu ý rằng chúng ta sinh các prefix và suffix bằng cách ánh xạ một stream các giá trị `int` liên tiếp được trả về bởi `IntStream.range` và `IntStream.rangeClosed`. Nói một cách đại khái, idiom này là phiên bản stream tương đương của vòng lặp `for` tiêu chuẩn trên các chỉ số nguyên. Vì vậy, cài đặt sublist của chúng ta có tinh thần tương tự vòng lặp `for` lồng nhau hiển nhiên sau:

```java
for (int start = 0; start < src.size(); start++)
    for (int end = start + 1; end <= src.size(); end++)
        System.out.println(src.subList(start, end));
```

Có thể chuyển trực tiếp vòng lặp `for` này thành một stream. Kết quả súc tích hơn cài đặt trước của chúng ta, nhưng có lẽ kém dễ đọc hơn một chút. Nó có tinh thần tương tự mã stream cho tích Descartes trong **Item 45**:

```java
// Returns a stream of all the sublists of its input list
public static <E> Stream<List<E>> of(List<E> list) {
   return IntStream.range(0, list.size())
      .mapToObj(start ->
         IntStream.rangeClosed(start + 1, list.size())
            .mapToObj(end -> list.subList(start, end)))
      .flatMap(x -> x);
}
```

Giống như vòng lặp `for` đứng trước nó, đoạn mã này *không* phát ra list rỗng. Để khắc phục thiếu sót này, bạn có thể dùng `concat`, như chúng ta đã làm ở phiên bản trước, hoặc thay `1` bằng `(int) Math.signum(start)` trong lời gọi `rangeClosed`.

Cả hai cài đặt stream cho sublist đều ổn, nhưng cả hai đều sẽ buộc một số người dùng phải dùng adapter từ `Stream` sang `Iterable` hoặc dùng stream ở những nơi mà vòng lặp sẽ tự nhiên hơn. Adapter từ `Stream` sang `Iterable` không những làm rối mã client, mà còn làm chậm vòng lặp đi 2,3 lần trên máy của tôi. Một cài đặt `Collection` chuyên dụng (không trình bày ở đây) dài dòng hơn đáng kể nhưng chạy nhanh hơn khoảng 1,4 lần so với cài đặt dựa trên stream của chúng ta trên máy của tôi.

Tóm lại, khi viết một method trả về một chuỗi phần tử, hãy nhớ rằng một số người dùng có thể muốn xử lý chúng dưới dạng stream trong khi những người khác có thể muốn duyệt qua chúng. Hãy cố gắng đáp ứng cả hai nhóm. Nếu khả thi để trả về một collection, hãy làm vậy. Nếu bạn đã có sẵn các phần tử trong một collection hoặc số phần tử trong chuỗi đủ nhỏ để biện minh cho việc tạo một collection mới, hãy trả về một collection chuẩn như `ArrayList`. Nếu không, hãy cân nhắc cài đặt một collection tùy biến như chúng ta đã làm với tập lũy thừa. Nếu không khả thi để trả về collection, hãy trả về stream hoặc iterable, tùy cái nào có vẻ tự nhiên hơn. Nếu trong một bản phát hành Java tương lai, khai báo interface `Stream` được sửa để extend `Iterable`, thì bạn cứ thoải mái trả về stream vì chúng sẽ cho phép cả xử lý stream lẫn duyệt.

## Item 48: Hãy thận trọng khi song song hóa stream

Trong số các ngôn ngữ phổ biến, Java luôn đi đầu trong việc cung cấp các tiện ích giúp giảm nhẹ công việc lập trình đồng thời. Khi Java được phát hành năm 1996, nó đã có hỗ trợ tích hợp sẵn cho thread, với synchronization và `wait`/`notify`. Java 5 giới thiệu thư viện `java.util.concurrent`, với các concurrent collection và executor framework. Java 7 giới thiệu package fork-join, một framework hiệu năng cao cho phân rã song song. Java 8 giới thiệu stream, có thể được song song hóa chỉ với một lời gọi đến method `parallel`. Viết chương trình đồng thời trong Java ngày càng dễ hơn, nhưng viết chương trình đồng thời vừa đúng vừa nhanh thì vẫn khó như trước nay. Các vi phạm về an toàn (safety) và tính sống (liveness) là chuyện thường ngày trong lập trình đồng thời, và các stream pipeline song song không phải là ngoại lệ.

Hãy xem chương trình này từ **Item 45**:

```java
// Stream-based program to generate the first 20 Mersenne primes
public static void main(String[] args) {
    primes().map(p -> TWO.pow(p.intValueExact()).subtract(ONE))
        .filter(mersenne -> mersenne.isProbablePrime(50))
        .limit(20)
        .forEach(System.out::println);
}

static Stream<BigInteger> primes() {
    return Stream.iterate(TWO, BigInteger::nextProbablePrime);
}
```

Trên máy của tôi, chương trình này lập tức bắt đầu in ra các số nguyên tố và mất 12,5 giây để chạy xong. Giả sử tôi ngây thơ thử tăng tốc nó bằng cách thêm một lời gọi `parallel()` vào stream pipeline. Bạn nghĩ hiệu năng của nó sẽ ra sao? Nhanh hơn vài phần trăm? Chậm hơn vài phần trăm? Đáng buồn là điều xảy ra là nó không in ra gì cả, nhưng mức sử dụng CPU vọt lên 90 phần trăm và giữ nguyên ở đó vô thời hạn (một *liveness failure*). Chương trình có thể cuối cùng cũng kết thúc, nhưng tôi không muốn chờ để biết; tôi đã buộc dừng nó sau nửa giờ.

Chuyện gì đang xảy ra ở đây? Nói đơn giản, thư viện stream không biết cách song song hóa pipeline này và các heuristic của nó thất bại. Ngay cả trong hoàn cảnh tốt nhất, **việc song song hóa một pipeline khó có thể tăng hiệu năng của nó nếu nguồn đến từ** `Stream.iterate`**, hoặc intermediate operation** `limit` **được dùng.** Pipeline này phải đối mặt với *cả hai* vấn đề đó. Tệ hơn nữa, chiến lược song song hóa mặc định xử lý tính không thể đoán trước của `limit` bằng cách giả định rằng việc xử lý thêm một vài phần tử và loại bỏ các kết quả không cần thiết là vô hại. Trong trường hợp này, thời gian để tìm mỗi số nguyên tố Mersenne gần gấp đôi thời gian tìm số trước đó. Do đó, chi phí tính thêm một phần tử gần bằng chi phí tính tất cả các phần tử trước đó cộng lại, và pipeline trông có vẻ vô hại này khiến thuật toán song song hóa tự động phải quỳ gối. Bài học từ câu chuyện này rất đơn giản: **Đừng song song hóa stream pipeline một cách bừa bãi.** Hậu quả về hiệu năng có thể rất thảm khốc.

Theo quy tắc chung, **lợi ích hiệu năng từ song song hóa là tốt nhất trên các stream của các instance** `ArrayList`**,** `HashMap`**,** `HashSet` **và** `ConcurrentHashMap`**; mảng; các dải** `int`**; và các dải** `long`**.** Điểm chung của các cấu trúc dữ liệu này là tất cả đều có thể được chia chính xác và rẻ thành các dải con với kích thước bất kỳ mong muốn, giúp dễ dàng phân chia công việc giữa các thread song song. Khái niệm trừu tượng mà thư viện stream dùng để thực hiện việc này là *spliterator*, được trả về bởi method `spliterator` trên `Stream` và `Iterable`.

Một yếu tố quan trọng khác mà tất cả các cấu trúc dữ liệu này có chung là chúng cung cấp *tính cục bộ tham chiếu* (locality of reference) từ tốt đến xuất sắc khi được xử lý tuần tự: các tham chiếu phần tử liên tiếp được lưu cạnh nhau trong bộ nhớ. Các đối tượng mà những tham chiếu đó trỏ tới có thể không nằm gần nhau trong bộ nhớ, điều này làm giảm tính cục bộ tham chiếu. Tính cục bộ tham chiếu hóa ra cực kỳ quan trọng đối với việc song song hóa các thao tác hàng loạt: không có nó, các thread dành phần lớn thời gian ở trạng thái rảnh, chờ dữ liệu được chuyển từ bộ nhớ vào cache của bộ xử lý. Các cấu trúc dữ liệu có tính cục bộ tham chiếu tốt nhất là mảng primitive vì bản thân dữ liệu được lưu liên tục trong bộ nhớ.

Bản chất của terminal operation trong một stream pipeline cũng ảnh hưởng đến hiệu quả của việc thực thi song song. Nếu một lượng đáng kể công việc được thực hiện trong terminal operation so với tổng công việc của pipeline, và thao tác đó vốn dĩ mang tính tuần tự, thì việc song song hóa pipeline sẽ có hiệu quả hạn chế. Các terminal operation tốt nhất cho song song hóa là các *reduction*, trong đó tất cả các phần tử đi ra từ pipeline được kết hợp bằng một trong các method `reduce` của `Stream`, hoặc các reduction đóng gói sẵn như `min`, `max`, `count` và `sum`. Các thao tác *ngắn mạch* (short-circuiting) `anyMatch`, `allMatch` và `noneMatch` cũng thích hợp cho song song hóa. Các thao tác được thực hiện bởi method `collect` của `Stream`, được gọi là *mutable reduction*, không phải là ứng viên tốt cho song song hóa vì chi phí kết hợp các collection rất tốn kém.

Nếu bạn tự viết cài đặt `Stream`, `Iterable` hoặc `Collection` của riêng mình và muốn có hiệu năng song song tử tế, bạn phải override method `spliterator` và kiểm thử rộng rãi hiệu năng song song của các stream thu được. Viết spliterator chất lượng cao rất khó và nằm ngoài phạm vi của cuốn sách này.

**Song song hóa một stream không những có thể dẫn đến hiệu năng kém, kể cả liveness failure; nó còn có thể dẫn đến kết quả sai và hành vi không thể đoán trước** (*safety failure*). Safety failure có thể xảy ra khi song song hóa một pipeline dùng các mapper, filter và các function object khác do lập trình viên cung cấp mà không tuân thủ đặc tả của chúng. Đặc tả của `Stream` đặt ra những yêu cầu nghiêm ngặt đối với các function object này. Ví dụ, các hàm accumulator và combiner được truyền vào thao tác `reduce` của `Stream` phải có tính kết hợp (associative), không can thiệp (non-interfering) và không trạng thái (stateless). Nếu bạn vi phạm các yêu cầu này (một số được bàn trong **Item 46**) nhưng chạy pipeline tuần tự, nó nhiều khả năng vẫn cho kết quả đúng; nếu bạn song song hóa nó, nó nhiều khả năng sẽ thất bại, có thể là thảm khốc.

Theo hướng này, đáng lưu ý rằng ngay cả nếu chương trình số nguyên tố Mersenne song song hóa có chạy đến cùng, nó cũng sẽ không in các số nguyên tố theo đúng thứ tự (tăng dần). Để giữ nguyên thứ tự hiển thị của phiên bản tuần tự, bạn sẽ phải thay terminal operation `forEach` bằng `forEachOrdered`, thao tác này được đảm bảo duyệt các stream song song theo *encounter order* (thứ tự gặp).

Ngay cả khi giả định rằng bạn đang dùng một stream nguồn có thể chia tách hiệu quả, một terminal operation có thể song song hóa hoặc rẻ, và các function object không can thiệp, bạn vẫn sẽ không có được sự tăng tốc tốt từ song song hóa trừ khi pipeline thực hiện đủ công việc thực sự để bù đắp các chi phí gắn với song song hóa. Như một ước lượng *rất* thô, số phần tử trong stream nhân với số dòng mã được thực thi cho mỗi phần tử nên ít nhất là một trăm nghìn [**Lea14**].

Điều quan trọng cần nhớ là song song hóa một stream hoàn toàn là một tối ưu hóa hiệu năng. Như với bất kỳ tối ưu hóa nào, bạn phải kiểm thử hiệu năng trước và sau khi thay đổi để đảm bảo rằng việc đó đáng làm (**Item 67**). Lý tưởng nhất, bạn nên thực hiện kiểm thử trong một môi trường hệ thống thực tế. Thông thường, tất cả các stream pipeline song song trong một chương trình chạy trong một fork-join pool chung. Một pipeline hoạt động sai có thể gây hại cho hiệu năng của các pipeline khác ở những phần không liên quan của hệ thống.

Nếu nghe có vẻ như bạn đang gặp bất lợi khi song song hóa stream pipeline, thì đúng là như vậy. Một người quen của tôi, người bảo trì một cơ sở mã nhiều triệu dòng dùng stream rất nhiều, chỉ tìm thấy một số ít chỗ mà stream song song có hiệu quả. Điều này *không* có nghĩa là bạn nên tránh song song hóa stream. **Trong hoàn cảnh phù hợp, có thể đạt được sự tăng tốc gần như tuyến tính theo số lõi bộ xử lý chỉ bằng cách thêm một lời gọi** `parallel` **vào stream pipeline.** Một số lĩnh vực nhất định, như machine learning và xử lý dữ liệu, đặc biệt thích hợp cho những sự tăng tốc này.

Làm ví dụ đơn giản về một stream pipeline mà song song hóa có hiệu quả, hãy xem hàm sau để tính π(*n*), số các số nguyên tố nhỏ hơn hoặc bằng *n*:

```java
// Prime-counting stream pipeline - benefits from parallelization
static long pi(long n) {
    return LongStream.rangeClosed(2, n)
        .mapToObj(BigInteger::valueOf)
        .filter(i -> i.isProbablePrime(50))
        .count();
}
```

Trên máy của tôi, mất 31 giây để tính π(10^8) bằng hàm này. Chỉ cần thêm một lời gọi `parallel()` là giảm thời gian xuống 9,2 giây:

```java
// Prime-counting stream pipeline - parallel version
static long pi(long n) {
    return LongStream.rangeClosed(2, n)
        .parallel()
        .mapToObj(BigInteger::valueOf)
        .filter(i -> i.isProbablePrime(50))
        .count();
}
```

Nói cách khác, song song hóa phép tính giúp tăng tốc 3,7 lần trên máy bốn lõi của tôi. Đáng lưu ý rằng đây *không* phải là cách bạn sẽ tính π(*n*) cho các giá trị *n* lớn trong thực tế. Có những thuật toán hiệu quả hơn nhiều, tiêu biểu là công thức Lehmer.

Nếu bạn định song song hóa một stream các số ngẫu nhiên, hãy bắt đầu với `SplittableRandom` thay vì `ThreadLocalRandom` (hoặc `Random` vốn về cơ bản đã lỗi thời). Class `SplittableRandom` được thiết kế chính xác cho mục đích này, và có tiềm năng tăng tốc tuyến tính. Một instance ThreadLocalRandom được thiết kế để dùng bởi một thread duy nhất, và dù nó có thể tự thích nghi để hoạt động như nguồn của một stream song song, nó sẽ không nhanh bằng `SplittableRandom`. Một instance `Random` đồng bộ hóa trên mọi thao tác và sẽ dẫn đến tranh chấp quá mức, giết chết tính song song.

Tóm lại, đừng cố song song hóa một stream pipeline trừ khi bạn có lý do chính đáng để tin rằng nó sẽ giữ nguyên tính đúng đắn của phép tính và tăng tốc độ của nó. Cái giá của việc song song hóa stream không thích hợp có thể là chương trình thất bại hoặc thảm họa về hiệu năng. Nếu bạn tin rằng song song hóa có thể là hợp lý, hãy đảm bảo mã của bạn vẫn đúng khi chạy song song, và thực hiện các phép đo hiệu năng cẩn thận trong điều kiện thực tế. Nếu mã của bạn vẫn đúng và những thí nghiệm này xác nhận dự đoán của bạn về hiệu năng được cải thiện, thì khi đó và chỉ khi đó mới song song hóa stream trong mã sản phẩm.
