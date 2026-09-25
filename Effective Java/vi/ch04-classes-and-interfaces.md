# Chương 4. Class và Interface

Class và interface nằm ở trung tâm của ngôn ngữ lập trình Java. Chúng là những đơn vị trừu tượng hóa cơ bản của ngôn ngữ. Ngôn ngữ cung cấp nhiều thành phần mạnh mẽ mà bạn có thể dùng để thiết kế class và interface. Chương này chứa các hướng dẫn giúp bạn tận dụng tốt nhất những thành phần đó, để class và interface của bạn dễ dùng, vững chắc và linh hoạt.

## Item 15: Giảm thiểu khả năng truy cập của class và thành viên

Yếu tố quan trọng nhất phân biệt một component được thiết kế tốt với một component được thiết kế kém là mức độ mà component đó che giấu dữ liệu nội bộ và các chi tiết cài đặt khác khỏi những component khác. Một component được thiết kế tốt che giấu toàn bộ chi tiết cài đặt của nó, tách bạch rõ ràng API khỏi phần cài đặt. Khi đó các component chỉ giao tiếp với nhau thông qua API và không hề biết gì về hoạt động bên trong của nhau. Khái niệm này, được gọi là *information hiding* (che giấu thông tin) hay *encapsulation* (đóng gói), là một nguyên lý nền tảng của thiết kế phần mềm [**Parnas72**].

Information hiding quan trọng vì nhiều lý do, phần lớn xuất phát từ việc nó *tách rời* (decouple) các component cấu thành hệ thống, cho phép chúng được phát triển, kiểm thử, tối ưu, sử dụng, hiểu và sửa đổi một cách độc lập. Điều này đẩy nhanh quá trình phát triển hệ thống vì các component có thể được phát triển song song. Nó giảm nhẹ gánh nặng bảo trì vì các component có thể được hiểu nhanh hơn, được debug hoặc thay thế mà ít lo làm hỏng các component khác. Mặc dù bản thân information hiding không tạo ra hiệu năng tốt, nó cho phép tinh chỉnh hiệu năng một cách hiệu quả: một khi hệ thống đã hoàn thiện và việc profiling đã xác định được những component nào đang gây ra vấn đề hiệu năng (**Item 67**), các component đó có thể được tối ưu mà không ảnh hưởng đến tính đúng đắn của những component còn lại. Information hiding làm tăng khả năng tái sử dụng phần mềm vì các component không bị ràng buộc chặt chẽ thường tỏ ra hữu ích trong những ngữ cảnh khác ngoài ngữ cảnh mà chúng được phát triển cho. Cuối cùng, information hiding giảm rủi ro khi xây dựng các hệ thống lớn vì từng component riêng lẻ vẫn có thể thành công ngay cả khi cả hệ thống thì không.

Java có nhiều cơ chế hỗ trợ information hiding. Cơ chế *access control* (kiểm soát truy cập) [JLS, 6.6] quy định *khả năng truy cập* (accessibility) của class, interface và thành viên. Khả năng truy cập của một thực thể được xác định bởi vị trí khai báo của nó và bởi access modifier nào (`private`, `protected`, và `public`), nếu có, xuất hiện trong khai báo. Sử dụng đúng các modifier này là điều thiết yếu để che giấu thông tin.

Quy tắc chung rất đơn giản: **hãy làm cho mỗi class hoặc thành viên ít có khả năng truy cập nhất có thể.** Nói cách khác, hãy dùng mức truy cập thấp nhất có thể mà vẫn đảm bảo phần mềm bạn viết hoạt động đúng.

Với các class và interface cấp cao nhất (top-level, không lồng nhau), chỉ có hai mức truy cập khả dĩ: *package-private* và *public*. Nếu bạn khai báo một class hay interface top-level với modifier `public`, nó sẽ là public; nếu không, nó sẽ là package-private. Nếu một class hay interface top-level có thể được làm package-private, thì nên làm như vậy. Bằng cách làm nó package-private, bạn biến nó thành một phần của cài đặt thay vì API được xuất ra, và bạn có thể sửa đổi, thay thế hoặc loại bỏ nó trong một phiên bản sau mà không sợ làm hỏng các client hiện có. Nếu bạn làm nó public, bạn có nghĩa vụ hỗ trợ nó mãi mãi để duy trì tính tương thích.

Nếu một class hay interface top-level package-private chỉ được dùng bởi một class duy nhất, hãy cân nhắc biến class top-level đó thành một private static nested class của class duy nhất sử dụng nó (**Item 24**). Điều này thu hẹp khả năng truy cập của nó từ tất cả các class trong package xuống còn một class dùng nó. Nhưng việc giảm khả năng truy cập của một class public không cần thiết quan trọng hơn nhiều so với việc giảm khả năng truy cập của một class top-level package-private: class public là một phần API của package, trong khi class top-level package-private vốn đã là một phần của cài đặt.

Với các thành viên (field, method, nested class và nested interface), có bốn mức truy cập khả dĩ, được liệt kê ở đây theo thứ tự tăng dần về khả năng truy cập:

- **private**—Thành viên chỉ có thể được truy cập từ bên trong class top-level nơi nó được khai báo.

- **package-private**—Thành viên có thể được truy cập từ bất kỳ class nào trong package nơi nó được khai báo. Về mặt kỹ thuật được gọi là truy cập *package*, đây là mức truy cập bạn nhận được nếu không chỉ định access modifier nào (ngoại trừ các thành viên của interface, vốn mặc định là public).

- **protected**—Thành viên có thể được truy cập từ các subclass của class nơi nó được khai báo (với một vài hạn chế [JLS, 6.6.2]) và từ bất kỳ class nào trong package nơi nó được khai báo.

- **public**—Thành viên có thể được truy cập từ bất cứ đâu.

Sau khi thiết kế cẩn thận API public của class, phản xạ của bạn nên là làm cho mọi thành viên khác đều private. Chỉ khi một class khác trong cùng package thực sự cần truy cập một thành viên thì bạn mới nên bỏ modifier `private`, làm cho thành viên đó trở thành package-private. Nếu bạn thấy mình làm điều này thường xuyên, bạn nên xem xét lại thiết kế hệ thống để xem liệu một cách phân rã khác có thể cho ra các class ít phụ thuộc lẫn nhau hơn hay không. Dù vậy, cả thành viên private lẫn package-private đều là một phần cài đặt của class và thường không ảnh hưởng đến API được xuất ra. Tuy nhiên, các field này có thể "rò rỉ" vào API được xuất ra nếu class implement `Serializable` (**Item 86** và **87**).

Với các thành viên của class public, khả năng truy cập tăng vọt khi mức truy cập chuyển từ package-private sang protected. Một thành viên protected là một phần của API được xuất ra của class và phải được hỗ trợ mãi mãi. Hơn nữa, một thành viên protected của một class được xuất ra thể hiện một cam kết công khai về một chi tiết cài đặt (**Item 19**). Nhu cầu dùng thành viên protected nên là tương đối hiếm.

Có một quy tắc then chốt hạn chế khả năng giảm mức truy cập của method. Nếu một method override một method của superclass, nó không thể có mức truy cập hạn chế hơn trong subclass so với trong superclass [JLS, 8.4.8.3]. Điều này là cần thiết để đảm bảo rằng một instance của subclass có thể dùng được ở bất cứ nơi nào mà một instance của superclass dùng được (*nguyên lý thay thế Liskov*, xem **Item 10**). Nếu bạn vi phạm quy tắc này, trình biên dịch sẽ báo lỗi khi bạn cố biên dịch subclass. Một trường hợp đặc biệt của quy tắc này là nếu một class implement một interface, thì tất cả các method của class có trong interface đó phải được khai báo public trong class.

Để thuận tiện cho việc kiểm thử code, bạn có thể bị cám dỗ làm cho một class, interface hay thành viên dễ truy cập hơn mức cần thiết. Điều này chấp nhận được đến một mức nào đó. Có thể chấp nhận việc biến một thành viên private của một class public thành package-private để kiểm thử nó, nhưng không thể chấp nhận việc nâng khả năng truy cập lên cao hơn thế. Nói cách khác, không thể chấp nhận việc biến một class, interface hay thành viên thành một phần của API được xuất ra của package chỉ để thuận tiện cho kiểm thử. May mắn thay, điều đó cũng không cần thiết vì các test có thể được chạy như một phần của package đang được kiểm thử, nhờ đó truy cập được các thành phần package-private của nó.

**Các instance field của class public hiếm khi nên là public** (**Item 16**). Nếu một instance field không phải là final hoặc là một tham chiếu đến một object mutable (có thể thay đổi), thì bằng cách làm nó public, bạn từ bỏ khả năng giới hạn các giá trị có thể được lưu trong field đó. Điều này có nghĩa là bạn từ bỏ khả năng thực thi các bất biến (invariant) liên quan đến field. Bạn cũng từ bỏ khả năng thực hiện bất kỳ hành động nào khi field bị sửa đổi, vì vậy **các class có field public mutable thường không thread-safe.** Ngay cả khi một field là final và tham chiếu đến một object immutable, việc làm nó public khiến bạn mất đi sự linh hoạt để chuyển sang một cách biểu diễn dữ liệu nội bộ mới trong đó field này không còn tồn tại.

Lời khuyên tương tự áp dụng cho các static field, với một ngoại lệ. Bạn có thể công khai các hằng số thông qua các field public static final, với giả định rằng các hằng số đó là một phần không thể thiếu của sự trừu tượng mà class cung cấp. Theo quy ước, các field như vậy có tên gồm các chữ cái in hoa, các từ được phân cách bằng dấu gạch dưới (**Item 68**). Điều cốt yếu là các field này phải chứa hoặc giá trị kiểu nguyên thủy (primitive) hoặc tham chiếu đến các object immutable (**Item 17**). Một field chứa tham chiếu đến một object mutable có tất cả những bất lợi của một field không phải final. Mặc dù tham chiếu không thể bị sửa đổi, object được tham chiếu thì có thể—với những hậu quả tai hại.

Lưu ý rằng một mảng có độ dài khác không luôn luôn mutable, vì vậy **việc một class có một field mảng public static final, hoặc một accessor trả về một field như vậy, là sai.** Nếu một class có field hoặc accessor như thế, client sẽ có thể sửa đổi nội dung của mảng. Đây là một nguồn thường gặp của các lỗ hổng bảo mật:

```java
// Potential security hole!
public static final Thing[] VALUES = { ... };
```

Hãy cẩn thận với việc một số IDE sinh ra các accessor trả về tham chiếu đến các field mảng private, dẫn đến chính xác vấn đề này. Có hai cách để khắc phục. Bạn có thể làm cho mảng public trở thành private và thêm một list public immutable:

```java
private static final Thing[] PRIVATE_VALUES = { ... };
public static final List<Thing> VALUES =
   Collections.unmodifiableList(Arrays.asList(PRIVATE_VALUES));
```

Hoặc bạn có thể làm cho mảng trở thành private và thêm một method public trả về một bản sao của mảng private đó:

```java
private static final Thing[] PRIVATE_VALUES = { ... };
public static final Thing[] values() {
    return PRIVATE_VALUES.clone();
}
```

Để chọn giữa hai phương án này, hãy nghĩ xem client có khả năng làm gì với kết quả. Kiểu trả về nào sẽ tiện lợi hơn? Kiểu nào sẽ cho hiệu năng tốt hơn?

Kể từ Java 9, có thêm hai mức truy cập ngầm định được đưa vào như một phần của *hệ thống module*. Một module là một nhóm các package, giống như một package là một nhóm các class. Một module có thể xuất ra một cách tường minh một số package của nó thông qua các *khai báo export* trong *khai báo module* của nó (theo quy ước được chứa trong một file nguồn tên là `module-info.java`). Các thành viên public và protected của những package không được xuất ra trong một module là không thể truy cập từ bên ngoài module; bên trong module, khả năng truy cập không bị ảnh hưởng bởi các khai báo export. Sử dụng hệ thống module cho phép bạn chia sẻ các class giữa các package trong một module mà không làm chúng hiển thị với toàn thế giới. Các thành viên public và protected của các class public trong những package không được xuất ra tạo nên hai mức truy cập ngầm định này, chúng là những tương tự nội-module của các mức public và protected thông thường. Nhu cầu chia sẻ kiểu này tương đối hiếm và thường có thể được loại bỏ bằng cách sắp xếp lại các class trong các package của bạn.

Không giống bốn mức truy cập chính, hai mức dựa trên module phần lớn chỉ mang tính khuyến nghị. Nếu bạn đặt file JAR của một module lên class path của ứng dụng thay vì module path, các package trong module đó sẽ trở lại hành vi phi-module của chúng: tất cả các thành viên public và protected của các class public trong các package đó có khả năng truy cập bình thường, bất kể các package có được module xuất ra hay không [Reinhold, 1.2]. Nơi duy nhất mà các mức truy cập mới được đưa vào này được thực thi nghiêm ngặt là chính JDK: các package không được xuất ra trong các thư viện Java thực sự không thể truy cập được từ bên ngoài module của chúng.

Không những sự bảo vệ truy cập mà module mang lại có ích lợi hạn chế đối với lập trình viên Java thông thường và phần lớn chỉ mang tính khuyến nghị; để tận dụng nó, bạn còn phải nhóm các package thành module, khai báo tường minh mọi phụ thuộc của chúng trong các khai báo module, sắp xếp lại cây mã nguồn, và thực hiện các thao tác đặc biệt để xử lý bất kỳ truy cập nào đến các package chưa được module hóa từ bên trong module của bạn [Reinhold, 3]. Còn quá sớm để nói liệu module có được sử dụng rộng rãi bên ngoài chính JDK hay không. Trong lúc chờ đợi, có vẻ tốt nhất là nên tránh chúng trừ khi bạn có nhu cầu thực sự cấp thiết.

Tóm lại, bạn nên giảm khả năng truy cập của các thành phần chương trình nhiều nhất có thể (trong chừng mực hợp lý). Sau khi thiết kế cẩn thận một API public tối thiểu, bạn nên ngăn không cho bất kỳ class, interface hay thành viên lạc lõng nào trở thành một phần của API. Ngoại trừ các field public static final đóng vai trò hằng số, các class public không nên có field public nào. Hãy đảm bảo rằng các object được tham chiếu bởi các field public static final là immutable.

## Item 16: Trong class public, hãy dùng accessor method thay vì field public

Đôi khi, bạn có thể bị cám dỗ viết những class thoái hóa không có mục đích gì khác ngoài việc gom nhóm các instance field:

```java
// Degenerate classes like this should not be public!
class Point {
    public double x;
    public double y;
}
```

