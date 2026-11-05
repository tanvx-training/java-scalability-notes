# Tích hợp series *Java Under the Hood* vào DevPrep — thiết kế

Ngày: 2026-11-05
Trạng thái: người dùng yêu cầu "bỏ qua câu hỏi, làm luôn như các lĩnh vực trước" — mọi quyết định dưới đây
là **lựa chọn của Claude** theo khuôn các lĩnh vực trước, không phải điều người dùng đã duyệt từng mục.
Lĩnh vực mới của DevPrep — id `under-hood` (lĩnh vực thứ 18)

Khuôn mẫu trực tiếp: [`2026-09-26-pg-internals-integration-design.md`](2026-09-26-pg-internals-integration-design.md)
và merge `cc6ea4d` (PostgreSQL 14 Internals — đủ docs + roadmap + interview).

## 1. Bối cảnh

Thư mục ngoài repo `/Users/tanvx/Dev/Java/under-hood/` chứa series tiếng Việt **Java Under the Hood** —
"Đi từ dòng mã nguồn xuống tới JVM, bộ nhớ, JIT và Garbage Collector — viết cho lập trình viên Java/Spring
Boot". 26 bài PDF (~420 trang, ~182k từ theo `pdftotext | wc -w`), 6 chặng, ghi "Bản thẩm định · Tháng
10/2026", nền JDK 25 LTS / 27, thí nghiệm chạy thật trên OpenJDK 17/21/25. Kèm 11 gói mã nguồn lab
(`bai16…bai26-*-src.zip`) và `hprof_analyzer_bai14.py`.

Khác các lĩnh vực trước: nguồn là **PDF**, chưa có markdown. Hình là vector trong PDF (không có ảnh nhúng),
nên phải cắt vùng trang thành PNG. PDF không ghi tác giả hay giấy phép.

Bài 01 gồm hai phần: **Phần A** — lộ trình cả series (26 bài, 6 chặng, cấu trúc mỗi bài, quy ước màu) và
**Phần B** — nội dung Bài 01.

Nền trước khi bắt đầu: `check-data.mjs` **61/61 bất biến đạt**, 17 lĩnh vực.

## 2. Quyết định (lựa chọn của Claude)

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `under-hood`, nhãn "Java Under the Hood", icon 🔬, short `JUH`, unit `Bài` | Series độc lập, sâu hơn WGJD/OCNJ ở tầng HotSpot; không lĩnh vực nào phủ trọn. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap", "interview"]` | "Như các lĩnh vực trước" = đủ bộ như EJ/PG. |
| 3 | Con đường **Java Backend**, đặt ngay sau `wgjd`: `… "effective-java", "wgjd", "under-hood", "jcip", …` | WGJD là "xuống dưới nắp JVM" mức tổng quan; series này đào sâu đúng tầng đó trước khi sang concurrency cổ điển (JCIP). |
| 4 | **Chuyển PDF thành markdown trung thành**: giữ mọi câu chữ, code, output, bảng; không viết lại, không tóm tắt | Thư viện tài liệu đọc trong app; giống các lĩnh vực khác (markdown + hình). |
| 5 | Tách Bài 01 thành 2 tệp: `00-lo-trinh-series.md` (Phần A) và `01-…md` (Phần B) → **27 doc** `uh-00`…`uh-26` | Phần A là bản đồ cả series, đáng là một doc riêng; `chapter` = số bài, `null` cho `uh-00`. |
| 6 | Hình: cắt vùng trang PDF ở 150 dpi thành `images/bNN-figX.png` (vd `b11-fig3.png`, `b01-figA1.png`), hình bìa mỗi bài `images/bNN-cover.png` | Giữ đúng hình gốc (màu, chữ tiếng Việt); `fixRelativePaths` resolve ảnh tương đối sẵn. |
| 7 | Bỏ: header/footer lặp, số trang, chữ "SERIES · JAVA DEEP DIVE"/"TÀI LIỆU THẨM ĐỊNH" trên bìa, mục lục "Nội dung" của PDF (app tự sinh TOC từ heading) | Rác bố cục, không phải nội dung. Giữ đoạn dẫn dưới "Nội dung" và dòng nền tảng JDK. |
| 8 | Nhắc "Bài NN" trong văn → link `[Bài NN](NN-slug.md)` | `rewriteMarkdownLinks` đổi thành `#/docs/uh-NN`; chỉ thêm link, không đổi chữ. |
| 9 | PDF vào `sources/under-hood/pdf/`; zip lab + script Python vào `sources/under-hood/src/`; `build-content.sh` thêm `--exclude='*.zip'` | Giữ nguồn gốc trong repo như PG; zip (4,3 MB capstone) không cần vào bản deploy. |
| 10 | Lộ trình **13 tuần / 52 mục**, track id `uh` | ~182k từ ≈ PG (161k → 12 tuần); 2 bài/tuần, bám ranh giới chặng — §4.4. |
| 11 | Phỏng vấn **24 câu**, 6 chủ đề (= 6 chặng) × 4 cấp | Hợp đồng chung #IQ1–#IQ8. |
| 12 | Không có `externalRef` (series không có trang phát hành công khai) | Không bịa URL. |
| 13 | Senior Java GĐ1: các bài về JVM/GC/JIT/thread dump thêm link `#/docs/uh-NN` | Nối trục xuyên suốt, như PG/EJ. |
| 14 | README nguồn ghi rõ: không có thông tin tác giả/giấy phép trong PDF; để học cá nhân | Trung thực về nguồn gốc. |

