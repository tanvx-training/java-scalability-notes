# Chương 18. Tư duy hàm

> **Nội dung chương này**
>
> - Tại sao lại là functional programming (lập trình hàm)?
> - Điều gì định nghĩa nên functional programming?
> - Declarative programming (lập trình khai báo) và referential transparency
> - Các nguyên tắc để viết code Java theo phong cách hàm
> - Vòng lặp (iteration) so với recursion (đệ quy)

Bạn đã bắt gặp thuật ngữ *functional* (thuộc về hàm) khá thường xuyên xuyên suốt cuốn sách này. Đến lúc này, có lẽ bạn đã hình dung được phần nào ý nghĩa của việc "mang tính hàm". Nó nói về lambda và first-class function, hay là về việc hạn chế quyền thay đổi (mutate) các đối tượng của bạn? Bạn đạt được điều gì khi áp dụng một phong cách hàm?

Trong chương này, chúng ta sẽ làm sáng tỏ lời giải đáp cho những câu hỏi đó. Chúng tôi sẽ giải thích functional programming là gì và giới thiệu một số thuật ngữ của nó. Trước tiên, chúng ta xem xét các khái niệm nằm sau functional programming — chẳng hạn như side effect, tính immutable, declarative programming và referential transparency — rồi sau đó liên hệ những khái niệm này với Java 8. Ở chương 19, chúng ta sẽ tìm hiểu kỹ hơn các kỹ thuật của functional programming như higher-order function, currying, persistent data structure, lazy list, pattern matching và combinator.

## 18.1. Xây dựng và bảo trì hệ thống

Để bắt đầu, hãy tưởng tượng rằng bạn được yêu cầu phụ trách việc nâng cấp một hệ thống phần mềm lớn mà bạn chưa từng nhìn thấy bao giờ. Bạn có nên nhận công việc bảo trì một hệ thống phần mềm như vậy không? Một câu châm ngôn — chỉ hơi mang tính đùa cợt — của một lập trình viên Java hợp đồng dày dạn kinh nghiệm để đưa ra quyết định là: "Hãy bắt đầu bằng cách tìm kiếm từ khoá `synchronized`; nếu tìm thấy, cứ nói không (phản ánh mức độ khó khăn của việc sửa các lỗi liên quan đến xử lý đồng thời). Ngược lại, hãy xem xét cấu trúc của hệ thống một cách chi tiết hơn." Chúng tôi sẽ trình bày chi tiết hơn trong những đoạn tiếp theo.

Tuy nhiên, trước hết chúng tôi lưu ý rằng, như bạn đã thấy ở các chương trước, việc Java 8 bổ sung stream cho phép bạn khai thác tính song song mà không phải lo lắng về khoá (locking), miễn là bạn chấp nhận các hành vi không có trạng thái (stateless). (Nghĩa là, các hàm trong pipeline xử lý stream của bạn không tương tác với nhau, không có chuyện một hàm đọc từ hoặc ghi vào một biến mà một hàm khác cũng ghi vào.)

Bạn còn muốn chương trình trông như thế nào nữa để dễ làm việc cùng? Bạn sẽ muốn nó được cấu trúc tốt, với một hệ thống phân cấp class dễ hiểu, phản ánh đúng cấu trúc của hệ thống. Bạn có những cách để đánh giá một cấu trúc như vậy bằng cách sử dụng các độ đo (metric) của công nghệ phần mềm là *coupling* (mức độ các phần của hệ thống phụ thuộc lẫn nhau) và *cohesion* (mức độ các phần khác nhau của hệ thống có liên quan với nhau).

Nhưng với nhiều lập trình viên, mối bận tâm chính hằng ngày lại là việc gỡ lỗi (debug) trong quá trình bảo trì: một đoạn code nào đó bị sập vì nó quan sát thấy một giá trị ngoài dự kiến. Nhưng những phần nào của chương trình đã tham gia vào việc tạo ra và sửa đổi giá trị này? Hãy nghĩ xem có bao nhiêu mối bận tâm bảo trì của bạn rơi vào loại này![^1] Hoá ra, các khái niệm "không có side effect" và tính immutable — những điều mà functional programming đề cao — có thể giúp ích. Chúng ta sẽ xem xét các khái niệm này chi tiết hơn trong các mục sau.

[^1]: Chúng tôi khuyên bạn nên đọc cuốn *Working Effectively with Legacy Code* của Michael Feathers (Prentice Hall, 2004) để biết thêm thông tin về chủ đề này.

### 18.1.1. Dữ liệu mutable dùng chung

Xét cho cùng, nguyên nhân của vấn đề "giá trị biến ngoài dự kiến" được bàn tới ở mục trước là do các cấu trúc dữ liệu mutable dùng chung bị đọc và cập nhật bởi nhiều hơn một trong số các phương thức mà công việc bảo trì của bạn xoay quanh. Giả sử có vài class cùng giữ một tham chiếu đến một danh sách. Với vai trò người bảo trì, bạn cần xác lập được câu trả lời cho những câu hỏi sau:

- Ai sở hữu danh sách này?
- Điều gì xảy ra nếu một class sửa đổi danh sách?
- Các class khác có mong đợi sự thay đổi này không?
- Làm thế nào những class đó biết được về sự thay đổi này?
- Các class có cần được thông báo về thay đổi này để thoả mãn mọi giả định trong danh sách trên hay không, hay chúng nên tự tạo ra bản sao phòng vệ (defensive copy) cho riêng mình?

Nói cách khác, các cấu trúc dữ liệu mutable dùng chung khiến việc theo dõi các thay đổi ở những phần khác nhau trong chương trình của bạn trở nên khó khăn hơn. Hình 18.1 minh hoạ ý tưởng này.

> **Hình 18.1.** Một danh sách mutable được dùng chung giữa nhiều class. Rất khó để hiểu ai là chủ sở hữu của danh sách đó.