Vì các field dữ liệu của những class như vậy được truy cập trực tiếp, các class này không mang lại lợi ích của *encapsulation* (**Item 15**). Bạn không thể thay đổi cách biểu diễn mà không thay đổi API, bạn không thể thực thi các bất biến, và bạn không thể thực hiện hành động phụ trợ khi một field được truy cập. Những lập trình viên hướng đối tượng cứng rắn cho rằng những class như vậy là điều đáng ghét và luôn nên được thay thế bằng các class có field private cùng các *accessor method* public (getter) và, với các class mutable, các *mutator* (setter):

```java
// Encapsulation of data by accessor methods and mutators
class Point {
    private double x;
    private double y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() { return x; }
    public double getY() { return y; }

    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }
}
```

Chắc chắn rằng những người cứng rắn đó đúng khi nói về các class public: **nếu một class có thể được truy cập từ bên ngoài package của nó, hãy cung cấp các accessor method** để giữ được sự linh hoạt thay đổi cách biểu diễn nội bộ của class. Nếu một class public công khai các field dữ liệu của nó, mọi hy vọng thay đổi cách biểu diễn đều tiêu tan vì code của client có thể đã được phân phối khắp nơi.

Tuy nhiên, **nếu một class là package-private hoặc là một private nested class, thì việc công khai các field dữ liệu của nó về bản chất không có gì sai**—với giả định rằng chúng mô tả đầy đủ sự trừu tượng mà class cung cấp. Cách tiếp cận này tạo ra ít sự rườm rà hơn so với cách dùng accessor method, cả trong định nghĩa class lẫn trong code client sử dụng nó. Mặc dù code client bị gắn với cách biểu diễn nội bộ của class, code này bị giới hạn trong package chứa class đó. Nếu việc thay đổi cách biểu diễn trở nên cần thiết, bạn có thể thực hiện thay đổi mà không đụng đến bất kỳ code nào bên ngoài package. Trong trường hợp private nested class, phạm vi thay đổi còn bị giới hạn hơn nữa trong class bao ngoài.

Một số class trong các thư viện nền tảng Java vi phạm lời khuyên rằng class public không nên công khai field trực tiếp. Những ví dụ nổi bật bao gồm các class `Point` và `Dimension` trong package `java.awt`. Thay vì là những ví dụ đáng noi theo, các class này nên được xem như những bài học cảnh tỉnh. Như được mô tả trong **Item 67**, quyết định công khai phần bên trong của class `Dimension` đã dẫn đến một vấn đề hiệu năng nghiêm trọng mà đến nay vẫn còn tồn tại.

Mặc dù việc một class public công khai field trực tiếp không bao giờ là ý hay, nó ít gây hại hơn nếu các field là immutable. Bạn không thể thay đổi cách biểu diễn của một class như vậy mà không thay đổi API của nó, và bạn không thể thực hiện hành động phụ trợ khi một field được đọc, nhưng bạn có thể thực thi các bất biến. Ví dụ, class này đảm bảo rằng mỗi instance biểu diễn một thời điểm hợp lệ:

```java
// Public class with exposed immutable fields - questionable
public final class Time {
    private static final int HOURS_PER_DAY    = 24;
    private static final int MINUTES_PER_HOUR = 60;

    public final int hour;
    public final int minute;

    public Time(int hour, int minute) {
        if (hour < 0 || hour >= HOURS_PER_DAY)
           throw new IllegalArgumentException("Hour: " + hour);
        if (minute < 0 || minute >= MINUTES_PER_HOUR)
           throw new IllegalArgumentException("Min: " + minute);
        this.hour = hour;
        this.minute = minute;
    }
    ... // Remainder omitted
}
```

Tóm lại, các class public không bao giờ nên công khai các field mutable. Việc class public công khai các field immutable thì ít gây hại hơn, dù vẫn đáng ngờ. Tuy nhiên, đôi khi việc các class package-private hoặc private nested class công khai field, dù mutable hay immutable, lại là điều đáng mong muốn.

## Item 17: Giảm thiểu tính mutable

Một class immutable đơn giản là một class mà các instance của nó không thể bị sửa đổi. Toàn bộ thông tin chứa trong mỗi instance là cố định trong suốt vòng đời của object, vì vậy không bao giờ có thể quan sát thấy thay đổi nào. Các thư viện nền tảng Java chứa nhiều class immutable, bao gồm `String`, các class boxed primitive, cùng với `BigInteger` và `BigDecimal`. Có nhiều lý do chính đáng cho điều này: Các class immutable dễ thiết kế, cài đặt và sử dụng hơn các class mutable. Chúng ít dễ gây lỗi hơn và an toàn hơn.

Để làm cho một class immutable, hãy tuân theo năm quy tắc sau:

1. **Không cung cấp các method làm thay đổi trạng thái của object** (được gọi là *mutator*).

2. **Đảm bảo rằng class không thể bị kế thừa.** Điều này ngăn các subclass bất cẩn hoặc có ác ý phá hoại hành vi immutable của class bằng cách hành xử như thể trạng thái của object đã thay đổi. Việc ngăn kế thừa thường được thực hiện bằng cách làm cho class final, nhưng có một phương án thay thế mà chúng ta sẽ bàn sau.

3. **Làm cho tất cả các field là final.** Điều này thể hiện rõ ràng ý định của bạn theo cách được hệ thống thực thi. Ngoài ra, nó cần thiết để đảm bảo hành vi đúng đắn nếu một tham chiếu đến một instance mới tạo được truyền từ thread này sang thread khác mà không có đồng bộ hóa, như được nêu rõ trong *memory model* [JLS, 17.5; Goetz06, 16].

4. **Làm cho tất cả các field là private.** Điều này ngăn client có được quyền truy cập vào các object mutable được tham chiếu bởi các field và sửa đổi trực tiếp những object này. Mặc dù về mặt kỹ thuật các class immutable được phép có các field public final chứa giá trị primitive hoặc tham chiếu đến các object immutable, điều đó không được khuyến khích vì nó cản trở việc thay đổi cách biểu diễn nội bộ trong một phiên bản sau (**Item 15** và **16**).

5. **Đảm bảo quyền truy cập độc quyền đối với mọi thành phần mutable.** Nếu class của bạn có bất kỳ field nào tham chiếu đến các object mutable, hãy đảm bảo rằng client của class không thể lấy được tham chiếu đến những object này. Không bao giờ khởi tạo một field như vậy bằng một tham chiếu object do client cung cấp, hay trả về field đó từ một accessor. Hãy tạo các *defensive copy* (bản sao phòng vệ) (**Item 50**) trong constructor, accessor và method `readObject` (**Item 88**).

Nhiều class ví dụ trong các item trước là immutable. Một class như vậy là `PhoneNumber` trong **Item 11**, có accessor cho mỗi thuộc tính nhưng không có mutator tương ứng. Đây là một ví dụ phức tạp hơn một chút:

```java
// Immutable complex number class
public final  class Complex {
    private final  double re;
    private final  double im;

    public Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    public double realPart()      { return re; }
    public double imaginaryPart() { return im; }

    public Complex plus(Complex c) {
        return new Complex(re + c.re, im + c.im);
    }

    public Complex minus(Complex c) {
        return new Complex(re - c.re, im - c.im);
    }

    public Complex times(Complex c) {
        return new Complex(re * c.re - im * c.im,
                           re * c.im + im * c.re);
    }

    public Complex dividedBy(Complex c) {
        double tmp = c.re * c.re + c.im * c.im;
        return new Complex((re * c.re + im * c.im) / tmp,
                           (im * c.re - re * c.im) / tmp);
    }

    @Override public boolean equals(Object o) {
       if (o == this)
           return true;
       if (!(o instanceof Complex))
           return false;
       Complex c = (Complex) o;

       // See page 47 to find out why we use compare instead of ==
       return Double.compare(c.re, re) == 0
           && Double.compare(c.im, im) == 0;
    }
    @Override public int hashCode() {
        return 31 * Double.hashCode(re) + Double.hashCode(im);
    }

    @Override public String toString() {
        return "(" + re + " + " + im + "i)";
    }
}
```

Class này biểu diễn một *số phức* (một số có cả phần thực và phần ảo). Ngoài các method chuẩn của `Object`, nó cung cấp accessor cho phần thực và phần ảo, và cung cấp bốn phép toán số học cơ bản: cộng, trừ, nhân và chia. Hãy để ý cách các phép toán số học tạo ra và trả về một instance `Complex` mới thay vì sửa đổi instance hiện tại. Mẫu này được gọi là cách tiếp cận *hàm* (functional) vì các method trả về kết quả của việc áp dụng một hàm lên toán hạng của chúng mà không sửa đổi nó. Hãy đối chiếu với cách tiếp cận *thủ tục* (procedural) hay *mệnh lệnh* (imperative), trong đó các method áp dụng một thủ tục lên toán hạng của chúng, khiến trạng thái của nó thay đổi. Lưu ý rằng tên các method là giới từ (chẳng hạn `plus`) thay vì động từ (chẳng hạn `add`). Điều này nhấn mạnh rằng các method không thay đổi giá trị của object. Các class `BigInteger` và `BigDecimal` đã *không* tuân theo quy ước đặt tên này, và điều đó đã dẫn đến nhiều lỗi sử dụng.

Cách tiếp cận hàm có thể trông không tự nhiên nếu bạn chưa quen với nó, nhưng nó cho phép tính immutable, thứ mang lại nhiều lợi thế. **Các object immutable thì đơn giản.** Một object immutable chỉ có thể ở đúng một trạng thái, trạng thái mà nó được tạo ra. Nếu bạn đảm bảo rằng mọi constructor đều thiết lập các bất biến của class, thì chắc chắn rằng các bất biến này sẽ luôn đúng mãi mãi, mà không cần thêm nỗ lực nào từ phía bạn hay từ phía lập trình viên sử dụng class. Ngược lại, các object mutable có thể có không gian trạng thái phức tạp tùy ý. Nếu tài liệu không cung cấp mô tả chính xác về các chuyển đổi trạng thái được thực hiện bởi các mutator method, việc sử dụng một class mutable một cách đáng tin cậy có thể khó hoặc bất khả thi.

**Các object immutable vốn dĩ thread-safe; chúng không cần đồng bộ hóa.** Chúng không thể bị làm hỏng bởi nhiều thread truy cập đồng thời. Đây rõ ràng là cách dễ nhất để đạt được thread safety. Vì không thread nào có thể quan sát thấy bất kỳ tác động nào của thread khác lên một object immutable, **các object immutable có thể được chia sẻ tự do.** Do đó, các class immutable nên khuyến khích client tái sử dụng các instance hiện có bất cứ khi nào có thể. Một cách dễ dàng để làm điều này là cung cấp các hằng số public static final cho những giá trị thường dùng. Ví dụ, class `Complex` có thể cung cấp các hằng số sau:

```java
public static final Complex ZERO = new Complex(0, 0);
public static final Complex ONE  = new Complex(1, 0);
public static final Complex I    = new Complex(0, 1);
```

Cách tiếp cận này có thể được đẩy thêm một bước. Một class immutable có thể cung cấp các static factory (**Item 1**) để cache các instance thường được yêu cầu, nhằm tránh tạo instance mới khi các instance hiện có đã đủ dùng. Tất cả các class boxed primitive và `BigInteger` đều làm như vậy. Sử dụng các static factory như thế khiến client chia sẻ instance thay vì tạo mới, giảm dấu chân bộ nhớ và chi phí garbage collection. Việc chọn static factory thay cho constructor public khi thiết kế một class mới cho bạn sự linh hoạt để thêm caching sau này mà không cần sửa đổi client.

Một hệ quả của việc các object immutable có thể được chia sẻ tự do là bạn không bao giờ phải tạo *defensive copy* của chúng (**Item 50**). Thực tế, bạn không bao giờ phải tạo bất kỳ bản sao nào vì các bản sao sẽ mãi mãi tương đương với bản gốc. Do đó, bạn không cần và không nên cung cấp method `clone` hay *copy constructor* (**Item 13**) cho một class immutable. Điều này chưa được hiểu rõ trong những ngày đầu của nền tảng Java, nên class `String` có một copy constructor, nhưng nó hiếm khi, nếu không muốn nói là không bao giờ, nên được dùng (**Item 6**).

**Không những bạn có thể chia sẻ các object immutable, mà chúng còn có thể chia sẻ phần bên trong của mình.** Ví dụ, class `BigInteger` sử dụng cách biểu diễn dấu-độ lớn (sign-magnitude) bên trong. Dấu được biểu diễn bằng một `int`, và độ lớn được biểu diễn bằng một mảng `int`. Method `negate` tạo ra một `BigInteger` mới có cùng độ lớn và dấu ngược lại. Nó không cần sao chép mảng dù mảng là mutable; `BigInteger` mới tạo trỏ đến cùng mảng nội bộ với bản gốc.

**Các object immutable là những khối xây dựng tuyệt vời cho các object khác,** dù mutable hay immutable. Việc duy trì các bất biến của một object phức tạp dễ dàng hơn nhiều nếu bạn biết rằng các object thành phần của nó sẽ không thay đổi ngầm bên dưới. Một trường hợp đặc biệt của nguyên lý này là các object immutable là những khóa map và phần tử set tuyệt vời: bạn không phải lo lắng về việc giá trị của chúng thay đổi sau khi đã nằm trong map hay set, điều sẽ phá hủy các bất biến của map hay set đó.

**Các object immutable cung cấp tính nguyên tử khi thất bại (failure atomicity) một cách miễn phí** (**Item 76**). Trạng thái của chúng không bao giờ thay đổi, nên không có khả năng xảy ra sự không nhất quán tạm thời.

**Nhược điểm chính của các class immutable là chúng đòi hỏi một object riêng biệt cho mỗi giá trị khác nhau.** Việc tạo những object này có thể tốn kém, đặc biệt nếu chúng lớn. Ví dụ, giả sử bạn có một `BigInteger` một triệu bit và bạn muốn thay đổi bit thấp nhất của nó:

```java
BigInteger moby = ...;
moby = moby.flipBit(0);
```

Method `flipBit` tạo ra một instance `BigInteger` mới, cũng dài một triệu bit, chỉ khác bản gốc ở đúng một bit. Thao tác này đòi hỏi thời gian và không gian tỷ lệ với kích thước của `BigInteger`. Hãy đối chiếu với `java.util.BitSet`. Giống như `BigInteger`, `BitSet` biểu diễn một dãy bit dài tùy ý, nhưng khác với `BigInteger`, `BitSet` là mutable. Class `BitSet` cung cấp một method cho phép bạn thay đổi trạng thái của một bit đơn lẻ trong một instance một triệu bit trong thời gian hằng số:

