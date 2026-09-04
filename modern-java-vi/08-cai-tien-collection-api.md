# Chương 8. Các cải tiến của Collection API

> **Nội dung chương này**
>
> - Sử dụng các collection factory (phương thức nhà máy tạo collection)
> - Tìm hiểu các idiomatic pattern (khuôn mẫu code đặc trưng) mới để dùng với `List` và `Set`
> - Tìm hiểu các idiomatic pattern để làm việc với `Map`

Cuộc đời của bạn với tư cách là một lập trình viên Java hẳn sẽ khá cô đơn nếu thiếu Collection API. Collection được sử dụng trong mọi ứng dụng Java. Ở các chương trước, bạn đã thấy sự kết hợp giữa Collections với Streams API hữu ích đến mức nào trong việc diễn đạt các truy vấn xử lý dữ liệu. Tuy vậy, Collection API vẫn tồn tại nhiều khiếm khuyết khiến đôi lúc nó trở nên dài dòng và dễ gây lỗi khi sử dụng.

Trong chương này, bạn sẽ tìm hiểu về những bổ sung mới cho Collection API trong Java 8 và Java 9, những thứ sẽ giúp cuộc sống của bạn dễ dàng hơn. Trước tiên, bạn học về các collection factory trong Java 9 — những bổ sung mới giúp đơn giản hoá quá trình tạo ra các list, set và map nhỏ. Tiếp theo, bạn học cách áp dụng các khuôn mẫu xoá và thay thế phần tử theo phong cách đặc trưng trên list và set nhờ những cải tiến của Java 8. Cuối cùng, bạn tìm hiểu về những thao tác tiện lợi mới có sẵn để làm việc với map.

Chương 9 sẽ khám phá một phạm vi rộng hơn các kỹ thuật để refactoring code Java kiểu cũ.

## 8.1. Collection factories

Java 9 giới thiệu một vài cách tiện lợi để tạo ra các đối tượng collection nhỏ. Trước tiên, chúng ta sẽ xem lại tại sao lập trình viên cần một cách làm tốt hơn; sau đó chúng tôi sẽ chỉ cho bạn cách sử dụng các phương thức factory mới.

Bạn sẽ tạo một danh sách nhỏ gồm vài phần tử trong Java như thế nào? Chẳng hạn, bạn muốn gom nhóm tên những người bạn sắp cùng đi nghỉ. Đây là một cách:

```java
List<String> friends = new ArrayList<>();
friends.add("Raphael");
friends.add("Olivia");
friends.add("Thibaut");
```

Nhưng đó là khá nhiều dòng code chỉ để lưu ba chuỗi ký tự! Một cách tiện lợi hơn để viết đoạn code này là dùng phương thức factory `Arrays.asList()`:

```java
List<String> friends
    = Arrays.asList("Raphael", "Olivia", "Thibaut");
```

Bạn nhận được một danh sách có kích thước cố định mà bạn có thể cập nhật, nhưng không thể thêm phần tử vào hay xoá phần tử khỏi nó. Ví dụ, việc cố gắng thêm phần tử sẽ dẫn đến một `UnsupportedModificationException`, nhưng việc cập nhật bằng phương thức `set` thì được phép:

```java
List<String> friends = Arrays.asList("Raphael", "Olivia");
friends.set(0, "Richard");
friends.add("Thibaut");  // ném ra UnsupportedOperationException
```

Hành vi này có vẻ hơi bất ngờ, bởi vì danh sách bên dưới được hậu thuẫn bởi một mảng mutable có kích thước cố định.

Còn `Set` thì sao? Đáng tiếc là không có phương thức factory `Arrays.asSet()`, vì vậy bạn cần một mẹo khác. Bạn có thể dùng constructor của `HashSet`, vốn nhận vào một `List`:

```java
Set<String> friends
    = new HashSet<>(Arrays.asList("Raphael", "Olivia", "Thibaut"));
```

Hoặc bạn cũng có thể dùng Streams API:

```java
Set<String> friends
    = Stream.of("Raphael", "Olivia", "Thibaut")
            .collect(Collectors.toSet());
```

Tuy nhiên, cả hai giải pháp đều còn xa mới gọi là thanh lịch, và chúng kéo theo những lần cấp phát đối tượng không cần thiết ở phía sau hậu trường. Cũng lưu ý rằng kết quả bạn nhận được là một `Set` mutable.

Còn `Map` thì sao? Không có cách nào thanh lịch để tạo các map nhỏ, nhưng đừng lo; Java 9 đã bổ sung các phương thức factory để làm cuộc sống của bạn đơn giản hơn khi cần tạo các list, set và map nhỏ.

> **Collection literals**
>
> Một số ngôn ngữ, bao gồm Python và Groovy, hỗ trợ collection literal — cho phép bạn tạo collection bằng cú pháp đặc biệt, chẳng hạn `[42, 1, 5]` để tạo một danh sách gồm ba con số. Java không cung cấp hỗ trợ ở mức cú pháp, bởi vì các thay đổi về ngôn ngữ đi kèm chi phí bảo trì rất cao và hạn chế khả năng sử dụng cú pháp đó trong tương lai. Thay vào đó, Java 9 bổ sung sự hỗ trợ này bằng cách mở rộng Collection API.