Hãy hình dung một hệ thống không thay đổi (mutate) bất kỳ cấu trúc dữ liệu nào. Hệ thống đó sẽ là một giấc mơ đối với việc bảo trì, bởi vì bạn sẽ không gặp phải bất kỳ bất ngờ khó chịu nào kiểu như có một đối tượng ở đâu đó bất thình lình sửa đổi một cấu trúc dữ liệu. Một phương thức không sửa đổi trạng thái của class bao quanh nó, cũng không sửa đổi trạng thái của bất kỳ đối tượng nào khác, và trả về toàn bộ kết quả của mình thông qua `return`, được gọi là *pure* (thuần khiết) hay *side-effect-free* (không có side effect).

Vậy thế nào thì được xem là một side effect? Nói ngắn gọn, side effect là một hành động không được bao trọn bên trong bản thân hàm. Dưới đây là một vài ví dụ:

- Sửa đổi một cấu trúc dữ liệu tại chỗ, bao gồm cả việc gán giá trị cho bất kỳ field nào, ngoại trừ việc khởi tạo bên trong constructor (chẳng hạn các phương thức setter)
- Ném ra một ngoại lệ
- Thực hiện các thao tác I/O như ghi vào một file

Một cách khác để nhìn nhận ý tưởng "không có side effect" là xét đến các đối tượng immutable. Một đối tượng immutable là đối tượng không thể thay đổi trạng thái của nó sau khi được khởi tạo, do đó nó không thể bị ảnh hưởng bởi các hành động của một hàm. Khi các đối tượng immutable được khởi tạo, chúng không bao giờ có thể rơi vào một trạng thái ngoài dự kiến. Bạn có thể chia sẻ chúng mà không cần phải sao chép, và chúng an toàn với đa luồng (thread-safe) bởi vì chúng không thể bị sửa đổi.

Ý tưởng "không có side effect" thoạt nhìn có vẻ là một ràng buộc hết sức khắt khe, và bạn có thể hoài nghi liệu các hệ thống thực tế có thể được xây dựng theo cách này hay không. Chúng tôi hy vọng sẽ thuyết phục được bạn rằng chúng hoàn toàn có thể được xây dựng như vậy, vào lúc bạn đọc xong chương này. Tin tốt là các thành phần của những hệ thống chấp nhận ý tưởng này có thể tận dụng tính song song đa lõi (multicore parallelism) mà không cần dùng đến khoá, bởi vì các phương thức không còn có thể can thiệp lẫn nhau nữa. Thêm vào đó, khái niệm này rất tuyệt vời cho việc hiểu ngay lập tức những phần nào của chương trình là độc lập với nhau.

Những ý tưởng này đến từ functional programming, chủ đề mà chúng ta sẽ chuyển sang trong mục tiếp theo.

### 18.1.2. Declarative programming

Trước tiên, chúng ta khám phá ý tưởng declarative programming, nền tảng mà functional programming dựa trên.

Có hai cách nghĩ về việc xây dựng một hệ thống bằng cách viết chương trình. Một cách tập trung vào việc *mọi thứ được làm như thế nào*. (Đầu tiên làm cái này, rồi cập nhật cái kia, và cứ thế.) Chẳng hạn, nếu bạn muốn tính toán giao dịch đắt nhất trong một danh sách, bạn thường sẽ thực thi một chuỗi các lệnh. (Lấy một giao dịch từ danh sách và so sánh nó với giao dịch đắt nhất tạm thời; nếu nó đắt hơn, nó trở thành giao dịch đắt nhất tạm thời; lặp lại với giao dịch tiếp theo trong danh sách, và cứ thế.)

Phong cách lập trình "như thế nào" này rất phù hợp với lập trình hướng đối tượng cổ điển (đôi khi được gọi là *imperative programming* — lập trình mệnh lệnh), bởi vì nó có những câu lệnh mô phỏng vốn từ vựng ở mức thấp của máy tính (chẳng hạn phép gán, rẽ nhánh có điều kiện và vòng lặp), như trong đoạn code sau:

```java
Transaction mostExpensive = transactions.get(0);
if (mostExpensive == null)
    throw new IllegalArgumentException("Empty list of transactions");
for (Transaction t : transactions.subList(1, transactions.size())) {
    if (t.getValue() > mostExpensive.getValue()) {
        mostExpensive = t;
    }
}
```

Cách còn lại tập trung vào việc *cái gì cần được làm*. Bạn đã thấy ở chương 4 và 5 rằng bằng cách dùng Streams API, bạn có thể diễn đạt truy vấn này như sau:

```java
Optional<Transaction> mostExpensive =
    transactions.stream()
                .max(comparing(Transaction::getValue));
```

Chi tiết tinh vi về việc truy vấn này được cài đặt như thế nào được để lại cho thư viện lo. Chúng ta gọi ý tưởng này là *internal iteration*. Ưu điểm lớn là truy vấn của bạn đọc lên giống như chính phát biểu bài toán, và vì lý do đó nó rõ ràng ngay lập tức, so với việc phải cố gắng hiểu xem một chuỗi các câu lệnh làm gì.

Phong cách "cái gì" này thường được gọi là *declarative programming*. Bạn cung cấp các quy tắc nói lên điều bạn muốn, và bạn kỳ vọng hệ thống sẽ quyết định cách đạt được mục tiêu đó. Kiểu lập trình này rất tuyệt vời bởi vì nó đọc lên gần với phát biểu bài toán hơn.

### 18.1.3. Tại sao lại là functional programming?

Functional programming là hiện thân điển hình của ý tưởng declarative programming (nói ra điều bạn muốn bằng những biểu thức không tương tác với nhau, và hệ thống có thể chọn cách cài đặt) cùng với tính toán không có side effect (side-effect-free computation) đã được giải thích ở phần trước của chương này. Hai ý tưởng này có thể giúp bạn xây dựng và bảo trì hệ thống dễ dàng hơn.

