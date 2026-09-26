# Tích hợp *PostgreSQL 14 Internals* vào DevPrep — thiết kế

Ngày: 2026-09-26
Trạng thái: đã duyệt thiết kế, chờ duyệt spec
Lĩnh vực mới của DevPrep — id `pg-internals` (lĩnh vực thứ 16)

Khuôn mẫu trực tiếp: [`2026-09-26-effective-java-integration-design.md`](2026-09-26-effective-java-integration-design.md)
và merge `8efc543` (Effective Java — lĩnh vực sách gần nhất có đủ docs + roadmap + interview).

## 1. Bối cảnh

Commit `f351fe5` thêm thư mục `PostgreSQL 14 Internals/` ở gốc repo: PDF gốc tiếng Anh
(`postgresql_internals-14_en.pdf`, 6,6 MB) và `vi/` chứa 31 tệp markdown bản dịch tiếng Việt,
`README.md` mục lục và `images/` (146 PNG). Sách: *PostgreSQL 14 Internals*, Egor Rogov, bản
tiếng Anh do Liudmila Mantrova dịch, © Postgres Professional 2022–2023, ISBN 978-5-6045970-4-0.
Nội dung **đã dịch xong**; việc còn lại là tích hợp vào web app DevPrep.

Số liệu đã đo (số từ theo `wc -w`, hình = số `![`, link = số link `](NN-….md)`):

| Tệp | H1 bản dịch | Từ | Hình | Link |
|---|---|---:|---:|---:|
| `00-about-this-book.md` | Về cuốn sách này (About This Book) | 2.267 | 0 | 1 |
| `01-introduction.md` | Chương 1. Giới thiệu (Introduction) | 5.786 | 4 | 19 |
| `02-isolation.md` | Chương 2. Isolation (Tính cô lập) | 8.939 | 0 | 12 |
| `03-pages-and-tuples.md` | Chương 3. Pages and Tuples (Page và tuple) | 5.443 | 1 | 9 |
| `04-snapshots.md` | Chương 4. Snapshots (Ảnh chụp dữ liệu) | 3.855 | 5 | 6 |
| `05-page-pruning-and-hot-updates.md` | Chương 5. Page Pruning và HOT Updates (…) | 3.633 | 3 | 4 |
| `06-vacuum-and-autovacuum.md` | Chương 6. Vacuum và Autovacuum (…) | 6.880 | 1 | 9 |
| `07-freezing.md` | Chương 7. Freezing (Đóng băng) | 3.749 | 3 | 7 |
| `08-rebuilding-tables-and-indexes.md` | Chương 8. Xây dựng lại bảng và index (…) | 2.760 | 0 | 9 |
| `09-buffer-cache.md` | Chương 9. Buffer Cache (Bộ đệm dữ liệu) | 5.877 | 3 | 9 |
| `10-write-ahead-log.md` | Chương 10. Write-Ahead Log (Nhật ký ghi trước) | 5.907 | 5 | 5 |
| `11-wal-modes.md` | Chương 11. Các chế độ WAL (WAL Modes) | 5.231 | 0 | 5 |
| `12-relation-level-locks.md` | Chương 12. Relation-Level Locks (…) | 3.733 | 1 | 12 |
| `13-row-level-locks.md` | Chương 13. Row-Level Locks (Khóa mức dòng) | 6.571 | 8 | 4 |
| `14-miscellaneous-locks.md` | Chương 14. Miscellaneous Locks (…) | 3.169 | 0 | 3 |
| `15-locks-on-memory-structures.md` | Chương 15. Lock trên các cấu trúc bộ nhớ (…) | 2.471 | 2 | 3 |
| `16-query-execution-stages.md` | Chương 16. Các giai đoạn thực thi truy vấn (…) | 7.037 | 8 | 6 |
| `17-statistics.md` | Chương 17. Statistics (Thống kê) | 5.705 | 5 | 6 |
| `18-table-access-methods.md` | Chương 18. Table Access Methods (…) | 5.499 | 8 | 8 |
| `19-index-access-methods.md` | Chương 19. Index Access Methods (…) | 5.015 | 1 | 13 |
| `20-index-scans.md` | Chương 20. Index Scans (Quét chỉ mục) | 6.112 | 7 | 11 |
| `21-nested-loop.md` | Chương 21. Nested Loop (Vòng lặp lồng nhau) | 5.658 | 3 | 6 |
| `22-hashing.md` | Chương 22. Hashing (Băm) | 6.343 | 12 | 5 |
| `23-sorting-and-merging.md` | Chương 23. Sorting and Merging (Sắp xếp và trộn) | 6.519 | 5 | 4 |
| `24-hash.md` | Chương 24. Hash | 2.791 | 4 | 6 |
| `25-b-tree.md` | Chương 25. B-tree (Cây B) | 6.368 | 7 | 6 |
| `26-gist.md` | Chương 26. GiST | 8.285 | 16 | 7 |
| `27-sp-gist.md` | Chương 27. SP-GiST | 4.733 | 19 | 4 |
| `28-gin.md` | Chương 28. GIN | 7.938 | 7 | 13 |
| `29-brin.md` | Chương 29. BRIN | 7.068 | 8 | 11 |
| `30-conclusion.md` | Lời kết (Conclusion) | 328 | 0 | 0 |
| | **31 tệp** | **161.670** | **146** | **~250** |

