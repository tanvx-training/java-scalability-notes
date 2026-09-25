# Tích hợp *Effective Java* (ấn bản 3) vào DevPrep — thiết kế

Ngày: 2026-09-26
Trạng thái: đã duyệt thiết kế, chờ duyệt spec
Lĩnh vực mới của DevPrep — id `effective-java`

Khuôn mẫu trực tiếp: [`2026-09-09-jpa-integration-design.md`](2026-09-09-jpa-integration-design.md)
và commit `a8bd6ab` (Spring Security — lĩnh vực sách gần nhất có đủ docs + roadmap + interview).

## 1. Bối cảnh

Commit `8bf0568` thêm thư mục `Effective Java/` ở gốc repo: 11 PDF chương gốc và `vi/` chứa 11
tệp markdown bản dịch tiếng Việt *Effective Java, 3rd Edition* (Joshua Bloch — Addison-Wesley
2018). Nội dung **đã dịch xong**; việc còn lại là tích hợp vào web app DevPrep.

Số liệu đã đo:

| Ch. | Tệp nguồn | H1 bản dịch | Item | Số từ |
|---:|---|---|---|---:|
| 2 | `ch02-creating-and-destroying-objects.md` | Chương 2. Tạo và hủy đối tượng | 1–9 | 13.995 |
| 3 | `ch03-methods-common-to-all-objects.md` | Chương 3. Các phương thức chung của mọi đối tượng | 10–14 | 16.035 |
| 4 | `ch04-classes-and-interfaces.md` | Chương 4. Class và Interface | 15–25 | 20.435 |
| 5 | `ch05-generics.md` | Chương 5. Generics | 26–33 | 15.546 |
| 6 | `ch06-enums-and-annotations.md` | Chương 6. Enum và Annotation | 34–41 | 14.172 |
| 7 | `ch07-lambdas-and-streams.md` | Chương 7. Lambda và Stream | 42–48 | 15.215 |
| 8 | `ch08-methods.md` | Chương 8. Phương thức | 49–56 | 15.899 |
| 9 | `ch09-general-programming.md` | Chương 9. Lập trình tổng quát | 57–68 | 15.440 |
| 10 | `ch10-exceptions.md` | Chương 10. Exceptions | 69–77 | 8.811 |
| 11 | `ch11-concurrency.md` | Chương 11. Concurrency (Lập trình đồng thời) | 78–84 | 12.072 |
| 12 | `ch12-serialization.md` | Chương 12. Serialization | 85–90 | 12.046 |
| | | | **90 Item** | **159.666** |

Số `## Item N:` đếm được trên từng tệp khớp đủ 90 Item, không Item nào vắng.

**Chương 1 (Introduction) không có bản dịch và không có PDF.** Chương đó chỉ giới thiệu cách
dùng sách, không chứa Item nào — lĩnh vực phủ đủ 90 Item mà không cần nó.

**Ảnh.** `vi/images/` có 11 tệp `chNN-000.jpg` (ảnh bìa chương, ~7 KB). Không tệp markdown nào
tham chiếu ảnh (`grep -c '!\['` = 0 trên cả 11 tệp). Sách không có hình minh hoạ nào khác.

