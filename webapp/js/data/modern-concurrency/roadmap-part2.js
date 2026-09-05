// Lộ trình đọc Modern Concurrency in Java — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Modern Concurrency in Java" (O'Reilly,
// ISBN 9781098165406). Thư mục nguồn: sources/modern-concurrency/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (mc-w<N> / mc-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Tuần 9 gộp hai chương ngắn nhất (ch.7 27KB, ch.8 7KB) — tuần nhẹ về số byte
// nhưng nặng về tổng hợp: đây là chỗ người học chốt lại lựa chọn mô hình.

export const modconcWeeksPart2 = [
  {
    id: "mc-w6",
    week: "Tuần 6",
    title: "Structured concurrency: ngoại lệ, cấu hình, quan sát",
    goal: "Xử lý được lỗi của subtask theo đúng chính sách đã chọn, đặt được timeout cho scope, và đọc được trạng thái scope khi có sự cố.",
    practice: "Lấy lại ví dụ scope ở tuần 5, ép một subtask ném ngoại lệ, rồi quan sát cả scope kết thúc thế nào; sau đó thêm cấu hình timeout và lặp lại. Cuối tuần chạy `DocumentProcessor` bản có đặt tên scope, lấy một thread dump JSON bằng `jcmd` trong lúc các tác vụ còn đang chạy và tìm cho ra container mang tên scope của bạn.",
    resources: [
      { label: "MCJ 04 — Structured Concurrency", href: "#/docs/modconc-04" },
      { label: "openjdk.org — JEP 505: Structured Concurrency", href: "https://openjdk.org/jeps/505" },
    ],
    items: [
      {
        id: "mc-w6-1",
        text: "Xử lý ngoại lệ trong StructuredTaskScope",
        lesson: `**Mục tiêu.** Chọn được giữa bắt lỗi tại chỗ, để lỗi lan lên tầng trên, hay chặn lỗi ngay bên trong subtask — và nói được joiner quyết định phần nào trong đó.

**Đọc.** [Xử lý ngoại lệ trong StructuredTaskScope](#/docs/modconc-04) — đọc đoạn mở đầu trước, nó nói \`join()\` ném ra cái gì và ngoại lệ gốc nằm ở đâu bên trong. Rồi lần lượt các phần con, từ "Xử lý ngoại lệ cơ bản" tới "Các ngoại lệ chung": chạy \`OrderProcessingService\` với các kịch bản trong \`main\` để thấy pattern matching trên nguyên nhân, và so hai bản \`allSuccessfulOrThrow()\` với \`awaitAll()\` ở phần con về joiner. Hai khối "Thực hành tốt nhất" là phần cô đọng nhất, đừng lướt.

**Bẫy.** Chờ \`FailedException\` ở mọi chính sách. Sách nói rõ với \`awaitAll()\` thì \`join()\` không bao giờ ném \`FailedException\`; muốn biết cái gì hỏng, bạn phải tự bắt trong từng subtask. Bẫy thứ hai: nuốt \`InterruptedException\` — sách dặn luôn khôi phục trạng thái interrupted. Nói trước để bạn khỏi tưởng mình đọc nhầm: ở phần con "Xử lý ngoại lệ bên trong subtask", đoạn mã đánh số tới ③ nhưng danh sách giải thích bên dưới có bốn mục nên số thứ tự lệch nhau; mục này không phân xử.

**Tự kiểm tra.** Mở scope với joiner \`null\` thì ngoại lệ nào bật ra, còn \`fork()\` trên một scope đã đóng thì ngoại lệ nào? Với \`allSuccessfulOrThrow()\`, ngoại lệ mà \`join()\` ném ra đến từ subtask nào?`,
      },
      {
        id: "mc-w6-2",
        text: "Cấu hình scope: timeout, tên, thread factory",
        lesson: `**Mục tiêu.** Mở được một scope có timeout, có tên và có thread factory riêng, rồi nhận ra tên thread đó trong log của chính bạn.

**Đọc.** [Cấu hình](#/docs/modconc-04) — bắt đầu ở phần con "Tìm hiểu về Configuration": ghi lại các mặc định mà \`open()\` không kèm hàm cấu hình mang lại, rồi ba phương thức của sealed interface \`Configuration\`. Tiếp theo "Thread có tên" (chạy \`NamedThreadExample\`, nhìn tên thread in ra), "Cấu hình timeout" (chạy \`TimeoutExample\`, đọc kỹ năm chú thích đánh số), rồi "Kết hợp các tùy chọn cấu hình".

**Bẫy.** Tưởng đồng hồ timeout bắt đầu chạy khi bạn gọi \`join()\`. Khung LƯU Ý nói ngược lại: timeout tính từ lúc scope được mở, nên nó bao trùm toàn bộ vòng đời scope chứ không riêng phần chờ. Bẫy thứ hai: gọi một phương thức cấu hình rồi bỏ qua giá trị trả về. Sách mô tả đây là mẫu builder bất biến — mỗi phương thức trả về một \`Configuration\` mới thay vì sửa đối tượng hiện có.

**Tự kiểm tra.** Khi timeout hết hạn trước lúc mọi subtask xong, phương thức nào ném ngoại lệ và ngoại lệ đó tên gì? Đặt tên cho scope bằng \`withName()\` thì cái tên đó phục vụ việc gì?`,
      },
      {
        id: "mc-w6-3",
        text: "Viết Joiner của riêng bạn",
        lesson: `**Mục tiêu.** Hiện thực được một \`Joiner\` tự viết, và biết trả về \`true\` hay \`false\` ở đâu để điều khiển việc hủy các subtask còn lại.

**Đọc.** [Joiner tùy chỉnh](#/docs/modconc-04) — đọc đoạn mở đầu cho hết phần mô tả ba phương thức chính (\`onFork\`, \`onComplete\`, \`result\`), nắm \`T\` với \`R\` đại diện cho cái gì trước khi xem code. Rồi lần lượt "Thu thập mọi kết quả và ngoại lệ", "Hoàn thành dựa trên quorum" (đọc chậm mười chú thích đánh số của \`QuorumJoiner\`), "Hoàn thành thích ứng", "Joiner giới hạn tốc độ", "Joiner có điều kiện". Gõ lại ít nhất hai joiner đầu.

**Bẫy.** Viết \`onComplete\` chỉ xử lý hai kết cục thành công và thất bại. \`CollectingJoiner\` của sách xử lý cả trạng thái \`UNAVAILABLE\` — subtask đã bị hủy trước khi hoàn thành — và coi việc bị hủy như một thất bại. Bẫy thứ hai: lẫn ý nghĩa của giá trị trả về. Trả về \`false\` là để các subtask còn lại chạy tiếp; chỉ khi trả về \`true\` thì scope mới hủy phần còn lại và hoàn thành sớm.

**Tự kiểm tra.** \`onFork\` được gọi vào thời điểm nào so với lúc thread chạy subtask được tạo ra? Trong ví dụ quorum, cụm có bao nhiêu node, quorum đặt là bao nhiêu, và như vậy hệ thống chịu được mấy node hỏng?`,
      },
      {
        id: "mc-w6-4",
        text: "Nhất quán bộ nhớ, scope lồng nhau và khả năng quan sát",
        lesson: `**Mục tiêu.** Nói được scope cho sẵn bạn đảm bảo bộ nhớ nào, và lấy được một thread dump JSON rồi đọc ra cây scope trong đó.

**Đọc.** [Hiệu ứng nhất quán bộ nhớ](#/docs/modconc-04) — nắm quan hệ happens-before quanh \`fork()\` và \`join()\`; khung "CÁC TÍNH CHẤT NHẤT QUÁN BỘ NHỚ" chỉ ôn lại nền tảng, đọc nhanh cũng được. Rồi [Scope lồng nhau](#/docs/modconc-04) với Hình 4-3 và ví dụ \`DocumentProcessor\` hai tầng scope. Kết bằng [Khả năng quan sát](#/docs/modconc-04): chạy bản \`DocumentProcessor\` đã đặt tên scope và thread factory, lấy dump bằng \`jcmd <pid> Thread.dump_to_file -format=json <output_file>\` trong lúc tác vụ còn chạy, rồi đối chiếu với những điểm mấu chốt sách rút ra từ dump.

**Bẫy.** Đọc đảm bảo happens-before thành "hết phải lo thread safety". Sách nói thẳng điều ngược lại: vẫn phải dùng concurrent collection và thao tác atomic khi nhiều subtask cùng sửa trạng thái chia sẻ; scope chỉ cho bạn điểm đồng bộ ở \`fork\` và \`join\`. Bẫy thứ hai: coi scope lồng nhau chỉ là chuyện tổ chức code. Chính quan hệ cha con đó khiến lỗi và việc hủy lan truyền lên đúng đường, và scope cha chịu trách nhiệm về vòng đời của scope con.

**Tự kiểm tra.** Trong thread dump JSON, trường nào cho biết thread nào sở hữu scope, và \`parent\` của scope có tên trong ví dụ là gì? Ngoài \`jcmd\`, sách dùng lớp nào để tự sinh dump ngay khi scope gặp lỗi?`,
      },
    ],
  },
  {
    id: "mc-w7",
    week: "Tuần 7",
    title: "Scoped Values",
    goal: "Thay được một biến ThreadLocal truyền ngữ cảnh bằng ScopedValue, và nói đúng lúc nào binding biến mất, lúc nào thread con kế thừa được nó.",
    practice: "Lấy ví dụ framework lập lịch job của chương 5 và viết nó ba lần: bản truyền `JobContext` qua tham số, bản `ThreadLocal`, bản `ScopedValue`. Đặt ba chữ ký của cùng một phương thức trợ giúp cạnh nhau. Sau đó chạy `ThreadLocalLeakExample` trên pool một thread để tận mắt thấy giá trị của tác vụ trước rơi sang tác vụ sau.",
    resources: [
      { label: "MCJ 05 — Scoped Values", href: "#/docs/modconc-05" },
      { label: "openjdk.org — JEP 506: Scoped Values", href: "https://openjdk.org/jeps/506" },
    ],
    items: [
      {
        id: "mc-w7-1",
        text: "Gánh nặng truyền ngữ cảnh: ô nhiễm tham số và interface mong manh",
        lesson: `**Mục tiêu.** Gọi tên được những cái giá mà sách đặt tên riêng cho việc luồn một đối tượng ngữ cảnh qua khắp chuỗi lời gọi.

**Đọc.** [Gánh nặng của việc truyền ngữ cảnh](#/docs/modconc-05) — gõ lại ví dụ framework lập lịch job: \`JobContext\`, \`JobScheduler\`, \`UserJob\`. Chú ý riêng \`processJobData()\`: nó không dùng gì trong \`context\` nhưng vẫn buộc phải nhận \`context\`. Rồi ba phần con đặt tên cho ba triệu chứng — [Ô nhiễm tham số](#/docs/modconc-05), [Sự mong manh của interface](#/docs/modconc-05), [Sự ràng buộc và khả năng kiểm thử](#/docs/modconc-05) — mỗi phần vài đoạn, đọc trọn.

**Bẫy.** Nghĩ đây chỉ là chuyện thẩm mỹ của chữ ký phương thức. Sách nêu hệ quả thật: khi framework mở rộng \`JobContext\`, chẳng hạn thêm một trường phân loại job hay một ngữ cảnh distributed tracing, bạn có thể phải sửa mọi chữ ký phương thức trong mã người dùng đã truyền ngữ cảnh đi khắp nơi. Bẫy thứ hai: bỏ qua phần kiểm thử — ràng buộc này bắt bạn dựng một \`JobContext\` hợp lệ ngay cả cho bài kiểm thử chỉ đụng logic nghiệp vụ.

**Tự kiểm tra.** Đối tượng \`context\` đi qua những chặng nào từ \`schedule()\` cho tới lúc quay ngược lại framework? Và vì sao một phương thức trợ giúp không dùng gì trong ngữ cảnh vẫn buộc phải khai báo tham số đó?`,
      },
      {
        id: "mc-w7-2",
        text: "ThreadLocal và những hạn chế của nó",
        lesson: `**Mục tiêu.** Viết lại được framework bằng \`ThreadLocal\` để mã người dùng sạch tham số, rồi kể được đúng cái giá mới mà cách này đẻ ra.

**Đọc.** [Giới thiệu ThreadLocal](#/docs/modconc-05) — bản \`JobScheduler\` viết lại: để ý chỗ đặt \`set()\` và chỗ đặt \`remove()\`. Rồi [Những hạn chế của biến ThreadLocal](#/docs/modconc-05), phần nặng nhất mục này: \`MutableLoggingContext\` cho chuyện thay đổi không giới hạn, \`ThreadLocalLeakExample\` cho vòng đời không giới hạn, \`InheritanceOverheadExample\` cho chi phí kế thừa. Kết bằng [Hướng tới việc chia sẻ nhẹ nhàng](#/docs/modconc-05) — chỗ sách viết ra bản yêu cầu cho \`ScopedValue\`.

**Bẫy.** Cho rằng virtual thread sống ngắn nên vấn đề \`ThreadLocal\` tự tan. Sách tách bạch: vì virtual thread sống ngắn nên chuyện thread local sống dai bớt nghiêm trọng, garbage collection sẽ dọn, nhưng chi phí bộ nhớ của quá nhiều bản sao trùng lặp thì vẫn nguyên. Bẫy thứ hai: dùng \`InheritableThreadLocal\` cho tiện — ví dụ của sách gắn một mảng 10 MB rồi tạo 100 thread con, mỗi thread con giữ tham chiếu dù chẳng bao giờ đụng tới dữ liệu.

**Tự kiểm tra.** Trong \`ThreadLocalLeakExample\`, vì sao tác vụ thứ hai nhìn thấy giá trị của tác vụ thứ nhất, và một dòng lệnh đặt đúng chỗ nào sẽ chặn được điều đó? Ngoài rò rỉ bộ nhớ, sách còn nêu những rủi ro nào?`,
      },
      {
        id: "mc-w7-3",
        text: "ScopedValue: thành phần cốt lõi, cách chạy, đường di chuyển",
        lesson: `**Mục tiêu.** Gắn được giá trị bằng \`where()\` rồi chạy bằng \`run()\` hoặc \`call()\`, và nói đúng thread con nào kế thừa binding, thread con nào không.

**Đọc.** [Các thành phần cốt lõi của ScopedValue](#/docs/modconc-05) — ba đặc tính chính được sách đặt tên riêng, học thuộc chúng. Rồi [Chạy ScopedValue](#/docs/modconc-05): chạy từng biến thể theo đúng thứ tự sách bày ra, kể cả biến thể in \`Name is not bound\`; đọc khung LƯU Ý về dynamic scope; xem phần con về gắn lại trong scope lồng nhau. Tiếp theo [ScopedValue và Structured Concurrency](#/docs/modconc-05), ngắn nhưng là bản lề. Kết bằng [Di chuyển sang Scoped Values](#/docs/modconc-05): phát hiện đệ quy, giao dịch được làm phẳng, ngữ cảnh vẽ.

**Bẫy.** Tưởng thread mới tạo sẽ kế thừa binding. Sách chứng minh ngược: gọi \`thread::start\` ngay trong scope vẫn in ra \`Name is not bound\`, với cả platform thread lẫn virtual thread; chỉ trong \`StructuredTaskScope\` thread con mới tự động kế thừa. Nói trước để bạn khỏi tưởng mình đọc nhầm: chương này không nhất quán về trạng thái API — khung LƯU Ý đầu mục nói \`ScopedValue\` đã có sẵn kể từ JDK 25, đoạn cuối mục di chuyển lại nói API vẫn ở giai đoạn preview; mục này không phân xử.

**Tự kiểm tra.** Gọi \`get()\` trên một \`ScopedValue\` chưa gắn thì chuyện gì xảy ra, và chỗ đó khác \`ThreadLocal\` thế nào? Trong ví dụ gắn lại vai trò, sau khi scope lồng bên trong kết thúc thì giá trị nào có hiệu lực?`,
      },
    ],
  },
  {
    id: "mc-w8",
    week: "Tuần 8",
    title: "Reactive Java sau Loom",
    goal: "Đọc được một pipeline reactive, nói được backpressure giải quyết chuyện gì, và cân được reactive với virtual thread bằng lý lẽ thay vì cảm tính.",
    practice: "Chạy máy chủ HTTP của chương 6 ở cả ba bản: đơn luồng, đa luồng, rồi NIO. Với bản đơn luồng, gọi `/slow` bằng `curl` rồi mở terminal thứ hai gọi `/fast` để thấy nó phải xếp hàng. Sau đó ném chương trình kiểm tra tải với 10 client, mỗi client pipeline 100 request, vào bản NIO và ghi lại throughput nó in ra.",
    resources: [
      { label: "MCJ 06 — Reactive Java trong bối cảnh Virtual Thread", href: "#/docs/modconc-06" },
    ],
    items: [
      {
        id: "mc-w8-1",
        text: "Blocking so với non-blocking I/O",
        lesson: `**Mục tiêu.** Chỉ đúng chỗ một máy chủ blocking đứng khựng lại, và mô tả được vòng lặp selector của NIO thay thế chỗ đó bằng cách nào.

**Đọc.** [Tìm hiểu lập trình reactive trong Java](#/docs/modconc-06) — khung về Reactive Manifesto nêu bốn nguyên tắc then chốt rồi quy về ba khía cạnh then chốt khi triển khai; nhớ ba khía cạnh đó vì cả chương xoay quanh chúng. Sau đó [Blocking so với Non-blocking I/O](#/docs/modconc-06), mục dài nhất chương: bám theo cùng một máy chủ HTTP qua ba bản — đơn luồng, đa luồng với pool 10 thread, rồi NIO với \`Selector\`. Ở bản NIO đọc kỹ đoạn giải thích \`Selector\`, các sự kiện \`OP_ACCEPT\`, \`OP_READ\`, \`OP_WRITE\`, và vì sao \`select()\` được gọi kèm timeout.

**Bẫy.** Quên \`configureBlocking(false)\`. Sách nói thẳng thiếu dòng đó thì máy chủ sẽ block ở mọi thao tác, làm mất luôn ý nghĩa của việc dùng NIO. Bẫy thứ hai: sửa \`SelectionKey\` từ một thread xử lý bất đồng bộ — các đối tượng này không thread-safe, nên ví dụ dồn thay đổi vào một queue thread-safe rồi để chính vòng lặp chính áp dụng.

**Tự kiểm tra.** Trong bài đo bằng \`curl\`, vì sao hai trong ba request là nhanh mà tổng thời gian vẫn vượt 30 giây? Và nếu \`select()\` được gọi không kèm timeout thì máy chủ mất đi khả năng gì?`,
      },
      {
        id: "mc-w8-2",
        text: "Kiến trúc hướng sự kiện và các API bất đồng bộ",
        lesson: `**Mục tiêu.** Giải thích được vì sao một dòng code blocking đặt nhầm chỗ có thể hạ gục cả một máy chủ event-driven, và kể lại đường đi từ callback tới \`CompletableFuture\`.

**Đọc.** [Kiến trúc hướng sự kiện (Event-Driven Architecture)](#/docs/modconc-06) — bản Vert.x của ứng dụng, rồi phần giải thích mẫu multicore reactor, event loop, worker thread pool và event bus; xem Hình 6-1 để định vị mã ứng dụng của bạn nằm ở lớp nào. Chú ý handler chậm dùng \`vertx.setTimer()\` chứ không dùng \`Thread.sleep()\`. Sau đó [Các API bất đồng bộ (Asynchronous APIs)](#/docs/modconc-06): đi từ \`chat()\` đồng bộ, sang bản callback, rồi sang bản trả \`CompletableFuture<String>\`.

**Bẫy.** Nghĩ cứ đẩy mọi thứ blocking sang worker thread pool là xong. Sách cảnh báo dựa quá nhiều vào worker thread làm mất chính ý nghĩa của một hệ thống reactive: mỗi lần chuyển từ I/O thread sang worker thread rồi quay lại là thêm context switch. Nói trước để bạn khỏi tưởng mình bỏ sót một mục: mở đầu phần này sách nhắc "trò chơi đoán số" và nói sẽ viết lại nó bằng Vert.x, trong khi ví dụ trước đó lẫn đoạn mã Vert.x ngay sau đều là máy chủ HTTP; mục này không phân xử.

**Tự kiểm tra.** \`CompletableFuture\` gỡ được vấn đề nào của callback, và sách nói nó còn thiếu gì so với reactive stream? Nếu event handler của bạn gọi một truy vấn cơ sở dữ liệu blocking thì chuyện gì xảy ra với các request khác?`,
      },
      {
        id: "mc-w8-3",
        text: "Reactive Streams, backpressure, và khi nào reactive vẫn đáng dùng",
        lesson: `**Mục tiêu.** Đọc được một pipeline Reactor, gọi đúng tên vai trò từng thành phần, và chọn được chiến lược backpressure cho một tình huống cụ thể.

**Đọc.** [Lập trình Reactive trong Java](#/docs/modconc-06) rồi [Tìm hiểu về Reactive Streams](#/docs/modconc-06) — bốn thành phần cơ bản và ba loại tín hiệu đều được sách đặt tên riêng, chép đủ ra giấy; xem Hình 6-2; chạy pipeline \`Flux\` tối giản trước khi bước vào ví dụ giám sát giá tiền mã hóa. Rồi [Backpressure](#/docs/modconc-06): kịch bản giao dịch tần suất cao phát 10.000 phần tử mỗi giây, và danh sách các phương thức \`onBackpressure*\` kèm câu "dùng khi nào" của từng cái. Đừng bỏ phần con so sánh với bản viết bằng virtual thread. Kết bằng [Lợi ích và hạn chế của lập trình Reactive](#/docs/modconc-06).

**Bẫy.** Lẫn reactive stream với Java Streams. Sách dành hẳn một khung LƯU Ý: \`java.util.stream.Stream\` xử lý collection một cách đồng bộ, trong bộ nhớ; reactive stream xử lý dữ liệu bất đồng bộ, non-blocking, có backpressure. Bẫy thứ hai: mặc định chọn \`onBackpressureBuffer()\` không giới hạn cho mọi trường hợp — sách gắn mỗi chiến lược với một điều kiện, và bản có \`maxSize\` tồn tại đúng vì cần chặn cạn kiệt bộ nhớ.

**Tự kiểm tra.** Trong stack trace của ví dụ chia cho không, dòng nào thật sự chỉ đúng chỗ lỗi của bạn, còn phần còn lại là gì? Với khối lượng công việc CPU-bound, sách nói gì về lập trình reactive?`,
      },
    ],
  },
  {
    id: "mc-w9",
    week: "Tuần 9",
    title: "Framework hiện đại và tổng kết",
    goal: "Bật được virtual thread trong một ứng dụng framework mà không phải viết lại logic, rồi chốt được kế hoạch migrate cho một hệ thống có sẵn.",
    practice: "Dựng một ứng dụng Spring Boot với đúng một endpoint in ra `Thread.currentThread()`. Chạy hai lần: một lần để nguyên, một lần với `spring.threads.virtual.enabled=true`, rồi so hai dòng log. Sau đó bỏ thuộc tính đó đi và tự định nghĩa bean `applicationTaskExecutor` theo bản trong sách, kiểm lại bằng một phương thức `@Async`. Cuối tuần viết một trang kế hoạch migrate cho một dịch vụ thật của bạn, bám theo thứ tự mà chương kết luận gợi ý.",
    resources: [
      { label: "MCJ 07 — Framework hiện đại dùng virtual thread", href: "#/docs/modconc-07" },
      { label: "MCJ 08 — Kết luận và điểm rút ra", href: "#/docs/modconc-08" },
      { label: "openjdk.org — JEP 444: Virtual Threads", href: "https://openjdk.org/jeps/444" },
    ],
    items: [
      {
        id: "mc-w9-1",
        text: "Spring Boot: bật virtual thread và cấu hình thủ công",
        lesson: `**Mục tiêu.** Bật virtual thread cho cả ứng dụng bằng một thuộc tính, và biết khi nào phải tự định nghĩa executor thay vì dựa vào tự động cấu hình.

**Đọc.** [Spring Boot](#/docs/modconc-07) — bắt đầu ở đoạn nói về mô hình thread-per-request và bản \`ThreadPoolTaskExecutor\` cũ, để thấy điểm xuất phát. Rồi thuộc tính \`spring.threads.virtual.enabled=true\` ở cả hai định dạng, kèm danh sách những tính năng nó áp dụng sang. Chạy \`GreetingsController\`, \`AsyncController\`, \`ScheduledTasks\` và đối chiếu dòng log của bạn với dòng sách in ra. Đọc khung LƯU Ý về cặp executor và scheduler được chọn theo từng chế độ. Kết bằng [Cấu hình thủ công](#/docs/modconc-07) cùng khung MẸO và bean \`TomcatProtocolHandlerCustomizer\`.

**Bẫy.** Đặt thuộc tính nhưng vẫn để một bean executor riêng rồi tự hỏi vì sao không thấy virtual thread. Sách nói rõ Spring Boot chỉ tự động cấu hình \`AsyncTaskExecutor\` chạy trên virtual thread khi không có bean executor tùy chỉnh nào được định nghĩa. Bẫy thứ hai: bọc thẳng \`Executors.newVirtualThreadPerTaskExecutor()\` mà bỏ qua \`TaskExecutorAdapter\` — khung MẸO nói cả hai đều bật virtual thread, nhưng \`TaskExecutorAdapter\` tích hợp tốt hơn với việc quản lý vòng đời bean của Spring.

**Tự kiểm tra.** Hỗ trợ chính thức xuất hiện từ phiên bản Spring Boot nào, và JDK cơ sở của framework khi đó vẫn là bản nào? Khi virtual thread được bật, Spring Boot chọn executor và scheduler nào thay cho cặp mặc định?`,
      },
      {
        id: "mc-w9-2",
        text: "Quarkus và Jakarta EE",
        lesson: `**Mục tiêu.** Phân biệt được hai kiểu bật virtual thread — một công tắc toàn cục, hay bật có chọn lọc từng phương thức — và biết Jakarta EE đặt công tắc của nó ở đâu.

**Đọc.** [Quarkus](#/docs/modconc-07) — annotation \`@RunOnVirtualThread\`, rồi khung LƯU Ý giải thích vì sao nó tồn tại: Quarkus chạy trên Vert.x, và annotation này chuyển tác vụ ra khỏi event loop. Chạy ví dụ có \`@RunOnVirtualThread\` rồi đọc log. Phần \`SimpleHttpServer\` chỉ là dịch vụ giả để thử, lướt được nếu bạn đã có dịch vụ khác. Đừng bỏ ví dụ cuối, nơi \`uni.await().atMost(...)\` block một virtual thread. Rồi [Jakarta EE](#/docs/modconc-07) — trong bản dịch, mục này nằm dưới Quarkus, đó là cấu trúc của chính nguồn: đọc \`virtual = true\`, danh sách annotation nhận nó, và khung LƯU Ý về khác biệt giữa các runtime.

**Bẫy.** Coi \`virtual = true\` của Jakarta Concurrency là một đảm bảo. Sách nói khi ứng dụng chạy trên Java 17 thì runtime Jakarta EE tự quay về platform thread, và khung LƯU Ý dặn hành vi thực tế còn khác nhau giữa các runtime. Bẫy thứ hai: mang thói quen Spring Boot sang Quarkus — ở đây không có công tắc toàn cục, virtual thread bật theo từng endpoint hoặc service bằng annotation.

**Tự kiểm tra.** \`@RunOnVirtualThread\` gỡ vấn đề gì cho mô hình event loop? Và tại thời điểm sách viết, runtime Jakarta EE nào là bản đầu tiên hỗ trợ đầy đủ Jakarta Concurrency 3.1 với virtual thread?`,
      },
      {
        id: "mc-w9-3",
        text: "Tổng kết: chọn mô hình, tránh bẫy, và kế hoạch migrate",
        lesson: `**Mục tiêu.** Ứng với một ứng dụng cụ thể, chọn được giữa virtual thread, platform thread và reactive, rồi vạch ra được những bước migrate đầu tiên.

**Đọc.** [Kết luận và Điểm rút ra](#/docs/modconc-08) — chương ngắn nhất sách, nhưng đọc chậm. Đoạn về migrate cho lời khuyên rất cụ thể: bắt đầu từ những phần hoặc dịch vụ độc lập, triển khai dần từng bước, theo dõi mức sử dụng tài nguyên ngay từ lần triển khai đầu. Đoạn về cạm bẫy gom lại đúng những thứ bạn đã gặp ở tuần 3 và tuần 7: pinning, quản lý sai \`ThreadLocal\`, công cụ giám sát truyền thống không đủ. Đáng chép nhất là đoạn đặt cạnh nhau virtual thread, platform thread và reactive — viết lại thành bảng của riêng bạn.

**Bẫy.** Đọc câu "virtual thread có thể trở thành lựa chọn mặc định" thành "bật virtual thread khắp nơi ngay tuần này". Sách nói ngược lại: dù việc bổ sung rất dễ, đó không phải việc nên làm trong một sớm một chiều, nhất là với ứng dụng legacy. Bẫy thứ hai: cho rằng bản vá pinning của JDK 24 đã khép lại chủ đề — sách nhắc không phải hệ thống production nào cũng chuyển ngay từ JDK 21 lên JDK 24.

**Tự kiểm tra.** Sách xếp những loại công việc nào cho platform thread, và những kịch bản nào cho reactive? Trong kế hoạch migrate mà sách gợi ý, phần đầu tiên bạn nên chọn để chuyển là phần nào?`,
      },
    ],
  },
];
