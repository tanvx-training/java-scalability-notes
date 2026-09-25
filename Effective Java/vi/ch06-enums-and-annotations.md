# Chương 6. Enum và Annotation

Java hỗ trợ hai họ kiểu tham chiếu (reference type) dành cho mục đích đặc biệt: một loại class gọi là *enum type* (kiểu liệt kê), và một loại interface gọi là *annotation type* (kiểu chú thích). Chương này bàn về các thực hành tốt nhất khi sử dụng hai họ kiểu này.

## Item 34: Dùng enum thay cho hằng số `int`

Một *kiểu liệt kê* (enumerated type) là kiểu mà các giá trị hợp lệ của nó gồm một tập cố định các hằng số, chẳng hạn các mùa trong năm, các hành tinh trong hệ mặt trời, hay các chất trong bộ bài. Trước khi enum type được thêm vào ngôn ngữ, một mẫu phổ biến để biểu diễn kiểu liệt kê là khai báo một nhóm hằng số `int` có tên, mỗi hằng cho một thành viên của kiểu:

```java
// The int enum pattern - severely deficient!
public static final int APPLE_FUJI         = 0;
public static final int APPLE_PIPPIN       = 1;
public static final int APPLE_GRANNY_SMITH = 2;
public static final int ORANGE_NAVEL  = 0;
public static final int ORANGE_TEMPLE = 1;
public static final int ORANGE_BLOOD  = 2;
```

Kỹ thuật này, được gọi là `int` *enum pattern* (mẫu enum bằng `int`), có nhiều thiếu sót. Nó không cung cấp chút gì về an toàn kiểu (type safety) và rất ít về khả năng biểu đạt. Trình biên dịch sẽ không phàn nàn nếu bạn truyền một quả táo vào một method mong đợi quả cam, so sánh táo với cam bằng toán tử `==`, hoặc tệ hơn:

```java
// Tasty citrus flavored applesauce!
int i = (APPLE_FUJI - ORANGE_TEMPLE) / APPLE_PIPPIN;
```

Lưu ý rằng tên của mỗi hằng táo được gắn tiền tố `APPLE_` và tên của mỗi hằng cam được gắn tiền tố `ORANGE_`. Đó là vì Java không cung cấp namespace cho các nhóm enum `int`. Tiền tố giúp tránh xung đột tên khi hai nhóm enum `int` có các hằng trùng tên, ví dụ giữa `ELEMENT_MERCURY` và `PLANET_MERCURY`.

Các chương trình dùng enum `int` rất dễ vỡ. Vì enum `int` là *constant variable* (biến hằng) [JLS, 4.12.4], giá trị `int` của chúng được biên dịch thẳng vào các client sử dụng chúng [JLS, 13.1]. Nếu giá trị gắn với một enum `int` bị thay đổi, các client phải được biên dịch lại. Nếu không, client vẫn chạy được, nhưng hành vi của chúng sẽ sai.

Không có cách dễ dàng nào để chuyển hằng enum `int` thành chuỗi có thể in ra. Nếu bạn in một hằng như vậy hoặc hiển thị nó từ debugger, tất cả những gì bạn thấy chỉ là một con số, chẳng giúp ích gì mấy. Không có cách đáng tin cậy nào để duyệt qua toàn bộ các hằng enum `int` trong một nhóm, hay thậm chí để lấy kích thước của một nhóm enum `int`.

Bạn có thể gặp một biến thể của mẫu này trong đó hằng `String` được dùng thay cho hằng `int`. Biến thể này, được gọi là `String` *enum pattern*, còn kém mong muốn hơn. Dù nó cung cấp chuỗi có thể in ra cho các hằng, nó có thể khiến người dùng thiếu kinh nghiệm hard-code hằng chuỗi thẳng vào mã client thay vì dùng tên field. Nếu một hằng chuỗi hard-code như vậy chứa lỗi đánh máy, nó sẽ thoát khỏi sự phát hiện lúc biên dịch và gây ra bug lúc chạy. Ngoài ra, nó có thể dẫn đến vấn đề hiệu năng, vì nó dựa trên việc so sánh chuỗi.

May thay, Java cung cấp một giải pháp thay thế tránh được mọi thiếu sót của mẫu enum `int` và `string`, đồng thời mang lại nhiều lợi ích bổ sung. Đó là *enum type* [JLS, 8.9]. Đây là hình thức đơn giản nhất của nó:

```java
public enum Apple  { FUJI, PIPPIN, GRANNY_SMITH }
public enum Orange { NAVEL, TEMPLE, BLOOD }
```

Nhìn bề ngoài, các enum type này có vẻ giống với enum của các ngôn ngữ khác như C, C++ và C#, nhưng vẻ ngoài dễ đánh lừa. Enum type của Java là những class đầy đủ, mạnh hơn nhiều so với đối thủ ở các ngôn ngữ kia, nơi enum về bản chất chỉ là giá trị `int`.

Ý tưởng cơ bản đằng sau enum type của Java rất đơn giản: chúng là những class xuất ra một instance cho mỗi hằng liệt kê thông qua một field public static final. Enum type thực chất là final, bởi chúng không có constructor nào có thể truy cập được. Vì client không thể tạo instance của một enum type cũng như không thể kế thừa nó, nên không thể có instance nào khác ngoài các hằng enum đã khai báo. Nói cách khác, enum type là instance-controlled (được kiểm soát instance) (trang 6). Chúng là sự tổng quát hóa của singleton (**Item 3**), vốn về bản chất là enum chỉ có một phần tử.

Enum cung cấp an toàn kiểu tại thời điểm biên dịch. Nếu bạn khai báo một tham số có kiểu `Apple`, bạn được đảm bảo rằng bất kỳ tham chiếu đối tượng khác null nào được truyền vào tham số đó đều là một trong ba giá trị `Apple` hợp lệ. Việc cố truyền giá trị sai kiểu sẽ gây lỗi biên dịch, cũng như việc cố gán một biểu thức thuộc enum type này cho một biến thuộc enum type khác, hay dùng toán tử `==` để so sánh giá trị của các enum type khác nhau.

Các enum type có hằng trùng tên chung sống hòa bình với nhau vì mỗi kiểu có namespace riêng. Bạn có thể thêm hoặc sắp xếp lại các hằng trong một enum type mà không cần biên dịch lại client, vì các field xuất ra các hằng đó tạo thành một lớp cách ly giữa enum type và client của nó: giá trị hằng không bị biên dịch vào client như trong mẫu enum `int`. Cuối cùng, bạn có thể chuyển enum thành chuỗi có thể in ra bằng cách gọi method `toString` của chúng.

Ngoài việc khắc phục các thiếu sót của enum `int`, enum type còn cho phép bạn thêm method và field tùy ý, cũng như implement interface tùy ý. Chúng cung cấp các cài đặt chất lượng cao cho tất cả các method của `Object` (**Chương 3**), chúng implement `Comparable` (**Item 14**) và `Serializable` (**Chương 12**), và dạng serialized của chúng được thiết kế để chịu được hầu hết các thay đổi đối với enum type.

Vậy tại sao bạn lại muốn thêm method hay field vào một enum type? Trước hết, bạn có thể muốn gắn dữ liệu với các hằng của nó. Chẳng hạn, kiểu `Apple` và `Orange` của chúng ta có thể hưởng lợi từ một method trả về màu của trái cây, hoặc một method trả về hình ảnh của nó. Bạn có thể bổ sung cho enum type bất kỳ method nào có vẻ phù hợp. Một enum type có thể khởi đầu như một tập hợp đơn giản các hằng enum và tiến hóa theo thời gian thành một abstraction đầy đủ tính năng.

Để có một ví dụ hay về enum type phong phú, hãy xét tám hành tinh trong hệ mặt trời của chúng ta. Mỗi hành tinh có khối lượng và bán kính, và từ hai thuộc tính này bạn có thể tính gia tốc trọng trường bề mặt của nó. Điều này đến lượt nó cho phép bạn tính trọng lượng của một vật trên bề mặt hành tinh, khi biết khối lượng của vật. Enum này trông như sau. Các con số trong ngoặc đơn sau mỗi hằng enum là các tham số được truyền vào constructor của nó. Trong trường hợp này, chúng là khối lượng và bán kính của hành tinh:

```java
// Enum type with data and behavior
public enum Planet {
    MERCURY(3.302e+23, 2.439e6),
    VENUS  (4.869e+24, 6.052e6),
    EARTH  (5.975e+24, 6.378e6),
    MARS   (6.419e+23, 3.393e6),
    JUPITER(1.899e+27, 7.149e7),
    SATURN (5.685e+26, 6.027e7),
    URANUS (8.683e+25, 2.556e7),
    NEPTUNE(1.024e+26, 2.477e7);

    private final double mass;           // In kilograms
    private final double radius;         // In meters
    private final double surfaceGravity; // In m / s^2

    // Universal gravitational constant in m^3 / kg s^2
    private static final double G = 6.67300E-11;

    // Constructor
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
        surfaceGravity = G * mass / (radius * radius);
    }

    public double mass()           { return mass; }
    public double radius()         { return radius; }
    public double surfaceGravity() { return surfaceGravity; }
    public double surfaceWeight(double mass) {
        return mass * surfaceGravity;  // F = ma
    }
}
```

Viết một enum type phong phú như `Planet` rất dễ. **Để gắn dữ liệu với các hằng enum, hãy khai báo các instance field và viết một constructor nhận dữ liệu rồi lưu vào các field đó.** Enum về bản chất là immutable (bất biến), nên mọi field đều phải là final (**Item 17**). Field có thể là public, nhưng tốt hơn là để private và cung cấp các accessor public (**Item 16**). Trong trường hợp `Planet`, constructor còn tính và lưu gia tốc trọng trường bề mặt, nhưng đây chỉ là một tối ưu hóa. Gia tốc trọng trường có thể được tính lại từ khối lượng và bán kính mỗi lần nó được method `surfaceWeight` sử dụng; method này nhận khối lượng của một vật và trả về trọng lượng của vật đó trên hành tinh mà hằng đại diện.

Dù enum `Planet` đơn giản, nó mạnh đến bất ngờ. Đây là một chương trình ngắn nhận trọng lượng trên Trái Đất của một vật (theo đơn vị bất kỳ) và in ra một bảng đẹp về trọng lượng của vật đó trên cả tám hành tinh (cùng đơn vị):

```java
public class WeightTable {
   public static void main(String[] args) {
      double earthWeight = Double.parseDouble(args[0]);
      double mass = earthWeight / Planet.EARTH.surfaceGravity();
      for (Planet p : Planet.values())
          System.out.printf("Weight on %s is %f%n",
                            p, p.surfaceWeight(mass));
      }
}
```

