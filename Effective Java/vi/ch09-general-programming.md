# Chương 9. Lập trình tổng quát

Chương này dành cho những chi tiết cơ bản, thiết thực của ngôn ngữ. Nó bàn về biến cục bộ, cấu trúc điều khiển, thư viện, kiểu dữ liệu, và hai cơ chế nằm ngoài ngôn ngữ: *reflection* và *native method*. Cuối cùng, chương này bàn về tối ưu hóa và các quy ước đặt tên.

## Item 57: Giảm thiểu phạm vi của biến cục bộ

Item này có bản chất tương tự **Item 15**, “Giảm thiểu khả năng truy cập của class và thành viên.” Bằng cách giảm thiểu phạm vi (scope) của các biến cục bộ, bạn làm tăng tính dễ đọc và dễ bảo trì của code, đồng thời giảm khả năng xảy ra lỗi.

Các ngôn ngữ lập trình cũ hơn, chẳng hạn như C, bắt buộc biến cục bộ phải được khai báo ở đầu block, và một số lập trình viên vẫn tiếp tục làm vậy theo thói quen. Đó là một thói quen đáng để từ bỏ. Xin nhắc nhẹ rằng Java cho phép bạn khai báo biến ở bất kỳ chỗ nào mà một câu lệnh là hợp lệ (C cũng vậy, kể từ C99).

**Kỹ thuật mạnh mẽ nhất để giảm thiểu phạm vi của một biến cục bộ là khai báo nó ở nơi nó được sử dụng lần đầu tiên.** Nếu một biến được khai báo trước khi nó được sử dụng, nó chỉ là thứ gây rối—thêm một thứ nữa làm phân tán sự chú ý của người đọc đang cố gắng hiểu chương trình làm gì. Đến lúc biến được sử dụng, người đọc có thể đã không còn nhớ kiểu hay giá trị khởi tạo của biến nữa.

Khai báo một biến cục bộ quá sớm có thể khiến phạm vi của nó không chỉ bắt đầu quá sớm mà còn kết thúc quá muộn. Phạm vi của một biến cục bộ kéo dài từ điểm nó được khai báo đến cuối block bao quanh. Nếu một biến được khai báo bên ngoài block mà nó được sử dụng, nó vẫn còn hiển thị (visible) sau khi chương trình thoát khỏi block đó. Nếu một biến vô tình được sử dụng trước hoặc sau vùng sử dụng dự kiến của nó, hậu quả có thể rất tai hại.

**Gần như mọi khai báo biến cục bộ đều nên có phần khởi tạo.** Nếu bạn chưa có đủ thông tin để khởi tạo một biến một cách hợp lý, bạn nên hoãn việc khai báo cho đến khi có đủ. Một ngoại lệ cho quy tắc này liên quan đến câu lệnh `try-catch`. Nếu một biến được khởi tạo bằng một biểu thức mà việc đánh giá nó có thể ném ra checked exception, biến đó phải được khởi tạo bên trong một block `try` (trừ khi method bao quanh có thể lan truyền exception đó). Nếu giá trị phải được sử dụng bên ngoài block `try`, thì nó phải được khai báo trước block `try`, nơi mà nó chưa thể được “khởi tạo hợp lý.” Để xem ví dụ, hãy xem trang 283.

Các vòng lặp mang đến một cơ hội đặc biệt để giảm thiểu phạm vi của biến. Vòng lặp `for`, ở cả dạng truyền thống lẫn dạng for-each, cho phép bạn khai báo *biến vòng lặp* (loop variable), giới hạn phạm vi của chúng đúng vào vùng mà chúng được cần đến. (Vùng này gồm thân vòng lặp và phần code trong ngoặc đơn nằm giữa từ khóa `for` và thân vòng lặp.) Do đó, **hãy ưu tiên vòng lặp** `for` **hơn vòng lặp** `while`, với giả định rằng nội dung của biến vòng lặp không cần đến sau khi vòng lặp kết thúc.

Ví dụ, đây là idiom được ưu tiên để duyệt qua một collection (**Item 58**):

```java
// Preferred idiom for iterating over a collection or array
for (Element e : c) {
    ... // Do Something with e
}
```

Nếu bạn cần truy cập vào iterator, có lẽ để gọi method `remove` của nó, idiom được ưu tiên là dùng vòng lặp `for` truyền thống thay cho vòng lặp for-each:

```java
// Idiom for iterating when you need the iterator
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    ... // Do something with e and i
}
```

Để thấy tại sao những vòng lặp `for` này tốt hơn vòng lặp `while`, hãy xem đoạn code sau, chứa hai vòng lặp `while` và một lỗi:

```java
Iterator<Element> i = c.iterator();
while (i.hasNext()) {
    doSomething(i.next());
}
...
Iterator<Element> i2 = c2.iterator();
while (i.hasNext()) {             // BUG!
    doSomethingElse(i2.next());
}
```

Vòng lặp thứ hai chứa một lỗi sao chép-dán (copy-and-paste): nó khởi tạo một biến vòng lặp mới, `i2`, nhưng lại sử dụng biến cũ, `i`, mà không may là vẫn còn trong phạm vi. Đoạn code thu được biên dịch không lỗi và chạy mà không ném ra exception nào, nhưng nó làm sai việc. Thay vì duyệt qua `c2`, vòng lặp thứ hai kết thúc ngay lập tức, tạo ấn tượng sai lầm rằng `c2` rỗng. Vì chương trình mắc lỗi một cách âm thầm, lỗi này có thể không bị phát hiện trong một thời gian dài.

Nếu một lỗi sao chép-dán tương tự xảy ra với một trong hai dạng vòng lặp `for` (for-each hoặc truyền thống), đoạn code thu được thậm chí sẽ không biên dịch được. Biến phần tử (hoặc biến iterator) của vòng lặp thứ nhất sẽ không nằm trong phạm vi của vòng lặp thứ hai. Đây là cách nó trông như thế nào với vòng lặp `for` truyền thống:

```java
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    ... // Do something with e and i
}
...

// Compile-time error - cannot find symbol i
for (Iterator<Element> i2 = c2.iterator(); i.hasNext(); ) {
    Element e2 = i2.next();
    ... // Do something with e2 and i2
}
```

Hơn nữa, nếu bạn dùng vòng lặp `for`, khả năng bạn mắc lỗi sao chép-dán sẽ thấp hơn nhiều vì không có động cơ nào để dùng tên biến khác nhau trong hai vòng lặp. Hai vòng lặp hoàn toàn độc lập, nên việc dùng lại tên biến phần tử (hoặc iterator) không gây hại gì. Thực tế, làm vậy thường còn được xem là có phong cách.

Vòng lặp `for` còn có thêm một lợi thế nữa so với vòng lặp `while`: nó ngắn hơn, giúp tăng tính dễ đọc.

Đây là một idiom vòng lặp khác giúp giảm thiểu phạm vi của biến cục bộ:

```java
for (int i = 0, n = expensiveComputation(); i < n; i++) {
    ... // Do something with i;
}
```

Điều quan trọng cần lưu ý về idiom này là nó có *hai* biến vòng lặp, `i` và `n`, cả hai đều có phạm vi chính xác như cần thiết. Biến thứ hai, `n`, được dùng để lưu giới hạn của biến thứ nhất, nhờ đó tránh được chi phí của một phép tính dư thừa trong mỗi lần lặp. Theo quy tắc chung, bạn nên dùng idiom này nếu điều kiện kiểm tra của vòng lặp có chứa một lời gọi method được đảm bảo trả về cùng một kết quả ở mỗi lần lặp.

Kỹ thuật cuối cùng để giảm thiểu phạm vi của biến cục bộ là **giữ cho các method nhỏ và tập trung.** Nếu bạn gộp hai hoạt động vào cùng một method, các biến cục bộ liên quan đến hoạt động này có thể nằm trong phạm vi của đoạn code thực hiện hoạt động kia. Để ngăn điều này xảy ra, chỉ cần tách method thành hai: mỗi method cho một hoạt động.

## Item 58: Ưu tiên vòng lặp for-each hơn vòng lặp `for` truyền thống

Như đã thảo luận trong **Item 45**, một số tác vụ được thực hiện tốt nhất bằng stream, số khác bằng vòng lặp. Đây là một vòng lặp `for` truyền thống để duyệt qua một collection:

```java
// Not the best way to iterate over a collection!
for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
    Element e = i.next();
    ... // Do something with e
}
```

và đây là một vòng lặp `for` truyền thống để duyệt qua một mảng:

```java
// Not the best way to iterate over an array!
for (int i = 0; i < a.length; i++) {
    ... // Do something with a[i]
}
```

Những idiom này tốt hơn vòng lặp `while` (**Item 57**), nhưng chúng chưa hoàn hảo. Biến iterator và biến chỉ số đều chỉ là thứ gây rối—tất cả những gì bạn cần là các phần tử. Hơn nữa, chúng là những cơ hội để phát sinh lỗi. Iterator xuất hiện ba lần trong mỗi vòng lặp và biến chỉ số xuất hiện bốn lần, điều này cho bạn nhiều cơ hội dùng nhầm biến. Nếu bạn dùng nhầm, không có gì đảm bảo trình biên dịch sẽ bắt được vấn đề. Cuối cùng, hai vòng lặp này khá khác nhau, thu hút sự chú ý không cần thiết vào kiểu của container và gây thêm chút phiền phức (nhỏ) khi muốn thay đổi kiểu đó.

Vòng lặp for-each (tên chính thức là “enhanced `for` statement”) giải quyết tất cả những vấn đề này. Nó loại bỏ sự rối rắm và cơ hội phát sinh lỗi bằng cách ẩn đi biến iterator hoặc biến chỉ số. Idiom thu được áp dụng như nhau cho cả collection lẫn mảng, giúp việc chuyển kiểu cài đặt của một container từ dạng này sang dạng kia trở nên dễ dàng:

```java
// The preferred idiom for iterating over collections and arrays
for (Element e : elements) {
    ... // Do something with e
}
```

Khi bạn thấy dấu hai chấm (`:`), hãy đọc nó là “in” (trong). Do đó, vòng lặp trên đọc là “for each element *e* in *elements*” (với mỗi phần tử *e* trong *elements*). Không có tổn thất hiệu năng nào khi dùng vòng lặp for-each, kể cả với mảng: code mà chúng sinh ra về cơ bản giống hệt code bạn sẽ viết bằng tay.

Lợi thế của vòng lặp for-each so với vòng lặp `for` truyền thống còn lớn hơn nữa khi nói đến lặp lồng nhau. Đây là một lỗi phổ biến mà người ta mắc phải khi thực hiện lặp lồng nhau:

```java
// Can you spot the bug?
enum Suit { CLUB, DIAMOND, HEART, SPADE }
enum Rank { ACE, DEUCE, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT,
            NINE, TEN, JACK, QUEEN, KING }
...
static Collection<Suit> suits = Arrays.asList(Suit.values());
static Collection<Rank> ranks = Arrays.asList(Rank.values());

List<Card> deck = new ArrayList<>();
for (Iterator<Suit> i = suits.iterator(); i.hasNext(); )
    for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); )
        deck.add(new Card(i.next(), j.next()));
```

Đừng buồn nếu bạn không phát hiện ra lỗi. Nhiều lập trình viên chuyên gia cũng đã từng mắc lỗi này vào lúc này hay lúc khác. Vấn đề là method `next` được gọi quá nhiều lần trên iterator của collection bên ngoài (`suits`). Nó đáng lẽ phải được gọi từ vòng lặp ngoài để mỗi suit chỉ được gọi một lần, nhưng thay vào đó nó lại được gọi từ vòng lặp trong, nên nó được gọi một lần cho mỗi lá bài. Sau khi hết suit, vòng lặp ném ra `NoSuchElementException`.

