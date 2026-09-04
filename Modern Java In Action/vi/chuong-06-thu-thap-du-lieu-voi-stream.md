# Chương 6. Thu thập dữ liệu với stream

> **Nội dung chương này**
>
> - Tạo và sử dụng collector với lớp Collectors
> - Rút gọn (reduce) các stream dữ liệu về một giá trị duy nhất
> - Tổng hợp (summarization) như một trường hợp đặc biệt của phép reduction
> - Nhóm (grouping) và phân hoạch (partitioning) dữ liệu
> - Xây dựng collector tuỳ biến của riêng bạn

Ở chương trước bạn đã học rằng stream giúp bạn xử lý các collection bằng những phép toán giống như trong cơ sở dữ liệu. Bạn có thể xem stream trong Java 8 như những iterator "hoa mỹ" và lười (lazy) trên các tập dữ liệu. Chúng hỗ trợ hai loại phép toán: intermediate operation như `filter` hay `map`, và terminal operation như `count`, `findFirst`, `forEach` và `reduce`. Các intermediate operation có thể được nối chuỗi (chain) lại với nhau để biến một stream thành một stream khác. Những phép toán này không tiêu thụ dữ liệu từ stream; mục đích của chúng là thiết lập một pipeline của các stream. Ngược lại, terminal operation thì có tiêu thụ dữ liệu từ stream — để tạo ra một kết quả cuối cùng (ví dụ, trả về phần tử lớn nhất trong một stream). Chúng thường có thể rút ngắn quá trình tính toán bằng cách tối ưu hoá pipeline của stream.

Chúng ta đã dùng terminal operation `collect` trên stream ở chương 4 và chương 5, nhưng ở đó chủ yếu để gộp toàn bộ các phần tử của một stream vào một `List`. Trong chương này, bạn sẽ khám phá rằng `collect` là một phép reduction, giống như `reduce`, nhận vào đối số là những "công thức" khác nhau để tích luỹ các phần tử của một stream thành một kết quả tổng hợp. Những công thức này được định nghĩa bởi một interface mới tên là `Collector`, vì vậy điều quan trọng là phải phân biệt được `Collection`, `Collector` và `collect`!

Dưới đây là một vài ví dụ về những truy vấn bạn sẽ có thể thực hiện bằng `collect` và các collector:

- Nhóm một danh sách các giao dịch theo loại tiền tệ để thu được tổng giá trị của tất cả giao dịch với loại tiền tệ đó (trả về `Map<Currency, Integer>`)
- Phân hoạch một danh sách các giao dịch thành hai nhóm: đắt tiền và không đắt tiền (trả về `Map<Boolean, List<Transaction>>`)
- Tạo các nhóm nhiều tầng, chẳng hạn nhóm giao dịch theo thành phố rồi phân loại tiếp theo tiêu chí đắt hay không đắt (trả về `Map<String, Map<Boolean, List<Transaction>>>`)

Hào hứng chứ? Tuyệt. Hãy bắt đầu bằng cách khám phá một ví dụ mà collector phát huy tác dụng. Hãy tưởng tượng tình huống bạn có một `List` các `Transaction`, và bạn muốn nhóm chúng lại dựa trên loại tiền tệ danh nghĩa của chúng. Trước Java 8, ngay cả một trường hợp đơn giản như thế này cũng khá rườm rà khi cài đặt, như minh hoạ trong listing dưới đây.

**Listing 6.1. Nhóm các giao dịch theo loại tiền tệ theo phong cách mệnh lệnh (imperative)**

```java
// Tạo Map để tích luỹ các giao dịch đã được nhóm
Map<Currency, List<Transaction>> transactionsByCurrencies = new HashMap<>();

// Duyệt qua List các Transaction
for (Transaction transaction : transactions) {
    // Trích xuất loại tiền tệ của Transaction
    Currency currency = transaction.getCurrency();
    List<Transaction> transactionsForCurrency =
            transactionsByCurrencies.get(currency);
    // Nếu chưa có entry nào trong Map nhóm cho loại tiền tệ này thì tạo mới
    if (transactionsForCurrency == null) {
        transactionsForCurrency = new ArrayList<>();
        transactionsByCurrencies.put(currency, transactionsForCurrency);
    }
    // Thêm Transaction đang duyệt vào List các Transaction cùng loại tiền tệ
    transactionsForCurrency.add(transaction);
}
```

Nếu bạn là một lập trình viên Java có kinh nghiệm, có lẽ bạn sẽ thấy thoải mái khi viết đoạn code như thế này, nhưng bạn phải thừa nhận rằng đó là quá nhiều code cho một nhiệm vụ đơn giản như vậy. Tệ hơn nữa, đoạn code này có lẽ còn khó đọc hơn là khó viết! Mục đích của đoạn code không lộ ra ngay lập tức khi nhìn thoáng qua, mặc dù nó có thể được diễn đạt một cách hết sức đơn giản bằng tiếng Anh thông thường: "Nhóm một danh sách các giao dịch theo loại tiền tệ của chúng." Như bạn sẽ học trong chương này, bạn có thể đạt được chính xác kết quả đó chỉ với một câu lệnh duy nhất, bằng cách dùng một tham số `Collector` tổng quát hơn cho phương thức `collect` trên stream, thay vì trường hợp đặc biệt `toList` mà bạn đã dùng ở chương trước:

```java
Map<Currency, List<Transaction>> transactionsByCurrencies =
        transactions.stream().collect(groupingBy(Transaction::getCurrency));
```

Phép so sánh khá là "ngượng ngùng", phải không?

## 6.1. Tổng quan nhanh về collector

Ví dụ trên cho thấy rõ một trong những ưu điểm chính của lập trình theo phong cách hàm (functional-style programming) so với cách tiếp cận mệnh lệnh: bạn chỉ phải diễn đạt kết quả mà bạn muốn thu được — cái "gì" (the "what") — chứ không phải các bước cần thực hiện để thu được nó — cái "như thế nào" (the "how"). Trong ví dụ vừa rồi, đối số truyền cho phương thức `collect` là một phần cài đặt của interface `Collector`, vốn là một công thức mô tả cách xây dựng bản tóm tắt các phần tử trong stream. Ở chương trước, công thức `toList` nói rằng: "Hãy tạo một danh sách gồm lần lượt từng phần tử." Trong ví dụ này, công thức `groupingBy` nói rằng: "Hãy tạo một `Map` mà khoá của nó là các "rổ" (bucket) theo loại tiền tệ và giá trị là danh sách các phần tử nằm trong những rổ đó."

Sự khác biệt giữa phiên bản mệnh lệnh và phiên bản hàm của ví dụ này còn rõ rệt hơn nữa nếu bạn thực hiện nhóm nhiều tầng: khi đó code mệnh lệnh nhanh chóng trở nên khó đọc, khó bảo trì và khó sửa đổi vì số lượng vòng lặp lồng nhau sâu và các điều kiện cần thiết. Ngược lại, phiên bản theo phong cách hàm, như bạn sẽ khám phá ở mục 6.3, có thể dễ dàng được mở rộng chỉ bằng cách thêm một collector nữa.

### 6.1.1. Collector như những phép reduction nâng cao

Nhận xét cuối cùng này dẫn đến một lợi ích điển hình khác của một API hàm được thiết kế tốt: mức độ dễ kết hợp (composability) và tái sử dụng (reusability) cao. Collector cực kỳ hữu ích, bởi vì chúng cung cấp một cách ngắn gọn nhưng linh hoạt để định nghĩa tiêu chí mà `collect` dùng để tạo ra collection kết quả. Cụ thể hơn, việc gọi phương thức `collect` trên một stream sẽ kích hoạt một phép reduction (được tham số hoá bởi một `Collector`) trên chính các phần tử của stream đó. Phép reduction này, được minh hoạ ở hình 6.1, thực hiện giúp bạn ở bên trong đúng những gì bạn đã phải viết bằng phong cách mệnh lệnh ở listing 6.1. Nó duyệt qua từng phần tử của stream và để cho `Collector` xử lý chúng.

> **Hình 6.1.** Quá trình reduction nhóm các giao dịch theo loại tiền tệ

Thông thường, `Collector` áp dụng một hàm biến đổi (transforming function) lên phần tử. Khá thường xuyên, đây là phép biến đổi đồng nhất (identity transformation), tức là không có tác dụng gì (ví dụ như trong `toList`). Sau đó hàm này tích luỹ kết quả vào một cấu trúc dữ liệu tạo thành đầu ra cuối cùng của quá trình. Chẳng hạn, trong ví dụ nhóm giao dịch đã trình bày ở trên, hàm biến đổi trích xuất loại tiền tệ từ mỗi giao dịch, và sau đó bản thân giao dịch được tích luỹ vào `Map` kết quả, sử dụng loại tiền tệ làm khoá.

Phần cài đặt các phương thức của interface `Collector` định nghĩa cách thực hiện một phép reduction trên stream, chẳng hạn như phép trong ví dụ về loại tiền tệ của chúng ta. Chúng ta sẽ tìm hiểu cách tạo collector tuỳ biến ở mục 6.5 và 6.6. Nhưng lớp tiện ích `Collectors` đã cung cấp sẵn rất nhiều static factory method để tạo một cách tiện lợi các instance của những collector thông dụng nhất, sẵn sàng để dùng ngay. Collector đơn giản và được dùng thường xuyên nhất là static method `toList`, gom tất cả các phần tử của một stream vào một `List`:

```java
List<Transaction> transactions =
        transactionStream.collect(Collectors.toList());
```

### 6.1.2. Các collector định nghĩa sẵn

Trong phần còn lại của chương này, chúng ta sẽ chủ yếu khám phá các tính năng của những collector định nghĩa sẵn, tức những collector có thể được tạo ra từ các factory method (như `groupingBy`) do lớp `Collectors` cung cấp. Chúng cung cấp ba nhóm chức năng chính:

- Rút gọn (reduce) và tổng hợp (summarize) các phần tử của stream về một giá trị duy nhất
- Nhóm (group) các phần tử
- Phân hoạch (partition) các phần tử

Chúng ta bắt đầu với các collector cho phép bạn reduce và summarize. Chúng rất tiện lợi trong nhiều tình huống, chẳng hạn như tìm tổng giá trị của các giao dịch trong danh sách giao dịch ở ví dụ trước.

Sau đó, bạn sẽ thấy cách nhóm các phần tử của một stream, tổng quát hoá ví dụ trước lên nhiều tầng nhóm, hoặc kết hợp các collector khác nhau để áp dụng thêm những phép reduction trên từng nhóm con thu được. Chúng ta cũng sẽ mô tả partitioning như một trường hợp đặc biệt của grouping, dùng một predicate (một hàm một đối số trả về giá trị boolean) làm hàm phân nhóm.

Ở cuối mục 6.4, bạn sẽ tìm thấy một bảng tổng hợp tất cả các collector định nghĩa sẵn được khám phá trong chương này. Cuối cùng, ở mục 6.5 bạn sẽ tìm hiểu kỹ hơn về interface `Collector` trước khi khám phá (ở mục 6.6) cách tạo các collector tuỳ biến của riêng bạn để dùng cho những trường hợp mà các factory method của lớp `Collectors` không bao phủ.

## 6.2. Reduce và summarize

Để minh hoạ dải các instance collector khả dĩ có thể được tạo ra từ lớp factory `Collectors`, chúng ta sẽ tái sử dụng miền bài toán đã giới thiệu ở chương trước: một thực đơn gồm danh sách những món ăn ngon!

Như bạn đã học, collector (tham số cho phương thức `collect` của stream) thường được dùng trong những trường hợp cần tổ chức lại các phần tử của stream thành một collection. Nhưng tổng quát hơn, chúng có thể được dùng mỗi khi bạn muốn kết hợp tất cả các phần tử trong stream thành một kết quả duy nhất. Kết quả này có thể thuộc bất kỳ kiểu nào, phức tạp như một map nhiều tầng biểu diễn một cây, hay đơn giản như một số nguyên duy nhất, chẳng hạn biểu diễn tổng số calo trong thực đơn. Chúng ta sẽ xem xét cả hai loại kết quả này: số nguyên đơn lẻ ở mục 6.2.2 và nhóm nhiều tầng ở mục 6.3.1.

Như một ví dụ đơn giản đầu tiên, hãy đếm số món ăn trong thực đơn, dùng collector do factory method `counting` trả về:

```java
long howManyDishes = menu.stream().collect(Collectors.counting());
```

Bạn có thể viết trực tiếp hơn nhiều như sau:

```java
long howManyDishes = menu.stream().count();
```

nhưng collector `counting` sẽ trở nên hữu ích khi được dùng kết hợp với các collector khác, như chúng ta sẽ minh hoạ về sau.

Trong phần còn lại của chương này, chúng ta sẽ giả định rằng bạn đã import tất cả các static factory method của lớp `Collectors` bằng:

