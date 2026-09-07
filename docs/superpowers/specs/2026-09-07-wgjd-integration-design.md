# Tích hợp *The Well-Grounded Java Developer* vào DevPrep — thiết kế

Ngày: 2026-09-07
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `wgjd`

Khuôn mẫu trực tiếp: [`2026-09-05-kafka-integration-design.md`](2026-09-05-kafka-integration-design.md)
và [`2026-09-05-modern-java-integration-design.md`](2026-09-05-modern-java-integration-design.md).

## 1. Bối cảnh

Commit `7ed525a` đưa vào repo thư mục `The Well-Grounded Java Developer/`: 16 PDF chương và thư
mục `vi/` chứa bản dịch tiếng Việt của *The Well-Grounded Java Developer, ấn bản 2*
(Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning), kèm 93 ảnh. Nội dung **đã dịch
xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

Số liệu đã đo, không ước lượng:

| Chỉ số | WGJD | MJIA (đối chiếu) | Kafka (đối chiếu) |
|---|---:|---:|---:|
| Số chương | **16** (1–8, 11–18) | 21 | 13 (2–14) |
| Tổng số từ | **215.650** | 212.942 | 175.089 |
| Trung bình mỗi chương | 13.478 | 10.140 | 13.468 |
| Chương nặng nhất | ch.11 Build — 18.810 | ch.6 — 15.047 | ch.13 — 19.493 |
| Chương nhẹ nhất | ch.8 Các ngôn ngữ JVM thay thế — 9.561 | ch.8 — 5.524 | ch.5 — 9.180 |
| Số ảnh | **93** | 100 | 47 |

Toàn vẹn ảnh đã kiểm: **93 tệp, 93 lượt tham chiếu, 0 gãy, 0 mồ côi.**

Số từ từng chương (dùng để cân nhịp tuần ở §6):

| Ch. | Từ | Ch. | Từ | Ch. | Từ | Ch. | Từ |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 10.789 | 5 | 18.523 | 11 | 18.810 | 15 | 15.771 |
| 2 | 12.378 | 6 | 13.675 | 12 | 13.899 | 16 | 11.459 |
| 3 | 9.774 | 7 | 18.209 | 13 | 10.480 | 17 | 14.854 |
| 4 | 15.600 | 8 | 9.561 | 14 | 9.731 | 18 | 12.137 |

Nền trước khi bắt đầu (đã chạy `check-data.mjs`): **49/49 bất biến đạt, 197 tài liệu, 17 track,
810 mục lộ trình, 10 lĩnh vực.** Sau đợt này: **213 tài liệu, 18 track, 858 mục, 11 lĩnh vực.**

### 1.1 Chương 9 và 10 vắng mặt — lỗ hổng CÓ HỆ QUẢ

Bản dịch không có ch.9 (Kotlin) và ch.10 (Clojure), và **cũng không có PDF gốc của hai chương
đó**. Đây là giới hạn cứng của nguồn: không thể dịch bổ sung trong đợt này, không phải quyết
định hoãn lại.

Khác với ch.1 vắng mặt của Kafka — nơi ch.2 mở đầu độc lập và không ai mất gì — lỗ hổng ở đây
**có hệ quả xuống ba chương sau**. Đã đo bằng cách đếm số lần nhắc và đọc ngữ cảnh:

| Chương | Nhắc Kotlin | Nhắc Clojure | Câu dẫn ngược trong chính bản dịch |
|---|---:|---:|---|
| ch.14 Kiểm thử vượt ra ngoài JUnit | 22 | **89** | *"Chúng ta sẽ chạy test qua REPL Clojure, giống như đã làm xuyên suốt chương 10. Nếu bạn bỏ qua chương đó… giờ là lúc tốt để ôn lại."* |
| ch.15 Lập trình hàm nâng cao | **66** | 28 | *"dùng shorthand `it` mô tả ở chương 9"*; *"Chúng ta đã thấy ở chương 9 rằng…"*; *"đã gặp những điều cơ bản… ở chương 10"* |
| ch.16 Lập trình đồng thời nâng cao | **55** | 53 | *"Như đã giới thiệu ở chương 9, Kotlin cung cấp… coroutine"*; *"ví dụ đã sửa đổi của cái ta thấy ở chương 9"* |

