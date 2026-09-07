// Lộ trình đọc Optimizing Cloud Native Java — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Optimizing Cloud Native Java", ấn bản 2
// (Benjamin J. Evans, James Gough, Chris Newland — O'Reilly).
// Thư mục nguồn: sources/ocnj/ — đủ 15 chương, không thiếu chương nào.
// Phụ lục A (microbenchmarking/JMH) và Phụ lục B (danh mục antipattern) không
// có trong bộ nguồn; phần microbenchmarking được bù bằng JMH ở tuần 1.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (oc-w<N> / oc-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const ocnjWeeksPart1 = [
  {
    id: "oc-w1",
    week: "Tuần 1",
    title: "Hiệu năng là gì, và đo nó cho đúng",
    goal: "Gọi tên được bảy đại lượng quan sát được của hiệu năng và nói được đại lượng nào mâu thuẫn với đại lượng nào, chọn đúng loại kiểm thử cho một câu hỏi cụ thể, và báo cáo kết quả bằng phân vị thay vì trung bình.",
    practice:
      "Lấy một endpoint thật trong ứng dụng của bạn, chạy tải tăng dần, ghi latency bằng HdrHistogram (hoặc công cụ tương đương cho ra phân vị) thay vì trung bình. Vẽ đồ thị throughput theo số client và chỉ ra điểm gãy. Đối chiếu hình dạng đồ thị bạn thu được với các dạng đồ thị chương 1 mô tả — nếu không khớp dạng nào, đó là câu hỏi tốt để mang sang tuần sau.",
    resources: [
      { label: "OCNJ 01 — Định nghĩa về Tối ưu hóa và Hiệu năng", href: "#/docs/ocnj-01" },
      { label: "OCNJ 02 — Phương pháp luận Kiểm thử Hiệu năng", href: "#/docs/ocnj-02" },
      { label: "JMH — microbenchmark harness của OpenJDK (bù Phụ lục A)", href: "https://github.com/openjdk/jmh" },
    ],
    items: [
      {
        id: "oc-w1-1",
        text: "Hiệu năng Java theo cách sai lầm, và hiệu năng như khoa học thực nghiệm",
        lesson: `**Mục tiêu.** Nói được vì sao những "mẹo tăng tốc Java" nhặt trên mạng thường gây hại thay vì giúp ích, và phát biểu được sáu bước biến hiệu năng từ một nghề thủ công huyền bí thành một khoa học thực nghiệm.

**Đọc.** [Hiệu năng Java theo cách sai lầm](#/docs/ocnj-01) mở đầu bằng một câu chuyện có thật: một trang viết năm 1997–8 nằm lì trong ba kết quả Google đầu tiên cho "Java performance tuning", giữ hạng nhờ chính vòng lặp phản hồi giữa thứ hạng và traffic. Đọc kỹ đoạn này, rồi đọc kỹ danh sách năm khía cạnh làm nên kỹ thuật hiệu năng tốt mà sách nói nó tập trung vào thay cho một cuốn cookbook mẹo vặt — đó là mục lục ngầm của cả cuốn sách. [Tổng quan về hiệu năng Java](#/docs/ocnj-01) giải thích tính thực dụng của Java qua câu "ngôn ngữ cổ cồn xanh" của Gosling và khái niệm *managed subsystem* — đọc lướt phần đầu, nhưng đọc chậm các đoạn cuối, nơi sách lần đầu cảnh báo rằng phép đo của ứng dụng JVM rất thường không tuân theo phân phối chuẩn và rằng chính việc đo cũng có chi phí. [Hiệu năng như một khoa học thực nghiệm](#/docs/ocnj-01) là mục ngắn nhất của chương nhưng đáng chép tay: sáu bước của vòng lặp hiệu năng, và luận điểm rằng phân tích hiệu năng thực chất là định nghĩa rồi đạt được các yêu cầu phi chức năng.

**Bẫy.** Đi tìm công tắc thần kỳ. Sách nói thẳng là không hề có công tắc "chạy nhanh hơn" cho JVM, không có "mẹo và thủ thuật" nào, không có thuật toán bí mật nào bị giấu — và nó cảnh báo đừng nhảy cóc tới những mục kỹ thuật tối ưu ở phần sau, vì tất cả đều có khả năng gây hại nhiều hơn lợi nếu thiếu hiểu biết đúng đắn về việc chúng nên được áp dụng thế nào và tại sao. Ví dụ nhức nhối nhất nằm ngay trong mục đầu: lời khuyên tránh method nhỏ để né chi phí method dispatch từng đúng với các JVM sơ khai, nhưng với inlining tự động ngày nay, mã "gộp mọi thứ vào một method" lại ở thế bất lợi đáng kể vì rất không thân thiện với trình biên dịch JIT. Bẫy thứ hai: quên rằng phép đo cũng phải trả giá. Sách cảnh báo việc lấy mẫu thường xuyên — hoặc ghi lại mọi kết quả — có thể tạo ra tác động quan sát được lên chính những con số hiệu năng đang được ghi nhận; và vì với ứng dụng JVM thì outlier mới là thứ quan trọng, việc lấy mẫu rất dễ bỏ sót đúng những sự kiện có tầm quan trọng lớn nhất.

**Tự kiểm tra.** Sáu bước mà sách liệt kê cho vòng lặp hiệu năng là gì, và bước nào phải hoàn tất trước khi bạn được phép đo hệ thống? Vì sao một đoạn mã Java cũ có thể chạy nhanh hơn trên một JVM mới hơn mà không cần biên dịch lại mã nguồn?`,
      },
      {
        id: "oc-w1-2",
        text: "Bảy đại lượng quan sát được, cách đọc đồ thị, và hiệu năng trên cloud",
        lesson: `**Mục tiêu.** Gọi tên được bảy đại lượng quan sát được và nói được đại lượng nào kéo đại lượng nào đi theo, rồi nhìn một đồ thị hiệu năng là nhận ra nó thuộc dạng nào trong số các dạng mà chương 1 trưng ra.

**Đọc.** [Một hệ phân loại cho hiệu năng](#/docs/ocnj-01) đặt khung: đây là bộ từ vựng để phát biểu mục tiêu tuning bằng ngôn ngữ định lượng. Bảy mục con [Throughput](#/docs/ocnj-01), [Latency](#/docs/ocnj-01), [Capacity](#/docs/ocnj-01), [Utilization](#/docs/ocnj-01), [Efficiency](#/docs/ocnj-01), [Scalability](#/docs/ocnj-01) và [Degradation](#/docs/ocnj-01) đều ngắn nên đọc liền một mạch, nhưng bám lấy phép ẩn dụ ống nước chạy xuyên suốt cả bảy: nó là thứ giúp bạn nhớ vì sao latency không phải hàm của đường kính ống, còn throughput thì có. Rồi đọc kỹ [Mối tương quan giữa các đại lượng quan sát được](#/docs/ocnj-01) — đây mới là mục quan trọng, vì nó cho thấy các đại lượng không độc lập và ví dụ ngân hàng cuối mục chứng minh capacity lớn hoàn toàn có thể đi cùng latency lớn. [Đọc đồ thị hiệu năng](#/docs/ocnj-01) đưa sáu hình cần nhận diện: performance elbow, scaling gần tuyến tính, định luật Amdahl, mẫu răng cưa của bộ nhớ khỏe mạnh, allocation rate chạm trần phần cứng, và latency suy giảm tới điểm uốn. Khép lại bằng [Hiệu năng trong hệ thống Cloud](#/docs/ocnj-01), nơi sách nêu hai khác biệt lớn so với một JVM đơn lẻ: đơn vị triển khai là container chứ không phải tiến trình JVM, và efficiency cùng utilization giờ hiện thẳng vào hóa đơn.

**Bẫy.** Nêu một con số throughput trần trụi. Sách đòi con số đó phải kèm mô tả nền tảng tham chiếu — cấu hình phần cứng, OS, software stack, và việc hệ đang test là một server đơn lẻ hay một cluster — cùng với việc workload phải được giữ nhất quán giữa các lần chạy; thiếu những thứ đó thì con số không so sánh được với bất cứ thứ gì. Cùng họ với bẫy này là nhầm capacity với throughput: một bể chứa lớn ở đầu ống làm tăng capacity mà không tăng throughput tổng thể. Bẫy thứ hai: tin rằng thêm tải thì mọi đại lượng chỉ có thể tệ đi. Sách ghi chú rằng trong những trường hợp hiếm, tải bổ sung cho kết quả phản trực giác — ở mức tải thấp có thể có method quan trọng bị mắc kẹt ở chế độ thông dịch, rồi chính tần suất gọi tăng lên mới khiến nó đủ điều kiện biên dịch JIT, và các lời gọi sau đó nhanh hơn rất nhiều so với trước.

**Tự kiểm tra.** Với một thuật toán song song hóa được 95%, đồ thị định luật Amdahl trong chương cho biết cần bao nhiêu bộ xử lý để đạt tăng tốc 12 lần, và trần tăng tốc tối đa là bao nhiêu? Scalability và degradation đều mô tả hành vi khi tải tăng — sách phân biệt hai đại lượng này bằng điều kiện nào?`,
      },
      {
        id: "oc-w1-3",
        text: "Bảy loại kiểm thử hiệu năng và cách đặt chúng vào SDLC",
        lesson: `**Mục tiêu.** Nhìn một câu hỏi hiệu năng cụ thể là chọn được đúng loại kiểm thử trả lời nó, và biết một môi trường kiểm thử phải giống production tới mức nào thì kết quả mới dùng được.

**Đọc.** [Các loại kiểm thử hiệu năng](#/docs/ocnj-02) mở đầu bằng danh sách bảy loại kèm câu hỏi định lượng đặc trưng của từng loại — chép nguyên bảy câu hỏi đó ra giấy trước khi đọc tiếp, vì phần còn lại của mục chỉ là khai triển chúng. Bảy mục con [Latency Test](#/docs/ocnj-02), [Throughput Test](#/docs/ocnj-02), [Stress Test](#/docs/ocnj-02), [Load Test](#/docs/ocnj-02), [Endurance Test](#/docs/ocnj-02), [Capacity Planning Test](#/docs/ocnj-02) và [Degradation Test](#/docs/ocnj-02) đọc được nhanh, nhưng dừng lâu ở hai chỗ: chỗ sách giải thích throughput và latency là đối ngẫu của nhau nên phải luôn nêu cái này ở mức đã biết của cái kia, và chỗ Degradation Test dẫn tới Chaos Monkey cùng nguyên tắc "designed for failure". [Nhập môn Best Practice](#/docs/ocnj-02) chỉ vỏn vẹn ba quy tắc vàng — đáng chép lại nguyên văn. Ngay sau đó, [Hiệu năng theo hướng Top-Down](#/docs/ocnj-02) mở đầu bằng đúng chỗ sách giải thích vì sao microbenchmarking bị đẩy hẳn ra Phụ lục A: benchmark quy mô lớn cho ứng dụng Java thường dễ hơn nhiều so với việc lấy con số chính xác cho những đoạn mã nhỏ, và tác giả cố ý đặt kỹ thuật này ra ngoài phần thân chính để giảm nhấn mạnh nó. Phụ lục A không có trong bộ nguồn của chúng ta, nên khi bạn thật sự cần microbenchmark, dùng tài nguyên JMH ở đầu tuần. Đọc kỹ [Tạo môi trường kiểm thử](#/docs/ocnj-02), rồi [Xác định yêu cầu hiệu năng](#/docs/ocnj-02) với sáu ví dụ mục tiêu — ba hiển nhiên, ba ít rõ ràng hơn. [Kiểm thử hiệu năng như một phần của SDLC](#/docs/ocnj-02) và [Các vấn đề riêng của Java](#/docs/ocnj-02) đều ngắn; mục sau cho biết một method không được JIT-compile thì chỉ có hai lý do khả dĩ.

**Bẫy.** Nói chung chung về "performance testing" mà không nêu chi tiết cụ thể. Sách xếp đây vào những sai lầm phổ biến nhất, và chỉ ra gốc rễ của nó là niềm tin "làm gì đó còn hơn không làm gì" — thứ mà sách gọi thẳng là một nửa sự thật nguy hiểm. Cách thoát bẫy rất rẻ: viết ra câu hỏi định lượng mà bài test nhằm trả lời, rồi xác nhận với chủ sở hữu ứng dụng vì sao câu hỏi đó quan trọng, trước khi chọn loại test. Bẫy thứ hai: chấp nhận một môi trường kiểm thử khác đáng kể so với production. Sách nói những môi trường như vậy thường vô tác dụng — không tạo ra được kết quả có tính hữu ích hay khả năng dự đoán nào trong môi trường thật — và khi ban quản lý phản đối chi phí hạ tầng bổ sung thì đó gần như luôn là một sự tiết kiệm giả tạo, vì tổ chức không hạch toán đúng chi phí của các sự cố ngừng hoạt động. Cloud làm việc dựng môi trường dễ hơn nhưng không xóa được bẫy: vẫn phải bảo đảm môi trường test không có phụ thuộc bị bỏ sót vào production và có hệ thống xác thực, phân quyền thực tế chứ không phải thành phần giả.

**Tự kiểm tra.** Stress test và capacity planning test giống nhau ở cách chạy nhưng khác nhau ở câu hỏi — mỗi loại trả lời câu hỏi nào? Endurance test phát hiện được những loại vấn đề nào mà các bài test ngắn không thấy, và vì sao nó hiếm khi được chạy đủ?`,
      },
      {
        id: "oc-w1-4",
        text: "Antipattern, thống kê phi chuẩn và bốn thiên kiến nhận thức",
        lesson: `**Mục tiêu.** Xử lý một tập kết quả latency mà không dùng trung bình và độ lệch chuẩn, và gọi tên được yếu tố con người đứng sau một quyết định hiệu năng tồi khi bạn gặp nó trong đội mình.

**Đọc.** [Nguyên nhân của các Antipattern về hiệu năng](#/docs/ocnj-02) định nghĩa antipattern rồi dẫn sang năm lý do khiến lập trình viên chọn công nghệ tồi: [Sự nhàm chán (Boredom)](#/docs/ocnj-02), [Tô điểm CV (Résumé Padding)](#/docs/ocnj-02), [Áp lực xã hội (Social Pressure)](#/docs/ocnj-02), [Thiếu hiểu biết (Lack of Understanding)](#/docs/ocnj-02) và [Vấn đề bị hiểu sai / không tồn tại](#/docs/ocnj-02) — đọc nhanh, nhưng để ý rằng cả năm đều là lý do con người chứ không phải lý do kỹ thuật. [Thống kê cho hiệu năng JVM](#/docs/ocnj-02) là phần phải đọc chậm nhất tuần: [Các loại sai số](#/docs/ocnj-02) phân biệt sai số ngẫu nhiên với sai số hệ thống qua cặp khái niệm precision và accuracy, kèm ví dụ load test chạy từ Mumbai vào dịch vụ đặt ở London mà độ trễ mạng khứ hồi nhấn chìm mọi khác biệt thật. [Thống kê phi chuẩn (Non-Normal Statistics)](#/docs/ocnj-02) đưa ra kỹ thuật thay thế — sơ đồ phân vị mở rộng theo thang logarit — và giới thiệu HdrHistogram cùng hiện tượng coordinated omission. [Diễn giải thống kê](#/docs/ocnj-02) tách làm hai: [Tương quan giả](#/docs/ocnj-02) liệt kê bốn quan hệ khả dĩ giữa hai biến tương quan, còn [Vấn đề Cái mũ / Con voi](#/docs/ocnj-02) dạy cách phân rã một đại lượng tổng quát thành các tiểu quần thể. Khép lại bằng bốn thiên kiến: [Tư duy giản lược (Reductionist Thinking)](#/docs/ocnj-02), [Thiên kiến xác nhận (Confirmation Bias)](#/docs/ocnj-02), [Màn sương chiến trận (Fog of War / Action Bias)](#/docs/ocnj-02) và [Thiên kiến rủi ro (Risk Bias)](#/docs/ocnj-02).

**Bẫy.** Mang trung bình và độ lệch chuẩn ra dùng cho latency của JVM. Sách nói rõ rằng với phân phối phi chuẩn, nhiều quy tắc cơ bản của thống kê chuẩn bị vi phạm — độ lệch chuẩn, phương sai và các moment bậc cao khác về cơ bản là vô dụng — và rằng trong hiệu năng Java, outlier chính là những giao dịch chậm và những khách hàng không hài lòng, nên phải tránh các kỹ thuật làm loãng tầm quan trọng của chúng. Sách còn thêm rằng trừ khi đã có một lượng lớn khách hàng phàn nàn, việc cải thiện thời gian phản hồi trung bình khó là một mục tiêu hiệu năng hữu ích. Bẫy thứ hai: thiên kiến xác nhận núp dưới hình dạng một bài benchmark. Sách dựng lại kịch bản *Distracted by Shiny*: một thành viên muốn đưa cơ sở dữ liệu NoSQL mới nhất vào, chạy vài bài test trên dữ liệu không giống dữ liệu production vì biểu diễn đầy đủ schema là quá phức tạp, thu được thời gian truy cập vượt trội trên máy cục bộ — và vì người đó đã nói trước với mọi người rằng kết quả sẽ như vậy, đội tiến hành triển khai đầy đủ. Sách cảnh báo thiên kiến này khó chống lại vì thường có yếu tố động cơ hoặc cảm xúc mạnh đang tác động, và nó được đưa vào một cách không chủ ý khi tập test được chọn kém hoặc kết quả không được phân tích đúng về mặt thống kê.

**Tự kiểm tra.** Vì sao sơ đồ phân vị bắt đầu từ mean rồi mở rộng theo thang logarit lại hợp với dữ liệu JVM hơn là lấy mẫu ở những khoảng đều nhau? Trong vấn đề cái mũ / con voi, một histogram thời gian phản hồi HTTP trông phức tạp thực ra được ghép từ những tiểu quần thể nào, và mỗi tiểu quần thể có hình dạng đặc trưng ra sao?`,
      },
    ],
  },
  {
    id: "oc-w2",
    week: "Tuần 2",
    title: "Tổng quan JVM: classloading, JIT, bộ nhớ và công cụ",
    goal: "Vẽ được sơ đồ khối của JVM từ lúc nạp class tới lúc mã chạy nóng, và biết công cụ nào trong JDK trả lời câu hỏi nào.",
    practice:
      "Chạy `javap -c` trên một class có vòng lặp đơn giản và đọc bytecode sinh ra. Bật `-Xlog:class+load` khi khởi động ứng dụng và đếm số class được nạp. Rồi dùng `jcmd <pid> help` để xem JVM đang chạy trả lời được những câu hỏi gì — giữ lại danh sách đó, các tuần sau sẽ quay lại dùng.",
    resources: [
      { label: "OCNJ 03 — Tổng quan về JVM", href: "#/docs/ocnj-03" },
    ],
    items: [
      {
        id: "oc-w2-1",
        text: "Classloading và thực thi bytecode",
        lesson: `**Mục tiêu.** Kể được chuỗi class loader chạy khi một tiến trình Java khởi động và cái nào nạp gì, rồi đọc được đầu ra bytecode của một vòng lặp đơn giản mà không cần tra cứu từng opcode.

**Đọc.** [Thông dịch và nạp lớp (Interpreting and Classloading)](#/docs/ocnj-03) bắt đầu từ mô hình tư duy mà sách cho phép bạn dùng lúc này — trình thông dịch JVM về bản chất là "một câu lệnh switch bên trong một vòng lặp while" trên một máy dựa trên stack. Đọc kỹ phần chuỗi loader: Bootstrap class loader nạp \`java.base\` cùng vài module hỗ trợ và cố ý không xác minh class mà nó nạp để cải thiện hiệu năng khởi động; Platform class loader (lấy qua \`ClassLoader::getPlatformClassLoader\`) nhận phần còn lại của hệ thống cơ sở; Application class loader nạp class người dùng từ classpath. Chú ý đoạn về JPMS: từ Java 9 mọi JVM đều modular, module graph luôn được xây dựng kể cả khi ứng dụng không modular, và nó phải là một đồ thị có hướng không chu trình. [Thực thi Bytecode](#/docs/ocnj-03) chuyển sang phía trước đó — \`javac\` dịch mã nguồn thành file *.class*. Đọc bảng giải phẫu class file (mười thành phần, mở đầu bằng magic number \`0xCAFEBABE\`), rồi đọc thật chậm phần cuối mục: sách chạy \`javap -c\` trên một \`HelloWorld\` có vòng lặp và dẫn bạn qua từng chỉ thị, từ \`iconst_0\` tới \`if_icmpge\` và \`goto\`. Đây chính là bài thực hành của tuần, nên hãy gõ lại thay vì chỉ đọc.

**Bẫy.** Tưởng tên class đầy đủ là đủ để định danh một class. Sách nói rõ một class trong hệ thống được định danh bởi class loader đã nạp nó **cùng với** tên đầy đủ kể cả package, vì cùng một class có thể được nạp hai lần bởi các class loader khác nhau — và các application server như Tomcat hay JBoss EAP cố ý khai thác điều này để nhiều tenant dùng được những phiên bản class khác nhau. Cùng chỗ này sách cũng khuyên tránh gọi Application class loader là loader "System", vì nó không nạp class hệ thống. Bẫy thứ hai: kỳ vọng \`javac\` tối ưu hóa mã của bạn. Sách chỉ ra rất ít tối ưu hóa được thực hiện lúc biên dịch, bytecode kết quả vẫn khá dễ đọc và nhận diện được là mã Java khi xem bằng \`javap\` — phần lớn sức mạnh của JVM đến từ những gì xảy ra lúc runtime, nên đừng đi tìm dấu vết tối ưu hóa trong class file.

**Tự kiểm tra.** Ba class loader trong chuỗi khởi động là gì theo thứ tự cha–con, và điều gì xảy ra khi chuỗi tra cứu đi hết mà vẫn không tìm thấy class? Trong đầu ra \`javap -c\` của \`HelloWorld\`, vì sao class file chứa hai method dù mã nguồn chỉ có \`main()\`?`,
      },
      {
        id: "oc-w2-2",
        text: "HotSpot và vì sao JIT tồn tại",
        lesson: `**Mục tiêu.** Giải thích được vì sao một máy ảo biên dịch lúc chạy lại có thể đuổi kịp — hoặc vượt — mã biên dịch sẵn, và nói được HotSpot lấy thông tin gì để quyết định biên dịch cái gì.

**Đọc.** [Giới thiệu HotSpot](#/docs/ocnj-03) đặt vấn đề bằng một sự phân đôi trong thiết kế ngôn ngữ: một bên là các ngôn ngữ "sát kim loại" dựa trên trừu tượng không chi phí, bên kia là các ngôn ngữ ưu tiên năng suất lập trình viên. Đọc kỹ câu trích Stroustrup về nguyên tắc zero-overhead và ba đoạn phản biện ngay sau nó — sách chỉ ra nguyên tắc đó buộc mọi người dùng ngôn ngữ phải đối mặt với thực tế mức thấp, đòi hỏi biên dịch ahead-of-time, và ngầm khẳng định lập trình viên không thể tạo ra mã tốt hơn một hệ thống tự động. [Giới thiệu biên dịch Just-in-Time](#/docs/ocnj-03) là mục cốt lõi: chương trình Java bắt đầu chạy trong trình thông dịch bytecode, HotSpot giám sát phần mã nào chạy thường xuyên nhất và thu thập thông tin trace, rồi khi việc thực thi vượt một ngưỡng thì profiler tìm cách biên dịch và tối ưu hóa đoạn đó. Nhớ hai điều: đơn vị biên dịch trong HotSpot là *method* và *vòng lặp*, và một số trình biên dịch của HotSpot có khả năng JIT lại nếu về sau lộ ra một tối ưu hóa tốt hơn. Cuối mục sách giới thiệu profile-guided optimization và \`JVM intrinsics\` — kỹ thuật phát hiện chính xác loại CPU lúc VM khởi động; đọc kỹ mẹo phân biệt nó với *intrinsic lock* của từ khóa \`synchronized\`, hai thứ trùng tên mà không liên quan.

**Bẫy.** Suy luận hiệu năng từ mã nguồn Java bạn đã viết. Sách cảnh báo rằng sau khi đi từ mã nguồn sang bytecode rồi qua thêm một bước biên dịch JIT nữa, mã thực sự đang chạy đã thay đổi rất đáng kể — mã đã JIT-compile trên JVM rất có thể trông chẳng giống gì mã nguồn gốc — nên với ứng dụng hiệu năng cao, lập trình viên phải rất cẩn thận tránh những lập luận "theo lẽ thường" và những mô hình tư duy quá đơn giản về cách ứng dụng Java thực sự thực thi. Bẫy thứ hai: đánh đồng "dễ dự đoán hơn" với "tốt hơn" khi so JVM với AOT. Sách nói thẳng hai thứ đó không đồng nghĩa: trình biên dịch AOT tạo mã phải chạy trên một lớp rộng các bộ xử lý nên thường không thể giả định những tính năng bộ xử lý cụ thể là có sẵn, trong khi môi trường dùng profile-guided optimization như Java tận dụng được thông tin runtime theo những cách bất khả thi với hầu hết nền tảng AOT — dynamic inlining và loại bỏ lời gọi virtual là hai ví dụ sách nêu.

**Tự kiểm tra.** Đơn vị biên dịch của HotSpot là gì, và HotSpot dựa vào thông tin nào thu thập lúc thông dịch để quyết định tối ưu hóa? Nguyên tắc zero-overhead của Stroustrup đòi hỏi điều gì ở người dùng ngôn ngữ, và Java đánh đổi điều đó lấy gì?`,
      },
      {
        id: "oc-w2-3",
        text: "Quản lý bộ nhớ, luồng và Java Memory Model",
        lesson: `**Mục tiêu.** Nói được garbage collection mua cho bạn thứ gì và lấy đi thứ gì, và phát biểu được câu hỏi mà Java Memory Model sinh ra để trả lời.

**Đọc.** [Quản lý bộ nhớ trong JVM](#/docs/ocnj-03) mở bằng cái giá của việc tự quản lý bộ nhớ trong C, C++ và Objective-C: lợi ích là hiệu năng mang tính quyết định và khả năng gắn vòng đời tài nguyên với việc tạo, xóa object, nhưng cái giá là lập trình viên phải hạch toán bộ nhớ chính xác — và hàng thập kỷ kinh nghiệm cho thấy quản lý bộ nhớ kém từng là nguyên nhân chính gây lỗi ứng dụng. Đọc kỹ định nghĩa GC mà sách đưa ra và đoạn về stop the world, kể cả nhận xét rằng GC của JVM năm 2024 tinh vi hơn nhiều so với thuật toán nhập môn thường được dạy ở đại học. Mục này cố tình ngắn — chương 4 và 5 mới là chỗ đào sâu. [Luồng và Java Memory Model](#/docs/ocnj-03) dài hơn và đáng đọc chậm. Theo dõi lịch sử quan hệ giữa application thread và platform thread: từ các mô hình ghép kênh như M:N của Solaris hay green threads của Linux, sang mô hình một-đổi-một đơn giản hơn, rồi tới virtual thread của Java 21+ sinh ra từ Project Loom để giải quyết vấn đề "thread bottleneck". Đọc kỹ ba nguyên tắc thiết kế nền tảng cho cách Java xử lý dữ liệu trong chương trình đa luồng, rồi tới câu hỏi mà JMM tồn tại để trả lời: nếu thread A và B cùng giữ tham chiếu tới một object và A thay đổi nó, thì B quan sát thấy gì?

**Bẫy.** Coi garbage collection là một quy trình có thể dự đoán được. Sách định nghĩa nó là một quy trình **không** mang tính quyết định, chỉ kích hoạt khi JVM cần thêm bộ nhớ để cấp phát — nên bạn không được phép suy luận như thể GC chạy vào những thời điểm bạn chọn. Sách cũng nói rõ GC đi kèm một cái giá: theo truyền thống nó stop the world, các khoảng dừng thường cực kỳ ngắn nhưng khi ứng dụng chịu áp lực thì chúng có thể tăng lên. Bẫy thứ hai: nghĩ chương trình của bạn là đơn luồng vì bạn chưa bao giờ tạo một thread nào. Sách nói về cơ bản mọi JVM production đều đa luồng, nên mọi chương trình Java về bản chất đều đa luồng vì chúng thực thi như một phần của tiến trình JVM — và điều đó tạo ra thêm độ phức tạp không thể giảm bớt trong hành vi chương trình, làm khó công việc của nhà phân tích hiệu năng.

**Tự kiểm tra.** Ba nguyên tắc thiết kế nền tảng cho cách Java xử lý dữ liệu chia sẻ giữa các thread là gì, và nguyên tắc nào giải thích vì sao \`final\` lại quan trọng? Vì sao bộ lập lịch của hệ điều hành khiến câu hỏi "thread B thấy gì" trở nên khó hơn vẻ ngoài, và phòng tuyến duy nhất mà lõi Java cung cấp là gì?`,
      },
      {
        id: "oc-w2-4",
        text: "Công cụ giám sát JDK, và chọn bản phân phối Java",
        lesson: `**Mục tiêu.** Chọn đúng cơ chế đo đạc cho một nhu cầu quan sát cụ thể, và trả lời được câu hỏi "đội mình nên dùng bản phân phối Java nào" bằng lý lẽ thay vì cảm tính.

**Đọc.** [Giám sát và công cụ cho JVM](#/docs/ocnj-03) liệt kê bốn công nghệ nền: JMX, Java agent, JVM Tool Interface (JVMTI) và Serviceability Agent. Đọc kỹ phần Java agent vì nó là thứ bạn gặp nhiều nhất trong công cụ observability: agent được nạp qua cờ \`-javaagent:\`, JAR của nó phải có manifest khai \`Premain-Class\`, class đó phải có method \`premain()\` public static chạy trên thread chính **trước** \`main()\` và bắt buộc phải thoát ra, còn việc biến đổi bytecode làm qua các object triển khai \`ClassFileTransformer\`. Đối chiếu với JVMTI ở đoạn ngay sau — interface native, agent nạp bằng \`-agentlib:\` hoặc \`-agentpath:\`, và Serviceability Agent thì không cần mã nào chạy trong VM đích mà đọc thẳng bộ nhớ tiến trình, nên debug được cả file core. Phần VisualVM ở cuối mục có hai chi tiết vận hành dễ vấp: công cụ đã bị chuyển ra khỏi bản phân phối chính nên phải tải riêng và bảo đảm \`jvisualvm\` nằm đúng trên PATH, và nó hiệu chuẩn máy ở lần khởi động đầu nên đừng chạy ứng dụng nào khác lúc đó. [Các triển khai, bản phân phối và bản phát hành Java](#/docs/ocnj-03) tách bạch mã nguồn với binary: OpenJDK **chỉ** cung cấp mã nguồn, cho cả VM lẫn thư viện class. [Chọn một bản phân phối](#/docs/ocnj-03) rút gọn quyết định về ba câu hỏi — trả tiền hay không, bug được sửa thế nào, bản vá bảo mật đến bằng đường nào — rồi điểm qua từng nhà cung cấp. [Chu kỳ phát hành Java](#/docs/ocnj-03) khép lại: nhịp sáu tháng giữ từ tháng 9 năm 2017, và chỉ một số bản có update release do cộng đồng tiếp quản sau khi Oracle rút.

**Bẫy.** Tin rằng đổi bản phân phối OpenJDK sẽ đổi hiệu năng. Sách làm rõ ngay: tất cả bản phân phối OpenJDK đều build từ cùng một mã nguồn nên không có khác biệt chức năng nào ở các phiên bản tương đương, và không nên có khác biệt hiệu năng mang tính hệ thống nào giữa các triển khai dựa trên HotSpot khi so cùng phiên bản và cùng cấu hình build flag — ngoại lệ nhỏ duy nhất được nêu là Oracle không phát hành bộ thu gom Shenandoah mà quảng bá ZGC của chính mình. Sách còn dặn đối xử với những tin "tìm ra khác biệt hiệu năng giữa các bản phân phối" trên mạng xã hội bằng sự hoài nghi lành mạnh, trừ khi kết quả được kiểm chứng độc lập là chặt chẽ về mặt thống kê. Bẫy thứ hai: với tay sang JVMTI khi một Java agent là đủ. Sách cảnh báo agent JVMTI phải viết bằng mã native nên khó viết và khó debug hơn, và một lỗi lập trình trong đó có thể gây hại cho ứng dụng đang chạy, thậm chí làm crash JVM — vì vậy khi có thể, hãy viết Java agent; chỉ dùng JVMTI khi thông tin bạn cần không có sẵn qua Java API.

**Tự kiểm tra.** Bốn công nghệ đo đạc và giám sát mà chương liệt kê là gì, và cái nào không cần mã nào chạy bên trong VM đích? Vì sao hệ sinh thái Java bám vào các phiên bản LTS thay vì nâng cấp mỗi sáu tháng, và bốn bản phát hành nào tới nay có dự án update release?`,
      },
    ],
  },
];
