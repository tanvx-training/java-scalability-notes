# Tích hợp *Optimizing Cloud Native Java* vào DevPrep — thiết kế

Ngày: 2026-09-07
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `ocnj`

Khuôn mẫu trực tiếp: [`2026-09-07-jcip-integration-design.md`](2026-09-07-jcip-integration-design.md)
và [`2026-09-07-wgjd-integration-design.md`](2026-09-07-wgjd-integration-design.md).

## 1. Bối cảnh

Repo nhận thêm thư mục `Optimizing Cloud Native Java/` ở gốc: 15 PDF chương và một thư mục `vi/`
chứa 15 tệp markdown bản dịch tiếng Việt *Optimizing Cloud Native Java, 2nd Edition*
(Benjamin J. Evans, James Gough, Chris Newland — O'Reilly), kèm 116 ảnh và một `README.md` mục lục.
Nội dung **đã dịch xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

Số liệu đã đo, không ước lượng:

| Chỉ số | OCNJ | JCiP (đối chiếu) | WGJD (đối chiếu) |
|---|---:|---:|---:|
| Số tệp | **15** (chương 1–15, không thiếu chương nào) | 14 | 16 |
| Tổng số từ | **156.555** | 109.417 | 215.650 |
| Trung bình mỗi chương | 10.437 | 7.815 | 13.478 |
| Chương nặng nhất | ch.13 Kỹ thuật hiệu năng đồng thời — 16.310 | ch.11 — 11.524 | ch.11 — 18.810 |
| Chương nhẹ nhất | ch.8 Thành phần của Cloud Stack — 6.628 | phụ lục A — 694 | ch.8 — 9.561 |
| Số ảnh | **116** | 204 | 93 |

Toàn vẹn ảnh đã kiểm: **116 tệp, 116 lượt tham chiếu, 0 gãy, 0 mồ côi.**

Số liệu từng chương (dùng để cân nhịp tuần ở §6 và viết `desc` ở §5):

| Ch. | Từ | Ảnh | Mục cấp hai | Ch. | Từ | Ảnh | Mục cấp hai |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 6.947 | 6 | 7 | 9 | 9.066 | 3 | 5 |
| 2 | 12.038 | 13 | 8 | 10 | 11.583 | 10 | 6 |
| 3 | 10.651 | 6 | 9 | 11 | 11.779 | 7 | 7 |
| 4 | 9.973 | 12 | 7 | 12 | 10.116 | 11 | 7 |
| 5 | 11.006 | 12 | 8 | 13 | 16.310 | 8 | 10 |
| 6 | 12.385 | 8 | 5 | 14 | 10.472 | 4 | 5 |
| 7 | 9.372 | 9 | 6 | 15 | 8.229 | 4 | 5 |
| 8 | 6.628 | 3 | 6 | | | | |

Nền trước khi bắt đầu (đã chạy `check-data.mjs`): **49/49 bất biến đạt, 12 lĩnh vực, 227 tài
liệu, 19 track, 898 mục lộ trình.** Sau đợt này: **13 lĩnh vực, 242 tài liệu, 20 track, 946 mục.**

### 1.1 Nguồn đủ 15 chương, nhưng thiếu hai phụ lục — lỗ hổng HỆ QUẢ NHẸ

Khác WGJD (thiếu ch.9–10) và JCiP (thiếu ch.1, 9, 12), bản dịch này **đủ cả 15 chương và không có
chương nào vắng**. Lỗ hổng duy nhất nằm ở hai phụ lục: `vi/README.md` ghi rõ *"Các tham chiếu chéo
tới Phụ lục A (microbenchmarking/JMH) và Phụ lục B (danh mục antipattern) được giữ nguyên; hai phụ
lục này không có trong bộ PDF nguồn."*

Đếm toàn bộ tham chiếu ngược trong 15 tệp:

| Phụ lục vắng | Số lần nhắc | Ở đâu | Bản chất tham chiếu |
|---|---:|---|---|
| A — Microbenchmarking và JMH | 2 | ch.2 (§Nhập môn Best Practice), ch.13 | Sách **cố ý** đẩy microbenchmarking ra phụ lục: ch.2 nói thẳng *"để cố ý giảm bớt sự nhấn mạnh vào nó, chúng tôi hoàn toàn không thảo luận về microbenchmarking trong phần thân chính"*. Vắng phụ lục A không làm hổng lập luận nào của phần thân. |
| B — Danh mục antipattern | 5 | ch.2 (×3), ch.4, ch.12 | Là **danh mục tra cứu**, không phải lập luận. Nguyên nhân sinh ra antipattern đã nằm trọn trong phần thân ch.2 (§Nguyên nhân của các Antipattern về hiệu năng); phụ lục B chỉ liệt kê thêm ví dụ đặt tên (*Distracted by Shiny*…). |

Tổng 7 tham chiếu, **không chương nào phụ thuộc** vào hai phụ lục để đọc hiểu được.

**Quyết định:** không suy đoán nội dung hai phụ lục vào bất kỳ đâu. Ghi lỗ hổng ở **hai chỗ** —
`desc` của lĩnh vực và `prereq` của track — và bù riêng phụ lục A bằng **một tài nguyên ngoài ở W1**
(§6.3), vì viết được microbenchmark đúng cách là kỹ năng thực dụng mà một lộ trình về đo hiệu năng
không nên bỏ trống. Không bù phụ lục B: danh mục tên gọi không phải kiến thức thiếu.

### 1.2 Nguồn có README, và đó là **bằng chứng duy nhất** về tên năm Phần

`Optimizing Cloud Native Java/vi/README.md` là mục lục đầy đủ do người dịch viết: nó ghi tên năm
Phần cùng ranh giới chương. Đây là điểm khác biệt thực chất so với WGJD và JCiP — hai nguồn đó
không có README nên buộc phải để `part: null`.

Quy ước `sources/README.md` nói `part` lấy từ README nguồn, **không bịa**. Ở đây README nguồn có
thật, nên `part` **điền được** cho cả 15 tài liệu (§5.1). Không suy thêm gì ngoài README đó.

`sources/ocnj/README.md` vẫn phải **viết mới** theo khuôn README các nguồn khác (tác giả, ấn bản,
bản quyền, số chương/ảnh, vị trí PDF) — README của người dịch là mục lục, không phải README nguồn
theo quy ước repo. Nội dung mục lục của nó được giữ lại và mở rộng, không xoá (§3.2).

### 1.3 Mỗi tệp có đúng một H1 — đừng "sửa" các dòng `#` trong khối mã

`grep -c '^# '` trên ch.8, 9, 11 và 14 trả về 3, 6, 32 và 9. Đã kiểm bằng bộ đếm hàng rào ```` ``` ````:
**mọi dòng thừa đều nằm trong khối mã** — chú thích YAML của Docker Compose, chú thích Dockerfile,
chú thích trong đầu ra Prometheus và cấu hình Kafka. Mỗi tệp có đúng **một** H1 thật ở dòng 1.

Ghi lại ở đây để lần sau không ai chạy một `grep` tham lam rồi đi "chuẩn hoá tiêu đề" trong khối mã.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `ocnj`, không gộp vào `wgjd` | Cùng tác giả chính (Benjamin J. Evans) nhưng khác sách, khác mục đích: WGJD là sách nghề rộng, OCNJ là sách hiệu năng sâu. 156.555 từ / 15 tệp xếp thứ năm về khối lượng trong repo, sau DDIA (295.193), WGJD (215.650), MJiA (213.929) và Kafka (175.089). Tiền lệ nhiều nguồn duy nhất là `kubernetes`, nơi cả 4 nguồn cùng phục vụ luyện thi chứng chỉ — không đúng ở đây. Gộp cũng sẽ phá đánh số `wgjd-NN`. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap"]` | Đồng khuôn 8 lĩnh vực sách hiện có. Không làm flashcards/quiz đợt này. |
| 3 | Doc id `ocnj-01`…`ocnj-15`, liền mạch, **không lỗ hổng** | Bản dịch đủ 15 chương. Số id khớp số chương sách, như mọi lĩnh vực sách khác. |
| 4 | **Điền `part`** cho cả 15 tài liệu, lấy nguyên tên năm Phần từ `vi/README.md` | §1.2. Đây là lĩnh vực sách đầu tiên từ sau `ddia`/`modern-java` có bằng chứng đủ để điền. |
| 5 | Không tạo bản ghi cho phụ lục A/B | Không có nội dung để trỏ tới. Không bịa tài liệu rỗng. |
| 6 | Slug tệp **tiếng Việt** không dấu, chữ thường | Tiêu đề chương của bản dịch **đã dịch** ("Chương 4. Tìm hiểu về Garbage Collection"), nên slug tiếng Việt bám sát nguồn. Tiền lệ `ddia`, `kafka` (chương dịch → slug Việt) đối lại `wgjd`, `jcip` (chương giữ tên Anh → slug Anh). |
| 7 | Vị trí trên con đường Java Backend: **sau `jcip`, trước `java`** | Ch.1–2 dạy kỷ luật đo lường phải có TRƯỚC khi tới capacity planning ở `java-07`/`java-08`. Ch.3–7 đào sâu đúng chỗ `wgjd` ch.4/7 chỉ lướt. Ch.13 dựa trên JMM và Executor mà `jcip` vừa dạy. Nông → sâu → ứng dụng. |
| 8 | Lộ trình **12 tuần / 48 mục**, tuyến tính theo thứ tự sách, cân theo số từ | 13,0k từ/tuần — dưới trung vị repo (~15k) vì sách dày đặc khái niệm **và** nhiều tuần phải gõ tay công cụ thật. Ranh giới năm Phần rơi đúng vào ranh giới tuần (§6). |
| 9 | Ghi lỗ hổng phụ lục ở hai chỗ + một tài nguyên ngoài bù phụ lục A | §1.1. Lỗ hổng đã đo là nhẹ, không cần ba chỗ như WGJD. |
| 10 | Ảnh giữ nguyên bố cục `images/chN/` (một chữ số, không đệm 0) | Giống `ddia`. Sắp xếp lại sẽ gãy toàn bộ 116 tham chiếu tương đối, đổi lấy đúng một chút nhất quán hình thức. |
| 11 | `externalRef` = HotSpot GC Tuning Guide | §4.1. |
| 12 | Chia 6 chặng, mỗi chặng `check-data.mjs` xanh | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu (#7), và có dữ liệu thì phải khai module (#7b). |

## 3. Nguồn: chuẩn hoá `sources/ocnj/`

`git mv` thư mục `Optimizing Cloud Native Java/` thành `sources/ocnj/`, **nâng nội dung `vi/` lên
một cấp** (bản dịch nằm thẳng trong `sources/ocnj/`, không giữ cấp trung gian `vi/` — quy ước
`sources/README.md` chỉ cho phép cấp con khi lĩnh vực có nhiều nguồn), đổi tên 15 tệp markdown
theo quy ước `NN-slug.md`, rồi chuyển 15 PDF vào `sources/ocnj/pdf/` theo cùng slug. `images/` đi
cùng. Giữ nguyên nội dung — **không sửa một ký tự nào**: đường dẫn ảnh là tương đối theo tệp chứa,
và `images/` di chuyển cùng các tệp `.md`.

Tiêu đề dưới đây trích **nguyên văn từ dòng H1 của từng tệp dịch**, không dịch lại. `title` trong
`docs.js` bỏ tiền tố "Chương N. " vì nhãn "Ch. N · …" do `labels.js` sinh (bất biến D1).

| # | `.md` mới | H1 trong bản dịch | `title` trong `docs.js` |
|---:|---|---|---|
| 01 | `01-dinh-nghia-toi-uu-hoa-va-hieu-nang.md` | Chương 1. Định nghĩa về Tối ưu hóa và Hiệu năng | Định nghĩa về Tối ưu hóa và Hiệu năng |
| 02 | `02-phuong-phap-luan-kiem-thu-hieu-nang.md` | Chương 2. Phương pháp luận Kiểm thử Hiệu năng | Phương pháp luận Kiểm thử Hiệu năng |
| 03 | `03-tong-quan-ve-jvm.md` | Chương 3. Tổng quan về JVM | Tổng quan về JVM |
| 04 | `04-tim-hieu-garbage-collection.md` | Chương 4. Tìm hiểu về Garbage Collection | Tìm hiểu về Garbage Collection |
| 05 | `05-garbage-collection-nang-cao.md` | Chương 5. Garbage Collection nâng cao | Garbage Collection nâng cao |
| 06 | `06-thuc-thi-ma-tren-jvm.md` | Chương 6. Thực thi mã trên JVM | Thực thi mã trên JVM |
| 07 | `07-phan-cung-va-he-dieu-hanh.md` | Chương 7. Phần cứng và Hệ điều hành | Phần cứng và Hệ điều hành |
| 08 | `08-thanh-phan-cua-cloud-stack.md` | Chương 8. Các thành phần của Cloud Stack | Các thành phần của Cloud Stack |
| 09 | `09-trien-khai-java-tren-cloud.md` | Chương 9. Triển khai Java trên Cloud | Triển khai Java trên Cloud |
| 10 | `10-gioi-thieu-ve-observability.md` | Chương 10. Giới thiệu về Observability | Giới thiệu về Observability |
| 11 | `11-trien-khai-observability-trong-java.md` | Chương 11. Triển khai Observability trong Java | Triển khai Observability trong Java |
| 12 | `12-profiling.md` | Chương 12. Profiling | Profiling |
| 13 | `13-ky-thuat-hieu-nang-dong-thoi.md` | Chương 13. Kỹ thuật hiệu năng đồng thời | Kỹ thuật hiệu năng đồng thời |
| 14 | `14-ky-thuat-va-mau-hinh-he-phan-tan.md` | Chương 14. Kỹ thuật và Mẫu hình cho Hệ phân tán | Kỹ thuật và Mẫu hình cho Hệ phân tán |
| 15 | `15-hieu-nang-hien-dai-va-tuong-lai.md` | Chương 15. Hiệu năng hiện đại và Tương lai | Hiệu năng hiện đại và Tương lai |

PDF đổi tên theo cùng slug: `1. Optimization and Performance Defined _ Optimizing Cloud Native
Java, 2nd Edition.pdf` → `pdf/01-dinh-nghia-toi-uu-hoa-va-hieu-nang.pdf`, và tương tự cho 14 tệp
còn lại. Lưu ý tên PDF gốc là **tiếng Anh** và chương một chữ số **không** có số 0 đứng đầu
(`1. …`, `2. …`), còn slug đích là **tiếng Việt** và **có** đệm 0 (`01-…`) — khớp quy ước `NN-slug`
và khớp tên tệp markdown tương ứng. Đây là chỗ dễ ghép nhầm nhất của chặng 1: ghép theo **số
chương**, không theo thứ tự sắp xếp chuỗi (`ls` xếp `10.` ngay sau `1.`).

Sau khi `git mv` xong, thư mục `Optimizing Cloud Native Java/` biến mất hoàn toàn.

Trước khi đổi tên, xác nhận không nơi nào tham chiếu đường dẫn cũ:

```bash
grep -rn "Optimizing Cloud Native Java/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir=content --exclude-dir="Optimizing Cloud Native Java" .
```

**Đã chạy ở bước thiết kế: không dòng nào.** Dùng dấu `/` cuối mẫu để chỉ bắt tham chiếu **đường
dẫn**, không bắt tên sách trong văn xuôi. Loại trừ cả `content/` vì đó là ảnh gương do
`build-content.sh` sinh, không phải nguồn.

### 3.1 Ảnh — bố cục theo chương, giống DDIA

116 ảnh nằm trong `images/chN/` (một chữ số, **không** đệm 0: `ch1`, `ch2`, …, `ch15`). Phân bố đã
đếm:

| ch.1 | ch.2 | ch.3 | ch.4 | ch.5 | ch.6 | ch.7 | ch.8 | ch.9 | ch.10 | ch.11 | ch.12 | ch.13 | ch.14 | ch.15 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 13 | 6 | 12 | 12 | 8 | 9 | 3 | 3 | 10 | 7 | 11 | 8 | 4 | 4 |

Tổng 116, khớp đúng 116 lượt tham chiếu trong markdown, 0 gãy, 0 mồ côi.

Ghi chú cho người kiểm lại: dùng mẫu khớp đúng cú pháp markdown `!\[[^]]*\]\(images/[^)]+\)`, không
dùng `grep` tham lam dạng `images/[^)]*` — mẫu tham lam sẽ bắt cả những lần văn bản nhắc đường dẫn
trong dấu backtick và cho ra số "ảnh gãy" giả.

### 3.2 `sources/ocnj/README.md` — viết mới, giữ lại mục lục của người dịch

`vi/README.md` hiện có là mục lục 15 chương theo 5 Phần cộng phần "Ghi chú về bản dịch" (quy ước
giữ thuật ngữ tiếng Anh, giữ nguyên mã và cờ JVM, bố cục ảnh, footnote). Nội dung đó **giữ lại**;
README mới bổ sung phần đầu theo khuôn README của các nguồn khác:

- Tên sách, tác giả Benjamin J. Evans, James Gough, Chris Newland — O'Reilly, ấn bản 2.
- Ghi rõ **sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0**.
- 15 chương đầy đủ, 116 ảnh trong `images/chN/`, PDF gốc trong `pdf/` và không vào bản deploy.
- **Ghi rõ Phụ lục A (microbenchmarking/JMH) và Phụ lục B (danh mục antipattern) không có trong bộ
  PDF nguồn**, kèm ghi chú rằng lỗ hổng này đã được đo là nhẹ (§1.1) — 7 tham chiếu, không chương
  nào phụ thuộc vào chúng — và phụ lục A được bù bằng JMH ở tuần 1 của lộ trình.

## 4. Khai lĩnh vực

### 4.1 `webapp/js/data/fields.js`

| Trường | Giá trị |
|---|---|
| `label` | `Optimizing Cloud Native Java` |
| `icon` | `📈` |
| `short` | `OCNJ` |
| `unit` | `Ch.` |
| `certFilter` | `false` |
| `modules` | `["dashboard", "guide", "docs", "roadmap"]` |
| `externalRef` | `{ label: "docs.oracle.com — HotSpot GC Tuning Guide", href: "https://docs.oracle.com/en/java/javase/21/gctuning/" }` |

`desc` (viết liền một dòng khi vào code): *Bản dịch tiếng Việt Optimizing Cloud Native Java, ấn bản
2 (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly) — đủ 15 chương: hệ phân loại hiệu
năng và cách đọc đồ thị, phương pháp luận kiểm thử và thống kê phi chuẩn, nội tại JVM (classloading,
JIT, quản lý bộ nhớ), garbage collection từ mark-and-sweep tới G1/Shenandoah/ZGC, thực thi mã và
AOT/GraalVM, phần cứng và mechanical sympathy, cloud stack và triển khai Java trên Kubernetes,
observability với Micrometer/Prometheus/OpenTelemetry, profiling với JFR và Async Profiler, kỹ
thuật hiệu năng đồng thời, mẫu hình hệ phân tán, và Panama/Leyden/Valhalla. Phụ lục A
(microbenchmarking) và B (danh mục antipattern) không có trong bộ nguồn.*

`externalRef` chọn HotSpot GC Tuning Guide vì garbage collection là chủ đề nặng nhất của sách
(ch.4–5, 20.979 từ và 24 ảnh) và đó là tài liệu tham chiếu chuẩn cho mọi cờ GC sách nhắc tới.
Trùng **tên miền** `docs.oracle.com` với `wgjd` (JVM Specification) nhưng là tài liệu hoàn toàn
khác, nhãn hiển thị cũng khác — đã cân nhắc `opentelemetry.io` (chỉ phủ ch.11) và
`github.com/async-profiler` (chỉ phủ ch.12), cả hai đều hẹp hơn.

`icon` `📈` chưa lĩnh vực, track hay con đường nào dùng (đã kiểm toàn bộ 12 icon lĩnh vực, 19 icon
track và 3 icon con đường).

`FIELD_ORDER` chèn `"ocnj"` ngay sau `"jcip"`.

### 4.2 `webapp/js/data/paths.js`

```js
PATHS.java.fields = ["spring-start", "modern-java", "wgjd", "jcip", "ocnj", "java",
                     "modern-concurrency", "spring-security"];
```

`PATHS.java.desc` hiện viết *"Một nghề, bảy chặng…"* — phải sửa thành **tám chặng** và nêu chặng
mới (đo và tối ưu trên cloud: GC, JIT, observability, profiling), đặt giữa "nền concurrency cổ
điển" và "khả năng mở rộng trên Tomcat". Bất biến P1 kiểm mọi lĩnh vực xuất hiện đúng một lần
trong `PATHS ∪ SPINE`; quên thêm `ocnj` là đỏ ngay.

### 4.3 `webapp/js/data/guides.js`

`fieldGuides.ocnj` — tagline, audience, `hoursPerWeek: "6–8 giờ/tuần · 12 tuần"`, prereqs (viết và
chạy được ứng dụng Java/Spring Boot thật, JDK 17+ và tốt nhất là JDK 21+ cho ch.13/15, Docker chạy
được cho ch.8–9 và ch.11, đọc được stack trace), 5 `steps`, `method`, `pitfalls`, `doneWhen`.

Một `pitfall` bắt buộc nói về **cái bẫy trung tâm của chính cuốn sách**: tối ưu theo trực giác thay
vì theo số đo. Ch.1 mở đầu bằng mục "Hiệu năng Java theo cách sai lầm" và ch.2 dành nguyên một mục
cho thiên kiến nhận thức — người đọc dễ ghi nhớ danh sách cờ JVM rồi đi chỉnh production mà không
đo trước, đúng thứ sách viết ra để chống lại.

Một `pitfall` thứ hai về ranh giới phiên bản: các collector và cờ trong ch.5, con số trong ch.7 và
API trong ch.13/15 gắn với một mốc JDK cụ thể. Đọc để hiểu **cơ chế**, còn cờ và mặc định thì tra
lại theo JDK đang chạy — `externalRef` GC Tuning Guide có sẵn ở chân sidebar cho đúng việc này.

`trackGuides.ocnj` — `rhythm` / `before` / `during` / `after`.

Bất biến G1 bắt buộc: khai module `guide` mà thiếu `fieldGuides` là đỏ; mọi track phải có
`trackGuides`.

## 5. Thư viện tài liệu — `webapp/js/data/ocnj/docs.js`

15 bản ghi theo thứ tự đọc. Mỗi bản ghi: `id`, `field: "ocnj"`, `chapter` (số chương thật), `part`
(§5.1), `title` (chỉ tên chương — xem bảng §3), `file: "content/ocnj/NN-slug.md"`, `icon`, `desc`
(một câu nói chương này trả lời câu hỏi gì), `tags` (3 từ khoá).

### 5.1 `part` — năm Phần, lấy nguyên từ `vi/README.md`

| `part` | Chương |
|---|---|
| `Phần I — Nền tảng hiệu năng` | 1, 2 |
| `Phần II — Nội tại JVM` | 3, 4, 5, 6, 7 |
| `Phần III — Cloud Native` | 8, 9 |
| `Phần IV — Observability và Profiling` | 10, 11, 12 |
| `Phần V — Đồng thời và Phân tán` | 13, 14, 15 |

Chép nguyên chuỗi, kể cả số La Mã và dấu gạch ngang dài — `labels.js` gom nhóm theo so sánh chuỗi.

### 5.2 Mục lục cấp hai — dùng để viết `desc`, đã trích thật

`desc` bám mục lục thật của bản dịch, không suy từ trí nhớ về bản in tiếng Anh. Mục "Tóm tắt" cuối
mỗi chương bỏ khỏi bảng này vì không mang nội dung.

| Ch. | Các mục cấp hai |
|---:|---|
| 1 | Hiệu năng Java theo cách sai lầm · Tổng quan về hiệu năng Java · Hiệu năng như một khoa học thực nghiệm · Một hệ phân loại cho hiệu năng · Đọc đồ thị hiệu năng · Hiệu năng trong hệ thống Cloud |
| 2 | Các loại kiểm thử hiệu năng · Nhập môn Best Practice · Hiệu năng theo hướng Top-Down · Nguyên nhân của các Antipattern về hiệu năng · Thống kê cho hiệu năng JVM · Diễn giải thống kê · Thiên kiến nhận thức và kiểm thử hiệu năng |
| 3 | Thông dịch và nạp lớp · Thực thi Bytecode · Giới thiệu HotSpot · Giới thiệu biên dịch Just-in-Time · Quản lý bộ nhớ trong JVM · Luồng và Java Memory Model · Giám sát và công cụ cho JVM · Các triển khai, bản phân phối và bản phát hành Java |
| 4 | Giới thiệu Mark and Sweep · Giới thiệu HotSpot Runtime · Allocation và Lifetime · Các kỹ thuật GC production trong HotSpot · Các Parallel Collector · Vai trò của Allocation |
| 5 | Đánh đổi và Collector cắm được · Lý thuyết GC đồng thời · G1 · Shenandoah · ZGC · Balanced (Eclipse OpenJ9) · Các collector HotSpot ngách |
| 6 | Vòng đời của một ứng dụng Java truyền thống · Tổng quan về thông dịch Bytecode · Biên dịch JIT trong HotSpot · Sự tiến hóa trong thực thi chương trình Java |
| 7 | Giới thiệu về phần cứng hiện đại · Các tính năng của bộ xử lý hiện đại · Hệ điều hành · Một mô hình hệ thống đơn giản · Mechanical Sympathy |
| 8 | Các chuẩn Java cho Cloud Stack · Ảo hóa · Image và Container · Mạng · Giới thiệu ví dụ Fighting Animals |
| 9 | Làm việc cục bộ với Container · Container Orchestration · Kỹ thuật triển khai · Các mối quan tâm riêng của Java |
| 10 | Observability là gì và tại sao · Ba trụ cột · Các mẫu hình và Antipattern kiến trúc Observability · Chẩn đoán vấn đề ứng dụng bằng Observability · Giải pháp của nhà cung cấp hay OSS? |
| 11 | Giới thiệu Micrometer · Giới thiệu Prometheus cho lập trình viên Java · Giới thiệu OpenTelemetry · OpenTelemetry Tracing trong Java · OpenTelemetry Metrics trong Java · OpenTelemetry Logs trong Java |
| 12 | Giới thiệu về Profiling · Công cụ Profiling dạng GUI · Các Profiler hiện đại · JDK Flight Recorder · Các khía cạnh vận hành của Profiling · Memory Profiling |
| 13 | Giới thiệu về Parallelism · Concurrency Java nền tảng · Tìm hiểu JMM · Xây dựng thư viện Concurrency · Tóm lược về các thư viện Concurrency · Executor và trừu tượng hóa Task · Fork/Join và Parallel Stream · Các kỹ thuật dựa trên Actor · Virtual Thread |
| 14 | Cấu trúc dữ liệu phân tán cơ bản · Giao thức đồng thuận · Ví dụ về hệ phân tán · Nâng cấp Fighting Animals |
| 15 | Các mẫu hình Concurrency mới · Panama · Leyden · Valhalla · Kết luận |

`docs-index.js`: thêm `import { docs as ocnj } from "./ocnj/docs.js";` và `...ocnj,` trong mảng.

## 6. Lộ trình đọc — track `ocnj`

Track id `ocnj`, week id `oc-w1`…`oc-w12`, item id `oc-w<N>-<M>`. Tiền tố `oc-` chưa ai dùng (đã có
`w`, `cka-`, `cks-`, `sp-`, `kb-`, `cb-`, `ku-`, `ss-`, `mc-`, `dd-`, `mj-`, `kf-`, `sh-`, `wg-`,
`jc-`, `sj-gd*-` — đã kiểm bằng cách liệt kê tiền tố id tuần của cả 19 track).
**Id là khoá lưu tiến độ trong localStorage — không được đổi về sau.**

4 mục mỗi tuần, tách hai tệp: `ocnj/roadmap-part1.js` (W1–6, 24 mục) và `ocnj/roadmap-part2.js`
(W7–12, 24 mục).

| Tuần | Chương | Từ | Phần | Trọng tâm |
|---|---|---:|---|---|
| W1 | 1 + 2 | 18.985 | I | Hệ phân loại hiệu năng (throughput, latency, capacity, utilization, efficiency, scalability, degradation), đọc đồ thị; các loại test, top-down, thống kê phi chuẩn và phân vị, thiên kiến nhận thức |
| W2 | 3 | 10.651 | II | Classloading, thực thi bytecode, HotSpot, JIT, quản lý bộ nhớ, JMM, công cụ giám sát, các bản phân phối Java |
| W3 | 4 | 9.973 | II | Mark and sweep, oop và HotSpot runtime, allocation và lifetime, weak generational hypothesis, TLAB, parallel collector |
| W4 | 5 | 11.006 | II | Safepoint, tri-color marking, G1, Shenandoah, ZGC, Balanced (OpenJ9), các collector ngách |
| W5 | 6 | 12.385 | II | Vòng đời ứng dụng Java, thông dịch bytecode, JIT trong HotSpot, code cache, tinh chỉnh JIT, AOT, Quarkus, GraalVM |
| W6 | 7 | 9.372 | II | Cache bộ nhớ và MESI, branch prediction, mô hình bộ nhớ phần cứng, scheduler và context switch, mechanical sympathy |
| W7 | 8 + 9 | 15.694 | III | MicroProfile và CNCF, ảo hóa, image và container, mạng, ví dụ Fighting Animals; Docker Compose, Tilt, Kubernetes, blue/green, canary, feature flag, container và GC |
| W8 | 10 | 11.583 | IV | Ba trụ cột (metrics, logs, traces), mẫu hình và antipattern kiến trúc, chẩn đoán sự cố hệ phân tán, vendor hay OSS |
| W9 | 11 | 11.779 | IV | Micrometer, Prometheus cho lập trình viên Java, OpenTelemetry tracing / metrics / logs, OTel Collector |
| W10 | 12 | 10.116 | IV | VisualVM và JMC, safepointing bias, perf, Async Profiler, JFR, Cryostat, khía cạnh vận hành, memory profiling và heap dump |
| W11 | 13 | 16.310 | V | Định luật Amdahl, JMM, method/var handle, atomic và CAS, `java.util.concurrent`, Executor, Fork/Join và parallel stream, actor, virtual thread |
| W12 | 14 + 15 | 18.701 | V | WAL, two-phase commit, partitioning, CAP, Paxos, Raft, Cassandra, Infinispan, Kafka, nâng cấp Fighting Animals; structured concurrency, scoped values, Panama, Leyden, Valhalla |

Tổng cột "Từ" bằng đúng 156.555 — không tuần nào được làm tròn cho vừa. Trung bình 13,0k từ/tuần;
biên độ 9.372–18.985.

### 6.1 Ranh giới năm Phần rơi đúng vào ranh giới tuần

Không phải sắp đặt, mà là hệ quả của việc cân theo số từ: Phần I = W1, Phần II = W2–6, Phần III =
W7, Phần IV = W8–10, Phần V = W11–12. Nhờ vậy `fieldGuides.ocnj.steps` có thể gom theo Phần mà
không cắt ngang tuần nào, và `%` hoàn thành của mỗi `step` rơi vào ranh giới tự nhiên.

### 6.2 Ba chỗ ghép đôi chương — lý do nội dung, không phải để cho vừa số

- **W1 (ch.1 + ch.2):** trọn Phần I. Ch.1 định nghĩa bảy đại lượng và dạy đọc đồ thị; ch.2 dạy cách
  đo bảy đại lượng đó cho đúng. Đọc rời hai chương này để lại một tuần chỉ có định nghĩa mà chưa
  đo được gì. Ch.1 cũng là chương khái niệm nhẹ nhất sách (6.947 từ, 7 mục cấp hai, không công
  thức) nên gánh nặng thực của W1 thấp hơn con số 18.985 gợi ý.
- **W7 (ch.8 + ch.9):** trọn Phần III. Ví dụ Fighting Animals được **giới thiệu** ở §8.5 rồi
  **triển khai** ngay ở ch.9. Tách hai chương làm người học dựng xong hệ thống ví dụ ở tuần này
  rồi tuần sau mới chạy nó.
- **W12 (ch.14 + ch.15):** đóng Phần V. Ch.14 kết thúc bằng "Nâng cấp Fighting Animals" — chốt lại
  ví dụ xuyên suốt từ ch.8; ch.15 là chương tổng kết hướng tương lai, đọc nhẹ (khảo sát Panama /
  Leyden / Valhalla, không có bài tập đo). Ghép hai chương này cho lộ trình một tuần kết thúc thật
  sự thay vì một tuần lẻ chỉ có phần kết luận.

Đã thử mọi cách chọn 3 cặp khác. Giữ W1 nhẹ buộc phải ghép ch.4 + ch.5 (20.979 từ) — vừa nặng hơn
W1 hiện tại, vừa cắt đôi mạch GC mà sách cố ý trải qua hai chương. Phương án đang chọn có tuần
nặng nhất **thấp nhất** trong các phương án 12 tuần.

### 6.3 Bù phụ lục A ở W1

`resources` của W1 thêm một mục ngoài: **JMH** (`https://github.com/openjdk/jmh`) — bộ công cụ
microbenchmark của OpenJDK, chính là chủ đề phụ lục A vắng mặt.

Đặt ở W1 chứ không muộn hơn vì đó là nơi ch.2 §"Nhập môn Best Practice" nhắc tới phụ lục A, và vì
kỷ luật "đừng microbenchmark khi chưa biết mình đang đo gì" phải đến trước mọi con số ở các chương
sau. Nối tiếp: bài thực hành W6 (false sharing) dùng lại chính JMH.

Mục tiêu không phải "học JMH" mà là **không kết thúc chương 2 với ấn tượng rằng microbenchmarking
là chuyện không tồn tại** — sách bỏ nó ra khỏi phần thân một cách có chủ ý, không phải vì nó vô
dụng.

Không bù phụ lục B: nguyên nhân sinh antipattern đã nằm trọn trong phần thân ch.2, phần còn thiếu
chỉ là danh mục tên gọi.

### 6.4 Ghi lỗ hổng phụ lục ở đúng hai chỗ

1. `FIELDS.ocnj.desc` (§4.1) — người dùng thấy ngay ở bộ chọn lĩnh vực.
2. `tracks[ocnj].prereq` — trước khi bắt đầu lộ trình.

Không ghi vào từng mục lộ trình: lỗ hổng đã đo là nhẹ (§1.1), thêm cảnh báo vào chỗ nó không cắn
là nhiễu.

### 6.5 Khuôn một mục

Giữ đúng khuôn 4 khối của repo: **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**. Mỗi mục là **kế hoạch đọc
trỏ vào sách**, không chép lại nội dung sách; link dạng `#/docs/ocnj-NN` gắn vào tên mục thật trong
chương (xem bảng mục lục §5.2). `practice` ở mức tuần, làm trên máy thật:

| Tuần | `practice` |
|---|---|
| W1 | Lấy một endpoint thật, chạy tải tăng dần, ghi latency theo phân vị bằng HdrHistogram thay vì trung bình; vẽ đồ thị và chỉ ra điểm gãy — rồi đối chiếu với các dạng đồ thị ch.1 mô tả |
| W2 | `javap -c` một class để đọc bytecode của một vòng lặp đơn giản; bật `-Xlog:class+load` đếm số class nạp lúc khởi động; dùng `jcmd` xem trạng thái JVM đang chạy |
| W3 | Bật `-Xlog:gc*` trên ứng dụng thật, chạy tải, đọc log: allocation rate, tỉ lệ promotion sang old gen, thời gian pause — và chỉ ra chỗ weak generational hypothesis đúng hay sai với workload đó |
| W4 | Chạy cùng workload với G1 rồi với ZGC (hoặc Shenandoah), so phân bố pause và throughput; giải thích chênh lệch bằng lý thuyết GC đồng thời của chương |
| W5 | `-XX:+PrintCompilation` tìm một method bị deoptimize rồi recompile; đo `-XX:ReservedCodeCacheSize` mặc định và tăng, so tập method được biên dịch |
| W6 | Viết một benchmark JMH cho false sharing: hai thread ghi hai biến cạnh nhau, rồi tách chúng ra khỏi cùng cache line; đo chênh lệch và giải thích bằng MESI |
| W7 | Đóng gói ứng dụng thành container, đặt giới hạn bộ nhớ, rồi xem GC ergonomics chọn heap khác đi thế nào; dựng bằng Docker Compose theo ví dụ Fighting Animals |
| W9 | Cắm Micrometer + Prometheus vào một service, rồi thêm OpenTelemetry tracing xuyên **hai** service để thấy một trace có nhiều span |
| W10 | Ghi một phiên JFR dưới tải, mở bằng JMC; đồng thời chạy Async Profiler lấy flame graph; so hai kết quả và tìm chỗ safepointing bias làm chúng khác nhau |
| W11 | Cùng một bài toán chạy bằng Fork/Join, parallel stream và virtual thread; đo cả ba, rồi đối chiếu kết quả với định luật Amdahl |
| W12 | Chạy một ví dụ structured concurrency + scoped values trên JDK 21+; so cách nó xử lý huỷ và truyền ngữ cảnh với `ExecutorService` thuần |

W8 (ch.10) **không có `practice` gõ tay** — đó là chương thiết kế: chọn đo cái gì, kiến trúc
observability nào là antipattern, chẩn đoán ra sao. Bài của tuần đó là viết ra kế hoạch
observability cho một service thật trên giấy, và nó thuộc khối "Tự kiểm tra" của các mục, không
phải một lệnh chạy được. Đây là lựa chọn có chủ ý, không phải bỏ sót.

### 6.6 Đăng ký track — `webapp/js/data/roadmap.js`

| Trường | Giá trị |
|---|---|
| `id` | `ocnj` |
| `field` | `ocnj` |
| `label` | `Optimizing Java` |
| `icon` | `📈` |
| `name` | `Đọc Optimizing Cloud Native Java (ấn bản 2)` |
| `durationWeeks` | `12` |
| `weeks` | `[...ocnjWeeksPart1, ...ocnjWeeksPart2]` |

`desc`: *Kế hoạch đọc 12 tuần bám theo bản dịch 15 chương và năm Phần của sách: mỗi mục nêu mục
tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; mười một tuần có bài thực hành gõ
tay — đo phân vị bằng HdrHistogram, đọc `-Xlog:gc*`, đổi collector so pause, bắt deopt bằng
`PrintCompilation`, dựng benchmark false sharing bằng JMH, chạy Fighting Animals trong container,
cắm Micrometer/Prometheus/OpenTelemetry, lấy flame graph bằng JFR và Async Profiler, và so
Fork/Join với virtual thread.*

`prereq`: *Yêu cầu: viết và chạy được một ứng dụng Java/Spring Boot thật để có cái mà đo — đây là
sách về đo và tối ưu, không phải sách dạy Java. JDK 17 trở lên (tốt nhất JDK 21+ cho chương 13 và
15), Docker chạy được cho chương 8, 9 và 11, và đọc được stack trace. Bộ nguồn không có Phụ lục A
(microbenchmarking) và Phụ lục B (danh mục antipattern); phần microbenchmarking được bù bằng JMH ở
tuần 1. Sách bám các mốc JDK cụ thể: đọc để hiểu cơ chế, còn cờ JVM và giá trị mặc định thì tra
lại theo JDK bạn đang chạy.*

Thêm hai dòng `import`, cập nhật khối chú thích đầu tệp (danh sách track và danh sách tiền tố id)
— khối đó là tài liệu sống, để cũ là sai lệch.

## 7. Liên kết chéo — `webapp/js/data/related.js`

Khai một chiều từ `ocnj`; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Toàn bộ khác
lĩnh vực (bất biến R1).

| Từ | Tới | Lý do đọc-liền-mạch |
|---|---|---|
| `ocnj-01` | `wgjd-07`, `java-07` | hệ phân loại hiệu năng ↔ hiểu về hiệu năng Java; ↔ capacity planning dùng chính các đại lượng này |
| `ocnj-02` | `wgjd-07` | phương pháp luận đo và thống kê ↔ đo hiệu năng ở WGJD |
| `ocnj-03` | `wgjd-04`, `wgjd-17` | classloading, bytecode, JIT ↔ class file và bytecode; ↔ nội tại JVM hiện đại |
| `ocnj-04` | `wgjd-07`, `sysprog-05` | GC, TLAB, allocation ↔ GC và JIT làm gì sau lưng bạn; ↔ bộ cấp phát bộ nhớ ở tầng C |
| `ocnj-05` | `wgjd-12` | GC nâng cao và ergonomics ↔ chạy Java trong container, nơi giới hạn bộ nhớ đổi lựa chọn collector |
| `ocnj-06` | `wgjd-04`, `wgjd-17` | thông dịch, JIT, code cache, AOT ↔ bytecode; ↔ nội tại JVM hiện đại |
| `ocnj-07` | `sysprog-06`, `sysprog-10` | cache, MESI, context switch ↔ luồng và lập lịch nhìn từ kernel |
| `ocnj-08` | `wgjd-12` | image, container, mạng ↔ chạy Java trong container |
| `ocnj-09` | `wgjd-12`, `java-01` | triển khai, blue/green, canary ↔ container; ↔ hành trình một request tới worker thread |
| `ocnj-10` | `java-02` | ba trụ cột và chẩn đoán hệ phân tán ↔ giải phẫu các timeout |
| `ocnj-11` | `java-02`, `java-06` | Micrometer, Prometheus, OTel ↔ đo và đặt ngưỡng timeout bằng số thật; ↔ cơ chế TaskQueue sinh ra chính các metric pool mà Micrometer lộ ra |
| `ocnj-12` | `java-04`, `wgjd-07` | JFR, Async Profiler, safepointing bias ↔ đọc thread dump và bí ẩn RUNNABLE; ↔ đo hiệu năng |
| `ocnj-13` | `jcip-11`, `modconc-02`, `java-05` | Amdahl, JMM, atomic, Fork/Join, virtual thread ↔ hiệu năng và khả năng mở rộng ở JCiP; ↔ virtual thread đi sâu; ↔ virtual thread ứng dụng |
| `ocnj-14` | `ddia-10`, `kafka-06` | WAL, CAP, Paxos, Raft, Kafka ↔ tính nhất quán và consensus; ↔ internals Kafka |
| `ocnj-15` | `modconc-04`, `modconc-05`, `wgjd-18` | structured concurrency, scoped values, Panama/Leyden/Valhalla ↔ hai chương chuyên đề; ↔ Java trong tương lai |

15 khoá, 28 liên kết. Mắt xích đáng giá nhất là `ocnj-13` → `jcip-11`: cùng một câu hỏi "vì sao
thêm thread không cho thêm throughput" nhìn từ hai cuốn cách nhau gần hai thập kỷ.

Hai khoá cuối của `ocnj-14` là **xuyên con đường** (sang `data`). Đã có tiền lệ: `java-02` →
`kafka-07` và `java-10` → `ddia-08`. Bất biến R1 chỉ chặn liên kết **cùng lĩnh vực**, không chặn
xuyên con đường; bất biến #3b chỉ áp cho link `#/docs/` trong **lộ trình**, không áp cho
`related.js`.

Không nối ch.8–9 sang `k8sbook-*` hay `kuar-*`: nội dung Kubernetes ở hai chương này là giới thiệu
lướt để chạy được ví dụ, nối sang sách Kubernetes đầy đủ sẽ là nối vì trùng từ khoá chứ không phải
vì đọc liền mạch.

## 8. Chia chặng

Mỗi chặng tự chạy được: `check-data.mjs` phải xanh ở cuối từng chặng.

| # | Chặng | Đụng gì |
|---|---|---|
| 1 | Chuẩn hoá nguồn | `git mv` → `sources/ocnj/` (15 md nâng từ `vi/` lên + 116 ảnh + 15 pdf), viết `sources/ocnj/README.md`. Không đụng app. |
| 2 | Lĩnh vực + thư viện | `fields.js` (modules `dashboard`/`guide`/`docs` — **chưa** `roadmap`), `FIELD_ORDER`, `paths.js`, `ocnj/docs.js` 15 bản ghi, `docs-index.js`, `fieldGuides.ocnj`, `EXPECTED["docs:ocnj"] = 15` |
| 3 | Lộ trình W1–6 | `ocnj/roadmap-part1.js`, 24 mục. Tệp chưa được import — app không đổi. |
| 4 | Lộ trình W7–12 | `ocnj/roadmap-part2.js`, 24 mục. |
| 5 | Bật track | `roadmap.js` (import + `tracks[]` + chú thích đầu tệp), `fields.js` thêm `"roadmap"`, `trackGuides.ocnj`, steps của `fieldGuides` trỏ track, `EXPECTED["roadmap-items:ocnj"] = 48` |
| 6 | Nối và ghi | `related.js`, `README.md` gốc, `sources/README.md`, cập nhật mọi số liệu |

Thứ tự chặng 2 → 5 là bắt buộc: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, và #7b
chặn có dữ liệu mà không khai module — nên track và việc bật module phải nằm cùng một chặng.

Chặng 3 và 4 là phần nặng nhất: 48 bài học viết tay, mỗi bài phải đọc chương gốc để trỏ đúng tên
mục và trích đúng cái bẫy sách nói. Không sinh máy móc từ mục lục.

## 9. Kiểm chứng

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

`build-content.sh` **không cần sửa** — nó sao chép cả cây `sources/` trừ `*.pdf`. Chạy lệnh này từ
**gốc repo**, không từ trong `webapp/` (đường dẫn đích là tương đối; chạy sai chỗ sẽ tạo
`webapp/webapp/content/`).

Số đếm kỳ vọng thêm vào `EXPECTED.counts`: `"docs:ocnj": 15`, `"roadmap-items:ocnj": 48`.

Bất biến sẽ cắn nếu làm sai:

| Bất biến | Cắn khi |
|---|---|
| #2 / #2b | `docs[].file` hoặc một trong 116 ảnh không tồn tại trên đĩa sau `build-content.sh` |
| #2c | `file` không có dạng `content/ocnj/…` |
| #3b | Link `#/docs/<id>` trong lộ trình trỏ sang lĩnh vực khác con đường |
| #7 / #7b | Khai `roadmap` khi chưa có dữ liệu, hoặc có dữ liệu mà chưa khai |
| G1–G4 | Thiếu `fieldGuides.ocnj` hoặc `trackGuides.ocnj`; `steps[].href`/`done` sai hình dạng |
| P1 | `ocnj` không có mặt đúng một lần trong `PATHS ∪ SPINE` |
| D1 | `chapter`/`part` thiếu hoặc sai kiểu; `title` còn tiền tố "Chương N. " |
| R1 | `related.js` trỏ id không tồn tại, tự trỏ, lặp, hoặc cùng lĩnh vực |
| N3 | `EXPECTED.counts` thiếu khoá cho lĩnh vực mới |

Ngoài kiểm tự động, kiểm bằng mắt sau chặng 6: mở app, chọn lĩnh vực OCNJ, xác nhận sidebar có
đúng 4 mục, thư viện hiện 15 tài liệu gom thành **năm nhóm Phần** với nhãn "Ch. N · …", ảnh hiện
đúng ở ch.2 (13 ảnh, nhiều nhất) và ch.8/ch.9 (3 ảnh mỗi chương, ít nhất — không được vỡ), khối mã
YAML/Dockerfile ở ch.9 và ch.11 render đúng (§1.3), và thẻ Con đường trên dashboard hiện OCNJ ở
chặng 5 trên 8 của Java Backend.

## 10. Cập nhật tài liệu (chặng 6)

- `README.md` gốc: thêm dòng `sources/ocnj/` vào bảng nguồn, thêm OCNJ vào đoạn liệt kê các bản
  dịch, cập nhật cây thư mục repo, và sửa "cả mười hai lĩnh vực" thành mười ba.
- `sources/README.md`: thêm hàng `ocnj` vào "Bản đồ hiện tại".
- Số liệu sau đợt này: **13 lĩnh vực, 242 tài liệu, 20 track, 946 mục lộ trình.**

## 11. Ngoài phạm vi

| Việc | Vì sao không làm đợt này |
|---|---|
| Flashcards và trắc nghiệm cho `ocnj` | Tám lĩnh vực sách hiện có đều chưa có; làm riêng cho OCNJ sẽ lệch khuôn. |
| Dịch bổ sung Phụ lục A và B | **Không có PDF gốc trong repo.** Giới hạn cứng của nguồn, không phải quyết định hoãn. Phụ lục A được bù bằng JMH ở W1 (§6.3). |
| Nối `ocnj` vào `bookCrossref` | Bảng đó phục vụ tuần giáo trình chứng chỉ Kubernetes; OCNJ không thuộc con đường đó, kể cả khi ch.8–9 có nhắc Kubernetes. |
| Sắp lại `images/chN/` thành `images/chNN/` | Sẽ gãy toàn bộ 116 tham chiếu tương đối để đổi lấy một chút nhất quán hình thức. `ddia` cũng dùng `chN`. |
| Đụng dữ liệu lĩnh vực khác | Chỉ sửa `related.js` (khai một chiều từ `ocnj`) và `PATHS.java` (thêm chặng + sửa `desc`). Không đánh số lại hay gộp lĩnh vực nào. |
