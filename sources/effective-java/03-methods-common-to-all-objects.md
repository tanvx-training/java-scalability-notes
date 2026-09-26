# Chương 3. Các phương thức chung của mọi đối tượng

Mặc dù `Object` là một class cụ thể (concrete class), nó được thiết kế chủ yếu để mở rộng. Tất cả các phương thức không phải final của nó (`equals`, `hashCode`, `toString`, `clone` và `finalize`) đều có *general contract* (hợp đồng tổng quát) tường minh, vì chúng được thiết kế để được override. Bất kỳ class nào override các phương thức này đều có trách nhiệm tuân thủ general contract của chúng; nếu không, những class khác phụ thuộc vào các contract đó (chẳng hạn `HashMap` và `HashSet`) sẽ không thể hoạt động đúng khi kết hợp với class của bạn.

Chương này cho bạn biết khi nào và làm thế nào để override các phương thức không phải final của `Object`. Phương thức `finalize` không được bàn đến trong chương này vì nó đã được thảo luận ở **Item 8**. Dù không phải là một phương thức của `Object`, `Comparable.compareTo` cũng được bàn đến trong chương này vì nó có tính chất tương tự.

## Item 10: Tuân thủ general contract khi override `equals`

Override phương thức `equals` trông có vẻ đơn giản, nhưng có rất nhiều cách để làm sai, và hậu quả có thể rất nghiêm trọng. Cách dễ nhất để tránh rắc rối là không override phương thức `equals`, khi đó mỗi instance của class chỉ bằng chính nó. Đây là lựa chọn đúng đắn nếu bất kỳ điều kiện nào sau đây được thỏa mãn:

- **Mỗi instance của class vốn dĩ là duy nhất.** Điều này đúng với những class như `Thread`, vốn đại diện cho các thực thể đang hoạt động chứ không phải các giá trị. Cài đặt `equals` mà `Object` cung cấp có hành vi hoàn toàn phù hợp cho những class này.

- **Class không cần cung cấp phép kiểm tra “bằng nhau về mặt logic” (logical equality).** Ví dụ, `java.util.regex.Pattern` lẽ ra có thể override `equals` để kiểm tra xem hai instance `Pattern` có biểu diễn cùng một biểu thức chính quy hay không, nhưng các nhà thiết kế cho rằng client sẽ không cần hay muốn tính năng này. Trong hoàn cảnh đó, cài đặt `equals` kế thừa từ `Object` là lý tưởng.

- **Một superclass đã override** `equals`, **và hành vi của superclass là phù hợp với class này.** Ví dụ, hầu hết các cài đặt `Set` kế thừa cài đặt `equals` từ `AbstractSet`, các cài đặt `List` kế thừa từ `AbstractList`, và các cài đặt `Map` kế thừa từ `AbstractMap`.

- **Class là private hoặc package-private, và bạn chắc chắn rằng phương thức** `equals` **của nó sẽ không bao giờ được gọi.** Nếu bạn cực kỳ thận trọng, bạn có thể override phương thức `equals` để bảo đảm nó không bị gọi một cách vô tình:

```java
@Override public boolean equals(Object o) {
    throw new AssertionError(); // Method is never called
}
```

Vậy khi nào thì nên override `equals`? Đó là khi một class có khái niệm *bằng nhau về mặt logic* (logical equality) khác với việc chỉ đơn thuần là cùng một đối tượng (object identity), và superclass chưa override `equals`. Đây thường là trường hợp của các *value class* (class giá trị). Value class đơn giản là một class biểu diễn một giá trị, chẳng hạn như `Integer` hay `String`. Một lập trình viên khi so sánh các tham chiếu đến value object bằng phương thức `equals` mong muốn biết chúng có tương đương về mặt logic hay không, chứ không phải chúng có trỏ đến cùng một đối tượng hay không. Override phương thức `equals` không chỉ cần thiết để đáp ứng kỳ vọng của lập trình viên, mà còn cho phép các instance được dùng làm khóa của map hoặc phần tử của set với hành vi có thể dự đoán và đúng như mong muốn.

Một loại value class *không* cần override phương thức `equals` là class sử dụng cơ chế kiểm soát instance (instance control) (**Item 1**) để bảo đảm tồn tại nhiều nhất một đối tượng cho mỗi giá trị. Các kiểu enum (**Item 34**) thuộc loại này. Với những class này, bằng nhau về mặt logic cũng chính là cùng một đối tượng, nên phương thức `equals` của `Object` đóng vai trò như một phương thức `equals` logic.

Khi override phương thức `equals`, bạn phải tuân thủ general contract của nó. Dưới đây là contract đó, trích từ đặc tả của `Object`:

Phương thức `equals` cài đặt một *quan hệ tương đương* (equivalence relation). Nó có các tính chất sau:

- *Phản xạ* (Reflexive): Với mọi giá trị tham chiếu khác null `x`, `x.equals(x)` phải trả về `true`.

- *Đối xứng* (Symmetric): Với mọi giá trị tham chiếu khác null `x` và `y`, `x.equals(y)` phải trả về `true` khi và chỉ khi `y.equals(x)` trả về `true`.

- *Bắc cầu* (Transitive): Với mọi giá trị tham chiếu khác null `x`, `y`, `z`, nếu `x.equals(y)` trả về `true` và `y.equals(z)` trả về `true`, thì `x.equals(z)` phải trả về `true`.

- *Nhất quán* (Consistent): Với mọi giá trị tham chiếu khác null `x` và `y`, nhiều lần gọi `x.equals(y)` phải luôn trả về `true` hoặc luôn trả về `false`, miễn là không có thông tin nào được dùng trong phép so sánh `equals` bị thay đổi.

- Với mọi giá trị tham chiếu khác null `x`, `x.equals(null)` phải trả về `false`.

Trừ khi bạn có thiên hướng toán học, contract này trông có vẻ hơi đáng sợ, nhưng đừng phớt lờ nó! Nếu bạn vi phạm nó, rất có thể bạn sẽ thấy chương trình của mình hoạt động thất thường hoặc bị crash, và việc truy ra nguồn gốc của lỗi có thể rất khó khăn. Mượn lời John Donne, không class nào là một hòn đảo. Các instance của class này thường xuyên được truyền cho class khác. Nhiều class, bao gồm toàn bộ các class collection, phụ thuộc vào việc những đối tượng được truyền cho chúng tuân thủ contract của `equals`.

Giờ bạn đã ý thức được mối nguy của việc vi phạm contract `equals`, hãy cùng xem xét contract này một cách chi tiết. Tin vui là, dù bề ngoài có vẻ vậy, nó thực sự không phức tạp lắm. Một khi đã hiểu, việc tuân thủ nó không hề khó.

Vậy quan hệ tương đương là gì? Nói một cách nôm na, đó là một toán tử phân hoạch một tập hợp các phần tử thành các tập con mà các phần tử trong mỗi tập con được coi là bằng nhau. Những tập con này được gọi là các *lớp tương đương* (equivalence class). Để một phương thức `equals` hữu ích, tất cả các phần tử trong mỗi lớp tương đương phải có thể thay thế cho nhau từ góc nhìn của người dùng. Bây giờ hãy lần lượt xem xét năm yêu cầu:

**Tính phản xạ**—Yêu cầu đầu tiên chỉ nói rằng một đối tượng phải bằng chính nó. Thật khó hình dung việc vô tình vi phạm điều này. Nếu bạn vi phạm nó rồi thêm một instance của class vào một collection, phương thức `contains` rất có thể sẽ nói rằng collection không chứa instance bạn vừa thêm vào.

**Tính đối xứng**—Yêu cầu thứ hai nói rằng hai đối tượng bất kỳ phải thống nhất với nhau về việc chúng có bằng nhau hay không. Không như yêu cầu đầu tiên, không khó để hình dung việc vô tình vi phạm điều này. Ví dụ, hãy xem xét class sau đây, cài đặt một chuỗi không phân biệt chữ hoa chữ thường. Kiểu chữ của chuỗi được giữ nguyên bởi `toString` nhưng bị bỏ qua trong các phép so sánh `equals`:

```java
// Broken - violates symmetry!
public final class CaseInsensitiveString {
    private final String s;

    public CaseInsensitiveString(String s) {
        this.s = Objects.requireNonNull(s);
    }

    // Broken - violates symmetry!
    @Override public boolean equals(Object o) {
        if (o instanceof CaseInsensitiveString)
            return s.equalsIgnoreCase(
                ((CaseInsensitiveString) o).s);
        if (o instanceof String)  // One-way interoperability!
            return s.equalsIgnoreCase((String) o);
        return false;
    }
    ...  // Remainder omitted
}
```

Phương thức `equals` đầy thiện ý trong class này cố gắng một cách ngây thơ để tương tác được với các chuỗi thông thường. Giả sử chúng ta có một chuỗi không phân biệt hoa thường và một chuỗi thông thường:

```java
CaseInsensitiveString cis = new CaseInsensitiveString("Polish");
String s = "polish";
```

Như mong đợi, `cis.equals(s)` trả về `true`. Vấn đề là trong khi phương thức `equals` của `CaseInsensitiveString` biết về các chuỗi thông thường, thì phương thức `equals` của `String` lại chẳng hay biết gì về các chuỗi không phân biệt hoa thường. Do đó, `s.equals(cis)` trả về `false`, một vi phạm rõ ràng về tính đối xứng. Giả sử bạn đặt một chuỗi không phân biệt hoa thường vào một collection:

```java
List<CaseInsensitiveString> list = new ArrayList<>();
list.add(cis);
```

Lúc này `list.contains(s)` trả về gì? Ai mà biết được? Trong cài đặt OpenJDK hiện tại, nó tình cờ trả về `false`, nhưng đó chỉ là một chi tiết ngẫu nhiên của cài đặt. Trong một cài đặt khác, nó hoàn toàn có thể trả về `true` hoặc ném ra một runtime exception. **Một khi bạn đã vi phạm contract của** `equals`**, bạn đơn giản là không thể biết các đối tượng khác sẽ hành xử ra sao khi đối mặt với đối tượng của bạn.**

Để loại bỏ vấn đề này, chỉ cần gỡ bỏ nỗ lực thiếu cân nhắc trong việc tương tác với `String` khỏi phương thức `equals`. Sau khi làm vậy, bạn có thể refactor phương thức thành một câu lệnh return duy nhất:

```java
@Override public boolean equals(Object o) {
    return o instanceof CaseInsensitiveString &&
        ((CaseInsensitiveString) o).s.equalsIgnoreCase(s);
}
```

**Tính bắc cầu**—Yêu cầu thứ ba của contract `equals` nói rằng nếu một đối tượng bằng đối tượng thứ hai và đối tượng thứ hai bằng đối tượng thứ ba, thì đối tượng thứ nhất phải bằng đối tượng thứ ba. Một lần nữa, không khó để hình dung việc vô tình vi phạm yêu cầu này. Hãy xem xét trường hợp một subclass thêm một *thành phần giá trị* (value component) mới vào superclass của nó. Nói cách khác, subclass thêm một mẩu thông tin có ảnh hưởng đến các phép so sánh `equals`. Hãy bắt đầu với một class điểm hai chiều với tọa độ nguyên, đơn giản và immutable:

```java
public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override public boolean equals(Object o) {
        if (!(o instanceof Point))
            return false;
        Point p = (Point)o;
        return p.x == x && p.y == y;
    }

    ...  // Remainder omitted
}
```

Giả sử bạn muốn mở rộng class này, thêm khái niệm màu sắc vào một điểm:

```java
public class ColorPoint extends Point {
    private final Color color;

    public ColorPoint(int x, int y, Color color) {
        super(x, y);
        this.color = color;
    }

    ...  // Remainder omitted
}
```

Phương thức `equals` nên trông như thế nào? Nếu bạn bỏ hẳn nó đi, cài đặt sẽ được kế thừa từ `Point` và thông tin màu sắc bị bỏ qua trong các phép so sánh `equals`. Dù điều này không vi phạm contract `equals`, nó rõ ràng là không thể chấp nhận được. Giả sử bạn viết một phương thức `equals` chỉ trả về `true` nếu đối số của nó là một điểm màu khác có cùng vị trí và màu sắc:

