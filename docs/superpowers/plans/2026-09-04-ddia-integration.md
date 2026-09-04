# DDIA — Lĩnh vực thứ 7 của DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Designing Data-Intensive Applications* ấn bản 2 (14 chương) vào web app DevPrep thành lĩnh vực thứ 7 `ddia`, với module `docs` (14 tài liệu) và `roadmap` (giáo trình đọc 12 tuần / 48 mục).

**Architecture:** DevPrep là web app tĩnh, không build, không dependency. Thêm một lĩnh vực = thêm dữ liệu thuần, không sửa view nào: `fields.js` là nguồn sự thật duy nhất, `dashboard.js` và sidebar đọc thẳng từ đó. Nội dung markdown nằm trong repo và được `build-content.sh` copy sang `webapp/content/` lúc dev/deploy. Toàn bộ nghiệm thu tự động do `webapp/check-data.mjs` đảm nhiệm.

**Tech Stack:** JavaScript ES modules thuần (không framework, không bundler) · Node.js ≥ 18 để chạy `check-data.mjs` · bash cho `build-content.sh` · python3 `http.server` cho dev.

**Spec:** [`docs/superpowers/specs/2026-09-04-ddia-integration-design.md`](../specs/2026-09-04-ddia-integration-design.md)

## Global Constraints

Mọi task đều ngầm chịu các ràng buộc sau. Đọc kỹ trước khi bắt đầu bất kỳ task nào.

- **Mọi `id` là khoá localStorage lưu tiến độ người dùng — không bao giờ đổi sau khi đã commit.** Áp dụng cho `ddia-01`…`ddia-14`, `dd-w1`…`dd-w12`, `dd-w1-1`…`dd-w12-4`, và mọi id sẵn có của lĩnh vực khác.
- **Không viết bất biến mới trong `check-data.mjs`.** Chỉ mở rộng bảng `EXPECTED.counts`. Không nới, không thêm allowlist, không sửa bất biến hiện có — kể cả khi dữ liệu mới bị nó chặn.
- **Không copy `.pdf` sang `webapp/content/`.** PDF ở lại repo làm nguồn đối chiếu.
- **Không sửa view nào** (`webapp/js/views/*.js`) ngoài một dòng chú thích ở `roadmap.js` (Task 8).
- **Ngôn ngữ nội dung: tiếng Việt.** Thuật ngữ kỹ thuật giữ nguyên tiếng Anh khi sách giữ nguyên (replication, sharding, transaction, stream…).
- **Khối "Đọc" trong bài học trỏ anchor vào bản dịch, không chép lại nội dung sách.** Đây là kế hoạch đọc, không phải bản tóm tắt.
- **Khối "Bẫy" phải truy được về một đoạn cảnh báo có thật trong chương tương ứng.** Không bịa bẫy nghe hợp lý. Nếu đọc chương mà không tìm ra cảnh báo nào, viết bẫy từ chỗ sách nói "một quan niệm sai lầm phổ biến" / "người ta thường tưởng" — hoặc bỏ trống và báo lại, không tự chế.
- **Bản quyền:** DDIA là sách thương mại của O'Reilly. Mọi chỗ nhắc tới nguồn phải ghi đúng khuôn đã dùng cho `k8s-ebook`/`spring-security-vi`/`modern-concurrency-vi`: *"sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0"*.
- **Lệnh nghiệm thu duy nhất của repo** (không có test runner nào khác — `package.json` chỉ khai `type: module`):

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

- **Luôn dán output thật của lệnh trên khi báo cáo.** Không tuyên bố "đã chạy, xanh" mà không có output.

## Ghi chú về thứ tự so với spec §9

Spec §9 xếp "khai `EXPECTED.counts`" trước khi viết dữ liệu lộ trình. Kế hoạch này giữ nguyên nguyên tắc đó cho **chặng 1** (Task 2), nhưng ở **chặng 2** dời việc khai `"roadmap-items:ddia": 48` + wiring xuống task cuối (Task 8), sau khi 12 tuần đã viết xong.

Lý do: khai 48 từ đầu khiến `check-data.mjs` đỏ liên tục suốt 6 task viết nội dung, làm mất tác dụng tín hiệu của nó. Sự bảo vệ mà spec muốn vẫn còn nguyên — Task 8 khai 48 rồi chạy checker trên dữ liệu đã viết; nếu tổng thực tế là 47, checker đỏ đúng như spec mong đợi. Mỗi task viết tuần có lệnh đếm riêng để vẫn tự nghiệm thu được (xem Task 3).

---

# CHẶNG 1 — Lĩnh vực sống, đọc được 14 chương

## Task 1: Chuẩn hoá nguồn sang `ddia-vi/` và nối vào build

**Files:**
- Rename: `Designing Data-Intensive Applications/` → `ddia-vi/` (14 `.md`, 14 `.pdf`, `images/`)
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces: 14 tệp markdown tại `ddia-vi/NN-slug.md` và ảnh tại `ddia-vi/images/chN/`; sau khi chạy build, nội dung có mặt tại `webapp/content/ddia/` và `webapp/content/ddia/images/`. Task 2 tham chiếu chúng qua `file: "content/ddia/NN-slug.md"`.

- [ ] **Step 1: Xác nhận không nơi nào tham chiếu đường dẫn cũ**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
grep -rn "Designing Data-Intensive" --exclude-dir=.git . \
  | grep -v "^./Designing Data-Intensive Applications/" \
  | grep -v "^./docs/superpowers/"
```

Kỳ vọng: **không dòng nào** (ngoài spec/plan trong `docs/superpowers/`). Nếu có dòng khác lọt ra, dừng lại và báo — đổi tên sẽ làm gãy link đó.

- [ ] **Step 2: Đổi tên thư mục**

```bash
git mv "Designing Data-Intensive Applications" ddia-vi
```

- [ ] **Step 3: Đổi tên 14 tệp markdown**

```bash
cd ddia-vi
git mv "1. Trade-Offs in Data Systems Architecture _ Designing Data-Intensive Applications, 2nd Edition.md"  01-danh-doi-trong-kien-truc-he-thong-du-lieu.md
git mv "2. Defining Nonfunctional Requirements _ Designing Data-Intensive Applications, 2nd Edition.md"      02-xac-dinh-cac-yeu-cau-phi-chuc-nang.md
git mv "3. Data Models and Query Languages _ Designing Data-Intensive Applications, 2nd Edition.md"          03-mo-hinh-du-lieu-va-ngon-ngu-truy-van.md
git mv "4. Storage and Retrieval _ Designing Data-Intensive Applications, 2nd Edition.md"                    04-luu-tru-va-truy-xuat.md
git mv "5. Encoding and Evolution _ Designing Data-Intensive Applications, 2nd Edition.md"                   05-encoding-va-tien-hoa.md
git mv "6. Replication _ Designing Data-Intensive Applications, 2nd Edition.md"                              06-replication.md
git mv "7. Sharding _ Designing Data-Intensive Applications, 2nd Edition.md"                                 07-sharding.md
git mv "8. Transactions _ Designing Data-Intensive Applications, 2nd Edition.md"                             08-transaction.md
git mv "9. The Trouble with Distributed Systems _ Designing Data-Intensive Applications, 2nd Edition.md"     09-nhung-rac-roi-cua-he-phan-tan.md
git mv "10. Consistency and Consensus _ Designing Data-Intensive Applications, 2nd Edition.md"               10-tinh-nhat-quan-va-consensus.md
git mv "11. Batch Processing _ Designing Data-Intensive Applications, 2nd Edition.md"                        11-batch-processing.md
git mv "12. Stream Processing _ Designing Data-Intensive Applications, 2nd Edition.md"                       12-stream-processing.md
git mv "13. A Philosophy of Streaming Systems _ Designing Data-Intensive Applications, 2nd Edition.md"       13-mot-triet-ly-ve-he-thong-streaming.md
git mv "14. Doing the Right Thing _ Designing Data-Intensive Applications, 2nd Edition.md"                   14-lam-dieu-dung-dan.md
cd ..
```

- [ ] **Step 4: Đổi tên 14 tệp PDF theo đúng slug**

```bash
cd ddia-vi
for f in *.pdf; do
  n="${f%%.*}"
  md=$(printf "%02d" "$n")-*.md
  git mv "$f" "$(basename $(ls $md) .md).pdf"