Lưu ý rằng một số tính năng nhất định của ngôn ngữ, chẳng hạn như tổ hợp các thao tác (composing operations) và truyền hành vi (passing behaviors) — những thứ chúng tôi đã trình bày ở chương 3 thông qua lambda expression — là bắt buộc để có thể đọc và viết code một cách tự nhiên theo phong cách declarative. Khi dùng stream, bạn có thể xâu chuỗi nhiều thao tác lại với nhau để diễn đạt một truy vấn phức tạp. Những tính năng này chính là đặc trưng của các ngôn ngữ functional programming. Chúng ta sẽ xem xét kỹ hơn những tính năng này dưới lăng kính của combinator ở chương 19.

Để cuộc thảo luận trở nên cụ thể và kết nối nó với các tính năng mới trong Java 8, ở mục tiếp theo chúng ta sẽ định nghĩa một cách cụ thể ý tưởng functional programming và cách nó được thể hiện trong Java. Chúng tôi muốn truyền tải sự thật rằng bằng cách sử dụng phong cách functional programming, bạn có thể viết những chương trình nghiêm túc mà không cần dựa vào side effect.

## 18.2. Functional programming là gì?

Câu trả lời quá đơn giản cho câu hỏi "Functional programming là gì?" chính là "Lập trình bằng các hàm". Vậy hàm là gì?

Thật dễ hình dung một phương thức nhận vào một `int` và một `double` làm đối số rồi tạo ra một `double` — đồng thời cũng có side effect là đếm số lần nó được gọi bằng cách cập nhật một biến mutable, như minh hoạ ở hình 18.2.

> **Hình 18.2.** Một hàm có side effect

Tuy nhiên, trong ngữ cảnh của functional programming, một hàm tương ứng với một hàm toán học: nó nhận không hoặc nhiều đối số, trả về một hoặc nhiều kết quả, và không có side effect. Bạn có thể xem một hàm như một chiếc hộp đen nhận vào một số đầu vào và tạo ra một số đầu ra, như minh hoạ ở hình 18.3.

> **Hình 18.3.** Một hàm không có side effect

Sự phân biệt giữa loại hàm này với các phương thức mà bạn thấy trong những ngôn ngữ lập trình như Java là điều cốt lõi. (Ý nghĩ rằng các hàm toán học như `log` hay `sin` lại có thể có những side effect như vậy là điều không tưởng.) Cụ thể, các hàm toán học luôn trả về cùng một kết quả khi chúng được gọi lặp đi lặp lại với cùng các đối số. Đặc trưng này loại trừ những phương thức như `Random.nextInt`, và chúng ta sẽ bàn thêm về khái niệm referential transparency này ở mục 18.2.2.

Khi chúng tôi nói *functional*, chúng tôi muốn nói là giống như trong toán học, không có side effect. Giờ đây một sự tinh tế về mặt lập trình xuất hiện. Chúng ta muốn nói đến điều nào: Phải chăng mọi hàm chỉ được xây dựng từ các hàm khác và các ý tưởng toán học như if-then-else? Hay một hàm có thể làm những việc phi-hàm ở bên trong, miễn là nó không phơi bày bất kỳ side effect nào ra phần còn lại của hệ thống? Nói cách khác, nếu lập trình viên thực hiện một side effect mà bên gọi không thể quan sát được, thì side effect đó có tồn tại hay không? Bên gọi không cần biết hay quan tâm, bởi vì nó không thể ảnh hưởng đến họ.

Để nhấn mạnh sự khác biệt này, chúng tôi gọi cái thứ nhất là *pure functional programming* và cái thứ hai là *functional-style programming* (lập trình theo phong cách hàm).

### 18.2.1. Java theo phong cách hàm

Trên thực tế, bạn không thể lập trình hoàn toàn theo phong cách pure functional trong Java. Chẳng hạn, mô hình I/O của Java gồm toàn những phương thức có side effect. (Việc gọi `Scanner.nextLine` có side effect là tiêu thụ một dòng từ file, nên gọi nó hai lần thường tạo ra kết quả khác nhau.) Tuy vậy, ta vẫn có thể viết các thành phần cốt lõi của hệ thống như thể chúng là thuần hàm. Trong Java, bạn sẽ viết những chương trình theo functional-style.

Trước tiên, còn có thêm một sự tinh tế nữa về việc "không ai nhìn thấy side effect của bạn", và do đó về ý nghĩa của từ *functional*. Giả sử một hàm hoặc một phương thức không có side effect nào ngoại trừ việc tăng một field lên khi vào và giảm nó xuống trước khi thoát ra. Từ góc nhìn của một chương trình chỉ gồm một luồng duy nhất, phương thức này không có side effect nào nhìn thấy được và có thể được coi là theo phong cách hàm. Mặt khác, nếu một luồng khác có thể kiểm tra field đó — hoặc có thể gọi phương thức đó một cách đồng thời — thì phương thức này sẽ không còn mang tính hàm nữa. Bạn có thể che giấu vấn đề này bằng cách bọc thân phương thức trong một khoá, điều này cho phép bạn lập luận rằng phương thức là mang tính hàm. Nhưng khi làm vậy, bạn sẽ mất khả năng thực thi song song hai lời gọi đến phương thức đó bằng hai lõi trên bộ xử lý đa lõi của mình. Side effect của bạn có thể không nhìn thấy được đối với chương trình, nhưng nó lại nhìn thấy được đối với lập trình viên dưới dạng tốc độ thực thi chậm hơn.