```java
// Broken - violates symmetry!
@Override public boolean equals(Object o) {
    if (!(o instanceof ColorPoint))
       return false;
    return super.equals(o) && ((ColorPoint) o).color == color;
}
```

Vấn đề với phương thức này là bạn có thể nhận được kết quả khác nhau khi so sánh một điểm với một điểm màu và ngược lại. Phép so sánh thứ nhất bỏ qua màu sắc, trong khi phép so sánh thứ hai luôn trả về `false` vì kiểu của đối số không đúng. Để cụ thể hóa, hãy tạo một điểm và một điểm màu:

```java
Point p = new Point(1, 2);
ColorPoint cp = new ColorPoint(1, 2, Color.RED);
```

Khi đó `p.equals(cp)` trả về `true`, trong khi `cp.equals(p)` trả về `false`. Bạn có thể thử sửa vấn đề này bằng cách để `ColorPoint.equals` bỏ qua màu sắc khi thực hiện các “phép so sánh hỗn hợp”:

```java
// Broken - violates transitivity!
@Override public boolean equals(Object o) {
    if (!(o instanceof Point))
        return false;

    // If o is a normal Point, do a color-blind comparison
    if (!(o instanceof ColorPoint))
        return o.equals(this);

    // o is a ColorPoint; do a full comparison
    return super.equals(o) && ((ColorPoint) o).color == color;
}
```

Cách tiếp cận này đúng là bảo đảm tính đối xứng, nhưng phải trả giá bằng tính bắc cầu:

```java
ColorPoint p1 = new ColorPoint(1, 2, Color.RED);
Point p2 = new Point(1, 2);
ColorPoint p3 = new ColorPoint(1, 2, Color.BLUE);
```

Lúc này `p1.equals(p2)` và `p2.equals(p3)` trả về `true`, trong khi `p1.equals(p3)` trả về `false`, một vi phạm rõ ràng về tính bắc cầu. Hai phép so sánh đầu là “mù màu”, trong khi phép so sánh thứ ba có xét đến màu sắc.

Ngoài ra, cách tiếp cận này có thể gây đệ quy vô hạn: Giả sử có hai subclass của `Point`, chẳng hạn `ColorPoint` và `SmellPoint`, mỗi class đều có kiểu phương thức `equals` như thế này. Khi đó lời gọi `myColorPoint.equals(mySmellPoint)` sẽ ném ra `StackOverflowError`.

Vậy giải pháp là gì? Hóa ra đây là một vấn đề căn bản của quan hệ tương đương trong các ngôn ngữ hướng đối tượng. **Không có cách nào để mở rộng một class có thể khởi tạo (instantiable class) và thêm một thành phần giá trị mà vẫn bảo toàn được contract của** `equals`, trừ khi bạn sẵn sàng từ bỏ những lợi ích của trừu tượng hóa hướng đối tượng.

Bạn có thể nghe nói rằng bạn có thể mở rộng một class có thể khởi tạo và thêm một thành phần giá trị mà vẫn bảo toàn contract `equals` bằng cách dùng phép kiểm tra `getClass` thay cho phép kiểm tra `instanceof` trong phương thức `equals`:

```java
// Broken - violates Liskov substitution principle (page 43)
@Override public boolean equals(Object o) {
    if (o == null || o.getClass() != getClass())
        return false;
    Point p = (Point) o;
    return p.x == x && p.y == y;
}
```

Cách này có tác dụng là chỉ coi các đối tượng bằng nhau khi chúng có cùng class cài đặt. Nghe có vẻ không tệ lắm, nhưng hệ quả thì không thể chấp nhận được: Một instance của subclass của `Point` vẫn là một `Point`, và nó vẫn cần hoạt động như một `Point`, nhưng nó sẽ không làm được như vậy nếu bạn theo cách tiếp cận này! Giả sử chúng ta muốn viết một phương thức để cho biết một điểm có nằm trên đường tròn đơn vị hay không. Đây là một cách để làm điều đó:

```java
// Initialize unitCircle to contain all Points on the unit circle
private static final Set<Point> unitCircle = Set.of(
        new Point( 1,  0), new Point( 0,  1),
        new Point(-1,  0), new Point( 0, -1));

public static boolean onUnitCircle(Point p) {
    return unitCircle.contains(p);
}
```

Dù đây có thể không phải là cách nhanh nhất để cài đặt chức năng này, nó hoạt động tốt. Giả sử bạn mở rộng `Point` theo một cách tầm thường nào đó không thêm thành phần giá trị, chẳng hạn bằng cách để constructor của nó đếm số instance đã được tạo:

```java
public class CounterPoint extends Point {
    private static final AtomicInteger counter =
           new AtomicInteger();

    public CounterPoint(int x, int y) {
        super(x, y);
        counter.incrementAndGet();
    }
    public static int numberCreated() { return counter.get(); }
}
```

*Nguyên lý thay thế Liskov* (Liskov substitution principle) nói rằng mọi tính chất quan trọng của một kiểu cũng phải đúng với tất cả các kiểu con của nó, để mọi phương thức viết cho kiểu đó cũng hoạt động tốt như vậy trên các kiểu con [**Liskov87**]. Đây là phát biểu chính thức cho khẳng định trước đó của chúng ta rằng một subclass của `Point` (chẳng hạn `CounterPoint`) vẫn là một `Point` và phải hành xử như một `Point`. Nhưng giả sử chúng ta truyền một `CounterPoint` vào phương thức `onUnitCircle`. Nếu class `Point` dùng phương thức `equals` dựa trên `getClass`, phương thức `onUnitCircle` sẽ trả về `false` bất kể tọa độ *x* và *y* của instance `CounterPoint` là gì. Sở dĩ như vậy là vì hầu hết các collection, bao gồm cả set được dùng trong phương thức `onUnitCircle`, sử dụng phương thức `equals` để kiểm tra sự tồn tại của phần tử, và không có instance `CounterPoint` nào bằng bất kỳ `Point` nào. Tuy nhiên, nếu bạn dùng một phương thức `equals` đúng đắn dựa trên `instanceof` cho `Point`, thì cùng phương thức `onUnitCircle` đó sẽ hoạt động tốt khi nhận một instance `CounterPoint`.

Dù không có cách thỏa đáng nào để mở rộng một class có thể khởi tạo và thêm một thành phần giá trị, vẫn có một cách giải quyết ổn thỏa: Hãy làm theo lời khuyên của **Item 18**, “**Ưu tiên composition hơn inheritance**.” Thay vì để `ColorPoint` kế thừa `Point`, hãy cho `ColorPoint` một trường `Point` private và một phương thức *view* (khung nhìn) public (**Item 6**) trả về điểm có cùng vị trí với điểm màu này:

```java
// Adds a value component without violating the equals contract
public class ColorPoint {
   private final Point point;
   private final Color color;

   public ColorPoint(int x, int y, Color color) {
      point = new Point(x, y);
      this.color = Objects.requireNonNull(color);
   }

   /**
    * Returns the point-view of this color point.
    */
   public Point asPoint() {
      return point;
   }

   @Override public boolean equals(Object o) {
      if (!(o instanceof ColorPoint))
         return false;
      ColorPoint cp = (ColorPoint) o;
      return cp.point.equals(point) && cp.color.equals(color);
   }

   ...    // Remainder omitted
}
```

Có một số class trong thư viện nền tảng Java thực sự mở rộng một class có thể khởi tạo và thêm một thành phần giá trị. Ví dụ, `java.sql.Timestamp` kế thừa `java.util.Date` và thêm một trường `nanoseconds`. Cài đặt `equals` của `Timestamp` thực sự vi phạm tính đối xứng và có thể gây ra hành vi thất thường nếu các đối tượng `Timestamp` và `Date` được dùng trong cùng một collection hoặc bị trộn lẫn theo cách khác. Class `Timestamp` có một lời cảnh báo khuyên lập trình viên không nên trộn lẫn date và timestamp. Dù bạn sẽ không gặp rắc rối chừng nào còn giữ chúng tách biệt, chẳng có gì ngăn bạn trộn lẫn chúng, và những lỗi phát sinh có thể rất khó debug. Hành vi này của class `Timestamp` là một sai lầm và không nên bắt chước.

Lưu ý rằng bạn *có thể* thêm một thành phần giá trị vào subclass của một class *abstract* mà không vi phạm contract `equals`. Điều này quan trọng đối với kiểu phân cấp class mà bạn có được khi làm theo lời khuyên trong **Item 23**, “Ưu tiên phân cấp class hơn tagged class.” Ví dụ, bạn có thể có một abstract class `Shape` không có thành phần giá trị nào, một subclass `Circle` thêm trường `radius`, và một subclass `Rectangle` thêm các trường `length` và `width`. Những vấn đề như đã trình bày ở trên sẽ không xảy ra chừng nào không thể tạo trực tiếp một instance của superclass.

**Tính nhất quán**—Yêu cầu thứ tư của contract `equals` nói rằng nếu hai đối tượng bằng nhau, chúng phải luôn bằng nhau mãi mãi trừ khi một (hoặc cả hai) bị thay đổi. Nói cách khác, các đối tượng mutable có thể bằng những đối tượng khác nhau ở những thời điểm khác nhau, còn các đối tượng immutable thì không. Khi viết một class, hãy suy nghĩ kỹ xem nó có nên là immutable hay không (**Item 17**). Nếu bạn kết luận là nên, hãy bảo đảm phương thức `equals` của bạn tuân thủ ràng buộc rằng các đối tượng bằng nhau thì mãi bằng nhau và các đối tượng khác nhau thì mãi khác nhau.

Dù class có immutable hay không, **đừng viết một phương thức** `equals` **phụ thuộc vào các tài nguyên không đáng tin cậy.** Rất khó để thỏa mãn yêu cầu về tính nhất quán nếu bạn vi phạm điều cấm này. Ví dụ, phương thức `equals` của `java.net.URL` dựa vào việc so sánh địa chỉ IP của các host gắn với các URL. Việc chuyển một tên host thành địa chỉ IP có thể đòi hỏi truy cập mạng, và không có gì bảo đảm nó cho cùng kết quả theo thời gian. Điều này có thể khiến phương thức `equals` của `URL` vi phạm contract `equals` và trên thực tế đã gây ra nhiều vấn đề. Hành vi của phương thức `equals` trong `URL` là một sai lầm lớn và không nên bắt chước. Đáng tiếc là nó không thể được thay đổi do các yêu cầu về tương thích. Để tránh loại vấn đề này, các phương thức `equals` chỉ nên thực hiện các phép tính tất định (deterministic) trên những đối tượng nằm trong bộ nhớ.

**Tính khác null (Non-nullity)—**Yêu cầu cuối cùng không có tên chính thức, nên tôi mạn phép gọi nó là “non-nullity.” Nó nói rằng mọi đối tượng đều phải khác `null`. Dù khó hình dung việc vô tình trả về `true` khi gọi `o.equals(null)`, không khó để hình dung việc vô tình ném ra `NullPointerException`. General contract cấm điều này. Nhiều class có phương thức `equals` phòng ngừa điều đó bằng một phép kiểm tra `null` tường minh:

```java
// Explicit null check - unnecessary!
@Override public boolean equals(Object o) {
    if (o == null)
        return false;
    ...
}
```

Phép kiểm tra này là không cần thiết. Để kiểm tra đối số có bằng nhau hay không, phương thức `equals` trước hết phải ép kiểu (cast) đối số sang kiểu phù hợp để có thể gọi các accessor hoặc truy cập các trường của nó. Trước khi ép kiểu, phương thức phải dùng toán tử `instanceof` để kiểm tra đối số có đúng kiểu hay không:

```java
// Implicit null check - preferred
@Override public boolean equals(Object o) {
    if (!(o instanceof MyType))
        return false;
    MyType mt = (MyType) o;
    ...
}
```

Nếu thiếu phép kiểm tra kiểu này và phương thức `equals` được truyền một đối số sai kiểu, phương thức `equals` sẽ ném ra `ClassCastException`, vi phạm contract `equals`. Nhưng toán tử `instanceof` được đặc tả là trả về `false` nếu toán hạng thứ nhất là `null`, bất kể kiểu nào xuất hiện ở toán hạng thứ hai [JLS, 15.20.2]. Do đó, phép kiểm tra kiểu sẽ trả về `false` nếu `null` được truyền vào, nên bạn không cần một phép kiểm tra `null` tường minh.

