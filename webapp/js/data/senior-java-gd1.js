// Lộ trình Senior Java — Giai đoạn 1: Java & Spring chuyên sâu (tháng 1–6).
//
// Nguồn: senior-java-roadmap/01-giai-doan-1-java-spring.md (tài liệu sj-01).
// Mỗi mục là MỘT BƯỚC trong "Cách thực hiện" của tuần tương ứng.
//
// GIỮ NGUYÊN id (sj-gd1-w<N> / sj-gd1-w<N>-<M>) — tiến độ localStorage lưu
// theo id này. Khối cuối `sj-gd1-done` là cổng nghiệm thu giai đoạn, nhận
// badge "✓" thay cho số tuần.

export const seniorJavaGd1 = [
  {
    id: "sj-gd1-w1",
    week: "Tuần 1–2",
    title: "Setup + Java 17–21",
    goal: "Dựng nền nếp học tập và cập nhật ngôn ngữ hiện đại.",
    doneWhen: "Repo đã có commit đầu tiên với ≥ 4 demo tính năng mới; PR refactor ở công ty được merge; kể được không cần nhìn tài liệu 5 items tâm đắc nhất của Effective Java chương 1–3.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "openjdk.org — JEP index", href: "https://openjdk.org/jeps/0" },
    ],
    items: [
      {
        id: "sj-gd1-w1-1",
        text: "Tạo repo `java-deep-dive` với 6 thư mục chủ đề",
        lesson: `**Việc cần làm.** Tạo repo \`java-deep-dive\` trên GitHub với cấu trúc \`/jvm-gc\`, \`/collections\`, \`/concurrency\`, \`/spring-internals\`, \`/jpa-sql\`, \`/testing\`.

Mỗi thư mục sẽ có \`README.md\` (ghi chú Feynman) cộng mã nguồn. Đây là nơi mọi output của giai đoạn 1 đổ về, nên dựng đúng khung ngay từ đầu.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w1-2",
        text: "Cài JDK 21 và tạo project Maven/Gradle trong repo",
        lesson: `**Việc cần làm.** Cài JDK 21 qua SDKMAN (\`sdk install java 21-tem\`), rồi tạo project Maven hoặc Gradle ngay trong repo vừa dựng.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w1-3",
        text: "Đọc Effective Java chương 1–3, tự viết lại ví dụ cho từng item",
        lesson: `**Việc cần làm.** Đọc Effective Java chương 1–3. Cách đọc đúng: với mỗi item, gõ lại ví dụ trong sách rồi tự viết thêm một ví dụ khác của riêng mình. Ghi vào README mỗi item 2–3 dòng "khi nào áp dụng ở dự án của tôi".

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w1-4",
        text: "Viết demo records/sealed classes/pattern matching/text blocks",
        lesson: `**Việc cần làm.** Với mỗi tính năng mới (records, sealed classes, pattern matching cho switch, text blocks), viết một file demo đặt cách viết cũ và cách viết mới cạnh nhau, kèm comment giải thích khác biệt. Ví dụ: refactor một DTO class 50 dòng thành record 3 dòng.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w1-5",
        text: "Refactor 1 class công ty sang Builder, tạo PR tự review",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: chọn một class đang dùng constructor nhiều tham số, refactor sang Builder (Item 2 của Effective Java); thêm \`Objects.requireNonNull\` cho tham số bắt buộc; tự tạo PR và tự review lý do từng thay đổi.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w2",
    week: "Tuần 3–4",
    title: "JVM memory & GC",
    goal: "Hiểu heap/metaspace/stack, cơ chế GC, và tự tay chẩn đoán memory leak.",
    doneWhen: "Tự tìm ra leak trong dump mà không cần xem lại hướng dẫn; trả lời được \"heap tăng liên tục sau full GC nghĩa là gì\"; README có đủ ảnh + kết luận thí nghiệm GC log.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "gceasy.io — phân tích GC log", href: "https://gceasy.io/" },
    ],
    items: [
      {
        id: "sj-gd1-w2-1",
        text: "Học lý thuyết GC: vẽ sơ đồ heap Eden → Survivor → Old gen",
        lesson: `**Việc cần làm.** Học lý thuyết trong 2 buổi: xem talk "Understanding Java Garbage Collection" (Devoxx) và đọc docs Oracle về G1. Vẽ tay sơ đồ heap: Eden → Survivor → Old gen, chụp ảnh bỏ vào README.

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w2-2",
        text: "Viết lab gây leak: cache tĩnh add 1MB mỗi giây, chạy -Xmx256m",
        lesson: `**Việc cần làm.** Viết class có \`static List<byte[]> CACHE = new ArrayList<>();\`, mỗi giây add một mảng \`new byte[1_048_576]\` (1MB) vào cache. Chạy ứng dụng với cờ \`-Xmx256m\` để buộc heap đầy nhanh.

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w2-3",
        text: "Chẩn đoán leak bằng VisualVM: Heap Dump → Retained Size → GC Root",
        lesson: `**Việc cần làm.** Chẩn đoán bằng VisualVM: attach vào process → tab Monitor xem heap tăng dần không giảm sau GC (dấu hiệu leak) → bấm Heap Dump khi heap gần đầy → trong dump, sort theo Retained Size → thấy \`byte[]\` chiếm nhiều nhất → click chuột phải "Show Nearest GC Root" → truy ra static field gây leak. Ghi lại từng bước kèm ảnh chụp màn hình vào README.

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w2-4",
        text: "Lặp lại chẩn đoán bằng dòng lệnh: jcmd, jmap, Eclipse MAT",
        lesson: `**Việc cần làm.** Làm lại bằng dòng lệnh — kỹ năng cần cho production khi không có GUI: \`jcmd <pid> GC.heap_info\`, \`jmap -dump:live,format=b,file=heap.hprof <pid>\`, rồi mở file dump bằng Eclipse MAT và chạy "Leak Suspects Report".

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w2-5",
        text: "Lab GC log app công ty: bắn tải, đọc pause, so sánh -Xmx",
        lesson: `**Việc cần làm.** Chạy app Spring Boot công ty (bản dev) với \`-Xlog:gc*:file=gc.log:time,uptime\`. Bắn tải bằng \`hey -z 60s http://localhost:8080/...\`. Mở gc.log, tìm các dòng Pause, ghi lại pause dài nhất. Upload log lên gceasy.io để xem biểu đồ. Đổi \`-Xmx\` (256m → 1g) rồi chạy lại, so sánh tần suất GC và pause time, ghi kết luận.

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w2-6",
        text: "Viết ghi chú Feynman \"GC hoạt động thế nào\"",
        lesson: `**Việc cần làm.** Viết ghi chú Feynman "GC hoạt động thế nào" (1 trang): tưởng tượng đang giảng cho một junior, không dùng từ nào mà chính mình không giải thích được.

**Nguồn.** [Giai đoạn 1 — Tuần 3–4](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w3",
    week: "Tuần 5–6",
    title: "Collections internals, equals/hashCode",
    goal: "Hiểu HashMap tận gốc và hợp đồng equals/hashCode.",
    doneWhen: "MyHashMap pass test; giải thích được miệng \"chuyện gì xảy ra khi gọi map.put(key, value)\" từ hash đến resize; benchmark có số liệu thật.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w3-1",
        text: "Lab equals mà không override hashCode: chứng minh bug HashSet",
        lesson: `**Việc cần làm.** Đọc các item Effective Java về equals/hashCode/compareTo. Lab nhanh: viết một class chỉ override \`equals\` mà không override \`hashCode\`, bỏ vào \`HashSet\`, rồi chứng minh bug bằng test (\`set.contains()\` trả về \`false\` với một object "bằng nhau"). Đây là demo thuyết phục nhất về hợp đồng equals-hashCode.

**Nguồn.** [Giai đoạn 1 — Tuần 5–6](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w3-2",
        text: "Đọc source HashMap: hash(), putVal(), TREEIFY_THRESHOLD",
        lesson: `**Việc cần làm.** Đọc source \`java.util.HashMap\` trong IntelliJ (Ctrl+Click): đọc hàm \`hash()\`, \`putVal()\`, hằng số \`TREEIFY_THRESHOLD = 8\` và \`DEFAULT_LOAD_FACTOR = 0.75\`. Không cần hiểu hết, chỉ cần thấy được cấu trúc bucket + linked list + cây.

**Nguồn.** [Giai đoạn 1 — Tuần 5–6](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w3-3",
        text: "Tự cài MyHashMap<K,V> ~100 dòng, test so với HashMap thật",
        lesson: `**Việc cần làm.** Lab chính: tự cài \`MyHashMap<K,V>\` (~100 dòng): mảng bucket, mỗi bucket là một linked list node; \`put\` = tính \`hash % length\` rồi duyệt list; resize khi \`size > 0.75 × capacity\`. Viết test so kết quả với \`HashMap\` thật. Push vào \`/collections\`.

**Nguồn.** [Giai đoạn 1 — Tuần 5–6](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w3-4",
        text: "Benchmark JMH: ArrayList vs LinkedList khi add(size/2, x)",
        lesson: `**Việc cần làm.** Setup JMH (thêm dependency \`jmh-core\` + \`jmh-generator-annprocess\`, hoặc dùng archetype chính thức). Viết benchmark \`@Benchmark\` so sánh \`ArrayList\` vs \`LinkedList\`: \`add(size/2, x)\` với size 100k. Chạy, đọc kết quả, ghi vào README kèm giải thích tại sao \`LinkedList\` thua cả bài "sở trường" của nó (chi phí duyệt đến vị trí giữa).

**Nguồn.** [Giai đoạn 1 — Tuần 5–6](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w3-5",
        text: "So sánh ConcurrentHashMap vs HashMap vs synchronizedMap",
        lesson: `**Việc cần làm.** Đọc thêm sự khác nhau giữa \`ConcurrentHashMap\`, \`HashMap\` và \`Collections.synchronizedMap\`: viết một bảng so sánh 5 dòng trong README (lock granularity, iterator, null key).

**Nguồn.** [Giai đoạn 1 — Tuần 5–6](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w4",
    week: "Tuần 7–8",
    title: "Generics, lambda, stream",
    goal: "Dùng generics/stream đúng, biết giới hạn của chúng.",
    doneWhen: "PR được merge; giải thích được PECS không cần nhìn note; nêu được 2 trường hợp stream làm code TỆ hơn.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "🌊 Sang lĩnh vực Modern Java in Action — lộ trình đọc 12 tuần", href: "#/roadmap/modern-java" },
    ],
    items: [
      {
        id: "sj-gd1-w4-1",
        text: "Lab PECS: copy(List<? super T> dst, List<? extends T> src)",
        lesson: `**Việc cần làm.** Đọc phần generics của Effective Java. Lab PECS: viết method \`copy(List<? super T> dst, List<? extends T> src)\` rồi thử compile các trường hợp sai để thấy compiler chặn gì. Ghi lại quy tắc PECS bằng ví dụ của riêng mình.

**Nguồn.** [Giai đoạn 1 — Tuần 7–8](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w4-2",
        text: "Lab type erasure: getClass() của List<String> và List<Integer>",
        lesson: `**Việc cần làm.** Viết \`List<String>\` và \`List<Integer>\`, in \`getClass()\` của cả hai để thấy chúng cùng một class. Thử viết \`new T[]\` để hiểu tại sao không được phép.

**Nguồn.** [Giai đoạn 1 — Tuần 7–8](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w4-3",
        text: "Đọc EJ về lambda/stream, đặc biệt item side-effect-free",
        lesson: `**Việc cần làm.** Đọc phần lambda/stream của Effective Java, đặc biệt item "prefer side-effect-free functions in streams".

**Nguồn.** [Giai đoạn 1 — Tuần 7–8](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w4-4",
        text: "Grep raw type & stream lồng ≥3 tầng tại công ty, refactor 1 chỗ",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: \`grep\` toàn dự án để tìm raw type (\`List<\`) và stream lồng từ 3 tầng trở lên. Chọn một chỗ, refactor: tách stream phức tạp thành method có tên rõ nghĩa, hoặc quay về for-loop nếu dễ đọc hơn. Trong mô tả PR, viết rõ lý do — luyện kỹ năng thuyết phục bằng văn bản của Senior.

**Nguồn.** [Giai đoạn 1 — Tuần 7–8](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w5",
    week: "Tuần 9–10",
    title: "Thread safety, visibility, atomicity",
    goal: "Tự tay tái hiện race condition và hiểu Java Memory Model ở mức thực dụng.",
    doneWhen: "Cả 2 lab tái hiện được lỗi và fix được; phát biểu được happens-before bằng lời của mình kèm 1 ví dụ.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w5-1",
        text: "Đọc Java Concurrency in Practice chương 1–4",
        lesson: `**Việc cần làm.** Đọc Java Concurrency in Practice (Goetz) chương 1–4, mỗi tối một mục nhỏ — sách này phải đọc chậm.

**Nguồn.** [Giai đoạn 1 — Tuần 9–10](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w5-2",
        text: "Lab race condition: 2 thread count++ 1 triệu lần, chạy 5 lần",
        lesson: `**Việc cần làm.** Lab race condition: class \`Counter\` có trường \`int count\`; 2 thread, mỗi thread gọi \`count++\` một triệu lần; join rồi in kết quả — gần như luôn nhỏ hơn 2 triệu. Chạy 5 lần, ghi 5 kết quả khác nhau vào README (tính không xác định chính là bài học).

**Nguồn.** [Giai đoạn 1 — Tuần 9–10](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w5-3",
        text: "Fix 3 cách: synchronized, AtomicInteger, LongAdder + benchmark",
        lesson: `**Việc cần làm.** Fix bằng 3 cách, mỗi cách một class: \`synchronized\`, \`AtomicInteger\`, \`LongAdder\`. Viết benchmark JMH cho cả 3 cách với 8 thread — sẽ thấy \`LongAdder\` thắng khi contention cao. Ghi bảng số liệu.

**Nguồn.** [Giai đoạn 1 — Tuần 9–10](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w5-4",
        text: "Lab visibility: volatile flag dừng vòng lặp while(!stop)",
        lesson: `**Việc cần làm.** Lab visibility: thread A chạy \`while(!stop) {}\`, thread B set \`stop = true\` sau 1 giây. Không có \`volatile\` thì có thể treo vô hạn (chạy với JIT, bỏ print trong loop). Thêm \`volatile\` thì dừng ngay. Đây là demo visibility kinh điển — tự chạy được nó ăn đứt đọc 10 bài blog.

**Nguồn.** [Giai đoạn 1 — Tuần 9–10](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w5-5",
        text: "Ghi chú Feynman: vì sao volatile đủ cho flag nhưng không đủ cho counter",
        lesson: `**Việc cần làm.** Viết ghi chú Feynman: "Tại sao volatile đủ cho cờ stop nhưng không đủ cho counter" — chốt lại rằng visibility khác atomicity.

**Nguồn.** [Giai đoạn 1 — Tuần 9–10](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w6",
    week: "Tuần 11–12",
    title: "Thread pool & ExecutorService",
    goal: "Cấu hình thread pool có chủ đích, không dùng mù default.",
    doneWhen: "Vẽ được từ trí nhớ sơ đồ quyết định của ThreadPoolExecutor; đề xuất cấu hình ở công ty đã gửi (được duyệt hay không cũng tính, vì mục tiêu là tư duy + trình bày).",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w6-1",
        text: "Học JCiP ch.6–8: thứ tự quyết định của ThreadPoolExecutor",
        lesson: `**Việc cần làm.** Đọc Java Concurrency in Practice chương 6–8. Học thuộc thứ tự quyết định của \`ThreadPoolExecutor\` khi nhận task mới: core chưa đầy → tạo thread; core đầy → vào queue; queue đầy → tạo thread đến max; max đầy → rejection. (90% người dùng sai vì tưởng max được dùng trước queue.)

**Nguồn.** [Giai đoạn 1 — Tuần 11–12](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w6-2",
        text: "Lab ThreadPoolExecutor(2,4,60s,queue10): quan sát rejection & CallerRunsPolicy",
        lesson: `**Việc cần làm.** Tạo \`ThreadPoolExecutor(2, 4, 60s, ArrayBlockingQueue(10), AbortPolicy)\`. Submit 50 task, mỗi task sleep 1s. Quan sát: 2 task chạy, 10 xếp hàng, tạo thêm đến 4, số còn lại văng \`RejectedExecutionException\`. Đổi sang \`CallerRunsPolicy\` rồi chạy lại — thấy task chạy trên chính thread submit (cơ chế backpressure tự nhiên). Ghi lại quan sát.

**Nguồn.** [Giai đoạn 1 — Tuần 11–12](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w6-3",
        text: "Tính pool size theo công thức IO-bound: core × (1 + wait/compute)",
        lesson: `**Việc cần làm.** Học công thức sizing: CPU-bound ≈ số core; IO-bound ≈ core × (1 + wait/compute). Làm một bài tính cụ thể với app của bạn: nếu mỗi request chờ DB 80ms, xử lý 20ms, máy 4 core thì pool ≈ 4 × (1 + 80/20) = 20.

**Nguồn.** [Giai đoạn 1 — Tuần 11–12](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w6-4",
        text: "Kiểm tra pool @Async/@Scheduled công ty, đề xuất ThreadPoolTaskExecutor",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: kiểm tra \`@Async\` và \`@Scheduled\` đang chạy trên pool nào (bật \`logging.level.org.springframework.scheduling=DEBUG\` hoặc đặt breakpoint). Nếu đang dùng \`SimpleAsyncTaskExecutor\` (tạo thread mới mỗi lần — nguy hiểm) hoặc pool 1 thread mặc định của scheduler, viết đề xuất cấu hình \`ThreadPoolTaskExecutor\` tường minh kèm giải thích con số, rồi gửi team lead.

**Nguồn.** [Giai đoạn 1 — Tuần 11–12](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w7",
    week: "Tuần 13–14",
    title: "CompletableFuture & virtual threads",
    goal: "Xử lý song song hiện đại và biết khi nào virtual threads đáng dùng.",
    doneWhen: "Giải thích được thenApply vs thenCompose bằng ví dụ; nói được 2 trường hợp virtual threads KHÔNG giúp gì (CPU-bound, pinning).",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "JEP 444 — Virtual Threads", href: "https://openjdk.org/jeps/444" },
    ],
    items: [
      {
        id: "sj-gd1-w7-1",
        text: "Đo 3 cách gọi song song: tuần tự, CompletableFuture, virtual threads",
        lesson: `**Việc cần làm.** Viết 3 method giả lập gọi API (mỗi cái \`Thread.sleep(1000)\` rồi trả về một chuỗi). Cài 3 phiên bản gọi cả 3 method: (a) tuần tự ~3s; (b) \`CompletableFuture.supplyAsync\` × 3 rồi \`allOf\` ~1s; (c) virtual threads qua \`Executors.newVirtualThreadPerTaskExecutor()\` ~1s. Đo bằng \`System.nanoTime\`, ghi thành bảng.

**Nguồn.** [Giai đoạn 1 — Tuần 13–14](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w7-2",
        text: "Học thenApply vs thenCompose, exceptionally, orTimeout",
        lesson: `**Việc cần làm.** Học kỹ \`CompletableFuture\`: \`thenApply\` vs \`thenCompose\` (tương tự map vs flatMap), \`exceptionally\`, \`orTimeout\`. Viết demo một chuỗi: gọi API A → lấy kết quả gọi B → nếu lỗi thì trả về giá trị mặc định → timeout sau 2s.

**Nguồn.** [Giai đoạn 1 — Tuần 13–14](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w7-3",
        text: "Lab pinning: virtual thread trong synchronized với -Djdk.tracePinnedThreads",
        lesson: `**Việc cần làm.** Học virtual threads: đọc JEP 444. Lab pinning: cho virtual thread chạy một block \`synchronized\` có sleep bên trong, bật \`-Djdk.tracePinnedThreads=full\` để thấy cảnh báo pinned. Hiểu rằng \`synchronized\` giữ carrier thread (trước Java 24), nên code cũ nhiều \`synchronized\` chưa hưởng lợi ngay từ virtual threads.

**Nguồn.** [Giai đoạn 1 — Tuần 13–14](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w7-4",
        text: "So sánh 100.000 virtual threads vs platform threads (OOM)",
        lesson: `**Việc cần làm.** Thí nghiệm ấn tượng: tạo 100.000 virtual thread mỗi cái sleep 1s — chạy ngon trong khoảng 1s; thử lại với 100.000 platform thread — OOM hoặc treo máy. Ghi lại số liệu — đây là câu chuyện kể hay khi phỏng vấn.

**Nguồn.** [Giai đoạn 1 — Tuần 13–14](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w8",
    week: "Tuần 15–16",
    title: "Spring IoC & AOP — vén màn magic",
    goal: "Debug tận mắt vòng đời bean và hiểu proxy.",
    doneWhen: "Kể lại được hành trình 1 bean từ class thành object trong container theo trí nhớ; giải thích được cho đồng nghiệp tại sao self-invocation làm mất @Transactional kèm demo.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w8-1",
        text: "Download Sources cho project Spring Boot công ty trong IntelliJ",
        lesson: `**Việc cần làm.** Chuẩn bị: trong IntelliJ, mở project Spring Boot của công ty (bản dev), vào một class của Spring rồi bấm "Download Sources" để đọc được source thật.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w8-2",
        text: "Debug bean lifecycle tại doCreateBean: 3 pha create/populate/initialize",
        lesson: `**Việc cần làm.** Lab debug bean lifecycle (lab quan trọng nhất giai đoạn): đặt breakpoint tại \`AbstractAutowireCapableBeanFactory#doCreateBean\`. Start app ở chế độ debug với breakpoint có điều kiện \`beanName.equals("tênBeanCủaBạn")\`. Step qua 3 pha: \`createBeanInstance\` (gọi constructor) → \`populateBean\` (inject \`@Autowired\`) → \`initializeBean\` (BeanPostProcessor before → \`@PostConstruct\` → after). Vẽ sơ đồ 3 pha này, bỏ vào README.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w8-3",
        text: "Chứng minh proxy: getClass() của bean @Transactional ra $$SpringCGLIB$$",
        lesson: `**Việc cần làm.** Lab chứng minh proxy: inject một bean có \`@Transactional\`, đặt breakpoint rồi xem \`getClass()\` — sẽ thấy tên kiểu dạng \`...$$SpringCGLIB$$...\` chứ không phải class của bạn. Đó là bằng chứng AOP = proxy bọc ngoài.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w8-4",
        text: "Lab self-invocation: this.b() né proxy, mất log @Transactional",
        lesson: `**Việc cần làm.** Lab self-invocation: trong một service, method \`a()\` (không annotation) gọi \`this.b()\` (có \`@Transactional\`). Bật log \`logging.level.org.springframework.transaction.interceptor=TRACE\` — gọi qua \`a()\` sẽ không thấy log mở transaction; gọi \`b()\` trực tiếp từ ngoài thì có. Kết luận: \`this.\` đi thẳng vào object thật, né mất proxy.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w8-5",
        text: "Viết @LogTime + @Aspect @Around đo thời gian method",
        lesson: `**Việc cần làm.** Lab viết aspect: tự tạo annotation \`@LogTime\` cùng một \`@Aspect\` với \`@Around\` đo thời gian chạy method. Gắn vào 2 method trong app, xem log. Hiểu pointcut expression cơ bản.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w8-6",
        text: "Học lý thuyết bù: JDK dynamic proxy vs CGLIB, vì sao final không proxy được",
        lesson: `**Việc cần làm.** Học lý thuyết bù: JDK dynamic proxy (cần interface) so với CGLIB (subclass), và tại sao method \`final\` không proxy được.

**Nguồn.** [Giai đoạn 1 — Tuần 15–16](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w9",
    week: "Tuần 17–18",
    title: "@Transactional tận gốc",
    goal: "Viết bộ test tái hiện 5 bẫy transaction — tài sản quý nhất của repo.",
    doneWhen: "5 test xanh và tự giải thích được từng test; đồng nghiệp đọc hiểu được README của bạn.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w9-1",
        text: "Setup Testcontainers PostgreSQL/MySQL cho project test",
        lesson: `**Việc cần làm.** Setup project test với Testcontainers PostgreSQL/MySQL (đúng loại DB công ty đang dùng): \`@Testcontainers\`, \`@Container static PostgreSQLContainer<?>\`, \`@DynamicPropertySource\` trỏ datasource vào container.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w9-2",
        text: "Kiểm tra transaction đang mở bằng isActualTransactionActive() / TRACE log",
        lesson: `**Việc cần làm.** Học cách kiểm tra "có transaction hay không" trong test: log \`TransactionSynchronizationManager.isActualTransactionActive()\` bên trong method, hoặc bật TRACE log transaction interceptor như tuần trước.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w9-3",
        text: "Viết 5 test tái hiện 5 bẫy @Transactional",
        lesson: `**Việc cần làm.** Viết 5 test, mỗi test tái hiện một bẫy:
- **Self-invocation**: như lab tuần trước nhưng verify bằng dữ liệu (exception giữa chừng mà dữ liệu vẫn commit).
- **Checked exception không rollback**: method \`@Transactional\` insert rồi \`throw new Exception()\` — verify dữ liệu VẪN CÒN trong DB. Fix bằng \`rollbackFor = Exception.class\` — verify đã rollback.
- **Method không public**: \`@Transactional\` trên method package-private — verify không có transaction.
- **Bắt exception rồi nuốt trong transaction lồng nhau**: outer REQUIRED gọi inner REQUIRED, inner ném RuntimeException, outer catch — verify outer commit văng \`UnexpectedRollbackException\` (transaction đã bị đánh dấu rollback-only).
- **REQUIRES_NEW**: inner REQUIRES_NEW commit xong, outer rollback — verify dữ liệu của inner vẫn còn, của outer mất.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w9-4",
        text: "Comment giải thích từng test, push vào /spring-internals/transactional-traps",
        lesson: `**Việc cần làm.** Mỗi test kèm comment giải thích "tại sao" 3–5 dòng. Push toàn bộ vào \`/spring-internals/transactional-traps\`.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w9-5",
        text: "Đọc hiểu propagation còn lại: NESTED, MANDATORY, NOT_SUPPORTED",
        lesson: `**Việc cần làm.** Học các propagation còn lại (\`NESTED\`, \`MANDATORY\`, \`NOT_SUPPORTED\`) ở mức đọc hiểu, không cần lab hết.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w9-6",
        text: "Viết ghi chú Feynman '5 trường hợp @Transactional không hoạt động như bạn nghĩ'",
        lesson: `**Việc cần làm.** Viết ghi chú Feynman "5 trường hợp @Transactional không hoạt động như bạn nghĩ" — bài này có thể trở thành blog post đầu tiên của bạn.

**Nguồn.** [Giai đoạn 1 — Tuần 17–18](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w10",
    week: "Tuần 19–20",
    title: "JPA hiệu năng — N+1 (case optimize #1)",
    goal: "Tìm và diệt N+1 thật ở công ty, có số liệu.",
    doneWhen: "Tài liệu case #1 hoàn chỉnh có số liệu thật; giải thích được vì sao chọn phương án này thay vì 2 phương án kia.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "vladmihalcea.com — blog JPA/Hibernate", href: "https://vladmihalcea.com/" },
    ],
    items: [
      {
        id: "sj-gd1-w10-1",
        text: "Bật đếm SQL: hibernate.generate_statistics hoặc p6spy",
        lesson: `**Việc cần làm.** Bật công cụ đếm query trên môi trường dev công ty: thêm \`spring.jpa.properties.hibernate.generate_statistics=true\` cùng log SQL, hoặc gọn hơn là thêm p6spy/datasource-proxy để log kèm đếm số câu SQL mỗi request.

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w10-2",
        text: "Săn N+1 ở endpoint trả danh sách có quan hệ (order→items, user→roles)",
        lesson: `**Việc cần làm.** Săn N+1: gọi các endpoint trả về danh sách có quan hệ (order → items, user → roles). Dấu hiệu: một câu SELECT cha cộng N câu SELECT con giống hệt nhau chỉ khác id.

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w10-3",
        text: "Đo 'trước': số query/request và latency trung bình 20 lần",
        lesson: `**Việc cần làm.** Đo "trước": số query/request cộng latency, dùng \`curl -w "%{time_total}"\` chạy 20 lần lấy trung bình, hoặc \`hey -n 200\`.

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w10-4",
        text: "Fix theo thứ tự: join fetch → @EntityGraph → batch_fetch_size",
        lesson: `**Việc cần làm.** Fix theo thứ tự ưu tiên: (a) \`join fetch\` trong JPQL nếu luôn cần dữ liệu con; (b) \`@EntityGraph\` nếu muốn linh hoạt theo use case; (c) \`hibernate.default_batch_fetch_size=20\` nếu sửa query khó (giảm N+1 thành N/20+1). Đọc bài của Vlad Mihalcea về từng cách trước khi chọn.

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w10-5",
        text: "Cẩn thận MultipleBagFetchException và phân trang in-memory",
        lesson: `**Việc cần làm.** Cẩn thận bẫy mới: join fetch hai collection cùng lúc gây \`MultipleBagFetchException\`; join fetch kết hợp phân trang khiến Hibernate phân trang trong memory (có warning trong log — phải kiểm tra).

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w10-6",
        text: "Đo 'sau', viết tài liệu case #1 kèm số liệu trước/sau",
        lesson: `**Việc cần làm.** Đo "sau", rồi viết tài liệu case 1 (một trang): bối cảnh → cách phát hiện → phương án cân nhắc → số liệu trước/sau (ví dụ: 41 query → 2 query, p95 780ms → 95ms). Gửi team lead, và lưu bản ẩn danh vào repo.

**Nguồn.** [Giai đoạn 1 — Tuần 19–20](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w11",
    week: "Tuần 21–22",
    title: "SQL — index & execution plan (case optimize #2)",
    goal: "Đọc execution plan thành thạo và fix 1 query chậm thật.",
    doneWhen: "Đọc plan không cần Google từng từ; case #2 có số liệu; trả lời được \"composite index (a,b,c) — query WHERE b=? có dùng được không, tại sao\".",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "use-the-index-luke.com", href: "https://use-the-index-luke.com/" },
    ],
    items: [
      {
        id: "sj-gd1-w11-1",
        text: "Học B-tree index, leftmost prefix, covering index",
        lesson: `**Việc cần làm.** Học nền trong 2 buổi: B-tree index hoạt động thế nào; quy tắc leftmost prefix của composite index; covering index. Nguồn: use-the-index-luke.com — miễn phí và hay nhất về chủ đề này.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-2",
        text: "Luyện đọc EXPLAIN ANALYZE (PostgreSQL) / EXPLAIN (MySQL)",
        lesson: `**Việc cần làm.** Luyện đọc plan trên DB công ty đang dùng: PostgreSQL dùng \`EXPLAIN (ANALYZE, BUFFERS) <query>\` — tìm \`Seq Scan\` trên bảng lớn, so \`rows\` ước tính với thật; MySQL dùng \`EXPLAIN\` — nhìn cột \`type\` (\`ALL\` = full scan là xấu), \`rows\`, \`Extra\` (\`Using filesort\`, \`Using temporary\` là cờ đỏ).

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-3",
        text: "Lab sandbox 1 triệu dòng: tạo index rồi tự phá bằng function/wildcard",
        lesson: `**Việc cần làm.** Lab sandbox trước khi làm thật: tạo bảng một triệu dòng bằng \`generate_series\` (PostgreSQL) hoặc procedure (MySQL). Chạy query \`WHERE\` trên cột chưa index → xem plan → tạo index → xem plan đổi. Sau đó tự phá: bọc cột trong function \`WHERE UPPER(email) = ...\` để thấy index không còn được dùng. Thử tiếp leading wildcard \`LIKE '%abc'\`. Ghi từng thí nghiệm vào README.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-4",
        text: "Săn query chậm thật: pg_stat_statements hoặc slow query log",
        lesson: `**Việc cần làm.** Săn query chậm thật ở công ty: PostgreSQL — bật hoặc xin quyền xem \`pg_stat_statements\`, sort theo \`total_exec_time\`; MySQL — bật slow query log với \`long_query_time=1\`. Không có quyền thì xin DBA/lead export top 10 query chậm.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-5",
        text: "Chọn 1 query, đo trước → đọc plan → fix index → đo sau",
        lesson: `**Việc cần làm.** Chọn một query, đo trước → đọc plan → fix (thêm hoặc sửa composite index đúng thứ tự cột theo selectivity, hoặc viết lại query) → đo sau. Lưu ý của Senior: index mới làm chậm write và tốn dung lượng — ghi rõ trade-off này trong đề xuất.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-6",
        text: "Lab isolation levels: 2 terminal tái hiện non-repeatable read",
        lesson: `**Việc cần làm.** Học isolation levels bằng lab 2 terminal: mở 2 session cùng lúc, tự tạo non-repeatable read ở READ COMMITTED, rồi đổi sang REPEATABLE READ xem khác gì. Trực quan hơn mọi bài viết.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w11-7",
        text: "Viết tài liệu case #2 theo đúng format case #1",
        lesson: `**Việc cần làm.** Viết tài liệu case #2 theo đúng format của case #1.

**Nguồn.** [Giai đoạn 1 — Tuần 21–22](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w12",
    week: "Tuần 23–24",
    title: "Testing đáng tin",
    goal: "Nâng chất lượng test module mình phụ trách lên chuẩn có thể tin để refactor.",
    doneWhen: "Các luồng chính của module có test; bạn dám refactor module mà chỉ cần chạy test để yên tâm — đó là thước đo thật.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w12-1",
        text: "Học nguyên tắc test hành vi qua public API, đặt tên should_X_when_Y",
        lesson: `**Việc cần làm.** Học nguyên tắc trong 1 buổi: test hành vi qua public API, không test private method; mỗi test chỉ có một lý do fail; đặt tên theo \`should_X_when_Y\`.

**Nguồn.** [Giai đoạn 1 — Tuần 23–24](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w12-2",
        text: "Audit module công ty: đánh dấu luồng nghiệp vụ nào chưa có test",
        lesson: `**Việc cần làm.** Audit module của bạn ở công ty: liệt kê các luồng nghiệp vụ chính rồi đánh dấu luồng nào chưa có test. Coverage theo % không phải mục tiêu — mục tiêu là "luồng quan trọng nào cũng có test".

**Nguồn.** [Giai đoạn 1 — Tuần 23–24](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w12-3",
        text: "Viết integration test Testcontainers cho repository + API end-to-end",
        lesson: `**Việc cần làm.** Viết integration test với Testcontainers cho tầng repository cộng 1–2 luồng API end-to-end (\`@SpringBootTest\` + \`MockMvc\`/\`WebTestClient\` + DB container). Bật reuse container cho nhanh: thêm \`testcontainers.reuse.enable=true\` vào file \`~/.testcontainers.properties\` và \`.withReuse(true)\` trong code.

**Nguồn.** [Giai đoạn 1 — Tuần 23–24](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w12-4",
        text: "Rà soát mock: xóa mock chỉ để test service gọi repository",
        lesson: `**Việc cần làm.** Rà mock: chỗ nào mock repository chỉ để test rằng service có gọi repository — đó là test implementation, xóa hoặc thay bằng integration test.

**Nguồn.** [Giai đoạn 1 — Tuần 23–24](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w12-5",
        text: "Đề xuất team đưa Testcontainers vào dự án kèm demo thời gian chạy",
        lesson: `**Việc cần làm.** Đề xuất với team: đưa Testcontainers vào dự án (nếu chưa có) kèm demo thời gian chạy thực tế.

**Nguồn.** [Giai đoạn 1 — Tuần 23–24](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-w13",
    week: "Tuần 25–26",
    title: "Ôn tập & mock interview",
    goal: "Củng cố toàn bộ kiến thức giai đoạn 1 qua tự kiểm tra và mock interview trước khi vào nghiệm thu.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd1-w13-1",
        text: "Tuần 25: đọc lại ghi chú Feynman, tự trả lời 10 câu hỏi thành tiếng",
        lesson: `**Việc cần làm.** Tuần 25: đọc lại toàn bộ ghi chú Feynman. Với 10 câu hỏi tự kiểm tra bên dưới: tự trả lời thành tiếng, ghi âm, nghe lại — chỗ nào ấp úng là chỗ chưa hiểu, quay lại lab tương ứng.

**Nguồn.** [Giai đoạn 1 — Tuần 25–26](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-2",
        text: "Tuần 26: mock interview 60 phút, chấm checklist cuối giai đoạn",
        lesson: `**Việc cần làm.** Tuần 26: hẹn một senior/mentor mock interview 60 phút (không có thì dùng bản ghi âm tự chấm theo checklist). Chấm checklist cuối giai đoạn, và làm review quý theo file tài liệu 00 (tổng quan roadmap).

**Nguồn.** [Giai đoạn 1 — Tuần 25–26](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-3",
        text: "G1 hoạt động thế nào, khi nào chọn ZGC?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại phần lý thuyết GC và ghi chú Feynman "GC hoạt động thế nào" ở tuần 3–4 (JVM memory & GC) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-4",
        text: "Các bước chẩn đoán memory leak trên production?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại lab chẩn đoán bằng VisualVM và bằng dòng lệnh (jcmd/jmap/Eclipse MAT) ở tuần 3–4 (JVM memory & GC) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-5",
        text: "HashMap xử lý collision ra sao, tại sao Java 8 treeify bucket?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại lab đọc source HashMap và tự cài MyHashMap ở tuần 5–6 (Collections internals, equals/hashCode) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-6",
        text: "Happens-before là gì? volatile giải quyết gì và không giải quyết gì?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại lab race condition và lab visibility ở tuần 9–10 (Thread safety, visibility, atomicity) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-7",
        text: "Cách tính size thread pool IO-bound vs CPU-bound (kèm ví dụ số)?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại bài tính công thức sizing ở tuần 11–12 (Thread pool & ExecutorService) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-8",
        text: "Virtual threads giải quyết gì, pinning là gì?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại lab pinning và lab so sánh virtual threads với platform threads ở tuần 13–14 (CompletableFuture & virtual threads) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-9",
        text: "@Transactional mở transaction ở đâu? 5 trường hợp fail âm thầm?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại 5 test transactional-traps ở tuần 17–18 (@Transactional tận gốc) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-10",
        text: "N+1: 3 cách fix và trade-off từng cách?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại phần fix N+1 (join fetch, @EntityGraph, batch_fetch_size) ở tuần 19–20 (JPA hiệu năng — N+1) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-11",
        text: "Composite index (a,b,c): query nào dùng được?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại phần leftmost prefix và lab sandbox index ở tuần 21–22 (SQL — index & execution plan) để ôn lại.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w13-12",
        text: "Kể 2 case optimize thật: chẩn đoán, giải pháp, số liệu.",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm rồi nghe lại — chỗ nào ấp úng nghĩa là chưa hiểu, quay lại tài liệu case #1 (N+1, tuần 19–20) và case #2 (SQL index, tuần 21–22) để ôn lại số liệu trước/sau của chính mình.

**Nguồn.** [Giai đoạn 1 — Bộ câu hỏi tự kiểm tra](#/docs/sj-01)`,
      },
    ],
  },

  {
    id: "sj-gd1-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 1 — 6 tiêu chí bắt buộc",
    goal: "Cổng ra của giai đoạn 1. Đạt ≥ 5/6 thì sang giai đoạn 2; trượt riêng concurrency hoặc JPA thì kéo dài chủ đề đó 3–4 tuần song song với giai đoạn 2.",
    items: [
      {
        id: "sj-gd1-done-1",
        text: "Repo ≥ 10 chủ đề có code + ghi chú Feynman",
        lesson: `**Cách tự chấm.** Đếm số thư mục chủ đề trong \`java-deep-dive\` có đủ cả mã nguồn lẫn \`README.md\` viết theo lối Feynman. Thư mục chỉ có mã, không có ghi chú, không tính.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-done-2",
        text: "Bộ 5 test transactional-traps chạy xanh",
        lesson: `**Cách tự chấm.** Chạy bộ 5 test transactional-traps viết ở tuần 17–18 (self-invocation, checked exception không rollback, method không public, nuốt exception trong transaction lồng nhau, REQUIRES_NEW) — cả 5 phải xanh.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-done-3",
        text: "2 case optimize có tài liệu + số liệu trước/sau",
        lesson: `**Cách tự chấm.** Kiểm tra cả hai tài liệu case optimize (N+1 ở tuần 19–20 và SQL index ở tuần 21–22) đã đủ bốn phần: bối cảnh, cách phát hiện, phương án cân nhắc, và số liệu trước/sau thật.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-done-4",
        text: "Đã debug vào source Spring ≥ 3 lần",
        lesson: `**Cách tự chấm.** Đếm số lần bạn thực sự đặt breakpoint và step vào source Spring thật (không phải đọc blog) — ví dụ lab bean lifecycle và lab self-invocation ở tuần 15–16. Cần ít nhất 3 lần.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-done-5",
        text: "Module phụ trách có integration test Testcontainers",
        lesson: `**Cách tự chấm.** Kiểm tra module bạn phụ trách ở công ty đã có integration test dùng Testcontainers cho tầng repository và ít nhất một luồng API end-to-end, như đã làm ở tuần 23–24.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-done-6",
        text: "Trả lời trôi chảy ≥ 8/10 câu tự kiểm tra",
        lesson: `**Cách tự chấm.** Đếm trong 10 câu tự kiểm tra ở tuần 25–26, có bao nhiêu câu bạn trả lời trôi chảy không cần nhìn lại ghi chú — cần đạt ít nhất 8/10.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
    ],
  },
];