done
cd ..
ls ddia-vi/*.pdf | head -3
```

Kỳ vọng: `ddia-vi/01-danh-doi-trong-kien-truc-he-thong-du-lieu.pdf` … Nếu vòng lặp không khớp, đổi tay 14 tệp theo đúng bảng ở Step 3 (cùng slug, đuôi `.pdf`).

- [ ] **Step 5: Kiểm tra đường dẫn ảnh trong markdown vẫn đúng**

```bash
grep -c 'images/ch' ddia-vi/*.md | head -3
ls ddia-vi/images/ | tr '\n' ' '
find ddia-vi/images -type f | wc -l
```

Kỳ vọng: `ls` in ra `ch1 ch10 ch11 ch12 ch13 ch2 … ch9`, `find` đếm được **105**. Đường dẫn ảnh là tương đối nên **không sửa nội dung markdown**.

- [ ] **Step 6: Nối `ddia-vi/` vào `build-content.sh`**

Trong `webapp/build-content.sh`, thêm `"$DEST/ddia/images"` vào cuối lệnh `mkdir -p` sẵn có:

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior" \
         "$DEST/modconc/images" "$DEST/ddia/images"
```

Rồi thêm 2 dòng `cp` ngay sau dòng `modconc` cuối cùng:

```bash
cp    "$REPO"/ddia-vi/*.md                              "$DEST/ddia/"
cp -R "$REPO"/ddia-vi/images/.                          "$DEST/ddia/images/"
```

Không thêm dòng nào cho `.pdf`.

- [ ] **Step 7: Chạy build và xác minh nội dung đã sang `content/`**

```bash
./webapp/build-content.sh webapp/content
ls webapp/content/ddia/*.md | wc -l
find webapp/content/ddia/images -type f | wc -l
ls webapp/content/ddia/*.pdf 2>/dev/null | wc -l
```

Kỳ vọng: `14` tệp md · `105` ảnh · `0` pdf.

- [ ] **Step 8: Chạy checker để xác nhận chưa hỏng gì**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **xanh toàn bộ, 0 lỗi**. Chưa khai lĩnh vực nên checker chưa biết gì về DDIA — task này chỉ được phép giữ nguyên trạng thái xanh, không được làm đỏ.

- [ ] **Step 9: Commit**

```bash
git add -A ddia-vi webapp/build-content.sh
git commit -m "refactor: chuẩn hoá nguồn DDIA sang ddia-vi/ và nối vào build-content

Đổi tên thư mục và 14 chương (md + pdf) theo quy ước repo NN-slug, đồng bộ
với k8s-ebook/, spring-security-vi/, modern-concurrency-vi/. Nội dung và
đường dẫn ảnh tương đối giữ nguyên, không sửa một ký tự markdown nào.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Khai lĩnh vực `ddia` và 14 tài liệu

**Files:**
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/check-data.mjs` (chỉ bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/docs-index.js`

**Interfaces:**
- Consumes: từ Task 1 — 14 tệp tại `webapp/content/ddia/NN-slug.md` và ảnh tại `webapp/content/ddia/images/chN/`.
- Produces: field id `ddia`; 14 doc id `ddia-01`…`ddia-14`, mỗi bản ghi có `field: "ddia"`. Task 4–7 trỏ anchor `#/docs/ddia-NN` từ bài học. Task 8 bật thêm module `roadmap` vào chính entry `ddia` này.

- [ ] **Step 1: Viết bảng kỳ vọng TRƯỚC — để checker đỏ có chủ đích**

Trong `webapp/check-data.mjs`, thêm vào cuối object `EXPECTED.counts` (ngay sau 2 dòng `modern-concurrency`):

```js
    // Lĩnh vực DDIA — 14 chương Designing Data-Intensive Applications ấn bản 2.
    "docs:ddia": 14,
```

- [ ] **Step 2: Khai lĩnh vực trong `fields.js`**

Thêm entry vào cuối object `FIELDS` (sau `"modern-concurrency"`):

```js
  ddia: {
    label: "Designing Data-Intensive Applications",
    icon: "🗄️",
    desc: "Bản dịch tiếng Việt Designing Data-Intensive Applications, ấn bản 2 (Martin Kleppmann, O'Reilly) — mô hình dữ liệu, lưu trữ, replication, sharding, transaction, hệ phân tán, batch và stream processing.",
    certFilter: false,
    // Module "roadmap" mở ở Task 8, khi đã có đủ 48 mục lộ trình.
    modules: ["dashboard", "docs"],
    externalRef: { label: "dataintensive.net", href: "https://dataintensive.net/" },
  },
```

Và chèn `"ddia"` vào `FIELD_ORDER`, ngay sau `"java"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "ddia", "modern-concurrency", "spring-security", "senior-java"];
```

- [ ] **Step 3: Chạy checker để xác nhận nó ĐỎ đúng chỗ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ**, với lỗi về số lượng tài liệu lĩnh vực `ddia` (kỳ vọng 14, thực tế 0). Đây là bước red của vòng TDD — nếu checker xanh ở đây nghĩa là bảng kỳ vọng chưa ăn, dừng lại kiểm tra Step 1.

- [ ] **Step 4: Viết 14 bản ghi tài liệu**

Trong `webapp/js/data/docs-index.js`, thêm vào cuối mảng `docs` (sau nhóm modconc), mở đầu bằng comment nhóm `// ===== DDIA =====`:

```js
  // ===== DDIA =====
  {
    id: "ddia-01",
    field: "ddia",
    title: "Chương 1 — Những sự đánh đổi trong kiến trúc hệ thống dữ liệu",
    file: "content/ddia/01-danh-doi-trong-kien-truc-he-thong-du-lieu.md",
    icon: "🧭",
    desc: "Hệ thống vận hành khác hệ thống phân tích ở đâu, khi nào chọn cloud thay vì tự vận hành, và lúc nào mới thực sự cần hệ phân tán.",
    tags: ["Trade-off", "OLTP vs OLAP", "Cloud"],
  },
  {
    id: "ddia-02",
    field: "ddia",
    title: "Chương 2 — Xác định các yêu cầu phi chức năng",
    file: "content/ddia/02-xac-dinh-cac-yeu-cau-phi-chuc-nang.md",
    icon: "📐",
    desc: "Cách phát biểu hiệu năng bằng percentile thay vì trung bình, và ba trụ tin cậy — mở rộng — bảo trì, qua case study home timeline.",
    tags: ["Percentile", "Độ tin cậy", "Khả năng mở rộng"],
  },
  {
    id: "ddia-03",
    field: "ddia",
    title: "Chương 3 — Mô hình dữ liệu và ngôn ngữ truy vấn",
    file: "content/ddia/03-mo-hinh-du-lieu-va-ngon-ngu-truy-van.md",
    icon: "🗂️",
    desc: "Quan hệ, document hay đồ thị — mỗi mô hình hợp với hình dạng dữ liệu nào, cộng Event Sourcing, CQRS và dữ liệu dạng ma trận.",
    tags: ["Quan hệ", "Document", "Graph", "CQRS"],
  },
  {
    id: "ddia-04",
    field: "ddia",
    title: "Chương 4 — Lưu trữ và Truy xuất",
    file: "content/ddia/04-luu-tru-va-truy-xuat.md",
    icon: "💾",
    desc: "LSM-tree và B-tree khác nhau ra sao ở tầng đĩa, vì sao kho phân tích lưu theo cột, và index đa chiều dùng khi nào.",
    tags: ["LSM-tree", "B-tree", "Lưu trữ cột", "Index"],
  },
  {
    id: "ddia-05",
    field: "ddia",
    title: "Chương 5 — Encoding và Tiến hóa",
    file: "content/ddia/05-encoding-va-tien-hoa.md",
    icon: "📦",
    desc: "JSON, Protocol Buffers, Avro và bài toán tương thích xuôi-ngược khi schema đổi mà hệ thống vẫn phải chạy.",
    tags: ["Encoding", "Avro", "Schema evolution"],
  },
  {
    id: "ddia-06",
    field: "ddia",
    title: "Chương 6 — Replication",
    file: "content/ddia/06-replication.md",
    icon: "🔁",
    desc: "Single-leader, multi-leader và leaderless; replication lag sinh ra bug gì và ba bảo đảm nào chữa được.",
    tags: ["Replication", "Leader", "Quorum", "Lag"],
  },
  {
    id: "ddia-07",
    field: "ddia",
    title: "Chương 7 — Sharding",
    file: "content/ddia/07-sharding.md",
    icon: "🧩",
    desc: "Chia theo khoảng hay theo hash, hot spot sinh ở đâu, rebalancing và secondary index cục bộ so với toàn cục.",
    tags: ["Sharding", "Hot spot", "Rebalancing"],
  },
  {
    id: "ddia-08",
    field: "ddia",
    title: "Chương 8 — Transaction",
    file: "content/ddia/08-transaction.md",
    icon: "🔐",
    desc: "ACID thật sự bảo đảm gì, các mức cô lập yếu để lọt bug nào, và ba đường tới serializability.",
    tags: ["ACID", "Isolation", "MVCC", "Serializability"],
  },
  {
    id: "ddia-09",
    field: "ddia",
    title: "Chương 9 — Những rắc rối của hệ phân tán",
    file: "content/ddia/09-nhung-rac-roi-cua-he-phan-tan.md",
    icon: "⚠️",
    desc: "Mạng và đồng hồ đều không đáng tin; timeout đặt bao nhiêu là đúng, và vì sao cần fencing token.",
    tags: ["Hệ phân tán", "Timeout", "Đồng hồ", "Fencing"],
  },
  {
    id: "ddia-10",
    field: "ddia",
    title: "Chương 10 — Tính nhất quán và Consensus",
    file: "content/ddia/10-tinh-nhat-quan-va-consensus.md",
    icon: "🤝",
    desc: "Linearizability đắt ở chỗ nào, đồng hồ logic giải quyết gì, và consensus quy về total order broadcast ra sao.",
    tags: ["Linearizability", "Consensus", "CAP", "Raft"],
  },
  {
    id: "ddia-11",
    field: "ddia",
    title: "Chương 11 — Batch Processing",
    file: "content/ddia/11-batch-processing.md",
    icon: "⚙️",
    desc: "Từ pipeline Unix tới MapReduce và dataflow engine — join phía map hay phía reduce, và chịu lỗi bằng cách tính lại.",
    tags: ["Batch", "MapReduce", "Dataflow"],
  },
  {
    id: "ddia-12",
    field: "ddia",
    title: "Chương 12 — Stream Processing",
    file: "content/ddia/12-stream-processing.md",
    icon: "🌊",
    desc: "Message broker so với log-based broker, CDC, cửa sổ thời gian, và exactly-once thực chất nghĩa là gì.",
    tags: ["Stream", "Kafka", "CDC", "Window"],
  },
  {
    id: "ddia-13",
    field: "ddia",
    title: "Chương 13 — Một triết lý về hệ thống streaming",
    file: "content/ddia/13-mot-triet-ly-ve-he-thong-streaming.md",
    icon: "🧠",
    desc: "Tích hợp dữ liệu quanh một log tổng thứ tự, tách rời database, và lập luận end-to-end về tính đúng đắn.",
    tags: ["Tích hợp dữ liệu", "Unbundling", "Đúng đắn"],
  },
  {
    id: "ddia-14",
    field: "ddia",
    title: "Chương 14 — Làm Điều Đúng Đắn",
    file: "content/ddia/14-lam-dieu-dung-dan.md",
    icon: "⚖️",
    desc: "Predictive analytics và quyền riêng tư — trách nhiệm của kỹ sư với dữ liệu của người khác.",
    tags: ["Đạo đức", "Privacy", "Predictive analytics"],
  },
```

Đồng thời cập nhật comment đầu tệp `docs-index.js`: thêm `ddia-vi/` vào danh sách thư mục nguồn.

- [ ] **Step 5: Chạy checker để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **xanh toàn bộ, 0 lỗi**. Các bất biến vừa được thoả: `docs:ddia` = 14 · id tài liệu duy nhất · cả 14 `file` tồn tại trên đĩa · 105 ảnh markdown tồn tại · `FIELD_ORDER` khớp `FIELDS` 1-1 · mọi module của `ddia` là view có thật · N3 (bảng kỳ vọng phủ mọi lĩnh vực khai docs).

Nếu đỏ ở bất biến ảnh, nguyên nhân gần như chắc chắn là `cp -R` ở Task 1 Step 6 thiếu dấu `.` cuối `images/.`

- [ ] **Step 6: Kiểm bằng mắt phần checker không với tới**

```bash
./webapp/dev.sh
```

Mở `http://localhost:8888`, rồi:
1. Dropdown chọn lĩnh vực → xác nhận có **7 lĩnh vực**, "Designing Data-Intensive Applications" nằm ngay sau "Java & Spring Boot Scalability".
2. Chọn lĩnh vực DDIA → sidebar chỉ hiện **Bảng điều khiển** và **Tài liệu** (chưa có Lộ trình học — đúng, module đó mở ở Task 8).
3. Mở **Chương 6 — Replication** (16 ảnh) và **Chương 8 — Transaction** (14 ảnh): xác nhận ảnh hiện đủ, mục lục nổi bên phải dựng đúng, khối code có nút copy.
4. Chân sidebar có link ngoài `dataintensive.net`.

Dừng server bằng `Ctrl-C`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/fields.js webapp/js/data/docs-index.js webapp/check-data.mjs
git commit -m "feat: khai lĩnh vực ddia và 14 tài liệu DDIA

Lĩnh vực thứ 7 của DevPrep, module dashboard + docs. Bảng kỳ vọng
docs:ddia = 14 khai trước dữ liệu, đúng thứ tự check-data.mjs tự dặn.

Module roadmap chưa mở — bật ở task sau khi đã có đủ 48 mục lộ trình.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# CHẶNG 2 — Giáo trình đọc 12 tuần

## Lược đồ chung cho Task 3–7

Sáu task tiếp theo viết 12 khối tuần vào hai tệp. **Cấu trúc một khối tuần** (giống hệt `modconc-roadmap-part1.js`):

```js
{
  id: "dd-w5",
  week: "Tuần 5",
  title: "Replication",
  goal: "<một câu: người đọc làm được gì sau tuần này>",
  practice: "<một việc tay chân cụ thể, đo được>",
  resources: [
    { label: "DDIA 06 — Replication", href: "#/docs/ddia-06" },
    { label: "<nguồn ngoài liên quan>", href: "https://…" },
  ],
  items: [ /* … */ ],
}
```

**Cấu trúc một mục:**

```js
{
  id: "dd-w5-2",
  text: "<một dòng nêu việc cần làm>",
  lesson: `**Mục tiêu.** <người đọc làm được gì sau mục này>

**Đọc.** [<tên mục trong sách>](#/docs/ddia-06) — <chỉ đúng phần cần đọc, nói rõ đoạn nào đọc kỹ, đoạn nào lướt>.

**Bẫy.** <lấy từ chỗ sách tự cảnh báo — phải truy được về một đoạn có thật>.

**Tự kiểm tra.** <1–2 câu hỏi chỉ trả lời được sau khi đọc đúng phần đó>`,
}
```

**Độ dài mỗi `lesson`: 250–400 từ.** Ngắn hơn thì thành mục lục, dài hơn thành bản tóm tắt sách — cả hai đều sai mục đích.

**Quy trình bắt buộc trước khi viết mỗi tuần:** đọc chương tương ứng trong `ddia-vi/`, đặc biệt các mục `##` được liệt kê trong task. Khối "Bẫy" và "Tự kiểm tra" phải bắt nguồn từ nội dung thật của chương đó.

