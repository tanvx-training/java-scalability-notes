# Tích hợp Optimizing Cloud Native Java — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Optimizing Cloud Native Java, ấn bản 2* (đủ 15 chương) vào web app DevPrep thành lĩnh vực thứ 13 `ocnj`, kèm thư viện 15 tài liệu gom theo năm Phần và lộ trình đọc 12 tuần / 48 mục.

**Architecture:** DevPrep là SPA vanilla JS không build — dữ liệu học tập là các module ES export mảng object, và `webapp/scripts/check-data.mjs` là bộ 49 bất biến đóng vai trò test suite của toàn bộ dữ liệu. Đợt này thêm một lĩnh vực mới theo đúng khuôn 12 đợt tích hợp sách trước: chuẩn hoá nguồn vào `sources/ocnj/`, khai lĩnh vực trong `fields.js`, viết thư viện tài liệu và lộ trình đọc, rồi nối liên kết chéo. Mỗi task kết thúc bằng `check-data.mjs` xanh.

**Tech Stack:** ES modules (không transpile), Node 18+ để chạy `check-data.mjs`, bash cho `build-content.sh`. Không có framework, không có bước build, không có test runner ngoài `check-data.mjs`.

**Spec:** [`docs/superpowers/specs/2026-09-07-ocnj-integration-design.md`](../specs/2026-09-07-ocnj-integration-design.md)

## Global Constraints

- **Id là khoá localStorage — không bao giờ đổi sau khi commit.** Doc id `ocnj-01`…`ocnj-15`; week id `oc-w1`…`oc-w12`; item id `oc-w<N>-<M>`.
- **Doc id khớp số chương sách, liền mạch 01–15.** Bản dịch đủ 15 chương, không có lỗ hổng nào.
- **`part` PHẢI điền cho cả 15 tài liệu**, lấy nguyên năm chuỗi ở spec §5.1. Đây là điểm khác `wgjd`/`jcip` (hai lĩnh vực đó để `null`). Chép nguyên chuỗi kể cả số La Mã và dấu gạch ngang dài `—`.
- **Không sửa một ký tự nào trong 15 tệp markdown nguồn.** Chỉ đổi tên tệp và di chuyển thư mục.
- **Không suy đoán nội dung Phụ lục A (microbenchmarking) và Phụ lục B (danh mục antipattern)** vào bất kỳ đâu — hai phụ lục đó không có trong bộ nguồn.
- **Mọi con số, tên API, tên cờ JVM, tên mục trong lộ trình phải lấy từ bản dịch**, không từ trí nhớ về bản tiếng Anh.
- **Mỗi tuần đúng 4 mục.** 12 tuần × 4 = 48.
- **Sau mỗi task, `node webapp/scripts/check-data.mjs` phải in `49/49 bất biến đạt` (hoặc hơn) và không dòng `✗` nào.**
- **Chạy `build-content.sh` từ gốc repo**, không từ trong `webapp/` — đường dẫn đích là tương đối, chạy sai chỗ sẽ tạo `webapp/webapp/content/`.
- Nguồn: *Optimizing Cloud Native Java, 2nd Edition* — Benjamin J. Evans, James Gough, Chris Newland; O'Reilly. **Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.**

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `sources/ocnj/*.md` (15) | Bản dịch, đổi tên theo `NN-slug.md` | 1 |
| `sources/ocnj/images/chN/` (116 ảnh) | Ảnh, giữ nguyên bố cục `chN` không đệm 0 | 1 |
| `sources/ocnj/pdf/*.pdf` (15) | PDF gốc, không vào deploy | 1 |
| `sources/ocnj/README.md` | Tác giả, bản quyền, phạm vi, hai phụ lục vắng + mục lục cũ | 1 |
| `webapp/js/data/fields.js` | Khai lĩnh vực `ocnj` + `FIELD_ORDER` | 2, 9 |
| `webapp/js/data/paths.js` | Chèn `ocnj` vào con đường Java Backend (8 chặng) | 2 |
| `webapp/js/data/ocnj/docs.js` | 15 bản ghi thư viện tài liệu, có `part` | 2 |
| `webapp/js/data/docs-index.js` | Nối `ocnj/docs.js` vào mảng chung | 2 |
| `webapp/js/data/guides.js` | `fieldGuides.ocnj` với steps manual (Task 2); `trackGuides.ocnj` + viết lại steps trỏ track (Task 9) | 2, 9 |
| `webapp/js/data/ocnj/roadmap-part1.js` | Tuần 1–6, 24 mục | 3, 4, 5 |
| `webapp/js/data/ocnj/roadmap-part2.js` | Tuần 7–12, 24 mục | 6, 7, 8 |
| `webapp/js/data/roadmap.js` | Đăng ký track `ocnj` | 9 |
| `webapp/js/data/related.js` | 15 khoá liên kết chéo | 10 |
| `webapp/scripts/check-data.mjs` | `EXPECTED.counts` cho `ocnj` | 2, 9 |
| `README.md`, `sources/README.md` | Tài liệu repo | 10 |

Không tệp nào khác được sửa. Nếu một task khiến bạn muốn sửa view (`webapp/js/views/`) hay `build-content.sh`, dừng lại — đó là dấu hiệu làm sai khuôn.

---

## Task 1: Chuẩn hoá nguồn thành `sources/ocnj/`

**Files:**
- Move: `Optimizing Cloud Native Java/` → `sources/ocnj/` (nội dung `vi/` nâng lên một cấp)
- Modify: `sources/ocnj/README.md` (từ `vi/README.md`, thêm phần đầu)

**Interfaces:**
- Consumes: không gì (task đầu tiên).
- Produces: 15 tệp `sources/ocnj/NN-slug.md` mà Task 2 trỏ tới qua `file: "content/ocnj/NN-slug.md"`; 116 ảnh ở `sources/ocnj/images/chN/`.

- [ ] **Bước 1: Xác nhận không ai tham chiếu đường dẫn cũ**

```bash
grep -rn "Optimizing Cloud Native Java/" --exclude-dir=.git --exclude-dir=docs --exclude-dir=content --exclude-dir="Optimizing Cloud Native Java" .
```

Kỳ vọng: **không dòng nào**. Dấu `/` cuối mẫu chỉ bắt tham chiếu đường dẫn, không bắt tên sách trong văn xuôi. Loại trừ `content/` vì đó là ảnh gương do `build-content.sh` sinh. Nếu có dòng nào, dừng và báo — spec giả định con số này là 0.

- [ ] **Bước 2: Tạo thư mục và di chuyển 15 tệp markdown**

Tên nguồn có **chữ hoa và dấu**; tên đích **chữ thường không dấu**. Trên macOS hệ tệp không phân biệt hoa thường, nên `git mv` giữa hai tên chỉ khác hoa thường sẽ hỏng — ở đây mọi tên đều khác nhau nhiều hơn thế nên an toàn.

```bash
mkdir -p sources/ocnj/pdf
git mv "Optimizing Cloud Native Java/vi/01-Dinh-nghia-Toi-uu-hoa-va-Hieu-nang.md" sources/ocnj/01-dinh-nghia-toi-uu-hoa-va-hieu-nang.md
git mv "Optimizing Cloud Native Java/vi/02-Phuong-phap-luan-Kiem-thu-Hieu-nang.md" sources/ocnj/02-phuong-phap-luan-kiem-thu-hieu-nang.md
git mv "Optimizing Cloud Native Java/vi/03-Tong-quan-ve-JVM.md" sources/ocnj/03-tong-quan-ve-jvm.md
git mv "Optimizing Cloud Native Java/vi/04-Tim-hieu-Garbage-Collection.md" sources/ocnj/04-tim-hieu-garbage-collection.md
git mv "Optimizing Cloud Native Java/vi/05-Garbage-Collection-Nang-cao.md" sources/ocnj/05-garbage-collection-nang-cao.md
git mv "Optimizing Cloud Native Java/vi/06-Thuc-thi-Ma-tren-JVM.md" sources/ocnj/06-thuc-thi-ma-tren-jvm.md
git mv "Optimizing Cloud Native Java/vi/07-Phan-cung-va-He-dieu-hanh.md" sources/ocnj/07-phan-cung-va-he-dieu-hanh.md
git mv "Optimizing Cloud Native Java/vi/08-Thanh-phan-cua-Cloud-Stack.md" sources/ocnj/08-thanh-phan-cua-cloud-stack.md
git mv "Optimizing Cloud Native Java/vi/09-Trien-khai-Java-tren-Cloud.md" sources/ocnj/09-trien-khai-java-tren-cloud.md
git mv "Optimizing Cloud Native Java/vi/10-Gioi-thieu-ve-Observability.md" sources/ocnj/10-gioi-thieu-ve-observability.md
git mv "Optimizing Cloud Native Java/vi/11-Trien-khai-Observability-trong-Java.md" sources/ocnj/11-trien-khai-observability-trong-java.md
git mv "Optimizing Cloud Native Java/vi/12-Profiling.md" sources/ocnj/12-profiling.md
git mv "Optimizing Cloud Native Java/vi/13-Ky-thuat-Hieu-nang-Dong-thoi.md" sources/ocnj/13-ky-thuat-hieu-nang-dong-thoi.md
git mv "Optimizing Cloud Native Java/vi/14-Ky-thuat-va-Mau-hinh-He-phan-tan.md" sources/ocnj/14-ky-thuat-va-mau-hinh-he-phan-tan.md
git mv "Optimizing Cloud Native Java/vi/15-Hieu-nang-Hien-dai-va-Tuong-lai.md" sources/ocnj/15-hieu-nang-hien-dai-va-tuong-lai.md
```

- [ ] **Bước 3: Di chuyển ảnh và README của người dịch**

```bash
git mv "Optimizing Cloud Native Java/vi/images" sources/ocnj/images
git mv "Optimizing Cloud Native Java/vi/README.md" sources/ocnj/README.md
```

- [ ] **Bước 4: Di chuyển 15 PDF, ghép theo SỐ CHƯƠNG**

Tên PDF gốc là **tiếng Anh**, chương một chữ số **không** đệm 0 (`1. …`), còn slug đích là **tiếng Việt** và **có** đệm 0. Ghép theo số chương, không theo thứ tự `ls` (vốn xếp `10.` ngay sau `1.`).

```bash
git mv "Optimizing Cloud Native Java/1. Optimization and Performance Defined _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/01-dinh-nghia-toi-uu-hoa-va-hieu-nang.pdf
git mv "Optimizing Cloud Native Java/2. Performance Testing Methodology _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/02-phuong-phap-luan-kiem-thu-hieu-nang.pdf
git mv "Optimizing Cloud Native Java/3. Overview of the JVM _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/03-tong-quan-ve-jvm.pdf
git mv "Optimizing Cloud Native Java/4. Understanding Garbage Collection _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/04-tim-hieu-garbage-collection.pdf
git mv "Optimizing Cloud Native Java/5. Advanced Garbage Collection _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/05-garbage-collection-nang-cao.pdf
git mv "Optimizing Cloud Native Java/6. Code Execution on the JVM _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/06-thuc-thi-ma-tren-jvm.pdf
git mv "Optimizing Cloud Native Java/7. Hardware and Operating Systems _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/07-phan-cung-va-he-dieu-hanh.pdf
git mv "Optimizing Cloud Native Java/8. Components of the Cloud Stack _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/08-thanh-phan-cua-cloud-stack.pdf
git mv "Optimizing Cloud Native Java/9. Deploying Java in the Cloud _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/09-trien-khai-java-tren-cloud.pdf
git mv "Optimizing Cloud Native Java/10. Introduction to Observability _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/10-gioi-thieu-ve-observability.pdf
git mv "Optimizing Cloud Native Java/11. Implementing Observability in Java _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/11-trien-khai-observability-trong-java.pdf
git mv "Optimizing Cloud Native Java/12. Profiling _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/12-profiling.pdf
git mv "Optimizing Cloud Native Java/13. Concurrent Performance Techniques _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/13-ky-thuat-hieu-nang-dong-thoi.pdf
git mv "Optimizing Cloud Native Java/14. Distributed Systems Techniques and Patterns _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/14-ky-thuat-va-mau-hinh-he-phan-tan.pdf
git mv "Optimizing Cloud Native Java/15. Modern Performance and The Future _ Optimizing Cloud Native Java, 2nd Edition.pdf" sources/ocnj/pdf/15-hieu-nang-hien-dai-va-tuong-lai.pdf
```

- [ ] **Bước 5: Xác nhận thư mục cũ đã biến mất và bố cục mới đúng**

```bash
test ! -d "Optimizing Cloud Native Java" && echo "OK: thư mục cũ đã biến mất" || { echo "ĐỎ: còn sót:"; find "Optimizing Cloud Native Java" -type f; }
echo "md: $(ls sources/ocnj/[0-9]*.md | wc -l | tr -d ' ') (kỳ vọng 15)"
echo "pdf: $(ls sources/ocnj/pdf/*.pdf | wc -l | tr -d ' ') (kỳ vọng 15)"
echo "ảnh: $(find sources/ocnj/images -type f | wc -l | tr -d ' ') (kỳ vọng 116)"
```

- [ ] **Bước 6: Kiểm toàn vẹn ảnh — 116 tham chiếu, 0 gãy, 0 mồ côi**

Dùng mẫu khớp đúng cú pháp markdown. Một `grep` tham lam dạng `images/[^)]*` sẽ bắt cả những lần văn bản nhắc đường dẫn trong dấu backtick và cho ra số "ảnh gãy" giả.

