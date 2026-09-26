# Tích hợp pet project *FlashSale* vào DevPrep — thiết kế

Ngày: 2026-09-26
Trạng thái: đã duyệt thiết kế, chờ duyệt spec
Lĩnh vực mới của DevPrep — id `flashsale` (lĩnh vực thứ 17), con đường mới `project` (thứ 4)

Khuôn mẫu trực tiếp: lĩnh vực `senior-java` (kế hoạch nhiều giai đoạn, track theo giai đoạn, khối
"Nghiệm thu") và spec [`2026-09-26-pg-internals-integration-design.md`](2026-09-26-pg-internals-integration-design.md)
(quy trình chuyển nguồn, chia chặng, bảng kỳ vọng).

## 1. Bối cảnh

Thư mục `pet-project/` ở gốc repo chứa 10 tệp markdown (xuất từ Claude Docs) mô tả **FlashSale** —
nền tảng flash sale chịu tải cao, event-driven, làm trong 24 tuần (8–10 giờ/tuần) để luyện kỹ năng
Senior và mở đầu kỹ năng Solution Architect. Khác mọi lĩnh vực trước, đây **không phải sách dịch**
mà là kế hoạch dự án thực hành: 6 giai đoạn, mỗi giai đoạn có lịch theo buổi, Definition of Done,
tag Git, ADR và một luồng security chạy song song.

Trạng thái git: `Giai đoạn 5 — chi tiết.md` đã vào commit `b3ded6f`; 9 tệp còn lại chưa track.

Số liệu đã đo (từ theo `wc -w`; buổi = số dòng bảng "Lịch … theo buổi" ở mục 2; DoD = số dòng
`- [ ]` dưới "Definition of Done" ở mục 1; không tệp nào có hình):

| Tệp nguồn | Từ | Buổi | DoD |
|---|---:|---:|---:|
| `FlashSale — Kế hoạch pet project & theo dõi tiến độ.md` | 3.590 | — | — |
| `Thiết lập môi trường.md` | 3.376 | — | — |
| `Giai đoạn 0 — chi tiết.md` (tuần 1–2) | 6.116 | 8 | 10 |
| `Giai đoạn 1 — chi tiết.md` (tuần 3–6) | 6.031 | 16 | 11 |
| `Giai đoạn 2 — chi tiết.md` (tuần 7–10) | 6.815 | 16 | 11 |
| `Giai đoạn 3 — chi tiết.md` (tuần 11–15) | 7.340 | 20 | 13 |
| `Giai đoạn 4 — chi tiết.md` (tuần 16–19) | 7.611 | 16 | 13 |
| `Giai đoạn 5 — chi tiết.md` (tuần 20–24) | 9.582 | 20 | 11 |
| `Security — chi tiết.md` | 6.170 | — | — |
| `Quy ước & tự đánh giá.md` | 5.163 | — | — |
| **10 tệp** | **61.794** | **96** | **69** |

Mỗi tuần đúng 4 buổi.

**Dấu vết Claude Docs cần dọn.**
- Dòng 3 mọi tệp là byline `Sep 2x, 2026 · @Nothing`.
- Tệp tổng quan có 9 dòng dẫn chữ trần tới tab khác, ví dụ `Tài liệu chi tiết của giai đoạn này: Giai đoạn 0 — chi tiết`
  (dòng 25, 60, 81, 102, 123, 144, 164, 206, 239). Trong app chúng không bấm được.

Nền trước khi bắt đầu: `check-data.mjs` **57/57 bất biến đạt**, 16 lĩnh vực, 3 con đường.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `flashsale` | Người dùng chọn "lĩnh vực mới đủ bộ". |
| 2 | Module `["dashboard", "guide", "docs", "roadmap"]` | Nguồn không có câu hỏi phỏng vấn; bảng tự đánh giá không khớp mô hình ma trận (xem §6). |
| 3 | Con đường **mới** `project` — "Dự án thực chiến", `fields: ["flashsale"]`, cuối `PATH_ORDER` | Người dùng chọn. Dự án tổng hợp cả ba con đường, không thuộc riêng con đường nào. |
| 4 | Nới bất biến #3b bằng cờ `crossLinks: true` trên path | Để mỗi buổi trỏ thẳng tới chương Kafka/PG/Spring Security/K8s liên quan, giống ngoại lệ của trục Senior Java. |
| 5 | **6 track** `fs-gd0` … `fs-gd5`, mục = một buổi, cuối track có khối "Nghiệm thu" gồm các mục DoD | Người dùng chọn phương án A. Theo khuôn `senior-java`. |
| 6 | Không có track riêng cho Security | Việc security mỗi giai đoạn đã nằm trong các buổi (buổi tấn công, attack log) và trong DoD. |
| 7 | Nội dung nguồn giữ nguyên, trừ byline và 9 dòng dẫn | Kế hoạch là của người dùng; tích hợp không sửa nội dung. |

