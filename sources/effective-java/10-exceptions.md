# Chương 10. Exceptions

Khi được sử dụng đúng cách, exception có thể cải thiện tính dễ đọc, độ tin cậy và khả năng bảo trì của chương trình. Khi bị sử dụng sai, chúng có thể gây ra tác dụng ngược lại. Chương này cung cấp các hướng dẫn để sử dụng exception một cách hiệu quả.

## Item 69: Chỉ dùng exception cho các tình huống ngoại lệ

Một ngày nào đó, nếu không may, bạn có thể tình cờ bắt gặp một đoạn code trông giống như thế này:

```java
// Horrible abuse of exceptions. Don't ever do this!
try {
    int i = 0;
    while(true)
        range[i++].climb();
} catch (ArrayIndexOutOfBoundsException e) {
}
```

Đoạn code này làm gì? Nhìn qua thì hoàn toàn không rõ ràng, và chỉ riêng điều đó đã là lý do đủ để không dùng nó (**Item 67**). Hóa ra đây là một idiom được nghĩ ra một cách tệ hại để lặp qua các phần tử của một mảng. Vòng lặp vô hạn kết thúc bằng cách ném ra, bắt lấy và bỏ qua một `ArrayIndexOutOfBoundsException` khi nó cố truy cập phần tử đầu tiên nằm ngoài giới hạn của mảng. Nó được cho là tương đương với idiom chuẩn để lặp qua một mảng, thứ mà bất kỳ lập trình viên Java nào cũng nhận ra ngay lập tức:

```java
for (Mountain m : range)
    m.climb();
```

Vậy tại sao lại có người dùng vòng lặp dựa trên exception thay vì cách đã được kiểm chứng? Đó là một nỗ lực sai lầm nhằm cải thiện hiệu năng, dựa trên lập luận sai rằng, vì VM đã kiểm tra giới hạn của mọi truy cập mảng, nên phép kiểm tra kết thúc vòng lặp thông thường—bị compiler che giấu nhưng vẫn hiện diện trong vòng lặp for-each—là dư thừa và nên được tránh. Có ba điểm sai trong lập luận này:

- Vì exception được thiết kế cho các tình huống ngoại lệ, những người triển khai JVM có rất ít động lực để làm cho chúng nhanh như các phép kiểm tra tường minh.

- Đặt code bên trong một khối `try-catch` sẽ ngăn cản một số tối ưu hóa mà các triển khai JVM lẽ ra có thể thực hiện.

- Idiom chuẩn để lặp qua một mảng không nhất thiết dẫn đến các phép kiểm tra dư thừa. Nhiều triển khai JVM tối ưu hóa loại bỏ chúng.

Trên thực tế, idiom dựa trên exception chậm hơn nhiều so với idiom chuẩn. Trên máy của tôi, idiom dựa trên exception chậm hơn khoảng hai lần so với idiom chuẩn với các mảng một trăm phần tử.

Vòng lặp dựa trên exception không chỉ làm mờ mục đích của code và giảm hiệu năng, mà nó còn không được đảm bảo hoạt động đúng. Nếu có bug trong vòng lặp, việc dùng exception để điều khiển luồng có thể che giấu bug đó, khiến quá trình debug trở nên phức tạp hơn rất nhiều. Giả sử phép tính trong thân vòng lặp gọi một method thực hiện truy cập ngoài giới hạn trên một mảng nào đó không liên quan. Nếu dùng một idiom vòng lặp hợp lý, bug đó sẽ sinh ra một exception không được bắt, khiến thread kết thúc ngay lập tức kèm theo stack trace đầy đủ. Nếu dùng vòng lặp dựa trên exception sai lầm kia, exception liên quan đến bug sẽ bị bắt và bị hiểu nhầm là sự kết thúc bình thường của vòng lặp.

Bài học của câu chuyện này rất đơn giản: **Exception, đúng như tên gọi của nó, chỉ nên được dùng cho các tình huống ngoại lệ; không bao giờ nên dùng chúng cho luồng điều khiển thông thường.** Nói rộng hơn, hãy ưu tiên các idiom chuẩn, dễ nhận biết hơn là các kỹ thuật quá khôn khéo tự nhận là mang lại hiệu năng tốt hơn. Ngay cả khi lợi thế hiệu năng là có thật, nó có thể không còn tồn tại trước sự cải tiến không ngừng của các triển khai nền tảng. Tuy nhiên, những bug tinh vi và những phiền toái bảo trì phát sinh từ các kỹ thuật quá khôn khéo thì chắc chắn sẽ còn mãi.

Nguyên tắc này cũng có hàm ý đối với việc thiết kế API. **Một API được thiết kế tốt không được buộc client của nó phải dùng exception cho luồng điều khiển thông thường.** Một class có method "phụ thuộc trạng thái" (state-dependent) chỉ có thể được gọi trong những điều kiện nhất định không thể đoán trước thì nói chung nên có một method "kiểm tra trạng thái" (state-testing) riêng, cho biết liệu có thích hợp để gọi method phụ thuộc trạng thái hay không. Ví dụ, interface `Iterator` có method phụ thuộc trạng thái `next` và method kiểm tra trạng thái tương ứng `hasNext`. Điều này cho phép idiom chuẩn để duyệt qua một collection bằng vòng lặp `for` truyền thống (cũng như vòng lặp for-each, trong đó method `hasNext` được dùng ngầm bên trong):

```java
for (Iterator<Foo> i = collection.iterator(); i.hasNext(); ) {
    Foo foo = i.next();
    ...
}
```

Nếu `Iterator` thiếu method `hasNext`, client sẽ buộc phải làm thế này thay vào đó:

```java
// Do not use this hideous code for iteration over a collection!
try {
    Iterator<Foo> i = collection.iterator();
    while(true) {
        Foo foo = i.next();
        ...
    }
} catch (NoSuchElementException e) {
}
```

Điều này hẳn trông rất quen thuộc sau ví dụ duyệt mảng ở đầu item này. Ngoài việc dài dòng và gây hiểu nhầm, vòng lặp dựa trên exception có khả năng hoạt động kém hiệu quả và có thể che giấu bug ở những phần không liên quan của hệ thống.

Một cách thay thế cho việc cung cấp một method kiểm tra trạng thái riêng là để method phụ thuộc trạng thái trả về một optional rỗng (**Item 55**) hoặc một giá trị đặc biệt (distinguished value) như `null` nếu nó không thể thực hiện phép tính mong muốn.