```java
import static java.util.stream.Collectors.*;
```

để bạn có thể viết `counting()` thay vì `Collectors.counting()`, và tương tự cho các phương thức khác.

Hãy tiếp tục khám phá các collector định nghĩa sẵn đơn giản bằng cách xem cách tìm giá trị lớn nhất và nhỏ nhất trong một stream.

### 6.2.1. Tìm giá trị lớn nhất và nhỏ nhất trong một stream các giá trị

Giả sử bạn muốn tìm món ăn nhiều calo nhất trong thực đơn. Bạn có thể dùng hai collector, `Collectors.maxBy` và `Collectors.minBy`, để tính giá trị lớn nhất hoặc nhỏ nhất trong một stream. Hai collector này nhận một `Comparator` làm đối số để so sánh các phần tử trong stream. Ở đây bạn tạo một `Comparator` so sánh các món ăn dựa trên lượng calo của chúng và truyền nó cho `Collectors.maxBy`:

```java
Comparator<Dish> dishCaloriesComparator =
        Comparator.comparingInt(Dish::getCalories);

Optional<Dish> mostCalorieDish =
        menu.stream()
            .collect(maxBy(dishCaloriesComparator));
```

Có thể bạn thắc mắc `Optional<Dish>` là gì. Để trả lời điều này, ta phải đặt câu hỏi: "Nếu `menu` rỗng thì sao?" Sẽ chẳng có món ăn nào để trả về cả! Java 8 giới thiệu `Optional`, một container có thể chứa hoặc không chứa một giá trị. Ở đây nó biểu diễn hoàn hảo ý tưởng rằng có thể có hoặc không có một món ăn được trả về. Chúng ta đã đề cập ngắn gọn về nó ở chương 5 khi bạn gặp phương thức `findAny`. Đừng lo lắng về nó lúc này; chúng ta dành cả chương 11 để nghiên cứu `Optional<T>` và các phép toán của nó.

Một phép reduction phổ biến khác trả về một giá trị duy nhất là cộng tổng các giá trị của một trường số học trong các đối tượng của stream. Hoặc bạn có thể muốn tính trung bình các giá trị đó. Những phép toán như vậy được gọi là phép tổng hợp (summarization operation). Hãy xem cách diễn đạt chúng bằng collector.

### 6.2.2. Summarization

Lớp `Collectors` cung cấp một factory method chuyên dụng cho phép cộng tổng: `Collectors.summingInt`. Nó nhận một hàm ánh xạ một đối tượng thành số `int` cần được cộng, và trả về một collector mà khi được truyền cho phương thức `collect` quen thuộc sẽ thực hiện phép tổng hợp được yêu cầu. Chẳng hạn, bạn có thể tìm tổng số calo trong danh sách thực đơn của mình với:

```java
int totalCalories = menu.stream().collect(summingInt(Dish::getCalories));
```

Ở đây quá trình thu thập diễn ra như minh hoạ ở hình 6.2. Trong khi duyệt stream, mỗi món ăn được ánh xạ thành số calo của nó, và số đó được cộng vào một bộ tích luỹ (accumulator) khởi đầu từ một giá trị ban đầu (trong trường hợp này giá trị đó là 0).

> **Hình 6.2.** Quá trình tổng hợp của collector `summingInt`

Các phương thức `Collectors.summingLong` và `Collectors.summingDouble` hoạt động y hệt như vậy và có thể được dùng khi trường cần cộng tổng lần lượt là kiểu `long` hoặc `double`.

Nhưng summarization còn nhiều hơn là chỉ cộng tổng. `Collectors.averagingInt`, cùng với các "anh em" `averagingLong` và `averagingDouble`, cũng có sẵn để tính giá trị trung bình của cùng tập giá trị số học đó:

```java
double avgCalories =
        menu.stream().collect(averagingInt(Dish::getCalories));
```

Cho đến giờ, bạn đã thấy cách dùng collector để đếm số phần tử trong một stream, tìm giá trị lớn nhất và nhỏ nhất của một thuộc tính số học của những phần tử đó, và tính tổng cũng như trung bình của chúng. Tuy nhiên, khá thường xuyên bạn có thể muốn lấy về hai hoặc nhiều hơn trong số những kết quả này, và có thể bạn muốn làm điều đó chỉ trong một thao tác duy nhất. Trong trường hợp này, bạn có thể dùng collector do factory method `summarizingInt` trả về. Ví dụ, bạn có thể đếm số phần tử trong thực đơn và thu được tổng, trung bình, lớn nhất và nhỏ nhất của lượng calo chứa trong mỗi món ăn chỉ bằng một thao tác summarizing duy nhất:

```java
IntSummaryStatistics menuStatistics =
        menu.stream().collect(summarizingInt(Dish::getCalories));
```

Collector này thu thập toàn bộ thông tin đó vào một lớp có tên `IntSummaryStatistics`, cung cấp các getter tiện lợi để truy cập kết quả. In đối tượng `menuStatistics` ra sẽ cho kết quả sau:

```text
IntSummaryStatistics{count=9, sum=4300, min=120,
                     average=477.777778, max=800}
```

Như thường lệ, cũng có các factory method tương ứng là `summarizingLong` và `summarizingDouble` với các kiểu liên quan `LongSummaryStatistics` và `DoubleSummaryStatistics`. Chúng được dùng khi thuộc tính cần thu thập thuộc kiểu primitive `long` hoặc `double`.

### 6.2.3. Nối chuỗi (joining String)

Collector do factory method `joining` trả về nối vào một chuỗi duy nhất tất cả các chuỗi thu được từ việc gọi phương thức `toString` trên mỗi đối tượng trong stream. Điều này có nghĩa là bạn có thể nối tên của tất cả các món ăn trong thực đơn như sau:

```java
String shortMenu = menu.stream().map(Dish::getName).collect(joining());
```

Lưu ý rằng `joining` bên trong sử dụng một `StringBuilder` để nối các chuỗi được sinh ra thành một chuỗi duy nhất. Cũng lưu ý rằng nếu lớp `Dish` có một phương thức `toString` trả về tên của món ăn, bạn sẽ thu được cùng kết quả mà không cần `map` trên stream ban đầu bằng một hàm trích xuất tên từ mỗi món ăn:

```java
String shortMenu = menu.stream().collect(joining());
```

Cả hai đều tạo ra chuỗi

```text
porkbeefchickenfrench friesriceseason fruitpizzaprawnssalmon
```

vốn rất khó đọc. May thay, factory method `joining` được overload, với một trong các biến thể của nó nhận vào một chuỗi dùng để ngăn cách hai phần tử liên tiếp, nhờ đó bạn có thể thu được danh sách tên các món ăn phân tách bởi dấu phẩy với:

```java
String shortMenu = menu.stream().map(Dish::getName).collect(joining(", "));
```

và như mong đợi, nó sẽ sinh ra

```text
pork, beef, chicken, french fries, rice, season fruit, pizza, prawns, salmon
```

Đến đây, chúng ta đã khám phá nhiều collector khác nhau rút gọn một stream về một giá trị duy nhất. Trong mục tiếp theo, chúng ta sẽ chứng minh rằng tất cả các quá trình reduction dạng này đều là những trường hợp đặc biệt của collector reduction tổng quát hơn do factory method `Collectors.reducing` cung cấp.

### 6.2.4. Summarization tổng quát với reduction

Tất cả các collector chúng ta đã bàn đến cho tới giờ thực chất chỉ là những chuyên biệt hoá tiện lợi của một quá trình reduction có thể được định nghĩa bằng factory method `reducing`. Factory method `Collectors.reducing` là dạng tổng quát hoá của tất cả chúng. Các trường hợp đặc biệt đã bàn ở trên được cung cấp có lẽ chỉ vì sự tiện lợi cho lập trình viên. (Nhưng hãy nhớ rằng sự tiện lợi cho lập trình viên và tính dễ đọc là những điều tối quan trọng!) Chẳng hạn, có thể tính tổng số calo trong thực đơn của bạn bằng một collector được tạo từ phương thức `reducing` như sau:

```java
int totalCalories = menu.stream().collect(reducing(
                            0, Dish::getCalories, (i, j) -> i + j));
```

Nó nhận ba đối số:

- Đối số thứ nhất là giá trị khởi đầu của phép reduction và cũng sẽ là giá trị được trả về trong trường hợp stream không có phần tử nào; rõ ràng 0 là giá trị thích hợp trong trường hợp cộng tổng số học.
- Đối số thứ hai chính là hàm bạn đã dùng ở mục 6.2.2 để biến đổi một món ăn thành một số `int` biểu diễn lượng calo của nó.
- Đối số thứ ba là một `BinaryOperator` gộp hai phần tử thành một giá trị duy nhất cùng kiểu. Ở đây, nó cộng hai số `int`.

Tương tự, bạn có thể tìm món ăn nhiều calo nhất bằng phiên bản một đối số của `reducing` như sau:

```java
Optional<Dish> mostCalorieDish =
        menu.stream().collect(reducing(
            (d1, d2) -> d1.getCalories() > d2.getCalories() ? d1 : d2));
```

Bạn có thể xem collector được tạo bằng factory method `reducing` một đối số như một trường hợp riêng của phiên bản ba đối số, trong đó nó dùng phần tử đầu tiên của stream làm điểm khởi đầu và dùng hàm đồng nhất (identity function — hàm trả về nguyên vẹn đối số đầu vào) làm hàm biến đổi. Điều này cũng ngụ ý rằng collector `reducing` một đối số sẽ không có điểm khởi đầu nào khi được truyền cho phương thức `collect` của một stream rỗng, và vì lý do đó, như chúng ta đã giải thích ở mục 6.2.1, nó trả về một đối tượng `Optional<Dish>`.

> **collect so với reduce**
>
> Chúng ta đã bàn rất nhiều về reduction ở chương trước và chương này. Có thể bạn thắc mắc sự khác biệt giữa phương thức `collect` và `reduce` của interface stream là gì, bởi vì thường thì bạn có thể thu được cùng kết quả bằng cả hai phương thức. Chẳng hạn, bạn có thể đạt được điều mà `Collector` `toList` làm bằng phương thức `reduce` như sau:
>
> ```java
> Stream<Integer> stream = Arrays.asList(1, 2, 3, 4, 5, 6).stream();
> List<Integer> numbers = stream.reduce(
>         new ArrayList<Integer>(),
>         (List<Integer> l, Integer e) -> {
>             l.add(e);
>             return l; },
>         (List<Integer> l1, List<Integer> l2) -> {
>             l1.addAll(l2);
>             return l1; });
> ```
>
> Giải pháp này có hai vấn đề: một vấn đề về ngữ nghĩa và một vấn đề về thực tiễn. Vấn đề ngữ nghĩa nằm ở chỗ phương thức `reduce` được thiết kế để kết hợp hai giá trị và tạo ra một giá trị mới; đó là một phép reduction bất biến (immutable reduction). Ngược lại, phương thức `collect` được thiết kế để biến đổi (mutate) một container nhằm tích luỹ kết quả mà nó cần tạo ra. Điều này có nghĩa là đoạn code trên đang lạm dụng sai phương thức `reduce`, vì nó thay đổi tại chỗ (mutate in place) cái `List` được dùng làm accumulator. Như bạn sẽ thấy chi tiết hơn ở chương sau, việc dùng phương thức `reduce` với ngữ nghĩa sai cũng chính là nguyên nhân của một vấn đề thực tiễn: quá trình reduction này không thể hoạt động song song, bởi vì việc nhiều thread cùng sửa đổi đồng thời một cấu trúc dữ liệu có thể làm hỏng chính cái `List` đó. Trong trường hợp này, nếu bạn muốn an toàn với thread (thread safety), bạn sẽ phải cấp phát một `List` mới mỗi lần, và điều đó sẽ làm giảm hiệu năng do việc cấp phát đối tượng. Đây là lý do chính khiến phương thức `collect` hữu ích để diễn đạt một phép reduction làm việc trên một container mutable nhưng quan trọng là theo cách thân thiện với xử lý song song, như bạn sẽ học ở phần sau của chương này.

