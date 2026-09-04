// Lộ trình đọc Modern Java in Action — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Modern Java in Action" (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Thư mục nguồn: modern-java-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần gõ code nằm ở `practice` mức tuần, không thành khối thứ 5 trong `lesson`.
// GIỮ NGUYÊN id (mj-w<N> / mj-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const mjiaWeeksPart1 = [
  {
    id: "mj-w1",
    week: "Tuần 1",
    title: "Java 8+ đổi gì, và ý tưởng truyền hành vi",
    goal: "Nói được sức ép nào buộc Java phải đổi, và refactor được một phương thức cứng nhắc thành một phương thức nhận hành vi làm tham số.",
    practice:
      "Dựng một dự án Java 17+ trống, chép listing \"lọc quả táo xanh\" ở §2.1 vào rồi tự tay đi hết bốn bước refactor của chương (tham số màu → tham số Predicate → anonymous class → lambda), giữ cả bốn phiên bản trong bốn method để so độ dài.",
    resources: [
      { label: "MJIA 01 — Java 8, 9, 10 và 11: có gì mới?", href: "#/docs/mjia-01" },
      { label: "MJIA 02 — Truyền code với behavior parameterization", href: "#/docs/mjia-02" },
      { label: "dev.java — Java Platform", href: "https://dev.java/" },
    ],
    items: [
      {
        id: "mj-w1-1",
        text: "Vì sao một ngôn ngữ 20 năm tuổi vẫn phải đổi",
        lesson: `**Mục tiêu.** Kể được ba sức ép đã buộc Java 8 phải đổi — CPU multicore, dữ liệu lớn, và kỳ vọng viết truy vấn theo phong cách khai báo — rồi gọi tên ba khái niệm lập trình mà chương này dùng làm khung cho cả cuốn sách.

**Đọc.** [1.1. Vậy câu chuyện lớn ở đây là gì?](#/docs/mjia-01) ngắn nhưng đọc kỹ: đoạn so \`Collections.sort\` bọc trong anonymous class với một dòng \`inventory.sort(comparing(Apple::getWeight))\`, và ba gạch đầu dòng cuối mục (Streams API, kỹ thuật truyền code, default method) chính là mục lục của cả chương. Rồi [1.2. Vì sao Java vẫn tiếp tục thay đổi?](#/docs/mjia-01) với năm mục con. [1.2.1. Vị trí của Java trong hệ sinh thái ngôn ngữ lập trình](#/docs/mjia-01) đọc lướt lấy phép ẩn dụ khí hậu ở Hình 1.1. [1.2.2. Stream processing](#/docs/mjia-01) đọc kỹ ví dụ pipe Unix \`cat | tr | sort | tail -3\` và Hình 1.2 — Streams API sau này dựa nguyên vào hình dung đó. [1.2.3. Truyền code cho phương thức với behavior parameterization](#/docs/mjia-01) cho ví dụ sắp xếp mã hoá đơn và Hình 1.3. [1.2.4. Parallelism và dữ liệu chia sẻ có thể thay đổi](#/docs/mjia-01) là mục ngắn nhất nhưng phải đọc chậm nhất. [1.2.5. Java cần tiến hoá](#/docs/mjia-01) khép lại.

**Bẫy.** Nghe "parallelism gần như miễn phí" rồi tưởng không phải trả giá gì. §1.2.4 hỏi thẳng "Bạn phải từ bỏ điều gì?" và trả lời: bạn phải cung cấp hành vi an toàn để chạy đồng thời, thường nghĩa là code không truy cập dữ liệu chia sẻ có thể thay đổi. Bẫy thứ hai: dùng \`synchronized\` để lách quy tắc đó. Sách nói làm vậy là chống lại hệ thống, bởi nó lạm dụng một lớp trừu tượng vốn được tối ưu xoay quanh chính quy tắc ấy — và dùng \`synchronized\` trên nhiều nhân thường tốn kém hơn bạn tưởng rất nhiều, vì đồng bộ hoá buộc code thực thi tuần tự, đi ngược mục tiêu của parallelism.

**Tự kiểm tra.** Trong ví dụ pipe Unix, vì sao \`sort\` có thể xử lý vài dòng đầu trước cả khi \`cat\` và \`tr\` kết thúc? Và theo §1.2.5, Java 8 dịch chuyển khỏi điều gì trong hướng đối tượng cổ điển, và về phía gì?`,
      },
      {
        id: "mj-w1-2",
        text: "Hàm trở thành giá trị hạng nhất",
        lesson: `**Mục tiêu.** Giải thích được "công dân hạng nhất" và "hạng hai" nghĩa là gì trong Java, và viết lại được một anonymous class một phương thức thành method reference rồi thành lambda.

**Đọc.** [1.3. Hàm trong Java](#/docs/mjia-01) — đoạn mở đầu liệt kê những thứ đã là giá trị hạng nhất (primitive, tham chiếu đối tượng) và những thứ là hạng hai (phương thức, class); đọc kỹ vì cả mục dựng trên cặp khái niệm này. [1.3.1. Phương thức và lambda như những công dân hạng nhất](#/docs/mjia-01) đặt cạnh nhau bản lọc file ẩn viết bằng \`new FileFilter() {...}\` và bản một dòng \`File::isHidden\`, kèm Hình 1.4; khung "Lambda: những hàm vô danh" giới thiệu ký pháp \`(int x) -> x + 1\` cùng nguồn gốc chữ lambda. [1.3.2. Truyền code: một ví dụ](#/docs/mjia-01) là ví dụ lọc táo mà chương 2 sẽ mổ xẻ trọn vẹn nên đọc vừa phải, nhưng đừng bỏ khung "Predicate là gì?". [1.3.3. Từ truyền phương thức đến lambda](#/docs/mjia-01) chốt bằng ba biến thể lambda và một lời dặn về giới hạn của chúng.

**Bẫy.** Viết lambda dài rồi tự khen là code đã ngắn gọn. §1.3.3 dặn ngược lại: nếu một lambda dài quá vài dòng, đến mức hành vi của nó không còn rõ ràng ngay lập tức, thì nên dùng method reference tới một phương thức có tên mang tính mô tả — sự rõ ràng của code phải là kim chỉ nam. Bẫy thứ hai: khai \`Function<Apple, Boolean>\` cho một điều kiện boolean. Khung "Predicate là gì?" thừa nhận Java 8 cho phép viết như vậy, nhưng nói rõ \`Predicate<Apple>\` chuẩn mực hơn và còn hiệu quả hơn một chút vì tránh được việc boxing một \`boolean\` thành một \`Boolean\`.

**Tự kiểm tra.** Vì sao sách xếp phương thức và class vào hàng công dân hạng hai của Java, trong khi mảng lại là đối tượng? Và trong bản lọc file ẩn trước Java 8, đúng bao nhiêu dòng "thực sự có ý nghĩa", và vì sao sách gọi chúng là tối nghĩa?`,
      },
      {
        id: "mj-w1-3",
        text: "Stream, default method, và những ý tưởng mượn từ FP",
        lesson: `**Mục tiêu.** Nói được vì sao Streams API kéo theo default method như một hệ quả bắt buộc chứ không phải một tính năng rời, và kể tên hai ý tưởng functional programming mà Java 8 mượn cùng mức độ mượn được tới đâu.

**Đọc.** [1.4. Streams](#/docs/mjia-01) — đặt cạnh nhau đoạn gom giao dịch theo loại tiền tệ bằng vòng lặp lồng nhau và bản một dòng dùng \`groupingBy\`; nắm cặp external iteration / internal iteration. [1.4.1. Đa luồng thì khó](#/docs/mjia-01) với Hình 1.5 (hai thread cùng cộng vào \`sum\`, ra 105 thay vì 108) và Hình 1.6 (fork thao tác filter lên hai CPU rồi nối kết quả); khung "Parallelism trong Java và trạng thái dùng chung không thay đổi" nêu hai "viên đạn thần kỳ" — đọc kỹ, vì chương 7 sẽ đòi lại. [1.5. Default method và Java module](#/docs/mjia-01) đọc chậm: vì sao thêm \`stream\` vào interface \`Collection\` lại là cơn ác mộng cho mọi framework collection thay thế, và default \`sort\` gỡ nút thế nào. [1.6. Những ý tưởng hay khác từ functional programming](#/docs/mjia-01) cho \`Optional<T>\` và pattern matching kèm ví dụ Scala; khung cuối chương "Các tính năng của Java 8, 9, 10 và 11: Bạn nên bắt đầu từ đâu?" đọc lướt là đủ.

**Bẫy.** Coi default method là "đa kế thừa cài đặt, cứ thoải mái dùng". Sách đặt đúng câu hỏi đó ở cuối §1.5 và đáp "đúng vậy, ở một mức độ nào đó", rồi cảnh báo rằng có những quy tắc riêng để ngăn các vấn đề như bài toán kế thừa hình thoi khét tiếng trong C++, và để dành chúng cho chương 13. Bẫy thứ hai: tưởng \`Optional\` tự diệt null-pointer exception. Sách đặt điều kiện rõ ngay trong câu giới thiệu — \`Optional<T>\` giúp bạn tránh được các ngoại lệ null-pointer *nếu được dùng một cách nhất quán*. Với pattern matching thì sách nói thẳng: đáng tiếc là Java 8 không hỗ trợ đầy đủ.

**Tự kiểm tra.** Nếu người thiết kế Java 8 chỉ thêm \`stream\` vào \`Collection\` rồi cài đặt trong \`ArrayList\` thì hỏng ở đâu? Và câu "sai lầm tỷ đô" là của ai, nói về phát minh gì?`,
      },
      {
        id: "mj-w1-4",
        text: "Behavior parameterization: từ thêm tham số tới truyền hành vi",
        lesson: `**Mục tiêu.** Đi được trọn bảy nỗ lực refactor của chương trên code của chính bạn, và nhận ra mẫu behavior parameterization ở bốn chỗ trong Java API mà bạn vốn đã dùng hằng ngày.

**Đọc.** [2.1. Đối phó với các yêu cầu luôn thay đổi](#/docs/mjia-02) với [2.1.1. Nỗ lực đầu tiên: lọc táo màu xanh](#/docs/mjia-02), [2.1.2. Nỗ lực thứ hai: tham số hoá màu sắc](#/docs/mjia-02) và [2.1.3. Nỗ lực thứ ba: lọc theo mọi thuộc tính mà bạn nghĩ ra được](#/docs/mjia-02) — chép cả ba listing ra, vì phần còn lại của chương là chuỗi thao tác sửa chúng. [2.2. Behavior parameterization](#/docs/mjia-02) dựng interface \`ApplePredicate\` và nối nó với design pattern Strategy; [2.2.1. Nỗ lực thứ tư: lọc theo tiêu chí trừu tượng](#/docs/mjia-02) là bước ngoặt của cả chương — đọc kỹ Hình 2.2 và Hình 2.3, rồi tự làm quiz 2.1 trước khi xem đáp án. [2.3. Xử lý sự dài dòng](#/docs/mjia-02) cùng [2.3.1. Anonymous class](#/docs/mjia-02), [2.3.2. Nỗ lực thứ năm: dùng một anonymous class](#/docs/mjia-02), [2.3.3. Nỗ lực thứ sáu: dùng một lambda expression](#/docs/mjia-02) và [2.3.4. Nỗ lực thứ bảy: trừu tượng hoá trên kiểu List](#/docs/mjia-02); Hình 2.4 tóm tắt cả hành trình. Kết bằng [2.4. Các ví dụ thực tế](#/docs/mjia-02) với bốn mục con Comparator, Runnable, Callable và xử lý sự kiện GUI.

**Bẫy.** Gộp mọi tiêu chí vào một phương thức rồi thêm một cờ \`boolean\` để phân nhánh. Sách chặn ngay lúc vừa gợi ý: "Nhưng đừng bao giờ làm thế!" — rồi cho xem code phía client thành \`filterApples(inventory, GREEN, 0, true)\` và hỏi \`true\` với \`false\` nghĩa là gì, trước khi kết luận giải pháp này cực kỳ tệ. Bẫy thứ hai: đọc \`this\` bên trong một anonymous class như thể nó trỏ về class bao ngoài. Quiz 2.2 gọi đó là câu đố Java kinh điển khiến hầu hết lập trình viên phải bất ngờ: đáp án là 5, vì \`this\` tham chiếu tới chính \`Runnable\` bao quanh.

**Tự kiểm tra.** Nỗ lực thứ hai đã vi phạm nguyên tắc kỹ nghệ phần mềm nào? Và ở nỗ lực thứ tư, phần code duy nhất thực sự quan trọng nằm ở đâu?`,
      },
    ],
  },
  {
    id: "mj-w2",
    week: "Tuần 2",
    title: "Lambda expression và functional interface",
    goal: "Viết được lambda ở đúng chỗ ngôn ngữ cho phép, chọn đúng functional interface có sẵn, và đọc được thông báo lỗi kiểu của compiler mà không phải đoán.",
    practice:
      "Viết lại execute-around pattern ở §3.3 cho một tài nguyên thật trong code của bạn (kết nối DB, file, HTTP client); rồi thay `Runnable` bằng một functional interface tự khai có kiểu trả về, và ghép hai hàm bằng `andThen` để thấy khác biệt.",
    resources: [
      { label: "MJIA 03 — Lambda expressions", href: "#/docs/mjia-03" },
    ],
    items: [
      {
        id: "mj-w2-1",
        text: "Lambda là gì, và vì sao chỉ dùng được ở chỗ có functional interface",
        lesson: `**Mục tiêu.** Phân tách được một lambda thành ba phần, phân biệt lambda dạng biểu thức với lambda dạng khối, và trả lời được câu hỏi "chỗ này có dùng lambda được không" bằng cách đi tìm functional interface trong ngữ cảnh.

**Đọc.** [3.1. Tổng quan nhanh về lambda](#/docs/mjia-03) — bốn tính từ anonymous / function / passed around / concise, Hình 3.1, và Listing 3.1 với năm lambda hợp lệ; tự làm quiz 3.1 trước khi xem đáp án, vì hai câu sai ở đó đúng là hai lỗi cú pháp bạn sẽ tự mắc. Bảng 3.1 chép ra sáu tình huống sử dụng. [3.2. Dùng lambda ở đâu và như thế nào](#/docs/mjia-03) đặt câu trả lời một câu, rồi [3.2.1. Functional interface](#/docs/mjia-03) định nghĩa nó — định nghĩa ngắn, nhưng khung "Ghi chú" ngay sau đó mới là chỗ dễ sai; làm quiz 3.2. [3.2.2. Function descriptor](#/docs/mjia-03) dựng ký hiệu \`() -> void\` và \`(Apple, Apple) -> int\` mà cả chương sẽ dùng lại; đọc khung "Lambda và lời gọi phương thức trả về void", làm quiz 3.3, rồi đóng lại bằng khung "Còn \`@FunctionalInterface\` thì sao?".

**Bẫy.** Đếm số phương thức của một interface để kết luận nó có phải functional interface hay không. Khung Ghi chú nói rõ một interface vẫn là functional interface kể cả khi nó có nhiều default method, miễn là chỉ khai báo đúng một phương thức *trừu tượng*; ngược chiều, quiz 3.2 cho thấy \`SmartAdder extends Adder\` không phải functional interface vì nó có hai phương thức trừu tượng cùng tên \`add\`. Bẫy thứ hai: tưởng lambda chỉ cần đúng kiểu tham số là dùng được. Quiz 3.3 bác lại bằng \`Predicate<Apple> p = (Apple a) -> a.getWeight();\` — không hợp lệ, vì chữ ký \`(Apple) -> Integer\` khác với \`(Apple) -> boolean\` của phương thức \`test\`.

**Tự kiểm tra.** Trong \`() -> {}\` và \`(String s) -> { "Iron Man"; }\`, cái nào không hợp lệ và sửa thế nào? Và vì sao nhà thiết kế Java chọn functional interface thay vì thêm function type vào ngôn ngữ?`,
      },
      {
        id: "mj-w2-2",
        text: "Execute-around, và bộ functional interface có sẵn của JDK",
        lesson: `**Mục tiêu.** Áp dụng được bốn bước của execute-around pattern lên một tài nguyên thật, và chọn đúng functional interface trong \`java.util.function\` cho một function descriptor cho trước.

**Đọc.** [3.3. Đưa lambda vào thực tế: execute-around pattern](#/docs/mjia-03) mở bằng Hình 3.2 và đoạn \`processFile\` chỉ đọc được một dòng, rồi bốn mục con [3.3.1. Bước 1: Nhớ lại behavior parameterization](#/docs/mjia-03), [3.3.2. Bước 2: Dùng một functional interface để truyền hành vi](#/docs/mjia-03), [3.3.3. Bước 3: Thực thi một hành vi!](#/docs/mjia-03) và [3.3.4. Bước 4: Truyền lambda](#/docs/mjia-03) — gõ lại cả bốn bước, đây là phần thực hành của tuần; Hình 3.3 tóm tắt. Sang [3.4. Sử dụng functional interface](#/docs/mjia-03) với [3.4.1. Predicate](#/docs/mjia-03), [3.4.2. Consumer](#/docs/mjia-03) và [3.4.3. Function](#/docs/mjia-03) — mỗi mục một listing ngắn, gõ cả ba. Khung "Chuyên biệt hoá cho primitive (primitive specializations)" đọc chậm. Bảng 3.2 là bảng tra cứu bạn sẽ quay lại suốt phần còn lại của sách, chép ra giấy; bảng 3.3 ghép tình huống với interface. Làm quiz 3.4.

**Bẫy.** Viết một lambda ném checked exception rồi truyền cho một API có sẵn. Khung "Còn ngoại lệ, lambda và functional interface thì sao?" nói thẳng: không có functional interface nào cho phép ném ra một checked exception, và bạn chỉ có hai lựa chọn — tự khai một functional interface có \`throws\`, đúng như \`BufferedReaderProcessor\` ở §3.3, hoặc bọc thân lambda trong một khối \`try/catch\`. Bẫy thứ hai: mặc định dùng \`Predicate<Integer>\` cho số. Khung chuyên biệt hoá cho primitive chỉ rõ cái giá: giá trị đã box là một lớp bọc nằm trên heap, tốn thêm bộ nhớ và thêm những lần truy xuất để lấy lại giá trị primitive — \`IntPredicate\` tránh được việc box đối số 1000, còn \`Predicate<Integer>\` thì không.

**Tự kiểm tra.** Ở bước 2, vì sao phải tự khai \`BufferedReaderProcessor\` thay vì dùng \`Function<BufferedReader, String>\`? Và function descriptor \`(int, int) -> int\` ứng với interface nào trong bảng 3.2?`,
      },
      {
        id: "mj-w2-3",
        text: "Kiểm tra kiểu, suy luận kiểu, và luật effectively final",
        lesson: `**Mục tiêu.** Đi lại được năm bước mà compiler dùng để kiểm tra một lambda, và giải thích được vì sao lambda capture biến cục bộ thì bị ràng buộc còn capture biến thể hiện thì không.

**Đọc.** [3.5. Kiểm tra kiểu, suy luận kiểu và các hạn chế](#/docs/mjia-03) mở đầu bằng câu hỏi kiểu của một lambda là gì. [3.5.1. Kiểm tra kiểu (type checking)](#/docs/mjia-03) cho khái niệm target type và năm bước ở Hình 3.4 — chép cả năm bước ra, đây là thứ bạn sẽ chạy trong đầu mỗi lần compiler báo lỗi lambda; chú ý câu cuối mục về mệnh đề \`throws\`. [3.5.2. Cùng một lambda, những functional interface khác nhau](#/docs/mjia-03) gán cùng một lambda cho \`Comparator\`, \`ToIntBiFunction\` và \`BiFunction\`; khung "Toán tử diamond" lướt được, nhưng khung "Quy tắc đặc biệt về tính tương thích với void" thì không. Làm quiz 3.5 rồi đọc trọn đáp án, gồm cả phần khử mơ hồ giữa hai overload bằng ép kiểu. [3.5.3. Suy luận kiểu (type inference)](#/docs/mjia-03) ngắn. [3.5.4. Sử dụng biến cục bộ](#/docs/mjia-03) đọc chậm nhất, cùng hai khung "Các hạn chế đối với biến cục bộ" và "Closure".

**Bẫy.** Nghĩ lambda giữ tham chiếu tới biến cục bộ nên sửa biến đó về sau vẫn thấy giá trị mới. Khung Closure sửa thẳng: hãy nghĩ rằng lambda bao đóng lên *giá trị* chứ không phải lên *biến* — Java cài đặt việc truy cập một biến cục bộ tự do thành truy cập vào một *bản sao* của nó, vì biến cục bộ sống trên stack và ngầm định bị giới hạn trong thread của nó; do đó biến phải final hoặc effectively final. Bẫy thứ hai: gán một lambda cho \`Object\`. Quiz 3.5 cho thấy \`Object o = () -> { ... };\` không biên dịch được vì \`Object\` không phải functional interface; sửa bằng cách đổi target type sang \`Runnable\` hoặc ép kiểu tường minh.

**Tự kiểm tra.** Vì sao \`Predicate<String> p = (String s) -> list.add(s);\` và \`Consumer<String> b = (String s) -> list.add(s);\` đều hợp lệ dù \`add\` trả về \`boolean\`? Và khi hai overload nhận hai functional interface có cùng function descriptor, bạn khử mơ hồ bằng cách nào?`,
      },
      {
        id: "mj-w2-4",
        text: "Method reference, constructor reference, và ghép lambda",
        lesson: `**Mục tiêu.** Refactor được một lambda bất kỳ sang method reference theo đúng một trong ba công thức, và ghép Comparator, Predicate hay Function mà không đọc sai thứ tự áp dụng.

**Đọc.** [3.6. Method reference](#/docs/mjia-03) rồi [3.6.1. Tổng quan nhanh](#/docs/mjia-03) — bảng 3.4, khung "Công thức xây dựng method reference" với ba loại, và Hình 3.5; làm quiz 3.6 để chắc rằng bạn phân biệt được loại 2 với loại 3. [3.6.2. Constructor reference](#/docs/mjia-03) đi từ \`Supplier<Apple>\` qua \`Function\` tới \`BiFunction\`, kết bằng ví dụ \`Map\` chứa các constructor và quiz 3.7. [3.7. Đưa lambda và method reference vào thực tế](#/docs/mjia-03) là bốn bước rút gọn dần từ class \`AppleComparator\` xuống \`inventory.sort(comparing(Apple::getWeight))\` — gõ lại cả bốn bước, từ [3.7.1. Bước 1: Truyền code](#/docs/mjia-03) tới [3.7.4. Bước 4: Dùng method reference](#/docs/mjia-03). [3.8. Những phương thức hữu ích để kết hợp lambda expression](#/docs/mjia-03) với [3.8.1. Kết hợp các Comparator](#/docs/mjia-03), [3.8.2. Kết hợp các Predicate](#/docs/mjia-03) và [3.8.3. Kết hợp các Function](#/docs/mjia-03) là trọng tâm nửa sau; Hình 3.6 và Hình 3.7 đáng dừng lại. [3.9. Những ý tưởng tương tự từ toán học](#/docs/mjia-03) đọc lướt.

**Bẫy.** Đọc chuỗi \`redApple.and(...).or(...)\` theo thứ tự ưu tiên quen thuộc của \`&&\` và \`||\`. §3.8.2 nói rõ chuỗi \`and\` với \`or\` được ưu tiên từ trái sang phải, không có gì tương đương với việc đặt dấu ngoặc: \`a.or(b).and(c)\` phải đọc là \`(a || b) && c\`, còn \`a.and(b).or(c)\` là \`(a && b) || c\`. Bẫy thứ hai: nhầm \`andThen\` với \`compose\`. §3.8.3 lấy đúng cặp \`f = x -> x + 1\` và \`g = x -> x * 2\`: \`f.andThen(g).apply(1)\` cho 4 vì nó là \`g(f(x))\`, còn \`f.compose(g).apply(1)\` cho 3 vì nó là \`f(g(x))\`.

**Tự kiểm tra.** \`String::substring\` thay cho lambda \`(str, i) -> str.substring(i)\` thuộc loại method reference thứ mấy, và vì sao không phải loại 3? Và \`thenComparing\` chỉ có tác dụng khi nào?`,
      },
    ],
  },
  {
    id: "mj-w3",
    week: "Tuần 3",
    title: "Stream: khái niệm và bộ thao tác trung gian",
    goal: "Diễn đạt được một truy vấn xử lý dữ liệu bằng stream thay vì vòng lặp, và biết thao tác nào lười, thao tác nào short-circuit, thao tác nào giữ trạng thái.",
    practice:
      "Lấy một class domain thật trong dự án của bạn, dựng danh sách ~20 phần tử, rồi viết bằng stream tám truy vấn của §5.6 (\"Đưa tất cả vào thực hành\" — Listing 5.1–5.8); sau đó chạy lại đúng tám truy vấn đó bằng vòng lặp `for` và so số dòng.",
    resources: [
      { label: "MJIA 04 — Giới thiệu về stream", href: "#/docs/mjia-04" },
      { label: "MJIA 05 — Làm việc với stream", href: "#/docs/mjia-05" },
    ],
    items: [
      {
        id: "mj-w3-1",
        text: "Stream là gì, và ba điểm nó khác collection",
        lesson: `**Mục tiêu.** Định nghĩa stream bằng đúng ba thành phần mà sách dùng, và nói được ba khác biệt với collection: thời điểm tính toán, số lần duyệt được, và ai giữ vòng lặp.

**Đọc.** [4.1. Stream là gì?](#/docs/mjia-04) — đặt cạnh nhau bản Java 7 với "biến rác" \`lowCaloricDishes\` và bản Java 8 năm dòng; ghi lại ba tính từ khai báo, kết hợp được, song song hoá được. Danh sách \`menu\` chín món ở cuối mục là dữ liệu cho mọi ví dụ của chương 4 và 5, gõ nó vào IDE ngay bây giờ. [4.2. Bắt đầu với stream](#/docs/mjia-04) cho định nghĩa ba phần — dãy phần tử, source, các thao tác xử lý dữ liệu — cộng hai đặc điểm pipelining và internal iteration; bám Hình 4.2 và đọc kỹ câu nói rằng không một phần tử nào của \`menu\` được chọn cho tới khi \`collect\` được gọi. [4.3. Stream so với collection](#/docs/mjia-04) với phép ẩn dụ DVD so với xem qua internet và Hình 4.3. [4.3.1. Chỉ duyệt được một lần](#/docs/mjia-04) ngắn nhưng bắt buộc. [4.3.2. External iteration so với internal iteration](#/docs/mjia-04) với ba listing, đoạn hội thoại dọn đồ chơi và Hình 4.4; làm quiz 4.1.

**Bẫy.** Giữ một biến \`Stream\` rồi dùng lại nó. §4.3.1 nói stream chỉ duyệt được một lần, sau đó bị coi là đã tiêu thụ: gọi \`forEach\` lần thứ hai trên cùng một stream ném \`IllegalStateException: stream has already been operated upon or closed\` — và nếu source là một kênh I/O chứ không phải collection thì bạn còn không lấy lại được stream mới. Bẫy thứ hai: hiểu chữ "iterator cao cấp" ở đầu chương theo nghĩa đen. Sách dùng nó như hình dung tạm rồi bác lại ở §4.3: khác biệt thật nằm ở *thời điểm mọi thứ được tính toán* — collection dựng háo hức, mọi phần tử phải được tính trước khi vào; stream dựng lười, tính theo yêu cầu. Vì thế cố dựng một collection chứa mọi số nguyên tố sẽ chạy mãi mà không bao giờ xong.

**Tự kiểm tra.** Trong phép ẩn dụ DVD so với streaming, hai lý do nào khiến trình phát không thể coi stream là collection? Và theo §4.3.2, chọn external iteration bằng for-each là bạn đã tự cam kết điều gì?`,
      },
      {
        id: "mj-w3-2",
        text: "Thao tác trung gian, thao tác kết thúc, và tính lười",
        lesson: `**Mục tiêu.** Nhìn một pipeline là chỉ ngay được đâu là thao tác trung gian, đâu là thao tác kết thúc, và dự đoán đúng thứ tự cùng số lần các lambda được gọi.

**Đọc.** [4.4. Các thao tác stream](#/docs/mjia-04) tách hai nhóm bằng đúng một tiêu chí — kiểu trả về có phải stream hay không — kèm Hình 4.5. [4.4.1. Intermediate operation](#/docs/mjia-04) là mục đọc chậm nhất tuần: gõ lại đoạn code có \`System.out.println\` bên trong \`filter\` và \`map\`, chạy nó, rồi so kết quả in ra với dự đoán của bạn trước khi đọc phần giải thích; hai từ khoá rút ra là short-circuiting và loop fusion. [4.4.2. Terminal operation](#/docs/mjia-04) ngắn, chỉ cần nắm rằng kết quả là bất kỳ giá trị nào không phải stream, kể cả \`void\`; làm quiz 4.2. [4.4.3. Làm việc với stream](#/docs/mjia-04) gói lại thành ba thành phần và nối sang builder pattern. Bảng 4.1 và bảng 4.2 là bảng tra cứu tối thiểu — chương 5 sẽ mở rộng chúng thành bảng 5.1, nên đừng học thuộc ở đây. [4.5. Lộ trình phía trước](#/docs/mjia-04) chỉ vài dòng, đọc để biết chương 6 sẽ làm gì với \`collect\`.

**Bẫy.** Tưởng mỗi thao tác trung gian là một lượt duyệt riêng trên toàn bộ dữ liệu. Kết quả in ra của ví dụ §4.4.1 bác điều đó: \`filter\` và \`map\` tuy là hai thao tác riêng biệt nhưng được gộp vào cùng một lượt duyệt — sách gọi kỹ thuật này là loop fusion — và dù thực đơn có nhiều món trên 300 calo, chỉ ba món đầu tiên bị lọc, vì \`limit\` short-circuit cả pipeline. Bẫy thứ hai: giữ lại chính kỹ thuật debug đó trong code chạy thật. Sách rào ngay khi giới thiệu nó rằng in ra từ bên trong lambda là phong cách lập trình tồi tệ đối với code chạy thật, chỉ dùng để nhìn thấy thứ tự tính toán trong lúc học.

**Tự kiểm tra.** Một pipeline chỉ gồm \`filter\` và \`map\`, không có thao tác kết thúc, thì in ra gì khi chạy, và vì sao? Và trong quiz 4.2, vì sao \`count\` là thao tác kết thúc còn \`limit\` thì không?`,
      },
      {
        id: "mj-w3-3",
        text: "filter, slicing, map và flatMap",
        lesson: `**Mục tiêu.** Chọn đúng giữa \`filter\` và cặp \`takeWhile\`/\`dropWhile\` dựa trên việc source đã sắp xếp hay chưa, và nhận ra ngay khi nào một bài toán cần \`flatMap\` chứ không phải \`map\`.

**Đọc.** [5.1. Filtering](#/docs/mjia-05) với [5.1.1. Filtering với một predicate](#/docs/mjia-05) và [5.1.2. Filtering các phần tử duy nhất](#/docs/mjia-05) — ngắn, nhưng ghi lại rằng \`distinct\` dựa trên phần cài đặt \`hashcode\` và \`equals\` của phần tử. [5.2. Cắt lát (slicing) một stream](#/docs/mjia-05) là phần Java 9: [5.2.1. Slicing bằng một predicate](#/docs/mjia-05) chạy \`takeWhile\` và \`dropWhile\` trên \`specialMenu\` vốn đã sắp theo calo — chạy cả hai để thấy chúng bù nhau; [5.2.2. Cắt ngắn (truncating) một stream](#/docs/mjia-05) và [5.2.3. Bỏ qua phần tử](#/docs/mjia-05) cho \`limit(n)\` và \`skip(n)\`; làm quiz 5.1. [5.3. Mapping](#/docs/mjia-05) với [5.3.1. Áp dụng một hàm lên từng phần tử của stream](#/docs/mjia-05) rồi [5.3.2. Làm phẳng (flattening) stream](#/docs/mjia-05) — mục đáng dừng lâu nhất: bám ba lần thử liên tiếp và cặp Hình 5.5 với Hình 5.6. Làm cả ba câu quiz 5.2, nhất là câu sinh các cặp số.

**Bẫy.** Dùng \`map(word -> word.split(""))\` rồi tưởng đã có một stream các ký tự. Sách gọi thẳng Hình 5.5 là dùng map sai cách: lambda trả về \`String[]\` nên bạn nhận \`Stream<String[]>\`; vá bằng \`map(Arrays::stream)\` lại cho \`List<Stream<String>>\`, và chỉ \`flatMap\` mới ánh xạ mỗi mảng thành *nội dung* của stream rồi hợp nhất tất cả thành một stream duy nhất. Bẫy thứ hai: quen tay dùng \`filter\` trên một source đã sắp xếp. §5.2.1 nêu đúng nhược điểm: \`filter\` phải lặp qua toàn bộ stream và áp predicate lên từng phần tử, còn \`takeWhile\` dừng ngay khi gặp phần tử đầu tiên không thoả — khác biệt trở nên đáng kể với stream rất nhiều phần tử hoặc vô hạn.

**Tự kiểm tra.** \`dropWhile\` vứt bỏ những phần tử nào, và nó ngừng vứt khi nào? Và vì sao \`limit\` trên một stream không có thứ tự (source là \`Set\`) lại không cho bạn quyền giả định thứ tự của kết quả?`,
      },
      {
        id: "mj-w3-4",
        text: "Finding/matching short-circuit, và reduce",
        lesson: `**Mục tiêu.** Chọn đúng giữa \`anyMatch\`, \`allMatch\`, \`noneMatch\` và giữa \`findFirst\` với \`findAny\`, rồi viết được một phép reduce hợp lệ để chạy song song.

**Đọc.** [5.4. Finding và matching](#/docs/mjia-05) với [5.4.1. Kiểm tra xem một predicate có khớp với ít nhất một phần tử hay không](#/docs/mjia-05) và [5.4.2. Kiểm tra xem một predicate có khớp với tất cả các phần tử hay không](#/docs/mjia-05), kèm khung "Đánh giá kiểu short-circuiting" — khung này giải thích vì sao những phép toán đó biến được stream vô hạn thành hữu hạn. [5.4.3. Tìm một phần tử](#/docs/mjia-05) giới thiệu \`Optional<T>\` cùng bốn phương thức \`isPresent\`, \`ifPresent\`, \`get\`, \`orElse\`; [5.4.4. Tìm phần tử đầu tiên](#/docs/mjia-05) cho khái niệm encounter order và khung "Khi nào dùng findFirst và findAny". [5.5. Reducing](#/docs/mjia-05) với [5.5.1. Tính tổng các phần tử](#/docs/mjia-05) — bám Hình 5.7 và tự chạy tay chuỗi tích luỹ 0, 4, 9, 12, 21 — và [5.5.2. Giá trị lớn nhất và nhỏ nhất](#/docs/mjia-05); hai khung "Lợi ích của phương thức reduce và tính song song" cùng "Các phép toán stream: stateless và stateful" đều bắt buộc. Bảng 5.1 là bảng tra cứu của cả phần stream. [5.6. Đưa tất cả vào thực hành](#/docs/mjia-05) — tự giải tám truy vấn trước, rồi mới đối chiếu Listing 5.1 đến 5.8.

**Bẫy.** Giữ thói quen cộng dồn vào một biến tích luỹ rồi chỉ đổi \`stream()\` thành \`parallelStream()\`. Sách gọi mẫu hình dùng bộ tích luỹ mutable là một ngõ cụt cho việc song song hoá, và cảnh báo rằng nếu bạn thêm phần đồng bộ hoá cần thiết thì tranh chấp giữa các thread sẽ cướp đi toàn bộ hiệu năng lẽ ra parallelism mang lại; lambda truyền cho \`reduce\` không được thay đổi trạng thái, và phép toán phải có tính kết hợp và giao hoán. Bẫy thứ hai: nối chuỗi bằng \`reduce("", (n1, n2) -> n1 + n2)\`. Ngay dưới Listing 5.4 sách nhận rằng lời giải này không hiệu quả — mỗi lần lặp tạo ra một đối tượng \`String\` mới — và chỉ sang \`collect(joining())\`, thứ dùng \`StringBuilder\` bên trong.

**Tự kiểm tra.** Vì sao biến thể \`reduce\` không có giá trị khởi tạo lại trả về \`Optional\`? Và vì sao \`findAny\` được ưu tiên hơn \`findFirst\` khi chạy song song?`,
      },
      {
        id: "mj-w3-5",
        text: "Numeric stream tránh boxing, và các cách dựng stream",
        lesson: `**Mục tiêu.** Viết được một phép tính số trên stream mà không tốn chi phí boxing, và dựng được stream từ giá trị, mảng, file và hàm sinh — kể cả stream vô hạn — mà chương trình vẫn dừng.

**Đọc.** [5.7. Numeric stream](#/docs/mjia-05) mở đầu bằng lý do interface \`Stream\` không định nghĩa \`sum\`. [5.7.1. Các phiên bản chuyên biệt hoá cho primitive](#/docs/mjia-05) cho \`IntStream\`, \`LongStream\`, \`DoubleStream\`, cặp \`mapToInt\` với \`boxed\`, và phần "Giá trị mặc định: OptionalInt" — đọc kỹ phần này. [5.7.2. Dải số (numeric range)](#/docs/mjia-05) ngắn nhưng có một con số đáng nhớ: 50 so với 49. [5.7.3. Đưa numeric stream vào thực hành: bộ ba Pythagore](#/docs/mjia-05) nên đọc như một bài tập dựng dần — tự viết từng bước trước khi xem lời giải cuối. [5.8. Xây dựng stream](#/docs/mjia-05) với [5.8.1. Stream từ các giá trị](#/docs/mjia-05), [5.8.2. Stream từ đối tượng có thể null](#/docs/mjia-05), [5.8.3. Stream từ mảng](#/docs/mjia-05), [5.8.4. Stream từ file](#/docs/mjia-05) và [5.8.5. Stream từ hàm: tạo ra các stream vô hạn!](#/docs/mjia-05) — mục cuối nặng nhất, làm quiz 5.4 ở đó. [5.9. Tổng quan](#/docs/mjia-05) chỉ vài dòng.

**Bẫy.** Chặn một stream vô hạn bằng \`filter\`. §5.8.5 dựng đúng bẫy này: \`IntStream.iterate(0, n -> n + 4).filter(n -> n < 100)\` trông hợp lý nhưng sách nói thẳng đoạn code đó sẽ không bao giờ kết thúc, vì không có cách nào để \`filter\` biết rằng các số cứ tiếp tục tăng; phải dùng \`takeWhile\`, hoặc bản \`iterate\` ba đối số của Java 9. Bẫy thứ hai: viết một \`Supplier\` có trạng thái cho \`generate\` vì nó gọn. Sách cảnh báo ngay khi trình bày \`IntSupplier\` Fibonacci rằng một supplier có trạng thái thì không an toàn để dùng trong code song song, và nói rõ nó được đưa vào cho đầy đủ nhưng nói chung nên tránh dùng.

**Tự kiểm tra.** \`sum\` trên một \`IntStream\` rỗng trả về 0, còn \`max\` lại trả về \`OptionalInt\` — vì sao không để \`max\` trả về 0? Và trong lời giải bộ ba Pythagore, vì sao phải dùng \`mapToObj\` chứ không phải \`map\`?`,
      },
    ],
  },
];