Nếu bạn thực sự không may và kích thước của collection bên ngoài là bội số của kích thước collection bên trong—có lẽ vì chúng là cùng một collection—vòng lặp sẽ kết thúc bình thường, nhưng nó sẽ không làm điều bạn muốn. Ví dụ, hãy xem nỗ lực thiếu cân nhắc này nhằm in ra tất cả các kết quả có thể của việc gieo một cặp xúc xắc:

```java
// Same bug, different symptom!
enum Face { ONE, TWO, THREE, FOUR, FIVE, SIX }
...
Collection<Face> faces = EnumSet.allOf(Face.class);

for (Iterator<Face> i = faces.iterator(); i.hasNext(); )
    for (Iterator<Face> j = faces.iterator(); j.hasNext(); )
        System.out.println(i.next() + " " + j.next());
```

Chương trình không ném ra exception, nhưng nó chỉ in ra sáu cặp “đôi” (từ “ `ONE ONE` ” đến “ `SIX SIX` ”), thay vì ba mươi sáu tổ hợp như mong đợi.

Để sửa lỗi trong các ví dụ này, bạn phải thêm một biến trong phạm vi của vòng lặp ngoài để giữ phần tử bên ngoài:

```java
// Fixed, but ugly - you can do better!
for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
    Suit suit = i.next();
    for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); )
        deck.add(new Card(suit, j.next()));
}
```

Nếu thay vào đó bạn dùng vòng lặp for-each lồng nhau, vấn đề đơn giản là biến mất. Code thu được ngắn gọn đến mức bạn không thể mong gì hơn:

```java
// Preferred idiom for nested iteration on collections and arrays
for (Suit suit : suits)
    for (Rank rank : ranks)
        deck.add(new Card(suit, rank));
```

Đáng tiếc, có ba tình huống phổ biến mà bạn *không thể* dùng for-each:

- **Lọc phá hủy (Destructive filtering)**—Nếu bạn cần duyệt qua một collection và xóa bỏ những phần tử được chọn, thì bạn cần dùng một iterator tường minh để có thể gọi method `remove` của nó. Bạn thường có thể tránh việc duyệt tường minh bằng cách dùng method `removeIf` của `Collection`, được thêm vào trong Java 8.

- **Biến đổi (Transforming)**—Nếu bạn cần duyệt qua một list hoặc mảng và thay thế một số hoặc tất cả giá trị của các phần tử, thì bạn cần list iterator hoặc chỉ số mảng để thay thế giá trị của một phần tử.

- **Lặp song song (Parallel iteration)**—Nếu bạn cần duyệt qua nhiều collection song song, thì bạn cần kiểm soát tường minh biến iterator hoặc biến chỉ số để tất cả các iterator hoặc biến chỉ số có thể được tiến lên đồng bộ với nhau (như đã được minh họa một cách ngoài ý muốn trong các ví dụ lỗi về bài và xúc xắc ở trên).

Nếu bạn rơi vào bất kỳ tình huống nào trong số này, hãy dùng vòng lặp `for` thông thường và cảnh giác với những cái bẫy đã đề cập trong item này.

Vòng lặp for-each không chỉ cho phép bạn duyệt qua collection và mảng, nó còn cho phép bạn duyệt qua bất kỳ đối tượng nào cài đặt interface `Iterable`, vốn chỉ gồm một method duy nhất. Đây là hình dạng của interface đó:

```java
public interface Iterable<E> {
    // Returns an iterator over the elements in this iterable
    Iterator<E> iterator();
}
```

Việc cài đặt `Iterable` hơi phức tạp một chút nếu bạn phải tự viết cài đặt `Iterator` của riêng mình từ đầu, nhưng nếu bạn đang viết một kiểu đại diện cho một nhóm phần tử, bạn nên cân nhắc nghiêm túc việc cho nó cài đặt `Iterable`, ngay cả khi bạn chọn không cho nó cài đặt `Collection`. Điều này sẽ cho phép người dùng của bạn duyệt qua kiểu của bạn bằng vòng lặp for-each, và họ sẽ mãi mãi biết ơn bạn.

Tóm lại, vòng lặp for-each mang đến những lợi thế thuyết phục so với vòng lặp `for` truyền thống về độ rõ ràng, tính linh hoạt và khả năng phòng ngừa lỗi, mà không hề tổn thất hiệu năng. Hãy dùng vòng lặp for-each thay cho vòng lặp `for` ở bất cứ đâu bạn có thể.

## Item 59: Biết và sử dụng các thư viện

Giả sử bạn muốn sinh các số nguyên ngẫu nhiên nằm giữa không và một giới hạn trên nào đó. Đối mặt với tác vụ phổ biến này, nhiều lập trình viên sẽ viết một method nhỏ trông đại loại như thế này:

```java
// Common but deeply flawed!
static Random rnd = new Random();

static int random(int n) {
    return Math.abs(rnd.nextInt()) % n;
}
```

Method này trông có vẻ ổn, nhưng nó có ba khiếm khuyết. Thứ nhất là nếu `n` là một lũy thừa nhỏ của hai, dãy số ngẫu nhiên sẽ tự lặp lại sau một chu kỳ khá ngắn. Khiếm khuyết thứ hai là nếu `n` không phải là lũy thừa của hai, một số con số, tính trung bình, sẽ được trả về thường xuyên hơn những con số khác. Nếu `n` lớn, hiệu ứng này có thể khá rõ rệt. Điều này được minh họa một cách thuyết phục bởi chương trình sau, sinh ra một triệu số ngẫu nhiên trong một khoảng được chọn cẩn thận rồi in ra có bao nhiêu số rơi vào nửa dưới của khoảng đó:

```java
public static void main(String[] args) {
    int n = 2 * (Integer.MAX_VALUE / 3);
    int low = 0;
    for (int i = 0; i < 1000000; i++)
        if (random(n) < n/2)
            low++;
    System.out.println(low);
}
```

Nếu method `random` hoạt động đúng, chương trình sẽ in ra một con số gần nửa triệu, nhưng nếu bạn chạy nó, bạn sẽ thấy nó in ra một con số gần 666.666. Hai phần ba số được sinh bởi method `random` rơi vào nửa dưới của khoảng của nó!

Khiếm khuyết thứ ba của method `random` là trong những dịp hiếm hoi, nó có thể thất bại thảm hại, trả về một số nằm ngoài khoảng đã chỉ định. Sở dĩ như vậy là vì method này cố gắng ánh xạ giá trị được trả về bởi `rnd.nextInt()` sang một `int` không âm bằng cách gọi `Math.abs`. Nếu `nextInt()` trả về `Integer.MIN_VALUE`, `Math.abs` cũng sẽ trả về `Integer.MIN_VALUE`, và toán tử lấy phần dư (`%`) sẽ trả về một số âm, với giả định `n` không phải là lũy thừa của hai. Điều này gần như chắc chắn sẽ khiến chương trình của bạn thất bại, và lỗi này có thể khó tái hiện.

Để viết một phiên bản của method `random` khắc phục được những khiếm khuyết này, bạn sẽ phải biết kha khá về bộ sinh số giả ngẫu nhiên (pseudorandom number generator), lý thuyết số, và số học bù hai (two’s complement arithmetic). May mắn là bạn không phải làm điều này—nó đã được làm sẵn cho bạn. Nó được gọi là `Random.nextInt(int)`. Bạn không cần bận tâm về chi tiết cách nó thực hiện công việc (mặc dù bạn có thể nghiên cứu tài liệu hoặc mã nguồn nếu tò mò). Một kỹ sư cao cấp có nền tảng về thuật toán đã dành rất nhiều thời gian để thiết kế, cài đặt và kiểm thử method này rồi đưa cho nhiều chuyên gia trong lĩnh vực xem để đảm bảo nó đúng. Sau đó thư viện được kiểm thử beta, phát hành, và được hàng triệu lập trình viên sử dụng rộng rãi trong gần hai thập kỷ. Chưa có khiếm khuyết nào được tìm thấy trong method này, nhưng nếu một khiếm khuyết được phát hiện, nó sẽ được sửa trong bản phát hành tiếp theo. **Bằng cách sử dụng một thư viện chuẩn, bạn tận dụng được kiến thức của các chuyên gia đã viết nó và kinh nghiệm của những người đã dùng nó trước bạn.**

Kể từ Java 7, bạn không nên dùng `Random` nữa. Với hầu hết mục đích sử dụng, **bộ sinh số ngẫu nhiên nên chọn bây giờ là** `ThreadLocalRandom` **.** Nó sinh ra các số ngẫu nhiên có chất lượng cao hơn, và nó rất nhanh. Trên máy của tôi, nó nhanh hơn `Random` 3,6 lần. Với fork join pool và parallel stream, hãy dùng `SplittableRandom`.

Lợi thế thứ hai của việc dùng thư viện là bạn không phải lãng phí thời gian viết các giải pháp tạm bợ (ad hoc) cho những vấn đề chỉ liên quan xa xôi đến công việc của bạn. Nếu bạn giống hầu hết các lập trình viên, bạn thà dành thời gian làm việc với ứng dụng của mình hơn là với phần “ống nước” bên dưới.

Lợi thế thứ ba của việc dùng thư viện chuẩn là hiệu năng của chúng có xu hướng cải thiện theo thời gian, mà bạn không phải bỏ chút công sức nào. Vì nhiều người sử dụng chúng và vì chúng được dùng trong các benchmark chuẩn của ngành, các tổ chức cung cấp những thư viện này có động lực mạnh mẽ để làm cho chúng chạy nhanh hơn. Nhiều thư viện của nền tảng Java đã được viết lại qua các năm, đôi khi viết lại nhiều lần, dẫn đến những cải thiện hiệu năng đáng kể.

Lợi thế thứ tư của việc dùng thư viện là chúng có xu hướng được bổ sung thêm chức năng theo thời gian. Nếu một thư viện thiếu thứ gì đó, cộng đồng nhà phát triển sẽ lên tiếng, và chức năng còn thiếu có thể được thêm vào trong một bản phát hành sau.

Lợi thế cuối cùng của việc dùng thư viện chuẩn là bạn đặt code của mình vào dòng chính thống. Code như vậy dễ đọc, dễ bảo trì và dễ tái sử dụng hơn đối với đông đảo nhà phát triển.

Với tất cả những lợi thế này, có vẻ như chỉ hợp lý khi dùng các tiện ích của thư viện thay cho những cài đặt tạm bợ, thế nhưng nhiều lập trình viên lại không làm vậy. Tại sao? Có lẽ họ không biết những tiện ích đó của thư viện tồn tại. **Rất nhiều tính năng được thêm vào các thư viện trong mỗi bản phát hành lớn, và việc theo kịp những bổ sung này là rất đáng giá.** Mỗi khi có một bản phát hành lớn của nền tảng Java, một trang web được xuất bản mô tả các tính năng mới của nó. Những trang này rất đáng đọc [Java8-feat, Java9-feat]. Để củng cố điểm này, giả sử bạn muốn viết một chương trình in ra nội dung của một URL được chỉ định trên dòng lệnh (đại khái là những gì lệnh `curl` trên Linux làm). Trước Java 9, đoạn code này hơi dài dòng, nhưng trong Java 9 method `transferTo` đã được thêm vào `InputStream`. Đây là một chương trình hoàn chỉnh thực hiện tác vụ này bằng method mới đó:

```java
// Printing the contents of a URL with transferTo, added in Java 9
public static void main(String[] args) throws IOException {
    try (InputStream in = new URL(args[0]).openStream()) {
        in.transferTo(System.out);
    }
}
```