> **Sự linh hoạt của Collection framework: làm cùng một việc theo nhiều cách khác nhau**
>
> Bạn có thể đơn giản hoá thêm ví dụ cộng tổng ở trên khi dùng collector `reducing`, bằng cách dùng một tham chiếu tới phương thức `sum` của lớp `Integer` thay vì lambda expression mà bạn đã dùng để mã hoá cùng phép toán đó. Kết quả như sau:
>
> ```java
> int totalCalories = menu.stream().collect(reducing(
>         0,                    // Giá trị khởi tạo
>         Dish::getCalories,    // Hàm biến đổi
>         Integer::sum));       // Hàm gộp
> ```
>
> Về mặt logic, phép reduction này diễn ra như minh hoạ ở hình 6.3, trong đó một accumulator — được khởi tạo bằng một giá trị khởi đầu — được kết hợp lặp đi lặp lại bằng một hàm gộp, với kết quả của việc áp dụng hàm biến đổi lên từng phần tử của stream.
>
> > **Hình 6.3.** Quá trình reduction tính tổng số calo trong thực đơn
>
> Collector `counting` mà chúng ta đã đề cập ở đầu mục 6.2 thực chất cũng được cài đặt tương tự bằng factory method `reducing` ba đối số. Nó biến đổi mỗi phần tử trong stream thành một đối tượng kiểu `Long` có giá trị 1 rồi cộng tất cả những số 1 này lại. Nó được cài đặt như sau:
>
> ```java
> public static <T> Collector<T, ?, Long> counting() {
>     return reducing(0L, e -> 1L, Long::sum);
> }
> ```

> **Cách dùng wildcard `?` trong generic**
>
> Trong đoạn code vừa trình bày, có lẽ bạn đã để ý tới wildcard `?`, được dùng làm kiểu generic thứ hai trong chữ ký của collector do factory method `counting` trả về. Bạn hẳn đã quen với ký hiệu này, đặc biệt nếu bạn dùng Java Collection Framework khá thường xuyên. Nhưng ở đây nó chỉ có nghĩa là kiểu của accumulator của collector là không xác định, hay tương đương, bản thân accumulator có thể thuộc bất kỳ kiểu nào. Chúng tôi dùng nó ở đây để mô tả chính xác chữ ký của phương thức như nó được định nghĩa ban đầu trong lớp `Collectors`, nhưng trong phần còn lại của chương, chúng tôi sẽ tránh mọi ký hiệu wildcard để giữ cho phần trình bày đơn giản nhất có thể.

Chúng ta đã quan sát ở chương 5 rằng có một cách khác để thực hiện cùng phép toán mà không cần dùng collector — bằng cách map stream các món ăn thành số calo của mỗi món rồi reduce stream kết quả bằng cùng method reference đã dùng ở phiên bản trước:

```java
int totalCalories =
        menu.stream().map(Dish::getCalories).reduce(Integer::sum).get();
```

Lưu ý rằng, giống như bất kỳ phép `reduce` một đối số nào trên stream, lời gọi `reduce(Integer::sum)` không trả về một `int` mà là một `Optional<Integer>` để xử lý trường hợp reduction trên một stream rỗng theo cách an toàn với null. Ở đây bạn trích xuất giá trị bên trong đối tượng `Optional` bằng phương thức `get` của nó. Lưu ý rằng trong trường hợp này việc dùng phương thức `get` chỉ an toàn vì bạn chắc chắn rằng stream các món ăn không rỗng. Nói chung, như bạn sẽ học ở chương 10, an toàn hơn là nên trích xuất (unwrap) giá trị có thể có bên trong một `Optional` bằng một phương thức cũng cho phép bạn cung cấp giá trị mặc định, chẳng hạn `orElse` hoặc `orElseGet`. Cuối cùng, và còn ngắn gọn hơn nữa, bạn có thể đạt được cùng kết quả bằng cách map stream sang một `IntStream` rồi gọi phương thức `sum` trên nó:

```java
int totalCalories = menu.stream().mapToInt(Dish::getCalories).sum();
```

> **Chọn giải pháp tốt nhất cho tình huống của bạn**
>
> Một lần nữa, điều này cho thấy lập trình hàm nói chung (và nói riêng là API mới dựa trên các nguyên lý phong cách hàm được thêm vào Collections framework trong Java 8) thường cung cấp nhiều cách để thực hiện cùng một phép toán. Ví dụ này cũng cho thấy rằng collector có phần phức tạp hơn để sử dụng so với các phương thức có sẵn trực tiếp trên interface `Stream`, nhưng đổi lại chúng cung cấp mức trừu tượng và tổng quát hoá cao hơn, đồng thời dễ tái sử dụng và tuỳ biến hơn.
>
> Gợi ý của chúng tôi là hãy khám phá càng nhiều giải pháp khả dĩ cho vấn đề trước mắt càng tốt, nhưng luôn chọn giải pháp chuyên biệt nhất mà vẫn đủ tổng quát để giải quyết nó. Đây thường là quyết định tốt nhất xét cả về tính dễ đọc lẫn hiệu năng. Chẳng hạn, để tính tổng số calo trong thực đơn của chúng ta, chúng tôi sẽ ưu tiên giải pháp cuối cùng (dùng `IntStream`) vì nó ngắn gọn nhất và nhiều khả năng cũng dễ đọc nhất. Đồng thời, nó cũng là giải pháp có hiệu năng tốt nhất, bởi `IntStream` cho phép chúng ta tránh được toàn bộ các phép auto-unboxing, tức các phép chuyển đổi ngầm từ `Integer` sang `int`, vốn vô ích trong trường hợp này.

Tiếp theo, hãy kiểm tra mức độ hiểu biết của bạn về cách `reducing` có thể được dùng như một dạng tổng quát hoá của các collector khác bằng cách làm bài tập trong quiz 6.1.

---

**Quiz 6.1: Nối chuỗi bằng reducing**

Câu lệnh nào trong số các câu lệnh dưới đây dùng collector `reducing` là những thay thế hợp lệ cho collector `joining` này (như đã dùng ở mục 6.2.3)?

```java
String shortMenu = menu.stream().map(Dish::getName).collect(joining());
```

1. ```java
   String shortMenu = menu.stream().map(Dish::getName)
           .collect( reducing( (s1, s2) -> s1 + s2 ) ).get();
   ```

2. ```java
   String shortMenu = menu.stream()
           .collect( reducing( (d1, d2) -> d1.getName() + d2.getName() )
           ).get();
   ```

3. ```java
   String shortMenu = menu.stream()
           .collect( reducing( "", Dish::getName, (s1, s2) -> s1 + s2 ) );
   ```

**Đáp án:**

Câu lệnh 1 và 3 là hợp lệ, còn câu 2 không biên dịch được.

1. Câu này chuyển mỗi món ăn thành tên của nó, giống như câu lệnh gốc dùng collector `joining`, rồi reduce stream các chuỗi thu được bằng cách dùng một `String` làm accumulator và nối vào đó lần lượt tên của các món ăn.
2. Câu này không biên dịch được vì đối số duy nhất mà `reducing` nhận là một `BinaryOperator<T>`, vốn là một `BiFunction<T,T,T>`. Điều này có nghĩa là nó cần một hàm nhận hai đối số và trả về một giá trị cùng kiểu, nhưng lambda expression được dùng ở đó nhận hai món ăn (`Dish`) làm đối số nhưng lại trả về một chuỗi.
3. Câu này bắt đầu quá trình reduction với một chuỗi rỗng làm accumulator, và khi duyệt stream các món ăn, nó chuyển mỗi món ăn thành tên của nó rồi nối tên này vào accumulator. Lưu ý rằng, như chúng ta đã đề cập, `reducing` phiên bản ba đối số không cần trả về `Optional` bởi vì trong trường hợp stream rỗng nó có thể trả về một giá trị có ý nghĩa hơn, chính là chuỗi rỗng được dùng làm giá trị accumulator ban đầu.

Lưu ý rằng mặc dù câu lệnh 1 và 3 là những thay thế hợp lệ cho collector `joining`, chúng được dùng ở đây để minh hoạ cách mà `reducing` có thể được nhìn nhận, ít nhất là về mặt khái niệm, như một dạng tổng quát hoá của tất cả các collector khác được bàn đến trong chương này. Tuy nhiên, xét về mọi mục đích thực tiễn, chúng tôi luôn khuyên dùng collector `joining` vì lý do cả tính dễ đọc lẫn hiệu năng.

---

## 6.3. Grouping

Một phép toán phổ biến trong cơ sở dữ liệu là nhóm các phần tử trong một tập hợp dựa trên một hoặc nhiều thuộc tính. Như bạn đã thấy ở ví dụ nhóm giao dịch theo loại tiền tệ trước đó, phép toán này có thể trở nên rườm rà, dài dòng và dễ sinh lỗi khi được cài đặt theo phong cách mệnh lệnh. Nhưng nó có thể dễ dàng được diễn đạt lại thành một câu lệnh duy nhất, dễ đọc, bằng cách viết lại theo phong cách hàm mà Java 8 khuyến khích. Như một ví dụ thứ hai về cách tính năng này hoạt động, giả sử bạn muốn phân loại các món ăn trong thực đơn theo kiểu của chúng, đưa những món chứa thịt vào một nhóm, những món có cá vào một nhóm khác, và tất cả những món còn lại vào nhóm thứ ba. Bạn có thể dễ dàng thực hiện việc này bằng collector do factory method `Collectors.groupingBy` trả về, như sau:

```java
Map<Dish.Type, List<Dish>> dishesByType =
        menu.stream().collect(groupingBy(Dish::getType));
```

Kết quả sẽ là `Map` sau:

```text
{FISH=[prawns, salmon], OTHER=[french fries, rice, season fruit, pizza],
 MEAT=[pork, beef, chicken]}
```

Ở đây, bạn truyền cho phương thức `groupingBy` một `Function` (được biểu diễn dưới dạng một method reference) trích xuất `Dish.Type` tương ứng cho mỗi `Dish` trong stream. Chúng ta gọi `Function` này là một hàm phân loại (classification function), chính xác là vì nó được dùng để phân loại các phần tử của stream vào những nhóm khác nhau. Kết quả của phép grouping này, được minh hoạ ở hình 6.4, là một `Map` có khoá là giá trị do hàm phân loại trả về, và giá trị tương ứng là danh sách tất cả các phần tử trong stream mang giá trị phân loại đó. Trong ví dụ phân loại thực đơn, một khoá là kiểu của món ăn, và giá trị của nó là danh sách chứa tất cả các món ăn thuộc kiểu đó.

> **Hình 6.4.** Việc phân loại một phần tử trong stream trong quá trình grouping

Nhưng không phải lúc nào cũng có thể dùng một method reference làm hàm phân loại, bởi bạn có thể muốn phân loại theo một tiêu chí phức tạp hơn là một accessor thuộc tính đơn giản. Chẳng hạn, bạn có thể quyết định phân loại là "diet" tất cả những món có từ 400 calo trở xuống, đặt là "normal" những món có từ 400 đến 700 calo, và đặt là "fat" những món có hơn 700 calo. Bởi vì tác giả của lớp `Dish` đã không cung cấp sẵn một phép toán như vậy dưới dạng phương thức, bạn không thể dùng method reference trong trường hợp này, nhưng bạn có thể diễn đạt logic đó bằng một lambda expression:

```java
public enum CaloricLevel { DIET, NORMAL, FAT }

Map<CaloricLevel, List<Dish>> dishesByCaloricLevel = menu.stream().collect(
        groupingBy(dish -> {
            if (dish.getCalories() <= 400) return CaloricLevel.DIET;
            else if (dish.getCalories() <= 700) return CaloricLevel.NORMAL;
            else return CaloricLevel.FAT;
        } ));
```

Bây giờ bạn đã thấy cách nhóm các món ăn trong thực đơn, cả theo kiểu lẫn theo calo, nhưng cũng khá phổ biến là bạn cần thao tác thêm trên kết quả của phép nhóm ban đầu, và ở mục tiếp theo chúng ta sẽ chỉ ra cách làm điều đó.

### 6.3.1. Thao tác trên các phần tử đã được nhóm

Sau khi thực hiện một phép grouping, bạn thường cần thao tác trên các phần tử trong mỗi nhóm kết quả. Chẳng hạn giả sử bạn muốn lọc ra chỉ những món nhiều calo, ví dụ những món có hơn 500 calo. Bạn có thể lập luận rằng trong trường hợp này bạn có thể áp dụng predicate lọc này trước khi nhóm, như sau:

```java
Map<Dish.Type, List<Dish>> caloricDishesByType =
        menu.stream().filter(dish -> dish.getCalories() > 500)
                     .collect(groupingBy(Dish::getType));
```

Giải pháp này chạy được nhưng có một nhược điểm có thể khá quan trọng. Nếu bạn thử áp dụng nó lên các món ăn trong thực đơn của chúng ta, bạn sẽ thu được một `Map` như sau:

```text
{OTHER=[french fries, pizza], MEAT=[pork, beef]}
```

Bạn có thấy vấn đề ở đây không? Bởi vì không có món nào thuộc kiểu `FISH` thoả mãn predicate lọc của chúng ta, khoá đó đã hoàn toàn biến mất khỏi map kết quả. Để khắc phục vấn đề này, lớp `Collectors` overload factory method `groupingBy`, với một biến thể nhận thêm đối số thứ hai kiểu `Collector` bên cạnh hàm phân loại thông thường. Bằng cách đó, có thể chuyển predicate lọc vào bên trong `Collector` thứ hai này, như sau:

```java
Map<Dish.Type, List<Dish>> caloricDishesByType =
        menu.stream()
            .collect(groupingBy(Dish::getType,
                     filtering(dish -> dish.getCalories() > 500, toList())));
```

Phương thức `filtering` là một static factory method khác của lớp `Collectors`, nhận một `Predicate` để lọc các phần tử trong mỗi nhóm và một `Collector` nữa dùng để gom lại các phần tử đã lọc. Bằng cách này, `Map` kết quả sẽ vẫn giữ một entry cho kiểu `FISH` ngay cả khi nó ánh xạ tới một `List` rỗng:

```text
{OTHER=[french fries, pizza], MEAT=[pork, beef], FISH=[]}
```

Một cách khác thậm chí còn phổ biến hơn để thao tác hữu ích trên các phần tử đã nhóm là biến đổi chúng thông qua một hàm ánh xạ. Với mục đích này, tương tự như những gì bạn đã thấy với `Collector` `filtering`, lớp `Collectors` cung cấp một `Collector` khác thông qua phương thức `mapping`, nhận một hàm ánh xạ và một `Collector` khác dùng để gom các phần tử thu được từ việc áp dụng hàm đó lên từng phần tử. Bằng cách dùng nó, chẳng hạn bạn có thể chuyển mỗi `Dish` trong các nhóm thành tên tương ứng của chúng như sau:

```java
Map<Dish.Type, List<String>> dishNamesByType =
        menu.stream()
            .collect(groupingBy(Dish::getType,
                     mapping(Dish::getName, toList())));
```

Lưu ý rằng trong trường hợp này mỗi nhóm trong `Map` kết quả là một `List` các `String` chứ không phải các `Dish` như ở những ví dụ trước. Bạn cũng có thể dùng một `Collector` thứ ba kết hợp với `groupingBy` để thực hiện một phép biến đổi `flatMap` thay vì một `map` thông thường. Để minh hoạ cách hoạt động, giả sử chúng ta có một `Map` gán cho mỗi `Dish` một danh sách các tag như sau:

```java
Map<String, List<String>> dishTags = new HashMap<>();
dishTags.put("pork", asList("greasy", "salty"));
dishTags.put("beef", asList("salty", "roasted"));
dishTags.put("chicken", asList("fried", "crisp"));
dishTags.put("french fries", asList("greasy", "fried"));
dishTags.put("rice", asList("light", "natural"));
dishTags.put("season fruit", asList("fresh", "natural"));
dishTags.put("pizza", asList("tasty", "salty"));
dishTags.put("prawns", asList("tasty", "roasted"));
dishTags.put("salmon", asList("delicious", "fresh"));
```

Trong trường hợp bạn cần trích xuất các tag này cho mỗi nhóm kiểu món ăn, bạn có thể dễ dàng đạt được điều đó bằng `Collector` `flatMapping`:

```java
Map<Dish.Type, Set<String>> dishNamesByType =
        menu.stream()
            .collect(groupingBy(Dish::getType,
                     flatMapping(dish -> dishTags.get( dish.getName() ).stream(),
                                 toSet())));
```

Ở đây với mỗi `Dish` chúng ta thu được một `List` các tag. Vì vậy, tương tự như những gì đã thấy ở chương trước, chúng ta cần thực hiện một phép `flatMap` để làm phẳng danh sách hai tầng kết quả thành một danh sách duy nhất. Cũng lưu ý rằng lần này chúng ta thu thập kết quả của các phép `flatMapping` được thực hiện trong mỗi nhóm vào một `Set` thay vì dùng một `List` như trước, nhằm tránh việc lặp lại cùng những tag gắn với nhiều `Dish` trong cùng một kiểu. `Map` thu được từ phép toán này khi đó là:

```text
{MEAT=[salty, greasy, roasted, fried, crisp], FISH=[roasted, tasty, fresh,
     delicious], OTHER=[salty, greasy, natural, light, tasty, fresh, fried]}
```

Cho đến lúc này chúng ta mới chỉ dùng một tiêu chí duy nhất để nhóm các món ăn trong thực đơn, chẳng hạn theo kiểu hoặc theo calo, nhưng sẽ thế nào nếu bạn muốn dùng nhiều hơn một tiêu chí cùng lúc? Grouping mạnh mẽ bởi vì nó kết hợp (compose) rất hiệu quả. Hãy xem cách làm điều này.

### 6.3.2. Nhóm nhiều tầng (Multilevel grouping)

Factory method `Collectors.groupingBy` hai đối số mà chúng ta đã dùng ở mục trước để thao tác trên các phần tử trong những nhóm thu được từ phép grouping cũng có thể được dùng để thực hiện nhóm hai tầng. Để đạt được điều đó, bạn có thể truyền cho `groupingBy` bên ngoài một `groupingBy` bên trong thứ hai, định nghĩa tiêu chí tầng hai để phân loại các phần tử của stream, như trong listing tiếp theo.

**Listing 6.2. Nhóm nhiều tầng**

```java
Map<Dish.Type, Map<CaloricLevel, List<Dish>>> dishesByTypeCaloricLevel =
menu.stream().collect(
    groupingBy(Dish::getType,          // Hàm phân loại tầng một
        groupingBy(dish -> {           // Hàm phân loại tầng hai
            if (dish.getCalories() <= 400) return CaloricLevel.DIET;
            else if (dish.getCalories() <= 700) return CaloricLevel.NORMAL;
            else return CaloricLevel.FAT;
        } )
    )
);
```

Kết quả của phép nhóm hai tầng này là một `Map` hai tầng như sau:

```text
{MEAT={DIET=[chicken], NORMAL=[beef], FAT=[pork]},
 FISH={DIET=[prawns], NORMAL=[salmon]},
 OTHER={DIET=[rice, seasonal fruit], NORMAL=[french fries, pizza]}}
```

Ở đây `Map` bên ngoài có khoá là các giá trị do hàm phân loại tầng một sinh ra: fish, meat, other. Các giá trị của `Map` này lần lượt lại là những `Map` khác, có khoá là các giá trị do hàm phân loại tầng hai sinh ra: normal, diet hoặc fat. Cuối cùng, các `Map` tầng hai có giá trị là `List` các phần tử trong stream mà khi áp dụng lần lượt hàm phân loại thứ nhất và thứ hai sẽ trả về đúng các giá trị khoá tầng một và tầng hai tương ứng: salmon, pizza, v.v. Phép grouping nhiều tầng này có thể được mở rộng ra bất kỳ số tầng nào, và một phép grouping n tầng cho kết quả là một `Map` n tầng, mô hình hoá một cấu trúc cây n tầng.

Hình 6.5 cho thấy cấu trúc này cũng tương đương với một bảng n chiều, làm nổi bật mục đích phân loại của phép grouping.

> **Hình 6.5.** Sự tương đương giữa map lồng nhau n tầng và bảng phân loại n chiều

Nói chung, sẽ dễ hình dung nếu ta nghĩ rằng `groupingBy` hoạt động theo kiểu "các rổ" (bucket). `groupingBy` đầu tiên tạo một rổ cho mỗi khoá. Sau đó bạn thu thập các phần tử trong mỗi rổ bằng collector phía dưới (downstream collector) và cứ thế tiếp tục để đạt được phép nhóm n tầng!

### 6.3.3. Thu thập dữ liệu trong các nhóm con

Ở mục trước, bạn đã thấy rằng có thể truyền một collector `groupingBy` thứ hai vào collector bên ngoài để đạt được phép nhóm nhiều tầng. Nhưng tổng quát hơn, collector thứ hai được truyền cho `groupingBy` thứ nhất có thể là bất kỳ loại collector nào, chứ không chỉ là một `groupingBy` khác. Chẳng hạn, có thể đếm số `Dish` trong thực đơn theo từng kiểu, bằng cách truyền collector `counting` làm đối số thứ hai cho collector `groupingBy`:

```java
Map<Dish.Type, Long> typesCount = menu.stream().collect(
        groupingBy(Dish::getType, counting()));
```

Kết quả là `Map` sau:

```text
{MEAT=3, FISH=2, OTHER=4}
```

Cũng lưu ý rằng dạng `groupingBy(f)` một đối số thông thường, trong đó `f` là hàm phân loại, thực chất chỉ là cách viết tắt cho `groupingBy(f, toList())`.

Để đưa ra một ví dụ khác, bạn có thể cải biên collector mà bạn đã dùng để tìm món ăn nhiều calo nhất trong thực đơn nhằm đạt được kết quả tương tự, nhưng lần này được phân loại theo kiểu món ăn:

```java
Map<Dish.Type, Optional<Dish>> mostCaloricByType =
        menu.stream()
            .collect(groupingBy(Dish::getType,
                                maxBy(comparingInt(Dish::getCalories))));
```

Kết quả của phép grouping này rõ ràng là một `Map`, có khoá là các kiểu `Dish` sẵn có và giá trị là các `Optional<Dish>`, bọc lấy `Dish` nhiều calo nhất cho kiểu tương ứng:

```text
{FISH=Optional[salmon], OTHER=Optional[pizza], MEAT=Optional[pork]}
```

> **Ghi chú**
>
> Các giá trị trong `Map` này là `Optional` bởi vì đó là kiểu kết quả của collector được sinh ra bởi factory method `maxBy`, nhưng thực tế nếu không có `Dish` nào trong thực đơn thuộc một kiểu nào đó thì kiểu đó sẽ không có `Optional.empty()` làm giá trị; nó sẽ hoàn toàn không xuất hiện như một khoá trong `Map`. Collector `groupingBy` chỉ thêm một khoá mới vào `Map` nhóm một cách lười biếng (lazily), vào đúng lần đầu tiên nó tìm thấy một phần tử trong stream sinh ra khoá đó khi áp dụng tiêu chí nhóm đang dùng. Điều này có nghĩa là trong trường hợp này, lớp bọc `Optional` không hữu ích, bởi vì nó không mô hình hoá một giá trị có thể vắng mặt mà chỉ tình cờ có mặt ở đó, đơn giản vì đó là kiểu do collector reducing trả về.

> **Điều chỉnh kết quả của collector sang một kiểu khác**
>
> Bởi vì các `Optional` bọc quanh tất cả các giá trị trong `Map` thu được từ phép grouping vừa rồi là không hữu ích trong trường hợp này, có thể bạn sẽ muốn loại bỏ chúng. Để đạt được điều đó, hoặc tổng quát hơn là để điều chỉnh kết quả do một collector trả về sang một kiểu khác, bạn có thể dùng collector do factory method `Collectors.collectingAndThen` trả về, như trong listing sau.

**Listing 6.3. Tìm món ăn nhiều calo nhất trong mỗi nhóm con**

```java
Map<Dish.Type, Dish> mostCaloricByType =
    menu.stream()
        .collect(groupingBy(Dish::getType,               // Hàm phân loại
                  collectingAndThen(
                    maxBy(comparingInt(Dish::getCalories)),  // Collector được bọc
                  Optional::get)));                          // Hàm biến đổi
```

Factory method này nhận hai đối số — collector cần được điều chỉnh và một hàm biến đổi — rồi trả về một collector khác. Collector bổ sung này đóng vai trò như một lớp bọc cho collector cũ và ánh xạ giá trị mà nó trả về bằng hàm biến đổi, như bước cuối cùng của phép `collect`. Trong trường hợp này, collector được bọc là collector được tạo bằng `maxBy`, còn hàm biến đổi `Optional::get` trích xuất giá trị chứa trong `Optional` được trả về. Như chúng ta đã nói, ở đây điều này an toàn vì collector reducing sẽ không bao giờ trả về `Optional.empty()`. Kết quả là `Map` sau:

```text
{FISH=salmon, OTHER=pizza, MEAT=pork}
```

Việc dùng nhiều collector lồng nhau là khá phổ biến, và ban đầu cách chúng tương tác với nhau không phải lúc nào cũng hiển nhiên. Hình 6.6 giúp bạn hình dung cách chúng phối hợp với nhau. Từ lớp ngoài cùng đi vào trong, hãy lưu ý những điểm sau:

- Các collector được biểu diễn bằng những đường nét đứt, nên `groupingBy` là collector ngoài cùng và nó nhóm stream thực đơn thành ba stream con theo các kiểu món ăn khác nhau.
- Collector `groupingBy` bọc lấy collector `collectingAndThen`, nên mỗi stream con thu được từ phép grouping lại tiếp tục được rút gọn bởi collector thứ hai này.
- Collector `collectingAndThen` đến lượt nó lại bọc một collector thứ ba, đó là `maxBy`.
- Phép reduction trên các stream con khi đó được thực hiện bởi collector reducing, nhưng collector `collectingAndThen` chứa nó sẽ áp dụng hàm biến đổi `Optional::get` lên kết quả của nó.
- Ba giá trị đã được biến đổi, chính là các `Dish` nhiều calo nhất cho từng kiểu (thu được từ việc thực thi quá trình này trên mỗi stream con trong ba stream con), sẽ là các giá trị gắn với những khoá phân loại tương ứng — các kiểu `Dish` — trong `Map` do collector `groupingBy` trả về.