Theo Phần: mở đầu (00–01) 8,1k · Phần I 35,3k · Phần II 17,0k · Phần III 15,9k · Phần IV 47,9k ·
Phần V + lời kết 37,5k.

**Hình.** 146 tệp `images/chNN-figMM.png`, tham chiếu dạng `![Hình](images/chNN-figMM.png)`.
`fixRelativePaths` trong `webapp/js/views/docs.js` resolve ảnh theo thư mục của tệp markdown —
giữ `images/` cạnh các tệp `.md` là đủ.

**Link chéo.** Ghi chú lề của sách gốc thành link `[→ tr. N](NN-slug.md)` — **không có anchor**
(đếm `\.md#` = 0). `rewriteMarkdownLinks` đổi link `.md` tương đối thành `#/docs/<id>` khi tìm
được doc có `file` tương ứng. Giữ nguyên tên tệp là đủ; mọi tệp đích (kể cả `00-about-this-book.md`)
phải là một doc, nếu không link sẽ gãy.

**Bản quyền.** Trang bản quyền PDF chỉ ghi "© Postgres Professional, 2022–2023"; sách tải miễn phí
tại postgrespro.com nhưng **không có giấy phép mở**.

**Rác.** `PostgreSQL 14 Internals/.claude/scheduled_tasks.lock` (khoá phiên Claude Code) bị commit nhầm.

Nền trước khi bắt đầu: `check-data.mjs` **57/57 bất biến đạt**, 15 lĩnh vực.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `pg-internals` | Sách độc lập về cài đặt bên trong một CSDL; không lĩnh vực nào phủ. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap", "interview"]` | Người dùng chọn "đủ bộ như EJ". |
| 3 | Con đường **Data**: `["ddia", "pg-internals", "kafka"]` | Người dùng chọn. Lý thuyết DDIA → một CSDL thật từ bên trong → hệ stream. DDIA ch.8 trích dẫn chính sách này ([44]). |
| 4 | Doc id `pg-00`…`pg-30`; `chapter` 1–29, `null` cho 00 và 30 | Id theo số tệp để khớp tên tệp; 00/30 không phải chương. |
| 5 | **Giữ nguyên tên tệp** và `images/` | ~250 link và 146 hình tự chạy qua cơ chế sẵn có; không sửa ký tự nào của nội dung. |
| 6 | Giữ cả `00` và `30` làm doc (31 doc) | Link `[→ tr. N]` trỏ vào `00-about-this-book.md`; `30` giữ cho trọn sách. |
| 7 | Lộ trình **12 tuần / 48 mục**, track id `pg` | Người dùng chọn; bám ranh giới Phần — §4.5. |
| 8 | Phỏng vấn **24 câu**, 6 chủ đề × 4 cấp | Hợp đồng chung #IQ1–#IQ8. |
| 9 | `externalRef` = `postgrespro.com/community/books/internals` | Trang phát hành chính thức, tải PDF miễn phí. |
| 10 | Senior Java GĐ1: các bài EXPLAIN/index thêm link `#/docs/pg-NN` | Nối trục xuyên suốt với nguồn mới. |

