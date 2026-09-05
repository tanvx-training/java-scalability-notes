# Chương 1: Bảo mật ngày nay

> **Chương này bao gồm**
>
> - Spring Security là gì và bạn có thể giải quyết vấn đề gì khi sử dụng nó
>
> - Khái niệm bảo mật đối với một ứng dụng phần mềm
>
> - Tại sao bảo mật phần mềm lại thiết yếu và tại sao bạn cần quan tâm đến nó

Các nhà phát triển ngày càng nhận thức rõ hơn về tầm quan trọng của việc xây dựng phần mềm an toàn, và họ đã bắt đầu tự gánh vác trách nhiệm bảo mật ngay từ những bước đầu tiên của quy trình phát triển. Nhìn chung, lập trình viên thường bắt đầu với tư duy rằng mục tiêu cốt lõi của một ứng dụng là giải quyết các bài toán nghiệp vụ. Mục tiêu này xoay quanh việc dữ liệu được xử lý, lưu trữ và cuối cùng là hiển thị cho người dùng theo đúng các yêu cầu đặc tả. Cách tiếp cận này vô tình che khuất các khía cạnh thực hành khác vốn cũng là một phần không thể thiếu của quy trình phát triển phần mềm. Dù ứng dụng hoạt động chính xác dưới góc nhìn của người dùng và đáp ứng đầy đủ các tính năng mong đợi, vẫn có rất nhiều khía cạnh ẩn giấu đằng sau kết quả cuối cùng đó.

Các thuộc tính phi chức năng của phần mềm như hiệu năng (performance), khả năng mở rộng (scalability), độ khả dụng (availability), và tính bảo mật (security) có thể tạo ra những tác động từ ngắn hạn đến dài hạn theo thời gian. Nếu không được cân nhắc ngay từ đầu, các thuộc tính này có thể ảnh hưởng nghiêm trọng đến biên lợi nhuận của chủ sở hữu ứng dụng. Hơn nữa, việc xem nhẹ các khía cạnh này còn có khả năng gây ra lỗi dây chuyền cho các hệ thống khác (ví dụ: vô tình trở thành một phần của cuộc tấn công từ chối dịch vụ phân tán [DDoS] 1). Bản chất ẩn giấu của các yêu cầu phi chức năng (việc phát hiện ra sự thiếu sót hay chưa hoàn thiện của chúng khó khăn hơn nhiều) khiến chúng trở nên nguy hiểm gấp bội.

*Hình 1.1 Người dùng thường chỉ tập trung vào những gì hệ thống cần thực hiện — tức là khía cạnh chức năng. Đôi khi, họ có thể cân nhắc đến hiệu năng hệ thống (một thuộc tính phi chức năng), nhưng rất hiếm khi họ để mắt tới các biện pháp bảo mật. Những yêu cầu không liên quan trực tiếp đến chức năng thường dễ bị ngó lơ hơn so với những yêu cầu chức năng hiển hiện.*

Có nhiều khía cạnh phi chức năng cần cân nhắc khi xây dựng một hệ thống phần mềm. Trên thực tế, tất cả các yếu tố này đều quan trọng và cần được xử lý một cách có trách nhiệm trong suốt quá trình phát triển. Cuốn sách này tập trung vào một trong số đó: tính bảo mật. Bạn sẽ học cách bảo vệ ứng dụng của mình, từng bước một, bằng Spring Security.

Chương này sẽ cung cấp cho bạn một bức tranh toàn cảnh về các khái niệm liên quan đến bảo mật. Xuyên suốt cuốn sách, chúng ta sẽ thực hành trên các ví dụ thực tế, và ở những nơi phù hợp, tôi sẽ liên hệ lại với các mô tả đã nêu trong chương này để phân tích sâu hơn. Đâu đó trong sách, bạn cũng sẽ tìm thấy các tài liệu tham khảo (sách, bài viết và tài liệu hướng dẫn) về các chủ đề cụ thể để phục vụ việc nghiên cứu chuyên sâu.

## 1.1 Khám phá Spring Security