Lưu ý rằng `Planet`, giống như mọi enum, có một method static `values` trả về một mảng các giá trị của nó theo thứ tự khai báo. Cũng lưu ý rằng method `toString` trả về tên khai báo của mỗi giá trị enum, giúp việc in ra bằng `println` và `printf` trở nên dễ dàng. Nếu bạn không hài lòng với biểu diễn chuỗi này, bạn có thể thay đổi nó bằng cách override method `toString`. Đây là kết quả khi chạy chương trình `WeightTable` của chúng ta (không override `toString`) với đối số dòng lệnh là 185:

```java
Weight on MERCURY is 69.912739
Weight on VENUS is 167.434436
Weight on EARTH is 185.000000
Weight on MARS is 70.226739
Weight on JUPITER is 467.990696
Weight on SATURN is 197.120111
Weight on URANUS is 167.398264
Weight on NEPTUNE is 210.208751
```

Cho đến năm 2006, hai năm sau khi enum được thêm vào Java, Sao Diêm Vương vẫn là một hành tinh. Điều này đặt ra câu hỏi “chuyện gì xảy ra khi bạn xóa một phần tử khỏi enum type?” Câu trả lời là bất kỳ chương trình client nào không tham chiếu đến phần tử bị xóa sẽ tiếp tục hoạt động bình thường. Chẳng hạn, chương trình `WeightTable` của chúng ta sẽ đơn giản in ra một bảng ít hơn một dòng. Còn chương trình client có tham chiếu đến phần tử bị xóa (trong trường hợp này là `Planet.Pluto`) thì sao? Nếu bạn biên dịch lại chương trình client, việc biên dịch sẽ thất bại với một thông báo lỗi hữu ích tại dòng tham chiếu đến hành tinh cũ; nếu bạn không biên dịch lại client, nó sẽ ném ra một exception hữu ích từ dòng đó lúc chạy. Đây là hành vi tốt nhất bạn có thể mong đợi, tốt hơn nhiều so với những gì bạn nhận được từ mẫu enum `int`.

Một số hành vi gắn với hằng enum có thể chỉ cần dùng bên trong class hoặc package nơi enum được định nghĩa. Những hành vi như vậy tốt nhất nên được cài đặt dưới dạng method private hoặc package-private. Khi đó mỗi hằng mang theo một tập hành vi ẩn, cho phép class hoặc package chứa enum phản ứng phù hợp khi gặp hằng đó. Cũng như với các class khác, trừ khi bạn có lý do thuyết phục để lộ một method của enum cho client, hãy khai báo nó là private hoặc, nếu cần, là package-private (**Item 15**).

Nếu một enum hữu ích một cách tổng quát, nó nên là một class cấp cao nhất (top-level class); nếu việc sử dụng nó gắn liền với một top-level class cụ thể, nó nên là member class của top-level class đó (**Item 24**). Ví dụ, enum `java.math.RoundingMode` biểu diễn chế độ làm tròn cho phân số thập phân. Các chế độ làm tròn này được class `BigDecimal` sử dụng, nhưng chúng cung cấp một abstraction hữu ích không gắn chặt về bản chất với `BigDecimal`. Bằng cách đặt `RoundingMode` làm top-level enum, các nhà thiết kế thư viện khuyến khích bất kỳ lập trình viên nào cần chế độ làm tròn tái sử dụng enum này, dẫn đến sự nhất quán cao hơn giữa các API.

Các kỹ thuật được minh họa trong ví dụ `Planet` là đủ cho hầu hết enum type, nhưng đôi khi bạn cần nhiều hơn thế. Mỗi hằng `Planet` có dữ liệu khác nhau, nhưng đôi khi bạn cần gắn *hành vi* khác nhau về căn bản với mỗi hằng. Ví dụ, giả sử bạn đang viết một enum type để biểu diễn các phép toán trên một máy tính bốn phép cơ bản và bạn muốn cung cấp một method để thực hiện phép toán số học mà mỗi hằng đại diện. Một cách để đạt được điều này là switch trên giá trị của enum:

```java
// Enum type that switches on its own value - questionable
public enum Operation {
    PLUS, MINUS, TIMES, DIVIDE;

    // Do the arithmetic operation represented by this constant
    public double apply(double x, double y) {
        switch(this) {
            case PLUS:   return x + y;
            case MINUS:  return x - y;
            case TIMES:  return x * y;
            case DIVIDE: return x / y;
        }
        throw new AssertionError("Unknown op: " + this);
    }
}
```

Đoạn mã này hoạt động, nhưng không đẹp lắm. Nó sẽ không biên dịch được nếu thiếu câu lệnh `throw`, vì về mặt kỹ thuật, điểm cuối của method là có thể đến được, dù trên thực tế sẽ không bao giờ đến [JLS, 14.21]. Tệ hơn, đoạn mã này mong manh. Nếu bạn thêm một hằng enum mới nhưng quên thêm case tương ứng vào `switch`, enum vẫn biên dịch được, nhưng nó sẽ thất bại lúc chạy khi bạn cố áp dụng phép toán mới.

May thay, có một cách tốt hơn để gắn hành vi khác nhau với mỗi hằng enum: khai báo một method `apply` abstract trong enum type, và override nó bằng một method cụ thể cho mỗi hằng trong một *constant-specific class body* (thân class riêng cho từng hằng). Những method như vậy được gọi là *constant-specific method implementation* (cài đặt method riêng cho từng hằng):

```java
// Enum type with constant-specific method implementations
public enum Operation {
  PLUS  {public double apply(double x, double y){return x + y;}},
  MINUS {public double apply(double x, double y){return x - y;}},
  TIMES {public double apply(double x, double y){return x * y;}},
  DIVIDE{public double apply(double x, double y){return x / y;}};

  public abstract double apply(double x, double y);
}
```

Nếu bạn thêm một hằng mới vào phiên bản thứ hai của `Operation`, khó có chuyện bạn quên cung cấp method `apply`, vì method này nằm ngay sau mỗi khai báo hằng. Trong trường hợp hiếm hoi bạn vẫn quên, trình biên dịch sẽ nhắc bạn, vì các method abstract trong enum type bắt buộc phải được override bằng method cụ thể ở tất cả các hằng của nó.

Constant-specific method implementation có thể kết hợp với dữ liệu riêng cho từng hằng. Ví dụ, đây là một phiên bản của `Operation` override method `toString` để trả về ký hiệu thường gắn với phép toán:

```java
// Enum type with constant-specific class bodies and data
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

Cài đặt `toString` ở trên giúp việc in các biểu thức số học trở nên dễ dàng, như chương trình nhỏ sau minh họa:

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    for (Operation op : Operation.values())
        System.out.printf("%f %s %f = %f%n",
                          x, op, y, op.apply(x, y));
}
```

Chạy chương trình này với 2 và 4 làm đối số dòng lệnh sẽ cho ra kết quả sau:

```java
2.000000 + 4.000000 = 6.000000
2.000000 - 4.000000 = -2.000000
2.000000 * 4.000000 = 8.000000
2.000000 / 4.000000 = 0.500000
```

Enum type có một method `valueOf(String)` được sinh tự động, chuyển tên của một hằng thành chính hằng đó. Nếu bạn override method `toString` trong một enum type, hãy cân nhắc viết một method `fromString` để chuyển biểu diễn chuỗi tùy chỉnh ngược lại thành enum tương ứng. Đoạn mã sau (với tên kiểu được thay đổi cho phù hợp) sẽ làm được việc này cho bất kỳ enum nào, miễn là mỗi hằng có một biểu diễn chuỗi duy nhất:

```java
// Implementing a fromString method on an enum type
private static final Map<String, Operation> stringToEnum =
        Stream.of(values()).collect(
            toMap(Object::toString, e -> e));

// Returns Operation for string, if any
public static Optional<Operation> fromString(String symbol) {
    return Optional.ofNullable(stringToEnum.get(symbol));
}
```

Lưu ý rằng các hằng `Operation` được đưa vào map `stringToEnum` từ một khởi tạo static field, vốn chạy sau khi các hằng enum đã được tạo. Đoạn mã trên dùng một stream (**Chương 7**) trên mảng do method `values()` trả về; trước Java 8, chúng ta sẽ tạo một hash map rỗng rồi duyệt qua mảng values để chèn các ánh xạ chuỗi-sang-enum vào map, và bạn vẫn có thể làm theo cách đó nếu thích. Nhưng lưu ý rằng việc cố để mỗi hằng tự đưa mình vào map từ chính constructor của nó *không* hoạt động. Nó sẽ gây lỗi biên dịch, và đó là điều tốt, vì nếu hợp lệ, nó sẽ gây ra `NullPointerException` lúc chạy. Constructor của enum không được phép truy cập các static field của enum, ngoại trừ các constant variable (**Item 24**). Hạn chế này là cần thiết vì các static field chưa được khởi tạo khi constructor của enum chạy. Một trường hợp đặc biệt của hạn chế này là các hằng enum không thể truy cập lẫn nhau từ constructor của chúng.

Cũng lưu ý rằng method `fromString` trả về một `Optional<Operation>`. Điều này cho phép method báo hiệu rằng chuỗi được truyền vào không biểu diễn một phép toán hợp lệ, và buộc client phải đối mặt với khả năng đó (**Item 55**).

Một nhược điểm của constant-specific method implementation là chúng khiến việc chia sẻ mã giữa các hằng enum trở nên khó khăn hơn. Ví dụ, hãy xét một enum biểu diễn các ngày trong tuần trong một gói tính lương. Enum này có một method tính lương của công nhân cho ngày đó, dựa trên mức lương cơ bản (theo giờ) và số phút đã làm việc trong ngày. Trong năm ngày thường, thời gian làm việc vượt quá một ca bình thường sẽ được tính lương làm thêm; trong hai ngày cuối tuần, toàn bộ thời gian làm việc đều được tính lương làm thêm. Với câu lệnh `switch`, việc tính toán này rất dễ, bằng cách gán nhiều nhãn case cho mỗi đoạn trong hai đoạn mã:

```java
// Enum that switches on its value to share code - questionable
enum PayrollDay {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY,
    SATURDAY, SUNDAY;

    private static final int MINS_PER_SHIFT = 8 * 60;

    int pay(int minutesWorked, int payRate) {
        int basePay = minutesWorked * payRate;

        int overtimePay;
        switch(this) {
          case SATURDAY: case SUNDAY: // Weekend
            overtimePay = basePay / 2;
            break;
          default: // Weekday
            overtimePay = minutesWorked <= MINS_PER_SHIFT ?
              0 : (minutesWorked - MINS_PER_SHIFT) * payRate / 2;
        }

        return basePay + overtimePay;
    }
}
```

Đoạn mã này không thể phủ nhận là ngắn gọn, nhưng nó nguy hiểm dưới góc độ bảo trì. Giả sử bạn thêm một phần tử vào enum, có thể là một giá trị đặc biệt để biểu diễn ngày nghỉ phép, nhưng quên thêm case tương ứng vào câu lệnh `switch`. Chương trình vẫn biên dịch được, nhưng method `pay` sẽ âm thầm trả lương cho công nhân trong ngày nghỉ phép bằng với một ngày thường.