## 3. Chuyển nguồn → `sources/flashsale/`

`git add pet-project/` (đưa 9 tệp chưa track vào index) rồi `git mv` sang tên slug không dấu. Thư
mục `pet-project/` phải biến mất.

| Id doc | Tệp mới | Nguồn |
|---|---|---|
| `fs-00` | `00-ke-hoach-tong-quan.md` | FlashSale — Kế hoạch pet project & theo dõi tiến độ |
| `fs-01` | `01-thiet-lap-moi-truong.md` | Thiết lập môi trường |
| `fs-02` | `02-giai-doan-0.md` | Giai đoạn 0 — chi tiết |
| `fs-03` | `03-giai-doan-1.md` | Giai đoạn 1 — chi tiết |
| `fs-04` | `04-giai-doan-2.md` | Giai đoạn 2 — chi tiết |
| `fs-05` | `05-giai-doan-3.md` | Giai đoạn 3 — chi tiết |
| `fs-06` | `06-giai-doan-4.md` | Giai đoạn 4 — chi tiết |
| `fs-07` | `07-giai-doan-5.md` | Giai đoạn 5 — chi tiết |
| `fs-08` | `08-security.md` | Security — chi tiết |
| `fs-09` | `09-quy-uoc-tu-danh-gia.md` | Quy ước & tự đánh giá |

Chỉnh sửa, làm trong **commit riêng sau `git mv`** để git giữ được lịch sử đổi tên:

1. Xoá dòng byline (dòng 3) và dòng trống thừa ngay sau nó ở cả 10 tệp.
2. Ở `00-ke-hoach-tong-quan.md`, đổi phần đuôi của 9 dòng dẫn thành link markdown tương đối, giữ
   nguyên chữ dẫn. Ví dụ `Tài liệu chi tiết của giai đoạn này: [Giai đoạn 0 — chi tiết](02-giai-doan-0.md)`.
   Dòng 25 thành `[Thiết lập môi trường](01-thiet-lap-moi-truong.md)`. `rewriteMarkdownLinks` sẽ đổi chúng
   thành `#/docs/fs-NN`.

Thêm `sources/flashsale/README.md` gồm mục lục 10 tệp. Ghi rõ đây là kế hoạch cá nhân của tác giả
repo, không phải bản dịch, nên không có mục giấy phép bên thứ ba.

## 4. Dữ liệu webapp

### 4.1 `fields.js`

```js
flashsale: {
  label: "Pet project FlashSale",
  icon: "🛒",
  short: "FlashSale",
  unit: null,
  desc: "Dự án thực chiến 24 tuần: nền tảng flash sale 10.000 người tranh 500 sản phẩm — modular monolith → chịu tải → event-driven → production-grade → góc nhìn Solution Architect, kèm luồng security tự tấn công mỗi giai đoạn.",
  certFilter: false,
  modules: ["dashboard", "guide", "docs", "roadmap"],
  // Kế hoạch cá nhân trải nhiều công nghệ — không nguồn ngoài nào bao hết.
},
```

