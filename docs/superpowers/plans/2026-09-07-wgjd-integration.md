# Tích hợp The Well-Grounded Java Developer — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *The Well-Grounded Java Developer* ấn bản 2 (16 chương) vào web app DevPrep thành lĩnh vực thứ 11 `wgjd`, kèm thư viện 16 tài liệu và lộ trình đọc 12 tuần / 48 mục.

**Architecture:** DevPrep là web app vanilla JS không build. Dữ liệu học tập là các module ES export mảng object thuần, gộp lại ở `webapp/js/data/docs-index.js` và `roadmap.js`. Nguồn markdown nằm ở `sources/<lĩnh vực>/`, được `build-content.sh` sao chép nguyên cây (trừ `*.pdf`) sang `webapp/content/` lúc chạy. Không có framework test; **`node webapp/scripts/check-data.mjs` là bộ test** — 49 bất biến chạy trong ~1 giây, và bảng `EXPECTED.counts` trong chính tệp đó là nơi khai số lượng bản ghi kỳ vọng. Vì thế vòng đỏ-xanh của kế hoạch này là: khai số kỳ vọng trước → chạy check thấy đỏ → viết dữ liệu → chạy check thấy xanh.

**Tech Stack:** JavaScript ES module (không transpile, không bundler), Node.js ≥ 18 để chạy `check-data.mjs`, Bash cho `build-content.sh`, Markdown cho nội dung nguồn.

**Spec:** [`docs/superpowers/specs/2026-09-07-wgjd-integration-design.md`](../specs/2026-09-07-wgjd-integration-design.md)

## Global Constraints

Mọi task đều phải tuân thủ, không nhắc lại ở từng task:

