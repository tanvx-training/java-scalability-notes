# Spring Security Thực chiến, Ấn bản thứ hai (bản dịch tiếng Việt)

*Laurențiu Spilcă — Lời tựa của Joe Grandja — Manning, 2024*

Tài liệu được tách từ file `Spring Security - TanVX_silaBook_vi.pdf` thành các chương độc lập, mỗi chương một file Markdown.

> ⚠️ **Lưu ý về chất lượng nguồn:** file PDF gốc (in từ trang web) có một số khiếm khuyết không thể khôi phục: (1) toàn bộ thân Chương 14 (mục 14.1–14.5) và mục 15.1 bị thiếu; (2) một số trang (khoảng tr. 26–29, 56–57, 151, 193–194) hiển thị markdown thô với các đoạn văn bị cắt cụt ở mép trang; (3) nhiều dòng code dài bị cắt ở mép phải. Các vị trí này được đánh dấu `[…]` trong file tương ứng.

## Mục lục

- [Lời giới thiệu, Lời nói đầu, Lời cảm ơn, Về cuốn sách này, Về tác giả](00-loi-gioi-thieu-va-ve-cuon-sach.md)

### Phần 1: Chào đón Spring Security

- [Chương 1: Bảo mật ngày nay](01-bao-mat-ngay-nay.md)
- [Chương 2: Xin chào, Spring Security](02-xin-chao-spring-security.md)

### Phần 2: Cấu hình xác thực

- [Chương 3: Quản lý người dùng](03-quan-ly-nguoi-dung.md)
- [Chương 4: Quản lý mật khẩu](04-quan-ly-mat-khau.md)
- [Chương 5: Bảo mật của ứng dụng web bắt đầu từ các bộ lọc](05-bao-mat-cua-ung-dung-web-bat-dau-tu-cac-bo-loc.md)
- [Chương 6: Triển khai các phương thức xác thực](06-trien-khai-cac-phuong-thuc-xac-thuc.md)

### Phần 3: Cấu hình phân quyền

- [Chương 7: Cấu hình phân quyền cấp endpoint: Giới hạn truy cập](07-cau-hinh-phan-quyen-cap-endpoint-gioi-han-truy-cap.md)
- [Chương 8: Cấu hình phân quyền cấp endpoint: Áp dụng các giới hạn](08-cau-hinh-phan-quyen-cap-endpoint-ap-dung-cac-gioi-han.md)
- [Chương 9: Cấu hình bảo vệ chống CSRF](09-cau-hinh-bao-ve-chong-csrf.md)
- [Chương 10: Cấu hình CORS](10-cau-hinh-cors.md)
- [Chương 11: Triển khai phân quyền ở cấp độ phương thức](11-trien-khai-phan-quyen-o-cap-do-phuong-thuc.md)
- [Chương 12: Triển khai lọc ở cấp độ phương thức](12-trien-khai-loc-o-cap-do-phuong-thuc.md)

### Phần 4: Triển khai OAuth 2 và OpenID Connect

- [Chương 13: OAuth 2 và OpenID Connect là gì?](13-oauth-2-va-openid-connect-la-gi.md)
- [Chương 14: Triển khai một máy chủ ủy quyền OAuth 2](14-trien-khai-mot-may-chu-uy-quyen-oauth-2.md)
- [Chương 15: Triển khai một máy chủ tài nguyên OAuth 2](15-trien-khai-mot-may-chu-tai-nguyen-oauth-2.md)
- [Chương 16: Triển khai một client OAuth 2](16-trien-khai-mot-client-oauth-2.md)

### Phần 5: Bước vào lập trình phản ứng

- [Chương 17: Triển khai bảo mật trong các ứng dụng phản ứng](17-trien-khai-bao-mat-trong-cac-ung-dung-phan-ung.md)

### Phần 6: Kiểm thử cấu hình bảo mật

- [Chương 18: Kiểm thử cấu hình bảo mật](18-kiem-thu-cau-hinh-bao-mat.md)

### Phụ lục

- [Phụ lục A: Các liên kết đến tài liệu chính thức](phu-luc-a-lien-ket-tai-lieu-chinh-thuc.md)
- [Phụ lục B: Tài liệu đọc thêm](phu-luc-b-tai-lieu-doc-them.md)