```bash
cd sources/ocnj
refs=$(grep -ohE '!\[[^]]*\]\(images/[^)]+\)' [0-9]*.md | wc -l | tr -d ' ')
echo "tham chiếu: $refs (kỳ vọng 116)"
grep -ohE '!\[[^]]*\]\((images/[^)]+)\)' [0-9]*.md | sed -E 's/.*\((images\/[^)]+)\)/\1/' | sort -u > /tmp/ocnj-refs.txt
find images -type f | sort > /tmp/ocnj-files.txt
echo "gãy (tham chiếu không có tệp):"; comm -23 /tmp/ocnj-refs.txt /tmp/ocnj-files.txt
echo "mồ côi (tệp không ai tham chiếu):"; comm -13 /tmp/ocnj-refs.txt /tmp/ocnj-files.txt
cd -
```

Kỳ vọng: `tham chiếu: 116`, cả hai danh sách rỗng.

- [ ] **Bước 7: Xác nhận mỗi tệp có đúng một H1 thật**

Các dòng `# ` thừa ở ch.8, 9, 11, 14 nằm trong khối mã (chú thích YAML/Dockerfile/Prometheus). Script dưới đây đếm ngoài khối mã — **đừng "sửa" các dòng trong khối mã**.

```bash
for f in sources/ocnj/[0-9]*.md; do
  n=$(awk '/^```/{fence=!fence} !fence && /^# /{c++} END{print c+0}' "$f")
  [ "$n" = "1" ] || echo "ĐỎ: $f có $n H1 ngoài khối mã"
done; echo "xong (không dòng ĐỎ nào là đạt)"
```

- [ ] **Bước 8: Viết lại `sources/ocnj/README.md`**

Tệp hiện tại là mục lục do người dịch viết (15 chương theo năm Phần + phần "Ghi chú về bản dịch"). **Giữ nguyên toàn bộ phần mục lục và ghi chú đó**, chỉ thay khối tiêu đề đầu tệp bằng khối dưới đây, và sửa dòng đường dẫn ảnh trong "Ghi chú về bản dịch" từ `images/chN/fig-N-M.png` cho khớp bố cục thật nếu tên tệp khác.

Khối mới đặt ngay sau dòng H1, trước mục `## Mục lục`:

```markdown
# Tối ưu hóa Java Cloud Native (Ấn bản 2)

Bản dịch tiếng Việt của *Optimizing Cloud Native Java, 2nd Edition* — Benjamin J. Evans,
James Gough, Chris Newland (O'Reilly).

> **Bản quyền.** Đây là sách thương mại có bản quyền, **không** phải giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Chương | 15 (1–15, đủ, không thiếu chương nào) |
| Hình | 116, trong `images/chN/` (một chữ số, không đệm 0) |
| PDF gốc | 15, trong `pdf/` — `build-content.sh` không sao chép `*.pdf` vào bản deploy |
| Trong app | Lĩnh vực **Optimizing Cloud Native Java**, kèm lộ trình đọc 12 tuần / 48 mục |

**Hai phụ lục không có trong bộ nguồn.** Phụ lục A (microbenchmarking và JMH) và Phụ lục B
(danh mục antipattern) không nằm trong bộ PDF gốc, nên không có bản dịch. Các tham chiếu chéo
tới chúng trong 15 chương được giữ nguyên. Lỗ hổng này đã được đo là **nhẹ**: tổng cộng 7 lần
nhắc (2 lần tới Phụ lục A ở ch.2 và ch.13, 5 lần tới Phụ lục B ở ch.2, ch.4 và ch.12), và
không chương nào phụ thuộc vào chúng để đọc hiểu được. Sách **cố ý** đẩy microbenchmarking ra
khỏi phần thân — ch.2 nói rõ điều đó. Lộ trình đọc bù phần này bằng
[JMH](https://github.com/openjdk/jmh) ở tuần 1.
```

- [ ] **Bước 9: Chạy build-content và kiểm dữ liệu — phải vẫn xanh**

Chạy từ **gốc repo**:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng: `49/49 bất biến đạt` và `Dữ liệu hợp lệ.` Số markdown trong dòng `✓ content:` tăng từ 238 lên **253**, số ảnh từ 1088 lên **1204**.

- [ ] **Bước 10: Commit**

```bash
git add -A sources/ocnj "Optimizing Cloud Native Java" 2>/dev/null; git add -A
git commit -m "feat(ocnj): chuẩn hoá nguồn Optimizing Cloud Native Java vào sources/ocnj/

15 chương bản dịch đổi tên theo NN-slug.md (slug tiếng Việt không dấu, khuôn
ddia), 116 ảnh giữ nguyên bố cục images/chN/, 15 PDF vào pdf/ ghép theo số
chương. README bổ sung tác giả, bản quyền thương mại và ghi rõ Phụ lục A/B
không có trong bộ nguồn (7 tham chiếu, đã đo là nhẹ).

Chưa đụng web app."
```

---

## Task 2: Khai lĩnh vực `ocnj` và thư viện 15 tài liệu

**Files:**
- Modify: `webapp/js/data/fields.js`, `webapp/js/data/paths.js`, `webapp/js/data/docs-index.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`
- Create: `webapp/js/data/ocnj/docs.js`

**Interfaces:**
- Consumes: 15 tệp `sources/ocnj/NN-slug.md` từ Task 1.
- Produces: doc id `ocnj-01`…`ocnj-15` mà Task 3–8 trỏ tới qua `#/docs/ocnj-NN` và Task 10 nối trong `related.js`; `FIELDS.ocnj` mà Task 9 mở thêm module `roadmap`.

- [ ] **Bước 1: Khai lĩnh vực trong `fields.js`**

Thêm khối này vào `FIELDS`, đặt **ngay sau khối `jcip`** (cuối object, trước dấu `};`):

```js
  ocnj: {
    label: "Optimizing Cloud Native Java",
    icon: "📈",
    short: "OCNJ",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt Optimizing Cloud Native Java, ấn bản 2 (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly) — đủ 15 chương: hệ phân loại hiệu năng và cách đọc đồ thị, phương pháp luận kiểm thử và thống kê phi chuẩn, nội tại JVM (classloading, JIT, quản lý bộ nhớ), garbage collection từ mark-and-sweep tới G1/Shenandoah/ZGC, thực thi mã và AOT/GraalVM, phần cứng và mechanical sympathy, cloud stack và triển khai Java trên Kubernetes, observability với Micrometer/Prometheus/OpenTelemetry, profiling với JFR và Async Profiler, kỹ thuật hiệu năng đồng thời, mẫu hình hệ phân tán, và Panama/Leyden/Valhalla. Phụ lục A (microbenchmarking) và B (danh mục antipattern) không có trong bộ nguồn.",
    certFilter: false,
    // Module "roadmap" mở ở Task 9 khi đã có dữ liệu lộ trình — khai sớm là
    // bất biến #7 báo đỏ.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "docs.oracle.com — HotSpot GC Tuning Guide", href: "https://docs.oracle.com/en/java/javase/21/gctuning/" },
  },
```

Rồi sửa `FIELD_ORDER` — chèn `"ocnj"` ngay sau `"jcip"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "wgjd", "jcip", "ocnj", "ddia", "kafka", "modern-concurrency", "spring-start", "spring-security", "senior-java"];
```

- [ ] **Bước 2: Chèn `ocnj` vào con đường Java Backend trong `paths.js`**

Trong `PATHS.java`, sửa **hai** trường. `fields` thêm `"ocnj"` giữa `"jcip"` và `"java"`:

```js
    fields: ["spring-start", "modern-java", "wgjd", "jcip", "ocnj", "java", "modern-concurrency", "spring-security"],
```

`desc` hiện viết "Một nghề, bảy chặng…" — thay nguyên chuỗi bằng:

```js
    desc: "Một nghề, tám chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM (bytecode, JMM, build, container) → nền concurrency cổ điển (thread safety, lock, AQS, JMM) → đo và tối ưu trên cloud (GC, JIT, observability, profiling) → khả năng mở rộng trên Tomcat → concurrency sau Loom → bảo mật. Lập trình hệ thống là nền tuỳ chọn cho ai muốn hiểu tới tầng kernel.",
```

Quên bước này là bất biến P1 báo đỏ ngay (`ocnj` phải xuất hiện đúng một lần trong `PATHS ∪ SPINE`).

- [ ] **Bước 3: Viết `webapp/js/data/ocnj/docs.js`**

Tạo thư mục `webapp/js/data/ocnj/` rồi viết tệp. Nội dung đầy đủ:

```js
// Tài liệu lĩnh vực "Optimizing Cloud Native Java" — 15 tài liệu.
// Nguồn markdown: sources/ocnj/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/ocnj/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` giữ ĐÚNG số chương sách: 1–15, liền mạch, bản dịch đủ chương.
// `part` điền được vì README nguồn (sources/ocnj/README.md) ghi rõ tên và ranh
// giới năm Phần — khác wgjd/jcip phải để null. Chép nguyên chuỗi, kể cả số La Mã.