- **Không sửa một ký tự nội dung nào của 16 tệp markdown dịch.** Chỉ đổi tên tệp và di chuyển thư mục. Đường dẫn ảnh là tương đối theo tệp chứa; sửa nội dung sẽ gãy 93 tham chiếu.
- **Doc id giữ đúng số chương: `wgjd-01`…`wgjd-08`, `wgjd-11`…`wgjd-18`. Chừa trống `wgjd-09` và `wgjd-10`.** Id là khoá localStorage lưu tiến độ người dùng — đánh lại 01–16 sẽ khiến `wgjd-09` trỏ vào chương 11 và sai vĩnh viễn.
- **Id lộ trình: tuần `wg-w1`…`wg-w12`, mục `wg-w<N>-<M>`.** Cũng là khoá localStorage — không được đổi sau khi đã commit.
- **`part: null` cho cả 16 tài liệu.** Nguồn không có bằng chứng tên các Phần; quy ước repo cấm bịa.
- **Không suy đoán nội dung chương 9 (Kotlin) và chương 10 (Clojure).** Hai chương này không có trong bản dịch và không có PDF gốc. Được phép trỏ tới tài liệu chính thức bên ngoài, không được viết thay sách.
- **Mọi dữ liệu viết bằng tiếng Việt**, đồng giọng với `webapp/js/data/kafka/` và `ddia/`.
- **`docs[].file` luôn có dạng `content/wgjd/…`** (bất biến #2c), không phải `sources/wgjd/…`.
- **Cuối mỗi task, `node webapp/scripts/check-data.mjs` phải xanh** (49/49 hoặc hơn). Task nào để nó đỏ là task chưa xong.
- Lệnh kiểm chuẩn, chạy từ gốc repo:

  ```bash
  webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
  ```

---

## Bản đồ tệp

**Tạo mới:**

| Tệp | Trách nhiệm |
|---|---|
| `sources/wgjd/*.md` (16) | Nội dung dịch, chuyển từ `The Well-Grounded Java Developer/vi/` |
| `sources/wgjd/images/chNN/*` (93) | Ảnh, giữ nguyên bố cục |
| `sources/wgjd/pdf/*.pdf` (16) | PDF gốc, không vào bản deploy |
| `sources/wgjd/README.md` | Tác giả, ấn bản, bản quyền, phạm vi 16/18 chương |
| `webapp/js/data/wgjd/docs.js` | Danh mục 16 tài liệu |
| `webapp/js/data/wgjd/roadmap-part1.js` | Lộ trình tuần 1–6, 24 mục |
| `webapp/js/data/wgjd/roadmap-part2.js` | Lộ trình tuần 7–12, 24 mục |

**Sửa:**

| Tệp | Sửa gì |
|---|---|
| `webapp/js/data/fields.js` | Thêm `wgjd` vào `FIELDS`, thêm vào `FIELD_ORDER` |
| `webapp/js/data/paths.js` | Chèn `wgjd` vào `PATHS.java.fields`, sửa `PATHS.java.desc` |
| `webapp/js/data/docs-index.js` | Một dòng `import`, một dòng spread |
| `webapp/js/data/roadmap.js` | Hai dòng `import`, một object track, cập nhật chú thích đầu tệp |
| `webapp/js/data/guides.js` | `fieldGuides.wgjd`, `trackGuides.wgjd` |
| `webapp/js/data/related.js` | 10 khoá liên kết chéo |
| `webapp/scripts/check-data.mjs` | Hai khoá trong `EXPECTED.counts` |
| `README.md` | Bảng nguồn, đoạn liệt kê bản dịch, cây thư mục, số lĩnh vực |
| `sources/README.md` | Một hàng trong "Bản đồ hiện tại" |

**Xoá:** thư mục `The Well-Grounded Java Developer/` biến mất sau Task 1 (`git mv`, không `rm`).

---

## Task 1: Chuẩn hoá nguồn thành `sources/wgjd/`

**Files:**
- Create: `sources/wgjd/` (16 `.md`, `images/chNN/` 93 tệp, `pdf/` 16 tệp, `README.md`)
- Delete: `The Well-Grounded Java Developer/` (qua `git mv`)

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces: 16 đường dẫn `sources/wgjd/NN-slug.md` mà Task 2 khai vào `docs[].file` dưới dạng `content/wgjd/NN-slug.md`. Bảng slug ở Bước 2 là hợp đồng — Task 2 phải dùng đúng những tên này.

- [ ] **Bước 1: Xác nhận không nơi nào tham chiếu đường dẫn cũ**

```bash
grep -rn "The Well-Grounded Java Developer/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="The Well-Grounded Java Developer" .
```

Kỳ vọng: **không dòng nào**. Nếu có dòng nào, dừng lại và báo — nghĩa là có tham chiếu cứng phải sửa trước.

Dùng `--exclude-dir`, **không** dùng `grep -v "^./…"`: trên máy này `grep -r .` không thêm tiền tố `./`, nên bộ lọc dạng `^./` không ăn và cho cảm giác an toàn giả.

- [ ] **Bước 2: Di chuyển 16 tệp markdown và thư mục ảnh**

```bash
mkdir -p sources/wgjd
git mv "The Well-Grounded Java Developer/vi/images" sources/wgjd/images
for f in "The Well-Grounded Java Developer/vi/"ch*.md; do
  base=$(basename "$f")
  git mv "$f" "sources/wgjd/${base#ch}"
done
ls sources/wgjd/*.md | wc -l   # kỳ vọng: 16
```

`${base#ch}` bỏ đúng hai ký tự `ch` ở đầu, biến `ch01-introducing-modern-java.md` thành `01-introducing-modern-java.md`.

Kết quả phải đúng 16 tệp sau:

| `01-introducing-modern-java.md` | `02-java-modules.md` | `03-java-17.md` | `04-class-files-and-bytecode.md` |
|---|---|---|---|
| `05-java-concurrency-fundamentals.md` | `06-jdk-concurrency-libraries.md` | `07-understanding-java-performance.md` | `08-alternative-jvm-languages.md` |
| `11-building-with-gradle-and-maven.md` | `12-running-java-in-containers.md` | `13-testing-fundamentals.md` | `14-testing-beyond-junit.md` |
| `15-advanced-functional-programming.md` | `16-advanced-concurrent-programming.md` | `17-modern-internals.md` | `18-future-java.md` |

- [ ] **Bước 3: Di chuyển 16 PDF vào `pdf/` theo cùng slug**

```bash
mkdir -p sources/wgjd/pdf
declare -A SLUG=(
  [1]=01-introducing-modern-java          [2]=02-java-modules
  [3]=03-java-17                          [4]=04-class-files-and-bytecode
  [5]=05-java-concurrency-fundamentals    [6]=06-jdk-concurrency-libraries
  [7]=07-understanding-java-performance   [8]=08-alternative-jvm-languages
  [11]=11-building-with-gradle-and-maven  [12]=12-running-java-in-containers
  [13]=13-testing-fundamentals            [14]=14-testing-beyond-junit
  [15]=15-advanced-functional-programming [16]=16-advanced-concurrent-programming
  [17]=17-modern-internals                [18]=18-future-java
)
for f in "The Well-Grounded Java Developer/"*.pdf; do
  n=$(basename "$f" | sed 's/ .*//')
  git mv "$f" "sources/wgjd/pdf/${SLUG[$n]}.pdf"
done
ls sources/wgjd/pdf/*.pdf | wc -l   # kỳ vọng: 16
rmdir "The Well-Grounded Java Developer/vi" "The Well-Grounded Java Developer"
```

Chạy bằng `bash`, không `sh` — `declare -A` là mảng kết hợp của Bash.

- [ ] **Bước 4: Chạy kiểm toàn vẹn nguồn — kỳ vọng tất cả đạt**

```bash
cd sources/wgjd
echo "md:      $(ls *.md | wc -l)          (kỳ vọng 16)"
echo "pdf:     $(ls pdf/*.pdf | wc -l)     (kỳ vọng 16)"
echo "ảnh:     $(find images -type f | wc -l)  (kỳ vọng 93)"
echo "tham chiếu: $(grep -oh '!\[[^]]*\]([^)]*)' *.md | wc -l)  (kỳ vọng 93)"
gãy=0
for ref in $(grep -oh '!\[[^]]*\]([^)]*)' *.md | sed 's/.*(\(.*\))/\1/'); do
  [ -f "$ref" ] || { echo "GÃY: $ref"; gãy=$((gãy+1)); }
done
echo "ảnh gãy: $gãy  (kỳ vọng 0)"
cd -
```

Cả năm dòng phải khớp số kỳ vọng. Nếu `ảnh gãy` > 0 thì thư mục `images/` đã bị đặt sai chỗ — quay lại Bước 2.

- [ ] **Bước 5: Viết `sources/wgjd/README.md`**

```markdown
# The Well-Grounded Java Developer, ấn bản 2 — bản dịch tiếng Việt

Nguồn: *The Well-Grounded Java Developer, Second Edition* — Benjamin J. Evans, Jason Clark,
Martijn Verburg (Manning).

**Sách có bản quyền thương mại**, không phải giấy phép mở như CC BY 4.0. Bản dịch trong repo
này dùng cho mục đích học tập cá nhân.

## Phạm vi: 16/18 chương

| Ch. | Tệp | Tiêu đề |
|---:|---|---|
| 1 | `01-introducing-modern-java.md` | Giới thiệu về Java hiện đại |
| 2 | `02-java-modules.md` | Java modules |
| 3 | `03-java-17.md` | Java 17 |
| 4 | `04-class-files-and-bytecode.md` | Class file và bytecode |
| 5 | `05-java-concurrency-fundamentals.md` | Nền tảng lập trình đồng thời trong Java |
| 6 | `06-jdk-concurrency-libraries.md` | Thư viện concurrency của JDK |
| 7 | `07-understanding-java-performance.md` | Hiểu về hiệu năng Java |
| 8 | `08-alternative-jvm-languages.md` | Các ngôn ngữ JVM thay thế |
| 11 | `11-building-with-gradle-and-maven.md` | Build với Gradle và Maven |
| 12 | `12-running-java-in-containers.md` | Chạy Java trong container |
| 13 | `13-testing-fundamentals.md` | Nền tảng kiểm thử |
| 14 | `14-testing-beyond-junit.md` | Kiểm thử vượt ra ngoài JUnit |
| 15 | `15-advanced-functional-programming.md` | Lập trình hàm nâng cao |
| 16 | `16-advanced-concurrent-programming.md` | Lập trình đồng thời nâng cao |
| 17 | `17-modern-internals.md` | Nội tại hiện đại của JVM |
| 18 | `18-future-java.md` | Java trong tương lai |

## Chương 9 và 10 KHÔNG có trong bản dịch

Chương 9 (Kotlin) và chương 10 (Clojure) không thuộc phạm vi bản dịch, và repo **cũng không có
PDF gốc** của hai chương đó.

Đây không phải thiếu sót cần vá bằng cách đánh số lại: id tài liệu trong app giữ đúng số chương
sách (`wgjd-01`…`wgjd-08`, `wgjd-11`…`wgjd-18`), chừa trống `wgjd-09` và `wgjd-10`.

**Lưu ý khi đọc:** ba chương 14, 15 và 16 dựa vào hai chương vắng mặt này ở mức nội dung, không
chỉ nhắc tên — chương 14 chạy test qua REPL Clojure, chương 15 và 16 đọc mã Kotlin và Clojure
liên tục, và cả ba đều có câu dẫn ngược kiểu "như đã thấy ở chương 9". Lộ trình đọc trong app
dành tuần 6 cho việc tự bổ túc cú pháp cơ bản hai ngôn ngữ từ tài liệu chính thức trước khi tới
đó.

## Ảnh và PDF

93 ảnh trong `images/chNN/`, tham chiếu tương đối theo tệp markdown chứa chúng. Chương 3 không
có ảnh nào.

PDF gốc trong `pdf/`, **không** được đưa vào `webapp/content/`, bản deploy hay image Docker —
`build-content.sh` tự loại trừ `*.pdf`.
```

- [ ] **Bước 6: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **49/49 bất biến đạt**. Task này chưa đụng vào app nên số bất biến không đổi. Nếu đỏ thì có tệp nào đó ngoài `sources/wgjd/` bị `git mv` nhầm.

- [ ] **Bước 7: Commit**

```bash
git add -A sources/wgjd "The Well-Grounded Java Developer"
git commit -m "chore: chuẩn hoá nguồn The Well-Grounded Java Developer thành sources/wgjd/

16 chương markdown, 93 ảnh, 16 PDF. Nội dung giữ nguyên, chỉ đổi tên tệp
theo quy ước NN-slug.md và chuyển PDF vào pdf/. Viết mới README ghi tác giả,
bản quyền và việc chương 9-10 không có trong bản dịch."
```

---

## Task 2: Khai lĩnh vực `wgjd` và thư viện 16 tài liệu

**Files:**
- Create: `webapp/js/data/wgjd/docs.js`
- Modify: `webapp/js/data/fields.js`, `webapp/js/data/paths.js`, `webapp/js/data/docs-index.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: 16 đường dẫn `sources/wgjd/NN-slug.md` từ Task 1.
- Produces: 16 doc id `wgjd-01`…`wgjd-08`, `wgjd-11`…`wgjd-18` — Task 3–8 dùng chúng trong link `#/docs/wgjd-NN`, Task 10 dùng trong `related.js`. Lĩnh vực `wgjd` với `modules: ["dashboard", "guide", "docs"]` — Task 9 sẽ thêm `"roadmap"`.

- [ ] **Bước 1: Viết số kỳ vọng trước (bước "test đỏ")**

Trong `webapp/scripts/check-data.mjs`, thêm vào `EXPECTED.counts` ngay sau khối `spring-start`:

```js
    // Lĩnh vực The Well-Grounded Java Developer — 16 chương (1–8, 11–18);
    // chương 9 (Kotlin) và 10 (Clojure) không có trong bản dịch.
    "docs:wgjd": 16,
```

- [ ] **Bước 2: Chạy kiểm để thấy đỏ**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **ĐỎ**, đúng một lỗi:

```
  ✗ Số lượng bản ghi khớp bảng kỳ vọng
      docs:wgjd: kỳ vọng 16, thực tế 0
```

Nếu xanh thì bạn đã sửa nhầm tệp — `EXPECTED.counts` nằm ở đầu `check-data.mjs`, khoảng dòng 24.

- [ ] **Bước 3: Tạo `webapp/js/data/wgjd/docs.js`**

```js
// Tài liệu lĩnh vực "The Well-Grounded Java Developer" — 16 tài liệu.
// Nguồn markdown: sources/wgjd/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/wgjd/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` (số chương thật) và `part` (Phần trong sách / null): nhãn hiển thị
// sinh bởi labels.js ("Ch. 5 · Nền tảng lập trình đồng thời trong Java"),
// `title` chỉ còn tên chương (bất biến D1).
//
// Sách in có chia Phần, nhưng nguồn không có README và 16 PDF chương đều không
// mang nhãn Phần — không có bằng chứng trong repo, nên part null cho cả 16.
//
// Chương 9 (Kotlin) và 10 (Clojure) KHÔNG có trong bản dịch: id wgjd-09 và
// wgjd-10 chừa trống có chủ đích để số id luôn khớp số chương sách. Đánh lại
// 01–16 sẽ khiến wgjd-09 trỏ vào chương 11 — sai vĩnh viễn vì id là khoá
// localStorage lưu tiến độ.

export const docs = [
  {
    id: "wgjd-01",
    field: "wgjd",
    chapter: 1,
    part: null,
    title: "Giới thiệu về Java hiện đại",
    file: "content/wgjd/01-introducing-modern-java.md",
    icon: "🚀",
    desc: "Java là một ngôn ngữ hay một nền tảng, mô hình phát hành sáu tháng đổi cách bạn chọn phiên bản ra sao, và `var` giúp được gì mà không làm mất kiểu tĩnh.",
    tags: ["Platform", "Release model", "var"],
  },
  {
    id: "wgjd-02",
    field: "wgjd",
    chapter: 2,
    part: null,
    title: "Java modules",
    file: "content/wgjd/02-java-modules.md",
    icon: "🧩",
    desc: "Vì sao JDK phải tách thành module, `module-info` khai những gì, và ứng dụng của bạn có đáng modular hoá hay không.",
    tags: ["JPMS", "module-info", "Multi-release JAR"],
  },
  {
    id: "wgjd-03",
    field: "wgjd",
    chapter: 3,
    part: null,
    title: "Java 17",
    file: "content/wgjd/03-java-17.md",
    icon: "🆕",
    desc: "Bốn tính năng đổi cách viết Java hằng ngày — text block, switch expression, record, sealed type — cùng dạng mới của `instanceof` và pattern matching.",
    tags: ["Record", "Sealed type", "Pattern matching"],
  },
  {
    id: "wgjd-04",
    field: "wgjd",
    chapter: 4,
    part: null,
    title: "Class file và bytecode",
    file: "content/wgjd/04-class-files-and-bytecode.md",
    icon: "🔍",
    desc: "Một tệp `.class` chứa gì, class loader nạp nó theo thứ tự nào, và đọc bytecode bằng `javap` để thấy trình biên dịch thật sự sinh ra cái gì.",
    tags: ["Class loader", "Bytecode", "javap"],
  },
  {
    id: "wgjd-05",
    field: "wgjd",
    chapter: 5,
    part: null,
    title: "Nền tảng lập trình đồng thời trong Java",
    file: "content/wgjd/05-java-concurrency-fundamentals.md",
    icon: "🧵",
    desc: "Từ `synchronized` và `wait`/`notify` tới Java Memory Model — vì sao happens-before mới là thứ quyết định code đồng thời đúng hay sai.",
    tags: ["JMM", "synchronized", "happens-before"],
  },
  {
    id: "wgjd-06",
    field: "wgjd",
    chapter: 6,
    part: null,
    title: "Thư viện concurrency của JDK",
    file: "content/wgjd/06-jdk-concurrency-libraries.md",
    icon: "🧰",
    desc: "Atomic, Lock, CountDownLatch, ConcurrentHashMap, blocking queue, Future và executor — mỗi thứ giải bài toán nào và trả giá bằng gì.",
    tags: ["Atomic", "ExecutorService", "ConcurrentHashMap"],
  },
  {
    id: "wgjd-07",
    field: "wgjd",
    chapter: 7,
    part: null,
    title: "Hiểu về hiệu năng Java",
    file: "content/wgjd/07-understanding-java-performance.md",
    icon: "📈",
    desc: "Dùng đúng thuật ngữ hiệu năng, hiểu vì sao tinh chỉnh JVM khó, GC và JIT làm gì sau lưng bạn, và đo bằng JFR thay vì đoán.",
    tags: ["GC", "JIT", "JFR"],
  },
  {
    id: "wgjd-08",
    field: "wgjd",
    chapter: 8,
    part: null,
    title: "Các ngôn ngữ JVM thay thế",
    file: "content/wgjd/08-alternative-jvm-languages.md",
    icon: "🗺️",
    desc: "Phân loại ngôn ngữ trên JVM, tiêu chí chọn một ngôn ngữ không phải Java cho dự án thật, và JVM đỡ những ngôn ngữ đó bằng cách nào.",
    tags: ["Polyglot", "Kotlin", "Clojure"],
  },
  {
    id: "wgjd-11",
    field: "wgjd",
    chapter: 11,
    part: null,
    title: "Build với Gradle và Maven",
    file: "content/wgjd/11-building-with-gradle-and-maven.md",
    icon: "🏗️",
    desc: "Vì sao `javac` không đủ, vòng đời và POM của Maven, rồi DSL và task của Gradle — hai triết lý build khác nhau chứ không phải hai cú pháp.",
    tags: ["Maven", "Gradle", "POM"],
  },
  {
    id: "wgjd-12",
    field: "wgjd",
    chapter: 12,
    part: null,
    title: "Chạy Java trong container",
    file: "content/wgjd/12-running-java-in-containers.md",
    icon: "📦",
    desc: "Đóng gói ứng dụng Java bằng Docker, JVM nhận biết giới hạn cgroup ra sao, Kubernetes ở mức lập trình viên cần, và observability trong container.",
    tags: ["Docker", "Kubernetes", "Observability"],
  },
  {
    id: "wgjd-13",
    field: "wgjd",
    chapter: 13,
    part: null,
    title: "Nền tảng kiểm thử",
    file: "content/wgjd/13-testing-fundamentals.md",
    icon: "✅",
    desc: "Vì sao và kiểm thử thế nào, test-driven development, các loại test double, và những gì thực sự đổi khi lên JUnit 5.",
    tags: ["JUnit 5", "TDD", "Test double"],
  },
  {
    id: "wgjd-14",
    field: "wgjd",
    chapter: 14,
    part: null,
    title: "Kiểm thử vượt ra ngoài JUnit",
    file: "content/wgjd/14-testing-beyond-junit.md",
    icon: "🧪",
    desc: "Testcontainers cho integration test chạy trên hạ tầng thật, Spek cho kiểm thử theo đặc tả, và property-based testing. Chương đọc mã Kotlin và Clojure nhiều.",
    tags: ["Testcontainers", "Spek", "Property-based"],
  },
  {
    id: "wgjd-15",
    field: "wgjd",
    chapter: 15,
    part: null,
    title: "Lập trình hàm nâng cao",
    file: "content/wgjd/15-advanced-functional-programming.md",
    icon: "🔗",
    desc: "Các khái niệm FP đầy đủ, chỗ Java vướng khi làm ngôn ngữ hàm, và những gì Kotlin cùng Clojure làm được mà Java không.",
    tags: ["Immutability", "Lazy evaluation", "Currying"],
  },
  {
    id: "wgjd-16",
    field: "wgjd",
    chapter: 16,
    part: null,
    title: "Lập trình đồng thời nâng cao",
    file: "content/wgjd/16-advanced-concurrent-programming.md",
    icon: "⚡",
    desc: "Framework Fork/Join, chỗ concurrency gặp lập trình hàm, coroutine của Kotlin nhìn từ bytecode, và mô hình đồng thời của Clojure.",
    tags: ["Fork/Join", "Coroutine", "Clojure"],
  },
  {
    id: "wgjd-17",
    field: "wgjd",
    chapter: 17,
    part: null,
    title: "Nội tại hiện đại của JVM",
    file: "content/wgjd/17-modern-internals.md",
    icon: "⚙️",
    desc: "Các lệnh gọi phương thức, nội tại của reflection, method handle và `invokedynamic` — cơ chế lambda đứng trên — cùng `Unsafe` và các API thay thế được hỗ trợ.",
    tags: ["invokedynamic", "Method handle", "Unsafe"],
  },
  {
    id: "wgjd-18",
    field: "wgjd",
    chapter: 18,
    part: null,
    title: "Java trong tương lai",
    file: "content/wgjd/18-future-java.md",
    icon: "🔭",
    desc: "Amber, Panama, Loom và Valhalla — bốn dự án đang định hình Java — cùng những gì đã kịp tới trong Java 18.",
    tags: ["Loom", "Valhalla", "Panama"],
  },
];
```

- [ ] **Bước 4: Nối vào `docs-index.js`**

Thêm dòng import sau dòng `import { docs as springStart } …`:

```js
import { docs as wgjd } from "./wgjd/docs.js";
```

Và thêm `...wgjd,` vào cuối mảng, sau `...springStart,`.

- [ ] **Bước 5: Khai lĩnh vực trong `fields.js`**

Thêm vào object `FIELDS`, ngay sau khối `"spring-start"`:

```js
  wgjd: {
    label: "The Well-Grounded Java Developer",
    icon: "🧱",
    short: "WGJD",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt The Well-Grounded Java Developer, ấn bản 2 (Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning) — chương 1–8 và 11–18: Java hiện đại, module, class file và bytecode, JMM, thư viện concurrency, hiệu năng, Gradle/Maven, container, kiểm thử, lập trình hàm và concurrency nâng cao, nội tại JVM. Chương 9 (Kotlin) và 10 (Clojure) không nằm trong bản dịch.",
    certFilter: false,
    // Module "roadmap" mở ở Task 9, khi roadmap-part{1,2}.js đã có dữ liệu.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "docs.oracle.com — JVM Specification", href: "https://docs.oracle.com/javase/specs/" },
  },
```

Và chèn `"wgjd"` vào `FIELD_ORDER` ngay sau `"modern-java"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "wgjd", "ddia", "kafka", "modern-concurrency", "spring-start", "spring-security", "senior-java"];
```

- [ ] **Bước 6: Xếp lĩnh vực vào con đường trong `paths.js`**

Sửa khối `java` trong `PATHS` — cả `desc` lẫn `fields`:

```js
  java: {
    label: "Java Backend",
    icon: "☕",
    desc: "Một nghề, sáu chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM (bytecode, JMM, build, container) → khả năng mở rộng trên Tomcat → concurrency sau Loom → bảo mật. Lập trình hệ thống là nền tuỳ chọn cho ai muốn hiểu tới tầng kernel.",
    fields: ["spring-start", "modern-java", "wgjd", "java", "modern-concurrency", "spring-security"],
    foundation: ["sysprog"],
  },