> **Hình 6.6.** Kết hợp tác dụng của nhiều collector bằng cách lồng cái này vào trong cái kia

> **Các ví dụ khác về collector được dùng kết hợp với groupingBy**
>
> Tổng quát hơn, collector được truyền làm đối số thứ hai cho factory method `groupingBy` sẽ được dùng để thực hiện thêm một phép reduction trên tất cả các phần tử của stream được phân loại vào cùng một nhóm. Chẳng hạn, bạn cũng có thể tái sử dụng collector được tạo để cộng tổng calo của tất cả các món ăn trong thực đơn nhằm thu được kết quả tương tự, nhưng lần này là cho từng nhóm `Dish`:
>
> ```java
> Map<Dish.Type, Integer> totalCaloriesByType =
>         menu.stream().collect(groupingBy(Dish::getType,
>                  summingInt(Dish::getCalories)));
> ```
>
> Một collector khác nữa thường được dùng kết hợp với `groupingBy` là collector được sinh ra bởi phương thức `mapping`. Phương thức này nhận hai đối số: một hàm biến đổi các phần tử trong một stream và một collector nữa để tích luỹ các đối tượng thu được từ phép biến đổi đó. Mục đích của nó là điều chỉnh một collector vốn nhận các phần tử thuộc một kiểu nhất định thành một collector làm việc trên những đối tượng thuộc kiểu khác, bằng cách áp dụng một hàm ánh xạ lên từng phần tử đầu vào trước khi tích luỹ chúng. Để xem một ví dụ thực tế về việc dùng collector này, giả sử bạn muốn biết những `CaloricLevel` nào có sẵn trong thực đơn cho từng kiểu `Dish`. Bạn có thể đạt được kết quả này bằng cách kết hợp một collector `groupingBy` và một collector `mapping`, như sau:
>
> ```java
> Map<Dish.Type, Set<CaloricLevel>> caloricLevelsByType =
> menu.stream().collect(
>     groupingBy(Dish::getType, mapping(dish -> {
>             if (dish.getCalories() <= 400) return CaloricLevel.DIET;
>             else if (dish.getCalories() <= 700) return CaloricLevel.NORMAL;
>             else return CaloricLevel.FAT; },
>         toSet() )));
> ```
>
> Ở đây hàm biến đổi được truyền cho phương thức `mapping` ánh xạ một `Dish` thành `CaloricLevel` của nó, như bạn đã thấy trước đó. Stream các `CaloricLevel` thu được sau đó được truyền cho collector `toSet`, tương tự như `toList` nhưng tích luỹ các phần tử của stream vào một `Set` thay vì một `List`, để chỉ giữ lại những giá trị khác biệt. Như trong các ví dụ trước, collector `mapping` này khi đó sẽ được dùng để thu thập các phần tử trong mỗi stream con được sinh ra bởi hàm nhóm, cho phép bạn thu được kết quả là `Map` sau:
>
> ```text
> {OTHER=[DIET, NORMAL], MEAT=[DIET, NORMAL, FAT], FISH=[DIET, NORMAL]}
> ```
>
> Từ đó bạn có thể dễ dàng hình dung các lựa chọn của mình. Nếu bạn đang thèm cá và đang ăn kiêng, bạn có thể dễ dàng tìm được một món; tương tự, nếu bạn đang đói và muốn thứ gì đó nhiều calo, bạn có thể thoả mãn khẩu vị mạnh mẽ của mình bằng cách chọn thứ gì đó trong khu vực thịt của thực đơn. Lưu ý rằng trong ví dụ trước, không có gì đảm bảo về việc kiểu `Set` nào được trả về. Nhưng bằng cách dùng `toCollection`, bạn có thể kiểm soát nhiều hơn. Chẳng hạn, bạn có thể yêu cầu một `HashSet` bằng cách truyền vào một constructor reference tới nó:
>
> ```java
> Map<Dish.Type, Set<CaloricLevel>> caloricLevelsByType =
> menu.stream().collect(
>     groupingBy(Dish::getType, mapping(dish -> {
>             if (dish.getCalories() <= 400) return CaloricLevel.DIET;
>             else if (dish.getCalories() <= 700) return CaloricLevel.NORMAL;
>             else return CaloricLevel.FAT; },
>         toCollection(HashSet::new) )));
> ```

## 6.4. Partitioning

Partitioning (phân hoạch) là một trường hợp đặc biệt của grouping: dùng một predicate — được gọi là hàm phân hoạch (partitioning function) — làm hàm phân loại. Việc hàm phân hoạch trả về giá trị boolean có nghĩa là `Map` nhóm kết quả sẽ có khoá kiểu `Boolean`, và do đó, nhiều nhất chỉ có thể có hai nhóm khác nhau — một cho `true` và một cho `false`. Chẳng hạn, nếu bạn ăn chay hoặc đã mời một người bạn ăn chay đến ăn tối cùng, bạn có thể quan tâm đến việc phân hoạch thực đơn thành các món chay và không chay:

```java
Map<Boolean, List<Dish>> partitionedMenu =
        // Hàm phân hoạch
        menu.stream().collect(partitioningBy(Dish::isVegetarian));
```

Điều này sẽ trả về `Map` sau:

```text
{false=[pork, beef, chicken, prawns, salmon],
 true=[french fries, rice, season fruit, pizza]}
```

Vậy nên bạn có thể lấy về tất cả các món chay bằng cách lấy từ `Map` này giá trị được đánh chỉ mục bằng khoá `true`:

```java
List<Dish> vegetarianDishes = partitionedMenu.get(true);
```

Lưu ý rằng bạn có thể đạt được cùng kết quả bằng cách lọc stream được tạo từ `List` thực đơn với chính predicate đã dùng để phân hoạch rồi thu thập kết quả vào một `List` khác:

```java
List<Dish> vegetarianDishes =
        menu.stream().filter(Dish::isVegetarian).collect(toList());
```

### 6.4.1. Ưu điểm của partitioning

Partitioning có ưu điểm là giữ lại cả hai danh sách các phần tử của stream, tương ứng với việc áp dụng hàm phân hoạch trả về `true` hoặc `false`. Trong ví dụ trước, bạn có thể thu được `List` các `Dish` không chay bằng cách truy cập giá trị của khoá `false` trong `Map` `partitionedMenu`, thay vì phải dùng hai phép lọc riêng biệt: một với predicate và một với phủ định của nó. Ngoài ra, như bạn đã thấy với grouping, factory method `partitioningBy` cũng có một phiên bản overload mà bạn có thể truyền vào một collector thứ hai, như minh hoạ sau:

```java
Map<Boolean, Map<Dish.Type, List<Dish>>> vegetarianDishesByType =
menu.stream().collect(
        partitioningBy(Dish::isVegetarian,          // Hàm phân hoạch
                       groupingBy(Dish::getType))); // Collector thứ hai
```

Điều này sẽ tạo ra một `Map` hai tầng:

```text
{false={FISH=[prawns, salmon], MEAT=[pork, beef, chicken]},
 true={OTHER=[french fries, rice, season fruit, pizza]}}
```

Ở đây phép nhóm các món ăn theo kiểu của chúng được áp dụng riêng rẽ cho cả hai stream con gồm các món chay và không chay thu được từ phép phân hoạch, tạo ra một `Map` hai tầng tương tự như cái bạn đã thu được khi thực hiện nhóm hai tầng ở mục 6.3.1. Như một ví dụ khác, bạn có thể tái sử dụng code trước đó để tìm món nhiều calo nhất trong cả nhóm chay lẫn nhóm không chay:

```java
Map<Boolean, Dish> mostCaloricPartitionedByVegetarian =
menu.stream().collect(
    partitioningBy(Dish::isVegetarian,
            collectingAndThen(maxBy(comparingInt(Dish::getCalories)),
                              Optional::get)));
```

Kết quả sẽ là:

```text
{false=pork, true=pizza}
```

Chúng ta đã bắt đầu mục này bằng việc nói rằng bạn có thể xem partitioning như một trường hợp đặc biệt của grouping. Cũng đáng lưu ý rằng phần cài đặt `Map` do `partitioningBy` trả về gọn nhẹ và hiệu quả hơn, bởi nó chỉ cần chứa hai khoá: `true` và `false`. Thực tế, phần cài đặt bên trong là một `Map` chuyên biệt với hai trường. Những điểm tương đồng giữa collector `groupingBy` và `partitioningBy` không dừng lại ở đó; như bạn sẽ thấy trong quiz tiếp theo, bạn cũng có thể thực hiện phân hoạch nhiều tầng theo cách tương tự như bạn đã làm với grouping ở mục 6.3.1.

---

**Quiz 6.2: Sử dụng partitioningBy**

Như bạn đã thấy, giống như collector `groupingBy`, collector `partitioningBy` có thể được dùng kết hợp với các collector khác. Cụ thể, nó có thể được dùng với một collector `partitioningBy` thứ hai để đạt được phép phân hoạch nhiều tầng. Kết quả của những phép phân hoạch nhiều tầng dưới đây sẽ là gì?

1. ```java
   menu.stream().collect(partitioningBy(Dish::isVegetarian,
                             partitioningBy(d -> d.getCalories() > 500)));
   ```

2. ```java
   menu.stream().collect(partitioningBy(Dish::isVegetarian,
                             partitioningBy(Dish::getType)));
   ```

3. ```java
   menu.stream().collect(partitioningBy(Dish::isVegetarian,
                             counting()));
   ```

**Đáp án:**

1. Đây là một phép phân hoạch nhiều tầng hợp lệ, tạo ra `Map` hai tầng sau:

   ```text
   { false={false=[chicken, prawns, salmon], true=[pork, beef]},
     true={false=[rice, season fruit], true=[french fries, pizza]}}
   ```

2. Đoạn này sẽ không biên dịch được vì `partitioningBy` yêu cầu một predicate, tức một hàm trả về giá trị boolean. Và method reference `Dish::getType` không thể được dùng như một predicate.
3. Đoạn này đếm số phần tử trong mỗi phân hoạch, cho ra `Map` sau:

   ```text
   {false=5, true=4}
   ```

---

Để đưa ra một ví dụ cuối cùng về cách bạn có thể dùng collector `partitioningBy`, chúng ta sẽ gác lại mô hình dữ liệu thực đơn và xem xét một thứ phức tạp hơn một chút nhưng cũng thú vị hơn: phân hoạch các số thành số nguyên tố và không nguyên tố.

### 6.4.2. Phân hoạch các số thành nguyên tố và không nguyên tố

Giả sử bạn muốn viết một phương thức nhận vào đối số là một số `int` `n` và phân hoạch `n` số tự nhiên đầu tiên thành nguyên tố và không nguyên tố. Nhưng trước hết, sẽ hữu ích nếu xây dựng một predicate kiểm tra xem một số ứng viên cho trước có phải là số nguyên tố hay không:

```java
public boolean isPrime(int candidate) {
    // Sinh ra một dải các số tự nhiên bắt đầu từ 2 (bao gồm 2),
    // đến candidate nhưng không bao gồm candidate
    return IntStream.range(2, candidate)
            // Trả về true nếu candidate không chia hết cho bất kỳ số nào trong stream
            .noneMatch(i -> candidate % i == 0);
}
```

Một tối ưu đơn giản là chỉ kiểm tra các ước số nhỏ hơn hoặc bằng căn bậc hai của số ứng viên:

```java
public boolean isPrime(int candidate) {
    int candidateRoot = (int) Math.sqrt((double) candidate);
    return IntStream.rangeClosed(2, candidateRoot)
            .noneMatch(i -> candidate % i == 0);
}
```

Bây giờ phần lớn công việc đã xong. Để phân hoạch `n` số đầu tiên thành nguyên tố và không nguyên tố, chỉ cần tạo một stream chứa `n` số đó rồi rút gọn nó bằng một collector `partitioningBy` dùng phương thức `isPrime` bạn vừa xây dựng làm predicate:

```java
public Map<Boolean, List<Integer>> partitionPrimes(int n) {
    return IntStream.rangeClosed(2, n).boxed()
            .collect(
              partitioningBy(candidate -> isPrime(candidate)));
}
```

Đến đây chúng ta đã bao quát tất cả các collector có thể được tạo bằng các static factory method của lớp `Collectors`, kèm những ví dụ thực tế về cách chúng hoạt động. Bảng 6.1 tập hợp tất cả chúng lại cùng với kiểu mà chúng trả về khi được áp dụng lên một `Stream<T>`, và một ví dụ thực tế về cách dùng chúng trên một `Stream<Dish>` có tên `menuStream`.