## 3. Nguồn: chuẩn hoá `sources/pg-internals/`

`git mv` nâng nội dung `vi/` lên thẳng `sources/pg-internals/` (lĩnh vực một nguồn):

- 31 tệp `NN-slug.md` → `sources/pg-internals/NN-slug.md` (**tên không đổi**).
- `vi/images/` → `sources/pg-internals/images/` (146 tệp, tên không đổi).
- `postgresql_internals-14_en.pdf` → `sources/pg-internals/pdf/postgresql-internals-14.pdf`
  (`build-content.sh` loại `*.pdf`, không vào deploy).
- `vi/README.md` → `sources/pg-internals/README.md`, **viết lại** theo khuôn `sources/effective-java/README.md`:
  tên sách, tác giả, người dịch bản Anh, ISBN, © Postgres Professional — tải miễn phí, **không phải
  giấy phép mở**; bảng chỉ số (31 tệp, 29 chương, 5 Phần, 161.670 từ, 146 hình, PDF không vào
  deploy); giữ nguyên đoạn "Ghi chú của bản dịch" (quy ước `[→ tr. N]`, `(v. N)`, `(mặc định: …)`)
  và mục lục 5 Phần.
- `git rm` `.claude/scheduled_tasks.lock`. Sau cùng thư mục `PostgreSQL 14 Internals/` biến mất.

Nội dung 31 tệp markdown **không sửa ký tự nào**. Đã xác nhận không nơi nào khác trong repo tham
chiếu đường dẫn `PostgreSQL 14 Internals/` (lần nhắc duy nhất là trích dẫn tên sách trong `ddia-08`).

## 4. Dữ liệu webapp

### 4.1 `fields.js`

```js
"pg-internals": {
  label: "PostgreSQL 14 Internals",
  icon: "🐘",
  short: "PG",
  unit: "Ch.",
  desc: "Bản dịch tiếng Việt PostgreSQL 14 Internals (Egor Rogov, Postgres Professional 2023) — isolation và MVCC, vacuum và freezing, buffer cache và WAL, lock, planner và executor, thống kê, các phương thức join, sáu loại index (Hash, B-tree, GiST, SP-GiST, GIN, BRIN).",
  certFilter: false,
  modules: ["dashboard", "guide", "docs", "roadmap", "interview"],
  externalRef: { label: "postgrespro.com — PostgreSQL 14 Internals", href: "https://postgrespro.com/community/books/internals" },
},
```

### 4.2 `pg-internals/docs.js`

31 mục `pg-00`…`pg-30`, `field: "pg-internals"`, `file: "content/pg-internals/NN-slug.md"`.

- `chapter`: 1–29; `null` cho `pg-00`, `pg-30`.
- `title`: H1 bỏ tiền tố "Chương N. " (bất biến D1). `pg-00` = "Về cuốn sách này (About This Book)",
  `pg-30` = "Lời kết (Conclusion)".
- `part`:
  - `pg-00`, `pg-01`, `pg-30` → `null`
  - `pg-02`…`pg-08` → `"Phần I — Isolation và MVCC"`
  - `pg-09`…`pg-11` → `"Phần II — Buffer cache và WAL"`
  - `pg-12`…`pg-15` → `"Phần III — Lock"`
  - `pg-16`…`pg-23` → `"Phần IV — Thực thi truy vấn"`
  - `pg-24`…`pg-29` → `"Phần V — Các loại index"`
- `desc`: 1–2 câu nêu cơ chế chính của chương. `tags`: `"PostgreSQL"` + 2 nhãn chủ đề.

Đăng ký trong `docs-index.js`.

### 4.3 `meta.js` — 6 chủ đề phỏng vấn