Để thực hiện việc tính lương một cách an toàn bằng constant-specific method implementation, bạn sẽ phải lặp lại phép tính lương làm thêm cho mỗi hằng, hoặc chuyển phép tính đó vào hai helper method, một cho ngày thường và một cho ngày cuối tuần, rồi gọi helper method phù hợp từ mỗi hằng. Cách nào cũng sẽ dẫn đến một lượng đáng kể mã lặp lại (boilerplate), làm giảm đáng kể tính dễ đọc và tăng cơ hội mắc lỗi.

Lượng boilerplate có thể được giảm bớt bằng cách thay method abstract `overtimePay` trên `PayrollDay` bằng một method cụ thể thực hiện phép tính làm thêm cho ngày thường. Khi đó chỉ các ngày cuối tuần mới phải override method này. Nhưng cách này có cùng nhược điểm với câu lệnh `switch`: nếu bạn thêm một ngày khác mà không override method `overtimePay`, bạn sẽ âm thầm kế thừa phép tính của ngày thường.

Điều bạn thực sự muốn là bị *buộc* phải chọn một chiến lược tính lương làm thêm mỗi khi thêm một hằng enum. May thay, có một cách hay để đạt được điều này. Ý tưởng là chuyển phép tính lương làm thêm vào một enum lồng bên trong (nested enum), và truyền một instance của *strategy enum* (enum chiến lược) này vào constructor của enum `PayrollDay`. Enum `PayrollDay` sau đó ủy quyền việc tính lương làm thêm cho strategy enum, loại bỏ nhu cầu dùng câu lệnh `switch` hay constant-specific method implementation trong `PayrollDay`. Dù mẫu này kém ngắn gọn hơn câu lệnh `switch`, nó an toàn hơn và linh hoạt hơn:

```java
// The strategy enum pattern
enum PayrollDay {
    MONDAY(WEEKDAY), TUESDAY(WEEKDAY), WEDNESDAY(WEEKDAY),
    THURSDAY(WEEKDAY), FRIDAY(WEEKDAY),
    SATURDAY(WEEKEND), SUNDAY(WEEKEND);

    private final PayType payType;

    PayrollDay(PayType payType) { this.payType = payType; }

    int pay(int minutesWorked, int payRate) {
        return payType.pay(minutesWorked, payRate);
    }
    // The strategy enum type
    private enum PayType {
        WEEKDAY {
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked <= MINS_PER_SHIFT ? 0 :
                  (minsWorked - MINS_PER_SHIFT) * payRate / 2;
            }
        },
        WEEKEND {
            int overtimePay(int minsWorked, int payRate) {
                return minsWorked * payRate / 2;
            }
        };

        abstract int overtimePay(int mins, int payRate);
        private static final int MINS_PER_SHIFT = 8 * 60;

        int pay(int minsWorked, int payRate) {
            int basePay = minsWorked * payRate;
            return basePay + overtimePay(minsWorked, payRate);
        }
    }
}
```

Nếu câu lệnh `switch` trên enum không phải là lựa chọn tốt để cài đặt hành vi riêng cho từng hằng trên enum, thì chúng *thực sự* hữu ích cho việc gì? **Switch trên enum hữu ích để bổ sung hành vi riêng cho từng hằng vào enum type.** Ví dụ, giả sử enum `Operation` không nằm trong tầm kiểm soát của bạn và bạn ước nó có một instance method trả về phép toán nghịch đảo của mỗi phép toán. Bạn có thể mô phỏng hiệu ứng đó bằng static method sau:

```java
// Switch on an enum to simulate a missing method
public static Operation inverse(Operation op) {
    switch(op) {
        case PLUS:   return Operation.MINUS;
        case MINUS:  return Operation.PLUS;
        case TIMES:  return Operation.DIVIDE;
        case DIVIDE: return Operation.TIMES;
        default:  throw new AssertionError("Unknown op: " + op);
    }
}
```

Bạn cũng nên dùng kỹ thuật này với các enum type *nằm trong* tầm kiểm soát của bạn nếu một method đơn giản là không thuộc về enum type đó. Method có thể cần cho một mục đích sử dụng nào đó nhưng không đủ hữu ích một cách tổng quát để xứng đáng được đưa vào enum type.

Nói chung, enum có hiệu năng tương đương với hằng `int`. Một nhược điểm nhỏ về hiệu năng của enum là có chi phí về không gian và thời gian để nạp và khởi tạo enum type, nhưng điều này khó có thể nhận thấy trong thực tế.

Vậy khi nào bạn nên dùng enum? **Hãy dùng enum bất cứ khi nào bạn cần một tập hằng số mà các thành viên của nó đã được biết tại thời điểm biên dịch.** Tất nhiên, điều này bao gồm các “kiểu liệt kê tự nhiên”, như các hành tinh, các ngày trong tuần, và các quân cờ. Nhưng nó cũng bao gồm các tập khác mà bạn biết tất cả các giá trị có thể có tại thời điểm biên dịch, như các lựa chọn trên menu, mã phép toán (operation code), và cờ dòng lệnh. **Tập hằng trong một enum type không nhất thiết phải cố định mãi mãi.** Tính năng enum được thiết kế đặc biệt để cho phép enum type tiến hóa mà vẫn tương thích nhị phân.

Tóm lại, ưu điểm của enum type so với hằng `int` là rất thuyết phục. Enum dễ đọc hơn, an toàn hơn và mạnh hơn. Nhiều enum không cần constructor hay member tường minh nào, nhưng những enum khác hưởng lợi từ việc gắn dữ liệu với mỗi hằng và cung cấp các method mà hành vi bị ảnh hưởng bởi dữ liệu này. Ít enum hơn hưởng lợi từ việc gắn nhiều hành vi với một method duy nhất. Trong trường hợp tương đối hiếm này, hãy ưu tiên constant-specific method thay vì enum switch trên chính giá trị của nó. Hãy cân nhắc mẫu strategy enum nếu một số, nhưng không phải tất cả, các hằng enum chia sẻ hành vi chung.

## Item 35: Dùng instance field thay cho ordinal

Nhiều enum gắn liền một cách tự nhiên với một giá trị `int` duy nhất. Mọi enum đều có method `ordinal`, trả về vị trí số thứ tự của mỗi hằng enum trong kiểu của nó. Bạn có thể bị cám dỗ suy ra giá trị `int` gắn liền từ ordinal:

```java
// Abuse of ordinal to derive an associated value - DON'T DO THIS
public enum Ensemble {
    SOLO,   DUET,   TRIO, QUARTET, QUINTET,
    SEXTET, SEPTET, OCTET, NONET,  DECTET;

    public int numberOfMusicians() { return ordinal() + 1; }
}
```

Dù enum này hoạt động, nó là một cơn ác mộng bảo trì. Nếu các hằng bị sắp xếp lại, method `numberOfMusicians` sẽ hỏng. Nếu bạn muốn thêm một hằng enum thứ hai gắn với một giá trị `int` bạn đã dùng rồi, bạn hết đường. Ví dụ, sẽ hay nếu thêm một hằng cho *double quartet* (song tứ tấu), vốn giống như octet, gồm tám nhạc công, nhưng không có cách nào để làm được.

Ngoài ra, bạn không thể thêm một hằng cho một giá trị `int` mà không thêm hằng cho tất cả các giá trị `int` nằm giữa. Ví dụ, giả sử bạn muốn thêm một hằng biểu diễn *triple quartet* (tam tứ tấu), gồm mười hai nhạc công. Không có thuật ngữ chuẩn nào cho một ban nhạc gồm mười một nhạc công, nên bạn buộc phải thêm một hằng giả cho giá trị `int` không dùng đến (`11`). Trường hợp tốt nhất, điều này là xấu xí. Nếu có nhiều giá trị `int` không dùng đến, nó trở nên bất khả thi.

May thay, có một giải pháp đơn giản cho những vấn đề này. **Đừng bao giờ suy ra giá trị gắn với một enum từ ordinal của nó; thay vào đó hãy lưu nó trong một instance field:**

```java
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5),
    SEXTET(6), SEPTET(7), OCTET(8), DOUBLE_QUARTET(8),
    NONET(9), DECTET(10), TRIPLE_QUARTET(12);

    private final int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
```

Đặc tả của `Enum` nói thế này về `ordinal`: “Hầu hết lập trình viên sẽ không có nhu cầu dùng method này. Nó được thiết kế để dùng bởi các cấu trúc dữ liệu tổng quát dựa trên enum như `EnumSet` và `EnumMap`.” Trừ khi bạn đang viết mã có tính chất như vậy, tốt nhất là bạn nên tránh hoàn toàn method `ordinal`.

## Item 36: Dùng `EnumSet` thay cho bit field

Nếu các phần tử của một kiểu liệt kê chủ yếu được dùng trong các tập hợp, theo truyền thống người ta dùng mẫu enum `int` (**Item 34**), gán cho mỗi hằng một lũy thừa khác nhau của 2:

```java
// Bit field enumeration constants - OBSOLETE!
public class Text {
    public static final int STYLE_BOLD          = 1 << 0;  // 1
    public static final int STYLE_ITALIC        = 1 << 1;  // 2
    public static final int STYLE_UNDERLINE     = 1 << 2;  // 4
    public static final int STYLE_STRIKETHROUGH = 1 << 3;  // 8

    // Parameter is bitwise OR of zero or more STYLE_ constants
    public void applyStyles(int styles) { ... }
}
```

Cách biểu diễn này cho phép bạn dùng phép `OR` theo bit để kết hợp nhiều hằng thành một tập hợp, được gọi là *bit field* (trường bit):

```java
text.applyStyles(STYLE_BOLD | STYLE_ITALIC);
```

Cách biểu diễn bit field cũng cho phép bạn thực hiện các phép toán tập hợp như hợp và giao một cách hiệu quả bằng số học theo bit. Nhưng bit field có mọi nhược điểm của hằng enum `int` và còn hơn thế. Việc diễn giải một bit field khi nó được in ra dưới dạng số còn khó hơn cả một hằng enum `int` đơn giản. Không có cách dễ dàng nào để duyệt qua tất cả các phần tử được biểu diễn bởi một bit field. Cuối cùng, bạn phải dự đoán số bit tối đa mình sẽ cần ngay lúc viết API và chọn kiểu cho bit field (thường là `int` hoặc `long`) cho phù hợp. Một khi đã chọn kiểu, bạn không thể vượt quá độ rộng của nó (32 hoặc 64 bit) mà không thay đổi API.

