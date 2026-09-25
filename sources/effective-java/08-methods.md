# Chương 8. Phương thức

Chương này bàn về một số khía cạnh của việc thiết kế phương thức: cách xử lý tham số và giá trị trả về, cách thiết kế chữ ký phương thức (method signature), và cách viết tài liệu cho phương thức. Phần lớn nội dung trong chương này áp dụng cho cả constructor lẫn phương thức. Giống như **Chương 4**, chương này tập trung vào tính dễ sử dụng, tính vững chắc và tính linh hoạt.

## Item 49: Kiểm tra tính hợp lệ của tham số

Hầu hết các phương thức và constructor đều có một số ràng buộc về những giá trị được phép truyền vào tham số của chúng. Ví dụ, chuyện các giá trị chỉ số phải không âm và các tham chiếu đối tượng phải khác null là rất phổ biến. Bạn nên ghi rõ tất cả những ràng buộc như vậy trong tài liệu và thực thi chúng bằng các kiểm tra ở đầu thân phương thức. Đây là trường hợp đặc biệt của nguyên tắc chung rằng bạn nên cố gắng phát hiện lỗi càng sớm càng tốt ngay sau khi chúng xảy ra. Nếu không làm vậy, khả năng phát hiện được lỗi sẽ giảm đi, và một khi đã phát hiện, việc xác định nguồn gốc của lỗi cũng khó khăn hơn.

Nếu một giá trị tham số không hợp lệ được truyền vào phương thức và phương thức kiểm tra tham số của nó trước khi thực thi, nó sẽ thất bại nhanh chóng và gọn gàng với một exception thích hợp. Nếu phương thức không kiểm tra tham số, nhiều chuyện có thể xảy ra. Phương thức có thể thất bại với một exception khó hiểu ngay giữa quá trình xử lý. Tệ hơn, phương thức có thể trả về bình thường nhưng âm thầm tính ra kết quả sai. Tệ nhất là phương thức có thể trả về bình thường nhưng để lại một đối tượng nào đó ở trạng thái bị hỏng, gây ra lỗi ở một điểm không liên quan nào đó trong mã, vào một thời điểm không xác định trong tương lai. Nói cách khác, việc không kiểm tra tính hợp lệ của tham số có thể dẫn đến vi phạm *tính nguyên tử khi thất bại* (failure atomicity) (**Item 76**).

Đối với các phương thức public và protected, hãy dùng thẻ Javadoc `@throws` để ghi lại exception sẽ được ném ra nếu một ràng buộc về giá trị tham số bị vi phạm (**Item 74**). Thông thường, exception tương ứng sẽ là `IllegalArgumentException`, `IndexOutOfBoundsException`, hoặc `NullPointerException` (**Item 72**). Một khi bạn đã ghi rõ các ràng buộc về tham số của phương thức và đã ghi rõ các exception sẽ được ném ra nếu những ràng buộc này bị vi phạm, việc thực thi các ràng buộc đó chỉ còn là chuyện đơn giản. Đây là một ví dụ điển hình:

```java
/**
 * Returns a BigInteger whose value is (this mod m). This method
 * differs from the remainder method in that it always returns a
 * non-negative BigInteger.
 *
 * @param m the modulus, which must be positive
 * @return this mod m
 * @throws ArithmeticException if m is less than or equal to 0
 */
public BigInteger mod(BigInteger m) {
    if (m.signum() <= 0)
        throw new ArithmeticException("Modulus <= 0: " + m);
    ... // Do the computation
}
```

Lưu ý rằng doc comment *không* nói rằng "`mod` ném `NullPointerException` nếu `m` là null", mặc dù phương thức làm đúng như vậy, như một hệ quả phụ của việc gọi `m.signum()`. Exception này *được* ghi trong doc comment ở cấp class của class `BigInteger` bao quanh. Comment ở cấp class áp dụng cho tất cả các tham số trong tất cả các phương thức public của class. Đây là cách hay để tránh sự rườm rà khi phải ghi lại từng `NullPointerException` cho từng phương thức một. Cách này có thể kết hợp với việc dùng `@Nullable` hoặc một annotation tương tự để chỉ ra rằng một tham số cụ thể có thể là null, nhưng thực hành này chưa phải là chuẩn, và hiện có nhiều annotation khác nhau đang được dùng cho mục đích này.

**Phương thức** `Objects.requireNonNull`**, được thêm vào Java 7, vừa linh hoạt vừa tiện lợi, nên không còn lý do gì để tự tay kiểm tra null nữa.** Bạn có thể chỉ định thông điệp chi tiết cho exception của riêng mình nếu muốn. Phương thức này trả về chính đầu vào của nó, nên bạn có thể vừa kiểm tra null vừa sử dụng giá trị cùng lúc:

```java
// Inline use of Java's null-checking facility
this.strategy = Objects.requireNonNull(strategy, "strategy");
```

Bạn cũng có thể bỏ qua giá trị trả về và dùng `Objects.requireNonNull` như một lệnh kiểm tra null độc lập khi điều đó phù hợp với nhu cầu của bạn.

Trong Java 9, một tiện ích kiểm tra khoảng (range-checking) đã được thêm vào `java.util.Objects`. Tiện ích này gồm ba phương thức: `checkFromIndexSize`, `checkFromToIndex`, và `checkIndex`. Tiện ích này không linh hoạt bằng phương thức kiểm tra null. Nó không cho phép bạn chỉ định thông điệp chi tiết cho exception của riêng mình, và nó được thiết kế chỉ để dùng cho chỉ số của list và mảng. Nó không xử lý các khoảng đóng (khoảng chứa cả hai đầu mút). Nhưng nếu nó làm được điều bạn cần, thì đó là một tiện ích hữu ích.

Đối với một phương thức không được export (unexported method), bạn, với tư cách là tác giả của package, kiểm soát được các hoàn cảnh mà phương thức được gọi, nên bạn có thể và nên đảm bảo rằng chỉ những giá trị tham số hợp lệ mới được truyền vào. Do đó, các phương thức không public có thể kiểm tra tham số của chúng bằng *assertion* (khẳng định), như dưới đây:

```java
// Private helper function for a recursive sort
private static void sort(long a[], int offset, int length) {
    assert a != null;
    assert offset >= 0 && offset <= a.length;
    assert length >= 0 && length <= a.length - offset;
    ... // Do the computation
}
```

Về bản chất, những assertion này là các tuyên bố rằng điều kiện được khẳng định *sẽ* đúng, bất kể package bao quanh được các client sử dụng như thế nào. Không giống các kiểm tra tính hợp lệ thông thường, assertion ném `AssertionError` nếu chúng thất bại. Và cũng không giống các kiểm tra tính hợp lệ thông thường, chúng không có tác dụng gì và về cơ bản không tốn chi phí gì trừ khi bạn bật chúng lên, bằng cách truyền cờ `-ea` (hoặc `-enableassertions`) cho lệnh `java`. Để biết thêm về assertion, hãy xem hướng dẫn [**Asserts**].

Việc kiểm tra tính hợp lệ của những tham số không được phương thức sử dụng ngay mà được lưu lại để dùng sau là đặc biệt quan trọng. Ví dụ, hãy xem xét static factory method ở trang 101, nhận vào một mảng `int` và trả về một `List` view của mảng đó. Nếu client truyền vào `null`, phương thức sẽ ném `NullPointerException` vì phương thức có một kiểm tra tường minh (lời gọi `Objects.requireNonNull`). Nếu kiểm tra này bị bỏ qua, phương thức sẽ trả về một tham chiếu đến một thể hiện `List` mới được tạo, và thể hiện này sẽ ném `NullPointerException` ngay khi client cố gắng sử dụng nó. Đến lúc đó, nguồn gốc của thể hiện `List` có thể rất khó xác định, khiến việc gỡ lỗi trở nên phức tạp hơn rất nhiều.

Constructor là một trường hợp đặc biệt của nguyên tắc rằng bạn nên kiểm tra tính hợp lệ của những tham số sẽ được cất đi để dùng sau. Việc kiểm tra tính hợp lệ của tham số constructor là cực kỳ quan trọng để ngăn chặn việc tạo ra một đối tượng vi phạm các bất biến (invariant) của class.

Có những ngoại lệ đối với quy tắc rằng bạn nên kiểm tra tường minh các tham số của phương thức trước khi thực hiện tính toán. Một ngoại lệ quan trọng là trường hợp việc kiểm tra tính hợp lệ sẽ tốn kém hoặc không thực tế, *và* việc kiểm tra đó được thực hiện ngầm trong quá trình tính toán. Ví dụ, hãy xem xét một phương thức sắp xếp một danh sách các đối tượng, chẳng hạn `Collections.sort(List)`. Tất cả các đối tượng trong danh sách phải so sánh được với nhau. Trong quá trình sắp xếp danh sách, mỗi đối tượng trong danh sách sẽ được so sánh với một đối tượng khác nào đó trong danh sách. Nếu các đối tượng không so sánh được với nhau, một trong những phép so sánh này sẽ ném `ClassCastException`, và đó chính xác là điều phương thức `sort` nên làm. Do đó, sẽ chẳng có mấy ý nghĩa nếu kiểm tra trước rằng các phần tử trong danh sách có so sánh được với nhau hay không. Tuy nhiên, hãy lưu ý rằng việc dựa dẫm bừa bãi vào các kiểm tra tính hợp lệ ngầm có thể dẫn đến mất *tính nguyên tử khi thất bại* (**Item 76**).

Đôi khi, một phép tính thực hiện ngầm một kiểm tra tính hợp lệ cần thiết nhưng lại ném ra sai exception nếu kiểm tra thất bại. Nói cách khác, exception mà phép tính sẽ ném ra một cách tự nhiên do giá trị tham số không hợp lệ không khớp với exception mà phương thức được ghi trong tài liệu là sẽ ném. Trong những hoàn cảnh này, bạn nên dùng idiom *exception translation* (chuyển đổi exception), được mô tả trong **Item 73**, để chuyển exception tự nhiên thành exception đúng.

Đừng suy diễn từ Item này rằng việc đặt ra những ràng buộc tùy tiện lên tham số là điều tốt. Ngược lại, bạn nên thiết kế phương thức càng tổng quát càng tốt trong chừng mực thực tế cho phép. Càng ít ràng buộc đặt lên tham số càng tốt, với giả định rằng phương thức có thể làm điều gì đó hợp lý với tất cả các giá trị tham số mà nó chấp nhận. Tuy nhiên, thường thì một số ràng buộc là bản chất cố hữu của khái niệm trừu tượng đang được cài đặt.

Tóm lại, mỗi khi viết một phương thức hoặc constructor, bạn nên nghĩ xem có những ràng buộc gì trên tham số của nó. Bạn nên ghi rõ những ràng buộc này trong tài liệu và thực thi chúng bằng các kiểm tra tường minh ở đầu thân phương thức. Điều quan trọng là tạo thói quen làm việc này. Công sức khiêm tốn bỏ ra sẽ được đền đáp xứng đáng ngay lần đầu tiên một kiểm tra tính hợp lệ thất bại.

## Item 50: Tạo bản sao phòng vệ khi cần thiết

Một điều khiến Java trở nên thú vị khi sử dụng là nó là một *ngôn ngữ an toàn* (safe language). Điều này có nghĩa là, khi không có native method, nó miễn nhiễm với tràn bộ đệm (buffer overrun), tràn mảng (array overrun), con trỏ hoang (wild pointer), và các lỗi hỏng bộ nhớ khác vốn gây tai họa cho những ngôn ngữ không an toàn như C và C++. Trong một ngôn ngữ an toàn, bạn có thể viết các class và biết chắc chắn rằng các bất biến (invariant) của chúng sẽ được duy trì, bất kể chuyện gì xảy ra ở bất kỳ phần nào khác của hệ thống. Điều này là không thể trong những ngôn ngữ coi toàn bộ bộ nhớ như một mảng khổng lồ.

