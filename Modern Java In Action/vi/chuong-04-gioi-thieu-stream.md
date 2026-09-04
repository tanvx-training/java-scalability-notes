# Chương 4. Giới thiệu về stream

> **Nội dung chương này**
>
> - Stream là gì?
> - Collection so với stream
> - Internal iteration so với external iteration
> - Intermediate operation so với terminal operation

Bạn sẽ làm gì nếu Java không có collection? Gần như mọi ứng dụng Java đều tạo ra và xử lý các collection. Collection là nền tảng của rất nhiều tác vụ lập trình: chúng cho phép bạn gom nhóm và xử lý dữ liệu. Để minh hoạ collection trong thực tế, hãy hình dung bạn được giao nhiệm vụ tạo một collection các món ăn để biểu diễn một thực đơn, rồi tính toán nhiều truy vấn khác nhau trên đó. Ví dụ, bạn có thể muốn biết tổng số calo của cả thực đơn. Hoặc bạn có thể cần lọc thực đơn để chỉ chọn ra những món ít calo cho một thực đơn ăn kiêng lành mạnh. Nhưng dù collection là thứ gần như không thể thiếu với bất kỳ ứng dụng Java nào, việc thao tác trên collection vẫn còn xa mới đạt tới mức hoàn hảo:

- Rất nhiều logic nghiệp vụ đòi hỏi những thao tác kiểu cơ sở dữ liệu, chẳng hạn như nhóm một danh sách món ăn theo thể loại (ví dụ, tất cả các món chay) hoặc tìm ra món đắt nhất. Đã bao nhiêu lần bạn thấy mình phải cài đặt lại những thao tác này bằng iterator? Hầu hết các cơ sở dữ liệu đều cho phép bạn đặc tả những thao tác như vậy một cách khai báo (declarative). Ví dụ, câu truy vấn SQL sau cho phép bạn chọn (hay "filter") tên của những món ăn ít calo: `SELECT name FROM dishes WHERE calorie < 400`. Như bạn thấy, trong SQL bạn không cần cài đặt *cách* lọc dựa trên thuộc tính calorie của một món ăn (như bạn vẫn phải làm với collection trong Java, chẳng hạn dùng một iterator và một biến tích luỹ). Thay vào đó, bạn viết ra *cái* mà bạn muốn nhận được làm kết quả. Ý tưởng cơ bản này có nghĩa là bạn ít phải bận tâm hơn về việc cài đặt tường minh những truy vấn như vậy — đã có người lo hộ bạn rồi! Vậy tại sao bạn không thể làm điều tương tự với collection?
- Bạn sẽ xử lý một collection có rất nhiều phần tử như thế nào? Để đạt được hiệu năng tốt, bạn cần xử lý nó song song và tận dụng kiến trúc đa lõi (multicore). Nhưng viết code chạy song song thì phức tạp hơn nhiều so với làm việc với iterator. Thêm vào đó, debug loại code này chẳng vui vẻ gì!

Những người thiết kế ngôn ngữ Java có thể làm gì để tiết kiệm thời gian quý báu của bạn và giúp cuộc đời lập trình viên dễ thở hơn? Có lẽ bạn đã đoán ra: câu trả lời chính là stream.

## 4.1. Stream là gì?

Stream là một phần bổ sung mới cho Java API, cho phép bạn thao tác trên các collection dữ liệu theo cách khai báo (bạn diễn đạt một truy vấn thay vì viết code cài đặt riêng cho nó). Ở thời điểm này, bạn có thể tạm hình dung stream như những iterator "cao cấp" duyệt trên một collection dữ liệu. Ngoài ra, stream còn có thể được xử lý song song một cách trong suốt, mà bạn không phải viết bất kỳ dòng code đa luồng nào! Chúng tôi sẽ giải thích chi tiết ở chương 7 về cách stream và cơ chế song song hoá hoạt động. Để thấy được lợi ích của việc dùng stream, hãy so sánh đoạn code sau đây — trả về tên các món ăn ít calo, sắp xếp theo số calo — trước tiên viết bằng Java 7 rồi sau đó bằng Java 8 với stream. Đừng quá lo lắng về đoạn code Java 8; chúng tôi sẽ giải thích chi tiết trong các mục tiếp theo!

Trước đây (Java 7):

```java
List<Dish> lowCaloricDishes = new ArrayList<>();
for (Dish dish : menu) {
    // Lọc các phần tử bằng một biến tích luỹ
    if (dish.getCalories() < 400) {
        lowCaloricDishes.add(dish);
    }
}
// Sắp xếp các món ăn bằng một anonymous class
Collections.sort(lowCaloricDishes, new Comparator<Dish>() {
    public int compare(Dish dish1, Dish dish2) {
        return Integer.compare(dish1.getCalories(), dish2.getCalories());
    }
});
List<String> lowCaloricDishesName = new ArrayList<>();
for (Dish dish : lowCaloricDishes) {
    // Duyệt danh sách đã sắp xếp để lấy ra tên các món ăn
    lowCaloricDishesName.add(dish.getName());
}
```

Trong đoạn code này bạn đã dùng một "biến rác", `lowCaloricDishes`. Mục đích duy nhất của nó là đóng vai trò một vật chứa trung gian rồi vứt đi. Trong Java 8, chi tiết cài đặt này được đẩy vào thư viện — nơi nó thực sự thuộc về.

Sau này (Java 8):