## 3. Nguồn: `sources/under-hood/`

| doc id | `chapter` | Tệp | Chặng (`part`) |
|---|---:|---|---|
| uh-00 | null | `00-lo-trinh-series.md` | null |
| uh-01 | 1 | `01-buc-tranh-toan-canh-jvm.md` | Chặng I — Nền móng |
| uh-02 | 2 | `02-class-file-bytecode.md` | Chặng I — Nền móng |
| uh-03 | 3 | `03-class-loading.md` | Chặng I — Nền móng |
| uh-04 | 4 | `04-runtime-data-areas.md` | Chặng I — Nền móng |
| uh-05 | 5 | `05-object-trong-ram.md` | Chặng I — Nền móng |
| uh-06 | 6 | `06-interpreter-goi-method.md` | Chặng II — Execution engine |
| uh-07 | 7 | `07-jit-tiered-compilation.md` | Chặng II — Execution engine |
| uh-08 | 8 | `08-toi-uu-jit.md` | Chặng II — Execution engine |
| uh-09 | 9 | `09-khoi-dong-nhanh-cds-aot-native.md` | Chặng II — Execution engine |
| uh-10 | 10 | `10-nen-tang-gc.md` | Chặng III — Bộ nhớ & GC |
| uh-11 | 11 | `11-mo-xe-g1.md` | Chặng III — Bộ nhớ & GC |
| uh-12 | 12 | `12-zgc-shenandoah.md` | Chặng III — Bộ nhớ & GC |
| uh-13 | 13 | `13-gc-cho-container.md` | Chặng III — Bộ nhớ & GC |
| uh-14 | 14 | `14-log-gc-memory-leak.md` | Chặng III — Bộ nhớ & GC |
| uh-15 | 15 | `15-reference-off-heap.md` | Chặng III — Bộ nhớ & GC |
| uh-16 | 16 | `16-java-memory-model.md` | Chặng IV — Concurrency |
| uh-17 | 17 | `17-synchronized-monitor.md` | Chặng IV — Concurrency |
| uh-18 | 18 | `18-thread-safepoint.md` | Chặng IV — Concurrency |
| uh-19 | 19 | `19-virtual-threads.md` | Chặng IV — Concurrency |
| uh-20 | 20 | `20-java-util-concurrent.md` | Chặng IV — Concurrency |
| uh-21 | 21 | `21-invokedynamic.md` | Chặng V — Ngôn ngữ dưới lớp vỏ |
| uh-22 | 22 | `22-generics-record-pattern.md` | Chặng V — Ngôn ngữ dưới lớp vỏ |
| uh-23 | 23 | `23-reflection-proxy.md` | Chặng V — Ngôn ngữ dưới lớp vỏ |
| uh-24 | 24 | `24-exception-stack-trace.md` | Chặng V — Ngôn ngữ dưới lớp vỏ |
| uh-25 | 25 | `25-bo-do-nghe-chan-doan.md` | Chặng VI — Quan sát & chẩn đoán |
| uh-26 | 26 | `26-capstone-su-co-production.md` | Chặng VI — Quan sát & chẩn đoán |

`title` = tên bài trong lộ trình series (bỏ tiền tố "Bài NN"); `uh-00` = "Lộ trình series Java Under the Hood".

### 3.1 Quy ước chuyển PDF → markdown

- H1: `# Bài NN — <tên bài>`; ngay sau là hình bìa (nếu có), câu hỏi mở đầu/phụ đề của bìa, và một dòng
  in nghiêng về nền tảng (`*Nền tảng: JDK 25 LTS / 27 · Thí nghiệm chạy thật trên …*`).
- Mục đánh số trong PDF → `## N Tiêu đề`; mục con → `###`. Số mục giữ đúng như PDF (lộ trình link `§N`).
- Code, lệnh, output → khối fenced có ngôn ngữ (`java`, `bash`, `text`…), giữ nguyên thụt lề và ký tự.
- Mã inline (PDF hiển thị có khoảng trắng hai bên, vd " @Service ") → backtick.
- Bảng → bảng markdown. Khung nhấn (SPRING BOOT, VỀ CÁC CON SỐ, HIỂU LẦM…) → blockquote mở đầu bằng nhãn in đậm.
- Hình: `![Hình N.M — chú thích ngắn](images/bNN-figN_M.png)` rồi dòng chú thích đầy đủ in nghiêng. Chữ nằm
  trong hình không chép lại thành văn bản.
