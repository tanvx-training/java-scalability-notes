// Ngân hàng câu hỏi phỏng vấn Java Under the Hood — PHẦN 1: 12 câu (uh-iq01–uh-iq12),
// 3 chủ đề × 4 cấp độ năng lực (đúng 1 câu mỗi cấp trong mỗi chủ đề):
//   uh-found (Nền móng, bài 01–05) · uh-exec (Execution engine, bài 06–09)
//   · uh-gc (Bộ nhớ & GC, bài 10–15). Phần 2 (uh-iq13–uh-iq24) nằm ở tệp riêng.
//
// Nguồn: series tiếng Việt "Java Under the Hood" — 27 tài liệu trong sources/under-hood/.
// Mọi con số trong rubric lấy từ thí nghiệm chạy thật của bài (OpenJDK 21.0.12 / JDK 25).
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng DDIA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (uh-iq01–uh-iq12) — tiến độ localStorage lưu theo id này.

export const uhInterviewPart1 = [
  // ===== uh-found (uh-iq01–uh-iq04) =====
  {
    id: "uh-iq01",
    field: "under-hood",
    topic: "uh-found",
    level: 1,
    minutes: 5,
    question:
      "Trên production bạn gặp ba dòng lỗi: `ClassNotFoundException: com.acme.PaypalClient`, `NoClassDefFoundError: StripeClient`, và trên một service khác, mọi request đều báo `NoClassDefFoundError: Could not initialize class PriceConfig` dù jar vẫn đầy đủ. Phân biệt hai loại lỗi này: ai là bên yêu cầu class, mỗi lỗi nói lên điều gì, khi nào chúng lộ ra — và biến thể thứ ba thực chất là chuyện gì?",
    mustCover: [
      "ClassNotFoundException là exception checked, ném ra khi chính code của bạn yêu cầu class theo tên dạng chuỗi (Class.forName, loadClass, ServiceLoader, deserialization) mà không tìm thấy — có thể là chuyện bình thường, ví dụ kiểm tra một thư viện tuỳ chọn có mặt hay không",
      "NoClassDefFoundError là Error do JVM ném khi resolve một lệnh bytecode (new, invoke*, getfield…) trong code đã biên dịch: lúc biên dịch class có, lúc chạy không dùng được — luôn là lỗi cấu hình hoặc lỗi khởi tạo",
      "Biến thể thiếu jar/xung đột phiên bản có cause là ClassNotFoundException và chỉ lộ ra lần đầu dòng code dùng class đó được thực thi — ứng dụng vẫn khởi động OK, lỗi có thể xuất hiện sau vài giờ chạy",
      "'Could not initialize class X' nghĩa là <clinit> từng thất bại: lần đầu nhận ExceptionInInitializerError mang exception gốc, từ lần sau class ở trạng thái lỗi vĩnh viễn trong vòng đời class loader đó và JVM ném NoClassDefFoundError cho tới khi restart",
      "Từ JDK 17 NoClassDefFoundError có cause trỏ về exception ban đầu, JDK cũ hơn thì manh mối duy nhất là dòng log của lần đầu; việc thật (đọc env, file, gọi mạng) nên đưa vào bean như @ConfigurationProperties có validation để fail fast thay vì nằm trong khối static",
    ],
    model:
      "Hai cái tên nghe như một nhưng nói về hai tình huống khác hẳn nhau, và khác nhau trước hết ở chỗ ai là bên đòi class. ClassNotFoundException là một exception checked, sinh ra khi chính code của tôi xin class bằng tên dạng chuỗi — Class.forName, ClassLoader.loadClass, ServiceLoader, deserialization — và loader không tìm thấy. Nó có thể là chuyện hoàn toàn bình thường: kiểm tra xem một thư viện tuỳ chọn có trên classpath không. Spring Boot dựa hẳn vào điều đó: @ConditionalOnClass đọc tên class trong annotation dưới dạng chuỗi bằng ASM rồi thử nạp theo tên một cách có kiểm soát, nên hàng trăm auto-configuration cho thư viện vắng mặt không làm ứng dụng chết. NoClassDefFoundError thì là một Error, do JVM ném khi resolve một lệnh bytecode — new, invoke*, getfield — trong code đã biên dịch. Nghĩa của nó: lúc biên dịch class có mặt, lúc chạy lại không dùng được; đây luôn là lỗi cấu hình hoặc lỗi khởi tạo, không ai nên bắt nó để chạy tiếp. Thí nghiệm của bài xoá StripeClient.class sau khi biên dịch: chương trình vẫn in 'khởi động OK', và chỉ khi dòng gọi Billing.charge() thực sự chạy mới nhận NoClassDefFoundError: StripeClient với cause là ClassNotFoundException — vì class được nạp lười, lỗi có thể nằm im hàng giờ trên production. Biến thể thứ ba hoàn toàn không phải chuyện thiếu jar: 'Could not initialize class PriceConfig' nghĩa là <clinit> của class từng thất bại. JVM đảm bảo khối static chạy đúng một lần, có khoá; nếu nó ném exception, request đầu tiên nhận ExceptionInInitializerError mang lỗi gốc (trong bài là NumberFormatException vì biến môi trường FX_USD bị thiếu), còn class chuyển sang trạng thái lỗi vĩnh viễn trong suốt vòng đời class loader đó — mọi lần chạm sau đều là NoClassDefFoundError cho tới khi restart. Từ JDK 17 lỗi này có cause trỏ về exception ban đầu; với JDK cũ hơn, manh mối duy nhất là dòng log của lần đầu, thường đã chìm giữa hàng nghìn dòng khác. Bài học tôi rút ra: đừng làm việc thật trong khối static; trong Spring hãy đưa nó vào bean, ví dụ @ConfigurationProperties có validation, để lỗi cấu hình làm ứng dụng không khởi động được thay vì khởi động 'thành công' rồi hỏng dần.",
    redFlags: [
      "Cho rằng NoClassDefFoundError lúc nào cũng nghĩa là thiếu jar",
      "Bắt NoClassDefFoundError rồi retry như một exception nghiệp vụ",
      "Không biết rằng lỗi khởi tạo class là vĩnh viễn cho tới khi restart",
    ],
    probes: [
      "Vì sao ứng dụng vẫn in 'khởi động OK' dù StripeClient.class đã bị xoá?",
      "@ConditionalOnClass kiểm tra một class có mặt mà không tự gây NoClassDefFoundError bằng cách nào?",
      "Với JDK 11, bạn tìm exception gốc của 'Could not initialize class' ở đâu?",
    ],
    refs: ["uh-03"],
  },
  {
    id: "uh-iq02",
    field: "under-hood",
    topic: "uh-found",
    level: 2,
    minutes: 7,
    code: {
      lang: "text",
      text: `// public class Counter { private int count; public void inc() { count++; } }
$ javap -c Counter
  public void inc();
    Code:
       0: aload_0
       1: dup
       2: getfield      #7     // Field count:I
       5: iconst_1
       6: iadd
       7: putfield      #7     // Field count:I
      10: return

// Race: 2 thread, mỗi thread 1_000_000 lần { plain++; vol++; atomic.incrementAndGet(); }
//   static int plain;  static volatile int vol;  static final AtomicInteger atomic;
$ for i in 1 2 3; do java Race; done
plain=1,937,811  volatile=1,774,357  atomic=2,000,000  (expected 2,000,000)
plain=1,893,117  volatile=1,614,644  atomic=2,000,000  (expected 2,000,000)
plain=1,891,697  volatile=1,713,014  atomic=2,000,000  (expected 2,000,000)`,
    },
    question:
      "Một `@Service` đếm số đơn đã xử lý bằng `private int processed;` và `processed++` trong method nghiệp vụ; test đơn vị đều xanh. Khi review, một đồng nghiệp đề xuất 'thêm volatile cho an toàn'. Dựa vào bytecode và kết quả đo trên, giải thích vì sao số đếm sai, vì sao đề xuất kia không sửa được, và bạn sửa thế nào.",
    mustCover: [
      "count++ trên field biên dịch thành getfield → iconst_1 → iadd → putfield (field static: getstatic/putstatic) — ba bước đọc, tính, ghi tách rời; thread khác chen vào giữa lúc đọc và lúc ghi làm mất một lần tăng (lost update)",
      "Kết quả đo cho thấy biến thường mất hàng chục tới hàng trăm nghìn lần tăng trên 2.000.000, và volatile cũng sai — trong lần đo còn mất nhiều hơn",
      "volatile chỉ lo chuyện nhìn thấy (mỗi lần đọc thấy giá trị mới nhất, mỗi lần ghi được thấy ngay) chứ không biến đọc–tính–ghi thành một thao tác nguyên tử",
      "AtomicInteger.incrementAndGet() là một lời gọi method duy nhất trong bytecode, bên trong dùng lệnh CPU nguyên tử (x86: lock xadd) nên luôn đúng 2.000.000; trong Spring dùng AtomicLong/LongAdder hoặc tốt hơn là Counter của Micrometer cho số liệu đo",
      "Bean mặc định là singleton phục vụ mọi thread của Tomcat nên mọi field có thể thay đổi là shared state, test đơn luồng không bao giờ phát hiện; còn i++ trên biến cục bộ là một lệnh iinc trong frame riêng của từng thread nên không có rủi ro này",
    ],
    model:
      "Một dòng Java processed++ không phải một thao tác. javap cho thấy nó là aload_0, dup, getfield, iconst_1, iadd, putfield — bốn lệnh làm ba bước: đọc giá trị hiện tại của field lên operand stack, cộng 1, rồi ghi ngược vào field. (dup tồn tại vì this cần dùng hai lần, một cho getfield và một cho putfield — nên max_stack là 3.) Giữa getfield và putfield, một thread khác hoàn toàn có thể chạy trọn ba bước của nó: cả hai cùng đọc 41, cùng tính 42, cùng ghi 42 — một lần tăng biến mất. Đó là lost update, và chương trình Race đo được đúng điều đó: hai thread mỗi bên tăng một triệu lần, biến thường chỉ đạt 1,89–1,94 triệu thay vì 2 triệu. Bean @Service mặc định là singleton — một object duy nhất phục vụ cả 200 thread Tomcat — nên field processed chính là biến plain trong Race, chỉ là chạy trên nhiều thread hơn; test đơn vị chạy một luồng nên sẽ không bao giờ thấy lỗi. Đề xuất thêm volatile không cứu được: kết quả đo cho thấy cột volatile còn sai nặng hơn (1,61–1,77 triệu). volatile đảm bảo visibility — mỗi lần đọc thấy giá trị mới nhất, mỗi lần ghi được các thread khác thấy ngay — nhưng ba bước vẫn là ba bước, nó không biến đọc–tính–ghi thành nguyên tử. Cột atomic luôn đúng 2.000.000 vì incrementAndGet() là một lời gọi method duy nhất trong bytecode, bên trong dùng một lệnh CPU nguyên tử (trên x86 là lock xadd). Cách tôi sửa: nếu đây là số liệu vận hành thì dùng Counter của Micrometer — đúng công cụ, xuất thẳng lên dashboard; nếu là trạng thái nghiệp vụ trong bộ nhớ thì AtomicLong hoặc LongAdder. Và tôi sẽ rà luôn các field có thể thay đổi khác trong singleton — một HashMap, một SimpleDateFormat, một List làm 'cache' — vì chúng mang cùng loại rủi ro. Đáng chú ý là i++ trên biến cục bộ không có vấn đề này: nó biên dịch thành một lệnh iinc duy nhất, và biến cục bộ nằm trong frame riêng của từng thread nên không ai chia sẻ.",
    redFlags: [
      "Cho rằng volatile đủ để làm count++ an toàn đa luồng",
      "Nghĩ count++ nguyên tử vì nó chỉ là một dòng Java",
      "Kết luận code đúng vì test đơn vị chạy một luồng đều qua",
    ],
    probes: [
      "Vì sao lệnh dup xuất hiện trong bytecode của inc()?",
      "i++ trên một biến cục bộ biên dịch thành lệnh gì, và vì sao nó không gặp lost update?",
      "Ngoài số đếm, những field nào trong một singleton bean thường mang cùng loại rủi ro?",
    ],
    refs: ["uh-02", "uh-16"],
  },
  {
    id: "uh-iq03",
    field: "under-hood",
    topic: "uh-found",
    level: 3,
    minutes: 10,
    question:
      "Một service giữ trong heap bảng tra cứu khoảng 1 triệu cặp id → giá trị kiểu long dưới dạng `HashMap<Long, Long>`, cộng một danh sách 1 triệu id `ArrayList<Long>`. Nhóm nhẩm '1 triệu long là 8 MB' nhưng heap sau GC lớn hơn nhiều lần. Giải thích bộ nhớ đi đâu, rồi so sánh các hướng giảm footprint và cái giá của từng hướng.",
    tradeoffs: [
      {
        option: "Giữ nguyên collection boxed (ArrayList<Long>, HashMap<Long, Long>)",
        when: "Hợp khi dữ liệu nhỏ hoặc không nằm trên vùng nóng về bộ nhớ: API chuẩn, không phụ thuộc mới. Cái giá đo được: ArrayList<Long> 28 byte/phần tử (26,7 MB cho 1 triệu), HashMap<Long, Long> ~91 byte/entry (86,8 MB) — dữ liệu thật chỉ chiếm 9–29%.",
      },
      {
        option: "Mảng nguyên thuỷ hoặc collection cho kiểu nguyên thuỷ (long[], fastutil, Eclipse Collections, HPPC)",
        when: "Hợp với cache trong ứng dụng hay tính toán lô lớn: long[] chỉ 7,2 MB cho 1 triệu phần tử, tiết kiệm 3–10 lần. Đổi lại phải rời API Collection chuẩn, thêm thư viện, viết lại code xử lý; không còn null làm giá trị 'vắng mặt'.",
      },
      {
        option: "Bật Compact Object Headers (JDK 25: -XX:+UseCompactObjectHeaders; mặc định từ JDK 27)",
        when: "Không sửa code: ArrayList<Long> 26,7 → 19,1 MB, HashMap 86,8 → 64,2 MB vì header 12 → 8 byte. Nhưng chỉ có lợi khi vượt mốc làm tròn 8 byte (Integer, String, TreeNode giữ nguyên), không giúp gì mảng nguyên thuỷ, chỉ có trên x64/AArch64 — phải đo ở staging trước khi bật.",
      },
      {
        option: "Tăng heap vượt 32 GB cho 'thoải mái'",
        when: "Gần như không bao giờ là lời giải cho bài toán này: vượt 32 GB mất compressed oops, mọi tham chiếu thành 8 byte, footprint của cấu trúc nhiều tham chiếu tăng 15–35% — heap 33 GB có thể chứa ít object hơn heap 31 GB. Nếu thật sự cần heap lớn, nhảy hẳn lên khoảng 48 GB trở lên hoặc dùng ObjectAlignmentInBytes=16.",
      },
    ],
    mustCover: [
      "Một Long tốn 24 byte (header 12 byte, field long phải nằm ở offset 16 nên làm tròn) để chứa 8 byte dữ liệu, cộng ô tham chiếu 4 byte trong mảng của ArrayList — 28 byte/phần tử, 26,7 MB so với 7,2 MB của long[]",
      "HashMap<Long, Long> tốn ~91 byte/entry: HashMap.Node 32 byte (hash + 3 tham chiếu) cộng hai object Long cộng ô trong bảng; khoá phân bố kém (0, 1000, 2000…) chỉ rơi vào 12% số bucket, bucket từ 8 phần tử trở lên chuyển thành TreeNode 56 byte",
      "Compressed oops lưu tham chiếu 4 byte nhờ mọi object căn lề 8 byte (3 bit thấp luôn bằng 0), phủ được 32 GB; vượt ngưỡng đó mọi tham chiếu thành 8 byte",
      "Compact Object Headers thu header từ 12 xuống 8 byte nhưng chỉ có lợi khi kích thước vượt qua một mốc làm tròn 8 byte: Long 24 → 16, Node 32 → 24, còn Integer, String, TreeNode giữ nguyên",
      "Quyết định dựa trên số đo: GC.class_histogram để thấy class nào chiếm heap, JOL GraphLayout cho cả đồ thị object, và so heap sau GC, tần suất GC, p99 trên cùng tải ở staging trước khi bật cờ",
    ],
    model:
      "Con số 8 MB chỉ đúng với long[] — đo thật là 7,2 MB. Mọi cấu trúc dùng Long đều trả thêm cho header, tham chiếu và căn lề. Một object Long tốn 24 byte: header 12 byte (mark word 8 + class pointer nén 4), và vì field long phải thẳng hàng 8 nên nằm ở offset 16, tổng làm tròn lên 24 — ba lần dữ liệu thật. ArrayList<Long> còn giữ một ô tham chiếu 4 byte cho mỗi phần tử trong mảng nội bộ, nên 28 byte/phần tử, 26,7 MB cho một triệu. HashMap<Long, Long> nặng nhất: mỗi entry là một HashMap.Node 32 byte (hash cộng ba tham chiếu key, value, next), hai object Long, cộng ô trong bảng băm — khoảng 91 byte/entry, 86,8 MB. Bài còn đo được một chi tiết bất ngờ: với khoá 0, 1000, 2000…, hàm băm h ^ (h >>> 16) trên bảng 2²¹ ô chỉ dùng 12% số bucket; bucket từ 8 phần tử trở lên bị chuyển thành cây đỏ-đen với TreeNode 56 byte — hash phân bố kém vừa chậm vừa tốn RAM. Các lựa chọn: giữ nguyên boxed collection khi dữ liệu nhỏ, chấp nhận dữ liệu thật chỉ chiếm 9–29%; chuyển sang long[] hoặc thư viện collection nguyên thuỷ như fastutil, Eclipse Collections, HPPC khi đây là vùng nóng về bộ nhớ — tiết kiệm 3–10 lần, đổi lại mất API chuẩn và phải sửa code. Nếu đã ở JDK 25, Compact Object Headers là đòn bẩy không cần sửa code: header còn 8 byte nhờ nén class pointer xuống 22 bit nhét vào mark word, ArrayList<Long> xuống 19,1 MB, HashMap 64,2 MB. Nhưng nó không giảm đều 4 byte mỗi object — chỉ có lợi khi vượt mốc làm tròn 8 byte: Long 24 → 16, Node 32 → 24, còn Integer 16, String 24, TreeNode 56 giữ nguyên, và mảng nguyên thuỷ không được gì vì chỉ có một header. Hướng tôi loại bỏ là 'cứ tăng heap': compressed oops dùng tham chiếu 4 byte nhờ object luôn căn 8 byte, phủ được 32 GB; qua ngưỡng đó mọi tham chiếu thành 8 byte và chính chương trình này đo được ArrayList<Long> lên 32 byte/phần tử, HashMap lên 110 — một heap 33 GB có thể chứa ít hơn heap 31 GB. Dù chọn hướng nào, tôi đo trước: jcmd GC.class_histogram để biết class nào chiếm heap, JOL GraphLayout cho cả đồ thị object, rồi so heap sau GC, tần suất GC và p99 trên cùng tải ở staging. Với service điển hình tôi sẽ kết hợp: cấu trúc nguyên thuỷ cho bảng tra cứu nóng, Compact Object Headers cho phần còn lại của heap đầy object nhỏ.",
    redFlags: [
      "Ước lượng bộ nhớ của collection bằng số phần tử × 8 byte",
      "Cho rằng Compact Object Headers giảm đều 4 byte cho mọi object",
      "Đề xuất tăng heap vượt 32 GB mà không biết tới compressed oops",
    ],
    probes: [
      "Vì sao Long là 24 byte còn Integer chỉ 16 byte?",
      "Vì sao khoá 0, 1000, 2000… làm HashMap phình thêm?",
      "Một DTO record với Long, String, BigDecimal, LocalDateTime tốn khoảng bao nhiêu byte, và đo bằng gì?",
    ],
    refs: ["uh-05", "uh-04"],
  },
  {
    id: "uh-iq04",
    field: "under-hood",
    topic: "uh-found",
    level: 4,
    minutes: 15,
    incident: {
      symptom:
        "Pod Spring Boot (WebFlux trên Reactor Netty, gọi nhiều dịch vụ downstream) bị restart vài lần mỗi ngày, luôn sau vài giờ chạy chứ không lúc khởi động. kubectl describe pod báo Reason: OOMKilled, exit code 137. Không có OutOfMemoryError trong log, không stack trace, không file heap dump dù đã bật -XX:+HeapDumpOnOutOfMemoryError. Dashboard heap ngay trước lúc chết chỉ dùng khoảng 50–60% -Xmx.",
      scale:
        "limits.memory: 1Gi; -Xmx700m đặt tay với lý do 'còn dư 300 MB'. Khoảng 250 platform thread (pool của các client, scheduler, HikariCP). Không đặt MaxDirectMemorySize hay MaxMetaspaceSize. JDK 21, pod 2 vCPU, khoảng 20 pod.",
      constraints:
        "Không được tăng limits.memory (node đã kín, đội hạ tầng từ chối). Có staging tái hiện được tải nhưng không được thử nghiệm trên production ngoài một lần deploy cấu hình mới. Nếu sự cố còn lặp lại, lần sau phải để lại đủ dữ liệu để điều tra.",
    },
    question:
      "Vì sao pod bị giết dù heap còn trống gần một nửa? Bạn chứng minh bằng dữ liệu gì, và sửa cấu hình ra sao để nếu bộ nhớ có cạn thì nó cạn ở chỗ để lại bằng chứng?",
    mustCover: [
      "OOMKilled là kernel giết cả tiến trình khi tổng bộ nhớ của cgroup vượt limit — SIGKILL, exit 137 = 128 + 9 — nên JVM không có cơ hội ném OutOfMemoryError hay ghi heap dump; -Xmx chỉ là trần của heap, không phải lượng RAM tiến trình dùng",
      "Phần ngoài heap gồm Metaspace (mặc định không giới hạn), code cache, stack của thread, cấu trúc GC, direct buffer và native khác; MaxDirectMemorySize mặc định bằng -Xmx nên với Netty tiến trình có thể hợp lệ dùng 700 MB heap cộng tới 700 MB direct",
      "Committed khác resident: RAM tăng dần khi heap được ghi tới, thread chạy sâu hơn, JIT biên dịch thêm, direct buffer tích luỹ — nên chết sau vài giờ chứ không lúc khởi động là dấu hiệu điển hình của ngân sách bộ nhớ sai",
      "Chứng minh bằng Native Memory Tracking bật từ lúc khởi động trên staging: jcmd VM.native_memory summary, baseline rồi summary.diff để thấy hạng mục nào tăng (direct buffer nằm ở 'Other'); so VmRSS với NMT committed — RSS vượt xa NMT là bộ nhớ native ngoài tầm NMT (malloc của thư viện, phân mảnh arena của glibc, thử MALLOC_ARENA_MAX=2)",
      "Sửa theo công thức limit ≥ heap + Metaspace + code cache + N thread × stack + direct + GC + native khác + dự phòng: hạ heap (khởi điểm MaxRAMPercentage=50 cho pod 1 GiB), chặn trần MaxDirectMemorySize và MaxMetaspaceSize, bật HeapDumpOnOutOfMemoryError và ExitOnOutOfMemoryError — mục tiêu là nếu hết bộ nhớ thì hết ở chỗ JVM thấy được",
    ],
    model:
      "Triệu chứng đã nói gần hết: OOMKilled với exit 137 = 128 + 9 nghĩa là kernel thấy tổng bộ nhớ của tiến trình vượt limit cgroup và gửi SIGKILL. JVM không được báo trước, nên không có OutOfMemoryError, không stack trace, và HeapDumpOnOutOfMemoryError không bao giờ kích hoạt — đi tìm thủ phạm trong heap dump là vô ích vì không có dump nào cả. Heap còn trống không mâu thuẫn gì: -Xmx chỉ là trần của heap. Tiến trình còn Metaspace (Spring Boot với Web, JPA, Security thường 80–200 MB, và MaxMetaspaceSize mặc định không giới hạn), code cache, stack của 250 thread, cấu trúc của GC, bộ nhớ native của thư viện — và quan trọng nhất với WebFlux/Netty là direct buffer: MaxDirectMemorySize mặc định bằng 0, nghĩa là 'bằng -Xmx', nên cấu hình này hợp lệ cho phép 700 MB heap cộng 700 MB direct trong một pod 1 GiB. Bài tái hiện đúng kịch bản: MemHog với -Xmx400m trong cgroup 512 MB, heap mới dùng 300 MB, vẫn bị giết với 137; NMT cho thấy tiến trình committed 626 MB. Vì sao chết sau vài giờ chứ không lúc khởi động? Vì committed khác resident: JVM mới khởi động dùng rất ít RAM, RAM tăng dần khi heap được ghi tới, thread chạy sâu hơn, JIT biên dịch thêm và buffer tích luỹ — đó là chữ ký của ngân sách bộ nhớ sai. Để chứng minh, tôi tái hiện trên staging với -XX:NativeMemoryTracking=summary (phải bật từ lúc khởi động), chụp jcmd VM.native_memory baseline rồi summary.diff sau vài giờ tải để thấy hạng mục nào tăng — direct buffer hiện ở 'Other', stack ở 'Thread', class ở 'Class'. Đồng thời so VmRSS trong /proc/<pid>/status với tổng NMT committed: nếu RSS vượt xa và tăng dần, phần thừa nằm ngoài tầm NMT — malloc của thư viện nén, file map, phân mảnh arena của glibc — và MALLOC_ARENA_MAX=2 là cách giảm hay dùng. Lần deploy cấu hình duy nhất tôi sẽ đi theo công thức: limit ≥ heap + Metaspace + code cache + số thread × stack + direct + GC + native khác + dự phòng, với số đo lấy từ NMT của chính service. Điểm khởi đầu cho pod 1 GiB: MaxRAMPercentage=50 thay vì -Xmx700m, MaxDirectMemorySize khoảng 128m (điều chỉnh theo số đo của Netty), MaxMetaspaceSize khoảng gấp đôi mức ổn định, HeapDumpOnOutOfMemoryError với HeapDumpPath trên volume, ExitOnOutOfMemoryError. Mục tiêu không phải 'không bao giờ hết bộ nhớ' mà là 'nếu hết thì hết ở chỗ JVM thấy được': thí nghiệm của bài cùng workload, MaxRAMPercentage=75 thì bị giết im lặng với 137, còn 50 thì nhận OutOfMemoryError: Java heap space kèm heap dump — đủ bằng chứng cho lần điều tra sau.",
    redFlags: [
      "Xin tăng limit hoặc tăng -Xmx mà không đo phần ngoài heap",
      "Đi tìm nguyên nhân trong heap dump của một tiến trình bị kernel giết",
      "Cho rằng hết bộ nhớ thì JVM luôn ném OutOfMemoryError",
      "Đọc committed như RAM đang thật sự dùng",
    ],
    probes: [
      "Vì sao bật HeapDumpOnOutOfMemoryError mà không có file dump nào?",
      "NMT không nhìn thấy những loại bộ nhớ nào, và làm sao phát hiện chúng?",
      "-Xms bằng -Xmx kèm AlwaysPreTouch thay đổi thời điểm thất bại ra sao?",
    ],
    refs: ["uh-04", "uh-13", "uh-15"],
  },

  // ===== uh-exec (uh-iq05–uh-iq08) =====
  {
    id: "uh-iq05",
    field: "under-hood",
    topic: "uh-exec",
    level: 1,
    minutes: 5,
    question:
      "Trong buổi review, một đồng nghiệp đề xuất bỏ cặp `OrderService`/`OrderServiceImpl` để inject thẳng class, và đánh dấu `final` các method 'để JIT inline được', với lý do gọi qua interface chậm hơn gọi qua class. Gọi qua interface có thật sự chậm hơn không? Giải thích từ cơ chế dispatch trong interpreter tới lúc C2 vào cuộc.",
    mustCover: [
      "invokevirtual dispatch qua vtable: một method luôn giữ cùng chỉ số ở lớp cha và mọi lớp con nên chỉ là một phép tra mảng; interface không dùng được mẹo cùng chỉ số nên invokeinterface phải dò itable (danh sách interface rồi bảng method con) — trong interpreter gọi qua interface đúng là đắt hơn",
      "Code nóng chỉ ở interpreter vài mili-giây; interpreter và C1 tầng 3 ghi type profile tại mỗi call site, C2 đọc profile và khi call site chỉ thấy 1–2 loại receiver thì biến lời gọi thành phép so sánh class rồi inline thân method — 0,63 ns, bằng chi phí đọc một field, class hay interface như nhau",
      "Từ 3 loại receiver trở lên (megamorphic) C2 sinh lời gọi ảo thật, 12–19 ns; chênh lệch class với interface chỉ thực sự hiện ra ở đây, khoảng vài ns (15,3 so với 19,0 ns khi dữ liệu ngẫu nhiên)",
      "Chi phí megamorphic chủ yếu do mất inline và CPU đoán sai đích nhảy gián tiếp, không phải phép tra bảng: chỉ sắp mảng theo loại, cùng lời gọi còn khoảng 2,65–3,57 ns",
      "Class Hierarchy Analysis cho C2 gọi thẳng khi chỉ có một lớp con đã liên kết cài method và ghi dependency — nạp lớp con mới làm mã bị 'made not entrant'; vì vậy final không giúp JIT, còn với bean bị CGLIB bọc thì final trên method khiến proxy không chặn được lời gọi (mất @Transactional, @Cacheable)",
    ],
    model:
      "Câu trả lời ngắn: chỉ trong interpreter và ở trường hợp megamorphic — và ngay cả khi đó cũng chỉ vài nano-giây. Với invokevirtual, HotSpot dùng vtable: mỗi class có một mảng con trỏ tới method gắn sau cấu trúc Klass, và quy tắc then chốt là một method luôn giữ cùng chỉ số ở lớp cha và mọi lớp con — lớp con override thì ghi đè ô đó. Chỉ số được tính một lần lúc resolve, nên dispatch là hai lần đọc bộ nhớ và một lệnh nhảy. Interface không dùng được mẹo đó, vì một class cài nhiều interface và cùng interface được cài bởi những class không liên quan; nên mỗi class còn có itable — danh sách interface, mỗi cái trỏ tới một bảng method con — và invokeinterface phải dò danh sách ấy. Trong interpreter, gọi qua interface đắt hơn thật. Nhưng code nóng chỉ ở interpreter vài mili-giây. Trong lúc chạy ở interpreter và C1 tầng 3, JVM ghi type profile tại mỗi call site: những class nào từng là receiver, bao nhiêu lần. C2 đọc profile đó: nếu call site chỉ thấy một hoặc hai loại, nó biến lời gọi thành một phép so sánh class rồi inline thẳng thân method — benchmark của bài đo được 0,63 ns, đúng bằng chi phí đọc một field, và interface hay class không còn khác biệt để đo. Từ ba loại trở lên, C2 từ bỏ inline và sinh lời gọi ảo thật, 12–19 ns; chỉ ở đây chênh lệch class/interface mới hiện ra (15,3 so với 19,0 ns). Mà phần lớn chi phí đó cũng không nằm ở tra bảng: chỉ cần sắp mảng theo loại, cùng lời gọi còn 2,65–3,57 ns — thứ đắt là mất inline cộng lệnh nhảy gián tiếp mà CPU đoán sai. Về final: C2 đã có Class Hierarchy Analysis — nếu chỉ một lớp con đã liên kết cài method, nó gọi thẳng và ghi một dependency; nạp thêm lớp con thì mã bị 'made not entrant' và biên dịch lại. Nên final không giúp JIT, và với bean bị Spring bọc bằng CGLIB, final trên method còn khiến proxy không chặn được lời gọi — mất @Transactional, @Cacheable. Tôi giữ interface; với một cài đặt duy nhất, call site monomorphic được inline như gọi trực tiếp. Chỗ đáng để tâm là vòng lặp nóng của chính mình xử lý hàng triệu phần tử đa hình — ví dụ PricingRule có 10 cài đặt — nơi nhóm phần tử theo loại có thể giảm thời gian vài lần.",
    redFlags: [
      "Bỏ interface 'vì hiệu năng' khi chỉ có một cài đặt",
      "Thêm final để giúp JIT inline",
      "Cho rằng megamorphic chậm chủ yếu vì phải tra vtable/itable",
    ],
    probes: [
      "Chuyện gì xảy ra với mã C2 đã biên dịch khi một lớp con mới được nạp?",
      "Vì sao một Stream pipeline có thể nhanh trong microbenchmark nhưng chậm hơn trong ứng dụng thật?",
      "So với chi phí của interceptor trong proxy Spring, chi phí dispatch megamorphic đáng kể đến đâu?",
    ],
    refs: ["uh-06", "uh-08"],
  },
  {
    id: "uh-iq06",
    field: "under-hood",
    topic: "uh-exec",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `static final class Point {
    final double x, y;                       // 12 B header + 2 × 8 B field → 32 B sau căn lề
    Point(double x, double y) { this.x = x; this.y = y; }
    double norm() { return Math.sqrt(x * x + y * y); }   // 23 byte bytecode
}

static double work(double a, double b) {
    Point p = new Point(a, b);
    return p.norm();                         // p không đi đâu khác
}
// main: gọi work() 500 000 000 lần, -Xmx256m, đếm GC bằng -Xlog:gc

// Cấu hình                                              Số lần GC   Thời gian
// mặc định                                                   ???       5,9 s
// -XX:-DoEscapeAnalysis                                      274       7,3 s
// -XX:CompileCommand=dontinline,Escape$Point::norm           274       7,1 s`,
    },
    question:
      "Nếu mọi `new Point` đều thật sự được cấp phát, chương trình trên tạo khoảng 16 GB rác trong một heap 256 MB. Dự đoán số lần GC ở cấu hình mặc định, giải thích kết quả của hai cấu hình còn lại, rồi nêu những gì trong code thật khiến tối ưu này thất bại.",
    mustCover: [
      "Cấu hình mặc định có 0 lần GC: C2 làm escape analysis, thấy p không thoát khỏi đơn vị biên dịch nên scalar replacement xoá hẳn việc cấp phát, các field trở thành biến cục bộ trong thanh ghi",
      "Tắt -XX:-DoEscapeAnalysis thì mỗi vòng thật sự cấp phát 32 byte nên có 274 lần GC; JMH với -prof gc cho cùng kết luận: 32 B/op khi tắt, gần 0 B/op khi bật",
      "Cấm inline norm() cũng cho 274 lần GC dù EA vẫn bật: p phải được truyền vào một lời gọi thật nên thành ArgEscape — escape analysis chỉ mạnh bằng inlining",
      "Scalar replacement không phải cấp phát trên stack (HotSpot không làm điều đó): object biến mất hoàn toàn, thông tin để dựng lại nó được giữ trong metadata của nmethod phòng khi deoptimization",
      "EA thất bại khi không inline được nơi dùng object (method quá lớn, call site megamorphic), object bị lưu vào field, static, mảng hay collection, bị return ra khỏi đơn vị biên dịch hoặc ném làm exception, hai nhánh new gộp vào một biến (JDK 21), mảng không phải hằng nhỏ ≤ 64 phần tử, hoặc code chưa tới C2",
    ],
    model:
      "Tôi dự đoán 0 lần GC — và bài đo đúng như vậy. Đây là escape analysis: với mỗi object tạo trong một đơn vị biên dịch, C2 xác định nó có thoát ra ngoài không. p chỉ được tạo rồi dùng để gọi norm(); norm() nhỏ (23 byte bytecode) nên được inline vào work(), và work() lại được inline vào vòng lặp, nên p không bao giờ rời vùng code mà C2 đang nhìn. Kết quả phân tích dẫn tới phép biến đổi scalar replacement: C2 xoá hẳn lệnh cấp phát, thay x và y bằng hai biến cục bộ bình thường nằm trong thanh ghi. 500 triệu object, 0 byte rác. Cần nói rõ: đây không phải 'cấp phát trên stack' — HotSpot không làm điều đó; object biến mất hoàn toàn, và thông tin đủ để dựng lại nó được giữ trong metadata của nmethod, phòng khi deoptimization xảy ra giữa chừng. Dòng -XX:-DoEscapeAnalysis là đối chứng: mỗi vòng thật sự cấp phát 32 byte (12 byte header cộng hai double, làm tròn), nên có 274 lần GC và chạy chậm hơn (7,3 s so với 5,9 s); JMH với -prof gc cho cùng kết luận theo từng phép — 32 B/op khi tắt, xấp xỉ 0 B/op khi bật. Dòng thứ ba là bài học quan trọng nhất: EA vẫn bật, chỉ cấm inline một method 23 byte, mà kết quả y hệt như tắt EA. Lý do: khi norm() không được inline, p phải được truyền vào một lời gọi thật, nên bị xếp loại ArgEscape và phải tồn tại trên heap. Escape analysis chỉ mạnh bằng inlining. Trong code thật, EA thất bại khi nơi dùng object không inline được (method quá lớn, call site megamorphic, đơn vị biên dịch đã đầy); khi object bị lưu ra ngoài — vào field, static, phần tử mảng hay collection; khi bị return ra khỏi đơn vị biên dịch hoặc ném làm exception; khi hai nhánh new khác nhau gộp vào một biến (JDK 21 chưa xử lý được); với mảng không phải hằng số nhỏ ≤ 64 phần tử; và khi code chưa tới C2 — interpreter và C1 không làm EA, nên trong warm-up mọi new đều là cấp phát thật. Hệ quả thực tế: đừng viết object pool để 'tránh new' — object trong pool là GlobalEscape theo định nghĩa, sống lâu, bị đẩy lên Old và còn cần đồng bộ hoá. Muốn biết chỗ nào thật sự cấp phát thì đo bằng JFR jdk.ObjectAllocationSample, async-profiler chế độ alloc, hoặc -prof gc trong JMH.",
    redFlags: [
      "Đề xuất object pool để tránh new trong vòng lặp nóng",
      "Nói JVM cấp phát object không thoát trên stack",
      "Kết luận 'new luôn tạo rác' mà không xét inlining",
    ],
    probes: [
      "Trong vài giây warm-up đầu tiên, new Point trong vòng lặp này có cấp phát không?",
      "Vì sao object pool lại làm GC tệ hơn?",
      "Làm sao tìm chỗ thật sự cấp phát trong một ứng dụng Spring Boot đang chạy?",
    ],
    refs: ["uh-08", "uh-10"],
  },
  {
    id: "uh-iq07",
    field: "under-hood",
    topic: "uh-exec",
    level: 3,
    minutes: 11,
    question:
      "Service Spring Boot của bạn mất khoảng 1,7 giây tới response đầu tiên và tiêu gần gấp đôi chừng đó thời gian CPU; đội muốn xuống dưới một giây để rolling deploy và autoscale nhanh hơn. Trước khi chọn kỹ thuật, bạn cần biết gì về thời gian khởi động thật sự đi đâu, và các hướng tăng tốc đánh đổi với nhau ra sao?",
    tradeoffs: [
      {
        option: "Bỏ việc thừa sau khi profile JFR lúc khởi động",
        when: "Luôn làm trước tiên vì rẻ nhất: trong bài, chỉ tắt JMX registry của Tomcat đã nhanh hơn 20% (1 757 → 1 412 ms). Đòi hỏi biết framework đang làm gì; cộng dồn được với mọi kỹ thuật khác.",
      },
      {
        option: "AppCDS",
        when: "JDK 13+, Spring Boot 3.3+: −24% đo được (1 757 → 1 333 ms), archive 24 MB. Chỉ nhắm vào nạp class; archive gắn với bản JDK, classpath và jar — đổi một thứ là mất tác dụng.",
      },
      {
        option: "AOT cache của Project Leyden (JDK 24+; Spring Boot 3.5/4 trên Java 25)",
        when: "−29% đến −34%: lưu class đã nạp và liên kết, object, và từ JDK 25 profile method; huấn luyện bằng tải thật đưa READY → response từ 128 xuống 35 ms. Cần lượt huấn luyện giống tải thật, cache 40–130 MB, và mặc định AOTMode=auto mất lợi ích âm thầm khi môi trường lệch.",
      },
      {
        option: "Spring AOT",
        when: "Spring Boot 3+: dời việc đọc annotation, đánh giá @Conditional, sinh proxy sang lúc build, khoảng −15% (số tham khảo). Đổi lại giả định thế giới đóng một phần: bean, @Profile, @ConditionalOnProperty cố định lúc build.",
      },
      {
        option: "CRaC hoặc GraalVM Native Image",
        when: "Xoá cả bốn loại chi phí (≈ 75 ms khôi phục, ≈ 80 ms khởi động — số tham khảo). CRaC cần bản JDK có CRaC, quyền CRIU, ảnh chứa secret và trạng thái bị nhân bản; Native Image build lâu, thế giới đóng, cần metadata reflection, throughput đỉnh thường thấp hơn C2.",
      },
    ],
    mustCover: [
      "Khởi động gồm bốn loại chi phí: nạp class, code chạy lần đầu bằng interpreter, việc của framework, và warm-up tới khi C2 biên dịch xong; trong service mẫu nạp class chỉ khoảng 17% số mẫu JFR của thread main, 64% mẫu có khung trên cùng chạy bằng interpreter",
      "Profile JFR trước khi cache: phần lớn thời gian là code thật sự chạy (Tomcat phân tích XML mô tả MBean, Spring dựng bean bằng reflection, CGLIB sinh proxy); bỏ việc thừa và AOT cache cộng dồn được vì nhắm hai loại chi phí khác nhau — trong bài xuống 902 ms",
      "AOT cache khác AppCDS ở chữ linking: lưu sẵn class ở trạng thái đã nạp và đã liên kết (gồm kết quả bootstrap của invokedynamic, lambda), một số object heap, và từ JDK 25 cả profile method; tới JDK 27 cache không chứa mã máy — đó là JEP 544 nhắm JDK 28",
      "Mọi archive và cache chỉ đúng với chính xác môi trường tạo ra nó: rebuild jar hay bật JFR lệch so với lúc huấn luyện thì AOTMode=auto chỉ cảnh báo rồi chạy như không có cache; tạo cache trong image cuối, giữ -Xlog:aot=warning, chạy AOTMode=on ở staging; class proxy sinh lúc chạy không lưu được",
      "Càng đóng băng nhiều thì càng mất tính động của Java: CRaC và Native Image xoá được cả bốn loại chi phí nhưng trả giá bằng quyền hệ điều hành, secret trong ảnh, thế giới đóng, throughput đỉnh; còn spring.main.lazy-initialization chỉ dời chi phí sang request đầu tiên",
    ],
    model:
      "Việc đầu tiên tôi làm là không chọn kỹ thuật nào cả, mà đo xem thời gian đi đâu. Bài chia một lần khởi động thành bốn loại chi phí: nạp class, code chạy lần đầu bằng interpreter, việc của framework, và warm-up tới khi C2 biên dịch xong. Lấy mẫu JFR mỗi mili-giây trên thread main của service mẫu cho thấy nạp class chỉ chiếm khoảng 17% số mẫu, còn 64% mẫu có khung trên cùng đang chạy bằng interpreter — phần lớn là code thật sự chạy lần đầu: Tomcat phân tích file mbeans-descriptors.xml và khởi tạo JMX, Spring dựng bean bằng reflection, CGLIB sinh class proxy. CPU gần gấp đôi wall-clock vì thread JIT và GC chạy song song. Từ bản đồ đó, đòn bẩy rẻ nhất là bỏ việc thừa: chỉ tắt JMX registry của Tomcat đã nhanh 20% (1 757 → 1 412 ms) — Spring Boot thật làm sẵn việc này, nhưng ứng dụng của tôi chắc chắn có thứ tương tự: một bean mở kết nối đồng bộ, một lần quét classpath thừa. Tiếp theo là cache. AppCDS lưu class đã phân tích (−24%, archive 24 MB) nhưng class vẫn phải liên kết lúc chạy. AOT cache của Leyden làm sẵn cả linking — phân giải constant pool, chạy bootstrap của invokedynamic, dựng lambda — lưu thêm một số object heap, và từ JDK 25 cả profile method: huấn luyện tới READY được 1 253 ms, huấn luyện thêm 3 000 request được 1 161 ms và READY → response từ 128 còn 35 ms; cộng với việc tắt JMX thì xuống 902 ms, vì hai cách nhắm vào hai loại chi phí khác nhau. Nhưng tới JDK 27 cache chưa chứa mã máy (đó là JEP 544, nhắm JDK 28), nên code chạy lần đầu vẫn chạy bằng interpreter. Cái bẫy lớn nhất của cache là nó chỉ đúng với chính xác môi trường tạo ra nó: rebuild jar hay bật JFR khi lúc huấn luyện không bật, JVM ở AOTMode=auto chỉ ghi một cảnh báo 'Unable to map shared spaces' rồi chạy như không có cache. Nên tôi tạo cache ngay trong image cuối, giữ -Xlog:aot=warning có cảnh báo, và chạy AOTMode=on ở staging; class proxy CGLIB sinh lúc chạy không lưu được — đó là chỗ Spring AOT bổ sung, dời việc framework sang lúc build (khoảng −15%, số tham khảo) với giá là giả định thế giới đóng một phần. Hai hướng cực đoan xoá được cả bốn loại chi phí: CRaC khôi phục tiến trình đã ấm trong khoảng 75 ms nhưng cần bản JDK riêng, quyền CRIU, ảnh chứa secret và mọi pod mang cùng trạng thái 'duy nhất'; Native Image khởi động khoảng 80 ms nhưng build lâu, thế giới đóng, throughput đỉnh thường thấp hơn C2. Với một service Spring Boot năm 2026 tôi chọn: profile và bỏ việc thừa, AOT cache huấn luyện bằng tải đại diện, cân nhắc Spring AOT; và tôi không bật lazy-initialization, vì nó chỉ dời chi phí sang request đầu tiên của từng bean.",
    redFlags: [
      "Cho rằng Spring Boot khởi động chậm chủ yếu vì nạp quá nhiều class",
      "Nghĩ AOT cache đã chứa mã máy biên dịch sẵn",
      "Tin rằng cache không dùng được thì JVM sẽ báo lỗi",
      "Chọn lazy initialization như cách giảm chi phí khởi động",
    ],
    probes: [
      "Vì sao lượt huấn luyện AOT cache bằng tải lệch lại có thể chậm hơn mặc định?",
      "Làm sao biết trên production cache có thật sự được dùng không?",
      "CRaC làm gì với socket đang mở và secret trong heap khi chụp ảnh?",
    ],
    refs: ["uh-09", "uh-07"],
  },
  {
    id: "uh-iq08",
    field: "under-hood",
    topic: "uh-exec",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Mỗi lần rolling deploy hoặc khi HPA thêm pod, pod mới nhận traffic ngay khi readiness xanh; p99 của pod đó vọt lên hàng trăm mili-giây, CPU kẹt ở 100% limit, upstream timeout tăng trong vài phút đầu rồi tự hết mà không ai can thiệp. Đội đã thêm một runner gọi 200 request vào /actuator/health trước khi báo sẵn sàng — không cải thiện gì.",
      scale:
        "Service Spring Boot MVC (Tomcat, Hibernate, Jackson), 12 pod, mỗi pod requests.cpu: 500m, limits.cpu: 500m, limits.memory: 1Gi, JDK 21. Khi đã ấm, mỗi pod giữ p99 vài mili-giây. Deploy vài lần mỗi ngày.",
      constraints:
        "Tổng CPU request của namespace không được tăng quá 20%. Không được bỏ readiness probe. Endpoint ghi (POST /orders) có side effect, không được gọi khi warm-up. Quý này không có ngân sách chuyển sang GraalVM Native Image.",
    },
    question:
      "Chẩn đoán vì sao pod mới chậm trong vài phút đầu, chứng minh bằng công cụ nào, và đưa ra kế hoạch xử lý theo thứ tự ưu tiên.",
    mustCover: [
      "Sau khởi động code chạy bằng interpreter (chậm khoảng 15 lần) và C1 tầng 3 có mã ghi profile; mỗi method vượt ngưỡng (Tier3InvocationThreshold 200, Tier4InvocationThreshold 5000…) vào hàng đợi C1/C2 vào những thời điểm khác nhau — warm-up là quá trình rải rác; thí nghiệm 2 vCPU: p99 giây đầu 152 ms, khoảng 12,5 s mới đạt 90% tốc độ đỉnh",
      "Biên dịch chạy nền không chặn request nhưng lấy CPU của request; ở 0,5 CPU nửa giây đầu chỉ 18 req/s, p99 443 ms, warm-up chưa xong sau 30 s, và CFS throttling giữ p99 khoảng 48 ms ngay cả khi đã ấm; với 500m JVM thấy 1 CPU nên chọn Serial GC mà vẫn giữ 2 luồng biên dịch tranh nửa lõi đó",
      "Chứng minh bằng jstat -compiler (tổng thời gian biên dịch), jcmd Compiler.queue (hàng đợi dài nghĩa là JIT bị bỏ đói), -XX:+PrintCompilation hoặc JFR jdk.Compilation, metric jvm.compilation.time so với thời điểm deploy, và tỉ lệ chu kỳ bị throttle trong cpu.stat / container_cpu_cfs_throttled_periods_total",
      "200 request vào /actuator/health vô ích vì các ngưỡng tính bằng nghìn tới chục nghìn (OSR của C2 là 40.000 back-edge) và profile phải giống traffic thật; warm-up đúng là ApplicationRunner gọi HTTP vào chính ứng dụng qua filter, message converter, Jackson, chỉ endpoint đọc với dữ liệu đại diện kể cả nhánh lỗi, có giới hạn thời gian và kiểm tra startupProbe — readiness chỉ chuyển ACCEPTING_TRAFFIC khi runner chạy xong",
      "Đòn bẩy CPU thường tác động lớn nhất với pod nhỏ: giữ requests.cpu vừa đủ và bỏ hoặc nới limits.cpu để tận dụng CPU dư lúc khởi động (bỏ limit thì đặt -XX:ActiveProcessorCount), hoặc in-place pod resize; kết hợp slow start ở load balancer và AOT cache để giảm việc lúc khởi động",
    ],
    model:
      "Tôi bắt đầu từ giả thuyết luôn hiện diện ở mọi pod Java mới: code đang chạy bằng interpreter và C1, còn JIT đang dùng CPU để biên dịch. Sau khi khởi động, phần lớn code chạy bằng interpreter — chậm khoảng 15 lần — và code đã lên C1 lại ở tầng 3, tầng có cài mã ghi profile cho C2. Mỗi method có bộ đếm lời gọi và back-edge riêng; vượt ngưỡng (Tier3InvocationThreshold 200, Tier4InvocationThreshold 5000…) thì vào hàng đợi C1 hoặc C2 và tiếp tục chạy ở tầng cũ. Biên dịch chạy nền, không chặn request — nhưng nó lấy CPU mà request đang cần. Thí nghiệm của bài trên 2 vCPU: p99 nửa giây đầu 152 ms, gấp 75 lần lúc đã ấm, mất khoảng 12,5 giây và hơn 2.400 lần biên dịch để đạt 90% tốc độ đỉnh. Service Spring Boot thật còn phải biên dịch hàng chục nghìn method của Spring, Hibernate, Jackson, Tomcat. Cấu hình 500m của chúng tôi là cái bẫy kép: ở 0,5 CPU, nửa giây đầu bài chỉ phục vụ được 18 request, p99 443 ms, sau 30 giây vẫn chưa ấm; thêm vào đó CFS chỉ cho 50 ms CPU mỗi chu kỳ 100 ms, hết quota là mọi thread bị đóng băng — p99 kẹt khoảng 48 ms ngay cả khi đã ấm. JVM còn thấy '1 CPU' nên chọn Serial GC, trong khi vẫn giữ 2 luồng biên dịch tranh đúng nửa lõi đó. Để chứng minh, trên một pod mới tôi xem jstat -compiler (tổng thời gian biên dịch), jcmd Compiler.queue (hàng đợi dài nghĩa là JIT bị bỏ đói), PrintCompilation hoặc JFR jdk.Compilation, metric jvm.compilation.time chồng lên thời điểm deploy, và tỉ lệ container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total. Runner 200 request vào /actuator/health vô ích vì hai lẽ: ngưỡng tính bằng nghìn tới chục nghìn — OSR của C2 cần 40.000 back-edge — và profile phản ánh traffic warm-up, mà health check không đi qua controller, Hibernate hay Jackson của luồng nghiệp vụ. Kế hoạch theo thứ tự: một, đòn bẩy CPU — thường bị bỏ quên nhưng tác động lớn nhất với pod nhỏ: giữ requests.cpu, bỏ hoặc nới limits.cpu để pod tận dụng CPU dư lúc khởi động (không làm tăng tổng request; khi bỏ limit thì đặt -XX:ActiveProcessorCount để JVM không thấy cả node), hoặc in-place pod resize nếu cluster hỗ trợ. Hai, warm-up đúng cách trong một ApplicationRunner: gọi HTTP vào chính ứng dụng qua localhost để đi qua filter, message converter, exception handler; chỉ endpoint đọc, dữ liệu đại diện kể cả nhánh lỗi 400, đủ lượng, có giới hạn thời gian và kiểm tra lại startupProbe — readiness chỉ chuyển ACCEPTING_TRAFFIC khi runner xong. Ba, slow start ở load balancer để phần ấm còn lại diễn ra dưới tải nhẹ. Bốn, AOT cache để giảm việc lúc khởi động. Tôi sẽ không bật TieredStopAtLevel=1: nhanh hơn trong 10 giây đầu nhưng tốc độ đỉnh thấp hơn 43% — sai cho service chạy hàng ngày.",
    redFlags: [
      "Đổ hết cho cache chưa đầy hoặc connection pool mà không nhìn JIT và throttling",
      "Bật TieredStopAtLevel=1 cho service chạy lâu",
      "Warm-up bằng health endpoint hoặc gọi thẳng service method",
      "Chỉ kéo dài initialDelaySeconds của readiness probe",
    ],
    probes: [
      "Vì sao vòng lặp dispatcher và worker của server lại được tối ưu sau cùng?",
      "Vì sao warm-up bằng java.net.http.HttpClient có thể lệch profile so với traffic thật?",
      "Bỏ limits.cpu trên node 64 lõi thì JVM tạo bao nhiêu thread GC và JIT nếu không được báo gì?",
    ],
    refs: ["uh-07", "uh-13", "uh-09"],
  },

  // ===== uh-gc (uh-iq09–uh-iq12) =====
  {
    id: "uh-iq09",
    field: "under-hood",
    topic: "uh-gc",
    level: 1,
    minutes: 5,
    question:
      "Một đồng nghiệp lo rằng quan hệ hai chiều `Order ⇄ OrderLine` trong entity sẽ gây memory leak vì 'hai object trỏ vào nhau thì không bao giờ về 0'. GC của HotSpot xác định object nào là rác bằng cách nào khi có vòng tham chiếu, GC roots gồm những gì, và một memory leak trong Java thật ra có hình dạng ra sao?",
    mustCover: [
      "Mọi GC của HotSpot dùng truy vết (tracing) chứ không đếm tham chiếu: bắt đầu từ GC roots đi theo mọi tham chiếu, object đến được là sống, phần còn lại là rác — nên vòng A ⇄ B không còn đường từ root là rác dù mỗi object vẫn được object kia trỏ tới",
      "Thí nghiệm một triệu vòng tham chiếu: khi mảng giữ chúng hết được trỏ tới, heap rơi từ 173 MB về 1 MB; 1 000 vòng còn được một HashMap static giữ thì vẫn sống cho tới khi map bị xoá",
      "GC roots gồm biến cục bộ và tham số trong mọi frame của mọi thread, class đã nạp và qua object java.lang.Class là mọi field static, tham chiếu từ code native (JNI), object đang làm monitor, bản thân các object Thread, và cấu trúc nội bộ JVM như bảng chuỗi intern",
      "Chi phí truy vết tỉ lệ với lượng dữ liệu còn sống, không với lượng rác: Full GC với 173 MB còn sống mất 116,9 ms, cùng 173 MB đó khi đã là rác chỉ 4,4 ms",
      "Leak trong Java không phải quên giải phóng mà là vẫn còn đường đi từ root: map làm cache không giới hạn trong singleton bean, ThreadLocal không remove() trên thread pool của Tomcat, listener/callback đăng ký vào object sống lâu mà không huỷ",
    ],
    model:
      "Lo lắng đó đúng với cơ chế đếm tham chiếu — kiểu CPython, Swift hay shared_ptr của C++ — nơi mỗi object đếm số con trỏ tới nó và chỉ giải phóng khi về 0, nên một vòng bị bỏ rơi không bao giờ về 0. Nhưng mọi GC của HotSpot dùng cách thứ hai: truy vết. GC bắt đầu từ một tập điểm xuất phát gọi là GC roots, đi theo mọi tham chiếu; object nào đi tới được là sống, còn lại là rác. Một vòng Order ⇄ OrderLine không còn đường đi từ root thì là rác, bất kể hai object vẫn trỏ vào nhau. Bài kiểm chứng bằng một triệu vòng A ⇄ B: chừng nào mảng keep còn giữ, heap là 173 MB; gán keep = null là cả triệu vòng biến mất, heap còn 1 MB. Còn 1 000 vòng được một HashMap static giữ thì vẫn sống — một WeakReference 'camera' chỉ trả về null sau khi map bị clear(). GC roots với HotSpot gồm: biến cục bộ và tham số trong mọi frame trên stack của mọi thread đang chạy; class đã nạp — và qua object java.lang.Class của chúng, mọi field static (class của bootstrap loader không bao giờ bị dỡ, class của loader khác sống chừng nào loader còn sống); tham chiếu từ code native qua JNI; object đang được dùng làm monitor của synchronized; bản thân các object Thread; và cấu trúc nội bộ của JVM như bảng chuỗi intern. Đếm root trong heap dump của một service thật được khoảng 2 600 root, phần lớn là STICKY_CLASS. Cái giá của truy vết là nó phải đi qua toàn bộ object còn sống — và đây là hệ quả quan trọng nhất: trong cùng thí nghiệm, Full GC khi 173 MB còn sống mất 116,9 ms, còn khi chính 173 MB đó đã là rác chỉ mất 4,4 ms. Chi phí GC tỉ lệ với dữ liệu sống, không với lượng rác. Vậy leak trong Java trông thế nào? Không phải 'quên giải phóng' hay vòng tham chiếu, mà là vẫn còn một đường đi từ root mà ta không định giữ. Trong Spring Boot có ba đường hay gặp: field static và singleton bean — ApplicationContext giữ bean suốt đời ứng dụng, nên một Map làm cache không giới hạn, không thời hạn là leak có chủ đích; ThreadLocal trên thread pool — thread của Tomcat không bao giờ chết, giá trị không remove() sống mãi qua stack root của thread đó; và listener hay callback đăng ký vào object sống lâu mà không huỷ đăng ký.",
    redFlags: [
      "Cho rằng vòng tham chiếu giữa các object gây memory leak trong Java",
      "Khuyên set biến về null khắp nơi để giúp GC",
      "Nghĩ chi phí GC tỉ lệ với lượng rác",
    ],
    probes: [
      "Vì sao một class loader không được giải phóng kéo theo toàn bộ dữ liệu static của mọi class nó nạp?",
      "Truy vết phải trả giá gì mà đếm tham chiếu không phải trả?",
      "Trong thí nghiệm, làm sao chứng minh một object cụ thể đã thật sự bị thu gom?",
    ],
    refs: ["uh-10", "uh-14"],
  },
  {
    id: "uh-iq10",
    field: "under-hood",
    topic: "uh-gc",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `$ java -XX:MaxGCPauseMillis=2 -Xlog:gc*=trace ...
[trace][gc,ergo,heap] GC(87) Predicted total base time: total 2.815960 base_time 2.815960 ...
[trace][gc,ergo,heap] GC(87) Young desired length 6 surv 1 ... absolute min young length 6 absolute max young length 73
                             desired eden length by mmu 1 desired eden length by pause 5
[info ][gc          ] GC(87) Pause Young (Normal) (G1 Evacuation Pause) 16M->11M(123M) 3.315ms

# OrderService, G1, heap 256 MB, làm nóng 5 s rồi đo 10 s tải wrk
MaxGCPauseMillis   req/s   Young GC   Eden (trung vị)   Pause trung vị / p90 / max   Vượt mục tiêu
200 (mặc định)     12094     138          30 MB         1,13 / 1,77 / 4,94 ms             0
50                 12235     153          29 MB         1,20 / 1,83 / 5,18 ms             0
10                 11368     146          27 MB         1,16 / 1,83 / 7,69 ms             0
2                  11498     177           5 MB         1,06 / 1,61 / 6,34 ms            13 (7%)
1                   9347     406           9 MB         1,01 / 2,61 / 7,98 ms           213 (52%)`,
    },
    question:
      "Sau một sự cố latency, một đồng nghiệp đặt `-XX:MaxGCPauseMillis=1` với lý do 'giới hạn pause tối đa 1 ms'. Đọc log trace và bảng đo trên: G1 dùng con số này để làm gì, vì sao hạ từ 200 xuống 10 không đổi gì, vì sao ở 1–2 ms GC dày hơn mà pause mỗi lần không ngắn hơn — và bạn khuyên gì?",
    mustCover: [
      "MaxGCPauseMillis không phải lời hứa mà là đầu vào cho mô hình dự đoán: pause ≈ base time (quét root, gộp remembered set và card bẩn, phần Other) + số region trong collection set × chi phí mỗi region; G1 giải ngược ra số region Eden lần sau, kẹp trong 5–60% heap và ràng buộc MMU",
      "Từ 200 xuống 10 ms không đổi gì vì pause thật của service đã khoảng 1 ms; Eden khoảng 30 MB bị giới hạn bởi việc G1 giữ heap nhỏ khi tỉ lệ thời gian GC còn thấp, không phải bởi mục tiêu pause",
      "Log trace ở mục tiêu 2 ms: riêng base time dự đoán đã 2,8 ms, vượt mục tiêu trước khi chép byte nào, nên G1 thu thế hệ trẻ về mức tối thiểu (6 region = 5% của heap 123 MB) và chấp nhận trượt — pause thật 3,3 ms",
      "Ở 1 ms GC dày gấp ba (406 so với 138 lần), 52% số lần vẫn trượt mục tiêu, throughput giảm khoảng 23% (12 094 → 9 347 req/s) mà pause trung vị gần như không đổi",
      "Mục tiêu không bao trùm Full GC, thời gian chờ tới safepoint hay độ trễ do tranh CPU; trong log, Eden regions với mục tiêu rất nhỏ kèm GC rất dày là dấu hiệu mục tiêu thấp hơn chi phí cố định — đo phân bố pause thật rồi nâng về mặc định nếu p99 đã thấp hơn yêu cầu",
    ],
    model:
      "MaxGCPauseMillis không hứa gì cả — nó là đầu vào cho một mô hình dự đoán. G1 không thể biết trước một lần GC mất bao lâu, nên nó đo mọi lần đã qua và ước lượng: pause dự đoán ≈ base time — phần chi phí cố định gồm quét root ngoài heap, gộp remembered set và card bẩn, phần 'Other' — cộng số region trong collection set nhân chi phí mỗi region. Sau mỗi lần GC, G1 giải ngược bài toán: với mục tiêu này, thế hệ trẻ lần sau được bao nhiêu region Eden? Kết quả bị kẹp giữa G1NewSizePercent 5% và G1MaxNewSizePercent 60% của heap, và còn chịu ràng buộc MMU (trong mỗi cửa sổ 201 ms, GC không chiếm quá 200 ms). Con số đó cũng quyết định số region già dọn mỗi lần mixed GC. Bảng đo giải thích phần còn lại. Từ 200 xuống 50 rồi 10 ms: số GC, Eden và pause gần như y nguyên — vì pause thật của service đã khoảng 1 ms, và Eden không lớn hơn 30 MB là do G1 giữ heap nhỏ khi tỉ lệ thời gian GC còn thấp, không phải do mục tiêu pause. Mục tiêu chỉ bắt đầu 'cắn' khi xuống dưới chi phí cố định của chính GC. Log trace ở mức 2 ms cho thấy đúng khoảnh khắc đó: 'Predicted total base time 2.815960' — chỉ riêng phần cố định đã vượt mục tiêu 2 ms trước khi chép một byte nào. G1 làm điều duy nhất có thể: thu thế hệ trẻ về mức tối thiểu, 'Young desired length 6' bằng absolute min — 6 region, 5% của heap 123 MB lúc đó — rồi chấp nhận trượt: pause thật 3,315 ms. Eden nhỏ đi thì đầy nhanh hơn, nên GC dày hơn, nhưng mỗi lần không ngắn hơn vì phần cố định vẫn ở đó. Ở 1 ms hậu quả rõ nhất: 406 lần GC so với 138, 52% số lần vẫn vượt mục tiêu, throughput rơi từ 12 094 xuống 9 347 req/s — khoảng 23% — trong khi pause trung vị vẫn khoảng 1 ms như mặc định. Thêm vào đó, mục tiêu không bao trùm Full GC, thời gian chờ các thread tới safepoint hay độ trễ do CPU bị tranh. Lời khuyên của tôi: gỡ cờ về mặc định; trước khi tinh chỉnh bất cứ gì, đo phân bố pause thật — p99 của jvm.gc.pause trong Actuator, hoặc dòng tóm tắt 'Pause Young ... 34M->11M(40M) 1.876ms' trong log — và nếu p99 đã thấp hơn yêu cầu nhiều lần thì để yên. Khi thấy 'Eden regions: … (n)' với n rất nhỏ cùng GC rất dày, đó là dấu hiệu mục tiêu đã đặt thấp hơn chi phí cố định. Nếu sự cố latency là thật, nguồn gốc nằm ở chỗ khác: Full GC, safepoint, hay CPU bị tranh.",
    redFlags: [
      "Đọc MaxGCPauseMillis như giới hạn pause được đảm bảo",
      "Đề xuất hạ mục tiêu thêm hoặc cố định -Xmn để 'ép' pause",
      "Tinh chỉnh GC dựa trên một pause đơn lẻ dài thay vì phân bố pause",
    ],
    probes: [
      "Một young GC 5,2 ms mà riêng Pre Evacuate Collection Set chiếm 4 ms trên máy 2 vCPU đang chạy cả bộ sinh tải nói lên điều gì?",
      "Đặt -Xmn cố định ảnh hưởng gì tới khả năng giữ mục tiêu pause của G1?",
      "Trong dòng phases của một young GC, Object Copy lớn và Scan Heap Roots lớn gợi ý hai nguyên nhân khác nhau nào?",
    ],
    refs: ["uh-11", "uh-10"],
  },
  {
    id: "uh-iq11",
    field: "under-hood",
    topic: "uh-gc",
    level: 3,
    minutes: 11,
    question:
      "Hai service Spring Boot cần chọn GC: (A) một service CRUD thông thường chạy pod 1 vCPU / 1 GiB; (B) một service giữ khoảng 300 MB session trong heap, SLA p99 dưới 1 ms, pod 2 vCPU, heap 1 GB. Có người đề nghị 'chuyển hết sang ZGC vì pause dưới 1 ms'. Pause dưới 1 ms phải trả bằng gì, và bạn chọn GC ra sao cho từng service?",
    tradeoffs: [
      {
        option: "G1",
        when: "Mặc định hợp lý cho CRUD trong pod 1–2 vCPU, heap ≤ 1–2 GB: dữ liệu sống nhỏ thì pause vài ms, chi phí CPU khoảng +6% so với không GC. Yếu điểm khi dữ liệu sống lớn và SLA chặt: với 300 MB session, G1 chọn Eden lớn, pause ít mà dài ~22 ms nên p99 12,4 ms.",
      },
      {
        option: "Serial (ergonomics tự chọn dưới 2 CPU hoặc dưới 1792 MB, tới JDK 26)",
        when: "Trong pod 1 vCPU vẫn là lựa chọn ổn: không có thread GC nền, không barrier đắt, p99 nhỉnh nhất (15,6 ms) và RSS thấp nhất. Ở đó throttling CFS quyết định p99 chứ không phải GC; JDK 27 (JEP 523) đổi mặc định thành G1 với chênh lệch nhỏ — nên chỉ định GC tường minh.",
      },
      {
        option: "Parallel",
        when: "Batch, job nền chỉ cần throughput: rẻ nhất về CPU (khoảng +1% so với không GC), pause không quan trọng. Trong bài đo cùng tải nó còn cho p99 dưới 1 ms vì tổng thời gian bị dừng chỉ ~0,8%, nhưng pause vẫn tăng theo dữ liệu sống.",
      },
      {
        option: "ZGC thế hệ",
        when: "Hợp với SLA p99/p99.9 chặt và dữ liệu sống lớn: pause không phụ thuộc dữ liệu sống, p99 0,22 ms. Điều kiện: dư CPU (+19% so với không GC), heap ≥ khoảng 1,7 lần dữ liệu sống đo bằng ZGC (không có compressed oops, +23% heap); khi không theo kịp thì allocation stall. Trong pod 1 vCPU là lựa chọn sai: p99 không tốt hơn, công suất thấp nhất, RSS 389 MB.",
      },
      {
        option: "Shenandoah thế hệ (JDK 25+)",
        when: "Như ZGC nhưng heap vừa phải: p99 0,30 ms, giữ được compressed oops nên tốn heap ít hơn, xuống cấp từ từ hơn khi chật. Phải đặt ShenandoahGCMode=generational — chế độ mặc định cũ có pause nhỏ mà p99 134 ms vì pacing.",
      },
    ],
    mustCover: [
      "Pause không đồng nghĩa với latency: ZGC có pause dài nhất 0,046 ms nhưng max latency vẫn 9,5 ms vì thread GC đồng thời giành CPU; p99 phụ thuộc phần trăm thời gian bị dừng — G1 pause ít mà dài khoảng 22 ms nên p99 rơi đúng vào pause",
      "Cái giá CPU: việc GC đồng thời vẫn phải làm trên lõi khác cộng barrier trên mỗi lần đọc/ghi tham chiếu — ZGC thêm 19% CPU so với Epsilon, G1 thêm 6%; barrier đọc +24% (ZGC) / +59% (Shenandoah) trong vòng lặp chặt toàn tham chiếu nhưng biến mất khi bộ nhớ là nút thắt",
      "Cái giá bộ nhớ: colored pointer cần 64 bit nên ZGC không dùng được compressed oops, cùng dữ liệu tốn thêm 23% heap; giữ nguyên -Xmx khi chuyển từ G1 sang ZGC là lấy đi khoảng một phần tư chỗ dự phòng",
      "Khi GC đồng thời không theo kịp, ZGC bắt từng thread cấp phát chờ (allocation stall) mà log pause vẫn đẹp: 423 lần stall cộng 3,7 s trong 20 s với pause dài nhất 1,4 ms; Shenandoah xuống cấp qua pacing, degenerated GC rồi Full GC — ở 440 MB không GC nào cứu được latency",
      "Trong pod 1 vCPU, CFS throttling chi phối: mọi GC cho p99 16–26 ms, thêm lõi thứ hai đưa tất cả về khoảng 2,4 ms; ergonomics chọn Serial dưới 2 CPU hoặc dưới 1792 MB tới JDK 26, JDK 27 (JEP 523) đổi sang G1 — nên chỉ định GC tường minh",
    ],
    model:
      "Pause dưới 1 ms là lời hứa có điều kiện: điều kiện là đủ CPU và đủ chỗ dự phòng. Bài đặt năm collector vào cùng một service, heap 1 GB, ~300 MB dữ liệu sống, 5 000 req/s — đúng hình dạng service B. ZGC thắng rõ ở p99: 0,22 ms so với 12,4 ms của G1. Nhưng có bốn bài học. Một, pause không đồng nghĩa với latency: pause dài nhất của ZGC chỉ 0,046 ms mà max latency vẫn 9,5 ms, vì thread GC đồng thời giành CPU với worker trên máy 2 vCPU; ngược lại, p99 là bài toán 'bao nhiêu phần trăm thời gian bị dừng' — G1 chọn Eden lớn (mục tiêu 200 ms cho phép), pause ít mà mỗi lần ~22 ms, nên p99 rơi đúng vào pause. Hai, cái giá CPU: việc GC không biến mất mà được làm trên lõi khác, cộng barrier trên mỗi lần đọc/ghi tham chiếu; so với mốc Epsilon, Parallel gần như không tốn thêm, G1 thêm 6%, ZGC thêm 19%. Barrier đọc đo bằng JMH tốn +24% với ZGC và +59% với Shenandoah trong vòng lặp chặt toàn tham chiếu, nhưng biến mất khi bộ nhớ là nút thắt như duyệt danh sách liên kết. Ba, cái giá bộ nhớ: colored pointer cần 64 bit nên ZGC không dùng được compressed oops — cùng 449 nghìn session tốn 358 MB so với 290 MB của G1, +23%; chuyển sang ZGC mà giữ nguyên -Xmx là lấy đi một phần tư chỗ dự phòng. Bốn, khi không theo kịp, ZGC không dừng cả JVM mà bắt từng thread cấp phát chờ: ở heap 440 MB có 423 lần allocation stall, cộng 3,7 giây trong 20 giây, trong khi pause dài nhất 1,4 ms — dashboard jvm.gc.pause vẫn đẹp. Shenandoah xuống cấp qua pacing, degenerated GC, rồi Full GC; ở 440 MB, G1, ZGC và Shenandoah đều có p99 trên 100 ms — không GC nào cứu được latency khi heap không đủ. Nên với service B, tôi chọn ZGC thế hệ (trên JDK 21 phải tự bật -XX:+ZGenerational) hoặc Shenandoah thế hệ trên JDK 25+ với ShenandoahGCMode=generational nếu muốn giữ compressed oops — kèm điều kiện: dư CPU, heap ≥ khoảng 1,7 lần dữ liệu sống đo bằng chính ZGC, và cảnh báo trên allocation stall chứ không chỉ trên pause. Service A thì khác hẳn: trong pod 1 vCPU, CFS throttling chi phối — bốn GC cho p99 từ 15,6 đến 26,4 ms, bị throttle 21–27% số chu kỳ, còn thêm lõi thứ hai đưa mọi GC về khoảng 2,4 ms. ZGC ở đó là lựa chọn sai: p99 không tốt hơn, công suất thấp nhất, RSS 389 MB gấp 2,4 lần Serial. Pod này tới JDK 26 đang tự chạy Serial (dưới 2 CPU hoặc dưới 1792 MB), JDK 27 với JEP 523 sẽ đổi sang G1 với chênh lệch nhỏ. Tôi chỉ định GC tường minh (Serial hoặc G1, đo cả hai), và nếu p99 là vấn đề thì đòn bẩy là CPU, không phải đổi GC.",
    redFlags: [
      "Coi pause dưới 1 ms là latency dưới 1 ms",
      "Chuyển sang ZGC mà giữ nguyên -Xmx và không tính thêm CPU",
      "Đổi GC để sửa p99 trong pod 1 vCPU mà không nhìn throttling",
      "Bật Shenandoah ở chế độ mặc định không phân thế hệ",
    ],
    probes: [
      "Vì sao ZGC trên JDK 21 không bật -XX:+ZGenerational lại đốt gần gấp đôi CPU?",
      "Dấu hiệu nào trong log ZGC cho thấy GC không theo kịp dù pause vẫn nhỏ?",
      "Vì sao RSS của ZGC không phân thế hệ báo gấp ba và làm sao tránh báo động giả?",
    ],
    refs: ["uh-12", "uh-13", "uh-11"],
  },
  {
    id: "uh-iq12",
    field: "under-hood",
    topic: "uh-gc",
    level: 4,
    minutes: 16,
    incident: {
      symptom:
        "Service báo giá (Spring Boot, G1) đột nhiên trả lỗi 500 hàng loạt, latency lên hàng giây. Log GC có Evacuation Failure rồi một chuỗi Pause Full (G1 Compaction Pause) 255M->250M(256M) liên tiếp; app.out có OutOfMemoryError: Java heap space trên các thread http-nio-8080-exec-*. Pod không tự restart; khi rollout gửi SIGTERM, tiến trình không phản hồi cho tới khi bị SIGKILL sau grace period. Dashboard jvm.memory.used có hình răng cưa 'giống mọi ngày' nên không cảnh báo nào kêu trước đó.",
      scale:
        "-Xmx256m, khoảng 750 báo giá/giây. Endpoint /quotes dùng một ConcurrentHashMap làm cache bên trong một @Service, khoá gồm customer, coupon và thời điểm gửi request (requestedAt). Trên staging với cùng tải, sau mỗi lần restart sự cố lặp lại sau khoảng 9 phút.",
      constraints:
        "Heap dump chứa token và dữ liệu khách hàng: chính sách bảo mật cấm mang file ra khỏi cluster, /actuator/heapdump không được mở ra ngoài. Tăng -Xmx không được chấp nhận làm giải pháp. Việc chẩn đoán phải ảnh hưởng tối thiểu tới các pod đang phục vụ.",
    },
    question:
      "Dẫn dắt cuộc điều tra: xác định đây là leak hay cache, tìm ra ai đang giữ bộ nhớ, rồi đưa ra cách sửa và phòng ngừa — kể cả giải thích vì sao pod không tự chết.",
    mustCover: [
      "Theo dõi heap sau GC (đáy răng cưa), không phải heap đang dùng: leak tăng tuyến tính không chững (khoảng 25 MB mỗi phút), cache có giới hạn tăng rồi chững, khoẻ thì phẳng; metric jvm.gc.live.data.size so với jvm.gc.max.data.size; giai đoạn cuối là heap sau GC sát -Xmx, Evacuation Failure, rồi Pause Full có 'sau' gần bằng 'trước'",
      "So hai GC.class_histogram cách nhau vài phút: Quote, QuoteKey và ConcurrentHashMap$Node tăng cùng một số lượng (khoảng 134 nghìn) là dấu vân tay của một map mà mỗi entry giữ một Quote; lưu ý histogram chạy một Full GC trước khi đếm",
      "Heap dump bằng jcmd GC.heap_dump dừng ứng dụng trong một safepoint, file khoảng 1,6 lần dữ liệu sống và chứa dữ liệu nhạy cảm — lấy trên instance đã rút khỏi load balancer, phân tích trong cluster; dominator tree cho thấy một object nhỏ giữ retained khổng lồ (QuoteService 32 byte giữ 95,9 MB, 87% heap) với rất nhiều con nhỏ, path to GC roots đi Quote ← QuoteService.cache ← singletonObjects ← context ← thread main",
      "Không cần dump: JFR jdk.OldObjectSample với profile.jfc (có stack trace) và JFR.dump path-to-gc-roots=true chỉ thẳng tới QuoteService.compute, file nhỏ và gần như không chứa dữ liệu nghiệp vụ",
      "JVM sống dở hơn 20 phút ở 94–100% thời gian trong GC và bỏ qua SIGTERM vì OutOfMemoryError ném trong thread xử lý request, Tomcat bắt và trả 500; cần -XX:+ExitOnOutOfMemoryError cùng -XX:+HeapDumpOnOutOfMemoryError (JDK 26 thêm UseGCOverheadLimit cho G1)",
      "Sửa gốc là khoá cache: requestedAt nằm trong equals nên tỉ lệ trúng 0% theo cấu tạo; giới hạn kích thước chỉ sửa triệu chứng; dùng Caffeine với maximumSize/expireAfterWrite thay vì ConcurrentMapCacheManager mặc định không giới hạn, bật recordStats để cảnh báo khi tỉ lệ trúng gần 0%",
    ],
    model:
      "Việc đầu tiên là đổi cái nhìn: dashboard jvm.memory.used luôn có hình răng cưa đi lên với G1 vì thế hệ già chỉ được dọn sau một chu kỳ marking — cảnh báo trên nó sẽ kêu cả ngày hoặc, như ở đây, không ai tin. Thứ nói lên sức khoẻ là heap ngay sau GC, tức đáy răng cưa — trong Micrometer là jvm.gc.live.data.size so với jvm.gc.max.data.size. Vẽ con số 'sau' của các dòng Pause trong log GC, bài phân biệt rõ ba trường hợp: phẳng là khoẻ, tăng rồi chững là cache có giới hạn, tăng tuyến tính không chững là leak — ở đây khoảng 25 MB mỗi phút. Giai đoạn cuối có ba dấu hiệu đúng theo thứ tự trong log của chúng tôi: heap sau GC sát -Xmx, Evacuation Failure, rồi Pause Full mà 'sau' gần bằng 'trước'. Để biết cái gì tăng, tôi chụp hai jcmd GC.class_histogram cách nhau vài phút trên một pod staging (lưu ý nó chạy một Full GC trước khi đếm) và so hiệu: Quote, QuoteKey và ConcurrentHashMap$Node cùng tăng khoảng 134 nghìn — dấu vân tay của một map mà mỗi entry giữ một Quote; byte[] và String đứng đầu chẳng nói gì. Để biết ai giữ, có hai đường tôn trọng ràng buộc bảo mật. Đường nhẹ: bật JFR với profile.jfc (default.jfc không kèm stack trace cho jdk.OldObjectSample), rồi JFR.dump với path-to-gc-roots=true — mẫu OldObjectSample cho cả đường tới root lẫn stack cấp phát, chỉ thẳng QuoteService.compute; file khoảng 20 MB, gần như không chứa dữ liệu nghiệp vụ. Đường nặng: jcmd GC.heap_dump trên một instance đã rút khỏi load balancer, vì nó dừng ứng dụng trong safepoint suốt lúc ghi và file to khoảng 1,6 lần dữ liệu sống; phân tích ngay trong cluster, xoá khi xong. Dominator tree sẽ cho thấy chữ ký của gần như mọi leak: một object nhỏ với retained khổng lồ — QuoteService 32 byte giữ 95,9 MB, 87% heap — cùng hàng trăm nghìn con nhỏ, không object nào 'to'. Path to GC roots đọc từ dưới lên: Quote nằm trong QuoteService.cache, QuoteService là singleton trong singletonObjects của Spring, context được thread main giữ suốt đời. Vì sao pod không tự chết? OutOfMemoryError được ném trong thread xử lý request; Tomcat bắt, trả 500, thread khác lại thử — bài đo được JVM sống dở hơn 20 phút ở 94–100% thời gian trong GC và bỏ qua cả SIGTERM. Nên tôi bật -XX:+ExitOnOutOfMemoryError cùng -XX:+HeapDumpOnOutOfMemoryError với HeapDumpPath trên volume trong cluster; JDK 26 còn có UseGCOverheadLimit cho G1. Cách sửa gốc là khoá: requestedAt nằm trong equals nên mỗi request là một khoá mới, tỉ lệ trúng 0% theo cấu tạo — cache chỉ lớn lên. Thêm giới hạn kích thước chỉ sửa triệu chứng: bản LRU 20 000 mục giữ bộ nhớ ổn định nhưng vẫn là 20 000 mục rác có trật tự. Tôi bỏ requestedAt khỏi khoá, chuyển sang Caffeine với maximumSize và expireAfterWrite thay vì ConcurrentMapCacheManager mặc định không giới hạn, bật recordStats để cảnh báo khi tỉ lệ trúng gần 0%, và đặt cảnh báo trên xu hướng heap sau GC.",
    redFlags: [
      "Tăng -Xmx để 'mua thời gian'",
      "Tìm thủ phạm bằng object lớn nhất trong một histogram duy nhất",
      "Chỉ thêm giới hạn kích thước cho cache mà không sửa khoá",
      "Kéo heap dump về máy cá nhân hoặc mở /actuator/heapdump ra ngoài",
    ],
    probes: [
      "Vì sao dominator tree chỉ có khoảng 129 nghìn node con trực tiếp trong khi heap có 180 nghìn Quote?",
      "Cái giá của jcmd GC.class_histogram và GC.heap_dump trên heap vài GB là gì?",
      "Một cache có giới hạn trông khác một leak thế nào trên đường heap sau GC và trong histogram?",
    ],
    refs: ["uh-14", "uh-10", "uh-11"],
  },
];
