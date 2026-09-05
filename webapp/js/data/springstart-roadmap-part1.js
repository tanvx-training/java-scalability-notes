// Lộ trình đọc Spring Start Here — Phần 1 (Tuần 1–4).
//
// Nguồn: bản dịch tiếng Việt "Spring Start Here" (Laurențiu Spilcă — Manning, 2021).
// Thư mục nguồn: spring-start-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Đây là sách NHẬP MÔN: khối "Bẫy" phải là bẫy người mới thật sự vấp.
// GIỮ NGUYÊN id (sh-w<N> / sh-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là sh-, KHÔNG phải ss- (đã thuộc lĩnh vực Spring Security).

export const springStartWeeksPart1 = [
  {
    id: "sh-w1",
    week: "Tuần 1",
    title: "Spring là gì, và cách học cuốn sách này",
    goal: "Dựng xong môi trường chạy được ví dụ đầu tiên và chốt một quy trình học lặp lại được, đồng thời trả lời được vì sao dùng Spring — và khi nào thì không nên dùng framework nào cả.",
    practice:
      "Cài JDK 17 trở lên và Maven, chạy `mvn -v` xác nhận cả hai nhận nhau. Rồi làm đúng \"Checklist tự kiểm tra theo chương\" của hướng dẫn học cho chương 1, và viết ra một đoạn ngắn: dự án bạn đang định làm có rơi vào trường hợp nào mà mục \"1.4 Khi nào không nên dùng framework\" khuyên đừng dùng framework không.",
    resources: [
      { label: "Spring Start 00 — Hướng dẫn học hiệu quả", href: "#/docs/springstart-00" },
      { label: "Spring Start 01 — Spring trong thế giới thực", href: "#/docs/springstart-01" },
      { label: "spring.io — Spring Framework", href: "https://spring.io/projects/spring-framework" },
    ],
    items: [
      {
        id: "sh-w1-1",
        text: "Sách dành cho ai, bản đồ cuốn sách, và lộ trình gợi ý",
        lesson: `**Mục tiêu.** Biết chắc bạn đủ nền để bắt đầu, cài xong công cụ chạy được ví dụ đầu tiên, và cầm được bản đồ phụ thuộc giữa các chương — để tám tuần tới không lần nào phải đoán đọc tiếp cái gì.

**Đọc.** [1. Cuốn sách này dành cho ai và cần chuẩn bị gì](#/docs/springstart-00) đọc chậm đúng một chỗ: bảng kiến thức nền. Soi từng dòng vào chính bạn rồi ghi ra thứ còn yếu kèm thời điểm nó đòi bạn trả nợ — Java OOP cho chương 2 đến 6, HTTP từ chương 7, SQL và JDBC lý thuyết từ chương 12. Danh sách công cụ thì làm ngay, kể cả bước tải mã nguồn ví dụ đặt tên theo quy ước \`sq-chX-exY\`. [2. Bản đồ cuốn sách và thứ tự học](#/docs/springstart-00) là phần nặng nhất buổi: chép sơ đồ phụ thuộc ra giấy rồi tự nói ra vì sao chương 6 phải hiểu trước chương 13, và vì sao 12, 13, 14 phải học liên tiếp. Ghi lại câu tác giả nhấn ở chương 3: mọi thứ trong sách dựa trên việc hiểu đúng các chương 2 đến 5. [3. Lộ trình gợi ý](#/docs/springstart-00) thì đối chiếu bảy tuần của sách với tám tuần ở đây, rồi chốt nhịp 2 đến 3 buổi mỗi tuần, mỗi buổi 60 đến 90 phút.

**Bẫy.** Thấy quen quen vài khái niệm rồi nhảy thẳng vào chương 4. Mục 2 nói thẳng: không được nhảy cóc trong chương 2 đến 5, vì mỗi chương xây trực tiếp trên chương trước — thêm bean, nối bean, dùng abstraction, rồi scope; nếu đã biết một phần Spring, chỉ nên bỏ qua khi tự trả lời được đầy đủ checklist ở mục 6 của chương đó. Bẫy thứ hai: bận quá nên rút gọn đều tay cả lộ trình. Mục 3 chỉ cho cắt ở nửa sau — tuyệt đối giữ nguyên tuần 1 đến 3, còn tuần 4 đến 7 rút gọn bằng cách chỉ chạy project mẫu thay vì gõ lại.

**Tự kiểm tra.** Chương 15 dùng lại ví dụ của hai chương nào, và điều đó buộc bạn không được bỏ chương nào ở giữa? Và nếu quỹ thời gian bị cắt một nửa, bạn cắt ở đâu và giữ nguyên phần nào?`,
      },
      {
        id: "sh-w1-2",
        text: "Quy trình học một chương, và những bẫy người mới hay vấp",
        lesson: `**Mục tiêu.** Có quy trình sáu bước lặp lại được cho mọi chương còn lại, và biết trước danh sách bẫy người mới hay vấp cùng những chỗ sách lệch so với Spring hôm nay.

**Đọc.** [4. Cách học một chương: quy trình 6 bước](#/docs/springstart-00) đọc để làm theo chứ không phải để biết; mục này bạn sẽ quay lại mỗi tuần. [Bước 1: Đọc khung trước khi đọc nội dung (5 phút)](#/docs/springstart-00) với [Bước 2: Đọc kỹ, không bỏ chú thích hình (30 đến 60 phút)](#/docs/springstart-00) đọc liền một mạch: bản dịch không có ảnh, nên chú thích hình phải đọc như văn xuôi. [Bước 3: Gõ lại code, không copy (thời gian tùy chương)](#/docs/springstart-00) và [Bước 4: Phá vỡ ví dụ (15 đến 20 phút)](#/docs/springstart-00) đọc kỹ nhất — chép riêng ra sáu cách phá ví dụ theo từng chương. [Bước 5: Viết tóm tắt bằng lời của bạn (10 phút)](#/docs/springstart-00) cùng [Bước 6: Ôn lại theo lịch (5 phút mỗi lần)](#/docs/springstart-00) ngắn, nhưng đặt luôn lịch. [5. Bài tập tự luyện và dự án tổng hợp](#/docs/springstart-00) đọc lướt, trừ bài sau chương 2 đến 3. [6. Checklist tự kiểm tra theo chương](#/docs/springstart-00) chỉ đọc chương 1 và 2. [7. Lưu ý về phiên bản khi chạy ví dụ trên Spring mới](#/docs/springstart-00) đọc kỹ cả bảng. [8. Những bẫy thường gặp khi mới học Spring](#/docs/springstart-00) đọc chậm, đánh dấu chương của từng bẫy. [9. Cách dùng bộ bản dịch này](#/docs/springstart-00) cho quy ước ký hiệu, và [10. Sau khi đọc xong sách](#/docs/springstart-00) đọc lướt.

**Bẫy.** Mở project mẫu ra rồi copy sang project của mình cho nhanh. Bước 3 nói rõ chỉ mở \`sq-chX-exY\` khi code của bạn không chạy, để so sánh chứ không phải để chép: cú pháp Spring toàn annotation, và chỉ khi tự gõ bạn mới nhớ \`@ComponentScan\` cần \`basePackages\`. Bẫy thứ hai: tạo project mới trên start.spring.io rồi chạy ví dụ của sách. Mục 7 cho thấy bạn sẽ nhận Spring Boot 3.x cần Java 17, và \`javax.annotation.PostConstruct\` của chương 2 phải đổi thành \`jakarta.annotation.PostConstruct\`; khi mới học hãy dùng đúng phiên bản trong project mẫu.

**Tự kiểm tra.** Bước 4 bảo bạn phá ví dụ chương 2 bằng hai cách nào, và lộ ra exception gì? Và trong mục 8, bẫy nào là hệ quả của cơ chế proxy ở chương 6?`,
      },
      {
        id: "sh-w1-3",
        text: "Vì sao dùng framework, và hệ sinh thái Spring gồm gì",
        lesson: `**Mục tiêu.** Nói được framework mua cho bạn thứ gì bằng cái gì, và vẽ được sơ đồ hệ sinh thái đủ để biết mỗi cái tên trong sách thuộc về đâu.

**Đọc.** [1.1 Tại sao chúng ta nên dùng framework?](#/docs/springstart-01) đọc chậm, bám hai phép so sánh: cửa hàng nội thất tự lắp giao cho bạn mọi linh kiện chứ không phải chiếc tủ đã lắp, và tảng băng trôi ở Hình 1.2, nơi logic nghiệp vụ chỉ là phần nổi còn phần chìm là "the plumbing". Rồi tự trả lời: viết lại các yêu cầu lặp lại đó mỗi lần có hiệu quả không. Sidebar "Một câu chuyện chuyển đổi" đọc kỹ: con số 40% số dòng code bị loại bỏ rất đáng nhớ. [1.2 Hệ sinh thái Spring](#/docs/springstart-01) mở bằng hình hệ mặt trời — vẽ lại nó. [1.2.1 Khám phá Spring Core: Nền tảng của Spring](#/docs/springstart-01) là mục quan trọng nhất chương: đọc kỹ định nghĩa inversion of control và khối LƯU Ý giải thích "kiểm soát" nghĩa là tạo instance và gọi method. [1.2.2 Dùng tính năng Spring Data Access để triển khai lưu trữ dữ liệu cho ứng dụng](#/docs/springstart-01), [1.2.3 Các khả năng của Spring MVC để phát triển ứng dụng web](#/docs/springstart-01) và [1.2.4 Tính năng testing của Spring](#/docs/springstart-01) đọc lướt, chỉ nhớ mỗi mảnh xuất hiện ở chương nào. [1.2.5 Các project trong hệ sinh thái Spring](#/docs/springstart-01) đọc kỹ hai phần con về Spring Data và Spring Boot.

**Bẫy.** Coi Spring Data Access và Spring Data là một thứ vì tên gần giống nhau. Khối LƯU Ý ở mục 1.2.5 tách hẳn chúng: Spring Data Access là một module của Spring Core, chứa cơ chế transaction và các công cụ JDBC; còn Spring Data là project độc lập trong hệ sinh thái, bàn ở chương 14. Bẫy thứ hai: mặc định Spring là lựa chọn duy nhất. Sidebar "Các lựa chọn thay thế cho việc dùng Spring" kể CDI, EJB, Google Guice cho IoC container, Apache Shiro thay Spring Security, rồi chốt: luôn cân nhắc lựa chọn thay thế, đừng bao giờ tin một giải pháp là "duy nhất".

**Tự kiểm tra.** Chữ "đảo ngược" trong inversion of control đảo ngược chính xác điều gì so với Java thuần? Và trong bốn mảnh của Spring framework, mảnh nào bạn dùng ở tuần 2?`,
      },
      {
        id: "sh-w1-4",
        text: "Spring trong tình huống thật, và khi nào KHÔNG nên dùng framework",
        lesson: `**Mục tiêu.** Kể được bốn loại ứng dụng mà Spring hợp, bốn tình huống mà framework là lựa chọn sai, và tự phán xét được dự án của chính bạn thuộc nhóm nào.

**Đọc.** [1.3 Spring trong các tình huống thực tế](#/docs/springstart-01) mở bằng bốn kịch bản, ghi lại cả bốn. [1.3.1 Dùng Spring trong phát triển ứng dụng backend](#/docs/springstart-01) đọc kỹ Hình 1.5 và Hình 1.6 — hình dung bạn sẽ mang theo suốt phần hai của sách. [1.3.2 Dùng Spring trong ứng dụng kiểm thử tự động](#/docs/springstart-01) đọc chậm hơn bạn tưởng: đây là ví dụ tốt nhất cho thấy Spring không chỉ dành cho web. [1.3.3 Dùng Spring để phát triển ứng dụng desktop](#/docs/springstart-01) và [1.3.4 Dùng Spring trong ứng dụng di động](#/docs/springstart-01) đọc lướt. [1.4 Khi nào không nên dùng framework](#/docs/springstart-01) là mục đọc chậm nhất tuần — chép ra cả bốn kịch bản trước khi đọc chi tiết, rồi đi qua [1.4.1 Bạn cần có footprint nhỏ](#/docs/springstart-01) với ví dụ server-less function, [1.4.2 Nhu cầu bảo mật đòi hỏi code tùy chỉnh](#/docs/springstart-01) cùng khối LƯU Ý tự phản biện của tác giả, [1.4.3 Quá nhiều tùy chỉnh hiện có khiến framework không thực tế](#/docs/springstart-01) và [1.4.4 Bạn sẽ không hưởng lợi từ việc chuyển sang framework](#/docs/springstart-01). [1.5 Bạn sẽ học gì trong cuốn sách này](#/docs/springstart-01) đọc như bản cam kết đầu ra.

**Bẫy.** Thay một thứ đang chạy tốt bằng framework đang thịnh hành. Sidebar "Một sai lầm có thể tránh được" kể đúng cảnh đó: nhóm của tác giả định thay code JDBC xấu xí bằng Hibernate chỉ vì nó phổ biến, mất vài tháng cùng rất nhiều công sức và căng thẳng rồi phải từ bỏ, cuối cùng dọn sạch code bằng JdbcTemplate mà không cần framework mới nào. Bẫy thứ hai: quy Spring về đúng một chỗ dùng. Mục 1.3 mở đầu bằng lời phàn nàn rằng quá thường xuyên lập trình viên chỉ nghĩ tới ứng dụng backend khi nhắc đến Spring, thậm chí thu hẹp xuống chỉ còn ứng dụng web backend.

**Tự kiểm tra.** Trong bốn kịch bản của mục 1.4, kịch bản nào không nói framework tệ mà chỉ nói bạn chọn sai framework? Và với một server-less function nhỏ, bạn dựa vào lập luận nào của mục 1.4.1 để bảo vệ quyết định không dùng Spring?`,
      },
    ],
  },
  {
    id: "sh-w2",
    week: "Tuần 2",
    title: "Spring context: định nghĩa bean",
    goal: "Đưa được một object instance vào Spring context bằng cả ba cách của sách, và chọn đúng cách cho từng tình huống thay vì luôn dùng cách bạn gặp đầu tiên.",
    practice:
      "Tạo project Maven theo mục 2.1, rồi thêm **cùng một** bean `Parrot` bằng cả ba cách của mục 2.2 — `@Bean`, stereotype annotation, và `registerBean()` — mỗi cách trong một class cấu hình riêng. In `context.getBean(Parrot.class)` ở cả ba và so số dòng code phải viết.",
    resources: [
      { label: "Spring Start 02 — Spring context: Định nghĩa bean", href: "#/docs/springstart-02" },
    ],
    items: [
      {
        id: "sh-w2-1",
        text: "Dựng project Maven đầu tiên và tạo Spring context",
        lesson: `**Mục tiêu.** Dựng được từ con số không một project Maven có \`spring-context\`, chạy được chương trình tạo ra một Spring context rỗng, và nói được vì sao một object vừa \`new\` ra vẫn hoàn toàn vô hình với Spring.

**Đọc.** [2.1 Tạo một project Maven](#/docs/springstart-02) đọc lướt phần lý thuyết build tool nhưng làm thật từng bước: tạo project trong IDE, xem Hình 2.1 và Hình 2.2 để hiểu group ID, artifact ID và version dùng làm gì, rồi đối chiếu Hình 2.3 với cây thư mục thật — \`src/main/java\` cho code, \`src/main/resources\` cho cấu hình, \`src/test\` cho unit test, \`pom.xml\` ở gốc. Gõ lại Listing 2.1 rồi Listing 2.2 để thấy cặp thẻ \`<dependencies>\` nằm ở đâu và một \`<dependency>\` gồm ba thuộc tính nào; mở thư mục External Libraries trước và sau khi thêm để tận mắt thấy Maven kéo file jar về từ Maven central. Sau đó sang phần mở đầu của [2.2 Thêm bean mới vào Spring context](#/docs/springstart-02), dừng trước mục 2.2.1: đoạn này dựng project khung sườn cho cả ba cách thêm bean của tuần. Gõ lại Listing 2.3 và Listing 2.4, thêm dependency \`spring-context\` như Listing 2.5, rồi Listing 2.6 tạo instance \`AnnotationConfigApplicationContext\`. Nhìn kỹ Hình 2.8 và tự nói ra tình trạng hiện tại: đã có instance \`Parrot\`, đã có context, nhưng hai thứ chưa liên quan gì đến nhau.

**Bẫy.** Đâm đầu tìm hiểu cây kế thừa của các implementation context ngay từ buổi đầu. Khối LƯU Ý sau Listing 2.6 khuyên thẳng người mới tránh đi sâu vào chi tiết các implementation của context và chuỗi kế thừa của chúng, vì rất có thể bạn sẽ lạc vào những chi tiết không quan trọng; sách chỉ dùng \`AnnotationConfigApplicationContext\`. Bẫy thứ hai: đoán tên dependency Maven, hoặc kéo cả Spring vào cho chắc. Sách nhấn rằng Spring được thiết kế module hóa nên luôn chỉ thêm những gì cần thiết — ở đây đúng một \`spring-context\`; và khối LƯU Ý sau Listing 2.5 chỉ chỗ tra thay vì học thuộc: tài liệu tham khảo của Spring, với group ID \`org.springframework\`.

**Tự kiểm tra.** Sau Listing 2.6, vì sao instance \`Parrot\` vừa tạo không nằm trong context? Và nếu xóa dependency \`spring-context\` khỏi \`pom.xml\`, lỗi xuất hiện ở bước biên dịch hay bước chạy?`,
      },
      {
        id: "sh-w2-2",
        text: "Thêm bean bằng annotation @Bean",
        lesson: `**Mục tiêu.** Thêm được bean vào context bằng ba bước của sách, thêm nhiều bean cùng kiểu, và lấy lại đúng bean bạn muốn khi context có nhiều lựa chọn.

**Đọc.** [2.2.1 Dùng annotation @Bean để thêm bean vào Spring context](#/docs/springstart-02) là mục đọc chậm nhất tuần, và cũng dài nhất chương. Bám Hình 2.9 rồi đi đúng ba bước. Bước một: gõ lại Listing 2.7, một class \`ProjectConfig\` rỗng đánh dấu \`@Configuration\` — đọc khối LƯU Ý định nghĩa class cấu hình là thứ bạn dùng để chỉ thị Spring làm những việc cụ thể. Bước hai: Listing 2.8, method \`parrot()\` trả về instance và được đánh dấu \`@Bean\`; đọc kỹ đoạn giải thích vì sao tên method không chứa động từ. Bước ba: Listing 2.9 truyền \`ProjectConfig.class\` vào constructor của context, rồi Listing 2.10 gọi \`context.getBean(Parrot.class)\` và in ra "Koko" — chạy thật cho tới khi thấy dòng đó. Tiếp đó Listing 2.11 và 2.12 thêm một \`String\` và một \`Integer\` vào context: chi tiết nhỏ nhưng là lý lẽ chính của bảng so sánh ở mục sau. Khối LƯU Ý sau Listing 2.11 nhắc trước rằng ứng dụng thật không đưa mọi đối tượng vào context. Nửa sau mục là ba bean cùng kiểu: gõ Listing 2.13, chạy Listing 2.14 để tự tay nhận \`NoUniqueBeanDefinitionException\`, rồi Listing 2.15 sửa bằng \`context.getBean("parrot2", Parrot.class)\`.

**Bẫy.** Khai báo thêm một bean cùng kiểu rồi vẫn gọi \`getBean\` theo kiểu như cũ. Sách dựng đúng cảnh này ở Listing 2.14: với ba method \`@Bean\` cùng trả về \`Parrot\`, Spring không thể đoán bạn muốn instance nào và ném exception liệt kê \`parrot1,parrot2,parrot3\`; lối ra là tham chiếu bằng tên bean. Bẫy thứ hai: tưởng tên bean lấy từ dữ liệu bên trong đối tượng. Khối LƯU Ý trước Listing 2.13 dặn đừng nhầm tên bean với tên con vẹt: định danh trong context là \`parrot1\`, \`parrot2\`, \`parrot3\` theo tên method, còn Koko, Miki, Riki chỉ là thuộc tính của đối tượng và không có ý nghĩa gì với Spring.

**Tự kiểm tra.** Nếu bạn đổi tên method \`parrot2()\` thành \`getParrot2()\`, những chỗ nào trong ứng dụng hỏng theo? Và vì sao \`@Bean\` thêm được bean kiểu \`String\` trong khi cách ở mục sau thì không?`,
      },
      {
        id: "sh-w2-3",
        text: "Thêm bean bằng stereotype annotation",
        lesson: `**Mục tiêu.** Thêm bean bằng đúng hai annotation thay vì một method cấu hình, và biết chính xác bạn đánh đổi quyền kiểm soát nào để lấy sự ngắn gọn đó.

**Đọc.** [2.2.2 Dùng stereotype annotation để thêm bean vào Spring context](#/docs/springstart-02) mở bằng sidebar "Định nghĩa một bean là primary" — đọc ngay, vì nó là lối ra thứ hai cho tình huống nhiều bean cùng kiểu bạn vừa gặp: đánh dấu \`@Primary\` để Spring có lựa chọn mặc định, và mỗi kiểu chỉ được một bean primary. Sau đó bám Hình 2.12 và làm đúng hai bước: gõ lại Listing 2.16 đặt \`@Component\` lên class \`Parrot\`, rồi Listing 2.17 đặt \`@ComponentScan(basePackages = "main")\` lên class cấu hình. Chạy Listing 2.18 và đọc kỹ hai dòng nó in ra — dòng đầu chứng minh bean đã có trong context, dòng thứ hai in \`null\`. Bảng 2.1 là phần đáng đọc chậm nhất mục: bốn cặp ưu và nhược điểm đặt \`@Bean\` cạnh stereotype annotation; tự nói lại từng cặp bằng lời của bạn rồi mới đọc kết luận ngay dưới bảng. Khép mục bằng sidebar "Dùng @PostConstruct để quản lý instance sau khi nó được tạo" — gõ lại ví dụ \`init()\` đặt tên "Kiki", và ghi nhận lời khuyên của tác giả về việc tránh \`@PreDestroy\`.

**Bẫy.** Đặt \`@Component\` lên class rồi tưởng đã xong. Sách dừng lại đúng chỗ đó để nói "khoan đã, code này chưa hoạt động được": mặc định Spring không tìm các class được đánh dấu bằng stereotype annotation, nên nếu thiếu \`@ComponentScan\` trên class cấu hình — hoặc \`basePackages\` trỏ sai package — bean sẽ không bao giờ vào context. Bẫy thứ hai: mong instance mà Spring tạo ra đã được cấu hình sẵn như khi bạn tự \`new\`. Listing 2.18 in ra \`null\` cho tên con vẹt, và sách giải thích Spring chỉ tạo instance của class, còn việc thay đổi instance đó sau này vẫn là trách nhiệm của bạn; muốn chạy lệnh ngay sau constructor thì dùng \`@PostConstruct\`.

**Tự kiểm tra.** Với stereotype annotation, vì sao bạn không thể có hai bean \`Parrot\` trong context như ở mục trước? Và \`@ComponentScan\` cần biết gì mà \`@Bean\` thì không?`,
      },
      {
        id: "sh-w2-4",
        text: "Thêm bean theo cách lập trình, và chọn cách nào khi nào",
        lesson: `**Mục tiêu.** Đăng ký bean bằng code chạy lúc runtime khi hai cách annotation không đủ, và chốt được một quy tắc chọn cách cho mọi bean bạn viết từ chương 3 trở đi.

**Đọc.** [2.2.3 Thêm bean vào Spring context theo cách lập trình](#/docs/springstart-02) mở bằng đúng đoạn code giải thích lý do tồn tại của cách này: một nhánh \`if/else\` chọn đăng ký bean nào tùy cấu hình — thứ \`@Bean\` và stereotype annotation không diễn đạt được. Bám tình huống của sách trong Hình 2.13: đọc vào một tập con vẹt, chỉ thêm những con màu xanh lá vào context. Đọc chậm chữ ký bốn tham số của \`registerBean()\` và bốn đoạn giải thích ngay sau: \`beanName\` có thể là \`null\`, \`beanClass\` là \`Parrot.class\`, \`Supplier\` trả về chính instance bạn muốn, và varargs \`BeanDefinitionCustomizer\` có thể bỏ hẳn. Gõ lại Listing 2.19 cùng Hình 2.14 và chạy thật; chú ý class cấu hình ở ví dụ này rỗng và \`Parrot\` là POJO thuần, không mang annotation nào. Thử nốt biến thể cuối mục truyền \`bc -> bc.setPrimary(true)\`. Rồi đọc [Tóm tắt](#/docs/springstart-02) như một bài kiểm tra: ba gạch đầu dòng về ba cách thêm bean phải khớp với những gì bạn vừa làm cả tuần, kể cả câu chốt rằng \`registerBean()\` chỉ dùng được từ Spring 5.

**Bẫy.** Thấy \`registerBean()\` linh hoạt nhất nên dùng nó làm mặc định. Sách đặt nó vào đúng một chỗ: khi bạn cần một cách tùy chỉnh để thêm bean và \`@Bean\` hay stereotype annotation không đáp ứng được nhu cầu — với hai cách kia bạn đã triển khai được hầu hết tình huống. Bẫy thứ hai: chọn cách theo thói quen thay vì theo Bảng 2.1. Bảng nói rõ hai giới hạn của stereotype annotation: bạn chỉ thêm được một instance của mỗi class, và chỉ dùng được cho class do ứng dụng bạn sở hữu — không thể tạo bean kiểu \`String\` hay bean của một class trong library, vì bạn không sửa được class đó để gắn annotation.

**Tự kiểm tra.** Trong ba cách, cách nào cho phép quyết định lúc chạy chương trình chứ không phải lúc biên dịch? Và với một bean \`DataSource\` lấy từ library bên ngoài, bạn chọn cách nào và vì sao?`,
      },
    ],
  },
  {
    id: "sh-w3",
    week: "Tuần 3",
    title: "Wiring bean và lập trình theo abstraction",
    goal: "Nối được hai bean bằng mọi cú pháp chương 3 đưa ra, nhận ra và gỡ được circular dependency đầu tiên bạn tự tạo, rồi thiết kế lại các phụ thuộc qua interface để đổi implementation mà không phải sửa đối tượng đang dùng nó.",
    practice:
      "Lấy project tuần 2, thêm bean `Person` phụ thuộc `Parrot`. Nối chúng bằng cả ba cách mục 3.2 mô tả (tham số của `@Bean`, `@Autowired` trên trường, `@Autowired` trên constructor). Rồi cố tình tạo circular dependency giữa hai bean để thấy đúng thông báo lỗi mục 3.3 nói tới, và gỡ nó ra. Cuối cùng thêm bean thứ hai cùng kiểu và dùng một cách của mục 3.4 để Spring biết chọn cái nào.",
    resources: [
      { label: "Spring Start 03 — Spring context: Wiring bean", href: "#/docs/springstart-03" },
      { label: "Spring Start 04 — Spring context: Sử dụng abstraction", href: "#/docs/springstart-04" },
    ],
    items: [
      {
        id: "sh-w3-1",
        text: "Nối bean trong file cấu hình, và ba kiểu @Autowired",
        lesson: `**Mục tiêu.** Nối được hai bean bằng cả năm cú pháp của chương — hai cách trong class cấu hình, ba cách với \`@Autowired\` — và chọn đúng cách cho từng tình huống.

**Đọc.** [3.1 Triển khai quan hệ giữa các bean được định nghĩa trong file cấu hình](#/docs/springstart-03) mở bằng Hình 3.1 và Hình 3.2: hai bean đã ở trong context, việc còn lại là dựng quan hệ "has-A". Gõ lại Listing 3.1 rồi Listing 3.2, chạy tới khi thấy dòng thứ ba in \`Person's parrot: null\`. [3.1.1 Wiring các bean bằng cách gọi trực tiếp method giữa các method @Bean](#/docs/springstart-03) chỉ đổi một dòng ở Listing 3.3; phần đáng giá là đoạn ngay sau: thêm constructor không tham số in "Parrot created" rồi đếm số lần nó xuất hiện. Mục 3.1.2 là biến thể dùng tham số, Listing 3.4, cũng là chỗ sách định nghĩa chính thức dependency injection. [3.2 Sử dụng annotation @Autowired để inject bean](#/docs/springstart-03) là mục đọc chậm nhất tuần: chép ra ba gạch đầu dòng mở mục — field cho ví dụ, constructor cho thực tế, setter thì hiếm — rồi đi lần lượt [3.2.1 Dùng @Autowired để inject giá trị qua field của class](#/docs/springstart-03), [3.2.2 Dùng @Autowired để inject giá trị qua constructor](#/docs/springstart-03) với Listing 3.5, và mục 3.2.3, kèm khối LƯU Ý khép mục 3.2.2.

**Bẫy.** Tưởng gọi \`parrot()\` từ trong \`person()\` sẽ sinh ra hai con vẹt. Sách dựng hẳn câu hỏi này rồi trả lời: thực tế chỉ có một instance parrot, vì nếu bean đã tồn tại trong context thì Spring lấy thẳng từ đó chứ không gọi lại method — dòng "Parrot created" in đúng một lần là bằng chứng. Bẫy thứ hai: dùng \`@Autowired\` trên field vì nó ngắn nhất. Mục 3.2.1 nói rõ cách này có "tội lỗi" riêng nên ta tránh nó trong code production: bạn mất khả năng đặt field là \`final\` — sách in hẳn đoạn code không biên dịch được — và tự quản lý giá trị khi khởi tạo cũng khó hơn.

**Tự kiểm tra.** Thí nghiệm thêm constructor vào \`Parrot\` in ra "Parrot created" mấy lần, và con số đó bác bỏ điều gì? Và từ phiên bản Spring nào thì một class chỉ có một constructor được phép bỏ hẳn \`@Autowired\`?`,
      },
      {
        id: "sh-w3-2",
        text: "Circular dependency, và cách chọn giữa nhiều bean cùng kiểu",
        lesson: `**Mục tiêu.** Nhận ra circular dependency ngay từ thông báo exception và gỡ nó đúng cách, rồi chỉ định được bean nào cần inject khi context có nhiều bean cùng kiểu.

**Đọc.** [3.3 Xử lý circular dependency](#/docs/springstart-03) ngắn nhưng đọc chậm: định nghĩa deadlock của sách, Hình 3.11, rồi project "sq-ch3-ex7" nơi \`Person\` nhận \`Parrot\` qua constructor và \`Parrot\` nhận lại \`Person\`. Chép nguyên câu cuối trong khối exception, "Is there an unresolvable circular reference?". [3.4 Chọn từ nhiều bean trong Spring context](#/docs/springstart-03) dài hơn hẳn: trước khi đọc chi tiết, chép ra cây quyết định ở đầu mục — nếu định danh của tham số khớp tên một bean, Spring chọn bean đó; nếu không khớp thì lần lượt xét bean được đánh dấu primary, rồi \`@Qualifier\`, và nếu không có cả hai thì ứng dụng thất bại với exception. Sau đó chạy thật từng bước: Listing 3.6 với tham số tên \`parrot2\` kéo về con vẹt Miki, Listing 3.7 thay bằng \`@Qualifier("parrot2")\`. Nửa sau mục lặp lại tình huống đó với \`@Autowired\`: "sq-ch3-ex9" có Listing 3.8 khai hai bean \`Parrot\` bằng \`@Bean\` còn \`Person\` bằng stereotype annotation, tham số constructor cố ý đặt tên "parrot2"; rồi "sq-ch3-ex10" thay tên đó bằng \`@Qualifier\`.

**Bẫy.** Gặp circular dependency rồi đi tìm một annotation để gỡ. Sách không cho lối tắt nào: nó gọi thẳng việc hai đối tượng phụ thuộc lẫn nhau là thiết kế class tệ và nói trong trường hợp đó bạn cần viết lại code; mỗi khi thấy exception này, việc phải làm là mở đúng các class mà exception chỉ ra và loại bỏ vòng phụ thuộc. Bẫy thứ hai: chọn bean bằng cách đặt tên tham số cho khớp. Cách này chạy được — Listing 3.6 chứng minh — nhưng tác giả khuyên tránh dựa vào tên tham số, thứ có thể dễ dàng bị refactor và thay đổi nhầm bởi một lập trình viên khác; khi đó hành vi ứng dụng đổi mà trình biên dịch không hề báo gì.

**Tự kiểm tra.** Trong cây quyết định của mục 3.4, trường hợp nào khiến ứng dụng thất bại với exception, và hai lối ra đứng trước nó là gì? Và exception của circular dependency mang tên gì, khác thế nào với exception bạn đã gặp ở tuần 2 khi context có ba bean \`Parrot\`?`,
      },
      {
        id: "sh-w3-3",
        text: "Interface làm contract, và tiêm phụ thuộc qua abstraction",
        lesson: `**Mục tiêu.** Thiết kế được một use case thật bằng ba trách nhiệm tách rời qua interface, giao chúng cho Spring, và biết đối tượng nào KHÔNG nên vào context.

**Đọc.** [4.1 Dùng interface để định nghĩa contract](#/docs/springstart-04) mở bằng câu chốt: interface nói "cái gì", implementation nói "như thế nào". [4.1.1 Dùng interface để tách rời các implementation](#/docs/springstart-04) đọc chậm cặp Hình 4.2 với Hình 4.4: cùng một yêu cầu đổi cách sắp xếp, chỉ bản có interface \`Sorter\` mới không phải sửa \`DeliveryDetailsPrinter\`. Mục 4.1.2 chỉ vài dòng, nhưng là kịch bản còn dùng lại ở chương 5 và 6: đăng bình luận thì vừa lưu vừa gửi mail. [4.1.3 Triển khai yêu cầu mà không dùng framework](#/docs/springstart-04) gõ lại toàn bộ theo thứ tự Listing 4.1 đến Listing 4.7 và tách package như Hình 4.7 — vẫn là Java thuần, chưa có Spring. Sang [4.2 Dùng dependency injection với abstraction](#/docs/springstart-04), phần nặng nhất là 4.2.1: tự trả lời "đối tượng này có cần được framework quản lý không?" cho từng class, và để ý Listing 4.11 chỉ khai ba package, bỏ \`model\` ra ngoài. [4.2.2 Chọn cái gì để auto-wire từ nhiều implementation của một abstraction](#/docs/springstart-04) chạy cho ra bằng được \`NoUniqueBeanDefinitionException\`, rồi thử hai lối ra: \`@Primary\` ở Listing 4.14 và \`@Qualifier\` ở Listing 4.15.

**Bẫy.** Đánh dấu \`@Component\` lên interface \`CommentRepository\` cho đồng bộ. Tác giả nói ông thường thấy học viên bối rối chỗ này, rồi chốt: stereotype annotation chỉ dành cho class mà Spring cần tạo instance, còn thêm nó lên interface hay abstract class là vô nghĩa vì chúng không thể được khởi tạo. Bẫy thứ hai: đưa mọi đối tượng vào context, kể cả \`Comment\`. Mục 4.2.1 chặn ngay suy nghĩ đó: thêm đối tượng mà framework không cần quản lý chỉ làm tăng độ phức tạp, khiến ứng dụng vừa khó bảo trì vừa kém hiệu năng hơn — không nhận lợi ích nào từ framework thì bạn chỉ đang over-engineer.

**Tự kiểm tra.** Trong thiết kế ở mục 4.1.3, đối tượng nào không được đưa vào Spring context, và tiêu chí nào loại nó ra? Và hai lối ra của mục 4.2.2 khác nhau ở điểm nào — cái nào hợp khi các đối tượng khác nhau cần implementation khác nhau?`,
      },
      {
        id: "sh-w3-4",
        text: "Stereotype annotation gán trách nhiệm cho từng đối tượng",
        lesson: `**Mục tiêu.** Đánh dấu đúng trách nhiệm của từng component bằng \`@Service\` và \`@Repository\`, và nói được ba stereotype annotation này giống nhau ở đâu, khác nhau ở đâu.

**Đọc.** [4.3 Tập trung vào trách nhiệm của đối tượng với các stereotype annotation](#/docs/springstart-04) là mục ngắn nhất tuần — đọc một mạch rồi quay lại làm. Bắt đầu ở đoạn mở: đến giờ mọi ví dụ đều dùng \`@Component\`, nhưng trong dự án thật lập trình viên đôi khi dùng annotation khác cho cùng mục đích. Dừng lại ở hai định nghĩa trách nhiệm mà chương 4 đã dựng sẵn từ mục 4.1.3: service là đối tượng triển khai use case, repository là đối tượng quản lý việc lưu trữ bền vững dữ liệu — chưa gọi được tên trách nhiệm của một class thì đừng vội chọn annotation cho nó. Rồi đọc kỹ câu chốt: \`@Component\`, \`@Service\` và \`@Repository\` đều là stereotype annotation và đều chỉ thị Spring tạo rồi thêm một instance của class được chú thích vào context. Cuối cùng làm luôn phần thực hành nằm trong chính mục: đổi \`@Component\` trên \`CommentService\` thành \`@Service\`, đổi \`@Component\` trên \`DBCommentRepository\` thành \`@Repository\`, chạy lại và xác nhận đầu ra không đổi một chữ; đối chiếu với project "sq-ch4-ex7" đi kèm sách.

**Bẫy.** Đổi sang \`@Repository\` rồi chờ Spring bật thêm khả năng nào đó cho tầng dữ liệu. Mục này nói rõ cả ba annotation làm đúng một việc với framework — tạo instance và thêm vào context; thứ bạn nhận được khi đổi là đánh dấu tường minh trách nhiệm của đối tượng và làm nó dễ thấy hơn với bất kỳ lập trình viên nào đọc class, tức là giá trị cho người đọc code chứ không phải cho lúc chạy. Bẫy thứ hai: rải \`@Component\` khắp nơi cho khỏi phải nghĩ. Sách gọi thẳng \`@Component\` là chung chung và không cho bạn biết chi tiết gì về trách nhiệm của đối tượng đang cài đặt — trong khi trách nhiệm lại quan trọng trong thiết kế class.

**Tự kiểm tra.** Nếu đổi \`@Component\` trên \`DBCommentRepository\` thành \`@Repository\`, đầu ra của ứng dụng đổi thế nào, và vì sao? Và với một class không rơi vào hai trách nhiệm mà mục 4.3 gọi tên, bạn dùng annotation nào?`,
      },
    ],
  },
  {
    id: "sh-w4",
    week: "Tuần 4",
    title: "Bean scope, vòng đời, và AOP",
    goal: "Chọn được scope cho từng bean thay vì luôn nhận mặc định singleton, và viết xong aspect đầu tiên trong khi hiểu rõ vì sao Spring trả về proxy chứ không phải bean thật.",
    practice:
      "Đổi một bean sang prototype rồi lặp lại đúng phép so sánh sách dùng ở §5.1.1 và §5.2.1 — lấy hai tham chiếu và in `cs1 == cs2` — để thấy singleton in ra `true` còn prototype in ra `false`. Rồi viết một aspect ghi lại thời gian thực thi theo mục 6.2.1, thêm một aspect thứ hai, và dùng `@Order` để quan sát chuỗi thực thi mà mục 6.3 mô tả đổi thế nào.",
    resources: [
      { label: "Spring Start 05 — Bean scope và vòng đời", href: "#/docs/springstart-05" },
      { label: "Spring Start 06 — Sử dụng aspect với Spring AOP", href: "#/docs/springstart-06" },
    ],
    items: [
      {
        id: "sh-w4-1",
        text: "Singleton scope: cách hoạt động, tình huống thật, eager và lazy",
        lesson: `**Mục tiêu.** Nói được "singleton" trong Spring nghĩa là gì và không nghĩa là gì, tự tay chứng minh hai lần lấy bean cho cùng một tham chiếu, rồi chọn giữa khởi tạo eager và lazy.

**Đọc.** [5.1 Sử dụng singleton bean scope](#/docs/springstart-05) chỉ vài dòng dẫn nhập. [5.1.1 Singleton bean hoạt động như thế nào](#/docs/springstart-05) là gốc của cả chương: đọc chậm đoạn phân biệt singleton của Spring với singleton design pattern, bám Hình 5.1. Rồi chạy đủ hai ví dụ. Project "sq-ch5-ex1": Listing 5.1 khai \`CommentService\` bằng \`@Bean\`, Listing 5.2 lấy bean hai lần theo tên rồi in \`cs1 == cs2\`, phải ra \`true\`. Project "sq-ch5-ex2" chứng minh điều tương tự với stereotype annotation: \`CommentService\` và \`UserService\` cùng \`@Autowired\` một \`CommentRepository\`, và Listing 5.3 so sánh hai dependency Spring đã inject. [5.1.2 Singleton bean trong các tình huống thực tế](#/docs/springstart-05) đọc kỹ nhất trong ba mục con: instance dùng chung giữa nhiều thread, Hình 5.5 cùng định nghĩa race condition, rồi lý do inject qua constructor cho phép đặt field \`final\`. Khép mục bằng sidebar "Việc dùng bean quy về ba điểm". [5.1.3 Sử dụng khởi tạo eager và lazy](#/docs/springstart-05) làm thật cả hai project: "sq-ch5-ex3" in "CommentService instance created!" dù không ai dùng bean, còn "sq-ch5-ex4" thêm \`@Lazy\` thì dòng đó biến mất cho tới khi có \`getBean()\`.

**Bẫy.** Đem singleton design pattern áp thẳng vào Spring rồi kết luận mỗi kiểu chỉ có một bean. Sách dừng lại cảnh báo "Nhưng hãy cẩn thận!": context hoàn toàn có thể chứa nhiều instance cùng kiểu nếu chúng khác tên, vì với Spring singleton nghĩa là duy nhất theo tên chứ không phải duy nhất trong ứng dụng. Bẫy thứ hai: cho singleton bean một thuộc tính rồi sửa nó trong lúc xử lý. Sidebar "Việc dùng bean quy về ba điểm" chốt rằng một bean chỉ nên là singleton nếu nó bất biến; mục 5.1.2 nói thêm rằng đồng bộ hóa thread trên một instance dùng chung tuy khả thi nhưng không phải thực hành tốt và có thể ảnh hưởng nghiêm trọng đến hiệu năng.

**Tự kiểm tra.** Trong project "sq-ch5-ex3", dòng nào chứng minh Spring đã tạo bean dù \`Main\` không hề dùng tới nó? Và mục 5.1.3 nêu hai ưu điểm nào của khởi tạo eager mà lazy không có?`,
      },
      {
        id: "sh-w4-2",
        text: "Prototype scope và khi nào thật sự cần nó",
        lesson: `**Mục tiêu.** Đổi được scope của bean sang prototype, tự chứng minh mỗi lần lấy là một instance mới, và nhận ra tình huống hiếm hoi mà prototype thật sự đáng dùng.

**Đọc.** [5.2 Sử dụng prototype bean scope](#/docs/springstart-05) dẫn nhập ngắn. [5.2.1 Prototype bean hoạt động như thế nào](#/docs/springstart-05) bám hình ảnh sách dùng: singleton là hạt cà phê, prototype là cây cà phê — Spring không quản lý instance nữa mà quản lý kiểu, tạo instance mới mỗi lần có người yêu cầu. Học đúng một annotation mới, \`@Scope\`, và nhớ nó đi kèm \`@Bean\` phía trên method hoặc đi kèm stereotype annotation phía trên class. Chạy hai project: "sq-ch5-ex5" với Listing 5.4 và Listing 5.5 in ra \`false\` — chính phép so sánh bạn sẽ lặp lại ở phần thực hành tuần này; rồi "sq-ch5-ex6" với Listing 5.6, nơi hai service nhận hai instance \`CommentRepository\` khác nhau. [5.2.2 Prototype bean trong các tình huống thực tế](#/docs/springstart-05) mới là mục quyết định: theo dõi \`CommentProcessor\` đi qua bốn nấc — Listing 5.7 là một đối tượng khả biến, Listing 5.8 dùng \`new\` nên chưa cần là bean, rồi nó cần \`CommentRepository\` nên buộc phải thành bean, và Listing 5.9 lấy nó bằng \`getBean()\` ngay bên trong \`sendComment()\`. Khép lại bằng Bảng 5.1.

**Bẫy.** Khai \`CommentProcessor\` là prototype rồi \`@Autowired\` thẳng nó vào \`CommentService\`. Sách gọi đích danh đây là sai lầm đừng mắc: vì \`CommentService\` là singleton, Spring chỉ tạo và inject dependency đúng một lần lúc dựng nó, nên mọi lời gọi \`sendComment()\` dùng chung một instance và bạn quay lại đúng race condition của mục 5.1.2 — Listing 5.10 in ra cách làm sai đó để bạn tự chứng minh. Bẫy thứ hai: coi prototype là câu trả lời cho mọi đối tượng khả biến. Tác giả nói ngược lại: nhìn chung ông tránh dùng prototype và tránh các instance khả biến nói chung; trong câu chuyện của ông, prototype là công cụ để refactor dần một ứng dụng cũ chứ không phải mặc định cho thiết kế mới.

**Tự kiểm tra.** Trong Bảng 5.1, dòng nào nói về thứ mà chỉ singleton mới cấu hình được còn prototype thì không? Và ở Listing 5.9, vì sao lời gọi \`getBean()\` bắt buộc phải nằm bên trong method chứ không phải trên một field?`,
      },
      {
        id: "sh-w4-3",
        text: "Aspect hoạt động thế nào, và viết aspect đầu tiên",
        lesson: `**Mục tiêu.** Giải thích được vì sao lấy bean ra lại nhận một proxy, và viết xong aspect đầu tiên đọc được tham số cùng giá trị trả về của method bị chặn.

**Đọc.** [6.1 Cách aspect hoạt động trong Spring](#/docs/springstart-06) đọc trước khi gõ dòng code nào: chép ra bốn thuật ngữ theo đúng định nghĩa của sách — aspect là đoạn logic, advice là "khi nào", pointcut là "những method nào", target object là bean khai báo method bị chặn; còn join point trong Spring luôn là một lời gọi method. Rồi bám Hình 6.3 và Hình 6.4 cho cơ chế weaving: Spring không trả bean thật mà trả một proxy, dù bạn lấy bằng \`getBean()\` hay bằng DI. Mục 6.2 nêu kịch bản: ghi log mốc bắt đầu và kết thúc mỗi use case. [6.2.1 Triển khai một aspect đơn giản](#/docs/springstart-06) là mục đọc chậm nhất tuần — thêm dependency \`spring-aspects\`, rồi làm đủ bốn bước: \`@EnableAspectJAutoProxy\` ở Listing 6.3, class \`@Aspect\` ở Listing 6.4, advice \`@Around\` với biểu thức pointcut ở Listing 6.5, và logic thật ở Listing 6.6. Đừng học thuộc biểu thức AspectJ; hiểu Hình 6.6 tách nó thành từng phần là đủ. [6.2.2 Thay đổi các tham số của method bị chặn và giá trị trả về](#/docs/springstart-06) thêm \`getArgs()\` ở Listing 6.7, rồi Listing 6.9 đổi hẳn tham số và trả về "FAILED" trong khi method thật trả "SUCCESS".

**Bẫy.** Đánh dấu class bằng \`@Aspect\` rồi tưởng đã xong. Sách gọi đây là một sai lầm phổ biến: \`@Aspect\` không phải stereotype annotation, nó chỉ báo cho Spring biết class này định nghĩa một aspect chứ không đồng thời tạo bean — bạn vẫn phải thêm bean bằng \`@Bean\` hoặc stereotype annotation. Bẫy thứ hai: viết logic aspect mà quên gọi \`joinPoint.proceed()\`. Sách nói thẳng: nếu bạn không gọi \`proceed()\`, aspect sẽ không bao giờ ủy quyền tiếp cho method bị chặn — nó thực thi thay cho method đó, và bên gọi hoàn toàn không biết method thật chưa từng chạy.

**Tự kiểm tra.** \`proceed()\` được thiết kế để ném ra thứ gì, và điều đó buộc chữ ký method aspect khai thêm gì? Và ở Listing 6.9, \`main()\` in ra giá trị nào trong khi \`publishComment()\` thật sự trả về giá trị nào?`,
      },
      {
        id: "sh-w4-4",
        text: "Chặn method theo annotation, các advice khác, và chuỗi thực thi",
        lesson: `**Mục tiêu.** Chặn method bằng annotation tùy chỉnh thay cho biểu thức pointcut phức tạp, chọn được advice nhẹ nhất đủ dùng, và điều khiển thứ tự khi nhiều aspect cùng chặn một method.

**Đọc.** [6.2.3 Chặn các method được đánh dấu bằng annotation](#/docs/springstart-06) làm đủ hai bước: khai annotation \`@ToLog\` với \`@Retention(RetentionPolicy.RUNTIME)\` và \`@Target(ElementType.METHOD)\`, rồi đổi biểu thức pointcut thành \`@annotation(ToLog)\` như Listing 6.11. Listing 6.10 cố ý cho \`CommentService\` ba method mà chỉ đánh dấu \`deleteComment()\` — chạy project "sq-ch6-ex4" và soi console để tự xác nhận aspect bỏ qua hai method còn lại. [6.2.4 Các advice annotation khác bạn có thể dùng](#/docs/springstart-06) đọc như một bảng tra bốn dòng: \`@Before\`, \`@AfterReturning\`, \`@AfterThrowing\`, \`@After\`. Ghi lại đúng khác biệt của từng dòng khi method bị chặn ném exception, và nhớ rằng các advice này không nhận \`ProceedingJoinPoint\` nên không tự quyết định lúc nào ủy quyền. Xem ví dụ \`@AfterReturning\` cùng thuộc tính \`returning\` trong "sq-ch6-ex5". [6.3 Chuỗi thực thi aspect](#/docs/springstart-06) dựng hai aspect cùng chặn \`publishComment()\`: chạy "sq-ch6-ex6" khi chưa có \`@Order\`, rồi "sq-ch6-ex7" sau khi đặt \`@Order(1)\` cho \`SecurityAspect\` và \`@Order(2)\` cho \`LoggingAspect\`, và đối chiếu hai khối log với Hình 6.15 và Hình 6.16.

**Bẫy.** Viết xong annotation tùy chỉnh mà aspect chẳng chặn gì cả. Mục 6.2.3 chỉ ra nguyên nhân trước cả khi bạn kịp gặp: mặc định trong Java annotation không thể bị chặn lúc runtime, nên việc khai tường minh \`@Retention(RetentionPolicy.RUNTIME)\` là rất quan trọng. Bẫy thứ hai: có hai aspect rồi suy ra thứ tự từ một lần chạy thấy log ra như ý. Mục 6.3 nói thẳng rằng mặc định Spring không đảm bảo thứ tự mà hai aspect trong cùng một chuỗi thực thi được gọi — và ngay cả khi đã dùng \`@Order\`, nếu hai giá trị giống nhau thì thứ tự lại không được xác định; số càng nhỏ thì aspect càng thực thi sớm.

**Tự kiểm tra.** Trong bốn advice của mục 6.2.4, cái nào không được gọi khi method bị chặn ném exception, và cái nào vẫn được gọi? Và khi \`SecurityAspect\` mang \`@Order(1)\`, dòng log nào xuất hiện đầu tiên trên console và dòng nào cuối cùng?`,
      },
    ],
  },
];
