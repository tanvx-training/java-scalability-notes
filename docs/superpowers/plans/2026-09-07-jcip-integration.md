# Tích hợp Java Concurrency in Practice — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Java Concurrency in Practice* (13 chương + phụ lục A) vào web app DevPrep thành lĩnh vực thứ 12 `jcip`, kèm thư viện 14 tài liệu và lộ trình đọc 10 tuần / 40 mục.

**Architecture:** DevPrep là SPA vanilla JS không build — dữ liệu học tập là các module ES export mảng object, và `webapp/scripts/check-data.mjs` là bộ 49 bất biến đóng vai trò test suite của toàn bộ dữ liệu. Đợt này thêm một lĩnh vực mới theo đúng khuôn 11 đợt tích hợp sách trước: chuẩn hoá nguồn vào `sources/jcip/`, khai lĩnh vực trong `fields.js`, viết thư viện tài liệu và lộ trình đọc, rồi nối liên kết chéo. Mỗi task kết thúc bằng `check-data.mjs` xanh.

**Tech Stack:** ES modules (không transpile), Node 18+ để chạy `check-data.mjs`, bash cho `build-content.sh`. Không có framework, không có bước build, không có test runner ngoài `check-data.mjs`.

**Spec:** [`docs/superpowers/specs/2026-09-07-jcip-integration-design.md`](../specs/2026-09-07-jcip-integration-design.md)

## Global Constraints

- **Id là khoá localStorage — không bao giờ đổi sau khi commit.** Doc id `jcip-02`…`jcip-16` + `jcip-A`; week id `jc-w1`…`jc-w10`; item id `jc-w<N>-<M>`.
- **Doc id khớp số chương sách.** `jcip-01`, `jcip-09`, `jcip-12` **để trống vĩnh viễn** — ba chương đó không có trong bản dịch và không có PDF gốc.
- **`part: null` cho cả 14 tài liệu.** Repo không đủ bằng chứng tên các Phần (spec §1.3). Không điền theo trí nhớ về bản in tiếng Anh.
- **Không sửa một ký tự nào trong 14 tệp markdown nguồn.** Chỉ đổi tên tệp và di chuyển thư mục.
- **Không suy đoán nội dung ch.1, ch.9, ch.12** vào bất kỳ đâu — tài liệu, lộ trình hay README.
- **Mọi con số, tên API, tên mục trong lộ trình phải lấy từ bản dịch**, không từ trí nhớ về bản tiếng Anh.
- **Mỗi tuần đúng 4 mục.** 10 tuần × 4 = 40.
- **Sau mỗi task, `node webapp/scripts/check-data.mjs` phải in `49/49 bất biến đạt` (hoặc hơn) và không dòng `✗` nào.**
- Nguồn: *Java Concurrency in Practice* — Brian Goetz với Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea; Addison-Wesley, 2006. **Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.**

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `sources/jcip/*.md` (14) | Bản dịch, đổi tên theo `NN-slug.md` | 1 |
| `sources/jcip/images/chNN/` (204 ảnh) | Ảnh, giữ nguyên bố cục | 1 |
| `sources/jcip/pdf/*.pdf` (14) | PDF gốc, không vào deploy | 1 |
| `sources/jcip/README.md` | Tác giả, bản quyền, phạm vi, ba chương vắng | 1 |
| `webapp/js/data/fields.js` | Khai lĩnh vực `jcip` + `FIELD_ORDER` | 2, 8 |
| `webapp/js/data/paths.js` | Chèn `jcip` vào con đường Java Backend (7 chặng) | 2 |
| `webapp/js/data/jcip/docs.js` | 14 bản ghi thư viện tài liệu | 2 |
| `webapp/js/data/docs-index.js` | Nối `jcip/docs.js` vào mảng chung | 2 |
| `webapp/js/data/guides.js` | `fieldGuides.jcip` với steps manual (Task 2); `trackGuides.jcip` + viết lại steps trỏ track (Task 8) | 2, 8 |
| `webapp/js/data/jcip/roadmap-part1.js` | Tuần 1–5, 20 mục | 3, 4, 5 |
| `webapp/js/data/jcip/roadmap-part2.js` | Tuần 6–10, 20 mục | 5, 6, 7 |
| `webapp/js/data/roadmap.js` | Đăng ký track `jcip` | 8 |
| `webapp/js/data/related.js` | 12 khoá liên kết chéo | 9 |
| `webapp/scripts/check-data.mjs` | `EXPECTED.counts` cho `jcip` | 2, 8 |
| `README.md`, `sources/README.md` | Tài liệu repo | 9 |

Không tệp nào khác được sửa. Nếu một task khiến bạn muốn sửa view (`webapp/js/views/`) hay `build-content.sh`, dừng lại — đó là dấu hiệu làm sai khuôn.

---

## Task 1: Chuẩn hoá nguồn thành `sources/jcip/`

**Files:**
- Move: `Java Concurrency in Practice/` → `sources/jcip/`
- Create: `sources/jcip/README.md`

**Interfaces:**
- Consumes: không gì (task đầu tiên).
- Produces: 14 tệp `sources/jcip/NN-slug.md` mà Task 2 trỏ tới qua `file: "content/jcip/NN-slug.md"`; 204 ảnh ở `sources/jcip/images/chNN/`.

- [ ] **Bước 1: Xác nhận không ai tham chiếu đường dẫn cũ**

```bash
grep -rn "Java Concurrency in Practice/" --exclude-dir=.git --exclude-dir=docs --exclude-dir="Java Concurrency in Practice" .
```

Kỳ vọng: **không dòng nào**. Dấu `/` cuối mẫu chỉ bắt tham chiếu đường dẫn, không bắt tên sách trong văn xuôi. Nếu có dòng nào, dừng và báo — spec giả định con số này là 0.

- [ ] **Bước 2: Tạo thư mục và di chuyển 14 tệp markdown**

```bash
mkdir -p sources/jcip/pdf
git mv "Java Concurrency in Practice/02 - Thread Safety (Bản dịch tiếng Việt).md" sources/jcip/02-thread-safety.md
git mv "Java Concurrency in Practice/03 - Sharing Objects (Bản dịch tiếng Việt).md" sources/jcip/03-sharing-objects.md
git mv "Java Concurrency in Practice/04 - Composing Objects (Bản dịch tiếng Việt).md" sources/jcip/04-composing-objects.md
git mv "Java Concurrency in Practice/05 - Building Blocks (Bản dịch tiếng Việt).md" sources/jcip/05-building-blocks.md
git mv "Java Concurrency in Practice/06 - Task Execution (Bản dịch tiếng Việt).md" sources/jcip/06-task-execution.md
git mv "Java Concurrency in Practice/07 - Cancellation and Shutdown (Bản dịch tiếng Việt).md" sources/jcip/07-cancellation-and-shutdown.md
git mv "Java Concurrency in Practice/08 - Applying Thread Pools (Bản dịch tiếng Việt).md" sources/jcip/08-applying-thread-pools.md
git mv "Java Concurrency in Practice/10 - Avoiding Liveness Hazards (Bản dịch tiếng Việt).md" sources/jcip/10-avoiding-liveness-hazards.md
git mv "Java Concurrency in Practice/11 - Performance and Scalability (Bản dịch tiếng Việt).md" sources/jcip/11-performance-and-scalability.md
git mv "Java Concurrency in Practice/13 - Explicit Locks (Bản dịch tiếng Việt).md" sources/jcip/13-explicit-locks.md
git mv "Java Concurrency in Practice/14 - Building Custom Synchronizers (Bản dịch tiếng Việt).md" sources/jcip/14-building-custom-synchronizers.md
git mv "Java Concurrency in Practice/15 - Atomic Variables and Nonblocking Synchronization (Bản dịch tiếng Việt).md" sources/jcip/15-atomic-variables-and-nonblocking-synchronization.md
git mv "Java Concurrency in Practice/16 - The Java Memory Model (Bản dịch tiếng Việt).md" sources/jcip/16-the-java-memory-model.md
git mv "Java Concurrency in Practice/A - Annotations for Concurrency (Bản dịch tiếng Việt).md" sources/jcip/A-annotations-for-concurrency.md
```

- [ ] **Bước 3: Di chuyển ảnh và PDF**

```bash
git mv "Java Concurrency in Practice/images" sources/jcip/images
git mv "Java Concurrency in Practice/2 Thread Safety _ Java Concurrency in Practice.pdf" sources/jcip/pdf/02-thread-safety.pdf
git mv "Java Concurrency in Practice/3 Sharing Objects _ Java Concurrency in Practice.pdf" sources/jcip/pdf/03-sharing-objects.pdf
git mv "Java Concurrency in Practice/4 Composing Objects _ Java Concurrency in Practice.pdf" sources/jcip/pdf/04-composing-objects.pdf
git mv "Java Concurrency in Practice/5 Building Blocks _ Java Concurrency in Practice.pdf" sources/jcip/pdf/05-building-blocks.pdf
git mv "Java Concurrency in Practice/6 Task Execution _ Java Concurrency in Practice.pdf" sources/jcip/pdf/06-task-execution.pdf
git mv "Java Concurrency in Practice/7 Cancellation and Shutdown _ Java Concurrency in Practice.pdf" sources/jcip/pdf/07-cancellation-and-shutdown.pdf
git mv "Java Concurrency in Practice/8 Applying Thread Pools _ Java Concurrency in Practice.pdf" sources/jcip/pdf/08-applying-thread-pools.pdf
git mv "Java Concurrency in Practice/10 Avoiding Liveness Hazards _ Java Concurrency in Practice.pdf" sources/jcip/pdf/10-avoiding-liveness-hazards.pdf
git mv "Java Concurrency in Practice/11 Performance and Scalability _ Java Concurrency in Practice.pdf" sources/jcip/pdf/11-performance-and-scalability.pdf
git mv "Java Concurrency in Practice/13 Explicit Locks _ Java Concurrency in Practice.pdf" sources/jcip/pdf/13-explicit-locks.pdf
git mv "Java Concurrency in Practice/14 Building Custom Synchronizers _ Java Concurrency in Practice.pdf" sources/jcip/pdf/14-building-custom-synchronizers.pdf
git mv "Java Concurrency in Practice/15 Atomic Variables and Nonblocking Synchronization _ Java Concurrency in Practice.pdf" sources/jcip/pdf/15-atomic-variables-and-nonblocking-synchronization.pdf
git mv "Java Concurrency in Practice/16 The Java Memory Model _ Java Concurrency in Practice.pdf" sources/jcip/pdf/16-the-java-memory-model.pdf
git mv "Java Concurrency in Practice/A Annotations for Concurrency _ Java Concurrency in Practice.pdf" sources/jcip/pdf/A-annotations-for-concurrency.pdf
```

- [ ] **Bước 4: Xác nhận thư mục cũ đã biến mất và bố cục mới đúng**

```bash
test ! -d "Java Concurrency in Practice" && echo "OK: thư mục cũ đã biến mất" || echo "ĐỎ: thư mục cũ còn sót"
echo "md: $(ls sources/jcip/*.md | wc -l | tr -d ' ') (kỳ vọng 14)"
echo "pdf: $(ls sources/jcip/pdf/*.pdf | wc -l | tr -d ' ') (kỳ vọng 14)"
echo "ảnh: $(find sources/jcip/images -type f | wc -l | tr -d ' ') (kỳ vọng 204)"
```

- [ ] **Bước 5: Kiểm toàn vẹn ảnh — 204 tham chiếu, 0 gãy, 0 mồ côi**

Dùng mẫu khớp đúng cú pháp markdown. Một `grep` tham lam dạng `images/[^)]*` sẽ báo 13 "ảnh gãy" giả — đó là các lần văn bản nhắc đường dẫn trong dấu backtick.