export const docs = [
  {
    id: "ocnj-01",
    field: "ocnj",
    chapter: 1,
    part: "Phần I — Nền tảng hiệu năng",
    title: "Định nghĩa về Tối ưu hóa và Hiệu năng",
    file: "content/ocnj/01-dinh-nghia-toi-uu-hoa-va-hieu-nang.md",
    icon: "📏",
    desc: "Vì sao tối ưu Java theo trực giác gần như luôn sai, và vì sao hiệu năng phải được đối xử như một khoa học thực nghiệm. Bảy đại lượng quan sát được — throughput, latency, capacity, utilization, efficiency, scalability, degradation — cùng mối tương quan giữa chúng, cách đọc các dạng đồ thị hiệu năng, và những gì đổi khác khi hệ chạy trên cloud.",
    tags: ["Latency", "Throughput", "Hệ phân loại"],
  },
  {
    id: "ocnj-02",
    field: "ocnj",
    chapter: 2,
    part: "Phần I — Nền tảng hiệu năng",
    title: "Phương pháp luận Kiểm thử Hiệu năng",
    file: "content/ocnj/02-phuong-phap-luan-kiem-thu-hieu-nang.md",
    icon: "🧪",
    desc: "Bảy loại kiểm thử hiệu năng (latency, throughput, stress, load, endurance, capacity planning, degradation) và cách đặt chúng vào SDLC theo hướng top-down. Nguyên nhân xã hội và nhận thức sinh ra antipattern, thống kê phi chuẩn với đuôi dài, các loại sai số, và bốn thiên kiến khiến kỹ sư đo ra đúng thứ họ mong đợi.",
    tags: ["Load test", "Phân vị", "Antipattern"],
  },
  {
    id: "ocnj-03",
    field: "ocnj",
    chapter: 3,
    part: "Phần II — Nội tại JVM",
    title: "Tổng quan về JVM",
    file: "content/ocnj/03-tong-quan-ve-jvm.md",
    icon: "🗺️",
    desc: "Bức tranh toàn cảnh trước khi đào sâu: classloading và thông dịch, cách bytecode được thực thi, kiến trúc HotSpot, vì sao JIT tồn tại, mô hình quản lý bộ nhớ của JVM, luồng và Java Memory Model, bộ công cụ giám sát đi kèm JDK, và cách chọn giữa các bản phân phối cùng chu kỳ phát hành Java.",
    tags: ["HotSpot", "Bytecode", "JIT"],
  },
  {
    id: "ocnj-04",
    field: "ocnj",
    chapter: 4,
    part: "Phần II — Nội tại JVM",
    title: "Tìm hiểu về Garbage Collection",
    file: "content/ocnj/04-tim-hieu-garbage-collection.md",
    icon: "🗑️",
    desc: "Mark and sweep cùng bảng thuật ngữ GC, biểu diễn object lúc runtime và GC root trong HotSpot, allocation và lifetime dẫn tới giả thuyết thế hệ yếu, thread-local allocation buffer, thu gom bán cầu, bố cục heap cổ điển, các parallel collector và giới hạn của chúng — và vì sao tốc độ allocation là biến số quan trọng nhất.",
    tags: ["Mark and sweep", "TLAB", "Parallel GC"],
  },
  {
    id: "ocnj-05",
    field: "ocnj",
    chapter: 5,
    part: "Phần II — Nội tại JVM",
    title: "Garbage Collection nâng cao",
    file: "content/ocnj/05-garbage-collection-nang-cao.md",
    icon: "♻️",
    desc: "Đánh đổi giữa các collector cắm được và lý thuyết GC đồng thời: safepoint, đánh dấu ba màu, forwarding pointer. Rồi từng collector một — G1 (region, mixed collection, remembered set, cờ cấu hình), Shenandoah (concurrent evacuation), ZGC, Balanced của OpenJ9 (object header, NUMA) — và hai collector ngách CMS cùng Epsilon.",
    tags: ["G1", "ZGC", "Safepoint"],
  },
  {
    id: "ocnj-06",
    field: "ocnj",
    chapter: 6,
    part: "Phần II — Nội tại JVM",
    title: "Thực thi mã trên JVM",
    file: "content/ocnj/06-thuc-thi-ma-tren-jvm.md",
    icon: "⚙️",
    desc: "Vòng đời một ứng dụng Java từ lúc gõ lệnh chạy tới lúc mã trở nên nóng. Thông dịch bytecode và các chi tiết riêng của HotSpot, biên dịch JIT dẫn hướng bằng profile, klass word và vtable, các trình biên dịch của HotSpot, code cache, cách đọc log biên dịch và tinh chỉnh JIT đơn giản — rồi hướng đi AOT với Quarkus và GraalVM.",
    tags: ["JIT", "Code cache", "GraalVM"],
  },
  {
    id: "ocnj-07",
    field: "ocnj",
    chapter: 7,
    part: "Phần II — Nội tại JVM",
    title: "Phần cứng và Hệ điều hành",
    file: "content/ocnj/07-phan-cung-va-he-dieu-hanh.md",
    icon: "🔩",
    desc: "Tầng dưới mà JVM ngồi lên: bộ nhớ và các mức cache, translation lookaside buffer, dự đoán rẽ nhánh và thực thi suy đoán, mô hình bộ nhớ phần cứng. Rồi hệ điều hành — bộ lập lịch, quan hệ giữa JVM và OS, chi phí context switch — và một mô hình hệ thống đơn giản để suy luận về CPU, GC và I/O theo tinh thần mechanical sympathy.",
    tags: ["Cache", "Context switch", "Mechanical sympathy"],
  },
  {
    id: "ocnj-08",
    field: "ocnj",
    chapter: 8,
    part: "Phần III — Cloud Native",
    title: "Các thành phần của Cloud Stack",
    file: "content/ocnj/08-thanh-phan-cua-cloud-stack.md",
    icon: "📦",
    desc: "Các chuẩn Java cho cloud stack và bức tranh Cloud Native Computing Foundation, ảo hóa cùng cách chọn đúng máy ảo, cấu trúc image và cách xây image, cách chạy container, các vấn đề mạng — và phần giới thiệu ví dụ Fighting Animals mà chương 9 và 14 sẽ dựng tiếp.",
    tags: ["CNCF", "Container", "Fighting Animals"],
  },
  {
    id: "ocnj-09",
    field: "ocnj",
    chapter: 9,
    part: "Phần III — Cloud Native",
    title: "Triển khai Java trên Cloud",
    file: "content/ocnj/09-trien-khai-java-tren-cloud.md",
    icon: "🚢",
    desc: "Làm việc cục bộ bằng Docker Compose và Tilt, rồi orchestration với Kubernetes — Deployment, chia sẻ trong Pod, vòng đời container và pod, Service và cách kết nối trên cluster, phát triển remocal. Blue/green, canary và feature flagging. Cuối cùng là hai mối lo riêng của Java: container với GC, và bộ nhớ với OOME.",
    tags: ["Kubernetes", "Canary", "Container và GC"],
  },
  {
    id: "ocnj-10",
    field: "ocnj",
    chapter: 10,
    part: "Phần IV — Observability và Profiling",
    title: "Giới thiệu về Observability",
    file: "content/ocnj/10-gioi-thieu-ve-observability.md",
    icon: "🔭",
    desc: "Observability là gì và vì sao cần tới nó. Ba trụ cột metrics, logs, traces — kèm câu hỏi profiling có phải trụ cột thứ tư. Mẫu hình kiến trúc cho metric, instrumentation thủ công so với tự động, hai antipattern phổ biến, sáu dạng sự cố hệ phân tán (split-brain, thundering herd, lỗi dây chuyền, lỗi kết hợp…), và lựa chọn giữa giải pháp nhà cung cấp hay OSS.",
    tags: ["Ba trụ cột", "Antipattern", "Chẩn đoán"],
  },
  {
    id: "ocnj-11",
    field: "ocnj",
    chapter: 11,
    part: "Phần IV — Observability và Profiling",
    title: "Triển khai Observability trong Java",
    file: "content/ocnj/11-trien-khai-observability-trong-java.md",
    icon: "📡",
    desc: "Micrometer từ meter và registry tới counter, gauge, meter filter, timer, distribution summary và runtime metric. Kiến trúc Prometheus nhìn từ phía lập trình viên Java. OpenTelemetry — OTLP và Collector — rồi tracing thủ công, tracing tự động và lấy mẫu trace, cùng OTel metrics và logs trong Java.",
    tags: ["Micrometer", "Prometheus", "OpenTelemetry"],
  },
  {
    id: "ocnj-12",
    field: "ocnj",
    chapter: 12,
    part: "Phần IV — Observability và Profiling",
    title: "Profiling",
    file: "content/ocnj/12-profiling.md",
    icon: "🔥",
    desc: "Profiling khác đo lường ở chỗ nào. Công cụ GUI VisualVM và JDK Mission Control, thiên lệch safepoint khi lấy mẫu, các profiler hiện đại perf và Async Profiler, JDK Flight Recorder. Khía cạnh vận hành — dùng JFR trong production, Red Hat Cryostat, JFR với OTel profiling, cách chọn profiler — và memory profiling với allocation profiling cùng heap dump.",
    tags: ["JFR", "Async Profiler", "Heap dump"],
  },
  {
    id: "ocnj-13",
    field: "ocnj",
    chapter: 13,
    part: "Phần V — Đồng thời và Phân tán",
    title: "Kỹ thuật hiệu năng đồng thời",
    file: "content/ocnj/13-ky-thuat-hieu-nang-dong-thoi.md",
    icon: "🧵",
    desc: "Định luật Amdahl đặt trần cho mọi nỗ lực song song hóa. Concurrency Java nền tảng và Java Memory Model, rồi cách các thư viện được xây từ bên dưới: method handle và var handle, atomic và CAS, lock và spinlock. Tóm lược java.util.concurrent (read/write lock, semaphore, concurrent collection, latch và barrier), Executor, Fork/Join và parallel stream, kỹ thuật dựa trên actor, và virtual thread.",
    tags: ["Amdahl", "CAS", "Virtual thread"],
  },
  {
    id: "ocnj-14",
    field: "ocnj",
    chapter: 14,
    part: "Phần V — Đồng thời và Phân tán",
    title: "Kỹ thuật và Mẫu hình cho Hệ phân tán",
    file: "content/ocnj/14-ky-thuat-va-mau-hinh-he-phan-tan.md",
    icon: "🕸️",
    desc: "Clock, ID và write-ahead log, two-phase commit, object serialization, phân vùng và nhân bản dữ liệu, định lý CAP. Hai giao thức đồng thuận Paxos và Raft. Ba hệ thật minh họa: cơ sở dữ liệu phân tán Cassandra, in-memory data grid Infinispan, event streaming Kafka — rồi nâng cấp Fighting Animals bằng Kafka thành một service bệnh viện chủ động.",
    tags: ["CAP", "Raft", "Kafka"],
  },
  {
    id: "ocnj-15",
    field: "ocnj",
    chapter: 15,
    part: "Phần V — Đồng thời và Phân tán",
    title: "Hiệu năng hiện đại và Tương lai",
    file: "content/ocnj/15-hieu-nang-hien-dai-va-tuong-lai.md",
    icon: "🔮",
    desc: "Hai mẫu hình concurrency mới: structured concurrency và scoped values. Ba dự án đang định hình JVM — Panama, Leyden (image, ràng buộc, condenser và premain), Valhalla — và chương kết luận của sách.",
    tags: ["Structured concurrency", "Leyden", "Valhalla"],
  },
];
```

- [ ] **Bước 4: Nối vào `docs-index.js`**

Thêm dòng import cạnh các import khác (giữ thứ tự khớp `FIELD_ORDER`, đặt sau `jcip`):

```js
import { docs as ocnj } from "./ocnj/docs.js";
```

Và thêm `...ocnj,` vào mảng, ngay sau `...jcip,`.

- [ ] **Bước 5: Thêm `fieldGuides.ocnj` vào `guides.js`**

Đặt sau khối `fieldGuides.jcip`. Ở task này `steps` **chưa trỏ track** (track chưa tồn tại — bất biến G3 kiểm `href` phải hợp lệ); Task 9 sẽ viết lại.

```js
  ocnj: {
    tagline: "Đọc Optimizing Cloud Native Java — đo trước, tối ưu sau: hệ phân loại hiệu năng, GC, JIT, phần cứng, observability, profiling và hệ phân tán.",
    audience: "Lập trình viên Java đã có một ứng dụng thật đang chạy và muốn biết vì sao nó nhanh hay chậm — bằng số đo, không bằng linh cảm. **Không phải sách dạy Java**: nó giả định bạn viết được ứng dụng rồi, và dạy cách quan sát nó.",
    hoursPerWeek: "6–8 giờ/tuần · 12 tuần",
    prereqs: [
      "Một ứng dụng Java hoặc Spring Boot thật chạy được — bạn cần cái gì đó để đo, mọi tuần đều đo trên nó.",
      "JDK 17 trở lên; tốt nhất JDK 21+ vì chương 13 và 15 dùng virtual thread, structured concurrency và scoped values.",
      "Docker chạy được: chương 8, 9 và 11 dựng container, Docker Compose và ngăn xếp Prometheus/OpenTelemetry.",
      "Đọc được stack trace và biết `jcmd`, `jstack` nằm ở đâu trong JDK.",
      "Chấp nhận rằng Phụ lục A (microbenchmarking) và Phụ lục B (danh mục antipattern) không có trong bộ nguồn; phần microbenchmarking được bù bằng JMH ở tuần 1.",
    ],
    steps: [
      { id: "oc-1", title: "Chọn ứng dụng để đo và dựng chỗ chạy tải", desc: "Một ứng dụng Java thật của bạn, cộng một cách sinh tải lặp lại được (script curl, k6, JMeter — cái nào cũng được). Tự đánh dấu khi bạn chạy được cùng một kịch bản tải hai lần và ra kết quả tương đương.", done: { kind: "manual" } },
      { id: "oc-2", title: "Đọc Phần I trước khi chỉnh bất cứ thứ gì", desc: "Chương 1–2 dạy bảy đại lượng và cách đo chúng cho đúng. Đây là hai chương duy nhất bảo vệ bạn khỏi việc chỉnh cờ JVM theo cảm giác. Tự đánh dấu khi bạn báo cáo được p99 thay vì trung bình.", done: { kind: "manual" } },
      { id: "oc-3", title: "Đọc Phần II — xuống dưới nắp JVM", desc: "Chương 3–7: JVM, hai chương garbage collection, thực thi mã và JIT, rồi phần cứng cùng hệ điều hành. Đây là phần dày nhất và cũng là phần trả lời nhiều câu hỏi hiệu năng nhất. Tự đánh dấu khi bạn đọc được một tệp GC log mà không tra cứu.", done: { kind: "manual" } },
      { id: "oc-4", title: "Đọc Phần III và IV — chạy trên cloud rồi quan sát nó", desc: "Chương 8–9 đóng gói và triển khai; chương 10–12 dựng observability và profiling. Tự đánh dấu khi ứng dụng của bạn chạy trong container có giới hạn bộ nhớ và bạn xem được metric của nó trên Prometheus.", done: { kind: "manual" } },
      { id: "oc-5", title: "Đọc Phần V và quay lại đo ứng dụng của bạn", desc: "Chương 13–15: concurrency, hệ phân tán, và hướng đi tương lai của JVM. Rồi lặp lại phép đo ở bước 1 và so với con số ban đầu — nếu không có chênh lệch nào giải thích được, đó chính là phát hiện.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Đo trước, đọc sau, chỉnh cuối cùng", desc: "Mỗi tuần bắt đầu bằng một phép đo trên ứng dụng thật của bạn, rồi mới đọc chương giải thích con số đó. Đọc trước khi đo sẽ biến kiến thức thành định kiến — đúng thứ chương 2 cảnh báo." },
      { title: "Giữ lại mọi kết quả đo", desc: "Các tuần sau liên tục tham chiếu ngược: GC log tuần 3 giải thích được bằng lý thuyết tuần 4, flame graph tuần 10 chỉ có nghĩa khi đặt cạnh số liệu tuần 1." },
    ],
    pitfalls: [
      "**Chỉnh cờ JVM trước khi đo.** Đây là cái bẫy trung tâm mà cả cuốn sách viết ra để chống lại — chương 1 mở đầu bằng mục \"Hiệu năng Java theo cách sai lầm\" và chương 2 dành nguyên một mục cho thiên kiến nhận thức. Danh sách cờ đọc được ở chương 5 và 6 là để **hiểu cơ chế**, không phải để dán vào production.",
      "**Tưởng số liệu và cờ trong sách là hằng số.** Các collector, cờ mặc định ở chương 5, con số phần cứng ở chương 7 và API ở chương 13/15 đều gắn với một mốc JDK cụ thể. Đọc để hiểu cơ chế, còn giá trị mặc định thì tra lại theo JDK bạn đang chạy — HotSpot GC Tuning Guide ở chân thanh bên là chỗ tra.",
      "**Báo cáo trung bình.** Chương 2 dạy rất kỹ vì sao phân phối latency là phi chuẩn và trung bình che mất đúng phần bạn cần thấy. Nếu sau tuần 1 bạn vẫn báo cáo trung bình, tuần 1 chưa xong.",
      "**Bỏ qua chương 7 vì \"không phải việc của dev\".** Cache miss, context switch và false sharing là nguyên nhân của rất nhiều kết quả đo khó hiểu ở các chương sau. Chương này ngắn và trả lời nhiều câu hỏi hơn vẻ ngoài của nó.",
    ],
    doneWhen: [
      "Báo cáo hiệu năng bằng phân vị và nói được vì sao trung bình không đủ.",
      "Đọc được một tệp GC log và chỉ ra allocation rate, tỉ lệ promotion và nguyên nhân một đợt pause dài.",
      "Chọn được collector cho một workload cụ thể và nêu lý do bằng đánh đổi, không bằng danh tiếng.",
      "Dựng được metric và trace cho một service, rồi dùng chúng để chẩn đoán một sự cố thật.",
      "Lấy được flame graph bằng hai công cụ khác nhau và giải thích được vì sao chúng khác nhau.",
    ],
  },
```

- [ ] **Bước 6: Thêm số đếm kỳ vọng vào `check-data.mjs`**

Trong `EXPECTED.counts`, thêm sau khối `jcip`:

```js
    // Lĩnh vực Optimizing Cloud Native Java — 15 chương (1–15), bản dịch đủ chương.
    "docs:ocnj": 15,