Nguyên tắc của chúng tôi là: để được xem là theo phong cách hàm, một hàm hoặc phương thức chỉ được phép mutate các biến cục bộ. Ngoài ra, các đối tượng mà nó tham chiếu tới nên là immutable — nghĩa là, tất cả các field đều là `final`, và tất cả các field thuộc kiểu tham chiếu đều trỏ, một cách bắc cầu, tới những đối tượng immutable khác. Về sau, bạn có thể cho phép việc cập nhật các field của những đối tượng vừa mới được tạo ra bên trong phương thức, bởi vì chúng không nhìn thấy được từ nơi khác và không được lưu lại để ảnh hưởng đến kết quả của một lời gọi sau đó.

Tuy nhiên, nguyên tắc của chúng tôi vẫn chưa đầy đủ. Có thêm một yêu cầu nữa để được xem là mang tính hàm, đó là một hàm hoặc phương thức không nên ném ra bất kỳ ngoại lệ nào. Lý do biện minh là việc ném ra một ngoại lệ đồng nghĩa với việc một kết quả đang được báo hiệu theo cách khác với việc hàm trả về một giá trị; hãy xem mô hình hộp đen ở hình 18.2. Vẫn còn không gian để tranh luận ở đây, với một số tác giả lập luận rằng những ngoại lệ không được bắt, đại diện cho các lỗi nghiêm trọng, thì vẫn chấp nhận được, và rằng chính hành động bắt một ngoại lệ mới là thứ đại diện cho luồng điều khiển phi-hàm. Tuy nhiên, việc sử dụng ngoại lệ như vậy vẫn phá vỡ phép ẩn dụ đơn giản "truyền đối số vào, trả kết quả ra" được mô tả trong mô hình hộp đen, dẫn đến một mũi tên thứ ba đại diện cho ngoại lệ, như minh hoạ ở hình 18.4.

> **Hình 18.4.** Một hàm ném ra ngoại lệ

> **Hàm và hàm bộ phận (partial function)**
>
> Trong toán học, một hàm được yêu cầu phải cho ra đúng một kết quả cho mỗi giá trị đối số khả dĩ. Nhưng nhiều phép toán thông dụng trong toán học lại thuộc về cái mà đúng ra phải gọi là *partial function* (hàm bộ phận). Nghĩa là, với một số hoặc phần lớn các giá trị đầu vào, chúng cho ra đúng một kết quả, nhưng với các giá trị đầu vào khác, chúng không xác định và hoàn toàn không cho ra kết quả nào. Một ví dụ là phép chia khi toán hạng thứ hai bằng không, hoặc `sqrt` khi đối số của nó âm. Trong Java, chúng ta thường mô hình hoá những tình huống này bằng cách ném ra một ngoại lệ.
>
> Vậy làm sao bạn có thể biểu diễn những hàm như phép chia mà không dùng ngoại lệ? Hãy dùng các kiểu như `Optional<T>`. Thay vì có chữ ký "`double sqrt(double)` nhưng có thể ném ra ngoại lệ", `sqrt` sẽ có chữ ký `Optional<Double> sqrt(double)`. Hoặc là nó trả về một giá trị biểu thị thành công, hoặc là nó chỉ ra ngay trong giá trị trả về rằng nó không thể thực hiện được thao tác được yêu cầu. Và đúng vậy, làm như thế có nghĩa là bên gọi cần kiểm tra xem liệu mỗi lời gọi phương thức có dẫn đến một `Optional` rỗng hay không. Điều này nghe có vẻ là một chuyện to tát, nhưng một cách thực dụng, với chỉ dẫn của chúng tôi về functional-style programming so với pure functional programming, bạn có thể chọn sử dụng ngoại lệ ở phạm vi cục bộ nhưng không phơi bày chúng qua các interface ở quy mô lớn, nhờ đó thu được các lợi ích của phong cách hàm mà không gặp rủi ro phình to code.

Để được xem là mang tính hàm, hàm hoặc phương thức của bạn chỉ nên gọi những hàm thư viện có side effect mà bạn có thể che giấu được hành vi phi-hàm của chúng (nghĩa là, đảm bảo rằng mọi thay đổi mà chúng thực hiện trên các cấu trúc dữ liệu đều được giấu khỏi bên gọi của bạn, có lẽ bằng cách sao chép trước và bằng cách bắt mọi ngoại lệ). Ở mục 18.2.4, bạn sẽ che giấu việc sử dụng hàm thư viện có side effect là `List.add` bên trong một phương thức `insertAll` bằng cách sao chép danh sách.

Bạn thường có thể đánh dấu những quy định này bằng cách dùng comment hoặc khai báo một phương thức với một annotation đánh dấu — và điều này khớp với những ràng buộc mà bạn đã đặt ra cho các hàm được truyền vào những thao tác xử lý parallel stream như `Stream.map` ở các chương 4–7.

Cuối cùng, vì các lý do thực dụng, bạn có thể thấy tiện lợi khi code theo phong cách hàm vẫn có thể xuất thông tin gỡ lỗi ra một dạng file log nào đó. Đoạn code này không thể được mô tả một cách chặt chẽ là mang tính hàm, nhưng trên thực tế, bạn vẫn giữ được phần lớn các lợi ích của functional-style programming.

### 18.2.2. Referential transparency

Những ràng buộc về việc không có side effect nhìn thấy được (không thay đổi cấu trúc mà bên gọi nhìn thấy, không I/O, không ngoại lệ) mã hoá nên khái niệm *referential transparency* (tính trong suốt tham chiếu). Một hàm là referentially transparent nếu nó luôn trả về cùng một giá trị kết quả khi được gọi với cùng một giá trị đối số. Chẳng hạn, phương thức `String.replace` là referentially transparent bởi vì `"raoul".replace('r', 'R')` luôn tạo ra cùng một kết quả (`replace` trả về một `String` mới với tất cả chữ `r` thường được thay bằng chữ `R` hoa) chứ không cập nhật đối tượng `this` của nó, nên nó có thể được xem là một hàm.

