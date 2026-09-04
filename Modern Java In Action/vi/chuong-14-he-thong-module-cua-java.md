# Chương 14. Hệ thống module của Java

> **Nội dung chương này**
>
> - Những áp lực tiến hoá khiến Java phải áp dụng một hệ thống module
> - Cấu trúc chính: khai báo module cùng các directive `requires` và `exports`
> - Automatic module dành cho các Java Archive (JAR) cũ
> - Việc module hoá và thư viện JDK
> - Module và các bản build bằng Maven
> - Tóm lược ngắn gọn về các module directive vượt ra ngoài `requires` và `exports` đơn giản

Tính năng mới quan trọng nhất và được bàn luận nhiều nhất mà Java 9 giới thiệu chính là hệ thống module của nó. Tính năng này được phát triển trong khuôn khổ dự án Jigsaw, và quá trình phát triển đó kéo dài gần một thập kỷ. Mốc thời gian này là một thước đo tốt cho cả tầm quan trọng của bổ sung này lẫn những khó khăn mà đội phát triển Java đã gặp phải khi triển khai nó. Chương này cung cấp bối cảnh giải thích vì sao bạn — với tư cách một lập trình viên — nên quan tâm đến việc hệ thống module là gì, đồng thời đưa ra một cái nhìn tổng quan về mục đích của Java Module System mới và cách bạn có thể hưởng lợi từ nó.