Chúng ta bắt đầu chuyến tham quan các cách mới để tạo collection trong Java bằng việc cho bạn thấy những gì mới mẻ với `List`.

### 8.1.1. List factory

Bạn có thể tạo một list đơn giản bằng cách gọi phương thức factory `List.of`:

```java
List<String> friends = List.of("Raphael", "Olivia", "Thibaut");
System.out.println(friends);  // [Raphael, Olivia, Thibaut]
```

Tuy nhiên, bạn sẽ nhận thấy một điều kỳ lạ. Hãy thử thêm một phần tử vào danh sách bạn bè của bạn:

```java
List<String> friends = List.of("Raphael", "Olivia", "Thibaut");
friends.add("Chih-Chun");
```

Chạy đoạn code này sẽ dẫn đến một `java.lang.UnsupportedOperationException`. Thực tế, danh sách được tạo ra là immutable. Việc thay thế một phần tử bằng phương thức `set()` cũng ném ra ngoại lệ tương tự. Bạn cũng sẽ không thể sửa đổi nó bằng phương thức `set`. Tuy nhiên, ràng buộc này là một điều tốt, bởi nó bảo vệ bạn khỏi những thay đổi ngoài ý muốn lên collection. Không có gì ngăn cản bạn có những phần tử vốn dĩ mutable bên trong. Nếu bạn cần một list mutable, bạn vẫn có thể tạo ra nó một cách thủ công. Cuối cùng, lưu ý rằng để ngăn ngừa các lỗi bất ngờ và cho phép một biểu diễn nội bộ gọn gàng hơn, các phần tử `null` không được phép.

> **Overloading (nạp chồng) so với varargs**
>
> Nếu bạn xem xét kỹ hơn interface `List`, bạn sẽ thấy vài biến thể overload của `List.of`:
>
> ```java
> static <E> List<E> of(E e1, E e2, E e3, E e4)
> static <E> List<E> of(E e1, E e2, E e3, E e4, E e5)
> ```
>
> Bạn có thể tự hỏi vì sao Java API lại không có một phương thức duy nhất dùng varargs để nhận một số lượng phần tử tuỳ ý theo kiểu sau:
>
> ```java
> static <E> List<E> of(E... elements)
> ```
>
> Ở bên dưới, phiên bản varargs cấp phát thêm một mảng phụ, được bọc bên trong một list. Bạn phải trả giá cho việc cấp phát một mảng, khởi tạo nó, và sau đó để garbage collection dọn dẹp nó. Bằng cách cung cấp một số lượng phần tử cố định (lên tới mười) thông qua API, bạn không phải trả cái giá này. Lưu ý rằng bạn vẫn có thể tạo `List.of` với hơn mười phần tử, nhưng trong trường hợp đó thì chữ ký varargs sẽ được gọi. Bạn cũng thấy khuôn mẫu này xuất hiện với `Set.of` và `Map.of`.

Bạn có thể băn khoăn liệu mình có nên dùng Streams API thay cho các phương thức collection factory mới để tạo những danh sách như vậy hay không. Suy cho cùng, ở các chương trước bạn đã thấy rằng bạn có thể dùng collector `Collectors.toList()` để biến đổi một stream thành một list. Trừ khi bạn cần thiết lập một dạng xử lý và biến đổi dữ liệu nào đó, chúng tôi khuyên bạn nên dùng các phương thức factory; chúng đơn giản hơn khi sử dụng, và phần cài đặt của các phương thức factory cũng đơn giản và phù hợp hơn.

Giờ khi bạn đã tìm hiểu về một phương thức factory mới cho `List`, ở mục tiếp theo bạn sẽ làm việc với `Set`.

### 8.1.2. Set factory

Giống như với `List.of`, bạn có thể tạo một `Set` immutable từ một danh sách các phần tử:

```java
Set<String> friends = Set.of("Raphael", "Olivia", "Thibaut");
System.out.println(friends);  // [Raphael, Olivia, Thibaut]
```

Nếu bạn thử tạo một `Set` bằng cách cung cấp một phần tử bị trùng lặp, bạn sẽ nhận được một `IllegalArgumentException`. Ngoại lệ này phản ánh đúng bản hợp đồng mà các set thực thi: tính duy nhất của các phần tử mà chúng chứa:

```java
// java.lang.IllegalArgumentException: duplicate element: Olivia
Set<String> friends = Set.of("Raphael", "Olivia", "Olivia");
```

Một cấu trúc dữ liệu phổ biến khác trong Java là `Map`. Ở mục tiếp theo, bạn sẽ tìm hiểu về những cách mới để tạo `Map`.

### 8.1.3. Map factories

