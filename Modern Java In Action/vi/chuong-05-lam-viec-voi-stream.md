# Chương 5. Làm việc với stream

> **Nội dung chương này**
>
> - Filtering, slicing và mapping
> - Finding, matching và reducing
> - Sử dụng numeric stream (các phiên bản chuyên biệt hoá cho primitive)
> - Tạo stream từ nhiều nguồn khác nhau
> - Stream vô hạn

Ở chương trước, bạn đã thấy rằng stream cho phép bạn chuyển từ external iteration sang internal iteration. Thay vì viết code như dưới đây, nơi bạn phải tự mình quản lý một cách tường minh việc lặp qua một collection dữ liệu (external iteration),

```java
List<Dish> vegetarianDishes = new ArrayList<>();
for (Dish d : menu) {
    if (d.isVegetarian()) {
        vegetarianDishes.add(d);
    }
}
```

bạn có thể dùng Streams API (internal iteration), vốn hỗ trợ các phép toán filter và collect, để quản lý việc lặp qua collection dữ liệu thay cho bạn. Tất cả những gì bạn cần làm là truyền hành vi lọc vào như một đối số cho phương thức filter:

```java
import static java.util.stream.Collectors.toList;

List<Dish> vegetarianDishes =
    menu.stream()
        .filter(Dish::isVegetarian)
        .collect(toList());
```

Cách làm việc khác biệt này với dữ liệu rất hữu ích, bởi vì bạn để cho Streams API quản lý việc xử lý dữ liệu diễn ra như thế nào. Nhờ đó, Streams API có thể tự tìm ra một số tối ưu hoá phía sau hậu trường. Ngoài ra, với internal iteration, Streams API có thể quyết định chạy code của bạn song song. Với external iteration, điều này là không thể, bởi vì bạn đã tự ràng buộc mình vào một vòng lặp tuần tự, từng bước một, trên một luồng đơn.

Trong chương này, bạn sẽ có một cái nhìn rộng rãi về các phép toán khác nhau mà Streams API hỗ trợ. Bạn sẽ tìm hiểu về các phép toán có sẵn trong Java 8 cũng như những bổ sung mới trong Java 9. Những phép toán này sẽ cho phép bạn diễn đạt các truy vấn xử lý dữ liệu phức tạp như filtering, slicing, mapping, finding, matching và reducing. Tiếp theo, chúng ta sẽ khám phá các trường hợp đặc biệt của stream: numeric stream, stream được xây dựng từ nhiều nguồn khác nhau như file và mảng, và cuối cùng là stream vô hạn.

## 5.1. Filtering

Trong mục này, chúng ta sẽ xem xét các cách chọn ra phần tử của một stream: lọc bằng predicate và chỉ lọc các phần tử duy nhất (unique).

### 5.1.1. Filtering với một predicate

Interface Stream hỗ trợ phương thức filter (mà đến giờ chắc bạn đã khá quen thuộc). Phép toán này nhận đối số là một predicate (một hàm trả về giá trị boolean) và trả về một stream chứa tất cả các phần tử thoả mãn predicate đó. Ví dụ, bạn có thể tạo ra một thực đơn chay bằng cách lọc ra tất cả các món ăn chay, như minh hoạ ở hình 5.1 và đoạn code theo sau nó:

> **Hình 5.1.** Lọc một stream bằng một predicate

```java
List<Dish> vegetarianMenu = menu.stream()
                                // Dùng method reference để kiểm tra xem
                                // một món ăn có phù hợp với người ăn chay không
                                .filter(Dish::isVegetarian)
                                .collect(toList());
```

### 5.1.2. Filtering các phần tử duy nhất

Stream cũng hỗ trợ một phương thức tên là distinct, phương thức này trả về một stream chỉ chứa các phần tử duy nhất (căn cứ vào phần cài đặt của các phương thức hashcode và equals của những đối tượng do stream sinh ra). Ví dụ, đoạn code sau lọc tất cả các số chẵn từ một danh sách rồi loại bỏ các phần tử trùng lặp (dùng phương thức equals để so sánh). Hình 5.2 minh hoạ điều này một cách trực quan.

```java
List<Integer> numbers = Arrays.asList(1, 2, 1, 3, 3, 2, 4);
numbers.stream()
       .filter(i -> i % 2 == 0)
       .distinct()
       .forEach(System.out::println);
```

> **Hình 5.2.** Lọc các phần tử duy nhất trong một stream

## 5.2. Cắt lát (slicing) một stream

Trong mục này, chúng ta sẽ bàn về cách chọn và bỏ qua các phần tử trong một stream theo nhiều cách khác nhau. Có những phép toán cho phép bạn chọn hoặc loại bỏ phần tử một cách hiệu quả bằng predicate, bỏ qua một vài phần tử đầu tiên của stream, hoặc cắt ngắn một stream xuống một kích thước cho trước.

### 5.2.1. Slicing bằng một predicate

Java 9 bổ sung thêm hai phương thức mới rất hữu ích cho việc chọn phần tử trong stream một cách hiệu quả: takeWhile và dropWhile.

**Sử dụng takeWhile**

Giả sử bạn có danh sách món ăn đặc biệt sau đây:

```java
List<Dish> specialMenu = Arrays.asList(
    new Dish("seasonal fruit", true, 120, Dish.Type.OTHER),
    new Dish("prawns", false, 300, Dish.Type.FISH),
    new Dish("rice", true, 350, Dish.Type.OTHER),
    new Dish("chicken", false, 400, Dish.Type.MEAT),
    new Dish("french fries", true, 530, Dish.Type.OTHER));
```

Bạn sẽ chọn ra các món ăn có ít hơn 320 calo như thế nào? Theo bản năng, từ mục trước bạn đã biết rằng có thể dùng phép toán filter như sau:

```java
List<Dish> filteredMenu
    = specialMenu.stream()
                 .filter(dish -> dish.getCalories() < 320)
                 .collect(toList());  // Liệt kê seasonal fruit, prawns
```

Nhưng bạn sẽ nhận ra rằng danh sách ban đầu vốn đã được sắp xếp theo số calo! Nhược điểm của việc dùng phép toán filter ở đây là bạn phải lặp qua toàn bộ stream và predicate được áp dụng cho từng phần tử. Thay vào đó, bạn có thể dừng lại ngay khi tìm thấy một món ăn có số calo lớn hơn (hoặc bằng) 320. Với một danh sách nhỏ thì điều này có vẻ chưa phải là lợi ích to lớn, nhưng nó có thể trở nên hữu ích nếu bạn làm việc với một stream có khả năng chứa rất nhiều phần tử. Nhưng làm sao để chỉ định điều đó? Phép toán takeWhile ở đây để giải cứu bạn! Nó cho phép bạn cắt lát bất kỳ stream nào (kể cả stream vô hạn, như bạn sẽ học ở phần sau) bằng một predicate. Nhưng may thay, nó dừng lại ngay khi tìm thấy một phần tử không thoả mãn. Đây là cách bạn có thể dùng nó:

```java
List<Dish> slicedMenu1
    = specialMenu.stream()
                 .takeWhile(dish -> dish.getCalories() < 320)
                 .collect(toList());  // Liệt kê seasonal fruit, prawns
```

**Sử dụng dropWhile**

Thế còn việc lấy các phần tử còn lại thì sao? Làm thế nào để tìm những phần tử có số calo lớn hơn 320? Bạn có thể dùng phép toán dropWhile cho việc này:

```java
List<Dish> slicedMenu2
    = specialMenu.stream()
                 .dropWhile(dish -> dish.getCalories() < 320)
                 .collect(toList());  // Liệt kê rice, chicken, french fries
```

Phép toán dropWhile là phần bù của takeWhile. Nó vứt bỏ các phần tử ở đầu stream nơi predicate cho giá trị false. Khi predicate cho giá trị true, nó dừng lại và trả về toàn bộ các phần tử còn lại, và nó vẫn hoạt động ngay cả khi số phần tử còn lại là vô hạn!

### 5.2.2. Cắt ngắn (truncating) một stream

Stream hỗ trợ phương thức limit(n), phương thức này trả về một stream khác không dài hơn một kích thước cho trước. Kích thước yêu cầu được truyền vào làm đối số của limit. Nếu stream có thứ tự, các phần tử đầu tiên sẽ được trả về, tối đa là n phần tử. Ví dụ, bạn có thể tạo một List bằng cách chọn ba món ăn đầu tiên có hơn 300 calo như sau:

```java
List<Dish> dishes = specialMenu
                        .stream()
                        .filter(dish -> dish.getCalories() > 300)
                        .limit(3)
                        .collect(toList());  // Liệt kê rice, chicken, french fries
```

Hình 5.3 minh hoạ sự kết hợp của filter và limit. Bạn có thể thấy rằng chỉ ba phần tử đầu tiên thoả mãn predicate được chọn, và kết quả được trả về ngay lập tức.

> **Hình 5.3.** Cắt ngắn một stream

Lưu ý rằng limit cũng hoạt động trên các stream không có thứ tự (ví dụ, nếu source là một Set). Trong trường hợp này, bạn không nên giả định bất kỳ thứ tự nào cho kết quả mà limit tạo ra.

### 5.2.3. Bỏ qua phần tử

Stream hỗ trợ phương thức skip(n) để trả về một stream đã loại bỏ n phần tử đầu tiên. Nếu stream có ít hơn n phần tử, một stream rỗng sẽ được trả về. Lưu ý rằng limit(n) và skip(n) bù trừ cho nhau! Ví dụ, đoạn code sau bỏ qua hai món ăn đầu tiên có hơn 300 calo và trả về phần còn lại. Hình 5.4 minh hoạ truy vấn này.

```java
List<Dish> dishes = menu.stream()
                        .filter(d -> d.getCalories() > 300)
                        .skip(2)
                        .collect(toList());
```

> **Hình 5.4.** Bỏ qua các phần tử trong một stream

Hãy đưa những gì bạn vừa học trong mục này vào thực hành với quiz 5.1 trước khi chúng ta chuyển sang các phép toán mapping.

---

**Quiz 5.1: Filtering**

Bạn sẽ dùng stream như thế nào để lọc ra hai món thịt đầu tiên?

**Đáp án:**

Bạn có thể giải bài toán này bằng cách kết hợp hai phương thức filter và limit lại với nhau, rồi dùng collect(toList()) để chuyển stream thành một danh sách như sau:

```java
List<Dish> dishes =
    menu.stream()
        .filter(dish -> dish.getType() == Dish.Type.MEAT)
        .limit(2)
        .collect(toList());
```

---

## 5.3. Mapping

Một thành ngữ phổ biến trong xử lý dữ liệu là chọn ra thông tin từ những đối tượng nhất định. Ví dụ, trong SQL bạn có thể chọn một cột cụ thể từ một bảng. Streams API cung cấp những khả năng tương tự thông qua các phương thức map và flatMap.

