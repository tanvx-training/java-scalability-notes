// Lộ trình đọc The Well-Grounded Java Developer — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "The Well-Grounded Java Developer", ấn bản 2
// (Benjamin J. Evans, Jason Clark, Martijn Verburg — Manning).
// Thư mục nguồn: sources/wgjd/ — bản dịch gồm chương 1–8 và 11–18; chương 9
// (Kotlin) và 10 (Clojure) không thuộc phạm vi và không có PDF gốc.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (wg-w<N> / wg-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const wgjdWeeksPart1 = [
  {
    id: "wg-w1",
    week: "Tuần 1",
    title: "Java là ngôn ngữ và là nền tảng; hệ thống module",
    goal: "Nắm được Java hiện đại khác Java 8 ở chỗ nào về mô hình phát hành và cú pháp, và hiểu module system giải quyết vấn đề gì trước khi quyết định có dùng nó hay không.",
    practice:
      "Cài JDK 17 trở lên nếu chưa có, rồi viết một ứng dụng hai module — một module thư viện `export` đúng một package, một module ứng dụng `requires` nó — biên dịch và chạy bằng `javac`/`java` từ dòng lệnh, không qua IDE. Sau đó thử bỏ dòng `exports` đi và đọc thông báo lỗi trình biên dịch đưa ra.",
    resources: [
      { label: "WGJD 01 — Giới thiệu về Java hiện đại", href: "#/docs/wgjd-01" },
      { label: "WGJD 02 — Java modules", href: "#/docs/wgjd-02" },
      { label: "openjdk.org — JDK Release Process", href: "https://openjdk.org/jeps/3" },
    ],
    items: [
      {
        id: "wg-w1-1",
        text: "Java là hai thứ: ngôn ngữ và nền tảng, và mô hình phát hành mới",
        lesson: `**Mục tiêu.** Phân biệt rạch ròi được "ngôn ngữ Java" với "nền tảng Java", và giải thích được vì sao mô hình phát hành sáu tháng một lần lại khiến gần như mọi đội chỉ nâng cấp theo các mốc LTS.

**Đọc.** [1.1 Ngôn ngữ và nền tảng](#/docs/wgjd-01) là mục nền tảng của cả cuốn sách — đọc chậm. Nắm chắc hai định nghĩa (ngôn ngữ là thứ con người đọc được, nền tảng là JVM chạy class file), và JLS với VMSpec là hai đặc tả tách biệt, nối với nhau duy nhất qua định dạng class file. Đọc kỹ khung "Java là ngôn ngữ biên dịch hay thông dịch?" — đây là câu hỏi sách tự đặt ra rồi tự trả lời "cả hai". [1.2 Mô hình phát hành mới của Java](#/docs/wgjd-01) đọc lướt phần lịch sử OpenJDK và JCP, nhưng đọc kỹ sáu điểm của mô hình mainline (tính năng chỉ merge khi code complete, bản phát hành theo nhịp thời gian nghiêm ngặt, tính năng trễ hạn bị đẩy sang bản sau) và danh sách các thay đổi được phép trên một bản LTS đang bảo trì (TLS 1.3, cập nhật múi giờ, Shenandoah GC).

**Bẫy.** Nghĩ rằng \`javac\` là một compiler theo đúng nghĩa như \`gcc\`. Sách nói thẳng: quá trình biến mã nguồn Java thành bytecode không phải compilation theo nghĩa một lập trình viên C++ hay Go hiểu — \`javac\` thực chất là một "trình sinh class file", còn compiler thật sự trong hệ Java là JIT compiler chạy tại runtime. Bẫy thứ hai: tưởng vẫn có thể dùng Oracle JDK miễn phí như thời Java 8. Sách chỉ rõ kể từ JDK 11, Oracle chỉ cung cấp hỗ trợ và cập nhật miễn phí trong sáu tháng cho mỗi bản, buộc các đội phải chọn hoặc trả tiền cho Oracle, hoặc chuyển sang một bản phân phối OpenJDK khác như Eclipse Adoptium hay Amazon Corretto.

**Tự kiểm tra.** Vì sao nói Java "vừa biên dịch vừa thông dịch" lại đúng hơn là nói nó chỉ biên dịch, và compiler thực sự nằm ở bước nào trong vòng đời một chương trình Java? Và nếu đội bạn build bằng Oracle JDK 11, sau sáu tháng kể từ ngày phát hành, bạn có những lựa chọn nào để tiếp tục nhận bản vá bảo mật?`,
      },
      {
        id: "wg-w1-2",
        text: "`var`, tính năng preview, và những thay đổi nhỏ trong Java 11",
        lesson: `**Mục tiêu.** Áp dụng đúng các tiêu chí sách đưa ra để quyết định khi nào nên dùng \`var\`, và phân biệt được tính năng incubating với tính năng preview — biết cái nào dùng được trong production và cái nào thì không.

**Đọc.** [1.3 Suy diễn kiểu nâng cao (từ khóa \`var\`)](#/docs/wgjd-01) đọc kỹ toàn mục — bám theo mạch tiến hóa từ generic method (Java 5) qua diamond syntax (Java 7) tới LVTI (Java 10), rồi dừng lâu ở ví dụ \`var n = null;\` không biên dịch được vì hệ ràng buộc kiểu "thiếu xác định" (underdetermined), và bốn hướng dẫn nhanh cuối mục về khi nào nên dùng \`var\`. [1.4 Thay đổi ngôn ngữ và nền tảng](#/docs/wgjd-01) đọc lướt phần thang độ phức tạp (1.4.1–1.4.3), nhưng đọc chậm 1.4.4 Tính năng incubating và preview — đây là hai khái niệm rất hay bị gộp làm một. [1.5 Những thay đổi nhỏ trong Java 11](#/docs/wgjd-01) đọc theo kiểu dạo nhanh: chạy thật ví dụ \`List.of(2, 3, 5, 7)\` trong 1.5.1 rồi thử sửa đổi phần tử để tự thấy exception ném ra vì các factory method tạo collection bất biến, và lướt qua 1.5.2, 1.5.3, 1.5.4 chỉ để biết chúng tồn tại.

**Bẫy.** Dùng \`var\` ở mọi nơi có thể chỉ vì nó hợp lệ. Sách gọi thẳng đây là antipattern "Golden Hammer" — LVTI chỉ nên dùng khi nó thực sự làm mã rõ ràng hơn, theo đúng các tiêu chí đã liệt kê, không phải một công cụ dùng bất cứ khi nào biên dịch được. Bẫy thứ hai: coi tính năng incubating và tính năng preview là một. Sách phân biệt rõ — tính năng incubating chỉ là một API mới đóng gói trong module riêng (namespace \`jdk.incubator\`) và có thể dùng cả trong mã production miễn sẵn lòng sửa lại khi nó chuẩn hóa; tính năng preview thì xâm lấn sâu vào compiler, định dạng bytecode và class loading, cần bật flag ở cả compile lẫn runtime, và "thực sự không thể dùng trong production" vì định dạng class file của nó có thể không bao giờ được hỗ trợ chính thức.

**Tự kiểm tra.** Vì sao \`var n = null;\` không biên dịch được trong khi \`var names = new ArrayList<String>();\` thì được — cụm từ "thiếu xác định" mà sách dùng nghĩa là gì? Và nếu một đồng nghiệp đề xuất dùng một API đang ở dạng preview trong một service production, bạn dựa vào lý do nào trong sách để phản đối?`,
      },
      {
        id: "wg-w1-3",
        text: "Vì sao có module: bối cảnh, cú pháp cơ bản, và cách nạp module",
        lesson: `**Mục tiêu.** Giải thích được những vấn đề mà Project Jigsaw nhắm giải quyết, viết được một \`module-info.java\` cơ bản với \`exports\`/\`requires\`, và phân biệt bốn loại module theo cách chúng được nạp.

**Đọc.** [2.1 Dựng bối cảnh](#/docs/wgjd-02) đọc chậm — nắm những điểm module làm được mà JAR/package không làm được (khai báo phụ thuộc tường minh, đóng gói đúng nghĩa, là đơn vị triển khai có metadata). Đọc kỹ 2.1.3 Bảo vệ phần nội bộ với ví dụ \`URLCanonicalizer\` bị Java 8 cho biên dịch dù chỉ cảnh báo, và 2.1.4 Ngữ nghĩa kiểm soát truy cập mới — câu trích "shotgun privacy" của Larry Wall và cách từ khóa \`exports\` chấm dứt nó, cùng thông báo lỗi thật khi biên dịch cùng ví dụ đó trên Java 11. [2.2 Cú pháp module cơ bản](#/docs/wgjd-02) đọc kỹ 2.2.1 Export và require — tự gõ lại descriptor ba dòng \`module wgjd.discovery { ... }\` — và 2.2.2 Tính bắc cầu, phân biệt \`requires\` thường với \`requires transitive\`. [2.3 Nạp module](#/docs/wgjd-02) đọc lần lượt bốn mục con 2.3.1–2.3.4, dừng lâu nhất ở 2.3.3 Automatic module và 2.3.4 Unnamed module — đây là hai loại dễ nhầm lẫn nhất.

**Bẫy.** Coi automatic module là một module thật sự an toàn để \`requires\`. Sách nói rõ nó "không phải công dân hạng nhất": nó export mọi package nó chứa và tự động phụ thuộc vào mọi module khác trên module path, vì nó không khai báo tường minh phụ thuộc hay API của chính mình — không cùng mức đảm bảo với module thật. Bẫy thứ hai: nghĩ một module có thể \`requires\` một thứ đang nằm trên classpath cũ. Sách khẳng định mã modular không thể phụ thuộc vào unnamed module, nên trên thực tế module không thể phụ thuộc vào bất kỳ thứ gì trên classpath — đó chính là lý do automatic module tồn tại, để làm cầu nối.

**Tự kiểm tra.** Nếu bạn đưa một JAR phi modular chưa có \`Automatic-Module-Name\` lên module path, tên module nó nhận được đến từ đâu, và bạn thiếu đảm bảo gì so với một module thật sự khai báo \`exports\`? Và vì sao một ứng dụng modular không thể vừa \`requires\` một module vừa dựa vào một JAR nằm trên classpath truyền thống cho cùng một tính năng?`,
      },
      {
        id: "wg-w1-4",
        text: "Dựng ứng dụng modular đầu tiên và thiết kế kiến trúc module",
        lesson: `**Mục tiêu.** Biên dịch và chạy được một ứng dụng hai module hoàn toàn từ dòng lệnh, đọc hiểu thông báo lỗi khi thiếu \`requires\`, và biết các bước sách khuyến nghị để migrate dần sang module thay vì module hóa toàn bộ một lần.

**Đọc.** [2.4 Xây dựng ứng dụng modular đầu tiên](#/docs/wgjd-02) — chạy thật ví dụ \`wgjd.sitecheck\`, rồi tự comment dòng \`requires java.net.http;\` để tái tạo đúng lỗi "package java.net.http is not visible" sách in ra. Đọc kỹ 2.4.1 Các switch dòng lệnh cho module (đặc biệt \`--add-exports\` và \`--add-opens\`), 2.4.2 Thực thi một ứng dụng modular (các cách khởi chạy chương trình Java, kể cả cách mới \`java --module-path ... -m module/Class\`), và 2.4.3 Module và reflection — chú ý đoạn về \`--illegal-access\` bị loại bỏ hoàn toàn kể từ Java 17. [2.5 Thiết kế kiến trúc cho module](#/docs/wgjd-02) đọc kỹ trích dẫn của Mark Reinhold và quy trình migrate bốn bước (nâng lên Java 11 → đặt automatic module name → một module nguyên khối → tách dần); 2.5.1 Split package và 2.5.2 Java 8 Compact Profiles đọc lướt; 2.5.3 Multi-release JAR đọc kỹ nếu bạn còn phải hỗ trợ Java 8 song song. [2.6 Vượt ra ngoài module](#/docs/wgjd-02) đọc để biết \`jlink\` làm gì và giới hạn của nó.

**Bẫy.** Nghĩ rằng chỉ cần thêm \`Automatic-Module-Name\` cho mọi phụ thuộc là đủ điều kiện dùng \`jlink\`. Sách nói thẳng ngược lại: \`jlink\` chỉ hoạt động với ứng dụng có phụ thuộc đã module hóa hoàn toàn, và "ngay cả automatic module cũng không đủ" — nó cần một \`module-info.class\` thật cho từng phụ thuộc để tính đúng những gì cần đưa vào bundle. Bẫy thứ hai: tưởng vẫn có thể dùng \`--illegal-access=permit\` để "mở lại" quyền truy cập reflection toàn cục trên Java 17. Sách xác nhận switch này đã mặc định \`deny\` từ Java 16 và bị loại bỏ tác dụng hoàn toàn trong Java 17 — chỉ còn \`--add-opens\` cho từng package cụ thể, không còn cách "vũ lực" áp dụng trên toàn cục.

**Tự kiểm tra.** Vì sao một ứng dụng có một phụ thuộc automatic module thì không thể đóng gói bằng \`jlink\`, dù phụ thuộc đó đã có tên module rõ ràng? Và theo sách, vì sao migrate thẳng từ Java 8 lên Java 17 có thể "đau đầu hơn" so với đi qua hai chặng 8 → 11 → 17?`,
      },
    ],
  },
  {
    id: "wg-w2",
    week: "Tuần 2",
    title: "Cú pháp Java 17, và xuống tới class file cùng bytecode",
    goal: "Dùng được bốn tính năng cú pháp của Java 17 đúng chỗ, và đọc được bytecode của chính mã mình viết bằng `javap`.",
    practice:
      "Viết một `record` có `sealed interface` cha và một `switch` biểu thức khớp trên các nhánh của nó. Biên dịch, rồi chạy `javap -c -p` trên class sinh ra và tìm cho ra: trình biên dịch đã sinh giúp bạn những method nào cho `record`, và `switch` biểu thức được dịch thành dãy lệnh gì.",
    resources: [
      { label: "WGJD 03 — Java 17", href: "#/docs/wgjd-03" },
      { label: "WGJD 04 — Class file và bytecode", href: "#/docs/wgjd-04" },
    ],
    items: [
      {
        id: "wg-w2-1",
        text: "Text block và switch expression",
        lesson: `**Mục tiêu.** Viết được text block đúng với cách \`javac\` xử lý nó (thứ tự chuẩn hóa dòng, xóa thụt lề, rồi mới diễn giải escape), và chuyển được một \`switch\` nhiều case dễ lỗi fall-through thành switch expression vét cạn.

**Đọc.** [3.1 Text Blocks](#/docs/wgjd-03) đọc kỹ ví dụ truy vấn SQL và ba bước \`javac\` thực hiện theo đúng thứ tự đó (chuẩn hóa xuống dòng thành LF, xóa khoảng trắng bao quanh, rồi mới diễn giải escape sequence) — thử tự thêm một escape \`\\n\` literal vào giữa text block và in ra để thấy thứ tự này thực sự có ý nghĩa gì. Đọc khung NOTE về interpolation. [3.2 Switch Expressions](#/docs/wgjd-03) đọc chậm toàn mục — gõ lại cả ba dạng liên tiếp sách đưa ra (switch statement fall-through cũ dùng \`break\`, switch expression dùng \`yield\`, rồi dạng mũi tên \`->\` ngắn gọn nhất), và tự xóa case \`default\` khỏi ví dụ dùng \`int\` để tận mắt thấy lỗi biên dịch "the switch expression does not cover all possible input values".

**Bẫy.** Kỳ vọng text block hỗ trợ nội suy chuỗi (string interpolation) như nhiều ngôn ngữ hiện đại khác — nhúng thẳng một biến vào giữa nội dung mà mong nó tự thay giá trị. Sách nói thẳng trong một khung NOTE: Java Text Blocks hiện chưa hỗ trợ interpolation, dù tính năng này đang được cân nhắc tích cực cho một phiên bản tương lai. Bẫy thứ hai: nghĩ switch expression trên kiểu \`int\` cũng được compiler coi là vét cạn giống enum nên bỏ \`default\`. Sách chỉ rõ compiler chỉ suy ra được tính vét cạn khi mọi hằng enum khả dĩ đều có mặt trong các case; với \`int\` (khoảng bốn tỷ giá trị khả dĩ) bạn luôn phải có \`default\`, thiếu nó là lỗi biên dịch.

**Tự kiểm tra.** Ba bước mà \`javac\` thực hiện trên một text block trước khi nó thành hằng string là gì, và vì sao việc diễn giải escape sequence phải là bước cuối cùng? Và vì sao một switch expression trên enum có thể bỏ \`default\` còn trên \`int\` thì không bao giờ được phép bỏ?`,
      },
      {
        id: "wg-w2-2",
        text: "Record, sealed type, `instanceof` mới và pattern matching",
        lesson: `**Mục tiêu.** Viết được một record có compact constructor kiểm tra hợp lệ, một sealed interface với các record con hiện thực nó, rồi khớp trên các nhánh đó bằng \`instanceof\` kiểu mới hoặc switch pattern matching mà không cần ép kiểu thủ công.

**Đọc.** [3.3 Records](#/docs/wgjd-03) là mục nặng nhất tuần — đọc chậm, đối chiếu class \`FXOrderClassic\` viết tay với khai báo \`record FXOrder(...)\` một dòng, rồi chạy \`javap FXOrder.class\` như sách làm để tự thấy compiler đã sinh giúp những gì. Đọc kỹ 3.3.1 Nominal typing (vì sao Records được thiết kế là named tuple chứ không phải structural typing) và 3.3.2 Compact record constructor — gõ lại đoạn kiểm tra \`units < 1\` trong constructor rút gọn. [3.4 Sealed Types](#/docs/wgjd-03) đọc kỹ, bám theo ví dụ \`Pet\`/\`Cat\`/\`Dog\` trước rồi tới ví dụ \`sealed interface FXOrder permits MarketOrder, LimitOrder\` — đây là mẫu bạn sẽ dùng lại trong bài thực hành tuần này. [3.5 Dạng mới của \`instanceof\`](#/docs/wgjd-03) ngắn nhưng đọc kỹ phạm vi của pattern variable (\`s\` chỉ tồn tại trong nhánh khớp, không tồn tại ở nhánh \`else\` hay sau \`if\`). [3.6 Pattern Matching và các tính năng preview](#/docs/wgjd-03) đọc để thấy sealed type và switch pattern phối hợp ra sao để compiler tự biết phép khớp đã toàn phần, và vì sao ví dụ \`FXOrderResponse\` của sách luôn có case \`null\` tường minh.

**Bẫy.** Thêm ngày càng nhiều phương thức phụ, constructor thay thế, hay bắt record hiện thực nhiều interface chỉ vì "record cũng là class thật". Sách đưa ra quy tắc kinh nghiệm ngược lại: càng cảm thấy bị cám dỗ làm vậy với một Data Carrier, càng có khả năng bạn nên dùng một class đầy đủ thay vì record — record được thiết kế cho trường hợp đơn giản. Bẫy thứ hai: quên case \`null\` khi viết switch pattern matching trên một sealed interface. Ví dụ \`FXOrderResponse\` của sách xử lý null tường minh bằng \`case null -> "Order is null"\` chính vì thiếu nó thì một \`resp\` null sẽ ném \`NullPointerException\` thay vì rơi vào một nhánh nào đó.

**Tự kiểm tra.** Với \`sealed interface FXOrder permits MarketOrder, LimitOrder\`, một switch pattern matching khớp đủ cả \`MarketOrder\` và \`LimitOrder\` có cần \`default\` không, và compiler dựa vào đâu để biết điều đó? Và compact constructor của record khác constructor tường minh, đầy đủ ở điểm nào về những gì compiler tự sinh cho bạn?`,
      },
      {
        id: "wg-w2-3",
        text: "Class loading, class loader và giải phẫu class file",
        lesson: `**Mục tiêu.** Kể lại đúng trình tự loading → verification → preparation → resolution → initialization của một class, phân biệt được \`ClassNotFoundException\` với \`NoClassDefFoundError\`, và đọc được một mục \`Fieldref\` trong constant pool bằng \`javap -v\`.

**Đọc.** [4.1 Class loading và các đối tượng Class](#/docs/wgjd-04) đọc chậm 4.1.1 Loading và linking, bám đúng Hình 4.1 và trình tự năm bước — với mỗi bước tự hỏi JVM đang kiểm tra hay khởi tạo cái gì, đặc biệt phân biệt verification (kiểm tra bytecode an toàn) với initialization (thực sự chạy bytecode khởi tạo static). [4.2 Class loader](#/docs/wgjd-04) đọc kỹ ba class loader nền tảng (Bootstrap, Platform, App) rồi chạy thật đoạn \`getClassLoader()\` ba lần trên \`SiteCheck\`/\`Object\`/\`HttpClient\` như sách làm, để tận mắt thấy loader của \`Object\` trả về \`null\`. Đọc kỹ đoạn phân biệt \`ClassNotFoundException\`, \`NoClassDefFoundError\` và \`LinkageError\`, rồi gõ lại chính xác ví dụ \`ExampleNoClassDef\` để thấy negative caching xảy ra ở lần chạm class thứ hai. 4.2.1 Class loading tùy chỉnh đọc lướt qua hai ví dụ (DI framework, instrumenting class loader) chỉ để nắm ý tưởng — không cần gõ lại. [4.3 Khảo sát class file](#/docs/wgjd-04) chạy thật \`javap -v\` trên listing \`ScratchImpl\` và tự phân giải mục \`#10 Fieldref\` đúng theo cách sách làm mẫu, dùng bảng 4.2 để tra từng loại mục.

**Bẫy.** Bắt và nuốt lỗi khi một class nạp thất bại lần đầu, rồi tin chương trình sẽ chạy bình thường ở lần sau. Ví dụ \`ExampleNoClassDef\` của sách cho thấy ngược lại: JVM hiện thực negative caching cho lần nạp thất bại — nó không thử nạp lại, mà ném thẳng \`NoClassDefFoundError\` ở mọi lần chạm class đó về sau, dù bạn đã bắt được \`ExceptionInInitializerError\` ở lần đầu. Bẫy thứ hai: thấy \`getClassLoader()\` của \`Object\` trả về \`null\` và tưởng đó là lỗi hoặc thiếu sót. Sách giải thích đây là tính năng bảo mật có chủ ý — bootstrap class loader không verify gì và cấp quyền truy cập đầy đủ cho mọi class nó nạp, nên việc để nó lộ ra và thao túng được từ mã Java là quá nguy hiểm.

**Tự kiểm tra.** Nếu bạn bắt và bỏ qua lỗi khi một class nạp thất bại lần đầu, lần tiếp theo mã của bạn chạm đúng class đó, JVM ném ra lỗi gì, và vì sao không phải là exception gốc ban đầu? Và để phân giải một mục \`Fieldref\` trong constant pool thành "tên field, kiểu, và class chứa nó", bạn cần lần theo những loại mục nào khác?`,
      },
      {
        id: "wg-w2-4",
        text: "Đọc bytecode bằng javap, và reflection",
        lesson: `**Mục tiêu.** Chạy được \`javap\` trên class của chính mình và đọc dãy lệnh bytecode như đọc mã nguồn — biết lệnh nào đẩy giá trị lên stack, lệnh nào gọi phương thức, và vì sao trình biên dịch chọn đúng lệnh đó.

**Đọc.** [4.4 Bytecode](#/docs/wgjd-04) là phần chính của mục này — đọc chậm, và với mỗi ví dụ trong sách thì tự dịch một class tương đương rồi chạy \`javap -c\` để đối chiếu. [4.5 Reflection](#/docs/wgjd-04) đọc sau, tập trung vào chỗ sách nối reflection với những gì bạn vừa thấy trong class file ở mục 4.3.

**Bẫy.** Đọc bytecode như đọc mã máy và cố nhớ từng opcode. Sách không đòi bạn thuộc bảng lệnh — nó đòi bạn nhận ra nhóm lệnh và ý nghĩa của nhóm. Bẫy thứ hai: tưởng reflection là một cơ chế tách rời; chương 17 sẽ quay lại chính chỗ này để cho thấy nó đứng trên cái gì.

**Tự kiểm tra.** Với một method cộng hai số nguyên rồi trả về, dãy bytecode gồm những lệnh nào và mỗi lệnh động vào stack ra sao? Và vì sao gọi một method qua reflection chậm hơn gọi trực tiếp?`,
      },
    ],
  },
];
