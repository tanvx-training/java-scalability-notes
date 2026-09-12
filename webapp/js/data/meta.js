// Danh mục dùng chung cho toàn bộ dữ liệu học tập.
// Mọi câu hỏi / flashcard / lab đều tham chiếu các key ở đây.

export const CERTS = {
  KCNA: { label: "KCNA", color: "teal" },
  KCSA: { label: "KCSA", color: "cyan" },
  CKAD: { label: "CKAD", color: "blue" },
  CKA: { label: "CKA", color: "indigo" },
  CKS: { label: "CKS", color: "purple" },
};

// Domain theo curriculum CKAD (kèm tỷ trọng điểm), cộng thêm nhóm mở rộng
// cho câu hỏi thuộc CKA / CKS / KCNA.
export const DOMAINS = {
  design: {
    label: "Application Design and Build",
    short: "Design & Build",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
  deployment: {
    label: "Application Deployment",
    short: "Deployment",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
  observability: {
    label: "Application Observability and Maintenance",
    short: "Observability",
    weight: 15,
    cert: "CKAD",
    field: "kubernetes",
  },
  config: {
    label: "Application Environment, Configuration and Security",
    short: "Config & Security",
    weight: 25,
    cert: "CKAD",
    field: "kubernetes",
  },
  networking: {
    label: "Services and Networking",
    short: "Services & Networking",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
  "cka-core": {
    label: "CKA — Cluster Administration",
    short: "CKA Core",
    weight: 0,
    cert: "CKA",
    field: "kubernetes",
  },
  "cks-core": {
    label: "CKS — Cluster Security",
    short: "CKS Core",
    weight: 0,
    cert: "CKS",
    field: "kubernetes",
  },
  "kcna-core": {
    label: "KCNA — Cloud Native Fundamentals",
    short: "KCNA Core",
    weight: 0,
    cert: "KCNA",
    field: "kubernetes",
  },

  // ===== System Programming (chương nguồn trong ngoặc) =====
  "sp-c":           { label: "C & Bộ nhớ",               short: "C & Bộ nhớ",     weight: 0, field: "sysprog" }, // ch 2, 3, 5
  "sp-process":     { label: "Tiến trình & Tín hiệu",    short: "Tiến trình",     weight: 0, field: "sysprog" }, // ch 4, 13
  "sp-concurrency": { label: "Luồng & Đồng bộ hoá",      short: "Đồng bộ hoá",    weight: 0, field: "sysprog" }, // ch 6, 7
  "sp-deadlock":    { label: "Deadlock & Lập lịch",      short: "Deadlock",       weight: 0, field: "sysprog" }, // ch 8, 10
  "sp-memory-ipc":  { label: "Bộ nhớ ảo & IPC",          short: "Bộ nhớ ảo & IPC", weight: 0, field: "sysprog" }, // ch 9
  "sp-io":          { label: "Hệ thống tệp & Mạng",      short: "Tệp & Mạng",     weight: 0, field: "sysprog" }, // ch 11, 12
  "sp-security":    { label: "Bảo mật",                  short: "Bảo mật",        weight: 0, field: "sysprog" }, // ch 14
};

// Chủ đề flashcard.
export const TOPICS = {
  architecture: { label: "Kiến trúc K8s", field: "kubernetes" },
  pods: { label: "Pods & Multi-container", field: "kubernetes" },
  workloads: { label: "Deployments, Jobs, CronJobs", field: "kubernetes" },
  config: { label: "ConfigMaps & Secrets", field: "kubernetes" },
  resources: { label: "Resources & Quota", field: "kubernetes" },
  security: { label: "Security & RBAC", field: "kubernetes" },
  observability: { label: "Probes & Debugging", field: "kubernetes" },
  networking: { label: "Services, Ingress, NetworkPolicy", field: "kubernetes" },
  storage: { label: "Volumes, PV & PVC", field: "kubernetes" },
  helm: { label: "Helm & Kustomize", field: "kubernetes" },
  kubectl: { label: "kubectl & Imperative", field: "kubernetes" },
  "exam-tips": { label: "Mẹo phòng thi", field: "kubernetes" },

  // ===== System Programming (chương nguồn trong ngoặc) =====
  "sp-c":           { label: "C & Bộ nhớ",               field: "sysprog" }, // ch 2, 3, 5
  "sp-process":     { label: "Tiến trình & Tín hiệu",    field: "sysprog" }, // ch 4, 13
  "sp-concurrency": { label: "Luồng & Đồng bộ hoá",      field: "sysprog" }, // ch 6, 7
  "sp-deadlock":    { label: "Deadlock & Lập lịch",      field: "sysprog" }, // ch 8, 10
  "sp-memory-ipc":  { label: "Bộ nhớ ảo & IPC",          field: "sysprog" }, // ch 9
  "sp-io":          { label: "Hệ thống tệp & Mạng",      field: "sysprog" }, // ch 11, 12
  "sp-security":    { label: "Bảo mật",                  field: "sysprog" }, // ch 14
};

// Nhóm lệnh cho trang tra cứu kubectl.
export const COMMAND_CATEGORIES = {
  setup: { label: "Setup & Context" },
  cluster: { label: "Cluster Admin (kubeadm, etcd)" },
  node: { label: "Node & Runtime" },
  sectools: { label: "Security Tools" },
  pods: { label: "Pods" },
  workloads: { label: "Deployments, Jobs, CronJobs" },
  config: { label: "ConfigMaps & Secrets" },
  security: { label: "Security & RBAC" },
  networking: { label: "Services & Networking" },
  storage: { label: "Volumes & PVC" },
  helm: { label: "Helm & Kustomize" },
  debug: { label: "Debug & Observability" },
  output: { label: "Output & JSONPath" },
};

export const DIFFICULTY = {
  1: { label: "Dễ", color: "green" },
  2: { label: "Trung bình", color: "amber" },
  3: { label: "Khó", color: "red" },
};

// Chủ đề của ngân hàng câu hỏi phỏng vấn — cùng hình dạng DOMAINS/TOPICS, nhưng
// `field` BẮT BUỘC khai tường minh (DOMAINS mặc định "kubernetes" vì lý do lịch
// sử; ngân hàng này mới nên không thừa kế mặc định đó).
//
// Chỉ khai chủ đề cho lĩnh vực ĐÃ có câu hỏi — giống nếp `modules` trong fields.js.
export const INTERVIEW_TOPICS = {
  "jpa-mapping":   { label: "Ánh xạ & domain model",          short: "Ánh xạ",      field: "jpa" },
  "jpa-assoc":     { label: "Collection & association",       short: "Association", field: "jpa" },
  "jpa-lifecycle": { label: "Persistence context & vòng đời", short: "Vòng đời",    field: "jpa" },
  "jpa-tx":        { label: "Transaction & concurrency",      short: "Transaction", field: "jpa" },
  "jpa-fetch":     { label: "Fetch plan & truy vấn",          short: "Fetch",       field: "jpa" },
  "jpa-spring":    { label: "Tích hợp Spring & kiểm thử",     short: "Spring",      field: "jpa" },

  "jcip-safety":   { label: "Thread safety & chia sẻ đối tượng",   short: "Safety",    field: "jcip" },
  "jcip-design":   { label: "Thiết kế class thread-safe",          short: "Thiết kế",  field: "jcip" },
  "jcip-blocks":   { label: "Building block của java.util.concurrent", short: "Building block", field: "jcip" },
  "jcip-exec":     { label: "Thực thi task, huỷ và thread pool",   short: "Thực thi",  field: "jcip" },
  "jcip-liveness": { label: "Deadlock, hiệu năng & khả năng mở rộng", short: "Liveness", field: "jcip" },
  "jcip-lowlevel": { label: "Explicit lock, AQS, atomic và JMM",   short: "Tầng thấp", field: "jcip" },

  "ocnj-method":     { label: "Phương pháp luận đo và thống kê",      short: "Phương pháp", field: "ocnj" },
  "ocnj-jvm":        { label: "Nội tại JVM và thực thi mã",          short: "JVM",         field: "ocnj" },
  "ocnj-gc":         { label: "Garbage collection",                  short: "GC",          field: "ocnj" },
  "ocnj-cloud":      { label: "Phần cứng, OS và cloud stack",        short: "Cloud",       field: "ocnj" },
  "ocnj-observe":    { label: "Observability và profiling",          short: "Observe",     field: "ocnj" },
  "ocnj-concurrent": { label: "Hiệu năng đồng thời và hệ phân tán",  short: "Đồng thời",   field: "ocnj" },

  "java-request":  { label: "Hành trình request và timeout",          short: "Request",  field: "java" },
  "java-blocking": { label: "Blocking, non-blocking và thread lifecycle", short: "Blocking", field: "java" },
  "java-vthread":  { label: "Virtual threads",                        short: "VThread",  field: "java" },
  "java-tomcat":   { label: "Tomcat thread pool và sizing",           short: "Tomcat",   field: "java" },
  "java-pool":     { label: "Connection pool sizing",                 short: "DB pool",  field: "java" },
  "java-tx":       { label: "@Transactional: proxy, ThreadLocal và bẫy", short: "Tx",     field: "java" },

  "mj-lambda":      { label: "Lambda và behavior parameterization",    short: "Lambda",      field: "modern-java" },
  "mj-stream":      { label: "Stream và collector",                    short: "Stream",      field: "modern-java" },
  "mj-parallel":    { label: "Xử lý song song và hiệu năng",           short: "Song song",   field: "modern-java" },
  "mj-optional":    { label: "Optional, Date/Time và default method",  short: "Optional",    field: "modern-java" },
  "mj-async":       { label: "CompletableFuture và reactive",          short: "Async",       field: "modern-java" },
  "mj-functional":  { label: "Tư duy hàm và kỹ thuật FP",              short: "Tư duy hàm",  field: "modern-java" },

  "wg-modern":      { label: "Java hiện đại: record, sealed, pattern matching",  short: "Java hiện đại",  field: "wgjd" },
  "wg-module":      { label: "Hệ thống module",                                  short: "Module",         field: "wgjd" },
  "wg-bytecode":    { label: "Class file, bytecode và nội tại JVM",              short: "Bytecode",       field: "wgjd" },
  "wg-concurrent":  { label: "Lập trình đồng thời và thư viện JDK",              short: "Concurrency",    field: "wgjd" },
  "wg-perf":        { label: "Hiểu về hiệu năng Java",                           short: "Hiệu năng",      field: "wgjd" },
  "wg-build":       { label: "Build, container và kiểm thử",                     short: "Build & test",   field: "wgjd" },

  "dd-tradeoff":     { label: "Đánh đổi kiến trúc và yêu cầu phi chức năng",  short: "Đánh đổi",     field: "ddia" },
  "dd-model":        { label: "Mô hình dữ liệu, lưu trữ và encoding",         short: "Mô hình",      field: "ddia" },
  "dd-replication":  { label: "Replication và sharding",                      short: "Replication",  field: "ddia" },
  "dd-transaction":  { label: "Transaction và mức cô lập",                    short: "Transaction",  field: "ddia" },
  "dd-distributed":  { label: "Rắc rối hệ phân tán và consensus",             short: "Hệ phân tán",  field: "ddia" },
  "dd-processing":   { label: "Batch và stream processing",                   short: "Processing",   field: "ddia" },

  "kf-producer":     { label: "Producer: ghi message",                               short: "Producer",   field: "kafka" },
  "kf-consumer":     { label: "Consumer: đọc và commit offset",                      short: "Consumer",   field: "kafka" },
  "kf-internals":    { label: "Cơ chế bên trong: controller, replication, lưu trữ",  short: "Bên trong",  field: "kafka" },
  "kf-reliability":  { label: "Truyền tin cậy và exactly-once",                      short: "Tin cậy",    field: "kafka" },
  "kf-integration":  { label: "Data pipeline, mirroring và admin",                   short: "Pipeline",   field: "kafka" },
  "kf-ops":          { label: "Bảo mật, vận hành, giám sát và stream",               short: "Vận hành",   field: "kafka" },

  "mc-vthread":     { label: "Virtual thread: cơ chế và kỳ vọng",                  short: "VThread",     field: "modern-concurrency" },
  "mc-mechanics":   { label: "Cơ chế concurrency hiện đại: pool và continuation",  short: "Cơ chế",      field: "modern-concurrency" },
  "mc-structured":  { label: "Structured concurrency",                             short: "Structured",  field: "modern-concurrency" },
  "mc-scoped":      { label: "Scoped values",                                      short: "Scoped",      field: "modern-concurrency" },
  "mc-reactive":    { label: "Reactive sau virtual thread",                        short: "Reactive",    field: "modern-concurrency" },
  "mc-framework":   { label: "Framework và di trú thực tế",                        short: "Framework",   field: "modern-concurrency" },

  "ss-context":  { label: "Spring context: định nghĩa và wiring bean",  short: "Context",  field: "spring-start" },
  "ss-scope":    { label: "Abstraction, bean scope và vòng đời",        short: "Scope",    field: "spring-start" },
  "ss-aop":      { label: "Spring AOP",                                 short: "AOP",      field: "spring-start" },
  "ss-mvc":      { label: "Spring Boot, MVC và web scope",              short: "MVC",      field: "spring-start" },
  "ss-rest":     { label: "REST service và REST client",                short: "REST",     field: "spring-start" },
  "ss-data":     { label: "Data source, transaction và kiểm thử",       short: "Data",     field: "spring-start" },

  "ssec-auth":      { label: "Xác thực: UserDetails, PasswordEncoder, SecurityContext",  short: "Xác thực",    field: "spring-security" },
  "ssec-filter":    { label: "Chuỗi bộ lọc HTTP",                                        short: "Bộ lọc",      field: "spring-security" },
  "ssec-authz":     { label: "Phân quyền endpoint và phương thức",                       short: "Phân quyền",  field: "spring-security" },
  "ssec-csrf":      { label: "CSRF và CORS",                                             short: "CSRF/CORS",   field: "spring-security" },
  "ssec-oauth":     { label: "OAuth 2 và OpenID Connect",                                short: "OAuth 2",     field: "spring-security" },
  "ssec-reactive":  { label: "Bảo mật phản ứng và kiểm thử",                             short: "Reactive",    field: "spring-security" },
};
