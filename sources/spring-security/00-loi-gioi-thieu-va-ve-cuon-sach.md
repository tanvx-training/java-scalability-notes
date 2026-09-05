# Lời giới thiệu, Lời nói đầu, Lời cảm ơn, Về cuốn sách này, Về tác giả

## Spring Security Thực chiến, Ấn bản thứ hai

Laurentiu Spilca

Lời tựa của Joe Grandja

## Những lời khen ngợi dành cho ấn bản đầu tiên

> "Một trong những tài liệu tuyệt vời nhất mà bạn có thể tìm thấy về Spring Security 6 — thực tiễn và dễ hiểu, bao quát mọi khía cạnh mà bạn có khả năng sẽ áp dụng trong môi trường thực tế." —**Amarjit Bhandal**, Lập trình viên Java cấp cao
>
> "Một trong những cuốn sách kỹ thuật hay nhất tôi từng đọc trong năm qua. Tôi thực sự ngạc nhiên trước cách cuốn sách truyền tải về Spring Security Framework một cách hiệu quả đến vậy!" —**Simone Sguazza**, Trợ lý nghiên cứu, Đại học Khoa học Ứng dụng và Nghệ thuật Nam Thụy Sĩ
>
> "Mang lại một cái nhìn toàn cảnh xuất sắc về Spring Security Framework!" —**Sachin Handiekar**, Kỹ sư phần mềm trưởng tại JPMC
>
> "Vượt trội về cả chiều sâu lẫn sự rõ ràng, đây thực sự là cuốn cẩm nang chuẩn mực nhất — một chỉ dẫn không thể thiếu để làm chủ những khía cạnh phức tạp của Spring Security." —**Najeeb Arif**, Cố vấn cấp cao tại Thoughtworks
>
> "Một cuốn sách phải có nếu bạn cần cấu hình Spring Security. Mà hầu như mọi ứng dụng Spring đều cần đến Spring Security." —**Luigi Rubino**, Kiến trúc sư phần mềm tại Unimatica S.p.A.

## Spring Security Thực chiến, Ấn bản thứ hai

LAURENȚIU SPILCĂ

MANNING

Shelter Island

Để biết thêm thông tin trực tuyến và đặt mua cuốn sách này cũng như các ấn phẩm khác của Manning, vui lòng truy cập www.manning.com. Nhà xuất bản có chính sách chiết khấu cho cuốn sách này khi đặt mua với số lượng lớn.

Để biết thêm chi tiết, vui lòng liên hệ:

- Bộ phận Bán hàng Đặc biệt

- Manning Publications Co.

- 20 Baldwin Road

- PO Box 761

- Shelter Island, NY 11964

- Email: orders@manning.com

© 2024 Manning Publications Co. Bảo lưu mọi quyền.

Không phần nào của ấn phẩm này được phép sao chép, lưu trữ trong hệ thống truy xuất thông tin, hoặc truyền tải dưới bất kỳ hình thức nào hay bằng bất kỳ phương tiện nào, dù là điện tử, cơ học, sao chụp, ghi âm hoặc cách khác, nếu không có sự cho phép trước bằng văn bản của nhà xuất bản.

Nhiều tên gọi được các nhà sản xuất và người bán sử dụng để phân biệt sản phẩm của họ được đăng ký là nhãn hiệu thương mại. Khi những tên gọi đó xuất hiện trong cuốn sách này và Manning Publications đã nhận thức được quyền nhãn hiệu thương mại, các tên gọi đó sẽ được in hoa chữ cái đầu hoặc in hoa toàn bộ. Nhận thức được tầm quan trọng của việc lưu trữ những giá trị đã được viết ra, Manning chủ trương in các cuốn sách của mình trên giấy không chứa axit, và chúng tôi nỗ lực hết mình để đạt được mục tiêu đó. Đồng thời, nhận thức rõ trách nhiệm bảo tồn tài nguyên hành tinh, sách của Manning được in trên giấy chứa ít nhất 15% thành phần tái chế và được xử lý không sử dụng clo nguyên tố.

