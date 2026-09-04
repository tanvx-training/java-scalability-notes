# Modern Java in Action — Lĩnh vực thứ 8 của DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Modern Java in Action* (21 chương) vào web app DevPrep thành lĩnh vực thứ 8 `modern-java`, với module `docs` (21 tài liệu) và `roadmap` (giáo trình đọc 12 tuần / 48 mục).

**Architecture:** DevPrep là web app tĩnh, không build, không dependency. Thêm một lĩnh vực = thêm dữ liệu thuần, không sửa view nào: `fields.js` là nguồn sự thật duy nhất, `dashboard.js` và sidebar đọc thẳng từ đó. Nội dung markdown nằm trong repo và được `build-content.sh` copy sang `webapp/content/` lúc dev/deploy. Toàn bộ nghiệm thu tự động do `webapp/check-data.mjs` đảm nhiệm.

**Tech Stack:** JavaScript ES modules thuần (không framework, không bundler) · Node.js ≥ 18 để chạy `check-data.mjs` · bash cho `build-content.sh` · python3 `http.server` cho dev.

**Spec:** [`docs/superpowers/specs/2026-09-05-modern-java-integration-design.md`](../specs/2026-09-05-modern-java-integration-design.md)

## Global Constraints

Mọi task đều ngầm chịu các ràng buộc sau. Đọc kỹ trước khi bắt đầu bất kỳ task nào.

- **Mọi `id` là khoá localStorage lưu tiến độ người dùng — không bao giờ đổi sau khi đã commit.** Áp dụng cho `mjia-01`…`mjia-21`, `mj-w1`…`mj-w12`, `mj-w1-1`…`mj-w12-4`, và mọi id sẵn có của lĩnh vực khác.
- **Không viết bất biến mới trong `check-data.mjs`.** Chỉ mở rộng bảng `EXPECTED.counts`. Không nới, không thêm allowlist, không sửa bất biến hiện có — kể cả khi dữ liệu mới bị nó chặn.
- **Không copy `.pdf` sang `webapp/content/`.** PDF ở lại repo làm nguồn đối chiếu.
- **Không sửa view nào** (`webapp/js/views/*.js`) ngoài một dòng chú thích ở `views/roadmap.js` (Task 8).
- **Không thêm link `#/docs/<id>` xuyên lĩnh vực.** Bất biến #3b quét cả `week.resources[].href` lẫn `item.lesson`. Liên kết từ lĩnh vực khác sang MJIA chỉ ở mức track (`#/roadmap/modern-java`).
- **Ngôn ngữ nội dung: tiếng Việt.** Thuật ngữ kỹ thuật giữ nguyên tiếng Anh khi sách giữ nguyên (lambda, stream, collector, functional interface, default method, module, backpressure…) — đúng quy ước ghi trong `modern-java-vi/QUY-TAC-DICH.md`.
- **Khối "Đọc" trong bài học trỏ anchor vào bản dịch, không chép lại nội dung sách.** Đây là kế hoạch đọc, không phải bản tóm tắt. Tên mục trích **nguyên văn** tiêu đề `##` trong tệp nguồn (kể cả số hiệu, ví dụ `"5.7. Numeric stream"`).
- **Khối "Bẫy" phải truy được về một đoạn cảnh báo có thật trong chương tương ứng.** Không bịa bẫy nghe hợp lý. Nếu đọc chương mà không tìm ra cảnh báo nào, viết bẫy từ chỗ sách nói "một quan niệm sai lầm phổ biến" / "người ta thường tưởng" — hoặc bỏ trống và báo lại, không tự chế.
- **`practice` của mỗi tuần phải nêu API hoặc listing cụ thể của chương tuần đó**, không được trôi thành lời khuyên chung chung kiểu "thực hành lambda đi". Đây là chỗ duy nhất của track chứa bài tập gõ code (spec §7.2) — hỏng nó là hỏng lý do track này khác track DDIA.
- **Bản quyền:** MJIA là sách thương mại của Manning. Mọi chỗ nhắc tới nguồn phải ghi đúng khuôn đã dùng cho `k8s-ebook`/`spring-security-vi`/`ddia-vi`: *"sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0"*.
- **Độ dài mỗi `lesson`: 250–400 từ.** Bốn khối `**Mục tiêu.** / **Đọc.** / **Bẫy.** / **Tự kiểm tra.**`, đúng thứ tự, đúng khuôn của `ddia-roadmap-part1.js`.
- **Lệnh nghiệm thu duy nhất của repo** (không có test runner nào khác — `package.json` chỉ khai `type: module`):

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

- **Luôn dán output thật của lệnh trên khi báo cáo.** Không tuyên bố "đã chạy, xanh" mà không có output.

## Ghi chú về thứ tự so với spec §9

Spec §9 xếp "khai `EXPECTED.counts`" trước khi viết dữ liệu. Kế hoạch này giữ nguyên nguyên tắc đó cho **chặng 1** (Task 2 Step 1), nhưng ở **chặng 2** dời việc khai `"roadmap-items:modern-java": 48` + wiring xuống task cuối của chặng (Task 7), sau khi 12 tuần đã viết xong.

Lý do: khai 48 từ đầu khiến `check-data.mjs` đỏ liên tục suốt 4 task viết nội dung, làm mất tác dụng tín hiệu của nó. Sự bảo vệ mà spec muốn vẫn còn nguyên — Task 7 khai 48 rồi chạy checker trên dữ liệu đã viết; nếu tổng thực tế là 47, checker đỏ đúng như spec mong đợi. Mỗi task viết tuần có lệnh đếm riêng để vẫn tự nghiệm thu được.

## Bảng phân bổ tổng — tham chiếu nhanh

| Tuần | Chương | Mục | Task |
|---|---|---:|---|
| `mj-w1` | ch.1 + ch.2 | 4 | Task 3 |
| `mj-w2` | ch.3 | 4 | Task 3 |
| `mj-w3` | ch.4 + ch.5 | 5 | Task 3 |
| `mj-w4` | ch.6 | 4 | Task 4 |
| `mj-w5` | ch.7 + ch.8 | 4 | Task 4 |
| `mj-w6` | ch.9 + ch.10 | 4 | Task 4 |
| `mj-w7` | ch.11 + ch.12 | 4 | Task 5 |
| `mj-w8` | ch.13 + ch.14 | 4 | Task 5 |
| `mj-w9` | ch.15 | 3 | Task 5 |
| `mj-w10` | ch.16 | 4 | Task 6 |
| `mj-w11` | ch.17 + ch.18 | 4 | Task 6 |
| `mj-w12` | ch.19 + ch.20 + ch.21 | 4 | Task 6 |

`mjiaWeeksPart1` = tuần 1–6 = **25 mục** · `mjiaWeeksPart2` = tuần 7–12 = **23 mục** · tổng **48**.

---

# CHẶNG 1 — Lĩnh vực sống, đọc được 21 chương

## Task 1: Chuẩn hoá nguồn sang `modern-java-vi/` và nối vào build

**Files:**
- Rename: `Modern Java In Action/vi/` → `modern-java-vi/` (21 `.md` + `README.md` + `QUY-TAC-DICH.md`)
- Rename: `Modern Java In Action/*.pdf` → `modern-java-vi/NN-slug.pdf` (21 tệp)
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có (task đầu tiên).
- Produces: 21 tệp markdown tại `modern-java-vi/NN-slug.md`; sau khi chạy build, nội dung có mặt tại `webapp/content/mjia/`. Task 2 tham chiếu chúng qua `file: "content/mjia/NN-slug.md"`.

- [ ] **Step 1: Xác nhận không nơi nào tham chiếu đường dẫn cũ**

```bash
grep -rn "Modern Java In Action" --exclude-dir=.git . \
  | grep -v "^./Modern Java In Action/" \
  | grep -v "^./docs/superpowers/"
```

Kỳ vọng: **không dòng nào** (ngoài spec/plan trong `docs/superpowers/`). Nếu có dòng khác lọt ra, dừng lại và báo — đổi tên sẽ làm gãy link đó.

- [ ] **Step 2: Chuyển thư mục `vi/` thành `modern-java-vi/`**

```bash
git mv "Modern Java In Action/vi" modern-java-vi
ls modern-java-vi
```

Kỳ vọng: 21 tệp `chuong-*.md` + `README.md` + `QUY-TAC-DICH.md`.

- [ ] **Step 3: Bỏ tiền tố `chuong-` khỏi 21 tệp markdown**

```bash
cd modern-java-vi
for f in chuong-*.md; do git mv "$f" "${f#chuong-}"; done
cd ..
ls modern-java-vi/*.md | sed 's#.*/##'
```

Kỳ vọng chính xác 23 dòng: `01-java-8-9-10-11-co-gi-moi.md` … `21-ket-luan-va-huong-di-tiep-cua-java.md`, cộng `QUY-TAC-DICH.md` và `README.md`.