Dưới đây là một số hướng dẫn giúp bạn lựa chọn giữa method kiểm tra trạng thái và giá trị trả về optional hoặc giá trị đặc biệt. Nếu một object sẽ được truy cập đồng thời mà không có đồng bộ hóa bên ngoài, hoặc chịu các chuyển đổi trạng thái do bên ngoài gây ra, bạn phải dùng optional hoặc giá trị trả về đặc biệt, vì trạng thái của object có thể thay đổi trong khoảng thời gian giữa lời gọi method kiểm tra trạng thái và method phụ thuộc trạng thái. Các mối quan tâm về hiệu năng có thể đòi hỏi dùng optional hoặc giá trị trả về đặc biệt nếu một method kiểm tra trạng thái riêng sẽ lặp lại công việc của method phụ thuộc trạng thái. Trong điều kiện các yếu tố khác như nhau, method kiểm tra trạng thái được ưa chuộng hơn một chút so với giá trị trả về đặc biệt. Nó mang lại tính dễ đọc tốt hơn đôi chút, và việc sử dụng sai có thể dễ phát hiện hơn: nếu bạn quên gọi method kiểm tra trạng thái, method phụ thuộc trạng thái sẽ ném ra exception, khiến bug trở nên rõ ràng; nếu bạn quên kiểm tra giá trị trả về đặc biệt, bug có thể rất tinh vi. Đây không phải là vấn đề đối với giá trị trả về optional.

Tóm lại, exception được thiết kế cho các tình huống ngoại lệ. Đừng dùng chúng cho luồng điều khiển thông thường, và đừng viết những API buộc người khác phải làm như vậy.

## Item 70: Dùng checked exception cho các tình huống có thể khôi phục và runtime exception cho lỗi lập trình

Java cung cấp ba loại throwable: *checked exception*, *runtime exception* và *error*. Có một số nhầm lẫn trong giới lập trình viên về việc khi nào thì thích hợp để dùng từng loại throwable. Mặc dù quyết định này không phải lúc nào cũng rạch ròi, vẫn có một số quy tắc chung mang tính định hướng mạnh mẽ.

Quy tắc cốt yếu khi quyết định dùng checked hay unchecked exception là thế này: **dùng checked exception cho các tình huống mà người gọi có thể được kỳ vọng một cách hợp lý là sẽ khôi phục được.** Bằng cách ném ra một checked exception, bạn buộc người gọi phải xử lý exception đó trong một mệnh đề `catch` hoặc lan truyền nó ra ngoài. Do đó, mỗi checked exception mà một method được khai báo là ném ra là một chỉ dấu mạnh mẽ cho người dùng API rằng tình huống tương ứng là một kết quả có thể xảy ra khi gọi method đó.

Bằng cách đặt người dùng đối diện với một checked exception, người thiết kế API đưa ra một yêu cầu bắt buộc phải khôi phục từ tình huống đó. Người dùng có thể phớt lờ yêu cầu này bằng cách bắt exception và bỏ qua nó, nhưng đây thường là một ý tưởng tồi (**Item 77**).

Có hai loại throwable không được kiểm tra (unchecked): runtime exception và error. Chúng giống hệt nhau về hành vi: cả hai đều là những throwable không cần, và nói chung không nên, bị bắt. Nếu một chương trình ném ra một unchecked exception hoặc một error, thì thường là việc khôi phục là bất khả thi và việc tiếp tục thực thi sẽ gây hại nhiều hơn lợi. Nếu chương trình không bắt throwable như vậy, nó sẽ khiến thread hiện tại dừng lại với một thông báo lỗi thích hợp.

**Dùng runtime exception để chỉ ra lỗi lập trình.** Đại đa số runtime exception chỉ ra các *vi phạm tiền điều kiện* (precondition violation). Vi phạm tiền điều kiện đơn giản là việc client của một API không tuân thủ hợp đồng (contract) được thiết lập bởi đặc tả của API đó. Ví dụ, hợp đồng của phép truy cập mảng quy định rằng chỉ số mảng phải nằm trong khoảng từ không đến độ dài mảng trừ một, tính cả hai đầu. `ArrayIndexOutOfBoundsException` chỉ ra rằng tiền điều kiện này đã bị vi phạm.

Một vấn đề với lời khuyên này là không phải lúc nào cũng rõ ràng liệu bạn đang đối mặt với một tình huống có thể khôi phục hay một lỗi lập trình. Ví dụ, hãy xem xét trường hợp cạn kiệt tài nguyên, có thể do lỗi lập trình như cấp phát một mảng lớn bất hợp lý, hoặc do sự thiếu hụt tài nguyên thực sự. Nếu việc cạn kiệt tài nguyên là do sự thiếu hụt tạm thời hoặc do nhu cầu tăng cao tạm thời, thì tình huống này hoàn toàn có thể khôi phục được. Việc một trường hợp cạn kiệt tài nguyên cụ thể có khả năng cho phép khôi phục hay không là vấn đề phán đoán của người thiết kế API. Nếu bạn tin rằng một tình huống có khả năng cho phép khôi phục, hãy dùng checked exception; nếu không, hãy dùng runtime exception. Nếu không rõ liệu việc khôi phục có khả thi hay không, có lẽ bạn nên dùng unchecked exception, vì những lý do được thảo luận trong **Item 71**.

Mặc dù Đặc tả Ngôn ngữ Java (Java Language Specification) không yêu cầu, có một quy ước mạnh mẽ rằng *error* được dành riêng cho JVM sử dụng để chỉ ra sự thiếu hụt tài nguyên, sự thất bại của bất biến (invariant), hoặc các tình huống khác khiến việc tiếp tục thực thi là không thể. Với sự chấp nhận gần như phổ quát của quy ước này, tốt nhất là không triển khai bất kỳ subclass mới nào của `Error`. Do đó, **tất cả các unchecked throwable mà bạn triển khai đều nên là subclass của** `RuntimeException` (trực tiếp hoặc gián tiếp). Không những bạn không nên định nghĩa các subclass của `Error`, mà ngoại trừ `AssertionError`, bạn cũng không nên ném chúng ra.

Có thể định nghĩa một throwable không phải là subclass của `Exception`, `RuntimeException` hay `Error`. JLS không đề cập trực tiếp đến những throwable như vậy nhưng quy định một cách ngầm định rằng chúng hành xử như các checked exception thông thường (là các subclass của `Exception` nhưng không phải của `RuntimeException`). Vậy khi nào bạn nên dùng thứ quái dị này? Nói ngắn gọn là không bao giờ. Chúng không có lợi ích gì so với các checked exception thông thường và chỉ làm cho người dùng API của bạn thêm bối rối.

