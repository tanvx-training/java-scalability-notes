# Java Under the Hood

Series tiếng Việt *Java Under the Hood* — "Đi từ dòng mã nguồn xuống tới JVM, bộ nhớ, JIT và Garbage
Collector — viết cho lập trình viên Java/Spring Boot muốn hiểu thứ mình chạy mỗi ngày". 26 bài, 6 chặng,
từ "chương trình Java được chạy như thế nào" tới "điều tra một sự cố production bằng hiểu biết về JVM".
Lý thuyết bám JDK 25 LTS và JDK 27; mọi output trong bài lấy từ việc chạy thật trên OpenJDK 17/21/25.

> **Nguồn gốc.** PDF không ghi tác giả hay giấy phép; trang bìa chỉ ghi *"Bản thẩm định · Tháng 10/2026"*.
> Series không có trang phát hành công khai. Bản markdown nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Tệp | 27: lộ trình series (00) và bài 01–26 |
| Chặng | 6 — Nền móng · Execution engine · Bộ nhớ & GC · Concurrency · Ngôn ngữ dưới lớp vỏ · Quan sát & chẩn đoán |
| Số từ | 144.891 (`wc -w *.md`) |
| Hình | 216 PNG trong `images/` (gồm 26 hình bìa bài), chữ trong hình giữ nguyên như PDF |
| PDF gốc | `pdf/Java-Under-the-Hood-Bai-01.pdf` … `Bai-26.pdf` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Mã lab | `src/`: 11 gói `bai16…bai26-*-src.zip` và `hprof_analyzer_bai14.py` (bài 14) — `*.zip` không vào bản deploy |
| Trong app | Lĩnh vực **Java Under the Hood**, chặng sau WGJD của con đường Java Backend |

## Ghi chú chuyển đổi

Markdown được chuyển **trung thành** từ PDF: giữ mọi câu chữ, code, lệnh, output và bảng; không viết lại,
không tóm tắt, không sửa chính tả. Bài 01 của PDF gồm hai phần nên được tách thành hai tệp: Phần A (lộ
trình cả series) là `00-lo-trinh-series.md`, Phần B là `01-buc-tranh-toan-canh-jvm.md`.

- Hình trong PDF là vector, nên được **cắt từ vùng trang PDF thành PNG** (`images/bNN-figN_M.png`, bìa
  `images/bNN-cover.png`). Chữ nằm trong hình không chép lại thành văn bản — chú thích hình nằm ngay dưới.
- Mục đánh số giữ đúng số của PDF (`## N Tiêu đề`); khung nhấn (SPRING BOOT, VỀ CÁC CON SỐ, HIỂU LẦM…)
  thành blockquote mở đầu bằng nhãn in đậm.
- Bỏ phần bố cục lặp: header/footer, số trang, chữ trang trí trên bìa, mục lục "Nội dung" của PDF (app tự
  sinh mục lục từ heading).
- Nhắc "Bài NN" trong văn được **thêm link** `[Bài NN](NN-slug.md)` — chỉ thêm link, không đổi chữ.

**Không đổi tên tệp.** Các link `[Bài NN](NN-slug.md)` và `images/…` dựa vào tên tệp hiện tại; web app
đổi chúng thành link nội bộ lúc hiển thị.

## Mục lục

- [Lộ trình series Java Under the Hood](00-lo-trinh-series.md)

### Chặng I — Nền móng: từ mã nguồn đến tiến trình

- [Bài 01. Chuyện gì xảy ra khi bạn gõ `java`? — Bức tranh toàn cảnh JVM](01-buc-tranh-toan-canh-jvm.md)
- [Bài 02. Class file & bytecode: đọc `javap` như đọc mã nguồn](02-class-file-bytecode.md)
- [Bài 03. Class loading chuyên sâu](03-class-loading.md)
- [Bài 04. Runtime Data Areas: stack, heap, metaspace, code cache và phần "ngoài heap"](04-runtime-data-areas.md)
- [Bài 05. Một object Java thực sự nằm trong RAM như thế nào](05-object-trong-ram.md)

### Chặng II — Execution engine: bytecode biến thành lệnh máy

- [Bài 06. Interpreter & cơ chế gọi method](06-interpreter-goi-method.md)
- [Bài 07. JIT & tiered compilation](07-jit-tiered-compilation.md)
- [Bài 08. Những phép tối ưu của JIT](08-toi-uu-jit.md)
- [Bài 09. Khởi động nhanh: CDS, AOT cache (Project Leyden), CRaC, GraalVM Native Image](09-khoi-dong-nhanh-cds-aot-native.md)

### Chặng III — Bộ nhớ & Garbage Collection

- [Bài 10. Nền tảng GC](10-nen-tang-gc.md)
- [Bài 11. Mổ xẻ G1](11-mo-xe-g1.md)
- [Bài 12. ZGC & Shenandoah](12-zgc-shenandoah.md)
- [Bài 13. Chọn và tinh chỉnh GC cho container](13-gc-cho-container.md)
- [Bài 14. Đọc log GC & săn memory leak](14-log-gc-memory-leak.md)
- [Bài 15. Reference & bộ nhớ ngoài heap](15-reference-off-heap.md)

### Chặng IV — Concurrency nhìn từ JVM

- [Bài 16. Java Memory Model](16-java-memory-model.md)
- [Bài 17. `synchronized` và monitor bên trong HotSpot](17-synchronized-monitor.md)
- [Bài 18. Thread, safepoint & stop-the-world](18-thread-safepoint.md)
- [Bài 19. Virtual threads mổ xẻ](19-virtual-threads.md)
- [Bài 20. Bên trong `java.util.concurrent`](20-java-util-concurrent.md)

### Chặng V — Ngôn ngữ dưới lớp vỏ

- [Bài 21. `invokedynamic`: lambda, nối chuỗi, record](21-invokedynamic.md)
- [Bài 22. Generics, record, sealed, pattern matching dưới bytecode](22-generics-record-pattern.md)
- [Bài 23. Reflection, MethodHandle, Proxy — cách Spring "làm phép"](23-reflection-proxy.md)
- [Bài 24. Exception & stack trace: chi phí thật](24-exception-stack-trace.md)

### Chặng VI — Quan sát & chẩn đoán

- [Bài 25. Bộ đồ nghề: jcmd, JFR, JMC, async-profiler, NMT](25-bo-do-nghe-chan-doan.md)
- [Bài 26. Capstone: điều tra sự cố Spring Boot production từ A đến Z](26-capstone-su-co-production.md)