Nền trước khi bắt đầu: `check-data.mjs` **57/57 bất biến đạt**, 14 lĩnh vực.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `effective-java` | Sách độc lập về thành ngữ ngôn ngữ; không lĩnh vực nào hiện có phủ chủ đề này. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap", "interview"]` | Người dùng chọn "đủ bộ như Spring Security". |
| 3 | Vị trí con đường Java Backend: **sau `modern-java`, trước `wgjd`** | Người dùng chọn. Học cú pháp hiện đại (lambda/stream, MJiA) trước, rồi học dùng ngôn ngữ cho đúng, rồi mới xuống JVM (WGJD). |
| 4 | Doc id `ej-02`…`ej-12`, `chapter` 2–12, `part: null` | Không có README nguồn hay bằng chứng tên Phần; sách bản gốc cũng không chia Phần. |
| 5 | Slug tệp **tiếng Anh**, bỏ tiền tố `ch` | Tên tệp nguồn đã là slug tiếng Anh — giữ, như tiền lệ `spring-security`, `wgjd`, `jcip`. Chỉ bỏ `ch` cho đúng quy ước `NN-slug.md`. |
| 6 | **Bỏ** 11 ảnh bìa `chNN-000.jpg` | Không được tham chiếu; mang vào `sources/` chỉ tạo ảnh mồ côi. |
| 7 | Lộ trình **10 tuần / 40 mục** (4 mục/tuần), track id `ej` | §5. Một chương mỗi tuần, trừ tuần 9 gộp ch.10 (ngắn nhất) với ch.11. |
| 8 | Phỏng vấn **24 câu**, 6 chủ đề × 4 cấp | Hợp đồng chung #IQ1–#IQ8, như mọi lĩnh vực sách. |
| 9 | `externalRef` = `github.com/jbloch/effective-java-3e-source-code` | Repo mã nguồn chính thức của sách, do tác giả công bố. |
| 10 | Hướng dẫn giai đoạn 1 Senior Java: "Chuẩn bị Effective Java" → trỏ sang lĩnh vực mới | Nối trục xuyên suốt với nguồn đã có trong app. |

## 3. Nguồn: chuẩn hoá `sources/effective-java/`

`git mv` từng tệp, nâng nội dung `vi/` lên thẳng `sources/effective-java/` (lĩnh vực một nguồn —
không cấp trung gian):

| Tệp nguồn | Tệp đích | PDF gốc → `pdf/` |
|---|---|---|
| `vi/ch02-creating-and-destroying-objects.md` | `02-creating-and-destroying-objects.md` | `2 Creating and Destroying Objects _ …pdf` → `02-creating-and-destroying-objects.pdf` |
| `vi/ch03-methods-common-to-all-objects.md` | `03-methods-common-to-all-objects.md` | `3 Methods Common to All Objects _ …` |
| `vi/ch04-classes-and-interfaces.md` | `04-classes-and-interfaces.md` | `4 Classes and Interfaces _ …` |
| `vi/ch05-generics.md` | `05-generics.md` | `5 Generics _ …` |
| `vi/ch06-enums-and-annotations.md` | `06-enums-and-annotations.md` | `6 Enums and Annotations _ …` |
| `vi/ch07-lambdas-and-streams.md` | `07-lambdas-and-streams.md` | `7 Lambdas and Streams _ …` |
| `vi/ch08-methods.md` | `08-methods.md` | `8 Methods _ …` |
| `vi/ch09-general-programming.md` | `09-general-programming.md` | `9 General Programming _ …` |
| `vi/ch10-exceptions.md` | `10-exceptions.md` | `10 Exceptions _ …` |
| `vi/ch11-concurrency.md` | `11-concurrency.md` | `11 Concurrency _ …` |
| `vi/ch12-serialization.md` | `12-serialization.md` | `12 Serialization _ …` |

**Bẫy:** tên PDF gốc **không** đệm 0 (`2 Creating…`, `10 Exceptions…`) và `ls` xếp `10`–`12`
trước `2`. Ghép theo **số chương**, không theo thứ tự chuỗi.

Nội dung markdown **không sửa ký tự nào**. `git rm` 11 ảnh bìa. Sau cùng thư mục `Effective Java/`
biến mất. Đã xác nhận không nơi nào tham chiếu đường dẫn `Effective Java/`.

`sources/effective-java/README.md` viết mới: tên sách, Joshua Bloch, Addison-Wesley 2018, **bản
quyền thương mại — không phải giấy phép mở**, bảng chỉ số (11 chương, 90 Item, 159.666 từ, 0 hình,
PDF không vào deploy), mục lục 11 chương kèm dải Item, ghi chú chương 1 không có bản dịch.

## 4. Dữ liệu webapp

### 4.1 `fields.js`