```bash
cd sources/jcip
grep -ohE '\!\[[^]]*\]\(images/[^)]+\)' *.md | sed -E 's/.*\((images[^)]+)\)/\1/' | sort -u > /tmp/jcip-refs.txt
find images -type f | sort > /tmp/jcip-files.txt
echo "tham chiếu duy nhất: $(wc -l < /tmp/jcip-refs.txt | tr -d ' ') (kỳ vọng 204)"
echo "--- ảnh gãy (kỳ vọng: không dòng nào) ---"
while read p; do [ -f "$p" ] || echo "GÃY: $p"; done < /tmp/jcip-refs.txt
echo "--- ảnh mồ côi (kỳ vọng: không dòng nào) ---"
comm -23 /tmp/jcip-files.txt /tmp/jcip-refs.txt
cd ../..
```

- [ ] **Bước 6: Viết `sources/jcip/README.md`**

```markdown
# Java Concurrency in Practice — bản dịch tiếng Việt

Bản dịch tiếng Việt *Java Concurrency in Practice* — Brian Goetz với Tim Peierls, Joshua Bloch,
Joseph Bowbeer, David Holmes, Doug Lea (Addison-Wesley, 2006).

**Sách có bản quyền thương mại**, không phải giấy phép mở như CC BY 4.0. Bản dịch nằm trong repo
này để học cá nhân; không phân phối lại.

## Phạm vi: 13 chương + 1 phụ lục

| Tệp | Chương |
|---|---|
| `02-thread-safety.md` | 2. Thread Safety |
| `03-sharing-objects.md` | 3. Sharing Objects |
| `04-composing-objects.md` | 4. Composing Objects |
| `05-building-blocks.md` | 5. Building Blocks |
| `06-task-execution.md` | 6. Task Execution |
| `07-cancellation-and-shutdown.md` | 7. Cancellation and Shutdown |
| `08-applying-thread-pools.md` | 8. Applying Thread Pools |
| `10-avoiding-liveness-hazards.md` | 10. Avoiding Liveness Hazards |
| `11-performance-and-scalability.md` | 11. Performance and Scalability |
| `13-explicit-locks.md` | 13. Explicit Locks |
| `14-building-custom-synchronizers.md` | 14. Building Custom Synchronizers |
| `15-atomic-variables-and-nonblocking-synchronization.md` | 15. Atomic Variables and Nonblocking Synchronization |
| `16-the-java-memory-model.md` | 16. The Java Memory Model |
| `A-annotations-for-concurrency.md` | Phụ lục A. Annotations for Concurrency |

Tổng 109.417 từ.

## Chương 1, 9 và 12 KHÔNG có trong bản dịch

Bản dịch không có chương 1 (Introduction), chương 9 (GUI Applications) và chương 12 (Testing
Concurrent Programs), và **cũng không có PDF gốc của ba chương đó**. Đây là giới hạn cứng của
nguồn, không phải việc còn dang dở.

Lỗ hổng này đã được đo và **nhẹ**: toàn bộ 14 tệp chỉ có 6 tham chiếu ngược tới ba chương vắng
(ch.1 hai lần ở chương 2 — câu dẫn nhập; ch.9 ba lần — đều về GUI/subsystem single-threaded;
ch.12 một lần ở chương 5 — nhắc một class ví dụ). **Không chương nào còn lại phụ thuộc vào ba
chương đó để đọc hiểu được.**

Phần kiểm thử chương trình concurrent mà ch.12 phụ trách được bù trong lộ trình đọc bằng
[jcstress](https://openjdk.org/projects/code-tools/jcstress/) ở tuần 10.

## Ảnh và PDF

204 ảnh trong `images/chNN/`, tham chiếu tương đối theo tệp chứa. Phụ lục A không có ảnh.

PDF gốc trong `pdf/`. Thư mục này **không** vào bản deploy hay image Docker —
`webapp/scripts/build-content.sh` sao chép cả cây `sources/` trừ `*.pdf`.
```

- [ ] **Bước 7: Chạy build-content và kiểm dữ liệu — phải vẫn xanh**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**, không dòng `✗` nào. Task này chưa đụng app nên số bất biến không đổi — bước này để chắc chắn bạn không lỡ tay sửa dữ liệu.

- [ ] **Bước 8: Commit**

```bash
git add -A sources/jcip "Java Concurrency in Practice" 2>/dev/null; git add -A
git commit -m "chore: chuẩn hoá nguồn Java Concurrency in Practice thành sources/jcip/

14 chương dịch + 204 ảnh + 14 PDF, đổi tên theo quy ước NN-slug.md.
Viết mới sources/jcip/README.md (nguồn không kèm README): tác giả,
bản quyền thương mại, và ghi rõ ch.1/9/12 không có trong bản dịch."
```

---

## Task 2: Khai lĩnh vực `jcip` và thư viện 14 tài liệu

**Files:**
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/paths.js`
- Create: `webapp/js/data/jcip/docs.js`
- Modify: `webapp/js/data/docs-index.js`
- Modify: `webapp/js/data/guides.js`
- Modify: `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: 14 tệp `sources/jcip/NN-slug.md` từ Task 1.
- Produces: doc id `jcip-02`…`jcip-16` và `jcip-A` mà Task 3–7 link tới qua `#/docs/jcip-NN`, và Task 9 nối trong `related.js`. Lĩnh vực `jcip` với 3 module (**chưa** `roadmap`).

- [ ] **Bước 1: Khai lĩnh vực trong `fields.js`**

Thêm khối này vào object `FIELDS`, **sau** khối `wgjd`. Chú ý `modules` **chưa có `"roadmap"`** — bất biến #7 sẽ báo đỏ nếu khai module mà chưa có dữ liệu lộ trình.

```js
  jcip: {
    label: "Java Concurrency in Practice",
    icon: "🔐",
    short: "JCiP",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt Java Concurrency in Practice (Brian Goetz với Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea — Addison-Wesley) — chương 2–8, 10, 11, 13–16 và phụ lục A: thread safety, visibility và safe publication, thiết kế class thread-safe, building block của java.util.concurrent, thực thi và huỷ task, thread pool, deadlock, hiệu năng và khả năng mở rộng, explicit lock, AQS, biến atomic và Java Memory Model. Chương 1, 9 (GUI) và 12 (kiểm thử) không nằm trong bản dịch.",
    certFilter: false,
    // Module "roadmap" mở ở Task 8, khi jcip/roadmap-part{1,2}.js đã có dữ liệu.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "jcip.net — errata & annotations", href: "https://jcip.net/" },
  },
```

Rồi sửa `FIELD_ORDER`, chèn `"jcip"` ngay sau `"wgjd"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "wgjd", "jcip", "ddia", "kafka", "modern-concurrency", "spring-start", "spring-security", "senior-java"];
```

- [ ] **Bước 2: Chèn `jcip` vào con đường Java Backend trong `paths.js`**

Trong `PATHS.java`, sửa `fields` và `desc`. Con đường đi từ sáu chặng lên **bảy**:

```js
  java: {
    label: "Java Backend",
    icon: "☕",
    desc: "Một nghề, bảy chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM (bytecode, JMM, build, container) → nền concurrency cổ điển (thread safety, lock, AQS, JMM) → khả năng mở rộng trên Tomcat → concurrency sau Loom → bảo mật. Lập trình hệ thống là nền tuỳ chọn cho ai muốn hiểu tới tầng kernel.",
    fields: ["spring-start", "modern-java", "wgjd", "jcip", "java", "modern-concurrency", "spring-security"],
    foundation: ["sysprog"],
  },
```

- [ ] **Bước 3: Viết `webapp/js/data/jcip/docs.js`**

Tạo thư mục `webapp/js/data/jcip/` rồi tệp `docs.js`:

```js
// Tài liệu lĩnh vực "Java Concurrency in Practice" — 14 tài liệu.
// Nguồn markdown: sources/jcip/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/jcip/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` giữ ĐÚNG số chương sách: 02–08, 10, 11, 13–16 và "A" cho phụ lục.
// Chương 1, 9 (GUI) và 12 (kiểm thử) không có trong bản dịch và không có PDF
// gốc — id jcip-01/09/12 để trống vĩnh viễn, KHÔNG đánh số lại 01–14.
// `part` null: repo chỉ có một dấu vết "Tóm tắt Phần I" ở cuối chương 5, không
// đủ để biết tên Phần hay ranh giới các Phần sau — không bịa (bất biến D1).