Tác giả và nhà xuất bản đã nỗ lực hết mình để đảm bảo thông tin trong cuốn sách này là chính xác tại thời điểm đem in. Tuy nhiên, tác giả và nhà xuất bản không chịu trách nhiệm và từ chối mọi nghĩa vụ pháp lý đối với bất kỳ bên nào về những tổn thất, thiệt hại hoặc gián đoạn do sai sót hoặc thiếu sót gây ra, cho dù những sai sót hoặc thiếu sót đó xuất phát từ sự sơ suất, tai nạn, hay bất kỳ nguyên nhân nào khác, hoặc từ việc sử dụng các thông tin trong cuốn sách này.

- Biên tập viên phát triển: Marina Michaels

- Biên tập viên kỹ thuật: Jean-François Morin

- Biên tập viên bình duyệt: Dunja Nikitović

- Biên tập viên sản xuất: Andy Marinkovich

- Biên tập viên hiệu đính: Lana Todorovic-Arndt

- Người soát lỗi bản in: Melody Dolab

- Người soát lỗi kỹ thuật: Jean-François Morin

- Người dàn trang: Tamara Švelić Sabljić

- Thiết kế bìa: Marija Tudor

ISBN 9781633437975

In tại Hoa Kỳ

---

## Lời giới thiệu

Tôi biết đến Laurențiu Spilcă lần đầu vào năm 2022, khi chúng tôi cộng tác trực tuyến trong một bài thuyết trình tại SpringOne, và tôi đã vô cùng vui mừng khi cuối cùng được gặp trực tiếp anh ấy tại hội thảo Devoxx 2023 ở Bỉ. Tôi rất hào hứng khi anh ấy ngỏ ý mời tôi viết lời giới thiệu cho cuốn sách này. Hãy để tôi bắt đầu bằng một đoạn trích từ chính tác phẩm:

> “Việc áp dụng một framework sai cách sẽ khiến ứng dụng trở nên khó bảo trì hơn. Tệ hơn nữa, đôi khi những người thất bại trong việc sử dụng framework lại tin rằng đó là lỗi của chính framework đó.”

Đây là một thông điệp vô cùng quan trọng! Trong nhiều năm qua, tôi đã nhận được phản hồi từ cộng đồng trong nhiều dịp rằng Spring Security rất khó hiểu và có lộ trình học tập khá dốc. Dù thực tế có đúng như vậy hay không, nếu bạn đi sâu vào bên trong framework và thực sự có được hiểu biết sâu sắc về kiến trúc xác thực, bạn sẽ học được cách tận dụng tối đa các khả năng của framework này, và cuối cùng, nó sẽ trở nên dễ sử dụng hơn. Đây chính là điểm mà cuốn sách đã giải quyết một cách triệt để khi đi sâu vào kiến trúc xác thực của Spring Security, cung cấp các sơ đồ rõ ràng đi kèm với những lời giải thích chi tiết về từng thành phần chính phối hợp trong luồng xử lý xác thực.

Xuyên suốt cuốn sách, Laurențiu đã sử dụng một cách khéo léo các phép ẩn dụ để đơn giản hóa chủ đề đang được thảo luận. Tôi đặc biệt thích phép ẩn dụ được sử dụng trong phần kiến trúc xác thực, khi anh ấy tóm gọn nó một cách rất tinh tế:

> “Nếu nắm vững kiến trúc này, bạn sẽ giống như một người đầu bếp hiểu rõ từng nguyên liệu của mình và có thể tự tin chế biến bất kỳ món ăn nào.”

Sơ đồ phối hợp được sử dụng để minh họa cách thức hoạt động của quá trình xác thực là một điểm sáng xuất sắc. Nó cung cấp một cái nhìn tổng quan ở cấp độ cao về luồng xử lý, đồng thời chi tiết hóa trách nhiệm cốt lõi của từng thành phần chính khi nội dung cuốn sách dần mở ra.

Nội dung cuốn sách có một mạch chảy rất tự nhiên, bắt đầu từ những ví dụ cực kỳ đơn giản và nâng dần lên các ví dụ nâng cao hơn mà không khiến người đọc bị quá tải.