Ngay cả trong một ngôn ngữ an toàn, bạn cũng không được cách ly khỏi các class khác nếu không bỏ ra chút công sức. **Bạn phải lập trình một cách phòng vệ, với giả định rằng các client của class sẽ làm hết sức để phá hủy các bất biến của nó.** Điều này ngày càng đúng khi người ta ngày càng cố gắng phá vỡ tính bảo mật của các hệ thống, nhưng phổ biến hơn, class của bạn sẽ phải đối phó với những hành vi bất ngờ nảy sinh từ những sai lầm vô tình của các lập trình viên có thiện ý. Dù là trường hợp nào, việc dành thời gian để viết những class vững chắc trước các client hành xử sai cũng là đáng giá.

Mặc dù một class khác không thể sửa đổi trạng thái bên trong của một đối tượng nếu không có sự trợ giúp nào đó từ chính đối tượng đó, nhưng việc vô tình cung cấp sự trợ giúp như vậy lại dễ dàng đến ngạc nhiên. Ví dụ, hãy xem xét class sau đây, được cho là biểu diễn một khoảng thời gian immutable:

```java
// Broken "immutable" time period class
public final class Period {
    private final Date start;
    private final Date end;

    /**
     * @param  start the beginning of the period
     * @param  end the end of the period; must not precede start
     * @throws IllegalArgumentException if start is after end
     * @throws NullPointerException if start or end is null
     */
    public Period(Date start, Date end) {
        if (start.compareTo(end) > 0)
            throw new IllegalArgumentException(
                start + " after " + end);
        this.start = start;
        this.end   = end;
    }

    public Date start() {
        return start;
    }

    public Date end() {
        return end;
    }

    ...    // Remainder omitted
}
```

Thoạt nhìn, class này có vẻ là immutable và thực thi được bất biến rằng điểm bắt đầu của một khoảng thời gian không nằm sau điểm kết thúc của nó. Tuy nhiên, rất dễ vi phạm bất biến này bằng cách khai thác việc `Date` là mutable (khả biến):

```java
// Attack the internals of a Period instance
Date start = new Date();
Date end = new Date();
Period p = new Period(start, end);
end.setYear(78);  // Modifies internals of p!
```

Kể từ Java 8, cách rõ ràng để khắc phục vấn đề này là dùng `Instant` (hoặc `LocalDateTime` hay `ZonedDateTime`) thay cho `Date`, vì `Instant` (và các class khác trong `java.time`) là immutable (**Item 17**). `Date` **đã lỗi thời và không nên được dùng trong mã mới nữa.** Dẫu vậy, vấn đề vẫn tồn tại: sẽ có những lúc bạn phải dùng các kiểu giá trị mutable trong API và trong biểu diễn nội bộ của mình, và các kỹ thuật được thảo luận trong Item này là phù hợp cho những lúc đó.

Để bảo vệ phần bên trong của một thể hiện `Period` khỏi kiểu tấn công này, **điều thiết yếu là tạo bản sao phòng vệ (defensive copy) của mỗi tham số mutable truyền vào constructor** và dùng các bản sao đó làm thành phần của thể hiện `Period` thay cho bản gốc:

```java
// Repaired constructor - makes defensive copies of parameters
public Period(Date start, Date end) {
    this.start = new Date(start.getTime());
    this.end   = new Date(end.getTime());

    if (this.start.compareTo(this.end) > 0)
      throw new IllegalArgumentException(
          this.start + " after " + this.end);
}
```

Với constructor mới này, cuộc tấn công trước đó sẽ không có tác dụng gì lên thể hiện `Period`. Lưu ý rằng **các bản sao phòng vệ được tạo ra trước khi kiểm tra tính hợp lệ của tham số (Item 49), và việc kiểm tra tính hợp lệ được thực hiện trên các bản sao chứ không phải trên bản gốc.** Dù điều này có vẻ không tự nhiên, nó là cần thiết. Nó bảo vệ class khỏi những thay đổi lên tham số từ một thread khác trong *khoảng thời gian dễ bị tổn thương* (window of vulnerability) giữa thời điểm tham số được kiểm tra và thời điểm chúng được sao chép. Trong cộng đồng bảo mật máy tính, điều này được gọi là tấn công *time-of-check/time-of-use* hay *TOCTOU* [**Viega01**].

Cũng lưu ý rằng chúng ta đã không dùng phương thức `clone` của `Date` để tạo các bản sao phòng vệ. Vì `Date` không phải là final, phương thức `clone` không được đảm bảo sẽ trả về một đối tượng có class là `java.util.Date`: nó có thể trả về một thể hiện của một subclass không đáng tin cậy được thiết kế đặc biệt để phá hoại. Chẳng hạn, một subclass như vậy có thể ghi lại tham chiếu đến từng thể hiện vào một danh sách static private tại thời điểm tạo ra chúng và cho phép kẻ tấn công truy cập danh sách này. Điều này sẽ cho kẻ tấn công toàn quyền thao túng mọi thể hiện. Để ngăn chặn kiểu tấn công này, **đừng dùng phương thức** `clone` **để tạo bản sao phòng vệ cho một tham số có kiểu có thể được subclass bởi các bên không đáng tin cậy.**

Mặc dù constructor thay thế đã phòng vệ thành công trước cuộc tấn công trước đó, vẫn có thể thay đổi một thể hiện `Period`, vì các accessor của nó cho phép truy cập vào phần bên trong mutable của nó:

```java
// Second attack on the internals of a Period instance
Date start = new Date();
Date end = new Date();
Period p = new Period(start, end);
p.end().setYear(78);  // Modifies internals of p!
```

Để phòng vệ trước cuộc tấn công thứ hai, chỉ cần sửa các accessor để **trả về bản sao phòng vệ của các trường nội bộ mutable:**

```java
// Repaired accessors - make defensive copies of internal fields
public Date start() {
    return new Date(start.getTime());
}

public Date end() {
    return new Date(end.getTime());
}
```

Với constructor mới và các accessor mới, `Period` thực sự là immutable. Dù lập trình viên có ác ý hay kém cỏi đến đâu, đơn giản là không có cách nào để vi phạm bất biến rằng điểm bắt đầu của một khoảng thời gian không nằm sau điểm kết thúc của nó (trừ khi dùng đến các phương tiện ngoài ngôn ngữ như native method và reflection). Điều này đúng vì không có cách nào để bất kỳ class nào khác ngoài chính `Period` có thể truy cập vào bất kỳ trường mutable nào trong một thể hiện `Period`. Các trường này thực sự được đóng gói (encapsulated) bên trong đối tượng.

Trong các accessor, khác với constructor, việc dùng phương thức `clone` để tạo bản sao phòng vệ là chấp nhận được. Sở dĩ như vậy là vì chúng ta biết class của các đối tượng `Date` bên trong `Period` là `java.util.Date`, chứ không phải một subclass không đáng tin cậy nào đó. Dẫu vậy, nhìn chung bạn vẫn nên dùng constructor hoặc static factory để sao chép một thể hiện, vì những lý do được nêu trong **Item 13**.

Sao chép phòng vệ tham số không chỉ dành cho các class immutable. Bất cứ khi nào bạn viết một phương thức hoặc constructor lưu trữ tham chiếu đến một đối tượng do client cung cấp vào một cấu trúc dữ liệu nội bộ, hãy nghĩ xem đối tượng do client cung cấp có khả năng là mutable hay không. Nếu có, hãy nghĩ xem class của bạn có thể chịu được sự thay đổi của đối tượng sau khi nó đã được đưa vào cấu trúc dữ liệu hay không. Nếu câu trả lời là không, bạn phải sao chép phòng vệ đối tượng đó và đưa bản sao vào cấu trúc dữ liệu thay cho bản gốc. Ví dụ, nếu bạn đang cân nhắc dùng một tham chiếu đối tượng do client cung cấp làm phần tử trong một thể hiện `Set` nội bộ hoặc làm khóa trong một thể hiện `Map` nội bộ, bạn nên ý thức rằng các bất biến của set hoặc map sẽ bị hỏng nếu đối tượng bị sửa đổi sau khi được chèn vào.

Điều tương tự cũng đúng với việc sao chép phòng vệ các thành phần nội bộ trước khi trả chúng về cho client. Dù class của bạn có immutable hay không, bạn nên suy nghĩ kỹ trước khi trả về một tham chiếu đến một thành phần nội bộ mutable. Rất có thể bạn nên trả về một bản sao phòng vệ. Hãy nhớ rằng các mảng có độ dài khác 0 luôn luôn là mutable. Do đó, bạn nên luôn luôn tạo bản sao phòng vệ của một mảng nội bộ trước khi trả nó về cho client. Hoặc, bạn có thể trả về một view immutable của mảng. Cả hai kỹ thuật này đều được trình bày trong **Item 15**.

Có thể nói, bài học thực sự trong tất cả những điều này là bạn nên, ở bất cứ nơi nào có thể, dùng các đối tượng immutable làm thành phần của đối tượng của mình để không phải lo lắng về việc sao chép phòng vệ (**Item 17**). Trong trường hợp ví dụ `Period` của chúng ta, hãy dùng `Instant` (hoặc `LocalDateTime` hay `ZonedDateTime`), trừ khi bạn đang dùng phiên bản trước Java 8. Nếu bạn đang dùng phiên bản cũ hơn, một lựa chọn là lưu giá trị nguyên thủy `long` do `Date.getTime()` trả về thay cho một tham chiếu `Date`.

Việc sao chép phòng vệ có thể kéo theo tổn thất về hiệu năng và không phải lúc nào cũng hợp lý. Nếu một class tin tưởng rằng bên gọi sẽ không sửa đổi một thành phần nội bộ, có lẽ vì class và client của nó cùng thuộc một package, thì việc bỏ qua sao chép phòng vệ có thể là thích hợp. Trong những hoàn cảnh này, tài liệu của class nên nói rõ rằng bên gọi không được sửa đổi các tham số hoặc giá trị trả về liên quan.

Ngay cả khi vượt qua ranh giới package, không phải lúc nào cũng thích hợp để tạo bản sao phòng vệ của một tham số mutable trước khi tích hợp nó vào một đối tượng. Có những phương thức và constructor mà việc gọi chúng hàm ý một sự *chuyển giao* (handoff) tường minh đối tượng được tham số tham chiếu đến. Khi gọi một phương thức như vậy, client cam kết rằng nó sẽ không trực tiếp sửa đổi đối tượng đó nữa. Một phương thức hoặc constructor kỳ vọng nhận quyền sở hữu một đối tượng mutable do client cung cấp phải nói rõ điều này trong tài liệu của nó.

Các class chứa những phương thức hoặc constructor mà việc gọi chúng hàm ý một sự chuyển giao quyền kiểm soát thì không thể tự phòng vệ trước các client có ác ý. Những class như vậy chỉ chấp nhận được khi có sự tin tưởng lẫn nhau giữa class và client của nó, hoặc khi việc làm hỏng các bất biến của class chỉ gây hại cho chính client mà không ai khác. Một ví dụ cho tình huống sau là mẫu wrapper class (**Item 18**). Tùy vào bản chất của wrapper class, client có thể phá hủy các bất biến của class bằng cách truy cập trực tiếp vào một đối tượng sau khi nó đã được bọc, nhưng điều này thường chỉ gây hại cho chính client.

