// Tài liệu lĩnh vực "Java & Spring Boot Scalability" — 10 tài liệu.
// Nguồn markdown: sources/java/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/java/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` (số / chữ phụ lục / null) và `part` (Phần trong sách / null): nhãn hiển thị
// sinh bởi labels.js ("Ch. 5 · Pod"), `title` chỉ còn tên chương (bất biến D1).
// Phần = 4 Chủ đề theo README gốc của series.

export const docs = [
  // ----- Chủ đề I — Connection & Request Lifecycle -----
  {
    id: "java-01",
    field: "java",
    chapter: 1,
    part: "Chủ đề I — Connection & Request Lifecycle",
    title: "Hành trình một request: từ TCP handshake đến Worker Thread",
    file: "content/java/01-connection-request-flow.md",
    icon: "🔌",
    desc: "3-way handshake, SYN/Accept Queue, Acceptor + LimitLatch, Poller/epoll (C10K), keep-alive, bảng \"5 cánh cửa\".",
    tags: ["TCP", "Tomcat", "Kernel"],
  },
  {
    id: "java-02",
    field: "java",
    chapter: 2,
    part: "Chủ đề I — Connection & Request Lifecycle",
    title: "Giải phẫu các Timeout",
    file: "content/java/02-timeouts-and-exceptions.md",
    icon: "⏲️",
    desc: "Connect timed out, Connection refused, Read timed out, Connection reset — ai là người ngắt, retry + idempotency, timeout budget.",
    tags: ["Timeout", "Retry", "Debug"],
  },
  // ----- Chủ đề II — Concurrency Model -----
  {
    id: "java-03",
    field: "java",
    chapter: 3,
    part: "Chủ đề II — Concurrency Model",
    title: "Synchronous ≠ Blocking, Asynchronous ≠ Non-blocking",
    file: "content/java/03-sync-async-blocking-nonblocking.md",
    icon: "🔀",
    desc: "Hai trục độc lập, cơ chế từng ô (socketRead0, Selector, event loop), bẫy @Async + JDBC, cây quyết định chọn mô hình.",
    tags: ["Concurrency", "@Async", "NIO"],
  },
  {
    id: "java-04",
    field: "java",
    chapter: 4,
    part: "Chủ đề II — Concurrency Model",
    title: "Java Thread Lifecycle & bí ẩn RUNNABLE",
    file: "content/java/04-java-thread-lifecycle.md",
    icon: "🧵",
    desc: "6 trạng thái thread, ranh giới JVM/kernel (vì sao chờ DB vẫn RUNNABLE), đọc thread dump bằng pattern đỉnh stack.",
    tags: ["Thread", "Thread dump", "JVM"],
  },
  {
    id: "java-05",
    field: "java",
    chapter: 5,
    part: "Chủ đề II — Concurrency Model",
    title: "Virtual Threads",
    file: "content/java/05-virtual-threads.md",
    icon: "🪶",
    desc: "Mount/unmount/continuation, carrier pool, scale-not-speed, pinning + JEP 491, Semaphore thay pool, ScopedValue.",
    tags: ["Virtual Threads", "Loom", "Java 21+"],
  },
  // ----- Chủ đề III — Capacity Planning & Pool Sizing -----
  {
    id: "java-06",
    field: "java",
    chapter: 6,
    part: "Chủ đề III — Capacity Planning & Pool Sizing",
    title: "Tomcat Thread Pool Internals",
    file: "content/java/06-tomcat-threadpool-taskqueue.md",
    icon: "⚙️",
    desc: "TaskQueue.offer() \"nói dối\" (thread-trước-queue-sau), queue vô hạn và cascading failure, van 2 tầng, Bulkhead vs rate limit.",
    tags: ["Tomcat", "TaskQueue", "Bulkhead"],
  },
  {
    id: "java-07",
    field: "java",
    chapter: 7,
    part: "Chủ đề III — Capacity Planning & Pool Sizing",
    title: "Tomcat Thread Pool: pool size bao nhiêu là đủ?",
    file: "content/java/07-threadpool-sizing.md",
    icon: "📐",
    desc: "Chi phí thật của thread, công thức Goetz core×U×(1+W/C), Little's Law → capacity, container-aware JVM, CFS throttling.",
    tags: ["Sizing", "Little's Law", "Container"],
  },
  {
    id: "java-08",
    field: "java",
    chapter: 8,
    part: "Chủ đề III — Capacity Planning & Pool Sizing",
    title: "Database Connection Pool: pool size bao nhiêu là đủ?",
    file: "content/java/08-database-connection-pool-sizing.md",
    icon: "🗄️",
    desc: "Chuỗi 5 phép tính từ 1600 RPS đến pool size, vì sao more-connections-is-slower, 4 ca giữ connection quá lâu kèm code fix.",
    tags: ["HikariCP", "Sizing", "Database"],
  },
  // ----- Chủ đề IV — Transaction Management -----
  {
    id: "java-09",
    field: "java",
    chapter: 9,
    part: "Chủ đề IV — Transaction Management",
    title: "@Transactional Part 1: AOP Proxy và ThreadLocal",
    file: "content/java/09-transactional-proxy-threadlocal.md",
    icon: "🏷️",
    desc: "Tắt autoCommit, JDK Dynamic vs CGLIB proxy, TransactionInterceptor, Connection trong ThreadLocal, self-invocation.",
    tags: ["@Transactional", "AOP", "Spring"],
  },
  {
    id: "java-10",
    field: "java",
    chapter: 10,
    part: "Chủ đề IV — Transaction Management",
    title: "@Transactional Part 2: Năm cái bẫy",
    file: "content/java/10-transactional-five-traps.md",
    icon: "🪤",
    desc: "5 bẫy production: annotation bị lơ, captive connection, exception mismatch, event listener, deadlock REQUIRES_NEW.",
    tags: ["@Transactional", "Production", "Bẫy"],
  },
];