Nói theo cách khác, một hàm luôn tạo ra cùng một kết quả với cùng một đầu vào, bất kể nó được gọi ở đâu và khi nào. Điều này cũng giải thích tại sao `Random.nextInt` không được xem là mang tính hàm. Trong Java, việc dùng một đối tượng `Scanner` để lấy dữ liệu nhập từ bàn phím của người dùng vi phạm referential transparency, bởi vì gọi phương thức `nextLine` có thể tạo ra một kết quả khác nhau ở mỗi lần gọi. Nhưng việc cộng hai biến `int` được khai báo `final` thì luôn tạo ra cùng một kết quả, bởi vì nội dung của các biến đó không bao giờ có thể thay đổi.

Referential transparency là một tính chất tuyệt vời cho việc hiểu chương trình. Nó cũng bao hàm phép tối ưu hoá "lưu lại thay vì tính lại" cho những thao tác tốn kém hoặc tồn tại lâu dài, một quá trình mang tên memoization hoặc caching. Mặc dù quan trọng, chủ đề này hơi lạc đề ở đây, nên chúng ta sẽ bàn về nó ở chương 19.

Java có một chút phức tạp liên quan đến referential transparency. Giả sử bạn thực hiện hai lời gọi tới một phương thức trả về một `List`. Hai lời gọi này có thể trả về các tham chiếu đến hai danh sách khác biệt trong bộ nhớ nhưng lại chứa cùng các phần tử. Nếu những danh sách này được xem là các giá trị hướng đối tượng mutable (và do đó là không đồng nhất với nhau), thì phương thức đó không phải là referentially transparent. Nếu bạn dự định sử dụng những danh sách này như các giá trị thuần khiết (immutable), thì việc xem các giá trị đó là bằng nhau là hợp lý, và như vậy hàm là referentially transparent. Nói chung, trong code theo phong cách hàm, bạn chọn cách xem những hàm như vậy là referentially transparent.

Ở mục tiếp theo, chúng ta khám phá câu hỏi có nên mutate hay không từ một góc nhìn rộng hơn.

### 18.2.3. Lập trình hướng đối tượng so với lập trình theo phong cách hàm

Chúng ta bắt đầu bằng cách đối chiếu functional-style programming với lập trình hướng đối tượng cổ điển (ở dạng cực đoan) trước khi nhận ra rằng Java 8 xem những phong cách này chỉ đơn thuần là hai thái cực trên phổ hướng đối tượng. Là một lập trình viên Java, dù không ý thức nghĩ về nó, gần như chắc chắn bạn đang sử dụng một số khía cạnh của functional-style programming và một số khía cạnh của cái mà chúng ta sẽ gọi là lập trình hướng đối tượng cực đoan. Như chúng tôi đã nhận xét ở chương 1, những thay đổi về phần cứng (chẳng hạn đa lõi) và về kỳ vọng của lập trình viên (chẳng hạn các truy vấn kiểu cơ sở dữ liệu để thao tác trên dữ liệu) đang đẩy các phong cách công nghệ phần mềm Java về phía đầu hàm của cái phổ này, và một trong những mục tiêu của cuốn sách này là giúp bạn thích nghi với bầu không khí đang thay đổi đó.

Ở một đầu của phổ là quan điểm hướng đối tượng cực đoan: mọi thứ đều là đối tượng, và các chương trình vận hành bằng cách cập nhật các field và gọi các phương thức mà những phương thức đó lại cập nhật đối tượng gắn với chúng. Ở đầu kia của phổ là phong cách functional programming referentially transparent, không có sự thay đổi (nhìn thấy được) nào. Trên thực tế, các lập trình viên Java luôn luôn pha trộn các phong cách này. Bạn có thể duyệt một cấu trúc dữ liệu bằng cách dùng một `Iterator` chứa trạng thái nội tại mutable, nhưng lại dùng nó để tính, chẳng hạn, tổng các giá trị trong cấu trúc dữ liệu theo một cách mang phong cách hàm. (Trong Java, như đã bàn ở trên, quá trình này có thể bao gồm việc mutate các biến cục bộ.) Một trong những mục tiêu của chương này và chương 19 là thảo luận các kỹ thuật lập trình và giới thiệu các tính năng từ functional programming để giúp bạn viết những chương trình có tính module cao hơn và phù hợp hơn với các bộ xử lý đa lõi. Hãy xem những ý tưởng này như những vũ khí bổ sung trong kho vũ khí lập trình của bạn.

### 18.2.4. Phong cách hàm trong thực tế

Để bắt đầu, hãy giải một bài tập lập trình thường được giao cho sinh viên mới học, một bài tập minh hoạ rất rõ phong cách hàm: cho một giá trị `List<Integer>`, chẳng hạn `{1, 4, 9}`, hãy dựng nên một giá trị `List<List<Integer>>` mà các phần tử của nó là tất cả các tập con của `{1, 4, 9}`, theo thứ tự bất kỳ. Các tập con của `{1, 4, 9}` là `{1, 4, 9}`, `{1, 4}`, `{1, 9}`, `{4, 9}`, `{1}`, `{4}`, `{9}` và `{}`.

Có tám tập con, bao gồm cả tập con rỗng, được viết là `{}`. Mỗi tập con được biểu diễn bằng kiểu `List<Integer>`, điều đó có nghĩa là câu trả lời có kiểu `List<List<Integer>>`.

Sinh viên thường gặp khó khăn khi nghĩ về việc bắt đầu từ đâu và cần được gợi ý[^2] bằng nhận xét: "Các tập con của `{1, 4, 9}` hoặc là chứa 1, hoặc là không." Những tập con không chứa 1 chính là các tập con của `{4, 9}`, còn những tập con có chứa 1 có thể thu được bằng cách lấy các tập con của `{4, 9}` rồi chèn 1 vào mỗi tập con đó. Tuy nhiên có một điểm tinh tế: chúng ta phải nhớ rằng tập rỗng có đúng một tập con — chính nó. Cách hiểu này cho bạn một lời giải dễ dàng, tự nhiên, theo hướng top-down, mang phong cách functional programming trong Java như sau:[^3]