### 5.3.1. Áp dụng một hàm lên từng phần tử của stream

Stream hỗ trợ phương thức map, phương thức này nhận một hàm làm đối số. Hàm đó được áp dụng lên từng phần tử, ánh xạ nó thành một phần tử mới (từ *mapping* được dùng vì nó có nghĩa tương tự như *transforming* — biến đổi — nhưng với sắc thái "tạo ra một phiên bản mới" thay vì "sửa đổi"). Ví dụ, trong đoạn code sau bạn truyền một method reference `Dish::getName` cho phương thức map để trích xuất tên của các món ăn trong stream:

```java
List<String> dishNames = menu.stream()
                             .map(Dish::getName)
                             .collect(toList());
```

Bởi vì phương thức getName trả về một chuỗi, stream do phương thức map xuất ra có kiểu Stream<String>.

Hãy lấy một ví dụ hơi khác một chút để củng cố hiểu biết của bạn về map. Cho một danh sách các từ, bạn muốn trả về một danh sách chứa số ký tự của từng từ. Bạn sẽ làm điều đó như thế nào? Bạn cần áp dụng một hàm lên mỗi phần tử của danh sách. Nghe có vẻ là công việc dành cho phương thức map! Hàm cần áp dụng sẽ nhận một từ và trả về độ dài của nó. Bạn có thể giải bài toán này như sau, bằng cách truyền method reference `String::length` cho map:

```java
List<String> words = Arrays.asList("Modern", "Java", "In", "Action");
List<Integer> wordLengths = words.stream()
                                 .map(String::length)
                                 .collect(toList());
```

Hãy quay lại ví dụ mà bạn đã trích xuất tên của từng món ăn. Nếu bạn muốn tìm ra độ dài tên của từng món ăn thì sao? Bạn có thể làm điều này bằng cách nối chuỗi thêm một map nữa như sau:

```java
List<Integer> dishNameLengths = menu.stream()
                                    .map(Dish::getName)
                                    .map(String::length)
                                    .collect(toList());
```

### 5.3.2. Làm phẳng (flattening) stream

Bạn đã thấy cách trả về độ dài của từng từ trong một danh sách bằng phương thức map. Hãy mở rộng ý tưởng này thêm một chút: Làm thế nào để bạn trả về danh sách tất cả các ký tự duy nhất từ một danh sách các từ? Ví dụ, cho danh sách các từ `["Hello", "World"]` bạn muốn trả về danh sách `["H", "e", "l", "o", "W", "r", "d"]`.

Bạn có thể nghĩ rằng điều này dễ thôi, rằng bạn có thể map từng từ thành một danh sách các ký tự rồi gọi distinct để lọc bỏ các ký tự trùng lặp. Thử lần đầu có thể sẽ như sau:

```java
words.stream()
     .map(word -> word.split(""))
     .distinct()
     .collect(toList());
```

Vấn đề với cách tiếp cận này là lambda được truyền cho phương thức map trả về một `String[]` (một mảng String) cho mỗi từ. Stream do phương thức map trả về có kiểu `Stream<String[]>`. Cái bạn muốn là `Stream<String>` để biểu diễn một stream các ký tự. Hình 5.5 minh hoạ vấn đề này.

> **Hình 5.5.** Sử dụng map sai cách để tìm các ký tự duy nhất từ một danh sách các từ

May mắn thay, có một giải pháp cho vấn đề này bằng cách dùng phương thức flatMap! Hãy xem từng bước cách giải quyết nó.

**Thử dùng map và Arrays.stream**

Trước hết, bạn cần một stream các ký tự thay vì một stream các mảng. Có một phương thức tên là `Arrays.stream()` nhận một mảng và tạo ra một stream:

```java
String[] arrayOfWords = {"Goodbye", "World"};
Stream<String> streamOfwords = Arrays.stream(arrayOfWords);
```

Hãy dùng nó trong pipeline ở trên để xem điều gì xảy ra:

```java
words.stream()
     // Chuyển mỗi từ thành một mảng các chữ cái riêng lẻ của nó
     .map(word -> word.split(""))
     // Biến mỗi mảng thành một stream riêng biệt
     .map(Arrays::stream)
     .distinct()
     .collect(toList());
```

Giải pháp hiện tại vẫn chưa hoạt động! Đó là vì bây giờ bạn lại kết thúc với một danh sách các stream (chính xác hơn là `List<Stream<String>>`). Quả thật, trước tiên bạn chuyển mỗi từ thành một mảng các chữ cái riêng lẻ của nó, rồi biến mỗi mảng thành một stream riêng biệt.

**Sử dụng flatMap**

Bạn có thể khắc phục vấn đề này bằng cách dùng flatMap như sau:

```java
List<String> uniqueCharacters =
    words.stream()
         // Chuyển mỗi từ thành một mảng các chữ cái riêng lẻ của nó
         .map(word -> word.split(""))
         // Làm phẳng mỗi stream được sinh ra thành một stream duy nhất
         .flatMap(Arrays::stream)
         .distinct()
         .collect(toList());
```

Việc dùng phương thức flatMap có tác dụng ánh xạ mỗi mảng không phải thành một stream, mà thành nội dung của stream đó. Tất cả các stream riêng lẻ được sinh ra khi dùng `map(Arrays::stream)` được hợp nhất lại — làm phẳng thành một stream duy nhất. Hình 5.6 minh hoạ tác dụng của việc dùng phương thức flatMap. Hãy so sánh nó với những gì map làm ở hình 5.5.

> **Hình 5.6.** Sử dụng flatMap để tìm các ký tự duy nhất từ một danh sách các từ

Nói ngắn gọn, phương thức flatMap cho phép bạn thay thế mỗi giá trị của một stream bằng một stream khác, rồi nối tất cả các stream được sinh ra thành một stream duy nhất.

Chúng ta sẽ quay lại với flatMap ở chương 11 khi bàn về các mẫu Java 8 nâng cao hơn, chẳng hạn như dùng lớp thư viện mới Optional để kiểm tra null. Để củng cố hiểu biết của bạn về map và flatMap, hãy thử làm quiz 5.2.

---

**Quiz 5.2: Mapping**

**1.** Cho một danh sách các số, bạn sẽ trả về danh sách bình phương của từng số như thế nào? Ví dụ, cho `[1, 2, 3, 4, 5]` bạn cần trả về `[1, 4, 9, 16, 25]`.

**Đáp án:**

Bạn có thể giải bài toán này bằng cách dùng map với một lambda nhận một số và trả về bình phương của số đó:

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> squares =
    numbers.stream()
           .map(n -> n * n)
           .collect(toList());
```

**2.** Cho hai danh sách số, bạn sẽ trả về tất cả các cặp số như thế nào? Ví dụ, cho danh sách `[1, 2, 3]` và danh sách `[3, 4]` bạn cần trả về `[(1, 3), (1, 4), (2, 3), (2, 4), (3, 3), (3, 4)]`. Để cho đơn giản, bạn có thể biểu diễn một cặp bằng một mảng hai phần tử.

**Đáp án:**

Bạn có thể dùng hai lần map để lặp trên hai danh sách và sinh ra các cặp. Nhưng cách đó sẽ trả về một `Stream<Stream<Integer[]>>`. Điều bạn cần làm là làm phẳng các stream được sinh ra để có kết quả là `Stream<Integer[]>`. Đây chính là công dụng của flatMap:

```java
List<Integer> numbers1 = Arrays.asList(1, 2, 3);
List<Integer> numbers2 = Arrays.asList(3, 4);
List<int[]> pairs =
    numbers1.stream()
            .flatMap(i -> numbers2.stream()
                                  .map(j -> new int[]{i, j})
            )
            .collect(toList());
```

**3.** Bạn sẽ mở rộng ví dụ trước như thế nào để chỉ trả về những cặp có tổng chia hết cho 3?

**Đáp án:**

Trước đó bạn đã thấy rằng filter có thể được dùng cùng một predicate để lọc các phần tử từ một stream. Bởi vì sau phép toán flatMap bạn có một stream các `int[]` biểu diễn một cặp, bạn chỉ cần một predicate để kiểm tra xem tổng có chia hết cho 3 hay không:

```java
List<Integer> numbers1 = Arrays.asList(1, 2, 3);
List<Integer> numbers2 = Arrays.asList(3, 4);
List<int[]> pairs =
    numbers1.stream()
            .flatMap(i ->
                numbers2.stream()
                        .filter(j -> (i + j) % 3 == 0)
                        .map(j -> new int[]{i, j})
            )
            .collect(toList());
```

Kết quả là `[(2, 4), (3, 3)]`.

---

## 5.4. Finding và matching

Một thành ngữ phổ biến khác trong xử lý dữ liệu là tìm xem liệu có phần tử nào trong một tập dữ liệu thoả mãn một tính chất cho trước hay không. Streams API cung cấp những khả năng đó thông qua các phương thức allMatch, anyMatch, noneMatch, findFirst và findAny của một stream.

### 5.4.1. Kiểm tra xem một predicate có khớp với ít nhất một phần tử hay không

Phương thức anyMatch có thể được dùng để trả lời câu hỏi "Có phần tử nào trong stream khớp với predicate cho trước không?" Ví dụ, bạn có thể dùng nó để tìm xem thực đơn có lựa chọn cho người ăn chay hay không:

```java
if (menu.stream().anyMatch(Dish::isVegetarian)) {
    System.out.println("The menu is (somewhat) vegetarian friendly!!");
}
```

Phương thức anyMatch trả về một giá trị boolean và do đó là một terminal operation.

### 5.4.2. Kiểm tra xem một predicate có khớp với tất cả các phần tử hay không

Phương thức allMatch hoạt động tương tự anyMatch, nhưng nó sẽ kiểm tra xem tất cả các phần tử của stream có khớp với predicate cho trước hay không. Ví dụ, bạn có thể dùng nó để tìm xem thực đơn có lành mạnh hay không (tất cả các món đều dưới 1000 calo):

```java
boolean isHealthy = menu.stream()
                        .allMatch(dish -> dish.getCalories() < 1000);
```

**noneMatch**

Đối lập với allMatch là noneMatch. Nó bảo đảm rằng không có phần tử nào trong stream khớp với predicate cho trước. Ví dụ, bạn có thể viết lại ví dụ trên bằng noneMatch như sau:

```java
boolean isHealthy = menu.stream()
                        .noneMatch(d -> d.getCalories() >= 1000);
