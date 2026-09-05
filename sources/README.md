# `sources/` — nguồn học của DevPrep

Mọi tài liệu học (markdown + ảnh) nằm ở đây. Web app không đọc trực tiếp thư mục này: script
[`webapp/scripts/build-content.sh`](../webapp/scripts/build-content.sh) sao chép **nguyên cây**
`sources/` (trừ `*.pdf`) vào `webapp/content/` lúc chạy local, build Docker và deploy GitHub Pages.
Vì thế `webapp/content/` luôn là ảnh gương của thư mục này và không được commit.

## Quy ước

| Quy tắc | Ví dụ |
|---|---|
| **Một thư mục cấp một = một lĩnh vực**, tên đúng bằng `id` trong [`webapp/js/data/fields.js`](../webapp/js/data/fields.js) | `sources/ddia/` ↔ `FIELDS.ddia` |
| Lĩnh vực có **nhiều nguồn** thì mỗi nguồn một thư mục con (kebab-case, tên sách tiếng Anh) | `sources/kubernetes/kubernetes-up-and-running/` |
| Lĩnh vực **một nguồn** đặt markdown thẳng trong thư mục lĩnh vực, không tạo cấp trung gian | `sources/kafka/02-cai-dat-kafka.md` |
| Tệp markdown đánh số thứ tự đọc: `NN-slug.md`; phụ lục dùng chữ (`A-…md`) | `05-pods.md`, `A-building-your-own-kubernetes-cluster.md` |
| Ảnh trong `images/` cạnh markdown, tham chiếu **tương đối theo tệp** (`images/x.png` hoặc `images/chNN/x.png`) | ảnh được resolve theo thư mục chứa tệp, cùng quy tắc ở app và ở `check-data.mjs` #2b |
| PDF gốc (nếu giữ) nằm trong `pdf/` cùng cấp, **không** bao giờ vào `content/` | `sources/ddia/pdf/…` |
| Mỗi nguồn dịch từ sách có `README.md` ghi tác giả, ấn bản, giấy phép/bản quyền | `sources/sysprog/README.md` |

## Bản đồ hiện tại

| Lĩnh vực (`fields.js`) | Thư mục | Nội dung |
|---|---|---|
| `kubernetes` | `kubernetes/certs/` | 7 tài liệu tự biên: Prerequisites, Study Guide + Cheat Sheet cho CKAD / CKA / CKS |
| | `kubernetes/kubernetes-in-action/` | Bản dịch *Kubernetes in Action* 2e (Lukša, Manning) — 17 chương, 184 ảnh |
| | `kubernetes/cka-study-guide/` | Bản dịch *CKA Study Guide* 2e (Muschko, O'Reilly) — 22 chương + phụ lục, 50 ảnh, PDF |
| | `kubernetes/kubernetes-up-and-running/` | Bản dịch *Kubernetes: Up and Running* 3e (Burns, Beda, Hightower, Evenson — O'Reilly) — 22 chương + phụ lục, 18 ảnh, PDF |
| `sysprog` | `sysprog/` | Bản dịch *System Programming Coursebook* (UIUC CS 241, CC BY 4.0) — 18 chương |
| `java` | `java/` | Series 10 bài Java & Spring Boot Scalability (tự biên) + 21 hình |
| `modern-java` | `modern-java/` | Bản dịch *Modern Java in Action* (Urma, Fusco, Mycroft — Manning) — 21 chương, 100 ảnh, PDF |
| `ddia` | `ddia/` | Bản dịch *Designing Data-Intensive Applications* 2e (Kleppmann, O'Reilly) — 14 chương, 105 ảnh, PDF |
| `kafka` | `kafka/` | Bản dịch *Kafka: The Definitive Guide* 2e (O'Reilly) — chương 2–14, 47 ảnh, PDF |
| `modern-concurrency` | `modern-concurrency/` | Bản dịch *Modern Concurrency in Java* (O'Reilly) — 8 chương, 19 ảnh, PDF |
| `spring-start` | `spring-start/` | Bản dịch *Spring Start Here* (Spilcă, Manning 2021) — 15 chương + hướng dẫn học, 179 ảnh, PDF |
| `spring-security` | `spring-security/` | Bản dịch *Spring Security in Action* 2e (Spilcă, Manning 2024) — 21 tệp |
| `senior-java` | `senior-java/` | Lộ trình Senior Java 24 tháng — 5 tài liệu |

Các bản dịch sách thương mại **không** phải giấy phép mở; chỉ *System Programming Coursebook* là CC BY 4.0.

## Thêm một nguồn học mới

1. Tạo `sources/<fieldId>/` (hoặc `sources/<fieldId>/<ten-sach>/` nếu lĩnh vực đã có nguồn khác),
   đặt markdown theo `NN-slug.md`, ảnh vào `images/`, PDF (nếu có) vào `pdf/`.
2. Khai lĩnh vực trong `webapp/js/data/fields.js` (nếu mới) và danh mục tài liệu trong
   `webapp/js/data/<fieldId>/docs.js` với `file: "content/<fieldId>/…"`.
3. Chạy kiểm:

   ```bash
   webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
   ```

   `build-content.sh` **không cần sửa** — nó sao chép cả cây.
4. Nguồn thô chưa xử lý (bản dịch chưa chuẩn hoá, PDF chưa tách chương) để ở [`../inbox/`](../inbox/),
   không để trong `sources/`.