Các thư viện quá lớn để nghiên cứu toàn bộ tài liệu [**Java9-api**], nhưng **mọi lập trình viên nên quen thuộc với những điều cơ bản của** `java.lang` **,** `java.util` **, và** `java.io` **, cùng các subpackage của chúng.** Kiến thức về các thư viện khác có thể được tích lũy khi cần. Việc tóm tắt các tiện ích trong các thư viện, vốn đã phát triển đồ sộ qua các năm, nằm ngoài phạm vi của item này.

Một vài thư viện đáng được nhắc đến đặc biệt. Collections framework và thư viện stream (**Item 45**–**48**) nên là một phần trong bộ công cụ cơ bản của mọi lập trình viên, cũng như một số phần của các tiện ích concurrency trong `java.util.concurrent`. Package này chứa cả những tiện ích cấp cao để đơn giản hóa việc lập trình đa luồng lẫn những primitive cấp thấp cho phép các chuyên gia viết những trừu tượng concurrency cấp cao hơn của riêng họ. Các phần cấp cao của `java.util.concurrent` được thảo luận trong Item 80 và 81.

Thỉnh thoảng, một tiện ích của thư viện có thể không đáp ứng được nhu cầu của bạn. Nhu cầu của bạn càng chuyên biệt, điều này càng dễ xảy ra. Mặc dù phản xạ đầu tiên của bạn nên là dùng thư viện, nếu bạn đã xem những gì chúng cung cấp trong một lĩnh vực nào đó và nó không đáp ứng nhu cầu của bạn, thì hãy dùng một cài đặt thay thế. Sẽ luôn có những lỗ hổng trong chức năng được cung cấp bởi bất kỳ tập hữu hạn thư viện nào. Nếu bạn không tìm thấy thứ mình cần trong các thư viện của nền tảng Java, lựa chọn tiếp theo của bạn nên là tìm trong các thư viện bên thứ ba chất lượng cao, chẳng hạn như thư viện mã nguồn mở Guava xuất sắc của Google [**Guava**]. Nếu bạn không tìm thấy chức năng mình cần trong bất kỳ thư viện phù hợp nào, bạn có thể không còn lựa chọn nào khác ngoài việc tự cài đặt nó.

Tóm lại, đừng phát minh lại bánh xe. Nếu bạn cần làm điều gì đó có vẻ như hẳn phải khá phổ biến, có thể đã có sẵn một tiện ích trong thư viện làm điều bạn muốn. Nếu có, hãy dùng nó; nếu bạn không biết, hãy kiểm tra. Nói chung, code thư viện có khả năng tốt hơn code bạn tự viết và có khả năng được cải thiện theo thời gian. Điều này không phản ánh gì về khả năng lập trình của bạn. Lợi thế kinh tế theo quy mô quyết định rằng code thư viện nhận được sự chú ý nhiều hơn rất nhiều so với mức mà hầu hết nhà phát triển có thể dành cho cùng một chức năng.

## Item 60: Tránh `float` và `double` nếu cần kết quả chính xác

Các kiểu `float` và `double` được thiết kế chủ yếu cho các phép tính khoa học và kỹ thuật. Chúng thực hiện *số học dấu phẩy động nhị phân* (binary floating-point arithmetic), vốn được thiết kế cẩn thận để cung cấp nhanh chóng các xấp xỉ chính xác trên một dải độ lớn rộng. Tuy nhiên, chúng không cung cấp kết quả chính xác tuyệt đối và không nên được dùng ở những nơi yêu cầu kết quả chính xác. **Các kiểu** `float` **và** `double` **đặc biệt không phù hợp cho các phép tính tiền tệ** bởi vì không thể biểu diễn chính xác 0,1 (hay bất kỳ lũy thừa âm nào khác của mười) dưới dạng `float` hoặc `double`.

Ví dụ, giả sử bạn có $1,03 trong túi, và bạn tiêu 42¢. Bạn còn lại bao nhiêu tiền? Đây là một đoạn chương trình ngây thơ cố gắng trả lời câu hỏi này:

```java
System.out.println(1.03 - 0.42);
```

Đáng tiếc, nó in ra `0.6100000000000001`. Đây không phải là trường hợp cá biệt. Giả sử bạn có một đô la trong túi, và bạn mua chín cái vòng đệm giá mười xu mỗi cái. Bạn nhận lại bao nhiêu tiền thừa?

```java
System.out.println(1.00 - 9 * 0.10);
```

Theo đoạn chương trình này, bạn nhận được $ `0.09999999999999998`.

Bạn có thể nghĩ rằng vấn đề có thể được giải quyết chỉ bằng cách làm tròn kết quả trước khi in, nhưng đáng tiếc là cách này không phải lúc nào cũng hiệu quả. Ví dụ, giả sử bạn có một đô la trong túi, và bạn thấy một kệ có một hàng kẹo ngon với giá 10¢, 20¢, 30¢, và cứ thế, lên đến một đô la. Bạn mua mỗi loại kẹo một cái, bắt đầu từ cái giá 10¢, cho đến khi bạn không đủ tiền mua cái kẹo tiếp theo trên kệ. Bạn mua được bao nhiêu cái kẹo, và bạn nhận lại bao nhiêu tiền thừa? Đây là một chương trình ngây thơ được thiết kế để giải bài toán này:

```java
// Broken - uses floating point for monetary calculation!
public static void main(String[] args) {
    double funds = 1.00;
    int itemsBought = 0;
    for (double price = 0.10; funds >= price; price += 0.10) {
        funds -= price;
        itemsBought++;
    }
    System.out.println(itemsBought + " items bought.");
    System.out.println("Change: $" + funds);
}
```

Nếu bạn chạy chương trình, bạn sẽ thấy rằng bạn đủ tiền mua ba cái kẹo, và bạn còn lại `$0.3999999999999999`. Đây là câu trả lời sai! Cách đúng để giải bài toán này là **dùng** `BigDecimal` **,** `int` **, hoặc** `long` **cho các phép tính tiền tệ**.

Đây là một chuyển đổi trực tiếp của chương trình trước để dùng kiểu `BigDecimal` thay cho `double`. Lưu ý rằng constructor nhận `String` của `BigDecimal` được sử dụng thay vì constructor nhận `double`. Điều này là bắt buộc để tránh đưa các giá trị không chính xác vào phép tính [Bloch05, Puzzle 2]:

```java
public static void main(String[] args) {
    final BigDecimal TEN_CENTS = new BigDecimal(".10");
    int itemsBought = 0;
    BigDecimal funds = new BigDecimal("1.00");
    for (BigDecimal price = TEN_CENTS;
            funds.compareTo(price) >= 0;
            price = price.add(TEN_CENTS)) {
        funds = funds.subtract(price);
        itemsBought++;
    }
    System.out.println(itemsBought + " items bought.");
    System.out.println("Money left over: $" + funds);
}
```

Nếu bạn chạy chương trình đã sửa, bạn sẽ thấy rằng bạn đủ tiền mua bốn cái kẹo, và còn lại `$0.00`. Đây là câu trả lời đúng.

Tuy nhiên, có hai nhược điểm khi dùng `BigDecimal`: nó kém tiện lợi hơn nhiều so với dùng một kiểu số học nguyên thủy (primitive), và nó chậm hơn nhiều. Nhược điểm thứ hai không đáng kể nếu bạn đang giải một bài toán ngắn đơn lẻ, nhưng nhược điểm thứ nhất có thể làm bạn khó chịu.

Một lựa chọn thay thế cho việc dùng `BigDecimal` là dùng `int` hoặc `long`, tùy vào độ lớn của các khoản tiền liên quan, và tự mình theo dõi vị trí dấu thập phân. Trong ví dụ này, cách tiếp cận hiển nhiên là thực hiện mọi phép tính bằng xu thay vì đô la. Đây là một chuyển đổi trực tiếp theo cách tiếp cận này:

```java
public static void main(String[] args) {
    int itemsBought = 0;
    int funds = 100;
    for (int price = 10; funds >= price; price += 10) {
        funds -= price;
        itemsBought++;
    }
    System.out.println(itemsBought + " items bought.");
    System.out.println("Cash left over: " + funds + " cents");
}
```

Tóm lại, đừng dùng `float` hoặc `double` cho bất kỳ phép tính nào yêu cầu câu trả lời chính xác. Hãy dùng `BigDecimal` nếu bạn muốn hệ thống theo dõi dấu thập phân và bạn không ngại sự bất tiện cùng chi phí của việc không dùng kiểu nguyên thủy. Dùng `BigDecimal` còn có thêm lợi thế là nó cho bạn toàn quyền kiểm soát việc làm tròn, cho phép bạn chọn từ tám chế độ làm tròn mỗi khi một phép toán có kéo theo làm tròn được thực hiện. Điều này rất hữu ích nếu bạn đang thực hiện các phép tính nghiệp vụ với hành vi làm tròn do pháp luật quy định. Nếu hiệu năng là thiết yếu, bạn không ngại tự theo dõi dấu thập phân, và các đại lượng không quá lớn, hãy dùng `int` hoặc `long`. Nếu các đại lượng không vượt quá chín chữ số thập phân, bạn có thể dùng `int`; nếu chúng không vượt quá mười tám chữ số, bạn có thể dùng `long`. Nếu các đại lượng có thể vượt quá mười tám chữ số, hãy dùng `BigDecimal`.

## Item 61: Ưu tiên kiểu nguyên thủy hơn boxed primitive

Java có một hệ thống kiểu gồm hai phần, bao gồm các *kiểu nguyên thủy* (primitive), chẳng hạn như `int`, `double`, và `boolean`, và các *kiểu tham chiếu* (reference type), chẳng hạn như `String` và `List`. Mỗi kiểu nguyên thủy có một kiểu tham chiếu tương ứng, gọi là *boxed primitive*. Các boxed primitive tương ứng với `int`, `double`, và `boolean` là `Integer`, `Double`, và `Boolean`.

Như đã đề cập trong **Item 6**, autoboxing và auto-unboxing làm mờ đi nhưng không xóa bỏ sự khác biệt giữa kiểu nguyên thủy và kiểu boxed primitive. Có những khác biệt thực sự giữa hai loại này, và điều quan trọng là bạn luôn ý thức được mình đang dùng loại nào và lựa chọn cẩn thận giữa chúng.

Có ba khác biệt lớn giữa kiểu nguyên thủy và boxed primitive. Thứ nhất, kiểu nguyên thủy chỉ có giá trị của chúng, trong khi boxed primitive có định danh (identity) tách biệt với giá trị của chúng. Nói cách khác, hai instance boxed primitive có thể có cùng giá trị nhưng khác định danh. Thứ hai, kiểu nguyên thủy chỉ có những giá trị hoàn toàn có chức năng, trong khi mỗi kiểu boxed primitive có một giá trị phi chức năng, đó là `null`, bên cạnh tất cả các giá trị có chức năng của kiểu nguyên thủy tương ứng. Cuối cùng, kiểu nguyên thủy hiệu quả hơn boxed primitive về cả thời gian lẫn không gian. Cả ba khác biệt này đều có thể đưa bạn vào rắc rối thực sự nếu bạn không cẩn thận.

Hãy xem comparator sau, được thiết kế để biểu diễn thứ tự số tăng dần trên các giá trị `Integer`. (Nhớ lại rằng method `compare` của một comparator trả về một số âm, bằng không, hoặc dương, tùy theo đối số thứ nhất nhỏ hơn, bằng, hay lớn hơn đối số thứ hai.) Trong thực tế bạn sẽ không cần viết comparator này vì nó cài đặt thứ tự tự nhiên trên `Integer`, nhưng nó là một ví dụ thú vị:

```java
// Broken comparator - can you spot the flaw?
Comparator<Integer> naturalOrder =
    (i, j) -> (i < j) ? -1 : (i == j ? 0 : 1);
```