---

## Giới thiệu các phần

### Phần 1: Chào đón Spring Security

Bạn đang chuẩn bị dấn thân vào thế giới của Spring Security? Hãy cùng nhau bắt đầu hành trình này! Trong phần mở đầu của cuốn sách, chúng ta sẽ thiết lập nền móng vững chắc cho các bước đi tiếp theo.

Chương 1 sẽ mở đầu bằng việc giới thiệu thế giới Spring Security. Tiếp đó, chúng ta sẽ đi sâu vào bản chất của bảo mật phần mềm, nhằm giải đáp các câu hỏi thiết thực như "Bảo mật phần mềm là gì?" và "Tại sao nó lại đóng vai trò tối quan trọng?". Ngoài ra, chúng tôi cũng sẽ phác thảo lộ trình học tập của cuốn sách để bạn biết trước những gì đang chờ đợi mình ở phía trước.

Chương 2 hứa hẹn sẽ là một trải nghiệm thực hành thú vị. Chúng ta sẽ bắt tay ngay vào việc khởi tạo dự án Spring đầu tiên. Nếu bạn từng thắc mắc về kiến trúc và thiết kế lớp (class design) vận hành Spring Security, chương này sẽ mang đến một cái nhìn tổng quan từ trên cao. Nhưng không chỉ dừng lại ở việc tìm hiểu các cơ chế mặc định, cuốn sách sẽ tiến xa hơn bằng cách hướng dẫn bạn quy trình ghi đè (override) các cấu hình mặc định. Nội dung này bao gồm việc đi sâu vào tùy chỉnh thông tin người dùng, tăng cường phân quyền tại các endpoint khác nhau, khám phá các phương thức cấu hình đa dạng, tự định nghĩa logic xác thực của riêng bạn, và khai thác hiệu quả nhiều lớp cấu hình khác nhau. Đến khi khép lại phần này, bạn không chỉ nắm vững nền tảng lý thuyết của Spring Security mà còn sở hữu một ứng dụng thực tế được bảo mật hoàn chỉnh. Đó là sự kết hợp hoàn hảo giữa việc hiểu rõ "tại sao" và làm chủ "như thế nào" — tất cả chỉ trong một khoảng thời gian ngắn.

### Phần 2: Cấu hình xác thực

Xác thực luôn là tấm khiên phòng ngự đầu tiên của bất kỳ ứng dụng bảo mật nào, đóng vai trò quyết định ai là người được phép tương tác với hệ thống. Trong phần thứ hai của cuốn sách này, chúng ta sẽ cùng đi sâu vào tìm hiểu trái tim của cơ chế này.

Chương 3 giúp bạn làm quen với việc quản lý người dùng của Spring Security, bao gồm các giao ước thiết yếu `UserDetails` và `GrantedAuthority`, cùng các sắc thái trong việc hướng dẫn Spring Security xử lý người dùng.

Chương 4 đi sâu vào vấn đề an toàn mật khẩu, khám phá giao ước `PasswordEncoder`, cách tự tạo bộ mã hóa của riêng bạn và sử dụng mô-đun Crypto của Spring Security để mã hóa và tạo khóa.

Chương 5 giới thiệu vai trò then chốt của các bộ lọc (filter) trong Spring Security. Bạn sẽ học cách tích hợp, sắp xếp thứ tự và áp dụng nhiều loại bộ lọc khác nhau, từ đó nâng cao mức độ bảo mật cho ứng dụng của mình.

Chương 6 sẽ kết nối tất cả lại với nhau. Tại đây, bạn sẽ khám phá bản chất của `AuthenticationProvider`, đi sâu vào logic xác thực tùy chỉnh và làm quen với các phương thức xác thực đăng nhập khác nhau, bao gồm HTTP Basic và các cách tiếp cận dựa trên biểu mẫu (form-based). Sau khi kết thúc phần này, bạn sẽ nắm vững các tầng kiến trúc phức tạp và cơ chế xác thực trong các ứng dụng Spring.

### Phần 3: Cấu hình phân quyền

