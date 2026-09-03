// Lộ trình đọc Modern Concurrency in Java — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Modern Concurrency in Java" (O'Reilly,
// ISBN 9781098165406). Thư mục nguồn: modern-concurrency-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (mc-w<N> / mc-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Sách không đánh số mục, nên khối "Đọc" trích nguyên văn tiêu đề chương mục.
// Chương 2 và chương 4 mỗi chương trải hai tuần vì kích thước gấp đôi mặt bằng.

export const modconcWeeksPart1 = [
  {
    id: "mc-w1",
    week: "Tuần 1",
    title: "Từ thread cổ điển tới lời hứa Loom",
    goal: "Kể được vì sao mỗi platform thread lại đắt, và nói được ba bước tiến hoá đưa Java từ thread thô tới Project Loom.",
    practice: "Chạy thử đoạn đếm số thread tối đa trong chương 1 trên máy bạn, ghi lại con số máy bạn chịu được, rồi so với con số sách đưa ra.",
    resources: [
      { label: "MCJ 01 — Giới thiệu: hành trình concurrency của Java", href: "#/docs/modconc-01" },
      { label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" },
    ],
    items: [
      {
        id: "mc-w1-1",
        text: "Java sinh ra cùng thread — và cái giá của mỗi thread",
        lesson: `**Mục tiêu.** Kể được bốn cách tạo thread mà Java tích luỹ qua các phiên bản, và liệt kê được ba khoản chi phí mà mỗi platform thread bắt bạn trả.

**Đọc.** [Lược sử về thread trong Java](#/docs/modconc-01) để lấy trục thời gian bốn chặng, rồi [Sự khởi nguồn của thread trong Java 1.0](#/docs/modconc-01) — gõ lại đoạn \`ThreadCreationDemo\` với bốn cách tạo thread và đọc bốn chú thích đánh số. Trọng tâm của mục này là [Hiểu về những chi phí ẩn của thread](#/docs/modconc-01) cùng phần con "Bạn có thể tạo bao nhiêu thread?": chạy \`ThreadLimitTest\` trên máy bạn. Ba phần con về ngoại lệ, debugger và profiler chỉ cần lướt.

**Bẫy.** Gọi thẳng \`run()\` thay vì \`start()\`. Sách có hẳn ghi chú: làm vậy thì \`run\` chạy trong chính thread đang gọi, không có thread mới nào ra đời. Bẫy thứ hai: đếm chi phí thread chỉ bằng bộ nhớ. Ngoài dấu chân khoảng 2 MiB mỗi thread nằm ngoài heap, sách còn tính thêm trần số native thread của hệ điều hành và chi phí CPU của context switching.

**Tự kiểm tra.** Trên máy bạn, \`ThreadLimitTest\` dừng ở con số nào, và nó văng ra lỗi gì? Theo sách, thread của Java thực chất là gì so với thread của hệ điều hành?`,
      },
      {
        id: "mc-w1-2",
        text: "Từ thread pool tới Executor, work-stealing và CompletableFuture",
        lesson: `**Mục tiêu.** Chỉ ra được chỗ lãng phí thật sự trong một chuỗi lời gọi blocking, và nói được Executor framework giải quyết cái gì — cũng như không giải quyết cái gì.

**Đọc.** [Hiệu quả tài nguyên trong các ứng dụng quy mô lớn](#/docs/modconc-01) — bám theo ví dụ \`calculateCredit()\` qua ba lần viết lại: thread thủ công, rồi \`ExecutorService\`, rồi so ba con số thời gian mà sách in ra. Đọc kỹ phần con "Những thách thức còn lại". Sau đó [Vượt ra ngoài thread pool cơ bản](#/docs/modconc-01) cho cache affinity, work-stealing và \`CompletableFuture\`.

**Bẫy.** Nghĩ chuyển sang \`ExecutorService\` là để chạy nhanh hơn. Sách đo được 630 mili giây, gần như y hệt bản dùng thread thủ công — cái được là quản lý vòng đời thread và chặn thread sinh sôi vô tội vạ, không phải tốc độ. Bẫy thứ hai: tưởng Fork/Join Pool vẫn dùng một queue chung; mỗi thread có queue riêng, và thread hết việc mới "đánh cắp" tác vụ từ đuôi queue của thread khác.

**Tự kiểm tra.** Sách nêu ba hạn chế nào của Executor framework? Và trong ví dụ tính điểm tín dụng, vì sao thời gian song song vẫn còn hơn 600 mili giây chứ không phải 200?`,
      },
      {
        id: "mc-w1-3",
        text: "Reactive là một paradigm khác — và vì sao Loom vẫn cần thiết",
        lesson: `**Mục tiêu.** Nêu được cái giá mà một đội phải trả khi chọn reactive, và nói được virtual thread hứa hẹn thay đổi điều gì mà không bắt viết lại code.

**Đọc.** [Một paradigm khác cho lập trình bất đồng bộ](#/docs/modconc-01) — xem bản \`Mono\` của cùng ví dụ tính điểm tín dụng, rồi đọc chậm phần con "Nhược điểm của việc dùng các reactive framework" (sáu nhược điểm, mỗi cái một đoạn). Kết bằng [Cách mạng hóa concurrency trong Java](#/docs/modconc-01): chú ý đoạn mã chỉ đổi executor sang \`Executors.newVirtualThreadPerTaskExecutor()\`.

**Bẫy.** Đọc chương này thành "reactive đã lỗi thời". Sách nói ngược lại: các framework reactive vẫn có tiềm năng rất lớn để đơn giản hoá những kịch bản bất đồng bộ tinh vi, việc của bạn là cân đánh đổi. Bẫy thứ hai: mong đợi chương 1 dạy bạn reactive — tác giả nói thẳng đó không phải mục tiêu cuốn sách. Nếu muốn đối chiếu với một cách trình bày khác, xem bài về concurrency trong lĩnh vực Java & Spring Boot Scalability của kho này.

**Tự kiểm tra.** Trong sáu nhược điểm của reactive mà sách liệt kê, cái nào liên quan tới việc đổi thư viện về sau? Và theo mục cuối, virtual thread chạy bên trên cái gì?`,
      },
    ],
  },
  {
    id: "mc-w2",
    week: "Tuần 2",
    title: "Virtual thread: khái niệm, cách tạo, scalability",
    goal: "Tạo được virtual thread bằng những cách sách đưa ra, và giải thích được vì sao chúng cho scalability chứ không phải tốc độ.",
    practice: "Chạy lại benchmark Little's Law của chương 2 trên máy bạn: 10.000 tác vụ, mỗi tác vụ ngủ 500 mili giây, lần lượt với `newVirtualThreadPerTaskExecutor()` rồi `newFixedThreadPool(100)`, `(500)` và `(1000)`. Ghi bốn con số throughput và đặt cạnh bảng kết quả trong sách.",
    resources: [
      { label: "MCJ 02 — Tìm hiểu về Virtual Thread", href: "#/docs/modconc-02" },
      { label: "openjdk.org — JEP 444: Virtual Threads", href: "https://openjdk.org/jeps/444" },
    ],
    items: [
      {
        id: "mc-w2-1",
        text: "Virtual thread là gì, khác platform thread ở đâu",
        lesson: `**Mục tiêu.** Nói đúng ai lập lịch cho virtual thread, và kể được bốn khác biệt so với platform thread bằng chính từ ngữ của sách.

**Đọc.** [Virtual thread là gì?](#/docs/modconc-02) — đoạn về scheduler là phần đáng đọc kỹ nhất: nó nói rõ đó là \`ForkJoinPool\` nào, chạy ở chế độ nào, và cấu hình mức parallelism bằng system property nào. Rồi hai phần con "Hai loại thread trong Java" và "Những khác biệt chính so với platform thread" — bốn khác biệt được đặt tên hẳn hoi, học thuộc bốn cái tên đó.

**Bẫy.** Gộp \`ForkJoinPool\` của scheduler virtual thread với common pool. Sách tách bạch: scheduler virtual thread là một \`ForkJoinPool\` riêng chạy FIFO, còn common pool dùng cho những việc khác như parallel stream thì chạy LIFO. Bẫy thứ hai: tưởng platform thread bị thay thế — virtual thread chạy bên trên carrier thread, mà carrier thread chính là platform thread.

**Tự kiểm tra.** Mặc định mức parallelism của scheduler virtual thread bằng bao nhiêu, và đổi nó bằng system property tên gì? Từ phiên bản JDK nào virtual thread có mặt?`,
      },
      {
        id: "mc-w2-2",
        text: "Thiết lập môi trường và các cách tạo virtual thread",
        lesson: `**Mục tiêu.** Viết được virtual thread bằng \`startVirtualThread\`, builder \`Thread.ofVirtual()\` và executor, và biết những phương thức nào của \`Thread\` mất tác dụng trên virtual thread.

**Đọc.** [Thiết lập môi trường cho virtual thread](#/docs/modconc-02) rồi phần con "Tạo virtual thread trong Java" — gõ lại lần lượt từng đoạn mã, đừng đọc lướt đoạn đầu tiên. Tiếp theo [Thích nghi với virtual thread](#/docs/modconc-02): hai ví dụ interrupt đặt cạnh nhau, ví dụ đếm thread group, rồi danh sách các đặc tính bất biến và các phương thức mới hoặc bị deprecated.

**Bẫy.** Chạy đoạn \`Thread.startVirtualThread(...)\` đầu tiên rồi tưởng mình gõ sai vì console không in gì. Sách dựng đúng cái bẫy đó: virtual thread mặc định là daemon thread, main thread kết thúc là JVM chấm dứt chúng — phải \`join()\`. Bẫy thứ hai: cố chỉnh độ ưu tiên hay trạng thái daemon; \`setPriority\` và \`setDaemon\` trên virtual thread không có tác dụng.

**Tự kiểm tra.** Chạy ví dụ 100 virtual thread, \`getThreadGroup()\` cho ra bao nhiêu group khác nhau và tên của nó là gì? Phương thức nào thay cho \`getId()\` đã bị deprecated?`,
      },
      {
        id: "mc-w2-3",
        text: "Throughput không phải tốc độ: nguyên lý đằng sau scalability",
        lesson: `**Mục tiêu.** Giải thích được bằng Little's Law vì sao virtual thread nâng throughput, và nêu được hai đặc điểm workload mà sách nói virtual thread phát huy tác dụng.

**Đọc.** [Minh họa việc tạo virtual thread trong Java](#/docs/modconc-02) — ví dụ 10.000 tác vụ, kèm hai phép so sánh với \`newCachedThreadPool()\` và \`newFixedThreadPool(200)\`. Rồi ba phần con: "Throughput và scalability", "Nguyên lý nền tảng đằng sau scalability của virtual thread" (chạy \`LittleLawExample\` và đọc bảng kết quả bốn dòng), và "Ý nghĩa thực tiễn".

**Bẫy.** Hiểu virtual thread là "chạy nhanh hơn". Sách nói thẳng chúng không được thiết kế để chạy nhanh hơn mà để mang lại scalability cao hơn: chúng tăng N (concurrency) chứ không giảm d (latency). Bẫy thứ hai: kỳ vọng lợi ích ở workload CPU-bound — sách nói rõ chỗ nút thắt là năng lực tính toán thì virtual thread không giúp được gì.

**Tự kiểm tra.** Trong bảng benchmark của sách, throughput của virtual thread gấp khoảng bao nhiêu lần thread pool cố định 1.000 thread? Và theo mục "Throughput và scalability", hai đặc điểm nào của ứng dụng khiến virtual thread trở thành bước ngoặt?`,
      },
      {
        id: "mc-w2-4",
        text: "Dưới lớp vỏ: carrier thread, blocking, và rate limiting bằng Semaphore",
        lesson: `**Mục tiêu.** Mô tả được vòng mount/unmount giữa virtual thread và carrier thread, và dùng được \`Semaphore\` để chặn tải xuống hệ thống phía sau.

**Đọc.** [Virtual thread hoạt động thế nào bên dưới lớp vỏ](#/docs/modconc-02) — bốn phần con đầu rất ngắn, đọc trọn; phần con "Lời hứa của structured concurrency" ở cuối chỉ là ảnh chụp nhanh, để dành tới tuần 5. Rồi [Quản lý ràng buộc tài nguyên bằng rate limiting](#/docs/modconc-02): ví dụ \`ResourceAwareRateLimitExample\`, phần con về semaphore, và khung cảnh báo ở cuối mục.

**Bẫy.** Đổi pool sang virtual thread rồi để một triệu request cùng đổ xuống cơ sở dữ liệu. Trước đây kích thước thread pool vô tình làm luôn việc rate limiting; virtual thread gỡ mất cái phanh đó, nên phải đặt lại phanh bằng semaphore. Bẫy thứ hai: \`release()\` đặt ngoài khối \`finally\`, hoặc gọi \`release()\` ở thread chưa từng \`acquire()\` — sách cảnh báo semaphore không hề ghi nhớ thread nào giữ permit nào, nên số permit hiệu dụng có thể phình ra.

**Tự kiểm tra.** Khi một virtual thread gặp thao tác blocking, stack frame của nó đi đâu và carrier thread làm gì tiếp theo? Vì sao sách nói việc \`acquire()\` bị block giờ rẻ hơn nhiều so với thời platform thread?`,
      },
    ],
  },
  {
    id: "mc-w3",
    week: "Tuần 3",
    title: "Giới hạn của virtual thread: pinning, ThreadLocal, giám sát",
    goal: "Phát hiện được pinning và lạm dụng ThreadLocal trong một ứng dụng có sẵn, và chứng minh bằng công cụ thay vì đoán.",
    practice: "Chạy `ThreadPinnedExample` của chương 2 với cờ `-Djdk.tracePinnedThreads=short`, ghi lại `reason` nó in ra. Đổi khối `synchronized` thành `ReentrantLock` rồi so tên carrier thread in ra trước và sau. Cuối tuần ghi một phiên JFR chỉ gồm các sự kiện virtual thread, và tự lấy một thread dump JSON bằng `jcmd`.",
    resources: [
      { label: "MCJ 02 — Tìm hiểu về Virtual Thread", href: "#/docs/modconc-02" },
      { label: "openjdk.org — JEP 491: Synchronize Virtual Threads without Pinning", href: "https://openjdk.org/jeps/491" },
    ],
    items: [
      {
        id: "mc-w3-1",
        text: "Pinning: khi virtual thread bị ghim vào carrier thread",
        lesson: `**Mục tiêu.** Định nghĩa được pinning bằng chính từ ngữ của sách, kể được hai tình huống gây ra nó và ba hệ quả nó để lại.

**Đọc.** [Những hạn chế của Virtual Thread](#/docs/modconc-02) — hai tình huống gây pinning và ba hệ quả đều được sách đặt tên riêng, chép đủ năm cái tên đó ra giấy. Rồi phần con [Pinning](#/docs/modconc-02): chạy \`ThreadPinnedExample\` và đọc kỹ hai dòng kết quả cùng bốn chú thích đánh số. Đừng bỏ qua khung LƯU Ý ngay sau kết quả.

**Bẫy.** Chạy ví dụ trên JDK mới rồi kết luận mục này đã lỗi thời. Khung LƯU Ý nói từ JDK 24 khối \`synchronized\` không còn pin virtual thread nữa, nhưng sách vẫn dặn: JDK 21 mới là bản LTS mà phần lớn ứng dụng đang dựa vào, nên vẫn phải thiết kế có tính tới pinning. Bẫy thứ hai: tưởng pinning là một dạng deadlock — virtual thread bị pin vẫn chạy bình thường, nó chỉ không nhả carrier thread ra được.

**Tự kiểm tra.** Trong hai dòng kết quả của \`ThreadPinnedExample\`, chi tiết nào chứng minh virtual thread đã bị pin? Và sách khuyên thay \`synchronized\` bằng cái gì?`,
      },
      {
        id: "mc-w3-2",
        text: "Thoát pinning: ReentrantLock và bẫy phương thức native",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`ReentrantLock\` không pin còn \`synchronized\` thì có, và biết vì sao lời gọi native vẫn nằm ngoài tầm với.

**Đọc.** [Giải quyết vấn đề Pinning với ReentrantLock](#/docs/modconc-02) — so hai dòng kết quả với ví dụ tuần trước, rồi đọc khung "Cơ chế park/unpark" và khung ba ví dụ về mức độ nghiêm trọng của \`synchronized\`. Tiếp theo [Gọi phương thức Native và Pinning](#/docs/modconc-02): nếu không dựng được thư viện C thì bỏ qua phần biên dịch, nhưng đọc kỹ đoạn giải thích *vì sao* native pin và khung JEP 491 ở cuối.

**Bẫy.** Coi \`ReentrantLock\` là thuốc chữa bách bệnh cho pinning. Sách chỉ rõ lời gọi native hay foreign function vẫn pin, vì JVM không kiểm soát được code native: stack native không lưu và khôi phục được như Java stack frame. Nói trước để bạn khỏi tưởng mình đọc nhầm: chính cuốn sách không nhất quán ở đúng chỗ này — văn xuôi khẳng định native vẫn pin, còn đầu ra ví dụ chạy trên JDK 25 ở cuối khung JEP 491 lại in ra hai carrier thread khác nhau. Bẫy thứ hai: quên \`unlock()\` trong khối \`finally\` — sách nhấn mạnh đây là điều bắt buộc để tránh deadlock khi có ngoại lệ.

**Tự kiểm tra.** Hai đoạn code \`synchronized\` nào trong khung ba ví dụ bị sách xếp vào loại đáng lo, và điểm chung của chúng là gì? Sách gợi ý ba cách nào để giảm nhẹ pinning do lời gọi native?`,
      },
      {
        id: "mc-w3-3",
        text: "ThreadLocal trong virtual thread — bài toán nan giải",
        lesson: `**Mục tiêu.** Nói được vì sao một thói quen vô hại thời platform thread lại thành vấn đề khi có hàng triệu thread, và biết hai hướng thoát mà sách đề xuất.

**Đọc.** [Bài toán nan giải của biến ThreadLocal trong Virtual Thread](#/docs/modconc-02) — mục mở đầu rất ngắn, nêu hai trường hợp dùng kinh điển. Phần con "Những thách thức với Virtual Thread" mới là trọng tâm: ba thách thức có tên riêng, ví dụ 1.000 virtual thread mỗi thread giữ một đối tượng lớn, và hai hình chụp JConsole đặt cạnh nhau. Kết mục là hai chiến lược thay thế.

**Bẫy.** Nghĩ \`ThreadLocal\` an toàn vì "mỗi thread một bản sao" nên không phải đồng bộ hoá gì. Đúng về đồng bộ hoá, nhưng chính cái "mỗi thread một bản sao" là vấn đề khi số thread nhân lên hàng nghìn lần. Bẫy thứ hai: quên chuyện kế thừa — sách nói virtual thread kế thừa giá trị \`ThreadLocal\` từ thread cha y như thread truyền thống, và đó là nguồn của những lỗi tinh vi khó lần theo.

**Tự kiểm tra.** Ba thách thức mà sách đặt tên là gì? Trong ví dụ đo bằng JConsole, mỗi virtual thread giữ đối tượng lớn cỡ nào và có bao nhiêu thread?`,
      },
      {
        id: "mc-w3-4",
        text: "Giám sát: JFR, thread dump và mẹo khi chuyển sang virtual thread",
        lesson: `**Mục tiêu.** Chọn đúng công cụ cho từng câu hỏi — cờ JVM, JFR hay thread dump — và biết trước ba việc phải làm khi migrate một ứng dụng cũ.

**Đọc.** [Giám sát (Monitoring)](#/docs/modconc-02) — ba phần con lần lượt cho: cờ theo dõi \`ThreadLocal\`; pinning, gồm cờ với hai mức đầu ra rồi bốn tên sự kiện JFR gói trong ba gạch đầu dòng (chú ý hai sự kiện nào bật sẵn, và ngưỡng mặc định của sự kiện báo pinning); và thread dump bằng \`jcmd\` với hai định dạng cùng danh sách những thứ dump này *không* có. Rồi [Tạo Thread Dump với HotSpotDiagnosticsMXBean](#/docs/modconc-02) và [Mẹo thực tiễn khi chuyển sang Virtual Thread](#/docs/modconc-02).

**Bẫy.** Mở thread dump của \`jcmd\` rồi đi tìm thông tin lock. Sách liệt kê hẳn những gì bị lược bỏ: địa chỉ đối tượng, lock, thống kê JNI, thống kê heap. Bẫy thứ hai: đặt semaphore quá chặt khi migrate — sách gọi đây là "thế lưỡng nan của semaphore", giới hạn quá thấp thì bóp nghẹt concurrency và làm mất chính lợi ích của virtual thread.

**Tự kiểm tra.** Sự kiện JFR nào được bật mặc định để báo pinning, và ngưỡng thời gian mặc định của nó là bao nhiêu? Khi dùng \`dumpThreads\`, sách dặn gì về đường dẫn tệp đầu ra?`,
      },
    ],
  },
  {
    id: "mc-w4",
    week: "Tuần 4",
    title: "Cơ chế bên dưới: pool, ForkJoinPool, continuation",
    goal: "Lắp được bức tranh bên trong virtual thread từ hai mảnh mà sách nêu: ForkJoinPool làm scheduler, và continuation làm phần tạm dừng rồi chạy tiếp.",
    practice: "Chạy hai bản tính Fibonacci của chương 3: bản dùng `newFixedThreadPool(100)` sẽ treo — lấy thread dump bằng `jcmd` để nhìn tận mắt đống thread đang chờ; bản dùng `ForkJoinPool` với `RecursiveTask` trả kết quả ngay. Sau đó chạy demo `NanoThread` và tìm dòng cho thấy cùng một NanoThread đổi worker thread giữa chừng.",
    resources: [
      { label: "MCJ 03 — Cơ chế hoạt động của concurrency hiện đại", href: "#/docs/modconc-03" },
      { label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" },
    ],
    items: [
      {
        id: "mc-w4-1",
        text: "Vì sao cần thread pool — và tự xây một pool để hiểu nó",
        lesson: `**Mục tiêu.** Kể được thread pool giải quyết những vấn đề gì, và đọc hiểu một bản triển khai pool tối giản do chính bạn gõ lại.

**Đọc.** [Thread Pool](#/docs/modconc-03) rồi phần con "Vì sao chúng ta cần Thread Pool?" — hai mục rất ngắn, nêu đủ lý do. Trọng tâm là [Xây dựng một Thread Pool đơn giản trong Java](#/docs/modconc-03): gõ lại lớp \`Worker\` và \`SimpleThreadPool\`, chạy ví dụ bốn worker với queue một trăm, rồi thử đổi hai con số đó. Sáu chú thích đánh số trong phần triển khai là phần đáng đọc chậm nhất.

**Bẫy.** Cho rằng queue nên không giới hạn để "không mất tác vụ nào". Sách chọn queue có dung lượng hữu hạn đúng vì lý do ngược lại: nó chặn cạn kiệt bộ nhớ, và \`put()\` block khi queue đầy chính là backpressure tự nhiên. Bẫy thứ hai: bỏ qua phần đóng pool — sách hiện thực \`AutoCloseable\` và chờ queue vơi trước khi shutdown để không mất công việc đang chờ.

**Tự kiểm tra.** Cờ \`running\` được khai \`volatile\` để tránh chuyện gì? Và pool này ra hiệu dừng cho toàn bộ worker bằng cách nào thay vì interrupt từng thread một?`,
      },
      {
        id: "mc-w4-2",
        text: "Executor framework, Callable và Future",
        lesson: `**Mục tiêu.** Đọc được constructor của \`ThreadPoolExecutor\` và nói được mỗi phương thức factory trong \`Executors\` thực chất cấu hình cái gì.

**Đọc.** [Executor Framework](#/docs/modconc-03) — bảy tham số của constructor \`ThreadPoolExecutor\` được giải thích lần lượt, đọc hết rồi mới xuống năm loại pool (mỗi loại có một khối "Khi nào nên dùng"). Sau đó [Callable và Future: Xử lý kết quả của tác vụ](#/docs/modconc-03) với hai phần con và ví dụ Fibonacci có cache.

**Bẫy.** Nghĩ virtual thread đã khai tử thread pool. Sách nói rõ các trường hợp dùng pool sẽ không biến mất — hệ thống cũ, ràng buộc tương thích, yêu cầu hiệu năng riêng — và còn dẫn một nghiên cứu trong đó bản \`ThreadPool\` riêng của một runtime chạy tốt hơn virtual thread. Bẫy thứ hai: chọn \`CachedThreadPool\` cho tác vụ chạy dài; sách nói nó chỉ hợp với nhiều tác vụ ngắn hạn hoặc các đợt đến bất thường.

**Tự kiểm tra.** \`newFixedThreadPool()\` đặt \`corePoolSize\` và \`maximumPoolSize\` theo cách nào? Và \`Callable\` khác \`Runnable\` ở đúng hai điểm nào?`,
      },
      {
        id: "mc-w4-3",
        text: "ForkJoinPool và vì sao nó làm scheduler cho virtual thread",
        lesson: `**Mục tiêu.** Nói được \`ForkJoinPool\` khác pool truyền thống ở chỗ nào — mỗi thread một deque riêng thay cho một queue dùng chung gây tranh chấp — và kể lại được thứ mà sách gọi là điểm khác biệt độc đáo của nó, rồi từ đó giải thích vì sao chính nó được chọn để lập lịch virtual thread.

**Đọc.** [ForkJoinPool](#/docs/modconc-03) — bám theo ví dụ Fibonacci hai lần: bản dùng thread pool cố định (chạy thử để tận mắt thấy nó treo) rồi bản \`RecursiveTask\`, đọc kỹ chú thích số ③. Tiếp theo [Tại sao lại dùng ForkJoinPool cho Virtual Thread?](#/docs/modconc-03): cấu trúc deque của mỗi worker, hai đầu lấy tác vụ, submission queue, và chế độ async ở cuối mục.

**Bẫy.** Tưởng \`ForkJoinPool\` tự chia nhỏ tác vụ giúp bạn. Sách nhấn mạnh nó chỉ quản lý pool thread; việc xác định cách chia nhỏ là trách nhiệm của lập trình viên, qua \`RecursiveTask\` hoặc \`RecursiveAction\`. Bẫy thứ hai: thấy chủ hàng đợi lấy tác vụ mới nhất rồi kêu là bất công với tác vụ cũ — sách giải thích đó là để tận dụng cache CPU, còn tác vụ cũ chính là phần mà stealer lấy từ đầu bên kia.

**Tự kiểm tra.** Vì sao bản Fibonacci dùng pool cố định 100 thread lại rơi vào deadlock, trong khi \`ForkJoinPool\` thì không? Và virtual thread dùng \`ForkJoinPool\` ở chế độ nào?`,
      },
      {
        id: "mc-w4-4",
        text: "Continuation: tự dựng virtual thread từ đầu và chuyện I/O polling",
        lesson: `**Mục tiêu.** Diễn giải được continuation bằng hình ảnh stack frame bị bê đi rồi bê về, và kể được ai đánh thức một virtual thread khi dữ liệu về tới socket.

**Đọc.** [Continuation](#/docs/modconc-03) — chạy ví dụ ba lần \`run()\` xen \`yield\` để thấy thứ tự dòng in ra, rồi đọc chuỗi Hình 3-3 tới Hình 3-6 cùng phần giải thích lazy copy và return barrier. Tiếp theo [Tự xây dựng Virtual Thread của riêng chúng ta từ đầu](#/docs/modconc-03) với bốn phần con dựng dần \`NanoThread\`. Kết bằng [Virtual Thread và I/O Polling](#/docs/modconc-03), mục ngắn nhưng là mảnh ghép cuối.

**Bẫy.** Mang \`Continuation\` của package nội bộ vào mã production. Sách có khung CẢNH BÁO riêng cho việc này: API nội bộ có thể đổi hoặc biến mất không báo trước, và muốn chạy được ví dụ còn phải thêm tham số \`--add-exports\`. Bẫy thứ hai: đinh ninh một virtual thread gắn đời với một carrier thread — kết quả demo \`NanoThread\` cho thấy cùng một tác vụ bắt đầu ở worker này và kết thúc ở worker khác.

**Tự kiểm tra.** Cơ chế lazy copy tránh được chi phí gì so với cách sao chép toàn bộ stack mỗi lần yield? Và trên Linux, read poller của JVM dựa trên cơ chế nào của hệ điều hành?`,
      },
    ],
  },
  {
    id: "mc-w5",
    week: "Tuần 5",
    title: "Structured concurrency: API và chính sách join",
    goal: "Viết lại được một thao tác chạy song song bằng StructuredTaskScope, và chọn đúng chính sách join cho từng loại bài toán thay vì luôn dùng mặc định.",
    practice: "Lấy đúng ví dụ lấy sản phẩm kèm đánh giá của chương 4. Chạy bản `ExecutorService` với kịch bản một tác vụ hỏng sớm còn tác vụ kia mất năm giây, ghi lại tổng thời gian và dòng log của tác vụ mồ côi. Viết lại bằng `StructuredTaskScope` rồi so hai con số. Cuối tuần đổi joiner sang `anySuccessfulResultOrThrow()` và `awaitAll()` để thấy hành vi hủy khác nhau thế nào.",
    resources: [
      { label: "MCJ 04 — Structured Concurrency", href: "#/docs/modconc-04" },
      { label: "openjdk.org — JEP 505: Structured Concurrency", href: "https://openjdk.org/jeps/505" },
    ],
    items: [
      {
        id: "mc-w5-1",
        text: "Thách thức của unstructured concurrency",
        lesson: `**Mục tiêu.** Chỉ ra được ba vấn đề cụ thể mà cặp \`ExecutorService\` và \`Future\` để lại khi các tác vụ có quan hệ với nhau.

**Đọc.** [Thách thức của unstructured concurrency](#/docs/modconc-04) — dựng lại ví dụ \`ProductService\` theo từng phần, chạy bản chạy tốt trước. Rồi sửa theo đúng kịch bản mà sách bày ra: lấy sản phẩm mất năm giây trong khi lấy đánh giá hỏng sau một giây, chạy lại và đọc kỹ log cùng Hình 4-1. Đoạn kết so unstructured concurrency với một câu lệnh khét tiếng thời xưa, đừng bỏ qua.

**Bẫy.** Tin rằng bọc executor trong \`try\`-with-resources là đủ. Sách chỉ ra vấn đề nằm chỗ khác: \`ExecutorService\` không có khái niệm scope chung, hai \`Future\` với nó là độc lập, nên một tác vụ hỏng không hề ảnh hưởng tới tác vụ kia. Bẫy thứ hai: nghĩ thread mồ côi giờ vô hại vì virtual thread rẻ — chúng vẫn ngốn bộ nhớ và chu kỳ CPU cho một request đã mất ý nghĩa.

**Tự kiểm tra.** Trong kịch bản lệch pha thời gian, vì sao thao tác vẫn tốn trọn năm giây dù kết quả chắc chắn bị vứt đi? Và theo sách, thread dump của cách làm này thiếu mất thông tin gì?`,
      },
      {
        id: "mc-w5-2",
        text: "Lời hứa của structured concurrency và API StructuredTaskScope",
        lesson: `**Mục tiêu.** Viết lại được ví dụ tuần này bằng \`StructuredTaskScope\`, và đọc đúng chuyện gì xảy ra khi một subtask ném ngoại lệ.

**Đọc.** [Lời hứa của Structured Concurrency](#/docs/modconc-04) cho nguyên tắc cốt lõi và năm lợi ích. Rồi [Tìm hiểu API](#/docs/modconc-04) và [StructuredTaskScope](#/docs/modconc-04) — bốn phương thức chính được giải thích lần lượt, đọc kỹ phần mô tả \`join()\`. Gõ lại bản \`fetchProductInfo()\` viết theo scope, chạy cả đường thành công lẫn đường thất bại. Khung LƯU Ý cho biết cần cờ nào để biên dịch và chạy.

**Bẫy.** Tự gọi \`close()\` cho tiện. Sách nói rõ trong \`try\`-with-resources thì không nên gọi thủ công, và đóng scope sai trình tự khi có scope lồng nhau sẽ ném \`StructureViolationException\`. Bẫy thứ hai: gọi \`join()\` nhiều lần — sách ghi phương thức này chỉ được chủ sở hữu scope gọi đúng một lần.

**Tự kiểm tra.** Khi một subtask thất bại, \`join()\` ném ra ngoại lệ nào và ngoại lệ gốc nằm ở đâu trong đó? Và nếu subtask được fork từ một \`Runnable\` thì \`Subtask.get()\` trả về gì?`,
      },
      {
        id: "mc-w5-3",
        text: "Scope và subtask: quan hệ, vòng đời, và Joiner",
        lesson: `**Mục tiêu.** Kể đúng trình tự một subtask đi qua — fork, chạy, báo hoàn thành, được join, đóng scope — và biết \`Joiner\` cắm vào đâu trong trình tự đó.

**Đọc.** [Scope và Subtask: Mối quan hệ và Vòng đời](#/docs/modconc-04) với ba phần con ngắn: hai overload của \`fork()\`, ba bước của quá trình fork, và phần hoàn thành subtask. Rồi [Chính sách join với Joiner](#/docs/modconc-04) — hai outcome method và hai lifecycle hook, kèm bốn chú thích đánh số. Mục này ngắn nhưng là bản lề để hiểu mục tiếp theo.

**Bẫy.** Gọi \`Subtask.get()\` ngay sau \`fork()\`. Sách nói handle chỉ dùng được để lấy kết quả hoặc ngoại lệ *sau khi* scope đã được join. Bẫy thứ hai: đinh ninh \`fork()\` luôn khởi động một thread mới — nếu \`Joiner\` xác định subtask không nên chạy, ví dụ scope đã bị hủy, thì \`fork()\` trả về handle mà không thread nào được khởi động.

**Tự kiểm tra.** Một \`Subtask\` có thể mang những trạng thái cuối cùng nào? Và trong bốn phương thức của \`Joiner\`, cái nào là nơi logic chính sách thường nằm?`,
      },
      {
        id: "mc-w5-4",
        text: "Các chính sách join phổ biến",
        lesson: `**Mục tiêu.** Chọn đúng một trong năm chính sách cho một bài toán cụ thể, và nói được mỗi chính sách hủy hay không hủy các subtask còn lại.

**Đọc.** [Các chính sách join phổ biến](#/docs/modconc-04) — mục dài nhất chương. Đọc đoạn tóm tắt năm phương thức factory trước, rồi lần lượt các phần con: chờ tất cả thành công (kèm phép so sánh với \`ExecutorService\`), đua lấy kết quả đầu tiên, thu thập mọi kết quả, \`awaitAll()\` với hai ví dụ gửi thông báo và echo server chịu lỗi, và cuối cùng là điều kiện dừng tự đặt. Chạy ít nhất hai ví dụ, đừng chỉ đọc.

**Bẫy.** Dùng \`awaitAll()\` rồi đi tìm kết quả ở giá trị trả về. Sách nói \`join()\` của chính sách này luôn trả về \`null\`; kết quả phải do bạn tự gom qua side effect, và ví dụ dùng cấu trúc dữ liệu thread-safe đúng vì lý do đó. Bẫy thứ hai: lẫn chính sách mặc định với \`allSuccessfulOrThrow()\` — đường thất bại giống nhau, khác nhau ở đường thành công, và sách nói rõ cái nào hợp khi các subtask trả về cùng kiểu, cái nào hợp khi khác kiểu.

**Tự kiểm tra.** Trong kịch bản thất bại của chính sách mặc định, tổng thời gian sách đo được là bao nhiêu, và vì sao bản \`ExecutorService\` lại lâu hơn hẳn? Chính sách nào không bao giờ hủy subtask khi một tác vụ hỏng?`,
      },
    ],
  },
];
