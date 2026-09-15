# Spring Security in Action, ấn bản 2

Bản dịch tiếng Việt của *Spring Security in Action, Second Edition* — Laurentiu Spilca
(Manning).

> **Bản quyền.** Đây là sách thương mại có bản quyền, **không** phải giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Chương | 17 (2–18). Chương 1 và hai phụ lục không có trong bản dịch |
| Số từ | 120.452 |
| Hình | 142, trong `images/chNN/` (hai chữ số, đệm 0), trích từ PDF gốc ở 200 DPI |
| PDF gốc | 17, trong `pdf/` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Trong app | Lĩnh vực **Spring Security**, kèm lộ trình đọc 9 tuần / 30 mục và 24 câu phỏng vấn |

## Mục lục

| Chương | Tiêu đề | Tệp |
| --- | --- | --- |
| 2 | Xin chào, Spring Security | [02-hello-spring-security.md](02-hello-spring-security.md) |
| 3 | Quản lý user | [03-managing-users.md](03-managing-users.md) |
| 4 | Quản lý mật khẩu | [04-managing-passwords.md](04-managing-passwords.md) |
| 5 | Bảo mật của web app bắt đầu từ filter | [05-security-begins-with-filters.md](05-security-begins-with-filters.md) |
| 6 | Hiện thực authentication | [06-implementing-authentications.md](06-implementing-authentications.md) |
| 7 | Authorization ở mức endpoint: Hạn chế quyền truy cập | [07-endpoint-authorization-restricting-access.md](07-endpoint-authorization-restricting-access.md) |
| 8 | Authorization ở mức endpoint: Áp dụng các hạn chế | [08-endpoint-authorization-applying-restrictions.md](08-endpoint-authorization-applying-restrictions.md) |
| 9 | Cấu hình bảo vệ CSRF | [09-configuring-csrf-protection.md](09-configuring-csrf-protection.md) |
| 10 | Cấu hình CORS | [10-configuring-cors.md](10-configuring-cors.md) |
| 11 | Hiện thực authorization ở mức method | [11-method-level-authorization.md](11-method-level-authorization.md) |
| 12 | Hiện thực filtering ở mức method | [12-method-level-filtering.md](12-method-level-filtering.md) |
| 13 | OAuth 2 và OpenID Connect là gì? | [13-oauth2-and-openid-connect.md](13-oauth2-and-openid-connect.md) |
| 14 | Hiện thực một OAuth 2 authorization server | [14-oauth2-authorization-server.md](14-oauth2-authorization-server.md) |
| 15 | Hiện thực một OAuth 2 resource server | [15-oauth2-resource-server.md](15-oauth2-resource-server.md) |
| 16 | Hiện thực một OAuth 2 client | [16-oauth2-client.md](16-oauth2-client.md) |
| 17 | Hiện thực bảo mật trong ứng dụng reactive | [17-security-in-reactive-applications.md](17-security-in-reactive-applications.md) |
| 18 | Kiểm thử các cấu hình bảo mật | [18-testing-security-configurations.md](18-testing-security-configurations.md) |

## Quy ước dịch

- **Giữ nguyên thuật ngữ chuyên ngành** bằng tiếng Anh: tên class, method, annotation,
  package của Spring; các khái niệm như authentication, authorization, contract, filter,
  token, scope, grant type, claim, endpoint, encoder, hash, salt…
- **Chú giải tiếng Việt trong ngoặc** ở lần xuất hiện đầu tiên trong mỗi chương, ví dụ:
  *authentication (xác thực)*, *authorization (phân quyền)*, *contract (giao ước)*.
- **Code block giữ nguyên 100%**; chỉ dịch comment và các chú thích đánh số ①②③ đi kèm
  listing.
- **Hình ảnh** giữ đúng vị trí và caption như bản gốc.
- Sidebar và các khối NOTE được chuyển thành blockquote; bảng được chuyển thành bảng
  markdown.

## Ghi chú

Bản PDF gốc cắt cụt một số dòng code, lệnh cURL, URL và ô bảng do tràn khỏi khung hiển
thị. Những chỗ này đã được khôi phục theo ngữ cảnh và theo API Spring Security, đồng thời
được đánh dấu bằng khối **"Ghi chú của người dịch"** ngay bên dưới đoạn liên quan, để bạn
phân biệt được đâu là nội dung gốc và đâu là phần được bổ sung. Một vài lỗi đánh máy có
sẵn trong sách gốc (ví dụ `http.basic()` thay vì `http.build()` ở listing 12 chương 7,
`jwt'Decoder()` ở chương 15) cũng được ghi chú tương tự.

Bản dịch trước đây của cuốn này (21 tệp, gồm cả chương 1 và hai phụ lục) đã được thay
hoàn toàn: nguồn PDF cũ thiếu thân chương 14 và mục 15.1, và không có hình.
