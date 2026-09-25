# Chương 2. Tạo và hủy đối tượng

Chương này bàn về việc tạo và hủy đối tượng: khi nào và làm thế nào để tạo chúng, khi nào và làm thế nào để tránh tạo chúng, làm sao đảm bảo chúng được hủy đúng lúc, và làm sao quản lý các thao tác dọn dẹp cần thực hiện trước khi chúng bị hủy.

## Item 1: Cân nhắc dùng static factory method thay vì constructor

Cách truyền thống để một class cho phép client lấy được một instance là cung cấp một public constructor. Có một kỹ thuật khác mà mọi lập trình viên nên có trong bộ công cụ của mình. Một class có thể cung cấp một public *static factory method* (phương thức tạo tĩnh), đơn giản là một static method trả về một instance của class đó. Đây là một ví dụ đơn giản từ `Boolean` (class *boxed primitive* của `boolean`). Method này chuyển một giá trị primitive `boolean` thành một tham chiếu đối tượng `Boolean`:

```java
public static Boolean valueOf(boolean b) {
    return b ? Boolean.TRUE : Boolean.FALSE;
}
```

Lưu ý rằng static factory method không giống với mẫu thiết kế *Factory Method* trong *Design Patterns* [**Gamma95**]. Static factory method được mô tả trong item này không có khái niệm tương đương trực tiếp nào trong *Design Patterns*.

Một class có thể cung cấp cho client các static factory method thay vì, hoặc bên cạnh, các public constructor. Việc cung cấp static factory method thay cho public constructor có cả ưu điểm lẫn nhược điểm.

**Ưu điểm thứ nhất của static factory method là, không giống constructor, chúng có tên.** Nếu bản thân các tham số của một constructor không mô tả được đối tượng đang được trả về, thì một static factory với cái tên được chọn kỹ sẽ dễ dùng hơn và mã client thu được cũng dễ đọc hơn. Ví dụ, constructor `BigInteger(int, int, Random)`, vốn trả về một `BigInteger` có khả năng là số nguyên tố, sẽ được diễn đạt tốt hơn dưới dạng một static factory method có tên `BigInteger.probablePrime`. (Method này đã được thêm vào trong Java 4.)

Một class chỉ có thể có duy nhất một constructor với một signature cho trước. Đã có những lập trình viên lách hạn chế này bằng cách cung cấp hai constructor mà danh sách tham số chỉ khác nhau ở thứ tự các kiểu tham số. Đây là một ý tưởng thực sự tồi. Người dùng của một API như vậy sẽ không bao giờ nhớ nổi constructor nào là constructor nào và rốt cuộc sẽ gọi nhầm. Người đọc mã có sử dụng các constructor này sẽ không biết mã làm gì nếu không tra tài liệu của class.

Vì có tên, static factory method không chịu hạn chế được bàn ở đoạn trên. Trong những trường hợp một class có vẻ cần nhiều constructor với cùng signature, hãy thay các constructor đó bằng static factory method với những cái tên được chọn cẩn thận để làm nổi bật sự khác biệt giữa chúng.

**Ưu điểm thứ hai của static factory method là, không giống constructor, chúng không bắt buộc phải tạo một đối tượng mới mỗi lần được gọi.** Điều này cho phép các immutable class (**Item 17**) dùng những instance đã được tạo sẵn, hoặc cache các instance khi chúng được tạo ra, rồi phát lại chúng nhiều lần để tránh tạo ra những đối tượng trùng lặp không cần thiết. Method `Boolean.valueOf(boolean)` minh họa kỹ thuật này: nó *không bao giờ* tạo đối tượng. Kỹ thuật này tương tự mẫu *Flyweight* [**Gamma95**]. Nó có thể cải thiện hiệu năng đáng kể nếu các đối tượng tương đương được yêu cầu thường xuyên, đặc biệt khi việc tạo chúng tốn kém.

Khả năng trả về cùng một đối tượng qua nhiều lần gọi của static factory method cho phép các class duy trì sự kiểm soát chặt chẽ đối với những instance tồn tại ở bất kỳ thời điểm nào. Các class làm như vậy được gọi là *instance-controlled* (kiểm soát instance). Có nhiều lý do để viết các class kiểm soát instance. Việc kiểm soát instance cho phép một class đảm bảo rằng nó là singleton (**Item 3**) hoặc không thể khởi tạo (**Item 4**). Nó cũng cho phép một immutable value class (**Item 17**) đảm bảo rằng không tồn tại hai instance bằng nhau: `a.equals(b)` khi và chỉ khi `a == b`. Đây là nền tảng của mẫu *Flyweight* [**Gamma95**]. Các enum type (**Item 34**) cung cấp sự đảm bảo này.

**Ưu điểm thứ ba của static factory method là, không giống constructor, chúng có thể trả về một đối tượng thuộc bất kỳ subtype nào của kiểu trả về.** Điều này cho bạn sự linh hoạt rất lớn trong việc chọn class của đối tượng được trả về.

Một ứng dụng của sự linh hoạt này là một API có thể trả về các đối tượng mà không cần công khai class của chúng. Việc ẩn các implementation class theo cách này dẫn đến một API rất gọn. Kỹ thuật này phù hợp với các *interface-based framework* (framework dựa trên interface) (**Item 20**), nơi các interface cung cấp kiểu trả về tự nhiên cho static factory method.

Trước Java 8, interface không thể có static method. Theo quy ước, các static factory method cho một interface tên `Type` được đặt trong một *noninstantiable companion class* (class đồng hành không thể khởi tạo) (**Item 4**) tên `Types`. Ví dụ, Java Collections Framework có bốn mươi lăm implementation tiện ích cho các interface của nó, cung cấp các collection không thể sửa đổi, các collection được đồng bộ hóa, và những thứ tương tự. Gần như tất cả các implementation này đều được xuất ra thông qua static factory method trong một class không thể khởi tạo (`java.util.Collections`). Class của các đối tượng được trả về đều là nonpublic.

API của Collections Framework nhỏ hơn nhiều so với khi nó xuất ra bốn mươi lăm public class riêng biệt, mỗi class cho một implementation tiện ích. Không chỉ *khối lượng* của API được giảm mà cả *trọng lượng khái niệm* (conceptual weight): số lượng và độ khó của những khái niệm mà lập trình viên phải nắm vững để dùng API. Lập trình viên biết rằng đối tượng được trả về có chính xác API được quy định bởi interface của nó, nên không cần đọc thêm tài liệu class của implementation class. Hơn nữa, việc dùng một static factory method như vậy buộc client phải tham chiếu tới đối tượng trả về thông qua interface thay vì implementation class, và nói chung đó là một thực hành tốt (**Item 64**).

Kể từ Java 8, hạn chế interface không thể chứa static method đã được gỡ bỏ, nên thường không còn mấy lý do để cung cấp một noninstantiable companion class cho một interface. Nhiều public static member vốn lẽ ra nằm trong class như vậy giờ nên được đặt ngay trong interface. Tuy nhiên, lưu ý rằng vẫn có thể cần đặt phần lớn mã cài đặt đứng sau các static method này trong một package-private class riêng. Đó là vì Java 8 yêu cầu mọi static member của interface phải là public. Java 9 cho phép private static method, nhưng static field và static member class vẫn bắt buộc phải là public.

**Ưu điểm thứ tư của static factory là class của đối tượng trả về có thể thay đổi giữa các lần gọi tùy theo tham số đầu vào.** Bất kỳ subtype nào của kiểu trả về được khai báo đều được phép. Class của đối tượng trả về cũng có thể thay đổi giữa các phiên bản phát hành.

Class `EnumSet` (**Item 36**) không có public constructor, chỉ có các static factory. Trong implementation của OpenJDK, chúng trả về instance của một trong hai subclass, tùy thuộc vào kích thước của enum type nền: nếu enum có sáu mươi tư phần tử trở xuống, như hầu hết các enum type, các static factory trả về một instance `RegularEnumSet`, được hỗ trợ bởi một `long` duy nhất; nếu enum type có sáu mươi lăm phần tử trở lên, các factory trả về một instance `JumboEnumSet`, được hỗ trợ bởi một mảng `long`.

Sự tồn tại của hai implementation class này là vô hình đối với client. Nếu `RegularEnumSet` không còn mang lại lợi thế hiệu năng cho các enum type nhỏ, nó có thể bị loại bỏ trong một phiên bản tương lai mà không gây tác hại gì. Tương tự, một phiên bản tương lai có thể thêm implementation thứ ba hay thứ tư của `EnumSet` nếu điều đó chứng tỏ có lợi cho hiệu năng. Client không biết và cũng không quan tâm đến class của đối tượng mà họ nhận lại từ factory; họ chỉ quan tâm rằng nó là một subclass nào đó của `EnumSet`.

**Ưu điểm thứ năm của static factory là class của đối tượng trả về không cần tồn tại vào thời điểm class chứa method đó được viết.** Những static factory method linh hoạt như vậy tạo nên nền tảng của các *service provider framework*, chẳng hạn Java Database Connectivity API (JDBC). Service provider framework là một hệ thống trong đó các provider cài đặt một service, và hệ thống làm cho các implementation này sẵn có cho client, tách rời client khỏi các implementation.

Có ba thành phần thiết yếu trong một service provider framework: một *service interface*, đại diện cho một implementation; một *provider registration API*, mà các provider dùng để đăng ký implementation; và một *service access API*, mà client dùng để lấy instance của service. Service access API có thể cho phép client chỉ định tiêu chí để chọn implementation. Khi không có tiêu chí như vậy, API trả về một instance của implementation mặc định, hoặc cho phép client duyệt qua tất cả các implementation sẵn có. Service access API chính là static factory linh hoạt tạo nên nền tảng của service provider framework.

Một thành phần thứ tư tùy chọn của service provider framework là *service provider interface*, mô tả một đối tượng factory tạo ra các instance của service interface. Khi không có service provider interface, các implementation phải được khởi tạo bằng reflection (**Item 65**). Trong trường hợp của JDBC, `Connection` đóng vai trò service interface, `DriverManager.registerDriver` là provider registration API, `DriverManager.getConnection` là service access API, và `Driver` là service provider interface.

Có nhiều biến thể của mẫu service provider framework. Ví dụ, service access API có thể trả về cho client một service interface phong phú hơn so với interface mà provider cung cấp. Đây là mẫu *Bridge* [**Gamma95**]. Các dependency injection framework (**Item 5**) có thể được xem là những service provider mạnh mẽ. Kể từ Java 6, nền tảng đã bao gồm một service provider framework đa dụng, `java.util.ServiceLoader`, nên bạn không cần, và nói chung không nên, tự viết một cái riêng (**Item 59**). JDBC không dùng `ServiceLoader`, vì JDBC ra đời trước `ServiceLoader`.

