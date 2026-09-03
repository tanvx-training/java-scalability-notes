# Tích hợp *Modern Concurrency in Java* vào DevPrep — thiết kế

- Ngày: 2026-09-03
- Branch: `claude/project-data-feature-062bdf`
- Trạng thái: đã duyệt thiết kế, chờ lập kế hoạch triển khai

## 1. Bối cảnh

Thư mục `Modern Concurrency in Java/` đã được commit vào kho nhưng webapp **chưa
tham chiếu một dòng nào** — `grep -ri "modern concurrency"` không ra kết quả nào
trong `build-content.sh`, `docs-index.js`, `check-data.mjs`, `fields.js`.

| Hạng mục | Số liệu |
|---|---|
| Markdown | 8 chương, tổng 725.406 byte (~708 KiB) |
| PDF gốc | 8 tệp, ~31 MB — đã theo dõi trong git, không dùng cho app |
| Ảnh | 19 tệp, 1,6 MB, trong `images/ch{1,2,3,4,6}/` |
| Nguồn | Bản dịch tiếng Việt *Modern Concurrency in Java* (O'Reilly, ISBN 9781098165406) |

Kích thước chương rất lệch: ch4 209.649 B, ch2 141.712 B, ch6 114.254 B, còn ch8
chỉ 7.411 B.

Mục tiêu: đưa nội dung này vào DevPrep ở mức **tài liệu + lộ trình đọc sách**, theo
đúng khuôn đã dùng cho `spring-security-vi` (đợt 2026-08-26). Sau khi xong: **6 lĩnh
vực** (thêm `modern-concurrency`), **11 giáo trình**, **86 tài liệu** (78 → 86),
**572 mục lộ trình** (540 → 572).

## 2. Quyết định đã chốt

Sáu quyết định do người dùng chốt trong phiên brainstorming (D1–D6), cộng các quyết định
kỹ thuật đi kèm:

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Lĩnh vực **thứ 6 riêng** (`modern-concurrency`), không nhập vào `java` hay `senior-java` | Một cuốn sách = một lĩnh vực, đúng tiền lệ `spring-security`; nhãn và mô tả của lĩnh vực `java` ("series 10 bài về khả năng mở rộng") giữ nguyên, không phải nới rộng |
| D2 | Mở **`dashboard + docs + roadmap`**, không làm flashcards/trắc nghiệm | Đúng phạm vi `springsec`. Flashcards/quiz đòi soạn nội dung mới và phải thêm DOMAINS/TOPICS trong `meta.js` — là một việc riêng |
| D3 | **Chuẩn hoá toàn bộ tên nguồn**: `git mv` thư mục → `modern-concurrency-vi/`, 8 `.md` + 8 `.pdf` sang slug tiếng Việt, thêm `README.md` mục lục | Khớp `k8s-ebook/` và `spring-security-vi/`; đường dẫn `content/` sạch, `build-content.sh` chỉ thêm 2 lệnh copy |
| D4 | Track chia tuần **cân theo khối lượng**, không phải 1 tuần = 1 chương | ch4 nặng gấp 28 lần ch8; ánh xạ thẳng chương→tuần làm nhịp học lệch hẳn và mất giá trị dẫn đường |
| D5 | Nhãn lĩnh vực **giữ nguyên tiếng Anh** "Modern Concurrency in Java" | Là tên sách; Việt hoá tên sách gây khó tra cứu ngược |
| D6 | **Không ghi tên tác giả** ở bất kỳ đâu | Không tệp nguồn nào nêu tên tác giả — chỉ có ISBN trong các link. Ghi vào là bịa. `README.md` và `desc` chỉ nêu "O'Reilly, ISBN 9781098165406" |
| D7 | Giữ nguyên nội dung markdown nguồn — không sửa link, không sửa đường dẫn ảnh | `fixRelativePaths()` (`views/docs.js:144`) resolve tương đối theo tệp; khuôn `content/<field>/images/…` tái dùng nguyên vẹn |
| D8 | 3 link nội bộ sách trỏ `learning.oreilly.com/…/ch01\|ch02\|ch05` **giữ nguyên** | Đổi sang `#/docs/…` làm tệp nguồn hỏng khi xem trên GitHub. Ghi chú khiếm khuyết này trong `README.md` của thư mục nguồn |
| D9 | **Không link chéo sang lĩnh vực `java`** | Bất biến #3b cấm `#/docs/java-05` trong track thuộc lĩnh vực khác — link như vậy âm thầm đổi lĩnh vực đang chọn giữa bài học (xem `navigate()` trong `app.js`). Chỗ trùng chủ đề nhắc bằng chữ |
| D10 | Docs tiền tố dài `modconc-NN`, lộ trình tiền tố ngắn `mc-w<N>-<M>` | Bám D6 của đợt trước (`springsec-03` ↔ `ss-w1-1`); hai không gian id tách bạch |

## 3. Nguồn: chuẩn hoá `modern-concurrency-vi/`

`git mv "Modern Concurrency in Java" modern-concurrency-vi`, rồi đổi tên từng cặp
`.md`/`.pdf` theo slug lấy từ chính tiêu đề H1 trong tệp:

| # | H1 trong tệp | Slug |
|---|---|---|
| 1 | Chương 1. Giới thiệu | `01-gioi-thieu` |
| 2 | Chương 2. Tìm hiểu về Virtual Thread | `02-tim-hieu-ve-virtual-thread` |
| 3 | Chương 3. Cơ chế hoạt động của Concurrency hiện đại trong Java | `03-co-che-hoat-dong-cua-concurrency-hien-dai` |
| 4 | Chương 4. Structured Concurrency | `04-structured-concurrency` |
| 5 | Chương 5. Scoped Values | `05-scoped-values` |
| 6 | Chương 6. Sự phù hợp của Reactive Java trong bối cảnh Virtual Thread | `06-reactive-java-trong-boi-canh-virtual-thread` |
| 7 | Chương 7. Các framework hiện đại sử dụng virtual thread | `07-cac-framework-hien-dai-su-dung-virtual-thread` |
| 8 | Chương 8. Kết luận và Điểm rút ra | `08-ket-luan-va-diem-rut-ra` |

`images/ch{1,2,3,4,6}/` giữ nguyên cấu trúc thư mục con.

`modern-concurrency-vi/README.md` mới — mục lục 8 chương + khối ghi chú nêu:
nguồn là sách có **bản quyền thương mại** (không phải giấy phép mở như CC BY 4.0 của
`System_Programming_VI/`); ch5, ch7, ch8 không có ảnh trong nguồn; 3 link nội bộ sách
trỏ về bản gốc trên O'Reilly (cần tài khoản).

### `webapp/build-content.sh`

Thêm `"$DEST/modconc/images"` vào lệnh `mkdir -p` sẵn có, và hai dòng copy:

```sh
cp "$REPO"/modern-concurrency-vi/*.md            "$DEST/modconc/"
cp -R "$REPO"/modern-concurrency-vi/images/.     "$DEST/modconc/images/"
```

Dùng `cp -R … images/.` (như `k8sbook`) vì ảnh nằm trong thư mục con `ch*/`.
`dev.sh`, `Dockerfile`, `deploy-pages.yml` đều gọi `build-content.sh` nên **không
tệp nào trong ba tệp đó phải sửa**. `.gitignore` đã bỏ qua `webapp/content/`.

## 4. Lĩnh vực mới — `webapp/js/data/fields.js`

```js
"modern-concurrency": {
  label: "Modern Concurrency in Java",
  icon: "🧵",
  desc: "Bản dịch tiếng Việt Modern Concurrency in Java (O'Reilly, ISBN 9781098165406) — virtual thread, structured concurrency, scoped values, và chỗ đứng của reactive sau Loom.",
  certFilter: false,
  modules: ["dashboard", "docs", "roadmap"],
  externalRef: { label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" },
},
```

`FIELD_ORDER` chèn **ngay sau `"java"`**:
`["kubernetes", "sysprog", "java", "modern-concurrency", "spring-security", "senior-java"]`
— gom hai lĩnh vực Java cạnh nhau trong sidebar. Thứ tự chỉ là trình bày, không phải
khoá `localStorage`, nên chèn giữa an toàn.

**Ràng buộc mở dần (bất biến #7):** khai module nào thì lĩnh vực phải đã có dữ liệu
module đó. Nên `fields.js` bị sửa **hai lần**: lần đầu `modules: ["dashboard", "docs"]`
cùng commit với 8 mục docs; lần sau thêm `"roadmap"` cùng commit với track. Đồng thời
bất biến chiều ngược (#7b) cấm dữ liệu tồn tại mà module không khai — nên docs và khai
báo lĩnh vực phải **cùng một commit**, không tách.

**Không đụng:** `meta.js` (DOMAINS/TOPICS chỉ phục vụ quiz/flashcards — lĩnh vực này
không khai), `views/dashboard.js` (đã field-driven qua `getDocs`/`getTracks`),
`views/docs.js`, `views/roadmap.js`, `css/style.css`, `js/lib/store.js`.

### Sơ đồ id

| Loại | Khuôn | Ví dụ |
|---|---|---|
| Lĩnh vực | `modern-concurrency` | — |
| Tài liệu | `modconc-NN` | `modconc-04` |
| Track | `modconc` | — |
| Tuần | `mc-w<N>` | `mc-w7` |
| Mục | `mc-w<N>-<M>` | `mc-w7-2` |
| Thư mục content | `content/modconc/` | — |

Cả hai không gian id (`modconc-*`, `mc-w*`) chưa từng xuất hiện trong kho → không đụng
tiến độ `localStorage` của bất kỳ người dùng nào.

## 5. Module `docs` — 8 tài liệu

Khối mới cuối `webapp/js/data/docs-index.js`, mọi bản ghi mang
`field: "modern-concurrency"`, `file: "content/modconc/<slug>.md"`:

| id | Tiêu đề | Trọng tâm (theo heading của chính chương) |
|---|---|---|
| `modconc-01` | 01 — Giới thiệu: hành trình concurrency của Java | Thread từ Java 1.0 → `java.util.concurrent` → Fork/Join → Loom; chi phí ẩn của thread; work-stealing; `CompletableFuture`; nhược điểm của reactive |
| `modconc-02` | 02 — Tìm hiểu về Virtual Thread | Hai loại thread; cách tạo; throughput vs scalability; mount/unmount; Semaphore thay pool; pinning; ThreadLocal; giám sát bằng JFR & `jcmd` |
| `modconc-03` | 03 — Cơ chế hoạt động của concurrency hiện đại | Tự xây thread pool; Executor; `Callable`/`Future`; `ForkJoinPool` làm scheduler; Continuation; tự dựng virtual thread từ đầu; I/O polling |
| `modconc-04` | 04 — Structured Concurrency | `StructuredTaskScope`; vòng đời scope/subtask; `Joiner` và các chính sách join; ngoại lệ; cấu hình; joiner tuỳ chỉnh; scope lồng nhau; khả năng quan sát |
| `modconc-05` | 05 — Scoped Values | Ô nhiễm tham số; hạn chế `ThreadLocal`; `ScopedValue.where/run`; kết hợp structured concurrency; di chuyển từ `ThreadLocal` |
| `modconc-06` | 06 — Reactive Java trong bối cảnh Virtual Thread | Blocking vs non-blocking I/O; kiến trúc hướng sự kiện; Reactive Streams; backpressure; lợi ích và hạn chế |
| `modconc-07` | 07 — Framework hiện đại dùng virtual thread | Spring Boot (bật sẵn + cấu hình thủ công); Quarkus; Jakarta EE |
| `modconc-08` | 08 — Kết luận và điểm rút ra | Chọn mô hình theo tải; cảnh báo pinning khi còn ở JDK 21; ThreadLocal; giám sát bằng JFR |

Mỗi bản ghi có `icon`, `desc` (1–2 câu), `tags` (3–4 nhãn) theo đúng lược đồ có sẵn ở
đầu tệp. Docs toàn app: **78 → 86**.

## 6. Module `roadmap` — track `modconc`

**9 tuần / 32 mục**, hai tệp dữ liệu `modconc-roadmap-part1.js` (tuần 1–5) và
`modconc-roadmap-part2.js` (tuần 6–9), đăng ký track trong `roadmap.js`.

Con số 9 tuần thay cho ước lượng 8 tuần lúc hỏi: sau khi đo thật, ch6 một mình đã
114 KB — ghép chung tuần cuối với ch7+ch8 làm tuần đó nặng gấp 4 lần các tuần khác,
đúng cái bệnh mà hướng "1 tuần = 1 chương" mắc phải. 9 tuần cũng trùng nhịp hai track
sách trước (`k8sbook`, `springsec` đều 9 tuần).

### 6.1 Phân bổ tuần

| Tuần | Nội dung nguồn | Mục | KB |
|---|---|---:|---:|
| `mc-w1` | Ch.1 toàn bộ — lịch sử tới lời hứa Loom | 3 | 79 |
| `mc-w2` | Ch.2 §"Virtual thread là gì" → §"Rate limiting" (dòng 1–1057) | 4 | 73 |
| `mc-w3` | Ch.2 §"Những hạn chế" → hết (dòng 1058–2157) | 4 | 68 |
| `mc-w4` | Ch.3 toàn bộ | 4 | 80 |
| `mc-w5` | Ch.4 §đầu → §"Các chính sách join phổ biến" (dòng 1–1745) | 4 | 103 |
| `mc-w6` | Ch.4 §"Xử lý ngoại lệ" → hết (dòng 1746–3963) | 4 | 106 |
| `mc-w7` | Ch.5 toàn bộ | 3 | 66 |
| `mc-w8` | Ch.6 toàn bộ | 3 | 114 |
| `mc-w9` | Ch.7 + Ch.8 | 3 | 35 |

Điểm cắt ch2 đặt ở dòng 1058 (§"Những hạn chế của Virtual Thread") chứ không phải
dòng 500 (§"bên dưới lớp vỏ"): cắt ở 500 ra 37 KB/104 KB, cắt ở 1058 ra 73 KB/68 KB.
Điểm cắt ch4 ở dòng 1746 (§"Xử lý ngoại lệ") ra 103 KB/106 KB.

### 6.2 Mục theo tuần

- **`mc-w1`** (3): lịch sử thread và chi phí ẩn · thread pool → Executor → work-stealing →
  `CompletableFuture` · reactive như paradigm khác và lời hứa virtual thread.
- **`mc-w2`** (4): virtual thread là gì, khác platform thread ở đâu · thiết lập môi trường
  và các cách tạo · throughput vs scalability · dưới lớp vỏ (stack frame, carrier thread,
  blocking) và rate limiting bằng `Semaphore`.
- **`mc-w3`** (4): pinning — nguyên nhân và biểu hiện · thoát pinning bằng `ReentrantLock`,
  native method, JEP 491/JDK 24 · `ThreadLocal` trong virtual thread · giám sát (JFR,
  `jcmd` thread dump, `HotSpotDiagnosticsMXBean`) và mẹo migrate.
- **`mc-w4`** (4): vì sao cần pool, tự xây một pool · Executor, `Callable`/`Future` ·
  `ForkJoinPool` và vì sao nó làm scheduler cho virtual thread · Continuation và tự dựng
  virtual thread từ đầu.
- **`mc-w5`** (4): thách thức của unstructured concurrency · `StructuredTaskScope`, vòng đời
  scope/subtask · `Joiner` và chính sách join · các chính sách join phổ biến.
- **`mc-w6`** (4): xử lý ngoại lệ · cấu hình scope · joiner tuỳ chỉnh · nhất quán bộ nhớ,
  scope lồng nhau, khả năng quan sát.
- **`mc-w7`** (3): gánh nặng truyền ngữ cảnh và hạn chế `ThreadLocal` · thành phần cốt lõi
  và cách chạy `ScopedValue` · kết hợp structured concurrency, hiệu năng, di chuyển.
- **`mc-w8`** (3): blocking vs non-blocking I/O và kiến trúc hướng sự kiện · Reactive Streams
  và backpressure · lợi ích/hạn chế và chọn mô hình.
- **`mc-w9`** (3): Spring Boot · Quarkus và Jakarta EE · kết luận và checklist migrate.

### 6.3 Lược đồ nội dung mỗi mục

Giữ đúng khuôn 4 phần đã dùng cho `sysprog`/`springsec`, mỗi mục là **kế hoạch đọc trỏ
vào sách, không chép lại sách**:

```
**Mục tiêu.** …            (làm được gì sau mục này)
**Đọc.** …                 (link #/docs/modconc-NN kèm tên mục §, nói rõ đọc kỹ vs lướt)
**Bẫy.** …                 (2 bẫy, bám nội dung thật của mục)
**Tự kiểm tra.** …         (2 câu hỏi trả lời được nếu đã đọc)
```

`resources` theo tuần: chip `#/docs/modconc-NN` (cùng lĩnh vực → thoả #3b) + link ngoài.

**Quy tắc chống bịa:** 162 shortlink `oreil.ly/…` trong nguồn không resolve được offline.
Chip ngoài chỉ dùng số JEP xác minh được (JEP 444 — virtual thread; JEP 491 — pinning,
JDK 24; cả hai đã có trong `Chủ đề II/05-virtual-threads.md` của kho), còn lại trỏ
`https://openjdk.org/jeps/` hoặc `https://wiki.openjdk.org/display/loom/Main`.

### 6.4 Không liên kết chéo sang lĩnh vực `java`

Series Java sẵn có trùng chủ đề nặng — bài 03 (sync/async), 04 (thread lifecycle),
05 (virtual threads). Nhưng bất biến #3b cấm link `#/docs/java-*` trong track thuộc lĩnh
vực khác. Chỗ trùng nhắc **bằng chữ**, không link: *"đối chiếu với bài 05 của lĩnh vực
Java & Spring Boot Scalability"*. Không nới bất biến, không thêm allowlist.

## 7. Bất biến dữ liệu — `webapp/check-data.mjs`

Không viết bất biến mới. Chỉ mở rộng bảng kỳ vọng:

```js
// Lĩnh vực Modern Concurrency in Java — 8 chương sách O'Reilly.
"docs:modern-concurrency": 8,
"roadmap-items:modern-concurrency": 32,
```

Bất biến "EXPECTED.counts phủ mọi lĩnh vực khai docs/roadmap/tracker" (N3) tự cưỡng chế
hai khoá này ngay khi `fields.js` khai module — quên khai là báo đỏ.

Các bất biến sẵn có tự phủ lên dữ liệu mới, không cần sửa gì: #1 id duy nhất · #2 tệp
docs tồn tại trên đĩa · #2b ảnh trong markdown tồn tại (19 ảnh `ch*/`) · #3 link
`#/docs/<id>` có thật · #3b link cùng lĩnh vực với track · #3c link `#/roadmap/<trackId>` ·
"Id mục lộ trình khớp tiền tố id tuần cha" (`mc-w7-2` ⊂ `mc-w7`) · "Mọi khối tuần có ít
nhất 1 mục" · "Mọi module của lĩnh vực là view có thật" · "FIELD_ORDER khớp FIELDS 1-1" ·
#7 và #7b (module ↔ dữ liệu, hai chiều) · "Module chỉ dành cho Kubernetes không bị lĩnh
vực khác khai".

## 8. Thứ tự triển khai

Ba đợt, mỗi đợt tự nó xanh `check-data.mjs`:

1. **Nguồn + docs.** `git mv` thư mục và tệp, viết `README.md` nguồn, sửa
   `build-content.sh`, khai lĩnh vực với `modules: ["dashboard", "docs"]`, thêm 8 mục
   docs, thêm khoá `docs:modern-concurrency`. Sau đợt này lĩnh vực đã dùng được.
2. **Track phần 1.** `modconc-roadmap-part1.js` (tuần 1–5, 19 mục), đăng ký track trong
   `roadmap.js`, thêm `"roadmap"` vào `modules`, thêm khoá `roadmap-items:…`.
   *Lưu ý:* khoá kỳ vọng phải bằng đúng số mục đang có (19) rồi mới lên 32 ở đợt 3.
3. **Track phần 2 + tài liệu.** `modconc-roadmap-part2.js` (tuần 6–9, 13 mục), cập nhật
   khoá kỳ vọng lên 32, cập nhật toàn bộ tài liệu ở mục 9.

## 9. Tài liệu phải cập nhật

- `README.md` gốc — đoạn "DevPrep" (danh sách lĩnh vực, "cả năm lĩnh vực" → sáu), bảng
  thành phần (thêm hàng `modern-concurrency-vi/`), số liệu ở hàng `webapp/`
  (10 giáo trình → 11, 540 mục → 572, 78 tài liệu → 86).
- `webapp/README.md` — câu mở đầu, bảng tính năng (hàng Lộ trình học và Thư viện tài liệu),
  mục "Bộ chọn lĩnh vực", cây cấu trúc mã (thêm `modconc-roadmap-part*.js`).
- `webapp/js/data/roadmap.js` — chú thích đầu tệp liệt kê track và số mục.
- `webapp/js/data/docs-index.js` — chú thích đầu tệp liệt kê thư mục nguồn.
- `webapp/index.html` — `<meta name="description">` liệt kê lĩnh vực.
- `webapp/build-content.sh` — không có chú thích liệt kê, chỉ thêm lệnh.

## 10. Ngoài phạm vi

Đã cân nhắc và **cố ý loại**:

- Flashcards, trắc nghiệm, thi thử, labs cho lĩnh vực mới (D2).
- Cross-link hai chiều với lĩnh vực `java` và với `Chủ đề II — Concurrency Model` (D9).
- Chuyển 8 PDF (~31 MB) ra khỏi git hay nén lại — chúng đã ở trong lịch sử, gỡ ra là một
  việc riêng có rủi ro riêng.
- Sửa nội dung bản dịch: dịch nốt thuật ngữ còn tiếng Anh, đổi 3 link O'Reilly nội bộ,
  đổi 162 shortlink `oreil.ly` thành URL đích.
- Tìm kiếm toàn văn trong thư viện tài liệu; tách `js/data/` thành thư mục con theo lĩnh vực.

## 11. Rủi ro và giới hạn đã biết

| Rủi ro | Xử lý |
|---|---|
| 32 mục `lesson` là khối lượng soạn lớn, dễ trôi thành tóm tắt sách | Khuôn 4 phần ở 6.3 bắt mỗi mục phải trỏ vào mục § cụ thể; chia 3 đợt, nghiệm thu từng đợt |
| Bịa số JEP / API name khi không resolve được `oreil.ly` | Quy tắc chống bịa ở 6.3: chỉ dùng số JEP đã xác minh trong kho, còn lại trỏ trang chủ |
| `git mv` 16 tệp làm nhiễu lịch sử | `git mv` giữ nguyên nội dung nên `git log --follow` vẫn lần được; làm gọn trong một commit riêng, không trộn với sửa mã |
| Tuần 8 (ch6, 114 KB) nặng hơn mặt bằng | Chấp nhận: phần lớn ch6 là một ví dụ chat server dài, đọc nhanh hơn số byte gợi ý. Ghi rõ trong `goal` của tuần |
| Đổi id sau khi phát hành làm mất tiến độ người dùng | Chốt sơ đồ id ở mục 4 trước khi viết dữ liệu; bất biến tiền tố cưỡng chế |

## 12. Nghiệm thu

1. `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs` — xanh toàn bộ,
   `docs:modern-concurrency = 8` và `roadmap-items:modern-concurrency = 32`.
2. `./webapp/dev.sh` rồi kiểm tay:
   - Bộ chọn hiện **6 lĩnh vực**, `modern-concurrency` nằm ngay sau `java`.
   - Nav của lĩnh vực mới đúng 3 mục: Bảng điều khiển · Lộ trình học · Tài liệu.
   - Mở cả 8 tài liệu: ảnh `ch1/ch2/ch3/ch4/ch6` hiển thị, mục lục nổi đúng, khối mã
     được highlight.
   - Track `modconc` hiện ở trang lộ trình với 9 tuần; tick một mục, tải lại trang —
     còn nguyên.
   - Đổi sang lĩnh vực khác rồi quay lại — nav và tiến độ đúng.
   - Chân sidebar hiện link `openjdk.org — Project Loom`.
3. Tiến độ của 5 lĩnh vực cũ không đổi (không id cũ nào bị đụng).
