# `inbox/` — nguồn thô chưa tích hợp

Thư mục chờ cho tài liệu **chưa** vào web app: bản dịch chưa chuẩn hoá tên tệp, PDF chưa tách,
nội dung cần đối chiếu với nguồn đã có. Không có gì ở đây được `build-content.sh` sao chép.

| Thư mục | Là gì | Việc còn lại |
|---|---|---|
| `kubernetes-in-action-2e/` | Bản dịch **thứ hai** của *Kubernetes in Action* 2e: 18 chương (`chuong_1…18_*.md`), 18 PDF, 204 ảnh (`images/chuong-NN/`). Khác bản đang dùng ở `sources/kubernetes/kubernetes-in-action/` (17 chương, 184 ảnh). | Cần spec riêng: so từng chương, quyết định thay thế hay giữ song song, đổi tên tệp theo quy ước `NN-slug.md`, rồi cập nhật `docs.js` và lộ trình `roadmap-kia-*`. |

Khi một mục được tích hợp xong, chuyển nó sang `sources/` và xoá dòng tương ứng ở đây.