[^2]: Những sinh viên khó chiều (và sáng dạ!) thỉnh thoảng chỉ ra một mẹo lập trình gọn gàng liên quan đến biểu diễn nhị phân của các số. (Code lời giải Java tương ứng với 000, 001, 010, 011, 100, 101, 110, 111.) Với những sinh viên như vậy, chúng tôi bảo họ hãy tính danh sách tất cả các hoán vị của một danh sách; với ví dụ `{1, 4, 9}` thì có sáu hoán vị.

[^3]: Để cho cụ thể, code chúng tôi đưa ra ở đây dùng `List<Integer>`, nhưng bạn có thể thay nó trong các định nghĩa phương thức bằng `List<T>` tổng quát; khi đó bạn có thể áp dụng phương thức `subsets` đã cập nhật cho cả `List<String>` lẫn `List<Integer>`.

```java
static List<List<Integer>> subsets(List<Integer> list) {
    // Nếu danh sách đầu vào rỗng, nó có đúng một tập con: chính danh sách rỗng.
    if (list.isEmpty()) {
        List<List<Integer>> ans = new ArrayList<>();
        ans.add(Collections.emptyList());
        return ans;
    }
    // Ngược lại, lấy ra một phần tử fst, rồi tìm mọi tập con của phần còn lại
    // để có subAns; subAns tạo thành một nửa câu trả lời.
    Integer fst = list.get(0);
    List<Integer> rest = list.subList(1, list.size());
    List<List<Integer>> subAns = subsets(rest);
    // Nửa còn lại của câu trả lời, subAns2, gồm tất cả các danh sách trong subAns
    // nhưng được điều chỉnh bằng cách thêm fst vào đầu mỗi danh sách phần tử đó.
    List<List<Integer>> subAns2 = insertAll(fst, subAns);
    // Sau đó nối hai nửa câu trả lời lại với nhau.
    return concat(subAns, subAns2);
}
```

Chương trình lời giải này tạo ra `{{}, {9}, {4}, {4, 9}, {1}, {1, 9}, {1, 4}, {1, 4, 9}}` khi được cho `{1, 4, 9}` làm đầu vào. Hãy thử chạy nó khi bạn đã định nghĩa xong hai phương thức còn thiếu.

Nhìn lại, bạn đã giả định rằng hai phương thức còn thiếu là `insertAll` và `concat` bản thân chúng mang tính hàm, và suy ra rằng hàm `subsets` của bạn cũng mang tính hàm, bởi vì không có thao tác nào trong nó mutate bất kỳ cấu trúc hiện có nào. (Nếu bạn quen thuộc với toán học, bạn sẽ nhận ra lập luận này chính là quy nạp.)

Bây giờ hãy nhìn vào việc định nghĩa `insertAll`. Đây là điểm nguy hiểm đầu tiên. Giả sử bạn định nghĩa `insertAll` sao cho nó mutate các đối số của mình, có lẽ bằng cách cập nhật tất cả các phần tử của `subAns` để chúng chứa `fst`. Khi đó chương trình sẽ khiến `subAns` bị sửa đổi theo đúng cách như `subAns2` một cách sai lệch, dẫn đến một câu trả lời chứa tám bản sao của `{1,4,9}` một cách bí ẩn. Thay vào đó, hãy định nghĩa `insertAll` theo kiểu hàm như sau:

```java
static List<List<Integer>> insertAll(Integer fst,
                                     List<List<Integer>> lists) {
    List<List<Integer>> result = new ArrayList<>();
    for (List<Integer> list : lists) {
        // Sao chép danh sách để bạn có thể thêm vào nó. Bạn sẽ không sao chép
        // cấu trúc ở mức thấp hơn ngay cả khi nó là mutable. (Integer không mutable.)
        List<Integer> copyList = new ArrayList<>();
        copyList.add(fst);
        copyList.addAll(list);
        result.add(copyList);
    }
    return result;
}
```

Lưu ý rằng bạn đang tạo ra một `List` mới chứa tất cả các phần tử của `subAns`. Bạn tận dụng thực tế là một đối tượng `Integer` là immutable; nếu không, bạn sẽ phải nhân bản (clone) từng phần tử nữa. Việc tập trung suy nghĩ về những phương thức như `insertAll` theo hướng mang tính hàm cho bạn một nơi tự nhiên để đặt toàn bộ đoạn code sao chép cẩn thận này: bên trong `insertAll` chứ không phải ở những nơi gọi nó.

Cuối cùng, bạn cần định nghĩa phương thức `concat`. Trong trường hợp này, lời giải rất đơn giản, nhưng chúng tôi khẩn khoản đề nghị bạn đừng dùng nó; chúng tôi chỉ đưa nó ra để bạn có thể so sánh các phong cách khác nhau:

```java
static List<List<Integer>> concat(List<List<Integer>> a,
                                  List<List<Integer>> b) {
    a.addAll(b);
    return a;
}
```

Thay vào đó, chúng tôi đề nghị bạn viết đoạn code này:

```java
static List<List<Integer>> concat(List<List<Integer>> a,
                                  List<List<Integer>> b) {
    List<List<Integer>> r = new ArrayList<>(a);
    r.addAll(b);
    return r;
}
```

