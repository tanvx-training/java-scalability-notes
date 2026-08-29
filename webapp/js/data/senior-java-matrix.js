// Ma trận năng lực Senior Java 2026 — module → chủ đề → tiêu chí tự đánh giá.
//
// Chuyển đổi MỘT LẦN từ roadmap-seed.yaml của kho personal-platform
// (senior-java-tracker, phiên bản seed "2026.08"). TỆP NÀY LÀ NGUỒN SỰ THẬT
// MỚI — sửa thẳng ở đây, không sinh lại từ YAML.
//
// Bản sinh cũ đặt id theo VỊ TRÍ trong YAML, nên đảo thứ tự là đổi id. Viết
// thẳng vào JS khử được điểm mong manh đó: id giờ là hằng, đảo thứ tự không
// làm mất tiến độ.
//
// GIỮ NGUYÊN id (sj-m<N> / sj-m<N>-t<M> / sj-m<N>-t<M>-c<K>) — tiến độ
// localStorage lưu theo id tiêu chí.
//
// level: 1 = Hiểu lý thuyết · 2 = Thực thi mã nguồn ·
//        3 = Phân tích đánh đổi · 4 = Thiết kế & xử lý sự cố
//
// Dữ liệu này khác lộ trình 24 tháng (roadmap.js/senior-java-gd*.js): lộ
// trình trả lời "tuần này làm gì", ma trận này trả lời "tôi đang ở mức nào".
// Hai tập cố tình KHÔNG liên kết chéo với nhau.
//
// Nguồn YAML là bản seed cho ứng dụng "senior-java-tracker" của tác giả — cả
// tiêu chí lẫn tiêu đề chủ đề/module (không riêng nhóm "Capstone M*") đôi khi
// nhắc thẳng tới "tracker" như TÊN RIÊNG của ứng dụng gốc đó. Người đọc
// DevPrep không có sẵn đúng ứng dụng ấy trước mặt — nó nằm ở một repo khác và
// ngoài phạm vi tích hợp này — nên MỌI chỗ "tracker" được dùng làm tên hệ
// thống cụ thể (không riêng Capstone) đã được đổi thành cách nói chung
// ("ứng dụng" / "ứng dụng của bạn" / "ứng dụng chính"), giữ nguyên 100% phần
// kỹ thuật của tiêu chí (JWT resource server, EXPLAIN ANALYZE, composite
// index, master-replica, layered jar, kind, probes/ConfigMap/Secret, trace
// id, ChatClient, MCP annotations…) — chỉ đổi danh từ chỉ dự án. Không mang
// sang progress/notes/bookmarks/timeline/versionTags của dự án gốc — không
// thuộc phạm vi ma trận năng lực.