---

## Task 3: Lộ trình tuần 1–3 (13 mục)

**Files:**
- Create: `webapp/js/data/ddia-roadmap-part1.js`

**Interfaces:**
- Consumes: từ Task 2 — doc id `ddia-01`…`ddia-04` để trỏ anchor `#/docs/ddia-NN`.
- Produces: `export const ddiaWeeksPart1` — mảng khối tuần. Task 4 nối thêm tuần 4–6 vào **cùng mảng này**. Task 8 import tên `ddiaWeeksPart1` từ tệp này.

- [ ] **Step 1: Đọc 3 chương nguồn**

Đọc `ddia-vi/01-danh-doi-trong-kien-truc-he-thong-du-lieu.md`, `02-xac-dinh-cac-yeu-cau-phi-chuc-nang.md`, `03-mo-hinh-du-lieu-va-ngon-ngu-truy-van.md`. Ghi lại tên chính xác của các mục `##` và `###` — khối "Đọc" trích nguyên văn tên mục, không tự đặt lại.

- [ ] **Step 2: Tạo tệp với header và 3 khối tuần**

Tạo `webapp/js/data/ddia-roadmap-part1.js`, mở đầu bằng:

```js
// Lộ trình đọc Designing Data-Intensive Applications — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Designing Data-Intensive Applications", ấn bản 2
// (Martin Kleppmann, O'Reilly). Thư mục nguồn: ddia-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (dd-w<N> / dd-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Một chương một tuần, trừ tuần 1 (gộp ch.1+2) và tuần 12 (gộp ch.13+14).

export const ddiaWeeksPart1 = [
  // … 3 khối tuần ở Step 3–5 …
];
```