Sau khi hoàn thành việc mổ xẻ chi tiết kiến trúc xác thực, chủ đề tiếp theo chính là phân quyền. Điều này làm tôi nhớ đến một câu hỏi cụ thể mà tôi thường xuyên bắt gặp trong cộng đồng: “Sự khác biệt giữa quyền hạn (authority), vai trò (role) và quyền hạn chi tiết (permission) là gì?” Cuốn sách này đã trả lời câu hỏi đó một cách gãy gọn bằng cách đưa ra các ví dụ thực tế rất đơn giản về một authority, một role và một permission, cũng như cách chúng liên kết với người dùng. Sau đó, tác giả tiếp tục dẫn dắt qua các hướng dẫn chung về cách mô hình hóa các quyền hạn trong ứng dụng của bạn dựa trên các chức năng sẵn có và các loại người dùng của hệ thống. Tiếp theo, cuốn sách sử dụng các nguyên tắc chung này để trình bày cách định nghĩa các quy tắc phân quyền trong cấu hình Spring Security nhằm kiểm soát và giới hạn truy cập.

Phần 4 đề cập đến các chủ đề về OAuth 2 và OpenID Connect 1.0. Tôi nghĩ có thể khẳng định rằng tập hợp các đặc tả kỹ thuật của OAuth 2 và OpenID Connect 1.0 là khá đồ sộ và phức tạp, khiến bất kỳ ai mới bắt đầu cũng rất khó nắm bắt được mục đích và khả năng của chúng. Tuy nhiên, cuốn sách này đã cung cấp một cái nhìn tổng quan ở cấp độ vĩ mô vô cùng xuất sắc về các khái niệm cốt lõi (như vai trò, các loại cấp quyền, định dạng access token, v.v.) được định nghĩa trong các tài liệu đặc tả, đồng thời chỉ ra sự liên kết tương quan giữa cách chúng được triển khai trong Spring Security và Spring Authorization Server. Tôi rất thích phép ẩn dụ trong sách khi so sánh đặc tả OAuth 2 với việc đi vào một tòa nhà văn phòng, nơi bạn cần một chiếc thẻ từ (với quyền truy cập hạn chế) để vào được phòng họp trong tòa nhà. Tác giả dẫn dắt qua tình huống thực tế này và đối chiếu với các phần khác nhau của hệ thống OAuth 2 cùng vai trò mà mỗi phần đảm nhận. Sau đó, cuốn sách xây dựng một ví dụ đơn giản sử dụng Spring Authorization Server cùng với sự hỗ trợ dành cho Client và Resource Server của Spring Security. Các ví dụ bắt đầu từ mức tối giản nhất rồi minh họa cách cấu hình các client để thực hiện các luồng cấp quyền khác nhau, chẳng hạn như mã ủy quyền (với PKCE), thông tin xác thực của client (client credentials), và refresh token. Tiếp đó, cuốn sách trình bày các kịch bản cấu hình phổ biến, ví dụ như cấu hình opaque token, sử dụng kỹ thuật nội soi token (token introspection) và thu hồi token (token revocation). Cuối cùng, cuốn sách tiến thêm một bước xa hơn để trình bày các kịch bản nâng cao liên quan đến cấu hình đa bên thuê (multi-tenancy) cho các máy chủ tài nguyên.

Tóm lại, đây là một cuốn sách không thể bỏ qua đối với bất kỳ ai muốn đi sâu vào kiến trúc xác thực cũng như các cơ chế hoạt động bên trong của Spring Security, bởi nó sẽ giúp bạn làm chủ và khai thác tối đa sức mạnh của framework này.

—Joe Grandja, Kỹ sư Spring Security, VMware thuộc Broadcom

## Lời nói đầu

Hành trình phát triển phần mềm giống như một vũ điệu đầy mê hoặc của việc xây dựng, học hỏi, giảng dạy, và cả việc rũ bỏ những tư duy cũ kỹ. Kể từ khi bắt đầu con đường này vào năm 2007, tôi đã dần mở rộng vai trò của mình một cách tự nhiên từ một lập trình viên thuần túy thành một lập trình viên kiêm nhà đào tạo. Dù cả hai vai trò đều có sức hấp dẫn riêng, nhưng chính nghệ thuật truyền đạt kiến thức, nuôi dưỡng trí tò mò và chứng kiến những khoảnh khắc vỡ lẽ của người học mới thực sự thắp lên ngọn lửa đam mê trong tôi. Tuy nhiên, hãy nhìn nhận thực tế rằng việc lập trình và việc giảng dạy luôn gắn kết chặt chẽ với nhau. Để có thể trở thành người cầm đuốc dẫn đường cho người khác, trước hết bản thân chúng ta phải đứng thật vững trên mảnh đất công nghệ không ngừng dịch chuyển của các ứng dụng phần mềm.