**Hạn chế chính của việc chỉ cung cấp static factory method là các class không có public hoặc protected constructor thì không thể được kế thừa.** Ví dụ, không thể kế thừa bất kỳ implementation class tiện ích nào trong Collections Framework. Có thể lập luận rằng đây là cái may trong cái rủi vì nó khuyến khích lập trình viên dùng composition thay vì inheritance (**Item 18**), và là điều bắt buộc đối với các immutable type (**Item 17**).

**Nhược điểm thứ hai của static factory method là chúng khó được lập trình viên tìm thấy.** Chúng không nổi bật trong tài liệu API theo cách constructor nổi bật, nên có thể khó hình dung cách khởi tạo một class cung cấp static factory method thay vì constructor. Công cụ Javadoc một ngày nào đó có thể sẽ làm nổi bật static factory method. Trong lúc chờ đợi, bạn có thể giảm bớt vấn đề này bằng cách thu hút sự chú ý đến các static factory trong tài liệu của class hoặc interface và bằng cách tuân theo các quy ước đặt tên thông dụng. Dưới đây là một số tên thông dụng cho static factory method. Danh sách này còn xa mới đầy đủ:

- `from` — Một *type-conversion method* (method chuyển đổi kiểu) nhận một tham số duy nhất và trả về một instance tương ứng của kiểu này, ví dụ:

`Date d = Date.from(instant);`

- `of` — Một *aggregation method* (method tổng hợp) nhận nhiều tham số và trả về một instance của kiểu này kết hợp chúng lại, ví dụ:

```java
Set<Rank> faceCards = EnumSet.of(JACK, QUEEN, KING);
```

- `valueOf` — Một lựa chọn dài dòng hơn thay cho `from` và `of`, ví dụ:

```java
BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);
```

- `instance` hoặc `getInstance` — Trả về một instance được mô tả bởi các tham số của nó (nếu có) nhưng không thể nói là có cùng giá trị, ví dụ:

```java
StackWalker luke = StackWalker.getInstance(options);
```

- `create` hoặc `newInstance` — Giống `instance` hoặc `getInstance`, ngoại trừ việc method đảm bảo mỗi lần gọi trả về một instance mới, ví dụ:

```java
Object newArray = Array.newInstance(classObject, arrayLen);
```

- `get` **Type** — Giống `getInstance`, nhưng được dùng khi factory method nằm ở một class khác. *Type* là kiểu của đối tượng được factory method trả về, ví dụ:

```java
FileStore fs = Files.getFileStore(path);
```

- `new` **Type** — Giống `newInstance`, nhưng được dùng khi factory method nằm ở một class khác. *Type* là kiểu của đối tượng được factory method trả về, ví dụ:

```java
BufferedReader br = Files.newBufferedReader(path);
```

- **type** — Một lựa chọn ngắn gọn thay cho `get` *Type* và `new` *Type*, ví dụ:

```java
List<Complaint> litany = Collections.list(legacyLitany);
```

Tóm lại, static factory method và public constructor đều có chỗ dùng riêng, và việc hiểu rõ ưu nhược điểm tương đối của chúng là đáng công. Static factory thường là lựa chọn tốt hơn, vì vậy hãy tránh phản xạ cung cấp public constructor mà không cân nhắc static factory trước.

## Item 2: Cân nhắc dùng builder khi gặp constructor có nhiều tham số

Static factory và constructor có chung một hạn chế: chúng không mở rộng tốt khi số lượng tham số tùy chọn lớn. Hãy xét trường hợp một class biểu diễn nhãn Thông tin Dinh dưỡng (Nutrition Facts) in trên bao bì thực phẩm đóng gói. Các nhãn này có vài trường bắt buộc — khẩu phần, số khẩu phần mỗi hộp, và lượng calo mỗi khẩu phần — và hơn hai mươi trường tùy chọn — tổng chất béo, chất béo bão hòa, chất béo chuyển hóa, cholesterol, natri, v.v. Hầu hết sản phẩm chỉ có giá trị khác không ở một vài trường tùy chọn trong số này.

Bạn nên viết loại constructor hay static factory nào cho một class như vậy? Theo truyền thống, lập trình viên dùng mẫu *telescoping constructor* (constructor lồng nhau kiểu ống kính), trong đó bạn cung cấp một constructor chỉ với các tham số bắt buộc, một constructor khác với một tham số tùy chọn, constructor thứ ba với hai tham số tùy chọn, và cứ thế, kết thúc bằng một constructor có đầy đủ mọi tham số tùy chọn. Đây là hình hài của nó trong thực tế. Để ngắn gọn, chỉ có bốn trường tùy chọn được hiển thị:

```java
// Telescoping constructor pattern - does not scale well!
public class NutritionFacts {
    private final int servingSize;  // (mL)            required
    private final int servings;     // (per container) required
    private final int calories;     // (per serving)   optional
    private final int fat;          // (g/serving)     optional
    private final int sodium;       // (mg/serving)    optional
    private final int carbohydrate; // (g/serving)     optional

    public NutritionFacts(int servingSize, int servings) {
        this(servingSize, servings, 0);
    }

    public NutritionFacts(int servingSize, int servings,
            int calories) {
        this(servingSize, servings, calories, 0);
    }

    public NutritionFacts(int servingSize, int servings,
            int calories, int fat) {
        this(servingSize, servings, calories, fat, 0);
    }

    public NutritionFacts(int servingSize, int servings,
            int calories, int fat, int sodium) {
        this(servingSize, servings, calories, fat, sodium, 0);
    }

    public NutritionFacts(int servingSize, int servings,
           int calories, int fat, int sodium, int carbohydrate) {
        this.servingSize  = servingSize;
        this.servings     = servings;
        this.calories     = calories;
        this.fat          = fat;
        this.sodium       = sodium;
        this.carbohydrate = carbohydrate;
    }
}
```

Khi muốn tạo một instance, bạn dùng constructor có danh sách tham số ngắn nhất mà vẫn chứa tất cả các tham số bạn muốn thiết lập:

```java
NutritionFacts cocaCola =
    new NutritionFacts(240, 8, 100, 0, 35, 27);
```

Thông thường lời gọi constructor này sẽ đòi hỏi nhiều tham số mà bạn không muốn thiết lập, nhưng dù sao bạn vẫn buộc phải truyền giá trị cho chúng. Trong trường hợp này, chúng ta đã truyền giá trị `0` cho `fat`. Với "chỉ" sáu tham số thì có vẻ chưa tệ lắm, nhưng nó nhanh chóng vượt tầm kiểm soát khi số lượng tham số tăng lên.

Tóm lại, **mẫu telescoping constructor hoạt động được, nhưng khó viết mã client khi có nhiều tham số, và còn khó đọc hơn nữa.** Người đọc bị bỏ lại với thắc mắc tất cả những giá trị đó có nghĩa gì và phải đếm tham số cẩn thận để tìm ra. Những chuỗi dài các tham số cùng kiểu có thể gây ra lỗi khó phát hiện. Nếu client vô tình đảo ngược hai tham số như vậy, trình biên dịch sẽ không phàn nàn, nhưng chương trình sẽ hoạt động sai ở runtime (**Item 51**).

Lựa chọn thứ hai khi bạn đối mặt với nhiều tham số tùy chọn trong constructor là mẫu *JavaBeans*, trong đó bạn gọi một constructor không tham số để tạo đối tượng rồi gọi các setter method để thiết lập từng tham số bắt buộc và từng tham số tùy chọn mà bạn quan tâm:

```java
// JavaBeans Pattern - allows inconsistency, mandates mutability
public class NutritionFacts {
    // Parameters initialized to default values (if any)
    private int servingSize  = -1; // Required; no default value
    private int servings     = -1; // Required; no default value
    private int calories     = 0;
    private int fat          = 0;
    private int sodium       = 0;
    private int carbohydrate = 0;

    public NutritionFacts() { }

    // Setters
    public void setServingSize(int val)  { servingSize = val; }
    public void setServings(int val)    { servings = val; }
    public void setCalories(int val)    { calories = val; }
    public void setFat(int val)         { fat = val; }
    public void setSodium(int val)      { sodium = val; }
    public void setCarbohydrate(int val) { carbohydrate = val; }
}
```

Mẫu này không có bất kỳ nhược điểm nào của mẫu telescoping constructor. Việc tạo instance thì dễ, dù hơi dài dòng, và mã thu được cũng dễ đọc:

```java
NutritionFacts cocaCola = new NutritionFacts();
cocaCola.setServingSize(240);
cocaCola.setServings(8);
cocaCola.setCalories(100);
cocaCola.setSodium(35);
cocaCola.setCarbohydrate(27);
```

Đáng tiếc, mẫu JavaBeans có những nhược điểm nghiêm trọng của riêng nó. Vì quá trình xây dựng bị chia nhỏ qua nhiều lời gọi, **một JavaBean có thể ở trạng thái không nhất quán giữa chừng quá trình xây dựng của nó.** Class không có lựa chọn ép buộc tính nhất quán chỉ bằng cách kiểm tra tính hợp lệ của các tham số constructor. Việc cố dùng một đối tượng khi nó đang ở trạng thái không nhất quán có thể gây ra những lỗi nằm rất xa đoạn mã chứa bug và do đó khó debug. Một nhược điểm liên quan là **mẫu JavaBeans loại bỏ khả năng làm cho một class trở thành immutable** (**Item 17**) và đòi hỏi lập trình viên phải bỏ thêm công sức để đảm bảo thread safety.

Có thể giảm bớt các nhược điểm này bằng cách "đóng băng" (freeze) thủ công đối tượng khi quá trình xây dựng hoàn tất và không cho phép dùng nó cho tới khi được đóng băng, nhưng biến thể này cồng kềnh và hiếm khi được dùng trong thực tế. Hơn nữa, nó có thể gây lỗi ở runtime vì trình biên dịch không thể đảm bảo rằng lập trình viên gọi freeze method trên đối tượng trước khi dùng nó.

