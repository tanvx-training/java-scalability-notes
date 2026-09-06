# Hệ thống lại thư viện: Con đường học, Phần trong sách, một quy ước tên, liên kết chéo có chủ đích — thiết kế

Ngày: 2026-09-06
Trạng thái: đã duyệt hướng B (trong ba hướng A/B/C đề xuất), triển khai trên nhánh `claude/learning-paths-7c2e`.
Spec liền trước: [`2026-09-06-project-restructure-design.md`](2026-09-06-project-restructure-design.md).

## 1. Vấn đề — bốn nguyên nhân gốc, có số đo

| # | Nguyên nhân | Bằng chứng |
|---|---|---|
| 1 | **"Lĩnh vực" gánh ba nghĩa**: chủ đề thật (Kubernetes: 3 chứng chỉ + 3 sách), kế hoạch xuyên suốt (Senior Java), và **một cuốn sách** (7 lĩnh vực còn lại) | Bộ chọn là danh sách phẳng 10 mục. Người học Java backend đi qua 6 lĩnh vực rời nhau |
| 2 | **Cấu trúc Phần của sách bị bỏ qua** | README nguồn ghi 6 Phần cho *Modern Java in Action*, 6 Phần cho *Spring Security in Action*, 2 Phần cho *Spring Start Here*; `docs.js` chỉ có `group` cho 70 tài liệu Kubernetes, 126 tài liệu còn lại là lưới phẳng. Series Java mất 4 "Chủ đề" từ lần gom phẳng thư mục |
| 3 | **Tên tài liệu không cùng quy ước** | `Chương 2 —`, `MJIA 02 —`, `Kafka 03 —`, `Spring Start 01 —`, `KIA 02 —`, `CKA Book 01 —`, `SSIA 01 —`, `MCJ 01 —`, và `02 —` trần (Java, Sysprog). Tám cách viết cho cùng một thứ: "chương N của sách X" |
| 4 | **Liên kết chéo bị cấm ở tầng dữ liệu** | Bất biến #3b buộc `#/docs/<id>` trong lộ trình cùng lĩnh vực với track. Toàn repo còn 6 link chéo, đều ở mức `#/roadmap/<track>`. Ma trận năng lực "cố tình không liên kết chéo" |

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | **Giữ 10 lĩnh vực làm đơn vị dữ liệu và tiến độ**; thêm tầng **Con đường học** bao trên (`paths.js`) | Không đổi `field`, id, khoá localStorage, deep-link. 46 bất biến hiện có tiếp tục bảo vệ |
| 2 | Ba con đường: ☸️ **Kubernetes & Cloud**, ☕ **Java Backend**, 🗄️ **Data & Distributed**. Lập trình hệ thống là **nền tuỳ chọn** của Java Backend | Bám nội dung thật: 6 lĩnh vực Java cùng một nghề; DDIA + Kafka cùng một chủ đề; Kubernetes đã tự là chủ đề |
| 3 | **Lộ trình Senior Java là trục xuyên suốt** (spine), không xếp ngang hàng con đường | Nó đi qua cả ba con đường theo thời gian; 4 giai đoạn ánh xạ: GĐ1 → Java, GĐ2 → (DevOps, chưa có trong app), GĐ3 → Kubernetes, GĐ4 → Data |
| 4 | Thêm hai trường cho tài liệu: `chapter` (số hoặc chữ phụ lục, `null` nếu không phải chương) và `part` (tên Phần, `null` nếu sách không chia) | Đủ để hiển thị mục lục theo Phần và sinh nhãn thống nhất; `title` chỉ còn tên chương |
| 5 | **Một quy ước nhãn**, sinh bằng hàm, không viết tay: `Ch. 5 · Pod` (đơn vị theo lĩnh vực: "Ch." cho sách, "Bài" cho series Java); phụ lục: `Phụ lục A · …`; ngữ cảnh trộn nhiều sách thêm mã sách: `KIA · Ch. 5 · …` | Bỏ 8 kiểu tiền tố; mã sách (`short`) chỉ xuất hiện khi cần phân biệt (chip trong tuần giáo trình, tìm kiếm) |
| 6 | Không bịa Phần: chỉ khai khi nguồn dịch (README hoặc tệp hướng dẫn) ghi, hoặc bám cấu trúc kỳ thi / ấn bản gốc và **ghi rõ nguồn suy** trong comment | *Kubernetes in Action* bản dịch không ghi Phần → để phẳng. DDIA suy từ mục lục ấn bản gốc, ghi chú rõ |
| 7 | Bất biến #3b nới thành **theo con đường**: link `#/docs` trong lộ trình hợp lệ khi cùng lĩnh vực, **hoặc** cùng con đường, **hoặc** track thuộc trục Senior Java | Mở đúng chỗ cần mở, vẫn chặn link lạc (ví dụ Kafka trỏ sang CKS) |
| 8 | Liên kết chéo giữa tài liệu khai **một chiều** trong `related.js`, code phản chiếu hai chiều | Viết một lần, không lệch hai bên; bất biến R1 kiểm id |
| 9 | Ba chặng, mỗi chặng một commit, `check-data.mjs` xanh | Như lần trước |

