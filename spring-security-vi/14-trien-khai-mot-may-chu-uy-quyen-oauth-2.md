# Chương 14: Triển khai một máy chủ ủy quyền OAuth 2

> ⚠️ **Ghi chú về nguồn:** File PDF gốc chỉ chứa phần mở đầu của Chương 14. Toàn bộ nội dung các mục 14.1–14.5 (Triển khai xác thực cơ bản sử dụng JSON Web Token; Vận hành loại cấp quyền mã ủy quyền; Vận hành loại cấp quyền thông tin xác thực của client; Sử dụng opaque token và kỹ thuật nội soi; Thu hồi token) **không có trong bản PDF** và do đó không thể chuyển đổi.

**Chương này bao gồm**

- Triển khai máy chủ ủy quyền OAuth 2 với Spring Security

- Sử dụng các phương thức cấp quyền "authorization code" (mã ủy quyền) và "client credentials" (thông tin xác thực ứng dụng khách)

- Cấu hình access token dạng đục (opaque) và dạng rõ (non-opaque)

- Sử dụng tính năng thu hồi và thẩm định (introspection) token

Chương 13 đã giới thiệu về OAuth 2 và OpenID Connect. Chúng ta đã thảo luận về các thực thể đóng vai trò quyết định trong một hệ thống mà cơ chế xác thực và cấp quyền dựa trên đặc tả OAuth 2. Máy chủ ủy quyền (authorization server) chính là một trong những thực thể này. Vai trò của nó là xác thực người dùng cũng như ứng dụng mà họ sử dụng (ứng dụng khách - client), đồng thời phát hành các token làm bằng chứng xác thực để truy cập vào các tài nguyên được bảo vệ bởi hệ thống backend. Trong một số trường hợp, ứng dụng khách sẽ thực hiện việc này thay mặt cho người dùng.

Hệ sinh thái Spring cung cấp một phương thức tùy biến hoàn toàn để triển khai máy chủ ủy quyền OAuth 2/OpenID Connect. Thư viện Spring Security Authorization Server hiện là giải pháp chuẩn mực để xây dựng máy chủ ủy quyền bằng Spring. Trong chương này, chúng ta sẽ xem xét các tính năng chính của khung làm việc (framework) này và tiến hành triển khai một máy chủ ủy quyền tùy chỉnh. Hình 14.1 dưới đây sẽ giúp bạn ôn lại các thực thể trong mô hình OAuth 2 cũng như vai trò của máy chủ ủy quyền đã được thảo luận ở Chương 13.