Những người thiết kế API thường quên rằng exception là những object hoàn chỉnh mà trên đó có thể định nghĩa các method tùy ý. Công dụng chính của những method như vậy là cung cấp cho code bắt exception thông tin bổ sung về tình huống đã khiến exception bị ném ra. Khi thiếu những method như vậy, đã có những lập trình viên phân tích (parse) biểu diễn chuỗi của exception để moi ra thông tin bổ sung. Đây là một thực hành cực kỳ tệ (**Item 12**). Các class throwable hiếm khi quy định chi tiết về biểu diễn chuỗi của chúng, nên biểu diễn chuỗi có thể khác nhau giữa các triển khai và giữa các bản phát hành. Do đó, code phân tích biểu diễn chuỗi của một exception có khả năng không khả chuyển (nonportable) và dễ đổ vỡ.

Vì checked exception nói chung chỉ ra các tình huống có thể khôi phục, việc chúng cung cấp các method đưa ra thông tin giúp người gọi khôi phục từ tình huống ngoại lệ là đặc biệt quan trọng. Ví dụ, giả sử một checked exception được ném ra khi một nỗ lực mua hàng bằng thẻ quà tặng thất bại do không đủ tiền. Exception đó nên cung cấp một accessor method để truy vấn số tiền còn thiếu. Điều này sẽ cho phép người gọi chuyển tiếp số tiền đó đến người mua hàng. Xem **Item 75** để biết thêm về chủ đề này.

Tóm lại, hãy ném checked exception cho các tình huống có thể khôi phục và unchecked exception cho lỗi lập trình. Khi còn nghi ngờ, hãy ném unchecked exception. Đừng định nghĩa bất kỳ throwable nào không phải là checked exception cũng không phải là runtime exception. Hãy cung cấp các method trên checked exception của bạn để hỗ trợ việc khôi phục.

## Item 71: Tránh sử dụng checked exception một cách không cần thiết

Nhiều lập trình viên Java không thích checked exception, nhưng nếu được dùng đúng cách, chúng có thể cải thiện API và chương trình. Không giống mã trả về (return code) và unchecked exception, chúng *buộc* lập trình viên phải đối phó với vấn đề, qua đó nâng cao độ tin cậy. Dù vậy, việc lạm dụng checked exception trong API có thể khiến chúng trở nên kém dễ chịu hơn nhiều khi sử dụng. Nếu một method ném ra checked exception, code gọi nó phải xử lý chúng trong một hoặc nhiều khối `catch`, hoặc khai báo rằng nó ném chúng ra và để chúng lan truyền ra ngoài. Dù cách nào, điều này cũng đặt gánh nặng lên người dùng API. Gánh nặng này tăng lên trong Java 8, vì các method ném checked exception không thể được dùng trực tiếp trong stream (**Item 45**–**48**).

Gánh nặng này có thể được biện minh nếu tình huống ngoại lệ không thể ngăn ngừa bằng cách sử dụng API đúng cách *và* lập trình viên sử dụng API có thể thực hiện một hành động hữu ích nào đó khi đối mặt với exception. Trừ khi cả hai điều kiện này đều được đáp ứng, unchecked exception mới là thích hợp. Như một phép thử, hãy tự hỏi lập trình viên sẽ xử lý exception như thế nào. Đây có phải là điều tốt nhất có thể làm không?

```java
} catch (TheCheckedException e) {
    throw new AssertionError(); // Can't happen!
}
```

Hay là thế này?

```java
} catch (TheCheckedException e) {
    e.printStackTrace();        // Oh well, we lose.
    System.exit(1);
}
```

Nếu lập trình viên không thể làm gì tốt hơn, thì unchecked exception là lựa chọn phù hợp.

Gánh nặng bổ sung mà một checked exception gây ra cho lập trình viên sẽ cao hơn đáng kể nếu nó là checked exception *duy nhất* mà một method ném ra. Nếu có những exception khác, method đó vốn đã phải xuất hiện trong một khối `try`, và exception này chỉ đòi hỏi thêm nhiều nhất một khối `catch` nữa. Nếu một method chỉ ném ra một checked exception duy nhất, exception này là lý do duy nhất khiến method phải xuất hiện trong một khối `try` và không thể được dùng trực tiếp trong stream. Trong những trường hợp này, đáng để tự hỏi liệu có cách nào tránh được checked exception đó không.

Cách dễ nhất để loại bỏ một checked exception là trả về một *optional* của kiểu kết quả mong muốn (**Item 55**). Thay vì ném ra checked exception, method chỉ đơn giản trả về một optional rỗng. Nhược điểm của kỹ thuật này là method không thể trả về bất kỳ thông tin bổ sung nào mô tả chi tiết việc nó không thể thực hiện phép tính mong muốn. Ngược lại, exception có kiểu mang tính mô tả, và có thể cung cấp các method để đưa ra thông tin bổ sung (**Item 70**).

Bạn cũng có thể biến một checked exception thành unchecked exception bằng cách tách method ném exception đó thành hai method, trong đó method thứ nhất trả về một `boolean` cho biết liệu exception có bị ném ra hay không. Việc tái cấu trúc (refactoring) API này biến đổi trình tự gọi từ thế này:

```java
// Invocation with checked exception
try {
    obj.action(args);
} catch (TheCheckedException e) {
    ... // Handle exceptional condition
}
```

thành thế này:

```java
// Invocation with state-testing method and unchecked exception
if (obj.actionPermitted(args)) {
    obj.action(args);
} else {
    ... // Handle exceptional condition
}
```

Việc tái cấu trúc này không phải lúc nào cũng thích hợp, nhưng ở những nơi nó thích hợp, nó có thể làm cho API dễ chịu hơn khi sử dụng. Mặc dù trình tự gọi sau không đẹp hơn trình tự gọi trước, API đã được tái cấu trúc lại linh hoạt hơn. Nếu lập trình viên biết rằng lời gọi sẽ thành công, hoặc chấp nhận để thread kết thúc nếu nó thất bại, việc tái cấu trúc cũng cho phép trình tự gọi đơn giản này:

`obj.action(args);`