Một số lập trình viên dùng enum thay cho hằng `int` vẫn bám lấy bit field khi cần truyền đi các tập hợp hằng. Không có lý do gì để làm vậy, vì đã có một giải pháp thay thế tốt hơn. Package `java.util` cung cấp class `EnumSet` để biểu diễn hiệu quả các tập giá trị lấy từ một enum type duy nhất. Class này implement interface `Set`, cung cấp toàn bộ sự phong phú, an toàn kiểu và khả năng tương tác mà bạn có được với bất kỳ cài đặt `Set` nào khác. Nhưng bên trong, mỗi `EnumSet` được biểu diễn dưới dạng một vector bit. Nếu enum type nền có sáu mươi tư phần tử trở xuống—và hầu hết là vậy—toàn bộ `EnumSet` được biểu diễn bằng một `long` duy nhất, nên hiệu năng của nó tương đương với bit field. Các phép toán hàng loạt, như `removeAll` và `retainAll`, được cài đặt bằng số học theo bit, đúng như cách bạn sẽ làm thủ công với bit field. Nhưng bạn được cách ly khỏi sự xấu xí và dễ lỗi của việc thao tác bit thủ công: `EnumSet` làm phần việc nặng nhọc thay bạn.

Đây là ví dụ trước đó khi được sửa lại để dùng enum và enum set thay cho bit field. Nó ngắn hơn, rõ ràng hơn và an toàn hơn:

```java
// EnumSet - a modern replacement for bit fields
public class Text {
    public enum Style { BOLD, ITALIC, UNDERLINE, STRIKETHROUGH }

    // Any Set could be passed in, but EnumSet is clearly best
    public void applyStyles(Set<Style> styles) { ... }
}
```

Đây là mã client truyền một instance `EnumSet` vào method `applyStyles`. Class `EnumSet` cung cấp một bộ static factory phong phú để tạo tập hợp dễ dàng, một trong số đó được minh họa trong đoạn mã này:

```java
text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
```

Lưu ý rằng method `applyStyles` nhận `Set<Style>` thay vì `EnumSet<Style>`. Dù có vẻ như mọi client đều sẽ truyền `EnumSet` vào method này, nhìn chung việc chấp nhận kiểu interface thay vì kiểu cài đặt là thực hành tốt (**Item 64**). Điều này mở ra khả năng cho một client khác thường truyền vào một cài đặt `Set` nào đó khác.

Tóm lại, **chỉ vì một kiểu liệt kê sẽ được dùng trong tập hợp, không có lý do gì để biểu diễn nó bằng bit field.** Class `EnumSet` kết hợp sự ngắn gọn và hiệu năng của bit field với toàn bộ những ưu điểm của enum type được mô tả ở **Item 34**. Nhược điểm thực sự duy nhất của `EnumSet` là, tính đến Java 9, chưa thể tạo một `EnumSet` immutable, nhưng điều này nhiều khả năng sẽ được khắc phục trong một bản phát hành sắp tới. Trong lúc chờ đợi, bạn có thể bọc một `EnumSet` bằng `Collections.unmodifiableSet`, nhưng sự ngắn gọn và hiệu năng sẽ bị ảnh hưởng.

## Item 37: Dùng `EnumMap` thay cho đánh chỉ số bằng ordinal

Đôi khi bạn có thể thấy mã dùng method `ordinal` (**Item 35**) để đánh chỉ số vào một mảng hoặc list. Ví dụ, hãy xét class đơn giản hóa này dùng để biểu diễn một loài cây:

```java
class Plant {
    enum LifeCycle { ANNUAL, PERENNIAL, BIENNIAL }

    final String name;
    final LifeCycle lifeCycle;

    Plant(String name, LifeCycle lifeCycle) {
        this.name = name;
        this.lifeCycle = lifeCycle;
    }

    @Override public String toString() {
        return name;
    }
}
```

Bây giờ giả sử bạn có một mảng các cây biểu diễn một khu vườn, và bạn muốn liệt kê các cây này được sắp xếp theo vòng đời (một năm, lâu năm, hay hai năm). Để làm điều này, bạn tạo ba tập hợp, một cho mỗi vòng đời, rồi duyệt qua khu vườn, đặt mỗi cây vào tập hợp phù hợp. Một số lập trình viên sẽ làm điều này bằng cách đặt các tập hợp vào một mảng được đánh chỉ số bằng ordinal của vòng đời:

```java
// Using ordinal() to index into an array - DON'T DO THIS!
Set<Plant>[] plantsByLifeCycle =
    (Set<Plant>[]) new Set[Plant.LifeCycle.values().length];
for (int i = 0; i < plantsByLifeCycle.length; i++)
    plantsByLifeCycle[i] = new HashSet<>();

for (Plant p : garden)
    plantsByLifeCycle[p.lifeCycle.ordinal()].add(p);

// Print the results
for (int i = 0; i < plantsByLifeCycle.length; i++) {
    System.out.printf("%s: %s%n",
        Plant.LifeCycle.values()[i], plantsByLifeCycle[i]);
}
```

Kỹ thuật này hoạt động, nhưng đầy rẫy vấn đề. Vì mảng không tương thích với generics (**Item 28**), chương trình cần một unchecked cast và sẽ không biên dịch sạch. Vì mảng không biết chỉ số của nó đại diện cho cái gì, bạn phải tự gắn nhãn cho kết quả in ra. Nhưng vấn đề nghiêm trọng nhất của kỹ thuật này là khi bạn truy cập một mảng được đánh chỉ số bằng ordinal của enum, bạn phải tự chịu trách nhiệm dùng đúng giá trị `int`; các giá trị `int` không cung cấp an toàn kiểu như enum. Nếu bạn dùng sai giá trị, chương trình sẽ âm thầm làm sai hoặc—nếu may mắn—ném ra `ArrayIndexOutOfBoundsException`. Có một cách tốt hơn nhiều để đạt được cùng hiệu quả. Mảng ở đây thực chất đang đóng vai trò một map từ enum sang một giá trị, vậy nên bạn cứ dùng `Map` luôn cho rồi. Cụ thể hơn, có một cài đặt `Map` rất nhanh được thiết kế để dùng với khóa enum, gọi là `java.util.EnumMap`. Đây là chương trình khi được viết lại để dùng `EnumMap`:

```java
// Using an EnumMap to associate data with an enum
Map<Plant.LifeCycle, Set<Plant>>  plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);
for (Plant.LifeCycle lc : Plant.LifeCycle.values())
    plantsByLifeCycle.put(lc, new HashSet<>());
for (Plant p : garden)
    plantsByLifeCycle.get(p.lifeCycle).add(p);
System.out.println(plantsByLifeCycle);
```

Chương trình này ngắn hơn, rõ ràng hơn, an toàn hơn, và có tốc độ tương đương với phiên bản ban đầu. Không có ép kiểu không an toàn; không cần tự gắn nhãn kết quả vì các khóa của map là enum vốn biết cách tự chuyển thành chuỗi có thể in ra; và không có khả năng mắc lỗi khi tính chỉ số mảng. Lý do `EnumMap` có tốc độ tương đương với mảng đánh chỉ số bằng ordinal là vì `EnumMap` dùng chính một mảng như vậy bên trong, nhưng nó che giấu chi tiết cài đặt này khỏi lập trình viên, kết hợp sự phong phú và an toàn kiểu của `Map` với tốc độ của mảng. Lưu ý rằng constructor của `EnumMap` nhận đối tượng `Class` của kiểu khóa: đây là một *bounded type token*, cung cấp thông tin kiểu generic lúc chạy (**Item 33**).

Chương trình trên có thể được rút gọn thêm bằng cách dùng stream (**Item 45**) để quản lý map. Đây là đoạn mã dựa trên stream đơn giản nhất, gần như tái hiện hành vi của ví dụ trước:

```java
// Naive stream-based approach - unlikely to produce an EnumMap!
System.out.println(Arrays.stream(garden)
        .collect(groupingBy(p -> p.lifeCycle)));
```

Vấn đề của đoạn mã này là nó tự chọn cài đặt map, và trên thực tế đó sẽ không phải là `EnumMap`, nên nó sẽ không đạt được hiệu năng về không gian và thời gian như phiên bản dùng `EnumMap` tường minh. Để khắc phục vấn đề này, hãy dùng dạng ba tham số của `Collectors.groupingBy`, cho phép bên gọi chỉ định cài đặt map thông qua tham số `mapFactory`:

```java
// Using a stream and an EnumMap to associate data with an enum
System.out.println(Arrays.stream(garden)
        .collect(groupingBy(p -> p.lifeCycle,
            () -> new EnumMap<>(LifeCycle.class), toSet())));
```

Tối ưu hóa này không đáng làm trong một chương trình đồ chơi như thế này, nhưng có thể là then chốt trong một chương trình sử dụng map rất nhiều.

Hành vi của các phiên bản dựa trên stream hơi khác so với phiên bản `EnumMap`. Phiên bản `EnumMap` luôn tạo một map lồng cho mỗi vòng đời cây, trong khi các phiên bản dựa trên stream chỉ tạo map lồng nếu khu vườn có ít nhất một cây thuộc vòng đời đó. Chẳng hạn, nếu khu vườn có cây một năm và cây lâu năm nhưng không có cây hai năm, kích thước của `plantsByLifeCycle` sẽ là ba trong phiên bản `EnumMap` và là hai trong cả hai phiên bản dựa trên stream.

Bạn có thể thấy một mảng của các mảng được đánh chỉ số (hai lần!) bằng ordinal để biểu diễn ánh xạ từ hai giá trị enum. Ví dụ, chương trình này dùng một mảng như vậy để ánh xạ hai pha (phase) sang một chuyển pha (từ lỏng sang rắn là đông đặc, từ lỏng sang khí là sôi, v.v.):

```java
// Using ordinal() to index array of arrays - DON'T DO THIS!
public enum Phase {
    SOLID, LIQUID, GAS;

    public enum Transition {
        MELT, FREEZE, BOIL, CONDENSE, SUBLIME, DEPOSIT;

        // Rows indexed by from-ordinal, cols by to-ordinal
        private static final Transition[][] TRANSITIONS = {
            { null,    MELT,     SUBLIME },
            { FREEZE,  null,     BOIL    },
            { DEPOSIT, CONDENSE, null    }
        };

        // Returns the phase transition from one phase to another
        public static Transition from(Phase from, Phase to) {
            return TRANSITIONS[from.ordinal()][to.ordinal()];
        }
    }
}
```

Chương trình này hoạt động và thậm chí có vẻ thanh lịch, nhưng vẻ ngoài có thể đánh lừa. Giống như ví dụ khu vườn đơn giản hơn ở trên, trình biên dịch không có cách nào biết được mối quan hệ giữa ordinal và chỉ số mảng. Nếu bạn mắc lỗi trong bảng chuyển pha hoặc quên cập nhật nó khi sửa enum type `Phase` hay `Phase.Transition`, chương trình của bạn sẽ thất bại lúc chạy. Lỗi có thể là `ArrayIndexOutOfBoundsException`, `NullPointerException`, hoặc (tệ hơn) hành vi sai một cách âm thầm. Và kích thước của bảng tăng theo bình phương số pha, ngay cả khi số mục khác null nhỏ hơn.

