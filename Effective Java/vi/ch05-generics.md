# Chương 5. Generics

Kể từ Java 5, generics đã trở thành một phần của ngôn ngữ. Trước khi có generics, bạn phải ép kiểu (cast) mọi object đọc ra từ một collection. Nếu ai đó vô tình chèn vào một object sai kiểu, các phép ép kiểu có thể thất bại lúc runtime. Với generics, bạn cho compiler biết những kiểu object nào được phép có mặt trong mỗi collection. Compiler sẽ tự động chèn các phép ép kiểu cho bạn và báo cho bạn biết *ngay lúc biên dịch* nếu bạn cố chèn một object sai kiểu. Điều này tạo ra những chương trình vừa an toàn hơn vừa rõ ràng hơn, nhưng những lợi ích này, vốn không chỉ giới hạn ở collection, đi kèm với một cái giá. Chương này cho bạn biết cách tối đa hóa lợi ích và giảm thiểu những rắc rối.

## Item 26: Đừng dùng raw type

Trước hết, một vài thuật ngữ. Một class hoặc interface mà phần khai báo có một hoặc nhiều *type parameter* (tham số kiểu) là một class hoặc interface *generic* [JLS, 8.1.2, 9.1.2]. Ví dụ, interface `List` có một type parameter duy nhất, `E`, đại diện cho kiểu phần tử của nó. Tên đầy đủ của interface này là `List<E>` (đọc là “list of `E`”), nhưng người ta thường gọi tắt là `List`. Các class và interface generic được gọi chung là *generic type* (kiểu generic).

Mỗi generic type định nghĩa một tập các *parameterized type* (kiểu được tham số hóa), bao gồm tên class hoặc interface theo sau là một danh sách các *actual type parameter* (tham số kiểu thực tế) đặt trong dấu ngoặc nhọn, tương ứng với các formal type parameter (tham số kiểu hình thức) của generic type đó [JLS, 4.4, 4.5]. Ví dụ, `List<String>` (đọc là “list of string”) là một parameterized type biểu diễn một list có các phần tử thuộc kiểu `String`. (`String` là actual type parameter tương ứng với formal type parameter `E`.)

Cuối cùng, mỗi generic type định nghĩa một *raw type* (kiểu thô), là tên của generic type được dùng mà không kèm theo bất kỳ type parameter nào [JLS, 4.8]. Ví dụ, raw type tương ứng với `List<E>` là `List`. Raw type hoạt động như thể toàn bộ thông tin generic đã bị xóa khỏi phần khai báo kiểu. Chúng tồn tại chủ yếu để tương thích với mã nguồn viết trước khi có generics.

Trước khi generics được thêm vào Java, đây hẳn là một khai báo collection mẫu mực. Kể từ Java 9, nó vẫn hợp lệ, nhưng còn xa mới gọi là mẫu mực:

```java
// Raw collection type - don't do this!

// My stamp collection. Contains only Stamp instances.
private final Collection stamps = ... ;
```

Nếu ngày nay bạn dùng khai báo này rồi vô tình bỏ một đồng xu (coin) vào bộ sưu tập tem (stamp) của mình, thao tác chèn sai đó vẫn biên dịch và chạy không lỗi (dù compiler có phát ra một cảnh báo mơ hồ):

```java
// Erroneous insertion of coin into stamp collection
stamps.add(new Coin( ... )); // Emits "unchecked call" warning
```

Bạn sẽ không gặp lỗi cho đến khi cố lấy đồng xu ra khỏi bộ sưu tập tem:

```java
// Raw iterator type - don't do this!
for (Iterator i = stamps.iterator(); i.hasNext(); ) {
    Stamp stamp = (Stamp) i.next(); // Throws ClassCastException
        stamp.cancel();
}
```

Như đã nhắc đến xuyên suốt cuốn sách này, phát hiện lỗi càng sớm càng tốt sau khi chúng được tạo ra là điều đáng giá, lý tưởng nhất là ngay lúc biên dịch. Trong trường hợp này, bạn không phát hiện ra lỗi cho đến lúc runtime, rất lâu sau khi nó xảy ra, và trong đoạn mã có thể nằm cách xa đoạn mã chứa lỗi. Khi thấy `ClassCastException`, bạn phải lục tung cả codebase để tìm lời gọi method đã bỏ đồng xu vào bộ sưu tập tem. Compiler không thể giúp bạn, vì nó không hiểu được dòng comment nói rằng “`Contains only Stamp instances`”.

Với generics, thông tin nằm trong phần khai báo kiểu chứ không phải trong comment:

```java
// Parameterized collection type - typesafe
private final Collection<Stamp> stamps = ... ;
```

Từ khai báo này, compiler biết rằng `stamps` chỉ được chứa các instance của `Stamp` và *đảm bảo* điều đó là đúng, với giả định toàn bộ codebase của bạn biên dịch mà không phát ra (hoặc không bị chặn; xem **Item 27**) bất kỳ cảnh báo nào. Khi `stamps` được khai báo bằng một parameterized type, thao tác chèn sai sẽ sinh ra một thông báo lỗi lúc biên dịch cho bạn biết *chính xác* điều gì sai:

```java
Test.java:9: error: incompatible types: Coin cannot be converted
to Stamp
    stamps.add(new Coin());
              ^
```

Compiler chèn các phép ép kiểu vô hình cho bạn khi lấy phần tử ra khỏi collection và đảm bảo rằng chúng sẽ không thất bại (một lần nữa, với giả định là toàn bộ mã của bạn không sinh ra hoặc chặn bất kỳ cảnh báo nào của compiler). Dù viễn cảnh vô tình bỏ một đồng xu vào bộ sưu tập tem có vẻ xa vời, vấn đề này là có thật. Chẳng hạn, rất dễ hình dung việc bỏ một `BigInteger` vào một collection đáng lẽ chỉ chứa các instance của `BigDecimal`.

Như đã lưu ý ở trên, việc dùng raw type (generic type mà không có type parameter) là hợp lệ, nhưng bạn không bao giờ nên làm vậy. **Nếu dùng raw type, bạn đánh mất toàn bộ lợi ích về an toàn và tính biểu đạt của generics.** Đã vậy thì tại sao những người thiết kế ngôn ngữ lại cho phép raw type ngay từ đầu? Vì tính tương thích. Java sắp bước sang thập kỷ thứ hai khi generics được thêm vào, và đã tồn tại một lượng mã khổng lồ không dùng generics. Người ta xem việc toàn bộ lượng mã này vẫn hợp lệ và tương tác được với mã mới có dùng generics là điều tối quan trọng. Việc truyền các instance của parameterized type vào các method được thiết kế cho raw type, và ngược lại, phải là hợp lệ. Yêu cầu này, được gọi là *migration compatibility* (tương thích chuyển đổi), đã dẫn đến quyết định hỗ trợ raw type và cài đặt generics bằng cơ chế *erasure* (xóa kiểu) (**Item 28**).

Dù không nên dùng raw type như `List`, bạn hoàn toàn có thể dùng những kiểu được tham số hóa để cho phép chèn object tùy ý, chẳng hạn `List<Object>`. Vậy chính xác thì raw type `List` và parameterized type `List<Object>` khác nhau ở chỗ nào? Nói nôm na, cái trước đã từ chối tham gia vào hệ thống kiểu generic, còn cái sau đã nói rõ với compiler rằng nó có khả năng chứa object thuộc bất kỳ kiểu nào. Dù bạn có thể truyền một `List<String>` vào tham số kiểu `List`, bạn không thể truyền nó vào tham số kiểu `List<Object>`. Generics có các quy tắc về kiểu con (subtyping), và `List<String>` là kiểu con của raw type `List`, nhưng không phải kiểu con của parameterized type `List<Object>` (**Item 28**). Hệ quả là **bạn đánh mất an toàn kiểu nếu dùng raw type như** `List` **, nhưng không mất nếu dùng parameterized type như** `List<Object>` **.**

Để cụ thể hóa, hãy xét chương trình sau:

```java
// Fails at runtime - unsafeAdd method uses a raw type (List)!
public static void main(String[] args) {
    List<String> strings = new ArrayList<>();
    unsafeAdd(strings, Integer.valueOf(42));
    String s = strings.get(0); // Has compiler-generated cast
}

private static void unsafeAdd(List list, Object o) {
    list.add(o);
}
```

Chương trình này biên dịch được, nhưng vì nó dùng raw type `List` nên bạn nhận được một cảnh báo:

```java
Test.java:10: warning: [unchecked] unchecked call to add(E) as a
member of the raw type List
    list.add(o);
            ^
```

Và quả thật, nếu chạy chương trình, bạn sẽ gặp `ClassCastException` khi chương trình cố ép kết quả của lời gọi `strings.get(0)`, vốn là một `Integer`, sang `String`. Đây là phép ép kiểu do compiler sinh ra, nên bình thường nó được đảm bảo thành công, nhưng trong trường hợp này chúng ta đã phớt lờ một cảnh báo của compiler và phải trả giá.

Nếu bạn thay raw type `List` bằng parameterized type `List<Object>` trong khai báo của `unsafeAdd` rồi thử biên dịch lại chương trình, bạn sẽ thấy nó không còn biên dịch được nữa mà phát ra thông báo lỗi:

```java
Test.java:5: error: incompatible types: List<String> cannot be
converted to List<Object>
    unsafeAdd(strings, Integer.valueOf(42));
        ^
```

Bạn có thể bị cám dỗ dùng raw type cho một collection mà kiểu phần tử không được biết và cũng không quan trọng. Ví dụ, giả sử bạn muốn viết một method nhận vào hai set và trả về số phần tử chung của chúng. Đây là cách bạn có thể viết method như vậy nếu còn mới với generics:

```java
// Use of raw type for unknown element type - don't do this!
static int numElementsInCommon(Set s1, Set s2) {
    int result = 0;
    for (Object o1 : s1)
        if (s2.contains(o1))
            result++;
    return result;
}
```

Method này hoạt động nhưng dùng raw type, vốn nguy hiểm. Giải pháp thay thế an toàn là dùng *unbounded wildcard type* (kiểu wildcard không giới hạn). Nếu bạn muốn dùng một generic type nhưng không biết hoặc không quan tâm actual type parameter là gì, bạn có thể dùng dấu chấm hỏi thay thế. Ví dụ, unbounded wildcard type cho generic type `Set<E>` là `Set<?>` (đọc là “set of some type”). Đây là parameterized type `Set` tổng quát nhất, có thể chứa *bất kỳ* set nào. Khai báo `numElementsInCommon` với unbounded wildcard type trông như sau:

```java
// Uses unbounded wildcard type - typesafe and flexible
static int numElementsInCommon(Set<?> s1, Set<?> s2) { ... }
```

Unbounded wildcard type `Set<?>` và raw type `Set` khác nhau ở đâu? Dấu chấm hỏi có thực sự đem lại điều gì không? Không phải để nói dai, nhưng wildcard type thì an toàn còn raw type thì không. Bạn có thể bỏ *bất kỳ* phần tử nào vào một collection có raw type, dễ dàng phá vỡ bất biến về kiểu của collection (như method `unsafeAdd` ở trang 119 đã minh họa); **bạn không thể bỏ bất kỳ phần tử nào (ngoài** `null` **) vào một** `Collection<?>` **.** Cố làm vậy sẽ sinh ra thông báo lỗi lúc biên dịch như thế này:

```java
WildCard.java:13: error: incompatible types: String cannot be
converted to CAP#1
    c.add("verboten");
          ^
  where CAP#1 is a fresh type-variable:
    CAP#1 extends Object from capture of ?
```

Phải thừa nhận rằng thông báo lỗi này chưa thật hoàn hảo, nhưng compiler đã làm đúng việc của nó, ngăn bạn phá vỡ bất biến về kiểu của collection, bất kể kiểu phần tử của nó là gì. Không những bạn không thể bỏ bất kỳ phần tử nào (ngoài `null`) vào một `Collection<?>`, mà bạn còn không thể giả định bất cứ điều gì về kiểu của các object lấy ra từ đó. Nếu những hạn chế này là không thể chấp nhận, bạn có thể dùng *generic method* (**Item 30**) hoặc *bounded wildcard type* (kiểu wildcard có giới hạn) (**Item 31**).