- [ ] **Step 4: Chuyển 21 PDF vào cùng thư mục, đổi tên theo cùng slug**

Tên PDF nguồn chứa ký tự Unicode lạ (dấu nháy cong `’` ở ch.1, gạch dưới `_` thay dấu hai chấm). Chép nguyên khối lệnh dưới đây, **không tự gõ lại tên tệp**:

```bash
D="Modern Java In Action"
git mv "$D/Chapter 1. Java 8, 9, 10, and 11_ what’s happening_ _ Modern Java in Action.pdf"                    modern-java-vi/01-java-8-9-10-11-co-gi-moi.pdf
git mv "$D/Chapter 2. Passing code with behavior parameterization _ Modern Java in Action.pdf"                  modern-java-vi/02-truyen-code-voi-behavior-parameterization.pdf
git mv "$D/Chapter 3. Lambda expressions _ Modern Java in Action.pdf"                                          modern-java-vi/03-lambda-expressions.pdf
git mv "$D/Chapter 4. Introducing streams _ Modern Java in Action.pdf"                                          modern-java-vi/04-gioi-thieu-stream.pdf
git mv "$D/Chapter 5. Working with streams _ Modern Java in Action.pdf"                                         modern-java-vi/05-lam-viec-voi-stream.pdf
git mv "$D/Chapter 6. Collecting data with streams _ Modern Java in Action.pdf"                                 modern-java-vi/06-thu-thap-du-lieu-voi-stream.pdf
git mv "$D/Chapter 7. Parallel data processing and performance _ Modern Java in Action.pdf"                     modern-java-vi/07-xu-ly-du-lieu-song-song-va-hieu-nang.pdf
git mv "$D/Chapter 8. Collection API enhancements _ Modern Java in Action.pdf"                                  modern-java-vi/08-cai-tien-collection-api.pdf
git mv "$D/Chapter 9. Refactoring, testing, and debugging _ Modern Java in Action.pdf"                          modern-java-vi/09-refactoring-testing-va-debugging.pdf
git mv "$D/Chapter 10. Domain-specific languages using lambdas _ Modern Java in Action.pdf"                     modern-java-vi/10-domain-specific-language-voi-lambda.pdf
git mv "$D/Chapter 11. Using Optional as a better alternative to null _ Modern Java in Action.pdf"              modern-java-vi/11-dung-optional-thay-cho-null.pdf
git mv "$D/Chapter 12. New Date and Time API _ Modern Java in Action.pdf"                                       modern-java-vi/12-date-and-time-api-moi.pdf
git mv "$D/Chapter 13. Default methods _ Modern Java in Action.pdf"                                             modern-java-vi/13-default-method.pdf
git mv "$D/Chapter 14. The Java Module System _ Modern Java in Action.pdf"                                      modern-java-vi/14-he-thong-module-cua-java.pdf
git mv "$D/Chapter 15. Concepts behind CompletableFuture and reactive programming _ Modern Java in Action.pdf"  modern-java-vi/15-khai-niem-nen-tang-completablefuture-va-reactive-programming.pdf
git mv "$D/Chapter 16. CompletableFuture_ composable asynchronous programming _ Modern Java in Action.pdf"      modern-java-vi/16-completablefuture-lap-trinh-bat-dong-bo-kha-ket-hop.pdf
git mv "$D/Chapter 17. Reactive programming _ Modern Java in Action.pdf"                                        modern-java-vi/17-reactive-programming.pdf
git mv "$D/Chapter 18. Thinking functionally _ Modern Java in Action.pdf"                                       modern-java-vi/18-tu-duy-ham.pdf
git mv "$D/Chapter 19. Functional programming techniques _ Modern Java in Action.pdf"                           modern-java-vi/19-ky-thuat-lap-trinh-ham.pdf
git mv "$D/Chapter 20. Blending OOP and FP_ Comparing Java and Scala _ Modern Java in Action.pdf"               modern-java-vi/20-ket-hop-oop-va-fp-so-sanh-java-va-scala.pdf
git mv "$D/Chapter 21. Conclusions and where next for Java _ Modern Java in Action.pdf"                         modern-java-vi/21-ket-luan-va-huong-di-tiep-cua-java.pdf
rmdir "$D"
```

`rmdir` thành công chứng minh thư mục cũ đã rỗng. Nếu nó báo "Directory not empty", dừng lại: còn tệp chưa chuyển.

- [ ] **Step 5: Xác nhận 21 cặp `.md`/`.pdf` khớp slug**

```bash
diff <(ls modern-java-vi/*.md  | sed 's#.*/##; s#\.md$##'  | grep -E '^[0-9]{2}-') \
     <(ls modern-java-vi/*.pdf | sed 's#.*/##; s#\.pdf$##') && echo "OK — 21 cặp khớp slug"
```

Kỳ vọng: in ra `OK — 21 cặp khớp slug`, không dòng `<`/`>` nào.

- [ ] **Step 6: Xác nhận markdown không tham chiếu ảnh nào**

```bash
grep -c '!\[' modern-java-vi/*.md | grep -v ':0$' || echo "OK — không tệp nào chứa ảnh"
```

Kỳ vọng: in ra `OK — không tệp nào chứa ảnh`. Nếu có tệp nào ra khác 0, dừng lại — `build-content.sh` sẽ cần thêm dòng copy ảnh và spec §3 phải sửa.

- [ ] **Step 7: Nối vào `build-content.sh`**

Trong `webapp/build-content.sh`, sửa lệnh `mkdir -p` (thêm `"$DEST/mjia"` vào cuối danh sách):

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior" \
         "$DEST/modconc/images" "$DEST/ddia/images" "$DEST/mjia"