export const docs = [
  {
    id: "jcip-02",
    field: "jcip",
    chapter: 2,
    part: null,
    title: "Thread Safety",
    file: "content/jcip/02-thread-safety.md",
    icon: "🔒",
    desc: "Thread safety thực ra nói về gì: quản lý truy cập vào state khả biến được chia sẻ. Race condition kiểu check-then-act và read-modify-write, compound action, intrinsic lock và tính reentrant, và vì sao mở rộng phạm vi lock lại đánh đổi với liveness.",
    tags: ["Race condition", "Atomicity", "synchronized"],
  },
  {
    id: "jcip-03",
    field: "jcip",
    chapter: 3,
    part: null,
    title: "Sharing Objects",
    file: "content/jcip/03-sharing-objects.md",
    icon: "👁️",
    desc: "Vì sao một thread ghi mà thread khác không thấy: stale data, phép ghi 64-bit không atomic, và biến volatile. Publication và escape, thread confinement (stack, ThreadLocal), immutability với final field, và các idiom safe publication.",
    tags: ["Visibility", "volatile", "Safe publication"],
  },
  {
    id: "jcip-04",
    field: "jcip",
    chapter: 4,
    part: null,
    title: "Composing Objects",
    file: "content/jcip/04-composing-objects.md",
    icon: "🧩",
    desc: "Cách ghép các thành phần thread-safe thành class lớn hơn mà không mất tính đúng đắn: thu thập yêu cầu synchronization, Java monitor pattern, uỷ quyền thread safety và chỗ uỷ quyền thất bại, client-side locking so với composition.",
    tags: ["Encapsulation", "Delegation", "Monitor pattern"],
  },
  {
    id: "jcip-05",
    field: "jcip",
    chapter: 5,
    part: null,
    title: "Building Blocks",
    file: "content/jcip/05-building-blocks.md",
    icon: "🧱",
    desc: "Bộ công cụ java.util.concurrent: vì sao synchronized collection vẫn hỏng khi lặp, ConcurrentHashMap và CopyOnWriteArrayList, BlockingQueue cho producer-consumer, bốn synchronizer (latch, FutureTask, semaphore, barrier), và một result cache tiến hoá qua nhiều phiên bản.",
    tags: ["ConcurrentHashMap", "BlockingQueue", "Synchronizer"],
  },
  {
    id: "jcip-06",
    field: "jcip",
    chapter: 6,
    part: null,
    title: "Task Execution",
    file: "content/jcip/06-task-execution.md",
    icon: "🏃",
    desc: "Tách việc gửi task khỏi việc chạy task: vì sao một-thread-mỗi-task sụp ở tải cao, framework Executor và execution policy, vòng đời Executor, Callable và Future, CompletionService, và cách đặt hạn thời gian cho task.",
    tags: ["Executor", "Future", "CompletionService"],
  },
  {
    id: "jcip-07",
    field: "jcip",
    chapter: 7,
    part: null,
    title: "Cancellation and Shutdown",
    file: "content/jcip/07-cancellation-and-shutdown.md",
    icon: "🛑",
    desc: "Java không có cách dừng thread an toàn nào ngoài hợp tác: cơ chế interruption và interruption policy, cách phản hồi InterruptedException, huỷ qua Future, blocking không interrupt được, poison pill, cùng shutdown hook và daemon thread lúc JVM tắt.",
    tags: ["Interruption", "Shutdown", "Poison pill"],
  },
  {
    id: "jcip-08",
    field: "jcip",
    chapter: 8,
    part: null,
    title: "Applying Thread Pools",
    file: "content/jcip/08-applying-thread-pools.md",
    icon: "⚙️",
    desc: "Chỗ task và execution policy gắn ngầm với nhau: thread starvation deadlock và task chạy lâu, rồi công thức xác định kích thước thread pool. Cấu hình ThreadPoolExecutor từ hàng đợi tới saturation policy và thread factory, và song song hoá thuật toán đệ quy.",
    tags: ["Pool sizing", "ThreadPoolExecutor", "Saturation policy"],
  },
  {
    id: "jcip-10",
    field: "jcip",
    chapter: 10,
    part: null,
    title: "Avoiding Liveness Hazards",
    file: "content/jcip/10-avoiding-liveness-hazards.md",
    icon: "⛓️",
    desc: "Năm dạng deadlock — lock-ordering, thứ tự lock động, object hợp tác, open call, resource — cùng cách tránh bằng thứ tự lock nhất quán và acquire có timeout, cách đọc thread dump để chẩn đoán, và ba nguy cơ liveness còn lại: starvation, đáp ứng kém, livelock.",
    tags: ["Deadlock", "Thread dump", "Livelock"],
  },
  {
    id: "jcip-11",
    field: "jcip",
    chapter: 11,
    part: null,
    title: "Performance and Scalability",
    file: "content/jcip/11-performance-and-scalability.md",
    icon: "📈",
    desc: "Performance khác scalability ở đâu, và vì sao tối ưu cho cái này thường hại cái kia. Định luật Amdahl và serialization ẩn trong framework, ba khoản chi phí do thread gây ra, các kỹ thuật giảm tranh chấp lock, và vì sao sách nói không với object pooling.",
    tags: ["Amdahl", "Lock contention", "Lock striping"],
  },
  {
    id: "jcip-13",
    field: "jcip",
    chapter: 13,
    part: null,
    title: "Explicit Locks",
    file: "content/jcip/13-explicit-locks.md",
    icon: "🔓",
    desc: "ReentrantLock cho ba thứ mà intrinsic lock không có: acquire có timeout, acquire interrupt được, và locking không theo cấu trúc khối. Cân nhắc performance, cái giá của fairness, tiêu chí chọn giữa synchronized và ReentrantLock, và read-write lock.",
    tags: ["ReentrantLock", "Fairness", "ReadWriteLock"],
  },
  {
    id: "jcip-14",
    field: "jcip",
    chapter: 14,
    part: null,
    title: "Building Custom Synchronizers",
    file: "content/jcip/14-building-custom-synchronizers.md",
    icon: "🏗️",
    desc: "Cách tự xây synchronizer phụ thuộc state: condition predicate, vì sao phải chờ trong vòng lặp, missed signal, notify so với notifyAll, Condition tường minh, và AbstractQueuedSynchronizer — khung mà ReentrantLock, Semaphore, CountDownLatch và FutureTask đều đứng trên.",
    tags: ["Condition queue", "AQS", "wait/notify"],
  },
  {
    id: "jcip-15",
    field: "jcip",
    chapter: 15,
    part: null,
    title: "Atomic Variables and Nonblocking Synchronization",
    file: "content/jcip/15-atomic-variables-and-nonblocking-synchronization.md",
    icon: "⚛️",
    desc: "Vì sao lock đắt khi bị tranh chấp, và compare-and-swap thay thế thế nào. Hỗ trợ CAS trong phần cứng và trong JVM, các class atomic variable như một thứ volatile tốt hơn, rồi thuật toán nonblocking: stack, linked list, atomic field updater và vấn đề ABA.",
    tags: ["CAS", "Atomic", "Nonblocking"],
  },
  {
    id: "jcip-16",
    field: "jcip",
    chapter: 16,
    part: null,
    title: "The Java Memory Model",
    file: "content/jcip/16-the-java-memory-model.md",
    icon: "🧠",
    desc: "Nền lý thuyết nằm dưới mọi chương trước: memory model của nền tảng, reordering, quan hệ happens-before, và piggybacking. Unsafe publication, các idiom khởi tạo an toàn, vì sao double-checked locking là phản mẫu, và initialization safety mà final field bảo đảm.",
    tags: ["JMM", "happens-before", "Reordering"],
  },
  {
    id: "jcip-A",
    field: "jcip",
    chapter: "A",
    part: null,
    title: "Annotations for Concurrency",
    file: "content/jcip/A-annotations-for-concurrency.md",
    icon: "🏷️",
    desc: "Bốn annotation dùng xuyên suốt các listing code của sách: @ThreadSafe, @NotThreadSafe và @Immutable ở mức class, @GuardedBy ở mức field và method để ghi rõ lock nào bảo vệ state nào.",
    tags: ["@GuardedBy", "@Immutable", "Tài liệu hoá"],
  },
];
```

- [ ] **Bước 4: Nối vào `docs-index.js`**

Thêm dòng import sau dòng `wgjd`, và `...jcip,` ở cuối mảng:

```js
import { docs as jcip } from "./jcip/docs.js";
```

```js
  ...wgjd,
  ...jcip,
];
```

- [ ] **Bước 5: Thêm `fieldGuides.jcip` vào `guides.js`**

Thêm vào object `fieldGuides`, sau khối `wgjd`.

**Quan trọng — `steps` ở task này KHÔNG được trỏ tới track `jcip`.** Track đó mãi Task 8 mới tồn tại, và bất biến G3 sẽ báo đỏ ba lần nếu trỏ sớm: `done.id track "jcip" không tồn tại`, `cần module "roadmap" mà lĩnh vực không khai`, và `href tới module "roadmap" mà lĩnh vực không khai`. Nên cả 5 bước dùng `done: { kind: "manual" }` và **không có `href`**. Task 8 Bước 6 sẽ viết lại `steps` 2–4 để trỏ track sau khi track đã có. Giữ nguyên `id` của bước (`jc-1`…`jc-5`) khi viết lại.

```js
  jcip: {
    tagline: "Đọc Java Concurrency in Practice — nền tảng concurrency của Java: thread safety, visibility, lock, AQS và Java Memory Model.",
    audience: "Lập trình viên Java đã viết code đa luồng và muốn hiểu vì sao nó đúng — hoặc vì sao nó thỉnh thoảng sai. **Không phải sách nhập môn**, và cũng không phải sách dạy API mới nhất: nó dạy các quy tắc mà mọi API concurrency về sau vẫn phải tuân theo.",
    hoursPerWeek: "6–8 giờ/tuần · 10 tuần",
    prereqs: [
      "Viết được Java đa luồng ở mức cơ bản: biết `Thread`, `synchronized` và `ExecutorService` là gì, dù chưa hiểu sâu.",
      "JDK 17 trở lên để chạy ví dụ — mã trong sách viết cho Java 5/6 nhưng chạy nguyên trên JDK hiện đại.",
      "Đọc được stack trace và thread dump; tuần 7 dùng `jstack` để bắt deadlock thật.",
      "Chấp nhận rằng chương 1, chương 9 (GUI) và chương 12 (kiểm thử) không có trong bản dịch — phần kiểm thử được bù bằng jcstress ở tuần 10.",
    ],
    steps: [
      { id: "jc-1", title: "Dựng chỗ để gõ thử", desc: "Một dự án Java trống với JDK 17+, chạy được từ dòng lệnh. Tự đánh dấu khi `java -version` chạy và bạn biên dịch được một class có hai thread.", done: { kind: "manual" } },
      { id: "jc-2", title: "Chương 2–5: nền tảng — thread safety, visibility, composition, building block", desc: "Phần I của sách. Đây là phần không được đọc lướt: mọi chương sau đều xây trên bốn chương này. Đọc xong bạn nên nhìn một class bất kỳ và nói được nó thread-safe hay không, và vì sao.", done: { kind: "manual" } },
      { id: "jc-3", title: "Chương 6–11: cấu trúc ứng dụng concurrent và cái giá của nó", desc: "Thực thi task, huỷ và shutdown, thread pool, deadlock, hiệu năng và khả năng mở rộng. Bắt một deadlock thật bằng `jstack`, rồi đo tranh chấp lock và đối chiếu với định luật Amdahl.", done: { kind: "manual" } },
      { id: "jc-4", title: "Chương 13–16: explicit lock, AQS, CAS, Java Memory Model", desc: "ReentrantLock và read-write lock, tự xây synchronizer trên AQS, thuật toán nonblocking, rồi Java Memory Model đóng lại toàn bộ khung lý thuyết. Kết bằng một test jcstress chứng minh một race.", done: { kind: "manual" } },
      { id: "jc-5", title: "Đọc lại một class thật trong dự án của bạn", desc: "Chọn một class có state chia sẻ trong codebase bạn đang làm, viết ra synchronization policy của nó bằng ngôn ngữ chương 4.5, và đánh dấu bằng `@GuardedBy`. Nếu không viết ra được policy, đó chính là phát hiện.", done: { kind: "manual" } },
    ],
    method: "Đọc chậm và gõ lại. Sách này dày đặc listing code, và gần như mỗi listing đều có một phiên bản sai đứng ngay trước phiên bản đúng — giá trị nằm ở chỗ hiểu vì sao bản sai lại sai. Mỗi tuần có một câu hỏi tự kiểm tra ở cuối từng mục: trả lời bằng lời trước khi xem lại sách.",
    pitfalls: [
      "**Đọc lướt Phần I để nhảy tới phần nâng cao.** Chương 13–16 giả định bạn đã thuộc lòng khái niệm của chương 2–5. Nhảy cóc sẽ khiến chương 14 (AQS) thành vô nghĩa.",
      "**Tưởng sách lỗi thời vì xuất bản năm 2006.** `java.util.concurrent` không đổi ngữ nghĩa từ đó tới nay, và Java Memory Model chương 16 mô tả vẫn là JMM hiện hành. Cái đã đổi là **bối cảnh**: virtual thread làm nhiều lời khuyên về sizing pool ở chương 8 không còn là ràng buộc như trước. Chặng Modern Concurrency in Java ở sau trên con đường sẽ nói cái gì đổi — đừng tự suy diễn.",
      "**Chỉ đọc mà không chạy.** Nhiều bug concurrency chỉ hiện ra khi bạn thật sự chạy code sai trên máy nhiều nhân. Bảy trong mười tuần có bài thực hành gõ tay; bỏ chúng là bỏ nửa cuốn sách.",
      "**Nhớ kết luận mà quên điều kiện.** Ví dụ: \"volatile đủ cho biến cờ\" đúng, nhưng \"volatile đủ cho bộ đếm\" sai — cùng một từ khoá, khác điều kiện. Sách rất cẩn thận về ranh giới này; người đọc thường không.",
    ],
    doneWhen: [
      "Nhìn một class có state chia sẻ và nói được nó thread-safe hay không, kèm lý do dựa trên bất biến chứ không dựa trên cảm giác.",
      "Viết được synchronization policy cho một class bằng ngôn ngữ của chương 4.5, và đánh dấu bằng `@GuardedBy`.",
      "Bắt được một deadlock từ thread dump và chỉ ra thứ tự lock gây ra nó.",
      "Giải thích được vì sao double-checked locking là phản mẫu, bằng từ vựng happens-before của chương 16.",
      "Viết được một test jcstress chứng minh một race, và chứng minh bản đã sửa qua được.",
    ],
  },
```

- [ ] **Bước 6: Thêm số đếm kỳ vọng vào `check-data.mjs`**

Trong object `EXPECTED.counts`, thêm sau khối `wgjd`:

```js
    // Lĩnh vực Java Concurrency in Practice — 13 chương (2–8, 10, 11, 13–16)
    // + phụ lục A; chương 1, 9 (GUI) và 12 (kiểm thử) không có trong bản dịch.
    "docs:jcip": 14,