```

Ba phép toán này — anyMatch, allMatch và noneMatch — sử dụng cái mà chúng ta gọi là short-circuiting, phiên bản dành cho stream của các toán tử short-circuiting quen thuộc `&&` và `||` trong Java.

> **Đánh giá kiểu short-circuiting**
>
> Một số phép toán không cần xử lý toàn bộ stream để tạo ra kết quả. Ví dụ, giả sử bạn cần đánh giá một biểu thức boolean lớn được nối với nhau bằng các toán tử and. Bạn chỉ cần tìm ra rằng một biểu thức con là false để suy ra rằng toàn bộ biểu thức sẽ trả về false, bất kể biểu thức đó dài đến đâu; không cần đánh giá toàn bộ biểu thức. Đây chính là điều mà short-circuiting nói tới.
>
> Liên quan tới stream, một số phép toán nhất định như allMatch, noneMatch, findFirst và findAny không cần xử lý toàn bộ stream để tạo ra kết quả. Ngay khi tìm thấy một phần tử, kết quả đã có thể được tạo ra. Tương tự, limit cũng là một phép toán short-circuiting. Phép toán này chỉ cần tạo ra một stream có kích thước cho trước mà không cần xử lý tất cả các phần tử trong stream. Những phép toán như vậy rất hữu ích (ví dụ, khi bạn cần xử lý các stream có kích thước vô hạn, bởi vì chúng có thể biến một stream vô hạn thành một stream hữu hạn). Chúng tôi sẽ trình bày các ví dụ về stream vô hạn ở mục 5.7.

### 5.4.3. Tìm một phần tử

Phương thức findAny trả về một phần tử tuỳ ý của stream hiện tại. Nó có thể được dùng kết hợp với các phép toán stream khác. Ví dụ, bạn có thể muốn tìm một món ăn chay. Bạn có thể kết hợp phương thức filter với findAny để diễn đạt truy vấn này:

```java
Optional<Dish> dish =
    menu.stream()
        .filter(Dish::isVegetarian)
        .findAny();
```

Stream pipeline sẽ được tối ưu hoá phía sau hậu trường để thực hiện một lượt duyệt duy nhất và kết thúc ngay khi tìm thấy kết quả nhờ short-circuiting. Nhưng khoan đã; cái thứ Optional trong đoạn code này là gì vậy?

**Optional trong vài dòng**

Lớp `Optional<T>` (`java.util.Optional`) là một lớp chứa (container) dùng để biểu diễn sự tồn tại hoặc vắng mặt của một giá trị. Trong đoạn code trên, có khả năng findAny không tìm thấy phần tử nào. Thay vì trả về null — vốn nổi tiếng là dễ gây lỗi — các nhà thiết kế thư viện Java 8 đã giới thiệu `Optional<T>`. Chúng ta sẽ không đi vào chi tiết về Optional ở đây, bởi vì chúng tôi sẽ trình bày chi tiết ở chương 11 về cách code của bạn có thể hưởng lợi từ việc dùng Optional để tránh các lỗi liên quan tới việc kiểm tra null. Nhưng hiện tại, bạn nên biết rằng có một vài phương thức trong Optional buộc bạn phải kiểm tra một cách tường minh sự hiện diện của giá trị hoặc xử lý sự vắng mặt của giá trị:

- `isPresent()` trả về true nếu Optional chứa một giá trị, ngược lại trả về false.
- `ifPresent(Consumer<T> block)` thực thi khối lệnh cho trước nếu có một giá trị hiện diện. Chúng ta đã giới thiệu functional interface Consumer ở chương 3; nó cho phép bạn truyền vào một lambda nhận một đối số kiểu T và trả về void.
- `T get()` trả về giá trị nếu có; ngược lại nó ném ra NoSuchElementException.
- `T orElse(T other)` trả về giá trị nếu có; ngược lại nó trả về một giá trị mặc định.

Ví dụ, trong đoạn code trên bạn sẽ cần kiểm tra một cách tường minh sự hiện diện của một món ăn trong đối tượng Optional để truy cập tên của nó:

```java
menu.stream()
    .filter(Dish::isVegetarian)
    .findAny()  // Trả về một Optional<Dish>.
    // Nếu có giá trị bên trong, nó được in ra; ngược lại không có gì xảy ra.
    .ifPresent(dish -> System.out.println(dish.getName()));
```

### 5.4.4. Tìm phần tử đầu tiên

Một số stream có một *encounter order* (thứ tự gặp) quy định thứ tự mà các phần tử xuất hiện một cách logic trong stream (ví dụ, một stream được sinh ra từ một List hoặc từ một dãy dữ liệu đã sắp xếp). Với những stream như vậy, bạn có thể muốn tìm phần tử đầu tiên. Có phương thức findFirst cho việc này, nó hoạt động tương tự findAny (ví dụ, đoạn code sau, cho một danh sách các số, tìm số bình phương đầu tiên chia hết cho 3):

```java
List<Integer> someNumbers = Arrays.asList(1, 2, 3, 4, 5);
Optional<Integer> firstSquareDivisibleByThree =
    someNumbers.stream()
               .map(n -> n * n)
               .filter(n -> n % 3 == 0)
               .findFirst(); // 9
```

> **Khi nào dùng findFirst và findAny**
>
> Bạn có thể thắc mắc vì sao lại có cả findFirst lẫn findAny. Câu trả lời là tính song song. Việc tìm phần tử đầu tiên bị ràng buộc nhiều hơn khi chạy song song. Nếu bạn không quan tâm phần tử nào được trả về, hãy dùng findAny bởi vì nó ít ràng buộc hơn khi làm việc với parallel stream.

## 5.5. Reducing

Các terminal operation mà bạn đã thấy hoặc trả về một boolean (allMatch và các phương thức tương tự), void (forEach), hoặc một đối tượng Optional (findAny và các phương thức tương tự). Bạn cũng đã dùng collect để gộp tất cả các phần tử trong một stream thành một List.

Trong mục này, bạn sẽ thấy cách kết hợp các phần tử của một stream để diễn đạt những truy vấn phức tạp hơn như "Tính tổng số calo của toàn bộ thực đơn" hoặc "Món ăn nào trong thực đơn có nhiều calo nhất?" bằng phép toán reduce. Những truy vấn kiểu này kết hợp lặp đi lặp lại tất cả các phần tử trong stream để tạo ra một giá trị duy nhất, chẳng hạn một Integer. Các truy vấn này có thể được phân loại là các phép toán rút gọn (reduction operation) — một stream được rút gọn thành một giá trị. Trong thuật ngữ của các ngôn ngữ lập trình hàm, điều này được gọi là *fold*, bởi vì bạn có thể xem phép toán này như việc gấp đi gấp lại một tờ giấy dài (chính là stream của bạn) cho tới khi nó tạo thành một hình vuông nhỏ, chính là kết quả của phép fold.

### 5.5.1. Tính tổng các phần tử

Trước khi tìm hiểu cách dùng phương thức reduce, sẽ hữu ích nếu trước tiên ta xem cách bạn tính tổng các phần tử của một danh sách số bằng vòng lặp for-each:

```java
int sum = 0;
for (int x : numbers) {
    sum += x;
}
```

Mỗi phần tử của numbers được kết hợp lặp đi lặp lại với toán tử cộng để tạo thành kết quả. Bạn đã rút gọn danh sách số thành một số duy nhất bằng cách dùng phép cộng lặp đi lặp lại. Có hai tham số trong đoạn code này:

- Giá trị khởi tạo của biến sum, trong trường hợp này là 0
- Phép toán để kết hợp tất cả các phần tử của danh sách, trong trường hợp này là `+`

Sẽ tuyệt biết bao nếu bạn cũng có thể nhân tất cả các số lại mà không phải sao chép và dán lại đoạn code này! Đây chính là lúc phép toán reduce — vốn trừu tượng hoá mẫu hình áp dụng lặp lại này — có thể giúp bạn. Bạn có thể tính tổng tất cả các phần tử của một stream như sau:

```java
int sum = numbers.stream().reduce(0, (a, b) -> a + b);
```

reduce nhận hai đối số:

- Một giá trị khởi tạo, ở đây là 0.
- Một `BinaryOperator<T>` để kết hợp hai phần tử và tạo ra một giá trị mới; ở đây bạn dùng lambda `(a, b) -> a + b`.

Bạn cũng có thể dễ dàng nhân tất cả các phần tử lại bằng cách truyền một lambda khác, `(a, b) -> a * b`, cho phép toán reduce:

```java
int product = numbers.stream().reduce(1, (a, b) -> a * b);
```

Hình 5.7 minh hoạ cách phép toán reduce hoạt động trên một stream: lambda kết hợp lặp đi lặp lại từng phần tử cho tới khi stream chứa các số nguyên 4, 5, 3, 9 được rút gọn thành một giá trị duy nhất.

> **Hình 5.7.** Sử dụng reduce để tính tổng các số trong một stream

Hãy xem xét kỹ hơn cách phép toán reduce diễn ra khi tính tổng một stream các số. Đầu tiên, 0 được dùng làm tham số thứ nhất của lambda (a), và 4 được tiêu thụ từ stream và dùng làm tham số thứ hai (b). `0 + 4` cho ra 4, và nó trở thành giá trị tích luỹ mới. Sau đó lambda lại được gọi với giá trị tích luỹ và phần tử tiếp theo của stream, là 5, cho ra giá trị tích luỹ mới là 9. Tiếp tục, lambda lại được gọi với giá trị tích luỹ và phần tử tiếp theo, là 3, cho ra 12. Cuối cùng, lambda được gọi với 12 và phần tử cuối cùng của stream là 9, cho ra giá trị cuối cùng là 21.

Bạn có thể làm cho đoạn code này ngắn gọn hơn bằng cách dùng method reference. Từ Java 8, lớp Integer đã có sẵn một static method tên là sum để cộng hai số, và đó chính là cái bạn muốn thay vì phải viết đi viết lại cùng một đoạn code dưới dạng lambda:

```java
int sum = numbers.stream().reduce(0, Integer::sum);
```

**Không có giá trị khởi tạo**

Cũng có một biến thể nạp chồng (overload) của reduce không nhận giá trị khởi tạo, nhưng nó trả về một đối tượng Optional:

```java
Optional<Integer> sum = numbers.stream().reduce((a, b) -> (a + b));
```

Vì sao nó lại trả về một `Optional<Integer>`? Hãy xét trường hợp stream không chứa phần tử nào. Phép toán reduce không thể trả về một tổng bởi vì nó không có giá trị khởi tạo. Đây là lý do kết quả được bọc trong một đối tượng Optional để chỉ ra rằng tổng có thể vắng mặt. Bây giờ hãy xem bạn còn có thể làm gì khác với reduce.

### 5.5.2. Giá trị lớn nhất và nhỏ nhất

Hoá ra reduction cũng là tất cả những gì bạn cần để tính giá trị lớn nhất và nhỏ nhất! Hãy xem cách bạn có thể áp dụng những gì vừa học về reduce để tính phần tử lớn nhất hoặc nhỏ nhất trong một stream. Như bạn đã thấy, reduce nhận hai tham số:

- Một giá trị khởi tạo
- Một lambda để kết hợp hai phần tử của stream và tạo ra một giá trị mới

Lambda được áp dụng từng bước lên mỗi phần tử của stream với toán tử cộng, như minh hoạ ở hình 5.7. Bạn cần một lambda mà khi cho hai phần tử, sẽ trả về giá trị lớn hơn trong hai phần tử đó. Phép toán reduce sẽ dùng giá trị mới cùng với phần tử tiếp theo của stream để tạo ra giá trị lớn nhất mới cho tới khi toàn bộ stream được tiêu thụ hết! Bạn có thể dùng reduce như sau để tính giá trị lớn nhất trong một stream; điều này được minh hoạ ở hình 5.8.

```java
Optional<Integer> max = numbers.stream().reduce(Integer::max);
```

Để tính giá trị nhỏ nhất, bạn cần truyền `Integer.min` cho phép toán reduce thay vì `Integer.max`:

```java
Optional<Integer> min = numbers.stream().reduce(Integer::min);
```

Bạn cũng hoàn toàn có thể dùng lambda `(x, y) -> x < y ? x : y` thay cho `Integer::min`, nhưng cách sau rõ ràng là dễ đọc hơn!

> **Hình 5.8.** Một phép toán reduce — tính giá trị lớn nhất

Để kiểm tra hiểu biết của bạn về phép toán reduce, hãy thử làm quiz 5.3.

---

**Quiz 5.3: Reducing**

Bạn sẽ đếm số món ăn trong một stream như thế nào bằng cách dùng các phương thức map và reduce?

**Đáp án:**

Bạn có thể giải bài toán này bằng cách ánh xạ mỗi phần tử của stream thành số 1 rồi cộng chúng lại bằng reduce! Điều này tương đương với việc đếm lần lượt số phần tử trong stream:

```java
int count = menu.stream()
                .map(d -> 1)
                .reduce(0, (a, b) -> a + b);
