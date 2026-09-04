# Chương 10. Domain-specific language với lambda

> **Nội dung chương này**
>
> - DSL (domain-specific language) là gì và có những dạng nào
> - Ưu điểm và nhược điểm khi thêm một DSL vào API của bạn
> - Các lựa chọn thay thế trên JVM cho một DSL thuần Java
> - Học hỏi từ những DSL có sẵn trong các interface và class của Java hiện đại
> - Các pattern và kỹ thuật để cài đặt DSL hiệu quả dựa trên Java
> - Cách các thư viện và công cụ Java thông dụng sử dụng những pattern này

Các lập trình viên thường quên rằng một ngôn ngữ lập trình trước hết vẫn là một ngôn ngữ. Mục đích chính của bất kỳ ngôn ngữ nào là truyền đạt một thông điệp theo cách rõ ràng nhất, dễ hiểu nhất. Có lẽ đặc điểm quan trọng nhất của phần mềm được viết tốt chính là việc truyền đạt ý định của nó một cách rõ ràng — hay như nhà khoa học máy tính nổi tiếng Harold Abelson đã nói: "Chương trình phải được viết cho con người đọc, và chỉ tình cờ là để máy thực thi."

Tính dễ đọc và tính dễ hiểu thậm chí còn quan trọng hơn nữa ở những phần phần mềm được dùng để mô hình hoá nghiệp vụ cốt lõi của ứng dụng. Viết code có thể được chia sẻ và hiểu bởi cả đội phát triển lẫn các chuyên gia nghiệp vụ (domain experts) sẽ giúp ích rất nhiều cho năng suất. Các chuyên gia nghiệp vụ có thể tham gia vào quá trình phát triển phần mềm và kiểm chứng tính đúng đắn của phần mềm từ góc nhìn nghiệp vụ. Nhờ vậy, lỗi và những hiểu lầm có thể được phát hiện sớm.

Để đạt được kết quả này, người ta thường diễn đạt logic nghiệp vụ của ứng dụng thông qua một domain-specific language (DSL — ngôn ngữ chuyên biệt cho một lĩnh vực). Một DSL là một ngôn ngữ lập trình nhỏ, thường không phải ngôn ngữ đa dụng, được thiết kế riêng cho một lĩnh vực cụ thể. DSL sử dụng thuật ngữ đặc trưng của lĩnh vực đó. Chẳng hạn bạn có thể đã quen với Maven và Ant. Bạn có thể xem chúng như những DSL dùng để diễn đạt các quy trình build. Bạn cũng quen thuộc với HTML, một ngôn ngữ được thiết kế riêng để định nghĩa cấu trúc của một trang web.

Trong lịch sử, do sự cứng nhắc và quá dài dòng của mình, Java chưa bao giờ được ưa chuộng để cài đặt một DSL gọn gàng mà lại phù hợp cho những người không chuyên về kỹ thuật đọc. Tuy nhiên, giờ đây khi Java đã hỗ trợ lambda expression, bạn có thêm những công cụ mới trong bộ đồ nghề của mình! Thực tế, bạn đã học ở chương 3 rằng lambda expression giúp giảm sự dài dòng của code và cải thiện tỉ lệ tín hiệu/nhiễu (signal/noise) của chương trình.

Hãy nghĩ về một cơ sở dữ liệu được cài đặt bằng Java. Sâu bên trong cơ sở dữ liệu đó, nhiều khả năng có rất nhiều đoạn code phức tạp để xác định vị trí lưu một bản ghi trên đĩa, xây dựng chỉ mục cho các bảng, và xử lý các giao dịch đồng thời. Cơ sở dữ liệu này chắc hẳn được lập trình bởi những lập trình viên tương đối chuyên sâu. Giả sử bây giờ bạn muốn viết một truy vấn tương tự những gì chúng ta đã khảo sát ở chương 4 và 5: "Tìm tất cả các món trong một thực đơn cho trước có ít hơn 400 calo."

Trong quá khứ, những lập trình viên chuyên sâu như vậy có thể nhanh chóng viết code ở mức thấp theo phong cách này và nghĩ rằng công việc thật dễ dàng:

```java
while (block != null) {
    read(block, buffer)
    for (every record in buffer) {
        if (record.calorie < 400) {
            System.out.println(record.name);
        }
    }
    block = buffer.next();
}
```

Giải pháp này có hai vấn đề chính: nó khó viết đối với một lập trình viên ít kinh nghiệm hơn (có thể cần đến những chi tiết tinh tế về khoá, I/O, hoặc cấp phát đĩa), và quan trọng hơn, nó xử lý các khái niệm ở mức hệ thống, chứ không phải các khái niệm ở mức ứng dụng.

Một lập trình viên mới gia nhập, làm việc ở phía giao diện người dùng, có thể nói: "Tại sao anh không cung cấp cho tôi một interface SQL để tôi có thể viết `SELECT name FROM menu WHERE calorie < 400`, trong đó `menu` chứa thực đơn nhà hàng được biểu diễn dưới dạng một bảng SQL? Như vậy tôi có thể lập trình hiệu quả hơn nhiều so với tất cả những thứ rắc rối ở mức hệ thống này!" Thật khó phản bác lại lập luận đó! Về bản chất, lập trình viên này đã yêu cầu một DSL để tương tác với cơ sở dữ liệu thay vì viết code Java thuần tuý. Về mặt kỹ thuật, loại DSL này được gọi là external (bên ngoài) vì nó đòi hỏi cơ sở dữ liệu phải có một API có khả năng phân tích và định trị các biểu thức SQL viết dưới dạng văn bản. Bạn sẽ tìm hiểu kỹ hơn về sự phân biệt giữa external DSL và internal DSL ở phần sau của chương này.

Nhưng nếu bạn nhớ lại chương 4 và 5, bạn sẽ nhận ra đoạn code này cũng có thể được viết ngắn gọn hơn bằng Java thông qua Stream API, chẳng hạn như sau:

```java
menu.stream()
    .filter(d -> d.getCalories() < 400)
    .map(Dish::getName)
    .forEach(System.out::println)
```

Cách nối chuỗi các phương thức (method chaining) này, vốn rất đặc trưng cho Stream API, thường được gọi là fluent style (phong cách trôi chảy), bởi vì nó dễ hiểu ngay lập tức, trái ngược với luồng điều khiển phức tạp trong các vòng lặp Java.

Phong cách này thực chất đã nắm bắt được một DSL. Trong trường hợp này, DSL đó không phải external mà là internal (bên trong). Trong một internal DSL, các thao tác nguyên thuỷ ở mức ứng dụng được phơi bày ra dưới dạng các phương thức Java để dùng trên một hoặc nhiều kiểu class biểu diễn cơ sở dữ liệu, khác với cú pháp không phải Java của các thao tác nguyên thuỷ trong một external DSL, chẳng hạn như `SELECT FROM` trong ví dụ SQL ở trên.

Về bản chất, thiết kế một DSL bao gồm việc quyết định lập trình viên ở mức ứng dụng cần thao tác với những phép toán nào (cẩn thận tránh mọi sự ô nhiễm không cần thiết gây ra bởi các khái niệm ở mức hệ thống) và cung cấp những phép toán đó cho lập trình viên.

Với một internal DSL, quá trình này có nghĩa là phơi bày các class và phương thức thích hợp để code có thể được viết một cách trôi chảy. Một external DSL đòi hỏi nhiều công sức hơn; bạn không chỉ phải thiết kế cú pháp của DSL, mà còn phải cài đặt một bộ phân tích cú pháp (parser) và một bộ định trị (evaluator) cho DSL đó. Tuy nhiên, nếu bạn thiết kế đúng, có lẽ những lập trình viên có trình độ thấp hơn cũng có thể viết code nhanh chóng và hiệu quả (nhờ đó kiếm ra tiền giúp công ty bạn tồn tại) mà không phải lập trình trực tiếp bên trong đống code mức hệ thống tuyệt đẹp (nhưng khó hiểu với người không chuyên) của bạn!

Trong chương này, bạn sẽ tìm hiểu DSL là gì thông qua vài ví dụ và tình huống sử dụng; bạn sẽ học khi nào nên cân nhắc cài đặt một DSL và lợi ích của nó là gì. Sau đó bạn sẽ khảo sát một số DSL nhỏ được giới thiệu trong Java 8 API. Bạn cũng sẽ học cách áp dụng chính những pattern đó để tạo ra DSL của riêng mình. Cuối cùng, bạn sẽ tìm hiểu cách một số thư viện và framework Java được sử dụng rộng rãi đã áp dụng các kỹ thuật này để cung cấp chức năng của chúng thông qua một tập hợp các DSL, khiến API của chúng dễ tiếp cận và dễ dùng hơn.

## 10.1. Một ngôn ngữ riêng cho lĩnh vực của bạn

Một DSL là một ngôn ngữ được xây dựng riêng nhằm giải quyết một bài toán cho một lĩnh vực nghiệp vụ cụ thể. Chẳng hạn bạn có thể đang phát triển một ứng dụng phần mềm kế toán. Lĩnh vực nghiệp vụ của bạn bao gồm những khái niệm như sao kê ngân hàng và những thao tác như đối soát. Bạn có thể tạo ra một DSL riêng để diễn đạt các bài toán trong lĩnh vực đó. Trong Java, bạn cần nghĩ ra một tập hợp các class và phương thức để biểu diễn lĩnh vực đó. Theo một cách nào đó, bạn có thể xem DSL như một API được tạo ra để giao tiếp với một lĩnh vực nghiệp vụ cụ thể.

Một DSL không phải là ngôn ngữ lập trình đa dụng; nó giới hạn các thao tác và từ vựng khả dụng vào một lĩnh vực cụ thể, nghĩa là bạn có ít thứ phải bận tâm hơn và có thể dồn nhiều sự chú ý hơn cho việc giải quyết bài toán nghiệp vụ đang gặp phải. DSL của bạn nên cho phép người dùng chỉ phải làm việc với những phức tạp thuộc về lĩnh vực đó. Những chi tiết cài đặt ở mức thấp hơn nên được che giấu — giống như việc đặt các phương thức chi tiết cài đặt mức thấp của một class thành `private`. Kết quả là một DSL thân thiện với người dùng.

Cái gì không phải là DSL? Một DSL không phải là tiếng Anh thuần tuý. Nó cũng không phải một ngôn ngữ cho phép các chuyên gia nghiệp vụ cài đặt logic nghiệp vụ ở mức thấp. Có hai lý do nên thúc đẩy bạn hướng tới việc phát triển một DSL:

- **Giao tiếp là vua.** Code của bạn phải truyền đạt rõ ràng ý định của nó và dễ hiểu ngay cả với người không phải lập trình viên. Nhờ đó, người này có thể góp phần xác nhận xem code có khớp với các yêu cầu nghiệp vụ hay không.
- **Code được viết một lần nhưng được đọc rất nhiều lần.** Tính dễ đọc là sống còn với tính dễ bảo trì. Nói cách khác, bạn luôn nên viết code theo cách khiến đồng nghiệp cảm ơn bạn thay vì ghét bạn!

Một DSL được thiết kế tốt mang lại nhiều lợi ích. Tuy vậy, việc phát triển và sử dụng một DSL riêng có cả ưu điểm lẫn nhược điểm. Ở mục 10.1.1, chúng ta sẽ khảo sát kỹ hơn những ưu và nhược điểm này để bạn có thể quyết định khi nào một DSL là phù hợp (hoặc không phù hợp) với một tình huống cụ thể.

