// Tài liệu lĩnh vực "Java Under the Hood" — 27 tài liệu: lộ trình series (00, Phần A
// của PDF Bài 01) và bài 01–26.
// Nguồn markdown: sources/under-hood/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/under-hood/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` (số bài / null) và `part` (chặng / null): nhãn hiển thị sinh bởi
// labels.js ("Bài 5 · …"), `title` chỉ còn tên bài (bất biến D1) — lấy đủ tên trong
// danh sách 26 bài của 00-lo-trinh-series.md (bỏ backtick).
//
// KHÔNG đổi tên tệp nguồn: các link "[Bài NN](NN-slug.md)" trong series được
// docs.js (rewriteMarkdownLinks) đổi thành #/docs/uh-NN nhờ khớp đúng `file` dưới đây.

const C1 = "Chặng I — Nền móng";
const C2 = "Chặng II — Execution engine";
const C3 = "Chặng III — Bộ nhớ & GC";
const C4 = "Chặng IV — Concurrency";
const C5 = "Chặng V — Ngôn ngữ dưới lớp vỏ";
const C6 = "Chặng VI — Quan sát & chẩn đoán";

export const docs = [
  {
    id: "uh-00", field: "under-hood", chapter: null, part: null,
    title: "Lộ trình series Java Under the Hood",
    file: "content/under-hood/00-lo-trinh-series.md", icon: "🗺️",
    desc: "Series dành cho ai và học được gì, bản đồ 6 chặng / 26 bài kèm câu hỏi của từng bài, nhịp chung mỗi bài, quy ước màu và môi trường đề xuất (JDK 25/27, Spring Boot 4.x).",
    tags: ["JVM", "Giới thiệu", "Lộ trình"],
  },
  {
    id: "uh-01", field: "under-hood", chapter: 1, part: C1,
    title: "Chuyện gì xảy ra khi bạn gõ java? — Bức tranh toàn cảnh JVM",
    file: "content/under-hood/01-buc-tranh-toan-canh-jvm.md", icon: "🔭",
    desc: "Theo một chương trình từ javac tới khi tiến trình thoát: class file, launcher, nạp class, vùng nhớ, interpreter/JIT, GC, các thread ngầm, shutdown — và vì sao chương trình \"một thread\" có 20 thread hệ điều hành.",
    tags: ["JVM", "Kiến trúc", "Vòng đời tiến trình"],
  },
  {
    id: "uh-02", field: "under-hood", chapter: 2, part: C1,
    title: "Class file & bytecode: đọc javap như đọc mã nguồn",
    file: "content/under-hood/02-class-file-bytecode.md", icon: "🧬",
    desc: "Mổ từng byte một class file: constant pool, descriptor, các nhóm opcode, năm lệnh invoke, exception table, StackMapTable và verifier — thấy tận mắt vì sao count++ không an toàn đa luồng.",
    tags: ["JVM", "Bytecode", "javap"],
  },
  {
    id: "uh-03", field: "under-hood", chapter: 3, part: C1,
    title: "Class loading chuyên sâu",
    file: "content/under-hood/03-class-loading.md", icon: "📦",
    desc: "Loading → linking (verify, prepare, resolve) → initialization và <clinit>, mô hình uỷ quyền, JPMS, class loader của fat jar Spring Boot; ClassNotFoundException khác NoClassDefFoundError ra sao, vì sao Metaspace OOM sau nhiều lần redeploy.",
    tags: ["JVM", "Class loading", "Metaspace"],
  },
  {
    id: "uh-04", field: "under-hood", chapter: 4, part: C1,
    title: "Runtime Data Areas: stack, heap, metaspace, code cache và phần \"ngoài heap\"",
    file: "content/under-hood/04-runtime-data-areas.md", icon: "🗄️",
    desc: "Stack frame và StackOverflowError, heap, metaspace, code cache, direct memory, stack của thread; đo toàn bộ bộ nhớ tiến trình bằng Native Memory Tracking để trả lời vì sao pod bị OOMKilled dù heap còn trống một nửa.",
    tags: ["JVM", "Bộ nhớ", "NMT"],
  },
  {
    id: "uh-05", field: "under-hood", chapter: 5, part: C1,
    title: "Một object Java thực sự nằm trong RAM như thế nào",
    file: "content/under-hood/05-object-trong-ram.md", icon: "🧱",
    desc: "Object header (mark word, klass pointer), sắp xếp field, padding, compressed oops và vách 32 GB, Compact Object Headers (JEP 519/534); đo bằng JOL vì sao một triệu Long không phải 8 MB.",
    tags: ["JVM", "Object layout", "JOL"],
  },
  {
    id: "uh-06", field: "under-hood", chapter: 6, part: C2,
    title: "Interpreter & cơ chế gọi method",
    file: "content/under-hood/06-interpreter-goi-method.md", icon: "⚙️",
    desc: "Template interpreter và quickening, một lời gọi method trong interpreter, vtable và itable, inline cache, megamorphic call và CHA — gọi qua interface có thật sự chậm hơn gọi qua class không.",
    tags: ["JVM", "Interpreter", "Dispatch"],
  },
  {
    id: "uh-07", field: "under-hood", chapter: 7, part: C2,
    title: "JIT & tiered compilation",
    file: "content/under-hood/07-jit-tiered-compilation.md", icon: "🚀",
    desc: "C1, C2 và năm tầng biên dịch, profiling, OSR, deoptimization, code cache; đọc -XX:+PrintCompilation và JFR để hiểu vì sao latency tệ vài phút đầu sau deploy và warm-up đúng cách là gì.",
    tags: ["JVM", "JIT", "Warm-up"],
  },
  {
    id: "uh-08", field: "under-hood", chapter: 8, part: C2,
    title: "Những phép tối ưu của JIT",
    file: "content/under-hood/08-toi-uu-jit.md", icon: "🪄",
    desc: "Inlining, escape analysis và scalar replacement, lock elision, loop unrolling, intrinsics, auto-vectorization, viết microbenchmark đúng với JMH — vì sao new trong vòng lặp nóng đôi khi không cấp phát gì.",
    tags: ["JVM", "JIT", "JMH"],
  },
  {
    id: "uh-09", field: "under-hood", chapter: 9, part: C2,
    title: "Khởi động nhanh: CDS, AOT cache (Project Leyden), CRaC, GraalVM Native Image",
    file: "content/under-hood/09-khoi-dong-nhanh-cds-aot-native.md", icon: "⏱️",
    desc: "Thời gian khởi động thật sự đi đâu; CDS, AppCDS, AOT cache của Leyden (JEP 483/514/515), CRaC và Native Image — đưa Spring Boot xuống dưới một giây bằng cách nào và đánh đổi gì.",
    tags: ["JVM", "Khởi động", "Leyden"],
  },
  {
    id: "uh-10", field: "under-hood", chapter: 10, part: C3,
    title: "Nền tảng GC",
    file: "content/under-hood/10-nen-tang-gc.md", icon: "♻️",
    desc: "Reachability và GC roots, mark–sweep–compact, copying, giả thuyết thế hệ, TLAB, write barrier, card table, safepoint — GC nhận ra rác thế nào khi có vòng tham chiếu.",
    tags: ["JVM", "GC", "Thuật toán"],
  },
  {
    id: "uh-11", field: "under-hood", chapter: 11, part: C3,
    title: "Mổ xẻ G1",
    file: "content/under-hood/11-mo-xe-g1.md", icon: "🧩",
    desc: "Region, remembered set, SATB, young và mixed GC, humongous object, mục tiêu pause; đọc từng dòng log G1 để biết MaxGCPauseMillis=200 thực sự hứa điều gì.",
    tags: ["JVM", "G1", "Log GC"],
  },
  {
    id: "uh-12", field: "under-hood", chapter: 12, part: C3,
    title: "ZGC & Shenandoah",
    file: "content/under-hood/12-zgc-shenandoah.md", icon: "⚡",
    desc: "Colored pointers, load barrier, relocation đồng thời, Generational ZGC và Generational Shenandoah — pause dưới 1 ms đổi lấy cái giá nào về CPU, bộ nhớ và throughput.",
    tags: ["JVM", "ZGC", "Low-latency"],
  },
  {
    id: "uh-13", field: "under-hood", chapter: 13, part: C3,
    title: "Chọn và tinh chỉnh GC cho container",
    file: "content/under-hood/13-gc-cho-container.md", icon: "🐳",
    desc: "JVM nhìn container ra sao: ergonomics \"server-class\", heap mặc định 25% và MaxRAMPercentage, CPU limit là throttling, bốn GC trong pod nhỏ, JEP 523 — pod 1 vCPU của bạn đang chạy GC nào.",
    tags: ["JVM", "Container", "Ergonomics"],
  },
  {
    id: "uh-14", field: "under-hood", chapter: 14, part: C3,
    title: "Đọc log GC & săn memory leak",
    file: "content/under-hood/14-log-gc-memory-leak.md", icon: "🔍",
    desc: "Unified logging, heap dump, Eclipse MAT, dominator tree và retained size, case study rò rỉ trong Spring Boot — heap tăng dần qua nhiều ngày là leak thật hay chỉ là cache.",
    tags: ["JVM", "Memory leak", "Heap dump"],
  },
  {
    id: "uh-15", field: "under-hood", chapter: 15, part: C3,
    title: "Reference & bộ nhớ ngoài heap",
    file: "content/under-hood/15-reference-off-heap.md", icon: "🔗",
    desc: "Soft/Weak/Phantom reference, Cleaner thay finalization, rò rỉ ThreadLocal, DirectByteBuffer, Foreign Function & Memory API — vì sao Netty/Kafka client dùng RAM vượt xa -Xmx.",
    tags: ["JVM", "Reference", "Off-heap"],
  },
  {
    id: "uh-16", field: "under-hood", chapter: 16, part: C4,
    title: "Java Memory Model",
    file: "content/under-hood/16-java-memory-model.md", icon: "🧠",
    desc: "Ba tầng sắp xếp lại lệnh (javac, JIT, CPU store buffer), happens-before, volatile trong mã máy, bốn mức truy cập của VarHandle, final và safe publication — vì sao double-checked locking thiếu volatile lại hỏng.",
    tags: ["JVM", "JMM", "Happens-before"],
  },
  {
    id: "uh-17", field: "under-hood", chapter: 17, part: C4,
    title: "synchronized và monitor bên trong HotSpot",
    file: "content/under-hood/17-synchronized-monitor.md", icon: "🔒",
    desc: "Mark word và trạng thái khoá, CAS, lock inflation, việc gỡ biased locking, so sánh với ReentrantLock — synchronized có thật sự \"chậm\" không.",
    tags: ["JVM", "Lock", "Monitor"],
  },
  {
    id: "uh-18", field: "under-hood", chapter: 18, part: C4,
    title: "Thread, safepoint & stop-the-world",
    file: "content/under-hood/18-thread-safepoint.md", icon: "🛑",
    desc: "Platform thread ↔ OS thread, trạng thái thread, safepoint poll và time-to-safepoint, đọc thread dump — pause dài nhưng log GC ngắn thì thời gian đi đâu.",
    tags: ["JVM", "Safepoint", "Thread dump"],
  },
  {
    id: "uh-19", field: "under-hood", chapter: 19, part: C4,
    title: "Virtual threads mổ xẻ",
    file: "content/under-hood/19-virtual-threads.md", icon: "🧵",
    desc: "Continuation, carrier thread, mount/unmount, pinning và JEP 491, structured concurrency; bật trong Spring Boot và những cái bẫy khiến hệ thống chậm hơn.",
    tags: ["JVM", "Virtual threads", "Loom"],
  },
  {
    id: "uh-20", field: "under-hood", chapter: 20, part: C4,
    title: "Bên trong java.util.concurrent",
    file: "content/under-hood/20-java-util-concurrent.md", icon: "🧰",
    desc: "AQS, ConcurrentHashMap, ForkJoinPool, CompletableFuture từ bên trong — parallelStream() trong một request Spring dùng chung pool với ai.",
    tags: ["JVM", "java.util.concurrent", "ForkJoinPool"],
  },
  {
    id: "uh-21", field: "under-hood", chapter: 21, part: C5,
    title: "invokedynamic: lambda, nối chuỗi, record",
    file: "content/under-hood/21-invokedynamic.md", icon: "🎯",
    desc: "Bootstrap method, LambdaMetafactory, StringConcatFactory, ObjectMethods và hidden class — lambda có tạo class mới mỗi lần gọi không.",
    tags: ["JVM", "invokedynamic", "Lambda"],
  },
  {
    id: "uh-22", field: "under-hood", chapter: 22, part: C5,
    title: "Generics, record, sealed, pattern matching dưới bytecode",
    file: "content/under-hood/22-generics-record-pattern.md", icon: "🧪",
    desc: "Type erasure, Signature attribute, bridge method, record và sealed trong class file, switch trên pattern qua SwitchBootstraps và MatchException — vì sao Jackson cần TypeReference.",
    tags: ["JVM", "Generics", "Pattern matching"],
  },
  {
    id: "uh-23", field: "under-hood", chapter: 23, part: C5,
    title: "Reflection, MethodHandle, Proxy — cách Spring \"làm phép\"",
    file: "content/under-hood/23-reflection-proxy.md", icon: "🎩",
    desc: "Reflection và MethodHandle, JDK dynamic proxy vs CGLIB, sinh bytecode lúc chạy, Spring AOT processing — vì sao self-invocation làm mất @Transactional.",
    tags: ["JVM", "Proxy", "Reflection"],
  },
  {
    id: "uh-24", field: "under-hood", chapter: 24, part: C5,
    title: "Exception & stack trace: chi phí thật",
    file: "content/under-hood/24-exception-stack-trace.md", icon: "💥",
    desc: "fillInStackTrace, StackWalker, OmitStackTraceInFastThrow, exception làm luồng điều khiển — vì sao log production đôi khi có NullPointerException không kèm stack trace.",
    tags: ["JVM", "Exception", "Hiệu năng"],
  },
  {
    id: "uh-25", field: "under-hood", chapter: 25, part: C6,
    title: "Bộ đồ nghề: jcmd, JFR, JMC, async-profiler, NMT",
    file: "content/under-hood/25-bo-do-nghe-chan-doan.md", icon: "🩺",
    desc: "jcmd và chi phí từng lệnh, JFR luôn bật, đọc profile CPU/cấp phát/khoá, flame graph, NMT cho bộ nhớ ngoài heap — lấy dữ liệu chẩn đoán từ một pod đang chạy mà không restart.",
    tags: ["JVM", "JFR", "Profiling"],
  },
  {
    id: "uh-26", field: "under-hood", chapter: 26, part: C6,
    title: "Capstone: điều tra sự cố Spring Boot production từ A đến Z",
    file: "content/under-hood/26-capstone-su-co-production.md", icon: "🚨",
    desc: "Ba kịch bản dựng lại được — CPU cao sau deploy, latency spike định kỳ, OOMKilled khi heap còn trống — đi từ triệu chứng tới nguyên nhân bằng kiến thức cả series; bắt đầu từ đâu khi on-call lúc 2 giờ sáng.",
    tags: ["JVM", "Sự cố production", "Chẩn đoán"],
  },
];