```

- [ ] **Bước 7: Viết `fieldGuides.wgjd` trong `guides.js`**

Thêm vào object `fieldGuides`, sau khối `kafka`. `steps` **chưa** trỏ `#/roadmap/wgjd` vì track chưa tồn tại — bất biến #3c sẽ đỏ nếu trỏ sớm. Task 9 sẽ thay `wg-2` và `wg-3`.

```js
  wgjd: {
    tagline: "Đọc The Well-Grounded Java Developer ấn bản 2 — xuống dưới nắp JVM: bytecode, JMM, hiệu năng, build, container, kiểm thử.",
    audience: "Lập trình viên Java đã viết được ứng dụng thật và muốn hiểu tầng bên dưới thứ mình gõ hằng ngày. **Không phải sách nhập môn**: sách giả định bạn đọc được stack trace, biết Maven hoặc Gradle ở mức dùng được, và có một dự án thật để thử.",
    hoursPerWeek: "6–8 giờ/tuần · 12 tuần",
    prereqs: [
      "JDK 17 trở lên, và biết `javac`/`java` chạy từ dòng lệnh — nhiều chương yêu cầu gõ tay, không qua IDE.",
      "Một dự án Maven hoặc Gradle thật để áp dụng chương 11 và 12.",
      "Docker chạy được trên máy: chương 12 và phần Testcontainers của chương 14 cần nó.",
      "Chấp nhận rằng chương 9 (Kotlin) và 10 (Clojure) không có trong bản dịch — tuần 6 dành để tự bổ túc cú pháp cơ bản hai ngôn ngữ.",
    ],
    steps: [
      { id: "wg-1", title: "Dựng chỗ để gõ thử", desc: "Một dự án trống với JDK 17+, build được bằng cả Maven và Gradle, và Docker chạy được. Tự đánh dấu khi `javac -version` và `docker run hello-world` đều chạy.", done: { kind: "manual" } },
      { id: "wg-2", title: "Đọc chương 1–8: ngôn ngữ, JVM, concurrency, hiệu năng", desc: "Nửa đầu sách là phần mọi lập trình viên Java cần: module, Java 17, bytecode, JMM, thư viện concurrency, hiệu năng. Đánh dấu đã đọc từng chương.", href: "#/docs", done: { kind: "docs", readPct: 50 } },
      { id: "wg-3", title: "Đọc chương 11–18: build, container, kiểm thử, nâng cao", desc: "Nửa sau là phần công cụ và chuyên sâu. Chương 14–16 đọc mã Kotlin và Clojure nhiều — bổ túc cú pháp trước nếu thấy khó theo.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "wg-4", title: "Đọc được bytecode của chính mình", desc: "Lấy một class trong dự án của bạn, chạy `javap -c`, và giải thích được vì sao trình biên dịch sinh ra đúng những lệnh đó. Tự đánh dấu khi làm được mà không tra cứu.", done: { kind: "manual" } },
      { id: "wg-5", title: "Một phép đo hiệu năng có số liệu", desc: "Viết một benchmark JMH so hai cách hiện thực cùng một hàm, và kết luận chỉ dựa trên số đo — không dựa trên trực giác. Tự đánh dấu khi có kết quả trước/sau.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Gõ, đừng chỉ đọc", desc: "Sách này khác sách khái niệm: mỗi chương có thứ để chạy — `javap`, JMH, `module-info`, Dockerfile. Chương nào không gõ thì chương đó chưa đọc." },
      { title: "Nối xuống tầng dưới, nối lên tầng trên", desc: "Chương 5–7 là nền của series Java Scalability trong app; chương 16 và 18 là nền của Modern Concurrency in Java. Đọc chip liên kết chéo ở cuối mỗi tài liệu." },
      { title: "Chấp nhận đọc mã ngôn ngữ khác", desc: "Từ chương 14 trở đi sách đọc Kotlin và Clojure liên tục. Mục tiêu không phải viết được hai ngôn ngữ đó, mà là đọc hiểu đủ để theo lập luận của sách." },
    ],
    pitfalls: [
      "Bỏ chương 4 (bytecode) vì tưởng chỉ dành cho người viết compiler — đó là chương làm chương 5, 16 và 17 đọc được.",
      "Đọc chương 7 (hiệu năng) rồi đi tinh chỉnh cờ JVM ngay — sách dành cả chương để nói vì sao đo trước, chỉnh sau.",
      "Gặp mã Kotlin ở chương 14–16 rồi bỏ chương, vì tưởng mình thiếu kiến thức. Chương 9 và 10 không có trong bản dịch — đó là lỗ hổng của nguồn, không phải của bạn; tuần 6 của lộ trình có phần bổ túc.",
      "Đọc chương 11 mà không dựng thử cả Maven lẫn Gradle — hai công cụ này chỉ khác nhau ở chỗ bạn phải tự tay chạm vào.",
    ],
    doneWhen: [
      "Đọc `javap -c` của một method và nói được nó tương ứng với dòng Java nào.",
      "Giải thích được vì sao một đoạn code đồng thời sai, bằng ngôn ngữ của Java Memory Model chứ không bằng cảm giác.",
      "Dựng được cùng một dự án bằng cả Maven và Gradle, và nói được mỗi công cụ mạnh ở đâu.",
      "Đóng gói ứng dụng Java vào container mà JVM nhận đúng giới hạn CPU và bộ nhớ.",
    ],
  },
```

- [ ] **Bước 8: Chạy kiểm để thấy xanh**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **49/49 bất biến đạt** và dòng cuối in `Dữ liệu hợp lệ.` Số bất biến là cố định — thêm lĩnh vực không sinh thêm bất biến, chỉ thêm dữ liệu cho các bất biến sẵn có kiểm. Điều cần thấy là **không còn dòng ✗ nào**.