### 10.1.1. Ưu và nhược điểm của DSL

DSL, cũng như những công nghệ và giải pháp khác trong phát triển phần mềm, không phải là "viên đạn bạc". Việc dùng một DSL để làm việc với lĩnh vực của bạn vừa có thể là một tài sản, vừa có thể là một gánh nặng. Một DSL có thể là tài sản vì nó nâng mức trừu tượng lên, giúp bạn làm rõ ý định nghiệp vụ của code và khiến code dễ đọc hơn. Nhưng nó cũng có thể là gánh nặng vì bản thân phần cài đặt của DSL cũng là code, cần được kiểm thử và bảo trì. Vì lý do đó, sẽ hữu ích khi khảo sát cả lợi ích lẫn chi phí của DSL để bạn có thể đánh giá liệu việc thêm một DSL vào dự án có mang lại lợi tức đầu tư dương hay không.

DSL mang lại những lợi ích sau:

- **Sự cô đọng (Conciseness)** — Một API đóng gói logic nghiệp vụ một cách thuận tiện cho phép bạn tránh lặp lại, dẫn tới code ít dài dòng hơn.
- **Tính dễ đọc (Readability)** — Việc dùng những từ thuộc về từ vựng của lĩnh vực khiến code trở nên dễ hiểu ngay cả với những người không phải chuyên gia lĩnh vực. Nhờ đó, code và tri thức nghiệp vụ có thể được chia sẻ tới nhiều thành viên hơn trong tổ chức.
- **Tính dễ bảo trì (Maintainability)** — Code viết dựa trên một DSL được thiết kế tốt sẽ dễ bảo trì và dễ sửa đổi hơn. Tính dễ bảo trì đặc biệt quan trọng với code liên quan tới nghiệp vụ, vốn là phần của ứng dụng có thể thay đổi thường xuyên nhất.
- **Mức trừu tượng cao hơn (Higher level of abstraction)** — Các thao tác có sẵn trong một DSL hoạt động ở cùng mức trừu tượng với lĩnh vực, nhờ đó che giấu những chi tiết không liên quan chặt chẽ tới các bài toán của lĩnh vực đó.
- **Sự tập trung (Focus)** — Việc có một ngôn ngữ được thiết kế với mục đích duy nhất là diễn đạt các quy tắc của lĩnh vực nghiệp vụ giúp lập trình viên tập trung vào đúng phần code đó. Kết quả là năng suất tăng lên.
- **Phân tách mối quan tâm (Separation of concerns)** — Diễn đạt logic nghiệp vụ bằng một ngôn ngữ chuyên biệt khiến việc giữ code liên quan tới nghiệp vụ tách biệt khỏi phần hạ tầng của ứng dụng trở nên dễ dàng hơn. Kết quả là code dễ bảo trì hơn.

Ngược lại, việc đưa một DSL vào code base cũng có thể có vài nhược điểm:

- **Khó khăn khi thiết kế DSL** — Rất khó để gói trọn tri thức lĩnh vực vào một ngôn ngữ cô đọng và bị giới hạn.
- **Chi phí phát triển** — Thêm một DSL vào code base là một khoản đầu tư dài hạn với chi phí ban đầu cao, điều này có thể làm chậm dự án của bạn trong những giai đoạn đầu. Thêm nữa, việc bảo trì và tiến hoá DSL cũng tạo thêm overhead kỹ thuật.
- **Thêm một lớp gián tiếp** — Một DSL bọc mô hình lĩnh vực của bạn trong một lớp bổ sung, và lớp này phải mỏng nhất có thể để tránh gây ra các vấn đề về hiệu năng.
- **Thêm một ngôn ngữ phải học** — Ngày nay, các lập trình viên đã quen với việc dùng nhiều ngôn ngữ. Tuy nhiên, việc thêm một DSL vào dự án ngầm định rằng bạn và đội của bạn có thêm một ngôn ngữ nữa phải học. Tệ hơn, nếu bạn quyết định có nhiều DSL bao phủ các mảng khác nhau của lĩnh vực nghiệp vụ, việc kết hợp chúng một cách liền mạch có thể rất khó, bởi các DSL có xu hướng tiến hoá độc lập với nhau.
- **Giới hạn của ngôn ngữ chủ (Hosting-language limitations)** — Một số ngôn ngữ lập trình đa dụng (Java là một trong số đó) nổi tiếng là dài dòng và có cú pháp cứng nhắc. Những ngôn ngữ này khiến việc thiết kế một DSL thân thiện với người dùng trở nên khó khăn. Thực tế, các DSL được phát triển trên nền một ngôn ngữ lập trình dài dòng sẽ bị ràng buộc bởi cú pháp cồng kềnh đó và có thể không dễ đọc. Việc giới thiệu lambda expression trong Java 8 mang lại một công cụ mới mạnh mẽ để giảm nhẹ vấn đề này.

Với những danh sách lập luận tích cực và tiêu cực này, việc quyết định có nên phát triển một DSL cho dự án của bạn hay không là không hề dễ dàng. Hơn nữa, bạn còn có những lựa chọn khác ngoài Java để cài đặt DSL của riêng mình. Trước khi khảo sát những pattern và chiến lược mà bạn có thể dùng để phát triển một DSL dễ đọc và dễ dùng trong Java 8 trở đi, chúng ta sẽ nhanh chóng tìm hiểu các lựa chọn thay thế này và mô tả những tình huống mà chúng có thể là giải pháp phù hợp.

### 10.1.2. Các giải pháp DSL khác nhau có sẵn trên JVM

Trong mục này, bạn sẽ tìm hiểu các phân loại DSL. Bạn cũng sẽ thấy rằng ngoài Java, bạn còn nhiều lựa chọn khác để cài đặt DSL. Ở các mục sau, chúng ta sẽ tập trung vào cách cài đặt DSL bằng các tính năng của Java.

Cách phân loại DSL phổ biến nhất, do Martin Fowler giới thiệu, là phân biệt giữa internal DSL và external DSL. Internal DSL (còn được gọi là embedded DSL — DSL nhúng) được cài đặt trên nền ngôn ngữ chủ hiện có (có thể là code Java thuần), trong khi external DSL được gọi là "độc lập" (stand-alone) bởi chúng được phát triển từ đầu với một cú pháp không phụ thuộc vào ngôn ngữ chủ.

Hơn nữa, JVM còn cho bạn một khả năng thứ ba nằm giữa internal DSL và external DSL: dùng một ngôn ngữ lập trình đa dụng khác cũng chạy trên JVM nhưng linh hoạt và biểu cảm hơn Java, chẳng hạn như Scala hay Groovy. Chúng tôi gọi lựa chọn thứ ba này là polyglot DSL.

Trong các mục tiếp theo, chúng ta sẽ lần lượt xem xét ba loại DSL này.

#### Internal DSL

Vì cuốn sách này nói về Java, khi chúng ta nói tới internal DSL thì rõ ràng ý là một DSL được viết bằng Java. Trong lịch sử, Java không được xem là một ngôn ngữ thân thiện với DSL bởi cú pháp cồng kềnh, thiếu linh hoạt của nó khiến việc tạo ra một DSL dễ đọc, cô đọng và giàu tính biểu cảm trở nên khó khăn. Vấn đề này phần lớn đã được giảm nhẹ nhờ sự ra đời của lambda expression. Như bạn đã thấy ở chương 3, lambda rất hữu ích cho việc sử dụng behavior parameterization (tham số hoá hành vi) một cách cô đọng. Thực tế, việc dùng lambda rộng rãi cho ra một DSL với tỉ lệ tín hiệu/nhiễu dễ chấp nhận hơn nhờ giảm bớt sự dài dòng mà bạn gặp phải với anonymous inner class. Để minh hoạ tỉ lệ tín hiệu/nhiễu, hãy thử in một danh sách các `String` với cú pháp Java 7, nhưng dùng phương thức `forEach` mới của Java 8:

```java
List<String> numbers = Arrays.asList("one", "two", "three");
numbers.forEach(new Consumer<String>() {
    @Override
    public void accept(String s) {
        System.out.println(s);
    }
});
```

Trong đoạn code này, phần được in đậm chính là phần mang tín hiệu của code. Toàn bộ phần còn lại là nhiễu cú pháp, không mang lại lợi ích gì thêm, và (thậm chí còn tốt hơn) không còn cần thiết trong Java 8. Anonymous inner class có thể được thay bằng một lambda expression:

```java
numbers.forEach(s -> System.out.println(s));
```

hoặc thậm chí cô đọng hơn nữa bằng một method reference:

```java
numbers.forEach(System.out::println);
```

Bạn có thể hài lòng khi xây dựng DSL của mình bằng Java nếu bạn mong đợi người dùng có phần nào đó thiên về kỹ thuật. Nếu cú pháp Java không phải vấn đề, việc chọn phát triển DSL bằng Java thuần có nhiều lợi thế:

- Công sức để học các pattern và kỹ thuật cần thiết nhằm cài đặt một DSL Java tốt là khiêm tốn so với công sức cần bỏ ra để học một ngôn ngữ lập trình mới cùng những công cụ thường dùng để phát triển một external DSL.
- DSL của bạn được viết bằng Java thuần nên nó được biên dịch cùng với phần code còn lại. Không có chi phí build phát sinh do phải tích hợp trình biên dịch của ngôn ngữ thứ hai hay công cụ dùng để sinh ra external DSL.
- Đội phát triển của bạn không cần làm quen với một ngôn ngữ khác hay với một công cụ bên ngoài có thể xa lạ và phức tạp.
- Người dùng DSL của bạn sẽ có đầy đủ các tính năng thường được cung cấp bởi IDE Java yêu thích, chẳng hạn như tự động hoàn thành code và các tiện ích refactoring. Các IDE hiện đại đang cải thiện hỗ trợ cho những ngôn ngữ JVM phổ biến khác, nhưng vẫn chưa có được mức hỗ trợ tương đương với những gì chúng dành cho lập trình viên Java.
- Nếu bạn cần cài đặt nhiều hơn một DSL để bao phủ các phần khác nhau của lĩnh vực hoặc nhiều lĩnh vực khác nhau, bạn sẽ không gặp vấn đề gì khi kết hợp chúng nếu chúng được viết bằng Java thuần.

Một khả năng khác là kết hợp các DSL cùng dùng chung bytecode Java bằng cách kết hợp các ngôn ngữ lập trình chạy trên JVM. Chúng tôi gọi những DSL này là polyglot và sẽ mô tả chúng trong mục tiếp theo.

#### Polyglot DSL

Ngày nay, có lẽ hơn 100 ngôn ngữ chạy trên JVM. Một số trong đó, như Scala và Groovy, khá phổ biến, và không khó để tìm được lập trình viên thành thạo chúng. Những ngôn ngữ khác, bao gồm JRuby và Jython, là các bản chuyển đổi của những ngôn ngữ lập trình nổi tiếng khác sang JVM. Cuối cùng, những ngôn ngữ mới nổi khác, như Kotlin và Ceylon, đang ngày càng được ưa chuộng chủ yếu vì chúng tuyên bố có những tính năng ngang tầm với Scala nhưng với độ phức tạp nội tại thấp hơn và đường cong học tập thoải mái hơn. Tất cả những ngôn ngữ này đều trẻ hơn Java và được thiết kế với cú pháp ít ràng buộc hơn, ít dài dòng hơn. Đặc điểm này rất quan trọng vì nó giúp cài đặt một DSL ít bị dài dòng cố hữu do ngôn ngữ lập trình mà nó được nhúng vào gây ra.