- [ ] **Step 3: Viết tuần 1 — `dd-w1`, 5 mục (ch.1 + ch.2)**

`title`: `"Đánh đổi, và cách phát biểu yêu cầu phi chức năng"`
`resources`: trỏ `#/docs/ddia-01` và `#/docs/ddia-02`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w1-1` | Hệ thống vận hành và hệ thống phân tích — hai thế giới, hai loại yêu cầu | ch.1 §"Hệ thống vận hành và hệ thống phân tích" (gồm data warehouse, data lake, ETL) |
| `dd-w1-2` | Cloud hay tự vận hành, và khi nào mới thật sự cần hệ phân tán | ch.1 §"Cloud so với Tự vận hành (Self-Hosting)" + §"Hệ phân tán so với hệ đơn nút" |
| `dd-w1-3` | Home timeline: một case study đọc-nhiều dựng sẵn khung cả cuốn sách | ch.2 §"Nghiên cứu tình huống: Home timeline của mạng xã hội" |
| `dd-w1-4` | Mô tả hiệu năng bằng percentile, không bằng trung bình | ch.2 §"Mô tả hiệu năng" |
| `dd-w1-5` | Ba trụ: độ tin cậy, khả năng mở rộng, khả năng bảo trì | ch.2 §"Độ tin cậy và khả năng chịu lỗi" + §"Khả năng mở rộng" + §"Khả năng bảo trì" |

- [ ] **Step 4: Viết tuần 2 — `dd-w2`, 4 mục (ch.3)**

`title`: `"Mô hình dữ liệu và ngôn ngữ truy vấn"` · `resources` trỏ `#/docs/ddia-03`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w2-1` | Quan hệ so với document — hình dạng dữ liệu quyết định mô hình | ch.3 §"Mô hình quan hệ so với mô hình document" |
| `dd-w2-2` | Mô hình đồ thị: property graph, triple-store và ngôn ngữ truy vấn của chúng | ch.3 §"Các mô hình dữ liệu dạng đồ thị" |
| `dd-w2-3` | Event Sourcing và CQRS — lưu sự kiện thay vì lưu trạng thái | ch.3 §"Event Sourcing và CQRS" |
| `dd-w2-4` | DataFrame, ma trận và mảng — dữ liệu cho phân tích và ML | ch.3 §"DataFrame, Ma trận và Mảng" |

- [ ] **Step 5: Viết tuần 3 — `dd-w3`, 4 mục (ch.4)**

`title`: `"Lưu trữ và truy xuất — LSM-tree, B-tree, cột"` · `resources` trỏ `#/docs/ddia-04`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w3-1` | Log-structured storage: SSTable và LSM-tree | ch.4 §"Lưu trữ và Đánh index cho OLTP", phần log-structured |
| `dd-w3-2` | B-tree, và bảng đối chiếu LSM-tree với B-tree | ch.4 §"Lưu trữ và Đánh index cho OLTP", phần B-tree và so sánh |
| `dd-w3-3` | Vì sao kho phân tích lưu theo cột, và nén cột hiệu quả tới đâu | ch.4 §"Lưu trữ dữ liệu cho phân tích" |
| `dd-w3-4` | Index đa chiều và index toàn văn | ch.4 §"Index đa chiều và Index toàn văn" |

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/ddia-roadmap-part1.js').then(m=>{
  const w=m.ddiaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 13` và `dd-w1:5 dd-w2:4 dd-w3:4`

- [ ] **Step 7: Kiểm mọi anchor `#/docs/` trỏ tài liệu có thật**

```bash
node -e "
import('./webapp/js/data/ddia-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const ids=new Set(docs.map(d=>d.id));
  const bad=[];
  for(const w of m.ddiaWeeksPart1){
    for(const r of w.resources??[]) for(const x of String(r.href).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(w.id+' → '+x[1]);
    for(const it of w.items) for(const x of String(it.lesson).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(it.id+' → '+x[1]);
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — mọi anchor hợp lệ');
})"
```

Kỳ vọng: `OK — mọi anchor hợp lệ`

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/ddia-roadmap-part1.js
git commit -m "feat: lộ trình đọc DDIA tuần 1-3 — 13 mục

Tuần 1 gộp ch.1+2 (đánh đổi kiến trúc, yêu cầu phi chức năng), tuần 2
ch.3 (mô hình dữ liệu), tuần 3 ch.4 (lưu trữ và truy xuất).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Lộ trình tuần 4–6 (10 mục)

**Files:**
- Modify: `webapp/js/data/ddia-roadmap-part1.js`

**Interfaces:**
- Consumes: từ Task 3 — mảng `ddiaWeeksPart1` đã có 3 khối tuần; doc id `ddia-05`, `ddia-06`, `ddia-07`.
- Produces: `ddiaWeeksPart1` đủ **6 khối tuần / 23 mục**. Task 8 import tên này.

- [ ] **Step 1: Đọc 3 chương nguồn**

Đọc `ddia-vi/05-encoding-va-tien-hoa.md`, `06-replication.md`, `07-sharding.md`. Ghi lại tên chính xác các mục `##`/`###`.

- [ ] **Step 2: Viết tuần 4 — `dd-w4`, 3 mục (ch.5)**