`BitSet moby = ...; moby.flip(0);`

Vấn đề hiệu năng bị khuếch đại nếu bạn thực hiện một thao tác nhiều bước mà mỗi bước lại sinh ra một object mới, rồi cuối cùng loại bỏ tất cả các object ngoại trừ kết quả cuối. Có hai cách tiếp cận để đối phó với vấn đề này. Cách thứ nhất là đoán xem những thao tác nhiều bước nào sẽ thường được cần đến và cung cấp chúng dưới dạng các thao tác nguyên thủy (primitive). Nếu một thao tác nhiều bước được cung cấp dưới dạng nguyên thủy, class immutable không phải tạo một object riêng ở mỗi bước. Bên trong, class immutable có thể khéo léo tùy ý. Ví dụ, `BigInteger` có một "class đồng hành" (companion class) mutable package-private mà nó dùng để tăng tốc các thao tác nhiều bước như lũy thừa modulo. Việc dùng class đồng hành mutable khó hơn nhiều so với dùng `BigInteger`, vì tất cả những lý do đã nêu ở trên. May mắn thay, bạn không phải dùng nó: những người cài đặt `BigInteger` đã làm phần việc khó thay cho bạn.

Cách tiếp cận class đồng hành mutable package-private hoạt động tốt nếu bạn có thể dự đoán chính xác những thao tác phức tạp nào mà client sẽ muốn thực hiện trên class immutable của bạn. Nếu không, lựa chọn tốt nhất của bạn là cung cấp một class đồng hành mutable *public*. Ví dụ chính của cách tiếp cận này trong các thư viện nền tảng Java là class `String`, với class đồng hành mutable là `StringBuilder` (và tiền thân lỗi thời của nó, `StringBuffer`).

Giờ bạn đã biết cách tạo một class immutable và hiểu ưu nhược điểm của tính immutable, hãy bàn về một vài phương án thiết kế thay thế. Nhớ lại rằng để đảm bảo tính immutable, một class không được cho phép chính nó bị kế thừa. Điều này có thể thực hiện bằng cách làm cho class final, nhưng có một phương án khác linh hoạt hơn. Thay vì làm cho một class immutable trở thành final, bạn có thể làm cho tất cả constructor của nó là private hoặc package-private và thêm các static factory public thay cho các constructor public (**Item 1**). Để cụ thể hóa, đây là hình dạng của `Complex` nếu bạn dùng cách tiếp cận này:

```java
// Immutable class with static factories instead of constructors
public class Complex {
    private final double re;
    private final double im;

    private Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    public static Complex valueOf(double re, double im) {
        return new Complex(re, im);
    }

    ... // Remainder unchanged
}
```

Cách tiếp cận này thường là phương án tốt nhất. Nó linh hoạt nhất vì cho phép sử dụng nhiều class cài đặt package-private. Đối với các client nằm ngoài package của nó, class immutable về thực chất là final vì không thể kế thừa một class đến từ package khác mà không có constructor public hoặc protected. Ngoài việc cho phép sự linh hoạt của nhiều class cài đặt, cách tiếp cận này còn giúp tinh chỉnh hiệu năng của class trong các phiên bản sau bằng cách cải thiện khả năng cache object của các static factory.

Việc các class immutable phải là effectively final chưa được hiểu rộng rãi khi `BigInteger` và `BigDecimal` được viết, vì vậy tất cả các method của chúng đều có thể bị override. Đáng tiếc, điều này không thể được sửa chữa sau đó mà vẫn giữ được tính tương thích ngược. Nếu bạn viết một class mà tính bảo mật của nó phụ thuộc vào tính immutable của một đối số `BigInteger` hay `BigDecimal` đến từ một client không đáng tin cậy, bạn phải kiểm tra xem đối số đó có phải là một `BigInteger` hay `BigDecimal` "thật" hay không, thay vì là một instance của một subclass không đáng tin. Nếu là trường hợp sau, bạn phải sao chép phòng vệ nó với giả định rằng nó có thể là mutable (**Item 50**):

```java
public static BigInteger safeInstance(BigInteger val) {
    return val.getClass() == BigInteger.class ?
            val : new BigInteger(val.toByteArray());
}
```

Danh sách các quy tắc cho class immutable ở đầu item này nói rằng không method nào được sửa đổi object và tất cả các field của nó phải là final. Thực ra các quy tắc này hơi mạnh hơn mức cần thiết và có thể được nới lỏng để cải thiện hiệu năng. Đúng ra là không method nào được tạo ra một thay đổi *có thể quan sát từ bên ngoài* đối với trạng thái của object. Tuy nhiên, một số class immutable có một hoặc nhiều field không phải final, trong đó chúng cache kết quả của các phép tính tốn kém vào lần đầu tiên cần đến. Nếu cùng giá trị đó được yêu cầu lại, giá trị đã cache được trả về, tiết kiệm chi phí tính toán lại. Thủ thuật này hoạt động chính xác là nhờ object là immutable, điều đảm bảo rằng phép tính sẽ cho cùng kết quả nếu được lặp lại.

Ví dụ, method `hashCode` của `PhoneNumber` (**Item 11**, trang 53) tính hash code vào lần đầu tiên được gọi và cache nó phòng khi được gọi lại. Kỹ thuật này, một ví dụ của *lazy initialization* (khởi tạo lười) (**Item 83**), cũng được `String` sử dụng.

Cần thêm một lưu ý liên quan đến khả năng serialize. Nếu bạn chọn cho class immutable của mình implement `Serializable` và nó chứa một hoặc nhiều field tham chiếu đến các object mutable, bạn phải cung cấp một method `readObject` hoặc `readResolve` tường minh, hoặc dùng các method `ObjectOutputStream.writeUnshared` và `ObjectInputStream.readUnshared`, ngay cả khi dạng serialized mặc định là chấp nhận được. Nếu không, kẻ tấn công có thể tạo ra một instance mutable của class của bạn. Chủ đề này được đề cập chi tiết trong **Item 88**.

Tóm lại, hãy cưỡng lại thôi thúc viết một setter cho mỗi getter. **Các class nên là immutable trừ khi có lý do rất chính đáng để làm chúng mutable.** Các class immutable mang lại nhiều lợi thế, và nhược điểm duy nhất của chúng là khả năng gặp vấn đề hiệu năng trong một số hoàn cảnh nhất định. Bạn nên luôn làm cho các value object nhỏ, như `PhoneNumber` và `Complex`, là immutable. (Có một số class trong các thư viện nền tảng Java, như `java.util.Date` và `java.awt.Point`, lẽ ra nên immutable nhưng lại không.) Bạn cũng nên cân nhắc nghiêm túc việc làm cho các value object lớn hơn, như `String` và `BigInteger`, là immutable. Bạn *chỉ* nên cung cấp một class đồng hành mutable public cho class immutable của mình một khi đã xác nhận rằng điều đó là cần thiết để đạt được hiệu năng thỏa đáng (**Item 67**).

Có một số class mà tính immutable là không thực tế. **Nếu một class không thể được làm immutable, hãy hạn chế tính mutable của nó nhiều nhất có thể.** Giảm số lượng trạng thái mà một object có thể tồn tại giúp việc suy luận về object dễ dàng hơn và giảm khả năng xảy ra lỗi. Do đó, hãy làm cho mọi field là final trừ khi có lý do thuyết phục để không làm vậy. Kết hợp lời khuyên của item này với lời khuyên của **Item 15**, khuynh hướng tự nhiên của bạn nên là **khai báo mọi field là** `private final` **trừ khi có lý do chính đáng để làm khác đi.**

**Constructor nên tạo ra các object được khởi tạo đầy đủ với tất cả các bất biến đã được thiết lập.** Đừng cung cấp một method khởi tạo public tách biệt với constructor hay static factory trừ khi có lý do *thuyết phục* để làm vậy. Tương tự, đừng cung cấp một method "khởi tạo lại" cho phép một object được tái sử dụng như thể nó được tạo với một trạng thái ban đầu khác. Những method như vậy thường mang lại rất ít, nếu có, lợi ích hiệu năng nhưng lại làm tăng độ phức tạp.

Class `CountDownLatch` minh họa các nguyên lý này. Nó là mutable, nhưng không gian trạng thái của nó được cố ý giữ nhỏ. Bạn tạo một instance, dùng nó một lần, và thế là xong: một khi bộ đếm của countdown latch đã về không, bạn không được tái sử dụng nó.

Cần thêm một ghi chú cuối cùng liên quan đến class `Complex` trong item này. Ví dụ này chỉ nhằm minh họa tính immutable. Nó không phải là một cài đặt số phức đạt chuẩn công nghiệp. Nó dùng các công thức chuẩn cho phép nhân và chia số phức, vốn không được làm tròn đúng và có ngữ nghĩa kém đối với NaN và vô cực phức [**Kahan91**, **Smith62**, **Thomas94**].

## Item 18: Ưu tiên composition hơn inheritance

Inheritance (kế thừa) là một cách mạnh mẽ để đạt được tái sử dụng code, nhưng nó không phải lúc nào cũng là công cụ tốt nhất cho công việc. Dùng không đúng chỗ, nó dẫn đến phần mềm mong manh. Dùng inheritance bên trong một package là an toàn, nơi mà cài đặt của subclass và superclass nằm dưới sự kiểm soát của cùng những lập trình viên. Dùng inheritance cũng an toàn khi kế thừa các class được thiết kế và tài liệu hóa đặc biệt cho việc kế thừa (**Item 19**). Tuy nhiên, kế thừa từ các class cụ thể thông thường vượt qua ranh giới package là nguy hiểm. Xin nhắc lại, cuốn sách này dùng từ "inheritance" với nghĩa *implementation inheritance* (kế thừa cài đặt, khi một class extends một class khác). Các vấn đề được thảo luận trong item này không áp dụng cho *interface inheritance* (kế thừa interface, khi một class implement một interface hoặc khi một interface extends một interface khác).

**Không giống như gọi method, inheritance vi phạm encapsulation** [**Snyder86**]. Nói cách khác, một subclass phụ thuộc vào các chi tiết cài đặt của superclass để hoạt động đúng. Cài đặt của superclass có thể thay đổi từ phiên bản này sang phiên bản khác, và nếu điều đó xảy ra, subclass có thể bị hỏng, dù code của nó chưa hề bị đụng đến. Hệ quả là subclass phải tiến hóa song hành với superclass của nó, trừ khi các tác giả của superclass đã thiết kế và tài liệu hóa nó đặc biệt cho mục đích được kế thừa.

Để cụ thể hóa, giả sử chúng ta có một chương trình sử dụng `HashSet`. Để tinh chỉnh hiệu năng chương trình, chúng ta cần truy vấn `HashSet` xem có bao nhiêu phần tử đã được thêm vào kể từ khi nó được tạo (đừng nhầm với kích thước hiện tại của nó, vốn giảm đi khi một phần tử bị xóa). Để cung cấp chức năng này, chúng ta viết một biến thể `HashSet` giữ bộ đếm số lần cố gắng chèn phần tử và xuất ra một accessor cho bộ đếm này. Class `HashSet` có hai method có khả năng thêm phần tử, `add` và `addAll`, vì vậy chúng ta override cả hai method này:

```java
// Broken - Inappropriate use of inheritance!
public class InstrumentedHashSet<E> extends HashSet<E> {
    // The number of attempted element insertions
    private int addCount = 0;

    public InstrumentedHashSet() {
    }

    public InstrumentedHashSet(int initCap, float loadFactor) {
        super(initCap, loadFactor);
    }
    @Override public boolean add(E e) {
        addCount++;
        return super.add(e);
    }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);
    }
    public int getAddCount() {
        return addCount;
    }
}
```

Class này trông hợp lý, nhưng nó không hoạt động. Giả sử chúng ta tạo một instance và thêm ba phần tử bằng method `addAll`. Nhân tiện, lưu ý rằng chúng ta tạo một list bằng static factory method `List.of`, được thêm vào trong Java 9; nếu bạn dùng phiên bản cũ hơn, hãy dùng `Arrays.asList` thay thế:

```java
InstrumentedHashSet<String> s = new InstrumentedHashSet<>();
s.addAll(List.of("Snap", "Crackle", "Pop"));
```

Chúng ta mong đợi method `getAddCount` trả về ba tại thời điểm này, nhưng nó trả về sáu. Điều gì đã sai? Bên trong, method `addAll` của `HashSet` được cài đặt dựa trên method `add` của nó, mặc dù `HashSet`, một cách khá hợp lý, không tài liệu hóa chi tiết cài đặt này. Method `addAll` trong `InstrumentedHashSet` đã cộng ba vào `addCount` rồi gọi cài đặt `addAll` của `HashSet` thông qua `super.addAll`. Điều này đến lượt nó lại gọi method `add`, như đã được override trong `InstrumentedHashSet`, một lần cho mỗi phần tử. Mỗi lần trong ba lần gọi này lại cộng thêm một vào `addCount`, tổng cộng tăng sáu: mỗi phần tử được thêm bằng method `addAll` bị đếm hai lần.

Chúng ta có thể "sửa" subclass bằng cách loại bỏ phần override method `addAll` của nó. Mặc dù class thu được sẽ hoạt động, nó sẽ phụ thuộc vào việc method `addAll` của `HashSet` được cài đặt dựa trên method `add` để hoạt động đúng. Sự "tự sử dụng" (self-use) này là một chi tiết cài đặt, không được đảm bảo đúng trong mọi cài đặt của nền tảng Java và có thể thay đổi từ phiên bản này sang phiên bản khác. Do đó, class `InstrumentedHashSet` thu được sẽ mong manh.

Sẽ tốt hơn một chút nếu override method `addAll` để duyệt qua collection được chỉ định, gọi method `add` một lần cho mỗi phần tử. Điều này sẽ đảm bảo kết quả đúng bất kể method `addAll` của `HashSet` có được cài đặt dựa trên method `add` của nó hay không, vì cài đặt `addAll` của `HashSet` sẽ không còn được gọi nữa. Tuy nhiên, kỹ thuật này không giải quyết được tất cả vấn đề của chúng ta. Nó tương đương với việc cài đặt lại các method của superclass mà có thể có hoặc không có self-use, điều này khó khăn, tốn thời gian, dễ gây lỗi và có thể làm giảm hiệu năng. Thêm nữa, không phải lúc nào cũng khả thi vì một số method không thể được cài đặt nếu không truy cập được các field private mà subclass không thể chạm tới.