Trải qua nhiều năm, có một chân lý ngày càng định hình rõ nét: trong khi các tính năng chức năng là trái tim của phần mềm, thì các đặc tính phi chức năng như bảo mật, hiệu năng và khả năng bảo trì mới chính là huyết mạch của nó. Việc định vị một lỗi nhỏ trong một hàm chức năng bao giờ cũng dễ dàng hơn nhiều so với việc bơi qua vùng nước đục của các lỗ hổng bảo mật hay các điểm nghẽn hiệu năng. Không có gì ngạc nhiên khi nhiều lập trình viên, dù đã có kinh nghiệm hay chưa, thường tỏ ra ngần ngại khi đối mặt với những vấn đề phi chức năng phức tạp này.

Trong số đó, bảo mật không chỉ là yếu tố tối quan trọng, mà còn là bắt buộc. Và trong thế giới rộng lớn của các framework bảo mật, Spring Security nổi lên như một cái tên hàng đầu, nhờ vào sự phổ biến và mức độ tin cậy cực kỳ cao của hệ sinh thái Spring trong mảng ứng dụng doanh nghiệp. Thế nhưng, vẫn tồn tại một thách thức rõ rệt — lộ trình học tập của Spring Security cực kỳ dốc. Vô vàn tài liệu rải rác trên mạng thường giống như những mảnh ghép lộn xộn không thể khớp lại một cách nhất quán, dễ làm nản lòng và khiến ngay cả những người kiên trì nhất cũng phải lạc lối.

Chính những thách thức đó, kết hợp với vô số lần tư vấn thực tế khi tôi phải chứng kiến các hệ thống triển khai Spring Security sai cách, hoặc tệ hơn nữa là đầy rẫy lỗ hổng, đã gieo những hạt mầm đầu tiên cho ấn bản thứ nhất của cuốn sách này. Tầm nhìn của tôi rất rõ ràng: mang lại một ngôi sao dẫn đường cho bất kỳ ai, dù là người mới bắt đầu hay một tín đồ lâu năm của Spring, để có thể làm chủ Spring Security.

Với ấn bản thứ hai này, chúng ta sẽ đi sâu hơn vào Spring Security, nhìn lại những cải tiến, thay đổi và những trải nghiệm thực tế kể từ ấn bản đầu tiên. Chúng tôi cải thiện những gì đã có, rút kinh nghiệm từ những gì chưa hoàn thiện, và đưa vào những kiến thức hiện đã trở thành thiết yếu. Tôi chân thành hy vọng rằng ấn bản thứ hai của cuốn sách Spring Security Thực chiến này không chỉ đơn thuần là một cuốn sách, mà sẽ trở thành một người bạn đồng hành đáng tin cậy trên hành trình xây dựng những ứng dụng bảo mật và mạnh mẽ của bạn. Tôi mong muốn cuốn sách này sẽ là ngọn hải đăng giúp bạn tiết kiệm thời gian, đồng thời xây dựng sản phẩm một cách tự tin, luôn an tâm rằng ứng dụng của mình có đủ sức chống chịu trước những mối đe dọa không ngừng biến đổi trong thế giới số.

## Lời cảm ơn

Việc hoàn thành cuốn sách này là một hành trình mà tôi không thể tự mình thực hiện nếu thiếu đi trí tuệ tập thể, sự hỗ trợ và chuyên môn của rất nhiều cá nhân xuất sắc.

Trước hết, tôi xin gửi lời cảm ơn chân thành sâu sắc nhất tới Daniela, người vợ và cũng là ánh sáng dẫn đường của tôi. Sự thấu hiểu, những lời động viên liên tục và niềm tin kiên định của cô ấy là nhân tố vô cùng quan trọng trong suốt dự án này.

Toàn thể đội ngũ tại Manning xứng đáng nhận được một lời cảm ơn đặc biệt. Sự cam kết và cống hiến không ngừng nghỉ của họ đã biến bản thảo này thành một nguồn tài liệu vô giá như ngày hôm nay. Trong số đó, tôi muốn bày tỏ lòng biết ơn sâu sắc đến Marina Michaels và Jean-François Morin. Sự chuyên nghiệp, sự hỗ trợ và những lời khuyên vô giá của họ đã làm phong phú thêm rất nhiều cho cuốn sách.