Việc tạo một map phức tạp hơn một chút so với tạo list và set, bởi vì bạn phải đưa vào cả khoá lẫn giá trị. Bạn có hai cách để khởi tạo một map immutable trong Java 9. Bạn có thể dùng phương thức factory `Map.of`, vốn xen kẽ giữa các khoá và các giá trị:

```java
Map<String, Integer> ageOfFriends
    = Map.of("Raphael", 30, "Olivia", 25, "Thibaut", 26);
System.out.println(ageOfFriends);  // {Olivia=25, Raphael=30, Thibaut=26}
```

Phương thức này tiện lợi nếu bạn muốn tạo một map nhỏ với tối đa mười cặp khoá và giá trị. Để vượt qua giới hạn này, hãy dùng phương thức factory thay thế có tên `Map.ofEntries`, vốn nhận vào các đối tượng `Map.Entry<K, V>` nhưng được cài đặt bằng varargs. Phương thức này đòi hỏi thêm các lần cấp phát đối tượng để bọc một khoá và một giá trị:

```java
import static java.util.Map.entry;

Map<String, Integer> ageOfFriends
    = Map.ofEntries(entry("Raphael", 30),
                    entry("Olivia", 25),
                    entry("Thibaut", 26));
System.out.println(ageOfFriends);  // {Olivia=25, Raphael=30, Thibaut=26}
```

`Map.entry` là một phương thức factory mới để tạo các đối tượng `Map.Entry`.

---

**Quiz 8.1**

Bạn nghĩ đầu ra của đoạn code sau là gì?

```java
List<String> actors = List.of("Keanu", "Jessica");
actors.set(0, "Brad");

System.out.println(actors);
```

**Đáp án:**

Một `UnsupportedOperationException` sẽ được ném ra. Collection do `List.of` tạo ra là immutable.

---

Cho đến giờ, bạn đã thấy rằng các phương thức factory mới của Java 9 cho phép bạn tạo collection một cách đơn giản hơn. Nhưng trong thực tế, bạn phải xử lý các collection đó. Ở mục tiếp theo, bạn sẽ tìm hiểu về một vài cải tiến mới cho `List` và `Set`, những cải tiến cài đặt sẵn các khuôn mẫu xử lý thường gặp.

## 8.2. Làm việc với List và Set

Java 8 đã đưa vào một vài phương thức trong các interface `List` và `Set`:

- `removeIf` xoá các phần tử khớp với một predicate. Nó có sẵn trên mọi class cài đặt `List` hoặc `Set` (và được kế thừa từ interface `Collection`).
- `replaceAll` có sẵn trên `List` và thay thế các phần tử bằng cách dùng một hàm (`UnaryOperator`).
- `sort` cũng có sẵn trên interface `List` và sắp xếp chính danh sách đó.

Tất cả các phương thức này đều biến đổi (mutate) collection mà chúng được gọi trên đó. Nói cách khác, chúng thay đổi chính collection đó, khác với các thao tác stream vốn tạo ra một kết quả mới (đã được sao chép). Tại sao lại thêm những phương thức như vậy? Việc sửa đổi collection có thể dễ gây lỗi và dài dòng. Vì vậy Java 8 đã thêm `removeIf` và `replaceAll` để trợ giúp.

### 8.2.1. removeIf

Hãy xem đoạn code sau, nó cố gắng xoá đi những giao dịch có mã tham chiếu bắt đầu bằng một chữ số:

```java
for (Transaction transaction : transactions) {
    if (Character.isDigit(transaction.getReferenceCode().charAt(0))) {
        transactions.remove(transaction);
    }
}
```

Bạn có thấy vấn đề không? Đáng tiếc là đoạn code này có thể dẫn đến một `ConcurrentModificationException`. Tại sao? Ở bên dưới, vòng lặp for-each sử dụng một đối tượng `Iterator`, nên đoạn code thực sự được thực thi là như sau:

```java
for (Iterator<Transaction> iterator = transactions.iterator();
     iterator.hasNext(); ) {
    Transaction transaction = iterator.next();
    if (Character.isDigit(transaction.getReferenceCode().charAt(0))) {
        // Vấn đề: chúng ta đang duyệt và sửa đổi collection
        // thông qua hai đối tượng riêng biệt
        transactions.remove(transaction);
    }
}
```

Hãy để ý rằng có hai đối tượng riêng biệt cùng quản lý collection:

- Đối tượng `Iterator`, vốn đang truy vấn nguồn dữ liệu bằng `next()` và `hasNext()`
- Chính đối tượng `Collection`, vốn đang xoá phần tử bằng cách gọi `remove()`

Kết quả là trạng thái của iterator không còn đồng bộ với trạng thái của collection, và ngược lại. Để giải quyết vấn đề này, bạn phải sử dụng đối tượng `Iterator` một cách tường minh và gọi phương thức `remove()` của nó:

```java
for (Iterator<Transaction> iterator = transactions.iterator();
     iterator.hasNext(); ) {
    Transaction transaction = iterator.next();
    if (Character.isDigit(transaction.getReferenceCode().charAt(0))) {
        iterator.remove();
    }
}
```