Nếu bạn nghi ngờ rằng trình tự gọi đơn giản này sẽ là thông lệ, thì việc tái cấu trúc API có thể là thích hợp. API kết quả về cơ bản là API với method kiểm tra trạng thái trong **Item 69** và các lưu ý tương tự cũng áp dụng: nếu một object sẽ được truy cập đồng thời mà không có đồng bộ hóa bên ngoài, hoặc nó chịu các chuyển đổi trạng thái do bên ngoài gây ra, thì việc tái cấu trúc này là không thích hợp vì trạng thái của object có thể thay đổi giữa các lời gọi `actionPermitted` và `action`. Nếu một method `actionPermitted` riêng sẽ lặp lại công việc của method `action`, việc tái cấu trúc có thể bị loại bỏ vì lý do hiệu năng.

Tóm lại, khi được dùng một cách tiết chế, checked exception có thể tăng độ tin cậy của chương trình; khi bị lạm dụng, chúng khiến API trở nên khổ sở khi sử dụng. Nếu người gọi sẽ không thể khôi phục từ thất bại, hãy ném unchecked exception. Nếu việc khôi phục có thể khả thi và bạn muốn *buộc* người gọi phải xử lý các tình huống ngoại lệ, trước tiên hãy cân nhắc trả về một optional. Chỉ khi cách này cung cấp không đủ thông tin trong trường hợp thất bại thì bạn mới nên ném checked exception.

## Item 72: Ưu tiên sử dụng các exception chuẩn

Một thuộc tính phân biệt lập trình viên chuyên gia với những người ít kinh nghiệm hơn là các chuyên gia luôn phấn đấu cho, và thường đạt được, mức độ tái sử dụng code cao. Exception cũng không phải ngoại lệ đối với quy tắc rằng tái sử dụng code là điều tốt. Các thư viện Java cung cấp một tập hợp các exception bao phủ hầu hết nhu cầu ném exception của hầu hết các API.

Tái sử dụng các exception chuẩn mang lại nhiều lợi ích. Lợi ích hàng đầu là nó khiến API của bạn dễ học và dễ dùng hơn vì nó khớp với các quy ước đã được thiết lập mà lập trình viên vốn đã quen thuộc. Lợi ích thứ hai, sát ngay sau đó, là các chương trình sử dụng API của bạn dễ đọc hơn vì chúng không bị làm rối bởi những exception xa lạ. Cuối cùng (và ít quan trọng nhất), ít class exception hơn có nghĩa là dấu chân bộ nhớ nhỏ hơn và ít thời gian hơn dành cho việc nạp class.

Kiểu exception được tái sử dụng phổ biến nhất là `IllegalArgumentException` (**Item 49**). Đây nói chung là exception nên ném khi người gọi truyền vào một đối số có giá trị không thích hợp. Ví dụ, đây sẽ là exception nên ném nếu người gọi truyền một số âm vào tham số biểu thị số lần một hành động nào đó được lặp lại.

Một exception khác thường được tái sử dụng là `IllegalStateException`. Đây nói chung là exception nên ném nếu lời gọi là bất hợp lệ do trạng thái của object nhận lời gọi. Ví dụ, đây sẽ là exception nên ném nếu người gọi cố dùng một object nào đó trước khi nó được khởi tạo đúng cách.

Có thể lập luận rằng mọi lời gọi method sai đều quy về một đối số hoặc trạng thái bất hợp lệ, nhưng các exception khác được dùng theo chuẩn cho một số loại đối số và trạng thái bất hợp lệ nhất định. Nếu người gọi truyền `null` vào một tham số nào đó mà giá trị null bị cấm, quy ước quy định rằng nên ném `NullPointerException` thay vì `IllegalArgumentException`. Tương tự, nếu người gọi truyền một giá trị ngoài phạm vi vào một tham số biểu thị chỉ số trong một dãy, nên ném `IndexOutOfBoundsException` thay vì `IllegalArgumentException`.

Một exception có thể tái sử dụng khác là `ConcurrentModificationException`. Nó nên được ném nếu một object được thiết kế để dùng bởi một thread duy nhất (hoặc với đồng bộ hóa bên ngoài) phát hiện rằng nó đang bị sửa đổi đồng thời. Exception này cùng lắm chỉ là một gợi ý vì không thể phát hiện việc sửa đổi đồng thời một cách đáng tin cậy.

Exception chuẩn đáng chú ý cuối cùng là `UnsupportedOperationException`. Đây là exception nên ném nếu một object không hỗ trợ thao tác được yêu cầu. Việc dùng nó khá hiếm vì hầu hết các object đều hỗ trợ tất cả các method của chúng. Exception này được dùng bởi các class không triển khai một hoặc nhiều *thao tác tùy chọn* (optional operation) được định nghĩa bởi interface mà chúng triển khai. Ví dụ, một triển khai `List` chỉ cho phép thêm vào cuối (append-only) sẽ ném exception này nếu ai đó cố xóa một phần tử khỏi list.

**Không tái sử dụng trực tiếp** `Exception` **,** `RuntimeException` **,** `Throwable` **, hay** `Error` **.** Hãy coi các class này như thể chúng là abstract. Bạn không thể kiểm tra các exception này một cách đáng tin cậy vì chúng là superclass của các exception khác mà một method có thể ném ra.

Bảng này tóm tắt các exception được tái sử dụng phổ biến nhất:

| **Exception** | **Trường hợp sử dụng** |
|---|---|
| `IllegalArgumentException` | Giá trị tham số khác null không thích hợp |
| `IllegalStateException` | Trạng thái của object không thích hợp cho lời gọi method |
| `NullPointerException` | Giá trị tham số là null ở nơi bị cấm |
| `IndexOutOfBoundsException` | Giá trị tham số chỉ số nằm ngoài phạm vi |
| `ConcurrentModificationException` | Phát hiện sửa đổi đồng thời trên một object ở nơi điều đó bị cấm |
| `UnsupportedOperationException` | Object không hỗ trợ method |

Mặc dù đây là những exception được tái sử dụng phổ biến nhất cho đến nay, các exception khác cũng có thể được tái sử dụng khi hoàn cảnh cho phép. Ví dụ, sẽ là thích hợp khi tái sử dụng `ArithmeticException` và `NumberFormatException` nếu bạn đang triển khai các object số học như số phức hay số hữu tỉ. Nếu một exception phù hợp với nhu cầu của bạn, cứ việc dùng nó, nhưng chỉ khi các điều kiện mà bạn sẽ ném nó nhất quán với tài liệu của exception đó: việc tái sử dụng phải dựa trên ngữ nghĩa đã được ghi trong tài liệu, chứ không chỉ dựa trên tên gọi. Ngoài ra, bạn cứ thoải mái tạo subclass của một exception chuẩn nếu muốn thêm chi tiết (**Item 75**), nhưng hãy nhớ rằng exception là serializable (**Chương 12**). Chỉ riêng điều đó đã là lý do để không viết class exception của riêng bạn nếu không có lý do chính đáng.