| Khoá | Nhãn | Chương |
|---|---|---|
| `pg-mvcc` | Isolation, MVCC và snapshot | 2–4 |
| `pg-vacuum` | Pruning, HOT, vacuum và freezing | 5–8 |
| `pg-wal` | Buffer cache và WAL | 9–11 |
| `pg-lock` | Lock | 12–15 |
| `pg-plan` | Planner, thống kê, scan và join | 16–23 |
| `pg-index` | Các loại index | 24–29 |

### 4.4 `pg-internals/interview.js`

24 câu `pg-iq01`…`pg-iq24`: mỗi chủ đề 4 câu, đúng một câu mỗi cấp L1–L4 (6 câu mỗi cấp).
Hợp đồng #IQ: L1 không có `code`/`tradeoffs`/`incident`; L2 có `code` (SQL/psql); L3 có `tradeoffs`;
L4 có `incident` với `symptom`/`scale`/`constraints` (ví dụ: bảng phình vì transaction treo giữ
xmin, wraparound, lock queue sau `ALTER TABLE`, plan tệ do thống kê lệch). Mỗi câu có `refs` trỏ
`#/docs/pg-NN` của chương tương ứng. Đăng ký trong `index.js`.

### 4.5 Lộ trình — `roadmap-part1.js` (T1–6) và `roadmap-part2.js` (T7–12)

Track `pg` trong `roadmap.js`: `field: "pg-internals"`, `durationWeeks: 12`, tên
"Đọc PostgreSQL 14 Internals". Id tuần `pg-w<N>`, id mục `pg-w<N>-<M>`.

| Tuần | Tệp | Số từ | 4 mục (mặc định) |
|---:|---|---:|---|
| 1 | 00, 01 | 8,1k | 00 + dựng lab psql · 01 dữ liệu & process · 01 bộ nhớ & client · tự đánh giá nền |
| 2 | 02, 03 | 14,4k | 02 anomaly & chuẩn · 02 isolation trong PG · 03 page layout · 03 tuple & xmin/xmax |
| 3 | 04, 05, 06 | 14,4k | 04 snapshot · 05 pruning & HOT · 06 vacuum · 06 autovacuum |
| 4 | 07, 08 | 6,5k | 07 freezing & wraparound · 07 lab `pageinspect` · 08 VACUUM FULL/rebuild · ôn Phần I |
| 5 | 09, 10 | 11,8k | 09 buffer cache & eviction · 09 warming/local cache · 10 WAL record & LSN · 10 checkpoint & recovery |
| 6 | 11 | 5,2k | 11 wal_level & fsync · 11 hiệu năng WAL · lab `pg_waldump` · ôn Phần II |
| 7 | 12–15 | 15,9k | 12 relation lock · 13 row lock · 14 advisory/predicate lock · 15 LWLock & wait event |
| 8 | 16, 17 | 12,7k | 16 parse/rewrite/plan · 16 execute & EXPLAIN · 17 thống kê cơ bản · 17 MCV/histogram/extended |
| 9 | 18–20 | 16,6k | 18 seq scan & chi phí · 19 index AM & capability · 20 index/index-only scan · 20 bitmap scan |
| 10 | 21–23 | 18,5k | 21 nested loop · 22 hash join · 23 sort · 23 merge join & so sánh join |
| 11 | 24–26 | 17,4k | 24 hash index · 25 B-tree · 26 GiST (R-tree) · 26 GiST (exclusion, full-text) |
| 12 | 27–30 | 20,1k | 27 SP-GiST · 28 GIN · 29 BRIN · 30 + tổng ôn chọn index |

Nhóm trong bảng là mặc định; khi viết có thể dời ranh giới mục trong cùng tuần nếu cân độ dài tốt
hơn, miễn giữ 4 mục/tuần và phủ đủ 31 tệp. Tuần 4 và 6 nhẹ chữ, dành thời gian cho lab. Mỗi mục
theo khuôn **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**, link `#/docs/pg-NN`. Mục là kế hoạch đọc, không
chép lại nội dung sách. Mỗi tuần có `goal`, `practice`, `resources`.

### 4.6 `guides.js`