May mắn thay, có một lựa chọn thứ ba kết hợp sự an toàn của mẫu telescoping constructor với tính dễ đọc của mẫu JavaBeans. Đó là một dạng của mẫu *Builder* [**Gamma95**]. Thay vì tạo trực tiếp đối tượng mong muốn, client gọi một constructor (hoặc static factory) với tất cả các tham số bắt buộc và nhận về một *builder object*. Sau đó client gọi các method giống setter trên builder object để thiết lập từng tham số tùy chọn mà mình quan tâm. Cuối cùng, client gọi method `build` không tham số để sinh ra đối tượng, thường là immutable. Builder thường là một static member class (**Item 24**) của class mà nó xây dựng. Đây là hình hài của nó trong thực tế:

```java
// Builder Pattern
public class NutritionFacts {
    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;
    private final int sodium;
    private final int carbohydrate;

    public static class Builder {
        // Required parameters
        private final int servingSize;
        private final int servings;

        // Optional parameters - initialized to default values
        private int calories      = 0;
        private int fat           = 0;
        private int sodium        = 0;
        private int carbohydrate  = 0;

        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings    = servings;
        }

        public Builder calories(int val)
            { calories = val;      return this; }
        public Builder fat(int val)
            { fat = val;           return this; }
        public Builder sodium(int val)
            { sodium = val;        return this; }
        public Builder carbohydrate(int val)
            { carbohydrate = val;  return this; }

        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }

    private NutritionFacts(Builder builder) {
        servingSize  = builder.servingSize;
        servings     = builder.servings;
        calories     = builder.calories;
        fat          = builder.fat;
        sodium       = builder.sodium;
        carbohydrate = builder.carbohydrate;
    }
}
```

Class `NutritionFacts` là immutable, và mọi giá trị mặc định của tham số đều nằm ở một chỗ. Các setter method của builder trả về chính builder đó để các lời gọi có thể được nối chuỗi, tạo thành một *fluent API*. Đây là hình hài của mã client:

```java
NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8)
        .calories(100).sodium(35).carbohydrate(27).build();
```

Mã client này dễ viết và, quan trọng hơn, dễ đọc. **Mẫu Builder mô phỏng các tham số tùy chọn có tên** như trong Python và Scala.

Các kiểm tra tính hợp lệ đã được lược bỏ cho ngắn gọn. Để phát hiện tham số không hợp lệ càng sớm càng tốt, hãy kiểm tra tính hợp lệ của tham số trong constructor và các method của builder. Hãy kiểm tra các bất biến (invariant) liên quan đến nhiều tham số trong constructor được gọi bởi method `build`. Để bảo vệ các bất biến này trước tấn công, hãy thực hiện các kiểm tra trên field của đối tượng sau khi đã sao chép tham số từ builder (**Item 50**). Nếu một kiểm tra thất bại, hãy ném `IllegalArgumentException` (**Item 72**) với thông điệp chi tiết chỉ ra những tham số nào không hợp lệ (**Item 75**).

**Mẫu Builder rất phù hợp với các hệ thống phân cấp class.** Hãy dùng một hệ thống phân cấp builder song song, mỗi builder được lồng trong class tương ứng. Abstract class có abstract builder; concrete class có concrete builder. Ví dụ, hãy xét một abstract class ở gốc của một hệ thống phân cấp biểu diễn các loại pizza khác nhau:

```java
// Builder pattern for class hierarchies
public abstract class Pizza {
   public enum Topping { HAM, MUSHROOM, ONION, PEPPER, SAUSAGE }
   final Set<Topping> toppings;

   abstract static class Builder<T extends Builder<T>> {
      EnumSet<Topping> toppings = EnumSet.noneOf(Topping.class);
      public T addTopping(Topping topping) {
         toppings.add(Objects.requireNonNull(topping));
         return self();
      }

      abstract Pizza build();

      // Subclasses must override this method to return "this"
      protected abstract T self();
   }
   Pizza(Builder<?> builder) {
      toppings = builder.toppings.clone(); // See Item  50
   }
}
```

Lưu ý rằng `Pizza.Builder` là một *generic type* với một *recursive type parameter* (tham số kiểu đệ quy) (**Item 30**). Điều này, cùng với abstract method `self`, cho phép việc nối chuỗi method hoạt động đúng trong các subclass mà không cần ép kiểu. Cách giải quyết này cho việc Java thiếu self type được gọi là idiom *simulated self-type* (mô phỏng self type).

Đây là hai concrete subclass của `Pizza`, một class biểu diễn pizza kiểu New York tiêu chuẩn, class còn lại là calzone. Class đầu có tham số kích cỡ bắt buộc, trong khi class sau cho phép bạn chỉ định sốt nằm bên trong hay bên ngoài:

```java
public class NyPizza extends Pizza {
    public enum Size { SMALL, MEDIUM, LARGE }
    private final Size size;

    public static class Builder extends Pizza.Builder<Builder> {
        private final Size size;

        public Builder(Size size) {
            this.size = Objects.requireNonNull(size);
        }

        @Override public NyPizza build() {
            return new NyPizza(this);
        }

        @Override protected Builder self() { return this; }
    }

    private NyPizza(Builder builder) {
        super(builder);
        size = builder.size;
    }
}

public class Calzone extends Pizza {
    private final boolean sauceInside;

    public static class Builder extends Pizza.Builder<Builder> {
        private boolean sauceInside = false; // Default

        public Builder sauceInside() {
            sauceInside = true;
            return this;
        }

        @Override public Calzone build() {
            return new Calzone(this);
        }

        @Override protected Builder self() { return this; }
    }

    private Calzone(Builder builder) {
        super(builder);
        sauceInside = builder.sauceInside;
    }
}
```

Lưu ý rằng method `build` trong builder của mỗi subclass được khai báo trả về đúng subclass: method `build` của `NyPizza.Builder` trả về `NyPizza`, trong khi method trong `Calzone.Builder` trả về `Calzone`. Kỹ thuật này, trong đó một method của subclass được khai báo trả về một subtype của kiểu trả về được khai báo trong superclass, được gọi là *covariant return typing* (kiểu trả về hiệp biến). Nó cho phép client dùng các builder này mà không cần ép kiểu.

Mã client cho các "builder phân cấp" này về cơ bản giống hệt mã cho builder `NutritionFacts` đơn giản. Mã client ví dụ dưới đây giả định có static import cho các hằng enum để ngắn gọn:

```java
NyPizza pizza = new NyPizza.Builder(SMALL)
        .addTopping(SAUSAGE).addTopping(ONION).build();
Calzone calzone = new Calzone.Builder()
        .addTopping(HAM).sauceInside().build();
```

Một ưu điểm nhỏ của builder so với constructor là builder có thể có nhiều tham số varargs vì mỗi tham số được chỉ định trong method riêng của nó. Ngoài ra, builder có thể gộp các tham số được truyền vào qua nhiều lời gọi tới một method thành một field duy nhất, như đã minh họa trong method `addTopping` ở trên.

Mẫu Builder khá linh hoạt. Một builder duy nhất có thể được dùng lặp lại để xây dựng nhiều đối tượng. Các tham số của builder có thể được điều chỉnh giữa các lời gọi method `build` để tạo ra những đối tượng khác nhau. Một builder có thể tự động điền một số field khi tạo đối tượng, chẳng hạn một số serial tăng dần mỗi lần một đối tượng được tạo.

Mẫu Builder cũng có nhược điểm. Để tạo một đối tượng, trước hết bạn phải tạo builder của nó. Mặc dù chi phí tạo builder này khó có thể nhận thấy trong thực tế, nó có thể là vấn đề trong những tình huống hiệu năng là tối quan trọng. Ngoài ra, mẫu Builder dài dòng hơn mẫu telescoping constructor, nên chỉ nên dùng khi có đủ tham số để đáng công, chẳng hạn bốn tham số trở lên. Nhưng hãy nhớ rằng bạn có thể muốn thêm tham số trong tương lai. Nhưng nếu bạn bắt đầu với constructor hoặc static factory rồi chuyển sang builder khi class tiến hóa đến mức số lượng tham số vượt tầm kiểm soát, các constructor hoặc static factory lỗi thời sẽ lộ ra như một cái gai trong mắt. Do đó, thường tốt hơn là bắt đầu với builder ngay từ đầu.

Tóm lại, **mẫu Builder là một lựa chọn tốt khi thiết kế những class mà constructor hoặc static factory của chúng sẽ có nhiều hơn một vài tham số**, đặc biệt nếu nhiều tham số là tùy chọn hoặc có cùng kiểu. Mã client dễ đọc và dễ viết hơn nhiều với builder so với telescoping constructor, và builder an toàn hơn nhiều so với JavaBeans.

## Item 3: Đảm bảo tính singleton bằng private constructor hoặc enum type

*Singleton* đơn giản là một class chỉ được khởi tạo đúng một lần [**Gamma95**]. Singleton thường biểu diễn một đối tượng không trạng thái như một hàm (**Item 24**) hoặc một thành phần hệ thống vốn dĩ là duy nhất. **Biến một class thành singleton có thể khiến việc kiểm thử các client của nó trở nên khó khăn** vì không thể thay thế một mock implementation cho singleton trừ khi nó implement một interface đóng vai trò là kiểu của nó.

Có hai cách phổ biến để cài đặt singleton. Cả hai đều dựa trên việc giữ constructor là private và xuất ra một public static member để cung cấp quyền truy cập tới instance duy nhất. Trong cách thứ nhất, member đó là một final field:

```java
// Singleton with public final field
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }

    public void leaveTheBuilding() { ... }
}
```

Private constructor chỉ được gọi một lần, để khởi tạo public static final field `Elvis.INSTANCE`. Việc không có public hay protected constructor *đảm bảo* một vũ trụ "đơn Elvis" (monoelvistic): sẽ tồn tại đúng một instance `Elvis` khi class `Elvis` được khởi tạo — không hơn, không kém. Không gì client làm có thể thay đổi điều này, với một ngoại lệ: một client có đặc quyền có thể gọi private constructor bằng reflection (**Item 65**) với sự trợ giúp của method `AccessibleObject.setAccessible`. Nếu bạn cần phòng thủ trước tấn công này, hãy sửa constructor để nó ném exception khi bị yêu cầu tạo instance thứ hai.

Trong cách thứ hai để cài đặt singleton, public member là một static factory method:

```java
// Singleton with static factory
public class Elvis {
    private static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }
    public static Elvis getInstance() { return INSTANCE; }

    public void leaveTheBuilding() { ... }
}
```

Mọi lời gọi tới `Elvis.getInstance` đều trả về cùng một tham chiếu đối tượng, và sẽ không có instance `Elvis` nào khác được tạo ra (với cùng ngoại lệ đã đề cập ở trên).