Có một vài ngoại lệ nhỏ đối với quy tắc không dùng raw type. **Bạn phải dùng raw type trong class literal.** Đặc tả ngôn ngữ không cho phép dùng parameterized type (dù có cho phép kiểu mảng và kiểu nguyên thủy) [JLS, 15.8.2]. Nói cách khác, `List.class`, `String[].class` và `int.class` đều hợp lệ, nhưng `List<String>.class` và `List<?>.class` thì không.

Ngoại lệ thứ hai của quy tắc liên quan đến toán tử `instanceof`. Vì thông tin generic type bị xóa lúc runtime, việc dùng toán tử `instanceof` với các parameterized type khác ngoài unbounded wildcard type là không hợp lệ. Việc dùng unbounded wildcard type thay cho raw type không ảnh hưởng gì đến hành vi của toán tử `instanceof`. Trong trường hợp này, dấu ngoặc nhọn và dấu chấm hỏi chỉ là thứ thừa thãi. **Đây là cách nên dùng toán tử** `instanceof` **với generic type:**

```java
// Legitimate use of raw type - instanceof operator
if (o instanceof Set) {       // Raw type
    Set<?> s = (Set<?>) o;    // Wildcard type
    ...
}
```

Lưu ý rằng một khi đã xác định `o` là một `Set`, bạn phải ép nó sang wildcard type `Set<?>`, chứ không phải raw type `Set`. Đây là một phép ép kiểu có kiểm tra (checked cast), nên nó sẽ không gây ra cảnh báo của compiler.

Tóm lại, dùng raw type có thể dẫn đến exception lúc runtime, vì vậy đừng dùng chúng. Chúng chỉ được cung cấp để tương thích và tương tác với mã cũ có từ trước khi generics ra đời. Ôn nhanh lại: `Set<Object>` là một parameterized type biểu diễn một set có thể chứa object thuộc bất kỳ kiểu nào, `Set<?>` là một wildcard type biểu diễn một set chỉ có thể chứa object thuộc một kiểu nào đó chưa biết, còn `Set` là một raw type, đã đứng ngoài hệ thống kiểu generic. Hai cái đầu an toàn, cái cuối thì không.

Để tiện tra cứu, các thuật ngữ được giới thiệu trong Item này (và một vài thuật ngữ được giới thiệu ở phần sau của chương) được tóm tắt trong bảng sau:

| **Thuật ngữ** | **Ví dụ** | **Item** |
|---|---|---|
| Parameterized type (kiểu được tham số hóa) | `List<String>` | Item 26 |
| Actual type parameter (tham số kiểu thực tế) | `String` | Item 26 |
| Generic type (kiểu generic) | `List<E>` | Item 26, 29 |
| Formal type parameter (tham số kiểu hình thức) | `E` | Item 26 |
| Unbounded wildcard type (kiểu wildcard không giới hạn) | `List<?>` | Item 26 |
| Raw type (kiểu thô) | `List` | Item 26 |
| Bounded type parameter (tham số kiểu có giới hạn) | `<E extends Number>` | Item 29 |
| Recursive type bound (giới hạn kiểu đệ quy) | `<T extends Comparable<T>>` | Item 30 |
| Bounded wildcard type (kiểu wildcard có giới hạn) | `List<? extends Number>` | Item 31 |
| Generic method (phương thức generic) | `static <E> List<E> asList(E[] a)` | Item 30 |
| Type token | `String.class` | Item 33 |

## Item 27: Loại bỏ các cảnh báo unchecked

Khi lập trình với generics, bạn sẽ thấy rất nhiều cảnh báo của compiler: cảnh báo unchecked cast, cảnh báo unchecked method invocation, cảnh báo unchecked parameterized vararg type, và cảnh báo unchecked conversion. Càng có nhiều kinh nghiệm với generics, bạn càng nhận được ít cảnh báo hơn, nhưng đừng kỳ vọng mã mới viết sẽ biên dịch sạch sẽ ngay.

Nhiều cảnh báo unchecked rất dễ loại bỏ. Ví dụ, giả sử bạn vô tình viết khai báo này:

```java
Set<Lark> exaltation = new HashSet();
```

Compiler sẽ nhẹ nhàng nhắc bạn đã làm sai điều gì:

```java
Venery.java:4: warning: [unchecked] unchecked conversion
        Set<Lark> exaltation = new HashSet();
                               ^
  required: Set<Lark>
  found:    HashSet
```

Khi đó bạn có thể sửa theo chỉ dẫn, khiến cảnh báo biến mất. Lưu ý rằng bạn thực ra không cần chỉ rõ type parameter, mà chỉ cần cho biết nó có mặt bằng *diamond operator* (toán tử kim cương) (`<>`), được giới thiệu từ Java 7. Compiler sau đó sẽ *suy luận* (infer) ra actual type parameter đúng (trong trường hợp này là `Lark`):

```java
Set<Lark> exaltation = new HashSet<>();
```

Một số cảnh báo sẽ khó loại bỏ hơn *rất nhiều*. Chương này đầy những ví dụ về các cảnh báo như vậy. Khi gặp những cảnh báo đòi hỏi phải suy nghĩ, hãy kiên trì! **Hãy loại bỏ mọi cảnh báo unchecked mà bạn có thể.** Nếu loại bỏ được hết cảnh báo, bạn được đảm bảo rằng mã của mình là an toàn về kiểu (typesafe), và đó là một điều rất tốt. Nó có nghĩa là bạn sẽ không gặp `ClassCastException` lúc runtime, và nó làm tăng sự tự tin của bạn rằng chương trình sẽ hoạt động đúng như dự định.

**Nếu bạn không thể loại bỏ một cảnh báo, nhưng có thể chứng minh rằng đoạn mã gây ra cảnh báo đó là an toàn về kiểu, thì (và chỉ khi đó) hãy chặn cảnh báo bằng annotation** `@SuppressWarnings("unchecked")` **.** Nếu bạn chặn cảnh báo mà không chứng minh trước rằng mã là an toàn về kiểu, bạn đang tự tạo cho mình một cảm giác an toàn giả tạo. Mã có thể biên dịch mà không phát ra cảnh báo nào, nhưng vẫn có thể ném `ClassCastException` lúc runtime. Ngược lại, nếu bạn phớt lờ những cảnh báo unchecked mà bạn biết là an toàn (thay vì chặn chúng), bạn sẽ không nhận ra khi một cảnh báo mới xuất hiện đại diện cho một vấn đề thực sự. Cảnh báo mới sẽ bị chìm lẫn giữa tất cả những báo động giả mà bạn đã không dập tắt.

Annotation `SuppressWarnings` có thể được dùng trên bất kỳ khai báo nào, từ một khai báo biến cục bộ đơn lẻ cho đến cả một class. **Luôn dùng annotation** `SuppressWarnings` **trên phạm vi nhỏ nhất có thể.** Thông thường đó sẽ là một khai báo biến hoặc một method hay constructor rất ngắn. Đừng bao giờ dùng `SuppressWarnings` trên cả một class. Làm vậy có thể che khuất những cảnh báo quan trọng.

Nếu bạn thấy mình đang dùng annotation `SuppressWarnings` trên một method hoặc constructor dài hơn một dòng, có thể bạn chuyển nó sang một khai báo biến cục bộ được. Bạn có thể phải khai báo thêm một biến cục bộ mới, nhưng điều đó đáng giá. Ví dụ, hãy xét method `toArray` này, lấy từ `ArrayList`:

```java
public <T> T[] toArray(T[] a) {
    if (a.length < size)
       return (T[]) Arrays.copyOf(elements, size, a.getClass());
    System.arraycopy(elements, 0, a, 0, size);
    if (a.length > size)
       a[size] = null;
    return a;
}
```

Nếu bạn biên dịch `ArrayList`, method này sinh ra cảnh báo sau:

```java
ArrayList.java:305: warning: [unchecked] unchecked cast
       return (T[]) Arrays.copyOf(elements, size, a.getClass());
                                 ^
  required: T[]
  found:    Object[]
```

Đặt annotation `SuppressWarnings` trên câu lệnh return là không hợp lệ, vì đó không phải là một khai báo [JLS, 9.7]. Bạn có thể bị cám dỗ đặt annotation lên toàn bộ method, nhưng đừng làm vậy. Thay vào đó, hãy khai báo một biến cục bộ để giữ giá trị trả về và đặt annotation lên khai báo của nó, như sau:

```java
// Adding local variable to reduce scope of @SuppressWarnings
public <T> T[] toArray(T[] a) {
    if (a.length < size) {
        // This cast is correct because the array we're creating
        // is of the same type as the one passed in, which is T[].
        @SuppressWarnings("unchecked") T[] result =
            (T[]) Arrays.copyOf(elements, size, a.getClass());
        return result;
    }
    System.arraycopy(elements, 0, a, 0, size);
    if (a.length > size)
        a[size] = null;
    return a;
}
```

Method thu được biên dịch sạch sẽ và thu hẹp tối đa phạm vi mà các cảnh báo unchecked bị chặn.

**Mỗi khi dùng annotation** `@SuppressWarnings("unchecked")` **, hãy thêm một comment giải thích tại sao làm vậy là an toàn.** Điều này sẽ giúp người khác hiểu mã, và quan trọng hơn, nó sẽ giảm khả năng ai đó sửa mã theo cách khiến phép tính trở nên không an toàn. Nếu bạn thấy khó viết một comment như vậy, hãy tiếp tục suy nghĩ. Có thể cuối cùng bạn sẽ nhận ra rằng thao tác unchecked đó thực ra không hề an toàn.

Tóm lại, các cảnh báo unchecked là quan trọng. Đừng phớt lờ chúng. Mỗi cảnh báo unchecked đại diện cho khả năng xảy ra `ClassCastException` lúc runtime. Hãy cố hết sức để loại bỏ những cảnh báo này. Nếu bạn không thể loại bỏ một cảnh báo unchecked và có thể chứng minh rằng đoạn mã gây ra nó là an toàn về kiểu, hãy chặn cảnh báo bằng annotation `@SuppressWarnings("unchecked")` trong phạm vi hẹp nhất có thể. Hãy ghi lại lý do cho quyết định chặn cảnh báo của bạn trong một comment.

## Item 28: Ưu tiên list hơn mảng

Mảng khác với generic type ở hai điểm quan trọng. Thứ nhất, mảng là *covariant* (hiệp biến). Từ nghe có vẻ đáng sợ này đơn giản có nghĩa là nếu `Sub` là kiểu con của `Super`, thì kiểu mảng `Sub[]` là kiểu con của kiểu mảng `Super[]`. Ngược lại, generics là *invariant* (bất biến): với hai kiểu khác nhau bất kỳ `Type1` và `Type2`, `List<Type1>` không phải là kiểu con cũng không phải là kiểu cha của `List<Type2>` [JLS, 4.10; Naftalin07, 2.5]. Bạn có thể nghĩ điều này có nghĩa là generics còn thiếu sót, nhưng có thể lập luận rằng chính mảng mới là thứ thiếu sót. Đoạn mã này là hợp lệ:

```java
// Fails at runtime!
Object[] objectArray = new Long[1];
objectArray[0] = "I don't fit in"; // Throws ArrayStoreException
```

nhưng đoạn này thì không:

```java
// Won't compile!
List<Object> ol = new ArrayList<Long>(); // Incompatible types
ol.add("I don't fit in");
```

Dù bằng cách nào bạn cũng không thể bỏ một `String` vào một container chứa `Long`, nhưng với mảng bạn phát hiện ra mình đã mắc lỗi lúc runtime; với list, bạn phát hiện ra lúc biên dịch. Dĩ nhiên, bạn muốn phát hiện ra lúc biên dịch hơn. Điểm khác biệt lớn thứ hai giữa mảng và generics là mảng được *reified* (cụ thể hóa lúc runtime) [JLS, 4.7]. Điều này có nghĩa là mảng biết và ép buộc kiểu phần tử của nó lúc runtime. Như đã lưu ý ở trên, nếu bạn cố bỏ một `String` vào một mảng `Long`, bạn sẽ gặp `ArrayStoreException`. Ngược lại, generics được cài đặt bằng cơ chế *erasure* (xóa kiểu) [JLS, 4.6]. Điều này có nghĩa là chúng chỉ ép buộc các ràng buộc về kiểu lúc biên dịch và loại bỏ (hay *xóa*) thông tin kiểu phần tử lúc runtime. Erasure chính là thứ cho phép generic type tương tác tự do với mã cũ không dùng generics (**Item 26**), đảm bảo một sự chuyển đổi êm thấm sang generics trong Java 5.