Comparator này trông có vẻ như phải hoạt động đúng, và nó sẽ vượt qua nhiều bài kiểm thử. Ví dụ, nó có thể được dùng với `Collections.sort` để sắp xếp đúng một list một triệu phần tử, dù list đó có chứa phần tử trùng lặp hay không. Nhưng comparator này có khiếm khuyết nghiêm trọng. Để tự thuyết phục mình về điều này, chỉ cần in ra giá trị của `naturalOrder.compare(new Integer(42), new Integer(42))`. Cả hai instance `Integer` đều biểu diễn cùng một giá trị (42), nên giá trị của biểu thức này đáng lẽ phải là 0, nhưng nó lại là 1, cho thấy giá trị `Integer` thứ nhất lớn hơn giá trị thứ hai!

Vậy vấn đề là gì? Phép kiểm tra đầu tiên trong `naturalOrder` hoạt động tốt. Việc đánh giá biểu thức `i < j` khiến các instance `Integer` được tham chiếu bởi `i` và `j` bị *auto-unboxed*; nghĩa là, nó trích xuất các giá trị nguyên thủy của chúng. Việc đánh giá tiếp tục kiểm tra xem giá trị `int` thứ nhất thu được có nhỏ hơn giá trị thứ hai không. Nhưng giả sử là không. Khi đó phép kiểm tra tiếp theo đánh giá biểu thức `i==j`, thực hiện một *phép so sánh định danh* (identity comparison) trên hai tham chiếu đối tượng. Nếu `i` và `j` tham chiếu đến hai instance `Integer` khác nhau nhưng biểu diễn cùng một giá trị `int`, phép so sánh này sẽ trả về `false`, và comparator sẽ trả về 1 một cách sai lầm, cho thấy giá trị `Integer` thứ nhất lớn hơn giá trị thứ hai. **Áp dụng toán tử** `==` **lên các boxed primitive hầu như luôn luôn là sai.**

Trong thực tế, nếu bạn cần một comparator để mô tả thứ tự tự nhiên của một kiểu, bạn chỉ cần gọi `Comparator.naturalOrder()`, và nếu bạn tự viết comparator, bạn nên dùng các method xây dựng comparator, hoặc các method static compare trên các kiểu nguyên thủy (**Item 14**). Dù vậy, bạn có thể sửa vấn đề trong comparator bị lỗi bằng cách thêm hai biến cục bộ để lưu các giá trị `int` nguyên thủy tương ứng với các tham số `Integer` đã boxed, và thực hiện tất cả các phép so sánh trên những biến này. Cách này tránh được phép so sánh định danh sai lầm:

```java
Comparator<Integer> naturalOrder = (iBoxed, jBoxed) -> {
    int i = iBoxed, j = jBoxed; // Auto-unboxing
    return i < j ? -1 : (i == j ? 0 : 1);
};
```

Tiếp theo, hãy xem chương trình nhỏ thú vị này:

```java
public class Unbelievable {
    static Integer i;

    public static void main(String[] args) {
        if (i == 42)
            System.out.println("Unbelievable");
    }
}
```

Không, nó không in ra `Unbelievable` —nhưng điều nó làm cũng gần kỳ lạ như vậy. Nó ném ra `NullPointerException` khi đánh giá biểu thức `i==42`. Vấn đề là `i` là một `Integer`, không phải `int`, và giống như mọi trường tham chiếu đối tượng không phải hằng số, giá trị khởi tạo của nó là `null`. Khi chương trình đánh giá biểu thức `i==42`, nó đang so sánh một `Integer` với một `int`. Trong gần như mọi trường hợp, **khi bạn trộn lẫn kiểu nguyên thủy và boxed primitive trong một phép toán, boxed primitive sẽ bị auto-unboxed.** Nếu một tham chiếu đối tượng null bị auto-unboxed, bạn nhận được `NullPointerException`. Như chương trình này minh họa, điều đó có thể xảy ra ở hầu như bất cứ đâu. Sửa vấn đề này đơn giản chỉ là khai báo `i` là `int` thay vì `Integer`.

Cuối cùng, hãy xem chương trình ở trang 24 trong **Item 6**:

```java
// Hideously slow program! Can you spot the object creation?
public static void main(String[] args) {
    Long sum = 0L;
    for (long i = 0; i < Integer.MAX_VALUE; i++) {
        sum += i;
    }
    System.out.println(sum);
}
```

Chương trình này chậm hơn nhiều so với mức đáng lẽ phải có vì nó vô tình khai báo một biến cục bộ (`sum`) thuộc kiểu boxed primitive `Long` thay vì kiểu nguyên thủy `long`. Chương trình biên dịch mà không có lỗi hay cảnh báo, và biến này bị boxed và unboxed lặp đi lặp lại, gây ra sự suy giảm hiệu năng quan sát được.

Trong cả ba chương trình được thảo luận trong item này, vấn đề đều giống nhau: lập trình viên đã bỏ qua sự khác biệt giữa kiểu nguyên thủy và boxed primitive rồi gánh chịu hậu quả. Trong hai chương trình đầu, hậu quả là thất bại hoàn toàn; trong chương trình thứ ba, là vấn đề hiệu năng nghiêm trọng.

Vậy khi nào bạn nên dùng boxed primitive? Chúng có một số công dụng chính đáng. Thứ nhất là làm phần tử, khóa, và giá trị trong các collection. Bạn không thể đặt kiểu nguyên thủy vào collection, nên bạn buộc phải dùng boxed primitive. Đây là một trường hợp đặc biệt của một trường hợp tổng quát hơn. Bạn phải dùng boxed primitive làm type parameter trong các kiểu và method được tham số hóa (**Chương 5**), vì ngôn ngữ không cho phép bạn dùng kiểu nguyên thủy. Ví dụ, bạn không thể khai báo một biến thuộc kiểu `ThreadLocal<int>`, nên bạn phải dùng `ThreadLocal<Integer>` thay thế. Cuối cùng, bạn phải dùng boxed primitive khi thực hiện các lời gọi method bằng reflection (**Item 65**).

Tóm lại, hãy ưu tiên dùng kiểu nguyên thủy hơn boxed primitive bất cứ khi nào bạn có lựa chọn. Kiểu nguyên thủy đơn giản hơn và nhanh hơn. Nếu bạn phải dùng boxed primitive, hãy cẩn thận! **Autoboxing làm giảm sự dài dòng, nhưng không làm giảm sự nguy hiểm, của việc dùng boxed primitive.** Khi chương trình của bạn so sánh hai boxed primitive bằng toán tử `==`, nó thực hiện phép so sánh định danh, gần như chắc chắn *không phải* điều bạn muốn. Khi chương trình của bạn thực hiện các phép tính kiểu hỗn hợp liên quan đến kiểu nguyên thủy đã boxed và chưa boxed, nó thực hiện unboxing, và **khi chương trình của bạn thực hiện unboxing, nó có thể ném ra** `NullPointerException` **.** Cuối cùng, khi chương trình của bạn box các giá trị nguyên thủy, điều đó có thể dẫn đến việc tạo đối tượng tốn kém và không cần thiết.

## Item 62: Tránh dùng chuỗi khi có kiểu khác phù hợp hơn

Chuỗi (string) được thiết kế để biểu diễn văn bản, và chúng làm tốt việc đó. Vì chuỗi quá phổ biến và được ngôn ngữ hỗ trợ quá tốt, có một xu hướng tự nhiên là dùng chuỗi cho những mục đích khác ngoài mục đích mà chúng được thiết kế. Item này thảo luận một vài điều bạn không nên làm với chuỗi.

**Chuỗi là sự thay thế kém cho các kiểu giá trị khác.** Khi một mẩu dữ liệu đi vào chương trình từ một file, từ mạng, hoặc từ đầu vào bàn phím, nó thường ở dạng chuỗi. Có một xu hướng tự nhiên là để nguyên nó như vậy, nhưng xu hướng này chỉ hợp lý nếu dữ liệu thực sự có bản chất là văn bản. Nếu nó là số, nó nên được chuyển đổi sang kiểu số phù hợp, chẳng hạn như `int`, `float`, hoặc `BigInteger`. Nếu nó là câu trả lời cho một câu hỏi có-hoặc-không, nó nên được chuyển đổi sang một kiểu enum phù hợp hoặc một `boolean`. Tổng quát hơn, nếu có một kiểu giá trị phù hợp, dù là kiểu nguyên thủy hay tham chiếu đối tượng, bạn nên dùng nó; nếu không có, bạn nên viết một kiểu như vậy. Mặc dù lời khuyên này có vẻ hiển nhiên, nó thường xuyên bị vi phạm.

**Chuỗi là sự thay thế kém cho kiểu enum.** Như đã thảo luận trong **Item 34**, enum làm hằng số kiểu liệt kê tốt hơn chuỗi rất nhiều.

**Chuỗi là sự thay thế kém cho kiểu tổng hợp (aggregate type).** Nếu một thực thể có nhiều thành phần, việc biểu diễn nó bằng một chuỗi duy nhất thường là một ý tưởng tồi. Ví dụ, đây là một dòng code đến từ một hệ thống thực tế—tên các định danh đã được thay đổi để bảo vệ thủ phạm:

```java
// Inappropriate use of string as aggregate type
String compoundKey = className + "#" + i.next();
```

Cách tiếp cận này có nhiều nhược điểm. Nếu ký tự được dùng để phân tách các trường xuất hiện trong một trong các trường đó, hỗn loạn có thể xảy ra. Để truy cập từng trường riêng lẻ, bạn phải phân tích (parse) chuỗi, việc này chậm, tẻ nhạt và dễ gây lỗi. Bạn không thể cung cấp các method `equals`, `toString`, hay `compareTo` mà buộc phải chấp nhận hành vi mà `String` cung cấp. Cách tiếp cận tốt hơn đơn giản là viết một class để biểu diễn kiểu tổng hợp đó, thường là một private static member class (**Item 24**).

**Chuỗi là sự thay thế kém cho capability.** Thỉnh thoảng, chuỗi được dùng để cấp quyền truy cập vào một chức năng nào đó. Ví dụ, hãy xem xét thiết kế của một cơ chế biến thread-local. Cơ chế như vậy cung cấp các biến mà mỗi thread có giá trị riêng của mình. Các thư viện Java đã có cơ chế biến thread-local kể từ Java 2, nhưng trước đó, các lập trình viên phải tự xây dựng lấy. Khi đối mặt với nhiệm vụ thiết kế một cơ chế như vậy nhiều năm trước, nhiều người đã độc lập đi đến cùng một thiết kế, trong đó các khóa chuỗi do client cung cấp được dùng để định danh từng biến thread-local:

```java
// Broken - inappropriate use of string as capability!
public class ThreadLocal {
    private ThreadLocal() { } // Noninstantiable

    // Sets the current thread's value for the named variable.
    public static void set(String key, Object value);

    // Returns the current thread's value for the named variable.
    public static Object get(String key);
}
```

Vấn đề với cách tiếp cận này là các khóa chuỗi đại diện cho một không gian tên toàn cục dùng chung cho các biến thread-local. Để cách tiếp cận này hoạt động, các khóa chuỗi do client cung cấp phải là duy nhất: nếu hai client độc lập quyết định dùng cùng một tên cho biến thread-local của họ, họ vô tình chia sẻ một biến duy nhất, điều này nhìn chung sẽ khiến cả hai client thất bại. Ngoài ra, tính bảo mật kém. Một client độc hại có thể cố ý dùng cùng khóa chuỗi với một client khác để truy cập trái phép vào dữ liệu của client kia.

API này có thể được sửa bằng cách thay chuỗi bằng một khóa không thể giả mạo (đôi khi được gọi là *capability*):