Việc chọn exception nào để tái sử dụng có thể khá khó vì các "trường hợp sử dụng" trong bảng trên có vẻ không loại trừ lẫn nhau. Hãy xem xét trường hợp một object biểu diễn một bộ bài, và giả sử có một method để chia một tay bài từ bộ bài, nhận đối số là kích thước tay bài. Nếu người gọi truyền vào một giá trị lớn hơn số lá bài còn lại trong bộ bài, điều đó có thể được hiểu là `IllegalArgumentException` (giá trị tham số `handSize` quá lớn) hoặc `IllegalStateException` (bộ bài chứa quá ít lá). Trong những trường hợp này, quy tắc là **ném** `IllegalStateException` **nếu không có giá trị đối số nào có thể hoạt động được, ngược lại ném** `IllegalArgumentException` **.**

## Item 73: Ném exception phù hợp với mức trừu tượng

Thật khó chịu khi một method ném ra một exception không có mối liên hệ rõ ràng nào với nhiệm vụ mà nó thực hiện. Điều này thường xảy ra khi một method lan truyền một exception được ném bởi một mức trừu tượng thấp hơn. Nó không chỉ gây khó chịu mà còn làm ô nhiễm API của tầng cao hơn bằng các chi tiết triển khai. Nếu triển khai của tầng cao hơn thay đổi trong một bản phát hành sau, các exception mà nó ném ra cũng sẽ thay đổi theo, có khả năng làm hỏng các chương trình client hiện có.

Để tránh vấn đề này, **các tầng cao hơn nên bắt các exception mức thấp và, thay vào đó, ném ra các exception có thể được giải thích theo mức trừu tượng cao hơn.** Idiom này được gọi là *exception translation* (chuyển đổi exception):

```java
// Exception Translation
try {
    ... // Use lower-level abstraction to do our bidding
} catch (LowerLevelException e) {
    throw new HigherLevelException(...);
}
```

Dưới đây là một ví dụ về exception translation lấy từ class `AbstractSequentialList`, là một *skeletal implementation* (**Item 20**) của interface `List`. Trong ví dụ này, exception translation được bắt buộc bởi đặc tả của method `get` trong interface `List<E>`:

```java
/**
 * Returns the element at the specified position in this list.
 * @throws IndexOutOfBoundsException if the index is out of range
 *         ({@code index <  0 || index >= size()}).
 */
public E get(int index) {
    ListIterator<E> i = listIterator(index);
    try {
        return i.next();
    } catch (NoSuchElementException e) {
        throw new IndexOutOfBoundsException("Index: " + index);
    }
}
```

Một dạng đặc biệt của exception translation gọi là *exception chaining* (xâu chuỗi exception) được dùng trong những trường hợp exception mức thấp có thể hữu ích cho người debug vấn đề đã gây ra exception mức cao. Exception mức thấp (*cause* – nguyên nhân) được truyền cho exception mức cao, và exception mức cao cung cấp một accessor method (method `getCause` của `Throwable`) để lấy lại exception mức thấp:

```java
// Exception Chaining
try {
    ... // Use lower-level abstraction to do our bidding
} catch (LowerLevelException cause) {
    throw new HigherLevelException(cause);
}
```

Constructor của exception mức cao truyền cause cho một constructor của superclass *hỗ trợ xâu chuỗi* (chaining-aware), nên cuối cùng nó được truyền đến một trong các constructor hỗ trợ xâu chuỗi của `Throwable`, chẳng hạn `Throwable(Throwable)`:

```java
// Exception with chaining-aware constructor
class HigherLevelException extends Exception {
    HigherLevelException(Throwable cause) {
        super(cause);
    }
}
```

Hầu hết các exception chuẩn đều có constructor hỗ trợ xâu chuỗi. Với những exception không có, bạn có thể thiết lập cause bằng method `initCause` của `Throwable`. Exception chaining không chỉ cho phép bạn truy cập cause theo cách lập trình (bằng `getCause`), mà nó còn tích hợp stack trace của cause vào stack trace của exception mức cao.

**Mặc dù exception translation ưu việt hơn việc lan truyền exception từ các tầng thấp một cách vô thức, nó không nên bị lạm dụng.** Ở những nơi có thể, cách tốt nhất để đối phó với exception từ các tầng thấp là tránh chúng, bằng cách đảm bảo rằng các method mức thấp thành công. Đôi khi bạn có thể làm điều này bằng cách kiểm tra tính hợp lệ của các tham số của method mức cao trước khi truyền chúng xuống các tầng thấp.

Nếu không thể ngăn ngừa exception từ các tầng thấp, điều tốt nhất tiếp theo là để tầng cao hơn âm thầm xử lý vòng qua các exception này, cách ly người gọi method mức cao khỏi các vấn đề ở mức thấp. Trong những trường hợp này, có thể thích hợp để ghi log exception bằng một cơ chế logging phù hợp nào đó như `java.util.logging`. Điều này cho phép lập trình viên điều tra vấn đề, trong khi vẫn cách ly code client và người dùng khỏi nó.

Tóm lại, nếu không khả thi để ngăn ngừa hoặc xử lý exception từ các tầng thấp, hãy dùng exception translation, trừ khi method mức thấp tình cờ đảm bảo rằng tất cả các exception của nó đều phù hợp với mức cao hơn. Chaining mang lại điều tốt nhất của cả hai phía: nó cho phép bạn ném ra một exception mức cao phù hợp, đồng thời ghi lại nguyên nhân gốc để phân tích thất bại (**Item 75**).

## Item 74: Ghi tài liệu cho mọi exception mà mỗi method ném ra

Mô tả về các exception mà một method ném ra là một phần quan trọng của tài liệu cần thiết để sử dụng method đó đúng cách. Do đó, điều cực kỳ quan trọng là bạn dành thời gian để ghi tài liệu cẩn thận cho tất cả các exception mà mỗi method ném ra (**Item 56**).