`title`: `"Encoding và tiến hoá schema"` · `resources` trỏ `#/docs/ddia-05`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w4-1` | JSON, Protocol Buffers, Avro — và tương thích xuôi/ngược | ch.5 §"Các định dạng encoding dữ liệu" |
| `dd-w4-2` | Dataflow qua database và qua service (REST, RPC) | ch.5 §"Các phương thức dataflow", phần database và service |
| `dd-w4-3` | Dataflow qua truyền message bất đồng bộ | ch.5 §"Các phương thức dataflow", phần message-passing |

- [ ] **Step 3: Viết tuần 5 — `dd-w5`, 4 mục (ch.6)**

`title`: `"Replication"` · `resources` trỏ `#/docs/ddia-06`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w5-1` | Single-leader: đồng bộ hay bất đồng bộ, và cách dựng follower mới | ch.6 §"Single-Leader Replication", phần đầu |
| `dd-w5-2` | Replication lag và ba bảo đảm chữa nó | ch.6 §"Single-Leader Replication", phần replication lag (read-your-writes, monotonic reads, consistent prefix reads) |
| `dd-w5-3` | Multi-leader: topology và xử lý xung đột ghi | ch.6 §"Multi-Leader Replication" |
| `dd-w5-4` | Leaderless: quorum, read repair, sloppy quorum | ch.6 §"Leaderless Replication (Replication không có leader)" |

- [ ] **Step 4: Viết tuần 6 — `dd-w6`, 3 mục (ch.7)**

`title`: `"Sharding"` · `resources` trỏ `#/docs/ddia-07`.
Trong `practice` của tuần này, ghi rõ đây là **tuần nhẹ nhất (11 nghìn từ), đặt ngay trước tuần 7 nặng nhất** — khuyến khích người đọc dùng thời gian dư để đọc trước ch.8.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w6-1` | Vì sao phải shard, và sharding cho multitenancy | ch.7 §"Ưu và nhược điểm của Sharding" + §"Sharding cho Multitenancy" |
| `dd-w6-2` | Chia theo khoảng hay theo hash — hot spot và rebalancing | ch.7 §"Sharding dữ liệu Key-Value" |
| `dd-w6-3` | Định tuyến request, và secondary index cục bộ so với toàn cục | ch.7 §"Định tuyến request" + §"Sharding và secondary index" |

- [ ] **Step 5: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/ddia-roadmap-part1.js').then(m=>{
  const w=m.ddiaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 6 | mục: 23` và `dd-w1:5 dd-w2:4 dd-w3:4 dd-w4:3 dd-w5:4 dd-w6:3`

- [ ] **Step 6: Kiểm anchor và tiền tố id**

```bash
node -e "
import('./webapp/js/data/ddia-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const ids=new Set(docs.map(d=>d.id)); const bad=[];
  for(const w of m.ddiaWeeksPart1){
    for(const r of w.resources??[]) for(const x of String(r.href).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(w.id+' → '+x[1]);
    for(const it of w.items){
      if(!it.id.startsWith(w.id+'-')) bad.push('tiền tố sai: '+it.id+' ⊄ '+w.id);
      for(const x of String(it.lesson).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(it.id+' → '+x[1]);
    }
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — anchor hợp lệ, tiền tố id đúng');
})"
```

Kỳ vọng: `OK — anchor hợp lệ, tiền tố id đúng`

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/ddia-roadmap-part1.js
git commit -m "feat: lộ trình đọc DDIA tuần 4-6 — part1 đủ 23 mục

Tuần 4 ch.5 (encoding), tuần 5 ch.6 (replication), tuần 6 ch.7 (sharding).
Tuần 6 cố ý nhẹ — quãng nghỉ trước tuần 7 nặng nhất (ch.8, 33 nghìn từ).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Lộ trình tuần 7–9 (14 mục)

**Files:**
- Create: `webapp/js/data/ddia-roadmap-part2.js`

**Interfaces:**
- Consumes: từ Task 2 — doc id `ddia-08`, `ddia-09`, `ddia-10`.
- Produces: `export const ddiaWeeksPart2` — mảng khối tuần. Task 6–7 nối thêm tuần 10–12 vào **cùng mảng này**. Task 8 import tên `ddiaWeeksPart2`.

- [ ] **Step 1: Đọc 3 chương nguồn**

Đọc `ddia-vi/08-transaction.md`, `09-nhung-rac-roi-cua-he-phan-tan.md`, `10-tinh-nhat-quan-va-consensus.md`. Đây là ba chương nặng nhất của cả kế hoạch (33k + 29k + 25k từ) — dành thời gian tương xứng.

- [ ] **Step 2: Tạo tệp với header**

Tạo `webapp/js/data/ddia-roadmap-part2.js`:

```js
// Lộ trình đọc Designing Data-Intensive Applications — Phần 2 (Tuần 7–12).
//
// Nguồn: bản dịch tiếng Việt "Designing Data-Intensive Applications", ấn bản 2
// (Martin Kleppmann, O'Reilly). Thư mục nguồn: ddia-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (dd-w<N> / dd-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const ddiaWeeksPart2 = [
  // … 3 khối tuần ở Step 3–5 …
];
```

- [ ] **Step 3: Viết tuần 7 — `dd-w7`, 5 mục (ch.8)**

`title`: `"Transaction — ACID, isolation yếu, serializability"` · `resources` trỏ `#/docs/ddia-08`.
Trong `practice`, nói thẳng: **đây là tuần nặng nhất (33 nghìn từ)**, và chương này cố ý không cắt đôi vì là một mạch lập luận liền — gợi ý chia 5 buổi theo 5 mục.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w7-1` | ACID nghĩa là gì — và không nghĩa là gì | ch.8 §"Transaction chính xác là gì?" |
| `dd-w7-2` | Read committed và snapshot isolation, cài bằng MVCC | ch.8 §"Các mức cô lập yếu (Weak Isolation Levels)", phần read committed và snapshot isolation |
| `dd-w7-3` | Lost update, write skew và phantom — ba bug isolation yếu để lọt | ch.8 §"Các mức cô lập yếu", phần lost update và write skew/phantom |
| `dd-w7-4` | Ba đường tới serializability: thực thi tuần tự, 2PL, SSI | ch.8 §"Serializability" |
| `dd-w7-5` | Transaction phân tán và 2PC | ch.8 §"Transaction phân tán" |

- [ ] **Step 4: Viết tuần 8 — `dd-w8`, 5 mục (ch.9)**

`title`: `"Những rắc rối của hệ phân tán"` · `resources` trỏ `#/docs/ddia-09`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w8-1` | Hỏng hóc một phần — thứ làm hệ phân tán khác hẳn máy đơn | ch.9 §"Lỗi và hỏng hóc một phần" |
| `dd-w8-2` | Mạng không đáng tin cậy — và timeout đặt bao nhiêu là đúng | ch.9 §"Mạng không đáng tin cậy" |
| `dd-w8-3` | Đồng hồ không đáng tin cậy: time-of-day so với monotonic | ch.9 §"Đồng hồ không đáng tin cậy", phần đầu |
| `dd-w8-4` | Dùng đồng hồ làm thứ tự sự kiện, và khoảng tin cậy | ch.9 §"Đồng hồ không đáng tin cậy", phần thứ tự sự kiện và confidence interval |
| `dd-w8-5` | Tri thức, sự thật, dối trá: quorum, fencing token, mô hình hệ thống | ch.9 §"Tri thức, Sự thật và Dối trá" |

- [ ] **Step 5: Viết tuần 9 — `dd-w9`, 4 mục (ch.10)**