Nếu đỏ, đối chiếu bảng sau:

| Lỗi báo | Nguyên nhân |
|---|---|
| `docs:wgjd: kỳ vọng 16, thực tế 0` | Quên thêm dòng spread `...wgjd,` ở `docs-index.js` |
| `Mọi docs[].file tồn tại trên đĩa` | Quên chạy `build-content.sh`, hoặc slug tệp lệch bảng ở Task 1 Bước 2 |
| `PATHS phủ mọi lĩnh vực đúng một lần` | Quên chèn `"wgjd"` vào `PATHS.java.fields` |
| `Lĩnh vực khai module guide có fieldGuides` | Quên Bước 7 |
| `FIELD_ORDER khớp FIELDS 1-1` | Quên chèn `"wgjd"` vào `FIELD_ORDER` |

- [ ] **Bước 9: Commit**

```bash
git add webapp/js/data/wgjd/docs.js webapp/js/data/fields.js webapp/js/data/paths.js \
        webapp/js/data/docs-index.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -m "feat: khai lĩnh vực wgjd và 16 tài liệu The Well-Grounded Java Developer

Lĩnh vực thứ 11, xếp sau modern-java trên con đường Java Backend (nay sáu chặng).
Id giữ đúng số chương, chừa trống wgjd-09/10 vì chương Kotlin và Clojure
không có trong bản dịch. Module roadmap mở ở đợt sau khi đã có dữ liệu."
```

---

## Ghi chú chung cho Task 3–8 (viết lộ trình)

Sáu task này viết 48 mục lộ trình. Chúng chia sẻ toàn bộ quy ước dưới đây — đọc một lần, áp dụng cho cả sáu.

**Tệp và biến export:**

| Task | Tệp | Biến export | Tuần |
|---|---|---|---|
| 3, 4, 5 | `webapp/js/data/wgjd/roadmap-part1.js` | `wgjdWeeksPart1` | W1–W6 |
| 6, 7, 8 | `webapp/js/data/wgjd/roadmap-part2.js` | `wgjdWeeksPart2` | W7–W12 |

Task 3 tạo tệp part1 với đầu tệp + W1–W2; Task 4 và 5 nối thêm tuần vào cuối mảng. Tương tự với part2. **Các tệp này chưa được `roadmap.js` import cho tới Task 9** — nên `check-data.mjs` không nhìn thấy chúng, và mỗi task tự kiểm bằng script riêng ở bước cuối.

**Đầu tệp `roadmap-part1.js`** (Task 3 viết, Task 4–5 không sửa):

```js
// Lộ trình đọc The Well-Grounded Java Developer — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "The Well-Grounded Java Developer", ấn bản 2
// (Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning).
// Thư mục nguồn: sources/wgjd/ — bản dịch gồm chương 1–8 và 11–18; chương 9
// (Kotlin) và 10 (Clojure) không thuộc phạm vi và không có PDF gốc.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (wg-w<N> / wg-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const wgjdWeeksPart1 = [
```

Đầu tệp `roadmap-part2.js` giống hệt, đổi `Phần 1 (Tuần 1–6)` thành `Phần 2 (Tuần 7–12)` và tên biến thành `wgjdWeeksPart2`.

**Hình dạng một tuần:**

```js
  {
    id: "wg-w1",
    week: "Tuần 1",
    title: "…",
    goal: "…",
    practice: "…",
    resources: [
      { label: "WGJD 01 — Giới thiệu về Java hiện đại", href: "#/docs/wgjd-01" },
    ],
    items: [ /* đúng 4 mục */ ],
  },
```

**Hình dạng một mục:** `{ id, text, lesson }`. `lesson` là chuỗi template literal markdown gồm **đúng bốn khối, đúng thứ tự và đúng nhãn**:

```
**Mục tiêu.** …một câu, nói người đọc sẽ làm được gì sau mục này…

**Đọc.** …dẫn qua từng mục con của chương, mỗi mục con là một link [tên mục](#/docs/wgjd-NN), kèm chỉ dẫn đọc kỹ hay đọc lướt…

**Bẫy.** …hai cái bẫy CÓ THẬT trong chương, mỗi cái nói rõ sách cảnh báo gì…

**Tự kiểm tra.** …hai câu hỏi trả lời được sau khi đọc, không phải câu hỏi mẹo…
```

**Quy tắc bắt buộc khi viết `lesson`:**

1. **Đọc chương gốc trước khi viết.** Mở `sources/wgjd/NN-slug.md`, đọc đúng những mục con mà mục lộ trình phụ trách. Tên mục trong khối **Đọc** phải là tên mục **có thật** trong bản dịch — bảng "Mục con nguồn" ở mỗi task cho biết đọc mục nào.
2. **Không bịa số liệu, tên API, tên cờ JVM.** Mọi con số và định danh phải lấy từ chương.
3. **Bẫy phải là bẫy sách nói**, không phải kinh nghiệm chung chung của người viết.
4. Link luôn dạng `#/docs/wgjd-NN` — bất biến #3 kiểm id có thật, #3b kiểm cùng con đường.
5. Escape dấu backtick trong template literal bằng `\``, và dấu `$` trước `{` bằng `\$`.

**Ví dụ một mục viết đủ chuẩn** (đây là mục `wg-w2-4` thật, dùng làm khuôn cho 47 mục còn lại):

```js
      {
        id: "wg-w2-4",
        text: "Đọc bytecode bằng javap, và reflection",
        lesson: `**Mục tiêu.** Chạy được \`javap\` trên class của chính mình và đọc dãy lệnh bytecode như đọc mã nguồn — biết lệnh nào đẩy giá trị lên stack, lệnh nào gọi phương thức, và vì sao trình biên dịch chọn đúng lệnh đó.

**Đọc.** [4.4 Bytecode](#/docs/wgjd-04) là phần chính của mục này — đọc chậm, và với mỗi ví dụ trong sách thì tự dịch một class tương đương rồi chạy \`javap -c\` để đối chiếu. [4.5 Reflection](#/docs/wgjd-04) đọc sau, tập trung vào chỗ sách nối reflection với những gì bạn vừa thấy trong class file ở mục 4.3.

**Bẫy.** Đọc bytecode như đọc mã máy và cố nhớ từng opcode. Sách không đòi bạn thuộc bảng lệnh — nó đòi bạn nhận ra nhóm lệnh và ý nghĩa của nhóm. Bẫy thứ hai: tưởng reflection là một cơ chế tách rời; chương 17 sẽ quay lại chính chỗ này để cho thấy nó đứng trên cái gì.

**Tự kiểm tra.** Với một method cộng hai số nguyên rồi trả về, dãy bytecode gồm những lệnh nào và mỗi lệnh động vào stack ra sao? Và vì sao gọi một method qua reflection chậm hơn gọi trực tiếp?`,
      },
```

**Bước cuối chung cho Task 3–8** — script tự kiểm, thay `<PART>`, `<BIẾN>`, `<SỐ TUẦN>`, `<SỐ MỤC>`, `<TIỀN TỐ>` theo task:

```bash
node --input-type=module -e '
const m = await import("./webapp/js/data/wgjd/roadmap-<PART>.js");
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
    for (const ref of it.lesson.matchAll(/#\/docs\/([a-z0-9-]+)/g))
      if (!/^wgjd-(0[1-8]|1[1-8])$/.test(ref[1])) bad.push(`${it.id} link lạ: ${ref[1]}`);
  }
}
const dup = items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i);
if (dup.length) bad.push(`id trùng: ${dup}`);
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: <SỐ TUẦN> tuần, <SỐ MỤC> mục, id và khối hợp lệ");
process.exit(bad.length ? 1 : 0);
'
```

---

## Task 3: Lộ trình tuần 1–2 (ch.1, ch.2, ch.3, ch.4)

**Files:**
- Create: `webapp/js/data/wgjd/roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `wgjd-01`…`wgjd-04` từ Task 2.
- Produces: `export const wgjdWeeksPart1` — mảng tuần mà Task 4 và 5 nối thêm vào, và Task 9 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc bốn chương nguồn**

```bash
grep '^## ' sources/wgjd/0{1,2,3,4}-*.md
```