Tại sao? Phiên bản thứ hai của `concat` là một pure function. Hàm này có thể đang sử dụng sự thay đổi (thêm phần tử vào danh sách `r`) ở bên trong, nhưng nó trả về một kết quả dựa trên các đối số của nó và không sửa đổi bất kỳ đối số nào trong số đó. Ngược lại, phiên bản đầu tiên dựa vào thực tế là sau lời gọi `concat(subAns, subAns2)`, không còn ai tham chiếu tới giá trị của `subAns` nữa. Với định nghĩa `subsets` của chúng ta, tình huống đúng là như vậy, nên chắc chắn dùng phiên bản `concat` rẻ hơn sẽ tốt hơn. Câu trả lời phụ thuộc vào việc bạn định giá thời gian của mình như thế nào. Hãy so sánh khoảng thời gian mà sau này bạn sẽ phải bỏ ra để truy tìm những con bug khó hiểu với chi phí bổ sung của việc tạo một bản sao.

Dù bạn có comment kỹ đến đâu rằng phiên bản `concat` không thuần khiết kia "chỉ được dùng khi đối số đầu tiên có thể bị ghi đè tuỳ ý, và chỉ có ý định dùng trong phương thức `subsets`, và mọi thay đổi đối với `subsets` đều phải được xem xét lại dưới ánh sáng của comment này", thì rồi vào một lúc nào đó sẽ có ai đó thấy nó hữu ích trong một đoạn code nào đó mà ở đó nó có vẻ như chạy đúng. Cơn ác mộng gỡ lỗi trong tương lai của bạn đã ra đời. Chúng ta sẽ quay lại vấn đề này ở chương 19.

Điều rút ra: suy nghĩ về các bài toán lập trình theo hướng những phương thức mang phong cách hàm, chỉ được đặc trưng bởi các đối số đầu vào và kết quả đầu ra của chúng (làm *cái gì*), thường hiệu quả hơn nhiều so với việc nghĩ về việc *làm như thế nào* và cần mutate cái gì quá sớm trong chu trình thiết kế.

Ở mục tiếp theo, chúng ta sẽ thảo luận chi tiết về recursion.

## 18.3. Recursion so với iteration

Recursion là một kỹ thuật được functional programming đề cao nhằm giúp bạn tư duy theo phong cách "làm cái gì". Các ngôn ngữ pure functional programming thường không có các cấu trúc lặp như vòng lặp `while` và `for`. Những cấu trúc như vậy thường là những lời mời gọi ngầm dẫn đến việc dùng mutation. Chẳng hạn, điều kiện trong một vòng lặp `while` cần được cập nhật; nếu không, vòng lặp sẽ thực thi không lần nào hoặc thực thi vô hạn lần. Tuy nhiên, trong nhiều trường hợp, vòng lặp vẫn hoàn toàn ổn. Chúng tôi đã lập luận rằng với phong cách hàm, bạn được phép mutate nếu không ai thấy bạn làm điều đó, nên việc mutate các biến cục bộ là chấp nhận được. Khi bạn dùng vòng lặp for-each trong Java, `for(Apple apple : apples) { }`, nó được biên dịch thành `Iterator` như sau:

```java
Iterator<Apple> it = apples.iterator();
while (it.hasNext()) {
    Apple apple = it.next();
    // ...
}
```

Phép chuyển đổi này không phải là vấn đề, bởi vì những thay đổi (thay đổi trạng thái của `Iterator` bằng phương thức `next` và gán giá trị cho biến `apple` bên trong thân vòng `while`) là không nhìn thấy được đối với bên gọi phương thức nơi những thay đổi đó diễn ra. Nhưng khi bạn dùng một vòng lặp for-each, chẳng hạn cho một thuật toán tìm kiếm, thì đoạn code sau đây lại có vấn đề, bởi vì thân vòng lặp đang cập nhật một cấu trúc dữ liệu được dùng chung với bên gọi:

```java
public void searchForGold(List<String> l, Stats stats) {
    for (String s : l) {
        if ("gold".equals(s)) {
            stats.incrementFor("gold");
        }
    }
}
```

Quả thật, thân vòng lặp có một side effect không thể xem nhẹ như là phong cách hàm được: nó mutate trạng thái của đối tượng `stats`, vốn được dùng chung với các phần khác của chương trình.

Vì lý do này, các ngôn ngữ pure functional programming như Haskell loại bỏ những thao tác có side effect như vậy. Vậy bạn phải viết chương trình như thế nào? Câu trả lời về mặt lý thuyết là mọi chương trình đều có thể được viết lại để tránh iteration bằng cách dùng recursion thay thế, và recursion thì không đòi hỏi tính mutable. Việc dùng recursion cho phép bạn loại bỏ các biến lặp vốn được cập nhật ở từng bước. Một bài toán kinh điển ở trường học là tính hàm giai thừa (với các đối số dương) theo cách lặp và theo cách đệ quy (giả sử đầu vào > 0), như hai listing sau đây minh hoạ.

**Listing 18.1. Giai thừa theo kiểu lặp**

```java
static long factorialIterative(long n) {
    long r = 1;
    for (int i = 1; i <= n; i++) {
        r *= i;
    }
    return r;
}
```

**Listing 18.2. Giai thừa theo kiểu đệ quy**

```java
static long factorialRecursive(long n) {
    return n == 1 ? 1 : n * factorialRecursive(n - 1);
}
```

Listing thứ nhất minh hoạ dạng dựa trên vòng lặp tiêu chuẩn: các biến `r` và `i` được cập nhật ở mỗi vòng lặp. Listing thứ hai cho thấy một định nghĩa đệ quy (hàm tự gọi chính nó) ở một dạng quen thuộc hơn về mặt toán học. Trong Java, các dạng đệ quy thường kém hiệu quả hơn, như chúng ta sẽ bàn ngay sau ví dụ tiếp theo.

Tuy nhiên, nếu bạn đã đọc các chương trước của cuốn sách này, bạn biết rằng stream trong Java 8 cung cấp một cách định nghĩa giai thừa theo hướng declarative còn đơn giản hơn nữa, như listing sau đây cho thấy.

**Listing 18.3. Giai thừa dùng stream**