Chặng 2 khai `["dashboard", "guide", "docs"]`; `roadmap` bật ở chặng 4 (luật #7/#7c).

### 4.2 `flashsale/docs.js`

10 doc theo bảng §3, `field: "flashsale"`, `chapter: null`, `part: null` (không phải sách, giống
`senior-java`). `title` lấy từ H1 của tệp, bỏ đuôi "— tài liệu chi tiết" / "(tài liệu chi tiết)".
Riêng `fs-00` là "FlashSale — Kế hoạch & theo dõi tiến độ". Mỗi doc có `icon`, `desc` 1 câu và
`tags` 3–5 thẻ. Đăng ký trong `docs-index.js`.

### 4.3 `paths.js` và bất biến #3b

```js
project: {
  label: "Dự án thực chiến",
  icon: "🛒",
  desc: "Ráp mọi thứ đã học vào một hệ thống chạy thật: FlashSale đi qua Java/Spring, PostgreSQL, Redis, Kafka, Kubernetes và bảo mật, kết thúc bằng hồ sơ kiến trúc — nên được trỏ tới tài liệu của cả ba con đường.",
  fields: ["flashsale"],
  foundation: [],
  crossLinks: true,
},
```

`PATH_ORDER = ["kubernetes", "java", "data", "project"]`. Picker trong `app.js` lặp theo
`PATH_ORDER` nên không phải sửa view.

`check-data.mjs` #3b: `sameWay` thêm một nhánh: track thuộc path có `crossLinks` thì được link
docs mọi lĩnh vực. Cập nhật chú thích bất biến để nêu hai ngoại lệ (SPINE, path `crossLinks`).
Các bất biến P-series khác (P1: mỗi lĩnh vực đúng một con đường) giữ nguyên và phải xanh.

### 4.4 Lộ trình — `flashsale/roadmap-gd{0..5}.js`

Đăng ký 6 track trong `roadmap.js`, đồng thời cập nhật khối chú thích đầu tệp (danh sách tệp,
tiền tố id).

| Track | label | name | durationWeeks | Tuần | Buổi | DoD | Mục |
|---|---|---|---:|---|---:|---:|---:|
| `fs-gd0` | Giai đoạn 0 | Thiết kế trước khi code | 2 | 1–2 | 8 | 10 | 18 |
| `fs-gd1` | Giai đoạn 1 | Modular monolith chạy đúng | 4 | 3–6 | 16 | 11 | 27 |
| `fs-gd2` | Giai đoạn 2 | Chịu tải flash sale | 4 | 7–10 | 16 | 11 | 27 |
| `fs-gd3` | Giai đoạn 3 | Event-driven và tách service | 5 | 11–15 | 20 | 13 | 33 |
| `fs-gd4` | Giai đoạn 4 | Production-grade | 4 | 16–19 | 16 | 13 | 29 |
| `fs-gd5` | Giai đoạn 5 | Góc nhìn Solution Architect | 5 | 20–24 | 20 | 11 | 31 |
| | | | **24** | | **96** | **69** | **165** |

`desc` của track là mục tiêu giai đoạn; `prereq` là tag của giai đoạn trước (GĐ0: xong Thiết lập
môi trường).

**Khối tuần.**
- Id `fs-gd<N>-w<T>`, trong đó `T` là **số tuần tuyệt đối 1–24** như trong nguồn, để id tự nói tuần.
- `week: "Tuần T"`, `title` là chủ đề tuần rút từ câu mở đầu mục 2 của tài liệu giai đoạn.
- `goal`.
- `doneWhen` lấy từ các cột "Đầu ra" của 4 buổi trong tuần.
- `resources` gồm `#/docs/fs-0(N+2)` và `#/docs/fs-08`, cộng tối đa 2 chương ngoài lĩnh vực có
  liên quan trực tiếp.

**Mục.**
- Id `fs-gd<N>-w<T>-<M>` với `M` = 1..4 theo thứ tự buổi trong tuần.
- `text` là cột "Việc" rút gọn, dưới 80 ký tự.
- `lesson` theo khuôn:

```
**Việc cần làm.** <cột "Việc" đầy đủ, diễn giải thành câu nếu cần>

**Đầu ra.** <cột "Đầu ra">

**Đọc thêm.** <0–2 link #/docs/<id> tới chương lĩnh vực khác — chỉ khi đã đọc xác minh liên quan; bỏ dòng nếu không có>

**Nguồn.** [Giai đoạn N — buổi K](#/docs/fs-0X)
```

`K` là số buổi trong giai đoạn như bảng nguồn.

**Khối nghiệm thu.**
- Id `fs-gd<N>-done`, `week: "Nghiệm thu"`, `badge: "✓"`.
- `title: "Giai đoạn N — gắn tag vN-…"`.
- `goal` lấy câu "Mốc kiểm tra" ở tài liệu tổng quan.
- Mục `fs-gd<N>-done-<K>`: `text` là dòng DoD rút gọn, `lesson` gồm `**Cách tự chấm.**` (dòng DoD
  đầy đủ) và `**Nguồn.**`.

Id là khoá localStorage, cố định từ lần đầu.

**Đọc thêm là bắt buộc kiểm chứng.** Chỉ link chương đã đọc và thấy khớp đúng việc của buổi, ví
dụ: optimistic locking ↔ JPA, isolation ↔ PG ch.2, outbox/Kafka ↔ Kafka, Spring Security resource
server ↔ SSIA, virtual threads ↔ MCJ / Java 05, Helm/probes ↔ Kubernetes. Không ép buổi nào cũng
phải có. Sai thì bỏ.

### 4.5 `guides.js`

`fieldGuides.flashsale`:
- `tagline`.
- `audience`: đã đi phần lớn con đường Java và Data; viết được Spring Boot + JPA; dành 8–10 giờ/tuần.
- `hoursPerWeek: "8–10 giờ/tuần · 24 tuần"`.
- `prereqs`: máy đủ RAM cho Docker Compose + kind (theo `fs-01`), tài khoản GitHub, ngân sách tài
  nguyên ở `fs-09` §11.
- `steps`, 8 bước:
  - `fs-0` đọc `fs-00`, done theo doc.
  - `fs-1` làm `fs-01`, done theo doc.
  - `fs-2` … `fs-7` ứng với track `fs-gd0` … `fs-gd5`, done theo track, `desc` nêu tag Git và mốc kiểm tra.
- `method`: đo trước khi tối ưu; mỗi quyết định một ADR; xây–tấn công–sửa; cưỡng lại mở rộng
  scope. Tất cả rút từ `fs-00` "Nguyên tắc làm việc".
- `pitfalls`, `doneWhen`: 6 tag, SAD, bài viết công khai.

`trackGuides` cho 6 track (`rhythm`, `before`, `during`, `after`), bám mục 1–2 của từng tài liệu
giai đoạn. `after` luôn nhắc attack log và gắn tag.

Không đặt `group` cho docs và không thêm `groupGuides`: nhóm hiện chỉ dùng cho lĩnh vực nhiều nguồn
(Kubernetes), còn FlashSale là một nguồn.

## 5. Kiểm chứng

Sửa bảng kỳ vọng `check-data.mjs` **trước** khi viết dữ liệu:

```js
// Lĩnh vực FlashSale — pet project 24 tuần: kế hoạch, môi trường, 6 giai đoạn, security, quy ước.
"docs:flashsale": 10,
"roadmap-items:flashsale": 165,
```

Chia chặng, mỗi chặng `check-data.mjs` xanh và có một commit:

1. `git add` + `git mv` sang `sources/flashsale/`; commit riêng. Sau đó bỏ byline, sửa 9 dòng dẫn,
   thêm `README.md` nguồn; commit.
2. `fields.js` (module `dashboard, guide, docs`), `docs.js`, `docs-index.js`, `paths.js` (path
   `project` + `crossLinks`), sửa #3b, `fieldGuides.flashsale`, kỳ vọng docs.
3. Lộ trình GĐ0–2 (`fs-gd0..2`, 72 mục).
4. Lộ trình GĐ3–5 (`fs-gd3..5`, 93 mục), `trackGuides` 6 track, bật module `roadmap`, kỳ vọng 165.
5. README gốc (mục lĩnh vực + cấu trúc repo), `sources/README.md`, `webapp/README.md` (số lĩnh
   vực 17, con đường 4, số tài liệu, track, mục lộ trình).

Hoàn tất khi:

- `build-content.sh` sao chép thêm 11 tệp md (10 tài liệu + README nguồn), không có ảnh.
- `check-data.mjs` đạt toàn bộ bất biến. Tổng số bất biến chỉ thay đổi nếu thêm bất biến mới.
- Mở app bằng `dev.sh`:
  - Picker hiện con đường thứ 4 "Dự án thực chiến".
  - `fs-00` bấm được 9 link sang tài liệu chi tiết.
  - Track `fs-gd1` tick được, và khối "Nghiệm thu" có badge ✓.
  - Một link "Đọc thêm" sang lĩnh vực khác mở đúng tài liệu.
- Thư mục `pet-project/` không còn.

## 6. Ngoài phạm vi

- **Module `interview`**: nguồn không có câu hỏi; tự sáng tác là việc khác.
- **Module `tracker`**: bảng tự đánh giá Senior (11) và SA (12) ở `fs-09` §7 dùng thang trạng thái
  (Chưa bắt đầu → Tự tin) theo từng kỹ năng, không khớp mô hình tiêu chí 4 cấp của ma trận. Bảng vẫn
  đọc được trong `fs-09`.
- Flashcards, trắc nghiệm, `related.js`.
- Sửa nội dung kế hoạch. Các chữ "tab chính", "tab Giai đoạn" còn lại từ Claude Docs giữ nguyên.
- Viết mã cho chính dự án FlashSale.