Vì những khác biệt căn bản này, mảng và generics không hòa hợp tốt với nhau. Ví dụ, việc tạo một mảng của generic type, của parameterized type, hay của type parameter là không hợp lệ. Do đó, không biểu thức tạo mảng nào trong số này là hợp lệ: `new List<E>[]`, `new List<String>[]`, `new E[]`. Tất cả đều dẫn đến lỗi *generic array creation* (tạo mảng generic) lúc biên dịch.

Tại sao tạo mảng generic lại không hợp lệ? Vì nó không an toàn về kiểu. Nếu nó hợp lệ, các phép ép kiểu do compiler sinh ra trong một chương trình vốn đúng đắn có thể thất bại lúc runtime với `ClassCastException`. Điều này sẽ vi phạm sự đảm bảo căn bản mà hệ thống kiểu generic cung cấp.

Để cụ thể hơn, hãy xét đoạn mã sau:

```java
// Why generic array creation is illegal - won't compile!
List<String>[] stringLists = new List<String>[1];  // (1)
List<Integer> intList = List.of(42);               // (2)
Object[] objects = stringLists;                    // (3)
objects[0] = intList;                              // (4)
String s = stringLists[0].get(0);                  // (5)
```

Hãy giả vờ rằng dòng 1, dòng tạo một mảng generic, là hợp lệ. Dòng 2 tạo và khởi tạo một `List<Integer>` chứa một phần tử duy nhất. Dòng 3 lưu mảng `List<String>` vào một biến mảng `Object`, điều này hợp lệ vì mảng là covariant. Dòng 4 lưu `List<Integer>` vào phần tử duy nhất của mảng `Object`, điều này thành công vì generics được cài đặt bằng erasure: kiểu runtime của một instance `List<Integer>` đơn giản là `List`, và kiểu runtime của một instance `List<String>[]` là `List[]`, nên phép gán này không sinh ra `ArrayStoreException`. Giờ thì chúng ta gặp rắc rối. Chúng ta đã lưu một instance `List<Integer>` vào một mảng được khai báo là chỉ chứa các instance `List<String>`. Ở dòng 5, chúng ta lấy phần tử duy nhất từ list duy nhất trong mảng này. Compiler tự động ép phần tử lấy ra sang `String`, nhưng nó lại là một `Integer`, nên chúng ta gặp `ClassCastException` lúc runtime. Để ngăn điều này xảy ra, dòng 1 (dòng tạo mảng generic) phải sinh ra lỗi lúc biên dịch.

Các kiểu như `E`, `List<E>` và `List<String>` về mặt kỹ thuật được gọi là kiểu *non-reifiable* (không thể cụ thể hóa) [JLS, 4.7]. Nói một cách trực quan, một kiểu non-reifiable là kiểu mà biểu diễn lúc runtime của nó chứa ít thông tin hơn biểu diễn lúc biên dịch. Vì erasure, các parameterized type duy nhất có thể reifiable là các unbounded wildcard type như `List<?>` và `Map<?,?>` (**Item 26**). Việc tạo mảng của unbounded wildcard type là hợp lệ, dù hiếm khi hữu ích.

Lệnh cấm tạo mảng generic có thể gây khó chịu. Chẳng hạn, nó có nghĩa là nhìn chung một generic collection không thể trả về một mảng thuộc kiểu phần tử của nó (nhưng hãy xem **Item 33** để có một giải pháp một phần). Nó cũng có nghĩa là bạn nhận được những cảnh báo khó hiểu khi dùng các method varargs (**Item 53**) kết hợp với generic type. Đó là vì mỗi khi bạn gọi một method varargs, một mảng được tạo ra để chứa các tham số varargs. Nếu kiểu phần tử của mảng này không reifiable, bạn sẽ nhận được cảnh báo. Annotation `SafeVarargs` có thể được dùng để giải quyết vấn đề này (**Item 32**).

Khi bạn gặp lỗi generic array creation hoặc cảnh báo unchecked cast khi ép sang một kiểu mảng, giải pháp tốt nhất thường là dùng kiểu collection `List<E>` thay cho kiểu mảng `E[]`. Bạn có thể phải hy sinh đôi chút về độ ngắn gọn hoặc hiệu năng, nhưng đổi lại bạn có được an toàn kiểu và khả năng tương tác tốt hơn.

Ví dụ, giả sử bạn muốn viết một class `Chooser` với một constructor nhận vào một collection, và một method duy nhất trả về một phần tử của collection được chọn ngẫu nhiên. Tùy vào collection bạn truyền cho constructor, bạn có thể dùng một chooser như một con xúc xắc trong trò chơi, một quả cầu tiên tri (magic 8-ball), hay một nguồn dữ liệu cho mô phỏng Monte Carlo. Đây là một cài đặt đơn giản không dùng generics:

```java
// Chooser - a class badly in need of generics!
public class Chooser {
    private final Object[] choiceArray;

    public Chooser(Collection choices) {
        choiceArray = choices.toArray();
    }

    public Object choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceArray[rnd.nextInt(choiceArray.length)];
    }
}
```

Để dùng class này, bạn phải ép giá trị trả về của method `choose` từ `Object` sang kiểu mong muốn mỗi lần gọi method, và phép ép kiểu sẽ thất bại lúc runtime nếu bạn nhầm kiểu. Ghi nhớ lời khuyên của **Item 29**, chúng ta thử sửa `Chooser` để biến nó thành generic. Các thay đổi được in đậm:

```java
// A first cut at making Chooser generic - won't compile
public class Chooser<T> {
    private final T[] choiceArray;

    public Chooser(Collection<T> choices) {
        choiceArray = choices.toArray();
    }

    // choose method unchanged
}
```

Nếu bạn thử biên dịch class này, bạn sẽ nhận được thông báo lỗi sau:

```java
Chooser.java:9: error: incompatible types: Object[] cannot be
converted to T[]
        choiceArray = choices.toArray();
                                     ^
  where T is a type-variable:
    T extends Object declared in class Chooser
```

Không vấn đề gì, bạn nói, tôi sẽ ép mảng `Object` sang mảng `T`:

```java
choiceArray = (T[]) choices.toArray();
```

Cách này loại bỏ được lỗi, nhưng thay vào đó bạn nhận được một cảnh báo:

```java
Chooser.java:9: warning: [unchecked] unchecked cast
        choiceArray = (T[]) choices.toArray();
                                           ^
  required: T[], found: Object[]
  where T is a type-variable:
T extends Object declared in class Chooser
```

Compiler đang nói với bạn rằng nó không thể bảo đảm tính an toàn của phép ép kiểu lúc runtime vì chương trình sẽ không biết `T` đại diện cho kiểu gì—hãy nhớ rằng thông tin kiểu phần tử bị xóa khỏi generics lúc runtime. Chương trình có chạy được không? Có, nhưng compiler không chứng minh được điều đó. Bạn có thể tự chứng minh, đặt lời chứng minh vào một comment rồi chặn cảnh báo bằng annotation, nhưng tốt hơn là bạn nên loại bỏ nguyên nhân gây ra cảnh báo (**Item 27**).

Để loại bỏ cảnh báo unchecked cast, hãy dùng list thay cho mảng. Đây là một phiên bản của class `Chooser` biên dịch không lỗi và không cảnh báo:

```java
// List-based Chooser - typesafe
public class Chooser<T> {
    private final List<T> choiceList;

    public Chooser(Collection<T> choices) {
        choiceList = new ArrayList<>(choices);
    }

    public T choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceList.get(rnd.nextInt(choiceList.size()));
    }
}
```

Phiên bản này dài dòng hơn một chút, và có lẽ chậm hơn một chút, nhưng nó đáng giá để đổi lấy sự yên tâm rằng bạn sẽ không gặp `ClassCastException` lúc runtime.

Tóm lại, mảng và generics có các quy tắc về kiểu rất khác nhau. Mảng là covariant và reified; generics là invariant và bị erased. Hệ quả là mảng cung cấp an toàn kiểu lúc runtime nhưng không cung cấp an toàn kiểu lúc biên dịch, và generics thì ngược lại. Theo quy tắc chung, mảng và generics không hòa hợp tốt với nhau. Nếu bạn thấy mình đang trộn lẫn chúng và gặp lỗi hoặc cảnh báo lúc biên dịch, phản xạ đầu tiên của bạn nên là thay các mảng bằng list.

## Item 29: Ưu tiên generic type

Nhìn chung, việc tham số hóa các khai báo của bạn và tận dụng các generic type cũng như generic method do JDK cung cấp không quá khó. Viết generic type của riêng bạn thì khó hơn một chút, nhưng đáng để bỏ công học cách làm.

Hãy xét cài đặt stack đơn giản (mang tính minh họa) từ **Item 7**:

```java
// Object-based collection - a prime candidate for generics
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }
    public void push(Object e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() {
        if (size == 0)
            throw new EmptyStackException();
        Object result = elements[--size];
        elements[size] = null; // Eliminate obsolete reference
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

Class này lẽ ra nên được tham số hóa ngay từ đầu, nhưng vì không phải vậy, chúng ta có thể *generify* (generic hóa) nó sau. Nói cách khác, chúng ta có thể tham số hóa nó mà không làm hại các client của phiên bản gốc chưa tham số hóa. Ở trạng thái hiện tại, client phải ép kiểu các object được pop ra khỏi stack, và những phép ép kiểu đó có thể thất bại lúc runtime. Bước đầu tiên khi generic hóa một class là thêm một hoặc nhiều type parameter vào phần khai báo của nó. Trong trường hợp này có một type parameter, đại diện cho kiểu phần tử của stack, và tên theo quy ước cho type parameter này là `E` (**Item 68**).

Bước tiếp theo là thay tất cả các chỗ dùng kiểu `Object` bằng type parameter thích hợp rồi thử biên dịch chương trình thu được:

```java
// Initial attempt to generify Stack - won't compile!
public class Stack<E> {
    private E[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    public Stack() {
        elements = new E[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public E pop() {
        if (size == 0)
            throw new EmptyStackException();
        E result = elements[--size];
        elements[size] = null; // Eliminate obsolete reference
        return result;
    }
    ... // no changes in isEmpty or ensureCapacity
}
```

Thường thì bạn sẽ nhận được ít nhất một lỗi hoặc cảnh báo, và class này không phải ngoại lệ. May mắn là class này chỉ sinh ra một lỗi:

```java
Stack.java:8: generic array creation
        elements = new E[DEFAULT_INITIAL_CAPACITY];
                   ^
```

Như đã giải thích trong **Item 28**, bạn không thể tạo một mảng thuộc kiểu non-reifiable, chẳng hạn như `E`. Vấn đề này nảy sinh mỗi khi bạn viết một generic type được cài đặt dựa trên mảng. Có hai cách hợp lý để giải quyết. Giải pháp thứ nhất lách trực tiếp lệnh cấm tạo mảng generic: tạo một mảng `Object` rồi ép nó sang kiểu mảng generic. Lúc này thay vì lỗi, compiler sẽ phát ra một cảnh báo. Cách dùng này hợp lệ, nhưng (nhìn chung) không an toàn về kiểu:

```java
Stack.java:8: warning: [unchecked] unchecked cast
found: Object[], required: E[]
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
                       ^
```

Compiler có thể không chứng minh được rằng chương trình của bạn là an toàn về kiểu, nhưng bạn thì có thể. Bạn phải tự thuyết phục mình rằng phép ép kiểu unchecked sẽ không làm tổn hại đến an toàn kiểu của chương trình. Mảng đang xét (`elements`) được lưu trong một trường private và không bao giờ được trả về cho client hay truyền cho bất kỳ method nào khác. Các phần tử duy nhất được lưu trong mảng là những phần tử được truyền vào method `push`, vốn có kiểu `E`, nên phép ép kiểu unchecked không thể gây hại.

Một khi đã chứng minh được rằng một phép ép kiểu unchecked là an toàn, hãy chặn cảnh báo trong phạm vi hẹp nhất có thể (**Item 27**). Trong trường hợp này, constructor chỉ chứa mỗi thao tác tạo mảng unchecked, nên việc chặn cảnh báo trên toàn bộ constructor là thích hợp. Với việc thêm một annotation để làm điều này, `Stack` biên dịch sạch sẽ, và bạn có thể dùng nó mà không cần ép kiểu tường minh hay lo sợ `ClassCastException`:

```java
// The elements array will contain only E instances from push(E).
// This is sufficient to ensure type safety, but the runtime
// type of the array won't be E[]; it will always be Object[]!
@SuppressWarnings("unchecked")
public Stack() {
    elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
}
```

Cách thứ hai để loại bỏ lỗi generic array creation trong `Stack` là đổi kiểu của trường `elements` từ `E[]` sang `Object[]`. Nếu làm vậy, bạn sẽ nhận được một lỗi khác:

```java
Stack.java:19: incompatible types
found: Object, required: E
        E result = elements[--size];
                           ^
```

Bạn có thể biến lỗi này thành cảnh báo bằng cách ép phần tử lấy ra từ mảng sang `E`, nhưng bạn sẽ nhận được một cảnh báo:

```java
Stack.java:19: warning: [unchecked] unchecked cast
found: Object, required: E
        E result = (E) elements[--size];
                               ^
```

Vì `E` là kiểu non-reifiable, compiler không có cách nào kiểm tra phép ép kiểu lúc runtime. Một lần nữa, bạn có thể dễ dàng tự chứng minh rằng phép ép kiểu unchecked là an toàn, nên việc chặn cảnh báo là thích hợp. Theo đúng lời khuyên của **Item 27**, chúng ta chỉ chặn cảnh báo trên phép gán chứa phép ép kiểu unchecked, chứ không phải trên toàn bộ method `pop`:

```java
// Appropriate suppression of unchecked warning
public E pop() {
    if (size == 0)
        throw new EmptyStackException();

    // push requires elements to be of type E, so cast is correct
    @SuppressWarnings("unchecked") E result =
        (E) elements[--size];

    elements[size] = null; // Eliminate obsolete reference
    return result;
}
```

Cả hai kỹ thuật loại bỏ lỗi tạo mảng generic đều có người ủng hộ. Cách thứ nhất dễ đọc hơn: mảng được khai báo là kiểu `E[]`, chỉ rõ rằng nó chỉ chứa các instance của `E`. Nó cũng ngắn gọn hơn: trong một generic class điển hình, bạn đọc từ mảng ở nhiều điểm trong mã; kỹ thuật thứ nhất chỉ cần một phép ép kiểu duy nhất (ở nơi tạo mảng), trong khi kỹ thuật thứ hai cần một phép ép kiểu riêng mỗi lần đọc một phần tử mảng. Vì vậy, kỹ thuật thứ nhất được ưa chuộng hơn và được dùng phổ biến hơn trong thực tế. Tuy nhiên, nó gây ra *heap pollution* (ô nhiễm heap) (**Item 32**): kiểu runtime của mảng không khớp với kiểu lúc biên dịch của nó (trừ khi `E` tình cờ là `Object`). Điều này khiến một số lập trình viên đủ khó chịu để chọn kỹ thuật thứ hai, dù heap pollution trong tình huống này là vô hại.

Chương trình sau minh họa cách dùng class `Stack` generic của chúng ta. Chương trình in các đối số dòng lệnh theo thứ tự ngược lại và chuyển sang chữ hoa. Không cần ép kiểu tường minh nào để gọi method `toUpperCase` của `String` trên các phần tử được pop ra khỏi stack, và phép ép kiểu được sinh tự động được đảm bảo thành công:

```java
// Little program to exercise our generic Stack
public static void main(String[] args) {
    Stack<String> stack = new Stack<>();
    for (String arg : args)
        stack.push(arg);
    while (!stack.isEmpty())
        System.out.println(stack.pop().toUpperCase());
}
```

Ví dụ trên có vẻ mâu thuẫn với **Item 28**, vốn khuyến khích dùng list thay cho mảng. Không phải lúc nào cũng có thể hoặc nên dùng list bên trong các generic type của bạn. Java không hỗ trợ list một cách tự nhiên (natively), nên một số generic type, chẳng hạn `ArrayList`, *buộc phải* được cài đặt dựa trên mảng. Các generic type khác, chẳng hạn `HashMap`, được cài đặt dựa trên mảng vì lý do hiệu năng.

Phần lớn các generic type đều giống ví dụ `Stack` của chúng ta ở chỗ type parameter của chúng không có hạn chế nào: bạn có thể tạo `Stack<Object>`, `Stack<int[]>`, `Stack<List<String>>`, hay `Stack` của bất kỳ kiểu tham chiếu object nào khác. Lưu ý rằng bạn không thể tạo `Stack` của một kiểu nguyên thủy: cố tạo `Stack<int>` hay `Stack<double>` sẽ dẫn đến lỗi lúc biên dịch. Đây là một hạn chế căn bản của hệ thống kiểu generic trong Java. Bạn có thể vượt qua hạn chế này bằng cách dùng các boxed primitive type (**Item 61**).

Có một số generic type hạn chế các giá trị được phép của type parameter. Ví dụ, hãy xét `java.util.concurrent.DelayQueue`, có khai báo như sau:

```java
class DelayQueue<E extends Delayed> implements BlockingQueue<E>
```

Danh sách type parameter (`<E extends Delayed>`) yêu cầu actual type parameter `E` phải là kiểu con của `java.util.concurrent.Delayed`. Điều này cho phép cài đặt `DelayQueue` và các client của nó tận dụng các method của `Delayed` trên các phần tử của một `DelayQueue`, mà không cần ép kiểu tường minh hay có nguy cơ gặp `ClassCastException`. Type parameter `E` được gọi là *bounded type parameter* (tham số kiểu có giới hạn). Lưu ý rằng quan hệ kiểu con được định nghĩa sao cho mọi kiểu đều là kiểu con của chính nó [JLS, 4.10], nên việc tạo một `DelayQueue<Delayed>` là hợp lệ.

Tóm lại, generic type an toàn hơn và dễ dùng hơn những kiểu đòi hỏi phải ép kiểu trong mã client. Khi thiết kế các kiểu mới, hãy đảm bảo rằng chúng có thể được dùng mà không cần những phép ép kiểu như vậy. Điều này thường có nghĩa là làm cho các kiểu đó trở thành generic. Nếu bạn có bất kỳ kiểu hiện có nào đáng lẽ nên là generic mà chưa phải, hãy generic hóa chúng. Điều này sẽ giúp cuộc sống của những người dùng mới của các kiểu này dễ dàng hơn mà không phá vỡ các client hiện có (**Item 26**).

## Item 30: Ưu tiên generic method

Cũng như class có thể là generic, method cũng vậy. Các static utility method thao tác trên parameterized type thường là generic. Tất cả các method “thuật toán” trong `Collections` (chẳng hạn `binarySearch` và `sort`) đều là generic.

Viết generic method cũng tương tự như viết generic type. Hãy xét method thiếu sót này, trả về hợp của hai set:

```java
// Uses raw types - unacceptable! (Item 26)
public static Set union(Set s1, Set s2) {
    Set result = new HashSet(s1);
    result.addAll(s2);
    return result;
}
```

Method này biên dịch được nhưng kèm hai cảnh báo:

```java
Union.java:5: warning: [unchecked] unchecked call to
HashSet(Collection<? extends E>) as a member of raw type HashSet
        Set result = new HashSet(s1);
                     ^
Union.java:6: warning: [unchecked] unchecked call to
addAll(Collection<? extends E>) as a member of raw type Set
        result.addAll(s2);
                     ^
```

Để sửa các cảnh báo này và làm cho method an toàn về kiểu, hãy sửa khai báo của nó để khai báo một *type parameter* đại diện cho kiểu phần tử của cả ba set (hai đối số và giá trị trả về) và dùng type parameter này xuyên suốt method. **Danh sách type parameter, nơi khai báo các type parameter, nằm giữa các modifier của method và kiểu trả về của nó.** Trong ví dụ này, danh sách type parameter là `<E>`, và kiểu trả về là `Set<E>`. Quy ước đặt tên cho type parameter là như nhau đối với generic method và generic type (**Item 29**, **68**):

```java
// Generic method
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

Ít nhất với các generic method đơn giản, chỉ có vậy thôi. Method này biên dịch mà không sinh ra cảnh báo nào và cung cấp an toàn kiểu cũng như sự dễ dùng. Đây là một chương trình đơn giản để thử method này. Chương trình không chứa phép ép kiểu nào và biên dịch không lỗi, không cảnh báo:

```java
// Simple program to exercise generic method
public static void main(String[] args) {
    Set<String> guys = Set.of("Tom", "Dick", "Harry");
    Set<String> stooges = Set.of("Larry", "Moe", "Curly");
    Set<String> aflCio = union(guys, stooges);
    System.out.println(aflCio);
}
```

Khi chạy chương trình, nó in ra `[Moe, Tom, Harry, Larry, Curly, Dick]`. (Thứ tự các phần tử trong kết quả phụ thuộc vào cài đặt.)

Một hạn chế của method `union` là kiểu của cả ba set (hai tham số đầu vào và giá trị trả về) phải hoàn toàn giống nhau. Bạn có thể làm method linh hoạt hơn bằng cách dùng *bounded wildcard type* (**Item 31**).

Đôi khi, bạn sẽ cần tạo một object bất biến (immutable) nhưng áp dụng được cho nhiều kiểu khác nhau. Vì generics được cài đặt bằng erasure (**Item 28**), bạn có thể dùng một object duy nhất cho mọi tham số hóa kiểu cần thiết, nhưng bạn cần viết một static factory method để lặp đi lặp lại việc cấp phát object đó cho mỗi tham số hóa kiểu được yêu cầu. Mẫu này, gọi là *generic singleton factory*, được dùng cho các function object (**Item 42**) như `Collections.reverseOrder`, và thỉnh thoảng cho các collection như `Collections.emptySet`.

Giả sử bạn muốn viết một bộ cấp phát hàm đồng nhất (identity function). Thư viện đã cung cấp `Function.identity`, nên chẳng có lý do gì để tự viết (**Item 59**), nhưng nó có tính minh họa. Sẽ lãng phí nếu tạo một object hàm đồng nhất mới mỗi khi được yêu cầu, vì nó không có trạng thái (stateless). Nếu generics của Java là reified, bạn sẽ cần một hàm đồng nhất cho mỗi kiểu, nhưng vì chúng bị erased nên một generic singleton là đủ. Nó trông như sau:

```java
// Generic singleton factory pattern
private static UnaryOperator<Object> IDENTITY_FN = (t) -> t;

@SuppressWarnings("unchecked")
public static <T> UnaryOperator<T> identityFunction() {
    return (UnaryOperator<T>) IDENTITY_FN;
}
```

Phép ép `IDENTITY_FN` sang `(UnaryFunction<T>)` sinh ra cảnh báo unchecked cast, vì `UnaryOperator<Object>` không phải là `UnaryOperator<T>` với mọi `T`. Nhưng hàm đồng nhất là trường hợp đặc biệt: nó trả về đối số của mình mà không thay đổi, nên chúng ta biết rằng dùng nó như một `UnaryFunction<T>` là an toàn về kiểu, bất kể giá trị của `T` là gì. Do đó, chúng ta có thể tự tin chặn cảnh báo unchecked cast do phép ép kiểu này sinh ra. Sau khi làm vậy, mã biên dịch không lỗi, không cảnh báo.

Đây là một chương trình mẫu dùng generic singleton của chúng ta như một `UnaryOperator<String>` và một `UnaryOperator<Number>`. Như thường lệ, nó không chứa phép ép kiểu nào và biên dịch không lỗi, không cảnh báo:

```java
// Sample program to exercise generic singleton
public static void main(String[] args) {
    String[] strings = { "jute", "hemp", "nylon" };
    UnaryOperator<String> sameString = identityFunction();
    for (String s : strings)
        System.out.println(sameString.apply(s));

    Number[] numbers = { 1, 2.0, 3L };
    UnaryOperator<Number> sameNumber = identityFunction();
    for (Number n : numbers)
        System.out.println(sameNumber.apply(n));
}
```

Việc một type parameter bị giới hạn bởi một biểu thức có chứa chính type parameter đó là được phép, dù tương đối hiếm gặp. Đây là thứ được gọi là *recursive type bound* (giới hạn kiểu đệ quy). Một cách dùng phổ biến của recursive type bound là kết hợp với interface `Comparable`, interface định nghĩa thứ tự tự nhiên của một kiểu (**Item 14**). Interface này được trình bày ở đây:

```java
public interface Comparable<T> {
    int compareTo(T o);
}
```

Type parameter `T` định nghĩa kiểu mà các phần tử của kiểu cài đặt `Comparable<T>` có thể được so sánh với. Trong thực tế, gần như mọi kiểu chỉ có thể được so sánh với các phần tử cùng kiểu với chúng. Chẳng hạn, `String` cài đặt `Comparable<String>`, `Integer` cài đặt `Comparable<Integer>`, và cứ thế.

Nhiều method nhận vào một collection các phần tử cài đặt `Comparable` để sắp xếp nó, tìm kiếm trong nó, tính giá trị nhỏ nhất hay lớn nhất của nó, và những việc tương tự. Để làm những việc này, mọi phần tử trong collection phải so sánh được với mọi phần tử khác trong đó, nói cách khác, các phần tử của list phải *so sánh được lẫn nhau* (mutually comparable). Đây là cách biểu đạt ràng buộc đó:

```java
// Using a recursive type bound to express mutual comparability
public static <E extends Comparable<E>> E max(Collection<E> c);
```

Giới hạn kiểu `<E extends Comparable<E>>` có thể được đọc là “bất kỳ kiểu `E` nào có thể so sánh được với chính nó”, điều này tương ứng gần như chính xác với khái niệm so sánh được lẫn nhau.

Đây là một method đi kèm với khai báo trên. Nó tính giá trị lớn nhất trong một collection theo thứ tự tự nhiên của các phần tử, và nó biên dịch không lỗi, không cảnh báo:

```java
// Returns max value in a collection - uses recursive type bound
public static <E extends Comparable<E>> E max(Collection<E> c) {
    if (c.isEmpty())
        throw new IllegalArgumentException("Empty collection");

    E result = null;
    for (E e : c)
        if (result == null || e.compareTo(result) > 0)
            result = Objects.requireNonNull(e);
    return result;
}
```

Lưu ý rằng method này ném `IllegalArgumentException` nếu collection rỗng. Một lựa chọn tốt hơn là trả về `Optional<E>` (**Item 55**).

Recursive type bound có thể trở nên phức tạp hơn nhiều, nhưng may mắn là chúng hiếm khi như vậy. Nếu bạn hiểu idiom này, biến thể wildcard của nó (**Item 31**), và idiom *simulated self-type* (**Item 2**), bạn sẽ có thể xử lý hầu hết các recursive type bound gặp phải trong thực tế.

Tóm lại, generic method, giống như generic type, an toàn hơn và dễ dùng hơn những method đòi hỏi client phải ép kiểu tường minh các tham số đầu vào và giá trị trả về. Giống như với các kiểu, bạn nên đảm bảo rằng các method của mình có thể được dùng mà không cần ép kiểu, điều này thường có nghĩa là làm cho chúng trở thành generic. Và giống như với các kiểu, bạn nên generic hóa các method hiện có mà việc sử dụng chúng đòi hỏi ép kiểu. Điều này giúp cuộc sống của người dùng mới dễ dàng hơn mà không phá vỡ các client hiện có (**Item 26**).

## Item 31: Dùng bounded wildcard để tăng tính linh hoạt cho API

Như đã lưu ý trong **Item 28**, parameterized type là *invariant* (bất biến). Nói cách khác, với hai kiểu khác nhau bất kỳ `Type1` và `Type2`, `List<Type1>` không phải là kiểu con cũng không phải là kiểu cha của `List<Type2>`. Dù việc `List<String>` không phải là kiểu con của `List<Object>` có vẻ phản trực giác, điều đó thực sự hợp lý. Bạn có thể bỏ bất kỳ object nào vào một `List<Object>`, nhưng chỉ có thể bỏ string vào một `List<String>`. Vì một `List<String>` không thể làm mọi thứ mà một `List<Object>` có thể làm, nó không phải là kiểu con (theo nguyên lý thay thế Liskov, **Item 10**).

Đôi khi bạn cần sự linh hoạt nhiều hơn mức mà kiểu invariant có thể cung cấp. Hãy xét class `Stack` từ **Item 29**. Để nhắc lại, đây là public API của nó:

```java
public class Stack<E> {
    public Stack();
    public void push(E e);
    public E pop();
    public boolean isEmpty();
}
```

Giả sử chúng ta muốn thêm một method nhận vào một chuỗi các phần tử và push tất cả chúng vào stack. Đây là nỗ lực đầu tiên:

```java
// pushAll method without wildcard type - deficient!
public void pushAll(Iterable<E> src) {
    for (E e : src)
        push(e);
}
```

Method này biên dịch sạch sẽ, nhưng chưa hoàn toàn thỏa đáng. Nếu kiểu phần tử của `Iterable src` khớp chính xác với kiểu phần tử của stack, nó hoạt động tốt. Nhưng giả sử bạn có một `Stack<Number>` và bạn gọi `push(intVal)`, trong đó `intVal` có kiểu `Integer`. Điều này hoạt động vì `Integer` là kiểu con của `Number`. Vậy về mặt logic, có vẻ như điều này cũng nên hoạt động:

```java
Stack<Number> numberStack = new Stack<>();
Iterable<Integer> integers = ... ;
numberStack.pushAll(integers);
```

Tuy nhiên, nếu thử, bạn sẽ nhận được thông báo lỗi này vì parameterized type là invariant:

```java
StackTest.java:7: error: incompatible types: Iterable<Integer>
cannot be converted to Iterable<Number>
        numberStack.pushAll(integers);
                            ^
```

May mắn là có lối thoát. Ngôn ngữ cung cấp một loại parameterized type đặc biệt gọi là *bounded wildcard type* (kiểu wildcard có giới hạn) để xử lý những tình huống như thế này. Kiểu của tham số đầu vào cho `pushAll` không nên là “`Iterable` của `E`” mà là “`Iterable` của một kiểu con nào đó của `E`”, và có một wildcard type mang chính xác ý nghĩa đó: `Iterable<? extends E>`. (Việc dùng từ khóa `extends` hơi gây hiểu lầm: hãy nhớ lại từ **Item 29** rằng *kiểu con* được định nghĩa sao cho mọi kiểu đều là kiểu con của chính nó, dù nó không extends chính nó.) Hãy sửa `pushAll` để dùng kiểu này:

```java
// Wildcard type for a parameter that serves as an E producer
public void pushAll(Iterable<? extends E> src) {
    for (E e : src)
        push(e);
}
```

Với thay đổi này, không chỉ `Stack` biên dịch sạch sẽ, mà cả mã client vốn không biên dịch được với khai báo `pushAll` ban đầu cũng vậy. Vì `Stack` và client của nó biên dịch sạch sẽ, bạn biết rằng mọi thứ đều an toàn về kiểu.

Bây giờ giả sử bạn muốn viết một method `popAll` đi kèm với `pushAll`. Method `popAll` pop từng phần tử ra khỏi stack và thêm các phần tử đó vào collection được cho. Đây là nỗ lực đầu tiên khi viết method `popAll`:

```java
// popAll method without wildcard type - deficient!
public void popAll(Collection<E> dst) {
    while (!isEmpty())
        dst.add(pop());
}
```

Một lần nữa, method này biên dịch sạch sẽ và hoạt động tốt nếu kiểu phần tử của collection đích khớp chính xác với kiểu phần tử của stack. Nhưng cũng một lần nữa, nó chưa hoàn toàn thỏa đáng. Giả sử bạn có một `Stack<Number>` và một biến kiểu `Object`. Nếu bạn pop một phần tử ra khỏi stack và lưu vào biến đó, mã biên dịch và chạy không lỗi. Vậy chẳng lẽ bạn không nên làm được điều này nữa sao?

```java
Stack<Number> numberStack = new Stack<>();
Collection<Object> objects = ... ;
numberStack.popAll(objects);
```

Nếu bạn thử biên dịch mã client này với phiên bản `popAll` ở trên, bạn sẽ nhận được một lỗi rất giống với lỗi chúng ta gặp với phiên bản đầu tiên của `pushAll`: `Collection<Object>` không phải là kiểu con của `Collection<Number>`. Một lần nữa, wildcard type cung cấp lối thoát. Kiểu của tham số đầu vào cho `popAll` không nên là “collection của `E`” mà là “collection của một kiểu cha nào đó của `E`” (trong đó kiểu cha được định nghĩa sao cho `E` là kiểu cha của chính nó [JLS, 4.10]). Một lần nữa, có một wildcard type mang chính xác ý nghĩa đó: `Collection<? super E>`. Hãy sửa `popAll` để dùng nó:

```java
// Wildcard type for parameter that serves as an E consumer
public void popAll(Collection<? super E> dst) {
    while (!isEmpty())
        dst.add(pop());
}
```

Với thay đổi này, cả `Stack` lẫn mã client đều biên dịch sạch sẽ.

Bài học rất rõ ràng. **Để đạt độ linh hoạt tối đa, hãy dùng wildcard type trên các tham số đầu vào đại diện cho producer (bên sản xuất) hoặc consumer (bên tiêu thụ).** Nếu một tham số đầu vào vừa là producer vừa là consumer, thì wildcard type sẽ chẳng giúp gì cho bạn: bạn cần kiểu khớp chính xác, và đó là thứ bạn có khi không dùng wildcard nào.

Đây là một câu ghi nhớ giúp bạn nhớ nên dùng wildcard type nào:

**PECS là viết tắt của producer-**`extends`**, consumer-**`super`**.** Nói cách khác, nếu một parameterized type đại diện cho một producer của `T`, hãy dùng `<? extends T>`; nếu nó đại diện cho một consumer của `T`, hãy dùng `<? super T>`. Trong ví dụ `Stack` của chúng ta, tham số `src` của `pushAll` sản xuất các instance `E` để `Stack` sử dụng, nên kiểu thích hợp cho `src` là `Iterable<? extends E>`; tham số `dst` của `popAll` tiêu thụ các instance `E` từ `Stack`, nên kiểu thích hợp cho `dst` là `Collection<? super E>`. Câu ghi nhớ PECS nắm bắt nguyên tắc căn bản định hướng việc dùng wildcard type. Naftalin và Wadler gọi nó là *Get and Put Principle* (Nguyên lý Lấy và Đặt) [Naftalin07, 2.4].

Với câu ghi nhớ này trong đầu, hãy xem lại một số khai báo method và constructor từ các Item trước trong chương này. Constructor của `Chooser` trong **Item 28** có khai báo như sau:

```java
public Chooser(Collection<T> choices)
```

Constructor này dùng collection `choices` chỉ để **sản xuất** các giá trị kiểu `T` (và lưu chúng để dùng sau), nên khai báo của nó nên dùng một wildcard type `extends T`. Đây là khai báo constructor thu được:

```java
// Wildcard type for parameter that serves as a T producer
public Chooser(Collection<? extends T> choices)
```

Và thay đổi này có tạo ra khác biệt nào trong thực tế không? Có. Giả sử bạn có một `List<Integer>`, và bạn muốn truyền nó vào constructor của một `Chooser<Number>`. Điều này sẽ không biên dịch được với khai báo ban đầu, nhưng sẽ được một khi bạn thêm bounded wildcard type vào khai báo.

Bây giờ hãy xem method `union` từ **Item 30**. Đây là khai báo:

```java
public static <E> Set<E> union(Set<E> s1, Set<E> s2)
```

Cả hai tham số, `s1` và `s2`, đều là producer của `E`, nên câu ghi nhớ PECS cho chúng ta biết khai báo nên như sau:

```java
public static <E> Set<E> union(Set<? extends E> s1,
                               Set<? extends E> s2)
```

Lưu ý rằng kiểu trả về vẫn là `Set<E>`. **Đừng dùng bounded wildcard type làm kiểu trả về.** Thay vì đem lại thêm sự linh hoạt cho người dùng, nó sẽ buộc họ phải dùng wildcard type trong mã client. Với khai báo đã sửa, đoạn mã này sẽ biên dịch sạch sẽ:

```java
Set<Integer>  integers =  Set.of(1, 3, 5);
Set<Double>   doubles  =  Set.of(2.0, 4.0, 6.0);
Set<Number>   numbers  =  union(integers, doubles);
```

Được dùng đúng cách, wildcard type gần như vô hình đối với người dùng của một class. Chúng khiến các method chấp nhận những tham số nên chấp nhận và từ chối những tham số nên từ chối. **Nếu người dùng của một class phải nghĩ về wildcard type, có lẽ API của class đó có gì đó không ổn.**

Trước Java 8, các quy tắc suy luận kiểu chưa đủ thông minh để xử lý đoạn mã trên, vốn đòi hỏi compiler phải dùng kiểu trả về được chỉ định theo ngữ cảnh (hay *target type*) để suy luận kiểu của `E`. Target type của lời gọi `union` ở trên là `Set<Number>`. Nếu bạn thử biên dịch đoạn mã đó trong một phiên bản Java cũ hơn (với một thứ thay thế thích hợp cho factory `Set.of`), bạn sẽ nhận được một thông báo lỗi dài dòng, rối rắm như thế này:

```java
Union.java:14: error: incompatible types
        Set<Number> numbers = union(integers, doubles);
                                   ^
  required: Set<Number>
  found:    Set<INT#1>
  where INT#1,INT#2 are intersection types:
    INT#1 extends Number,Comparable<? extends INT#2>
    INT#2 extends Number,Comparable<?>
```

May mắn là có cách xử lý loại lỗi này. Nếu compiler không suy luận được kiểu đúng, bạn luôn có thể chỉ cho nó kiểu cần dùng bằng một *explicit type argument* (đối số kiểu tường minh) [JLS, 15.12]. Ngay cả trước khi target typing được giới thiệu trong Java 8, đây không phải là việc bạn phải làm thường xuyên, và đó là điều tốt vì explicit type argument không đẹp mắt cho lắm. Với việc thêm một explicit type argument như dưới đây, đoạn mã biên dịch sạch sẽ trong các phiên bản trước Java 8:

```java
// Explicit type parameter - required prior to Java 8
Set<Number> numbers = Union.<Number>union(integers, doubles);
```

Tiếp theo, hãy chuyển sự chú ý sang method `max` trong **Item 30**. Đây là khai báo ban đầu:

```java
public static <T extends Comparable<T>> T max(List<T> list)
```

Đây là khai báo đã sửa dùng wildcard type:

```java
public static <T extends Comparable<? super T>> T max(
        List<? extends T> list)
```

Để có được khai báo đã sửa từ khai báo ban đầu, chúng ta áp dụng phương pháp PECS hai lần. Lần áp dụng đơn giản là cho tham số `list`. Nó sản xuất các instance `T`, nên chúng ta đổi kiểu từ `List<T>` sang `List<? extends T>`. Lần áp dụng khó hơn là cho type parameter `T`. Đây là lần đầu tiên chúng ta thấy một wildcard được áp dụng cho một type parameter. Ban đầu, `T` được chỉ định là extends `Comparable<T>`, nhưng một comparable của `T` tiêu thụ các instance `T` (và sản xuất các số nguyên chỉ quan hệ thứ tự). Do đó, parameterized type `Comparable<T>` được thay bằng bounded wildcard type `Comparable<? super T>`. Comparable luôn là consumer, nên nhìn chung bạn nên **dùng** `Comparable<? super T>` **thay vì** `Comparable<T>` **.** Điều tương tự cũng đúng với comparator; do đó, nhìn chung bạn nên **dùng** `Comparator<? super T>` **thay vì** `Comparator<T>` **.**

Khai báo `max` đã sửa có lẽ là khai báo method phức tạp nhất trong cuốn sách này. Sự phức tạp thêm vào có thực sự đem lại điều gì không? Một lần nữa, có. Đây là một ví dụ đơn giản về một list sẽ bị khai báo ban đầu loại trừ nhưng được khai báo đã sửa cho phép:

```java
List<ScheduledFuture<?>> scheduledFutures = ... ;
```

Lý do bạn không thể áp dụng khai báo method ban đầu cho list này là vì `ScheduledFuture` không cài đặt `Comparable<ScheduledFuture>`. Thay vào đó, nó là một subinterface của `Delayed`, interface này extends `Comparable<Delayed>`. Nói cách khác, một instance `ScheduledFuture` không chỉ so sánh được với các instance `ScheduledFuture` khác; nó so sánh được với bất kỳ instance `Delayed` nào, và như thế là đủ để khiến khai báo ban đầu từ chối nó. Tổng quát hơn, wildcard là cần thiết để hỗ trợ các kiểu không cài đặt `Comparable` (hoặc `Comparator`) một cách trực tiếp mà extends một kiểu có cài đặt.

Còn một chủ đề liên quan đến wildcard nữa đáng bàn. Có một sự đối ngẫu giữa type parameter và wildcard, và nhiều method có thể được khai báo bằng cách này hoặc cách kia. Ví dụ, đây là hai khai báo khả dĩ cho một static method hoán đổi hai phần tử được đánh chỉ số trong một list. Khai báo thứ nhất dùng một unbounded type parameter (**Item 30**) và khai báo thứ hai dùng một unbounded wildcard:

```java
// Two possible declarations for the swap method
public static <E> void swap(List<E> list, int i, int j);
public static void swap(List<?> list, int i, int j);
```

Khai báo nào trong hai khai báo này tốt hơn, và tại sao? Trong một public API, khai báo thứ hai tốt hơn vì nó đơn giản hơn. Bạn truyền vào một list—bất kỳ list nào—và method hoán đổi các phần tử được đánh chỉ số. Không có type parameter nào phải bận tâm. Theo quy tắc chung, **nếu một type parameter chỉ xuất hiện đúng một lần trong khai báo method, hãy thay nó bằng wildcard.** Nếu đó là một unbounded type parameter, hãy thay bằng unbounded wildcard; nếu đó là một bounded type parameter, hãy thay bằng bounded wildcard.

Có một vấn đề với khai báo thứ hai của `swap`. Cài đặt trực tiếp sẽ không biên dịch được:

```java
public static void swap(List<?> list, int i, int j) {
    list.set(i, list.set(j, list.get(i)));
}
```

Cố biên dịch nó sẽ sinh ra thông báo lỗi không mấy hữu ích này:

```java
Swap.java:5: error: incompatible types: Object cannot be
converted to CAP#1
        list.set(i, list.set(j, list.get(i)));
                                        ^
  where CAP#1 is a fresh type-variable:
    CAP#1 extends Object from capture of ?
```

Có vẻ không đúng khi chúng ta không thể đặt lại một phần tử vào chính list mà chúng ta vừa lấy nó ra. Vấn đề là kiểu của `list` là `List<?>`, và bạn không thể đặt bất kỳ giá trị nào ngoài `null` vào một `List<?>`. May mắn là có cách cài đặt method này mà không cần dùng đến phép ép kiểu không an toàn hay raw type. Ý tưởng là viết một private helper method để *capture* (bắt lấy) wildcard type. Helper method này phải là một generic method để có thể capture kiểu. Nó trông như sau:

```java
public static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);
}

// Private helper method for wildcard capture
private static <E> void swapHelper(List<E> list, int i, int j) {
    list.set(i, list.set(j, list.get(i)));
}
```

Method `swapHelper` biết rằng `list` là một `List<E>`. Do đó, nó biết rằng bất kỳ giá trị nào nó lấy ra từ list này đều có kiểu `E` và việc đặt bất kỳ giá trị kiểu `E` nào vào list là an toàn. Cài đặt hơi vòng vèo này của `swap` biên dịch sạch sẽ. Nó cho phép chúng ta xuất ra khai báo đẹp dựa trên wildcard, trong khi tận dụng generic method phức tạp hơn ở bên trong. Client của method `swap` không phải đối mặt với khai báo `swapHelper` phức tạp hơn, nhưng họ vẫn được hưởng lợi từ nó. Đáng lưu ý là helper method có chính xác chữ ký mà chúng ta đã gạt bỏ vì quá phức tạp cho public method.

Tóm lại, dùng wildcard type trong các API của bạn, dù khó, làm cho các API linh hoạt hơn nhiều. Nếu bạn viết một thư viện sẽ được dùng rộng rãi, việc dùng đúng wildcard type nên được xem là bắt buộc. Hãy nhớ quy tắc cơ bản: producer-`extends`, consumer-`super` (PECS). Cũng hãy nhớ rằng mọi comparable và comparator đều là consumer.

## Item 32: Kết hợp generics và varargs một cách thận trọng

Các method varargs (**Item 53**) và generics đều được thêm vào nền tảng trong Java 5, nên bạn có thể kỳ vọng chúng tương tác với nhau một cách êm đẹp; đáng buồn là không. Mục đích của varargs là cho phép client truyền một số lượng đối số thay đổi vào một method, nhưng nó là một *leaky abstraction* (trừu tượng hóa bị rò rỉ): khi bạn gọi một method varargs, một mảng được tạo ra để chứa các tham số varargs; mảng đó, vốn đáng lẽ là một chi tiết cài đặt, lại bị lộ ra ngoài. Hệ quả là bạn nhận được những cảnh báo khó hiểu của compiler khi các tham số varargs có kiểu generic hoặc parameterized.

Hãy nhớ lại từ **Item 28** rằng một kiểu non-reifiable là kiểu mà biểu diễn lúc runtime của nó có ít thông tin hơn biểu diễn lúc biên dịch, và rằng gần như mọi generic type và parameterized type đều là non-reifiable. Nếu một method khai báo tham số varargs của nó thuộc kiểu non-reifiable, compiler sinh ra một cảnh báo trên phần khai báo. Nếu method được gọi với các tham số varargs mà kiểu được suy luận là non-reifiable, compiler cũng sinh ra một cảnh báo trên lời gọi. Các cảnh báo trông đại loại như sau:

```java
warning: [unchecked] Possible heap pollution from
    parameterized vararg type List<String>
```

*Heap pollution* (ô nhiễm heap) xảy ra khi một biến thuộc parameterized type tham chiếu đến một object không thuộc kiểu đó [JLS, 4.12.2]. Nó có thể khiến các phép ép kiểu do compiler tự động sinh ra thất bại, vi phạm sự đảm bảo căn bản của hệ thống kiểu generic.

Ví dụ, hãy xét method này, một biến thể ngụy trang sơ sài của đoạn mã ở trang 127:

```java
// Mixing generics and varargs can violate type safety!
static void dangerous(List<String>... stringLists) {
    List<Integer> intList = List.of(42);
    Object[] objects = stringLists;
    objects[0] = intList;             // Heap pollution
    String s = stringLists[0].get(0); // ClassCastException
}
```

Method này không có phép ép kiểu nào nhìn thấy được nhưng vẫn ném `ClassCastException` khi được gọi với một hoặc nhiều đối số. Dòng cuối của nó có một phép ép kiểu vô hình do compiler sinh ra. Phép ép kiểu này thất bại, cho thấy an toàn kiểu đã bị tổn hại, và **việc lưu một giá trị vào một mảng tham số varargs generic là không an toàn.**

Ví dụ này đặt ra một câu hỏi thú vị: Tại sao việc khai báo một method với tham số varargs generic lại hợp lệ, trong khi việc tạo tường minh một mảng generic là không hợp lệ? Nói cách khác, tại sao method ở trên chỉ sinh ra cảnh báo, trong khi đoạn mã ở trang 127 sinh ra lỗi? Câu trả lời là các method có tham số varargs thuộc kiểu generic hoặc parameterized có thể rất hữu ích trong thực tế, nên những người thiết kế ngôn ngữ đã chọn chấp nhận sự thiếu nhất quán này. Trên thực tế, các thư viện Java xuất ra một số method như vậy, bao gồm `Arrays.asList(T... a)`, `Collections.addAll(Collection<? super T> c, T... elements)`, và `EnumSet.of(E first, E... rest)`. Khác với method `dangerous` ở trên, các method thư viện này là an toàn về kiểu.

Trước Java 7, tác giả của một method có tham số varargs generic không thể làm gì với các cảnh báo tại nơi gọi. Điều này khiến các API như vậy khó chịu khi dùng. Người dùng phải chịu đựng các cảnh báo hoặc, tốt hơn, loại bỏ chúng bằng annotation `@SuppressWarnings("unchecked")` tại mọi nơi gọi (**Item 27**). Việc này tẻ nhạt, làm giảm tính dễ đọc, và che giấu những cảnh báo đánh dấu các vấn đề thực sự.

Trong Java 7, annotation `SafeVarargs` được thêm vào nền tảng, cho phép tác giả của một method có tham số varargs generic tự động chặn các cảnh báo phía client. Về bản chất, **annotation** `SafeVarargs` **là lời hứa của tác giả method rằng method đó an toàn về kiểu.** Đổi lại lời hứa này, compiler đồng ý không cảnh báo người dùng của method rằng các lời gọi có thể không an toàn.

Điều tối quan trọng là bạn không được đánh dấu một method bằng `@SafeVarargs` trừ khi nó thực sự *là* an toàn. Vậy cần gì để đảm bảo điều này? Hãy nhớ rằng một mảng generic được tạo ra khi method được gọi, để chứa các tham số varargs. Nếu method không lưu gì vào mảng (điều này sẽ ghi đè các tham số) và không để lộ tham chiếu đến mảng ra ngoài (điều này sẽ cho phép mã không đáng tin cậy truy cập mảng), thì nó an toàn. Nói cách khác, nếu mảng tham số varargs chỉ được dùng để truyền một số lượng đối số thay đổi từ bên gọi đến method—mà suy cho cùng, đó chính là mục đích của varargs—thì method là an toàn.

Đáng lưu ý là bạn có thể vi phạm an toàn kiểu mà không bao giờ lưu gì vào mảng tham số varargs. Hãy xét generic varargs method sau, method này trả về một mảng chứa các tham số của nó. Thoạt nhìn, nó có vẻ như một tiện ích nhỏ tiện dụng:

```java
// UNSAFE - Exposes a reference to its generic parameter array!
static <T> T[] toArray(T... args) {
    return args;
}
```

Method này đơn giản trả về mảng tham số varargs của nó. Method có vẻ không nguy hiểm, nhưng thực ra là có! Kiểu của mảng này được xác định bởi kiểu lúc biên dịch của các đối số được truyền vào method, và compiler có thể không có đủ thông tin để xác định chính xác. Vì method này trả về mảng tham số varargs của nó, nó có thể lan truyền heap pollution lên phía trên trong ngăn xếp lời gọi (call stack).

Để cụ thể hóa, hãy xét generic method sau, nhận vào ba đối số kiểu `T` và trả về một mảng chứa hai trong số các đối số đó, được chọn ngẫu nhiên:

```java
static <T> T[] pickTwo(T a, T b, T c) {
    switch(ThreadLocalRandom.current().nextInt(3)) {
      case 0: return toArray(a, b);
      case 1: return toArray(a, c);
      case 2: return toArray(b, c);
    }
    throw new AssertionError(); // Can't get here
}
```

Bản thân method này không nguy hiểm và sẽ không sinh ra cảnh báo, ngoại trừ việc nó gọi method `toArray`, vốn có tham số varargs generic.

Khi biên dịch method này, compiler sinh ra mã để tạo một mảng tham số varargs nhằm truyền hai instance `T` cho `toArray`. Mã này cấp phát một mảng kiểu `Object[]`, là kiểu cụ thể nhất được đảm bảo chứa được các instance này, bất kể kiểu object nào được truyền cho `pickTwo` tại nơi gọi. Method `toArray` đơn giản trả mảng này về cho `pickTwo`, và `pickTwo` lại trả nó về cho bên gọi của mình, nên `pickTwo` sẽ luôn trả về một mảng kiểu `Object[]`.

Bây giờ hãy xét method main này, dùng để thử `pickTwo`:

```java
public static void main(String[] args) {
    String[] attributes = pickTwo("Good", "Fast", "Cheap");
}
```

Method này chẳng có gì sai cả, nên nó biên dịch mà không sinh ra cảnh báo nào. Nhưng khi chạy, nó ném `ClassCastException`, dù không chứa phép ép kiểu nào nhìn thấy được. Điều bạn không thấy là compiler đã sinh ra một phép ép kiểu ẩn sang `String[]` trên giá trị do `pickTwo` trả về để có thể lưu nó vào `attributes`. Phép ép kiểu này thất bại, vì `Object[]` không phải là kiểu con của `String[]`. Thất bại này khá đáng lo ngại vì nó cách method thực sự gây ra heap pollution (`toArray`) đến hai cấp, và mảng tham số varargs không hề bị sửa đổi sau khi các tham số thực được lưu vào đó.

Ví dụ này nhằm nhấn mạnh điểm rằng **việc cho một method khác truy cập vào mảng tham số varargs generic là không an toàn,** với hai ngoại lệ: truyền mảng cho một method varargs khác được đánh dấu đúng bằng `@SafeVarargs` là an toàn, và truyền mảng cho một method không phải varargs chỉ đơn thuần tính toán một hàm nào đó trên nội dung của mảng cũng là an toàn.

Đây là một ví dụ điển hình về cách dùng an toàn một tham số varargs generic. Method này nhận vào một số lượng tùy ý các list làm đối số và trả về một list duy nhất chứa các phần tử của tất cả các list đầu vào theo thứ tự. Vì method được đánh dấu bằng `@SafeVarargs`, nó không sinh ra cảnh báo nào, cả trên phần khai báo lẫn tại các nơi gọi:

```java
// Safe method with a generic varargs parameter
@SafeVarargs
static <T> List<T> flatten(List<? extends T>... lists) {
    List<T> result = new ArrayList<>();
    for (List<? extends T> list : lists)
        result.addAll(list);
    return result;
}
```

Quy tắc để quyết định khi nào dùng annotation `SafeVarargs` rất đơn giản: **Hãy dùng** `@SafeVarargs` **trên mọi method có tham số varargs thuộc kiểu generic hoặc parameterized,** để người dùng của nó không phải gánh chịu những cảnh báo compiler vô ích và khó hiểu. Điều này ngụ ý rằng bạn *không bao giờ* nên viết các method varargs không an toàn như `dangerous` hay `toArray`. Mỗi khi compiler cảnh báo bạn về khả năng heap pollution từ một tham số varargs generic trong một method bạn kiểm soát, hãy kiểm tra rằng method đó an toàn. Để nhắc lại, một generic varargs method là an toàn nếu:

1. nó không lưu gì vào mảng tham số varargs, và

2. nó không để lộ mảng (hay một bản sao) cho mã không đáng tin cậy. Nếu một trong hai điều cấm này bị vi phạm, hãy sửa nó.

Lưu ý rằng annotation `SafeVarargs` chỉ hợp lệ trên các method không thể bị override, vì không thể đảm bảo rằng mọi method override khả dĩ đều an toàn. Trong Java 8, annotation này chỉ hợp lệ trên static method và final instance method; trong Java 9, nó trở nên hợp lệ cả trên private instance method.

Một giải pháp thay thế cho việc dùng annotation `SafeVarargs` là làm theo lời khuyên của **Item 28** và thay tham số varargs (vốn là một mảng trá hình) bằng một tham số `List`. Đây là cách tiếp cận này khi áp dụng cho method `flatten` của chúng ta. Lưu ý rằng chỉ có phần khai báo tham số thay đổi:

```java
// List as a typesafe alternative to a generic varargs parameter
static <T> List<T> flatten(List<List<? extends T>> lists) {
    List<T> result = new ArrayList<>();
    for (List<? extends T> list : lists)
        result.addAll(list);
    return result;
}
```

Method này sau đó có thể được dùng kết hợp với static factory method `List.of` để cho phép một số lượng đối số thay đổi. Lưu ý rằng cách tiếp cận này dựa trên thực tế là khai báo của `List.of` được đánh dấu bằng `@SafeVarargs`:

```java
audience = flatten(List.of(friends, romans, countrymen));
```

Ưu điểm của cách tiếp cận này là compiler có thể *chứng minh* rằng method là an toàn về kiểu. Bạn không phải tự đứng ra bảo đảm tính an toàn của nó bằng annotation `SafeVarargs`, và bạn không phải lo rằng mình có thể đã sai khi xác định rằng nó an toàn. Nhược điểm chính là mã client dài dòng hơn một chút và có thể chậm hơn một chút.

Thủ thuật này cũng có thể được dùng trong những tình huống không thể viết được một method varargs an toàn, như trường hợp của method `toArray` ở trang 147. Phiên bản `List` tương ứng của nó *chính là* method `List.of`, nên chúng ta thậm chí không cần viết; các tác giả thư viện Java đã làm việc đó cho chúng ta. Method `pickTwo` khi đó trở thành:

```java
static <T> List<T> pickTwo(T a, T b, T c) {
    switch(ThreadLocalRandom.current().nextInt(3)) {
      case 0: return List.of(a, b);
      case 1: return List.of(a, c);
      case 2: return List.of(b, c);
    }
    throw new AssertionError();
}
```

và method main trở thành:

```java
public static void main(String[] args) {
    List<String> attributes = pickTwo("Good", "Fast", "Cheap");
}
```

Mã thu được an toàn về kiểu vì nó chỉ dùng generics, không dùng mảng.

Tóm lại, varargs và generics không tương tác tốt với nhau vì cơ chế varargs là một leaky abstraction được xây dựng trên mảng, và mảng có các quy tắc về kiểu khác với generics. Dù các tham số varargs generic không an toàn về kiểu, chúng vẫn hợp lệ. Nếu bạn chọn viết một method có tham số varargs generic (hoặc parameterized), trước hết hãy đảm bảo rằng method đó an toàn về kiểu, rồi đánh dấu nó bằng `@SafeVarargs` để nó không gây khó chịu khi dùng.

## Item 33: Cân nhắc dùng typesafe heterogeneous container

Các cách dùng phổ biến của generics bao gồm các collection, như `Set<E>` và `Map<K,V>`, và các container một phần tử, như `ThreadLocal<T>` và `AtomicReference<T>`. Trong tất cả các cách dùng này, chính container là thứ được tham số hóa. Điều này giới hạn bạn ở một số lượng type parameter cố định cho mỗi container. Thông thường đó chính xác là điều bạn muốn. Một `Set` có một type parameter duy nhất, đại diện cho kiểu phần tử của nó; một `Map` có hai, đại diện cho kiểu khóa và kiểu giá trị của nó; và cứ thế.

Tuy nhiên, đôi khi bạn cần linh hoạt hơn. Ví dụ, một hàng trong cơ sở dữ liệu có thể có số lượng cột tùy ý, và sẽ rất hay nếu có thể truy cập tất cả chúng theo cách an toàn về kiểu. May mắn là có một cách dễ dàng để đạt được hiệu quả này. Ý tưởng là tham số hóa *khóa* (key) thay vì *container*. Sau đó đưa khóa đã được tham số hóa cho container để chèn hoặc lấy một giá trị. Hệ thống kiểu generic được dùng để đảm bảo rằng kiểu của giá trị khớp với khóa của nó.

Như một ví dụ đơn giản cho cách tiếp cận này, hãy xét một class `Favorites` cho phép client của nó lưu trữ và lấy ra một instance yêu thích của số lượng kiểu tùy ý. Object `Class` của kiểu đó sẽ đóng vai trò là khóa được tham số hóa. Lý do cách này hoạt động là vì class `Class` là generic. Kiểu của một class literal không đơn thuần là `Class`, mà là `Class<T>`. Ví dụ, `String.class` có kiểu `Class<String>`, và `Integer.class` có kiểu `Class<Integer>`. Khi một class literal được truyền qua lại giữa các method để truyền tải cả thông tin kiểu lúc biên dịch lẫn lúc runtime, nó được gọi là một *type token* [**Bracha04**].

API của class `Favorites` rất đơn giản. Nó trông giống hệt một map đơn giản, ngoại trừ việc khóa được tham số hóa thay vì map. Client đưa ra một object `Class` khi đặt và lấy các favorite. Đây là API:

```java
// Typesafe heterogeneous container pattern - API
public class Favorites {
    public <T> void putFavorite(Class<T> type, T instance);
    public <T> T getFavorite(Class<T> type);
}
```

Đây là một chương trình mẫu dùng thử class `Favorites`, lưu trữ, lấy ra và in một instance `String`, `Integer` và `Class` yêu thích:

```java
// Typesafe heterogeneous container pattern - client
public static void main(String[] args) {
    Favorites f = new Favorites();
    f.putFavorite(String.class, "Java");
    f.putFavorite(Integer.class, 0xcafebabe);
    f.putFavorite(Class.class, Favorites.class);

    String favoriteString = f.getFavorite(String.class);
    int favoriteInteger = f.getFavorite(Integer.class);
    Class<?> favoriteClass = f.getFavorite(Class.class);
    System.out.printf("%s %x %s%n", favoriteString,
        favoriteInteger, favoriteClass.getName());
}
```

Như bạn mong đợi, chương trình này in ra `Java cafebabe Favorites`. Nhân tiện, lưu ý rằng method `printf` của Java khác với của C ở chỗ bạn nên dùng `%n` ở nơi bạn sẽ dùng `\n` trong C. `%n` sinh ra ký tự xuống dòng phù hợp với từng nền tảng, là `\n` trên nhiều nền tảng nhưng không phải tất cả.

Một instance `Favorites` là *typesafe* (an toàn về kiểu): nó sẽ không bao giờ trả về một `Integer` khi bạn yêu cầu một `String`. Nó cũng là *heterogeneous* (hỗn tạp): khác với một map thông thường, tất cả các khóa đều thuộc kiểu khác nhau. Do đó, chúng ta gọi `Favorites` là một *typesafe heterogeneous container* (container hỗn tạp an toàn về kiểu).

Cài đặt của `Favorites` nhỏ đến bất ngờ. Đây là toàn bộ nó:

```java
// Typesafe heterogeneous container pattern - implementation
public class Favorites {
    private Map<Class<?>, Object> favorites = new HashMap<>();

    public <T> void putFavorite(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }
}
```

Có một vài điều tinh tế đang diễn ra ở đây. Mỗi instance `Favorites` được hậu thuẫn bởi một `Map<Class<?>, Object>` private tên là `favorites`. Bạn có thể nghĩ rằng mình không thể bỏ gì vào `Map` này vì unbounded wildcard type, nhưng sự thật hoàn toàn ngược lại. Điều cần chú ý là wildcard type được lồng bên trong: không phải kiểu của map là wildcard type mà là kiểu của khóa. Điều này có nghĩa là mỗi khóa có thể có một parameterized type *khác nhau*: một khóa có thể là `Class<String>`, khóa tiếp theo là `Class<Integer>`, và cứ thế. Tính hỗn tạp đến từ đó.

Điều tiếp theo cần chú ý là kiểu giá trị của `Map` `favorites` đơn giản là `Object`. Nói cách khác, `Map` không đảm bảo mối quan hệ kiểu giữa khóa và giá trị, tức là mọi giá trị đều thuộc kiểu mà khóa của nó đại diện. Trên thực tế, hệ thống kiểu của Java không đủ mạnh để biểu đạt điều này. Nhưng chúng ta biết điều đó là đúng, và chúng ta tận dụng nó khi đến lúc lấy một favorite ra.

Cài đặt của `putFavorite` rất tầm thường: nó đơn giản đặt vào `favorites` một ánh xạ từ object `Class` đã cho đến instance favorite đã cho. Như đã lưu ý, việc này loại bỏ “liên kết kiểu” giữa khóa và giá trị; nó đánh mất tri thức rằng giá trị là một instance của khóa. Nhưng không sao, vì method `getFavorites` có thể và thực sự thiết lập lại liên kết này.

Cài đặt của `getFavorite` phức tạp hơn của `putFavorite`. Trước tiên, nó lấy từ map `favorites` giá trị tương ứng với object `Class` đã cho. Đây là tham chiếu object đúng cần trả về, nhưng nó có kiểu lúc biên dịch sai: nó là `Object` (kiểu giá trị của map `favorites`) trong khi chúng ta cần trả về một `T`. Vì vậy, cài đặt của `getFavorite` *ép kiểu động* (dynamically cast) tham chiếu object sang kiểu mà object `Class` đại diện, bằng method `cast` của `Class`.

Method `cast` là phiên bản động của toán tử ép kiểu trong Java. Nó đơn giản kiểm tra rằng đối số của nó là một instance của kiểu mà object `Class` đại diện. Nếu đúng, nó trả về đối số; nếu không, nó ném `ClassCastException`. Chúng ta biết rằng lời gọi `cast` trong `getFavorite` sẽ không ném `ClassCastException`, với giả định mã client biên dịch sạch sẽ. Tức là, chúng ta biết rằng các giá trị trong map `favorites` luôn khớp với kiểu của khóa của chúng.

Vậy method `cast` làm gì cho chúng ta, khi nó đơn giản trả về đối số của mình? Chữ ký của method `cast` tận dụng triệt để thực tế là class `Class` là generic. Kiểu trả về của nó chính là type parameter của object `Class`:

```java
public class Class<T> {
    T cast(Object obj);
}
```

Đây chính xác là thứ mà method `getFavorite` cần. Nó là thứ cho phép chúng ta làm cho `Favorites` an toàn về kiểu mà không phải dùng đến phép ép kiểu unchecked sang `T`.

Có hai hạn chế của class `Favorites` đáng lưu ý. Thứ nhất, một client ác ý có thể dễ dàng phá vỡ an toàn kiểu của một instance `Favorites`, bằng cách dùng một object `Class` ở dạng raw. Nhưng mã client thu được sẽ sinh ra cảnh báo unchecked khi được biên dịch. Điều này không khác gì các cài đặt collection thông thường như `HashSet` và `HashMap`. Bạn có thể dễ dàng bỏ một `String` vào một `HashSet<Integer>` bằng cách dùng raw type `HashSet` (**Item 26**). Dù vậy, bạn có thể có an toàn kiểu lúc runtime nếu sẵn sàng trả giá cho nó. Cách để đảm bảo `Favorites` không bao giờ vi phạm bất biến về kiểu của nó là để method `putFavorite` kiểm tra rằng `instance` thực sự là một instance của kiểu mà `type` đại diện, và chúng ta đã biết cách làm điều này. Chỉ cần dùng một phép ép kiểu động:

```java
// Achieving runtime type safety with a dynamic cast
public <T> void putFavorite(Class<T> type, T instance) {
    favorites.put(Objects.requireNonNull(type),
              type.cast(instance));
}
```

Có những collection wrapper trong `java.util.Collections` dùng cùng thủ thuật này. Chúng được gọi là `checkedSet`, `checkedList`, `checkedMap`, và tương tự. Các static factory của chúng nhận vào một object `Class` (hoặc hai) bên cạnh một collection (hoặc map). Các static factory này là generic method, đảm bảo rằng kiểu lúc biên dịch của object `Class` và của collection khớp nhau. Các wrapper này thêm khả năng reification vào các collection mà chúng bao bọc. Ví dụ, wrapper ném `ClassCastException` lúc runtime nếu ai đó cố bỏ một `Coin` vào `Collection<Stamp>` của bạn. Những wrapper này hữu ích để truy tìm mã client thêm một phần tử sai kiểu vào một collection, trong một ứng dụng trộn lẫn generic type và raw type.

Hạn chế thứ hai của class `Favorites` là nó không thể được dùng với kiểu non-reifiable (**Item 28**). Nói cách khác, bạn có thể lưu `String` hay `String[]` yêu thích của mình, nhưng không thể lưu `List<String>` yêu thích. Nếu bạn cố lưu `List<String>` yêu thích, chương trình của bạn sẽ không biên dịch được. Lý do là bạn không thể lấy được object `Class` cho `List<String>`. Class literal `List<String>.class` là một lỗi cú pháp, và đó cũng là điều tốt. `List<String>` và `List<Integer>` dùng chung một object `Class` duy nhất, là `List.class`. Sẽ là thảm họa cho phần bên trong của một object `Favorites` nếu các “type literal” `List<String>.class` và `List<Integer>.class` hợp lệ và trả về cùng một tham chiếu object. Không có cách khắc phục hoàn toàn thỏa đáng cho hạn chế này.

Các type token mà `Favorites` dùng là không giới hạn (unbounded): `getFavorite` và `putFavorite` chấp nhận bất kỳ object `Class` nào. Đôi khi bạn có thể cần giới hạn các kiểu có thể được truyền cho một method. Điều này có thể đạt được bằng một *bounded type token*, đơn giản là một type token đặt giới hạn lên kiểu mà nó có thể đại diện, bằng cách dùng một bounded type parameter (**Item 29**) hoặc một bounded wildcard (**Item 31**).

API annotation (**Item 39**) sử dụng rộng rãi bounded type token. Ví dụ, đây là method để đọc một annotation lúc runtime. Method này đến từ interface `AnnotatedElement`, được cài đặt bởi các kiểu reflection đại diện cho class, method, field và các phần tử chương trình khác:

```java
public <T extends Annotation>
    T getAnnotation(Class<T> annotationType);
```

Đối số `annotationType` là một bounded type token đại diện cho một kiểu annotation. Method trả về annotation thuộc kiểu đó của phần tử, nếu có, hoặc `null` nếu không có. Về bản chất, một phần tử được đánh dấu annotation là một typesafe heterogeneous container mà các khóa là các kiểu annotation.

Giả sử bạn có một object kiểu `Class<?>` và bạn muốn truyền nó cho một method đòi hỏi bounded type token, chẳng hạn `getAnnotation`. Bạn có thể ép object đó sang `Class<? extends Annotation>`, nhưng phép ép kiểu này là unchecked, nên nó sẽ sinh ra cảnh báo lúc biên dịch (**Item 27**). May mắn là class `Class` cung cấp một instance method thực hiện loại ép kiểu này một cách an toàn (và động). Method này tên là `asSubclass`, và nó ép object `Class` mà nó được gọi trên đó để đại diện cho một class con của class mà đối số của nó đại diện. Nếu phép ép kiểu thành công, method trả về đối số của nó; nếu thất bại, nó ném `ClassCastException`.

Đây là cách bạn dùng method `asSubclass` để đọc một annotation mà kiểu của nó chưa được biết lúc biên dịch. Method này biên dịch không lỗi, không cảnh báo:

```java
// Use of asSubclass to safely cast to a bounded type token
static Annotation getAnnotation(AnnotatedElement element,
                                String annotationTypeName) {
    Class<?> annotationType = null; // Unbounded type token
    try {
        annotationType = Class.forName(annotationTypeName);
    } catch (Exception ex) {
        throw new IllegalArgumentException(ex);
    }
    return element.getAnnotation(
        annotationType.asSubclass(Annotation.class));
}
```

Tóm lại, cách dùng thông thường của generics, được minh họa bởi các API collection, giới hạn bạn ở một số lượng type parameter cố định cho mỗi container. Bạn có thể vượt qua giới hạn này bằng cách đặt type parameter lên khóa thay vì lên container. Bạn có thể dùng các object `Class` làm khóa cho những typesafe heterogeneous container như vậy. Một object `Class` được dùng theo cách này được gọi là type token. Bạn cũng có thể dùng một kiểu khóa tùy chỉnh. Ví dụ, bạn có thể có một kiểu `DatabaseRow` đại diện cho một hàng trong cơ sở dữ liệu (container), và một generic type `Column<T>` làm khóa của nó.