Tổng hợp lại, đây là công thức cho một phương thức `equals` chất lượng cao:

1. **Dùng toán tử** `==` **để kiểm tra xem đối số có phải là tham chiếu đến chính đối tượng này không.** Nếu đúng, trả về `true`. Đây chỉ là một tối ưu hóa hiệu năng nhưng đáng làm nếu phép so sánh có khả năng tốn kém.

2. **Dùng toán tử** `instanceof` **để kiểm tra xem đối số có đúng kiểu không.** Nếu không, trả về `false`. Thông thường, kiểu đúng là class chứa phương thức này. Đôi khi, đó là một interface nào đó mà class này cài đặt. Hãy dùng interface nếu class cài đặt một interface có làm rõ thêm contract `equals` để cho phép so sánh giữa các class cùng cài đặt interface đó. Các interface collection như `Set`, `List`, `Map` và `Map.Entry` có tính chất này.

3. **Ép kiểu đối số sang kiểu đúng.** Vì phép ép kiểu này đã được đặt sau một phép kiểm tra `instanceof`, nó chắc chắn thành công.

4. **Với mỗi trường “quan trọng” (significant) trong class, kiểm tra xem trường đó của đối số có khớp với trường tương ứng của đối tượng này không.** Nếu tất cả các phép kiểm tra này thành công, trả về `true`; nếu không, trả về `false`. Nếu kiểu ở Bước 2 là một interface, bạn phải truy cập các trường của đối số thông qua các phương thức của interface; nếu kiểu là một class, bạn có thể truy cập trực tiếp các trường, tùy vào mức truy cập của chúng.

Với các trường kiểu nguyên thủy không phải `float` hay `double`, hãy dùng toán tử `==` để so sánh; với các trường tham chiếu đối tượng, gọi đệ quy phương thức `equals`; với các trường `float`, dùng phương thức static `Float.compare(float, float)`; và với các trường `double`, dùng `Double.compare(double, double)`. Việc xử lý đặc biệt các trường `float` và `double` là cần thiết do sự tồn tại của `Float.NaN`, `-0.0f` và các giá trị `double` tương tự; xem JLS 15.21.1 hoặc tài liệu của `Float.equals` để biết chi tiết. Dù bạn có thể so sánh các trường `float` và `double` bằng các phương thức static `Float.equals` và `Double.equals`, việc này kéo theo autoboxing ở mỗi lần so sánh, dẫn đến hiệu năng kém. Với các trường mảng, hãy áp dụng các hướng dẫn này cho từng phần tử. Nếu mọi phần tử trong một trường mảng đều quan trọng, hãy dùng một trong các phương thức `Arrays.equals`.

Một số trường tham chiếu đối tượng có thể chứa `null` một cách hợp lệ. Để tránh khả năng xảy ra `NullPointerException`, hãy kiểm tra sự bằng nhau của những trường như vậy bằng phương thức static `Objects.equals(Object, Object)`.

Với một số class, chẳng hạn `CaseInsensitiveString` ở trên, việc so sánh trường phức tạp hơn các phép kiểm tra bằng nhau đơn giản. Trong trường hợp đó, bạn có thể muốn lưu trữ một *dạng chuẩn* (canonical form) của trường để phương thức `equals` có thể thực hiện một phép so sánh chính xác, rẻ tiền trên các dạng chuẩn thay vì một phép so sánh phi tiêu chuẩn tốn kém hơn. Kỹ thuật này phù hợp nhất với các class immutable (**Item 17**); nếu đối tượng có thể thay đổi, bạn phải giữ cho dạng chuẩn luôn được cập nhật.

Hiệu năng của phương thức `equals` có thể bị ảnh hưởng bởi thứ tự so sánh các trường. Để có hiệu năng tốt nhất, bạn nên so sánh trước những trường có nhiều khả năng khác nhau hơn, rẻ hơn để so sánh, hoặc lý tưởng nhất là cả hai. Bạn không được so sánh những trường không thuộc trạng thái logic của đối tượng, chẳng hạn các trường khóa (lock) dùng để đồng bộ hóa các thao tác. Bạn không cần so sánh các *trường dẫn xuất* (derived field), vốn có thể tính được từ các “trường quan trọng,” nhưng làm vậy có thể cải thiện hiệu năng của phương thức `equals`. Nếu một trường dẫn xuất tương đương với một mô tả tóm tắt của toàn bộ đối tượng, việc so sánh trường này sẽ giúp bạn tiết kiệm chi phí so sánh dữ liệu thực nếu phép so sánh thất bại. Ví dụ, giả sử bạn có một class `Polygon`, và bạn lưu đệm (cache) diện tích. Nếu hai đa giác có diện tích khác nhau, bạn không cần bận tâm so sánh các cạnh và đỉnh của chúng.

**Khi viết xong phương thức** `equals`**, hãy tự hỏi ba câu: Nó có đối xứng không? Nó có bắc cầu không? Nó có nhất quán không?** Và đừng chỉ tự hỏi; hãy viết unit test để kiểm tra, trừ khi bạn dùng AutoValue (trang 49) để sinh ra phương thức `equals`, khi đó bạn có thể an tâm bỏ qua các test này. Nếu các tính chất không được thỏa mãn, hãy tìm hiểu lý do và sửa phương thức `equals` cho phù hợp. Tất nhiên phương thức `equals` của bạn cũng phải thỏa mãn hai tính chất còn lại (phản xạ và khác null), nhưng hai tính chất này thường tự nhiên được đáp ứng.

Một phương thức `equals` được xây dựng theo công thức trên được minh họa trong class `PhoneNumber` đơn giản này:

```java
// Class with a typical equals method
public final class PhoneNumber {
    private final short areaCode, prefix, lineNum;

    public PhoneNumber(int areaCode, int prefix, int lineNum) {
        this.areaCode = rangeCheck(areaCode,  999, "area code");
        this.prefix   = rangeCheck(prefix,    999, "prefix");
        this.lineNum  = rangeCheck(lineNum,  9999, "line num");
    }

    private static short rangeCheck(int val, int max, String arg) {
        if (val < 0 || val > max)
           throw new IllegalArgumentException(arg + ": " + val);
        return (short) val;
    }

    @Override public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof PhoneNumber))
            return false;
        PhoneNumber pn = (PhoneNumber)o;
        return pn.lineNum == lineNum && pn.prefix == prefix
                && pn.areaCode == areaCode;
    }
    ... // Remainder omitted
}
```

Sau đây là một vài lưu ý cuối cùng:

- **Luôn override** `hashCode` **khi bạn override** `equals` (**Item 11**).

- **Đừng cố tỏ ra quá thông minh.** Nếu bạn chỉ đơn giản kiểm tra sự bằng nhau của các trường, không khó để tuân thủ contract `equals`. Nếu bạn quá hăng hái trong việc tìm kiếm sự tương đương, rất dễ gặp rắc rối. Nói chung, xét đến bất kỳ hình thức aliasing (bí danh) nào đều là ý tưởng tồi. Ví dụ, class `File` không nên cố coi các symbolic link trỏ đến cùng một file là bằng nhau. May mắn thay, nó không làm vậy.

- **Đừng thay** `Object` **bằng một kiểu khác trong khai báo** `equals`**.** Không hiếm khi một lập trình viên viết một phương thức `equals` trông như thế này rồi mất hàng giờ bối rối không hiểu tại sao nó không hoạt động đúng:

```java
// Broken - parameter type must be Object!
public boolean equals(MyClass o) {
    ...
}
```

Vấn đề là phương thức này không *override* `Object.equals`, vốn có đối số kiểu `Object`, mà lại *overload* nó (**Item 52**). Việc cung cấp một phương thức `equals` “kiểu mạnh” như vậy, dù là bổ sung thêm bên cạnh phương thức bình thường, cũng không thể chấp nhận được, vì nó có thể khiến các annotation `Override` trong subclass sinh ra kết quả dương tính giả và tạo cảm giác an toàn giả tạo.

Việc sử dụng annotation `Override` một cách nhất quán, như được minh họa xuyên suốt item này, sẽ ngăn bạn mắc phải sai lầm đó (**Item 40**). Phương thức `equals` này sẽ không biên dịch được, và thông báo lỗi sẽ cho bạn biết chính xác điều gì sai:

```java
// Still broken, but won’t compile
@Override public boolean equals(MyClass o) {
    ...
}
```

Viết và kiểm thử các phương thức `equals` (và `hashCode`) là công việc tẻ nhạt, và mã kết quả thì nhàm chán. Một lựa chọn thay thế tuyệt vời cho việc viết và kiểm thử thủ công các phương thức này là dùng framework mã nguồn mở AutoValue của Google, framework này tự động sinh ra các phương thức đó cho bạn, chỉ cần một annotation duy nhất trên class. Trong hầu hết các trường hợp, những phương thức do AutoValue sinh ra về cơ bản giống hệt những gì bạn tự viết.

Các IDE cũng có công cụ sinh phương thức `equals` và `hashCode`, nhưng mã nguồn kết quả dài dòng và khó đọc hơn mã dùng AutoValue, không tự động theo dõi các thay đổi trong class, và do đó cần được kiểm thử. Dù vậy, để IDE sinh ra các phương thức `equals` (và `hashCode`) nhìn chung vẫn tốt hơn cài đặt thủ công, vì IDE không mắc những lỗi bất cẩn, còn con người thì có.

Tóm lại, đừng override phương thức `equals` trừ khi bạn buộc phải làm vậy: trong nhiều trường hợp, cài đặt kế thừa từ `Object` làm đúng những gì bạn muốn. Nếu bạn override `equals`, hãy bảo đảm so sánh tất cả các trường quan trọng của class và so sánh chúng theo cách bảo toàn cả năm điều khoản của contract `equals`.

## Item 11: Luôn override `hashCode` khi override `equals`

**Bạn phải override** `hashCode` **trong mọi class có override** `equals`**.** Nếu không làm vậy, class của bạn sẽ vi phạm general contract của `hashCode`, khiến nó không thể hoạt động đúng trong các collection như `HashMap` và `HashSet`. Dưới đây là contract đó, phỏng theo đặc tả của `Object`:

- Khi phương thức `hashCode` được gọi lặp lại trên một đối tượng trong suốt một lần thực thi của ứng dụng, nó phải nhất quán trả về cùng một giá trị, miễn là không có thông tin nào được dùng trong các phép so sánh `equals` bị thay đổi. Giá trị này không cần phải nhất quán giữa các lần thực thi khác nhau của ứng dụng.

- Nếu hai đối tượng bằng nhau theo phương thức `equals(Object)`, thì việc gọi `hashCode` trên hai đối tượng đó phải cho cùng một kết quả số nguyên.

- Nếu hai đối tượng khác nhau theo phương thức `equals(Object)`, thì *không* bắt buộc việc gọi `hashCode` trên mỗi đối tượng phải cho các kết quả khác nhau. Tuy nhiên, lập trình viên nên biết rằng việc tạo ra các kết quả khác nhau cho các đối tượng khác nhau có thể cải thiện hiệu năng của bảng băm (hash table).

**Điều khoản then chốt bị vi phạm khi bạn không override** `hashCode` **là điều khoản thứ hai: các đối tượng bằng nhau phải có hash code bằng nhau.** Hai instance riêng biệt có thể bằng nhau về mặt logic theo phương thức `equals` của class, nhưng đối với phương thức `hashCode` của `Object`, chúng chỉ là hai đối tượng chẳng có gì chung. Do đó, phương thức `hashCode` của `Object` trả về hai số có vẻ ngẫu nhiên thay vì hai số bằng nhau như contract yêu cầu.

Ví dụ, giả sử bạn cố dùng các instance của class `PhoneNumber` trong **Item 10** làm khóa trong một `HashMap`:

```java
Map<PhoneNumber, String> m = new HashMap<>();
m.put(new PhoneNumber(707, 867, 5309), "Jenny");
```