Tóm lại, nếu một class có các thành phần mutable mà nó nhận từ client hoặc trả về cho client, class đó phải sao chép phòng vệ những thành phần này. Nếu chi phí sao chép quá lớn *và* class tin tưởng rằng client sẽ không sửa đổi các thành phần đó một cách không thích hợp, thì bản sao phòng vệ có thể được thay thế bằng tài liệu nêu rõ trách nhiệm của client là không được sửa đổi các thành phần liên quan.

## Item 51: Thiết kế chữ ký phương thức một cách cẩn thận

Item này là một tập hợp các gợi ý thiết kế API chưa đủ tầm để có Item riêng. Gộp lại, chúng sẽ giúp API của bạn dễ học, dễ dùng hơn và ít gây lỗi hơn.

**Chọn tên phương thức cẩn thận.** Tên luôn phải tuân theo các quy ước đặt tên chuẩn (**Item 68**). Mục tiêu hàng đầu của bạn là chọn những cái tên dễ hiểu và nhất quán với các tên khác trong cùng package. Mục tiêu thứ hai là chọn những cái tên nhất quán với sự đồng thuận rộng rãi hơn, ở nơi nào có sự đồng thuận đó. Tránh những tên phương thức dài. Khi phân vân, hãy nhìn vào các API trong thư viện Java để tham khảo. Mặc dù có rất nhiều chỗ không nhất quán (điều không thể tránh khỏi, xét đến quy mô và phạm vi của các thư viện này), vẫn có một mức độ đồng thuận đáng kể.

**Đừng quá tay trong việc cung cấp các phương thức tiện ích.** Mỗi phương thức phải "xứng đáng với sự tồn tại của nó". Quá nhiều phương thức khiến class khó học, khó dùng, khó viết tài liệu, khó kiểm thử và khó bảo trì. Điều này càng đúng gấp đôi với interface, nơi quá nhiều phương thức làm phức tạp cuộc sống của cả người cài đặt lẫn người dùng. Với mỗi hành động mà class hoặc interface của bạn hỗ trợ, hãy cung cấp một phương thức đầy đủ chức năng. Chỉ cân nhắc cung cấp một "lối tắt" nếu nó sẽ được dùng thường xuyên. **Khi phân vân, hãy bỏ nó đi.**

**Tránh danh sách tham số dài.** Hãy nhắm đến bốn tham số trở xuống. Hầu hết lập trình viên không thể nhớ được danh sách tham số dài hơn thế. Nếu nhiều phương thức của bạn vượt quá giới hạn này, API của bạn sẽ không thể dùng được nếu không liên tục tra cứu tài liệu. Các IDE hiện đại có giúp ích, nhưng bạn vẫn tốt hơn nhiều với danh sách tham số ngắn. **Những chuỗi dài các tham số cùng kiểu là đặc biệt có hại.** Không những người dùng không nhớ được thứ tự của các tham số, mà khi họ vô tình hoán đổi vị trí tham số, chương trình của họ vẫn biên dịch và chạy được. Chỉ là chúng không làm điều mà tác giả mong muốn.

Có ba kỹ thuật để rút ngắn danh sách tham số quá dài. Kỹ thuật thứ nhất là chia phương thức thành nhiều phương thức, mỗi phương thức chỉ cần một tập con các tham số. Nếu làm bất cẩn, điều này có thể dẫn đến quá nhiều phương thức, nhưng nó cũng có thể giúp *giảm* số lượng phương thức bằng cách tăng tính trực giao (orthogonality). Ví dụ, hãy xem xét interface `java.util.List`. Nó không cung cấp phương thức để tìm chỉ số đầu tiên hoặc cuối cùng của một phần tử trong một sublist, cả hai đều sẽ cần ba tham số. Thay vào đó, nó cung cấp phương thức `subList`, nhận hai tham số và trả về một *view* của sublist. Phương thức này có thể kết hợp với phương thức `indexOf` hoặc `lastIndexOf`, mỗi phương thức chỉ có một tham số, để đạt được chức năng mong muốn. Hơn nữa, phương thức `subList` có thể kết hợp với *bất kỳ* phương thức nào thao tác trên một thể hiện `List` để thực hiện các tính toán tùy ý trên các sublist. API thu được có tỷ lệ sức mạnh trên khối lượng rất cao.

Kỹ thuật thứ hai để rút ngắn danh sách tham số dài là tạo các *helper class* (class hỗ trợ) để chứa các nhóm tham số. Thông thường các helper class này là các static member class (**Item 24**). Kỹ thuật này được khuyến nghị nếu một chuỗi tham số xuất hiện thường xuyên được nhận thấy là biểu diễn một thực thể riêng biệt nào đó. Ví dụ, giả sử bạn đang viết một class biểu diễn một trò chơi bài, và bạn thấy mình liên tục truyền một chuỗi hai tham số biểu diễn hạng (rank) và chất (suit) của một lá bài. API của bạn, cũng như phần bên trong class, có lẽ sẽ được hưởng lợi nếu bạn thêm một helper class để biểu diễn một lá bài và thay thế mọi lần xuất hiện của chuỗi tham số đó bằng một tham số duy nhất thuộc kiểu helper class.

Kỹ thuật thứ ba, kết hợp các khía cạnh của hai kỹ thuật đầu, là điều chỉnh mẫu Builder (**Item 2**) từ việc xây dựng đối tượng sang việc gọi phương thức. Nếu bạn có một phương thức với nhiều tham số, đặc biệt là khi một số trong đó là tùy chọn, có thể sẽ có lợi nếu định nghĩa một đối tượng biểu diễn tất cả các tham số và cho phép client thực hiện nhiều lời gọi "setter" trên đối tượng này, mỗi lời gọi thiết lập một tham số hoặc một nhóm nhỏ các tham số liên quan. Khi các tham số mong muốn đã được thiết lập, client gọi phương thức "execute" của đối tượng, phương thức này thực hiện các kiểm tra tính hợp lệ cuối cùng trên các tham số và thực hiện tính toán thực sự.

**Với kiểu của tham số, hãy ưu tiên interface hơn class** (**Item 64**). Nếu có một interface thích hợp để định nghĩa một tham số, hãy dùng nó thay vì một class cài đặt interface đó. Ví dụ, không có lý do gì để viết một phương thức nhận `HashMap` làm đầu vào—hãy dùng `Map` thay thế. Điều này cho phép bạn truyền vào một `HashMap`, một `TreeMap`, một `ConcurrentHashMap`, một submap của `TreeMap`, hay bất kỳ cài đặt `Map` nào chưa được viết ra. Bằng cách dùng class thay vì interface, bạn giới hạn client vào một cài đặt cụ thể và buộc phải có một thao tác sao chép không cần thiết và có thể tốn kém nếu dữ liệu đầu vào tình cờ tồn tại ở một dạng khác.

**Ưu tiên kiểu enum hai phần tử hơn tham số** `boolean`**,** trừ khi ý nghĩa của boolean đã rõ ràng từ tên phương thức. Enum làm cho mã của bạn dễ đọc và dễ viết hơn. Ngoài ra, chúng giúp việc thêm các tùy chọn khác sau này trở nên dễ dàng. Ví dụ, bạn có thể có kiểu `Thermometer` với một static factory nhận enum này:

```java
public enum TemperatureScale { FAHRENHEIT, CELSIUS }
```

Không những `Thermometer.newInstance(TemperatureScale.CELSIUS)` có ý nghĩa hơn nhiều so với `Thermometer.newInstance(true)`, mà bạn còn có thể thêm `KELVIN` vào `TemperatureScale` trong một phiên bản tương lai mà không cần thêm static factory mới vào `Thermometer`. Ngoài ra, bạn có thể tái cấu trúc các phụ thuộc vào thang nhiệt độ thành các phương thức trên các hằng số enum (**Item 34**). Ví dụ, mỗi hằng số thang đo có thể có một phương thức nhận một giá trị `double` và chuyển đổi nó sang độ Celsius.

## Item 52: Sử dụng overloading một cách thận trọng

Chương trình sau đây là một nỗ lực có thiện ý nhằm phân loại các collection theo việc chúng là set, list, hay một loại collection nào khác:

```java
// Broken! - What does this program print?
public class CollectionClassifier {
    public static String classify(Set<?> s) {
        return "Set";
    }

    public static String classify(List<?> lst) {
        return "List";
    }

    public static String classify(Collection<?> c) {
        return "Unknown Collection";
    }

    public static void main(String[] args) {
        Collection<?>[] collections = {
            new HashSet<String>(),
            new ArrayList<BigInteger>(),
            new HashMap<String, String>().values()
        };

        for (Collection<?> c : collections)
            System.out.println(classify(c));
    }
}
```

Bạn có thể kỳ vọng chương trình này in ra `Set`, rồi đến `List` và `Unknown Collection`, nhưng không phải vậy. Nó in ra `Unknown Collection` ba lần. Tại sao lại thế? Vì phương thức `classify` được *overload* (nạp chồng), và **việc chọn overloading nào để gọi được quyết định tại thời điểm biên dịch.** Trong cả ba vòng lặp, kiểu tại thời điểm biên dịch của tham số đều giống nhau: `Collection<?>`. Kiểu tại thời gian chạy thì khác nhau ở mỗi vòng lặp, nhưng điều này không ảnh hưởng đến việc chọn overloading. Vì kiểu tại thời điểm biên dịch của tham số là `Collection<?>`, overloading duy nhất áp dụng được là overloading thứ ba, `classify(Collection<?>)`, và overloading này được gọi ở mỗi vòng lặp.

Hành vi của chương trình này trái với trực giác vì **việc lựa chọn giữa các phương thức được overload là tĩnh, trong khi việc lựa chọn giữa các phương thức được override là động.** Phiên bản đúng của một phương thức được *override* (ghi đè) được chọn tại thời gian chạy, dựa trên kiểu tại thời gian chạy của đối tượng mà phương thức được gọi trên đó. Để nhắc lại, một phương thức được override khi một subclass chứa một khai báo phương thức có cùng chữ ký với một khai báo phương thức ở class tổ tiên. Nếu một phương thức thể hiện (instance method) được override trong một subclass và phương thức này được gọi trên một thể hiện của subclass, thì *phương thức overriding* của subclass được thực thi, bất kể kiểu tại thời điểm biên dịch của thể hiện subclass đó là gì. Để cụ thể hóa, hãy xem xét chương trình sau:

```java
class Wine {
    String name() { return "wine"; }
}

class SparklingWine extends Wine {
    @Override String name() { return "sparkling wine"; }
}

class Champagne extends SparklingWine {
    @Override String name() { return "champagne"; }
}
public class Overriding {
    public static void main(String[] args) {
        List<Wine> wineList = List.of(
            new Wine(), new SparklingWine(), new Champagne());

        for (Wine wine : wineList)
            System.out.println(wine.name());
    }
}
```

Phương thức `name` được khai báo trong class `Wine` và được override trong các subclass `SparklingWine` và `Champagne`. Đúng như bạn mong đợi, chương trình này in ra `wine`, `sparkling wine`, và `champagne`, mặc dù kiểu tại thời điểm biên dịch của thể hiện là `Wine` ở mỗi vòng lặp. Kiểu tại thời điểm biên dịch của một đối tượng không ảnh hưởng gì đến việc phương thức nào được thực thi khi một phương thức được override được gọi; phương thức overriding "cụ thể nhất" luôn được thực thi. Hãy so sánh điều này với overloading, nơi kiểu tại thời gian chạy của một đối tượng không ảnh hưởng gì đến việc overloading nào được thực thi; việc lựa chọn được thực hiện tại thời điểm biên dịch, hoàn toàn dựa trên kiểu tại thời điểm biên dịch của các tham số.