```

Một chuỗi map rồi reduce thường được biết đến với tên gọi mẫu hình map-reduce, nổi tiếng nhờ việc Google dùng nó cho tìm kiếm web, bởi vì nó có thể dễ dàng được song song hoá. Lưu ý rằng ở chương 4 bạn đã thấy phương thức count có sẵn để đếm số phần tử trong stream:

```java
long count = menu.stream().count();
```

---

> **Lợi ích của phương thức reduce và tính song song**
>
> Lợi ích của việc dùng reduce so với phép cộng lặp từng bước mà bạn đã viết trước đó là việc lặp được trừu tượng hoá bằng internal iteration, điều này cho phép phần cài đặt bên trong có thể chọn thực hiện phép toán reduce song song. Ví dụ tính tổng theo kiểu lặp có liên quan tới việc cập nhật chia sẻ trên biến sum, và điều đó không song song hoá một cách êm ả được. Nếu bạn thêm vào phần đồng bộ hoá cần thiết, có lẽ bạn sẽ phát hiện ra rằng sự tranh chấp giữa các luồng (thread contention) cướp đi toàn bộ hiệu năng mà tính song song lẽ ra phải mang lại! Việc song song hoá phép tính này đòi hỏi một cách tiếp cận khác: phân hoạch dữ liệu đầu vào, tính tổng các phân hoạch, rồi kết hợp các tổng lại. Nhưng lúc đó đoạn code bắt đầu trông rất khác. Bạn sẽ thấy nó trông như thế nào ở chương 7 khi dùng fork/join framework. Nhưng hiện tại, điều quan trọng là phải nhận ra rằng mẫu hình dùng bộ tích luỹ mutable là một ngõ cụt cho việc song song hoá. Bạn cần một mẫu hình mới, và đó chính là cái mà reduce mang lại cho bạn. Bạn cũng sẽ thấy ở chương 7 rằng để tính tổng tất cả các phần tử một cách song song bằng stream, gần như không cần sửa đổi gì trong code của bạn: `stream()` trở thành `parallelStream()`:
>
> ```java
> int sum = numbers.parallelStream().reduce(0, Integer::sum);
> ```
>
> Nhưng có một cái giá phải trả để thực thi đoạn code này song song, như chúng tôi sẽ giải thích ở phần sau: lambda được truyền cho reduce không được thay đổi trạng thái (ví dụ, các biến thể hiện), và phép toán cần có tính kết hợp (associative) và giao hoán (commutative) để nó có thể được thực thi theo bất kỳ thứ tự nào.

Bạn đã thấy các ví dụ reduction tạo ra một Integer: tổng của một stream, giá trị lớn nhất của một stream, hoặc số phần tử trong một stream. Bạn sẽ thấy, ở mục 5.6, rằng còn có thêm những phương thức có sẵn như sum và max để giúp bạn viết code ngắn gọn hơn một chút cho các mẫu reduction phổ biến. Chúng ta sẽ tìm hiểu một dạng reduction phức tạp hơn dùng phương thức collect ở chương tiếp theo. Ví dụ, thay vì rút gọn một stream thành một Integer, bạn cũng có thể rút gọn nó thành một Map nếu bạn muốn nhóm các món ăn theo loại.

> **Các phép toán stream: stateless và stateful**
>
> Bạn đã thấy rất nhiều phép toán stream. Một lần giới thiệu đầu tiên có thể khiến chúng trông như thuốc chữa bách bệnh. Mọi thứ hoạt động trơn tru, và bạn có được tính song song miễn phí khi dùng parallelStream thay vì stream để lấy một stream từ một collection.
>
> Chắc chắn là với nhiều ứng dụng thì điều đó đúng, như bạn đã thấy ở các ví dụ trước. Bạn có thể biến một danh sách món ăn thành một stream, dùng filter để chọn ra các món ăn thuộc một loại nhất định, rồi dùng map trên stream kết quả để lấy ra số calo, và sau đó dùng reduce để tạo ra tổng số calo của thực đơn. Bạn thậm chí có thể thực hiện những phép tính stream như vậy một cách song song. Nhưng các phép toán này có những đặc điểm khác nhau. Có những vấn đề về trạng thái nội tại mà chúng cần để hoạt động.
>
> Những phép toán như map và filter lấy từng phần tử từ stream đầu vào và tạo ra không hoặc một kết quả ở stream đầu ra. Nói chung, các phép toán này là stateless: chúng không có trạng thái nội tại (với giả định rằng lambda hoặc method reference do người dùng cung cấp không có trạng thái mutable nội tại).
>
> Nhưng những phép toán như reduce, sum và max cần có trạng thái nội tại để tích luỹ kết quả. Trong trường hợp này trạng thái nội tại là nhỏ. Trong ví dụ của chúng ta, nó chỉ gồm một int hoặc một double. Trạng thái nội tại có kích thước bị chặn bất kể có bao nhiêu phần tử trong stream đang được xử lý.
>
> Ngược lại, một số phép toán như sorted hoặc distinct thoạt nhìn có vẻ hành xử giống filter hay map — tất cả đều nhận một stream và tạo ra một stream khác (một intermediate operation) — nhưng có một khác biệt then chốt. Cả việc sắp xếp lẫn việc loại bỏ trùng lặp khỏi một stream đều đòi hỏi phải biết lịch sử trước đó để làm được việc của chúng. Ví dụ, việc sắp xếp đòi hỏi tất cả các phần tử phải được đưa vào bộ đệm trước khi một phần tử đơn lẻ có thể được thêm vào stream đầu ra; yêu cầu về lưu trữ của phép toán này là không bị chặn. Điều này có thể gây vấn đề nếu luồng dữ liệu là lớn hoặc vô hạn. (Việc đảo ngược stream chứa mọi số nguyên tố nên làm gì? Nó nên trả về số nguyên tố lớn nhất, mà toán học cho chúng ta biết là không tồn tại.) Chúng ta gọi những phép toán này là stateful operation.

Đến giờ bạn đã thấy rất nhiều phép toán stream mà bạn có thể dùng để diễn đạt những truy vấn xử lý dữ liệu tinh vi! Bảng 5.1 tóm tắt các phép toán đã gặp cho tới lúc này. Bạn sẽ được thực hành chúng ở mục tiếp theo qua một bài tập.

**Bảng 5.1. Các intermediate operation và terminal operation**

| Phép toán | Kiểu | Kiểu trả về | Kiểu / functional interface được dùng | Function descriptor |
|---|---|---|---|---|
| filter | Intermediate | Stream\<T\> | Predicate\<T\> | T -> boolean |
| distinct | Intermediate (stateful-unbounded) | Stream\<T\> | | |
| takeWhile | Intermediate | Stream\<T\> | Predicate\<T\> | T -> boolean |
| dropWhile | Intermediate | Stream\<T\> | Predicate\<T\> | T -> boolean |
| skip | Intermediate (stateful-bounded) | Stream\<T\> | long | |
| limit | Intermediate (stateful-bounded) | Stream\<T\> | long | |
| map | Intermediate | Stream\<R\> | Function\<T, R\> | T -> R |
| flatMap | Intermediate | Stream\<R\> | Function\<T, Stream\<R\>\> | T -> Stream\<R\> |
| sorted | Intermediate (stateful-unbounded) | Stream\<T\> | Comparator\<T\> | (T, T) -> int |
| anyMatch | Terminal | boolean | Predicate\<T\> | T -> boolean |
| noneMatch | Terminal | boolean | Predicate\<T\> | T -> boolean |
| allMatch | Terminal | boolean | Predicate\<T\> | T -> boolean |
| findAny | Terminal | Optional\<T\> | | |
| findFirst | Terminal | Optional\<T\> | | |
| forEach | Terminal | void | Consumer\<T\> | T -> void |
| collect | Terminal | R | Collector\<T, A, R\> | |
| reduce | Terminal (stateful-bounded) | Optional\<T\> | BinaryOperator\<T\> | (T, T) -> T |
| count | Terminal | long | | |

## 5.6. Đưa tất cả vào thực hành

Trong mục này, bạn sẽ được thực hành những gì đã học về stream cho tới lúc này. Bây giờ chúng ta khám phá một miền (domain) khác: các trader (nhà giao dịch) thực hiện các transaction (giao dịch). Sếp của bạn yêu cầu bạn tìm câu trả lời cho tám truy vấn. Bạn làm được không? Chúng tôi đưa ra lời giải ở mục 5.6.2, nhưng bạn nên tự thử trước để có chút thực hành:

1. Tìm tất cả các giao dịch trong năm 2011 và sắp xếp chúng theo giá trị (từ nhỏ đến lớn).
2. Tất cả các thành phố duy nhất nơi các trader làm việc là gì?
3. Tìm tất cả các trader đến từ Cambridge và sắp xếp họ theo tên.
4. Trả về một chuỗi gồm tên của tất cả các trader được sắp xếp theo thứ tự bảng chữ cái.
5. Có trader nào đặt trụ sở ở Milan không?
6. In ra giá trị của tất cả các giao dịch từ những trader sống ở Cambridge.
7. Giá trị cao nhất trong tất cả các giao dịch là bao nhiêu?
8. Tìm giao dịch có giá trị nhỏ nhất.

### 5.6.1. Miền dữ liệu: Trader và Transaction

Đây là miền dữ liệu mà bạn sẽ làm việc, một danh sách các Trader và Transaction:

```java
Trader raoul = new Trader("Raoul", "Cambridge");
Trader mario = new Trader("Mario", "Milan");
Trader alan = new Trader("Alan", "Cambridge");
Trader brian = new Trader("Brian", "Cambridge");