Ưu điểm chính của cách dùng public field là API thể hiện rõ ràng class này là singleton: public static field là final, nên nó sẽ luôn chứa cùng một tham chiếu đối tượng. Ưu điểm thứ hai là nó đơn giản hơn.

Một ưu điểm của cách dùng static factory là nó cho bạn sự linh hoạt để thay đổi quyết định về việc class có phải là singleton hay không mà không cần thay đổi API của nó. Factory method trả về instance duy nhất, nhưng nó có thể được sửa để trả về, chẳng hạn, một instance riêng cho mỗi thread gọi nó. Ưu điểm thứ hai là bạn có thể viết một *generic singleton factory* nếu ứng dụng của bạn cần (**Item 30**). Ưu điểm cuối cùng của việc dùng static factory là một *method reference* có thể được dùng làm supplier, ví dụ `Elvis::getInstance` là một `Supplier<Elvis>`. Trừ khi một trong những ưu điểm này là cần thiết, cách dùng public field được ưu tiên hơn.

Để làm cho một singleton class dùng một trong hai cách trên trở thành *serializable* (**Chương 12**), chỉ thêm `implements Serializable` vào khai báo là chưa đủ. Để duy trì đảm bảo singleton, hãy khai báo tất cả instance field là `transient` và cung cấp một method `readResolve` (**Item 89**). Nếu không, mỗi lần một instance đã serialize được deserialize, một instance mới sẽ được tạo ra, dẫn đến, trong ví dụ của chúng ta, những lần "nhìn thấy" `Elvis` giả mạo. Để ngăn điều này xảy ra, hãy thêm method `readResolve` này vào class `Elvis`:

```java
// readResolve method to preserve singleton property
private Object readResolve() {
     // Return the one true Elvis and let the garbage collector
     // take care of the Elvis impersonator.
    return INSTANCE;
}
```

Cách thứ ba để cài đặt singleton là khai báo một enum có một phần tử duy nhất:

```java
// Enum singleton - the preferred approach
public enum Elvis {
    INSTANCE;
    public void leaveTheBuilding() { ... }
}
```

Cách này tương tự cách dùng public field, nhưng ngắn gọn hơn, cung cấp sẵn cơ chế serialization miễn phí, và đưa ra một đảm bảo vững chắc chống lại việc khởi tạo nhiều lần, ngay cả trước những tấn công serialization hay reflection tinh vi. Cách này có thể hơi thiếu tự nhiên, nhưng **một enum type có một phần tử duy nhất thường là cách tốt nhất để cài đặt singleton**. Lưu ý rằng bạn không thể dùng cách này nếu singleton của bạn phải kế thừa một superclass khác ngoài `Enum` (dù bạn *có thể* khai báo một enum implement các interface).

## Item 4: Đảm bảo tính không thể khởi tạo bằng private constructor

Đôi khi bạn sẽ muốn viết một class chỉ là nơi gom nhóm các static method và static field. Những class như vậy mang tiếng xấu vì một số người lạm dụng chúng để tránh tư duy theo hướng đối tượng, nhưng chúng thực sự có những công dụng chính đáng. Chúng có thể được dùng để gom nhóm các method liên quan thao tác trên giá trị primitive hoặc mảng, theo cách của `java.lang.Math` hay `java.util.Arrays`. Chúng cũng có thể được dùng để gom nhóm các static method, bao gồm cả factory (**Item 1**), cho những đối tượng implement một interface nào đó, theo cách của `java.util.Collections`. (Kể từ Java 8, bạn cũng có thể đặt các method như vậy *trong* interface, với giả định interface đó là của bạn để sửa đổi.) Cuối cùng, những class như vậy có thể được dùng để gom nhóm các method thao tác trên một final class, vì bạn không thể đặt chúng trong một subclass.

Những *utility class* như vậy không được thiết kế để khởi tạo: một instance sẽ là vô nghĩa. Tuy nhiên, khi không có constructor tường minh, trình biên dịch sẽ cung cấp một public *default constructor* không tham số. Đối với người dùng, constructor này không thể phân biệt được với bất kỳ constructor nào khác. Không hiếm khi thấy những class có thể khởi tạo ngoài ý muốn trong các API đã công bố.

**Cố gắng ép buộc tính không thể khởi tạo bằng cách làm cho class trở thành abstract là không hiệu quả.** Class đó có thể được kế thừa và subclass có thể được khởi tạo. Hơn nữa, nó đánh lừa người dùng nghĩ rằng class được thiết kế để kế thừa (**Item 19**). Tuy nhiên, có một idiom đơn giản để đảm bảo tính không thể khởi tạo. Default constructor chỉ được sinh ra nếu class không chứa constructor tường minh nào, vì vậy **một class có thể được làm cho không thể khởi tạo bằng cách thêm vào một private constructor**:

```java
// Noninstantiable utility class
public class UtilityClass {
    // Suppress default constructor for noninstantiability
    private UtilityClass() {
        throw new AssertionError();
    }
    ... // Remainder omitted
}
```

Vì constructor tường minh là private, nó không thể truy cập được từ bên ngoài class. `AssertionError` không thực sự bắt buộc, nhưng nó cung cấp sự bảo hiểm phòng khi constructor vô tình được gọi từ bên trong class. Nó đảm bảo class sẽ không bao giờ được khởi tạo trong bất kỳ hoàn cảnh nào. Idiom này hơi phản trực giác vì constructor được cung cấp rõ ràng là để nó không thể được gọi. Do đó, khôn ngoan là thêm một comment, như đã thấy ở trên.

Như một tác dụng phụ, idiom này cũng ngăn class bị kế thừa. Mọi constructor đều phải gọi một constructor của superclass, tường minh hoặc ngầm định, và một subclass sẽ không có constructor nào của superclass có thể truy cập được để gọi.

## Item 5: Ưu tiên dependency injection thay vì gắn cứng tài nguyên

Nhiều class phụ thuộc vào một hoặc nhiều tài nguyên nền. Ví dụ, một trình kiểm tra chính tả phụ thuộc vào một từ điển. Không hiếm khi thấy những class như vậy được cài đặt dưới dạng static utility class (**Item 4**):

```java
// Inappropriate use of static utility - inflexible & untestable!
public class SpellChecker {
    private static final Lexicon dictionary = ...;

    private SpellChecker() {} // Noninstantiable
    public static boolean isValid(String word) { ... }
    public static List<String> suggestions(String typo) { ... }
}
```

Tương tự, cũng không hiếm khi thấy chúng được cài đặt dưới dạng singleton (**Item 3**):

```java
// Inappropriate use of singleton - inflexible & untestable!
public class SpellChecker {
    private final Lexicon dictionary = ...;

    private SpellChecker(...) {}
    public static SpellChecker INSTANCE = new SpellChecker(...);

    public boolean isValid(String word) { ... }
    public List<String> suggestions(String typo) { ... }
}
```

Cả hai cách này đều không thỏa đáng, vì chúng giả định rằng chỉ có một từ điển đáng dùng. Trong thực tế, mỗi ngôn ngữ có từ điển riêng, và các từ điển đặc biệt được dùng cho các bộ từ vựng đặc biệt. Ngoài ra, có thể cần dùng một từ điển đặc biệt cho việc kiểm thử. Giả định rằng một từ điển duy nhất sẽ đủ dùng mãi mãi chỉ là mơ tưởng.

Bạn có thể thử cho `SpellChecker` hỗ trợ nhiều từ điển bằng cách làm cho field `dictionary` không còn là final và thêm một method để thay đổi từ điển trong một spell checker hiện có, nhưng cách này sẽ vụng về, dễ gây lỗi, và không hoạt động được trong môi trường đồng thời. **Static utility class và singleton không phù hợp cho những class mà hành vi được tham số hóa bởi một tài nguyên nền.**

Điều cần thiết là khả năng hỗ trợ nhiều instance của class (trong ví dụ của chúng ta là `SpellChecker`), mỗi instance dùng tài nguyên mà client mong muốn (trong ví dụ của chúng ta là từ điển). Một mẫu đơn giản thỏa mãn yêu cầu này là **truyền tài nguyên vào constructor khi tạo một instance mới**. Đây là một dạng của *dependency injection* (tiêm phụ thuộc): từ điển là một *dependency* (phụ thuộc) của spell checker và được *inject* (tiêm) vào spell checker khi nó được tạo.

```java
// Dependency injection provides flexibility and testability
public class SpellChecker {
    private final Lexicon dictionary;

    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }

    public boolean isValid(String word) { ... }
    public List<String> suggestions(String typo) { ... }
}
```

Mẫu dependency injection đơn giản đến mức nhiều lập trình viên dùng nó trong nhiều năm mà không biết nó có tên. Mặc dù ví dụ spell checker của chúng ta chỉ có một tài nguyên duy nhất (từ điển), dependency injection hoạt động với số lượng tài nguyên tùy ý và đồ thị phụ thuộc tùy ý. Nó bảo toàn tính immutable (**Item 17**), nên nhiều client có thể chia sẻ các đối tượng phụ thuộc (với giả định các client mong muốn cùng tài nguyên nền). Dependency injection áp dụng được như nhau cho constructor, static factory (**Item 1**), và builder (**Item 2**).

Một biến thể hữu ích của mẫu này là truyền một *factory* tài nguyên vào constructor. Factory là một đối tượng có thể được gọi lặp lại để tạo các instance của một kiểu. Những factory như vậy là hiện thân của mẫu *Factory Method* [**Gamma95**]. Interface `Supplier<T>`, được giới thiệu trong Java 8, là lựa chọn hoàn hảo để biểu diễn factory. Các method nhận `Supplier<T>` làm đầu vào thường nên ràng buộc type parameter của factory bằng một *bounded wildcard type* (**Item 31**) để cho phép client truyền vào một factory tạo ra bất kỳ subtype nào của một kiểu được chỉ định. Ví dụ, đây là một method tạo một bức tranh khảm (mosaic) dùng factory do client cung cấp để tạo ra từng viên gạch:

```java
Mosaic create(Supplier<? extends Tile> tileFactory) { ... }
```

Mặc dù dependency injection cải thiện đáng kể tính linh hoạt và khả năng kiểm thử, nó có thể làm rối các dự án lớn, vốn thường chứa hàng nghìn phụ thuộc. Sự rối rắm này có thể được loại bỏ gần như hoàn toàn bằng cách dùng một *dependency injection framework*, chẳng hạn Dagger [**Dagger**], Guice [**Guice**], hoặc Spring [**Spring**]. Việc sử dụng các framework này nằm ngoài phạm vi cuốn sách, nhưng lưu ý rằng các API được thiết kế cho dependency injection thủ công có thể được điều chỉnh dễ dàng để dùng với các framework này.

