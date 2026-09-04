// Lộ trình đọc Modern Java in Action — Phần 2 (Tuần 7–12).
//
// Nguồn: bản dịch tiếng Việt "Modern Java in Action" (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Thư mục nguồn: modern-java-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần gõ code nằm ở `practice` mức tuần, không thành khối thứ 5 trong `lesson`.
// GIỮ NGUYÊN id (mj-w<N> / mj-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const mjiaWeeksPart2 = [
  {
    id: "mj-w7",
    week: "Tuần 7",
    title: "Optional thay null, và Date/Time API",
    goal: "Mô hình hoá được sự vắng mặt của một giá trị bằng kiểu thay vì bằng null, và chọn đúng lớp date-time cho một bài toán mà không phải tra Javadoc từng lần.",
    practice:
      "lấy một chuỗi truy cập lồng nhau trong code của bạn đang phải kiểm `null` từng tầng (kiểu `a.getB().getC().getD()`), viết lại bằng `Optional` với `map`/`flatMap` theo §11.3; rồi thay mọi `Date`/`Calendar` trong một class sang `LocalDate`/`Instant` và ghi lại chỗ nào compile hỏng.",
    resources: [
      { label: "MJIA 11 — Dùng Optional thay cho null", href: "#/docs/mjia-11" },
      { label: "MJIA 12 — Date and Time API mới", href: "#/docs/mjia-12" },
    ],
    items: [
      {
        id: "mj-w7-1",
        text: "Vì sao null là lỗi thiết kế, và Optional mô hình hoá sự vắng mặt thế nào",
        lesson: `**Mục tiêu.** Kể được năm vấn đề mà sách quy cho null reference, và đọc một chữ ký phương thức là biết tác giả có dự liệu giá trị vắng mặt hay không.

**Đọc.** [11.1. Làm sao để mô hình hoá sự vắng mặt của một giá trị?](#/docs/mjia-11) mở bằng mô hình Person/Car/Insurance ở Listing 11.1 — gõ ba class này vào IDE ngay, mọi ví dụ sau đều dựng trên chúng. [11.1.1. Giảm NullPointerException bằng cách kiểm tra phòng thủ](#/docs/mjia-11) đặt cạnh nhau Listing 11.2 "những nghi ngờ chồng chất" và Listing 11.3 "quá nhiều lối ra"; chép cả hai ra giấy, phần còn lại của chương là chuỗi thao tác xoá chúng đi. [11.1.2. Các vấn đề với null](#/docs/mjia-11) chỉ là năm gạch đầu dòng nhưng đọc chậm nhất. [11.1.3. Các giải pháp thay thế null trong các ngôn ngữ khác là gì?](#/docs/mjia-11) cho toán tử \`?.\` của Groovy cùng kiểu \`Maybe\` của Haskell và \`Option[T]\` của Scala. [11.2. Giới thiệu class Optional](#/docs/mjia-11) với Hình 11.1 và Listing 11.4 — bản viết lại của Listing 11.1; so từng trường để thấy chỗ nào thành \`Optional\` và chỗ nào cố ý không.

**Bẫy.** Vá một NullPointerException bằng cách thêm một câu lệnh \`if\` rồi coi như xong. §11.1.3 nói thẳng: nếu bạn làm vậy mà không tự hỏi liệu việc thuật toán hay mô hình dữ liệu của bạn sinh ra null ở đó có đúng không, thì bạn không sửa lỗi mà đang che giấu nó — sách gọi đó là quét rác xuống dưới thảm, và bảo toán tử điều hướng an toàn của Groovy chỉ là một cây chổi to hơn để phạm cùng sai lầm ấy. Bẫy thứ hai: đọc chương này rồi đi thay mọi null reference bằng \`Optional\`. §11.2 chặn đúng chỗ đó: ý định của class Optional không phải là thay thế mọi null reference, mà là giúp bạn thiết kế API dễ hiểu hơn — chính vì thế trường \`name\` của \`Insurance\` trong Listing 11.4 vẫn để kiểu \`String\`.

**Tự kiểm tra.** Trong Listing 11.2, vì sao riêng tên công ty bảo hiểm được miễn phép kiểm tra null, và điều gì trong các class Java lúc đó chưa phản ánh được lý do ấy? Và trong năm vấn đề ở §11.1.2, cái nào nói về lỗ hổng trong hệ thống kiểu?`,
      },
      {
        id: "mj-w7-2",
        text: "Khuôn mẫu dùng Optional, và Optional trong API thực tế",
        lesson: `**Mục tiêu.** Viết được một chuỗi truy xuất nhiều tầng thành đúng một câu lệnh fluent, và chọn đúng trong sáu cách mở bọc một \`Optional\` thay vì với tay lấy \`get()\`.

**Đọc.** [11.3. Các khuôn mẫu để áp dụng Optional](#/docs/mjia-11) rồi [11.3.1. Tạo đối tượng Optional](#/docs/mjia-11) với ba factory \`empty\`, \`of\`, \`ofNullable\` — nhớ \`of(null)\` ném ngay NullPointerException. [11.3.2. Trích xuất và biến đổi giá trị từ Optional với map](#/docs/mjia-11) và Hình 11.2 đặt \`map\` của Optional cạnh \`map\` của Stream. [11.3.3. Nối chuỗi các đối tượng Optional với flatMap](#/docs/mjia-11) là mục đọc chậm nhất tuần: bám Hình 11.3, Hình 11.4, Hình 11.5 và gõ lại Listing 11.5. [11.3.4. Thao tác trên một stream các optional](#/docs/mjia-11) cho mẹo \`flatMap(Optional::stream)\` ở Listing 11.6. [11.3.5. Hành động mặc định và mở bọc một Optional](#/docs/mjia-11) là danh sách bảy phương thức — chép ra giấy, chú ý \`orElse\` so với \`orElseGet\`. [11.3.6. Kết hợp hai Optional](#/docs/mjia-11) làm quiz 11.1 rồi đọc trọn đáp án; [11.3.7. Loại bỏ một số giá trị với filter](#/docs/mjia-11) làm tiếp quiz 11.2. Sang [11.4. Các ví dụ thực tế về việc dùng Optional](#/docs/mjia-11) với [11.4.1. Bọc một giá trị có thể null trong một Optional](#/docs/mjia-11), [11.4.2. Exception so với Optional](#/docs/mjia-11), [11.4.3. Optional cho kiểu primitive và vì sao bạn không nên dùng chúng](#/docs/mjia-11) và [11.4.4. Ghép tất cả lại với nhau](#/docs/mjia-11) — tự giải quiz 11.3 trước.

**Bẫy.** Quen tay dùng \`map\` cho cả chuỗi \`Person\` → \`Car\` → \`Insurance\`. §11.3.3 cho thấy đoạn đó không biên dịch được: \`getCar\` trả về \`Optional<Car>\` nên \`map\` cho ra \`Optional<Optional<Car>>\`, và optional ngoài cùng chẳng có \`getInsurance\` nào; chỉ \`flatMap\` mới làm phẳng optional hai tầng. Bẫy thứ hai: thấy có \`OptionalInt\` thì dùng nó cho gọn, theo thói quen numeric stream ở chương 5. §11.4.3 bác lại: lý do hiệu năng không áp dụng vì một Optional chỉ chứa nhiều nhất một giá trị, còn optional primitive lại thiếu đúng \`map\`, \`flatMap\` và \`filter\` — và không truyền được dưới dạng method reference cho \`flatMap\` của một optional khác.

**Tự kiểm tra.** Vì sao class \`Optional\` không cài đặt \`Serializable\`, và sách gợi ý làm gì khi bạn vẫn cần một domain model serializable? Và \`orElseGet\` hơn \`orElse\` ở đúng hai tình huống nào?`,
      },
      {
        id: "mj-w7-3",
        text: "Bộ kiểu bất biến: LocalDate, LocalTime, Instant, Duration, Period",
        lesson: `**Mục tiêu.** Chọn đúng giữa nhóm kiểu dành cho con người và kiểu dành cho máy tính, và biết trước lời gọi nào sẽ ném ngoại lệ vì bạn trộn hai nhóm đó với nhau.

**Đọc.** Mở đầu chương 12 là ba trang kể tội \`java.util.Date\` và \`java.util.Calendar\` — đọc kỹ, vì đây là danh sách lý do bạn sẽ dùng để thuyết phục đội: offset năm tính từ 1900, tháng đánh chỉ số từ 0, \`DateFormat\` không thread-safe, và cả hai lớp đều mutable. [12.1. LocalDate, LocalTime, LocalDateTime, Instant, Duration và Period](#/docs/mjia-12) liệt kê sáu lớp mới của package \`java.time\`. [12.1.1. Làm việc với LocalDate và LocalTime](#/docs/mjia-12) gõ lại Listing 12.1 và Listing 12.3, rồi Listing 12.2 để thấy cặp \`get(ChronoField...)\` và getter dễ đọc cho cùng một thứ. [12.1.2. Kết hợp một ngày và một giờ](#/docs/mjia-12) ngắn: năm cách dựng một \`LocalDateTime\` ở Listing 12.4, cùng \`toLocalDate\`/\`toLocalTime\` đi ngược lại. [12.1.3. Instant: ngày và giờ dành cho máy tính](#/docs/mjia-12) là mục đọc chậm nhất — mốc Unix epoch, hai biến thể \`ofEpochSecond\`, và đoạn code cố ý gây lỗi ở cuối mục. [12.1.4. Định nghĩa một Duration hoặc một Period](#/docs/mjia-12) với factory \`between\`, Listing 12.5 và Bảng 12.1; ghi lại rằng mọi lớp trong chương đều immutable.

**Bẫy.** Gọi \`Instant.now().get(ChronoField.DAY_OF_MONTH)\` vì \`Instant\` cũng cài đặt \`Temporal\`. §12.1.3 dựng đúng bẫy này rồi in ra \`UnsupportedTemporalTypeException: Unsupported field DayOfMonth\`: \`Instant\` chỉ gồm một số giây và một số nanosecond, nên nó không cung cấp khả năng nào để xử lý những đơn vị thời gian có ý nghĩa với con người. Bẫy thứ hai: coi \`Duration.between\` là hàm đo khoảng cách cho mọi cặp đối tượng temporal. §12.1.4 nêu hai giới hạn: vì \`LocalDateTime\` và \`Instant\` sinh ra cho hai mục đích khác nhau nên trộn chúng chỉ nhận về một \`DateTimeException\`; và vì \`Duration\` đo bằng giây rồi nanosecond nên bạn không thể truyền một \`LocalDate\` vào \`between\` — chỗ đó phải dùng \`Period\`.

**Tự kiểm tra.** Vì sao \`Instant.ofEpochSecond(2, 1_000_000_000)\` và \`Instant.ofEpochSecond(4, -1_000_000_000)\` trả về cùng một \`Instant\`, và phần nanosecond được lưu luôn nằm trong khoảng nào? Và \`Period.of(2, 6, 1)\` mô hình hoá lượng thời gian theo những đơn vị nào, khác \`Duration\` ở đâu?`,
      },
      {
        id: "mj-w7-4",
        text: "Thao tác, parse, định dạng ngày tháng, và time zone",
        lesson: `**Mục tiêu.** Diễn đạt được một quy tắc nghiệp vụ về ngày ("ngày làm việc kế tiếp") thành một \`TemporalAdjuster\` dùng lại được, và nói được khi nào bạn cần \`ZoneId\` chứ không phải \`ZoneOffset\`.

**Đọc.** [12.2. Thao tác, parse và định dạng ngày tháng](#/docs/mjia-12) đi từ nhóm \`withAttribute\` ở Listing 12.6 (cách tuyệt đối) sang \`plus\`/\`minus\` ở Listing 12.7 (cách tương đối), rồi Bảng 12.2; làm quiz 12.1 trước khi xem đáp án, và đọc kỹ đoạn giải thích ngay sau nó. [12.2.1. Làm việc với TemporalAdjusters](#/docs/mjia-12) là mục đọc chậm nhất: Listing 12.8, Bảng 12.3 với mười ba factory method — chép ra giấy — rồi Listing 12.9 cho thấy \`TemporalAdjuster\` chỉ có đúng một phương thức; tự giải quiz 12.2 \`NextWorkingDay\` trước khi xem đáp án, sau đó đọc tiếp ba biến thể viết lại nó thành lambda và thành \`ofDateAdjuster\`. [12.2.2. In và parse các đối tượng date-time](#/docs/mjia-12) với các hằng \`BASIC_ISO_DATE\`, \`ISO_LOCAL_DATE\`, Listing 12.10 đến Listing 12.12; chú ý câu nói mọi \`DateTimeFormatter\` đều thread-safe. [12.3. Làm việc với các time zone và hệ lịch khác nhau](#/docs/mjia-12) rồi [12.3.1. Sử dụng time zone](#/docs/mjia-12) với Listing 12.13 và Hình 12.1, [12.3.2. Offset cố định so với UTC/Greenwich](#/docs/mjia-12), và [12.3.3. Sử dụng các hệ lịch thay thế](#/docs/mjia-12) đọc lướt được, trừ đoạn khuyến nghị ở cuối.

**Bẫy.** Gọi một phương thức \`with\` hay \`plus\` rồi tưởng đối tượng cũ đã đổi. Quiz 12.1 chốt đúng chỗ đó: dòng cuối \`date.withYear(2011);\` không có tác dụng nào quan sát được, vì nó tạo một instance \`LocalDate\` mới mà bạn không gán cho biến nào — đáp án vẫn là 2016-09-08. Bẫy thứ hai: dựng time zone bằng \`ZoneOffset.of("-05:00")\` cho tiện. §12.3.2 cảnh báo một \`ZoneOffset\` định nghĩa theo cách này không có bất kỳ cơ chế quản lý Daylight Saving Time nào, và vì lý do đó nó không được khuyến nghị trong phần lớn các trường hợp; muốn có DST thì phải dùng region ID dạng \`"{area}/{city}"\` theo IANA Time Zone Database.

**Tự kiểm tra.** Vì sao sách khuyên định nghĩa \`TemporalAdjuster\` bằng lambda thì nên đi qua \`TemporalAdjusters.ofDateAdjuster\`, và nó nhận kiểu gì? Và những giả định sai nào khiến sách khuyên dùng \`LocalDate\` chứ không phải \`ChronoLocalDate\` xuyên suốt ứng dụng?`,
      },
    ],
  },
  {
    id: "mj-w8",
    week: "Tuần 8",
    title: "Default method và hệ thống module",
    goal: "Thêm được một phương thức vào interface đã phát hành mà không phá code người dùng, và cắt một dự án thành các module có ranh giới được compiler kiểm tra.",
    practice:
      "tự tay dựng lại ví dụ hai module của §14.4–§14.6 — viết `module-info.java` cho cả hai, biên dịch bằng `javac --module-source-path`, đóng gói bằng `jar`, chạy bằng `java --module-path`; rồi cố tình bỏ một `requires` để xem thông báo lỗi trông thế nào.",
    resources: [
      { label: "MJIA 13 — Default method", href: "#/docs/mjia-13" },
      { label: "MJIA 14 — Hệ thống module của Java", href: "#/docs/mjia-14" },
      { label: "openjdk.org — JEP 261: Module System", href: "https://openjdk.org/jeps/261" },
    ],
    items: [
      {
        id: "mj-w8-1",
        text: "Tiến hoá API mà không phá code người dùng",
        lesson: `**Mục tiêu.** Phân biệt được ba loại tương thích khi sửa một interface đã phát hành, và nói được vì sao \`stream\` trong \`Collection\` buộc phải là default method chứ không thể là phương thức trừu tượng.

**Đọc.** Phần mở đầu chương 13 đáng đọc trọn: nó cho hai default method bạn đã dùng suốt sáu tuần qua — \`sort\` trong \`List\` và \`stream\` trong \`Collection\` — kèm phần thân thật của chúng, và khung "Static method và interface". [13.1. Tiến hoá các API](#/docs/mjia-13) dựng tình huống bạn là tác giả một thư viện vẽ có interface \`Resizable\`. [13.1.1. API phiên bản 1](#/docs/mjia-13) cho \`Ellipse\` của người dùng và class \`Game\`; [13.1.2. API phiên bản 2](#/docs/mjia-13) là mục đọc chậm nhất — chạy tay hai kịch bản không biên dịch lại và có biên dịch lại, đối chiếu với hai thông báo lỗi in trong sách, rồi đọc kỹ khung "Các loại tương thích khác nhau: tương thích nhị phân, mã nguồn và hành vi". [13.2. Default method — tóm tắt nhanh](#/docs/mjia-13) cho bổ từ \`default\`, interface \`Sized\`, và khung "Abstract class và interface trong Java 8"; làm quiz 13.1 rồi đọc trọn đáp án \`removeIf\`.

**Bẫy.** Nghe "thêm phương thức vào interface là tương thích nhị phân" rồi kết luận thay đổi đó an toàn. §13.1.2 cho thấy nó chỉ an toàn chừng nào không ai đụng tới: trò chơi vẫn chạy nếu không biên dịch lại, nhưng ngay khi \`Utils.paint\` gọi \`setRelativeSize\` trên một \`Ellipse\`, chương trình ném \`AbstractMethodError\` lúc chạy; còn nếu người dùng build lại toàn bộ thì nhận lỗi biên dịch "is not abstract and does not override abstract method". Bẫy thứ hai: kết luận interface giờ đã bằng abstract class nên cứ dồn hết vào interface. Khung "Abstract class và interface trong Java 8" nêu hai khác biệt còn lại: một class chỉ extend được đúng một abstract class nhưng implement được nhiều interface, và abstract class áp đặt được trạng thái chung qua biến thể hiện, còn interface không thể có biến thể hiện.

**Tự kiểm tra.** Trong ba loại tương thích, việc thêm một phương thức trừu tượng vào interface phá loại nào và giữ nguyên hai loại nào? Và vì sao đáp án quiz 13.1 nói việc copy-paste \`removeIf\` vào từng class của Collections API là "một tội ác đối với cộng đồng Java"?`,
      },
      {
        id: "mj-w8-2",
        text: "Ba mẫu dùng default method, và luật gỡ xung đột kim cương",
        lesson: `**Mục tiêu.** Dựng được một bộ interface tối giản trực giao để một class gom hành vi từ nhiều nguồn, và chạy ba quy tắc giải quyết xung đột trong đầu cho một cây phân cấp bất kỳ.

**Đọc.** [13.3. Các mẫu sử dụng cho default method](#/docs/mjia-13) mở ra hai tình huống. [13.3.1. Optional method](#/docs/mjia-13) ngắn: \`Iterator.remove\` mặc định ném \`UnsupportedOperationException\` để các class không phải viết phần cài đặt rỗng. [13.3.2. Đa kế thừa hành vi](#/docs/mjia-13) là mục dài nhất — gõ lại trọn ba interface \`Rotatable\`, \`Moveable\`, \`Resizable\` rồi ghép thành \`Monster\` và \`Sun\`; chú ý bảy kiểu mà \`ArrayList\` là kiểu con, câu nối \`rotateBy\` với design pattern Template Method, Hình 13.3 và Hình 13.4, và khung "Kế thừa bị xem là có hại". [13.4. Các quy tắc giải quyết xung đột](#/docs/mjia-13) đặt câu hỏi bằng cặp interface \`A\`/\`B\`. [13.4.1. Ba quy tắc giải quyết xung đột cần biết](#/docs/mjia-13) chỉ ba dòng — chép ra giấy, đây là thứ bạn sẽ chạy trong đầu. [13.4.2. Interface cung cấp default method cụ thể nhất sẽ thắng](#/docs/mjia-13) với Hình 13.5, Hình 13.6 và quiz 13.2; [13.4.3. Xung đột và việc khử nhập nhằng một cách tường minh](#/docs/mjia-13) cho cú pháp \`X.super.m(...)\` và quiz 13.3; [13.4.4. Bài toán kim cương](#/docs/mjia-13) với Hình 13.8 và khung so sánh C++.

**Bẫy.** Thấy sơ đồ hình kim cương là kết luận ngay có xung đột phải khử tường minh. §13.4.4 cho thấy ngược lại: khi \`B\` và \`C\` chỉ extend \`A\` mà không khai lại \`hello\`, bạn chỉ có duy nhất một khai báo để chọn, nên \`D\` in ra "Hello from A"; xung đột chỉ xuất hiện khi cả \`B\` lẫn \`C\` cùng khai một \`hello\` cùng chữ ký. Bẫy thứ hai: tin rằng kiểu trả về hẹp hơn thì cụ thể hơn nên sẽ thắng. Quiz 13.3 bác lại bằng \`Number getNumber()\` ở \`A\` và \`Integer getNumber()\` ở \`B\`: \`C\` không phân biệt được cái nào cụ thể hơn, nên class \`C\` không biên dịch được.

**Tự kiểm tra.** Nếu \`D\` được khai là \`public abstract class D implements A\` với \`public abstract void hello();\` thì \`C\` buộc phải làm gì, dù cây phân cấp vẫn còn default method ở chỗ khác? Và bạn viết gì trong thân \`hello\` của \`C\` để chọn tường minh phần cài đặt của \`B\`?`,
      },
      {
        id: "mj-w8-3",
        text: "Vì sao có module system, và module-info khai gì",
        lesson: `**Mục tiêu.** Nêu được hai nguyên tắc thiết kế mà module system phục vụ, và dựng chạy được một ứng dụng một module từ \`module-info.java\` tới lệnh \`java --module\`.

**Đọc.** [14.1. Động lực thúc đẩy: suy luận về phần mềm](#/docs/mjia-14) cùng [14.1.1. Separation of concerns](#/docs/mjia-14), [14.1.2. Information hiding](#/docs/mjia-14) và [14.1.3. Phần mềm Java](#/docs/mjia-14) đọc lướt lấy hai nguyên tắc và Hình 14.1. [14.2. Vì sao Java Module System được thiết kế](#/docs/mjia-14) là phần lập luận: [14.2.1. Những hạn chế về tính module](#/docs/mjia-14) đọc chậm nhất — ba mức gom code, chuyện package \`"impl"\`, và hai nhược điểm của class path; [14.2.2. JDK nguyên khối](#/docs/mjia-14) cho ví dụ CORBA, compact profile và \`sun.misc.Unsafe\`; [14.2.3. So sánh với OSGi](#/docs/mjia-14) bỏ qua được nếu bạn chưa từng nghe tới OSGi — chính sách nói vậy. [14.3. Java module: bức tranh tổng thể](#/docs/mjia-14) cho hình dung mảnh ghép jigsaw ở Hình 14.2 và Hình 14.3. [14.4. Phát triển một ứng dụng với Java Module System](#/docs/mjia-14) rồi [14.4.1. Thiết lập một ứng dụng](#/docs/mjia-14) với danh sách tám module của ứng dụng expenses, [14.4.2. Module hoá mịn và module hoá thô](#/docs/mjia-14) chỉ vài dòng, và [14.4.3. Những kiến thức cơ bản về Java Module System](#/docs/mjia-14) — gõ lại cả cây thư mục lẫn ba lệnh \`javac\`, \`jar\`, \`java\`.

**Bẫy.** Nghĩ package đã đủ để module hoá, chỉ thiếu kỷ luật. §14.1.1 nói thẳng: về bản chất, package trong Java không hỗ trợ tính module; và §14.2.1 chỉ ra cái giá cụ thể — muốn một class nhìn thấy được từ package khác thì phải khai \`public\`, mà như thế nó cũng truy cập được từ mọi nơi khác, nên bạn không có cách nào ngăn người dùng bám vào những phần cài đặt nội bộ. Bẫy thứ hai: trông đợi module system dẹp luôn chuyện nhiều phiên bản của cùng một thư viện. §14.4.3 nói rõ phần khai báo của một module không bao gồm chuỗi phiên bản, và versioning không được hỗ trợ vì bài toán đó thuộc phạm vi của build tool và ứng dụng container; §14.2.3 còn đối chiếu: OSGi cho phép nhiều phiên bản cùng bundle sống chung, Jigsaw thì không.

**Tự kiểm tra.** \`--module-path\` khác đối số \`--classpath\` ở đúng điểm nào? Và vì sao \`sun.misc.Unsafe\` là ví dụ đắt giá cho việc encapsulation yếu khiến JDK khó tiến hoá?`,
      },
      {
        id: "mj-w8-4",
        text: "Nhiều module, biên dịch, đóng gói, automatic module",
        lesson: `**Mục tiêu.** Viết được \`module-info.java\` cho hai module phụ thuộc nhau, build chúng bằng Maven, và đưa một thư viện chưa module hoá vào module path mà vẫn chạy được.

**Đọc.** [14.5. Làm việc với nhiều module](#/docs/mjia-14) tách ứng dụng expenses thành \`expenses.application\` và \`expenses.readers\`. [14.5.1. Mệnh đề exports](#/docs/mjia-14) — ghi lại rằng theo mặc định mọi thứ đều được đóng gói, hệ thống module đi theo cách tiếp cận danh sách trắng; [14.5.2. Mệnh đề requires](#/docs/mjia-14) với \`java.base\` được require ngầm và Bảng 14.2 so khả kiến trước và sau Java 9 — chép bảng này ra giấy; [14.5.3. Đặt tên](#/docs/mjia-14) cho khuyến nghị tên miền internet đảo ngược. [14.6. Biên dịch và đóng gói](#/docs/mjia-14) là phần thực hành của tuần: gõ lại cả ba file \`pom.xml\`, chú ý \`module-info.java\` phải nằm trong \`src/main/java\`, rồi chạy \`mvn clean package\` và lệnh \`java --module-path\` với hai JAR. [14.7. Automatic module](#/docs/mjia-14) làm theo đúng thứ tự sách dựng: thêm \`requires httpclient\`, chạy build, đọc lỗi, rồi mới sửa. [14.8. Khai báo module và các mệnh đề](#/docs/mjia-14) với sáu mục con từ [14.8.1. requires](#/docs/mjia-14) tới [14.8.6. uses và provides](#/docs/mjia-14) đọc nhanh hơn, trừ [14.8.3. requires transitive](#/docs/mjia-14) và [14.8.5. open và opens](#/docs/mjia-14). [14.9. Một ví dụ lớn hơn và nơi tìm hiểu thêm](#/docs/mjia-14) gom mọi mệnh đề vào một khai báo.

**Bẫy.** Đọc \`exports\` và \`requires\` như hai mệnh đề nhận cùng loại đối số. §14.8.2 dặn riêng một câu: \`exports\` nhận một tên package làm đối số, còn \`requires\` nhận một tên module, dù cách đặt tên của chúng trông khá giống nhau — chính vì thế §14.5.1 và §14.5.2 phải chú thích ngay trong code. Bẫy thứ hai: thêm \`requires httpclient\` rồi chờ nó chạy. §14.7 cho ra \`[ERROR] module not found: httpclient\`, vì bạn còn phải khai dependency trong \`pom.xml\` để Maven compiler plugin đặt nó lên module path; và khi chạy được rồi thì hãy nhớ nó chỉ là automatic module — tên được phát sinh từ tên JAR, tra bằng \`jar --describe-module\`, và automatic module ngầm export toàn bộ các package của chúng.

**Tự kiểm tra.** \`requires transitive\` gỡ được sự phiền toái nào khi module bạn require lại trả về kiểu từ một module khác? Và từ Java 9, muốn Hibernate soi được trạng thái private trong module của bạn thì phải khai gì?`,
      },
    ],
  },
  {
    id: "mj-w9",
    week: "Tuần 9",
    title: "Nền tảng: thread, future, reactive manifesto",
    goal: "Nói được vì sao một thread bị chặn là tài nguyên bị phí, và vẽ được hệ thống của bạn thành hộp và kênh trước khi chọn API concurrency nào.",
    practice:
      "tuần này không gõ code mới. Thay vào đó vẽ tay sơ đồ box-and-channel (§15.3) cho **một** luồng gọi thật trong hệ thống của bạn — mỗi hộp là một lời gọi từ xa, mỗi kênh là dữ liệu đi giữa chúng — rồi đánh dấu hộp nào đang chặn thread và hộp nào không. Sơ đồ này là đầu vào cho bài tập tuần 10.",
    resources: [
      { label: "MJIA 15 — Khái niệm nền tảng của CompletableFuture và reactive programming", href: "#/docs/mjia-15" },
    ],
    items: [
      {
        id: "mj-w9-1",
        text: "Java biểu diễn concurrency qua các đời, và chi phí thật của một thread",
        lesson: `**Mục tiêu.** Phân biệt concurrency với parallelism bằng đúng định nghĩa của sách, và nói được vì sao thread pool tốt hơn thao tác thread tường minh mà vẫn có hai cái bẫy.

**Đọc.** Phần mở đầu chương 15 chốt định nghĩa ở Hình 15.2: concurrency là thuộc tính của chương trình (thực thi chồng lấn), parallelism là thuộc tính của phần cứng (thực thi đồng thời). Khung "Hướng dẫn cho người đọc" nói thẳng chương này có rất ít code Java — chương để hiểu, không phải để gõ. [15.1. Sự tiến hoá của Java trong việc hỗ trợ biểu diễn concurrency](#/docs/mjia-15) là dòng thời gian từ \`synchronized\` tới \`Flow\` của Java 9; chép nó ra giấy. [15.1.1. Thread và các lớp trừu tượng ở mức cao hơn](#/docs/mjia-15) so ba bản tính tổng mảng một triệu phần tử. [15.1.2. Executor và thread pool](#/docs/mjia-15) là mục đọc chậm nhất tuần: ba tiểu mục "Những vấn đề với thread", "Thread pool và lý do chúng tốt hơn" và "Thread pool và lý do chúng tệ hơn", cộng Hình 15.3. [15.1.3. Những lớp trừu tượng khác của thread: không lồng nhau theo lời gọi phương thức](#/docs/mjia-15) bám Hình 15.4, 15.5, 15.6; [15.1.4. Bạn muốn gì từ thread?](#/docs/mjia-15) chỉ vài dòng.

**Bẫy.** Gửi thật nhiều tác vụ vào một thread pool và tin chúng sẽ chạy song song cho tới khi xong. §15.1.2 dựng đúng con số: bốn hardware thread, pool kích thước 5, hai mươi tác vụ — nếu ba tác vụ gửi đầu ngủ hoặc chờ I/O thì chỉ còn hai thread cho mười lăm tác vụ còn lại, tức một nửa throughput mong đợi; tệ hơn, có thể deadlock nếu tác vụ đang chạy phải chờ tác vụ gửi sau, vốn là mẫu sử dụng điển hình của Future. Bẫy thứ hai: quên tắt thread pool khi xong việc. Cùng mục đó nhắc Java thường chờ tất cả thread hoàn thành trước khi cho phép trả về từ \`main\`, nên worker thread đã tạo mà chưa kết thúc sẽ giữ ứng dụng lại — trừ khi bạn đánh dấu daemon bằng \`setDaemon()\`.

**Tự kiểm tra.** Vì sao số thread Java tối ưu phụ thuộc số hardware core, và một Intel Core i7-6900K cho ra bao nhiêu hardware thread? Và strict fork/join khác một phương thức asynchronous ở đúng điểm nào trong quan hệ giữa lúc tạo thread và lúc join?`,
      },
      {
        id: "mj-w9-2",
        text: "Đồng bộ so với bất đồng bộ, và mô hình box-and-channel",
        lesson: `**Mục tiêu.** Đổi được chữ ký một phương thức chạy lâu sang kiểu Future hoặc kiểu reactive và nói được cái giá của từng lựa chọn, rồi dùng combinator thay cho \`get()\`.

**Đọc.** [15.2. API synchronous và asynchronous](#/docs/mjia-15) lấy \`f(x)+g(x)\` làm ví dụ xuyên suốt và cho hai bản thủ công — \`ThreadExample\` với \`Thread\`/\`join\`, rồi \`ExecutorServiceExample\` với \`submit\`/\`get\`; đọc kỹ chú thích nói API synchronous cũng là API blocking. [15.2.1. API kiểu Future](#/docs/mjia-15) và [15.2.2. API kiểu reactive](#/docs/mjia-15) đặt hai chữ ký cạnh nhau — \`Future<Integer> f(int x)\` so với \`void f(int x, IntConsumer dealWithResult)\`; gõ lại \`CallbackStyleExample\` và chạy nó. [15.2.3. Ngủ (và các thao tác blocking khác) bị xem là có hại](#/docs/mjia-15) là mục đọc chậm nhất: so code A với code B và tự trả lời "vì sao B tốt hơn". [15.2.4. Đối chiếu với thực tế](#/docs/mjia-15) kéo bạn về mặt đất; [15.2.5. Ngoại lệ hoạt động thế nào với các API asynchronous?](#/docs/mjia-15) giới thiệu bộ \`onNext\`/\`onError\`/\`onComplete\` và khái niệm giao thức kênh. [15.3. Mô hình hộp và kênh (box-and-channel)](#/docs/mjia-15) với Hình 15.7 là phần thực hành của tuần. [15.4. CompletableFuture và các combinator cho concurrency](#/docs/mjia-15) làm quiz 15.1 trước, rồi đọc hai bản \`CFComplete\` và bản \`CFCombine\`.

**Bẫy.** Đổi sang phong cách callback rồi tưởng chương trình vẫn in ra tổng như cũ. §15.2.2 cho thấy nó in ra giá trị nào hoàn thành nhanh nhất trước, và đôi khi in tổng hai lần — vì ở đây không có khoá nào cả và cả hai toán hạng của phép cộng đều có thể đã được cập nhật trước khi bất kỳ lời \`println\` nào chạy. Bẫy thứ hai: dùng \`new CompletableFuture<>()\` với \`complete()\` rồi \`get()\` và coi như đã hết chờ. §15.4 nói rõ cả hai phiên bản \`CFComplete\` đều có thể lãng phí tài nguyên xử lý vì một thread bị block chờ \`get\`; chỉ \`thenCombine\` mới tạo một phép tính không đủ điều kiện chạy cho tới khi cả hai phép tính kia hoàn thành, nên không có thao tác chờ thực sự nào diễn ra.

**Tự kiểm tra.** Vì sao \`p.thenBoth(q1, q2).thenCombine(r)\` không chạy được trong Java, dù nó diễn đạt Hình 15.7 gọn nhất? Và nếu đổi ví dụ thành \`r(q1(t), q2(t)) + s(x)\` thì phải bọc mấy hàm vào Future, và vì sao trước đó \`p\` với \`r\` lại không cần?`,
      },
      {
        id: "mj-w9-3",
        text: "Publish-subscribe, và reactive system khác reactive programming",
        lesson: `**Mục tiêu.** Đọc được một luồng dữ liệu theo bộ ba publisher / subscription / subscriber, giải thích được backpressure giải quyết vấn đề gì, và không lẫn reactive programming với reactive system nữa.

**Đọc.** [15.5. Publish-subscribe và reactive programming](#/docs/mjia-15) mở bằng hai ví dụ nhiệt kế và listener của web server, rồi ba khái niệm chính cùng Hình 15.9; đọc kỹ đoạn so sánh với Stream ngay trước đó. [15.5.1. Ví dụ sử dụng: cộng hai luồng dữ liệu](#/docs/mjia-15) là mục dài nhất và đáng gõ lại nhất dù tuần này không có bài tập code: dựng \`SimpleCell\` rồi \`ArithmeticCell\`, chạy kịch bản "C3=C1+C2", đối chiếu sáu dòng in ra với dự đoán của bạn, rồi mở rộng sang "C5=C3+C4" và tự giải thích vì sao C5 dừng ở 38; khung "Thuật ngữ" cho cặp upstream/downstream. Phần cuối mục giới thiệu pressure qua ví dụ nhiệt kế báo mỗi mili giây. [15.5.2. Backpressure](#/docs/mjia-15) cho \`onSubscribe\` và interface \`Subscription\`; [15.5.3. Một dạng đơn giản của backpressure thực sự](#/docs/mjia-15) là ba thay đổi cần làm cộng ba câu hỏi đánh đổi — chép cả ba ra giấy. [15.6. Reactive system so với reactive programming](#/docs/mjia-15) đọc chậm: bốn tính chất của Reactive Manifesto. [15.7. Lộ trình](#/docs/mjia-15) chỉ hai dòng.

**Bẫy.** Kết luận reactive chỉ là Stream đổi tên. §15.5 nói rõ mô hình reactive programming có sức diễn đạt cao hơn: một Java Stream cho trước chỉ được tiêu thụ bởi một terminal operation duy nhất và có pipeline xử lý tuyến tính, nên rất khó diễn đạt việc chia một chuỗi giá trị cho hai pipeline hoặc kết hợp phần tử từ hai stream riêng biệt — đúng thứ mà đồ thị ô bảng tính ở §15.5.1 làm dễ dàng. Bẫy thứ hai: coi publish-subscribe là Observer pattern viết lại. §15.5.1 chỉ ra chỗ mạnh hơn: subscriber còn phải định nghĩa \`onError\` và \`onComplete\` để publisher báo hiệu ngoại lệ và sự kết thúc của luồng dữ liệu, và trên hết là backpressure — thứ mà Observer pattern truyền thống không có.

**Tự kiểm tra.** Backpressure được cài đặt bằng phương thức nào của interface nào, và vì sao sách gọi nó là mô hình pull thay vì mô hình push? Và trong bốn tính chất của Reactive Manifesto, tính chất nào được các interface \`java.util.concurrent.Flow\` phản ánh trực tiếp, và nó nối với mô hình box-and-channel ra sao?`,
      },
    ],
  },
];
