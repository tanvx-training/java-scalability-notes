# 3. Java 17

> *The Well-Grounded Java Developer, Second Edition* — Chương 3
> Bản dịch tiếng Việt

**Chương này bao gồm:**

- Text Blocks
- Switch Expressions
- Records
- Sealed Types

---

Đây là những tính năng mới quan trọng đã được thêm vào ngôn ngữ và nền tảng Java kể từ khi Java 11 ra mắt, tính đến và bao gồm cả Java 17.

> **NOTE** Để hiểu những thay đổi trong phương pháp phát hành Java kể từ Java 8, có thể nên xem lại phần thảo luận ở chương 1 hoặc phụ lục A.

Bên cạnh những nâng cấp ngôn ngữ lớn mà người dùng nhìn thấy được, Java 17 còn chứa nhiều cải tiến nội bộ (đặc biệt là nâng cấp hiệu năng). Tuy nhiên, chương này tập trung vào những tính năng chính mà chúng tôi kỳ vọng sẽ thay đổi cách bạn — lập trình viên — viết Java.

## 3.1 Text Blocks

Kể từ phiên bản đầu tiên, Java 1.0, các lập trình viên đã than phiền về string của Java. So với các ngôn ngữ lập trình khác, chẳng hạn Groovy, Scala hay Kotlin, string của Java đôi khi có vẻ hơi thô sơ.