Một lần nữa, bạn có thể làm tốt hơn nhiều với `EnumMap`. Vì mỗi chuyển pha được đánh chỉ số bằng một *cặp* enum pha, tốt nhất là bạn biểu diễn mối quan hệ này dưới dạng một map từ enum thứ nhất (pha “từ”) sang một map từ enum thứ hai (pha “đến”) sang kết quả (chuyển pha). Hai pha gắn với một chuyển pha tốt nhất nên được ghi nhận bằng cách gắn chúng với enum chuyển pha, rồi enum này có thể được dùng để khởi tạo `EnumMap` lồng nhau:

```java
// Using a nested EnumMap to associate data with enum pairs
public enum Phase {
   SOLID, LIQUID, GAS;

   public enum Transition {
      MELT(SOLID, LIQUID), FREEZE(LIQUID, SOLID),
      BOIL(LIQUID, GAS),   CONDENSE(GAS, LIQUID),
      SUBLIME(SOLID, GAS), DEPOSIT(GAS, SOLID);

      private final Phase from;
      private final Phase to;

      Transition(Phase from, Phase to) {
         this.from = from;
         this.to = to;
      }

      // Initialize the phase transition map
      private static final Map<Phase, Map<Phase, Transition>>
        m = Stream.of(values()).collect(groupingBy(t -> t.from,
         () -> new EnumMap<>(Phase.class),
         toMap(t -> t.to, t -> t,
            (x, y) -> y, () -> new EnumMap<>(Phase.class))));

      public static Transition from(Phase from, Phase to) {
         return m.get(from).get(to);
      }
   }
}
```

Đoạn mã khởi tạo map chuyển pha hơi phức tạp. Kiểu của map là `Map<Phase, Map<Phase, Transition>>`, nghĩa là “map từ pha (nguồn) sang map từ pha (đích) sang chuyển pha.” Map-của-map này được khởi tạo bằng một chuỗi hai collector nối tiếp nhau. Collector thứ nhất nhóm các chuyển pha theo pha nguồn, và collector thứ hai tạo một `EnumMap` với các ánh xạ từ pha đích sang chuyển pha. Merge function trong collector thứ hai (`(x, y) -> y)`) không được dùng; nó chỉ bắt buộc phải có vì chúng ta cần chỉ định một map factory để có được `EnumMap`, mà `Collectors` lại cung cấp các factory theo kiểu telescoping (mở rộng dần). Ấn bản trước của cuốn sách này dùng vòng lặp tường minh để khởi tạo map chuyển pha. Mã dài dòng hơn nhưng có lẽ dễ hiểu hơn.

Bây giờ giả sử bạn muốn thêm một pha mới vào hệ thống: *plasma*, hay khí ion hóa. Chỉ có hai chuyển pha gắn với pha này: *ion hóa*, chuyển khí thành plasma; và *khử ion*, chuyển plasma thành khí. Để cập nhật chương trình dựa trên mảng, bạn sẽ phải thêm một hằng mới vào `Phase` và hai hằng vào `Phase.Transition`, rồi thay mảng của các mảng chín phần tử ban đầu bằng một phiên bản mười sáu phần tử mới. Nếu bạn thêm quá nhiều hay quá ít phần tử vào mảng, hoặc đặt sai thứ tự một phần tử, bạn hết đường: chương trình sẽ biên dịch được, nhưng sẽ thất bại lúc chạy. Để cập nhật phiên bản dựa trên `EnumMap`, tất cả những gì bạn phải làm là thêm `PLASMA` vào danh sách các pha, và thêm `IONIZE(GAS, PLASMA)` cùng `DEIONIZE(PLASMA, GAS)` vào danh sách các chuyển pha:

```java
// Adding a new phase using the nested EnumMap implementation
public enum Phase {
    SOLID, LIQUID, GAS, PLASMA;

    public enum Transition {
        MELT(SOLID, LIQUID), FREEZE(LIQUID, SOLID),
        BOIL(LIQUID, GAS),   CONDENSE(GAS, LIQUID),
        SUBLIME(SOLID, GAS), DEPOSIT(GAS, SOLID),
        IONIZE(GAS, PLASMA), DEIONIZE(PLASMA, GAS);
        ... // Remainder unchanged
    }
}
```

Chương trình lo liệu mọi thứ còn lại và hầu như không để lại cơ hội nào cho bạn mắc lỗi. Bên trong, map của các map được cài đặt bằng một mảng của các mảng, nên bạn phải trả rất ít chi phí về không gian hay thời gian cho sự rõ ràng, an toàn và dễ bảo trì có thêm.

Vì mục đích ngắn gọn, các ví dụ trên dùng `null` để chỉ việc không có thay đổi trạng thái (khi `to` và `from` giống nhau). Đây không phải là thực hành tốt và có khả năng dẫn đến `NullPointerException` lúc chạy. Thiết kế một giải pháp sạch sẽ, thanh lịch cho vấn đề này khó đến bất ngờ, và các chương trình kết quả đủ dài để làm lu mờ nội dung chính của item này.

Tóm lại, **hiếm khi thích hợp để dùng ordinal đánh chỉ số vào mảng: hãy dùng** `EnumMap` **thay thế.** Nếu mối quan hệ bạn đang biểu diễn là đa chiều, hãy dùng `EnumMap<..., EnumMap<...>>`. Đây là một trường hợp đặc biệt của nguyên tắc chung rằng lập trình viên ứng dụng hiếm khi, nếu không muốn nói là không bao giờ, nên dùng `Enum.ordinal` (**Item 35**).

## Item 38: Mô phỏng enum có thể mở rộng bằng interface

Về hầu hết mọi mặt, enum type vượt trội so với mẫu typesafe enum được mô tả trong ấn bản đầu tiên của cuốn sách này [**Bloch01**]. Nhìn bề ngoài, có một ngoại lệ liên quan đến khả năng mở rộng, vốn khả thi với mẫu ban đầu nhưng không được cấu trúc ngôn ngữ hỗ trợ. Nói cách khác, với mẫu đó, một kiểu liệt kê có thể kế thừa một kiểu liệt kê khác; với tính năng ngôn ngữ, điều đó là không thể. Đây không phải là ngẫu nhiên. Trong phần lớn trường hợp, khả năng mở rộng của enum hóa ra là một ý tưởng tồi. Sẽ gây nhầm lẫn khi các phần tử của kiểu mở rộng là instance của kiểu cơ sở nhưng điều ngược lại thì không. Không có cách tốt nào để liệt kê tất cả các phần tử của kiểu cơ sở và các phần mở rộng của nó. Cuối cùng, khả năng mở rộng sẽ làm phức tạp nhiều khía cạnh của thiết kế và cài đặt.

Dẫu vậy, có ít nhất một trường hợp sử dụng thuyết phục cho kiểu liệt kê có thể mở rộng, đó là *operation code* (mã phép toán), còn gọi là *opcode*. Opcode là một kiểu liệt kê mà các phần tử của nó biểu diễn các phép toán trên một máy nào đó, chẳng hạn kiểu `Operation` ở **Item 34**, biểu diễn các chức năng của một máy tính đơn giản. Đôi khi việc cho phép người dùng của một API cung cấp phép toán riêng của họ, qua đó mở rộng tập phép toán mà API cung cấp, là điều đáng mong muốn.

May thay, có một cách hay để đạt được hiệu quả này bằng enum type. Ý tưởng cơ bản là tận dụng việc enum type có thể implement interface tùy ý, bằng cách định nghĩa một interface cho kiểu opcode và một enum là cài đặt chuẩn của interface đó. Ví dụ, đây là phiên bản có thể mở rộng của kiểu `Operation` ở **Item 34**:

```java
// Emulated extensible enum using an interface
public interface Operation {
    double apply(double x, double y);
}

public enum BasicOperation implements Operation {
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

    BasicOperation(String symbol) {
        this.symbol = symbol;
    }

    @Override public String toString() {
        return symbol;
    }
}
```

Dù enum type (`BasicOperation`) không thể mở rộng, interface type (`Operation`) thì có thể, và chính interface type mới là thứ được dùng để biểu diễn phép toán trong các API. Bạn có thể định nghĩa một enum type khác implement interface này và dùng các instance của kiểu mới đó thay cho kiểu cơ sở. Ví dụ, giả sử bạn muốn định nghĩa một phần mở rộng cho kiểu phép toán ở trên, gồm phép lũy thừa và phép chia lấy dư. Tất cả những gì bạn phải làm là viết một enum type implement interface `Operation`:

```java
// Emulated extension enum
public enum ExtendedOperation implements Operation {
    EXP("^") {
        public double apply(double x, double y) {
            return Math.pow(x, y);
        }
    },
    REMAINDER("%") {
        public double apply(double x, double y) {
            return x % y;
        }
    };
    private final String symbol;

    ExtendedOperation(String symbol) {
        this.symbol = symbol;
    }

    @Override public String toString() {
        return symbol;
    }
}
```

Giờ đây bạn có thể dùng các phép toán mới ở bất kỳ đâu bạn có thể dùng các phép toán cơ bản, miễn là các API được viết để nhận interface type (`Operation`), chứ không phải cài đặt (`BasicOperation`). Lưu ý rằng bạn không cần khai báo method abstract `apply` trong enum như khi làm với một enum không thể mở rộng có instance-specific method implementation (trang 162). Đó là vì method abstract (`apply`) là một thành viên của interface (`Operation`).

Không những có thể truyền một instance đơn lẻ của “extension enum” (enum mở rộng) vào bất kỳ đâu mong đợi một “base enum” (enum cơ sở), mà còn có thể truyền vào cả một extension enum type và dùng các phần tử của nó bên cạnh hoặc thay cho các phần tử của kiểu cơ sở. Ví dụ, đây là một phiên bản của chương trình kiểm thử ở trang 163, thực thi tất cả các phép toán mở rộng đã định nghĩa ở trên:

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    test(ExtendedOperation.class, x, y);
}

private static <T extends Enum<T> & Operation> void test(
        Class<T> opEnumType, double x, double y) {
    for (Operation op : opEnumType.getEnumConstants())
        System.out.printf("%f %s %f = %f%n",
                          x, op, y, op.apply(x, y));
}
```

Lưu ý rằng class literal của kiểu phép toán mở rộng (`ExtendedOperation.class`) được truyền từ `main` sang `test` để mô tả tập các phép toán mở rộng. Class literal này đóng vai trò một *bounded type token* (**Item 33**). Khai báo phải thừa nhận là phức tạp của tham số `opEnumType` (`<T extends Enum<T> & Operation> Class<T>`) đảm bảo rằng đối tượng `Class` biểu diễn vừa một enum vừa một subtype của `Operation`, đúng là điều cần thiết để duyệt qua các phần tử và thực hiện phép toán gắn với từng phần tử.

Một lựa chọn thứ hai là truyền vào một `Collection<? extends Operation>`, tức một *bounded wildcard type* (**Item 31**), thay vì truyền một đối tượng class:

```java
public static void main(String[] args) {
    double x = Double.parseDouble(args[0]);
    double y = Double.parseDouble(args[1]);
    test(Arrays.asList(ExtendedOperation.values()), x, y);
}