```java
public class ThreadLocal {
    private ThreadLocal() { }    // Noninstantiable

    public static class Key {    // (Capability)
        Key() { }
    }

    // Generates a unique, unforgeable key
    public static Key getKey() {
        return new Key();
    }

    public static void set(Key key, Object value);
    public static Object get(Key key);
}
```

Mặc dù cách này giải quyết cả hai vấn đề của API dựa trên chuỗi, bạn có thể làm tốt hơn nhiều. Bạn thực sự không cần các static method nữa. Thay vào đó chúng có thể trở thành instance method trên khóa, và đến lúc này khóa không còn là khóa cho một biến thread-local nữa: nó *chính là* một biến thread-local. Đến đây, class cấp cao nhất không còn làm gì cho bạn nữa, nên bạn có thể bỏ nó đi và đổi tên nested class thành `ThreadLocal`:

```java
public final class ThreadLocal {
    public ThreadLocal();
    public void set(Object value);
    public Object get();
}
```

API này không an toàn về kiểu (typesafe), vì bạn phải ép kiểu giá trị từ `Object` sang kiểu thực của nó khi lấy ra từ một biến thread-local. Không thể làm cho API gốc dựa trên `String` trở nên typesafe và rất khó để làm cho API dựa trên `Key` trở nên typesafe, nhưng việc làm cho API này typesafe lại rất đơn giản bằng cách biến `ThreadLocal` thành một class được tham số hóa (**Item 29**):

```java
public final class ThreadLocal<T> {
    public ThreadLocal();
    public void set(T value);
    public T get();
}
```

Đây, nói một cách đại khái, là API mà `java.lang.ThreadLocal` cung cấp. Ngoài việc giải quyết các vấn đề của API dựa trên chuỗi, nó còn nhanh hơn và thanh lịch hơn cả hai API dựa trên khóa.

Tóm lại, hãy tránh xu hướng tự nhiên biểu diễn đối tượng bằng chuỗi khi có sẵn hoặc có thể viết được những kiểu dữ liệu tốt hơn. Khi bị dùng không đúng chỗ, chuỗi cồng kềnh hơn, kém linh hoạt hơn, chậm hơn, và dễ gây lỗi hơn các kiểu khác. Những kiểu mà chuỗi thường bị lạm dụng để thay thế bao gồm kiểu nguyên thủy, enum, và kiểu tổng hợp.

## Item 63: Cảnh giác với hiệu năng của phép nối chuỗi

Toán tử nối chuỗi (`+`) là một cách tiện lợi để kết hợp một vài chuỗi thành một. Nó ổn khi sinh ra một dòng đầu ra đơn lẻ hoặc xây dựng biểu diễn chuỗi của một đối tượng nhỏ, kích thước cố định, nhưng nó không mở rộng được theo quy mô. **Dùng toán tử nối chuỗi lặp đi lặp lại để nối n chuỗi đòi hỏi thời gian bậc hai theo n.** Đây là hậu quả đáng tiếc của việc chuỗi là *immutable* (**Item 17**). Khi hai chuỗi được nối, nội dung của cả hai đều bị sao chép.

Ví dụ, hãy xem method này, xây dựng biểu diễn chuỗi của một bảng kê hóa đơn bằng cách nối lặp đi lặp lại một dòng cho mỗi mục:

```java
// Inappropriate use of string concatenation - Performs poorly!
public String statement() {
    String result = "";
    for (int i = 0; i < numItems(); i++)
        result += lineForItem(i);  // String concatenation
    return result;
}
```

Method này hoạt động cực kỳ tệ nếu số lượng mục lớn. **Để đạt hiệu năng chấp nhận được, hãy dùng** `StringBuilder` **thay cho** `String` để lưu bảng kê đang được xây dựng:

```java
public String statement() {
    StringBuilder b = new StringBuilder(numItems() * LINE_WIDTH);
    for (int i = 0; i < numItems(); i++)
        b.append(lineForItem(i));
    return b.toString();
}
```

Rất nhiều công sức đã được bỏ ra để làm cho phép nối chuỗi nhanh hơn kể từ Java 6, nhưng sự khác biệt về hiệu năng giữa hai method vẫn rất lớn: Nếu `numItems` trả về 100 và `lineForItem` trả về một chuỗi 80 ký tự, method thứ hai chạy nhanh hơn method thứ nhất 6,5 lần trên máy của tôi. Vì method thứ nhất có độ phức tạp bậc hai theo số mục còn method thứ hai là tuyến tính, sự khác biệt về hiệu năng trở nên lớn hơn nhiều khi số mục tăng lên. Lưu ý rằng method thứ hai cấp phát trước một `StringBuilder` đủ lớn để chứa toàn bộ kết quả, loại bỏ nhu cầu tự động tăng kích thước. Ngay cả khi bị làm giảm hiệu quả bằng cách dùng một `StringBuilder` với kích thước mặc định, nó vẫn nhanh hơn method thứ nhất 5,5 lần.

Bài học rất đơn giản: **Đừng dùng toán tử nối chuỗi để kết hợp nhiều hơn một vài chuỗi** trừ khi hiệu năng không quan trọng. Thay vào đó hãy dùng method `append` của `StringBuilder`. Hoặc cách khác, hãy dùng một mảng ký tự, hoặc xử lý từng chuỗi một thay vì kết hợp chúng.

## Item 64: Tham chiếu đến đối tượng thông qua interface của chúng

Item 51 nói rằng bạn nên dùng interface thay vì class làm kiểu tham số. Tổng quát hơn, bạn nên ưu tiên dùng interface hơn class để tham chiếu đến đối tượng. **Nếu tồn tại các kiểu interface phù hợp, thì tham số, giá trị trả về, biến, và trường đều nên được khai báo bằng kiểu interface.** Lần duy nhất bạn thực sự cần tham chiếu đến class của một đối tượng là khi bạn tạo nó bằng constructor. Để cụ thể hóa, hãy xem trường hợp của `LinkedHashSet`, một cài đặt của interface `Set`. Hãy tập thói quen gõ như thế này:

```java
// Good - uses interface as type
Set<Son> sonSet = new LinkedHashSet<>();
```

chứ không phải thế này:

```java
// Bad - uses class as type!
LinkedHashSet<Son> sonSet = new LinkedHashSet<>();
```

**Nếu bạn tập được thói quen dùng interface làm kiểu, chương trình của bạn sẽ linh hoạt hơn nhiều.** Nếu bạn quyết định muốn đổi cài đặt, tất cả những gì bạn phải làm là thay đổi tên class trong constructor (hoặc dùng một static factory khác). Ví dụ, khai báo đầu tiên có thể được sửa thành:

```java
Set<Son> sonSet = new HashSet<>();
```

và toàn bộ code xung quanh sẽ tiếp tục hoạt động. Code xung quanh không hề biết về kiểu cài đặt cũ, nên nó sẽ không nhận ra sự thay đổi.

Có một lưu ý: nếu cài đặt ban đầu cung cấp một chức năng đặc biệt nào đó không được yêu cầu bởi hợp đồng chung của interface và code phụ thuộc vào chức năng đó, thì điều quan trọng là cài đặt mới phải cung cấp cùng chức năng đó. Ví dụ, nếu code xung quanh khai báo đầu tiên phụ thuộc vào chính sách thứ tự của `LinkedHashSet`, thì việc thay `HashSet` cho `LinkedHashSet` trong khai báo sẽ là không đúng, vì `HashSet` không đảm bảo gì về thứ tự duyệt.

Vậy tại sao bạn lại muốn thay đổi kiểu cài đặt? Vì cài đặt thứ hai cung cấp hiệu năng tốt hơn cài đặt ban đầu, hoặc vì nó cung cấp chức năng mong muốn mà cài đặt ban đầu thiếu. Ví dụ, giả sử một trường chứa một instance `HashMap`. Đổi nó thành `EnumMap` sẽ cho hiệu năng tốt hơn và thứ tự duyệt nhất quán với thứ tự tự nhiên của các khóa, nhưng bạn chỉ có thể dùng `EnumMap` nếu kiểu khóa là một kiểu enum. Đổi `HashMap` thành `LinkedHashMap` sẽ cho thứ tự duyệt có thể dự đoán được với hiệu năng tương đương `HashMap`, mà không đặt ra yêu cầu đặc biệt nào đối với kiểu khóa.

Bạn có thể nghĩ rằng khai báo một biến bằng kiểu cài đặt của nó là ổn, vì bạn có thể thay đổi kiểu khai báo và kiểu cài đặt cùng một lúc, nhưng không có gì đảm bảo rằng thay đổi này sẽ cho ra một chương trình biên dịch được. Nếu code client đã dùng các method trên kiểu cài đặt ban đầu mà không có trên kiểu thay thế, hoặc nếu code client đã truyền instance đó vào một method yêu cầu kiểu cài đặt ban đầu, thì code sẽ không còn biên dịch được sau khi thực hiện thay đổi này. Khai báo biến bằng kiểu interface giữ cho bạn luôn trung thực.

**Hoàn toàn thích hợp để tham chiếu đến một đối tượng bằng class thay vì interface nếu không tồn tại interface phù hợp.** Ví dụ, hãy xem các *value class* (lớp giá trị), chẳng hạn như `String` và `BigInteger`. Value class hiếm khi được viết với ý định có nhiều cài đặt. Chúng thường là final và hiếm khi có interface tương ứng. Hoàn toàn thích hợp để dùng một value class như vậy làm kiểu tham số, biến, trường, hoặc kiểu trả về.

Trường hợp thứ hai không có kiểu interface phù hợp là các đối tượng thuộc về một framework mà các kiểu cơ bản của nó là class chứ không phải interface. Nếu một đối tượng thuộc về một *framework dựa trên class* như vậy, tốt hơn là tham chiếu đến nó bằng *base class* (lớp cơ sở) liên quan, thường là abstract, thay vì bằng class cài đặt của nó. Nhiều class trong `java.io` chẳng hạn như `OutputStream` rơi vào loại này.

Trường hợp cuối cùng không có kiểu interface phù hợp là các class cài đặt một interface nhưng cũng cung cấp thêm các method không có trong interface đó—ví dụ, `PriorityQueue` có method `comparator` không có trên interface `Queue`. Class như vậy nên được dùng để tham chiếu đến các instance của nó *chỉ khi* chương trình phụ thuộc vào các method bổ sung đó, và điều này nên rất hiếm.

Ba trường hợp này không nhằm liệt kê đầy đủ mà chỉ nhằm truyền đạt đại ý về những tình huống mà việc tham chiếu đến một đối tượng bằng class của nó là thích hợp. Trong thực tế, thường sẽ thấy rõ một đối tượng nhất định có interface phù hợp hay không. Nếu có, chương trình của bạn sẽ linh hoạt hơn và có phong cách hơn nếu bạn dùng interface để tham chiếu đến đối tượng đó. **Nếu không có interface phù hợp, hãy dùng class ít cụ thể nhất trong hệ thống phân cấp class mà vẫn cung cấp chức năng cần thiết.**

## Item 65: Ưu tiên interface hơn reflection

*Cơ chế reflection cốt lõi*, `java.lang.reflect`, cung cấp khả năng truy cập bằng chương trình vào các class tùy ý. Cho trước một đối tượng `Class`, bạn có thể lấy được các instance `Constructor`, `Method`, và `Field` đại diện cho các constructor, method, và field của class được biểu diễn bởi instance `Class` đó. Những đối tượng này cung cấp khả năng truy cập bằng chương trình vào tên các thành viên của class, kiểu của các field, chữ ký của các method, v.v.