Tóm lại, đừng dùng singleton hay static utility class để cài đặt một class phụ thuộc vào một hoặc nhiều tài nguyên nền mà hành vi của chúng ảnh hưởng đến hành vi của class, và đừng để class tự tạo các tài nguyên này. Thay vào đó, hãy truyền các tài nguyên, hoặc các factory để tạo ra chúng, vào constructor (hoặc static factory hoặc builder). Thực hành này, được gọi là dependency injection, sẽ nâng cao đáng kể tính linh hoạt, khả năng tái sử dụng, và khả năng kiểm thử của một class.

## Item 6: Tránh tạo đối tượng không cần thiết

Thường thì việc tái sử dụng một đối tượng duy nhất là phù hợp hơn thay vì tạo một đối tượng mới tương đương về chức năng mỗi khi cần. Tái sử dụng có thể vừa nhanh hơn vừa thanh lịch hơn. Một đối tượng luôn có thể được tái sử dụng nếu nó là immutable (**Item 17**).

Là một ví dụ cực đoan về điều không nên làm, hãy xét câu lệnh sau:

```java
String s = new String("bikini");  // DON'T DO THIS!
```

Câu lệnh này tạo một instance `String` mới mỗi lần được thực thi, và không lần tạo đối tượng nào trong số đó là cần thiết. Đối số truyền cho constructor `String` (`"bikini"`) bản thân nó đã là một instance `String`, giống hệt về chức năng với tất cả các đối tượng được constructor tạo ra. Nếu cách dùng này xuất hiện trong một vòng lặp hoặc trong một method được gọi thường xuyên, hàng triệu instance `String` có thể được tạo ra một cách vô ích.

Phiên bản cải tiến đơn giản là như sau:

```java
String s = "bikini";
```

Phiên bản này dùng một instance `String` duy nhất, thay vì tạo một instance mới mỗi lần được thực thi. Hơn nữa, có sự đảm bảo rằng đối tượng này sẽ được tái sử dụng bởi bất kỳ đoạn mã nào khác chạy trong cùng máy ảo mà tình cờ chứa cùng string literal đó [JLS, 3.10.5].

Bạn thường có thể tránh tạo đối tượng không cần thiết bằng cách dùng *static factory method* (**Item 1**) thay cho constructor trên các immutable class cung cấp cả hai. Ví dụ, factory method `Boolean.valueOf(String)` được ưu tiên hơn constructor `Boolean(String)`, vốn đã bị deprecated trong Java 9. Constructor *bắt buộc* phải tạo một đối tượng mới mỗi lần được gọi, trong khi factory method không bao giờ bị buộc phải làm vậy và trên thực tế sẽ không làm vậy. Ngoài việc tái sử dụng các đối tượng immutable, bạn cũng có thể tái sử dụng các đối tượng mutable nếu biết rằng chúng sẽ không bị sửa đổi.

Một số việc tạo đối tượng tốn kém hơn nhiều so với những việc khác. Nếu bạn sẽ cần một "đối tượng đắt đỏ" như vậy nhiều lần, có thể nên cache nó để tái sử dụng. Đáng tiếc, không phải lúc nào cũng rõ ràng khi nào bạn đang tạo ra một đối tượng như vậy. Giả sử bạn muốn viết một method để xác định một chuỗi có phải là số La Mã hợp lệ hay không. Đây là cách dễ nhất để làm điều đó bằng biểu thức chính quy:

```java
// Performance can be greatly improved!
static boolean isRomanNumeral(String s) {
    return s.matches("^(?=.)M*(C[MD]|D?C{0,3})"
            + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$");
}
```

Vấn đề với cài đặt này là nó dựa vào method `String.matches`. **Mặc dù** `String.matches` **là cách dễ nhất để kiểm tra một chuỗi có khớp với biểu thức chính quy hay không, nó không phù hợp để dùng lặp lại trong những tình huống hiệu năng là tối quan trọng.** Vấn đề là bên trong, nó tạo một instance `Pattern` cho biểu thức chính quy và chỉ dùng một lần, sau đó instance này trở thành đủ điều kiện để bị thu gom rác. Việc tạo một instance `Pattern` tốn kém vì nó đòi hỏi biên dịch biểu thức chính quy thành một máy trạng thái hữu hạn.

Để cải thiện hiệu năng, hãy biên dịch tường minh biểu thức chính quy thành một instance `Pattern` (vốn là immutable) như một phần của quá trình khởi tạo class, cache nó, và tái sử dụng cùng instance đó cho mọi lời gọi tới method `isRomanNumeral`:

```java
// Reusing expensive object for improved performance
public class RomanNumerals {
    private static final Pattern ROMAN = Pattern.compile(
            "^(?=.)M*(C[MD]|D?C{0,3})"
            + "(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$");

    static boolean isRomanNumeral(String s) {
        return ROMAN.matcher(s).matches();
    }
}
```

Phiên bản cải tiến của `isRomanNumeral` mang lại mức tăng hiệu năng đáng kể nếu được gọi thường xuyên. Trên máy của tôi, phiên bản gốc mất 1,1 µs cho một chuỗi đầu vào 8 ký tự, trong khi phiên bản cải tiến mất 0,17 µs, tức nhanh hơn 6,5 lần. Không chỉ hiệu năng được cải thiện, mà có thể nói tính rõ ràng cũng vậy. Việc tạo một static final field cho instance `Pattern` vốn vô hình cho phép chúng ta đặt tên cho nó, dễ đọc hơn nhiều so với bản thân biểu thức chính quy.

Nếu class chứa phiên bản cải tiến của method `isRomanNumeral` được khởi tạo nhưng method này không bao giờ được gọi, field `ROMAN` sẽ được khởi tạo một cách vô ích. Có thể loại bỏ việc khởi tạo này bằng cách *khởi tạo lười* (lazily initializing) field đó (**Item 83**) vào lần đầu tiên method `isRomanNumeral` được gọi, nhưng điều này *không* được khuyến khích. Như thường thấy với lazy initialization, nó sẽ làm phức tạp cài đặt mà không đem lại cải thiện hiệu năng đo lường được (**Item 67**).

Khi một đối tượng là immutable, hiển nhiên là nó có thể được tái sử dụng an toàn, nhưng có những tình huống khác mà điều đó kém hiển nhiên hơn nhiều, thậm chí phản trực giác. Hãy xét trường hợp các *adapter* [**Gamma95**]*,* còn được gọi là *view*. Adapter là một đối tượng ủy quyền cho một đối tượng nền, cung cấp một interface thay thế. Vì adapter không có trạng thái nào ngoài trạng thái của đối tượng nền, không cần tạo nhiều hơn một instance của một adapter cho trước tới một đối tượng cho trước.

Ví dụ, method `keySet` của interface `Map` trả về một `Set` view của đối tượng `Map`, bao gồm tất cả các khóa trong map. Thoạt nhìn, có vẻ mỗi lời gọi `keySet` sẽ phải tạo một instance `Set` mới, nhưng mọi lời gọi `keySet` trên một đối tượng `Map` cho trước có thể trả về cùng một instance `Set`. Mặc dù instance `Set` được trả về thường là mutable, tất cả các đối tượng được trả về đều giống hệt nhau về chức năng: khi một trong các đối tượng được trả về thay đổi, tất cả những đối tượng còn lại cũng thay đổi, vì chúng đều được hỗ trợ bởi cùng một instance `Map`. Mặc dù việc tạo nhiều instance của view object `keySet` phần lớn là vô hại, nó không cần thiết và không mang lại lợi ích gì.

Một cách khác để tạo đối tượng không cần thiết là *autoboxing*, cho phép lập trình viên trộn lẫn các kiểu primitive và boxed primitive, tự động boxing và unboxing khi cần. **Autoboxing làm mờ nhưng không xóa bỏ sự khác biệt giữa kiểu primitive và kiểu boxed primitive.** Có những khác biệt ngữ nghĩa tinh tế và những khác biệt hiệu năng không hề tinh tế (**Item 61**). Hãy xét method sau, tính tổng của tất cả các giá trị `int` dương. Để làm điều này, chương trình phải dùng số học `long` vì `int` không đủ lớn để chứa tổng của tất cả các giá trị `int` dương:

```java
// Hideously slow! Can you spot the object creation?
private static long sum() {
    Long sum = 0L;
    for (long i = 0; i <= Integer.MAX_VALUE; i++)
        sum += i;

    return sum;
}
```

Chương trình này cho kết quả đúng, nhưng nó chậm hơn *rất nhiều* so với mức đáng lẽ phải có, do một lỗi đánh máy chỉ một ký tự. Biến `sum` được khai báo là `Long` thay vì `long`, nghĩa là chương trình tạo ra khoảng 2^31 instance `Long` không cần thiết (gần như mỗi lần `long i` được cộng vào `Long sum` là một instance). Đổi khai báo của `sum` từ `Long` thành `long` giảm thời gian chạy từ 6,3 giây xuống 0,59 giây trên máy của tôi. Bài học rất rõ ràng: **ưu tiên primitive hơn boxed primitive, và cảnh giác với autoboxing ngoài ý muốn.**

Item này không nên bị hiểu sai thành hàm ý rằng việc tạo đối tượng là tốn kém và nên tránh. Ngược lại, việc tạo và thu hồi các đối tượng nhỏ mà constructor làm ít việc tường minh là rẻ, đặc biệt trên các JVM implementation hiện đại. Tạo thêm đối tượng để nâng cao tính rõ ràng, đơn giản, hoặc sức mạnh của chương trình nói chung là điều tốt.

Ngược lại, tránh tạo đối tượng bằng cách tự duy trì *object pool* của riêng bạn là một ý tưởng tồi trừ khi các đối tượng trong pool cực kỳ nặng nề. Ví dụ kinh điển về một đối tượng *thực sự* xứng đáng có object pool là kết nối cơ sở dữ liệu. Chi phí thiết lập kết nối đủ cao để việc tái sử dụng những đối tượng này là hợp lý. Tuy nhiên, nói chung, việc tự duy trì object pool làm rối mã của bạn, tăng dung lượng bộ nhớ chiếm dụng, và gây hại cho hiệu năng. Các JVM implementation hiện đại có garbage collector được tối ưu hóa cao, dễ dàng vượt trội so với những object pool như vậy đối với các đối tượng nhẹ.