Tôi cũng muốn gửi lời cảm ơn nồng nhiệt đến người bạn của tôi, Ioana Göz, người nghệ sĩ tài hoa đứng sau các bức tranh minh họa. Tài năng của cô trong việc chuyển tải những ý nghĩ trừu tượng của tôi thành các hình ảnh trực quan sinh động đã mang lại một nét duyên dáng độc đáo cho từng trang sách, mang đến cho người đọc những nụ cười thư giãn xen lẫn những nội dung kỹ thuật khô khan.

Cuốn sách này đã được hưởng lợi rất nhiều từ sự soi xét tỉ mỉ và phản hồi của đông đảo độc giả bình duyệt. Những quan sát tinh tế và những đóng góp mang tính xây dựng của họ là chìa khóa để hoàn thiện nội dung sách. Tôi xin đặc biệt gửi lời cảm ơn đến những người bình duyệt tận tâm từ Manning: Amarjit Bhandal, Asif Iqbal, Cosimo Damiano Prete, Geoff Williams, Javid Asgarov, Justin Reiser, Luigi Rubino, Manoj Kumar, Marcus Geselle, Michele Adduci, Mikael Byström, Mikhail Malev, Najeeb Arif, Patrick Wanjau, Richard Meinsen, Sachin Handiekar, Simeon Leyzerzon, và Simone Sguazza, cùng với những người bạn thân thiết trong vòng kết nối đã đóng góp chuyên môn của họ.

Cuối cùng, gửi đến các đồng nghiệp và bạn bè tại Endava: sự động viên liên tục, những góc nhìn sâu sắc và niềm tin kiên định của các bạn đối với những nỗ lực của tôi chính là nguồn lực thầm lặng thúc đẩy tôi tiến về phía trước. Tôi vô cùng trân trọng và đánh giá cao sự hỗ trợ của các bạn.

Gửi tới tất cả những ai đã góp sức vào dự án này, dù ít hay nhiều, xin hãy biết rằng những đóng góp của các bạn chính là những sợi chỉ dệt nên bức tranh hoàn chỉnh của cuốn sách này. Xin chân thành cảm ơn!

## Về cuốn sách này

Bảo mật là yếu tố tối quan trọng trong phát triển phần mềm, và việc tích hợp bảo mật ngay từ những bước đầu tiên là điều tối cần thiết. Cuốn sách Spring Security Thực chiến, Ấn bản thứ hai đi sâu vào việc sử dụng Spring Security để đưa các cơ chế bảo mật cấp ứng dụng vào các dự án của bạn. Làm chủ Spring Security và áp dụng nó một cách chính xác là kỹ năng không thể thiếu đối với mọi nhà phát triển. Việc dấn thân vào xây dựng một ứng dụng mà thiếu đi nền tảng kiến thức này là một rủi ro quá lớn không đáng có.

### Ai nên đọc cuốn sách này?

Cuốn sách này hướng tới các nhà phát triển đang sử dụng Spring Framework cho các ứng dụng doanh nghiệp. Mặc dù tôi viết cuốn sách này hướng đến cả những người mới làm quen với Spring Security, nhưng bạn vẫn cần có những hiểu biết nền tảng về Spring Framework, bao gồm:

- Cách sử dụng Spring context

- Cách xây dựng các REST endpoint

- Cách làm việc với các nguồn dữ liệu (datasource)

Chương 15 đi sâu vào cấu hình bảo mật cho các ứng dụng phản ứng (reactive applications). Do đó, việc hiểu rõ về ứng dụng phản ứng và cách phát triển chúng bằng Spring là điều vô cùng thiết yếu. Trong suốt cuốn sách này, tôi sẽ gợi ý thêm các tài liệu bổ trợ để giúp bạn củng cố hoặc làm quen với những chủ đề cần thiết. Toàn bộ ví dụ trong sách đều sử dụng Java. Vì Java được áp dụng rộng rãi trong hệ sinh thái Spring, chúng tôi giả định rằng bạn đọc đã có kiến thức thực hành cơ bản về ngôn ngữ này. Tuy nhiên, dù một số chuyên gia có thể sử dụng các ngôn ngữ khác như Kotlin, các nguyên lý nền tảng vẫn hoàn toàn tương đồng. Bạn cũng có thể dễ dàng chuyển đổi các ví dụ này sang Kotlin nếu muốn.