Riêng Scala có một số tính năng, chẳng hạn như currying và chuyển đổi ngầm (implicit conversion), rất tiện lợi khi phát triển DSL. Bạn sẽ có cái nhìn tổng quan về Scala và cách nó so sánh với Java ở chương 20. Hiện tại, chúng tôi muốn cho bạn cảm nhận về những gì bạn có thể làm với các tính năng này qua một ví dụ nhỏ.

Giả sử bạn muốn xây dựng một hàm tiện ích lặp lại việc thực thi một hàm khác, `f`, một số lần cho trước. Ở lần thử đầu tiên, bạn có thể đi tới phần cài đặt đệ quy sau đây trong Scala. (Đừng lo lắng về cú pháp; ý tưởng tổng thể mới là điều quan trọng.)

```scala
def times(i: Int, f: => Unit): Unit = {
  f                                // Thực thi hàm f.
  if (i > 1) times(i - 1, f)       // Nếu bộ đếm i còn dương, giảm nó đi và gọi đệ quy hàm times.
}
```

Lưu ý rằng trong Scala, việc gọi hàm này với giá trị `i` lớn sẽ không gây tràn stack như sẽ xảy ra trong Java, bởi vì Scala có tail call optimization, nghĩa là lời gọi đệ quy tới hàm `times` sẽ không được thêm vào stack. Bạn sẽ tìm hiểu thêm về chủ đề này ở chương 18 và 19. Bạn có thể dùng hàm này để thực thi lặp lại một hàm khác (một hàm in "Hello World" ba lần) như sau:

```scala
times(3, println("Hello World"))
```

Nếu bạn currying hàm `times`, tức là đặt các đối số của nó vào hai nhóm (chúng ta sẽ trình bày chi tiết về currying ở chương 19):

```scala
def times(i: Int)(f: => Unit): Unit = {
  f
  if (i > 1) times(i - 1)(f)
}
```

bạn có thể đạt được cùng kết quả bằng cách truyền hàm cần thực thi nhiều lần trong cặp dấu ngoặc nhọn:

```scala
times(3) {
  println("Hello World")
}
```

Cuối cùng, trong Scala bạn có thể định nghĩa một chuyển đổi ngầm từ `Int` sang một anonymous class chỉ có duy nhất một hàm, và hàm đó lại nhận đối số là hàm cần lặp lại. Một lần nữa, đừng bận tâm về cú pháp và chi tiết. Mục tiêu của ví dụ này là cho bạn ý niệm về những gì có thể làm được vượt ra ngoài Java.

```scala
// Định nghĩa một chuyển đổi ngầm từ Int sang một anonymous class
implicit def intToTimes(i: Int) = new {
    // Class này chỉ có một hàm times nhận một hàm f khác làm đối số.
    def times(f: => Unit): Unit = {
      // Một hàm times thứ hai nhận hai đối số và được định nghĩa trong phạm vi của hàm thứ nhất.
      def times(i: Int, f: => Unit): Unit = {
        f
        if (i > 1) times(i - 1, f)
      }
      times(i, f)   // Gọi hàm times bên trong
    }
}
```

Bằng cách này, người dùng DSL nhỏ nhúng trong Scala của bạn có thể thực thi một hàm in "Hello World" ba lần như sau:

```scala
3 times {
  println("Hello World")
}
```

Như bạn thấy, kết quả không có nhiễu cú pháp và dễ hiểu ngay cả với người không phải lập trình viên. Ở đây, con số 3 được trình biên dịch tự động chuyển đổi thành một thực thể của một class lưu con số đó trong trường `i` của nó. Sau đó hàm `times` được gọi bằng ký pháp không dấu chấm, nhận đối số là hàm cần lặp lại.

Việc đạt được kết quả tương tự trong Java là bất khả thi, nên lợi thế của việc dùng một ngôn ngữ thân thiện với DSL hơn là quá rõ ràng. Tuy nhiên, lựa chọn này cũng có một số bất tiện rõ rệt:

- Bạn phải học một ngôn ngữ lập trình mới hoặc phải có ai đó trong đội đã thành thạo nó. Bởi vì việc phát triển một DSL đẹp trong những ngôn ngữ này thường đòi hỏi dùng đến các tính năng tương đối nâng cao, nên kiến thức hời hợt về ngôn ngữ mới thường là không đủ.
- Bạn cần làm phức tạp thêm quy trình build một chút bằng cách tích hợp nhiều trình biên dịch để build mã nguồn viết bằng hai ngôn ngữ trở lên.
- Cuối cùng, mặc dù đa số các ngôn ngữ chạy trên JVM đều tuyên bố tương thích 100% với Java, nhưng việc khiến chúng vận hành liên thông với Java thường đòi hỏi những mẹo vụng về và những thoả hiệp. Đồng thời, sự liên thông này đôi khi gây tổn thất hiệu năng. Chẳng hạn, collection của Scala và của Java không tương thích với nhau, nên khi một collection Scala phải được truyền cho một hàm Java hoặc ngược lại, collection gốc phải được chuyển đổi sang một collection thuộc API gốc của ngôn ngữ đích.

#### External DSL

Lựa chọn thứ ba để thêm một DSL vào dự án của bạn là cài đặt một external DSL. Trong trường hợp này, bạn phải thiết kế một ngôn ngữ mới từ đầu, với cú pháp và ngữ nghĩa riêng của nó. Bạn cũng cần thiết lập một hạ tầng riêng biệt để phân tích ngôn ngữ mới, phân tích đầu ra của bộ parser, và sinh ra code để thực thi external DSL của bạn. Đây là một khối lượng công việc rất lớn! Các kỹ năng cần thiết để thực hiện những nhiệm vụ này không phổ biến và cũng không dễ có được. Nếu bạn vẫn muốn đi theo con đường này, ANTLR là một trình sinh parser thường được dùng để hỗ trợ và nó đi rất ăn ý với Java.

Hơn nữa, ngay cả việc thiết kế một ngôn ngữ lập trình nhất quán từ đầu cũng không phải chuyện đơn giản. Một vấn đề phổ biến khác là external DSL rất dễ phát triển vượt tầm kiểm soát và bao phủ những mảng, những mục đích mà nó vốn không được thiết kế cho.

Lợi thế lớn nhất khi phát triển một external DSL là mức độ linh hoạt gần như vô hạn mà nó mang lại. Bạn có thể thiết kế một ngôn ngữ khớp hoàn hảo với nhu cầu và đặc thù của lĩnh vực của mình. Nếu làm tốt, kết quả sẽ là một ngôn ngữ cực kỳ dễ đọc, được thiết kế riêng để mô tả và giải quyết các bài toán của nghiệp vụ. Kết quả tích cực khác là sự phân tách rõ ràng giữa code hạ tầng được phát triển bằng Java và code nghiệp vụ được viết bằng external DSL. Tuy nhiên, sự phân tách này là con dao hai lưỡi, bởi nó cũng tạo ra một lớp nhân tạo giữa DSL và ngôn ngữ chủ.

Trong phần còn lại của chương này, bạn sẽ tìm hiểu các pattern và kỹ thuật có thể giúp bạn phát triển những internal DSL hiệu quả dựa trên Java hiện đại. Bạn bắt đầu bằng việc khảo sát cách những ý tưởng này đã được dùng trong thiết kế của API Java gốc, đặc biệt là những bổ sung API trong Java 8 trở đi.

## 10.2. Các DSL nhỏ trong API Java hiện đại

Những API đầu tiên tận dụng các khả năng hàm mới của Java lại chính là các API Java gốc. Trước Java 8, API Java gốc đã có một vài interface với duy nhất một phương thức trừu tượng, nhưng như bạn đã thấy ở mục 10.1, việc dùng chúng đòi hỏi cài đặt một anonymous inner class với cú pháp cồng kềnh. Việc bổ sung lambda và (có lẽ còn quan trọng hơn nữa từ góc nhìn DSL) method reference đã thay đổi luật chơi, khiến functional interface trở thành nền tảng của thiết kế API Java.

Interface `Comparator` trong Java 8 đã được cập nhật với các phương thức mới. Bạn sẽ học ở chương 13 rằng một interface có thể chứa cả static method lẫn default method. Hiện tại, interface `Comparator` là một ví dụ tốt cho thấy lambda cải thiện khả năng tái sử dụng và khả năng kết hợp của các phương thức trong API Java gốc như thế nào.

Giả sử bạn có một danh sách các đối tượng biểu diễn con người (`Person`), và bạn muốn sắp xếp các đối tượng này theo tuổi. Trước khi có lambda, bạn phải cài đặt interface `Comparator` bằng một inner class:

```java
Collections.sort(persons, new Comparator<Person>() {
    public int compare(Person p1, Person p2) {
        return p1.getAge() - p2.getAge();
    }
});
```

Như bạn đã thấy trong nhiều ví dụ khác trong cuốn sách này, giờ đây bạn có thể thay inner class bằng một lambda expression gọn gàng hơn:

```java
Collections.sort(people, (p1, p2) -> p1.getAge() - p2.getAge());
```

Kỹ thuật này làm tăng đáng kể tỉ lệ tín hiệu/nhiễu của code. Tuy nhiên, Java cũng có một tập hợp các static utility method cho phép bạn tạo các đối tượng `Comparator` theo cách dễ đọc hơn. Các static method này nằm trong interface `Comparator`. Bằng cách import tĩnh phương thức `Comparator.comparing`, bạn có thể viết lại ví dụ sắp xếp ở trên như sau:

```java
Collections.sort(persons, comparing(p -> p.getAge()));
```

Thậm chí tốt hơn, bạn có thể thay lambda bằng một method reference:

```java
Collections.sort(persons, comparing(Person::getAge));
```

Lợi ích của cách tiếp cận này còn có thể được đẩy đi xa hơn nữa. Nếu bạn muốn sắp xếp mọi người theo tuổi nhưng theo thứ tự ngược lại, bạn có thể tận dụng phương thức thực thể `reversed` (cũng được thêm vào Java 8):

```java
Collections.sort(persons, comparing(Person::getAge).reversed());
```

Hơn nữa, nếu bạn muốn những người cùng tuổi được sắp xếp theo thứ tự chữ cái, bạn có thể kết hợp `Comparator` đó với một `Comparator` thực hiện so sánh trên tên:

```java
Collections.sort(persons, comparing(Person::getAge)
                              .thenComparing(Person::getName));
```

Cuối cùng, bạn có thể dùng phương thức `sort` mới được thêm vào interface `List` để gọn gàng hơn nữa:

```java
persons.sort(comparing(Person::getAge)
                 .thenComparing(Person::getName));
```

API nhỏ này chính là một DSL tối giản cho lĩnh vực sắp xếp collection. Bất chấp phạm vi hạn chế, DSL này đã cho bạn thấy việc sử dụng lambda và method reference một cách hợp lý có thể cải thiện tính dễ đọc, khả năng tái sử dụng và khả năng kết hợp của code như thế nào.

