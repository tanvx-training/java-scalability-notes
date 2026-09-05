// Tài liệu lĩnh vực "Modern Concurrency in Java" — 8 tài liệu.
// Nguồn markdown: sources/modern-concurrency/ — được scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/modern-concurrency/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.

export const docs = [
  {
    id: "modconc-01",
    field: "modern-concurrency",
    title: "MCJ 01 — Giới thiệu: hành trình concurrency của Java",
    file: "content/modern-concurrency/01-gioi-thieu.md",
    icon: "🧬",
    desc: "Concurrency của Java từ thread trong bản 1.0, qua java.util.concurrent và Fork/Join, tới lời hứa của Project Loom. Chi phí ẩn của mỗi platform thread, work-stealing, CompletableFuture và giới hạn của reactive.",
    tags: ["Lịch sử", "Executor", "CompletableFuture", "Loom"],
  },
  {
    id: "modconc-02",
    field: "modern-concurrency",
    title: "MCJ 02 — Tìm hiểu về Virtual Thread",
    file: "content/modern-concurrency/02-tim-hieu-ve-virtual-thread.md",
    icon: "🧵",
    desc: "Virtual thread khác platform thread ở đâu, cách tạo, và vì sao chúng cho scalability chứ không phải tốc độ. Carrier thread, Semaphore thay cho pool, pinning, ThreadLocal và cách giám sát bằng JFR với jcmd.",
    tags: ["Virtual Thread", "Pinning", "Semaphore", "JFR"],
  },
  {
    id: "modconc-03",
    field: "modern-concurrency",
    title: "MCJ 03 — Cơ chế hoạt động của concurrency hiện đại",
    file: "content/modern-concurrency/03-co-che-hoat-dong-cua-concurrency-hien-dai.md",
    icon: "⚙️",
    desc: "Tự xây một thread pool để hiểu Executor, rồi Callable/Future và ForkJoinPool — scheduler mà virtual thread dùng. Kết chương dựng một virtual thread từ Continuation.",
    tags: ["Thread Pool", "ForkJoinPool", "Continuation"],
  },
  {
    id: "modconc-04",
    field: "modern-concurrency",
    title: "MCJ 04 — Structured Concurrency",
    file: "content/modern-concurrency/04-structured-concurrency.md",
    icon: "🌳",
    desc: "StructuredTaskScope: vòng đời scope và subtask, Joiner cùng các chính sách join, xử lý ngoại lệ, cấu hình, joiner tự viết, scope lồng nhau và khả năng quan sát.",
    tags: ["StructuredTaskScope", "Joiner", "Ngoại lệ"],
  },
  {
    id: "modconc-05",
    field: "modern-concurrency",
    title: "MCJ 05 — Scoped Values",
    file: "content/modern-concurrency/05-scoped-values.md",
    icon: "🎯",
    desc: "Vì sao truyền ngữ cảnh qua tham số hay ThreadLocal đều đuối trong thế giới hàng triệu thread, ScopedValue thay thế thế nào, và đường di chuyển từ ThreadLocal sang.",
    tags: ["ScopedValue", "ThreadLocal", "Ngữ cảnh"],
  },
  {
    id: "modconc-06",
    field: "modern-concurrency",
    title: "MCJ 06 — Reactive Java trong bối cảnh Virtual Thread",
    file: "content/modern-concurrency/06-reactive-java-trong-boi-canh-virtual-thread.md",
    icon: "🔁",
    desc: "Blocking so với non-blocking I/O, kiến trúc hướng sự kiện, Reactive Streams và backpressure — và phần nào của reactive vẫn còn giá trị sau khi có virtual thread.",
    tags: ["Reactive", "Backpressure", "Non-blocking I/O"],
  },
  {
    id: "modconc-07",
    field: "modern-concurrency",
    title: "MCJ 07 — Framework hiện đại dùng virtual thread",
    file: "content/modern-concurrency/07-cac-framework-hien-dai-su-dung-virtual-thread.md",
    icon: "🧩",
    desc: "Virtual thread trong Spring Boot (bật sẵn và cấu hình thủ công), trong Quarkus và trong Jakarta EE.",
    tags: ["Spring Boot", "Quarkus", "Jakarta EE"],
  },
  {
    id: "modconc-08",
    field: "modern-concurrency",
    title: "MCJ 08 — Kết luận và điểm rút ra",
    file: "content/modern-concurrency/08-ket-luan-va-diem-rut-ra.md",
    icon: "🏁",
    desc: "Tổng kết: chọn mô hình concurrency theo loại tải, cảnh báo pinning khi hệ thống còn ở JDK 21, quản lý ThreadLocal, và giám sát bằng công cụ hiện đại.",
    tags: ["Tổng kết", "Migrate", "Pinning"],
  },
];
