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
  {
    id: "wg-w3",
    week: "Tuần 3",
    title: "Nền tảng concurrency và Java Memory Model",
    goal: "Giải thích được vì sao một đoạn code đồng thời sai bằng ngôn ngữ của Java Memory Model, chứ không bằng cảm giác \"chắc do race condition\".",
    practice:
      "Viết một class có biến đếm được hai thread cùng tăng, chạy đủ lâu để thấy kết quả sai. Rồi sửa đúng ba lần — một lần bằng `synchronized`, một lần bằng `volatile` (và quan sát vì sao `volatile` **không** đủ cho phép cộng), một lần bằng lớp Atomic. Ghi lại lý do từng cách đúng hay sai theo happens-before.",
    resources: [
      { label: "WGJD 05 — Nền tảng lập trình đồng thời trong Java", href: "#/docs/wgjd-05" },
    ],
    items: [
      {
        id: "wg-w3-1",
        text: "Lý thuyết concurrency và các khái niệm thiết kế",
        lesson: `**Mục tiêu.** Diễn giải được định luật Amdahl bằng công thức của sách để tính giới hạn tăng tốc tối đa, và nêu tên bốn design force (safety, liveness, performance, reusability) cùng lý do chúng thường xung đột với nhau.

**Đọc.** [5.1 Nhập môn lý thuyết concurrency](#/docs/wgjd-05) đọc lướt 5.1.1 và 5.1.2, nhưng dừng lại đọc kỹ [5.1.3 Định luật Amdahl](#/docs/wgjd-05) — tự tính \`T(N) = s + (1/N) * (T1 - s)\` với vài giá trị \`s\` (ví dụ 0,05 và 0,02) và N tăng dần, để tự thấy đường cong hội tụ về \`1/s\` mà không cần nhìn hình 5.1. [5.2 Các khái niệm thiết kế](#/docs/wgjd-05) đọc chậm: [5.2.1 Safety và concurrent type safety](#/docs/wgjd-05) với ví dụ \`StringStack\` — tự tìm điểm context switch có thể xảy ra trong \`push()\` gây trạng thái không nhất quán; [5.2.2 Liveness](#/docs/wgjd-05) phân biệt thất bại tạm thời với thất bại vĩnh viễn; 5.2.3 và 5.2.4 đọc lướt; [5.2.5 Các lực xung đột như thế nào và vì sao?](#/docs/wgjd-05) đọc kỹ bốn kỹ thuật được xếp theo mức độ hữu dụng.

**Bẫy.** Tin rằng đã quen thuộc với \`Thread\` và \`Runnable\` là đủ để viết mã đồng thời đúng đắn. Sách gọi thẳng đây là "một trong những sai lầm phổ biến nhất (và tiềm ẩn chết người nhất)" — biết cú pháp luồng không phải là biết lập trình đồng thời. Bẫy thứ hai: nghĩ rằng thêm bộ xử lý luôn tăng tốc gần như tuyến tính. Định luật Amdahl cho thấy ngược lại — nếu phần tuần tự \`s\` chỉ chiếm 2%, tăng tốc tối đa dù ném bao nhiêu bộ xử lý vào cũng không vượt quá 50 lần.

**Tự kiểm tra.** Nếu một tác vụ có phần tuần tự \`s\` bằng 0,1 (10%), tăng tốc tối đa lý thuyết bạn có thể đạt được, dù có bao nhiêu lõi, là bao nhiêu? Và với \`StringStack\` trong sách, tại điểm context switch nào trong \`push()\` đối tượng bị bỏ lại ở trạng thái không nhất quán, và phần nào của trạng thái đã cập nhật còn phần nào thì chưa?`,
      },
      {
        id: "wg-w3-2",
        text: "Block-structured concurrency trước Java 5",
        lesson: `**Mục tiêu.** Giải thích được sự khác nhau giữa khóa nội tại "thô" (5.3.1) và mẫu fully synchronized object (5.3.3), nêu đúng lý do một field \`volatile\` không đủ để tăng biến đếm, và biết vì sao không bao giờ được gọi \`Thread.stop()\`.

**Đọc.** [5.3 Block-structured concurrency (trước Java 5)](#/docs/wgjd-05) là mục dài nhất chương, đọc theo từng mục con. [5.3.1 Synchronization và khóa](#/docs/wgjd-05) đọc kỹ chín sự thật cơ bản về khóa Java, đặc biệt tính reentrant. [5.3.2 Mô hình trạng thái của một luồng](#/docs/wgjd-05) đọc lướt, chỉ cần nắm sáu trạng thái của \`Thread.State\`. [5.3.3 Fully synchronized object](#/docs/wgjd-05) đọc kỹ ví dụ \`FSOAccount\` và bảy điều kiện của một class fully synchronized. [5.3.4 Deadlock](#/docs/wgjd-05) đọc kỹ ví dụ \`FSOMain\` với hai luồng chuyển tiền qua lại — chạy thử vài lần nếu có thể để tự thấy chương trình treo. [5.3.5 Vì sao lại là \`synchronized\`?](#/docs/wgjd-05) đọc kỹ, đây là câu trả lời cho câu đố sách đặt ra ở 5.3.1. [5.3.6 Từ khóa \`volatile\`](#/docs/wgjd-05) đọc chậm hai quy tắc chi phối field volatile. [5.3.7 Trạng thái và phương thức của luồng](#/docs/wgjd-05) đọc kỹ phần ngắt luồng (\`interrupt()\`) và phần các phương thức đã deprecated; phần API đọc/set metadata thì đọc lướt. [5.3.8 Tính bất biến (Immutability)](#/docs/wgjd-05) đọc kỹ ví dụ \`Deposit\` với factory method và builder.

**Bẫy.** Dùng toán tử \`++\`/\`--\` trên một field \`volatile\` và tin nó an toàn. Sách chỉ rõ các toán tử này tương đương \`v = v + 1\`, một cập nhật phụ thuộc vào trạng thái hiện tại — điều \`volatile\` không bảo vệ được, vì nó chỉ đảm bảo đúng một lần đọc hoặc một lần ghi, không phải cả hai cùng lúc. Bẫy thứ hai: bị cám dỗ dùng \`Thread.stop()\` hoặc \`Thread.suspend()\` để buộc dừng một luồng khác. Sách giải thích \`stop()\` tiêm một \`ThreadDeath\` vào luồng tại một điểm không thể biết trước, có thể giữa một khối \`finally\` đang dở dang, để lại đối tượng ở trạng thái hỏng; còn \`suspend()\` không nhả bất kỳ monitor nào, nên bất kỳ luồng nào khác cố vào một đoạn \`synchronized\` bị khóa bởi luồng đã bị đình chỉ sẽ chặn vĩnh viễn.

**Tự kiểm tra.** Vì sao \`balance++\` không an toàn ngay cả khi \`balance\` được khai báo \`volatile\`, và quy tắc nào của \`volatile\` giải thích chính xác điều đó? Và theo nguyên tắc fully synchronized object, thứ tự lấy khóa nào giữa hai luồng gây ra deadlock trong ví dụ \`FSOMain\`, và sách đề xuất kỹ thuật gì để tránh nó?`,
      },
      {
        id: "wg-w3-3",
        text: "Java Memory Model",
        lesson: `**Mục tiêu.** Phát biểu đúng hai quan hệ Happens-Before và Synchronizes-With cùng các quy tắc JMM liệt kê chúng, đủ để giải thích một đoạn code đồng thời sai bằng ngôn ngữ hình thức thay vì nói "chắc do race condition".

**Đọc.** [5.4 Java Memory Model (JMM)](#/docs/wgjd-05) là mục ngắn nhưng đọc chậm toàn bộ — đây là mục nền tảng nhất chương. Dừng lại ở từng quy tắc trong bốn quy tắc chính và bốn quy tắc bổ sung, và với mỗi quy tắc tự vẽ lại một ví dụ tương tự hình 5.8 (ghi volatile Synchronizes-With đọc sau đó) bằng đối tượng của riêng bạn.

**Bẫy.** Coi các quy tắc JMM là mô tả đầy đủ cách JVM thực sự hành xử. Sách cảnh báo rõ đây chỉ là những đảm bảo *tối thiểu* — một JVM cụ thể có thể hành xử "tốt" hơn nhiều so với yêu cầu, và điều đó dễ tạo cảm giác an toàn giả tạo cho mã chỉ đúng "tình cờ" trên đúng JVM đó. Bẫy thứ hai: coi Happens-Before/Synchronizes-With như một cặp khái niệm có quan hệ kỹ thuật giống Has-A/Is-A trong OO. Sách dùng phép so sánh này để dễ hình dung nhưng nhấn mạnh không có mối liên hệ kỹ thuật trực tiếp nào giữa hai tập khái niệm — đừng suy diễn thêm gì từ phép so sánh ngoài việc chúng đều là khối xây dựng khái niệm nền tảng.

**Tự kiểm tra.** Theo đúng bốn quy tắc chính của JMM, nếu luồng A ghi vào một biến \`volatile\` rồi luồng B đọc biến đó sau, quan hệ Happens-Before nào được thiết lập, và nó dựa trên quy tắc Synchronizes-With nào? Và vì sao một đoạn mã "chạy đúng nhiều lần liên tiếp trên máy của bạn" không phải bằng chứng nó tuân thủ JMM?`,
      },
      {
        id: "wg-w3-4",
        text: "Nhìn concurrency qua bytecode",
        lesson: `**Mục tiêu.** Đây là chỗ kỹ năng \`javap\` học ở tuần 2 (mục "Đọc bytecode bằng javap, và reflection") trả về giá trị: chạy \`javap -c\` trên các phương thức rút/gửi tiền của chương này để thấy đúng những gì \`synchronized\` sinh ra ở tầng bytecode — khối thì có \`monitorenter\`/\`monitorexit\`, phương thức thì chỉ đổi một cờ trong metadata — và giải thích được antipattern Lost Update bằng đúng dãy lệnh \`getfield\`/\`putfield\` đan xen giữa hai luồng.

**Đọc.** [5.5 Hiểu concurrency thông qua bytecode](#/docs/wgjd-05) mở đầu bằng class \`Account\` với ba cặp phương thức rút/gửi/xem-số-dư, mỗi cặp có một bản raw và một bản safe — chạy \`javap -c\` trên class này trước khi đọc tiếp. [5.5.1 Lost Update](#/docs/wgjd-05) đọc kỹ, bám theo đúng dãy \`getfield\`/\`dadd\`/\`putfield\` bị đan xen giữa hai luồng. [5.5.2 Synchronization trong bytecode](#/docs/wgjd-05) đọc kỹ 40 byte bytecode của \`safeWithdraw()\` dạng khối — đối chiếu từng offset với chú thích trong sách. [5.5.3 Phương thức \`synchronized\`](#/docs/wgjd-05) đọc chậm, đây là chỗ bất ngờ nhất mục này. [5.5.4 Đọc không đồng bộ (unsynchronized reads)](#/docs/wgjd-05) đọc kỹ ví dụ thêm phí ATM. [5.5.5 Xem lại deadlock](#/docs/wgjd-05) và [5.5.6 Xem lại việc giải quyết deadlock](#/docs/wgjd-05) đọc lướt — nguyên lý đã gặp ở 5.3.4, ở đây chỉ là cùng ý tưởng nhìn qua lệnh \`monitorenter\`. [5.5.7 Truy cập volatile](#/docs/wgjd-05) đọc kỹ, đối chiếu với 5.3.6 đã đọc ở mục trước.

**Bẫy.** Đoán rằng một phương thức khai báo \`synchronized\` sẽ sinh ra cùng cặp lệnh \`monitorenter\`/\`monitorexit\` như một khối \`synchronized\`. Sách nói thẳng "chúng ta có thể đoán... nhưng thực ra không phải vậy" — modifier \`synchronized\` trên phương thức chỉ hiện diện trong flag \`ACC_SYNCHRONIZED\`, và chính trình thông dịch bytecode kiểm tra flag đó ở lệnh \`invoke\` để quyết định có lấy khóa hay không. Bẫy thứ hai: tin rằng "chỉ phương thức ghi mới cần synchronized, đọc thì an toàn". Sách gọi điều này "hoàn toàn không đúng" và chứng minh bằng ví dụ phí ATM — một lần đọc \`getRawBalance()\` không đồng bộ có thể chen giữa hai lần \`putfield\` của một \`safeWithdraw()\` đang xử lý dở, trả về một giá trị chưa từng thực sự tồn tại trong hệ thống (nonrepeatable read).

**Tự kiểm tra.** Với hai bản \`safeWithdraw()\` — một viết bằng khối \`synchronized (this) { ... }\`, một viết bằng modifier \`synchronized\` trên chữ ký phương thức — khác biệt nằm ở đâu trong bytecode sinh ra, và ai (compiler hay trình thông dịch) chịu trách nhiệm lấy khóa trong từng trường hợp? Và trong ví dụ phí ATM, đan xen bytecode nào giữa \`getRawBalance()\` và \`safeWithdraw(amount, true)\` dẫn tới một lần đọc không tương ứng với bất kỳ trạng thái thực nào của tài khoản?`,
      },
    ],
  },
  {
    id: "wg-w4",
    week: "Tuần 4",
    title: "Thư viện concurrency của JDK",
    goal: "Chọn đúng công cụ đồng bộ cho từng bài toán thay vì mặc định dùng `synchronized` cho mọi thứ.",
    practice:
      "Lấy đoạn code đếm ở tuần 3, viết lại bằng `ExecutorService` với một pool cố định, nộp tác vụ qua `Future`, và thay biến đếm bằng `AtomicLong`. Rồi đo thời gian chạy với pool 1, 4 và 16 thread trên máy bạn — và giải thích con số thu được.",
    resources: [
      { label: "WGJD 06 — Thư viện concurrency của JDK", href: "#/docs/wgjd-06" },
    ],
    items: [
      {
        id: "wg-w4-1",
        text: "Khối xây dựng của ứng dụng đồng thời hiện đại, và các class Atomic",
        lesson: `**Mục tiêu.** Biết khi nào nên thay \`synchronized\`/\`volatile\` cổ điển bằng một class Atomic, và dùng đúng các thao tác như \`getAndIncrement()\` cho các cập nhật phụ thuộc trạng thái mà một field \`volatile\` đơn thuần không làm được an toàn.

**Đọc.** [6.1 Các khối xây dựng cho ứng dụng đồng thời hiện đại](#/docs/wgjd-06) ngắn, đọc lướt để nắm bối cảnh: \`java.util.concurrent\` ra đời từ Java 5 và là lựa chọn nên ưu tiên hơn concurrency cổ điển của chương 5. [6.2 Các class Atomic](#/docs/wgjd-06) đọc chậm toàn mục — đối chiếu ví dụ \`AtomicInteger\` sinh \`accountId\` với cách chương 5 làm cùng việc bằng \`synchronized\`, rồi đối chiếu ví dụ \`TaskManager\` dùng \`AtomicBoolean\` với mẫu Volatile Shutdown ở mục 5.5.7 bạn vừa đọc tuần trước.

**Bẫy.** Coi \`AtomicInteger\` như một \`Integer\` thay thế được hay \`AtomicBoolean\` như một \`Boolean\` thay thế được. Sách cảnh báo bằng một khung WARNING: các class atomic không kế thừa từ những class có tên tương tự — \`AtomicBoolean\` không dùng thay cho \`Boolean\`, và một \`AtomicInteger\` không phải một \`Integer\` (dù nó có kế thừa \`Number\`). Bẫy thứ hai: nghĩ atomic chỉ là một field \`volatile\` được bọc lại nên không mang thêm gì mới. Sách chỉ rõ điểm khác biệt cốt lõi: atomic cung cấp các thao tác atomic cho cập nhật phụ thuộc trạng thái (như \`getAndIncrement()\`), điều không thể làm với \`volatile\` nếu không dùng khóa — đúng hạn chế của \`volatile\` bạn vừa gặp ở tuần 3.

**Tự kiểm tra.** Vì sao \`AtomicInteger nextAccountId\` an toàn để dùng làm bộ sinh số thứ tự giữa nhiều luồng, trong khi một \`volatile int nextAccountId\` cùng với \`nextAccountId++\` thì không? Và nếu bạn cần lưu một giá trị \`boolean\` dùng chung giữa các luồng, lý do gì khiến \`AtomicBoolean\` không thể dùng ở bất cứ đâu code hiện có đang khai báo kiểu \`Boolean\`?`,
      },
      {
        id: "wg-w4-2",
        text: "Class Lock và CountDownLatch",
        lesson: `**Mục tiêu.** Viết lại một đoạn tránh deadlock bằng \`ReentrantLock\` tường minh thay vì \`synchronized\`, đúng theo mẫu \`lock()\`/\`try\`/\`finally\`/\`unlock()\`, và dùng \`CountDownLatch\` để chặn một luồng tới khi một nhóm luồng khác hoàn tất.

**Đọc.** [6.3 Các class Lock](#/docs/wgjd-06) đọc kỹ — trước tiên là các thiếu sót của cách tiếp cận khóa block-structured được liệt kê ở đầu mục, rồi Listing 6.1 viết lại ví dụ tránh deadlock của chương 5 bằng \`ReentrantLock\`, đối chiếu từng dòng với \`safeTransferTo()\` bạn đã đọc ở mục 5.5.6. [6.3.1 Đối tượng Condition](#/docs/wgjd-06) đọc lướt, chỉ cần nắm một \`Lock\` có thể có nhiều \`Condition\` trong khi một monitor nội tại chỉ có một. [6.4 CountDownLatch](#/docs/wgjd-06) đọc kỹ Listing 6.2 và đoạn mã điều khiển đi kèm — chạy thử với vài luồng \`Counter\` và quan sát \`latch.await()\` chặn ra sao tới khi count về 0.

**Bẫy.** Quên rằng, khác với một khối \`synchronized\`, một \`Lock\` không tự nhả khi có exception ném ra bên trong — nếu không bọc \`unlock()\` trong \`finally\` như Listing 6.1 làm, một exception giữa chừng sẽ khiến khóa bị giữ vĩnh viễn. Bẫy thứ hai: tưởng có thể "nạp lại" một \`CountDownLatch\` đã về 0 để dùng cho một vòng chờ thứ hai. Sách nói rõ \`await()\` không làm gì nếu count đã bằng 0 hoặc nhỏ hơn — một khi count chạm 0, latch mở vĩnh viễn và mọi lời gọi \`await()\` sau đó trả về ngay lập tức, nó không phải một rào cản có thể tái sử dụng.

**Tự kiểm tra.** Trong Listing 6.1, mẫu \`firstLock\`/\`secondLock\` dựa trên tiêu chí nào để quyết định khóa nào được lấy trước, và vì sao chính tiêu chí đó (chứ không phải thứ tự lời gọi \`transferTo()\`) mới là thứ ngăn deadlock? Và nếu một hệ thống cần đợi hai lượt nạp cache tách biệt hoàn tất tuần tự, vì sao một \`CountDownLatch\` duy nhất không thể phục vụ cho cả hai lượt?`,
      },
      {
        id: "wg-w4-3",
        text: "Collection đồng thời: ConcurrentHashMap, CopyOnWriteArrayList, blocking queue",
        lesson: `**Mục tiêu.** Chọn đúng cấu trúc dữ liệu concurrent theo tỉ lệ đọc/ghi của bài toán — \`ConcurrentHashMap\` cho map dùng chung, \`CopyOnWriteArrayList\` khi đọc áp đảo ghi, \`BlockingQueue\` khi cần điều phối luồng qua hàng đợi — thay vì mặc định đồng bộ hóa toàn bộ cấu trúc.

**Đọc.** [6.5 ConcurrentHashMap](#/docs/wgjd-06) đọc lướt 6.5.1–6.5.3 (chỉ cần nắm ý tưởng hash chain và bucket của \`Dictionary\` đồ chơi trong sách), rồi đọc kỹ [6.5.4 Dùng ConcurrentHashMap](#/docs/wgjd-06) — đặc biệt đoạn mô tả một luồng có thể kẹt trong vòng lặp vô hạn thực sự khi hai luồng cùng ghi vào một \`HashMap\` thường, và kỹ thuật lock striping ở hình 6.3. [6.6 CopyOnWriteArrayList](#/docs/wgjd-06) đọc kỹ, bám theo Listing 6.3 và tự chạy nó để thấy vì sao \`it\` (iterator tạo trước \`add(4)\`) không bao giờ thấy phần tử thứ tư. [6.7 Blocking queue](#/docs/wgjd-06) đọc kỹ hai tính chất \`put()\`/\`take()\`, rồi phần so sánh \`LinkedBlockingQueue\` với \`ArrayBlockingQueue\` về back pressure. [6.7.1 Dùng API của BlockingQueue](#/docs/wgjd-06) đọc kỹ ba chiến lược (chặn, giá trị đặc biệt, exception) và lý do sách khuyến nghị tránh \`add()\`/\`remove()\`. [6.7.2 Dùng WorkUnit](#/docs/wgjd-06) đọc lướt.

**Bẫy.** Nghĩ rằng dùng \`HashMap\` thường cho nhiều luồng ghi cùng lúc chỉ gây ra kết quả hơi sai (kiểu Lost Update như đã gặp ở chương 5). Sách chỉ rõ tình huống thực tế còn tệ hơn nhiều: một trong các luồng có thể bị kẹt trong một vòng lặp vô hạn thật sự, khiến \`HashMap\` "hoàn toàn không an toàn để dùng trong ứng dụng đa luồng" chứ không chỉ là kém chính xác. Bẫy thứ hai: tin rằng vì tên gọi là \`BlockingQueue\` nên \`put()\` trên một \`LinkedBlockingQueue\` luôn tạo áp lực ngược khi hàng đầy. Sách chỉ ra \`LinkedBlockingQueue\` thường được tạo không giới hạn (kích thước mặc định là \`Integer.MAX_VALUE\`), nên trên thực tế \`put()\` gần như không bao giờ chặn — chỉ \`ArrayBlockingQueue\`, có kích thước cố định thật sự, mới cho back pressure đúng nghĩa.

**Tự kiểm tra.** Vì sao lock striping trong hình 6.3 cho phép hai luồng thao tác trên \`ConcurrentHashMap\` đồng thời mà không cần đợi nhau, trong khi vẫn phải chặn nếu cả hai cùng chạm một hash chain? Và giữa \`LinkedBlockingQueue\` không giới hạn và \`ArrayBlockingQueue\` có giới hạn, cấu trúc nào thực sự buộc một luồng producer phải chậm lại khi luồng consumer không theo kịp — và vì sao?`,
      },
      {
        id: "wg-w4-4",
        text: "Future, tác vụ và thực thi",
        lesson: `**Mục tiêu.** Chọn đúng loại Executor (single-thread, fixed, cached, scheduled) theo đặc điểm workload, và dùng \`Future\`/\`CompletableFuture\` đúng cách, kể cả xử lý timeout và biết giới hạn thật của \`cancel()\`.

**Đọc.** [6.8 Future](#/docs/wgjd-06) đọc kỹ ba phương thức chính (\`get()\`, \`isDone()\`, \`cancel()\`) và Listing 6.5 — chú ý sách tự thừa nhận mã ví dụ "không cung cấp cơ chế nào để hủy yêu cầu". [6.8.1 CompletableFuture](#/docs/wgjd-06) đọc kỹ, đặc biệt đoạn \`complete()\` chỉ có hiệu lực một lần và mọi lời gọi \`complete()\` sau đó bị bỏ qua; so sánh hai cách viết \`getNthPrime()\` (tạo \`Thread\` tường minh so với \`supplyAsync()\`). [6.9 Tác vụ và thực thi](#/docs/wgjd-06) đọc kỹ [6.9.1 Mô hình hóa tác vụ](#/docs/wgjd-06) (\`Callable\` và \`FutureTask\`) và nguyên tắc "mọi tác vụ phải kết thúc trong thời gian hữu hạn". [6.9.2 Executor](#/docs/wgjd-06) đọc lướt định nghĩa interface. Đọc kỹ lần lượt [6.9.3 Single-threaded executor](#/docs/wgjd-06), [6.9.4 Fixed-thread pool](#/docs/wgjd-06), [6.9.5 Cached thread pool](#/docs/wgjd-06) và [6.9.6 ScheduledThreadPoolExecutor](#/docs/wgjd-06) — với mỗi loại, tự hỏi workload nào nó phù hợp nhất, đúng như bạn sẽ cần chọn cho phần thực hành đo thời gian tuần này.

**Bẫy.** Tin rằng một fixed-thread pool sẽ luôn duy trì đúng số luồng đã cấu hình. Sách cảnh báo nếu một luồng executor trong pool chết (ví dụ do tác vụ ném runtime exception chưa bắt), nó không được thay thế — với đủ tác vụ lỗi, pool dần cạn luồng và cuối cùng không còn luồng nào xử lý việc mới. Bẫy thứ hai: nghĩ rằng gọi \`fut.cancel(true)\` khi hết timeout sẽ dừng hẳn phép tính đang chạy. Chính ví dụ \`getNthPrime()\` của sách cho thấy điều ngược lại — mã như đã viết "không cung cấp cơ chế nào để hủy yêu cầu", nên \`cancel()\` chỉ thực sự dừng tác vụ nếu mã bên trong tác vụ chủ động hợp tác (ví dụ kiểm tra trạng thái interrupt).

**Tự kiểm tra.** Nếu một tác vụ được submit vào một \`newFixedThreadPool(2)\` rơi vào vòng lặp vô hạn và làm luồng thực thi nó chết vì lỗi không bắt được, điều gì xảy ra với dung lượng xử lý của pool đó về sau, và vì sao? Và để \`getNthPrime()\` trong Listing 6.5 thực sự hủy được khi hết timeout, phép tính \`findPrime()\` bên trong cần thay đổi gì để hợp tác với \`cancel(true)\`?`,
      },
    ],
  },
];
