// Ngân hàng câu hỏi phỏng vấn Effective Java — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
//
// Nguồn: bản dịch tiếng Việt Effective Java, ấn bản 3 (Joshua Bloch, Addison-Wesley 2018)
// — 11 chương (2–12) trong sources/effective-java/.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (ej-iq01–ej-iq24) — tiến độ localStorage lưu theo id này.

export const effectiveJavaInterview = [
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

// Ở một chỗ khác — job tổng kết, chạy mỗi giờ một lần
new ReportWriter(summaryPath).writeRow(total);   // "đã có finalize lo"`,
    },
    incident: {
      symptom: "Service xuất báo cáo CSV chạy ổn vài giờ sau mỗi lần deploy, rồi bắt đầu ném `IOException: Too many open files` ở mọi thao tác mở file, và cả khi nhận kết nối HTTP mới. Restart thì hết, vài giờ sau lại bị. Log của những lượt xuất báo cáo lỗi trước đó chỉ thấy exception ném ra từ `close()`, không thấy lỗi nào khác. Ở staging, test tải chạy cả ngày không tái hiện được.",
      scale: "3 instance, mỗi instance xử lý khoảng 5.000 lượt xuất mỗi giờ, `ulimit -n` là 1024. Khoảng 3% lượt gặp lỗi I/O (ổ mạng chập chờn, file nguồn bị xoá giữa chừng, dòng dữ liệu hỏng làm `transform` ném exception). Heap 8 GB, GC chạy thưa.",
      constraints: "Đội hạ tầng chỉ đồng ý tăng `ulimit` tạm thời, không coi là giải pháp. Định dạng file đầu ra phải giữ nguyên. Bản sửa phải lên trong cửa sổ phát hành tuần này và phải có số liệu chứng minh rò rỉ đã hết.",
    },
    question: "Bạn trực on-call tuần này. Trình bày cách bạn xác nhận nguyên nhân, cách sửa code, vai trò của `finalize()` trong chuyện này, và cách chứng minh là đã hết.",
    mustCover: [
      "Xác nhận bằng số liệu: theo dõi số file descriptor đang mở của process theo thời gian và thấy nó tăng theo số lượt lỗi I/O — cộng thêm một descriptor mỗi lần job tổng kết chạy, nằm chờ finalizer — chứ không theo số lượt xuất",
      "`try`-`finally` viết sai: `ReportWriter` được mở trước `try` nên nếu constructor ném thì `in` bị bỏ mở; `out.close()` ném thì `in.close()` không bao giờ chạy — rò descriptor đúng trên đường lỗi",
      "Finalizer **không đảm bảo chạy kịp thời, thậm chí không đảm bảo chạy**; file descriptor là tài nguyên có hạn nên không bao giờ được dựa vào finalizer để đóng file",
      "Heap lớn, GC thưa nên object chờ finalize nằm rất lâu; hành vi phụ thuộc thuật toán GC và cấu hình JVM — lý do staging không tái hiện",
      "Exception từ `close()` trong `finally` **xoá mất exception gốc** — lý do log chỉ thấy lỗi ở `close()`",
      "Sửa: `ReportWriter` implement `AutoCloseable`, mọi chỗ dùng chuyển sang `try`-with-resources khai báo cả hai tài nguyên",
      "`try`-with-resources giữ exception gốc; exception từ `close` bị **suppressed** và vẫn xem được qua `getSuppressed`",
      "Bỏ `finalize()`; nếu muốn lưới an toàn thì dùng `Cleaner` và chỉ coi là lưới an toàn; `close()` ghi nhận trạng thái đã đóng để các method khác ném `IllegalStateException`",
      "Chứng minh: số descriptor sau deploy đi ngang trong nhiều giờ, cộng test ép lỗi I/O giữa chừng và khẳng định mọi tài nguyên đã đóng",
    ],
    model: "Trước khi đọc code, tôi muốn con số. Tôi đếm số file descriptor đang mở của process mỗi vài phút trên một instance và đặt cạnh hai đường: số lượt xuất và số lượt lỗi. Nếu descriptor tăng theo số lượt xuất thì đó là cấu hình pool; còn nếu nó tăng theo số lượt lỗi — cộng thêm một bậc nhỏ mỗi giờ khi job tổng kết chạy — và không bao giờ giảm thì đó là rò rỉ trên đường lỗi, cộng với những writer đang chờ finalizer. Với dữ liệu đề bài, 3% của 5.000 lượt mỗi giờ là khoảng 150 lượt lỗi, còn job tổng kết chỉ góp một descriptor mỗi giờ; với giới hạn 1024 thì vài giờ là cạn — khớp đúng triệu chứng, và cho thấy nguồn chính là đường lỗi. Đọc `export` thì thấy hai lỗ. Một: `ReportWriter` được mở trước khi vào `try`, nên nếu constructor của nó ném — ví dụ thư mục đích trên ổ mạng tạm mất — thì `in` đã mở mà không bao giờ được đóng. Hai: trong `finally`, nếu `out.close()` ném — mà flush lên ổ mạng chập chờn thì rất dễ ném — thì `in.close()` ở dòng sau không bao giờ chạy. Sách nói thẳng là đóng tài nguyên đúng bằng `try`-`finally` khó đến mức chính tác giả từng viết sai, và ở đây có thêm một khiếm khuyết tinh tế giải thích luôn chi tiết log: khi thân `try` đã ném và `close()` trong `finally` cũng ném, exception thứ hai xoá sạch exception thứ nhất. Vì thế log chỉ còn lỗi ở `close()`, còn lỗi gốc — dòng hỏng hay file bị xoá — biến mất. Bây giờ đến `finalize()`. Đội tin rằng nó là tấm lưới, và chính niềm tin đó cho phép dòng `new ReportWriter(summaryPath).writeRow(total)` trong job tổng kết tồn tại: mỗi lần job chạy lại bỏ lại một writer không ai đóng. Nhưng finalizer không có đảm bảo nào về thời điểm chạy, thậm chí không đảm bảo sẽ chạy. Heap 8 GB với GC thưa nghĩa là những object chờ finalize có thể nằm đó hàng giờ, mỗi object giữ một descriptor — và các reader bị bỏ mở trên đường lỗi cũng chỉ được giải phóng khi GC tình cờ chạm tới chúng. Và độ trễ này phụ thuộc thuật toán GC và cấu hình heap, nên staging với heap và kiểu tải khác không tái hiện được là chuyện dễ hiểu. Sách nêu đúng ví dụ này: dựa vào finalizer để đóng file là sai lầm nghiêm trọng vì descriptor là tài nguyên có hạn. Cách sửa: `ReportWriter` implement `AutoCloseable`, và `export` viết lại bằng `try`-with-resources khai báo cả `in` lẫn `out` trong cùng một câu lệnh. Mỗi tài nguyên mở thành công đều được đóng, kể cả khi tài nguyên sau ném lúc mở. Và nếu cả thân lẫn `close()` cùng ném thì exception gốc được giữ, exception từ `close` bị suppressed nhưng vẫn in trong stack trace và lấy được qua `getSuppressed` — nghĩa là từ bản sửa này log sẽ nói đúng chuyện gì xảy ra. Dòng ghi summary cũng chuyển sang `try`-with-resources. Tôi bỏ `finalize()` — ngoài chuyện không đáng tin, nó còn làm tạo và huỷ object chậm đi rất nhiều. Nếu đội vẫn muốn một lưới an toàn cho người quên đóng thì dùng `Cleaner` và nói rõ nó chỉ là lưới, không phải cơ chế chính. Tôi cũng để `close()` ghi nhận trạng thái đã đóng, và `writeRow` sau khi đóng thì ném `IllegalStateException`. Để chứng minh, tôi có hai thứ. Test tự động: giả lập `transform` ném giữa chừng, giả lập `close` ném, giả lập constructor của writer ném — mỗi trường hợp đều khẳng định tài nguyên đã đóng và exception gốc là exception được ném ra. Và số liệu production: sau deploy, đường số descriptor phải đi ngang qua nhiều giờ cao điểm thay vì leo dốc. Khi có đồ thị đó thì mới trả lại `ulimit` cũ cho đội hạ tầng.",
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
      "Tràn số phá chủ yếu **tính bắc cầu** của hợp đồng so sánh (dấu vẫn đối xứng nhờ phép ép `int`, trừ khi hiệu bị cắt đúng thành `Integer.MIN_VALUE`) — thứ tự sai, và thuật toán sắp xếp có thể phát hiện vi phạm rồi ném exception",
      "Sửa bằng `Long.compare` hoặc `Comparator.comparingLong(Txn::amount).reversed()` — không bao giờ dùng phép trừ",
      "Giải thích vì sao lộ ra bây giờ: dữ liệu mới (thêm chữ số thập phân, hạn mức lớn hơn) chạm vào bug đã nằm sẵn",
      "Xử lý báo cáo đã gửi: chạy lại 5 ngày bằng code đã sửa, so sánh, thông báo phần sai cho kế toán và đối tác",
      "Ngăn tái diễn: test với giá trị biên (chênh lệch vượt phạm vi `int`, cùng giá trị khác số chữ số thập phân)",
    ],
    model: "Đây là hai lỗi khác nhau lộ ra cùng tuần, và cả hai cùng một họ: một thứ phụ thuộc vào so sánh đang dùng một phép so sánh không đúng như người viết nghĩ. Tôi tách ra từng cái. Con số lệch trước. Service A dùng `HashSet`, service B dùng `TreeSet`, trên cùng một danh sách giá. `HashSet` quyết định hai phần tử có trùng không bằng `equals` và `hashCode`; `TreeSet` quyết định bằng `compareTo`. Với hầu hết kiểu thì hai cách cho cùng câu trả lời, nhưng `BigDecimal` là ngoại lệ sách nêu đích danh: `compareTo` của nó không nhất quán với `equals`. `new BigDecimal(\"1.0\")` và `new BigDecimal(\"1.00\")` khác nhau theo `equals` vì khác scale, nhưng bằng nhau theo `compareTo`. Nên `HashSet` giữ cả hai còn `TreeSet` chỉ giữ một. Trước khi có đối tác mới, mọi giá đều cùng số chữ số thập phân nên chuyện này vô hình; đối tác gửi `1.0` bên cạnh `1.00` là nó lộ ra. Về con số, 1.284 là số giá trị phân biệt theo `equals`, 1.197 là số lớp phân biệt theo `compareTo`, nên phần chênh 87 là tổng số biểu diễn thừa: một giá trị có k cách viết góp k − 1 — ba cách viết của cùng một giá là hai phần tử thừa, không phải ba cặp. Để kiểm chứng rằng không có nguyên nhân thứ ba, tôi chuẩn hoá dữ liệu một ngày bằng `stripTrailingZeros()` rồi đếm lại bằng `HashSet`: nếu ra đúng 1.197 thì toàn bộ phần chênh đến từ khác biệt scale. Sửa ở đây không phải là đổi B sang `HashSet` cho khớp A. Câu hỏi đúng là nghiệp vụ muốn \"mức giá riêng biệt\" nghĩa là gì. Với đối soát thì gần như chắc là bằng nhau về giá trị, nên tôi chuẩn hoá mỗi giá về một dạng chuẩn — ví dụ `stripTrailingZeros()` — ngay khi đọc dữ liệu vào, rồi cả hai service mới đưa vào set. Sách gọi đây là lưu trữ dạng chuẩn để so sánh chính xác và rẻ. Nếu có nơi thực sự cần phân biệt scale thì nơi đó phải nói rõ, và không được dùng sorted collection cho nó. Lỗi thứ hai nằm ở comparator `(int) (b.amount() - a.amount())`. Kỹ thuật so sánh bằng phép trừ là thứ sách cấm thẳng vì tràn số. Ở đây còn tệ hơn: hiệu hai `long` bị ép về `int`, nên hễ hai giao dịch chênh nhau quá khoảng 2,1 tỷ đồng là giá trị bị cắt và có thể đổi dấu. Đó là lý do một giao dịch 3 tỷ bị xếp dưới giao dịch vài trăm triệu. Nâng hạn mức giao dịch là thứ làm những chênh lệch như vậy xuất hiện thường xuyên. Và một comparator như thế không còn bắc cầu — về dấu thì nó gần như vẫn đối xứng, vì phần bị cắt của hiệu ngược dấu cũng ngược dấu, trừ đúng trường hợp phần cắt ra là `Integer.MIN_VALUE` — nên thuật toán sắp xếp của JDK có lúc phát hiện được mâu thuẫn và ném `IllegalArgumentException: Comparison method violates its general contract!` — exception đêm đó chính là hệ quả của cùng lỗi, không phải lỗi thứ ba. Sửa thành `Comparator.comparingLong(Txn::amount).reversed()`, hoặc `(a, b) -> Long.compare(b.amount(), a.amount())`. Tôi không chấp nhận các bản vá kiểu bỏ phép ép `int` rồi vẫn trừ, vì vẫn là phép trừ. Về các báo cáo đã gửi: tôi chạy lại đối soát 5 ngày bằng code đã sửa, so từng mục với bản đã gửi, và gửi kế toán cùng đối tác danh sách chính xác những con số và thứ hạng đã sai — không phải một thông báo chung chung. Để ngăn tái diễn, tôi thêm test với dữ liệu biên: hai giá cùng giá trị khác scale phải cho cùng kết quả ở cả hai service, và hai giao dịch chênh nhau vượt phạm vi `int` phải sắp đúng thứ tự. Tôi cũng rà code tìm các comparator còn dùng phép trừ.",
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
      symptom: "Sau khi phát hành tính năng gợi ý nhãn sản phẩm, endpoint mới trả 500 cho mọi request được bật tính năng. Stack trace: `java.lang.ClassCastException: class [Ljava.lang.Object; cannot be cast to class [Ljava.lang.String;` tại `LabelService.suggest(LabelService.java:42)` — nhưng dòng 42 không có phép ép kiểu nào, chỉ là một lời gọi tới tiện ích `Variants.chooseTwo` trong module dùng chung. Các tiện ích của `Variants` đã được hơn chục chỗ khác dùng suốt một năm không lỗi, và build của module dùng chung sạch cảnh báo.",
      scale: "Endpoint phục vụ trang chi tiết sản phẩm, khoảng 1.500 request/giây lúc cao điểm; tính năng đang bật cho 10% người dùng qua feature flag. Module `common` có 14 service khác phụ thuộc.",
      constraints: "Tắt feature flag được ngay, nhưng đội sản phẩm muốn bật lại trong 24 giờ. Mọi thay đổi chữ ký public của `common` buộc các service phụ thuộc biên dịch lại, nên phải đánh giá tác động. Không được \"sửa\" bằng cách bắt exception ở dòng 42.",
    },
    question: "Bạn là người được gọi vào. Giải thích vì sao có `ClassCastException` ở một dòng không có cast, truy tới nguyên nhân gốc, nêu cách sửa ngắn hạn và dài hạn, và cách ngăn loại lỗi này quay lại.",
    mustCover: [
      "Compiler **chèn một phép ép kiểu vô hình** khi gán kết quả của method generic vào kiểu cụ thể — phép ép sang `String[]` ở dòng 42 là thứ thất bại",
      "Mảng varargs cho `merge` được tạo bên trong `chooseTwo` (một method generic) nên có kiểu runtime là `Object[]`; `T[]` trả về thực chất là `Object[]` — đó là **heap pollution**",
      "Generic varargs chỉ an toàn khi **không lưu gì vào mảng varargs** và **không để lộ mảng (hay bản sao) ra ngoài** — `merge` vi phạm cả hai",
      "`@SuppressWarnings(\"unchecked\")` trên cả method đã nuốt cảnh báo possible heap pollution — chặn cảnh báo mà không chứng minh an toàn chỉ tạo cảm giác an toàn giả",
      "Lỗi nổ **cách nơi gây ra hai cấp**: heap pollution sinh ra trong `chooseTwo`, lộ ra ở dòng 42 của client",
      "Vì sao một năm không lỗi: phần lớn chỗ gọi cũ **gọi thẳng `merge(...)` với đối số kiểu cụ thể**, nên compiler tạo mảng varargs đúng kiểu (vd `String[]`) ngay tại chỗ gọi; số còn lại dùng kết quả trong ngữ cảnh generic hoặc như `Object[]`, nơi không có phép ép sang kiểu mảng cụ thể",
      "Ngắn hạn: tắt feature flag; để bật lại, `LabelService` không nhận `String[]` từ tiện ích mà dùng một API trả `List`",
      "Dài hạn: thêm API trả `List<T>` (dựa trên `List.of`) thay cho mảng, deprecate bản trả mảng; chỉ đánh `@SafeVarargs` khi method đã thật sự an toàn",
      "`@SuppressWarnings` phải ở **phạm vi hẹp nhất** (thường là một khai báo biến) và kèm comment giải thích vì sao an toàn; rà lại mọi chỗ chặn cảnh báo trong `common`",
      "Ngăn tái diễn: build coi cảnh báo unchecked là lỗi và có test gọi tiện ích với kiểu cụ thể như `String`",
    ],
    model: "Câu \"không có cast ở dòng 42\" chỉ đúng với mã nguồn. Khi tôi gọi một method generic trả `T[]` và gán vào `String[]`, compiler chèn một phép ép kiểu vô hình sang `String[]` — phép ép mà hệ thống kiểu generic hứa là không bao giờ thất bại, với điều kiện không ai chặn cảnh báo sai chỗ. Nó thất bại nghĩa là lời hứa đã bị phá ở đâu đó, và thông báo lỗi nói luôn ở đâu: đối tượng thật là một `Object[]`. Truy ngược: `chooseTwo` là method generic, nó gọi `merge(primary, x)`. Để gọi một method varargs, compiler tạo mảng tham số ngay tại `chooseTwo`, mà tại đó `T` chưa biết là gì, nên mảng được tạo là `Object[]` — kiểu cụ thể nhất chứa được mọi `T`. `merge` trả `Arrays.copyOf(parts, n)`, bản sao giữ nguyên kiểu runtime `Object[]`, đi ngược lên `chooseTwo`, rồi lên dòng 42 dưới danh nghĩa `String[]`. Một biến kiểu parameterized trỏ vào object không thuộc kiểu đó — sách gọi là heap pollution. Và lỗi nổ cách nơi gây ra hai cấp, đúng như ví dụ `toArray`/`pickTwo` trong sách. Sách nêu hai điều kiện để một method generic varargs an toàn: không lưu gì vào mảng varargs, và không để lộ mảng — hay một bản sao của nó — ra ngoài. `merge` vi phạm cả hai: dồn phần tử ngay trong mảng, và trả bản sao ra. Vì sao một năm không ai thấy? Lý do phổ biến nhất là phần lớn chỗ gọi cũ gọi thẳng `merge(a, b, c)` với đối số kiểu cụ thể như `String`. Khi đó `T` được suy ra là `String` ngay tại chỗ gọi, compiler tạo mảng varargs đúng kiểu `String[]`, `Arrays.copyOf` giữ nguyên kiểu runtime đó, nên phép ép vô hình thành công — bug nằm đó mà không bao giờ nổ. Số chỗ gọi còn lại dùng kết quả trong ngữ cảnh generic hoặc như `Object[]`, nơi compiler không chèn phép ép sang một kiểu mảng cụ thể. `LabelService` là chỗ đầu tiên vừa đi qua method generic trung gian `chooseTwo` vừa gán kết quả vào `String[]`. Còn \"build sạch cảnh báo\" chính là cái bẫy: compiler có cảnh báo possible heap pollution ở khai báo `merge` và cảnh báo tạo mảng generic ở `chooseTwo`, nhưng cả hai bị `@SuppressWarnings(\"unchecked\")` đặt trên cả method nuốt mất, không kèm một dòng giải thích vì sao an toàn — vì nó không an toàn. Sách nói chặn cảnh báo mà không chứng minh trước chỉ tạo cảm giác an toàn giả. Ngắn hạn: tắt feature flag ngay. Để bật lại trong 24 giờ, tôi thêm vào `common` một API trả `List<T>` — thân của nó chỉ là `List.of` trên các phần tử đã lọc — và cho `LabelService` dùng API đó; không bắt exception ở dòng 42, cũng không đổi dòng 42 sang `Object[]` rồi ép từng phần tử, vì làm vậy để nguyên cái bẫy cho 14 service kia. Dài hạn: bản trả `List<T>` là hướng sách khuyên — thay mảng varargs bằng `List`, compiler chứng minh được an toàn mà không cần ai hứa. Thêm method mới không phá chữ ký cũ, nên 14 service không phải biên dịch lại ngay; tôi deprecate bản trả mảng và lên lịch chuyển dần. Nếu vẫn muốn giữ một method varargs, tôi viết lại để nó không ghi vào mảng và không trả mảng ra, rồi mới đánh `@SafeVarargs` — annotation đó là lời hứa của tác giả, chỉ hợp lệ trên method không override được, và đánh nó lên `merge` hiện tại là nói dối compiler. Để ngăn tái diễn: bỏ mọi `@SuppressWarnings` rộng trong `common`, chỗ nào thật sự cần thì đặt trên một khai báo biến cục bộ kèm comment vì sao an toàn; build của `common` coi cảnh báo unchecked là lỗi; và mỗi tiện ích generic có test gọi nó với một kiểu cụ thể như `String`, vì chỉ lời gọi như thế mới làm phép ép vô hình lộ ra.",
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

  // ===== ej-lambda (ej-iq13–ej-iq16) =====
  {
    id: "ej-iq13",
    field: "effective-java",
    topic: "ej-lambda",
    level: 1,
    minutes: 5,
    question: "Từ Java 8, gần như mọi function object nhỏ đều viết được bằng lambda. Khi nào bạn vẫn không dùng lambda — mà giữ anonymous class, hoặc chuyển sang method reference? Và khi thiết kế một API nhận function object, vì sao bạn thường chọn một interface có sẵn thay vì tự khai báo, và khi nào thì ngược lại?",
    mustCover: [
      "Lambda **không có tên và không có tài liệu**: phép tính không tự giải thích được hoặc dài quá vài dòng (một dòng là lý tưởng, ba dòng là tối đa) thì tách ra method có tên",
      "Anonymous class vẫn cần khi tạo instance của **abstract class**, của interface có **nhiều abstract method**, hoặc khi function object cần **tham chiếu chính nó** — trong lambda, `this` trỏ tới instance bao quanh",
      "Không serialize lambda hay anonymous class; cần một `Comparator` serializable thì dùng private static nested class",
      "Method reference dùng khi nó **ngắn hơn và rõ hơn** (`Integer::sum`); giữ lambda khi tên tham số là tài liệu, hoặc khi method nằm ngay trong class (`() -> action()`), hay `x -> x` thay cho `Function.identity()`",
      "Functional interface chuẩn trong `java.util.function` làm API **dễ học hơn** (giảm diện tích khái niệm) và tương tác tốt nhờ default method có sẵn; nhớ sáu interface cơ bản là suy ra được phần còn lại",
      "Không dùng interface cơ bản với boxed primitive — dùng biến thể primitive như `IntPredicate`, `LongBinaryOperator`",
      "Tự viết khi không có interface chuẩn phù hợp (ba tham số, ném checked exception), hoặc khi giống `Comparator`: dùng phổ biến nên hưởng lợi từ tên, có hợp đồng chặt chẽ, cần default method riêng — và luôn đánh `@FunctionalInterface`",
      "Không viết các overload nhận **các functional interface khác nhau ở cùng vị trí đối số** — client có thể phải ép kiểu, như `ExecutorService.submit` với `Callable` và `Runnable`",
    ],
    model: "Tôi dùng lambda làm mặc định cho function object nhỏ, nhưng có ba nhóm trường hợp tôi không dùng. Nhóm thứ nhất là khi lambda làm code khó đọc hơn. Lambda không có tên và không có tài liệu, nên nếu phép tính không tự giải thích được hoặc dài quá vài dòng — sách nói một dòng là lý tưởng, ba dòng là mức tối đa hợp lý — tôi tách nó ra thành một method có tên, viết Javadoc cho nó, rồi truyền method reference. Đó cũng là lối thoát tự nhiên khi lambda phình ra. Ngược lại, method reference không phải lúc nào cũng tốt hơn: `map.merge(key, 1, Integer::sum)` rõ hơn lambda có hai tham số `count`, `incr` chẳng nói thêm gì, nhưng `service.execute(() -> action())` lại rõ hơn `GoshThisClassNameIsHumongous::action`, và `x -> x` gọn hơn `Function.identity()`. Có lúc tên tham số của lambda chính là tài liệu, và khi đó tôi giữ lambda dù IDE gợi ý đổi. Nhóm thứ hai là khi lambda không làm được. Lambda chỉ tạo được instance của functional interface, nên muốn tạo instance của một abstract class, hay của interface có nhiều abstract method, tôi vẫn cần anonymous class. Và lambda không lấy được tham chiếu tới chính nó — `this` trong lambda là instance bao quanh — nên một observer muốn tự huỷ đăng ký bằng `removeObserver(this)` phải là anonymous class. Nhóm thứ ba là serialization: cả lambda lẫn anonymous class đều không serialize đáng tin cậy giữa các cài đặt, nên nếu cần một `Comparator` serializable tôi dùng private static nested class. Về vế thứ hai: khi API nhận function object, tôi tìm trong `java.util.function` trước. Dùng interface chuẩn làm API dễ học vì người dùng đã biết sẵn, và tương tác tốt vì các interface này có default method hữu ích — `Predicate` có `and`, `negate` chẳng hạn. Tôi không cần nhớ cả bốn mươi ba interface, chỉ cần sáu cái cơ bản — `UnaryOperator`, `BinaryOperator`, `Predicate`, `Function`, `Supplier`, `Consumer` — rồi suy ra biến thể. Một lỗi tôi hay gặp là dùng `Function<Integer, Integer>` hay `Predicate<Long>` cho dữ liệu số; tôi đổi sang `IntUnaryOperator`, `LongPredicate` để tránh boxing, vì với thao tác hàng loạt thì cái giá hiệu năng rất lớn. Ví dụ trong sách là `LinkedHashMap.removeEldestEntry`: nếu viết lại hôm nay, không cần khai báo `EldestEntryRemovalFunction` mà dùng `BiPredicate<Map<K,V>, Map.Entry<K,V>>`. Tôi tự viết functional interface khi không có cái chuẩn nào vừa — cần ba tham số, hay cần ném checked exception — hoặc khi nó giống `Comparator`: cấu trúc trùng với `ToIntBiFunction` nhưng được dùng khắp nơi nên cái tên là tài liệu, có một hợp đồng chặt chẽ mà người cài đặt phải tuân thủ, và có nhiều default method riêng. Tự viết thì tôi luôn đánh `@FunctionalInterface` để người đọc biết ý định và để compiler chặn ai đó lỡ thêm abstract method thứ hai. Cuối cùng, tôi tránh viết các overload nhận các functional interface khác nhau ở cùng vị trí đối số, vì client có thể phải ép kiểu mới chọn được overload — `ExecutorService.submit` với `Callable` và `Runnable` là ví dụ sẵn.",
    redFlags: [
      "Cho rằng anonymous class đã hoàn toàn lỗi thời, không còn việc gì chỉ nó làm được",
      "Nghĩ `this` trong lambda trỏ tới chính lambda",
      "Luôn chấp nhận gợi ý đổi sang method reference của IDE, kể cả khi nó dài và khó đọc hơn",
      "Khai báo functional interface riêng trùng cấu trúc với `Predicate` hay `Function` mà không có lý do",
      "Dùng `Function<Integer, Integer>` cho xử lý số hàng loạt",
    ],
    probes: [
      "Bảng năm loại method reference — static, bound, unbound, constructor, array constructor — bạn cho mỗi loại một ví dụ và lambda tương đương?",
      "Enum `Operation` có thể dùng lambda trong constructor thay cho constant-specific class body. Khi nào bạn vẫn giữ class body?",
      "Vì sao `Comparator` xứng đáng là một interface riêng dù cấu trúc giống hệt `ToIntBiFunction<T,T>`?",
    ],
    refs: ["ej-07"],
  },
  {
    id: "ej-iq14",
    field: "effective-java",
    topic: "ej-lambda",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Đếm tần suất từ trong một file log, rồi lấy 10 từ xuất hiện nhiều nhất.
Map<String, Long> freq = new HashMap<>();
try (Stream<String> words = new Scanner(file).tokens()) {
    words.forEach(word -> {
        freq.merge(word.toLowerCase(), 1L, Long::sum);
    });
}

List<String> topTen = new ArrayList<>();
freq.entrySet().stream()
    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
    .limit(10)
    .forEach(e -> topTen.add(e.getKey()));`,
    },
    question: "Code cho kết quả đúng và dùng stream, lambda, method reference. Reviewer vẫn từ chối, ghi chú: \"dùng API stream nhưng không dùng mô hình stream\". Giải thích nhận xét đó, viết lại cả hai phần, và cho biết chuyện gì xảy ra nếu một đồng nghiệp thêm `.parallel()` vào bản cũ để xử lý file lớn nhanh hơn.",
    mustCover: [
      "Đây là **mã lặp đội lốt mã stream**: toàn bộ phép tính nằm trong `forEach`, bằng một lambda sửa trạng thái bên ngoài (`freq`, `topTen`)",
      "Mô hình stream: chuỗi phép biến đổi, mỗi giai đoạn gần với một **hàm thuần túy**; mọi function object truyền vào stream phải **không có side effect**",
      "`forEach` chỉ nên dùng để **báo cáo kết quả** của phép tính, không phải để thực hiện phép tính",
      "Phần đếm viết lại: `words.collect(groupingBy(String::toLowerCase, counting()))`",
      "Phần top 10 viết lại: `freq.keySet().stream().sorted(comparing(freq::get).reversed()).limit(10).collect(toList())` — dùng collector thay cho việc `add` vào list bên ngoài",
      "Thêm `.parallel()` vào bản cũ: nhiều thread cùng gọi `merge` trên một `HashMap` không đồng bộ — **safety failure**, số đếm sai hoặc map hỏng; bản dùng collector vẫn đúng khi song song",
      "Static import các member của `Collectors` cho pipeline dễ đọc; `counting()` chỉ dùng làm downstream collector — không bao giờ viết `collect(counting())`",
    ],
    model: "Nhận xét của reviewer đúng. Code này dùng stream, lambda và method reference, nhưng nó không phải mã stream — nó là mã lặp đội lốt mã stream. Toàn bộ phép tính nằm trong terminal operation `forEach`, bằng một lambda thay đổi trạng thái bên ngoài là `freq`; phần top 10 lặp lại đúng kiểu đó với `topTen.add`. Nó không được lợi gì từ streams API, lại dài hơn và khó đọc hơn một vòng for-each thường. Mô hình mà stream đòi hỏi là cấu trúc phép tính thành một chuỗi phép biến đổi, trong đó kết quả mỗi giai đoạn càng gần một hàm thuần túy của giai đoạn trước càng tốt — tức là mọi function object truyền vào stream, cả intermediate lẫn terminal, đều không có side effect. Quy tắc tôi dùng khi review: `forEach` chỉ để báo cáo kết quả của một phép tính stream, như in ra; nếu `forEach` đang làm phép tính thì đó là mùi xấu. Phần đếm viết lại thành `freq = words.collect(groupingBy(String::toLowerCase, counting()));` — `groupingBy` phân loại mỗi từ theo dạng chữ thường, và downstream collector `counting()` biến mỗi nhóm thành số lượng thay vì list phần tử. Phần top 10 viết lại thành `List<String> topTen = freq.keySet().stream().sorted(comparing(freq::get).reversed()).limit(10).collect(toList());`. Chỗ duy nhất cần giải thích là comparator: `comparing` nhận hàm trích khoá, ở đây là bound method reference `freq::get` tra số lần xuất hiện của từ, và `reversed()` để sắp từ nhiều tới ít. Tôi static import toàn bộ `Collectors` và `Comparator.comparing` cho pipeline đọc như câu văn. Một lưu ý nhỏ: `counting()` chỉ được thiết kế làm downstream collector; muốn đếm cả stream thì gọi `count()`, không bao giờ `collect(counting())`. Vế cuối là lý do quan trọng nhất để không chấp nhận bản cũ. Nếu ai đó thêm `.parallel()` vào stream `words`, lambda trong `forEach` sẽ chạy trên nhiều thread của fork-join pool, cùng gọi `merge` trên một `HashMap` không đồng bộ. Đó là safety failure: số đếm sai, hoặc cấu trúc bên trong map hỏng, và vì không ném exception nên có thể không ai phát hiện. Bản dùng collector thì đúng khi chạy song song vì thư viện tự lo việc gom kết quả từng phần. Tôi vẫn không khuyến khích song song hoá ở đây — nguồn là `Scanner`, chia tách kém, và `collect` là mutable reduction, không phải ứng viên tốt cho song song — nhưng ít nhất nếu có ai đo và thấy đáng thì code không sai. Nếu thật sự cần song song thì có `groupingByConcurrent`, tạo `ConcurrentHashMap`.",
    redFlags: [
      "Cho rằng code ổn vì đã dùng stream và cho kết quả đúng",
      "Sửa bằng cách đổi `HashMap` sang `ConcurrentHashMap` và giữ nguyên `forEach` — vẫn đi ngược mô hình",
      "Viết `collect(counting())` để đếm tổng số phần tử",
      "Không nhận ra thêm `.parallel()` vào bản cũ là lỗi đúng đắn, không chỉ là vấn đề phong cách",
    ],
    probes: [
      "Muốn map từ nghệ sĩ tới album bán chạy nhất, bạn dùng dạng nào của `toMap`?",
      "`toMap(keyMapper, valueMapper)` gặp hai phần tử cùng khoá thì sao, và bạn xử lý thế nào?",
      "Có trường hợp nào dùng `forEach` để thêm vào một collection có sẵn là chấp nhận được không?",
    ],
    refs: ["ej-07"],
  },
  {
    id: "ej-iq15",
    field: "effective-java",
    topic: "ej-lambda",
    level: 3,
    minutes: 10,
    question: "Bạn viết thư viện `catalog` dùng chung cho nhiều đội, có ba method public trả về một dãy phần tử: `productsIn(category)` — vài trăm sản phẩm đã nằm sẵn trong bộ nhớ; `bundlesOf(Set<Product> items)` — mọi gói combo có thể tạo từ tối đa 20 sản phẩm; và `auditEvents(Path log)` — sự kiện đọc từ file log hàng GB, chỉ biết nội dung khi đọc tới. Chọn kiểu trả về cho từng method, so sánh các lựa chọn và bảo vệ quyết định.",
    tradeoffs: [
      {
        option: "`Stream<T>`",
        when: "Hợp với người viết pipeline, nhưng `Stream` không extend `Iterable`: client muốn duyệt bằng for-each phải ép kiểu method reference `(Iterable<T>) s::iterator` hoặc viết adapter `iterableOf`, vừa rối vừa chậm hơn. Chỉ chọn khi chắc gần như mọi người dùng sẽ viết pipeline, hoặc khi dãy không biết trước nội dung — như dòng log đọc dần — và cần tài liệu nói rõ phải đóng stream.",
      },
      {
        option: "`Iterable<T>`",
        when: "Đủ cho for-each và không cần biết trước kích thước, nhưng client muốn stream phải tự bắc cầu bằng `StreamSupport.stream(iterable.spliterator(), false)`. Hợp khi method tồn tại chủ yếu để duyệt, hoặc dãy không cài được `contains`/`size` hiệu quả.",
      },
      {
        option: "`Collection<T>` chuẩn (`List`, `Set`)",
        when: "Là subtype của `Iterable` và có `stream()`, nên phục vụ cả hai nhóm người dùng — kiểu trả về tốt nhất cho public method trả dãy. Dùng collection chuẩn như `ArrayList` khi phần tử đã có sẵn hoặc đủ nhỏ; không nạp một dãy lớn vào bộ nhớ chỉ để trả về dưới dạng collection.",
      },
      {
        option: "`Collection<T>` tuỳ biến (trên `AbstractList`/`AbstractCollection`)",
        when: "Cho dãy lớn nhưng biểu diễn cô đọng được, như power set: chỉ cần cài `size` và `get`/`contains`, phần tử được tính khi truy cập. Giới hạn: `size()` trả `int`, nên dãy tối đa khoảng 2^31 − 1 phần tử.",
      },
    ],
    mustCover: [
      "`Stream` không extend `Iterable`: API chỉ trả stream làm khổ người muốn for-each (phải dùng adapter hoặc ép kiểu method reference, và vòng lặp chậm hơn)",
      "API chỉ trả `Iterable` làm khổ người muốn pipeline — phải bắc cầu qua `StreamSupport.stream(spliterator, false)`",
      "`Collection` hoặc subtype thích hợp là **kiểu trả về tốt nhất cho public method trả dãy**, vì nó vừa là `Iterable` vừa có `stream()`",
      "`productsIn`: phần tử đã có sẵn, ít — trả collection chuẩn (`List`), và **trả collection rỗng chứ không trả `null`**",
      "`bundlesOf`: 2^20 tổ hợp — không lưu vào collection chuẩn mà cài **collection tuỳ biến** dùng chỉ số làm vector bit; chặn đầu vào quá lớn vì `size()` là `int`",
      "`auditEvents`: không biết nội dung trước khi đọc nên không cài được `size`/`contains` rẻ — trả `Stream` (hoặc `Iterable`), tài liệu hoá việc phải đóng stream vì nó giữ file mở",
      "Không nạp một dãy lớn vào bộ nhớ chỉ để trả về dưới dạng collection",
    ],
    model: "Nguyên tắc tôi dùng là: người dùng thư viện sẽ chia làm hai nhóm — nhóm muốn viết stream pipeline và nhóm muốn duyệt bằng for-each — và kiểu trả về tốt nhất phục vụ được cả hai. `Stream` không làm được điều đó vì nó không extend `Iterable`, dù có đúng method `iterator` với đặc tả tương thích. Client muốn for-each trên một stream phải viết `(Iterable<T>) stream::iterator` — viết thiếu phép ép thì compiler báo `method reference not expected here` — hoặc dùng một adapter `iterableOf`; cả hai đều rối, và sách đo được adapter làm vòng lặp chậm đi 2,3 lần. Ngược lại, trả `Iterable` thì nhóm kia phải bắc cầu qua `StreamSupport.stream(iterable.spliterator(), false)`. `Collection` là subtype của `Iterable` và có sẵn `stream()`, nên nói chung nó — hoặc một subtype thích hợp như `List`, `Set` — là kiểu trả về tốt nhất cho một public method trả dãy. Áp vào ba method. `productsIn(category)`: vài trăm phần tử đã nằm trong bộ nhớ, nên tôi trả một `List<Product>` chuẩn, cụ thể là một bản sao hoặc view không sửa được để client không đụng vào trạng thái của thư viện; và khi danh mục trống thì trả list rỗng, không bao giờ trả `null`. `bundlesOf(items)`: đây là power set, 2^20 là khoảng một triệu gói, mỗi gói là một set — tôi không đời nào dựng tất cả vào một `ArrayList`. Nhưng dãy này biểu diễn cô đọng được: gói thứ i ứng với số i dùng làm vector bit, bit thứ n bật nghĩa là có sản phẩm thứ n. Tôi viết một collection tuỳ biến trên `AbstractList`, chỉ cài `size()` trả `1 << n` và `get(i)` dựng set từ các bit, cộng `contains` cho rẻ; phần tử được tính khi truy cập. Cái giá phải nói rõ: `size()` trả `int`, nên tôi chặn đầu vào quá 30 phần tử bằng `IllegalArgumentException` — với đề bài tối đa 20 thì dư sức. `auditEvents(log)`: file hàng GB, và tôi không biết có bao nhiêu sự kiện hay một sự kiện có mặt không cho tới khi đọc hết, nên không cài được `size` hay `contains` rẻ, và không được nạp cả file vào bộ nhớ chỉ để trả về một collection. Ở đây tôi trả `Stream<AuditEvent>`, dựa trên `Files.lines` — tốt hơn `Scanner` vì không nuốt `IOException` — và tôi ghi rõ trong Javadoc rằng stream giữ file mở nên client phải dùng nó trong `try`-with-resources. Nếu khảo sát cho thấy nhiều đội chỉ muốn duyệt, tôi có thể thêm một method thứ hai trả `Iterable`, sách cho phép trả cả hai bằng hai method riêng. Tóm lại tôi không chọn một kiểu cho cả ba: tôi chọn collection bất cứ khi nào khả thi, collection tuỳ biến khi dãy lớn nhưng cô đọng, và chỉ lùi về stream khi nội dung không xác định trước khi duyệt.",
    redFlags: [
      "Trả `Stream` cho mọi method vì \"stream là cách hiện đại\"",
      "Dựng toàn bộ power set vào một `ArrayList` để trả về",
      "Đọc cả file log vào `List` để có thể trả `Collection`",
      "Trả `null` khi danh mục trống",
      "Không nhắc tới việc stream đọc file phải được đóng",
    ],
    probes: [
      "Viết adapter `iterableOf(Stream<E>)` — vì sao trong adapter không cần ép kiểu mà ở client lại cần?",
      "Muốn trả mọi sublist liên tiếp của một list, bạn chọn collection hay stream, và vì sao?",
      "Nếu một ngày `Stream` extend `Iterable`, lời khuyên này đổi thế nào?",
    ],
    refs: ["ej-07"],
  },
  {
    id: "ej-iq16",
    field: "effective-java",
    topic: "ej-lambda",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `// Service chống bot — lúc khởi động, tính sẵn lời giải cho 20 mức thử thách
// proof-of-work. Mỗi mức khó gấp đôi mức trước.
List<Solution> solutions = Stream.iterate(Challenge.level(1), Challenge::nextLevel)
        .parallel()                     // thêm trong bản phát hành này, "cho nhanh"
        .map(Challenge::solve)          // mức n tốn khoảng 2^n đơn vị thời gian
        .limit(20)
        .collect(toList());

// Controller khác trong cùng JVM — gợi ý ưu đãi cho mỗi request
List<Offer> top = candidates.parallelStream()
        .map(this::score)
        .sorted(comparingDouble(Offer::score).reversed())
        .limit(10)
        .collect(toList());`,
    },
    incident: {
      symptom: "Sau bản phát hành, các pod mới của service chống bot không bao giờ báo sẵn sàng: job tính sẵn lời giải chạy mãi không xong, CPU đứng ở 90–100% từ lúc khởi động. Cùng lúc, p99 của endpoint gợi ý ưu đãi trên các pod đó tăng từ khoảng 80 ms lên vài giây, dù endpoint này không đổi dòng nào. Bản cũ — không có `.parallel()` — tính xong 20 mức trong khoảng 40 giây. Đội nói đã benchmark bản song song với 5 mức và thấy nhanh hơn.",
      scale: "12 pod, mỗi pod 8 vCPU. Endpoint gợi ý ưu đãi nhận khoảng 2.000 request/giây trên toàn cụm. Rolling deploy đang dừng giữa chừng: 4 pod mới kẹt, 8 pod cũ gánh toàn bộ tải.",
      constraints: "Bản phát hành còn chứa một bản vá bảo mật nên đội không muốn rollback cả bản. Cần sửa và đẩy lại trong hôm nay. Trưởng nhóm hỏi có nên cấm hẳn parallel stream trong codebase không.",
    },
    question: "Bạn được gọi vào. Giải thích vì sao thêm `.parallel()` làm job không bao giờ xong, vì sao endpoint không liên quan lại chậm, bạn sửa thế nào, và trả lời câu hỏi của trưởng nhóm.",
    mustCover: [
      "Song song hoá khó tăng hiệu năng khi nguồn là **`Stream.iterate`** hoặc có **`limit`** — pipeline này dính cả hai",
      "Chiến lược mặc định xử lý `limit` bằng cách **tính thêm vài phần tử rồi bỏ đi**; ở đây chi phí mức n+1 xấp xỉ tổng chi phí mọi mức trước, nên tính thêm dù vài mức cũng tốn gấp nhiều lần cả job — **liveness failure**",
      "Mọi parallel stream mặc định chạy trên **một fork-join pool chung**; job chiếm pool nên pipeline của endpoint gợi ý ưu đãi phải chờ — một pipeline hư làm chậm phần không liên quan",
      "Benchmark 5 mức không đại diện: chi phí tăng theo cấp số nhân, và song song hoá là **tối ưu hoá phải đo trong điều kiện thực tế** trước và sau",
      "Sửa: bỏ `.parallel()` khỏi job; nếu cần nhanh hơn thì song song hoá theo cách chia được — nguồn là dải số (`IntStream.rangeClosed(1, 20)`) hoặc submit từng mức vào executor riêng — và đo lại",
      "Nguồn chia tốt: `ArrayList`, `HashMap`, `HashSet`, `ConcurrentHashMap`, mảng, dải `int`/`long`; terminal tốt là reduction (`reduce`, `min`, `max`, `count`, `sum`) và thao tác ngắn mạch; `collect` là mutable reduction, kém phù hợp",
      "Endpoint gợi ý ưu đãi: `parallelStream` cho mỗi request vốn là lựa chọn đáng ngờ — xét bỏ `parallel` và đo lại",
      "Không cấm tuyệt đối: đúng hoàn cảnh có thể tăng tốc gần tuyến tính; quy tắc hợp lý là chỉ song song hoá khi **giữ được tính đúng** (function object không trạng thái, không can thiệp) **và có số đo** chứng minh",
    ],
    model: "Tôi bắt đầu bằng một thread dump trên pod kẹt: nếu các worker của `ForkJoinPool.commonPool` đều đang ở trong `Challenge.solve` thì giả thuyết được xác nhận. Giả thuyết đến thẳng từ sách, vì pipeline này gần như là ví dụ số nguyên tố Mersenne của Item 48. Có hai điều kiện mà sách nói song song hoá khó có thể giúp: nguồn là `Stream.iterate`, và có intermediate operation `limit`. Pipeline này dính cả hai. `Stream.iterate` là dãy tuần tự: muốn có phần tử thứ n phải có phần tử thứ n − 1, nên thư viện không chia nó thành các khúc cân bằng được. Còn `limit` thì thư viện không biết phần tử nào sẽ lọt, nên chiến lược mặc định là cho các thread xử lý dư vài phần tử rồi bỏ kết quả thừa, với giả định việc đó vô hại. Ở đây nó không vô hại chút nào: mức n tốn khoảng 2^n, nên chi phí của một mức gần bằng tổng chi phí mọi mức trước cộng lại. Tính dư mức 21 là tốn thêm bằng cả job cũ, tính dư mức 22 là gấp đôi nữa — job không bao giờ xong, CPU đứng ở mức cao mãi. Sách gọi đây là liveness failure. Benchmark 5 mức của đội không nói lên gì: ở 5 mức, phần tính dư rẻ, còn ở 20 mức thì cấp số nhân nuốt hết. Vì sao endpoint gợi ý ưu đãi chậm dù không đổi dòng nào? Vì mọi parallel stream trong một JVM mặc định chạy trên cùng một fork-join pool chung, với 8 vCPU là 7 worker. Job của service chống bot giữ các worker đó bận vô thời hạn, nên pipeline `parallelStream` của mỗi request phải chen chúc với nó — sách cảnh báo đúng chuyện này: một pipeline hoạt động sai có thể làm hại hiệu năng của những phần không liên quan trong hệ thống. Sửa ngay trong hôm nay: bỏ `.parallel()` khỏi job, quay về 40 giây tuần tự, và đẩy lại bản phát hành với bản vá bảo mật giữ nguyên. Nếu đội thật sự muốn job nhanh hơn thì song song hoá theo cách chia được: các mức độc lập với nhau, nên nguồn nên là `IntStream.rangeClosed(1, 20)` rồi `mapToObj(Challenge::level)` — dải số chia chính xác và rẻ — hoặc tốt hơn, submit từng mức vào một executor riêng của job để nó không chiếm pool chung. Dù vậy tổng thời gian vẫn bị mức 20 chặn dưới, nên lợi ích có hạn; phải đo rồi mới quyết. Với endpoint gợi ý ưu đãi, tôi cũng đặt câu hỏi: song song hoá cho mỗi request trong một server đã có hàng nghìn request đồng thời hiếm khi đáng, và terminal là `collect`, một mutable reduction vốn không phải ứng viên tốt. Tôi sẽ đo phương án bỏ `parallel` ở đó. Về câu hỏi của trưởng nhóm: tôi không đề xuất cấm hẳn. Trong hoàn cảnh phù hợp — nguồn chia tốt như `ArrayList`, mảng, dải `int` hay `long`; terminal là reduction như `sum`, `count` hoặc thao tác ngắn mạch; mỗi phần tử có đủ việc, sách ước lượng rất thô số phần tử nhân số dòng code mỗi phần tử ít nhất một trăm nghìn — song song hoá có thể tăng tốc gần tuyến tính, như ví dụ đếm số nguyên tố nhanh 3,7 lần trên máy bốn lõi. Quy tắc tôi đề xuất cho review: `.parallel()` là một tối ưu hoá hiệu năng, chỉ được thêm khi code vẫn đúng khi chạy song song — function object không trạng thái, không can thiệp, accumulator có tính kết hợp — và có số đo trước và sau trong điều kiện gần thực tế đính kèm pull request.",
    redFlags: [
      "Tăng số vCPU hoặc chỉnh `parallelism` của common pool thay vì bỏ `.parallel()`",
      "Coi độ chậm của endpoint gợi ý ưu đãi là sự cố riêng, không liên hệ với fork-join pool chung",
      "Tin benchmark 5 mức đại diện cho 20 mức",
      "Cấm tuyệt đối parallel stream hoặc ngược lại cho rằng thêm `.parallel()` luôn an toàn",
    ],
    probes: [
      "Nếu job có chạy xong, kết quả có còn đúng thứ tự không? `forEach` và `forEachOrdered` khác nhau thế nào khi song song?",
      "Muốn song song hoá một stream số ngẫu nhiên, bạn dùng `Random`, `ThreadLocalRandom` hay `SplittableRandom`, và vì sao?",
      "Tự viết một `Collection` và muốn parallel stream trên nó chạy tốt thì phải làm gì?",
    ],
    refs: ["ej-07"],
  },

  // ===== ej-api (ej-iq17–ej-iq20) =====
  {
    id: "ej-iq17",
    field: "effective-java",
    topic: "ej-api",
    level: 1,
    minutes: 5,
    question: "Java có ba loại throwable: checked exception, runtime exception và error. Khi thiết kế API, bạn dùng loại nào cho tình huống nào? Vì sao nhiều người nói checked exception bị lạm dụng làm API khó dùng, và bạn có cách nào bớt chúng mà không đánh mất độ tin cậy?",
    mustCover: [
      "Checked exception cho tình huống mà **người gọi có thể được kỳ vọng hợp lý là sẽ khôi phục được** — nó buộc người gọi bắt hoặc lan truyền",
      "Runtime exception cho **lỗi lập trình**, phần lớn là vi phạm tiền điều kiện (`ArrayIndexOutOfBoundsException`, `IllegalArgumentException`)",
      "`Error` theo quy ước dành cho JVM: không tạo subclass của `Error`, không ném nó (trừ `AssertionError`); mọi unchecked throwable tự viết đều kế thừa `RuntimeException`; không định nghĩa throwable ngoài hai nhánh đó",
      "Khi không rõ khôi phục được hay không thì chọn unchecked",
      "Checked exception chỉ đáng khi **cả hai** điều kiện đúng: không tránh được bằng cách dùng API đúng, **và** người gọi làm được việc gì hữu ích — phép thử là hỏi người gọi có làm được gì hơn `throw new AssertionError()` hay `printStackTrace(); System.exit(1)`",
      "Gánh nặng: mọi lời gọi phải nằm trong `try` hoặc khai báo `throws`, và method ném checked exception **không dùng trực tiếp được trong stream/lambda**; nặng nhất khi đó là checked exception **duy nhất** của method",
      "Cách bớt: trả `Optional` (mất thông tin chi tiết về thất bại), hoặc tách thành method kiểm tra trạng thái + unchecked exception (không hợp khi object bị truy cập đồng thời hoặc khi phép kiểm tra lặp lại công việc)",
      "Exception là object: checked exception nên có **accessor** mang thông tin giúp khôi phục (như số tiền còn thiếu), để client không phải parse chuỗi thông điệp",
    ],
    model: "Quy tắc cốt lõi của tôi là: checked exception cho tình huống mà người gọi có thể được kỳ vọng hợp lý là sẽ khôi phục được, runtime exception cho lỗi lập trình. Khi tôi khai báo một checked exception, tôi đang nói với người dùng API rằng đây là một kết quả có thể xảy ra khi gọi method, và tôi buộc họ đối mặt với nó — bắt nó hoặc lan truyền nó. Runtime exception thì phần lớn báo vi phạm tiền điều kiện: client không tuân thủ hợp đồng, như truyền chỉ số ngoài mảng hay một đối số không hợp lệ. Khôi phục những lỗi đó không có nghĩa lý gì — việc đúng là sửa code gọi. Còn `Error` theo quy ước gần như phổ quát là của JVM, báo cạn tài nguyên hay hỏng bất biến; tôi không tạo subclass của `Error` và không ném nó, trừ `AssertionError`. Mọi unchecked exception tôi viết đều kế thừa `RuntimeException`, và tôi không bao giờ định nghĩa một throwable không thuộc nhánh `Exception` hay `RuntimeException` — nó chẳng đem lại gì ngoài sự bối rối. Ranh giới không phải lúc nào cũng rõ; cạn tài nguyên chẳng hạn có thể do lỗi lập trình hoặc do thiếu tạm thời. Khi không rõ, tôi chọn unchecked. Về lạm dụng: checked exception đặt gánh nặng lên người gọi. Mỗi lời gọi phải nằm trong `try` hoặc kéo theo `throws`, và từ Java 8 gánh nặng nặng hơn vì method ném checked exception không dùng trực tiếp được trong lambda và stream. Tôi chỉ chấp nhận gánh nặng đó khi hai điều kiện cùng đúng: tình huống không thể tránh bằng cách dùng API đúng, và người gọi làm được một việc hữu ích khi gặp nó. Phép thử của sách rất thực dụng: tưởng tượng khối `catch` mà người gọi sẽ viết. Nếu nó chỉ là `throw new AssertionError()` hay `e.printStackTrace(); System.exit(1)` thì exception đó nên là unchecked. Gánh nặng lớn nhất khi đó là checked exception duy nhất mà method ném, vì nó là lý do duy nhất khiến lời gọi phải nằm trong `try`. Để bớt checked exception mà không mất độ tin cậy, tôi có hai công cụ. Thứ nhất, trả `Optional` rỗng thay cho ném exception — client vẫn buộc phải xét trường hợp không có kết quả, nhưng không cần khối `try`; cái giá là mất thông tin chi tiết về lý do thất bại. Thứ hai, tách method thành một method kiểm tra trạng thái trả `boolean` cộng một method ném unchecked exception, kiểu `if (obj.actionPermitted(args)) obj.action(args);`. Cách này không dùng được khi object bị nhiều thread truy cập mà không đồng bộ ngoài, vì trạng thái có thể đổi giữa hai lời gọi, và không đáng khi phép kiểm tra lặp lại toàn bộ công việc. Cuối cùng, khi tôi giữ checked exception, tôi nhớ exception là object: tôi cho nó accessor mang dữ liệu giúp khôi phục — một thanh toán thất bại vì không đủ tiền nên cho biết thiếu bao nhiêu — thay vì để client parse chuỗi thông điệp, thứ có thể đổi giữa các phiên bản.",
    redFlags: [
      "Khai báo `throws Exception` hoặc ném thẳng `Exception`/`RuntimeException`",
      "Dùng checked exception cho lỗi lập trình như đối số `null` hay chỉ số sai",
      "Tạo subclass của `Error` cho lỗi nghiệp vụ",
      "Coi checked exception là thứ nên tránh tuyệt đối",
      "Để client parse `getMessage()` để lấy thông tin khôi phục",
    ],
    probes: [
      "Method `deal(handSize)` của một bộ bài: yêu cầu nhiều lá hơn số còn lại thì ném `IllegalArgumentException` hay `IllegalStateException`?",
      "Khi nào bạn chọn method kiểm tra trạng thái, khi nào chọn trả `Optional` hay giá trị đặc biệt?",
      "Một method của tầng thấp ném `SQLException` lên tầng nghiệp vụ — bạn xử lý thế nào?",
    ],
    refs: ["ej-10"],
  },
  {
    id: "ej-iq18",
    field: "effective-java",
    topic: "ej-api",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `/** Một khoảng thời gian immutable; start không được nằm sau end. */
public final class Period {
    private final Date start;
    private final Date end;

    /**
     * @throws IllegalArgumentException nếu start nằm sau end
     * @throws NullPointerException nếu start hoặc end là null
     */
    public Period(Date start, Date end) {
        if (start.compareTo(end) > 0)
            throw new IllegalArgumentException(start + " after " + end);
        this.start = start;
        this.end   = end;
    }

    public Date start() { return start; }
    public Date end()   { return end; }
}`,
    },
    question: "Class được mô tả là immutable và luôn giữ start không nằm sau end. Chỉ ra hai cách một client phá bất biến đó mà không dùng reflection, rồi sửa class. Một đồng nghiệp đề xuất bản vá: giữ nguyên câu kiểm tra ở đầu constructor, chỉ đổi hai dòng gán thành `(Date) start.clone()` và `(Date) end.clone()`. Nhận xét đề xuất đó.",
    mustCover: [
      "Tấn công 1: client giữ tham chiếu `Date` đã truyền vào rồi sửa nó sau khi tạo `Period` (`end.setYear(78)`) — class đang lưu chính object của client",
      "Tấn công 2: accessor trả thẳng field nội bộ, client sửa qua `p.end().setYear(78)`",
      "Sửa constructor: **tạo bản sao phòng vệ trước**, rồi **kiểm tra trên bản sao** — `this.start = new Date(start.getTime())`…",
      "Kiểm trước chép sau để hở **khoảng thời gian dễ bị tổn thương**: một thread khác sửa tham số giữa lúc kiểm và lúc chép — tấn công **TOCTOU**",
      "Không dùng `clone` để sao chép tham số có kiểu mà bên không đáng tin có thể tạo subclass: `Date` không `final`, `clone` có thể trả về subclass độc hại",
      "Sửa accessor: trả bản sao phòng vệ (`new Date(end.getTime())`); ở accessor thì `clone` chấp nhận được vì biết chắc field là `java.util.Date`",
      "Cách tốt hơn từ Java 8: dùng kiểu immutable như `Instant` (hoặc lưu `long` từ `getTime()`); `Date` không nên dùng trong mã mới",
    ],
    model: "Class trông immutable nhưng không phải, vì nó nhận và trả ra một thành phần mutable là `Date`. Cách tấn công thứ nhất: client tạo `Date start`, `Date end`, dựng `Period p = new Period(start, end)`, rồi gọi `end.setYear(78)`. Constructor đã lưu chính object mà client đang giữ, nên bên trong `p` bị đổi theo và end giờ nằm trước start. Cách thứ hai, kể cả khi constructor đã sửa: `p.end().setYear(78)` — accessor trả thẳng field nội bộ, client sửa được phần ruột của `Period`. Sửa constructor bằng bản sao phòng vệ, và thứ tự là điểm mấu chốt: `this.start = new Date(start.getTime()); this.end = new Date(end.getTime());` rồi mới `if (this.start.compareTo(this.end) > 0) throw new IllegalArgumentException(this.start + \" after \" + this.end);`. Tức là sao chép trước, kiểm tra sau, và kiểm tra trên bản sao chứ không trên tham số gốc. Nghe ngược với trực giác, nhưng nếu kiểm trước chép sau thì có một khoảng thời gian dễ bị tổn thương giữa lúc kiểm và lúc chép, trong đó một thread khác có thể sửa tham số — giới bảo mật gọi là tấn công time-of-check/time-of-use, TOCTOU. Hợp đồng về `null` vẫn giữ: `start.getTime()` ném `NullPointerException` như Javadoc đã hứa. Accessor cũng trả bản sao: `return new Date(end.getTime());`. Với cả hai thay đổi, không class nào ngoài `Period` chạm được vào field mutable của nó, nên bất biến giữ được bất kể client ác ý hay vụng về. Bây giờ đến đề xuất của đồng nghiệp — nó sai hai chỗ. Một là thứ tự: giữ câu kiểm tra ở đầu rồi mới clone vẫn là kiểm trước chép sau, nên cửa sổ TOCTOU còn nguyên, và câu kiểm tra chạy trên object của client chứ không trên thứ class thực sự lưu. Hai là dùng `clone` cho tham số: `Date` không phải `final`, nên thứ client truyền vào có thể là một subclass độc hại mà `clone` của nó trả về chính một instance của subclass đó — chẳng hạn một subclass ghi lại tham chiếu mọi instance vào một list static để kẻ tấn công sửa sau. Quy tắc: không dùng `clone` để sao chép phòng vệ một tham số có kiểu mà bên không đáng tin có thể kế thừa. Ở accessor thì khác: tôi biết chắc field là `java.util.Date` do chính constructor tạo, nên `clone` chấp nhận được — dù tôi vẫn thích constructor sao chép hơn. Và nếu được sửa rộng hơn, tôi bỏ `Date` hẳn: từ Java 8, `Instant` là immutable nên không cần sao chép phòng vệ gì cả; với code cũ hơn thì lưu giá trị `long` từ `getTime()`. Bài học chung tôi áp dụng khi review: mỗi khi một class lưu tham chiếu tới object do client đưa vào, hoặc trả ra một thành phần nội bộ, hỏi xem object đó có mutable không — nếu có, sao chép phòng vệ hoặc đổi sang kiểu immutable.",
    redFlags: [
      "Chỉ thấy một trong hai cách tấn công",
      "Kiểm tra trên tham số gốc rồi mới sao chép",
      "Dùng `clone()` của tham số để tạo bản sao phòng vệ",
      "Cho rằng `final` trên field là đủ để class immutable",
    ],
    probes: [
      "Nếu `Period` implement `Serializable`, kẻ tấn công còn đường nào phá bất biến, và `readObject` phải viết thế nào?",
      "Khi nào bỏ qua sao chép phòng vệ là chấp nhận được, và bạn phải ghi gì vào tài liệu?",
      "Trả ra một mảng nội bộ thì sao — bạn có những lựa chọn nào?",
    ],
    refs: ["ej-08"],
  },
  {
    id: "ej-iq19",
    field: "effective-java",
    topic: "ej-api",
    level: 3,
    minutes: 10,
    question: "Bạn thiết kế API public cho `CustomerService`. Bốn method có thể \"không có kết quả\": `findByEmail(String)` — email có thể chưa đăng ký; `ordersOf(customerId)` — khách có thể chưa có đơn nào; `bestDiscountPercent(Cart)` — một con số `int`, có thể không có ưu đãi nào áp dụng; và `byId(customerId)` — id do chính hệ thống cấp và đáng lẽ luôn tồn tại. Với mỗi method, bạn biểu diễn trường hợp không có kết quả thế nào? So sánh các cách và chốt.",
    tradeoffs: [
      {
        option: "Trả `null`",
        when: "Rẻ nhất, nhưng mọi client phải nhớ kiểm tra; quên một chỗ là `NullPointerException` nổ ở nơi xa, có khi rất lâu sau khi `null` đã được cất vào một cấu trúc dữ liệu. Chỉ cân nhắc cho method mà hiệu năng là then chốt và đã có số đo chứng minh; không bao giờ dùng thay cho collection hay mảng rỗng.",
      },
      {
        option: "Trả `Optional<T>` (hoặc `OptionalInt`/`OptionalLong`/`OptionalDouble`)",
        when: "Khi method có thể không có kết quả và client phải xử lý riêng trường hợp đó: buộc client đối mặt như checked exception nhưng không cần `try`, và cho client chọn `orElse`, `orElseGet`, `orElseThrow`, `map`. Có chi phí cấp phát và một bước gián tiếp. Không dùng cho kiểu container, không dùng `Optional` của boxed primitive.",
      },
      {
        option: "Ném exception",
        when: "Khi không có kết quả là tình huống thật sự ngoại lệ — vi phạm tiền điều kiện hay lỗi lập trình — thì unchecked exception; checked exception khi người gọi khôi phục được và cần thông tin chi tiết mà `Optional` không mang được. Không dùng để báo một kết quả bình thường, vì như vậy là bắt client dùng exception cho luồng điều khiển.",
      },
      {
        option: "Trả collection/mảng rỗng",
        when: "Cho mọi method trả collection hay mảng: không có phần tử nào là một kết quả bình thường. Client không cần mã xử lý đặc biệt; nếu số đo cho thấy cấp phát có vấn đề thì trả lại cùng một collection rỗng immutable (`Collections.emptyList()`).",
      },
    ],
    mustCover: [
      "`ordersOf`: trả **list rỗng, không trả `null`**, cũng không trả `Optional<List<…>>` — không bọc container trong `Optional`",
      "`findByEmail`: `Optional<Customer>` — kết quả có thể vắng mặt và client phải xử lý riêng; client chọn `orElse`, `orElseGet`, `orElseThrow(Factory::new)` hoặc `map`",
      "`bestDiscountPercent`: `OptionalInt`, **không `Optional<Integer>`** — hai tầng boxing",
      "`byId`: không tìm thấy là vi phạm tiền điều kiện/lỗi dữ liệu — ném **unchecked exception** có detail message chứa id, không bắt client xử lý như kết quả bình thường",
      "Không bao giờ trả `null` từ method trả `Optional`; `Optional.of(null)` ném `NullPointerException`, dùng `ofNullable` khi giá trị có thể null",
      "`Optional` chủ yếu dùng làm **kiểu trả về**: không làm key, value, phần tử collection, và hiếm khi làm field",
      "`Optional` có chi phí (cấp phát, gián tiếp) — với method mà hiệu năng then chốt, trả `null` hoặc ném exception có thể tốt hơn, nhưng chỉ khi đã đo",
      "Cần mang lý do thất bại chi tiết và người gọi khôi phục được thì checked exception có accessor, vì `Optional` rỗng không mang thông tin",
    ],
    model: "Tôi không chọn một cách cho cả bốn; mỗi method có một câu trả lời, và tôi dựa vào câu hỏi: \"không có kết quả\" ở đây là một kết quả bình thường hay một tình huống ngoại lệ, và client có cần xử lý riêng không. `ordersOf(customerId)` dễ nhất: khách chưa có đơn là chuyện bình thường, và kiểu trả về là collection, nên tôi trả list rỗng. Không trả `null`, vì nó buộc mọi chỗ gọi viết `if (orders != null && …)`, và một chỗ quên kiểm tra có thể nằm im nhiều năm vì phần lớn khách có đơn. Cũng không trả `Optional<List<Order>>` — sách nói rõ không bọc container trong `Optional`, list rỗng đã nói đủ. Lo cấp phát thì có `Collections.emptyList()`, nhưng tôi chỉ tối ưu khi đo thấy cần. `findByEmail(email)`: email chưa đăng ký là kết quả bình thường, nhưng client gần như luôn phải xử lý riêng — hiện form đăng ký, hay trả 404. Đây đúng là chỗ của `Optional<Customer>`. Nó có tinh thần giống checked exception là buộc client nghĩ tới trường hợp vắng mặt, nhưng không cần khối `try`, và client tự chọn cách xử lý: `orElseThrow(CustomerNotFoundException::new)` — truyền factory để không tạo exception khi không cần — hay `map(Customer::name).orElse(\"khách\")`. Bên trong method, tôi không bao giờ trả `null` từ một method khai báo `Optional`, và dùng `Optional.ofNullable` nếu nguồn dữ liệu có thể trả null, vì `Optional.of(null)` tự ném `NullPointerException`. `bestDiscountPercent(cart)`: cùng lập luận, nhưng giá trị là `int`, nên tôi trả `OptionalInt`, không phải `Optional<Integer>` — optional của boxed primitive có hai tầng boxing, tốn kém không đáng. Tôi cũng cân nhắc trả `0` như giá trị \"không giảm\", và nếu nghiệp vụ nói không có ưu đãi đúng nghĩa là giảm 0% thì đó là câu trả lời đơn giản nhất; `OptionalInt` chỉ đáng khi \"không có ưu đãi\" và \"ưu đãi 0%\" phải phân biệt được. `byId(customerId)`: id do chính hệ thống cấp, nên không tìm thấy nghĩa là có lỗi — lỗi dữ liệu hoặc lỗi lập trình ở phía gọi. Trả `Optional` ở đây là đẩy việc xử lý một chuyện không nên xảy ra ra mọi chỗ gọi. Tôi ném một unchecked exception với detail message chứa id, để lỗi lộ ngay chứ không bị nuốt. Nếu có trường hợp thật sự khôi phục được và cần biết lý do — chẳng hạn khách đã bị xoá và người gọi cần biết thời điểm xoá — thì đó là lúc checked exception có accessor hợp lý hơn `Optional`, vì optional rỗng không mang thông tin gì. Hai điều tôi đưa vào hướng dẫn của đội: `Optional` là kiểu trả về, không dùng làm key, value hay phần tử collection, và hiếm khi làm field; và `Optional` có chi phí cấp phát, nên với method nóng thực sự thì trả `null` hoặc ném exception có thể tốt hơn — nhưng quyết định đó phải dựa trên số đo, không dựa trên cảm giác.",
    redFlags: [
      "Trả `null` thay cho list rỗng \"cho đỡ tốn bộ nhớ\"",
      "Trả `Optional<List<Order>>`",
      "Dùng `Optional<Integer>` cho giá trị số",
      "Trả `null` từ một method khai báo `Optional`",
      "Dùng exception để báo một kết quả bình thường như email chưa đăng ký",
    ],
    probes: [
      "Có khi nào lưu `Optional` làm instance field là hợp lý không?",
      "Viết lại `parent.isPresent() ? String.valueOf(parent.get().pid()) : \"N/A\"` cho đúng idiom.",
      "Bạn có một `Stream<Optional<T>>` và cần `Stream<T>` các giá trị có mặt — viết thế nào trên Java 9?",
    ],
    refs: ["ej-08", "ej-10"],
  },
  {
    id: "ej-iq20",
    field: "effective-java",
    topic: "ej-api",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `// LedgerService — số dư tính bằng USD; feePolicy đọc từ cấu hình
public double closingBalance(double opening, List<Transfer> transfers) {
    double balance = opening;
    for (Transfer t : transfers) {
        double fee = isInternal(t) ? 0.0 : feePolicy.feeFor(t.amount());
        balance += t.signedAmount() - fee;
    }
    return Math.round(balance * 100) / 100.0;                    // "làm tròn cho chắc"
}

// fromBranch(), toBranch() trả Integer — map từ cột BRANCH_ID
private boolean isInternal(Transfer t) {
    return t.fromBranch() == t.toBranch();
}`,
    },
    incident: {
      symptom: "Ví điện tử đa tiền tệ đối soát số dư USD với ngân hàng đối tác mỗi đêm. Từ vài tuần nay, mỗi đêm có vài trăm tài khoản lệch 0,01–0,03 USD so với sổ của ngân hàng. Cùng thời gian, bộ phận CSKH nhận khiếu nại từ khách ở ba chi nhánh mới mở — mã chi nhánh 128, 131 và 140 — rằng chuyển khoản nội bộ trong cùng chi nhánh bị thu phí; khách ở các chi nhánh cũ (mã từ 1 đến 97) không gặp. Code của `LedgerService` không đổi trong nhiều tháng; thay đổi gần nhất nằm ở cấu hình: sáu tuần trước, phí chuyển khoản khác chi nhánh đổi từ 0,50 USD cố định sang 0,1% giá trị giao dịch, cùng đợt mở ba chi nhánh mới.",
      scale: "Khoảng 1,2 triệu giao dịch USD mỗi ngày trên 400.000 tài khoản. Tổng lệch đối soát vài chục USD mỗi đêm. Khoảng 18.000 giao dịch nội bộ ở ba chi nhánh mới đã bị thu phí trong sáu tuần.",
      constraints: "Hợp đồng với ngân hàng quy định làm tròn phí **từng giao dịch** đến cent theo quy tắc half-up. Cột trong DB là `DECIMAL(19,4)`, không được đổi schema trong tuần này. Phải hoàn phí cho khách bị thu sai và giải trình với kiểm toán nội bộ trong 5 ngày làm việc.",
    },
    question: "Bạn được giao xử lý. Giải thích nguyên nhân của từng triệu chứng, vì sao nó chỉ lộ ra bây giờ và chỉ ở những chi nhánh đó, bạn sửa code thế nào, và xử lý hậu quả ra sao.",
    mustCover: [
      "`double` là dấu phẩy động nhị phân, **không biểu diễn chính xác 0,1** hay bất kỳ luỹ thừa âm nào của 10 — mọi phép tính tiền đều mang sai số, và một khoản đúng nửa cent có thể thành hơi nhỏ hơn nửa cent rồi bị làm tròn sai chiều; `Math.round` ở cuối vẫn trả `double` và không sửa được",
      "Nguồn chính của vài cent là **quy tắc làm tròn**: từ khi phí thành 0,1%, mỗi phí có phần lẻ dưới cent; code cộng dồn phần lẻ rồi làm tròn tổng, còn hợp đồng làm tròn **từng phí** — sai về nghiệp vụ dù có dùng kiểu chính xác. Phí cố định 0,50 USD trước đây không có phần lẻ nên lỗi nằm im",
      "Tiền phải dùng `BigDecimal` (tạo từ `String`/giá trị DB, không từ `double`) hoặc `long` theo cent; `BigDecimal` cho chọn **chế độ làm tròn** — `setScale(2, RoundingMode.HALF_UP)` cho từng phí",
      "`==` trên hai `Integer` là **so sánh định danh**, gần như luôn sai",
      "Vì sao chỉ chi nhánh mới: autoboxing dùng `Integer.valueOf`, vốn **cache các giá trị −128…127**, nên mã nhỏ trùng instance và `==` tình cờ đúng; mã ≥ 128 là hai object khác nhau",
      "Sửa: so sánh bằng `equals`/`Objects.equals` hoặc unbox sang `int`, tốt hơn là đổi kiểu thành `int`; cẩn thận **unboxing `null` ném `NullPointerException`**",
      "Xác nhận: tính lại số dư một tài khoản lệch bằng `BigDecimal` và khớp với ngân hàng; truy vấn các giao dịch nội bộ bị thu phí theo mã chi nhánh",
      "Xử lý hậu quả: chạy lại đối soát giai đoạn bị ảnh hưởng bằng code đã sửa, hoàn đúng từng khoản phí thu sai, gửi kiểm toán danh sách cụ thể",
      "Ngăn tái diễn: test với giá trị biên (mã chi nhánh 128, số tiền như 0,10 cộng dồn), rà code tìm `double` cho tiền và `==` trên boxed primitive",
    ],
    model: "Có hai lỗi độc lập ở đây, và cả hai là những thứ sách nêu đích danh; tôi xử lý tách bạch. Lỗi thứ nhất là lệch vài cent. `closingBalance` tính tiền bằng `double`. `double` là số học dấu phẩy động nhị phân: nó không biểu diễn chính xác được 0,1 hay bất kỳ luỹ thừa âm nào của 10, nên `1.03 - 0.42` ra `0.6100000000000001`. Tôi nói thẳng một điều để không chẩn đoán sai: với các khoản tiền hai chữ số thập phân, sai số của từng phép cộng `double` rất nhỏ, tự nó hiếm khi đẩy tổng lệch nguyên một cent. Nguồn chính của vài cent nằm ở thay đổi cấu hình sáu tuần trước. Khi phí là 0,50 USD cố định, mỗi phí là một số tròn cent, lại còn biểu diễn chính xác trong nhị phân, nên lỗi nằm im. Từ khi phí thành 0,1% giá trị, mỗi phí có phần lẻ dưới cent — 0,1% của 12,34 USD là 0,01234. Hợp đồng yêu cầu làm tròn từng phí đến cent theo half-up, còn code cộng dồn các phần lẻ đó rồi làm tròn tổng một lần ở cuối; hai cách làm tròn lệch nhau vài cent là tất yếu. Và ở đây `double` làm hỏng thêm: ngay cả khi làm tròn đúng từng phí, một phí rơi đúng nửa cent có thể được biểu diễn thành hơi nhỏ hơn nửa cent và bị làm tròn sai chiều; còn dòng `Math.round(balance * 100) / 100.0` thì làm tròn một kết quả đã sai và trả lại một `double` vốn không biểu diễn chính xác số cent. Sửa: mọi số tiền dùng `BigDecimal`, đọc thẳng từ cột `DECIMAL(19,4)` bằng `getBigDecimal`, không bao giờ đi qua `double` và không dùng `new BigDecimal(double)`; `feePolicy` trả `BigDecimal` — với biểu phí hiện tại là `amount.multiply(new BigDecimal(\"0.001\"))` — và mỗi phí được `setScale(2, RoundingMode.HALF_UP)` ngay tại giao dịch đó, đúng như hợp đồng; cộng dồn bằng `add`. Nếu đoạn này nóng về hiệu năng thì phương án khác là `long` tính theo đơn vị nhỏ nhất, nhưng khi đó tôi tự chịu trách nhiệm về vị trí dấu thập phân và làm tròn — với tiền và quy tắc làm tròn có trong hợp đồng, tôi chọn `BigDecimal` vì nó cho chọn chế độ làm tròn tường minh. Lỗi thứ hai là thu phí chuyển khoản nội bộ. `fromBranch()` và `toBranch()` trả `Integer`, và `==` trên hai `Integer` là so sánh định danh chứ không so giá trị — sách nói áp dụng `==` lên boxed primitive hầu như luôn sai. Vì sao nhiều tháng không ai thấy, và vì sao chỉ ba chi nhánh mới? Autoboxing đi qua `Integer.valueOf`, và `Integer.valueOf` bắt buộc cache các giá trị từ −128 đến 127. Với mã chi nhánh 1 đến 97, hai lần box cùng một giá trị trả về cùng một object, nên `==` tình cờ đúng. Mã 128, 131, 140 nằm ngoài cache, mỗi lần box là một object mới, nên `==` trả `false`, giao dịch bị coi là khác chi nhánh và bị thu phí 0,1%. Sửa: đổi hai accessor sang `int` nếu cột là `NOT NULL`; nếu cột cho phép null thì `Objects.equals(t.fromBranch(), t.toBranch())` — và tôi không viết `t.fromBranch().intValue() == …` một cách tuỳ tiện, vì unboxing một `null` sẽ ném `NullPointerException`. Để xác nhận trước khi sửa: tôi lấy một tài khoản lệch, tính lại số dư ngày đó bằng `BigDecimal` với phí làm tròn từng giao dịch, và đối chiếu với sổ ngân hàng — phải khớp tới cent. Với lỗi phí, tôi truy vấn mọi giao dịch có `from_branch = to_branch` mà có phí khác 0; kết quả phải tập trung đúng ở mã ≥ 128. Xử lý hậu quả: chạy lại đối soát cho toàn bộ giai đoạn bị ảnh hưởng bằng code đã sửa, điều chỉnh số dư lệch theo sổ ngân hàng; hoàn đúng từng khoản phí cho khoảng 18.000 giao dịch; gửi kiểm toán danh sách chi tiết cùng giải thích nguyên nhân gốc. Ngăn tái diễn: test đơn vị với mã chi nhánh 128 và với các khoản tiền như 0,10 cộng dồn nhiều lần; rà toàn bộ codebase tìm `double`/`float` dùng cho tiền và `==` trên `Integer`, `Long` — các công cụ phân tích tĩnh bắt được mẫu thứ hai.",
    redFlags: [
      "Sửa lệch cent bằng cách làm tròn nhiều hơn hoặc đổi sang `float`",
      "Tạo `BigDecimal` bằng constructor nhận `double`",
      "Đổi `==` thành `.intValue() ==` mà không xét trường hợp `null`",
      "Không giải thích được vì sao lỗi phí chỉ xảy ra ở mã chi nhánh từ 128",
      "Bỏ qua quy tắc làm tròn từng giao dịch trong hợp đồng",
      "Sửa code mà không hoàn phí và không chạy lại đối soát",
    ],
    probes: [
      "`Long sum = 0L; for (long i …) sum += i;` có vấn đề gì?",
      "Khi nào `int` đủ, khi nào cần `long`, khi nào bắt buộc `BigDecimal` cho số tiền?",
      "Một comparator viết `(i, j) -> i < j ? -1 : (i == j ? 0 : 1)` trên `Integer` sai ở đâu?",
    ],
    refs: ["ej-09"],
  },

  // ===== ej-conc (ej-iq21–ej-iq24) =====
  {
    id: "ej-iq21",
    field: "effective-java",
    topic: "ej-conc",
    level: 1,
    minutes: 5,
    question: "Một đồng nghiệp nói: \"Ghi một field `boolean` là thao tác nguyên tử, nên cờ báo dừng giữa hai thread không cần `synchronized`; nếu cẩn thận thì chỉ cần `synchronized` ở setter.\" Bạn phản biện thế nào? Sau đó giải thích `volatile` cho ta những gì và không cho những gì.",
    mustCover: [
      "`synchronized` có **hai** tác dụng: loại trừ lẫn nhau **và giao tiếp** — thread vào khối synchronized thấy mọi thay đổi trước đó được bảo vệ bởi cùng lock",
      "Đọc/ghi biến (trừ `long`, `double`) là nguyên tử, nhưng **nguyên tử không có nghĩa là hữu hình**: không có gì bảo đảm giá trị một thread ghi sẽ được thread khác thấy — do mô hình bộ nhớ",
      "Ví dụ `StopThread`: không đồng bộ, VM được phép **hoisting** vòng lặp thành `if (!stopRequested) while (true)`, thread nền chạy mãi — **liveness failure**",
      "Phải đồng bộ **cả đọc lẫn ghi**; chỉ đồng bộ setter có thể trông như chạy trên vài máy nhưng không được bảo đảm",
      "`volatile` bảo đảm thread đọc thấy **giá trị được ghi gần nhất**, nhưng **không loại trừ lẫn nhau**",
      "`volatile` không làm `++` thành nguyên tử (đọc rồi ghi): `nextSerialNumber++` có thể trả số trùng — **safety failure**; dùng `synchronized` hoặc `AtomicLong.getAndIncrement`",
      "Tốt nhất là không chia sẻ dữ liệu khả biến: dùng dữ liệu immutable hoặc giới hạn nó trong một thread; object effectively immutable chỉ cần **safe publication**",
    ],
    model: "Tôi phản biện ở cả hai vế. Vế thứ nhất lẫn lộn hai tác dụng của đồng bộ hoá. Người ta hay nghĩ `synchronized` chỉ là loại trừ lẫn nhau — không để một thread thấy object ở trạng thái dở dang. Nhưng đó mới là một nửa. Nửa còn lại là giao tiếp: thread đi vào một khối synchronized được bảo đảm thấy tác động của mọi thay đổi trước đó được bảo vệ bởi cùng lock. Đúng là đặc tả ngôn ngữ bảo đảm đọc hay ghi một biến không phải `long` hay `double` là nguyên tử — tôi không bao giờ đọc ra một giá trị nửa cũ nửa mới. Nhưng nó không bảo đảm giá trị một thread ghi sẽ được thread khác nhìn thấy, bao giờ, hay có thấy không. Đó là chuyện của mô hình bộ nhớ. Ví dụ kinh điển là `StopThread`: thread nền lặp `while (!stopRequested) i++;`, thread chính ngủ một giây rồi đặt `stopRequested = true`. Không có đồng bộ, VM hoàn toàn được phép biến vòng lặp thành `if (!stopRequested) while (true) i++;` — gọi là hoisting, và OpenJDK Server VM làm đúng như vậy — nên chương trình không bao giờ dừng. Đó là liveness failure. Vế thứ hai — chỉ đồng bộ setter — cũng sai: đồng bộ hoá không được bảo đảm hoạt động trừ khi cả đọc lẫn ghi đều được đồng bộ. Chương trình chỉ đồng bộ một phía có thể trông như chạy đúng trên máy này, rồi hỏng trên máy khác hay VM khác, và loại lỗi phụ thuộc thời điểm này thuộc hàng khó gỡ nhất. Với cờ dừng, tôi có hai cách đúng: đồng bộ cả `requestStop()` lẫn `stopRequested()`, hoặc gọn hơn là khai báo field `volatile`. `volatile` cho tôi đúng tác dụng giao tiếp: mọi thread đọc field sẽ thấy giá trị được ghi gần nhất. Nhưng nó không cho loại trừ lẫn nhau, và đó là cái bẫy. Ví dụ sách: `private static volatile int nextSerialNumber` với `return nextSerialNumber++;`. Toán tử `++` không nguyên tử — nó đọc rồi ghi — nên hai thread có thể đọc cùng một giá trị và trả cùng một số sê-ri. Chương trình tính ra kết quả sai, một safety failure, dù field đã `volatile`. Sửa bằng `synchronized` trên method và bỏ `volatile` đi, hoặc tốt hơn là `AtomicLong` với `getAndIncrement()`, vốn cho cả giao tiếp lẫn tính nguyên tử mà không cần lock. Tóm lại tôi dùng `volatile` khi chỉ cần giao tiếp một giá trị độc lập giữa các thread, như cờ dừng; cần đọc-sửa-ghi thì cần lock hoặc lớp atomic. Và cách tốt nhất để tránh toàn bộ vấn đề là đừng chia sẻ dữ liệu khả biến: chia sẻ dữ liệu immutable, hoặc giới hạn dữ liệu khả biến trong một thread và ghi chính sách đó vào tài liệu. Một thread cũng có thể dựng xong một object rồi mới chia sẻ — object effectively immutable — miễn là việc chia sẻ tham chiếu là safe publication: qua field `volatile`, `final`, static lúc khởi tạo class, field có khoá, hay một concurrent collection.",
    redFlags: [
      "Cho rằng thao tác nguyên tử thì không cần đồng bộ",
      "Chỉ đồng bộ phía ghi hoặc phía đọc",
      "Coi `volatile` là đủ cho `count++`",
      "Đề xuất `Thread.stop` để dừng thread",
    ],
    probes: [
      "Vì sao đọc/ghi `long` và `double` không được bảo đảm nguyên tử, và `volatile` thay đổi gì ở đó?",
      "Một method sửa một static field có thể được gọi từ nhiều thread — vì sao client không thể tự đồng bộ bên ngoài?",
      "Kể các cách safe publication một object effectively immutable.",
    ],
    refs: ["ej-11"],
  },
  {
    id: "ej-iq22",
    field: "effective-java",
    topic: "ej-conc",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `public class ObservableSet<E> extends ForwardingSet<E> {
    public ObservableSet(Set<E> set) { super(set); }

    private final List<SetObserver<E>> observers = new ArrayList<>();

    public void addObserver(SetObserver<E> observer) {
        synchronized (observers) { observers.add(observer); }
    }

    public boolean removeObserver(SetObserver<E> observer) {
        synchronized (observers) { return observers.remove(observer); }
    }

    private void notifyElementAdded(E element) {
        synchronized (observers) {
            for (SetObserver<E> observer : observers)
                observer.added(this, element);
        }
    }

    @Override public boolean add(E element) {
        boolean added = super.add(element);
        if (added)
            notifyElementAdded(element);
        return added;
    }
}

// @FunctionalInterface public interface SetObserver<E> {
//     void added(ObservableSet<E> set, E element);
// }

// Mỗi client chạy riêng với một set mới, rồi: for (int i = 0; i < 100; i++) set.add(i);

// Client A — in từng số, tự huỷ đăng ký khi gặp 23
set.addObserver(new SetObserver<>() {
    public void added(ObservableSet<Integer> s, Integer e) {
        System.out.println(e);
        if (e == 23)
            s.removeObserver(this);
    }
});

// Client B — cùng ý đồ, nhưng nhờ một thread khác huỷ đăng ký
set.addObserver(new SetObserver<>() {
    public void added(ObservableSet<Integer> s, Integer e) {
        System.out.println(e);
        if (e == 23) {
            ExecutorService exec = Executors.newSingleThreadExecutor();
            try {
                exec.submit(() -> s.removeObserver(this)).get();
            } catch (ExecutionException | InterruptedException ex) {
                throw new AssertionError(ex);
            } finally {
                exec.shutdown();
            }
        }
    }
});`,
    },
    question: "Người viết mong cả hai client in từ 0 đến 23 rồi lặng lẽ kết thúc. Thực tế mỗi client gặp một chuyện khác. Dự đoán chuyện gì xảy ra với từng client, chỉ ra lỗi thiết kế chung trong `ObservableSet`, và sửa nó.",
    mustCover: [
      "Lỗi chung: gọi **alien method** (`observer.added`, do client cung cấp) **bên trong vùng synchronized**",
      "Client A: in 0–23 rồi ném **`ConcurrentModificationException`** — `removeObserver` sửa list `observers` ngay khi `notifyElementAdded` đang duyệt nó; lock của Java **reentrant** nên chính thread đó vào lại được, khối synchronized không ngăn được",
      "Client B: **deadlock** — thread nền chờ lock `observers` mà thread chính đang giữ, còn thread chính chờ thread nền qua `get()`",
      "Reentrant lock có thể **biến liveness failure thành safety failure**: gọi alien method khi bất biến đang tạm hỏng thì lock không bảo vệ được gì",
      "Sửa 1 — **open call**: trong khối synchronized chỉ chụp snapshot `new ArrayList<>(observers)`, rồi duyệt snapshot bên ngoài lock",
      "Sửa 2 — `CopyOnWriteArrayList`: không cần đồng bộ tường minh; hợp vì danh sách observer ít khi sửa mà duyệt thường xuyên (nói chung hiệu năng tệ nếu sửa nhiều)",
      "Nguyên tắc: làm **càng ít việc càng tốt** trong vùng synchronized; open call còn tăng mức đồng thời vì alien method có thể chạy lâu tuỳ ý",
    ],
    model: "Client A in 0 đến 23 rồi ném `ConcurrentModificationException`. Khi phần tử 23 được thêm, `notifyElementAdded` đang duyệt list `observers` và gọi `added` của observer; observer gọi `s.removeObserver(this)`, method này lại khoá `observers` và xoá phần tử khỏi chính list đang được duyệt. Khối synchronized không ngăn được chuyện này, vì lock của Java là reentrant: thread đang giữ lock xin lại chính lock đó thì được ngay. Khối synchronized chặn thread khác sửa list, nhưng không chặn chính thread đang duyệt gọi ngược vào set. Client B không có exception — nó treo. Observer nhờ một executor chạy `removeObserver` trên thread nền và chờ bằng `get()`. Thread nền cố khoá `observers` nhưng thread chính đang giữ lock đó trong `notifyElementAdded`; thread chính thì đang chờ thread nền xong. Mỗi bên chờ bên kia — deadlock. Ví dụ này giả tạo, nhưng mẫu hình thì có thật và đã gây deadlock trong các hệ thống thực như bộ công cụ GUI. Lỗi thiết kế chung là `ObservableSet` gọi một alien method — method do client cung cấp, mà class không biết nó làm gì và không kiểm soát được — từ bên trong vùng synchronized. Ở hai ví dụ trên ta còn may: list `observers` đang ở trạng thái nhất quán khi `added` được gọi. Nếu gọi alien method trong lúc bất biến mà lock bảo vệ đang tạm hỏng, tính reentrant sẽ cho lời gọi đi qua và chạm vào dữ liệu dở dang — liveness failure biến thành safety failure, và lock coi như không làm nhiệm vụ. Sửa thứ nhất là open call: chuyển lời gọi alien method ra ngoài lock. Trong `notifyElementAdded`, tôi chỉ giữ lock đủ lâu để chụp một snapshot — `List<SetObserver<E>> snapshot; synchronized (observers) { snapshot = new ArrayList<>(observers); }` — rồi duyệt snapshot mà không giữ lock. Client A giờ xoá khỏi list gốc chứ không phải thứ đang được duyệt, client B lấy được lock vì không ai giữ. Sửa thứ hai, gọn hơn: đổi `observers` thành `CopyOnWriteArrayList`. Mọi thao tác sửa tạo bản sao mới của mảng bên dưới, nên việc duyệt không cần khoá và không bao giờ thấy thay đổi giữa chừng; `addObserver`, `removeObserver`, `notifyElementAdded` bỏ hết `synchronized`. Nói chung `CopyOnWriteArrayList` có hiệu năng tệ, nhưng danh sách observer là trường hợp lý tưởng của nó: hiếm khi sửa, duyệt liên tục. Ngoài tính đúng đắn, open call còn tăng mức đồng thời: alien method có thể chạy lâu tuỳ ý, và nếu nó chạy trong lock thì mọi thread khác cần `observers` phải chờ vô ích. Nguyên tắc tôi mang theo: trong vùng synchronized làm càng ít càng tốt — lấy lock, đọc hoặc sửa dữ liệu chia sẻ, nhả lock — và không bao giờ gọi method có thể override hay function object của client trong đó. Một chi tiết bên lề: các observer ở đây phải là anonymous class, vì lambda không tham chiếu được chính nó để truyền cho `removeObserver`.",
    redFlags: [
      "Dự đoán client A in đến 99 hoặc dừng êm ở 23",
      "Không giải thích được vì sao lock không ngăn được client A",
      "Sửa bằng cách đồng bộ rộng hơn, ví dụ đánh `synchronized` lên cả `add`",
      "Dùng `CopyOnWriteArrayList` cho mọi list chia sẻ, kể cả list sửa liên tục",
    ],
    probes: [
      "Nếu `SetObserver` được thay bằng `BiConsumer<ObservableSet<E>, E>` thì có mất gì không?",
      "Khi viết một class khả biến, bạn quyết định đồng bộ bên trong hay để client đồng bộ bên ngoài dựa trên tiêu chí nào?",
      "Vì sao `StringBuffer` bị thay bằng `StringBuilder`?",
    ],
    refs: ["ej-11"],
  },
  {
    id: "ej-iq23",
    field: "effective-java",
    topic: "ej-conc",
    level: 3,
    minutes: 10,
    question: "Service định giá có hai thứ đắt để dựng: một bảng quy tắc thuế dùng chung toàn process — nạp từ file 40 MB, chỉ khoảng 5% request cần — và, trong mỗi object `Tenant`, một bộ template báo cáo biên dịch sẵn mà chỉ khoảng 10% tenant dùng tới. Cả hai đều bị nhiều thread truy cập. Một đồng nghiệp đề xuất chuyển mọi field trong service sang lazy initialization để khởi động nhanh hơn. Bạn chọn cách khởi tạo nào cho từng trường hợp, và phản hồi đề xuất kia ra sao?",
    tradeoffs: [
      {
        option: "Khởi tạo thông thường (`private final` hoặc `static final`)",
        when: "Mặc định cho hầu hết field: đơn giản, thread-safe nhờ `final` hay khởi tạo class, không tốn gì mỗi lần truy cập. Chọn khi field gần như luôn được dùng hoặc không đắt.",
      },
      {
        option: "Lazy với synchronized accessor",
        when: "Đơn giản và rõ ràng nhất trong các cách lazy; hợp để phá một vòng phụ thuộc khởi tạo. Cái giá là mỗi lần đọc đều lấy lock, nên không hợp với field nóng.",
      },
      {
        option: "Lazy initialization holder class (static field)",
        when: "Cho static field cần lazy vì hiệu năng: đặt field trong một static nested class, JVM chỉ khởi tạo class đó khi được dùng lần đầu. Accessor không synchronized, chỉ một lần đọc field — gần như không thêm chi phí.",
      },
      {
        option: "Double-check idiom (instance field)",
        when: "Cho instance field cần lazy vì hiệu năng: kiểm một lần không khoá, lần hai trong `synchronized`. Field **bắt buộc** `volatile`; dùng biến cục bộ để chỉ đọc field một lần. Nếu chấp nhận được việc khởi tạo lặp thì có single-check (bỏ lần kiểm thứ hai).",
      },
    ],
    mustCover: [
      "Mặc định là **khởi tạo thông thường**; lazy initialization là tối ưu hoá — \"đừng làm trừ khi cần\" — nó giảm chi phí khởi tạo nhưng **tăng chi phí mỗi lần truy cập**, có thể làm chậm đi",
      "Lazy chỉ đáng khi field **được dùng ở một phần nhỏ** các instance **và** khởi tạo tốn kém — và phải đo có/không có",
      "Nhiều thread chia sẻ field lazy thì **bắt buộc có đồng bộ hoá**",
      "Bảng thuế (static): **holder class** — `private static class TaxRulesHolder { static final TaxRules RULES = load(); }`; dựa trên bảo đảm class chỉ khởi tạo khi dùng lần đầu",
      "Template của `Tenant` (instance): **double-check** với field `volatile`, kiểm lần hai bên trong `synchronized`, biến cục bộ `result`",
      "Không dùng double-check cho static field — holder class tốt hơn",
      "Synchronized accessor là lựa chọn khi dùng lazy để **phá vòng phụ thuộc khởi tạo**",
      "Single-check khi chấp nhận khởi tạo lặp; racy single-check (bỏ cả `volatile`) chỉ cho kiểu nguyên thủy khác `long`/`double` và hiếm khi đáng",
    ],
    model: "Tôi bắt đầu từ phản hồi cho đề xuất, vì nó quyết định khung suy nghĩ: lời khuyên tốt nhất cho lazy initialization là đừng làm trừ khi cần. Lazy là con dao hai lưỡi — nó giảm chi phí khởi tạo class hay tạo instance, nhưng tăng chi phí mỗi lần truy cập field, và khi có nhiều thread thì bắt buộc kèm đồng bộ hoá. Chuyển mọi field sang lazy có thể làm service chậm đi chứ không nhanh lên, và chắc chắn làm code phức tạp hơn. Lazy chỉ đáng khi hai điều cùng đúng: field chỉ được dùng ở một phần nhỏ các instance, và khởi tạo nó tốn kém. Cách duy nhất để biết chắc là đo có và không có lazy. Nên câu trả lời của tôi cho đồng nghiệp là: mặc định giữ khởi tạo thông thường — `private final FieldType field = computeFieldValue();` — và chỉ xét lazy cho những field thoả cả hai điều kiện, có số đo đi kèm. Hai trường hợp trong đề đều có vẻ thoả, nên tôi xét từng cái. Bảng quy tắc thuế là static field dùng chung, nạp từ file 40 MB, 5% request cần. Tôi dùng lazy initialization holder class: đặt field trong một static nested class `TaxRulesHolder { static final TaxRules RULES = TaxRules.load(path); }`, và accessor chỉ là `return TaxRulesHolder.RULES;`. Idiom này dựa vào bảo đảm của JLS rằng một class không được khởi tạo cho tới khi được dùng: lần đầu gọi accessor, JVM khởi tạo `TaxRulesHolder` và đồng bộ việc đó giúp tôi; sau đó mọi lần truy cập là một lần đọc field thường, không lock, không kiểm tra — gần như không thêm chi phí. Tôi không dùng double-check cho static field, vì holder class làm việc đó tốt hơn. Bộ template trong mỗi `Tenant` là instance field, 10% tenant dùng. Holder class không áp dụng được cho instance field, nên tôi dùng double-check idiom: field khai báo `private volatile ReportTemplates templates;`, accessor đọc field vào biến cục bộ `result`; nếu khác `null` thì trả ngay — lần kiểm không khoá; nếu `null` thì vào `synchronized (this)`, kiểm lại `templates == null` rồi mới biên dịch và gán. `volatile` là bắt buộc: không có nó, sau lần kiểm không khoá một thread có thể thấy tham chiếu tới object chưa khởi tạo xong. Biến cục bộ không bắt buộc nhưng giúp field chỉ bị đọc một lần trong trường hợp phổ biến — sách đo được nhanh hơn khoảng 1,4 lần. Nếu việc biên dịch template là idempotent và chịu được chạy lặp vài lần lúc tranh chấp, tôi có thể dùng single-check — bỏ lần kiểm thứ hai, vẫn giữ `volatile`; còn racy single-check, bỏ cả `volatile`, chỉ áp dụng cho kiểu nguyên thủy khác `long` và `double`, nên không dùng ở đây. Còn một trường hợp tôi sẽ dùng synchronized accessor: nếu có field nào phải lazy để phá một vòng phụ thuộc khởi tạo giữa các class — lúc đó sự đơn giản và rõ ràng quan trọng hơn chi phí lock. Cuối cùng, trước khi merge tôi muốn thấy số đo thời gian khởi động và độ trễ request với và không có hai thay đổi này, vì tôi đang đổi chi phí khởi động lấy chi phí ở request đầu tiên cần tới chúng.",
    redFlags: [
      "Đồng ý lazy hoá mọi field vì \"lazy luôn nhanh hơn\"",
      "Viết double-check mà quên `volatile`",
      "Dùng double-check cho static field thay vì holder class",
      "Lazy init không đồng bộ cho field chia sẻ giữa các thread",
    ],
    probes: [
      "Vì sao biến cục bộ `result` trong double-check giúp nhanh hơn?",
      "Áp double-check cho một field `long` kiểu số thì so sánh với gì thay vì `null`?",
      "Holder class có thread-safe không nếu `load()` ném exception lúc khởi tạo class — chuyện gì xảy ra với lần gọi sau?",
    ],
    refs: ["ej-11"],
  },
  {
    id: "ej-iq24",
    field: "effective-java",
    topic: "ej-conc",
    level: 4,
    minutes: 15,
    code: {
      lang: "java",
      text: `// cart-service — endpoint nội bộ cho hệ thống POS cũ của đối tác đẩy giỏ hàng
@PostMapping("/internal/cart-import")
public ResponseEntity<Void> importCart(InputStream body) throws Exception {
    try (ObjectInputStream in = new ObjectInputStream(body)) {
        Cart cart = (Cart) in.readObject();
        cartService.save(cart);
    }
    return ResponseEntity.accepted().build();
}

// Bản vá đội đề xuất
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
        "!org.apache.commons.collections.functors.*;!org.codehaus.groovy.runtime.*");
in.setObjectInputFilter(filter);`,
    },
    incident: {
      symptom: "Sáng thứ Hai, 6 pod của `cart-service` đứng ở 100% CPU. Thread dump cho thấy hàng chục thread xử lý `/internal/cart-import` kẹt sâu trong `HashSet.readObject` → `HashMap.hash` → `AbstractSet.hashCode`, gọi đệ quy lặp lại; request gây ra chỉ nặng khoảng 6 KB. Log WAF ghi nhận nhiều payload chứa chuỗi `org.apache.commons.collections.functors.InvokerTransformer`. Trên một pod có một tiến trình `curl` lạ chạy dưới user của JVM. Kiểm tra cấu hình thì phát hiện endpoint \"nội bộ\" này bị lộ ra ingress công khai từ hai tuần trước.",
      scale: "20 pod. Đối tác gửi khoảng 300 request/phút vào endpoint. Trong 2 giờ có khoảng 4.000 request lạ từ khoảng 50 địa chỉ IP bên ngoài.",
      constraints: "Đối tác cần khoảng 6 tuần để chuyển POS sang gửi JSON, và không chấp nhận gián đoạn tích hợp quá một ngày. Đội đề xuất vá ngay bằng filter blacklist như trong code, kèm nâng cấp commons-collections, rồi coi như xong.",
    },
    question: "Bạn là người phụ trách xử lý sự cố. Giải thích hai triệu chứng, đánh giá bản vá đội đề xuất, và trình bày kế hoạch trong vài giờ tới lẫn trong 6 tuần tới.",
    mustCover: [
      "`readObject` là một **constructor \"ma thuật\"**: dựng được object của hầu như mọi kiểu `Serializable` trên class path và chạy code của chúng — phép ép sang `Cart` chỉ diễn ra **sau** khi mọi thứ đã chạy xong",
      "**Attack surface** là mọi class serializable trên class path — JDK, thư viện bên thứ ba, chính ứng dụng; ứng dụng bị tổn thương dù không làm gì sai",
      "Payload chứa `InvokerTransformer`: **gadget chain** nhắm tới thực thi mã từ xa; tiến trình `curl` lạ nghĩa là phải coi như **pod đã bị chiếm**",
      "CPU 100% với request 6 KB: **deserialization bomb** — các `HashSet` lồng nhau khiến `hashCode` bị gọi theo cấp số nhân; không cần gadget nào, chỉ dùng class của JDK",
      "Blacklist **chỉ chặn mối đe doạ đã biết**; phải ưu tiên **whitelist** — chỉ nhận đúng các class của `Cart` và kiểu dữ liệu cần thiết, kèm giới hạn độ sâu, số tham chiếu, số byte",
      "Filter **không bảo đảm chặn mọi tấn công**, kể cả bomb dựng từ class JDK hợp lệ — nó chỉ giảm rủi ro",
      "Ngay lập tức: **rút endpoint khỏi ingress công khai**, chỉ nhận từ đối tác qua kênh xác thực; cô lập và thay mới pod nghi bị chiếm, xoay vòng credential, điều tra như sự cố bảo mật",
      "Đích đến: **không deserialize dữ liệu không đáng tin**; hệ thống không nên dùng Java serialization — chuyển sang JSON hoặc protobuf",
    ],
    model: "Đây trước hết là sự cố bảo mật, không phải sự cố hiệu năng, và tôi xử lý theo thứ tự đó. Hai triệu chứng có chung một gốc: endpoint gọi `readObject` trên một luồng byte do bên ngoài gửi tới. `readObject` về bản chất là một constructor ma thuật: nó dựng được object của hầu như bất kỳ kiểu nào có trên class path, miễn là kiểu đó implement `Serializable`, và trong lúc dựng nó chạy code của các kiểu đó. Phép ép `(Cart)` chỉ xảy ra sau khi `readObject` đã trả về — tức là sau khi mọi thứ kẻ tấn công muốn chạy đã chạy xong. Vì vậy attack surface của endpoint này không phải là class `Cart`, mà là mọi class serializable trên class path: JDK, các thư viện như commons-collections, và chính ứng dụng. Triệu chứng thứ nhất — payload chứa `InvokerTransformer` — là dấu hiệu của gadget chain: một chuỗi method được gọi trong quá trình deserialize mà ghép lại cho phép thực thi mã tuỳ ý, đúng kiểu đã làm tê liệt hệ thống bán vé của SFMTA Muni năm 2016. Tiến trình `curl` lạ trên một pod nghĩa là tôi phải giả định ít nhất pod đó đã bị chiếm. Triệu chứng thứ hai — CPU 100% với request chỉ 6 KB, thread kẹt trong `HashSet.readObject` và `hashCode` — khớp với một deserialization bomb: sách có ví dụ 201 `HashSet` lồng nhau sâu 100 tầng, luồng chỉ 5.744 byte, nhưng deserialize nó khiến `hashCode` bị gọi hơn 2^100 lần. Không cần gadget nào, chỉ class của JDK, và trình deserialize không có dấu hiệu gì bất thường — ít object, stack hữu hạn. Đánh giá bản vá của đội: nó không đủ. Filter blacklist chỉ chặn những gì đã biết là nguy hiểm, trong khi gadget mới được phát hiện định kỳ; sách nói rõ ưu tiên whitelist hơn blacklist. Và blacklist kia không đụng gì tới bomb, vì bomb chỉ dùng `HashSet` và `String`. Nâng cấp commons-collections là việc nên làm nhưng cũng chỉ bịt một chuỗi đã biết. Kế hoạch vài giờ tới: một, rút ngay endpoint khỏi ingress công khai, chỉ cho phép đối tác đi vào qua kênh có xác thực — việc này chặn cả hai loại tấn công mà không làm gián đoạn đối tác. Hai, xử lý như xâm nhập: cô lập pod có tiến trình lạ để điều tra, thay toàn bộ pod bằng image sạch, xoay vòng mọi credential mà service truy cập được, rà log để xác định phạm vi. Ba, thay blacklist bằng whitelist: filter chỉ nhận `Cart`, các class thành phần của nó và đúng những kiểu JDK nó cần, kèm giới hạn `maxdepth`, `maxrefs`, `maxbytes`. Tôi nói rõ với đội rằng filter giảm rủi ro chứ không bảo đảm: sách cảnh báo nó không được bảo đảm chặn mọi tấn công, và nếu whitelist buộc phải có những collection như `HashSet` thì một bomb được tinh chỉnh để lọt qua giới hạn vẫn có thể gây hại. Vì vậy lớp bảo vệ chính là không để dữ liệu không đáng tin tới được endpoint. Kế hoạch 6 tuần: đích đến là không deserialize bằng Java serialization nữa. Cách tốt nhất để tránh khai thác serialization là không bao giờ deserialize thứ gì, và không có lý do để dùng Java serialization trong hệ thống mới. Tôi làm cùng đối tác một endpoint mới nhận JSON — hoặc protobuf nếu cần schema và hiệu quả — chạy song song, chuyển dần, rồi gỡ endpoint cũ cùng mọi `ObjectInputStream` còn lại. Trong thời gian chờ, nếu `Cart` là class serializable của chính chúng tôi thì `readObject` của nó phải viết phòng thủ — sao chép phòng vệ rồi kiểm bất biến — hoặc dùng serialization proxy. Cuối cùng, tôi đưa vào checklist review: mọi endpoint mang chữ \"nội bộ\" phải được kiểm chứng là không ra được internet, và mọi chỗ dùng `ObjectInputStream` phải được ghi nhận như một rủi ro bảo mật.",
    redFlags: [
      "Chấp nhận filter blacklist cộng nâng cấp thư viện là đủ",
      "Coi CPU 100% là vấn đề hiệu năng và scale thêm pod",
      "Không coi pod có tiến trình lạ là đã bị xâm nhập",
      "Tin rằng ép kiểu sang `Cart` giới hạn được những gì được deserialize",
      "Cho rằng filter whitelist là giải pháp cuối cùng, không cần bỏ Java serialization",
    ],
    probes: [
      "Vì sao một bomb chỉ gồm `HashSet` và `String` lại khiến CPU chạy mãi mà không tốn nhiều bộ nhớ hay stack?",
      "RMI, JMX và JMS liên quan gì tới rủi ro này?",
      "Nếu buộc phải giữ một class serializable, serialization proxy pattern giúp gì so với `readObject` mặc định?",
    ],
    refs: ["ej-12"],
  },
];