Đoạn code này trở nên khá dài dòng khi viết. Khuôn mẫu code này giờ đây có thể được diễn đạt trực tiếp bằng phương thức `removeIf` của Java 8, vốn không chỉ đơn giản hơn mà còn bảo vệ bạn khỏi những lỗi kể trên. Nó nhận vào một predicate cho biết những phần tử nào cần xoá:

```java
transactions.removeIf(transaction ->
        Character.isDigit(transaction.getReferenceCode().charAt(0)));
```

Tuy nhiên, đôi khi thay vì xoá một phần tử, bạn lại muốn thay thế nó. Với mục đích này, Java 8 đã thêm `replaceAll`.

### 8.2.2. replaceAll

Phương thức `replaceAll` trên interface `List` cho phép bạn thay thế mỗi phần tử trong một list bằng một phần tử mới. Dùng Streams API, bạn có thể giải quyết vấn đề này như sau:

```java
referenceCodes.stream()  // [a12, C14, b13]
              .map(code -> Character.toUpperCase(code.charAt(0)) +
                           code.substring(1))
              .collect(Collectors.toList())
              .forEach(System.out::println);  // in ra A12, C14, B13
```

Tuy nhiên, đoạn code này tạo ra một collection chuỗi mới. Bạn lại muốn một cách để cập nhật chính collection hiện có. Bạn có thể dùng một đối tượng `ListIterator` như sau (nó hỗ trợ phương thức `set()` để thay thế một phần tử):

```java
for (ListIterator<String> iterator = referenceCodes.listIterator();
     iterator.hasNext(); ) {
    String code = iterator.next();
    iterator.set(Character.toUpperCase(code.charAt(0)) + code.substring(1));
}
```

Như bạn thấy, đoạn code này khá dài dòng. Ngoài ra, như chúng tôi đã giải thích ở trên, việc dùng các đối tượng `Iterator` kết hợp với các đối tượng collection có thể dễ gây lỗi do trộn lẫn việc duyệt và việc sửa đổi collection. Trong Java 8, bạn chỉ cần viết đơn giản:

```java
referenceCodes.replaceAll(code -> Character.toUpperCase(code.charAt(0)) +
                                  code.substring(1));
```

Bạn đã tìm hiểu những gì mới mẻ với `List` và `Set`, nhưng đừng quên `Map`. Những bổ sung mới cho interface `Map` sẽ được trình bày ở mục tiếp theo.

## 8.3. Làm việc với Map

Java 8 đã giới thiệu vài default method được interface `Map` hỗ trợ. (Default method được trình bày chi tiết ở chương 13, nhưng ở đây bạn có thể hình dung chúng như những phương thức đã được cài đặt sẵn bên trong một interface.) Mục đích của những thao tác mới này là giúp bạn viết code cô đọng hơn bằng cách dùng một idiomatic pattern có sẵn thay vì tự mình cài đặt nó. Chúng ta sẽ xem xét những thao tác này trong các mục tiếp theo, bắt đầu với `forEach` mới toanh.

### 8.3.1. forEach

Việc duyệt qua các khoá và giá trị của một `Map` từ trước tới nay vẫn khá vụng về. Thực tế, bạn cần dùng một iterator của `Map.Entry<K, V>` trên tập entry của một `Map`:

```java
for (Map.Entry<String, Integer> entry : ageOfFriends.entrySet()) {
    String friend = entry.getKey();
    Integer age = entry.getValue();
    System.out.println(friend + " is " + age + " years old");
}
```

Kể từ Java 8, interface `Map` đã hỗ trợ phương thức `forEach`, vốn nhận vào một `BiConsumer` lấy khoá và giá trị làm đối số. Việc dùng `forEach` giúp code của bạn cô đọng hơn:

```java
ageOfFriends.forEach((friend, age) ->
        System.out.println(friend + " is " + age + " years old"));
```

Một mối quan tâm liên quan đến việc duyệt dữ liệu là việc sắp xếp nó. Java 8 đã giới thiệu một vài cách tiện lợi để so sánh các entry trong một `Map`.

### 8.3.2. Sắp xếp (Sorting)

Hai tiện ích mới cho phép bạn sắp xếp các entry của một map theo giá trị hoặc theo khoá:

- `Entry.comparingByValue`
- `Entry.comparingByKey`

Đoạn code

```java
Map<String, String> favouriteMovies
    = Map.ofEntries(entry("Raphael", "Star Wars"),
                    entry("Cristina", "Matrix"),
                    entry("Olivia", "James Bond"));

favouriteMovies
    .entrySet()
    .stream()
    .sorted(Entry.comparingByKey())
    // Xử lý các phần tử của stream theo thứ tự bảng chữ cái dựa trên tên người
    .forEachOrdered(System.out::println);
```

sẽ in ra, theo thứ tự:

```text
Cristina=Matrix
Olivia=James Bond
Raphael=Star Wars
```