**Bảng 6.1. Các static factory method chính của lớp Collectors**

| Factory method | Kiểu trả về | Dùng để |
|---|---|---|
| `toList` | `List<T>` | Gom tất cả các phần tử của stream vào một `List`. |
| | | **Ví dụ sử dụng:** `List<Dish> dishes = menuStream.collect(toList());` |
| `toSet` | `Set<T>` | Gom tất cả các phần tử của stream vào một `Set`, loại bỏ các phần tử trùng lặp. |
| | | **Ví dụ sử dụng:** `Set<Dish> dishes = menuStream.collect(toSet());` |
| `toCollection` | `Collection<T>` | Gom tất cả các phần tử của stream vào collection được tạo bởi supplier được cung cấp. |
| | | **Ví dụ sử dụng:** `Collection<Dish> dishes = menuStream.collect(toCollection(), ArrayList::new);` |
| `counting` | `Long` | Đếm số phần tử trong stream. |
| | | **Ví dụ sử dụng:** `long howManyDishes = menuStream.collect(counting());` |
| `summingInt` | `Integer` | Cộng tổng các giá trị của một thuộc tính `Integer` của các phần tử trong stream. |
| | | **Ví dụ sử dụng:** `int totalCalories = menuStream.collect(summingInt(Dish::getCalories));` |
| `averagingInt` | `Double` | Tính giá trị trung bình của một thuộc tính `Integer` của các phần tử trong stream. |
| | | **Ví dụ sử dụng:** `double avgCalories = menuStream.collect(averagingInt(Dish::getCalories));` |
| `summarizingInt` | `IntSummaryStatistics` | Thu thập các số liệu thống kê liên quan đến một thuộc tính `Integer` của các phần tử trong stream, chẳng hạn giá trị lớn nhất, nhỏ nhất, tổng và trung bình. |
| | | **Ví dụ sử dụng:** `IntSummaryStatistics menuStatistics = menuStream.collect(summarizingInt(Dish::getCalories));` |
| `joining` | `String` | Nối các chuỗi thu được từ việc gọi phương thức `toString` trên mỗi phần tử của stream. |
| | | **Ví dụ sử dụng:** `String shortMenu = menuStream.map(Dish::getName).collect(joining(", "));` |
| `maxBy` | `Optional<T>` | Một `Optional` bọc lấy phần tử lớn nhất trong stream này theo comparator được cung cấp, hoặc `Optional.empty()` nếu stream rỗng. |
| | | **Ví dụ sử dụng:** `Optional<Dish> fattest = menuStream.collect(maxBy(comparingInt(Dish::getCalories)));` |
| `minBy` | `Optional<T>` | Một `Optional` bọc lấy phần tử nhỏ nhất trong stream này theo comparator được cung cấp, hoặc `Optional.empty()` nếu stream rỗng. |
| | | **Ví dụ sử dụng:** `Optional<Dish> lightest = menuStream.collect(minBy(comparingInt(Dish::getCalories)));` |
| `reducing` | Kiểu do phép reduction sinh ra | Rút gọn stream về một giá trị duy nhất, bắt đầu từ một giá trị khởi tạo dùng làm accumulator và kết hợp nó một cách lặp đi lặp lại với từng phần tử của stream bằng một `BinaryOperator`. |
| | | **Ví dụ sử dụng:** `int totalCalories = menuStream.collect(reducing(0, Dish::getCalories, Integer::sum));` |
| `collectingAndThen` | Kiểu do hàm biến đổi trả về | Bọc lấy một collector khác và áp dụng một hàm biến đổi lên kết quả của nó. |
| | | **Ví dụ sử dụng:** `int howManyDishes = menuStream.collect(collectingAndThen(toList(), List::size));` |
| `groupingBy` | `Map<K, List<T>>` | Nhóm các phần tử trong stream dựa trên giá trị của một trong các thuộc tính của chúng và dùng những giá trị đó làm khoá trong `Map` kết quả. |
| | | **Ví dụ sử dụng:** `Map<Dish.Type,List<Dish>> dishesByType = menuStream.collect(groupingBy(Dish::getType));` |
| `partitioningBy` | `Map<Boolean, List<T>>` | Phân hoạch các phần tử trong stream dựa trên kết quả của việc áp dụng một predicate lên từng phần tử. |
| | | **Ví dụ sử dụng:** `Map<Boolean,List<Dish>> vegetarianDishes = menuStream.collect(partitioningBy(Dish::isVegetarian));` |

Như chúng ta đã đề cập ở đầu chương, tất cả những collector này đều cài đặt interface `Collector`, vì vậy trong phần còn lại của chương chúng ta sẽ tìm hiểu interface này chi tiết hơn. Chúng ta sẽ khảo sát các phương thức trong interface đó rồi khám phá cách bạn có thể cài đặt collector của riêng mình.

## 6.5. Interface Collector

Interface `Collector` gồm một tập các phương thức cung cấp bản thiết kế (blueprint) cho việc cài đặt những phép reduction cụ thể (tức các collector). Bạn đã thấy nhiều collector cài đặt interface `Collector`, chẳng hạn `toList` hay `groupingBy`. Điều này cũng ngụ ý rằng bạn hoàn toàn tự do tạo ra những phép reduction tuỳ biến bằng cách cung cấp phần cài đặt của riêng bạn cho interface `Collector`. Ở mục 6.6 chúng ta sẽ chỉ ra cách bạn có thể cài đặt interface `Collector` để tạo một collector phân hoạch một stream các số thành nguyên tố và không nguyên tố một cách hiệu quả hơn những gì bạn đã thấy cho tới giờ.

Để bắt đầu với interface `Collector`, chúng ta tập trung vào một trong những collector đầu tiên mà bạn gặp ở đầu chương này: factory method `toList`, gom tất cả các phần tử của một stream vào một `List`. Chúng ta đã nói rằng bạn sẽ dùng collector này thường xuyên trong công việc hằng ngày, nhưng nó cũng là một collector, ít nhất về mặt khái niệm, khá đơn giản để xây dựng. Việc khảo sát chi tiết hơn cách collector này được cài đặt là một cách tốt để hiểu interface `Collector` được định nghĩa như thế nào và các hàm do những phương thức của nó trả về được phương thức `collect` sử dụng bên trong ra sao.

Hãy bắt đầu bằng việc xem định nghĩa của interface `Collector` trong listing tiếp theo, trong đó trình bày chữ ký của interface cùng năm phương thức mà nó khai báo.

**Listing 6.4. Interface Collector**

```java
public interface Collector<T, A, R> {
    Supplier<A> supplier();
    BiConsumer<A, T> accumulator();
    Function<A, R> finisher();
    BinaryOperator<A> combiner();
    Set<Characteristics> characteristics();
}
```

Trong listing này, các định nghĩa sau được áp dụng:

- `T` là kiểu generic của các phần tử trong stream cần được thu thập.
- `A` là kiểu của accumulator, tức đối tượng mà kết quả từng phần sẽ được tích luỹ vào trong suốt quá trình thu thập.
- `R` là kiểu của đối tượng (thường là, nhưng không phải luôn luôn, một collection) thu được từ phép `collect`.

Chẳng hạn, bạn có thể cài đặt một lớp `ToListCollector<T>` gom tất cả các phần tử của một `Stream<T>` vào một `List<T>`, với chữ ký sau:

```java
public class ToListCollector<T> implements Collector<T, List<T>, List<T>> {
```

trong đó, như chúng ta sẽ làm rõ ngay sau đây, đối tượng được dùng cho quá trình tích luỹ cũng sẽ chính là kết quả cuối cùng của quá trình thu thập.

### 6.5.1. Hiểu ý nghĩa các phương thức được khai báo trong interface Collector

Bây giờ chúng ta có thể phân tích lần lượt năm phương thức được khai báo bởi interface `Collector`. Khi làm điều đó, bạn sẽ nhận thấy rằng mỗi phương thức trong bốn phương thức đầu đều trả về một hàm sẽ được phương thức `collect` gọi tới, trong khi phương thức thứ năm, `characteristics`, cung cấp một tập các đặc trưng (characteristics) — đó là danh sách các gợi ý được chính phương thức `collect` dùng để biết những tối ưu nào (ví dụ, song song hoá) mà nó được phép áp dụng khi thực hiện phép reduction.

**Tạo một container kết quả mới: phương thức supplier**

Phương thức `supplier` phải trả về một `Supplier` của một accumulator rỗng — một hàm không tham số mà khi được gọi sẽ tạo ra một instance của accumulator rỗng dùng trong quá trình thu thập. Rõ ràng, với một collector trả về chính accumulator làm kết quả, như `ToListCollector` của chúng ta, accumulator rỗng này cũng sẽ đại diện cho kết quả của quá trình thu thập khi được thực hiện trên một stream rỗng. Trong `ToListCollector` của chúng ta, supplier khi đó sẽ trả về một `List` rỗng, như sau:

```java
public Supplier<List<T>> supplier() {
    return () -> new ArrayList<T>();
}
```

Lưu ý rằng bạn cũng có thể truyền vào một constructor reference:

```java
public Supplier<List<T>> supplier() {
    return ArrayList::new;
}
```

**Thêm một phần tử vào container kết quả: phương thức accumulator**

Phương thức `accumulator` trả về hàm thực hiện phép reduction. Khi duyệt tới phần tử thứ n trong stream, hàm này được áp dụng với hai đối số: accumulator, tức kết quả của phép reduction (sau khi đã thu thập n–1 phần tử đầu tiên của stream), và bản thân phần tử thứ n. Hàm này trả về `void` bởi vì accumulator được sửa đổi tại chỗ, nghĩa là trạng thái bên trong của nó bị thay đổi bởi việc áp dụng hàm để phản ánh tác động của phần tử vừa duyệt. Với `ToListCollector`, hàm này chỉ đơn thuần phải thêm phần tử hiện tại vào danh sách chứa những phần tử đã duyệt:

```java
public BiConsumer<List<T>, T> accumulator() {
    return (list, item) -> list.add(item);
}
```

Thay vào đó bạn có thể dùng một method reference, ngắn gọn hơn:

```java
public BiConsumer<List<T>, T> accumulator() {
    return List::add;
}
```

**Áp dụng phép biến đổi cuối cùng lên container kết quả: phương thức finisher**

Phương thức `finisher` phải trả về một hàm được gọi ở cuối quá trình tích luỹ, sau khi đã duyệt hoàn toàn stream, nhằm biến đổi đối tượng accumulator thành kết quả cuối cùng của toàn bộ phép thu thập. Thông thường, như trong trường hợp của `ToListCollector`, đối tượng accumulator đã trùng với kết quả cuối cùng mong đợi. Do đó, không cần thực hiện phép biến đổi nào, nên phương thức `finisher` phải trả về hàm đồng nhất (identity function):

```java
public Function<List<T>, List<T>> finisher() {
    return Function.identity();
}
```

Ba phương thức đầu tiên này đã đủ để thực thi một phép reduction tuần tự trên stream mà, ít nhất từ góc nhìn logic, có thể diễn ra như ở hình 6.7. Chi tiết cài đặt trong thực tế thì khó khăn hơn một chút, do cả bản chất lười (lazy) của stream — vốn có thể đòi hỏi một pipeline các intermediate operation khác phải được thực thi trước phép `collect` — lẫn khả năng, về lý thuyết, thực hiện phép reduction song song.

> **Hình 6.7.** Các bước logic của quá trình reduction tuần tự

**Gộp hai container kết quả: phương thức combiner**

Phương thức `combiner`, phương thức cuối cùng trong bốn phương thức trả về một hàm được dùng bởi phép reduction, định nghĩa cách các accumulator thu được từ việc reduce những phần khác nhau của stream được kết hợp lại khi các phần đó được xử lý song song. Trong trường hợp `toList`, phần cài đặt của phương thức này rất đơn giản: thêm danh sách chứa các phần tử gom được từ phần thứ hai của stream vào cuối danh sách thu được khi duyệt phần thứ nhất:

```java
public BinaryOperator<List<T>> combiner() {
    return (list1, list2) -> {
        list1.addAll(list2);
        return list1; };
}
```

Việc bổ sung phương thức thứ tư này cho phép thực hiện phép reduction song song trên stream. Nó sử dụng framework fork/join được giới thiệu trong Java 7 và trừu tượng `Spliterator` mà bạn sẽ tìm hiểu ở chương sau. Nó tuân theo một quá trình tương tự như quá trình được minh hoạ ở hình 6.8 và được mô tả chi tiết dưới đây.