Trong mục tiếp theo, chúng ta sẽ khảo sát một class Java 8 phong phú hơn và được dùng rộng rãi hơn, nơi sự cải thiện về tính dễ đọc còn rõ ràng hơn nữa: Stream API.

### 10.2.1. Stream API nhìn như một DSL để thao tác với collection

Interface `Stream` là một ví dụ tuyệt vời về một internal DSL nhỏ được đưa vào API Java gốc. Thực tế, một `Stream` có thể được xem như một DSL gọn nhẹ nhưng mạnh mẽ dùng để lọc, sắp xếp, biến đổi, nhóm và thao tác với các phần tử của một collection. Giả sử bạn được yêu cầu đọc một file log và thu thập 40 dòng đầu tiên bắt đầu bằng từ "ERROR" vào một `List<String>`. Bạn có thể thực hiện nhiệm vụ này theo phong cách mệnh lệnh, như trong listing sau.

**Listing 10.1. Đọc các dòng lỗi trong một file log theo phong cách mệnh lệnh**

```java
List<String> errors = new ArrayList<>();
int errorCount = 0;
BufferedReader bufferedReader
    = new BufferedReader(new FileReader(fileName));
String line = bufferedReader.readLine();
while (errorCount < 40 && line != null) {
    if (line.startsWith("ERROR")) {
        errors.add(line);
        errorCount++;
    }
    line = bufferedReader.readLine();
}
```

Ở đây, chúng tôi đã lược bỏ phần xử lý lỗi của code cho ngắn gọn. Dù vậy, đoạn code này vẫn quá dài dòng, và ý định của nó không hiện ra ngay lập tức. Một khía cạnh khác gây tổn hại cho cả tính dễ đọc lẫn tính dễ bảo trì là sự thiếu vắng một sự phân tách mối quan tâm rõ ràng. Thực tế, code cùng chịu một trách nhiệm lại bị rải rác qua nhiều câu lệnh. Chẳng hạn, code dùng để đọc file theo từng dòng nằm ở ba chỗ:

- Nơi `FileReader` được tạo ra
- Điều kiện thứ hai của vòng lặp `while`, kiểm tra xem file đã kết thúc hay chưa
- Cuối vòng lặp `while`, nơi đọc dòng tiếp theo trong file

Tương tự, code giới hạn số dòng thu thập vào danh sách ở 40 kết quả đầu tiên bị rải rác qua ba câu lệnh:

- Câu lệnh khởi tạo biến `errorCount`
- Điều kiện thứ nhất của vòng lặp `while`
- Câu lệnh tăng bộ đếm khi tìm thấy một dòng bắt đầu bằng "ERROR" trong log

Đạt được cùng kết quả theo phong cách hàm hơn thông qua interface `Stream` sẽ dễ dàng hơn nhiều và cho ra code cô đọng hơn hẳn, như trong listing 10.2.

**Listing 10.2. Đọc các dòng lỗi trong một file log theo phong cách hàm**

```java
List<String> errors
    // Mở file và tạo một Stream các String, mỗi String tương ứng với một dòng trong file.
    = Files.lines(Paths.get(fileName))
           .filter(line -> line.startsWith("ERROR"))  // Lọc các dòng bắt đầu bằng "ERROR".
           .limit(40)                                 // Giới hạn kết quả ở 40 dòng đầu tiên.
           .collect(toList());                        // Thu thập các String kết quả vào một List.
```

`Files.lines` là một static utility method trả về một `Stream<String>`, trong đó mỗi `String` biểu diễn một dòng trong file cần phân tích. Phần code đó là phần duy nhất phải đọc file theo từng dòng. Tương tự như vậy, câu lệnh `limit(40)` là đủ để giới hạn số dòng lỗi được thu thập ở 40 dòng đầu tiên. Bạn có thể tưởng tượng ra thứ gì dễ đọc hơn thế không?

Phong cách fluent của Stream API là một khía cạnh thú vị khác, điển hình cho một DSL được thiết kế tốt. Mọi intermediate operation đều lazy và trả về một `Stream` khác, cho phép một chuỗi các thao tác được nối thành pipeline. Terminal operation thì eager (háo hức) và kích hoạt việc tính toán kết quả của toàn bộ pipeline.

Đã đến lúc khảo sát API của một DSL nhỏ khác được thiết kế để dùng kết hợp với phương thức `collect` của interface `Stream`: API `Collectors`.

### 10.2.2. Collector như một DSL để tổng hợp dữ liệu

Bạn đã thấy rằng interface `Stream` có thể được xem như một DSL thao tác với các danh sách dữ liệu. Tương tự, interface `Collector` có thể được xem như một DSL thực hiện việc tổng hợp trên dữ liệu. Ở chương 6, chúng ta đã khảo sát interface `Collector` và giải thích cách dùng nó để thu thập, nhóm và phân hoạch các phần tử trong một `Stream`. Chúng ta cũng đã tìm hiểu các static factory method do class `Collectors` cung cấp nhằm tạo ra thuận tiện các biến thể khác nhau của đối tượng `Collector` và kết hợp chúng. Đã đến lúc xem lại những phương thức này được thiết kế như thế nào từ góc nhìn DSL. Cụ thể, cũng như các phương thức trong interface `Comparator` có thể được kết hợp để hỗ trợ sắp xếp theo nhiều trường, các `Collector` cũng có thể được kết hợp để đạt được việc nhóm nhiều tầng. Chẳng hạn bạn có thể nhóm một danh sách xe hơi trước hết theo hãng rồi theo màu như sau:

```java
Map<String, Map<Color, List<Car>>> carsByBrandAndColor =
        cars.stream().collect(groupingBy(Car::getBrand,
                                         groupingBy(Car::getColor)));
```

Bạn nhận thấy điều gì ở đây khi so sánh với những gì bạn đã làm để nối hai `Comparator`? Bạn định nghĩa `Comparator` nhiều trường bằng cách kết hợp hai `Comparator` theo phong cách fluent:

```java
Comparator<Person> comparator =
        comparing(Person::getAge).thenComparing(Person::getName);
```

trong khi API `Collectors` lại cho phép bạn tạo một `Collector` nhiều tầng bằng cách lồng các `Collector` vào nhau:

```java
Collector<? super Car, ?, Map<Brand, Map<Color, List<Car>>>>
    carGroupingCollector =
        groupingBy(Car::getBrand, groupingBy(Car::getColor));
```

Thông thường, phong cách fluent được coi là dễ đọc hơn phong cách lồng nhau, đặc biệt khi việc kết hợp có từ ba thành phần trở lên. Sự khác biệt về phong cách này có phải chỉ là chuyện lạ không? Thực tế, nó phản ánh một lựa chọn thiết kế có chủ ý, xuất phát từ việc `Collector` ở trong cùng phải được định trị trước, nhưng về mặt logic thì nó lại là phép nhóm cuối cùng được thực hiện. Trong trường hợp này, việc lồng các lời tạo `Collector` bằng nhiều static method thay vì nối chúng theo phong cách fluent cho phép phép nhóm trong cùng được định trị trước nhưng lại khiến nó trông như là phép nhóm cuối cùng trong code.

Sẽ dễ dàng hơn (ngoại trừ việc sử dụng generic trong các định nghĩa) nếu cài đặt một `GroupingBuilder` uỷ nhiệm cho factory method `groupingBy` nhưng cho phép nhiều thao tác nhóm được kết hợp theo phong cách fluent. Listing tiếp theo cho thấy cách làm.

**Listing 10.3. Một builder fluent cho các grouping collector**

```java
import static java.util.stream.Collectors.groupingBy;

public class GroupingBuilder<T, D, K> {
    private final Collector<? super T, ?, Map<K, D>> collector;

    private GroupingBuilder(Collector<? super T, ?, Map<K, D>> collector) {
        this.collector = collector;
    }

    public Collector<? super T, ?, Map<K, D>> get() {
        return collector;
    }

    public <J> GroupingBuilder<T, Map<K, D>, J>
            after(Function<? super T, ? extends J> classifier) {
        return new GroupingBuilder<>(groupingBy(classifier, collector));
    }

    public static <T, D, K> GroupingBuilder<T, List<T>, K>
            groupOn(Function<? super T, ? extends K> classifier) {
        return new GroupingBuilder<>(groupingBy(classifier));
    }
}
```

Vấn đề với builder fluent này là gì? Thử dùng nó là thấy ngay vấn đề:

```java
Collector<? super Car, ?, Map<Brand, Map<Color, List<Car>>>>
    carGroupingCollector =
        groupOn(Car::getColor).after(Car::getBrand).get()
```

Như bạn thấy, việc dùng utility class này phản trực giác bởi vì các hàm nhóm phải được viết theo thứ tự ngược lại so với tầng nhóm lồng nhau tương ứng. Nếu bạn thử refactor builder fluent này để sửa vấn đề thứ tự, bạn sẽ nhận ra rằng đáng tiếc là hệ thống kiểu của Java không cho phép bạn làm điều đó.

Bằng cách xem xét kỹ hơn API Java gốc và những lý do đằng sau các quyết định thiết kế của nó, bạn đã bắt đầu học được một vài pattern và mẹo hữu ích để cài đặt các DSL dễ đọc. Ở mục tiếp theo, bạn sẽ tiếp tục khảo sát các kỹ thuật để phát triển những DSL hiệu quả.

## 10.3. Các pattern và kỹ thuật tạo DSL trong Java

Một DSL cung cấp một API thân thiện, dễ đọc để làm việc với một mô hình lĩnh vực cụ thể. Vì lý do đó, chúng ta bắt đầu mục này bằng việc định nghĩa một mô hình lĩnh vực đơn giản; sau đó chúng ta sẽ thảo luận các pattern có thể dùng để tạo một DSL trên nền mô hình đó.

Mô hình lĩnh vực mẫu gồm ba thành phần. Thành phần đầu tiên là những Java bean thuần mô hình hoá một mã cổ phiếu được niêm yết trên một thị trường cho trước:

```java
public class Stock {

    private String symbol;
    private String market;

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }
}
```

Thành phần thứ hai là một giao dịch (trade) để mua hoặc bán một số lượng cổ phiếu nhất định ở một mức giá nhất định:

```java
public class Trade {

    public enum Type { BUY, SELL }
    private Type type;

    private Stock stock;
    private int quantity;
    private double price;

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public double getValue() {
        return quantity * price;
    }
}
```

Thành phần cuối cùng là một lệnh (order) do khách hàng đặt để thực hiện một hoặc nhiều giao dịch:

```java
public class Order {

    private String customer;
    private List<Trade> trades = new ArrayList<>();

    public void addTrade(Trade trade) {
        trades.add(trade);
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
    }

    public double getValue() {
        return trades.stream().mapToDouble(Trade::getValue).sum();
    }
}
```

Mô hình lĩnh vực này khá đơn giản. Tuy nhiên, việc tạo ra các đối tượng biểu diễn lệnh lại rất cồng kềnh. Hãy thử định nghĩa một lệnh đơn giản chứa hai giao dịch cho khách hàng BigBank của bạn, như trong listing 10.4.

**Listing 10.4. Tạo một lệnh giao dịch cổ phiếu bằng cách dùng trực tiếp API của các đối tượng lĩnh vực**