```

Và thêm **một** dòng `cp` vào cuối tệp, sau dòng `ddia-vi/images`:

```bash
cp    "$REPO"/modern-java-vi/*.md                        "$DEST/mjia/"
```

Không có dòng `cp -R images` — sách không có hình (đã xác nhận ở Step 6).

- [ ] **Step 8: Chạy build và đếm tệp đích**

```bash
./webapp/build-content.sh webapp/content && ls webapp/content/mjia | wc -l
```

Kỳ vọng: `23` (21 chương + `README.md` + `QUY-TAC-DICH.md`). Hai tệp thừa là vô hại và có tiền lệ ở `content/modconc/`: không bản ghi `docs` nào trỏ vào chúng, và bất biến #2 chỉ kiểm chiều "doc đã khai thì tệp phải tồn tại".

- [ ] **Step 9: Chạy checker để xác nhận không hồi quy**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH** — chưa khai lĩnh vực nào nên chưa có gì để đỏ. Nếu đỏ ở đây, lỗi đến từ chỗ khác, không phải task này.

- [ ] **Step 10: Commit**

```bash
git add -A modern-java-vi webapp/build-content.sh
git commit -m "chore: chuẩn hoá nguồn Modern Java in Action thành modern-java-vi/ và nối vào build-content"
```

---

## Task 2: Khai lĩnh vực `modern-java` và 21 tài liệu

**Files:**
- Modify: `webapp/check-data.mjs` (chỉ bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/docs-index.js`

**Interfaces:**
- Consumes: từ Task 1 — 21 tệp tại `webapp/content/mjia/NN-slug.md`.
- Produces: field id `modern-java`; 21 doc id `mjia-01`…`mjia-21`, mỗi bản ghi có `field: "modern-java"`. Task 3–6 trỏ anchor `#/docs/mjia-NN` từ bài học. Task 7 bật thêm module `roadmap` vào chính entry `modern-java` này.

- [ ] **Step 1: Viết bảng kỳ vọng TRƯỚC — để checker đỏ có chủ đích**

Trong `webapp/check-data.mjs`, thêm vào cuối object `EXPECTED.counts` (ngay sau 2 dòng `ddia`):

```js
    // Lĩnh vực Modern Java in Action — 21 chương sách Manning.
    "docs:modern-java": 21,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ đúng chỗ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ**, với lỗi về số lượng tài liệu lĩnh vực `modern-java` (kỳ vọng 21, thực tế 0). Đây là bước red của vòng TDD — nếu checker xanh ở đây nghĩa là bảng kỳ vọng chưa ăn, dừng lại kiểm tra Step 1.

- [ ] **Step 3: Khai lĩnh vực trong `fields.js`**

Thêm entry vào cuối object `FIELDS` (sau `ddia`):

```js
  "modern-java": {
    label: "Modern Java in Action",
    icon: "🌊",
    desc: "Bản dịch tiếng Việt Modern Java in Action (Raoul-Gabriel Urma, Mario Fusco, Alan Mycroft — Manning) — lambda, stream, collector, Optional, Date/Time API, module system, CompletableFuture và reactive, tư duy hàm.",
    certFilter: false,
    // Module "roadmap" mở ở Task 7, khi đã có đủ 48 mục lộ trình.
    modules: ["dashboard", "docs"],
    externalRef: { label: "dev.java", href: "https://dev.java/" },
  },
```

Và chèn `"modern-java"` vào `FIELD_ORDER`, ngay sau `"java"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "ddia", "modern-concurrency", "spring-security", "senior-java"];
```

- [ ] **Step 4: Cập nhật chú thích đầu `docs-index.js`**

Dòng 2–4 hiện liệt kê các thư mục nguồn. Thêm `modern-java-vi/` vào cuối danh sách:

```js
// Thư viện tài liệu — nhóm theo lĩnh vực.
// File nguồn nằm trong repo (CKAD/, CKA/, CKS/, "Chủ đề …", System_Programming_VI/,
// k8s-ebook/, spring-security-vi/, modern-concurrency-vi/, ddia-vi/,
// modern-java-vi/); khi deploy (hoặc chạy dev.sh) chúng được copy vào
// webapp/content/ bởi build-content.sh.
```

- [ ] **Step 5: Viết 21 bản ghi tài liệu**

Trong `webapp/js/data/docs-index.js`, thêm vào cuối mảng `docs` (sau nhóm DDIA), mở đầu bằng comment nhóm. `desc` dưới đây là bản chốt — dùng nguyên văn, không viết lại:

```js
  // ===== Modern Java in Action (Raoul-Gabriel Urma, Mario Fusco, Alan Mycroft — Manning) =====
  // Bản dịch tiếng Việt, thư mục nguồn: modern-java-vi/
  {
    id: "mjia-01",
    field: "modern-java",
    title: "MJIA 01 — Java 8, 9, 10 và 11: có gì mới?",
    file: "content/mjia/01-java-8-9-10-11-co-gi-moi.md",
    icon: "🚀",
    desc: "Vì sao một ngôn ngữ 20 năm tuổi lại phải đổi, và ba thay đổi lớn nhất — hàm là giá trị, stream, default method — trả lời sức ép nào.",
    tags: ["Java 8", "Lambda", "Stream"],
  },
  {
    id: "mjia-02",
    field: "modern-java",
    title: "MJIA 02 — Truyền code với behavior parameterization",
    file: "content/mjia/02-truyen-code-voi-behavior-parameterization.md",
    icon: "🎯",
    desc: "Làm sao viết code chịu được yêu cầu đổi liên tục, bằng cách truyền hành vi vào thay vì thêm tham số và nhánh if.",
    tags: ["Behavior parameterization", "Strategy", "Anonymous class"],
  },
  {
    id: "mjia-03",
    field: "modern-java",
    title: "MJIA 03 — Lambda expressions",
    file: "content/mjia/03-lambda-expressions.md",
    icon: "✨",
    desc: "Lambda dùng được ở đâu và vì sao chỉ ở đó, functional interface hoạt động thế nào, và method reference gọn hơn lambda chỗ nào.",
    tags: ["Lambda", "Functional interface", "Method reference"],
  },
  {
    id: "mjia-04",
    field: "modern-java",
    title: "MJIA 04 — Giới thiệu về stream",
    file: "content/mjia/04-gioi-thieu-stream.md",
    icon: "💧",
    desc: "Stream khác collection ở ba điểm nào, vì sao nó chỉ duyệt được một lần, và pipeline chỉ chạy khi gặp thao tác kết thúc.",
    tags: ["Stream", "Lazy", "Internal iteration"],
  },
  {
    id: "mjia-05",
    field: "modern-java",
    title: "MJIA 05 — Làm việc với stream",
    file: "content/mjia/05-lam-viec-voi-stream.md",
    icon: "🔎",
    desc: "Bộ thao tác dùng hằng ngày — filter, slicing, map/flatMap, matching, reduce — và numeric stream để tránh chi phí boxing.",
    tags: ["filter", "flatMap", "reduce"],
  },
  {
    id: "mjia-06",
    field: "modern-java",
    title: "MJIA 06 — Thu thập dữ liệu với stream",
    file: "content/mjia/06-thu-thap-du-lieu-voi-stream.md",
    icon: "🧺",
    desc: "Collector làm gì ở cuối pipeline, cách gom nhóm nhiều tầng bằng downstream collector, và khi nào phải tự viết Collector.",
    tags: ["Collector", "groupingBy", "partitioningBy"],
  },
  {
    id: "mjia-07",
    field: "modern-java",
    title: "MJIA 07 — Xử lý dữ liệu song song và hiệu năng",
    file: "content/mjia/07-xu-ly-du-lieu-song-song-va-hieu-nang.md",
    icon: "⚡",
    desc: "Khi nào parallelStream thật sự nhanh hơn và khi nào nó chậm hơn tuần tự, fork/join chia việc ra sao, spliterator quyết định gì.",
    tags: ["Parallel stream", "Fork/Join", "Spliterator"],
  },
  {
    id: "mjia-08",
    field: "modern-java",
    title: "MJIA 08 — Các cải tiến của Collection API",
    file: "content/mjia/08-cai-tien-collection-api.md",
    icon: "📦",
    desc: "Collection factory tạo collection bất biến, các default method mới của List/Set/Map, và những gì ConcurrentHashMap được thêm.",
    tags: ["Collection factory", "List.of", "ConcurrentHashMap"],
  },
  {
    id: "mjia-09",
    field: "modern-java",
    title: "MJIA 09 — Refactoring, testing và debugging",
    file: "content/mjia/09-refactoring-testing-va-debugging.md",
    icon: "🧹",
    desc: "Đưa code cũ sang lambda/stream mà không làm nó khó đọc hơn, viết lại design pattern OOP bằng lambda, và đọc stack trace của code hàm.",
    tags: ["Refactoring", "Testing", "Debugging"],
  },
  {
    id: "mjia-10",
    field: "modern-java",
    title: "MJIA 10 — Domain-specific language với lambda",
    file: "content/mjia/10-domain-specific-language-voi-lambda.md",
    icon: "🗣️",
    desc: "DSL nội bộ trong Java được dựng bằng những pattern nào, và các thư viện thật (jOOQ, Cucumber, Spring Integration) chọn pattern nào.",
    tags: ["DSL", "Fluent API", "Method chaining"],
  },
  {
    id: "mjia-11",
    field: "modern-java",
    title: "MJIA 11 — Dùng Optional thay cho null",
    file: "content/mjia/11-dung-optional-thay-cho-null.md",
    icon: "🎁",
    desc: "Vì sao null là một lỗi thiết kế, Optional mô hình hoá sự vắng mặt thế nào, và các khuôn mẫu dùng nó mà không biến code thành đống if mới.",
    tags: ["Optional", "null", "orElse"],
  },
  {
    id: "mjia-12",
    field: "modern-java",
    title: "MJIA 12 — Date and Time API mới",
    file: "content/mjia/12-date-and-time-api-moi.md",
    icon: "🕰️",
    desc: "Bộ kiểu bất biến thay cho Date/Calendar, cách thao tác và định dạng ngày tháng, và làm việc với time zone cùng hệ lịch khác.",
    tags: ["LocalDate", "Duration", "ZoneId"],
  },
  {
    id: "mjia-13",
    field: "modern-java",
    title: "MJIA 13 — Default method",
    file: "content/mjia/13-default-method.md",
    icon: "🧩",
    desc: "Cách thêm phương thức vào interface đã phát hành mà không phá code người dùng, và ba quy tắc gỡ xung đột khi nhiều interface cùng cho một default.",
    tags: ["Default method", "Diamond problem", "API evolution"],
  },
  {
    id: "mjia-14",
    field: "modern-java",
    title: "MJIA 14 — Hệ thống module của Java",
    file: "content/mjia/14-he-thong-module-cua-java.md",
    icon: "🧱",
    desc: "Vấn đề mà package và JAR không giải được, module-info khai gì, và cách biên dịch, đóng gói, chạy một ứng dụng nhiều module.",
    tags: ["Module", "module-info", "requires/exports"],
  },
  {
    id: "mjia-15",
    field: "modern-java",
    title: "MJIA 15 — Khái niệm nền tảng của CompletableFuture và reactive programming",
    file: "content/mjia/15-khai-niem-nen-tang-completablefuture-va-reactive-programming.md",
    icon: "🧠",
    desc: "API đồng bộ khác bất đồng bộ ở đâu, mô hình box-and-channel để nghĩ về luồng dữ liệu, và reactive programming khác reactive system chỗ nào.",
    tags: ["Concurrency", "Future", "Reactive"],
  },
  {
    id: "mjia-16",
    field: "modern-java",
    title: "MJIA 16 — CompletableFuture: lập trình bất đồng bộ khả kết hợp",
    file: "content/mjia/16-completablefuture-lap-trinh-bat-dong-bo-kha-ket-hop.md",
    icon: "🔗",
    desc: "Dựng API bất đồng bộ, nối ống nhiều lời gọi bằng thenCompose/thenCombine, và chọn executor sao cho không tự bóp cổ chính mình.",
    tags: ["CompletableFuture", "thenCompose", "Non-blocking"],
  },
  {
    id: "mjia-17",
    field: "modern-java",
    title: "MJIA 17 — Reactive programming",
    file: "content/mjia/17-reactive-programming.md",
    icon: "📡",
    desc: "Bốn tính chất của Reactive Manifesto, bốn interface của Flow API, backpressure giải quyết vấn đề gì, và RxJava dùng thế nào.",
    tags: ["Flow API", "Backpressure", "RxJava"],
  },
  {
    id: "mjia-18",
    field: "modern-java",
    title: "MJIA 18 — Tư duy hàm",
    file: "content/mjia/18-tu-duy-ham.md",
    icon: "🧮",
    desc: "Hàm thuần và tính trong suốt tham chiếu nghĩa là gì trong Java thật, và đệ quy đổi lấy được gì so với vòng lặp.",
    tags: ["Pure function", "Referential transparency", "Recursion"],
  },
  {
    id: "mjia-19",
    field: "modern-java",
    title: "MJIA 19 — Các kỹ thuật lập trình hàm",
    file: "content/mjia/19-ky-thuat-lap-trinh-ham.md",
    icon: "🪄",
    desc: "Hàm bậc cao và currying, cấu trúc dữ liệu bền vững, lazy evaluation tự cài, và pattern matching mô phỏng bằng lambda.",
    tags: ["Currying", "Persistent data structure", "Pattern matching"],
  },
  {
    id: "mjia-20",
    field: "modern-java",
    title: "MJIA 20 — Kết hợp OOP và FP: so sánh Java và Scala",
    file: "content/mjia/20-ket-hop-oop-va-fp-so-sanh-java-va-scala.md",
    icon: "⚖️",
    desc: "Scala làm gọn hơn Java ở chỗ nào với cùng một bài toán, và trait khác interface có default method ra sao.",
    tags: ["Scala", "Trait", "So sánh"],
  },
  {
    id: "mjia-21",
    field: "modern-java",
    title: "MJIA 21 — Kết luận và hướng đi tiếp của Java",
    file: "content/mjia/21-ket-luan-va-huong-di-tiep-cua-java.md",
    icon: "🏁",
    desc: "Điểm lại toàn bộ tính năng Java 8–10 đã học và những hướng ngôn ngữ đang đi tiếp: pattern matching, value type, generic đặc hoá.",
    tags: ["Java 9/10/11", "Tổng kết", "Tương lai"],
  },
```

- [ ] **Step 6: Chạy nghiệm thu đầy đủ để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**. Các bất biến phải thấy xanh ở đây: `docs:modern-java` = 21, #1 (id duy nhất), #2 (21 tệp tồn tại trên đĩa), N3 (`EXPECTED.counts` phủ mọi lĩnh vực khai module), `FIELD_ORDER` khớp `FIELDS` 1-1, #7/#7b (module ↔ dữ liệu hai chiều).

Nếu #7b đỏ với thông báo về module `roadmap`: nghĩa là đã lỡ khai `"roadmap"` trong `modules` ở Step 3 — bỏ nó ra, việc đó thuộc Task 7.

- [ ] **Step 7: Kiểm bằng mắt**

```bash
./webapp/dev.sh
```

Mở trình duyệt, chọn lĩnh vực **Modern Java in Action** ở sidebar. Xác nhận:
1. Bảng điều khiển hiện 21 tài liệu, không hiện mục "Lộ trình học" (chưa bật).
2. Mở `MJIA 06 — Thu thập dữ liệu với stream` và `MJIA 16 — CompletableFuture` — hai chương nhiều code nhất. Xác nhận highlight cú pháp Java chạy và mục lục nổi dựng đúng các mục `6.1`…`6.6` / `16.1`…`16.6`.
3. Chân sidebar hiện liên kết `dev.java`.

- [ ] **Step 8: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/fields.js webapp/js/data/docs-index.js
git commit -m "feat: khai lĩnh vực modern-java và 21 tài liệu Modern Java in Action"
```

---

# CHẶNG 2 — Giáo trình đọc 12 tuần

Bốn task viết nội dung (3–6) đều theo cùng một nhịp: đọc chương nguồn → viết khối tuần → đếm mục → kiểm anchor → commit. Khuôn `lesson` và ràng buộc nội dung nằm ở **Global Constraints**, đọc lại trước mỗi task.

Mẫu tham chiếu bắt buộc: `webapp/js/data/ddia-roadmap-part1.js` — mở nó ra xem một khối tuần hoàn chỉnh trông thế nào trước khi gõ dòng đầu tiên.

## Task 3: Lộ trình tuần 1–3 (13 mục)

**Files:**
- Create: `webapp/js/data/mjia-roadmap-part1.js`

**Interfaces:**
- Consumes: từ Task 2 — doc id `mjia-01`…`mjia-05` để trỏ anchor `#/docs/mjia-NN`.
- Produces: `export const mjiaWeeksPart1` — mảng khối tuần. Task 4 nối thêm tuần 4–6 vào **cùng mảng này**. Task 7 import tên `mjiaWeeksPart1` từ tệp này.

- [ ] **Step 1: Đọc 5 chương nguồn**

Đọc `modern-java-vi/01-java-8-9-10-11-co-gi-moi.md`, `02-truyen-code-voi-behavior-parameterization.md`, `03-lambda-expressions.md`, `04-gioi-thieu-stream.md`, `05-lam-viec-voi-stream.md`. Ghi lại tên chính xác của các mục `##` — khối "Đọc" trích nguyên văn tên mục kèm số hiệu, không tự đặt lại.

- [ ] **Step 2: Tạo tệp với header**

Tạo `webapp/js/data/mjia-roadmap-part1.js`, mở đầu bằng:

```js
// Lộ trình đọc Modern Java in Action — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Modern Java in Action" (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Thư mục nguồn: modern-java-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần gõ code nằm ở `practice` mức tuần, không thành khối thứ 5 trong `lesson`.
// GIỮ NGUYÊN id (mj-w<N> / mj-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const mjiaWeeksPart1 = [
  // … 3 khối tuần ở Step 3–5, thêm 3 khối nữa ở Task 4 …
];
```

- [ ] **Step 3: Viết tuần 1 — `mj-w1`, 4 mục (ch.1 + ch.2)**

`title`: `"Java 8+ đổi gì, và ý tưởng truyền hành vi"`
`resources`: trỏ `#/docs/mjia-01`, `#/docs/mjia-02`, và `{ label: "dev.java — Java Platform", href: "https://dev.java/" }`.
`practice`: dựng dự án Java 17+ trống, chép listing "lọc quả táo xanh" ở §2.1 vào rồi tự tay đi hết bốn bước refactor của chương (tham số màu → tham số Predicate → anonymous class → lambda), giữ cả bốn phiên bản trong bốn method để so độ dài.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w1-1` | Vì sao một ngôn ngữ 20 năm tuổi vẫn phải đổi | ch.1 §"1.1. Vậy câu chuyện lớn ở đây là gì?" + §"1.2. Vì sao Java vẫn tiếp tục thay đổi?" |
| `mj-w1-2` | Hàm trở thành giá trị hạng nhất | ch.1 §"1.3. Hàm trong Java" |
| `mj-w1-3` | Stream, default method, và những ý tưởng mượn từ FP | ch.1 §"1.4. Streams" + §"1.5. Default method và Java module" + §"1.6. Những ý tưởng hay khác từ functional programming" |
| `mj-w1-4` | Behavior parameterization: từ thêm tham số tới truyền hành vi | ch.2 §"2.1. Đối phó với các yêu cầu luôn thay đổi" → §"2.4. Các ví dụ thực tế" (cả bốn mục) |

- [ ] **Step 4: Viết tuần 2 — `mj-w2`, 4 mục (ch.3)**

`title`: `"Lambda expression và functional interface"` · `resources` trỏ `#/docs/mjia-03`.
`practice`: viết lại execute-around pattern ở §3.3 cho một tài nguyên thật trong code của bạn (kết nối DB, file, HTTP client); rồi thay `Runnable` bằng một functional interface tự khai có kiểu trả về, và ghép hai hàm bằng `andThen` để thấy khác biệt.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w2-1` | Lambda là gì, và vì sao chỉ dùng được ở chỗ có functional interface | ch.3 §"3.1. Tổng quan nhanh về lambda" + §"3.2. Dùng lambda ở đâu và như thế nào" |
| `mj-w2-2` | Execute-around, và bộ functional interface có sẵn của JDK | ch.3 §"3.3. Đưa lambda vào thực tế: execute-around pattern" + §"3.4. Sử dụng functional interface" |
| `mj-w2-3` | Kiểm tra kiểu, suy luận kiểu, và luật effectively final | ch.3 §"3.5. Kiểm tra kiểu, suy luận kiểu và các hạn chế" |
| `mj-w2-4` | Method reference, constructor reference, và ghép lambda | ch.3 §"3.6. Method reference" + §"3.7. Đưa lambda và method reference vào thực tế" + §"3.8. Những phương thức hữu ích để kết hợp lambda expression" (§3.9 đọc lướt) |

- [ ] **Step 5: Viết tuần 3 — `mj-w3`, 5 mục (ch.4 + ch.5)**

`title`: `"Stream: khái niệm và bộ thao tác trung gian"` · `resources` trỏ `#/docs/mjia-04` và `#/docs/mjia-05`.
`practice`: lấy một class domain thật trong dự án của bạn, dựng danh sách ~20 phần tử, rồi viết bằng stream năm truy vấn của §5.6 ("Đưa tất cả vào thực hành"); sau đó chạy lại đúng năm truy vấn đó bằng vòng lặp `for` và so số dòng.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w3-1` | Stream là gì, và ba điểm nó khác collection | ch.4 §"4.1. Stream là gì?" + §"4.2. Bắt đầu với stream" + §"4.3. Stream so với collection" |
| `mj-w3-2` | Thao tác trung gian, thao tác kết thúc, và tính lười | ch.4 §"4.4. Các thao tác stream" + §"4.5. Lộ trình phía trước" |
| `mj-w3-3` | filter, slicing, map và flatMap | ch.5 §"5.1. Filtering" + §"5.2. Cắt lát (slicing) một stream" + §"5.3. Mapping" |
| `mj-w3-4` | Finding/matching short-circuit, và reduce | ch.5 §"5.4. Finding và matching" + §"5.5. Reducing" + §"5.6. Đưa tất cả vào thực hành" |
| `mj-w3-5` | Numeric stream tránh boxing, và các cách dựng stream | ch.5 §"5.7. Numeric stream" + §"5.8. Xây dựng stream" + §"5.9. Tổng quan" |

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/mjia-roadmap-part1.js').then(m=>{
  const w=m.mjiaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 13` và `mj-w1:4 mj-w2:4 mj-w3:5`

- [ ] **Step 7: Kiểm mọi anchor `#/docs/` trỏ tài liệu có thật và cùng lĩnh vực**

```bash
node -e "
import('./webapp/js/data/mjia-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const byId=new Map(docs.map(d=>[d.id,d]));
  const bad=[];
  const scan=(owner,s)=>{ for(const x of String(s).matchAll(/#\/docs\/([\w-]+)/g)){
    const d=byId.get(x[1]);
    if(!d) bad.push(owner+' → '+x[1]+' (không tồn tại)');
    else if(d.field!=='modern-java') bad.push(owner+' → '+x[1]+' (lĩnh vực '+d.field+')');
  }};
  for(const w of m.mjiaWeeksPart1){
    for(const r of w.resources??[]) scan(w.id, r.href);
    for(const it of w.items) scan(it.id, it.lesson);
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — mọi anchor hợp lệ và cùng lĩnh vực');
})"
```

Kỳ vọng: `OK — mọi anchor hợp lệ và cùng lĩnh vực`.

- [ ] **Step 8: Kiểm độ dài `lesson` nằm trong khung 250–400 từ**

```bash
node -e "import('./webapp/js/data/mjia-roadmap-part1.js').then(m=>{
  const out=m.mjiaWeeksPart1.flatMap(w=>w.items).map(i=>[i.id, i.lesson.trim().split(/\s+/).length]);
  const bad=out.filter(([,n])=>n<250||n>400);
  console.log(out.map(([a,b])=>a+':'+b).join(' '));
  console.log(bad.length? 'NGOÀI KHUNG: '+bad.map(([a,b])=>a+'='+b).join(', ') : 'OK — mọi lesson trong khung 250-400 từ');
})"
```

Kỳ vọng: `OK — mọi lesson trong khung 250-400 từ`. Nếu có mục lệch, sửa mục đó rồi chạy lại.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/mjia-roadmap-part1.js
git commit -m "feat: lộ trình đọc Modern Java in Action tuần 1-3 — 13 mục"
```

---

## Task 4: Lộ trình tuần 4–6 (12 mục) — part1 đủ 25 mục

**Files:**
- Modify: `webapp/js/data/mjia-roadmap-part1.js`

**Interfaces:**
- Consumes: `mjiaWeeksPart1` từ Task 3 (3 khối tuần đã có); doc id `mjia-06`…`mjia-10`.
- Produces: `mjiaWeeksPart1` đủ 6 tuần / **25 mục**. Task 7 import tên này.

- [ ] **Step 1: Đọc 5 chương nguồn**

Đọc `modern-java-vi/06-thu-thap-du-lieu-voi-stream.md`, `07-xu-ly-du-lieu-song-song-va-hieu-nang.md`, `08-cai-tien-collection-api.md`, `09-refactoring-testing-va-debugging.md`, `10-domain-specific-language-voi-lambda.md`.

- [ ] **Step 2: Viết tuần 4 — `mj-w4`, 4 mục (ch.6)**

Nối vào **cuối** mảng `mjiaWeeksPart1`, sau `mj-w3`.

`title`: `"Collector — thu thập, nhóm, phân hoạch"` · `resources` trỏ `#/docs/mjia-06`.
`practice`: lấy ba vòng lặp `for` gom nhóm trong code thật của bạn và viết lại bằng `groupingBy` kèm downstream collector (`counting`, `mapping`, `summingInt`); giữ cả hai bản và so kết quả trên cùng dữ liệu đầu vào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w4-1` | Collector làm gì ở cuối pipeline: đếm, tổng, nối chuỗi, reduce | ch.6 §"6.1. Tổng quan nhanh về collector" + §"6.2. Reduce và summarize" |
| `mj-w4-2` | groupingBy nhiều tầng và downstream collector | ch.6 §"6.3. Grouping" |
| `mj-w4-3` | partitioningBy, và khi nào nó hơn groupingBy | ch.6 §"6.4. Partitioning" |
| `mj-w4-4` | Interface Collector, và tự viết collector cho hiệu năng | ch.6 §"6.5. Interface Collector" + §"6.6. Xây dựng collector của riêng bạn để có hiệu năng tốt hơn" |

- [ ] **Step 3: Viết tuần 5 — `mj-w5`, 4 mục (ch.7 + ch.8)**

`title`: `"Parallel stream, spliterator, và Collection API mới"` · `resources` trỏ `#/docs/mjia-07`, `#/docs/mjia-08`, và `{ label: "openjdk.org — JMH", href: "https://openjdk.org/projects/code-tools/jmh/" }`.
`practice`: chạy benchmark tổng 1..10 triệu của §7.1 bằng ba cách (vòng lặp, `Stream.iterate().parallel()`, `LongStream.rangeClosed().parallel()`) và đo bằng JMH — không đo bằng `System.nanoTime()` thủ công; ghi lại con số của chính máy bạn.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w5-1` | parallelStream: khi nào nhanh hơn, khi nào chậm hơn hẳn | ch.7 §"7.1. Parallel streams" |
| `mj-w5-2` | Fork/join framework và work stealing | ch.7 §"7.2. Fork/join framework" |
| `mj-w5-3` | Spliterator — thứ quyết định stream chia dữ liệu thế nào | ch.7 §"7.3. Spliterator" |
| `mj-w5-4` | Collection factory và các default method mới của List/Set/Map | ch.8 §"8.1. Collection factories" → §"8.4. ConcurrentHashMap được cải tiến" (cả bốn mục) |

- [ ] **Step 4: Viết tuần 6 — `mj-w6`, 4 mục (ch.9 + ch.10)**

`title`: `"Refactoring/test/debug code hàm, và DSL bằng lambda"` · `resources` trỏ `#/docs/mjia-09` và `#/docs/mjia-10`.
`practice`: chọn một chỗ trong dự án đang dùng Strategy hoặc Template Method, viết lại bằng lambda theo §9.2, rồi viết unit test cho hành vi lambda đó theo §9.3; cuối cùng chèn `peek()` vào một pipeline dài để xem giá trị chảy qua từng bước.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w6-1` | Refactor code cũ sang lambda/stream, và viết lại design pattern OOP | ch.9 §"9.1. Refactoring để cải thiện tính dễ đọc và tính linh hoạt" + §"9.2. Refactoring các design pattern hướng đối tượng bằng lambda" |
| `mj-w6-2` | Test và debug code dùng lambda — stack trace khó đọc, peek() | ch.9 §"9.3. Testing lambda" + §"9.4. Debugging" |
| `mj-w6-3` | DSL là gì, và những DSL nhỏ đã nằm sẵn trong API Java hiện đại | ch.10 §"10.1. Một ngôn ngữ riêng cho lĩnh vực của bạn" + §"10.2. Các DSL nhỏ trong API Java hiện đại" |
| `mj-w6-4` | Các pattern dựng DSL trong Java, và DSL thật ngoài đời | ch.10 §"10.3. Các pattern và kỹ thuật tạo DSL trong Java" + §"10.4. DSL Java 8 trong thế giới thực" |

- [ ] **Step 5: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/mjia-roadmap-part1.js').then(m=>{
  const w=m.mjiaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 6 | mục: 25` và `mj-w1:4 mj-w2:4 mj-w3:5 mj-w4:4 mj-w5:4 mj-w6:4`

- [ ] **Step 6: Kiểm anchor và độ dài lesson**

Chạy lại **nguyên văn** hai lệnh ở Task 3 Step 7 và Step 8 (chúng quét cả mảng, nên tự phủ 3 tuần mới).
Kỳ vọng: `OK — mọi anchor hợp lệ và cùng lĩnh vực` và `OK — mọi lesson trong khung 250-400 từ`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/mjia-roadmap-part1.js
git commit -m "feat: lộ trình đọc Modern Java in Action tuần 4-6 — part1 đủ 25 mục"
```

---

## Task 5: Lộ trình tuần 7–9 (11 mục)

**Files:**
- Create: `webapp/js/data/mjia-roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `mjia-11`…`mjia-15`.
- Produces: `export const mjiaWeeksPart2` — mảng khối tuần 7–9. Task 6 nối thêm tuần 10–12 vào **cùng mảng này**. Task 7 import tên `mjiaWeeksPart2` từ tệp này.

- [ ] **Step 1: Đọc 5 chương nguồn**

Đọc `modern-java-vi/11-dung-optional-thay-cho-null.md`, `12-date-and-time-api-moi.md`, `13-default-method.md`, `14-he-thong-module-cua-java.md`, `15-khai-niem-nen-tang-completablefuture-va-reactive-programming.md`.

- [ ] **Step 2: Tạo tệp với header**

```js
// Lộ trình đọc Modern Java in Action — Phần 2 (Tuần 7–12).
//
// Nguồn: bản dịch tiếng Việt "Modern Java in Action" (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Thư mục nguồn: modern-java-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần gõ code nằm ở `practice` mức tuần, không thành khối thứ 5 trong `lesson`.
// GIỮ NGUYÊN id (mj-w<N> / mj-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const mjiaWeeksPart2 = [
  // … 3 khối tuần ở Step 3–5, thêm 3 khối nữa ở Task 6 …
];
```

- [ ] **Step 3: Viết tuần 7 — `mj-w7`, 4 mục (ch.11 + ch.12)**

`title`: `"Optional thay null, và Date/Time API"` · `resources` trỏ `#/docs/mjia-11` và `#/docs/mjia-12`.
`practice`: lấy một chuỗi truy cập lồng nhau trong code của bạn đang phải kiểm `null` từng tầng (kiểu `a.getB().getC().getD()`), viết lại bằng `Optional` với `map`/`flatMap` theo §11.3; rồi thay mọi `Date`/`Calendar` trong một class sang `LocalDate`/`Instant` và ghi lại chỗ nào compile hỏng.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w7-1` | Vì sao null là lỗi thiết kế, và Optional mô hình hoá sự vắng mặt thế nào | ch.11 §"11.1. Làm sao để mô hình hoá sự vắng mặt của một giá trị?" + §"11.2. Giới thiệu class Optional" |
| `mj-w7-2` | Khuôn mẫu dùng Optional, và Optional trong API thực tế | ch.11 §"11.3. Các khuôn mẫu để áp dụng Optional" + §"11.4. Các ví dụ thực tế về việc dùng Optional" |
| `mj-w7-3` | Bộ kiểu bất biến: LocalDate, LocalTime, Instant, Duration, Period | ch.12 §"12.1. LocalDate, LocalTime, LocalDateTime, Instant, Duration và Period" |
| `mj-w7-4` | Thao tác, parse, định dạng ngày tháng, và time zone | ch.12 §"12.2. Thao tác, parse và định dạng ngày tháng" + §"12.3. Làm việc với các time zone và hệ lịch khác nhau" |

- [ ] **Step 4: Viết tuần 8 — `mj-w8`, 4 mục (ch.13 + ch.14)**

`title`: `"Default method và hệ thống module"` · `resources` trỏ `#/docs/mjia-13`, `#/docs/mjia-14`, và `{ label: "openjdk.org — JEP 261: Module System", href: "https://openjdk.org/jeps/261" }`.
`practice`: tự tay dựng lại ví dụ hai module của §14.4–§14.6 — viết `module-info.java` cho cả hai, biên dịch bằng `javac --module-source-path`, đóng gói bằng `jar`, chạy bằng `java --module-path`; rồi cố tình bỏ một `requires` để xem thông báo lỗi trông thế nào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w8-1` | Tiến hoá API mà không phá code người dùng | ch.13 §"13.1. Tiến hoá các API" + §"13.2. Default method — tóm tắt nhanh" |
| `mj-w8-2` | Ba mẫu dùng default method, và luật gỡ xung đột kim cương | ch.13 §"13.3. Các mẫu sử dụng cho default method" + §"13.4. Các quy tắc giải quyết xung đột" |
| `mj-w8-3` | Vì sao có module system, và module-info khai gì | ch.14 §"14.1. Động lực thúc đẩy: suy luận về phần mềm" → §"14.4. Phát triển một ứng dụng với Java Module System" |
| `mj-w8-4` | Nhiều module, biên dịch, đóng gói, automatic module | ch.14 §"14.5. Làm việc với nhiều module" → §"14.9. Một ví dụ lớn hơn và nơi tìm hiểu thêm" |

- [ ] **Step 5: Viết tuần 9 — `mj-w9`, 3 mục (ch.15)**

`title`: `"Nền tảng: thread, future, reactive manifesto"` · `resources` trỏ `#/docs/mjia-15`.
`practice`: tuần này không gõ code mới. Thay vào đó vẽ tay sơ đồ box-and-channel (§15.3) cho **một** luồng gọi thật trong hệ thống của bạn — mỗi hộp là một lời gọi từ xa, mỗi kênh là dữ liệu đi giữa chúng — rồi đánh dấu hộp nào đang chặn thread và hộp nào không. Sơ đồ này là đầu vào cho bài tập tuần 10.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w9-1` | Java biểu diễn concurrency qua các đời, và chi phí thật của một thread | ch.15 §"15.1. Sự tiến hoá của Java trong việc hỗ trợ biểu diễn concurrency" |
| `mj-w9-2` | Đồng bộ so với bất đồng bộ, và mô hình box-and-channel | ch.15 §"15.2. API synchronous và asynchronous" + §"15.3. Mô hình hộp và kênh (box-and-channel)" + §"15.4. CompletableFuture và các combinator cho concurrency" |
| `mj-w9-3` | Publish-subscribe, và reactive system khác reactive programming | ch.15 §"15.5. Publish-subscribe và reactive programming" + §"15.6. Reactive system so với reactive programming" + §"15.7. Lộ trình" |

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/mjia-roadmap-part2.js').then(m=>{
  const w=m.mjiaWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 11` và `mj-w7:4 mj-w8:4 mj-w9:3`

- [ ] **Step 7: Kiểm anchor và độ dài lesson**

Chạy lại hai lệnh ở Task 3 Step 7 và Step 8, **đổi `mjia-roadmap-part1.js` → `mjia-roadmap-part2.js` và `mjiaWeeksPart1` → `mjiaWeeksPart2`** ở cả hai chỗ trong mỗi lệnh.
Kỳ vọng: `OK — mọi anchor hợp lệ và cùng lĩnh vực` và `OK — mọi lesson trong khung 250-400 từ`.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/mjia-roadmap-part2.js
git commit -m "feat: lộ trình đọc Modern Java in Action tuần 7-9 — 11 mục"
```

---

## Task 6: Lộ trình tuần 10–12 (12 mục) — part2 đủ 23 mục

**Files:**
- Modify: `webapp/js/data/mjia-roadmap-part2.js`

**Interfaces:**
- Consumes: `mjiaWeeksPart2` từ Task 5 (3 khối tuần đã có); doc id `mjia-16`…`mjia-21`.
- Produces: `mjiaWeeksPart2` đủ 6 tuần / **23 mục**; tổng toàn track = 48.

- [ ] **Step 1: Đọc 6 chương nguồn**

Đọc `modern-java-vi/16-completablefuture-lap-trinh-bat-dong-bo-kha-ket-hop.md`, `17-reactive-programming.md`, `18-tu-duy-ham.md`, `19-ky-thuat-lap-trinh-ham.md`, `20-ket-hop-oop-va-fp-so-sanh-java-va-scala.md`, `21-ket-luan-va-huong-di-tiep-cua-java.md`.

- [ ] **Step 2: Viết tuần 10 — `mj-w10`, 4 mục (ch.16)**

Nối vào **cuối** mảng `mjiaWeeksPart2`, sau `mj-w9`.

`title`: `"CompletableFuture — kết hợp tác vụ bất đồng bộ"` · `resources` trỏ `#/docs/mjia-16`.
`practice`: cầm sơ đồ box-and-channel vẽ ở tuần 9, cài lại đúng luồng đó bằng `CompletableFuture`: `supplyAsync` cho từng lời gọi từ xa, `thenCombine` cho hai lời gọi độc lập, `thenCompose` cho hai lời gọi phụ thuộc; đo tổng thời gian với executor mặc định rồi với executor riêng có kích thước pool theo công thức ở §16.3, và ghi lại chênh lệch.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w10-1` | Future đơn giản, giới hạn của nó, và cách dựng API bất đồng bộ | ch.16 §"16.1. Sử dụng Future một cách đơn giản" + §"16.2. Cài đặt một API bất đồng bộ" |
| `mj-w10-2` | Làm code non-blocking, và chọn executor cho đúng | ch.16 §"16.3. Làm cho code của bạn trở nên non-blocking" |
| `mj-w10-3` | Nối ống task: thenCompose, thenCombine, ghép với API đồng bộ | ch.16 §"16.4. Nối ống các task bất đồng bộ" |
| `mj-w10-4` | Phản ứng khi hoàn tất, và các combinator còn lại | ch.16 §"16.5. Phản ứng lại sự hoàn tất của một CompletableFuture" + §"16.6. Lộ trình phía trước" |

- [ ] **Step 3: Viết tuần 11 — `mj-w11`, 4 mục (ch.17 + ch.18)**

`title`: `"Flow API, reactive, và tư duy hàm"` · `resources` trỏ `#/docs/mjia-17`, `#/docs/mjia-18`, và `{ label: "reactive-streams.org", href: "https://www.reactive-streams.org/" }`.
`practice`: cài đúng bốn interface của Flow API cho ví dụ nhiệt kế ở §17.2 — `Publisher`, `Subscriber`, `Subscription`, `Processor` — rồi cố tình để `Subscriber` xử lý chậm hơn `Publisher` phát và quan sát `request(n)` chặn dòng chảy thế nào. Đó là backpressure nhìn thấy được.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w11-1` | Reactive Manifesto — bốn tính chất và chỗ chúng mâu thuẫn nhau | ch.17 §"17.1. Reactive Manifesto" |
| `mj-w11-2` | Reactive streams và Flow API: bốn interface, và backpressure | ch.17 §"17.2. Reactive streams và Flow API" |
| `mj-w11-3` | RxJava — Observable, Flowable, và biến đổi luồng | ch.17 §"17.3. Sử dụng thư viện reactive RxJava" |
| `mj-w11-4` | Hàm thuần, trong suốt tham chiếu, và đệ quy so với vòng lặp | ch.18 §"18.1. Xây dựng và bảo trì hệ thống" + §"18.2. Functional programming là gì?" + §"18.3. Recursion so với iteration" |

- [ ] **Step 4: Viết tuần 12 — `mj-w12`, 4 mục (ch.19 + ch.20 + ch.21)**

`title`: `"Kỹ thuật FP, so sánh Scala, hướng đi tiếp"` · `resources` trỏ `#/docs/mjia-19`, `#/docs/mjia-20`, `#/docs/mjia-21`.
`practice`: cài `PersistentTree` hoặc danh sách liên kết bền vững của §19.2 sao cho thêm phần tử không sửa cấu trúc cũ, và viết test chứng minh tham chiếu cũ vẫn thấy dữ liệu cũ. Ch.20 và ch.21 chỉ đọc, không có bài tập — đọc lướt lấy điểm khác biệt và hướng đi, đừng sa vào cú pháp Scala.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `mj-w12-1` | Hàm bậc cao, currying, và cấu trúc dữ liệu bền vững | ch.19 §"19.1. Hàm ở khắp mọi nơi" + §"19.2. Persistent data structures" |
| `mj-w12-2` | Lazy evaluation tự cài, và pattern matching mô phỏng bằng lambda | ch.19 §"19.3. Lazy evaluation với stream" + §"19.4. Pattern matching" + §"19.5. Những điều linh tinh khác" |
| `mj-w12-3` | Scala đối chiếu Java: hàm, class, trait (đọc lướt) | ch.20 §"20.1. Giới thiệu về Scala" + §"20.2. Hàm" + §"20.3. Class và trait" |
| `mj-w12-4` | Điểm lại Java 8–10, và hướng ngôn ngữ đang đi tiếp | ch.21 §"21.1. Điểm lại các tính năng của Java 8" → §"21.6. Lời cuối" (cả sáu mục) |

- [ ] **Step 5: Đếm mục và xác nhận tổng toàn track = 48**

```bash
node -e "Promise.all([
  import('./webapp/js/data/mjia-roadmap-part1.js'),
  import('./webapp/js/data/mjia-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.mjiaWeeksPart1, ...b.mjiaWeeksPart2];
  console.log('part1:', a.mjiaWeeksPart1.flatMap(x=>x.items).length,
              '| part2:', b.mjiaWeeksPart2.flatMap(x=>x.items).length,
              '| tổng tuần:', w.length,
              '| TỔNG MỤC:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `part1: 25 | part2: 23 | tổng tuần: 12 | TỔNG MỤC: 48` và chuỗi `mj-w1:4 mj-w2:4 mj-w3:5 mj-w4:4 mj-w5:4 mj-w6:4 mj-w7:4 mj-w8:4 mj-w9:3 mj-w10:4 mj-w11:4 mj-w12:4`

- [ ] **Step 6: Kiểm anchor và độ dài lesson**

Chạy lại hai lệnh của Task 5 Step 7 (bản `part2`).
Kỳ vọng: `OK — mọi anchor hợp lệ và cùng lĩnh vực` và `OK — mọi lesson trong khung 250-400 từ`.

- [ ] **Step 7: Kiểm mọi tuần có `practice` thật, không rỗng**

```bash
node -e "Promise.all([
  import('./webapp/js/data/mjia-roadmap-part1.js'),
  import('./webapp/js/data/mjia-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.mjiaWeeksPart1, ...b.mjiaWeeksPart2];
  const bad=w.filter(x=>!x.practice || x.practice.trim().split(/\s+/).length<25);
  console.log(w.map(x=>x.id+':'+(x.practice?x.practice.trim().split(/\s+/).length:0)).join(' '));
  console.log(bad.length? 'THIẾU/QUÁ NGẮN: '+bad.map(x=>x.id).join(', ') : 'OK — 12 tuần đều có practice cụ thể');
})"
```

Kỳ vọng: `OK — 12 tuần đều có practice cụ thể`. Ngưỡng 25 từ là chốt chặn thô cho ràng buộc "không trôi thành lời khuyên chung chung" ở Global Constraints — qua ngưỡng vẫn phải tự đọc lại xem `practice` có nêu API/listing cụ thể không.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/mjia-roadmap-part2.js
git commit -m "feat: lộ trình đọc Modern Java in Action tuần 10-12 — đủ 12 tuần / 48 mục"
```

---

## Task 7: Bật module `roadmap`, khai track, thêm chip ở Senior Java GĐ1

**Files:**
- Modify: `webapp/check-data.mjs` (bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/senior-java-gd1.js`

(Chú thích đầu `webapp/js/views/roadmap.js` sửa ở Task 8, không phải task này.)

**Interfaces:**
- Consumes: `mjiaWeeksPart1` (25 mục, Task 3–4) và `mjiaWeeksPart2` (23 mục, Task 5–6).
- Produces: track id `modern-java` — địa chỉ `#/roadmap/modern-java` mà chip ở `sj-gd1-w4` trỏ tới.

- [ ] **Step 1: Khai bảng kỳ vọng — để checker đỏ có chủ đích**

Trong `webapp/check-data.mjs`, thêm ngay dưới dòng `"docs:modern-java": 21,`:

```js
    "roadmap-items:modern-java": 48,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ** — bảng kỳ vọng khai 48 mục lộ trình cho `modern-java` nhưng track chưa được khai trong `roadmap.js`, nên thực tế đếm được 0. Đây là bước red.

- [ ] **Step 3: Khai track trong `roadmap.js`**

Thêm hai dòng import cạnh nhóm import hiện có (sau `ddia-roadmap-part2.js`):

```js
import { mjiaWeeksPart1 } from "./mjia-roadmap-part1.js";
import { mjiaWeeksPart2 } from "./mjia-roadmap-part2.js";
```

Thêm khối track vào **cuối** mảng `tracks` (sau track `ddia`):

```js
  {
    id: "modern-java",
    field: "modern-java",
    label: "MJIA",
    icon: "🌊",
    name: "Đọc Modern Java in Action",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài tập gõ code.",
    prereq: "Yêu cầu: viết được Java ở mức thành thạo cú pháp trước Java 8 (class, interface, generics, collection). Không cần biết trước lambda hay stream.",
    weeks: [...mjiaWeeksPart1, ...mjiaWeeksPart2],
  },
```

Không bọc `withBookRefs` — track này không nhận crossref từ đâu cả.

Cập nhật khối chú thích đầu tệp: thêm MJIA vào câu liệt kê track ở đầu, thêm dòng vào bảng chia tệp (canh cột như các dòng sẵn có), và thêm id mới vào dòng LƯU Ý:

```
//   MJIA: mjia-roadmap-part{1,2}.js (Tuần 1–6 / 7–12)      — 48 mục
```

Dòng LƯU Ý: thêm `mj-w1` vào danh sách id tuần và `mj-w1-1` vào danh sách id mục.

- [ ] **Step 4: Bật module `roadmap` cho lĩnh vực `modern-java`**

Trong `webapp/js/data/fields.js`, entry `"modern-java"`: xoá dòng chú thích `// Module "roadmap" mở ở Task 7…` và đổi:

```js
    modules: ["dashboard", "docs", "roadmap"],
```

- [ ] **Step 5: Chạy checker để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**, gồm `roadmap-items:modern-java` = 48, "Id mục lộ trình khớp tiền tố id tuần cha" (`mj-w7-3` ⊂ `mj-w7`), "Mọi khối tuần có ít nhất 1 mục", #3/#3b/#3c.

Nếu đỏ ở "48 ≠ thực tế": đếm lại bằng lệnh ở Task 6 Step 5 và sửa dữ liệu, **không sửa con số 48 trong `EXPECTED`** — 48 là con số spec chốt.

- [ ] **Step 6: Ghi lại số mục Senior Java TRƯỚC khi chạm vào tệp**

```bash
node -e "Promise.all([
  import('./webapp/js/data/roadmap.js')
]).then(([m])=>{
  const t=m.tracks.filter(x=>x.field==='senior-java');
  console.log('senior-java:', t.flatMap(x=>x.weeks).flatMap(w=>w.items).length, 'mục');
})"
```

Kỳ vọng: `senior-java: 276 mục`. Ghi lại con số này — Step 9 phải ra đúng nó.

- [ ] **Step 7: Thêm đúng một chip vào `sj-gd1-w4`**

Trong `webapp/js/data/senior-java-gd1.js`, tuần có `title: "Generics, lambda, stream"` (`id: "sj-gd1-w4"`). Mảng `resources` hiện là:

```js
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
```

Thêm **một** phần tử vào cuối mảng đó:

```js
      { label: "🌊 Sang lĩnh vực Modern Java in Action — lộ trình đọc 12 tuần", href: "#/roadmap/modern-java" },
```

**Không sửa `title`, `goal`, `doneWhen`, hay bất kỳ `item` nào của tuần này. Không thêm/bớt mục. Không đụng tuần nào khác.**

- [ ] **Step 8: Chạy checker lại**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH**. Bất biến #3c ("link `#/roadmap/<trackId>` có thật") vừa được chip mới kích hoạt — nó xanh chứng minh track `modern-java` đã khai đúng ở Step 3.

- [ ] **Step 9: Kiểm hồi quy — số mục Senior Java KHÔNG được đổi**

Chạy lại **nguyên văn** lệnh ở Step 6.

Kỳ vọng: `senior-java: 276 mục` — đúng con số đã ghi ở Step 6. Nếu khác, đã lỡ tay thêm/xoá mục khi chèn chip; hoàn tác `senior-java-gd1.js` và làm lại Step 7.

- [ ] **Step 10: Kiểm bằng mắt**

```bash
./webapp/dev.sh
```

1. Chọn lĩnh vực **Modern Java in Action** → mục "Lộ trình học" xuất hiện ở sidebar → mở track, xác nhận 12 tuần, nút "Tiếp tục học" chạy, tick một mục rồi tải lại trang thấy tiến độ còn.
2. Chuyển sang lĩnh vực **Lộ trình Senior Java** → GĐ1 → tuần 4 "Generics, lambda, stream" → thấy chip mới, bấm vào và xác nhận nó mở track MJIA (app sẽ đổi lĩnh vực đang chọn — đúng như spec §13.4 đã lường trước).

- [ ] **Step 11: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/senior-java-gd1.js
git commit -m "feat: bật lộ trình Modern Java in Action 12 tuần và nối chip từ Senior Java GĐ1"
```

---

## Task 8: Cập nhật tài liệu và số liệu

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`
- Modify: `webapp/index.html` (dòng 7)
- Modify: `webapp/js/views/roadmap.js` (dòng 1, chỉ chú thích)

**Interfaces:**
- Consumes: toàn bộ dữ liệu từ Task 1–7.
- Produces: không có mã nào; đây là task cuối.

- [ ] **Step 1: Xác minh số liệu bằng dữ liệu thật, không chép từ kế hoạch**

```bash
node -e "Promise.all([
  import('./webapp/js/data/docs-index.js'),
  import('./webapp/js/data/roadmap.js'),
  import('./webapp/js/data/fields.js')
]).then(([d,r,f])=>{
  console.log('tài liệu:', d.docs.length);
  console.log('track:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length);
  console.log('lĩnh vực:', f.FIELD_ORDER.length);
  console.log('lĩnh vực có roadmap:', f.FIELD_ORDER.filter(x=>f.FIELDS[x].modules.includes('roadmap')).length);
})"
```

Kỳ vọng: `tài liệu: 121` · `track: 13` · `mục lộ trình: 668` · `lĩnh vực: 8` · `lĩnh vực có roadmap: 7`.

**Dùng số in ra từ lệnh này, không dùng số viết trong kế hoạch.** Nếu lệch, dừng lại và tìm nguyên nhân trước khi sửa tài liệu.

- [ ] **Step 2: `webapp/README.md`**

Ba chỗ:
1. Dòng "🗺️ Lộ trình học": `12 giáo trình` → `13 giáo trình`; thêm *lộ trình đọc **Modern Java in Action** (12 tuần, 48 mục, bám theo 21 chương sách)* vào câu liệt kê, ngay sau cụm DDIA; tổng `**620 mục**` → `**668 mục**`; thêm `+ 48 mục đọc Modern Java in Action` vào phép cộng trong ngoặc.
2. Dòng "📚 Thư viện tài liệu": `**100 tài liệu**` → `**121 tài liệu**`; `thuộc 7 lĩnh vực` → `thuộc 8 lĩnh vực`; thêm `21 Modern Java in Action` vào danh sách phân rã trong ngoặc.
3. Dòng 73 (cây thư mục): `# khai 7 lĩnh vực` → `# khai 8 lĩnh vực`.

- [ ] **Step 3: `README.md` (gốc repo)**

Ba chỗ:
1. Dòng 82: `cả bảy lĩnh vực` → `cả tám lĩnh vực`; thêm `bản dịch **Modern Java in Action**` vào câu liệt kê các bộ tài liệu.
2. Bảng thành phần: thêm một dòng sau dòng `ddia-vi/`:

```markdown
| [`modern-java-vi/`](./modern-java-vi/) | Bản dịch tiếng Việt *Modern Java in Action* (Raoul-Gabriel Urma, Mario Fusco, Alan Mycroft — Manning) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 21 chương, không có hình. Đọc trong app ở lĩnh vực Modern Java in Action, kèm lộ trình đọc 12 tuần. |
```

3. Dòng mô tả `webapp/`: thêm `Modern Java in Action` vào danh sách lĩnh vực trong ngoặc; `12 giáo trình, 620 mục` → `13 giáo trình, 668 mục`; `100 tài liệu` → `121 tài liệu`.

- [ ] **Step 4: `webapp/index.html` dòng 7**

Trong `<meta name="description">`, thêm `Modern Java in Action` vào danh sách lĩnh vực. Đặt ngay sau `Java & Spring Boot Scalability,` để khớp `FIELD_ORDER`.

- [ ] **Step 5: `webapp/js/views/roadmap.js` dòng 1**

`12 track thuộc 6 lĩnh vực` → `13 track thuộc 7 lĩnh vực`, và thêm `đọc Modern Java in Action (Modern Java in Action)` vào câu liệt kê track trong chú thích.

Con số ở đây là **7**, không phải 8: lĩnh vực `java` không khai module `roadmap`. Step 1 đã in ra `lĩnh vực có roadmap: 7` để xác nhận.

- [ ] **Step 6: Quét sót số liệu cũ**

```bash
grep -rn "620 mục\|100 tài liệu\|12 giáo trình\|bảy lĩnh vực\|khai 7 lĩnh vực\|12 track" \
  README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js webapp/js/data/
```

Kỳ vọng: **không dòng nào**. Mỗi dòng lọt ra là một chỗ số liệu chưa cập nhật.

(Mẫu là `khai 7 lĩnh vực`, không phải `7 lĩnh vực` trần — sau Step 5 chuỗi `13 track thuộc 7 lĩnh vực` ở `views/roadmap.js` là **đúng**, không được báo nhầm thành sót.)

- [ ] **Step 7: Nghiệm thu lần cuối**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**, `"roadmap-items:senior-java"` vẫn là 276. Dán nguyên output vào báo cáo.

- [ ] **Step 8: Commit**

```bash
git add README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm lĩnh vực Modern Java in Action"
```
