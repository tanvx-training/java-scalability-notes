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
      "dựng lại bằng tay ví dụ MỘT module của §14.4.3 bằng đúng ba lệnh sách in ra — `javac module-info.java …`, `jar cvfe`, `java --module-path`; rồi mở dự án hai module `expenses` của §14.6 và build bằng `mvn clean package`. Cuối cùng làm đúng bài tập §14.7: thêm `requires httpclient` vào `module-info.java` của `expenses.readers`, build lại, và đối chiếu lỗi bạn nhận được với dòng `[ERROR] module not found: httpclient` sách in ra.",
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
  {
    id: "mj-w10",
    week: "Tuần 10",
    title: "CompletableFuture — kết hợp tác vụ bất đồng bộ",
    goal: "Biến một chuỗi lời gọi từ xa đang chặn thread thành một pipeline CompletableFuture non-blocking, và chọn đúng combinator cho từng quan hệ phụ thuộc giữa các lời gọi đó.",
    practice:
      "cầm sơ đồ box-and-channel vẽ ở tuần 9, cài lại đúng luồng đó bằng `CompletableFuture`: `supplyAsync` cho từng lời gọi từ xa, `thenCombine` cho hai lời gọi độc lập, `thenCompose` cho hai lời gọi phụ thuộc; đo tổng thời gian với executor mặc định rồi với executor riêng có kích thước pool theo công thức ở §16.3, và ghi lại chênh lệch.",
    resources: [
      { label: "MJIA 16 — CompletableFuture: lập trình bất đồng bộ khả kết hợp", href: "#/docs/mjia-16" },
    ],
    items: [
      {
        id: "mj-w10-1",
        text: "Future đơn giản, giới hạn của nó, và cách dựng API bất đồng bộ",
        lesson: `**Mục tiêu.** Nói được vì sao \`Future\` của Java 5 không đủ để diễn đạt phụ thuộc giữa nhiều phép tính, và viết được một API bất đồng bộ trả cả kết quả lẫn lỗi về cho client.

**Đọc.** [16.1. Sử dụng Future một cách đơn giản](#/docs/mjia-16) mở bằng Listing 16.1 — gõ lại, chú ý phiên bản hai đối số của \`get\` cùng ba khối catch của nó. [16.1.1. Hiểu về Future và những hạn chế của nó](#/docs/mjia-16) chỉ là năm gạch đầu dòng nhưng chép ra giấy: đó là mục lục thật của cả chương. [16.1.2. Sử dụng CompletableFuture để xây dựng một ứng dụng bất đồng bộ](#/docs/mjia-16) dựng bài toán best-price-finder xuyên suốt; khung "API đồng bộ và API bất đồng bộ" chốt cặp blocking/nonblocking — đọc chậm. Sang [16.2. Cài đặt một API bất đồng bộ](#/docs/mjia-16) với Listing 16.2 \`delay\` và Listing 16.3. [16.2.1. Chuyển một phương thức đồng bộ thành phương thức bất đồng bộ](#/docs/mjia-16) gõ lại Listing 16.4 và Listing 16.5, rồi dừng lại tự giải thích trước khi đọc tiếp vì sao \`invocationTime\` nhỏ hơn \`retrievalTime\` cả nghìn lần. [16.2.2. Xử lý lỗi](#/docs/mjia-16) là mục đọc chậm nhất tuần: Listing 16.6, stack trace ba tầng in trong sách, rồi khung "Tạo một CompletableFuture bằng phương thức factory supplyAsync" với Listing 16.7.

**Bẫy.** Bọc phép tính trong một \`Thread\` rồi tin rằng ngoại lệ bên trong sẽ tự tìm đường về client. §16.2.2 nói kết cục ngược lại: ngoại lệ bị giam trong thread đang tính giá và cuối cùng giết chết thread đó, nên client bị block mãi mãi chờ \`get\`; chỉ \`completeExceptionally\` mới lan truyền được nguyên nhân thật, còn \`get\` có timeout chỉ cho client một \`TimeoutException\` không kèm nguyên nhân. Bẫy thứ hai: viết lại bằng \`supplyAsync\` rồi vội bọc thêm try/catch vì sợ mất phần xử lý lỗi vừa thêm. Khung ở cuối §16.2.2 nói rõ CompletableFuture do Listing 16.7 trả về tương đương với cái bạn tạo và hoàn tất thủ công ở Listing 16.6, nghĩa là nó cung cấp đúng cùng cơ chế quản lý lỗi ấy.

**Tự kiểm tra.** Vì sao sách nói hầu như luôn nên dùng phiên bản hai đối số của \`get\`, và phiên bản không đối số làm gì? Và \`supplyAsync\` chạy Supplier của bạn trên executor nào theo mặc định, và bạn đổi nó bằng cách nào?`,
      },
      {
        id: "mj-w10-2",
        text: "Làm code non-blocking, và chọn executor cho đúng",
        lesson: `**Mục tiêu.** Chọn được giữa parallel stream và CompletableFuture cho một khối lượng công việc cụ thể, và tính kích thước thread pool thay vì đoán.

**Đọc.** [16.3. Làm cho code của bạn trở nên non-blocking](#/docs/mjia-16) bắt đầu bằng Listing 16.8 tuần tự và Listing 16.9 đo giờ — chạy thật, ghi lại con số của máy bạn cạnh con số 4032 mili giây của sách. [16.3.1. Song song hoá các yêu cầu bằng parallel Stream](#/docs/mjia-16) chỉ đổi một chữ mà xuống còn 1180 mili giây. [16.3.2. Thực hiện các yêu cầu bất đồng bộ với CompletableFuture](#/docs/mjia-16) gõ lại Listing 16.11, rồi dừng lại tự giải thích trước khi đọc tiếp vì sao phải tách thành hai pipeline stream riêng — Hình 16.2 là câu trả lời. [16.3.3. Tìm kiếm giải pháp có khả năng mở rộng tốt hơn](#/docs/mjia-16) thêm cửa hàng thứ năm rồi thứ chín và đặt ba cột số cạnh nhau. [16.3.4. Sử dụng một Executor tuỳ chỉnh](#/docs/mjia-16) là mục đọc chậm nhất tuần: khung "Định kích thước thread pool" với công thức Goetz — chép ra giấy — rồi Listing 16.12, rồi khung "Tính song song: qua Stream hay qua CompletableFuture?" với hai gạch đầu dòng quyết định.

**Bẫy.** Dừng ở §16.3.1 và kết luận parallel stream là đủ. §16.3.3 phá kết luận đó bằng đúng một cửa hàng thêm vào: bốn thread của common pool đã bận với bốn cửa hàng đầu nên truy vấn thứ năm phải chờ một thao tác trước giải phóng thread, thời gian nhảy lên 2167 mili giây — cả hai phiên bản đều dựa vào cùng common pool có số thread cố định bằng \`Runtime.getRuntime().availableProcessors()\`. Bẫy thứ hai: cắm thẳng con số mà công thức Goetz cho ra vào \`newFixedThreadPool\`. Với tỷ lệ W/C ước lượng là 100 và mục tiêu dùng 100 phần trăm CPU, công thức đòi 400 thread, nhưng sách bác lại ngay tại chỗ: sẽ là lãng phí nếu có nhiều thread hơn số cửa hàng, nên Listing 16.12 lấy số nhỏ nhất giữa số cửa hàng và giới hạn trên 100 thread để tránh làm sập máy chủ.

**Tự kiểm tra.** Vì sao pool ở Listing 16.12 tạo daemon thread, và lựa chọn đó đổi lấy bao nhiêu hiệu năng? Và theo khung cuối mục, khi nào Stream là phần cài đặt đơn giản lẫn hiệu quả nhất, còn khi nào CompletableFuture thắng?`,
      },
      {
        id: "mj-w10-3",
        text: "Nối ống task: thenCompose, thenCombine, ghép với API đồng bộ",
        lesson: `**Mục tiêu.** Ghép được lời gọi phụ thuộc bằng \`thenCompose\`, hai lời gọi độc lập bằng \`thenCombine\`, và biết khi nào không nên với tay lấy biến thể \`Async\`.

**Đọc.** [16.4. Nối ống các task bất đồng bộ](#/docs/mjia-16) dựng enum \`Discount.Code\` ở Listing 16.13 cùng định dạng \`ShopName:price:DiscountCode\`. [16.4.1. Cài đặt một dịch vụ giảm giá](#/docs/mjia-16) cho class \`Quote\` và Listing 16.14 — gõ lại cả hai. [16.4.2. Sử dụng dịch vụ Discount](#/docs/mjia-16) đọc lướt: Listing 16.15 chỉ để lấy mốc 10 giây. [16.4.3. Kết hợp các thao tác đồng bộ và bất đồng bộ](#/docs/mjia-16) là mục đọc chậm nhất tuần — Listing 16.16, Hình 16.3, ba tiểu mục "Lấy giá", "Phân tích cú pháp các báo giá" và "Kết hợp các future để tính giá sau giảm"; dừng lại tự giải thích trước khi đọc tiếp vì sao bước parse dùng \`thenApply\` còn bước giảm giá dùng \`thenCompose\`. [16.4.4. Kết hợp hai CompletableFuture: phụ thuộc và độc lập](#/docs/mjia-16) với Listing 16.17 và Hình 16.4. [16.4.5. Suy ngẫm về Future và CompletableFuture](#/docs/mjia-16) đặt Listing 16.18 viết bằng Java 7 cạnh Listing 16.17 — chép cả hai ra giấy. [16.4.6. Sử dụng timeout một cách hiệu quả](#/docs/mjia-16) cho \`orTimeout\` ở Listing 16.19 và \`completeOnTimeout\` ở Listing 16.20.

**Bẫy.** Dùng \`thenCompose\` cho mọi cặp CompletableFuture vì nó chạy đúng ở Listing 16.16. §16.4.4 tách rõ hai trường hợp: \`thenCompose\` dành cho cái thứ hai cần giá trị kết quả của cái thứ nhất làm đầu vào; còn khi hai phép tính độc lập — giá bằng € và tỷ giá €/$ — bạn không muốn chờ cái thứ nhất xong rồi mới bắt đầu cái thứ hai, và đó là việc của \`thenCombine\`. Bẫy thứ hai: thấy có biến thể \`Async\` thì mặc định nó nhanh hơn. §16.4.3 nói phương thức không có hậu tố \`Async\` thực thi task trên cùng thread với task trước đó, và \`thenCompose\` được chọn chỉ vì ít overhead chuyển thread hơn; §16.4.4 còn gắt hơn: thao tác kết hợp ở đây chỉ là một phép nhân, nên đẩy nó thành task riêng bằng \`thenCombineAsync\` là lãng phí tài nguyên.

**Tự kiểm tra.** \`join\` khác \`get\` ở đúng điểm nào, và khác biệt đó tiết kiệm cho bạn thứ gì trong lambda truyền cho \`map\`? Và \`orTimeout\` với \`completeOnTimeout\` dẫn tới hai kết cục khác nhau ra sao khi cùng một dịch vụ hết giờ?`,
      },
      {
        id: "mj-w10-4",
        text: "Phản ứng khi hoàn tất, và các combinator còn lại",
        lesson: `**Mục tiêu.** In được kết quả của từng lời gọi từ xa ngay khi nó về thay vì chờ lời gọi chậm nhất, và chờ đúng cách cho tới khi tất cả hoàn tất.

**Đọc.** [16.5. Phản ứng lại sự hoàn tất của một CompletableFuture](#/docs/mjia-16) mở bằng lý do độ trễ thật không đoán trước được, rồi Listing 16.21 \`randomDelay\` từ 0,5 đến 2,5 giây — thay \`delay\` bằng nó trước khi đọc tiếp, nếu không phần còn lại của mục sẽ không có gì để nhìn. [16.5.1. Refactor ứng dụng best-price-finder](#/docs/mjia-16) là mục đọc chậm nhất tuần: Listing 16.22 tách ra \`findPricesStream\`, rồi thao tác map thứ tư với \`thenAccept\`, rồi Listing 16.23 với \`allOf\`; đọc kỹ đoạn giải thích vì sao ở đây không dùng \`thenAcceptAsync\`, và đoạn cuối mục giới thiệu \`anyOf\`. [16.5.2. Ghép tất cả lại với nhau](#/docs/mjia-16) cho đoạn code có dấu thời gian cùng sáu dòng output — chạy bản của bạn rồi đối chiếu, mức giá đầu tiên phải về nhanh hơn mức giá cuối cùng khoảng gấp đôi. [16.6. Lộ trình phía trước](#/docs/mjia-16) chỉ hai dòng nhưng đừng bỏ: đó là bản lề sang tuần 11.

**Bẫy.** Với tay lấy \`thenAcceptAsync\` chỉ vì tên nó có chữ Async. §16.5.1 giải thích vì sao không: biến thể Async lập lịch Consumer trên một thread mới lấy từ pool thay vì dùng chính thread vừa hoàn tất CompletableFuture, trong khi bạn muốn phản ứng càng sớm càng tốt chứ không muốn chờ một thread mới sẵn sàng, và muốn tránh một lần chuyển ngữ cảnh không cần thiết. Bẫy thứ hai: gọi xong \`map(f -> f.thenAccept(...))\` thì coi như đã hiển thị đủ giá. Thao tác đó chỉ cho bạn một \`Stream<CompletableFuture<Void>>\`, mà sách nói thẳng bạn chẳng làm được gì nhiều với \`CompletableFuture<Void>\` ngoài chờ nó hoàn tất; thiếu \`allOf(futures).join()\` thì cửa hàng chậm nhất không kịp in ra gì, và bạn cũng mất luôn mốc để báo "All shops returned results or timed out".

**Tự kiểm tra.** \`allOf\` và \`anyOf\` khác nhau ở kiểu trả về nào và ở thời điểm hoàn tất nào? Và §16.6 nói Flow API của Java 9 tổng quát hoá CompletableFuture theo đúng hướng nào?`,
      },
    ],
  },
  {
    id: "mj-w11",
    week: "Tuần 11",
    title: "Flow API, reactive, và tư duy hàm",
    goal: "Đọc được một hệ thống theo bốn tính chất của Reactive Manifesto, cài được bốn interface của Flow API bằng tay, và gọi tên chính xác điều gì làm một phương thức trở nên mang tính hàm.",
    practice:
      "cài đúng bốn interface của Flow API cho ví dụ nhiệt kế ở §17.2 — `Publisher`, `Subscriber`, `Subscription`, `Processor` — rồi cố tình để `Subscriber` xử lý chậm hơn `Publisher` phát và quan sát `request(n)` chặn dòng chảy thế nào. Đó là backpressure nhìn thấy được.",
    resources: [
      { label: "MJIA 17 — Reactive programming", href: "#/docs/mjia-17" },
      { label: "MJIA 18 — Tư duy hàm", href: "#/docs/mjia-18" },
      { label: "reactive-streams.org", href: "https://www.reactive-streams.org/" },
    ],
    items: [
      {
        id: "mj-w11-1",
        text: "Reactive Manifesto — bốn tính chất và chỗ chúng mâu thuẫn nhau",
        lesson: `**Mục tiêu.** Kể được bốn tính chất của Reactive Manifesto cùng quan hệ phụ thuộc giữa chúng, và chỉ ra được thao tác nào không được phép nằm trong event loop chính.

**Đọc.** Phần mở đầu chương 17 cho ba lý do khiến kiến trúc cũ hết đủ dùng — Big Data, môi trường không đồng nhất, thói quen sử dụng; đọc lướt là đủ. [17.1. Reactive Manifesto](#/docs/mjia-17) là bốn định nghĩa responsive, resilient, elastic, message-driven cùng Hình 17.1 — chép cả bốn ra giấy kèm mũi tên phụ thuộc. [17.1.1. Reactive ở cấp độ ứng dụng](#/docs/mjia-17) là mục đọc chậm nhất: khung "Kiểm tra kiến thức nền" chỉ ngược về chương 15 nếu bạn còn lấn cấn thuật ngữ, rồi ý tưởng chia sẻ thread giữa future, actor và event loop, rồi Hình 17.2. [17.1.2. Reactive ở cấp độ hệ thống](#/docs/mjia-17) đặt event-driven cạnh message-driven — dừng lại tự giải thích trước khi đọc tiếp khác biệt giữa một message và một event, sách trả lời ngay đoạn sau đó.

**Bẫy.** Gọi một API blocking — truy vấn cơ sở dữ liệu, ghi file, lời gọi từ xa — ngay trong event loop vì "chỉ một chỗ thôi". §17.1.1 in đậm đúng điều ngược lại rồi dựng con số: pool hai thread, ba luồng sự kiện, một thao tác I/O làm Thread 2 bị chặn lãng phí, nên dù Thread 1 vẫn xử lý được luồng thứ nhất thì luồng thứ ba phải nằm chờ tới khi thao tác blocking kết thúc; cách chữa là dành cho thao tác blocking một thread pool riêng. Bẫy thứ hai: coi "ứng dụng của tôi reactive" là đã có reactive system. §17.1.2 tách hẳn hai thứ: reactive application tính toán trên những luồng dữ liệu phù du và được gọi là event-driven, còn reactive system nhằm kết hợp các ứng dụng lại và là message-driven — message hướng tới một đích đến xác định duy nhất, còn event thì được nhận bởi mọi component đã đăng ký quan sát.

**Tự kiểm tra.** Tính kiên cường theo nghĩa reactive vượt qua fault-tolerance ở chỗ nào, và lỗi được vật thể hoá thành gì rồi gửi cho ai? Và vì sao location transparency là điều kiện của tính co giãn chứ không chỉ là một tiện nghi khi triển khai?`,
      },
      {
        id: "mj-w11-2",
        text: "Reactive streams và Flow API: bốn interface, và backpressure",
        lesson: `**Mục tiêu.** Cài được cả bốn interface của Flow API bằng tay và đọc được giao thức mà \`Publisher\` với \`Subscriber\` phải tuân theo, kể cả các quy tắc quanh việc huỷ.

**Đọc.** [17.2. Reactive streams và Flow API](#/docs/mjia-17) định nghĩa backpressure là một cơ chế điều khiển luồng — đọc chậm đoạn nói vì sao lời gọi đồng bộ đã ngầm được backpressure bởi chính các API blocking, còn API bất đồng bộ thì phải dựng lấy. [17.2.1. Giới thiệu class Flow](#/docs/mjia-17) là mục đọc chậm nhất tuần: gõ lại cả bốn listing 17.1 đến 17.4, chép ra giấy dòng giao thức \`onSubscribe onNext* (onError | onComplete)?\`, rồi ba gạch đầu dòng quy tắc hợp tác, rồi Hình 17.3. [17.2.2. Tạo reactive application đầu tiên của bạn](#/docs/mjia-17) là phần thực hành của tuần: Listing 17.5 \`TempInfo\`, Listing 17.6 \`TempSubscription\`, Listing 17.7 \`TempSubscriber\`, Listing 17.8 class \`Main\`; làm quiz 17.1 rồi đọc trọn đáp án trước khi xem Listing 17.9. [17.2.3. Biến đổi dữ liệu với Processor](#/docs/mjia-17) thêm \`TempProcessor\` ở Listing 17.10 và Listing 17.11 — chú ý chỉ \`onNext\` chứa logic nghiệp vụ, mọi phương thức khác chỉ uỷ thác. [17.2.4. Tại sao Java không cung cấp một phần cài đặt cho Flow API?](#/docs/mjia-17) ngắn nhưng trả lời đúng câu hỏi đang có trong đầu bạn.

**Bẫy.** Viết \`onNext\` gọi ngay \`subscription.request(1)\` rồi tin luồng sẽ chảy êm mãi. Quiz 17.1 chốt đúng chỗ đó: nếu bạn comment câu lệnh sinh lỗi ngẫu nhiên đi và để \`main\` chạy đủ lâu, mỗi \`onNext\` lại gọi \`request\`, mà \`request\` lại gọi \`onNext\`, những lời gọi đệ quy chồng lên stack cho tới khi tràn và chương trình chết bằng \`StackOverflowError\`; cách chữa ở Listing 17.9 là cho \`TempSubscription\` một \`Executor\` để phát phần tử từ một thread khác. Bẫy thứ hai: đi tìm trong JDK một class cài sẵn \`Publisher\`. §17.2.4 nói thẳng thư viện Java 9 chẳng cung cấp phần cài đặt nào — bốn interface này là bản hợp đồng và ngôn ngữ chung để Akka, RxJava, Reactor, Vert.x hiểu nhau, chứ không phải bộ đôi dùng ngay kiểu \`List\` với \`ArrayList\`.

**Tự kiểm tra.** Sau khi một trạng thái kết thúc đã đạt tới, Publisher bị cấm làm gì và Subscriber bị cấm làm gì? Và chuẩn đòi hỏi phần cài đặt \`Subscription.cancel\` phải có hai tính chất nào?`,
      },
      {
        id: "mj-w11-3",
        text: "RxJava — Observable, Flowable, và biến đổi luồng",
        lesson: `**Mục tiêu.** Chọn được giữa \`Observable\` và \`Flowable\` cho một luồng cụ thể, và đọc được một marble diagram thay vì vật lộn với mô tả bằng lời của toán tử.

**Đọc.** [17.3. Sử dụng thư viện reactive RxJava](#/docs/mjia-17) mở bằng một lời khuyên kiến trúc — chỉ dùng \`Observable\` ở nơi thật sự cần cấu trúc bổ sung của nó, chỗ khác khai kiểu \`Publisher\`; đọc chậm, đây chính là thói quen bạn đã có sẵn với \`List\` và \`ArrayList\`. Phần cuối mục đặt \`io.reactivex.Flowable\` cạnh \`io.reactivex.Observable\` — chép ra giấy tiêu chí chọn giữa hai class. [17.3.1. Tạo và sử dụng một Observable](#/docs/mjia-17) là mục dài nhất: factory \`just\` rồi \`interval\`, interface \`Observer\` với đối số \`Disposable\`, rồi \`blockingSubscribe\`, rồi Listing 17.12 \`getTemperature\` dựng bằng \`create\` và \`ObservableEmitter\` — gõ lại và chạy — rồi Listing 17.13 \`TempObserver\` và Listing 17.14. [17.3.2. Biến đổi và kết hợp các Observable](#/docs/mjia-17) bắt đầu bằng đoạn mô tả \`mergeDelayError\` bằng lời: đọc một lần cho biết cảm giác, rồi mới sang Hình 17.4 và Hình 17.5. Làm quiz 17.2 rồi đọc trọn đáp án, sau đó Listing 17.15, 17.16 và 17.17.

**Bẫy.** Đăng ký vào \`Observable.interval\` trong \`main\` rồi kết luận code hỏng vì màn hình trống trơn. §17.3.1 giải thích: Observable phát sự kiện mỗi giây chạy trên computation thread pool của RxJava vốn gồm các daemon thread, còn chương trình main của bạn kết thúc ngay lập tức và giết chúng trước khi kịp tạo ra output nào; cách chữa đúng là \`blockingSubscribe\`, thứ gọi callback trên chính thread hiện tại. Bẫy thứ hai: dùng \`Observable\` cho mọi thứ vì nó đơn giản hơn khi lập trình. Sách nói rõ \`Observable\` không hỗ trợ backpressure và chỉ khuyên dùng nó khi luồng không quá một nghìn phần tử hoặc khi xử lý sự kiện GUI như di chuyển chuột — thứ không thể yêu cầu chậm lại; ngay cả mẹo gọi \`request(Long.MAX_VALUE)\` để tắt backpressure cũng bị sách xếp vào loại không được khuyến khích.

**Tự kiểm tra.** Interface \`Observer\` của RxJava khác \`Subscriber\` của Java 9 ở đúng hai chỗ nào, và vì sao? Và trong Listing 17.12, \`isDisposed\` được kiểm trước mỗi lần phát để phòng tình huống gì?`,
      },
      {
        id: "mj-w11-4",
        text: "Hàm thuần, trong suốt tham chiếu, và đệ quy so với vòng lặp",
        lesson: `**Mục tiêu.** Áp được định nghĩa "mang tính hàm" của sách vào một phương thức thật trong code của bạn, và nói được khi nào đổi vòng lặp sang đệ quy là lãi, khi nào lỗ.

**Đọc.** [18.1. Xây dựng và bảo trì hệ thống](#/docs/mjia-18) mở bằng mẹo tìm từ khoá \`synchronized\` — đọc lướt. [18.1.1. Dữ liệu mutable dùng chung](#/docs/mjia-18) cho năm câu hỏi về quyền sở hữu một danh sách dùng chung, Hình 18.1, rồi ba ví dụ side effect — chép ra giấy. [18.1.2. Declarative programming](#/docs/mjia-18) và [18.1.3. Tại sao lại là functional programming?](#/docs/mjia-18) ngắn. [18.2. Functional programming là gì?](#/docs/mjia-18) dùng Hình 18.2 và Hình 18.3 tách pure functional programming khỏi functional-style programming. [18.2.1. Java theo phong cách hàm](#/docs/mjia-18) là mục đọc chậm nhất tuần: nguyên tắc chỉ được mutate biến cục bộ, yêu cầu không ném ngoại lệ, Hình 18.4, và khung "Hàm và hàm bộ phận (partial function)". [18.2.2. Referential transparency](#/docs/mjia-18) và [18.2.3. Lập trình hướng đối tượng so với lập trình theo phong cách hàm](#/docs/mjia-18) đọc nhanh. [18.2.4. Phong cách hàm trong thực tế](#/docs/mjia-18) là bài tập \`subsets\` — tự giải trước khi đọc \`insertAll\` và hai phiên bản \`concat\`. [18.3. Recursion so với iteration](#/docs/mjia-18) gõ lại bốn listing 18.1–18.4 cùng Hình 18.5 và 18.6.

**Bẫy.** Định nghĩa \`insertAll\` sao cho nó cập nhật thẳng \`subAns\` để khỏi sao chép. §18.2.4 cho kết cục: \`subAns\` bị sửa đổi đúng như \`subAns2\`, và bạn nhận câu trả lời chứa tám bản sao của \`{1,4,9}\` một cách bí ẩn — chỗ đúng để đặt code sao chép là bên trong \`insertAll\`, không phải ở nơi gọi nó. Bẫy thứ hai: nghe rằng phong cách hàm ưa đệ quy rồi thay mọi vòng lặp. §18.3 dặn hãy cảnh giác với những kẻ cuồng tín nói bạn luôn luôn nên dùng recursion: mỗi lời gọi \`factorialRecursive\` tạo một stack frame mới nên bộ nhớ tỉ lệ thuận với đầu vào, và đầu vào lớn cho ra \`StackOverflowError\`; tail recursion chỉ mở đường cho compiler tối ưu, mà Java không hỗ trợ, khác Scala, Groovy và Kotlin.

**Tự kiểm tra.** Theo §18.2.1, một phương thức mang phong cách hàm được phép mutate cái gì, và ràng buộc nào về ngoại lệ đi kèm? Và vì sao hai lời gọi trả về hai \`List\` khác nhau trong bộ nhớ lại biến referential transparency thành chuyện phải chọn lập trường?`,
      },
    ],
  },
  {
    id: "mj-w12",
    week: "Tuần 12",
    title: "Kỹ thuật FP, so sánh Scala, hướng đi tiếp",
    goal: "Cài được cấu trúc dữ liệu bền vững cùng lazy list bằng Java, và định vị được Java trên phổ OOP–FP qua đối chiếu với Scala và qua lộ trình mà ngôn ngữ đang đi tiếp.",
    practice:
      "cài lại class `Tree` của §19.2.2 theo lối hàm như §19.2.3 chỉ ra — `update` trả về cây mới thay vì sửa cây cũ tại chỗ — rồi viết test chứng minh một tham chiếu giữ từ trước vẫn thấy dữ liệu cũ sau khi thêm node. Nếu còn thời gian, làm tương tự với `TrainJourney` của §19.2.1. Ch.20 và ch.21 chỉ đọc, không có bài tập — đọc lướt lấy điểm khác biệt và hướng đi, đừng sa vào cú pháp Scala.",
    resources: [
      { label: "MJIA 19 — Các kỹ thuật lập trình hàm", href: "#/docs/mjia-19" },
      { label: "MJIA 20 — Kết hợp OOP và FP: so sánh Java và Scala", href: "#/docs/mjia-20" },
      { label: "MJIA 21 — Kết luận và hướng đi tiếp của Java", href: "#/docs/mjia-21" },
    ],
    items: [
      {
        id: "mj-w12-1",
        text: "Hàm bậc cao, currying, và cấu trúc dữ liệu bền vững",
        lesson: `**Mục tiêu.** Viết được một factory hàm dạng curry thay cho phương thức nhiều tham số, và cài được một cây mà phép cập nhật không đụng tới bản cũ.

**Đọc.** [19.1. Hàm ở khắp mọi nơi](#/docs/mjia-19) chốt định nghĩa first-class function bằng đúng một dòng gán \`Integer::parseInt\` vào biến. [19.1.1. Higher-order functions](#/docs/mjia-19) cho hai điều kiện của một higher-order function cùng Hình 19.1, rồi kiểu lồng ba tầng của phép lấy đạo hàm — chép kiểu đó ra giấy; đọc kỹ khung "Side effect và higher-order function". [19.1.2. Currying](#/docs/mjia-19) là mục thực dụng nhất: gõ lại \`converter\` rồi \`curriedConverter\` và ba bộ chuyển đổi dựng từ nó, sau đó đọc chậm khung "Định nghĩa hình thức của currying". [19.2. Persistent data structures](#/docs/mjia-19) rồi [19.2.1. Cập nhật phá huỷ so với cập nhật theo lối hàm](#/docs/mjia-19) với \`TrainJourney\`, \`link\` phá huỷ và \`append\` theo lối hàm, Hình 19.2 đặt cạnh Hình 19.3. [19.2.2. Một ví dụ khác với Tree](#/docs/mjia-19) và [19.2.3. Sử dụng cách tiếp cận hàm](#/docs/mjia-19) là hai mục đọc chậm nhất tuần và cũng là bài tập tuần: hai phiên bản \`update\` đặt cạnh \`fupdate\`, Hình 19.4, cùng phép so sánh với đĩa CD-R ở cuối mục.

**Bẫy.** Nhận kết quả của \`append\` hay \`fupdate\` rồi sửa nó cho tiện. §19.2.1 nói rõ \`append\` trả về \`n+m\` phần tử nhưng \`m\` phần tử cuối được chia sẻ với dãy \`b\`, nên sửa kết quả là làm hỏng luôn các chuyến tàu đã truyền vào; §19.2.3 gọi đó là phía bên kia của thoả thuận — mọi người dùng persistent data structure phải tuân thủ yêu cầu không-được-thay-đổi, nếu không bạn sẽ thấy một biến đổi bất ngờ và bị trì hoãn trên chính đối số cũ. Bẫy thứ hai: khai \`final\` cho \`key\`, \`val\`, \`left\`, \`right\` rồi coi như compiler đã canh giúp. §19.2.3 hạ ngay kỳ vọng đó: \`final\` chỉ bảo vệ trường chứ không bảo vệ đối tượng mà trường trỏ tới, mà đối tượng đó lại cần các trường của chính nó là \`final\` mới được bảo vệ, và cứ thế tiếp tục.

**Tự kiểm tra.** Với một cây tương đối cân bằng có độ sâu \`d\`, \`fupdate\` phải tạo mới phần nào của cây, và vì sao sách nói chi phí đó không hề tốn kém? Và theo định nghĩa hình thức, khi nào một hàm được gọi là đã áp dụng một phần?`,
      },
      {
        id: "mj-w12-2",
        text: "Lazy evaluation tự cài, và pattern matching mô phỏng bằng lambda",
        lesson: `**Mục tiêu.** Cài được một lazy list tự sinh phần tử theo yêu cầu, và mô phỏng được pattern matching một tầng bằng lambda thay cho chuỗi \`instanceof\` kèm ép kiểu.

**Đọc.** [19.3. Lazy evaluation với stream](#/docs/mjia-19) nêu hạn chế then chốt: stream Java không định nghĩa đệ quy được vì chỉ tiêu thụ một lần. [19.3.1. Stream tự định nghĩa](#/docs/mjia-19) đi bốn bước sinh số nguyên tố — làm theo đúng thứ tự sách dựng, chạy code ở bước 4, đọc lỗi, rồi mới đọc hai tiểu mục "Tin xấu" và "Lazy evaluation" cùng đoạn Scala với toán tử \`#::\`. [19.3.2. Lazy list của riêng bạn](#/docs/mjia-19) là mục đọc chậm nhất tuần: gõ lại \`MyList\`, \`MyLinkedList\`, \`Empty\`, rồi \`LazyList\` với \`Supplier\`, \`from\`, \`primes\` và phương thức \`filter\` lười; Hình 19.5 giải thích vì sao. [19.4. Pattern matching](#/docs/mjia-19) mở bằng \`simplifyExpression\` viết bằng \`instanceof\` — đọc để thấy nó xấu tới đâu. [19.4.1. Design pattern Visitor](#/docs/mjia-19) ngắn; [19.4.2. Pattern matching đến giải cứu](#/docs/mjia-19) đặt bốn dòng Scala cạnh Java rồi dựng \`patternMatchExpr\` và Listing 19.1 — gõ lại cả hai. [19.5. Những điều linh tinh khác](#/docs/mjia-19) với [19.5.1. Caching hay memoization](#/docs/mjia-19), [19.5.2. "Trả về cùng một đối tượng" nghĩa là gì?](#/docs/mjia-19) và [19.5.3. Combinator](#/docs/mjia-19) đọc lướt được, trừ đoạn bàn về thread-safety.

**Bẫy.** Tách stream thành head và tail bằng \`findFirst\` với \`skip\` rồi gọi đệ quy. §19.3.1 cho hai lỗi chồng lên nhau: bạn nhận \`java.lang.IllegalStateException: stream has already been operated upon or closed\` vì đã dùng hai terminal operation trên cùng một stream, và ngay cả khi qua được thì \`IntStream.concat\` vẫn đánh giá đối số thứ hai ngay lập tức, dẫn tới đệ quy vô hạn. Bẫy thứ hai: kết luận rằng làm mọi thứ một cách lười biếng thì luôn tốt hơn làm háo hức. §19.3.2 phản bác bằng hai con số: overhead của những \`Supplier\` xen giữa các phần tử lấn át lợi ích trên lý thuyết trừ khi bạn chỉ khám phá dưới 10 phần trăm cấu trúc, và \`LazyList\` vừa viết còn chưa thực sự lười — duyệt \`from(2)\` tới phần tử thứ 10 tạo ra 20 node.

**Tự kiểm tra.** \`computeNumberOfNodesUsingCache\` có referential transparency nhưng vẫn không thread-safe — race condition nằm giữa đúng hai thời điểm nào? Và phần mô phỏng pattern matching bằng lambda thiếu gì so với Scala, lấy \`BinOp("+", e, Number(0))\` làm ví dụ?`,
      },
      {
        id: "mj-w12-3",
        text: "Scala đối chiếu Java: hàm, class, trait (đọc lướt)",
        lesson: `**Mục tiêu.** Chỉ ra được ba chỗ Scala gọn hơn Java trên cùng một bài toán, và nêu được trait cho thêm gì so với interface có default method — mà không cần viết Scala.

**Đọc.** Cả chương là đọc lướt, không bài tập: mục đích là đối chiếu để thấy giới hạn của Java, không phải học cú pháp — chính phần mở đầu chương 20 cũng nói nó không nhằm dạy bạn viết Scala bản địa. [20.1. Giới thiệu về Scala](#/docs/mjia-20) và [20.1.1. Hello beer](#/docs/mjia-20) đọc nhanh, chỉ dừng ở khai báo \`object\` (singleton thành tính năng ngôn ngữ) và dòng \`2 to 6 foreach\` viết theo ký pháp trung tố. [20.1.2. Các cấu trúc dữ liệu cơ bản: List, Set, Map, Tuple, Stream, Option](#/docs/mjia-20) là mục dừng lâu nhất của chương: \`val\` so với \`var\`, tuple literal, và nhất là khung "Unmodifiable và immutable" — chép ra giấy. [20.2. Hàm](#/docs/mjia-20) gồm ba mục con: [20.2.1. First-class function trong Scala](#/docs/mjia-20) cho cú pháp function type mà Java cố ý không đưa vào; [20.2.2. Anonymous function và closure](#/docs/mjia-20) đọc chậm; [20.2.3. Currying](#/docs/mjia-20) đối chiếu \`multiplyCurry\` với cú pháp hai danh sách đối số. [20.3. Class và trait](#/docs/mjia-20) gom [20.3.1. Ít dài dòng hơn với class của Scala](#/docs/mjia-20) và [20.3.2. Trait của Scala so với interface của Java](#/docs/mjia-20), nối thẳng với luật gỡ xung đột ở tuần 8.

**Bẫy.** Coi \`Collections.unmodifiableSet\` là đã có collection immutable kiểu Scala. Khung "Unmodifiable và immutable" nói rõ collection unmodifiable chỉ là lớp bọc bên ngoài một collection có thể sửa đổi: bạn không thêm được phần tử qua \`newNumbers\`, nhưng vẫn thêm được qua \`numbers\` gốc; còn collection immutable bảo đảm không gì thay đổi được nó, bất kể bao nhiêu biến trỏ tới. Bẫy thứ hai: đọc chữ closure của Scala rồi tưởng lambda Java cũng thế. §20.2.2 đặt hai đoạn code cạnh nhau: anonymous function của Scala capture chính biến \`count\` nên in 1 rồi 2, còn bản Java không biên dịch được vì \`count\` bị ép ngầm phải là final — lambda Java đóng gói giá trị chứ không phải biến. Sách dặn chỉ dùng tính năng đó khi thật cần.

**Tự kiểm tra.** Trait khác interface có default method của Java ở đúng hai điểm nào? Và vì sao Scala viết được \`2 to 6\` mà Java không có gì tương đương ở mức ngôn ngữ?`,
      },
      {
        id: "mj-w12-4",
        text: "Điểm lại Java 8–10, và hướng ngôn ngữ đang đi tiếp",
        lesson: `**Mục tiêu.** Kể lại được các tính năng Java 8–9 như một thiết kế mạch lạc chứ không phải danh sách rời rạc, và nêu được ba hướng ngôn ngữ đang đi tiếp cùng lý do chúng khó.

**Đọc.** Chương cuối, đọc lướt là đủ, trừ hai chỗ dưới. [21.1. Điểm lại các tính năng của Java 8](#/docs/mjia-21) nêu hai "biến đổi khí hậu" giải thích mọi lựa chọn thiết kế: đa lõi và phong cách khai báo trên collection; chép hai gạch đó ra giấy rồi đọc liền sáu mục [21.1.1. Behavior parameterization (lambda và method reference)](#/docs/mjia-21), [21.1.2. Stream](#/docs/mjia-21), [21.1.3. CompletableFuture](#/docs/mjia-21), [21.1.4. Optional](#/docs/mjia-21), [21.1.5. Flow API](#/docs/mjia-21) và [21.1.6. Default method](#/docs/mjia-21), mỗi mục là bản thu gọn của một tuần đã qua. [21.2. Module system của Java 9](#/docs/mjia-21) cho năm ưu điểm của module hoá; [21.3. Local variable type inference trong Java 10](#/docs/mjia-21) ngắn. [21.4. Điều gì đang chờ Java phía trước?](#/docs/mjia-21) là chỗ đọc chậm nhất: năm mục con từ [21.4.1. Declaration-site variance](#/docs/mjia-21) tới [21.4.5. Value type](#/docs/mjia-21), trong đó [21.4.2. Pattern matching](#/docs/mjia-21) nối thẳng với §19.4; dừng lại tự giải câu đố ba dòng \`println\` ở mục cuối trước khi đọc đáp án. [21.5. Đưa Java tiến lên nhanh hơn](#/docs/mjia-21) và [21.6. Lời cuối](#/docs/mjia-21) khép lại track.

**Bẫy.** Tin rằng \`final\` là đủ để có giá trị immutable. §21.4.4 dập tắt kỳ vọng đó bằng hai dòng: \`final int[] arr = {1, 2, 3}\` cấm gán lại \`arr\` nhưng không cấm \`arr[1] = 2\`, còn \`final List<T> list\` không cấm phương thức khác đổi số phần tử; sách nói với tham chiếu tới đối tượng, \`final\` thường tạo cảm giác an toàn giả tạo, nên đề xuất từ khoá \`transitively_final\`. Bẫy thứ hai: cho rằng compiler chỉ cần thông minh hơn là đối xử được \`Integer\` như \`int\`. §21.4.5 đưa câu đố in ra "yes", "no", "yes": dù cả ba đều mang giá trị \`3.14\`, các phép gán tạo ra đối tượng \`Double\` mới mà toán tử \`==\` phân biệt được, vì ngữ nghĩa của \`Object\` mà \`Double\` kế thừa buộc compiler tôn trọng; escape analysis chỉ cứu được phạm vi hẹp.

**Tự kiểm tra.** Vì sao reified generic vướng vào garbage collection, và điều gì ở tương thích ngược chặn nó lại? Và trong chu kỳ phát hành sáu tháng, vì sao Java 9 và Java 10 không phải bản LTS còn Java 11 thì có?`,
      },
    ],
  },
];