```

Chưa thêm `roadmap-items:ocnj` — chưa có dữ liệu lộ trình, và `fields.js` chưa khai module `roadmap` nên bất biến N3 chưa đòi khoá đó.

- [ ] **Bước 7: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Nếu đỏ, đọc tên bất biến:
- **#2 / #2b** — `file` hoặc ảnh không có trên đĩa: kiểm tra Task 1 đã chạy `build-content.sh` chưa.
- **#2c** — `file` không có dạng `content/ocnj/…`.
- **D1** — `chapter`/`part` sai kiểu, hoặc `title` còn tiền tố "Chương N. ".
- **P1** — quên Bước 2 (`paths.js`).
- **G1** — quên Bước 5 (`fieldGuides.ocnj`).
- **N3** — quên Bước 6.

- [ ] **Bước 8: Xác nhận số tài liệu đã lên 242**

```bash
node --input-type=module -e '
import { allDocs } from "./webapp/js/data/index.js";
import { FIELD_ORDER } from "./webapp/js/data/fields.js";
const o = allDocs.filter(d => d.field === "ocnj");
const parts = [...new Set(o.map(d => d.part))];
console.log("lĩnh vực:", FIELD_ORDER.length, "(kỳ vọng 13)");
console.log("tài liệu:", allDocs.length, "(kỳ vọng 242)");
console.log("tài liệu ocnj:", o.length, "(kỳ vọng 15)");
console.log("số Phần:", parts.length, "(kỳ vọng 5)");
console.log(parts.join("\n"));
'
```

- [ ] **Bước 9: Commit**

```bash
git add -A
git commit -m "feat(ocnj): khai lĩnh vực Optimizing Cloud Native Java và thư viện 15 tài liệu

Lĩnh vực thứ 13 của DevPrep. Doc id ocnj-01…15 liền mạch — bản dịch đủ 15
chương. part điền đủ cho cả 15 tài liệu theo năm Phần ghi trong README nguồn,
khác wgjd/jcip phải để null. Con đường Java Backend lên 8 chặng: ocnj nằm
giữa jcip và java.

Module roadmap chưa khai — mở ở Task 9 khi đã có dữ liệu lộ trình."
```

---

## Ghi chú chung cho Task 3–8 (viết lộ trình)

Sáu task này viết 48 mục lộ trình. Chúng chia sẻ toàn bộ quy ước dưới đây — đọc một lần, áp dụng cho cả sáu.

**Tệp và biến export:**

| Task | Tệp | Biến export | Tuần |
|---|---|---|---|
| 3 | `webapp/js/data/ocnj/roadmap-part1.js` (tạo) | `ocnjWeeksPart1` | W1–W2 |
| 4 | `roadmap-part1.js` | `ocnjWeeksPart1` | W3–W4 |
| 5 | `roadmap-part1.js` (đóng) | `ocnjWeeksPart1` | W5–W6 |
| 6 | `webapp/js/data/ocnj/roadmap-part2.js` (tạo) | `ocnjWeeksPart2` | W7–W8 |
| 7 | `roadmap-part2.js` | `ocnjWeeksPart2` | W9–W10 |
| 8 | `roadmap-part2.js` (đóng) | `ocnjWeeksPart2` | W11–W12 |

**Các tệp này chưa được `roadmap.js` import cho tới Task 9** — nên `check-data.mjs` không nhìn thấy chúng, và mỗi task tự kiểm bằng script riêng ở bước cuối.

**Đầu tệp `roadmap-part1.js`** (Task 3 viết, Task 4–5 không sửa):

```js
// Lộ trình đọc Optimizing Cloud Native Java — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Optimizing Cloud Native Java", ấn bản 2
// (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly).
// Thư mục nguồn: sources/ocnj/ — đủ 15 chương, không thiếu chương nào.
// Phụ lục A (microbenchmarking/JMH) và Phụ lục B (danh mục antipattern) không
// có trong bộ nguồn; phần microbenchmarking được bù bằng JMH ở tuần 1.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (oc-w<N> / oc-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const ocnjWeeksPart1 = [
```

Đầu tệp `roadmap-part2.js` giống hệt, đổi `Phần 1 (Tuần 1–6)` thành `Phần 2 (Tuần 7–12)` và tên biến thành `ocnjWeeksPart2`.

**Hình dạng một tuần:**

```js
  {
    id: "oc-w1",
    week: "Tuần 1",
    title: "…",
    goal: "…",
    practice: "…",
    resources: [
      { label: "OCNJ 01 — Định nghĩa về Tối ưu hóa và Hiệu năng", href: "#/docs/ocnj-01" },
    ],
    items: [ /* đúng 4 mục */ ],
  },
```

Tuần 8 **không có bài thực hành gõ tay** nhưng **vẫn phải có khoá `practice`** — viết một câu nói rõ vì sao, ví dụ: `"Tuần này không có bài gõ tay: chương 10 là chương thiết kế — bài của tuần là viết ra kế hoạch observability cho một service thật, và nó nằm ở khối Tự kiểm tra của từng mục."` Script tự kiểm bắt buộc khoá này có mặt.

**Hình dạng một mục:** `{ id, text, lesson }`. `lesson` là chuỗi template literal markdown gồm **đúng bốn khối, đúng thứ tự và đúng nhãn**:

```
**Mục tiêu.** …một câu, nói người đọc sẽ làm được gì sau mục này…

**Đọc.** …dẫn qua từng mục con, mỗi mục con là một link [tên mục](#/docs/ocnj-NN), kèm chỉ dẫn đọc kỹ hay đọc lướt…

**Bẫy.** …hai cái bẫy CÓ THẬT trong chương, mỗi cái nói rõ sách cảnh báo gì…

**Tự kiểm tra.** …hai câu hỏi trả lời được sau khi đọc, không phải câu hỏi mẹo…
```

**Quy tắc bắt buộc khi viết `lesson`:**

1. **Đọc chương gốc trước khi viết.** Mở `sources/ocnj/NN-slug.md`, đọc đúng những mục con mà mục lộ trình phụ trách. Tên mục trong khối **Đọc** phải là tên mục **có thật** trong bản dịch — bảng "Mục con nguồn" ở mỗi task cho biết đọc mục nào, và tên trong bảng đã trích nguyên văn từ heading của bản dịch.
2. **Không bịa số liệu, tên cờ JVM, tên API.** Sách nhiều cờ (`-XX:+UseG1GC`, `-Xlog:gc*`…) và nhiều con số phần cứng — chỉ nhắc cái nào bạn thật sự thấy trong chương.
3. **Bẫy phải là bẫy sách nói**, không phải kinh nghiệm chung chung của người viết.
4. Link luôn dạng `#/docs/ocnj-NN` — bất biến #3 kiểm id có thật, #3b kiểm cùng con đường. **Không link sang lĩnh vực khác trong `lesson`** (dùng `related.js` ở Task 10 cho việc đó).
5. Escape dấu backtick trong template literal bằng `` \` ``, và dấu `$` đứng trước `{` bằng `\$`.

**Ví dụ một mục viết đủ chuẩn** — dùng làm khuôn cho 47 mục còn lại. Đây là `oc-w3-3`, viết sau khi đọc `sources/ocnj/04-tim-hieu-garbage-collection.md`:

```js
      {
        id: "oc-w3-3",
        text: "Allocation, lifetime và giả thuyết thế hệ yếu",
        lesson: `**Mục tiêu.** Phát biểu được giả thuyết thế hệ yếu bằng lời của mình, và giải thích được vì sao nó biện minh cho việc chia heap thành nhiều vùng thay vì quét toàn bộ heap mỗi lần thu gom.

**Đọc.** [Allocation và Lifetime](#/docs/ocnj-04) đặt câu hỏi nền: các object sống bao lâu, và phân bố tuổi thọ đó trông như thế nào trong ứng dụng thật. Đọc kỹ [Giả thuyết thế hệ yếu (Weak Generational Hypothesis)](#/docs/ocnj-04) — đây là mệnh đề mà toàn bộ thiết kế GC của HotSpot đứng lên trên, nên đừng lướt qua. Rồi sang [Các kỹ thuật GC production trong HotSpot](#/docs/ocnj-04): [Thread-Local Allocation](#/docs/ocnj-04) giải thích vì sao cấp phát trong Java rẻ đến vậy, [Thu gom bán cầu (Hemispheric Collection)](#/docs/ocnj-04) cho cơ chế hai survivor space, và [Heap HotSpot "cổ điển"](#/docs/ocnj-04) ráp tất cả thành bố cục heap bạn sẽ thấy trong mọi GC log.

**Bẫy.** Đọc giả thuyết thế hệ yếu như một định luật vật lý luôn đúng. Sách trình bày nó như một **quan sát thực nghiệm** về phần lớn ứng dụng — workload của bạn có thể vi phạm nó (cache lớn, object sống lâu tạo hàng loạt), và khi đó chi phí promotion sẽ nuốt mất lợi ích của việc chia thế hệ. Bẫy thứ hai: tưởng cấp phát object là thao tác đắt nên đi tối ưu bằng cách tái dùng object. Với TLAB, cấp phát trong young gen gần như chỉ là một phép cộng con trỏ; giữ object sống lâu hơn cần thiết thường **đắt hơn** là cấp phát mới.

**Tự kiểm tra.** Giả thuyết thế hệ yếu nói gì về phân bố tuổi thọ object, và nó biện minh cho quyết định thiết kế nào của HotSpot? TLAB giải quyết vấn đề gì mà một vùng cấp phát dùng chung cho mọi thread sẽ gặp phải?`,
      },
```

**Bước cuối chung cho Task 3–8** — script tự kiểm, thay `<PART>`, `<BIẾN>`, `<SỐ TUẦN>`, `<SỐ MỤC>` theo task:

```bash
node --input-type=module -e '
const m = await import("./webapp/js/data/ocnj/roadmap-<PART>.js");
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
      if (!/^ocnj-(0[1-9]|1[0-5])$/.test(ref[1])) bad.push(`${it.id} link lạ: ${ref[1]}`);
  }
}
const dup = items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i);
if (dup.length) bad.push(`id trùng: ${dup}`);
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: <SỐ TUẦN> tuần, <SỐ MỤC> mục, id và khối hợp lệ");
process.exit(bad.length ? 1 : 0);
'
```

Regex `^ocnj-(0[1-9]|1[0-5])$` cho đúng 15 id hợp lệ `ocnj-01`…`ocnj-15` và chặn mọi id lạc.

**Lưu ý về `oc-w1-1` và tiền tố id.** Bất biến "Id mục lộ trình khớp tiền tố id tuần cha" so sánh chuỗi, nên `oc-w1-1` khớp tiền tố `oc-w1-`. Nhưng `oc-w1` cũng là tiền tố của `oc-w10`, `oc-w11`, `oc-w12` — điều này **không** gây lỗi vì bất biến so `id tuần + "-"`, và `oc-w10-1` bắt đầu bằng `oc-w10-` chứ không phải `oc-w1-`. Vẫn phải cẩn thận khi tự viết grep: `grep 'oc-w1-'` sẽ **không** bắt các mục tuần 10–12, còn `grep 'oc-w1'` thì có.

---

## Task 3: Lộ trình tuần 1–2 (ch.1 + ch.2, ch.3)

**Files:**
- Create: `webapp/js/data/ocnj/roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `ocnj-01`, `ocnj-02`, `ocnj-03` từ Task 2.
- Produces: `export const ocnjWeeksPart1` — mảng tuần mà Task 4 và 5 nối thêm vào, và Task 9 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/01-dinh-nghia-toi-uu-hoa-va-hieu-nang.md sources/ocnj/02-phuong-phap-luan-kiem-thu-hieu-nang.md sources/ocnj/03-tong-quan-ve-jvm.md
```

Rồi đọc nội dung các mục con sẽ viết ở Bước 3 và 4. Không viết `lesson` trước khi đọc — mọi tên mục và cái bẫy phải lấy từ bản dịch.

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/ocnj/roadmap-part1.js` với khối chú thích đầu tệp và dòng `export const ocnjWeeksPart1 = [` như mô tả ở "Ghi chú chung", rồi đóng bằng `];`.

- [ ] **Bước 3: Viết tuần 1**

`id: "oc-w1"`, `week: "Tuần 1"`, `title: "Hiệu năng là gì, và đo nó cho đúng"`.

`goal`: Gọi tên được bảy đại lượng quan sát được của hiệu năng và nói được đại lượng nào mâu thuẫn với đại lượng nào, chọn đúng loại kiểm thử cho một câu hỏi cụ thể, và báo cáo kết quả bằng phân vị thay vì trung bình.

`practice`: Lấy một endpoint thật trong ứng dụng của bạn, chạy tải tăng dần, ghi latency bằng HdrHistogram (hoặc công cụ tương đương cho ra phân vị) thay vì trung bình. Vẽ đồ thị throughput theo số client và chỉ ra điểm gãy. Đối chiếu hình dạng đồ thị bạn thu được với các dạng đồ thị chương 1 mô tả — nếu không khớp dạng nào, đó là câu hỏi tốt để mang sang tuần sau.

`resources`:
```js
    resources: [
      { label: "OCNJ 01 — Định nghĩa về Tối ưu hóa và Hiệu năng", href: "#/docs/ocnj-01" },
      { label: "OCNJ 02 — Phương pháp luận Kiểm thử Hiệu năng", href: "#/docs/ocnj-02" },
      { label: "JMH — microbenchmark harness của OpenJDK (bù Phụ lục A)", href: "https://github.com/openjdk/jmh" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w1-1` | Hiệu năng Java theo cách sai lầm, và hiệu năng như khoa học thực nghiệm | ch.1: Hiệu năng Java theo cách sai lầm · Tổng quan về hiệu năng Java · Hiệu năng như một khoa học thực nghiệm |
