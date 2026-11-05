// Lộ trình đọc Java Under the Hood — Phần 2 (Tuần 8–13).
//
// Nguồn: series tiếng Việt "Java Under the Hood" (26 bài + lộ trình series, JDK 25 LTS / 27).
// Thư mục nguồn: sources/under-hood/ — mã lab bài 16–26 ở sources/under-hood/src/baiNN-*-src.zip.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào bài, không chép lại nội dung bài; mọi chi tiết ở
// Bẫy / Tự kiểm tra đều có trong bài được trỏ tới (phần lớn lấy từ "Hiểu lầm thường gặp"
// và "Bài tập tự làm" ở mục cuối mỗi bài, diễn đạt lại).
// Link mục dạng [§N Tiêu đề](#/docs/uh-NN) — N là số của một tiêu đề "## N" có thật trong
// đúng tệp sources/under-hood/NN-*.md.
// GIỮ NGUYÊN id (uh-w<N> / uh-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 6 tuần còn lại bám ranh giới chặng: T8 bài 12–13 (ZGC/Shenandoah, GC trong
// container) · T9 bài 14–15 + ôn Chặng III · T10 bài 16–17 (JMM, synchronized) ·
// T11 bài 18–20 (safepoint, virtual thread, java.util.concurrent) · T12 bài 21–24
// (Chặng V — ngôn ngữ dưới lớp vỏ) · T13 bài 25–26 + tổng ôn series (Chặng VI).