Lưu ý rằng Java Module System là một chủ đề phức tạp, xứng đáng có hẳn một cuốn sách riêng. Chúng tôi khuyến nghị cuốn *The Java Module System* của Nicolai Parlog (Manning Publications, https://www.manning.com/books/the-java-module-system) như một tài liệu tham khảo toàn diện. Trong chương này, chúng tôi cố ý chỉ phác thảo bức tranh tổng quát để bạn hiểu được động lực chính và nắm nhanh cách làm việc với Java module.

## 14.1. Động lực thúc đẩy: suy luận về phần mềm

Trước khi đi sâu vào chi tiết của Java Module System, sẽ hữu ích nếu bạn hiểu được một chút động lực và bối cảnh, để nhận ra những mục tiêu mà các nhà thiết kế ngôn ngữ Java đặt ra. Tính module (modularity) nghĩa là gì? Hệ thống module đang tìm cách giải quyết vấn đề nào? Cuốn sách này đã dành khá nhiều thời lượng để bàn về những tính năng ngôn ngữ mới giúp chúng ta viết code đọc lên gần với phát biểu bài toán hơn, và nhờ vậy dễ hiểu và dễ bảo trì hơn. Tuy nhiên, đó là mối quan tâm ở mức thấp. Xét cho cùng, ở mức cao (mức kiến trúc phần mềm), bạn muốn làm việc với một dự án phần mềm dễ suy luận, bởi điều đó khiến bạn làm việc hiệu quả hơn khi cần đưa các thay đổi vào code base. Trong các mục tiếp theo, chúng tôi nêu bật hai nguyên tắc thiết kế giúp tạo ra phần mềm dễ suy luận hơn: separation of concerns (tách bạch mối quan tâm) và information hiding (che giấu thông tin).

### 14.1.1. Separation of concerns

Separation of concerns (SoC) là nguyên tắc khuyến khích phân rã một chương trình máy tính thành những tính năng riêng biệt. Giả sử bạn cần phát triển một ứng dụng kế toán có nhiệm vụ phân tích cú pháp (parse) các khoản chi ở nhiều định dạng khác nhau, phân tích chúng, và cung cấp báo cáo tổng hợp cho khách hàng của bạn. Bằng cách áp dụng SoC, bạn tách việc parse, phân tích và báo cáo thành các phần riêng biệt gọi là module — những nhóm code có tính gắn kết cao và ít chồng lấn lên nhau. Nói cách khác, một module gom nhóm các class lại, cho phép bạn diễn đạt các quan hệ khả kiến (visibility) giữa các class trong ứng dụng của mình.

Bạn có thể nói: "À, nhưng package trong Java đã gom nhóm các class rồi mà." Bạn nói đúng, nhưng module của Java 9 cho bạn quyền kiểm soát chi tiết hơn về việc class nào có thể nhìn thấy class nào, và cho phép kiểm tra quyền kiểm soát này ngay tại thời điểm biên dịch. Về bản chất, package trong Java không hỗ trợ tính module.

Nguyên tắc SoC hữu ích cả ở góc nhìn kiến trúc (chẳng hạn model so với view so với controller) lẫn ở cách tiếp cận mức thấp (chẳng hạn tách logic nghiệp vụ khỏi cơ chế phục hồi). Các lợi ích gồm:

- Cho phép làm việc trên từng phần riêng lẻ một cách độc lập, điều này hỗ trợ việc cộng tác nhóm
- Tạo thuận lợi cho việc tái sử dụng các phần riêng biệt
- Giúp bảo trì toàn hệ thống dễ dàng hơn

### 14.1.2. Information hiding

Information hiding là nguyên tắc khuyến khích che giấu các chi tiết cài đặt. Vì sao nguyên tắc này lại quan trọng? Trong bối cảnh xây dựng phần mềm, yêu cầu có thể thay đổi thường xuyên. Bằng cách che giấu chi tiết cài đặt, bạn có thể giảm khả năng một thay đổi cục bộ sẽ kéo theo hàng loạt thay đổi dây chuyền ở những phần khác của chương trình. Nói cách khác, đây là một nguyên tắc hữu ích để quản lý và bảo vệ code của bạn. Bạn thường nghe thuật ngữ encapsulation được dùng để chỉ việc một đoạn code cụ thể được cô lập tốt khỏi các phần khác của ứng dụng đến mức việc thay đổi phần cài đặt bên trong của nó sẽ không ảnh hưởng tiêu cực đến chúng. Trong Java, bạn có thể nhờ compiler kiểm tra rằng các thành phần bên trong một class được đóng gói tốt bằng cách sử dụng từ khoá `private` một cách hợp lý. Nhưng cho đến Java 9, không có cấu trúc ngôn ngữ nào cho phép compiler kiểm tra rằng các class và package chỉ khả dụng đúng cho những mục đích đã dự định.

### 14.1.3. Phần mềm Java

Hai nguyên tắc này là nền tảng trong bất kỳ phần mềm nào được thiết kế tốt. Chúng khớp với các tính năng của ngôn ngữ Java ra sao? Java là một ngôn ngữ hướng đối tượng, và bạn làm việc với class và interface. Bạn làm cho code của mình có tính module bằng cách gom nhóm các package, class và interface cùng giải quyết một mối quan tâm cụ thể. Trên thực tế, việc suy luận trực tiếp trên code thô có phần hơi trừu tượng. Vì vậy, các công cụ như sơ đồ UML (hoặc đơn giản hơn là các hộp và mũi tên) giúp bạn suy luận về phần mềm bằng cách biểu diễn trực quan các phụ thuộc giữa các phần trong code. Hình 14.1 minh hoạ một sơ đồ UML cho một ứng dụng quản lý hồ sơ người dùng đã được phân rã thành ba mối quan tâm cụ thể.

> **Hình 14.1.** Ba mối quan tâm riêng biệt cùng các phụ thuộc giữa chúng

Còn information hiding thì sao? Trong Java, bạn đã quen với việc dùng các modifier khả kiến để kiểm soát truy cập tới phương thức, trường và class: `public`, `protected`, mức package, và `private`. Tuy nhiên, như chúng tôi sẽ làm rõ ở mục tiếp theo, độ chi tiết của chúng không đủ mịn trong nhiều trường hợp, và bạn có thể bị buộc phải khai báo một phương thức là `public` ngay cả khi bạn không hề muốn nó truy cập được bởi người dùng cuối. Mối lo này không quá lớn trong những ngày đầu của Java, khi ứng dụng và các chuỗi phụ thuộc còn tương đối nhỏ. Giờ đây, khi nhiều ứng dụng Java đã trở nên lớn, vấn đề này trở nên quan trọng hơn. Thật vậy, nếu bạn thấy một trường hay một phương thức `public` trong một class, có lẽ bạn cảm thấy mình có quyền sử dụng nó (đúng không?), ngay cả khi người thiết kế coi nó chỉ dành cho việc dùng riêng giữa một vài class của chính anh ta!

Giờ khi bạn đã hiểu những lợi ích của việc module hoá, có thể bạn tự hỏi việc hỗ trợ nó gây ra những thay đổi gì trong Java. Chúng tôi sẽ giải thích ở mục tiếp theo.

## 14.2. Vì sao Java Module System được thiết kế

Trong mục này, bạn sẽ tìm hiểu vì sao một hệ thống module mới lại được thiết kế cho ngôn ngữ và compiler của Java. Trước hết, chúng ta điểm qua những hạn chế về tính module trước Java 9. Tiếp theo, chúng tôi cung cấp bối cảnh về thư viện JDK và giải thích vì sao việc module hoá nó lại quan trọng.

### 14.2.1. Những hạn chế về tính module

Đáng tiếc là phần hỗ trợ sẵn có trong Java nhằm giúp tạo ra các dự án phần mềm có tính module còn khá hạn chế trước Java 9. Java có ba mức để gom nhóm code: class, package và JAR. Với class, Java luôn hỗ trợ các access modifier và encapsulation. Tuy nhiên, ở mức package và JAR thì hầu như không có encapsulation.

**Kiểm soát khả kiến hạn chế**

Như đã bàn ở mục trước, Java cung cấp các access modifier để hỗ trợ information hiding. Các modifier này là `public`, `protected`, khả kiến mức package, và `private`. Nhưng còn việc kiểm soát khả kiến giữa các package thì sao? Hầu hết ứng dụng đều định nghĩa vài package để gom nhóm các class khác nhau, nhưng package chỉ hỗ trợ rất hạn chế cho việc kiểm soát khả kiến. Nếu bạn muốn các class và interface từ một package nhìn thấy được ở một package khác, bạn phải khai báo chúng là `public`. Hệ quả là những class và interface này cũng truy cập được từ tất cả mọi nơi khác. Một biểu hiện điển hình của vấn đề này là khi bạn thấy các package đồng hành có tên chứa chuỗi `"impl"` để cung cấp các phần cài đặt mặc định. Trong trường hợp này, vì code bên trong package đó được khai báo là `public`, bạn không có cách nào ngăn người dùng sử dụng những phần cài đặt nội bộ ấy. Kết quả là việc phát triển tiếp code của bạn mà không tạo ra thay đổi phá vỡ (breaking change) trở nên khó khăn, bởi thứ mà bạn nghĩ chỉ dùng nội bộ lại đã được một lập trình viên nào đó dùng tạm để làm cho thứ gì đó chạy được, rồi bị đóng băng luôn trong hệ thống. Tệ hơn, tình huống này còn xấu ở góc độ bảo mật, vì bạn có nguy cơ làm tăng bề mặt tấn công khi ngày càng nhiều code bị phơi bày trước rủi ro bị can thiệp.

**Class path**

Ở đầu chương này, chúng ta đã bàn về lợi ích của phần mềm được viết theo cách dễ bảo trì và dễ hiểu — nói cách khác là dễ suy luận. Chúng ta cũng đã nói về separation of concerns và việc mô hình hoá các phụ thuộc giữa các module. Đáng tiếc, trong lịch sử của mình Java lại thiếu sót trong việc hỗ trợ những ý tưởng này khi nói đến việc đóng gói và chạy một ứng dụng. Thực tế, bạn phải đóng gói toàn bộ các class đã biên dịch vào một JAR phẳng duy nhất, và JAR này được truy cập thông qua class path.[^1] Sau đó JVM có thể định vị và nạp các class từ class path một cách động khi cần.

[^1]: Cách viết này được dùng trong tài liệu Java, nhưng "classpath" thường được dùng cho các đối số truyền cho chương trình.

Đáng tiếc, sự kết hợp giữa class path và JAR có vài nhược điểm.

Thứ nhất, class path không có khái niệm phiên bản cho cùng một class. Chẳng hạn, bạn không thể chỉ định rằng class `JSONParser` từ một thư viện parsing phải thuộc phiên bản 1.0 hay phiên bản 2.0, nên bạn không thể dự đoán điều gì sẽ xảy ra nếu cùng một thư viện với hai phiên bản khác nhau cùng có mặt trên class path. Tình huống này phổ biến trong các ứng dụng lớn, vì bạn có thể có nhiều phiên bản khác nhau của cùng một thư viện được dùng bởi các thành phần khác nhau trong ứng dụng.

Thứ hai, class path không hỗ trợ khai báo phụ thuộc tường minh; tất cả class bên trong các JAR khác nhau đều bị trộn chung vào một "túi class" duy nhất trên class path. Nói cách khác, class path không cho bạn khai báo một cách tường minh rằng một JAR phụ thuộc vào một tập class chứa trong một JAR khác. Tình huống này khiến việc suy luận về class path và việc đặt ra những câu hỏi sau trở nên khó khăn:

- Có thứ gì bị thiếu không?
- Có xung đột nào không?

Các build tool như Maven và Gradle có thể giúp bạn giải quyết vấn đề này. Tuy nhiên, trước Java 9, cả Java lẫn JVM đều không hỗ trợ khai báo phụ thuộc tường minh. Những vấn đề này gộp lại thường được gọi là JAR Hell hoặc Class Path Hell. Hệ quả trực tiếp của các vấn đề này là người ta thường xuyên phải liên tục thêm và bớt các file class trên class path theo một vòng lặp thử-và-sai, với hy vọng JVM sẽ chạy được ứng dụng của bạn mà không ném ra các ngoại lệ lúc chạy như `ClassNotFoundException`. Lý tưởng nhất là bạn muốn phát hiện những vấn đề như vậy sớm trong quá trình phát triển. Việc sử dụng hệ thống module của Java 9 một cách nhất quán cho phép mọi lỗi kiểu này được phát hiện ngay tại thời điểm biên dịch.

Tuy nhiên, encapsulation và Class Path Hell không chỉ là vấn đề của kiến trúc phần mềm do bạn viết. Còn bản thân JDK thì sao?

### 14.2.2. JDK nguyên khối

Java Development Kit (JDK) là một tập hợp các công cụ cho phép bạn làm việc với và chạy các chương trình Java. Có lẽ những công cụ quan trọng nhất mà bạn quen thuộc là `javac` để biên dịch chương trình Java và `java` để nạp và chạy một ứng dụng Java, cùng với thư viện JDK vốn cung cấp phần hỗ trợ lúc chạy bao gồm input/output, collection và stream. Phiên bản đầu tiên được phát hành vào năm 1996. Điều quan trọng cần hiểu là, giống như bất kỳ phần mềm nào, JDK đã phát triển và tăng lên đáng kể về kích thước. Nhiều công nghệ đã được thêm vào rồi sau đó bị deprecate. CORBA là một ví dụ điển hình. Dù bạn có dùng CORBA trong ứng dụng của mình hay không cũng chẳng quan trọng; các class của nó vẫn được đóng gói kèm theo JDK. Tình huống này trở nên rắc rối, đặc biệt trong các ứng dụng chạy trên thiết bị di động hoặc trên cloud, nơi thường không cần tới toàn bộ những phần có sẵn trong thư viện JDK.

Làm sao cả hệ sinh thái có thể thoát khỏi vấn đề này? Java 8 đã giới thiệu khái niệm compact profile như một bước tiến. Ba profile được đưa ra để có các mức chiếm dụng bộ nhớ khác nhau, tuỳ theo bạn quan tâm đến những phần nào của thư viện JDK. Tuy vậy, compact profile chỉ là một giải pháp vá tạm ngắn hạn. Nhiều API nội bộ trong JDK không hề dành cho việc sử dụng công khai. Đáng tiếc, do khả năng encapsulation yếu kém mà ngôn ngữ Java cung cấp, những API đó lại được dùng rất phổ biến. Chẳng hạn, class `sun.misc.Unsafe` được nhiều thư viện sử dụng (bao gồm Spring, Netty và Mockito) nhưng vốn chưa bao giờ được dự định để lộ ra bên ngoài phần nội bộ của JDK. Hệ quả là việc phát triển tiếp những API này mà không tạo ra thay đổi gây mất tương thích trở nên cực kỳ khó khăn.

Tất cả những vấn đề này đã tạo ra động lực để thiết kế một Java Module System, đồng thời cũng có thể dùng để module hoá chính bản thân JDK. Nói ngắn gọn, người ta cần những cấu trúc mới cho phép bạn chọn những phần nào của JDK mà bạn cần và cách suy luận về class path, đồng thời cung cấp encapsulation mạnh hơn để có thể phát triển tiếp nền tảng.

### 14.2.3. So sánh với OSGi

Mục này so sánh module của Java 9 với OSGi. Nếu bạn chưa từng nghe nói đến OSGi, chúng tôi khuyên bạn nên bỏ qua mục này.

Trước khi module dựa trên dự án Jigsaw được đưa vào Java 9, Java đã có sẵn một hệ thống module mạnh mẽ mang tên OSGi, dù nó không chính thức là một phần của nền tảng Java. Open Service Gateway initiative (OSGi) bắt đầu từ năm 2000 và, cho tới khi Java 9 xuất hiện, đã đại diện cho chuẩn thực tế (de-facto standard) để triển khai một ứng dụng có tính module trên JVM.

Trên thực tế, OSGi và Java 9 Module System mới không loại trừ lẫn nhau; chúng có thể cùng tồn tại trong một ứng dụng. Thật vậy, các tính năng của chúng chỉ chồng lấn một phần. OSGi có phạm vi rộng hơn nhiều và cung cấp nhiều khả năng không có trong Jigsaw.

Module trong OSGi được gọi là bundle và chạy bên trong một OSGi framework cụ thể. Có vài phần cài đặt OSGi framework đã được chứng nhận, nhưng hai cái được sử dụng rộng rãi nhất là Apache Felix và Equinox (Equinox cũng được dùng để chạy Eclipse IDE). Khi chạy bên trong một OSGi framework, một bundle đơn lẻ có thể được cài đặt từ xa, khởi động, dừng, cập nhật và gỡ bỏ mà không cần khởi động lại. Nói cách khác, OSGi định nghĩa một vòng đời rõ ràng cho bundle, tạo thành từ các trạng thái được liệt kê trong bảng 14.1.

**Bảng 14.1. Các trạng thái của bundle trong OSGi**

| Trạng thái bundle | Mô tả |
|---|---|
| INSTALLED | Bundle đã được cài đặt thành công. |
| RESOLVED | Tất cả các class Java mà bundle cần đều đã sẵn sàng. |
| STARTING | Bundle đang được khởi động, và phương thức `BundleActivator.start` đã được gọi, nhưng phương thức `start` chưa trả về. |
| ACTIVE | Bundle đã được kích hoạt thành công và đang chạy. |
| STOPPING | Bundle đang được dừng lại. Phương thức `BundleActivator.stop` đã được gọi, nhưng phương thức `stop` chưa trả về. |
| UNINSTALLED | Bundle đã được gỡ bỏ. Nó không thể chuyển sang trạng thái khác. |

Khả năng hot-swap (thay nóng) các phần con khác nhau của ứng dụng mà không cần khởi động lại nó có lẽ là ưu thế chính của OSGi so với Jigsaw. Mỗi bundle được định nghĩa thông qua một file văn bản mô tả những package bên ngoài nào mà bundle cần để hoạt động, và những package nội bộ nào được bundle export công khai rồi sau đó cung cấp cho các bundle khác.

Một đặc điểm thú vị khác của OSGi là nó cho phép các phiên bản khác nhau của cùng một bundle được cài đặt trong framework tại cùng một thời điểm. Java 9 Module System không hỗ trợ kiểm soát phiên bản, vì Jigsaw vẫn dùng một class loader duy nhất cho mỗi ứng dụng, trong khi OSGi nạp mỗi bundle trong class loader riêng của nó.

## 14.3. Java module: bức tranh tổng thể

Java 9 cung cấp một đơn vị cấu trúc chương trình Java mới: module. Một module được giới thiệu bằng từ khoá mới[^2] `module`, theo sau là tên của nó và phần thân. Một module descriptor[^3] như vậy nằm trong một file đặc biệt: `module-info.java`, được biên dịch thành `module-info.class`. Phần thân của một module descriptor bao gồm các mệnh đề (clause), trong đó hai mệnh đề quan trọng nhất là `requires` và `exports`. Mệnh đề thứ nhất chỉ định những module khác mà module của bạn cần để chạy, còn `exports` chỉ định mọi thứ mà module của bạn muốn cho các module khác nhìn thấy và sử dụng. Bạn sẽ tìm hiểu chi tiết hơn về các mệnh đề này ở những mục sau.

[^2]: Về mặt kỹ thuật, các định danh tạo nên module trong Java 9 — chẳng hạn `module`, `requires` và `export` — là các từ khoá hạn chế (restricted keyword). Bạn vẫn có thể dùng chúng làm định danh ở những nơi khác trong chương trình (để tương thích ngược), nhưng chúng được diễn giải như từ khoá trong ngữ cảnh cho phép module.

[^3]: Về mặt danh xưng chính thức, dạng văn bản được gọi là module declaration (khai báo module), còn dạng nhị phân trong `module-info.class` được gọi là module descriptor (bộ mô tả module).

Một module descriptor mô tả và đóng gói một hoặc nhiều package (và thường nằm cùng thư mục với các package đó), nhưng trong các trường hợp sử dụng đơn giản, nó chỉ export (làm cho nhìn thấy được) một trong số các package này.

Cấu trúc lõi của một module descriptor trong Java được minh hoạ ở hình 14.2.

> **Hình 14.2.** Cấu trúc lõi của một module descriptor trong Java (`module-info.java`)

Sẽ hữu ích nếu bạn nghĩ về phần `exports` và `requires` của một module lần lượt giống như các mấu lồi (lugs hay tabs) và các lỗ khuyết của một mảnh ghép jigsaw (có lẽ đây chính là nguồn gốc của tên gọi trong quá trình phát triển: Project Jigsaw). Hình 14.3 minh hoạ một ví dụ với vài module.

> **Hình 14.3.** Ví dụ theo kiểu ghép hình jigsaw về một hệ thống Java được xây dựng từ bốn module (A, B, C, D). Module A yêu cầu module B và C phải có mặt, và nhờ đó có quyền truy cập vào các package `pkgB` và `pkgC` (lần lượt được export bởi module B và C). Module C cũng có thể tương tự sử dụng package `pkgD` mà nó đã require từ module C, nhưng module B thì không thể dùng `pkgD`.

Khi bạn dùng các công cụ như Maven, phần lớn chi tiết của mô tả module được IDE xử lý và được che giấu khỏi người dùng.

Dù vậy, ở mục tiếp theo chúng ta sẽ khám phá các khái niệm này chi tiết hơn dựa trên các ví dụ.

## 14.4. Phát triển một ứng dụng với Java Module System

Trong mục này, bạn sẽ có cái nhìn tổng quan về Java 9 Module System bằng cách xây dựng một ứng dụng module đơn giản từ đầu. Bạn sẽ học cách cấu trúc, đóng gói và khởi chạy một ứng dụng module nhỏ. Mục này không giải thích chi tiết từng chủ đề, mà cho bạn thấy bức tranh tổng thể, để bạn có thể tự đào sâu hơn nếu cần.

### 14.4.1. Thiết lập một ứng dụng

Để bắt đầu với Java Module System, bạn cần một dự án ví dụ để viết code. Có thể bạn đi lại nhiều, đi mua sắm tạp hoá, hoặc đi cà phê với bạn bè, và bạn phải xử lý rất nhiều hoá đơn. Chẳng ai từng thích thú với việc quản lý chi tiêu. Để tự giúp mình, bạn viết một ứng dụng có thể quản lý các khoản chi của bạn. Ứng dụng cần thực hiện vài tác vụ:

- Đọc một danh sách các khoản chi từ một file hoặc một URL;
- Parse phần biểu diễn dạng chuỗi của các khoản chi này;
- Tính toán số liệu thống kê;
- Hiển thị một bản tóm tắt hữu ích;
- Cung cấp một bộ điều phối chính để khởi động và đóng các tác vụ này.

Bạn cần định nghĩa các class và interface khác nhau để mô hình hoá các khái niệm trong ứng dụng này. Trước tiên, một interface `Reader` cho phép bạn đọc các khoản chi đã được serialize từ một nguồn. Bạn sẽ có các phần cài đặt khác nhau, chẳng hạn `HttpReader` hoặc `FileReader`, tuỳ theo nguồn dữ liệu. Bạn cũng cần một interface `Parser` để deserialize các đối tượng JSON thành một domain object `Expense` mà bạn có thể thao tác trong ứng dụng Java. Cuối cùng, bạn cần một class `SummaryCalculator` chịu trách nhiệm tính toán số liệu thống kê từ một danh sách các đối tượng `Expense`, và trả về các đối tượng `SummaryStatistics`.

Giờ khi đã có một dự án, làm thế nào để module hoá nó bằng Java Module System? Rõ ràng dự án liên quan đến vài mối quan tâm mà bạn muốn tách bạch:

- Đọc dữ liệu từ các nguồn khác nhau (`Reader`, `HttpReader`, `FileReader`)
- Parse dữ liệu từ các định dạng khác nhau (`Parser`, `JSONParser`, `ExpenseJSONParser`)
- Biểu diễn các domain object (`Expense`)
- Tính toán và trả về số liệu thống kê (`SummaryCalculator`, `SummaryStatistics`)
- Điều phối các mối quan tâm khác nhau (`ExpensesApplication`)

Ở đây, vì mục đích sư phạm, chúng ta sẽ áp dụng cách tiếp cận mịn (fine-grained). Bạn có thể gom mỗi mối quan tâm vào một module riêng, như sau (và chúng ta sẽ bàn chi tiết hơn về quy ước đặt tên module ở phần sau):

```text
expenses.readers
expenses.readers.http
expenses.readers.file
expenses.parsers
expenses.parsers.json
expenses.model
expenses.statistics
expenses.application
```

Với ứng dụng đơn giản này, bạn áp dụng một cách phân rã mịn để minh hoạ các thành phần khác nhau của hệ thống module. Trên thực tế, việc áp dụng cách tiếp cận mịn như vậy cho một dự án đơn giản sẽ dẫn đến chi phí đầu tư ban đầu cao, đổi lại lợi ích khá hạn chế là đóng gói đúng cách những phần nhỏ của dự án. Tuy nhiên, khi dự án lớn dần và ngày càng nhiều phần cài đặt nội bộ được thêm vào, lợi ích về encapsulation và khả năng suy luận sẽ trở nên rõ rệt hơn. Bạn cũng có thể hình dung danh sách ở trên như một danh sách các package, tuỳ theo ranh giới ứng dụng của bạn. Một module gom nhóm một loạt package. Có thể mỗi module có những package đặc thù cho phần cài đặt mà bạn không muốn phơi bày cho các module khác. Chẳng hạn, module `expenses.statistics` có thể chứa vài package cho các phần cài đặt khác nhau của những phương pháp thống kê mang tính thử nghiệm. Về sau, bạn có thể quyết định package nào trong số đó sẽ được phát hành cho người dùng.

### 14.4.2. Module hoá mịn và module hoá thô

Khi module hoá một hệ thống, bạn có thể chọn mức độ chi tiết. Ở phương án mịn nhất, mỗi package có module riêng của nó (như ở mục trước); ở phương án thô nhất, một module duy nhất chứa toàn bộ các package trong hệ thống của bạn. Như đã lưu ý ở mục trước, phương án thứ nhất làm tăng chi phí thiết kế nhưng lợi ích thu về hạn chế, còn phương án thứ hai đánh mất mọi lợi ích của việc module hoá. Lựa chọn tốt nhất là một cách phân rã hệ thống thành các module mang tính thực dụng, kèm theo một quy trình rà soát định kỳ để bảo đảm rằng một dự án phần mềm đang tiến hoá vẫn giữ được mức module hoá đủ tốt để bạn có thể tiếp tục suy luận về nó và sửa đổi nó.

Nói ngắn gọn, module hoá là kẻ thù của sự "gỉ sét" phần mềm (software rust).

### 14.4.3. Những kiến thức cơ bản về Java Module System

Hãy bắt đầu với một ứng dụng module cơ bản, chỉ có một module duy nhất để phục vụ ứng dụng chính. Cấu trúc thư mục của dự án như sau, với mỗi mức được lồng trong một thư mục:

```text
|─ expenses.application
   |─ module-info.java
   |─ com
      |─ example
         |─ expenses
            |─ application
               |─ ExpensesApplication.java
```

Bạn đã để ý thấy file `module-info.java` bí ẩn nằm trong cấu trúc dự án. File này là một module descriptor, như chúng tôi đã giải thích ở đầu chương, và nó phải nằm ở thư mục gốc của cây thư mục mã nguồn của module, để cho phép bạn chỉ định các phụ thuộc của module và những gì bạn muốn phơi bày. Với ứng dụng expenses của bạn, file `module-info.java` ở mức cao nhất chứa một mô tả module có tên nhưng ngoài ra thì rỗng, bởi nó không phụ thuộc vào module nào khác và cũng không phơi bày chức năng của nó cho module khác. Bạn sẽ học về những tính năng tinh vi hơn ở phần sau, bắt đầu từ mục 14.5. Nội dung của `module-info.java` như sau:

```java
module expenses.application {

}
```

Làm thế nào để chạy một ứng dụng module? Hãy xem một số lệnh để hiểu các phần ở mức thấp. Đoạn này thường được IDE và hệ thống build của bạn tự động hoá, nhưng việc quan sát điều gì đang diễn ra vẫn rất hữu ích. Khi bạn đang ở trong thư mục mã nguồn module của dự án, hãy chạy các lệnh sau:

```bash
javac module-info.java \
      com/example/expenses/application/ExpensesApplication.java -d target

jar cvfe expenses-application.jar \
    com.example.expenses.application.ExpensesApplication -C target .
```

Các lệnh này tạo ra kết quả tương tự như dưới đây, cho thấy những thư mục và file class nào được đưa vào JAR được sinh ra (`expenses-application.jar`):

```text
added manifest
added module-info: module-info.class
adding: com/(in = 0) (out= 0)(stored 0%)
adding: com/example/(in = 0) (out= 0)(stored 0%)
adding: com/example/expenses/(in = 0) (out= 0)(stored 0%)
adding: com/example/expenses/application/(in = 0) (out= 0)(stored 0%)
adding: com/example/expenses/application/ExpensesApplication.class(in = 456)
        (out= 306)(deflated 32%)
```

Cuối cùng, bạn chạy JAR được sinh ra như một ứng dụng module:

```bash
java --module-path expenses-application.jar \
     --module expenses/com.example.expenses.application.ExpensesApplication
```

Bạn hẳn đã quen thuộc với hai bước đầu, vốn là cách chuẩn để đóng gói một ứng dụng Java vào một JAR. Phần mới duy nhất là file `module-info.java` trở thành một phần của bước biên dịch.

Chương trình `java`, vốn dùng để chạy các file `.class` của Java, có hai tuỳ chọn mới:

- `--module-path` — Tuỳ chọn này chỉ định những module nào khả dụng để nạp. Tuỳ chọn này khác với đối số `--classpath`, vốn làm cho các file class trở nên khả dụng.
- `--module` — Tuỳ chọn này chỉ định module và class chính cần chạy.

Phần khai báo của một module không bao gồm chuỗi phiên bản. Việc giải quyết bài toán chọn phiên bản không phải là một mục tiêu thiết kế cụ thể của Java 9 Module System, nên versioning không được hỗ trợ. Lý do biện minh là bài toán này thuộc về phạm vi giải quyết của các build tool và các ứng dụng container.

## 14.5. Làm việc với nhiều module

Giờ khi bạn đã biết cách thiết lập một ứng dụng cơ bản với một module, bạn đã sẵn sàng làm điều gì đó thực tế hơn một chút với nhiều module. Bạn muốn ứng dụng expenses của mình đọc các khoản chi từ một nguồn. Để đạt được điều đó, hãy giới thiệu một module mới `expenses.readers` đóng gói những trách nhiệm này. Tương tác giữa hai module `expenses.application` và `expenses.readers` được chỉ định bằng các mệnh đề `exports` và `requires` của Java 9.

### 14.5.1. Mệnh đề exports

Đây là cách chúng ta có thể khai báo module `expenses.readers`. (Đừng lo về cú pháp và các khái niệm vội; chúng tôi sẽ nói về những chủ đề này sau.)

```java
module expenses.readers {

    // Đây là các tên package, không phải tên module.
    exports com.example.expenses.readers;
    exports com.example.expenses.readers.file;
    exports com.example.expenses.readers.http;
}
```

Có một điều mới: mệnh đề `exports`, vốn làm cho các kiểu public trong những package cụ thể trở nên khả dụng để các module khác sử dụng. Theo mặc định, mọi thứ đều được đóng gói bên trong một module. Hệ thống module áp dụng cách tiếp cận danh sách trắng (whitelist), giúp bạn có được encapsulation mạnh, vì bạn phải quyết định một cách tường minh những gì được cung cấp cho module khác sử dụng. (Cách tiếp cận này ngăn bạn vô tình export một số tính năng nội bộ mà một hacker có thể khai thác để xâm nhập hệ thống của bạn vài năm sau đó.)

Cấu trúc thư mục của phiên bản hai module trong dự án của bạn giờ trông như sau:

```text
|─ expenses.application
   |─ module-info.java
   |─ com
      |─ example
         |─ expenses
            |─ application
               |─ ExpensesApplication.java

|─ expenses.readers
   |─ module-info.java
   |─ com
      |─ example
         |─ expenses
            |─ readers
               |─ Reader.java
            |─ file
               |─ FileReader.java
            |─ http
               |─ HttpReader.java
```

### 14.5.2. Mệnh đề requires

Ngoài ra, bạn có thể viết `module-info.java` như sau:

```java
module expenses.readers {
    requires java.base;  // Đây là tên module, không phải tên package.

    // Đây là các tên package, không phải tên module.
    exports com.example.expenses.readers;
    exports com.example.expenses.readers.file;
    exports com.example.expenses.readers.http;
}
```

Thành phần mới là mệnh đề `requires`, cho phép bạn chỉ định module của bạn phụ thuộc vào những gì. Theo mặc định, tất cả module đều phụ thuộc vào một module nền tảng có tên `java.base`, vốn bao gồm các package chính của Java như `net`, `io` và `util`. Module này luôn được require theo mặc định, nên bạn không cần nói ra điều đó một cách tường minh. (Điều này tương tự việc viết `"class Foo { ... }"` trong Java tương đương với việc viết `"class Foo extends Object { ... }"`.)

Nó trở nên hữu ích khi bạn cần import những module khác ngoài `java.base`.

Sự kết hợp giữa các mệnh đề `requires` và `exports` khiến việc kiểm soát truy cập tới class trong Java 9 trở nên tinh vi hơn. Bảng 14.2 tóm tắt những khác biệt về khả kiến với các access modifier khác nhau trước và sau Java 9.

**Bảng 14.2. Java 9 cung cấp khả năng kiểm soát khả kiến của class chi tiết hơn**

| Khả kiến của class | Trước Java 9 | Sau Java 9 |
|---|---|---|
| Tất cả các class đều public với mọi người | ✔ | ✔ (kết hợp các mệnh đề `exports` và `requires`) |
| Chỉ một số lượng class hạn chế là public | ✘ | ✔ (kết hợp các mệnh đề `exports` và `requires`) |
| Public chỉ bên trong một module | ✘ | ✔ (không có mệnh đề `exports`) |
| Protected | ✔ | ✔ |
| Package | ✔ | ✔ |
| Private | ✔ | ✔ |

### 14.5.3. Đặt tên

Ở giai đoạn này, sẽ hữu ích nếu bàn về quy ước đặt tên cho module. Chúng tôi đã chọn cách tiếp cận ngắn gọn (chẳng hạn `expenses.application`) để không gây nhầm lẫn giữa khái niệm module và package. (Một module có thể export nhiều package.) Tuy nhiên, quy ước được khuyến nghị lại khác.

Oracle khuyến nghị bạn đặt tên module theo đúng quy ước tên miền internet đảo ngược (ví dụ `com.iteratrlearning.training`) vốn được dùng cho package. Hơn nữa, tên của một module nên tương ứng với package API được export chính của nó, và package đó cũng nên tuân theo quy ước ấy. Nếu một module không có package như vậy, hoặc nếu vì những lý do khác nó cần một cái tên không tương ứng với bất kỳ package nào mà nó export, thì tên đó nên bắt đầu bằng dạng đảo ngược của một tên miền internet gắn với tác giả của module.

Giờ khi bạn đã học cách thiết lập một dự án với nhiều module, làm thế nào để đóng gói và chạy nó? Chúng ta sẽ bàn về chủ đề này ở mục tiếp theo.

## 14.6. Biên dịch và đóng gói

Giờ khi bạn đã thoải mái với việc thiết lập một dự án và khai báo một module, bạn đã sẵn sàng để xem cách sử dụng các build tool như Maven nhằm biên dịch dự án của mình. Mục này giả định rằng bạn đã quen thuộc với Maven, một trong những build tool phổ biến nhất trong hệ sinh thái Java. Một build tool phổ biến khác là Gradle, và chúng tôi khuyến khích bạn tìm hiểu nếu bạn chưa từng nghe đến nó.

Trước hết, bạn cần đưa vào một file `pom.xml` cho mỗi module. Thực tế, mỗi module có thể được biên dịch độc lập sao cho nó hoạt động như một dự án riêng. Bạn cũng cần thêm một `pom.xml` cho module cha của tất cả các module để điều phối quá trình build cho toàn bộ dự án. Cấu trúc tổng thể giờ trông như sau:

```text
|─ pom.xml
|─ expenses.application
   |─ pom.xml
   |─ src
      |─ main
         |─ java
            |─ module-info.java
            |─ com
               |─ example
                  |─ expenses
                     |─ application
                        |─ ExpensesApplication.java
|─ expenses.readers
   |─ pom.xml
   |─ src
      |─ main
         |─ java
            |─ module-info.java
            |─ com
               |─ example
                  |─ expenses
                     |─ readers
                        |─ Reader.java
                     |─ file
                        |─ FileReader.java
                     |─ http
                        |─ HttpReader.java
```

Hãy để ý ba file `pom.xml` mới cùng cấu trúc thư mục dự án theo chuẩn Maven. Module descriptor (`module-info.java`) cần nằm trong thư mục `src/main/java`. Maven sẽ thiết lập `javac` để dùng đúng module source path.

File `pom.xml` cho dự án `expenses.readers` trông như sau:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>expenses.readers</artifactId>
    <version>1.0</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>expenses</artifactId>
        <version>1.0</version>
    </parent>
</project>
```

Điều quan trọng cần lưu ý là đoạn code này đề cập một cách tường minh đến module cha nhằm hỗ trợ quá trình build. Module cha là artifact có ID `expenses`. Bạn cần định nghĩa module cha trong `pom.xml`, như bạn sẽ thấy ngay sau đây.

Tiếp theo, bạn cần chỉ định `pom.xml` cho module `expenses.application`. File này tương tự file trước, nhưng bạn phải thêm một dependency tới dự án `expenses.readers`, bởi `ExpensesApplication` cần các class và interface mà nó chứa để biên dịch được:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>expenses.application</artifactId>
    <version>1.0</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>expenses</artifactId>
        <version>1.0</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>expenses.readers</artifactId>
            <version>1.0</version>
        </dependency>
    </dependencies>

</project>
```

Giờ khi hai module `expenses.application` và `expenses.readers` đã có `pom.xml` riêng, bạn có thể thiết lập `pom.xml` tổng thể để điều hướng quá trình build. Maven hỗ trợ các dự án có nhiều Maven module thông qua phần tử XML đặc biệt `<module>`, vốn tham chiếu tới artifact ID của các module con. Dưới đây là định nghĩa đầy đủ, tham chiếu tới hai module con `expenses.application` và `expenses.readers`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>expenses</artifactId>
    <packaging>pom</packaging>
    <version>1.0</version>

    <modules>
        <module>expenses.application</module>
        <module>expenses.readers</module>
    </modules>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.7.0</version>
                    <configuration>
                        <source>9</source>
                        <target>9</target>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

Xin chúc mừng! Giờ bạn có thể chạy lệnh `mvn clean package` để sinh ra các JAR cho những module trong dự án của mình. Lệnh này sinh ra:

```text
./expenses.application/target/expenses.application-1.0.jar
./expenses.readers/target/expenses.readers-1.0.jar
```

Bạn có thể chạy ứng dụng module của mình bằng cách đưa hai JAR này vào module path như sau:

```bash
java --module-path \
  ./expenses.application/target/expenses.application-1.0.jar:\
  ./expenses.readers/target/expenses.readers-1.0.jar \
  --module \
  expenses.application/com.example.expenses.application.ExpensesApplication
```

Cho đến đây, bạn đã tìm hiểu về những module do chính bạn tạo ra, và đã thấy cách dùng `requires` để tham chiếu tới `java.base`. Tuy nhiên, phần mềm trong thế giới thực lại phụ thuộc vào các module và thư viện bên ngoài. Quá trình đó diễn ra thế nào, và sẽ ra sao nếu các thư viện cũ chưa được cập nhật với một `module-info.java` tường minh? Ở mục tiếp theo, chúng tôi trả lời những câu hỏi này bằng cách giới thiệu automatic module.

## 14.7. Automatic module

Bạn có thể quyết định rằng phần cài đặt `HttpReader` của mình quá thấp cấp; thay vào đó, bạn muốn dùng một thư viện chuyên biệt như `httpclient` từ dự án Apache. Làm sao để tích hợp thư viện đó vào dự án của bạn? Bạn đã học về mệnh đề `requires`, nên hãy thử thêm nó vào `module-info.java` của dự án `expenses.readers`. Chạy lại `mvn clean package` để xem điều gì xảy ra. Đáng tiếc, kết quả lại là tin xấu:

```text
[ERROR] module not found: httpclient
```

Bạn nhận được lỗi này bởi bạn cũng cần cập nhật `pom.xml` để khai báo dependency đó. Maven compiler plugin đặt tất cả dependency lên module path khi bạn build một dự án có `module-info.java`, sao cho các JAR phù hợp được tải về và được nhận diện trong dự án của bạn, như sau:

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.httpcomponents</groupId>
        <artifactId>httpclient</artifactId>
        <version>4.5.3</version>
    </dependency>
</dependencies>
```

Giờ chạy `mvn clean package` sẽ build dự án đúng cách. Tuy vậy, hãy để ý một điều thú vị: thư viện `httpclient` không phải là một Java module. Nó là một thư viện bên ngoài mà bạn muốn dùng như một module, nhưng nó chưa được module hoá. Java biến JAR tương ứng thành cái gọi là automatic module. Bất kỳ JAR nào trên module path mà không có file `module-info` đều trở thành một automatic module. Automatic module ngầm export toàn bộ các package của chúng. Tên cho automatic module này được tự động phát sinh, dẫn xuất từ tên của JAR. Bạn có vài cách để suy ra cái tên đó, nhưng cách dễ nhất là dùng công cụ `jar` với đối số `--describe-module`:

```bash
jar --file=./expenses.readers/target/dependency/httpclient-4.5.3.jar \
    --describe-module
httpclient@4.5.3 automatic
```

Trong trường hợp này, tên là `httpclient`.

Bước cuối cùng là chạy ứng dụng và thêm JAR `httpclient` vào module path:

```bash
java --module-path \
  ./expenses.application/target/expenses.application-1.0.jar:\
  ./expenses.readers/target/expenses.readers-1.0.jar:\
  ./expenses.readers/target/dependency/httpclient-4.5.3.jar \
  --module \
  expenses.application/com.example.expenses.application.ExpensesApplication
```

> **Ghi chú**
>
> Có một dự án (https://github.com/moditect/moditect) nhằm cung cấp khả năng hỗ trợ tốt hơn cho Java 9 Module System bên trong Maven, chẳng hạn như sinh tự động các file `module-info`.

## 14.8. Khai báo module và các mệnh đề

Java Module System là một "con quái vật" đồ sộ. Như đã đề cập trước đó, chúng tôi khuyến nghị bạn đọc một cuốn sách chuyên biệt về chủ đề này nếu bạn muốn đi xa hơn. Dù vậy, mục này cho bạn một cái nhìn tổng quan ngắn gọn về những từ khoá khác có sẵn trong ngôn ngữ khai báo module, để bạn hình dung được những gì có thể làm được.

Như bạn đã học ở các mục trước, bạn khai báo một module bằng cách dùng directive `module`. Ở đây, nó có tên `com.iteratrlearning.application`:

```java
module com.iteratrlearning.application {

}
```

Những gì có thể nằm bên trong phần khai báo module? Bạn đã học về các mệnh đề `requires` và `exports`, nhưng còn có những mệnh đề khác, bao gồm `requires transitive`, `exports to`, `open`, `opens`, `uses` và `provides`. Chúng ta sẽ lần lượt xem xét các mệnh đề này ở những mục tiếp theo.

### 14.8.1. requires

Mệnh đề `requires` cho phép bạn chỉ định rằng module của bạn phụ thuộc vào một module khác ở cả thời điểm biên dịch lẫn lúc chạy. Chẳng hạn, module `com.iteratrlearning.application` phụ thuộc vào module `com.iteratrlearning.ui`:

```java
module com.iteratrlearning.application {
    requires com.iteratrlearning.ui;
}
```

Kết quả là chỉ những kiểu public đã được `com.iteratrlearning.ui` export mới khả dụng cho `com.iteratrlearning.application` sử dụng.

### 14.8.2. exports

Mệnh đề `exports` làm cho các kiểu public trong những package cụ thể trở nên khả dụng để các module khác sử dụng. Theo mặc định, không package nào được export. Bạn đạt được encapsulation mạnh bằng cách nêu rõ package nào nên được export. Trong ví dụ sau, các package `com.iteratrlearning.ui.panels` và `com.iteratrlearning.ui.widgets` được export. (Lưu ý rằng `exports` nhận một tên package làm đối số, còn `requires` nhận một tên module, dù cách đặt tên của chúng trông khá giống nhau.)

```java
module com.iteratrlearning.ui {
    requires com.iteratrlearning.core;

    exports com.iteratrlearning.ui.panels;
    exports com.iteratrlearning.ui.widgets;
}
```

### 14.8.3. requires transitive

Bạn có thể chỉ định rằng một module có thể sử dụng các kiểu public được require bởi một module khác. Chẳng hạn, bạn có thể sửa mệnh đề `requires` thành `requires transitive` bên trong phần khai báo của module `com.iteratrlearning.ui`:

```java
module com.iteratrlearning.ui {
    requires transitive com.iteratrlearning.core;

    exports com.iteratrlearning.ui.panels;
    exports com.iteratrlearning.ui.widgets;
}

module com.iteratrlearning.application {
    requires com.iteratrlearning.ui;
}
```

Kết quả là module `com.iteratrlearning.application` có quyền truy cập vào các kiểu public được export bởi `com.iteratrlearning.core`. Tính bắc cầu (transitivity) hữu ích khi module được require (ở đây là `com.iteratrlearning.ui`) trả về các kiểu từ một module khác mà chính nó require (`com.iteratrlearning.core`). Sẽ rất phiền toái nếu phải khai báo lại `requires com.iteratrlearning.core` bên trong module `com.iteratrlearning.application`. Vấn đề này được giải quyết bằng `transitive`. Giờ đây, bất kỳ module nào phụ thuộc vào `com.iteratrlearning.ui` cũng tự động đọc được module `com.iteratrlearning.core`.

### 14.8.4. exports to

Bạn còn có thêm một mức kiểm soát khả kiến nữa, ở chỗ bạn có thể giới hạn những người dùng được phép của một export cụ thể bằng cách dùng cấu trúc `exports to`. Như bạn đã thấy ở mục 14.8.2, bạn có thể giới hạn những người dùng được phép của `com.iteratrlearning.ui.widgets` chỉ còn `com.iteratrlearning.ui.widgetuser` bằng cách điều chỉnh phần khai báo module như sau:

```java
module com.iteratrlearning.ui {
    requires com.iteratrlearning.core;

    exports com.iteratrlearning.ui.panels;
    exports com.iteratrlearning.ui.widgets to
      com.iteratrlearning.ui.widgetuser;
}
```

### 14.8.5. open và opens

Việc dùng bổ từ `open` trên phần khai báo module cho phép các module khác truy cập bằng reflection vào tất cả các package của nó. Bổ từ `open` không có tác động nào tới khả kiến của module ngoài việc cho phép truy cập bằng reflection, như trong ví dụ này:

```java
open module com.iteratrlearning.ui {

}
```

Trước Java 9, bạn có thể kiểm tra trạng thái private của các đối tượng bằng reflection. Nói cách khác, chẳng có gì thực sự được đóng gói cả. Các công cụ ánh xạ đối tượng - quan hệ (ORM) như Hibernate thường dùng khả năng này để truy cập và sửa đổi trạng thái một cách trực tiếp. Trong Java 9, reflection không còn được cho phép theo mặc định nữa. Mệnh đề `open` trong đoạn code trên có tác dụng cho phép hành vi đó khi cần thiết.

Thay vì mở toàn bộ một module cho reflection, bạn có thể dùng mệnh đề `opens` bên trong phần khai báo module để mở từng package riêng lẻ theo nhu cầu. Bạn cũng có thể dùng bổ từ `to` trong biến thể `opens to` nhằm giới hạn những module được phép thực hiện truy cập bằng reflection, tương tự cách `exports to` giới hạn những module được phép require một package đã export.

### 14.8.6. uses và provides

Nếu bạn đã quen thuộc với service và `ServiceLoader`, Java Module System cho phép bạn chỉ định một module là nhà cung cấp dịch vụ (service provider) bằng mệnh đề `provides`, và là bên tiêu thụ dịch vụ (service consumer) bằng mệnh đề `uses`. Tuy nhiên, đây là chủ đề nâng cao và nằm ngoài phạm vi của chương này. Nếu bạn quan tâm đến việc kết hợp module với service loader, chúng tôi khuyến nghị bạn đọc một tài liệu toàn diện như cuốn *The Java Module System* của Nicolai Parlog (Manning Publications) đã đề cập ở đầu chương này.

## 14.9. Một ví dụ lớn hơn và nơi tìm hiểu thêm

Bạn có thể cảm nhận được hương vị của hệ thống module qua ví dụ dưới đây, trích từ tài liệu Java của Oracle. Ví dụ này minh hoạ một phần khai báo module sử dụng hầu hết các tính năng đã bàn trong chương này. Ví dụ không nhằm làm bạn sợ hãi (phần lớn áp đảo các câu lệnh module chỉ đơn giản là `exports` và `requires`), mà nó cho bạn thấy một vài tính năng phong phú hơn:

```java
module com.example.foo {
    requires com.example.foo.http;
    requires java.logging;

    requires transitive com.example.foo.network;

    exports com.example.foo.bar;
    exports com.example.foo.internal to com.example.foo.probe;

    opens com.example.foo.quux;
    opens com.example.foo.internal to com.example.foo.network,
                                      com.example.foo.probe;

    uses com.example.foo.spi.Intf;
    provides com.example.foo.spi.Intf with com.example.foo.Impl;
}
```

Chương này đã bàn về nhu cầu cần đến Java Module System mới và cung cấp một phần giới thiệu nhẹ nhàng về các tính năng chính của nó. Chúng tôi đã không đề cập đến nhiều tính năng, bao gồm service loader, các mệnh đề bổ sung của module descriptor, và các công cụ làm việc với module như `jdeps` và `jlink`. Nếu bạn là một lập trình viên Java EE, điều quan trọng cần ghi nhớ khi chuyển ứng dụng của bạn sang Java 9 là có vài package liên quan tới EE không được nạp theo mặc định trong máy ảo Java 9 đã module hoá. Chẳng hạn, các class của JAXB API giờ được coi là Java EE API và không còn khả dụng trên class path mặc định trong Java SE 9 nữa. Bạn cần thêm một cách tường minh các module quan tâm bằng tuỳ chọn dòng lệnh `--add-modules` để giữ tính tương thích. Ví dụ, để thêm `java.xml.bind`, bạn cần chỉ định `--add-modules java.xml.bind`.

Như chúng tôi đã lưu ý trước đó, để trình bày Java Module System một cách xứng đáng thì cần hẳn một cuốn sách, chứ không phải chỉ một chương. Để khám phá các chi tiết sâu hơn, chúng tôi gợi ý một cuốn sách như *The Java Module System* của Nicolai Parlog (Manning Publications) đã được nhắc tới ở đầu chương này.

## Tóm tắt

- Separation of concerns và information hiding là hai nguyên tắc quan trọng giúp xây dựng phần mềm mà bạn có thể suy luận được.
- Trước Java 9, bạn làm code có tính module bằng cách đưa vào các package, class và interface có một mối quan tâm cụ thể, nhưng những thành phần này chưa đủ giàu để thực hiện encapsulation một cách hiệu quả.
- Vấn đề Class Path Hell khiến việc suy luận về các phụ thuộc của một ứng dụng trở nên khó khăn.
- Trước Java 9, JDK là một khối nguyên khối (monolithic), dẫn tới chi phí bảo trì cao và khả năng tiến hoá bị hạn chế.
- Java 9 giới thiệu một hệ thống module mới, trong đó một file `module-info.java` đặt tên cho module và chỉ định các phụ thuộc của nó (`requires`) cùng API công khai của nó (`exports`).
- Mệnh đề `requires` cho phép bạn chỉ định các phụ thuộc vào những module khác.
- Mệnh đề `exports` làm cho các kiểu public của những package cụ thể trong một module trở nên khả dụng để các module khác sử dụng.
- Quy ước đặt tên được ưa dùng cho một module là theo quy ước tên miền internet đảo ngược.
- Bất kỳ JAR nào trên module path mà không có file `module-info` đều trở thành một automatic module.
- Automatic module ngầm export toàn bộ các package của chúng.
- Maven hỗ trợ các ứng dụng được cấu trúc theo Java 9 Module System.
