// Lộ trình đọc Java Under the Hood — Phần 1 (Tuần 1–7).
//
// Nguồn: series tiếng Việt "Java Under the Hood" — 26 bài + bài lộ trình, 6 chặng.
// Thư mục nguồn: sources/under-hood/ (NN-slug.md ↔ doc id uh-NN).
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào bài, không chép lại nội dung bài.
// Link mục dạng [§N Tiêu đề mục](#/docs/uh-NN) — N là số mục "## N" có thật trong đúng tệp
// uh-NN; uh-00 không đánh số mục nên dùng [Lộ trình series](#/docs/uh-00).
// GIỮ NGUYÊN id (uh-w<N> / uh-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 13 tuần bám ranh giới chặng: T1 00–01 · T2 02 · T3 03–04 · T4 05–06 · T5 07–08 ·
// T6 09 + ôn chặng I–II · T7 10–11 · T8 12–13 · T9 14–15 + ôn chặng III · T10 16–17 ·
// T11 18–20 · T12 21–24 · T13 25–26 + tổng ôn.
// Môi trường thực hành: JDK 25 (bài chạy thí nghiệm trên JDK 21/25 — số của bạn sẽ khác,
// hình dạng kết quả mới là thứ cần so).

export const uhWeeksPart1 = [
  {
    id: "uh-w1",
    week: "Tuần 1",
    title: "Bức tranh toàn cảnh JVM",
    goal: "Vẽ lại được bảy chặng một chương trình Java đi qua — javac, launcher, nạp class, vùng nhớ, interpreter/JIT, GC, shutdown — và chỉ ra dấu vết quan sát được của từng chặng bằng một lệnh cụ thể.",
    practice: "Trên JDK 25, gõ lại OrderApp của bài 01: javac OrderApp.java && javap -c -p OrderApp; chạy java -Xlog:class+load OrderApp để đếm class, java -XX:+PrintCompilation OrderApp để thấy total() lên tầng, java -Xlog:gc OrderApp để đếm lần GC; chạy java -XX:NativeMemoryTracking=summary OrderApp 60000 rồi jcmd <pid> VM.native_memory summary scale=MB và jcmd <pid> Thread.print.",
    resources: [
      { label: "JUH 00 — Lộ trình series Java Under the Hood", href: "#/docs/uh-00" },
      { label: "JUH 01 — Bức tranh toàn cảnh JVM", href: "#/docs/uh-01" },
      { label: "docs.oracle.com — The Java Virtual Machine Specification, Java SE 25", href: "https://docs.oracle.com/javase/specs/jvms/se25/html/index.html" },
    ],
    items: [
      {
        id: "uh-w1-1",
        text: "Lộ trình series, quy ước và môi trường lab",
        lesson: `**Mục tiêu.** Nắm được series giả định gì ở người đọc, sáu chặng đi theo thứ tự nào, mỗi bài có nhịp cấu trúc ra sao, và dựng được môi trường JDK 25 với đủ công cụ mà các bài sau dùng.

**Đọc.** [Lộ trình series](#/docs/uh-00) — đọc "Series này dành cho ai, học được gì" để biết bốn năng lực đích (vẽ lại đường đi của một request, đọc được \`javap\`/log GC/log JIT/thread dump, chọn GC và tham số container có lý do, hiểu tính năng mới ở mức cơ chế). Lướt "Bản đồ 6 chặng và 26 bài", chú ý câu "Hỏi:" của mỗi bài — đó là câu hỏi bài sẽ trả lời. Đọc kỹ "Cấu trúc chung của mỗi bài & quy ước màu" và dòng "Môi trường đề xuất" (JDK 25 hoặc 27, Spring Boot 4.x; \`javap\`, \`jcmd\`, JFR/JMC, JOL, async-profiler, Eclipse MAT).

**Bẫy.** Đem số đo trong bài so từng con với máy mình rồi kết luận mình "sai". Khung "Về các con số trong bài" nói rõ output được chạy thật trên OpenJDK 21.0.12, 2 vCPU — máy bạn sẽ ra số khác, thứ cần so là *hình dạng* của kết quả. Bẫy thứ hai: nghĩ phải đọc tuần tự từ bài 01 mới hiểu được bài sau. Series nói mỗi chặng xây trên chặng trước nhưng từng bài vẫn đọc độc lập được.

**Tự kiểm tra.** Phần lý thuyết của series bám theo bản JDK nào, dù thí nghiệm chạy trên JDK 21? Trong quy ước màu, màu tím và màu xanh lá ứng với bộ phận nào của JVM?`,
      },
      {
        id: "uh-w1-2",
        text: "Gọi đúng tên, javac và bytecode máy ngăn xếp",
        lesson: `**Mục tiêu.** Phân biệt được JDK/JRE/JVM/HotSpot, giải thích được vì sao \`javac\` gần như không tối ưu gì, và đọc được bytecode của \`total()\` theo mô hình frame = biến cục bộ + operand stack.

**Đọc.** [§1 Vì sao một dev Spring Boot nên quan tâm](#/docs/uh-01) cho năm triệu chứng mà bài sẽ quy về từng chặng. [§2 JDK, JRE, JVM, HotSpot — gọi đúng tên](#/docs/uh-01) và chương trình mẫu \`OrderApp\` dùng xuyên suốt. [§3 Chặng 1 · \`javac\`: từ mã nguồn đến class file](#/docs/uh-01) — đọc kỹ ví dụ \`javap -p\` cho thấy một dòng \`record\` sinh cả class, khung SPRING BOOT về cờ \`-parameters\`, và mục con "Bên trong một class file" (magic number, major version). [§4 Bytecode: JVM là một máy ngăn xếp](#/docs/uh-01) — dò lại năm lệnh của \`sum += o.amount()\` trên operand stack.

**Bẫy.** Tin rằng \`javac\` đã tối ưu code của bạn. Bài nói \`javac\` dịch gần như nguyên văn, chỉ gộp hằng số; mọi tối ưu thật dồn cho JIT lúc chạy — lý do benchmark Java cần warm-up. Bẫy thứ hai: build tay không qua plugin Spring Boot rồi bất ngờ gặp lỗi "Name for argument of type … not specified". Từ Spring Framework 6.1 cơ chế đọc debug info đã bị gỡ, nên thiếu cờ \`-parameters\` là Spring không còn biết tên tham số.

**Tự kiểm tra.** Class file có major version 69 chạy được trên JVM nào trở lên? Vì sao \`count++\` trên một field lại là ba bước tách rời khi nhìn ở mức bytecode?`,
      },
      {
        id: "uh-w1-3",
        text: "Launcher, nạp class lười và các vùng nhớ",
        lesson: `**Mục tiêu.** Kể được launcher làm gì trước khi JVM chạy dòng code đầu tiên, phân biệt "nạp" với "khởi tạo" một class, và biết vì sao NMT báo nhiều hơn hẳn \`-Xmx\`.

**Đọc.** [§5 Chặng 2 · Launcher dựng JVM lên](#/docs/uh-01) — đọc danh sách việc của launcher (chú ý \`JDK_JAVA_OPTIONS\` khác \`JAVA_TOOL_OPTIONS\` ở chỗ ai đọc nó), mục con về ergonomics và hai khái niệm reserved/committed, cùng khung CONTAINER & ERGONOMICS. [§6 Chặng 3 · Nạp class: lười một cách có chủ đích](#/docs/uh-01) — đọc cột \`source:\` của log nạp class và khung NẠP ≠ KHỞI TẠO. [§7 Chặng 4 · Bộ nhớ: JVM chia RAM ra sao](#/docs/uh-01) — tính lại vì sao một \`Order\` hai field tốn 32 byte, rồi đọc bảng NMT ở mục con "Đo thật".

**Bẫy.** Nghĩ static field nằm trong Metaspace (hay PermGen). Bài chỉ ra từ JDK 7, giá trị static nằm trong object \`java.lang.Class\` *trên heap*; Metaspace chỉ chứa mô tả class — một static \`Map\` phình to là chuyện của heap. Bẫy thứ hai: tin pod \`limits.cpu: 1\` vẫn chạy G1. Với JDK 21/25, JVM chỉ coi máy là "server class" khi thấy ít nhất 2 CPU và khoảng 2 GB RAM; dưới mức đó nó âm thầm dùng Serial GC (JDK 27 mới đổi mặc định sang G1).

**Tự kiểm tra.** \`new Order[1_000]\` làm \`Order\` được nạp hay được khởi tạo, và thao tác nào mới chạy khối static của nó? Vì sao đặt \`-Xmx\` bằng đúng \`limits.memory\` của pod là công thức dẫn tới \`OOMKilled\`?`,
      },
      {
        id: "uh-w1-4",
        text: "Interpreter/JIT, GC, thread ngầm và shutdown",
        lesson: `**Mục tiêu.** Đọc được một dòng \`-XX:+PrintCompilation\`, giải thích được vì sao 20 triệu object không làm chương trình hết bộ nhớ, và vì sao một chương trình "đơn luồng" có 20 thread hệ điều hành.

**Đọc.** [§8 Chặng 5 · Thực thi: interpreter và JIT](#/docs/uh-01) — đọc bộ đếm lời gọi/back-edge, 5 tầng biên dịch, và mục con "Xem JIT làm việc" (total() lên C1 rồi C2 trong vài chục mili-giây). [§9 Chặng 6 · Garbage Collector dọn rác](#/docs/uh-01) cho TLAB và vì sao object chết trẻ rẻ. [§10 Những thread bạn không hề tạo](#/docs/uh-01) cho thread GC, JIT, Signal Dispatcher. [§11 Chặng 7 · Kết thúc: JVM tắt như thế nào](#/docs/uh-01) cho thread non-daemon và SIGTERM trên Kubernetes. Kết bằng [§12 Ghép lại: một trang để nhớ cả bài](#/docs/uh-01) — giữ bảng này làm khung cho cả chặng I–II.

**Bẫy.** Nói "Java chậm vì là ngôn ngữ thông dịch". Bài chỉ ra điều đó chỉ đúng trong vài chục mili-giây đầu với mỗi đoạn code; code nóng chạy bằng mã máy tối ưu theo profile thật. Bẫy thứ hai: dùng object pool để "giảm chi phí tạo object". Cấp phát trong TLAB chỉ là tăng con trỏ, còn pool giữ object sống lâu và đẩy chúng lên Old — thường làm GC tệ hơn; ngoại lệ là tài nguyên đắt thật như kết nối DB hay thread.

**Tự kiểm tra.** Thêm một \`new Thread(LockSupport::park).start()\` vào cuối \`main\` thì chương trình có thoát không, và đổi gì để nó thoát? Vì sao ENTRYPOINT là shell script không dùng \`exec java …\` làm graceful shutdown không bao giờ xảy ra?`,
      },
    ],
  },
  {
    id: "uh-w2",
    week: "Tuần 2",
    title: "Class file và bytecode",
    goal: "Đọc được javap -c -v của một method bất kỳ và kể lại nó làm gì từng lệnh một, đồng thời giải thích bằng bytecode vì sao count++ mất cập nhật, vì sao Long == Long sai trên production và vì sao đổi hằng số trong thư viện không có tác dụng.",
    practice: "Trên JDK 25: viết record Money(long amount, String currency) rồi javap -c -p -v để tìm attribute Record và bootstrap method; build service với -proc:none để xem có dựa vào annotation processing ngầm định không; chạy script classver.sh của bài trên BOOT-INF/lib; sửa một byte trong Counter.class (iconst_1 → aconst_null) để tự gây VerifyError.",
    resources: [
      { label: "JUH 02 — Class file & bytecode", href: "#/docs/uh-02" },
      { label: "docs.oracle.com — JVMS SE 25, Chapter 4: The class File Format", href: "https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html" },
    ],
    items: [
      {
        id: "uh-w2-1",
        text: "javap, cấu trúc class file, constant pool và descriptor",
        lesson: `**Mục tiêu.** Dùng đúng cờ \`javap\` cho từng câu hỏi, đi được hết 195 byte của class \`Counter\`, và đọc một thông báo \`NoSuchMethodError\` như đọc một descriptor.

**Đọc.** [§1 Vì sao phải đọc bytecode — và đọc bằng gì](#/docs/uh-02) cho bảng cờ \`javap\` cần nhớ. [§2 Mổ từng byte một class 195 byte](#/docs/uh-02) — đi chậm theo bảng offset, rồi đọc mục con "Constant pool: 17 loại mục" và khung GIỚI HẠN ẨN "CODE TOO LARGE". [§3 Descriptor: cách JVM đặt tên cho kiểu](#/docs/uh-02) — học bảng kiểu Java → descriptor, mẹo nhớ \`J\`/\`Z\`, và khung SPRING BOOT về \`NoSuchMethodError\`.

**Bẫy.** Nghĩ mã nguồn biên dịch được với thư viện mới thì chạy được với thư viện mới. Bài nhấn mạnh tương thích nguồn ≠ tương thích nhị phân: class đã biên dịch ghi cứng descriptor (kể cả kiểu trả về) và loại lệnh invoke, nên đổi \`List\` thành \`Collection\` ở bản thư viện khác là đủ gây \`NoSuchMethodError\`. Bẫy thứ hai: coi "code too large" là giới hạn lạ của \`javac\`. Đó là hệ quả của định dạng class file dùng số 2 byte — mỗi method tối đa 65.535 byte bytecode.

**Tự kiểm tra.** Descriptor của một method nhận \`long\` và \`String\`, trả về \`boolean\` viết thế nào? Gặp \`NoSuchMethodError: 'java.util.List com.x.Y.items()'\`, bước điều tra tiếp theo mà bài gợi ý là gì?`,
      },
      {
        id: "uh-w2-2",
        text: "Tập lệnh, năm cách gọi method, new–dup–invokespecial, count++",
        lesson: `**Mục tiêu.** Đọc được một opcode lạ lần đầu gặp nhờ quy tắc đặt tên, chọn đúng lệnh \`invoke*\` mà \`javac\` sinh cho từng loại method, và chứng minh bằng bytecode vì sao \`count++\` mất cập nhật.

**Đọc.** [§4 Bản đồ tập lệnh: 202 opcode, đọc theo nhóm](#/docs/uh-02) — bảng quy tắc tiền tố/hậu tố và khung về tỉ lệ lệnh load/store. [§5 Năm cách gọi một method](#/docs/uh-02) — gõ lại chương trình gọi đủ năm lệnh \`invoke\`, đọc khung SPRING BOOT về \`invokeinterface\` trên proxy Spring Data. [§6 Mẫu hình · \`new\` – \`dup\` – \`invokespecial\`](#/docs/uh-02) cho hai bước cấp phát/khởi tạo. [§7 Mẫu hình · \`count++\` và lost update](#/docs/uh-02) — chạy chương trình \`Race\` và đọc khung "Singleton là shared state".

**Bẫy.** Nghĩ \`volatile\` làm \`count++\` an toàn. Bài đo thấy \`volatile\` không cứu được — lần đo đó còn mất nhiều hơn: nó lo chuyện *nhìn thấy* giá trị, còn đọc–tính–ghi vẫn là ba bước. Bẫy thứ hai: một field đếm \`processedCount++\` trong \`@Service\` chạy đúng mọi bài test. Bean mặc định là singleton phục vụ mọi thread Tomcat; test đơn luồng không bao giờ lộ lỗi — dùng \`AtomicLong\`/\`LongAdder\` hay \`Counter\` của Micrometer.

**Tự kiểm tra.** Vì sao gần một nửa số lệnh bytecode chỉ là chuyển dữ liệu giữa biến cục bộ và operand stack, và điều đó giải thích gì về khoảng cách \`-Xint\` với JIT? Dòng đầu tiên trong bytecode của mọi constructor là gì, và nó nói gì về thứ tự khởi tạo lớp cha?`,
      },
      {
        id: "uh-w2-3",
        text: "Exception table, switch, autoboxing và hằng số bị nướng",
        lesson: `**Mục tiêu.** Đọc được exception table của \`finally\`, try-with-resources và \`synchronized\`, đoán đúng \`javac\` chọn \`tableswitch\` hay \`lookupswitch\`, và nhận ra hai bug kinh điển do autoboxing và hằng số compile-time.

**Đọc.** [§8 Mẫu hình · Exception table: finally, try-with-resources, synchronized](#/docs/uh-02) — chú ý vì sao khối \`finally\` bị chép nhiều bản, vùng bảo vệ của try-with-resources bắt đầu ở đâu, và khác biệt giữa khối \`synchronized\` với method \`synchronized\` (cờ \`ACC_SYNCHRONIZED\`). [§9 Mẫu hình · \`switch\`: bảng nhảy và tra cứu](#/docs/uh-02) cho \`switch\` trên String qua \`hashCode()\`. [§10 Mẫu hình · Autoboxing và cái bẫy \`==\`](#/docs/uh-02). [§11 Hằng số bị "nướng" vào class khác](#/docs/uh-02) — gõ lại thí nghiệm \`Config\`/\`Client\`.

**Bẫy.** Nghĩ try/catch làm chậm code. Khi không có exception, try không tốn lệnh nào — chỉ là một dòng trong exception table; thứ đắt là *tạo* exception có stack trace. Bẫy thứ hai: so \`order.getOwnerId() == currentUser.getId()\` trên hai \`Long\`. Bài chỉ ra nó đúng trong test với id 1, 2, 3 rồi bắt đầu từ chối người dùng thật khi id vượt 127, vì \`==\` so địa chỉ hai object. Bẫy thứ ba: đổi hằng số trong jar dùng chung rồi chỉ thay jar — class dùng hằng đã chép sẵn giá trị, phải build lại.

**Tự kiểm tra.** Nếu \`FileReader\` mở file thành công nhưng constructor \`BufferedReader\` bọc ngoài ném exception, \`FileReader\` có được đóng không, vì sao? \`switch (s)\` với \`s == null\` ném \`NullPointerException\` ở bước nào — trước hay sau khi xét \`default\`?`,
      },
      {
        id: "uh-w2-4",
        text: "Attribute, annotation processing, verifier và fat jar thật",
        lesson: `**Mục tiêu.** Kể được những attribute mà Spring, Jackson, debugger dựa vào, chuẩn bị build cho thay đổi annotation processing của JDK 23, và chẩn đoán được \`VerifyError\`, \`UnsupportedClassVersionError\` trong fat jar.

**Đọc.** [§12 Attribute: class file còn mang theo những gì](#/docs/uh-02) — đọc khung "Spring đọc class file mà không nạp class". [§13 Annotation processing: khi \`javac\` chạy code của người khác](#/docs/uh-02) — đọc kỹ khung hai cái bẫy khi nâng JDK. [§14 Verifier và StackMapTable](#/docs/uh-02) — làm lại thí nghiệm sửa đúng một byte và đọc thông báo của verifier. [§15 Đọc bytecode ứng dụng Spring Boot của bạn](#/docs/uh-02) cho script \`classver.sh\` và bảng tra lỗi → bytecode. Giữ [§16 Cheat sheet: đọc bytecode trong 1 trang](#/docs/uh-02) làm phiếu tra cứu.

**Bẫy.** Tin annotation nào cũng đọc được bằng reflection. Retention mặc định là \`CLASS\`: có trong class file nhưng reflection không thấy; \`SOURCE\` thì không còn ở đâu cả. Bẫy thứ hai: gặp \`VerifyError\` trong một class mình không hề sửa rồi tắt verifier. Bài chỉ ra thủ phạm gần như luôn là công cụ sửa bytecode đời cũ (agent APM, coverage, proxy) chạy trên JDK mới — cách xử lý là nâng agent/thư viện; còn khi tắt verifier, JVM không "chạy sai một chút" mà sập hẳn.

**Tự kiểm tra.** Từ JDK 23, chỉ để processor trên classpath có còn đủ để \`javac\` chạy nó không, và Lombok báo triệu chứng gì khi thiếu cấu hình? Vì sao một ứng dụng Spring Boot quá cũ có thể chết với \`Unsupported class file major version\` ngay lúc quét classpath, dù JVM không hề từ chối class?`,
      },
    ],
  },
  {
    id: "uh-w3",
    week: "Tuần 3",
    title: "Class loading và các vùng nhớ của tiến trình",
    goal: "Dự đoán và chứng minh bằng log khi nào một class được nạp, liên kết và khởi tạo, rồi lập được bảng ngân sách bộ nhớ cho một container Spring Boot từ số đo NMT thay vì chỉ nhìn -Xmx.",
    practice: "Trên JDK 25: chạy InitDemo của bài 03 với -Xlog:class+init; mô phỏng redeploy plugin và theo dõi -Xlog:class+unload cùng jcmd <pid> VM.classloader_stats; chạy MemHog của bài 04 trong docker run --memory=512m với -XX:NativeMemoryTracking=summary, lấy jcmd <pid> VM.native_memory summary, rồi đổi -XX:MaxRAMPercentage để lỗi biến thành OutOfMemoryError có heap dump.",
    resources: [
      { label: "JUH 03 — Class loading chuyên sâu", href: "#/docs/uh-03" },
      { label: "JUH 04 — Runtime Data Areas", href: "#/docs/uh-04" },
      { label: "docs.oracle.com — JVMS SE 25, Chapter 5: Loading, Linking, and Initializing", href: "https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-5.html" },
    ],
    items: [
      {
        id: "uh-w3-1",
        text: "Class loader, uỷ quyền, danh tính class và <clinit>",
        lesson: `**Mục tiêu.** Vẽ được chuỗi ba loader của JDK cùng mô hình "hỏi cha trước", giải thích được "X cannot be cast to X" bằng danh tính (tên, loader), và chỉ ra chính xác thao tác nào kích hoạt \`<clinit>\`.

**Đọc.** [§1 Năm triệu chứng, một nguyên nhân gốc](#/docs/uh-03) làm bản đồ cho cả bài. [§2 Ba class loader của JDK và mô hình uỷ quyền](#/docs/uh-03) — kèm khung ngoại lệ loader "con trước" (Tomcat, DevTools, plugin). [§3 Danh tính của class: tên + class loader](#/docs/uh-03) — gõ lại thí nghiệm hai \`URLClassLoader\` và đọc khung DevTools. [§4 Nạp, liên kết, khởi tạo — ba thời điểm khác nhau](#/docs/uh-03) — chạy mười cách "chạm" vào class với \`-Xlog:class+init\`. [§5 \`<clinit>\`: một lần, có khoá — và khi nó thất bại](#/docs/uh-03), đặc biệt mục con "Khi \`<clinit>\` thất bại" và khung Holder idiom.

**Bẫy.** Đánh đồng "nạp class" với "chạy khối static". Bài chỉ ra nạp, liên kết và khởi tạo là ba thời điểm khác nhau, và có nhiều cách có \`Class\` trong tay mà không chạy \`<clinit>\`. Bẫy thứ hai: thấy \`NoClassDefFoundError\` là đi tìm jar thiếu. Một nửa số trường hợp là "Could not initialize class" — class có mặt, nhưng khối static đã từng ném exception; chỉ lần đầu nhận được exception gốc (từ JDK 17 lỗi sau có \`cause\` trỏ về nó).

**Tự kiểm tra.** Vì sao bạn không thể tự viết \`java.lang.String\` đặt lên classpath để thay bản thật? Vì sao Holder idiom cho singleton lười, an toàn đa luồng mà không cần \`synchronized\` hay \`volatile\`?`,
      },
      {
        id: "uh-w3-2",
        text: "Deadlock khởi tạo, CNFE/NCDFE, module, fat jar và rò rỉ Metaspace",
        lesson: `**Mục tiêu.** Nhận ra deadlock khởi tạo class trong thread dump, phân biệt \`ClassNotFoundException\` với \`NoClassDefFoundError\`, hiểu \`JarLauncher\` đọc jar lồng nhau ra sao, và tìm được class loader bị rò rỉ khi Metaspace tăng mãi.

**Đọc.** [§6 Deadlock lúc khởi tạo class](#/docs/uh-03). [§7 \`ClassNotFoundException\` và \`NoClassDefFoundError\`](#/docs/uh-03) — bảng so sánh và khung \`@ConditionalOnClass\`. [§8 Module system: lớp kiểm soát thứ hai](#/docs/uh-03) cho \`exports\`/\`opens\` và \`InaccessibleObjectException\`. [§9 Bên trong fat jar của Spring Boot](#/docs/uh-03) — đọc \`MiniLauncher\` và mục con "Hệ quả thực tế" (vì sao CDS/AOT cache cần giải nén jar). [§10 Unload class và rò rỉ Metaspace](#/docs/uh-03) — thí nghiệm redeploy 3.000 lần và mục con "Tìm loader bị rò rỉ". Giữ [§11 Bộ đồ nghề chẩn đoán class loading](#/docs/uh-03) làm bảng tra.

**Bẫy.** Tin thread \`RUNNABLE\` nghĩa là đang chạy. Thread chờ khoá khởi tạo class vẫn hiện \`RUNNABLE\` và bộ dò deadlock không thấy nó. Bẫy thứ hai: nghĩ \`close()\` một \`URLClassLoader\` là class được gỡ. \`close()\` chỉ đóng file; class chỉ được gỡ khi loader không còn ai tham chiếu và GC chạy. Bẫy thứ ba: tìm rò rỉ Metaspace bằng "object to nhất" trong heap dump — 300 loader chỉ chiếm vài chục KB heap nhưng giữ hơn 20 MB Metaspace; hãy đếm số loader.

**Tự kiểm tra.** Vì sao kiểu deploy "mỗi container một ứng dụng" hầu như không gặp rò rỉ loader, còn DevTools hay WAR trên Tomcat dùng chung thì có? Vì sao bài khuyên luôn đặt \`-XX:MaxMetaspaceSize\`?`,
      },
      {
        id: "uh-w3-3",
        text: "OOMKilled, bản đồ bộ nhớ, ba mức bộ nhớ, stack và heap trong container",
        lesson: `**Mục tiêu.** Tái hiện được một vụ \`OOMKilled\` khi heap còn trống, phân biệt reserved/committed/resident, và đọc được JVM đã tự chọn heap và GC nào cho một giới hạn container cụ thể.

**Đọc.** [§1 Tái hiện một vụ OOMKilled](#/docs/uh-04) — \`MemHog\` với \`-Xmx400m\` trong cgroup 512 MB. [§2 Bản đồ bộ nhớ của một tiến trình JVM](#/docs/uh-04). [§3 Reserved, committed, resident — ba con số khác nhau](#/docs/uh-04) — chú ý con số nào kernel dùng để giết container. [§4 Stack: frame, độ sâu và StackOverflowError](#/docs/uh-04), gồm hai mục con về tràn stack ở 1.024 frame và stack tốn bao nhiêu RAM. [§5 Heap trong container: ergonomics quyết định gì](#/docs/uh-04) — đọc kỹ bảng giới hạn container → \`MaxHeapSize\` → GC tự chọn.

**Bẫy.** Tin "committed là RAM đang dùng". Bài đo heap 1 GB committed chỉ tốn 43 MB RSS cho tới khi được ghi vào. Bẫy thứ hai: tăng \`-Xss\` để sửa \`StackOverflowError\`. Với đệ quy vô hạn do quan hệ JPA hai chiều cộng \`toString\` kiểu Lombok \`@Data\`, stack lớn hơn chỉ làm lỗi đến chậm hơn — cách sửa là DTO, \`@ToString.Exclude\` hoặc \`@JsonManagedReference\`/\`@JsonBackReference\`. Bẫy thứ ba: nghĩ "500 thread tốn 500 MB" — mỗi thread reserve 1 MB nhưng chỉ commit phần stack từng chạm tới.

**Tự kiểm tra.** Không đặt cờ nào, pod 1 GiB nhận heap tối đa bao nhiêu và GC nào trên JDK 21/25? Stack trace của \`StackOverflowError\` bị cắt ở 1.024 frame thì bạn tìm nơi vòng lặp bắt đầu bằng cách nào?`,
      },
      {
        id: "uh-w3-4",
        text: "Metaspace, code cache, direct memory và công thức ngân sách bộ nhớ",
        lesson: `**Mục tiêu.** Kể được mọi vùng nhớ ngoài heap cùng giới hạn mặc định của chúng, giải phẫu được vụ \`OOMKilled\` bằng NMT, và tự điền được công thức ngân sách bộ nhớ cho một service Spring Boot.

**Đọc.** [§6 Metaspace và compressed class space](#/docs/uh-04) và khung "Luôn đặt trần cho Metaspace". [§7 Code cache: khi JIT hết chỗ](#/docs/uh-04) — chú ý JVM phản ứng thế nào khi code cache đầy. [§8 Direct memory và bộ nhớ native](#/docs/uh-04) cùng khung "Những thứ NMT không thấy". [§9 Ghép lại: giải phẫu vụ OOMKilled](#/docs/uh-04) — đọc kỹ mục con "Bị giết hay nhận một OutOfMemoryError rõ ràng?". [§10 Công thức ngân sách bộ nhớ cho container Spring Boot](#/docs/uh-04) cùng khung về memory calculator của buildpacks. Kết bằng [§11 Bộ đồ nghề đo bộ nhớ](#/docs/uh-04) với NMT baseline/diff.

**Bẫy.** Tin "hết bộ nhớ thì JVM sẽ ném \`OutOfMemoryError\`". Chỉ khi một giới hạn của *JVM* bị chạm trước; nếu giới hạn container chạm trước thì là SIGKILL, exit 137, không log. Bài kết luận mục tiêu ngân sách là "nếu hết thì hết ở chỗ JVM thấy được". Bẫy thứ hai: coi code cache đầy là lỗi sẽ tự hiện ra. JVM không ném exception — chỉ in cảnh báo rồi tắt JIT, ứng dụng chậm dần không rõ lý do. Bẫy thứ ba: quên rằng mặc định direct memory được phép lớn bằng cả heap.

**Tự kiểm tra.** Trong thí nghiệm cgroup 768 MB, vì sao \`MaxRAMPercentage\` 50% cho kết cục "tốt hơn" 75%? Nếu RSS vượt NMT committed hơn 100 MB và tăng dần, bài gợi ý nhìn vào đâu và thử biến môi trường nào?`,
      },
    ],
  },
  {
    id: "uh-w4",
    week: "Tuần 4",
    title: "Object trong RAM và cơ chế gọi method",
    goal: "Nhẩm được kích thước của object, wrapper và collection sai số vài byte, và giải thích bằng số đo khi nào gọi qua interface thực sự đắt hơn gọi qua class — interpreter, monomorphic hay megamorphic.",
    practice: "Trên JDK 25: thêm org.openjdk.jol:jol-core vào một test, in ClassLayout.parseInstance(...).toPrintable() cho DTO lớn nhất và GraphLayout.parseInstance(list).totalSize() cho 1.000 dòng; chạy lại với -XX:+UseCompactObjectHeaders để so; chạy jcmd <pid> GC.class_histogram | head -20; chạy benchmark Dispatch của bài 06 với -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining.",
    resources: [
      { label: "JUH 05 — Một object Java thực sự nằm trong RAM như thế nào", href: "#/docs/uh-05" },
      { label: "JUH 06 — Interpreter & cơ chế gọi method", href: "#/docs/uh-06" },
      { label: "openjdk.org — JEP 519: Compact Object Headers", href: "https://openjdk.org/jeps/519" },
    ],
    items: [
      {
        id: "uh-w4-1",
        text: "Header, mark word, padding và sắp xếp field",
        lesson: `**Mục tiêu.** Giải thích được vì sao một triệu \`Long\` không tốn 8 MB, đọc được bố cục header–field–padding của một object, và kể được mark word đổi nội dung ra sao qua vòng đời object.

**Đọc.** [§1 Một triệu \`Long\` tốn bao nhiêu RAM?](#/docs/uh-05) cho bảng so \`long[]\`, \`ArrayList<Long>\`, \`HashMap<Long,Long>\`. [§2 Công cụ: tự đo bố cục object](#/docs/uh-05) — biết JOL dùng API nào (và vì sao cần \`--add-exports\`). [§3 Giải phẫu một object: header, field, padding](#/docs/uh-05) — dò lại 32 byte của \`Order\`. [§4 Mark word: 64 bit thay đổi theo vòng đời object](#/docs/uh-05) — đọc mark word qua các giai đoạn hash, khoá, tuổi GC. [§5 JVM tự sắp xếp lại field của bạn](#/docs/uh-05).

**Bẫy.** Nghĩ hash code là địa chỉ của object. Bài chỉ ra identity hash là số ngẫu nhiên, sinh lần đầu khi được hỏi rồi ghi vào header — GC di chuyển object nhưng hash không đổi. Bẫy thứ hai: tính kích thước object theo thứ tự khai báo field. JVM tự xếp lại field để lấp chỗ trống và giảm padding. Bẫy thứ ba: "object rỗng tốn 0 byte" — trên JDK 21 nó tốn 16 byte (12 header + padding).

**Tự kiểm tra.** Vì sao \`Integer\` = 16 byte còn \`Long\` = 24 byte dù chỉ hơn nhau 4 byte dữ liệu? Trong \`Order(long id, double amount)\`, 4 byte ngay sau header bị bỏ phí vì lý do gì?`,
      },
      {
        id: "uh-w4-2",
        text: "Compressed oops, wrapper và collection, Compact Object Headers",
        lesson: `**Mục tiêu.** Giải thích được vách đá 32 GB của compressed oops, ước lượng được một trang kết quả DTO tốn bao nhiêu heap, và đánh giá được Compact Object Headers (JDK 25) có lợi cho ứng dụng của bạn tới đâu.

**Đọc.** [§6 Compressed oops và vách đá 32 GB](#/docs/uh-05) — chú ý mẹo 3 bit thấp và khung "Heap 33 GB chứa được ít hơn heap 31 GB". [§7 Wrapper và collection: cái giá của sự tiện lợi](#/docs/uh-05) cho bảng kích thước JDK 21 so với JDK 25 + compact. [§8 Một DTO thật tốn bao nhiêu](#/docs/uh-05) và khung "Khi bạn nạp 1 triệu dòng". [§9 Compact Object Headers (JDK 25)](#/docs/uh-05) — đọc kỹ mục con "Đánh đổi và giới hạn". Học thuộc khung quy tắc nhẩm ở [§10 Bộ đồ nghề và quy tắc nhẩm nhanh](#/docs/uh-05).

**Bẫy.** Tin heap càng lớn càng chứa được nhiều. Vượt 32 GB là mất compressed oops, footprint tăng 15–35%, nên heap 33 GB có thể chứa ít object hơn heap 31 GB. Bẫy thứ hai: nghĩ Compact Object Headers giảm đều 4 byte mỗi object. Tiết kiệm chỉ có ý nghĩa khi vượt qua một mốc làm tròn 8 byte: \`Long\` 24 → 16 nhưng \`Integer\`, \`String\` giữ nguyên.

**Tự kiểm tra.** Nếu thật sự cần heap trên 32 GB, bài đưa ra hai hướng nào? Nhẩm kích thước \`record Point(int x, int y)\` và \`record Pair(Long a, Long b)\` trên JDK 21 rồi với compact header, sau đó kiểm chứng bằng JOL.`,
      },
      {
        id: "uh-w4-3",
        text: "Template interpreter, quickening, vtable và itable",
        lesson: `**Mục tiêu.** Mô tả được interpreter của HotSpot thực thi một opcode ở mức mã máy, giải thích được quickening, và vì sao itable khó hơn vtable khi chưa có JIT.

**Đọc.** [§1 Câu trả lời trước, giải thích sau](#/docs/uh-06) cho kết quả benchmark interface so với abstract class theo số loại object. [§2 Template interpreter: mã máy viết sẵn cho từng opcode](#/docs/uh-06) — đọc codelet của \`iadd\`. [§3 Interpreter tự sửa bytecode: quickening](#/docs/uh-06) cùng khung "Bytecode trong bộ nhớ ≠ file .class". [§4 Một lời gọi method trong interpreter](#/docs/uh-06) — bốn việc của một lời gọi và hai con trỏ entry của \`Method\`. [§5 vtable: dispatch qua class bằng một phép tra mảng](#/docs/uh-06) rồi [§6 itable: vì sao interface khó hơn](#/docs/uh-06), đọc bằng \`jhsdb clhsdb\`.

**Bẫy.** Nghĩ interpreter là một vòng \`switch\` lớn viết bằng C++. Bài cho thấy HotSpot sinh mã máy cho từng opcode lúc khởi động, mỗi codelet tự nhảy sang codelet kế tiếp. Bẫy thứ hai: tin bytecode chạy y nguyên như trong file \`.class\`. Sau khi resolve, interpreter ghi đè opcode bằng phiên bản nhanh nội bộ (\`_fast_igetfield\`…) mà \`javap\` không bao giờ thấy.

**Tự kiểm tra.** Quy tắc nào của vtable khiến dispatch qua class chỉ là một phép tra mảng, và vì sao quy tắc đó không áp dụng được cho interface? Khi JIT biên dịch xong một method, JVM làm gì để mọi lời gọi sau tự đi vào bản nhanh?`,
      },
      {
        id: "uh-w4-4",
        text: "Type profile, inline cache, megamorphic và CHA",
        lesson: `**Mục tiêu.** Đọc được output \`-XX:+PrintInlining\` (monomorphic, bimorphic, megamorphic), giải thích được chi phí thật của megamorphic nằm ở đâu, và hiểu vì sao nạp thêm một class có thể vô hiệu mã đã biên dịch.

**Đọc.** [§7 JIT xoá gần hết chi phí: type profile và inline cache](#/docs/uh-06) — câu trả lời chính của bài. [§8 Megamorphic: kẻ thù thật sự là dự đoán nhánh](#/docs/uh-06) — so kết quả mảng xếp theo loại với trộn ngẫu nhiên. [§9 CHA: khi nạp một class làm vô hiệu mã đã biên dịch](#/docs/uh-06) — thí nghiệm đưa \`S1\` vào giữa chừng và khung "Vì sao điều này quan trọng". Kết bằng [§10 Điều này có ý nghĩa gì với Spring Boot](#/docs/uh-06).

**Bẫy.** Nghĩ megamorphic chậm vì phải tra bảng. Bài đo thấy tra bảng rẻ; thứ đắt là mất inline và CPU đoán sai đích nhảy — cùng lời gọi nhanh gấp 4–6 lần khi dữ liệu có thứ tự. Bẫy thứ hai: đánh dấu \`final\` để "giúp JIT inline". CHA đã biết method có bị override hay không dựa trên các class đã nạp. Bẫy thứ ba: bỏ interface \`OrderService\` + \`OrderServiceImpl\` "vì hiệu năng" — một cài đặt thì điểm gọi monomorphic được inline như gọi trực tiếp.

**Tự kiểm tra.** Với phân bố 95% \`S0\` và 5% chia cho ba loại còn lại, C2 có inline \`S0\` không (gợi ý: \`TypeProfileMajorReceiverPercent\`)? Trong ví dụ \`Deopt\`, nạp \`S1\` bằng \`Class.forName\` mà không tạo object nào thì mã của \`sum\` có bị vô hiệu không, vì sao?`,
      },
    ],
  },
  {
    id: "uh-w5",
    week: "Tuần 5",
    title: "JIT, tiered compilation và các phép tối ưu",
    goal: "Giải thích được đường cong warm-up của một service bằng ngưỡng tầng, hàng đợi biên dịch và giới hạn CPU, rồi kể được điều kiện và thứ phá từng phép tối ưu chính của C2 — và đo chúng bằng JMH mà không bị JIT đánh lừa.",
    practice: "Trên JDK 25: java -XX:+PrintFlagsFinal -version | grep -E \"Tier[34].*Threshold|CICompilerCount\"; so một server nhỏ khi chạy mặc định và với -XX:TieredStopAtLevel=1, theo dõi jstat -compiler <pid> mỗi 10 giây; chạy Inlining của bài 08 với -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining, Escape với -Xlog:gc; viết một JMH benchmark chạy -prof gc và 3 fork rồi đọc cột Error.",
    resources: [
      { label: "JUH 07 — JIT & tiered compilation", href: "#/docs/uh-07" },
      { label: "JUH 08 — Những phép tối ưu của JIT", href: "#/docs/uh-08" },
    ],
    items: [
      {
        id: "uh-w5-1",
        text: "Năm tầng, ngưỡng và 30 giây đầu của một server",
        lesson: `**Mục tiêu.** Đọc được các ngưỡng \`Tier3*\`/\`Tier4*\` cùng hai bộ đếm lời gọi/back-edge, giải thích được vì sao tốc độ đỉnh đến sau hơn 10 giây, và vì sao giới hạn CPU làm warm-up tệ hơn nhiều.

**Đọc.** [§1 Triệu chứng: "vừa deploy xong thì chậm"](#/docs/uh-07). [§2 Năm tầng biên dịch và các ngưỡng](#/docs/uh-07) cùng khung "Biên dịch chạy song song, không chặn request". [§3 Thí nghiệm: 30 giây đầu của một server](#/docs/uh-07) và [§4 Giây đầu tiên: interpreter, profiling và hàng đợi biên dịch](#/docs/uh-07) — đếm dòng \`PrintCompilation\` theo từng nửa giây. [§5 C1 nhanh sớm, C2 nhanh muộn](#/docs/uh-07) cho đối chứng \`-XX:TieredStopAtLevel=1\`. [§6 Giới hạn CPU kéo dài warm-up — và còn hơn thế](#/docs/uh-07) và khung "CPU limit nhỏ là bẫy kép".

**Bẫy.** Tin "biên dịch làm request phải chờ". Biên dịch chạy nền, request không chờ — nhưng luồng biên dịch lấy đúng phần CPU request đang cần. Bẫy thứ hai: chỉ dùng C1 cho khởi động nhanh rồi coi là tốt hơn. Nó nhanh hơn trong khoảng 10 giây đầu nhưng tốc độ đỉnh thấp hơn 43%. Bẫy thứ ba: nghĩ pod 0,5 CPU chỉ chậm hơn chút — giây đầu chậm 26 lần, warm-up hơn 30 giây, p99 kẹt vì throttling.

**Tự kiểm tra.** Với 2 vCPU, ergonomics cho bao nhiêu luồng C1 và C2? Vì sao với \`limits.cpu: 500m\`, JVM vừa chọn Serial GC vừa vẫn giữ hai luồng biên dịch tranh nhau nửa CPU đó?`,
      },
      {
        id: "uh-w5-2",
        text: "OSR, warm-up có chủ đích và readiness trên Kubernetes",
        lesson: `**Mục tiêu.** Giải thích được vì sao vòng lặp "sống mãi" là thứ được tối ưu cuối cùng, vì sao 20.000 request warm-up vẫn chưa đủ, và thiết kế được warm-up trước khi readiness báo sẵn sàng dựa trên số đo.

**Đọc.** [§7 Vòng lặp sống mãi và OSR](#/docs/uh-07) — đọc log OSR của vòng lặp dispatcher và khung "Một lời thú nhận về đo lường". [§8 Warm-up có chủ đích: giúp nhiều, nhưng không phải phép màu](#/docs/uh-07) — đọc kỹ ba lý do 20.000 request chưa đủ. [§9 Chiến lược cho Spring Boot trên Kubernetes](#/docs/uh-07), đặc biệt mục con "Warm-up trước khi Kubernetes gửi traffic" với \`ApplicationRunner\` tự gọi HTTP vào chính ứng dụng. Giữ [§10 Bộ đồ nghề quan sát JIT](#/docs/uh-07) làm bảng tra.

**Bẫy.** Gọi vài request warm-up rồi coi là đủ. Các ngưỡng tính bằng nghìn tới chục nghìn — ngưỡng OSR của C2 là 40.000 back-edge — và profile warm-up phải giống traffic thật. Bài bắt gói tin cho thấy \`HttpClient\` của JDK mặc định thử nâng cấp HTTP/2 (\`Upgrade: h2c\`) nên server đi nhánh code khác client thật. Bẫy thứ hai: tin mọi bước nhảy throughput đều quy được về một dòng log JIT. Bài thừa nhận warm-up là tổng của nhiều cơ chế và có bước không khớp sự kiện biên dịch nào.

**Tự kiểm tra.** Vì sao bộ đếm lời gọi của \`ThreadPoolExecutor.runWorker\` mãi bằng 1, và cách duy nhất để nó lên C2 là gì? Spring Boot coi ứng dụng là \`ACCEPTING_TRAFFIC\` vào thời điểm nào so với lúc web server bắt đầu lắng nghe?`,
      },
      {
        id: "uh-w5-3",
        text: "Inlining, call site đa hình, deoptimization và escape analysis",
        lesson: `**Mục tiêu.** Đọc được cây inline của C2 và các lý do từ chối inline, giải thích được chu trình deoptimization khi giả định kiểu sai, và chỉ ra điều kiện để \`new\` trong vòng lặp nóng không cấp phát gì.

**Đọc.** [§1 Vì sao một dev Spring Boot nên quan tâm](#/docs/uh-08). [§2 C2 nhìn code của bạn như thế nào](#/docs/uh-08) — ba ý tưởng chi phối, nhất là "đơn vị biên dịch". [§3 Inlining: phép tối ưu mở đường cho mọi phép khác](#/docs/uh-08) — thí nghiệm xem cây inline, mục con "Khi nào C2 từ chối inline" và khung method trên 8000 byte. [§4 Gọi qua interface: mono-, bi-, megamorphic và deoptimization](#/docs/uh-08) gồm ba mục con đo bằng JMH, deoptimization và profile bị "nhiễm". [§5 Escape analysis: khi \`new\` không cấp phát gì](#/docs/uh-08) — thí nghiệm 500 triệu object, 0 lần GC. Đọc [§6 Loại bỏ và gộp khoá](#/docs/uh-08).

**Bẫy.** Nghĩ JVM cấp phát object trên stack. Bài khẳng định HotSpot không làm vậy: nó xoá hẳn object (scalar replacement), giữ field trong thanh ghi; không xoá được thì cấp phát trên heap như thường. Bẫy thứ hai: nghĩ method dài chỉ chậm hơn chút. Method bytecode trên 8000 byte (\`HugeMethodLimit\`) không bao giờ được JIT biên dịch khi \`DontCompileHugeMethods\` bật — thí nghiệm chênh 8,5 lần. Bẫy thứ ba: profile ghi theo vị trí bytecode, nên call site trong helper dùng chung thành megamorphic dù mỗi nơi gọi chỉ dùng một kiểu.

**Tự kiểm tra.** Trong log deoptimization, lý do \`class_check\` và hành động \`maybe_recompile\` cho biết điều gì? Nếu chỉ một trên một triệu object thoát ra field static, C2 còn scalar-replace phần còn lại không, vì sao?`,
      },
      {
        id: "uh-w5-4",
        text: "Vòng lặp, vector hoá, intrinsic và đo đúng bằng JMH",
        lesson: `**Mục tiêu.** Kể được C2 tái cấu trúc vòng lặp để dồn kiểm tra biên ra ngoài và khi nào nó vector hoá, nhận ra intrinsic, và viết được một benchmark JMH không bị dead-code elimination hay fork lệch đánh lừa.

**Đọc.** [§7 Vòng lặp: unrolling, bỏ kiểm tra biên, vector hoá](#/docs/uh-08) — mục con vector hoá với AVX-512 và "Khi nào vòng lặp không được vector hoá". [§8 Intrinsics: khi JVM "gian lận" có chủ đích](#/docs/uh-08). Đọc lướt [§9 Những phép tối ưu thầm lặng khác](#/docs/uh-08) nhưng đọc kỹ khung "Field \`final\` không phải lúc nào cũng là hằng số". [§10 Đo đúng bằng JMH](#/docs/uh-08) — đọc theo thứ tự các mục con JMH làm gì khác, ba cách sai hai cách đúng, một benchmark ba kết quả, quy tắc khi viết benchmark. [§11 Quan sát JIT trong ứng dụng thật](#/docs/uh-08) cho đường JFR, rồi giữ [§12 Ghép lại: một trang để nhớ cả bài](#/docs/uh-08).

**Bẫy.** Đo bằng \`System.nanoTime()\` quanh một vòng \`for\`. Bài cho ra 0,079 ns cho 48 phép tính nối tiếp — JIT đã xoá chính thứ bạn đo vì kết quả không ai dùng. Bẫy thứ hai: chạy benchmark một lần rồi công bố con số. Cùng code cho 8, 16 hoặc 108 ns tuỳ quyết định của C2 trong từng fork — cột \`Error\` lớn là tín hiệu phải đọc từng fork. Bẫy thứ ba: tự viết vòng \`for\` copy mảng hay \`bitCount\` "tối ưu" — làm vậy là mất intrinsic.

**Tự kiểm tra.** Vì sao cộng dồn \`float\` (\`s += a[i]\`) không được vector hoá dù phép nhân hai mảng thì được? Ngoài \`static final\`, field của loại nào được C2 tin là hằng số, và vì sao field instance \`final\` thông thường thì không?`,
      },
    ],
  },
  {
    id: "uh-w6",
    week: "Tuần 6",
    title: "Khởi động nhanh và ôn chặng I–II",
    goal: "Đo được thời gian khởi động của một service thật sự đi đâu, chọn đúng giữa AppCDS, AOT cache, CRaC và Native Image theo đánh đổi, rồi tự vẽ lại được toàn bộ đường đi của code từ javac tới mã máy C2 mà chặng I–II đã dựng.",
    practice: "Trên JDK 25: giải nén fat jar bằng java -Djarmode=tools -jar app.jar extract --destination application; huấn luyện java -XX:AOTCacheOutput=app.aot -Dspring.context.exit=onRefresh -jar app.jar rồi chạy java -XX:AOTCache=app.aot -jar app.jar và so thời gian tới response đầu; rebuild jar mà không tạo lại cache để đọc cảnh báo -Xlog:aot, rồi thử lại với -XX:AOTMode=on.",
    resources: [
      { label: "JUH 09 — Khởi động nhanh: CDS, AOT cache, CRaC, Native Image", href: "#/docs/uh-09" },
      { label: "JUH 00 — Lộ trình series (chặng I–II)", href: "#/docs/uh-00" },
      { label: "openjdk.org — JEP 514: Ahead-of-Time Command-Line Ergonomics", href: "https://openjdk.org/jeps/514" },
    ],
    items: [
      {
        id: "uh-w6-1",
        text: "Giải phẫu một lần khởi động, CDS và AppCDS",
        lesson: `**Mục tiêu.** Đo được "thời gian tới response đầu tiên" và phân loại được thread main bận gì lúc khởi động, rồi giải thích được CDS làm sẵn phần nào của việc nạp class và vì sao archive mặc định giúp rất ít cho class của ứng dụng.

**Đọc.** [§1 Vì sao một dev Spring Boot nên quan tâm](#/docs/uh-09) (rolling deploy, autoscale). [§2 Giải phẫu một lần khởi động: thời gian thật sự đi đâu](#/docs/uh-09) — đọc kỹ vì sao tiến trình tiêu 3,2 giây CPU trong 1,76 giây đồng hồ và cách lấy mẫu JFR thread main. [§3 CDS: chia sẻ class đã phân tích sẵn](#/docs/uh-09) — chuỗi việc của một lần nạp class từ jar. [§4 AppCDS: đưa class của ứng dụng vào archive](#/docs/uh-09) — bảng ba cách tạo archive và khung quy trình Spring Boot 3.3+.

**Bẫy.** Tin Spring Boot khởi động chậm chủ yếu vì phải nạp quá nhiều class. Trong service mẫu, nạp class chỉ chiếm 17% số mẫu của thread main; phần lớn là code thật sự chạy lần đầu bằng interpreter. Bẫy thứ hai: nghĩ "CDS có sẵn trong JDK rồi". Archive mặc định chỉ chứa class của JDK — 1 387 trên 4 733 class của service mẫu — nên class của ứng dụng cần AppCDS hoặc AOT cache.

**Tự kiểm tra.** Vì sao fat jar phải giải nén trước khi tạo archive CDS (nối lại với bài 03)? \`spring.context.exit=onRefresh\` khiến loại bean và code nào không vào được archive?`,
      },
      {
        id: "uh-w6-2",
        text: "AOT cache của Project Leyden, profile trong cache và Spring AOT",
        lesson: `**Mục tiêu.** Phân biệt được AOT cache với AppCDS ở chữ "linking", tạo được cache bằng quy trình một bước của JDK 25, nhận ra ba cách cache mất tác dụng âm thầm, và hiểu vì sao chất lượng lượt huấn luyện quyết định lợi ích của profile trong cache.

**Đọc.** [§5 AOT cache của Project Leyden (JDK 24–26)](#/docs/uh-09) — mục con hai bước (JEP 483) và một bước (JEP 514), bảng kết quả, và mục con "Ba cái bẫy gặp phải trong lúc làm bài". [§6 Profile trong cache: warm-up có nhanh hơn?](#/docs/uh-09) cho JEP 515 và bốn cấu hình huấn luyện. [§7 Phần cache không xoá được: code của framework](#/docs/uh-09) và mục con "Spring AOT: dời việc của framework sang lúc build".

**Bẫy.** Hiểu "AOT cache" là đã biên dịch AOT ra mã máy. Tới JDK 27, cache chứa class đã liên kết, object và profile — không chứa mã máy. Bẫy thứ hai: tin cache không dùng được thì JVM sẽ báo lỗi. Với \`AOTMode=auto\` mặc định, JVM chỉ ghi cảnh báo rồi chạy như không có cache — rebuild jar hay bật JFR mà lúc huấn luyện không bật là đủ mất toàn bộ lợi ích. Bẫy thứ ba: huấn luyện càng nhiều request càng tốt — tải lệch cho kết quả chậm hơn mặc định ở giây 6–12.

**Tự kiểm tra.** Cột "READY → response" trong bảng kết quả cho thấy giá trị gì của một lượt huấn luyện có tải? Vì sao khi AOT cache đã bật, thread main vẫn bận gần 0,9 giây và phần lớn mẫu có khung trên cùng chạy bằng interpreter?`,
      },
      {
        id: "uh-w6-3",
        text: "CRaC, GraalVM Native Image và chọn cách nào trên Kubernetes",
        lesson: `**Mục tiêu.** Kể được cái giá vận hành của CRaC và Native Image, đặt được các kỹ thuật cạnh nhau theo loại chi phí chúng nhắm vào, và biết tạo cache ở đâu trong quy trình build image để nó luôn khớp môi trường chạy.

**Đọc.** [§8 CRaC: chụp ảnh tiến trình đã ấm (tham khảo)](#/docs/uh-09) — đọc kỹ khung "Cái giá của CRaC" và khung AWS Lambda SnapStart. [§9 GraalVM Native Image: biên dịch trước toàn bộ (tham khảo)](#/docs/uh-09) cùng khung bối cảnh 2025–2026. [§10 So sánh và chọn cách nào](#/docs/uh-09). [§11 Đưa vào Spring Boot trên Kubernetes](#/docs/uh-09) — chú ý vì sao lượt huấn luyện thường nằm trong CI. Giữ [§12 Ghép lại: một trang để nhớ cả bài](#/docs/uh-09) với cột "Mất tác dụng khi".

**Bẫy.** Nói "Native Image nhanh hơn JVM". Khởi động và bộ nhớ thì đúng, nhưng throughput đỉnh thường thấp hơn C2 vì không có tối ưu theo profile lúc chạy (PGO chỉ có ở Oracle GraalVM). Bẫy thứ hai: tin CRaC là tính năng của OpenJDK — nó là dự án OpenJDK nhưng không có JEP, cần bản phân phối riêng và quyền CRIU. Bẫy thứ ba: bật \`spring.main.lazy-initialization=true\` rồi coi là xong — chi phí chỉ dời sang request đầu tiên của từng bean.

**Tự kiểm tra.** Vì sao ảnh CRaC phải được bảo vệ như chính secret, và trạng thái "duy nhất" nào bị nhân bản khi mọi pod khôi phục từ cùng một ảnh? Vì sao cách an toàn nhất là tạo cache bên trong image cuối cùng?`,
      },
      {
        id: "uh-w6-4",
        text: "Ôn chặng I–II: từ OrderApp.java tới mã máy C2",
        lesson: `**Mục tiêu.** Tự vẽ trên một trang giấy đường đi đầy đủ của một method trong service: \`javac\` sinh bytecode, class được nạp–liên kết–khởi tạo, object nằm ở vùng nhớ nào với kích thước bao nhiêu, method chạy qua interpreter rồi các tầng C1/C2 với inline và escape analysis — và chỗ nào AOT cache cắt bớt được việc.

**Đọc.** Mở [Lộ trình series](#/docs/uh-00), đọc lại phần Chặng I và Chặng II, lấy chín câu "Hỏi:" của bài 01–09 làm đề tự trả lời không mở bài. Dùng bảng [§12 Ghép lại: một trang để nhớ cả bài](#/docs/uh-01) làm khung sơ đồ, rồi đối chiếu với các trang tóm tắt [§16 Cheat sheet: đọc bytecode trong 1 trang](#/docs/uh-02), [§10 Công thức ngân sách bộ nhớ cho container Spring Boot](#/docs/uh-04), [§10 Bộ đồ nghề và quy tắc nhẩm nhanh](#/docs/uh-05) và [§12 Ghép lại: một trang để nhớ cả bài](#/docs/uh-08). Chỉ lướt lại H2 của [bài 03](#/docs/uh-03), [bài 06](#/docs/uh-06), [bài 07](#/docs/uh-07) và [bài 09](#/docs/uh-09) để kiểm tra còn nhớ nội dung từng mục.

**Bẫy.** Khi vẽ, đặt "nạp class" thành một bước làm hết lúc khởi động. Bài 01 và 03 đều nhấn mạnh nạp class là lười — một dependency build cho Java mới hơn chỉ nổ \`UnsupportedClassVersionError\` khi lần đầu chạm tới class đó. Bẫy thứ hai: vẽ JIT như một sự kiện tức thời rồi mã máy giữ nguyên mãi. Bài 06–08 cho thấy biên dịch rải rác qua hàng nghìn method trong nhiều giây, và nạp thêm một class hay một kiểu receiver mới đủ để deoptimize mã đã biên dịch.

**Tự kiểm tra.** Trong sơ đồ của bạn, một \`Order\` tạm tạo trong vòng lặp nóng có thể không bao giờ chiếm byte heap nào ở điều kiện nào, và nó tốn bao nhiêu byte trên JDK 21 khi điều kiện đó không thoả? Một pod \`limits.cpu: 500m\` vừa deploy chịu những hiệu ứng nào từ ít nhất ba bài khác nhau của chặng I–II?`,
      },
    ],
  },
  {
    id: "uh-w7",
    week: "Tuần 7",
    title: "Nền tảng GC và mổ xẻ G1",
    goal: "Giải thích được GC truy vết tìm rác từ root, vì sao chi phí của nó tỉ lệ với dữ liệu sống, và đọc được từng dòng log G1 để biết MaxGCPauseMillis thực sự điều khiển điều gì và khi nào G1 rơi về Full GC.",
    practice: "Trên JDK 25: chạy một service dưới tải với -Xlog:gc,gc+age=trace để tính tốc độ cấp phát và tỉ lệ sống sót; chụp jcmd <pid> GC.heap_dump và mở GC Roots trong Eclipse MAT; bật -Xlog:gc* để đọc một lần young GC; chạy OldChurn của bài 11 với -Xlog:gc,gc+marking,gc+ihop=debug ở -Xmx256m, -Xmx512m, -Xmx1g để tìm heap nơi Full GC biến mất.",
    resources: [
      { label: "JUH 10 — Nền tảng GC", href: "#/docs/uh-10" },
      { label: "JUH 11 — Mổ xẻ G1", href: "#/docs/uh-11" },
      { label: "openjdk.org — JEP 522: G1 GC: Improve Throughput by Reducing Synchronization", href: "https://openjdk.org/jeps/522" },
    ],
    items: [
      {
        id: "uh-w7-1",
        text: "Truy vết, GC roots, ba cách dọn và giả thuyết thế hệ",
        lesson: `**Mục tiêu.** Giải thích được vì sao vòng tham chiếu không gây leak với GC truy vết, kể được các nhóm GC root của HotSpot, và chứng minh bằng số đo rằng chi phí GC tỉ lệ với lượng object sống chứ không phải lượng rác.

**Đọc.** [§1 Vì sao một dev Spring Boot nên quan tâm](#/docs/uh-10). [§2 "Rác" nghĩa là gì: truy vết thay vì đếm tham chiếu](#/docs/uh-10) — đọc kỹ thí nghiệm một triệu vòng tham chiếu và ba điều rút ra (116,9 ms so với 4,4 ms). [§3 GC roots: điểm xuất phát của mọi lần truy vết](#/docs/uh-10) — thí nghiệm đếm root trong heap dump và khung "Ba đường dẫn từ root hay gây leak". [§4 Ba cách dọn: mark–sweep, mark–compact, copying](#/docs/uh-10). [§5 Giả thuyết thế hệ: phần lớn object chết trẻ](#/docs/uh-10) — đọc bảng tuổi \`gc+age=trace\` của service thật.

**Bẫy.** Nghĩ vòng tham chiếu giữa các entity gây memory leak. Với GC truy vết, vòng không còn đường từ root là rác; leak là khi *còn* đường — qua static, singleton, \`ThreadLocal\` trên thread pool, listener chưa huỷ đăng ký. Bẫy thứ hai: tin "GC tốn công theo lượng rác". Truy vết và copying chỉ chạm vào object sống. Bẫy thứ ba: set biến về \`null\` "cho GC chạy nhanh" — biến cục bộ hết phạm vi là hết là root; chỉ có ý nghĩa với field của object sống lâu giữ dữ liệu lớn.

**Tự kiểm tra.** Vì sao một giá trị đặt vào \`ThreadLocal\` trên thread Tomcat mà không \`remove()\` lại sống mãi? Nếu mỗi lần dọn chỉ nhìn vào một vùng mà phần lớn đã là rác thì được lợi gì, và đó là ý tưởng nào?`,
      },
      {
        id: "uh-w7-2",
        text: "TLAB, card table, write barrier, safepoint và bốn GC",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`new\` gần như miễn phí, cách young GC tìm tham chiếu từ già sang trẻ mà không quét cả thế hệ già, cái giá của write barrier trên mỗi lệnh gán tham chiếu, và vì sao log GC không ghi hết thời gian dừng.

**Đọc.** [§6 TLAB: vì sao \`new\` gần như miễn phí](#/docs/uh-10) và khung "Object tạm rẻ, object sống lâu mới đắt". [§7 Tham chiếu từ già sang trẻ: card table và remembered set](#/docs/uh-10) — thí nghiệm cache ở thế hệ già. [§8 Write barrier: cái giá của mỗi lệnh gán tham chiếu](#/docs/uh-10) — so mã máy barrier của Serial/Parallel, G1 và ZGC, đọc khung JEP 522 của JDK 26. [§9 Safepoint: khi nào GC được phép dừng thế giới](#/docs/uh-10) — phân biệt time-to-safepoint với thời gian ở safepoint. [§10 Bốn GC trên cùng một service](#/docs/uh-10) và khung "Mặc định đang thay đổi"; giữ [§11 Ghép lại: một trang để nhớ cả bài](#/docs/uh-10).

**Bẫy.** Nghĩ ghi một tham chiếu chỉ là một lệnh \`mov\`. Kèm theo là write barrier: 3 lệnh với Serial, khoảng 50 với G1 trên JDK 25 (12 từ JDK 26), cộng một memory fence ở đường chậm. Bẫy thứ hai: log GC ghi pause 5 ms là ứng dụng chỉ dừng 5 ms — chưa tính thời gian chờ các thread tới safepoint, có thể dài hơn nhiều lần. Bẫy thứ ba: nghĩ cache ở thế hệ già không ảnh hưởng young GC — trong thí nghiệm, pause tăng 10 lần vì phải quét card bẩn và chép object mới mà cache trỏ tới.

**Tự kiểm tra.** Khi p99 có gai mà log GC không giải thích được, bài gợi ý bật log nào (rẻ, dùng được trên production) và so hai con số nào? Ngoài GC, những thao tác nào khác cũng cần safepoint?`,
      },
      {
        id: "uh-w7-3",
        text: "Region, đọc một lần young GC và MaxGCPauseMillis",
        lesson: `**Mục tiêu.** Mô tả được heap G1 chia region và gán vai trò động ra sao, đọc được từng pha của một dòng log young GC, và giải thích được MaxGCPauseMillis là đầu vào của mô hình dự đoán chứ không phải lời hứa.

**Đọc.** [§1 Vì sao một dev Spring Boot nên quan tâm](#/docs/uh-11). [§2 Heap chia thành region](#/docs/uh-11) — kích thước region, ba nhóm thread, và mục con "Cái giá ngoài heap" với bảng NMT mục "GC". [§3 Một lần young GC, đọc từng dòng](#/docs/uh-11) — dò bảy chú thích ①–⑦ và khung "Một pause 'lạ' trong cùng log". [§4 MaxGCPauseMillis: G1 dự đoán rồi co giãn thế hệ trẻ](#/docs/uh-11) — công thức pause dự đoán, thí nghiệm năm mục tiêu, và khung "Vậy MaxGCPauseMillis=200 hứa hẹn điều gì?".

**Bẫy.** Đọc \`MaxGCPauseMillis\` là thời gian pause tối đa. Nó là mục tiêu cho mô hình dự đoán, có thể bị vượt, và không bao trùm Full GC hay thời gian chờ safepoint. Bẫy thứ hai: hạ con số này "cho latency tốt hơn". Từ 200 xuống 10 ms không đổi gì; xuống 1 ms làm GC dày gấp 3, 52% vẫn trượt mục tiêu và throughput giảm 23%. Bẫy thứ ba: đặt \`-Xmn\` để young gen "ổn định" — làm vậy là tắt khả năng co giãn mà G1 dùng để giữ mục tiêu pause.

**Tự kiểm tra.** Heap của G1 có phải là tất cả bộ nhớ GC dùng không — NMT đo được bao nhiêu ngoài heap ở heap 256 MB và 2 GB? Một pause đơn lẻ dài bất thường trên máy 2 vCPU đang chạy cả bộ sinh tải nên được đọc thế nào trước khi tinh chỉnh?`,
      },
      {
        id: "uh-w7-4",
        text: "Marking đồng thời, mixed GC, humongous và khi G1 thất bại",
        lesson: `**Mục tiêu.** Kể đúng thứ tự một chu kỳ Concurrent Start → Remark → Cleanup → mixed GC, nhận diện humongous allocation trong log, và đọc được chuỗi sự kiện dẫn tới evacuation failure rồi Full GC.

**Đọc.** [§5 Chu kỳ marking đồng thời](#/docs/uh-11) — IHOP mặc định 45%, adaptive IHOP, và thí nghiệm \`OldChurn\`; chú ý vai trò SATB của write barrier trong lúc marking. [§6 Mixed GC: dọn dần thế hệ già](#/docs/uh-11) — đối chiếu từng con số với \`G1MixedGCCountTarget\`, \`G1HeapWastePercent\`, \`G1MixedGCLiveThresholdPercent\`. [§7 Humongous object](#/docs/uh-11) và khung "Payload lớn". [§8 Khi G1 thất bại: evacuation failure và Full GC](#/docs/uh-11). [§9 Đọc log G1 trên production](#/docs/uh-11) — cấu hình log thường trực, bảng "Thấy trong log → làm gì" và khung Actuator. Giữ [§10 Ghép lại: một trang để nhớ cả bài](#/docs/uh-11).

**Bẫy.** Nghĩ G1 dọn thế hệ già bằng một lần GC lớn. G1 marking đồng thời rồi dọn qua nhiều mixed GC nhỏ — mỗi lần dưới 11 ms trong thí nghiệm; lần dọn lớn toàn heap là Full GC, tức là thất bại. Bẫy thứ hai: coi Full GC thỉnh thoảng là bình thường — với G1 nó nghĩa là cơ chế bình thường không theo kịp, nên có cảnh báo. Bẫy thứ ba: tin humongous object luôn xấu và vội tăng \`G1HeapRegionSize\`. Chúng lãng phí bộ nhớ và kích hoạt marking, nhưng không bị chép và được dọn sớm bằng eager reclaim; đổi region lớn hơn có thể làm chậm hơn.

**Tự kiểm tra.** Với region 1 MB, object từ bao nhiêu byte trở lên là humongous, và vì sao mỗi lần cấp phát humongous lại là một lần kiểm tra IHOP? Khi evacuation failure xảy ra, vì sao heap *sau* GC có thể đầy hơn trước?`,
      },
    ],
  },
];