private static void test(Collection<? extends Operation> opSet,
        double x, double y) {
    for (Operation op : opSet)
        System.out.printf("%f %s %f = %f%n",
                          x, op, y, op.apply(x, y));
}
```

Mã kết quả bớt phức tạp hơn một chút, và method `test` linh hoạt hơn một chút: nó cho phép bên gọi kết hợp các phép toán từ nhiều kiểu cài đặt khác nhau. Mặt khác, bạn từ bỏ khả năng dùng `EnumSet` (**Item 36**) và `EnumMap` (**Item 37**) trên các phép toán được chỉ định.

Cả hai chương trình ở trên sẽ cho ra kết quả sau khi chạy với đối số dòng lệnh `4` và `2`:

```java
4.000000 ^ 2.000000 = 16.000000
4.000000 % 2.000000 = 0.000000
```

Một nhược điểm nhỏ của việc dùng interface để mô phỏng enum có thể mở rộng là các cài đặt không thể được kế thừa từ enum type này sang enum type khác. Nếu mã cài đặt không phụ thuộc vào trạng thái nào, nó có thể được đặt trong interface, bằng default implementation (**Item 20**). Trong trường hợp ví dụ `Operation` của chúng ta, logic để lưu và lấy ký hiệu gắn với một phép toán phải được lặp lại trong `BasicOperation` và `ExtendedOperation`. Trong trường hợp này điều đó không quan trọng vì lượng mã bị lặp rất ít. Nếu có một lượng lớn chức năng dùng chung, bạn có thể đóng gói nó trong một helper class hoặc một static helper method để loại bỏ sự trùng lặp mã.

Mẫu được mô tả trong item này được dùng trong các thư viện Java. Ví dụ, enum type `java.nio.file.LinkOption` implement các interface `CopyOption` và `OpenOption`.

Tóm lại, **dù bạn không thể viết một enum type có thể mở rộng, bạn có thể mô phỏng nó bằng cách viết một interface đi kèm với một enum type cơ bản implement interface đó.** Điều này cho phép client viết enum (hoặc kiểu khác) của riêng họ implement interface. Instance của các kiểu này sau đó có thể được dùng ở bất kỳ đâu instance của enum type cơ bản có thể dùng, với giả định các API được viết dựa trên interface.

## Item 39: Ưu tiên annotation hơn naming pattern

Trong lịch sử, việc dùng *naming pattern* (mẫu đặt tên) để chỉ ra rằng một số phần tử chương trình cần được một công cụ hay framework xử lý đặc biệt là khá phổ biến. Ví dụ, trước phiên bản 4, framework kiểm thử JUnit yêu cầu người dùng đánh dấu các method kiểm thử bằng cách bắt đầu tên của chúng bằng các ký tự `test` [**Beck04**]. Kỹ thuật này hoạt động, nhưng có vài nhược điểm lớn. Thứ nhất, lỗi đánh máy dẫn đến thất bại âm thầm. Ví dụ, giả sử bạn vô tình đặt tên một method kiểm thử là `tsetSafetyOverride` thay vì `testSafetyOverride`. JUnit 3 sẽ không phàn nàn, nhưng cũng sẽ không thực thi bài kiểm thử, dẫn đến cảm giác an toàn giả tạo.

Nhược điểm thứ hai của naming pattern là không có cách nào đảm bảo chúng chỉ được dùng trên các phần tử chương trình phù hợp. Ví dụ, giả sử bạn đặt tên một class là `TestSafetyMechanisms` với hy vọng JUnit 3 sẽ tự động kiểm thử tất cả các method của nó, bất kể tên của chúng. Một lần nữa, JUnit 3 sẽ không phàn nàn, nhưng cũng sẽ không thực thi các bài kiểm thử.

Nhược điểm thứ ba của naming pattern là chúng không cung cấp cách nào tốt để gắn giá trị tham số với các phần tử chương trình. Ví dụ, giả sử bạn muốn hỗ trợ một loại kiểm thử chỉ thành công nếu nó ném ra một exception cụ thể. Kiểu exception về bản chất là một tham số của bài kiểm thử. Bạn có thể mã hóa tên kiểu exception vào tên method kiểm thử bằng một naming pattern cầu kỳ nào đó, nhưng cách này xấu xí và mong manh (**Item 62**). Trình biên dịch sẽ không có cách nào biết để kiểm tra rằng chuỗi được cho là tên của một exception thực sự là như vậy. Nếu class được đặt tên không tồn tại hoặc không phải là exception, bạn sẽ không phát hiện ra cho đến khi cố chạy bài kiểm thử.

Annotation [JLS, 9.7] giải quyết gọn gàng tất cả các vấn đề này, và JUnit đã áp dụng chúng từ phiên bản 4. Trong item này, chúng ta sẽ viết một framework kiểm thử đồ chơi của riêng mình để cho thấy annotation hoạt động thế nào. Giả sử bạn muốn định nghĩa một annotation type để đánh dấu các bài kiểm thử đơn giản, được chạy tự động và thất bại nếu chúng ném ra exception. Đây là hình dạng của một annotation type như vậy, tên là `Test`:

```java
// Marker annotation type declaration
import java.lang.annotation.*;