```java
Order order = new Order();
order.setCustomer("BigBank");

Trade trade1 = new Trade();
trade1.setType(Trade.Type.BUY);

Stock stock1 = new Stock();
stock1.setSymbol("IBM");
stock1.setMarket("NYSE");

trade1.setStock(stock1);
trade1.setPrice(125.00);
trade1.setQuantity(80);
order.addTrade(trade1);

Trade trade2 = new Trade();
trade2.setType(Trade.Type.BUY);

Stock stock2 = new Stock();
stock2.setSymbol("GOOGLE");
stock2.setMarket("NASDAQ");

trade2.setStock(stock2);
trade2.setPrice(375.00);
trade2.setQuantity(50);
order.addTrade(trade2);
```

Sự dài dòng của đoạn code này khó có thể chấp nhận được; bạn không thể mong đợi một chuyên gia lĩnh vực không phải lập trình viên hiểu và xác nhận nó ngay từ cái nhìn đầu tiên. Cái bạn cần là một DSL phản ánh được mô hình lĩnh vực và cho phép thao tác với nó theo cách trực tiếp, trực giác hơn. Bạn có thể áp dụng nhiều cách tiếp cận khác nhau để đạt được kết quả này. Trong phần còn lại của mục này, bạn sẽ tìm hiểu ưu và nhược điểm của các cách tiếp cận đó.

### 10.3.1. Method chaining

Phong cách DSL đầu tiên cần khảo sát là một trong những phong cách phổ biến nhất. Nó cho phép bạn định nghĩa một lệnh giao dịch bằng một chuỗi duy nhất các lời gọi phương thức. Listing sau đây cho thấy một ví dụ của loại DSL này.

**Listing 10.5. Tạo một lệnh giao dịch cổ phiếu bằng method chaining**

```java
Order order = forCustomer("BigBank")
                  .buy(80)
                  .stock("IBM")
                      .on("NYSE")
                  .at(125.00)
                  .sell(50)
                  .stock("GOOGLE")
                      .on("NASDAQ")
                  .at(375.00)
                  .end();
```

Đoạn code này trông như một cải tiến lớn, phải không? Rất có khả năng chuyên gia lĩnh vực của bạn sẽ hiểu đoạn code này mà không tốn chút công sức nào. Nhưng làm sao bạn cài đặt được một DSL để đạt kết quả này? Bạn cần một vài builder tạo ra các đối tượng của lĩnh vực này thông qua một fluent API. Builder ở tầng cao nhất tạo ra và bọc một `Order`, cho phép thêm một hoặc nhiều `Trade` vào đó, như trong listing tiếp theo.

**Listing 10.6. Một order builder cung cấp DSL theo kiểu method chaining**

```java
public class MethodChainingOrderBuilder {

    public final Order order = new Order();   // Order được bọc bởi builder này

    private MethodChainingOrderBuilder(String customer) {
        order.setCustomer(customer);
    }

    // Một static factory method để tạo builder cho một order do một khách hàng cho trước đặt
    public static MethodChainingOrderBuilder forCustomer(String customer) {
        return new MethodChainingOrderBuilder(customer);
    }

    // Tạo một TradeBuilder để xây dựng một trade mua cổ phiếu
    public TradeBuilder buy(int quantity) {
        return new TradeBuilder(this, Trade.Type.BUY, quantity);
    }

    // Tạo một TradeBuilder để xây dựng một trade bán cổ phiếu
    public TradeBuilder sell(int quantity) {
        return new TradeBuilder(this, Trade.Type.SELL, quantity);
    }

    public MethodChainingOrderBuilder addTrade(Trade trade) {
        order.addTrade(trade);   // Thêm một trade vào order
        // Trả về chính order builder, cho phép bạn tạo và thêm các trade tiếp theo một cách fluent
        return this;
    }

    // Kết thúc việc xây dựng order và trả về nó
    public Order end() {
        return order;
    }
}
```

Các phương thức `buy()` và `sell()` của order builder tạo ra và trả về một builder khác, builder này xây dựng một trade và thêm nó vào chính order:

```java
public class TradeBuilder {
    private final MethodChainingOrderBuilder builder;
    public final Trade trade = new Trade();

    private TradeBuilder(MethodChainingOrderBuilder builder,
                         Trade.Type type, int quantity) {
        this.builder = builder;
        trade.setType(type);
        trade.setQuantity(quantity);
    }

    public StockBuilder stock(String symbol) {
        return new StockBuilder(builder, trade, symbol);
    }
}
```

Phương thức public duy nhất của `TradeBuilder` được dùng để tạo ra một builder nữa, và builder này lại xây dựng một thực thể của class `Stock`:

```java
public class StockBuilder {
    private final MethodChainingOrderBuilder builder;
    private final Trade trade;
    private final Stock stock = new Stock();

    private StockBuilder(MethodChainingOrderBuilder builder,
                         Trade trade, String symbol) {
        this.builder = builder;
        this.trade = trade;
        stock.setSymbol(symbol);
    }

    public TradeBuilderWithStock on(String market) {
        stock.setMarket(market);
        trade.setStock(stock);
        return new TradeBuilderWithStock(builder, trade);
    }
}
```

`StockBuilder` có duy nhất một phương thức, `on()`, dùng để chỉ định thị trường cho cổ phiếu, thêm cổ phiếu vào trade, và trả về builder cuối cùng:

```java
public class TradeBuilderWithStock {
    private final MethodChainingOrderBuilder builder;
    private final Trade trade;

    public TradeBuilderWithStock(MethodChainingOrderBuilder builder,
                                 Trade trade) {
        this.builder = builder;
        this.trade = trade;
    }

    public MethodChainingOrderBuilder at(double price) {
        trade.setPrice(price);
        return builder.addTrade(trade);
    }
}
```

Phương thức public duy nhất này của `TradeBuilderWithStock` thiết lập đơn giá của cổ phiếu được giao dịch và trả về order builder ban đầu. Như bạn đã thấy, phương thức này cho phép bạn thêm các trade khác vào order một cách fluent cho tới khi phương thức `end` của `MethodChainingOrderBuilder` được gọi. Việc chọn có nhiều class builder — và cụ thể là hai trade builder khác nhau — được thực hiện nhằm buộc người dùng DSL này gọi các phương thức của fluent API theo một trình tự định trước, đảm bảo rằng một trade đã được cấu hình đúng trước khi người dùng bắt đầu tạo trade tiếp theo. Lợi thế khác của cách tiếp cận này là các tham số dùng để thiết lập một order đều nằm trong phạm vi của builder. Cách tiếp cận này giảm thiểu việc dùng static method và cho phép tên các phương thức đóng vai trò như đối số có tên, nhờ đó cải thiện hơn nữa tính dễ đọc của phong cách DSL này. Cuối cùng, DSL fluent thu được từ kỹ thuật này có mức nhiễu cú pháp thấp nhất có thể.

Đáng tiếc, vấn đề chính của method chaining là sự dài dòng cần có để cài đặt các builder. Cần rất nhiều code "keo dán" (glue code) để nối các builder tầng cao với các builder tầng thấp hơn. Một nhược điểm rõ ràng khác là bạn không có cách nào để bắt buộc quy ước thụt lề mà bạn đã dùng để nhấn mạnh cấu trúc phân cấp lồng nhau của các đối tượng trong lĩnh vực của mình.

Ở mục tiếp theo, bạn sẽ khảo sát một pattern DSL thứ hai với những đặc điểm khá khác biệt.

### 10.3.2. Dùng hàm lồng nhau (nested functions)

Pattern DSL nested function lấy tên từ việc nó điền dữ liệu vào mô hình lĩnh vực bằng cách dùng các hàm lồng bên trong các hàm khác. Listing sau minh hoạ phong cách DSL thu được từ cách tiếp cận này.

**Listing 10.7. Tạo một lệnh giao dịch cổ phiếu với hàm lồng nhau**

```java
Order order = order("BigBank",
                    buy(80,
                        stock("IBM", on("NYSE")),
                        at(125.00)),
                    sell(50,
                         stock("GOOGLE", on("NASDAQ")),
                         at(375.00))
                   );
```

Code cần thiết để cài đặt phong cách DSL này gọn gàng hơn nhiều so với những gì bạn đã học ở mục 10.3.1.

`NestedFunctionOrderBuilder` trong listing sau cho thấy hoàn toàn có thể cung cấp cho người dùng một API theo phong cách DSL này. (Trong listing này, chúng tôi ngầm giả định rằng tất cả các static method của nó đều đã được import.)

**Listing 10.8. Một order builder cung cấp DSL theo kiểu nested function**

```java
public class NestedFunctionOrderBuilder {

    // Tạo một order cho một khách hàng cho trước
    public static Order order(String customer, Trade... trades) {
        Order order = new Order();
        order.setCustomer(customer);
        Stream.of(trades).forEach(order::addTrade);   // Thêm tất cả các trade vào order
        return order;
    }

    // Tạo một trade để mua cổ phiếu
    public static Trade buy(int quantity, Stock stock, double price) {
        return buildTrade(quantity, stock, price, Trade.Type.BUY);
    }

    // Tạo một trade để bán cổ phiếu
    public static Trade sell(int quantity, Stock stock, double price) {
        return buildTrade(quantity, stock, price, Trade.Type.SELL);
    }

    private static Trade buildTrade(int quantity, Stock stock, double price,
                                    Trade.Type buy) {
        Trade trade = new Trade();
        trade.setQuantity(quantity);
        trade.setType(buy);
        trade.setStock(stock);
        trade.setPrice(price);
        return trade;
    }

    // Một phương thức giả (dummy) để định nghĩa đơn giá của cổ phiếu được giao dịch
    public static double at(double price) {
        return price;
    }

    // Tạo cổ phiếu được giao dịch
    public static Stock stock(String symbol, String market) {
        Stock stock = new Stock();
        stock.setSymbol(symbol);
        stock.setMarket(market);
        return stock;
    }

    // Một phương thức giả (dummy) để định nghĩa thị trường nơi cổ phiếu được giao dịch
    public static String on(String market) {
        return market;
    }
}
```

Lợi thế khác của kỹ thuật này so với method chaining là cấu trúc phân cấp của các đối tượng lĩnh vực (một order chứa một hoặc nhiều trade, và mỗi trade tham chiếu tới một cổ phiếu duy nhất trong ví dụ này) được nhìn thấy rõ qua cách các hàm được lồng vào nhau.

Đáng tiếc, pattern này cũng có một số vấn đề. Có thể bạn đã nhận ra rằng DSL thu được đòi hỏi rất nhiều dấu ngoặc đơn. Hơn nữa, danh sách các đối số phải truyền cho các static method bị định sẵn một cách cứng nhắc. Nếu các đối tượng trong lĩnh vực của bạn có một số trường tuỳ chọn, bạn cần cài đặt các phiên bản overload khác nhau của những phương thức đó để cho phép bỏ qua các tham số bị thiếu. Cuối cùng, ý nghĩa của các đối số khác nhau được xác định bởi vị trí của chúng thay vì bởi tên. Bạn có thể giảm nhẹ vấn đề cuối cùng này bằng cách đưa vào một vài phương thức giả, như bạn đã làm với các phương thức `at()` và `on()` trong `NestedFunctionOrderBuilder`, mà mục đích duy nhất là làm rõ vai trò của một đối số.

Hai pattern DSL mà chúng tôi đã trình bày cho tới giờ không đòi hỏi phải dùng lambda expression. Trong mục tiếp theo, chúng tôi sẽ minh hoạ một kỹ thuật thứ ba tận dụng các khả năng hàm được giới thiệu trong Java 8.