Lúc này, bạn có thể mong đợi `m.get(new PhoneNumber(707`, `867`, `5309))` trả về `"Jenny"`, nhưng thay vào đó, nó trả về `null`. Hãy để ý rằng có hai instance `PhoneNumber` liên quan: một được dùng để chèn vào `HashMap`, và một instance thứ hai, bằng với nó, được dùng để (cố gắng) truy xuất. Việc class `PhoneNumber` không override `hashCode` khiến hai instance bằng nhau này có hash code khác nhau, vi phạm contract `hashCode`. Do đó, phương thức `get` nhiều khả năng sẽ tìm số điện thoại trong một hash bucket khác với bucket mà phương thức `put` đã lưu nó. Ngay cả khi hai instance tình cờ băm vào cùng một bucket, phương thức `get` gần như chắc chắn vẫn trả về `null`, vì `HashMap` có một tối ưu hóa lưu đệm hash code gắn với mỗi entry và không buồn kiểm tra sự bằng nhau của đối tượng nếu các hash code không khớp.

Sửa vấn đề này đơn giản chỉ là viết một phương thức `hashCode` đúng đắn cho `PhoneNumber`. Vậy một phương thức `hashCode` nên trông như thế nào? Viết một phương thức tồi thì cực kỳ dễ. Ví dụ, phương thức này luôn hợp lệ nhưng không bao giờ nên được dùng:

```java
// The worst possible legal hashCode implementation - never use!
@Override public int hashCode() { return 42; }
```

Nó hợp lệ vì bảo đảm các đối tượng bằng nhau có cùng hash code. Nó tệ hại vì bảo đảm *mọi* đối tượng đều có cùng hash code. Do đó, mọi đối tượng đều băm vào cùng một bucket, và các bảng băm thoái hóa thành danh sách liên kết. Những chương trình lẽ ra chạy trong thời gian tuyến tính lại chạy trong thời gian bậc hai. Với các bảng băm lớn, đây là sự khác biệt giữa hoạt động được và không hoạt động được.

Một hàm băm tốt có xu hướng tạo ra hash code khác nhau cho các instance khác nhau. Đây chính xác là ý nghĩa của phần thứ ba trong contract `hashCode`. Lý tưởng nhất, một hàm băm nên phân bố đều mọi tập hợp hợp lý các instance khác nhau trên toàn bộ các giá trị `int`. Đạt được lý tưởng này có thể khó. May mắn là đạt được một xấp xỉ tương đối tốt thì không quá khó. Đây là một công thức đơn giản:

1. Khai báo một biến `int` tên là `result`, và khởi tạo nó bằng hash code `c` của trường quan trọng đầu tiên trong đối tượng của bạn, được tính như ở bước 2.a. (Nhắc lại từ **Item 10** rằng trường quan trọng là trường có ảnh hưởng đến các phép so sánh equals.)

2. Với mỗi trường quan trọng `f` còn lại trong đối tượng của bạn, thực hiện như sau:

a. Tính một hash code `c` kiểu `int` cho trường đó:

i. Nếu trường có kiểu nguyên thủy, tính `Type.hashCode(f)`, trong đó `Type` là class boxed primitive tương ứng với kiểu của `f`.

ii. Nếu trường là một tham chiếu đối tượng và phương thức `equals` của class này so sánh trường đó bằng cách gọi đệ quy `equals`, hãy gọi đệ quy `hashCode` trên trường đó. Nếu cần một phép so sánh phức tạp hơn, hãy tính một “biểu diễn chuẩn” (canonical representation) cho trường này và gọi `hashCode` trên biểu diễn chuẩn đó. Nếu giá trị của trường là `null`, dùng `0` (hoặc một hằng số khác, nhưng `0` là truyền thống).

iii. Nếu trường là một mảng, hãy xử lý như thể mỗi phần tử quan trọng là một trường riêng biệt. Nghĩa là, tính hash code cho mỗi phần tử quan trọng bằng cách áp dụng đệ quy các quy tắc này, và kết hợp các giá trị theo bước 2.b. Nếu mảng không có phần tử quan trọng nào, dùng một hằng số, tốt nhất là khác `0`. Nếu mọi phần tử đều quan trọng, dùng `Arrays.hashCode`.

b. Kết hợp hash code `c` tính được ở bước 2.a vào `result` như sau:

result = 31 * result + c;

3. Trả về `result`.

Khi viết xong phương thức `hashCode`, hãy tự hỏi liệu các instance bằng nhau có hash code bằng nhau không. Hãy viết unit test để xác nhận trực giác của bạn (trừ khi bạn dùng AutoValue để sinh ra các phương thức `equals` và `hashCode`, khi đó bạn có thể an tâm bỏ qua các test này). Nếu các instance bằng nhau có hash code khác nhau, hãy tìm hiểu lý do và sửa vấn đề.

Bạn có thể loại các *trường dẫn xuất* (derived field) ra khỏi phép tính hash code. Nói cách khác, bạn có thể bỏ qua bất kỳ trường nào có giá trị tính được từ các trường đã được đưa vào phép tính. Bạn *phải* loại bỏ mọi trường không được dùng trong các phép so sánh `equals`, nếu không bạn có nguy cơ vi phạm điều khoản thứ hai của contract `hashCode`.

Phép nhân ở bước 2.b làm cho kết quả phụ thuộc vào thứ tự các trường, tạo ra một hàm băm tốt hơn nhiều nếu class có nhiều trường tương tự nhau. Ví dụ, nếu bỏ phép nhân khỏi hàm băm của `String`, mọi từ đảo chữ (anagram) sẽ có hash code giống hệt nhau. Giá trị 31 được chọn vì nó là một số nguyên tố lẻ. Nếu nó là số chẵn và phép nhân bị tràn, thông tin sẽ bị mất, vì nhân với 2 tương đương với phép dịch bit. Lợi ích của việc dùng số nguyên tố thì ít rõ ràng hơn, nhưng đó là truyền thống. Một tính chất hay của 31 là phép nhân có thể được thay bằng một phép dịch và một phép trừ để có hiệu năng tốt hơn trên một số kiến trúc: `31 * i == (i << 5) - i`. Các VM hiện đại tự động thực hiện loại tối ưu hóa này.

Hãy áp dụng công thức trên cho class `PhoneNumber`:

```java
// Typical hashCode method
@Override public int hashCode() {
    int result = Short.hashCode(areaCode);
    result = 31 * result + Short.hashCode(prefix);
    result = 31 * result + Short.hashCode(lineNum);
    return result;
}
```

Vì phương thức này trả về kết quả của một phép tính tất định đơn giản mà đầu vào duy nhất là ba trường quan trọng trong một instance `PhoneNumber`, rõ ràng là các instance `PhoneNumber` bằng nhau sẽ có hash code bằng nhau. Trên thực tế, phương thức này là một cài đặt `hashCode` hoàn toàn tốt cho `PhoneNumber`, ngang hàng với những cài đặt trong thư viện nền tảng Java. Nó đơn giản, tương đối nhanh, và làm khá tốt việc phân tán các số điện thoại khác nhau vào các hash bucket khác nhau.

Dù công thức trong item này tạo ra các hàm băm tương đối tốt, chúng không phải là hiện đại nhất. Chúng có chất lượng tương đương với các hàm băm trong các kiểu giá trị của thư viện nền tảng Java và đủ dùng cho hầu hết các mục đích. Nếu bạn thực sự có nhu cầu về các hàm băm ít gây xung đột (collision) hơn, hãy xem `com.google.common.hash.Hashing` của Guava [**Guava**].

Class `Objects` có một phương thức static nhận một số lượng tùy ý các đối tượng và trả về hash code cho chúng. Phương thức này, tên là `hash`, cho phép bạn viết các phương thức `hashCode` một dòng với chất lượng tương đương những phương thức viết theo công thức trong item này. Đáng tiếc là chúng chạy chậm hơn vì phải tạo mảng để truyền số lượng đối số thay đổi, cũng như boxing và unboxing nếu có đối số nào thuộc kiểu nguyên thủy. Kiểu hàm băm này chỉ được khuyến nghị dùng trong những tình huống mà hiệu năng không quan trọng. Đây là một hàm băm cho `PhoneNumber` viết theo kỹ thuật này:

```java
// One-line hashCode method - mediocre performance
@Override public int hashCode() {
   return Objects.hash(lineNum, prefix, areaCode);
}
```

Nếu một class là immutable và chi phí tính hash code là đáng kể, bạn có thể cân nhắc lưu đệm hash code trong đối tượng thay vì tính lại mỗi khi được yêu cầu. Nếu bạn tin rằng hầu hết các đối tượng của kiểu này sẽ được dùng làm khóa băm, thì bạn nên tính hash code khi instance được tạo. Nếu không, bạn có thể chọn *khởi tạo lười* (lazily initialize) hash code vào lần đầu tiên `hashCode` được gọi. Cần một chút cẩn trọng để bảo đảm class vẫn thread-safe khi có một trường được khởi tạo lười (**Item 83**). Class `PhoneNumber` của chúng ta không đáng để xử lý như vậy, nhưng chỉ để cho bạn thấy cách làm, đây là nó. Lưu ý rằng giá trị khởi đầu của trường `hashCode` (trong trường hợp này là 0) không nên là hash code của một instance thường được tạo ra:

```java
// hashCode method with lazily initialized cached hash code
private int hashCode; // Automatically initialized to 0

@Override public int hashCode() {
    int result = hashCode;
    if (result == 0) {
        result = Short.hashCode(areaCode);
        result = 31 * result + Short.hashCode(prefix);
        result = 31 * result + Short.hashCode(lineNum);
        hashCode = result;
    }
    return result;
}
```

**Đừng bị cám dỗ loại bỏ các trường quan trọng khỏi phép tính hash code để cải thiện hiệu năng.** Dù hàm băm kết quả có thể chạy nhanh hơn, chất lượng kém của nó có thể làm giảm hiệu năng của các bảng băm đến mức không thể sử dụng được. Đặc biệt, hàm băm có thể phải đối mặt với một tập hợp lớn các instance khác nhau chủ yếu ở những vùng bạn đã chọn bỏ qua. Nếu điều này xảy ra, hàm băm sẽ ánh xạ tất cả các instance này vào một vài hash code, và những chương trình lẽ ra chạy trong thời gian tuyến tính sẽ chạy trong thời gian bậc hai.

Đây không chỉ là vấn đề lý thuyết. Trước Java 2, hàm băm của `String` chỉ dùng tối đa mười sáu ký tự cách đều nhau trong chuỗi, bắt đầu từ ký tự đầu tiên. Với các tập hợp lớn các tên có phân cấp, chẳng hạn như URL, hàm này thể hiện chính xác hành vi bệnh lý đã mô tả ở trên.

**Đừng cung cấp đặc tả chi tiết cho giá trị mà** `hashCode` **trả về, để client không thể phụ thuộc vào nó một cách hợp lý; điều này cho bạn sự linh hoạt để thay đổi nó.** Nhiều class trong thư viện Java, chẳng hạn `String` và `Integer`, đặc tả chính xác giá trị mà phương thức `hashCode` của chúng trả về như một hàm của giá trị instance. Đây *không* phải là ý hay mà là một sai lầm mà chúng ta buộc phải chung sống: Nó cản trở khả năng cải thiện hàm băm trong các phiên bản tương lai. Nếu bạn để các chi tiết không được đặc tả và một khiếm khuyết được phát hiện trong hàm băm hoặc một hàm băm tốt hơn được tìm ra, bạn có thể thay đổi nó trong một phiên bản sau.

Tóm lại, bạn *phải* override `hashCode` mỗi khi override `equals`, nếu không chương trình của bạn sẽ không chạy đúng. Phương thức `hashCode` của bạn phải tuân thủ general contract được đặc tả trong `Object` và phải làm tốt một cách hợp lý việc gán hash code khác nhau cho các instance khác nhau. Điều này dễ đạt được, dù hơi tẻ nhạt, bằng cách dùng công thức ở trang 51. Như đã đề cập trong **Item 10**, framework AutoValue cung cấp một lựa chọn thay thế tốt cho việc viết thủ công các phương thức `equals` và `hashCode`, và các IDE cũng cung cấp một phần chức năng này.

## Item 12: Luôn override `toString`