Đối trọng của item này là **Item 50** về *defensive copying* (sao chép phòng thủ). Item hiện tại nói: "Đừng tạo đối tượng mới khi bạn nên tái sử dụng một đối tượng có sẵn," trong khi **Item 50** nói: "Đừng tái sử dụng một đối tượng có sẵn khi bạn nên tạo một đối tượng mới." Lưu ý rằng cái giá phải trả cho việc tái sử dụng một đối tượng khi cần defensive copying lớn hơn nhiều so với cái giá của việc tạo một đối tượng trùng lặp không cần thiết. Không tạo bản sao phòng thủ khi cần có thể dẫn đến những bug ngấm ngầm và lỗ hổng bảo mật; tạo đối tượng không cần thiết chỉ ảnh hưởng đến phong cách và hiệu năng.

## Item 7: Loại bỏ các tham chiếu đối tượng lỗi thời

Nếu bạn chuyển từ một ngôn ngữ quản lý bộ nhớ thủ công, như C hoặc C++, sang một ngôn ngữ có thu gom rác như Java, công việc lập trình viên của bạn đã trở nên dễ dàng hơn nhiều nhờ việc các đối tượng được tự động thu hồi khi bạn dùng xong. Điều này gần như là phép màu khi bạn lần đầu trải nghiệm. Nó dễ dẫn đến ấn tượng rằng bạn không phải nghĩ về quản lý bộ nhớ nữa, nhưng điều này không hoàn toàn đúng.

Hãy xét cài đặt stack đơn giản sau:

```java
// Can you spot the "memory leak"?
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
        return elements[--size];
    }

    /**
     * Ensure space for at least one more element, roughly
     * doubling the capacity each time the array needs to grow.
     */
    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}
```

Không có gì sai rõ ràng với chương trình này (nhưng hãy xem **Item 29** cho phiên bản generic). Bạn có thể kiểm thử nó thấu đáo, và nó sẽ vượt qua mọi bài kiểm tra một cách xuất sắc, nhưng có một vấn đề đang ẩn nấp. Nói một cách nôm na, chương trình có một "memory leak" (rò rỉ bộ nhớ), có thể âm thầm biểu hiện dưới dạng hiệu năng giảm sút do garbage collector hoạt động nhiều hơn hoặc dung lượng bộ nhớ chiếm dụng tăng lên. Trong những trường hợp cực đoan, những memory leak như vậy có thể gây ra phân trang đĩa (disk paging) và thậm chí làm chương trình thất bại với `OutOfMemoryError`, nhưng những thất bại như vậy tương đối hiếm.

Vậy memory leak nằm ở đâu? Nếu một stack lớn lên rồi co lại, các đối tượng đã bị pop khỏi stack sẽ không được thu gom rác, ngay cả khi chương trình dùng stack không còn tham chiếu nào tới chúng. Đó là vì stack vẫn duy trì các *obsolete reference* (tham chiếu lỗi thời) tới những đối tượng này. Tham chiếu lỗi thời đơn giản là một tham chiếu sẽ không bao giờ được giải tham chiếu (dereference) nữa. Trong trường hợp này, bất kỳ tham chiếu nào nằm ngoài "phần hoạt động" của mảng phần tử đều là lỗi thời. Phần hoạt động bao gồm các phần tử có chỉ số nhỏ hơn `size`.

Memory leak trong các ngôn ngữ có thu gom rác (gọi đúng hơn là *unintentional object retention* — giữ đối tượng ngoài ý muốn) rất ngấm ngầm. Nếu một tham chiếu đối tượng bị giữ lại ngoài ý muốn, không chỉ đối tượng đó bị loại khỏi việc thu gom rác, mà cả những đối tượng được đối tượng đó tham chiếu cũng vậy, và cứ thế tiếp diễn. Ngay cả khi chỉ một vài tham chiếu đối tượng bị giữ lại ngoài ý muốn, rất, rất nhiều đối tượng có thể bị ngăn không được thu gom rác, với những ảnh hưởng tiềm tàng lớn tới hiệu năng.

Cách sửa cho loại vấn đề này rất đơn giản: gán null cho các tham chiếu ngay khi chúng trở nên lỗi thời. Trong trường hợp class `Stack` của chúng ta, tham chiếu tới một phần tử trở nên lỗi thời ngay khi nó bị pop khỏi stack. Phiên bản đã sửa của method `pop` trông như sau:

```java
public Object pop() {
    if (size == 0)
        throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // Eliminate obsolete reference
    return result;
}
```

Một lợi ích bổ sung của việc gán null cho các tham chiếu lỗi thời là nếu sau đó chúng bị giải tham chiếu do nhầm lẫn, chương trình sẽ thất bại ngay lập tức với `NullPointerException`, thay vì âm thầm làm điều sai. Việc phát hiện lỗi lập trình càng sớm càng tốt luôn có lợi.

Khi lập trình viên lần đầu bị vấn đề này "cắn", họ có thể phản ứng thái quá bằng cách gán null cho mọi tham chiếu đối tượng ngay khi chương trình dùng xong. Điều này vừa không cần thiết vừa không đáng mong muốn; nó làm rối chương trình một cách vô ích. **Gán null cho tham chiếu đối tượng nên là ngoại lệ chứ không phải thông lệ.** Cách tốt nhất để loại bỏ một tham chiếu lỗi thời là để biến chứa tham chiếu đó ra khỏi phạm vi (scope). Điều này xảy ra tự nhiên nếu bạn định nghĩa mỗi biến trong phạm vi hẹp nhất có thể (**Item 57**).

Vậy khi nào bạn nên gán null cho một tham chiếu? Khía cạnh nào của class `Stack` khiến nó dễ bị memory leak? Nói đơn giản, nó *tự quản lý bộ nhớ của mình*. *Storage pool* (vùng lưu trữ) bao gồm các phần tử của mảng `elements` (các ô chứa tham chiếu đối tượng, chứ không phải bản thân các đối tượng). Các phần tử trong phần hoạt động của mảng (như đã định nghĩa ở trên) là *đã cấp phát*, và những phần tử ở phần còn lại của mảng là *tự do*. Garbage collector không có cách nào biết điều này; đối với garbage collector, tất cả các tham chiếu đối tượng trong mảng `elements` đều hợp lệ như nhau. Chỉ lập trình viên biết rằng phần không hoạt động của mảng là không quan trọng. Lập trình viên truyền đạt thực tế này tới garbage collector một cách hiệu quả bằng cách gán null thủ công cho các phần tử mảng ngay khi chúng trở thành một phần của vùng không hoạt động.

Nói chung, **bất cứ khi nào một class tự quản lý bộ nhớ của mình, lập trình viên nên cảnh giác với memory leak**. Bất cứ khi nào một phần tử được giải phóng, mọi tham chiếu đối tượng chứa trong phần tử đó nên được gán null.

**Một nguồn phổ biến khác của memory leak là cache.** Một khi bạn đặt một tham chiếu đối tượng vào cache, rất dễ quên rằng nó ở đó và để nó nằm trong cache rất lâu sau khi nó không còn liên quan. Có vài giải pháp cho vấn đề này. Nếu bạn may mắn cài đặt được một cache mà một entry chỉ có ý nghĩa chừng nào còn có tham chiếu tới khóa của nó ở bên ngoài cache, hãy biểu diễn cache bằng `WeakHashMap`; các entry sẽ tự động bị xóa sau khi trở nên lỗi thời. Hãy nhớ rằng `WeakHashMap` chỉ hữu ích nếu vòng đời mong muốn của các entry trong cache được quyết định bởi các tham chiếu bên ngoài tới khóa, chứ không phải tới giá trị.

Phổ biến hơn, vòng đời hữu ích của một entry trong cache ít được xác định rõ ràng hơn, với các entry dần trở nên kém giá trị theo thời gian. Trong những hoàn cảnh này, cache thỉnh thoảng nên được dọn dẹp khỏi những entry đã rơi vào tình trạng không được dùng đến. Việc này có thể được thực hiện bởi một background thread (có thể là `ScheduledThreadPoolExecutor`) hoặc như một tác dụng phụ của việc thêm entry mới vào cache. Class `LinkedHashMap` hỗ trợ cách thứ hai với method `removeEldestEntry` của nó. Đối với những cache phức tạp hơn, bạn có thể cần dùng trực tiếp `java.lang.ref`.

**Nguồn phổ biến thứ ba của memory leak là listener và các callback khác.** Nếu bạn cài đặt một API mà client đăng ký callback nhưng không hủy đăng ký tường minh, chúng sẽ tích tụ trừ khi bạn có hành động nào đó. Một cách để đảm bảo callback được thu gom rác kịp thời là chỉ lưu *weak reference* (tham chiếu yếu) tới chúng, chẳng hạn, bằng cách chỉ lưu chúng làm khóa trong một `WeakHashMap`.

Vì memory leak thường không biểu hiện dưới dạng những thất bại rõ ràng, chúng có thể tồn tại trong một hệ thống suốt nhiều năm. Chúng thường chỉ được phát hiện nhờ việc kiểm tra mã cẩn thận hoặc với sự trợ giúp của một công cụ debug gọi là *heap profiler*. Do đó, rất đáng để học cách dự đoán những vấn đề như thế này trước khi chúng xảy ra và ngăn chúng không xảy ra.

## Item 8: Tránh dùng finalizer và cleaner

**Finalizer là không thể đoán trước, thường nguy hiểm, và nói chung là không cần thiết.** Việc dùng chúng có thể gây ra hành vi thất thường, hiệu năng kém, và các vấn đề về tính khả chuyển. Finalizer có một vài công dụng chính đáng, mà chúng ta sẽ đề cập sau trong item này, nhưng theo nguyên tắc, bạn nên tránh chúng. Kể từ Java 9, finalizer đã bị deprecated, nhưng chúng vẫn đang được các thư viện Java sử dụng. Thứ thay thế cho finalizer trong Java 9 là *cleaner*. **Cleaner ít nguy hiểm hơn finalizer, nhưng vẫn không thể đoán trước, chậm, và nói chung là không cần thiết.** Các lập trình viên C++ được cảnh báo không nên coi finalizer hay cleaner là tương đương trong Java của destructor trong C++. Trong C++, destructor là cách thông thường để thu hồi các tài nguyên gắn với một đối tượng, một đối trọng cần thiết của constructor. Trong Java, garbage collector thu hồi vùng nhớ gắn với một đối tượng khi nó trở nên không thể truy cập được (unreachable), không đòi hỏi nỗ lực đặc biệt nào từ phía lập trình viên. Destructor trong C++ cũng được dùng để thu hồi các tài nguyên khác ngoài bộ nhớ. Trong Java, khối `try`-with-resources hoặc `try`-`finally` được dùng cho mục đích này (**Item 9**).

