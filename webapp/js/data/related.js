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

  // ---- Java Concurrency in Practice ↔ phần còn lại của con đường Java Backend ----
  "jcip-02": ["wgjd-05"],                                 // thread safety, atomicity ↔ nền tảng concurrency và JMM
  "jcip-03": ["wgjd-05", "java-04"],                      // visibility, safe publication ↔ JMM; bí ẩn RUNNABLE
  "jcip-05": ["wgjd-06", "mjia-15"],                      // building block ↔ thư viện concurrency JDK; CompletableFuture
  "jcip-06": ["java-06", "modconc-01"],                   // Executor ↔ TaskQueue Tomcat; hành trình concurrency của Java
  "jcip-07": ["modconc-04", "java-05"],                   // huỷ task ↔ structured concurrency giải lại bài này; virtual thread
  "jcip-08": ["java-07", "java-06"],                      // NGUỒN GỐC công thức sizing ↔ bài dùng lại công thức Goetz; TaskQueue
  "jcip-10": ["java-04", "java-10"],                      // deadlock ↔ đọc thread dump; bẫy deadlock REQUIRES_NEW
  "jcip-11": ["java-07", "wgjd-07", "mjia-07"],           // Amdahl, chi phí thread ↔ capacity planning; đo hiệu năng; parallel stream
  "jcip-13": ["java-04", "modconc-03"],                   // ReentrantLock ↔ ReentrantLock=WAITING; cơ chế concurrency hiện đại
  "jcip-14": ["modconc-04", "wgjd-16"],                   // AQS, synchronizer ↔ structured concurrency; concurrency nâng cao
  "jcip-15": ["wgjd-17", "modconc-03"],                   // CAS, nonblocking ↔ nội tại JVM; cơ chế hiện đại
  "jcip-16": ["wgjd-05", "java-03"],                      // JMM ↔ JMM ở WGJD; sync≠blocking

  // ---- Optimizing Cloud Native Java ↔ WGJD (nội tại JVM), sysprog (kernel),
  //      java (ứng dụng), jcip & modern-concurrency (concurrency), ddia & kafka (phân tán) ----
  "ocnj-01": ["wgjd-07", "java-07"],              // bảy đại lượng ↔ hiệu năng Java; ↔ capacity planning dùng chính chúng
  "ocnj-02": ["wgjd-07"],                         // phương pháp luận đo ↔ đo hiệu năng
  "ocnj-03": ["wgjd-04", "wgjd-17"],              // classloading, bytecode, JIT ↔ class file; ↔ nội tại JVM hiện đại
  "ocnj-04": ["wgjd-07", "sysprog-05"],           // GC, TLAB, allocation ↔ GC và JIT làm gì sau lưng bạn; ↔ bộ cấp phát bộ nhớ tầng C
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

  // ---- Java Persistence ↔ ddia (lý thuyết dữ liệu), java (bẫy production),
  //      spring-start (nhập môn Spring), jcip (race condition), spring-security ----
  "jpa-01": ["ddia-03"],                                      // paradigm mismatch ↔ mô hình dữ liệu và ngôn ngữ truy vấn
  "jpa-04": ["springstart-14"],                               // Spring Data JPA đầy đủ ↔ lưu trữ dữ liệu với Spring Data nhập môn
  "jpa-10": ["java-09"],                                      // persistence context ↔ Connection trong ThreadLocal, cùng một ranh giới transaction
  "jpa-11": ["ddia-08", "java-10", "springstart-13", "jcip-02"], // transaction ↔ isolation lý thuyết; bẫy production; nhập môn; lost update ↔ check-then-act
  "jpa-12": ["java-08"],                                      // n+1 và fetch strategy ↔ giữ connection quá lâu khi sizing pool
  "jpa-14": ["springstart-06", "springstart-12"],             // mẫu DAO ↔ Spring AOP; ↔ data source
  "jpa-16": ["springstart-10", "springsec-11"],               // Spring Data REST ↔ REST service viết tay; ↔ phân quyền cấp phương thức
  "jpa-17": ["ddia-03"],                                      // tham chiếu document ↔ mô hình document so với quan hệ
  "jpa-20": ["springstart-15"],                               // kiểm thử persistence ↔ kiểm thử ứng dụng Spring
};