Hơn nữa, các instance `Constructor`, `Method`, và `Field` cho phép bạn thao tác với các đối tượng thực tương ứng của chúng *một cách reflective*: bạn có thể tạo instance, gọi method, và truy cập field của class bên dưới bằng cách gọi các method trên các instance `Constructor`, `Method`, và `Field`. Ví dụ, `Method.invoke` cho phép bạn gọi bất kỳ method nào trên bất kỳ đối tượng nào của bất kỳ class nào (tuân theo các ràng buộc bảo mật thông thường). Reflection cho phép một class sử dụng một class khác, ngay cả khi class thứ hai chưa tồn tại lúc class thứ nhất được biên dịch. Tuy nhiên, sức mạnh này đi kèm với cái giá phải trả:

- **Bạn mất tất cả lợi ích của việc kiểm tra kiểu lúc biên dịch,** bao gồm cả việc kiểm tra exception. Nếu một chương trình cố gắng gọi một method không tồn tại hoặc không thể truy cập bằng reflection, nó sẽ thất bại lúc chạy trừ khi bạn đã có những biện pháp phòng ngừa đặc biệt.

- **Code cần để thực hiện truy cập reflective thì vụng về và dài dòng.** Nó tẻ nhạt khi viết và khó đọc.

- **Hiệu năng bị ảnh hưởng.** Lời gọi method bằng reflection chậm hơn nhiều so với lời gọi method thông thường. Chậm hơn chính xác bao nhiêu thì khó nói, vì có nhiều yếu tố tác động. Trên máy của tôi, việc gọi một method không có tham số đầu vào và trả về `int` chậm hơn mười một lần khi thực hiện bằng reflection.

Có một vài ứng dụng tinh vi cần đến reflection. Ví dụ bao gồm các công cụ phân tích code và các framework dependency injection. Ngay cả những công cụ như vậy gần đây cũng đang dần rời xa reflection, khi những nhược điểm của nó trở nên rõ ràng hơn. Nếu bạn có bất kỳ nghi ngờ nào về việc ứng dụng của mình có cần reflection hay không, thì có lẽ là nó không cần.

**Bạn có thể thu được nhiều lợi ích của reflection trong khi chỉ chịu rất ít chi phí của nó bằng cách chỉ dùng nó ở một dạng rất hạn chế.** Với nhiều chương trình phải dùng một class không có sẵn lúc biên dịch, vẫn tồn tại lúc biên dịch một interface hoặc superclass phù hợp để tham chiếu đến class đó (**Item 64**). Nếu đúng như vậy, bạn có thể **tạo instance bằng reflection và truy cập chúng một cách bình thường thông qua interface hoặc superclass của chúng.**

Ví dụ, đây là một chương trình tạo một instance `Set<String>` mà class của nó được chỉ định bởi đối số dòng lệnh đầu tiên. Chương trình chèn các đối số dòng lệnh còn lại vào set và in nó ra. Bất kể đối số đầu tiên là gì, chương trình in ra các đối số còn lại với các phần tử trùng lặp đã được loại bỏ. Tuy nhiên, thứ tự in ra các đối số này phụ thuộc vào class được chỉ định trong đối số đầu tiên. Nếu bạn chỉ định `java.util.HashSet`, chúng được in ra theo thứ tự có vẻ ngẫu nhiên; nếu bạn chỉ định `java.util.TreeSet`, chúng được in ra theo thứ tự bảng chữ cái vì các phần tử trong `TreeSet` được sắp xếp:

```java
// Reflective instantiation with interface access
public static void main(String[] args) {
    // Translate the class name into a Class object
    Class<? extends Set<String>> cl = null;
    try {
        cl = (Class<? extends Set<String>>)  // Unchecked cast!
                Class.forName(args[0]);
    } catch (ClassNotFoundException e) {
        fatalError("Class not found.");
    }
    // Get the constructor
    Constructor<? extends Set<String>> cons = null;
    try {
        cons = cl.getDeclaredConstructor();
    } catch (NoSuchMethodException e) {
        fatalError("No parameterless constructor");
    }
    // Instantiate the set
    Set<String> s = null;
    try {
        s = cons.newInstance();
    } catch (IllegalAccessException e) {
        fatalError("Constructor not accessible");
    } catch (InstantiationException e) {
        fatalError("Class not instantiable.");
    } catch (InvocationTargetException e) {
        fatalError("Constructor threw " + e.getCause());
    } catch (ClassCastException e) {
        fatalError("Class doesn't implement Set");
    }
    // Exercise the set
    s.addAll(Arrays.asList(args).subList(1, args.length));
    System.out.println(s);
}
private static void fatalError(String msg) {
    System.err.println(msg);
    System.exit(1);
}
```

Mặc dù chương trình này chỉ là một món đồ chơi, kỹ thuật mà nó minh họa khá mạnh mẽ. Chương trình đồ chơi này có thể dễ dàng được biến thành một bộ kiểm thử set tổng quát, xác nhận cài đặt `Set` được chỉ định bằng cách thao tác mạnh tay trên một hoặc nhiều instance và kiểm tra rằng chúng tuân thủ hợp đồng của `Set`. Tương tự, nó có thể được biến thành một công cụ phân tích hiệu năng set tổng quát. Thực tế, kỹ thuật này đủ mạnh để cài đặt một *service provider framework* hoàn chỉnh (**Item 1**). Thông thường, kỹ thuật này là tất cả những gì bạn cần về mặt reflection.

Ví dụ này minh họa hai nhược điểm của reflection. Thứ nhất, ví dụ có thể sinh ra sáu exception khác nhau lúc chạy, tất cả đều sẽ là lỗi biên dịch nếu không dùng reflective instantiation. (Cho vui, bạn có thể khiến chương trình sinh ra từng exception trong sáu exception này bằng cách truyền vào các đối số dòng lệnh thích hợp.) Nhược điểm thứ hai là cần tới hai mươi lăm dòng code tẻ nhạt để sinh ra một instance của class từ tên của nó, trong khi một lời gọi constructor sẽ nằm gọn trên một dòng duy nhất. Độ dài của chương trình có thể được giảm bằng cách bắt `ReflectiveOperationException`, một superclass của các reflective exception khác nhau được giới thiệu trong Java 7. Cả hai nhược điểm đều bị giới hạn trong phần chương trình tạo instance của đối tượng. Một khi đã được tạo, set này không thể phân biệt được với bất kỳ instance `Set` nào khác. Trong một chương trình thực, phần lớn code do đó không bị ảnh hưởng bởi cách dùng reflection hạn chế này.

Nếu bạn biên dịch chương trình này, bạn sẽ nhận được một cảnh báo unchecked cast. Cảnh báo này là chính đáng, ở chỗ phép ép kiểu sang `Class<? extends Set<String>>` sẽ thành công ngay cả khi class được đặt tên không phải là một cài đặt của `Set`, trong trường hợp đó chương trình sẽ ném ra `ClassCastException` khi nó tạo instance của class. Để tìm hiểu về việc chặn cảnh báo này, hãy đọc **Item 27**.

Một cách dùng reflection chính đáng, dù hiếm, là để quản lý các phụ thuộc của một class vào những class, method, hoặc field khác có thể vắng mặt lúc chạy. Điều này có thể hữu ích nếu bạn đang viết một package phải chạy với nhiều phiên bản của một package khác nào đó. Kỹ thuật là biên dịch package của bạn với môi trường tối thiểu cần thiết để hỗ trợ nó, thường là phiên bản cũ nhất, và truy cập bất kỳ class hay method mới hơn nào bằng reflection. Để cách này hoạt động, bạn phải thực hiện hành động thích hợp nếu một class hoặc method mới hơn mà bạn đang cố truy cập không tồn tại lúc chạy. Hành động thích hợp có thể bao gồm dùng một phương tiện thay thế nào đó để đạt cùng mục tiêu hoặc hoạt động với chức năng bị giảm bớt.

Tóm lại, reflection là một cơ chế mạnh mẽ cần thiết cho một số tác vụ lập trình hệ thống tinh vi, nhưng nó có nhiều nhược điểm. Nếu bạn đang viết một chương trình phải làm việc với các class chưa biết lúc biên dịch, bạn nên, nếu có thể, chỉ dùng reflection để tạo instance của các đối tượng, và truy cập các đối tượng đó thông qua một interface hoặc superclass nào đó đã biết lúc biên dịch.

## Item 66: Sử dụng native method một cách thận trọng

Java Native Interface (JNI) cho phép các chương trình Java gọi *native method*, là các method được viết bằng *ngôn ngữ lập trình native* như C hoặc C++. Về mặt lịch sử, native method có ba công dụng chính. Chúng cung cấp khả năng truy cập vào các tiện ích đặc thù của nền tảng như registry. Chúng cung cấp khả năng truy cập vào các thư viện native code có sẵn, bao gồm các thư viện cũ (legacy) cung cấp quyền truy cập vào dữ liệu cũ. Cuối cùng, native method được dùng để viết những phần quan trọng về hiệu năng của ứng dụng bằng ngôn ngữ native nhằm cải thiện hiệu năng.

Việc dùng native method để truy cập các tiện ích đặc thù của nền tảng là chính đáng, nhưng hiếm khi cần thiết: khi nền tảng Java trưởng thành, nó đã cung cấp khả năng truy cập vào nhiều tính năng trước đây chỉ có trên các nền tảng chủ. Ví dụ, process API, được thêm vào trong Java 9, cung cấp khả năng truy cập vào các tiến trình của hệ điều hành. Việc dùng native method để sử dụng các thư viện native khi không có thư viện tương đương trong Java cũng là chính đáng.

**Hiếm khi nên dùng native method để cải thiện hiệu năng.** Trong các bản phát hành đầu (trước Java 3), điều này thường là cần thiết, nhưng các JVM đã trở nên nhanh hơn *rất nhiều* kể từ đó. Với hầu hết các tác vụ, giờ đây có thể đạt được hiệu năng tương đương trong Java. Ví dụ, khi `java.math` được thêm vào trong bản phát hành 1.1, `BigInteger` dựa vào một thư viện số học đa độ chính xác (multiprecision arithmetic) viết bằng C vốn nhanh vào thời điểm đó. Trong Java 3, `BigInteger` được cài đặt lại bằng Java, và được tinh chỉnh cẩn thận đến mức nó chạy nhanh hơn cài đặt native ban đầu.

Một đoạn kết buồn cho câu chuyện này là `BigInteger` đã thay đổi rất ít kể từ đó, ngoại trừ phép nhân nhanh hơn cho các số lớn trong Java 8. Trong khoảng thời gian đó, công việc trên các thư viện native vẫn tiếp tục nhanh chóng, đáng chú ý là GNU Multiple Precision arithmetic library (GMP). Các lập trình viên Java cần số học đa độ chính xác hiệu năng thực sự cao giờ đây có lý do chính đáng để dùng GMP thông qua native method [**Blum14**].

Việc sử dụng native method có những nhược điểm *nghiêm trọng*. Vì các ngôn ngữ native không *an toàn* (**Item 50**), các ứng dụng dùng native method không còn miễn nhiễm với các lỗi hỏng bộ nhớ (memory corruption). Vì các ngôn ngữ native phụ thuộc vào nền tảng nhiều hơn Java, các chương trình dùng native method kém khả chuyển hơn. Chúng cũng khó gỡ lỗi hơn. Nếu bạn không cẩn thận, native method có thể làm *giảm* hiệu năng vì garbage collector không thể tự động hóa, hay thậm chí theo dõi, việc sử dụng bộ nhớ native (**Item 8**), và có một chi phí gắn liền với việc đi vào và đi ra khỏi native code. Cuối cùng, native method đòi hỏi “glue code” (mã kết dính) vốn khó đọc và tẻ nhạt khi viết.

Tóm lại, hãy suy nghĩ kỹ trước khi dùng native method. Hiếm khi bạn cần dùng chúng để cải thiện hiệu năng. Nếu bạn phải dùng native method để truy cập các tài nguyên cấp thấp hoặc các thư viện native, hãy dùng càng ít native code càng tốt và kiểm thử nó kỹ lưỡng. Một lỗi duy nhất trong native code có thể làm hỏng toàn bộ ứng dụng của bạn.