List<Transaction> transactions = Arrays.asList(
    new Transaction(brian, 2011, 300),
    new Transaction(raoul, 2012, 1000),
    new Transaction(raoul, 2011, 400),
    new Transaction(mario, 2012, 710),
    new Transaction(mario, 2012, 700),
    new Transaction(alan, 2012, 950)
);
```

Trader và Transaction là các lớp được định nghĩa như sau:

```java
public class Trader {
    private final String name;
    private final String city;

    public Trader(String n, String c) {
        this.name = n;
        this.city = c;
    }

    public String getName() {
        return this.name;
    }

    public String getCity() {
        return this.city;
    }

    public String toString() {
        return "Trader:" + this.name + " in " + this.city;
    }
}

public class Transaction {
    private final Trader trader;
    private final int year;
    private final int value;

    public Transaction(Trader trader, int year, int value) {
        this.trader = trader;
        this.year = year;
        this.value = value;
    }

    public Trader getTrader() {
        return this.trader;
    }

    public int getYear() {
        return this.year;
    }

    public int getValue() {
        return this.value;
    }

    public String toString() {
        return "{" + this.trader + ", " +
               "year: " + this.year + ", " +
               "value:" + this.value + "}";
    }
}
```

### 5.6.2. Lời giải

Bây giờ chúng tôi cung cấp lời giải trong các listing code sau đây, để bạn có thể kiểm chứng hiểu biết của mình về những gì đã học cho tới lúc này. Làm tốt lắm!

**Listing 5.1. Tìm tất cả các giao dịch trong năm 2011 và sắp xếp theo giá trị (từ nhỏ đến lớn)**

```java
List<Transaction> tr2011 =
    transactions.stream()
                // Truyền một predicate cho filter để chọn các giao dịch năm 2011
                .filter(transaction -> transaction.getYear() == 2011)
                // Sắp xếp chúng theo giá trị của giao dịch
                .sorted(comparing(Transaction::getValue))
                // Thu thập tất cả phần tử của Stream kết quả vào một List
                .collect(toList());
```

**Listing 5.2. Tất cả các thành phố duy nhất nơi các trader làm việc là gì?**

```java
List<String> cities =
    transactions.stream()
                // Trích xuất thành phố từ mỗi trader gắn với giao dịch
                .map(transaction -> transaction.getTrader().getCity())
                // Chỉ chọn các thành phố duy nhất
                .distinct()
                .collect(toList());
```

Bạn chưa gặp cái này, nhưng bạn cũng có thể bỏ `distinct()` và dùng `toSet()` thay thế, cách này sẽ chuyển stream thành một set. Bạn sẽ tìm hiểu thêm về nó ở chương 6.

```java
Set<String> cities =
    transactions.stream()
                .map(transaction -> transaction.getTrader().getCity())
                .collect(toSet());
```

**Listing 5.3. Tìm tất cả các trader đến từ Cambridge và sắp xếp họ theo tên**

```java
List<Trader> traders =
    transactions.stream()
                // Trích xuất tất cả trader từ các giao dịch
                .map(Transaction::getTrader)
                // Chỉ chọn các trader đến từ Cambridge
                .filter(trader -> trader.getCity().equals("Cambridge"))
                // Loại bỏ mọi phần tử trùng lặp
                .distinct()
                // Sắp xếp stream trader kết quả theo tên của họ
                .sorted(comparing(Trader::getName))
                .collect(toList());
```

**Listing 5.4. Trả về một chuỗi gồm tên của tất cả các trader được sắp xếp theo thứ tự bảng chữ cái**

```java
String traderStr =
    transactions.stream()
                // Trích xuất tất cả tên của các trader thành một Stream các String
                .map(transaction -> transaction.getTrader().getName())
                // Loại bỏ các tên trùng lặp
                .distinct()
                // Sắp xếp các tên theo thứ tự bảng chữ cái
                .sorted()
                // Ghép các tên lại từng cái một để tạo thành một String nối tất cả các tên
                .reduce("", (n1, n2) -> n1 + n2);
```

Lưu ý rằng lời giải này không hiệu quả (tất cả các String bị nối lại lặp đi lặp lại, tạo ra một đối tượng String mới ở mỗi lần lặp). Ở chương tiếp theo, bạn sẽ thấy một lời giải hiệu quả hơn dùng `joining()` như sau (bên trong nó sử dụng một StringBuilder):

```java
String traderStr =
    transactions.stream()
                .map(transaction -> transaction.getTrader().getName())
                .distinct()
                .sorted()
                .collect(joining());
```

**Listing 5.5. Có trader nào đặt trụ sở ở Milan không?**

```java
boolean milanBased =
    transactions.stream()
                // Truyền một predicate cho anyMatch để kiểm tra xem
                // có trader nào đến từ Milan không.
                .anyMatch(transaction -> transaction.getTrader()
                                                    .getCity()
                                                    .equals("Milan"));
```

**Listing 5.6. In ra giá trị của tất cả các giao dịch từ những trader sống ở Cambridge**

```java
transactions.stream()
            // Chọn các giao dịch nơi trader sống ở Cambridge
            .filter(t -> "Cambridge".equals(t.getTrader().getCity()))
            // Trích xuất giá trị của các giao dịch này
            .map(Transaction::getValue)
            // In ra từng giá trị
            .forEach(System.out::println);
```

**Listing 5.7. Giá trị cao nhất trong tất cả các giao dịch là bao nhiêu?**

```java
Optional<Integer> highestValue =
    transactions.stream()
                // Trích xuất giá trị của từng giao dịch
                .map(Transaction::getValue)
                // Tính giá trị lớn nhất của stream kết quả
                .reduce(Integer::max);
```

**Listing 5.8. Tìm giao dịch có giá trị nhỏ nhất**

```java
Optional<Transaction> smallestTransaction =
    transactions.stream()
                // Tìm giao dịch nhỏ nhất bằng cách so sánh lặp đi lặp lại
                // giá trị của từng giao dịch
                .reduce((t1, t2) ->
                        t1.getValue() < t2.getValue() ? t1 : t2);
```

Bạn có thể làm tốt hơn. Một stream hỗ trợ các phương thức min và max nhận một Comparator làm đối số để chỉ định khoá nào cần so sánh khi tính giá trị nhỏ nhất hoặc lớn nhất:

```java
Optional<Transaction> smallestTransaction =
    transactions.stream()
                .min(comparing(Transaction::getValue));
```

## 5.7. Numeric stream

Trước đó bạn đã thấy rằng có thể dùng phương thức reduce để tính tổng các phần tử của một stream. Ví dụ, bạn có thể tính số calo trong thực đơn như sau:

```java
int calories = menu.stream()
                   .map(Dish::getCalories)
                   .reduce(0, Integer::sum);
```

Vấn đề với đoạn code này là có một chi phí boxing ngấm ngầm. Phía sau hậu trường, mỗi Integer cần được unbox thành một primitive trước khi thực hiện phép cộng. Ngoài ra, sẽ chẳng phải hay hơn sao nếu bạn có thể gọi trực tiếp một phương thức sum như sau?

```java
int calories = menu.stream()
                   .map(Dish::getCalories)
                   .sum();
```

Nhưng điều này là không thể. Vấn đề là phương thức map sinh ra một `Stream<T>`. Mặc dù các phần tử của stream có kiểu Integer, interface Stream không định nghĩa phương thức sum. Vì sao lại không? Giả sử bạn chỉ có một `Stream<Dish>` như menu; sẽ chẳng có ý nghĩa gì khi có thể cộng các món ăn lại với nhau. Nhưng đừng lo; Streams API cũng cung cấp các phiên bản stream chuyên biệt hoá cho primitive, vốn hỗ trợ những phương thức chuyên biệt để làm việc với các stream số.

### 5.7.1. Các phiên bản chuyên biệt hoá cho primitive

Java 8 giới thiệu ba interface stream chuyên biệt hoá cho primitive để giải quyết vấn đề này: IntStream, DoubleStream và LongStream, tương ứng chuyên biệt hoá các phần tử của stream thành int, long và double — và nhờ đó tránh được các chi phí boxing ẩn. Mỗi interface này mang lại những phương thức mới để thực hiện các phép reduction số học phổ biến, chẳng hạn sum để tính tổng của một stream số và max để tìm phần tử lớn nhất. Ngoài ra, chúng có các phương thức để chuyển ngược về một stream các đối tượng khi cần. Điều cần nhớ là sự phức tạp bổ sung của các phiên bản chuyên biệt này không phải là bản chất vốn có của stream. Nó phản ánh sự phức tạp của boxing — sự khác biệt (dựa trên hiệu quả) giữa int và Integer, và vân vân.

**Mapping sang một numeric stream**

Các phương thức phổ biến nhất mà bạn sẽ dùng để chuyển một stream sang phiên bản chuyên biệt là mapToInt, mapToDouble và mapToLong. Những phương thức này hoạt động chính xác như phương thức map mà bạn đã thấy trước đó, nhưng trả về một stream chuyên biệt thay vì `Stream<T>`. Ví dụ, bạn có thể dùng mapToInt như sau để tính tổng số calo trong thực đơn:

```java
int calories = menu.stream()                   // Trả về một Stream<Dish>
                   .mapToInt(Dish::getCalories) // Trả về một IntStream
                   .sum();