```java
import static java.util.Comparator.comparing;
import static java.util.stream.Collectors.toList;

List<String> lowCaloricDishesName =
        menu.stream()
            .filter(d -> d.getCalories() < 400)   // Chọn các món dưới 400 calo
            .sorted(comparing(Dish::getCalories)) // Sắp xếp chúng theo calo
            .map(Dish::getName)                   // Trích xuất tên của các món này
            .collect(toList());                   // Lưu toàn bộ tên vào một List
```

Để khai thác kiến trúc đa lõi và thực thi đoạn code này song song, bạn chỉ cần đổi `stream()` thành `parallelStream()`:

```java
List<String> lowCaloricDishesName =
        menu.parallelStream()
            .filter(d -> d.getCalories() < 400)
            .sorted(comparing(Dish::getCalories))
            .map(Dish::getName)
            .collect(toList());
```

Có lẽ bạn đang tự hỏi chính xác thì điều gì xảy ra khi bạn gọi phương thức `parallelStream`. Bao nhiêu thread được sử dụng? Lợi ích về hiệu năng là gì? Liệu có nên dùng phương thức này hay không? Chương 7 sẽ trả lời chi tiết những câu hỏi này. Còn bây giờ, bạn có thể thấy rằng cách tiếp cận mới mang lại vài lợi ích tức thì dưới góc nhìn của kỹ nghệ phần mềm:

- Code được viết theo cách khai báo: bạn đặc tả *cái* bạn muốn đạt được (lọc ra những món ăn ít calo) thay vì đặc tả *cách* cài đặt một thao tác (dùng các khối điều khiển luồng như vòng lặp và câu lệnh `if`). Như bạn đã thấy ở chương trước, cách tiếp cận này, kết hợp với behavior parameterization (tham số hoá hành vi), giúp bạn ứng phó với các yêu cầu thay đổi: bạn có thể dễ dàng tạo thêm một phiên bản code khác để lọc những món ăn nhiều calo bằng một lambda expression, mà không cần phải copy và paste code. Một cách khác để nhìn nhận lợi ích của cách tiếp cận này là mô hình luồng (threading model) được tách rời khỏi bản thân truy vấn. Bởi vì bạn chỉ cung cấp một "công thức" cho truy vấn, nó có thể được thực thi tuần tự hoặc song song. Bạn sẽ tìm hiểu thêm về điều này ở chương 7.
- Bạn nối nhiều thao tác nền tảng lại với nhau để diễn đạt một pipeline xử lý dữ liệu phức tạp (bạn nối `filter` với các thao tác `sorted`, `map` và `collect`, như minh hoạ ở hình 4.1) trong khi vẫn giữ cho code dễ đọc và ý định rõ ràng. Kết quả của `filter` được truyền sang phương thức `sorted`, rồi tiếp tục được truyền sang phương thức `map` và cuối cùng là `collect`.

> **Hình 4.1.** Nối các thao tác stream lại với nhau để tạo thành một stream pipeline

Bởi vì các thao tác như `filter` (hay `sorted`, `map` và `collect`) được cung cấp sẵn dưới dạng những khối xây dựng ở mức cao và không phụ thuộc vào một mô hình luồng cụ thể nào, phần cài đặt bên trong của chúng có thể là đơn luồng, hoặc cũng có thể tận dụng tối đa kiến trúc đa lõi của bạn một cách trong suốt! Trong thực tế, điều này có nghĩa là bạn không còn phải bận tâm tới thread và lock để tìm cách song song hoá một số tác vụ xử lý dữ liệu: Streams API làm việc đó thay cho bạn!

Streams API mới rất giàu sức biểu đạt. Ví dụ, sau khi đọc xong chương này cùng chương 5 và 6, bạn sẽ có thể viết được đoạn code như sau:

```java
Map<Dish.Type, List<Dish>> dishesByType =
        menu.stream().collect(groupingBy(Dish::getType));
```

Ví dụ cụ thể này sẽ được giải thích chi tiết ở chương 6. Nó nhóm các món ăn theo thể loại của chúng vào bên trong một `Map`. Chẳng hạn, `Map` này có thể chứa kết quả sau:

```text
{FISH=[prawns, salmon],
 OTHER=[french fries, rice, season fruit, pizza],
 MEAT=[pork, beef, chicken]}
```

Bây giờ hãy thử nghĩ xem bạn sẽ cài đặt điều này thế nào bằng cách tiếp cận lập trình mệnh lệnh (imperative) truyền thống với các vòng lặp. Nhưng đừng phí quá nhiều thời gian. Thay vào đó, hãy đón nhận sức mạnh của stream trong chương này và các chương tiếp theo!

> **Các thư viện khác: Guava, Apache và lambdaj**
>
> Đã có nhiều nỗ lực nhằm cung cấp cho lập trình viên Java những thư viện tốt hơn để thao tác trên collection. Ví dụ, Guava là một thư viện phổ biến do Google tạo ra. Nó cung cấp thêm các lớp chứa dữ liệu như multimap và multiset. Thư viện Apache Commons Collections cũng cung cấp những tính năng tương tự. Cuối cùng, lambdaj, do Mario Fusco — đồng tác giả của cuốn sách này — viết, cung cấp nhiều tiện ích để thao tác trên collection theo phong cách khai báo, lấy cảm hứng từ lập trình hàm.
>
> Giờ đây, Java 8 đã có thư viện chính thức của riêng mình để thao tác trên collection theo một phong cách khai báo hơn.

Tóm lại, Streams API trong Java 8 cho phép bạn viết code:

- **Khai báo (Declarative)** — Ngắn gọn hơn và dễ đọc hơn
- **Có thể kết hợp (Composable)** — Linh hoạt hơn
- **Có thể song song hoá (Parallelizable)** — Hiệu năng tốt hơn

Trong phần còn lại của chương này và chương kế tiếp, chúng ta sẽ dùng miền dữ liệu sau đây cho các ví dụ: một thực đơn (menu) chẳng qua chỉ là một danh sách các món ăn.

```java
List<Dish> menu = Arrays.asList(
        new Dish("pork", false, 800, Dish.Type.MEAT),
        new Dish("beef", false, 700, Dish.Type.MEAT),
        new Dish("chicken", false, 400, Dish.Type.MEAT),
        new Dish("french fries", true, 530, Dish.Type.OTHER),
        new Dish("rice", true, 350, Dish.Type.OTHER),
        new Dish("season fruit", true, 120, Dish.Type.OTHER),
        new Dish("pizza", true, 550, Dish.Type.OTHER),
        new Dish("prawns", false, 300, Dish.Type.FISH),
        new Dish("salmon", false, 450, Dish.Type.FISH) );
```

trong đó `Dish` là một class immutable được định nghĩa như sau:

```java
public class Dish {

    private final String name;
    private final boolean vegetarian;
    private final int calories;
    private final Type type;

    public Dish(String name, boolean vegetarian, int calories, Type type) {
        this.name = name;
        this.vegetarian = vegetarian;
        this.calories = calories;
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public boolean isVegetarian() {
        return vegetarian;
    }

    public int getCalories() {
        return calories;
    }

    public Type getType() {
        return type;
    }

    @Override
    public String toString() {
        return name;
    }

    public enum Type { MEAT, FISH, OTHER }
}
```

Bây giờ chúng ta sẽ khám phá chi tiết hơn cách sử dụng Streams API. Chúng ta sẽ so sánh stream với collection và cung cấp một số kiến thức nền. Ở chương tiếp theo, chúng ta sẽ tìm hiểu cặn kẽ các thao tác stream có sẵn để diễn đạt những truy vấn xử lý dữ liệu phức tạp. Chúng ta sẽ xem xét nhiều mẫu thao tác như filtering, slicing, finding, matching, mapping và reducing. Sẽ có rất nhiều quiz và bài tập để giúp bạn củng cố hiểu biết của mình.

Tiếp đó, chúng ta sẽ bàn về cách tạo và thao tác với các numeric stream (ví dụ, để sinh ra một stream các số chẵn hoặc các bộ ba Pythagore). Cuối cùng, chúng ta sẽ bàn về cách tạo stream từ những nguồn khác nhau, chẳng hạn như từ một file. Chúng ta cũng sẽ bàn về cách sinh ra stream có vô hạn phần tử — một điều mà chắc chắn bạn không thể làm được với collection!

## 4.2. Bắt đầu với stream

Chúng ta bắt đầu câu chuyện về stream từ collection, bởi đó là cách đơn giản nhất để bắt tay vào làm việc với stream. Collection trong Java 8 hỗ trợ một phương thức mới là `stream`, trả về một stream (định nghĩa của interface này nằm trong `java.util.stream.Stream`). Sau này bạn sẽ thấy rằng còn có nhiều cách khác để lấy được stream (ví dụ, sinh ra các phần tử stream từ một khoảng số hoặc từ các tài nguyên I/O).

Trước hết, stream chính xác là gì? Một định nghĩa ngắn gọn là "một dãy các phần tử đến từ một source, hỗ trợ các thao tác xử lý dữ liệu". Hãy phân tích định nghĩa này từng bước một:

- **Dãy các phần tử (Sequence of elements)** — Giống như collection, một stream cung cấp một interface tới một tập hợp có thứ tự gồm các giá trị thuộc một kiểu phần tử cụ thể. Bởi vì collection là các cấu trúc dữ liệu, chúng chủ yếu xoay quanh việc lưu trữ và truy cập các phần tử với những độ phức tạp thời gian/không gian nhất định (ví dụ, `ArrayList` so với `LinkedList`). Nhưng stream lại xoay quanh việc diễn đạt các phép tính như `filter`, `sorted` và `map` mà bạn đã thấy ở trên. Collection là về *dữ liệu*; stream là về *tính toán*. Chúng tôi sẽ giải thích ý tưởng này kỹ hơn trong các mục sắp tới.
- **Source** — Stream tiêu thụ dữ liệu từ một source cung cấp dữ liệu, chẳng hạn như collection, mảng hoặc tài nguyên I/O. Lưu ý rằng việc sinh ra một stream từ một collection có thứ tự sẽ bảo toàn thứ tự đó. Các phần tử của một stream đến từ một list sẽ có cùng thứ tự với list ấy.
- **Các thao tác xử lý dữ liệu (Data-processing operations)** — Stream hỗ trợ các thao tác kiểu cơ sở dữ liệu cũng như các thao tác phổ biến trong những ngôn ngữ lập trình hàm để thao tác dữ liệu, chẳng hạn `filter`, `map`, `reduce`, `find`, `match`, `sort`, v.v. Các thao tác stream có thể được thực thi tuần tự hoặc song song.

Ngoài ra, các thao tác stream còn có hai đặc điểm quan trọng:

- **Pipelining** — Nhiều thao tác stream lại trả về chính một stream, cho phép nối các thao tác lại với nhau thành một pipeline lớn hơn. Điều này mở ra một số tối ưu hoá mà chúng tôi sẽ giải thích ở chương sau, chẳng hạn như laziness và short-circuiting. Một pipeline gồm nhiều thao tác có thể được xem như một truy vấn kiểu cơ sở dữ liệu trên nguồn dữ liệu.
- **Internal iteration** — Trái ngược với collection vốn được duyệt một cách tường minh bằng iterator, các thao tác stream tự thực hiện việc lặp phía sau hậu trường thay cho bạn. Chúng tôi đã đề cập ngắn gọn tới ý tưởng này ở chương 1 và sẽ quay lại với nó ở mục tiếp theo.

Hãy xem một ví dụ code để làm rõ tất cả những ý tưởng này:

```java
import static java.util.stream.Collectors.toList;

List<String> threeHighCaloricDishNames =
    menu.stream()                                 // Lấy một stream từ menu (danh sách món ăn)
        // Tạo một pipeline các thao tác: trước tiên lọc các món nhiều calo
        .filter(dish -> dish.getCalories() > 300)
        .map(Dish::getName)                       // Lấy tên của các món ăn
        .limit(3)                                 // Chỉ chọn ba món đầu tiên
        .collect(toList());                       // Lưu kết quả vào một List khác
// Cho kết quả [pork, beef, chicken]
System.out.println(threeHighCaloricDishNames);
```

Trong ví dụ này, trước tiên bạn lấy một stream từ danh sách các món ăn bằng cách gọi phương thức `stream` trên `menu`. Nguồn dữ liệu là danh sách các món ăn (thực đơn) và nó cung cấp một dãy các phần tử cho stream. Tiếp theo, bạn áp dụng một loạt thao tác xử lý dữ liệu lên stream: `filter`, `map`, `limit` và `collect`. Tất cả những thao tác này, ngoại trừ `collect`, đều trả về một stream khác nên chúng có thể nối lại với nhau thành một pipeline, và pipeline này có thể được xem như một truy vấn trên source. Cuối cùng, thao tác `collect` mới khởi động việc xử lý pipeline để trả về một kết quả (nó khác biệt vì nó trả về một thứ không phải stream — ở đây là một `List`). Không có kết quả nào được tạo ra, và thực tế là không một phần tử nào của `menu` được chọn cả, cho tới khi `collect` được gọi. Bạn có thể hình dung như thể các lời gọi phương thức trong chuỗi được xếp hàng chờ cho tới khi `collect` được gọi. Hình 4.2 minh hoạ trình tự các thao tác stream: `filter`, `map`, `limit` và `collect`, mỗi thao tác được mô tả ngắn gọn dưới đây:

- `filter` — Nhận vào một lambda để loại bỏ một số phần tử khỏi stream. Trong trường hợp này, bạn chọn những món ăn có hơn 300 calo bằng cách truyền vào lambda `d -> d.getCalories() > 300`.
- `map` — Nhận vào một lambda để biến đổi một phần tử thành một phần tử khác hoặc để trích xuất thông tin. Trong trường hợp này, bạn trích xuất tên của mỗi món ăn bằng cách truyền vào method reference `Dish::getName`, tương đương với lambda `d -> d.getName()`.
- `limit` — Cắt bớt một stream sao cho nó chứa không quá một số lượng phần tử cho trước.
- `collect` — Chuyển đổi một stream thành một dạng khác. Trong trường hợp này bạn chuyển stream thành một list. Trông có vẻ hơi ma thuật; chúng tôi sẽ mô tả chi tiết hơn cách `collect` hoạt động ở chương 6. Ở thời điểm này, bạn có thể xem `collect` như một thao tác nhận đối số là những "công thức" khác nhau để tích luỹ các phần tử của một stream thành một kết quả tổng hợp. Ở đây, `toList()` mô tả công thức để chuyển một stream thành một list.

> **Hình 4.2.** Lọc một thực đơn bằng stream để tìm ra tên của ba món ăn nhiều calo

Hãy để ý xem đoạn code chúng ta vừa mô tả khác thế nào so với những gì bạn sẽ viết nếu phải xử lý danh sách các món trong thực đơn theo từng bước một. Thứ nhất, bạn dùng một phong cách khai báo hơn hẳn để xử lý dữ liệu trong thực đơn, ở đó bạn nói ra *cái* cần làm: "Tìm tên của ba món ăn nhiều calo." Bạn không phải cài đặt các chức năng lọc (`filter`), trích xuất (`map`) hay cắt bớt (`limit`); chúng đã có sẵn thông qua thư viện Streams. Nhờ vậy, Streams API có nhiều tự do hơn để quyết định cách tối ưu hoá pipeline này. Ví dụ, các bước lọc, trích xuất và cắt bớt có thể được gộp lại thành một lượt duyệt duy nhất và dừng ngay khi tìm đủ ba món ăn. Chúng tôi sẽ trình bày một ví dụ minh hoạ điều đó ở chương sau.

Hãy lùi lại một chút và xem xét những khác biệt về mặt khái niệm giữa Collections API và Streams API mới, trước khi chúng ta đi sâu hơn vào những thao tác mà bạn có thể thực hiện với một stream.

## 4.3. Stream so với collection

Cả khái niệm collection vốn có của Java lẫn khái niệm stream mới đều cung cấp interface tới các cấu trúc dữ liệu biểu diễn một tập hợp có thứ tự các giá trị thuộc kiểu phần tử nào đó. Khi nói "có thứ tự" (sequenced), chúng tôi muốn nói rằng thông thường ta duyệt qua các giá trị lần lượt chứ không truy cập ngẫu nhiên theo thứ tự tuỳ ý. Vậy khác biệt nằm ở đâu?