> **HashMap và hiệu năng**
>
> Cấu trúc nội bộ của một `HashMap` đã được cập nhật trong Java 8 để cải thiện hiệu năng. Các entry của một map thường được lưu trong các bucket, được truy cập thông qua hashcode sinh ra từ khoá. Nhưng nếu nhiều khoá cùng trả về một hashcode giống nhau, hiệu năng sẽ suy giảm vì các bucket được cài đặt dưới dạng `LinkedList` với chi phí truy xuất O(n). Ngày nay, khi các bucket trở nên quá lớn, chúng được thay thế một cách động bằng các cây có sắp xếp (sorted tree), vốn có chi phí truy xuất O(log(n)) và cải thiện việc tra cứu các phần tử bị va chạm hash. Lưu ý rằng việc sử dụng cây có sắp xếp này chỉ khả thi khi các khoá là `Comparable` (chẳng hạn các class `String` hoặc `Number`).

Một khuôn mẫu phổ biến khác là làm gì khi khoá bạn đang tra cứu trong `Map` không tồn tại. Phương thức mới `getOrDefault` có thể giúp ích.

### 8.3.3. getOrDefault

Khi khoá bạn đang tra cứu không tồn tại, bạn nhận được một tham chiếu `null` mà bạn phải kiểm tra để tránh một `NullPointerException`. Một phong cách thiết kế phổ biến là cung cấp một giá trị mặc định thay thế. Giờ đây bạn có thể diễn đạt ý tưởng này đơn giản hơn bằng cách dùng phương thức `getOrDefault`. Phương thức này nhận khoá làm đối số thứ nhất và một giá trị mặc định (được dùng khi khoá vắng mặt trong `Map`) làm đối số thứ hai:

```java
Map<String, String> favouriteMovies
    = Map.ofEntries(entry("Raphael", "Star Wars"),
                    entry("Olivia", "James Bond"));

// In ra James Bond
System.out.println(favouriteMovies.getOrDefault("Olivia", "Matrix"));
// In ra Matrix
System.out.println(favouriteMovies.getOrDefault("Thibaut", "Matrix"));
```

Lưu ý rằng nếu khoá tồn tại trong `Map` nhưng vô tình lại được gán với giá trị `null`, thì `getOrDefault` vẫn có thể trả về `null`. Cũng lưu ý rằng biểu thức bạn truyền vào làm giá trị dự phòng luôn luôn được tính toán, bất kể khoá có tồn tại hay không.

Java 8 cũng bao gồm thêm một vài khuôn mẫu nâng cao hơn để xử lý sự có mặt và vắng mặt của giá trị ứng với một khoá cho trước. Bạn sẽ tìm hiểu về các phương thức mới này ở mục tiếp theo.

### 8.3.4. Các khuôn mẫu compute

Đôi khi bạn muốn thực hiện một thao tác một cách có điều kiện và lưu lại kết quả của nó, tuỳ theo việc một khoá có mặt hay vắng mặt trong `Map`. Ví dụ, bạn có thể muốn cache kết quả của một thao tác tốn kém ứng với một khoá cho trước. Nếu khoá đã có mặt, không cần phải tính toán lại kết quả. Ba thao tác mới có thể giúp ích:

- `computeIfAbsent` — Nếu không có giá trị nào được chỉ định cho khoá đã cho (khoá vắng mặt hoặc giá trị của nó là `null`), hãy tính một giá trị mới dựa trên khoá đó và thêm nó vào `Map`.
- `computeIfPresent` — Nếu khoá được chỉ định có mặt, hãy tính một giá trị mới cho nó và thêm vào `Map`.
- `compute` — Thao tác này tính một giá trị mới cho một khoá cho trước và lưu nó vào `Map`.

Một ứng dụng của `computeIfAbsent` là để cache thông tin. Giả sử bạn phân tích từng dòng của một tập hợp các file và tính biểu diễn SHA-256 của chúng. Nếu bạn đã xử lý dữ liệu đó trước đây rồi, thì không cần phải tính toán lại.

Bây giờ giả sử bạn cài đặt một cache bằng cách dùng một `Map`, và bạn dùng một instance của `MessageDigest` để tính các mã băm SHA-256:

```java
Map<String, byte[]> dataToHash = new HashMap<>();
MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
```

Sau đó bạn có thể duyệt qua dữ liệu và cache lại các kết quả:

```java
lines.forEach(line ->
        dataToHash.computeIfAbsent(line,          // line là khoá cần tra cứu trong map
                                   this::calculateDigest));  // thao tác sẽ thực thi nếu khoá vắng mặt

// Hàm trợ giúp sẽ tính mã băm cho khoá đã cho
private byte[] calculateDigest(String key) {
    return messageDigest.digest(key.getBytes(StandardCharsets.UTF_8));
}
```

Khuôn mẫu này cũng hữu ích để xử lý thuận tiện những map lưu nhiều giá trị. Nếu bạn cần thêm một phần tử vào một `Map<K, List<V>>`, bạn phải đảm bảo rằng entry đó đã được khởi tạo. Đây là một khuôn mẫu khá dài dòng để thiết lập. Giả sử bạn muốn dựng lên một danh sách phim cho người bạn tên Raphael của bạn:

```java
String friend = "Raphael";
List<String> movies = friendsToMovies.get(friend);
if (movies == null) {                      // Kiểm tra xem danh sách đã được khởi tạo chưa
    movies = new ArrayList<>();
    friendsToMovies.put(friend, movies);
}
movies.add("Star Wars");                   // Thêm bộ phim

System.out.println(friendsToMovies);       // {Raphael: [Star Wars]}
```

Bạn có thể dùng `computeIfAbsent` thay thế như thế nào? Nó trả về giá trị vừa tính được sau khi thêm giá trị đó vào `Map` nếu không tìm thấy khoá; ngược lại, nó trả về giá trị đang tồn tại. Bạn có thể dùng nó như sau:

```java
// {Raphael: [Star Wars]}
friendsToMovies.computeIfAbsent("Raphael", name -> new ArrayList<>())
               .add("Star Wars");
```

Phương thức `computeIfPresent` tính một giá trị mới nếu giá trị hiện tại gắn với khoá đó có mặt trong `Map` và khác `null`. Hãy để ý một điểm tinh tế: nếu hàm sinh ra giá trị trả về `null`, thì ánh xạ hiện tại sẽ bị xoá khỏi `Map`. Tuy nhiên, nếu bạn cần xoá một ánh xạ, thì một phiên bản overload của phương thức `remove` phù hợp với nhiệm vụ này hơn. Bạn sẽ tìm hiểu về phương thức này ở mục tiếp theo.

### 8.3.5. Các khuôn mẫu remove

Bạn đã biết về phương thức `remove` cho phép bạn xoá một entry của `Map` ứng với một khoá cho trước. Kể từ Java 8, một phiên bản overload chỉ xoá một entry nếu khoá đó được gắn với một giá trị cụ thể. Trước đây, đoạn code sau là cách bạn sẽ cài đặt hành vi này (chúng tôi không có gì chống lại Tom Cruise, nhưng phim *Jack Reacher 2* nhận được nhiều đánh giá kém):

```java
String key = "Raphael";
String value = "Jack Reacher 2";
if (favouriteMovies.containsKey(key) &&
        Objects.equals(favouriteMovies.get(key), value)) {
    favouriteMovies.remove(key);
    return true;
}
else {
    return false;
}
```

Còn đây là cách bạn có thể làm điều tương tự ngay bây giờ, mà bạn phải thừa nhận là đi thẳng vào vấn đề hơn nhiều:

```java
favouriteMovies.remove(key, value);
```

Ở mục tiếp theo, bạn sẽ tìm hiểu về những cách thay thế phần tử trong và xoá phần tử khỏi một `Map`.

### 8.3.6. Các khuôn mẫu thay thế (Replacement patterns)

`Map` có hai phương thức mới cho phép bạn thay thế các entry bên trong một `Map`:

- `replaceAll` — Thay thế giá trị của mỗi entry bằng kết quả của việc áp dụng một `BiFunction`. Phương thức này hoạt động tương tự như `replaceAll` trên một `List` mà bạn đã thấy ở trên.
- `replace` — Cho phép bạn thay thế một giá trị trong `Map` nếu khoá có mặt. Một phiên bản overload bổ sung chỉ thay thế giá trị nếu khoá đang được ánh xạ tới một giá trị nhất định.

Bạn có thể định dạng lại tất cả các giá trị trong một `Map` như sau:

```java
// Chúng ta phải dùng một map mutable vì sẽ sử dụng replaceAll
Map<String, String> favouriteMovies = new HashMap<>();
favouriteMovies.put("Raphael", "Star Wars");
favouriteMovies.put("Olivia", "james bond");
favouriteMovies.replaceAll((friend, movie) -> movie.toUpperCase());
System.out.println(favouriteMovies);  // {Olivia=JAMES BOND, Raphael=STAR WARS}
```

Các khuôn mẫu thay thế mà bạn vừa học hoạt động với một `Map` duy nhất. Nhưng sẽ ra sao nếu bạn phải kết hợp và thay thế các giá trị từ hai `Map`? Bạn có thể dùng phương thức `merge` mới cho nhiệm vụ đó.

### 8.3.7. Merge

Giả sử bạn muốn gộp hai `Map` trung gian, có lẽ là hai `Map` riêng biệt cho hai nhóm liên hệ. Bạn có thể dùng `putAll` như sau:

```java
Map<String, String> family = Map.ofEntries(
        entry("Teo", "Star Wars"), entry("Cristina", "James Bond"));
Map<String, String> friends = Map.ofEntries(
        entry("Raphael", "Star Wars"));
Map<String, String> everyone = new HashMap<>(family);
everyone.putAll(friends);      // Sao chép tất cả entry từ friends vào everyone
// {Cristina=James Bond, Raphael=Star Wars, Teo=Star Wars}
System.out.println(everyone);
```