Ngoài ra ch.11 dẫn *"Kotlin, mà chúng ta đã đề cập chi tiết ở chương 9"* và ch.17 dẫn *"một
phiên bản đơn giản hóa của `IFn` ở chương 10"*.

**Quyết định:** tích hợp đủ 16 chương vào mạch chính, không tách ch.14–16 thành phần tuỳ chọn,
và ghi lỗ hổng ở **ba chỗ** — `desc` của lĩnh vực, `prereq` của track, và chính các mục lộ trình
của W6/W9/W10/W11 — kèm chip primer Kotlin/Clojure ngoài ở W6 (§6.1). Không ai được suy đoán
nội dung ch.9/ch.10 để lấp vào bản dịch hay vào bài học lộ trình.

### 1.2 Nguồn không có README

Sáu đợt trước đều nhận nguồn kèm `README.md` ghi tác giả, ấn bản và giấy phép. Nguồn này không
có. Quy ước `sources/README.md` bắt buộc *"Mỗi nguồn dịch từ sách có README.md ghi tác giả, ấn
bản, giấy phép/bản quyền"* — nên phải **viết mới** `sources/wgjd/README.md` (§3.2). Đây là việc
thêm so với mọi đợt trước, không phải bước sao chép.

### 1.3 Nguồn không cho biết sách chia Phần

