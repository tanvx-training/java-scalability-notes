// Ngân hàng câu hỏi phỏng vấn Java Under the Hood — PHẦN 2/2: uh-iq13–uh-iq24,
// 3 chủ đề (Concurrency · Ngôn ngữ dưới lớp vỏ · Quan sát & chẩn đoán) × 4 cấp độ.
// Phần 1 (uh-iq01–uh-iq12) nằm ở interview-part1.js.
//
// Nguồn: series tiếng Việt “Java Under the Hood” (Bản thẩm định · Tháng 10/2026, JDK 25 LTS / 27)
// — bài 16–26 trong sources/under-hood/. Mọi con số trong rubric là số đo của chính series.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng DDIA / PG:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (uh-iq13–uh-iq24) — tiến độ localStorage lưu theo id này.

export const uhInterviewPart2 = [
  // ===== uh-conc (uh-iq13–uh-iq16) =====
  {
    id: "uh-iq13",
    field: "under-hood",
    topic: "uh-conc",
    level: 1,
    minutes: 5,
    question:
      "Một codebase cũ có singleton lười viết theo kiểu double-checked locking: kiểm tra instance == null, vào synchronized, kiểm tra lại, rồi gán instance = new Config() — field instance KHÔNG có volatile. Nó chạy production nhiều năm chưa lỗi lần nào. Giải thích theo Java Memory Model vì sao đoạn code này vẫn sai, volatile sửa được chính xác điều gì, và có những cách lazy init nào đúng.",
    mustCover: [
      "Đường nhanh (lần kiểm tra thứ nhất, không khoá) đọc instance mà không có cạnh happens-before nào với constructor: khoá chỉ tạo cạnh từ lần mở khoá tới lần khoá sau của cùng monitor, người đọc không khoá không được gì",
      "Dòng gán instance = new Config() là một chuỗi lệnh ghi vào các ô nhớ khác nhau (field của object, rồi tham chiếu); JIT được lập lịch lại và CPU yếu như ARM được ghi ra theo thứ tự khác, nên thread khác có thể thấy tham chiếu khác null trước khi thấy các field",
      "Với volatile, lệnh gán trở thành ghi volatile: mọi lệnh ghi đứng trước nó, kể cả thân constructor, không được dời ra sau, và lần đọc nào thấy khác null đều có đường happens-before từ constructor — bản sửa này chỉ đúng từ Java 5 (JSR-133)",
      "Trên x86 + HotSpot hiện tại lỗi cực hiếm (series không bắt được trong khoảng 1,5 tỷ lần thử) nhưng jcstress ghi nhận object thiếu field trên cả x86_64 và AArch64 — không lỗi hôm nay không có nghĩa là đúng",
      "volatile chỉ công bố những gì ghi TRƯỚC lần gán: biến thể gán instance rồi mới gọi load() vẫn sai (138 098 lần thấy port = 0); cách đúng: holder class, DCL + volatile + biến cục bộ, hoặc để Spring quản lý như một @Bean",
    ],
    model:
      "JLS chương 17 không hứa thứ tự; nó hứa một quan hệ duy nhất là happens-before: nếu lần ghi W happens-before lần đọc R của cùng biến thì R chắc chắn thấy W. Các cạnh của quan hệ đó là thứ tự trong cùng một thread, ghi volatile tới các lần đọc sau, mở khoá tới lần khoá sau của cùng monitor, Thread.start, join, và các lớp java.util.concurrent. Double-checked locking thiếu volatile hỏng vì đường nhanh của nó — lần kiểm tra instance == null đầu tiên — không chạm vào khoá, nên không có cạnh nào nối nó với constructor. synchronized ở phía ghi không cứu được: khoá chỉ đồng bộ những ai cũng khoá. Trong khi đó dòng instance = new Config() không phải một thao tác mà là một chuỗi lệnh ghi: cấp phát, ghi các field trong constructor, rồi ghi tham chiếu vào instance. Hai lệnh ghi 'ghi field' và 'gán instance' chạm vào hai ô nhớ khác nhau, nên với chính thread A thứ tự giữa chúng không phân biệt được — JIT được lập lịch lại, CPU có memory model yếu như ARM được ghi ra theo thứ tự khác. Thread B đi đường nhanh có thể thấy instance khác null rồi dùng một object chưa khởi tạo xong. Đánh dấu instance là volatile biến lệnh gán thành một lần ghi volatile: mọi lệnh ghi đứng trước nó, kể cả toàn bộ thân constructor, không được dời ra sau nó, và lần đọc nào ở đường nhanh thấy giá trị khác null đều có một đường happens-before từ constructor tới nó. Đó là lý do bản sửa chỉ đúng từ Java 5, khi JSR-133 định nghĩa lại volatile; trước đó không có cách sửa nào. Còn câu 'chạy nhiều năm không lỗi': series chạy hàng tỷ lần thử trên x86 + HotSpot JDK 25 mà không bắt được object thiếu field, nhưng jcstress ghi nhận được trên cả x86_64 lẫn AArch64 — đó là quan sát về một bản cài đặt, không phải đảm bảo, và nó chờ bạn tới lúc chuyển sang Graviton hay tới bản JIT kế tiếp. Một điểm hay bị quên: volatile chỉ công bố những gì đã ghi trước lần gán. Biến thể 'gán o = c rồi mới c.load()' với o volatile lộ lỗi 138 098 lần thấy port = 0, vì chính code đã công bố trước khi khởi tạo xong. Cách lazy init đúng: holder class (static class H { static final Config I = new Config(); }) — JVM khoá việc khởi tạo class và JIT coi I như hằng số, ngắn và nhanh nhất cho singleton static; DCL + volatile + đọc vào biến cục bộ cho field instance; LazyConstant (preview) trên JDK mới; và trong Spring, đơn giản là một @Bean, vì container đã làm phần đồng bộ. Mọi cách đúng đều đọc khoảng 0,5–0,7 ns, so với 27 ns khi khoá synchronized mỗi lần đọc.",
    redFlags: [
      "Cho rằng volatile nghĩa là 'đọc thẳng từ RAM, bỏ qua cache' thay vì là ràng buộc về thứ tự và cấm JIT bỏ lệnh",
      "Lập luận rằng x86 có memory model mạnh nên DCL thiếu volatile không thể hỏng",
      "Nghĩ synchronized ở phía ghi là đủ để mọi thread đọc thấy object đầy đủ",
      "Tin rằng đã có volatile thì mọi biến thể DCL đều đúng, kể cả khi công bố trước rồi mới khởi tạo",
    ],
    probes: [
      "Vì sao 'tôi đã sleep 1 giây rồi mới đọc' không chứng minh được gì về happens-before?",
      "Field final giúp gì cho việc công bố object qua data race, và điều kiện duy nhất là gì?",
      "Holder class an toàn nhờ cơ chế nào của JVM?",
    ],
    refs: ["uh-16"],
  },
  {
    id: "uh-iq14",
    field: "under-hood",
    topic: "uh-conc",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Service Spring Boot, JDK 25, pod limits.cpu: 2, Tomcat 200 thread.
// Hai endpoint không liên quan, do hai đội viết.

// Đội A — /search: CPU thuần trên 400 000 phần tử, "song song cho nhanh"
long r = Arrays.stream(DATA).parallel()
               .filter(v -> (v & 7) != 0)
               .mapToLong(Srv::score).sum();

// Đội B — /enrich: gọi 3 downstream "song song cho nhanh", mỗi lời gọi chặn ~300 ms
var user  = CompletableFuture.supplyAsync(() -> callDownstream("user"));
var price = CompletableFuture.supplyAsync(() -> callDownstream("price"));
var stock = CompletableFuture.supplyAsync(() -> callDownstream("stock"));
reply(user.join() + price.join() + stock.join());

// Đo được (open-loop 15 s):
//   /search chạy một mình             p99    13,6 ms
//   /search khi /enrich nhận 2 rps    p50     8,2 ms   p99 11 101 ms
//   /enrich (2 rps)                   p50 6 509 ms     p99 24 514 ms
// Trước khi nâng JDK 21 -> 25, cùng code, cùng pod: /enrich p50 305 ms.`,
    },
    question:
      "Với đoạn code và số đo ở trên: mỗi phần của hai endpoint thực sự chạy trên thread nào, vì sao /enrich chỉ 2 request mỗi giây lại kéo đuôi độ trễ của /search lên 11 giây, vì sao vấn đề chỉ lộ ra sau khi nâng JDK, và bạn sửa thế nào?",
    mustCover: [
      "parallelStream chạy trên chính thread Tomcat đang xử lý request cộng với ForkJoinPool.commonPool(); supplyAsync không truyền executor cũng chạy trên commonPool — hai endpoint của hai đội dùng chung một pool tĩnh của cả JVM",
      "commonPool có availableProcessors − 1 worker, với CPU JVM nhìn thấy là CPU limit của pod: limits.cpu 2 nghĩa là đúng 1 worker",
      "commonPool không thêm thread bù khi worker chặn bằng Thread.sleep, socket hay JDBC — chỉ khi chờ qua ForkJoinPool.managedBlock; mảnh con của parallel stream nằm trong hàng đợi chung phải chờ worker duy nhất ngủ hết từng lượt 300 ms",
      "Định luật Little: 2 rps × 3 lời gọi × 0,3 s = 1,8 giây chờ cần phục vụ mỗi giây, trong khi pool chỉ có 1 worker — tải vượt khả năng, hàng đợi dài ra mãi",
      "Từ Java 8 tới JDK 24, khi commonPool parallelism ≤ 1, supplyAsync(fn) dùng ThreadPerTaskExecutor (một thread mới mỗi tác vụ) nên chạy song song thật; JDK 25 luôn dùng commonPool, nên cùng code bị dồn sau 1 worker",
      "Sửa: truyền executor riêng cho supplyAsync (inject executor của Spring, có TaskDecorator mang MDC/SecurityContext) — cả hai endpoint về như lúc chạy riêng (/enrich p50 306 ms); không dùng parallelStream trong đường xử lý request, nếu cần thì chạy trên ForkJoinPool riêng và đo",
    ],
    model:
      "Đội A tưởng parallelStream chỉ dùng CPU của request mình, đội B tưởng supplyAsync tạo thread mới — cả hai đều sai theo cùng một cách. parallelStream chạy trên thread Tomcat đang xử lý request (nó tự làm phần việc gốc và giúp các phần con) cộng với ForkJoinPool.commonPool(); các mảnh con nó tách ra được đẩy vào hàng đợi chung của commonPool để worker khác steal. supplyAsync(fn) không có executor chạy trên ASYNC_POOL, mà trên JDK 25 chính là commonPool. commonPool là một pool tĩnh, tạo lười, không bao giờ tắt, dùng chung cả JVM — chung với parallel stream của thư viện, Arrays.parallelSort, thao tác hàng loạt của ConcurrentHashMap, refresh của Caffeine, và từ JDK 25 cả bộ hẹn giờ của orTimeout. Kích thước của nó là availableProcessors − 1, mà trong container CPU JVM nhìn thấy là CPU limit của pod: limits.cpu 2 cho đúng 1 worker. Pool cỡ CPU − 1 là tối ưu cho việc CPU thuần, không chặn; vấn đề bắt đầu khi đội B đưa vào đó lời gọi chặn 300 ms. Worker ngủ không làm gì khác được, và commonPool chỉ thêm thread bù khi code chờ qua ForkJoinPool.managedBlock — Thread.sleep, socket hay JDBC thì không. Tính bằng định luật Little: 2 rps × 3 lời gọi × 0,3 s = 1,8 giây chờ cần phục vụ mỗi giây, trong khi 1 worker chỉ có 1 giây 'chỗ ngồi' mỗi giây; tải vượt khả năng 80%, hàng đợi dài mãi — p50 /enrich 6,5 s và còn tăng theo thời gian chạy. /search bị kéo theo một cách tinh tế: phần lớn lần thread Tomcat tự làm gần hết việc nên p50 vẫn 8,2 ms, nhưng thỉnh thoảng một mảnh con đã nằm trong hàng đợi chung, phía sau hàng chục tác vụ /enrich; thread gọi không lấy lại được mảnh đó, phải chờ worker duy nhất ngủ hết từng lượt 300 ms phía trước — p99 11,1 s. Vì sao lộ ra sau khi nâng JDK: từ Java 8 tới JDK 24, CompletableFuture chỉ dùng commonPool khi parallelism > 1; trên pod 1–2 CPU nó âm thầm dùng ThreadPerTaskExecutor, mỗi tác vụ một thread mới, nên ba lời gọi chặn chạy song song thật (p50 305 ms). JDK 25 luôn dùng commonPool — với việc CPU rỗng nhanh hơn 80 lần, nhưng với lời gọi chặn thì cả ba lời gọi của mọi request xếp hàng sau một worker. Sửa: không bao giờ gọi I/O trong supplyAsync(fn) không có executor; inject executor của Spring và truyền vào, executor đó còn chạy TaskDecorator để mang MDC/SecurityContext sang thread mới, điều commonPool không làm. Đo lại: /enrich về 306 ms, /search về như lúc chạy riêng. Với gọi song song I/O, có thể dùng executor virtual thread có giới hạn đồng thời. Còn parallelStream trong đường request thì mặc định là không: request đã song song với nhau, thêm song song bên trong chỉ giúp khi CPU rảnh; nếu thật sự cần, chạy trên một ForkJoinPool riêng và đo. Cuối cùng, kiểm tra lại mọi supplyAsync(fn) trước khi nâng pod nhỏ từ 21 lên 25, và theo dõi commonPool bằng ExecutorServiceMetrics của Micrometer hoặc thread dump: worker ForkJoinPool.commonPool-worker-N nằm trong Thread.sleep hay NioSocketImpl.read là dấu hiệu chắc chắn.",
    redFlags: [
      "Cho rằng parallelStream chỉ dùng CPU của request đang chạy, không chung với ai",
      "Đề xuất tăng thread Tomcat hoặc tăng CPU limit mà không nhận ra cả hai đội chung một commonPool 1 worker",
      "Tin rằng commonPool tự thêm thread khi worker bị chặn bởi socket hay JDBC",
      "Khẳng định supplyAsync luôn tạo thread mới, bất kể JDK và số CPU",
    ],
    probes: [
      "Trên máy 8 CPU (7 worker), /enrich ở 5 rps và 10 rps khác nhau thế nào, và vì sao không có vùng 'chậm dần đều'?",
      "Vì sao số lần steal của /search tụt từ 3 777 xuống 568 khi chạy chung với /enrich?",
      "@Async và bộ lập lịch virtual thread có dùng commonPool không?",
    ],
    refs: ["uh-20", "uh-13"],
  },
  {
    id: "uh-iq15",
    field: "under-hood",
    topic: "uh-conc",
    level: 3,
    minutes: 11,
    question:
      "Một service Spring Boot đang chạy JDK 21 với pool Tomcat 200 thread. Phần lớn request gọi một downstream mất khoảng 50 ms; DB qua HikariCP 10 kết nối; có một endpoint xuất báo cáo PDF tốn CPU; một thư viện cũ cache object đắt trong ThreadLocal; JDBC driver bản cũ còn dùng synchronized quanh lời gọi socket. Đội muốn bật spring.threads.virtual.enabled=true. Phân tích đánh đổi giữa các hướng đi và chỉ ra khi nào hệ thống lại chậm hơn sau khi bật.",
    tradeoffs: [
      {
        option: "Giữ pool 200 platform thread",
        when: "Thông lượng chưa nghẽn ở số thread — tải còn dưới trần 200 / 0,05 s = 4 000 rps — hoặc giới hạn thật nằm ở chỗ khác (DB 10 kết nối). Pool là một bộ giới hạn tải ngầm định: tối đa 200 request cùng chạm DB, quá tải thì xếp hàng chờ thread. Cái giá là vượt trần thì hàng đợi không giới hạn, p99 lên 6,8 s rồi 13,3 s; và bạn phải đoán đúng số thread bằng định luật Little.",
      },
      {
        option: "Bật virtual thread ngay trên JDK 21",
        when: "Chỉ khi đã kiểm tra pinning: trên JDK 21–23, virtual thread chặn bên trong synchronized ghim carrier (1 000 task ngủ 20 ms trong synchronized: 10 201 ms, song song hiệu dụng ≈ 2). Phải chạy tải với JFR jdk.VirtualThreadPinned, nâng driver (pgjdbc ≥ 42.6.0, Connector/J ≥ 9.0.0 đã thay synchronized bằng ReentrantLock); file I/O chặn còn được bù carrier tới 256 rồi kẹt.",
      },
      {
        option: "Nâng JDK 25 rồi bật virtual thread, đặt lại giới hạn có chủ đích",
        when: "Service chủ yếu chờ I/O và đã sẵn sàng coi đây là thay đổi kiến trúc: synchronized không còn ghim (JEP 491, 79 ms); đặt bulkhead (Semaphore, Resilience4j hoặc SimpleAsyncTaskExecutor.setConcurrencyLimit) trước tài nguyên khan hiếm; tách việc CPU nặng sang ThreadPoolTaskExecutor platform thread có giới hạn; thay ThreadLocal làm cache; bọc file I/O có thể treo (NFS, FIFO) trong executor platform riêng vì JDK 23+ không còn bù carrier.",
      },
    ],
    mustCover: [
      "Virtual thread thắng khi thông lượng bị giới hạn bởi số việc đang chờ: với /io 50 ms, pool 200 chạm trần ở 4 000 rps (p50 230 ms), còn virtual thread giữ p99 dưới 64 ms tới 8 000 rps với 801 request đồng thời trên 12 thread hệ điều hành — một request vẫn mất đúng 50 ms",
      "Bộ lập lịch không chia lượt thời gian: việc CPU giữ carrier tới khi xong, nên request nhanh chạy chung carrier với báo cáo PDF bị xếp hàng (/fast p99 5,7 → 364 ms); đẩy phần CPU sang pool platform thread riêng đưa về như cũ",
      "Bỏ pool là bỏ một hàng đợi có giới hạn tự nhiên; hàng đợi dời vào tài nguyên khan hiếm tiếp theo: 700 rps vào hệ chỉ phục vụ 500 rps (10 kết nối × 20 ms) cho 30% lỗi timeout chờ pool kết nối thay vì chậm — cần đặt lại giới hạn và chọn rõ 'chờ lâu' hay 'từ chối nhanh'",
      "ThreadLocal làm cache object đắt trở thành chi phí mỗi request vì mỗi request là một thread mới: 50 401 lần khởi tạo, p50 1,16 s ở 1 800 rps; thay bằng object thread-safe dùng chung, pool có giới hạn, hoặc ScopedValue nếu mục đích là truyền ngữ cảnh",
      "JDK 21–23: chặn trong synchronized ghim carrier vì monitor ghi chủ sở hữu là platform thread (10 201 ms so với 79 ms trên JDK 25 nhờ JEP 491); trên JDK 21 phải soi JFR jdk.VirtualThreadPinned và nâng driver, tốt hơn là chạy JDK 25 LTS",
      "Không pool virtual thread (chúng rẻ, 2,2 µs, dùng một lần); vận hành thay đổi: jvm.threads.live mất ý nghĩa, Thread.print không thấy virtual thread đang chờ (25 so với 663 thread) — dùng Thread.dump_to_file -format=json",
    ],
    model:
      "Tôi sẽ không coi dòng spring.threads.virtual.enabled=true là một tối ưu cấu hình; nó thay mô hình thread của cả ứng dụng — Tomcat, @Async, @Scheduled, listener Kafka/RabbitMQ đều chuyển sang virtual thread. Câu hỏi đầu tiên là service nghẽn ở đâu. Virtual thread là continuation chạy trên vài carrier (số carrier bằng số CPU); khi chặn ở chỗ JDK hiểu — sleep, socket, LockSupport.park, Lock — nó chép stack ra heap và nhường carrier. Nhờ vậy nó xoá giới hạn 'số thread': với downstream 50 ms, pool 200 có trần 4 000 rps, vượt qua là hàng đợi phình (p99 6,8 s rồi 13,3 s), còn virtual thread giữ p99 dưới 64 ms tới 8 000 rps trên 12 thread hệ điều hành. Nhưng nó không làm request nhanh hơn — p50 vẫn 50 ms ở cả hai mô hình — và hệ thống sẽ chậm hơn ở bốn chỗ mà service này có đủ cả. Một, việc CPU: bộ lập lịch không chia lượt, báo cáo PDF giữ carrier tới khi xong, request nhanh xếp hàng sau nó — /fast p99 từ 5,7 lên 364 ms trong thí nghiệm; tách việc đó sang một ThreadPoolTaskExecutor platform thread có giới hạn đưa mọi thứ về như cũ. Hai, tài nguyên có hạn: HikariCP 10 kết nối giữ 20 ms phục vụ tối đa 500 rps bất kể mô hình thread; pool 200 vốn là bộ giới hạn tải ngầm, bỏ nó đi thì hàng đợi dời vào pool kết nối — ở 700 rps virtual thread cho 30% lỗi timeout thay vì chậm. Phải đặt lại giới hạn có chủ đích: Semaphore/bulkhead quanh downstream, setConcurrencyLimit trên SimpleAsyncTaskExecutor (mặc định không giới hạn), và quyết định chờ hay từ chối nhanh. Ba, ThreadLocal làm cache: pool 200 tạo 200 bản rồi dùng mãi, virtual thread tạo một bản mỗi request — object tốn 1 ms CPU khởi tạo cho 50 401 lần khởi tạo, p50 1,16 s, service sụp; thay bằng object thread-safe dùng chung, hoặc ScopedValue nếu mục đích là truyền ngữ cảnh. Bốn, pinning — và đây là lý do JDK quan trọng: trên JDK 21–23, monitor ghi chủ sở hữu là platform thread, nên virtual thread chặn bên trong synchronized ghim carrier; 1 000 task ngủ 20 ms trong synchronized mất 10 201 ms trên JDK 21 so với 79 ms trên JDK 25 (JEP 491). Driver cũ của chúng ta chính là trường hợp này. Vì vậy so sánh ba hướng: giữ pool 200 là đúng nếu tải còn xa trần 4 000 rps hoặc giới hạn thật là DB; bật ngay trên JDK 21 chỉ chấp nhận được sau khi soi JFR jdk.VirtualThreadPinned dưới tải và nâng driver (pgjdbc ≥ 42.6.0, Connector/J ≥ 9.0.0); hướng tôi chọn là nâng JDK 25 LTS, rồi bật kèm danh sách kiểm tra: bulkhead trước DB, tách CPU, rà ThreadLocal, bọc file I/O có thể treo vì từ JDK 23 file I/O buffered không còn được bù carrier. Không pool virtual thread — chúng tạo trong 2,2 µs và được thiết kế để dùng một lần. Đổi cả cách vận hành: metric jvm.threads.live báo 12 khi 800 request đang chạy, Thread.print không thấy virtual thread đang chờ, nên theo dõi số request đang xử lý, độ trễ, độ dài hàng đợi tài nguyên, và dùng Thread.dump_to_file -format=json. Cuối cùng, đo trước và sau bằng tải open-loop ở tải hiện tại và 2× tải, kèm tỉ lệ lỗi — virtual thread thường đổi 'chậm dần' thành 'lỗi nhanh', và cả hai đều cần được thấy trước khi lên production.",
    redFlags: [
      "Khẳng định virtual thread làm mỗi request nhanh hơn hoặc luôn tăng thông lượng",
      "Đề xuất tạo pool virtual thread cố định như pool platform thread để 'giới hạn'",
      "Cho rằng từ JDK 24 hết hoàn toàn pinning, bỏ qua native frame, khởi tạo class và file I/O chặn",
      "Bật virtual thread mà không xác định giới hạn thật phía sau (pool kết nối, rate limit, bộ nhớ)",
    ],
    probes: [
      "Vì sao trên JDK 25, 500 virtual thread đọc một named pipe chưa ai ghi có thể làm đứng cả bộ lập lịch?",
      "Structured concurrency giúp gì khi một request gọi ba downstream và một nhánh lỗi sau 50 ms?",
      "Stack của virtual thread nằm ở đâu, và điều đó ảnh hưởng gì tới GC khi có 50 000 request đang chờ?",
    ],
    refs: ["uh-19", "uh-17"],
  },
  {
    id: "uh-iq16",
    field: "under-hood",
    topic: "uh-conc",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Sau khi chuyển một service Spring Boot sang pod nhỏ hơn, p99 latency có những đỉnh khoảng 1 giây lặp lại nhiều lần mỗi phút, ảnh hưởng mọi endpoint chứ không riêng endpoint nào. Dashboard GC lại xanh: jvm.gc.pause max chỉ vài ms. Không có lỗi, không có deploy code mới. Một endpoint của service băm checksum trên một mảng byte lớn bằng một vòng for với biến chạy kiểu int.",
      scale:
        "Pod limits.cpu: 1, limits.memory 1Gi, JDK 25. Vài trăm request mỗi giây. Thread probe đo được trong 20 giây có hơn 20 lần trễ ≥ 500 ms, lớn nhất khoảng 1,17 s. Không ai trong đội khai báo GC — JVM tự chọn.",
      constraints:
        "Không được tăng CPU limit (ngân sách). Image tối giản, perf_events bị seccomp chặn nên không dùng async-profiler kiểu cpu; chỉ có công cụ đi kèm JDK. Restart từng pod được phép nhưng phải có bằng chứng trước, và phải giữ lại được log để viết postmortem.",
    },
    question:
      "Pause dài nhưng log GC lại ngắn — thời gian đi đâu? Trình bày cách bạn xác nhận giả thuyết, tìm ra thread và dòng code thủ phạm bằng công cụ có sẵn trong JDK, rồi sửa cả trước mắt lẫn lâu dài.",
    mustCover: [
      "Log GC và jvm.gc.pause chỉ đo phần làm việc sau khi mọi thread đã dừng (At safepoint); phần chờ thread chậm nhất chạm tới poll — Reaching safepoint, tức time-to-safepoint — không có trong log GC lẫn metric Micrometer: trong thí nghiệm, log GC 2,5 ms nhưng JVM đứng yên 1 175 ms",
      "Pod dưới 2 CPU hoặc dưới 1 792 MB làm JVM (JDK 17–26) tự chọn Serial GC; Serial và Parallel để UseCountedLoopSafepoints = false và LoopStripMiningIter = 0, nên vòng lặp đếm (biến chạy int, bước cố định) do C2 biên dịch không có lệnh poll nào",
      "Xác nhận: bật -Xlog:safepoint cạnh -Xlog:gc (được cả lúc đang chạy qua jcmd VM.log) và đọc Reaching safepoint cùng Threads: N runnable; tìm thread bằng -XX:+SafepointTimeout -XX:SafepointTimeoutDelay=200; tìm dòng code bằng JFR jdk.SafepointLatency (JDK 25, tắt mặc định) kèm stack trace",
      "Sửa: khai báo GC tường minh -XX:+UseG1GC (G1 bật loop strip mining sẵn), hoặc nếu giữ Serial vì bộ nhớ thì bật -XX:+UseCountedLoopSafepoints -XX:LoopStripMiningIter=1000 (tổng safepoint 17 996 ms → 183,7 ms); đổi biến chạy sang long KHÔNG chữa được (vẫn chờ 1 186 ms)",
      "Loại trừ các nguồn pause khác không có trong log GC: System.arraycopy lớn (stub không poll, mọi GC — Arrays.copyOf khi ArrayList/ByteArrayOutputStream khổng lồ tăng cỡ), heap dump / thread dump do actuator hay agent APM chụp định kỳ, log GC ghi đồng bộ vào đích chậm (-Xlog:async); code JNI không bao giờ là thủ phạm vì thread in_native đã được tính là an toàn",
    ],
    model:
      "Hình dạng triệu chứng đã gợi ý hướng: dashboard GC xanh, p99 đỏ, đỉnh đánh vào mọi endpoint cùng lúc — tức là cả JVM đứng, nhưng không phải vì phần việc của GC. GC cần dời object và sửa mọi tham chiếu, kể cả tham chiếu trong thanh ghi và trên stack, nên mọi thread phải dừng ở safepoint — chỗ JIT đã ghi oop map. JVM không dừng thread từ bên ngoài được: nó gài trang poll, và mỗi thread tự dừng khi chạm lệnh poll mà JIT rải ở cuối method và ở cạnh quay lại của vòng lặp. VM thread chỉ bắt đầu GC khi thread chậm nhất tới nơi. Log GC đo từ lúc GC bắt đầu; metric jvm.gc.pause tính từ thông báo của GC — cả hai thấy 'At safepoint', không thấy 'Reaching safepoint'. Đó là chỗ thời gian biến mất. Vì sao lại xảy ra sau khi chuyển pod: dưới 2 CPU hoặc dưới 1 792 MB, JVM JDK 17–26 tự chọn Serial GC. C2 có một ngoại lệ có chủ đích: vòng lặp đếm — biến chạy int, bước cố định, cận không đổi — được coi là 'sẽ sớm kết thúc' nên không đặt poll; loop strip mining chia vòng dài thành vòng trong không poll và vòng ngoài có poll, nhưng chỉ G1, ZGC, Shenandoah bật nó. Serial và Parallel để UseCountedLoopSafepoints = false, LoopStripMiningIter = 0 vì chúng tối ưu thông lượng. Vòng for int băm checksum là đúng loại đó: khi GC muốn chạy đúng lúc nó đang quay, cả JVM chờ nó. Trong thí nghiệm của series: log GC 2,5 ms, Total 1 175 ms, Threads: 1 runnable; với Serial, JVM nằm trong safepoint 18 trên 20 giây, số lần GC còn 21 thay vì ~248 vì thread tạo rác cũng bị dừng theo — thông lượng của mọi thread sụp, không chỉ độ trễ. Điều tra theo ba bước, không cần restart cho bước đầu: bật log safepoint lúc đang chạy bằng jcmd VM.log (hoặc -Xlog:safepoint cạnh -Xlog:gc từ đầu, chi phí không đáng kể); mỗi dòng có Reaching safepoint — lớn hơn vài ms là có thủ phạm — và Threads: N runnable, nếu là 1 thì đang tìm một thread duy nhất. Kiểm tra luôn dòng 'Using Serial' trong log GC hoặc VM.flags. Bước hai, trên một pod đã giữ lại log: -XX:+SafepointTimeout -XX:SafepointTimeoutDelay=200 in tên thread chưa tới poll sau 200 ms. Bước ba, JFR trên JDK 25 với jdk.SafepointLatency bật và stackTrace=true — nhờ cooperative sampling (JEP 518), sự kiện này đo đúng khoảng chờ và chỉ ra method cùng số dòng của vòng lặp. Sửa: trước mắt khai báo GC tường minh -XX:+UseG1GC — G1 bật strip mining sẵn, và từ JDK 27 G1 là mặc định ở mọi môi trường; nếu cố ý giữ Serial vì bộ nhớ, thêm -XX:+UseCountedLoopSafepoints -XX:LoopStripMiningIter=1000 — thí nghiệm đưa tổng safepoint từ 17 996 ms về 183,7 ms, lần chờ lớn nhất từ 1 171,8 ms về 3,3 ms. Đừng 'sửa' bằng cách đổi biến chạy sang long: cùng Serial vẫn chờ 1 186 ms. Lâu dài, đặt cảnh báo khi Reaching safepoint > 50 ms, và rà các nguồn pause khác cùng họ: System.arraycopy lớn là stub không poll dưới mọi GC (256 MB: chờ 86 ms, tổng safepoint 13,7 lần log GC) — nấp sau ArrayList, ByteArrayOutputStream, StringBuilder khổng lồ tăng cỡ; /actuator/heapdump, thread dump của agent APM là VM operation dừng cả JVM nhưng không có trong log GC; log GC đồng bộ ghi vào stdout/đĩa mạng chậm có thể kéo pause 5 ms thành 911 ms, dùng -Xlog:async. Ngược lại, đừng nghi code JNI: thread ở trạng thái in_native được coi là an toàn ngay, Deflater 64 MB gần như không gây chờ.",
    redFlags: [
      "Tin rằng pause trong log GC là toàn bộ thời gian ứng dụng bị dừng",
      "Nghi ngay code native/JNI chạy lâu là thủ phạm làm GC phải chờ",
      "Đề xuất đổi biến chạy vòng lặp sang long như cách chữa",
      "Cho rằng JVM dừng thread bằng tín hiệu của hệ điều hành nên không thể có chuyện chờ một thread",
    ],
    probes: [
      "Trường 'Threads: 1 runnable' trong dòng log safepoint cho bạn biết điều gì?",
      "Handshake (JEP 312) khác safepoint thế nào, và vì sao lấy stack một thread rẻ hơn hẳn lấy stack tất cả?",
      "ZGC/Shenandoah có hoàn toàn miễn nhiễm với vấn đề chờ vào safepoint không?",
    ],
    refs: ["uh-18", "uh-13"],
  },

  // ===== uh-lang (uh-iq17–uh-iq20) =====
  {
    id: "uh-iq17",
    field: "under-hood",
    topic: "uh-lang",
    level: 1,
    minutes: 5,
    question:
      "Trong buổi review, một đồng nghiệp đề nghị viết lại mọi lambda trong code nóng thành vòng lặp tay vì 'lambda là cú pháp ngắn của anonymous class, mỗi lần gọi lại tạo class mới và luôn cấp phát'. Giải thích javac và JVM thực sự làm gì với một lambda: cái gì được tạo ra, bao nhiêu lần, vào lúc nào, và cái giá thật nằm ở đâu.",
    mustCover: [
      "javac chép thân lambda thành một method private static trong chính class chứa (lambda$demo$0…) và ghi một lệnh invokedynamic có bootstrap là LambdaMetafactory.metafactory — không có file .class nào cho lambda",
      "Lần đầu call site chạy, LambdaMetafactory sinh bytecode một hidden class (JEP 371) implement interface rồi trả về ConstantCallSite; từ lần thứ hai lệnh chạy thẳng — một class cho mỗi call site, kể cả hai lambda viết giống hệt ở hai chỗ là hai class",
      "Lambda không bắt biến được nối với một hằng số — một object duy nhất cho call site (hành vi OpenJDK, đặc tả không hứa, đừng so sánh lambda bằng ==); lambda bắt biến được nối với constructor nên mỗi lần biểu thức được đánh giá tạo một object (16 byte)",
      "Khi C2 inline được, escape analysis xoá hẳn lệnh cấp phát (0 byte/lần sau warm-up); object chỉ thật sự xuất hiện khi lambda thoát — lưu vào field, collection, trả về — hoặc khi method nhận nó không inline được (16 byte/lần)",
      "Cái giá thật nằm ở lần liên kết đầu tiên: lambda đầu tiên của chương trình tốn 8–11 ms khởi động hạ tầng java.lang.invoke, mỗi lambda tiếp theo 0,2–0,3 ms (1 000 lambda: 303 ms trên JDK 25), đắt hơn nạp một anonymous class biên dịch sẵn; AOT cache JDK 25 giảm 359 → 66 ms",
    ],
    model:
      "Lambda không phải anonymous class viết ngắn. Khi javac gặp () -> id * 2, nó chép thân lambda thành một method private static ngay trong class của bạn — lambda$demo$1, nhận biến bị bắt làm tham số (I)I — rồi ở chỗ viết lambda chỉ ghi một lệnh invokedynamic. Lệnh đó không ghi đích đến; nó ghi một bootstrap method, ở đây là LambdaMetafactory.metafactory, cùng interface cần implement và method thân. Không có file .class nào cho lambda trên đĩa hay trong jar. Lần đầu lệnh indy chạy, JVM gọi bootstrap; InnerClassLambdaMetafactory sinh bytecode của một class nhỏ ngay lúc chạy và định nghĩa nó thành hidden class (JEP 371): tên kiểu Shapes$$Lambda/0x…, không tìm được bằng Class.forName, frame bị ẩn khỏi stack trace trừ khi bật -XX:+ShowHiddenFrames, là nestmate của class chứa nên gọi được method private, sống cùng class loader của class chứa. Bootstrap trả về ConstantCallSite; từ lần thứ hai lệnh chạy thẳng vào handle, không hỏi lại, và JIT inline xuyên qua được. Vậy câu trả lời: class được tạo một lần cho mỗi call site — một triệu lần gọi vẫn là 1 class — nhưng hai lambda viết giống hệt ở hai dòng khác nhau là hai class. Về object, mã nguồn InnerClassLambdaMetafactory.buildCallSite có hai nhánh: lambda không bắt biến được nối với một hằng số — tạo đúng một object ngay lúc liên kết — nên một triệu lần gọi chỉ có 1 object; đó là hành vi của OpenJDK, đặc tả không hứa, nên đừng dùng == trên lambda. Lambda bắt biến được nối với constructor của hidden class, nên mỗi lần biểu thức lambda được đánh giá tạo một object mới, như new một anonymous class — header 12 byte + một int = 16 byte. Nhưng 'tạo' trên lý thuyết chưa chắc là cấp phát thật: trong vòng lặp nóng, khi C2 inline được method nhận lambda và applyAsInt, escape analysis thấy object không thoát và xoá hẳn lệnh cấp phát — 0 byte mỗi lần lặp sau warm-up, kể cả khi call site đã megamorphic. Object chỉ thật sự xuất hiện khi lambda thoát hoặc không inline được (tắt EscapeAnalysis, dontinline, chỉ thông dịch: 16 byte/lần) — lúc đó nó là rác trẻ, rẻ như mọi object ngắn hạn. Cái giá thật nằm ở lần đầu của mỗi call site: gọi bootstrap, sinh bytecode, định nghĩa hidden class, dựng MethodHandle. Lambda đầu tiên của chương trình tốn 8–11 ms để khởi động hạ tầng java.lang.invoke; mỗi lambda tiếp theo 0,2–0,3 ms ở lần đầu — đắt hơn nạp một anonymous class đã biên dịch sẵn (~0,13 ms) vì class phải được sinh ra. 1 000 lambda tốn 303 ms trên JDK 25. Với vài nghìn lambda lúc khởi động Spring Boot, đó là một phần đáng kể của một giây, thấy được trên flame graph dưới tên LambdaMetafactory; và endpoint ít gọi trả phí đó ở request đầu tiên. Cách giảm là AOT cache của JDK 25 (1 000 lambda: 359 → 66 ms), không phải viết lại thành vòng lặp tay. Lời khuyên cho code nóng: đo bằng JMH -prof gc hoặc JFR jdk.ObjectAllocationSample trước khi viết lại.",
    redFlags: [
      "Khẳng định mỗi lần gọi lambda tạo một class mới",
      "Nói lambda luôn cấp phát, bất kể có bắt biến hay JIT có inline được",
      "Cho rằng hai lambda viết giống hệt nhau dùng chung một class",
      "Dùng == để so sánh hai lambda và dựa vào việc lambda không bắt biến là singleton",
    ],
    probes: [
      "Nối chuỗi bằng + từ Java 9 dịch thành gì, và JDK 24 thay đổi điều gì ở đó?",
      "Vì sao trong stack trace bạn thấy lambda$findOrders$2 nhưng không thấy frame $$Lambda?",
      "equals của record có dùng reflection lúc chạy không?",
    ],
    refs: ["uh-21", "uh-08"],
  },
  {
    id: "uh-iq18",
    field: "under-hood",
    topic: "uh-lang",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Helper "dùng chung cho mọi kiểu" trong một ApiClient
public <T> List<T> getList(String url) throws IOException {
    String body = http.get(url);
    return mapper.readValue(body, new TypeReference<List<T>>() {});   // dòng 18
}

// Nơi gọi
List<Order> orders = client.getList("/orders");
long firstId = orders.get(0).id();                                      // dòng 42

// Log production:
// java.lang.ClassCastException: class java.util.LinkedHashMap cannot be cast
//     to class com.shop.Order
//     at com.shop.CheckoutService.firstOrderId(CheckoutService.java:42)

// Một bạn khác "sửa" bằng: mapper.readValue(body, List.class)  -> lỗi y hệt.`,
    },
    question:
      "Giải thích vì sao helper này trả về danh sách LinkedHashMap dù đã dùng TypeReference, vì sao lỗi nổ ở dòng 42 chứ không ở dòng 18, vì sao cách 'sửa' bằng List.class cũng hỏng, và viết lại helper cho đúng.",
    mustCover: [
      "Type erasure: javac kiểm tra kiểu lúc biên dịch rồi thay biến kiểu bằng cận trên (Object) trong descriptor và bytecode; object không mang kiểu generic — new ArrayList<Order>().getClass() chỉ là ArrayList, và List<Order>.class không biên dịch được",
      "Kiểu generic chỉ còn sống trong attribute Signature của khai báo; TypeReference là abstract với constructor protected, đọc getClass().getGenericSuperclass() của lớp con vô danh new TypeReference<X>() {} để lấy X",
      "Trong method generic, Signature của lớp con vô danh ghi chữ T (một TypeVariable) chứ không ghi Order, và mọi lần gọi dùng cùng một class vô danh — mapper đành dùng cận trên Object nên dựng LinkedHashMap; List.class thô cũng vậy",
      "Lỗi nổ ở lệnh checkcast tại chỗ đọc phần tử ra và dùng như kiểu cụ thể, không phải ở chỗ đưa dữ liệu sai vào — đó là heap pollution, có thể cách xa hàng chục method",
      "Sửa: nhận Class<T> rồi tự dựng kiểu (Jackson: mapper.getTypeFactory().constructCollectionType(List.class, el); Spring: ParameterizedTypeReference.forType(ResolvableType.forClassWithGenerics(List.class, el).getType())), hoặc tạo TypeReference với kiểu cụ thể ngay tại chỗ gọi",
    ],
    model:
      "Gốc của chuyện này là type erasure. Generics vào Java 5 với ràng buộc chạy được cùng thư viện cũ, nên javac kiểm tra kiểu đầy đủ lúc biên dịch, rồi trong bytecode thay mỗi biến kiểu bằng cận trên của nó — ở đây T thành Object — và chèn checkcast ở chỗ một giá trị kiểu T được dùng như kiểu cụ thể. JVM không biết generic là gì; một object không mang kiểu generic của nó: ArrayList<String>.class == ArrayList<Integer>.class, new ArrayList<Order>().getClass() chỉ là ArrayList, và List<Order>.class không viết được. Thứ duy nhất còn giữ kiểu đầy đủ là attribute Signature trên khai báo — class, field, method — mà reflection trả ra qua các method getGeneric…(). TypeReference của Jackson khai thác đúng chỗ đó: nó là abstract với constructor protected, nên chỉ tạo được bằng new TypeReference<X>() {} — một lớp con vô danh mà javac sinh thành một class thật Outer$N.class, với Signature của lớp cha ghi đầy đủ X. Constructor đọc getClass().getGenericSuperclass(), ép sang ParameterizedType và lấy đối số kiểu đầu tiên. Mẹo này chỉ hữu ích khi X là kiểu cụ thể. Trong helper getList, lớp con vô danh được viết bên trong một method generic, nên Signature của nó ghi đúng chữ List<T> — T là một TypeVariable, không phải Order — và mọi lần gọi getList, với bất kỳ T nào, đều dùng chung một class vô danh đó. Mapper không có cách nào biết T là Order; nó dùng cận trên Object, giữ nguyên cấu trúc JSON thành LinkedHashMap. readValue(body, List.class) hỏng y hệt vì List thô không nói gì về phần tử. Còn vì sao lỗi nổ ở dòng 42: readValue trả về một List thực ra chứa LinkedHashMap — heap pollution, một List<Order> chứa thứ không phải Order — nhưng không có gì kiểm tra lúc đưa vào. Lệnh checkcast chỉ được chèn ở chỗ phần tử được đọc ra và dùng như Order: orders.get(0).id() ở dòng 42, có khi cách nơi gây lỗi hàng chục method và vài thread. Đây là hình dạng lỗi cần nhận ra ngay: ClassCastException LinkedHashMap → kiểu của bạn gần như luôn là kiểu generic bị mất trên đường. Sửa: helper phải nhận thông tin kiểu thật từ người gọi, ví dụ public <T> List<T> getList(String url, Class<T> el) { JavaType t = mapper.getTypeFactory().constructCollectionType(List.class, el); return mapper.readValue(http.get(url), t); }, gọi bằng client.getList(\"/orders\", Order.class). Với RestClient/RestTemplate của Spring thì dựng ParameterizedTypeReference.forType(ResolvableType.forClassWithGenerics(List.class, el).getType()). Hoặc đơn giản hơn: để người gọi viết new TypeReference<List<Order>>() {} ngay tại chỗ, nơi kiểu là cụ thể. Một đối chiếu hữu ích: @RequestBody List<Order> trong controller chạy đúng mà không cần TypeReference, vì Spring MVC đọc getGenericParameterTypes() của method — kiểu nằm trong Signature của method, đúng ranh giới erasure.",
    redFlags: [
      "Cho rằng TypeReference là phép thuật riêng của Jackson thay vì đọc Signature của lớp cha qua reflection",
      "Tin rằng bọc TypeReference vào method generic là đủ để giữ kiểu",
      "Nghĩ erasure xoá sạch generic khỏi class file, nên reflection không bao giờ đọc được kiểu",
      "Tìm lỗi ở dòng 42 thay vì truy ngược về chỗ dữ liệu sai kiểu được tạo ra",
    ],
    probes: [
      "Vì sao controller cha generic AbstractCrud<T> với create(@RequestBody T) vẫn chạy được khi OrderController extends AbstractCrud<Order>?",
      "Bridge method là gì, và vì sao code quét annotation tự viết phải lọc Method.isBridge()?",
      "Serializer JSON 'chung' cho Redis hay Kafka xử lý việc mất kiểu generic thế nào, và rủi ro khi đổi tên package là gì?",
    ],
    refs: ["uh-22"],
  },
  {
    id: "uh-iq19",
    field: "under-hood",
    topic: "uh-lang",
    level: 3,
    minutes: 11,
    question:
      "Trong OrderService (Spring Boot), placeOrder được đánh @Transactional và bên trong gọi audit(sku) — một method public cùng class đánh @Transactional(propagation = REQUIRES_NEW) để bản ghi audit được giữ lại kể cả khi đơn hàng rollback. Thực tế, mỗi lần placeOrder rollback thì audit cũng mất. Giải thích điều gì xảy ra trong bytecode, rồi so sánh các cách sửa.",
    tradeoffs: [
      {
        option: "Tách audit sang một bean khác (AuditService) và inject vào OrderService",
        when: "Mặc định nên chọn: lời gọi đi qua proxy của bean kia nên REQUIRES_NEW có hiệu lực (thí nghiệm gọi từ bên ngoài: BEGIN tx riêng); rõ ràng nhất, không phụ thuộc mẹo nào. Cái giá là thêm một class và phải nghĩ lại ranh giới trách nhiệm.",
      },
      {
        option: "Gọi lập trình bằng TransactionTemplate với propagation REQUIRES_NEW",
        when: "Khi muốn giữ code trong cùng class và cần thấy rõ ranh giới transaction ngay trong code; không cần proxy nên không dính self-invocation. Đổi lại code gắn với API transaction của Spring thay vì annotation khai báo.",
      },
      {
        option: "Tự inject chính mình (@Autowired @Lazy OrderService self) hoặc AopContext.currentProxy()",
        when: "Khi không thể tái cấu trúc ngay: self.audit() đi qua proxy và chạy được (hai BEGIN lồng nhau); nhưng che giấu ý đồ. AopContext.currentProxy() còn cần @EnableAspectJAutoProxy(exposeProxy = true) — mặc định tắt, quên bật thì ném IllegalStateException: Cannot find current proxy.",
      },
      {
        option: "AspectJ weaving (@EnableTransactionManagement(mode = AdviceMode.ASPECTJ))",
        when: "Khi cần cả this.method(), method private hay final cũng được chặn: advice được dệt vào chính bytecode của class. Cái giá là cần agent hoặc một bước build, và đội phải hiểu một cơ chế khác hẳn proxy.",
      },
    ],
    mustCover: [
      "Spring Boot mặc định proxy-target-class=true nên gần như mọi bean @Transactional là proxy lớp con OrderService$$SpringCGLIB$$0, kể cả khi bean implement interface; proxy được tạo bằng Objenesis (không chạy constructor) và ủy quyền cho một object target riêng qua method.invoke(target, args), không gọi super",
      "Bên trong placeOrder, this là target chứ không phải proxy; this.audit() là một lệnh invokevirtual, dispatch theo class thực của object nhận (OrderService) — không có lệnh nào đi vòng ra proxy, nên advice REQUIRES_NEW không chạy và audit nằm trong transaction của placeOrder",
      "Cùng cơ chế làm @Cacheable không cache, @Async chạy đồng bộ, @Retryable không retry khi gọi từ cùng class; JDK dynamic proxy cho kết quả y hệt vì proxy cũng là một object khác",
      "Proxy lớp con chỉ chặn được method nó ghi đè được: method private, static bị bỏ qua im lặng; method final chạy thẳng trên object proxy mà field chưa được khởi tạo → NullPointerException, và Spring chỉ ghi cảnh báo ở mức DEBUG",
      "Kiểm tra nhanh: AopUtils.isAopProxy(bean) hoặc bean.getClass() có $$SpringCGLIB$$; bật logging.level.org.springframework.transaction.interceptor=TRACE để thấy dòng 'Getting transaction for' — method nào không có dòng đó là không đi qua proxy",
    ],
    model:
      "Điều đầu tiên cần biết là bean mà controller nhận được không phải OrderService của bạn. Spring Boot bật proxyTargetClass mặc định (AopAutoConfiguration, spring.aop.proxy-target-class matchIfMissing = true), nên DefaultAopProxyFactory chọn proxy lớp con: một class OrderService$$SpringCGLIB$$0 extends OrderService, kể cả khi bean có interface. Proxy này được tạo bằng Objenesis — không chạy constructor nào — và nó không gọi super: interceptor lấy object target từ TargetSource, dựng chuỗi advice như TransactionInterceptor, rồi cuối cùng gọi method.invoke(target, args) lên bean thật, một object riêng được tạo bằng constructor bình thường. Bây giờ nhìn bytecode của placeOrder: lời gọi audit(sku) là aload_0 (this), aload_1, invokevirtual audit. invokevirtual chọn method theo class thực của object nhận, và bên trong placeOrder — được gọi qua method.invoke(target, …) — this là target, class OrderService. Proxy đứng bên ngoài; target không biết nó tồn tại; không có lệnh bytecode nào 'đi vòng ra proxy'. Vậy TransactionInterceptor không bao giờ thấy lời gọi audit, REQUIRES_NEW bị bỏ qua, audit chạy trong transaction của placeOrder và rollback cùng nó. Thí nghiệm của series in đúng điều đó: BEGIN tx#2 (REQUIRED) cho placeOrder, audit chạy với tx hiện tại = tx#2; còn gọi proxy.audit từ bên ngoài thì BEGIN tx#3 (REQUIRES_NEW). Cùng cơ chế giải thích @Cacheable không cache, @Async chạy đồng bộ trên thread hiện tại. Các cách sửa, theo thứ tự tôi khuyên: tách audit sang AuditService và inject vào — rõ ràng nhất, lời gọi đi qua proxy của bean khác; nếu muốn giữ trong class, dùng TransactionTemplate với REQUIRES_NEW — không cần proxy; self-inject @Lazy chạy được nhưng che giấu ý đồ, người đọc sau không hiểu vì sao gọi self thay vì this; AopContext.currentProxy() cần exposeProxy = true, mặc định tắt; cuối cùng AspectJ weaving dệt advice vào bytecode gốc nên cả this.audit() cũng được chặn, đổi lại cần agent hoặc bước build. Khi review tôi còn soát thêm một họ lỗi cùng gốc: proxy lớp con chỉ chặn được những gì nó ghi đè được. @Transactional trên method private hay static bị bỏ qua hoàn toàn, im lặng; method final còn tệ hơn: nó chạy thẳng code gốc trên chính object proxy — object được tạo không qua constructor nên field null — và kết quả là NullPointerException 'không thể xảy ra' trên một field gán trong constructor. Spring biết điều này nhưng chỉ log ở DEBUG trong CglibAopProxy. Kotlin mặc định final nên cần plugin kotlin-spring. Để kiểm chứng trên hệ thật: AopUtils.isAopProxy(bean), in bean.getClass() xem có $$SpringCGLIB$$, và bật TRACE cho org.springframework.transaction.interceptor — method nào không có dòng 'Getting transaction for […]' là không đi qua proxy. Chi phí của bản thân proxy thì không đáng lo: vài nano giây mỗi lời gọi, nhỏ so với hàng trăm micro giây của một transaction thật.",
    redFlags: [
      "Cho rằng Spring sửa bytecode của chính class OrderService để chèn transaction",
      "Khẳng định bean implement interface thì luôn là JDK dynamic proxy trong Spring Boot",
      "Coi @Transactional trên method private chỉ là thừa, không nhận ra nó bị bỏ qua im lặng",
      "Đề xuất self-inject như cách sửa tốt nhất mà không nhắc tới việc nó che giấu ý đồ",
    ],
    probes: [
      "Vì sao trong class @Configuration mặc định, gọi this.repo() lại trả về đúng bean singleton?",
      "proxyBeanMethods = false đổi điều gì, và vì sao auto-configuration của Spring Boot dùng nó?",
      "Spring AOT có làm self-invocation chạy qua advice không?",
    ],
    refs: ["uh-23", "uh-06"],
  },
  {
    id: "uh-iq20",
    field: "under-hood",
    topic: "uh-lang",
    level: 4,
    minutes: 15,
    incident: {
      symptom:
        "Log production của một service Spring Boot đầy những dòng java.lang.NullPointerException trơ trọi — không một dòng 'at …', không message. Ticket ghi 'không tái hiện được': trên máy dev, cùng request cho NPE có đủ stack trace và message helpful NPE. Kỳ lạ hơn, dashboard tỉ lệ exception dựng từ JFR lại cho thấy số exception GIẢM trong lúc số lỗi 500 trên gateway tăng.",
      scale:
        "JDK 25, pod đã chạy liên tục hai ngày, endpoint lỗi nhận vài trăm request mỗi giây và lỗi xảy ra hàng chục nghìn lần mỗi giờ. Log xoay vòng mỗi vài giờ nên phần lớn log từ lúc khởi động đã mất.",
      constraints:
        "Không được restart cả fleet với cờ chẩn đoán; chỉ được động vào một pod. Không gắn được debugger vào production. Cần tìm ra dòng code gây NPE trong ca trực này.",
    },
    question:
      "Vì sao log production đôi khi có NullPointerException không kèm stack trace, vì sao dashboard JFR lại báo lỗi giảm, và bạn tìm ra dòng code gây lỗi ra sao trong các ràng buộc trên?",
    mustCover: [
      "NPE ngầm do chính JVM ném khi một lệnh bytecode thất bại (gọi method trên null), khác throw new tường minh; khi C2 biên dịch một chỗ đã 'hot' và method có handler, GraphKit::builtin_throw dùng một instance dựng sẵn và ghi null vào detailMessage — sau khoảng 5 900–14 000 lần, exception không còn frame nào, message null, và mọi lần ném là cùng một object",
      "Chỉ C2 làm điều này; interpreter và C1 luôn tạo exception thật, nên vài nghìn lần ném đầu sau mỗi lần khởi động có đủ stack và message helpful NPE (JEP 358) — tìm ngược log về lần xuất hiện đầu tiên sau lần khởi động gần nhất; trên máy dev code chưa đủ nóng nên luôn có stack",
      "Log đã xoay vòng thì bật -XX:-OmitStackTraceInFastThrow cho một pod: cờ này không manageable nên không đổi được bằng jcmd VM.set_flag, phải khởi động lại đúng pod đó; nó an toàn về đúng sai, cái giá là mỗi lần ném lại chụp đủ stack (khoảng 5,8 µs tạo, ~50 µs định dạng khi log ở độ sâu 150)",
      "Exception dựng sẵn không đi qua constructor của Throwable nên vô hình với JFR jdk.JavaExceptionThrow và jdk.ExceptionStatistics (thấy 14 019 / 100 000 lần ném); JDK 25 còn bật sự kiện này với throttle 100/s — dashboard thấy lỗi giảm đúng lúc lỗi nóng nhất, chỉ đếm ở chỗ catch mới thấy hết",
      "Phân biệt với các nguyên nhân trông giống: code log e.getMessage() hoặc e.toString() thay vì truyền e cho logger, hay exception được tạo với writableStackTrace = false — đó mới là lỗi cấu hình/code log, còn NPE trơ trọi thường là do C2",
    ],
    model:
      "NPE trơ trọi gần như không bao giờ do logger cấu hình sai; nó là một tối ưu có chủ đích của C2. Có hai loại exception: tường minh — code viết throw new — và ngầm, do JVM ném khi một lệnh bytecode thất bại: gọi method trên null, chia cho 0, vượt chỉ số mảng, checkcast sai, lưu sai kiểu vào mảng. Khi C2 biên dịch một lệnh có thể ném exception ngầm, nó xem profile; nếu chỗ đó đã từng ném và method có handler, thì thay vì sinh code gọi về runtime để tạo exception mới, GraphKit::builtin_throw dùng một instance dựng sẵn — NullPointerException_instance cho null_check — kèm lệnh ghi null vào detailMessage. Chính chú thích trong mã nguồn thừa nhận cái giá: missing backtrace. Thí nghiệm của series: lần ném #1 có message helpful NPE nói rõ biến nào null và đủ frame; từ khoảng lần #5 910 trên JDK 25, exception không còn frame nào, message null, và 91 619 lần sau đều là cùng một object. Mốc chuyển dao động 5 900–14 000 vì phụ thuộc lúc C2 biên dịch xong. Exception tường minh không bao giờ bị như vậy, và -Xint, chỉ C1 hay -XX:-OmitStackTraceInFastThrow cũng không. Điều đó giải thích luôn ticket 'không tái hiện được': trên máy dev, code chưa đủ nóng để C2 thay exception. Còn dashboard: exception dựng sẵn không đi qua constructor nào, nên mọi công cụ móc vào constructor của Throwable không thấy nó — JFR với throttle tắt chỉ đếm 14 019 trên 100 000 lần ném, cả jdk.JavaExceptionThrow lẫn bộ đếm tổng jdk.ExceptionStatistics. Trên JDK 25, default.jfc còn bật sự kiện này với giới hạn 100 sự kiện/giây. Nên dashboard thấy tỉ lệ lỗi giảm đúng lúc lỗi trở nên nóng nhất; chỉ đếm ở chỗ catch — log, metric trong handler, số 500 ở gateway — mới thấy hết. Cách tìm dòng code: bước một, không cần đụng pod nào — tìm ngược log về lần xuất hiện đầu tiên của lỗi này sau lần khởi động gần nhất của bất kỳ pod nào; vài nghìn lần đầu có đủ stack và message. Pod nào mới restart hoặc mới scale lên gần đây là ứng viên tốt nhất vì log của nó chưa xoay mất. Bước hai, nếu không còn: chọn đúng một pod, khởi động lại với -XX:-OmitStackTraceInFastThrow. Không có cách bật nóng: cờ này không thuộc 14 cờ manageable mà jcmd VM.set_flag đổi được. Cờ an toàn về đúng sai; cái giá là mỗi lần ném lại tạo exception đầy đủ — khoảng 5,8 µs ở độ sâu 150, cộng ~50 µs nếu mỗi lần đều log.error kèm stack — chỉ chậm ở đúng chỗ đang ném liên tục, vốn đã là một lỗi cần sửa. Trước khi kết luận, loại trừ hai nguyên nhân trông giống: code log e.getMessage() hoặc e.toString() thay vì truyền e cho logger, và exception tạo với writableStackTrace = false — cả hai cho log thiếu stack mà không liên quan C2. Khi có stack: đọc từ Caused by cuối cùng, bỏ qua khung ống nước $$SpringCGLIB$$, DirectMethodHandleAccessor, $$Lambda để tới frame code của mình; sửa lỗi null thật. Sau sự cố: thêm metric đếm lỗi ở handler thay vì chỉ dựa vào JFR, và nhớ rằng số liệu exception từ JFR luôn là lấy mẫu.",
    redFlags: [
      "Kết luận ngay logger hoặc pattern log bị cấu hình sai",
      "Đề xuất bật -XX:-OmitStackTraceInFastThrow cho cả fleet, hoặc nghĩ có thể bật nóng bằng jcmd",
      "Tin dashboard đếm exception từ JFR và kết luận lỗi đang giảm",
      "Cho rằng bật -XX:-OmitStackTraceInFastThrow làm cả JVM chậm hẳn",
    ],
    probes: [
      "Vì sao NumberFormatException từ Integer.parseInt không bao giờ bị 'tối ưu' như NPE ngầm?",
      "'... 42 more' trong stack trace có phải là frame bị mất không?",
      "Khi thật sự cần exception cho luồng điều khiển, làm sao để nó chỉ tốn khoảng 20 ns?",
    ],
    refs: ["uh-24", "uh-25"],
  },

  // ===== uh-diag (uh-iq21–uh-iq24) =====
  {
    id: "uh-iq21",
    field: "under-hood",
    topic: "uh-diag",
    level: 1,
    minutes: 5,
    question:
      "Một pod Spring Boot đang có triệu chứng lạ và bạn không được restart nó, vì restart xoá đúng trạng thái cần xem. Giải thích jcmd 'vào' một JVM đang chạy bằng cơ chế nào, cần điều kiện gì để làm được việc đó trong Kubernetes, và những gì lấy được hay KHÔNG lấy được mà không restart.",
    mustCover: [
      "jcmd dùng Attach API: lần attach đầu, client tạo file .attach_pid<pid> rồi gửi SIGQUIT; JVM thấy file, khởi động thread Attach Listener và mở UNIX socket /tmp/.java_pid<pid> chỉ chủ sở hữu đọc được",
      "Phải cùng user với JVM (hoặc root) — user khác bị Operation not permitted — và chung PID namespace; image tối giản không có jcmd thì gắn container tạm có JDK bằng kubectl debug --target; JVM chạy với -XX:+DisableAttachMechanism thì khoá cửa này hoàn toàn",
      "Không cần restart: thread dump (Thread.dump_to_file -format=json thấy cả virtual thread), GC.heap_info, histogram, heap dump; JFR.start kể cả khi JVM khởi động không có JFR; VM.log bật log GC/safepoint; JDK 25 có method-timing",
      "VM.set_flag chỉ đổi được cờ manageable (14 cờ trên JDK 25, như HeapDumpOnOutOfMemoryError, HeapDumpPath); Native Memory Tracking, -Xmx, chọn GC, OmitStackTraceInFastThrow phải đặt từ lúc khởi động",
      "Vì vậy chuẩn bị trước sự cố: cờ StartFlightRecording ghi 'hộp đen' liên tục, HeapDumpOnOutOfMemoryError trên volume đủ chỗ, cân nhắc NativeMemoryTracking=summary, ghi sẵn lệnh kubectl debug và kiểm tra RBAC cho ephemeral container",
    ],
    model:
      "jcmd nói chuyện với JVM qua Attach API, và mặc định JVM không mở kênh nào cả. Lần attach đầu tiên, phía client tạo một file .attach_pid<pid> rồi gửi tín hiệu SIGQUIT; JVM thấy file đó, khởi động thread Attach Listener và mở một UNIX socket /tmp/.java_pid<pid> mà chỉ chủ sở hữu đọc được. Từ đó mỗi lệnh jcmd là một lần gửi yêu cầu qua socket — phía client mất khoảng 150–300 ms, phần lớn là khởi động chính tiến trình jcmd. Cơ chế này đặt ra ba điều kiện thực tế. Một, cùng user: client kiểm tra chủ sở hữu socket, và user khác thậm chí không gửi được SIGQUIT — thí nghiệm gọi từ user nobody nhận IOException: Operation not permitted. Hai, cùng không gian tiến trình và /tmp: khi client và JVM ở hai container khác nhau nhưng chung PID namespace, jcmd tìm socket qua /proc/<pid>/root/tmp. Trong Kubernetes, nếu image có JDK đầy đủ thì kubectl exec … jcmd là xong; image JRE/jlink tối giản thường không có jcmd, khi đó gắn một container tạm có JDK bằng kubectl debug --target=app, tìm PID của JVM rồi chạy jcmd với cùng user hoặc root. Ba, JVM không được chạy với -XX:+DisableAttachMechanism. Qua cửa đó, lấy được rất nhiều mà không restart: VM.version, VM.flags, VM.command_line để biết đang chạy gì; Thread.dump_to_file -format=json — thread dump đầy đủ kể cả virtual thread, không cần safepoint — hoặc Thread.print kèm phát hiện deadlock; GC.heap_info, GC.class_histogram, GC.heap_dump; JFR.start/JFR.view/JFR.dump — JFR bật được kể cả khi JVM khởi động không có cờ JFR, và JDK 25 còn có method-timing để đo đúng một method; VM.log để bật log GC hay log safepoint ngay bây giờ. Thứ không lấy được thì phải biết trước: VM.set_flag chỉ đổi được cờ manageable — 14 cờ trên JDK 25, như HeapDumpOnOutOfMemoryError, HeapDumpPath, SoftMaxHeapSize — cờ khác bị từ chối với 'only writeable flags can be set'. Native Memory Tracking không bật được lúc đang chạy ('Native memory tracking is not enabled'), -Xmx, lựa chọn GC, OmitStackTraceInFastThrow cũng không. Hệ quả là phần lớn công việc chẩn đoán được quyết định trước khi sự cố xảy ra: image có công cụ hoặc lệnh kubectl debug viết sẵn và RBAC cho phép ephemeral container; cờ khởi động -XX:StartFlightRecording=disk=true,maxage=1h,maxsize=512m,dumponexit=true làm bản ghi hộp đen liên tục với chi phí khoảng 1–2,5% một lõi; -XX:+HeapDumpOnOutOfMemoryError với HeapDumpPath trên một volume có đủ chỗ; và cân nhắc NativeMemoryTracking=summary cho service hay gặp vấn đề bộ nhớ. Và luôn giữ lại bằng chứng trên pod đang bị ảnh hưởng trước khi restart.",
    redFlags: [
      "Cho rằng muốn profile phải restart JVM với cờ JFR",
      "Khẳng định jcmd không chạy được trong container",
      "Nghĩ có thể bật Native Memory Tracking hay đổi -Xmx bằng jcmd VM.set_flag lúc đang chạy",
    ],
    probes: [
      "Vì sao chạy jcmd từ một user khác lại thất bại ngay cả ở bước gửi tín hiệu?",
      "Lệnh jcmd nào bạn chạy đầu tiên khi vào một pod lạ, và vì sao?",
      "/actuator/heapdump có rủi ro gì ngoài việc dừng JVM?",
    ],
    refs: ["uh-25"],
  },
  {
    id: "uh-iq22",
    field: "under-hood",
    topic: "uh-diag",
    level: 2,
    minutes: 9,
    code: {
      lang: "text",
      text: `# Pod limits.memory: 512Mi, JDK tự đặt heap tối đa 25% = 128 MB.
# Sau ~92 s cả hai endpoint lỗi 100%. kubectl describe pod:
    Last State: Terminated   Reason: OOMKilled   Exit Code: 137
# Log ứng dụng: không có dòng OutOfMemoryError nào.

$ jcmd $PID GC.heap_info                       # t = 80 s
DefNew     total 2432K, used 1143K
Tenured    total 84624K, used 84584K

$ jcmd $PID VM.native_memory summary.diff scale=MB      # so với baseline t ≈ 0
Total: reserved=8210MB +6711MB, committed=391MB +281MB
-                 Java Heap (reserved=128MB, committed=85MB +10MB)
-                    Thread (reserved=6708MB +6693MB, committed=253MB +252MB)
                            (stack: reserved=6683MB +6668MB, committed=228MB +227MB)
-                  Internal (reserved=12MB +11MB, committed=12MB +11MB)

# cgroup v1, mỗi 10 s, đổi ra MB
t=10s  cgroup usage 196 MB, rss 193 MB, kmem  22 MB
t=40s  cgroup usage 329 MB, rss 267 MB, kmem  81 MB
t=80s  cgroup usage 481 MB, rss 340 MB, kmem 161 MB

$ grep -c '"pool-' threads.txt;  grep -o '"pool-[0-9]*' threads.txt | sort -u | wc -l
1200
300
"pool-2-thread-1" #22 [3148] … waiting on condition
   java.lang.Thread.State: WAITING (parking)
        at java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1016)`,
    },
    question:
      "Đọc bằng chứng trên (thread dump chụp ở giây 15, endpoint /export nhận 20 request mỗi giây): pod bị giết vì cái gì, vì sao RSS còn cách giới hạn khá xa mà vẫn bị giết, cái gì đang rò rỉ và do dòng code kiểu nào, và bạn sửa cũng như cảnh báo ra sao?",
    mustCover: [
      "Exit Code 137 = 128 + 9 (SIGKILL): kernel giết tiến trình vì bộ nhớ cgroup chạm limits.memory, không phải OutOfMemoryError của JVM — nên log ứng dụng không có dòng nào",
      "Heap không phải thủ phạm: committed ~85 MB trong trần 128 MB và không lớn theo thời gian, nên một heap dump sẽ không tìm thấy gì và chỉ phí thời gian của một pod sắp chết",
      "NMT: 252 trong 281 MB tăng thêm thuộc hạng mục Thread; stack reserved +6 668 MB ≈ 1 MB (-Xss mặc định) × ~6 668 thread mới — reserved không làm ai bị giết, cgroup chỉ tính trang đã chạm (mỗi thread commit khoảng 34 KB)",
      "Ba con số, ba định nghĩa: NMT committed 391 MB, RSS 340 MB, cgroup 481 MB; phần chênh là kmem — kernel stack, task_struct, page table, khoảng 23 KB mỗi thread — không nằm trong heap, RSS hay NMT nhưng cgroup tính vào và kernel dùng con số đó để giết",
      "pool-N-thread-M là tên mặc định của Executors.defaultThreadFactory(); 300 pool × 4 thread sau 15 s ở 20 rps = một pool mới mỗi request, không bao giờ shutdown, thread nằm chờ việc mãi ở getTask — tìm Executors.new trong code dẫn tới /export",
      "Sửa: một pool dùng chung là bean được quản lý vòng đời, hoặc try (var pool = Executors.newFixedThreadPool(4)) vì từ JDK 19 ExecutorService là AutoCloseable; đặt tên thread; cảnh báo theo số thread hoặc container_memory_working_set_bytes vì p99 vẫn bình thường (15,2 ms) tới tận lúc chết",
    ],
    model:
      "Exit Code 137 là 128 + 9 — tiến trình nhận SIGKILL từ kernel vì bộ nhớ của cgroup chạm limits.memory. Đó không phải OutOfMemoryError của JVM, nên ứng dụng không kịp ghi gì vào log. Câu hỏi đầu tiên ai cũng hỏi là heap, và nó rẻ nhất để trả lời: GC.heap_info ở giây 80 cho Tenured ~85 MB trong trần 128 MB, young GC đều đặn, và heap không lớn lên theo thời gian (diff NMT: Java Heap chỉ +10 MB). Vậy heap dump sẽ không tìm thấy gì — với một pod còn mười mấy giây để sống, đó là thời gian bị phí. Cái đang lớn là ở ngoài heap. NMT summary.diff so với baseline chỉ thẳng: trong 281 MB committed tăng thêm, 252 MB thuộc Thread; stack reserved +6 668 MB chính là 1 MB × khoảng 6 668 thread mới, vì mỗi platform thread được reserve một stack theo -Xss, mặc định 1 MB trên Linux x64. Đừng hoảng với con số reserved 8 GB lớn hơn cả giới hạn: không ai bị giết vì reserved, cgroup chỉ tính trang đã thật sự chạm tới; mỗi thread chỉ commit khoảng 34 KB stack — nhỏ, nhưng nhân với 7 000. Câu hỏi 'vì sao RSS còn xa giới hạn mà vẫn bị giết' nằm ở bảng cgroup: NMT nói 391 MB committed, RSS nói 340 MB, cgroup nói 481 MB — ba con số, ba định nghĩa. Phần chênh giữa RSS và cgroup gần như đúng bằng kmem, bộ nhớ kernel cấp cho tiến trình: mỗi thread cần kernel stack, task_struct, page table, khoảng 23 KB mỗi thread trong lần đo này (161 MB / ~7 000). Nó không nằm trong heap, RSS hay NMT, nhưng cgroup v1 tính nó vào memory.usage_in_bytes (cgroup v2 cũng tính bộ nhớ kernel vào memory.current), và kernel dùng con số đó. Vì thế dashboard RSS trông an toàn trong khi pod đang tiến tới cái chết. Còn ai tạo thread: thread dump ở giây 15 có 1 200 thread tên pool-…, thuộc 300 pool khác nhau, mỗi pool 4 thread, tất cả WAITING (parking) trong ThreadPoolExecutor.getTask — chờ việc mãi mãi. pool-N-thread-M là tên mặc định của Executors.defaultThreadFactory(), N tăng mỗi khi có pool mới; 300 pool trong 15 giây ở 20 rps nghĩa là đúng một pool mỗi request. Tìm Executors.new trong code dẫn thẳng tới export(): Executors.newFixedThreadPool(4) mỗi request để 'song song cho nhanh', không bao giờ shutdown. Sửa: dùng một pool chung là bean được quản lý vòng đời (ThreadPoolTaskExecutor với setThreadNamePrefix), hoặc nếu thật sự cần pool cục bộ thì try (var pool = Executors.newFixedThreadPool(4)) { … } — từ JDK 19 ExecutorService là AutoCloseable, close() chờ việc xong rồi shutdown. Đo lại cùng tải 100 giây: số thread phẳng ở 119, RSS ~170 MB, p99 /export 5,7 ms, 0 lỗi. Đặt tên thread cho mọi pool: export-worker-3 tự chỉ ra code, pool-297-thread-3 thì không. Bài học cảnh báo quan trọng nhất: p99 của bản lỗi là 15,2 ms — độ trễ trông bình thường cho tới lúc chết; alert chỉ dựa trên latency hay error rate im lặng suốt 90 giây, còn alert trên jvm.threads.live hoặc container_memory_working_set_bytes kêu từ phút đầu.",
    redFlags: [
      "Kết luận OOMKilled nghĩa là heap đầy và lấy heap dump trước tiên",
      "Đọc reserved 8 GB của NMT là lượng bộ nhớ thực sự bị tính vào giới hạn",
      "Coi RSS là con số kernel dùng để quyết định giết pod",
      "Sửa bằng cách tăng limits.memory mà không tìm ra pool bị tạo mỗi request",
    ],
    probes: [
      "Vì sao NMT phải được bật từ lúc khởi động, và chi phí của nó là gì?",
      "Nếu pod này chạy virtual thread thay vì platform thread, mặt bộ nhớ của lỗi sẽ khác thế nào?",
      "Bạn đặt alert theo hình dạng nào để bắt được loại rò rỉ này từ sớm?",
    ],
    refs: ["uh-26", "uh-25"],
  },
  {
    id: "uh-iq23",
    field: "under-hood",
    topic: "uh-diag",
    level: 3,
    minutes: 11,
    question:
      "Một service Spring Boot heap 8 GB, khoảng 2 000 platform thread, đang phục vụ tải thật. Bạn nghi vừa có request kẹt, vừa có thứ gì đó trong heap lớn dần. Bộ đồ nghề trong tay: Thread.print, Thread.dump_to_file -format=json, JFR.start, hai lần GC.class_histogram, GC.heap_dump, async-profiler. So sánh đánh đổi của từng công cụ trên một hệ đang có tải và nói bạn dùng chúng theo thứ tự nào.",
    tradeoffs: [
      {
        option: "Thread.dump_to_file -format=json",
        when: "Bước đầu tiên khi cần biết thread đang làm gì: không tạo safepoint nào, ghi cả virtual thread và nhóm theo container. Nhược điểm: chỉ là một khoảnh khắc — với request ngắn hay sự cố định kỳ, một bản chụp rất dễ trượt.",
      },
      {
        option: "Thread.print",
        when: "Khi cần phát hiện deadlock hoặc dòng 'waiting to lock / locked' kèm địa chỉ monitor; đổi lại là một safepoint PrintThreads tỉ lệ với số thread × độ sâu stack — 18 ms với 63 thread, khoảng 434 ms với 2 000 thread. Không thấy virtual thread đang chờ.",
      },
      {
        option: "JFR.start (settings=profile, ngưỡng sự kiện hạ thấp khi cần)",
        when: "Khi cần thống kê cả một khoảng thời gian — CPU, cấp phát, khoá, GC — thay vì may rủi của một khoảnh khắc; trả một lần ~10 ms (RedefineClasses) lúc bắt đầu và chi phí gần cố định 1–2,5% một lõi. Phải nhớ ngưỡng mặc định của jdk.JavaMonitorEnter (10–20 ms) và giới hạn stackdepth 64.",
      },
      {
        option: "Hai lần GC.class_histogram cách vài phút",
        when: "Khi nghi rò rỉ heap: cho biết kiểu object nào đang lớn lên, rẻ hơn heap dump nhiều; nhưng mỗi lần vẫn duyệt cả heap trong safepoint (44–49 ms với heap 45–66 MB), trên 8 GB là hàng giây, và chỉ cho kiểu chứ không cho ai giữ.",
      },
      {
        option: "GC.heap_dump",
        when: "Chỉ khi đã quyết và cần đường tới GC root: dừng JVM tỉ lệ với heap (84 ms cho 66 MB, nhiều giây với 8 GB), cần đĩa trống bằng kích thước heap trong pod, và file chứa dữ liệu nhạy cảm.",
      },
      {
        option: "async-profiler",
        when: "Khi cần thấy cả frame native và kernel với các chế độ cpu/alloc/lock/wall; trong container perf_event_open thường bị seccomp chặn nên phải dùng -e ctimer hoặc -e itimer, và đây là công cụ ngoài JDK phải mang vào pod.",
      },
    ],
    mustCover: [
      "Thứ cần cân là safepoint phía service chứ không phải thời gian chạy lệnh jcmd (150–300 ms, chủ yếu khởi động tiến trình jcmd); thứ tự khi có tải: thread dump JSON → JFR → histogram → heap dump",
      "Thread.dump_to_file -format=json không tạo safepoint và thấy cả virtual thread; Thread.print dừng cả JVM tỉ lệ số thread × độ sâu (18 ms với 63 thread, khoảng 434 ms với 2 000 thread) nhưng có phát hiện deadlock và địa chỉ monitor",
      "Một thread dump là một khoảnh khắc — trong capstone chỉ 1 trên 10 bản bắt được spike — nên cần nhiều bản hoặc JFR; JFR ghi thời lượng chờ cho cả khoảng thời gian với chi phí gần cố định 1–2,5% một lõi, nhưng phải hạ ngưỡng jdk.JavaMonitorEnter (mặc định 10–20 ms) và tăng stackdepth khi stack sâu",
      "Hai histogram cách vài phút chỉ ra kiểu đang lớn lên và thường đủ, rẻ hơn heap dump; nhưng mỗi lần vẫn dừng JVM tỉ lệ với heap (44–49 ms với 45–66 MB), trên 8 GB là hàng giây",
      "Heap dump đắt nhất: dừng tỉ lệ với heap, cần đĩa trống bằng heap trong pod, chứa dữ liệu nhạy cảm; chỉ dùng khi cần đường tới GC root — và vô ích nếu thứ đang lớn nằm ngoài heap (khi đó cần NMT, phải bật từ đầu)",
    ],
    model:
      "Trên một hệ đang có tải, câu hỏi không phải 'công cụ nào mạnh nhất' mà 'công cụ nào bắt mọi thread dừng lại ở safepoint, và dừng bao lâu'. Mỗi lệnh jcmd tốn 150–300 ms thời gian thực, nhưng phần đó là khởi động chính tiến trình jcmd; cái người dùng chịu là safepoint phía service, đo được bằng -Xlog:safepoint. Từ đó tôi sắp thứ tự. Đầu tiên là Thread.dump_to_file -format=json: không tạo safepoint nào, ghi cả virtual thread. Nhưng tôi nhớ nó chỉ là một khoảnh khắc: trong capstone, mười bản chụp cách nhau 0,2 s chỉ một bản bắt được spike, và thread ăn CPU tìm được qua top -H đã WAITING khi dump tới. Nên tôi chụp vài bản cách nhau vài giây. Thread.print chỉ dùng khi cần thứ nó có — phát hiện deadlock, dòng 'waiting to lock <0x…> / locked' để thấy ai giữ monitor — vì nó là safepoint PrintThreads tỉ lệ số thread × độ sâu: 18 ms với 63 thread, còn với 2 000 thread như service này là khoảng 434 ms đứng yên toàn JVM. Tiếp theo là JFR.start với settings=profile: bật được trên JVM khởi động không có JFR, trả một lần khoảng 10 ms để chèn bytecode sự kiện, sau đó chi phí gần cố định 1–2,5% một lõi. Nó trả lời bằng thống kê cả khoảng thời gian thay vì may rủi: hot-methods, allocation-by-site, contention-by-site, gc. Hai bẫy: cấu hình mặc định chỉ ghi jdk.JavaMonitorEnter khi chờ từ 10–20 ms, nên 'không thấy sự kiện khoá' không có nghĩa là không tranh chấp — hạ #threshold=1ms; và stackdepth mặc định 64 có thể cắt mất đáy stack, đúng chỗ có code của mình. Cho câu hỏi heap lớn dần, tôi dùng hai GC.class_histogram cách vài phút trước heap dump: hai lần chụp cho biết cái gì đang lớn lên, thường đủ để chỉ ra kiểu object — nhưng mỗi lần vẫn duyệt cả heap trong safepoint: 44–49 ms với heap 45–66 MB, nên với 8 GB là hàng giây; tôi chấp nhận đúng hai lần, không chạy định kỳ. Heap dump là bước cuối, khi đã quyết và cần đường tới GC root: dừng JVM tỉ lệ với heap — 84 ms cho 66 MB, nhiều giây cho 8 GB — cần 8 GB đĩa trống trong pod, file chứa dữ liệu nhạy cảm, nên cũng không để /actuator/heapdump lộ ra ngoài. Và nó vô ích nếu thứ đang lớn nằm ngoài heap; khi heap_info cho thấy heap phẳng, câu hỏi chuyển sang NMT — vốn phải bật từ lúc khởi động. async-profiler đáng có trong bộ đồ nghề vì lấy mẫu bằng tín hiệu hệ điều hành, thấy cả frame native và kernel, có chế độ cpu, alloc, lock, wall; nhưng trong container perf_event_open thường bị seccomp chặn nên phải dùng -e ctimer hoặc -e itimer, và phải mang nó vào pod. Trên JDK 25, JFR jdk.CPUTimeSample cũng thấy thời gian trong kernel mà lấy mẫu kiểu cũ hụt. Tóm lại thứ tự của tôi: thread dump JSON nhiều lần → JFR với ngưỡng hợp lý → hai histogram → heap dump chỉ khi cần, và giữ mọi file lại trước khi ai đó restart pod.",
    redFlags: [
      "Coi thread dump là miễn phí trên một JVM có hàng nghìn thread",
      "Lấy heap dump làm bước đầu tiên để tìm rò rỉ trên heap 8 GB đang có tải",
      "Kết luận không có tranh chấp khoá vì JFR cấu hình mặc định không có sự kiện JavaMonitorEnter",
      "Dựa vào một bản thread dump duy nhất để kết luận 'không thấy gì'",
    ],
    probes: [
      "Vì sao script cảnh báo 'quá nhiều thread BLOCKED' không thấy gì nếu code dùng ReentrantLock?",
      "JFR CPU-time profiling (JEP 509) thấy được điều gì mà jdk.ExecutionSample hụt?",
      "Nếu agent APM chụp thread dump mỗi 10 giây trên service 2 000 thread, cái giá là bao nhiêu?",
    ],
    refs: ["uh-25", "uh-18", "uh-26"],
  },
  {
    id: "uh-iq24",
    field: "under-hood",
    topic: "uh-diag",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Endpoint /catalog có p50 dưới 1 ms ổn định suốt ngày, không lỗi nào, nhưng alert p99 cứ vài phút lại kêu rồi tự hết. Biểu đồ p99 theo từng giây có những cụm nhô lên 150–380 ms trong khi các giây còn lại 1–14 ms. Không có deploy nào gần đây. Cả đội đều nghĩ ngay tới GC.",
      scale:
        "200 rps vào /catalog; catalog là một Map khoảng 600 000 phần tử trong bộ nhớ, có job nền làm mới định kỳ. Pod giới hạn bộ nhớ dưới 1 GB, JDK 25, không ai khai báo GC. p99 cả lần đo khoảng 124 ms, max khoảng 383 ms.",
      constraints:
        "Không restart pod để thêm cờ trước khi có bằng chứng; chỉ dùng công cụ đi kèm JDK qua jcmd. Không được tắt job làm mới catalog. Cần một bản sửa xác nhận được trên chính biểu đồ p99.",
    },
    question:
      "Bạn là on-call lúc 2 giờ sáng: bắt đầu từ đâu, điều tra theo trình tự nào để tìm ra nguyên nhân của các đỉnh p99 này, và sửa thế nào — kể cả khi hóa ra có nhiều hơn một nguyên nhân?",
    mustCover: [
      "Bắt đầu từ biểu đồ, không từ code: hình dạng răng cưa đều với chu kỳ khoảng 15 giây, không gắn mốc thay đổi nào, trỏ tới thứ chạy định kỳ — job @Scheduled, cache hết hạn đồng loạt, batch, hoặc GC; giữ bằng chứng trước khi restart",
      "Loại trừ GC trước vì rẻ: log GC cho young pause lớn nhất ~12 ms, không giải thích các cụm ở giây 14, 29, 44 — nhưng có một Pause Full ~266 ms trùng cụm lớn nhất ở giây 59–60: hai nguyên nhân chồng nhau trong cùng một biểu đồ",
      "Thread dump là khoảnh khắc: 10 bản cách nhau 0,2 s chỉ 1 bản bắt được spike; bản đó cho thấy thread catalog-refresh RUNNABLE giữ monitor (locked <0x…eadc0080>, Class OrderSvc) trong lúc dựng lại map, còn các thread http-nio BLOCKED 'waiting to lock' cùng địa chỉ",
      "JFR với jdk.JavaMonitorEnter#threshold=1ms (mặc định 10–20 ms): contention-by-site chỉ OrderSvc.product 113 lần, trung bình 93,6 ms, max 232 ms; sự kiện dồn thành cụm cách nhau đúng 15 giây; previousOwner phần lớn là các thread http-nio khác — một convoy",
      "Sửa khoá: dựng map mới ngoài khoá rồi công bố bằng một lần gán tham chiếu volatile, người đọc không cần khoá vì map bất biến và được publish qua volatile — p99 tổng 124,3 → 13,2 ms; với Spring, Caffeine refreshAfterWrite làm đúng việc này trên executor riêng",
      "Cụm còn lại ở giây 59 là Full GC (~259 ms) của SerialGC, được JVM chọn ngầm vì giới hạn bộ nhớ dưới 1 792 MB, phải dọn ~75 MB rác mỗi lần dựng lại; -XX:+UseG1GC thay bằng vài pause 25–53 ms (p99 13,2 → 14,5 ms) — một đánh đổi, nên khai báo GC tường minh",
    ],
    model:
      "Lúc 2 giờ sáng, tôi bắt đầu từ biểu đồ chứ không từ code, và hỏi hai câu: cái gì đã thay đổi, và triệu chứng có hình dạng gì theo thời gian. Ở đây không có deploy, p50 không nhúc nhích, còn p99 là răng cưa đều với chu kỳ khoảng 15 giây — đó là chữ ký của một thứ chạy định kỳ: job @Scheduled, cache hết hạn đồng loạt, batch, hoặc GC. Tôi không restart gì cả, vì restart xoá đúng trạng thái cần xem; mọi bằng chứng lấy qua jcmd trên pod đang bị ảnh hưởng, từ rẻ đến đắt. Bước một, loại trừ GC trước vì nó rẻ nhất: log GC (bật sẵn, hoặc bật nóng bằng VM.log) cho 159 lần young GC, lớn nhất ~12 ms — không giải thích các cụm ở giây 14, 29, 44. Nhưng có một dòng Pause Full (Allocation Failure) 266 ms ở giây 60, trùng cụm lớn nhất ở giây 59. Kết luận một nửa: có hai nguyên nhân chồng nhau trong cùng một biểu đồ, và nếu tôi dừng ở 'GC ổn' hay 'là GC' thì đều sai. Bước hai, thread dump, nhớ rằng nó là một khoảnh khắc: chụp mười bản cách nhau 0,2 s quanh thời điểm spike, chỉ một bản bắt được — nhưng bản đó nói hết: thread catalog-refresh RUNNABLE đang dựng chuỗi trong rebuildCatalog, 'locked <0x00000000eadc0080> (a java.lang.Class for OrderSvc)', và mười thread http-nio BLOCKED (on object monitor), 'waiting to lock' đúng địa chỉ đó. Một thread giữ, mười thread chờ. Nếu chỉ chụp một bản và rơi vào chín bản kia, tôi sẽ kết luận 'không thấy gì' — nên bước ba quan trọng hơn: JFR cho thống kê thay vì may rủi. Cấu hình mặc định chỉ ghi jdk.JavaMonitorEnter khi chờ quá 10–20 ms, nên tôi hạ ngưỡng: jcmd JFR.start settings=profile jdk.JavaMonitorEnter#threshold=1ms. jfr view contention-by-site: OrderSvc.product 113 lần, trung bình 93,6 ms, max 232 ms. Nhóm theo thời điểm, sự kiện dồn thành ba cụm cách nhau đúng 15 giây — khớp biểu đồ. Trường previousOwner cho thấy chỉ 3 lần chủ khoá trước là catalog-refresh, còn lại là 55 thread http-nio khác: job giữ khoá suốt lúc dựng map 600 000 phần tử, request xếp hàng, khi job nhả thì chúng lần lượt lấy khoá — một convoy, mỗi request chờ cả job lẫn những request đứng trước. Sửa nguyên nhân chính: dựng map mới ngoài khoá, rồi gán vào một field volatile trong một lần ghi; người đọc không cần khoá vì map đã bất biến và được công bố qua volatile — happens-before từ lần ghi volatile tới các lần đọc sau. Với Spring, @Scheduled + synchronized quanh cache là đúng mẫu lỗi này; Caffeine refreshAfterWrite làm việc dựng lại trên executor riêng. Xác nhận trên chính biểu đồ: p99 tổng từ 124,3 xuống 13,2 ms, ba trong bốn cụm biến mất. Cụm còn lại ở giây 59 là nguyên nhân thứ hai: mỗi lần dựng lại tạo ~75 MB object mới, map cũ thành rác, và SerialGC — được JVM chọn ngầm vì giới hạn bộ nhớ dưới 1 792 MB, không ai trong đội quyết định — phải dọn old gen bằng một Full GC 259 ms dừng mọi thứ. Đổi sang -XX:+UseG1GC thay một lần dừng 259 ms bằng vài pause 25–53 ms, không còn Full GC; p99 tổng nhích từ 13,2 lên 14,5 ms. Đó là một đánh đổi chứ không phải 'sửa', và bài học là khai báo GC tường minh thay vì để JVM tự đoán từ kích thước container. Sau sự cố: cảnh báo theo hình dạng — p99 dao động có chu kỳ — và để JFR chạy liên tục như hộp đen để lần sau không phải trông vào may rủi của thread dump.",
    redFlags: [
      "Kết luận ngay là GC và chỉ đi chỉnh tham số GC",
      "Dựa vào một bản thread dump duy nhất và kết luận 'không thấy gì'",
      "Restart pod trước để 'cho ổn' rồi mới điều tra",
      "Sửa bằng cách đổi synchronized sang ReentrantLock mà vẫn giữ khoá suốt lúc dựng map",
    ],
    probes: [
      "Vì sao người đọc map mới không cần khoá sau khi bạn chuyển sang tham chiếu volatile?",
      "Nếu code dùng ReentrantLock thay vì synchronized, dấu vết trong thread dump và JFR sẽ khác thế nào?",
      "Với kịch bản CPU cao ngay sau deploy, hình dạng biểu đồ và bước điều tra đầu tiên khác ở đâu?",
    ],
    refs: ["uh-26", "uh-17", "uh-16"],
  },
];