`title`: `"Tính nhất quán và consensus"` · `resources` trỏ `#/docs/ddia-10`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w9-1` | Linearizability là gì, và cái giá phải trả | ch.10 §"Linearizability", phần định nghĩa và chi phí (gồm CAP) |
| `dd-w9-2` | Bộ sinh ID và đồng hồ logic | ch.10 §"Bộ sinh ID và đồng hồ logic (logical clock)" |
| `dd-w9-3` | Total order broadcast, và vì sao nó tương đương consensus | ch.10 §"Consensus", phần total order broadcast |
| `dd-w9-4` | Thuật toán consensus và dịch vụ điều phối trong thực tế | ch.10 §"Consensus", phần thuật toán và coordination service |

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/ddia-roadmap-part2.js').then(m=>{
  const w=m.ddiaWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 14` và `dd-w7:5 dd-w8:5 dd-w9:4`

- [ ] **Step 7: Kiểm anchor và tiền tố id**

```bash
node -e "
import('./webapp/js/data/ddia-roadmap-part2.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const ids=new Set(docs.map(d=>d.id)); const bad=[];
  for(const w of m.ddiaWeeksPart2){
    for(const r of w.resources??[]) for(const x of String(r.href).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(w.id+' → '+x[1]);
    for(const it of w.items){
      if(!it.id.startsWith(w.id+'-')) bad.push('tiền tố sai: '+it.id+' ⊄ '+w.id);
      for(const x of String(it.lesson).matchAll(/#\/docs\/([\w-]+)/g)) if(!ids.has(x[1])) bad.push(it.id+' → '+x[1]);
    }
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — anchor hợp lệ, tiền tố id đúng');
})"
```

Kỳ vọng: `OK — anchor hợp lệ, tiền tố id đúng`

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/ddia-roadmap-part2.js
git commit -m "feat: lộ trình đọc DDIA tuần 7-9 — 14 mục

Ba chương nặng nhất: ch.8 transaction (5 mục, không cắt đôi vì là một mạch
lập luận liền), ch.9 rắc rối hệ phân tán, ch.10 nhất quán và consensus.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Lộ trình tuần 10–11 (7 mục)

**Files:**
- Modify: `webapp/js/data/ddia-roadmap-part2.js`

**Interfaces:**
- Consumes: từ Task 5 — mảng `ddiaWeeksPart2` đã có 3 khối tuần; doc id `ddia-11`, `ddia-12`.
- Produces: `ddiaWeeksPart2` có 5 khối tuần / 21 mục. Task 7 nối tuần 12.

- [ ] **Step 1: Đọc 2 chương nguồn**

Đọc `ddia-vi/11-batch-processing.md` và `12-stream-processing.md`.

- [ ] **Step 2: Viết tuần 10 — `dd-w10`, 3 mục (ch.11)**

`title`: `"Batch processing"` · `resources` trỏ `#/docs/ddia-11`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w10-1` | Triết lý Unix: pipeline, và vì sao nó vẫn là khuôn mẫu | ch.11 §"Batch Processing với các công cụ Unix" |
| `dd-w10-2` | MapReduce: join phía map hay phía reduce, và chịu lỗi bằng tính lại | ch.11 §"Batch Processing trong hệ phân tán" |
| `dd-w10-3` | Vượt khỏi MapReduce — dataflow engine và các trường hợp dùng batch | ch.11 §"Các mô hình batch processing" + §"Các trường hợp sử dụng batch" |

- [ ] **Step 3: Viết tuần 11 — `dd-w11`, 4 mục (ch.12)**

`title`: `"Stream processing"` · `resources` trỏ `#/docs/ddia-12`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w11-1` | Truyền event: message broker so với log-based broker | ch.12 §"Truyền tải Event Stream" |
| `dd-w11-2` | Database và stream: CDC, event sourcing, log compaction | ch.12 §"Database và Stream" |
| `dd-w11-3` | Cửa sổ thời gian, và thời gian sự kiện so với thời gian xử lý | ch.12 §"Xử lý Stream", phần thời gian và window |
| `dd-w11-4` | Join trên stream, và exactly-once thực chất nghĩa là gì | ch.12 §"Xử lý Stream", phần join và fault tolerance |

- [ ] **Step 4: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/ddia-roadmap-part2.js').then(m=>{
  const w=m.ddiaWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 5 | mục: 21` và `dd-w7:5 dd-w8:5 dd-w9:4 dd-w10:3 dd-w11:4`

- [ ] **Step 5: Commit**

```bash
git add webapp/js/data/ddia-roadmap-part2.js
git commit -m "feat: lộ trình đọc DDIA tuần 10-11 — batch và stream processing

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Lộ trình tuần 12 (4 mục) — part2 đủ 25 mục

**Files:**
- Modify: `webapp/js/data/ddia-roadmap-part2.js`

**Interfaces:**
- Consumes: từ Task 6 — `ddiaWeeksPart2` có 5 khối tuần; doc id `ddia-13`, `ddia-14`.
- Produces: `ddiaWeeksPart2` đủ **6 khối tuần / 25 mục**. Cùng với Task 4, tổng toàn track là **12 tuần / 48 mục** — con số Task 8 khai vào `EXPECTED.counts`.

- [ ] **Step 1: Đọc 2 chương nguồn**

Đọc `ddia-vi/13-mot-triet-ly-ve-he-thong-streaming.md` và `14-lam-dieu-dung-dan.md`.

- [ ] **Step 2: Viết tuần 12 — `dd-w12`, 4 mục (ch.13 + ch.14)**

`title`: `"Triết lý hệ streaming, và làm điều đúng đắn"` · `resources` trỏ `#/docs/ddia-13` và `#/docs/ddia-14`.
Trong `practice`, gợi ý việc tổng kết cả 12 tuần: viết một trang đối chiếu hệ thống người đọc đang làm với các trade-off đã học.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `dd-w12-1` | Tích hợp dữ liệu: derived data và một log tổng thứ tự | ch.13 §"Tích hợp dữ liệu" |
| `dd-w12-2` | Tách rời database (unbundling) và dataflow ở tầng ứng dụng | ch.13 §"Tách rời database (Unbundling)" |
| `dd-w12-3` | Hướng tới tính đúng đắn: lập luận end-to-end, ràng buộc, kiểm toán | ch.13 §"Hướng tới tính đúng đắn" |
| `dd-w12-4` | Predictive analytics và quyền riêng tư — trách nhiệm của kỹ sư | ch.14 §"Predictive Analytics" + §"Privacy and Tracking" |

- [ ] **Step 3: Đếm mục và xác nhận tổng toàn track = 48**

```bash
node -e "
Promise.all([
  import('./webapp/js/data/ddia-roadmap-part1.js'),
  import('./webapp/js/data/ddia-roadmap-part2.js'),
]).then(([a,b])=>{
  const w=[...a.ddiaWeeksPart1, ...b.ddiaWeeksPart2];
  const n=w.flatMap(x=>x.items).length;
  console.log('tuần:', w.length, '| mục:', n);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
  console.log(w.length===12 && n===48 ? '✓ khớp 12 tuần / 48 mục' : '✗ KHÔNG khớp');
})"
```

Kỳ vọng: `tuần: 12 | mục: 48` và dòng cuối `✓ khớp 12 tuần / 48 mục`, với phân bố `dd-w1:5 dd-w2:4 dd-w3:4 dd-w4:3 dd-w5:4 dd-w6:3 dd-w7:5 dd-w8:5 dd-w9:4 dd-w10:3 dd-w11:4 dd-w12:4`

- [ ] **Step 4: Commit**

```bash
git add webapp/js/data/ddia-roadmap-part2.js
git commit -m "feat: lộ trình đọc DDIA tuần 12 — đủ 12 tuần / 48 mục

Tuần cuối gộp ch.13 (triết lý hệ streaming) và ch.14 (làm điều đúng đắn).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Bật module `roadmap`, khai track, sửa đánh số ấn bản ở Senior Java GĐ4

**Files:**
- Modify: `webapp/check-data.mjs` (bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/senior-java-gd4.js`
- Modify: `senior-java-roadmap/04-giai-doan-4-system-design.md`