**Luôn khai báo riêng từng checked exception, và ghi tài liệu chính xác các điều kiện mà mỗi exception bị ném ra** bằng tag `@throws` của Javadoc. Đừng đi đường tắt bằng cách khai báo rằng một method ném ra một superclass nào đó của nhiều class exception mà nó có thể ném. Một ví dụ cực đoan là đừng khai báo một public method `throws Exception` hoặc, tệ hơn, `throws Throwable`. Ngoài việc không cung cấp bất kỳ chỉ dẫn nào cho người dùng method về các exception mà nó có khả năng ném ra, khai báo như vậy còn cản trở rất nhiều việc sử dụng method vì nó thực chất che khuất mọi exception khác có thể bị ném ra trong cùng ngữ cảnh. Một ngoại lệ đối với lời khuyên này là method `main`, có thể được khai báo an toàn là ném `Exception` vì nó chỉ được gọi bởi VM.

Mặc dù ngôn ngữ không yêu cầu lập trình viên khai báo các unchecked exception mà một method có khả năng ném ra, sẽ là khôn ngoan nếu ghi tài liệu cho chúng cẩn thận như đối với checked exception. Unchecked exception nói chung biểu thị lỗi lập trình (**Item 70**), và việc giúp lập trình viên làm quen với tất cả các lỗi họ có thể mắc phải sẽ giúp họ tránh mắc những lỗi này. Một danh sách được ghi tài liệu tốt về các unchecked exception mà một method có thể ném ra thực chất mô tả các *tiền điều kiện* (precondition) để nó thực thi thành công. Điều thiết yếu là tài liệu của mọi public method phải mô tả các tiền điều kiện của nó (**Item 56**), và ghi tài liệu cho các unchecked exception là cách tốt nhất để thỏa mãn yêu cầu này.

Điều đặc biệt quan trọng là các method trong interface phải ghi tài liệu cho các unchecked exception mà chúng có thể ném ra. Tài liệu này tạo thành một phần của *hợp đồng chung* (general contract) của interface và cho phép hành vi chung giữa nhiều triển khai của interface.

**Dùng tag** `@throws` **của Javadoc để ghi tài liệu cho từng exception mà một method có thể ném ra, nhưng không dùng từ khóa** `throws` **cho unchecked exception.** Điều quan trọng là các lập trình viên sử dụng API của bạn nhận biết được exception nào là checked và exception nào là unchecked, vì trách nhiệm của lập trình viên khác nhau trong hai trường hợp này. Tài liệu được sinh ra bởi tag `@throws` của Javadoc mà không có mệnh đề throws tương ứng trong khai báo method cung cấp một dấu hiệu trực quan mạnh mẽ cho lập trình viên rằng một exception là unchecked.

Cần lưu ý rằng việc ghi tài liệu cho tất cả các unchecked exception mà mỗi method có thể ném ra là một lý tưởng, không phải lúc nào cũng đạt được trong thực tế. Khi một class được sửa đổi, việc một exported method bị thay đổi để ném thêm các unchecked exception không phải là vi phạm tính tương thích mã nguồn hay tương thích nhị phân. Giả sử một class gọi một method từ một class khác được viết độc lập. Các tác giả của class thứ nhất có thể ghi tài liệu cẩn thận tất cả các unchecked exception mà mỗi method ném ra, nhưng nếu class thứ hai được sửa đổi để ném thêm các unchecked exception, thì rất có khả năng class thứ nhất (vốn chưa được sửa đổi) sẽ lan truyền các unchecked exception mới mặc dù nó không ghi tài liệu cho chúng.

**Nếu một exception bị ném ra bởi nhiều method trong một class vì cùng một lý do, bạn có thể ghi tài liệu cho exception đó trong doc comment của class** thay vì ghi tài liệu riêng lẻ cho từng method. Một ví dụ phổ biến là `NullPointerException`. Hoàn toàn ổn khi doc comment của một class nói rằng, "Tất cả các method trong class này ném ra `NullPointerException` nếu một tham chiếu object null được truyền vào bất kỳ tham số nào," hoặc những lời tương tự.

Tóm lại, hãy ghi tài liệu cho mọi exception có thể bị ném ra bởi mỗi method mà bạn viết. Điều này đúng với unchecked exception cũng như checked exception, và với abstract method cũng như concrete method. Tài liệu này nên có dạng các tag `@throws` trong doc comment. Hãy khai báo riêng từng checked exception trong mệnh đề `throws` của method, nhưng đừng khai báo unchecked exception. Nếu bạn không ghi tài liệu cho các exception mà method của bạn có thể ném ra, người khác sẽ khó hoặc không thể sử dụng hiệu quả các class và interface của bạn.

## Item 75: Đưa thông tin ghi nhận thất bại vào detail message

Khi một chương trình thất bại do một exception không được bắt, hệ thống tự động in ra stack trace của exception đó. Stack trace chứa *biểu diễn chuỗi* (string representation) của exception, tức kết quả của việc gọi method `toString` của nó. Biểu diễn này thường bao gồm tên class của exception theo sau là *detail message* (thông điệp chi tiết) của nó. Thường thì đây là thông tin duy nhất mà lập trình viên hoặc kỹ sư vận hành (site reliability engineer) có được khi điều tra một sự cố phần mềm. Nếu sự cố không dễ tái hiện, có thể khó hoặc không thể thu được thêm bất kỳ thông tin nào. Do đó, điều cực kỳ quan trọng là method `toString` của exception trả về càng nhiều thông tin càng tốt liên quan đến nguyên nhân của thất bại. Nói cách khác, detail message của một exception nên *ghi nhận thất bại* (capture the failure) để phân tích về sau.

**Để ghi nhận thất bại, detail message của một exception nên chứa giá trị của tất cả các tham số và trường đã góp phần gây ra exception.** Ví dụ, detail message của một `IndexOutOfBoundsException` nên chứa cận dưới, cận trên và giá trị chỉ số đã không nằm giữa hai cận đó. Thông tin này nói lên rất nhiều về thất bại. Bất kỳ hoặc tất cả ba giá trị này đều có thể sai. Chỉ số có thể nhỏ hơn cận dưới một đơn vị hoặc bằng cận trên (một "lỗi hàng rào" – fencepost error), hoặc nó có thể là một giá trị bất thường, quá thấp hoặc quá cao. Cận dưới có thể lớn hơn cận trên (một thất bại nghiêm trọng về bất biến nội bộ). Mỗi tình huống này chỉ ra một vấn đề khác nhau, và việc biết mình đang tìm loại lỗi nào sẽ hỗ trợ rất nhiều cho việc chẩn đoán.