- Stream ban đầu được chia đệ quy thành các stream con cho đến khi một điều kiện xác định xem một stream có cần được chia tiếp hay không trở thành `false` (tính toán song song thường chậm hơn tính toán tuần tự khi các đơn vị công việc được phân phối là quá nhỏ, và việc sinh ra nhiều tác vụ song song hơn số lõi xử lý mà bạn có là vô nghĩa).
- Tại thời điểm này, tất cả các stream con có thể được xử lý song song, mỗi stream con dùng thuật toán reduction tuần tự được minh hoạ ở hình 6.7.
- Cuối cùng, tất cả các kết quả từng phần được kết hợp từng cặp bằng hàm do phương thức `combiner` của collector trả về. Việc này được thực hiện bằng cách kết hợp các kết quả tương ứng với những stream con gắn với mỗi lần chia của stream ban đầu.

> **Hình 6.8.** Song song hoá quá trình reduction bằng phương thức combiner

**Phương thức characteristics**

Phương thức cuối cùng, `characteristics`, trả về một tập bất biến (immutable) các `Characteristics`, định nghĩa hành vi của collector — cụ thể là cung cấp các gợi ý về việc stream có thể được reduce song song hay không và những tối ưu nào là hợp lệ khi làm như vậy. `Characteristics` là một enum chứa ba mục:

- `UNORDERED` — Kết quả của phép reduction không bị ảnh hưởng bởi thứ tự mà các phần tử trong stream được duyệt và tích luỹ.
- `CONCURRENT` — Hàm accumulator có thể được gọi đồng thời từ nhiều thread, và khi đó collector này có thể thực hiện phép reduction song song trên stream. Nếu collector không đồng thời được đánh dấu là `UNORDERED`, nó chỉ có thể thực hiện reduction song song khi được áp dụng lên một nguồn dữ liệu không có thứ tự (unordered).
- `IDENTITY_FINISH` — Điều này cho biết hàm do phương thức `finisher` trả về là hàm đồng nhất, và việc áp dụng nó có thể được bỏ qua. Trong trường hợp này, đối tượng accumulator được dùng trực tiếp làm kết quả cuối cùng của quá trình reduction. Điều này cũng ngụ ý rằng việc ép kiểu không kiểm tra (unchecked cast) từ accumulator `A` sang kết quả `R` là an toàn.

`ToListCollector` được xây dựng cho tới giờ là `IDENTITY_FINISH`, bởi vì `List` được dùng để tích luỹ các phần tử trong stream đã chính là kết quả cuối cùng mong đợi và không cần thêm phép biến đổi nào, nhưng nó không phải là `UNORDERED` vì nếu bạn áp dụng nó lên một stream có thứ tự thì bạn muốn thứ tự này được giữ nguyên trong `List` kết quả. Cuối cùng, nó là `CONCURRENT`, nhưng theo những gì chúng ta vừa nói, stream sẽ chỉ được xử lý song song nếu nguồn dữ liệu bên dưới của nó là không có thứ tự.

### 6.5.2. Ghép tất cả lại với nhau

Năm phương thức được phân tích ở tiểu mục trên là tất cả những gì bạn cần để xây dựng `ToListCollector` của riêng mình, vậy nên bạn có thể cài đặt nó bằng cách ghép tất cả chúng lại với nhau, như listing tiếp theo cho thấy.

**Listing 6.5. Lớp ToListCollector**

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.Collector;
import static java.util.stream.Collector.Characteristics.*;

public class ToListCollector<T> implements Collector<T, List<T>, List<T>> {

    @Override
    public Supplier<List<T>> supplier() {
        return ArrayList::new;   // Tạo điểm khởi đầu cho phép thu thập
    }

    @Override
    public BiConsumer<List<T>, T> accumulator() {
        // Tích luỹ phần tử vừa duyệt, sửa đổi accumulator tại chỗ
        return List::add;
    }

    @Override
    public Function<List<T>, List<T>> finisher() {
        return Function.identity();   // Hàm đồng nhất
    }

    @Override
    public BinaryOperator<List<T>> combiner() {
        return (list1, list2) -> {
            // Sửa đổi accumulator thứ nhất bằng cách gộp nó
            // với nội dung của accumulator thứ hai
            list1.addAll(list2);
            return list1;   // Trả về accumulator thứ nhất đã được sửa đổi
        };
    }

    @Override
    public Set<Characteristics> characteristics() {
        // Đánh dấu collector là IDENTITY_FINISH và CONCURRENT
        return Collections.unmodifiableSet(EnumSet.of(
                IDENTITY_FINISH, CONCURRENT));
    }
}
```

Lưu ý rằng phần cài đặt này không hoàn toàn giống với phần cài đặt do phương thức `Collectors.toList` trả về, nhưng nó chỉ khác ở một vài tối ưu nhỏ. Những tối ưu này chủ yếu liên quan đến việc collector do Java API cung cấp sử dụng singleton `Collections.emptyList()` khi nó phải trả về một danh sách rỗng. Điều này có nghĩa là nó có thể được dùng an toàn thay cho bản gốc của Java, chẳng hạn như một ví dụ để gom một danh sách tất cả các `Dish` của một stream thực đơn:

```java
List<Dish> dishes = menuStream.collect(new ToListCollector<Dish>());
```

Khác biệt còn lại giữa cách này và cách viết chuẩn

```java
List<Dish> dishes = menuStream.collect(toList());
```

là `toList` là một factory, trong khi bạn phải dùng `new` để khởi tạo `ToListCollector` của mình.

> **Thực hiện một phép collect tuỳ biến mà không cần tạo phần cài đặt Collector**
>
> Trong trường hợp phép thu thập là `IDENTITY_FINISH`, còn một khả năng nữa để thu được cùng kết quả mà không cần xây dựng một phần cài đặt hoàn toàn mới cho interface `Collector`. `Stream` có một phương thức `collect` overload nhận ba hàm còn lại — supplier, accumulator và combiner — có ngữ nghĩa hoàn toàn giống với những hàm do các phương thức tương ứng của interface `Collector` trả về. Chẳng hạn, có thể thu thập vào một `List` tất cả các phần tử trong một stream các món ăn, như sau:
>
> ```java
> List<Dish> dishes = menuStream.collect(
>         ArrayList::new,    // Supplier
>         List::add,         // Accumulator
>         List::addAll);     // Combiner
> ```
>
> Chúng tôi cho rằng dạng thứ hai này, dù gọn gàng và súc tích hơn dạng thứ nhất, lại khá kém dễ đọc hơn. Ngoài ra, việc xây dựng phần cài đặt cho collector tuỳ biến của bạn trong một lớp riêng đúng nghĩa sẽ thúc đẩy việc tái sử dụng nó và giúp tránh trùng lặp code. Cũng đáng lưu ý rằng bạn không được phép truyền bất kỳ `Characteristics` nào cho phương thức `collect` thứ hai này, nên nó luôn hành xử như một collector `IDENTITY_FINISH` và `CONCURRENT` nhưng không phải `UNORDERED`.

Ở mục tiếp theo, bạn sẽ nâng kiến thức mới về việc cài đặt collector lên một tầm cao mới. Bạn sẽ xây dựng collector tuỳ biến của riêng mình cho một trường hợp sử dụng phức tạp hơn nhưng hy vọng là cụ thể và hấp dẫn hơn.

## 6.6. Xây dựng collector của riêng bạn để có hiệu năng tốt hơn

Ở mục 6.4, nơi chúng ta bàn về partitioning, bạn đã tạo một collector bằng một trong nhiều factory method tiện lợi do lớp `Collectors` cung cấp, để chia `n` số tự nhiên đầu tiên thành nguyên tố và không nguyên tố, như trong listing sau.

**Listing 6.6. Phân hoạch n số tự nhiên đầu tiên thành nguyên tố và không nguyên tố**

```java
public Map<Boolean, List<Integer>> partitionPrimes(int n) {
    return IntStream.rangeClosed(2, n).boxed()
            .collect(partitioningBy(candidate -> isPrime(candidate)));
}
```

Ở đó bạn đã đạt được một cải tiến so với phương thức `isPrime` ban đầu bằng cách giới hạn số ước cần kiểm tra đối với số nguyên tố ứng viên xuống chỉ còn những ước không lớn hơn căn bậc hai của ứng viên:

```java
public boolean isPrime(int candidate) {
    int candidateRoot = (int) Math.sqrt((double) candidate);
    return IntStream.rangeClosed(2, candidateRoot)
            .noneMatch(i -> candidate % i == 0);
}
```

Có cách nào để đạt được hiệu năng còn tốt hơn nữa không? Câu trả lời là có, nhưng để làm điều đó bạn sẽ phải xây dựng một collector tuỳ biến.

### 6.6.1. Chỉ chia cho các số nguyên tố

Một tối ưu khả dĩ là chỉ kiểm tra xem số ứng viên có chia hết cho các số nguyên tố hay không. Sẽ vô nghĩa nếu kiểm tra nó với một ước số mà bản thân ước số đó không phải là số nguyên tố! Bạn có thể giới hạn phép kiểm tra chỉ với những số nguyên tố đã tìm được trước số ứng viên hiện tại. Vấn đề với các collector định nghĩa sẵn mà bạn đã dùng cho tới giờ — và cũng là lý do bạn phải xây dựng một collector tuỳ biến — là trong quá trình thu thập bạn không có quyền truy cập vào kết quả từng phần. Điều này có nghĩa là khi kiểm tra xem một số ứng viên cho trước có phải là số nguyên tố hay không, bạn không có quyền truy cập vào danh sách các số nguyên tố khác đã tìm được cho đến thời điểm đó.

Giả sử bạn có danh sách này; bạn có thể truyền nó cho phương thức `isPrime` và viết lại nó như sau:

```java
public static boolean isPrime(List<Integer> primes, int candidate) {
    return primes.stream().noneMatch(i -> candidate % i == 0);
}
```

Ngoài ra, bạn cũng nên áp dụng chính tối ưu mà bạn đã dùng trước đó và chỉ kiểm tra với những số nguyên tố nhỏ hơn căn bậc hai của số ứng viên. Bạn cần một cách để dừng việc kiểm tra xem ứng viên có chia hết cho một số nguyên tố hay không ngay khi số nguyên tố tiếp theo lớn hơn căn của ứng viên. Bạn có thể dễ dàng làm điều này bằng cách dùng phương thức `takeWhile` của `Stream`:

```java
public static boolean isPrime(List<Integer> primes, int candidate) {
    int candidateRoot = (int) Math.sqrt((double) candidate);
    return primes.stream()
            .takeWhile(i -> i <= candidateRoot)
            .noneMatch(i -> candidate % i == 0);
}
```

---

**Quiz 6.3: Mô phỏng takeWhile trong Java 8**

Phương thức `takeWhile` được giới thiệu trong Java 9, nên thật không may bạn không thể dùng giải pháp này nếu bạn vẫn đang dùng Java 8. Bạn có thể khắc phục hạn chế này và đạt được điều gì đó tương tự trong Java 8 bằng cách nào?

**Đáp án:**

Bạn có thể cài đặt phương thức `takeWhile` của riêng mình, phương thức này khi nhận vào một danh sách đã được sắp xếp và một predicate sẽ trả về tiền tố dài nhất của danh sách đó mà các phần tử thoả mãn predicate:

```java
public static <A> List<A> takeWhile(List<A> list, Predicate<A> p) {
    int i = 0;
    for (A item : list) {
        // Kiểm tra xem phần tử hiện tại trong danh sách có thoả mãn Predicate không
        if (!p.test(item)) {
            // Nếu không, trả về tiền tố danh sách con cho đến phần tử
            // ngay trước phần tử vừa được kiểm tra
            return list.subList(0, i);
        }
        i++;
    }
    // Tất cả các phần tử trong danh sách đều thoả mãn Predicate,
    // nên trả về chính danh sách đó
    return list;
}
```

---

Sử dụng phương thức này, bạn có thể viết lại phương thức `isPrime` và một lần nữa chỉ kiểm tra số nguyên tố ứng viên với những số nguyên tố không lớn hơn căn bậc hai của nó:

```java
public static boolean isPrime(List<Integer> primes, int candidate) {
    int candidateRoot = (int) Math.sqrt((double) candidate);
    return takeWhile(primes, i -> i <= candidateRoot)
            .stream()
            .noneMatch(p -> candidate % p == 0);
}
```

Lưu ý rằng, khác với phiên bản do Streams API cung cấp, phần cài đặt `takeWhile` này là "háo hức" (eager). Khi có thể, hãy luôn ưu tiên phiên bản `takeWhile` lười (lazy) của `Stream` trong Java 9 để nó có thể được gộp chung với phép toán `noneMatch`.

Với phương thức `isPrime` mới này trong tay, giờ bạn đã sẵn sàng để cài đặt collector tuỳ biến của riêng mình. Trước hết, bạn cần khai báo một lớp mới cài đặt interface `Collector`. Sau đó, bạn cần xây dựng năm phương thức mà interface `Collector` yêu cầu.

**Bước 1: Định nghĩa chữ ký của lớp Collector**

Hãy bắt đầu với chữ ký của lớp, nhớ rằng interface `Collector` được định nghĩa là

```java
public interface Collector<T, A, R>
```

trong đó `T`, `A` và `R` lần lượt là kiểu của các phần tử trong stream, kiểu của đối tượng dùng để tích luỹ kết quả từng phần, và kiểu của kết quả cuối cùng của phép `collect`. Trong trường hợp này, bạn muốn thu thập các stream `Integer`, trong khi cả kiểu accumulator lẫn kiểu kết quả đều là `Map<Boolean, List<Integer>>` (chính là `Map` mà bạn đã thu được như kết quả của phép phân hoạch trước đó ở listing 6.6), có khoá là `true` và `false` và giá trị lần lượt là các `List` số nguyên tố và không nguyên tố:

```java
public class PrimeNumbersCollector
        implements Collector<Integer,                    // Kiểu của các phần tử trong stream
                             Map<Boolean, List<Integer>>, // Kiểu của accumulator
                             Map<Boolean, List<Integer>>> // Kiểu kết quả của phép collect