(Chú thích đầu `webapp/js/views/roadmap.js` sửa ở Task 9, không phải task này.)

**Interfaces:**
- Consumes: `ddiaWeeksPart1` (23 mục, Task 3–4) và `ddiaWeeksPart2` (25 mục, Task 5–7).
- Produces: track id `ddia` — địa chỉ `#/roadmap/ddia` mà chip ở `sj-gd4-w5` trỏ tới.

- [ ] **Step 1: Khai bảng kỳ vọng — để checker đỏ có chủ đích**

Trong `webapp/check-data.mjs`, thêm ngay dưới dòng `"docs:ddia": 14,`:

```js
    "roadmap-items:ddia": 48,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ** — bảng kỳ vọng khai 48 mục lộ trình cho `ddia` nhưng track chưa được khai trong `roadmap.js`, nên thực tế đếm được 0. Đây là bước red.

- [ ] **Step 3: Khai track trong `roadmap.js`**

Thêm 2 dòng import cạnh các import `modconc`:

```js
import { ddiaWeeksPart1 } from "./ddia-roadmap-part1.js";
import { ddiaWeeksPart2 } from "./ddia-roadmap-part2.js";
```

Thêm khối track vào cuối mảng `tracks` (sau `modconc`):

```js
  {
    id: "ddia",
    field: "ddia",
    label: "DDIA",
    icon: "🗄️",
    name: "Đọc Designing Data-Intensive Applications (ấn bản 2)",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: đã làm backend với một database quan hệ, hiểu index và transaction ở mức dùng được. Không cần biết trước về hệ phân tán.",
    weeks: [...ddiaWeeksPart1, ...ddiaWeeksPart2],
  },
```

**Không** bọc `withBookRefs` — track này không nhận crossref từ đâu cả.

Cập nhật khối chú thích đầu tệp: thêm dòng
`//   DDIA: ddia-roadmap-part{1,2}.js  (Tuần 1–6 / 7–12)      — 48 mục`
vào bảng liệt kê, và sửa câu mở đầu để nhắc tới track đọc DDIA.

- [ ] **Step 4: Bật module `roadmap` cho lĩnh vực `ddia`**

Trong `webapp/js/data/fields.js`, ở entry `ddia`, xoá dòng comment về Task 8 và đổi:

```js
    modules: ["dashboard", "docs", "roadmap"],
```

- [ ] **Step 5: Chạy checker để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **xanh toàn bộ, 0 lỗi**, gồm `roadmap-items:ddia` = 48, id tuần/mục duy nhất toàn cục, tiền tố mục khớp tuần cha, mọi khối tuần có ≥ 1 mục, #3/#3b/#3c.

Nếu đỏ ở #3b ("link khác lĩnh vực"), nghĩa là có bài học trỏ `#/docs/` sang lĩnh vực khác — sửa bằng cách **bỏ link, nhắc bằng chữ**, không nới bất biến (xem Global Constraints và spec §6.3).

- [ ] **Step 6: Sửa đánh số ấn bản trong `senior-java-gd4.js`**

Bảng quy đổi ấn bản 1 → 2: ch.3→**ch.4** (LSM/B-tree) · ch.5→**ch.6** (replication) · ch.6→**ch.7** (sharding) · ch.7→**ch.8** (transaction) · ch.8→**ch.9** · ch.9→**ch.10** · ch.11→**ch.12** (stream).

Ba mục phải sửa. **Chỉ đổi chữ trong `text`/`lesson`, giữ nguyên mọi `id`:**

- `sj-gd4-w5-1` — `text` và `lesson`: lịch chương thành
  `T9: ch.1–3 → T10: ch.4 (LSM-tree vs B-tree) → T11: ch.6 (replication) → T12: ch.7–8 (sharding, transaction) → T13: ch.9–10 (network/clock không tin được, consensus — đọc mức khái niệm, đừng sa lầy) → T14: ch.12–13 (stream) + tổng kết`
- `sj-gd4-w5-2` — trong `lesson`, ví dụ `"ví dụ ch.5: DB công ty replicate kiểu gì"` → `"ví dụ ch.6: …"`
- `sj-gd4-w5-3` — `text` và `lesson`: `ch.3`→`ch.4` (Kafka ghi nhanh), `ch.7`→`ch.8` (isolation levels), `ch.11`→`ch.12` (outbox/CDC)
- `sj-gd4-w5-5` — `text` và `lesson`: `"quá nặng ngay ch.3"` → `"quá nặng ngay ch.4"`

- [ ] **Step 7: Thêm chip và câu `goal` ở `sj-gd4-w5`**

Thêm **đúng một** chip vào `resources` của `sj-gd4-w5` (không thêm vào tuần GĐ4 nào khác):

```js
      { label: "🗺️ Sang lĩnh vực DDIA — lộ trình đọc 12 tuần", href: "#/roadmap/ddia" },
```

Và nối vào cuối `goal` của tuần một câu làm rõ hai nhịp đọc khác nhau có chủ đích, đại ý: *lịch 6 tuần ở đây cố ý chỉ quét phần lõi ở nhịp gấp; muốn đọc đủ 14 chương thì theo lộ trình 12 tuần của lĩnh vực DDIA.*

- [ ] **Step 8: Sửa đánh số ấn bản trong tài liệu nguồn**

Trong `senior-java-roadmap/04-giai-doan-4-system-design.md`, sửa **cùng một bảng quy đổi** ở:
- dòng 91 (lịch chương T9–T14) — khớp từng chữ với `sj-gd4-w5-1`
- dòng 93 (`ví dụ ch.5:` → `ví dụ ch.6:`)
- dòng 94 (móc nối lab: `ch.3`→`ch.4`, `ch.7`→`ch.8`, `ch.11`→`ch.12`)
- dòng 95 (`quá nặng ngay ch.3` → `ch.4`)
- dòng 130 (`key-value store phân tán (áp dụng trực tiếp DDIA ch.5–6)` → `ch.6–7`)

- [ ] **Step 9: Kiểm hồi quy — số mục Senior Java KHÔNG được đổi**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **xanh toàn bộ**. Đặc biệt `roadmap-items:senior-java` vẫn là **276** — con số này nhúc nhích nghĩa là đã lỡ tay thêm/xoá mục khi sửa chữ ở Step 6–7. Nếu đỏ ở đó, hoàn tác Step 6–7 và làm lại, chỉ đổi chữ.

Kiểm thêm không còn sót đánh số ấn bản 1:

```bash
grep -n "ch\.3 (LSM\|ch\.5 (replication\|ch\.6–7 (partitioning\|ch\.8–9 (network\|ch\.11–12 (stream\|ngay ch\.3\|DDIA ch\.5–6" \
  webapp/js/data/senior-java-gd4.js senior-java-roadmap/04-giai-doan-4-system-design.md
```

Kỳ vọng: **không dòng nào**.

- [ ] **Step 10: Kiểm bằng mắt**

```bash
./webapp/dev.sh
```

1. Lĩnh vực DDIA → sidebar giờ có **Lộ trình học** → mở track DDIA: 12 tuần, tổng 48 mục, thanh tiến độ chạy.
2. Mở vài mục, xác nhận link `#/docs/ddia-NN` trong bài học nhảy đúng tài liệu và **không đổi lĩnh vực đang chọn**.
3. Chuyển sang lĩnh vực Lộ trình Senior Java → track Giai đoạn 4 → tuần 9–14: xác nhận lịch chương đã là ấn bản 2, và chip "Sang lĩnh vực DDIA" bấm được.
4. Tick thử một mục ở track DDIA, F5, xác nhận tiến độ còn nguyên (localStorage hoạt động).

