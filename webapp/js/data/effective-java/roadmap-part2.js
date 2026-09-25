// Lộ trình đọc Effective Java — Phần 2 (Tuần 6–10).
//
// Nguồn: bản dịch tiếng Việt "Effective Java", ấn bản 3 — Joshua Bloch, Addison-Wesley 2018.
// Thư mục nguồn: sources/effective-java/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ej-w<N> / ej-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 10 tuần / 11 chương: T1 ch2 · T2 ch3 · T3 ch4 · T4 ch5 · T5 ch6 ·
// T6 ch7 · T7 ch8 · T8 ch9 · T9 ch10–11 · T10 ch12 + tổng ôn.

export const ejWeeksPart2 = [
  {
    id: "ej-w6",
    week: "Tuần 6",
    title: "Lambda và stream đúng mực",
    goal: "Viết function object bằng lambda hoặc method reference thay anonymous class, chọn functional interface chuẩn, dùng stream ở chỗ nó làm code rõ hơn với các hàm không side effect và collector đúng, chọn kiểu trả về cho method trả chuỗi phần tử, và chỉ song song hoá stream khi đã đo.",
    practice: "Trên JDK 17+, viết lại một anonymous `Comparator<String>` sắp theo độ dài thành lambda, rồi thành `comparingInt(String::length)`. Sau đó viết bảng tần suất từ bằng `forEach` gọi `freq.merge(...)` bên trong lambda, rồi sửa thành `collect(groupingBy(String::toLowerCase, counting()))`. Cuối cùng đo thời gian `LongStream.rangeClosed(2, n)` đếm số nguyên tố có và không có `parallel()`, rồi thêm `parallel()` vào pipeline Mersenne dùng `Stream.iterate` + `limit(20)` và quan sát CPU (dừng tay sau vài phút).",
    resources: [
      { label: "EJ 07 — Lambda và Stream", href: "#/docs/ej-07" },
      { label: "jbloch/effective-java-3e-source-code — chapter 7", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w6-1",
        text: "Lambda, method reference và functional interface chuẩn",
        lesson: `**Mục tiêu.** Thay anonymous class bằng lambda, biết khi nào method reference rõ hơn lambda và khi nào không, và chọn được interface trong \`java.util.function\` thay vì tự khai báo — cùng ba trường hợp đáng tự viết functional interface riêng.

**Đọc.** [Item 42 — Ưu tiên lambda hơn anonymous class](#/docs/ej-07) → [Item 43 — Ưu tiên method reference hơn lambda](#/docs/ej-07) → [Item 44 — Ưu tiên dùng các functional interface chuẩn](#/docs/ej-07). Ở Item 42 gõ lại enum \`Operation\` bản dùng \`DoubleBinaryOperator\` và đọc kỹ đoạn khi nào constant-specific class body vẫn là lựa chọn đúng. Ở Item 43 đọc bảng năm loại method reference. Ở Item 44 thuộc sáu interface cơ bản và ba lý do \`Comparator\` xứng đáng có interface riêng.

**Bẫy.** Viết lambda dài chục dòng. Sách nói lambda không có tên và không có tài liệu: một dòng là lý tưởng, ba dòng là mức tối đa hợp lý; dài hơn thì tách ra method và dùng method reference. Bẫy thứ hai: dùng \`Function<Integer, Integer>\` hay các interface cơ bản với boxed primitive thay vì \`IntUnaryOperator\` và họ hàng — chạy được nhưng vi phạm Item 61 và có thể rất tai hại về hiệu năng khi xử lý hàng loạt.

**Tự kiểm tra.** Từ bên trong thân, \`this\` của lambda và \`this\` của anonymous class tham chiếu đến gì, và điều đó buộc bạn chọn anonymous class trong tình huống nào? Vì sao overload \`submit\` của \`ExecutorService\` nhận \`Callable<T>\` hoặc \`Runnable\` là ví dụ về điều không nên làm khi thiết kế API nhận functional interface?`,
      },
      {
        id: "ej-w6-2",
        text: "Dùng stream thận trọng, và hàm không side effect",
        lesson: `**Mục tiêu.** Phân biệt được việc hợp với stream và việc hợp với vòng lặp, viết pipeline mà mỗi giai đoạn gần với hàm thuần túy, và dùng thạo các collector chính: \`toList\`, \`toSet\`, \`toMap\`, \`groupingBy\`, \`joining\`.

**Đọc.** [Item 45 — Dùng stream một cách thận trọng](#/docs/ej-07) → [Item 46 — Ưu tiên các hàm không có side effect trong stream](#/docs/ej-07). Ở Item 45 so ba phiên bản \`Anagrams\` (vòng lặp, lạm dụng stream, dùng vừa phải) và đọc kỹ hai danh sách: việc khối code làm được mà lambda không làm được, và việc stream làm rất dễ. Ở Item 46 đọc kỹ ba dạng \`toMap\` (kể cả merge function và last-write-wins) và ba phiên bản \`groupingBy\`.

**Bẫy.** Dùng stream để xử lý \`char\`: \`"Hello world!".chars().forEach(System.out::print)\` in ra một dãy số vì phần tử là \`int\`. Sách khuyên tránh dùng stream cho giá trị \`char\`. Bẫy thứ hai: làm cả phép tính trong \`forEach\` bằng lambda sửa trạng thái bên ngoài — sách gọi đó là code lặp đội lốt stream; \`forEach\` chỉ nên dùng để báo cáo kết quả.

**Tự kiểm tra.** \`toMap(keyMapper, valueMapper)\` làm gì khi hai phần tử ánh xạ đến cùng một khóa, và bạn xử lý xung đột đó bằng cách nào? Vì sao sách nói không bao giờ có lý do để viết \`collect(counting())\`?`,
      },
      {
        id: "ej-w6-3",
        text: "`Collection` hơn `Stream` làm kiểu trả về",
        lesson: `**Mục tiêu.** Chọn đúng kiểu trả về cho method trả một chuỗi phần tử: collection chuẩn, collection tuỳ biến, \`Stream\` hay \`Iterable\` — và viết được hai adapter qua lại giữa \`Stream\` và \`Iterable\`.

**Đọc.** [Item 47 — Ưu tiên Collection hơn Stream làm kiểu trả về](#/docs/ej-07). Gõ lại \`iterableOf\` và \`streamOf\`, rồi \`PowerSet\` dựa trên \`AbstractList\` với ý tưởng dùng chỉ số làm vector bit. Đọc kỹ đoạn \`SubLists\`: vì sao ở đó sách chọn trả stream, và con số đo được khi dùng adapter so với collection chuyên dụng.

**Bẫy.** Tưởng stream đã là lựa chọn hiển nhiên cho mọi method trả chuỗi. Vì \`Stream\` không extend \`Iterable\`, người dùng muốn for-each sẽ phải dùng adapter hoặc ép kiểu xấu xí. Bẫy thứ hai: nạp cả một chuỗi lớn vào \`ArrayList\` chỉ để trả về collection — sách nói đừng làm vậy; nếu chuỗi biểu diễn được cô đọng thì viết collection chuyên dụng.

**Tự kiểm tra.** Vì sao \`for (ProcessHandle ph : ProcessHandle.allProcesses()::iterator)\` không biên dịch được, còn \`return stream::iterator;\` trong \`iterableOf\` thì được? Nhược điểm nào của \`Collection\` làm kiểu trả về khiến \`PowerSet.of\` phải ném exception khi tập đầu vào có hơn 30 phần tử?`,
      },
      {
        id: "ej-w6-4",
        text: "Song song hoá stream — khi nào nó chậm hơn hoặc sai",
        lesson: `**Mục tiêu.** Nêu được điều kiện để \`parallel()\` có lợi (nguồn chia tách rẻ, locality of reference, terminal operation phù hợp, đủ khối lượng việc) và nhận ra hai kiểu thất bại: liveness failure và safety failure.

**Đọc.** [Item 48 — Hãy thận trọng khi song song hóa stream](#/docs/ej-07). Đọc kỹ câu chuyện pipeline Mersenne bị treo khi thêm \`parallel()\`, danh sách nguồn song song hoá tốt (\`ArrayList\`, \`HashMap\`, \`HashSet\`, \`ConcurrentHashMap\`, mảng, dải \`int\`/\`long\`), rồi ví dụ \`pi(n)\` tăng tốc 3,7 lần. Chú ý ước lượng thô "số phần tử nhân số dòng code mỗi phần tử ít nhất một trăm nghìn".

**Bẫy.** Thêm \`parallel()\` vào pipeline có nguồn \`Stream.iterate\` hoặc dùng \`limit\`. Sách nói khó có thể tăng hiệu năng trong trường hợp này, và chiến lược mặc định còn tính thêm phần tử rồi bỏ đi — đủ để pipeline Mersenne quỳ gối. Bẫy thứ hai: tưởng \`collect\` là terminal operation tốt cho song song; sách nói mutable reduction không phải ứng viên tốt vì chi phí kết hợp collection đắt.

**Tự kiểm tra.** Nếu pipeline song song cần in kết quả đúng thứ tự như bản tuần tự, bạn thay \`forEach\` bằng gì? Khi song song hoá một stream số ngẫu nhiên, vì sao sách khuyên bắt đầu với \`SplittableRandom\` chứ không phải \`Random\`?`,
      },
    ],
  },
  {
    id: "ej-w7",
    week: "Tuần 7",
    title: "Thiết kế method",
    goal: "Thiết kế chữ ký method và constructor dễ dùng khó dùng sai: kiểm tra tham số ngay đầu thân, sao chép phòng vệ thành phần mutable, tránh overloading gây nhầm lẫn, dùng varargs đúng chỗ, không trả `null` thay collection rỗng, trả `Optional` có chủ đích, và viết doc comment mô tả đúng hợp đồng.",
    practice: "Trên JDK 17+, gõ lại `Period` bản hỏng của Item 50 (hai field `final Date`), viết test JUnit cho cả hai cuộc tấn công: sửa `end` sau khi truyền vào constructor, và `p.end().setYear(78)`; chạy để thấy bất biến `start <= end` bị phá. Sửa bằng bản sao phòng vệ trong constructor (sao chép trước, kiểm tra trên bản sao) và trong accessor, chạy lại test cho xanh. Sau đó tìm một method trong codebase trả `null` khi không có kết quả kiểu collection, đổi sang trả collection rỗng và xoá các nhánh `!= null` ở phía gọi.",
    resources: [
      { label: "EJ 08 — Phương thức", href: "#/docs/ej-08" },
      { label: "jbloch/effective-java-3e-source-code — chapter 8", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w7-1",
        text: "Kiểm tra tham số và bản sao phòng vệ",
        lesson: `**Mục tiêu.** Ghi ràng buộc tham số trong tài liệu và thực thi chúng ở đầu thân method bằng \`Objects.requireNonNull\` hoặc exception chuẩn, dùng assertion cho method không export, và tạo bản sao phòng vệ cho mọi thành phần mutable nhận vào hoặc trả ra.

**Đọc.** [Item 49 — Kiểm tra tính hợp lệ của tham số](#/docs/ej-08) → [Item 50 — Tạo bản sao phòng vệ khi cần thiết](#/docs/ej-08). Ở Item 49 đọc kỹ đoạn về tham số được cất đi để dùng sau và đoạn ngoại lệ khi việc kiểm tra tốn kém mà đã được làm ngầm trong phép tính. Ở Item 50 gõ lại \`Period\` qua ba bước: bản hỏng, constructor đã sửa, accessor đã sửa.

**Bẫy.** Kiểm tra tham số trước rồi mới sao chép. Sách yêu cầu làm ngược lại — sao chép trước, kiểm tra trên bản sao — để chặn thread khác sửa tham số trong khoảng giữa lúc kiểm tra và lúc sao chép (tấn công TOCTOU). Bẫy thứ hai: dùng \`clone\` của \`Date\` để sao chép tham số trong constructor; vì \`Date\` không \`final\`, \`clone\` có thể trả về subclass độc hại do kẻ tấn công viết.

**Tự kiểm tra.** Vì sao doc comment của \`BigInteger.mod\` không ghi \`NullPointerException\` dù method ném nó khi \`m\` là null? Trong accessor của \`Period\`, vì sao dùng \`clone\` lại chấp nhận được, còn trong constructor thì không?`,
      },
      {
        id: "ej-w7-2",
        text: "Chữ ký method, overloading và varargs",
        lesson: `**Mục tiêu.** Áp dụng các gợi ý thiết kế chữ ký (tên, số tham số, interface làm kiểu tham số, enum thay \`boolean\`), giải thích vì sao overload được chọn lúc biên dịch còn override được chọn lúc chạy, và viết method varargs nhận "một hoặc nhiều" đối số đúng cách.

**Đọc.** [Item 51 — Thiết kế chữ ký phương thức một cách cẩn thận](#/docs/ej-08) → [Item 52 — Sử dụng overloading một cách thận trọng](#/docs/ej-08) → [Item 53 — Sử dụng varargs một cách thận trọng](#/docs/ej-08). Ở Item 51 chú ý ba kỹ thuật rút ngắn danh sách tham số. Ở Item 52 chạy \`CollectionClassifier\` và \`SetList\` để tận mắt thấy kết quả, rồi đọc kỹ khái niệm kiểu "khác biệt triệt để". Ở Item 53 so hai phiên bản \`min\` và mẫu năm overload \`foo\` cho code nhạy hiệu năng.

**Bẫy.** Tưởng \`list.remove(i)\` với \`i\` là \`int\` sẽ xoá giá trị \`i\`. Nó chọn overload \`remove(int)\` và xoá theo vị trí, nên \`SetList\` in \`[-2, 0, 2]\`; generics và autoboxing đã khiến \`Object\` và \`int\` không còn khác biệt triệt để. Bẫy thứ hai: overload method nhận các functional interface khác nhau ở cùng vị trí đối số — \`exec.submit(System.out::println)\` không biên dịch được dù \`new Thread(System.out::println)\` thì được.

**Tự kiểm tra.** Chính sách an toàn mà sách đề xuất về số lượng tham số của các overload export ra là gì, và \`ObjectOutputStream\` né overload bằng cách nào? Vì sao \`min(int... args)\` kiểm tra \`args.length == 0\` là cách sai để đòi ít nhất một đối số?`,
      },
      {
        id: "ej-w7-3",
        text: "Collection rỗng thay `null`, và `Optional` thận trọng",
        lesson: `**Mục tiêu.** Luôn trả collection hoặc mảng rỗng thay vì \`null\`, và quyết định được khi nào method nên trả \`Optional<T>\` — cùng những chỗ không bao giờ nên dùng optional.

**Đọc.** [Item 54 — Trả về collection hoặc mảng rỗng, không trả về null](#/docs/ej-08) → [Item 55 — Trả về Optional một cách thận trọng](#/docs/ej-08). Ở Item 54 so các phiên bản \`getCheeses\`, kể cả bản tối ưu dùng \`Collections.emptyList\` và mảng rỗng dùng chung. Ở Item 55 gõ lại \`max\` trả \`Optional<E>\`, rồi đọc kỹ các cách xử lý kết quả: \`orElse\`, \`orElseThrow\`, \`orElseGet\`, \`map\`, và \`flatMap(Optional::stream)\`.

**Bẫy.** Trả \`null\` để "tiết kiệm" việc cấp phát container rỗng. Sách bác lập luận này ở hai điểm: đừng lo hiệu năng ở mức này khi chưa đo, và trả container rỗng vẫn có thể không cần cấp phát. Bẫy thứ hai: bọc container trong optional (\`Optional<List<T>>\`) hoặc trả \`Optional<Integer>\` — sách nói collection, map, stream, mảng và optional không nên được bọc trong optional, và dùng \`OptionalInt\`/\`OptionalLong\`/\`OptionalDouble\` thay optional của boxed primitive.

**Tự kiểm tra.** Vì sao cấp phát trước mảng đúng kích thước rồi truyền cho \`toArray\` lại phản tác dụng? Sách so optional với loại exception nào về tinh thần, và vì sao dùng optional làm giá trị trong map là ý tồi?`,
      },
      {
        id: "ej-w7-4",
        text: "Doc comment cho API công khai",
        lesson: `**Mục tiêu.** Viết doc comment mô tả hợp đồng của method (tiền điều kiện, hậu điều kiện, side effect) với đủ \`@param\`, \`@return\`, \`@throws\`, dùng đúng \`{@code}\`, \`{@literal}\`, \`@implSpec\`, \`{@index}\`, và viết mô tả tóm tắt đúng quy ước.

**Đọc.** [Item 56 — Viết doc comment cho mọi phần tử API được công khai](#/docs/ej-08). Đọc kỹ doc comment mẫu của \`List.get\` và các quy ước đi kèm (cụm danh từ sau \`@param\`/\`@return\`, "if" sau \`@throws\`, không dấu chấm cuối), đoạn về mô tả tóm tắt, và các yêu cầu riêng cho generics, enum, annotation. Chú ý hai khía cạnh hay bị quên: mức thread-safe và dạng serialized.

**Bẫy.** Để doc comment mô tả method làm việc *như thế nào*. Sách nói hợp đồng nên nói method làm *gì*, trừ các class được thiết kế để kế thừa — chỗ đó dùng \`@implSpec\` để mô tả hợp đồng với subclass. Bẫy thứ hai: viết mô tả tóm tắt có dấu chấm theo sau là dấu cách, như "Mrs. Peacock" — tóm tắt bị cắt sớm; bọc đoạn đó trong \`{@literal}\`.

**Tự kiểm tra.** Vì sao class public không nên dựa vào constructor mặc định? Hai overload trong cùng một class có được dùng chung một mô tả tóm tắt không, và vì sao?`,
      },
    ],
  },
  {
    id: "ej-w8",
    week: "Tuần 8",
    title: "Lập trình tổng quát",
    goal: "Viết code Java hằng ngày gọn và ít lỗi: phạm vi biến hẹp, for-each, dùng thư viện thay vì tự chế, số học chính xác cho tiền, kiểu nguyên thủy thay boxed primitive, kiểu phù hợp thay chuỗi, `StringBuilder` thay nối chuỗi trong vòng lặp, interface làm kiểu tham chiếu — và biết khi nào (hiếm khi) cần reflection, native method hay tối ưu hoá.",
    practice: "Trên JDK 17+, in `1.03 - 0.42` bằng `double` rồi viết lại bằng `BigDecimal` dựng từ `String` và bằng `int` tính theo xu; làm tương tự với bài mua kẹo của Item 60 để thấy `3` cái so với `4` cái. Sau đó viết hai vòng lặp cộng `i` từ `0` đến `Integer.MAX_VALUE`, một dùng `Long sum`, một dùng `long sum`; đo bằng JMH (hoặc tạm bằng `System.nanoTime`, chạy vài lần để JIT khởi động) và ghi lại tỉ lệ chênh lệch.",
    resources: [
      { label: "EJ 09 — Lập trình tổng quát", href: "#/docs/ej-09" },
      { label: "jbloch/effective-java-3e-source-code — chapter 9", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w8-1",
        text: "Phạm vi biến, for-each, thư viện, và số thực chính xác",
        lesson: `**Mục tiêu.** Khai báo biến cục bộ ở nơi dùng lần đầu, chọn vòng \`for\` và for-each đúng lúc, nhớ ba tình huống không dùng được for-each, dùng thư viện chuẩn thay giải pháp tự chế, và không bao giờ tính tiền bằng \`float\`/\`double\`.

**Đọc.** [Item 57 — Giảm thiểu phạm vi của biến cục bộ](#/docs/ej-09) → [Item 58 — Ưu tiên vòng lặp for-each hơn vòng lặp \`for\` truyền thống](#/docs/ej-09) → [Item 59 — Biết và sử dụng các thư viện](#/docs/ej-09) → [Item 60 — Tránh \`float\` và \`double\` nếu cần kết quả chính xác](#/docs/ej-09). Ở Item 57 đọc kỹ lỗi copy-paste với hai vòng \`while\`. Ở Item 58 chạy ví dụ xúc xắc để thấy sáu cặp thay vì ba mươi sáu. Ở Item 59 đọc ba khiếm khuyết của \`random(n)\` tự viết. Ở Item 60 gõ cả ba phiên bản bài mua kẹo: \`double\`, \`BigDecimal\`, \`int\`.

**Bẫy.** Tự viết \`Math.abs(rnd.nextInt()) % n\`. Sách chỉ ra nó phân bố lệch và, khi \`nextInt()\` trả \`Integer.MIN_VALUE\`, còn trả số âm ngoài khoảng; hãy dùng thư viện, và từ Java 7 chọn \`ThreadLocalRandom\` thay \`Random\`. Bẫy thứ hai: dựng \`BigDecimal\` bằng constructor nhận \`double\` — giá trị không chính xác đã lọt vào phép tính; phải dùng constructor nhận \`String\`.

**Tự kiểm tra.** Trong vòng lặp lồng dùng iterator cho \`suits\` và \`ranks\`, \`next()\` bị gọi sai chỗ nào và triệu chứng là gì? Theo sách, khi nào dùng \`int\`, khi nào dùng \`long\`, khi nào buộc phải dùng \`BigDecimal\` cho tiền?`,
      },
      {
        id: "ej-w8-2",
        text: "Boxed primitive, chuỗi và phép nối chuỗi",
        lesson: `**Mục tiêu.** Nêu được ba khác biệt giữa kiểu nguyên thủy và boxed primitive cùng hậu quả của từng cái, thay chuỗi bằng kiểu phù hợp (số, enum, kiểu tổng hợp, capability), và dùng \`StringBuilder\` khi nối nhiều chuỗi.

**Đọc.** [Item 61 — Ưu tiên kiểu nguyên thủy hơn boxed primitive](#/docs/ej-09) → [Item 62 — Tránh dùng chuỗi khi có kiểu khác phù hợp hơn](#/docs/ej-09) → [Item 63 — Cảnh giác với hiệu năng của phép nối chuỗi](#/docs/ej-09). Ở Item 61 chạy ba chương trình: comparator \`naturalOrder\` hỏng, \`Unbelievable\`, và vòng \`Long sum\`. Ở Item 62 đọc kỹ câu chuyện \`ThreadLocal\` đi từ khoá chuỗi sang \`Key\` rồi sang class generic. Item 63 ngắn, đọc trọn cùng hai phiên bản \`statement()\`.

**Bẫy.** So sánh hai \`Integer\` bằng \`==\`. Đó là so sánh định danh, nên \`naturalOrder.compare(new Integer(42), new Integer(42))\` trả \`1\`; sách nói áp dụng \`==\` lên boxed primitive hầu như luôn luôn sai. Bẫy thứ hai: ghép khoá bằng \`className + "#" + i.next()\` — ký tự phân tách lẫn vào trường là hỗn loạn, muốn đọc từng trường phải parse; viết một class biểu diễn kiểu tổng hợp.

**Tự kiểm tra.** Vì sao \`if (i == 42)\` với \`static Integer i\` ném \`NullPointerException\`? Nối \`n\` chuỗi bằng \`+\` lặp đi lặp lại tốn thời gian bậc mấy theo \`n\`, và vì sao?`,
      },
      {
        id: "ej-w8-3",
        text: "Interface làm kiểu tham chiếu, reflection và native method",
        lesson: `**Mục tiêu.** Khai báo tham số, giá trị trả về, biến và field bằng interface khi có interface phù hợp; nhận ra ba trường hợp dùng class là hợp lý; dùng reflection ở dạng hạn chế (chỉ để tạo instance) và cân nhắc kỹ trước khi viết native method.

**Đọc.** [Item 64 — Tham chiếu đến đối tượng thông qua interface của chúng](#/docs/ej-09) → [Item 65 — Ưu tiên interface hơn reflection](#/docs/ej-09) → [Item 66 — Sử dụng native method một cách thận trọng](#/docs/ej-09). Ở Item 64 đọc lưu ý về \`LinkedHashSet\` và chính sách thứ tự. Ở Item 65 gõ lại chương trình tạo \`Set<String>\` từ tên class trên dòng lệnh, chạy với \`java.util.HashSet\` và \`java.util.TreeSet\`, rồi thử làm nó ném vài trong sáu exception. Item 66 ngắn, đọc câu chuyện \`BigInteger\` và GMP.

**Bẫy.** Đổi \`LinkedHashSet\` sang \`HashSet\` chỉ vì biến đã khai báo kiểu \`Set\`. Nếu code xung quanh dựa vào thứ tự duyệt của \`LinkedHashSet\`, thay thế đó sai — cài đặt mới phải giữ chức năng đặc biệt mà code phụ thuộc. Bẫy thứ hai: viết native method để tăng hiệu năng; sách nói việc này hiếm khi nên làm, và native method còn có thể làm *giảm* hiệu năng vì GC không theo dõi được bộ nhớ native và vào/ra native code có chi phí.

**Tự kiểm tra.** Reflection khiến bạn mất những gì, theo ba gạch đầu dòng của Item 65? Khi không có interface phù hợp, sách khuyên dùng class nào trong hệ thống phân cấp làm kiểu tham chiếu?`,
      },
      {
        id: "ej-w8-4",
        text: "Tối ưu hoá thận trọng và quy ước đặt tên",
        lesson: `**Mục tiêu.** Viết chương trình tốt trước, tránh quyết định thiết kế giới hạn hiệu năng (API, wire-level protocol, định dạng dữ liệu bền vững), đo trước và sau mỗi lần tối ưu; và đặt tên theo quy ước hình thức lẫn ngữ pháp của nền tảng Java.

**Đọc.** [Item 67 — Tối ưu hóa một cách thận trọng](#/docs/ej-09) → [Item 68 — Tuân thủ các quy ước đặt tên được chấp nhận rộng rãi](#/docs/ej-09). Ở Item 67 đọc kỹ ví dụ \`Component.getSize\` trả \`Dimension\` mutable và đoạn vì sao mô hình hiệu năng của Java yếu hơn C/C++. Ở Item 68 thuộc bảng quy ước hình thức, rồi đọc phần quy ước ngữ pháp cho method: \`to\`*Type*, \`as\`*Type*, *type*\`Value\`, và tên static factory.

**Bẫy.** Bóp méo API để lấy hiệu năng. Sách gọi đó là ý tưởng rất tồi: vấn đề hiệu năng có thể biến mất ở bản phát hành sau, còn API méo ở lại mãi mãi. Bẫy thứ hai: tối ưu dựa vào cảm giác — sách nói chương trình dành 90 phần trăm thời gian trong 10 phần trăm code và rất khó đoán đó là chỗ nào; dùng profiler, dùng jmh cho microbenchmark, và xem lại thuật toán trước tiên.

**Tự kiểm tra.** Vì sao sách lập luận nên viết \`HttpUrl\` chứ không phải \`HTTPURL\`? Khi nào dấu gạch dưới được khuyến nghị trong tên, và một \`static final\` field có kiểu tham chiếu mutable có thể là constant field không?`,
      },
    ],
  },
  {
    id: "ej-w9",
    week: "Tuần 9",
    title: "Exception và concurrency",
    goal: "Dùng exception đúng vai: chỉ cho tình huống ngoại lệ, checked cho lỗi khôi phục được, runtime cho lỗi lập trình, exception chuẩn, translation theo mức trừu tượng, detail message ghi nhận thất bại, failure atomicity. Rồi viết code đồng thời đúng: đồng bộ hoá đủ nhưng không quá mức, executor và tiện ích `java.util.concurrent` thay thread thô và `wait`/`notify`, tài liệu hoá mức thread-safe, lazy init đúng idiom, không dựa vào bộ lập lịch.",
    practice: "Trên JDK 17+, gõ lại `StopThread` bản hỏng của Item 78 (field `static boolean stopRequested` không `volatile`), chạy và quan sát nó không dừng sau một giây. Sửa theo hai cách của sách: cặp method `synchronized` cho cả đọc lẫn ghi, rồi field `volatile`; chạy lại để thấy chương trình thoát. Sau đó tìm (hoặc tự viết) một đoạn code chờ nhiều worker xong việc bằng `wait`/`notifyAll`, viết lại bằng `CountDownLatch` theo mẫu method `time` của Item 81, và đo khoảng thời gian bằng `System.nanoTime`.",
    resources: [
      { label: "EJ 10 — Exceptions", href: "#/docs/ej-10" },
      { label: "EJ 11 — Concurrency (Lập trình đồng thời)", href: "#/docs/ej-11" },
      { label: "jbloch/effective-java-3e-source-code — chapter 10, 11", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w9-1",
        text: "Exception cho tình huống ngoại lệ: checked, runtime, exception chuẩn",
        lesson: `**Mục tiêu.** Không dùng exception cho luồng điều khiển, chọn đúng giữa checked exception và runtime exception, biết lúc nào nên thay checked exception bằng optional hoặc method kiểm tra trạng thái, và chọn đúng exception chuẩn trong bảng sáu exception hay tái sử dụng.

**Đọc.** [Item 69 — Chỉ dùng exception cho các tình huống ngoại lệ](#/docs/ej-10) → [Item 70 — Dùng checked exception cho các tình huống có thể khôi phục và runtime exception cho lỗi lập trình](#/docs/ej-10) → [Item 71 — Tránh sử dụng checked exception một cách không cần thiết](#/docs/ej-10) → [Item 72 — Ưu tiên sử dụng các exception chuẩn](#/docs/ej-10). Ở Item 69 đọc kỹ ba điểm sai trong lập luận "vòng lặp dựa trên exception nhanh hơn". Ở Item 71 đọc phép thử "lập trình viên sẽ xử lý exception thế nào". Ở Item 72 thuộc bảng exception và quy tắc chọn giữa \`IllegalStateException\` và \`IllegalArgumentException\`.

**Bẫy.** Định nghĩa subclass của \`Error\`, hoặc một throwable không thuộc \`Exception\`/\`RuntimeException\`/\`Error\`. Sách nói mọi unchecked throwable bạn viết nên là subclass của \`RuntimeException\`; loại throwable "quái dị" kia không có lợi ích gì. Bẫy thứ hai: ném thẳng \`Exception\`, \`RuntimeException\`, \`Throwable\` hay \`Error\` — hãy coi chúng như abstract, vì không thể kiểm tra chúng một cách đáng tin cậy.

**Tự kiểm tra.** Khi nào phải dùng optional hoặc giá trị trả về đặc biệt thay vì method kiểm tra trạng thái kiểu \`hasNext\`? Một checked exception là lý do *duy nhất* khiến method phải nằm trong khối \`try\` thì gây thêm gánh nặng gì, nhất là với stream?`,
      },
      {
        id: "ej-w9-2",
        text: "Translation, tài liệu hoá, detail message, failure atomicity",
        lesson: `**Mục tiêu.** Dịch exception mức thấp sang exception hợp mức trừu tượng (kèm chaining), ghi \`@throws\` cho mọi exception, viết detail message chứa đủ dữ liệu gây lỗi, giữ object ở trạng thái cũ khi method thất bại, và không bao giờ nuốt exception một cách im lặng.

**Đọc.** [Item 73 — Ném exception phù hợp với mức trừu tượng](#/docs/ej-10) → [Item 74 — Ghi tài liệu cho mọi exception mà mỗi method ném ra](#/docs/ej-10) → [Item 75 — Đưa thông tin ghi nhận thất bại vào detail message](#/docs/ej-10) → [Item 76 — Cố gắng đạt được tính nguyên tử khi thất bại](#/docs/ej-10) → [Item 77 — Đừng bỏ qua exception](#/docs/ej-10). Ở Item 73 gõ lại \`get\` của \`AbstractSequentialList\`. Ở Item 75 đọc kỹ constructor \`IndexOutOfBoundsException(lowerBound, upperBound, index)\` giả định. Ở Item 76 nhớ bốn cách đạt failure atomicity.

**Bẫy.** Khai báo \`throws Exception\` cho một method public, hoặc khai báo unchecked exception trong mệnh đề \`throws\`. Sách yêu cầu khai báo riêng từng checked exception, còn unchecked exception chỉ ghi bằng \`@throws\` trong Javadoc để người đọc phân biệt được. Bẫy thứ hai: khối \`catch\` rỗng — nếu thật sự bỏ qua được thì phải có comment giải thích và đặt tên biến là \`ignored\`.

**Tự kiểm tra.** Nếu bỏ phép kiểm tra \`size == 0\` ở đầu \`Stack.pop\`, object rơi vào trạng thái gì và exception ném ra sai ở điểm nào? Vì sao không được đưa mật khẩu hay khoá mã hoá vào detail message?`,
      },
      {
        id: "ej-w9-3",
        text: "Đồng bộ hoá dữ liệu chia sẻ và tránh đồng bộ quá mức",
        lesson: `**Mục tiêu.** Giải thích hai vai trò của đồng bộ hoá (loại trừ lẫn nhau và giao tiếp giữa thread), biết khi nào \`volatile\` đủ và khi nào không, không gọi alien method trong vùng synchronized, và giao việc cho executor thay vì tự quản lý \`Thread\`.

**Đọc.** [Item 78 — Đồng bộ hóa truy cập vào dữ liệu khả biến được chia sẻ](#/docs/ej-11) → [Item 79 — Tránh đồng bộ hóa quá mức](#/docs/ej-11) → [Item 80 — Ưu tiên executor, task và stream hơn thread](#/docs/ej-11). Ở Item 78 gõ ba phiên bản \`StopThread\` và \`generateSerialNumber\` với \`AtomicLong\`. Ở Item 79 gõ \`ObservableSet\` với observer tự gỡ ở \`23\` để thấy \`ConcurrentModificationException\`, rồi bản dùng executor để thấy deadlock, rồi sửa bằng open call hoặc \`CopyOnWriteArrayList\`. Ở Item 80 đọc kỹ vì sao cached thread pool không hợp với server tải nặng.

**Bẫy.** Chỉ đồng bộ hoá method ghi. Sách nói đồng bộ hoá không được bảo đảm hoạt động trừ khi cả đọc lẫn ghi đều được đồng bộ hoá. Bẫy thứ hai: dùng \`volatile int\` cho \`nextSerialNumber++\` — \`++\` không nguyên tử, \`volatile\` chỉ cho tác dụng giao tiếp; đây là safety failure.

**Tự kiểm tra.** Tối ưu hoá hoisting biến vòng \`while (!stopRequested)\` thành gì, và vì sao VM được phép làm vậy? Vì sao reentrant lock có thể biến liveness failure thành safety failure khi bạn gọi alien method trong vùng synchronized?`,
      },
      {
        id: "ej-w9-4",
        text: "Tiện ích concurrency, thread safety, lazy init và bộ lập lịch",
        lesson: `**Mục tiêu.** Dùng concurrent collection và synchronizer thay \`wait\`/\`notify\`, tài liệu hoá đúng cấp độ thread-safe của class, chọn đúng idiom lazy initialization cho static field và instance field, và không bao giờ dựa vào bộ lập lịch thread để chương trình đúng.

**Đọc.** [Item 81 — Ưu tiên các tiện ích concurrency hơn \`wait\` và \`notify\`](#/docs/ej-11) → [Item 82 — Tài liệu hóa tính thread-safe](#/docs/ej-11) → [Item 83 — Sử dụng lazy initialization một cách thận trọng](#/docs/ej-11) → [Item 84 — Đừng phụ thuộc vào bộ lập lịch thread](#/docs/ej-11). Ở Item 81 gõ lại \`intern\` trên \`ConcurrentHashMap\` và method \`time\` với ba \`CountDownLatch\`, rồi đọc idiom vòng lặp \`wait\` chuẩn. Ở Item 82 thuộc năm cấp độ thread-safe và idiom private lock object. Ở Item 83 so ba idiom: synchronized accessor, holder class, double-check.

**Bẫy.** Tưởng thấy \`synchronized\` trong khai báo là method thread-safe. Sách nói đó là chi tiết cài đặt, không phải một phần API, và thread-safe có nhiều cấp độ chứ không phải "có hoặc không". Bẫy thứ hai: dùng double-check mà quên \`volatile\` trên field — sách nói điều đó là tối quan trọng vì lần kiểm tra đầu không khoá; còn với static field thì holder class là lựa chọn tốt hơn double-check.

**Tự kiểm tra.** Vì sao phải gọi \`wait\` trong vòng lặp, kiểm tra điều kiện cả trước lẫn sau khi chờ? Vì sao idiom private lock object không dùng được cho class thread-safe có điều kiện?`,
      },
    ],
  },
  {
    id: "ej-w10",
    week: "Tuần 10",
    title: "Serialization và tổng ôn",
    goal: "Hiểu vì sao hệ thống mới nên tránh Java serialization, và khi buộc phải dùng thì làm đúng: tính giá của `Serializable`, thiết kế custom serialized form, viết `readObject` phòng thủ, kiểm soát instance bằng enum, và dùng serialization proxy. Kết thúc bằng một bản đồ 90 Item của riêng bạn.",
    practice: "Trên JDK 17+, cho singleton `Elvis` dạng public field `implements Serializable` (chưa có `readResolve`), serialize rồi deserialize `Elvis.INSTANCE` qua `ObjectOutputStream`/`ObjectInputStream` trên mảng byte và in `deserialized == Elvis.INSTANCE` để thấy `false` — hai instance. Sửa bằng enum một phần tử, chạy lại để thấy `true`. Sau đó lấy `Period` của Item 50, viết serialization proxy theo Item 90 (`SerializationProxy` lồng private static, `writeReplace`, `readObject` ném `InvalidObjectException`, `readResolve` gọi constructor public), giữ `start`/`end` là `final`, và viết test round-trip kiểm tra bất biến `start <= end` vẫn còn.",
    resources: [
      { label: "EJ 12 — Serialization", href: "#/docs/ej-12" },
      { label: "jbloch/effective-java-3e-source-code — chapter 12", href: "https://github.com/jbloch/effective-java-3e-source-code" },
    ],
    items: [
      {
        id: "ej-w10-1",
        text: "Vì sao tránh Java serialization, và cái giá của `Serializable`",
        lesson: `**Mục tiêu.** Giải thích được vì sao attack surface của deserialization quá lớn để bảo vệ (gadget, gadget chain, deserialization bomb), nêu lựa chọn thay thế (JSON, protobuf) và biện pháp khi buộc phải deserialize, rồi kể được ba chi phí dài hạn của việc implement \`Serializable\`.

**Đọc.** [Item 85 — Ưu tiên các giải pháp thay thế cho Java serialization](#/docs/ej-12) → [Item 86 — Implement \`Serializable\` với sự thận trọng cao độ](#/docs/ej-12). Ở Item 85 đọc kỹ ví dụ \`bomb()\` với 201 \`HashSet\` và đoạn về \`ObjectInputFilter\`. Ở Item 86 đọc kỹ đoạn serial version UID tự sinh, và các quy tắc cho class thiết kế để kế thừa, interface và inner class.

**Bẫy.** Tin rằng bộ lọc deserialization chặn được mọi thứ, hoặc lọc bằng blacklist. Sách khuyên ưu tiên whitelisting vì blacklist chỉ chống được mối đe doạ đã biết, và nói bộ lọc không bảo vệ bạn trước serialization bomb như ví dụ trong Item. Bẫy thứ hai: implement \`Serializable\` cho inner class — serialized form mặc định của nó không được định nghĩa rõ vì synthetic field; chỉ static member class mới nên serializable.

**Tự kiểm tra.** Vì sao deserialize tập \`HashSet\` lồng 100 tầng khiến \`hashCode\` bị gọi hơn 2^100 lần? Nếu không khai báo \`serialVersionUID\`, thêm một method tiện ích vào class gây ra hậu quả gì lúc chạy?`,
      },
      {
        id: "ej-w10-2",
        text: "Custom serialized form và `readObject` phòng thủ",
        lesson: `**Mục tiêu.** Phân biệt biểu diễn vật lý và nội dung logic để quyết định có dùng serialized form mặc định hay không, viết \`writeObject\`/\`readObject\` cho custom form, và viết \`readObject\` như một constructor public: sao chép phòng thủ rồi mới kiểm tra bất biến.

**Đọc.** [Item 87 — Cân nhắc sử dụng custom serialized form](#/docs/ej-12) → [Item 88 — Viết các method \`readObject\` một cách phòng thủ](#/docs/ej-12). Ở Item 87 so \`Name\` (hợp với form mặc định) với \`StringList\` (không hợp), và đọc bốn nhược điểm của form mặc định. Ở Item 88 đọc hai cuộc tấn công \`BogusPeriod\` và \`MutablePeriod\`, rồi danh sách tóm tắt hướng dẫn viết \`readObject\` ở cuối Item.

**Bẫy.** Bỏ lời gọi \`defaultWriteObject\`/\`defaultReadObject\` vì mọi field đều \`transient\`. Đặc tả serialization yêu cầu gọi chúng bất kể thế nào, để phiên bản sau thêm field không transient vẫn tương thích; thiếu nó thì deserialize ở phiên bản cũ sẽ ném \`StreamCorruptedException\`. Bẫy thứ hai: \`readObject\` chỉ kiểm tra bất biến mà không sao chép phòng thủ — \`MutablePeriod\` vẫn "đánh cắp" được tham chiếu \`Date\` bên trong và sửa \`Period\` tuỳ ý.

**Tự kiểm tra.** Phép thử mà sách đưa ra để quyết định \`readObject\` mặc định có chấp nhận được không là gì? Vì sao sửa \`Period\` bằng \`readObject\` phòng thủ buộc phải bỏ \`final\` khỏi \`start\` và \`end\`?`,
      },
      {
        id: "ej-w10-3",
        text: "`readResolve`, enum singleton và serialization proxy",
        lesson: `**Mục tiêu.** Giữ tính singleton qua serialization — ưu tiên enum, và nếu phải dùng \`readResolve\` thì biết điều kiện đi kèm; viết được serialization proxy pattern và nêu hai hạn chế của nó.

**Đọc.** [Item 89 — Để kiểm soát instance, ưu tiên enum type hơn \`readResolve\`](#/docs/ej-12) → [Item 90 — Cân nhắc dùng serialization proxy thay cho các instance được serialize](#/docs/ej-12). Ở Item 89 lần theo cuộc tấn công \`ElvisStealer\` đến kết quả hai \`Elvis\` với gu âm nhạc khác nhau, rồi đọc đoạn về khả năng truy cập của \`readResolve\`. Ở Item 90 gõ đủ bốn mảnh của pattern cho \`Period\`, rồi đọc ví dụ \`EnumSet\` chuyển từ \`RegularEnumSet\` sang \`JumboEnumSet\` khi deserialize.

**Bẫy.** Dựa vào \`readResolve\` mà vẫn để field tham chiếu đối tượng không \`transient\`. Sách nói khi đó kẻ tấn công lấy được tham chiếu tới instance đã deserialize trước khi \`readResolve\` chạy — đúng cách \`ElvisStealer\` làm với \`favoriteSongs\`. Bẫy thứ hai: áp serialization proxy cho class mà người dùng có thể mở rộng, hoặc class có đồ thị đối tượng vòng tròn — đó là hai hạn chế sách nêu rõ.

**Tự kiểm tra.** Khi nào bạn không thể dùng enum mà buộc phải dùng \`readResolve\` để kiểm soát instance? Serialization proxy cho phép \`Period\` giữ gì mà cách sao chép phòng thủ trong \`readObject\` không cho, và cái giá hiệu năng sách đo được là bao nhiêu?`,
      },
      {
        id: "ej-w10-4",
        text: "Tổng ôn 90 Item: bản đồ một trang của riêng bạn",
        lesson: `**Mục tiêu.** Tự viết bản đồ 90 Item theo 11 nhóm (11 chương), mỗi Item một dòng bằng lời của bạn: nó khuyên gì, và một ngoại lệ hoặc điều kiện đi kèm nếu sách có nêu. Bản đồ này là thứ bạn mở ra khi review code.

**Đọc.** Lướt lại tiêu đề H2 của từng chương, chỉ mở lại phần thân khi không nhớ nổi ý chính: [Chương 2 — Tạo và hủy đối tượng](#/docs/ej-02) → [Chương 3 — Các phương thức chung của mọi đối tượng](#/docs/ej-03) → [Chương 4 — Class và Interface](#/docs/ej-04) → [Chương 5 — Generics](#/docs/ej-05) → [Chương 6 — Enum và Annotation](#/docs/ej-06) → [Chương 7 — Lambda và Stream](#/docs/ej-07) → [Chương 8 — Phương thức](#/docs/ej-08) → [Chương 9 — Lập trình tổng quát](#/docs/ej-09) → [Chương 10 — Exceptions](#/docs/ej-10) → [Chương 11 — Concurrency (Lập trình đồng thời)](#/docs/ej-11) → [Chương 12 — Serialization](#/docs/ej-12). Với mỗi chương, đọc lại đoạn tóm tắt cuối từng Item — đó là chỗ sách thường nói rõ khi nào lời khuyên không áp dụng.

**Bẫy.** Học thuộc tiêu đề mà quên ngoại lệ của Item. Tiêu đề nói "ưu tiên", còn thân Item nói khi nào không: Item 42 ưu tiên lambda, nhưng function object cần tham chiếu chính nó (như observer tự gỡ ở Item 79) vẫn phải là anonymous class; Item 89 ưu tiên enum, nhưng class có instance không biết lúc biên dịch vẫn cần \`readResolve\`. Bản đồ chỉ có tiêu đề sẽ dẫn bạn đi review sai.

**Tự kiểm tra.** Ba Item nào bạn áp dụng thường nhất trong code hằng ngày, và vì sao chúng nổi lên? Ba Item nào bạn vừa tìm thấy bị vi phạm trong codebase của mình, ở file nào, và bản sửa theo sách trông ra sao?`,
      },
    ],
  },
];