Một nguyên nhân liên quan gây ra sự mong manh của subclass là superclass của chúng có thể có thêm method mới trong các phiên bản sau. Giả sử một chương trình phụ thuộc vào việc mọi phần tử được chèn vào một collection nào đó đều thỏa mãn một predicate nào đó để đảm bảo tính bảo mật. Điều này có thể được đảm bảo bằng cách kế thừa collection và override mọi method có khả năng thêm phần tử để đảm bảo predicate được thỏa mãn trước khi thêm phần tử. Cách này hoạt động tốt cho đến khi một method mới có khả năng chèn phần tử được thêm vào superclass trong một phiên bản sau. Một khi điều này xảy ra, việc thêm một phần tử "bất hợp lệ" trở nên khả thi chỉ bằng cách gọi method mới, vốn không được override trong subclass. Đây không phải là vấn đề thuần lý thuyết. Nhiều lỗ hổng bảo mật kiểu này đã phải được sửa khi `Hashtable` và `Vector` được cải tiến để tham gia vào Collections Framework.

Cả hai vấn đề này đều bắt nguồn từ việc override method. Bạn có thể nghĩ rằng kế thừa một class là an toàn nếu bạn chỉ thêm method mới và kiềm chế không override các method hiện có. Mặc dù kiểu kế thừa này an toàn hơn nhiều, nó không phải là không có rủi ro. Nếu superclass có thêm một method mới trong phiên bản sau và bạn không may đã cho subclass một method có cùng chữ ký (signature) nhưng kiểu trả về khác, subclass của bạn sẽ không còn biên dịch được nữa [JLS, 8.4.8.3]. Nếu bạn đã cho subclass một method có cùng chữ ký và kiểu trả về với method mới của superclass, thì giờ bạn đang override nó, nên bạn phải chịu các vấn đề đã mô tả ở trên. Hơn nữa, đáng ngờ là liệu method của bạn có đáp ứng được hợp đồng (contract) của method mới trong superclass hay không, vì hợp đồng đó còn chưa được viết ra khi bạn viết method trong subclass.

May mắn thay, có một cách để tránh tất cả các vấn đề mô tả ở trên. Thay vì kế thừa một class hiện có, hãy cho class mới của bạn một field private tham chiếu đến một instance của class hiện có. Thiết kế này được gọi là *composition* (kết hợp) vì class hiện có trở thành một thành phần của class mới. Mỗi instance method trong class mới gọi method tương ứng trên instance được chứa bên trong của class hiện có và trả về kết quả. Điều này được gọi là *forwarding* (chuyển tiếp), và các method trong class mới được gọi là *forwarding method*. Class thu được sẽ vững như bàn thạch, không phụ thuộc vào các chi tiết cài đặt của class hiện có. Ngay cả việc thêm method mới vào class hiện có cũng sẽ không ảnh hưởng đến class mới. Để cụ thể hóa, đây là phiên bản thay thế cho `InstrumentedHashSet` sử dụng cách tiếp cận composition-và-forwarding. Lưu ý rằng cài đặt được chia thành hai phần, bản thân class và một *forwarding class* có thể tái sử dụng, chứa tất cả các forwarding method và không gì khác:

```java
// Wrapper class - uses composition in place of inheritance
public class InstrumentedSet<E> extends ForwardingSet<E> {
    private int addCount = 0;

    public InstrumentedSet(Set<E> s) {
        super(s);
    }

    @Override public boolean add(E e) {
        addCount++;
        return super.add(e);
     }
     @Override public boolean addAll(Collection<? extends E> c) {
         addCount += c.size();
         return super.addAll(c);
     }
     public int getAddCount() {
         return addCount;
     }
}

// Reusable forwarding class
public class ForwardingSet<E> implements Set<E> {
    private final Set<E> s;
    public ForwardingSet(Set<E> s) { this.s = s; }

    public void clear()               { s.clear();            }
    public boolean contains(Object o) { return s.contains(o); }
    public boolean isEmpty()          { return s.isEmpty();   }
    public int size()                 { return s.size();      }
    public Iterator<E> iterator()     { return s.iterator();  }
    public boolean add(E e)           { return s.add(e);      }
    public boolean remove(Object o)   { return s.remove(o);   }
    public boolean containsAll(Collection<?> c)
                                   { return s.containsAll(c); }
    public boolean addAll(Collection<? extends E> c)
                                   { return s.addAll(c);      }
    public boolean removeAll(Collection<?> c)
                                   { return s.removeAll(c);   }
    public boolean retainAll(Collection<?> c)
                                   { return s.retainAll(c);   }
    public Object[] toArray()          { return s.toArray();  }
    public <T> T[] toArray(T[] a)      { return s.toArray(a); }
    @Override public boolean equals(Object o)
                                       { return s.equals(o);  }
    @Override public int hashCode()    { return s.hashCode(); }
    @Override public String toString() { return s.toString(); }
}
```

Thiết kế của class `InstrumentedSet` khả thi nhờ sự tồn tại của interface `Set`, vốn nắm bắt chức năng của class `HashSet`. Ngoài việc vững chắc, thiết kế này cực kỳ linh hoạt. Class `InstrumentedSet` implement interface `Set` và có một constructor duy nhất mà đối số của nó cũng thuộc kiểu `Set`. Về bản chất, class này biến đổi một `Set` thành một `Set` khác, thêm vào chức năng đo đếm (instrumentation). Không giống cách tiếp cận dựa trên inheritance, vốn chỉ hoạt động với một class cụ thể duy nhất và đòi hỏi một constructor riêng cho mỗi constructor được hỗ trợ trong superclass, wrapper class có thể được dùng để đo đếm bất kỳ cài đặt `Set` nào và sẽ hoạt động cùng với bất kỳ constructor có sẵn nào:

```java
Set<Instant> times = new InstrumentedSet<>(new TreeSet<>(cmp));
Set<E> s = new InstrumentedSet<>(new HashSet<>(INIT_CAPACITY));
```

Class `InstrumentedSet` thậm chí có thể được dùng để tạm thời đo đếm một instance set đã được sử dụng trước đó mà không có đo đếm:

```java
static void walk(Set<Dog> dogs) {
    InstrumentedSet<Dog> iDogs = new InstrumentedSet<>(dogs);
    ... // Within this method use iDogs instead of dogs
}
```

Class `InstrumentedSet` được gọi là một *wrapper* class (class bao bọc) vì mỗi instance `InstrumentedSet` chứa ("bao bọc") một instance `Set` khác. Điều này còn được gọi là mẫu *Decorator* [**Gamma95**] vì class `InstrumentedSet` "trang trí" một set bằng cách thêm chức năng đo đếm. Đôi khi sự kết hợp giữa composition và forwarding được gọi một cách lỏng lẻo là *delegation* (ủy quyền). Về mặt kỹ thuật thì đó không phải là delegation trừ khi wrapper object truyền chính nó cho object được bao bọc [Lieberman86; Gamma95].

Nhược điểm của wrapper class rất ít. Một lưu ý là wrapper class không phù hợp để dùng trong các *callback framework*, trong đó các object truyền tham chiếu đến chính mình cho các object khác để được gọi lại sau đó ("callback"). Vì object được bao bọc không biết về wrapper của nó, nó truyền tham chiếu đến chính nó (`this`) và các callback thoát khỏi wrapper. Điều này được gọi là *vấn đề SELF* [**Lieberman86**]. Một số người lo lắng về ảnh hưởng hiệu năng của việc chuyển tiếp lời gọi method hoặc ảnh hưởng về dấu chân bộ nhớ của các wrapper object. Trên thực tế, cả hai đều không có ảnh hưởng đáng kể. Viết các forwarding method thì tẻ nhạt, nhưng bạn chỉ phải viết forwarding class có thể tái sử dụng cho mỗi interface đúng một lần, và các forwarding class có thể đã được cung cấp sẵn cho bạn. Ví dụ, Guava cung cấp forwarding class cho tất cả các interface collection [**Guava**].

Inheritance chỉ phù hợp trong những hoàn cảnh mà subclass thực sự là một *subtype* (kiểu con) của superclass. Nói cách khác, một class *B* chỉ nên extends một class *A* nếu tồn tại quan hệ "is-a" (là một) giữa hai class. Nếu bạn bị cám dỗ cho class *B* extends class *A*, hãy tự hỏi: Mọi *B* có thực sự là một *A* không? Nếu bạn không thể thành thật trả lời có cho câu hỏi này, *B* không nên extends *A*. Nếu câu trả lời là không, thường thì *B* nên chứa một instance private của *A* và công khai một API khác: *A* không phải là một phần thiết yếu của *B*, mà chỉ là một chi tiết cài đặt của nó.

Có một số vi phạm rõ ràng nguyên lý này trong các thư viện nền tảng Java. Ví dụ, một stack không phải là một vector, nên `Stack` không nên extends `Vector`. Tương tự, một danh sách thuộc tính không phải là một bảng băm, nên `Properties` không nên extends `Hashtable`. Trong cả hai trường hợp, composition lẽ ra đã tốt hơn.

Nếu bạn dùng inheritance ở nơi mà composition mới thích hợp, bạn công khai các chi tiết cài đặt một cách không cần thiết. API thu được trói buộc bạn vào cài đặt ban đầu, giới hạn mãi mãi hiệu năng của class. Nghiêm trọng hơn, bằng cách công khai phần bên trong, bạn để client truy cập trực tiếp vào chúng. Ít nhất, điều đó có thể dẫn đến ngữ nghĩa gây nhầm lẫn. Ví dụ, nếu `p` tham chiếu đến một instance `Properties`, thì `p.getProperty(key)` có thể cho kết quả khác với `p.get(key)`: method trước có tính đến các giá trị mặc định, trong khi method sau, được kế thừa từ `Hashtable`, thì không. Nghiêm trọng nhất, client có thể làm hỏng các bất biến của subclass bằng cách sửa đổi trực tiếp superclass. Trong trường hợp `Properties`, các nhà thiết kế dự định chỉ cho phép string làm khóa và giá trị, nhưng việc truy cập trực tiếp vào `Hashtable` bên dưới cho phép bất biến này bị vi phạm. Một khi bị vi phạm, không còn có thể dùng các phần khác của API `Properties` (`load` và `store`) nữa. Đến khi vấn đề này được phát hiện thì đã quá muộn để sửa vì client đã phụ thuộc vào việc sử dụng khóa và giá trị không phải string.

Có một nhóm câu hỏi cuối cùng bạn nên tự hỏi trước khi quyết định dùng inheritance thay cho composition. Class mà bạn định kế thừa có khiếm khuyết nào trong API của nó không? Nếu có, bạn có thoải mái khi lan truyền những khiếm khuyết đó vào API của class mình không? Inheritance lan truyền mọi khiếm khuyết trong API của superclass, trong khi composition cho phép bạn thiết kế một API mới che giấu những khiếm khuyết này.

Tóm lại, inheritance mạnh mẽ, nhưng nó có vấn đề vì nó vi phạm encapsulation. Nó chỉ thích hợp khi tồn tại một quan hệ subtype thực sự giữa subclass và superclass. Ngay cả khi đó, inheritance vẫn có thể dẫn đến sự mong manh nếu subclass nằm ở package khác với superclass và superclass không được thiết kế cho inheritance. Để tránh sự mong manh này, hãy dùng composition và forwarding thay vì inheritance, đặc biệt nếu tồn tại một interface thích hợp để cài đặt wrapper class. Wrapper class không những vững chắc hơn subclass mà còn mạnh mẽ hơn.

## Item 19: Thiết kế và tài liệu hóa cho inheritance, nếu không thì hãy cấm nó

Item 18 đã cảnh báo bạn về những nguy hiểm của việc kế thừa một class "lạ" không được thiết kế và tài liệu hóa cho inheritance. Vậy một class được thiết kế và tài liệu hóa cho inheritance có nghĩa là gì?

Trước hết, class phải tài liệu hóa chính xác các tác động của việc override bất kỳ method nào. Nói cách khác, **class phải tài liệu hóa việc nó tự sử dụng (self-use) các method có thể override.** Với mỗi method public hoặc protected, tài liệu phải chỉ rõ method đó gọi những method có thể override nào, theo trình tự nào, và kết quả của mỗi lời gọi ảnh hưởng thế nào đến quá trình xử lý tiếp theo. (*Có thể override* ở đây nghĩa là không phải final và là public hoặc protected.) Tổng quát hơn, một class phải tài liệu hóa mọi hoàn cảnh mà nó có thể gọi một method có thể override. Ví dụ, các lời gọi có thể đến từ các background thread hoặc từ static initializer.

Một method gọi các method có thể override sẽ có phần mô tả về các lời gọi này ở cuối comment tài liệu của nó. Phần mô tả nằm trong một mục đặc biệt của đặc tả, được gắn nhãn "Implementation Requirements" (Yêu cầu cài đặt), được sinh ra bởi Javadoc tag `@implSpec`. Mục này mô tả hoạt động bên trong của method. Đây là một ví dụ, được sao chép từ đặc tả của `java.util.AbstractCollection`:

`public boolean remove(Object o)`

Xóa một instance duy nhất của phần tử được chỉ định khỏi collection này, nếu nó có mặt (thao tác tùy chọn). Nói một cách hình thức hơn, xóa một phần tử `e` sao cho `Objects.equals(o, e)`, nếu collection này chứa một hoặc nhiều phần tử như vậy. Trả về `true` nếu collection này có chứa phần tử được chỉ định (hay tương đương, nếu collection này thay đổi do lời gọi).

**Implementation Requirements:** Cài đặt này duyệt qua collection để tìm phần tử được chỉ định. Nếu tìm thấy phần tử, nó xóa phần tử khỏi collection bằng method `remove` của iterator. Lưu ý rằng cài đặt này ném `UnsupportedOperationException` nếu iterator được trả về bởi method `iterator` của collection này không implement method `remove` và collection này có chứa object được chỉ định.

Tài liệu này không để lại chút nghi ngờ nào rằng việc override method `iterator` sẽ ảnh hưởng đến hành vi của method `remove`. Nó cũng mô tả chính xác cách hành vi của `Iterator` được trả về bởi method `iterator` sẽ ảnh hưởng đến hành vi của method `remove`. Hãy đối chiếu điều này với tình huống trong **Item 18**, nơi lập trình viên kế thừa `HashSet` đơn giản là không thể biết liệu việc override method `add` có ảnh hưởng đến hành vi của method `addAll` hay không.