- `fieldGuides["pg-internals"]`: tagline, audience (đã dùng PostgreSQL, viết SQL được, biết
  transaction là gì; nên xong DDIA ch.4 và ch.8 trước), `hoursPerWeek: "5–6 giờ/tuần · 12 tuần"`,
  prereqs (PostgreSQL 14+ chạy local hoặc Docker, `psql`, extension `pageinspect`), 5 bước (`pg-1`
  tự đánh giá nền · `pg-2` T1–6 track 50% · `pg-3` T7–12 track 100% · `pg-4` docs 100% · `pg-5`
  manual: đọc EXPLAIN (ANALYZE, BUFFERS) một query chậm thật và giải thích bằng kiến thức sách),
  method, pitfalls.
- `trackGuides.pg`: rhythm, before, during, after.
- `senior-java/roadmap-gd1.js`: các bài EXPLAIN ANALYZE / index / query chậm (quanh dòng 542–557)
  thêm link `#/docs/pg-16`, `pg-17`, `pg-20`, `pg-25` theo đúng nội dung từng bài. Bất biến #3b cho
  phép vì track thuộc trục Senior Java. Giữ nguyên id mục.

### 4.7 `paths.js`

`data.fields` → `["ddia", "pg-internals", "kafka"]`. `desc` viết lại thành ba chặng: lý thuyết hệ dữ
liệu phân tán (DDIA) → một CSDL thật từ bên trong (PostgreSQL: MVCC, WAL, lock, planner, index) →
một hệ stream để chạm tay (Kafka).

### 4.8 `related.js`

Chỉ thêm cặp có căn cứ nội dung, kiểm bằng cách đọc cả hai chương. Ứng viên:

- `ddia-08` ↔ `pg-02`, `pg-04` — isolation/snapshot isolation; DDIA ch.8 trích dẫn sách này.
- `ddia-04` ↔ `pg-25`, `pg-10` — B-tree, WAL.
- `ddia-06` ↔ `pg-11` — WAL và replication.
- `jpa-11` ↔ `pg-02`, `pg-13` — lost update, `SELECT … FOR UPDATE`.

Cặp nào không xác minh được thì bỏ. Bất biến R1 kiểm id thật, khác lĩnh vực, không lặp.

## 5. Kiểm chứng

`check-data.mjs` — sửa bảng kỳ vọng **trước** khi viết dữ liệu:

```js
// Lĩnh vực PostgreSQL 14 Internals — 29 chương + "Về cuốn sách" (00) + "Lời kết" (30).
"docs:pg-internals": 31,
"roadmap-items:pg-internals": 48,
"interview:pg-internals": 24,
```

Chia chặng để mỗi chặng `check-data.mjs` xanh (luật #7/#7b: khai module ↔ có dữ liệu):

1. Chuyển nguồn + README nguồn + dọn tệp lock.
2. `fields.js` (module `dashboard, guide, docs`) + `docs.js` + `paths.js` + `fieldGuides` + kỳ vọng docs.
3. Lộ trình T1–6.
4. Lộ trình T7–12 + `trackGuides.pg` + bật module `roadmap` + kỳ vọng roadmap.
5. `meta.js` + 24 câu phỏng vấn + bật module `interview` + kỳ vọng interview.
6. `related.js`, Senior Java GĐ1, cập nhật README gốc, `sources/README.md`, `webapp/README.md` (số
   lĩnh vực, tài liệu, track, mục lộ trình, câu phỏng vấn; danh sách lĩnh vực trong con đường Data).

Hoàn tất khi:

- `build-content.sh` in đủ markdown và ảnh (tăng 31 md, 146 ảnh so với nền).
- `check-data.mjs` đạt toàn bộ bất biến.
- Mở app bằng `dev.sh`: `pg-03` hiển thị hình; bấm một link `[→ tr. N]` nhảy đúng `#/docs/pg-NN`;
  track `pg` và module phỏng vấn của lĩnh vực mới hoạt động.
- Thư mục `PostgreSQL 14 Internals/` không còn.

## 6. Ngoài phạm vi

Flashcards, trắc nghiệm, sửa nội dung bản dịch, dịch phần Index của sách gốc, thêm hình minh hoạ.
