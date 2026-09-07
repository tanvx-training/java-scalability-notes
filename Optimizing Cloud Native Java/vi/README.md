# Tối ưu hóa Java Cloud Native (Ấn bản 2)

Bản dịch tiếng Việt của *Optimizing Cloud Native Java, 2nd Edition* — Benjamin J. Evans, James Gough, Chris Newland (O'Reilly).

## Mục lục

### Phần I — Nền tảng hiệu năng

1. [Định nghĩa về Tối ưu hóa và Hiệu năng](01-Dinh-nghia-Toi-uu-hoa-va-Hieu-nang.md) — throughput, latency, capacity, utilization, efficiency, scalability, degradation; đọc đồ thị hiệu năng; hiệu năng trong hệ thống cloud.
2. [Phương pháp luận Kiểm thử Hiệu năng](02-Phuong-phap-luan-Kiem-thu-Hieu-nang.md) — các loại test hiệu năng, best practice, antipattern, thống kê phi chuẩn, HdrHistogram, thiên kiến nhận thức.

### Phần II — Nội tại JVM

3. [Tổng quan về JVM](03-Tong-quan-ve-JVM.md) — classloading, bytecode, HotSpot, JIT, quản lý bộ nhớ, JMM, công cụ giám sát, các bản phân phối Java.
4. [Tìm hiểu về Garbage Collection](04-Tim-hieu-Garbage-Collection.md) — mark and sweep, oop, weak generational hypothesis, TLAB, parallel collector, vai trò của allocation.
5. [Garbage Collection nâng cao](05-Garbage-Collection-Nang-cao.md) — safepoint, tri-color marking, G1, Shenandoah, ZGC, Balanced (OpenJ9), CMS, Epsilon.
6. [Thực thi mã trên JVM](06-Thuc-thi-Ma-tren-JVM.md) — thông dịch bytecode, biên dịch JIT, code cache, tinh chỉnh JIT, AOT, Quarkus, GraalVM.
7. [Phần cứng và Hệ điều hành](07-Phan-cung-va-He-dieu-hanh.md) — cache bộ nhớ, MESI, branch prediction, mô hình bộ nhớ phần cứng, scheduler, context switch, mechanical sympathy.

### Phần III — Cloud Native

8. [Các thành phần của Cloud Stack](08-Thanh-phan-cua-Cloud-Stack.md) — MicroProfile, CNCF, ảo hóa, image và container, mạng; giới thiệu ví dụ Fighting Animals.
9. [Triển khai Java trên Cloud](09-Trien-khai-Java-tren-Cloud.md) — Docker Compose, Tilt, Kubernetes, blue/green, canary, feature flag, container và GC.

### Phần IV — Observability và Profiling

10. [Giới thiệu về Observability](10-Gioi-thieu-ve-Observability.md) — ba trụ cột (metrics, logs, traces), mẫu hình và antipattern, chẩn đoán sự cố hệ phân tán.
11. [Triển khai Observability trong Java](11-Trien-khai-Observability-trong-Java.md) — Micrometer, Prometheus, OpenTelemetry (tracing, metrics, logs), OTel Collector.
12. [Profiling](12-Profiling.md) — VisualVM, JMC, safepointing bias, perf, Async Profiler, JFR, Cryostat, memory profiling, heap dump.

### Phần V — Đồng thời và Phân tán

13. [Kỹ thuật hiệu năng đồng thời](13-Ky-thuat-Hieu-nang-Dong-thoi.md) — định luật Amdahl, JMM, method/var handle, atomic và CAS, `java.util.concurrent`, Fork/Join, actor, virtual thread.
14. [Kỹ thuật và Mẫu hình cho Hệ phân tán](14-Ky-thuat-va-Mau-hinh-He-phan-tan.md) — WAL, two-phase commit, partitioning, định lý CAP, Paxos, Raft, Cassandra, Infinispan, Kafka.
15. [Hiệu năng hiện đại và Tương lai](15-Hieu-nang-Hien-dai-va-Tuong-lai.md) — structured concurrency, scoped values, Project Panama, Leyden, Valhalla.

## Ghi chú về bản dịch

- **Thuật ngữ chuyên ngành được giữ nguyên tiếng Anh** (throughput, latency, garbage collection, JIT, safepoint, observability, span, trace, virtual thread, condenser…), kèm chú giải tiếng Việt ở lần xuất hiện đầu tiên khi cần.
- **Mã nguồn, cấu hình, tên API, cờ JVM và đầu ra công cụ giữ nguyên** — chỉ dịch phần chú thích (comment) trong mã.
- **Hình ảnh** được trích xuất trực tiếp từ PDF gốc, đặt trong `images/chN/fig-N-M.png` theo đúng số hiệu hình trong sách (tổng cộng 116 hình).
- **Chú thích cuối trang** được giữ nguyên ở dạng footnote Markdown (`[^n]`) ở cuối mỗi chương; tên tài liệu tham khảo, tác giả và trích dẫn nguyên bản giữ nguyên tiếng Anh.
- Các tham chiếu chéo tới Phụ lục A (microbenchmarking/JMH) và Phụ lục B (danh mục antipattern) được giữ nguyên; hai phụ lục này không có trong bộ PDF nguồn.