Chúng ta sẽ bắt đầu bằng một phép ẩn dụ trực quan. Hãy xét một bộ phim được lưu trên đĩa DVD. Đây là một collection (có thể là collection của các byte hoặc của các khung hình — ở đây điều đó không quan trọng) bởi vì nó chứa toàn bộ cấu trúc dữ liệu. Bây giờ hãy xét việc xem chính bộ phim đó khi nó được truyền (stream) qua internet. Đây giờ là một stream (của các byte hoặc các khung hình). Trình phát video theo kiểu streaming chỉ cần tải trước vài khung hình so với vị trí người dùng đang xem, nên bạn có thể bắt đầu hiển thị các giá trị từ đầu stream trước khi hầu hết các giá trị trong stream thậm chí còn chưa được tính ra (hãy nghĩ tới việc truyền trực tiếp một trận bóng đá). Đặc biệt lưu ý rằng trình phát video có thể không đủ bộ nhớ để đệm toàn bộ stream vào bộ nhớ dưới dạng một collection — và thời gian khởi động sẽ tệ khủng khiếp nếu bạn phải đợi tới khi khung hình cuối cùng xuất hiện mới bắt đầu chiếu được video. Vì lý do cài đặt trình phát video, bạn có thể chọn đệm một phần của stream vào một collection, nhưng điều đó khác với sự khác biệt về mặt khái niệm.

Nói một cách thô sơ nhất, khác biệt giữa collection và stream nằm ở *thời điểm mọi thứ được tính toán*. Một collection là một cấu trúc dữ liệu nằm trong bộ nhớ, chứa toàn bộ các giá trị mà cấu trúc dữ liệu đó đang có — mọi phần tử trong collection đều phải được tính ra trước khi nó có thể được thêm vào collection. (Bạn có thể thêm phần tử vào và loại bỏ phần tử khỏi collection, nhưng tại mỗi thời điểm, mọi phần tử trong collection đều được lưu trong bộ nhớ; các phần tử phải được tính ra trước khi trở thành một phần của collection.)

Ngược lại, một stream là một cấu trúc dữ liệu cố định về mặt khái niệm (bạn không thể thêm hay bớt phần tử khỏi nó) mà các phần tử được tính theo yêu cầu (on demand). Điều này mang lại những lợi ích lập trình đáng kể. Ở chương 6, chúng tôi sẽ chỉ ra rằng việc dựng một stream chứa tất cả các số nguyên tố (2, 3, 5, 7, 11, ...) đơn giản đến mức nào, cho dù có vô hạn số nguyên tố. Ý tưởng ở đây là người dùng sẽ chỉ lấy ra từ stream đúng những giá trị họ cần, và các phần tử ấy chỉ được sinh ra — một cách vô hình đối với người dùng — khi nào và nếu như chúng thực sự cần thiết. Đây là một dạng của quan hệ nhà sản xuất — người tiêu thụ (producer-consumer). Một cách nhìn khác là stream giống như một collection được dựng một cách lười biếng (lazily constructed): các giá trị chỉ được tính khi có người tiêu thụ yêu cầu (theo ngôn ngữ quản trị thì đây là sản xuất theo nhu cầu, hay thậm chí là sản xuất đúng lúc — just-in-time).

Ngược lại, một collection được dựng một cách háo hức (eagerly constructed, tức do phía cung ứng dẫn dắt: hãy chất đầy kho hàng của bạn trước khi bắt đầu bán, giống như một món đồ chơi Giáng sinh chỉ có vòng đời ngắn ngủi). Hãy thử áp dụng điều này vào ví dụ về số nguyên tố. Việc cố dựng một collection chứa tất cả các số nguyên tố sẽ dẫn đến một vòng lặp chương trình mãi mãi tính ra một số nguyên tố mới — rồi thêm nó vào collection — nhưng không bao giờ có thể hoàn tất việc tạo ra collection ấy, nên phía tiêu thụ sẽ không bao giờ được nhìn thấy nó.

Hình 4.3 minh hoạ sự khác biệt giữa một stream và một collection, áp dụng vào ví dụ DVD so với streaming qua internet của chúng ta.

> **Hình 4.3.** Stream so với collection

Một ví dụ khác là tìm kiếm trên internet bằng trình duyệt. Giả sử bạn tìm một cụm từ có rất nhiều kết quả khớp trên Google hoặc trong một cửa hàng thương mại điện tử trực tuyến. Thay vì phải chờ tải về toàn bộ collection kết quả cùng với hình ảnh của chúng, bạn nhận được một stream mà các phần tử là 10 hoặc 20 kết quả khớp nhất, kèm theo một nút bấm để xem 10 hoặc 20 kết quả tiếp theo. Khi bạn — người tiêu thụ — bấm để xem 10 kết quả tiếp theo, phía cung cấp mới tính ra chúng theo yêu cầu, rồi trả về cho trình duyệt của bạn để hiển thị.

### 4.3.1. Chỉ duyệt được một lần

Lưu ý rằng, tương tự như iterator, một stream chỉ có thể được duyệt một lần. Sau đó stream được coi là đã bị tiêu thụ. Bạn có thể lấy một stream mới từ nguồn dữ liệu ban đầu để duyệt lại, giống như với iterator (với giả định đó là một nguồn có thể lặp lại được, chẳng hạn một collection; nếu đó là một kênh I/O thì bạn hết may mắn rồi). Ví dụ, đoạn code sau sẽ ném ra một ngoại lệ cho biết stream đã bị tiêu thụ:

```java
List<String> title = Arrays.asList("Modern", "Java", "In", "Action");
Stream<String> s = title.stream();
s.forEach(System.out::println);  // In ra từng từ trong tiêu đề
// java.lang.IllegalStateException: stream has already been operated upon or closed
s.forEach(System.out::println);
```

Hãy nhớ rằng bạn chỉ có thể tiêu thụ một stream đúng một lần!

> **Stream và collection dưới góc nhìn triết học**
>
> Với những độc giả yêu thích góc nhìn triết học, bạn có thể xem một stream như một tập hợp các giá trị trải ra theo *thời gian*. Ngược lại, một collection là một tập hợp các giá trị trải ra trong *không gian* (ở đây là bộ nhớ máy tính), tất cả đều tồn tại tại cùng một thời điểm — và bạn truy cập chúng bằng một iterator để lấy ra các thành viên bên trong một vòng lặp for-each.

Một khác biệt then chốt khác giữa collection và stream là cách chúng quản lý việc lặp qua dữ liệu.

### 4.3.2. External iteration so với internal iteration

Việc sử dụng interface `Collection` đòi hỏi phần lặp phải do chính người dùng thực hiện (ví dụ, dùng for-each); đây gọi là external iteration. Ngược lại, thư viện Streams dùng internal iteration — nó thực hiện việc lặp thay cho bạn và lo luôn việc lưu giá trị stream kết quả ở đâu đó; bạn chỉ cần cung cấp một hàm nói rõ cần làm gì. Các listing code dưới đây minh hoạ sự khác biệt này.

**Listing 4.1. Collection: external iteration với vòng lặp for-each**

```java
List<String> names = new ArrayList<>();
// Lặp tuần tự một cách tường minh qua danh sách menu
for (Dish dish : menu) {
    // Trích xuất tên và thêm vào biến tích luỹ
    names.add(dish.getName());
}
```

Lưu ý rằng for-each che giấu bớt một phần độ phức tạp của việc lặp. Cấu trúc for-each là đường cú pháp (syntactic sugar) được dịch thành một thứ xấu xí hơn nhiều, sử dụng một đối tượng `Iterator`.

**Listing 4.2. Collection: external iteration dùng iterator phía sau hậu trường**

```java
List<String> names = new ArrayList<>();
Iterator<Dish> iterator = menu.iterator();
// Lặp một cách tường minh
while (iterator.hasNext()) {
    Dish dish = iterator.next();
    names.add(dish.getName());
}
```

**Listing 4.3. Stream: internal iteration**

```java
List<String> names = menu.stream()
                         // Tham số hoá map bằng phương thức getName
                         // để trích xuất tên của một món ăn
                         .map(Dish::getName)
                         // Bắt đầu thực thi pipeline các thao tác; không có vòng lặp nào
                         .collect(toList());
```

Hãy dùng một phép so sánh để hiểu những khác biệt và lợi ích của internal iteration. Giả sử bạn đang nói chuyện với cô con gái hai tuổi Sofia và muốn bé cất đồ chơi đi:

- Bạn: "Sofia, mình cất đồ chơi đi nào. Dưới sàn có đồ chơi nào không con?"
- Sofia: "Có ạ, quả bóng."
- Bạn: "Được rồi, bỏ quả bóng vào hộp. Còn gì nữa không?"
- Sofia: "Có ạ, con búp bê của con."
- Bạn: "Được rồi, bỏ con búp bê vào hộp. Còn gì nữa không?"
- Sofia: "Có ạ, quyển sách của con."
- Bạn: "Được rồi, bỏ quyển sách vào hộp. Còn gì nữa không?"
- Sofia: "Không ạ, hết rồi."
- Bạn: "Tốt lắm, mình xong rồi."