Trong ví dụ `CollectionClassifier`, ý định của chương trình là nhận biết kiểu của tham số bằng cách tự động điều phối (dispatch) đến overloading thích hợp dựa trên kiểu tại thời gian chạy của tham số, giống như phương thức `name` đã làm trong ví dụ `Wine`. Overloading phương thức đơn giản là không cung cấp chức năng này. Giả sử cần một phương thức static, cách tốt nhất để sửa chương trình `CollectionClassifier` là thay thế cả ba overloading của `classify` bằng một phương thức duy nhất thực hiện các kiểm tra `instanceof` tường minh:

```java
public static String classify(Collection<?> c) {
    return c instanceof Set  ? "Set" :
           c instanceof List ? "List" : "Unknown Collection";
}
```

Vì overriding là chuẩn mực còn overloading là ngoại lệ, overriding định hình kỳ vọng của mọi người về hành vi của việc gọi phương thức. Như ví dụ `CollectionClassifier` đã cho thấy, overloading có thể dễ dàng làm rối loạn những kỳ vọng này. Viết mã có hành vi dễ gây nhầm lẫn cho lập trình viên là một thực hành xấu. Điều này đặc biệt đúng với API. Nếu người dùng thông thường của một API không biết overloading nào trong số nhiều overloading sẽ được gọi cho một tập tham số cho trước, việc sử dụng API đó rất có thể sẽ dẫn đến lỗi. Những lỗi này nhiều khả năng sẽ biểu hiện thành hành vi thất thường tại thời gian chạy, và nhiều lập trình viên sẽ gặp khó khăn trong việc chẩn đoán chúng. Do đó bạn nên **tránh những cách dùng overloading gây nhầm lẫn.**

Chính xác điều gì tạo nên một cách dùng overloading gây nhầm lẫn thì vẫn còn có thể tranh luận. **Một chính sách an toàn và thận trọng là không bao giờ export hai overloading có cùng số lượng tham số.** Nếu một phương thức dùng varargs, chính sách thận trọng là không overload nó chút nào, ngoại trừ như được mô tả trong **Item 53**. Nếu bạn tuân theo những hạn chế này, lập trình viên sẽ không bao giờ phải băn khoăn overloading nào áp dụng cho bất kỳ tập tham số thực nào. Những hạn chế này không quá nặng nề vì **bạn luôn có thể đặt tên khác cho các phương thức thay vì overload chúng.**

Ví dụ, hãy xem xét class `ObjectOutputStream`. Nó có một biến thể của phương thức `write` cho mỗi kiểu nguyên thủy và cho một số kiểu tham chiếu. Thay vì overload phương thức `write`, các biến thể này đều có tên khác nhau, chẳng hạn `writeBoolean(boolean)`, `writeInt(int)`, và `writeLong(long)`. Một lợi ích thêm của cách đặt tên này, so với overloading, là có thể cung cấp các phương thức đọc với tên tương ứng, ví dụ `readBoolean()`, `readInt()`, và `readLong()`. Class `ObjectInputStream` thực tế có cung cấp những phương thức đọc như vậy.

Với constructor, bạn không có lựa chọn dùng tên khác: nhiều constructor cho một class *luôn luôn* là overload. Trong nhiều trường hợp, bạn có lựa chọn export static factory thay vì constructor (**Item 1**). Ngoài ra, với constructor bạn không phải lo lắng về sự tương tác giữa overloading và overriding, vì constructor không thể bị override. Bạn có lẽ sẽ có lúc phải export nhiều constructor có cùng số lượng tham số, nên việc biết cách làm điều đó một cách an toàn là đáng giá.

Việc export nhiều overloading có cùng số lượng tham số không có khả năng gây nhầm lẫn cho lập trình viên *nếu* luôn luôn rõ ràng overloading nào sẽ áp dụng cho bất kỳ tập tham số thực nào. Đây là trường hợp khi ít nhất một tham số hình thức tương ứng trong mỗi cặp overloading có kiểu "khác biệt triệt để" (radically different) giữa hai overloading. Hai kiểu là khác biệt triệt để nếu rõ ràng không thể ép kiểu (cast) bất kỳ biểu thức khác null nào sang cả hai kiểu. Trong những hoàn cảnh này, overloading nào áp dụng cho một tập tham số thực cho trước hoàn toàn được xác định bởi kiểu tại thời gian chạy của các tham số và không thể bị ảnh hưởng bởi kiểu tại thời điểm biên dịch của chúng, nên một nguồn nhầm lẫn lớn biến mất. Ví dụ, `ArrayList` có một constructor nhận một `int` và một constructor thứ hai nhận một `Collection`. Thật khó hình dung có sự nhầm lẫn nào về việc constructor nào trong hai constructor này sẽ được gọi trong bất kỳ hoàn cảnh nào.

Trước Java 5, tất cả các kiểu nguyên thủy đều khác biệt triệt để với tất cả các kiểu tham chiếu, nhưng điều này không còn đúng khi có autoboxing, và nó đã gây ra rắc rối thực sự. Hãy xem xét chương trình sau:

```java
public class SetList {
    public static void main(String[] args) {
        Set<Integer> set = new TreeSet<>();
        List<Integer> list = new ArrayList<>();

        for (int i = -3; i < 3; i++) {
            set.add(i);
            list.add(i);
        }
        for (int i = 0; i < 3; i++) {
            set.remove(i);
            list.remove(i);
        }
        System.out.println(set + " " + list);
    }
}
```

Đầu tiên, chương trình thêm các số nguyên từ −3 đến 2 (bao gồm cả hai đầu) vào một sorted set và một list. Sau đó, nó thực hiện ba lời gọi `remove` giống hệt nhau trên set và list. Nếu bạn giống như hầu hết mọi người, bạn sẽ kỳ vọng chương trình xóa các giá trị không âm (0, 1, và 2) khỏi set và list rồi in ra `[-3, -2, -1] [-3, -2, -1]`. Trên thực tế, chương trình xóa các giá trị không âm khỏi set và xóa các giá trị lẻ khỏi list rồi in ra `[-3, -2, -1] [-2, 0, 2]`. Gọi hành vi này là gây nhầm lẫn vẫn còn là nói nhẹ.

Đây là điều đang xảy ra: Lời gọi `set.remove(i)` chọn overloading `remove(E)`, trong đó `E` là kiểu phần tử của set (`Integer`), và autobox `i` từ `int` thành `Integer`. Đây là hành vi bạn kỳ vọng, nên chương trình cuối cùng xóa các giá trị dương khỏi set. Ngược lại, lời gọi `list.remove(i)` chọn overloading `remove(int i)`, phương thức này xóa phần tử tại *vị trí* được chỉ định trong list. Nếu bạn bắt đầu với list `[-3, -2, -1, 0, 1, 2]` và xóa phần tử thứ 0, rồi phần tử thứ nhất, rồi phần tử thứ hai, bạn sẽ còn lại `[-2, 0, 2]`, và bí ẩn được giải đáp. Để khắc phục vấn đề, hãy ép kiểu đối số của `list.remove` sang `Integer`, buộc chọn đúng overloading. Hoặc, bạn có thể gọi `Integer.valueOf` trên `i` và truyền kết quả cho `list.remove`. Dù cách nào, chương trình cũng in ra `[-3, -2, -1] [-3, -2, -1]`, như mong đợi:

```java
for (int i = 0; i < 3; i++) {
    set.remove(i);
    list.remove((Integer) i);  // or remove(Integer.valueOf(i))
}
```

Hành vi gây nhầm lẫn trong ví dụ trên nảy sinh vì interface `List` có hai overloading của phương thức remove: `remove(Object)` và `remove(int)`. Trước Java 5, khi interface `List` được "generic hóa", các kiểu tham số tương ứng, `Object` và `int`, là khác biệt triệt để. Nhưng khi có generics và autoboxing, hai kiểu tham số này không còn khác biệt triệt để nữa. Nói cách khác, việc thêm generics và autoboxing vào ngôn ngữ đã làm hỏng interface `List`. May mắn thay, hầu như không có API nào khác trong thư viện Java bị hỏng tương tự, nhưng câu chuyện này cho thấy rõ rằng autoboxing và generics đã làm tăng tầm quan trọng của sự thận trọng khi overload.

Việc bổ sung lambda và method reference trong Java 8 càng làm tăng khả năng gây nhầm lẫn trong overloading. Ví dụ, hãy xem xét hai đoạn mã sau:

```java
new Thread(System.out::println).start();

ExecutorService exec = Executors.newCachedThreadPool();
exec.submit(System.out::println);
```

Mặc dù lời gọi constructor `Thread` và lời gọi phương thức `submit` trông giống nhau, lời gọi đầu biên dịch được còn lời gọi sau thì không. Các đối số là giống hệt nhau (`System.out::println`), và cả constructor lẫn phương thức đều có một overloading nhận `Runnable`. Chuyện gì đang xảy ra ở đây? Câu trả lời đáng ngạc nhiên là phương thức `submit` có một overloading nhận `Callable<T>`, trong khi constructor `Thread` thì không. Bạn có thể nghĩ rằng điều này chẳng nên tạo ra khác biệt gì vì tất cả các overloading của `println` đều trả về `void`, nên method reference đó không thể nào là một `Callable`. Điều này hoàn toàn hợp lý, nhưng đó không phải là cách thuật toán phân giải overload (overload resolution) hoạt động. Có lẽ cũng đáng ngạc nhiên không kém là lời gọi phương thức `submit` sẽ hợp lệ nếu phương thức `println` không bị overload. Chính sự kết hợp giữa việc overload của phương thức được tham chiếu (`println`) và của phương thức được gọi (`submit`) đã ngăn thuật toán phân giải overload hoạt động như bạn mong đợi.

Nói một cách kỹ thuật, vấn đề là `System.out::println` là một *inexact method reference* (method reference không chính xác) [JLS, 15.13.1] và "một số biểu thức đối số chứa các biểu thức lambda có kiểu ngầm định hoặc các method reference không chính xác sẽ bị bỏ qua bởi các phép kiểm tra tính áp dụng được, vì ý nghĩa của chúng không thể được xác định cho đến khi một kiểu đích được chọn [JLS, 15.12.2]." Đừng lo nếu bạn không hiểu đoạn này; nó dành cho những người viết compiler. Điểm mấu chốt là việc overload phương thức hoặc constructor với các functional interface khác nhau ở cùng một vị trí đối số gây ra nhầm lẫn. Do đó, **đừng overload phương thức để nhận các functional interface khác nhau ở cùng một vị trí đối số.** Theo cách nói của Item này, các functional interface khác nhau không phải là khác biệt triệt để. Compiler Java sẽ cảnh báo bạn về kiểu overload có vấn đề này nếu bạn truyền tùy chọn dòng lệnh `-Xlint:overloads`.

Các kiểu mảng và các kiểu class khác `Object` là khác biệt triệt để. Ngoài ra, các kiểu mảng và các kiểu interface khác `Serializable` và `Cloneable` là khác biệt triệt để. Hai class phân biệt được gọi là *không liên quan* (unrelated) nếu không class nào là hậu duệ của class kia [JLS, 5.5]. Ví dụ, `String` và `Throwable` là không liên quan. Không đối tượng nào có thể là thể hiện của hai class không liên quan, nên các class không liên quan cũng là khác biệt triệt để.

Còn có những cặp kiểu khác không thể chuyển đổi theo cả hai chiều [JLS, 5.1.12], nhưng một khi vượt ra ngoài các trường hợp đơn giản được mô tả ở trên, hầu hết lập trình viên sẽ rất khó nhận ra overloading nào, nếu có, áp dụng cho một tập tham số thực. Các quy tắc xác định overloading nào được chọn cực kỳ phức tạp và ngày càng phức tạp hơn với mỗi phiên bản. Rất ít lập trình viên hiểu hết mọi điểm tinh tế của chúng.

