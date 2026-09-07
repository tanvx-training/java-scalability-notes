# Tích hợp *Java Concurrency in Practice* vào DevPrep — thiết kế

Ngày: 2026-09-07
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `jcip`

Khuôn mẫu trực tiếp: [`2026-09-07-wgjd-integration-design.md`](2026-09-07-wgjd-integration-design.md)
và [`2026-09-03-modern-concurrency-integration-design.md`](2026-09-03-modern-concurrency-integration-design.md).

## 1. Bối cảnh

Repo nhận thêm thư mục `Java Concurrency in Practice/` ở gốc: 14 PDF chương và 14 tệp markdown
bản dịch tiếng Việt *Java Concurrency in Practice* (Brian Goetz với Tim Peierls, Joshua Bloch,
Joseph Bowbeer, David Holmes, Doug Lea — Addison-Wesley 2006), kèm 204 ảnh. Nội dung **đã dịch
xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

Số liệu đã đo, không ước lượng:

| Chỉ số | JCiP | MCJ (đối chiếu) | WGJD (đối chiếu) |
|---|---:|---:|---:|
| Số tệp | **14** (ch.2–8, 10, 11, 13–16 + phụ lục A) | 8 | 16 |
| Tổng số từ | **109.417** | 99.437 | 215.650 |
| Trung bình mỗi chương | 7.815 | 12.430 | 13.478 |
| Chương nặng nhất | ch.11 Performance — 11.524 | — | ch.11 — 18.810 |
| Chương nhẹ nhất | phụ lục A — 694 | — | ch.8 — 9.561 |
| Số ảnh | **204** | 19 | 93 |

Toàn vẹn ảnh đã kiểm: **204 tệp, 204 lượt tham chiếu, 0 gãy, 0 mồ côi.**

Số từ từng tệp (dùng để cân nhịp tuần ở §6):

| Ch. | Từ | Ch. | Từ | Ch. | Từ |
|---:|---:|---:|---:|---:|---:|
| 2 | 7.994 | 8 | 7.321 | 14 | 9.967 |
| 3 | 9.330 | 10 | 5.836 | 15 | 7.328 |
| 4 | 8.776 | 11 | 11.524 | 16 | 5.961 |
| 5 | 11.228 | 13 | 4.926 | A | 694 |
| 6 | 8.058 | | | | |
| 7 | 10.474 | | | | |

Nền trước khi bắt đầu (đã chạy `check-data.mjs`): **49/49 bất biến đạt, 11 lĩnh vực, 213 tài
liệu, 18 track, 858 mục lộ trình.** Sau đợt này: **12 lĩnh vực, 227 tài liệu, 19 track, 898 mục.**

### 1.1 Chương 1, 9 và 12 vắng mặt — lỗ hổng HỆ QUẢ NHẸ

Bản dịch không có ch.1 (Introduction), ch.9 (GUI Applications) và ch.12 (Testing Concurrent
Programs), và **cũng không có PDF gốc của ba chương đó**. Đây là giới hạn cứng của nguồn, không
phải quyết định hoãn lại.

Khác với WGJD — nơi ch.9/10 vắng kéo theo hàng chục tham chiếu ngược ở ch.14–16 — lỗ hổng ở đây
đã được đo và **nhẹ**. Đếm toàn bộ tham chiếu ngược trong 14 tệp:

| Chương vắng | Số lần nhắc | Bản chất tham chiếu |
|---|---:|---|
| ch.1 Introduction | 2 | Câu dẫn nhập ở ch.2 (*"Ở chương 1, chúng ta đã liệt kê một số framework…"*) — nhắc lại bối cảnh, không mang kiến thức cần để hiểu ch.2. |
| ch.9 GUI Applications | 3 | Đều về subsystem single-threaded / GUI framework (ch.3 footnote, ch.6 footnote, ch.10 §10.3 về khả năng đáp ứng). Chủ đề tự đóng, không chương nào xây trên nó. |
| ch.12 Testing | 1 | Ch.5 §5.5 nhắc class bounded buffer *"được dùng ở chương 12"* — một ví dụ, không phải tiền đề. |

Tổng 6 tham chiếu, **không chương nào phụ thuộc** vào ba chương vắng để đọc hiểu được.

**Quyết định:** không suy đoán nội dung ba chương đó vào bất kỳ đâu. Ghi lỗ hổng ở **hai chỗ** —
`desc` của lĩnh vực và `prereq` của track — và bù riêng ch.12 bằng **một tài nguyên ngoài ở W10**
(§6.2), vì kiểm thử chương trình concurrent là kỹ năng thực dụng mà lộ trình không nên bỏ trống.
Không bù ch.9: mô hình single-thread của Swing/JavaFX nằm ngoài con đường Java Backend.

