// Lộ trình đọc Effective Java — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Effective Java", ấn bản 3 — Joshua Bloch, Addison-Wesley 2018.
// Thư mục nguồn: sources/effective-java/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ej-w<N> / ej-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 10 tuần / 11 chương: T1 ch2 · T2 ch3 · T3 ch4 · T4 ch5 · T5 ch6 ·
// T6 ch7 · T7 ch8 · T8 ch9 · T9 ch10–11 · T10 ch12 + tổng ôn.

export const ejWeeksPart1 = [
  {
    id: "ej-w1",
    week: "Tuần 1",
    title: "Tạo đối tượng có chủ đích",
    goal: "Chọn được cách tạo đối tượng phù hợp (constructor, static factory, builder, singleton, dependency injection), nhận ra chỗ tạo đối tượng thừa và tham chiếu lỗi thời, và đóng tài nguyên bằng `try`-with-resources thay vì trông vào finalizer hay cleaner.",
    practice: "Chọn một class trên JDK 17+ có constructor từ bốn tham số trở lên, refactor sang builder theo kiểu `NutritionFacts.Builder`, đặt kiểm tra bất biến trong constructor mà `build()` gọi. Sau đó gõ lại `Stack` rò bộ nhớ của Item 7: push rồi pop một đối tượng, giữ nó bằng `WeakReference`, gọi `System.gc()` vài lần (hoặc chụp heap dump bằng `jcmd <pid> GC.heap_dump`) để thấy đối tượng vẫn bị mảng `elements` giữ; thêm `elements[size] = null` trong `pop` và chạy lại để thấy nó được thu hồi.",
    resources: [
      { label: "EJ 02 — Tạo và hủy đối tượng", href: "#/docs/ej-02" },
      { label: "jbloch/effective-java-3e-source-code — chapter 2", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w1-1",
        text: "Static factory method và builder — hai cách thay constructor",
        lesson: `**Mục tiêu.** Viết được một class vừa có static factory \`of(...)\` vừa có builder cho constructor nhiều tham số tuỳ chọn, và nói được mỗi cách thắng constructor ở điểm nào.

**Đọc.** [Item 1 — Cân nhắc dùng static factory method thay vì constructor](#/docs/ej-02) → [Item 2 — Cân nhắc dùng builder khi gặp constructor có nhiều tham số](#/docs/ej-02). Ở Item 1 đọc kỹ năm ưu điểm và hai nhược điểm, nhất là quy ước đặt tên \`from\`, \`of\`, \`valueOf\`, \`getInstance\`. Ở Item 2 gõ lại cả ba phiên bản \`NutritionFacts\`: telescoping constructor, JavaBeans, rồi Builder.

**Bẫy.** Tưởng JavaBeans (constructor rỗng + setter) là đủ tốt. Sách chỉ ra hai lỗi: đối tượng có thể ở trạng thái dở dang giữa các lần gọi setter, và class không thể immutable. Bẫy thứ hai: dùng builder cho class hai tham số — sách nói builder đáng giá từ khoảng bốn tham số trở lên hoặc khi class sẽ còn thêm tham số.

**Tự kiểm tra.** Vì sao \`Boolean.valueOf(boolean)\` không bao giờ tạo đối tượng mới, và điều đó cho phép class làm gì? Trong builder phân cấp của \`Pizza\`, phương thức \`self()\` giải quyết vấn đề gì?`,
      },
      {
        id: "ej-w1-2",
        text: "Singleton, class không khởi tạo được và dependency injection",
        lesson: `**Mục tiêu.** Viết được ba cách cài đặt singleton và giải thích vì sao enum một phần tử thường là cách tốt nhất; nhận ra khi nào singleton hay static utility class là lựa chọn sai và thay bằng dependency injection qua constructor.

**Đọc.** [Item 3 — Đảm bảo tính singleton bằng private constructor hoặc enum type](#/docs/ej-02) → [Item 4 — Đảm bảo tính không thể khởi tạo bằng private constructor](#/docs/ej-02) → [Item 5 — Ưu tiên dependency injection thay vì gắn cứng tài nguyên](#/docs/ej-02). Ở Item 3 đọc kỹ đoạn về serialization: vì sao phải khai báo field \`transient\` và thêm \`readResolve\`, còn enum thì không cần. Ở Item 5 chú ý biến thể truyền factory \`Supplier<? extends Tile>\` vào constructor.

**Bẫy.** Khai báo utility class là \`abstract\` để chặn khởi tạo. Sách nói cách này không hiệu quả: subclass vẫn khởi tạo được, và còn đánh lừa người dùng rằng class được thiết kế để kế thừa — dùng private constructor ném \`AssertionError\`. Bẫy thứ hai: \`SpellChecker\` gắn cứng một \`dictionary\`, rồi "sửa" bằng cách bỏ \`final\` và thêm method đổi từ điển; sách gọi cách này vụng về, dễ lỗi và không chạy được trong môi trường đồng thời.

**Tự kiểm tra.** Một client có đặc quyền phá singleton dạng public field bằng cách nào, và sách đề xuất phòng thủ ra sao? Khi nào bạn không dùng được enum singleton?`,
      },
      {
        id: "ej-w1-3",
        text: "Tránh đối tượng thừa và tham chiếu lỗi thời",
        lesson: `**Mục tiêu.** Nhận ra các nguồn tạo đối tượng thừa hay gặp (\`String.matches\` trong đoạn code nóng, autoboxing ngoài ý muốn, constructor thay cho static factory) và ba nguồn memory leak mà sách nêu: class tự quản lý bộ nhớ, cache, listener và callback.

**Đọc.** [Item 6 — Tránh tạo đối tượng không cần thiết](#/docs/ej-02) → [Item 7 — Loại bỏ các tham chiếu đối tượng lỗi thời](#/docs/ej-02). Ở Item 6 đọc kỹ ví dụ \`isRomanNumeral\` với \`Pattern\` được cache, vòng lặp \`Long sum\`, và đoạn cuối về object pool cùng mối quan hệ với Item 50. Ở Item 7 đọc kỹ đoạn giải thích vì sao \`Stack\` "tự quản lý bộ nhớ" khiến garbage collector không biết phần nào của mảng đã không còn hoạt động.

**Bẫy.** Đọc Item 6 thành "tạo đối tượng là đắt, hãy tránh" rồi tự viết object pool. Sách nói ngược lại: tạo và thu hồi đối tượng nhỏ là rẻ trên JVM hiện đại, object pool tự viết chỉ đáng cho đối tượng cực nặng như kết nối cơ sở dữ liệu. Bẫy thứ hai: sau khi bị Item 7 "cắn", gán \`null\` cho mọi biến — sách nói gán null nên là ngoại lệ; cách tốt nhất là để biến ra khỏi scope.

**Tự kiểm tra.** Vì sao \`WeakHashMap\` chỉ hợp làm cache khi vòng đời của entry do tham chiếu bên ngoài tới *khóa* quyết định, chứ không phải tới giá trị? Trong ví dụ \`Long sum\`, chương trình tạo ra bao nhiêu đối tượng thừa và vì sao chỉ một ký tự lại gây ra điều đó?`,
      },
      {
        id: "ej-w1-4",
        text: "Finalizer, cleaner và try-with-resources",
        lesson: `**Mục tiêu.** Giải thích được vì sao finalizer và cleaner không phải destructor của Java, kể được hai công dụng chính đáng còn lại của chúng, và viết class tài nguyên implement \`AutoCloseable\` dùng với \`try\`-with-resources.

**Đọc.** [Item 8 — Tránh dùng finalizer và cleaner](#/docs/ej-02) → [Item 9 — Ưu tiên \`try\`-with-resources thay vì \`try\`-\`finally\`](#/docs/ej-02). Ở Item 8 gõ lại ví dụ \`Room\` với static nested class \`State\`, chạy cả \`Adult\` lẫn \`Teenager\` và so sánh output. Ở Item 9 đọc kỹ đoạn nói trong \`try\`-\`finally\`, exception từ \`close\` xóa sạch exception đầu tiên khỏi stack trace.

**Bẫy.** Dựa vào finalizer hay cleaner để đóng file hoặc nhả khóa bền vững. Sách nhấn mạnh không có gì đảm bảo chúng chạy kịp thời — thậm chí không đảm bảo chúng chạy — và \`System.gc\`, \`System.runFinalization\` cũng không đảm bảo gì. Bẫy thứ hai: để \`State\` tham chiếu tới \`Room\`, hoặc dùng lambda làm hành động dọn dẹp — sẽ tạo vòng tham chiếu khiến \`Room\` không bao giờ đủ điều kiện được thu gom.

**Tự kiểm tra.** Làm sao bảo vệ một class không phải final khỏi finalizer attack? Trong \`try\`-with-resources, khi cả \`readLine\` lẫn \`close\` đều ném exception, exception nào được ném ra, cái còn lại đi đâu và lấy lại bằng method nào?`,
      },
    ],
  },
  {
    id: "ej-w2",
    week: "Tuần 2",
    title: "Hợp đồng của `Object`",
    goal: "Viết đúng `equals`, `hashCode`, `toString` và `compareTo` cho một value class, giải thích được vì sao vi phạm hợp đồng làm hỏng `HashMap`, `HashSet` và `TreeSet`, và biết vì sao nên tránh `clone`.",
    practice: "Viết class `PhoneNumber` chỉ override `equals` mà không override `hashCode`, bỏ một instance vào `HashSet`, rồi viết test JUnit cho thấy `contains(new PhoneNumber(707, 867, 5309))` với giá trị bằng nhau trả `false`. Thêm `hashCode` theo công thức `31 * result + c` để test xanh. Cuối cùng implement `Comparable` bằng một `Comparator` dựng từ `Comparator.comparingInt(...).thenComparing(...)` và kiểm tra thứ tự các phần tử trong một `TreeSet`.",
    resources: [
      { label: "EJ 03 — Các phương thức chung của mọi đối tượng", href: "#/docs/ej-03" },
      { label: "jbloch/effective-java-3e-source-code — chapter 3", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w2-1",
        text: "Hợp đồng `equals` — năm tính chất và cách vi phạm",
        lesson: `**Mục tiêu.** Phát biểu được năm tính chất của hợp đồng \`equals\`, chỉ ra một ví dụ vi phạm cho từng tính chất dễ sai (đối xứng, bắc cầu, nhất quán), và viết \`equals\` theo công thức bốn bước của sách.

**Đọc.** [Item 10 — Tuân thủ general contract khi override \`equals\`](#/docs/ej-03). Đọc kỹ ba ví dụ: \`CaseInsensitiveString\` (đối xứng), \`Point\`/\`ColorPoint\` (bắc cầu — gồm cả đoạn về \`getClass\` và \`CounterPoint\`), và \`java.net.URL\` (nhất quán). Sau đó gõ lại \`equals\` của \`PhoneNumber\` theo công thức và đọc phần "lưu ý cuối cùng".

**Bẫy.** Dùng \`getClass()\` thay \`instanceof\` để subclass thêm được value component. Sách chỉ ra cách này vi phạm nguyên lý thay thế Liskov: \`onUnitCircle\` trả \`false\` cho mọi \`CounterPoint\` bất kể tọa độ. Lối ra là composition kèm một view method. Bẫy thứ hai: khai báo \`equals(MyClass o)\` — đó là overload chứ không phải override; \`@Override\` sẽ bắt lỗi này ngay lúc biên dịch.

**Tự kiểm tra.** Vì sao \`equals\` không cần một phép kiểm tra \`null\` tường minh? Vì sao trường \`float\` và \`double\` phải so bằng \`Float.compare\`/\`Double.compare\` thay vì \`==\`?`,
      },
      {
        id: "ej-w2-2",
        text: "`hashCode` đi kèm `equals`, và `toString` có ích",
        lesson: `**Mục tiêu.** Viết \`hashCode\` nhất quán với \`equals\` theo công thức của sách, viết \`toString\` đủ thông tin để đọc log, và quyết định được có nên đặc tả định dạng của \`toString\` hay không.

**Đọc.** [Item 11 — Luôn override \`hashCode\` khi override \`equals\`](#/docs/ej-03) → [Item 12 — Luôn override \`toString\`](#/docs/ej-03). Ở Item 11 đọc kỹ vì sao \`m.get(new PhoneNumber(707, 867, 5309))\` trả \`null\`, công thức ba bước và lý do chọn số 31. Ở Item 12 đọc kỹ phần cân nhắc đặc tả hay không đặc tả định dạng, và lời khuyên cung cấp accessor cho mọi thông tin có trong chuỗi.

**Bẫy.** Bỏ bớt trường quan trọng khỏi phép tính hash để chạy nhanh hơn. Sách dẫn hàm băm của \`String\` trước Java 2 chỉ dùng tối đa mười sáu ký tự, và với tập URL lớn thì bảng băm thoái hóa về thời gian bậc hai. Bẫy thứ hai: dùng \`Objects.hash\` một dòng cho code nóng — nó chậm hơn vì phải tạo mảng varargs và boxing, sách chỉ khuyên dùng khi hiệu năng không quan trọng.

**Tự kiểm tra.** Một \`hashCode\` luôn trả hằng số \`42\` có hợp lệ theo hợp đồng không, và vì sao sách vẫn nói không bao giờ nên dùng? Nếu không cung cấp accessor cho các thông tin nằm trong \`toString\`, điều gì xảy ra với định dạng chuỗi, kể cả khi bạn đã ghi rõ là nó có thể thay đổi?`,
      },
      {
        id: "ej-w2-3",
        text: "`clone` và vì sao nên tránh nó",
        lesson: `**Mục tiêu.** Giải thích được \`Cloneable\` thực sự làm gì dù không có method nào, viết được \`clone\` đúng cho class có trường tham chiếu mutable, và nói được vì sao copy constructor hay copy factory thường là lựa chọn tốt hơn.

**Đọc.** [Item 13 — Override \`clone\` một cách thận trọng](#/docs/ej-03). Đọc kỹ \`clone\` của \`Stack\` (sao chép mảng \`elements\`) và của \`HashTable\` (deep copy danh sách liên kết — bản đệ quy rồi bản vòng lặp), sau đó là đoạn cuối so sánh với copy constructor và conversion constructor như \`new TreeSet<>(s)\`.

**Bẫy.** Cho \`clone\` chỉ trả \`super.clone()\` khi class có trường tham chiếu tới đối tượng mutable. Bản sao dùng chung mảng \`elements\` với bản gốc, sửa bên này phá bất biến bên kia. Bẫy thứ hai: tưởng \`clone\` sống chung được với trường \`final\` — sách nói kiến trúc \`Cloneable\` không tương thích với trường final tham chiếu đối tượng mutable, vì \`clone\` bị cấm gán lại trường đó.

**Tự kiểm tra.** Vì sao class immutable không bao giờ nên cung cấp \`clone\`? Vì sao \`clone\`, giống constructor, không được gọi method có thể override trên bản sao đang được dựng?`,
      },
      {
        id: "ej-w2-4",
        text: "`Comparable` và comparator construction method",
        lesson: `**Mục tiêu.** Implement \`Comparable\` đúng hợp đồng, so sánh theo nhiều trường bằng comparator construction method, và bỏ hẳn thói quen viết comparator bằng phép trừ.

**Đọc.** [Item 14 — Cân nhắc cài đặt \`Comparable\`](#/docs/ej-03). Đọc kỹ các điều khoản của hợp đồng \`compareTo\` và ví dụ \`new BigDecimal("1.0")\`/\`new BigDecimal("1.00")\` trong \`HashSet\` so với \`TreeSet\`. Sau đó gõ lại hai phiên bản \`compareTo\` của \`PhoneNumber\`: so sánh từng trường bằng \`Short.compare\`, rồi dùng \`comparingInt(...).thenComparingInt(...)\`.

**Bẫy.** Viết \`return o1.hashCode() - o2.hashCode();\`. Sách cảnh báo kỹ thuật dựa trên hiệu này đầy rủi ro tràn số nguyên và bất thường của số thực IEEE 754, mà cũng chẳng nhanh hơn — dùng \`Integer.compare\` hoặc comparator construction method. Bẫy thứ hai: so sánh bằng \`<\` và \`>\` trong \`compareTo\` như ấn bản cũ khuyên; sách nói nay nó dài dòng, dễ lỗi và không còn được khuyến nghị.

**Tự kiểm tra.** Vì sao trong ví dụ, lambda truyền cho \`comparingInt\` phải ghi rõ kiểu \`(PhoneNumber pn)\` còn lambda của \`thenComparingInt\` thì không? Một class có \`compareTo\` không nhất quán với \`equals\` sẽ khiến \`TreeSet\` vi phạm hợp đồng của interface nào, và vì sao?`,
      },
    ],
  },
  {
    id: "ej-w3",
    week: "Tuần 3",
    title: "Thiết kế class và interface",
    goal: "Thiết kế được class và interface giữ vững encapsulation: truy cập tối thiểu, immutable khi có thể, composition thay cho inheritance, và chọn đúng giữa interface, abstract class, cây phân cấp class và từng loại nested class.",
    practice: "Gõ lại `InstrumentedHashSet` kế thừa `HashSet`, gọi `addAll(List.of(\"Snap\", \"Crackle\", \"Pop\"))` rồi in `getAddCount()` để thấy `6` thay vì `3`. Sau đó viết lại bằng forwarding class `ForwardingSet` và wrapper class `InstrumentedSet`, chạy lại cùng test, và thử bọc cả một `TreeSet` mới lẫn một `HashSet` đã có sẵn dữ liệu.",
    resources: [
      { label: "EJ 04 — Class và Interface", href: "#/docs/ej-04" },
      { label: "jbloch/effective-java-3e-source-code — chapter 4", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w3-1",
        text: "Đóng gói: khả năng truy cập tối thiểu và accessor",
        lesson: `**Mục tiêu.** Chọn mức truy cập thấp nhất có thể cho từng class và thành viên, nhận ra field public mutable và mảng \`public static final\` là lỗ hổng, và biết khi nào để field public vẫn chấp nhận được.

**Đọc.** [Item 15 — Giảm thiểu khả năng truy cập của class và thành viên](#/docs/ej-04) → [Item 16 — Trong class public, hãy dùng accessor method thay vì field public](#/docs/ej-04). Ở Item 15 đọc kỹ đoạn về mảng \`public static final\` với hai cách sửa (list immutable hoặc trả bản sao), và đoạn nói hai mức truy cập của module phần lớn chỉ mang tính khuyến nghị bên ngoài JDK. Ở Item 16 chú ý ranh giới giữa class public và class package-private hay private nested.

**Bẫy.** Nâng một thành viên lên public hay protected chỉ để test cho tiện. Sách chỉ chấp nhận nới từ private xuống package-private, vì test chạy được trong cùng package; đưa nó vào API xuất ra chỉ để test là không chấp nhận được. Bẫy thứ hai: tưởng \`final\` trên field mảng là đủ an toàn — mảng khác rỗng luôn mutable, client vẫn sửa được nội dung.

**Tự kiểm tra.** Vì sao chuyển một thành viên của class public từ package-private sang protected là bước nhảy lớn về khả năng truy cập? Vì sao sách gọi \`Point\` và \`Dimension\` trong \`java.awt\` là bài học cảnh tỉnh chứ không phải ví dụ đáng noi theo?`,
      },
      {
        id: "ej-w3-2",
        text: "Class immutable",
        lesson: `**Mục tiêu.** Viết được class immutable theo năm quy tắc của sách, giải thích các lợi thế (đơn giản, thread-safe, chia sẻ tự do, failure atomicity miễn phí) và nhược điểm chính của nó.

**Đọc.** [Item 17 — Giảm thiểu tính mutable](#/docs/ej-04). Gõ lại \`Complex\`, rồi phiên bản dùng private constructor kèm static factory \`valueOf\`. Đọc kỹ đoạn về \`BigInteger\`/\`BigDecimal\` không phải final và đoạn về companion class mutable (\`StringBuilder\` của \`String\`).

**Bẫy.** Bỏ quên quy tắc thứ năm: khởi tạo field bằng tham chiếu mutable do client đưa vào, hoặc trả field đó qua accessor mà không defensive copy. Bẫy thứ hai: tin rằng một tham số \`BigInteger\` từ client không đáng tin chắc chắn immutable — sách nói phải kiểm tra đó có phải \`BigInteger\` "thật" không, nếu là subclass thì defensive copy.

**Tự kiểm tra.** Vì sao method của \`Complex\` tên là \`plus\` chứ không phải \`add\`, và sách nhắc tới class nào đã không theo quy ước này? Ngoài khai báo class \`final\`, còn cách nào ngăn kế thừa, và vì sao sách cho rằng cách đó thường tốt hơn?`,
      },
      {
        id: "ej-w3-3",
        text: "Composition hơn inheritance, và thiết kế cho kế thừa",
        lesson: `**Mục tiêu.** Giải thích được vì sao implementation inheritance vi phạm encapsulation, viết được wrapper class dựa trên một forwarding class tái sử dụng được, và biết một class thiết kế cho kế thừa phải tài liệu hóa và kiểm nghiệm những gì.

**Đọc.** [Item 18 — Ưu tiên composition hơn inheritance](#/docs/ej-04) → [Item 19 — Thiết kế và tài liệu hóa cho inheritance, nếu không thì hãy cấm nó](#/docs/ej-04). Ở Item 18 đọc kỹ phân tích vì sao \`getAddCount\` trả \`6\`, rồi hai phần \`ForwardingSet\`/\`InstrumentedSet\`. Ở Item 19 đọc kỹ về \`@implSpec\`, hook \`removeRange\` của \`AbstractList\`, và ví dụ \`Super\`/\`Sub\` gọi \`overrideMe\` từ constructor.

**Bẫy.** "Chỉ thêm method mới, không override thì kế thừa là an toàn." Sách chỉ ra: nếu superclass về sau thêm method cùng signature nhưng khác kiểu trả về, subclass không biên dịch được nữa; nếu cùng kiểu trả về thì bạn vô tình override nó. Bẫy thứ hai: gọi method có thể override từ constructor — \`Sub\` in \`null\` ở lần đầu, và chương trình quan sát thấy một field final ở hai trạng thái.

**Tự kiểm tra.** Wrapper class không phù hợp với loại framework nào, và sách gọi vấn đề đó là gì? Theo kinh nghiệm sách nêu, cần viết bao nhiêu subclass để kiểm nghiệm một class thiết kế cho kế thừa, và ai nên viết ít nhất một trong số đó?`,
      },
      {
        id: "ej-w3-4",
        text: "Interface, default method, tagged class và nested class",
        lesson: `**Mục tiêu.** Chọn interface thay abstract class để định nghĩa kiểu, cung cấp skeletal implementation đi kèm, cẩn trọng khi thêm default method vào interface đã phát hành, thay tagged class bằng cây phân cấp, và chọn đúng loại nested class.

**Đọc.** [Item 20 — Ưu tiên interface hơn abstract class](#/docs/ej-04) → [Item 21 — Thiết kế interface cho hậu thế](#/docs/ej-04) → [Item 22 — Chỉ dùng interface để định nghĩa kiểu](#/docs/ej-04) → [Item 23 — Ưu tiên cây phân cấp class hơn tagged class](#/docs/ej-04) → [Item 24 — Ưu tiên static member class hơn nonstatic](#/docs/ej-04) → [Item 25 — Giới hạn file nguồn chỉ chứa một class top-level duy nhất](#/docs/ej-04). Đây là mục dài nhất tuần: đọc kỹ Item 20 (\`intArrayAsList\`, \`AbstractMapEntry\`) và Item 24 (bốn loại nested class). Các Item còn lại ngắn, chỉ cần nắm ví dụ chính: \`removeIf\` trên \`SynchronizedCollection\` của Apache, constant interface, tagged class \`Figure\`, và \`Utensil\`/\`Dessert\`.

**Bẫy.** Quên \`static\` cho member class không cần enclosing instance. Mỗi instance khi đó giữ một tham chiếu ẩn tới enclosing instance, tốn chỗ và có thể giữ enclosing instance lại khi lẽ ra nó đã được thu gom (Item 7). Bẫy thứ hai: tưởng default method giúp thêm method vào interface đã phát hành một cách an toàn — \`removeIf\` mặc định phá lời hứa đồng bộ của \`SynchronizedCollection\`: biên dịch không lỗi, không cảnh báo, nhưng hỏng lúc runtime.

**Tự kiểm tra.** Vì sao skeletal implementation của \`Map.Entry\` không thể viết bằng default method ngay trong interface? Khi \`Utensil.java\` và \`Dessert.java\` cùng định nghĩa hai class \`Utensil\` và \`Dessert\`, lệnh \`javac Dessert.java Main.java\` in ra gì và vì sao?`,
      },
    ],
  },
  {
    id: "ej-w4",
    week: "Tuần 4",
    title: "Generics an toàn kiểu",
    goal: "Viết code generic không còn cảnh báo unchecked (hoặc chỉ chặn khi đã chứng minh an toàn), tự viết generic type và generic method, dùng bounded wildcard theo PECS, và biết giới hạn khi trộn generics với mảng và varargs.",
    practice: "Generic hóa `Stack` của Item 7 thành `Stack<E>` bằng kỹ thuật ép `Object[]` sang `E[]`, đặt `@SuppressWarnings(\"unchecked\")` trên constructor kèm comment giải thích vì sao an toàn. Thêm `pushAll(Iterable<? extends E> src)` và `popAll(Collection<? super E> dst)`, kiểm tra một `Stack<Number>` nhận được `Iterable<Integer>` và đổ được vào `Collection<Object>`. Sau đó bỏ lần lượt từng wildcard và ghi lại thông báo lỗi mà compiler đưa ra.",
    resources: [
      { label: "EJ 05 — Generics", href: "#/docs/ej-05" },
      { label: "jbloch/effective-java-3e-source-code — chapter 5", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w4-1",
        text: "Raw type và cảnh báo unchecked",
        lesson: `**Mục tiêu.** Phân biệt được \`List\`, \`List<Object>\` và \`List<?>\`, biết hai ngoại lệ phải dùng raw type, và loại bỏ hoặc chặn đúng cách từng cảnh báo unchecked.

**Đọc.** [Item 26 — Đừng dùng raw type](#/docs/ej-05) → [Item 27 — Loại bỏ các cảnh báo unchecked](#/docs/ej-05). Ở Item 26 gõ lại \`unsafeAdd\` để thấy \`ClassCastException\`, rồi đổi tham số sang \`List<Object>\` để thấy compiler chặn; bảng thuật ngữ cuối Item đáng giữ lại để tra cả chương. Ở Item 27 đọc kỹ ví dụ \`toArray\` của \`ArrayList\`: chuyển \`@SuppressWarnings\` từ method xuống một khai báo biến cục bộ.

**Bẫy.** Dùng raw type \`Set\` cho collection mà "kiểu phần tử không quan trọng". Sách đưa ra \`Set<?>\`: bạn không bỏ được phần tử nào ngoài \`null\` vào \`Collection<?>\`, nên không thể phá bất biến kiểu của nó. Bẫy thứ hai: đặt \`@SuppressWarnings("unchecked")\` trên cả class hay method dài mà không có comment — che mất cảnh báo thật và tạo cảm giác an toàn giả.

**Tự kiểm tra.** Hai trường hợp nào bạn phải (hoặc nên) dùng raw type, và vì sao? Vì sao không thể đặt \`@SuppressWarnings\` lên câu lệnh \`return\`, và sách xử lý chuyện đó ra sao?`,
      },
      {
        id: "ej-w4-2",
        text: "List hơn mảng, và tự viết generic type",
        lesson: `**Mục tiêu.** Giải thích được cặp tính chất covariant/reified của mảng so với invariant/erasure của generics, vì sao không tạo được mảng generic, và generic hóa một class dựa trên mảng bằng một trong hai kỹ thuật của sách.

**Đọc.** [Item 28 — Ưu tiên list hơn mảng](#/docs/ej-05) → [Item 29 — Ưu tiên generic type](#/docs/ej-05). Ở Item 28 đọc kỹ ví dụ năm dòng giả định tạo được mảng \`List<String>[]\`, rồi ví dụ \`Chooser\` đi từ mảng sang list. Ở Item 29 so sánh hai kỹ thuật cho \`Stack<E>\` (ép \`Object[]\` sang \`E[]\` một lần, hoặc giữ trường \`Object[]\` và ép từng phần tử khi đọc) và lý do sách ưa kỹ thuật thứ nhất.

**Bẫy.** Nghĩ mảng "an toàn hơn vì được kiểm tra lúc runtime". \`Object[] objectArray = new Long[1]\` biên dịch được và chỉ nổ \`ArrayStoreException\` lúc chạy; với list, cùng lỗi đó bị chặn lúc biên dịch. Bẫy thứ hai: tưởng kỹ thuật \`E[]\` không có giá nào — nó gây heap pollution vì kiểu runtime của mảng không khớp kiểu lúc biên dịch; ở \`Stack\` điều này vô hại chỉ vì mảng là private và không bao giờ lộ ra ngoài.

**Tự kiểm tra.** Những parameterized type nào là reifiable, và vì sao chỉ chúng? Nếu Item 28 khuyên dùng list thay mảng, vì sao \`ArrayList\` vẫn buộc phải cài đặt dựa trên mảng?`,
      },
      {
        id: "ej-w4-3",
        text: "Generic method và bounded wildcard (PECS)",
        lesson: `**Mục tiêu.** Viết được generic method, kể cả generic singleton factory và recursive type bound; áp dụng PECS cho tham số đầu vào; và dùng private helper để capture wildcard.

**Đọc.** [Item 30 — Ưu tiên generic method](#/docs/ej-05) → [Item 31 — Dùng bounded wildcard để tăng tính linh hoạt cho API](#/docs/ej-05). Ở Item 30 đọc kỹ \`union\`, \`identityFunction\` và \`max\` với \`<E extends Comparable<E>>\`. Ở Item 31 đọc kỹ PECS qua \`pushAll\`/\`popAll\`, khai báo \`max\` đã sửa với \`Comparable<? super T>\`, và cặp \`swap\`/\`swapHelper\`.

**Bẫy.** Dùng bounded wildcard làm kiểu trả về. Sách nói điều đó không thêm linh hoạt mà buộc client phải viết wildcard trong code của họ — \`union\` vẫn trả \`Set<E>\`. Bẫy thứ hai: khai báo \`Comparable<T>\` thay vì \`Comparable<? super T>\` — \`List<ScheduledFuture<?>>\` bị loại vì \`ScheduledFuture\` không implement \`Comparable<ScheduledFuture>\` mà kế thừa \`Comparable<Delayed>\` qua \`Delayed\`.

**Tự kiểm tra.** Nếu một tham số vừa là producer vừa là consumer thì dùng wildcard nào? Khi một type parameter chỉ xuất hiện đúng một lần trong khai báo method, sách khuyên làm gì, và \`swap(List<?> list, ...)\` phải xoay xở ra sao để cài đặt được?`,
      },
      {
        id: "ej-w4-4",
        text: "Generics với varargs, và typesafe heterogeneous container",
        lesson: `**Mục tiêu.** Biết khi nào một generic varargs method đủ an toàn để đánh \`@SafeVarargs\`, và viết được typesafe heterogeneous container dùng \`Class<T>\` làm type token.

**Đọc.** [Item 32 — Kết hợp generics và varargs một cách thận trọng](#/docs/ej-05) → [Item 33 — Cân nhắc dùng typesafe heterogeneous container](#/docs/ej-05). Ở Item 32 gõ lại \`toArray\` và \`pickTwo\`, chạy để thấy \`ClassCastException\` dù không có phép ép kiểu nào nhìn thấy được, rồi đọc kỹ hai điều kiện để một generic varargs method là an toàn. Ở Item 33 gõ lại \`Favorites\` và đọc kỹ đoạn vì sao \`getFavorite\` dùng \`type.cast\` thay vì ép unchecked sang \`T\`.

**Bẫy.** Đánh \`@SafeVarargs\` cho method trả về hoặc để lộ mảng varargs. \`toArray\` không ghi gì vào mảng nhưng vẫn lan truyền heap pollution lên hai tầng gọi. Bẫy thứ hai: định lưu \`List<String>\` vào \`Favorites\` — không tồn tại \`List<String>.class\`, và sách thừa nhận hạn chế này không có cách khắc phục hoàn toàn thỏa đáng.

**Tự kiểm tra.** \`@SafeVarargs\` hợp lệ trên những loại method nào ở Java 8 và Java 9, và vì sao lại giới hạn như vậy? Một client ác ý phá an toàn kiểu của \`Favorites\` bằng cách nào, và \`putFavorite\` phòng thủ ra sao?`,
      },
    ],
  },
  {
    id: "ej-w5",
    week: "Tuần 5",
    title: "Enum và annotation",
    goal: "Thay hằng số `int` bằng enum mang dữ liệu và hành vi, dùng `EnumSet`/`EnumMap` thay bit field và mảng đánh chỉ số bằng ordinal, mô phỏng enum mở rộng được qua interface, và dùng annotation đúng chỗ — kể cả `@Override` và marker interface.",
    practice: "Tìm một nhóm hằng số `int` (hoặc `String`) trong codebase, thay bằng enum có constant-specific method theo kiểu `Operation.apply`, kèm `fromString` trả `Optional`. Sau đó tìm một mảng được đánh chỉ số bằng `ordinal()` (hoặc tự dựng ví dụ `Plant`/`LifeCycle` của Item 37) và thay bằng `EnumMap`; viết thêm bản stream dùng `groupingBy` ba tham số với `() -> new EnumMap<>(LifeCycle.class)` và so sánh kích thước map khi thiếu một vòng đời.",
    resources: [
      { label: "EJ 06 — Enum và Annotation", href: "#/docs/ej-06" },
      { label: "jbloch/effective-java-3e-source-code — chapter 6", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w5-1",
        text: "Enum thay hằng số `int`, và instance field thay ordinal",
        lesson: `**Mục tiêu.** Viết được enum có field, constructor, constant-specific method và strategy enum; biết khi nào \`switch\` trên enum là hợp lý; và không bao giờ suy giá trị gắn với hằng từ \`ordinal()\`.

**Đọc.** [Item 34 — Dùng enum thay cho hằng số \`int\`](#/docs/ej-06) → [Item 35 — Dùng instance field thay cho ordinal](#/docs/ej-06). Item 34 dài: gõ lại \`Planet\`, \`Operation\` với \`apply\` abstract và \`fromString\`, rồi \`PayrollDay\` với strategy enum \`PayType\`. Item 35 ngắn, đọc trọn cùng ví dụ \`Ensemble\`.

**Bẫy.** Gắn hành vi bằng \`switch (this)\` ngay trong enum. Thêm một hằng mới mà quên case thì vẫn biên dịch được nhưng hỏng lúc chạy — \`PayrollDay\` phiên bản \`switch\` sẽ âm thầm trả lương ngày nghỉ phép như ngày thường. Bẫy thứ hai: cho constructor của enum tự đưa hằng vào một static map — không biên dịch được, vì static field chưa được khởi tạo khi constructor enum chạy; hãy điền map trong khởi tạo static field.

**Tự kiểm tra.** Vì sao đổi giá trị của một hằng trong \`int\` enum pattern buộc phải biên dịch lại client, còn với enum type thì không? Đặc tả \`Enum\` nói method \`ordinal\` được thiết kế cho ai dùng?`,
      },
      {
        id: "ej-w5-2",
        text: "`EnumSet` và `EnumMap`",
        lesson: `**Mục tiêu.** Thay bit field bằng \`EnumSet\`, thay mảng đánh chỉ số bằng ordinal bằng \`EnumMap\` (kể cả map lồng hai chiều), và giải thích vì sao hiệu năng gần như không đổi.

**Đọc.** [Item 36 — Dùng \`EnumSet\` thay cho bit field](#/docs/ej-06) → [Item 37 — Dùng \`EnumMap\` thay cho đánh chỉ số bằng ordinal](#/docs/ej-06). Ở Item 36 chú ý \`applyStyles\` nhận \`Set<Style>\` chứ không phải \`EnumSet<Style>\`. Ở Item 37 gõ lại ví dụ \`Plant\` ở cả bản \`EnumMap\` lẫn hai bản stream, rồi \`Phase\`/\`Transition\` với map lồng và bước thêm \`PLASMA\`.

**Bẫy.** Gọi \`groupingBy\` một tham số rồi tưởng mình có \`EnumMap\`. Sách nói nó tự chọn cài đặt map và đó không phải \`EnumMap\`; phải dùng dạng ba tham số với \`mapFactory\`. Bẫy thứ hai: tưởng bản stream và bản \`EnumMap\` cho kết quả y hệt — bản stream chỉ tạo map lồng cho vòng đời có ít nhất một cây, nên kích thước \`plantsByLifeCycle\` có thể khác.

**Tự kiểm tra.** Vì sao \`EnumSet\` nhanh ngang bit field khi enum có từ sáu mươi tư phần tử trở xuống? Tính đến Java 9, nhược điểm thực sự duy nhất của \`EnumSet\` là gì, và tạm thời vượt qua bằng cách nào?`,
      },
      {
        id: "ej-w5-3",
        text: "Enum mở rộng được qua interface",
        lesson: `**Mục tiêu.** Mô phỏng một enum mở rộng được bằng cặp interface + enum cài đặt chuẩn, và viết API nhận interface để client cắm được tập phép toán của riêng họ.

**Đọc.** [Item 38 — Mô phỏng enum có thể mở rộng bằng interface](#/docs/ej-06). Gõ lại interface \`Operation\`, enum \`BasicOperation\` và \`ExtendedOperation\`, rồi cả hai phiên bản \`test\`: một nhận bounded type token \`<T extends Enum<T> & Operation> Class<T>\`, một nhận \`Collection<? extends Operation>\`. Đọc kỹ đoạn đầu giải thích vì sao khả năng mở rộng enum nói chung là ý tưởng tồi, và vì sao opcode là ngoại lệ thuyết phục.

**Bẫy.** Viết API nhận \`BasicOperation\` thay vì \`Operation\` — khi đó extension enum không truyền vào được; mẫu này chỉ hoạt động khi API được viết dựa trên interface. Bẫy thứ hai: tưởng cài đặt dùng chung có thể kế thừa từ enum này sang enum khác — không được; sách gợi ý đặt nó vào default method nếu không phụ thuộc trạng thái, hoặc vào helper class hay static helper method.

**Tự kiểm tra.** Chọn tham số \`Collection<? extends Operation>\` thay vì class literal thì được gì và mất gì? Enum nào trong thư viện Java dùng đúng mẫu này, và nó implement những interface nào?`,
      },
      {
        id: "ej-w5-4",
        text: "Annotation hơn naming pattern, `@Override` và marker interface",
        lesson: `**Mục tiêu.** Kể được ba nhược điểm của naming pattern, viết được annotation type với meta-annotation cùng bộ chạy dựa trên reflection, dùng \`@Override\` nhất quán, và chọn đúng giữa marker interface và marker annotation.

**Đọc.** [Item 39 — Ưu tiên annotation hơn naming pattern](#/docs/ej-06) → [Item 40 — Luôn dùng annotation \`Override\` một cách nhất quán](#/docs/ej-06) → [Item 41 — Dùng marker interface để định nghĩa kiểu](#/docs/ej-06). Ở Item 39 gõ lại framework đồ chơi \`@Test\`/\`@ExceptionTest\` và \`RunTests\`, đọc kỹ đoạn về repeatable annotation. Ở Item 40 chạy \`Bigram\` để tận mắt thấy \`260\`. Ở Item 41 đọc kỹ câu hỏi quyết định: bạn có muốn viết method chỉ nhận đối tượng mang dấu đánh dấu này không?

**Bẫy.** Dùng \`isAnnotationPresent\` để tìm repeatable annotation. Annotation lặp lại thuộc containing annotation type chứ không thuộc kiểu gốc, nên chương trình âm thầm bỏ sót; phải kiểm tra cả hai kiểu, hoặc dùng \`getAnnotationsByType\`. Bẫy thứ hai: nghe rằng marker annotation làm marker interface lỗi thời — sách bác bỏ: marker interface định nghĩa một kiểu, nhờ đó bắt được lỗi ngay lúc biên dịch.

**Tự kiểm tra.** Nếu thiếu \`@Retention(RetentionPolicy.RUNTIME)\` trên \`Test\`, bộ chạy kiểm thử thấy gì? Trường hợp nào sách nói bạn không cần đặt \`@Override\` lên method override?`,
      },
    ],
  },
];