Trong lịch sử, Java chỉ cung cấp một loại string — string đơn giản, đặt trong dấu nháy kép, trong đó một số ký tự nhất định (đáng chú ý là `"` và `\`) phải được escape để dùng an toàn. Điều này, trong một loạt tình huống rộng đến bất ngờ, đã dẫn tới nhu cầu tạo ra những chuỗi escape rối rắm, ngay cả với những tình huống lập trình rất thông thường.

Dự án Text Blocks đã trải qua vài vòng lặp dưới dạng tính năng preview (chúng ta đã thảo luận ngắn gọn về preview feature ở chương 1) và giờ là tính năng chuẩn trong Java 17. Nó nhắm tới việc mở rộng khái niệm string trong cú pháp Java bằng cách cho phép các string literal trải dài trên nhiều dòng. Đến lượt nó, điều đó sẽ tránh được nhu cầu dùng hầu hết các escape sequence mà xưa nay lập trình viên Java thấy là cản trở quá mức.

> **NOTE** Không giống nhiều ngôn ngữ lập trình khác, Java Text Blocks hiện chưa hỗ trợ nội suy (interpolation), mặc dù tính năng này đang được cân nhắc tích cực để đưa vào một phiên bản tương lai.

Bên cạnh việc giúp giải phóng lập trình viên Java khỏi phiền toái phải escape ký tự quá mức, một mục tiêu cụ thể của Text Blocks là cho phép những chuỗi mã dễ đọc mà không phải là Java nhưng cần được nhúng vào chương trình Java. Xét cho cùng, bạn có bao nhiêu lần phải nhúng, chẳng hạn, SQL hay JSON (hoặc thậm chí XML) vào một chương trình Java của mình?

Trước Java 17, quá trình này thực sự có thể rất đau đớn, và thực tế nhiều đội đã phải viện đến một thư viện templating bên ngoài với toàn bộ độ phức tạp bổ sung của nó. Kể từ khi Text Blocks xuất hiện, trong nhiều trường hợp, điều đó không còn cần thiết.

Hãy xem chúng hoạt động ra sao qua ví dụ một truy vấn SQL. Trong chương này, chúng ta sẽ dùng vài ví dụ từ giao dịch tài chính — cụ thể là giao dịch ngoại hối (foreign exchange currency trading — FX). Có lẽ chúng ta có các đơn hàng (order) của khách hàng lưu trong cơ sở dữ liệu SQL mà ta sẽ truy cập bằng một truy vấn như sau:

```java
String query = """
           SELECT "ORDER_ID", "QUANTITY", "CURRENCY_PAIR" FROM "ORDERS"
           WHERE "CLIENT_ID" = ?
           ORDER BY "DATE_TIME", "STATUS" LIMIT 100;
           """;
```

Bạn nên nhận thấy hai điều. Thứ nhất, Text Block được bắt đầu và kết thúc bằng chuỗi `"""`, vốn không hợp lệ trong Java trước phiên bản 15. Thứ hai, Text Block có thể được thụt lề bằng khoảng trắng ở đầu mỗi dòng — và khoảng trắng đó sẽ bị bỏ qua.

Nếu ta in ra biến `query`, ta nhận đúng chuỗi đã dựng, như sau:

```
SELECT "ORDER_ID", "QUANTITY", "CURRENCY_PAIR" FROM "ORDERS"
WHERE "CLIENT_ID" = ?
ORDER BY "DATE_TIME", "STATUS" LIMIT 100;
```

Điều này xảy ra vì Text Block là một biểu thức hằng (kiểu `String`), giống hệt như một string literal. Khác biệt là Text Block được `javac` xử lý trước khi ghi hằng vào class file như sau:

1. Các ký tự kết thúc dòng được chuyển thành LF (`\u000A`), tức là quy ước xuống dòng của Unix.
2. Khoảng trắng thừa bao quanh block bị loại bỏ, để cho phép thụt lề thêm trong mã nguồn Java, như trong ví dụ của chúng ta.
3. Mọi escape sequence trong block được diễn giải.

Các bước này được thực hiện theo thứ tự trên vì một lý do. Cụ thể, việc diễn giải escape sequence sau cùng nghĩa là block có thể chứa các escape sequence dạng literal (chẳng hạn `\n`) mà không bị các bước trước đó sửa đổi hay xóa bỏ.

> **NOTE** Tại runtime, hoàn toàn không có khác biệt nào giữa một hằng string thu được từ một literal so với từ một Text Block. Class file không ghi lại bằng bất kỳ cách nào nguồn gốc ban đầu của hằng.

Để biết thêm chi tiết về Text Blocks, vui lòng xem JEP 378 (https://openjdk.java.net/jeps/378). Hãy chuyển sang làm quen với tính năng Switch Expressions mới.

## 3.2 Switch Expressions

Kể từ những phiên bản sớm nhất, Java đã hỗ trợ câu lệnh `switch`. Java lấy rất nhiều cảm hứng cú pháp từ các dạng có trong C và C++, và câu lệnh `switch` không phải ngoại lệ, như sau:

```java
switch(month) {
  case 1:
    System.out.println("January");
    break;
    case 2:
      System.out.println("February");
      break;
    // ... và cứ thế
}
```

Cụ thể, câu lệnh `switch` của Java thừa hưởng đặc tính là nếu một `case` không kết thúc bằng `break`, việc thực thi sẽ tiếp tục sang `case` kế tiếp. Quy tắc này cho phép nhóm các case cần xử lý giống hệt nhau, như sau:

```java
switch(month) {
  case 12:
  case 1:
  case 2:
    System.out.println("Winter, brrrr");
      break;
    case 3:
    case 4:
    case 5:
       System.out.println("Spring has sprung!");
      break;
    // ... và cứ thế
}
```

Tuy nhiên, sự tiện lợi cho tình huống này lại mang theo một mặt tối và đầy lỗi. Bỏ sót một `break` là sai lầm dễ mắc với cả lập trình viên mới lẫn cũ, và thường tạo ra lỗi. Trong ví dụ của chúng ta, ta sẽ nhận được câu trả lời sai bởi bỏ đi `break` đầu tiên sẽ dẫn tới cả thông điệp mùa đông lẫn mùa xuân.

Câu lệnh `switch` cũng vụng về khi cố nắm bắt một giá trị để dùng sau này. Ví dụ, nếu ta muốn lấy thông điệp đó để dùng ở nơi khác, thay vì in ra, ta phải khai báo một biến bên ngoài `switch`, gán đúng giá trị trong từng nhánh, và có khả năng phải đảm bảo sau `switch` rằng ta thực sự đã gán giá trị; đại loại như sau:

```java
String message = null;
switch(month) {
  case 12:
    case 1:
    case 2:
      message = "Winter, brrrr";
      break;
    case 3:
    case 4:
    case 5:
      message = "Spring has sprung!";
      break;
    // ... và cứ thế
}
```

Cũng giống như một `break` bị bỏ sót, giờ ta phải đảm bảo mọi `case` đều gán đúng biến `message` hoặc chấp nhận rủi ro có một báo cáo lỗi trong tương lai. Chắc chắn chúng ta có thể làm tốt hơn.

Switch Expressions, được giới thiệu trong Java 14 (JEP 361), cung cấp các lựa chọn thay thế để khắc phục những thiếu sót này, đồng thời mở ra những chân trời ngôn ngữ trong tương lai. Mục tiêu này bao gồm việc giúp thu hẹp khoảng cách ngôn ngữ với các ngôn ngữ thiên về hàm hơn (ví dụ, Haskell, Scala hay Kotlin). Phiên bản đầu tiên của Switch Expressions ngắn gọn hơn, như sau:

```java
String message = switch(month) {
  case 12:
    case 1:
    case 2:
      yield "Winter, brrrr";
    case 3:
    case 4:
    case 5:
      yield "Spring has sprung!";
    // ... và cứ thế
}
```

Ở dạng sửa đổi này, chúng ta không còn gán biến trong từng nhánh nữa. Thay vào đó, mỗi `case` dùng từ khóa mới `yield` để trả giá trị mong muốn về nhằm gán cho biến `String`, và biểu thức tổng thể *sinh ra* (yield) một giá trị — từ nhánh case này hay nhánh case khác (và mỗi nhánh case phải kết thúc bằng một `yield`).

Với ví dụ này trong tay, tên của tính năng mới — Switch *Expressions* đối lại Switch *Statement* hiện có — trở nên có ý nghĩa hơn. Trong các ngôn ngữ lập trình, một *statement* (câu lệnh) là đoạn mã được thực thi vì tác dụng phụ của nó. Một *expression* (biểu thức) thì lại chỉ đoạn mã được thực thi để tạo ra một giá trị. `switch` trước Java 14 chỉ là một câu lệnh có tác dụng phụ, nhưng giờ nó có thể tạo ra giá trị khi được dùng như một biểu thức.

Switch Expressions cũng mang tới một cú pháp còn ngắn gọn hơn nữa, và rất có thể sẽ được áp dụng rộng rãi hơn, như sau:

```java
String message = switch(month) {
    case 1, 2, 12 -> "Winter, brrrr";
    case 3, 4, 5   -> "Spring has sprung!";
    case 6, 7, 8   -> "Summer is here!";
    case 9, 10, 11 -> "Fall has descended";
    default        -> {
        throw new IllegalArgumentException("Oops, that's not a month");
    }
}
```

Dấu `->` chỉ ra rằng chúng ta đang ở trong một switch expression, nên những case đó không cần `yield` tường minh. Case `default` của chúng ta cho thấy một khối bao trong `{}` có thể được dùng ở nơi ta không có một giá trị đơn lẻ. Nếu bạn đang dùng giá trị của một switch expression (như chúng ta đang gán nó cho `message`), các case nhiều dòng phải hoặc `yield` hoặc `throw`.

Nhưng định dạng nhãn (label) mới không chỉ hữu ích hơn và ngắn hơn — nó giải quyết những vấn đề thực sự. Thứ nhất, nhiều case được hỗ trợ trực tiếp bằng danh sách phân tách bởi dấu phẩy sau `case`. Điều này giải quyết vấn đề mà trước đây đòi hỏi cơ chế fall-through nguy hiểm của `switch`. Một switch expression theo cú pháp nhãn mới không bao giờ fall through, khép lại hòn đá vấp đó cho mọi người.

Các biện pháp bảo vệ được bổ sung không dừng ở đó. Một cách phổ biến khác để làm hỏng câu lệnh `switch` là bỏ sót một case đáng ra phải xử lý. Nếu ta bỏ dòng `default` khỏi ví dụ trước, ta nhận lỗi biên dịch, như sau:

```
error: the switch expression does not cover all possible input values
    String message = switch(month) {
                     ^
```

Không giống câu lệnh `switch`, Switch Expressions phải xử lý mọi trường hợp khả dĩ cho kiểu đầu vào của bạn, nếu không mã của bạn thậm chí không biên dịch được. Đó là một đảm bảo tuyệt vời giúp bạn phủ hết mọi khả năng. Nó cũng kết hợp rất tốt với enum của Java, như ta thấy nếu viết lại `switch` để dùng các hằng an toàn kiểu thay vì `int`, như sau:

```java
String message = switch(month) {
    case JANUARY, FEBRUARY, DECEMBER -> "Winter, brrrr";
    case MARCH, APRIL, MAY            -> "Spring has sprung!";
    case JUNE, JULY, AUGUST           -> "Summer is here!";
    case SEPTEMBER, OCTOBER, NOVEMBER -> "Fall has descended";
};
```

Khả năng mới này hữu ích như một tính năng độc lập, bởi nó cho phép ta đơn giản hóa một trường hợp dùng `switch` rất phổ biến, hành xử hơi giống một hàm, sinh ra giá trị đầu ra dựa trên giá trị đầu vào. Thực tế, quy tắc cho Switch Expressions là mọi giá trị đầu vào khả dĩ đều phải được đảm bảo tạo ra một giá trị đầu ra.

> **NOTE** Nếu mọi hằng enum khả dĩ đều có mặt trong một switch expression, phép khớp là *toàn phần* (total) và không cần đưa vào case `default` — compiler có thể dùng tính vét cạn của các hằng enum.

Tuy nhiên, với những Switch Expressions nhận, chẳng hạn, một `int`, chúng ta phải đưa vào mệnh đề `default` bởi việc liệt kê khoảng bốn tỷ giá trị khả dĩ là không khả thi.

Switch Expressions cũng là bước đệm hướng tới một tính năng lớn, *Pattern Matching*, ở một phiên bản Java tương lai khả dĩ, thứ mà chúng ta sẽ thảo luận cả ở phần sau của chương này lẫn ở phần sau của cuốn sách. Còn bây giờ, hãy chuyển sang gặp tính năng mới tiếp theo, Records.

## 3.3 Records

Records là một dạng class Java mới được thiết kế để làm những việc sau:

- Cung cấp phương tiện hạng nhất để mô hình hóa các tập hợp chỉ-dữ-liệu (data-only aggregate)
- Khép lại một khoảng trống khả dĩ trong hệ thống kiểu của Java
- Cung cấp cú pháp ở mức ngôn ngữ cho một mẫu lập trình phổ biến
- Giảm boilerplate của class

Thứ tự của các gạch đầu dòng này là quan trọng, và thực tế Records thiên về ngữ nghĩa ngôn ngữ nhiều hơn là về giảm boilerplate và cú pháp (mặc dù khía cạnh thứ hai mới là thứ nhiều lập trình viên có xu hướng tập trung vào). Hãy bắt đầu bằng việc giải thích ý tưởng cơ bản về một Java record.

Ý tưởng của Records là mở rộng ngôn ngữ Java và tạo ra một cách để nói rằng một class là "các field, chỉ các field, và không gì ngoài các field". Bằng cách đưa ra tuyên bố đó về class của mình, compiler có thể giúp chúng ta bằng cách tạo tự động mọi phương thức và để mọi field tham gia vào các phương thức như `hashCode()`.

> **NOTE** Đây là cách mà ngữ nghĩa "một record là vật mang trong suốt của các field" định nghĩa cú pháp: "các accessor method và boilerplate khác được dẫn xuất tự động từ định nghĩa record".

Để thấy nó xuất hiện thế nào trong lập trình hằng ngày, hãy nhớ rằng một trong những than phiền phổ biến nhất về Java là bạn cần viết rất nhiều mã để một class trở nên hữu dụng. Khá thường xuyên chúng ta cần viết:

- `toString()`
- `hashCode()` và `equals()`
- Các phương thức getter
- Constructor công khai

và vân vân.

Với các class domain đơn giản, những phương thức này thường nhàm chán, lặp lại, và là loại thứ có thể dễ dàng sinh ra một cách máy móc (và IDE thường cung cấp khả năng này), nhưng cho tới khi có Records, ngôn ngữ không cung cấp cách nào để làm điều đó trực tiếp. Khoảng trống bực bội này thực ra còn tệ hơn khi chúng ta đọc mã của người khác. Ví dụ, có thể trông như tác giả đang dùng `hashCode()` và `equals()` do IDE sinh ra dùng mọi field của class, nhưng làm sao ta chắc chắn được nếu không kiểm tra từng dòng của bản hiện thực? Điều gì xảy ra nếu một field được thêm vào trong lúc refactor và các phương thức không được sinh lại?

Records giải quyết những vấn đề này. Nếu một kiểu được khai báo là record, nó đang đưa ra một tuyên bố mạnh mẽ, và compiler cùng runtime sẽ đối xử với nó tương ứng. Hãy xem nó hoạt động.

Để giải thích thực sự đầy đủ tính năng này, chúng ta cần một miền ví dụ không tầm thường, nên hãy tiếp tục dùng giao dịch tiền tệ FX. Đừng lo nếu bạn không quen với các khái niệm trong lĩnh vực này — chúng tôi sẽ giải thích những gì bạn cần biết dọc đường. Ở phần sau của cuốn sách, chúng ta sẽ tiếp tục chủ đề ví dụ tài chính, nên đây là chỗ tốt để bắt đầu.

Hãy xem cách chúng ta dùng Records và vài tính năng khác để cải thiện việc mô hình hóa miền và có được mã sạch hơn, ít dài dòng hơn và đơn giản hơn. Xét một order mà chúng ta muốn đặt khi giao dịch FX. Kiểu order cơ bản có thể gồm những thứ sau:

- Số đơn vị tôi đang mua hoặc bán (tính theo triệu đơn vị tiền tệ)
- "Side" — tôi đang mua hay bán (thường gọi là Bid và Ask)
- Các đồng tiền tôi đang trao đổi (cặp tiền tệ — currency pair)
- Thời điểm tôi đặt order
- Order của tôi có hiệu lực bao lâu trước khi hết hạn (time-to-live hay TTL)

Vậy, nếu tôi có £1M và muốn bán lấy đô la Mỹ trong vòng một giây tới, và tôi muốn $1.25 cho mỗi £, thì tôi đang "mua tỷ giá GBP/USD ở mức $1.25 ngay bây giờ, có hiệu lực trong 1s". Trong Java, chúng ta có thể khai báo một class domain như sau (chúng tôi gọi nó là "classic" để nhấn mạnh rằng hiện tại ta phải làm điều này bằng một class — các cách tốt hơn đang tới):

```java
public final class FXOrderClassic {
    private final int units;
    private final CurrencyPair pair;
    private final Side side;
    private final double price;
    private final LocalDateTime sentAt;
    private final int ttl;

    public FXOrderClassic(int units, CurrencyPair pair, Side side,
                          double price, LocalDateTime sentAt, int ttl) {
        this.units = units;
        this.pair = pair; // CurrencyPair là một enum đơn giản
        this.side = side; // Side là một enum đơn giản
        this.price = price;
        this.sentAt = sentAt;
        this.ttl = ttl;
    }

    public int units() {
        return units;
    }

    public CurrencyPair pair() {
        return pair;
    }

    public Side side() {
        return side;
    }

    public double price() {
        return price;
    }

    public LocalDateTime sentAt() {
        return sentAt;
    }

    public int ttl() {
        return ttl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        FXOrderClassic that = (FXOrderClassic) o;

        if (units != that.units) return false;
        if (Double.compare(that.price, price) != 0) return false;
        if (ttl != that.ttl) return false;
        if (pair != that.pair) return false;
        if (side != that.side) return false;
        return sentAt != null ? sentAt.equals(that.sentAt) :
                                that.sentAt == null;
    }

    @Override
    public int hashCode() {
        int result;
        long temp;
        result = units;
        result = 31 * result + (pair != null ? pair.hashCode() : 0);
        result = 31 * result + (side != null ? side.hashCode() : 0);
        temp = Double.doubleToLongBits(price);
        result = 31 * result + (int) (temp ^ (temp >>> 32));
        result = 31 * result + (sentAt != null ? sentAt.hashCode() : 0);
        result = 31 * result + ttl;
        return result;
    }

    @Override
    public String toString() {
        return "FXOrderClassic{" +
                "units=" + units +
                ", pair=" + pair +
                ", side=" + side +
                ", price=" + price +
                ", sentAt=" + sentAt +
                ", ttl=" + ttl +
                '}';
    }
}
```

Đó là rất nhiều mã, nhưng nó có nghĩa order của tôi có thể được tạo như sau:

```java
var order = new FXOrderClassic(1, CurrencyPair.GBPUSD, Side.Bid,
                                1.25, LocalDateTime.now(), 1000);
```

Nhưng bao nhiêu phần trong đoạn mã khai báo class thực sự cần thiết? Ở các phiên bản Java cũ hơn, hầu hết lập trình viên có lẽ chỉ khai báo các field rồi dùng IDE để tự sinh mọi phương thức. Hãy xem Records cải thiện tình hình ra sao.

> **NOTE** Java không cung cấp cách nào để nói về một tập hợp dữ liệu ngoài việc định nghĩa một class, nên rõ ràng mọi kiểu chỉ chứa "các field" sẽ là một class.

Khái niệm mới là *record class* (hoặc thường chỉ gọi là record). Đây là một vật mang trong suốt, bất biến (theo nghĩa Java thông thường là "mọi field đều `final`") cho một tập giá trị cố định, gọi là các *record component*. Mỗi component sinh ra một field `final` giữ giá trị được cung cấp và một accessor method để lấy giá trị. Tên field và tên accessor khớp với tên component.

Danh sách các field cung cấp một *mô tả trạng thái* (state description) cho record. Trong một class thông thường, có thể không có quan hệ nào giữa field `x`, đối số constructor `x`, và accessor `x()`, nhưng trong một record, theo định nghĩa chúng đang nói về cùng một thứ — một record chính là trạng thái của nó.

Để cho phép chúng ta tạo thể hiện mới của record class, một constructor cũng được sinh ra — gọi là *canonical constructor* — có danh sách tham số khớp chính xác với mô tả trạng thái đã khai báo. Ngôn ngữ Java giờ cũng cung cấp cú pháp ngắn gọn để khai báo Records, trong đó tất cả những gì lập trình viên cần làm là khai báo tên và kiểu của các component tạo nên record, như sau:

```java
public record FXOrder(int units,
                      CurrencyPair pair,
                      Side side,
                      double price,
                      LocalDateTime sentAt,
                      int ttl) {}
```

Bằng việc viết khai báo record này, chúng ta không chỉ tiết kiệm chút gõ phím, mà còn đưa ra một tuyên bố ngữ nghĩa mạnh mẽ hơn nhiều. Kiểu `FXOrder` chính là trạng thái được cung cấp, và mọi thể hiện chỉ là một tập hợp trong suốt của các giá trị field.

Nếu giờ ta khảo sát class file bằng `javap` (chúng ta sẽ gặp đầy đủ ở chương 4), ta có thể thấy compiler đã tự sinh cả đống mã boilerplate cho chúng ta:

```
$ javap FXOrder.class
Compiled from "FXOrder.java"
public final class FXOrder extends java.lang.Record {
    public FXOrder(int, CurrencyPair, Side,
                   double, java.time.LocalDateTime, int);

    public java.lang.String toString();
    public final int hashCode();
    public final boolean equals(java.lang.Object);
    public int units();
    public CurrencyPair pair();
    public Side side();
    public double price();
    public java.time.LocalDateTime sentAt();
    public int ttl();
}
```

Trông rất giống tập phương thức mà chúng ta phải viết trong mã của bản hiện thực dựa trên class. Thực tế, constructor và các accessor method đều hành xử y hệt như trước. Tuy nhiên, các phương thức như `toString()` và `equals()` dùng một bản hiện thực có thể gây bất ngờ cho một số lập trình viên, như sau:

```
public java.lang.String toString();
     Code:
        0: aload_0
         1: invokedynamic #51,          0     // InvokeDynamic #0:toString:
                                              // (LFXOrder;)Ljava/lang/String;
         6: areturn
```

Nghĩa là phương thức `toString()` (cùng `equals()` và `hashCode()`) được hiện thực bằng một cơ chế dựa trên `invokedynamic`. Đây là một kỹ thuật mạnh mẽ mà chúng ta sẽ gặp ở phần sau của cuốn sách (trong chương 4 và 16).

Chúng ta cũng thấy có một class mới, `java.lang.Record`, đóng vai trò supertype cho mọi record class. Nó là `abstract` và khai báo `equals()`, `hashCode()` và `toString()` là các phương thức abstract. Class `java.lang.Record` không thể được kế thừa trực tiếp, như ta thấy khi thử biên dịch đoạn mã như sau:

```java
public final class FXOrderClassic extends Record {
    private final int units;
    private final CurrencyPair pair;
    private final Side side;
    private final double price;
    private final LocalDateTime sentAt;
    private final int ttl;

    // ... phần còn lại của class được lược bỏ
}
```

Compiler sẽ từ chối nỗ lực này:

```
$ javac FXOrderClassic.java
FXOrderClassic.java:3: error: records cannot directly extend Record
public final class FXOrderClassic extends Record {
                 ^
1 error
```

Cách duy nhất để có một record là khai báo tường minh một record và để `javac` tạo ra class file. Điều này cũng đảm bảo mọi record class đều được tạo ra là `final`.

Bên cạnh việc tự sinh phương thức và giảm boilerplate, một vài tính năng cốt lõi khác của Java cũng có đặc điểm riêng khi áp dụng cho Records. Thứ nhất, Records phải tuân theo một hợp đồng đặc biệt liên quan tới phương thức `equals()`: nếu một record `R` có các component `c1`, `c2`, ... `cn`, và nếu một thể hiện record được sao chép như sau:

```java
R copy = new R(r.c1(), r.c2(), ..., r.cn());
```

thì phải đúng rằng `r.equals(copy)` là `true`. Lưu ý rằng bất biến này là *bổ sung* cho hợp đồng quen thuộc thông thường về `equals()` và `hashCode()` — nó không thay thế hợp đồng đó.

Đến đây, hãy chuyển sang nói về một số khía cạnh thiên về thiết kế hơn của tính năng Records. Để làm vậy, sẽ hữu ích nếu nhớ lại cách enum hoạt động trong Java. Một enum trong Java là một dạng class đặc biệt hiện thực một mẫu thiết kế (hữu hạn các thể hiện an toàn kiểu) nhưng với chi phí cú pháp tối thiểu — compiler sinh ra cả đống mã cho chúng ta.

Tương tự, một record trong Java là một dạng class đặc biệt hiện thực một mẫu (Data Carrier hay Just Holds Fields) với cú pháp tối thiểu. Toàn bộ mã boilerplate mà ta kỳ vọng sẽ được compiler tự sinh cho chúng ta. Tuy nhiên, mặc dù khái niệm đơn giản về một class Data Carrier chỉ giữ các field nghe rất trực quan, nó thực sự có nghĩa gì một cách chi tiết?

Khi Records lần đầu được thảo luận, rất nhiều thiết kế khả dĩ khác nhau đã được cân nhắc. Ví dụ:

- Giảm boilerplate của POJO
- Java Beans 2.0
- Named tuple (bộ có tên)
- Product type (một dạng của kiểu dữ liệu đại số)

Những khả năng này đã được Brian Goetz thảo luận khá chi tiết trong bản phác thảo thiết kế gốc của ông (http://mng.bz/M5j8). Mỗi lựa chọn thiết kế đi kèm những câu hỏi thứ cấp bổ sung phát sinh từ việc chọn trung tâm thiết kế cho Records, những câu hỏi như:

- Hibernate có thể proxy chúng không?
- Chúng có tương thích hoàn toàn với Java Beans cổ điển không?
- Chúng có hỗ trợ xóa tên / "khả biến hình dạng" (shape malleability) không?
- Chúng có đi kèm Pattern Matching và destructuring không?

Việc dựa tính năng Records trên bất kỳ cách nào trong bốn cách trên đều có thể chấp nhận được — mỗi cách có ưu và nhược điểm. Tuy nhiên, quyết định thiết kế cuối cùng là Records là *named tuple*. Điều này một phần được thúc đẩy bởi một ý tưởng thiết kế then chốt trong hệ thống kiểu của Java — *nominal typing* (định kiểu theo tên). Hãy xem kỹ hơn ý tưởng then chốt này.

### 3.3.1 Nominal typing

Cách tiếp cận nominal đối với định kiểu tĩnh là ý tưởng rằng mọi vùng lưu trữ trong Java (biến, field) đều có một kiểu xác định và mỗi kiểu có một cái tên, mà tên đó nên (ít nhất phần nào) có ý nghĩa với con người.

Ngay cả trong trường hợp anonymous class, các kiểu vẫn có tên — chỉ là compiler gán tên và chúng không phải là tên hợp lệ cho kiểu trong ngôn ngữ Java (nhưng vẫn ổn trong JVM). Ví dụ, ta có thể thấy điều này trong `jshell`:

```
jshell> var o = new Object() {
       ...>   public void bar() { System.out.println("bar!"); }
   ...> }
o ==> $0@37f8bb67

jshell> var o2 = new Object() {
       ...>   public void bar() { System.out.println("bar!"); }
       ...> }
o2 ==> $1@31cefde0

jshell> o = o2;
|    Error:
|    incompatible types: $1 cannot be converted to $0
|    o = o2;
|        ^^
```

Lưu ý rằng dù các anonymous class được khai báo theo cách hoàn toàn giống nhau, compiler vẫn tạo ra hai anonymous class khác nhau, `$0` và `$1`, và không cho phép phép gán, bởi trong hệ thống kiểu của Java, các biến có kiểu khác nhau.

> **NOTE** Có những ngôn ngữ khác (không phải Java) nơi hình dạng tổng thể của class (ví dụ, nó có những field và phương thức nào) có thể được dùng làm kiểu (thay vì một tên kiểu tường minh). Điều này gọi là *structural typing*.

Sẽ là một thay đổi lớn nếu Records phá vỡ di sản của Java và đưa structural typing vào cho Records. Kết quả là lựa chọn thiết kế "Records là nominal tuple" có nghĩa chúng ta kỳ vọng Records sẽ hoạt động tốt nhất ở những nơi mà ta có thể dùng tuple trong các ngôn ngữ khác. Điều này bao gồm các trường hợp sử dụng như khóa map phức hợp, hoặc để mô phỏng việc trả về nhiều giá trị từ một phương thức. Một ví dụ khóa map phức hợp có thể trông như sau:

```java
record OrderPartition(CurrencyPair pair, Side side) {}
```

Ngược lại, Records không nhất thiết hoạt động tốt như một sự thay thế cho mã hiện có đang dùng Java Beans. Có một số lý do, đáng chú ý là Java Beans khả biến còn Records thì không, và chúng có quy ước khác nhau cho accessor. Records đặt tên accessor method giống tên field (khả thi vì tên field và tên phương thức nằm ở namespace riêng biệt trong Java), trong khi Beans thêm tiền tố `get` và `set`.

Records có cho phép một số linh hoạt bổ sung vượt ra ngoài dạng khai báo đơn giản một dòng, bởi chúng là những class thực thụ. Cụ thể, lập trình viên có thể định nghĩa thêm phương thức, constructor và static field ngoài những thứ mặc định được tự sinh. Tuy nhiên, những khả năng này nên được dùng cẩn thận. Hãy nhớ rằng ý đồ thiết kế của Records là cho phép lập trình viên nhóm các field liên quan thành một mục dữ liệu bất biến duy nhất.

Một ví dụ về phương thức bổ sung mà một record có thể tạo ra là một static factory method để mô phỏng giá trị mặc định cho một số tham số của record. Một ví dụ khác có thể là một class `Person` (với ngày sinh bất biến) có thể định nghĩa phương thức `currentAge()`.

Một quy tắc kinh nghiệm tốt là: càng cảm thấy bị cám dỗ thêm nhiều phương thức bổ sung v.v. vào Data Carrier cơ bản (hoặc bắt nó hiện thực nhiều interface), thì càng có khả năng bạn nên dùng một class đầy đủ thay vì một record.

### 3.3.2 Compact record constructor

Một ngoại lệ quan trọng khả dĩ đối với quy tắc kinh nghiệm đơn giản/"class đầy đủ" là việc dùng *compact constructor*, được mô tả như sau trong đặc tả ngôn ngữ:

> *Các tham số hình thức của một compact constructor của một record class được khai báo ngầm định. Chúng được cho bởi danh sách tham số hình thức dẫn xuất của record class.*
>
> *Ý đồ của khai báo compact constructor là chỉ mã kiểm tra hợp lệ (validation) và/hoặc chuẩn hóa (normalization) mới cần được đưa vào thân của canonical constructor; phần mã khởi tạo còn lại do compiler cung cấp.*
>
> — Java Language Specification

Ví dụ, chúng ta có thể muốn kiểm tra hợp lệ các order để chắc chắn chúng không cố mua hoặc bán số lượng âm hay đặt time-to-live không hợp lệ, như sau:

```java
public record FXOrder(int units, CurrencyPair pair, Side side,
                      double price, LocalDateTime sentAt, int ttl) {
     public FXOrder {
         if (units < 1) {
                 throw new IllegalArgumentException(
                           "FXOrder units must be positive");
             }
             if (ttl < 0) {
                 throw new IllegalArgumentException(
                           "FXOrder TTL must be positive, or 0 for market order");
             }
             if (price <= 0.0) {
                 throw new IllegalArgumentException(
                           "FXOrder price must be positive");
             }
     }
}
```

Một lợi thế mà Java Records có so với các tuple ẩn danh trong các ngôn ngữ khác là thân constructor của một record cho phép chạy mã khi Records được tạo. Điều này cho phép việc kiểm tra hợp lệ diễn ra (và exception được ném ra nếu một trạng thái không hợp lệ được truyền vào). Điều này sẽ không khả thi trong các tuple thuần cấu trúc.

Cũng có thể hợp lý khi dùng static factory method bên trong thân record, ví dụ, để lách việc Java thiếu giá trị tham số mặc định. Trong ví dụ giao dịch của chúng ta, ta có thể đưa vào một static factory như sau:

```java
public static FXOrder of(CurrencyPair pair, Side side, double price) {
         var now = LocalDateTime.now();
         return new FXOrder(1, pair, side, price, now, 1000);
}
```

để khai báo một cách nhanh chóng tạo order với các tham số mặc định. Dĩ nhiên điều này cũng có thể được khai báo dưới dạng một constructor thay thế. Lập trình viên nên chọn cách tiếp cận nào hợp lý với mình trong từng hoàn cảnh.

Một công dụng khác của constructor thay thế là tạo Records để dùng làm khóa map phức hợp, như trong ví dụ này:

```java
record OrderPartition(CurrencyPair pair, Side side) {
         public OrderPartition(FXOrder order) {
             this(order.pair(), order.side());
         }
}
```

Kiểu `OrderPartition` khi đó có thể dễ dàng được dùng làm khóa map. Chẳng hạn, chúng ta có thể muốn dựng một sổ lệnh (order book) để dùng trong công cụ khớp lệnh, như sau:

```java
public final class MatchingEngine {
    private final Map<OrderPartition, RankedOrderBook> orderBooks =
                                                        new TreeMap<>();

         public void addOrder(final FXOrder o) {
             orderBooks.get(new OrderPartition(o)).addAndRank(o);
             checkForCrosses(o.pair());
         }

         public void checkForCrosses(final CurrencyPair pair) {
             // Có lệnh mua nào khớp với lệnh bán bây giờ không?
         }

         // ...
}
```

Giờ đây, khi một order mới được nhận, phương thức `addOrder()` trích xuất order partition phù hợp (gồm một tuple của cặp tiền tệ và side mua/bán) và dùng nó để thêm order mới vào sổ lệnh được xếp hạng theo giá phù hợp. Order mới có thể khớp với các order hiện có đã nằm trên sổ (được gọi là "crossing" của order), nên chúng ta cần kiểm tra xem có khớp không trong phương thức `checkForCrosses()`.

Đôi khi chúng ta có thể muốn không dùng compact constructor mà thay vào đó có một canonical constructor đầy đủ, tường minh. Điều này báo hiệu rằng chúng ta cần làm việc thực sự trong constructor — và số trường hợp sử dụng cho điều này với các class Data Carrier đơn giản là ít. Tuy nhiên, với một số tình huống, như nhu cầu tạo bản sao phòng vệ (defensive copy) của các tham số đầu vào, điều này là cần thiết. Kết quả là khả năng có một canonical constructor tường minh được compiler cho phép — nhưng hãy suy nghĩ rất kỹ trước khi dùng cách tiếp cận này.

Records được dự định là các Data Carrier đơn giản, một phiên bản của tuple khớp vào hệ thống kiểu đã được thiết lập của Java một cách logic và nhất quán. Điều này sẽ giúp nhiều ứng dụng làm các class domain rõ ràng và nhỏ gọn hơn. Nó cũng sẽ giúp các đội loại bỏ nhiều bản hiện thực viết tay của mẫu nền tảng đó. Nó cũng sẽ giảm hoặc loại bỏ nhu cầu dùng các thư viện như Lombok.

Nhiều lập trình viên đã báo cáo những cải thiện đáng kể khi bắt đầu dùng Records. Chúng cũng kết hợp cực kỳ tốt với một tính năng mới khác cũng đến trong Java 17 — Sealed Types.

## 3.4 Sealed Types

Enum của Java là một tính năng ngôn ngữ nổi tiếng. Chúng cho phép lập trình viên mô hình hóa một tập hữu hạn các lựa chọn đại diện cho mọi giá trị khả dĩ của một kiểu — về cơ bản là các hằng an toàn kiểu.

Tiếp tục ví dụ FX, hãy xét một enum `OrderType` để biểu thị các loại order khác nhau:

```java
enum OrderType {
     MARKET,
     LIMIT
}
```

Nó biểu diễn hai loại FX order khả dĩ: *market order* sẽ lấy bất kỳ mức giá tốt nhất hiện tại nào, và *limit order* chỉ thực thi khi một mức giá cụ thể khả dụng. Nền tảng hiện thực enum bằng cách để trình biên dịch Java tự động sinh ra một dạng class type đặc biệt.

> **NOTE** Runtime thực ra đối xử với kiểu thư viện `java.lang.Enum` (mà mọi enum class trực tiếp kế thừa) theo cách hơi đặc biệt so với các class khác, nhưng chi tiết về điều này không cần bận tâm ở đây.

Hãy decompile enum này và xem compiler sinh ra gì, như sau:

```
$ javap -c -p OrderType.class
final class OrderType extends java.lang.Enum<OrderType> {
  public static final OrderType MARKET;

    public static final OrderType LIMIT;

    ...
    // Constructor private
}
```

Bên trong class file, mọi giá trị khả dĩ của enum được định nghĩa là các biến `public static final`, và constructor là `private`, nên không thể tạo thêm thể hiện.

Trên thực tế, một enum giống như một sự tổng quát hóa của mẫu Singleton, ngoại trừ việc thay vì chỉ có một thể hiện của class, có một số hữu hạn thể hiện. Mẫu này cực kỳ hữu ích, đặc biệt bởi nó cho chúng ta khái niệm *tính vét cạn* (exhaustiveness) — cho một đối tượng `OrderType` khác null, ta có thể chắc chắn rằng nó là thể hiện `MARKET` hoặc `LIMIT`.

Tuy nhiên, giả sử chúng ta muốn mô hình hóa nhiều loại order khác nhau trong Java 11. Chúng ta phải chọn giữa hai lựa chọn khó nuốt. Thứ nhất, chúng ta có thể chọn có một class (hoặc record) hiện thực duy nhất, `FXOrder`, với một field trạng thái giữ kiểu thực tế. Mẫu này hoạt động bởi field trạng thái có kiểu enum và cung cấp các bit chỉ ra kiểu nào thực sự được ngụ ý cho đối tượng cụ thể này. Điều này rõ ràng là dưới tối ưu, bởi nó buộc lập trình viên ứng dụng phải theo dõi những bit vốn thực sự là mối quan tâm đúng đắn của hệ thống kiểu. Cách thay thế, chúng ta có thể khai báo một abstract base class, `BaseOrder`, và có các kiểu cụ thể `MarketOrder` và `LimitOrder` kế thừa nó.

Vấn đề ở đây là Java xưa nay luôn được thiết kế như một ngôn ngữ mở, mặc định có thể mở rộng. Các class được biên dịch ở một thời điểm, và các subclass có thể được biên dịch nhiều năm (hoặc thậm chí nhiều thập kỷ) sau đó. Tính đến Java 11, các cấu trúc kế thừa class duy nhất được cho phép trong ngôn ngữ Java là kế thừa mở (mặc định) và không kế thừa (`final`).

Class có thể khai báo một constructor package-private, về cơ bản có nghĩa "chỉ có thể được mở rộng bởi những kẻ cùng package", nhưng không gì trong runtime ngăn người dùng tạo class mới trong các package không thuộc nền tảng, nên đây tốt nhất cũng chỉ là sự bảo vệ không hoàn chỉnh.

Nếu chúng ta định nghĩa một class `BaseOrder`, thì không gì ngăn bên thứ ba tạo một class `EvilOrder` kế thừa từ `BaseOrder`. Tệ hơn nữa, việc mở rộng không mong muốn này có thể xảy ra nhiều năm (hoặc nhiều thập kỷ) sau khi kiểu `BaseOrder` được biên dịch, điều cực kỳ không mong muốn.

Kết luận là cho tới nay, lập trình viên bị ràng buộc và phải dùng một field để giữ kiểu thực tế của `BaseOrder` nếu họ muốn chống lỗi thời. Java 17 đã thay đổi tình trạng này, bằng cách cho phép một cách mới để kiểm soát kế thừa theo cách chi tiết hơn: *sealed type*.

> **NOTE** Khả năng này hiện diện ở nhiều ngôn ngữ lập trình khác dưới các dạng khác nhau và đã trở nên khá thời thượng trong những năm gần đây, mặc dù thực ra nó là một ý tưởng khá cũ.

Trong hóa thân Java của nó, khái niệm mà việc "niêm phong" (sealing) diễn đạt là ý tưởng rằng một kiểu có thể được mở rộng, nhưng chỉ bởi một danh sách subtype đã biết và không bởi ai khác. Hãy xem cú pháp mới qua một ví dụ đơn giản về class `Pet` (chúng ta sẽ quay lại ví dụ FX trong chốc lát):

```java
public abstract sealed class Pet {
     private final String name;

     protected Pet(String name) {
         this.name = name;
     }

     public String name() {
           return name;
     }

     public static final class Cat extends Pet {
           public Cat(String name) {
               super(name);
           }

           void meow() {
                System.out.println(name() +" meows");
           }
     }

     public static final class Dog extends Pet {
         public Dog(String name) {
                super(name);
           }
          void bark() {
              System.out.println(name() +" barks");
          }
     }
}
```

Class `Pet` được khai báo là `sealed`, vốn không phải từ khóa được cho phép trong Java cho tới nay. Không kèm bổ ngữ, `sealed` có nghĩa class chỉ có thể được mở rộng bên trong đơn vị biên dịch hiện tại. Do đó, các subclass phải được lồng bên trong class hiện tại. Chúng ta cũng khai báo `Pet` là `abstract` bởi ta không muốn có thể hiện `Pet` chung chung nào, chỉ muốn các đối tượng `Pet.Cat` và `Pet.Dog`. Điều này cung cấp cho ta một cách hay để hiện thực mẫu mô hình hóa hướng đối tượng (OO) đã mô tả trước đó, mà không có những nhược điểm đã bàn.

Sealing cũng có thể dùng với interface, và hoàn toàn có khả năng dạng interface sẽ được dùng rộng rãi hơn dạng class trong thực tế. Hãy xem điều gì xảy ra khi ta muốn dùng sealing để giúp mô hình hóa các loại FX order khác nhau:

```java
public sealed interface FXOrder permits MarketOrder, LimitOrder {
     int units();
     CurrencyPair pair();
     Side side();
     LocalDateTime sentAt();
}

public record MarketOrder(int units,
                          CurrencyPair pair,
                          Side side,
                          LocalDateTime sentAt,
                          boolean allOrNothing) implements FXOrder {

     // constructor và factory được lược bỏ
}

public record LimitOrder(int units,
                         CurrencyPair pair,
                         Side side,
                         LocalDateTime sentAt,
                         double price,
                         int ttl) implements FXOrder {

     // constructor và factory được lược bỏ
}
```

Có vài điều đáng chú ý ở đây. Thứ nhất, `FXOrder` giờ là một `sealed interface`. Thứ hai, chúng ta thấy việc dùng từ khóa mới thứ hai, `permits`, cho phép lập trình viên liệt kê các bản hiện thực được phép của sealed interface này — và các bản hiện thực của chúng ta là Records.

> **NOTE** Khi bạn dùng `permits`, các class hiện thực không cần nằm trong cùng một tệp và có thể là các đơn vị biên dịch riêng biệt.

Cuối cùng, chúng ta có phần thưởng hay ho — bởi `MarketOrder` và `LimitOrder` là những class thực thụ, chúng có thể có hành vi đặc thù cho kiểu của mình. Ví dụ, một market order chỉ lấy mức giá tốt nhất có sẵn ngay lập tức và không cần chỉ định giá. Mặt khác, một limit order cần chỉ định mức giá mà order sẽ chấp nhận và nó sẵn sàng chờ bao lâu để cố đạt được mức đó (time-to-live hay TTL). Điều này sẽ không đơn giản nếu chúng ta dùng một field để chỉ ra "kiểu thực" của đối tượng, bởi mọi phương thức cho mọi subtype sẽ phải hiện diện trên base type hoặc buộc chúng ta phải dùng những phép downcast xấu xí.

Nếu giờ chúng ta lập trình với những kiểu này, ta biết rằng bất kỳ thể hiện `FXOrder` nào ta gặp phải là `MarketOrder` hoặc `LimitOrder`. Hơn nữa, compiler cũng có thể dùng thông tin này. Mã thư viện giờ có thể giả định an toàn rằng đây là những khả năng duy nhất, và giả định này không thể bị mã client vi phạm.

Mô hình OO của Java biểu diễn hai khái niệm nền tảng nhất về quan hệ giữa các kiểu. Cụ thể, "Kiểu `X IS-A Y`" và "Kiểu `X HAS-A Y`". Sealed Types biểu diễn một khái niệm hướng đối tượng mà trước đây không thể mô hình hóa trong Java: "Kiểu `X IS-EITHER-A Y OR Z`". Cách khác, chúng cũng có thể được nghĩ tới như:

- Một trạm dừng giữa đường giữa class `final` và class mở
- Mẫu enum áp dụng cho *kiểu* thay vì cho *thể hiện*

Về mặt lý thuyết lập trình OO, chúng biểu diễn một loại quan hệ hình thức mới, bởi tập các kiểu khả dĩ cho `o` là hợp của `Y` và `Z`. Theo đó, điều này được gọi là *union type* hoặc *sum type* trong nhiều ngôn ngữ, nhưng đừng nhầm lẫn — chúng khác với `union` của C.

Ví dụ, lập trình viên Scala có thể hiện thực ý tưởng tương tự bằng case class và phiên bản từ khóa `sealed` của riêng họ (và chúng ta sẽ gặp cách Kotlin tiếp cận ý tưởng này ở phần sau).

Ngoài JVM, ngôn ngữ Rust cũng cung cấp khái niệm về union type rời rạc, mặc dù nó gọi chúng bằng từ khóa `enum`, điều có thể cực kỳ gây nhầm lẫn cho lập trình viên Java. Trong thế giới lập trình hàm, một số ngôn ngữ (ví dụ, Haskell) cung cấp tính năng gọi là *algebraic data type* (kiểu dữ liệu đại số) chứa sum type như một trường hợp đặc biệt. Thực tế, sự kết hợp của Sealed Types và Records cũng mang lại cho Java 17 một phiên bản của tính năng này.

Nhìn bề ngoài, những kiểu này có vẻ là khái niệm hoàn toàn mới trong Java, nhưng sự tương đồng sâu sắc của chúng với enum sẽ là điểm khởi đầu tốt cho nhiều lập trình viên Java. Thực tế, một thứ tương tự các kiểu này đã tồn tại ở một nơi: kiểu của tham số exception trong mệnh đề multicatch.

Từ Java Language Specification (JLS 11, mục 14.20):

```
Kiểu khai báo của một exception parameter biểu thị kiểu của nó như một
lựa chọn D1 | D2 | ... | Dn là lub(D1, D2, ..., Dn).
```

Tuy nhiên, trong trường hợp multicatch, union type thực sự không thể viết ra như kiểu của một biến cục bộ — nó là *nondenotable*. Chúng ta không thể tạo một biến cục bộ có kiểu là union type thực sự trong trường hợp multicatch.

Chúng ta nên nêu một điểm cuối về Sealed Types của Java: chúng phải có một base class mà mọi kiểu được phép đều kế thừa (hoặc một interface chung mà mọi kiểu được phép phải hiện thực). Không thể diễn đạt một kiểu kiểu "IS-A-String-OR-Integer", bởi các kiểu `String` và `Integer` không có quan hệ kế thừa chung nào ngoài `Object`.

> **NOTE** Một số ngôn ngữ khác có cho phép xây dựng union type tổng quát, nhưng điều đó không khả thi trong Java.

Hãy chuyển sang thảo luận một tính năng ngôn ngữ mới khác được giao trong Java 17 — một dạng mới của từ khóa `instanceof`.

## 3.5 Dạng mới của `instanceof`

Mặc dù là một phần của ngôn ngữ từ Java 1.0, toán tử `instanceof` đôi khi nhận không ít tiếng xấu từ một số lập trình viên Java. Ở dạng đơn giản nhất, nó cung cấp một phép kiểm tra đơn giản: `x instanceof Y` trả về `true` nếu giá trị `x` có thể được gán cho một biến kiểu `Y`, và `false` nếu ngược lại (với lưu ý rằng `null instanceof Y` là `false` với mọi `Y`).

Định nghĩa này bị chê bai là làm suy yếu thiết kế hướng đối tượng, bởi nó hàm ý sự thiếu chính xác trong kiểu của đối tượng và có thể trong việc chọn kiểu tham số. Tuy nhiên, trên thực tế, trong một số kịch bản lập trình viên phải đối mặt với một đối tượng có kiểu không được biết đầy đủ tại thời điểm biên dịch. Ví dụ, xét một đối tượng thu được qua reflection mà ta biết rất ít hoặc không biết gì.

Trong hoàn cảnh này, việc thích hợp cần làm là dùng `instanceof` để kiểm tra kiểu có đúng như mong đợi không rồi thực hiện downcast. Phép kiểm tra `instanceof` cung cấp điều kiện canh (guard condition) đảm bảo rằng phép ép kiểu sẽ không gây `ClassCastException` tại runtime. Mã kết quả trông như ví dụ này:

```java
Object o = // ...
if (o instanceof String) {
     String s = (String)o;
     System.out.println(s.length());
} else {
     System.out.println("Not a String");
}
```

Từ góc nhìn của lập trình viên, khả năng `instanceof` mới có trong Java 17 rất đơn giản — nó chỉ cung cấp một cách để tránh phép ép kiểu, như sau:

```java
if (o instanceof String s) {
     System.out.println(s.length());                                       ❶
} else {
     System.out.println("Not a String");                                   ❷
}

// ... Thêm mã                                                             ❸
```

❶ `s` nằm trong phạm vi ở nhánh này.

❷ `s` không nằm trong phạm vi ở nhánh "else".

❸ `s` không còn trong phạm vi sau khi câu lệnh `if` kết thúc.

Tuy nhiên, mặc dù điều này có vẻ không quá quan trọng, chúng ta có một manh mối quan trọng từ cách JEP cho tính năng này được đặt tên. JEP 394 có tiêu đề "Pattern Matching for instanceof", và nó giới thiệu một khái niệm mới — *pattern* (mẫu).

> **NOTE** Rất quan trọng phải hiểu rằng đây là cách dùng pattern matching khác với cái dùng trong xử lý văn bản và biểu thức chính quy.

Trong ngữ cảnh này, một pattern là sự kết hợp của hai thứ sau:

1. Một vị từ (predicate, hay phép kiểm tra) sẽ được áp dụng lên một giá trị
2. Một tập các biến cục bộ, gọi là *pattern variable*, sẽ được trích xuất từ giá trị đó

Điểm mấu chốt là các pattern variable chỉ được trích xuất nếu vị từ được áp dụng thành công lên giá trị.

Trong Java 17, toán tử `instanceof` đã được mở rộng để nhận hoặc một kiểu hoặc một *type pattern*, trong đó type pattern gồm một vị từ chỉ định một kiểu, cùng với một pattern variable duy nhất.

> **NOTE** Chúng ta sẽ gặp type pattern chi tiết hơn ở mục tiếp theo.

Ở trạng thái hiện tại, `instanceof` được nâng cấp có vẻ không quá quan trọng, nhưng đây là lần đầu tiên pattern xuất hiện trong ngôn ngữ Java, và như chúng ta sẽ thấy, nhiều cách dùng nữa đang tới! Đây mới chỉ là bước đầu.

Sau khi hoàn tất chuyến tham quan các tính năng ngôn ngữ mới của Java 17, đã đến lúc nhìn về tương lai và quay lại chủ đề preview feature.

## 3.6 Pattern Matching và các tính năng preview

Ở chương 1, chúng tôi đã giới thiệu khái niệm preview feature, nhưng không thể đưa ra ví dụ tốt về nó, bởi Java 11 không có preview feature nào! Giờ khi đang nói về Java 17, chúng ta có thể tiếp tục thảo luận.

Thực tế, mọi tính năng ngôn ngữ mới mà chúng ta đã gặp trong chương này, bao gồm Switch Expressions, Records và Sealed Types, đều trải qua cùng một vòng đời. Chúng khởi đầu là preview feature và trải qua một hoặc nhiều vòng preview công khai trước khi được giao như tính năng chính thức. Ví dụ, sealed class được preview trong Java 15, rồi lại ở 16, trước khi được giao như tính năng chính thức trong Java 17 LTS.

Trong mục này, chúng ta sẽ gặp một preview feature mở rộng Pattern Matching từ `instanceof` sang `switch`. Java 17 bao gồm một phiên bản của tính năng này, nhưng chỉ ở dạng preview đầu tiên (xem chương 1 để biết thêm chi tiết về preview feature). Cú pháp có thể thay đổi trước bản phát hành chính thức (và tính năng thậm chí có thể bị rút lại, mặc dù điều này rất khó xảy ra với Pattern Matching).

Hãy xem Pattern Matching có thể dùng thế nào trong một trường hợp đơn giản để cải thiện đoạn mã phải xử lý các đối tượng chưa biết kiểu. Chúng ta có thể dùng dạng mới của `instanceof` để viết mã an toàn như sau:

```java
Object o = // ...

if (o instanceof String s) {
    System.out.println("String of length:"+ s.length());
} else if (o instanceof Integer i) {
    System.out.println("Integer:"+ i);
} else {
     System.out.println("Not a String or Integer");
}
```

Tuy nhiên, cách này nhanh chóng trở nên cồng kềnh và dài dòng. Thay vào đó, chúng ta có thể đưa type pattern vào một switch expression, bên cạnh các biểu thức Boolean `instanceof` đơn giản mà ta đã có. Theo cú pháp của preview feature hiện tại (Java 17), ta có thể viết lại đoạn mã trước thành dạng đơn giản:

```java
var msg = switch (o) {
     case String s      -> "String of length:"+ s.length();
     case Integer i     -> "Integer:"+ i;
     case null, default -> "Not a String or Integer";                   ❶
};
System.out.println(msg);
```

❶ `null` giờ được cho phép làm case label để ngăn khả năng xảy ra `NullPointerException`.

Với những lập trình viên muốn thử nghiệm mã như thế này, chúng tôi nên giải thích cách build và chạy với preview feature. Nếu ta thử biên dịch mã như ví dụ trên vốn dùng preview feature, ta nhận lỗi, như sau:

```
$ javac ch3/Java17Examples.java
ch3/Java17Examples.java:68: error: patterns in switch statements are a
    preview feature and are disabled by default.

                case String s -> "String of length:"+ s.length();
                     ^
    (use --enable-preview to enable patterns in switch statements)
1 error
```

Compiler gợi ý hữu ích rằng chúng ta có thể cần bật preview feature, nên ta thử lại với flag được bật:

```
$ javac --enable-preview -source 17 ch3/Java17Examples.java
Note: ch3/Java17Examples.java uses preview features of Java SE 17.
Note: Recompile with -Xlint:preview for details.
```

Câu chuyện cũng tương tự ở runtime:

```
$ java ch3.Java17Examples
Error: LinkageError occurred while loading main class ch3.Java17Examples
     java.lang.UnsupportedClassVersionError: Preview features are not enabled
    for ch16/Java17Examples (class file version 61.65535). Try running with
    '--enable-preview'
```

Cuối cùng, nếu ta đưa vào flag preview, mã sẽ chạy được:

```
$ java --enable-preview ch13.Java17Examples
```

Việc phải liên tục bật preview feature là điều phiền toái, nhưng nó được thiết kế để bảo vệ lập trình viên khỏi việc bất kỳ mã nào dùng các tính năng chưa hoàn thiện lọt ra production và gây rắc rối ở đó. Tương tự, cần lưu ý thông báo về class file version xuất hiện khi ta thử chạy một class chứa preview feature mà không có flag runtime. Nếu chúng ta đã biên dịch tường minh với preview feature, ta không nhận được class file tiêu chuẩn, và hầu hết các đội không nên chạy mã đó trong production.

Phiên bản preview của Pattern Matching trong Java 17 cũng có chức năng tích hợp chặt chẽ với Sealed Types. Cụ thể, các pattern có thể tận dụng việc Sealed Types cung cấp tính độc quyền của các kiểu khả dĩ có thể gặp. Ví dụ, khi xử lý các phản hồi FX order, chúng ta có thể có base type sau:

```java
public sealed interface FXOrderResponse
         permits FXAccepted, FXFill, FXReject, FXCancelled {
     LocalDateTime timestamp();
     long orderId();
}
```

Chúng ta có thể kết hợp nó với một switch expression và type pattern, để có mã như sau:

```java
FXOrderResponse resp = // ... phản hồi từ thị trường
var msg = switch (resp) {
     case FXAccepted a  -> a.orderId() + " Accepted";
     case FXFill f      -> f.orderId() + " Filled "+ f.units();
     case FXReject r    -> r.orderId() + " Rejected: "+ r.reason();
     case FXCancelled c -> c.orderId() + " Cancelled";
     case null          -> "Order is null";
};
System.out.println(msg);
```

Lưu ý rằng a) chúng ta đưa vào tường minh một `case null` để đảm bảo mã này an toàn với null (và sẽ không ném `NullPointerException`), và b) chúng ta không cần `default`. Điểm thứ hai là bởi compiler có thể khảo sát mọi subtype được phép của `FXOrderResponse` và kết luận rằng phép khớp pattern là toàn phần, nó phủ mọi khả năng có thể xảy ra và do đó một case `default` sẽ là mã chết trong mọi hoàn cảnh. Trong trường hợp phép khớp không toàn phần, và một số case không được phủ, thì `default` sẽ là cần thiết.

Bản preview đầu tiên cũng bao gồm *guarded pattern*, cho phép một pattern được trang trí bằng một điều kiện canh Boolean, sao cho pattern tổng thể chỉ khớp nếu cả vị từ của pattern lẫn guard đều đúng. Ví dụ, giả sử chúng ta chỉ muốn xem chi tiết của các order lớn đã khớp. Chúng ta có thể đổi case `fill` trong ví dụ trước thành mã như sau:

```java
case FXFill f && f.units() < 100 -> f.orderId() + " Small Fill";
case FXFill f                    -> f.orderId() + " Fill "+ f.units();
```

Lưu ý rằng case cụ thể hơn (các order nhỏ dưới 100 đơn vị) được kiểm tra trước, và chỉ khi nó thất bại thì phép khớp mới thử case tiếp theo, là phép khớp không có guard cho các fill. Pattern variable cũng đã nằm trong phạm vi cho mọi điều kiện guard. Chúng ta sẽ quay lại Pattern Matching ở chương 18 khi thảo luận về tương lai của Java và nói về một số tính năng chưa kịp vào Java 17.

## Tóm tắt

- Java 17 giới thiệu một số tính năng mới mà lập trình viên có thể tận dụng ngay trong mã của mình:
  - **Text Blocks** cho các string nhiều dòng.
  - **Switch Expressions** cho trải nghiệm `switch` hiện đại hơn.
  - **Records** như những vật mang dữ liệu trong suốt.
  - **Sealed Types** — một khái niệm mô hình hóa OO mới quan trọng.
  - **Pattern Matching** — mặc dù chưa được giao đầy đủ tính đến Java 17, nó cho thấy rõ hướng đi của ngôn ngữ trong những phiên bản sắp tới.