## 3. Mô hình dữ liệu

### 3.1 `js/data/paths.js`

```js
export const PATHS = {
  kubernetes: { label: "Kubernetes & Cloud", icon: "☸️", desc: "…",
                fields: ["kubernetes"] },
  java:       { label: "Java Backend", icon: "☕", desc: "…",
                fields: ["spring-start", "modern-java", "java", "modern-concurrency", "spring-security"],
                foundation: ["sysprog"] },          // nền tuỳ chọn, hiện tách riêng trong bộ chọn
  data:       { label: "Data & Distributed", icon: "🗄️", desc: "…",
                fields: ["ddia", "kafka"] },
};
export const PATH_ORDER = ["kubernetes", "java", "data"];
export const SPINE = { field: "senior-java", stages: [
  { track: "sj-gd1", path: "java" }, { track: "sj-gd2", path: null, note: "DevOps — chưa có lĩnh vực trong app" },
  { track: "sj-gd3", path: "kubernetes" }, { track: "sj-gd4", path: "data" } ] };
export const MATRIX_PATHS = { "sj-m1": "java", "sj-m2": "java", "sj-m3": "data", "sj-m4": "data", "sj-m5": "kubernetes", "sj-m6": null };
export function pathOfField(fieldId)   // "java" | "kubernetes" | "data" | null (spine)
```

Thứ tự `fields` trong một con đường là **thứ tự học khuyến nghị** (Spring Start → Modern Java → Java Scalability → Modern Concurrency → Spring Security), khớp với `fieldGuides` đã có.

### 3.2 Tài liệu: `chapter`, `part`, `title`

| Lĩnh vực / nhóm | `chapter` | `part` | Nguồn suy Phần |
|---|---|---|---|
| Kubernetes · Luyện thi & tra cứu | `null` | Nền tảng / CKAD / CKA / CKS | theo chứng chỉ |
| Kubernetes in Action | 2–17, Mở đầu `null` | `null` | bản dịch không ghi Phần |
| CKA Study Guide | 1–22, A | 6 Phần theo **domain đề thi**: Kỳ thi (ch.1, A) · Kiến trúc, cài đặt & cấu hình 25 % (2–8) · Workload & lập lịch 15 % (9–14) · Lưu trữ 10 % (15–16) · Service & mạng 20 % (17–20) · Xử lý sự cố 30 % (21–22) | curriculum CKA, khớp `roadmap-ckabook` |
| Kubernetes: Up and Running | 1–22, A | `null` | sách không chia Phần |
| Java Scalability | 1–10 (đơn vị "Bài") | 4 Chủ đề I–IV | README gốc |
| Lập trình hệ thống | 1–18 | `null` | giáo trình không chia Phần |
| Spring Start Here | 1–15, 00 `null` | Phần 1 — Nền tảng (1–6) · Phần 2 — Triển khai (7–15) · tệp 00: Hướng dẫn học | tệp `00-huong-dan-hoc-hieu-qua.md` §2 |
| Spring Security in Action | 1–18, A, B, 00 `null` | 6 Phần theo README + Mở đầu + Phụ lục | README nguồn |
| Modern Java in Action | 1–21 | 6 Phần theo README | README nguồn |
| Modern Concurrency in Java | 1–8 | `null` | sách không chia Phần |
| DDIA | 1–14 | Phần I — Nền tảng (1–5) · Phần II — Dữ liệu phân tán (6–10) · Phần III — Dữ liệu dẫn xuất (11–14) | **suy từ mục lục ấn bản gốc**, bản dịch không ghi — comment nói rõ |
| Kafka: The Definitive Guide | 2–14 | `null` | sách không chia Phần |
| Lộ trình Senior Java | `null` | `null` | không phải sách |

`title` sau chuẩn hoá chỉ còn tên chương (ví dụ `"Pod"`, `"Replication"`, `"Giải phẫu các Timeout"`). Mã sách `short` khai ở `FIELDS[].short` (lĩnh vực một sách) và `BOOKS[group].short` (Kubernetes): `KIA`, `CKA SG`, `KUAR`, `SSH`, `MJIA`, `Java`, `MCJ`, `SSIA`, `DDIA`, `Kafka`, `SysProg`.

Hàm nhãn trong `js/data/index.js`:

```js
docLabel(doc)              // "Ch. 5 · Pod" | "Bài 2 · Giải phẫu các Timeout" | "Phụ lục A · …" | title
docLabelWithBook(doc)      // "KIA · Ch. 5 · Pod"   — dùng ở chip tuần và tìm kiếm
docBook(doc)               // { label, short, group }
```

Id, `file`, `desc`, `tags`, `icon`, `field`, `group` **không đổi**. Tiến độ `docs.read` và mọi link `#/docs/<id>` giữ nguyên.

### 3.3 `js/data/related.js`