### 10.3.3. Xâu chuỗi hàm với lambda expression (function sequencing)

Pattern DSL tiếp theo sử dụng một chuỗi các hàm được định nghĩa bằng lambda expression. Cài đặt một DSL theo phong cách này trên nền mô hình lĩnh vực giao dịch cổ phiếu quen thuộc cho phép bạn định nghĩa một order như trong listing 10.9.

**Listing 10.9. Tạo một lệnh giao dịch cổ phiếu bằng function sequencing**

```java
Order order = order(o -> {
    o.forCustomer("BigBank");
    o.buy(t -> {
        t.quantity(80);
        t.price(125.00);
        t.stock(s -> {
            s.symbol("IBM");
            s.market("NYSE");
        });
    });
    o.sell(t -> {
        t.quantity(50);
        t.price(375.00);
        t.stock(s -> {
            s.symbol("GOOGLE");
            s.market("NASDAQ");
        });
    });
});
```

Để cài đặt cách tiếp cận này, bạn cần phát triển vài builder nhận lambda expression và điền dữ liệu vào mô hình lĩnh vực bằng cách thực thi chúng. Những builder này giữ trạng thái trung gian của các đối tượng cần tạo, giống như cách bạn đã làm trong phần cài đặt DSL bằng method chaining. Cũng như trong pattern method chaining, bạn có một builder ở tầng cao nhất để tạo order, nhưng lần này builder nhận các đối tượng `Consumer` làm tham số để người dùng DSL có thể dùng lambda expression cài đặt chúng. Listing tiếp theo cho thấy code cần thiết để cài đặt cách tiếp cận này.

**Listing 10.10. Một order builder cung cấp DSL theo kiểu function sequencing**

```java
public class LambdaOrderBuilder {

    private Order order = new Order();   // Order được bọc bởi builder này

    public static Order order(Consumer<LambdaOrderBuilder> consumer) {
        LambdaOrderBuilder builder = new LambdaOrderBuilder();
        consumer.accept(builder);   // Thực thi lambda expression được truyền cho order builder
        // Trả về order đã được điền dữ liệu nhờ thực thi Consumer của OrderBuilder
        return builder.order;
    }

    // Đặt khách hàng đã đặt order
    public void forCustomer(String customer) {
        order.setCustomer(customer);
    }

    // Tiêu thụ một TradeBuilder để tạo một trade mua cổ phiếu
    public void buy(Consumer<TradeBuilder> consumer) {
        trade(consumer, Trade.Type.BUY);
    }

    // Tiêu thụ một TradeBuilder để tạo một trade bán cổ phiếu
    public void sell(Consumer<TradeBuilder> consumer) {
        trade(consumer, Trade.Type.SELL);
    }

    private void trade(Consumer<TradeBuilder> consumer, Trade.Type type) {
        TradeBuilder builder = new TradeBuilder();
        builder.trade.setType(type);
        consumer.accept(builder);   // Thực thi lambda expression được truyền cho TradeBuilder
        // Thêm vào order cái trade đã được điền dữ liệu nhờ thực thi Consumer của TradeBuilder
        order.addTrade(builder.trade);
    }
}
```

Các phương thức `buy()` và `sell()` của order builder nhận hai lambda expression thuộc kiểu `Consumer<TradeBuilder>`. Khi được thực thi, các phương thức này điền dữ liệu cho một trade mua hoặc bán, như sau:

```java
public class TradeBuilder {
    private Trade trade = new Trade();

    public void quantity(int quantity) {
        trade.setQuantity(quantity);
    }

    public void price(double price) {
        trade.setPrice(price);
    }

    public void stock(Consumer<StockBuilder> consumer) {
        StockBuilder builder = new StockBuilder();
        consumer.accept(builder);
        trade.setStock(builder.stock);
    }
}
```

Cuối cùng, `TradeBuilder` nhận `Consumer` của một builder thứ ba, dùng để định nghĩa cổ phiếu được giao dịch:

```java
public class StockBuilder {
    private Stock stock = new Stock();

    public void symbol(String symbol) {
        stock.setSymbol(symbol);
    }

    public void market(String market) {
        stock.setMarket(market);
    }
}
```

Pattern này có ưu điểm là kết hợp được hai đặc tính tích cực của hai phong cách DSL trước đó. Giống như pattern method chaining, nó cho phép định nghĩa lệnh giao dịch theo phong cách fluent. Ngoài ra, tương tự phong cách nested function, nó giữ được cấu trúc phân cấp của các đối tượng lĩnh vực thông qua mức lồng nhau của các lambda expression khác nhau.

Đáng tiếc, cách tiếp cận này đòi hỏi rất nhiều code thiết lập, và bản thân việc dùng DSL cũng bị ảnh hưởng bởi nhiễu từ cú pháp lambda expression của Java 8.

Việc chọn giữa ba phong cách DSL này chủ yếu là vấn đề khẩu vị. Nó cũng đòi hỏi ít nhiều kinh nghiệm để tìm ra phong cách phù hợp nhất với mô hình lĩnh vực mà bạn muốn tạo ngôn ngữ chuyên biệt. Hơn nữa, bạn hoàn toàn có thể kết hợp hai hoặc nhiều phong cách này trong một DSL duy nhất, như bạn sẽ thấy ở mục tiếp theo.

### 10.3.4. Ghép tất cả lại với nhau

Như bạn đã thấy, cả ba pattern DSL đều có ưu và nhược điểm, nhưng không có gì ngăn bạn dùng chúng cùng nhau trong một DSL duy nhất. Bạn có thể đi tới việc phát triển một DSL cho phép định nghĩa lệnh giao dịch cổ phiếu như trong listing sau.

**Listing 10.11. Tạo một lệnh giao dịch cổ phiếu bằng cách dùng nhiều pattern DSL**

```java
Order order =
        // Hàm lồng nhau để chỉ định các thuộc tính của order ở tầng cao nhất
        forCustomer("BigBank",
                    // Lambda expression để tạo một trade đơn lẻ
                    buy(t -> t.quantity(80)
                              // Method chaining trong thân lambda expression, điền dữ liệu cho đối tượng trade
                              .stock("IBM")
                              .on("NYSE")
                              .at(125.00)),
                    sell(t -> t.quantity(50)
                               .stock("GOOGLE")
                               .on("NASDAQ")
                               .at(125.00)));
```

Trong ví dụ này, pattern nested function được kết hợp với cách tiếp cận lambda. Mỗi trade được tạo bởi một `Consumer` của `TradeBuilder` được cài đặt bằng một lambda expression, như trong listing tiếp theo.

**Listing 10.12. Một order builder cung cấp DSL kết hợp nhiều phong cách**

```java
public class MixedBuilder {

    public static Order forCustomer(String customer,
                                    TradeBuilder... builders) {
        Order order = new Order();
        order.setCustomer(customer);
        Stream.of(builders).forEach(b -> order.addTrade(b.trade));
        return order;
    }

    public static TradeBuilder buy(Consumer<TradeBuilder> consumer) {
        return buildTrade(consumer, Trade.Type.BUY);
    }

    public static TradeBuilder sell(Consumer<TradeBuilder> consumer) {
        return buildTrade(consumer, Trade.Type.SELL);
    }

    private static TradeBuilder buildTrade(Consumer<TradeBuilder> consumer,
                                           Trade.Type buy) {
        TradeBuilder builder = new TradeBuilder();
        builder.trade.setType(buy);
        consumer.accept(builder);
        return builder;
    }
}
```

Cuối cùng, class trợ giúp `TradeBuilder` và `StockBuilder` mà nó dùng bên trong (phần cài đặt được trình bày ngay sau đoạn này) cung cấp một fluent API cài đặt pattern method chaining. Sau khi bạn đưa ra lựa chọn này, bạn có thể viết thân của lambda expression điền dữ liệu cho trade theo cách cô đọng nhất có thể:

```java
public class TradeBuilder {
    private Trade trade = new Trade();

    public TradeBuilder quantity(int quantity) {
        trade.setQuantity(quantity);
        return this;
    }

    public TradeBuilder at(double price) {
        trade.setPrice(price);
        return this;
    }

    public StockBuilder stock(String symbol) {
        return new StockBuilder(this, trade, symbol);
    }
}

public class StockBuilder {
    private final TradeBuilder builder;
    private final Trade trade;
    private final Stock stock = new Stock();

    private StockBuilder(TradeBuilder builder, Trade trade, String symbol) {
        this.builder = builder;
        this.trade = trade;
        stock.setSymbol(symbol);
    }

    public TradeBuilder on(String market) {
        stock.setMarket(market);
        trade.setStock(stock);
        return builder;
    }
}
```

Listing 10.12 là một ví dụ cho thấy ba pattern DSL đã bàn trong chương này có thể được kết hợp như thế nào để đạt được một DSL dễ đọc. Làm như vậy cho phép bạn tận dụng ưu điểm của nhiều phong cách DSL khác nhau, nhưng kỹ thuật này cũng có một nhược điểm nhỏ: DSL thu được trông kém đồng nhất hơn so với một DSL chỉ dùng một kỹ thuật duy nhất, nên người dùng DSL này có lẽ sẽ cần nhiều thời gian hơn để học nó.

Cho tới giờ, bạn đã dùng lambda expression, nhưng như API `Comparator` và `Stream` cho thấy, việc dùng method reference có thể cải thiện hơn nữa tính dễ đọc của nhiều DSL. Chúng tôi sẽ minh hoạ điều này ở mục tiếp theo qua một ví dụ thực tế về việc dùng method reference trong mô hình lĩnh vực giao dịch cổ phiếu.

### 10.3.5. Dùng method reference trong một DSL

Trong mục này, bạn sẽ thử thêm một tính năng đơn giản nữa vào mô hình lĩnh vực giao dịch cổ phiếu. Tính năng này tính giá trị cuối cùng của một order sau khi cộng thêm không hoặc nhiều loại thuế sau đây vào giá trị ròng của order, như trong listing tiếp theo.

**Listing 10.13. Các loại thuế có thể áp lên giá trị ròng của order**

```java
public class Tax {
    public static double regional(double value) {
        return value * 1.1;
    }

    public static double general(double value) {
        return value * 1.3;
    }

    public static double surcharge(double value) {
        return value * 1.05;
    }
}
```

Cách đơn giản nhất để cài đặt một bộ tính thuế như vậy là dùng một static method nhận vào order cộng với một cờ Boolean cho mỗi loại thuế có thể được áp dụng (listing 10.14).

**Listing 10.14. Áp thuế lên giá trị ròng của order bằng một tập hợp các cờ Boolean**

```java
public static double calculate(Order order, boolean useRegional,
                               boolean useGeneral, boolean useSurcharge) {
    double value = order.getValue();
    if (useRegional) value = Tax.regional(value);
    if (useGeneral) value = Tax.general(value);
    if (useSurcharge) value = Tax.surcharge(value);
    return value;
}
```

Theo cách này, có thể tính được giá trị cuối cùng của một order sau khi áp thuế vùng và phụ phí, nhưng không áp thuế chung, như sau:

```java
double value = calculate(order, true, false, true);
```