Sau khi ứng dụng xác định được danh tính của bạn, một giai đoạn tối quan trọng tiếp theo sẽ diễn ra để quyết định quyền hạn của bạn: đó là phân quyền (authorization). Việc triển khai phân quyền chính xác là vô cùng sống còn, bởi chỉ một sơ suất nhỏ cũng có thể làm rò rỉ quyền riêng tư của người dùng và ảnh hưởng đến tính toàn vẹn của dữ liệu. Trong phần này của cuốn sách, tôi sẽ dẫn dắt bạn qua các tầng lớp phức tạp của quá trình phân quyền và cách phòng chống các lỗ hổng bảo mật phổ biến.

Chương 7 sẽ đi sâu vào thế giới của việc giới hạn truy cập, tập trung vào quyền hạn (authorities) và vai trò (roles) của người dùng, đồng thời chia sẻ các góc nhìn thực tế về cách áp dụng các giới hạn này trên toàn hệ thống.

Chương 8 tiếp tục hành trình bằng cách giới thiệu các phương thức nâng cao, chẳng hạn như `requestMatchers()`, để lựa chọn và thực thi các giới hạn phân quyền. Chương này cũng hướng dẫn cách sử dụng biểu thức chính quy (regular expressions) để kiểm soát quyền truy cập ở mức độ chi tiết hơn. Chương 9 giải quyết mối lo ngại cấp thiết về tấn công giả mạo yêu cầu chéo trang (CSRF). Bằng cách hiểu rõ cơ chế hoạt động của CSRF trong Spring Security, bạn sẽ biết cách áp dụng và tùy biến cơ chế bảo vệ chống CSRF một cách hiệu quả.

Chương 10 giới thiệu khái niệm chia sẻ tài nguyên nguồn chéo (CORS), làm sáng tỏ cách thức hoạt động của nó và hướng dẫn bạn áp dụng các chính sách CORS thông qua các annotation và `CorsConfigurer`. Chương 11 đưa chúng ta đến với bảo mật ở cấp độ phương thức (method security), đảm bảo từng hàm riêng lẻ trong ứng dụng của bạn đều tuân thủ nghiêm ngặt các nguyên tắc phân quyền. Nội dung này bao gồm cả các quy tắc trước/sau phân quyền (pre- and postauthorization) và các thiết lập quyền hạn nâng cao cho phương thức.

Chương 12 khép lại phần này với các kỹ thuật lọc ở cấp độ phương thức, bao gồm các khía cạnh từ tiền lọc (pre-filtering) đến hậu lọc (post-filtering), và tích hợp chúng vào các kho lưu trữ dữ liệu Spring Data (repositories).

Sau khi hoàn thành phần này, bạn sẽ tích lũy được những kiến thức chuyên môn cần thiết để thiết kế và triển khai một cách tỉ mỉ các chiến lược phân quyền toàn diện, đảm bảo ứng dụng của bạn vừa vận hành trơn tru vừa được bảo vệ vững chắc.

### Phần 4: Triển khai OAuth 2 và OpenID Connect

Trong một kỷ nguyên mà các phương thức xác thực an toàn và liền mạch đóng vai trò tối quan trọng, các giao thức như OAuth 2 và OpenID Connect đã vươn lên trở thành những tiêu chuẩn chung của toàn ngành công nghiệp. Phần này của cuốn sách sẽ bóc tách những khía cạnh phức tạp của các giao thức này, làm sáng tỏ cơ chế hoạt động, lợi ích cũng như những rủi ro tiềm ẩn mà chúng mang lại.

Chương 13 đặt nền móng bằng cách cung cấp một cái nhìn tổng quan về cả hai giao thức, mô tả chi tiết các phương thức cấp token (grant types) khác nhau, đồng thời chỉ ra các lỗ hổng tiềm ẩn trong OAuth 2. Chương 14 đi sâu vào việc thiết lập một máy chủ ủy quyền (authorization server) mạnh mẽ trong Spring Security, bao gồm việc định nghĩa thông tin chi tiết của client và quản lý các khóa mật mã (cryptographic keys).

Chương 15 hướng dẫn cách xây dựng một máy chủ tài nguyên (resource server) kiên cố, nhấn mạnh vào cơ chế thẩm định token (token introspection) và đảm bảo an toàn cho tài nguyên.