```js
// Một chiều, code phản chiếu. Chỉ cặp có lý do đọc-liền-mạch thật, không nối vì cùng từ khoá.
export const related = {
  "java-04": ["sysprog-06", "sysprog-10"],       // thread JVM ↔ luồng & lập lịch kernel
  "java-05": ["modconc-02", "modconc-03"],
  "java-09": ["springstart-06", "springstart-13"],
  "ddia-06": ["kafka-06", "kafka-10"],
  "ddia-12": ["kafka-14"],
  "sj-01":   ["java-01", "mjia-01", "springstart-01"],  // trục → con đường
  …
};
```

Khoảng 30 cặp, liệt kê đủ trong tệp. Hiển thị ở cuối trang đọc dưới tiêu đề **"Đọc liền mạch trên con đường"**, kèm badge lĩnh vực; bấm vào tự chuyển lĩnh vực (cơ chế deep-link sẵn có).

## 4. Giao diện

### 4.1 Bộ chọn lĩnh vực hai tầng
Bảng chọn hiện **theo con đường**: tiêu đề con đường (icon, tên, tiến độ tổng) → hàng thẻ lĩnh vực theo thứ tự học, có mũi tên nối; Lập trình hệ thống hiện dưới Java Backend với nhãn "nền tuỳ chọn"; Lộ trình Senior Java hiện ở khối riêng "Trục xuyên suốt". Nút lĩnh vực trên sidebar hiện thêm dòng nhỏ "☕ Java Backend · 3/5".

### 4.2 Bảng điều khiển
Thẻ **"Con đường của bạn"** ngay dưới hero: dải `path-flow` các lĩnh vực trong con đường, lĩnh vực hiện tại nổi bật, mỗi nút có % (đọc hoặc lộ trình), nút "Lĩnh vực kế tiếp →". Ở lĩnh vực Senior Java, thẻ này đổi thành **4 giai đoạn → con đường** với tiến độ từng giai đoạn.

### 4.3 Thư viện tài liệu
Trong mỗi nhóm (sách), tài liệu gom theo **Phần** (heading nhỏ + `x/y đã đọc`); sách không có Phần giữ lưới phẳng. Thẻ hiện `Ch. 5 · Pod`. Trang đọc: breadcrumb `Lĩnh vực / Sách / Phần / Ch. 5`; dòng meta thêm `Phần 2 · chương 5/21`; cuối bài thêm khối "Đọc liền mạch trên con đường" (related). Prev/Next giữ trong cùng sách.

### 4.4 Chỗ khác
- Chip 📖 trong tuần giáo trình: `📖 KIA · Ch. 5 · Pod` (sinh từ `docLabelWithBook`).
- Tìm kiếm: tiêu đề kết quả = `docLabel`, dòng phụ = sách · Phần.
- Ma trận năng lực: badge con đường trên header mỗi module (`MATRIX_PATHS`), M6 không badge.
- Hướng dẫn học: dòng "Vị trí trên con đường: ☕ Java Backend · bước 3/5" dưới tagline.

## 5. Bất biến mới / sửa (`check-data.mjs`)

- **#3b (sửa)** — link `#/docs` trong lộ trình hợp lệ khi cùng lĩnh vực, cùng con đường, hoặc track thuộc `SPINE.field`.
- **P1** — mọi lĩnh vực xuất hiện đúng một lần trong `PATHS[].fields ∪ foundation`, trừ `SPINE.field`; `SPINE.stages[].track` là track có thật của `SPINE.field`; `MATRIX_PATHS` phủ đúng tập module ma trận; giá trị là id con đường hoặc `null`.
- **D1** — trong cùng (lĩnh vực, nhóm), `chapter` không trùng; `chapter` là số nguyên dương hoặc chữ in `[A-Z]`; `part` là chuỗi không rỗng hoặc `null`; `title` không còn bắt đầu bằng tiền tố cũ (`/^(KIA|KUAR|CKA Book|SSIA|MCJ|MJIA|Kafka|Spring Start|Chương)\s/` hoặc `/^\d\d —/`).
- **R1** — mọi id trong `related` (khoá và giá trị) tồn tại; không tự trỏ; không lặp trong một mảng; **không** cùng lĩnh vực (cùng lĩnh vực đã có prev/next và lộ trình).
- Bảng kỳ vọng `EXPECTED.counts` không đổi.

## 6. Kế hoạch — 3 chặng

| Chặng | Nội dung | Cổng |
|---|---|---|
| 1 · Dữ liệu | `paths.js`, `related.js`, `BOOKS`/`short`/`unit`, script sinh lại 10 `docs.js` với `chapter`/`part`/`title` sạch, hàm nhãn, chip 📖 dùng nhãn mới, #3b + P1 + D1 + R1 | check-data xanh, số lượng không đổi, không còn tiền tố cũ |
| 2 · Thư viện & đọc | Thư viện theo Phần, breadcrumb/meta, khối "Đọc liền mạch", tìm kiếm dùng nhãn | check-data xanh; mở 3 sách có Phần / không Phần / Java |
| 3 · Con đường | Bộ chọn hai tầng, sidebar, thẻ Con đường trên dashboard, badge ma trận, dòng vị trí ở Hướng dẫn học, README | smoke test desktop + 375px |