| `oc-w1-2` | Bảy đại lượng quan sát được, cách đọc đồ thị, và hiệu năng trên cloud | ch.1: Một hệ phân loại cho hiệu năng (Throughput · Latency · Capacity · Utilization · Efficiency · Scalability · Degradation · Mối tương quan giữa các đại lượng quan sát được) · Đọc đồ thị hiệu năng · Hiệu năng trong hệ thống Cloud |
| `oc-w1-3` | Bảy loại kiểm thử hiệu năng và cách đặt chúng vào SDLC | ch.2: Các loại kiểm thử hiệu năng (Latency · Throughput · Stress · Load · Endurance · Capacity Planning · Degradation Test) · Nhập môn Best Practice · Hiệu năng theo hướng Top-Down (Tạo môi trường kiểm thử · Xác định yêu cầu hiệu năng · Kiểm thử hiệu năng như một phần của SDLC · Các vấn đề riêng của Java) |
| `oc-w1-4` | Antipattern, thống kê phi chuẩn và bốn thiên kiến nhận thức | ch.2: Nguyên nhân của các Antipattern về hiệu năng (Sự nhàm chán · Tô điểm CV · Áp lực xã hội · Thiếu hiểu biết · Vấn đề bị hiểu sai / không tồn tại) · Thống kê cho hiệu năng JVM (Các loại sai số · Thống kê phi chuẩn) · Diễn giải thống kê (Tương quan giả · Vấn đề Cái mũ / Con voi) · Thiên kiến nhận thức và kiểm thử hiệu năng (Tư duy giản lược · Thiên kiến xác nhận · Màn sương chiến trận · Thiên kiến rủi ro) |

Ở `oc-w1-3`, khối **Đọc** phải nói rõ mục "Nhập môn Best Practice" là nơi sách giải thích vì sao microbenchmarking bị đẩy ra Phụ lục A — và Phụ lục A không có trong bộ nguồn, nên đây là chỗ dùng tài nguyên JMH ở `resources`.

- [ ] **Bước 4: Viết tuần 2**

`id: "oc-w2"`, `week: "Tuần 2"`, `title: "Tổng quan JVM: classloading, JIT, bộ nhớ và công cụ"`.

`goal`: Vẽ được sơ đồ khối của JVM từ lúc nạp class tới lúc mã chạy nóng, và biết công cụ nào trong JDK trả lời câu hỏi nào.

`practice`: Chạy `javap -c` trên một class có vòng lặp đơn giản và đọc bytecode sinh ra. Bật `-Xlog:class+load` khi khởi động ứng dụng và đếm số class được nạp. Rồi dùng `jcmd <pid> help` để xem JVM đang chạy trả lời được những câu hỏi gì — giữ lại danh sách đó, các tuần sau sẽ quay lại dùng.

`resources`: `{ label: "OCNJ 03 — Tổng quan về JVM", href: "#/docs/ocnj-03" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w2-1` | Classloading và thực thi bytecode | ch.3: Thông dịch và nạp lớp (Interpreting and Classloading) · Thực thi Bytecode |
| `oc-w2-2` | HotSpot và vì sao JIT tồn tại | ch.3: Giới thiệu HotSpot · Giới thiệu biên dịch Just-in-Time |
| `oc-w2-3` | Quản lý bộ nhớ, luồng và Java Memory Model | ch.3: Quản lý bộ nhớ trong JVM · Luồng và Java Memory Model |
| `oc-w2-4` | Công cụ giám sát JDK, và chọn bản phân phối Java | ch.3: Giám sát và công cụ cho JVM · Các triển khai, bản phân phối và bản phát hành Java (Chọn một bản phân phối · Chu kỳ phát hành Java) |

- [ ] **Bước 5: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`ocnjWeeksPart1`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 6: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Tệp mới chưa được import nên số đếm không đổi — nếu đỏ, lỗi nằm ở chỗ khác.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part1.js
git commit -m "feat(ocnj): lộ trình đọc tuần 1-2 — nền tảng hiệu năng và tổng quan JVM

Tuần 1 gộp trọn Phần I (ch.1 + ch.2): bảy đại lượng quan sát được, đọc đồ
thị, bảy loại kiểm thử, thống kê phi chuẩn và bốn thiên kiến. Tài nguyên JMH
bù Phụ lục A vắng mặt. Tuần 2 là ch.3 tổng quan JVM.

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 4: Lộ trình tuần 3–4 (ch.4, ch.5)

**Files:**
- Modify: `webapp/js/data/ocnj/roadmap-part1.js`