Vấn đề về tính dễ đọc của phần cài đặt này là quá rõ ràng: rất khó để nhớ đúng trình tự các biến Boolean và để hiểu loại thuế nào đã được áp dụng còn loại nào thì không. Cách khắc phục kinh điển cho vấn đề này là cài đặt một `TaxCalculator` cung cấp một DSL tối giản để thiết lập lần lượt từng cờ Boolean theo phong cách fluent, như trong listing tiếp theo.

**Listing 10.15. Một bộ tính thuế định nghĩa các loại thuế cần áp dụng theo phong cách fluent**

```java
public class TaxCalculator {
    private boolean useRegional;
    private boolean useGeneral;
    private boolean useSurcharge;

    public TaxCalculator withTaxRegional() {
        useRegional = true;
        return this;
    }

    public TaxCalculator withTaxGeneral() {
        useGeneral = true;
        return this;
    }

    public TaxCalculator withTaxSurcharge() {
        useSurcharge = true;
        return this;
    }

    public double calculate(Order order) {
        return calculate(order, useRegional, useGeneral, useSurcharge);
    }
}
```

Việc dùng `TaxCalculator` này làm rõ rằng bạn muốn áp thuế vùng và phụ phí lên giá trị ròng của order:

```java
double value = new TaxCalculator().withTaxRegional()
                                  .withTaxSurcharge()
                                  .calculate(order);
```

Vấn đề chính với giải pháp này là sự dài dòng của nó. Nó không mở rộng tốt vì bạn cần một trường Boolean và một phương thức cho mỗi loại thuế trong lĩnh vực của mình. Bằng cách dùng các khả năng hàm của Java, bạn có thể đạt được cùng kết quả về tính dễ đọc theo cách cô đọng và linh hoạt hơn nhiều. Để thấy điều đó, hãy refactor `TaxCalculator` như trong listing tiếp theo.

**Listing 10.16. Một bộ tính thuế kết hợp các hàm thuế cần áp dụng theo phong cách fluent**

```java
public class TaxCalculator {
    // Hàm tính tất cả các loại thuế cần áp lên giá trị của order
    public DoubleUnaryOperator taxFunction = d -> d;

    public TaxCalculator with(DoubleUnaryOperator f) {
        // Lấy hàm tính thuế mới bằng cách kết hợp hàm hiện tại với hàm được truyền vào làm đối số
        taxFunction = taxFunction.andThen(f);
        // Trả về this, cho phép nối tiếp các hàm thuế khác một cách fluent
        return this;
    }

    public double calculate(Order order) {
        // Tính giá trị cuối cùng của order bằng cách áp hàm tính thuế lên giá trị ròng của order
        return taxFunction.applyAsDouble(order.getValue());
    }
}
```

Với giải pháp này, bạn chỉ cần một trường duy nhất: hàm mà khi được áp lên giá trị ròng của order sẽ cộng gộp trong một lần tất cả các loại thuế được cấu hình thông qua class `TaxCalculator`. Giá trị khởi đầu của hàm này là hàm đồng nhất (identity function). Tại thời điểm đó, chưa có loại thuế nào được thêm vào, nên giá trị cuối cùng của order bằng đúng giá trị ròng. Khi một loại thuế mới được thêm qua phương thức `with()`, thuế này được kết hợp với hàm tính thuế hiện tại, nhờ đó bao trọn tất cả các loại thuế đã thêm trong một hàm duy nhất. Cuối cùng, khi một order được truyền cho phương thức `calculate()`, hàm tính thuế thu được từ việc kết hợp các loại thuế đã cấu hình sẽ được áp lên giá trị ròng của order. `TaxCalculator` sau khi refactor có thể được dùng như sau:

```java
double value = new TaxCalculator().with(Tax::regional)
                                  .with(Tax::surcharge)
                                  .calculate(order);
```

Giải pháp này dùng method reference, dễ đọc và cho ra code súc tích. Nó cũng linh hoạt ở chỗ nếu và khi một hàm thuế mới được thêm vào class `Tax`, bạn có thể dùng nó ngay lập tức với `TaxCalculator` theo phong cách hàm mà không cần sửa đổi gì.

Giờ đây, khi chúng ta đã bàn xong các kỹ thuật có thể dùng để cài đặt một DSL trong Java 8 trở đi, sẽ rất thú vị nếu khảo sát xem những chiến lược này đã được dùng như thế nào trong các công cụ và framework Java được áp dụng rộng rãi.

## 10.4. DSL Java 8 trong thế giới thực

Ở mục 10.3, bạn đã học ba pattern hữu ích để phát triển DSL trong Java, cùng với ưu và nhược điểm của chúng. Bảng 10.1 tóm tắt những gì chúng ta đã bàn tới.

**Bảng 10.1. Các pattern DSL cùng ưu và nhược điểm của chúng**

| Tên pattern | Ưu điểm | Nhược điểm |
|---|---|---|
| Method chaining | • Tên phương thức đóng vai trò như đối số có từ khoá<br>• Hoạt động tốt với các tham số tuỳ chọn<br>• Có thể bắt buộc người dùng DSL gọi các phương thức theo trình tự định trước<br>• Dùng rất ít hoặc không dùng static method<br>• Nhiễu cú pháp thấp nhất có thể | • Phần cài đặt dài dòng<br>• Cần code keo dán để nối các builder với nhau<br>• Cấu trúc phân cấp của các đối tượng lĩnh vực chỉ được thể hiện qua quy ước thụt lề |
| Nested functions | • Phần cài đặt ít dài dòng hơn<br>• Cấu trúc phân cấp của các đối tượng lĩnh vực được phản ánh qua việc lồng hàm | • Dùng nhiều static method<br>• Đối số được xác định theo vị trí thay vì theo tên<br>• Cần overload phương thức để hỗ trợ tham số tuỳ chọn |
| Function sequencing với lambda | • Hoạt động tốt với các tham số tuỳ chọn<br>• Dùng rất ít hoặc không dùng static method<br>• Cấu trúc phân cấp của các đối tượng lĩnh vực được phản ánh qua việc lồng lambda<br>• Không cần code keo dán cho các builder | • Phần cài đặt dài dòng<br>• Nhiều nhiễu cú pháp hơn do các lambda expression trong DSL |

Đã đến lúc củng cố những gì bạn đã học bằng cách phân tích cách những pattern này được dùng trong ba thư viện Java nổi tiếng: một công cụ ánh xạ SQL, một framework phát triển hướng hành vi, và một công cụ cài đặt các Enterprise Integration Pattern.

### 10.4.1. jOOQ

SQL là một trong những DSL phổ biến và được dùng rộng rãi nhất. Vì lý do đó, không có gì ngạc nhiên khi có một thư viện Java cung cấp một DSL đẹp để viết và thực thi các truy vấn SQL. jOOQ là một internal DSL cài đặt SQL như một ngôn ngữ nhúng an toàn kiểu (type-safe) trực tiếp trong Java. Một bộ sinh mã nguồn thực hiện việc dịch ngược (reverse-engineer) lược đồ cơ sở dữ liệu, cho phép trình biên dịch Java kiểm tra kiểu cho những câu lệnh SQL phức tạp. Kết quả của quá trình dịch ngược này sinh ra thông tin giúp bạn duyệt qua lược đồ cơ sở dữ liệu của mình. Như một ví dụ đơn giản, truy vấn SQL sau đây:

```sql
SELECT * FROM BOOK
WHERE BOOK.PUBLISHED_IN = 2016
ORDER BY BOOK.TITLE
```

có thể được viết bằng jOOQ DSL như sau:

```java
create.selectFrom(BOOK)
      .where(BOOK.PUBLISHED_IN.eq(2016))
      .orderBy(BOOK.TITLE)
```

Một tính năng hay khác của jOOQ DSL là khả năng dùng nó kết hợp với Stream API. Tính năng này cho phép bạn thao tác trong bộ nhớ, chỉ với một câu lệnh fluent duy nhất, trên dữ liệu thu được từ việc thực thi truy vấn SQL, như trong listing tiếp theo.

**Listing 10.17. Chọn sách từ cơ sở dữ liệu bằng jOOQ DSL**

```java
Class.forName("org.h2.Driver");
// Tạo kết nối tới cơ sở dữ liệu SQL
try (Connection c =
         getConnection("jdbc:h2:~/sql-goodies-with-mapping", "sa", "")) {
    // Bắt đầu câu lệnh SQL của jOOQ, dùng kết nối cơ sở dữ liệu vừa tạo
    DSL.using(c)
       // Định nghĩa câu lệnh SQL thông qua jOOQ DSL
       .select(BOOK.AUTHOR, BOOK.TITLE)
       .where(BOOK.PUBLISHED_IN.eq(2016))
       .orderBy(BOOK.TITLE)
       .fetch()    // Lấy dữ liệu từ cơ sở dữ liệu; câu lệnh jOOQ kết thúc tại đây
       .stream()   // Bắt đầu thao tác dữ liệu lấy từ cơ sở dữ liệu bằng Stream API
       // Nhóm các cuốn sách theo tác giả
       .collect(groupingBy(
           r -> r.getValue(BOOK.AUTHOR),
           LinkedHashMap::new,
           mapping(r -> r.getValue(BOOK.TITLE), toList())))
       // In tên các tác giả cùng với những cuốn sách họ đã viết
       .forEach((author, titles) ->
           System.out.println(author + " is author of " + titles));
}
```

Rõ ràng pattern DSL chính được chọn để cài đặt jOOQ DSL là method chaining. Thực tế, nhiều đặc tính của pattern này (cho phép tham số tuỳ chọn và yêu cầu một số phương thức chỉ được gọi theo trình tự định trước) là thiết yếu để mô phỏng cú pháp của một truy vấn SQL đúng chuẩn. Những đặc tính này, cùng với mức nhiễu cú pháp thấp hơn, khiến pattern method chaining rất phù hợp với nhu cầu của jOOQ.

### 10.4.2. Cucumber

Behavior-driven development (BDD — phát triển hướng hành vi) là một mở rộng của test-driven development, sử dụng một ngôn ngữ kịch bản chuyên biệt đơn giản gồm các câu lệnh có cấu trúc mô tả những kịch bản nghiệp vụ khác nhau. Cucumber, cũng như các framework BDD khác, dịch những câu lệnh này thành các test case có thể thực thi. Nhờ đó, các kịch bản thu được từ việc áp dụng kỹ thuật phát triển này có thể vừa được dùng như unit test chạy được, vừa được dùng như tiêu chí nghiệm thu cho một tính năng nghiệp vụ cho trước. BDD cũng tập trung nỗ lực phát triển vào việc mang lại giá trị nghiệp vụ có thứ tự ưu tiên và có thể kiểm chứng, đồng thời thu hẹp khoảng cách giữa chuyên gia lĩnh vực và lập trình viên bằng cách khiến họ chia sẻ chung một bộ từ vựng nghiệp vụ.

Những khái niệm trừu tượng này có thể được làm rõ bằng một ví dụ thực tế dùng Cucumber, một công cụ BDD cho phép lập trình viên viết các kịch bản nghiệp vụ bằng tiếng Anh thuần. Hãy dùng ngôn ngữ kịch bản của Cucumber như sau để định nghĩa một kịch bản nghiệp vụ đơn giản:

```text
Feature: Buy stock
  Scenario: Buy 10 IBM stocks
    Given the price of a "IBM" stock is 125$
    When I buy 10 "IBM"
    Then the order value should be 1250$
```