/**
 * Indicates that the annotated method is a test method.
 * Use only on parameterless static methods.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
}
```

Bản thân khai báo của annotation type `Test` được chú thích bằng các annotation `Retention` và `Target`. Các annotation như vậy trên khai báo annotation type được gọi là *meta-annotation*. Meta-annotation `@Retention(RetentionPolicy.RUNTIME)` cho biết các annotation `Test` phải được giữ lại lúc chạy. Không có nó, các annotation `Test` sẽ vô hình với công cụ kiểm thử. Meta-annotation `@Target(ElementType.METHOD)` cho biết annotation `Test` chỉ hợp lệ trên khai báo method: nó không thể được áp dụng cho khai báo class, khai báo field, hay các phần tử chương trình khác.

Chú thích phía trước khai báo annotation `Test` nói rằng, “Use only on parameterless static methods” (Chỉ dùng trên các static method không có tham số). Sẽ rất hay nếu trình biên dịch có thể ép buộc điều này, nhưng nó không thể, trừ khi bạn viết một *annotation processor* (bộ xử lý annotation) để làm việc đó. Để biết thêm về chủ đề này, hãy xem tài liệu của `javax.annotation.processing`. Khi không có annotation processor như vậy, nếu bạn đặt annotation `Test` lên khai báo của một instance method hay một method có một hoặc nhiều tham số, chương trình kiểm thử vẫn sẽ biên dịch được, và để mặc cho công cụ kiểm thử xử lý vấn đề lúc chạy.

Đây là cách annotation `Test` trông như thế nào trong thực tế. Nó được gọi là *marker annotation* (annotation đánh dấu) vì nó không có tham số mà chỉ đơn giản “đánh dấu” phần tử được chú thích. Nếu lập trình viên viết sai chính tả `Test` hoặc áp dụng annotation `Test` lên một phần tử chương trình không phải khai báo method, chương trình sẽ không biên dịch được:

```java
// Program containing marker annotations
public class Sample {
    @Test public static void m1() { }  // Test should pass
    public static void m2() { }
    @Test public static void m3() {     // Test should fail
        throw new RuntimeException("Boom");
    }
    public static void m4() { }
    @Test public void m5() { } // INVALID USE: nonstatic method
    public static void m6() { }
    @Test public static void m7() {    // Test should fail
        throw new RuntimeException("Crash");
    }
    public static void m8() { }
}
```

Class `Sample` có bảy static method, bốn trong số đó được chú thích là bài kiểm thử. Hai trong số này, `m3` và `m7`, ném ra exception, và hai method, `m1` và `m5`, thì không. Nhưng một trong các method được chú thích mà không ném exception, `m5`, là một instance method, nên đó không phải là cách dùng hợp lệ của annotation. Tóm lại, `Sample` chứa bốn bài kiểm thử: một sẽ đạt, hai sẽ thất bại, và một không hợp lệ. Bốn method không được chú thích bằng annotation `Test` sẽ bị công cụ kiểm thử bỏ qua.

Các annotation `Test` không có tác động trực tiếp nào lên ngữ nghĩa của class `Sample`. Chúng chỉ nhằm cung cấp thông tin cho các chương trình quan tâm sử dụng. Tổng quát hơn, annotation không thay đổi ngữ nghĩa của mã được chú thích mà cho phép mã đó được xử lý đặc biệt bởi các công cụ như bộ chạy kiểm thử đơn giản này:

```java
// Program to process marker annotations
import java.lang.reflect.*;

public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) {
            if (m.isAnnotationPresent(Test.class)) {
                tests++;
                try {
                    m.invoke(null);
                    passed++;
                } catch (InvocationTargetException wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    System.out.println(m + " failed: " + exc);
                } catch (Exception exc) {
                    System.out.println("Invalid @Test: " + m);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n",
                          passed, tests - passed);
    }
}
```

Công cụ chạy kiểm thử nhận một tên class đầy đủ (fully qualified) trên dòng lệnh và chạy tất cả các method được chú thích `Test` của class đó bằng reflection, thông qua việc gọi `Method.invoke`. Method `isAnnotationPresent` cho công cụ biết cần chạy method nào. Nếu một method kiểm thử ném ra exception, cơ chế reflection sẽ bọc nó trong một `InvocationTargetException`. Công cụ bắt exception này và in ra báo cáo thất bại chứa exception gốc do method kiểm thử ném ra, được lấy ra từ `InvocationTargetException` bằng method `getCause`.

Nếu việc cố gọi một method kiểm thử bằng reflection ném ra bất kỳ exception nào khác ngoài `InvocationTargetException`, điều đó cho thấy một cách dùng không hợp lệ của annotation `Test` đã không bị bắt lúc biên dịch. Những cách dùng như vậy bao gồm chú thích một instance method, một method có một hoặc nhiều tham số, hoặc một method không thể truy cập. Khối catch thứ hai trong bộ chạy kiểm thử bắt các lỗi sử dụng `Test` này và in ra thông báo lỗi phù hợp. Đây là kết quả được in ra nếu chạy `RunTests` trên `Sample`:

```java
public static void Sample.m3() failed: RuntimeException: Boom
Invalid @Test: public void Sample.m5()
public static void Sample.m7() failed: RuntimeException: Crash
Passed: 1, Failed: 3
```

Bây giờ hãy thêm hỗ trợ cho các bài kiểm thử chỉ thành công nếu chúng ném ra một exception cụ thể. Chúng ta sẽ cần một annotation type mới cho việc này:

```java
// Annotation type with a parameter
import java.lang.annotation.*;
/**
 * Indicates that the annotated method is a test method that
 * must throw the designated exception to succeed.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}
```

Kiểu của tham số cho annotation này là `Class<? extends Throwable>`. Phải thừa nhận rằng wildcard type này khá rườm rà. Diễn đạt bằng lời, nó có nghĩa là “đối tượng `Class` của một class nào đó kế thừa `Throwable`,” và nó cho phép người dùng annotation chỉ định bất kỳ kiểu exception (hoặc error) nào. Cách dùng này là một ví dụ về *bounded type token* (**Item 33**). Đây là cách annotation trông như thế nào trong thực tế. Lưu ý rằng class literal được dùng làm giá trị cho tham số của annotation:

```java
// Program containing annotations with a parameter
public class Sample2 {
    @ExceptionTest(ArithmeticException.class)
    public static void m1() {  // Test should pass
        int i = 0;
        i = i / i;
    }
    @ExceptionTest(ArithmeticException.class)
    public static void m2() {  // Should fail (wrong exception)
        int[] a = new int[0];
        int i = a[1];
    }
    @ExceptionTest(ArithmeticException.class)
    public static void m3() { }  // Should fail (no exception)
}
```

Bây giờ hãy sửa công cụ chạy kiểm thử để xử lý annotation mới. Việc này gồm thêm đoạn mã sau vào method `main`:

```java
if (m.isAnnotationPresent(ExceptionTest.class)) {
    tests++;
    try {
        m.invoke(null);
        System.out.printf("Test %s failed: no exception%n", m);
    } catch (InvocationTargetException wrappedEx) {
        Throwable exc = wrappedEx.getCause();
        Class<? extends Throwable> excType =
            m.getAnnotation(ExceptionTest.class).value();
        if (excType.isInstance(exc)) {
            passed++;
        } else {
            System.out.printf(
                "Test %s failed: expected %s, got %s%n",
                m, excType.getName(), exc);
        }
    } catch (Exception exc) {
        System.out.println("Invalid @ExceptionTest: " + m);
    }
}
```

Đoạn mã này tương tự đoạn mã chúng ta dùng để xử lý annotation `Test`, với một khác biệt: đoạn mã này lấy ra giá trị của tham số annotation và dùng nó để kiểm tra xem exception do bài kiểm thử ném ra có đúng kiểu hay không. Không có ép kiểu tường minh nào, do đó không có nguy cơ `ClassCastException`. Việc chương trình kiểm thử biên dịch được đảm bảo rằng các tham số annotation của nó biểu diễn các kiểu exception hợp lệ, với một lưu ý: nếu các tham số annotation hợp lệ lúc biên dịch nhưng file class biểu diễn một kiểu exception được chỉ định không còn tồn tại lúc chạy, bộ chạy kiểm thử sẽ ném ra `TypeNotPresentException`.

Đẩy ví dụ kiểm thử exception của chúng ta đi thêm một bước, có thể hình dung một bài kiểm thử đạt nếu nó ném ra bất kỳ exception nào trong số vài exception được chỉ định. Cơ chế annotation có một tiện ích giúp hỗ trợ cách dùng này dễ dàng. Giả sử chúng ta đổi kiểu tham số của annotation `ExceptionTest` thành một mảng các đối tượng `Class`:

```java
// Annotation type with an array parameter
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
    Class<? extends Throwable>[] value();
}
```

Cú pháp cho tham số mảng trong annotation rất linh hoạt. Nó được tối ưu cho mảng một phần tử. Tất cả các annotation `ExceptionTest` trước đó vẫn hợp lệ với phiên bản tham số mảng mới của `ExceptionTest` và cho ra mảng một phần tử. Để chỉ định mảng nhiều phần tử, hãy bao các phần tử trong dấu ngoặc nhọn và phân cách chúng bằng dấu phẩy:

```java
// Code containing an annotation with an array parameter
@ExceptionTest({ IndexOutOfBoundsException.class,
                 NullPointerException.class })
public static void doublyBad() {
    List<String> list = new ArrayList<>();

    // The spec permits this method to throw either
    // IndexOutOfBoundsException or NullPointerException
    list.addAll(5, null);
}
```

Việc sửa công cụ chạy kiểm thử để xử lý phiên bản mới của `ExceptionTest` khá đơn giản. Đoạn mã này thay thế phiên bản ban đầu:

```java
if (m.isAnnotationPresent(ExceptionTest.class)) {
    tests++;
    try {
        m.invoke(null);
        System.out.printf("Test %s failed: no exception%n", m);
    } catch (Throwable wrappedExc) {
        Throwable exc = wrappedExc.getCause();
        int oldPassed = passed;
        Class<? extends Throwable>[] excTypes =
            m.getAnnotation(ExceptionTest.class).value();
        for (Class<? extends Exception> excType : excTypes) {
            if (excType.isInstance(exc)) {
                passed++;
                break;
            }
        }
        if (passed == oldPassed)
            System.out.printf("Test %s failed: %s %n", m, exc);
    }
}
```

Kể từ Java 8, có một cách khác để làm annotation đa giá trị. Thay vì khai báo một annotation type với tham số mảng, bạn có thể chú thích khai báo của annotation bằng meta-annotation `@Repeatable`, để chỉ ra rằng annotation đó có thể được áp dụng lặp lại nhiều lần lên một phần tử duy nhất. Meta-annotation này nhận một tham số duy nhất, là đối tượng class của một *containing annotation type* (annotation type chứa), mà tham số duy nhất của nó là một mảng của annotation type kia [JLS, 9.6.3]. Đây là hình dạng các khai báo annotation nếu chúng ta áp dụng cách này với annotation `ExceptionTest`. Lưu ý rằng containing annotation type phải được chú thích bằng retention policy và target phù hợp, nếu không các khai báo sẽ không biên dịch được:

```java
// Repeatable annotation type
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(ExceptionTestContainer.class)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTestContainer {
    ExceptionTest[] value();
}
```

Đây là bài kiểm thử `doublyBad` của chúng ta với annotation lặp lại thay cho annotation có giá trị mảng:

```java
// Code containing a repeated annotation
@ExceptionTest(IndexOutOfBoundsException.class)
@ExceptionTest(NullPointerException.class)
public static void doublyBad() { ... }
```

Xử lý repeatable annotation đòi hỏi sự cẩn thận. Một annotation lặp lại sẽ sinh ra một annotation tổng hợp (synthetic) thuộc containing annotation type. Method `getAnnotationsByType` che đi thực tế này, và có thể được dùng để truy cập cả annotation lặp lại lẫn không lặp lại của một repeatable annotation type. Nhưng `isAnnotationPresent` làm rõ rằng các annotation lặp lại không thuộc annotation type gốc, mà thuộc containing annotation type. Nếu một phần tử có annotation lặp lại của một kiểu nào đó và bạn dùng method `isAnnotationPresent` để kiểm tra xem phần tử đó có annotation thuộc kiểu đó không, bạn sẽ thấy là không. Do đó, dùng method này để kiểm tra sự hiện diện của một annotation type sẽ khiến chương trình của bạn âm thầm bỏ qua các annotation lặp lại. Tương tự, dùng method này để kiểm tra containing annotation type sẽ khiến chương trình âm thầm bỏ qua các annotation không lặp lại. Để phát hiện cả annotation lặp lại lẫn không lặp lại bằng `isAnnotationPresent`, bạn phải kiểm tra cả annotation type lẫn containing annotation type của nó. Đây là phần liên quan trong chương trình `RunTests` của chúng ta khi được sửa để dùng phiên bản repeatable của annotation `ExceptionTest`:

```java
// Processing repeatable annotations
if (m.isAnnotationPresent(ExceptionTest.class)
    || m.isAnnotationPresent(ExceptionTestContainer.class)) {
    tests++;
    try {
        m.invoke(null);
        System.out.printf("Test %s failed: no exception%n", m);
    } catch (Throwable wrappedExc) {
        Throwable exc = wrappedExc.getCause();
        int oldPassed = passed;
        ExceptionTest[] excTests =
                m.getAnnotationsByType(ExceptionTest.class);
        for (ExceptionTest excTest : excTests) {
            if (excTest.value().isInstance(exc)) {
                passed++;
                break;
            }
        }
        if (passed == oldPassed)
            System.out.printf("Test %s failed: %s %n", m, exc);
    }
}
```

Repeatable annotation được thêm vào để cải thiện tính dễ đọc của mã nguồn mà về mặt logic áp dụng nhiều instance của cùng một annotation type lên một phần tử chương trình nhất định. Nếu bạn cảm thấy chúng làm mã nguồn của bạn dễ đọc hơn, hãy dùng chúng, nhưng hãy nhớ rằng có nhiều boilerplate hơn khi khai báo và xử lý repeatable annotation, và việc xử lý repeatable annotation dễ mắc lỗi.

Framework kiểm thử trong item này chỉ là đồ chơi, nhưng nó cho thấy rõ sự vượt trội của annotation so với naming pattern, và nó mới chỉ chạm đến bề mặt của những gì bạn có thể làm với annotation. Nếu bạn viết một công cụ đòi hỏi lập trình viên thêm thông tin vào mã nguồn, hãy định nghĩa các annotation type phù hợp. **Đơn giản là không có lý do gì để dùng naming pattern khi bạn có thể dùng annotation thay thế.**

Dẫu vậy, ngoại trừ những người viết công cụ, hầu hết lập trình viên sẽ không cần định nghĩa annotation type. Nhưng **mọi lập trình viên đều nên dùng các annotation type định nghĩa sẵn mà Java cung cấp** (**Item 40**, **27**). Ngoài ra, hãy cân nhắc dùng các annotation do IDE hoặc công cụ phân tích tĩnh của bạn cung cấp. Những annotation như vậy có thể cải thiện chất lượng thông tin chẩn đoán mà các công cụ này đưa ra. Tuy nhiên, lưu ý rằng các annotation này chưa được chuẩn hóa, nên bạn có thể phải tốn chút công sức nếu đổi công cụ hoặc nếu một chuẩn xuất hiện.

## Item 40: Luôn dùng annotation `Override` một cách nhất quán

Các thư viện Java chứa một số annotation type. Với lập trình viên thông thường, annotation quan trọng nhất trong số đó là `@Override`. Annotation này chỉ có thể dùng trên khai báo method, và nó cho biết khai báo method được chú thích override một khai báo ở supertype. Nếu bạn dùng annotation này một cách nhất quán, nó sẽ bảo vệ bạn khỏi một lớp lớn các bug tai hại. Hãy xét chương trình này, trong đó class `Bigram` biểu diễn một *bigram*, tức cặp chữ cái có thứ tự:

```java
// Can you spot the bug?
public class Bigram {
    private final char first;
    private final char second;

    public Bigram(char first, char second) {
        this.first  = first;
        this.second = second;
    }
    public boolean equals(Bigram b) {
        return b.first == first && b.second == second;
    }
    public int hashCode() {
        return 31 * first + second;
    }

    public static void main(String[] args) {
        Set<Bigram> s = new HashSet<>();
        for (int i = 0; i < 10; i++)
            for (char ch = 'a'; ch <= 'z'; ch++)
                s.add(new Bigram(ch, ch));
        System.out.println(s.size());
    }
}
```

Chương trình chính thêm lặp đi lặp lại hai mươi sáu bigram, mỗi bigram gồm hai chữ cái thường giống nhau, vào một set. Sau đó nó in ra kích thước của set. Bạn có thể mong đợi chương trình in ra `26`, vì set không thể chứa phần tử trùng lặp. Nếu bạn thử chạy chương trình, bạn sẽ thấy nó in ra không phải `26` mà là `260`. Có gì sai với nó?

Rõ ràng, tác giả của class `Bigram` có ý định override method `equals` (**Item 10**) và thậm chí còn nhớ override `hashCode` đi kèm (**Item 11**). Không may, lập trình viên bất hạnh của chúng ta đã không override được `equals` mà lại overload nó (**Item 52**). Để override `Object.equals`, bạn phải định nghĩa một method `equals` có tham số kiểu `Object`, nhưng tham số của method `equals` trong `Bigram` không phải kiểu `Object`, nên `Bigram` kế thừa method `equals` từ `Object`. Method `equals` này kiểm tra *định danh* (identity) của đối tượng, giống hệt toán tử `==`. Mỗi bản trong mười bản sao của mỗi bigram đều khác biệt với chín bản còn lại, nên chúng bị `Object.equals` coi là không bằng nhau, điều này giải thích tại sao chương trình in ra `260`.

May thay, trình biên dịch có thể giúp bạn tìm ra lỗi này, nhưng chỉ khi bạn giúp nó bằng cách nói cho nó biết bạn có ý định override `Object.equals`. Để làm vậy, hãy chú thích `Bigram.equals` bằng `@Override`, như sau:

```java
@Override public boolean equals(Bigram b) {
    return b.first == first && b.second == second;
}
```

Nếu bạn chèn annotation này vào và thử biên dịch lại chương trình, trình biên dịch sẽ sinh ra thông báo lỗi như thế này:

```java
Bigram.java:10: method does not override or implement a method
from a supertype
    @Override public boolean equals(Bigram b) {
    ^
```

Bạn sẽ lập tức nhận ra mình đã làm sai điều gì, vỗ trán, và thay cài đặt `equals` hỏng bằng một cài đặt đúng (**Item 10**):

```java
@Override public boolean equals(Object o) {
    if (!(o instanceof Bigram))
        return false;
    Bigram b = (Bigram) o;
    return b.first == first && b.second == second;
}
```

Do đó, bạn nên **dùng annotation** `Override` **trên mọi khai báo method mà bạn tin là override một khai báo ở superclass.** Có một ngoại lệ nhỏ cho quy tắc này. Nếu bạn đang viết một class không được đánh dấu abstract và bạn tin rằng nó override một method abstract ở superclass, bạn không cần bận tâm đặt annotation `Override` lên method đó. Trong một class không được khai báo abstract, trình biên dịch sẽ phát ra thông báo lỗi nếu bạn không override một method abstract của superclass. Tuy nhiên, bạn có thể muốn thu hút sự chú ý đến tất cả các method trong class của mình override method của superclass, trong trường hợp đó bạn cứ thoải mái chú thích cả những method này. Hầu hết IDE có thể được cấu hình để tự động chèn annotation `Override` khi bạn chọn override một method.

Hầu hết IDE còn cung cấp một lý do khác để dùng annotation `Override` một cách nhất quán. Nếu bạn bật kiểm tra thích hợp, IDE sẽ sinh cảnh báo nếu bạn có một method không có annotation `Override` nhưng lại override một method của superclass. Nếu bạn dùng annotation `Override` nhất quán, các cảnh báo này sẽ báo cho bạn về việc override ngoài ý muốn. Chúng bổ sung cho các thông báo lỗi của trình biên dịch, vốn báo cho bạn về việc không override được ngoài ý muốn. Giữa IDE và trình biên dịch, bạn có thể chắc chắn rằng mình override method ở mọi nơi mình muốn và không ở đâu khác.

Annotation `Override` có thể được dùng trên các khai báo method override khai báo từ interface cũng như từ class. Với sự xuất hiện của default method, việc dùng `Override` trên các cài đặt cụ thể của method interface để đảm bảo signature là đúng là thực hành tốt. Nếu bạn biết một interface không có default method, bạn có thể chọn bỏ annotation `Override` trên các cài đặt cụ thể của method interface để giảm sự rườm rà.

Tuy nhiên, trong một abstract class hoặc một interface, việc chú thích *tất cả* các method mà bạn tin là override method của superclass hay superinterface, dù cụ thể hay abstract, *là* đáng làm. Ví dụ, interface `Set` không thêm method mới nào vào interface `Collection`, nên nó nên có annotation `Override` trên tất cả các khai báo method của mình để đảm bảo nó không vô tình thêm method mới nào vào interface `Collection`.

Tóm lại, trình biên dịch có thể bảo vệ bạn khỏi rất nhiều lỗi nếu bạn dùng annotation `Override` trên mọi khai báo method mà bạn tin là override một khai báo ở supertype, với một ngoại lệ. Trong các class cụ thể, bạn không cần chú thích các method mà bạn tin là override các khai báo method abstract (dù làm vậy cũng không có hại).

## Item 41: Dùng marker interface để định nghĩa kiểu

Một *marker interface* (interface đánh dấu) là interface không chứa khai báo method nào mà chỉ đơn thuần chỉ định (hay “đánh dấu”) rằng một class implement interface đó có một tính chất nào đó. Ví dụ, hãy xét interface `Serializable` (**Chương 12**). Bằng cách implement interface này, một class cho biết các instance của nó có thể được ghi vào một `ObjectOutputStream` (hay được “serialize”).

Bạn có thể nghe nói rằng marker annotation (**Item 39**) khiến marker interface trở nên lỗi thời. Khẳng định này không đúng. Marker interface có hai ưu điểm so với marker annotation. Đầu tiên và quan trọng nhất, **marker interface định nghĩa một kiểu được các instance của class được đánh dấu implement; marker annotation thì không.** Sự tồn tại của kiểu marker interface cho phép bạn bắt lỗi lúc biên dịch mà bạn sẽ không thể bắt được cho đến lúc chạy nếu dùng marker annotation.

Cơ chế serialization của Java (**Chương 12**) dùng marker interface `Serializable` để chỉ ra rằng một kiểu là serializable. Method `ObjectOutputStream.writeObject`, vốn serialize đối tượng được truyền vào nó, yêu cầu đối số của nó phải serializable. Nếu đối số của method này có kiểu `Serializable`, việc cố serialize một đối tượng không phù hợp sẽ được phát hiện lúc biên dịch (nhờ kiểm tra kiểu). Phát hiện lỗi lúc biên dịch chính là mục đích của marker interface, nhưng không may, API `ObjectOutputStream.write` không tận dụng interface `Serializable`: đối số của nó được khai báo với kiểu `Object`, nên việc cố serialize một đối tượng không serializable sẽ không thất bại cho đến lúc chạy.

**Một ưu điểm khác của marker interface so với marker annotation là chúng có thể được nhắm mục tiêu chính xác hơn.** Nếu một annotation type được khai báo với target `ElementType.TYPE`, nó có thể được áp dụng cho *bất kỳ* class hay interface nào. Giả sử bạn có một dấu đánh dấu chỉ áp dụng được cho các cài đặt của một interface cụ thể. Nếu bạn định nghĩa nó là marker interface, bạn có thể cho nó kế thừa interface duy nhất mà nó áp dụng được, đảm bảo rằng mọi kiểu được đánh dấu cũng là subtype của interface duy nhất đó.

Có thể lập luận rằng interface `Set` chính là một *restricted marker interface* (marker interface bị giới hạn) như vậy. Nó chỉ áp dụng được cho các subtype của `Collection`, nhưng nó không thêm method nào ngoài những method do `Collection` định nghĩa. Nó thường không được coi là marker interface vì nó tinh chỉnh hợp đồng (contract) của một số method của `Collection`, bao gồm `add`, `equals`, và `hashCode`. Nhưng dễ dàng hình dung một marker interface chỉ áp dụng được cho các subtype của một interface cụ thể nào đó và *không* tinh chỉnh hợp đồng của bất kỳ method nào của interface đó. Một marker interface như vậy có thể mô tả một bất biến nào đó của toàn bộ đối tượng hoặc chỉ ra rằng các instance đủ điều kiện để được xử lý bởi một method của một class khác (theo cách interface `Serializable` chỉ ra rằng các instance đủ điều kiện để được `ObjectOutputStream` xử lý).

**Ưu điểm chính của marker annotation so với marker interface là chúng là một phần của cơ chế annotation lớn hơn.** Do đó, marker annotation cho phép sự nhất quán trong các framework dựa trên annotation.

Vậy khi nào bạn nên dùng marker annotation và khi nào nên dùng marker interface? Rõ ràng bạn phải dùng annotation nếu dấu đánh dấu áp dụng cho bất kỳ phần tử chương trình nào không phải class hay interface, vì chỉ class và interface mới có thể implement hoặc kế thừa một interface. Nếu dấu đánh dấu chỉ áp dụng cho class và interface, hãy tự hỏi mình câu hỏi “Liệu tôi có muốn viết một hoặc nhiều method chỉ chấp nhận các đối tượng mang dấu đánh dấu này không?” Nếu có, bạn nên ưu tiên dùng marker interface thay vì annotation. Điều này giúp bạn có thể dùng interface làm kiểu tham số cho các method đó, mang lại lợi ích của việc kiểm tra kiểu lúc biên dịch. Nếu bạn có thể tự thuyết phục rằng mình sẽ không bao giờ muốn viết một method chỉ chấp nhận các đối tượng mang dấu đánh dấu, thì có lẽ bạn nên dùng marker annotation. Nếu, thêm vào đó, dấu đánh dấu là một phần của một framework sử dụng nhiều annotation, thì marker annotation là lựa chọn rõ ràng.

Tóm lại, marker interface và marker annotation đều có chỗ dùng của mình. Nếu bạn muốn định nghĩa một kiểu không có method mới nào gắn với nó, marker interface là con đường nên đi. Nếu bạn muốn đánh dấu các phần tử chương trình không phải class và interface, hoặc muốn dấu đánh dấu phù hợp với một framework vốn đã sử dụng nhiều annotation type, thì marker annotation là lựa chọn đúng. **Nếu bạn thấy mình đang viết một marker annotation type có target là** `ElementType.TYPE` **, hãy dành thời gian tìm hiểu xem nó thực sự nên là annotation type hay marker interface sẽ phù hợp hơn.**

Theo một nghĩa nào đó, item này là nghịch đảo của **Item 22**, vốn nói rằng, “Nếu bạn không muốn định nghĩa một kiểu, đừng dùng interface.” Nói một cách gần đúng, item này nói rằng, “Nếu bạn muốn định nghĩa một kiểu, hãy dùng interface.”