Nhưng chẳng phải điều này vi phạm châm ngôn rằng tài liệu API tốt nên mô tả *cái gì* một method làm chứ không phải *cách* nó làm sao? Đúng, nó vi phạm! Đây là hệ quả đáng tiếc của việc inheritance vi phạm encapsulation. Để tài liệu hóa một class sao cho nó có thể được kế thừa an toàn, bạn phải mô tả những chi tiết cài đặt mà lẽ ra nên để không xác định.

Tag `@implSpec` được thêm vào trong Java 8 và được dùng nhiều trong Java 9. Tag này lẽ ra nên được bật mặc định, nhưng tính đến Java 9, Javadoc bỏ qua nó trừ khi bạn truyền tùy chọn dòng lệnh `-tag "implSpec:a:Implementation Requirements:"`.

Thiết kế cho inheritance không chỉ là tài liệu hóa các mẫu self-use. Để cho phép lập trình viên viết các subclass hiệu quả mà không phải chịu đau khổ không đáng có, **một class có thể phải cung cấp các điểm móc (hook) vào hoạt động bên trong của nó dưới dạng các method protected được chọn lọc kỹ càng** hoặc, trong những trường hợp hiếm hoi, các field protected. Ví dụ, hãy xem method `removeRange` của `java.util.AbstractList`:

```java
protected void removeRange(int fromIndex, int toIndex)
```

Xóa khỏi list này tất cả các phần tử có chỉ số nằm giữa `fromIndex` (bao gồm) và `toIndex` (không bao gồm). Dịch chuyển các phần tử theo sau sang trái (giảm chỉ số của chúng). Lời gọi này làm ngắn list đi `(toIndex - fromIndex)` phần tử. (Nếu `toIndex == fromIndex`, thao tác này không có tác dụng.)

Method này được gọi bởi thao tác `clear` trên list này và các sublist của nó. Override method này để tận dụng phần bên trong của cài đặt list có thể cải thiện đáng kể hiệu năng của thao tác `clear` trên list này và các sublist của nó.

**Implementation Requirements:** Cài đặt này lấy một list iterator được đặt ở vị trí trước `fromIndex` và liên tục gọi `ListIterator.next` rồi đến `ListIterator.remove`, cho đến khi toàn bộ khoảng đã được xóa. **Lưu ý: Nếu** `ListIterator.remove` **đòi hỏi thời gian tuyến tính, cài đặt này đòi hỏi thời gian bậc hai.**

Tham số:

| Tham số | Mô tả |
|---|---|
| `fromIndex` | chỉ số của phần tử đầu tiên cần xóa. |
| `toIndex` | chỉ số ngay sau phần tử cuối cùng cần xóa. |

Method này không có gì đáng quan tâm đối với người dùng cuối của một cài đặt `List`. Nó được cung cấp chỉ để giúp các subclass dễ dàng cung cấp một method `clear` nhanh trên các sublist. Nếu không có method `removeRange`, các subclass sẽ phải chấp nhận hiệu năng bậc hai khi method `clear` được gọi trên các sublist, hoặc viết lại toàn bộ cơ chế `subList` từ đầu—không phải là một nhiệm vụ dễ dàng!

Vậy làm sao bạn quyết định nên công khai những thành viên protected nào khi thiết kế một class cho inheritance? Đáng tiếc, không có viên đạn thần kỳ nào cả. Điều tốt nhất bạn có thể làm là suy nghĩ thật kỹ, đưa ra phỏng đoán tốt nhất, rồi kiểm nghiệm nó bằng cách viết các subclass. Bạn nên công khai càng ít thành viên protected càng tốt vì mỗi thành viên như vậy thể hiện một cam kết về một chi tiết cài đặt. Mặt khác, bạn không được công khai quá ít vì một thành viên protected bị thiếu có thể khiến class gần như không thể dùng được cho inheritance.

**Cách duy nhất để kiểm nghiệm một class được thiết kế cho inheritance là viết các subclass.** Nếu bạn bỏ sót một thành viên protected quan trọng, việc cố gắng viết một subclass sẽ khiến sự thiếu sót đó lộ ra một cách đau đớn. Ngược lại, nếu nhiều subclass được viết mà không subclass nào dùng một thành viên protected nào đó, có lẽ bạn nên làm nó private. Kinh nghiệm cho thấy ba subclass thường là đủ để kiểm nghiệm một class có thể kế thừa. Một hoặc nhiều subclass trong số này nên được viết bởi ai đó không phải là tác giả của superclass.

Khi bạn thiết kế cho inheritance một class có khả năng được sử dụng rộng rãi, hãy nhận thức rằng bạn đang cam kết *mãi mãi* với các mẫu self-use mà bạn tài liệu hóa và với các quyết định cài đặt ngầm ẩn trong các method và field protected của nó. Những cam kết này có thể khiến việc cải thiện hiệu năng hay chức năng của class trong phiên bản sau trở nên khó khăn hoặc bất khả thi. Do đó, **bạn phải kiểm nghiệm class của mình bằng cách viết các subclass trước khi phát hành nó.**

Cũng lưu ý rằng tài liệu đặc biệt cần cho inheritance làm rối tài liệu thông thường, vốn được thiết kế cho những lập trình viên tạo instance của class và gọi method trên chúng. Tính đến thời điểm viết cuốn sách này, có rất ít công cụ để tách tài liệu API thông thường khỏi những thông tin chỉ đáng quan tâm đối với lập trình viên cài đặt subclass.

Còn một vài hạn chế nữa mà một class phải tuân theo để cho phép inheritance. **Constructor không được gọi các method có thể override,** dù trực tiếp hay gián tiếp. Nếu bạn vi phạm quy tắc này, chương trình sẽ thất bại. Constructor của superclass chạy trước constructor của subclass, nên method override trong subclass sẽ được gọi trước khi constructor của subclass chạy. Nếu method override phụ thuộc vào bất kỳ khởi tạo nào được thực hiện bởi constructor của subclass, method sẽ không hành xử như mong đợi. Để cụ thể hóa, đây là một class vi phạm quy tắc này:

```java
public class Super {
    // Broken - constructor invokes an overridable method
    public Super() {
        overrideMe();
    }
    public void overrideMe() {
    }
}
```

Đây là một subclass override method `overrideMe`, vốn bị constructor duy nhất của `Super` gọi một cách sai lầm:

```java
public final class Sub extends Super {
    // Blank final, set by constructor
    private final Instant instant;

    Sub() {
        instant = Instant.now();
    }

    // Overriding method invoked by superclass constructor
    @Override public void overrideMe() {
        System.out.println(instant);
    }

    public static void main(String[] args) {
        Sub sub = new Sub();
        sub.overrideMe();
    }
}
```

Bạn có thể mong đợi chương trình này in ra instant hai lần, nhưng nó in ra `null` ở lần đầu vì `overrideMe` được gọi bởi constructor của `Super` trước khi constructor của `Sub` có cơ hội khởi tạo field `instant`. Lưu ý rằng chương trình này quan sát thấy một field final ở hai trạng thái khác nhau! Cũng lưu ý rằng nếu `overrideMe` gọi bất kỳ method nào trên `instant`, nó sẽ ném `NullPointerException` khi constructor của `Super` gọi `overrideMe`. Lý do duy nhất chương trình này không ném `NullPointerException` như hiện tại là method `println` chấp nhận tham số null.

Lưu ý rằng gọi các method private, method final và method static, vốn đều không thể override, từ constructor *là* an toàn.

Các interface `Cloneable` và `Serializable` gây ra những khó khăn đặc biệt khi thiết kế cho inheritance. Nhìn chung, việc một class được thiết kế cho inheritance implement một trong hai interface này không phải là ý hay, vì chúng đặt gánh nặng đáng kể lên các lập trình viên kế thừa class. Tuy nhiên, có những hành động đặc biệt bạn có thể thực hiện để cho phép các subclass implement các interface này mà không bắt buộc chúng phải làm vậy. Những hành động này được mô tả trong **Item 13** và **Item 86**.

Nếu bạn quyết định implement `Cloneable` hoặc `Serializable` trong một class được thiết kế cho inheritance, bạn nên biết rằng vì các method `clone` và `readObject` hành xử rất giống constructor, một hạn chế tương tự cũng áp dụng: **cả** `clone` **lẫn** `readObject` **đều không được gọi một method có thể override, dù trực tiếp hay gián tiếp.** Trong trường hợp `readObject`, method override sẽ chạy trước khi trạng thái của subclass được deserialize. Trong trường hợp `clone`, method override sẽ chạy trước khi method `clone` của subclass có cơ hội sửa trạng thái của bản sao. Trong cả hai trường hợp, chương trình có khả năng thất bại. Trong trường hợp `clone`, sự thất bại có thể làm hỏng cả object gốc lẫn bản sao. Điều này có thể xảy ra, ví dụ, nếu method override giả định rằng nó đang sửa đổi bản sao của cấu trúc sâu của object, nhưng bản sao chưa được tạo.

Cuối cùng, nếu bạn quyết định implement `Serializable` trong một class được thiết kế cho inheritance và class có method `readResolve` hoặc `writeReplace`, bạn phải làm cho method `readResolve` hoặc `writeReplace` là protected thay vì private. Nếu các method này là private, chúng sẽ bị các subclass lặng lẽ bỏ qua. Đây là thêm một trường hợp mà một chi tiết cài đặt trở thành một phần API của class để cho phép inheritance.

Đến đây hẳn đã rõ ràng rằng **thiết kế một class cho inheritance đòi hỏi nỗ lực lớn và đặt ra những giới hạn đáng kể lên class.** Đây không phải là quyết định nên được đưa ra một cách nhẹ nhàng. Có một số tình huống mà đó rõ ràng là điều đúng đắn, chẳng hạn các abstract class, bao gồm các *skeletal implementation* (cài đặt khung) của interface (**Item 20**). Có những tình huống khác mà đó rõ ràng là điều sai lầm, chẳng hạn các class immutable (**Item 17**).

Nhưng còn các class cụ thể thông thường thì sao? Theo truyền thống, chúng không phải final và cũng không được thiết kế và tài liệu hóa cho việc kế thừa, nhưng tình trạng này rất nguy hiểm. Mỗi lần một thay đổi được thực hiện trong class như vậy, có khả năng các subclass kế thừa class đó sẽ bị hỏng. Đây không chỉ là vấn đề lý thuyết. Không hiếm khi nhận được các báo cáo lỗi liên quan đến subclass sau khi sửa đổi phần bên trong của một class cụ thể không phải final mà không được thiết kế và tài liệu hóa cho inheritance.

**Giải pháp tốt nhất cho vấn đề này là cấm kế thừa trong những class không được thiết kế và tài liệu hóa để được kế thừa an toàn.** Có hai cách để cấm kế thừa. Cách dễ hơn là khai báo class là final. Cách còn lại là làm cho tất cả constructor là private hoặc package-private và thêm các static factory public thay cho các constructor. Phương án này, vốn mang lại sự linh hoạt để dùng subclass bên trong, được thảo luận trong **Item 17**. Cả hai cách đều chấp nhận được.

Lời khuyên này có thể hơi gây tranh cãi vì nhiều lập trình viên đã quen với việc kế thừa các class cụ thể thông thường để thêm các tiện ích như đo đếm, thông báo và đồng bộ hóa, hoặc để giới hạn chức năng. Nếu một class implement một interface nào đó nắm bắt được bản chất của nó, chẳng hạn `Set`, `List` hay `Map`, thì bạn không nên cảm thấy áy náy gì khi cấm kế thừa. Mẫu *wrapper class*, được mô tả trong **Item 18**, cung cấp một phương án ưu việt hơn inheritance để mở rộng chức năng.

Nếu một class cụ thể không implement một interface chuẩn nào, thì việc cấm inheritance có thể gây bất tiện cho một số lập trình viên. Nếu bạn cảm thấy phải cho phép kế thừa từ class như vậy, một cách tiếp cận hợp lý là đảm bảo rằng class không bao giờ gọi bất kỳ method có thể override nào của nó và tài liệu hóa điều này. Nói cách khác, loại bỏ hoàn toàn việc class tự sử dụng các method có thể override. Làm như vậy, bạn sẽ tạo ra một class tương đối an toàn để kế thừa. Việc override một method sẽ không bao giờ ảnh hưởng đến hành vi của bất kỳ method nào khác.

Bạn có thể loại bỏ việc class tự sử dụng các method có thể override một cách máy móc, mà không thay đổi hành vi của nó. Chuyển thân của mỗi method có thể override vào một "helper method" private và cho mỗi method có thể override gọi helper method private của nó. Sau đó thay thế mỗi lần self-use của một method có thể override bằng lời gọi trực tiếp đến helper method private của method đó.

Tóm lại, thiết kế một class cho inheritance là công việc khó khăn. Bạn phải tài liệu hóa tất cả các mẫu self-use của nó, và một khi đã tài liệu hóa, bạn phải cam kết với chúng trong suốt vòng đời của class. Nếu bạn không làm được điều này, các subclass có thể trở nên phụ thuộc vào các chi tiết cài đặt của superclass và có thể bị hỏng nếu cài đặt của superclass thay đổi. Để cho phép người khác viết các subclass *hiệu quả*, bạn cũng có thể phải xuất ra một hoặc nhiều method protected. Trừ khi bạn biết có nhu cầu thực sự về subclass, có lẽ tốt hơn là cấm inheritance bằng cách khai báo class là final hoặc đảm bảo rằng không có constructor nào có thể truy cập được.

## Item 20: Ưu tiên interface hơn abstract class

Java có hai cơ chế để định nghĩa một kiểu cho phép nhiều cài đặt: interface và abstract class. Kể từ khi *default method* được đưa vào cho interface trong Java 8 [**JLS 9.4.3**], cả hai cơ chế đều cho phép bạn cung cấp cài đặt cho một số instance method. Một khác biệt lớn là để implement kiểu được định nghĩa bởi một abstract class, một class phải là subclass của abstract class đó. Vì Java chỉ cho phép đơn kế thừa, hạn chế này của abstract class ràng buộc nghiêm trọng việc sử dụng chúng làm định nghĩa kiểu. Bất kỳ class nào định nghĩa tất cả các method bắt buộc và tuân theo hợp đồng chung đều được phép implement một interface, bất kể class đó nằm ở đâu trong cây phân cấp class.