Đọc kỹ các mục con sẽ viết ở Bước 3. Không viết `lesson` trước khi đọc — mọi tên mục và cái bẫy phải lấy từ bản dịch.

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/wgjd/roadmap-part1.js` với khối chú thích đầu tệp và dòng `export const wgjdWeeksPart1 = [` như mô tả ở "Ghi chú chung", rồi đóng bằng `];`.

- [ ] **Bước 3: Viết tuần 1 và tuần 2**

**Tuần 1** — `id: "wg-w1"`, `week: "Tuần 1"`, `title: "Java là ngôn ngữ và là nền tảng; hệ thống module"`.

`goal`: Nắm được Java hiện đại khác Java 8 ở chỗ nào về mô hình phát hành và cú pháp, và hiểu module system giải quyết vấn đề gì trước khi quyết định có dùng nó hay không.

`practice`: Cài JDK 17 trở lên nếu chưa có, rồi viết một ứng dụng hai module — một module thư viện `export` đúng một package, một module ứng dụng `requires` nó — biên dịch và chạy bằng `javac`/`java` từ dòng lệnh, không qua IDE. Sau đó thử bỏ dòng `exports` đi và đọc thông báo lỗi trình biên dịch đưa ra.

`resources`: `{ label: "WGJD 01 — Giới thiệu về Java hiện đại", href: "#/docs/wgjd-01" }`, `{ label: "WGJD 02 — Java modules", href: "#/docs/wgjd-02" }`, `{ label: "openjdk.org — JDK Release Process", href: "https://openjdk.org/jeps/3" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w1-1` | Java là hai thứ: ngôn ngữ và nền tảng, và mô hình phát hành mới | ch.1 — 1.1 Ngôn ngữ và nền tảng; 1.2 Mô hình phát hành mới của Java |
| `wg-w1-2` | `var`, tính năng preview, và những thay đổi nhỏ trong Java 11 | ch.1 — 1.3 Suy diễn kiểu nâng cao (từ khóa `var`); 1.4 Thay đổi ngôn ngữ và nền tảng; 1.5 Những thay đổi nhỏ trong Java 11 |
| `wg-w1-3` | Vì sao có module: bối cảnh, cú pháp cơ bản, và cách nạp module | ch.2 — 2.1 Dựng bối cảnh; 2.2 Cú pháp module cơ bản; 2.3 Nạp module |
| `wg-w1-4` | Dựng ứng dụng modular đầu tiên và thiết kế kiến trúc module | ch.2 — 2.4 Xây dựng ứng dụng modular đầu tiên; 2.5 Thiết kế kiến trúc cho module; 2.6 Vượt ra ngoài module |

**Tuần 2** — `id: "wg-w2"`, `week: "Tuần 2"`, `title: "Cú pháp Java 17, và xuống tới class file cùng bytecode"`.

`goal`: Dùng được bốn tính năng cú pháp của Java 17 đúng chỗ, và đọc được bytecode của chính mã mình viết bằng `javap`.

`practice`: Viết một `record` có `sealed interface` cha và một `switch` biểu thức khớp trên các nhánh của nó. Biên dịch, rồi chạy `javap -c -p` trên class sinh ra và tìm cho ra: trình biên dịch đã sinh giúp bạn những method nào cho `record`, và `switch` biểu thức được dịch thành dãy lệnh gì.

`resources`: `{ label: "WGJD 03 — Java 17", href: "#/docs/wgjd-03" }`, `{ label: "WGJD 04 — Class file và bytecode", href: "#/docs/wgjd-04" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w2-1` | Text block và switch expression | ch.3 — 3.1 Text Blocks; 3.2 Switch Expressions |
| `wg-w2-2` | Record, sealed type, `instanceof` mới và pattern matching | ch.3 — 3.3 Records; 3.4 Sealed Types; 3.5 Dạng mới của `instanceof`; 3.6 Pattern Matching và các tính năng preview |
| `wg-w2-3` | Class loading, class loader và giải phẫu class file | ch.4 — 4.1 Class loading và các đối tượng Class; 4.2 Class loader; 4.3 Khảo sát class file |
| `wg-w2-4` | Đọc bytecode bằng `javap`, và reflection | ch.4 — 4.4 Bytecode; 4.5 Reflection |

Mục `wg-w2-4` đã được viết sẵn đầy đủ ở "Ghi chú chung" — chép nguyên vào tệp.

- [ ] **Bước 4: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`wgjdWeeksPart1`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **không dòng ✗ nào**. Tệp mới chưa được import nên `check-data.mjs` chưa nhìn thấy nó; bước này chỉ để chắc chắn bạn không lỡ tay sửa tệp khác.

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part1.js
git commit -m "feat: lộ trình đọc The Well-Grounded Java Developer tuần 1-2 — 8 mục"
```

---

## Task 4: Lộ trình tuần 3–4 (ch.5, ch.6)

**Files:**
- Modify: `webapp/js/data/wgjd/roadmap-part1.js`

**Interfaces:**
- Consumes: `wgjdWeeksPart1` từ Task 3; doc id `wgjd-05`, `wgjd-06`.
- Produces: cùng mảng, nay 4 tuần / 16 mục.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
grep '^## ' sources/wgjd/0{5,6}-*.md
```

- [ ] **Bước 2: Viết tuần 3 và tuần 4, nối vào cuối mảng**

**Tuần 3** — `id: "wg-w3"`, `week: "Tuần 3"`, `title: "Nền tảng concurrency và Java Memory Model"`.

`goal`: Giải thích được vì sao một đoạn code đồng thời sai bằng ngôn ngữ của Java Memory Model, chứ không bằng cảm giác "chắc do race condition".

`practice`: Viết một class có biến đếm được hai thread cùng tăng, chạy đủ lâu để thấy kết quả sai. Rồi sửa đúng ba lần — một lần bằng `synchronized`, một lần bằng `volatile` (và quan sát vì sao `volatile` **không** đủ cho phép cộng), một lần bằng lớp Atomic. Ghi lại lý do từng cách đúng hay sai theo happens-before.

`resources`: `{ label: "WGJD 05 — Nền tảng lập trình đồng thời trong Java", href: "#/docs/wgjd-05" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w3-1` | Lý thuyết concurrency và các khái niệm thiết kế | ch.5 — 5.1 Nhập môn lý thuyết concurrency; 5.2 Các khái niệm thiết kế |
| `wg-w3-2` | Block-structured concurrency trước Java 5 | ch.5 — 5.3 Block-structured concurrency (trước Java 5) |
| `wg-w3-3` | Java Memory Model | ch.5 — 5.4 Java Memory Model (JMM) |
| `wg-w3-4` | Nhìn concurrency qua bytecode | ch.5 — 5.5 Hiểu concurrency thông qua bytecode |

Mục `wg-w3-4` nối ngược về tuần 2: người đọc vừa học `javap` ở `wg-w2-4`, giờ dùng nó để thấy `synchronized` biến thành gì. Nhắc điều này trong khối **Mục tiêu**.

**Tuần 4** — `id: "wg-w4"`, `week: "Tuần 4"`, `title: "Thư viện concurrency của JDK"`.

`goal`: Chọn đúng công cụ đồng bộ cho từng bài toán thay vì mặc định dùng `synchronized` cho mọi thứ.

`practice`: Lấy đoạn code đếm ở tuần 3, viết lại bằng `ExecutorService` với một pool cố định, nộp tác vụ qua `Future`, và thay biến đếm bằng `AtomicLong`. Rồi đo thời gian chạy với pool 1, 4 và 16 thread trên máy bạn — và giải thích con số thu được.

`resources`: `{ label: "WGJD 06 — Thư viện concurrency của JDK", href: "#/docs/wgjd-06" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w4-1` | Khối xây dựng của ứng dụng đồng thời hiện đại, và các class Atomic | ch.6 — 6.1 Các khối xây dựng cho ứng dụng đồng thời hiện đại; 6.2 Các class Atomic |
| `wg-w4-2` | Class Lock và CountDownLatch | ch.6 — 6.3 Các class Lock; 6.4 CountDownLatch |
| `wg-w4-3` | Collection đồng thời: ConcurrentHashMap, CopyOnWriteArrayList, blocking queue | ch.6 — 6.5 ConcurrentHashMap; 6.6 CopyOnWriteArrayList; 6.7 Blocking queue |
| `wg-w4-4` | Future, tác vụ và thực thi | ch.6 — 6.8 Future; 6.9 Tác vụ và thực thi |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part1`, `<BIẾN>`=`wgjdWeeksPart1`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part1.js
git commit -m "feat: lộ trình đọc The Well-Grounded Java Developer tuần 3-4 — 8 mục"
```

---

## Task 5: Lộ trình tuần 5–6 (ch.7, ch.8 + bổ túc Kotlin/Clojure)

**Files:**
- Modify: `webapp/js/data/wgjd/roadmap-part1.js`

**Interfaces:**
- Consumes: `wgjdWeeksPart1` từ Task 4; doc id `wgjd-07`, `wgjd-08`.
- Produces: `wgjdWeeksPart1` hoàn chỉnh — **6 tuần / 24 mục**. Task 9 import biến này.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
grep '^## ' sources/wgjd/0{7,8}-*.md
```

- [ ] **Bước 2: Viết tuần 5 và tuần 6, nối vào cuối mảng**

**Tuần 5** — `id: "wg-w5"`, `week: "Tuần 5"`, `title: "Hiệu năng: đo trước, chỉnh sau"`.

`goal`: Đo được hiệu năng bằng số liệu thay vì trực giác, và biết GC cùng JIT đang làm gì sau lưng mình.

`practice`: Viết một benchmark JMH so hai cách hiện thực cùng một hàm — ví dụ nối chuỗi bằng `+` trong vòng lặp so với `StringBuilder`. Chạy đủ số vòng warmup, đọc kết quả, rồi bật JDK Flight Recorder cho một lần chạy và mở bản ghi ra xem. Kết luận chỉ được dựa trên số đo.

`resources`: `{ label: "WGJD 07 — Hiểu về hiệu năng Java", href: "#/docs/wgjd-07" }`, `{ label: "openjdk.org — JMH", href: "https://openjdk.org/projects/code-tools/jmh/" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w5-1` | Thuật ngữ hiệu năng, và một cách tiếp cận thực dụng | ch.7 — 7.1 Thuật ngữ hiệu năng: Một số định nghĩa cơ bản; 7.2 Một cách tiếp cận thực dụng với phân tích hiệu năng |
| `wg-w5-2` | Điều gì đã sai, và vì sao tinh chỉnh hiệu năng Java lại khó | ch.7 — 7.3 Điều gì đã sai? Vì sao chúng ta phải quan tâm?; 7.4 Vì sao tinh chỉnh hiệu năng Java lại khó? |
| `wg-w5-3` | Thu gom rác | ch.7 — 7.5 Thu gom rác (Garbage collection) |
| `wg-w5-4` | Biên dịch JIT với HotSpot, và JDK Flight Recorder | ch.7 — 7.6 Biên dịch JIT với HotSpot; 7.7 JDK Flight Recorder |

**Tuần 6** — `id: "wg-w6"`, `week: "Tuần 6"`, `title: "Ngôn ngữ JVM khác, và tự bổ túc Kotlin/Clojure"`.

`goal`: Đọc hiểu được mã Kotlin và Clojure ở mức theo được lập luận của sách từ chương 14 trở đi — không phải viết được hai ngôn ngữ đó.

`practice`: Chọn một class Java nhỏ trong dự án của bạn và viết lại bằng Kotlin, rồi viết lại một hàm thuần tuý bằng Clojure trong REPL. Mục tiêu duy nhất: quen mắt với cú pháp, đủ để không khựng khi gặp đoạn mã tương tự ở tuần 9–11.

`resources`: `{ label: "WGJD 08 — Các ngôn ngữ JVM thay thế", href: "#/docs/wgjd-08" }`, `{ label: "kotlinlang.org — Basic syntax", href: "https://kotlinlang.org/docs/basic-syntax.html" }`, `{ label: "clojure.org — Learn Clojure", href: "https://clojure.org/guides/learn/syntax" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w6-1` | Phân loại ngôn ngữ, và lập trình đa ngôn ngữ trên JVM | ch.8 — 8.1 Phân loại ngôn ngữ; 8.2 Lập trình đa ngôn ngữ trên JVM |
| `wg-w6-2` | Chọn ngôn ngữ không phải Java, và cách JVM hỗ trợ chúng | ch.8 — 8.3 Cách chọn một ngôn ngữ không phải Java cho dự án của bạn; 8.4 Cách JVM hỗ trợ các ngôn ngữ thay thế |
| `wg-w6-3` | Tự bổ túc Kotlin — bù chương 9 vắng mặt | **Không có chương nguồn.** Xem quy tắc riêng bên dưới. |
| `wg-w6-4` | Tự bổ túc Clojure — bù chương 10 vắng mặt | **Không có chương nguồn.** Xem quy tắc riêng bên dưới. |

**Quy tắc riêng cho `wg-w6-3` và `wg-w6-4`** — hai mục này là chỗ ghi lỗ hổng thứ ba theo spec §6.2:

- Khối **Đọc** trỏ ra tài liệu ngoài (`kotlinlang.org`, `clojure.org`), **không** trỏ `#/docs/wgjd-NN` nào — script tự kiểm chỉ chặn link `#/docs/` sai, không chặn link ngoài.
- Khối **Mục tiêu** phải nói thẳng: bản dịch không có chương 9 và 10, mục này bù phần cú pháp tối thiểu để đọc được chương 14, 15 và 16.
- Khối **Bẫy** nói về việc học quá sâu (mất tuần vào việc học trọn Kotlin) hoặc bỏ qua hẳn (rồi khựng ở tuần 9).
- **Không viết một dòng nào giả vờ tóm tắt nội dung chương 9 hay 10.**
- Nội dung cần cho Kotlin: `val`/`var`, hàm và hàm bậc cao, lambda cùng shorthand `it`, data class, null safety, `listOf`/`mapOf`.
- Nội dung cần cho Clojure: form và dấu ngoặc, immutability, `def`/`defn`/`let`, `(map)`/`(filter)`/`(reduce)`, REPL.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part1`, `<BIẾN>`=`wgjdWeeksPart1`, `<SỐ TUẦN>`=`6`, `<SỐ MỤC>`=`24`.

- [ ] **Bước 4: Xác nhận hai mục bổ túc không giả vờ có chương nguồn**

```bash
node --input-type=module -e '
const { wgjdWeeksPart1 } = await import("./webapp/js/data/wgjd/roadmap-part1.js");
const w6 = wgjdWeeksPart1.find(w => w.id === "wg-w6");
for (const id of ["wg-w6-3", "wg-w6-4"]) {
  const it = w6.items.find(x => x.id === id);
  const hasDocLink = /#\/docs\//.test(it.lesson);
  const saysGap = /chương 9|chương 10/i.test(it.lesson);
  console.log(`${id}: link tài liệu nội bộ=${hasDocLink} (phải false), nói rõ lỗ hổng=${saysGap} (phải true)`);
}'
```

Kỳ vọng: cả hai mục `link tài liệu nội bộ=false`, `nói rõ lỗ hổng=true`.

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part1.js
git commit -m "feat: lộ trình The Well-Grounded Java Developer tuần 5-6 — part1 đủ 24 mục

Tuần 6 nhẹ có chủ đích: chương 9 (Kotlin) và 10 (Clojure) không có trong
bản dịch, nên hai mục cuối tuần dành cho tự bổ túc cú pháp từ tài liệu
chính thức, đủ để đọc chương 14-16."
```

---

## Task 6: Lộ trình tuần 7–8 (ch.11, ch.12)

**Files:**
- Create: `webapp/js/data/wgjd/roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `wgjd-11`, `wgjd-12`.
- Produces: `export const wgjdWeeksPart2` — Task 7 và 8 nối thêm vào.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
grep '^## ' sources/wgjd/1{1,2}-*.md
```

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Như "Ghi chú chung", đổi tiêu đề thành `Phần 2 (Tuần 7–12)` và tên biến thành `wgjdWeeksPart2`.

- [ ] **Bước 3: Viết tuần 7 và tuần 8**

**Tuần 7** — `id: "wg-w7"`, `week: "Tuần 7"`, `title: "Build với Maven và Gradle"`.

`goal`: Dựng được cùng một dự án bằng cả hai công cụ, và nói được mỗi công cụ mạnh ở đâu thay vì chọn theo thói quen.

`practice`: Lấy một dự án nhỏ và viết cho nó cả `pom.xml` lẫn `build.gradle`. Cả hai phải build ra cùng một JAR chạy được, có ít nhất một thư viện phụ thuộc bên ngoài và một plugin chạy test. Ghi lại: mỗi công cụ mất bao nhiêu dòng cấu hình, và chỗ nào bạn phải tra tài liệu.

`resources`: `{ label: "WGJD 11 — Build với Gradle và Maven", href: "#/docs/wgjd-11" }`, `{ label: "maven.apache.org — Build Lifecycle", href: "https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html" }`, `{ label: "docs.gradle.org — User Manual", href: "https://docs.gradle.org/current/userguide/userguide.html" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w7-1` | Vì sao công cụ build quan trọng với lập trình viên vững nền tảng | ch.11 — 11.1 Vì sao công cụ build quan trọng với lập trình viên vững nền tảng |
| `wg-w7-2` | Maven: vòng đời build và POM | ch.11 — 11.2 Maven, nửa đầu (khái niệm, vòng đời, cấu trúc POM) |
| `wg-w7-3` | Maven: phụ thuộc, plugin và dự án đa module | ch.11 — 11.2 Maven, nửa sau (phụ thuộc, plugin, đa module) |
| `wg-w7-4` | Gradle: DSL, task và build script | ch.11 — 11.3 Gradle |

Mục `wg-w7-4` chạm vào chỗ sách nói build script Gradle viết được bằng Kotlin — nối ngược về phần bổ túc Kotlin ở `wg-w6-3`. Nhắc trong khối **Đọc**.

**Tuần 8** — `id: "wg-w8"`, `week: "Tuần 8"`, `title: "Java trong container"`.

`goal`: Đóng gói ứng dụng Java vào image mà JVM nhận đúng giới hạn CPU và bộ nhớ của container — và chứng minh được điều đó.

`practice`: Đóng gói ứng dụng của bạn vào một image Docker, chạy nó với `--cpus=2 --memory=512m`, rồi in ra `Runtime.getRuntime().availableProcessors()` và `maxMemory()` từ bên trong container. Đối chiếu hai con số đó với giới hạn bạn đặt.

`resources`: `{ label: "WGJD 12 — Chạy Java trong container", href: "#/docs/wgjd-12" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w8-1` | Vì sao container quan trọng, và nền tảng Docker | ch.12 — 12.1 Vì sao container quan trọng với lập trình viên vững nền tảng; 12.2 Nền tảng Docker |
| `wg-w8-2` | Phát triển ứng dụng Java với Docker | ch.12 — 12.3 Phát triển ứng dụng Java với Docker |
| `wg-w8-3` | Kubernetes ở mức lập trình viên Java cần | ch.12 — 12.4 Kubernetes |
| `wg-w8-4` | Observability và hiệu năng trong container | ch.12 — 12.5 Observability và hiệu năng |

- [ ] **Bước 4: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part2`, `<BIẾN>`=`wgjdWeeksPart2`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part2.js
git commit -m "feat: lộ trình đọc The Well-Grounded Java Developer tuần 7-8 — 8 mục"
```

---

## Task 7: Lộ trình tuần 9–10 (ch.13, ch.14, ch.15)

**Files:**
- Modify: `webapp/js/data/wgjd/roadmap-part2.js`

**Interfaces:**
- Consumes: `wgjdWeeksPart2` từ Task 6; doc id `wgjd-13`, `wgjd-14`, `wgjd-15`.
- Produces: cùng mảng, nay 4 tuần / 16 mục.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
grep '^## ' sources/wgjd/1{3,4,5}-*.md
```

Đây là ba chương đầu tiên đọc Kotlin và Clojure nhiều. Trước khi viết, đọc lại `wg-w6-3` và `wg-w6-4` để lời nhắc ở đây nhất quán với phần bổ túc.

- [ ] **Bước 2: Viết tuần 9 và tuần 10, nối vào cuối mảng**

**Tuần 9** — `id: "wg-w9"`, `week: "Tuần 9"`, `title: "Kiểm thử: từ nền tảng tới Testcontainers"`.

`goal`: Viết được integration test chạy trên hạ tầng thật thay vì mock, và biết khi nào mock là đúng.

`practice`: Thêm một integration test dùng Testcontainers vào dự án của bạn — dựng một PostgreSQL hoặc Redis thật trong container, chạy test trên đó, rồi để container tự dọn. So sánh cảm giác tin cậy với cùng test đó viết bằng mock.

`resources`: `{ label: "WGJD 13 — Nền tảng kiểm thử", href: "#/docs/wgjd-13" }`, `{ label: "WGJD 14 — Kiểm thử vượt ra ngoài JUnit", href: "#/docs/wgjd-14" }`, `{ label: "testcontainers.com — Getting started", href: "https://testcontainers.com/getting-started/" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w9-1` | Vì sao và kiểm thử thế nào; test-driven development | ch.13 — 13.1 Vì sao chúng ta kiểm thử; 13.2 Chúng ta kiểm thử thế nào; 13.3 Test-driven development |
| `wg-w9-2` | Test double, và chuyển từ JUnit 4 lên JUnit 5 | ch.13 — 13.4 Test double; 13.5 Từ JUnit 4 lên 5 |
| `wg-w9-3` | Integration testing với Testcontainers | ch.14 — 14.1 Integration testing với Testcontainers |
| `wg-w9-4` | Kiểm thử đặc tả với Spek, và property-based testing với Clojure | ch.14 — 14.2 Kiểm thử theo phong cách đặc tả với Spek và Kotlin; 14.3 Property-based testing với Clojure |

**Mục `wg-w9-4` phải ghi lỗ hổng.** Chương 14 nhắc Clojure 89 lần và nói thẳng *"giống như đã làm xuyên suốt chương 10. Nếu bạn bỏ qua chương đó… giờ là lúc tốt để ôn lại"* — mà chương 10 không có trong bản dịch. Khối **Bẫy** phải nói rõ điều này và trỏ ngược về `wg-w6-4`, không được lờ đi.

**Tuần 10** — `id: "wg-w10"`, `week: "Tuần 10"`, `title: "Lập trình hàm nâng cao"`.

`goal`: Biết Java làm được gì và vướng ở đâu khi viết theo lối hàm, và thấy hai ngôn ngữ khác giải cùng bài toán ra sao.

`practice`: Lấy một hàm trong dự án của bạn còn dùng vòng lặp và biến thay đổi trạng thái, viết lại theo lối hàm bằng Java. Ghi lại chỗ nào Java khiến bạn phải thoả hiệp — chính là những giới hạn mục 15.2 nói tới.

`resources`: `{ label: "WGJD 15 — Lập trình hàm nâng cao", href: "#/docs/wgjd-15" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w10-1` | Các khái niệm lập trình hàm | ch.15 — 15.1 Giới thiệu các khái niệm lập trình hàm |
| `wg-w10-2` | Giới hạn của Java như một ngôn ngữ hàm | ch.15 — 15.2 Giới hạn của Java như một ngôn ngữ FP |
| `wg-w10-3` | Lập trình hàm với Kotlin | ch.15 — 15.3 FP với Kotlin |
| `wg-w10-4` | Lập trình hàm với Clojure | ch.15 — 15.4 FP với Clojure |

**Mục `wg-w10-3` và `wg-w10-4` phải ghi lỗ hổng** trong khối **Bẫy**: chương 15 dẫn ngược về chương 9 và 10 sáu lần (shorthand `it`, `val`/`var`, `listOf`/`mapOf`, laziness, `(for)`, variadic). Trỏ về `wg-w6-3` và `wg-w6-4`.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part2`, `<BIẾN>`=`wgjdWeeksPart2`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Xác nhận ba mục có ghi lỗ hổng**

```bash
node --input-type=module -e '
const { wgjdWeeksPart2 } = await import("./webapp/js/data/wgjd/roadmap-part2.js");
const items = wgjdWeeksPart2.flatMap(w => w.items);
for (const id of ["wg-w9-4", "wg-w10-3", "wg-w10-4"]) {
  const it = items.find(x => x.id === id);
  console.log(`${id}: nhắc chương 9/10 = ${/chương (9|10)/i.test(it.lesson)} (phải true)`);
}'
```

Kỳ vọng: cả ba `true`.

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part2.js
git commit -m "feat: lộ trình The Well-Grounded Java Developer tuần 9-10 — 8 mục

Ba mục đọc Kotlin/Clojure nặng (wg-w9-4, wg-w10-3, wg-w10-4) ghi rõ lỗ hổng
chương 9-10 và trỏ ngược về phần bổ túc ở tuần 6."
```

---

## Task 8: Lộ trình tuần 11–12 (ch.16, ch.17, ch.18)

**Files:**
- Modify: `webapp/js/data/wgjd/roadmap-part2.js`

**Interfaces:**
- Consumes: `wgjdWeeksPart2` từ Task 7; doc id `wgjd-16`, `wgjd-17`, `wgjd-18`.
- Produces: `wgjdWeeksPart2` hoàn chỉnh — **6 tuần / 24 mục**. Cộng part1 là **48 mục**, con số Task 9 khai vào `EXPECTED.counts`.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
grep '^## ' sources/wgjd/1{6,7,8}-*.md
```

- [ ] **Bước 2: Viết tuần 11 và tuần 12, nối vào cuối mảng**

**Tuần 11** — `id: "wg-w11"`, `week: "Tuần 11"`, `title: "Concurrency nâng cao và nội tại JVM"`.

`goal`: Thấy được cơ chế đứng dưới những thứ bạn dùng hằng ngày — lambda dựa trên `invokedynamic`, coroutine dựa trên biến đổi bytecode.

`practice`: Tuần nặng nhất về nội dung, nên phần thực hành cố ý nhẹ: viết một lambda đơn giản, chạy `javap -c -p` và tìm cho ra lệnh `invokedynamic` cùng bootstrap method mà trình biên dịch sinh ra. Chỉ vậy thôi — đọc là chính.

`resources`: `{ label: "WGJD 16 — Lập trình đồng thời nâng cao", href: "#/docs/wgjd-16" }`, `{ label: "WGJD 17 — Nội tại hiện đại của JVM", href: "#/docs/wgjd-17" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w11-1` | Framework Fork/Join, và concurrency gặp lập trình hàm | ch.16 — 16.1 Framework Fork/Join; 16.2 Concurrency và lập trình hàm |
| `wg-w11-2` | Bên trong coroutine của Kotlin, và Clojure đồng thời | ch.16 — 16.3 Nhìn vào bên trong coroutine của Kotlin; 16.4 Clojure đồng thời |
| `wg-w11-3` | Gọi phương thức, nội tại reflection và method handle | ch.17 — 17.1 Giới thiệu nội tại JVM: Gọi phương thức; 17.2 Nội tại của reflection; 17.3 Method handles |
| `wg-w11-4` | Invokedynamic, Unsafe, và các API thay thế được hỗ trợ | ch.17 — 17.4 Invokedynamic; 17.5 Những thay đổi nội tại nhỏ; 17.6 Unsafe; 17.7 Thay thế Unsafe bằng các API được hỗ trợ |

**Mục `wg-w11-2` phải ghi lỗ hổng** trong khối **Bẫy**: chương 16 mở phần coroutine bằng *"Như đã giới thiệu ở chương 9"* và dựng ví dụ trên *"cái ta thấy ở chương 9"*. Trỏ về `wg-w6-3`.

**Tuần 12** — `id: "wg-w12"`, `week: "Tuần 12"`, `title: "Java tương lai, và tổng kết"`.

`goal`: Biết bốn dự án đang định hình Java sắp đổi những gì trong code của bạn, và chốt lại cả 12 tuần thành một thứ dùng được.

`practice`: Viết một ghi chú ngắn cho đội của bạn: ba thứ trong codebase hiện tại sẽ được lợi từ Loom, Valhalla, Amber hoặc Panama, và mỗi thứ cần thay đổi gì. Đây là bài kiểm tra thật của cả cuốn sách — nếu viết được, bạn đã đọc xong.

`resources`: `{ label: "WGJD 18 — Java trong tương lai", href: "#/docs/wgjd-18" }`, `{ label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `wg-w12-1` | Project Amber và Project Panama | ch.18 — 18.1 Project Amber; 18.2 Project Panama |
| `wg-w12-2` | Project Loom | ch.18 — 18.3 Project Loom |
| `wg-w12-3` | Project Valhalla, và Java 18 | ch.18 — 18.4 Project Valhalla; 18.5 Java 18 |
| `wg-w12-4` | Tổng kết: nối WGJD với chặng tiếp theo | **Không có chương nguồn** — mục tổng kết. |

**Quy tắc riêng cho `wg-w12-4`:** đây là mục capstone, không tóm tắt chương nào. Khối **Đọc** thay bằng việc đọc lại `resources` của chính lộ trình và ba tài liệu nối tiếp trên con đường Java Backend: `#/docs/java-04` (thread lifecycle), `#/docs/java-07` (pool sizing), `#/docs/modconc-02` (virtual thread) — cả ba đều cùng con đường nên bất biến #3b cho phép. Khối **Tự kiểm tra** hỏi lại hai câu xuyên suốt cuốn sách.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part2`, `<BIẾN>`=`wgjdWeeksPart2`, `<SỐ TUẦN>`=`6`, `<SỐ MỤC>`=`24`.

Lưu ý: script chặn mọi link `#/docs/` không khớp `wgjd-NN`. Mục `wg-w12-4` cố ý trỏ ra `java-04`, `java-07`, `modconc-02` — nên với **riêng Task 8**, sửa dòng kiểm link trong script thành:

```js
      if (!/^(wgjd-(0[1-8]|1[1-8])|java-0[47]|modconc-02)$/.test(ref[1])) bad.push(`${it.id} link lạ: ${ref[1]}`);
```

- [ ] **Bước 4: Đếm tổng hai phần — kỳ vọng đúng 48**

```bash
node --input-type=module -e '
const p1 = await import("./webapp/js/data/wgjd/roadmap-part1.js");
const p2 = await import("./webapp/js/data/wgjd/roadmap-part2.js");
const weeks = [...p1.wgjdWeeksPart1, ...p2.wgjdWeeksPart2];
const items = weeks.flatMap(w => w.items);
const ids = weeks.map(w => w.id).join(" ");
console.log(`tuần: ${weeks.length} (phải 12)`);
console.log(`mục:  ${items.length} (phải 48)`);
console.log(`thứ tự tuần: ${ids}`);
const expect = Array.from({length:12}, (_,i) => `wg-w${i+1}`).join(" ");
console.log(ids === expect ? "XANH: thứ tự tuần đúng" : `ĐỎ: phải là ${expect}`);'
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/wgjd/roadmap-part2.js
git commit -m "feat: lộ trình The Well-Grounded Java Developer tuần 11-12 — đủ 12 tuần / 48 mục"
```

---

## Task 9: Bật track `wgjd`

**Files:**
- Modify: `webapp/js/data/roadmap.js`, `webapp/js/data/fields.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `wgjdWeeksPart1` (Task 5) và `wgjdWeeksPart2` (Task 8) — tổng 12 tuần / 48 mục.
- Produces: track id `wgjd` — Task 10 không cần, nhưng `fieldGuides.wgjd.steps` trỏ vào nó, và người dùng vào được `#/roadmap/wgjd`.

Bốn thay đổi này **phải nằm cùng một task**: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, còn #7b chặn có dữ liệu mà chưa khai module. Tách ra là đỏ ở giữa.

- [ ] **Bước 1: Viết số kỳ vọng trước (bước "test đỏ")**

Trong `webapp/scripts/check-data.mjs`, thêm ngay dưới dòng `"docs:wgjd": 16,`:

```js
    "roadmap-items:wgjd": 48,
```

- [ ] **Bước 2: Chạy kiểm để thấy đỏ**

```bash
node webapp/scripts/check-data.mjs
```

Kỳ vọng: **ĐỎ**, đúng một lỗi:

```
  ✗ Số lượng bản ghi khớp bảng kỳ vọng
      roadmap-items:wgjd: kỳ vọng 48, thực tế 0
```

- [ ] **Bước 3: Import và đăng ký track trong `roadmap.js`**

Thêm hai dòng import sau `import { springStartWeeksPart2 } …`:

```js
import { wgjdWeeksPart1 } from "./wgjd/roadmap-part1.js";
import { wgjdWeeksPart2 } from "./wgjd/roadmap-part2.js";
```

Thêm object track vào cuối mảng `tracks`, trước các track `sj-gd*`:

```js
  {
    id: "wgjd",
    field: "wgjd",
    label: "Well-Grounded Java",
    icon: "🧱",
    name: "Đọc The Well-Grounded Java Developer (ấn bản 2)",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch 16 chương: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực hành gõ tay — đọc bytecode bằng javap, đo bằng JMH, dựng build Maven và Gradle, đóng gói image nhận đúng cgroup limit.",
    prereq: "Yêu cầu: viết được Java ở mức thành thạo và có một dự án Maven hoặc Gradle thật để áp dụng — đây không phải sách nhập môn. Bản dịch không có chương 9 (Kotlin) và chương 10 (Clojure); các tuần 9–11 đọc mã hai ngôn ngữ đó, nên tuần 6 có phần tự bổ túc cú pháp cơ bản trước khi tới đó.",
    weeks: [...wgjdWeeksPart1, ...wgjdWeeksPart2],
  },
```

Cập nhật khối chú thích đầu tệp — thêm hai dòng vào danh sách tệp:

```
//   wgjd/roadmap-part{1,2}.js               (Tuần 1–6 / 7–12)       — 48 mục
```

và thêm `wg-w1` vào danh sách tiền tố id trong đoạn "LƯU Ý", cùng `wg-w1-1` vào danh sách id mục.

- [ ] **Bước 4: Mở module `roadmap` trong `fields.js`**

```js
    modules: ["dashboard", "guide", "docs", "roadmap"],
```

Xoá luôn dòng chú thích `// Module "roadmap" mở ở Task 9…` đã viết ở Task 2 — nó không còn đúng.

- [ ] **Bước 5: Thêm `trackGuides.wgjd` trong `guides.js`**

Thêm vào object `trackGuides`, sau khối `"spring-start"`:

```js
  wgjd: {
    rhythm: "12 tuần, 4 mục mỗi tuần bám 16 chương; mỗi tuần một bài gõ tay trên máy thật. Đọc (40–60 phút) → gõ lại ví dụ → làm bài thực hành của tuần → trả lời tự kiểm tra → tick.",
    before: ["JDK 17 trở lên, gọi được `javac`, `java` và `javap` từ dòng lệnh.", "Một dự án Java thật để áp dụng chương build và chương container.", "Docker chạy được — tuần 8 và phần Testcontainers tuần 9 cần nó.", "Biết trước rằng chương 9 (Kotlin) và 10 (Clojure) không có trong bản dịch; tuần 6 dành để bù."],
    during: ["Mỗi chương có thứ để chạy — chương nào không gõ thì chương đó chưa đọc.", "Tuần 2 và tuần 11 dùng chung một công cụ: `javap -c`. Giữ lại output tuần 2 để đối chiếu ở tuần 11.", "Tuần 9–11 đọc mã Kotlin và Clojure liên tục: mở lại phần bổ túc tuần 6 thay vì bỏ chương."],
    after: ["Một ghi chú cho đội: ba chỗ trong codebase hiện tại sẽ được lợi từ Loom, Valhalla, Amber hoặc Panama.", "Sang lĩnh vực Java & Spring Boot Scalability — chặng tiếp theo trên con đường Java Backend.", "Đọc Modern Concurrency in Java để đi tiếp phần virtual thread mà chương 18 mới chỉ giới thiệu."],
  },
```

- [ ] **Bước 6: Trỏ `fieldGuides.wgjd.steps` vào track**

Thay hai step `wg-2` và `wg-3` đã viết ở Task 2 bằng:

```js
      { id: "wg-2", title: "Tuần 1–6: ngôn ngữ, JVM, concurrency, hiệu năng", desc: "Nửa đầu sách là phần mọi lập trình viên Java cần: module, Java 17, bytecode, JMM, thư viện concurrency, hiệu năng. Tuần 6 nhẹ, dành để bù cú pháp Kotlin và Clojure.", href: "#/roadmap/wgjd", done: { kind: "track", id: "wgjd", pct: 50 } },
      { id: "wg-3", title: "Tuần 7–12: build, container, kiểm thử, nâng cao", desc: "Nửa sau là phần công cụ và chuyên sâu. Tuần 11 nặng nhất — đọc là chính, thực hành cố ý nhẹ.", href: "#/roadmap/wgjd", done: { kind: "track", id: "wgjd" } },
```

- [ ] **Bước 7: Chạy kiểm để thấy xanh**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: **không dòng ✗ nào**, và `roadmap-items:wgjd` không còn báo lệch.

Nếu đỏ, đối chiếu:

| Lỗi báo | Nguyên nhân |
|---|---|
| `roadmap-items:wgjd: kỳ vọng 48, thực tế 0` | Quên thêm object track vào mảng `tracks` |
| `Mọi track có trackGuides` | Quên Bước 5 |
| `Mọi link #/roadmap/<trackId> trỏ tới track có thật` | Bước 6 chạy trước Bước 3 |
| `Lĩnh vực có dữ liệu roadmap thì phải khai module` | Quên Bước 4 |
| `Link #/docs/<id> trong lộ trình cùng lĩnh vực / cùng con đường` | Một mục trỏ sang lĩnh vực khác con đường — kiểm lại `wg-w12-4` |
| `Id mục lộ trình khớp tiền tố id tuần cha` | Có mục `wg-wN-M` nằm nhầm tuần |

- [ ] **Bước 8: Commit**

```bash
git add webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/guides.js \
        webapp/scripts/check-data.mjs
git commit -m "feat: bật lộ trình đọc The Well-Grounded Java Developer — 12 tuần / 48 mục

Track thứ 18 của app. Mở module roadmap cho lĩnh vực wgjd, thêm trackGuides
và trỏ hai step của fieldGuides vào track."
```

---

## Task 10: Liên kết chéo và cập nhật tài liệu

**Files:**
- Modify: `webapp/js/data/related.js`, `README.md`, `sources/README.md`

**Interfaces:**
- Consumes: 16 doc id từ Task 2; doc id có sẵn `mjia-*`, `java-*`, `modconc-*`, `springstart-15`.
- Produces: không có task nào sau đây.

- [ ] **Bước 1: Xác nhận 12 id đích đều có thật**

```bash
node --input-type=module -e '
const { docs } = await import("./webapp/js/data/docs-index.js");
const ids = new Set(docs.map(d => d.id));
const targets = ["mjia-14","java-04","modconc-01","java-06","java-07","modconc-03",
                 "mjia-07","springstart-15","mjia-18","mjia-19","modconc-02",
                 "modconc-04","java-05"];
const missing = targets.filter(t => !ids.has(t));
console.log(missing.length ? `ĐỎ: thiếu ${missing}` : "XANH: 13 id đích đều có thật");'
```

Kỳ vọng: **XANH**. Nếu thiếu id nào, dừng lại — nghĩa là dữ liệu lĩnh vực khác đã đổi kể từ khi viết spec.

- [ ] **Bước 2: Thêm khối liên kết chéo vào `related.js`**

Thêm vào cuối object `related`, trước dấu `};`:

```js
  // ---- The Well-Grounded Java Developer ↔ phần còn lại của con đường Java Backend ----
  "wgjd-02": ["mjia-14"],                                 // module system nhìn từ hai cuốn
  "wgjd-05": ["java-04", "modconc-01"],                   // JMM ↔ thread lifecycle, hành trình concurrency
  "wgjd-06": ["java-06", "java-07", "modconc-03"],        // thư viện pool ↔ TaskQueue Tomcat, sizing, ForkJoinPool
  "wgjd-07": ["java-07", "mjia-07"],                      // đo hiệu năng ↔ capacity planning, parallel stream
  "wgjd-12": ["java-07"],                                 // JVM trong container ↔ cgroup/CFS throttling
  "wgjd-14": ["springstart-15"],                          // kiểm thử ngoài JUnit ↔ kiểm thử ứng dụng Spring
  "wgjd-15": ["mjia-18", "mjia-19"],                      // FP nâng cao ↔ tư duy hàm, kỹ thuật lập trình hàm
  "wgjd-16": ["modconc-02", "modconc-04", "java-05"],     // coroutine ↔ virtual thread, structured concurrency
  "wgjd-17": ["modconc-03"],                              // invokedynamic, nội tại ↔ cơ chế concurrency hiện đại
  "wgjd-18": ["modconc-02", "java-05"],                   // Loom ↔ virtual thread
```

10 khoá, 18 liên kết. Không nối sang Kubernetes dù chương 12 nói về container: khác con đường, và nối một chiều mà lộ trình không nối được sẽ thành bất đối xứng khó hiểu (spec §2 quyết định #9).

- [ ] **Bước 3: Chạy kiểm — kỳ vọng xanh**

```bash
node webapp/scripts/check-data.mjs
```

Bất biến R1 kiểm: id có thật, khác lĩnh vực, không tự trỏ, không lặp. Kỳ vọng **không dòng ✗ nào**.

- [ ] **Bước 4: Cập nhật `sources/README.md`**

Thêm hàng vào bảng "Bản đồ hiện tại", sau hàng `spring-security`:

```markdown
| `wgjd` | `wgjd/` | Bản dịch *The Well-Grounded Java Developer* 2e (Evans, Clark, Verburg — Manning) — 16 chương (1–8, 11–18), 93 ảnh, PDF |
```

- [ ] **Bước 5: Cập nhật `README.md` gốc**

Bốn chỗ:

1. Cây thư mục repo — thêm `wgjd/` vào dòng liệt kê các lĩnh vực:

```
│   ├── sysprog/ · modern-java/ · wgjd/ · ddia/ · kafka/ · modern-concurrency/
```

2. Đoạn mở đầu mục "DevPrep — nền tảng học đa lĩnh vực" — thêm **bản dịch *The Well-Grounded Java Developer*** vào danh sách các bản dịch, và sửa **"cả mười lĩnh vực"** thành **"cả mười một lĩnh vực"**.

3. Thêm hàng vào bảng thành phần, sau hàng `sources/kafka/`:

```markdown
| [`sources/wgjd/`](./sources/wgjd/) | Bản dịch tiếng Việt *The Well-Grounded Java Developer*, ấn bản 2 (Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 16 chương (1–8, 11–18), 93 hình; chương 9 (Kotlin) và 10 (Clojure) không thuộc phạm vi bản dịch. Đọc trong app ở lĩnh vực The Well-Grounded Java Developer, kèm lộ trình đọc 12 tuần. |
```

4. Nếu README có nêu tổng số tài liệu hoặc số lĩnh vực ở chỗ nào khác, cập nhật theo số sau đợt này: **11 lĩnh vực, 213 tài liệu, 18 track, 858 mục lộ trình**. Tìm bằng:

```bash
grep -n "mười lĩnh vực\|10 lĩnh vực\|197\|810" README.md
```

- [ ] **Bước 6: Kiểm lần cuối, đầy đủ**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
node --input-type=module -e '
const d = await import("./webapp/js/data/docs-index.js");
const r = await import("./webapp/js/data/roadmap.js");
const { FIELDS } = await import("./webapp/js/data/fields.js");
const items = r.tracks.reduce((n,t)=>n+t.weeks.reduce((m,w)=>m+w.items.length,0),0);
console.log(`lĩnh vực: ${Object.keys(FIELDS).length} (phải 11)`);
console.log(`tài liệu: ${d.docs.length} (phải 213)`);
console.log(`track:    ${r.tracks.length} (phải 18)`);
console.log(`mục:      ${items} (phải 858)`);'
```

Cả bốn con số phải khớp, và `check-data.mjs` phải in `Dữ liệu hợp lệ.`

- [ ] **Bước 7: Kiểm bằng mắt trong app**

```bash
webapp/scripts/dev.sh
```

Mở trình duyệt và xác nhận sáu điều:

1. Bộ chọn lĩnh vực có **The Well-Grounded Java Developer** với icon 🧱, nằm sau Modern Java in Action.
2. Sidebar của lĩnh vực này có đúng 4 mục: Bảng điều khiển, Hướng dẫn học, Tài liệu, Lộ trình học.
3. Thư viện hiện **16 chương**, nhãn dạng "Ch. 1 · Giới thiệu về Java hiện đại", và **nhảy từ Ch. 8 sang Ch. 11**.
4. Mở tài liệu Ch. 7 — **14 ảnh** hiện đúng. Mở Ch. 3 — **không ảnh nào**, và trang không vỡ.
5. Lộ trình hiện **12 tuần**, tick thử một mục rồi tải lại trang: tiến độ còn nguyên.
6. Thẻ Con đường trên bảng điều khiển hiện WGJD ở **chặng 3 trên 6** của Java Backend.

- [ ] **Bước 8: Commit**

```bash
git add webapp/js/data/related.js README.md sources/README.md
git commit -m "feat: liên kết chéo WGJD và cập nhật tài liệu repo

18 liên kết từ 10 chương WGJD sang Modern Java in Action, Java Scalability,
Modern Concurrency và Spring Start Here — toàn bộ cùng con đường Java Backend.
Sau đợt này: 11 lĩnh vực, 213 tài liệu, 18 track, 858 mục lộ trình."
```