Đoạn code này hoạt động đúng như mong đợi miễn là bạn không có khoá trùng lặp. Nếu bạn cần linh hoạt hơn trong cách các giá trị được kết hợp, bạn có thể dùng phương thức `merge` mới. Phương thức này nhận vào một `BiFunction` để gộp các giá trị có khoá trùng nhau. Giả sử Cristina có mặt trong cả hai map `family` và `friends` nhưng với những bộ phim gắn kèm khác nhau:

```java
Map<String, String> family = Map.ofEntries(
        entry("Teo", "Star Wars"), entry("Cristina", "James Bond"));
Map<String, String> friends = Map.ofEntries(
        entry("Raphael", "Star Wars"), entry("Cristina", "Matrix"));
```

Khi đó bạn có thể dùng phương thức `merge` kết hợp với `forEach` để cung cấp một cách xử lý xung đột. Đoạn code sau nối chuỗi tên của hai bộ phim lại với nhau:

```java
Map<String, String> everyone = new HashMap<>(family);
// Khi gặp khoá trùng lặp, nối hai giá trị lại với nhau
friends.forEach((k, v) ->
        everyone.merge(k, v, (movie1, movie2) -> movie1 + " & " + movie2));

// In ra {Raphael=Star Wars, Cristina=James Bond & Matrix, Teo=Star Wars}
System.out.println(everyone);
```

Lưu ý rằng phương thức `merge` có một cách xử lý `null` khá phức tạp, như được đặc tả trong Javadoc:

> Nếu khoá được chỉ định chưa được gắn với một giá trị nào hoặc đang được gắn với `null`, thì [merge] gắn nó với giá trị non-null đã cho. Ngược lại, [merge] thay thế giá trị đang gắn kèm bằng [kết quả] của hàm remapping đã cho, hoặc xoá [nó] đi nếu kết quả là `null`.

Bạn cũng có thể dùng `merge` để cài đặt các phép kiểm tra khởi tạo. Giả sử bạn có một `Map` để ghi nhận một bộ phim đã được xem bao nhiêu lần. Bạn cần kiểm tra rằng khoá đại diện cho bộ phim đã có trong map trước khi có thể tăng giá trị của nó:

```java
Map<String, Long> moviesToCount = new HashMap<>();
String movieName = "JamesBond";
Long count = moviesToCount.get(movieName);
if (count == null) {
    moviesToCount.put(movieName, 1L);
}
else {
    moviesToCount.put(movieName, count + 1L);
}
```

Đoạn code này có thể được viết lại thành

```java
moviesToCount.merge(movieName, 1L, (key, count) -> count + 1L);
```

Đối số thứ hai truyền cho `merge` trong trường hợp này là `1L`. Javadoc đặc tả rằng đối số này là "giá trị non-null sẽ được gộp với giá trị hiện có đang gắn với khoá, hoặc, nếu không có giá trị hiện có nào hoặc một giá trị `null` đang gắn với khoá, thì sẽ được gắn với khoá đó." Bởi vì giá trị trả về cho khoá đó là `null`, nên giá trị `1` được cung cấp trong lần đầu tiên. Ở những lần sau, bởi vì giá trị cho khoá đã được khởi tạo thành giá trị `1`, `BiFunction` sẽ được áp dụng để tăng bộ đếm lên.

---

**Quiz 8.2**

Hãy tìm hiểu xem đoạn code sau làm gì, và nghĩ xem bạn có thể dùng thao tác đặc trưng (idiomatic operation) nào để đơn giản hoá những gì nó đang làm:

```java
Map<String, Integer> movies = new HashMap<>();
movies.put("JamesBond", 20);
movies.put("Matrix", 15);
movies.put("Harry Potter", 5);

Iterator<Map.Entry<String, Integer>> iterator =
        movies.entrySet().iterator();
while (iterator.hasNext()) {
    Map.Entry<String, Integer> entry = iterator.next();
    if (entry.getValue() < 10) {
        iterator.remove();
    }
}
System.out.println(movies);  // {Matrix=15, JamesBond=20}
```

**Đáp án:**

Bạn có thể dùng phương thức `removeIf` trên tập entry của map, phương thức này nhận vào một predicate và xoá các phần tử tương ứng:

```java
movies.entrySet().removeIf(entry -> entry.getValue() < 10);
```

---

Bạn đã tìm hiểu về những bổ sung cho interface `Map`. Những cải tiến mới cũng đã được thêm vào cho một "người anh em họ" của nó: `ConcurrentHashMap`, thứ mà bạn sẽ tìm hiểu ngay sau đây.

## 8.4. ConcurrentHashMap được cải tiến