Sách in có chia Phần, nhưng 16 PDF chương đều bắt đầu thẳng ở tiêu đề chương ("1 Introducing
modern Java", "This chapter covers…") và không mang nhãn Phần; không có PDF mục lục, và bản
dịch không có README để tra. Trong repo **không tồn tại bằng chứng** tên các Phần.

Quy ước `sources/README.md` nói `part` lấy từ README nguồn, **không bịa**. Nên `part: null` cho
cả 16 tài liệu — cùng cách Kafka và MJIA đã làm. Ghi lại ở đây để lần sau không ai tưởng là bỏ
sót rồi đi điền theo trí nhớ.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `wgjd`, không gộp vào `java` hay `modern-java` | 215.650 từ là quá lớn để làm nguồn phụ. MJIA thiên về API (lambda/stream), WGJD thiên về JVM internals/build/test — trộn sẽ làm mờ chủ đề và phá đánh số doc id. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap"]` | Đồng khuôn 6 lĩnh vực sách hiện có. Không làm flashcards/quiz đợt này. |
| 3 | Doc id `wgjd-01`…`wgjd-08`, `wgjd-11`…`wgjd-18`; **bỏ trống `wgjd-09`, `wgjd-10`** | Số id khớp số chương sách. Tiền lệ `kafka-01` và `k8sbook-`. Đánh lại 01–16 sẽ khiến `wgjd-09` trỏ vào chương 11 — nhầm lẫn vĩnh viễn vì id là khoá localStorage. |
| 4 | Tích hợp đủ 16 chương vào mạch chính; ghi lỗ hổng ch.9–10 ở ba chỗ + chip primer ngoài | §1.1. Tách ch.14–16 ra phần tuỳ chọn sẽ cắt rời ch.13↔ch.14 (hai chương kiểm thử) mà không giải quyết được tham chiếu ngược. |
| 5 | `part: null` cho cả 16 tài liệu | §1.3. |
| 6 | Vị trí trên con đường Java Backend: **sau `modern-java`, trước `java`** | MJIA dạy API hiện đại; WGJD chui xuống dưới nắp (bytecode, JMM, hiệu năng, build, container) — đúng thứ cần trước series scalability, vì `java-04`/`java-05`/`java-07` giả định người đọc hiểu thread JVM và biết đo hiệu năng. |
| 7 | Lộ trình **12 tuần / 48 mục**, tuyến tính theo thứ tự sách, cân theo số từ | ~18.0k từ/tuần, bằng nhịp MJIA (212.9k từ, 12 tuần) và DDIA. Đảo thứ tự theo chủ đề sẽ phá tham chiếu nội bộ của sách (ch.16 dẫn lại ch.5–6; ch.15 dẫn ch.10). |
| 8 | Ảnh giữ nguyên bố cục `images/chNN/` | Bố cục giống DDIA. Sắp xếp lại sẽ gãy toàn bộ 93 tham chiếu tương đối. |
| 9 | **Không** nối `wgjd-12` (container) sang lĩnh vực Kubernetes | Khác con đường. Bất biến #3b chặn link `#/docs/` xuyên con đường trong lộ trình; nối ở `related.js` mà không nối được ở lộ trình sẽ thành bất đối xứng khó hiểu. |
| 10 | Chia 6 chặng, mỗi chặng `check-data.mjs` xanh | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu (#7), và có dữ liệu thì phải khai module (#7b). |

## 3. Nguồn: chuẩn hoá `sources/wgjd/`

`git mv` thư mục `The Well-Grounded Java Developer/vi/` thành `sources/wgjd/`, bỏ tiền tố `ch`
khỏi 16 tệp markdown để khớp quy ước `NN-slug.md`, rồi chuyển 16 PDF vào `sources/wgjd/pdf/`
theo cùng slug. `images/` đi cùng. Giữ nguyên nội dung — **không sửa một ký tự nào**: đường dẫn
ảnh là tương đối theo tệp chứa, và `images/` di chuyển cùng các tệp `.md`.

Tiêu đề dưới đây trích **nguyên văn từ dòng H1 của từng tệp dịch**, không dịch lại. `title`
trong `docs.js` bỏ tiền tố số ("1. ", "2. "…) vì nhãn "Ch. N · …" do `labels.js` sinh (bất biến D1).

| # | `.md` mới | H1 trong bản dịch |
|---:|---|---|
| 01 | `01-introducing-modern-java.md` | 1. Giới thiệu về Java hiện đại |
| 02 | `02-java-modules.md` | 2. Java modules |
| 03 | `03-java-17.md` | 3. Java 17 |
| 04 | `04-class-files-and-bytecode.md` | 4. Class file và bytecode |
| 05 | `05-java-concurrency-fundamentals.md` | 5. Nền tảng lập trình đồng thời trong Java |
| 06 | `06-jdk-concurrency-libraries.md` | 6. Thư viện concurrency của JDK |
| 07 | `07-understanding-java-performance.md` | 7. Hiểu về hiệu năng Java |
| 08 | `08-alternative-jvm-languages.md` | 8. Các ngôn ngữ JVM thay thế |
| 11 | `11-building-with-gradle-and-maven.md` | 11. Build với Gradle và Maven |
| 12 | `12-running-java-in-containers.md` | 12. Chạy Java trong container |
| 13 | `13-testing-fundamentals.md` | 13. Nền tảng kiểm thử |
| 14 | `14-testing-beyond-junit.md` | 14. Kiểm thử vượt ra ngoài JUnit |
| 15 | `15-advanced-functional-programming.md` | 15. Lập trình hàm nâng cao |
| 16 | `16-advanced-concurrent-programming.md` | 16. Lập trình đồng thời nâng cao |
| 17 | `17-modern-internals.md` | 17. Nội tại hiện đại của JVM (Modern internals) |
| 18 | `18-future-java.md` | 18. Java trong tương lai (Future Java) |

PDF đổi tên theo cùng slug: `1 Introducing modern Java _ ….pdf` → `pdf/01-introducing-modern-java.pdf`,
và tương tự cho 15 tệp còn lại.

Sau khi `git mv` xong, thư mục `The Well-Grounded Java Developer/` biến mất hoàn toàn.

Trước khi đổi tên, xác nhận không nơi nào tham chiếu đường dẫn cũ:

```bash
grep -rn "The Well-Grounded Java Developer/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="The Well-Grounded Java Developer" .
```

Kỳ vọng: **không dòng nào**. Dùng dấu `/` cuối mẫu để chỉ bắt tham chiếu **đường dẫn**, không
bắt tên sách trong văn xuôi. Dùng `--exclude-dir`, không dùng `grep -v "^./…"` — trên máy này
`grep -r .` không thêm tiền tố `./`, nên bộ lọc dạng `^./` không ăn và cho cảm giác an toàn giả.

### 3.1 Ảnh — bố cục theo chương, giống DDIA

93 ảnh nằm trong `images/chNN/`, tên `img-<trang>-<số>.png`. Phân bố đã đếm:

| ch.1 | ch.2 | ch.4 | ch.5 | ch.6 | ch.7 | ch.8 | ch.11 | ch.12 | ch.13 | ch.14 | ch.15 | ch.16 | ch.17 | ch.18 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 1 | 4 | 9 | 11 | 14 | 4 | 6 | 12 | 1 | 2 | 3 | 10 | 6 | 4 |

Ch.3 không có ảnh. Tổng 93, khớp đúng 93 lượt tham chiếu trong markdown.

### 3.2 `sources/wgjd/README.md` — viết mới

Nội dung bắt buộc, theo khuôn README của các nguồn khác:

- Tên sách, ấn bản 2, tác giả Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning.
- Ghi rõ **sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0**.
- 16/18 chương: liệt kê ch.1–8 và ch.11–18.
- **Ghi rõ ch.9 (Kotlin) và ch.10 (Clojure) không thuộc phạm vi bản dịch và không có PDF gốc**,
  kèm cảnh báo rằng ch.14–16 dựa vào hai chương này (§1.1).
- 93 ảnh trong `images/chNN/`, PDF gốc trong `pdf/` và không vào bản deploy.

## 4. Khai lĩnh vực

### 4.1 `webapp/js/data/fields.js`

Các trường (`desc` viết liền một dòng khi vào code, xuống dòng ở đây chỉ để đọc):

| Trường | Giá trị |
|---|---|
| `label` | `The Well-Grounded Java Developer` |
| `icon` | `🧱` |
| `short` | `WGJD` |
| `unit` | `Ch.` |
| `certFilter` | `false` |
| `modules` | `["dashboard", "guide", "docs", "roadmap"]` |
| `externalRef` | `{ label: "docs.oracle.com — JVM Specification", href: "https://docs.oracle.com/javase/specs/" }` |

`desc`: *Bản dịch tiếng Việt The Well-Grounded Java Developer, ấn bản 2 (Benjamin J. Evans,
Jason Clark, Martijn Verburg — Manning) — chương 1–8 và 11–18: Java hiện đại, module, class
file và bytecode, JMM, thư viện concurrency, hiệu năng, Gradle/Maven, container, kiểm thử, lập
trình hàm và concurrency nâng cao, nội tại JVM. Chương 9 (Kotlin) và 10 (Clojure) không nằm
trong bản dịch.*

`externalRef` chọn JVM Specification vì trọng tâm cuốn này là bytecode, class file và nội tại
JVM; `dev.java` đã thuộc về `modern-java`.

`FIELD_ORDER` chèn `"wgjd"` ngay sau `"modern-java"`.

### 4.2 `webapp/js/data/paths.js`

```js
PATHS.java.fields = ["spring-start", "modern-java", "wgjd", "java",
                     "modern-concurrency", "spring-security"];
```

`PATHS.java.desc` hiện viết *"Một nghề, năm chặng…"* — phải sửa thành sáu chặng và nêu chặng
mới. Bất biến P1 kiểm mọi lĩnh vực xuất hiện đúng một lần trong `PATHS ∪ SPINE`; quên thêm
`wgjd` là đỏ ngay.

### 4.3 `webapp/js/data/guides.js`

`fieldGuides.wgjd` — tagline, audience, `hoursPerWeek: "6–8 giờ/tuần · 12 tuần"`, prereqs
(JDK 17+, một dự án Maven hoặc Gradle thật, đọc được stack trace), 5 `steps`, `method`,
`pitfalls`, `doneWhen`. Một `pitfall` bắt buộc nói về ch.9–10 (chỗ ghi lỗ hổng thứ nhất trong
guides).

`trackGuides.wgjd` — `rhythm` / `before` / `during` / `after`.

Bất biến G1 bắt buộc: khai module `guide` mà thiếu `fieldGuides` là đỏ; mọi track phải có
`trackGuides`.

## 5. Thư viện tài liệu — `webapp/js/data/wgjd/docs.js`

16 bản ghi theo thứ tự đọc. Mỗi bản ghi: `id`, `field: "wgjd"`, `chapter` (số chương thật),
`part: null`, `title` (chỉ tên chương — nhãn "Ch. N · …" do `labels.js` sinh), `file:
"content/wgjd/NN-slug.md"`, `icon`, `desc` (một câu nói chương này trả lời câu hỏi gì),
`tags` (3 từ khoá).

`docs-index.js`: thêm `import { docs as wgjd } from "./wgjd/docs.js";` và `...wgjd,` trong mảng.

## 6. Lộ trình đọc — track `wgjd`

Track id `wgjd`, week id `wg-w1`…`wg-w12`, item id `wg-w<N>-<M>`. Tiền tố `wg-` chưa ai dùng
(đã có `w`, `cka-`, `cks-`, `sp-`, `kb-`, `cb-`, `ku-`, `ss-`, `mc-`, `dd-`, `mj-`, `kf-`,
`sh-`, `sj-`). **Id là khoá lưu tiến độ trong localStorage — không được đổi về sau.**

4 mục mỗi tuần, tách hai tệp: `wgjd/roadmap-part1.js` (W1–6, 24 mục) và
`wgjd/roadmap-part2.js` (W7–12, 24 mục).

| Tuần | Chương | Từ | Trọng tâm |
|---|---|---:|---|
| W1 | 1 + 2 | 23.2k | Java như platform và language, release model, `var`; module system |
| W2 | 3 + 4 | 25.4k | Java 17 (record, sealed, switch); class file, bytecode, `javap` |
| W3 | 5 | 18.5k | Concurrency nền tảng, JMM, hỗ trợ concurrency trong bytecode |
| W4 | 6 | 13.7k | Thư viện concurrency của JDK |
| W5 | 7 | 18.2k | Hiệu năng: đo bằng JMH, GC |
| W6 | 8 | 9.6k | Ngôn ngữ JVM khác — tuần nhẹ có chủ đích (§6.1) |
| W7 | 11 | 18.8k | Build với Maven và Gradle |
| W8 | 12 | 13.9k | Java trong container |
| W9 | 13 + 14 | 20.2k | Nền tảng kiểm thử; kiểm thử vượt ra ngoài JUnit |
| W10 | 15 | 15.8k | Lập trình hàm nâng cao |
| W11 | 16 + 17 | 26.4k | Lập trình đồng thời nâng cao; nội tại hiện đại của JVM |
| W12 | 18 | 12.1k | Java tương lai (Amber, Panama, Loom, Valhalla) + tổng kết |

Trung bình 18.0k từ/tuần; biên độ 9.6k–26.4k. W11 nặng nhất vì ch.16 và ch.17 đều dày và đều
là chương "nâng cao" — `practice` của tuần đó phải nhẹ để bù.

### 6.1 W6 nhẹ là thiết kế

Ch.9 và ch.10 đáng lẽ nằm ngay sau ch.8. 8.4k từ dôi ra ở W6 dành cho primer ngoài, đưa vào
`resources` của tuần:

- `kotlinlang.org/docs/basic-syntax` — cú pháp cơ bản, `val`/`var`, lambda và shorthand `it`.
- `clojure.org/guides/learn/syntax` — form, immutability, `(map)`, variadic.

Mục tiêu của W6 không phải "học Kotlin và Clojure" mà là **đọc được** đoạn mã hai ngôn ngữ đó
khi gặp ở W9–W11.

### 6.2 Ghi lỗ hổng ch.9–10 ở đúng ba chỗ

1. `FIELDS.wgjd.desc` (§4.1) — người dùng thấy ngay ở bộ chọn lĩnh vực.
2. `tracks[wgjd].prereq` — trước khi bắt đầu lộ trình.
3. Chính các mục lộ trình W6, W9, W10, W11 — nơi lỗ hổng cắn thật, kèm câu chỉ dẫn cụ thể
   (ví dụ W9: ch.14 chạy test qua REPL Clojure, đọc primer §6.1 trước nếu thấy khó theo).

### 6.3 Khuôn một mục

Giữ đúng khuôn 4 khối của repo: **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**. Mỗi mục là **kế hoạch
đọc trỏ vào sách**, không chép lại nội dung sách; link dạng `#/docs/wgjd-NN` gắn vào tên mục
thật trong chương. `practice` ở mức tuần, làm trên máy thật:

| Tuần | `practice` |
|---|---|
| W2 | Dịch một class nhỏ rồi đọc bytecode bằng `javap -c`, đối chiếu với điều chương 4 mô tả |
| W3 | Viết một ví dụ data race, chứng minh nó sai, rồi sửa bằng `synchronized` và bằng `volatile` — giải thích vì sao cả hai đều đúng nhưng khác nhau |
| W5 | Viết một benchmark JMH đo hai cách hiện thực cùng một hàm; kết luận chỉ dựa trên số đo |
| W7 | Dựng cùng một dự án bằng cả Maven và Gradle, so sánh vòng đời build |
| W8 | Đóng gói image cho JVM nhận đúng cgroup limit; chứng minh bằng `Runtime.availableProcessors()` |

### 6.4 Đăng ký track — `webapp/js/data/roadmap.js`

| Trường | Giá trị |
|---|---|
| `id` | `wgjd` |
| `field` | `wgjd` |
| `label` | `Well-Grounded Java` |
| `icon` | `🧱` |
| `name` | `Đọc The Well-Grounded Java Developer (ấn bản 2)` |
| `durationWeeks` | `12` |
| `weeks` | `[...wgjdWeeksPart1, ...wgjdWeeksPart2]` |

`desc`: *Kế hoạch đọc 12 tuần bám theo bản dịch 16 chương: mỗi mục nêu mục tiêu, chỉ đúng mục
cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực hành gõ tay — đọc bytecode
bằng `javap`, đo bằng JMH, dựng build Maven và Gradle, đóng gói image nhận đúng cgroup limit.*

`prereq`: *Yêu cầu: viết được Java ở mức thành thạo và có một dự án Maven hoặc Gradle thật để
áp dụng — đây không phải sách nhập môn. Bản dịch không có chương 9 (Kotlin) và chương 10
(Clojure); các tuần 9–11 đọc mã hai ngôn ngữ đó, nên tuần 6 có phần tự bổ túc cú pháp cơ bản
trước khi tới đó.*

Thêm hai dòng `import`, cập nhật khối chú thích đầu tệp (danh sách track và danh sách tiền tố
id) — khối đó là tài liệu sống, để cũ là sai lệch.

## 7. Liên kết chéo — `webapp/js/data/related.js`

Khai một chiều từ `wgjd`; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Toàn bộ
khác lĩnh vực (bất biến R1) và cùng con đường Java Backend.

| Từ | Tới | Lý do đọc-liền-mạch |
|---|---|---|
| `wgjd-02` | `mjia-14` | module system nhìn từ hai cuốn |
| `wgjd-05` | `java-04`, `modconc-01` | JMM ↔ thread lifecycle và bí ẩn RUNNABLE |
| `wgjd-06` | `java-06`, `java-07`, `modconc-03` | thư viện pool ↔ TaskQueue Tomcat, sizing, ForkJoinPool |
| `wgjd-07` | `java-07`, `mjia-07` | đo hiệu năng ↔ capacity planning, parallel stream |
| `wgjd-12` | `java-07` | JVM trong container ↔ cgroup/CFS throttling |
| `wgjd-14` | `springstart-15` | kiểm thử vượt ra ngoài JUnit ↔ kiểm thử ứng dụng Spring |
| `wgjd-15` | `mjia-18`, `mjia-19` | FP nâng cao ↔ tư duy hàm, kỹ thuật lập trình hàm |
| `wgjd-16` | `modconc-02`, `modconc-04`, `java-05` | coroutine, concurrency nâng cao ↔ virtual thread, structured concurrency |
| `wgjd-17` | `modconc-03` | `invokedynamic`, nội tại ↔ cơ chế concurrency hiện đại |
| `wgjd-18` | `modconc-02`, `java-05` | Loom ↔ virtual thread |

10 khoá, 18 liên kết. Không nối sang Kubernetes — quyết định #9 (§2).

## 8. Chia chặng

Mỗi chặng tự chạy được: `check-data.mjs` phải xanh ở cuối từng chặng.

| # | Chặng | Đụng gì |
|---|---|---|
| 1 | Chuẩn hoá nguồn | `git mv` → `sources/wgjd/` (16 md + 93 ảnh + 16 pdf), viết `sources/wgjd/README.md`. Không đụng app. |
| 2 | Lĩnh vực + thư viện | `fields.js` (modules `dashboard`/`guide`/`docs` — **chưa** `roadmap`), `FIELD_ORDER`, `paths.js`, `wgjd/docs.js` 16 bản ghi, `docs-index.js`, `fieldGuides.wgjd`, `EXPECTED["docs:wgjd"] = 16` |
| 3 | Lộ trình W1–6 | `wgjd/roadmap-part1.js`, 24 mục. Tệp chưa được import — app không đổi. |
| 4 | Lộ trình W7–12 | `wgjd/roadmap-part2.js`, 24 mục. |
| 5 | Bật track | `roadmap.js` (import + `tracks[]` + chú thích đầu tệp), `fields.js` thêm `"roadmap"`, `trackGuides.wgjd`, steps của `fieldGuides` trỏ track, `EXPECTED["roadmap-items:wgjd"] = 48` |
| 6 | Nối và ghi | `related.js`, `README.md` gốc, `sources/README.md`, cập nhật mọi số liệu |

Thứ tự chặng 2 → 5 là bắt buộc: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, và
#7b chặn có dữ liệu mà không khai module — nên track và việc bật module phải nằm cùng một chặng.

Chặng 3 và 4 là phần nặng nhất: 48 bài học viết tay, mỗi bài phải đọc chương gốc để trỏ đúng
tên mục và trích đúng cái bẫy sách nói. Không sinh máy móc từ mục lục.

## 9. Kiểm chứng

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

`build-content.sh` **không cần sửa** — nó sao chép cả cây `sources/` trừ `*.pdf`.

Số đếm kỳ vọng thêm vào `EXPECTED.counts`: `"docs:wgjd": 16`, `"roadmap-items:wgjd": 48`.

Bất biến sẽ cắn nếu làm sai:

| Bất biến | Cắn khi |
|---|---|
| #2 / #2b | `docs[].file` hoặc một trong 93 ảnh không tồn tại trên đĩa sau `build-content.sh` |
| #2c | `file` không có dạng `content/wgjd/…` |
| #3b | Link `#/docs/<id>` trong lộ trình trỏ sang lĩnh vực khác con đường |
| #7 / #7b | Khai `roadmap` khi chưa có dữ liệu, hoặc có dữ liệu mà chưa khai |
| G1–G4 | Thiếu `fieldGuides.wgjd` hoặc `trackGuides.wgjd`; `steps[].href`/`done` sai hình dạng |
| P1 | `wgjd` không có mặt đúng một lần trong `PATHS ∪ SPINE` |
| D1 | `chapter`/`part` thiếu hoặc sai kiểu; `title` còn tiền tố cũ |
| R1 | `related.js` trỏ id không tồn tại, tự trỏ, lặp, hoặc cùng lĩnh vực |
| N3 | `EXPECTED.counts` thiếu khoá cho lĩnh vực mới |

Ngoài kiểm tự động, kiểm bằng mắt sau chặng 6: mở app, chọn lĩnh vực WGJD, xác nhận sidebar có
đúng 4 mục, thư viện hiện 16 chương với nhãn "Ch. N · …", ảnh hiện đúng ở ít nhất ch.7 (14 ảnh,
nhiều nhất) và ch.3 (0 ảnh, không được vỡ), và thẻ Con đường trên dashboard hiện WGJD ở chặng 3
trên 6 của Java Backend.

## 10. Cập nhật tài liệu (chặng 6)

- `README.md` gốc: thêm dòng `sources/wgjd/` vào bảng nguồn, thêm WGJD vào đoạn liệt kê các bản
  dịch, cập nhật cây thư mục repo, và sửa "cả mười lĩnh vực" thành mười một.
- `sources/README.md`: thêm hàng `wgjd` vào "Bản đồ hiện tại".
- Số liệu sau đợt này: **11 lĩnh vực, 213 tài liệu, 18 track, 858 mục lộ trình.**

## 11. Ngoài phạm vi

| Việc | Vì sao không làm đợt này |
|---|---|
| Flashcards và trắc nghiệm cho `wgjd` | Sáu lĩnh vực sách hiện có đều chưa có; làm riêng cho WGJD sẽ lệch khuôn. |
| Dịch bổ sung ch.9 (Kotlin) và ch.10 (Clojure) | **Không có PDF gốc trong repo.** Đây là giới hạn cứng của nguồn, không phải quyết định hoãn. Nếu về sau có nguồn, id `wgjd-09`/`wgjd-10` đã được chừa sẵn. |
| Điền `part` cho 16 tài liệu | Không có bằng chứng tên các Phần trong repo (§1.3). |
| Sửa dữ liệu lĩnh vực khác | Chỉ đụng `related.js` và `PATHS.java.desc`; không đánh số lại hay sửa nội dung lĩnh vực nào khác. |
| Nối `wgjd` vào `bookCrossref` | Bảng đó phục vụ tuần giáo trình chứng chỉ Kubernetes; WGJD không thuộc con đường đó. |