export const seniorJavaMatrix = {
  id: "senior-java-2026",
  field: "senior-java",
  title: "Ma trận năng lực Senior Java 2026 (Java 25 · Spring Boot 4.1)",
  version: "2026.08",
  modules: [
    {
      id: "sj-m1",
      code: "M1",
      title: "Java 25 Core, Concurrency & JVM Internals",
      summary: "Làm chủ nền tảng Java 25 LTS: virtual threads hậu JEP 491, structured concurrency, scoped values, JMM, GC thế hệ mới và bộ công cụ chẩn đoán.",
      weight: 20,
      topics: [
        {
          id: "sj-m1-t1",
          title: "Virtual threads & Project Loom",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t1-c1", level: 1, criteria: "Giải thích cơ chế carrier thread, continuation, mount/unmount của virtual thread" },
            { id: "sj-m1-t1-c2", level: 1, criteria: "Trình bày lịch sử pinning: vì sao synchronized từng gây pinned thread và JEP 491 (JDK 24) đã sửa thế nào; trường hợp nào vẫn còn pinning (native frame)" },
            { id: "sj-m1-t1-c3", level: 3, criteria: "Phân tích khi nào virtual threads KHÔNG giúp ích (CPU-bound, thread-local nặng, pool tài nguyên giới hạn)" },
          ],
          resources: [
            { url: "https://openjdk.org/jeps/444", title: "JEP 444: Virtual Threads", tags: ["java25", "loom"] },
            { url: "https://openjdk.org/jeps/491", title: "JEP 491: Synchronize Virtual Threads without Pinning", tags: ["java25", "loom"] },
          ],
        },
        {
          id: "sj-m1-t2",
          title: "Structured concurrency & scoped values",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t2-c1", level: 1, criteria: "Phân biệt StructuredTaskScope với ExecutorService: phạm vi sống, hủy lan truyền, quan sát lỗi" },
            { id: "sj-m1-t2-c2", level: 2, criteria: "Viết luồng fan-out (gọi song song nhiều nguồn, fail-fast) bằng StructuredTaskScope, bật preview flag đúng cách" },
            { id: "sj-m1-t2-c3", level: 3, criteria: "So sánh ScopedValue với ThreadLocal: chi phí, tính bất biến, tương thích virtual threads" },
          ],
          resources: [
            { url: "https://openjdk.org/jeps/505", title: "JEP 505: Structured Concurrency", tags: ["java25", "concurrency"] },
            { url: "https://openjdk.org/jeps/506", title: "JEP 506: Scoped Values", tags: ["java25", "concurrency"] },
          ],
        },
        {
          id: "sj-m1-t3",
          title: "Ngôn ngữ hiện đại: records, sealed, pattern matching",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m1-t3-c1", level: 1, criteria: "Giải thích record patterns, pattern matching cho switch, sealed hierarchy và exhaustiveness" },
            { id: "sj-m1-t3-c2", level: 2, criteria: "Mô hình hóa trạng thái nghiệp vụ bằng sealed interface + records, xử lý bằng switch pattern matching không default" },
          ],
          resources: [
            { url: "https://openjdk.org/jeps/440", title: "JEP 440: Record Patterns", tags: ["java", "language"] },
          ],
        },
        {
          id: "sj-m1-t4",
          title: "Java Memory Model & Garbage Collection",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t4-c1", level: 1, criteria: "Giải thích happens-before, volatile, final field semantics và data race" },
            { id: "sj-m1-t4-c2", level: 2, criteria: "Đọc và diễn giải GC log của Generational ZGC (mặc định từ JDK 23): pause time, allocation rate, promotion" },
            { id: "sj-m1-t4-c3", level: 3, criteria: "So sánh ZGC vs G1 vs Shenandoah theo trục latency / throughput / footprint và chọn cho từng loại workload" },
            { id: "sj-m1-t4-c4", level: 4, criteria: "Chẩn đoán memory leak từ heap dump (MAT/jhat): tìm dominator, GC root path" },
          ],
          resources: [
            { url: "https://docs.oracle.com/en/java/javase/25/gctuning/", title: "HotSpot GC Tuning Guide", tags: ["jvm", "gc"] },
          ],
        },
        {
          id: "sj-m1-t5",
          title: "Profiling & benchmark (JMH, async-profiler, JFR)",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t5-c1", level: 1, criteria: "Giải thích các bẫy benchmark: dead code elimination, constant folding, warmup, blackhole" },
            { id: "sj-m1-t5-c2", level: 2, criteria: "Viết JMH benchmark có baseline, đọc được error margin và chọn mode phù hợp" },
            { id: "sj-m1-t5-c3", level: 4, criteria: "Dùng async-profiler + JFR tìm hotspot CPU và allocation trong ứng dụng đang chạy" },
          ],
          resources: [
            { url: "https://github.com/openjdk/jmh", title: "JMH — Java Microbenchmark Harness", tags: ["jvm", "performance"] },
            { url: "https://github.com/async-profiler/async-profiler", title: "async-profiler", tags: ["jvm", "performance"] },
          ],
        },
        {
          id: "sj-m1-t6",
          title: "Capstone M1: Ứng dụng chạy trên virtual threads",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t6-c1", level: 2, criteria: "Bật virtual threads cho tầng HTTP của một ứng dụng thực tế, viết load test so sánh throughput trước/sau" },
            { id: "sj-m1-t6-c2", level: 2, criteria: "Benchmark endpoint thống kê tiến độ bằng JMH, ghi lại kết quả vào notes" },
            { id: "sj-m1-t6-c3", level: 2, criteria: "Bật GC log của ứng dụng đang chạy, phân tích và viết một ghi chú 'GC dưới tải'" },
          ],
          resources: [],
        },
      ],
    },
    {
      id: "sj-m2",
      code: "M2",
      title: "Spring Boot 4.1 & Enterprise Foundations",
      summary: "Đi sâu Spring Boot 4: modular hóa, JSpecify null-safety, Jackson 3, API versioning, HTTP Service Clients, Hibernate 7.1, Security 7 và GraalVM.",
      weight: 20,
      topics: [
        {
          id: "sj-m2-t1",
          title: "IoC container, bean lifecycle & auto-configuration",
          importance: "HIGH",
          checklist: [
            { id: "sj-m2-t1-c1", level: 1, criteria: "Trình bày bean lifecycle đầy đủ: definition, instantiation, populate, aware, post-processor, init, destroy" },
            { id: "sj-m2-t1-c2", level: 2, criteria: "Viết custom auto-configuration với @ConditionalOnProperty/@ConditionalOnMissingBean và đóng gói thành custom starter" },
            { id: "sj-m2-t1-c3", level: 3, criteria: "Giải thích khi nào nên viết starter riêng thay vì @Configuration thường" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html", title: "Creating Your Own Auto-configuration", tags: ["spring-boot"] },
          ],
        },
        {
          id: "sj-m2-t2",
          title: "Modular hóa Boot 4 & null-safety JSpecify",
          importance: "HIGH",
          checklist: [
            { id: "sj-m2-t2-c1", level: 1, criteria: "Liệt kê các starter đã đổi tên (web->webmvc, restclient, flyway...) và lý do modular hóa auto-configure" },
            { id: "sj-m2-t2-c2", level: 2, criteria: "Áp dụng annotation JSpecify (@Nullable, @NullMarked) cho một package của ứng dụng và bật kiểm tra tĩnh" },
            { id: "sj-m2-t2-c3", level: 3, criteria: "Phân tích trade-off dùng modular starters vs spring-boot-starter-classic khi migrate hệ thống lớn" },
          ],
          resources: [
            { url: "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes", title: "Spring Boot 4.0 Release Notes", tags: ["spring-boot4"] },
            { url: "https://jspecify.dev/", title: "JSpecify", tags: ["null-safety"] },
          ],
        },
        {
          id: "sj-m2-t3",
          title: "Spring Data JPA & Hibernate 7.1 nâng cao",
          importance: "HIGH",
          checklist: [
            { id: "sj-m2-t3-c1", level: 1, criteria: "Giải thích persistence context, dirty checking, flush mode và các mức transaction isolation" },
            { id: "sj-m2-t3-c2", level: 2, criteria: "Tái hiện N+1 khi load cây roadmap->module->topic->checklist rồi khắc phục bằng EntityGraph / fetch join, chứng minh qua SQL log" },
            { id: "sj-m2-t3-c3", level: 3, criteria: "Giải thích thay đổi của Hibernate 7.1 về detached entity (không còn tự re-associate) và tác động lên code cũ" },
            { id: "sj-m2-t3-c4", level: 4, criteria: "Phân tích một query chậm bằng SQL log + thống kê Hibernate và đề xuất chiến lược fetch phù hợp" },
          ],
          resources: [
            { url: "https://vladmihalcea.com/n-plus-1-query-problem/", title: "N+1 query problem — Vlad Mihalcea", tags: ["jpa", "hibernate"] },
          ],
        },
        {
          id: "sj-m2-t4",
          title: "Spring Security 7: OAuth2, JWT",
          importance: "HIGH",
          checklist: [
            { id: "sj-m2-t4-c1", level: 1, criteria: "Vẽ và giải thích filter chain của Spring Security, phân biệt authentication vs authorization" },
            { id: "sj-m2-t4-c2", level: 2, criteria: "Bảo vệ ứng dụng: đăng nhập, JWT resource server, phân quyền endpoint; thêm bảng users bằng migration mới" },
            { id: "sj-m2-t4-c3", level: 3, criteria: "Phân tích trade-off session-based vs JWT (thu hồi token, kích thước, stateless)" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-security/reference/", title: "Spring Security Reference", tags: ["security"] },
          ],
        },
        {
          id: "sj-m2-t5",
          title: "API versioning & HTTP Service Clients (mới trong Boot 4)",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m2-t5-c1", level: 2, criteria: "Áp dụng cơ chế API versioning built-in của Framework 7 cho REST API của ứng dụng" },
            { id: "sj-m2-t5-c2", level: 2, criteria: "Gọi một API ngoài bằng HTTP Service Client (interface + @HttpExchange) với auto-configuration của Boot 4" },
            { id: "sj-m2-t5-c3", level: 3, criteria: "So sánh RestClient vs WebClient vs HTTP interface client: khi nào dùng cái nào" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-framework/reference/web/webmvc-versioning.html", title: "API Versioning — Spring Framework 7", tags: ["spring", "rest"] },
          ],
        },
        {
          id: "sj-m2-t6",
          title: "GraalVM Native Image",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m2-t6-c1", level: 2, criteria: "Build ứng dụng thành native executable, xử lý reflection hints cần thiết" },
            { id: "sj-m2-t6-c2", level: 3, criteria: "Đo và phân tích trade-off native vs JIT: startup time, RSS memory, peak throughput, thời gian build" },
          ],
          resources: [
            { url: "https://www.graalvm.org/latest/reference-manual/native-image/", title: "GraalVM Native Image", tags: ["graalvm"] },
          ],
        },
        {
          id: "sj-m2-t7",
          title: "Capstone M2: Bảo mật ứng dụng + custom starter + native",
          importance: "HIGH",
          checklist: [
            { id: "sj-m2-t7-c1", level: 2, criteria: "Tách seeder YAML thành custom starter riêng (yaml-seed-spring-boot-starter) và dùng lại trong ứng dụng của bạn" },
            { id: "sj-m2-t7-c2", level: 2, criteria: "Toàn bộ API của ứng dụng được bảo vệ bằng JWT, có test @WebMvcTest với @MockitoBean" },
            { id: "sj-m2-t7-c3", level: 2, criteria: "Pipeline build được cả JVM image lẫn native image" },
          ],
          resources: [],
        },
      ],
    },
    {
      id: "sj-m3",
      code: "M3",
      title: "Distributed Systems & Microservices",
      summary: "Tách service, event-driven với Kafka, các pattern nhất quán dữ liệu, resilience, Spring gRPC (mới trong Boot 4.1) và bảo mật liên dịch vụ.",
      weight: 18,
      topics: [
        {
          id: "sj-m3-t1",
          title: "Ranh giới service & giao tiếp đồng bộ",
          importance: "HIGH",
          checklist: [
            { id: "sj-m3-t1-c1", level: 1, criteria: "Giải thích API Gateway, Service Discovery, Config Server và khi nào một monolith KHÔNG nên bị tách" },
            { id: "sj-m3-t1-c2", level: 2, criteria: "Dựng một gRPC service bằng Spring gRPC (Boot 4.1): định nghĩa proto, server, client, test" },
            { id: "sj-m3-t1-c3", level: 3, criteria: "Phân tích trade-off gRPC vs REST: contract, hiệu năng, browser support, debug, streaming" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-grpc/reference/", title: "Spring gRPC Reference", tags: ["grpc", "spring-boot4"] },
          ],
        },
        {
          id: "sj-m3-t2",
          title: "Kafka & kiến trúc event-driven",
          importance: "HIGH",
          checklist: [
            { id: "sj-m3-t2-c1", level: 1, criteria: "Giải thích partition, consumer group, offset, rebalance và thứ tự message" },
            { id: "sj-m3-t2-c2", level: 2, criteria: "Cấu hình retry topic + Dead Letter Queue cho consumer xử lý lỗi" },
            { id: "sj-m3-t2-c3", level: 3, criteria: "Phân tích at-least-once vs exactly-once semantics và chi phí của idempotent producer / transactions" },
          ],
          resources: [
            { url: "https://kafka.apache.org/documentation/", title: "Apache Kafka Documentation", tags: ["kafka"] },
          ],
        },
        {
          id: "sj-m3-t3",
          title: "Nhất quán dữ liệu: Outbox, Saga, CQRS",
          importance: "HIGH",
          checklist: [
            { id: "sj-m3-t3-c1", level: 1, criteria: "So sánh Saga (choreography vs orchestration) với Two-Phase Commit" },
            { id: "sj-m3-t3-c2", level: 2, criteria: "Triển khai transactional outbox để publish event an toàn cùng transaction DB" },
            { id: "sj-m3-t3-c3", level: 3, criteria: "Phân tích khi nào CQRS / Event Sourcing đáng chi phí phức tạp và khi nào là over-engineering" },
            { id: "sj-m3-t3-c4", level: 4, criteria: "Thiết kế saga cho một quy trình nhiều bước có bù trừ (compensation) và mô tả các failure mode" },
          ],
          resources: [
            { url: "https://microservices.io/patterns/data/transactional-outbox.html", title: "Transactional Outbox pattern", tags: ["patterns"] },
            { url: "https://microservices.io/patterns/data/saga.html", title: "Saga pattern", tags: ["patterns"] },
          ],
        },
        {
          id: "sj-m3-t4",
          title: "Resilience & idempotency",
          importance: "HIGH",
          checklist: [
            { id: "sj-m3-t4-c1", level: 2, criteria: "Cấu hình Resilience4j: circuit breaker, retry, timeout, bulkhead cho lời gọi HTTP ra ngoài" },
            { id: "sj-m3-t4-c2", level: 2, criteria: "Triển khai idempotency key cho API ghi để chống xử lý trùng" },
            { id: "sj-m3-t4-c3", level: 3, criteria: "Lập luận cách chọn ngưỡng timeout/retry để tránh retry storm và cascading failure" },
          ],
          resources: [
            { url: "https://resilience4j.readme.io/docs/getting-started", title: "Resilience4j", tags: ["resilience"] },
          ],
        },
        {
          id: "sj-m3-t5",
          title: "Bảo mật liên dịch vụ: SSRF & InetAddressFilter",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m3-t5-c1", level: 1, criteria: "Giải thích SSRF và vì sao endpoint fetch URL do người dùng cung cấp là bề mặt tấn công kinh điển" },
            { id: "sj-m3-t5-c2", level: 2, criteria: "Chặn SSRF cho metadata fetcher bằng InetAddressFilter (Boot 4.1): cấm private ranges, link-local, metadata endpoints" },
          ],
          resources: [
            { url: "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery", title: "OWASP: SSRF", tags: ["security", "ssrf"] },
          ],
        },
        {
          id: "sj-m3-t6",
          title: "Capstone M3: bookmark-metadata-service qua Kafka",
          importance: "HIGH",
          checklist: [
            { id: "sj-m3-t6-c1", level: 2, criteria: "Tách service trích xuất metadata: ứng dụng chính publish bookmark.added (qua outbox), service fetch title/description rồi trả kết quả" },
            { id: "sj-m3-t6-c2", level: 2, criteria: "Job kiểm tra link chết chạy định kỳ, cập nhật http_status/last_checked_at, lỗi vào DLQ" },
            { id: "sj-m3-t6-c3", level: 2, criteria: "Fetcher có Resilience4j + InetAddressFilter, có test chứng minh chặn được URL nội bộ" },
          ],
          resources: [],
        },
      ],
    },
    {
      id: "sj-m4",
      code: "M4",
      title: "Database Scaling & Distributed Caching (Redis)",
      summary: "Tối ưu truy vấn và index, partitioning/sharding/replication, các caching pattern với Redis và distributed lock.",
      weight: 14,
      topics: [
        {
          id: "sj-m4-t1",
          title: "Index & tối ưu truy vấn PostgreSQL",
          importance: "HIGH",
          checklist: [
            { id: "sj-m4-t1-c1", level: 1, criteria: "Giải thích B-tree vs GIN vs partial index, selectivity và vì sao index không phải lúc nào cũng được dùng" },
            { id: "sj-m4-t1-c2", level: 2, criteria: "Dùng EXPLAIN (ANALYZE, BUFFERS) phân tích query thống kê tiến độ của ứng dụng rồi thêm composite index phù hợp — chính là index đã hoãn từ Phase 0" },
            { id: "sj-m4-t1-c3", level: 4, criteria: "Xây quy trình chẩn đoán slow query: pg_stat_statements, log, plan regression" },
          ],
          resources: [
            { url: "https://www.postgresql.org/docs/current/using-explain.html", title: "PostgreSQL: Using EXPLAIN", tags: ["postgres", "performance"] },
          ],
        },
        {
          id: "sj-m4-t2",
          title: "Partitioning, sharding & replication",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m4-t2-c1", level: 1, criteria: "Phân biệt partitioning vs sharding vs replication và vấn đề của mỗi loại" },
            { id: "sj-m4-t2-c2", level: 2, criteria: "Dựng PostgreSQL master-replica local, cấu hình ứng dụng đọc từ replica" },
            { id: "sj-m4-t2-c3", level: 3, criteria: "Phân tích cách chọn sharding key và hệ quả của resharding, hotspot, cross-shard query" },
          ],
          resources: [
            { url: "https://www.postgresql.org/docs/current/ddl-partitioning.html", title: "PostgreSQL Partitioning", tags: ["postgres"] },
          ],
        },
        {
          id: "sj-m4-t3",
          title: "Redis caching patterns",
          importance: "HIGH",
          checklist: [
            { id: "sj-m4-t3-c1", level: 1, criteria: "So sánh cache-aside, write-through, write-behind và hệ quả nhất quán của từng pattern" },
            { id: "sj-m4-t3-c2", level: 2, criteria: "Cài cache-aside cho thống kê tiến độ với chiến lược invalidation rõ ràng khi tick checklist" },
            { id: "sj-m4-t3-c3", level: 3, criteria: "Phân tích và xử lý cache stampede / avalanche / penetration (jitter TTL, lock, negative caching, bloom filter)" },
          ],
          resources: [
            { url: "https://redis.io/docs/latest/", title: "Redis Documentation", tags: ["redis"] },
          ],
        },
        {
          id: "sj-m4-t4",
          title: "Distributed lock",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m4-t4-c1", level: 2, criteria: "Triển khai distributed lock cho job kiểm tra link chết để không chạy trùng khi scale nhiều instance" },
            { id: "sj-m4-t4-c2", level: 3, criteria: "Trình bày tranh luận Redlock (Kleppmann vs antirez): fencing token, giới hạn an toàn của lock dựa trên thời gian" },
          ],
          resources: [
            { url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", title: "How to do distributed locking — Kleppmann", tags: ["redis", "distributed"] },
          ],
        },
        {
          id: "sj-m4-t5",
          title: "Capstone M4: tầng cache cho ứng dụng",
          importance: "HIGH",
          checklist: [
            { id: "sj-m4-t5-c1", level: 2, criteria: "Thống kê tiến độ đi qua Redis cache, có metric hit/miss rate" },
            { id: "sj-m4-t5-c2", level: 2, criteria: "Viết note ADR: benchmark trước/sau khi thêm index và cache, kèm số liệu" },
          ],
          resources: [],
        },
      ],
    },
    {
      id: "sj-m5",
      code: "M5",
      title: "Cloud-Native, Observability & DevOps",
      summary: "Container hóa, Kubernetes, ba trụ cột observability với OpenTelemetry (nâng cấp trong Boot 4.1) và CI/CD.",
      weight: 14,
      topics: [
        {
          id: "sj-m5-t1",
          title: "Docker & JVM trong container",
          importance: "HIGH",
          checklist: [
            { id: "sj-m5-t1-c1", level: 1, criteria: "Giải thích image layers, build cache và lợi ích của multi-stage build" },
            { id: "sj-m5-t1-c2", level: 2, criteria: "Viết Dockerfile multi-stage + layered jar cho ứng dụng, tối ưu kích thước image" },
            { id: "sj-m5-t1-c3", level: 3, criteria: "Phân tích JVM ergonomics trong container: memory limit, MaxRAMPercentage, CPU quota ảnh hưởng GC threads" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html", title: "Spring Boot Container Images", tags: ["docker"] },
          ],
        },
        {
          id: "sj-m5-t2",
          title: "Kubernetes & Helm",
          importance: "HIGH",
          checklist: [
            { id: "sj-m5-t2-c1", level: 2, criteria: "Deploy ứng dụng + PostgreSQL + Redis lên cluster kind local với manifest chuẩn: probes, resources, ConfigMap/Secret" },
            { id: "sj-m5-t2-c2", level: 2, criteria: "Đóng gói toàn bộ thành Helm chart có values cho môi trường" },
            { id: "sj-m5-t2-c3", level: 3, criteria: "Giải thích cách đặt requests/limits và hệ quả của thiếu/thừa với scheduling và OOMKill" },
          ],
          resources: [
            { url: "https://kubernetes.io/docs/home/", title: "Kubernetes Documentation", tags: ["k8s"] },
          ],
        },
        {
          id: "sj-m5-t3",
          title: "Observability: metrics, logs, traces",
          importance: "HIGH",
          checklist: [
            { id: "sj-m5-t3-c1", level: 1, criteria: "Giải thích ba trụ cột observability và khác biệt monitoring vs observability" },
            { id: "sj-m5-t3-c2", level: 2, criteria: "Cài OpenTelemetry: trace một request xuyên ứng dụng chính -> Kafka -> metadata-service với cùng trace id (tận dụng context propagation @Async của Boot 4.1)" },
            { id: "sj-m5-t3-c3", level: 2, criteria: "Dựng Prometheus + Grafana dashboard cho ứng dụng: latency percentiles, error rate, JVM metrics" },
            { id: "sj-m5-t3-c4", level: 4, criteria: "Truy vết một request chậm end-to-end từ dashboard đến root cause và viết note sự cố" },
          ],
          resources: [
            { url: "https://opentelemetry.io/docs/", title: "OpenTelemetry Documentation", tags: ["observability"] },
          ],
        },
        {
          id: "sj-m5-t4",
          title: "CI/CD",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m5-t4-c1", level: 2, criteria: "Pipeline GitHub Actions: build, test (Testcontainers), build image, push registry" },
            { id: "sj-m5-t4-c2", level: 3, criteria: "So sánh chiến lược deploy rolling vs blue-green vs canary và điều kiện áp dụng" },
          ],
          resources: [
            { url: "https://docs.github.com/en/actions", title: "GitHub Actions Docs", tags: ["cicd"] },
          ],
        },
        {
          id: "sj-m5-t5",
          title: "Capstone M5: hệ thống chạy trọn vẹn trên K8s local",
          importance: "HIGH",
          checklist: [
            { id: "sj-m5-t5-c1", level: 2, criteria: "Toàn bộ các service của ứng dụng chạy trên kind, có dashboard observability đầy đủ" },
            { id: "sj-m5-t5-c2", level: 2, criteria: "Một lần 'diễn tập sự cố': tự gây lỗi (kill pod, chặn mạng) và dùng traces/metrics tìm ra" },
          ],
          resources: [],
        },
      ],
    },
    {
      id: "sj-m6",
      code: "M6",
      title: "Generative AI Systems Integration",
      summary: "Spring AI 2.x (dòng tương thích Boot 4), RAG với pgvector, MCP, và prompt/context engineering — thực hành trên chính kho notes của bạn.",
      weight: 14,
      topics: [
        {
          id: "sj-m6-t1",
          title: "Spring AI 2.x foundation",
          importance: "HIGH",
          checklist: [
            { id: "sj-m6-t1-c1", level: 1, criteria: "Giải thích các abstraction của Spring AI: ChatClient, model portability, tool calling, advisor" },
            { id: "sj-m6-t1-c2", level: 2, criteria: "Kiểm tra trạng thái GA của Spring AI 2.0; tích hợp một LLM provider vào ứng dụng qua ChatClient" },
          ],
          resources: [
            { url: "https://docs.spring.io/spring-ai/reference/", title: "Spring AI Reference", tags: ["spring-ai"] },
          ],
        },
        {
          id: "sj-m6-t2",
          title: "RAG & vector search với pgvector",
          importance: "HIGH",
          checklist: [
            { id: "sj-m6-t2-c1", level: 1, criteria: "Giải thích embeddings, similarity search và pipeline RAG chuẩn: ingest -> chunk -> embed -> retrieve -> generate" },
            { id: "sj-m6-t2-c2", level: 2, criteria: "Index toàn bộ notes vào pgvector, xây tính năng 'hỏi đáp với ghi chú của tôi' có trích nguồn note" },
            { id: "sj-m6-t2-c3", level: 3, criteria: "Phân tích trade-off chunking strategy (kích thước, overlap, theo heading Markdown) lên chất lượng retrieval" },
          ],
          resources: [
            { url: "https://github.com/pgvector/pgvector", title: "pgvector", tags: ["rag", "pgvector"] },
          ],
        },
        {
          id: "sj-m6-t3",
          title: "MCP: ứng dụng thành công cụ cho AI agent",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m6-t3-c1", level: 1, criteria: "Giải thích Model Context Protocol: server/client, tools, resources, transports" },
            { id: "sj-m6-t3-c2", level: 2, criteria: "Phơi ứng dụng thành MCP server: agent có thể đọc tiến độ, thêm note, đánh dấu checklist (Spring AI 2.x MCP annotations)" },
            { id: "sj-m6-t3-c3", level: 3, criteria: "Phân tích khi nào dùng tool calling / MCP thay vì nhồi dữ liệu vào RAG context" },
          ],
          resources: [
            { url: "https://modelcontextprotocol.io/", title: "Model Context Protocol", tags: ["mcp", "ai"] },
          ],
        },
        {
          id: "sj-m6-t4",
          title: "Prompt & context engineering trong code",
          importance: "MEDIUM",
          checklist: [
            { id: "sj-m6-t4-c1", level: 2, criteria: "Xây tính năng tự sinh câu hỏi ôn tập từ notes của một topic, output JSON có cấu trúc" },
            { id: "sj-m6-t4-c2", level: 3, criteria: "Tối ưu chi phí và chất lượng: quản lý context window, chọn model theo tác vụ, đo lường bằng bộ test câu hỏi" },
          ],
          resources: [],
        },
        {
          id: "sj-m6-t5",
          title: "Capstone M6: trợ lý học tập trên chính ứng dụng của bạn",
          importance: "HIGH",
          checklist: [
            { id: "sj-m6-t5-c1", level: 2, criteria: "Tính năng 'ôn tập hàng tuần': RAG tổng hợp những gì đã học, sinh quiz, lưu kết quả vào notes" },
            { id: "sj-m6-t5-c2", level: 4, criteria: "Viết ADR tổng kết kiến trúc AI: luồng dữ liệu, bảo mật (prompt injection từ nội dung bookmark), chi phí vận hành" },
          ],
          resources: [],
        },
      ],
    },
  ],
};