```

**Chưa** thêm `"roadmap-items:jcip"` — Task 8 mới thêm, cùng lúc bật module `roadmap`.

- [ ] **Bước 7: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**, không dòng `✗` nào.

Nếu đỏ, đọc đúng bất biến báo lỗi:
- `#2` / `#2b`: một `file` hoặc một trong 204 ảnh không có trên đĩa — kiểm lại tên tệp ở Task 1.
- `#2c`: `file` không có dạng `content/jcip/…`.
- `D1`: `chapter` sai kiểu (phải là số nguyên dương hoặc chuỗi một chữ hoa), hoặc `title` còn tiền tố `Chương N. `.
- `P1`: quên thêm `jcip` vào `PATHS.java.fields`.
- `G1`: khai module `guide` mà thiếu `fieldGuides.jcip`.
- `N3`: thiếu khoá `docs:jcip` trong `EXPECTED.counts`.

- [ ] **Bước 8: Xác nhận số tài liệu đã lên 227**

```bash
cd webapp && node --input-type=module -e '
const d = await import("./js/data/index.js");
const {FIELDS} = await import("./js/data/fields.js");
console.log("lĩnh vực:", Object.keys(FIELDS).length, "(kỳ vọng 12)");
console.log("tài liệu:", d.allDocs.length, "(kỳ vọng 227)");
console.log("tài liệu jcip:", d.getDocs("jcip").length, "(kỳ vọng 14)");
' && cd ..
```

- [ ] **Bước 9: Commit**

```bash
git add webapp/js/data/fields.js webapp/js/data/paths.js webapp/js/data/jcip/docs.js webapp/js/data/docs-index.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -m "feat: lĩnh vực Java Concurrency in Practice — 14 tài liệu

Lĩnh vực thứ 12 của DevPrep. Doc id giữ đúng số chương sách (jcip-02…16
+ jcip-A), bỏ trống 01/09/12 vì ba chương đó không có trong bản dịch.
Con đường Java Backend lên 7 chặng: jcip nằm giữa wgjd và java.
Module roadmap chưa khai — mở ở đợt sau khi đã có dữ liệu lộ trình."
```

---

## Ghi chú chung cho Task 3–7 (viết lộ trình)

Năm task này viết 40 mục lộ trình. Chúng chia sẻ toàn bộ quy ước dưới đây — đọc một lần, áp dụng cho cả năm.

**Tệp và biến export:**

| Task | Tệp | Biến export | Tuần |
|---|---|---|---|
| 3, 4 | `webapp/js/data/jcip/roadmap-part1.js` | `jcipWeeksPart1` | W1–W4 |
| 5 | cả hai tệp | cả hai | W5 (part1), W6 (part2) |
| 6, 7 | `webapp/js/data/jcip/roadmap-part2.js` | `jcipWeeksPart2` | W7–W10 |

Task 3 tạo tệp part1 với đầu tệp + W1–W2; Task 4 nối W3–W4; Task 5 nối W5 để **đóng part1**, rồi tạo part2 với W6. Task 6 nối W7–W8, Task 7 nối W9–W10 để đóng part2.

**Các tệp này chưa được `roadmap.js` import cho tới Task 8** — nên `check-data.mjs` không nhìn thấy chúng, và mỗi task tự kiểm bằng script riêng ở bước cuối.

**Đầu tệp `roadmap-part1.js`** (Task 3 viết, Task 4–5 không sửa):

```js
// Lộ trình đọc Java Concurrency in Practice — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Java Concurrency in Practice" (Brian Goetz với
// Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea —
// Addison-Wesley, 2006). Thư mục nguồn: sources/jcip/
// Bản dịch gồm chương 2–8, 10, 11, 13–16 và phụ lục A; chương 1, 9 (GUI) và
// 12 (kiểm thử chương trình concurrent) không thuộc phạm vi và không có PDF gốc.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jc-w<N> / jc-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jcipWeeksPart1 = [
```

Đầu tệp `roadmap-part2.js` giống hệt, đổi `Phần 1 (Tuần 1–5)` thành `Phần 2 (Tuần 6–10)` và tên biến thành `jcipWeeksPart2`.

**Hình dạng một tuần:**

```js
  {
    id: "jc-w1",
    week: "Tuần 1",
    title: "…",
    goal: "…",
    practice: "…",
    resources: [
      { label: "JCiP 02 — Thread Safety", href: "#/docs/jcip-02" },
    ],
    items: [ /* đúng 4 mục */ ],
  },
```

Tuần không có bài thực hành (W3, W5, W9) **vẫn phải có khoá `practice`** — viết một câu nói rõ tuần đó dồn sức đọc, ví dụ: `"Tuần này không có bài gõ tay riêng: ba chương thiết kế cần đọc chậm, và bài thực hành tuần trước vẫn nên chạy tiếp."` Script tự kiểm bắt buộc khoá này có mặt.

**Hình dạng một mục:** `{ id, text, lesson }`. `lesson` là chuỗi template literal markdown gồm **đúng bốn khối, đúng thứ tự và đúng nhãn**:

```
**Mục tiêu.** …một câu, nói người đọc sẽ làm được gì sau mục này…

**Đọc.** …dẫn qua từng mục con, mỗi mục con là một link [tên mục](#/docs/jcip-NN), kèm chỉ dẫn đọc kỹ hay đọc lướt…

**Bẫy.** …hai cái bẫy CÓ THẬT trong chương, mỗi cái nói rõ sách cảnh báo gì…

**Tự kiểm tra.** …hai câu hỏi trả lời được sau khi đọc, không phải câu hỏi mẹo…
```

**Quy tắc bắt buộc khi viết `lesson`:**