Phần này thảo luận về mối quan hệ giữa Spring Security và Spring. Trước tiên, việc hiểu rõ mối liên kết giữa cả hai trước khi bắt đầu sử dụng là điều vô cùng quan trọng. Nếu truy cập trang web chính thức (https://spring.io/projects/spring-security), chúng ta sẽ thấy Spring Security được định nghĩa là một khung công tác (framework) mạnh mẽ và có tính tùy biến cao dành cho việc xác thực và kiểm soát truy cập. Nói một cách đơn giản, đây là một framework giúp đơn giản hóa đáng kể việc tích hợp bảo mật vào các ứng dụng Spring.

Spring Security là lựa chọn hàng đầu để triển khai bảo mật ở cấp độ ứng dụng trong các dự án Spring. Nhìn chung, mục tiêu của nó là mang lại một phương thức có khả năng tùy biến cao để triển khai xác thực, phân quyền, và bảo vệ ứng dụng trước các cuộc tấn công phổ biến. Spring Security là phần mềm mã nguồn mở được phát hành theo giấy phép Apache 2.0. Bạn có thể truy cập mã nguồn của nó trên GitHub tại http://mng.bz/vPmJ. Tôi cũng khuyến khích bạn tích cực đóng góp cho dự án này.

> **LƯU Ý** Bạn có thể sử dụng Spring Security cho cả các ứng dụng web servlet tiêu chuẩn lẫn các ứng dụng phản ứng (reactive), cũng như các ứng dụng không phải web. Trong cuốn sách này, chúng ta sẽ áp dụng Spring Security với các phiên bản Java hỗ trợ dài hạn (LTS), Spring, và Spring Boot mới nhất (Java 21, Spring 6, và Spring Boot 3). Tuy nhiên, toàn bộ ví dụ trong sách vẫn hoạt động hoàn hảo với Java 17, phiên bản LTS trước đó.

Tôi đoán rằng nếu đã mở cuốn sách này, bạn đang làm việc với các ứng dụng Spring và quan tâm đến việc bảo mật chúng. Spring Security chắc chắn là lựa chọn tối ưu nhất dành cho bạn. Nó là giải pháp tiêu chuẩn thực tế (de facto) để triển khai bảo mật cấp ứng dụng cho các dự án Spring. Tuy nhiên, Spring Security không tự động bảo mật ứng dụng của bạn. Nó không phải là một "liều thuốc vạn năng" kỳ diệu để đảm bảo ứng dụng hoàn toàn không có lỗ hổng. Các nhà phát triển cần hiểu rõ cách cấu hình và tùy biến Spring Security sao cho phù hợp với nhu cầu cụ thể của hệ thống. Cách thực hiện điều này phụ thuộc vào rất nhiều yếu tố, từ yêu cầu chức năng cho đến kiến trúc hệ thống.

Về mặt kỹ thuật, việc áp dụng bảo mật bằng Spring Security trong các ứng dụng Spring khá đơn giản. Bạn đã từng phát triển các ứng dụng Spring, nên bạn biết rằng triết lý của framework này bắt đầu từ việc quản lý Spring context. Bạn định nghĩa các bean trong Spring context để cho phép framework quản lý chúng dựa trên các cấu hình mà bạn chỉ định.

Bạn sử dụng các annotation để chỉ thị cho Spring cần làm gì: hiển thị các endpoint, bao bọc các phương thức trong các transaction, chặn các phương thức bằng aspect, v.v. Điều này cũng hoàn toàn tương tự với cấu hình Spring Security. Bạn sẽ muốn sử dụng các annotation, bean và phong cách cấu hình đặc trưng của Spring một cách thoải mái khi định nghĩa bảo mật cấp ứng dụng. Trong một ứng dụng Spring, các hành vi cần bảo vệ được định nghĩa thông qua các phương thức.

Để hình dung về bảo mật ở cấp độ ứng dụng, hãy liên tưởng đến ngôi nhà của bạn và cách bạn cho phép mọi người ra vào. Bạn có giấu chìa khóa dưới thảm trước cửa không? Bạn có khóa cửa chính không? Khái niệm tương tự cũng được áp dụng cho các ứng dụng, và Spring Security sẽ giúp bạn xây dựng chức năng này. Nó giống như một mảnh ghép mang lại nhiều lựa chọn để... phác họa nên bức tranh chính xác mô tả hệ thống của bạn. Bạn có thể chọn để ngôi nhà của mình hoàn toàn không khóa, hoặc quyết định không cho phép bất kỳ ai tự ý bước vào nhà.

Cách bạn cấu hình bảo mật có thể rất đơn giản như việc giấu chìa khóa dưới thảm, hoặc phức tạp hơn như việc lắp đặt các hệ thống báo động, camera giám sát và khóa nhiều lớp. Trong ứng dụng, bạn cũng có những lựa chọn tương tự, nhưng cũng giống như ngoài đời thực, cấu trúc càng phức tạp thì chi phí càng cao. Trong một ứng dụng, chi phí này ám chỉ việc bảo mật sẽ ảnh hưởng thế nào đến khả năng bảo trì và hiệu năng của hệ thống.

Nhưng làm thế nào để sử dụng Spring Security với các ứng dụng Spring? Nhìn chung, ở cấp độ ứng dụng, một trong những tình huống phổ biến nhất là khi bạn cần quyết định xem ai đó có được phép thực hiện một hành động hoặc sử dụng một phần dữ liệu nào đó hay không. Dựa trên các cấu hình, bạn sẽ viết các thành phần (component) Spring Security để chặn các yêu cầu (request) và đảm bảo rằng bất kỳ ai gửi yêu cầu đều có quyền truy cập vào các tài nguyên được bảo vệ. Lập trình viên sẽ cấu hình các thành phần này để hoạt động chính xác theo mong muốn. Nếu bạn lắp đặt một hệ thống báo động, chính bạn phải là người đảm bảo rằng nó được thiết lập cho cả cửa sổ lẫn cửa chính. Nếu bạn quên cài đặt cho cửa sổ, đó không phải là lỗi của hệ thống báo động khi nó không kêu lúc có kẻ cậy cửa sổ đột nhập.

Các trách nhiệm khác của các thành phần Spring Security liên quan đến việc lưu trữ dữ liệu cũng như truyền tải dữ liệu giữa các phần khác nhau của hệ thống. Bằng cách chặn các lệnh gọi (call) đến các phần khác nhau này, các thành phần bảo mật có thể tác động lên dữ liệu. Ví dụ, khi dữ liệu được lưu trữ, các thành phần này có thể áp dụng các thuật toán mã hóa (encryption) hoặc băm (hashing). Việc mã hóa dữ liệu giúp đảm bảo dữ liệu chỉ có thể được truy cập bởi các thực thể có đặc quyền. Trong ứng dụng Spring, lập trình viên phải thêm và cấu hình một thành phần để thực hiện công việc này ở bất kỳ nơi nào cần thiết. Spring Security cung cấp cho chúng ta một giao ước (contract) để biết framework yêu cầu triển khai những gì, và chúng ta sẽ viết mã nguồn triển khai theo thiết kế của ứng dụng. Điều tương tự cũng áp dụng cho quá trình truyền tải dữ liệu.

Trong thực tế triển khai, bạn sẽ gặp những trường hợp hai thành phần giao tiếp không tin tưởng lẫn nhau. Làm thế nào thành phần thứ nhất biết được thành phần thứ hai đã gửi một thông điệp cụ thể, chứ không phải một kẻ nào khác? Hãy tưởng tượng bạn đang gọi điện thoại với một người mà bạn phải cung cấp thông tin cá nhân bảo mật. Làm thế nào bạn chắc chắn rằng người ở đầu dây bên kia thực sự là người có quyền nhận dữ liệu đó chứ không phải ai khác? Tình huống tương tự cũng xảy ra với ứng dụng của bạn. Spring Security cung cấp các thành phần cho phép bạn giải quyết các vấn đề này theo nhiều cách khác nhau, nhưng bạn phải biết thành phần nào cần cấu hình và thiết lập nó trong hệ thống của mình. Bằng cách này, Spring Security sẽ chặn các thông điệp và đảm bảo xác thực giao tiếp trước khi ứng dụng sử dụng bất kỳ loại dữ liệu nào được gửi hoặc nhận.

Giống như bất kỳ framework nào, một trong những mục đích chính của Spring là cho phép bạn viết ít mã nguồn hơn để triển khai các chức năng mong muốn. Đó cũng chính là những gì Spring Security mang lại. Nó bổ trợ cho Spring dưới vai trò một framework bằng cách giúp bạn viết ít code hơn để thực hiện một trong những khía cạnh quan trọng nhất của ứng dụng — bảo mật. Spring Security cung cấp các chức năng được định nghĩa sẵn để giúp bạn tránh việc phải viết mã nguồn lặp đi lặp lại (boilerplate code) hoặc tái triển khai cùng một logic từ ứng dụng này sang ứng dụng khác. Tuy nhiên, nó cũng cho phép bạn tùy ý cấu hình bất kỳ thành phần nào, từ đó mang lại tính linh hoạt cực kỳ cao. Để tóm tắt nhanh cuộc thảo luận này:

- Bạn sử dụng Spring Security để tích hợp bảo mật cấp ứng dụng vào các ứng dụng Spring theo phong cách đặc trưng của Spring. Ý tôi là bạn sẽ sử dụng các annotation, bean, ngôn ngữ biểu thức Spring (SpEL), v.v.

- Spring Security là một framework cho phép bạn xây dựng bảo mật cấp ứng dụng. Tuy nhiên, việc hiểu và sử dụng Spring Security đúng cách hoàn toàn phụ thuộc vào bạn — nhà phát triển. Bản thân Spring Security không tự động bảo vệ ứng dụng hoặc dữ liệu nhạy cảm ở trạng thái lưu trữ hay đang truyền tải. Cuốn sách này cung cấp cho bạn thông tin cần thiết để sử dụng hiệu quả Spring Security.

> **Các giải pháp thay thế Spring Security**
>
> Cuốn sách này viết về Spring Security, nhưng đối với bất kỳ giải pháp nào, tôi luôn khuyến khích có một cái nhìn bao quát. Đừng bao giờ quên tìm hiểu các giải pháp thay thế cho mỗi lựa chọn của mình. Một trong những bài học tôi rút ra theo thời gian là không có gì là hoàn toàn đúng hay sai. Câu nói "Mọi thứ chỉ là tương đối" cũng hoàn toàn đúng trong trường hợp này!
>
> Bạn sẽ không tìm thấy nhiều giải pháp thay thế cho Spring Security khi nói đến việc bảo mật một ứng dụng Spring. Một giải pháp thay thế bạn có thể cân nhắc là Apache Shiro (https://shiro.apache.org). Nó mang lại sự linh hoạt trong cấu hình và dễ dàng tích hợp với các ứng dụng Spring và Spring Boot. Apache Shiro đôi khi là một giải pháp thay thế tốt cho cách tiếp cận của Spring Security.
>
> Nếu đã từng làm việc với Spring Security, bạn sẽ thấy việc học và sử dụng Apache Shiro khá dễ dàng và thoải mái. Nó cung cấp các annotation và thiết kế riêng cho các ứng dụng web dựa trên các bộ lọc HTTP (HTTP filter), giúp đơn giản hóa đáng kể việc phát triển ứng dụng web. Ngoài ra, bạn có thể bảo mật nhiều loại ứng dụng khác ngoài ứng dụng web bằng Shiro, từ các ứng dụng dòng lệnh nhỏ, ứng dụng di động cho đến các ứng dụng doanh nghiệp quy mô lớn. Và dù đơn giản, nó vẫn đủ mạnh mẽ để sử dụng cho nhiều tác vụ — từ xác thực và phân quyền cho đến mã hóa dữ liệu và quản lý phiên làm việc (session).
>
> Tuy nhiên, Apache Shiro có thể quá nhẹ so với nhu cầu ứng dụng của bạn. Spring Security không chỉ là một cây búa, mà là cả một bộ công cụ toàn diện. Nó mang lại khả năng tùy biến ở quy mô lớn hơn nhiều và được thiết kế chuyên biệt cho các ứng dụng Spring. Hơn nữa, nó còn được hưởng lợi từ một cộng đồng nhà phát triển hoạt động cực kỳ sôi nổi và không ngừng được nâng cấp, cải tiến.

## 1.2 Bảo mật phần mềm là gì?

Các hệ thống phần mềm quản lý một lượng lớn dữ liệu, trong đó một phần đáng kể có thể được coi là nhạy cảm, đặc biệt là ở một số khu vực trên thế giới, ví dụ như theo các yêu cầu của Quy định chung về bảo vệ dữ liệu (GDPR) 2 của châu Âu. Bất kỳ thông tin nào mà bạn, với tư cách là người dùng, coi là riêng tư đều là thông tin nhạy cảm đối với ứng dụng phần mềm của bạn. Dữ liệu nhạy cảm có thể bao gồm những thông tin tưởng chừng như vô hại như số điện thoại, địa chỉ email hoặc số định danh cá nhân, mặc dù chúng ta thường lo sợ mất đi những dữ liệu có tính rủi ro cao hơn như chi tiết thẻ tín dụng. Ứng dụng phải đảm bảo rằng không có bất kỳ cơ hội nào để những thông tin đó bị truy cập, thay đổi hoặc đánh cắp. Không có bên thứ ba nào khác ngoài những người dùng được chỉ định của dữ liệu này được phép tương tác với nó dưới bất kỳ hình thức nào. Hiểu một cách rộng rãi, đó chính là ý nghĩa của bảo mật.

Chúng ta áp dụng bảo mật theo nhiều lớp, với mỗi lớp đòi hỏi một cách tiếp cận khác nhau. Hãy tưởng tượng các lớp này giống như một tòa lâu đài kiên cố được bảo vệ nghiêm ngặt. Kẻ tấn công cần vượt qua nhiều chướng ngại vật khác nhau để có thể tiếp cận được tài nguyên do ứng dụng quản lý. Bạn càng bảo mật tốt từng lớp bao nhiêu, cơ hội để một kẻ có ý đồ xấu truy cập được dữ liệu hoặc thực hiện các hành vi trái phép càng thấp bấy nhiêu.

Bảo mật là một chủ đề phức tạp. Đối với một hệ thống phần mềm, bảo mật không chỉ tồn tại ở cấp độ ứng dụng. Ví dụ, đối với tầng mạng (networking), có những vấn đề cần phải lưu ý và các phương pháp thực hành đặc thù, trong khi đối với lưu trữ (storage), đó lại là một câu chuyện hoàn toàn khác. Tương tự, khía cạnh triển khai (deployment) cũng có một triết lý tiếp cận riêng biệt. Spring Security là một framework thuộc về bảo mật cấp độ ứng dụng. Trong phần này, bạn sẽ có được một cái nhìn tổng quan về cấp độ bảo mật này và các khía cạnh liên quan của nó.

Bảo mật cấp ứng dụng đề cập đến mọi thứ mà một ứng dụng cần thực hiện để bảo vệ môi trường mà nó đang chạy, cũng như dữ liệu mà nó xử lý và lưu trữ. Hãy lưu ý rằng, điều này không chỉ giới hạn ở dữ liệu bị ảnh hưởng và sử dụng bởi ứng dụng. Một ứng dụng có thể chứa các lỗ hổng cho phép kẻ tấn công phá hoại toàn bộ hệ thống!

Để rõ ràng hơn, hãy cùng thảo luận về một vài trường hợp thực tế. Chúng ta sẽ xem xét một tình huống triển khai hệ thống. Tình huống này rất phổ biến đối với các hệ thống được thiết kế theo kiến trúc microservices, đặc biệt là khi bạn triển khai nó trên nhiều vùng khả dụng (Availability Zone - AZ) 3 trên đám mây.

> **LƯU Ý** Nếu bạn quan tâm đến việc xây dựng các ứng dụng Spring hướng đám mây hiệu quả, tôi đặc biệt khuyên đọc cuốn Cloud Native Spring in Action của tác giả Thomas Vitale (Manning, 2022). Trong cuốn sách này, tác giả tập trung vào tất cả các khía cạnh cần thiết mà một chuyên gia cần nắm vững để phát triển các ứng dụng Spring tối ưu cho việc triển khai trên môi trường đám mây.

Với các kiến trúc dịch vụ và microservices như vậy, chúng ta có thể đối mặt với nhiều lỗ hổng bảo mật khác nhau, vì vậy bạn cần phải hết sức thận trọng. Như đã đề cập trước đó, bảo mật là một khía cạnh mang tính liên đới (cross-cutting concern) được thiết kế trên nhiều lớp. Khi xử lý các vấn đề bảo mật của một lớp, nguyên tắc tốt nhất là giả định rằng lớp phía trên nó hoàn toàn không tồn tại. Hãy nghĩ đến phép so sánh với tòa lâu đài. Nếu bạn quản lý một lớp phòng thủ với 30 binh lính, bạn sẽ muốn huấn luyện họ trở nên tinh nhuệ nhất có thể. Và bạn thực hiện điều này ngay cả khi biết rằng trước khi tiếp cận được họ, kẻ địch sẽ phải vượt qua một cây cầu lửa rực cháy.

Với tư duy đó, hãy giả định rằng một kẻ có ý đồ xấu có thể đăng nhập vào máy ảo (VM) lưu trữ ứng dụng thứ nhất. Đồng thời, hãy giả định rằng ứng dụng thứ hai không hề xác thực các yêu cầu được gửi từ ứng dụng thứ nhất. Khi đó, kẻ tấn công có thể khai thác lỗ hổng này để kiểm soát ứng dụng thứ hai bằng cách giả mạo ứng dụng thứ nhất.

Ngoài ra, hãy xem xét trường hợp chúng ta triển khai hai dịch vụ ở hai vị trí khác nhau. Khi đó, kẻ tấn công thậm chí không cần đăng nhập vào một trong các máy ảo mà có thể can thiệp trực tiếp vào quá trình truyền thông giữa hai ứng dụng.

Trước đó tôi có đề cập đến xác thực và phân quyền. Đây là hai cơ chế hiện diện trong hầu hết các ứng dụng. Qua quá trình xác thực, ứng dụng sẽ định danh một người dùng (có thể là một cá nhân hoặc một ứng dụng khác). Mục đích của việc định danh này là để sau đó hệ thống có thể quyết định họ được phép làm những gì — đó chính là phân quyền. Tôi sẽ trình bày chi tiết về xác thực và phân quyền bắt đầu từ chương 3 và tiếp tục xuyên suốt cuốn sách này.

Trong một ứng dụng, bạn sẽ thường thấy nhu cầu triển khai phân quyền trong nhiều tình huống khác nhau. Hãy xem xét một tình huống khác: hầu hết các ứng dụng đều có những hạn chế đối với việc người dùng truy cập vào một số chức năng cụ thể. Để đạt được điều này, trước hết cần phải xác định ai là người gửi yêu cầu truy cập vào một tính năng cụ thể — đó chính là xác thực. Chúng ta cũng cần biết các đặc quyền của họ để cho phép người dùng sử dụng phần đó của hệ thống. Khi hệ thống ngày càng phức tạp, bạn sẽ gặp phải nhiều tình huống khác nhau đòi hỏi các cách triển khai xác thực và phân quyền đặc thù.

Ví dụ, điều gì sẽ xảy ra nếu bạn muốn ủy quyền cho một thành phần cụ thể của hệ thống truy cập vào một tập con dữ liệu hoặc thực hiện một số thao tác thay mặt cho người dùng? Giả sử máy in cần quyền truy cập để đọc các tài liệu của người dùng. Liệu bạn có nên chia sẻ trực tiếp thông tin đăng nhập của người dùng cho máy in hay không? Làm như vậy sẽ cung cấp cho máy in nhiều quyền hạn hơn mức cần thiết, đồng thời làm lộ thông tin đăng nhập của người dùng. Có phương pháp nào phù hợp để thực hiện việc này mà không cần phải giả mạo danh tính của người dùng hay không? Đây là những câu hỏi cốt lõi và cũng là những vấn đề bạn sẽ gặp phải khi phát triển ứng dụng: những câu hỏi mà chúng ta không chỉ muốn tìm lời giải đáp, mà bạn còn thấy được cách ứng dụng Spring Security để xử lý trong cuốn sách này.

Tùy thuộc vào kiến trúc được lựa chọn cho hệ thống, bạn sẽ thấy cơ chế xác thực và phân quyền xuất hiện ở cấp độ toàn bộ hệ thống cũng như ở cấp độ từng thành phần riêng lẻ. Và như bạn sẽ thấy ở các phần tiếp theo trong sách, với Spring Security, đôi khi bạn sẽ muốn áp dụng phân quyền ngay cả cho các tầng (tier) khác nhau của cùng một thành phần. Trong chương 11, chúng ta sẽ thảo luận sâu hơn về bảo mật cấp độ phương thức (method security), khía cạnh liên quan trực tiếp đến vấn đề này. Thiết kế hệ thống sẽ càng phức tạp hơn khi bạn có một tập hợp các vai trò (role) và quyền hạn (authority) được định nghĩa trước.

Tôi cũng muốn hướng sự chú ý của bạn đến việc lưu trữ dữ liệu. Dữ liệu tĩnh (data at rest) đặt lên vai ứng dụng một trách nhiệm lớn. Ứng dụng của bạn không nên lưu trữ tất cả dữ liệu dưới định dạng có thể đọc trực tiếp được. Đôi khi ứng dụng cần phải lưu trữ dữ liệu dưới dạng được mã hóa bằng khóa riêng tư hoặc được băm (hash). Các thông tin bảo mật như thông tin đăng nhập và khóa riêng tư cũng được coi là dữ liệu tĩnh. Chúng cần được lưu trữ cẩn thận, thông thường là trong một kho lưu trữ bảo mật (secrets vault).

> **LƯU Ý** Chúng ta phân loại dữ liệu thành hai trạng thái: "tĩnh" (at rest) hoặc "đang truyền tải" (in transition). Trong ngữ cảnh này, dữ liệu tĩnh đề cập đến dữ liệu nằm trong thiết bị lưu trữ của máy tính, hay nói cách khác là dữ liệu được lưu trữ lâu dài. Dữ liệu đang truyền tải áp dụng cho tất cả dữ liệu được trao đổi từ điểm này sang điểm khác. Do đó, các biện pháp bảo mật khác nhau cần được áp dụng tùy thuộc vào từng trạng thái của dữ liệu.

Cuối cùng, một ứng dụng đang chạy cũng phải quản lý cả bộ nhớ nội bộ của nó. Nghe có vẻ kỳ lạ, nhưng dữ liệu được lưu trữ trong vùng nhớ heap của ứng dụng cũng có thể tạo ra các lỗ hổng. Đôi khi, thiết kế lớp cho phép ứng dụng lưu trữ dữ liệu nhạy cảm, chẳng hạn như thông tin đăng nhập hoặc khóa riêng tư, trong một thời gian dài. Trong những trường hợp như vậy, một người có quyền thực hiện trích xuất bộ nhớ heap (heap dump) có thể tìm thấy các thông tin chi tiết này và sử dụng chúng với mục đích xấu.

Với phần mô tả ngắn gọn về các trường hợp này, tôi hy vọng đã mang đến cho bạn một cái nhìn tổng quan về bảo mật ứng dụng, đồng thời minh họa được mức độ phức tạp của chủ đề này. Bảo mật phần mềm là một lĩnh vực đầy rẫy những thách thức đan xen. Một người muốn trở thành chuyên gia trong lĩnh vực này cần phải hiểu rõ (cũng như áp dụng) và kiểm thử các giải pháp cho tất cả các lớp cộng tác trong một hệ thống. Tuy nhiên, trong cuốn sách này, chúng ta sẽ chỉ tập trung vào việc trình bày chi tiết những gì bạn cần hiểu cụ thể về Spring Security. Bạn sẽ biết framework này được áp dụng ở đâu và không áp dụng ở đâu, nó giúp ích gì và tại sao bạn nên sử dụng nó. Tất nhiên, chúng ta sẽ thực hiện điều này thông qua các ví dụ thực tế mà bạn hoàn toàn có thể tùy biến cho phù hợp với các tình huống sử dụng độc nhất của riêng mình.

## 1.3 Tại sao bảo mật lại quan trọng?

Cách tốt nhất để bắt đầu suy nghĩ về tầm quan trọng của bảo mật là xuất phát từ góc nhìn của chính bạn với tư cách là một người dùng. Giống như bất kỳ ai khác, bạn sử dụng các ứng dụng và các ứng dụng này có quyền truy cập vào dữ liệu của bạn. Chúng có thể thay đổi, sử dụng hoặc làm lộ dữ liệu đó. Hãy nghĩ về tất cả các ứng dụng bạn đang dùng, từ email cho đến tài khoản dịch vụ ngân hàng trực tuyến. Bạn sẽ đánh giá mức độ nhạy cảm của dữ liệu do tất cả các hệ thống này quản lý như thế nào? Còn về các hành động mà bạn có thể thực hiện thông qua các hệ thống đó thì sao? Tương tự như dữ liệu, một số hành động sẽ quan trọng hơn những hành động khác. Bạn có thể không quá bận tâm về một số hành động thông thường, nhưng sẽ có những hành động mang tính quyết định hơn nhiều. Có thể đối với bạn, việc ai đó đọc được vài bức thư điện tử không phải là vấn đề quá lớn. Nhưng tôi dám cá rằng bạn sẽ vô cùng lo lắng nếu một kẻ nào đó có thể rút sạch tiền trong tài khoản ngân hàng của mình.

Khi đã suy nghĩ về bảo mật từ góc nhìn cá nhân, hãy cố gắng nhìn nhận một bức tranh khách quan hơn. Cùng một loại dữ liệu hoặc hành động đó có thể có mức độ nhạy cảm hoàn toàn khác đối với những người khác. Một số người có thể bận tâm hơn bạn rất nhiều nếu email của họ bị truy cập và có ai đó đọc được tin nhắn của họ. Ứng dụng của bạn phải đảm bảo bảo vệ mọi thứ theo đúng mức độ truy cập mong muốn. Bất kỳ sự rò rỉ nào cho phép kẻ xấu khai thác dữ liệu và chức năng, cũng như sử dụng ứng dụng để gây ảnh hưởng đến các hệ thống khác, đều được coi là một lỗ hổng bảo mật, và bạn cần phải khắc phục nó.

Việc không chú trọng đúng mức đến bảo mật sẽ đi kèm với một cái giá mà tôi tin chắc rằng bạn không hề muốn trả. Nhìn chung, cái giá đó thường liên quan đến tiền bạc. Nhưng chi phí thiệt hại có thể khác nhau, và có nhiều con đường dẫn đến việc tổn thất lợi nhuận. Tổn thất không chỉ giới hạn ở việc mất tiền từ tài khoản ngân hàng hoặc sử dụng một dịch vụ mà không trả phí. Những điều này rõ ràng là gây thiệt hại trực tiếp. Nhưng hình ảnh của một thương hiệu hay một công ty cũng có giá trị vô cùng to lớn, và việc đánh mất đi hình ảnh tốt đẹp có thể phải trả giá rất đắt — đôi khi còn tốn kém hơn nhiều so với những tổn thất trực tiếp từ việc một lỗ hổng bảo mật bị khai thác! Niềm tin của người dùng dành cho ứng dụng của bạn là một trong những tài sản vô giá nhất, và nó có thể quyết định sự thành bại của cả một doanh nghiệp.

Dưới đây là một vài ví dụ giả định. Hãy thử suy ngẫm xem bạn sẽ nhìn nhận chúng thế nào dưới góc độ người dùng, và chúng có thể ảnh hưởng ra sao đến tổ chức chịu trách nhiệm về phần mềm đó:

- Một ứng dụng nội bộ (back-office) được giao nhiệm vụ quản lý dữ liệu nội bộ của một tổ chức, nhưng bằng cách nào đó, một số thông tin lại bị rò rỉ ra ngoài.

- Người dùng của một ứng dụng đặt xe nhận thấy tiền trong tài khoản của họ bị trừ cho những chuyến đi không phải của mình.

- Sau một bản cập nhật, người dùng của một ứng dụng ngân hàng di động lại nhìn thấy các giao dịch thuộc về những người dùng khác.

Trong trường hợp thứ nhất, tổ chức sử dụng phần mềm cũng như các nhân viên của họ đều có thể chịu ảnh hưởng. Trong một số tình huống, công ty có thể phải chịu trách nhiệm pháp lý và tổn thất một khoản tiền khổng lồ. Ở trường hợp này, người dùng không có quyền lựa chọn thay đổi ứng dụng, nhưng tổ chức hoàn toàn có thể quyết định thay thế nhà cung cấp phần mềm của họ.

Trong trường hợp thứ hai, người dùng có thể sẽ lựa chọn chuyển sang sử dụng dịch vụ của nhà cung cấp khác. Hình ảnh của công ty phát triển ứng dụng sẽ bị ảnh hưởng nghiêm trọng. Thiệt hại về mặt tiền bạc trong trường hợp này thậm chí còn ít hơn nhiều so với tổn hại về mặt hình ảnh thương hiệu. Ngay cả khi tiền được hoàn trả cho những người dùng bị ảnh hưởng, ứng dụng vẫn sẽ mất đi một lượng khách hàng nhất định. Điều này ảnh hưởng trực tiếp đến doanh thu và thậm chí có thể dẫn đến phá sản. Và trong trường hợp thứ ba, ngân hàng có thể phải đối mặt với những hậu quả thảm khốc về mặt niềm tin của khách hàng cũng như các rắc rối pháp lý nghiêm trọng.

Trong hầu hết các tình huống này, việc đầu tư vào bảo mật luôn là giải pháp an toàn hơn nhiều so với việc phải gánh chịu hậu quả khi có ai đó khai thác thành công lỗ hổng trong hệ thống của bạn. Đối với tất cả các ví dụ trên, chỉ một sơ hở nhỏ cũng có thể dẫn đến những kết cục tồi tệ đó. Ở ví dụ đầu tiên, đó có thể là một cơ chế xác thực bị lỗi hoặc lỗ hổng giả mạo yêu cầu chéo trang (CSRF). Ở ví dụ thứ hai và thứ ba, nguyên nhân có thể là do thiếu kiểm soát truy cập ở cấp độ phương thức. Và đối với tất cả các ví dụ, đó có thể là sự kết hợp của nhiều lỗ hổng khác nhau.

Tất nhiên, chúng ta có thể đi xa hơn thế và thảo luận về tính bảo mật trong các hệ thống liên quan đến quốc phòng. Nếu bạn coi tiền bạc là quan trọng, hãy cộng thêm cả mạng sống con người vào cái giá phải trả! Bạn có thể hình dung ra hậu quả sẽ ra sao nếu một hệ thống y tế bị tấn công? Hay các hệ thống điều khiển nhà máy điện hạt nhân thì sao? Bạn có thể giảm thiểu mọi rủi ro bằng cách đầu tư sớm vào bảo mật cho ứng dụng của mình, đồng thời phân bổ đủ thời gian cho các chuyên gia bảo mật phát triển và kiểm thử các cơ chế phòng thủ của hệ thống.

> **LƯU Ý** Bài học rút ra từ những người đi trước đã thất bại là chi phí để giải quyết hậu quả của một cuộc tấn công thường cao hơn rất nhiều so với chi phí đầu tư để phòng ngừa lỗ hổng ngay từ đầu.

Trong phần còn lại của cuốn sách này, bạn sẽ được tiếp cận với các ví dụ về cách áp dụng Spring Security nhằm tránh gặp phải các tình huống như đã nêu. Tôi tin rằng không có ngôn từ nào là đủ để diễn tả hết tầm quan trọng của bảo mật. Khi buộc phải đưa ra một sự thỏa hiệp về tính bảo mật của hệ thống, hãy cố gắng đánh giá các rủi ro của bạn một cách chính xác nhất.

## 1.4 Bạn sẽ học được gì trong cuốn sách này?

Cuốn sách này mang đến một phương pháp tiếp cận thực tế để học Spring Security. Trong suốt phần còn lại của sách, chúng ta sẽ đi sâu vào Spring Security, chứng minh các khái niệm bằng những ví dụ từ đơn giản đến phức tạp hơn. Để tiếp thu cuốn sách này một cách hiệu quả nhất, bạn nên trang bị kiến thức lập trình Java vững vàng, cũng như các khái niệm cơ bản về Spring Framework. Nếu chưa từng sử dụng Spring Framework hoặc chưa cảm thấy tự tin với những kiến thức nền tảng của nó, tôi khuyên bạn nên đọc cuốn Spring Start Here, một cuốn sách khác do tôi viết (Manning, 2021). Sau khi đọc xong cuốn sách đó, bạn có thể nâng cao kiến thức về Spring của mình với cuốn Spring in Action, Sixth Edition của Craig Walls (Manning, 2022), cũng như cuốn Spring Boot: Up and Running của Mark Heckler (OʼReilly Media, 2021).

Trong cuốn sách này, bạn sẽ học:

- Kiến trúc và các thành phần cơ bản của Spring Security, cùng cách sử dụng chúng để bảo mật ứng dụng của bạn.

- Xác thực và phân quyền với Spring Security, bao gồm các luồng OAuth 2 và OpenID Connect, và cách áp dụng chúng vào một ứng dụng sẵn sàng cho môi trường sản xuất (production-ready).

- Cách triển khai bảo mật bằng Spring Security ở các tầng khác nhau trong ứng dụng của bạn.

- Các phong cách cấu hình khác nhau và những thực hành tốt nhất để áp dụng chúng vào dự án của bạn.

- Sử dụng Spring Security cho các ứng dụng phản ứng (reactive applications).

- Kiểm thử các triển khai bảo mật của bạn.

Nhằm giúp quá trình học tập diễn ra suôn sẻ đối với từng khái niệm được mô tả, chúng ta sẽ cùng nhau thực hành trên nhiều ví dụ đơn giản.

Khi hoàn thành cuốn sách, bạn sẽ biết cách áp dụng Spring Security cho các tình huống thực tế phổ biến nhất, đồng thời hiểu rõ nên sử dụng nó ở đâu cùng với các thực hành tốt nhất. Tôi cũng đặc biệt khuyên bạn nên tự tay thực hành trên tất cả các ví dụ đi kèm phần giải thích.

## Tóm tắt

- Spring Security là lựa chọn hàng đầu để bảo mật các ứng dụng Spring. Nó cung cấp số lượng lớn các giải pháp thay thế phù hợp với các phong cách và kiến trúc khác nhau.

- Bạn nên áp dụng bảo mật theo nhiều lớp cho hệ thống của mình, và đối với mỗi lớp, bạn cần sử dụng các phương pháp thực hành khác nhau.

- Bảo mật là một khía cạnh mang tính liên đới (cross-cutting concern) mà bạn cần phải cân nhắc ngay từ khi bắt đầu một dự án phần mềm.

- Thông thường, chi phí thiệt hại của một cuộc tấn công sẽ cao hơn nhiều so với chi phí đầu tư để phòng tránh các lỗ hổng ngay từ đầu.

- Đôi khi, những sai lầm nhỏ nhất cũng có thể gây ra những tổn hại nghiêm trọng. Ví dụ, việc vô tình làm lộ dữ liệu nhạy cảm qua nhật ký hoạt động (log) hoặc các thông báo lỗi là một con đường phổ biến dẫn đến việc xuất hiện các lỗ hổng bảo mật trong ứng dụng của bạn.