Dù `Object` cung cấp một cài đặt cho phương thức `toString`, chuỗi mà nó trả về thường không phải là thứ người dùng class của bạn muốn thấy. Nó gồm tên class, theo sau là ký hiệu “a còng” (`@`) và biểu diễn thập lục phân không dấu của hash code, ví dụ `PhoneNumber@adbbd`. General contract của `toString` nói rằng chuỗi trả về phải là “một biểu diễn ngắn gọn nhưng giàu thông tin, dễ đọc đối với con người.” Dù có thể tranh luận rằng `PhoneNumber@adbbd` là ngắn gọn và dễ đọc, nó không giàu thông tin cho lắm khi so với `707-867-5309`. Contract của `toString` còn nói thêm, “Khuyến nghị mọi subclass đều override phương thức này.” Quả là một lời khuyên hay!

Dù không quan trọng bằng việc tuân thủ contract của `equals` và `hashCode` (**Item 10** và **11**), **việc cung cấp một cài đặt** `toString` **tốt làm cho class của bạn dễ chịu hơn nhiều khi sử dụng và giúp các hệ thống dùng class đó dễ debug hơn**. Phương thức `toString` được tự động gọi khi một đối tượng được truyền cho `println`, `printf`, toán tử nối chuỗi, hoặc `assert`, hoặc được in ra bởi debugger. Ngay cả khi bạn không bao giờ gọi `toString` trên một đối tượng, những người khác có thể sẽ gọi. Ví dụ, một thành phần có tham chiếu đến đối tượng của bạn có thể đưa biểu diễn chuỗi của đối tượng vào một thông báo lỗi được ghi log. Nếu bạn không override `toString`, thông báo đó có thể gần như vô dụng.

Nếu bạn đã cung cấp một phương thức `toString` tốt cho `PhoneNumber`, việc tạo ra một thông báo chẩn đoán hữu ích dễ dàng như thế này:

```java
System.out.println("Failed to connect to " + phoneNumber);
```

Lập trình viên sẽ tạo ra các thông báo chẩn đoán theo cách này dù bạn có override `toString` hay không, nhưng các thông báo sẽ không hữu ích trừ khi bạn làm vậy. Lợi ích của việc cung cấp một phương thức `toString` tốt không chỉ dừng ở các instance của class mà còn mở rộng đến các đối tượng chứa tham chiếu đến những instance này, đặc biệt là các collection. Khi in một map, bạn muốn thấy cái nào hơn, `{Jenny=PhoneNumber@adbbd}` hay `{Jenny=707-867-5309}`?

**Khi khả thi, phương thức** `toString` **nên trả về toàn bộ thông tin đáng quan tâm chứa trong đối tượng**, như trong ví dụ số điện thoại. Điều này không khả thi nếu đối tượng lớn hoặc chứa trạng thái không thuận tiện để biểu diễn dưới dạng chuỗi. Trong những hoàn cảnh đó, `toString` nên trả về một bản tóm tắt như `Manhattan residential phone directory (1487536 listings)` hoặc `Thread[main,5,main]`. Lý tưởng nhất, chuỗi nên tự giải thích được. (Ví dụ `Thread` không đạt tiêu chí này.) Một hình phạt đặc biệt khó chịu cho việc không đưa toàn bộ thông tin đáng quan tâm của đối tượng vào biểu diễn chuỗi là các báo cáo test thất bại trông như thế này:

```java
Assertion failure: expected {abc, 123}, but was {abc, 123}.
```

Một quyết định quan trọng bạn sẽ phải đưa ra khi cài đặt phương thức `toString` là có nên đặc tả định dạng của giá trị trả về trong tài liệu hay không. Khuyến nghị là bạn nên làm vậy với các *value class*, chẳng hạn số điện thoại hoặc ma trận. Lợi ích của việc đặc tả định dạng là nó đóng vai trò như một biểu diễn tiêu chuẩn, không mơ hồ, con người đọc được của đối tượng. Biểu diễn này có thể được dùng cho đầu vào và đầu ra và trong các đối tượng dữ liệu bền vững mà con người đọc được, chẳng hạn các file CSV. Nếu bạn đặc tả định dạng, thường là ý hay khi cung cấp kèm một static factory hoặc constructor tương ứng để lập trình viên có thể dễ dàng chuyển đổi qua lại giữa đối tượng và biểu diễn chuỗi của nó. Cách tiếp cận này được nhiều value class trong thư viện nền tảng Java áp dụng, bao gồm `BigInteger`, `BigDecimal` và hầu hết các class boxed primitive.

Bất lợi của việc đặc tả định dạng cho giá trị trả về của `toString` là một khi đã đặc tả, bạn sẽ bị ràng buộc với nó suốt đời, giả sử class của bạn được sử dụng rộng rãi. Lập trình viên sẽ viết mã để phân tích (parse) biểu diễn đó, để sinh ra nó, và để nhúng nó vào dữ liệu bền vững. Nếu bạn thay đổi biểu diễn trong một phiên bản tương lai, bạn sẽ phá vỡ mã và dữ liệu của họ, và họ sẽ la ó. Bằng cách chọn không đặc tả định dạng, bạn giữ được sự linh hoạt để thêm thông tin hoặc cải thiện định dạng trong một phiên bản sau.

**Dù bạn có quyết định đặc tả định dạng hay không, bạn nên ghi rõ ý định của mình trong tài liệu.** Nếu bạn đặc tả định dạng, hãy làm điều đó một cách chính xác. Ví dụ, đây là một phương thức `toString` đi kèm class `PhoneNumber` trong **Item 11**:

```java
/**
 * Returns the string representation of this phone number.
 * The string consists of twelve characters whose format is
 * "XXX-YYY-ZZZZ", where XXX is the area code, YYY is the
 * prefix, and ZZZZ is the line number. Each of the capital
 * letters represents a single decimal digit.
 *
 * If any of the three parts of this phone number is too small
 * to fill up its field, the field is padded with leading zeros.
 * For example, if the value of the line number is 123, the last
 * four characters of the string representation will be "0123".
 */
@Override public String toString() {
    return String.format("%03d-%03d-%04d",
            areaCode, prefix, lineNum);
}
```

Nếu bạn quyết định không đặc tả định dạng, chú thích tài liệu nên viết đại loại như thế này:

```java
/**
 * Returns a brief description of this potion. The exact details
 * of the representation are unspecified and subject to change,
 * but the following may be regarded as typical:
 *
 * "[Potion #9: type=love, smell=turpentine, look=india ink]"
 */
@Override public String toString() { ... }
```

Sau khi đọc chú thích này, những lập trình viên viết mã hoặc tạo dữ liệu bền vững phụ thuộc vào chi tiết của định dạng sẽ chẳng thể đổ lỗi cho ai ngoài chính họ khi định dạng bị thay đổi.

Dù bạn có đặc tả định dạng hay không, **hãy cung cấp cách truy cập bằng chương trình đến thông tin chứa trong giá trị mà** `toString` **trả về.** Ví dụ, class `PhoneNumber` nên chứa các accessor cho mã vùng, tiền tố và số thuê bao. Nếu bạn không làm vậy, bạn *buộc* những lập trình viên cần thông tin này phải phân tích chuỗi. Ngoài việc làm giảm hiệu năng và tạo thêm việc không cần thiết cho lập trình viên, quá trình này dễ gây lỗi và dẫn đến những hệ thống mong manh, sẽ hỏng nếu bạn thay đổi định dạng. Bằng cách không cung cấp accessor, bạn biến định dạng chuỗi thành một API trên thực tế (de facto), ngay cả khi bạn đã ghi rõ rằng nó có thể thay đổi.

Viết một phương thức `toString` trong một static utility class (**Item 4**) là vô nghĩa. Bạn cũng không nên viết phương thức `toString` trong hầu hết các kiểu enum (**Item 34**) vì Java đã cung cấp sẵn một phương thức hoàn toàn tốt cho bạn. Tuy nhiên, bạn nên viết phương thức `toString` trong bất kỳ abstract class nào mà các subclass của nó chia sẻ một biểu diễn chuỗi chung. Ví dụ, các phương thức `toString` trên hầu hết các cài đặt collection được kế thừa từ các abstract collection class.

Công cụ mã nguồn mở AutoValue của Google, đã bàn ở **Item 10**, sẽ sinh ra phương thức `toString` cho bạn, hầu hết các IDE cũng vậy. Những phương thức này rất tốt trong việc cho bạn biết nội dung của từng trường nhưng không được chuyên biệt hóa theo *ý nghĩa* của class. Vì thế, chẳng hạn, sẽ không phù hợp khi dùng một phương thức `toString` được sinh tự động cho class `PhoneNumber` của chúng ta (vì số điện thoại có một biểu diễn chuỗi tiêu chuẩn), nhưng sẽ hoàn toàn chấp nhận được với class `Potion` của chúng ta. Dù vậy, một phương thức `toString` được sinh tự động vẫn tốt hơn nhiều so với phương thức kế thừa từ `Object`, vốn chẳng cho bạn biết *gì* về giá trị của đối tượng.

Tóm lại, hãy override cài đặt `toString` của `Object` trong mọi class có thể khởi tạo mà bạn viết, trừ khi một superclass đã làm điều đó. Nó làm cho các class dễ chịu hơn nhiều khi sử dụng và hỗ trợ việc debug. Phương thức `toString` nên trả về một mô tả ngắn gọn, hữu ích về đối tượng, ở một định dạng đẹp mắt.

## Item 13: Override `clone` một cách thận trọng

Interface `Cloneable` được dự định là một *mixin interface* (**Item 20**) để các class thông báo rằng chúng cho phép sao chép (cloning). Đáng tiếc là nó không thực hiện được mục đích này. Khiếm khuyết chính của nó là thiếu một phương thức `clone`, và phương thức `clone` của `Object` lại là protected. Bạn không thể, nếu không dùng đến *reflection* (**Item 65**), gọi `clone` trên một đối tượng chỉ vì nó cài đặt `Cloneable`. Ngay cả lời gọi bằng reflection cũng có thể thất bại, vì không có gì bảo đảm đối tượng có một phương thức `clone` truy cập được. Bất chấp khiếm khuyết này và nhiều khiếm khuyết khác, cơ chế này được sử dụng khá rộng rãi, nên hiểu nó là điều đáng làm. Item này cho bạn biết cách cài đặt một phương thức `clone` hoạt động tốt, thảo luận khi nào thì thích hợp để làm vậy, và trình bày các lựa chọn thay thế.

Vậy `Cloneable` *thực sự* làm gì, khi nó không chứa phương thức nào? Nó quyết định hành vi của cài đặt `clone` protected trong `Object`: nếu một class cài đặt `Cloneable`, phương thức `clone` của `Object` trả về một bản sao từng trường một (field-by-field copy) của đối tượng; nếu không, nó ném ra `CloneNotSupportedException`. Đây là một cách dùng interface cực kỳ khác thường và không nên bắt chước. Thông thường, việc cài đặt một interface nói lên điều gì đó về những gì một class có thể làm cho client của nó. Trong trường hợp này, nó lại thay đổi hành vi của một phương thức protected trên superclass.

Dù đặc tả không nói ra, **trên thực tế, một class cài đặt** `Cloneable` **được kỳ vọng sẽ cung cấp một phương thức** `clone` **public hoạt động đúng đắn.** Để đạt được điều này, class và tất cả các superclass của nó phải tuân thủ một giao thức phức tạp, không thể cưỡng chế, được tài liệu hóa sơ sài. Cơ chế kết quả là mong manh, nguy hiểm, và *nằm ngoài ngôn ngữ* (extralinguistic): nó tạo ra đối tượng mà không gọi constructor.

General contract của phương thức `clone` khá yếu. Dưới đây là contract đó, sao chép từ đặc tả của `Object`:

Tạo và trả về một bản sao của đối tượng này. Ý nghĩa chính xác của “bản sao” có thể phụ thuộc vào class của đối tượng. Ý định chung là, với mọi đối tượng `x`, biểu thức

x.clone() != x

sẽ là `true`, và biểu thức x.clone().getClass() == x.getClass()

sẽ là `true`, nhưng đây không phải là những yêu cầu tuyệt đối. Dù thông thường

x.clone().equals(x)

sẽ là `true`, đây không phải là một yêu cầu tuyệt đối.