```java
static long factorialStreams(long n) {
    return LongStream.rangeClosed(1, n)
                     .reduce(1, (long a, long b) -> a * b);
}
```

Giờ chúng ta sẽ chuyển sang bàn về hiệu năng. Là những người dùng Java, hãy cảnh giác với những kẻ cuồng tín functional programming nói với bạn rằng bạn luôn luôn nên dùng recursion thay cho iteration. Nói chung, việc thực hiện một lời gọi hàm đệ quy tốn kém hơn rất nhiều so với việc phát ra một lệnh rẽ nhánh ở mức máy — thứ duy nhất cần thiết để lặp. Mỗi lần hàm `factorialRecursive` được gọi, một stack frame mới được tạo ra trên call stack để lưu trạng thái của mỗi lời gọi hàm (phép nhân mà nó cần thực hiện) cho đến khi quá trình đệ quy kết thúc. Định nghĩa đệ quy của giai thừa chiếm lượng bộ nhớ tỉ lệ thuận với đầu vào của nó. Vì lý do này, nếu bạn chạy `factorialRecursive` với một đầu vào lớn, nhiều khả năng bạn sẽ nhận được một `StackOverflowError`:

```text
Exception in thread "main" java.lang.StackOverflowError
```

Vậy recursion là vô dụng ư? Tất nhiên là không! Các ngôn ngữ hàm cung cấp một lời giải cho vấn đề này: tail-call optimization. Ý tưởng cơ bản là bạn có thể viết một định nghĩa đệ quy của giai thừa trong đó lời gọi đệ quy là việc cuối cùng xảy ra trong hàm (hay lời gọi đó nằm ở *vị trí đuôi* — tail position). Dạng phong cách đệ quy khác biệt này có thể được tối ưu hoá để chạy nhanh. Listing tiếp theo trình bày một định nghĩa giai thừa theo kiểu tail-recursive.

**Listing 18.4. Giai thừa tail-recursive**

```java
static long factorialTailRecursive(long n) {
    return factorialHelper(1, n);
}

static long factorialHelper(long acc, long n) {
    return n == 1 ? acc : factorialHelper(acc * n, n - 1);
}
```

Hàm `factorialHelper` là tail-recursive bởi vì lời gọi đệ quy là việc cuối cùng xảy ra trong hàm. Ngược lại, trong định nghĩa `factorialRecursive` trước đó, việc cuối cùng là một phép nhân giữa `n` và kết quả của một lời gọi đệ quy.

Dạng recursion này hữu ích bởi vì thay vì lưu mỗi kết quả trung gian của quá trình đệ quy trong các stack frame riêng biệt, compiler có thể quyết định tái sử dụng một stack frame duy nhất. Quả thật, trong định nghĩa của `factorialHelper`, các kết quả trung gian (các kết quả bộ phận của giai thừa) được truyền trực tiếp làm đối số cho hàm. Không cần phải theo dõi kết quả trung gian của mỗi lời gọi đệ quy trên một stack frame riêng biệt; nó có thể truy cập được trực tiếp thông qua đối số đầu tiên của `factorialHelper`. Hình 18.5 và 18.6 minh hoạ sự khác biệt giữa định nghĩa đệ quy và định nghĩa tail-recursive của giai thừa.

> **Hình 18.5.** Định nghĩa đệ quy của giai thừa, đòi hỏi nhiều stack frame

> **Hình 18.6.** Định nghĩa tail-recursive của giai thừa, có thể tái sử dụng một stack frame duy nhất

Tin xấu là Java không hỗ trợ kiểu tối ưu hoá này. Nhưng việc áp dụng tail recursion có thể là một thực hành tốt hơn so với recursion cổ điển, bởi vì nó mở đường cho khả năng compiler tối ưu hoá về sau. Nhiều ngôn ngữ JVM hiện đại như Scala, Groovy và Kotlin có thể tối ưu hoá những cách dùng recursion đó, khiến chúng tương đương với iteration (và thực thi với cùng tốc độ). Kết quả là những người theo trường phái thuần hàm có thể vừa giữ được sự thuần khiết của mình vừa thực thi hiệu quả.

Chỉ dẫn khi viết Java 8 là bạn thường có thể thay thế iteration bằng stream để tránh mutation. Ngoài ra, bạn có thể thay thế iteration bằng recursion khi recursion cho phép bạn viết một thuật toán theo cách súc tích hơn, không có side effect. Quả thật, recursion có thể khiến các ví dụ dễ đọc, dễ viết và dễ hiểu hơn (như trong ví dụ `subsets` đã trình bày ở phần trước của chương này), và hiệu suất của lập trình viên thường quan trọng hơn những khác biệt nhỏ về thời gian thực thi.

Trong mục này, chúng ta đã thảo luận về functional-style programming với ý niệm về một phương thức mang tính hàm; mọi điều chúng tôi nói ra đều đã có thể áp dụng cho phiên bản Java đầu tiên. Ở chương 19, chúng ta sẽ tìm hiểu những khả năng tuyệt vời và mạnh mẽ mà việc giới thiệu first-class function trong Java 8 mang lại.

## Tóm tắt

- Việc giảm bớt các cấu trúc dữ liệu mutable dùng chung có thể giúp bạn bảo trì và gỡ lỗi chương trình của mình về lâu dài.
- Functional-style programming đề cao các phương thức không có side effect và declarative programming.
- Các phương thức mang phong cách hàm chỉ được đặc trưng bởi các đối số đầu vào và kết quả đầu ra của chúng.
- Một hàm là referentially transparent nếu nó luôn trả về cùng một giá trị kết quả khi được gọi với cùng một giá trị đối số. Các cấu trúc lặp như vòng lặp `while` có thể được thay thế bằng recursion.
- Tail recursion có thể là một thực hành tốt hơn so với recursion cổ điển trong Java, bởi vì nó mở đường cho khả năng compiler tối ưu hoá.