Class `ConcurrentHashMap` được giới thiệu nhằm cung cấp một `HashMap` hiện đại hơn, đồng thời thân thiện với xử lý đồng thời (concurrency). `ConcurrentHashMap` cho phép các thao tác thêm và cập nhật đồng thời, chỉ khoá (lock) một số phần nhất định của cấu trúc dữ liệu nội bộ. Nhờ vậy, các thao tác đọc và ghi có hiệu năng tốt hơn so với phương án `Hashtable` được đồng bộ hoá. (Lưu ý rằng `HashMap` tiêu chuẩn thì không được đồng bộ hoá.)

### 8.4.1. Reduce và Search

`ConcurrentHashMap` hỗ trợ ba loại thao tác mới, gợi nhớ đến những gì bạn đã thấy với stream:

- `forEach` — Thực hiện một hành động cho trước với mỗi cặp (key, value)
- `reduce` — Kết hợp tất cả các cặp (key, value) thành một kết quả thông qua một hàm reduction
- `search` — Áp dụng một hàm lên mỗi cặp (key, value) cho đến khi hàm đó tạo ra một kết quả khác `null`

Mỗi loại thao tác hỗ trợ bốn dạng, nhận vào các hàm với đối số là khoá, giá trị, `Map.Entry`, và cặp (key, value):

- Thao tác với khoá và giá trị (`forEach`, `reduce`, `search`)
- Thao tác với khoá (`forEachKey`, `reduceKeys`, `searchKeys`)
- Thao tác với giá trị (`forEachValue`, `reduceValues`, `searchValues`)
- Thao tác với các đối tượng `Map.Entry` (`forEachEntry`, `reduceEntries`, `searchEntries`)

Lưu ý rằng các thao tác này không khoá trạng thái của `ConcurrentHashMap`; chúng thao tác trên các phần tử ngay khi duyệt qua. Các hàm được cung cấp cho những thao tác này không nên phụ thuộc vào bất kỳ thứ tự nào, hoặc vào bất kỳ đối tượng hay giá trị nào khác có thể thay đổi trong khi quá trình tính toán đang diễn ra.

Ngoài ra, bạn cần chỉ định một ngưỡng song song (parallelism threshold) cho tất cả các thao tác này. Các thao tác sẽ thực thi tuần tự nếu kích thước hiện tại của map nhỏ hơn ngưỡng đã cho. Giá trị `1` cho phép mức song song tối đa bằng cách dùng common thread pool. Giá trị ngưỡng `Long.MAX_VALUE` sẽ chạy thao tác trên một thread duy nhất. Nhìn chung bạn nên bám vào những giá trị này trừ khi kiến trúc phần mềm của bạn có tối ưu hoá sử dụng tài nguyên ở mức nâng cao.

Trong ví dụ này, bạn dùng phương thức `reduceValues` để tìm giá trị lớn nhất trong map:

```java
// Một ConcurrentHashMap, giả định đã được cập nhật để chứa vài khoá và giá trị
ConcurrentHashMap<String, Long> map = new ConcurrentHashMap<>();
long parallelismThreshold = 1;
Optional<Integer> maxValue =
        Optional.ofNullable(map.reduceValues(parallelismThreshold, Long::max));
```

Hãy lưu ý các phiên bản chuyên biệt cho kiểu primitive `int`, `long` và `double` ứng với mỗi thao tác reduce (`reduceValuesToInt`, `reduceKeysToLong`, v.v.), chúng hiệu quả hơn vì tránh được việc boxing.

### 8.4.2. Đếm (Counting)

Class `ConcurrentHashMap` cung cấp một phương thức mới có tên `mappingCount`, trả về số lượng ánh xạ trong map dưới dạng một `long`. Với code mới, bạn nên ưu tiên dùng nó thay cho phương thức `size`, vốn trả về một `int`. Làm như vậy giúp code của bạn sẵn sàng cho tương lai, khi số lượng ánh xạ không còn vừa với một `int` nữa.

### 8.4.3. Set view

Class `ConcurrentHashMap` cung cấp một phương thức mới có tên `keySet`, trả về một khung nhìn (view) của `ConcurrentHashMap` dưới dạng một `Set`. (Các thay đổi trong map được phản ánh vào `Set`, và ngược lại.) Bạn cũng có thể tạo một `Set` được hậu thuẫn bởi một `ConcurrentHashMap` bằng cách dùng phương thức static mới `newKeySet`.

## Tóm tắt

- Java 9 hỗ trợ các collection factory, cho phép bạn tạo các list, set và map immutable nhỏ bằng cách dùng `List.of`, `Set.of`, `Map.of` và `Map.ofEntries`.
- Các đối tượng do những collection factory này trả về đều là immutable, nghĩa là bạn không thể thay đổi trạng thái của chúng sau khi tạo.
- Interface `List` hỗ trợ các default method `removeIf`, `replaceAll` và `sort`.
- Interface `Set` hỗ trợ default method `removeIf`.
- Interface `Map` bao gồm vài default method mới cho những khuôn mẫu thường gặp và giảm phạm vi phát sinh lỗi.
- `ConcurrentHashMap` hỗ trợ các default method mới được kế thừa từ `Map` nhưng cung cấp cho chúng những phần cài đặt an toàn với thread (thread-safe).