```

Ở đây, phương thức mapToInt trích xuất tất cả số calo từ mỗi món ăn (được biểu diễn dưới dạng Integer) và trả về một IntStream làm kết quả (thay vì `Stream<Integer>`). Sau đó bạn có thể gọi phương thức sum được định nghĩa trên interface IntStream để tính tổng số calo! Lưu ý rằng nếu stream rỗng, sum sẽ trả về 0 theo mặc định. IntStream cũng hỗ trợ các phương thức tiện lợi khác như max, min và average.

**Chuyển ngược về một stream các đối tượng**

Tương tự, một khi bạn đã có một numeric stream, bạn có thể muốn chuyển nó ngược về một stream không chuyên biệt. Ví dụ, các phép toán của một IntStream bị giới hạn ở việc tạo ra các số nguyên primitive: phép toán map của một IntStream nhận một lambda nhận vào một int và tạo ra một int (một IntUnaryOperator). Nhưng bạn có thể muốn tạo ra một giá trị khác chẳng hạn một Dish. Với việc này, bạn cần truy cập các phép toán tổng quát hơn được định nghĩa trong interface Stream. Để chuyển từ một primitive stream sang một stream tổng quát (mỗi int sẽ được box thành một Integer), bạn có thể dùng phương thức boxed như sau:

```java
// Chuyển một Stream thành một numeric stream
IntStream intStream = menu.stream().mapToInt(Dish::getCalories);
// Chuyển numeric stream trở lại thành một Stream
Stream<Integer> stream = intStream.boxed();
```

Bạn sẽ học ở mục tiếp theo rằng boxed đặc biệt hữu ích khi bạn làm việc với các dải số (numeric range) cần được box vào một stream tổng quát.

**Giá trị mặc định: OptionalInt**

Ví dụ sum rất thuận tiện bởi vì nó có một giá trị mặc định: 0. Nhưng nếu bạn muốn tính phần tử lớn nhất trong một IntStream, bạn sẽ cần thứ gì đó khác, bởi vì 0 là một kết quả sai. Làm sao bạn phân biệt được giữa việc stream không có phần tử nào và việc giá trị lớn nhất thực sự bằng 0? Trước đó chúng ta đã giới thiệu lớp Optional, một container chỉ ra sự hiện diện hoặc vắng mặt của một giá trị. Optional có thể được tham số hoá với các kiểu tham chiếu như Integer, String và vân vân. Cũng có một phiên bản chuyên biệt hoá cho primitive của Optional dành cho ba phiên bản stream chuyên biệt: OptionalInt, OptionalDouble và OptionalLong.

Ví dụ, bạn có thể tìm phần tử lớn nhất của một IntStream bằng cách gọi phương thức max, phương thức này trả về một OptionalInt:

```java
OptionalInt maxCalories = menu.stream()
                              .mapToInt(Dish::getCalories)
                              .max();
```

Giờ bạn có thể xử lý OptionalInt một cách tường minh để định nghĩa một giá trị mặc định nếu không có giá trị lớn nhất:

```java
// Cung cấp một giá trị lớn nhất mặc định tường minh nếu không có giá trị nào
int max = maxCalories.orElse(1);
```

### 5.7.2. Dải số (numeric range)

Một trường hợp sử dụng phổ biến khi làm việc với số là làm việc với các dải giá trị số. Ví dụ, giả sử bạn muốn sinh ra tất cả các số từ 1 đến 100. Java 8 giới thiệu hai static method có sẵn trên IntStream và LongStream để giúp sinh ra những dải như vậy: range và rangeClosed. Cả hai phương thức đều nhận giá trị bắt đầu của dải làm tham số thứ nhất và giá trị kết thúc của dải làm tham số thứ hai. Nhưng range là loại trừ (exclusive), trong khi rangeClosed là bao gồm (inclusive). Hãy xem một ví dụ:

```java
// Biểu diễn dải từ 1 đến 100
IntStream evenNumbers = IntStream.rangeClosed(1, 100)
                                 // Biểu diễn stream các số chẵn từ 1 đến 100
                                 .filter(n -> n % 2 == 0);
// Biểu diễn 50 số chẵn từ 1 đến 100
System.out.println(evenNumbers.count());
```

Ở đây bạn dùng phương thức rangeClosed để sinh ra một dải gồm tất cả các số từ 1 đến 100. Nó tạo ra một stream, nên bạn có thể nối thêm phương thức filter để chỉ chọn các số chẵn. Ở giai đoạn này chưa có phép tính nào được thực hiện. Cuối cùng, bạn gọi count trên stream kết quả. Bởi vì count là một terminal operation, nó sẽ xử lý stream và trả về kết quả 50, là số lượng số chẵn từ 1 đến 100, bao gồm cả hai đầu. Lưu ý rằng để so sánh, nếu bạn dùng `IntStream.range(1, 100)` thay thế, kết quả sẽ là 49 số chẵn, bởi vì range là loại trừ.

### 5.7.3. Đưa numeric stream vào thực hành: bộ ba Pythagore

Bây giờ chúng ta sẽ xem một ví dụ khó hơn để bạn có thể củng cố những gì đã học về numeric stream và tất cả các phép toán stream đã học cho tới lúc này. Nhiệm vụ của bạn, nếu bạn chọn chấp nhận nó, là tạo ra một stream các bộ ba Pythagore (Pythagorean triple).

**Bộ ba Pythagore**

Bộ ba Pythagore là gì? Chúng ta phải quay lại vài năm về trước. Trong một buổi học toán thú vị nào đó, bạn đã học rằng nhà toán học Hy Lạp nổi tiếng Pythagoras đã khám phá ra rằng một số bộ ba số (a, b, c) thoả mãn công thức `a * a + b * b = c * c` với a, b và c là các số nguyên. Ví dụ, (3, 4, 5) là một bộ ba Pythagore hợp lệ bởi vì `3 * 3 + 4 * 4 = 5 * 5` hay `9 + 16 = 25`. Có vô số bộ ba như vậy. Ví dụ, (5, 12, 13), (6, 8, 10) và (7, 24, 25) đều là các bộ ba Pythagore hợp lệ. Những bộ ba như vậy hữu ích bởi vì chúng mô tả độ dài ba cạnh của một tam giác vuông, như minh hoạ ở hình 5.9.

> **Hình 5.9.** Định lý Pythagore

**Biểu diễn một bộ ba**

Bắt đầu từ đâu? Bước đầu tiên là định nghĩa một bộ ba. Thay vì (đúng đắn hơn) định nghĩa một lớp mới để biểu diễn một bộ ba, bạn có thể dùng một mảng int với ba phần tử. Ví dụ, `new int[]{3, 4, 5}` để biểu diễn bộ ba (3, 4, 5). Bây giờ bạn có thể truy cập từng thành phần riêng lẻ của bộ ba bằng chỉ số mảng.

**Lọc ra các tổ hợp tốt**

Giả sử ai đó cung cấp cho bạn hai số đầu tiên của bộ ba: a và b. Làm sao bạn biết chúng có tạo thành một tổ hợp tốt hay không? Bạn cần kiểm tra xem căn bậc hai của `a * a + b * b` có phải là một số nguyên hay không. Điều này được diễn đạt trong Java là `Math.sqrt(a*a + b*b) % 1 == 0`. (Cho một số dấu phẩy động x, trong Java phần thập phân của nó được lấy bằng `x % 1.0`, và các số nguyên như 5.0 có phần thập phân bằng không.) Code của chúng ta sử dụng ý tưởng này trong một phép toán filter (bạn sẽ thấy cách dùng nó sau này để tạo thành code hợp lệ):

```java
filter(b -> Math.sqrt(a*a + b*b) % 1 == 0)
```

Giả sử đoạn code bao quanh đã cung cấp một giá trị cho a, và giả sử stream cung cấp các giá trị khả dĩ cho b, filter sẽ chỉ chọn ra những giá trị b có thể tạo thành một bộ ba Pythagore cùng với a.

**Sinh ra các bộ ba**

Sau bước filter, bạn biết rằng cả a và b đều có thể tạo thành một tổ hợp đúng. Bây giờ bạn cần tạo ra một bộ ba. Bạn có thể dùng phép toán map để biến đổi mỗi phần tử thành một bộ ba Pythagore như sau:

```java
stream.filter(b -> Math.sqrt(a*a + b*b) % 1 == 0)
      .map(b -> new int[]{a, b, (int) Math.sqrt(a * a + b * b)});
```

**Sinh ra các giá trị b**

Bạn đang tiến gần hơn rồi! Bây giờ bạn cần sinh ra các giá trị cho b. Bạn đã thấy rằng `IntStream.rangeClosed` cho phép bạn sinh ra một stream các số trong một khoảng cho trước. Bạn có thể dùng nó để cung cấp các giá trị số cho b, ở đây là từ 1 đến 100:

```java
IntStream.rangeClosed(1, 100)
         .filter(b -> Math.sqrt(a*a + b*b) % 1 == 0)
         .boxed()
         .map(b -> new int[]{a, b, (int) Math.sqrt(a * a + b * b)});
```

Lưu ý rằng bạn gọi boxed sau filter để sinh ra một `Stream<Integer>` từ IntStream do rangeClosed trả về. Đó là bởi vì map trả về một mảng int cho mỗi phần tử của stream. Phương thức map của một IntStream chỉ mong đợi một int khác được trả về cho mỗi phần tử của stream, và đó không phải là điều bạn muốn! Bạn có thể viết lại điều này bằng cách dùng phương thức mapToObj của một IntStream, phương thức này trả về một stream có giá trị là đối tượng:

```java
IntStream.rangeClosed(1, 100)
         .filter(b -> Math.sqrt(a*a + b*b) % 1 == 0)
         .mapToObj(b -> new int[]{a, b, (int) Math.sqrt(a * a + b * b)});
```

**Sinh ra các giá trị a**

Có một thành phần then chốt mà chúng ta đã giả định là được cho sẵn: giá trị của a. Bây giờ bạn có một stream sinh ra các bộ ba Pythagore với điều kiện giá trị a đã biết. Làm sao khắc phục điều này? Cũng giống như với b, bạn cần sinh ra các giá trị số cho a! Lời giải cuối cùng như sau:

```java
Stream<int[]> pythagoreanTriples =
    IntStream.rangeClosed(1, 100).boxed()
             .flatMap(a ->
                 IntStream.rangeClosed(a, 100)
                          .filter(b -> Math.sqrt(a*a + b*b) % 1 == 0)
                          .mapToObj(b ->
                              new int[]{a, b, (int) Math.sqrt(a * a + b * b)})
             );
```

Được rồi, flatMap ở đây là để làm gì? Đầu tiên, bạn tạo một dải số từ 1 đến 100 để sinh ra các giá trị cho a. Với mỗi giá trị a cho trước, bạn tạo ra một stream các bộ ba. Việc ánh xạ một giá trị của a thành một stream các bộ ba sẽ dẫn tới một stream của các stream! Phương thức flatMap thực hiện việc ánh xạ đồng thời làm phẳng tất cả các stream bộ ba được sinh ra thành một stream duy nhất. Kết quả là bạn tạo ra một stream các bộ ba. Cũng lưu ý rằng bạn thay đổi dải của b thành từ a đến 100. Không cần bắt đầu dải từ giá trị 1 bởi vì làm vậy sẽ tạo ra các bộ ba trùng lặp (ví dụ, (3, 4, 5) và (4, 3, 5)).

**Chạy đoạn code**

Bây giờ bạn có thể chạy lời giải của mình và chọn một cách tường minh xem muốn trả về bao nhiêu bộ ba từ stream được sinh ra bằng phép toán limit mà bạn đã thấy trước đó:

```java
pythagoreanTriples.limit(5)
                  .forEach(t ->
                      System.out.println(t[0] + ", " + t[1] + ", " + t[2]));