## Item 67: Tối ưu hóa một cách thận trọng

Có ba câu châm ngôn về tối ưu hóa mà mọi người nên biết:

Nhiều tội lỗi trong ngành điện toán được gây ra nhân danh hiệu quả (mà không nhất thiết đạt được nó) hơn bất kỳ lý do đơn lẻ nào khác—kể cả sự ngu ngốc mù quáng.

—William A. Wulf [**Wulf72**]

Chúng ta *nên* quên đi những hiệu quả nhỏ nhặt, có lẽ khoảng 97% thời gian: tối ưu hóa sớm là cội nguồn của mọi tội lỗi.

—Donald E. Knuth [**Knuth74**]

Chúng tôi tuân theo hai quy tắc trong vấn đề tối ưu hóa:

Quy tắc 1. Đừng làm.

Quy tắc 2 (chỉ dành cho chuyên gia). Đừng làm vội—nghĩa là, chưa làm cho đến khi bạn có một giải pháp hoàn toàn rõ ràng và chưa được tối ưu hóa.

—M. A. Jackson [**Jackson75**] Tất cả những câu châm ngôn này có trước ngôn ngữ lập trình Java hai thập kỷ. Chúng nói lên một sự thật sâu sắc về tối ưu hóa: rất dễ gây hại nhiều hơn lợi, đặc biệt nếu bạn tối ưu hóa quá sớm. Trong quá trình đó, bạn có thể tạo ra phần mềm vừa không nhanh vừa không đúng và không thể dễ dàng sửa chữa.

Đừng hy sinh các nguyên tắc kiến trúc đúng đắn vì hiệu năng. **Hãy cố gắng viết những chương trình tốt thay vì những chương trình nhanh.** Nếu một chương trình tốt chưa đủ nhanh, kiến trúc của nó sẽ cho phép nó được tối ưu hóa. Các chương trình tốt thể hiện nguyên tắc *che giấu thông tin* (information hiding): ở những nơi có thể, chúng khoanh vùng các quyết định thiết kế trong từng thành phần riêng lẻ, để từng quyết định có thể được thay đổi mà không ảnh hưởng đến phần còn lại của hệ thống (**Item 15**).

Điều này *không* có nghĩa là bạn có thể bỏ qua các mối quan tâm về hiệu năng cho đến khi chương trình hoàn thành. Các vấn đề về cài đặt có thể được sửa bằng cách tối ưu hóa sau này, nhưng những khiếm khuyết kiến trúc lan rộng làm hạn chế hiệu năng có thể không thể sửa được nếu không viết lại hệ thống. Thay đổi một khía cạnh nền tảng của thiết kế sau khi mọi thứ đã xong có thể dẫn đến một hệ thống có cấu trúc kém, khó bảo trì và phát triển. Do đó bạn phải nghĩ về hiệu năng trong quá trình thiết kế.

**Hãy cố gắng tránh những quyết định thiết kế làm hạn chế hiệu năng.** Các thành phần của một thiết kế khó thay đổi nhất sau khi đã xong là những thành phần quy định tương tác giữa các thành phần với nhau và với thế giới bên ngoài. Đứng đầu trong số các thành phần thiết kế này là API, giao thức cấp đường truyền (wire-level protocol), và các định dạng dữ liệu lưu trữ bền vững (persistent data format). Những thành phần thiết kế này không những khó hoặc không thể thay đổi sau khi đã xong, mà tất cả chúng đều có thể đặt ra những hạn chế đáng kể lên hiệu năng mà một hệ thống có thể đạt được.

**Hãy cân nhắc hậu quả về hiệu năng của các quyết định thiết kế API của bạn.** Làm cho một kiểu public trở nên mutable có thể đòi hỏi rất nhiều sao chép phòng vệ (defensive copying) không cần thiết (**Item 50**). Tương tự, dùng inheritance trong một public class ở nơi mà composition mới là thích hợp sẽ trói buộc class đó mãi mãi với superclass của nó, điều này có thể đặt ra những giới hạn giả tạo lên hiệu năng của subclass (**Item 18**). Ví dụ cuối cùng, dùng một kiểu cài đặt thay vì một interface trong API trói buộc bạn với một cài đặt cụ thể, ngay cả khi những cài đặt nhanh hơn có thể được viết trong tương lai (**Item 64**).

Ảnh hưởng của thiết kế API lên hiệu năng là rất thực tế. Hãy xem method `getSize` trong class `java.awt.Component`. Quyết định rằng method quan trọng về hiệu năng này sẽ trả về một instance `Dimension`, kết hợp với quyết định rằng các instance `Dimension` là mutable, buộc mọi cài đặt của method này phải cấp phát một instance `Dimension` mới ở mỗi lần gọi. Mặc dù việc cấp phát các đối tượng nhỏ là rẻ trên một VM hiện đại, việc cấp phát hàng triệu đối tượng một cách không cần thiết có thể gây hại thực sự cho hiệu năng.

Đã từng tồn tại nhiều lựa chọn thiết kế API thay thế. Lý tưởng nhất, `Dimension` đáng lẽ nên là immutable (**Item 17**); hoặc cách khác, `getSize` có thể được thay bằng hai method trả về từng thành phần nguyên thủy riêng lẻ của một đối tượng `Dimension`. Thực tế, hai method như vậy đã được thêm vào `Component` trong Java 2 vì lý do hiệu năng. Tuy nhiên, code client có sẵn từ trước vẫn dùng method `getSize` và vẫn gánh chịu hậu quả về hiệu năng của các quyết định thiết kế API ban đầu.

May mắn thay, nhìn chung thiết kế API tốt thường nhất quán với hiệu năng tốt. **Bóp méo một API để đạt hiệu năng tốt là một ý tưởng rất tồi.** Vấn đề hiệu năng khiến bạn bóp méo API có thể biến mất trong một bản phát hành tương lai của nền tảng hoặc phần mềm bên dưới khác, nhưng API bị bóp méo cùng những đau đầu về hỗ trợ đi kèm với nó sẽ ở lại với bạn mãi mãi.

Một khi bạn đã thiết kế chương trình cẩn thận và tạo ra một cài đặt rõ ràng, súc tích và có cấu trúc tốt, *khi đó* có thể là lúc cân nhắc tối ưu hóa, với giả định rằng bạn chưa hài lòng với hiệu năng của chương trình.

Nhớ lại rằng hai quy tắc tối ưu hóa của Jackson là “Đừng làm,” và “(chỉ dành cho chuyên gia). Đừng làm vội.” Ông ấy có thể đã thêm một quy tắc nữa: **đo hiệu năng trước và sau mỗi lần thử tối ưu hóa.** Bạn có thể ngạc nhiên với những gì mình phát hiện. Thường thì các nỗ lực tối ưu hóa không có tác động đo lường được lên hiệu năng; đôi khi, chúng còn làm cho tệ hơn. Lý do chính là rất khó đoán chương trình của bạn đang dành thời gian ở đâu. Phần chương trình mà bạn nghĩ là chậm có thể không phải là thủ phạm, trong trường hợp đó bạn sẽ lãng phí thời gian cố gắng tối ưu hóa nó. Kinh nghiệm phổ biến nói rằng các chương trình dành 90 phần trăm thời gian của chúng trong 10 phần trăm code.

Các công cụ profiling có thể giúp bạn quyết định nên tập trung nỗ lực tối ưu hóa vào đâu. Những công cụ này cho bạn thông tin lúc chạy, chẳng hạn như mỗi method tiêu tốn khoảng bao nhiêu thời gian và nó được gọi bao nhiêu lần. Ngoài việc giúp tập trung nỗ lực tinh chỉnh, điều này có thể cảnh báo bạn về nhu cầu thay đổi thuật toán. Nếu một thuật toán bậc hai (hoặc tệ hơn) ẩn nấp trong chương trình của bạn, không có mức độ tinh chỉnh nào sửa được vấn đề. Bạn phải thay thuật toán đó bằng một thuật toán hiệu quả hơn. Càng nhiều code trong hệ thống, việc dùng profiler càng quan trọng. Nó giống như tìm kim trong đống rơm: đống rơm càng lớn, việc có một máy dò kim loại càng hữu ích. Một công cụ khác đáng được nhắc đến đặc biệt là jmh, không phải là một profiler mà là một *framework microbenchmarking* cung cấp khả năng nhìn thấu chưa từng có vào hiệu năng chi tiết của code Java [**JMH**].

Nhu cầu đo lường tác động của nỗ lực tối ưu hóa trong Java còn lớn hơn so với các ngôn ngữ truyền thống hơn như C và C++, vì Java có một *mô hình hiệu năng* (performance model) yếu hơn: Chi phí tương đối của các phép toán nguyên thủy khác nhau được định nghĩa kém rõ ràng hơn. “Khoảng cách trừu tượng” giữa những gì lập trình viên viết và những gì CPU thực thi lớn hơn, điều này khiến việc dự đoán đáng tin cậy hậu quả về hiệu năng của các tối ưu hóa càng khó khăn hơn. Có rất nhiều huyền thoại về hiệu năng trôi nổi xung quanh mà hóa ra chỉ là nửa sự thật hoặc hoàn toàn sai.

Không những mô hình hiệu năng của Java được định nghĩa không rõ ràng, mà nó còn thay đổi từ cài đặt này sang cài đặt khác, từ bản phát hành này sang bản phát hành khác, và từ bộ xử lý này sang bộ xử lý khác. Nếu bạn sẽ chạy chương trình của mình trên nhiều cài đặt hoặc nhiều nền tảng phần cứng, điều quan trọng là bạn phải đo tác động của việc tối ưu hóa trên từng cái. Thỉnh thoảng bạn có thể bị buộc phải đánh đổi giữa hiệu năng trên các cài đặt hoặc nền tảng phần cứng khác nhau.

Trong gần hai thập kỷ kể từ khi item này được viết lần đầu, mọi thành phần của ngăn xếp phần mềm Java đều đã tăng độ phức tạp, từ bộ xử lý đến VM đến thư viện, và sự đa dạng của phần cứng mà Java chạy trên đó đã tăng lên rất nhiều. Tất cả những điều này kết hợp lại khiến hiệu năng của các chương trình Java giờ đây thậm chí còn khó dự đoán hơn so với năm 2001, cùng với sự gia tăng tương ứng về nhu cầu đo lường nó.

Tóm lại, đừng cố gắng viết những chương trình nhanh—hãy cố gắng viết những chương trình tốt; tốc độ sẽ theo sau. Nhưng hãy nghĩ về hiệu năng trong khi bạn thiết kế hệ thống, đặc biệt là trong khi bạn thiết kế API, giao thức cấp đường truyền, và các định dạng dữ liệu lưu trữ bền vững. Khi bạn đã xây dựng xong hệ thống, hãy đo hiệu năng của nó. Nếu nó đủ nhanh, bạn đã xong. Nếu không, hãy xác định nguồn gốc của vấn đề với sự trợ giúp của một profiler và bắt tay vào tối ưu hóa những phần liên quan của hệ thống. Bước đầu tiên là xem xét lựa chọn thuật toán của bạn: không có mức độ tối ưu hóa cấp thấp nào có thể bù đắp cho một lựa chọn thuật toán kém. Lặp lại quá trình này khi cần thiết, đo hiệu năng sau mỗi thay đổi, cho đến khi bạn hài lòng.

## Item 68: Tuân thủ các quy ước đặt tên được chấp nhận rộng rãi