Nếu cảm thấy cần ôn lại các kiến thức tiên quyết trước khi bắt đầu, tôi trân trọng giới thiệu cuốn Spring Start Here (Manning, 2021), một tác phẩm khác do tôi chấp bút.

### Cấu trúc cuốn sách: Lộ trình học tập

Tôi biên soạn cuốn sách này nhằm dẫn dắt bạn qua thế giới rộng lớn của Spring Security, từ những khái niệm cơ bản nhất cho đến các chủ đề nâng cao. Mỗi phần của cuốn sách đều liên kết chặt chẽ và tiếp nối nhau một cách tự nhiên, giúp hành trình học tập của bạn luôn mạch lạc và sâu sắc. Dưới đây là lộ trình khái quát:

- Phần 1: Làm quen với Spring Security

  Trong phần này, tôi sẽ giới thiệu cho bạn bức tranh toàn cảnh về bảo mật hiện đại và Spring Security. Chúng ta sẽ cùng đặt nền móng bằng cách thảo luận về vai trò then chốt của bảo mật trong kỷ nguyên số ngày nay, cũng như cách Spring Security giải quyết những thách thức đó.

- Phần 2: Cấu hình xác thực

  Đi sâu vào cốt lõi của quá trình xác thực. Tôi sẽ trình bày các chủ đề thiết yếu như quản lý người dùng, các giao thức mật khẩu, vai trò quan trọng của bộ lọc (filter) trong bảo mật ứng dụng web, và cách triển khai xác thực.

- Phần 3: Cấu hình phân quyền

  Chúng ta sẽ chuyển từ xác thực sang phân quyền. Chúng ta sẽ cùng nhau khám phá quy trình phân quyền ở cấp độ endpoint, các biện pháp bảo vệ chống lại các mối đe dọa như CSRF, cách quản lý CORS, đồng thời đi sâu vào các bộ lọc và phân quyền phức tạp ở cấp độ phương thức.

- Phần 4: Triển khai OAuth 2 và OpenID Connect

  Trong phần này, tôi sẽ dẫn dắt bạn bước vào thế giới của OAuth 2 và OpenID Connect. Bạn sẽ hiểu được tầm quan trọng của chúng và tiến hành thiết lập các máy chủ OAuth 2, máy chủ tài nguyên, và phía máy khách, từ đó củng cố vững chắc tính bảo mật cho ứng dụng của mình.

- Phần 5: Chuyển sang mô hình phản ứng

  Tại đây, tôi sẽ giới thiệu cho bạn mô hình lập trình phản ứng (reactive programming), hướng dẫn chi tiết cách bảo mật các ứng dụng phản ứng để đảm bảo các hoạt động bất đồng bộ của bạn luôn an toàn trước mọi hành vi can thiệp trái phép.

- Phần 6: Kiểm thử cấu hình bảo mật

  Tôi đặc biệt nhấn mạnh tầm quan trọng của việc kiểm thử trước khi triển khai thực tế. Chúng ta sẽ đi sâu vào các kỹ thuật kiểm thử để đảm bảo cấu hình bảo mật hoạt động chính xác như mong đợi.

- Phụ lục

  Các phụ lục bao gồm các tài liệu tham khảo chính thức và tài liệu đọc thêm nhằm bổ trợ cho quá trình học tập và khám phá của bạn.

Dù được biên soạn theo lộ trình từng bước một, những ai đã có kinh nghiệm với Spring Security hoàn toàn có thể nhảy thẳng đến các phần mình quan tâm. Tuy nhiên, hãy lưu ý rằng các chương sau có thể tham chiếu đến các khái niệm ở phần trước. Nếu đã quen thuộc với những điều cơ bản của Spring Security, bạn có thể bắt đầu từ phần 3 hoặc phần 4 để tìm hiểu sâu về OAuth 2 và OpenID. Những ai quan tâm đến lập trình phản ứng có thể chuyển ngay sang phần 5. Dù bắt đầu từ đâu, hãy chắc chắn rằng bạn đã nắm vững từng khái niệm để có thể tiếp thu tốt các chương tiếp theo.

### Về mã nguồn