Một lưu ý liên quan đến thông tin nhạy cảm về bảo mật. Vì stack trace có thể được nhiều người xem trong quá trình chẩn đoán và sửa các vấn đề phần mềm, **không đưa mật khẩu, khóa mã hóa và những thứ tương tự vào detail message.**

Mặc dù việc đưa tất cả dữ liệu liên quan vào detail message của một exception là rất quan trọng, việc đưa vào nhiều văn xuôi nói chung là không quan trọng. Stack trace được dự định để phân tích cùng với tài liệu và, nếu cần, mã nguồn. Nó thường chứa chính xác tên file và số dòng mà từ đó exception bị ném ra, cũng như tên file và số dòng của tất cả các lời gọi method khác trên stack. Những mô tả dài dòng bằng văn xuôi về thất bại là thừa thãi; thông tin đó có thể thu được bằng cách đọc tài liệu và mã nguồn.

Không nên nhầm lẫn detail message của một exception với thông báo lỗi ở mức người dùng, thứ phải dễ hiểu đối với người dùng cuối. Không giống thông báo lỗi ở mức người dùng, detail message chủ yếu dành cho lập trình viên hoặc kỹ sư vận hành khi phân tích một thất bại. Do đó, hàm lượng thông tin quan trọng hơn nhiều so với tính dễ đọc. Thông báo lỗi ở mức người dùng thường được *bản địa hóa* (localized), trong khi detail message của exception hiếm khi như vậy.

Một cách để đảm bảo rằng exception chứa đủ thông tin ghi nhận thất bại trong detail message của chúng là yêu cầu thông tin này trong constructor thay vì một detail message dạng chuỗi. Detail message sau đó có thể được sinh ra tự động để bao gồm thông tin đó. Ví dụ, thay vì một constructor nhận `String`, `IndexOutOfBoundsException` lẽ ra có thể có một constructor trông như thế này:

```java
/**
 * Constructs an IndexOutOfBoundsException.
 *
 * @param lowerBound the lowest legal index value
 * @param upperBound the highest legal index value plus one
 * @param index      the actual index value
 */
public IndexOutOfBoundsException(int lowerBound, int upperBound,
                                 int index) {
    // Generate a detail message that captures the failure
    super(String.format(
            "Lower bound: %d, Upper bound: %d, Index: %d",
            lowerBound, upperBound, index));

    // Save failure information for programmatic access
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.index = index;
}
```

Kể từ Java 9, `IndexOutOfBoundsException` cuối cùng cũng có một constructor nhận tham số `index` kiểu `int`, nhưng đáng tiếc là nó bỏ qua các tham số `lowerBound` và `upperBound`. Nói rộng hơn, các thư viện Java không sử dụng nhiều idiom này, nhưng nó rất được khuyến nghị. Nó giúp lập trình viên ném exception dễ dàng ghi nhận thất bại. Thực tế, nó khiến lập trình viên khó mà *không* ghi nhận thất bại! Về bản chất, idiom này tập trung code sinh ra một detail message chất lượng cao vào trong class exception, thay vì yêu cầu mỗi người dùng của class phải sinh ra detail message một cách lặp đi lặp lại.

Như đã gợi ý trong **Item 70**, có thể thích hợp để một exception cung cấp các accessor method cho thông tin ghi nhận thất bại của nó (`lowerBound`, `upperBound` và `index` trong ví dụ trên). Việc cung cấp các accessor method như vậy trên checked exception quan trọng hơn so với unchecked, vì thông tin ghi nhận thất bại có thể hữu ích cho việc khôi phục từ thất bại. Hiếm khi (dù không phải là không thể tưởng tượng được) một lập trình viên muốn truy cập theo cách lập trình vào chi tiết của một unchecked exception. Tuy nhiên, ngay cả với unchecked exception, có vẻ nên cung cấp các accessor này theo nguyên tắc chung (**Item 12**, trang 57).

## Item 76: Cố gắng đạt được tính nguyên tử khi thất bại

Sau khi một object ném ra exception, nói chung điều mong muốn là object đó vẫn ở trong một trạng thái được định nghĩa rõ ràng và có thể sử dụng được, ngay cả khi thất bại xảy ra giữa chừng khi đang thực hiện một thao tác. Điều này đặc biệt đúng với checked exception, mà người gọi được kỳ vọng sẽ khôi phục từ đó. **Nói chung, một lời gọi method thất bại nên để object ở trạng thái mà nó đã có trước lời gọi đó**. Một method có tính chất này được gọi là *failure-atomic* (nguyên tử khi thất bại). Có nhiều cách để đạt được hiệu quả này. Cách đơn giản nhất là thiết kế các object immutable (**Item 17**). Nếu một object là immutable, tính nguyên tử khi thất bại là miễn phí. Nếu một thao tác thất bại, nó có thể ngăn một object mới được tạo ra, nhưng nó sẽ không bao giờ để một object hiện có ở trạng thái không nhất quán, vì trạng thái của mỗi object là nhất quán khi nó được tạo ra và không thể bị sửa đổi sau đó.

Với các method thao tác trên object mutable, cách phổ biến nhất để đạt được tính nguyên tử khi thất bại là kiểm tra tính hợp lệ của các tham số trước khi thực hiện thao tác (**Item 49**). Điều này khiến hầu hết các exception bị ném ra trước khi việc sửa đổi object bắt đầu. Ví dụ, hãy xem xét method `Stack.pop` trong **Item 7**:

```java
public Object pop() {
    if (size == 0)
        throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // Eliminate obsolete reference
    return result;
}
```

Nếu bỏ phép kiểm tra size ban đầu, method vẫn sẽ ném ra exception khi nó cố lấy một phần tử ra khỏi một stack rỗng. Tuy nhiên, nó sẽ để trường size ở trạng thái không nhất quán (âm), khiến mọi lời gọi method trong tương lai trên object đó thất bại. Thêm vào đó, `ArrayIndexOutOfBoundsException` bị ném ra bởi method `pop` sẽ không phù hợp với mức trừu tượng (**Item 73**).