- [ ] **Step 11: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js \
        webapp/js/data/senior-java-gd4.js senior-java-roadmap/04-giai-doan-4-system-design.md
git commit -m "feat: bật lộ trình DDIA 12 tuần và sửa đánh số ấn bản ở Senior Java GĐ4

Khai track ddia (12 tuần / 48 mục) và mở module roadmap cho lĩnh vực thứ 7.

Track sj-gd4 xếp lịch DDIA theo đánh số ấn bản 1 trong khi bản dịch trong
repo là ấn bản 2 — sửa cả senior-java-gd4.js lẫn tài liệu nguồn 04-giai-doan-4
theo cùng một bảng quy đổi, giữ nguyên mọi id nên tiến độ localStorage không
đổi (roadmap-items:senior-java vẫn 276).

Liên kết chéo giữ ở mức track: một chip #/roadmap/ddia ở tuần sj-gd4-w5.
Không link #/docs/ xuyên lĩnh vực — bất biến #3b cấm, và không nới nó.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Cập nhật tài liệu và số liệu

**Files:**
- Modify: `webapp/README.md`
- Modify: `README.md`
- Modify: `webapp/index.html`
- Modify: `webapp/js/views/roadmap.js` (một dòng chú thích)

**Interfaces:**
- Consumes: trạng thái cuối của Task 8 — 7 lĩnh vực, 100 tài liệu, 12 track, 620 mục lộ trình.
- Produces: không có (task cuối).

- [ ] **Step 1: Xác minh số liệu bằng dữ liệu thật, không chép từ kế hoạch**

```bash
node -e "
Promise.all([
  import('./webapp/js/data/docs-index.js'),
  import('./webapp/js/data/roadmap.js'),
  import('./webapp/js/data/fields.js'),
]).then(([d,r,f])=>{
  const per={}; for(const x of d.docs){const k=x.field??'kubernetes'; per[k]=(per[k]||0)+1;}
  console.log('lĩnh vực:', f.FIELD_ORDER.length);
  console.log('tài liệu:', d.docs.length, per);
  console.log('track:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks.flatMap(w=>w.items)).length);
})"
```

Kỳ vọng: `lĩnh vực: 7` · `tài liệu: 100` · `track: 12` · `mục lộ trình: 620`.
**Dùng chính con số in ra để sửa tài liệu.** Nếu lệch với kỳ vọng, dừng lại tìm nguyên nhân trước khi viết tài liệu — tài liệu sai số còn tệ hơn tài liệu cũ.

- [ ] **Step 2: `webapp/README.md`**

- Dòng 12: `**86 tài liệu** thuộc 6 lĩnh vực (24 Kubernetes, 18 System Programming, 10 Java & Spring Boot Scalability, 21 Spring Security, 8 Modern Concurrency in Java, 5 Lộ trình Senior Java)` → `**100 tài liệu** thuộc 7 lĩnh vực (… , 14 Designing Data-Intensive Applications, …)`, giữ đúng thứ tự `FIELD_ORDER`.
- Dòng 73: `# khai 6 lĩnh vực: label, icon, module nào bật` → `# khai 7 lĩnh vực: …`
- Trong sơ đồ cây thư mục `js/data/`, thêm 2 dòng cho `ddia-roadmap-part1.js` và `ddia-roadmap-part2.js`.

- [ ] **Step 3: `README.md` (gốc repo)**

- Dòng 82: `…bản dịch **Modern Concurrency in Java**, **Lộ trình Senior Java** … để học/ôn tập/thi thử cả sáu lĩnh vực:` → thêm `bản dịch **Designing Data-Intensive Applications**` vào danh sách và đổi `cả sáu lĩnh vực` → `cả bảy lĩnh vực`.
- Thêm dòng vào bảng thành phần, ngay trước dòng `webapp/`:

```markdown
| [`ddia-vi/`](./ddia-vi/) | Bản dịch tiếng Việt *Designing Data-Intensive Applications*, ấn bản 2 (Martin Kleppmann, O'Reilly) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 14 chương, 105 hình. Đọc trong app ở lĩnh vực Designing Data-Intensive Applications, kèm lộ trình đọc 12 tuần. |
```

- Dòng mô tả `webapp/`: `11 giáo trình, 572 mục` → `12 giáo trình, 620 mục`; `86 tài liệu` → `100 tài liệu`; thêm "Designing Data-Intensive Applications" vào danh sách lĩnh vực trong ngoặc.

- [ ] **Step 4: `webapp/index.html` dòng 7**

Thêm `Designing Data-Intensive Applications` vào `<meta name="description">`, đặt sau `Java & Spring Boot Scalability` để khớp thứ tự `FIELD_ORDER`.

- [ ] **Step 5: `webapp/js/views/roadmap.js` dòng 1**

Chú thích hiện ghi `nay là 10 track thuộc 4 lĩnh vực` — **đã lạc hậu sẵn từ trước đợt này** (thực tế trước Task 8 là 11 track / 5 lĩnh vực, không phải đếm nhầm). Sửa thành `12 track thuộc 6 lĩnh vực` và bổ sung "đọc DDIA" vào phần liệt kê.

- [ ] **Step 6: Quét sót số liệu cũ**

```bash
grep -rn "sáu lĩnh vực\|6 lĩnh vực\|86 tài liệu\|572 mục\|11 giáo trình\|10 track" \
  README.md webapp/README.md webapp/index.html webapp/js 2>/dev/null
```

Kỳ vọng: **không dòng nào**.

- [ ] **Step 7: Nghiệm thu lần cuối**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **xanh toàn bộ, 0 lỗi**. Dán nguyên output vào báo cáo.

- [ ] **Step 8: Commit**

```bash
git add README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm lĩnh vực DDIA

7 lĩnh vực, 100 tài liệu, 12 giáo trình, 620 mục lộ trình. Số liệu lấy từ
dữ liệu thật, không ước lượng.

Sửa luôn chú thích đầu views/roadmap.js vốn đã lạc hậu từ trước đợt này
(ghi 10 track / 4 lĩnh vực, thực tế đã là 11 / 5).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Phụ lục: bản đồ tuần → chương → mục

Bảng tra nhanh cho người thực thi bất kỳ task nào từ 3–7.

| Tuần | Chương | Số từ | Mục | id |
|---|---|---:|---:|---|
| `dd-w1` | ch.1 + ch.2 | 32.5k | 5 | `dd-w1-1` … `dd-w1-5` |
| `dd-w2` | ch.3 | 21.9k | 4 | `dd-w2-1` … `dd-w2-4` |
| `dd-w3` | ch.4 | 20.5k | 4 | `dd-w3-1` … `dd-w3-4` |
| `dd-w4` | ch.5 | 15.9k | 3 | `dd-w4-1` … `dd-w4-3` |
| `dd-w5` | ch.6 | 26.3k | 4 | `dd-w5-1` … `dd-w5-4` |
| `dd-w6` | ch.7 | 11.1k | 3 | `dd-w6-1` … `dd-w6-3` |
| `dd-w7` | ch.8 | 33.1k | 5 | `dd-w7-1` … `dd-w7-5` |
| `dd-w8` | ch.9 | 29.2k | 5 | `dd-w8-1` … `dd-w8-5` |
| `dd-w9` | ch.10 | 24.7k | 4 | `dd-w9-1` … `dd-w9-4` |
| `dd-w10` | ch.11 | 17.9k | 3 | `dd-w10-1` … `dd-w10-3` |
| `dd-w11` | ch.12 | 26.1k | 4 | `dd-w11-1` … `dd-w11-4` |
| `dd-w12` | ch.13 + ch.14 | 35.9k | 4 | `dd-w12-1` … `dd-w12-4` |

**Tổng: 12 tuần, 48 mục.** Part1 = tuần 1–6 = 23 mục. Part2 = tuần 7–12 = 25 mục.