Có thể sẽ có những lúc bạn cảm thấy cần vi phạm các hướng dẫn trong Item này, đặc biệt là khi phát triển tiếp các class hiện có. Ví dụ, hãy xem xét `String`, vốn đã có phương thức `contentEquals(StringBuffer)` từ Java 4. Trong Java 5, `CharSequence` được thêm vào để cung cấp một interface chung cho `StringBuffer`, `StringBuilder`, `String`, `CharBuffer`, và các kiểu tương tự khác. Cùng lúc `CharSequence` được thêm vào, `String` được trang bị thêm một overloading của phương thức `contentEquals` nhận `CharSequence`.

Mặc dù overloading thu được rõ ràng vi phạm các hướng dẫn trong Item này, nó không gây hại gì vì cả hai phương thức được overload đều làm chính xác cùng một việc khi được gọi trên cùng một tham chiếu đối tượng. Lập trình viên có thể không biết overloading nào sẽ được gọi, nhưng điều đó không quan trọng miễn là chúng hành xử giống hệt nhau. Cách chuẩn để đảm bảo hành vi này là để overloading cụ thể hơn chuyển tiếp (forward) sang overloading tổng quát hơn:

```java
// Ensuring that 2 methods have identical behavior by forwarding
public boolean contentEquals(StringBuffer sb) {
    return contentEquals((CharSequence) sb);
}
```

Mặc dù các thư viện Java phần lớn tuân theo tinh thần của lời khuyên trong Item này, có một số class vi phạm nó. Ví dụ, `String` export hai static factory method được overload, `valueOf(char[])` và `valueOf(Object)`, làm những việc hoàn toàn khác nhau khi được truyền cùng một tham chiếu đối tượng. Không có lý do chính đáng nào cho điều này, và nó nên được coi là một điểm bất thường có khả năng gây nhầm lẫn thực sự.

Tóm lại, việc bạn có thể overload phương thức không có nghĩa là bạn nên làm vậy. Nhìn chung, tốt nhất là tránh overload phương thức với nhiều chữ ký có cùng số lượng tham số. Trong một số trường hợp, đặc biệt là khi liên quan đến constructor, có thể không thể tuân theo lời khuyên này. Trong những trường hợp đó, ít nhất bạn nên tránh các tình huống mà cùng một tập tham số có thể được truyền cho các overloading khác nhau bằng cách thêm ép kiểu. Nếu không thể tránh được điều này, ví dụ vì bạn đang cải tiến một class hiện có để cài đặt một interface mới, bạn nên đảm bảo rằng tất cả các overloading hành xử giống hệt nhau khi được truyền cùng các tham số. Nếu bạn không làm được điều này, lập trình viên sẽ rất khó sử dụng hiệu quả phương thức hoặc constructor được overload, và họ sẽ không hiểu tại sao nó không hoạt động.

## Item 53: Sử dụng varargs một cách thận trọng

Các phương thức varargs, tên chính thức là phương thức *variable arity* (số lượng đối số thay đổi) [JLS, 8.4.1], chấp nhận không hoặc nhiều đối số của một kiểu xác định. Cơ chế varargs hoạt động bằng cách trước tiên tạo một mảng có kích thước bằng số đối số được truyền tại điểm gọi, sau đó đặt các giá trị đối số vào mảng, và cuối cùng truyền mảng đó cho phương thức.

Ví dụ, đây là một phương thức varargs nhận một dãy các đối số `int` và trả về tổng của chúng. Đúng như bạn mong đợi, giá trị của `sum(1, 2, 3)` là `6`, và giá trị của `sum()` là `0`:

```java
// Simple use of varargs
static int sum(int... args) {
    int sum = 0;
    for (int arg : args)
        sum += arg;
    return sum;
}
```

Đôi khi cần viết một phương thức yêu cầu *một* hoặc nhiều đối số của một kiểu nào đó, thay vì *không* hoặc nhiều. Ví dụ, giả sử bạn muốn viết một hàm tính giá trị nhỏ nhất trong các đối số của nó. Hàm này không được định nghĩa rõ ràng nếu client không truyền đối số nào. Bạn có thể kiểm tra độ dài mảng tại thời gian chạy:

```java
// The WRONG way to use varargs to pass one or more arguments!
static int min(int... args) {
    if (args.length == 0)
        throw new IllegalArgumentException("Too few arguments");
    int min = args[0];
    for (int i = 1; i < args.length; i++)
        if (args[i] < min)
            min = args[i];
    return min;
}
```

Giải pháp này có vài vấn đề. Nghiêm trọng nhất là nếu client gọi phương thức này mà không có đối số nào, nó sẽ thất bại tại thời gian chạy thay vì tại thời điểm biên dịch. Một vấn đề khác là nó xấu. Bạn phải thêm một kiểm tra tính hợp lệ tường minh trên `args`, và bạn không thể dùng vòng lặp for-each trừ khi khởi tạo `min` bằng `Integer.MAX_VALUE`, mà điều đó cũng xấu.

May mắn là có một cách tốt hơn nhiều để đạt được hiệu quả mong muốn. Hãy khai báo phương thức nhận hai tham số, một tham số thường thuộc kiểu xác định và một tham số varargs thuộc kiểu đó. Giải pháp này khắc phục mọi khiếm khuyết của giải pháp trước:

```java
// The right way to use varargs to pass one or more arguments
static int min(int firstArg, int... remainingArgs) {
    int min = firstArg;
    for (int arg : remainingArgs)
        if (arg < min)
            min = arg;
    return min;
}
```

Như bạn thấy từ ví dụ này, varargs hiệu quả trong những hoàn cảnh bạn muốn có một phương thức với số lượng đối số thay đổi. Varargs được thiết kế cho `printf`, vốn được thêm vào nền tảng cùng lúc với varargs, và cho cơ chế reflection cốt lõi (**Item 65**), vốn được cải tiến lại để dùng varargs. Cả `printf` lẫn reflection đều được hưởng lợi rất lớn từ varargs.

Hãy cẩn trọng khi dùng varargs trong những tình huống hiệu năng là then chốt. Mỗi lời gọi một phương thức varargs đều gây ra việc cấp phát và khởi tạo một mảng. Nếu bạn đã xác định bằng thực nghiệm rằng mình không thể chịu nổi chi phí này nhưng vẫn cần sự linh hoạt của varargs, có một mẫu cho phép bạn được cả hai. Giả sử bạn đã xác định rằng 95 phần trăm các lời gọi đến một phương thức có ba tham số trở xuống. Khi đó hãy khai báo năm overloading của phương thức, mỗi overloading có từ không đến ba tham số thường, và một phương thức varargs duy nhất để dùng khi số đối số vượt quá ba:

```java
public void foo() { }
public void foo(int a1) { }
public void foo(int a1, int a2) { }
public void foo(int a1, int a2, int a3) { }
public void foo(int a1, int a2, int a3, int... rest) { }
```

Giờ thì bạn biết rằng mình sẽ chỉ phải trả chi phí tạo mảng trong 5 phần trăm số lời gọi mà số tham số vượt quá ba. Giống như hầu hết các tối ưu hóa hiệu năng, kỹ thuật này thường không thích hợp, nhưng khi thích hợp, nó là một cứu cánh.

Các static factory của `EnumSet` dùng kỹ thuật này để giảm chi phí tạo enum set xuống mức tối thiểu. Điều này là thích hợp vì việc enum set cung cấp một sự thay thế có hiệu năng cạnh tranh được với bit field là điều then chốt (**Item 36**).

Tóm lại, varargs là vô giá khi bạn cần định nghĩa các phương thức với số lượng đối số thay đổi. Hãy đặt các tham số bắt buộc trước tham số varargs, và hãy ý thức về hệ quả hiệu năng của việc dùng varargs.

## Item 54: Trả về collection hoặc mảng rỗng, không trả về null

Không hiếm khi thấy những phương thức trông giống như thế này:

```java
// Returns null to indicate an empty collection. Don't do this!
private final List<Cheese> cheesesInStock = ...;

/**
 * @return a list containing all of the cheeses in the shop,
 *     or null if no cheeses are available for purchase.
 */
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? null
        : new ArrayList<>(cheesesInStock);
}
```

Không có lý do gì để xử lý đặc biệt tình huống không có phô mai nào để bán. Làm vậy đòi hỏi thêm mã ở phía client để xử lý giá trị trả về có thể là null, ví dụ:

```java
List<Cheese> cheeses = shop.getCheeses();
if (cheeses != null && cheeses.contains(Cheese.STILTON))
    System.out.println("Jolly good, just the thing.");
```

Kiểu viết vòng vo này là bắt buộc ở gần như mọi chỗ sử dụng một phương thức trả về `null` thay cho collection hoặc mảng rỗng. Nó dễ gây lỗi, vì lập trình viên viết phía client có thể quên viết mã xử lý trường hợp đặc biệt để đối phó với giá trị trả về `null`. Một lỗi như vậy có thể không bị phát hiện trong nhiều năm vì những phương thức như thế thường trả về một hoặc nhiều đối tượng. Ngoài ra, việc trả về `null` thay cho container rỗng làm phức tạp việc cài đặt phương thức trả về container đó.

Đôi khi người ta lập luận rằng giá trị trả về `null` tốt hơn collection hoặc mảng rỗng vì nó tránh được chi phí cấp phát container rỗng. Lập luận này sai ở hai điểm. Thứ nhất, không nên lo lắng về hiệu năng ở mức này trừ khi các phép đo cho thấy việc cấp phát đó thực sự góp phần gây ra vấn đề hiệu năng (**Item 67**). Thứ hai, *có thể* trả về collection và mảng rỗng mà không cần cấp phát chúng. Đây là mã điển hình để trả về một collection có thể rỗng. Thông thường, đây là tất cả những gì bạn cần:

```java
//The right way to return a possibly empty collection
public List<Cheese> getCheeses() {
    return new ArrayList<>(cheesesInStock);
}
```

Trong trường hợp hiếm hoi bạn có bằng chứng cho thấy việc cấp phát collection rỗng đang làm hại hiệu năng, bạn có thể tránh việc cấp phát bằng cách trả đi trả lại cùng một collection rỗng *immutable*, vì các đối tượng immutable có thể được chia sẻ tự do (**Item 17**). Đây là mã để làm điều đó, dùng phương thức `Collections.emptyList`. Nếu bạn trả về một set, bạn sẽ dùng `Collections.emptySet`; nếu bạn trả về một map, bạn sẽ dùng `Collections.emptyMap`. Nhưng hãy nhớ, đây là một tối ưu hóa, và nó hiếm khi cần thiết. Nếu bạn nghĩ mình cần nó, hãy đo hiệu năng trước và sau, để đảm bảo rằng nó thực sự có ích:

```java
// Optimization - avoids allocating empty collections
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? Collections.emptyList()
        : new ArrayList<>(cheesesInStock);
}
```

Tình huống với mảng giống hệt với collection. Không bao giờ trả về null thay cho mảng có độ dài 0. Thông thường, bạn chỉ cần trả về một mảng có độ dài đúng, có thể là 0. Lưu ý rằng chúng ta đang truyền một mảng độ dài 0 vào phương thức `toArray` để chỉ ra kiểu trả về mong muốn, là `Cheese[]`:

```java
//The right way to return a possibly empty array
public Cheese[] getCheeses() {
    return cheesesInStock.toArray(new Cheese[0]);
}
```

Nếu bạn tin rằng việc cấp phát mảng độ dài 0 đang làm hại hiệu năng, bạn có thể trả đi trả lại cùng một mảng độ dài 0 vì mọi mảng độ dài 0 đều là immutable:

```java
// Optimization - avoids allocating empty arrays
private static final Cheese[] EMPTY_CHEESE_ARRAY = new Cheese[0];

public Cheese[] getCheeses() {
    return cheesesInStock.toArray(EMPTY_CHEESE_ARRAY);
}
```

Trong phiên bản tối ưu, chúng ta truyền *cùng một* mảng rỗng vào mỗi lời gọi `toArray`, và mảng này sẽ được trả về từ `getCheeses` bất cứ khi nào `cheesesInStock` rỗng. *Đừng* cấp phát trước mảng truyền cho `toArray` với hy vọng cải thiện hiệu năng. Các nghiên cứu đã cho thấy điều đó phản tác dụng [Shipilëv16]:

```java
// Don’t do this - preallocating the array harms performance!
return cheesesInStock.toArray(new Cheese[cheesesInStock.size()]);
```

Tóm lại, **không bao giờ trả về** `null` **thay cho mảng hoặc collection rỗng.** Nó làm API của bạn khó dùng hơn và dễ gây lỗi hơn, và nó không có lợi thế nào về hiệu năng.

## Item 55: Trả về Optional một cách thận trọng

Trước Java 8, có hai cách tiếp cận bạn có thể chọn khi viết một phương thức không thể trả về giá trị trong một số hoàn cảnh nhất định. Hoặc bạn ném một exception, hoặc bạn trả về `null` (giả sử kiểu trả về là kiểu tham chiếu đối tượng). Không cách nào trong hai cách này là hoàn hảo. Exception nên được dành riêng cho các tình huống bất thường (**Item 69**), và việc ném exception tốn kém vì toàn bộ stack trace được ghi lại khi một exception được tạo ra. Trả về `null` không có những nhược điểm này, nhưng nó có nhược điểm riêng. Nếu một phương thức trả về `null`, client phải chứa mã xử lý trường hợp đặc biệt để đối phó với khả năng trả về null, trừ khi lập trình viên có thể *chứng minh* rằng việc trả về null là không thể xảy ra. Nếu client quên kiểm tra giá trị trả về null và cất giá trị null đó vào một cấu trúc dữ liệu nào đó, một `NullPointerException` có thể xảy ra vào một thời điểm tùy ý nào đó trong tương lai, ở một chỗ nào đó trong mã chẳng liên quan gì đến vấn đề.

Trong Java 8, có cách tiếp cận thứ ba để viết các phương thức có thể không trả về được giá trị. Class `Optional<T>` biểu diễn một container immutable có thể chứa hoặc một tham chiếu `T` khác null duy nhất hoặc không chứa gì cả. Một optional không chứa gì được gọi là *rỗng* (empty). Một giá trị được gọi là *hiện diện* (present) trong một optional không rỗng. Về bản chất, một optional là một collection immutable có thể chứa tối đa một phần tử. `Optional<T>` không cài đặt `Collection<T>`, nhưng về nguyên tắc nó có thể.

Một phương thức về mặt khái niệm trả về một `T` nhưng có thể không làm được điều đó trong một số hoàn cảnh nhất định thay vào đó có thể được khai báo trả về `Optional<T>`. Điều này cho phép phương thức trả về một kết quả rỗng để chỉ ra rằng nó không thể trả về một kết quả hợp lệ. Một phương thức trả về `Optional` linh hoạt hơn và dễ dùng hơn một phương thức ném exception, và ít gây lỗi hơn một phương thức trả về `null`.

Trong **Item 30**, chúng ta đã trình bày phương thức này để tính giá trị lớn nhất trong một collection, theo thứ tự tự nhiên của các phần tử.

```java
// Returns maximum value in collection - throws exception if empty
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

Phương thức này ném `IllegalArgumentException` nếu collection được cho là rỗng. Chúng ta đã đề cập trong **Item 30** rằng một lựa chọn tốt hơn là trả về `Optional<E>`. Đây là hình dạng của phương thức khi được sửa đổi để làm như vậy:

```java
// Returns maximum value in collection as an Optional<E>
public static <E extends Comparable<E>>
        Optional<E> max(Collection<E> c) {
    if (c.isEmpty())
        return Optional.empty();

    E result = null;
    for (E e : c)
        if (result == null || e.compareTo(result) > 0)
            result = Objects.requireNonNull(e);

    return Optional.of(result);
}
```

Như bạn thấy, việc trả về một optional rất đơn giản. Tất cả những gì bạn phải làm là tạo optional bằng static factory thích hợp. Trong chương trình này, chúng ta dùng hai static factory: `Optional.empty()` trả về một optional rỗng, và `Optional.of(value)` trả về một optional chứa giá trị khác null được cho. Truyền `null` vào `Optional.of(value)` là một lỗi lập trình. Nếu bạn làm vậy, phương thức phản ứng bằng cách ném `NullPointerException`. Phương thức `Optional.ofNullable(value)` chấp nhận một giá trị có thể là null và trả về optional rỗng nếu `null` được truyền vào. **Không bao giờ trả về giá trị null từ một phương thức trả về** `Optional`**:** nó phá hỏng toàn bộ mục đích của cơ chế này.

Nhiều thao tác kết thúc (terminal operation) trên stream trả về optional. Nếu chúng ta viết lại phương thức `max` để dùng stream, thao tác `max` của `Stream` sẽ làm việc tạo optional cho chúng ta (dù chúng ta phải truyền vào một comparator tường minh):

```java
// Returns max val in collection as Optional<E> - uses stream
public static <E extends Comparable<E>>
        Optional<E> max(Collection<E> c) {
    return c.stream().max(Comparator.naturalOrder());
}
```

Vậy làm sao bạn quyết định trả về optional thay vì trả về `null` hay ném exception? **Optional tương tự về tinh thần với checked exception** (**Item 71**), ở chỗ chúng *buộc* người dùng API phải đối mặt với thực tế là có thể không có giá trị nào được trả về. Ném unchecked exception hoặc trả về `null` cho phép người dùng bỏ qua khả năng này, với những hậu quả có thể rất nghiêm trọng. Tuy nhiên, ném checked exception đòi hỏi thêm mã boilerplate ở phía client.

Nếu một phương thức trả về optional, client được quyền chọn hành động nào cần thực hiện nếu phương thức không thể trả về giá trị. Bạn có thể chỉ định một giá trị mặc định:

```java
// Using an optional to provide a chosen default value
String lastWordInLexicon = max(words).orElse("No words...");
```

hoặc bạn có thể ném bất kỳ exception nào thích hợp. Lưu ý rằng chúng ta truyền vào một exception factory chứ không phải một exception thực sự. Điều này tránh chi phí tạo exception trừ khi nó thực sự được ném ra:

```java
// Using an optional to throw a chosen exception
Toy myToy = max(toys).orElseThrow(TemperTantrumException::new);
```

Nếu bạn có thể *chứng minh* rằng một optional không rỗng, bạn có thể lấy giá trị từ optional mà không cần chỉ định hành động cần thực hiện nếu optional rỗng, nhưng nếu bạn sai, mã của bạn sẽ ném `NoSuchElementException`:

```java
// Using optional when you know there’s a return value
Element lastNobleGas = max(Elements.NOBLE_GASES).get();
```

Đôi khi bạn có thể gặp tình huống việc lấy giá trị mặc định là tốn kém, và bạn muốn tránh chi phí đó trừ khi cần thiết. Cho những tình huống này, `Optional` cung cấp một phương thức nhận `Supplier<T>` và chỉ gọi nó khi cần thiết. Phương thức này tên là `orElseGet`, nhưng có lẽ nó nên được đặt tên là `orElseCompute` vì nó có liên hệ chặt chẽ với ba phương thức của `Map` có tên bắt đầu bằng `compute`. Có một số phương thức `Optional` để xử lý các trường hợp sử dụng chuyên biệt hơn: `filter`, `map`, `flatMap`, và `ifPresent`. Trong Java 9, thêm hai phương thức nữa được bổ sung: `or` và `ifPresentOrElse`. Nếu các phương thức cơ bản được mô tả ở trên không phù hợp với trường hợp sử dụng của bạn, hãy xem tài liệu của các phương thức nâng cao hơn này và xem chúng có làm được việc không.

Trong trường hợp không phương thức nào trong số này đáp ứng nhu cầu của bạn, `Optional` cung cấp phương thức `isPresent()`, có thể được xem như một van an toàn. Nó trả về `true` nếu optional chứa giá trị, `false` nếu nó rỗng. Bạn có thể dùng phương thức này để thực hiện bất kỳ xử lý nào bạn muốn trên một kết quả optional, nhưng hãy đảm bảo dùng nó một cách khôn ngoan. Nhiều cách dùng `isPresent` có thể được thay thế một cách có lợi bằng một trong các phương thức đã đề cập ở trên. Mã thu được thường sẽ ngắn hơn, rõ ràng hơn và đúng idiom hơn.

Ví dụ, hãy xem xét đoạn mã này, in ra ID tiến trình của tiến trình cha của một tiến trình, hoặc `N/A` nếu tiến trình không có cha. Đoạn mã dùng class `ProcessHandle`, được giới thiệu trong Java 9:

```java
Optional<ProcessHandle> parentProcess = ph.parent();
System.out.println("Parent PID: " + (parentProcess.isPresent() ?
    String.valueOf(parentProcess.get().pid()) : "N/A"));
```

Đoạn mã trên có thể được thay thế bằng đoạn này, dùng hàm `map` của `Optional`:

```java
System.out.println("Parent PID: " +
  ph.parent().map(h -> String.valueOf(h.pid())).orElse("N/A"));
```

Khi lập trình với stream, không hiếm khi bạn thấy mình có một `Stream<Optional<T>>` và cần một `Stream<T>` chứa tất cả các phần tử trong các optional không rỗng để tiếp tục. Nếu bạn đang dùng Java 8, đây là cách để bắc cầu:

```java
streamOfOptionals
    .filter(Optional::isPresent)
    .map(Optional::get)
```

Trong Java 9, `Optional` được trang bị phương thức `stream()`. Phương thức này là một adapter biến một `Optional` thành một `Stream` chứa một phần tử nếu có phần tử hiện diện trong optional, hoặc không chứa gì nếu nó rỗng. Kết hợp với phương thức `flatMap` của `Stream` (**Item 45**), phương thức này cung cấp một cách thay thế ngắn gọn cho đoạn mã trên:

```java
streamOfOptionals
    .flatMap(Optional::stream)