Theo quy ước, đối tượng mà phương thức này trả về nên được lấy bằng cách gọi `super.clone`. Nếu một class và tất cả các superclass của nó (ngoại trừ `Object`) tuân thủ quy ước này, thì sẽ có

x.clone().getClass() == x.getClass().

Theo quy ước, đối tượng trả về nên độc lập với đối tượng được sao chép. Để đạt được sự độc lập này, có thể cần thay đổi một hoặc nhiều trường của đối tượng mà `super.clone` trả về trước khi trả về nó.

Cơ chế này hơi giống với chuỗi constructor (constructor chaining), ngoại trừ việc nó không được cưỡng chế: nếu phương thức `clone` của một class trả về một instance *không* được lấy bằng cách gọi `super.clone` mà bằng cách gọi constructor, trình biên dịch sẽ không phàn nàn, nhưng nếu một subclass của class đó gọi `super.clone`, đối tượng kết quả sẽ có class sai, khiến phương thức `clone` của subclass không thể hoạt động đúng. Nếu một class override `clone` là final, quy ước này có thể được bỏ qua một cách an toàn, vì không có subclass nào phải lo lắng. Nhưng nếu một class final có phương thức `clone` không gọi `super.clone`, thì chẳng có lý do gì để class đó cài đặt `Cloneable`, vì nó không dựa vào hành vi của cài đặt clone trong `Object`.

Giả sử bạn muốn cài đặt `Cloneable` trong một class mà superclass của nó cung cấp một phương thức `clone` hoạt động tốt. Trước tiên hãy gọi `super.clone`. Đối tượng bạn nhận lại sẽ là một bản sao đầy đủ chức năng của bản gốc. Mọi trường được khai báo trong class của bạn sẽ có giá trị giống hệt bản gốc. Nếu mọi trường đều chứa giá trị nguyên thủy hoặc tham chiếu đến một đối tượng immutable, đối tượng trả về có thể chính là thứ bạn cần, khi đó không cần xử lý gì thêm. Đây là trường hợp, chẳng hạn, của class `PhoneNumber` trong **Item 11**, nhưng lưu ý rằng **các class immutable không bao giờ nên cung cấp phương thức** `clone` vì nó chỉ khuyến khích việc sao chép lãng phí. Với lưu ý đó, đây là hình dạng của một phương thức `clone` cho `PhoneNumber`:

```java
// Clone method for class with no references to mutable state
@Override public PhoneNumber clone() {
    try {
        return (PhoneNumber) super.clone();
    } catch (CloneNotSupportedException e) {
        throw new AssertionError();  // Can't happen
    }
}
```

Để phương thức này hoạt động, khai báo class của `PhoneNumber` sẽ phải được sửa để chỉ ra rằng nó cài đặt `Cloneable`. Dù phương thức `clone` của `Object` trả về `Object`, phương thức `clone` này trả về `PhoneNumber`. Làm vậy là hợp lệ và đáng mong muốn vì Java hỗ trợ *kiểu trả về hiệp biến* (covariant return type). Nói cách khác, kiểu trả về của một phương thức override có thể là subclass của kiểu trả về của phương thức bị override. Điều này loại bỏ nhu cầu ép kiểu ở phía client. Chúng ta phải ép kiểu kết quả của `super.clone` từ `Object` sang `PhoneNumber` trước khi trả về, nhưng phép ép kiểu này chắc chắn thành công.

Lời gọi `super.clone` được đặt trong một khối `try-catch`. Đó là vì `Object` khai báo phương thức `clone` của nó ném ra `CloneNotSupportedException`, một *checked exception*. Vì `PhoneNumber` cài đặt `Cloneable`, chúng ta biết lời gọi `super.clone` sẽ thành công. Sự cần thiết của đoạn mã rườm rà (boilerplate) này cho thấy `CloneNotSupportedException` lẽ ra nên là unchecked (**Item 71**).

Nếu một đối tượng chứa các trường tham chiếu đến các đối tượng mutable, cài đặt `clone` đơn giản như trên có thể gây thảm họa. Ví dụ, hãy xem xét class `Stack` trong **Item 7**:

```java
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        this.elements = new Object[DEFAULT_INITIAL_CAPACITY];
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

    // Ensure space for at least one more element.
    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

Giả sử bạn muốn làm cho class này có thể sao chép được. Nếu phương thức `clone` chỉ đơn thuần trả về `super.clone()`, instance `Stack` kết quả sẽ có giá trị đúng trong trường `size`, nhưng trường `elements` của nó sẽ tham chiếu đến cùng một mảng với instance `Stack` gốc. Thay đổi bản gốc sẽ phá hủy các bất biến (invariant) trong bản sao và ngược lại. Bạn sẽ nhanh chóng nhận thấy chương trình của mình cho ra các kết quả vô nghĩa hoặc ném ra `NullPointerException`.

Tình huống này không bao giờ có thể xảy ra khi gọi constructor duy nhất trong class `Stack`. **Thực chất, phương thức** `clone` **đóng vai trò như một constructor; bạn phải bảo đảm nó không gây hại cho đối tượng gốc và thiết lập đúng các bất biến trên bản sao**. Để phương thức `clone` của `Stack` hoạt động đúng, nó phải sao chép phần bên trong của stack. Cách dễ nhất để làm điều này là gọi `clone` đệ quy trên mảng `elements`:

```java
// Clone method for class with references to mutable state
@Override public Stack clone() {
    try {
        Stack result = (Stack) super.clone();
        result.elements = elements.clone();
        return result;
    } catch (CloneNotSupportedException e) {
        throw new AssertionError();
    }
}
```

Lưu ý rằng chúng ta không phải ép kiểu kết quả của `elements.clone` sang `Object[]`. Gọi `clone` trên một mảng trả về một mảng có kiểu lúc chạy và kiểu lúc biên dịch giống hệt mảng được sao chép. Đây là idiom được ưa chuộng để nhân bản một mảng. Thực tế, mảng là trường hợp sử dụng thuyết phục duy nhất của cơ chế `clone`.

Cũng lưu ý rằng giải pháp trên sẽ không hoạt động nếu trường `elements` là final, vì `clone` sẽ bị cấm gán giá trị mới cho trường đó. Đây là một vấn đề căn bản: giống như serialization, **kiến trúc** `Cloneable` **không tương thích với cách dùng thông thường của các trường final tham chiếu đến các đối tượng mutable**, ngoại trừ những trường hợp mà các đối tượng mutable có thể được chia sẻ an toàn giữa một đối tượng và bản sao của nó. Để làm cho một class có thể sao chép được, có thể cần gỡ bỏ modifier `final` khỏi một số trường.

Không phải lúc nào chỉ gọi `clone` đệ quy cũng là đủ. Ví dụ, giả sử bạn đang viết phương thức `clone` cho một bảng băm mà phần bên trong gồm một mảng các bucket, mỗi bucket tham chiếu đến entry đầu tiên của một danh sách liên kết các cặp khóa-giá trị. Vì hiệu năng, class này cài đặt danh sách liên kết đơn nhẹ của riêng nó thay vì dùng `java.util.LinkedList` bên trong:

```java
public class HashTable implements Cloneable {
    private Entry[] buckets = ...;

    private static class Entry {
        final Object key;
        Object value;
        Entry  next;

        Entry(Object key, Object value, Entry next) {
            this.key   = key;
            this.value = value;
            this.next  = next;
        }
    }
    ... // Remainder omitted
}
```

Giả sử bạn chỉ sao chép đệ quy mảng bucket, như đã làm với `Stack`:

```java
// Broken clone method - results in shared mutable state!
@Override public HashTable clone() {
    try {
        HashTable result = (HashTable) super.clone();
        result.buckets = buckets.clone();
        return result;
    } catch (CloneNotSupportedException e) {
        throw new AssertionError();
    }
}
```

Dù bản sao có mảng bucket của riêng nó, mảng này tham chiếu đến cùng các danh sách liên kết với bản gốc, điều này dễ dàng gây ra hành vi không tất định ở cả bản sao lẫn bản gốc. Để sửa vấn đề này, bạn sẽ phải sao chép danh sách liên kết tạo nên mỗi bucket. Đây là một cách tiếp cận phổ biến:

```java
// Recursive clone method for class with complex mutable state
public class HashTable implements Cloneable {
    private Entry[] buckets = ...;

    private static class Entry {
        final Object key;
        Object value;
        Entry  next;

        Entry(Object key, Object value, Entry next) {
            this.key   = key;
            this.value = value;
            this.next  = next;
        }

        // Recursively copy the linked list headed by this Entry
        Entry deepCopy() {
            return new Entry(key, value,
                next == null ? null : next.deepCopy());
        }
    }