Cucumber dùng ký pháp được chia thành ba phần: định nghĩa các điều kiện tiên quyết (`Given`), các lời gọi thực tế tới những đối tượng lĩnh vực đang được kiểm thử (`When`), và các khẳng định kiểm tra kết quả của test case (`Then`).

Kịch bản định nghĩa tình huống kiểm thử được viết bằng một external DSL có số lượng từ khoá hạn chế và cho phép bạn viết câu theo định dạng tự do. Những câu này được so khớp thông qua các biểu thức chính quy (regular expression) để trích ra các biến của test case và truyền chúng làm đối số cho các phương thức cài đặt chính bài kiểm thử đó. Dùng mô hình lĩnh vực giao dịch cổ phiếu từ đầu mục 10.3, ta có thể phát triển một test case Cucumber kiểm tra xem giá trị của một lệnh giao dịch cổ phiếu có được tính đúng hay không, như trong listing tiếp theo.

**Listing 10.18. Cài đặt một kịch bản kiểm thử bằng annotation của Cucumber**

```java
public class BuyStocksSteps {
    private Map<String, Integer> stockUnitPrices = new HashMap<>();
    private Order order = new Order();

    // Định nghĩa đơn giá của một cổ phiếu như một điều kiện tiên quyết của kịch bản này
    @Given("^the price of a \"(.*?)\" stock is (\\d+)\\$$")
    public void setUnitPrice(String stockName, int unitPrice) {
        stockUnitValues.put(stockName, unitPrice);   // Lưu đơn giá cổ phiếu
    }

    // Định nghĩa các hành động sẽ được thực hiện trên mô hình lĩnh vực đang kiểm thử
    @When("^I buy (\\d+) \"(.*?)\"$")
    public void buyStocks(int quantity, String stockName) {
        Trade trade = new Trade();   // Điền dữ liệu vào mô hình lĩnh vực tương ứng
        trade.setType(Trade.Type.BUY);

        Stock stock = new Stock();
        stock.setSymbol(stockName);

        trade.setStock(stock);
        trade.setPrice(stockUnitPrices.get(stockName));
        trade.setQuantity(quantity);
        order.addTrade(trade);
    }

    // Định nghĩa kết quả mong đợi của kịch bản
    @Then("^the order value should be (\\d+)\\$$")
    public void checkOrderValue(int expectedValue) {
        assertEquals(expectedValue, order.getValue());   // Kiểm tra các khẳng định của bài kiểm thử
    }
}
```

Việc giới thiệu lambda expression trong Java 8 đã cho phép Cucumber phát triển một cú pháp thay thế loại bỏ annotation bằng cách dùng các phương thức hai đối số: biểu thức chính quy trước đây nằm trong giá trị của annotation, và lambda cài đặt phương thức kiểm thử. Khi bạn dùng loại ký pháp thứ hai này, bạn có thể viết lại kịch bản kiểm thử như sau:

```java
public class BuyStocksSteps implements cucumber.api.java8.En {
    private Map<String, Integer> stockUnitPrices = new HashMap<>();
    private Order order = new Order();

    public BuyStocksSteps() {
        Given("^the price of a \"(.*?)\" stock is (\\d+)\\$$",
              (String stockName, int unitPrice) -> {
                  stockUnitValues.put(stockName, unitPrice);
        });
        // ... các lambda When và Then được lược bỏ cho ngắn gọn
    }
}
```

Cú pháp thay thế này có lợi thế rõ ràng là cô đọng. Cụ thể, việc thay các phương thức kiểm thử bằng các lambda vô danh loại bỏ gánh nặng phải nghĩ ra những tên phương thức có ý nghĩa (điều hiếm khi đóng góp gì cho tính dễ đọc trong một kịch bản kiểm thử).

DSL của Cucumber cực kỳ đơn giản, nhưng nó cho thấy cách kết hợp hiệu quả một external DSL với một internal DSL và (một lần nữa) cho thấy lambda cho phép bạn viết code cô đọng, dễ đọc hơn.

### 10.4.3. Spring Integration

Spring Integration mở rộng mô hình lập trình dựa trên dependency injection của Spring để hỗ trợ các Enterprise Integration Pattern nổi tiếng.[1] Mục tiêu chính của Spring Integration là cung cấp một mô hình đơn giản để cài đặt những giải pháp tích hợp doanh nghiệp phức tạp và thúc đẩy việc áp dụng kiến trúc asynchronous, hướng thông điệp (message-driven).

> [1] Để biết thêm chi tiết, xem cuốn sách: "Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions" (Addison-Wesley), Gregor Hohpe và Bobby Woolf, 2004.

Spring Integration cho phép thực hiện remoting, messaging và lập lịch nhẹ nhàng trong các ứng dụng dựa trên Spring. Những tính năng này cũng có sẵn thông qua một DSL fluent phong phú, thứ còn hơn cả "đường cú pháp" (syntactic sugar) xây trên các file cấu hình XML truyền thống của Spring.

Spring Integration cài đặt tất cả những pattern phổ biến nhất cần thiết cho các ứng dụng dựa trên thông điệp, chẳng hạn như channel, endpoint, poller và channel interceptor. Các endpoint được biểu diễn dưới dạng động từ trong DSL để cải thiện tính dễ đọc, và các quy trình tích hợp được xây dựng bằng cách kết hợp những endpoint này thành một hoặc nhiều luồng thông điệp. Listing tiếp theo cho thấy Spring Integration hoạt động ra sao qua một ví dụ đơn giản nhưng đầy đủ.

**Listing 10.19. Cấu hình một Spring Integration flow bằng Spring Integration DSL**

```java
@Configuration
@EnableIntegration
public class MyConfiguration {

    @Bean
    // Tạo một MessageSource mới mà mỗi lần được gọi sẽ tăng một AtomicInteger
    public MessageSource<?> integerMessageSource() {
        MethodInvokingMessageSource source =
                new MethodInvokingMessageSource();
        source.setObject(new AtomicInteger());
        source.setMethodName("getAndIncrement");
        return source;
    }

    @Bean
    // Channel chuyển tải dữ liệu đến từ MessageSource
    public DirectChannel inputChannel() {
        return new DirectChannel();
    }

    @Bean
    public IntegrationFlow myFlow() {
        // Bắt đầu tạo IntegrationFlow thông qua một builder theo pattern method chaining
        return IntegrationFlows
                   // Dùng MessageSource đã định nghĩa trước đó làm nguồn cho IntegrationFlow này
                   .from(this.integerMessageSource(),
                         // Poll MessageSource để lấy ra dữ liệu mà nó chuyển tải
                         c -> c.poller(Pollers.fixedRate(10)))
                   .channel(this.inputChannel())
                   .filter((Integer p) -> p % 2 == 0)   // Chỉ lọc các số chẵn
                   // Chuyển các Integer lấy từ MessageSource thành String
                   .transform(Object::toString)
                   // Đặt channel queueChannel làm đầu ra cho IntegrationFlow này
                   .channel(MessageChannels.queue("queueChannel"))
                   .get();   // Kết thúc việc xây dựng IntegrationFlow và trả về nó
    }
}
```

Ở đây, phương thức `myFlow()` xây dựng một `IntegrationFlow` bằng Spring Integration DSL. Nó dùng builder fluent do class `IntegrationFlows` cung cấp, vốn cài đặt pattern method chaining. Trong trường hợp này, luồng thu được sẽ poll một `MessageSource` ở một tần suất cố định, cung cấp một dãy các `Integer`; lọc ra những số chẵn và chuyển chúng thành `String`, và cuối cùng gửi kết quả tới một channel đầu ra theo phong cách tương tự Stream API gốc của Java 8. API này cho phép gửi một thông điệp tới bất kỳ thành phần nào bên trong luồng nếu bạn biết tên `inputChannel` của nó. Nếu luồng bắt đầu bằng một direct channel thay vì một `MessageSource`, bạn có thể định nghĩa `IntegrationFlow` bằng một lambda expression như sau:

```java
@Bean
public IntegrationFlow myFlow() {
    return flow -> flow.filter((Integer p) -> p % 2 == 0)
                       .transform(Object::toString)
                       .handle(System.out::println);
}
```

Như bạn thấy, pattern được dùng nhiều nhất trong Spring Integration DSL là method chaining. Pattern này rất phù hợp với mục đích chính của builder `IntegrationFlow`: tạo ra một luồng truyền thông điệp và biến đổi dữ liệu. Tuy nhiên, như ví dụ cuối cùng cho thấy, nó cũng dùng function sequencing với lambda expression cho đối tượng ở tầng cao nhất cần được xây dựng (và trong một số trường hợp, cả cho những đối số phương thức bên trong, phức tạp hơn).

## Tóm tắt

- Mục đích chính của một DSL là lấp đầy khoảng cách giữa lập trình viên và chuyên gia lĩnh vực. Hiếm khi người viết code cài đặt logic nghiệp vụ của một ứng dụng lại đồng thời có hiểu biết sâu sắc về lĩnh vực nghiệp vụ nơi chương trình sẽ được dùng. Viết logic nghiệp vụ này bằng một ngôn ngữ mà người không phải lập trình viên có thể hiểu được không biến các chuyên gia lĩnh vực thành lập trình viên, nhưng nó cho phép họ đọc và kiểm chứng logic đó.
- Hai phân loại chính của DSL là internal (được cài đặt bằng chính ngôn ngữ dùng để phát triển ứng dụng nơi DSL sẽ được sử dụng) và external (dùng một ngôn ngữ khác được thiết kế riêng cho mục đích đó). Internal DSL đòi hỏi ít công sức phát triển hơn nhưng có cú pháp bị ràng buộc bởi ngôn ngữ chủ. External DSL mang lại mức độ linh hoạt cao hơn nhưng khó cài đặt hơn.
- Bạn có thể phát triển một polyglot DSL bằng cách dùng một ngôn ngữ lập trình khác đã có sẵn trên JVM, chẳng hạn như Scala hoặc Groovy. Những ngôn ngữ này thường linh hoạt và cô đọng hơn Java. Tuy nhiên, việc tích hợp chúng với Java đòi hỏi một quy trình build phức tạp hơn, và khả năng liên thông của chúng với Java có thể còn xa mới liền mạch.
- Do sự dài dòng và cú pháp cứng nhắc của mình, Java không phải là ngôn ngữ lập trình lý tưởng để phát triển internal DSL, nhưng việc giới thiệu lambda expression và method reference trong Java 8 đã cải thiện tình hình này rất nhiều.
- Java hiện đại đã cung cấp sẵn những DSL nhỏ trong API gốc của nó. Những DSL này, chẳng hạn như các DSL trong class `Stream` và `Collectors`, rất hữu ích và tiện lợi, đặc biệt cho việc sắp xếp, lọc, biến đổi và nhóm các tập hợp dữ liệu.
- Ba pattern chính được dùng để cài đặt DSL trong Java là method chaining, nested functions và function sequencing. Mỗi pattern có ưu và nhược điểm riêng, nhưng bạn có thể kết hợp cả ba pattern trong một DSL duy nhất để tận dụng lợi thế của cả ba kỹ thuật.
- Nhiều framework và thư viện Java cho phép sử dụng tính năng của chúng thông qua một DSL. Chương này đã xem xét ba trong số đó: jOOQ, một công cụ ánh xạ SQL; Cucumber, một framework BDD; và Spring Integration, một phần mở rộng của Spring cài đặt các Enterprise Integration Pattern.