1. **Đọc chương gốc trước khi viết.** Mở `sources/jcip/NN-slug.md`, đọc đúng những mục con mà mục lộ trình phụ trách. Tên mục trong khối **Đọc** phải là tên mục **có thật** trong bản dịch — bảng "Mục con nguồn" ở mỗi task cho biết đọc mục nào, và tên trong bảng đã trích nguyên văn từ heading của bản dịch.
2. **Không bịa số liệu, tên class, tên API.** Sách rất nhiều listing có tên (`UnsafeCountingFactorizer`, `SafeCache`…) — chỉ nhắc tên nào bạn thật sự thấy trong chương.
3. **Bẫy phải là bẫy sách nói**, không phải kinh nghiệm chung chung của người viết.
4. Link luôn dạng `#/docs/jcip-NN` — bất biến #3 kiểm id có thật, #3b kiểm cùng con đường. **Không link sang lĩnh vực khác trong `lesson`** (dùng `related.js` ở Task 9 cho việc đó).
5. Escape dấu backtick trong template literal bằng `` \` ``, và dấu `$` đứng trước `{` bằng `\$`.

**Ví dụ một mục viết đủ chuẩn** (đây là mục `jc-w1-3` thật, dùng làm khuôn cho 39 mục còn lại):

```js
      {
        id: "jc-w1-3",
        text: "Locking: intrinsic lock và tính reentrant",
        lesson: `**Mục tiêu.** Giải thích được vì sao làm cho từng biến state atomic riêng lẻ vẫn không đủ để một class thread-safe, và nói được intrinsic lock của Java bảo vệ cái gì cùng vì sao nó reentrant.

**Đọc.** [2.3. Locking](#/docs/jcip-02) mở đầu bằng một servlet nhớ đệm kết quả gần nhất — đọc kỹ chỗ sách chỉ ra rằng dùng hai biến atomic vẫn hỏng, vì bất biến ràng buộc hai biến đó với nhau. Rồi [2.3.1. Intrinsic Locks](#/docs/jcip-02) cho khối \`synchronized\` và monitor lock, và [2.3.2. Reentrancy](#/docs/jcip-02) — mục ngắn nhưng quan trọng: gõ lại ví dụ lớp con gọi \`super\` mà sách đưa ra, và tự hỏi điều gì xảy ra nếu lock không reentrant.

**Bẫy.** Nghĩ rằng cứ làm mọi biến thành atomic là xong. Sách nói thẳng: khi một bất biến ràng buộc nhiều biến với nhau, các biến đó phải được đọc và ghi trong **cùng một** atomic operation — atomic từng biến riêng lẻ không cứu được. Bẫy thứ hai: tưởng \`synchronized\` trên method là bảo vệ method; nó bảo vệ **object**, và mọi method \`synchronized\` của cùng một object dùng chung một lock.

**Tự kiểm tra.** Trong ví dụ servlet nhớ đệm, hai bất biến nào bị vi phạm khi dùng hai biến atomic riêng lẻ? Và nếu intrinsic lock không reentrant, đoạn mã lớp con gọi \`super\` sẽ xảy ra chuyện gì?`,
      },
```

**Bước cuối chung cho Task 3–7** — script tự kiểm, thay `<PART>`, `<BIẾN>`, `<SỐ TUẦN>`, `<SỐ MỤC>` theo task:

```bash
node --input-type=module -e '
const m = await import("./webapp/js/data/jcip/roadmap-<PART>.js");
const weeks = m.<BIẾN>;
const items = weeks.flatMap(w => w.items);
const bad = [];
if (weeks.length !== <SỐ TUẦN>) bad.push(`tuần: ${weeks.length} ≠ <SỐ TUẦN>`);
if (items.length !== <SỐ MỤC>) bad.push(`mục: ${items.length} ≠ <SỐ MỤC>`);
for (const w of weeks) {
  if (w.items.length !== 4) bad.push(`${w.id} có ${w.items.length} mục, phải là 4`);
  for (const k of ["id","week","title","goal","practice","resources"])
    if (!w[k]) bad.push(`${w.id} thiếu ${k}`);
  for (const it of w.items) {
    if (!it.id.startsWith(w.id + "-")) bad.push(`${it.id} không khớp tiền tố ${w.id}-`);
    for (const blk of ["**Mục tiêu.**","**Đọc.**","**Bẫy.**","**Tự kiểm tra.**"])
      if (!it.lesson.includes(blk)) bad.push(`${it.id} thiếu khối ${blk}`);
    for (const ref of it.lesson.matchAll(/#\/docs\/([a-zA-Z0-9-]+)/g))
      if (!/^jcip-(0[2-8]|1[013456]|A)$/.test(ref[1])) bad.push(`${it.id} link lạ: ${ref[1]}`);
  }
}
const dup = items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i);
if (dup.length) bad.push(`id trùng: ${dup}`);
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: <SỐ TUẦN> tuần, <SỐ MỤC> mục, id và khối hợp lệ");
process.exit(bad.length ? 1 : 0);
'
```

Regex `^jcip-(0[2-8]|1[013456]|A)$` cho đúng 14 id hợp lệ và chặn `jcip-01`, `jcip-09`, `jcip-12` — ba id để trống vĩnh viễn.

---

## Task 3: Lộ trình tuần 1–2 (ch.2 + phụ lục A, ch.3)

**Files:**
- Create: `webapp/js/data/jcip/roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `jcip-02`, `jcip-03`, `jcip-A` từ Task 2.
- Produces: `export const jcipWeeksPart1` — mảng tuần mà Task 4 và 5 nối thêm vào, và Task 8 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc hai chương nguồn và phụ lục**

```bash
grep -E '^#{2,3} ' sources/jcip/02-thread-safety.md sources/jcip/03-sharing-objects.md sources/jcip/A-annotations-for-concurrency.md
```

Rồi đọc nội dung các mục con sẽ viết ở Bước 3. Không viết `lesson` trước khi đọc — mọi tên mục và cái bẫy phải lấy từ bản dịch.

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/jcip/roadmap-part1.js` với khối chú thích đầu tệp và dòng `export const jcipWeeksPart1 = [` như mô tả ở "Ghi chú chung", rồi đóng bằng `];`.

- [ ] **Bước 3: Viết tuần 1 và tuần 2**

**Tuần 1** — `id: "jc-w1"`, `week: "Tuần 1"`, `title: "Thread safety, atomicity và locking"`.

`goal`: Nói được một class thread-safe nghĩa là gì bằng ngôn ngữ bất biến, nhận ra hai dạng race condition mà sách đặt tên, và biết bốn annotation mà mọi listing code về sau sẽ dùng.

`practice`: Lấy servlet đếm số ở chương 2 (bản không đồng bộ), viết một test cho nhiều thread gọi đồng thời và làm cho bộ đếm sai. Sửa bằng `synchronized`, chạy lại test để nó xanh, rồi đo throughput hai bản và ghi lại chênh lệch — đó chính là cái giá của lock mà mục 2.5 nói tới.

`resources`: `{ label: "JCiP 02 — Thread Safety", href: "#/docs/jcip-02" }`, `{ label: "JCiP A — Annotations for Concurrency", href: "#/docs/jcip-A" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w1-1` | Thread safety là gì, và stateless thì miễn nhiễm | ch.2 — 2.1. Thread Safety là gì?; 2.1.1. Ví dụ: Một Stateless Servlet |
| `jc-w1-2` | Atomicity: race condition, lazy initialization và compound action | ch.2 — 2.2. Atomicity; 2.2.1. Race Conditions; 2.2.2. Ví dụ: Race Condition trong Lazy Initialization; 2.2.3. Compound Actions |
| `jc-w1-3` | Locking: intrinsic lock và tính reentrant | ch.2 — 2.3. Locking; 2.3.1. Intrinsic Locks; 2.3.2. Reentrancy |
| `jc-w1-4` | Bảo vệ state bằng lock, cái giá của lock, và bộ annotation của sách | ch.2 — 2.4. Bảo vệ State bằng Lock; 2.5. Liveness và Performance · phụ lục A — A.1. Class Annotation; A.2. Field và Method Annotation |

Mục `jc-w1-3` đã được viết sẵn đầy đủ ở "Ghi chú chung" — chép nguyên vào tệp.

**Tuần 2** — `id: "jc-w2"`, `week: "Tuần 2"`, `title: "Chia sẻ object: visibility, confinement và safe publication"`.

`goal`: Giải thích được vì sao một thread ghi mà thread khác không thấy, và chọn đúng một trong các idiom safe publication cho từng tình huống.

`practice`: Viết đoạn mã tái hiện lỗi visibility mà mục 3.1.1 mô tả — một thread chạy vòng lặp đọc biến cờ không `volatile`, thread khác đặt cờ, và vòng lặp không bao giờ dừng. Chạy với `-server` để thấy nó thật sự treo. Rồi sửa hai cách — bằng `volatile`, và bằng `synchronized` cho cả đọc lẫn ghi — và viết ra vì sao cả hai đều đúng nhưng khác nhau.

`resources`: `{ label: "JCiP 03 — Sharing Objects", href: "#/docs/jcip-03" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w2-1` | Visibility: stale data, phép ghi 64-bit, và biến volatile | ch.3 — 3.1. Visibility; 3.1.1. Stale Data; 3.1.2. Các Operation 64-bit không Atomic; 3.1.3. Locking và Visibility; 3.1.4. Biến Volatile |
| `jc-w2-2` | Publication, escape, và thread confinement | ch.3 — 3.2. Publication và Escape; 3.2.1. Thực hành khởi tạo an toàn; 3.3. Thread Confinement; 3.3.1. Ad-hoc Thread Confinement; 3.3.2. Stack Confinement; 3.3.3. ThreadLocal |
| `jc-w2-3` | Immutability và final field | ch.3 — 3.4. Immutability; 3.4.1. Final Fields; 3.4.2. Ví dụ: Dùng Volatile để Publish Immutable Object |
| `jc-w2-4` | Safe publication: chọn idiom nào cho tình huống nào | ch.3 — 3.5. Safe Publication; 3.5.1. Publication không đúng cách; 3.5.2. Immutable Object và Initialization Safety; 3.5.3. Các Idiom cho Safe Publication; 3.5.4. Object Effectively Immutable; 3.5.5. Mutable Object; 3.5.6. Share Object một cách an toàn |

- [ ] **Bước 4: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`jcipWeeksPart1`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**. Tệp mới chưa được import nên `check-data.mjs` chưa nhìn thấy nó; bước này chỉ để chắc chắn bạn không lỡ tay sửa tệp khác.

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/jcip/roadmap-part1.js
git commit -m "feat: lộ trình đọc Java Concurrency in Practice tuần 1-2 — 8 mục"
```

---

## Task 4: Lộ trình tuần 3–4 (ch.4, ch.5)

**Files:**
- Modify: `webapp/js/data/jcip/roadmap-part1.js`

**Interfaces:**
- Consumes: `jcipWeeksPart1` từ Task 3; doc id `jcip-04`, `jcip-05` từ Task 2.
- Produces: `jcipWeeksPart1` với 4 tuần / 16 mục.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
grep -E '^#{2,3} ' sources/jcip/04-composing-objects.md sources/jcip/05-building-blocks.md
```

Đọc nội dung các mục con ở Bước 2.

- [ ] **Bước 2: Nối tuần 3 và tuần 4 vào cuối mảng `jcipWeeksPart1`**

**Tuần 3** — `id: "jc-w3"`, `week: "Tuần 3"`, `title: "Ghép object: confinement, uỷ quyền và tài liệu hoá policy"`.

`goal`: Xây được một class thread-safe từ các thành phần thread-safe có sẵn, và viết ra được synchronization policy của nó thay vì để nó nằm trong đầu.

`practice`: Tuần này không có bài gõ tay riêng — chương 4 là chương thiết kế, cần đọc chậm và vẽ lại quan hệ sở hữu state. Nếu còn thời gian, quay lại bài thực hành tuần 2 và thử áp Java monitor pattern cho class bạn đã sửa.

`resources`: `{ label: "JCiP 04 — Composing Objects", href: "#/docs/jcip-04" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w3-1` | Thiết kế class thread-safe: bất biến, operation phụ thuộc state, quyền sở hữu | ch.4 — 4.1. Thiết kế một Thread-safe Class; 4.1.1. Thu thập các yêu cầu về Synchronization; 4.1.2. Các Operation phụ thuộc State; 4.1.3. Quyền sở hữu State |
| `jc-w3-2` | Instance confinement và Java monitor pattern | ch.4 — 4.2. Instance Confinement; 4.2.1. Java Monitor Pattern; 4.2.2. Ví dụ: Theo dõi đội xe |
| `jc-w3-3` | Uỷ quyền thread safety — và chỗ uỷ quyền thất bại | ch.4 — 4.3. Ủy quyền Thread Safety; 4.3.1. Ví dụ: Vehicle Tracker dùng Delegation; 4.3.2. Các State Variable độc lập; 4.3.3. Khi Delegation thất bại; 4.3.4. Publish các State Variable nền tảng; 4.3.5. Ví dụ: Vehicle Tracker publish State của nó |
| `jc-w3-4` | Thêm chức năng vào class có sẵn, và ghi tài liệu synchronization policy | ch.4 — 4.4. Thêm chức năng vào các Thread-safe Class có sẵn; 4.4.1. Client-side Locking; 4.4.2. Composition; 4.5. Ghi tài liệu về Synchronization Policy; 4.5.1. Diễn giải tài liệu mơ hồ |

**Tuần 4** — `id: "jc-w4"`, `week: "Tuần 4"`, `title: "Building block của java.util.concurrent"`.

`goal`: Chọn đúng collection và đúng synchronizer cho từng bài toán, và hiểu vì sao `ConcurrentHashMap` không chỉ là `synchronizedMap` nhanh hơn.

`practice`: Xây lại result cache của mục 5.6 theo đúng trình tự sách đưa ra: bắt đầu từ `HashMap` bọc `synchronized`, rồi `ConcurrentHashMap`, rồi `FutureTask`. Ở mỗi bước, chạy nhiều thread cùng yêu cầu một khoá và đếm số lần phép tính bị chạy trùng. Ba con số đó là bài học của mục này.

`resources`: `{ label: "JCiP 05 — Building Blocks", href: "#/docs/jcip-05" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w4-1` | Synchronized collection và vì sao lặp trên nó vẫn hỏng | ch.5 — 5.1. Synchronized Collections; 5.1.1. Vấn đề với Synchronized Collections; 5.1.2. Iterator và ConcurrentModificationException; 5.1.3. Iterator ẩn |
| `jc-w4-2` | Concurrent collection: ConcurrentHashMap và CopyOnWriteArrayList | ch.5 — 5.2. Concurrent Collections; 5.2.1. ConcurrentHashMap; 5.2.2. Các Atomic Map Operation bổ sung; 5.2.3. CopyOnWriteArrayList |
| `jc-w4-3` | BlockingQueue, producer-consumer, và method interrupt được | ch.5 — 5.3. Blocking Queue và Pattern Producer-Consumer; 5.3.1. Ví dụ: Desktop Search; 5.3.2. Serial Thread Confinement; 5.3.3. Deque và Work Stealing; 5.4. Các Method Blocking và Interruptible |
| `jc-w4-4` | Bốn synchronizer, và một result cache tiến hoá dần | ch.5 — 5.5. Synchronizers; 5.5.1. Latch; 5.5.2. FutureTask; 5.5.3. Semaphore; 5.5.4. Barrier; 5.6. Xây dựng một Result Cache hiệu quả, có khả năng mở rộng |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`jcipWeeksPart1`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**.

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jcip/roadmap-part1.js
git commit -m "feat: lộ trình đọc Java Concurrency in Practice tuần 3-4 — 8 mục"
```

---

## Task 5: Lộ trình tuần 5–6 (ch.6, ch.7) — đóng part1, mở part2

**Files:**
- Modify: `webapp/js/data/jcip/roadmap-part1.js`
- Create: `webapp/js/data/jcip/roadmap-part2.js`

**Interfaces:**
- Consumes: `jcipWeeksPart1` từ Task 4; doc id `jcip-06`, `jcip-07` từ Task 2.
- Produces: `jcipWeeksPart1` hoàn chỉnh (5 tuần / 20 mục) và `export const jcipWeeksPart2` (1 tuần / 4 mục) mà Task 6–7 nối thêm.

Task này là task duy nhất đụng hai tệp: W5 đóng part1, W6 mở part2. Ranh giới tệp theo spec §6 (part1 = W1–5, part2 = W6–10), không đổi.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
grep -E '^#{2,3} ' sources/jcip/06-task-execution.md sources/jcip/07-cancellation-and-shutdown.md
```

- [ ] **Bước 2: Nối tuần 5 vào cuối `jcipWeeksPart1`**

**Tuần 5** — `id: "jc-w5"`, `week: "Tuần 5"`, `title: "Thực thi task: từ thread thủ công tới framework Executor"`.

`goal`: Tách được việc gửi task khỏi việc chạy task, và nói được execution policy gồm những gì.

`practice`: Tuần này không có bài gõ tay riêng — chương 6 đọc để đổi cách nghĩ, và tuần 6 sẽ có bài nặng về huỷ task. Nếu còn thời gian, chạy lại ví dụ page renderer của mục 6.3 qua ba phiên bản (tuần tự, Future, CompletionService) và so thời gian.

`resources`: `{ label: "JCiP 06 — Task Execution", href: "#/docs/jcip-06" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w5-1` | Ba cách chạy task, và vì sao tạo thread không giới hạn thì sụp | ch.6 — 6.1. Thực thi Task trong Thread; 6.1.1. Thực thi Task tuần tự; 6.1.2. Tạo Thread tường minh cho từng Task; 6.1.3. Nhược điểm của việc tạo Thread không giới hạn |
| `jc-w5-2` | Framework Executor: execution policy, thread pool, vòng đời | ch.6 — 6.2. Framework Executor; 6.2.1. Ví dụ: Web Server dùng Executor; 6.2.2. Execution Policy; 6.2.3. Thread Pool; 6.2.4. Vòng đời của Executor; 6.2.5. Task có trì hoãn và định kỳ |
| `jc-w5-3` | Tìm parallelism khai thác được: Callable, Future, và giới hạn của nó | ch.6 — 6.3. Tìm kiếm Parallelism có thể khai thác; 6.3.1. Ví dụ: Page Renderer tuần tự; 6.3.2. Task có mang kết quả: Callable và Future; 6.3.3. Ví dụ: Page Renderer dùng Future; 6.3.4. Hạn chế của việc song song hóa các Task không đồng nhất |
| `jc-w5-4` | CompletionService, và đặt hạn thời gian cho task | ch.6 — 6.3.5. CompletionService: Khi Executor gặp BlockingQueue; 6.3.6. Ví dụ: Page Renderer dùng CompletionService; 6.3.7. Đặt giới hạn thời gian cho Task; 6.3.8. Ví dụ: Cổng đặt chỗ du lịch |

- [ ] **Bước 3: Tạo `roadmap-part2.js` với đầu tệp và tuần 6**

Đầu tệp như mô tả ở "Ghi chú chung" (`Phần 2 (Tuần 6–10)`, biến `jcipWeeksPart2`).

**Tuần 6** — `id: "jc-w6"`, `week: "Tuần 6"`, `title: "Huỷ và shutdown: thứ Java không cho bạn làm bằng vũ lực"`.

`goal`: Huỷ được một task đang chạy đúng cách, và nói được vì sao `Thread.stop()` bị bỏ còn interruption thì phải hợp tác mới có tác dụng.

`practice`: Viết một service chạy vòng lặp dài, huỷ được bằng interrupt đúng cách theo mục 7.1.3. Rồi cố tình phá nó theo hai cách sách cảnh báo — bắt `InterruptedException` rồi nuốt luôn, và bắt rồi quên gọi lại `Thread.currentThread().interrupt()` — chạy lại và ghi lại chuyện gì xảy ra ở mỗi bản.

`resources`: `{ label: "JCiP 07 — Cancellation and Shutdown", href: "#/docs/jcip-07" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w6-1` | Interruption là một cơ chế hợp tác, không phải lệnh dừng | ch.7 — 7.1. Hủy Task; 7.1.1. Interruption; 7.1.2. Interruption Policy; 7.1.3. Phản hồi Interruption; 7.1.4. Ví dụ: Timed Run |
| `jc-w6-2` | Huỷ qua Future, và blocking không interrupt được | ch.7 — 7.1.5. Cancellation qua Future; 7.1.6. Xử lý Blocking không thể Interrupt; 7.1.7. Encapsulate Cancellation phi tiêu chuẩn với newTaskFor |
| `jc-w6-3` | Dừng một service: shutdown ExecutorService và poison pill | ch.7 — 7.2. Dừng một Service dựa trên Thread; 7.2.1. Ví dụ: Một Logging Service; 7.2.2. Shutdown ExecutorService; 7.2.3. Poison Pill; 7.2.4. Ví dụ: Một Execution Service dùng một lần; 7.2.5. Hạn chế của shutdownNow |
| `jc-w6-4` | Thread chết bất thường, và JVM tắt: hook, daemon, finalizer | ch.7 — 7.3. Xử lý việc Thread kết thúc bất thường; 7.3.1. Uncaught Exception Handler; 7.4. JVM Shutdown; 7.4.1. Shutdown Hook; 7.4.2. Daemon Thread; 7.4.3. Finalizer |

- [ ] **Bước 4: Chạy script tự kiểm cho CẢ HAI tệp — kỳ vọng XANH**

Chạy hai lần:
- `<PART>`=`part1`, `<BIẾN>`=`jcipWeeksPart1`, `<SỐ TUẦN>`=`5`, `<SỐ MỤC>`=`20`
- `<PART>`=`part2`, `<BIẾN>`=`jcipWeeksPart2`, `<SỐ TUẦN>`=`1`, `<SỐ MỤC>`=`4`

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**.

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/jcip/roadmap-part1.js webapp/js/data/jcip/roadmap-part2.js
git commit -m "feat: lộ trình đọc Java Concurrency in Practice tuần 5-6 — 8 mục

Tuần 5 đóng part1 (20 mục), tuần 6 mở part2."
```

---

## Task 6: Lộ trình tuần 7–8 (ch.8 + ch.10, ch.11)

**Files:**
- Modify: `webapp/js/data/jcip/roadmap-part2.js`

**Interfaces:**
- Consumes: `jcipWeeksPart2` từ Task 5; doc id `jcip-08`, `jcip-10`, `jcip-11` từ Task 2.
- Produces: `jcipWeeksPart2` với 3 tuần / 12 mục.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
grep -E '^#{2,3} ' sources/jcip/08-applying-thread-pools.md sources/jcip/10-avoiding-liveness-hazards.md sources/jcip/11-performance-and-scalability.md
```

- [ ] **Bước 2: Nối tuần 7 và tuần 8 vào cuối `jcipWeeksPart2`**

**Tuần 7** — `id: "jc-w7"`, `week: "Tuần 7"`, `title: "Thread pool chạy sai thì hỏng thế nào: từ starvation tới deadlock"`.

Ghép ch.8 và ch.10 là có chủ ý: mục 8.1 (task gắn ngầm với execution policy) dẫn thẳng tới thread starvation deadlock, và chương 10 là chương phân loại đầy đủ các dạng deadlock.

`goal`: Nhận ra được khi nào một task **không** an toàn để chạy trong một pool nhất định, và đọc được thread dump để chỉ ra thứ tự lock gây deadlock.

`practice`: Viết hai class cùng khoá hai object nhưng theo thứ tự ngược nhau, chạy đủ nhiều lần để nó treo thật. Chạy `jstack <pid>` bắt thread dump, tìm cho ra phần JVM chỉ đích danh deadlock và hai lock liên quan. Rồi sửa bằng lock ordering nhất quán và chứng minh nó không treo nữa.

`resources`: `{ label: "JCiP 08 — Applying Thread Pools", href: "#/docs/jcip-08" }`, `{ label: "JCiP 10 — Avoiding Liveness Hazards", href: "#/docs/jcip-10" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w7-1` | Task gắn ngầm với execution policy, và cách tính kích thước pool | ch.8 — 8.1. Sự gắn kết ngầm giữa Task và Execution Policy; 8.1.1. Thread Starvation Deadlock; 8.1.2. Task chạy lâu; 8.2. Xác định kích thước Thread Pool |
| `jc-w7-2` | Cấu hình và mở rộng ThreadPoolExecutor | ch.8 — 8.3. Cấu hình ThreadPoolExecutor; 8.3.1. Tạo và hủy Thread; 8.3.2. Quản lý các Task trong hàng đợi; 8.3.3. Saturation Policy; 8.3.4. Thread Factory; 8.3.5. Tùy biến ThreadPoolExecutor sau khi construct; 8.4. Mở rộng ThreadPoolExecutor; 8.4.1. Ví dụ: thêm thống kê vào một Thread Pool; 8.5. Song song hóa các thuật toán đệ quy; 8.5.1. Ví dụ: Một Framework giải đố |
| `jc-w7-3` | Năm dạng deadlock | ch.10 — 10.1. Deadlock; 10.1.1. Lock-ordering Deadlock; 10.1.2. Deadlock do thứ tự Lock động; 10.1.3. Deadlock giữa các Object hợp tác; 10.1.4. Open Call; 10.1.5. Resource Deadlock |
| `jc-w7-4` | Tránh, chẩn đoán, và ba nguy cơ liveness còn lại | ch.10 — 10.2. Tránh và chẩn đoán Deadlock; 10.2.1. Thử acquire Lock có timeout; 10.2.2. Phân tích Deadlock bằng Thread Dump; 10.3. Các nguy cơ Liveness khác; 10.3.1. Starvation; 10.3.2. Khả năng đáp ứng kém; 10.3.3. Livelock |

**Tuần 8** — `id: "jc-w8"`, `week: "Tuần 8"`, `title: "Hiệu năng và khả năng mở rộng: đo, đừng đoán"`.

`goal`: Phân biệt được tối ưu cho hiệu năng và tối ưu cho khả năng mở rộng, và chỉ ra được phần tuần tự trong một hệ thống bằng định luật Amdahl.

`practice`: Dựng lại phép đo của mục 11.5: cùng một khối lượng công việc trên `ConcurrentHashMap` và trên `synchronizedMap`, chạy với số thread tăng dần (1, 2, 4, 8, 16). Vẽ hai đường throughput và đối chiếu hình dạng chúng với điều định luật Amdahl dự đoán.

`resources`: `{ label: "JCiP 11 — Performance and Scalability", href: "#/docs/jcip-11" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w8-1` | Performance khác scalability, và mọi tối ưu đều là đánh đổi | ch.11 — 11.1. Suy nghĩ về Performance; 11.1.1. Performance so với Scalability; 11.1.2. Đánh giá các đánh đổi về Performance |
| `jc-w8-2` | Định luật Amdahl và serialization ẩn trong framework | ch.11 — 11.2. Định luật Amdahl; 11.2.1. Ví dụ: Serialization ẩn trong Framework; 11.2.2. Áp dụng định luật Amdahl một cách định tính |
| `jc-w8-3` | Ba khoản chi phí do thread gây ra | ch.11 — 11.3. Các chi phí do Thread gây ra; 11.3.1. Context Switching; 11.3.2. Memory Synchronization; 11.3.3. Blocking |
| `jc-w8-4` | Bảy cách giảm tranh chấp lock, và một lời khuyên ngược đời | ch.11 — 11.4. Giảm tranh chấp Lock; 11.4.1. Thu hẹp phạm vi Lock; 11.4.2. Giảm độ mịn của Lock; 11.4.3. Lock Striping; 11.4.4. Tránh Hot Field; 11.4.5. Các lựa chọn thay thế Exclusive Lock; 11.4.6. Giám sát mức sử dụng CPU; 11.4.7. Hãy nói không với Object Pooling; 11.5. Ví dụ: So sánh Performance của Map; 11.6. Giảm Overhead của Context Switch |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part2`, `<BIẾN>`=`jcipWeeksPart2`, `<SỐ TUẦN>`=`3`, `<SỐ MỤC>`=`12`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**.

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jcip/roadmap-part2.js
git commit -m "feat: lộ trình đọc Java Concurrency in Practice tuần 7-8 — 8 mục"
```

---

## Task 7: Lộ trình tuần 9–10 (ch.13 + ch.14, ch.15 + ch.16)

**Files:**
- Modify: `webapp/js/data/jcip/roadmap-part2.js`

**Interfaces:**
- Consumes: `jcipWeeksPart2` từ Task 6; doc id `jcip-13`, `jcip-14`, `jcip-15`, `jcip-16` từ Task 2.
- Produces: `jcipWeeksPart2` hoàn chỉnh — 5 tuần / 20 mục. Cộng với part1 là 10 tuần / 40 mục cho Task 8.

- [ ] **Bước 1: Đọc bốn chương nguồn**

```bash
grep -E '^#{2,3} ' sources/jcip/13-explicit-locks.md sources/jcip/14-building-custom-synchronizers.md sources/jcip/15-atomic-variables-and-nonblocking-synchronization.md sources/jcip/16-the-java-memory-model.md
```

- [ ] **Bước 2: Nối tuần 9 và tuần 10 vào cuối `jcipWeeksPart2`**

**Tuần 9** — `id: "jc-w9"`, `week: "Tuần 9"`, `title: "Explicit lock và tự xây synchronizer trên AQS"`.

Ghép ch.13 và ch.14 là bắt buộc về mạch: mục 14.5–14.6 xây AQS trên chính interface `Lock` mà mục 13.1 vừa giới thiệu.

`goal`: Chọn được giữa `synchronized` và `ReentrantLock` bằng tiêu chí chứ không bằng thói quen, và đọc được cách `ReentrantLock`, `Semaphore`, `CountDownLatch`, `FutureTask` đều dựng trên cùng một khung AQS.

`practice`: Tuần này không có bài gõ tay riêng — hai chương này nặng nhất lộ trình (14.893 từ) và mục 14.2 có tám tiểu mục cần đọc rất chậm. Dồn sức đọc; bài thực hành jcstress tuần 10 sẽ dùng lại đúng những gì học ở đây.

`resources`: `{ label: "JCiP 13 — Explicit Locks", href: "#/docs/jcip-13" }`, `{ label: "JCiP 14 — Building Custom Synchronizers", href: "#/docs/jcip-14" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w9-1` | ReentrantLock cho ba thứ intrinsic lock không có | ch.13 — 13.1. Lock và ReentrantLock; 13.1.1. Acquire Lock có Poll và có Timeout; 13.1.2. Acquire Lock có thể Interrupt; 13.1.3. Locking không theo cấu trúc khối; 13.2. Cân nhắc về Performance |
| `jc-w9-2` | Fairness có giá của nó, và khi nào dùng read-write lock | ch.13 — 13.3. Fairness; 13.4. Chọn giữa synchronized và ReentrantLock; 13.5. Read-write Lock |
| `jc-w9-3` | Condition queue: chờ trong vòng lặp, missed signal, notify hay notifyAll | ch.14 — 14.1. Quản lý State Dependence; 14.1.1. Ví dụ: Lan truyền việc precondition không thỏa mãn tới Caller; 14.1.2. Ví dụ: Blocking thô sơ bằng Poll và Sleep; 14.1.3. Condition Queue đến cứu nguy; 14.2. Sử dụng Condition Queue (cả 8 tiểu mục 14.2.1–14.2.8) |
| `jc-w9-4` | Condition tường minh, giải phẫu synchronizer, và AQS | ch.14 — 14.3. Object Condition tường minh; 14.4. Giải phẫu một Synchronizer; 14.5. AbstractQueuedSynchronizer; 14.5.1. Một Latch đơn giản; 14.6. AQS trong các class Synchronizer của java.util.concurrent; 14.6.1. ReentrantLock; 14.6.2. Semaphore và CountDownLatch; 14.6.3. FutureTask; 14.6.4. ReentrantReadWriteLock |

**Tuần 10** — `id: "jc-w10"`, `week: "Tuần 10"`, `title: "CAS, thuật toán nonblocking, và Java Memory Model đóng khung"`.

`goal`: Giải thích được vì sao một thuật toán nonblocking là đúng, bằng từ vựng happens-before của chương 16 — và chứng minh được điều đó bằng công cụ thay vì bằng lập luận.

`practice`: Viết một test **jcstress** chứng minh một race có thật — ví dụ hai thread ghi/đọc một biến không `volatile`, hoặc bản double-checked locking hỏng mà mục 16.2.4 mô tả. Chạy cho ra kết quả `FORBIDDEN` hoặc `ACCEPTABLE_INTERESTING`. Rồi sửa (thêm `volatile`, hoặc dùng idiom holder class) và chạy lại để chứng minh bản sửa không còn cho ra kết quả sai. Đây là phần bù cho chương 12 vắng mặt.

`resources`: `{ label: "JCiP 15 — Atomic Variables and Nonblocking Synchronization", href: "#/docs/jcip-15" }`, `{ label: "JCiP 16 — The Java Memory Model", href: "#/docs/jcip-16" }`, `{ label: "openjdk.org — jcstress (bù chương 12: kiểm thử chương trình concurrent)", href: "https://openjdk.org/projects/code-tools/jcstress/" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jc-w10-1` | Vì sao lock đắt khi tranh chấp, và compare-and-swap thay thế thế nào | ch.15 — 15.1. Nhược điểm của Locking; 15.2. Hỗ trợ phần cứng cho Concurrency; 15.2.1. Compare and Swap; 15.2.2. Một Counter Nonblocking; 15.2.3. Hỗ trợ CAS trong JVM |
| `jc-w10-2` | Atomic variable và thuật toán nonblocking — kể cả vấn đề ABA | ch.15 — 15.3. Các class Atomic Variable; 15.3.1. Atomic như "Volatile tốt hơn"; 15.3.2. So sánh Performance: Lock so với Atomic Variable; 15.4. Thuật toán Nonblocking; 15.4.1. Một Stack Nonblocking; 15.4.2. Một Linked List Nonblocking; 15.4.3. Atomic Field Updater; 15.4.4. Vấn đề ABA |
| `jc-w10-3` | Memory model, reordering và happens-before | ch.16 — 16.1. Memory Model là gì, và tại sao tôi lại muốn có nó?; 16.1.1. Memory Model của nền tảng; 16.1.2. Reordering; 16.1.3. Java Memory Model trong 500 từ hoặc ít hơn; 16.1.4. "Ăn theo" Synchronization (Piggybacking) |
| `jc-w10-4` | Publication nhìn từ JMM, double-checked locking, và initialization safety | ch.16 — 16.2. Publication; 16.2.1. Unsafe Publication; 16.2.2. Safe Publication; 16.2.3. Các idiom khởi tạo an toàn; 16.2.4. Double-checked Locking; 16.3. Initialization Safety |

- [ ] **Bước 3: Chạy script tự kiểm cho cả hai tệp — kỳ vọng XANH**

- `<PART>`=`part1`, `<BIẾN>`=`jcipWeeksPart1`, `<SỐ TUẦN>`=`5`, `<SỐ MỤC>`=`20`
- `<PART>`=`part2`, `<BIẾN>`=`jcipWeeksPart2`, `<SỐ TUẦN>`=`5`, `<SỐ MỤC>`=`20`

- [ ] **Bước 4: Xác nhận id tuần và id mục phủ đủ, không trùng**

```bash
node --input-type=module -e '
const p1 = (await import("./webapp/js/data/jcip/roadmap-part1.js")).jcipWeeksPart1;
const p2 = (await import("./webapp/js/data/jcip/roadmap-part2.js")).jcipWeeksPart2;
const weeks = [...p1, ...p2];
const ids = weeks.map(w => w.id);
const want = Array.from({length:10}, (_,i) => `jc-w${i+1}`);
const items = weeks.flatMap(w => w.items);
console.log("tuần:", weeks.length, "(kỳ vọng 10)");
console.log("mục:", items.length, "(kỳ vọng 40)");
console.log("id tuần đúng thứ tự:", JSON.stringify(ids) === JSON.stringify(want));
console.log("id mục trùng:", items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i));
'
```

Kỳ vọng: `tuần: 10`, `mục: 40`, `id tuần đúng thứ tự: true`, `id mục trùng: []`.

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/jcip/roadmap-part2.js
git commit -m "feat: lộ trình đọc Java Concurrency in Practice tuần 9-10 — đủ 10 tuần / 40 mục

Tuần 10 có bài thực hành jcstress bù cho chương 12 vắng mặt."
```

---

## Task 8: Bật track `jcip`

**Files:**
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/guides.js`
- Modify: `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `jcipWeeksPart1` (Task 5), `jcipWeeksPart2` (Task 7), và `fieldGuides.jcip` với steps manual (Task 2).
- Produces: track id `jcip`, module `roadmap` đã khai, và `fieldGuides.jcip.steps` 2–4 trỏ track qua `href: "#/roadmap/jcip"` + `done: { kind: "track", id: "jcip", … }`.

Bốn tệp phải sửa **cùng một commit**: bất biến #7 chặn khai module `roadmap` khi chưa có track, #7b chặn có track mà chưa khai module, và G3 chặn `steps` trỏ track khi track chưa tồn tại hoặc module `roadmap` chưa khai. Sửa lẻ tệp nào cũng cho ra trạng thái đỏ.

- [ ] **Bước 1: Thêm import vào `roadmap.js`**

Sau các dòng import của `wgjd`:

```js
import { jcipWeeksPart1 } from "./jcip/roadmap-part1.js";
import { jcipWeeksPart2 } from "./jcip/roadmap-part2.js";
```

- [ ] **Bước 2: Cập nhật khối chú thích đầu `roadmap.js`**

Khối này là tài liệu sống — để cũ là sai lệch. Ba chỗ phải sửa:

1. Danh sách track trong đoạn mở đầu: thêm `đọc sách Java Concurrency in Practice` vào chuỗi liệt kê.
2. Bảng tệp: thêm dòng
   ```
   //   jcip/roadmap-part{1,2}.js               (Tuần 1–5 / 6–10)       — 40 mục
   ```
3. Dòng `LƯU Ý` về id: thêm `jc-w1` vào danh sách id tuần và `jc-w1-1` vào danh sách id mục.

- [ ] **Bước 3: Đăng ký track trong mảng `tracks`**

Thêm sau khối `wgjd`, trước dấu `];`:

```js
  {
    id: "jcip",
    field: "jcip",
    label: "Java Concurrency",
    icon: "🔐",
    name: "Đọc Java Concurrency in Practice",
    durationWeeks: 10,
    desc: "Kế hoạch đọc 10 tuần bám theo bản dịch 13 chương và phụ lục A: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; bảy tuần có bài thực hành gõ tay — làm hỏng một servlet rồi sửa, tái hiện lỗi visibility, dựng result cache có khả năng mở rộng, bắt deadlock bằng jstack, đo tranh chấp lock đối chiếu định luật Amdahl, và chứng minh một race bằng jcstress.",
    prereq: "Yêu cầu: viết được Java đa luồng ở mức cơ bản và đọc được stack trace — đây không phải sách nhập môn, và nó dạy nền tảng chứ không dạy API mới nhất. Bản dịch không có chương 1 (giới thiệu), chương 9 (ứng dụng GUI) và chương 12 (kiểm thử chương trình concurrent); phần kiểm thử được bù bằng jcstress ở tuần 10. Sách xuất bản 2006: java.util.concurrent vẫn đúng nguyên, nhưng bối cảnh sizing thread pool đã đổi sau virtual thread — chặng Modern Concurrency in Java ở sau sẽ nói cái gì đổi.",
    weeks: [...jcipWeeksPart1, ...jcipWeeksPart2],
  },
```

- [ ] **Bước 4: Mở module `roadmap` trong `fields.js`**

Sửa `FIELDS.jcip.modules` và xoá khối chú thích tạm đã viết ở Task 2:

```js
    modules: ["dashboard", "guide", "docs", "roadmap"],
```

- [ ] **Bước 5: Thêm `trackGuides.jcip` vào `guides.js`**

Thêm vào object `trackGuides`, sau khối `wgjd`:

```js
  jcip: {
    rhythm: "10 tuần, 4 mục mỗi tuần bám 13 chương và phụ lục A; bảy trong mười tuần có bài gõ tay trên máy thật. Đọc (45–60 phút) → gõ lại listing sai rồi listing đúng → làm bài thực hành của tuần → trả lời tự kiểm tra → tick.",
    before: [
      "JDK 17 trở lên, biên dịch và chạy được từ dòng lệnh.",
      "Một máy nhiều nhân — nhiều bài thực hành chỉ lộ bug khi thật sự chạy song song.",
      "`jstack` gọi được (đi kèm JDK): tuần 7 dùng nó để bắt deadlock.",
      "Biết trước rằng chương 1, 9 (GUI) và 12 (kiểm thử) không có trong bản dịch; phần kiểm thử được bù bằng jcstress ở tuần 10.",
    ],
    during: [
      "Tuần 1–4 là Phần I của sách và là phần không được đọc lướt — mọi chương sau đều xây trên nó.",
      "Mỗi listing sai trong sách đứng ngay trước listing đúng. Gõ cả hai; giá trị nằm ở chỗ hiểu vì sao bản sai lại sai.",
      "Tuần 3, 5 và 9 không có bài gõ tay riêng — đó là ba tuần nặng về đọc thiết kế, dùng thời gian đó để đọc chậm chứ không phải để đi nhanh hơn.",
      "Giữ lại kết quả đo của tuần 8 (ConcurrentHashMap so với synchronizedMap): tuần 10 sẽ hiểu vì sao chênh lệch đó tồn tại.",
    ],
    after: [
      "Viết synchronization policy cho một class thật trong dự án của bạn, đánh dấu bằng `@GuardedBy`.",
      "Sang lĩnh vực Java & Spring Boot Scalability — chặng tiếp theo trên con đường Java Backend, nơi công thức sizing pool của chương 8 được dùng lại vào bài toán Tomcat thật.",
      "Đọc Modern Concurrency in Java để thấy virtual thread đổi những giả định nào của cuốn này, và giữ nguyên những gì.",
    ],
  },
```

- [ ] **Bước 6: Viết lại `fieldGuides.jcip.steps` để trỏ track**

Task 2 để cả 5 bước ở `done: { kind: "manual" }` vì track chưa tồn tại. Giờ track đã có và module `roadmap` đã khai, thay ba bước giữa bằng bản trỏ track. **Giữ nguyên `id`** — chúng là khoá tiến độ trong localStorage.

```js
      { id: "jc-2", title: "Tuần 1–4: nền tảng — thread safety, visibility, composition, building block", desc: "Phần I của sách. Đây là phần không được đọc lướt: mọi chương sau đều xây trên bốn chương này. Kết thúc tuần 4 bạn nên đọc được một class bất kỳ và nói được nó thread-safe hay không, và vì sao.", href: "#/roadmap/jcip", done: { kind: "track", id: "jcip", pct: 40 } },
      { id: "jc-3", title: "Tuần 5–8: cấu trúc ứng dụng concurrent và cái giá của nó", desc: "Thực thi task, huỷ và shutdown, thread pool, deadlock, hiệu năng và khả năng mở rộng. Tuần 7 bắt một deadlock thật bằng `jstack`; tuần 8 đo tranh chấp lock và đối chiếu với định luật Amdahl.", href: "#/roadmap/jcip", done: { kind: "track", id: "jcip", pct: 80 } },
      { id: "jc-4", title: "Tuần 9–10: chủ đề nâng cao — explicit lock, AQS, CAS, JMM", desc: "ReentrantLock và read-write lock, tự xây synchronizer trên AQS, thuật toán nonblocking, rồi Java Memory Model đóng lại toàn bộ khung lý thuyết. Tuần 10 viết một test jcstress chứng minh một race.", href: "#/roadmap/jcip", done: { kind: "track", id: "jcip", pct: 100 } },
```

Bước `jc-1` và `jc-5` giữ nguyên `done: { kind: "manual" }`.

- [ ] **Bước 7: Thêm số đếm lộ trình vào `check-data.mjs`**

Ngay dưới dòng `"docs:jcip": 14,`:

```js
    "roadmap-items:jcip": 40,
```

- [ ] **Bước 8: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**, không dòng `✗` nào.

Nếu đỏ:
- `#3`: một link `#/docs/<id>` trong lộ trình trỏ tới doc id không tồn tại — script tự kiểm ở Task 3–7 lẽ ra đã bắt, kiểm lại regex.
- `#3b`: link trỏ sang lĩnh vực khác con đường.
- `#7`: khai `roadmap` mà chưa có track — kiểm Bước 3 đã chạy chưa.
- `#7b`: có track mà chưa khai module — kiểm Bước 4.
- `G1`/`G3`: thiếu `trackGuides.jcip`, hoặc `fieldGuides.jcip.steps` trỏ track không tồn tại / trỏ module chưa khai — kiểm Bước 5 và Bước 6 đã chạy chưa.
- Số đếm lệch: đếm lại mục — phải đúng 40.

- [ ] **Bước 9: Xác nhận số liệu toàn hệ thống**

```bash
cd webapp && node --input-type=module -e '
const d = await import("./js/data/index.js");
const {FIELDS} = await import("./js/data/fields.js");
const items = d.allTracks.reduce((s,t)=>s+t.weeks.reduce((a,w)=>a+(w.items?.length||0),0),0);
console.log("lĩnh vực:", Object.keys(FIELDS).length, "(kỳ vọng 12)");
console.log("tài liệu:", d.allDocs.length, "(kỳ vọng 227)");
console.log("track:", d.allTracks.length, "(kỳ vọng 19)");
console.log("mục lộ trình:", items, "(kỳ vọng 898)");
' && cd ..
```

- [ ] **Bước 10: Commit**

```bash
git add webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -m "feat: bật lộ trình đọc Java Concurrency in Practice — 10 tuần / 40 mục

Đăng ký track jcip, mở module roadmap cho lĩnh vực, thêm trackGuides.
12 lĩnh vực, 227 tài liệu, 19 track, 898 mục lộ trình."
```

---

## Task 9: Liên kết chéo và cập nhật tài liệu

**Files:**
- Modify: `webapp/js/data/related.js`
- Modify: `README.md`
- Modify: `sources/README.md`

**Interfaces:**
- Consumes: doc id `jcip-02`…`jcip-16` từ Task 2; lĩnh vực và track đã bật từ Task 8.
- Produces: trạng thái cuối — không task nào sau nữa.

- [ ] **Bước 1: Thêm 12 khoá vào `related.js`**

Thêm vào cuối object `related`, sau khối `wgjd`. Khai **một chiều**; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Toàn bộ đích đều khác lĩnh vực (bất biến R1) và cùng con đường Java Backend.

```js
  // ---- Java Concurrency in Practice ↔ phần còn lại của con đường Java Backend ----
  "jcip-02": ["wgjd-05"],                                 // thread safety, atomicity ↔ nền tảng concurrency và JMM
  "jcip-03": ["wgjd-05", "java-04"],                      // visibility, safe publication ↔ JMM; bí ẩn RUNNABLE
  "jcip-05": ["wgjd-06", "mjia-15"],                      // building block ↔ thư viện concurrency JDK; CompletableFuture
  "jcip-06": ["java-06", "modconc-01"],                   // Executor ↔ TaskQueue Tomcat; hành trình concurrency của Java
  "jcip-07": ["modconc-04", "java-05"],                   // huỷ task ↔ structured concurrency giải lại bài này; virtual thread
  "jcip-08": ["java-07", "java-06"],                      // NGUỒN GỐC công thức sizing ↔ bài dùng lại công thức Goetz; TaskQueue
  "jcip-10": ["java-04", "java-10"],                      // deadlock ↔ đọc thread dump; bẫy deadlock REQUIRES_NEW
  "jcip-11": ["java-07", "wgjd-07", "mjia-07"],           // Amdahl, chi phí thread ↔ capacity planning; đo hiệu năng; parallel stream
  "jcip-13": ["java-04", "modconc-03"],                   // ReentrantLock ↔ ReentrantLock=WAITING; cơ chế concurrency hiện đại
  "jcip-14": ["modconc-04", "wgjd-16"],                   // AQS, synchronizer ↔ structured concurrency; concurrency nâng cao
  "jcip-15": ["wgjd-17", "modconc-03"],                   // CAS, nonblocking ↔ nội tại JVM; cơ chế hiện đại
  "jcip-16": ["wgjd-05", "java-03"],                      // JMM ↔ JMM ở WGJD; sync≠blocking
```

12 khoá, 24 liên kết. Không khai `jcip-A` (phụ lục annotation không có đối ứng ở lĩnh vực khác), và không nối sang Kubernetes hay con đường `data`.

- [ ] **Bước 2: Cập nhật `README.md` gốc — bốn chỗ**

1. **Bảng nguồn** (đoạn "📚 DevPrep — nền tảng học đa lĩnh vực"): thêm hàng

   ```markdown
   | [`sources/jcip/`](./sources/jcip/) | Bản dịch tiếng Việt *Java Concurrency in Practice* (Brian Goetz với Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea — Addison-Wesley 2006) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 13 chương (2–8, 10, 11, 13–16) + 1 phụ lục, 204 hình. Chương 1, 9 (GUI) và 12 (kiểm thử) không có trong bản dịch. Đọc trong app ở lĩnh vực Java Concurrency in Practice, kèm lộ trình đọc 10 tuần. |
   ```

2. **Đoạn liệt kê các bản dịch**: thêm `bản dịch **Java Concurrency in Practice**` vào chuỗi, và sửa `cả mười một lĩnh vực` thành `cả mười hai lĩnh vực`.

3. **Cây thư mục repo**: sửa dòng liệt kê các lĩnh vực trong `sources/` để có `jcip/`.

4. Kiểm không còn chỗ nào nói "mười một lĩnh vực":

   ```bash
   grep -n "mười một\|11 lĩnh vực" README.md sources/README.md
   ```

   Kỳ vọng: không dòng nào (trừ khi ngữ cảnh nói về số cũ có chủ ý).

- [ ] **Bước 3: Cập nhật `sources/README.md`**

Thêm hàng vào bảng "Bản đồ hiện tại", sau hàng `wgjd`:

```markdown
| `jcip` | `jcip/` | Bản dịch *Java Concurrency in Practice* (Goetz, Peierls, Bloch, Bowbeer, Holmes, Lea — Addison-Wesley 2006) — 13 chương (2–8, 10, 11, 13–16) + phụ lục A, 204 ảnh, PDF |
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **`49/49 bất biến đạt`**.

Nếu `R1` đỏ: một id đích không tồn tại, hoặc bạn vô tình khai một cặp cùng lĩnh vực. Bất biến này kiểm trùng lặp **trong cùng một mảng** — trùng giữa các khoá khác nhau (ví dụ `jcip-08` và `wgjd-06` cùng trỏ `java-07`) là hợp lệ.

- [ ] **Bước 5: Kiểm bằng mắt trong app**

Mở app (`webapp/scripts/dev.sh` hoặc mở `webapp/index.html`), chọn lĩnh vực **Java Concurrency in Practice**, rồi xác nhận năm điều:

1. Sidebar có **đúng 4 mục**: Bảng điều khiển, Hướng dẫn học, Lộ trình học, Tài liệu.
2. Thư viện hiện **14 tài liệu**, nhãn dạng `Ch. 2 · Thread Safety` và `Ch. A · Annotations for Concurrency`.
3. Mở `Ch. 7 · Cancellation and Shutdown` — **26 ảnh** hiện đúng (chương nhiều ảnh nhất).
4. Mở `Ch. A · Annotations for Concurrency` — **0 ảnh**, trang không được vỡ.
5. Thẻ Con đường trên bảng điều khiển hiện JCiP ở **chặng 4 trên 7** của Java Backend.

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/related.js README.md sources/README.md
git commit -m "feat: liên kết chéo JCiP và cập nhật tài liệu repo

12 khoá / 24 liên kết sang wgjd, java, modern-java, modern-concurrency.
Mắt xích chính: jcip-08 → java-07 nối công thức sizing về chương sinh ra nó.
Số liệu sau đợt: 12 lĩnh vực, 227 tài liệu, 19 track, 898 mục lộ trình."
```

---

## Kiểm chứng cuối

Sau Task 9, chạy một lần đầy đủ:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng cuối cùng:

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Bất biến | 49/49 | 49/49 |
| Lĩnh vực | 11 | **12** |
| Tài liệu | 213 | **227** |
| Track | 18 | **19** |
| Mục lộ trình | 858 | **898** |

Và `git status` sạch, thư mục `Java Concurrency in Practice/` không còn tồn tại ở gốc repo.