```

Không phải mọi kiểu trả về đều được hưởng lợi từ việc dùng optional. **Các kiểu container, bao gồm collection, map, stream, mảng, và optional không nên được bọc trong optional.** Thay vì trả về một `Optional<List<T>>` rỗng, bạn chỉ cần trả về một `List<T>` rỗng (**Item 54**). Trả về container rỗng sẽ loại bỏ nhu cầu mã client phải xử lý một optional. Class `ProcessHandle` có phương thức `arguments`, trả về `Optional<String[]>`, nhưng phương thức này nên được coi là một điểm bất thường không nên bắt chước.

Vậy khi nào bạn nên khai báo một phương thức trả về `Optional<T>` thay vì `T`? Theo quy tắc, **bạn nên khai báo một phương thức trả về** `Optional<T>` **nếu nó có thể không trả về được kết quả và client sẽ phải thực hiện xử lý đặc biệt nếu không có kết quả nào được trả về.** Dẫu vậy, trả về `Optional<T>` không phải là không có chi phí. Một `Optional` là một đối tượng phải được cấp phát và khởi tạo, và việc đọc giá trị ra khỏi optional đòi hỏi thêm một bước gián tiếp. Điều này khiến optional không thích hợp để dùng trong một số tình huống hiệu năng là then chốt. Việc một phương thức cụ thể có rơi vào loại này hay không chỉ có thể được xác định bằng đo đạc cẩn thận (**Item 67**).

Trả về một optional chứa kiểu boxed primitive là tốn kém đến mức không chấp nhận được so với trả về kiểu nguyên thủy, vì optional có hai tầng boxing thay vì không tầng nào. Do đó, các nhà thiết kế thư viện đã thấy cần cung cấp các phiên bản tương tự của `Optional<T>` cho các kiểu nguyên thủy `int`, `long`, và `double`. Các kiểu optional này là `OptionalInt`, `OptionalLong`, và `OptionalDouble`. Chúng chứa hầu hết, nhưng không phải tất cả, các phương thức của `Optional<T>`. Do đó, **bạn không bao giờ nên trả về optional của một kiểu boxed primitive,** với ngoại lệ có thể chấp nhận là các "kiểu nguyên thủy phụ", `Boolean`, `Byte`, `Character`, `Short`, và `Float`.

Đến đây, chúng ta đã thảo luận về việc trả về optional và xử lý chúng sau khi được trả về. Chúng ta chưa thảo luận các cách dùng khả dĩ khác, và đó là vì hầu hết các cách dùng optional khác đều đáng ngờ. Ví dụ, bạn không bao giờ nên dùng optional làm giá trị trong map. Nếu làm vậy, bạn có hai cách để biểu đạt sự vắng mặt về mặt logic của một khóa khỏi map: hoặc khóa có thể vắng mặt khỏi map, hoặc nó có thể hiện diện và ánh xạ đến một optional rỗng. Điều này là sự phức tạp không cần thiết với khả năng lớn gây nhầm lẫn và lỗi. Tổng quát hơn, **hầu như không bao giờ thích hợp để dùng optional làm khóa, giá trị, hoặc phần tử trong một collection hay mảng.**

Điều này để lại một câu hỏi lớn chưa được trả lời. Liệu có bao giờ thích hợp để lưu một optional trong một trường thể hiện (instance field) không? Thường thì đó là một "mùi xấu" (bad smell): nó gợi ý rằng có lẽ bạn nên có một subclass chứa các trường tùy chọn. Nhưng đôi khi điều đó có thể hợp lý. Hãy xem xét trường hợp class `NutritionFacts` của chúng ta trong **Item 2**. Một thể hiện `NutritionFacts` chứa nhiều trường không bắt buộc. Bạn không thể có một subclass cho mọi tổ hợp khả dĩ của các trường này. Ngoài ra, các trường có kiểu nguyên thủy, khiến việc biểu đạt sự vắng mặt một cách trực tiếp trở nên khó xử. API tốt nhất cho `NutritionFacts` sẽ trả về một optional từ getter của mỗi trường tùy chọn, nên việc đơn giản lưu những optional đó làm trường trong đối tượng là hoàn toàn hợp lý.

Tóm lại, nếu bạn thấy mình đang viết một phương thức không phải lúc nào cũng trả về được giá trị và bạn tin rằng điều quan trọng là người dùng phương thức phải cân nhắc khả năng này mỗi khi họ gọi nó, thì có lẽ bạn nên trả về một optional. Tuy nhiên, bạn nên ý thức rằng có những hệ quả hiệu năng thực sự gắn với việc trả về optional; với các phương thức mà hiệu năng là then chốt, có thể tốt hơn là trả về `null` hoặc ném exception. Cuối cùng, bạn hiếm khi nên dùng optional ở bất kỳ vai trò nào khác ngoài vai trò giá trị trả về.

## Item 56: Viết doc comment cho mọi phần tử API được công khai

Nếu một API muốn dùng được, nó phải có tài liệu. Theo truyền thống, tài liệu API được tạo thủ công, và việc giữ nó đồng bộ với mã là một việc nhàm chán. Môi trường lập trình Java làm nhẹ công việc này bằng tiện ích *Javadoc*. Javadoc tự động sinh tài liệu API từ mã nguồn với các *documentation comment* (chú thích tài liệu) có định dạng đặc biệt, thường được gọi là *doc comment*.

Mặc dù các quy ước về doc comment không chính thức là một phần của ngôn ngữ, chúng tạo thành một API trên thực tế (de facto) mà mọi lập trình viên Java nên biết. Các quy ước này được mô tả trong trang web *How to Write Doc Comments* [Javadoc-guide]. Dù trang này chưa được cập nhật kể từ khi Java 4 được phát hành, nó vẫn là một nguồn tài liệu vô giá. Một thẻ doc quan trọng được thêm vào Java 9, `{@index}`; một thẻ trong Java 8, `{@implSpec}`; và hai thẻ trong Java 5, `{@literal}` và `{@code}`. Các thẻ này không có trong trang web nói trên, nhưng được thảo luận trong Item này.

**Để viết tài liệu API đúng cách, bạn phải đặt một doc comment trước mọi khai báo class, interface, constructor, phương thức, và trường được export.** Nếu một class là serializable, bạn cũng nên ghi lại dạng serialized của nó (**Item 87**). Khi không có doc comment, điều tốt nhất Javadoc có thể làm là tái hiện khai báo như tài liệu duy nhất cho phần tử API liên quan. Dùng một API thiếu documentation comment thật bực bội và dễ gây lỗi. Các class public không nên dùng constructor mặc định vì không có cách nào để cung cấp doc comment cho chúng. Để viết mã dễ bảo trì, bạn cũng nên viết doc comment cho hầu hết các class, interface, constructor, phương thức, và trường không được export, dù những comment này không cần kỹ lưỡng như đối với các phần tử API được export.

**Doc comment cho một phương thức nên mô tả súc tích hợp đồng (contract) giữa phương thức và client của nó.** Ngoại trừ các phương thức trong những class được thiết kế để kế thừa (**Item 19**), hợp đồng nên nói phương thức làm *gì* chứ không phải nó làm việc đó *như thế nào*. Doc comment nên liệt kê tất cả các *tiền điều kiện* (precondition) của phương thức, tức là những điều phải đúng để client có thể gọi nó, và các *hậu điều kiện* (postcondition), tức là những điều sẽ đúng sau khi lời gọi hoàn thành thành công. Thông thường, tiền điều kiện được mô tả ngầm bởi các thẻ `@throws` cho unchecked exception; mỗi unchecked exception tương ứng với một vi phạm tiền điều kiện. Ngoài ra, tiền điều kiện có thể được chỉ định cùng với các tham số liên quan trong thẻ `@param` của chúng.

Ngoài tiền điều kiện và hậu điều kiện, phương thức nên ghi lại mọi *tác dụng phụ* (side effect). Tác dụng phụ là một thay đổi có thể quan sát được trong trạng thái của hệ thống mà không rõ ràng là cần thiết để đạt được hậu điều kiện. Ví dụ, nếu một phương thức khởi động một thread nền, tài liệu nên ghi chú điều đó.

Để mô tả đầy đủ hợp đồng của một phương thức, doc comment nên có một thẻ `@param` cho mỗi tham số, một thẻ `@return` trừ khi phương thức có kiểu trả về void, và một thẻ `@throws` cho mỗi exception mà phương thức ném ra, dù là checked hay unchecked (**Item 74**). Nếu nội dung trong thẻ `@return` sẽ giống hệt với mô tả của phương thức, việc bỏ qua nó có thể được chấp nhận, tùy vào chuẩn viết mã bạn đang tuân theo.

Theo quy ước, đoạn văn bản theo sau thẻ `@param` hoặc thẻ `@return` nên là một cụm danh từ mô tả giá trị được biểu diễn bởi tham số hoặc giá trị trả về. Hiếm khi, các biểu thức số học được dùng thay cho cụm danh từ; hãy xem `BigInteger` để có ví dụ. Đoạn văn bản theo sau thẻ `@throws` nên gồm từ "if" (nếu), theo sau là một mệnh đề mô tả các điều kiện mà exception được ném ra. Theo quy ước, cụm từ hoặc mệnh đề theo sau thẻ `@param`, `@return`, hoặc `@throws` không kết thúc bằng dấu chấm. Tất cả các quy ước này được minh họa bởi doc comment sau:

```java
/**
 * Returns the element at the specified position in this list.
 *
 * <p>This method is <i>not</i> guaranteed to run in constant
 * time. In some implementations it may run in time proportional
 * to the element position.
 *
 * @param  index index of element to return; must be
 *         non-negative and less than the size of this list
 * @return the element at the specified position in this list
 * @throws IndexOutOfBoundsException if the index is out of range
 *         ({@code index < 0 || index >= this.size()})
 */
E get(int index);
```

Hãy để ý việc dùng các thẻ HTML trong doc comment này (`<p>` và `<i>`). Tiện ích Javadoc chuyển doc comment thành HTML, và các phần tử HTML tùy ý trong doc comment sẽ xuất hiện trong tài liệu HTML được sinh ra. Đôi khi, lập trình viên còn đi xa đến mức nhúng bảng HTML vào doc comment, dù điều này hiếm.

Cũng hãy để ý việc dùng thẻ Javadoc `{@code}` bao quanh đoạn mã trong mệnh đề `@throws`. Thẻ này phục vụ hai mục đích: nó khiến đoạn mã được hiển thị bằng `code font` (phông chữ mã), và nó chặn việc xử lý markup HTML và các thẻ Javadoc lồng nhau trong đoạn mã. Tính chất thứ hai chính là điều cho phép chúng ta dùng dấu nhỏ hơn (`<`) trong đoạn mã dù nó là một siêu ký tự (metacharacter) của HTML. Để đưa một ví dụ mã nhiều dòng vào doc comment, hãy dùng thẻ Javadoc `{@code}` bọc bên trong thẻ HTML `<pre>`. Nói cách khác, đặt trước ví dụ mã các ký tự `<pre>{@code` và theo sau nó là `}</pre>`. Điều này giữ nguyên các ngắt dòng trong mã, và loại bỏ nhu cầu escape các siêu ký tự HTML, nhưng *không* loại bỏ nhu cầu escape ký tự a còng (`@`), ký tự này phải được escape nếu mã ví dụ dùng annotation.

Cuối cùng, hãy để ý việc dùng các từ "this list" (danh sách này) trong doc comment. Theo quy ước, từ "this" (này) chỉ đối tượng mà phương thức được gọi trên đó khi nó được dùng trong doc comment của một phương thức thể hiện.

Như đã đề cập trong **Item 15**, khi bạn thiết kế một class để kế thừa, bạn phải ghi lại các *mẫu tự sử dụng* (self-use pattern) của nó, để lập trình viên biết ngữ nghĩa của việc override các phương thức của nó. Các mẫu tự sử dụng này nên được ghi lại bằng thẻ `@implSpec`, được thêm vào Java 8. Hãy nhớ rằng doc comment thông thường mô tả hợp đồng giữa một phương thức và client của nó; ngược lại, các comment `@implSpec` mô tả hợp đồng giữa một phương thức và subclass của nó, cho phép subclass dựa vào hành vi cài đặt nếu chúng kế thừa phương thức hoặc gọi nó qua `super`. Đây là hình dạng của nó trong thực tế:

```java
/**
 * Returns true if this collection is empty.
 *
 * @implSpec
 * This implementation returns {@code this.size() == 0}.
 *
 * @return true if this collection is empty
 */