- Không sửa chính tả, không đổi câu, không thêm nội dung (ngoại trừ link "Bài NN" — §2 #8).

## 4. Dữ liệu webapp

Theo đúng cấu trúc `pg-internals` (merge `cc6ea4d`):

- `fields.js`: mục `under-hood` (§2 #1, #2, #12); `FIELD_ORDER`/thứ tự hiển thị theo con đường.
- `under-hood/docs.js`: 27 doc theo §3, `desc` 1–2 câu cơ chế chính, `tags` = `"JVM"` + 2 nhãn chủ đề.
  Đăng ký trong `docs-index.js`.
- `meta.js` — 6 chủ đề phỏng vấn: `uh-found` (Nền móng, bài 1–5), `uh-exec` (Execution engine, 6–9),
  `uh-gc` (Bộ nhớ & GC, 10–15), `uh-conc` (Concurrency, 16–20), `uh-lang` (Ngôn ngữ dưới lớp vỏ, 21–24),
  `uh-diag` (Quan sát & chẩn đoán, 25–26).
- `under-hood/interview.js`: 24 câu `uh-iq01`…`uh-iq24`, mỗi chủ đề đúng 1 câu mỗi cấp L1–L4, `refs` →
  `uh-NN`. L4 dùng kịch bản có trong series (OOMKilled dù heap còn trống, CPU cao 3 phút đầu sau deploy,
  latency spike định kỳ, Metaspace OOM sau redeploy, NPE không stack trace…).
- Lộ trình `under-hood/roadmap-part1.js` (T1–7) + `roadmap-part2.js` (T8–13), track `uh` "Đọc Java Under the
  Hood", `durationWeeks: 13`, tuần `uh-w<N>`, mục `uh-w<N>-<M>`, khuôn **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**.
- `guides.js`: `fieldGuides["under-hood"]` (audience: đã viết Java/Spring Boot vài năm; prereqs: JDK 25,
  javap/jcmd/JFR/JOL/async-profiler/MAT; `hoursPerWeek: "5–6 giờ/tuần · 13 tuần"`; 5 bước) và `trackGuides.uh`.
- `paths.js`: chèn `under-hood` sau `wgjd`; viết lại `desc` thành mười một chặng.
- `related.js`: chỉ cặp đã đọc cả hai bên xác minh (ứng viên: `uh-16`↔JCIP/OCNJ JMM, `uh-19`↔`java-05`/
  modern-concurrency virtual threads, `uh-23`↔`java-09` proxy @Transactional, `uh-13`↔`java-07` container,
  `uh-11`/`uh-12`↔WGJD GC, `uh-02`↔WGJD bytecode).
- `senior-java/roadmap-gd1.js`: thêm link `#/docs/uh-NN` vào các bài về JVM/GC/JIT/thread dump; giữ id mục.

### 4.4 Phân bổ lộ trình

| Tuần | Bài | ~Từ |
|---:|---|---:|
| 1 | 00, 01 | 11,5k |
| 2 | 02 | 10,4k |
| 3 | 03, 04 | 12,0k |
| 4 | 05, 06 | 10,3k |
| 5 | 07, 08 | 15,5k |
| 6 | 09 + ôn chặng I–II | 8,7k |
| 7 | 10, 11 | 13,5k |
| 8 | 12, 13 | 14,8k |
| 9 | 14, 15 + ôn chặng III | 11,3k |
| 10 | 16, 17 | 16,2k |
| 11 | 18, 19, 20 | 17,2k |
| 12 | 21–24 | 18,9k |
| 13 | 25, 26 + tổng ôn | 10,1k |

Mỗi tuần 4 mục, phủ đủ 27 doc.

## 5. Kiểm chứng

`check-data.mjs` — thêm kỳ vọng `"docs:under-hood": 27`, `"roadmap-items:under-hood": 52`,
`"interview:under-hood": 24`. Hoàn tất khi:

- Mỗi tệp markdown: số từ ≥ ~90% số từ `pdftotext` của phần tương ứng (phần thiếu là chữ trong hình/header);
  mọi `images/…` tồn tại, không ảnh mồ côi; mọi link `.md` trỏ tệp có thật.
- `build-content.sh` + `check-data.mjs` đạt toàn bộ bất biến.
- Mở app: một bài hiển thị hình, link "Bài NN" nhảy đúng doc, track `uh` và phỏng vấn hoạt động.

## 6. Ngoài phạm vi

Flashcards, trắc nghiệm, giải nén/hiển thị mã nguồn lab trong app, đưa series vào lịch 104 tuần (`schedule.js`),
sửa nội dung series.