export const uhWeeksPart2 = [
  {
    id: "uh-w8",
    week: "Tuần 8",
    title: "ZGC, Shenandoah và GC trong container",
    goal: "Giải thích được ZGC và Shenandoah dời object khi ứng dụng vẫn chạy bằng barrier nào và trả giá bằng CPU, bộ nhớ, allocation stall/pacing ra sao; và đọc được từ cgroup của một pod: JVM thấy mấy CPU, tự chọn GC nào, heap mặc định bao nhiêu, vì sao p99 xấu có thể do throttling chứ không do GC.",
    practice: "Chạy cùng một service với -Xlog:gc* lần lượt bằng G1, ZGC và Shenandoah (thêm -XX:ShenandoahGCMode=generational), đếm dòng Allocation Stall và so tổng Pacing trong -Xlog:gc+stats; rồi `docker run --cpus=1 --memory=1g eclipse-temurin:25 java -Xlog:gc+init -XshowSettings:system -version`, lặp lại với --cpus=2 và --memory=1792m / 1791m để thấy ergonomics đổi Serial ↔ G1.",
    resources: [
      { label: "JUH 12 — ZGC & Shenandoah", href: "#/docs/uh-12" },
      { label: "JUH 13 — Chọn và tinh chỉnh GC cho container", href: "#/docs/uh-13" },
      { label: "HotSpot GC Tuning Guide (JDK 25)", href: "https://docs.oracle.com/en/java/javase/25/gctuning/" },
    ],
    items: [
      {
        id: "uh-w8-1",
        text: "ZGC và Shenandoah: colored pointer, LRB và một chu kỳ đọc từng dòng",
        lesson: `**Mục tiêu.** Giải thích được vì sao G1 phải chép object trong pause còn ZGC/Shenandoah thì không, phân biệt hai cách đánh dấu "tham chiếu này có thể đã cũ" (màu trong 16 bit thấp của con trỏ so với forwarding trong mark word của object cũ), và đọc được một chu kỳ ZGC Minor Collection cùng một chu kỳ Shenandoah trong \`-Xlog:gc*\`.

**Đọc.** [§2 Bài toán: dời object khi ứng dụng vẫn chạy](#/docs/uh-12) → [§3 ZGC: colored pointer và load barrier](#/docs/uh-12) → [§4 Shenandoah: forwarding trong header và LRB](#/docs/uh-12) → [§5 Đọc một chu kỳ ZGC và Shenandoah, từng dòng](#/docs/uh-12). Đọc kỹ hai lệnh \`shr\`/\`ja\` của load barrier ZGC và phép \`testb\` lên byte \`gc_state\` của Shenandoah ở §3–§4; đọc hộp "Lịch sử ngắn" để không lạc khi gặp tài liệu cũ về multi-mapping hay Brooks pointer. Ở §5 dò theo các chú thích ①–⑨ và dòng *Trigger* của heuristic adaptive.

**Bẫy.** Nghĩ "ZGC không có pause". Bài chỉ ra mỗi chu kỳ vẫn có ba pause, mỗi cái khoảng 0,01 ms — chỉ để đồng bộ trạng thái và đổi màu "tốt". Bẫy thứ hai: nghĩ barrier chỉ chạy lúc GC đang làm việc. Barrier của ZGC chạy suốt đời ứng dụng trên mỗi lần đọc tham chiếu; Shenandoah thì tắt hẳn barrier khi GC rảnh, nhưng đổi lại phải có pha update references đi khắp heap sửa tham chiếu cũ.

**Tự kiểm tra.** Vì sao Shenandoah giữ được compressed oops còn ZGC thì không? Dòng "Alloc Tax Rate 9.9x" ở cuối log Shenandoah nói gì về việc một thread muốn cấp phát thêm 1 MB lúc heap gần cạn?`,
      },
      {
        id: "uh-w8-2",
        text: "Năm GC trên một service và ba hoá đơn: CPU, bộ nhớ, khi GC không theo kịp",
        lesson: `**Mục tiêu.** Đọc đúng bảng "cùng một service, năm GC" để thấy pause ≠ latency theo cả hai chiều, và kể được ba hoá đơn của GC đồng thời — CPU thêm, heap/RSS lớn hơn cho cùng dữ liệu, và kiểu chờ mới (allocation stall, pacing) không hiện trong số liệu pause.

**Đọc.** [§6 Cùng một service, năm GC](#/docs/uh-12) — đọc kỹ "Bốn điều bảng này dạy" và bảng so ZGC thế hệ/không thế hệ trên JDK 21. [§7 Cái giá thứ nhất: CPU](#/docs/uh-12) cho mốc Epsilon và hộp "Epsilon không chạm trước". [§8 Cái giá thứ hai: bộ nhớ](#/docs/uh-12) cho compressed oops, \`RssShmem\` và vực ở khoảng 1,2× dữ liệu sống. [§9 Cái giá thứ ba: khi GC không theo kịp](#/docs/uh-12) — đọc kỹ allocation stall của ZGC và ba bậc xuống cấp của Shenandoah. [§10 Trong Spring Boot: chọn, bật và quan sát](#/docs/uh-12) cho bean \`ZgcStallMetrics\` dùng \`jdk.ZAllocationStall\`. Chốt lại bằng [§11 Ghép lại](#/docs/uh-12).

**Bẫy.** Nghĩ "pause dưới 1 ms nghĩa là GC không làm chậm request". Bài đo 423 lần stall, cộng lại 3,7 s trong 20 s, trong khi pause dài nhất chỉ 1,4 ms. Bẫy thứ hai: giữ nguyên \`-Xmx\` khi đổi sang ZGC. Dữ liệu sống tính bằng ZGC lớn hơn (khoảng +23% heap cho cùng dữ liệu), nên ở 440 MB ZGC sụp trong khi G1 vẫn chạy. Bẫy thứ ba: bật \`-XX:+UseShenandoahGC\` rồi thôi — ở JDK 25 chế độ mặc định vẫn không phân thế hệ, p99 134 ms vì pacing; thêm \`ShenandoahGCMode=generational\` thì còn 0,30 ms.

**Tự kiểm tra.** Vì sao Epsilon — không thu gom gì — lại tốn CPU hơn mọi GC khi chạy không có \`AlwaysPreTouch\`? Ở cùng heap 440 MB, G1, ZGC và Shenandoah thế hệ mỗi GC đổ vỡ theo cách nào, và cách nào hiện ra trong \`jvm.gc.pause\`?`,
      },
      {
        id: "uh-w8-3",
        text: "JVM nhìn container: cgroup, ergonomics server-class, heap 25% và số thread",
        lesson: `**Mục tiêu.** Dự đoán được, chỉ từ \`limits.cpu\`/\`limits.memory\` của một pod, JVM sẽ thấy mấy CPU, chọn GC nào (tới JDK 26 và từ JDK 27), heap tối đa và ban đầu bao nhiêu, và bao nhiêu thread GC/JIT/commonPool sẽ được tạo.

**Đọc.** [§2 JVM nhìn container như thế nào](#/docs/uh-13) cho ba file cgroup và cách đọc \`-XshowSettings:system\` cùng \`-Xlog:gc+init\`. [§3 Ergonomics chọn GC: quy tắc “server-class”](#/docs/uh-13) — đọc kỹ ngưỡng 2 CPU và 2 GB trừ 256 MB, bảng 28 kích thước pod, và JEP 523 ở JDK 27. [§4 Heap mặc định: 25% và những ngoại lệ](#/docs/uh-13) cho \`MaxRAMPercentage\`/\`MinRAMPercentage\`/\`InitialRAMPercentage\` và cái giá của heap khởi đầu nhỏ với Serial. [§5 Số thread: GC, JIT và cái bẫy “không đặt CPU limit”](#/docs/uh-13) — đọc kỹ bảng \`ActiveProcessorCount\` → số thread GC/JIT và lời khuyên khi chủ động bỏ CPU limit.

**Bẫy.** Nghĩ "service Java nào cũng chạy G1". Bài chỉ ra tới JDK 26, pod dưới 2 CPU hoặc dưới 1792 MB chạy Serial — kể cả pod 2 CPU, 1 GB; mọi bài "tinh chỉnh G1" không áp dụng cho nó. Bẫy thứ hai: nghĩ \`requests.cpu\` quyết định số CPU JVM thấy. JVM bỏ qua CPU shares từ JDK 19; chỉ limit có tác dụng, và không đặt limit thì JVM thấy cả node — pod "500m" trên node 64 lõi có 43 thread GC song song.

**Tự kiểm tra.** Pod \`cpu=1, memory=1Gi\` trên JDK 25 chạy GC nào, heap tối đa và ban đầu bao nhiêu? Trên Actuator, tag \`gc\` nào của \`jvm.gc.pause\` cho bạn biết đang chạy Serial? Cùng \`-Xmx256m\` và Serial, vì sao pod 1 GB có 158 lần GC trong 30 giây còn JVM không giới hạn chỉ có 43, và bài khuyên đặt cờ nào để tránh?`,
      },
      {
        id: "uh-w8-4",
        text: "CPU throttling, bốn GC trong pod nhỏ và ngân sách memory limit",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`limits.cpu: 1\` là quota theo chu kỳ 100 ms chứ không phải "1 lõi", đọc được tỉ lệ chu kỳ bị throttle cạnh p99, và tự tính một \`MaxRAMPercentage\` an toàn từ phần ngoài heap đo bằng NMT.

**Đọc.** [§6 CPU limit là throttling, không phải “1 lõi”](#/docs/uh-13) — đọc kỹ bảng 500m/1/2 lõi và hộp "Đọc throttling ở đâu". [§7 Bốn GC trong pod nhỏ](#/docs/uh-13) đọc theo ba lớp: GC xếp sau throttling, Serial → G1 ở JDK 27, ZGC trong pod nhỏ. [§8 Memory limit: heap không phải là tất cả](#/docs/uh-13) — đọc kỹ bảng NMT phần ngoài heap, thí nghiệm pod 512 MB với \`AlwaysPreTouch\`, và hai hộp phân biệt \`OutOfMemoryError\` với OOMKilled. [§9 Trong Spring Boot: công thức cấu hình và quan sát](#/docs/uh-13) cho năm quyết định theo thứ tự và hộp Paketo memory calculator.

**Bẫy.** Nghĩ "p99 cao thì đổi GC". Ở 1 lõi, mọi GC cho p99 16–26 ms; thêm lõi thứ hai đưa tất cả về 2,4 ms — khoảng cách giữa 1 và 2 lõi lớn hơn mọi khác biệt giữa các GC. Bẫy thứ hai: nghĩ "OOMKilled là do heap đầy". Heap đầy cho \`OutOfMemoryError\` có stack trace; OOMKilled là kernel giết cả tiến trình (exit 137, không log Java) khi tổng heap + ngoài heap vượt limit — 85–90% của 512 MB đã là OOMKilled.

**Tự kiểm tra.** Pod chỉ dùng trung bình 0,42 lõi mà p99 vẫn tăng gần 7 lần ở \`limits.cpu: 1\` — "cụm CPU" nào đốt quota sớm? Với pod 512 MB và phần ngoài heap 114 MB (G1), bài tính ra \`MaxRAMPercentage\` khoảng bao nhiêu, theo quy tắc nào?`,
      },
    ],
  },
  {
    id: "uh-w9",
    week: "Tuần 9",
    title: "Log GC, memory leak, bộ nhớ ngoài heap và ôn Chặng III",
    goal: "Phân biệt được leak, cache và service khoẻ chỉ từ đường heap sau GC, lần được từ \"heap tăng\" tới đúng singleton đang giữ bộ nhớ bằng histogram, dominator tree và JFR OldObjectSample; và chỉ ra được những vùng RSS mà -Xmx, heap dump và jvm.buffer.memory.used không thấy.",
    practice: "Trên staging: chụp hai `jcmd <pid> GC.class_histogram` cách nhau dưới tải, lấy một heap dump rồi mở bằng Eclipse MAT (hoặc script sources/under-hood/src/hprof_analyzer_bai14.py), chạy JFR `-XX:StartFlightRecording=settings=profile` rồi `JFR.dump path-to-gc-roots=true`; bật -XX:NativeMemoryTracking=summary và so `jcmd <pid> VM.native_memory summary` với RSS của container.",
    resources: [
      { label: "JUH 14 — Đọc log GC & săn memory leak", href: "#/docs/uh-14" },
      { label: "JUH 15 — Reference & bộ nhớ ngoài heap", href: "#/docs/uh-15" },
      { label: "Eclipse Memory Analyzer", href: "https://eclipse.dev/mat/" },
    ],
    items: [
      {
        id: "uh-w9-1",
        text: "Unified logging, ba đường cong heap và log GC của một service đang chết",
        lesson: `**Mục tiêu.** Viết được một cấu hình \`-Xlog\` cho production (file, rotation, decorator, async), đổi cấu hình log lúc chạy bằng \`jcmd VM.log\`, và đọc đúng đáy răng cưa — heap ngay sau GC — để phân biệt service khoẻ, cache và leak, cùng ba dấu hiệu theo thứ tự của một JVM sắp OOM.

**Đọc.** [§2 Unified logging: một cú pháp cho mọi log của JVM](#/docs/uh-14) — đọc kỹ hộp "Cấu hình log GC cho service production" và chi tiết mặc định 5 file × 20 MB, không có gì ra stdout. [§3 Ba service, ba đường cong heap](#/docs/uh-14) cho lỗi khoá cache chứa \`requestedAt\` và ba chế độ none/lru/leak. [§4 Log GC của một service đang chết](#/docs/uh-14) — đọc kỹ chuỗi Evacuation Failure → \`Pause Full\` "sau ≈ trước" và đoạn JVM sống dở hơn 20 phút.

**Bẫy.** Nghĩ "heap used tăng đều là có leak". Với G1, răng cưa đi lên là bình thường vì Eden lớn khi heap còn trống; cảnh báo trên \`jvm.memory.used\` sẽ kêu cả ngày — thứ cần nhìn là heap sau GC (\`jvm.gc.live.data.size\`). Bẫy thứ hai: nghĩ OOM thì JVM chết và pod tự khởi động lại. Bài đo JVM sống dở hơn 20 phút ở 98–100% thời gian trong GC, bỏ qua cả SIGTERM; cần \`-XX:+ExitOnOutOfMemoryError\` (kèm \`-XX:+HeapDumpOnOutOfMemoryError\` để giữ bằng chứng). Bẫy thứ ba: vẫn dùng \`-XX:+PrintGCDetails\`/\`-Xloggc\` — trên JDK 25 chúng chỉ còn là cảnh báo deprecated rồi tự đổi sang \`-Xlog\`.

**Tự kiểm tra.** Container của bạn chỉ thu stdout — với cấu hình \`-Xlog:gc*:file=…\`, log GC đang ở đâu và giữ được bao lâu? Ba dấu hiệu nào xuất hiện theo thứ tự trong log trước khi \`OutOfMemoryError\` bị ném?`,
      },
      {
        id: "uh-w9-2",
        text: "Histogram, heap dump, dominator tree, đường tới GC root và JFR OldObjectSample",
        lesson: `**Mục tiêu.** Đi đủ ba bước điều tra leak — cái gì tăng (hai histogram), ai giữ (dominator tree, retained size), vì sao còn sống (path to GC roots) — biết cái giá và rủi ro bảo mật của từng bước, và dùng JFR OldObjectSample khi không muốn lấy heap dump.

**Đọc.** [§5 Bước 1 — histogram: cái gì đang tăng?](#/docs/uh-14) cho dấu vân tay \`Quote\`/\`QuoteKey\`/\`ConcurrentHashMap$Node\` tăng cùng nhịp và hộp "Chi phí của histogram". [§6 Bước 2 — heap dump: chụp lại toàn bộ heap](#/docs/uh-14) cho bảng chi phí (có \`-gz=1\`) và hộp "Heap dump là dữ liệu nhạy cảm". [§7 Shallow, retained và dominator tree](#/docs/uh-14) — đọc kỹ ba định nghĩa. [§8 Bước 3 — ai đang giữ? Dominator tree và đường tới GC root](#/docs/uh-14) cho hai mẫu hình chữ ký của leak. [§9 JFR OldObjectSample: tìm leak không cần heap dump](#/docs/uh-14). [§10 Leak hay cache? Trong Spring Boot](#/docs/uh-14) cho câu hỏi tỉ lệ trúng cache và \`ConcurrentMapCacheManager\`.

**Bẫy.** Nghĩ "object lớn nhất trong histogram là thủ phạm". \`byte[]\` và \`String\` luôn đứng đầu; leak thường là hàng trăm nghìn object nhỏ — so hai thời điểm rồi nhìn retained size. Bẫy thứ hai: nghĩ lấy histogram là vô hại. \`GC.class_histogram\` chạy một Full GC trước khi đếm (188 ms ở heap 194 MB trong bài). Bẫy thứ ba: "thêm giới hạn cho cache là xong" — giới hạn chặn OOM, nhưng khoá sai thì tỉ lệ trúng vẫn 0%.

**Tự kiểm tra.** \`QuoteService\` có shallow size 32 byte nhưng retained 95,9 MB — vì sao? Đọc đường tới GC root của một \`Quote\` từ dưới lên: nó đi qua những gì để tới thread \`main\`, và hình dạng đó nói gì về leak trong ứng dụng Spring?`,
      },
      {
        id: "uh-w9-3",
        text: "Reference đặc biệt, ThreadLocal, direct buffer, buffer tạm NIO, Netty và FFM",
        lesson: `**Mục tiêu.** Vẽ được bản đồ RSS của một tiến trình Java và chỉ ra vùng nào \`-Xmx\` giới hạn, vùng nào chỉ GC dọn gián tiếp, vùng nào không có trần; giải thích bốn loại tham chiếu qua log GC; và biết vì sao Netty/Kafka client dùng RAM vượt \`-Xmx\`.

**Đọc.** [§2 Bản đồ bộ nhớ của một tiến trình Java](#/docs/uh-15) → [§3 Bốn loại tham chiếu, nhìn bằng log GC](#/docs/uh-15) → [§4 Cache bằng SoftReference: để GC quyết định hộ](#/docs/uh-15) → [§5 Finalization và Cleaner](#/docs/uh-15) (đọc kỹ hộp "Thứ tự ưu tiên để giải phóng tài nguyên") → [§6 ThreadLocal trong thread pool](#/docs/uh-15) → [§7 DirectByteBuffer: bộ nhớ native được dọn bởi GC](#/docs/uh-15) (cả đoạn glibc "free rồi mà RSS không giảm") → [§8 Thứ không metric nào đếm: buffer tạm của NIO (mẫu Kafka)](#/docs/uh-15) → [§9 Netty: arena, chunk và client đọc chậm](#/docs/uh-15) → [§10 FFM API: bộ nhớ native có vòng đời rõ ràng](#/docs/uh-15). Kết bằng phép cộng \`limits.memory\` ở [§11 Trong Spring Boot: ngân sách và quan sát](#/docs/uh-15).

**Bẫy.** Nghĩ \`jvm.buffer.memory.used\` cho biết hết bộ nhớ native. Nó báo 0 khi NIO đang giữ 192 MB buffer tạm và khi arena FFM giữ 1 000 MB — chỉ NMT và RSS thấy. Bẫy thứ hai: nghĩ \`-XX:+DisableExplicitGC\` là tối ưu vô hại. Nó tắt lưới an toàn của direct buffer (JDK gọi \`System.gc()\` khi chạm giới hạn), dẫn tới \`OutOfMemoryError: Cannot reserve … direct buffer memory\`. Bẫy thứ ba: "ThreadLocal tự dọn vì khoá là weak" — khoá weak nhưng giá trị strong; \`new ThreadLocal\` mỗi request là OOM.

**Tự kiểm tra.** \`MaxDirectMemorySize\` mặc định bằng bao nhiêu, và đặt heap 2 GB ngầm cho phép thêm bao nhiêu native? Vì sao soft cache trúng nhiều hơn LRU nhưng vẫn là lựa chọn tệ — nhìn vào 17 lần Full GC trong thí nghiệm §4?`,
      },
      {
        id: "uh-w9-4",
        text: "Ôn Chặng III: từ cách GC truy vết tới ngân sách bộ nhớ của một pod",
        lesson: `**Mục tiêu.** Tự lập trên một trang chuỗi quyết định cho một service trong pod — CPU limit → GC được chọn → \`-Xmx\` → phần ngoài heap → chỗ dự phòng — và với mỗi mắt xích nói được log/metric/công cụ nào kiểm chứng nó, không cần mở lại bài.

**Đọc.** Đọc lại sáu bảng "Ghép lại" của chặng theo thứ tự: [§11 Ghép lại](#/docs/uh-10) (truy vết từ root, thế hệ, write barrier, safepoint), [§10 Ghép lại](#/docs/uh-11) (region, mục tiêu pause, mixed GC, Evacuation Failure), [§11 Ghép lại](#/docs/uh-12), [§10 Ghép lại](#/docs/uh-13), [§11 Ghép lại](#/docs/uh-14), [§12 Ghép lại](#/docs/uh-15). Sau đó mở [§8 Memory limit: heap không phải là tất cả](#/docs/uh-13) và [§11 Trong Spring Boot: ngân sách và quan sát](#/docs/uh-15) để ghép phép cộng \`limits.memory\` của bài 13 với các vùng ngoài heap của bài 15.

**Bẫy.** Nghĩ "\`-Xmx\` là trần bộ nhớ của JVM". Bài 15 chỉ ra đó chỉ là trần của heap: direct memory mặc định thêm một lượng bằng \`-Xmx\`, buffer tạm NIO và arena FFM không có trần. Bẫy thứ hai: chọn ZGC cho mọi service vì "pause thấp nhất". Bài 13 đo ZGC trong pod 1 lõi cho công suất thấp nhất và RSS 389 MB — gấp 2,4 lần Serial cùng heap 256 MB; bài 12 nói rõ pause dưới 1 ms là lời hứa có điều kiện: đủ CPU và đủ chỗ dự phòng.

**Tự kiểm tra.** Pod \`limits.memory: 512Mi\` bị OOMKilled trong khi dashboard heap xanh — bạn kiểm tra theo thứ tự nào (exit code, NMT so với RSS, direct buffer, buffer tạm NIO, glibc), và mỗi bước dựa vào bài nào? Một pod 1 lõi, 1 GB có p99 xấu: vì sao bài 13 bảo xem tỉ lệ chu kỳ bị throttle trước khi nghĩ tới đổi GC?`,
      },
    ],
  },
  {
    id: "uh-w10",
    week: "Tuần 10",
    title: "Java Memory Model và synchronized",
    goal: "Chỉ ra được ba tầng có quyền đảo lệnh (javac, JIT, CPU) bằng thí nghiệm SB/MP và vòng lặp không dừng, lập luận theo happens-before để biết khi nào thread này chắc chắn thấy việc của thread kia, giải phẫu được DCL thiếu volatile; và giải thích được một lần synchronized tốn bao nhiêu từ mark word, lock-stack tới ObjectMonitor.",
    practice: "Giải nén sources/under-hood/src/bai16-litmus-src.zip, chạy lại vòng lặp chờ cờ (Loop.java) có và không có -XX:TieredStopAtLevel=1 để thấy JIT nào gây lỗi; tuỳ chọn tạo project từ archetype jcstress-java-test-archetype và chạy các mẫu BasicJMM_*. Với sources/under-hood/src/bai17-locks-src.zip: chạy MarkWord.java (thêm -XX:+UseCompactObjectHeaders), rồi ghi JFR dưới tải và xem `jfr view contention-by-site`.",
    resources: [
      { label: "JUH 16 — Java Memory Model", href: "#/docs/uh-16" },
      { label: "JUH 17 — synchronized và monitor bên trong HotSpot", href: "#/docs/uh-17" },
      { label: "jcstress (OpenJDK)", href: "https://github.com/openjdk/jcstress" },
    ],
    items: [
      {
        id: "uh-w10-1",
        text: "Ba tầng đảo lệnh: store buffer x86, JIT unroll và vòng lặp không bao giờ dừng",
        lesson: `**Mục tiêu.** Giải thích được quy tắc as-if-serial và vì sao JMM cố ý không mô tả phần cứng, rồi gán đúng thủ phạm cho từng kết quả "không thể" trong bài: store buffer của CPU (SB), JIT lập lịch lại sau unroll (MP), và phép biến đổi \`while (running)\` → \`if (running) while (true)\` của C2.

**Đọc.** [§2 Ba tầng có quyền sắp xếp lại lệnh của bạn](#/docs/uh-16) → [§3 Store buffer: khi chính CPU x86 đảo lệnh](#/docs/uh-16) → [§4 JIT đảo lệnh: bắt quả tang trong mã máy](#/docs/uh-16) → [§5 Vòng lặp không bao giờ dừng](#/docs/uh-16). Đọc kỹ mô hình TSO ở §3 và hộp "Đọc tần suất cho đúng"; ở §4 so hai bản sao của cùng dòng mã nguồn trong vòng lặp đã unroll; ở §5 so hai mã máy OSR chỉ khác đúng một chỗ, để ý log biên dịch cho thấy bản OSR của C2 xong chỉ 43 ms sau khi JVM khởi động, rồi đọc bảng các biến thể dừng/không dừng và hộp "Thêm dòng log vào là hết lỗi".

**Bẫy.** Nghĩ "x86 có memory model mạnh nên không cần lo". Bài cho thấy x86 vẫn đảo ghi→đọc (SB: 20 815 lần), còn JIT đảo mọi thứ khác bất kể CPU (MP: 67 lần, vòng lặp không dừng). Bẫy thứ hai: nghĩ thêm \`println\`/\`sleep\` là cách sửa. Vòng lặp dừng được chỉ vì JIT không nhìn xuyên lời gọi; JLS §17.3 nói rõ \`sleep\` không có ngữ nghĩa đồng bộ.

**Tự kiểm tra.** Trong thí nghiệm MP, phần cứng x86 không đảo hai lệnh đọc — vậy làm sao thread B thấy \`flag = 1, data = 0\`? Vì sao 20 815 trên 193 triệu lần là con số đáng lo dù tần suất chỉ khoảng 1/9 000 — tính thử với một service 5 000 request/giây? Trên x86, \`volatile\` chỉ cần thêm đúng một lệnh để chặn SB — lệnh gì, và vì sao chỉ cần một?`,
      },
      {
        id: "uh-w10-2",
        text: "Happens-before, volatile, VarHandle, final và double-checked locking",
        lesson: `**Mục tiêu.** Lập luận được bằng các cạnh happens-before (volatile, khoá, \`start\`/\`join\`, \`java.util.concurrent\`) và ngữ nghĩa \`final\`, biết \`volatile\` sinh lệnh gì trên x86 và tốn bao nhiêu, kể bốn cách safe publication, và trả lời câu hỏi của bài: vì sao DCL thiếu \`volatile\` hỏng.

**Đọc.** [§6 Happens-before: hợp đồng giữa bạn và JVM](#/docs/uh-16) — đọc kỹ định nghĩa data race và hộp "Happens-before không phải xảy ra trước theo đồng hồ". [§7 volatile bên trong: mã máy và cái giá](#/docs/uh-16) cho lệnh \`lock addl\` và thí nghiệm \`count++\`. [§8 Bốn mức truy cập của VarHandle](#/docs/uh-16) đọc lướt. [§9 final và safe publication](#/docs/uh-16) cho rào StoreStore cuối constructor và hộp bốn cách công bố an toàn. [§10 Double-checked locking: giải phẫu một lỗi kinh điển](#/docs/uh-16) — đọc kỹ biến thể "gán rồi mới load()". [§11 Trong Spring Boot: bean, cấu hình nóng và cờ dừng](#/docs/uh-16) cho năm quy tắc.

**Bẫy.** Nghĩ "\`volatile\` nghĩa là đọc thẳng từ RAM, bỏ qua cache". Bài chỉ ra cache các lõi đã được giao thức coherence giữ nhất quán; trên x86 đọc volatile là một \`mov\` bình thường — \`volatile\` là về thứ tự và việc cấm JIT bỏ lệnh. Bẫy thứ hai: "\`synchronized\` ở phía ghi là đủ". Khoá chỉ tạo cạnh HB với người cũng khoá; đường nhanh DCL đọc không khoá nên không được gì. Bẫy thứ ba: "đã \`volatile\` thì DCL nào cũng đúng" — gán rồi mới \`load()\` vẫn sai 138 nghìn lần.

**Tự kiểm tra.** Hai thread mỗi thread tăng một biến \`volatile\` 50 triệu lần — vì sao kết quả mất khoảng 35 triệu, và nên đổi sang gì? Một \`@Scheduled\` nạp lại bảng giá bằng \`clear()\` rồi \`putAll()\` trên field \`HashMap\`: bài chỉ ra ba lỗi chồng lên nhau nào, và cách sửa bằng snapshot bất biến ra sao?`,
      },
      {
        id: "uh-w10-3",
        text: "Mark word, lock-stack, ObjectMonitor và lịch sử biased locking",
        lesson: `**Mục tiêu.** Đọc được hai bit khoá trong mark word, mô tả fast path lightweight locking trên JDK 25 (một CAS, lock-stack tám ô) khác gì stack-locking của JDK 21, kể những gì làm khoá phình thành \`ObjectMonitor\`, và giải thích vì sao biased locking bị gỡ dù nó nhanh hơn.

**Đọc.** [§2 Mark word: 64 bit trên đầu mỗi object](#/docs/uh-17) → [§3 Xem tận mắt: một khoá đi qua các trạng thái](#/docs/uh-17) (so output JDK 25 với JDK 21, chú ý vị trí identity hash) → [§4 Fast path: một CAS và một ngăn xếp tám ô](#/docs/uh-17) (hai lệnh \`lock cmpxchg\` trong mã máy C2) → [§5 Khi khoá phình thành monitor](#/docs/uh-17) (cả hộp \`UseObjectMonitorTable\` và compact headers) → [§6 Lịch sử: biased locking và stack-locking](#/docs/uh-17) — đọc kỹ ba lý do của JEP 374 và hộp "JAVA_OPTS cũ có thể làm JVM không khởi động".

**Bẫy.** Nghĩ "mỗi \`synchronized\` là một system call / mutex của hệ điều hành". Đường nhanh chỉ là một CAS trong user space; chỉ khi phải park mới đụng tới hệ điều hành, và khoá trên object cục bộ bị JIT xoá hẳn. Bẫy thứ hai: "monitor phình rồi thì chậm mãi". Monitor không tranh chấp vẫn chỉ 12–20 ns, và thread nền sẽ thu hồi nó khi rảnh. Bẫy thứ ba: bật \`-XX:+UseBiasedLocking\` cho nhanh — trên JDK 21/25 là \`Unrecognized VM option\`, JVM không khởi động.

**Tự kiểm tra.** Ba tình huống nào làm một khoá nhanh phình thành monitor? Biased locking nhanh hơn 12 lần trong vòng lặp một thread — vậy cái giá của nó nằm ở đâu, liên quan gì tới safepoint/handshake?`,
      },
      {
        id: "uh-w10-4",
        text: "Chi phí khoá: không tranh chấp, tranh chấp, vùng găng trong service và virtual thread",
        lesson: `**Mục tiêu.** Trả lời được câu hỏi của bài "\`synchronized\` có thật sự chậm không" bằng ba tầng số liệu (micro-benchmark không tranh chấp, tranh chấp cực đoan, service có I/O), chẩn đoán được khoá nóng bằng thread dump và JFR, và biết khi nào thực sự nên chọn \`ReentrantLock\`.

**Đọc.** [§7 Không tranh chấp: synchronized tốn bao nhiêu?](#/docs/uh-17) → [§8 Có tranh chấp: khi thread phải xếp hàng](#/docs/uh-17) (đọc hộp "Đừng mang micro-benchmark này vào code thật") → [§9 Trong một service: vùng găng mới là thứ đắt](#/docs/uh-17) — đọc kỹ thí nghiệm 200 thread, vùng găng 50 µs, 16 khoá cho ×2,5, cùng phần "Nhìn thấy tranh chấp" và hộp "Một lần chụp không đủ" → [§10 Virtual thread và synchronized: trước và sau JDK 24](#/docs/uh-17) → [§11 synchronized hay ReentrantLock — và Spring Boot](#/docs/uh-17).

**Bẫy.** Nghĩ "nhiều thread BLOCKED nghĩa là cần thêm thread". Bài chỉ ra ngược lại: chúng đang xếp hàng trước một khoá, thêm thread chỉ làm hàng dài thêm. Bẫy thứ hai: "khoá công bằng an toàn hơn" — \`ReentrantLock(true)\` chậm hơn 560 lần khi nhiều thread hơn lõi; chỉ dùng khi thứ tự là yêu cầu nghiệp vụ. Bẫy thứ ba: bật virtual thread trên JDK 21–23 rồi tin code \`synchronized\` tự scale — chặn trong \`synchronized\` ghim carrier, 1 000 task thành song song 2.

**Tự kiểm tra.** Trong service mô phỏng, \`synchronized\` và \`ReentrantLock\` cho bao nhiêu req/s, và thay đổi nào mới thật sự tăng thông lượng? Cùng một khoá nóng, thread dump hiện \`synchronized\` và \`ReentrantLock\` ở hai trạng thái khác nhau nào, và ngưỡng mặc định của \`jdk.JavaMonitorEnter\` có thể che mất điều gì?`,
      },
    ],
  },
  {
    id: "uh-w11",
    week: "Tuần 11",
    title: "Safepoint, virtual thread và java.util.concurrent",
    goal: "Tìm được phần thời gian dừng mà log GC không ghi (time-to-safepoint, VM operation không do GC, log đồng bộ); quyết định có chủ đích khi nào virtual thread thắng và khi nào làm hệ thống chậm hơn; và trả lời được parallelStream/supplyAsync trong một request Spring chạy trên pool nào, chung với ai.",
    practice: "Với sources/under-hood/src/bai18-safepoint-src.zip: chạy Ttsp.java dưới Serial với -Xlog:gc,safepoint rồi sp.py, thêm -XX:+UseCountedLoopSafepoints -XX:LoopStripMiningIter=1000 và so tổng Reaching safepoint. Với bai19-vthreads-src.zip: chạy Srv + Load, dưới tải so `jcmd <pid> Thread.print` với `jcmd <pid> Thread.dump_to_file -format=json`. Với bai20-juc-src.zip: chạy mix.sh, đổi /enrich sang ?own=1.",
    resources: [
      { label: "JUH 18 — Thread, safepoint & stop-the-world", href: "#/docs/uh-18" },
      { label: "JUH 19 — Virtual threads mổ xẻ", href: "#/docs/uh-19" },
      { label: "JUH 20 — Bên trong java.util.concurrent", href: "#/docs/uh-20" },
      { label: "JEP 444: Virtual Threads", href: "https://openjdk.org/jeps/444" },
    ],
    items: [
      {
        id: "uh-w11-1",
        text: "Safepoint: poll, vòng lặp đếm, VM operation, handshake và log làm dài pause",
        lesson: `**Mục tiêu.** Giải thích được JVM không thể dừng thread từ bên ngoài mà chỉ chờ thread tự chạm poll, chỉ ra những đoạn mã máy Java không có poll, kể các VM operation không do GC cũng dừng cả JVM, và đi đủ ba bước từ "có vấn đề" tới đúng dòng code gây chờ.

**Đọc.** [§2 Thread Java là thread của hệ điều hành](#/docs/uh-18) → [§3 Safepoint: dừng mọi thread ở chỗ an toàn](#/docs/uh-18) → [§4 Thời gian đi đâu: bắt quả tang trong log](#/docs/uh-18) (2,5 ms trong log GC so với 1 175 ms đứng yên) → [§5 Vòng lặp không có poll](#/docs/uh-18) — đọc kỹ vì sao Serial/Parallel không đặt poll vào counted loop còn G1/ZGC/Shenandoah thì có → [§6 Những đoạn code khác không dừng được](#/docs/uh-18) → [§7 Stop-the-world không do GC](#/docs/uh-18) → [§8 Handshake: chỉ dừng một thread](#/docs/uh-18) → [§9 Khi chính việc ghi log làm dài pause](#/docs/uh-18) → [§10 Đo và tìm thủ phạm](#/docs/uh-18). Ghép với pod nhỏ ở [§11 Trong Spring Boot và container](#/docs/uh-18).

**Bẫy.** Nghĩ "code JNI chạy lâu làm GC chờ". Bài chỉ ra ngược lại: thread in_native được coi là an toàn ngay; thủ phạm là mã máy Java lâu không chạm poll. Bẫy thứ hai: đổi biến chạy sang \`long\` là có poll — với Serial vẫn chờ 1 186 ms; dùng G1 hoặc bật hai cờ. Bẫy thứ ba: coi thread dump, heap dump là vô hại — 434 ms và 2,5 s đứng yên toàn JVM với 2 000 thread / 1,5 GB heap.

**Tự kiểm tra.** Pause 5 ms thành 911 ms khi đích ghi log chậm — dấu hiệu nào trong \`gc+phases\` cho biết thời gian đã đi vào việc ghi log, và \`-Xlog:async\` đổi điều gì? Ba công cụ của §10 lần lượt trả lời ba câu hỏi nào?`,
      },
      {
        id: "uh-w11-2",
        text: "Virtual thread: continuation, nơi thắng và bốn cách làm hệ thống chậm hơn",
        lesson: `**Mục tiêu.** Giải thích được virtual thread là continuation chạy trên vài carrier, chỉ unmount ở thao tác chặn mà JDK đã viết lại; tính được bằng định luật Little khi nào nó thắng pool 200 thread; và nhận diện bốn tình huống nó thua: việc CPU, tài nguyên có hạn phía sau, \`ThreadLocal\` làm cache, ghim carrier.

**Đọc.** [§2 Bên trong một virtual thread](#/docs/uh-19) → [§3 Rẻ tới mức nào](#/docs/uh-19) → [§4 Nơi virtual thread thắng: chờ I/O](#/docs/uh-19) (đọc cả hộp "Một cái bẫy của chính phép đo") → [§5 Chậm hơn #1: việc CPU — không ai chia lượt](#/docs/uh-19) → [§6 Chậm hơn #2: tài nguyên có hạn — hàng đợi đổi chỗ](#/docs/uh-19) → [§7 Chậm hơn #3: ThreadLocal làm cache](#/docs/uh-19) → [§8 Chậm hơn #4: ghim carrier](#/docs/uh-19) — đọc kỹ thí nghiệm FIFO với 500 virtual thread và thay đổi JDK-8329593 ở JDK 23.

**Bẫy.** Nghĩ "virtual thread làm code nhanh hơn". Bài chỉ ra nó chỉ cho phép nhiều việc chờ cùng lúc hơn; một request vẫn mất đúng thời gian của nó (p50 50 ms ở cả hai mô hình), và nghẽn ở DB thì vẫn 500 rps, cộng thêm lỗi timeout. Bẫy thứ hai: "JDK 24 hết pinning". Hết với \`synchronized\` (JEP 491); còn native frame, khởi tạo class, và file I/O chặn — trên JDK 23+ còn không được bù carrier. Bẫy thứ ba: pool virtual thread như platform thread — chúng được thiết kế để dùng một lần; giới hạn đồng thời bằng \`Semaphore\`.

**Tự kiểm tra.** Với pool 200 thread và downstream 50 ms, trần lý thuyết là bao nhiêu rps? Vì sao request \`/fast\` có p99 nhảy từ 5,7 ms lên 364 ms khi chạy chung carrier với \`/cpu\`, dù tác vụ CPU lại xong nhanh hơn?`,
      },
      {
        id: "uh-w11-3",
        text: "Structured concurrency, quan sát virtual thread, AQS, ConcurrentHashMap và ForkJoinPool",
        lesson: `**Mục tiêu.** Biết cách quan sát một service chạy virtual thread (dump JSON, JFR, metric nào mất ý nghĩa) và dùng \`StructuredTaskScope\`/\`ScopedValue\`; rồi đọc được ba khối xây dựng của \`java.util.concurrent\`: AQS (một \`int state\` + hàng đợi park), \`ConcurrentHashMap\` (khoá từng ô), \`ForkJoinPool\` (deque mỗi worker, work stealing).

**Đọc.** [§9 Structured concurrency và ScopedValue](#/docs/uh-19) → [§10 Quan sát virtual thread](#/docs/uh-19) → [§11 Trong Spring Boot](#/docs/uh-19) (danh sách kiểm tra trước khi bật \`spring.threads.virtual.enabled\`). Sau đó [§2 Bản đồ java.util.concurrent](#/docs/uh-20) → [§3 AQS: một số nguyên và một hàng đợi](#/docs/uh-20) (mutex 12 dòng ngang \`ReentrantLock\`) → [§4 ConcurrentHashMap: khoá từng ô](#/docs/uh-20) — đọc kỹ thí nghiệm \`computeIfAbsent\` với loader chậm 1 giây → [§5 ForkJoinPool: ăn trộm việc](#/docs/uh-20), chú ý đoạn thread ngoài pool gọi \`parallelStream()\` tự làm phần việc gốc.

**Bẫy.** Nghĩ "thread dump cho thấy request đang kẹt ở đâu". \`Thread.print\` không thấy virtual thread đang chờ: 25 so với 663 thread; phải dùng \`Thread.dump_to_file -format=json\`. Bẫy thứ hai: "\`ConcurrentHashMap\` không bao giờ chặn". \`get\` không chặn, nhưng \`put\`/\`compute\` chặn nhau trong cùng một ô — \`put(33)\` chờ 876 ms; và \`computeIfAbsent\` làm cache thì loader chạy trong khoá ô, không được đệ quy, không có hết hạn — dùng Caffeine.

**Tự kiểm tra.** Khi bật virtual thread, \`jvm.threads.live\` báo 12 trong khi 800 request đang chạy — bài khuyên theo dõi gì thay thế? Với \`Future.get()\` lần lượt và với scope, lỗi ở một nhánh được thấy sau bao lâu, và nhánh còn lại ra sao?`,
      },
      {
        id: "uh-w11-4",
        text: "commonPool, CompletableFuture chạy ở đâu và parallelStream trong một request",
        lesson: `**Mục tiêu.** Trả lời được câu hỏi của bài: \`parallelStream()\` trong một request Spring chạy trên thread Tomcat cộng \`ForkJoinPool.commonPool()\` — pool tĩnh CPU − 1 worker dùng chung cả JVM; nêu ba quy tắc "CompletableFuture chạy ở đâu", và tính bằng định luật Little ngưỡng sụp của commonPool khi có ai đưa việc chặn vào đó.

**Đọc.** [§6 commonPool: một pool cho cả JVM](#/docs/uh-20) — đọc kỹ cách tính kích thước từ CPU JVM thấy (nối lại [Bài 13](#/docs/uh-13)) và danh sách những thứ dùng chung nó. [§7 CompletableFuture chạy ở đâu?](#/docs/uh-20) — đọc kỹ ngoại lệ đã đổi ở JDK 25 và phép tính 2 rps × 3 lời gọi × 0,3 s. [§8 Trả lời câu hỏi: parallelStream trong một request](#/docs/uh-20) cho p99 \`/search\` 13,6 ms → 11 101 ms và bảng "máy 8 CPU". [§9 Trong Spring Boot: pool nào của ai](#/docs/uh-20) cho năm việc nên làm. Chốt bằng [§10 Ghép lại](#/docs/uh-20).

**Bẫy.** Nghĩ "\`supplyAsync\` tạo thread mới". Chỉ đúng trên JDK ≤ 24 khi commonPool có ≤ 1 worker; từ JDK 25 nó luôn xếp hàng trong commonPool — nên service bọc I/O trong \`supplyAsync\` trên pod 2 CPU đi từ 305 ms lên 6,5 s khi nâng 21 → 25. Bẫy thứ hai: "commonPool tự thêm thread khi worker bị chặn". Chỉ khi chờ qua \`ForkJoinPool.managedBlock\`; \`Thread.sleep\`, socket, JDBC thì không — 1 worker vẫn là 1. Bẫy thứ ba: "thêm \`.parallel()\` là nhanh hơn" — trên server đang tải, cái giá trả ở đuôi khi có người dùng chung.

**Tự kiểm tra.** Pod \`limits.cpu: 2\` có bao nhiêu worker commonPool? Vì sao đặt \`-Djava.util.concurrent.ForkJoinPool.common.parallelism=16\` chỉ là thuốc giảm đau, và sửa đúng là truyền gì vào \`supplyAsync\`?`,
      },
    ],
  },
  {
    id: "uh-w12",
    week: "Tuần 12",
    title: "Ngôn ngữ dưới lớp vỏ: indy, generics, proxy, exception",
    goal: "Đọc được bằng javap và -Xlog:class+load những gì javac và framework sinh ra cho lambda, nối chuỗi, record, generics, sealed/pattern switch, proxy Spring và exception — và nói được cái giá cụ thể của mỗi thứ: lần đầu (liên kết, hidden class) hay mỗi lần chạy (chụp stack, gọi qua proxy).",
    practice: "Chạy service với -Xlog:class+load:file=cl.txt tới khi sẵn sàng, đếm `$$Lambda` và `String$$StringConcat`; từ các zip trong sources/under-hood/src/: chạy Alloc (bai21-indy-src.zip) có/không -XX:-DoEscapeAnalysis, thí nghiệm sealed/ build lệch (bai22-generics-src.zip) để thấy MatchException, ReflBench (bai23-proxy-src.zip), và FastThrow (bai24-exception-src.zip) với rồi không -XX:-OmitStackTraceInFastThrow.",
    resources: [
      { label: "JUH 21 — invokedynamic: lambda, nối chuỗi, record", href: "#/docs/uh-21" },
      { label: "JUH 22 — Generics, record, sealed, pattern matching dưới bytecode", href: "#/docs/uh-22" },
      { label: "JUH 23 — Reflection, MethodHandle, Proxy", href: "#/docs/uh-23" },
      { label: "JUH 24 — Exception & stack trace: chi phí thật", href: "#/docs/uh-24" },
    ],
    items: [
      {
        id: "uh-w12-1",
        text: "invokedynamic: LambdaMetafactory, StringConcatFactory, ObjectMethods và AOT cache",
        lesson: `**Mục tiêu.** Trả lời chính xác "lambda có tạo class mới mỗi lần gọi không" (một hidden class mỗi call site, một lần), phân biệt lambda bắt biến và không bắt biến về cấp phát, giải thích nối chuỗi và \`record\` cũng là indy, và biết AOT cache trả trước phần chi phí liên kết nào.

**Đọc.** [§2 invokedynamic: lời gọi tự quyết định gọi ai](#/docs/uh-21) — đọc output \`javap\` theo bốn điểm → [§3 Lambda: LambdaMetafactory và hidden class](#/docs/uh-21) (hai nhánh hằng số/constructor) → [§4 Trả lời câu hỏi: lambda tạo gì, và khi nào](#/docs/uh-21) → [§5 Cái giá lần đầu: liên kết 1 000 lambda](#/docs/uh-21) → [§6 Nối chuỗi: StringConcatFactory](#/docs/uh-21) (760 hình dạng → 760 class) → [§7 Record: ObjectMethods](#/docs/uh-21) → [§8 AOT cache: trả trước cái giá liên kết](#/docs/uh-21), đọc kỹ hộp "Hai điều kiện để cache có tác dụng". Lướt [§9 Trong Spring Boot](#/docs/uh-21).

**Bẫy.** Nghĩ "lambda là cú pháp ngắn của anonymous class". Không có file \`.class\` nào; thân lambda là private method trong class của bạn, class implement interface được sinh lúc chạy dưới dạng hidden class. Bẫy thứ hai: "hai lambda giống nhau dùng chung class" — mỗi call site một class, kể cả khi viết giống hệt. Bẫy thứ ba: "\`equals\` của record chậm vì dùng reflection" — \`ObjectMethods\` ghép MethodHandle một lần, sau đó JIT inline như code viết tay.

**Tự kiểm tra.** Lambda bắt biến cấp phát bao nhiêu byte mỗi lần khi thông dịch và sau khi C2 inline được, nhờ tối ưu nào? Vì sao \`-XDstringConcat=inline\` không phải lời khuyên để giảm thời gian khởi động, và bài gợi ý cách nào thay thế?`,
      },
      {
        id: "uh-w12-2",
        text: "Type erasure, Signature, bridge method, TypeReference, sealed và SwitchBootstraps",
        lesson: `**Mục tiêu.** Chỉ ra được generic còn sống ở đâu trong class file (attribute \`Signature\` trên khai báo) và mất ở đâu (descriptor, bytecode thực thi, object), trả lời "vì sao Jackson cần \`TypeReference\`", và giải thích \`switch\` trên pattern là indy \`typeSwitch\` cộng một \`default\` ngầm ném \`MatchException\`.

**Đọc.** [§2 Type erasure: generic biến đi đâu](#/docs/uh-22) (heap pollution, lỗi nổ ở chỗ đọc) → [§3 Signature: nơi generic còn sống](#/docs/uh-22) → [§4 Bridge method: cây cầu javac tự xây](#/docs/uh-22) → [§5 Trả lời câu hỏi: vì sao Jackson cần TypeReference](#/docs/uh-22) — đọc kỹ năm cách truyền kiểu → [§6 Record và sealed trong class file](#/docs/uh-22) → [§7 switch trên pattern: SwitchBootstraps](#/docs/uh-22) (JDK 21 combinator so với hidden class \`$$TypeSwitch\` từ JDK 22, bảng JMH) → [§8 Biên dịch tách rời: MatchException](#/docs/uh-22). Lướt hộp năm điểm ở [§9 Trong Spring Boot](#/docs/uh-22).

**Bẫy.** Nghĩ "bọc \`TypeReference\` vào method generic là xong". Bên trong \`<T> List<T> getList(…)\`, \`T\` không được thay bằng kiểu thật, kết quả là \`LinkedHashMap\`. Bẫy thứ hai: "switch đầy đủ trên sealed không bao giờ rơi vào default" — rơi khi lớp con mới xuất hiện mà switch chưa biên dịch lại, ném \`MatchException\`, không cảnh báo lúc build hay khởi động. Bẫy thứ ba: "pattern matching chậm hơn gọi method ảo" — với bốn loại trộn, \`switch\` nhanh gấp đôi lời gọi ảo megamorphic nhưng chậm hơn chuỗi \`instanceof\` khoảng hai lần.

**Tự kiểm tra.** Vì sao \`@RequestBody List<Order>\` trong controller chạy được mà không cần \`TypeReference\`? Reflection thấy hai method \`compareTo\` trên một class implement \`Comparable<Name>\` — method thứ hai là gì, và code quét annotation phải lọc bằng gì?`,
      },
      {
        id: "uh-w12-3",
        text: "Method.invoke, MethodHandle, JDK proxy, proxy lớp con và self-invocation",
        lesson: `**Mục tiêu.** Trả lời câu hỏi của bài: gọi method \`@Transactional\` từ chính class đó là \`aload_0; invokevirtual\` trên \`this\` là target, không đi qua proxy; phân biệt JDK dynamic proxy với proxy lớp con kiểu CGLIB, giải thích vì sao method \`final\`/\`private\` không được chặn, và vì sao \`@Configuration\` lại cố ý chặn được self-invocation.

**Đọc.** [§2 Method.invoke bên trong](#/docs/uh-23) (JDK 17 inflation sau 15 lần so với JEP 416) → [§3 MethodHandle và cái giá của hằng số](#/docs/uh-23) — đọc kỹ bảng sáu cách gọi → [§4 JDK dynamic proxy: một class sinh lúc chạy](#/docs/uh-23) → [§5 Proxy lớp con: cách của CGLIB](#/docs/uh-23) (\`DefaultAopProxyFactory\`, \`proxyTargetClass\` mặc định của Spring Boot, \`MiniCglib\`) → [§6 Trả lời câu hỏi: self-invocation trong bytecode](#/docs/uh-23) → [§7 final, private và những field null](#/docs/uh-23) → [§8 @Configuration: khi lớp con gọi super](#/docs/uh-23). Đọc năm cách sửa xếp theo mức nên dùng ở [§9 Trong Spring Boot](#/docs/uh-23).

**Bẫy.** Nghĩ "bean implement interface thì là JDK proxy". Trong Spring Boot mặc định là proxy lớp con (\`proxy-target-class=true\`). Bẫy thứ hai: "\`@Transactional\` trên method private chỉ là thừa" — nó bị bỏ qua hoàn toàn, im lặng; với \`final\` còn tệ hơn: method chạy trên chính object proxy được tạo không qua constructor, nên có thể NPE. Bẫy thứ ba: "JDK mới thì reflection nhanh hơn mọi trường hợp" — \`Method\` giữ trong field thường thì JDK 25 chậm hơn JDK 17 hơn hai lần.

**Tự kiểm tra.** Giữ \`Method\` trong \`static final\` cho bao nhiêu ns so với khi không phải hằng số trên JDK 25, và vì sao? \`@Configuration(proxyBeanMethods = false)\` đổi điều gì khi \`orderSvc()\` gọi \`repo()\`?`,
      },
      {
        id: "uh-w12-4",
        text: "Chi phí exception, OmitStackTraceInFastThrow, StackWalker và đọc stack trace production",
        lesson: `**Mục tiêu.** Tách được chi phí exception thành từng tầng (tạo object, chụp stack, ném/unwind, dựng \`StackTraceElement\`, định dạng), trả lời "vì sao NPE trong log không có stack trace" bằng cơ chế exception dựng sẵn của C2, và biết những công cụ đếm exception nào bị nó làm mù.

**Đọc.** [§2 Một exception được tạo ra thế nào](#/docs/uh-24) → [§3 Chi phí theo độ sâu stack](#/docs/uh-24) — đọc kỹ "Bốn điều đọc ra" → [§4 Exception làm luồng điều khiển](#/docs/uh-24) (\`parseInt\` trong \`try\`, \`writableStackTrace = false\`) → [§5 Trả lời câu hỏi: OmitStackTraceInFastThrow](#/docs/uh-24) — đọc kỹ năm loại exception ngầm và \`GraphKit::builtin_throw\` → [§6 Những exception không ai đếm](#/docs/uh-24) (JFR thấy 14 019 / 100 000; \`throttle = 100/s\` ở JDK 25) → [§7 StackWalker: đọc stack mà không tạo exception](#/docs/uh-24) → [§8 Đọc một stack trace production](#/docs/uh-24). Kết bằng năm việc ở [§9 Trong Spring Boot](#/docs/uh-24).

**Bẫy.** Nghĩ "\`throw\` là thứ đắt". Chụp stack và định dạng nó mới đắt; exception không ghi stack chỉ 20 ns, như một object thường. Bẫy thứ hai: "NPE không stack trace là do logger cấu hình sai" — thường là C2 thay bằng object dựng sẵn; lần ném đầu vẫn có đủ stack và helpful NPE message. Bẫy thứ ba: "\`... 42 more\` là stack bị mất" — đó là 42 frame trùng với exception bao ngoài, chỉ được rút gọn.

**Tự kiểm tra.** Kiểm tra chuỗi số bằng \`Integer.parseInt\` trong \`try\` chậm bao nhiêu lần ở độ sâu stack 10 và 150, và vì sao unit test không lộ ra? Vì sao bỏ \`%L\`/\`%M\` khỏi pattern log production, và \`StackWalker\` khác \`Thread.currentThread().getStackTrace()\` thế nào khi stack sâu dần?`,
      },
    ],
  },
  {
    id: "uh-w13",
    week: "Tuần 13",
    title: "Bộ đồ nghề chẩn đoán, capstone và tổng ôn series",
    goal: "Chẩn đoán được một pod đang chạy mà không restart — biết lệnh jcmd/JFR nào rẻ, lệnh nào dừng JVM, cái gì không bật được lúc chạy — và tự đi được quy trình \"2 giờ sáng\" từ hình dạng biểu đồ tới nguyên nhân cho ba kịch bản CPU cao, latency spike định kỳ, OOMKilled khi heap còn trống.",
    practice: "Giải nén sources/under-hood/src/bai25-toolbox-src.zip, chạy tools/diag.sh trên Shop rồi tự sửa ba lỗi và chạy lại để thấy profile đổi; tuỳ chọn tạo flame graph bằng async-profiler (`asprof -d 30 -f flamegraph.html <pid>`) hoặc JMC. Với bai26-capstone-src.zip: một người chạy tools/kb1.sh, kb2.sh hoặc kb3.sh, người kia chỉ được xem biểu đồ CPU/p99/bộ nhớ và dùng jcmd.",
    resources: [
      { label: "JUH 25 — Bộ đồ nghề: jcmd, JFR, JMC, async-profiler, NMT", href: "#/docs/uh-25" },
      { label: "JUH 26 — Capstone: điều tra sự cố Spring Boot production", href: "#/docs/uh-26" },
      { label: "async-profiler", href: "https://github.com/async-profiler/async-profiler" },
    ],
    items: [
      {
        id: "uh-w13-1",
        text: "jcmd qua Attach API, giá của từng lệnh và JFR luôn bật",
        lesson: `**Mục tiêu.** Giải thích được Attach API hoạt động thế nào (file \`.attach_pid\`, \`SIGQUIT\`, UNIX socket trong \`/tmp\`) và ba điều kiện để \`jcmd\` gắn được vào JVM trong container; xếp được các lệnh theo giá phía service (đo bằng \`-Xlog:safepoint\`); và điều khiển trọn vòng đời một bản ghi JFR qua \`jcmd\`, kể cả hai tính năng mới của JDK 25.

**Đọc.** [§2 jcmd: một cửa vào JVM đang chạy](#/docs/uh-25) — đọc kỹ "ba hệ quả thực tế" về cùng user, cùng \`/tmp\`, PID namespace. [§3 Mỗi lệnh tốn bao nhiêu](#/docs/uh-25) cho bảng pause của \`Thread.print\`, bản JSON, \`GC.class_histogram\`, \`GC.heap_dump\`. [§4 JFR: máy ghi hình luôn bật](#/docs/uh-25) — đọc kỹ CPU-time profiling (JEP 509), method timing & tracing (JEP 520) và cách đọc đúng con số overhead theo tuyệt đối thay vì phần trăm.

**Bẫy.** Nghĩ "muốn profile phải restart với cờ JFR". \`jcmd JFR.start\` chạy được trên JVM khởi động không có JFR. Bẫy thứ hai: "thread dump là miễn phí" — \`Thread.print\` dừng 18 ms với 63 thread và tăng theo số thread; bản JSON không dừng gì. Bẫy thứ ba: "jcmd không chạy được trong container" — chạy được nếu cùng user và chung PID namespace; image thiếu jcmd thì dùng \`kubectl debug --target\`.

**Tự kiểm tra.** Gắn \`jcmd\` từ một container tạm tạo bằng \`kubectl debug\` cần đủ ba điều kiện nào? Overhead của JFR \`profile\` trên \`Shop\` trông như +12–25% — vì sao bài nói con số đúng là 1–2,5% một lõi? Khi service đang có tải, bài khuyên thứ tự lệnh nào từ rẻ tới đắt?`,
      },
      {
        id: "uh-w13-2",
        text: "Đọc profile, flame graph, NMT và quy trình chẩn đoán một pod không restart",
        lesson: `**Mục tiêu.** Dùng \`jfr view\` để trả lời bốn câu hỏi CPU đi đâu, ai cấp phát, ai giữ khoá, cái gì đang lớn lên; đọc được một flame graph; dùng NMT baseline/diff để tìm bộ nhớ ngoài heap đang tăng; và thuộc bảng "cái gì làm được không restart, cái gì không".

**Đọc.** [§5 Đọc profile: CPU, cấp phát, khoá, rò rỉ](#/docs/uh-25) — đọc kỹ đoạn hai cách lấy mẫu CPU không đồng ý về tỉ lệ, đoạn "Khoá: coi chừng ngưỡng", và phép so hai histogram. [§6 Flame graph](#/docs/uh-25) cho JMC, async-profiler và lưu ý \`perf_event_open\` bị seccomp chặn trong container. [§7 NMT và bộ nhớ ngoài heap](#/docs/uh-25) cho \`summary.diff\`. [§8 Trả lời câu hỏi: chẩn đoán một pod không restart](#/docs/uh-25) — đọc kỹ khối lệnh 0–5 và bảng cờ manageable. Lướt [§9 Trong Spring Boot](#/docs/uh-25) cho cờ "hộp đen" nên có sẵn.

**Bẫy.** Nghĩ "không thấy sự kiện khoá trong JFR nghĩa là không có tranh chấp". Cấu hình mặc định bỏ qua lần chờ dưới 10–20 ms; hạ ngưỡng thì thấy 661 lần, trung bình 16 ms. Bẫy thứ hai: "heap dump là cách đầu tiên để tìm rò rỉ" — hai histogram rẻ hơn nhiều và thường đủ chỉ ra kiểu object đang lớn lên. Bẫy thứ ba: định bật NMT khi sự cố đã xảy ra — NMT không bật được lúc đang chạy, phải có \`-XX:NativeMemoryTracking=summary\` từ đầu.

**Tự kiểm tra.** Hai histogram cách nhau 33 giây cho +20,6 MB \`byte[]\` — phép tính nào xác nhận con số đó khớp với lỗi rò 20 KB mỗi request? Trong bảng §8, những thứ nào không làm được mà không restart, và vì sao?`,
      },
      {
        id: "uh-w13-3",
        text: "Capstone: CPU cao sau deploy, latency spike định kỳ, OOMKilled khi heap còn trống",
        lesson: `**Mục tiêu.** Đi được ba cuộc điều tra từ hình dạng biểu đồ tới nguyên nhân — bậc thang tại mốc deploy, răng cưa có chu kỳ, dốc lên không đi xuống — và với mỗi bước nói được công cụ nào, vì sao nó rẻ hơn bước sau, và bước nào đã không tìm ra gì.

**Đọc.** [§1 Ba sự cố, một quy trình](#/docs/uh-26) (chú ý chi tiết \`Using Serial\` vì giới hạn dưới 1 792 MB) → [§2 Kịch bản 1: CPU cao sau deploy](#/docs/uh-26) → [§3 Điều tra kịch bản 1](#/docs/uh-26) — đọc kỹ bước 4 xác nhận \`(.*?,){11}\` tốn thời gian tăng theo số cột → [§4 Kịch bản 2: latency spike định kỳ](#/docs/uh-26) → [§5 Điều tra kịch bản 2](#/docs/uh-26) — đọc kỹ vì sao chỉ 1/10 thread dump bắt được khoảnh khắc và JFR \`jdk.JavaMonitorEnter\` hạ ngưỡng 1 ms gom thành cụm cách 15 giây → [§6 Kịch bản 3: OOMKilled khi heap còn trống](#/docs/uh-26) → [§7 Điều tra kịch bản 3](#/docs/uh-26) — đọc kỹ ba con số NMT/RSS/cgroup và kmem → [§8 Trả lời câu hỏi: bắt đầu từ đâu lúc 2 giờ sáng](#/docs/uh-26). Đối chiếu code Spring thật ở [§9 Trong Spring Boot](#/docs/uh-26).

**Bẫy.** Nghĩ "restart trước, điều tra sau". Restart xoá đúng trạng thái cần xem; chụp 60 giây bằng chứng trên một pod trước. Bẫy thứ hai: "latency spike thì xem log GC" — ở kịch bản 2 GC chỉ góp một phần (cụm ở giây 59), thủ phạm chính là khoá của một job định kỳ. Bẫy thứ ba: "OOMKilled nghĩa là heap đầy" — ở kịch bản 3 heap ổn (85 MB trong trần 128 MB); thread, native và kernel memory làm đầy cgroup, nên heap dump sẽ không tìm thấy gì.

**Tự kiểm tra.** Tên thread \`pool-N-thread-M\` với N tăng tới 300 trong 15 giây ở 20 rps nói lên điều gì, và \`ExecutorService\` từ JDK 19 cho cách sửa nào? Vì sao p99 15,2 ms của bản lỗi ở kịch bản 3 khiến alert theo latency im lặng suốt 90 giây, và nên cảnh báo trên metric nào?`,
      },
      {
        id: "uh-w13-4",
        text: "Tổng ôn series: sáu chặng trên một trang",
        lesson: `**Mục tiêu.** Tự viết lại trên một trang bảng sáu chặng × "điều cần mang theo" × "công cụ kiểm chứng", rồi với mỗi kịch bản của capstone chỉ ra được bài nào của chặng nào đã cho bạn mảnh ghép quyết định — đủ để dùng làm runbook on-call mà không cần mở lại series.

**Đọc.** [§10 Cả series trên một trang](#/docs/uh-26) trước — đọc kỹ cột "Xuất hiện trong bài này". Rồi đối chiếu với bản đồ ở [Lộ trình series](#/docs/uh-00) và lướt lại các bảng "Ghép lại" làm khung cho từng chặng: Chặng I [§12 Ghép lại](#/docs/uh-01) và [§9 Ghép lại: giải phẫu vụ OOMKilled](#/docs/uh-04); Chặng II [§12 Ghép lại](#/docs/uh-08) và [§12 Ghép lại](#/docs/uh-09); Chặng III [§11 Ghép lại](#/docs/uh-14) và [§12 Ghép lại](#/docs/uh-15); Chặng IV [§12 Ghép lại](#/docs/uh-18) và [§10 Ghép lại](#/docs/uh-20); Chặng V [§10 Ghép lại](#/docs/uh-21) và [§10 Ghép lại](#/docs/uh-24); Chặng VI [§10 Ghép lại](#/docs/uh-25).

**Bẫy.** Nghĩ "một thread dump là đủ". Capstone cho thấy một lần chụp chỉ là một khoảnh khắc — chín trên mười bản dump ở kịch bản 2 trông hoàn toàn bình thường; cần nhiều lần chụp hoặc JFR cho cả khoảng thời gian. Bẫy thứ hai: "regex trong Java an toàn rồi" — engine đã chặn nhiều mẫu kinh điển, nhưng \`(.*?,){11}\` vẫn tốn hàng trăm ms tới hàng giây trên dòng dữ liệu xấu.

**Tự kiểm tra.** Với từng kịch bản trong ba kịch bản capstone, chặng nào của series giải thích cơ chế gốc (ví dụ kịch bản 2: Chặng III vì SerialGC Full GC, Chặng IV vì khoá của job định kỳ)? Viết quy trình §8 thành runbook của đội: lệnh \`kubectl debug\`, chỗ lưu file JFR, và bốn đường biểu đồ bước ② phải có sẵn trên dashboard là gì?`,
      },
    ],
  },
];