### 1.2 Nguồn không có README

Giống WGJD, nguồn này không kèm `README.md`. Quy ước `sources/README.md` bắt buộc *"Mỗi nguồn
dịch từ sách có README.md ghi tác giả, ấn bản, giấy phép/bản quyền"* — nên phải **viết mới**
`sources/jcip/README.md` (§3.2).

### 1.3 Sách có chia Phần, nhưng repo không đủ bằng chứng để điền

Khác WGJD (không có dấu vết Phần nào), ở đây có **đúng một** dấu vết: ch.5 kết thúc bằng mục
`## Tóm tắt Phần I`. Nó chứng minh Phần I kết thúc ở ch.5 — nhưng **không cho biết tên Phần I**,
và không cho biết ranh giới hay tên của các Phần sau. Không có PDF mục lục, không có README nguồn.

Quy ước `sources/README.md` nói `part` lấy từ README nguồn, **không bịa**. Nên `part: null` cho
cả 14 tài liệu. Ghi lại ở đây để lần sau không ai thấy dòng "Tóm tắt Phần I" rồi đi điền tên bốn
Phần theo trí nhớ về bản in tiếng Anh.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `jcip`, không gộp vào `modern-concurrency` | 109.417 từ / 14 tệp lớn hơn cả lĩnh vực `modern-concurrency` (99.437 từ / 8 tệp). Tiền lệ nhiều nguồn duy nhất là `kubernetes`, nơi cả 4 nguồn cùng phục vụ luyện thi chứng chỉ — không đúng ở đây. Gộp cũng sẽ phá đánh số `modconc-NN`. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap"]` | Đồng khuôn 7 lĩnh vực sách hiện có. Không làm flashcards/quiz đợt này. |
| 3 | Doc id `jcip-02`…`jcip-16` + `jcip-A`; **bỏ trống `jcip-01`, `jcip-09`, `jcip-12`** | Số id khớp số chương sách. Tiền lệ `wgjd-09`/`wgjd-10` và `kafka-01`. Đánh lại 01–14 sẽ khiến `jcip-09` trỏ vào chương 11 — nhầm lẫn vĩnh viễn vì id là khoá localStorage. |
| 4 | `chapter: "A"` cho phụ lục | Bất biến D1 chấp nhận `/^[A-Z]$/`; đã dùng thật ở `kubernetes` (2 phụ lục) và `spring-security` (1). |
| 5 | `part: null` cho cả 14 tài liệu | §1.3. |
| 6 | Slug tệp **tiếng Anh** | Bản dịch giữ nguyên tên chương tiếng Anh ("Chương 2. Thread Safety"), nên slug tiếng Anh bám sát nguồn. Tiền lệ `wgjd`. (Kafka/DDIA dùng slug tiếng Việt vì tiêu đề chương của chúng đã dịch.) |
| 7 | Vị trí trên con đường Java Backend: **sau `wgjd`, trước `java`** | WGJD ch.5–6 dạy JMM và thư viện concurrency ở mức lướt; JCiP đào sâu đúng chỗ đó. Rồi `java` bài 03–08 mới dùng được — riêng `java-07` dùng thẳng công thức Goetz `core×U×(1+W/C)` vốn đến từ ch.8 cuốn này. Nông → sâu → ứng dụng. |
| 8 | Lộ trình **10 tuần / 40 mục**, tuyến tính theo thứ tự sách, cân theo số từ | 10,9k từ/tuần — khớp nhịp `modern-concurrency` (11,0k), sách cùng chủ đề cùng độ khó. Mật độ khái niệm JCiP cao hơn hẳn văn kể chuyện, nên nhịp phải thấp hơn trung bình repo, không cao hơn. |
| 9 | Ghi lỗ hổng ở hai chỗ + một tài nguyên ngoài bù ch.12 | §1.1. Lỗ hổng đã đo là nhẹ, không cần ba chỗ như WGJD. |
| 10 | Ảnh giữ nguyên bố cục `images/chNN/` | Giống DDIA và WGJD. Sắp xếp lại sẽ gãy toàn bộ 204 tham chiếu tương đối. |
| 11 | Chia 6 chặng, mỗi chặng `check-data.mjs` xanh | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu (#7), và có dữ liệu thì phải khai module (#7b). |

## 3. Nguồn: chuẩn hoá `sources/jcip/`

`git mv` thư mục `Java Concurrency in Practice/` thành `sources/jcip/`, đổi tên 14 tệp markdown
theo quy ước `NN-slug.md` (phụ lục dùng chữ), rồi chuyển 14 PDF vào `sources/jcip/pdf/` theo cùng
slug. `images/` đi cùng. Giữ nguyên nội dung — **không sửa một ký tự nào**: đường dẫn ảnh là
tương đối theo tệp chứa, và `images/` di chuyển cùng các tệp `.md`.

Tiêu đề dưới đây trích **nguyên văn từ dòng H1 của từng tệp dịch**, không dịch lại. `title` trong
`docs.js` bỏ tiền tố "Chương N. " / "Phụ lục A. " vì nhãn "Ch. N · …" do `labels.js` sinh (bất
biến D1).

| # | `.md` mới | H1 trong bản dịch | `title` trong `docs.js` |
|---:|---|---|---|
| 02 | `02-thread-safety.md` | Chương 2. Thread Safety | Thread Safety |
| 03 | `03-sharing-objects.md` | Chương 3. Sharing Objects | Sharing Objects |
| 04 | `04-composing-objects.md` | Chương 4. Composing Objects | Composing Objects |
| 05 | `05-building-blocks.md` | Chương 5. Building Blocks | Building Blocks |
| 06 | `06-task-execution.md` | Chương 6. Task Execution | Task Execution |
| 07 | `07-cancellation-and-shutdown.md` | Chương 7. Cancellation and Shutdown | Cancellation and Shutdown |
| 08 | `08-applying-thread-pools.md` | Chương 8. Applying Thread Pools | Applying Thread Pools |
| 10 | `10-avoiding-liveness-hazards.md` | Chương 10. Avoiding Liveness Hazards | Avoiding Liveness Hazards |
| 11 | `11-performance-and-scalability.md` | Chương 11. Performance and Scalability | Performance and Scalability |
| 13 | `13-explicit-locks.md` | Chương 13. Explicit Locks | Explicit Locks |
| 14 | `14-building-custom-synchronizers.md` | Chương 14. Building Custom Synchronizers | Building Custom Synchronizers |
| 15 | `15-atomic-variables-and-nonblocking-synchronization.md` | Chương 15. Atomic Variables and Nonblocking Synchronization | Atomic Variables and Nonblocking Synchronization |
| 16 | `16-the-java-memory-model.md` | Chương 16. The Java Memory Model | The Java Memory Model |
| A | `A-annotations-for-concurrency.md` | Phụ lục A. Annotations for Concurrency | Annotations for Concurrency |

PDF đổi tên theo cùng slug: `2 Thread Safety _ Java Concurrency in Practice.pdf` →
`pdf/02-thread-safety.pdf`, và tương tự cho 13 tệp còn lại. Lưu ý PDF chương một chữ số không có
số 0 đứng đầu ở tên gốc (`2 …`, `3 …`), còn slug đích **có** (`02-…`) — khớp quy ước `NN-slug`.

Sau khi `git mv` xong, thư mục `Java Concurrency in Practice/` biến mất hoàn toàn.

Trước khi đổi tên, xác nhận không nơi nào tham chiếu đường dẫn cũ:

```bash
grep -rn "Java Concurrency in Practice/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Java Concurrency in Practice" .
```

**Đã chạy ở bước thiết kế: không dòng nào.** Dùng dấu `/` cuối mẫu để chỉ bắt tham chiếu **đường
dẫn**, không bắt tên sách trong văn xuôi. Dùng `--exclude-dir`, không dùng `grep -v "^./…"` —
trên máy này `grep -r .` không thêm tiền tố `./`, nên bộ lọc dạng `^./` không ăn và cho cảm giác
an toàn giả.

### 3.1 Ảnh — bố cục theo chương, giống DDIA và WGJD

204 ảnh nằm trong `images/chNN/`. Phân bố đã đếm:

| ch.2 | ch.3 | ch.4 | ch.5 | ch.6 | ch.7 | ch.8 | ch.10 | ch.11 | ch.13 | ch.14 | ch.15 | ch.16 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 18 | 18 | 24 | 17 | 26 | 20 | 8 | 12 | 10 | 17 | 13 | 10 |

Phụ lục A không có ảnh. Tổng 204, khớp đúng 204 lượt tham chiếu trong markdown.

Ghi chú cho người kiểm lại: một `grep` tham lam dạng `images/[^)]*` sẽ báo 13 "ảnh gãy" giả —
đó là các lần văn bản nhắc đường dẫn `images/chNN/` trong dấu backtick, không phải cú pháp ảnh.
Dùng mẫu khớp đúng cú pháp markdown `!\[[^]]*\]\(images/[^)]+\)` mới ra con số thật.

### 3.2 `sources/jcip/README.md` — viết mới

Nội dung bắt buộc, theo khuôn README của các nguồn khác:

- Tên sách, tác giả Brian Goetz với Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes,
  Doug Lea — Addison-Wesley, 2006.
- Ghi rõ **sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0**.
- 13 chương + 1 phụ lục: liệt kê ch.2–8, 10, 11, 13–16 và phụ lục A.
- **Ghi rõ ch.1, ch.9 (GUI Applications) và ch.12 (Testing Concurrent Programs) không thuộc phạm
  vi bản dịch và không có PDF gốc**, kèm ghi chú rằng lỗ hổng này đã được đo là nhẹ (§1.1) —
  không chương nào còn lại phụ thuộc vào chúng.
- 204 ảnh trong `images/chNN/`, PDF gốc trong `pdf/` và không vào bản deploy.

## 4. Khai lĩnh vực

### 4.1 `webapp/js/data/fields.js`

| Trường | Giá trị |
|---|---|
| `label` | `Java Concurrency in Practice` |
| `icon` | `🔐` |
| `short` | `JCiP` |
| `unit` | `Ch.` |
| `certFilter` | `false` |
| `modules` | `["dashboard", "guide", "docs", "roadmap"]` |
| `externalRef` | `{ label: "jcip.net — errata & annotations", href: "https://jcip.net/" }` |

`desc` (viết liền một dòng khi vào code): *Bản dịch tiếng Việt Java Concurrency in Practice
(Brian Goetz với Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea —
Addison-Wesley) — chương 2–8, 10, 11, 13–16 và phụ lục A: thread safety, visibility và safe
publication, thiết kế class thread-safe, building block của java.util.concurrent, thực thi và
huỷ task, thread pool, deadlock, hiệu năng và khả năng mở rộng, explicit lock, AQS, biến atomic
và Java Memory Model. Chương 1, 9 (GUI) và 12 (kiểm thử) không nằm trong bản dịch.*

`externalRef` chọn `jcip.net` vì đó là trang chính thức của sách, nơi có errata và bộ annotation
của phụ lục A. Không dùng `docs.oracle.com — JVM Specification` (đã thuộc `wgjd`) hay
`openjdk.org — Project Loom` (đã thuộc `modern-concurrency`).

`FIELD_ORDER` chèn `"jcip"` ngay sau `"wgjd"`.

### 4.2 `webapp/js/data/paths.js`

```js
PATHS.java.fields = ["spring-start", "modern-java", "wgjd", "jcip", "java",
                     "modern-concurrency", "spring-security"];
```

`PATHS.java.desc` hiện viết *"Một nghề, sáu chặng…"* — phải sửa thành **bảy chặng** và nêu chặng
mới (nền concurrency cổ điển, giữa "xuống dưới nắp JVM" và "khả năng mở rộng trên Tomcat"). Bất
biến P1 kiểm mọi lĩnh vực xuất hiện đúng một lần trong `PATHS ∪ SPINE`; quên thêm `jcip` là đỏ ngay.

### 4.3 `webapp/js/data/guides.js`

`fieldGuides.jcip` — tagline, audience, `hoursPerWeek: "6–8 giờ/tuần · 10 tuần"`, prereqs (viết
được Java đa luồng ở mức cơ bản, JDK 17+ để chạy ví dụ, đọc được stack trace và thread dump), 5
`steps`, `method`, `pitfalls`, `doneWhen`.

Một `pitfall` bắt buộc nói về khoảng cách thời đại: sách xuất bản 2006, nên các API nó dạy vẫn
đúng nguyên (`java.util.concurrent` không đổi ngữ nghĩa) nhưng **bối cảnh đã đổi** — virtual
thread làm nhiều lời khuyên về sizing pool ở ch.8 không còn là ràng buộc như trước. Chỉ người
đọc sang `modern-concurrency` ở chặng sau để thấy cái gì đổi, đừng tự suy diễn.

`trackGuides.jcip` — `rhythm` / `before` / `during` / `after`.

Bất biến G1 bắt buộc: khai module `guide` mà thiếu `fieldGuides` là đỏ; mọi track phải có
`trackGuides`.

## 5. Thư viện tài liệu — `webapp/js/data/jcip/docs.js`

14 bản ghi theo thứ tự đọc. Mỗi bản ghi: `id`, `field: "jcip"`, `chapter` (số chương thật, `"A"`
cho phụ lục), `part: null`, `title` (chỉ tên chương — xem bảng §3), `file:
"content/jcip/NN-slug.md"`, `icon`, `desc` (một câu nói chương này trả lời câu hỏi gì), `tags`
(3 từ khoá).

`desc` bám mục lục thật của bản dịch, không suy từ trí nhớ về bản in tiếng Anh. Mục lục cấp hai
đã trích để viết `desc`:

| Ch. | Các mục cấp hai |
|---:|---|
| 2 | Thread Safety là gì · Atomicity · Locking · Bảo vệ State bằng Lock · Liveness và Performance |
| 3 | Visibility · Publication và Escape · Thread Confinement · Immutability · Safe Publication |
| 4 | Thiết kế class thread-safe · Instance Confinement · Uỷ quyền Thread Safety · Thêm chức năng vào class có sẵn · Ghi tài liệu Synchronization Policy |
| 5 | Synchronized Collections · Concurrent Collections · BlockingQueue và Producer-Consumer · Method Blocking và Interruptible · Synchronizers · Result Cache hiệu quả |
| 6 | Thực thi Task trong Thread · Framework Executor · Tìm Parallelism khai thác được |
| 7 | Huỷ Task · Dừng Service dựa trên Thread · Xử lý Thread kết thúc bất thường · JVM Shutdown |
| 8 | Gắn kết ngầm Task↔Execution Policy · Xác định kích thước Thread Pool · Cấu hình ThreadPoolExecutor · Mở rộng ThreadPoolExecutor · Song song hoá thuật toán đệ quy |
| 10 | Deadlock · Tránh và chẩn đoán Deadlock · Các nguy cơ Liveness khác |
| 11 | Suy nghĩ về Performance · Định luật Amdahl · Chi phí do Thread gây ra · Giảm tranh chấp Lock · So sánh Performance của Map · Giảm Overhead Context Switch |
| 13 | Lock và ReentrantLock · Cân nhắc Performance · Fairness · Chọn giữa synchronized và ReentrantLock · Read-write Lock |
| 14 | Quản lý State Dependence · Condition Queue · Object Condition tường minh · Giải phẫu một Synchronizer · AbstractQueuedSynchronizer · AQS trong java.util.concurrent |
| 15 | Nhược điểm của Locking · Hỗ trợ phần cứng cho Concurrency · Class Atomic Variable · Thuật toán Nonblocking |
| 16 | Memory Model là gì và tại sao cần · Publication · Initialization Safety |
| A | Class Annotation · Field và Method Annotation |

`docs-index.js`: thêm `import { docs as jcip } from "./jcip/docs.js";` và `...jcip,` trong mảng.

## 6. Lộ trình đọc — track `jcip`

Track id `jcip`, week id `jc-w1`…`jc-w10`, item id `jc-w<N>-<M>`. Tiền tố `jc-` chưa ai dùng (đã
có `w`, `cka-`, `cks-`, `sp-`, `kb-`, `cb-`, `ku-`, `ss-`, `mc-`, `dd-`, `mj-`, `kf-`, `sh-`,
`sj-`, `wg-` — đã kiểm bằng grep). **Id là khoá lưu tiến độ trong localStorage — không được đổi
về sau.**

4 mục mỗi tuần, tách hai tệp: `jcip/roadmap-part1.js` (W1–5, 20 mục) và `jcip/roadmap-part2.js`
(W6–10, 20 mục).

| Tuần | Chương | Từ | Trọng tâm |
|---|---|---:|---|
| W1 | 2 + A | 8.688 | Thread safety là gì, atomicity, locking, bảo vệ state bằng lock, liveness/performance; bộ annotation `@GuardedBy`/`@Immutable`/`@ThreadSafe`/`@NotThreadSafe` dùng xuyên sách từ ch.2 |
| W2 | 3 | 9.330 | Visibility, publication & escape, thread confinement, immutability, safe publication |
| W3 | 4 | 8.776 | Thiết kế class thread-safe, instance confinement, uỷ quyền thread safety, ghi tài liệu synchronization policy |
| W4 | 5 | 11.228 | Synchronized vs concurrent collection, BlockingQueue & producer-consumer, synchronizer, result cache có khả năng mở rộng |
| W5 | 6 | 8.058 | Thực thi task trong thread, framework Executor, tìm parallelism khai thác được |
| W6 | 7 | 10.474 | Huỷ task, dừng service dựa trên thread, thread chết bất thường, JVM shutdown |
| W7 | 8 + 10 | 13.157 | Gắn kết ngầm task↔execution policy, sizing pool, cấu hình/mở rộng ThreadPoolExecutor; deadlock và các nguy cơ liveness |
| W8 | 11 | 11.524 | Amdahl, chi phí do thread, giảm tranh chấp lock, so sánh Map, overhead context switch |
| W9 | 13 + 14 | 14.893 | ReentrantLock, fairness, read-write lock; condition queue, giải phẫu synchronizer, AQS |
| W10 | 15 + 16 | 13.289 | CAS, atomic variable, thuật toán nonblocking; JMM, publication, initialization safety |

Tổng cột "Từ" bằng đúng 109.417 — không tuần nào được làm tròn cho vừa. Trung bình 10,9k
từ/tuần; biên độ 8.688–14.893.

### 6.1 Ba chỗ ghép đôi chương — lý do nội dung, không phải để cho vừa số

- **W7 (ch.8 + ch.10):** §8.1 "gắn kết ngầm giữa task và execution policy" dẫn thẳng tới deadlock
  do thread starvation — chính là §10.1. Đọc rời hai chương này làm mất mạch nhân-quả.
- **W9 (ch.13 + ch.14):** §14.5–14.6 xây AQS trên chính interface `Lock` mà §13.1 vừa giới thiệu.
  Ch.14 gần như không đọc được nếu ch.13 đã nguội.
- **W10 (ch.15 + ch.16):** CAS (§15.2–15.3) và JMM (§16.1) là cặp "vì sao thuật toán nonblocking
  đúng" — ch.16 cung cấp nền lý thuyết cho điều ch.15 vừa làm.

W1 ghép phụ lục A (694 từ) vì bộ annotation `@GuardedBy`/`@ThreadSafe` được dùng trong listing
code **từ ch.2 trở đi**; đọc muộn hơn thì người học đã gặp chúng hàng chục lần mà không biết
nghĩa.

### 6.2 Bù chương 12 ở W10

`resources` của W10 thêm một mục ngoài: **jcstress** (`https://openjdk.org/projects/code-tools/jcstress/`)
— bộ công cụ OpenJDK để viết test bào mòn (stress test) cho mã concurrent, thay thế hiện đại cho
các kỹ thuật thủ công ch.12 mô tả.

Đặt ở W10 chứ không sớm hơn vì jcstress kiểm chính các bảo đảm mà ch.15–16 vừa dạy (CAS, JMM,
safe publication) — người học cần biết *cái gì* đúng trước khi kiểm *rằng nó* đúng.

Mục tiêu không phải "học jcstress" mà là **không kết thúc lộ trình mà chưa từng chứng minh một
race bằng công cụ**.

### 6.3 Ghi lỗ hổng ch.1/9/12 ở đúng hai chỗ

1. `FIELDS.jcip.desc` (§4.1) — người dùng thấy ngay ở bộ chọn lĩnh vực.
2. `tracks[jcip].prereq` — trước khi bắt đầu lộ trình.

Không ghi vào từng mục lộ trình như WGJD đã làm: ở đó lỗ hổng cắn thật trong bài học, ở đây thì
không (§1.1). Thêm cảnh báo vào chỗ nó không cắn là nhiễu.

### 6.4 Khuôn một mục

Giữ đúng khuôn 4 khối của repo: **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**. Mỗi mục là **kế hoạch đọc
trỏ vào sách**, không chép lại nội dung sách; link dạng `#/docs/jcip-NN` gắn vào tên mục thật
trong chương (xem bảng mục lục §5). `practice` ở mức tuần, làm trên máy thật:

| Tuần | `practice` |
|---|---|
| W1 | Lấy servlet đếm số ở ch.2, viết test đa luồng làm nó sai, sửa bằng `synchronized`, đo lại throughput để thấy giá của lock |
| W2 | Tái hiện lỗi visibility (biến không `volatile` khiến vòng lặp không bao giờ dừng); chứng minh, rồi sửa hai cách và giải thích khác biệt |
| W4 | Xây result cache §5.6 từ `HashMap`+`synchronized` lên `ConcurrentHashMap`+`FutureTask`, đo tỉ lệ tính trùng ở mỗi bước |
| W6 | Viết một service huỷ được bằng interrupt đúng cách; chứng minh nuốt `InterruptedException` làm hỏng huỷ như thế nào |
| W7 | Tái hiện deadlock do khoá ngược thứ tự, bắt bằng `jstack`, sửa bằng lock ordering |
| W8 | Đo `ConcurrentHashMap` vs `synchronizedMap` theo số thread tăng dần; đối chiếu kết quả với định luật Amdahl |
| W10 | Viết một test **jcstress** chứng minh một race thật, rồi chứng minh bản đã sửa qua được (§6.2) |

W3, W5, W9 không có `practice` riêng — ba tuần đó nặng về đọc thiết kế (composing objects, executor
framework, AQS) và bài tập gõ tay của tuần liền trước vẫn còn dang dở. Đây là lựa chọn có chủ ý,
không phải bỏ sót.

### 6.5 Đăng ký track — `webapp/js/data/roadmap.js`

| Trường | Giá trị |
|---|---|
| `id` | `jcip` |
| `field` | `jcip` |
| `label` | `Java Concurrency` |
| `icon` | `🔐` |
| `name` | `Đọc Java Concurrency in Practice` |
| `durationWeeks` | `10` |
| `weeks` | `[...jcipWeeksPart1, ...jcipWeeksPart2]` |

`desc`: *Kế hoạch đọc 10 tuần bám theo bản dịch 13 chương và phụ lục A: mỗi mục nêu mục tiêu, chỉ
đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; bảy tuần có bài thực hành gõ tay — làm hỏng
một servlet rồi sửa, tái hiện lỗi visibility, dựng result cache có khả năng mở rộng, bắt deadlock
bằng `jstack`, đo tranh chấp lock đối chiếu Amdahl, và chứng minh một race bằng jcstress.*

`prereq`: *Yêu cầu: viết được Java đa luồng ở mức cơ bản và đọc được stack trace — đây không phải
sách nhập môn, và nó dạy nền tảng chứ không dạy API mới nhất. Bản dịch không có chương 1
(giới thiệu), chương 9 (ứng dụng GUI) và chương 12 (kiểm thử chương trình concurrent); phần kiểm
thử được bù bằng jcstress ở tuần 10. Sách xuất bản 2006: `java.util.concurrent` vẫn đúng nguyên,
nhưng bối cảnh sizing thread pool đã đổi sau virtual thread — chặng Modern Concurrency ở sau sẽ
nói cái gì đổi.*

Thêm hai dòng `import`, cập nhật khối chú thích đầu tệp (danh sách track và danh sách tiền tố id)
— khối đó là tài liệu sống, để cũ là sai lệch.

## 7. Liên kết chéo — `webapp/js/data/related.js`

Khai một chiều từ `jcip`; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Toàn bộ
khác lĩnh vực (bất biến R1) và cùng con đường Java Backend.

| Từ | Tới | Lý do đọc-liền-mạch |
|---|---|---|
| `jcip-02` | `wgjd-05` | thread safety, atomicity ↔ nền tảng concurrency và JMM nhìn từ WGJD |
| `jcip-03` | `wgjd-05`, `java-04` | visibility, safe publication ↔ JMM; ↔ bí ẩn RUNNABLE |
| `jcip-05` | `wgjd-06`, `mjia-15` | building block ↔ thư viện concurrency JDK; ↔ CompletableFuture |
| `jcip-06` | `java-06`, `modconc-01` | Executor ↔ Tomcat TaskQueue; ↔ hành trình concurrency của Java |
| `jcip-07` | `modconc-04`, `java-05` | huỷ task ↔ cách structured concurrency giải lại bài này; ↔ virtual thread |
| `jcip-08` | `java-07`, `java-06` | **nguồn gốc công thức sizing** ↔ bài dùng lại công thức Goetz; ↔ TaskQueue |
| `jcip-10` | `java-04`, `java-10` | deadlock ↔ đọc thread dump; ↔ bẫy deadlock `REQUIRES_NEW` |
| `jcip-11` | `java-07`, `wgjd-07`, `mjia-07` | Amdahl, chi phí thread ↔ capacity planning; ↔ đo hiệu năng; ↔ parallel stream |
| `jcip-13` | `java-04`, `modconc-03` | ReentrantLock ↔ ReentrantLock=WAITING; ↔ cơ chế concurrency hiện đại |
| `jcip-14` | `modconc-04`, `wgjd-16` | AQS, synchronizer ↔ structured concurrency; ↔ concurrency nâng cao |
| `jcip-15` | `wgjd-17`, `modconc-03` | CAS, nonblocking ↔ nội tại JVM; ↔ cơ chế hiện đại |
| `jcip-16` | `wgjd-05`, `java-03` | JMM ↔ JMM ở WGJD; ↔ sync≠blocking |

12 khoá, 24 liên kết. Mắt xích đáng giá nhất là `jcip-08` → `java-07`: nó nối công thức
`core×U×(1+W/C)` về đúng chương sinh ra nó.

Không nối `jcip-A` (phụ lục annotation không có đối ứng ở lĩnh vực khác) và không nối sang
Kubernetes hay `data` — khác con đường, bất biến #3b chặn link `#/docs/` xuyên con đường trong
lộ trình.

## 8. Chia chặng

Mỗi chặng tự chạy được: `check-data.mjs` phải xanh ở cuối từng chặng.

| # | Chặng | Đụng gì |
|---|---|---|
| 1 | Chuẩn hoá nguồn | `git mv` → `sources/jcip/` (14 md + 204 ảnh + 14 pdf), viết `sources/jcip/README.md`. Không đụng app. |
| 2 | Lĩnh vực + thư viện | `fields.js` (modules `dashboard`/`guide`/`docs` — **chưa** `roadmap`), `FIELD_ORDER`, `paths.js`, `jcip/docs.js` 14 bản ghi, `docs-index.js`, `fieldGuides.jcip`, `EXPECTED["docs:jcip"] = 14` |
| 3 | Lộ trình W1–5 | `jcip/roadmap-part1.js`, 20 mục. Tệp chưa được import — app không đổi. |
| 4 | Lộ trình W6–10 | `jcip/roadmap-part2.js`, 20 mục. |
| 5 | Bật track | `roadmap.js` (import + `tracks[]` + chú thích đầu tệp), `fields.js` thêm `"roadmap"`, `trackGuides.jcip`, steps của `fieldGuides` trỏ track, `EXPECTED["roadmap-items:jcip"] = 40` |
| 6 | Nối và ghi | `related.js`, `README.md` gốc, `sources/README.md`, cập nhật mọi số liệu |

Thứ tự chặng 2 → 5 là bắt buộc: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, và
#7b chặn có dữ liệu mà không khai module — nên track và việc bật module phải nằm cùng một chặng.

Chặng 3 và 4 là phần nặng nhất: 40 bài học viết tay, mỗi bài phải đọc chương gốc để trỏ đúng tên
mục và trích đúng cái bẫy sách nói. Không sinh máy móc từ mục lục.

## 9. Kiểm chứng

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

`build-content.sh` **không cần sửa** — nó sao chép cả cây `sources/` trừ `*.pdf`.

Số đếm kỳ vọng thêm vào `EXPECTED.counts`: `"docs:jcip": 14`, `"roadmap-items:jcip": 40`.

Bất biến sẽ cắn nếu làm sai:

| Bất biến | Cắn khi |
|---|---|
| #2 / #2b | `docs[].file` hoặc một trong 204 ảnh không tồn tại trên đĩa sau `build-content.sh` |
| #2c | `file` không có dạng `content/jcip/…` |
| #3b | Link `#/docs/<id>` trong lộ trình trỏ sang lĩnh vực khác con đường |
| #7 / #7b | Khai `roadmap` khi chưa có dữ liệu, hoặc có dữ liệu mà chưa khai |
| G1–G4 | Thiếu `fieldGuides.jcip` hoặc `trackGuides.jcip`; `steps[].href`/`done` sai hình dạng |
| P1 | `jcip` không có mặt đúng một lần trong `PATHS ∪ SPINE` |
| D1 | `chapter`/`part` thiếu hoặc sai kiểu; `chapter: "A"` phải là chuỗi một chữ hoa; `title` còn tiền tố "Chương N. " |
| R1 | `related.js` trỏ id không tồn tại, tự trỏ, lặp, hoặc cùng lĩnh vực |
| N3 | `EXPECTED.counts` thiếu khoá cho lĩnh vực mới |

Ngoài kiểm tự động, kiểm bằng mắt sau chặng 6: mở app, chọn lĩnh vực JCiP, xác nhận sidebar có
đúng 4 mục, thư viện hiện 14 tài liệu với nhãn "Ch. N · …" và "Ch. A · …", ảnh hiện đúng ở ch.7
(26 ảnh, nhiều nhất) và phụ lục A (0 ảnh, không được vỡ), và thẻ Con đường trên dashboard hiện
JCiP ở chặng 4 trên 7 của Java Backend.

## 10. Cập nhật tài liệu (chặng 6)

- `README.md` gốc: thêm dòng `sources/jcip/` vào bảng nguồn, thêm JCiP vào đoạn liệt kê các bản
  dịch, cập nhật cây thư mục repo, và sửa "cả mười một lĩnh vực" thành mười hai.
- `sources/README.md`: thêm hàng `jcip` vào "Bản đồ hiện tại".
- Số liệu sau đợt này: **12 lĩnh vực, 227 tài liệu, 19 track, 898 mục lộ trình.**

## 11. Ngoài phạm vi

| Việc | Vì sao không làm đợt này |
|---|---|
| Flashcards và trắc nghiệm cho `jcip` | Bảy lĩnh vực sách hiện có đều chưa có; làm riêng cho JCiP sẽ lệch khuôn. |
| Dịch bổ sung ch.1, ch.9 (GUI) và ch.12 (kiểm thử) | **Không có PDF gốc trong repo.** Giới hạn cứng của nguồn, không phải quyết định hoãn. Nếu về sau có nguồn, id `jcip-01`/`jcip-09`/`jcip-12` đã được chừa sẵn. |
| Điền `part` cho 14 tài liệu | Chỉ có một dấu vết "Tóm tắt Phần I" ở cuối ch.5 — không đủ để biết tên Phần hay ranh giới các Phần sau (§1.3). |
| Gộp hoặc đánh số lại `modern-concurrency` | JCiP đứng riêng (quyết định #1); không đụng dữ liệu lĩnh vực khác ngoài `related.js` và `PATHS.java.desc`. |
| Nối `jcip` vào `bookCrossref` | Bảng đó phục vụ tuần giáo trình chứng chỉ Kubernetes; JCiP không thuộc con đường đó. |