Một nhược điểm của finalizer và cleaner là không có gì đảm bảo chúng sẽ được thực thi kịp thời [JLS, 12.6]. Có thể mất một khoảng thời gian dài tùy ý từ lúc một đối tượng trở nên không thể truy cập được cho tới lúc finalizer hay cleaner của nó chạy. Điều này có nghĩa là bạn **không bao giờ nên làm bất cứ điều gì có tính cấp thiết về thời gian trong finalizer hoặc cleaner.** Ví dụ, sẽ là một sai lầm nghiêm trọng nếu dựa vào finalizer hay cleaner để đóng file vì các file descriptor đang mở là một tài nguyên có hạn. Nếu nhiều file bị bỏ mở do hệ thống chậm trễ trong việc chạy finalizer hay cleaner, chương trình có thể thất bại vì không thể mở thêm file nữa.

Mức độ kịp thời khi thực thi finalizer và cleaner chủ yếu phụ thuộc vào thuật toán thu gom rác, vốn khác nhau rất nhiều giữa các implementation. Hành vi của một chương trình phụ thuộc vào sự kịp thời trong việc thực thi finalizer hay cleaner cũng có thể thay đổi tương tự. Hoàn toàn có khả năng một chương trình như vậy chạy hoàn hảo trên JVM mà bạn dùng để kiểm thử rồi thất bại thảm hại trên JVM mà khách hàng quan trọng nhất của bạn ưa dùng.

Việc finalize chậm trễ không chỉ là vấn đề lý thuyết. Cung cấp finalizer cho một class có thể trì hoãn tùy ý việc thu hồi các instance của nó. Một đồng nghiệp đã debug một ứng dụng GUI chạy dài hạn bị chết một cách bí ẩn với `OutOfMemoryError`. Phân tích cho thấy vào thời điểm chết, ứng dụng có hàng nghìn đối tượng đồ họa nằm trong hàng đợi finalizer chỉ chờ được finalize và thu hồi. Đáng tiếc, thread finalizer chạy với độ ưu tiên thấp hơn một thread khác của ứng dụng, nên các đối tượng không được finalize với tốc độ mà chúng trở nên đủ điều kiện để finalize. Đặc tả ngôn ngữ không đảm bảo gì về việc thread nào sẽ thực thi finalizer, nên không có cách khả chuyển nào để ngăn loại vấn đề này ngoài việc kiêng dùng finalizer. Cleaner khá hơn finalizer một chút ở khía cạnh này vì tác giả class có quyền kiểm soát các cleaner thread của riêng mình, nhưng cleaner vẫn chạy ở nền, dưới sự kiểm soát của garbage collector, nên không thể có đảm bảo nào về việc dọn dẹp kịp thời.

Không chỉ đặc tả không đảm bảo finalizer hay cleaner sẽ chạy kịp thời; nó còn không đảm bảo chúng sẽ chạy. Hoàn toàn có khả năng, thậm chí có nhiều khả năng, một chương trình kết thúc mà không chạy chúng trên một số đối tượng không còn truy cập được. Hệ quả là bạn **không bao giờ nên dựa vào finalizer hay cleaner để cập nhật trạng thái bền vững (persistent state).** Ví dụ, dựa vào finalizer hay cleaner để giải phóng một khóa bền vững trên một tài nguyên dùng chung như cơ sở dữ liệu là cách hay để khiến toàn bộ hệ thống phân tán của bạn đứng khựng lại.

Đừng bị cám dỗ bởi các method `System.gc` và `System.runFinalization`. Chúng có thể làm tăng khả năng finalizer hay cleaner được thực thi, nhưng không đảm bảo điều đó. Từng có hai method tuyên bố đưa ra đảm bảo này: `System.runFinalizersOnExit` và người anh em xấu xa của nó, `Runtime.runFinalizersOnExit`. Các method này có lỗi chết người và đã bị deprecated suốt hàng thập kỷ [**ThreadStop**].

Một vấn đề khác của finalizer là một exception không được bắt ném ra trong quá trình finalize sẽ bị bỏ qua, và quá trình finalize của đối tượng đó chấm dứt [JLS, 12.6]. Các exception không được bắt có thể để lại các đối tượng khác ở trạng thái hỏng. Nếu một thread khác cố dùng một đối tượng bị hỏng như vậy, hành vi bất định tùy ý có thể xảy ra. Thông thường, một exception không được bắt sẽ chấm dứt thread và in ra stack trace, nhưng không phải vậy nếu nó xảy ra trong finalizer — nó thậm chí không in ra một cảnh báo. Cleaner không có vấn đề này vì thư viện dùng cleaner có quyền kiểm soát thread của nó.

**Có một cái giá nghiêm trọng về hiệu năng khi dùng finalizer và cleaner.** Trên máy của tôi, thời gian để tạo một đối tượng `AutoCloseable` đơn giản, đóng nó bằng `try`-with-resources, và để garbage collector thu hồi nó là khoảng 12 ns. Dùng finalizer thay vào đó làm tăng thời gian lên 550 ns. Nói cách khác, tạo và hủy đối tượng với finalizer chậm hơn khoảng 50 lần. Nguyên nhân chủ yếu là finalizer cản trở việc thu gom rác hiệu quả. Cleaner có tốc độ tương đương finalizer nếu bạn dùng chúng để dọn dẹp tất cả các instance của class (khoảng 500 ns mỗi instance trên máy của tôi), nhưng cleaner nhanh hơn nhiều nếu bạn chỉ dùng chúng như một lưới an toàn (safety net), như sẽ bàn dưới đây. Trong hoàn cảnh này, việc tạo, dọn dẹp, và hủy một đối tượng mất khoảng 66 ns trên máy của tôi, nghĩa là bạn trả giá gấp năm (chứ không phải năm mươi) lần cho sự bảo hiểm của một lưới an toàn *nếu* bạn không dùng đến nó.

**Finalizer có một vấn đề bảo mật nghiêm trọng: chúng khiến class của bạn dễ bị tấn công finalizer (finalizer attack).** Ý tưởng đằng sau tấn công finalizer rất đơn giản: Nếu một exception được ném ra từ constructor hoặc các method tương đương trong serialization — các method `readObject` và `readResolve` (**Chương 12**) — thì finalizer của một subclass độc hại có thể chạy trên đối tượng được xây dựng dở dang mà lẽ ra phải "chết yểu". Finalizer này có thể ghi lại một tham chiếu tới đối tượng trong một static field, ngăn nó bị thu gom rác. Một khi đối tượng dị dạng đã được ghi lại, việc gọi các method tùy ý trên đối tượng lẽ ra không bao giờ được phép tồn tại này trở nên đơn giản. **Ném exception từ constructor đáng lẽ phải đủ để ngăn một đối tượng ra đời; khi có finalizer, điều đó là không đủ.** Những tấn công như vậy có thể gây hậu quả thảm khốc. Final class miễn nhiễm với tấn công finalizer vì không ai có thể viết subclass độc hại của một final class. **Để bảo vệ các class không phải final khỏi tấn công finalizer, hãy viết một method** `finalize` **final không làm gì cả.**

Vậy bạn nên làm gì thay vì viết finalizer hay cleaner cho một class mà các đối tượng của nó đóng gói các tài nguyên cần được kết thúc, chẳng hạn file hay thread? Chỉ cần **cho class của bạn implement** `AutoCloseable`**,** và yêu cầu client gọi method `close` trên mỗi instance khi nó không còn cần thiết, thường là dùng `try`-with-resources để đảm bảo việc kết thúc ngay cả khi có exception (**Item 9**). Một chi tiết đáng nhắc đến là instance phải theo dõi việc nó đã bị đóng hay chưa: method `close` phải ghi lại trong một field rằng đối tượng không còn hợp lệ, và các method khác phải kiểm tra field này và ném `IllegalStateException` nếu chúng được gọi sau khi đối tượng đã bị đóng.

Vậy finalizer và cleaner tốt cho việc gì, nếu có? Chúng có lẽ có hai công dụng chính đáng. Một là đóng vai trò lưới an toàn phòng trường hợp chủ sở hữu tài nguyên quên gọi method `close` của nó. Mặc dù không có gì đảm bảo cleaner hay finalizer sẽ chạy kịp thời (hoặc chạy được), giải phóng tài nguyên muộn vẫn tốt hơn là không bao giờ nếu client không làm điều đó. Nếu bạn đang cân nhắc viết một finalizer lưới an toàn như vậy, hãy suy nghĩ thật kỹ xem sự bảo vệ đó có đáng với cái giá phải trả hay không. Một số class thư viện Java, như `FileInputStream`, `FileOutputStream`, và `ThreadPoolExecutor` có finalizer đóng vai trò lưới an toàn.

Công dụng chính đáng thứ hai của finalizer và cleaner liên quan đến các đối tượng có *native peer*. Native peer là một đối tượng native (không phải Java) mà một đối tượng bình thường ủy quyền tới thông qua các native method. Vì native peer không phải là đối tượng bình thường, garbage collector không biết về nó và không thể thu hồi nó khi Java peer của nó được thu hồi. Finalizer hay cleaner có thể là phương tiện phù hợp cho nhiệm vụ này, với giả định hiệu năng chấp nhận được và native peer không nắm giữ tài nguyên quan trọng nào. Nếu hiệu năng không chấp nhận được hoặc native peer nắm giữ tài nguyên phải được thu hồi kịp thời, class nên có method `close`, như đã mô tả ở trên.

Cleaner hơi khó dùng. Dưới đây là một class `Room` đơn giản minh họa cơ chế này. Giả sử các phòng phải được dọn dẹp trước khi bị thu hồi. Class `Room` implement `AutoCloseable`; việc lưới an toàn dọn dẹp tự động của nó dùng cleaner chỉ là chi tiết cài đặt. Không giống finalizer, cleaner không làm ô nhiễm public API của class:

```java
// An autocloseable class using a cleaner as a safety net
public class Room implements AutoCloseable {
    private static final Cleaner cleaner = Cleaner.create();

    // Resource that requires cleaning. Must not refer to Room!
    private static class State implements Runnable {
        int numJunkPiles; // Number of junk piles in this room

        State(int numJunkPiles) {
            this.numJunkPiles = numJunkPiles;
        }

        // Invoked by close method or cleaner
        @Override public void run() {
            System.out.println("Cleaning room");
            numJunkPiles = 0;
        }
    }

    // The state of this room, shared with our cleanable
    private final State state;

    // Our cleanable. Cleans the room when it’s eligible for gc
    private final Cleaner.Cleanable cleanable;

    public Room(int numJunkPiles) {
        state = new State(numJunkPiles);
        cleanable = cleaner.register(this, state);
    }

    @Override public void close() {
        cleanable.clean();
    }
}
```

Static nested class `State` nắm giữ các tài nguyên mà cleaner cần để dọn phòng. Trong trường hợp này, đó đơn giản là field `numJunkPiles`, biểu thị mức độ bừa bộn của căn phòng. Thực tế hơn, nó có thể là một `long` final chứa con trỏ tới một native peer. `State` implement `Runnable`, và method `run` của nó được gọi nhiều nhất một lần, bởi `Cleanable` mà chúng ta nhận được khi đăng ký instance `State` với cleaner trong constructor của `Room`. Lời gọi tới method `run` sẽ được kích hoạt bởi một trong hai điều: Thông thường nó được kích hoạt bởi lời gọi method `close` của `Room`, method này gọi method clean của `Cleanable`. Nếu client không gọi method `close` cho đến khi một instance `Room` đủ điều kiện được thu gom rác, cleaner sẽ (hy vọng là) gọi method `run` của `State`.

Điều then chốt là một instance `State` không được tham chiếu tới instance `Room` của nó. Nếu có, nó sẽ tạo ra một vòng tròn ngăn instance `Room` trở nên đủ điều kiện để thu gom rác (và ngăn nó được dọn dẹp tự động). Do đó, `State` phải là một *static* nested class vì các nested class không static chứa tham chiếu tới instance bao ngoài của chúng (**Item 24**). Tương tự, không nên dùng lambda vì chúng dễ dàng bắt giữ (capture) tham chiếu tới các đối tượng bao ngoài.

Như đã nói ở trên, cleaner của `Room` chỉ được dùng như một lưới an toàn. Nếu client bao mọi lần khởi tạo `Room` trong khối `try`-with-resource, việc dọn dẹp tự động sẽ không bao giờ cần đến. Client ngoan ngoãn này minh họa hành vi đó:

```java
public class Adult {
    public static void main(String[] args) {
        try (Room myRoom = new Room(7)) {
            System.out.println("Goodbye");
        }
    }
}
```

Như bạn mong đợi, chạy chương trình `Adult` in ra `Goodbye`, theo sau là `Cleaning room`. Nhưng còn chương trình hư hỏng này, không bao giờ dọn phòng của mình, thì sao?

```java
public class Teenager {
    public static void main(String[] args) {
        new Room(99);
        System.out.println("Peace out");
    }
}
```

Bạn có thể mong đợi nó in ra `Peace out`, theo sau là `Cleaning room`, nhưng trên máy của tôi, nó không bao giờ in `Cleaning room`; nó chỉ thoát ra. Đây chính là tính không thể đoán trước mà chúng ta đã nói ở trên. Đặc tả của `Cleaner` nói: "Hành vi của cleaner trong lúc `System.exit` là tùy thuộc implementation. Không có đảm bảo nào về việc các hành động dọn dẹp có được gọi hay không." Mặc dù đặc tả không nói ra, điều tương tự cũng đúng với việc thoát chương trình bình thường. Trên máy của tôi, thêm dòng `System.gc()` vào method `main` của `Teenager` là đủ để nó in `Cleaning room` trước khi thoát, nhưng không có gì đảm bảo bạn sẽ thấy hành vi tương tự trên máy của mình.

Tóm lại, đừng dùng cleaner, hoặc trong các phiên bản trước Java 9, finalizer, ngoại trừ để làm lưới an toàn hoặc để kết thúc các tài nguyên native không quan trọng. Ngay cả khi đó, hãy cảnh giác với tính bất định và các hệ quả về hiệu năng.

## Item 9: Ưu tiên `try`-with-resources thay vì `try`-`finally`

Các thư viện Java bao gồm nhiều tài nguyên phải được đóng thủ công bằng cách gọi method `close`. Ví dụ bao gồm `InputStream`, `OutputStream`, và `java.sql.Connection`. Việc đóng tài nguyên thường bị client bỏ qua, với những hậu quả hiệu năng thảm khốc có thể đoán trước. Mặc dù nhiều tài nguyên trong số này dùng finalizer làm lưới an toàn, finalizer không hoạt động tốt lắm (**Item 8**).

Trong lịch sử, câu lệnh `try`-`finally` là cách tốt nhất để đảm bảo một tài nguyên sẽ được đóng đúng cách, ngay cả khi có exception hay return:

```java
// try-finally - No longer the best way to close resources!
static String firstLineOfFile(String path) throws IOException {
    BufferedReader br = new BufferedReader(new FileReader(path));
    try {
        return br.readLine();
    } finally {
        br.close();
    }
}
```

Trông có vẻ không tệ, nhưng nó trở nên tệ hơn khi bạn thêm tài nguyên thứ hai:

```java
// try-finally is ugly when used with more than one resource!
static void copy(String src, String dst) throws IOException {
    InputStream in = new FileInputStream(src);
    try {
        OutputStream out = new FileOutputStream(dst);
        try {
            byte[] buf = new byte[BUFFER_SIZE];
            int n;
            while ((n = in.read(buf)) >= 0)
                out.write(buf, 0, n);
        } finally {
            out.close();
        }
    } finally {
        in.close();
    }
}
```

Có thể khó tin, nhưng ngay cả những lập trình viên giỏi cũng làm sai điều này trong hầu hết các trường hợp. Trước hết, chính tôi đã làm sai ở trang 88 của cuốn *Java Puzzlers* [**Bloch05**], và không ai nhận ra trong nhiều năm. Trên thực tế, hai phần ba số lần dùng method `close` trong các thư viện Java là sai vào năm 2007.

Ngay cả mã đúng để đóng tài nguyên bằng câu lệnh `try`-`finally`, như minh họa trong hai ví dụ mã trên, cũng có một khiếm khuyết tinh tế. Mã trong cả khối `try` lẫn khối `finally` đều có thể ném exception. Ví dụ, trong method `firstLineOfFile`, lời gọi `readLine` có thể ném exception do lỗi ở thiết bị vật lý bên dưới, và sau đó lời gọi `close` cũng có thể thất bại vì cùng lý do. Trong hoàn cảnh này, exception thứ hai xóa sạch hoàn toàn exception thứ nhất. Không có dấu vết nào của exception thứ nhất trong stack trace của exception, điều này có thể làm phức tạp đáng kể việc debug trong các hệ thống thực — thường thì exception thứ nhất mới là thứ bạn muốn thấy để chẩn đoán vấn đề. Mặc dù có thể viết mã để triệt tiêu exception thứ hai và giữ lại exception thứ nhất, hầu như không ai làm vậy vì nó quá dài dòng.

Tất cả những vấn đề này được giải quyết chỉ trong một lần khi Java 7 giới thiệu câu lệnh `try`-with-resources [JLS, 14.20.3]. Để có thể dùng được với cấu trúc này, một tài nguyên phải implement interface `AutoCloseable`, vốn chỉ gồm một method `close` trả về `void`. Nhiều class và interface trong các thư viện Java và trong các thư viện bên thứ ba hiện nay implement hoặc mở rộng `AutoCloseable`. Nếu bạn viết một class biểu diễn một tài nguyên phải được đóng, class của bạn cũng nên implement `AutoCloseable`.

Đây là hình hài của ví dụ đầu tiên khi dùng `try`-with-resources:

```java
// try-with-resources - the best way to close resources!
static String firstLineOfFile(String path) throws IOException {
    try (BufferedReader br = new BufferedReader(
           new FileReader(path))) {
       return br.readLine();
    }
}
```

Và đây là hình hài của ví dụ thứ hai khi dùng `try`-with-resources:

```java
// try-with-resources on multiple resources - short and sweet
static void copy(String src, String dst) throws IOException {
    try (InputStream   in = new FileInputStream(src);
         OutputStream out = new FileOutputStream(dst)) {
        byte[] buf = new byte[BUFFER_SIZE];
        int n;
        while ((n = in.read(buf)) >= 0)
            out.write(buf, 0, n);
    }
}
```

Các phiên bản `try`-with-resources không chỉ ngắn hơn và dễ đọc hơn bản gốc, mà còn cung cấp khả năng chẩn đoán tốt hơn nhiều. Hãy xét method `firstLineOfFile`. Nếu exception được ném ra bởi cả lời gọi `readLine` lẫn lời gọi `close` (vô hình), exception sau sẽ bị *triệt tiêu* (suppressed) để giữ lại exception trước. Trên thực tế, nhiều exception có thể bị triệt tiêu để bảo toàn exception mà bạn thực sự muốn thấy. Các exception bị triệt tiêu này không đơn thuần bị vứt bỏ; chúng được in trong stack trace kèm ghi chú rằng chúng đã bị triệt tiêu. Bạn cũng có thể truy cập chúng bằng lập trình với method `getSuppressed`, được thêm vào `Throwable` trong Java 7.

Bạn có thể đặt các mệnh đề catch trên câu lệnh `try`-with-resources, giống như trên câu lệnh `try`-`finally` thông thường. Điều này cho phép bạn xử lý exception mà không làm bẩn mã với thêm một tầng lồng nhau. Như một ví dụ hơi gượng ép, đây là một phiên bản của method `firstLineOfFile` không ném exception, mà nhận một giá trị mặc định để trả về nếu nó không thể mở file hoặc đọc từ file:

```java
// try-with-resources with a catch clause
static String firstLineOfFile(String path, String defaultVal) {
    try (BufferedReader br = new BufferedReader(
           new FileReader(path))) {
        return br.readLine();
    } catch (IOException e) {
        return defaultVal;
    }
}
```

Bài học rất rõ ràng: Hãy luôn dùng `try`-with-resources thay cho `try-finally` khi làm việc với các tài nguyên phải được đóng. Mã thu được ngắn hơn và rõ ràng hơn, và các exception mà nó sinh ra hữu ích hơn. Câu lệnh `try-`with-resources giúp dễ dàng viết mã đúng khi dùng các tài nguyên phải được đóng, điều gần như bất khả thi khi dùng `try`-`finally`.
