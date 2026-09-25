// Ngân hàng câu hỏi phỏng vấn Effective Java — phần 1 (ej-iq01–ej-iq12).
// Gộp vào interview.js ở Task 6. Hợp đồng theo cấp giống hệt ngân hàng JPA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)

export const ejInterviewPart1 = [
  // ===== ej-create (ej-iq01–ej-iq04) =====
  {
    id: "ej-iq01",
    field: "effective-java",
    topic: "ej-create",
    level: 1,
    minutes: 5,
    question: "Ngoài public constructor, một class còn có thể cho client lấy instance qua một static method trả về chính kiểu đó. Khi nào bạn chọn cách này? Nêu những gì nó đem lại so với constructor, cái giá phải trả, và các tên gọi quen thuộc cho loại method này.",
    mustCover: [
      "Static factory **có tên**, nên diễn đạt được đối tượng trả về (ví dụ `BigInteger.probablePrime`) và thay được những constructor chỉ khác nhau ở thứ tự kiểu tham số",
      "**Không bắt buộc tạo đối tượng mới** mỗi lần gọi: dùng lại hoặc cache instance (`Boolean.valueOf`), cho phép class instance-controlled — singleton, noninstantiable, hoặc `a.equals(b)` khi và chỉ khi `a == b`",
      "Trả về được **bất kỳ subtype nào** của kiểu khai báo, nhờ đó ẩn implementation class — API gọn như `java.util.Collections`",
      "Class của đối tượng trả về **có thể đổi theo tham số** và giữa các phiên bản (`EnumSet` trả `RegularEnumSet` hay `JumboEnumSet` tuỳ số phần tử)",
      "Class trả về **không cần tồn tại lúc viết method** — nền tảng của service provider framework như JDBC",
      "Nhược điểm 1: class chỉ có static factory, không có constructor public/protected thì **không kế thừa được** (bù lại khuyến khích composition)",
      "Nhược điểm 2: **khó tìm** trong tài liệu API — giảm nhẹ bằng quy ước tên `from`, `of`, `valueOf`, `getInstance`/`instance`, `newInstance`/`create`, `getType`, `newType`, `type`",
    ],
    model: "Tôi coi static factory là lựa chọn mặc định đáng cân nhắc trước, và tôi chỉ ra năm lý do rồi mới nói tới cái giá. Thứ nhất, nó có tên. Constructor `BigInteger(int, int, Random)` không nói được là nó trả về một số có khả năng là số nguyên tố, còn `BigInteger.probablePrime` thì nói ngay. Có tên cũng giải quyết chuyện một class cần hai cách khởi tạo cùng signature — thay vì hai constructor chỉ khác thứ tự tham số, thứ mà không ai nhớ nổi, tôi viết hai factory có tên khác nhau. Thứ hai, factory không bắt buộc tạo đối tượng mới. `Boolean.valueOf` không bao giờ tạo object; một immutable class có thể cache instance và phát lại. Khả năng này biến class thành instance-controlled: nó đảm bảo được singleton, noninstantiable, hay với value class bất biến là hai instance bằng nhau thì chính là một — enum là ví dụ quen thuộc. Thứ ba, factory trả về được bất kỳ subtype nào của kiểu khai báo, nên tôi giấu được implementation class. `java.util.Collections` xuất ra hàng chục cài đặt tiện ích mà class của chúng đều nonpublic; client chỉ cần biết interface. Thứ tư, class trả về có thể đổi theo tham số: `EnumSet` trả `RegularEnumSet` dựa trên một `long` khi enum có từ 64 phần tử trở xuống, và `JumboEnumSet` khi nhiều hơn — client không biết và không cần biết, nên thư viện được tự do thay cài đặt ở phiên bản sau. Thứ năm, class trả về thậm chí không cần tồn tại lúc viết factory, và đó là nền của service provider framework: trong JDBC, `DriverManager.getConnection` là service access API, trả về một `Connection` do driver nạp sau cung cấp. Giờ đến cái giá. Class chỉ có static factory mà không có constructor public hay protected thì không kế thừa được — sách coi đó là cái may trong cái rủi vì nó đẩy người ta sang composition. Và factory khó tìm hơn constructor trong Javadoc, nên tôi bám theo quy ước tên: `from` cho chuyển đổi một tham số, `of` cho gộp nhiều tham số, `valueOf` là dạng dài của hai cái đó, `getInstance` khi có thể trả lại instance cũ còn `newInstance` hay `create` khi cam kết lần nào cũng mới, và `getType`, `newType` khi factory nằm ở class khác, như `Files.newBufferedReader`. Một lưu ý để tránh nhầm: static factory method ở đây không phải mẫu Factory Method trong Design Patterns.",
    redFlags: [
      "Nhầm static factory method với mẫu Factory Method của Design Patterns",
      "Cho rằng static factory lúc nào cũng tạo instance mới như constructor",
      "Chỉ kể ưu điểm, không nêu được nhược điểm nào",
      "Không phân biệt được ý nghĩa của `getInstance` với `newInstance`",
    ],
    probes: [
      "`EnumSet.noneOf` trả về đối tượng thuộc class nào, và vì sao client không cần biết?",
      "Không kế thừa được một class chỉ có static factory — đó là hạn chế hay lợi thế?",
      "Trong JDBC, đâu là service interface, provider registration API và service access API?",
    ],
    refs: ["ej-02"],
  },
  {
    id: "ej-iq02",
    field: "effective-java",
    topic: "ej-create",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Dùng làm hàng đợi việc cần xử lý trong một service chạy dài hạn.
// Mỗi Job giữ payload vài chục KB.
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(Object e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() {
        if (size == 0)
            throw new EmptyStackException();
        return elements[--size];
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}`,
    },
    question: "Class này qua mọi unit test. Nhưng sau một đợt cao điểm đẩy vào 200.000 job rồi xử lý hết, heap dump của service vẫn thấy khoảng 200.000 object `Job` còn sống dù stack đã rỗng. Chỉ ra lỗi, sửa nó, và giải thích vì sao garbage collector không tự thu hồi những object đó.",
    mustCover: [
      "`pop()` chỉ giảm `size` mà để nguyên tham chiếu trong ô `elements[size]` — đó là **obsolete reference** (tham chiếu lỗi thời)",
      "Với GC, mọi ô trong mảng `elements` đều là tham chiếu hợp lệ như nhau; **chỉ lập trình viên biết** phần từ `size` trở đi là vùng không hoạt động",
      "Sửa: đọc phần tử ra biến trước, rồi gán `elements[size] = null`, rồi mới trả về",
      "Một object bị giữ ngoài ý muốn giữ luôn cả đồ thị object mà nó tham chiếu (unintentional object retention) — vài tham chiếu có thể giữ rất nhiều bộ nhớ",
      "Lợi ích phụ: truy cập nhầm phần tử đã pop sẽ ném `NullPointerException` ngay thay vì âm thầm sai",
      "Nguyên tắc: class **tự quản lý bộ nhớ** của mình thì phải cảnh giác với rò rỉ; còn gán null nói chung nên là **ngoại lệ, không phải thói quen**",
    ],
    model: "Lỗi nằm ở `pop()`. Nó giảm `size` rồi trả về phần tử, nhưng ô `elements[size]` vẫn giữ tham chiếu tới object vừa pop. Ô đó từ giờ không bao giờ được đọc lại nữa — sách gọi nó là obsolete reference. Nhưng GC không biết chuyện đó. Với GC, mảng `elements` là một object còn sống, và mọi ô trong mảng đều là tham chiếu hợp lệ như nhau; khái niệm \"phần hoạt động là các ô dưới `size`\" chỉ tồn tại trong đầu người viết class. Cho nên sau đợt cao điểm, mảng đã phình ra hơn 200.000 ô và mỗi ô vẫn trỏ tới một `Job` đã xử lý xong. Chừng nào stack chưa được push lại tới đúng độ sâu đó, những job này sống mãi. Và điều làm con số trong heap dump lớn là mỗi `Job` còn kéo theo payload và mọi thứ nó tham chiếu — giữ một object ngoài ý muốn là giữ cả đồ thị phía sau nó. Cách sửa rất ngắn: đọc phần tử ra một biến, gán `elements[size] = null`, rồi trả biến đó. Thứ tự quan trọng: gán null trước khi đọc thì tôi trả về null. Bản sửa còn có một lợi ích phụ: nếu sau này có code nào lỡ đọc lại ô đã pop, nó ném `NullPointerException` ngay chứ không âm thầm xử lý lại một job cũ. Tôi muốn nói thêm về chỗ dừng của bài học này, vì phản ứng thường gặp là đi gán null mọi biến sau khi dùng xong. Không cần và không nên; cách tự nhiên để bỏ một tham chiếu là để biến ra khỏi scope, và khai báo biến trong scope hẹp nhất là đủ. Gán null thủ công chỉ đáng làm ở đúng loại class như thế này: class tự quản lý một vùng lưu trữ, nơi chỉ lập trình viên biết ô nào đã được giải phóng. Gặp class như vậy — pool, buffer, cache tự viết — tôi mặc định nghi ngờ rò rỉ. Hai nguồn rò rỉ quen thuộc khác cùng họ là cache quên dọn và listener đăng ký mà không huỷ đăng ký. Loại lỗi này hiếm khi làm chương trình chết ngay, nên thường chỉ phát hiện nhờ review kỹ hoặc heap profiler, như chính cách đội tìm ra nó ở đây.",
    redFlags: [
      "Cho rằng Java có GC nên không thể có memory leak",
      "Gán `elements[size] = null` trước khi đọc phần tử ra, khiến `pop()` trả về `null`",
      "Đề xuất gọi `System.gc()` để dọn",
      "Khuyên gán null mọi biến cục bộ sau khi dùng như một thói quen",
    ],
    probes: [
      "Một cache dùng `HashMap` trong service có cùng loại vấn đề không? Khi nào `WeakHashMap` là lựa chọn đúng, khi nào không?",
      "Listener đăng ký mà không bao giờ huỷ đăng ký gây rò rỉ thế nào, và bạn chặn nó ra sao?",
      "Nếu không có heap dump trong tay, bạn phát hiện loại rò rỉ này bằng cách nào?",
    ],
    refs: ["ej-02"],
  },
  {
    id: "ej-iq03",
    field: "effective-java",
    topic: "ej-create",
    level: 3,
    minutes: 10,
    question: "Bạn thiết kế class `HttpClientConfig` phải là immutable: 2 tham số bắt buộc (host, port) và 8 tham số tuỳ chọn — connect timeout, read timeout, số lần retry, kích thước pool… phần lớn cùng kiểu `int`. Đưa ra các cách cho client tạo instance, chọn một và bảo vệ lựa chọn đó.",
    tradeoffs: [
      {
        option: "Telescoping constructor",
        when: "Một constructor cho tham số bắt buộc, rồi mỗi constructor thêm một tham số tuỳ chọn. An toàn — field `final`, kiểm tra được trong constructor — nhưng với 10 tham số thì khó viết và khó đọc hơn nữa: người đọc phải đếm vị trí, client buộc phải truyền giá trị cho cả những tham số không quan tâm, và đảo hai `int` cạnh nhau vẫn biên dịch rồi sai ở runtime. Chỉ hợp khi có ba tham số trở xuống và không có dấu hiệu sẽ tăng.",
      },
      {
        option: "JavaBeans (constructor không tham số + setter)",
        when: "Dễ đọc, nhưng đối tượng đi qua trạng thái không nhất quán giữa các lời gọi setter, class không kiểm tra được bất biến tại một điểm, và mẫu này **loại bỏ khả năng immutable**, kéo theo công sức lo thread safety. Biến thể \"freeze\" thủ công cồng kềnh và trình biên dịch không ép được việc gọi freeze. Không đáp ứng đề bài.",
      },
      {
        option: "Builder (static member class)",
        when: "Tham số bắt buộc vào constructor của builder, tham số tuỳ chọn qua các method trả về `this`, cuối cùng `build()` sinh ra đối tượng immutable. Mô phỏng tham số tuỳ chọn có tên, mọi giá trị mặc định nằm một chỗ. Cái giá: phải tạo thêm object builder và mã dài hơn — sách khuyên dùng khi có khoảng bốn tham số trở lên. Phù hợp đề bài.",
      },
    ],
    mustCover: [
      "Telescoping constructor an toàn nhưng **khó viết, khó đọc**; hai tham số cùng kiểu bị đảo vẫn biên dịch và sai ở runtime",
      "JavaBeans để đối tượng ở **trạng thái không nhất quán giữa chừng** và loại bỏ khả năng làm class immutable",
      "Builder: tham số bắt buộc qua constructor của builder, tham số tuỳ chọn qua method trả về `this`, `build()` sinh đối tượng immutable",
      "Kiểm tra hợp lệ: từng tham số trong method của builder; bất biến liên quan nhiều tham số trong constructor mà `build` gọi, **sau khi đã sao chép** giá trị từ builder; vi phạm thì ném `IllegalArgumentException` kèm thông điệp chỉ rõ tham số",
      "Cái giá của builder là thêm một object và mã dài dòng hơn — đáng khi có từ khoảng bốn tham số",
      "Số tham số có xu hướng tăng theo thời gian, nên **bắt đầu bằng builder** thay vì chuyển sang giữa chừng và để lại constructor lỗi thời",
      "Class đích vẫn phải đúng chuẩn immutable: field `final` private, không setter, không cho kế thừa",
    ],
    model: "Tôi chọn builder, và tôi đi qua hai phương án kia để cho thấy vì sao chúng rơi. Telescoping constructor không sai về chức năng — field vẫn `final`, vẫn kiểm tra được trong constructor. Vấn đề là với mười tham số mà phần lớn là `int`, lời gọi thành một dãy số mà người đọc phải đếm vị trí mới hiểu, client phải truyền cả giá trị cho những tham số mình không quan tâm, và nguy hiểm nhất là đảo connect timeout với read timeout vẫn biên dịch êm rồi sai ở runtime. JavaBeans thì dễ đọc nhưng vi phạm thẳng yêu cầu đề bài: dựng đối tượng qua nhiều lời gọi setter nghĩa là có những khoảnh khắc đối tượng ở trạng thái không nhất quán, class không có chỗ nào để kiểm tra bất biến một lần, và có setter thì không còn immutable, kéo theo phải lo thread safety. Có người sẽ đề xuất thêm method \"freeze\", nhưng trình biên dịch không ép được ai gọi nó trước khi dùng. Với builder: host và port là bắt buộc nên nằm trong constructor của `HttpClientConfig.Builder`; tám tham số tuỳ chọn có giá trị mặc định ngay trong builder và mỗi cái có một method trả về `this`; cuối cùng `build()` gọi constructor private của class. Client viết `new HttpClientConfig.Builder(host, 443).connectTimeout(2_000).readTimeout(10_000).build()`, tức là mỗi con số đi kèm tên của nó — sách gọi đây là mô phỏng tham số tuỳ chọn có tên. Về kiểm tra hợp lệ, tôi làm hai tầng: từng tham số được kiểm ngay trong method của builder để lỗi lộ sớm, còn bất biến liên quan nhiều tham số — chẳng hạn connect timeout không được lớn hơn read timeout — kiểm trong constructor mà `build` gọi, và kiểm trên field của đối tượng sau khi đã sao chép từ builder, để không ai sửa builder chen giữa lúc kiểm và lúc chép. Sai thì ném `IllegalArgumentException` nói rõ tham số nào sai. Class đích vẫn phải đúng chuẩn immutable: field `private final`, không setter, và không cho kế thừa. Cái giá tôi chấp nhận là thêm một object builder cho mỗi lần tạo — với một object cấu hình tạo lúc khởi động thì không đáng kể — và mã dài hơn. Nhưng sách có một lập luận làm tôi chọn builder ngay từ đầu: cấu hình kiểu này gần như chắc chắn sẽ thêm tham số, và nếu bắt đầu bằng constructor rồi chuyển sang builder sau, các constructor cũ nằm lại trong API như cái gai.",
    redFlags: [
      "Chọn JavaBeans rồi hứa sẽ \"không gọi setter sau khi dùng\" — dựa vào quy ước thay vì để trình biên dịch ép",
      "Builder có mà class đích vẫn có setter hoặc field không `final`",
      "Kiểm tra bất biến trên field của builder rồi mới sao chép sang đối tượng",
      "Liệt kê ba phương án rồi không chốt phương án nào",
    ],
    probes: [
      "Nếu có một cây class — abstract `Pizza` với `NyPizza`, `Calzone` — builder viết thế nào để nối chuỗi method ở subclass không cần ép kiểu?",
      "Bất biến `connectTimeout <= readTimeout` bạn kiểm ở đâu, và vì sao không kiểm trong builder?",
      "Khi nào chi phí tạo thêm object builder thực sự đáng lo?",
    ],
    refs: ["ej-02", "ej-04"],
  },
  {
    id: "ej-iq04",
    field: "effective-java",
    topic: "ej-create",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `public final class ReportWriter {
    private final BufferedWriter out;

    public ReportWriter(Path file) throws IOException {
        out = Files.newBufferedWriter(file);
    }

    public void writeRow(String row) throws IOException {
        out.write(row);
        out.newLine();
    }

    public void close() throws IOException { out.close(); }

    @Override protected void finalize() throws Throwable {
        close();                              // "phòng khi ai đó quên đóng"
    }
}

void export(Path src, Path dst) throws IOException {
    BufferedReader in = Files.newBufferedReader(src);
    ReportWriter out = new ReportWriter(dst);
    try {
        String line;
        while ((line = in.readLine()) != null)
            out.writeRow(transform(line));
    } finally {
        out.close();
        in.close();
    }
}

// Ở một chỗ khác trong code
new ReportWriter(summaryPath).writeRow(total);   // "đã có finalize lo"`,
    },
    incident: {
      symptom: "Service xuất báo cáo CSV chạy ổn vài giờ sau mỗi lần deploy, rồi bắt đầu ném `IOException: Too many open files` ở mọi thao tác mở file, và cả khi nhận kết nối HTTP mới. Restart thì hết, vài giờ sau lại bị. Log của những lượt xuất báo cáo lỗi trước đó chỉ thấy exception ném ra từ `close()`, không thấy lỗi nào khác. Ở staging, test tải chạy cả ngày không tái hiện được.",
      scale: "3 instance, mỗi instance xử lý khoảng 5.000 lượt xuất mỗi giờ, `ulimit -n` là 1024. Khoảng 3% lượt gặp lỗi I/O (ổ mạng chập chờn, file nguồn bị xoá giữa chừng, dòng dữ liệu hỏng làm `transform` ném exception). Heap 8 GB, GC chạy thưa.",
      constraints: "Đội hạ tầng chỉ đồng ý tăng `ulimit` tạm thời, không coi là giải pháp. Định dạng file đầu ra phải giữ nguyên. Bản sửa phải lên trong cửa sổ phát hành tuần này và phải có số liệu chứng minh rò rỉ đã hết.",
    },
    question: "Bạn trực on-call tuần này. Trình bày cách bạn xác nhận nguyên nhân, cách sửa code, vai trò của `finalize()` trong chuyện này, và cách chứng minh là đã hết.",
    mustCover: [
      "Xác nhận bằng số liệu: theo dõi số file descriptor đang mở của process theo thời gian và thấy nó tăng theo số lượt lỗi I/O, không theo tải",
      "`try`-`finally` viết sai: `ReportWriter` được mở trước `try` nên nếu constructor ném thì `in` bị bỏ mở; `out.close()` ném thì `in.close()` không bao giờ chạy — rò descriptor đúng trên đường lỗi",
      "Finalizer **không đảm bảo chạy kịp thời, thậm chí không đảm bảo chạy**; file descriptor là tài nguyên có hạn nên không bao giờ được dựa vào finalizer để đóng file",
      "Heap lớn, GC thưa nên object chờ finalize nằm rất lâu; hành vi phụ thuộc thuật toán GC và cấu hình JVM — lý do staging không tái hiện",
      "Exception từ `close()` trong `finally` **xoá mất exception gốc** — lý do log chỉ thấy lỗi ở `close()`",
      "Sửa: `ReportWriter` implement `AutoCloseable`, mọi chỗ dùng chuyển sang `try`-with-resources khai báo cả hai tài nguyên",
      "`try`-with-resources giữ exception gốc; exception từ `close` bị **suppressed** và vẫn xem được qua `getSuppressed`",
      "Bỏ `finalize()`; nếu muốn lưới an toàn thì dùng `Cleaner` và chỉ coi là lưới an toàn; `close()` ghi nhận trạng thái đã đóng để các method khác ném `IllegalStateException`",
      "Chứng minh: số descriptor sau deploy đi ngang trong nhiều giờ, cộng test ép lỗi I/O giữa chừng và khẳng định mọi tài nguyên đã đóng",
    ],
    model: "Trước khi đọc code, tôi muốn con số. Tôi đếm số file descriptor đang mở của process mỗi vài phút trên một instance và đặt cạnh hai đường: số lượt xuất và số lượt lỗi. Nếu descriptor tăng theo tải thì đó là cấu hình pool; còn nếu nó tăng theo số lượt lỗi và không bao giờ giảm thì đó là rò rỉ trên đường lỗi. Với dữ liệu đề bài, 3% của 5.000 lượt mỗi giờ là khoảng 150 lượt lỗi, với giới hạn 1024 thì vài giờ là cạn — khớp đúng triệu chứng. Đọc `export` thì thấy hai lỗ. Một: `ReportWriter` được mở trước khi vào `try`, nên nếu constructor của nó ném — ví dụ thư mục đích trên ổ mạng tạm mất — thì `in` đã mở mà không bao giờ được đóng. Hai: trong `finally`, nếu `out.close()` ném — mà flush lên ổ mạng chập chờn thì rất dễ ném — thì `in.close()` ở dòng sau không bao giờ chạy. Sách nói thẳng là đóng tài nguyên đúng bằng `try`-`finally` khó đến mức chính tác giả từng viết sai, và ở đây có thêm một khiếm khuyết tinh tế giải thích luôn chi tiết log: khi thân `try` đã ném và `close()` trong `finally` cũng ném, exception thứ hai xoá sạch exception thứ nhất. Vì thế log chỉ còn lỗi ở `close()`, còn lỗi gốc — dòng hỏng hay file bị xoá — biến mất. Bây giờ đến `finalize()`. Đội tin rằng nó là tấm lưới, và chính niềm tin đó cho phép dòng `new ReportWriter(summaryPath).writeRow(total)` tồn tại. Nhưng finalizer không có đảm bảo nào về thời điểm chạy, thậm chí không đảm bảo sẽ chạy. Heap 8 GB với GC thưa nghĩa là những object chờ finalize có thể nằm đó hàng giờ, mỗi object giữ một descriptor. Và độ trễ này phụ thuộc thuật toán GC và cấu hình heap, nên staging với heap và kiểu tải khác không tái hiện được là chuyện dễ hiểu. Sách nêu đúng ví dụ này: dựa vào finalizer để đóng file là sai lầm nghiêm trọng vì descriptor là tài nguyên có hạn. Cách sửa: `ReportWriter` implement `AutoCloseable`, và `export` viết lại bằng `try`-with-resources khai báo cả `in` lẫn `out` trong cùng một câu lệnh. Mỗi tài nguyên mở thành công đều được đóng, kể cả khi tài nguyên sau ném lúc mở. Và nếu cả thân lẫn `close()` cùng ném thì exception gốc được giữ, exception từ `close` bị suppressed nhưng vẫn in trong stack trace và lấy được qua `getSuppressed` — nghĩa là từ bản sửa này log sẽ nói đúng chuyện gì xảy ra. Dòng ghi summary cũng chuyển sang `try`-with-resources. Tôi bỏ `finalize()` — ngoài chuyện không đáng tin, nó còn làm tạo và huỷ object chậm đi rất nhiều. Nếu đội vẫn muốn một lưới an toàn cho người quên đóng thì dùng `Cleaner` và nói rõ nó chỉ là lưới, không phải cơ chế chính. Tôi cũng để `close()` ghi nhận trạng thái đã đóng, và `writeRow` sau khi đóng thì ném `IllegalStateException`. Để chứng minh, tôi có hai thứ. Test tự động: giả lập `transform` ném giữa chừng, giả lập `close` ném, giả lập constructor của writer ném — mỗi trường hợp đều khẳng định tài nguyên đã đóng và exception gốc là exception được ném ra. Và số liệu production: sau deploy, đường số descriptor phải đi ngang qua nhiều giờ cao điểm thay vì leo dốc. Khi có đồ thị đó thì mới trả lại `ulimit` cũ cho đội hạ tầng.",
    redFlags: [
      "Tăng `ulimit` hoặc lên lịch restart định kỳ rồi coi là xong",
      "Gọi `System.gc()` hoặc `System.runFinalization()` để ép finalizer chạy",
      "Thêm finalizer hoặc cleaner cho mọi class nắm file thay vì đóng tường minh",
      "Không nhận ra log đang mất exception gốc",
      "Tự bọc try/catch quanh từng `close()` trong `finally` lồng nhau thay vì dùng `try`-with-resources",
    ],
    probes: [
      "Vì sao lỗi không tái hiện ở staging dù chạy test tải cả ngày?",
      "Các stream của thư viện Java cũng có lưới an toàn — vậy sao descriptor vẫn cạn?",
      "Nếu `ReportWriter` bọc một native handle thay vì file, bạn có giữ lại lưới an toàn nào không, và viết nó thế nào để không tự giữ lại object?",
    ],
    refs: ["ej-02"],
  },

  // ===== ej-object (ej-iq05–ej-iq08) =====
  {
    id: "ej-iq05",
    field: "effective-java",
    topic: "ej-object",
    level: 1,
    minutes: 5,
    question: "Khi override `equals`, bạn đang cam kết giữ những tính chất nào? Và vì sao người ta nói không thể cho một subclass của class cụ thể thêm một trường tham gia so sánh mà vẫn giữ được các tính chất ấy — có lối thoát nào không?",
    mustCover: [
      "Kể đủ năm điều: **phản xạ**, **đối xứng**, **bắc cầu**, **nhất quán**, và `x.equals(null)` phải trả `false`",
      "`equals` định nghĩa một quan hệ tương đương; collection phụ thuộc vào hợp đồng này nên vi phạm thì không đoán được `contains` hay `Set` sẽ cư xử ra sao",
      "Ví dụ `ColorPoint extends Point`: chỉ bằng khi đối số là `ColorPoint` thì phá đối xứng; so sánh \"mù màu\" với `Point` thường thì phá bắc cầu",
      "Dùng `getClass()` thay `instanceof` vi phạm **nguyên lý thay thế Liskov** — một subclass không thêm gì cũng không còn bằng `Point` nào",
      "Lối thoát: **composition** — `ColorPoint` chứa một `Point` private và cung cấp view `asPoint()`",
      "Thêm value component vào subclass của một **abstract class** thì không gặp vấn đề, vì không có instance nào của superclass",
    ],
    model: "`equals` phải là một quan hệ tương đương, và hợp đồng của nó có năm điều. Phản xạ: một đối tượng bằng chính nó. Đối xứng: `x.equals(y)` đúng khi và chỉ khi `y.equals(x)` đúng. Bắc cầu: x bằng y, y bằng z thì x bằng z. Nhất quán: gọi lại bao nhiêu lần cũng cho cùng kết quả nếu dữ liệu tham gia so sánh không đổi — nên `equals` không được dựa vào tài nguyên không đáng tin, như `java.net.URL` so địa chỉ IP qua mạng. Và cuối cùng, không đối tượng nào bằng `null`. Tôi coi trọng hợp đồng này vì class của mình không sống một mình: mọi collection đều giả định nó đúng, và một khi vi phạm thì không ai đoán được `contains` sẽ trả gì. Về vế thứ hai, ví dụ kinh điển là `ColorPoint extends Point` thêm trường màu. Nếu `ColorPoint.equals` chỉ trả true khi đối số cũng là `ColorPoint` cùng màu, thì một `Point(1, 2)` bằng `ColorPoint(1, 2, RED)` nhưng chiều ngược lại thì không — hỏng đối xứng. Nếu vá bằng cách so \"mù màu\" khi đối số là `Point` thường, thì đỏ bằng điểm thường, điểm thường bằng xanh, nhưng đỏ không bằng xanh — hỏng bắc cầu, và hai subclass khác nhau cùng làm kiểu này còn có thể gọi qua lại tới `StackOverflowError`. Có người đề xuất dùng `getClass()` thay `instanceof` để chỉ so cùng class. Nghe gọn, nhưng nó phá nguyên lý thay thế Liskov: một subclass chẳng thêm trường nào, chỉ đếm số instance chẳng hạn, cũng không còn bằng bất kỳ `Point` nào, nên một `Set<Point>` sẽ nói nó không có mặt dù toạ độ trùng. Sách kết luận đây là giới hạn căn bản: không thể mở rộng một class instantiable, thêm value component, mà giữ được hợp đồng — trừ khi bỏ lợi ích của trừu tượng hoá hướng đối tượng. Lối thoát là composition: `ColorPoint` không kế thừa mà chứa một `Point` private, và có method view `asPoint()` khi cần coi nó như một điểm. Còn một trường hợp an toàn nên biết: nếu superclass là abstract, như `Shape` với `Circle` và `Rectangle`, thì subclass thêm trường thoải mái vì không bao giờ có instance của chính superclass để so với. Và ví dụ không nên bắt chước trong JDK là `java.sql.Timestamp` kế thừa `Date` — nó vi phạm đối xứng.",
    redFlags: [
      "Chỉ kể được phản xạ, đối xứng, bắc cầu — quên nhất quán và điều khoản về `null`",
      "Khẳng định dùng `getClass()` là cách chuẩn để giải quyết",
      "Không biết đến lối thoát bằng composition",
      "Coi `java.sql.Timestamp extends Date` là mẫu đáng học theo",
    ],
    probes: [
      "Hai subclass `ColorPoint` và `SmellPoint` cùng dùng kiểu so sánh \"mù màu\" thì gọi `equals` chéo nhau có chuyện gì?",
      "Vì sao `equals` của `java.net.URL` bị coi là sai lầm?",
      "Công thức viết một `equals` chất lượng cao gồm những bước nào? Có cần kiểm tra `null` tường minh không?",
    ],
    refs: ["ej-03"],
  },
  {
    id: "ej-iq06",
    field: "effective-java",
    topic: "ej-object",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `public final class PhoneNumber {
    private final short areaCode, prefix, lineNum;

    public PhoneNumber(int areaCode, int prefix, int lineNum) {
        this.areaCode = rangeCheck(areaCode,  999, "area code");
        this.prefix   = rangeCheck(prefix,    999, "prefix");
        this.lineNum  = rangeCheck(lineNum,  9999, "line num");
    }

    @Override public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof PhoneNumber))
            return false;
        PhoneNumber pn = (PhoneNumber) o;
        return pn.lineNum == lineNum && pn.prefix == prefix
                && pn.areaCode == areaCode;
    }
    // ... không override hashCode
}

Map<PhoneNumber, String> m = new HashMap<>();
m.put(new PhoneNumber(707, 867, 5309), "Jenny");
String who = m.get(new PhoneNumber(707, 867, 5309));   // ?`,
    },
    question: "`equals` ở đây đã viết đúng công thức. Dòng cuối trả về gì, và vì sao? Sửa class để tra cứu hoạt động, viết `hashCode` của bạn và giải thích từng lựa chọn trong đó.",
    mustCover: [
      "`get` (gần như chắc chắn) trả `null`: hai instance bằng nhau theo `equals` nhưng dùng `hashCode` của `Object` nên có hash code khác nhau",
      "Điều khoản bị vi phạm: **đối tượng bằng nhau phải có hash code bằng nhau**",
      "Kể cả khi rơi vào cùng bucket vẫn trả `null`, vì `HashMap` lưu đệm hash code của entry và không kiểm tra `equals` khi hash không khớp",
      "Công thức: `result` khởi tạo bằng hash của trường quan trọng đầu tiên, mỗi trường tiếp theo `result = 31 * result + c`, với `c = Short.hashCode(field)`",
      "Chỉ dùng các trường tham gia `equals` — **phải loại** mọi trường không dùng trong `equals`",
      "`return 42` hợp lệ nhưng dồn mọi object vào một bucket, bảng băm thoái hoá thành danh sách liên kết — tuyến tính thành bậc hai",
      "`Objects.hash(...)` viết một dòng nhưng chậm hơn (tạo mảng varargs, boxing) — chỉ dùng khi hiệu năng không quan trọng",
    ],
    model: "Dòng cuối gần như chắc chắn trả `null`, dù `equals` đúng. Có hai instance `PhoneNumber` ở đây — một dùng để `put`, một dùng để `get` — và chúng bằng nhau theo `equals`. Nhưng class không override `hashCode`, nên cả hai dùng `hashCode` của `Object`, vốn coi chúng là hai đối tượng chẳng liên quan và trả hai số tuỳ ý. Đó là vi phạm điều khoản then chốt của hợp đồng: đối tượng bằng nhau phải có hash code bằng nhau. Hệ quả là `get` tìm trong một bucket khác với bucket mà `put` đã cất. Và kể cả khi tình cờ rơi cùng bucket, `get` vẫn gần như chắc chắn trả `null`, vì `HashMap` lưu hash code của mỗi entry và không buồn gọi `equals` nếu hash đã khác. Sửa là viết `hashCode` theo công thức trong sách: `int result = Short.hashCode(areaCode); result = 31 * result + Short.hashCode(prefix); result = 31 * result + Short.hashCode(lineNum); return result;`. Tôi giải thích từng lựa chọn. Dùng đúng ba trường mà `equals` so sánh — không thêm trường nào khác, vì đưa vào một trường không tham gia `equals` là tự phá điều khoản vừa nói; cũng không bớt trường nào để chạy nhanh hơn, vì hàm băm kém có thể dồn cả tập dữ liệu vào vài bucket. Dùng `Short.hashCode` vì trường là `short`, tránh boxing. Nhân 31 làm kết quả phụ thuộc thứ tự trường — không có phép nhân thì các hoán vị cho cùng hash; 31 là số nguyên tố lẻ, nếu chẵn thì tràn số làm mất thông tin như phép dịch bit. Tôi cũng nêu hai lựa chọn khác để cho thấy vì sao không chọn. `return 42` hợp lệ về mặt hợp đồng, nhưng dồn mọi object vào một bucket, bảng băm thoái hoá thành danh sách liên kết và thuật toán tuyến tính thành bậc hai. `Objects.hash(lineNum, prefix, areaCode)` viết một dòng, chất lượng tương đương, nhưng chậm hơn vì tạo mảng cho varargs và boxing từng `short` — tôi dùng nó khi hiệu năng không quan trọng, còn class này là key của map nên tôi viết tay. Cuối cùng, tôi không ghi vào Javadoc giá trị cụ thể mà `hashCode` trả về, để sau này còn đổi được hàm băm, và tôi viết unit test khẳng định hai instance bằng nhau có cùng hash — hoặc để AutoValue hay IDE sinh cả cặp `equals`/`hashCode`.",
    redFlags: [
      "Nói `get` trả `\"Jenny\"` vì `equals` đã đúng",
      "Đưa vào `hashCode` một trường không tham gia `equals`",
      "Bỏ bớt trường quan trọng khỏi `hashCode` cho nhanh",
      "Đặc tả chính xác giá trị `hashCode` trả về trong tài liệu để client dựa vào",
    ],
    probes: [
      "Class immutable và tính hash tốn kém thì có cache hash code được không, cần lưu ý gì?",
      "Vì sao hệ số là 31 mà không phải 2?",
      "Bạn kiểm chứng cặp `equals`/`hashCode` bằng test thế nào, hay có công cụ nào sinh sẵn?",
    ],
    refs: ["ej-03"],
  },
  {
    id: "ej-iq07",
    field: "effective-java",
    topic: "ej-object",
    level: 3,
    minutes: 10,
    question: "Đội cần biết tổng số lần phần tử được thêm vào một `Set` kể từ khi tạo — không phải kích thước hiện tại — để tinh chỉnh hiệu năng. Một đồng nghiệp đề xuất viết `InstrumentedHashSet extends HashSet`, override `add` và `addAll` để tăng bộ đếm. Bạn phản biện thế nào và đề xuất gì? Thêm một vế: nếu chính đội sở hữu một class cụ thể dùng chung và muốn cho các module khác kế thừa nó, bạn đặt ra những yêu cầu gì?",
    tradeoffs: [
      {
        option: "Kế thừa `HashSet`",
        when: "Ngắn gọn nhưng mong manh: `HashSet.addAll` bên trong gọi `add`, nên thêm ba phần tử qua `addAll` bị đếm thành sáu. Bỏ override `addAll` thì đúng — nhưng chỉ đúng chừng nào chi tiết self-use không tài liệu đó còn giữ nguyên; tự viết lại `addAll` thì tốn công, dễ lỗi. Superclass thêm method mới ở phiên bản sau cũng có thể làm vỡ subclass. Chỉ an toàn khi cả hai class cùng một package, cùng người kiểm soát.",
      },
      {
        option: "Wrapper class (composition + forwarding)",
        when: "`InstrumentedSet` kế thừa một `ForwardingSet` implement `Set` và chuyển tiếp mọi lời gọi tới một `Set` được bọc. Không phụ thuộc cài đặt bên trong, bọc được mọi cài đặt `Set` — `HashSet`, `TreeSet` — với mọi constructor, thậm chí bọc tạm một set đang dùng. Nhược điểm: không hợp với callback framework (vấn đề SELF), và phải viết forwarding class một lần cho mỗi interface. Phương án mặc định.",
      },
      {
        option: "Thiết kế class cho kế thừa",
        when: "Chỉ khi thật sự cần subclass: tài liệu hoá self-use của mọi method có thể override bằng `@implSpec`, cân nhắc hook `protected` như `removeRange`, constructor (và `clone`, `readObject`) không gọi method có thể override, và viết ít nhất ba subclass — một cái do người khác viết — trước khi phát hành. Đây là cam kết vĩnh viễn. Không làm được thì cấm kế thừa: `final`, hoặc constructor private kèm static factory.",
      },
    ],
    mustCover: [
      "Inheritance **vi phạm encapsulation**: subclass phụ thuộc vào chi tiết cài đặt của superclass",
      "Giải thích được kết quả sáu thay vì ba: `HashSet.addAll` gọi `add` đã bị override — self-use không được tài liệu hoá",
      "Bỏ override `addAll` hay tự viết lại nó đều mong manh; superclass thêm method mới ở phiên bản sau cũng có thể làm vỡ subclass",
      "Wrapper class implement `Set`, bọc được mọi cài đặt `Set`; nhược điểm chính là **vấn đề SELF** trong callback framework",
      "Kế thừa chỉ hợp lý khi có quan hệ **is-a** thật sự",
      "Class thiết kế cho kế thừa phải tài liệu hoá self-use bằng `@implSpec`, cân nhắc hook `protected`, và constructor không gọi method có thể override",
      "Kiểm nghiệm bằng cách **viết subclass** trước khi phát hành; không thiết kế cho kế thừa thì cấm bằng `final` hoặc constructor private kèm static factory",
    ],
    model: "Tôi phản biện bằng một phép thử cụ thể: tạo `InstrumentedHashSet`, gọi `addAll` với ba phần tử, rồi hỏi bộ đếm — nó trả sáu. Lý do là `HashSet.addAll` bên trong gọi `add` cho từng phần tử, mà `add` đã bị override để tăng bộ đếm, nên mỗi phần tử bị đếm hai lần. `HashSet` không tài liệu hoá chuyện self-use này, và nó có quyền không làm vậy. Đó là điều sách gọi là inheritance vi phạm encapsulation: subclass phụ thuộc vào chi tiết cài đặt của superclass. Hai cách vá đều không ổn. Bỏ override `addAll` thì cho kết quả đúng hôm nay, nhưng chỉ đúng chừng nào `HashSet` còn cài `addAll` bằng `add` — một chi tiết có thể đổi ở phiên bản sau. Tự viết lại `addAll` duyệt từng phần tử thì bớt phụ thuộc nhưng là cài lại method của superclass, tốn công và dễ lỗi. Và còn một rủi ro thứ ba không vá được: nếu phiên bản sau thêm một method mới có khả năng chèn phần tử, subclass sẽ không đếm được nó mà chẳng ai hay. Phương án tôi đề xuất là wrapper class. Viết một `ForwardingSet` implement `Set`, giữ một `Set` private và chuyển tiếp mọi method; rồi `InstrumentedSet` kế thừa `ForwardingSet` và chỉ override `add`, `addAll` để đếm. Lúc này `addAll` của set bên trong có gọi `add` của chính nó thì cũng không đi qua wrapper, nên không có đếm trùng. Thiết kế này còn mạnh hơn bản kế thừa: nó bọc được bất kỳ `Set` nào — `new InstrumentedSet<>(new TreeSet<>(cmp))` hay `new InstrumentedSet<>(new HashSet<>(capacity))` — không cần viết một constructor cho mỗi constructor của superclass, và có thể bọc tạm một set đang dùng. Lo về hiệu năng hay bộ nhớ của lớp chuyển tiếp thì trên thực tế không đáng kể. Nhược điểm thật mà tôi sẽ nói ra là vấn đề SELF: nếu đối tượng được bọc đăng ký chính nó vào một callback framework, callback sẽ gọi thẳng vào nó và bỏ qua wrapper. Còn câu hỏi nên kế thừa khi nào, tôi dùng phép thử is-a: mọi B có thật sự là một A không? Một bộ đếm lượt thêm không phải là một `HashSet` — nó là một `Set` có thêm chức năng. Vế thứ hai: nếu đội tôi sở hữu class và muốn cho kế thừa, tôi yêu cầu class được thiết kế cho việc đó. Mọi method public hay protected gọi method có thể override phải ghi rõ gọi cái nào, theo thứ tự nào, trong mục `@implSpec`. Cân nhắc đưa ra vài hook `protected` được chọn kỹ, như `removeRange` của `AbstractList`. Constructor tuyệt đối không gọi method có thể override, vì nó sẽ chạy trước khi constructor của subclass khởi tạo field — đến cả field `final` cũng bị thấy ở hai trạng thái. Và kiểm nghiệm bằng cách viết ba subclass, ít nhất một cái do người ngoài nhóm viết, trước khi phát hành, vì từ lúc phát hành đó là cam kết vĩnh viễn. Nếu đội không sẵn sàng trả cái giá ấy, tôi khai báo class `final`, hoặc để constructor private và cung cấp static factory.",
    redFlags: [
      "Vá `InstrumentedHashSet` bằng cách xoá override `addAll` rồi coi là xong",
      "Loại wrapper class vì lo lớp chuyển tiếp làm chậm đáng kể",
      "Cho rằng chỉ thêm method mới vào subclass mà không override là hoàn toàn an toàn",
      "Để class cụ thể dùng chung ở dạng public, không `final`, không tài liệu self-use",
    ],
    probes: [
      "Vì sao `Properties extends Hashtable` bị coi là sai lầm trong JDK?",
      "Constructor của superclass gọi một method bị subclass override thì field `final` của subclass trông thế nào lúc đó?",
      "Khi nào wrapper class không dùng được?",
    ],
    refs: ["ej-04"],
  },
  {
    id: "ej-iq08",
    field: "effective-java",
    topic: "ej-object",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `// Service A — đếm số mức giá riêng biệt
Set<BigDecimal> levelsA = new HashSet<>(prices);

// Service B — cùng dữ liệu, cần in theo thứ tự
Set<BigDecimal> levelsB = new TreeSet<>(prices);

// Mục "20 giao dịch lớn nhất" — amount tính bằng đồng, kiểu long
static final Comparator<Txn> BY_AMOUNT_DESC =
        (a, b) -> (int) (b.amount() - a.amount());`,
    },
    incident: {
      symptom: "Báo cáo đối soát cuối ngày của hệ thống thanh toán có hai con số không khớp: \"số mức giá riêng biệt\" ở service A ra 1.284, còn service B đọc cùng dữ liệu ra 1.197. Cùng tuần, mục \"20 giao dịch lớn nhất\" thỉnh thoảng xếp một giao dịch 3 tỷ đồng xuống dưới giao dịch vài trăm triệu, và một đêm job sắp xếp ném `IllegalArgumentException: Comparison method violates its general contract!`. Không ai sửa hai đoạn code này trong nhiều tháng. Thay đổi gần nhất: một đối tác mới gửi giá với số chữ số thập phân khác (`1.0`, `1.00`), và hạn mức giao dịch vừa được nâng lên.",
      scale: "Khoảng 2 triệu giao dịch mỗi ngày; giao dịch lớn nhất lên tới vài chục tỷ đồng. Báo cáo gửi kế toán và đối tác lúc 6 giờ sáng.",
      constraints: "Báo cáo của 5 ngày gần nhất đã gửi đi và phải xác định cái nào sai. Không được đổi định dạng dữ liệu đối tác gửi. Cần bản sửa trước lần chạy đêm nay.",
    },
    question: "Bạn được giao điều tra. Giải thích vì sao hai con số lệch nhau, vì sao thứ tự bị sai và job ném exception, bạn sửa thế nào, và xử lý các báo cáo đã gửi ra sao.",
    mustCover: [
      "`BigDecimal` có `compareTo` **không nhất quán với `equals`**: `1.0` và `1.00` khác nhau theo `equals` nhưng bằng nhau theo `compareTo`",
      "`HashSet` dùng `equals`/`hashCode`, còn `TreeSet` dùng `compareTo` — cùng dữ liệu cho kích thước khác nhau; sorted collection khi đó không còn tuân thủ hợp đồng `Set` vốn định nghĩa theo `equals`",
      "Phải chốt **một định nghĩa bằng nhau theo nghiệp vụ** rồi áp dụng nhất quán ở cả hai nơi, ví dụ chuẩn hoá giá về một dạng chuẩn trước khi đưa vào set",
      "Comparator dựa trên **phép trừ** bị tràn số: hiệu hai `long` ép về `int` đổi dấu khi chênh lệch vượt khoảng 2,1 tỷ",
      "Tràn số phá **tính đối xứng và bắc cầu** của hợp đồng so sánh — thứ tự sai, và thuật toán sắp xếp có thể phát hiện vi phạm rồi ném exception",
      "Sửa bằng `Long.compare` hoặc `Comparator.comparingLong(Txn::amount).reversed()` — không bao giờ dùng phép trừ",
      "Giải thích vì sao lộ ra bây giờ: dữ liệu mới (thêm chữ số thập phân, hạn mức lớn hơn) chạm vào bug đã nằm sẵn",
      "Xử lý báo cáo đã gửi: chạy lại 5 ngày bằng code đã sửa, so sánh, thông báo phần sai cho kế toán và đối tác",
      "Ngăn tái diễn: test với giá trị biên (chênh lệch vượt phạm vi `int`, cùng giá trị khác số chữ số thập phân)",
    ],
    model: "Đây là hai lỗi khác nhau lộ ra cùng tuần, và cả hai cùng một họ: một thứ phụ thuộc vào so sánh đang dùng một phép so sánh không đúng như người viết nghĩ. Tôi tách ra từng cái. Con số lệch trước. Service A dùng `HashSet`, service B dùng `TreeSet`, trên cùng một danh sách giá. `HashSet` quyết định hai phần tử có trùng không bằng `equals` và `hashCode`; `TreeSet` quyết định bằng `compareTo`. Với hầu hết kiểu thì hai cách cho cùng câu trả lời, nhưng `BigDecimal` là ngoại lệ sách nêu đích danh: `compareTo` của nó không nhất quán với `equals`. `new BigDecimal(\"1.0\")` và `new BigDecimal(\"1.00\")` khác nhau theo `equals` vì khác scale, nhưng bằng nhau theo `compareTo`. Nên `HashSet` giữ cả hai còn `TreeSet` chỉ giữ một. Trước khi có đối tác mới, mọi giá đều cùng số chữ số thập phân nên chuyện này vô hình; đối tác gửi `1.0` bên cạnh `1.00` là nó lộ ra. Để kiểm chứng, tôi đếm các cặp giá bằng nhau theo `compareTo` nhưng khác theo `equals` trong dữ liệu một ngày — nếu con số đó đúng bằng 1.284 trừ 1.197 thì xong. Sửa ở đây không phải là đổi B sang `HashSet` cho khớp A. Câu hỏi đúng là nghiệp vụ muốn \"mức giá riêng biệt\" nghĩa là gì. Với đối soát thì gần như chắc là bằng nhau về giá trị, nên tôi chuẩn hoá mỗi giá về một dạng chuẩn — ví dụ `stripTrailingZeros()` — ngay khi đọc dữ liệu vào, rồi cả hai service mới đưa vào set. Sách gọi đây là lưu trữ dạng chuẩn để so sánh chính xác và rẻ. Nếu có nơi thực sự cần phân biệt scale thì nơi đó phải nói rõ, và không được dùng sorted collection cho nó. Lỗi thứ hai nằm ở comparator `(int) (b.amount() - a.amount())`. Kỹ thuật so sánh bằng phép trừ là thứ sách cấm thẳng vì tràn số. Ở đây còn tệ hơn: hiệu hai `long` bị ép về `int`, nên hễ hai giao dịch chênh nhau quá khoảng 2,1 tỷ đồng là giá trị bị cắt và có thể đổi dấu. Đó là lý do một giao dịch 3 tỷ bị xếp dưới giao dịch vài trăm triệu. Nâng hạn mức giao dịch là thứ làm những chênh lệch như vậy xuất hiện thường xuyên. Và một comparator như thế không còn đối xứng hay bắc cầu, nên thuật toán sắp xếp của JDK có lúc phát hiện được mâu thuẫn và ném `IllegalArgumentException: Comparison method violates its general contract!` — exception đêm đó chính là hệ quả của cùng lỗi, không phải lỗi thứ ba. Sửa thành `Comparator.comparingLong(Txn::amount).reversed()`, hoặc `(a, b) -> Long.compare(b.amount(), a.amount())`. Tôi không chấp nhận các bản vá kiểu bỏ phép ép `int` rồi vẫn trừ, vì vẫn là phép trừ. Về các báo cáo đã gửi: tôi chạy lại đối soát 5 ngày bằng code đã sửa, so từng mục với bản đã gửi, và gửi kế toán cùng đối tác danh sách chính xác những con số và thứ hạng đã sai — không phải một thông báo chung chung. Để ngăn tái diễn, tôi thêm test với dữ liệu biên: hai giá cùng giá trị khác scale phải cho cùng kết quả ở cả hai service, và hai giao dịch chênh nhau vượt phạm vi `int` phải sắp đúng thứ tự. Tôi cũng rà code tìm các comparator còn dùng phép trừ.",
    redFlags: [
      "Cho rằng `TreeSet` làm mất dữ liệu do bug JDK",
      "Đổi service B sang `HashSet` cho khớp A mà không chốt định nghĩa bằng nhau theo nghiệp vụ",
      "Sửa comparator bằng cách bỏ phép ép `int` nhưng vẫn giữ phép trừ",
      "Coi exception của job sắp xếp là lỗi riêng, không liên hệ với comparator",
      "Không có kế hoạch cho 5 báo cáo đã gửi",
    ],
    probes: [
      "Nếu nghiệp vụ muốn coi `1.0` và `1.00` là hai giá khác nhau, bạn chọn collection nào và vì sao không được dùng `TreeSet`?",
      "`Comparator.comparingLong` chậm hơn viết tay một chút — vì sao vẫn nên dùng?",
      "Nếu chính class của bạn có `compareTo` không nhất quán với `equals`, bạn phải ghi chú gì trong tài liệu?",
    ],
    refs: ["ej-03"],
  },

  // ===== ej-types (ej-iq09–ej-iq12) =====
  {
    id: "ej-iq09",
    field: "effective-java",
    topic: "ej-types",
    level: 1,
    minutes: 5,
    question: "Một method có tham số `List<Object>` lại không nhận khi truyền vào `List<String>`, trong khi tham số `Object[]` nhận `String[]` thoải mái. Giải thích vì sao, rồi so sánh ba cách khai báo tham số: raw `List`, `List<Object>` và `List<?>`.",
    mustCover: [
      "Generics là **invariant**: `List<String>` không phải kiểu con của `List<Object>`, vì `List<Object>` nhận được mọi object còn `List<String>` thì không (nguyên lý Liskov)",
      "Mảng là **covariant** và reified — bỏ sai kiểu vào mảng chỉ lộ ra lúc runtime bằng `ArrayStoreException`, còn generics chặn từ lúc biên dịch",
      "Raw type đứng **ngoài hệ thống kiểu generic**: nhận `List<String>` nhưng cho chèn bất cứ thứ gì, lỗi thành `ClassCastException` ở chỗ xa nơi gây ra",
      "`List<Object>` an toàn: nói rõ với compiler là chứa được object thuộc bất kỳ kiểu nào",
      "`List<?>` an toàn: list của một kiểu chưa biết — nhận mọi list nhưng **không thêm được gì ngoài `null`**",
      "Raw type chỉ còn vì migration compatibility; ngoại lệ hợp lệ là class literal (`List.class`) và toán tử `instanceof`",
    ],
    model: "Lý do nằm ở chỗ generics là invariant còn mảng là covariant. `String[]` là kiểu con của `Object[]`, nên truyền được — nhưng cái giá là tôi có thể nhét một `Long` vào mảng đó qua tham chiếu `Object[]`, và lỗi chỉ lộ ra lúc runtime bằng `ArrayStoreException`, vì mảng reified, biết kiểu phần tử của nó lúc chạy. Generics thì cố ý không cho `List<String>` là kiểu con của `List<Object>`. Nghe phản trực giác, nhưng đúng theo Liskov: `List<Object>` nhận được mọi object, `List<String>` thì không, nên cái sau không làm được mọi việc cái trước làm. Và vì thông tin kiểu generic bị xoá lúc runtime, compiler phải chặn từ lúc biên dịch — đó là thứ tôi muốn. Giờ ba cách khai báo. Raw `List` là đứng ngoài hệ thống kiểu generic. Nó nhận `List<String>`, nhưng bên trong method tôi thêm được bất cứ thứ gì — ví dụ kinh điển `unsafeAdd(List list, Object o)` nhét một `Integer` vào list chuỗi, compiler chỉ cảnh báo, rồi `ClassCastException` nổ ra ở chỗ đọc phần tử, từ một phép ép kiểu vô hình do compiler sinh, cách xa chỗ gây ra. `List<Object>` thì an toàn: nó nói rõ \"list này chứa object thuộc bất kỳ kiểu nào\", nên nó từ chối `List<String>` ngay khi biên dịch. `List<?>` là list của một kiểu nào đó mà tôi không biết. Nó nhận mọi list, và nó an toàn vì tôi không thêm được gì vào nó ngoài `null`, cũng không giả định được gì về kiểu của phần tử lấy ra. Cho method chỉ đọc mà không quan tâm kiểu phần tử — như đếm phần tử chung của hai set — tôi dùng `Set<?>` chứ không bao giờ dùng raw `Set`. Nếu hạn chế đó chặt quá thì chuyển sang generic method hay bounded wildcard. Raw type tồn tại chỉ vì migration compatibility — để code viết trước khi có generics vẫn chạy. Hai chỗ tôi vẫn viết nó là class literal, vì `List<String>.class` không hợp lệ, và `instanceof`, vì kiểu generic đã bị xoá: `if (o instanceof Set)` rồi ép sang `Set<?>`.",
    redFlags: [
      "Nói `List<?>` và raw `List` là như nhau",
      "Dùng raw type cho tiện khi không quan tâm kiểu phần tử",
      "Cho rằng generics cũng covariant như mảng",
      "Không biết thông tin kiểu generic bị xoá lúc runtime",
    ],
    probes: [
      "Viết `o instanceof List<String>` được không? Nếu không thì viết thế nào?",
      "Trong ví dụ `unsafeAdd`, exception nổ ra ở dòng nào, và vì sao dòng đó không có phép ép kiểu nhìn thấy được?",
      "Muốn method nhận cả `List<Integer>` lẫn `List<Double>` và đọc ra `Number` thì khai báo tham số thế nào?",
    ],
    refs: ["ej-05"],
  },
  {
    id: "ej-iq10",
    field: "effective-java",
    topic: "ej-types",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class Stack<E> {
    public Stack() { ... }
    public void push(E e) { ... }
    public E pop() { ... }
    public boolean isEmpty() { ... }

    public void pushAll(Iterable<E> src) {
        for (E e : src)
            push(e);
    }

    public void popAll(Collection<E> dst) {
        while (!isEmpty())
            dst.add(pop());
    }
}

public static <T extends Comparable<T>> T max(List<T> list) { ... }

// Client
Stack<Number> numberStack = new Stack<>();
Iterable<Integer> integers = List.of(1, 2, 3);
numberStack.pushAll(integers);                    // (1)

Collection<Object> objects = new ArrayList<>();
numberStack.popAll(objects);                      // (2)

List<ScheduledFuture<?>> futures = ... ;
ScheduledFuture<?> next = max(futures);           // (3)`,
    },
    question: "Ba lời gọi đánh số đều hợp lý về mặt logic nhưng không biên dịch được. Giải thích từng lỗi và sửa khai báo phía API — không được sửa client.",
    mustCover: [
      "Nguyên nhân chung: parameterized type là **invariant** — `Iterable<Integer>` không phải `Iterable<Number>`, `Collection<Object>` không phải `Collection<Number>`",
      "(1) `src` **sản xuất** `E` cho stack → đổi thành `Iterable<? extends E>`",
      "(2) `dst` **tiêu thụ** `E` từ stack → đổi thành `Collection<? super E>`",
      "Quy tắc **PECS**: producer-`extends`, consumer-`super`; tham số vừa sản xuất vừa tiêu thụ thì giữ kiểu chính xác",
      "(3) `ScheduledFuture` không implement `Comparable<ScheduledFuture>` mà kế thừa `Comparable<Delayed>` qua `Delayed` → sửa thành `<T extends Comparable<? super T>> T max(List<? extends T> list)`",
      "Comparable và Comparator luôn là **consumer**, nên dùng `Comparable<? super T>` và `Comparator<? super T>`",
      "Không dùng bounded wildcard làm **kiểu trả về** — `max` vẫn trả `T`",
    ],
    model: "Cả ba lỗi có chung một gốc: parameterized type là invariant. `Stack<Number>` có `pushAll(Iterable<Number>)`, và `Iterable<Integer>` không phải kiểu con của `Iterable<Number>` dù `Integer` là kiểu con của `Number`. Sửa bằng bounded wildcard, và tôi chọn chiều theo PECS — producer-`extends`, consumer-`super`. Lời gọi (1): `src` sản xuất phần tử cho stack dùng, nên nó là producer, khai báo `Iterable<? extends E>` — \"iterable của một kiểu con nào đó của E\". Lời gọi (2): `dst` nhận phần tử từ stack, là consumer, nên khai báo `Collection<? super E>` — \"collection của một kiểu cha nào đó của E\"; một `Collection<Object>` nhận `Number` thoải mái. Nếu một tham số vừa sản xuất vừa tiêu thụ thì wildcard không giúp gì, tôi giữ kiểu chính xác. Lời gọi (3) khó hơn, và tôi áp PECS hai lần. Lần dễ là `list`: nó sản xuất `T`, nên thành `List<? extends T>`. Lần khó là chính bound của `T`. `ScheduledFuture` không implement `Comparable<ScheduledFuture>`; nó là subinterface của `Delayed`, còn `Delayed` extends `Comparable<Delayed>`. Tức là một `ScheduledFuture` so sánh được với mọi `Delayed`, và bound `T extends Comparable<T>` đòi quá khắt khe nên từ chối nó. Một comparable của `T` thì tiêu thụ `T`, nên nó là consumer: `Comparable<T>` thành `Comparable<? super T>`. Khai báo cuối là `public static <T extends Comparable<? super T>> T max(List<? extends T> list)`. Quy tắc tôi rút ra: comparable và comparator luôn là consumer, nên mặc định viết `Comparable<? super T>` và `Comparator<? super T>`. Một điều tôi cố ý không làm là đổi kiểu trả về thành wildcard — `max` vẫn trả `T`. Wildcard ở kiểu trả về chỉ đẩy wildcard sang code client. Sau khi sửa, cả ba lời gọi biên dịch sạch mà client không đổi một ký tự nào; sách nói dùng đúng thì wildcard gần như vô hình với người dùng, và nếu client phải nghĩ về wildcard thì có lẽ API có vấn đề.",
    redFlags: [
      "Đảo chiều: dùng `super` cho `src` và `extends` cho `dst`",
      "Sửa bằng raw type hoặc ép kiểu phía client",
      "Đổi kiểu trả về của `max` thành `? extends T`",
      "Cho rằng lỗi do thiếu `@SuppressWarnings`",
    ],
    probes: [
      "Giữa `<E> void swap(List<E> list, int i, int j)` và `void swap(List<?> list, int i, int j)`, bạn chọn cái nào cho API public, và cài đặt bản wildcard thế nào?",
      "Vì sao comparable luôn là consumer?",
      "`union(Set<? extends E> s1, Set<? extends E> s2)` được gọi với `Set<Integer>` và `Set<Double>`, gán vào `Set<Number>` — compiler suy ra `E` từ đâu?",
    ],
    refs: ["ej-05"],
  },
  {
    id: "ej-iq11",
    field: "effective-java",
    topic: "ej-types",
    level: 3,
    minutes: 10,
    question: "Bạn thiết kế một thư viện rule engine nội bộ có bộ phép toán (opcode) như cộng, trừ, nhân, chia. Các đội dùng thư viện cần tự bổ sung phép toán riêng mà không phải sửa thư viện. Bạn biểu diễn bộ opcode thế nào? So sánh các phương án và chốt một.",
    tradeoffs: [
      {
        option: "Hằng số `int` (int enum pattern)",
        when: "Client \"mở rộng\" bằng cách tự chọn số mới — nhưng không có an toàn kiểu (truyền nhầm hằng của nhóm khác vẫn biên dịch), không có namespace nên phải gắn tiền tố, giá trị bị biên dịch thẳng vào client nên đổi giá trị là phải biên dịch lại, in ra chỉ thấy số, không duyệt được tập hằng. Biến thể hằng `String` còn tệ hơn: lỗi đánh máy thoát khỏi compiler và so sánh chuỗi tốn kém. Không chọn.",
      },
      {
        option: "Enum thường",
        when: "An toàn kiểu, namespace riêng, `toString` đọc được, thêm field, method và constant-specific method; thêm hay sắp lại hằng không cần biên dịch lại client. Nhưng enum không kế thừa được — muốn thêm phép toán thì phải sửa thư viện. Đúng khi tập opcode do chính thư viện quyết định.",
      },
      {
        option: "Interface + enum cơ sở implement nó (mô phỏng enum mở rộng)",
        when: "Interface `Operation` có `apply`; thư viện cung cấp `enum BasicOperation implements Operation`; client viết `enum ExtendedOperation implements Operation` của riêng họ. Mọi API của thư viện nhận `Operation`, không nhận `BasicOperation`. Cái giá: cài đặt không kế thừa được giữa các enum (dùng default method hoặc helper), không liệt kê được mọi phép toán của cơ sở lẫn phần mở rộng, `EnumSet`/`EnumMap` chỉ dùng được trong từng enum. Phù hợp đề bài.",
      },
    ],
    mustCover: [
      "Mẫu hằng `int` không có **an toàn kiểu**, không có namespace, giá trị bị **biên dịch thẳng vào client**, in ra chỉ thấy số",
      "Hằng `String` còn tệ hơn: lỗi đánh máy thoát khỏi compiler và phải so sánh chuỗi",
      "Enum thường: an toàn kiểu, namespace riêng, `toString`, thêm field/method và constant-specific method; thêm hằng không cần biên dịch lại client",
      "Enum **không kế thừa được** — client không thể tự thêm hằng nếu không sửa thư viện",
      "Mô phỏng enum mở rộng: interface `Operation` + enum cơ sở implement nó; client viết enum riêng implement cùng interface",
      "API phải nhận **kiểu interface**, không nhận enum cài đặt; muốn nhận cả một tập phép toán thì dùng `Class<T>` với `<T extends Enum<T> & Operation>` hoặc `Collection<? extends Operation>`",
      "Cái giá: không kế thừa cài đặt giữa các enum, không liệt kê chung được mọi phép toán, `EnumSet`/`EnumMap` chỉ trong từng enum",
    ],
    model: "Tôi chọn interface cộng enum cơ sở — phương án sách gọi là mô phỏng enum có thể mở rộng — và tôi đi qua hai phương án kia trước. Hằng `int` là lựa chọn mà ai đó sẽ bênh vì \"mở rộng dễ, client chỉ việc chọn số mới\". Nhưng đổi lại là mất gần như mọi thứ: không có an toàn kiểu, truyền một hằng của nhóm khác vào vẫn biên dịch; không có namespace nên phải gắn tiền tố cho khỏi đụng tên; giá trị là constant variable nên bị biên dịch thẳng vào client, đổi giá trị mà client không biên dịch lại thì nó vẫn chạy, chỉ là chạy sai; in ra hay xem trong debugger chỉ thấy một con số; và không có cách đáng tin nào để duyệt hết các hằng. Còn hai đội chọn trùng một số thì không ai phát hiện. Biến thể hằng `String` còn tệ hơn, vì người dùng sẽ hard-code chuỗi, lỗi đánh máy thoát khỏi compiler, và so sánh chuỗi tốn kém. Enum thường giải quyết hết những thứ đó: an toàn kiểu lúc biên dịch, namespace riêng, `toString` đọc được, gắn được ký hiệu, gắn được hành vi riêng cho từng hằng qua constant-specific method, và thêm hay sắp lại hằng không bắt client biên dịch lại. Nếu tập phép toán do thư viện toàn quyền quyết định thì tôi dừng ở đây. Nhưng đề bài có một yêu cầu mà enum không đáp ứng: enum không kế thừa được, nên đội nào muốn thêm phép toán lũy thừa thì phải sửa thư viện. Lối ra là tận dụng việc enum implement được interface. Tôi định nghĩa `interface Operation { double apply(double x, double y); }`, thư viện cung cấp `enum BasicOperation implements Operation` với cộng, trừ, nhân, chia, và một đội khác viết `enum ExtendedOperation implements Operation` với lũy thừa và chia lấy dư. Điều kiện để mô hình này chạy là mọi API của thư viện phải nhận kiểu interface `Operation`, không nhận `BasicOperation`; tôi sẽ đưa quy tắc đó vào review. Khi thư viện cần nhận nguyên một tập phép toán — chẳng hạn để đăng ký cả enum của một đội — có hai cách: nhận `Class<T>` với bound `<T extends Enum<T> & Operation>` rồi duyệt `getEnumConstants()`, hoặc nhận `Collection<? extends Operation>`, đơn giản hơn và cho phép trộn phép toán từ nhiều enum, nhưng mất khả năng dùng `EnumSet`, `EnumMap`. Cái giá tôi nói trước với các đội: cài đặt không kế thừa được từ enum này sang enum khác, nên phần dùng chung như lưu ký hiệu sẽ lặp lại — ít thì chấp nhận, nhiều thì đưa vào default method của interface hoặc một helper; và không có cách tự nhiên để liệt kê mọi phép toán của cơ sở lẫn mọi phần mở rộng. JDK dùng đúng mẫu này: `LinkOption` là enum implement `CopyOption` và `OpenOption`.",
    redFlags: [
      "Chọn hằng `int` vì \"dễ mở rộng\" mà bỏ qua mất an toàn kiểu",
      "Cho rằng enum không thêm hằng được mà vẫn giữ tương thích với client đã biên dịch",
      "Viết API nhận `BasicOperation` thay vì `Operation`",
      "Liệt kê phương án rồi không chốt",
    ],
    probes: [
      "Logic lưu ký hiệu `symbol` bị lặp giữa hai enum — bạn xử lý thế nào?",
      "Một method cần chạy thử mọi phép toán trong enum mở rộng của client — bạn khai báo tham số ra sao, và mỗi cách mất gì?",
      "Khi nào `switch` trên một enum là hợp lý thay vì constant-specific method?",
    ],
    refs: ["ej-06"],
  },
  {
    id: "ej-iq12",
    field: "effective-java",
    topic: "ej-types",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `// Module common — đã dùng hơn một năm, 14 service phụ thuộc
public final class Variants {

    @SuppressWarnings("unchecked")          // thêm năm ngoái "cho build sạch cảnh báo"
    public static <T> T[] merge(T... parts) {
        int n = 0;
        for (T p : parts)
            if (p != null && !containsBefore(parts, n, p))
                parts[n++] = p;             // dồn phần tử ngay trong mảng varargs
        return Arrays.copyOf(parts, n);     // trả bản sao của mảng varargs ra ngoài
    }

    @SuppressWarnings("unchecked")
    public static <T> T[] chooseTwo(T primary, T fallback, T legacy) {
        return merge(primary, fallback != null ? fallback : legacy);
    }
    // ...
}

// LabelService.java — tính năng mới, phát hành hôm qua
String[] labels = Variants.chooseTwo(primary, fallback, legacy);   // dòng 42`,
    },
    incident: {
      symptom: "Sau khi phát hành tính năng gợi ý nhãn sản phẩm, endpoint mới trả 500 cho mọi request được bật tính năng. Stack trace: `java.lang.ClassCastException: class [Ljava.lang.Object; cannot be cast to class [Ljava.lang.String;` tại `LabelService.suggest(LabelService.java:42)` — nhưng dòng 42 không có phép ép kiểu nào, chỉ là một lời gọi tới tiện ích `Variants.chooseTwo` trong module dùng chung. Tiện ích này đã được hơn chục chỗ khác dùng suốt một năm không lỗi, và build của module dùng chung sạch cảnh báo.",
      scale: "Endpoint phục vụ trang chi tiết sản phẩm, khoảng 1.500 request/giây lúc cao điểm; tính năng đang bật cho 10% người dùng qua feature flag. Module `common` có 14 service khác phụ thuộc.",
      constraints: "Tắt feature flag được ngay, nhưng đội sản phẩm muốn bật lại trong 24 giờ. Mọi thay đổi chữ ký public của `common` buộc các service phụ thuộc biên dịch lại, nên phải đánh giá tác động. Không được \"sửa\" bằng cách bắt exception ở dòng 42.",
    },
    question: "Bạn là người được gọi vào. Giải thích vì sao có `ClassCastException` ở một dòng không có cast, truy tới nguyên nhân gốc, nêu cách sửa ngắn hạn và dài hạn, và cách ngăn loại lỗi này quay lại.",
    mustCover: [
      "Compiler **chèn một phép ép kiểu vô hình** khi gán kết quả của method generic vào kiểu cụ thể — phép ép sang `String[]` ở dòng 42 là thứ thất bại",
      "Mảng varargs cho `merge` được tạo bên trong `chooseTwo` (một method generic) nên có kiểu runtime là `Object[]`; `T[]` trả về thực chất là `Object[]` — đó là **heap pollution**",
      "Generic varargs chỉ an toàn khi **không lưu gì vào mảng varargs** và **không để lộ mảng (hay bản sao) ra ngoài** — `merge` vi phạm cả hai",
      "`@SuppressWarnings(\"unchecked\")` trên cả method đã nuốt cảnh báo possible heap pollution — chặn cảnh báo mà không chứng minh an toàn chỉ tạo cảm giác an toàn giả",
      "Lỗi nổ **cách nơi gây ra hai cấp**; các chỗ gọi cũ không lỗi vì dùng kết quả trong ngữ cảnh generic hoặc như `Object[]`, nơi không có phép ép sang kiểu cụ thể",
      "Ngắn hạn: tắt feature flag; để bật lại, `LabelService` không nhận `String[]` từ tiện ích mà dùng một API trả `List`",
      "Dài hạn: thêm API trả `List<T>` (dựa trên `List.of`) thay cho mảng, deprecate bản trả mảng; chỉ đánh `@SafeVarargs` khi method đã thật sự an toàn",
      "`@SuppressWarnings` phải ở **phạm vi hẹp nhất** (thường là một khai báo biến) và kèm comment giải thích vì sao an toàn; rà lại mọi chỗ chặn cảnh báo trong `common`",
      "Ngăn tái diễn: build coi cảnh báo unchecked là lỗi và có test gọi tiện ích với kiểu cụ thể như `String`",
    ],
    model: "Câu \"không có cast ở dòng 42\" chỉ đúng với mã nguồn. Khi tôi gọi một method generic trả `T[]` và gán vào `String[]`, compiler chèn một phép ép kiểu vô hình sang `String[]` — phép ép mà hệ thống kiểu generic hứa là không bao giờ thất bại, với điều kiện không ai chặn cảnh báo sai chỗ. Nó thất bại nghĩa là lời hứa đã bị phá ở đâu đó, và thông báo lỗi nói luôn ở đâu: đối tượng thật là một `Object[]`. Truy ngược: `chooseTwo` là method generic, nó gọi `merge(primary, x)`. Để gọi một method varargs, compiler tạo mảng tham số ngay tại `chooseTwo`, mà tại đó `T` chưa biết là gì, nên mảng được tạo là `Object[]` — kiểu cụ thể nhất chứa được mọi `T`. `merge` trả `Arrays.copyOf(parts, n)`, bản sao giữ nguyên kiểu runtime `Object[]`, đi ngược lên `chooseTwo`, rồi lên dòng 42 dưới danh nghĩa `String[]`. Một biến kiểu parameterized trỏ vào object không thuộc kiểu đó — sách gọi là heap pollution. Và lỗi nổ cách nơi gây ra hai cấp, đúng như ví dụ `toArray`/`pickTwo` trong sách. Sách nêu hai điều kiện để một method generic varargs an toàn: không lưu gì vào mảng varargs, và không để lộ mảng — hay một bản sao của nó — ra ngoài. `merge` vi phạm cả hai: dồn phần tử ngay trong mảng, và trả bản sao ra. Vì sao một năm không ai thấy? Vì các chỗ gọi cũ dùng kết quả trong ngữ cảnh generic hoặc như `Object[]`, nơi compiler không chèn phép ép sang một kiểu mảng cụ thể. `LabelService` là chỗ đầu tiên gán vào `String[]`. Còn \"build sạch cảnh báo\" chính là cái bẫy: compiler có cảnh báo possible heap pollution ở khai báo `merge` và cảnh báo tạo mảng generic ở `chooseTwo`, nhưng cả hai bị `@SuppressWarnings(\"unchecked\")` đặt trên cả method nuốt mất, không kèm một dòng giải thích vì sao an toàn — vì nó không an toàn. Sách nói chặn cảnh báo mà không chứng minh trước chỉ tạo cảm giác an toàn giả. Ngắn hạn: tắt feature flag ngay. Để bật lại trong 24 giờ, tôi thêm vào `common` một API trả `List<T>` — thân của nó chỉ là `List.of` trên các phần tử đã lọc — và cho `LabelService` dùng API đó; không bắt exception ở dòng 42, cũng không đổi dòng 42 sang `Object[]` rồi ép từng phần tử, vì làm vậy để nguyên cái bẫy cho 14 service kia. Dài hạn: bản trả `List<T>` là hướng sách khuyên — thay mảng varargs bằng `List`, compiler chứng minh được an toàn mà không cần ai hứa. Thêm method mới không phá chữ ký cũ, nên 14 service không phải biên dịch lại ngay; tôi deprecate bản trả mảng và lên lịch chuyển dần. Nếu vẫn muốn giữ một method varargs, tôi viết lại để nó không ghi vào mảng và không trả mảng ra, rồi mới đánh `@SafeVarargs` — annotation đó là lời hứa của tác giả, chỉ hợp lệ trên method không override được, và đánh nó lên `merge` hiện tại là nói dối compiler. Để ngăn tái diễn: bỏ mọi `@SuppressWarnings` rộng trong `common`, chỗ nào thật sự cần thì đặt trên một khai báo biến cục bộ kèm comment vì sao an toàn; build của `common` coi cảnh báo unchecked là lỗi; và mỗi tiện ích generic có test gọi nó với một kiểu cụ thể như `String`, vì chỉ lời gọi như thế mới làm phép ép vô hình lộ ra.",
    redFlags: [
      "Kết luận là bug JVM hoặc classloader vì dòng lỗi không có cast",
      "Chỉ vá dòng 42 (đổi sang `Object[]` hoặc bắt exception) và để nguyên cái bẫy cho các service khác",
      "Đánh `@SafeVarargs` lên `merge` hiện tại để tắt cảnh báo",
      "Nới `@SuppressWarnings` lên cả class cho build sạch",
    ],
    probes: [
      "Vì sao viết `new List<String>[1]` là lỗi biên dịch, còn khai báo tham số `List<String>...` chỉ bị cảnh báo?",
      "`@SafeVarargs` hợp lệ trên những loại method nào, và vì sao lại giới hạn như vậy?",
      "Nếu `merge` chỉ đọc mảng và truyền nó cho một method không phải varargs để tính toán, nó có an toàn không?",
    ],
    refs: ["ej-05"],
  },
];