Cuốn sách này cung cấp hơn 70 dự án mẫu mà chúng ta sẽ thực hành từ chương 2 đến chương 18. Khi đi vào một ví dụ cụ thể, tôi sẽ đề cập đến tên của dự án triển khai ví dụ đó. Tôi khuyên bạn nên tự viết mã nguồn ví dụ từ con số không dựa trên các giải thích trong sách, sau đó mới đối chiếu giải pháp của mình với dự án mẫu đi kèm. Phương pháp này sẽ giúp bạn hiểu sâu sắc hơn các cấu hình bảo mật đang học.

Mỗi dự án đều được xây dựng bằng Maven, giúp bạn dễ dàng nhập (import) vào bất kỳ môi trường phát triển tích hợp (IDE) nào. Tôi đã sử dụng IntelliJ IDEA để viết các dự án này, nhưng bạn hoàn toàn có thể chạy chúng trên Eclipse, STS, NetBeans hoặc bất kỳ công cụ nào khác tùy ý. Phần phụ lục cũng sẽ giúp bạn ôn lại cách tạo một dự án Spring Boot.

Cuốn sách này chứa nhiều ví dụ mã nguồn, nằm ở cả các đoạn mã được đánh số và lồng trực tiếp trong văn bản. Trong cả hai trường hợp, mã nguồn đều được định dạng bằng phông chữ đơn cách `như thế này` để phân biệt với văn bản thông thường. Nhiều đoạn mã gốc đã được định dạng lại: chúng tôi đã thêm các dấu xuống dòng và điều chỉnh khoảng lùi đầu dòng để phù hợp với không gian trang sách. Trong một số ít trường hợp, ngay cả việc này cũng chưa đủ, các đoạn mã sẽ xuất hiện ký hiệu nối dòng (➥). Ngoài ra, các ghi chú (comment) trong mã nguồn thường được lược bỏ khi đoạn mã đó đã được giải thích chi tiết trong phần văn bản. Các chú thích mã nguồn (code annotation) đi kèm nhiều đoạn mã sẽ giúp làm nổi bật các khái niệm quan trọng.

Bạn có thể lấy các đoạn mã thực thi được từ phiên bản trực tuyến (liveBook) của cuốn sách này tại địa chỉ https://livebook.manning.com/book/spring-security-in-action-second-edition. Toàn bộ mã nguồn của các ví dụ trong sách có thể được tải xuống từ trang web của nhà xuất bản Manning tại www.manning.com.

### Diễn đàn thảo luận liveBook

Khi mua cuốn sách Spring Security in Action, Second Edition, bạn sẽ được truy cập miễn phí vào liveBook, nền tảng đọc sách trực tuyến của Manning. Bằng cách sử dụng các tính năng thảo luận độc quyền của liveBook, bạn có thể đính kèm bình luận của mình cho toàn bộ cuốn sách hoặc cho các phần, đoạn văn cụ thể. Việc tự ghi chú, đặt câu hỏi/trả lời về mặt kỹ thuật, cũng như nhận trợ giúp từ tác giả và các độc giả khác sẽ trở nên vô cùng dễ dàng. Để truy cập diễn đàn, hãy truy cập https://livebook.manning.com/book/spring-security-in-action-second-edition/discussion. Bạn cũng có thể tìm hiểu thêm về các diễn đàn của Manning và quy tắc ứng xử tại https://livebook.manning.com/discussion.

Cam kết của Manning đối với độc giả là cung cấp một không gian diễn ra các cuộc đối thoại thực sự có ý nghĩa giữa các độc giả với nhau, cũng như giữa độc giả và tác giả. Đây không phải là cam kết về mức độ tương tác tối thiểu của tác giả, bởi sự đóng góp của họ trên diễn đàn hoàn toàn mang tính tự nguyện (và không được trả phí). Chúng tôi gợi ý bạn hãy đặt cho tác giả những câu hỏi hóc búa để khơi gợi sự hứng thú của họ! Diễn đàn và kho lưu trữ các cuộc thảo luận trước đó sẽ luôn khả dụng trên trang web của nhà xuất bản chừng nào cuốn sách còn được lưu hành.

## Về tác giả

Laurențiu Spilcă là một nhà phát triển phần mềm và chuyên gia đào tạo dày dặn kinh nghiệm từ năm 2007. Hiện tại, ông đang đảm nhiệm vị trí cố vấn phát triển chính (principal development consultant) tại Endava. Ở vai trò này, ông dẫn dắt các dự án quy mô lớn được công nhận toàn cầu với các hệ thống được triển khai trên khắp thế giới. Laurențiu luôn có hai niềm đam mê song hành rõ rệt: phát triển các phần mềm chất lượng đỉnh cao và truyền đạt kiến thức cho các nhà phát triển đồng nghiệp.