```js
"effective-java": {
  label: "Effective Java",
  icon: "📘",
  short: "EJ",
  unit: "Ch.",
  desc: "Bản dịch tiếng Việt Effective Java, ấn bản 3 (Joshua Bloch, Addison-Wesley 2018) — 90 Item về tạo đối tượng, equals/hashCode, thiết kế class và interface, generics, enum, lambda & stream, thiết kế method, exception, concurrency và serialization.",
  certFilter: false,
  modules: ["dashboard", "guide", "docs", "roadmap", "interview"],
  externalRef: { label: "jbloch/effective-java-3e-source-code", href: "https://github.com/jbloch/effective-java-3e-source-code" },
},
```

### 4.2 `effective-java/docs.js`

11 mục `ej-02`…`ej-12`, `field: "effective-java"`, `chapter` = số chương, `part: null`,
`title` = H1 bỏ tiền tố "Chương N. " (bất biến D1), `file: "content/effective-java/NN-slug.md"`.
`desc` mở đầu bằng dải Item, ví dụ `"Item 1–9: static factory, builder, singleton, …"`.
`tags` gồm `"Effective Java"` + 2 nhãn chủ đề. Đăng ký trong `docs-index.js`.

### 4.3 `meta.js` — 6 chủ đề phỏng vấn

| Khoá | Nhãn | Chương |
|---|---|---|
| `ej-create` | Tạo và hủy đối tượng | 2 |
| `ej-object` | equals/hashCode/compareTo và thiết kế class | 3–4 |
| `ej-types` | Generics, enum và annotation | 5–6 |
| `ej-lambda` | Lambda và stream | 7 |
| `ej-api` | Thiết kế method, lập trình tổng quát, exception | 8–10 |
| `ej-conc` | Concurrency và serialization | 11–12 |

### 4.4 `effective-java/interview.js`

24 câu `ej-iq01`…`ej-iq24`: mỗi chủ đề 4 câu, đúng một câu mỗi cấp L1–L4 (6 câu mỗi cấp).
Hợp đồng #IQ: L1 không có `code`/`tradeoffs`/`incident`; L2 có `code`; L3 có `tradeoffs`; L4 có
`incident` với `symptom`/`scale`/`constraints`. Mỗi câu có `refs` trỏ `#/docs/ej-NN` của chương tương ứng. Đăng ký
trong `index.js`.

### 4.5 Lộ trình — `roadmap-part1.js` (T1–5) và `roadmap-part2.js` (T6–10)

Track `ej` trong `roadmap.js`: `field: "effective-java"`, `durationWeeks: 10`, tên
"Đọc Effective Java (ấn bản 3)". Id tuần `ej-w<N>`, id mục `ej-w<N>-<M>`.

| Tuần | Chương | Số từ | Nhóm Item của 4 mục |
|---:|---|---:|---|
| 1 | ch.2 | 14,0k | 1–2 · 3–5 · 6–7 · 8–9 |
| 2 | ch.3 | 16,0k | 10 · 11–12 · 13 · 14 |
| 3 | ch.4 | 20,4k | 15–16 · 17 · 18–19 · 20–25 |
| 4 | ch.5 | 15,5k | 26–27 · 28–29 · 30–31 · 32–33 |
| 5 | ch.6 | 14,2k | 34–35 · 36–37 · 38 · 39–41 |
| 6 | ch.7 | 15,2k | 42–44 · 45–46 · 47 · 48 |
| 7 | ch.8 | 15,9k | 49–50 · 51–53 · 54–55 · 56 |
| 8 | ch.9 | 15,4k | 57–60 · 61–63 · 64–66 · 67–68 |
| 9 | ch.10–11 | 20,9k | 69–72 · 73–77 · 78–80 · 81–84 |
| 10 | ch.12 + tổng ôn | 12,0k | 85–86 · 87–88 · 89–90 · tổng ôn 90 Item |

Nhóm Item trong bảng là mặc định; khi viết có thể dời ranh giới một Item nếu cân độ dài tốt hơn,
miễn giữ 4 mục/tuần và phủ đủ 90 Item. Mỗi mục theo khuôn **Mục tiêu / Đọc / Bẫy / Tự kiểm
tra**, link `#/docs/ej-NN`. Mục là kế hoạch đọc, không chép lại nội dung sách. Mỗi tuần có
`goal`, `practice`, `resources`.