**Các class hiện có có thể dễ dàng được cải tiến để implement một interface mới.** Tất cả những gì bạn phải làm là thêm các method bắt buộc, nếu chúng chưa tồn tại, và thêm mệnh đề `implements` vào khai báo class. Ví dụ, nhiều class hiện có đã được cải tiến để implement các interface `Comparable`, `Iterable` và `AutoCloseable` khi chúng được thêm vào nền tảng. Nhìn chung, các class hiện có không thể được cải tiến để extends một abstract class mới. Nếu bạn muốn hai class extends cùng một abstract class, bạn phải đặt nó ở vị trí cao trong cây phân cấp kiểu, nơi nó là tổ tiên của cả hai class. Đáng tiếc, điều này có thể gây ra thiệt hại phụ lớn cho cây phân cấp kiểu, buộc tất cả hậu duệ của abstract class mới phải kế thừa nó, dù có phù hợp hay không.

**Interface lý tưởng để định nghĩa mixin.** Nói một cách lỏng lẻo, một *mixin* là một kiểu mà một class có thể implement bên cạnh "kiểu chính" của nó, để khai báo rằng nó cung cấp một hành vi tùy chọn nào đó. Ví dụ, `Comparable` là một mixin interface cho phép một class khai báo rằng các instance của nó có thứ tự so với các object khác có thể so sánh lẫn nhau. Interface như vậy được gọi là mixin vì nó cho phép chức năng tùy chọn được "trộn vào" chức năng chính của kiểu. Abstract class không thể được dùng để định nghĩa mixin vì cùng lý do mà chúng không thể được cải tiến vào các class hiện có: một class không thể có nhiều hơn một cha, và không có chỗ hợp lý nào trong cây phân cấp class để chèn một mixin vào.

**Interface cho phép xây dựng các khung kiểu phi phân cấp.** Cây phân cấp kiểu rất tốt để tổ chức một số thứ, nhưng những thứ khác không nằm gọn gàng trong một cây phân cấp cứng nhắc. Ví dụ, giả sử chúng ta có một interface biểu diễn ca sĩ và một interface khác biểu diễn nhạc sĩ:

```java
public interface Singer {
    AudioClip sing(Song s);
}

public interface Songwriter {
    Song compose(int chartPosition);
}
```

Trong đời thực, một số ca sĩ cũng là nhạc sĩ. Vì chúng ta dùng interface thay vì abstract class để định nghĩa các kiểu này, hoàn toàn được phép để một class duy nhất implement cả `Singer` lẫn `Songwriter`. Thực tế, chúng ta có thể định nghĩa một interface thứ ba extends cả `Singer` lẫn `Songwriter` và thêm các method mới phù hợp với sự kết hợp đó:

```java
public interface SingerSongwriter extends Singer, Songwriter {
    AudioClip strum();
    void actSensitive();
}
```

Không phải lúc nào bạn cũng cần mức linh hoạt này, nhưng khi cần, interface là cứu tinh. Phương án thay thế là một cây phân cấp class phình to chứa một class riêng cho mỗi tổ hợp thuộc tính được hỗ trợ. Nếu có *n* thuộc tính trong hệ thống kiểu, có 2^*n* tổ hợp khả dĩ mà bạn có thể phải hỗ trợ. Đây là điều được gọi là *bùng nổ tổ hợp* (combinatorial explosion). Cây phân cấp class phình to có thể dẫn đến các class phình to với nhiều method chỉ khác nhau ở kiểu đối số, vì không có kiểu nào trong cây phân cấp class để nắm bắt các hành vi chung.

**Interface cho phép nâng cao chức năng một cách an toàn và mạnh mẽ** thông qua idiom *wrapper class* (**Item 18**). Nếu bạn dùng abstract class để định nghĩa kiểu, bạn để lập trình viên muốn thêm chức năng không còn lựa chọn nào khác ngoài inheritance. Các class thu được kém mạnh mẽ hơn và mong manh hơn wrapper class.

Khi có một cài đặt hiển nhiên của một method interface dựa trên các method interface khác, hãy cân nhắc hỗ trợ cài đặt cho lập trình viên dưới dạng một default method. Để xem ví dụ về kỹ thuật này, hãy xem method `removeIf` ở trang 104. Nếu bạn cung cấp default method, hãy nhớ tài liệu hóa chúng cho inheritance bằng Javadoc tag `@implSpec` (**Item 19**).

Có những giới hạn về mức độ hỗ trợ cài đặt mà bạn có thể cung cấp bằng default method. Mặc dù nhiều interface quy định hành vi của các method của `Object` như `equals` và `hashCode`, bạn không được phép cung cấp default method cho chúng. Ngoài ra, interface không được phép chứa instance field hoặc các thành viên static không phải public (ngoại trừ các method static private). Cuối cùng, bạn không thể thêm default method vào một interface mà bạn không kiểm soát.

Tuy nhiên, bạn có thể kết hợp ưu điểm của interface và abstract class bằng cách cung cấp một *skeletal implementation class* (class cài đặt khung) abstract đi kèm với interface. Interface định nghĩa kiểu, có thể cung cấp một số default method, trong khi skeletal implementation class cài đặt các method interface không nguyên thủy còn lại dựa trên các method interface nguyên thủy. Kế thừa một skeletal implementation giúp loại bỏ phần lớn công việc cài đặt một interface. Đây là mẫu *Template Method* [**Gamma95**].

Theo quy ước, các skeletal implementation class được gọi là `Abstract`*Interface*, trong đó *Interface* là tên của interface mà chúng implement. Ví dụ, Collections Framework cung cấp một skeletal implementation đi kèm với mỗi interface collection chính: `AbstractCollection`, `AbstractSet`, `AbstractList` và `AbstractMap`. Có thể lập luận rằng sẽ hợp lý nếu gọi chúng là `SkeletalCollection`, `SkeletalSet`, `SkeletalList` và `SkeletalMap`, nhưng quy ước `Abstract` giờ đã được thiết lập vững chắc. Khi được thiết kế đúng cách, các skeletal implementation (dù là một abstract class riêng biệt, hay chỉ gồm các default method trên một interface) có thể giúp lập trình viên cung cấp cài đặt riêng của họ cho một interface một cách *rất* dễ dàng. Ví dụ, đây là một static factory method chứa một cài đặt `List` hoàn chỉnh, đầy đủ chức năng, dựa trên `AbstractList`:

```java
// Concrete implementation built atop skeletal implementation
static List<Integer> intArrayAsList(int[] a) {
    Objects.requireNonNull(a);

    // The diamond operator is only legal here in Java 9 and later
    // If you're using an earlier release, specify <Integer>
    return new AbstractList<>() {
        @Override public Integer get(int i) {
            return a[i];  // Autoboxing (Item 6)
        }

        @Override public Integer set(int i, Integer val) {
            int oldVal = a[i];
            a[i] = val;     // Auto-unboxing
            return oldVal;  // Autoboxing
        }

        @Override public int size() {
            return a.length;
        }
    };
}
```

Khi bạn xem xét tất cả những gì một cài đặt `List` làm cho bạn, ví dụ này là một minh chứng ấn tượng về sức mạnh của skeletal implementation. Nhân tiện, ví dụ này là một *Adapter* [**Gamma95**] cho phép một mảng `int` được xem như một list các instance `Integer`. Vì tất cả việc chuyển đổi qua lại giữa các giá trị `int` và các instance `Integer` (boxing và unboxing), hiệu năng của nó không tốt lắm. Lưu ý rằng cài đặt có dạng một *anonymous class* (**Item 24**).

Vẻ đẹp của skeletal implementation class là chúng cung cấp toàn bộ sự hỗ trợ cài đặt của abstract class mà không áp đặt những ràng buộc nghiêm ngặt mà abstract class áp đặt khi chúng đóng vai trò định nghĩa kiểu. Với hầu hết những người cài đặt một interface có skeletal implementation class, kế thừa class này là lựa chọn hiển nhiên, nhưng điều đó hoàn toàn là tùy chọn. Nếu một class không thể extends skeletal implementation, class đó luôn có thể implement interface trực tiếp. Class vẫn được hưởng lợi từ mọi default method có trên chính interface. Hơn nữa, skeletal implementation vẫn có thể hỗ trợ công việc của người cài đặt. Class implement interface có thể chuyển tiếp các lời gọi method của interface đến một instance được chứa bên trong của một private inner class extends skeletal implementation. Kỹ thuật này, được gọi là *đa kế thừa mô phỏng* (simulated multiple inheritance), có liên quan chặt chẽ với idiom wrapper class được thảo luận trong **Item 18**. Nó cung cấp nhiều lợi ích của đa kế thừa, trong khi tránh được những cạm bẫy.

Viết một skeletal implementation là một quá trình tương đối đơn giản, dù hơi tẻ nhạt. Trước hết, hãy nghiên cứu interface và quyết định xem method nào là nguyên thủy (primitive) mà dựa vào đó các method khác có thể được cài đặt. Các method nguyên thủy này sẽ là các abstract method trong skeletal implementation của bạn. Tiếp theo, cung cấp default method trong interface cho tất cả các method có thể được cài đặt trực tiếp dựa trên các method nguyên thủy, nhưng nhớ rằng bạn không được cung cấp default method cho các method của `Object` như `equals` và `hashCode`. Nếu các method nguyên thủy và default method đã bao phủ interface, bạn đã xong và không cần skeletal implementation class. Nếu không, hãy viết một class được khai báo implement interface, với cài đặt cho tất cả các method interface còn lại. Class có thể chứa bất kỳ field và method không phải public nào phù hợp với nhiệm vụ.

Lấy một ví dụ đơn giản, hãy xem interface `Map.Entry`. Các method nguyên thủy hiển nhiên là `getKey`, `getValue` và (tùy chọn) `setValue`. Interface quy định hành vi của `equals` và `hashCode`, và có một cài đặt hiển nhiên của `toString` dựa trên các method nguyên thủy. Vì bạn không được phép cung cấp cài đặt mặc định cho các method của `Object`, tất cả các cài đặt được đặt trong skeletal implementation class:

```java
// Skeletal implementation class
public abstract class AbstractMapEntry<K,V>
        implements Map.Entry<K,V> {
    // Entries in a modifiable map must override this method
    @Override public V setValue(V value) {
        throw new UnsupportedOperationException();
    }

    // Implements the general contract of Map.Entry.equals
    @Override public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof Map.Entry))
            return false;
        Map.Entry<?,?> e = (Map.Entry) o;
        return Objects.equals(e.getKey(),  getKey())
            && Objects.equals(e.getValue(), getValue());
    }

    // Implements the general contract of Map.Entry.hashCode
    @Override public int hashCode() {
        return Objects.hashCode(getKey())
             ^ Objects.hashCode(getValue());
    }

    @Override public String toString() {
        return getKey() + "=" + getValue();
    }
}
```

Lưu ý rằng skeletal implementation này không thể được cài đặt trong interface `Map.Entry` hay dưới dạng một subinterface vì default method không được phép override các method của `Object` như `equals`, `hashCode` và `toString`.

Vì skeletal implementation được thiết kế cho inheritance, bạn nên tuân theo tất cả các hướng dẫn về thiết kế và tài liệu hóa trong **Item 19**. Để ngắn gọn, các comment tài liệu đã được lược bỏ khỏi ví dụ trên, nhưng **tài liệu tốt là tuyệt đối thiết yếu trong một skeletal implementation,** dù nó gồm các default method trên một interface hay là một abstract class riêng biệt.

Một biến thể nhỏ của skeletal implementation là *simple implementation* (cài đặt đơn giản), được minh họa bởi `AbstractMap.SimpleEntry`. Một simple implementation giống skeletal implementation ở chỗ nó implement một interface và được thiết kế cho inheritance, nhưng khác ở chỗ nó không phải abstract: nó là cài đặt hoạt động đơn giản nhất có thể. Bạn có thể dùng nó nguyên trạng hoặc kế thừa nó tùy hoàn cảnh.

Tóm lại, interface nhìn chung là cách tốt nhất để định nghĩa một kiểu cho phép nhiều cài đặt. Nếu bạn xuất ra một interface không tầm thường, bạn nên cân nhắc nghiêm túc việc cung cấp một skeletal implementation đi kèm. Trong chừng mực có thể, bạn nên cung cấp skeletal implementation thông qua các default method trên interface để tất cả những người cài đặt interface đều có thể tận dụng nó. Dù vậy, các hạn chế của interface thường buộc skeletal implementation phải có dạng một abstract class.

## Item 21: Thiết kế interface cho hậu thế

Trước Java 8, không thể thêm method vào interface mà không làm hỏng các cài đặt hiện có. Nếu bạn thêm một method mới vào một interface, các cài đặt hiện có nhìn chung sẽ thiếu method đó, dẫn đến lỗi biên dịch. Trong Java 8, cấu trúc *default method* được thêm vào [**JLS 9.4**], với ý định cho phép thêm method vào các interface hiện có. Nhưng việc thêm method mới vào các interface hiện có đầy rẫy rủi ro.

Khai báo của một default method bao gồm một *cài đặt mặc định* được dùng bởi tất cả các class implement interface nhưng không implement default method đó. Mặc dù việc thêm default method vào Java giúp thêm method vào một interface hiện có trở nên khả thi, không có gì đảm bảo rằng các method này sẽ hoạt động trong mọi cài đặt có sẵn từ trước. Default method được "tiêm" vào các cài đặt hiện có mà những người cài đặt chúng không hề hay biết hay đồng ý. Trước Java 8, các cài đặt này được viết với sự hiểu ngầm rằng interface của chúng sẽ *không bao giờ* có thêm method mới.

Nhiều default method mới đã được thêm vào các interface collection cốt lõi trong Java 8, chủ yếu để hỗ trợ việc dùng lambda (**Chương 7**). Các default method của thư viện Java là những cài đặt đa dụng chất lượng cao, và trong hầu hết trường hợp, chúng hoạt động tốt. Nhưng **không phải lúc nào cũng có thể viết một default method duy trì được tất cả các bất biến của mọi cài đặt có thể tưởng tượng ra.**

Ví dụ, hãy xem method `removeIf`, được thêm vào interface `Collection` trong Java 8. Method này xóa tất cả các phần tử mà một hàm `boolean` cho trước (hay *predicate*) trả về `true`. Cài đặt mặc định được quy định là duyệt qua collection bằng iterator của nó, gọi predicate trên mỗi phần tử, và dùng method `remove` của iterator để xóa các phần tử mà predicate trả về `true`. Có lẽ khai báo trông giống thế này:

```java
// Default method added to the Collection interface in Java 8
default boolean removeIf(Predicate<? super E> filter) {
    Objects.requireNonNull(filter);
    boolean result = false;
    for (Iterator<E> it = iterator(); it.hasNext(); ) {
        if (filter.test(it.next())) {
            it.remove();
            result = true;
        }
    }
    return result;
}
```