public boolean isEmpty() { ... }
```

Tính đến Java 9, tiện ích Javadoc vẫn bỏ qua thẻ `@implSpec` trừ khi bạn truyền tùy chọn dòng lệnh `-tag "implSpec:a:Implementation Requirements:"`. Hy vọng điều này sẽ được khắc phục trong một phiên bản tiếp theo.

Đừng quên rằng bạn phải có hành động đặc biệt để sinh tài liệu chứa các siêu ký tự HTML, chẳng hạn dấu nhỏ hơn (`<`), dấu lớn hơn (`>`), và dấu và (`&`). Cách tốt nhất để đưa những ký tự này vào tài liệu là bao quanh chúng bằng thẻ `{@literal}`, thẻ này chặn việc xử lý markup HTML và các thẻ Javadoc lồng nhau. Nó giống thẻ `{@code}`, ngoại trừ việc nó không hiển thị văn bản bằng phông chữ mã. Ví dụ, đoạn Javadoc này:

```java
* A geometric series converges if {@literal |r| < 1}.
```

sinh ra tài liệu: "A geometric series converges if |r| < 1." Thẻ `{@literal}` có thể chỉ được đặt quanh dấu nhỏ hơn thay vì toàn bộ bất đẳng thức mà vẫn cho ra tài liệu như vậy, nhưng doc comment sẽ kém dễ đọc hơn trong mã nguồn. Điều này minh họa nguyên tắc chung rằng **doc comment nên dễ đọc cả trong mã nguồn lẫn trong tài liệu được sinh ra.** Nếu bạn không thể đạt được cả hai, tính dễ đọc của tài liệu được sinh ra quan trọng hơn tính dễ đọc của mã nguồn.

"Câu" đầu tiên của mỗi doc comment (theo định nghĩa dưới đây) trở thành *mô tả tóm tắt* (summary description) của phần tử mà comment đó đề cập. Ví dụ, mô tả tóm tắt trong doc comment ở trang 255 là "Returns the element at the specified position in this list." Mô tả tóm tắt phải tự nó đứng vững để mô tả chức năng của phần tử mà nó tóm tắt. Để tránh nhầm lẫn, **không hai thành viên hoặc constructor nào trong một class hay interface được có cùng mô tả tóm tắt.** Hãy đặc biệt chú ý đến các overloading, với chúng việc dùng cùng một câu đầu tiên thường là điều tự nhiên (nhưng không chấp nhận được trong doc comment).

Hãy cẩn thận nếu mô tả tóm tắt dự định có chứa dấu chấm, vì dấu chấm có thể kết thúc mô tả sớm hơn dự kiến. Ví dụ, một doc comment bắt đầu bằng cụm "`A suspect, such as Colonel Mustard or Mrs. Peacock.`" sẽ cho ra mô tả tóm tắt "A suspect, such as Colonel Mustard or Mrs." Vấn đề là mô tả tóm tắt kết thúc ở dấu chấm đầu tiên được theo sau bởi một dấu cách, tab, hoặc ký tự kết thúc dòng (hoặc ở thẻ khối đầu tiên) [Javadoc-ref]. Ở đây, dấu chấm trong từ viết tắt "Mrs." được theo sau bởi một dấu cách. Giải pháp tốt nhất là bao quanh dấu chấm gây rắc rối và phần văn bản liên quan bằng thẻ `{@literal}`, để dấu chấm không còn được theo sau bởi dấu cách trong mã nguồn nữa:

```java
/**
 * A suspect, such as Colonel Mustard or {@literal Mrs. Peacock}.
 */
public enum Suspect { ... }
```

Nói rằng mô tả tóm tắt là *câu* đầu tiên trong doc comment thì hơi sai lệch. Quy ước quy định rằng nó hiếm khi nên là một câu hoàn chỉnh. Với phương thức và constructor, mô tả tóm tắt nên là một cụm động từ (bao gồm cả tân ngữ nếu có) mô tả hành động mà phương thức thực hiện. Ví dụ:

- `ArrayList(int initialCapacity)` —Constructs an empty list with the specified initial capacity. (Tạo một danh sách rỗng với dung lượng ban đầu được chỉ định.)

- `Collection.size()` —Returns the number of elements in this collection. (Trả về số phần tử trong collection này.)

Như các ví dụ này cho thấy, hãy dùng thì trần thuật ngôi thứ ba ("returns the number") thay vì mệnh lệnh ngôi thứ hai ("return the number").

Với class, interface, và trường, mô tả tóm tắt nên là một cụm danh từ mô tả thứ được biểu diễn bởi một thể hiện của class hay interface, hoặc bởi chính trường đó. Ví dụ:

- `Instant` —An instantaneous point on the time-line. (Một điểm tức thời trên dòng thời gian.)

- `Math.PI` —The `double` value that is closer than any other to pi, the ratio of the circumference of a circle to its diameter. (Giá trị `double` gần với số pi hơn bất kỳ giá trị nào khác, tỷ số giữa chu vi của một đường tròn và đường kính của nó.)

Trong Java 9, một chỉ mục phía client được thêm vào HTML do Javadoc sinh ra. Chỉ mục này, giúp việc điều hướng các bộ tài liệu API lớn dễ dàng hơn, có dạng một ô tìm kiếm ở góc trên bên phải của trang. Khi bạn gõ vào ô này, bạn nhận được một menu thả xuống gồm các trang khớp. Các phần tử API, như class, phương thức, và trường, được lập chỉ mục tự động. Đôi khi bạn có thể muốn lập chỉ mục thêm các thuật ngữ quan trọng đối với API của mình. Thẻ `{@index}` được thêm vào cho mục đích này. Lập chỉ mục một thuật ngữ xuất hiện trong doc comment đơn giản chỉ là bọc nó trong thẻ này, như trong đoạn sau:

```java
* This method complies with the {@index IEEE 754} standard.
```

Generics, enum, và annotation đòi hỏi sự chăm chút đặc biệt trong doc comment. **Khi viết tài liệu cho một kiểu hoặc phương thức generic, hãy đảm bảo ghi lại tất cả các type parameter:**

```java
/**
 * An object that maps keys to values.  A map cannot contain
 * duplicate keys; each key can map to at most one value.
 *
 * (Remainder omitted)
 *
 * @param <K> the type of keys maintained by this map
 * @param <V> the type of mapped values
 */
public interface Map<K, V> { ... }
```

**Khi viết tài liệu cho một kiểu enum, hãy đảm bảo ghi lại các hằng số** cũng như kiểu đó và mọi phương thức public. Lưu ý rằng bạn có thể đặt cả doc comment trên một dòng nếu nó ngắn:

```java
/**
 * An instrument section of a symphony orchestra.
 */
public enum OrchestraSection {
    /** Woodwinds, such as flute, clarinet, and oboe. */
    WOODWIND,

    /** Brass instruments, such as french horn and trumpet. */
    BRASS,

    /** Percussion instruments, such as timpani and cymbals. */
    PERCUSSION,

    /** Stringed instruments, such as violin and cello. */
    STRING;
}
```

**Khi viết tài liệu cho một kiểu annotation, hãy đảm bảo ghi lại mọi thành viên** cũng như chính kiểu đó. Hãy mô tả các thành viên bằng cụm danh từ, như thể chúng là các trường. Với mô tả tóm tắt của kiểu, hãy dùng một cụm động từ nói lên ý nghĩa của việc một phần tử chương trình có annotation thuộc kiểu này:

```java
/**
 * Indicates that the annotated method is a test method that
 * must throw the designated exception to pass.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
     /**
      * The exception that the annotated test method must throw
      * in order to pass. (The test is permitted to throw any
      * subtype of the type described by this class object.)
      */
    Class<? extends Throwable> value();
}
```

Doc comment cấp package nên được đặt trong một file có tên `package-info.java`. Ngoài các comment này, `package-info.java` phải chứa một khai báo package và có thể chứa các annotation trên khai báo này. Tương tự, nếu bạn chọn dùng hệ thống module (**Item 15**), doc comment cấp module nên được đặt trong file `module-info.java`.

Hai khía cạnh của API thường bị bỏ quên trong tài liệu là tính thread-safe và tính serializable. **Dù một class hoặc phương thức static có thread-safe hay không, bạn nên ghi lại mức độ thread-safe của nó**, như được mô tả trong **Item 82**. Nếu một class là serializable, bạn nên ghi lại dạng serialized của nó, như được mô tả trong **Item 87**.

Javadoc có khả năng "kế thừa" comment của phương thức. Nếu một phần tử API không có doc comment, Javadoc sẽ tìm doc comment cụ thể nhất áp dụng được, ưu tiên interface hơn superclass. Chi tiết về thuật toán tìm kiếm có thể xem trong *The Javadoc Reference Guide* [Javadoc-ref]. Bạn cũng có thể kế thừa *một phần* của doc comment từ các supertype bằng thẻ `{@inheritDoc}`. Điều này có nghĩa là, trong số những điều khác, các class có thể tái sử dụng doc comment từ các interface mà chúng cài đặt, thay vì sao chép những comment này. Cơ chế này có tiềm năng giảm gánh nặng bảo trì nhiều bộ doc comment gần như giống hệt nhau, nhưng nó khó dùng và có một số hạn chế. Chi tiết nằm ngoài phạm vi của cuốn sách này.

Cần bổ sung một lưu ý liên quan đến documentation comment. Mặc dù việc cung cấp documentation comment cho tất cả các phần tử API được export là cần thiết, nó không phải lúc nào cũng đủ. Với các API phức tạp gồm nhiều class liên quan lẫn nhau, thường cần bổ sung cho các documentation comment một tài liệu bên ngoài mô tả kiến trúc tổng thể của API. Nếu tài liệu như vậy tồn tại, các documentation comment của class hoặc package liên quan nên chứa một liên kết đến nó.

Javadoc tự động kiểm tra sự tuân thủ nhiều khuyến nghị trong Item này. Trong Java 7, cần có tùy chọn dòng lệnh `-Xdoclint` để có hành vi này. Trong Java 8 và 9, việc kiểm tra được bật mặc định. Các plug-in IDE như checkstyle còn đi xa hơn trong việc kiểm tra sự tuân thủ những khuyến nghị này [**Burn01**]. Bạn cũng có thể giảm khả năng có lỗi trong doc comment bằng cách chạy các file HTML do Javadoc sinh ra qua một *trình kiểm tra tính hợp lệ HTML* (HTML validity checker). Việc này sẽ phát hiện nhiều cách dùng thẻ HTML sai. Có một số trình kiểm tra như vậy có thể tải về, và bạn có thể kiểm tra HTML trực tuyến bằng dịch vụ kiểm tra markup của W3C [W3C-validator]. Khi kiểm tra HTML được sinh ra, hãy nhớ rằng tính đến Java 9, Javadoc có khả năng sinh HTML5 cũng như HTML 4.01, dù mặc định nó vẫn sinh HTML 4.01. Hãy dùng tùy chọn dòng lệnh `-html5` nếu bạn muốn Javadoc sinh HTML5.

Các quy ước được mô tả trong Item này bao quát những điều cơ bản. Dù đã mười lăm năm tuổi tại thời điểm viết cuốn sách này, hướng dẫn chuẩn mực về cách viết doc comment vẫn là *How to Write Doc Comments* [Javadoc-guide].

Nếu bạn tuân theo các hướng dẫn trong Item này, tài liệu được sinh ra sẽ cung cấp một mô tả rõ ràng về API của bạn. Tuy nhiên, cách duy nhất để biết chắc là **đọc các trang web do tiện ích Javadoc sinh ra.** Việc này đáng làm với mọi API sẽ được người khác sử dụng. Cũng như việc kiểm thử một chương trình gần như chắc chắn dẫn đến một số thay đổi trong mã, việc đọc tài liệu thường dẫn đến ít nhất vài thay đổi nhỏ trong doc comment.

Tóm lại, documentation comment là cách tốt nhất và hiệu quả nhất để viết tài liệu cho API của bạn. Việc dùng chúng nên được coi là bắt buộc với mọi phần tử API được export. Hãy chọn một phong cách nhất quán tuân theo các quy ước chuẩn. Hãy nhớ rằng HTML tùy ý được phép dùng trong documentation comment và các siêu ký tự HTML phải được escape.
