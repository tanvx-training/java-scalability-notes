// Liên kết chéo giữa tài liệu KHÁC lĩnh vực — "đọc liền mạch trên con đường".
// Khai MỘT chiều; lib/labels.js (relatedOf) phản chiếu hai chiều khi đọc.
// Chỉ nối cặp có lý do đọc-liền-mạch thật (cùng cơ chế nhìn từ hai tầng, hoặc
// lý thuyết ↔ hệ thật), không nối vì trùng từ khoá. Cùng lĩnh vực đã có
// prev/next và lộ trình nên KHÔNG khai ở đây (bất biến R1 chặn).

export const related = {
  // ---- Java Scalability ↔ kernel (Lập trình hệ thống) và Loom (Modern Concurrency) ----
  "java-01": ["sysprog-11"],                        // accept queue, socket ↔ lập trình mạng
  "java-02": ["sysprog-11", "kafka-07"],            // timeout, retry, idempotency ↔ socket; truyền tin cậy
  "java-03": ["mjia-15", "modconc-06"],             // sync/async ↔ CompletableFuture & reactive nền; reactive sau Loom
  "java-04": ["sysprog-06", "sysprog-10"],          // thread JVM ↔ luồng và lập lịch kernel
  "java-05": ["modconc-02", "modconc-03"],          // virtual thread tóm tắt ↔ sách đi sâu
  "java-06": ["modconc-03"],                        // TaskQueue/pool ↔ cơ chế pool, ForkJoinPool
  "java-07": ["modconc-03"],                        // pool sizing ↔ carrier pool
  "java-08": ["springstart-12"],                    // HikariCP ↔ data source trong Spring
  "java-09": ["springstart-06", "springstart-13"],  // AOP proxy, @Transactional ↔ AOP và transaction nhập môn
  "java-10": ["springstart-13", "ddia-08"],         // bẫy @Transactional ↔ transaction Spring; isolation trong DDIA

  // ---- Modern Java ↔ Modern Concurrency ----
  "mjia-07":  ["modconc-03"],                       // parallel stream/ForkJoin ↔ ForkJoinPool trong Loom
  "mjia-16":  ["modconc-01", "modconc-04"],         // CompletableFuture ↔ hành trình concurrency, structured concurrency
  "mjia-17":  ["modconc-06"],                       // reactive ↔ reactive trong bối cảnh virtual thread

  // ---- Spring Security ↔ Spring Start Here ----
  "springsec-02": ["springstart-07"],               // ứng dụng Spring Boot đầu tiên
  "springsec-05": ["springstart-08"],               // filter chain ↔ web app MVC
  "springsec-18": ["springstart-15"],               // kiểm thử cấu hình bảo mật ↔ kiểm thử Spring

  // ---- DDIA (lý thuyết) ↔ Kafka (hệ thật) ----
  "ddia-05": ["kafka-03"],                          // encoding/schema ↔ serializer, Avro ở producer
  "ddia-06": ["kafka-06", "kafka-10"],              // replication ↔ replication nội bộ, mirroring liên cluster
  "ddia-07": ["kafka-06"],                          // sharding ↔ partition
  "ddia-08": ["kafka-08"],                          // transaction ↔ exactly-once
  "ddia-10": ["kafka-06"],                          // consensus ↔ controller, KRaft
  "ddia-11": ["kafka-09"],                          // batch ↔ data pipeline (Connect)
  "ddia-12": ["kafka-14"],                          // stream processing ↔ Kafka Streams
  "ddia-13": ["kafka-14"],

  // ---- Kubernetes ↔ Lập trình hệ thống ----
  "k8sbook-02": ["sysprog-04"],                     // container là tiến trình
  "kuar-02":    ["sysprog-04"],

  // ---- Trục Senior Java → điểm vào từng con đường ----
  "sj-01": ["java-01", "mjia-01", "springstart-01"],
  "sj-03": ["study-guide", "cka-study-guide"],
  "sj-04": ["ddia-01", "kafka-02"],

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
};