Đây chính xác là những gì bạn làm mỗi ngày với collection trong Java. Bạn lặp qua một collection theo kiểu external, lấy ra và xử lý từng phần tử một cách tường minh, lần lượt từng cái một. Sẽ tốt hơn nhiều nếu bạn có thể nói với Sofia: "Bỏ tất cả đồ chơi đang ở dưới sàn vào trong hộp." Còn hai lý do khác khiến internal iteration đáng được ưu tiên: thứ nhất, Sofia có thể chọn cầm con búp bê bằng một tay và quả bóng bằng tay kia cùng lúc, và thứ hai, bé có thể quyết định nhặt những món ở gần hộp trước rồi mới đến những món khác. Tương tự như vậy, khi dùng internal iteration, việc xử lý các phần tử có thể được thực hiện song song một cách trong suốt, hoặc theo một thứ tự khác tối ưu hơn. Những tối ưu hoá này rất khó thực hiện nếu bạn lặp qua collection theo kiểu external như bạn vẫn quen làm trong Java. Điều này nghe có vẻ là bới lông tìm vết, nhưng nó chính là phần lớn lý do tồn tại (raison-d'être) của việc Java 8 giới thiệu stream. Internal iteration trong thư viện Streams có thể tự động chọn cách biểu diễn dữ liệu và cách cài đặt cơ chế song song sao cho phù hợp với phần cứng của bạn. Ngược lại, một khi bạn đã chọn external iteration bằng cách viết for-each, thì bạn đã tự cam kết sẽ tự mình quản lý mọi thứ liên quan tới song song hoá. (Tự quản lý trong thực tế nghĩa là hoặc "một ngày đẹp trời nào đó chúng ta sẽ song song hoá cái này", hoặc "bắt đầu một trận chiến dài dằng dặc và gian khổ với đủ thứ task và `synchronized`".) Java 8 cần một interface giống như `Collection` nhưng không có iterator, và thế là `Stream` ra đời! Hình 4.4 minh hoạ sự khác biệt giữa một stream (internal iteration) và một collection (external iteration).

> **Hình 4.4.** Internal iteration so với external iteration

Chúng ta đã mô tả những khác biệt về mặt khái niệm giữa collection và stream. Cụ thể, stream sử dụng internal iteration, ở đó thư viện lo việc lặp thay cho bạn. Nhưng điều này chỉ hữu ích nếu bạn có sẵn một danh sách các thao tác được định nghĩa trước để làm việc cùng (ví dụ `filter` hoặc `map`), những thao tác che giấu việc lặp. Hầu hết các thao tác này nhận lambda expression làm đối số nên bạn có thể tham số hoá hành vi của chúng như chúng tôi đã trình bày ở chương trước. Những người thiết kế ngôn ngữ Java đã phát hành Streams API kèm theo một danh sách đồ sộ các thao tác mà bạn có thể dùng để diễn đạt những truy vấn xử lý dữ liệu phức tạp. Chúng ta sẽ xem lướt qua danh sách các thao tác này ngay bây giờ và khám phá chúng chi tiết hơn cùng ví dụ ở chương sau. Để kiểm tra hiểu biết của bạn về external iteration so với internal iteration, hãy thử làm quiz 4.1 dưới đây.

---

**Quiz 4.1: External iteration so với internal iteration**

Dựa trên những gì bạn đã học về external iteration ở listing 4.1 và 4.2, bạn sẽ dùng thao tác stream nào để tái cấu trúc (refactor) đoạn code sau?

```java
List<String> highCaloricDishes = new ArrayList<>();
Iterator<Dish> iterator = menu.iterator();
while (iterator.hasNext()) {
    Dish dish = iterator.next();
    if (dish.getCalories() > 300) {
        highCaloricDishes.add(dish.getName());
    }
}
```

**Đáp án:** Bạn cần dùng mẫu `filter`

```java
List<String> highCaloricDish =
    menu.stream()
        .filter(dish -> dish.getCalories() > 300)
        .collect(toList());
```

Đừng lo nếu bạn vẫn chưa quen với cách viết chính xác một truy vấn stream, bạn sẽ học điều này kỹ hơn ở chương sau.

---

## 4.4. Các thao tác stream

Interface stream trong `java.util.stream.Stream` định nghĩa rất nhiều thao tác. Chúng có thể được phân thành hai loại. Hãy nhìn lại ví dụ trước đó của chúng ta một lần nữa:

```java
List<String> names = menu.stream()                            // Lấy một stream từ danh sách món ăn
                         .filter(dish -> dish.getCalories() > 300)  // Intermediate operation
                         .map(Dish::getName)                        // Intermediate operation
                         .limit(3)                                  // Intermediate operation
                         .collect(toList());                        // Chuyển Stream thành một List
```

Bạn có thể thấy hai nhóm thao tác:

- `filter`, `map` và `limit` có thể nối lại với nhau để tạo thành một pipeline.
- `collect` khiến pipeline được thực thi và đóng nó lại.

Những thao tác stream có thể nối lại với nhau được gọi là intermediate operation, còn những thao tác đóng một stream lại được gọi là terminal operation. Hình 4.5 làm nổi bật hai nhóm này. Vì sao sự phân biệt này lại quan trọng?

> **Hình 4.5.** Intermediate operation so với terminal operation

### 4.4.1. Intermediate operation

Các intermediate operation như `filter` hay `sorted` trả về một stream khác làm kiểu trả về. Điều này cho phép nối các thao tác lại với nhau để tạo thành một truy vấn. Điều quan trọng là các intermediate operation không thực hiện bất kỳ xử lý nào cho tới khi một terminal operation được gọi trên stream pipeline — chúng lười (lazy). Sở dĩ như vậy là vì các intermediate operation thường có thể được gộp lại và xử lý trong một lượt duy nhất bởi terminal operation.

Để hiểu điều gì đang diễn ra trong stream pipeline, hãy sửa đoạn code sao cho mỗi lambda cũng in ra món ăn mà nó đang xử lý. (Giống như nhiều kỹ thuật minh hoạ và debug khác, đây là phong cách lập trình tồi tệ đối với code chạy thật, nhưng nó giải thích trực tiếp thứ tự tính toán khi bạn đang học.)

```java
List<String> names =
    menu.stream()
        .filter(dish -> {
            // In ra các món ăn khi chúng được lọc
            System.out.println("filtering:" + dish.getName());
            return dish.getCalories() > 300;
        })
        .map(dish -> {
            // In ra các món ăn khi bạn trích xuất tên của chúng
            System.out.println("mapping:" + dish.getName());
            return dish.getName();
        })
        .limit(3)
        .collect(toList());
System.out.println(names);
```

Đoạn code này, khi được thực thi, sẽ in ra kết quả sau:

```text
filtering:pork
mapping:pork
filtering:beef
mapping:beef
filtering:chicken
mapping:chicken
[pork, beef, chicken]
```

Nhờ làm như vậy, bạn có thể nhận ra rằng thư viện Streams thực hiện vài tối ưu hoá bằng cách khai thác bản chất lười biếng của stream. Thứ nhất, mặc dù có nhiều món ăn chứa hơn 300 calo, chỉ ba món đầu tiên được chọn! Đó là nhờ thao tác `limit` và một kỹ thuật gọi là short-circuiting, như chúng tôi sẽ giải thích ở chương sau. Thứ hai, mặc dù `filter` và `map` là hai thao tác riêng biệt, chúng đã được gộp vào cùng một lượt duyệt (các chuyên gia về compiler gọi kỹ thuật này là loop fusion).

### 4.4.2. Terminal operation

Terminal operation tạo ra một kết quả từ một stream pipeline. Kết quả là bất kỳ giá trị nào không phải stream, chẳng hạn một `List`, một `Integer`, hoặc thậm chí là `void`. Ví dụ, trong pipeline sau đây, `forEach` là một terminal operation trả về `void` và áp dụng một lambda lên từng món ăn trong source. Việc truyền `System.out.println` vào `forEach` yêu cầu nó in ra mọi `Dish` trong stream được tạo từ `menu`:

```java
menu.stream().forEach(System.out::println);
```

Để kiểm tra hiểu biết của bạn về intermediate operation so với terminal operation, hãy thử làm quiz 4.2.

---

**Quiz 4.2: Intermediate operation so với terminal operation**

Trong stream pipeline dưới đây, bạn có thể chỉ ra đâu là intermediate operation và đâu là terminal operation không?

```java
long count = menu.stream()
                 .filter(dish -> dish.getCalories() > 300)
                 .distinct()
                 .limit(3)
                 .count();
```

**Đáp án:**

Thao tác cuối cùng trong stream pipeline, `count`, trả về một `long`, đó là một giá trị không phải stream. Do đó nó là một terminal operation. Tất cả các thao tác trước đó — `filter`, `distinct`, `limit` — đều được nối với nhau và trả về một stream. Vì vậy chúng là các intermediate operation.

---

### 4.4.3. Làm việc với stream

Tóm lại, làm việc với stream nói chung bao gồm ba thành phần:

- Một nguồn dữ liệu (chẳng hạn một collection) để thực hiện truy vấn trên đó
- Một chuỗi các intermediate operation tạo thành một stream pipeline
- Một terminal operation thực thi stream pipeline và tạo ra một kết quả

Ý tưởng đằng sau một stream pipeline tương tự như builder pattern (xem http://en.wikipedia.org/wiki/Builder_pattern). Trong builder pattern, có một chuỗi các lời gọi để thiết lập cấu hình (với stream thì đây là chuỗi các intermediate operation), theo sau là một lời gọi tới phương thức build (với stream thì đây là terminal operation).

Để tiện tra cứu, bảng 4.1 và 4.2 tổng kết các intermediate operation và terminal operation mà bạn đã thấy trong các ví dụ code cho tới giờ. Lưu ý rằng đây chưa phải là danh sách đầy đủ các thao tác mà Streams API cung cấp; bạn sẽ thấy thêm vài thao tác nữa ở chương sau!

**Bảng 4.1. Intermediate operation**

| Thao tác | Loại | Kiểu trả về | Đối số của thao tác | Mô tả hàm |
|---|---|---|---|---|
| `filter` | Intermediate | `Stream<T>` | `Predicate<T>` | `T -> boolean` |
| `map` | Intermediate | `Stream<R>` | `Function<T, R>` | `T -> R` |
| `limit` | Intermediate | `Stream<T>` | | |
| `sorted` | Intermediate | `Stream<T>` | `Comparator<T>` | `(T, T) -> int` |
| `distinct` | Intermediate | `Stream<T>` | | |

**Bảng 4.2. Terminal operation**

| Thao tác | Loại | Kiểu trả về | Mục đích |
|---|---|---|---|
| `forEach` | Terminal | `void` | Tiêu thụ từng phần tử của một stream và áp dụng một lambda lên mỗi phần tử đó. |
| `count` | Terminal | `long` | Trả về số lượng phần tử trong một stream. |
| `collect` | Terminal | (generic) | Rút gọn stream để tạo ra một collection chẳng hạn một `List`, một `Map`, hoặc thậm chí một `Integer`. Xem chương 6 để biết thêm chi tiết. |

## 4.5. Lộ trình phía trước

Ở chương tiếp theo, chúng ta sẽ trình bày chi tiết các thao tác stream có sẵn kèm theo những tình huống sử dụng, để bạn thấy được những loại truy vấn nào có thể diễn đạt bằng chúng. Chúng ta sẽ xem xét nhiều mẫu thao tác như filtering, slicing, finding, matching, mapping và reducing, những thứ có thể dùng để diễn đạt các truy vấn xử lý dữ liệu phức tạp.

Sau đó, chương 6 sẽ khám phá chi tiết về collector. Trong chương này chúng ta mới chỉ sử dụng terminal operation `collect()` trên stream (xem bảng 4.2) dưới dạng khuôn mẫu `collect(toList())`, tạo ra một `List` có các phần tử giống hệt các phần tử của stream mà nó được áp dụng lên.

## Tóm tắt

- Một stream là một dãy các phần tử đến từ một source, hỗ trợ các thao tác xử lý dữ liệu.
- Stream sử dụng internal iteration: việc lặp được trừu tượng hoá đi thông qua các thao tác như `filter`, `map` và `sorted`.
- Có hai loại thao tác stream: intermediate operation và terminal operation.
- Các intermediate operation như `filter` và `map` trả về một stream và có thể được nối lại với nhau. Chúng được dùng để thiết lập một pipeline các thao tác nhưng không tạo ra bất kỳ kết quả nào.
- Các terminal operation như `forEach` và `count` trả về một giá trị không phải stream và xử lý một stream pipeline để trả về một kết quả.
- Các phần tử của một stream được tính theo yêu cầu ("một cách lười biếng").
