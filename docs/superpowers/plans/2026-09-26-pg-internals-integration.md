# Tích hợp PostgreSQL 14 Internals vào DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lĩnh vực thứ 16 `pg-internals` vào DevPrep — 31 tệp bản dịch *PostgreSQL 14 Internals* (kèm 146 hình) trong thư viện tài liệu, lộ trình đọc 12 tuần / 48 mục, 24 câu phỏng vấn, nối vào con đường Data (DDIA → PostgreSQL → Kafka) và trục Senior Java.

**Architecture:** Web app tĩnh vanilla JS, không build. Dữ liệu là module ES trong `webapp/js/data/<field>/`; nguồn markdown ở `sources/<field>/` được `build-content.sh` sao chép nguyên cây (trừ PDF) vào `webapp/content/`. Ảnh tương đối và link `.md` tương đối được `webapp/js/views/docs.js` (`fixRelativePaths`, `rewriteMarkdownLinks`) tự resolve — vì vậy **giữ nguyên tên tệp và thư mục `images/`** là đủ để ~250 link `[→ tr. N](NN-slug.md)` và 146 hình chạy. "Test" của repo là `webapp/scripts/check-data.mjs` (57 bất biến + bảng `EXPECTED.counts`). Mỗi task: sửa kỳ vọng / lint trước → thấy đỏ → viết dữ liệu → thấy xanh → commit.

**Tech Stack:** JavaScript ES modules, Node (chạy check-data và lint tạm), bash, git.

**Spec:** [`docs/superpowers/specs/2026-09-26-pg-internals-integration-design.md`](../specs/2026-09-26-pg-internals-integration-design.md)

## Global Constraints