    @Override public HashTable clone() {
        try {
            HashTable result = (HashTable) super.clone();
            result.buckets = new Entry[buckets.length];
            for (int i = 0; i < buckets.length; i++)
                if (buckets[i] != null)
                    result.buckets[i] = buckets[i].deepCopy();
            return result;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
    ... // Remainder omitted
}
```

Class private `HashTable.Entry` đã được bổ sung để hỗ trợ một phương thức “sao chép sâu” (deep copy). Phương thức `clone` của `HashTable` cấp phát một mảng `buckets` mới với kích thước phù hợp và duyệt qua mảng `buckets` gốc, sao chép sâu từng bucket không rỗng. Phương thức `deepCopy` của `Entry` tự gọi chính nó một cách đệ quy để sao chép toàn bộ danh sách liên kết bắt đầu từ entry đó. Dù kỹ thuật này khá hay và hoạt động tốt nếu các bucket không quá dài, nó không phải là cách tốt để sao chép một danh sách liên kết vì nó tiêu tốn một stack frame cho mỗi phần tử trong danh sách. Nếu danh sách dài, điều này dễ dàng gây tràn stack (stack overflow). Để ngăn điều này xảy ra, bạn có thể thay đệ quy trong `deepCopy` bằng vòng lặp:

```java
// Iteratively copy the linked list headed by this Entry
Entry deepCopy() {
   Entry result = new Entry(key, value, next);
   for (Entry p = result; p.next != null; p = p.next)
      p.next = new Entry(p.next.key, p.next.value, p.next.next);
   return result;
}
```

Một cách tiếp cận cuối cùng để sao chép các đối tượng mutable phức tạp là gọi `super.clone`, đặt tất cả các trường trong đối tượng kết quả về trạng thái ban đầu, rồi gọi các phương thức cấp cao hơn để tái tạo trạng thái của đối tượng gốc. Trong trường hợp ví dụ `HashTable` của chúng ta, trường `buckets` sẽ được khởi tạo bằng một mảng bucket mới, và phương thức `put(key, value)` (không được hiển thị) sẽ được gọi cho từng ánh xạ khóa-giá trị trong bảng băm đang được sao chép. Cách tiếp cận này thường cho ra một phương thức `clone` đơn giản, tương đối thanh lịch, nhưng không chạy nhanh bằng phương thức thao tác trực tiếp vào phần bên trong của bản sao. Dù cách tiếp cận này sạch sẽ, nó đi ngược lại toàn bộ kiến trúc `Cloneable` vì nó ghi đè một cách mù quáng lên bản sao từng trường một vốn là nền tảng của kiến trúc đó.

Giống như constructor, phương thức `clone` không bao giờ được gọi một phương thức có thể override trên bản sao đang được xây dựng (**Item 19**). Nếu `clone` gọi một phương thức bị override trong subclass, phương thức đó sẽ thực thi trước khi subclass có cơ hội sửa trạng thái của nó trong bản sao, rất có thể dẫn đến hỏng hóc ở cả bản sao lẫn bản gốc. Do đó, phương thức `put(key, value)` được bàn ở đoạn trước nên là final hoặc private. (Nếu là private, có lẽ nó là “phương thức trợ giúp” (helper method) cho một phương thức public không phải final.)

Phương thức `clone` của `Object` được khai báo ném ra `CloneNotSupportedException`, nhưng các phương thức override không cần phải vậy. **Các phương thức** `clone` **public nên bỏ mệnh đề** `throws`, vì các phương thức không ném checked exception dễ sử dụng hơn (**Item 71**).

Bạn có hai lựa chọn khi thiết kế một class để kế thừa (**Item 19**), nhưng dù chọn cách nào, class đó *không* nên cài đặt `Cloneable`. Bạn có thể chọn bắt chước hành vi của `Object` bằng cách cài đặt một phương thức `clone` protected hoạt động đúng đắn, được khai báo ném ra `CloneNotSupportedException`. Điều này cho các subclass quyền tự do cài đặt `Cloneable` hay không, y như thể chúng kế thừa trực tiếp từ `Object`. Hoặc, bạn có thể chọn *không* cài đặt một phương thức `clone` hoạt động, và ngăn các subclass cài đặt nó, bằng cách cung cấp cài đặt `clone` thoái hóa sau đây:

```java
// clone method for extendable class not supporting Cloneable
@Override
protected final Object clone() throws CloneNotSupportedException {
    throw new CloneNotSupportedException();
}
```

Còn một chi tiết nữa đáng lưu ý. Nếu bạn viết một class thread-safe cài đặt `Cloneable`, hãy nhớ rằng phương thức `clone` của nó phải được đồng bộ hóa đúng cách, giống như mọi phương thức khác (**Item 78**). Phương thức `clone` của `Object` không được đồng bộ hóa, nên ngay cả khi cài đặt của nó là thỏa đáng về mọi mặt khác, bạn vẫn có thể phải viết một phương thức `clone` synchronized trả về `super.clone()`.

Tóm lại, mọi class cài đặt `Cloneable` nên override `clone` bằng một phương thức public có kiểu trả về là chính class đó. Phương thức này trước hết nên gọi `super.clone`, rồi sửa bất kỳ trường nào cần sửa. Thông thường, điều này có nghĩa là sao chép mọi đối tượng mutable tạo nên “cấu trúc sâu” bên trong của đối tượng và thay các tham chiếu của bản sao đến những đối tượng này bằng tham chiếu đến các bản sao của chúng. Dù những bản sao bên trong này thường có thể được tạo bằng cách gọi `clone` đệ quy, đây không phải lúc nào cũng là cách tiếp cận tốt nhất. Nếu class chỉ chứa các trường nguyên thủy hoặc tham chiếu đến các đối tượng immutable, thì nhiều khả năng không có trường nào cần sửa. Có những ngoại lệ cho quy tắc này. Ví dụ, một trường biểu diễn số serial hoặc ID duy nhất khác sẽ cần được sửa ngay cả khi nó là nguyên thủy hoặc immutable.

Toàn bộ sự phức tạp này có thực sự cần thiết? Hiếm khi. Nếu bạn kế thừa một class đã cài đặt `Cloneable`, bạn gần như không có lựa chọn nào khác ngoài việc cài đặt một phương thức `clone` hoạt động tốt. Nếu không, bạn thường tốt hơn nên cung cấp một phương tiện thay thế để sao chép đối tượng. **Một cách tiếp cận tốt hơn để sao chép đối tượng là cung cấp một copy constructor** hoặc **copy factory.** Copy constructor đơn giản là một constructor nhận một đối số duy nhất có kiểu là class chứa constructor đó, ví dụ,

```java
// Copy constructor
public Yum(Yum yum) { ... };
```

Copy factory là phiên bản static factory (**Item 1**) tương ứng của copy constructor:

```java
// Copy factory
public static Yum newInstance(Yum yum) { ... };
```

Cách tiếp cận copy constructor và biến thể static factory của nó có nhiều ưu điểm so với `Cloneable` / `clone`: chúng không dựa vào một cơ chế tạo đối tượng nằm ngoài ngôn ngữ đầy rủi ro; chúng không đòi hỏi việc tuân thủ không thể cưỡng chế các quy ước được tài liệu hóa sơ sài; chúng không xung đột với việc sử dụng đúng đắn các trường final; chúng không ném ra các checked exception không cần thiết; và chúng không đòi hỏi ép kiểu.

Hơn nữa, một copy constructor hoặc factory có thể nhận một đối số có kiểu là một interface mà class cài đặt. Ví dụ, theo quy ước, tất cả các cài đặt collection đa dụng đều cung cấp một constructor có đối số kiểu `Collection` hoặc `Map`. Các copy constructor và factory dựa trên interface, được gọi chính xác hơn là *conversion constructor* (constructor chuyển đổi) và *conversion factory* (factory chuyển đổi), cho phép client chọn kiểu cài đặt của bản sao thay vì buộc client phải chấp nhận kiểu cài đặt của bản gốc. Ví dụ, giả sử bạn có một `HashSet`, `s`, và bạn muốn sao chép nó thành một `TreeSet`. Phương thức `clone` không thể cung cấp chức năng này, nhưng với một conversion constructor thì thật dễ dàng: `new TreeSet<>(s)`.

Với tất cả những vấn đề gắn liền với `Cloneable`, các interface mới không nên kế thừa nó, và các class mới có thể kế thừa không nên cài đặt nó. Dù việc các class final cài đặt `Cloneable` ít gây hại hơn, điều này nên được xem là một tối ưu hóa hiệu năng, dành riêng cho những trường hợp hiếm hoi mà nó là chính đáng (**Item 67**). Theo nguyên tắc, chức năng sao chép tốt nhất nên được cung cấp bởi constructor hoặc factory. Một ngoại lệ đáng chú ý cho quy tắc này là mảng, vốn tốt nhất nên được sao chép bằng phương thức clone.

## Item 14: Cân nhắc cài đặt `Comparable`

Không như các phương thức khác được bàn trong chương này, phương thức `compareTo` không được khai báo trong `Object`. Thay vào đó, nó là phương thức duy nhất trong interface `Comparable`. Nó có tính chất tương tự phương thức `equals` của `Object`, ngoại trừ việc nó cho phép so sánh thứ tự bên cạnh so sánh bằng nhau đơn thuần, và nó là generic. Bằng cách cài đặt `Comparable`, một class chỉ ra rằng các instance của nó có một *thứ tự tự nhiên* (natural ordering). Sắp xếp một mảng các đối tượng cài đặt `Comparable` đơn giản như thế này:

Arrays.sort(a);

Việc tìm kiếm, tính các giá trị cực trị, và duy trì các collection tự động sắp xếp gồm các đối tượng `Comparable` cũng dễ dàng tương tự. Ví dụ, chương trình sau đây, dựa vào việc `String` cài đặt `Comparable`, in ra danh sách theo thứ tự bảng chữ cái các đối số dòng lệnh với các phần tử trùng lặp đã được loại bỏ:

```java
public class WordList {
    public static void main(String[] args) {
        Set<String> s = new TreeSet<>();
        Collections.addAll(s, args);
        System.out.println(s);
    }
}
```

Bằng cách cài đặt `Comparable`, bạn cho phép class của mình tương tác với tất cả vô số các thuật toán generic và cài đặt collection phụ thuộc vào interface này. Bạn đạt được sức mạnh to lớn với một nỗ lực nhỏ. Hầu như tất cả các value class trong thư viện nền tảng Java, cũng như mọi kiểu enum (**Item 34**), đều cài đặt `Comparable`. Nếu bạn đang viết một value class có thứ tự tự nhiên hiển nhiên, chẳng hạn thứ tự bảng chữ cái, thứ tự số, hoặc thứ tự thời gian, bạn nên cài đặt interface `Comparable`:

```java
public interface Comparable<T> {
    int compareTo(T t);
}
```

General contract của phương thức `compareTo` tương tự như của `equals`:

So sánh đối tượng này với đối tượng được chỉ định về thứ tự. Trả về một số nguyên âm, số không, hoặc số nguyên dương tùy theo đối tượng này nhỏ hơn, bằng, hoặc lớn hơn đối tượng được chỉ định. Ném ra `ClassCastException` nếu kiểu của đối tượng được chỉ định khiến nó không thể được so sánh với đối tượng này.

Trong mô tả sau đây, ký hiệu `sgn`(*expression*) chỉ hàm *signum* (hàm dấu) trong toán học, được định nghĩa là trả về `-`1, 0, hoặc 1, tùy theo giá trị của *expression* là âm, bằng không, hay dương.

- Người cài đặt phải bảo đảm `sgn(x.compareTo(y)) == - sgn(y. compareTo(x))` với mọi `x` và `y`. (Điều này ngụ ý rằng `x.compareTo(y)` phải ném ra exception khi và chỉ khi `y.compareTo(x)` ném ra exception.)

- Người cài đặt cũng phải bảo đảm quan hệ này có tính bắc cầu: `(x. compareTo(y) > 0 && y.compareTo(z) > 0)` suy ra `x.compareTo(z) > 0`.

- Cuối cùng, người cài đặt phải bảo đảm `x.compareTo(y) == 0` suy ra `sgn(x.compareTo(z)) == sgn(y.compareTo(z))`, với mọi `z`.

- Rất khuyến nghị, nhưng không bắt buộc, rằng `(x.compareTo(y) == 0) == (x.equals(y))`. Nói chung, bất kỳ class nào cài đặt interface `Comparable` mà vi phạm điều kiện này nên chỉ rõ điều đó. Cách diễn đạt được khuyến nghị là “Lưu ý: Class này có thứ tự tự nhiên không nhất quán với `equals`.”

Đừng nản lòng trước bản chất toán học của contract này. Giống như contract của `equals` (**Item 10**), contract này không phức tạp như vẻ bề ngoài. Không như phương thức `equals`, vốn áp đặt một quan hệ tương đương toàn cục lên mọi đối tượng, `compareTo` không phải hoạt động giữa các đối tượng khác kiểu: khi đối mặt với các đối tượng khác kiểu, `compareTo` được phép ném ra `ClassCastException`. Thông thường, đó chính xác là điều nó làm. Contract này thực sự *cho phép* so sánh liên kiểu, điều này thường được định nghĩa trong một interface mà các đối tượng được so sánh cùng cài đặt.

Cũng như một class vi phạm contract `hashCode` có thể làm hỏng các class khác phụ thuộc vào băm, một class vi phạm contract `compareTo` có thể làm hỏng các class khác phụ thuộc vào so sánh. Các class phụ thuộc vào so sánh bao gồm các collection có sắp xếp `TreeSet` và `TreeMap` cùng các utility class `Collections` và `Arrays`, vốn chứa các thuật toán tìm kiếm và sắp xếp.

Hãy điểm qua các điều khoản của contract `compareTo`. Điều khoản thứ nhất nói rằng nếu bạn đảo chiều một phép so sánh giữa hai tham chiếu đối tượng, điều đúng như mong đợi sẽ xảy ra: nếu đối tượng thứ nhất nhỏ hơn đối tượng thứ hai, thì đối tượng thứ hai phải lớn hơn đối tượng thứ nhất; nếu đối tượng thứ nhất bằng đối tượng thứ hai, thì đối tượng thứ hai phải bằng đối tượng thứ nhất; và nếu đối tượng thứ nhất lớn hơn đối tượng thứ hai, thì đối tượng thứ hai phải nhỏ hơn đối tượng thứ nhất. Điều khoản thứ hai nói rằng nếu một đối tượng lớn hơn đối tượng thứ hai và đối tượng thứ hai lớn hơn đối tượng thứ ba, thì đối tượng thứ nhất phải lớn hơn đối tượng thứ ba. Điều khoản cuối cùng nói rằng mọi đối tượng so sánh bằng nhau phải cho cùng kết quả khi được so sánh với bất kỳ đối tượng nào khác.

Một hệ quả của ba điều khoản này là phép kiểm tra bằng nhau do phương thức `compareTo` áp đặt phải tuân thủ cùng các ràng buộc mà contract `equals` áp đặt: tính phản xạ, đối xứng và bắc cầu. Do đó, cùng một lưu ý được áp dụng: không có cách nào để mở rộng một class có thể khởi tạo với một thành phần giá trị mới mà vẫn bảo toàn contract `compareTo`, trừ khi bạn sẵn sàng từ bỏ những lợi ích của trừu tượng hóa hướng đối tượng (**Item 10**). Cách giải quyết cũng tương tự. Nếu bạn muốn thêm một thành phần giá trị vào một class cài đặt `Comparable`, đừng kế thừa nó; hãy viết một class không liên quan chứa một instance của class thứ nhất. Rồi cung cấp một phương thức “view” trả về instance được chứa. Điều này cho bạn tự do cài đặt bất kỳ phương thức `compareTo` nào bạn muốn trên class chứa, đồng thời cho phép client của nó xem một instance của class chứa như một instance của class được chứa khi cần.

Đoạn cuối của contract `compareTo`, vốn là một gợi ý mạnh mẽ hơn là một yêu cầu thực sự, chỉ đơn giản phát biểu rằng phép kiểm tra bằng nhau do phương thức `compareTo` áp đặt nói chung nên cho cùng kết quả với phương thức `equals`. Nếu điều khoản này được tuân thủ, thứ tự do phương thức `compareTo` áp đặt được gọi là *nhất quán với* `equals`. Nếu bị vi phạm, thứ tự đó được gọi là *không nhất quán với* `equals`. Một class có phương thức `compareTo` áp đặt một thứ tự không nhất quán với `equals` vẫn sẽ hoạt động, nhưng các collection có sắp xếp chứa các phần tử của class đó có thể không tuân thủ general contract của các interface collection tương ứng (`Collection`, `Set`, hoặc `Map`). Đó là vì general contract của các interface này được định nghĩa theo phương thức `equals`, nhưng các collection có sắp xếp lại dùng phép kiểm tra bằng nhau do `compareTo` áp đặt thay cho `equals`. Đây không phải là thảm họa nếu xảy ra, nhưng là điều cần lưu ý.

Ví dụ, hãy xem xét class `BigDecimal`, có phương thức `compareTo` không nhất quán với `equals`. Nếu bạn tạo một instance `HashSet` rỗng rồi thêm `new BigDecimal("1.0")` và `new BigDecimal("1.00")`, set sẽ chứa hai phần tử vì hai instance `BigDecimal` được thêm vào set là khác nhau khi so sánh bằng phương thức `equals`. Tuy nhiên, nếu bạn thực hiện cùng quy trình đó bằng `TreeSet` thay vì `HashSet`, set sẽ chỉ chứa một phần tử vì hai instance `BigDecimal` là bằng nhau khi so sánh bằng phương thức `compareTo`. (Xem tài liệu của `BigDecimal` để biết chi tiết.)

Viết một phương thức `compareTo` tương tự viết một phương thức `equals`, nhưng có một vài khác biệt then chốt. Vì interface `Comparable` được tham số hóa, phương thức `compareTo` có kiểu tĩnh, nên bạn không cần kiểm tra kiểu hay ép kiểu đối số của nó. Nếu đối số sai kiểu, lời gọi thậm chí sẽ không biên dịch được. Nếu đối số là `null`, lời gọi nên ném ra `NullPointerException`, và nó sẽ làm vậy ngay khi phương thức cố truy cập các thành viên của đối số.

Trong một phương thức `compareTo`, các trường được so sánh về thứ tự thay vì về sự bằng nhau. Để so sánh các trường tham chiếu đối tượng, hãy gọi đệ quy phương thức `compareTo`. Nếu một trường không cài đặt `Comparable` hoặc bạn cần một thứ tự phi tiêu chuẩn, hãy dùng `Comparator` thay thế. Bạn có thể tự viết comparator của mình hoặc dùng một comparator có sẵn, như trong phương thức `compareTo` này cho `CaseInsensitiveString` trong **Item 10**:

```java
// Single-field Comparable with object reference field
public final class CaseInsensitiveString
        implements Comparable<CaseInsensitiveString> {
    public int compareTo(CaseInsensitiveString cis) {
        return String.CASE_INSENSITIVE_ORDER.compare(s, cis.s);
    }
    ... // Remainder omitted
}
```

Lưu ý rằng `CaseInsensitiveString` cài đặt `Comparable<CaseInsensitiveString>`. Điều này có nghĩa là một tham chiếu `CaseInsensitiveString` chỉ có thể được so sánh với một tham chiếu `CaseInsensitiveString` khác. Đây là khuôn mẫu thông thường cần tuân theo khi khai báo một class cài đặt `Comparable`.

Các ấn bản trước của cuốn sách này khuyến nghị các phương thức `compareTo` so sánh các trường nguyên thủy kiểu số nguyên bằng các toán tử quan hệ `<` và `>`, và các trường nguyên thủy kiểu số thực bằng các phương thức static `Double.compare` và `Float.compare`. Trong Java 7, các phương thức static `compare` đã được thêm vào tất cả các class boxed primitive của Java. **Việc dùng các toán tử quan hệ** `<` **và** `>` **trong các phương thức** `compareTo` **là dài dòng, dễ gây lỗi và không còn được khuyến nghị.**

Nếu một class có nhiều trường quan trọng, thứ tự bạn so sánh chúng là rất quan trọng. Hãy bắt đầu với trường quan trọng nhất và đi dần xuống. Nếu một phép so sánh cho ra kết quả khác không (không biểu thị bằng nhau), bạn đã xong; chỉ cần trả về kết quả đó. Nếu trường quan trọng nhất bằng nhau, hãy so sánh trường quan trọng kế tiếp, và cứ thế, cho đến khi tìm thấy một trường không bằng nhau hoặc so sánh xong trường ít quan trọng nhất. Đây là một phương thức `compareTo` cho class `PhoneNumber` trong **Item 11** minh họa kỹ thuật này:

```java
// Multiple-field Comparable with primitive fields
public int compareTo(PhoneNumber pn) {
    int result = Short.compare(areaCode, pn.areaCode);
    if (result == 0)  {
        result = Short.compare(prefix, pn.prefix);
        if (result == 0)
            result = Short.compare(lineNum, pn.lineNum);
    }
    return result;
}
```

Trong Java 8, interface `Comparator` được trang bị một bộ các *phương thức xây dựng comparator* (comparator construction method), cho phép xây dựng các comparator theo phong cách fluent. Những comparator này sau đó có thể được dùng để cài đặt phương thức `compareTo`, như interface `Comparable` yêu cầu. Nhiều lập trình viên ưa thích sự ngắn gọn của cách tiếp cận này, dù nó đi kèm một chi phí hiệu năng khiêm tốn: sắp xếp các mảng instance `PhoneNumber` chậm hơn khoảng 10% trên máy của tôi. Khi dùng cách tiếp cận này, hãy cân nhắc dùng cơ chế *static import* của Java để bạn có thể tham chiếu đến các phương thức static xây dựng comparator bằng tên đơn giản của chúng, cho rõ ràng và ngắn gọn. Đây là hình dạng của phương thức `compareTo` cho `PhoneNumber` khi dùng cách tiếp cận này:

```java
// Comparable with comparator construction methods
private static final Comparator<PhoneNumber> COMPARATOR =
        comparingInt((PhoneNumber pn) -> pn.areaCode)
          .thenComparingInt(pn -> pn.prefix)
          .thenComparingInt(pn -> pn.lineNum);

public int compareTo(PhoneNumber pn) {
    return COMPARATOR.compare(this, pn);
}
```

Cài đặt này xây dựng một comparator vào thời điểm khởi tạo class, dùng hai phương thức xây dựng comparator. Phương thức thứ nhất là `comparingInt`. Đó là một phương thức static nhận một *hàm trích xuất khóa* (key extractor function) ánh xạ một tham chiếu đối tượng sang một khóa kiểu `int` và trả về một comparator sắp thứ tự các instance theo khóa đó. Trong ví dụ trên, `comparingInt` nhận một *lambda* trích xuất mã vùng từ một `PhoneNumber` và trả về một `Comparator<PhoneNumber>` sắp thứ tự các số điện thoại theo mã vùng của chúng. Lưu ý rằng lambda chỉ định tường minh kiểu của tham số đầu vào (`PhoneNumber pn`). Hóa ra trong tình huống này, cơ chế suy luận kiểu (type inference) của Java không đủ mạnh để tự tìm ra kiểu, nên chúng ta buộc phải giúp nó để chương trình biên dịch được.

Nếu hai số điện thoại có cùng mã vùng, chúng ta cần tinh chỉnh thêm phép so sánh, và đó chính xác là điều phương thức xây dựng comparator thứ hai, `thenComparingInt`, làm. Đó là một phương thức instance trên `Comparator` nhận một hàm trích xuất khóa kiểu `int`, và trả về một comparator trước tiên áp dụng comparator ban đầu rồi dùng khóa được trích xuất để phân định khi hòa nhau. Bạn có thể xếp chồng bao nhiêu lời gọi `thenComparingInt` tùy thích, tạo ra một *thứ tự từ điển* (lexicographic ordering). Trong ví dụ trên, chúng ta xếp chồng hai lời gọi `thenComparingInt`, tạo ra một thứ tự có khóa thứ cấp là tiền tố và khóa thứ ba là số thuê bao. Lưu ý rằng chúng ta *không* phải chỉ định kiểu tham số của hàm trích xuất khóa được truyền vào cả hai lời gọi `thenComparingInt`: cơ chế suy luận kiểu của Java đủ thông minh để tự tìm ra điều này.

Class `Comparator` có đầy đủ một bộ các phương thức xây dựng. Có các phiên bản tương tự `comparingInt` và `thenComparingInt` cho các kiểu nguyên thủy `long` và `double`. Các phiên bản `int` cũng có thể được dùng cho các kiểu số nguyên hẹp hơn, chẳng hạn `short`, như trong ví dụ `PhoneNumber` của chúng ta. Các phiên bản `double` cũng có thể được dùng cho `float`. Điều này bao phủ tất cả các kiểu nguyên thủy số của Java.

Cũng có các phương thức xây dựng comparator cho các kiểu tham chiếu đối tượng. Phương thức static, tên là `comparing`, có hai overloading. Một nhận một hàm trích xuất khóa và dùng thứ tự tự nhiên của các khóa. Cái thứ hai nhận cả hàm trích xuất khóa lẫn một comparator để dùng trên các khóa được trích xuất. Có ba overloading của phương thức instance, tên là `thenComparing`. Một overloading chỉ nhận một comparator và dùng nó để cung cấp thứ tự thứ cấp. Overloading thứ hai chỉ nhận một hàm trích xuất khóa và dùng thứ tự tự nhiên của khóa làm thứ tự thứ cấp. Overloading cuối cùng nhận cả hàm trích xuất khóa lẫn một comparator để dùng trên các khóa được trích xuất.

Thỉnh thoảng bạn có thể thấy các phương thức `compareTo` hoặc `compare` dựa vào việc hiệu của hai giá trị là âm nếu giá trị thứ nhất nhỏ hơn giá trị thứ hai, bằng không nếu hai giá trị bằng nhau, và dương nếu giá trị thứ nhất lớn hơn. Đây là một ví dụ:

```java
// BROKEN difference-based comparator - violates transitivity!
static Comparator<Object> hashCodeOrder = new Comparator<>() {
    public int compare(Object o1, Object o2) {
        return o1.hashCode() - o2.hashCode();
    }
};
```

Đừng dùng kỹ thuật này. Nó đầy rẫy nguy hiểm từ tràn số nguyên (integer overflow) và các hiện tượng bất thường của số học dấu phẩy động IEEE 754 [**JLS 15.20.1, 15.21.1**]. Hơn nữa, các phương thức kết quả khó có khả năng nhanh hơn đáng kể so với những phương thức viết bằng các kỹ thuật được mô tả trong item này. Hãy dùng hoặc một phương thức static `compare`:

```java
// Comparator based on static compare method
static Comparator<Object> hashCodeOrder = new Comparator<>() {
    public int compare(Object o1, Object o2) {
        return Integer.compare(o1.hashCode(), o2.hashCode());
    }
};
```

hoặc một phương thức xây dựng comparator:

```java
// Comparator based on Comparator construction method
static Comparator<Object> hashCodeOrder =
        Comparator.comparingInt(o -> o.hashCode());
```

Tóm lại, bất cứ khi nào bạn cài đặt một value class có một thứ tự hợp lý, bạn nên cho class đó cài đặt interface `Comparable` để các instance của nó có thể dễ dàng được sắp xếp, tìm kiếm, và dùng trong các collection dựa trên so sánh. Khi so sánh giá trị các trường trong cài đặt của các phương thức `compareTo`, hãy tránh dùng các toán tử `<` và `>`. Thay vào đó, hãy dùng các phương thức static `compare` trong các class boxed primitive hoặc các phương thức xây dựng comparator trong interface `Comparator`.