Đây là cài đặt đa dụng tốt nhất mà người ta có thể viết cho method `removeIf`, nhưng đáng buồn là nó thất bại trên một số cài đặt `Collection` trong thực tế. Ví dụ, hãy xem `org.apache.commons.collections4.collection.SynchronizedCollection`. Class này, từ thư viện Apache Commons, tương tự class được trả về bởi static factory `Collections.synchronizedCollection` trong `java.util`. Phiên bản Apache còn cung cấp thêm khả năng dùng một object do client cung cấp để khóa (lock), thay vì chính collection. Nói cách khác, nó là một wrapper class (**Item 18**), mà tất cả các method của nó đều đồng bộ hóa trên một object khóa trước khi ủy quyền cho collection được bao bọc.

Class `SynchronizedCollection` của Apache vẫn đang được bảo trì tích cực, nhưng tính đến thời điểm viết cuốn sách này, nó không override method `removeIf`. Do đó, nếu class này được dùng cùng với Java 8, nó sẽ kế thừa cài đặt mặc định của `removeIf`, vốn không, và thực ra *không thể*, duy trì lời hứa cơ bản của class: tự động đồng bộ hóa xung quanh mỗi lời gọi method. Cài đặt mặc định không biết gì về đồng bộ hóa và không có quyền truy cập vào field chứa object khóa. Nếu một client gọi method `removeIf` trên một instance `SynchronizedCollection` trong khi có sự sửa đổi đồng thời collection bởi một thread khác, `ConcurrentModificationException` hoặc hành vi không xác định khác có thể xảy ra.

Để ngăn điều này xảy ra trong các cài đặt tương tự của các thư viện nền tảng Java, chẳng hạn class package-private được trả về bởi `Collections.synchronizedCollection`, những người bảo trì JDK đã phải override cài đặt mặc định của `removeIf` và các method tương tự khác để thực hiện đồng bộ hóa cần thiết trước khi gọi cài đặt mặc định. Các cài đặt collection có sẵn từ trước mà không thuộc nền tảng Java đã không có cơ hội thực hiện các thay đổi tương tự đồng bộ với sự thay đổi của interface, và một số đến nay vẫn chưa làm.

**Khi có default method, các cài đặt hiện có của một interface có thể biên dịch không lỗi hay cảnh báo nhưng lại thất bại lúc runtime.** Mặc dù không quá phổ biến, vấn đề này cũng không phải là sự cố đơn lẻ. Một số method được thêm vào các interface collection trong Java 8 được biết là dễ bị ảnh hưởng, và một số cài đặt hiện có được biết là đã bị ảnh hưởng.

Nên tránh dùng default method để thêm method mới vào các interface hiện có trừ khi nhu cầu là cấp thiết, và trong trường hợp đó bạn nên suy nghĩ thật lâu và kỹ về việc liệu một cài đặt interface hiện có có thể bị hỏng bởi cài đặt default method của bạn hay không. Tuy nhiên, default method cực kỳ hữu ích để cung cấp các cài đặt method chuẩn khi một interface được tạo ra, nhằm giảm nhẹ công việc cài đặt interface (**Item 20**).

Cũng đáng lưu ý rằng default method không được thiết kế để hỗ trợ việc xóa method khỏi interface hay thay đổi chữ ký của các method hiện có. Không thay đổi interface nào trong hai loại này khả thi mà không làm hỏng các client hiện có.

Bài học rất rõ ràng. Mặc dù default method giờ đã là một phần của nền tảng Java, **việc thiết kế interface một cách hết sức cẩn thận vẫn có tầm quan trọng tối cao.** Mặc dù default method giúp việc thêm method vào các interface hiện có trở nên *khả thi*, làm vậy có rủi ro rất lớn. Nếu một interface chứa một khiếm khuyết nhỏ, nó có thể làm phiền người dùng mãi mãi; nếu một interface thiếu sót nghiêm trọng, nó có thể hủy hoại cả API chứa nó.

Do đó, việc kiểm thử mỗi interface mới trước khi phát hành là cực kỳ quan trọng. Nhiều lập trình viên nên implement mỗi interface theo những cách khác nhau. Tối thiểu, bạn nên nhắm đến ba cài đặt đa dạng. Quan trọng không kém là viết nhiều chương trình client sử dụng các instance của mỗi interface mới để thực hiện nhiều tác vụ khác nhau. Điều này sẽ góp phần lớn đảm bảo rằng mỗi interface đáp ứng tất cả các mục đích sử dụng dự kiến của nó. Những bước này sẽ cho phép bạn phát hiện khiếm khuyết trong interface trước khi chúng được phát hành, khi bạn vẫn có thể sửa chúng dễ dàng. **Mặc dù có thể sửa được một số khiếm khuyết của interface sau khi interface được phát hành, bạn không thể trông cậy vào điều đó**.

## Item 22: Chỉ dùng interface để định nghĩa kiểu

Khi một class implement một interface, interface đóng vai trò là một *kiểu* (type) có thể được dùng để tham chiếu đến các instance của class. Do đó, việc một class implement một interface nên nói lên điều gì đó về những gì client có thể làm với các instance của class. Định nghĩa một interface cho bất kỳ mục đích nào khác là không thích hợp.

Một loại interface không vượt qua được phép thử này là cái gọi là *constant interface* (interface hằng số). Interface như vậy không chứa method nào; nó chỉ gồm các field static final, mỗi field xuất ra một hằng số. Các class sử dụng những hằng số này implement interface để tránh phải định danh tên hằng số bằng tên class. Đây là một ví dụ:

```java
// Constant interface antipattern - do not use!
public interface PhysicalConstants {
    // Avogadro's number (1/mol)
    static final double AVOGADROS_NUMBER   = 6.022_140_857e23;
    // Boltzmann constant (J/K)
    static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;

    // Mass of the electron (kg)
    static final double ELECTRON_MASS      = 9.109_383_56e-31;
}
```

**Mẫu constant interface là một cách sử dụng interface tồi.** Việc một class dùng một số hằng số bên trong là một chi tiết cài đặt. Implement một constant interface khiến chi tiết cài đặt này rò rỉ vào API được xuất ra của class. Việc class implement một constant interface không có ý nghĩa gì đối với người dùng của class. Thực tế, nó thậm chí có thể khiến họ bối rối. Tệ hơn, nó thể hiện một cam kết: nếu trong một phiên bản tương lai class được sửa đổi để không còn cần dùng các hằng số nữa, nó vẫn phải implement interface để đảm bảo tương thích nhị phân. Nếu một class không phải final implement một constant interface, tất cả các subclass của nó sẽ bị ô nhiễm không gian tên bởi các hằng số trong interface.

Có một số constant interface trong các thư viện nền tảng Java, chẳng hạn `java.io.ObjectStreamConstants`. Những interface này nên được xem là những trường hợp dị thường và không nên bắt chước.

Nếu bạn muốn xuất ra các hằng số, có một số lựa chọn hợp lý. Nếu các hằng số gắn chặt với một class hoặc interface hiện có, bạn nên thêm chúng vào class hoặc interface đó. Ví dụ, tất cả các class boxed primitive kiểu số, như `Integer` và `Double`, đều xuất ra các hằng số `MIN_VALUE` và `MAX_VALUE`. Nếu các hằng số tốt nhất nên được xem là thành viên của một kiểu liệt kê, bạn nên xuất chúng bằng một *enum type* (**Item 34**). Nếu không, bạn nên xuất các hằng số bằng một *utility class* (class tiện ích) không thể khởi tạo (**Item 4**). Đây là phiên bản utility class của ví dụ `PhysicalConstants` ở trên:

```java
// Constant utility class
package com.effectivejava.science;

public class PhysicalConstants {
  private PhysicalConstants() { }  // Prevents instantiation
  public static final double AVOGADROS_NUMBER = 6.022_140_857e23;
  public static final double BOLTZMANN_CONST  = 1.380_648_52e-23;
  public static final double ELECTRON_MASS    = 9.109_383_56e-31;
}
```

Nhân tiện, hãy để ý việc dùng ký tự gạch dưới (`_`) trong các literal số. Dấu gạch dưới, hợp lệ từ Java 7, không ảnh hưởng đến giá trị của literal số, nhưng có thể giúp chúng dễ đọc hơn nhiều nếu được dùng một cách thận trọng. Hãy cân nhắc thêm dấu gạch dưới vào các literal số, dù là số nguyên hay dấu phẩy động, nếu chúng chứa từ năm chữ số liên tiếp trở lên. Với các literal hệ mười, dù là số nguyên hay dấu phẩy động, bạn nên dùng dấu gạch dưới để tách literal thành các nhóm ba chữ số biểu thị lũy thừa dương và âm của một nghìn.

Thông thường một utility class đòi hỏi client phải định danh tên hằng số bằng tên class, ví dụ `PhysicalConstants.AVOGADROS_NUMBER`. Nếu bạn dùng nhiều các hằng số được xuất ra bởi một utility class, bạn có thể tránh phải định danh hằng số bằng tên class bằng cách sử dụng tiện ích *static import*:

```java
// Use of static import to avoid qualifying constants
import static com.effectivejava.science.PhysicalConstants.*;

public class Test {
    double  atoms(double mols) {
        return AVOGADROS_NUMBER * mols;
    }
    ...
    // Many more uses of PhysicalConstants justify static import
}
```

Tóm lại, interface chỉ nên được dùng để định nghĩa kiểu. Không nên dùng chúng chỉ để xuất ra các hằng số.

## Item 23: Ưu tiên cây phân cấp class hơn tagged class

Đôi khi bạn có thể gặp một class mà các instance của nó có hai hoặc nhiều "hương vị" (flavor) và chứa một field *tag* (thẻ) cho biết hương vị của instance. Ví dụ, hãy xem class này, có khả năng biểu diễn một hình tròn hoặc một hình chữ nhật:

```java
// Tagged class - vastly inferior to a class hierarchy!
class Figure {
    enum Shape { RECTANGLE, CIRCLE };

    // Tag field - the shape of this figure
    final Shape shape;

    // These fields are used only if shape is RECTANGLE
    double length;
    double width;

    // This field is used only if shape is CIRCLE
    double radius;

    // Constructor for circle
    Figure(double radius) {
        shape = Shape.CIRCLE;
        this.radius = radius;
    }

    // Constructor for rectangle
    Figure(double length, double width) {
        shape = Shape.RECTANGLE;
        this.length = length;
        this.width = width;
    }

    double area() {
        switch(shape) {
          case RECTANGLE:
            return length * width;
          case CIRCLE:
            return Math.PI * (radius * radius);
          default:
            throw new AssertionError(shape);
        }
    }
}
```

Những *tagged class* (class gắn thẻ) như vậy có vô số thiếu sót. Chúng rối rắm với boilerplate, bao gồm khai báo enum, field tag và các câu lệnh switch. Khả năng đọc còn bị tổn hại thêm vì nhiều cài đặt bị trộn lẫn trong một class duy nhất. Dấu chân bộ nhớ tăng lên vì các instance phải gánh thêm những field không liên quan thuộc về các hương vị khác. Các field không thể được làm final trừ khi constructor khởi tạo cả những field không liên quan, dẫn đến thêm boilerplate. Constructor phải đặt field tag và khởi tạo đúng các field dữ liệu mà không có sự trợ giúp nào từ trình biên dịch: nếu bạn khởi tạo sai field, chương trình sẽ thất bại lúc runtime. Bạn không thể thêm một hương vị vào tagged class trừ khi bạn có thể sửa file nguồn của nó. Nếu bạn thêm một hương vị, bạn phải nhớ thêm một case vào mọi câu lệnh switch, nếu không class sẽ thất bại lúc runtime. Cuối cùng, kiểu dữ liệu của một instance không cho biết chút manh mối nào về hương vị của nó. Tóm lại, **tagged class dài dòng, dễ gây lỗi và kém hiệu quả.**

May mắn thay, các ngôn ngữ hướng đối tượng như Java cung cấp một phương án tốt hơn nhiều để định nghĩa một kiểu dữ liệu duy nhất có khả năng biểu diễn các object thuộc nhiều hương vị: subtyping (phân kiểu con). **Một tagged class chỉ là sự bắt chước nhợt nhạt của một cây phân cấp class.**

Để chuyển đổi một tagged class thành một cây phân cấp class, trước hết hãy định nghĩa một abstract class chứa một abstract method cho mỗi method trong tagged class mà hành vi phụ thuộc vào giá trị tag. Trong class `Figure`, chỉ có một method như vậy, đó là `area`. Abstract class này là gốc của cây phân cấp class. Nếu có method nào mà hành vi không phụ thuộc vào giá trị của tag, hãy đặt chúng vào class này. Tương tự, nếu có field dữ liệu nào được dùng bởi tất cả các hương vị, hãy đặt chúng vào class này. Không có method hay field độc lập với hương vị nào như vậy trong class `Figure`.

Tiếp theo, định nghĩa một subclass cụ thể của class gốc cho mỗi hương vị của tagged class ban đầu. Trong ví dụ của chúng ta, có hai: hình tròn và hình chữ nhật. Đưa vào mỗi subclass các field dữ liệu đặc thù cho hương vị của nó. Trong ví dụ của chúng ta, `radius` là đặc thù của hình tròn, còn `length` và `width` là đặc thù của hình chữ nhật. Cũng đưa vào mỗi subclass cài đặt thích hợp cho mỗi abstract method trong class gốc. Đây là cây phân cấp class tương ứng với class `Figure` ban đầu:

```java
// Class hierarchy replacement for a tagged class
abstract class Figure {
    abstract double area();
}

class Circle extends Figure {
    final double radius;

    Circle(double radius) { this.radius = radius; }

    @Override double area() { return Math.PI * (radius * radius); }
}

class Rectangle extends Figure {
    final double length;
    final double width;

    Rectangle(double length, double width) {
        this.length = length;
        this.width  = width;
    }
    @Override double area() { return length * width; }
}
```

Cây phân cấp class này khắc phục mọi thiếu sót của tagged class đã nêu ở trên. Code đơn giản và rõ ràng, không chứa chút boilerplate nào có trong bản gốc. Cài đặt của mỗi hương vị được cấp class riêng, và không class nào trong số này bị vướng víu bởi các field dữ liệu không liên quan. Tất cả các field đều là final. Trình biên dịch đảm bảo rằng constructor của mỗi class khởi tạo các field dữ liệu của nó và mỗi class có cài đặt cho mọi abstract method được khai báo trong class gốc. Điều này loại bỏ khả năng thất bại lúc runtime do thiếu một case trong switch. Nhiều lập trình viên có thể mở rộng cây phân cấp một cách độc lập và tương tác được với nhau mà không cần truy cập mã nguồn của class gốc. Có một kiểu dữ liệu riêng gắn với mỗi hương vị, cho phép lập trình viên chỉ ra hương vị của một biến và giới hạn các biến cũng như tham số đầu vào vào một hương vị cụ thể.