### 4.6 `guides.js`

- `fieldGuides["effective-java"]`: tagline, audience (đã viết Java được, biết collection và
  interface; lambda/stream nên xong Modern Java in Action trước), `hoursPerWeek: "5–6 giờ/tuần · 10
  tuần"`, prereqs, 5 bước (`ej-1` tự đánh giá nền · `ej-2` T1–5 track 50% · `ej-3` T6–10 track
  100% · `ej-4` docs 100% · `ej-5` manual: áp dụng vào code review thật), method, pitfalls.
- `trackGuides.ej`: rhythm, before, during, after.
- `trackGuides["sj-gd1"]` (Senior Java giai đoạn 1): mục before "Chuẩn bị Effective Java và Java
  Concurrency in Practice" đổi thành nói rõ cả hai đã có trong app (lĩnh vực Effective Java và JCiP).
- `senior-java/roadmap-gd1.js`: 5 bài học đang nhắc Effective Java bằng chữ (dòng 41–42, 56, 134,
  184, 198) được thêm link `#/docs/ej-NN` tương ứng (ch.2–3, Item 2, ch.3, ch.5, ch.7). Bất biến #3b
  cho phép vì track thuộc trục Senior Java. Dòng 41 ghi "chương 1–3" — sửa thành "chương 2–3" kèm
  link, vì chương 1 không chứa Item nào và không có bản dịch. Giữ nguyên id mục.

### 4.7 `paths.js`

`java.fields` → `["spring-start", "modern-java", "effective-java", "wgjd", "jcip", "ocnj", "jpa",
"java", "modern-concurrency", "spring-security"]`. `desc` đổi "chín chặng" → "mười chặng" và chèn
chặng "dùng ngôn ngữ cho đúng (API, generics, equals/hashCode, exception)" sau "Java hiện đại".

### 4.8 `related.js`

Chỉ thêm cặp có căn cứ nội dung, kiểm bằng cách đọc cả hai chương. Ứng viên cần xác minh:
`ej-07` ↔ các chương stream/lambda của `modern-java`; `ej-11` ↔ `jcip-02`/`jcip-03`;
`ej-03` ↔ chương JPA về identity/equals entity; `ej-10` ↔ bài exception/timeout nếu có liên quan.
Cặp nào không xác minh được thì bỏ. Bất biến R1 kiểm id thật, khác lĩnh vực, không lặp.

## 5. Kiểm chứng

`check-data.mjs` — sửa bảng kỳ vọng **trước** khi viết dữ liệu:

```js
// Lĩnh vực Effective Java — 11 chương (2–12) Effective Java ấn bản 3;
// chương 1 (Introduction) không có bản dịch.
"docs:effective-java": 11,
"interview:effective-java": 24,
"roadmap-items:effective-java": 40,
```

Chia chặng để mỗi chặng `check-data.mjs` xanh (luật #7/#7b: khai module ↔ có dữ liệu):

1. Chuyển nguồn + README nguồn.
2. `fields.js` (module `dashboard, guide, docs`) + `docs.js` + `paths.js` + `fieldGuides` + kỳ vọng docs.
3. Lộ trình 10 tuần + `trackGuides.ej` + bật module `roadmap` + kỳ vọng roadmap.
4. `meta.js` + 24 câu phỏng vấn + bật module `interview` + kỳ vọng interview.
5. `related.js`, guide Senior Java, cập nhật README gốc, `sources/README.md`, `webapp/README.md`
   (số lĩnh vực, tài liệu, track, mục lộ trình, câu phỏng vấn; danh sách lĩnh vực trong con đường).

Hoàn tất khi: `build-content.sh` + `check-data.mjs` đạt toàn bộ bất biến; mở app bằng `dev.sh` và
xem được trang docs `ej-02`, track `ej` và module phỏng vấn của lĩnh vực mới; thư mục
`Effective Java/` không còn.

## 6. Ngoài phạm vi

Flashcards, trắc nghiệm, dịch chương 1, sửa nội dung bản dịch, thêm hình minh hoạ.