```

**Bước 2: Cài đặt quá trình reduction**

Tiếp theo, bạn cần cài đặt năm phương thức được khai báo trong interface `Collector`. Phương thức `supplier` phải trả về một hàm mà khi được gọi sẽ tạo ra accumulator:

```java
public Supplier<Map<Boolean, List<Integer>>> supplier() {
    return () -> new HashMap<Boolean, List<Integer>>() {{
        put(true, new ArrayList<Integer>());
        put(false, new ArrayList<Integer>());
    }};
}
```

Ở đây bạn không chỉ tạo ra `Map` mà bạn sẽ dùng làm accumulator, mà còn khởi tạo nó với hai danh sách rỗng dưới các khoá `true` và `false`. Đây là nơi bạn sẽ lần lượt thêm vào các số nguyên tố và không nguyên tố trong quá trình thu thập. Phương thức quan trọng nhất của collector này là phương thức `accumulator`, bởi vì nó chứa logic định nghĩa cách các phần tử của stream phải được thu thập. Trong trường hợp này, đó cũng là chìa khoá để cài đặt tối ưu mà chúng ta đã mô tả trước đó. Tại bất kỳ vòng lặp nào, giờ đây bạn có thể truy cập kết quả từng phần của quá trình thu thập, chính là accumulator chứa các số nguyên tố đã tìm được cho tới thời điểm đó:

```java
public BiConsumer<Map<Boolean, List<Integer>>, Integer> accumulator() {
    return (Map<Boolean, List<Integer>> acc, Integer candidate) -> {
        // Lấy ra danh sách số nguyên tố hoặc không nguyên tố
        // tuỳ theo kết quả của isPrime
        acc.get( isPrime(acc.get(true), candidate) )
           .add(candidate);   // Thêm ứng viên vào danh sách thích hợp
    };
}
```

Trong phương thức này, bạn gọi phương thức `isPrime`, truyền cho nó (cùng với số mà bạn muốn kiểm tra xem có phải là số nguyên tố hay không) danh sách các số nguyên tố đã tìm được cho tới lúc đó. (Đó là những giá trị được đánh chỉ mục bởi khoá `true` trong `Map` tích luỹ.) Kết quả của lời gọi này sau đó được dùng làm khoá để lấy ra danh sách các số nguyên tố hoặc không nguyên tố, nhờ đó bạn có thể thêm ứng viên mới vào đúng danh sách.

**Bước 3: Làm cho collector hoạt động song song (nếu có thể)**

Phương thức tiếp theo phải kết hợp hai accumulator từng phần trong trường hợp quá trình thu thập diễn ra song song, nên trong trường hợp này nó phải gộp hai `Map` bằng cách thêm tất cả các số trong danh sách nguyên tố và không nguyên tố của `Map` thứ hai vào các danh sách tương ứng trong `Map` thứ nhất:

```java
public BinaryOperator<Map<Boolean, List<Integer>>> combiner() {
    return (Map<Boolean, List<Integer>> map1,
            Map<Boolean, List<Integer>> map2) -> {
        map1.get(true).addAll(map2.get(true));
        map1.get(false).addAll(map2.get(false));
        return map1;
    };
}
```

Lưu ý rằng trên thực tế collector này không thể được dùng song song, bởi vì thuật toán về bản chất là tuần tự. Điều này có nghĩa là phương thức `combiner` sẽ không bao giờ được gọi tới, và bạn có thể để trống phần cài đặt của nó (hoặc tốt hơn, ném ra một `UnsupportedOperationException`). Chúng tôi vẫn quyết định cài đặt nó chỉ để cho đầy đủ.

**Bước 4: Phương thức finisher và phương thức characteristics của collector**

Phần cài đặt của hai phương thức cuối cùng khá đơn giản. Như chúng ta đã nói, accumulator trùng với kết quả của collector nên nó sẽ không cần thêm phép biến đổi nào, và phương thức `finisher` trả về hàm đồng nhất:

```java
public Function<Map<Boolean, List<Integer>>,
                Map<Boolean, List<Integer>>> finisher() {
    return Function.identity();
}
```

Còn về phương thức `characteristics`, chúng ta đã nói rằng nó không phải là `CONCURRENT` cũng không phải `UNORDERED` mà là `IDENTITY_FINISH`:

```java
public Set<Characteristics> characteristics() {
    return Collections.unmodifiableSet(EnumSet.of(IDENTITY_FINISH));
}
```

Listing sau đây trình bày phần cài đặt cuối cùng của `PrimeNumbersCollector`.

**Listing 6.7. Lớp PrimeNumbersCollector**

```java
public class PrimeNumbersCollector
    implements Collector<Integer,
                         Map<Boolean, List<Integer>>,
                         Map<Boolean, List<Integer>>> {

    @Override
    public Supplier<Map<Boolean, List<Integer>>> supplier() {
        // Bắt đầu quá trình thu thập với một Map chứa hai List rỗng
        return () -> new HashMap<Boolean, List<Integer>>() {{
            put(true, new ArrayList<Integer>());
            put(false, new ArrayList<Integer>());
        }};
    }

    @Override
    public BiConsumer<Map<Boolean, List<Integer>>, Integer> accumulator() {
        return (Map<Boolean, List<Integer>> acc, Integer candidate) -> {
            // Truyền cho phương thức isPrime danh sách các số nguyên tố đã tìm được.
            // Lấy từ Map ra danh sách số nguyên tố hoặc không nguyên tố, tuỳ theo
            // kết quả trả về của isPrime, rồi thêm ứng viên hiện tại vào đó.
            acc.get( isPrime( acc.get(true), candidate) )
               .add(candidate);
        };
    }

    @Override
    public BinaryOperator<Map<Boolean, List<Integer>>> combiner() {
        // Gộp Map thứ hai vào Map thứ nhất
        return (Map<Boolean, List<Integer>> map1,
                Map<Boolean, List<Integer>> map2) -> {
            map1.get(true).addAll(map2.get(true));
            map1.get(false).addAll(map2.get(false));
            return map1;
        };
    }

    @Override
    public Function<Map<Boolean, List<Integer>>,
                    Map<Boolean, List<Integer>>> finisher() {
        // Không cần phép biến đổi nào ở cuối quá trình thu thập,
        // nên kết thúc bằng hàm đồng nhất
        return Function.identity();
    }

    @Override
    public Set<Characteristics> characteristics() {
        // Collector này là IDENTITY_FINISH nhưng không phải UNORDERED cũng không
        // phải CONCURRENT, bởi nó dựa vào việc các số nguyên tố được phát hiện
        // theo trình tự.
        return Collections.unmodifiableSet(EnumSet.of(IDENTITY_FINISH));
    }
}
```

Bây giờ bạn có thể dùng collector tuỳ biến mới này thay cho collector trước đây được tạo bằng factory method `partitioningBy` ở mục 6.4 và thu được chính xác cùng kết quả:

```java
public Map<Boolean, List<Integer>>
                partitionPrimesWithCustomCollector(int n) {
    return IntStream.rangeClosed(2, n).boxed()
            .collect(new PrimeNumbersCollector());
}
```

### 6.6.2. So sánh hiệu năng của các collector

Collector được tạo bằng factory method `partitioningBy` và collector tuỳ biến mà bạn vừa xây dựng là tương đương nhau về mặt chức năng, nhưng bạn đã đạt được mục tiêu cải thiện hiệu năng của collector `partitioningBy` bằng collector tuỳ biến của mình chưa? Hãy viết nhanh một chương trình đo (harness) để kiểm tra điều này:

```java
public class CollectorHarness {
    public static void main(String[] args) {
        long fastest = Long.MAX_VALUE;
        for (int i = 0; i < 10; i++) {   // Chạy bài kiểm tra 10 lần
            long start = System.nanoTime();
            // Phân hoạch một triệu số tự nhiên đầu tiên thành nguyên tố
            // và không nguyên tố
            partitionPrimes(1_000_000);
            // Khoảng thời gian tính bằng mili giây
            long duration = (System.nanoTime() - start) / 1_000_000;
            // Kiểm tra xem lần chạy này có phải là nhanh nhất không
            if (duration < fastest) fastest = duration;
        }
        System.out.println(
                "Fastest execution done in " + fastest + " msecs");
    }
}
```

Lưu ý rằng một cách tiếp cận benchmark khoa học hơn sẽ là dùng một framework như Java Microbenchmark Harness (JMH), nhưng chúng tôi không muốn thêm vào đây sự phức tạp của việc sử dụng một framework như vậy, và với trường hợp sử dụng này, kết quả do lớp benchmark nhỏ bé này cung cấp đã đủ chính xác. Lớp này phân hoạch một triệu số tự nhiên đầu tiên thành nguyên tố và không nguyên tố, gọi phương thức dùng collector được tạo bằng factory method `partitioningBy` 10 lần và ghi lại lần thực thi nhanh nhất. Chạy nó trên một Intel i5 2.4 GHz, nó in ra kết quả sau:

```text
Fastest execution done in 4716 msecs
```

Bây giờ hãy thay `partitionPrimes` bằng `partitionPrimesWithCustomCollector` trong chương trình đo, để kiểm tra hiệu năng của collector tuỳ biến mà bạn đã xây dựng. Giờ chương trình in ra

```text
Fastest execution done in 3201 msecs
```

Không tệ! Điều này có nghĩa là bạn đã không lãng phí thời gian khi xây dựng collector tuỳ biến này, vì hai lý do: Thứ nhất, bạn đã học được cách cài đặt collector của riêng mình khi cần. Và thứ hai, bạn đã đạt được mức cải thiện hiệu năng khoảng 32%.

Cuối cùng, cần lưu ý rằng, giống như bạn đã làm với `ToListCollector` ở listing 6.5, có thể thu được cùng kết quả bằng cách truyền ba hàm cài đặt logic cốt lõi của `PrimeNumbersCollector` cho phiên bản overload của phương thức `collect`, nhận chúng làm đối số:

```java
public Map<Boolean, List<Integer>> partitionPrimesWithCustomCollector
             (int n) {
    return IntStream.rangeClosed(2, n).boxed()
        .collect(
            () -> new HashMap<Boolean, List<Integer>>() {{   // Supplier
                put(true, new ArrayList<Integer>());
                put(false, new ArrayList<Integer>());
            }},
            (acc, candidate) -> {                            // Accumulator
                acc.get( isPrime(acc.get(true), candidate) )
                   .add(candidate);
            },
            (map1, map2) -> {                                // Combiner
                map1.get(true).addAll(map2.get(true));
                map1.get(false).addAll(map2.get(false));
            });
}
```

Như bạn có thể thấy, bằng cách này bạn có thể tránh việc tạo một lớp hoàn toàn mới cài đặt interface `Collector`; đoạn code kết quả gọn gàng hơn, dù có lẽ nó cũng kém dễ đọc hơn và chắc chắn là kém dễ tái sử dụng hơn.

## Tóm tắt

- `collect` là một terminal operation nhận vào đối số là những công thức khác nhau (được gọi là collector) để tích luỹ các phần tử của một stream thành một kết quả tổng hợp.
- Các collector định nghĩa sẵn bao gồm việc rút gọn và tổng hợp các phần tử của stream thành một giá trị duy nhất, chẳng hạn như tính giá trị nhỏ nhất, lớn nhất hoặc trung bình. Những collector đó được tổng hợp trong bảng 6.1.
- Các collector định nghĩa sẵn cho phép bạn nhóm các phần tử của một stream bằng `groupingBy` và phân hoạch các phần tử của một stream bằng `partitioningBy`.
- Các collector kết hợp với nhau rất hiệu quả để tạo ra những phép nhóm, phân hoạch và reduction nhiều tầng.
- Bạn có thể xây dựng collector của riêng mình bằng cách cài đặt các phương thức được định nghĩa trong interface `Collector`.