Trong suốt sự nghiệp của mình, Laurențiu luôn tin tưởng sâu sắc rằng nhiệm vụ không chỉ dừng lại ở việc tạo ra phần mềm chất lượng cao, mà còn là nuôi dưỡng văn hóa chia sẻ kiến thức và học hỏi không ngừng. Niềm tin này đã thôi thúc ông thiết kế và giảng dạy nhiều khóa học xoay quanh các công nghệ Java. Trong thập kỷ qua, ông đã truyền thụ kiến thức cho hơn 3.000 học viên và tích cực tham gia giảng dạy tại Khoa Toán - Tin học thuộc Đại học Bucharest.

Bên cạnh những đóng góp trên bục giảng, Laurențiu còn là một tác giả có tiếng. Ông đã viết ba cuốn sách then chốt trong lĩnh vực Java: Spring Security in Action, Spring Start Here, và Troubleshooting Java. Các ấn phẩm này là minh chứng rõ nét cho cam kết của ông trong việc lan tỏa tri thức và giúp cộng đồng hiểu sâu sắc hơn về Java cùng các công nghệ liên quan.

Tâm huyết chia sẻ góc nhìn chuyên môn của ông còn vươn ra các nền tảng toàn cầu. Từ những con phố của New York và San Francisco cho đến các địa danh lịch sử tại Warsaw, Belgrade và Berlin, Laurențiu đã thực hiện nhiều buổi thuyết trình, hướng dẫn và hội thảo chuyên đề, để lại dấu ấn sâu đậm trong lòng khán giả quốc tế.

Trên hành trình đưa tri thức đến gần hơn với mọi người, Laurențiu còn lập một kênh YouTube cá nhân (youtube.com/@laurspilca) chuyên về Java và các công nghệ phụ trợ. Tại đây, từ những người mới bắt đầu cho đến các nhà phát triển kỳ cựu đều có thể tìm hiểu hàng loạt chủ đề đa dạng, tất cả đều được tuyển chọn và trình bày với phong cách rõ ràng, mạch lạc đặc trưng của ông.

Bên ngoài công việc chuyên môn, niềm đam mê của Laurențiu trải rộng sang các lĩnh vực du lịch, âm nhạc và thế giới lặn bình khí đầy mê hoặc. Dù là thám hiểm đại dương bao la hay giải mã những dòng code phức tạp, hành trình của Laurențiu luôn là minh chứng cho tinh thần không ngừng khám phá và tìm tòi.

Tài khoản Twitter/X: @laurspilca

### Về biên tập viên kỹ thuật

Jean-François Morin là nhà phát triển kiêm kiến trúc sư Java cấp cao tại Đại học Laval ở Quebec, Canada. Ông sở hữu bằng Cử nhân Khoa học Tự nhiên ngành Toán học, Thạc sĩ Khoa học Máy tính cùng 6 chứng chỉ Java của Sun/Oracle, bao gồm Java SE 17 Developer và JAVA EE 6 Enterprise Architect. Ông cũng là một giảng viên Java giàu kinh nghiệm và là cộng tác viên thường xuyên của nhà xuất bản Manning.

## Về bức minh họa trên bìa sách

Nhân vật trên bìa cuốn sách Spring Security in Action, Second Edition có chú thích là "Homme de Murcie" (Người đàn ông vùng Murcia), được trích từ bộ sưu tập của Jacques Grasset de Saint-Sauveur xuất bản năm 1797. Mỗi bức vẽ đều được phác thảo tỉ mỉ và tô màu bằng tay.

Vào thời kỳ đó, người ta có thể dễ dàng nhận biết một người sinh sống ở đâu, làm nghề gì hay có địa vị xã hội nào chỉ qua trang phục của họ. Manning tôn vinh sự sáng tạo và chủ động của ngành công nghiệp máy tính bằng những trang bìa sách mô phỏng sự đa dạng phong phú của văn hóa các vùng miền từ nhiều thế kỷ trước, được tái hiện sinh động qua các bức tranh từ những bộ sưu tập cổ như thế này.