```

Đoạn này sẽ in ra

```text
3, 4, 5
5, 12, 13
6, 8, 10
7, 24, 25
8, 15, 17
```

**Bạn có thể làm tốt hơn không?**

Lời giải hiện tại chưa tối ưu bởi vì bạn tính căn bậc hai hai lần. Một cách khả dĩ để làm code của bạn gọn hơn là sinh ra tất cả các bộ ba có dạng `(a*a, b*b, a*a+b*b)` rồi lọc ra những bộ ba thoả mãn tiêu chí của bạn:

```java
Stream<double[]> pythagoreanTriples2 =
    IntStream.rangeClosed(1, 100).boxed()
             .flatMap(a ->
                 IntStream.rangeClosed(a, 100)
                          // Sinh ra các bộ ba
                          .mapToObj(
                              b -> new double[]{a, b, Math.sqrt(a*a + b*b)})
                          // Phần tử thứ ba của bộ ba phải là một số nguyên.
                          .filter(t -> t[2] % 1 == 0));
```

## 5.8. Xây dựng stream

Hy vọng rằng đến giờ bạn đã bị thuyết phục rằng stream mạnh mẽ và hữu ích trong việc diễn đạt các truy vấn xử lý dữ liệu. Bạn đã có thể lấy một stream từ một collection bằng phương thức stream. Ngoài ra, chúng tôi đã chỉ cho bạn cách tạo numeric stream từ một dải số. Nhưng bạn còn có thể tạo stream bằng nhiều cách khác nữa! Mục này trình bày cách bạn có thể tạo một stream từ một dãy các giá trị, từ một mảng, từ một file, và thậm chí từ một hàm sinh để tạo ra các stream vô hạn!

### 5.8.1. Stream từ các giá trị

Bạn có thể tạo một stream với các giá trị tường minh bằng static method `Stream.of`, phương thức này có thể nhận số lượng tham số bất kỳ. Ví dụ, trong đoạn code sau bạn tạo trực tiếp một stream các chuỗi bằng `Stream.of`. Sau đó bạn chuyển các chuỗi thành chữ in hoa trước khi in chúng ra từng cái một:

```java
Stream<String> stream = Stream.of("Modern ", "Java ", "In ", "Action");
stream.map(String::toUpperCase).forEach(System.out::println);
```

Bạn có thể lấy một stream rỗng bằng phương thức empty như sau:

```java
Stream<String> emptyStream = Stream.empty();
```

### 5.8.2. Stream từ đối tượng có thể null

Trong Java 9, một phương thức mới được thêm vào cho phép bạn tạo một stream từ một đối tượng có thể null. Sau khi nghịch với stream, bạn có thể đã gặp tình huống mà bạn trích xuất được một đối tượng có thể là null và sau đó cần chuyển nó thành một stream (hoặc một stream rỗng nếu là null). Ví dụ, phương thức `System.getProperty` trả về null nếu không có property nào với khoá cho trước. Để dùng nó cùng với stream, bạn sẽ cần kiểm tra null một cách tường minh như sau:

```java
String homeValue = System.getProperty("home");
Stream<String> homeValueStream
    = homeValue == null ? Stream.empty() : Stream.of(homeValue);
```

Dùng `Stream.ofNullable` bạn có thể viết lại đoạn code này đơn giản hơn:

```java
Stream<String> homeValueStream
    = Stream.ofNullable(System.getProperty("home"));
```

Mẫu hình này có thể đặc biệt tiện lợi khi kết hợp với flatMap và một stream các giá trị có thể bao gồm những đối tượng null:

```java
Stream<String> values =
    Stream.of("config", "home", "user")
          .flatMap(key -> Stream.ofNullable(System.getProperty(key)));
```

### 5.8.3. Stream từ mảng

Bạn có thể tạo một stream từ một mảng bằng static method `Arrays.stream`, phương thức này nhận một mảng làm tham số. Ví dụ, bạn có thể chuyển một mảng các int primitive thành một IntStream rồi cộng tổng IntStream để tạo ra một int, như sau:

```java
int[] numbers = {2, 3, 5, 7, 11, 13};
int sum = Arrays.stream(numbers).sum();  // Tổng là 41.
```

### 5.8.4. Stream từ file

NIO API của Java (non-blocking I/O), vốn được dùng cho các thao tác I/O chẳng hạn như xử lý một file, đã được cập nhật để tận dụng Streams API. Nhiều static method trong `java.nio.file.Files` trả về một stream. Ví dụ, một phương thức hữu ích là `Files.lines`, phương thức này trả về một stream các dòng dưới dạng chuỗi từ một file cho trước. Sử dụng những gì đã học cho tới lúc này, bạn có thể dùng phương thức này để tìm ra số từ duy nhất trong một file như sau:

```java
long uniqueWords = 0;
// Stream là AutoCloseable nên không cần try-finally
try (Stream<String> lines =
         Files.lines(Paths.get("data.txt"), Charset.defaultCharset())) {
    uniqueWords = lines
            // Sinh ra một stream các từ
            .flatMap(line -> Arrays.stream(line.split(" ")))
            // Loại bỏ các phần tử trùng lặp
            .distinct()
            // Đếm số từ duy nhất
            .count();
}
// Xử lý ngoại lệ nếu có xảy ra khi mở file
catch (IOException e) {

}
```

Bạn dùng `Files.lines` để trả về một stream trong đó mỗi phần tử là một dòng trong file cho trước. Lời gọi này được bao quanh bởi một khối try/catch bởi vì source của stream là một tài nguyên I/O. Thực tế, lời gọi `Files.lines` sẽ mở một tài nguyên I/O, tài nguyên này cần được đóng lại để tránh rò rỉ. Trước đây, bạn sẽ cần một khối finally tường minh để làm việc này. Thuận tiện thay, interface Stream cài đặt interface AutoCloseable. Điều này có nghĩa là việc quản lý tài nguyên được xử lý giúp bạn ngay bên trong khối try. Một khi bạn có một stream các dòng, bạn có thể tách mỗi dòng thành các từ bằng cách gọi phương thức split trên line. Hãy để ý cách bạn dùng flatMap để tạo ra một stream các từ đã được làm phẳng, thay vì nhiều stream các từ cho mỗi dòng. Cuối cùng, bạn đếm mỗi từ khác biệt trong stream bằng cách nối chuỗi các phương thức distinct và count.

### 5.8.5. Stream từ hàm: tạo ra các stream vô hạn!

Streams API cung cấp hai static method để sinh ra một stream từ một hàm: `Stream.iterate` và `Stream.generate`. Hai phép toán này cho phép bạn tạo ra cái mà chúng ta gọi là *stream vô hạn* (infinite stream), một stream không có kích thước cố định như khi bạn tạo một stream từ một collection cố định. Các stream được tạo ra bởi iterate và generate sinh ra giá trị theo yêu cầu dựa trên một hàm, và do đó có thể tính giá trị mãi mãi! Nói chung, việc dùng `limit(n)` trên những stream như vậy là hợp lý, để tránh in ra một số lượng giá trị vô hạn.

**Iterate**

Hãy xem một ví dụ đơn giản về cách dùng iterate trước khi chúng tôi giải thích nó:

```java
Stream.iterate(0, n -> n + 2)
      .limit(10)
      .forEach(System.out::println);
```

Phương thức iterate nhận một giá trị khởi tạo, ở đây là 0, và một lambda (kiểu `UnaryOperator<T>`) để áp dụng liên tiếp lên mỗi giá trị mới được tạo ra. Ở đây bạn trả về phần tử trước đó cộng thêm 2 bằng lambda `n -> n + 2`. Kết quả là phương thức iterate tạo ra một stream gồm tất cả các số chẵn: phần tử đầu tiên của stream là giá trị khởi tạo 0. Rồi nó cộng thêm 2 để tạo ra giá trị mới 2; nó lại cộng thêm 2 để tạo ra giá trị mới 4, và cứ thế. Phép toán iterate này về cơ bản là tuần tự, bởi vì kết quả phụ thuộc vào lần áp dụng trước đó. Lưu ý rằng phép toán này tạo ra một stream vô hạn — stream không có điểm kết thúc bởi vì các giá trị được tính theo yêu cầu và có thể được tính mãi mãi. Chúng ta nói rằng stream này là không bị chặn (unbounded). Như đã bàn trước đó, đây là một khác biệt then chốt giữa stream và collection. Bạn đang dùng phương thức limit để giới hạn kích thước stream một cách tường minh. Ở đây bạn chỉ chọn 10 số chẵn đầu tiên. Sau đó bạn gọi terminal operation forEach để tiêu thụ stream và in ra từng phần tử một.

Nói chung, bạn nên dùng iterate khi bạn cần tạo ra một dãy các giá trị liên tiếp (ví dụ, một ngày rồi tới ngày kế tiếp của nó: 31 tháng Một, 1 tháng Hai, và cứ thế). Để xem một ví dụ khó hơn về cách bạn có thể áp dụng iterate, hãy thử làm quiz 5.4.

---

**Quiz 5.4: Dãy bộ đôi Fibonacci**

Dãy Fibonacci nổi tiếng như một bài tập lập trình kinh điển. Các số trong dãy sau đây là một phần của dãy Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55... Hai số đầu tiên của dãy là 0 và 1, và mỗi số tiếp theo là tổng của hai số trước đó.

Dãy các bộ đôi Fibonacci thì tương tự; bạn có một dãy gồm một số và số kế tiếp của nó trong dãy: (0, 1), (1, 1), (1, 2), (2, 3), (3, 5), (5, 8), (8, 13), (13, 21)...

Nhiệm vụ của bạn là sinh ra 20 phần tử đầu tiên của dãy các bộ đôi Fibonacci bằng phương thức iterate!

Hãy để chúng tôi giúp bạn bắt đầu. Vấn đề đầu tiên là phương thức iterate nhận một `UnaryOperator<T>` làm đối số, và bạn cần một stream các bộ đôi như (0, 1). Một lần nữa, bạn có thể hơi cẩu thả mà dùng một mảng hai phần tử để biểu diễn một bộ đôi. Ví dụ, `new int[]{0, 1}` biểu diễn phần tử đầu tiên của dãy Fibonacci (0, 1). Đây sẽ là giá trị khởi tạo của phương thức iterate:

```java
Stream.iterate(new int[]{0, 1}, ???)
      .limit(20)
      .forEach(t -> System.out.println("(" + t[0] + "," + t[1] + ")"));
```

Trong quiz này, bạn cần tìm ra phần `???` được tô sáng trong đoạn code. Hãy nhớ rằng iterate sẽ áp dụng lambda cho trước một cách liên tiếp.

**Đáp án:**

```java
Stream.iterate(new int[]{0, 1},
               t -> new int[]{t[1], t[0] + t[1]})
      .limit(20)
      .forEach(t -> System.out.println("(" + t[0] + "," + t[1] + ")"));