Một ưu điểm khác của cây phân cấp class là chúng có thể được làm để phản ánh các quan hệ phân cấp tự nhiên giữa các kiểu, cho phép tăng tính linh hoạt và kiểm tra kiểu lúc biên dịch tốt hơn. Giả sử tagged class trong ví dụ ban đầu cũng cho phép hình vuông. Cây phân cấp class có thể được làm để phản ánh thực tế rằng hình vuông là một loại hình chữ nhật đặc biệt (giả sử cả hai đều immutable):

```java
class Square extends Rectangle {
    Square(double side) {
        super(side, side);
    }
}
```

Lưu ý rằng các field trong cây phân cấp trên được truy cập trực tiếp thay vì qua accessor method. Điều này được làm để ngắn gọn và sẽ là một thiết kế tồi nếu cây phân cấp là public (**Item 16**).

Tóm lại, tagged class hiếm khi thích hợp. Nếu bạn bị cám dỗ viết một class có field tag tường minh, hãy nghĩ xem liệu tag có thể được loại bỏ và class được thay thế bằng một cây phân cấp hay không. Khi bạn gặp một class hiện có với field tag, hãy cân nhắc refactor nó thành một cây phân cấp.

## Item 24: Ưu tiên static member class hơn nonstatic

Một *nested class* (class lồng) là một class được định nghĩa bên trong một class khác. Một nested class chỉ nên tồn tại để phục vụ class bao ngoài của nó. Nếu một nested class hữu ích trong ngữ cảnh nào khác, thì nó nên là một class top-level. Có bốn loại nested class: *static member class*, *nonstatic member class*, *anonymous class* và *local class*. Tất cả trừ loại đầu tiên được gọi là *inner class*. Item này cho bạn biết khi nào dùng loại nested class nào và tại sao.

Static member class là loại nested class đơn giản nhất. Tốt nhất nên xem nó như một class thông thường tình cờ được khai báo bên trong một class khác và có quyền truy cập vào tất cả các thành viên của class bao ngoài, kể cả những thành viên được khai báo private. Static member class là một thành viên static của class bao ngoài và tuân theo cùng các quy tắc truy cập như các thành viên static khác. Nếu nó được khai báo private, nó chỉ có thể được truy cập bên trong class bao ngoài, và tương tự.

Một cách dùng phổ biến của static member class là làm một helper class public, chỉ hữu ích khi đi kèm với class bên ngoài của nó. Ví dụ, hãy xem một enum mô tả các phép toán được hỗ trợ bởi một máy tính (**Item 34**). Enum `Operation` nên là một public static member class của class `Calculator`. Client của `Calculator` khi đó có thể tham chiếu đến các phép toán bằng những tên như `Calculator.Operation.PLUS` và `Calculator.Operation.MINUS`.

Về mặt cú pháp, khác biệt duy nhất giữa static và nonstatic member class là static member class có modifier `static` trong khai báo. Mặc dù giống nhau về cú pháp, hai loại nested class này rất khác nhau. Mỗi instance của một nonstatic member class được gắn ngầm định với một *enclosing instance* (instance bao ngoài) của class chứa nó. Bên trong các instance method của một nonstatic member class, bạn có thể gọi method trên enclosing instance hoặc lấy tham chiếu đến enclosing instance bằng cấu trúc *qualified this* [JLS, 15.8.4]. Nếu một instance của nested class có thể tồn tại độc lập với một instance của class bao ngoài, thì nested class đó *phải* là một static member class: không thể tạo instance của một nonstatic member class mà không có enclosing instance.

Sự gắn kết giữa một instance của nonstatic member class và enclosing instance của nó được thiết lập khi instance của member class được tạo ra và không thể thay đổi sau đó. Thông thường, sự gắn kết được thiết lập tự động bằng cách gọi constructor của nonstatic member class từ bên trong một instance method của class bao ngoài. Có thể, dù hiếm, thiết lập sự gắn kết thủ công bằng biểu thức `enclosingInstance.new MemberClass(args)`. Như bạn có thể đoán, sự gắn kết này chiếm không gian trong instance của nonstatic member class và làm tăng thời gian tạo nó.

Một cách dùng phổ biến của nonstatic member class là để định nghĩa một *Adapter* [**Gamma95**] cho phép một instance của class bên ngoài được xem như một instance của một class không liên quan nào đó. Ví dụ, các cài đặt của interface `Map` thường dùng nonstatic member class để cài đặt các *collection view* của chúng, được trả về bởi các method `keySet`, `entrySet` và `values` của `Map`. Tương tự, các cài đặt của các interface collection, như `Set` và `List`, thường dùng nonstatic member class để cài đặt iterator của chúng:

```java
// Typical use of a nonstatic member class
public class MySet<E> extends AbstractSet<E> {
    ... // Bulk of the class omitted

    @Override public Iterator<E> iterator() {
        return new MyIterator();
    }

    private class MyIterator implements Iterator<E> {
        ...
    }
}
```

**Nếu bạn khai báo một member class không cần truy cập vào enclosing instance, hãy luôn đặt modifier** `static` **trong khai báo của nó,** biến nó thành static thay vì nonstatic member class. Nếu bạn bỏ qua modifier này, mỗi instance sẽ có một tham chiếu ẩn thừa thãi đến enclosing instance của nó. Như đã đề cập, việc lưu tham chiếu này tốn thời gian và không gian. Nghiêm trọng hơn, nó có thể khiến enclosing instance bị giữ lại trong khi lẽ ra đã đủ điều kiện để được garbage collect (**Item 7**). Rò rỉ bộ nhớ dẫn đến có thể là thảm họa. Nó thường khó phát hiện vì tham chiếu là vô hình.

Một cách dùng phổ biến của private static member class là biểu diễn các thành phần của object được biểu diễn bởi class bao ngoài của chúng. Ví dụ, hãy xem một instance `Map`, gắn các khóa với các giá trị. Nhiều cài đặt `Map` có một object `Entry` nội bộ cho mỗi cặp khóa-giá trị trong map. Mặc dù mỗi entry gắn với một map, các method trên một entry (`getKey`, `getValue` và `setValue`) không cần truy cập vào map. Do đó, dùng nonstatic member class để biểu diễn entry sẽ là lãng phí: private static member class là tốt nhất. Nếu bạn vô tình bỏ qua modifier `static` trong khai báo entry, map vẫn sẽ hoạt động, nhưng mỗi entry sẽ chứa một tham chiếu thừa đến map, gây lãng phí không gian và thời gian.

Việc chọn đúng giữa static và nonstatic member class càng quan trọng gấp đôi nếu class đang xét là một thành viên public hoặc protected của một class được xuất ra. Trong trường hợp này, member class là một phần tử API được xuất ra và không thể được thay đổi từ nonstatic thành static member class trong phiên bản sau mà không vi phạm tương thích ngược.

Như bạn có thể đoán, anonymous class (class vô danh) không có tên. Nó không phải là thành viên của class bao ngoài. Thay vì được khai báo cùng với các thành viên khác, nó được khai báo và khởi tạo đồng thời tại điểm sử dụng. Anonymous class được phép ở bất kỳ điểm nào trong code mà một biểu thức là hợp lệ. Anonymous class có enclosing instance khi và chỉ khi chúng xuất hiện trong ngữ cảnh nonstatic. Nhưng ngay cả khi xuất hiện trong ngữ cảnh static, chúng không thể có bất kỳ thành viên static nào ngoài các *constant variable* (biến hằng), tức là các field final kiểu primitive hoặc string được khởi tạo bằng biểu thức hằng [JLS, 4.12.4].

Có nhiều hạn chế về khả năng áp dụng của anonymous class. Bạn không thể khởi tạo chúng ngoại trừ tại điểm chúng được khai báo. Bạn không thể thực hiện kiểm tra `instanceof` hay làm bất cứ điều gì khác đòi hỏi bạn phải gọi tên class. Bạn không thể khai báo một anonymous class implement nhiều interface, hoặc vừa extends một class vừa implement một interface cùng lúc. Client của một anonymous class không thể gọi bất kỳ thành viên nào ngoài những thành viên nó kế thừa từ supertype của nó. Vì anonymous class xuất hiện giữa các biểu thức, chúng phải được giữ ngắn—khoảng mười dòng trở xuống—nếu không khả năng đọc sẽ bị tổn hại.

Trước khi lambda được thêm vào Java (**Chương 7**), anonymous class là phương tiện được ưa chuộng để tạo nhanh các *function object* và *process object* nhỏ, nhưng giờ lambda được ưu tiên hơn (**Item 42**). Một cách dùng phổ biến khác của anonymous class là trong cài đặt các static factory method (xem `intArrayAsList` trong **Item 20**).

Local class (class cục bộ) là loại ít được dùng nhất trong bốn loại nested class. Một local class có thể được khai báo ở hầu như bất cứ đâu mà một biến cục bộ có thể được khai báo và tuân theo cùng các quy tắc phạm vi. Local class có những thuộc tính chung với mỗi loại nested class khác. Giống member class, chúng có tên và có thể được dùng lặp lại. Giống anonymous class, chúng chỉ có enclosing instance nếu được định nghĩa trong ngữ cảnh nonstatic, và chúng không thể chứa thành viên static. Và giống anonymous class, chúng nên được giữ ngắn để không làm tổn hại khả năng đọc.

Tóm lại, có bốn loại nested class khác nhau, và mỗi loại có chỗ đứng riêng. Nếu một nested class cần hiển thị bên ngoài một method duy nhất hoặc quá dài để nằm gọn thoải mái trong một method, hãy dùng member class. Nếu mỗi instance của member class cần một tham chiếu đến enclosing instance của nó, hãy làm nó nonstatic; nếu không, hãy làm nó static. Giả sử class thuộc về bên trong một method, nếu bạn chỉ cần tạo instance từ một vị trí duy nhất và có sẵn một kiểu đặc trưng cho class đó, hãy làm nó thành anonymous class; nếu không, hãy làm nó thành local class.

## Item 25: Giới hạn file nguồn chỉ chứa một class top-level duy nhất

Mặc dù trình biên dịch Java cho phép bạn định nghĩa nhiều class top-level trong một file nguồn duy nhất, không có lợi ích nào gắn với việc làm vậy, và có những rủi ro đáng kể. Rủi ro bắt nguồn từ việc định nghĩa nhiều class top-level trong một file nguồn khiến việc cung cấp nhiều định nghĩa cho một class trở nên khả thi. Định nghĩa nào được dùng bị ảnh hưởng bởi thứ tự các file nguồn được truyền cho trình biên dịch.

Để cụ thể hóa, hãy xem file nguồn này, chỉ chứa một class `Main` tham chiếu đến các thành viên của hai class top-level khác (`Utensil` và `Dessert`):

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(Utensil.NAME + Dessert.NAME);
    }
}
```

Bây giờ giả sử bạn định nghĩa cả `Utensil` lẫn `Dessert` trong một file nguồn duy nhất tên là `Utensil.java`:

```java
// Two classes defined in one file. Don't ever do this!
class Utensil {
    static final String NAME = "pan";
}

class Dessert {
    static final String NAME = "cake";
}
```

Tất nhiên chương trình chính in ra `pancake`.

Bây giờ giả sử bạn vô tình tạo ra *một* file nguồn *khác* tên là `Dessert.java` định nghĩa cùng hai class đó:

```java
// Two classes defined in one file. Don't ever do this!
class Utensil {
    static final String NAME = "pot";
}

class Dessert {
    static final String NAME = "pie";
}
```

Nếu bạn đủ may mắn để biên dịch chương trình bằng lệnh `javac Main.java Dessert.java`, việc biên dịch sẽ thất bại, và trình biên dịch sẽ báo cho bạn rằng bạn đã định nghĩa nhiều lần các class `Utensil` và `Dessert`. Sở dĩ như vậy vì trình biên dịch sẽ biên dịch `Main.java` trước, và khi thấy tham chiếu đến `Utensil` (đứng trước tham chiếu đến `Dessert`), nó sẽ tìm trong `Utensil.java` để tìm class này và thấy cả `Utensil` lẫn `Dessert`. Khi trình biên dịch gặp `Dessert.java` trên dòng lệnh, nó cũng sẽ kéo file đó vào, khiến nó gặp cả hai định nghĩa của `Utensil` và `Dessert`.

Nếu bạn biên dịch chương trình bằng lệnh `javac Main.java` hoặc `javac Main.java Utensil.java`, nó sẽ hành xử như trước khi bạn viết file `Dessert.java`, in ra `pancake`. Nhưng nếu bạn biên dịch chương trình bằng lệnh `javac Dessert.java Main.java`, nó sẽ in ra `potpie`. Hành vi của chương trình do đó bị ảnh hưởng bởi thứ tự các file nguồn được truyền cho trình biên dịch, điều này rõ ràng là không thể chấp nhận.

Khắc phục vấn đề đơn giản chỉ là tách các class top-level (`Utensil` và `Dessert`, trong trường hợp ví dụ của chúng ta) thành các file nguồn riêng biệt. Nếu bạn bị cám dỗ đặt nhiều class top-level vào một file nguồn duy nhất, hãy cân nhắc dùng static member class (**Item 24**) như một phương án thay thế cho việc tách các class thành các file nguồn riêng. Nếu các class phụ thuộc vào một class khác, biến chúng thành static member class nhìn chung là phương án tốt hơn vì nó tăng khả năng đọc và cho phép giảm khả năng truy cập của các class bằng cách khai báo chúng private (**Item 15**). Đây là hình dạng ví dụ của chúng ta với static member class:

```java
// Static member classes instead of multiple top-level classes
public class Test {
    public static void main(String[] args) {
        System.out.println(Utensil.NAME + Dessert.NAME);
    }

    private static class Utensil {
        static final String NAME = "pan";
    }

    private static class Dessert {
        static final String NAME = "cake";
    }
}
```

Bài học rất rõ ràng: **Không bao giờ đặt nhiều class hoặc interface top-level trong một file nguồn duy nhất.** Tuân theo quy tắc này đảm bảo rằng bạn không thể có nhiều định nghĩa cho một class duy nhất lúc biên dịch. Điều này đến lượt nó đảm bảo rằng các file class được sinh ra bởi quá trình biên dịch, và hành vi của chương trình thu được, độc lập với thứ tự các file nguồn được truyền cho trình biên dịch.