- Nhánh làm việc: `feat/pg-internals` (đã tạo, chứa commit spec `a8ccc77`).
- Field id `pg-internals`; doc id `pg-00`…`pg-30`; track id `pg`; tuần `pg-w<N>`, mục `pg-w<N>-<M>`; phỏng vấn `pg-iq01`…`pg-iq24`; chủ đề `pg-mvcc`, `pg-vacuum`, `pg-wal`, `pg-lock`, `pg-plan`, `pg-index`.
- Module: `["dashboard", "guide", "docs", "roadmap", "interview"]` — chỉ khai một module khi dữ liệu của nó đã có (bất biến #7/#7b/IQ6).
- `EXPECTED.counts`: `docs:pg-internals` = 31, `roadmap-items:pg-internals` = 48, `interview:pg-internals` = 24.
- Con đường Data: `ddia → pg-internals → kafka`.
- `chapter`: 1–29 cho chương, `null` cho `pg-00` và `pg-30`. `title` = H1 bỏ tiền tố "Chương N. ". `part` theo bảng tham chiếu.
- Nội dung 31 tệp markdown bản dịch **không sửa ký tự nào**; tên tệp và tên ảnh **không đổi**.
- Mọi văn bản hiển thị viết bằng tiếng Việt, giữ thuật ngữ tiếng Anh như bản dịch (snapshot, tuple, vacuum, WAL, checkpoint, lock, planner, B-tree…).
- Lộ trình là kế hoạch đọc trỏ vào sách, **không chép lại nội dung sách**. Chi tiết trong Bẫy/Tự kiểm tra/đáp án phỏng vấn phải có trong sách — đọc mục tương ứng trong `sources/pg-internals/` trước khi viết.
- `$SCRATCH` = thư mục scratchpad của phiên (không nằm trong repo); script lint tạm đặt ở đó, không commit.
- Lệnh kiểm chạy từ gốc repo: `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`. Viết tắt trong plan: **CHECK**.
- Commit message tiếng Việt, kiểu `feat(pg-internals): …`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Link `§N.M` trỏ sai chương hoặc mục không tồn tại** — `[§6.3 …](#/docs/pg-05)` vẫn qua #3 (id có thật). Task 3/4 có lint đối chiếu số chương của `§` với doc id **và** kiểm `## N.M` có thật trong tệp nguồn.
2. **Bỏ sót chương trong lộ trình** — 48 mục phải chạm đủ 31 doc `pg-00`…`pg-30`; không bất biến nào kiểm. Lint Task 3 (00–11) + Task 4 (12–30) in danh sách doc đã phủ.
3. **Link `[→ tr. N]` hoặc hình không chạy trong app** vì đổi tên tệp/thư mục lúc chuyển nguồn. Task 1 có bước kiểm mọi link `.md` và mọi `![…](images/…)` trỏ tới tệp có thật; Task 8 bấm thử trong app.
4. **Đề phỏng vấn lộ rubric** (IQ7) hoặc sai khoảng phút theo cấp (IQ4: L1 3–6, L2 4–10, L3 5–12, L4 8–20) — lint Task 5/6 + CHECK bắt.
5. **README/guide còn số cũ** ("15 lĩnh vực", "DDIA → Kafka", "1038 mục", "312 câu") — không bất biến nào bắt. Task 7 có bước `grep` các chuỗi cũ.

---

## Bảng tham chiếu dùng chung

| doc id | `chapter` | Tệp (`sources/pg-internals/`) | `title` | `part` | icon |
|---|---:|---|---|---|---|
| pg-00 | null | `00-about-this-book.md` | Về cuốn sách này (About This Book) | null | 📖 |
| pg-01 | 1 | `01-introduction.md` | Giới thiệu (Introduction) | null | 🐘 |
| pg-02 | 2 | `02-isolation.md` | Isolation (Tính cô lập) | Phần I — Isolation và MVCC | 🧪 |
| pg-03 | 3 | `03-pages-and-tuples.md` | Pages and Tuples (Page và tuple) | Phần I — Isolation và MVCC | 📄 |
| pg-04 | 4 | `04-snapshots.md` | Snapshots (Ảnh chụp dữ liệu) | Phần I — Isolation và MVCC | 📸 |
| pg-05 | 5 | `05-page-pruning-and-hot-updates.md` | Page Pruning và HOT Updates (Dọn dẹp trang và cập nhật HOT) | Phần I — Isolation và MVCC | ✂️ |
| pg-06 | 6 | `06-vacuum-and-autovacuum.md` | Vacuum và Autovacuum (Dọn dẹp và tự động dọn dẹp) | Phần I — Isolation và MVCC | 🧹 |
| pg-07 | 7 | `07-freezing.md` | Freezing (Đóng băng) | Phần I — Isolation và MVCC | 🧊 |
| pg-08 | 8 | `08-rebuilding-tables-and-indexes.md` | Xây dựng lại bảng và index (Rebuilding Tables and Indexes) | Phần I — Isolation và MVCC | 🏗️ |
| pg-09 | 9 | `09-buffer-cache.md` | Buffer Cache (Bộ đệm dữ liệu) | Phần II — Buffer cache và WAL | 🗃️ |
| pg-10 | 10 | `10-write-ahead-log.md` | Write-Ahead Log (Nhật ký ghi trước) | Phần II — Buffer cache và WAL | 📝 |
| pg-11 | 11 | `11-wal-modes.md` | Các chế độ WAL (WAL Modes) | Phần II — Buffer cache và WAL | ⚙️ |
| pg-12 | 12 | `12-relation-level-locks.md` | Relation-Level Locks (Khóa ở mức relation) | Phần III — Lock | 🔒 |
| pg-13 | 13 | `13-row-level-locks.md` | Row-Level Locks (Khóa mức dòng) | Phần III — Lock | 🔐 |
| pg-14 | 14 | `14-miscellaneous-locks.md` | Miscellaneous Locks (Các loại lock khác) | Phần III — Lock | 🗝️ |
| pg-15 | 15 | `15-locks-on-memory-structures.md` | Lock trên các cấu trúc bộ nhớ (Locks on Memory Structures) | Phần III — Lock | 🧠 |
| pg-16 | 16 | `16-query-execution-stages.md` | Các giai đoạn thực thi truy vấn (Query Execution Stages) | Phần IV — Thực thi truy vấn | 🔄 |
| pg-17 | 17 | `17-statistics.md` | Statistics (Thống kê) | Phần IV — Thực thi truy vấn | 📊 |
| pg-18 | 18 | `18-table-access-methods.md` | Table Access Methods (Các phương thức truy cập bảng) | Phần IV — Thực thi truy vấn | 🚶 |
| pg-19 | 19 | `19-index-access-methods.md` | Index Access Methods (Các phương thức truy cập chỉ mục) | Phần IV — Thực thi truy vấn | 🔌 |
| pg-20 | 20 | `20-index-scans.md` | Index Scans (Quét chỉ mục) | Phần IV — Thực thi truy vấn | 🔎 |
| pg-21 | 21 | `21-nested-loop.md` | Nested Loop (Vòng lặp lồng nhau) | Phần IV — Thực thi truy vấn | 🔁 |
| pg-22 | 22 | `22-hashing.md` | Hashing (Băm) | Phần IV — Thực thi truy vấn | #️⃣ |
| pg-23 | 23 | `23-sorting-and-merging.md` | Sorting and Merging (Sắp xếp và trộn) | Phần IV — Thực thi truy vấn | 🔀 |
| pg-24 | 24 | `24-hash.md` | Hash | Phần V — Các loại index | 🧮 |
| pg-25 | 25 | `25-b-tree.md` | B-tree (Cây B) | Phần V — Các loại index | 🌳 |
| pg-26 | 26 | `26-gist.md` | GiST | Phần V — Các loại index | 🗺️ |
| pg-27 | 27 | `27-sp-gist.md` | SP-GiST | Phần V — Các loại index | 🧭 |
| pg-28 | 28 | `28-gin.md` | GIN | Phần V — Các loại index | 🧷 |
| pg-29 | 29 | `29-brin.md` | BRIN | Phần V — Các loại index | 🧱 |
| pg-30 | null | `30-conclusion.md` | Lời kết (Conclusion) | null | 🏁 |

Mọi chương 1–29 có H2 đánh số `## N.M Tiêu đề` (vd `## 6.3 Các giai đoạn của vacuum (Vacuum Phases)`); `00` và `30` không đánh số.

---

### Task 1: Chuyển nguồn vào `sources/pg-internals/`

**Files:**
- Move: `PostgreSQL 14 Internals/vi/*.md` (31 tệp nội dung, tên giữ nguyên) → `sources/pg-internals/`
- Move: `PostgreSQL 14 Internals/vi/images/` (146 PNG) → `sources/pg-internals/images/`
- Move: `PostgreSQL 14 Internals/postgresql_internals-14_en.pdf` → `sources/pg-internals/pdf/postgresql-internals-14.pdf`
- Move + rewrite: `PostgreSQL 14 Internals/vi/README.md` → `sources/pg-internals/README.md`
- Delete: `PostgreSQL 14 Internals/.claude/scheduled_tasks.lock`
- Modify: `sources/README.md` (bảng "Bản đồ hiện tại", sau dòng `ddia`)

**Interfaces:**
- Produces: 31 tệp `sources/pg-internals/NN-slug.md` đúng tên ở bảng tham chiếu + `images/`; Task 2 trỏ `file: "content/pg-internals/NN-slug.md"`.

- [ ] **Step 1: Xác nhận nền xanh, ghi số liệu content nền, và không ai tham chiếu đường dẫn cũ**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -2
grep -rn "PostgreSQL 14 Internals/" --exclude-dir=.git --exclude-dir=docs --exclude-dir=content --exclude-dir="PostgreSQL 14 Internals" .
```

Expected: dòng `✓ content: <M> markdown, <I> ảnh` (ghi lại M, I), `57/57 bất biến đạt`; grep không in dòng nào.

- [ ] **Step 2: Chuyển markdown, ảnh, PDF; dọn tệp lock**

```bash
mkdir -p sources/pg-internals/pdf
for f in "PostgreSQL 14 Internals/vi"/[0-3][0-9]-*.md; do git mv "$f" sources/pg-internals/; done
git mv "PostgreSQL 14 Internals/vi/images" sources/pg-internals/images
git mv "PostgreSQL 14 Internals/vi/README.md" sources/pg-internals/README.md
git mv "PostgreSQL 14 Internals/postgresql_internals-14_en.pdf" sources/pg-internals/pdf/postgresql-internals-14.pdf
git rm -q "PostgreSQL 14 Internals/.claude/scheduled_tasks.lock"
ls "PostgreSQL 14 Internals" 2>/dev/null && echo "CÒN SÓT" || echo "đã sạch"
ls sources/pg-internals/*.md | wc -l; ls sources/pg-internals/images | wc -l
```

Expected: `đã sạch`; `32` (31 tệp nội dung + README); `146`. Nếu còn sót `.DS_Store` không theo dõi trong thư mục cũ thì `rm -rf "PostgreSQL 14 Internals"` sau khi đã chắc `git status` không còn tệp tracked nào ở đó.

- [ ] **Step 3: Kiểm mọi link `.md` và mọi ảnh trỏ tới tệp có thật** (Review Focus #3)

```bash
cd sources/pg-internals
grep -ohE '\]\([^)#]+\.md(#[^)]*)?\)' [0-3]*.md | sed -E 's/^\]\(//; s/[#)].*//' | sort -u | while read t; do [ -f "$t" ] || echo "LINK GÃY: $t"; done
grep -ohE '!\[[^]]*\]\([^)]+\)' [0-3]*.md | sed -E 's/.*\(//; s/\)$//' | sort -u | while read t; do [ -f "$t" ] || echo "ẢNH GÃY: $t"; done
comm -13 <(grep -ohE 'images/[^)]+' [0-3]*.md | sort -u) <(ls images | sed 's#^#images/#' | sort)
cd -
```

Expected: không in `LINK GÃY`/`ẢNH GÃY`; dòng `comm` cuối (ảnh mồ côi) không in gì.

- [ ] **Step 4: Viết lại `sources/pg-internals/README.md`** (thay toàn bộ nội dung):

```markdown
# PostgreSQL 14 Internals

Bản dịch tiếng Việt của *PostgreSQL 14 Internals* — Egor Rogov. Bản tiếng Anh do Liudmila Mantrova
dịch từ tiếng Nga. © Postgres Professional, 2022–2023 · ISBN 978-5-6045970-4-0.

> **Bản quyền.** Sách gốc được Postgres Professional phát hành **miễn phí** dạng PDF tại
> <https://postgrespro.com/community/books/internals>, nhưng **không** kèm giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Tệp | 31: "Về cuốn sách này" (00), chương 1–29, "Lời kết" (30) |
| Phần | 5 — Isolation và MVCC · Buffer cache và WAL · Lock · Thực thi truy vấn · Các loại index |
| Số từ | 161.670 |
| Hình | 146, trong `images/` (chữ trong hình giữ tiếng Anh) |
| PDF gốc | `pdf/postgresql-internals-14.pdf` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Trong app | Lĩnh vực **PostgreSQL 14 Internals**, kèm lộ trình đọc 12 tuần / 48 mục và 24 câu phỏng vấn |

## Ghi chú của bản dịch

Mỗi chương là một file markdown riêng. Thuật ngữ chuyên ngành được giữ nguyên tiếng Anh. Mã nguồn, câu
lệnh SQL và kết quả truy vấn được giữ nguyên văn. Ghi chú bên lề của sách gốc được đặt ngay trong đoạn
văn: *[→ tr. N](...)* là tham chiếu tới trang N của sách gốc (link trỏ tới chương chứa trang đó),
*(v. N)* là phiên bản PostgreSQL bắt đầu có tính năng, *(mặc định: …)* là giá trị mặc định của tham số
được nhắc tới. Phần Index (chỉ mục tra cứu theo số trang) của sách gốc không được đưa vào.

**Không đổi tên tệp.** Các link `[→ tr. N](NN-slug.md)` và `images/…` dựa vào tên tệp hiện tại; web app
đổi chúng thành link nội bộ lúc hiển thị.

## Mục lục

- [Về cuốn sách này (About This Book)](00-about-this-book.md)
- [Chương 1. Giới thiệu (Introduction)](01-introduction.md)

### Phần I. Isolation và MVCC

- [Chương 2. Isolation (Tính cô lập)](02-isolation.md)
- [Chương 3. Pages and Tuples (Page và tuple)](03-pages-and-tuples.md)
- [Chương 4. Snapshots (Ảnh chụp dữ liệu)](04-snapshots.md)
- [Chương 5. Page Pruning và HOT Updates](05-page-pruning-and-hot-updates.md)
- [Chương 6. Vacuum và Autovacuum](06-vacuum-and-autovacuum.md)
- [Chương 7. Freezing (Đóng băng)](07-freezing.md)
- [Chương 8. Xây dựng lại bảng và index](08-rebuilding-tables-and-indexes.md)

### Phần II. Buffer cache và WAL

- [Chương 9. Buffer Cache (Bộ đệm dữ liệu)](09-buffer-cache.md)
- [Chương 10. Write-Ahead Log (Nhật ký ghi trước)](10-write-ahead-log.md)
- [Chương 11. Các chế độ WAL (WAL Modes)](11-wal-modes.md)

### Phần III. Lock

- [Chương 12. Relation-Level Locks](12-relation-level-locks.md)
- [Chương 13. Row-Level Locks](13-row-level-locks.md)
- [Chương 14. Miscellaneous Locks](14-miscellaneous-locks.md)
- [Chương 15. Lock trên các cấu trúc bộ nhớ](15-locks-on-memory-structures.md)

### Phần IV. Thực thi truy vấn

- [Chương 16. Các giai đoạn thực thi truy vấn](16-query-execution-stages.md)
- [Chương 17. Statistics (Thống kê)](17-statistics.md)
- [Chương 18. Table Access Methods](18-table-access-methods.md)
- [Chương 19. Index Access Methods](19-index-access-methods.md)
- [Chương 20. Index Scans (Quét chỉ mục)](20-index-scans.md)
- [Chương 21. Nested Loop](21-nested-loop.md)
- [Chương 22. Hashing (Băm)](22-hashing.md)
- [Chương 23. Sorting and Merging](23-sorting-and-merging.md)

### Phần V. Các loại index

- [Chương 24. Hash](24-hash.md)
- [Chương 25. B-tree (Cây B)](25-b-tree.md)
- [Chương 26. GiST](26-gist.md)
- [Chương 27. SP-GiST](27-sp-gist.md)
- [Chương 28. GIN](28-gin.md)
- [Chương 29. BRIN](29-brin.md)

- [Lời kết (Conclusion)](30-conclusion.md)
```

- [ ] **Step 5: Thêm dòng vào bảng "Bản đồ hiện tại" của `sources/README.md`** — chèn ngay sau dòng `| \`ddia\` | …`:

```markdown
| `pg-internals` | `pg-internals/` | Bản dịch *PostgreSQL 14 Internals* (Rogov, Postgres Professional 2023) — 29 chương + 00/30, 146 ảnh, PDF |
```

- [ ] **Step 6: CHECK — vẫn 57/57; content tăng đúng 32 markdown và 146 ảnh** (README cũng là markdown; chưa khai lĩnh vực nên app chưa đọc thư mục mới)

Expected: `57/57 bất biến đạt`; dòng `✓ content:` in `M+32 markdown, I+146 ảnh` so với Step 1.

- [ ] **Step 7: Commit**

```bash
git add -A sources/pg-internals sources/README.md "PostgreSQL 14 Internals"
git commit -m "feat(pg-internals): chuyển bản dịch 31 tệp và 146 hình vào sources/pg-internals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Khai lĩnh vực + thư viện 31 tài liệu + con đường Data + hướng dẫn lĩnh vực

**Files:**
- Modify: `webapp/scripts/check-data.mjs` (`EXPECTED.counts`, sau khối `ddia` dòng ~60–62)
- Modify: `webapp/js/data/fields.js` (entry mới sau khối `ddia`; `FIELD_ORDER` dòng ~166)
- Create: `webapp/js/data/pg-internals/docs.js`
- Modify: `webapp/js/data/docs-index.js`
- Modify: `webapp/js/data/paths.js` (`PATHS.data`)
- Modify: `webapp/js/data/guides.js` (`fieldGuides`, chèn sau khối `ddia` — kết thúc trước `"modern-java":` ở dòng ~271)

**Interfaces:**
- Consumes: tệp nguồn Task 1.
- Produces: `FIELDS["pg-internals"]`, 31 doc id `pg-00`…`pg-30` mà Task 3–7 link tới qua `#/docs/pg-NN`; `pathOfField("pg-internals") === "data"` (cho phép lộ trình link sang `ddia-*`/`kafka-*` theo #3b).

- [ ] **Step 1: Thêm kỳ vọng docs trước (đỏ)** — trong `EXPECTED.counts`, ngay sau `"roadmap-items:ddia": 48,`:

```js
    // Lĩnh vực PostgreSQL 14 Internals — 29 chương + "Về cuốn sách" (00) + "Lời kết" (30).
    "docs:pg-internals": 31,
```

- [ ] **Step 2: CHECK — phải đỏ**

Expected: FAIL ở "Số lượng bản ghi khớp bảng kỳ vọng" (docs:pg-internals 0 ≠ 31).

- [ ] **Step 3: Khai lĩnh vực trong `fields.js`** — entry chèn ngay sau khối `ddia: { … },`:

```js
  "pg-internals": {
    label: "PostgreSQL 14 Internals",
    icon: "🐘",
    short: "PG",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt PostgreSQL 14 Internals (Egor Rogov, Postgres Professional 2023) — isolation và MVCC, vacuum và freezing, buffer cache và WAL, lock, planner và executor, thống kê, các phương thức join, sáu loại index (Hash, B-tree, GiST, SP-GiST, GIN, BRIN).",
    certFilter: false,
    // Mở dần theo dữ liệu: "roadmap" bật ở Task 4, "interview" ở Task 6 — khai sớm là #7/IQ6 báo đỏ.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "postgrespro.com — PostgreSQL 14 Internals", href: "https://postgrespro.com/community/books/internals" },
  },
```

`FIELD_ORDER`: chèn `"pg-internals"` ngay sau `"ddia"` (trước `"kafka"`).

- [ ] **Step 4: Tạo `webapp/js/data/pg-internals/docs.js`** — khoá viết tường minh trên từng entry như `ddia/docs.js`:

```js
// Tài liệu lĩnh vực "PostgreSQL 14 Internals" — 31 tài liệu: "Về cuốn sách này" (00),
// chương 1–29 và "Lời kết" (30).
// Nguồn markdown: sources/pg-internals/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/pg-internals/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` (số / null) và `part` (Phần trong sách / null): nhãn hiển thị sinh bởi
// labels.js ("Ch. 5 · …"), `title` chỉ còn tên chương (bất biến D1).
// Phần lấy từ mục lục của bản dịch (sources/pg-internals/README.md).
//
// KHÔNG đổi tên tệp nguồn: ~250 link "[→ tr. N](NN-slug.md)" trong bản dịch được
// docs.js (rewriteMarkdownLinks) đổi thành #/docs/pg-NN nhờ khớp đúng `file` dưới đây.

const P1 = "Phần I — Isolation và MVCC";
const P2 = "Phần II — Buffer cache và WAL";
const P3 = "Phần III — Lock";
const P4 = "Phần IV — Thực thi truy vấn";
const P5 = "Phần V — Các loại index";

export const docs = [
  {
    id: "pg-00", field: "pg-internals", chapter: null, part: null,
    title: "Về cuốn sách này (About This Book)",
    file: "content/pg-internals/00-about-this-book.md", icon: "📖",
    desc: "Sách dành cho ai, không và có mang lại gì, cấu trúc năm Phần và quy ước ghi chú lề (tham chiếu trang, phiên bản, giá trị mặc định).",
    tags: ["PostgreSQL", "Giới thiệu", "Quy ước"],
  },
  {
    id: "pg-01", field: "pg-internals", chapter: 1, part: null,
    title: "Giới thiệu (Introduction)",
    file: "content/pg-internals/01-introduction.md", icon: "🐘",
    desc: "Bức tranh tổng thể: database, schema, relation, fork và page; process postmaster, backend, background; shared memory; giao thức client-server.",
    tags: ["PostgreSQL", "Kiến trúc", "Process"],
  },
  {
    id: "pg-02", field: "pg-internals", chapter: 2, part: P1,
    title: "Isolation (Tính cô lập)",
    file: "content/pg-internals/02-isolation.md", icon: "🧪",
    desc: "Consistency, các anomaly và isolation level trong chuẩn SQL, cách PostgreSQL hiện thực Read Committed, Repeatable Read, Serializable — và nên chọn mức nào.",
    tags: ["PostgreSQL", "Isolation", "Anomaly"],
  },
  {
    id: "pg-03", field: "pg-internals", chapter: 3, part: P1,
    title: "Pages and Tuples (Page và tuple)",
    file: "content/pg-internals/03-pages-and-tuples.md", icon: "📄",
    desc: "Cấu trúc page, bố cục row version (xmin, xmax, infomask), insert/update/delete trên tuple, index, TOAST, virtual transaction và subtransaction.",
    tags: ["PostgreSQL", "MVCC", "Page layout"],
  },
  {
    id: "pg-04", field: "pg-internals", chapter: 4, part: P1,
    title: "Snapshots (Ảnh chụp dữ liệu)",
    file: "content/pg-internals/04-snapshots.md", icon: "📸",
    desc: "Snapshot là gì, quy tắc visibility của row version, cấu trúc snapshot (xmin, xmax, xip), transaction horizon, snapshot của catalog và export snapshot.",
    tags: ["PostgreSQL", "Snapshot", "Visibility"],
  },
  {
    id: "pg-05", field: "pg-internals", chapter: 5, part: P1,
    title: "Page Pruning và HOT Updates (Dọn dẹp trang và cập nhật HOT)",
    file: "content/pg-internals/05-page-pruning-and-hot-updates.md", icon: "✂️",
    desc: "Dọn dẹp trong phạm vi một page khi đọc, HOT update tránh cập nhật index, HOT chain và khi nào chain bị tách, pruning cho index.",
    tags: ["PostgreSQL", "HOT update", "Pruning"],
  },
  {
    id: "pg-06", field: "pg-internals", chapter: 6, part: P1,
    title: "Vacuum và Autovacuum (Dọn dẹp và tự động dọn dẹp)",
    file: "content/pg-internals/06-vacuum-and-autovacuum.md", icon: "🧹",
    desc: "Vacuum làm gì, database horizon, các giai đoạn vacuum, analyze, autovacuum kích hoạt khi nào, quản lý tải và giám sát.",
    tags: ["PostgreSQL", "Vacuum", "Autovacuum"],
  },
  {
    id: "pg-07", field: "pg-internals", chapter: 7, part: P1,
    title: "Freezing (Đóng băng)",
    file: "content/pg-internals/07-freezing.md", icon: "🧊",
    desc: "Wraparound của transaction ID 32 bit, đóng băng tuple và quy tắc visibility, các tham số điều khiển freezing, freeze thủ công.",
    tags: ["PostgreSQL", "Freezing", "Wraparound"],
  },
  {
    id: "pg-08", field: "pg-internals", chapter: 8, part: P1,
    title: "Xây dựng lại bảng và index (Rebuilding Tables and Indexes)",
    file: "content/pg-internals/08-rebuilding-tables-and-indexes.md", icon: "🏗️",
    desc: "VACUUM FULL, các cách rebuild khác (CLUSTER, REINDEX, pg_repack) và biện pháp phòng ngừa để không phải rebuild.",
    tags: ["PostgreSQL", "Bloat", "VACUUM FULL"],
  },
  {
    id: "pg-09", field: "pg-internals", chapter: 9, part: P2,
    title: "Buffer Cache (Bộ đệm dữ liệu)",
    file: "content/pg-internals/09-buffer-cache.md", icon: "🗃️",
    desc: "Thiết kế buffer cache, cache hit và miss, thuật toán eviction, bulk eviction qua buffer ring, chọn shared_buffers, làm nóng cache, local cache.",
    tags: ["PostgreSQL", "Buffer cache", "shared_buffers"],
  },
  {
    id: "pg-10", field: "pg-internals", chapter: 10, part: P2,
    title: "Write-Ahead Log (Nhật ký ghi trước)",
    file: "content/pg-internals/10-write-ahead-log.md", icon: "📝",
    desc: "Vì sao cần WAL, cấu trúc WAL record và LSN, checkpoint, khôi phục sau sự cố, background writer và các tham số thiết lập WAL.",
    tags: ["PostgreSQL", "WAL", "Checkpoint"],
  },
  {
    id: "pg-11", field: "pg-internals", chapter: 11, part: P2,
    title: "Các chế độ WAL (WAL Modes)",
    file: "content/pg-internals/11-wal-modes.md", icon: "⚙️",
    desc: "Hiệu năng ghi WAL (synchronous/asynchronous commit), khả năng chịu lỗi (fsync, checksum, full page writes) và các mức wal_level.",
    tags: ["PostgreSQL", "WAL", "Durability"],
  },
  {
    id: "pg-12", field: "pg-internals", chapter: 12, part: P3,
    title: "Relation-Level Locks (Khóa ở mức relation)",
    file: "content/pg-internals/12-relation-level-locks.md", icon: "🔒",
    desc: "Heavyweight lock, lock trên transaction ID, tám mode lock mức relation và ma trận xung đột, hàng đợi chờ khiến một lệnh DDL chặn mọi truy vấn.",
    tags: ["PostgreSQL", "Lock", "DDL"],
  },
  {
    id: "pg-13", field: "pg-internals", chapter: 13, part: P3,
    title: "Row-Level Locks (Khóa mức dòng)",
    file: "content/pg-internals/13-row-level-locks.md", icon: "🔐",
    desc: "Lock mức dòng lưu trong tuple, bốn mode FOR UPDATE/NO KEY UPDATE/SHARE/KEY SHARE, multitransaction, hàng đợi chờ, NOWAIT/SKIP LOCKED và deadlock.",
    tags: ["PostgreSQL", "Row lock", "Deadlock"],
  },
  {
    id: "pg-14", field: "pg-internals", chapter: 14, part: P3,
    title: "Miscellaneous Locks (Các loại lock khác)",
    file: "content/pg-internals/14-miscellaneous-locks.md", icon: "🗝️",
    desc: "Lock không gắn với đối tượng, lock mở rộng relation, lock trang, advisory lock và predicate lock của Serializable.",
    tags: ["PostgreSQL", "Advisory lock", "Predicate lock"],
  },
  {
    id: "pg-15", field: "pg-internals", chapter: 15, part: P3,
    title: "Lock trên các cấu trúc bộ nhớ (Locks on Memory Structures)",
    file: "content/pg-internals/15-locks-on-memory-structures.md", icon: "🧠",
    desc: "Spinlock, lightweight lock, ví dụ trên buffer cache và WAL, giám sát wait event và lấy mẫu pg_stat_activity.",
    tags: ["PostgreSQL", "LWLock", "Wait event"],
  },
  {
    id: "pg-16", field: "pg-internals", chapter: 16, part: P4,
    title: "Các giai đoạn thực thi truy vấn (Query Execution Stages)",
    file: "content/pg-internals/16-query-execution-stages.md", icon: "🔄",
    desc: "Database demo, simple query protocol (parse, rewrite, plan, execute) và extended query protocol với prepared statement, generic và custom plan.",
    tags: ["PostgreSQL", "Planner", "EXPLAIN"],
  },
  {
    id: "pg-17", field: "pg-internals", chapter: 17, part: P4,
    title: "Statistics (Thống kê)",
    file: "content/pg-internals/17-statistics.md", icon: "📊",
    desc: "Thống kê cơ bản, NULL, distinct, most common values, histogram, correlation, thống kê cho biểu thức và thống kê đa biến — nền của mọi ước lượng cardinality.",
    tags: ["PostgreSQL", "Statistics", "Cardinality"],
  },
  {
    id: "pg-18", field: "pg-internals", chapter: 18, part: P4,
    title: "Table Access Methods (Các phương thức truy cập bảng)",
    file: "content/pg-internals/18-table-access-methods.md", icon: "🚶",
    desc: "Storage engine dạng cắm được, sequential scan và cách tính chi phí, parallel plan, parallel sequential scan và giới hạn của thực thi song song.",
    tags: ["PostgreSQL", "Seq scan", "Parallel"],
  },
  {
    id: "pg-19", field: "pg-internals", chapter: 19, part: P4,
    title: "Index Access Methods (Các phương thức truy cập chỉ mục)",
    file: "content/pg-internals/19-index-access-methods.md", icon: "🔌",
    desc: "Index và khả năng mở rộng, operator class và operator family, giao diện indexing engine và các thuộc tính (capability) của access method.",
    tags: ["PostgreSQL", "Index", "Operator class"],
  },
  {
    id: "pg-20", field: "pg-internals", chapter: 20, part: P4,
    title: "Index Scans (Quét chỉ mục)",
    file: "content/pg-internals/20-index-scans.md", icon: "🔎",
    desc: "Index scan, index-only scan và visibility map, bitmap scan, parallel index scan, và so sánh chi phí các phương thức truy cập theo selectivity.",
    tags: ["PostgreSQL", "Index scan", "Bitmap scan"],
  },
  {
    id: "pg-21", field: "pg-internals", chapter: 21, part: P4,
    title: "Nested Loop (Vòng lặp lồng nhau)",
    file: "content/pg-internals/21-nested-loop.md", icon: "🔁",
    desc: "Các kiểu join và phương thức join; nested loop join, parameterized join, memoize và cách planner ước lượng chi phí.",
    tags: ["PostgreSQL", "Join", "Nested loop"],
  },
  {
    id: "pg-22", field: "pg-internals", chapter: 22, part: P4,
    title: "Hashing (Băm)",
    file: "content/pg-internals/22-hashing.md", icon: "#️⃣",
    desc: "Hash join một lượt và hai lượt (batch ra đĩa), parallel hash join, và hash cho distinct/gom nhóm.",
    tags: ["PostgreSQL", "Hash join", "work_mem"],
  },
  {
    id: "pg-23", field: "pg-internals", chapter: 23, part: P4,
    title: "Sorting and Merging (Sắp xếp và trộn)",
    file: "content/pg-internals/23-sorting-and-merging.md", icon: "🔀",
    desc: "Merge join, các thuật toán sắp xếp (quicksort, top-N heapsort, external sort), distinct/gom nhóm bằng sort và so sánh ba phương pháp join.",
    tags: ["PostgreSQL", "Merge join", "Sort"],
  },
  {
    id: "pg-24", field: "pg-internals", chapter: 24, part: P5,
    title: "Hash",
    file: "content/pg-internals/24-hash.md", icon: "🧮",
    desc: "Hash index: tổng quan, bố cục trang, operator class và các thuộc tính — khi nào nó hơn B-tree.",
    tags: ["PostgreSQL", "Hash index", "Index"],
  },
  {
    id: "pg-25", field: "pg-internals", chapter: 25, part: P5,
    title: "B-tree (Cây B)",
    file: "content/pg-internals/25-b-tree.md", icon: "🌳",
    desc: "Cấu trúc B-tree, tìm kiếm và chèn (page split), bố cục page và deduplication, operator class, thuộc tính: thứ tự, unique, covering index.",
    tags: ["PostgreSQL", "B-tree", "Index"],
  },
  {
    id: "pg-26", field: "pg-internals", chapter: 26, part: P5,
    title: "GiST",
    file: "content/pg-internals/26-gist.md", icon: "🗺️",
    desc: "Khung GiST, R-tree cho điểm (tìm kiếm, k-NN), RD-tree cho tìm kiếm toàn văn và các kiểu dữ liệu khác như range với exclusion constraint.",
    tags: ["PostgreSQL", "GiST", "Không gian"],
  },
  {
    id: "pg-27", field: "pg-internals", chapter: 27, part: P5,
    title: "SP-GiST",
    file: "content/pg-internals/27-sp-gist.md", icon: "🧭",
    desc: "Cây phân hoạch không cân bằng: quadtree và k-d tree cho điểm, radix tree cho chuỗi, và các kiểu dữ liệu khác.",
    tags: ["PostgreSQL", "SP-GiST", "Radix tree"],
  },
  {
    id: "pg-28", field: "pg-internals", chapter: 28, part: P5,
    title: "GIN",
    file: "content/pg-internals/28-gin.md", icon: "🧷",
    desc: "Inverted index: tìm kiếm toàn văn, trigram, index mảng, index JSON (jsonb_ops và jsonb_path_ops) và các kiểu dữ liệu khác.",
    tags: ["PostgreSQL", "GIN", "Full-text"],
  },
  {
    id: "pg-29", field: "pg-internals", chapter: 29, part: P5,
    title: "BRIN",
    file: "content/pg-internals/29-brin.md", icon: "🧱",
    desc: "Block range index: ví dụ, bố cục page, tìm kiếm, cập nhật summary và bốn họ operator class minmax, minmax-multi, inclusion, bloom.",
    tags: ["PostgreSQL", "BRIN", "Time-series"],
  },
  {
    id: "pg-30", field: "pg-internals", chapter: null, part: null,
    title: "Lời kết (Conclusion)",
    file: "content/pg-internals/30-conclusion.md", icon: "🏁",
    desc: "Lời kết của tác giả và gợi ý đi tiếp sau cuốn sách.",
    tags: ["PostgreSQL", "Lời kết", "Đọc tiếp"],
  },
];
```

Trước khi viết: đọc lướt từng tệp nguồn để chắc mỗi `desc` chỉ nêu nội dung **có** trong chương (vd `pg-21` có nhắc memoize không? `pg-25` có deduplication không? `pg-08` có nhắc pg_repack không?). Cụm nào không có thì bỏ khỏi `desc`.

- [ ] **Step 5: Đăng ký trong `docs-index.js`**

Thêm `import { docs as pgInternals } from "./pg-internals/docs.js";` sau dòng import `ddia`, và `...pgInternals,` ngay sau `...ddia,` (xem dạng tên biến thực tế trong tệp và theo đúng nếp).

- [ ] **Step 6: Con đường — `paths.js`**

`PATHS.data` →

```js
  data: {
    label: "Data & Distributed",
    icon: "🗄️",
    desc: "Ba chặng: lý thuyết hệ dữ liệu phân tán (DDIA) → một CSDL thật từ bên trong (PostgreSQL: MVCC, vacuum, WAL, lock, planner, index) → một hệ stream để chạm tay (Kafka): replication, sharding, transaction, exactly-once, stream.",
    fields: ["ddia", "pg-internals", "kafka"],
    foundation: [],
  },
```

- [ ] **Step 7: `fieldGuides["pg-internals"]` trong `guides.js`** (chèn ngay sau khối `ddia: { … },` của `fieldGuides`):

```js
  "pg-internals": {
    tagline: "Đọc PostgreSQL 14 Internals có kỷ luật — 12 tuần từ MVCC tới sáu loại index, mỗi tuần chạy lại thí nghiệm của sách trên psql.",
    audience: "Backend engineer hoặc DBA đã dùng PostgreSQL, viết được SQL có JOIN và biết transaction là gì; **nên xong DDIA chương 4 (lưu trữ) và chương 8 (transaction) trước** — sách này là bản cài đặt thật của những khái niệm đó. Không cần biết C.",
    hoursPerWeek: "5–6 giờ/tuần · 12 tuần",
    prereqs: [
      "PostgreSQL 14 trở lên chạy local hoặc bằng Docker, kết nối được bằng `psql`.",
      "Quyền tạo extension `pageinspect` và `pg_buffercache` trên database lab (sách dùng chúng liên tục).",
      "Đọc được EXPLAIN ở mức cơ bản; biết Read Committed là mặc định.",
    ],
    steps: [
      { id: "pg-1", title: "Dựng lab psql và tự đánh giá nền", desc: "PostgreSQL 14+ chạy được, tạo được extension pageinspect. Tự hỏi: giải thích được isolation level và index B-tree ở mức người dùng chưa? Chưa thì đọc DDIA chương 4 và 8 trước.", done: { kind: "manual" } },
      // pg-2, pg-3 (bước trỏ track "pg") thêm ở Task 4 — track chưa tồn tại thì G3 báo đỏ.
      { id: "pg-4", title: "Đọc trọn 31 tài liệu", desc: "Chương 1–29 cùng phần mở đầu và lời kết. Đánh dấu đã đọc từng chương khi xong.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "pg-5", title: "Giải thích một query chậm thật bằng kiến thức sách", desc: "Chạy EXPLAIN (ANALYZE, BUFFERS) cho một query chậm ở hệ thật; viết một trang giải thích plan: ước lượng lệch vì thống kê nào, phương thức truy cập và join nào, buffer hit/read. Tự đánh dấu khi xong.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Chạy lại mọi thí nghiệm", desc: "Sách viết quanh các câu lệnh psql có output. Gõ lại, so output của bạn với sách; khác nhau ở đâu thì đó là chỗ đáng hiểu nhất." },
      { title: "Hai phiên psql cạnh nhau", desc: "Chương isolation, snapshot và lock chỉ hiểu thật khi mở hai (có khi ba) phiên và tự tay xen kẽ lệnh." },
      { title: "Nối ngược về DDIA", desc: "Mỗi Phần của sách là bản cài đặt thật của một chương DDIA: Phần I ↔ transaction, Phần II ↔ lưu trữ và durability, Phần V ↔ index. Ghi một dòng đối chiếu sau mỗi tuần." },
    ],
    pitfalls: [
      "Đọc lướt chương 3–4 (page, tuple, snapshot) vì \"chỉ là chi tiết\" — vacuum, freezing, HOT và index-only scan về sau đều dựa vào xmin/xmax và visibility.",
      "Chỉnh tham số trên production ngay sau khi đọc — sách giải thích cơ chế, không phải công thức; đo trên lab trước.",
      "Bỏ Phần V vì \"chỉ dùng B-tree\" — GIN cho jsonb/full-text và BRIN cho bảng log lớn là chỗ nhiều hệ đang trả giá.",
    ],
    doneWhen: [
      "Giải thích được một bảng phình (bloat) bắt đầu từ transaction nào giữ horizon và vì sao autovacuum không dọn được.",
      "Đọc EXPLAIN (ANALYZE, BUFFERS) là nói được ước lượng lệch do thống kê nào và vì sao planner chọn join đó.",
      "Chọn đúng loại index (B-tree, GIN, GiST, BRIN…) cho một truy vấn mới và nêu được cái giá khi ghi.",
    ],
  },
```

- [ ] **Step 8: CHECK — phải xanh**

Expected: `57/57 bất biến đạt`. Nếu G1 báo thiếu khoá của `fieldGuides`, mở entry `ddia` so hình dạng rồi bổ sung đúng khoá thiếu. Nếu P1 báo lĩnh vực chưa thuộc con đường: kiểm Step 6.

- [ ] **Step 9: Commit**

```bash
git add webapp/scripts/check-data.mjs webapp/js/data/fields.js webapp/js/data/pg-internals/docs.js webapp/js/data/docs-index.js webapp/js/data/paths.js webapp/js/data/guides.js
git commit -m "feat(pg-internals): khai lĩnh vực, thư viện 31 tài liệu và chặng giữa của con đường Data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Khuôn bài học lộ trình (dùng cho Task 3 và Task 4)

Mỗi tuần có hình dạng y hệt `webapp/js/data/ddia/roadmap-part1.js` (đọc tuần `dd-w1` trước khi viết):

```js
{
  id: "pg-w1",
  week: "Tuần 1",
  title: "…",
  goal: "…",          // 1–2 câu: làm được gì sau tuần
  practice: "…",      // một thí nghiệm psql cụ thể
  resources: [
    { label: "PG 01 — Giới thiệu", href: "#/docs/pg-01" },
    { label: "PostgreSQL 14 Internals — bản PDF gốc", href: "https://postgrespro.com/community/books/internals" },
  ],
  items: [ { id: "pg-w1-1", text: "…", lesson: `…` }, /* đúng 4 mục */ ],
}
```

`lesson` là template literal có đúng 4 đoạn, theo thứ tự, mỗi đoạn bắt đầu bằng nhãn in đậm:

1. `**Mục tiêu.**` — làm được / giải thích được gì, cụ thể.
2. `**Đọc.**` — liệt kê mục theo dạng `[§N.M <tiêu đề mục nguyên văn phần tiếng Việt từ H2 bản dịch>](#/docs/pg-NN)`, nối bằng ` → `; thêm 1–2 câu chỉ đoạn nào đọc kỹ, thí nghiệm nào gõ lại. Với `pg-00`/`pg-30` (không đánh số) dùng `[Về cuốn sách này](#/docs/pg-00)` / `[Lời kết](#/docs/pg-30)`. Mục ôn tập có thể link chương nguyên (`[Chương 6 — Vacuum và Autovacuum](#/docs/pg-06)`) hoặc chương DDIA liên quan (`#/docs/ddia-08` — cùng con đường nên #3b cho phép).
3. `**Bẫy.**` — 1–2 hiểu lầm thực tế, mỗi cái kèm lý do theo sách.
4. `**Tự kiểm tra.**` — 2 câu hỏi trả lời được sau khi đọc, không trả lời hộ.

Backtick trong template literal phải escape (`\``). **Mẫu một mục đạt chuẩn** (kiểm lại từng chi tiết với `sources/pg-internals/04-snapshots.md` trước khi dùng):

```js
      {
        id: "pg-w3-1",
        text: "Snapshot và quy tắc visibility của row version",
        lesson: `**Mục tiêu.** Nhìn một snapshot \`xmin:xmax:xip_list\` và cặp \`xmin\`/\`xmax\` của một tuple là nói được tuple đó có hiện ra với transaction hay không, và giải thích vì sao Read Committed lấy snapshot mỗi câu lệnh còn Repeatable Read lấy một lần.

**Đọc.** [§4.1 Snapshot là gì?](#/docs/pg-04) → [§4.2 Khả năng nhìn thấy của row version](#/docs/pg-04) → [§4.3 Cấu trúc snapshot](#/docs/pg-04) → [§4.4 Khả năng nhìn thấy các thay đổi của chính transaction](#/docs/pg-04). Đọc kỹ hình minh hoạ các vùng transaction ID so với xmin/xmax của snapshot; mở hai phiên psql, gọi \`pg_current_snapshot()\` ở cả hai trong lúc một phiên đang giữ transaction mở.

**Bẫy.** Tưởng snapshot là bản sao dữ liệu. Sách cho thấy snapshot chỉ là vài con số transaction ID; dữ liệu "cũ" nằm ngay trong heap dưới dạng các row version khác. Bẫy thứ hai: nghĩ transaction luôn thấy mọi thay đổi của chính nó — con trỏ mở trước một lệnh sẽ không thấy thay đổi của lệnh đó (xem §4.4).

**Tự kiểm tra.** Một tuple có \`xmin\` nằm trong \`xip_list\` của snapshot thì có hiện ra không, vì sao? Vì sao hai lệnh SELECT giống hệt nhau trong một transaction Read Committed có thể trả khác nhau còn ở Repeatable Read thì không?`,
      },
```

**Script tự kiểm dùng ở Task 3 và 4** — lưu vào `$SCRATCH/pg-roadmap-lint.mjs` (không commit):

```js
// node pg-roadmap-lint.mjs <file.js> <exportName> <tuầnĐầu> <tuầnCuối>
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
const [file, name] = process.argv.slice(2);
const [from, to] = process.argv.slice(4).map(Number);
const weeks = (await import(pathToFileURL(file)))[name];
const SRC = "sources/pg-internals";
// Mục H2 có thật: "6" -> Set{"6.1","6.2",…}
const sections = new Map();
for (const f of readdirSync(SRC).filter((f) => /^\d\d-.*\.md$/.test(f))) {
  const n = String(+f.slice(0, 2));
  const set = new Set();
  for (const m of readFileSync(`${SRC}/${f}`, "utf8").matchAll(/^## (\d+\.\d+) /gm)) set.add(m[1]);
  sections.set(n, set);
}
// Doc pg được phép link trong từng tuần (tuần ôn tập được lùi về chương trước).
const ALLOWED = { 1: [0, 1], 2: [2, 3], 3: [4, 5, 6], 4: [2, 3, 4, 5, 6, 7, 8], 5: [9, 10], 6: [9, 10, 11],
  7: [12, 13, 14, 15], 8: [16, 17], 9: [18, 19, 20], 10: [21, 22, 23], 11: [24, 25, 26], 12: [24, 25, 26, 27, 28, 29, 30] };
const errs = [], seen = new Set();
if (weeks.length !== to - from + 1) errs.push(`số tuần ${weeks.length} ≠ ${to - from + 1}`);
weeks.forEach((w, i) => {
  const wn = from + i;
  if (w.id !== `pg-w${wn}`) errs.push(`${w.id} ≠ pg-w${wn}`);
  for (const k of ["week", "title", "goal", "practice"]) if (!w[k]) errs.push(`${w.id} thiếu ${k}`);
  if (!w.resources?.length) errs.push(`${w.id} thiếu resources`);
  if (w.items.length !== 4) errs.push(`${w.id} có ${w.items.length} mục ≠ 4`);
  w.items.forEach((it, j) => {
    if (it.id !== `pg-w${wn}-${j + 1}`) errs.push(`${it.id} ≠ pg-w${wn}-${j + 1}`);
    const parts = ["**Mục tiêu.**", "**Đọc.**", "**Bẫy.**", "**Tự kiểm tra.**"].map((p) => it.lesson.indexOf(p));
    if (parts.some((p) => p < 0) || parts.some((p, k) => k && p < parts[k - 1])) errs.push(`${it.id} sai khuôn 4 đoạn`);
    const links = [...it.lesson.matchAll(/\[([^\]]*)\]\(#\/docs\/pg-(\d\d)\)/g)];
    if (!links.length) errs.push(`${it.id} không link doc pg nào`);
    for (const [, label, nn] of links) {
      const n = +nn; seen.add(n);
      if (!ALLOWED[wn].includes(n)) errs.push(`${it.id}: link pg-${nn} ngoài phạm vi tuần ${wn}`);
      const sec = label.match(/^§(\d+)\.(\d+)/);
      if (sec) {
        if (+sec[1] !== n) errs.push(`${it.id}: §${sec[1]}.${sec[2]} trỏ pg-${nn}, đúng là pg-${sec[1].padStart(2, "0")}`);
        else if (!sections.get(String(n))?.has(`${sec[1]}.${sec[2]}`)) errs.push(`${it.id}: §${sec[1]}.${sec[2]} không có trong tệp nguồn`);
      }
    }
  });
});
console.log(`Doc pg được link: ${[...seen].sort((a, b) => a - b).join(",")}`);
console.log(errs.length ? errs.join("\n") : "OK");
process.exit(errs.length ? 1 : 0);
```

Chạy từ gốc repo (script đọc `sources/pg-internals/` theo đường dẫn tương đối).

---

### Task 3: Lộ trình phần 1 — Tuần 1–6 (tệp 00–11: mở đầu, Phần I, Phần II)

**Files:**
- Create: `webapp/js/data/pg-internals/roadmap-part1.js` (export `pgWeeksPart1`)

**Interfaces:**
- Consumes: doc id `pg-00`…`pg-11` (Task 2).
- Produces: `export const pgWeeksPart1` — mảng 6 tuần, 24 mục; Task 4 import nó.

- [ ] **Step 1: Tạo script lint trong scratchpad** (nội dung ở mục "Khuôn bài học" phía trên) và chạy trên tệp chưa tồn tại để thấy đỏ:

```bash
node $SCRATCH/pg-roadmap-lint.mjs webapp/js/data/pg-internals/roadmap-part1.js pgWeeksPart1 1 6
```

Expected: lỗi `Cannot find module`.

- [ ] **Step 2: Viết `roadmap-part1.js`** — đầu tệp:

```js
// Lộ trình đọc PostgreSQL 14 Internals — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "PostgreSQL 14 Internals" — Egor Rogov, Postgres Professional 2023.
// Thư mục nguồn: sources/pg-internals/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Link mục dạng [§N.M …](#/docs/pg-NN) — N luôn bằng số chương của doc.
// GIỮ NGUYÊN id (pg-w<N> / pg-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 12 tuần bám ranh giới Phần: T1 00–01 · T2 ch2–3 · T3 ch4–6 · T4 ch7–8 + ôn Phần I ·
// T5 ch9–10 · T6 ch11 + ôn Phần II · T7 ch12–15 · T8 ch16–17 · T9 ch18–20 · T10 ch21–23 ·
// T11 ch24–26 · T12 ch27–30 + tổng ôn. Tuần 4 và 6 nhẹ chữ — dành cho lab.

export const pgWeeksPart1 = [ /* 6 tuần */ ];
```

Nội dung bắt buộc (`title` tuần và `text` mục lấy đúng như bảng; mục `§` trong `**Đọc.**` phủ đúng dải ghi ở cột cuối):

| Tuần | `title` | Mục: `text` — mục đọc |
|---|---|---|
| pg-w1 | Nhìn tổng thể PostgreSQL | 1 "Cách đọc cuốn sách và dựng lab psql" — pg-00 (đọc kỹ "Quy ước") · 2 "Tổ chức dữ liệu: database, schema, relation, fork, page" — §1.1 · 3 "Process và bộ nhớ" — §1.2 · 4 "Client, giao thức client-server và tự đánh giá nền" — §1.3 |
| pg-w2 | Isolation và cách tuple được lưu | 1 "Consistency, anomaly và isolation level theo chuẩn SQL" — §2.1–§2.2 · 2 "Isolation level trong PostgreSQL và nên chọn mức nào" — §2.3–§2.4 · 3 "Cấu trúc page và bố cục row version" — §3.1–§3.2 · 4 "Thao tác trên tuple, index, TOAST, virtual transaction, subtransaction" — §3.3–§3.7 |
| pg-w3 | Snapshot, HOT và vacuum | 1 "Snapshot và quy tắc visibility của row version" — §4.1–§4.4 (mẫu ở trên) · 2 "Transaction horizon, snapshot của catalog, export snapshot" — §4.5–§4.7 · 3 "Page pruning và HOT update" — §5.1–§5.5 · 4 "Vacuum: horizon, các giai đoạn và analyze" — §6.1–§6.4 |
| pg-w4 | Autovacuum, freezing và rebuild | 1 "Autovacuum: khi nào chạy, quản lý tải, giám sát" — §6.5–§6.7 · 2 "Wraparound, đóng băng tuple và quản lý freezing" — §7.1–§7.4 · 3 "VACUUM FULL, các cách rebuild khác và phòng ngừa" — §8.1–§8.3 · 4 "Ôn Phần I: vòng đời một row version" — link chương pg-02…pg-08 và `ddia-08` |
| pg-w5 | Buffer cache và WAL | 1 "Thiết kế buffer cache, cache hit và cache miss" — §9.1–§9.4 · 2 "Bulk eviction, chọn kích thước, làm nóng cache, cache cục bộ" — §9.5–§9.8 · 3 "Ghi nhật ký và cấu trúc WAL" — §10.1–§10.2 · 4 "Checkpoint, khôi phục, ghi nền và thiết lập WAL" — §10.3–§10.6 |
| pg-w6 | Các chế độ WAL | 1 "Hiệu năng ghi WAL" — §11.1 · 2 "Khả năng chịu lỗi" — §11.2 · 3 "Các mức WAL và lab đọc WAL" — §11.3 · 4 "Ôn Phần II: từ UPDATE tới trang trên đĩa" — link chương pg-09…pg-11 và `ddia-04` |

Lưu ý tuần 3/4: spec §4.5 ghi tuần 3 = tệp 04–06 và tuần 4 = 07–08; plan dời §6.5–§6.7 (autovacuum) sang tuần 4 để cân chữ (T3 ≈ 11k, T4 ≈ 9k thay vì 14,4k / 6,5k) — vẫn đúng quy tắc "dời ranh giới mục" của spec. `ALLOWED` trong lint đã cho tuần 4 link pg-06.

Mục ôn tập (`pg-w4-4`, `pg-w6-4`) vẫn đủ 4 đoạn: Mục tiêu (tự vẽ sơ đồ một trang), Đọc (lướt lại H2 các chương + chương DDIA tương ứng), Bẫy, Tự kiểm tra.

`practice` mỗi tuần (viết thành 2–3 câu cụ thể):
- T1: dựng PostgreSQL 14+ (Docker `postgres:14` trở lên), tạo database lab, `CREATE EXTENSION pageinspect;`; tìm tệp dữ liệu của một bảng bằng `pg_relation_filepath` và liệt kê các fork trên đĩa.
- T2: mở hai phiên psql, tái hiện lost update ở Read Committed rồi thấy Repeatable Read báo lỗi serialization; dùng `pageinspect` (`heap_page_items`) xem xmin/xmax của một dòng trước và sau UPDATE.
- T3: giữ một transaction Repeatable Read mở ở phiên A, UPDATE nhiều lần ở phiên B, chạy `VACUUM VERBOSE` và thấy tuple chết không bị dọn; commit phiên A rồi vacuum lại.
- T4: dùng `age(relfrozenxid)` theo dõi tuổi bảng, chạy `VACUUM FREEZE` và xem cờ frozen qua `pageinspect`; so kích thước bảng trước/sau `VACUUM FULL`.
- T5: `CREATE EXTENSION pg_buffercache;` xem buffer của một bảng sau một lần seq scan; so `pg_current_wal_lsn()` trước/sau một UPDATE để đo lượng WAL.
- T6: chạy `pg_waldump` trên segment WAL vừa sinh; so thời gian một vòng INSERT với `synchronous_commit = on` và `off`.

- [ ] **Step 3: Chạy lint — phải OK và phủ doc 0–11**

```bash
node $SCRATCH/pg-roadmap-lint.mjs webapp/js/data/pg-internals/roadmap-part1.js pgWeeksPart1 1 6
```

Expected: `Doc pg được link: 0,1,2,3,4,5,6,7,8,9,10,11` và `OK`.

- [ ] **Step 4: Cú pháp hợp lệ + CHECK vẫn xanh**

```bash
node -e "import('./webapp/js/data/pg-internals/roadmap-part1.js').then(m=>console.log(m.pgWeeksPart1.length))"
```

Expected: in `6`; rồi CHECK in `57/57`.

- [ ] **Step 5: Commit**

```bash
git add webapp/js/data/pg-internals/roadmap-part1.js
git commit -m "feat(pg-internals): lộ trình tuần 1–6 — mở đầu, MVCC, buffer cache và WAL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lộ trình phần 2 — Tuần 7–12 (tệp 12–30) + đăng ký track

**Files:**
- Create: `webapp/js/data/pg-internals/roadmap-part2.js` (export `pgWeeksPart2`)
- Modify: `webapp/scripts/check-data.mjs` (`EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js` (comment đầu tệp, import, mảng `tracks` — chèn track `pg` ngay sau object track `id: "ddia"`)
- Modify: `webapp/js/data/fields.js` (thêm module `"roadmap"`)
- Modify: `webapp/js/data/guides.js` (`trackGuides.pg`, `trackGuides.ddia.after`, hai bước `pg-2`/`pg-3`)

**Interfaces:**
- Consumes: `pgWeeksPart1` (Task 3).
- Produces: track `{ id: "pg", field: "pg-internals" }`, route `#/roadmap/pg`.

- [ ] **Step 1: Viết `roadmap-part2.js`** — cùng khuôn, đầu tệp như part1 nhưng "Phần 2 (Tuần 7–12)", `export const pgWeeksPart2 = [...]`.

| Tuần | `title` | Mục: `text` — mục đọc |
|---|---|---|
| pg-w7 | Lock | 1 "Heavyweight lock, lock trên transaction ID và lock mức relation" — §12.1–§12.5 · 2 "Lock mức dòng: mode, multitransaction, hàng đợi, NOWAIT, deadlock" — §13.1–§13.6 · 3 "Lock khác: mở rộng relation, trang, advisory, predicate" — §14.1–§14.5 · 4 "Spinlock, lightweight lock và giám sát chờ" — §15.1–§15.5 |
| pg-w8 | Từ câu lệnh tới plan | 1 "Database demo và simple query protocol" — §16.1–§16.2 · 2 "Extended query protocol: prepared statement, generic và custom plan" — §16.3 · 3 "Thống kê cơ bản, NULL, distinct, most common values" — §17.1–§17.4 · 4 "Histogram, correlation, thống kê biểu thức và đa biến" — §17.5–§17.10 |
| pg-w9 | Truy cập bảng và index | 1 "Sequential scan, chi phí và thực thi song song" — §18.1–§18.5 · 2 "Index access method và operator class" — §19.1–§19.3 · 3 "Index scan và index-only scan" — §20.1–§20.2 · 4 "Bitmap scan, parallel index scan và so sánh phương thức truy cập" — §20.3–§20.5 |
| pg-w10 | Ba phương pháp join | 1 "Kiểu join và nested loop" — §21.1–§21.2 · 2 "Hash join và gom nhóm bằng hash" — §22.1–§22.2 · 3 "Merge join và sắp xếp" — §23.1–§23.2 · 4 "Gom nhóm bằng sort và so sánh các phương pháp join" — §23.3–§23.4 |
| pg-w11 | Hash, B-tree, GiST | 1 "Hash index" — §24.1–§24.4 · 2 "B-tree: tìm kiếm, chèn, bố cục page, thuộc tính" — §25.1–§25.5 · 3 "GiST: tổng quan và R-tree cho điểm" — §26.1–§26.2 · 4 "GiST: RD-tree cho tìm kiếm toàn văn và các kiểu khác" — §26.3–§26.4 |
| pg-w12 | SP-GiST, GIN, BRIN và tổng ôn | 1 "SP-GiST: quadtree, k-d tree, radix tree" — §27.1–§27.5 · 2 "GIN: toàn văn, trigram, mảng, JSON" — §28.1–§28.6 · 3 "BRIN và bốn họ operator class" — §29.1–§29.9 · 4 "Lời kết và tổng ôn: chọn index cho một bài toán" — `[Lời kết](#/docs/pg-30)` + link chương pg-24…pg-29 |

Mục `pg-w12-4` vẫn đủ 4 đoạn: Mục tiêu (tự lập bảng một trang: loại index × toán tử hỗ trợ × kiểu dữ liệu × cái giá khi ghi), Đọc (Lời kết + mục "Thuộc tính"/"Tổng quan" của từng chương index), Bẫy (mặc định B-tree cho mọi thứ; tạo GIN trên bảng ghi nhiều mà không đo), Tự kiểm tra (chọn index cho: tìm `jsonb @>`, log append-only 1 tỷ dòng lọc theo thời gian, ràng buộc lịch phòng không chồng lấn).

`practice`:
- T7: phiên A `BEGIN; SELECT … ` giữ transaction; phiên B `ALTER TABLE … ADD COLUMN`; phiên C một `SELECT` bình thường — quan sát C bị chặn qua `pg_locks` và `pg_blocking_pids()`; lặp lại với `SET lock_timeout = '2s'`.
- T8: `PREPARE` một truy vấn, chạy 6 lần và xem `EXPLAIN EXECUTE` chuyển sang generic plan; xem `pg_stats` của một cột lệch phân phối, tạo `CREATE STATISTICS` cho hai cột tương quan và so ước lượng trước/sau.
- T9: trên bảng 1 triệu dòng, ép từng phương thức (`SET enable_seqscan/enable_indexscan/enable_bitmapscan = off`) và so chi phí ước lượng với thời gian thật; `VACUUM` rồi xem `Heap Fetches` của index-only scan về 0.
- T10: cùng một join, ép lần lượt nested loop / hash / merge; hạ `work_mem` để thấy hash join chia batch và sort chuyển sang `external merge Disk`.
- T11: so kích thước và tốc độ tra `=` giữa hash index và B-tree trên cùng cột; tạo GiST trên cột `point`, chạy truy vấn k-NN `ORDER BY p <-> point(…)`.
- T12: tạo GIN trên cột `jsonb` và `tsvector`, so `jsonb_ops` với `jsonb_path_ops`; tạo BRIN trên bảng log chèn theo thời gian, xem `pages_per_range` ảnh hưởng số trang đọc.

- [ ] **Step 2: Lint part2**

```bash
node $SCRATCH/pg-roadmap-lint.mjs webapp/js/data/pg-internals/roadmap-part2.js pgWeeksPart2 7 12
```

Expected: `Doc pg được link: 12,13,…,30` (đủ 19 số liên tiếp) và `OK`. Part1 + part2 phủ đủ 0–30.

- [ ] **Step 3: Thêm kỳ vọng roadmap trước (đỏ)** — dưới `"docs:pg-internals": 31,`:

```js
    "roadmap-items:pg-internals": 48,
```

- [ ] **Step 4: CHECK — phải đỏ**

Expected: FAIL "Số lượng bản ghi khớp bảng kỳ vọng" (roadmap-items:pg-internals 0 ≠ 48).

- [ ] **Step 5: Đăng ký track trong `roadmap.js`**

Import (ngay sau hai dòng import `ddia`):

```js
import { pgWeeksPart1 } from "./pg-internals/roadmap-part1.js";
import { pgWeeksPart2 } from "./pg-internals/roadmap-part2.js";
```

Track (chèn ngay sau object track `id: "ddia"`):

```js
  {
    id: "pg",
    field: "pg-internals",
    label: "PG Internals",
    icon: "🐘",
    name: "Đọc PostgreSQL 14 Internals",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám năm Phần của sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một thí nghiệm trên psql.",
    prereq: "Yêu cầu: đã dùng PostgreSQL, viết được SQL có JOIN, biết transaction là gì; nên xong DDIA chương 4 và 8. Cần PostgreSQL 14+ chạy local với extension pageinspect.",
    weeks: [...pgWeeksPart1, ...pgWeeksPart2],
  },
```

Comment đầu tệp: thêm "đọc sách PostgreSQL 14 Internals," sau "đọc sách Designing Data-Intensive Applications,"; thêm dòng bảng `//   pg-internals/roadmap-part{1,2}.js       (Tuần 1–6 / 7–12)       — 48 mục` ngay sau dòng `ddia/…`; thêm `pg-w1` sau `dd-w1` trong danh sách id tuần và `pg-w1-1` sau `dd-w1-1` trong danh sách id mục.

- [ ] **Step 6: Bật module** — `fields.js`: `modules: ["dashboard", "guide", "docs", "roadmap"]`, sửa comment thành chỉ còn "interview" bật ở Task 6.

- [ ] **Step 7: `trackGuides.pg`** trong `guides.js` (chèn ngay sau `trackGuides.ddia`):

```js
  pg: {
    rhythm: "12 tuần, 4 mục mỗi tuần bám năm Phần của sách; mỗi tuần một thí nghiệm psql. Đọc (40–60 phút) → gõ lại lệnh của sách trên lab → so output → trả lời tự kiểm tra → tick.",
    before: ["PostgreSQL 14+ chạy local hoặc Docker; tạo được extension `pageinspect` và `pg_buffercache`.", "Xong DDIA chương 4 và 8, hoặc tự tin với index B-tree và isolation level ở mức người dùng.", "Mở sẵn hai cửa sổ psql — chương isolation, snapshot và lock cần xen kẽ lệnh giữa hai phiên."],
    during: ["Mọi câu lệnh có output trong sách: gõ lại và so với output của bạn.", "Tuần 4 và 6 nhẹ chữ: dùng thời gian dư cho lab `pageinspect` và `pg_waldump`, đừng đọc vượt.", "Tuần 9–10 (scan và join): mỗi phương thức ép bằng `enable_*` một lần để thấy chi phí planner tính."],
    after: ["Một trang giải thích EXPLAIN (ANALYZE, BUFFERS) của một query chậm thật.", "Nếu đang theo Lộ trình Senior Java giai đoạn 1: quay lại tuần 21–22 (index và EXPLAIN) với nền vừa có.", "Sang lĩnh vực Kafka: The Definitive Guide — chặng tiếp theo trên con đường Data."],
  },
```

Đồng thời sửa `trackGuides.ddia.after`: phần tử cuối `"Đọc Kafka: The Definitive Guide chương 5–6 và 14 với nền vừa có."` giữ nguyên, **chèn trước nó** `"Sang lĩnh vực PostgreSQL 14 Internals — chặng tiếp theo trên con đường Data, nơi isolation, lưu trữ và index của DDIA được xem trong một CSDL thật."`.

- [ ] **Step 7b: Thêm hai bước track vào `fieldGuides["pg-internals"].steps`** — thay dòng comment `// pg-2, pg-3 …` bằng:

```js
      { id: "pg-2", title: "Tuần 1–6: mở đầu, isolation và MVCC, vacuum, freezing, buffer cache, WAL", desc: "Nửa đầu là cách PostgreSQL lưu và bảo vệ dữ liệu. Mỗi tuần một thí nghiệm psql — làm trước khi tick.", href: "#/roadmap/pg", done: { kind: "track", id: "pg", pct: 50 } },
      { id: "pg-3", title: "Tuần 7–12: lock, planner, thống kê, scan, join và sáu loại index", desc: "Nửa sau là cách truy vấn chạy và được tăng tốc. Tuần 12 có mục tổng ôn chọn index.", href: "#/roadmap/pg", done: { kind: "track", id: "pg" } },
```

- [ ] **Step 8: CHECK — phải xanh**

Expected: `57/57 bất biến đạt`. Nếu #3b báo link lạc đường: mọi link trong lộ trình PG phải là `#/docs/pg-*`, `#/docs/ddia-*` hoặc `#/docs/kafka-*`.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/pg-internals/roadmap-part2.js webapp/scripts/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/guides.js
git commit -m "feat(pg-internals): lộ trình tuần 7–12 và bật track pg — 12 tuần / 48 mục, đủ 31 tài liệu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Khuôn câu hỏi phỏng vấn (dùng cho Task 5 và Task 6)

Hình dạng y hệt `webapp/js/data/ddia/interview.js` (đọc hết câu `ddia-iq01`…`ddia-iq04` trước khi viết). Khoá của mỗi câu:

| Khoá | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| `id`, `field: "pg-internals"`, `topic`, `level`, `minutes`, `question`, `mustCover` (≥3, không trùng), `model` (đoạn trả lời mẫu ngôi thứ nhất), `redFlags` (≥1), `probes` (≥1), `refs` (doc id `pg-*`) | ✓ | ✓ | ✓ | ✓ |
| `code: { lang: "sql", text: \`…\` }` (psql/SQL/EXPLAIN output) | **cấm** | **bắt buộc** | tuỳ chọn | tuỳ chọn |
| `tradeoffs: [{ option, when }, …]` (≥2) | **cấm** | tuỳ chọn | **bắt buộc** | tuỳ chọn |
| `incident: { symptom, scale, constraints }` | **cấm** | **cấm** | tuỳ chọn | **bắt buộc** |
| `minutes` | 3–6 | 4–10 | 5–12 | 8–20 |

Kiểm `lang` hợp lệ: `grep -rhn 'lang: "' webapp/js/data/*/interview.js | sort | uniq -c` — nếu chưa lĩnh vực nào dùng `"sql"`, mở view phỏng vấn (`webapp/js/views/`) kiểm highlighter có chấp nhận ngôn ngữ tuỳ ý không; không chấp nhận thì dùng `"text"`.

IQ7: không câu nào trong `mustCover` (≥12 ký tự) được xuất hiện nguyên văn trong `question`.
Mỗi chủ đề: 4 câu liên tiếp, level 1→2→3→4. Nội dung đáp án phải khớp sách — đọc chương trong `refs` trước khi viết; chi tiết nào trong "Trọng tâm đề" không có trong sách thì thay bằng tình huống tương đương **có** trong cùng chương và ghi chú lý do trong commit.

Script tự kiểm — `$SCRATCH/pg-iq-lint.mjs` (không commit):

```js
// node pg-iq-lint.mjs <file.js> <exportName> <idĐầu> <idCuối>
import { pathToFileURL } from "node:url";
const [file, name, a, b] = process.argv.slice(2);
const qs = (await import(pathToFileURL(file)))[name];
const RANGE = { 1: [3, 6], 2: [4, 10], 3: [5, 12], 4: [8, 20] };
const errs = [];
if (qs.length !== b - a + 1) errs.push(`số câu ${qs.length} ≠ ${b - a + 1}`);
qs.forEach((q, i) => {
  const want = `pg-iq${String(+a + i).padStart(2, "0")}`;
  if (q.id !== want) errs.push(`${q.id} ≠ ${want}`);
  if (q.field !== "pg-internals") errs.push(`${q.id} field sai`);
  if (q.level !== (i % 4) + 1) errs.push(`${q.id} level ${q.level} ≠ ${(i % 4) + 1}`);
  const [lo, hi] = RANGE[q.level] ?? [0, -1];
  if (q.minutes < lo || q.minutes > hi) errs.push(`${q.id} minutes ${q.minutes} ngoài ${lo}–${hi}`);
  if (q.level === 1 && ("code" in q || "tradeoffs" in q || "incident" in q)) errs.push(`${q.id} L1 có artifact`);
  if (q.level === 2 && (!q.code || "incident" in q)) errs.push(`${q.id} L2 sai artifact`);
  if (q.level === 3 && !(q.tradeoffs?.length >= 2)) errs.push(`${q.id} L3 thiếu tradeoffs`);
  if (q.level === 4 && !["symptom", "scale", "constraints"].every((k) => q.incident?.[k])) errs.push(`${q.id} L4 thiếu incident`);
  if (!(q.mustCover?.length >= 3)) errs.push(`${q.id} mustCover < 3`);
  if (!(q.redFlags?.length >= 1) || !(q.probes?.length >= 1)) errs.push(`${q.id} thiếu redFlags/probes`);
  for (const m of q.mustCover ?? []) if (m.length >= 12 && q.question.includes(m)) errs.push(`${q.id} đề lộ rubric`);
  if (!q.refs?.length || q.refs.some((r) => !/^pg-(0\d|1\d|2\d|30)$/.test(r))) errs.push(`${q.id} refs sai`);
});
console.log(errs.length ? errs.join("\n") : "OK");
process.exit(errs.length ? 1 : 0);
```

---

### Task 5: Phỏng vấn phần 1 — 12 câu, chủ đề `pg-mvcc`, `pg-vacuum`, `pg-wal`

**Files:**
- Create: `webapp/js/data/pg-internals/interview-part1.js` (export `pgInterviewPart1`) — tạm thời, Task 6 gộp vào `interview.js`

**Interfaces:**
- Produces: `pgInterviewPart1` — 12 câu `pg-iq01`…`pg-iq12`.

- [ ] **Step 1: Lint trên tệp chưa có — đỏ**

```bash
node $SCRATCH/pg-iq-lint.mjs webapp/js/data/pg-internals/interview-part1.js pgInterviewPart1 1 12
```

Expected: `Cannot find module`.

- [ ] **Step 2: Viết 12 câu.** Đề bài và trọng tâm từng câu:

| id | topic | L | Trọng tâm đề (viết lại thành câu hỏi phỏng vấn tự nhiên) | refs |
|---|---|---|---|---|
| pg-iq01 | pg-mvcc | 1 | Các isolation level của PostgreSQL so với chuẩn SQL: anomaly nào bị chặn ở mức nào, vì sao Read Uncommitted thực chất là Read Committed, Repeatable Read chặn cả phantom | pg-02 |
| pg-iq02 | pg-mvcc | 2 | `code`: hai phiên psql xen kẽ `UPDATE accounts SET amount = amount - 100` / đọc-rồi-ghi ở Read Committed dẫn tới lost update — dự đoán kết quả, rồi sửa bằng Repeatable Read + retry hoặc `SELECT … FOR UPDATE` | pg-02 |
| pg-iq03 | pg-mvcc | 3 | `tradeoffs`: Read Committed vs Repeatable Read vs Serializable cho hệ đặt chỗ có ràng buộc liên dòng (write skew) — chi phí retry, predicate lock, false positive | pg-02, pg-04 |
| pg-iq04 | pg-mvcc | 4 | `incident`: một phiên `idle in transaction` (hoặc report Repeatable Read chạy nhiều giờ) giữ snapshot → horizon không tiến, bảng hot phình, autovacuum chạy liên tục mà `n_dead_tup` không giảm | pg-04, pg-06 |
| pg-iq05 | pg-vacuum | 1 | HOT update là gì, điều kiện để một UPDATE được HOT (không đổi cột có index, còn chỗ trong cùng page), vai trò của `fillfactor` | pg-05 |
| pg-iq06 | pg-vacuum | 2 | `code`: output `pg_stat_user_tables` (`n_live_tup`, `n_dead_tup`, `last_autovacuum`) + cấu hình autovacuum mặc định — tính ngưỡng kích hoạt (`threshold + scale_factor × reltuples`) và đề xuất đặt tham số riêng cho bảng | pg-06 |
| pg-iq07 | pg-vacuum | 3 | `tradeoffs`: bảng 200 GB phình 60%: `VACUUM FULL` vs `pg_repack` vs chỉnh autovacuum/`fillfactor` rồi chờ — lock, dung lượng tạm, downtime (chỉ nêu công cụ ngoài nếu chương 8 có nhắc) | pg-08, pg-06 |
| pg-iq08 | pg-vacuum | 4 | `incident`: log cảnh báo "database must be vacuumed within N transactions" / tuổi `relfrozenxid` tiến gần giới hạn wraparound trên một bảng lớn ít cập nhật | pg-07 |
| pg-iq09 | pg-wal | 1 | Vì sao cần WAL, quy tắc ghi WAL trước page dữ liệu, checkpoint làm gì và recovery bắt đầu từ đâu | pg-10 |
| pg-iq10 | pg-wal | 2 | `code`: đo lượng WAL của một UPDATE bằng `pg_current_wal_lsn()` + `pg_wal_lsn_diff`, lần đầu sau checkpoint lớn hơn hẳn các lần sau — giải thích bằng full page image | pg-10, pg-11 |
| pg-iq11 | pg-wal | 3 | `tradeoffs`: `synchronous_commit` on/off, `fsync`, `full_page_writes` — cái gì mất khi crash ở từng lựa chọn, cái gì được về độ trễ | pg-11 |
| pg-iq12 | pg-wal | 4 | `incident`: độ trễ ghi tăng vọt theo chu kỳ vài phút, I/O bão hoà; log "checkpoints are occurring too frequently" — `max_wal_size` quá nhỏ, checkpoint dồn dập, full page image tăng | pg-10, pg-09 |

Đầu tệp:

```js
// Ngân hàng câu hỏi phỏng vấn PostgreSQL 14 Internals — phần 1 (pg-iq01–pg-iq12).
// Gộp vào interview.js ở Task 6. Hợp đồng theo cấp giống hệt ngân hàng DDIA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)

export const pgInterviewPart1 = [
  // ===== pg-mvcc (pg-iq01–pg-iq04) =====
  // …
];
```

- [ ] **Step 3: Lint — OK**

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add webapp/js/data/pg-internals/interview-part1.js
git commit -m "feat(pg-internals): 12 câu phỏng vấn — MVCC, vacuum & freezing, WAL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Phỏng vấn phần 2 — 12 câu còn lại + đăng ký module interview

**Files:**
- Create: `webapp/js/data/pg-internals/interview.js` (export `pgInternalsInterview`, gộp part1 + 12 câu mới)
- Delete: `webapp/js/data/pg-internals/interview-part1.js`
- Modify: `webapp/js/data/meta.js` (`INTERVIEW_TOPICS`, chèn sau khối chủ đề `ddia-*` — tìm bằng `grep -n 'field: "ddia"' webapp/js/data/meta.js`)
- Modify: `webapp/js/data/index.js`
- Modify: `webapp/js/data/fields.js` (thêm `"interview"`, xoá comment "mở dần")
- Modify: `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `pgInterviewPart1` (Task 5).
- Produces: `pgInternalsInterview` — 24 câu.

- [ ] **Step 1: Kỳ vọng trước (đỏ)** — dưới `"roadmap-items:pg-internals": 48,`: `"interview:pg-internals": 24,`. CHECK → FAIL ở số lượng (0 ≠ 24).

- [ ] **Step 2: Chủ đề trong `meta.js` `INTERVIEW_TOPICS`** (căn cột theo khối xung quanh):

```js
  "pg-mvcc":   { label: "Isolation, MVCC và snapshot",          short: "MVCC",       field: "pg-internals" },
  "pg-vacuum": { label: "Pruning, HOT, vacuum và freezing",     short: "Vacuum",     field: "pg-internals" },
  "pg-wal":    { label: "Buffer cache và WAL",                  short: "WAL",        field: "pg-internals" },
  "pg-lock":   { label: "Lock",                                 short: "Lock",       field: "pg-internals" },
  "pg-plan":   { label: "Planner, thống kê, scan và join",      short: "Planner",    field: "pg-internals" },
  "pg-index":  { label: "Các loại index",                       short: "Index",      field: "pg-internals" },
```

- [ ] **Step 3: Viết `interview.js`** — chép nguyên mảng của part1 vào đầu, rồi 12 câu mới:

| id | topic | L | Trọng tâm đề | refs |
|---|---|---|---|---|
| pg-iq13 | pg-lock | 1 | Lock mức relation: vì sao `SELECT` không chặn `UPDATE` nhưng `ALTER TABLE` chặn tất cả; nêu vài mode và ví dụ lệnh lấy chúng | pg-12 |
| pg-iq14 | pg-lock | 2 | `code`: hai phiên — một `UPDATE` dòng cha, một `INSERT` dòng con có foreign key — đọc output `pg_locks`; giải thích vì sao `FOR NO KEY UPDATE`/`FOR KEY SHARE` làm hai phiên không chặn nhau | pg-13 |
| pg-iq15 | pg-lock | 3 | `tradeoffs`: hàng đợi job trong bảng: `SELECT … FOR UPDATE` vs `FOR UPDATE SKIP LOCKED` vs advisory lock vs Serializable | pg-13, pg-14 |
| pg-iq16 | pg-lock | 4 | `incident`: migration `ALTER TABLE ADD COLUMN` chạy giờ cao điểm, đứng sau một query dài; mọi truy vấn mới xếp hàng sau nó → cạn connection pool, sập dịch vụ vài phút | pg-12 |
| pg-iq17 | pg-plan | 1 | Các giai đoạn parse → rewrite → plan → execute; prepared statement và khi nào chuyển từ custom plan sang generic plan | pg-16 |
| pg-iq18 | pg-plan | 2 | `code`: output `EXPLAIN (ANALYZE, BUFFERS)` với `rows=1` ước lượng vs `rows=48000` thực tế, planner chọn nested loop — chẩn đoán do hai cột tương quan, sửa bằng `CREATE STATISTICS` rồi `ANALYZE` | pg-17, pg-21 |
| pg-iq19 | pg-plan | 3 | `tradeoffs`: nested loop vs hash join vs merge join — kích thước đầu vào, bộ nhớ, có sẵn thứ tự, điều kiện join không phải đẳng thức | pg-21, pg-22, pg-23 |
| pg-iq20 | pg-plan | 4 | `incident`: report cuối tháng chậm gấp 20 lần; EXPLAIN thấy `Sort Method: external merge Disk` và hash join nhiều batch; đội đề xuất tăng `work_mem` toàn cục | pg-22, pg-23 |
| pg-iq21 | pg-index | 1 | Cấu trúc B-tree và toán tử nó hỗ trợ; vì sao `WHERE lower(email) = …` hay `LIKE '%abc'` không dùng được index thường | pg-25, pg-19 |
| pg-iq22 | pg-index | 2 | `code`: index `(a, b)` và bốn truy vấn — cái nào dùng index scan, index-only scan, bitmap, seq scan; vì sao index-only scan vẫn có `Heap Fetches` và visibility map liên quan thế nào | pg-20, pg-25 |
| pg-iq23 | pg-index | 3 | `tradeoffs`: B-tree vs GIN vs GiST vs BRIN cho: `jsonb @>`, tìm kiếm toàn văn, log append-only lọc theo thời gian, ràng buộc khoảng thời gian không chồng lấn | pg-26, pg-28, pg-29 |
| pg-iq24 | pg-index | 4 | `incident`: bảng có GIN index cho tìm kiếm toàn văn; độ trễ ghi thỉnh thoảng nhảy vọt và vài truy vấn đọc chậm bất thường — pending list (`fastupdate`, `gin_pending_list_limit`) được dọn đồng bộ. Nếu chương 28 không có pending list thì thay bằng sự cố BRIN mất hiệu quả khi dữ liệu không còn tương quan vật lý (chương 29) | pg-28 |

Đầu tệp:

```js
// Ngân hàng câu hỏi phỏng vấn PostgreSQL 14 Internals — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
//
// Nguồn: bản dịch tiếng Việt PostgreSQL 14 Internals (Egor Rogov, Postgres Professional 2023)
// — 31 tài liệu trong sources/pg-internals/.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng DDIA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (pg-iq01–pg-iq24) — tiến độ localStorage lưu theo id này.

export const pgInternalsInterview = [ /* 24 câu */ ];
```

Rồi `git rm webapp/js/data/pg-internals/interview-part1.js`.

- [ ] **Step 4: Lint 24 câu**

```bash
node $SCRATCH/pg-iq-lint.mjs webapp/js/data/pg-internals/interview.js pgInternalsInterview 1 24
```

Expected: `OK`.

- [ ] **Step 5: Đăng ký** — `index.js`: `import { pgInternalsInterview } from "./pg-internals/interview.js";` (ngay sau import `ddia`), và thêm `...pgInternalsInterview` vào `allInterviews` ngay sau `...ddiaInterview`. `fields.js`: `modules: ["dashboard", "guide", "docs", "roadmap", "interview"]`, xoá dòng comment "Mở dần…".

- [ ] **Step 6: CHECK — phải xanh**

Expected: `57/57 bất biến đạt` (IQ1–IQ8 xanh).

- [ ] **Step 7: Commit**

```bash
git add -A webapp/js/data/pg-internals webapp/js/data/meta.js webapp/js/data/index.js webapp/js/data/fields.js webapp/scripts/check-data.mjs
git commit -m "feat(pg-internals): 24 câu phỏng vấn theo 4 cấp năng lực

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Liên kết chéo, nối Senior Java, cập nhật README

**Files:**
- Modify: `webapp/js/data/related.js`
- Modify: `webapp/js/data/senior-java/roadmap-gd1.js` (mục `sj-gd1-w11-1`, `-2`, `-3`, dòng ~536–552)
- Modify: `webapp/js/data/guides.js` (`fieldGuides.ddia.method`)
- Modify: `README.md`, `webapp/README.md`

- [ ] **Step 1: Xác minh từng cặp liên kết chéo bằng nội dung** — với mỗi ứng viên, mở cả hai chương, tìm đoạn nói cùng một cơ chế; chỉ giữ cặp tìm được:

```bash
grep -n -i "snapshot isolation\|postgres" sources/ddia/08-transaction.md | head -20
grep -n -i "b-tree\|write-ahead\|WAL" sources/ddia/04-luu-tru-va-truy-xuat.md | head -20
grep -n -i "WAL\|log shipping\|postgres" sources/ddia/06-replication.md | head -20
grep -n -i "lost update\|FOR UPDATE\|isolation" sources/jpa/*.md | head -20
```

Ứng viên (spec §4.8): `ddia-08` ↔ `pg-02`, `pg-04` · `ddia-04` ↔ `pg-25`, `pg-10` · `ddia-06` ↔ `pg-11` · `jpa-11` ↔ `pg-02`, `pg-13`. Xác định đúng doc id của chương JPA về transaction/lock trong `webapp/js/data/jpa/docs.js` (spec giả định `jpa-11`).

- [ ] **Step 2: `related.js`** — thêm khối trước dấu `};` cuối, chỉ gồm cặp đã xác minh ở Step 1 (bảng một chiều; key là doc PG):

```js
  // ---- PostgreSQL 14 Internals ↔ DDIA (isolation, lưu trữ, replication), JPA (lock, transaction) ----
  "pg-02": ["ddia-08", "jpa-11"],     // isolation level trong PG ↔ lý thuyết isolation; transaction/lost update trong JPA
  "pg-04": ["ddia-08"],               // snapshot trong PG ↔ snapshot isolation (DDIA ch.8 trích dẫn chính sách này)
  "pg-10": ["ddia-04"],               // WAL ↔ write-ahead log trong B-tree
  "pg-11": ["ddia-06"],               // wal_level & WAL ↔ replication dựa trên log
  "pg-13": ["jpa-11"],                // row-level lock ↔ pessimistic lock (SELECT … FOR UPDATE)
  "pg-25": ["ddia-04"],               // B-tree cài đặt thật ↔ B-tree trong lý thuyết lưu trữ
```

Nếu `related` đã có key `ddia-08`/`ddia-04`/`jpa-11` trỏ sang nhau, vẫn thêm dưới key `pg-*` — R1 chặn lặp theo cặp; nếu R1 báo lặp thì bỏ cặp lặp.

- [ ] **Step 3: Nối bài học Senior Java giai đoạn 1** (`senior-java/roadmap-gd1.js`, giữ nguyên id mục; chỉ sửa chuỗi — mở bằng Read trước khi Edit, số dòng có thể lệch):
  - `sj-gd1-w11-1` lesson: `covering index. Nguồn: use-the-index-luke.com` → `covering index; đọc sâu cấu trúc B-tree ở [PostgreSQL 14 Internals chương 25](#/docs/pg-25). Nguồn: use-the-index-luke.com`.
  - `sj-gd1-w11-2` lesson: sau câu kết thúc bằng `là cờ đỏ).` thêm ` Muốn hiểu vì sao planner chọn plan đó: [chương 16](#/docs/pg-16) (các giai đoạn thực thi), [chương 17](#/docs/pg-17) (thống kê) và [chương 20](#/docs/pg-20) (index scan) của PostgreSQL 14 Internals.`
  - `sj-gd1-w11-3` lesson: đọc hết đoạn; ngay trước `\n\n**Nguồn.**` thêm câu ` Vì sao index thường không phục vụ được biểu thức và leading wildcard: [PostgreSQL 14 Internals chương 19](#/docs/pg-19) (operator class).` — chỉ thêm nếu chương 19 thực sự giải thích operator class quyết định toán tử index dùng được (đọc §19.2).

- [ ] **Step 4: Guide DDIA** — `fieldGuides.ddia.method`, mục "Gắn vào hệ của bạn": `"Tra tài liệu Postgres/MySQL/Kafka để đối chiếu."` → `"Đối chiếu với lĩnh vực PostgreSQL 14 Internals (chặng tiếp theo) hoặc tài liệu MySQL/Kafka."`.

- [ ] **Step 5: CHECK — xanh** (R1 kiểm id thật, khác lĩnh vực; #3b cho phép link từ trục Senior Java).

- [ ] **Step 6: Tính số liệu mới rồi cập nhật README**

```bash
node --input-type=module -e '
const {docs}=await import("./webapp/js/data/docs-index.js");
const {tracks}=await import("./webapp/js/data/roadmap.js");
const {allInterviews}=await import("./webapp/js/data/index.js");
const {related}=await import("./webapp/js/data/related.js");
const {FIELDS}=await import("./webapp/js/data/fields.js");
console.log({fields:Object.keys(FIELDS).length, docs:docs.length, tracks:tracks.length,
 items:tracks.flatMap(t=>t.weeks.flatMap(w=>w.items)).length, interview:allInterviews.length,
 iqFields:new Set(allInterviews.map(q=>q.field)).size,
 relatedPairs:Object.values(related).flat().length});'
```

Expected: `fields 16, docs 301, tracks 23, items 1086, interview 336, iqFields 14, relatedPairs 137 + (số cặp giữ ở Step 2)`. Nếu số nào khác, dùng số in ra và ghi chú lệch vào commit.

Thay trong README bằng số vừa in (mở bằng Read, định vị bằng grep — số dòng chỉ là gợi ý):
- `webapp/README.md` dòng ~4: `Mười lăm lĩnh vực` → `Mười sáu lĩnh vực`; chèn `**PostgreSQL 14 Internals**,` ngay sau tên DDIA trong danh sách.
- dòng ~17: `15 lĩnh vực` → `16 lĩnh vực`; `(DDIA → Kafka)` → `(DDIA → PostgreSQL 14 Internals → Kafka)`.
- dòng ~20: `22 track / 1038 mục` → số mới.
- dòng ~21: `270 tài liệu`, `137 cặp` → số mới.
- dòng ~25: `312 câu`, `13 lĩnh vực` → số mới; chèn `PostgreSQL 14 Internals,` ngay sau `DDIA,` trong danh sách.
- dòng ~84: `15 lĩnh vực` → `16 lĩnh vực`; cây `interview (24 câu/lĩnh vực)` thêm `pg-internals ·` ngay sau `ddia`.
- `README.md` dòng ~103: chèn `bản dịch **PostgreSQL 14 Internals**,` ngay sau `bản dịch **Designing Data-Intensive Applications**,`; `cả mười lăm lĩnh vực` → `cả mười sáu lĩnh vực`.
- `README.md` bảng nguồn (dòng ~112–117): thêm một dòng sau dòng nguồn DDIA (nếu có; nếu không, sau dòng cuối của các bản dịch sách):

```markdown
| [`sources/pg-internals/`](./sources/pg-internals/) | Bản dịch tiếng Việt *PostgreSQL 14 Internals* (Egor Rogov, Postgres Professional 2023) — sách phát hành miễn phí nhưng không kèm giấy phép mở. 29 chương + phần mở đầu và lời kết, 146 hình. Đọc trong app ở lĩnh vực PostgreSQL 14 Internals, kèm lộ trình đọc 12 tuần. |
```

- `README.md` dòng số liệu tổng (tìm bằng `grep -n "15 lĩnh vực\|1038\|270 tài liệu" README.md`) → số mới.

- [ ] **Step 7: Soát chuỗi cũ còn sót**

```bash
grep -rn "Mười lăm\|mười lăm lĩnh vực\|15 lĩnh vực\|1038 mục\|270 tài liệu\|312 câu\|13 lĩnh vực\|DDIA → Kafka\|22 track" README.md sources/README.md webapp/README.md webapp/js
```

Expected: không dòng nào.

- [ ] **Step 8: CHECK — xanh**, rồi commit

```bash
git add webapp/js/data/related.js webapp/js/data/senior-java/roadmap-gd1.js webapp/js/data/guides.js README.md webapp/README.md
git commit -m "feat(pg-internals): liên kết chéo, nối Senior Java giai đoạn 1, cập nhật README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Kiểm chứng trong app thật

**Files:** không sửa (trừ khi phát hiện lỗi — khi đó sửa ở tệp của task sở hữu và commit riêng).

- [ ] **Step 1: Chạy app**

```bash
./webapp/scripts/dev.sh 8888
```

(chạy nền; dừng sau khi kiểm xong)

- [ ] **Step 2: Kiểm từng route** (dùng skill `claude-in-chrome` nếu có; không có trình duyệt thì `curl` các tệp `content/pg-internals/…` và đọc JS):
  - `http://localhost:8888/#/docs/pg-03` — render chương 3, nhãn "Ch. 3 · Pages and Tuples (Page và tuple)", **hình `images/ch03-fig01.png` hiện** (không vỡ ảnh).
  - Trong `#/docs/pg-02`, bấm một link `[→ tr. N]` — URL đổi thành `#/docs/pg-NN` đúng chương, không mở tệp `.md` thô.
  - `#/docs/pg-00` và `#/docs/pg-30` — nhãn không có "Ch." (chapter null), hiện dưới nhóm không Phần.
  - Thư viện tài liệu: lĩnh vực PostgreSQL 14 Internals gom 31 tài liệu theo 5 Phần + nhóm không Phần.
  - `#/roadmap/pg` — 12 tuần, 48 mục; bấm một link `§` trong bài học mở đúng chương.
  - Module phỏng vấn của lĩnh vực — 24 câu, 6 chủ đề, lọc theo cấp chạy; câu L2 hiển thị khối code đúng.
  - Trang Con đường học — Data & Distributed hiện PostgreSQL 14 Internals ở vị trí 2/3.
  - `#/docs/ddia-08` — khối "Đọc liền mạch" có `pg-02`/`pg-04` (nếu giữ ở Task 7).
  - Console trình duyệt không có lỗi.

- [ ] **Step 3: CHECK lần cuối và `git status` sạch**

Expected: `57/57 bất biến đạt`; `git status` không có thay đổi chưa commit; thư mục `PostgreSQL 14 Internals/` không tồn tại.