Nền tảng Java có một tập hợp *quy ước đặt tên* (naming convention) được thiết lập vững chắc, nhiều trong số đó nằm trong *The Java Language Specification* [JLS, 6.1]. Nói một cách đại khái, các quy ước đặt tên chia thành hai loại: quy ước về hình thức (typographical) và quy ước về ngữ pháp (grammatical).

Chỉ có một số ít quy ước đặt tên về hình thức, bao gồm cho package, class, interface, method, field, và biến kiểu (type variable). Bạn hiếm khi nên vi phạm chúng và không bao giờ vi phạm mà không có lý do thật sự chính đáng. Nếu một API vi phạm những quy ước này, nó có thể khó sử dụng. Nếu một cài đặt vi phạm chúng, nó có thể khó bảo trì. Trong cả hai trường hợp, các vi phạm có khả năng gây nhầm lẫn và khó chịu cho các lập trình viên khác làm việc với code đó và có thể gây ra những giả định sai lầm dẫn đến lỗi. Các quy ước này được tóm tắt trong item này.

Tên package và module nên có tính phân cấp với các thành phần được phân tách bằng dấu chấm. Các thành phần nên gồm các ký tự chữ cái viết thường và, hiếm khi, chữ số. Tên của bất kỳ package nào sẽ được dùng bên ngoài tổ chức của bạn nên bắt đầu bằng tên miền Internet của tổ chức bạn với các thành phần được đảo ngược, ví dụ, `edu.cmu`, `com.google`, `org.eff`. Các thư viện chuẩn và các package tùy chọn, có tên bắt đầu bằng `java` và `javax`, là ngoại lệ của quy tắc này. Người dùng không được tạo package hoặc module có tên bắt đầu bằng `java` hoặc `javax`. Các quy tắc chi tiết để chuyển đổi tên miền Internet thành tiền tố tên package có thể được tìm thấy trong JLS [JLS, 6.1].

Phần còn lại của tên package nên gồm một hoặc nhiều thành phần mô tả package. Các thành phần nên ngắn, thường là tám ký tự trở xuống. Các từ viết tắt có nghĩa được khuyến khích, ví dụ, `util` thay vì `utilities`. Các từ viết tắt bằng chữ cái đầu (acronym) là chấp nhận được, ví dụ, `awt`. Các thành phần nhìn chung nên gồm một từ hoặc một từ viết tắt duy nhất.

Nhiều package có tên chỉ gồm một thành phần ngoài tên miền Internet. Các thành phần bổ sung là thích hợp cho những tiện ích lớn mà kích thước của chúng đòi hỏi phải được chia nhỏ thành một hệ thống phân cấp không chính thức. Ví dụ, package `javax.util` có một hệ thống phân cấp package phong phú với những tên như `java.util.concurrent.atomic`. Những package như vậy được gọi là *subpackage*, mặc dù hầu như không có hỗ trợ nào ở cấp ngôn ngữ cho hệ thống phân cấp package.

Tên class và interface, bao gồm tên kiểu enum và annotation, nên gồm một hoặc nhiều từ, với chữ cái đầu tiên của mỗi từ viết hoa, ví dụ, `List` hoặc `FutureTask`. Nên tránh các từ viết tắt, ngoại trừ acronym và một số từ viết tắt phổ biến như `max` và `min`. Có một số bất đồng về việc acronym nên viết hoa toàn bộ hay chỉ viết hoa chữ cái đầu. Mặc dù một số lập trình viên vẫn dùng chữ hoa toàn bộ, có một lập luận mạnh mẽ ủng hộ việc chỉ viết hoa chữ cái đầu: ngay cả khi nhiều acronym xuất hiện liên tiếp, bạn vẫn có thể biết một từ bắt đầu ở đâu và từ tiếp theo kết thúc ở đâu. Bạn muốn thấy tên class nào hơn, `HTTPURL` hay `HttpUrl`?

Tên method và field tuân theo cùng quy ước về hình thức như tên class và interface, ngoại trừ chữ cái đầu tiên của tên method hoặc field nên viết thường, ví dụ, `remove` hoặc `ensureCapacity`. Nếu một acronym xuất hiện làm từ đầu tiên của tên method hoặc field, nó nên được viết thường.

Ngoại lệ duy nhất cho quy tắc trên liên quan đến “constant field” (trường hằng), có tên nên gồm một hoặc nhiều từ viết hoa được phân tách bằng ký tự gạch dưới, ví dụ, `VALUES` hoặc `NEGATIVE_INFINITY`. Một constant field là một static final field có giá trị immutable. Nếu một static final field có kiểu nguyên thủy hoặc một kiểu tham chiếu immutable (**Item 17**), thì nó là một constant field. Ví dụ, các hằng enum là constant field. Nếu một static final field có kiểu tham chiếu mutable, nó vẫn có thể là một constant field nếu đối tượng được tham chiếu là immutable. Lưu ý rằng constant field là cách dùng dấu gạch dưới *duy nhất* được khuyến nghị.

Tên biến cục bộ có quy ước đặt tên về hình thức tương tự như tên thành viên, ngoại trừ các từ viết tắt được cho phép, cũng như các ký tự đơn lẻ và chuỗi ký tự ngắn mà ý nghĩa của chúng phụ thuộc vào ngữ cảnh chúng xuất hiện, ví dụ, `i`, `denom`, `houseNum`. Tham số đầu vào là một loại biến cục bộ đặc biệt. Chúng nên được đặt tên cẩn thận hơn nhiều so với biến cục bộ thông thường, vì tên của chúng là một phần không thể thiếu trong tài liệu của method.

Tên type parameter thường gồm một chữ cái duy nhất. Phổ biến nhất là một trong năm chữ cái này: `T` cho một kiểu tùy ý, `E` cho kiểu phần tử của một collection, `K` và `V` cho kiểu khóa và kiểu giá trị của một map, và `X` cho một exception. Kiểu trả về của một hàm thường là `R`. Một dãy các kiểu tùy ý có thể là `T`, `U`, `V` hoặc `T1`, `T2`, `T3`.

Để tham khảo nhanh, bảng sau đây cho thấy các ví dụ về quy ước hình thức.

| Loại định danh | Ví dụ |
|---|---|
| Package hoặc module | `org.junit.jupiter.api`, `com.google.common.collect` |
| Class hoặc Interface | `Stream`, `FutureTask`, `LinkedHashMap`, `HttpClient` |
| Method hoặc Field | `remove`, `groupingBy`, `getCrc` |
| Constant Field | `MIN_VALUE`, `NEGATIVE_INFINITY` |
| Biến cục bộ | `i`, `denom`, `houseNum` |
| Type Parameter | `T`, `E`, `K`, `V`, `X`, `R`, `U`, `V`, `T1`, `T2` |

Các quy ước đặt tên về ngữ pháp linh hoạt hơn và gây tranh cãi hơn các quy ước về hình thức. Không có quy ước đặt tên về ngữ pháp nào đáng kể cho package. Các class có thể tạo instance, bao gồm cả kiểu enum, thường được đặt tên bằng một danh từ hoặc cụm danh từ số ít, chẳng hạn như `Thread`, `PriorityQueue`, hoặc `ChessPiece`. Các utility class không thể tạo instance (**Item 4**) thường được đặt tên bằng một danh từ số nhiều, chẳng hạn như `Collectors` hoặc `Collections`. Interface được đặt tên giống như class, ví dụ, `Collection` hoặc `Comparator`, hoặc bằng một tính từ kết thúc bằng `able` hoặc `ible`, ví dụ, `Runnable`, `Iterable`, hoặc `Accessible`. Vì các kiểu annotation có quá nhiều công dụng, không có từ loại nào chiếm ưu thế. Danh từ, động từ, giới từ, và tính từ đều phổ biến, ví dụ, `BindingAnnotation`, `Inject`, `ImplementedBy`, hoặc `Singleton`.

Các method thực hiện một hành động nào đó thường được đặt tên bằng một động từ hoặc cụm động từ (bao gồm cả tân ngữ), ví dụ, `append` hoặc `drawImage`. Các method trả về giá trị `boolean` thường có tên bắt đầu bằng từ `is` hoặc, ít phổ biến hơn, `has`, theo sau là một danh từ, cụm danh từ, hoặc bất kỳ từ hay cụm từ nào đóng vai trò tính từ, ví dụ, `isDigit`, `isProbablePrime`, `isEmpty`, `isEnabled`, hoặc `hasSiblings`.

Các method trả về một hàm hoặc thuộc tính không phải `boolean` của đối tượng mà chúng được gọi trên đó thường được đặt tên bằng một danh từ, một cụm danh từ, hoặc một cụm động từ bắt đầu bằng động từ `get`, ví dụ, `size`, `hashCode`, hoặc `getTime`. Có một nhóm người lên tiếng mạnh mẽ cho rằng chỉ dạng thứ ba (bắt đầu bằng `get`) là chấp nhận được, nhưng có rất ít cơ sở cho tuyên bố này. Hai dạng đầu thường dẫn đến code dễ đọc hơn, ví dụ:

```java
if (car.speed() > 2 * SPEED_LIMIT)
    generateAudibleAlert("Watch out for cops!");
```

Dạng bắt đầu bằng `get` có nguồn gốc từ đặc tả *Java Beans* phần lớn đã lỗi thời, vốn là nền tảng của một kiến trúc thành phần tái sử dụng thời kỳ đầu. Có những công cụ hiện đại vẫn tiếp tục dựa vào quy ước đặt tên Beans, và bạn cứ thoải mái dùng nó trong bất kỳ code nào sẽ được dùng cùng với những công cụ này. Cũng có một tiền lệ mạnh mẽ cho việc tuân theo quy ước đặt tên này nếu một class chứa cả setter lẫn getter cho cùng một thuộc tính. Trong trường hợp này, hai method thường được đặt tên là `get`*Attribute* và `set`*Attribute*.

Một vài tên method đáng được nhắc đến đặc biệt. Các instance method chuyển đổi kiểu của một đối tượng, trả về một đối tượng độc lập thuộc kiểu khác, thường được gọi là `to`*Type*, ví dụ, `toString` hoặc `toArray`. Các method trả về một *view* (**Item 6**) có kiểu khác với kiểu của đối tượng nhận thường được gọi là `as`*Type*, ví dụ, `asList`. Các method trả về một giá trị nguyên thủy có cùng giá trị với đối tượng mà chúng được gọi trên đó thường được gọi là *type*`Value`, ví dụ, `intValue`. Các tên phổ biến cho static factory bao gồm `from`, `of`, `valueOf`, `instance`, `getInstance`, `newInstance`, `get`*Type*, và `new`*Type* (**Item 1**, trang 9).

Các quy ước ngữ pháp cho tên field ít được thiết lập vững chắc hơn và ít quan trọng hơn so với các quy ước cho tên class, interface, và method vì các API được thiết kế tốt chứa rất ít, nếu có, field được phơi bày ra ngoài. Các field kiểu `boolean` thường được đặt tên giống như các accessor method `boolean` với tiền tố `is` bị lược bỏ, ví dụ, `initialized`, `composite`. Các field thuộc kiểu khác thường được đặt tên bằng danh từ hoặc cụm danh từ, chẳng hạn như `height`, `digits`, hoặc `bodyStyle`. Các quy ước ngữ pháp cho biến cục bộ tương tự như cho field nhưng còn lỏng lẻo hơn.

Tóm lại, hãy thấm nhuần các quy ước đặt tên chuẩn và học cách dùng chúng như bản năng thứ hai. Các quy ước về hình thức thì đơn giản và phần lớn không mơ hồ; các quy ước về ngữ pháp thì phức tạp hơn và lỏng lẻo hơn. Trích dẫn từ *The Java Language Specification* [JLS, 6.1], “Những quy ước này không nên được tuân theo một cách mù quáng nếu cách dùng thông thường đã tồn tại lâu đời quy định khác đi.” Hãy dùng lẽ thường.
