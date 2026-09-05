// Lộ trình đọc Modern Java in Action — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Modern Java in Action" (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Thư mục nguồn: sources/modern-java/
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
  {
    id: "mj-w4",
    week: "Tuần 4",
    title: "Collector — thu thập, nhóm, phân hoạch",
    goal: "Diễn đạt được một phép gom nhóm nhiều tầng bằng collector thay vì vòng lặp lồng nhau, và biết khi nào phải tự cài đặt interface Collector thay vì ghép các factory method có sẵn.",
    practice:
      "Lấy ba vòng lặp `for` gom nhóm trong code thật của bạn và viết lại bằng `groupingBy` kèm downstream collector (`counting`, `mapping`, `summingInt`); giữ cả hai bản và so kết quả trên cùng dữ liệu đầu vào.",
    resources: [
      { label: "MJIA 06 — Thu thập dữ liệu với stream", href: "#/docs/mjia-06" },
    ],
    items: [
      {
        id: "mj-w4-1",
        text: "Collector làm gì ở cuối pipeline: đếm, tổng, nối chuỗi, reduce",
        lesson: `**Mục tiêu.** Nói được \`collect\` khác \`reduce\` ở đâu, chọn đúng collector cho bốn phép tổng hợp thường gặp (đếm, tổng, trung bình, nối chuỗi), và giải thích được vì sao tất cả chúng chỉ là chuyên biệt hoá của \`reducing\`.

**Đọc.** [6.1. Tổng quan nhanh về collector](#/docs/mjia-06) mở bằng Listing 6.1 — vòng lặp gom giao dịch theo loại tiền tệ — đặt cạnh một dòng \`collect(groupingBy(Transaction::getCurrency))\`; giữ cặp này trong đầu, cả chương là phần khai triển của nó. [6.1.1. Collector như những phép reduction nâng cao](#/docs/mjia-06) với Hình 6.1; [6.1.2. Các collector định nghĩa sẵn](#/docs/mjia-06) chỉ liệt kê ba nhóm chức năng, đọc lướt. Sang [6.2. Reduce và summarize](#/docs/mjia-06) rồi bốn mục con: [6.2.1. Tìm giá trị lớn nhất và nhỏ nhất trong một stream các giá trị](#/docs/mjia-06), [6.2.2. Summarization](#/docs/mjia-06) — gõ lại ví dụ \`summarizingInt\` và xem dòng \`IntSummaryStatistics\` in ra, [6.2.3. Nối chuỗi (joining String)](#/docs/mjia-06) ngắn, và [6.2.4. Summarization tổng quát với reduction](#/docs/mjia-06) là mục đọc chậm nhất: ba đối số của \`reducing\`, khung "collect so với reduce", khung "Sự linh hoạt của Collection framework: làm cùng một việc theo nhiều cách khác nhau" và khung "Chọn giải pháp tốt nhất cho tình huống của bạn". Làm quiz 6.1 rồi đọc trọn đáp án.

**Bẫy.** Dùng \`reduce\` với một \`ArrayList\` làm accumulator để thay \`toList\`. Khung "collect so với reduce" gọi đó là lạm dụng sai phương thức: \`reduce\` được thiết kế cho một phép reduction bất biến, còn đoạn code kia thay đổi tại chỗ chính cái \`List\` dùng làm accumulator — hệ quả thực tiễn là nó không hoạt động song song được, vì nhiều thread cùng sửa đồng thời một cấu trúc dữ liệu có thể làm hỏng chính \`List\` đó. Bẫy thứ hai: khoe \`reducing\` ở chỗ đã có collector chuyên biệt. Đáp án quiz 6.1 nói rõ hai biến thể \`reducing\` chỉ để minh hoạ tính tổng quát, còn xét mọi mục đích thực tiễn thì luôn nên dùng \`joining\`, vì lý do cả tính dễ đọc lẫn hiệu năng.

**Tự kiểm tra.** Vì sao \`reducing\` phiên bản một đối số trả về \`Optional\` còn phiên bản ba đối số thì không? Và \`counting()\` thật ra được cài đặt bằng đúng lời gọi \`reducing\` nào?`,
      },
      {
        id: "mj-w4-2",
        text: "groupingBy nhiều tầng và downstream collector",
        lesson: `**Mục tiêu.** Dựng được một \`Map\` hai tầng bằng cách lồng \`groupingBy\`, và chọn đúng downstream collector — \`counting\`, \`summingInt\`, \`mapping\`, \`filtering\`, \`flatMapping\`, \`collectingAndThen\` — cho việc cần làm bên trong từng nhóm.

**Đọc.** [6.3. Grouping](#/docs/mjia-06) mở bằng \`groupingBy(Dish::getType)\` và khái niệm hàm phân loại, kèm Hình 6.4; ghi lại lý do vì sao có lúc phải viết lambda thay vì method reference. [6.3.1. Thao tác trên các phần tử đã được nhóm](#/docs/mjia-06) là mục đọc chậm nhất: chạy cả bản lọc-trước-khi-nhóm lẫn bản dùng \`filtering\` rồi so hai \`Map\` in ra, sau đó tới \`mapping\` và \`flatMapping\` với ví dụ \`dishTags\`. [6.3.2. Nhóm nhiều tầng (Multilevel grouping)](#/docs/mjia-06) với Listing 6.2 và Hình 6.5 — hình dung "các rổ" ở cuối mục là thứ đáng nhớ nhất. [6.3.3. Thu thập dữ liệu trong các nhóm con](#/docs/mjia-06) cho \`counting\`, \`maxBy\`, khung "Ghi chú", khung "Điều chỉnh kết quả của collector sang một kiểu khác" với Listing 6.3, Hình 6.6, và khung "Các ví dụ khác về collector được dùng kết hợp với groupingBy".

**Bẫy.** Lọc trước rồi mới nhóm. Sách chỉ thẳng nhược điểm bằng kết quả in ra: vì không món nào thuộc kiểu \`FISH\` thoả predicate, khoá đó biến mất hoàn toàn khỏi map kết quả; đẩy predicate vào \`filtering\` bên trong thì \`FISH\` vẫn còn, chỉ là ánh xạ tới một \`List\` rỗng. Bẫy thứ hai: đọc \`Optional\` trong \`Map<Dish.Type, Optional<Dish>>\` như "kiểu này có thể không có món nào". Khung "Ghi chú" bác lại: \`groupingBy\` chỉ thêm khoá mới một cách lười biếng, đúng vào lần đầu gặp phần tử sinh ra khoá đó, nên một kiểu vắng mặt sẽ không mang giá trị \`Optional.empty()\` mà không xuất hiện như một khoá; lớp bọc \`Optional\` ở đây không hữu ích, nó chỉ tình cờ có mặt vì đó là kiểu \`maxBy\` trả về.

**Tự kiểm tra.** \`groupingBy(f)\` một đối số thật ra là cách viết tắt của lời gọi nào? Và vì sao \`Optional::get\` trong Listing 6.3 lại an toàn?`,
      },
      {
        id: "mj-w4-3",
        text: "partitioningBy, và khi nào nó hơn groupingBy",
        lesson: `**Mục tiêu.** Chọn được giữa \`partitioningBy\` và \`groupingBy\` dựa trên kiểu trả về của hàm phân loại, và dựng được phân hoạch nhiều tầng cùng phân hoạch có downstream collector.

**Đọc.** [6.4. Partitioning](#/docs/mjia-06) định nghĩa partitioning là trường hợp đặc biệt của grouping, dùng một predicate làm hàm phân loại, nên \`Map\` kết quả có khoá \`Boolean\` và nhiều nhất hai nhóm; chạy \`partitioningBy(Dish::isVegetarian)\` rồi so với bản \`filter(...).collect(toList())\` ngay dưới đó. [6.4.1. Ưu điểm của partitioning](#/docs/mjia-06) là trọng tâm: phiên bản overload nhận collector thứ hai, ví dụ lồng \`groupingBy(Dish::getType)\` cho \`Map\` hai tầng, và ví dụ tái dùng \`collectingAndThen(maxBy(...), Optional::get)\`. Làm trọn quiz 6.2 — cả ba câu — trước khi xem đáp án. [6.4.2. Phân hoạch các số thành nguyên tố và không nguyên tố](#/docs/mjia-06) gõ lại \`isPrime\` cả hai phiên bản (chia tới \`candidate\`, rồi chỉ tới căn bậc hai) và \`partitionPrimes\`; đây chính là code mà mục 6.6 sẽ tối ưu tiếp, đừng bỏ. Đóng lại bằng Bảng 6.1, bảng tra cứu các static factory method chính của lớp \`Collectors\`.

**Bẫy.** Tưởng truyền hàm nào vào \`partitioningBy\` cũng được. Quiz 6.2 câu 2 chặn đúng chỗ đó: \`partitioningBy(Dish::isVegetarian, partitioningBy(Dish::getType))\` không biên dịch được, vì \`partitioningBy\` yêu cầu một predicate — một hàm trả về giá trị boolean — còn method reference \`Dish::getType\` thì không thể dùng như một predicate. Bẫy thứ hai: coi \`partitioningBy\` chỉ là đường cú pháp cho \`groupingBy\`. Sách nói rõ phần cài đặt \`Map\` do \`partitioningBy\` trả về gọn nhẹ và hiệu quả hơn: bên trong nó là một \`Map\` chuyên biệt với hai trường, bởi nó chỉ cần chứa hai khoá \`true\` và \`false\`.

**Tự kiểm tra.** Nếu thay \`partitioningBy\` bằng hai lần \`filter\` — một với predicate, một với phủ định của nó — thì bạn mất đi điều gì? Và kết quả của quiz 6.2 câu 1 có hình dạng \`Map\` như thế nào?`,
      },
      {
        id: "mj-w4-4",
        text: "Interface Collector, và tự viết collector cho hiệu năng",
        lesson: `**Mục tiêu.** Kể tên năm phương thức của interface \`Collector\` cùng vai trò từng cái, và nói được khi nào một collector tuỳ biến đáng công viết so với việc ghép các factory method có sẵn.

**Đọc.** [6.5. Interface Collector](#/docs/mjia-06) với Listing 6.4 và ý nghĩa ba tham số kiểu \`T\`, \`A\`, \`R\`. [6.5.1. Hiểu ý nghĩa các phương thức được khai báo trong interface Collector](#/docs/mjia-06) đọc chậm từng tiểu mục: \`supplier\`, \`accumulator\`, \`finisher\` — ba cái đầu đã đủ cho một reduction tuần tự như Hình 6.7 — rồi \`combiner\` với Hình 6.8 và ba gạch đầu dòng mô tả quá trình chia đệ quy, cuối cùng \`characteristics\` với \`UNORDERED\`, \`CONCURRENT\`, \`IDENTITY_FINISH\`. [6.5.2. Ghép tất cả lại với nhau](#/docs/mjia-06) cho Listing 6.5 — gõ lại \`ToListCollector\` — và khung "Thực hiện một phép collect tuỳ biến mà không cần tạo phần cài đặt Collector". Sang [6.6. Xây dựng collector của riêng bạn để có hiệu năng tốt hơn](#/docs/mjia-06) và [6.6.1. Chỉ chia cho các số nguyên tố](#/docs/mjia-06): bốn bước dựng \`PrimeNumbersCollector\`, quiz 6.3, Listing 6.7. [6.6.2. So sánh hiệu năng của các collector](#/docs/mjia-06) ngắn nhưng có hai con số nên nhớ.

**Bẫy.** Cài đặt \`combiner\` rồi tin rằng collector đã chạy song song được. Ở bước 3 của mục 6.6.1, sách nói thẳng collector này trên thực tế không thể dùng song song vì thuật toán về bản chất là tuần tự: \`combiner\` sẽ không bao giờ được gọi tới, bạn có thể để trống nó hoặc, tốt hơn, ném \`UnsupportedOperationException\`; họ chỉ cài đặt cho đầy đủ. Bẫy thứ hai: chọn phiên bản \`collect\` ba hàm vì nó gọn hơn. Khung cuối mục 6.5.2 cảnh báo nó kém dễ đọc và kém dễ tái sử dụng hơn, và quan trọng hơn: bạn không được phép truyền bất kỳ \`Characteristics\` nào cho nó, nên nó luôn hành xử như \`IDENTITY_FINISH\` và \`CONCURRENT\` nhưng không phải \`UNORDERED\`.

**Tự kiểm tra.** \`ToListCollector\` được đánh dấu \`CONCURRENT\` nhưng khi nào nó mới thật sự được xử lý song song? Và collector tuỳ biến nhanh hơn bản \`partitioningBy\` khoảng bao nhiêu phần trăm, nhờ truy cập được thứ gì mà collector định nghĩa sẵn không cho?`,
      },
    ],
  },
  {
    id: "mj-w5",
    week: "Tuần 5",
    title: "Parallel stream, spliterator, và Collection API mới",
    goal: "Đo được thay vì đoán khi nào parallel stream đáng dùng, và nói được chính xác thứ gì quyết định dữ liệu bị chia như thế nào trước khi chạy song song.",
    practice:
      "Chạy benchmark tổng 1..10 triệu của §7.1 bằng ba cách (vòng lặp, `Stream.iterate().parallel()`, `LongStream.rangeClosed().parallel()`) và đo bằng JMH — không đo bằng `System.nanoTime()` thủ công; ghi lại con số của chính máy bạn.",
    resources: [
      { label: "MJIA 07 — Xử lý dữ liệu song song và hiệu năng", href: "#/docs/mjia-07" },
      { label: "MJIA 08 — Các cải tiến của Collection API", href: "#/docs/mjia-08" },
      { label: "openjdk.org — JMH", href: "https://openjdk.org/projects/code-tools/jmh/" },
    ],
    items: [
      {
        id: "mj-w5-1",
        text: "parallelStream: khi nào nhanh hơn, khi nào chậm hơn hẳn",
        lesson: `**Mục tiêu.** Trả lời được vì sao cùng một phép tính tổng lại nhanh hơn hay chậm hơn bản tuần tự tuỳ theo cách sinh stream, và liệt kê được những tiêu chí định tính mà sách đưa ra để quyết định có song song hoá hay không.

**Đọc.** [7.1. Parallel streams](#/docs/mjia-07) đặt bài toán tổng 1..n. [7.1.1. Chuyển một sequential stream thành parallel stream](#/docs/mjia-07) với Hình 7.1 và khung "Cấu hình thread pool được parallel stream sử dụng" — nhớ cái tên \`ForkJoinPool\` cùng system property đổi kích thước pool, và lời khuyên đừng sửa nó nếu không có lý do chính đáng. [7.1.2. Đo hiệu năng của stream](#/docs/mjia-07) là mục dài nhất và cũng là phần thực hành của tuần: dựng JMH theo Listing 7.1, chạy lần lượt \`sequentialSum\`, \`iterativeSum\`, \`parallelSum\`, \`rangedSum\`, \`parallelRangedSum\` rồi đặt các con số của máy bạn cạnh con số của sách; đọc kỹ Hình 7.2 giải thích vì sao \`iterate\` về bản chất là tuần tự. [7.1.3. Sử dụng parallel stream đúng cách](#/docs/mjia-07) ngắn nhưng bắt buộc. [7.1.4. Sử dụng parallel stream một cách hiệu quả](#/docs/mjia-07) là tám gạch đầu dòng — chép cả tám ra — cộng Bảng 7.1 xếp hạng khả năng phân rã của sáu nguồn stream.

**Bẫy.** Gắn \`.parallel()\` vào \`Stream.iterate\` rồi chờ máy bốn nhân trả công. Số đo của sách ngược lại: bản song song chậm hơn khoảng năm lần so với bản tuần tự, vì \`iterate\` sinh ra các đối tượng đã boxing và vì đầu vào của mỗi lần áp dụng hàm phụ thuộc kết quả lần trước nên không chia thành khối độc lập được; đánh dấu parallel chỉ thêm vào overhead phân bổ mỗi phép cộng cho một thread khác nhau. Bẫy thứ hai: cộng dồn vào một accumulator dùng chung rồi gọi \`parallel()\`. §7.1.3 chạy \`sideEffectParallelSum\` mười lần và in ra mười kết quả khác nhau, tất cả đều cách xa giá trị đúng 50000005000000, bởi \`total += value\` không phải một thao tác nguyên tử.

**Tự kiểm tra.** Trong một pipeline xen kẽ \`parallel()\` với \`sequential()\`, lời gọi nào thắng thế và nó ảnh hưởng tới phạm vi nào? Và \`LongStream.rangeClosed\` hơn \`Stream.iterate\` ở đúng hai điểm nào?`,
      },
      {
        id: "mj-w5-2",
        text: "Fork/join framework và work stealing",
        lesson: `**Mục tiêu.** Viết được một \`RecursiveTask\` chia đôi đúng cách, và giải thích được vì sao fork thật nhiều task nhỏ thường thắng fork vài task lớn.

**Đọc.** [7.2. Fork/join framework](#/docs/mjia-07) giới thiệu \`ForkJoinPool\` như một phần cài đặt của \`ExecutorService\`. [7.2.1. Làm việc với RecursiveTask](#/docs/mjia-07) — đọc đoạn mã giả của \`compute\` trước, rồi Hình 7.3, rồi gõ trọn Listing 7.2 \`ForkJoinSumCalculator\` và chạy nó; chú ý thứ tự bốn dòng cuối của \`compute\`, ngưỡng \`THRESHOLD = 10_000\`, ghi chú rằng \`availableProcessors\` đếm cả nhân ảo do hyperthreading, và Hình 7.4. [7.2.2. Các best practice khi sử dụng fork/join framework](#/docs/mjia-07) là năm gạch đầu dòng, đọc chậm cả năm — đây là danh sách kiểm tra bạn sẽ quay lại mỗi lần viết task. [7.2.3. Work stealing](#/docs/mjia-07) với Hình 7.5 giải thích hàng đợi liên kết đôi của mỗi thread, việc lấy task từ đầu hàng đợi của mình và "đánh cắp" task từ đuôi hàng đợi của thread khác.

**Bẫy.** Gọi \`fork()\` trên cả hai subtask cho cân đối. Best practice thứ ba nói ngược lại: làm vậy kém hiệu quả hơn gọi trực tiếp \`compute\` trên một trong hai, vì gọi \`compute\` cho phép tái sử dụng cùng một thread cho một subtask và tránh được overhead cấp phát không cần thiết thêm một task nữa vào pool — đúng như Listing 7.2 làm. Bẫy thứ hai: gọi \`join()\` ngay sau khi fork subtask trái. Best practice thứ nhất cảnh báo \`join\` chặn bên gọi cho tới khi kết quả sẵn sàng, nên phải gọi nó sau khi quá trình tính toán của cả hai subtask đã bắt đầu; nếu không, bạn nhận được một phiên bản chậm hơn và phức tạp hơn của chính thuật toán tuần tự ban đầu.

**Tự kiểm tra.** Vì sao \`invoke\` của \`ForkJoinPool\` không nên được gọi từ bên trong một \`RecursiveTask\`, và thay vào đó nên gọi gì? Và với mảng 10 triệu phần tử, \`ForkJoinSumCalculator\` fork ít nhất bao nhiêu subtask, và vì sao con số nghe có vẻ lãng phí đó nói chung lại là lựa chọn thắng lợi?`,
      },
      {
        id: "mj-w5-3",
        text: "Spliterator — thứ quyết định stream chia dữ liệu thế nào",
        lesson: `**Mục tiêu.** Đọc được bốn phương thức của interface \`Spliterator\` như một bản hợp đồng, và nhận ra khi nào một bài toán cho kết quả sai chỉ vì stream bị chia sai chỗ.

**Đọc.** [7.3. Spliterator](#/docs/mjia-07) với Listing 7.3 — \`tryAdvance\`, \`trySplit\`, \`estimateSize\`, \`characteristics\` — và câu nói rằng ngay cả một ước lượng kích thước không chính xác nhưng tính nhanh cũng đã hữu ích. [7.3.1. Quá trình chia nhỏ (splitting)](#/docs/mjia-07) bám bốn bước của Hình 7.6, rồi Bảng 7.2 với tám characteristic; đọc kỹ \`SIZED\` và \`SUBSIZED\`. [7.3.2. Tự cài đặt Spliterator của bạn](#/docs/mjia-07) nên đọc như một câu chuyện gỡ lỗi: Listing 7.4 đếm từ theo kiểu lặp cho 19, Listing 7.5 \`WordCounter\` bất biến với \`accumulate\` và \`combine\` (Hình 7.7), bản \`reduce\` tuần tự vẫn cho 19, rồi \`stream.parallel()\` cho 25 — dừng lại tự giải thích trước khi đọc tiếp. Cuối cùng là Listing 7.6 \`WordCounterSpliterator\` cùng bốn gạch đầu dòng mổ xẻ từng phương thức, và \`StreamSupport.stream(spliterator, true)\`.

**Bẫy.** Cho rằng đổi sang parallel chỉ ảnh hưởng tốc độ. Chính ví dụ đếm từ bác điều đó: vì \`String\` ban đầu bị chia ở những vị trí tuỳ ý, đôi khi một từ bị chia làm đôi rồi bị đếm hai lần, cho ra 25 thay vì 19 — sách kết luận việc chuyển từ sequential stream sang parallel stream có thể dẫn tới kết quả sai nếu kết quả đó có thể bị ảnh hưởng bởi vị trí mà stream bị chia. Bẫy thứ hai: bê nguyên ngưỡng của Listing 7.6 vào code thật. Sách nói rõ giới hạn thấp chỉ 10 \`Character\` là để đảm bảo chương trình thực hiện được vài lần chia trên chuỗi tương đối ngắn đang phân tích; trong các ứng dụng thực tế bạn sẽ phải dùng một giới hạn cao hơn, như đã làm ở ví dụ fork/join, để tránh tạo ra quá nhiều task.

**Tự kiểm tra.** \`trySplit\` trả về \`null\` khi nào, và framework hiểu tín hiệu đó là gì? Và vì sao \`WordCounter\` được cố ý viết thành một class bất biến?`,
      },
      {
        id: "mj-w5-4",
        text: "Collection factory và các default method mới của List/Set/Map",
        lesson: `**Mục tiêu.** Thay được những đoạn tạo và sửa collection dài dòng bằng đúng một lời gọi factory hoặc default method, và biết ngay lời gọi đó trả về thứ mutable hay immutable.

**Đọc.** [8.1. Collection factories](#/docs/mjia-08) mở bằng \`Arrays.asList\`, mẹo dựng \`Set\` và khung "Collection literals"; rồi [8.1.1. List factory](#/docs/mjia-08) với khung "Overloading (nạp chồng) so với varargs" — lý do có các biến thể overload cố định thay vì một chữ ký varargs duy nhất đáng đọc kỹ — [8.1.2. Set factory](#/docs/mjia-08) và [8.1.3. Map factories](#/docs/mjia-08) với \`Map.of\` cùng \`Map.ofEntries\`; làm quiz 8.1. [8.2. Làm việc với List và Set](#/docs/mjia-08) rồi [8.2.1. removeIf](#/docs/mjia-08) — gõ lại cả ba phiên bản để thấy vì sao vòng for-each ném \`ConcurrentModificationException\` — và [8.2.2. replaceAll](#/docs/mjia-08). [8.3. Làm việc với Map](#/docs/mjia-08) là phần dày nhất: [8.3.1. forEach](#/docs/mjia-08), [8.3.2. Sắp xếp (Sorting)](#/docs/mjia-08) với khung "HashMap và hiệu năng", [8.3.3. getOrDefault](#/docs/mjia-08), [8.3.4. Các khuôn mẫu compute](#/docs/mjia-08), [8.3.5. Các khuôn mẫu remove](#/docs/mjia-08), [8.3.6. Các khuôn mẫu thay thế (Replacement patterns)](#/docs/mjia-08) và [8.3.7. Merge](#/docs/mjia-08) — đọc kỹ trích dẫn Javadoc về cách \`merge\` xử lý \`null\`; làm quiz 8.2. [8.4. ConcurrentHashMap được cải tiến](#/docs/mjia-08) cùng [8.4.1. Reduce và Search](#/docs/mjia-08), [8.4.2. Đếm (Counting)](#/docs/mjia-08) và [8.4.3. Set view](#/docs/mjia-08) đọc nhanh hơn.

**Bẫy.** Coi \`Arrays.asList\` và \`List.of\` là một. §8.1 chỉ rõ \`Arrays.asList\` cho một danh sách kích thước cố định: \`set\` được phép còn \`add\` ném \`UnsupportedOperationException\` — sách gọi hành vi này là hơi bất ngờ; còn \`List.of\` cho một collection immutable, nên theo quiz 8.1 thì chính \`set\` cũng ném ngoại lệ đó. Bẫy thứ hai: dùng \`getOrDefault\` như một tấm khiên chống \`NullPointerException\`. §8.3.3 nêu đúng hai điều: nếu khoá tồn tại nhưng vô tình được gán \`null\` thì \`getOrDefault\` vẫn có thể trả về \`null\`, và biểu thức bạn truyền làm giá trị dự phòng luôn luôn được tính toán bất kể khoá có tồn tại hay không.

**Tự kiểm tra.** Vì sao \`Set.of("Raphael", "Olivia", "Olivia")\` ném \`IllegalArgumentException\` thay vì âm thầm bỏ trùng? Và trong §8.3.4, chuyện gì xảy ra với ánh xạ hiện tại nếu hàm truyền cho \`computeIfPresent\` trả về \`null\`?`,
      },
    ],
  },
  {
    id: "mj-w6",
    week: "Tuần 6",
    title: "Refactoring/test/debug code hàm, và DSL bằng lambda",
    goal: "Chuyển được code cũ sang lambda và stream mà không đánh đổi tính đúng đắn hay khả năng debug, và đọc được một fluent API bất kỳ như một DSL dựng theo pattern có tên.",
    practice:
      "Chọn một chỗ trong dự án đang dùng Strategy hoặc Template Method, viết lại bằng lambda theo §9.2, rồi viết unit test cho hành vi lambda đó theo §9.3; cuối cùng chèn `peek()` vào một pipeline dài để xem giá trị chảy qua từng bước.",
    resources: [
      { label: "MJIA 09 — Refactoring, testing và debugging", href: "#/docs/mjia-09" },
      { label: "MJIA 10 — Domain-specific language với lambda", href: "#/docs/mjia-10" },
    ],
    items: [
      {
        id: "mj-w6-1",
        text: "Refactor code cũ sang lambda/stream, và viết lại design pattern OOP",
        lesson: `**Mục tiêu.** Áp dụng được ba phép refactoring của mục 9.1 lên code của chính bạn, và viết lại được ít nhất hai trong năm design pattern của mục 9.2 bằng lambda.

**Đọc.** [9.1. Refactoring để cải thiện tính dễ đọc và tính linh hoạt](#/docs/mjia-09) và [9.1.1. Cải thiện tính dễ đọc của code](#/docs/mjia-09) chỉ liệt kê ba phép refactoring, đọc lướt. [9.1.2. Từ anonymous class sang lambda expression](#/docs/mjia-09) là mục đọc chậm nhất — ba khác biệt ngữ nghĩa và ví dụ \`Task\` với \`Runnable\`. [9.1.3. Từ lambda expression sang method reference](#/docs/mjia-09) với \`Dish::getCaloricLevel\` và \`summingInt\`; [9.1.4. Từ xử lý dữ liệu kiểu mệnh lệnh sang Streams](#/docs/mjia-09) ngắn. [9.1.5. Cải thiện tính linh hoạt của code](#/docs/mjia-09) cho hai khuôn mẫu "Conditional deferred execution" và "Execute around" — gõ lại đoạn \`logger.log(Level.FINER, () -> ...)\` cùng phần cài đặt bên trong của nó. [9.2. Refactoring các design pattern hướng đối tượng bằng lambda](#/docs/mjia-09) rồi năm mục con [9.2.1. Strategy](#/docs/mjia-09), [9.2.2. Template method](#/docs/mjia-09), [9.2.3. Observer](#/docs/mjia-09), [9.2.4. Chain of responsibility](#/docs/mjia-09) và [9.2.5. Factory](#/docs/mjia-09); mỗi mục có một bản OOP và một bản lambda, gõ cả hai bản của Strategy và của Chain of responsibility.

**Bẫy.** Để IDE đổi mọi anonymous class thành lambda rồi thôi. §9.1.2 nêu ba chỗ ngữ nghĩa đổi: \`this\` trong anonymous class trỏ chính nó còn trong lambda trỏ class bao ngoài; anonymous class được phép che khuất biến của class bao ngoài còn lambda thì gây lỗi biên dịch; và nếu tồn tại hai overload \`doSomething(Runnable)\` với \`doSomething(Task)\` thì lời gọi bằng lambda trở nên nhập nhằng, phải ép kiểu \`(Task)\` để khử. Bẫy thứ hai: thay mọi observer bằng lambda. §9.2.3 tự đặt câu hỏi có nên dùng lambda mọi lúc không rồi trả lời thẳng là không: lambda hợp khi hành vi cần thực thi rất đơn giản, còn observer có trạng thái hoặc định nghĩa nhiều phương thức thì nên bám vào việc dùng class.

**Tự kiểm tra.** Bản \`logger.log(Level.FINER, "Problem: " + generateDiagnostic())\` đã sửa được gì so với bản có \`isLoggable\`, và còn sót lại vấn đề gì? Và bản Factory dùng \`Map<String, Supplier<Product>>\` hỏng ở đâu khi constructor sản phẩm cần ba đối số?`,
      },
      {
        id: "mj-w6-2",
        text: "Test và debug code dùng lambda — stack trace khó đọc, peek()",
        lesson: `**Mục tiêu.** Quyết định được cái gì trong code dùng lambda thì đáng test, và đọc được một stack trace sinh ra từ bên trong stream pipeline mà không hoảng.

**Đọc.** [9.3. Testing lambda](#/docs/mjia-09) mở bằng class \`Point\` và unit test cho \`moveRightBy\`. [9.3.1. Testing hành vi của một lambda hiển thị được](#/docs/mjia-09) — trường static \`compareByXAndThenY\` và cách gọi thẳng \`compare\` trên nó. [9.3.2. Tập trung vào hành vi của phương thức sử dụng lambda](#/docs/mjia-09) là mục quan trọng nhất của cả mục 9.3, kèm lưu ý cuối mục về \`equals\`. [9.3.3. Tách các lambda phức tạp ra thành phương thức riêng](#/docs/mjia-09) chỉ vài dòng; [9.3.4. Testing các hàm bậc cao](#/docs/mjia-09) cho \`testFilter\` với hai predicate khác nhau. [9.4. Debugging](#/docs/mjia-09) rồi [9.4.1. Kiểm tra stack trace](#/docs/mjia-09) — chạy đúng đoạn \`Debugging\` cố tình lỗi để tự thấy dòng \`lambda$main$0\`, rồi chạy tiếp bản \`Point::getX\` và bản \`Debugging::divideByZero\` để so ba stack trace. [9.4.2. Ghi log thông tin](#/docs/mjia-09) với Hình 9.4: gõ lại pipeline có bốn lời gọi \`peek\` và đối chiếu mười hai dòng đầu ra với dự đoán của bạn.

**Bẫy.** Cố viết test cho chính lambda. §9.3.2 nói thẳng chẳng có ý nghĩa gì khi test lambda \`p -> new Point(p.getX() + x, p.getY())\`; nó chỉ là một chi tiết cài đặt của \`moveAllPointsRightBy\`, và thứ đáng test là hành vi của phương thức đó — với điều kiện \`Point\` cài đặt \`equals\` một cách phù hợp, nếu không test sẽ dựa vào phần cài đặt mặc định từ \`Object\`. Bẫy thứ hai: tin rằng đổi lambda sang method reference sẽ làm stack trace dễ đọc. §9.4.1 chỉ ra \`Point::getX\` vẫn cho ra một dòng \`Unknown Source\`; chỉ khi method reference trỏ tới một phương thức được khai báo trong chính class nơi nó được dùng — như \`Debugging::divideByZero\` — thì tên phương thức mới xuất hiện trong stack trace.

**Tự kiểm tra.** Vì sao compiler phải tự bịa ra cái tên \`lambda$main$0\`, và điều đó gây rắc rối gì với những class lớn? Và \`peek\` khác \`forEach\` ở đúng điểm nào khiến chỉ \`peek\` dùng được để soi pipeline?`,
      },
      {
        id: "mj-w6-3",
        text: "DSL là gì, và những DSL nhỏ đã nằm sẵn trong API Java hiện đại",
        lesson: `**Mục tiêu.** Nói được DSL là gì và không phải là gì, cân được sáu lợi ích với năm nhược điểm của DSL, và chỉ ra được hai DSL nhỏ bạn vẫn dùng hằng ngày mà không gọi tên.

**Đọc.** [10.1. Một ngôn ngữ riêng cho lĩnh vực của bạn](#/docs/mjia-10) — định nghĩa DSL như một API giao tiếp với một lĩnh vực nghiệp vụ, đoạn "Cái gì không phải là DSL?", và hai lý do "Giao tiếp là vua" cùng "Code được viết một lần nhưng được đọc rất nhiều lần". [10.1.1. Ưu và nhược điểm của DSL](#/docs/mjia-10) là hai danh sách; chép cả hai ra để trích lại khi thuyết phục đội. [10.1.2. Các giải pháp DSL khác nhau có sẵn trên JVM](#/docs/mjia-10) chia ba loại internal, polyglot và external; phần Scala với \`3 times { ... }\` chỉ cần lấy cảm giác. [10.2. Các DSL nhỏ trong API Java hiện đại](#/docs/mjia-10) đi từ \`Collections.sort\` bọc trong inner class tới \`persons.sort(comparing(Person::getAge).thenComparing(Person::getName))\`. [10.2.1. Stream API nhìn như một DSL để thao tác với collection](#/docs/mjia-10) đặt cạnh nhau Listing 10.1 và Listing 10.2 — đọc kỹ hai danh sách "ba chỗ" nằm giữa chúng. [10.2.2. Collector như một DSL để tổng hợp dữ liệu](#/docs/mjia-10) với Listing 10.3 \`GroupingBuilder\`.

**Bẫy.** Bán DSL cho đội bằng lời hứa "chuyên gia nghiệp vụ sẽ tự viết được logic". §10.1 chặn ngay: một DSL không phải tiếng Anh thuần tuý, và cũng không phải một ngôn ngữ cho phép chuyên gia nghiệp vụ cài đặt logic nghiệp vụ ở mức thấp — thứ họ làm được là đọc và kiểm chứng. Bẫy thứ hai: cho rằng phong cách fluent luôn hơn phong cách lồng nhau, nên việc \`Collectors\` bắt lồng nhau là chỗ thiết kế lười. §10.2.2 nói ngược lại: đó là lựa chọn thiết kế có chủ ý, xuất phát từ việc \`Collector\` ở trong cùng phải được định trị trước nhưng về mặt logic lại là phép nhóm cuối cùng; và khi thử dựng \`GroupingBuilder\` fluent thì các hàm nhóm phải viết theo thứ tự ngược, còn muốn sửa thứ tự thì hệ thống kiểu của Java không cho phép.

**Tự kiểm tra.** Trong Listing 10.1, code đọc file theo từng dòng bị rải ra đúng ba chỗ nào? Và theo §10.1.2, những lợi thế nào khiến viết internal DSL bằng Java thuần vẫn đáng chọn so với Scala hay Groovy?`,
      },
      {
        id: "mj-w6-4",
        text: "Các pattern dựng DSL trong Java, và DSL thật ngoài đời",
        lesson: `**Mục tiêu.** Đặt tên được pattern đứng sau một fluent API bất kỳ, và chọn được pattern phù hợp khi tự dựng DSL cho lĩnh vực của bạn.

**Đọc.** [10.3. Các pattern và kỹ thuật tạo DSL trong Java](#/docs/mjia-10) mở bằng mô hình \`Stock\` / \`Trade\` / \`Order\` và Listing 10.4 — đoạn code tạo order dài dòng mà cả mục sẽ tìm cách xoá bỏ; gõ mô hình này vào IDE. [10.3.1. Method chaining](#/docs/mjia-10) với Listing 10.5 và Listing 10.6 cùng các builder phụ; chú ý vì sao cần tới hai trade builder. [10.3.2. Dùng hàm lồng nhau (nested functions)](#/docs/mjia-10) với Listing 10.7, Listing 10.8 và vai trò của hai phương thức giả \`at()\` với \`on()\`. [10.3.3. Xâu chuỗi hàm với lambda expression (function sequencing)](#/docs/mjia-10) với Listing 10.9. [10.3.4. Ghép tất cả lại với nhau](#/docs/mjia-10) trộn cả ba trong Listing 10.11. [10.3.5. Dùng method reference trong một DSL](#/docs/mjia-10) là mục đáng gõ lại nhất: từ ba cờ \`boolean\` ở Listing 10.14, qua \`TaxCalculator\` fluent ở Listing 10.15, tới bản \`DoubleUnaryOperator\` ghép bằng \`andThen\` ở Listing 10.16. Bảng 10.1 tóm tắt ưu nhược ba pattern. [10.4. DSL Java 8 trong thế giới thực](#/docs/mjia-10) với [10.4.1. jOOQ](#/docs/mjia-10), [10.4.2. Cucumber](#/docs/mjia-10) và [10.4.3. Spring Integration](#/docs/mjia-10) — với mỗi thư viện, tự đoán pattern trước khi đọc câu chốt.

**Bẫy.** Chọn method chaining chỉ vì chỗ dùng nó đẹp nhất. §10.3.1 nêu đúng cái giá: vấn đề chính của method chaining là sự dài dòng cần có để cài đặt các builder, cần rất nhiều code keo dán nối builder tầng cao với builder tầng thấp, và bạn không có cách nào bắt buộc quy ước thụt lề — thứ duy nhất thể hiện cấu trúc phân cấp của các đối tượng lĩnh vực. Bẫy thứ hai: chọn nested function rồi gặp trường tuỳ chọn. §10.3.2 cảnh báo danh sách đối số truyền cho các static method bị định sẵn một cách cứng nhắc, nên có trường tuỳ chọn là phải cài đặt nhiều phiên bản overload; thêm nữa ý nghĩa đối số được xác định bởi vị trí thay vì bởi tên, và cách giảm nhẹ duy nhất là chèn những phương thức giả.

**Tự kiểm tra.** Vì sao \`MethodChainingOrderBuilder\` cần tới hai trade builder riêng biệt? Và \`TaxCalculator\` ở Listing 10.16 chỉ còn đúng một trường — trường đó là gì, và giá trị khởi đầu của nó là gì?`,
      },
    ],
  },
];