Một cách tiếp cận có liên quan chặt chẽ để đạt được tính nguyên tử khi thất bại là sắp xếp phép tính sao cho bất kỳ phần nào có thể thất bại đều diễn ra trước bất kỳ phần nào sửa đổi object. Cách tiếp cận này là sự mở rộng tự nhiên của cách trước khi các đối số không thể được kiểm tra mà không thực hiện một phần của phép tính. Ví dụ, hãy xem xét trường hợp của `TreeMap`, có các phần tử được sắp xếp theo một thứ tự nào đó. Để thêm một phần tử vào `TreeMap`, phần tử đó phải thuộc kiểu có thể so sánh được bằng thứ tự của `TreeMap`. Việc cố thêm một phần tử có kiểu không đúng sẽ tự nhiên thất bại với một `ClassCastException` do việc tìm kiếm phần tử đó trong cây, trước khi cây bị sửa đổi theo bất kỳ cách nào.

Cách tiếp cận thứ ba để đạt được tính nguyên tử khi thất bại là thực hiện thao tác trên một bản sao tạm thời của object và thay thế nội dung của object bằng bản sao tạm thời đó khi thao tác hoàn tất. Cách tiếp cận này xuất hiện một cách tự nhiên khi phép tính có thể được thực hiện nhanh hơn một khi dữ liệu đã được lưu trong một cấu trúc dữ liệu tạm thời. Ví dụ, một số hàm sắp xếp sao chép list đầu vào của chúng vào một mảng trước khi sắp xếp để giảm chi phí truy cập phần tử trong vòng lặp trong cùng của thuật toán sắp xếp. Điều này được thực hiện vì hiệu năng, nhưng như một lợi ích bổ sung, nó đảm bảo rằng list đầu vào sẽ không bị đụng đến nếu việc sắp xếp thất bại.

Cách tiếp cận cuối cùng và ít phổ biến hơn nhiều để đạt được tính nguyên tử khi thất bại là viết *code khôi phục* (recovery code) chặn một thất bại xảy ra giữa chừng một thao tác, và khiến object quay lui (roll back) trạng thái của nó về thời điểm trước khi thao tác bắt đầu. Cách tiếp cận này được dùng chủ yếu cho các cấu trúc dữ liệu bền vững (lưu trên đĩa).

Mặc dù tính nguyên tử khi thất bại nói chung là điều mong muốn, không phải lúc nào cũng đạt được. Ví dụ, nếu hai thread cố sửa đổi cùng một object đồng thời mà không có đồng bộ hóa thích hợp, object có thể bị để ở trạng thái không nhất quán. Do đó, sẽ là sai lầm nếu cho rằng một object vẫn còn sử dụng được sau khi bắt một `ConcurrentModificationException`. Error là không thể khôi phục, nên bạn thậm chí không cần cố gắng bảo toàn tính nguyên tử khi thất bại khi ném `AssertionError`.

Ngay cả ở những nơi tính nguyên tử khi thất bại là khả thi, không phải lúc nào nó cũng đáng mong muốn. Với một số thao tác, nó sẽ làm tăng đáng kể chi phí hoặc độ phức tạp. Dù vậy, việc đạt được tính nguyên tử khi thất bại thường vừa miễn phí vừa dễ dàng một khi bạn đã nhận thức được vấn đề.

Tóm lại, theo quy tắc, bất kỳ exception nào được sinh ra mà là một phần của đặc tả của method đều nên để object ở cùng trạng thái mà nó đã có trước lời gọi method. Ở những nơi quy tắc này bị vi phạm, tài liệu API nên chỉ rõ object sẽ bị để ở trạng thái nào. Đáng tiếc là rất nhiều tài liệu API hiện có không đạt được lý tưởng này.

## Item 77: Đừng bỏ qua exception

Mặc dù lời khuyên này có vẻ hiển nhiên, nó bị vi phạm đủ thường xuyên để đáng được nhắc lại. Khi những người thiết kế một API khai báo một method ném ra exception, họ đang cố nói với bạn điều gì đó. Đừng bỏ qua nó! Rất dễ bỏ qua exception bằng cách bao quanh một lời gọi method bằng một câu lệnh `try` có khối `catch` rỗng:

```java
// Empty catch block ignores exception - Highly suspect!
try {
    ...
} catch (SomeException e) {
}
```

**Một khối** `catch` **rỗng làm mất đi mục đích của exception,** vốn là để buộc bạn phải xử lý các tình huống ngoại lệ. Bỏ qua một exception cũng giống như bỏ qua chuông báo cháy—và tắt nó đi để không ai khác có cơ hội xem liệu có cháy thật hay không. Bạn có thể thoát được, hoặc hậu quả có thể là thảm họa. Bất cứ khi nào bạn thấy một khối `catch` rỗng, chuông báo động nên vang lên trong đầu bạn.

Có những tình huống mà việc bỏ qua exception là thích hợp. Ví dụ, điều đó có thể thích hợp khi đóng một `FileInputStream`. Bạn chưa thay đổi trạng thái của file, nên không cần thực hiện bất kỳ hành động khôi phục nào, và bạn đã đọc xong thông tin cần thiết từ file, nên không có lý do gì để hủy bỏ thao tác đang tiến hành. Có thể là khôn ngoan nếu ghi log exception đó, để bạn có thể điều tra vấn đề nếu những exception này xảy ra thường xuyên. **Nếu bạn chọn bỏ qua một exception, khối** `catch` **nên chứa một comment giải thích tại sao làm vậy là thích hợp, và biến nên được đặt tên là** `ignored:`

```java
Future<Integer> f = exec.submit(planarMap::chromaticNumber);
int numColors = 4; // Default; guaranteed sufficient for any map
try {
    numColors = f.get(1L, TimeUnit.SECONDS);
} catch (TimeoutException | ExecutionException ignored) {
    // Use default: minimal coloring is desirable, not required
}
```

Lời khuyên trong item này áp dụng như nhau cho cả checked và unchecked exception. Dù một exception biểu thị một tình huống ngoại lệ có thể dự đoán được hay một lỗi lập trình, việc bỏ qua nó bằng một khối `catch` rỗng sẽ dẫn đến một chương trình âm thầm tiếp tục chạy khi đối mặt với lỗi. Chương trình sau đó có thể thất bại vào một thời điểm tùy ý trong tương lai, tại một điểm trong code không có mối liên hệ rõ ràng nào với nguồn gốc của vấn đề. Xử lý exception đúng cách có thể ngăn chặn hoàn toàn thất bại. Chỉ đơn thuần để exception lan truyền ra ngoài ít nhất cũng có thể khiến chương trình thất bại nhanh chóng, bảo toàn thông tin để hỗ trợ việc debug thất bại đó.