Chương 16 khép lại phần này bằng cách trình bày cách lấy token từ máy chủ ủy quyền và truy cập tài nguyên dưới sự bảo vệ của máy chủ tài nguyên.

Sau khi hoàn thành phần này, bạn sẽ thành thạo việc tích hợp OAuth 2 và OpenID Connect vào các ứng dụng của mình, giúp chúng chống lại các truy cập trái phép và mang lại trải nghiệm người dùng liền mạch. Đến cuối phần này, bạn sẽ tích lũy được chuyên môn để thiết kế và triển khai một cách tỉ mỉ các chiến lược ủy quyền toàn diện, đảm bảo ứng dụng của bạn vừa hoạt động hiệu quả vừa được bảo mật nghiêm ngặt.

### Phần 5: Bước vào lập trình phản ứng

Với xu hướng dịch chuyển của ngành công nghiệp phần mềm hướng tới các ứng dụng có tốc độ phản hồi nhanh hơn và hiệu quả hơn, lập trình phản ứng (reactive programming) đã nổi lên như một mô hình lập trình đầy hứa hẹn. Trong phần này của cuốn sách, bạn sẽ được hướng dẫn qua các khía cạnh tinh tế của việc triển khai bảo mật trong các ứng dụng phản ứng, giúp cân bằng giữa khả năng phản hồi nhanh nhạy và sự bảo vệ mạnh mẽ.

Chương 17 sẽ thảo luận về khái niệm ứng dụng phản ứng, đặt nền móng giúp bạn hiểu được bản chất đặc trưng của chúng. Chương này sẽ dẫn dắt bạn qua những khía cạnh phức tạp của việc quản lý người dùng trong môi trường phản ứng, đi sâu vào cấu hình các quy tắc phân quyền chi tiết, cả ở lớp endpoint lẫn thông qua cơ chế bảo mật phương thức. Hơn nữa, bạn sẽ hiểu rõ cách xây dựng một OAuth 2 resource server16 dạng phản ứng, kết hợp những ưu điểm vượt trội của cả thế giới lập trình phản ứng lẫn bảo mật hệ thống. Khi khép lại phần này, bạn sẽ được trang bị đầy đủ kiến thức để tích hợp bảo mật một cách mượt mà vào các ứng dụng phản ứng của mình, đảm bảo hệ thống luôn vận hành linh hoạt mà không làm ảnh hưởng đến khả năng bảo vệ người dùng.

### Phần 6: Kiểm thử cấu hình bảo mật

Trong thế giới phát triển phần mềm, kiểm thử đóng vai trò là người gác cổng chất lượng, đảm bảo rằng mỗi đoạn mã không chỉ hoạt động đúng như thiết kế mà còn tích hợp một cách mượt mà với các thành phần khác. Điều này đặc biệt quan trọng khi làm việc với các cấu hình bảo mật, chẳng hạn như những cấu hình do Spring Security cung cấp. Phần này của cuốn sách dành riêng để truyền tải các phương pháp thực hành tốt nhất cho việc kiểm thử tích hợp (integration testing) với Spring Security, đảm bảo rằng các ứng dụng của bạn tuân thủ nghiêm ngặt các nguyên tắc bảo mật mà bạn đã thiết lập.

Chương 18, chương cuối cùng của cuốn sách này, đóng vai trò là một tài liệu hướng dẫn toàn diện giúp bạn kiểm thử và xác thực các thiết lập bảo mật của mình. Tại đây, bạn sẽ khám phá thế giới của việc kiểm thử với người dùng giả lập (mock user), đi sâu vào các khía cạnh chi tiết của annotation `@WithMockUser`, và hiểu cách xác thực những người dùng được quản lý. Chương này cũng mở rộng phạm vi sang việc kiểm thử bảo mật ở cấp độ phương thức, kiểm thử quá trình xác thực, cùng những thách thức đặc thù khi kiểm thử các triển khai phản ứng (reactive). Khi khép lại phần này, bạn sẽ trang bị được những kỹ năng cần thiết để kiểm thử nghiêm ngặt các lớp bảo mật trong ứng dụng của mình, đảm bảo một môi trường triển khai kiên cố, sẵn sàng chống lại các lỗ hổng tiềm ẩn.