**Interfaces:**
- Consumes: `ocnjWeeksPart1` từ Task 3; doc id `ocnj-04`, `ocnj-05`.
- Produces: `ocnjWeeksPart1` dài thêm 2 tuần (tổng 4 tuần, 16 mục).

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/04-tim-hieu-garbage-collection.md sources/ocnj/05-garbage-collection-nang-cao.md
```

- [ ] **Bước 2: Nối tuần 3 và tuần 4 vào cuối mảng `ocnjWeeksPart1`**

**Tuần 3** — `id: "oc-w3"`, `week: "Tuần 3"`, `title: "Garbage collection: mark and sweep tới parallel collector"`.

`goal`: Đọc được một tệp GC log và chỉ ra allocation rate, tỉ lệ promotion sang old gen và nguyên nhân một đợt pause — bằng từ vựng của chương chứ không bằng suy đoán.

`practice`: Bật `-Xlog:gc*` trên ứng dụng thật, chạy kịch bản tải của tuần 1, rồi đọc log: allocation rate là bao nhiêu, bao nhiêu phần trăm object sống sót sang old gen, đợt pause dài nhất do đâu. Chỉ ra một chỗ workload của bạn tuân theo giả thuyết thế hệ yếu và một chỗ nó vi phạm.

`resources`: `{ label: "OCNJ 04 — Tìm hiểu về Garbage Collection", href: "#/docs/ocnj-04" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w3-1` | Mark and sweep, và bảng thuật ngữ GC phải thuộc | ch.4: Giới thiệu Mark and Sweep (Bảng thuật ngữ Garbage Collection) |
| `oc-w3-2` | HotSpot runtime: biểu diễn object và GC root | ch.4: Giới thiệu HotSpot Runtime (Biểu diễn Object lúc runtime · GC Roots) |
| `oc-w3-3` | Allocation, lifetime và giả thuyết thế hệ yếu | ch.4: Allocation và Lifetime (Giả thuyết thế hệ yếu) · Các kỹ thuật GC production trong HotSpot (Thread-Local Allocation · Thu gom bán cầu · Heap HotSpot "cổ điển") |
| `oc-w3-4` | Parallel collector, giới hạn của chúng, và vai trò của allocation | ch.4: Các Parallel Collector (Thu gom Young Parallel · Thu gom Old Parallel · Serial và SerialOld · Giới hạn của các Parallel Collector) · Vai trò của Allocation |

`oc-w3-3` đã được viết đủ ở "Ghi chú chung" làm khuôn mẫu — chép nguyên vào đây.

**Tuần 4** — `id: "oc-w4"`, `week: "Tuần 4"`, `title: "GC đồng thời: G1, Shenandoah, ZGC và các collector khác"`.

`goal`: Chọn được collector cho một workload cụ thể và nêu lý do bằng đánh đổi (pause, throughput, footprint), không bằng danh tiếng của collector.

`practice`: Chạy cùng workload tuần 3 với G1, rồi với ZGC (hoặc Shenandoah nếu JDK của bạn có). So phân bố pause và throughput hai lần chạy, và giải thích chênh lệch bằng lý thuyết GC đồng thời của chương — cụ thể là chỗ nào công việc được đẩy từ lúc dừng thế giới sang lúc chạy đồng thời, và cái giá của việc đó.

`resources`: `{ label: "OCNJ 05 — Garbage Collection nâng cao", href: "#/docs/ocnj-05" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w4-1` | Collector cắm được, safepoint, đánh dấu ba màu và forwarding pointer | ch.5: Đánh đổi và Collector cắm được (Pluggable) · Lý thuyết GC đồng thời (JVM Safepoint · Đánh dấu ba màu · Forwarding Pointer) |
| `oc-w4-2` | G1: region, các đợt thu gom, remembered set và cờ cấu hình | ch.5: G1 (Bố cục heap và Region của G1 · Các đợt thu gom của G1 · Mixed Collection của G1 · Remembered Set · Full Collection · Các cờ cấu hình JVM cho G1) |
| `oc-w4-3` | Shenandoah và ZGC | ch.5: Shenandoah (Concurrent Evacuation · Các cờ cấu hình JVM cho Shenandoah · Sự tiến hóa của Shenandoah) · ZGC |
| `oc-w4-4` | Balanced của OpenJ9, và hai collector ngách CMS với Epsilon | ch.5: Balanced (Eclipse OpenJ9) (Object Header của OpenJ9 · Mảng lớn trong Balanced · NUMA và Balanced) · Các collector HotSpot ngách (CMS · Epsilon) |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

Script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`ocnjWeeksPart1`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part1.js
git commit -m "feat(ocnj): lộ trình đọc tuần 3-4 — hai chương garbage collection

Tuần 3 (ch.4) mark and sweep, GC root, giả thuyết thế hệ yếu, TLAB và
parallel collector; bài thực hành đọc -Xlog:gc*. Tuần 4 (ch.5) safepoint,
đánh dấu ba màu, G1, Shenandoah, ZGC, Balanced, CMS và Epsilon; bài thực
hành đổi collector và so phân bố pause."
```

---

## Task 5: Lộ trình tuần 5–6 (ch.6, ch.7) — đóng `roadmap-part1.js`

**Files:**
- Modify: `webapp/js/data/ocnj/roadmap-part1.js`

**Interfaces:**
- Consumes: `ocnjWeeksPart1` từ Task 4; doc id `ocnj-06`, `ocnj-07`.
- Produces: `ocnjWeeksPart1` hoàn chỉnh — 6 tuần, 24 mục. Task 9 import nguyên mảng này.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/06-thuc-thi-ma-tren-jvm.md sources/ocnj/07-phan-cung-va-he-dieu-hanh.md
```

- [ ] **Bước 2: Nối tuần 5 và tuần 6 vào cuối mảng, rồi đóng tệp**

**Tuần 5** — `id: "oc-w5"`, `week: "Tuần 5"`, `title: "Thực thi mã: từ thông dịch tới JIT và AOT"`.

`goal`: Giải thích được vì sao một method chậm ở lần chạy đầu rồi nhanh dần, và đọc được log biên dịch để biết method nào đã được biên dịch, bị deoptimize hay không bao giờ nóng lên.

`practice`: Chạy ứng dụng với `-XX:+PrintCompilation`, tìm một method bị deoptimize rồi recompile, và giải thích vì sao dựa vào profile-guided optimization của chương. Rồi đo cùng một benchmark với ngưỡng inline mặc định và với ngưỡng đã đổi, ghi lại chênh lệch.

`resources`: `{ label: "OCNJ 06 — Thực thi mã trên JVM", href: "#/docs/ocnj-06" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w5-1` | Vòng đời ứng dụng Java và cách bytecode được thông dịch | ch.6: Vòng đời của một ứng dụng Java truyền thống · Tổng quan về thông dịch Bytecode (Giới thiệu Bytecode của JVM · Trình thông dịch đơn giản · Các chi tiết riêng của HotSpot) |
| `oc-w5-2` | JIT dẫn hướng bằng profile, klass word và các trình biên dịch của HotSpot | ch.6: Biên dịch JIT trong HotSpot (Profile-Guided Optimization · Klass Word, Vtable và Pointer Swizzling · Các trình biên dịch trong HotSpot) |
| `oc-w5-3` | Code cache, đọc log biên dịch và tinh chỉnh JIT | ch.6: Biên dịch JIT trong HotSpot (Code Cache · Ghi log biên dịch JIT · Tinh chỉnh JIT đơn giản) |
| `oc-w5-4` | AOT, Quarkus và GraalVM — khi JIT không phải câu trả lời | ch.6: Sự tiến hóa trong thực thi chương trình Java (Biên dịch Ahead-of-Time (AOT) · Quarkus · GraalVM) |

**Tuần 6** — `id: "oc-w6"`, `week: "Tuần 6"`, `title: "Phần cứng và hệ điều hành: mechanical sympathy"`.

`goal`: Giải thích được một kết quả đo khó hiểu bằng cache miss, context switch hoặc false sharing thay vì bằng "máy hôm nay chậm".

`practice`: Viết một benchmark JMH cho false sharing — hai thread ghi hai biến nằm cạnh nhau trong bộ nhớ, rồi tách chúng ra khỏi cùng một cache line. Đo chênh lệch và giải thích bằng mô hình bộ nhớ phần cứng của chương. Đây cũng là lần dùng JMH thứ hai sau tuần 1.

`resources`:
```js
    resources: [
      { label: "OCNJ 07 — Phần cứng và Hệ điều hành", href: "#/docs/ocnj-07" },
      { label: "JMH — microbenchmark harness của OpenJDK", href: "https://github.com/openjdk/jmh" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w6-1` | Bộ nhớ và các mức cache | ch.7: Giới thiệu về phần cứng hiện đại (Bộ nhớ · Bộ nhớ đệm) |
| `oc-w6-2` | TLB, dự đoán rẽ nhánh và mô hình bộ nhớ phần cứng | ch.7: Các tính năng của bộ xử lý hiện đại (Translation Lookaside Buffer · Dự đoán rẽ nhánh và thực thi suy đoán · Mô hình bộ nhớ phần cứng) |
| `oc-w6-3` | Bộ lập lịch, quan hệ JVM–OS và chi phí context switch | ch.7: Hệ điều hành (Bộ lập lịch · JVM và hệ điều hành · Context Switch) |
| `oc-w6-4` | Một mô hình hệ thống đơn giản, và mechanical sympathy | ch.7: Một mô hình hệ thống đơn giản (Sử dụng CPU · Garbage Collection · I/O) · Mechanical Sympathy |

Đóng mảng bằng `];`. Tệp `roadmap-part1.js` hoàn chỉnh: **6 tuần, 24 mục**.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

Script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`ocnjWeeksPart1`, `<SỐ TUẦN>`=`6`, `<SỐ MỤC>`=`24`.

- [ ] **Bước 4: Xác nhận id tuần W1–W6 đủ và đúng thứ tự**

```bash
node --input-type=module -e '
import { ocnjWeeksPart1 as w } from "./webapp/js/data/ocnj/roadmap-part1.js";
const ids = w.map(x => x.id);
const want = ["oc-w1","oc-w2","oc-w3","oc-w4","oc-w5","oc-w6"];
console.log(JSON.stringify(ids) === JSON.stringify(want) ? "XANH: " + ids.join(" ") : "ĐỎ: " + ids.join(" ") + " ≠ " + want.join(" "));
'
```

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part1.js
git commit -m "feat(ocnj): lộ trình đọc tuần 5-6 — thực thi mã và phần cứng; đóng part1

Tuần 5 (ch.6) thông dịch bytecode, JIT dẫn hướng bằng profile, code cache,
AOT/Quarkus/GraalVM; bài thực hành đọc -XX:+PrintCompilation. Tuần 6 (ch.7)
cache, TLB, dự đoán rẽ nhánh, context switch và mechanical sympathy; bài
thực hành benchmark false sharing bằng JMH.

roadmap-part1.js hoàn chỉnh: 6 tuần, 24 mục, hết Phần II của sách."
```

---

## Task 6: Lộ trình tuần 7–8 (ch.8 + ch.9, ch.10) — tạo `roadmap-part2.js`

**Files:**
- Create: `webapp/js/data/ocnj/roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `ocnj-08`, `ocnj-09`, `ocnj-10` từ Task 2.
- Produces: `export const ocnjWeeksPart2` — mảng tuần mà Task 7 và 8 nối thêm vào, và Task 9 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/08-thanh-phan-cua-cloud-stack.md sources/ocnj/09-trien-khai-java-tren-cloud.md sources/ocnj/10-gioi-thieu-ve-observability.md
```

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/ocnj/roadmap-part2.js` với khối chú thích đầu tệp (đổi `Phần 1 (Tuần 1–6)` thành `Phần 2 (Tuần 7–12)`) và dòng `export const ocnjWeeksPart2 = [`.

- [ ] **Bước 3: Viết tuần 7**

`id: "oc-w7"`, `week: "Tuần 7"`, `title: "Cloud stack và triển khai Java: trọn Phần III"`.

`goal`: Đóng gói một ứng dụng Java thành container chạy được trên Kubernetes, và nói được ba điều đổi khác khi JVM chạy trong container có giới hạn tài nguyên.

`practice`: Đóng gói ứng dụng của bạn thành image, đặt giới hạn bộ nhớ cho container, rồi xem GC ergonomics chọn kích thước heap khác đi thế nào so với lúc chạy trần — ghi lại cả hai con số. Dựng ngăn xếp bằng Docker Compose theo ví dụ Fighting Animals của chương 8, và chạy nó cục bộ.

`resources`:
```js
    resources: [
      { label: "OCNJ 08 — Các thành phần của Cloud Stack", href: "#/docs/ocnj-08" },
      { label: "OCNJ 09 — Triển khai Java trên Cloud", href: "#/docs/ocnj-09" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w7-1` | Chuẩn Java cho cloud, CNCF và ảo hóa | ch.8: Các chuẩn Java cho Cloud Stack (Cloud Native Computing Foundation) · Ảo hóa (Chọn đúng máy ảo · Cân nhắc về ảo hóa) |
| `oc-w7-2` | Image, container, mạng và ví dụ Fighting Animals | ch.8: Image và Container (Cấu trúc Image · Xây dựng Image · Chạy Container) · Mạng · Giới thiệu ví dụ Fighting Animals |
| `oc-w7-3` | Chạy cục bộ với Compose và Tilt, rồi orchestration bằng Kubernetes | ch.9: Làm việc cục bộ với Container (Docker Compose · Tilt) · Container Orchestration (Deployment · Chia sẻ trong Pod · Vòng đời của Container và Pod · Service · Kết nối đến các Service trên Cluster · Thách thức với Container và việc lập lịch · Làm việc với Container từ xa bằng phát triển "Remocal") |
| `oc-w7-4` | Blue/green, canary, feature flag — và hai mối lo riêng của Java | ch.9: Kỹ thuật triển khai (Blue/Green Deployment · Canary Deployment · Kiến trúc tiến hóa và Feature Flagging) · Các mối quan tâm riêng của Java (Container và GC · Bộ nhớ và OOME) |

`oc-w7-4` phải nối ngược về tuần 3–4: mục "Container và GC" là chỗ hai chương garbage collection gặp lại thực tế triển khai.

- [ ] **Bước 4: Viết tuần 8**

`id: "oc-w8"`, `week: "Tuần 8"`, `title: "Observability: ba trụ cột và sáu dạng sự cố"`.

`goal`: Nói được observability khác monitoring ở đâu, nhận ra hai antipattern kiến trúc phổ biến, và ghép được một triệu chứng với một trong sáu dạng sự cố mà chương mô tả.

`practice` (tuần này không có bài gõ tay — vẫn phải có khoá này): Tuần này không có bài gõ tay: chương 10 là chương thiết kế. Bài của tuần là chọn một service thật và viết ra kế hoạch observability cho nó — đo metric nào, log cái gì, trace đường nào, và mỗi lựa chọn phục vụ câu hỏi chẩn đoán nào. Giữ lại kế hoạch đó: tuần 9 sẽ cắm nó vào code thật.

`resources`: `{ label: "OCNJ 10 — Giới thiệu về Observability", href: "#/docs/ocnj-10" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w8-1` | Observability là gì, và vì sao monitoring không đủ | ch.10: Observability là gì và tại sao (Observability là gì? · Tại sao cần Observability?) |
| `oc-w8-2` | Ba trụ cột — và profiling có phải trụ cột thứ tư | ch.10: Ba trụ cột (Metrics · Logs · Traces · Các trụ cột như những nguồn dữ liệu · Profiling — trụ cột thứ tư?) |
| `oc-w8-3` | Mẫu hình kiến trúc, instrumentation thủ công hay tự động, và hai antipattern | ch.10: Các mẫu hình và Antipattern kiến trúc Observability (Mẫu hình kiến trúc cho Metric · Instrumentation thủ công so với tự động · Antipattern: Nhồi nhét dữ liệu vào Metric · Antipattern: Lạm dụng Log tương quan) |
| `oc-w8-4` | Sáu dạng sự cố hệ phân tán, và chọn vendor hay OSS | ch.10: Chẩn đoán vấn đề ứng dụng bằng Observability (Suy giảm hiệu năng · Thành phần không ổn định · Phân vùng lại và "Split-Brain" · Thundering Herd · Lỗi dây chuyền · Lỗi kết hợp) · Giải pháp của nhà cung cấp hay OSS? |

- [ ] **Bước 5: Chạy script tự kiểm — kỳ vọng XANH**

Script ở "Ghi chú chung" với `<PART>`=`part2`, `<BIẾN>`=`ocnjWeeksPart2`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 6: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part2.js
git commit -m "feat(ocnj): lộ trình đọc tuần 7-8 — cloud native và observability

Tuần 7 gộp trọn Phần III (ch.8 + ch.9): CNCF, ảo hóa, image/container,
Fighting Animals, Compose/Tilt/Kubernetes, blue-green và canary, container
với GC. Tuần 8 (ch.10) ba trụ cột, antipattern kiến trúc và sáu dạng sự cố —
tuần thiết kế, không có bài gõ tay, đã ghi rõ lý do trong practice."
```

---

## Task 7: Lộ trình tuần 9–10 (ch.11, ch.12)

**Files:**
- Modify: `webapp/js/data/ocnj/roadmap-part2.js`

**Interfaces:**
- Consumes: `ocnjWeeksPart2` từ Task 6; doc id `ocnj-11`, `ocnj-12`.
- Produces: `ocnjWeeksPart2` dài thêm 2 tuần (tổng 4 tuần, 16 mục).

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/11-trien-khai-observability-trong-java.md sources/ocnj/12-profiling.md
```

- [ ] **Bước 2: Nối tuần 9 và tuần 10 vào cuối mảng `ocnjWeeksPart2`**

**Tuần 9** — `id: "oc-w9"`, `week: "Tuần 9"`, `title: "Observability trong Java: Micrometer, Prometheus, OpenTelemetry"`.

`goal`: Cắm được metric và trace vào một ứng dụng Java thật, và giải thích được đường đi của một số đo từ trong code tới màn hình.

`practice`: Thực hiện kế hoạch observability viết ở tuần 8. Cắm Micrometer vào service của bạn, xuất metric cho Prometheus, rồi thêm OpenTelemetry tracing **xuyên hai service** để thấy một trace có nhiều span. Bật lấy mẫu trace và quan sát điều gì biến mất khỏi dữ liệu khi tỉ lệ lấy mẫu giảm.

`resources`: `{ label: "OCNJ 11 — Triển khai Observability trong Java", href: "#/docs/ocnj-11" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w9-1` | Micrometer: meter, registry, counter, gauge, meter filter | ch.11: Giới thiệu Micrometer (Meter và Registry · Counter · Gauge · Meter Filter) |
| `oc-w9-2` | Timer, distribution summary, runtime metric và Prometheus | ch.11: Giới thiệu Micrometer (Timer · Distribution Summary · Runtime Metric) · Giới thiệu Prometheus cho lập trình viên Java (Tổng quan kiến trúc Prometheus · Dùng Prometheus với Micrometer) |
| `oc-w9-3` | OpenTelemetry: OTLP, Collector và tracing trong Java | ch.11: Giới thiệu OpenTelemetry (OpenTelemetry là gì? · Tại sao chọn OTel? · OTLP · Collector) · OpenTelemetry Tracing trong Java (Tracing thủ công · Tracing tự động · Lấy mẫu Trace) |
| `oc-w9-4` | OTel Metrics và OTel Logs trong Java | ch.11: OpenTelemetry Metrics trong Java · OpenTelemetry Logs trong Java |

`oc-w9-2` phải nối ngược về tuần 1: distribution summary và timer là nơi phân vị của chương 2 thành một dòng code thật.

**Tuần 10** — `id: "oc-w10"`, `week: "Tuần 10"`, `title: "Profiling: JFR, Async Profiler và memory profiling"`.

`goal`: Lấy được profile của một ứng dụng đang chạy bằng hai công cụ khác nhau, và giải thích được vì sao kết quả của chúng không giống nhau.

`practice`: Ghi một phiên JFR dưới tải rồi mở bằng JDK Mission Control. Cùng lúc đó chạy Async Profiler lấy flame graph cho cùng khoảng thời gian. So hai kết quả và chỉ ra chỗ thiên lệch safepoint làm chúng khác nhau. Rồi lấy một heap dump và tìm object nào chiếm nhiều bộ nhớ nhất.

`resources`: `{ label: "OCNJ 12 — Profiling", href: "#/docs/ocnj-12" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w10-1` | Profiling là gì, và hai công cụ GUI: VisualVM với JDK Mission Control | ch.12: Giới thiệu về Profiling · Công cụ Profiling dạng GUI (VisualVM · JDK Mission Control) |
| `oc-w10-2` | Thiên lệch safepoint, perf và Async Profiler | ch.12: Công cụ Profiling dạng GUI (Lấy mẫu và thiên lệch Safepoint) · Các Profiler hiện đại (perf · Async Profiler) |
| `oc-w10-3` | JFR, và profiling như một công cụ vận hành | ch.12: JDK Flight Recorder (JFR) · Các khía cạnh vận hành của Profiling (Dùng JFR như một công cụ vận hành · Red Hat Cryostat · JFR và OTel Profiling · Chọn một Profiler) |
| `oc-w10-4` | Memory profiling: allocation profiling và heap dump | ch.12: Memory Profiling (Allocation Profiling · Heap Dump) |

`oc-w10-4` phải nối ngược về tuần 3: allocation profiling trả lời chính câu hỏi "allocation rate đến từ dòng code nào" mà GC log ở tuần 3 chỉ cho biết tổng số.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

Script ở "Ghi chú chung" với `<PART>`=`part2`, `<BIẾN>`=`ocnjWeeksPart2`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part2.js
git commit -m "feat(ocnj): lộ trình đọc tuần 9-10 — observability trong Java và profiling

Tuần 9 (ch.11) Micrometer, Prometheus, OpenTelemetry tracing/metrics/logs;
bài thực hành cắm OTel xuyên hai service. Tuần 10 (ch.12) VisualVM, JMC,
thiên lệch safepoint, perf, Async Profiler, JFR, Cryostat và memory
profiling; bài thực hành so JFR với flame graph của Async Profiler."
```

---

## Task 8: Lộ trình tuần 11–12 (ch.13, ch.14 + ch.15) — đóng `roadmap-part2.js`

**Files:**
- Modify: `webapp/js/data/ocnj/roadmap-part2.js`

**Interfaces:**
- Consumes: `ocnjWeeksPart2` từ Task 7; doc id `ocnj-13`, `ocnj-14`, `ocnj-15`.
- Produces: `ocnjWeeksPart2` hoàn chỉnh — 6 tuần, 24 mục. Cùng `ocnjWeeksPart1` thành 12 tuần / 48 mục cho Task 9.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/ocnj/13-ky-thuat-hieu-nang-dong-thoi.md sources/ocnj/14-ky-thuat-va-mau-hinh-he-phan-tan.md sources/ocnj/15-hieu-nang-hien-dai-va-tuong-lai.md
```

- [ ] **Bước 2: Nối tuần 11 và tuần 12 vào cuối mảng, rồi đóng tệp**

**Tuần 11** — `id: "oc-w11"`, `week: "Tuần 11"`, `title: "Kỹ thuật hiệu năng đồng thời: từ Amdahl tới virtual thread"`.

`goal`: Đặt được trần lý thuyết cho một nỗ lực song song hóa bằng định luật Amdahl trước khi viết dòng code song song đầu tiên, và chọn được đúng công cụ concurrency cho hình dạng bài toán.

`practice`: Giải cùng một bài toán bằng ba cách — Fork/Join, parallel stream, và virtual thread — rồi đo cả ba trên cùng dữ liệu và cùng số nhân. Đối chiếu kết quả với định luật Amdahl: phần tuần tự của bài toán là bao nhiêu, và trần lý thuyết có khớp với con số đo được không? Nếu không khớp, chương 7 (context switch, cache) là chỗ tìm lời giải thích.

`resources`: `{ label: "OCNJ 13 — Kỹ thuật hiệu năng đồng thời", href: "#/docs/ocnj-13" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w11-1` | Định luật Amdahl, concurrency Java nền tảng và JMM | ch.13: Giới thiệu về Parallelism (Định luật Amdahl) · Concurrency Java nền tảng · Tìm hiểu JMM |
| `oc-w11-2` | Thư viện concurrency được xây từ đâu: method/var handle, atomic, CAS, spinlock | ch.13: Xây dựng thư viện Concurrency (Method Handle và Var Handle · Atomic và CAS · Lock và Spinlock) |
| `oc-w11-3` | Tóm lược `java.util.concurrent` và trừu tượng hóa Executor | ch.13: Tóm lược về các thư viện Concurrency (Lock trong java.util.concurrent · Read/Write Lock · Semaphore · Concurrent Collection · Latch và Barrier) · Executor và trừu tượng hóa Task (Giới thiệu thực thi bất đồng bộ · Chọn một ExecutorService) |
| `oc-w11-4` | Fork/Join, parallel stream, actor và virtual thread | ch.13: Fork/Join và Parallel Stream · Các kỹ thuật dựa trên Actor · Virtual Thread (Giới thiệu Virtual Thread · Mẫu hình Concurrency với Virtual Thread) |

**Tuần 12** — `id: "oc-w12"`, `week: "Tuần 12"`, `title: "Hệ phân tán và hướng đi của JVM: đóng Phần V"`.

`goal`: Ghép được một yêu cầu nhất quán dữ liệu với một lựa chọn kiến trúc cụ thể, và biết ba dự án nào đang định hình JVM cùng chúng đổi cái gì.

`practice`: Chạy một ví dụ structured concurrency kèm scoped values trên JDK 21 trở lên, rồi so cách nó xử lý huỷ tác vụ và truyền ngữ cảnh với cùng bài toán viết bằng `ExecutorService` thuần. Ghi lại đoạn code nào biến mất khi chuyển sang structured concurrency — đó là phần chi phí mà mẫu hình mới xoá đi.

`resources`:
```js
    resources: [
      { label: "OCNJ 14 — Kỹ thuật và Mẫu hình cho Hệ phân tán", href: "#/docs/ocnj-14" },
      { label: "OCNJ 15 — Hiệu năng hiện đại và Tương lai", href: "#/docs/ocnj-15" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `oc-w12-1` | WAL, two-phase commit, phân vùng, nhân bản và định lý CAP | ch.14: Cấu trúc dữ liệu phân tán cơ bản (Clock, ID và Write-Ahead Log · Two-Phase Commit · Object Serialization · Phân vùng và nhân bản dữ liệu · Định lý CAP) |
| `oc-w12-2` | Paxos, Raft, và ba hệ thật: Cassandra, Infinispan, Kafka | ch.14: Giao thức đồng thuận (Paxos · Raft) · Ví dụ về hệ phân tán (Cơ sở dữ liệu phân tán — Cassandra · In-Memory Data Grid — Infinispan · Event Streaming — Kafka) |
| `oc-w12-3` | Nâng cấp Fighting Animals bằng Kafka | ch.14: Nâng cấp Fighting Animals (Đưa Kafka vào Fighting Animals · Một Service Bệnh viện đơn giản · Một Bệnh viện chủ động) |
| `oc-w12-4` | Structured concurrency, scoped values, Panama, Leyden và Valhalla | ch.15: Các mẫu hình Concurrency mới (Structured Concurrency · Scoped Values) · Panama · Leyden (Image, Ràng buộc và Condenser · Leyden Premain) · Valhalla · Kết luận |

`oc-w12-3` khép lại ví dụ Fighting Animals đã mở ở tuần 7 — khối **Mục tiêu** phải nói rõ điều đó.

Đóng mảng bằng `];`. Tệp `roadmap-part2.js` hoàn chỉnh: **6 tuần, 24 mục**.

- [ ] **Bước 3: Chạy script tự kiểm cho cả hai tệp — kỳ vọng XANH**

Script ở "Ghi chú chung", chạy hai lần: `part1`/`ocnjWeeksPart1`/`6`/`24`, rồi `part2`/`ocnjWeeksPart2`/`6`/`24`.

- [ ] **Bước 4: Xác nhận 12 tuần và 48 mục phủ đủ, không trùng**

```bash
node --input-type=module -e '
import { ocnjWeeksPart1 as p1 } from "./webapp/js/data/ocnj/roadmap-part1.js";
import { ocnjWeeksPart2 as p2 } from "./webapp/js/data/ocnj/roadmap-part2.js";
const weeks = [...p1, ...p2];
const items = weeks.flatMap(w => w.items);
const wantWeeks = Array.from({length:12}, (_,i) => `oc-w${i+1}`);
const gotWeeks = weeks.map(w => w.id);
const bad = [];
if (JSON.stringify(gotWeeks) !== JSON.stringify(wantWeeks)) bad.push("id tuần sai: " + gotWeeks.join(" "));
if (items.length !== 48) bad.push(`mục: ${items.length} ≠ 48`);
const dupW = gotWeeks.filter((v,i,a)=>a.indexOf(v)!==i);
const dupI = items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i);
if (dupW.length) bad.push("id tuần trùng: " + dupW);
if (dupI.length) bad.push("id mục trùng: " + dupI);
for (const w of weeks) {
  const want = w.items.map((_,i) => `${w.id}-${i+1}`);
  const got = w.items.map(i => i.id);
  if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${w.id}: ${got.join(" ")} ≠ ${want.join(" ")}`);
}
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: 12 tuần oc-w1…oc-w12, 48 mục, đánh số liên tục");
process.exit(bad.length ? 1 : 0);
'
```

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/ocnj/roadmap-part2.js
git commit -m "feat(ocnj): lộ trình đọc tuần 11-12 — concurrency và hệ phân tán; đóng part2

Tuần 11 (ch.13) Amdahl, JMM, var handle, CAS, j.u.c, Executor, Fork/Join và
virtual thread. Tuần 12 gộp ch.14 + ch.15: WAL, CAP, Paxos/Raft, Cassandra/
Infinispan/Kafka, khép lại Fighting Animals, rồi structured concurrency,
scoped values, Panama, Leyden và Valhalla.

Đủ 12 tuần / 48 mục. Track bật ở Task 9."
```

---

## Task 9: Bật track `ocnj`

**Files:**
- Modify: `webapp/js/data/roadmap.js`, `webapp/js/data/fields.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `ocnjWeeksPart1` và `ocnjWeeksPart2` từ Task 3–8; `FIELDS.ocnj` từ Task 2.
- Produces: track id `ocnj` mà `fieldGuides.ocnj.steps` trỏ tới qua `#/roadmap/ocnj`, và Task 10 nhắc trong README.

Bốn thay đổi dưới đây phải **cùng một commit**: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, #7b chặn có dữ liệu mà chưa khai module. Làm lẻ một nửa là đỏ.

- [ ] **Bước 1: Thêm import vào `roadmap.js`**

Cạnh các import khác, sau hai dòng `jcip`:

```js
import { ocnjWeeksPart1 } from "./ocnj/roadmap-part1.js";
import { ocnjWeeksPart2 } from "./ocnj/roadmap-part2.js";
```

- [ ] **Bước 2: Cập nhật khối chú thích đầu `roadmap.js`**

Khối đó là tài liệu sống. Ba chỗ phải sửa:

1. Câu liệt kê track ở đầu — thêm `đọc sách Optimizing Cloud Native Java` vào danh sách, trước `và 4 giai đoạn của Lộ trình Senior Java`.
2. Bảng tệp — thêm dòng, canh cột như các dòng có sẵn:

```
//   ocnj/roadmap-part{1,2}.js               (Tuần 1–6 / 7–12)       — 48 mục
```

3. Hai dòng "LƯU Ý" về id — thêm `oc-w1` vào danh sách id tuần (sau `jc-w1`) và `oc-w1-1` vào danh sách id mục (sau `jc-w1-1`).

- [ ] **Bước 3: Đăng ký track trong mảng `tracks`**

Thêm sau track `jcip`:

```js
  {
    id: "ocnj",
    field: "ocnj",
    label: "Optimizing Java",
    icon: "📈",
    name: "Đọc Optimizing Cloud Native Java (ấn bản 2)",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch 15 chương và năm Phần của sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; mười một tuần có bài thực hành gõ tay — đo phân vị bằng HdrHistogram, đọc `-Xlog:gc*`, đổi collector so pause, bắt deopt bằng `PrintCompilation`, dựng benchmark false sharing bằng JMH, chạy Fighting Animals trong container, cắm Micrometer/Prometheus/OpenTelemetry, lấy flame graph bằng JFR và Async Profiler, và so Fork/Join với virtual thread.",
    prereq: "Yêu cầu: viết và chạy được một ứng dụng Java/Spring Boot thật để có cái mà đo — đây là sách về đo và tối ưu, không phải sách dạy Java. JDK 17 trở lên (tốt nhất JDK 21+ cho chương 13 và 15), Docker chạy được cho chương 8, 9 và 11, và đọc được stack trace. Bộ nguồn không có Phụ lục A (microbenchmarking) và Phụ lục B (danh mục antipattern); phần microbenchmarking được bù bằng JMH ở tuần 1. Sách bám các mốc JDK cụ thể: đọc để hiểu cơ chế, còn cờ JVM và giá trị mặc định thì tra lại theo JDK bạn đang chạy.",
    weeks: [...ocnjWeeksPart1, ...ocnjWeeksPart2],
  },
```

Nếu các track khác có thêm trường nào (ví dụ `path` hay `book`), copy đúng hình dạng của track `jcip` ngay phía trên — **đọc track `jcip` trước khi viết**, đừng chép mù bảng này.

- [ ] **Bước 4: Mở module `roadmap` trong `fields.js`**

Trong `FIELDS.ocnj`, đổi `modules` và xoá dòng chú thích "Module roadmap mở ở Task 9…":

```js
    modules: ["dashboard", "guide", "docs", "roadmap"],
```

- [ ] **Bước 5: Thêm `trackGuides.ocnj` vào `guides.js`**

Đặt sau khối `trackGuides.jcip`:

```js
  ocnj: {
    rhythm: "12 tuần, 4 mục mỗi tuần bám 15 chương theo năm Phần của sách; mười một trong mười hai tuần có bài đo trên máy thật. Đo trước (30 phút) → đọc chương giải thích con số vừa đo (45–60 phút) → làm bài thực hành của tuần → trả lời tự kiểm tra → tick.",
    before: [
      "Một ứng dụng Java hoặc Spring Boot thật đang chạy — mọi tuần đều đo trên nó.",
      "Một cách sinh tải lặp lại được (script curl, k6, JMeter): tuần 1 dựng nó, mười một tuần sau dùng lại.",
      "JDK 17 trở lên; JDK 21+ cho chương 13 và 15 (virtual thread, structured concurrency, scoped values).",
      "Docker chạy được: tuần 7 đóng gói container, tuần 9 dựng Prometheus và OpenTelemetry Collector.",
      "Biết trước rằng Phụ lục A (microbenchmarking) và Phụ lục B (danh mục antipattern) không có trong bộ nguồn; phần microbenchmarking được bù bằng JMH ở tuần 1.",
    ],
    during: [
      "Tuần 1 là trọn Phần I và là tuần quan trọng nhất: nó dạy đo cho đúng trước khi bạn kịp chỉnh bất cứ thứ gì.",
      "Giữ lại mọi kết quả đo. GC log tuần 3 được giải thích bằng lý thuyết tuần 4; flame graph tuần 10 chỉ có nghĩa khi đặt cạnh số liệu tuần 1.",
      "Tuần 8 không có bài gõ tay — đó là tuần thiết kế observability trên giấy, và kế hoạch viết ra ở đó chính là bài thực hành của tuần 9.",
      "Ví dụ Fighting Animals mở ở tuần 7 và khép lại ở tuần 12: đừng bỏ nó giữa chừng.",
      "Cờ JVM và giá trị mặc định trong sách gắn với một mốc JDK cụ thể. Đọc để hiểu cơ chế, rồi tra lại theo JDK của bạn — HotSpot GC Tuning Guide ở chân thanh bên.",
    ],
    after: [
      "Chạy lại phép đo của tuần 1 trên chính ứng dụng đó và so với con số ban đầu; giải thích mọi chênh lệch bằng từ vựng của sách.",
      "Sang lĩnh vực Java & Spring Boot Scalability — chặng tiếp theo trên con đường Java Backend, nơi kỷ luật đo lường này được áp vào bài toán Tomcat và pool sizing thật.",
      "Đọc Modern Concurrency in Java để đi sâu phần virtual thread mà chương 13 và 15 chỉ mở đầu.",
    ],
  },
```

- [ ] **Bước 6: Viết lại `fieldGuides.ocnj.steps` để trỏ track**

Thay nguyên mảng `steps` viết ở Task 2 bằng mảng dưới đây. Ranh giới `pct` rơi đúng ranh giới Phần của sách (spec §6.1): Phần I hết tuần 1, Phần II hết tuần 6, Phần IV hết tuần 10, Phần V hết tuần 12.

```js
    steps: [
      { id: "oc-1", title: "Chọn ứng dụng để đo và dựng chỗ chạy tải", desc: "Một ứng dụng Java thật của bạn, cộng một cách sinh tải lặp lại được (script curl, k6, JMeter — cái nào cũng được). Tự đánh dấu khi bạn chạy được cùng một kịch bản tải hai lần và ra kết quả tương đương.", done: { kind: "manual" } },
      { id: "oc-2", title: "Tuần 1: Phần I — đo cho đúng trước khi chỉnh bất cứ thứ gì", desc: "Bảy đại lượng quan sát được, cách đọc đồ thị, bảy loại kiểm thử, thống kê phi chuẩn và bốn thiên kiến nhận thức. Đây là tuần duy nhất bảo vệ bạn khỏi việc chỉnh cờ JVM theo cảm giác — xong tuần này bạn báo cáo p99 thay vì trung bình.", href: "#/roadmap/ocnj", done: { kind: "track", id: "ocnj", pct: 8 } },
      { id: "oc-3", title: "Tuần 2–6: Phần II — xuống dưới nắp JVM", desc: "Tổng quan JVM, hai chương garbage collection, thực thi mã và JIT, rồi phần cứng cùng hệ điều hành. Phần dày nhất của sách và cũng là phần trả lời nhiều câu hỏi hiệu năng nhất. Kết thúc tuần 6 bạn đọc được một tệp GC log mà không cần tra cứu.", href: "#/roadmap/ocnj", done: { kind: "track", id: "ocnj", pct: 50 } },
      { id: "oc-4", title: "Tuần 7–10: Phần III và IV — chạy trên cloud rồi quan sát nó", desc: "Đóng gói và triển khai (Compose, Kubernetes, canary, container với GC), rồi dựng observability và profiling. Kết thúc tuần 10 ứng dụng của bạn chạy trong container có giới hạn bộ nhớ, xuất metric ra Prometheus, và bạn lấy được flame graph của nó.", href: "#/roadmap/ocnj", done: { kind: "track", id: "ocnj", pct: 83 } },
      { id: "oc-5", title: "Tuần 11–12: Phần V — concurrency, hệ phân tán và tương lai JVM", desc: "Amdahl, java.util.concurrent, Fork/Join và virtual thread; rồi CAP, Paxos/Raft, và ba dự án Panama/Leyden/Valhalla. Tuần 12 khép lại ví dụ Fighting Animals mở từ tuần 7.", href: "#/roadmap/ocnj", done: { kind: "track", id: "ocnj", pct: 100 } },
    ],
```

- [ ] **Bước 7: Thêm số đếm lộ trình vào `check-data.mjs`**

Cạnh `"docs:ocnj": 15`:

```js
    "roadmap-items:ocnj": 48,
```

- [ ] **Bước 8: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Nếu đỏ:
- **#7 / #7b** — Bước 3 và Bước 4 phải cùng lúc.
- **#3b** — một `#/docs/ocnj-NN` trong lộ trình trỏ sai; chạy lại script tự kiểm của Task 3–8.
- **G2** — thiếu `trackGuides.ocnj` (Bước 5) hoặc thừa khoá cho track không tồn tại.
- **G3** — `steps[].href` hoặc `done` sai hình dạng (Bước 6).
- **N3** — quên Bước 7.

- [ ] **Bước 9: Xác nhận số liệu toàn hệ thống**

```bash
node --input-type=module -e '
import { allDocs, allTracks } from "./webapp/js/data/index.js";
import { FIELD_ORDER } from "./webapp/js/data/fields.js";
const items = allTracks.reduce((n,t)=>n+t.weeks.reduce((m,w)=>m+w.items.length,0),0);
const t = allTracks.find(x => x.id === "ocnj");
console.log("lĩnh vực:", FIELD_ORDER.length, "(kỳ vọng 13)");
console.log("tài liệu:", allDocs.length, "(kỳ vọng 242)");
console.log("track:", allTracks.length, "(kỳ vọng 20)");
console.log("mục lộ trình:", items, "(kỳ vọng 946)");
console.log("track ocnj:", t.weeks.length, "tuần,", t.weeks.reduce((m,w)=>m+w.items.length,0), "mục (kỳ vọng 12 / 48)");
'
```

- [ ] **Bước 10: Commit**

```bash
git add -A
git commit -m "feat(ocnj): bật lộ trình đọc Optimizing Cloud Native Java — 12 tuần / 48 mục

Track thứ 20 của DevPrep, tiền tố id oc-. Mốc % của fieldGuides.steps rơi
đúng ranh giới năm Phần của sách (Phần I hết tuần 1, Phần II hết tuần 6,
Phần IV hết tuần 10). Module roadmap của lĩnh vực mở cùng commit này —
bất biến #7/#7b không cho tách.

Số liệu: 13 lĩnh vực, 242 tài liệu, 20 track, 946 mục lộ trình."
```

---

## Task 10: Liên kết chéo và cập nhật tài liệu

**Files:**
- Modify: `webapp/js/data/related.js`, `README.md`, `sources/README.md`

**Interfaces:**
- Consumes: doc id `ocnj-01`…`ocnj-15` từ Task 2; track `ocnj` từ Task 9.
- Produces: không gì (task cuối).

- [ ] **Bước 1: Thêm 15 khoá vào `related.js`**

Khai **một chiều** từ `ocnj`; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Thêm khối này với dòng phân nhóm như các khối khác trong tệp:

```js
  // ---- Optimizing Cloud Native Java ↔ WGJD (nội tại JVM), sysprog (kernel),
  //      java (ứng dụng), jcip & modern-concurrency (concurrency), ddia & kafka (phân tán) ----
  "ocnj-01": ["wgjd-07", "java-07"],              // bảy đại lượng ↔ hiệu năng Java; ↔ capacity planning dùng chính chúng
  "ocnj-02": ["wgjd-07", "wgjd-13"],              // phương pháp luận đo ↔ đo hiệu năng; ↔ nền tảng kiểm thử
  "ocnj-03": ["wgjd-04", "wgjd-17"],              // classloading, bytecode, JIT ↔ class file; ↔ nội tại JVM hiện đại
  "ocnj-04": ["wgjd-17", "sysprog-05"],           // TLAB, allocation ↔ nội tại JVM; ↔ bộ cấp phát bộ nhớ tầng C
  "ocnj-05": ["wgjd-12"],                         // GC ergonomics ↔ chạy Java trong container
  "ocnj-06": ["wgjd-04", "wgjd-17"],              // JIT, code cache, AOT ↔ bytecode; ↔ nội tại JVM hiện đại
  "ocnj-07": ["sysprog-06", "sysprog-10"],        // cache, context switch ↔ luồng và lập lịch kernel
  "ocnj-08": ["wgjd-12"],                         // image, container, mạng ↔ chạy Java trong container
  "ocnj-09": ["wgjd-12", "java-01"],              // triển khai, canary ↔ container; ↔ hành trình một request
  "ocnj-10": ["java-02"],                         // chẩn đoán hệ phân tán ↔ giải phẫu các timeout
  "ocnj-11": ["java-02", "java-06"],              // Micrometer, OTel ↔ đặt ngưỡng timeout bằng số thật; ↔ TaskQueue sinh ra metric pool
  "ocnj-12": ["java-04", "wgjd-07"],              // JFR, safepointing bias ↔ đọc thread dump; ↔ đo hiệu năng
  "ocnj-13": ["jcip-11", "modconc-02", "java-05"],// Amdahl, CAS, virtual thread ↔ ba tầng khác của cùng câu hỏi
  "ocnj-14": ["ddia-10", "kafka-06"],             // CAP, Paxos, Raft ↔ nhất quán và consensus; ↔ nội tại Kafka
  "ocnj-15": ["modconc-04", "modconc-05", "wgjd-18"], // structured concurrency, scoped values ↔ hai chương chuyên đề; ↔ Java trong tương lai
```

Hai khoá cuối của `ocnj-14` là **xuyên con đường** (sang `data`) — có tiền lệ `java-02` → `kafka-07` và `java-10` → `ddia-08`. Bất biến R1 chỉ chặn liên kết **cùng lĩnh vực**.

- [ ] **Bước 2: Cập nhật `README.md` gốc — bốn chỗ**

1. **Cây thư mục** (quanh dòng 88): thêm `ocnj/` vào dòng liệt kê các thư mục con của `sources/`, sau `jcip/`.
2. **Đoạn liệt kê bản dịch** (dòng 103): thêm `bản dịch **Optimizing Cloud Native Java**,` sau `bản dịch **Java Concurrency in Practice**,`; và sửa `cả mười hai lĩnh vực` → `cả mười ba lĩnh vực`.
3. **Bảng nguồn**: thêm hàng sau hàng `sources/jcip/`:

```markdown
| [`sources/ocnj/`](./sources/ocnj/) | Bản dịch tiếng Việt *Optimizing Cloud Native Java*, ấn bản 2 (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. Đủ 15 chương, 116 hình. Phụ lục A (microbenchmarking) và B (danh mục antipattern) không có trong bộ nguồn. Đọc trong app ở lĩnh vực Optimizing Cloud Native Java, kèm lộ trình đọc 12 tuần. |
```

4. **Hàng `webapp/`** (dòng 124): sửa các số — `12 lĩnh vực` → `13 lĩnh vực` (**hai chỗ trong cùng câu**), `19 giáo trình, 898 mục` → `20 giáo trình, 946 mục`, `227 tài liệu` → `242 tài liệu`.

Kiểm lại bằng:

```bash
grep -n "mười hai\|12 lĩnh vực\|227 tài liệu\|19 giáo trình\|898 mục" README.md
```

Kỳ vọng: không dòng nào.

- [ ] **Bước 3: Cập nhật `sources/README.md`**

Thêm hàng vào bảng "Bản đồ hiện tại", sau hàng `jcip`:

```markdown
| `ocnj` | `ocnj/` | Bản dịch *Optimizing Cloud Native Java* 2e (Evans, Gough, Newland — O'Reilly) — 15 chương, 116 ảnh, PDF |
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Nếu **R1** đỏ: một id trong Bước 1 không tồn tại, tự trỏ, lặp, hoặc cùng lĩnh vực — đọc tên id mà bất biến in ra.

- [ ] **Bước 5: Kiểm bằng mắt trong app**

```bash
webapp/scripts/dev.sh
```

Mở app, chọn lĩnh vực **Optimizing Cloud Native Java**, xác nhận:

- Thanh bên có đúng 4 mục: Bảng điều khiển, Hướng dẫn học, Lộ trình học, Tài liệu.
- Thư viện hiện **15 tài liệu gom thành năm nhóm Phần** (I Nền tảng hiệu năng · II Nội tại JVM · III Cloud Native · IV Observability và Profiling · V Đồng thời và Phân tán), nhãn dạng "Ch. N · …".
- Mở `ocnj-02` (13 ảnh, nhiều nhất) — ảnh hiện đủ. Mở `ocnj-08` và `ocnj-09` (3 ảnh mỗi chương, ít nhất) — không vỡ bố cục.
- Mở `ocnj-09` và `ocnj-11` — khối mã YAML/Dockerfile/Prometheus render đúng, các dòng bắt đầu bằng `#` trong khối mã **không** bị biến thành tiêu đề.
- Lộ trình hiện 12 tuần, mỗi tuần 4 mục; mở tuần 8 xác nhận `practice` giải thích vì sao tuần đó không có bài gõ tay.
- Chân thanh bên có link "docs.oracle.com — HotSpot GC Tuning Guide".
- Thẻ Con đường trên bảng điều khiển hiện OCNJ ở **chặng 5 trên 8** của Java Backend.
- Mở một tài liệu có liên kết chéo (ví dụ `ocnj-13`) và xác nhận khối "đọc liên quan" hiện JCiP, Modern Concurrency và Java.

- [ ] **Bước 6: Commit**

```bash
git add -A
git commit -m "feat(ocnj): liên kết chéo và cập nhật tài liệu repo

15 khoá / 29 liên kết một chiều từ ocnj sang wgjd, sysprog, java, jcip,
modern-concurrency, ddia và kafka. Mắt xích đáng giá nhất: ocnj-13 → jcip-11,
cùng câu hỏi 'vì sao thêm thread không cho thêm throughput' nhìn từ hai cuốn
cách nhau gần hai thập kỷ.

README gốc và sources/README.md cập nhật số liệu: 13 lĩnh vực, 242 tài liệu,
20 track, 946 mục lộ trình."
```

---

## Kiểm chứng cuối cùng

Sau Task 10, chạy một lần nữa từ gốc repo:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: `49/49 bất biến đạt` và `Dữ liệu hợp lệ.`

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Lĩnh vực | 12 | **13** |
| Tài liệu | 227 | **242** |
| Track lộ trình | 19 | **20** |
| Mục lộ trình | 898 | **946** |
| Markdown trong `content/` | 238 | **253** |
| Ảnh trong `content/` | 1088 | **1204** |