```

Nó hoạt động như thế nào? iterate cần một lambda để chỉ định phần tử kế tiếp. Trong trường hợp bộ đôi (3, 5) thì phần tử kế tiếp là (5, 3+5) = (5, 8). Cái tiếp theo là (8, 5+8). Bạn có thấy quy luật không? Cho một bộ đôi, phần tử kế tiếp là `(t[1], t[0] + t[1])`. Đây chính là điều mà lambda sau chỉ định: `t -> new int[]{t[1], t[0] + t[1]}`. Bằng cách chạy đoạn code này bạn sẽ nhận được dãy (0, 1), (1, 1), (1, 2), (2, 3), (3, 5), (5, 8), (8, 13), (13, 21)... Lưu ý rằng nếu bạn muốn in ra dãy Fibonacci thông thường, bạn có thể dùng một map để chỉ trích xuất phần tử đầu tiên của mỗi bộ đôi:

```java
Stream.iterate(new int[]{0, 1},
               t -> new int[]{t[1], t[0] + t[1]})
      .limit(10)
      .map(t -> t[0])
      .forEach(System.out::println);
```

Đoạn code này sẽ tạo ra dãy Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...

---

Trong Java 9, phương thức iterate đã được nâng cấp với hỗ trợ cho một predicate. Ví dụ, bạn có thể sinh ra các số bắt đầu từ 0 nhưng dừng việc lặp lại khi số đó lớn hơn 100:

```java
IntStream.iterate(0, n -> n < 100, n -> n + 4)
         .forEach(System.out::println);
```

Phương thức iterate nhận một predicate làm đối số thứ hai, predicate này cho bạn biết khi nào thì tiếp tục lặp cho tới đâu. Lưu ý rằng bạn có thể nghĩ rằng mình có thể dùng phép toán filter để đạt được kết quả tương tự:

```java
IntStream.iterate(0, n -> n + 4)
         .filter(n -> n < 100)
         .forEach(System.out::println);
```

Không may là không phải vậy. Thực tế, đoạn code này sẽ không bao giờ kết thúc! Lý do là không có cách nào để filter biết được rằng các số cứ tiếp tục tăng, nên nó cứ lọc chúng vô hạn! Bạn có thể giải quyết vấn đề bằng cách dùng takeWhile, phép toán này sẽ short-circuit stream:

```java
IntStream.iterate(0, n -> n + 4)
         .takeWhile(n -> n < 100)
         .forEach(System.out::println);
```

Nhưng bạn phải thừa nhận rằng iterate với một predicate thì ngắn gọn hơn một chút!

**Generate**

Tương tự phương thức iterate, phương thức generate cho phép bạn tạo ra một stream vô hạn các giá trị được tính theo yêu cầu. Nhưng generate không áp dụng liên tiếp một hàm lên mỗi giá trị mới được tạo ra. Nó nhận một lambda kiểu `Supplier<T>` để cung cấp các giá trị mới. Hãy xem một ví dụ về cách dùng nó:

```java
Stream.generate(Math::random)
      .limit(5)
      .forEach(System.out::println);
```

Đoạn code này sẽ sinh ra một stream gồm năm số double ngẫu nhiên từ 0 đến 1. Ví dụ, một lần chạy cho kết quả sau:

```text
0.9410810294106129
0.6586270755634592
0.9592859117266873
0.13743396659487006
0.3942776037651241
```

Static method `Math.random` được dùng làm bộ sinh giá trị mới. Một lần nữa, bạn giới hạn kích thước stream một cách tường minh bằng phương thức limit; nếu không thì stream sẽ không bị chặn!

Bạn có thể đang tự hỏi liệu còn điều gì hữu ích khác mà bạn có thể làm bằng phương thức generate hay không. Supplier mà chúng ta dùng (một method reference tới `Math.random`) là stateless: nó không ghi lại giá trị nào ở đâu đó để dùng cho các phép tính sau này. Nhưng một supplier không nhất thiết phải là stateless. Bạn có thể tạo ra một supplier lưu trữ trạng thái mà nó có thể sửa đổi và sử dụng khi sinh ra giá trị tiếp theo của stream. Như một ví dụ, chúng tôi sẽ chỉ cho bạn cách cũng có thể tạo ra dãy Fibonacci từ quiz 5.4 bằng generate, để bạn có thể so sánh nó với cách tiếp cận dùng phương thức iterate! Nhưng điều quan trọng cần lưu ý là một supplier có trạng thái thì không an toàn để dùng trong code song song. IntSupplier có trạng thái cho Fibonacci được trình bày ở cuối chương này cho đầy đủ, nhưng nói chung nên tránh dùng! Chúng ta sẽ bàn thêm về vấn đề của các phép toán có side effect và parallel stream ở chương 7.

Chúng ta sẽ dùng một IntStream trong ví dụ của mình để minh hoạ đoạn code được thiết kế nhằm tránh các thao tác boxing. Phương thức generate trên IntStream nhận một IntSupplier thay vì một `Supplier<T>`. Ví dụ, đây là cách sinh ra một stream vô hạn các số một:

```java
IntStream ones = IntStream.generate(() -> 1);
```

Bạn đã thấy ở chương 3 rằng lambda cho phép bạn tạo một thể hiện của một functional interface bằng cách cung cấp phần cài đặt của phương thức đó trực tiếp ngay tại chỗ. Bạn cũng có thể truyền vào một đối tượng tường minh, như sau, bằng cách cài đặt phương thức getAsInt được định nghĩa trong interface IntSupplier (mặc dù điều này có vẻ dài dòng một cách không cần thiết, xin hãy kiên nhẫn với chúng tôi):

```java
IntStream twos = IntStream.generate(new IntSupplier() {
    public int getAsInt() {
        return 2;
    }
});
```

Phương thức generate sẽ dùng supplier cho trước và gọi lặp đi lặp lại phương thức getAsInt, phương thức này luôn trả về 2. Nhưng khác biệt giữa anonymous class được dùng ở đây và một lambda là anonymous class có thể định nghĩa trạng thái qua các trường, mà phương thức getAsInt có thể sửa đổi. Đây là một ví dụ về side effect. Tất cả các lambda mà bạn đã thấy cho tới lúc này đều không có side effect; chúng không thay đổi bất kỳ trạng thái nào.

Quay lại với các nhiệm vụ Fibonacci của chúng ta, điều bạn cần làm bây giờ là tạo ra một IntSupplier lưu giữ trong trạng thái của nó giá trị trước đó trong dãy, để getAsInt có thể dùng nó tính phần tử kế tiếp. Ngoài ra, nó có thể cập nhật trạng thái của IntSupplier cho lần gọi tiếp theo. Đoạn code sau cho thấy cách tạo một IntSupplier trả về phần tử Fibonacci kế tiếp mỗi khi nó được gọi:

```java
IntSupplier fib = new IntSupplier() {
    private int previous = 0;
    private int current = 1;

    public int getAsInt() {
        int oldPrevious = this.previous;
        int nextValue = this.previous + this.current;
        this.previous = this.current;
        this.current = nextValue;
        return oldPrevious;
    }
};

IntStream.generate(fib).limit(10).forEach(System.out::println);
```

Đoạn code này tạo ra một thể hiện của IntSupplier. Đối tượng này có trạng thái mutable: nó theo dõi phần tử Fibonacci trước đó và phần tử Fibonacci hiện tại trong hai biến thể hiện. Phương thức getAsInt thay đổi trạng thái của đối tượng mỗi khi nó được gọi, để nó tạo ra các giá trị mới ở mỗi lần gọi. Để so sánh, cách tiếp cận của chúng ta dùng iterate là thuần immutable; bạn không sửa đổi trạng thái đã có mà tạo ra các bộ đôi mới ở mỗi lần lặp. Bạn sẽ học ở chương 7 rằng bạn nên luôn ưu tiên cách tiếp cận immutable để xử lý một stream song song mà vẫn thu được kết quả đúng.

Lưu ý rằng bởi vì bạn đang làm việc với một stream có kích thước vô hạn, bạn phải giới hạn kích thước của nó một cách tường minh bằng phép toán limit; nếu không, terminal operation (trong trường hợp này là forEach) sẽ tính toán mãi mãi. Tương tự, bạn không thể sort hay reduce một stream vô hạn bởi vì tất cả các phần tử đều cần được xử lý, nhưng điều này sẽ mất vô hạn thời gian bởi vì stream chứa một số lượng phần tử vô hạn!

## 5.9. Tổng quan

Đây là một chương dài nhưng bổ ích! Giờ đây bạn có thể xử lý các collection hiệu quả hơn. Quả thật, stream cho phép bạn diễn đạt các truy vấn xử lý dữ liệu tinh vi một cách ngắn gọn. Thêm vào đó, stream có thể được song song hoá một cách trong suốt.

## Tóm tắt

- Streams API cho phép bạn diễn đạt các truy vấn xử lý dữ liệu phức tạp. Các phép toán stream phổ biến được tóm tắt trong bảng 5.1.
- Bạn có thể filter và cắt lát một stream bằng các phương thức filter, distinct, takeWhile (Java 9), dropWhile (Java 9), skip và limit.
- Các phương thức takeWhile và dropWhile hiệu quả hơn filter khi bạn biết rằng source đã được sắp xếp.
- Bạn có thể trích xuất hoặc biến đổi các phần tử của một stream bằng các phương thức map và flatMap.
- Bạn có thể tìm phần tử trong một stream bằng các phương thức findFirst và findAny. Bạn có thể khớp một predicate cho trước trong một stream bằng các phương thức allMatch, noneMatch và anyMatch.
- Những phương thức này sử dụng short-circuiting: phép tính dừng lại ngay khi tìm thấy kết quả; không cần xử lý toàn bộ stream.
- Bạn có thể kết hợp tất cả các phần tử của một stream một cách lặp đi lặp lại để tạo ra một kết quả bằng phương thức reduce, ví dụ, để tính tổng hoặc tìm giá trị lớn nhất của một stream.
- Một số phép toán như filter và map là stateless: chúng không lưu trữ trạng thái nào. Một số phép toán như reduce lưu trữ trạng thái để tính một giá trị. Một số phép toán như sorted và distinct cũng lưu trữ trạng thái bởi vì chúng cần đưa toàn bộ các phần tử của một stream vào bộ đệm trước khi trả về một stream mới. Những phép toán như vậy được gọi là stateful operation.
- Có ba phiên bản chuyên biệt hoá cho primitive của stream: IntStream, DoubleStream và LongStream. Các phép toán của chúng cũng được chuyên biệt hoá tương ứng.
- Stream có thể được tạo ra không chỉ từ một collection mà còn từ các giá trị, mảng, file, và các phương thức cụ thể như iterate và generate.
- Một stream vô hạn có số lượng phần tử vô hạn (ví dụ tất cả các chuỗi khả dĩ). Điều này khả thi bởi vì các phần tử của một stream chỉ được tạo ra theo yêu cầu. Bạn có thể lấy một stream hữu hạn từ một stream vô hạn bằng các phương thức như limit.
