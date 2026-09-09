// Lộ trình đọc Java Persistence with Spring Data and Hibernate — Phần 1 (Tuần 1–7).
//
// Nguồn: bản dịch tiếng Việt "Java Persistence with Spring Data and Hibernate"
// (Cătălin Tudose — Manning).
// Thư mục nguồn: sources/jpa/ — đủ 20 chương, không thiếu chương nào.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jp-w<N> / jp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jpaWeeksPart1 = [
  {
    id: "jp-w1",
    week: "Tuần 1",
    title: "Vì sao cần ORM, và ba cách gõ dòng đầu tiên",
    goal: "Phát biểu được paradigm mismatch qua năm vấn đề cụ thể mà chương 1 nêu tên, và dựng được cùng một ví dụ lưu-rồi-đọc bằng cả ba cách sách trình bày.",
    practice: "Dựng cùng một schema \"Hello World\" bằng ba cách sách trình bày — JPA thuần với persistence unit, cấu hình native của Hibernate, và Spring Data JPA. Giữ cả ba trong một dự án, rồi viết ra bằng lời của bạn: mỗi cách bắt bạn khai những gì, và cách nào giấu đi cái gì.",
    resources: [
      { label: "JPA 01 — Tìm hiểu về object/relational persistence", href: "#/docs/jpa-01" },
      { label: "JPA 02 — Bắt đầu một dự án", href: "#/docs/jpa-02" },
    ],
    items: [
      {
        id: "jp-w1-1",
        text: "Persistence, SQL và JDBC trong ứng dụng Java",
        lesson: `**Mục tiêu.** Giải thích được vì sao ứng dụng cần persistence, phân biệt bốn vai trò của SQL (DDL/DML/DQL/DCL), và biết khi nào nên đi thẳng vào JDBC/\`ResultSet\` thay vì dựng domain model.

**Đọc.** [Persistence là gì?](#/docs/jpa-01) mở đầu chương, đọc kỹ để nắm định nghĩa object persistence và vì sao SQL database vẫn là lựa chọn mặc định. [Relational database](#/docs/jpa-01) đọc lướt, chỉ cần nắm khái niệm data independence. [Hiểu về SQL](#/docs/jpa-01) đọc chậm bốn vai trò DDL/DML/DQL/DCL — đây là từ vựng dùng lại suốt sách. [Sử dụng SQL trong Java](#/docs/jpa-01) đọc kỹ đoạn so sánh làm việc trực tiếp với \`ResultSet\` và làm việc qua domain model, cùng đoạn cảnh báo ở cuối mục.

**Bẫy.** Nghĩ rằng mọi ứng dụng Java nghiêm túc đều nên dựng domain model và dùng ORM. Chương 1 dành hẳn "một lời cảnh báo" ở cuối mục Sử dụng SQL trong Java: không phải mọi ứng dụng đều nên thiết kế theo domain model — ứng dụng đơn giản, hoặc các tác vụ báo cáo và sửa dữ liệu hàng loạt, có thể tốt hơn khi dùng thẳng \`ResultSet\` và JDBC \`RowSet\`. Bẫy thứ hai: nghĩ rằng công nghệ quan hệ luôn là câu trả lời đúng cho mọi bài toán lưu trữ. Sách nói rõ "chúng tôi không khẳng định công nghệ quan hệ luôn là giải pháp tốt nhất" — các hệ phân tán quy mô internet chấp nhận weak consistency và thường không cần một SQL database giao dịch tuân thủ ACID.

**Tự kiểm tra.** SQL đóng bốn vai trò gì trong một ứng dụng (DDL, DML, DQL, DCL), và mỗi vai trò dùng để làm gì? Theo chương 1, khi nào bạn nên bỏ qua domain model và làm việc trực tiếp với \`ResultSet\`/JDBC?`,
      },
      {
        id: "jp-w1-2",
        text: "Năm mặt của paradigm mismatch, và ORM trả lời chúng thế nào",
        lesson: `**Mục tiêu.** Kể tên và giải thích được năm vấn đề của paradigm mismatch (granularity, inheritance, identity, association, data navigation), và tóm tắt được ORM/JPA/Hibernate/Spring Data giải quyết bài toán này ở tầng nào.

**Đọc.** [Vấn đề về granularity](#/docs/jpa-01) đọc kỹ — đây là vấn đề dễ hình dung nhất: một \`Address\` mịn hơn \`User\`, nhưng SQL chỉ có hai mức granularity. [Vấn đề về inheritance](#/docs/jpa-01) đọc kỹ, chú ý vì sao SQL DBMS không hiện thực table inheritance theo một cú pháp chuẩn. [Vấn đề về identity](#/docs/jpa-01) đọc chậm nhất trong năm mục, và ghi lại ba khái niệm: instance identity, instance equality, database identity. [Vấn đề về association](#/docs/jpa-01) đọc lướt, chỉ cần nắm vì sao association nhiều-nhiều cần một link table không có mặt trong domain model. [Vấn đề về data navigation](#/docs/jpa-01) đọc kỹ đoạn về lazy loading và vấn đề n+1 selects. [ORM, JPA, Hibernate và Spring Data](#/docs/jpa-01) đọc kỹ — đây là bản đồ thuật ngữ cho toàn bộ sách: JPA quy định cái gì, Hibernate quyết định làm thế nào, Spring Data JPA nằm trên cả hai.

**Bẫy.** Coi \`equals()\`/\`==\` của Java và phép so sánh primary key trong database là một. Mục Vấn đề về identity phân biệt rõ ba khái niệm: instance identity (\`==\`), instance equality (\`equals()\`), và database identity (so sánh giá trị primary key) — cả \`equals()\` lẫn \`==\` đều không phải lúc nào cũng tương đương với so sánh primary key, và nhiều instance Java không đồng nhất có thể cùng lúc biểu diễn một dòng dữ liệu. Đây chính là gốc của bẫy \`equals\`/\`hashCode\` mà tuần 8 sẽ gặp lại. Bẫy thứ hai: đi dạo trên mạng lưới object (\`someUser.getBillingDetails().iterator().next()\`) như thể đó là cách truy cập dữ liệu hiệu quả trong SQL database. Mục Vấn đề về data navigation gọi thẳng tên bẫy này: n+1 selects — nạp một \`User\` cần một \`select\`, rồi nạp lần lượt n \`BillingDetails\` liên quan cần thêm n \`select\` nữa nếu nạp kiểu lazy không kiểm soát.

**Tự kiểm tra.** Năm vấn đề của paradigm mismatch mà chương 1 nêu tên là gì? Ba cách hiểu về "giống nhau" giữa hai instance mà sách phân biệt là gì, và vì sao không cách nào trong số đó luôn tương đương với so sánh primary key?`,
      },
      {
        id: "jp-w1-3",
        text: "\"Hello World\" với JPA, và cấu hình native của Hibernate",
        lesson: `**Mục tiêu.** Dựng và chạy được ví dụ lưu-rồi-đọc một \`Message\` bằng JPA thuần trên một persistence unit, và biết cấu hình native Hibernate khác gì so với JPA.

**Đọc.** [Giới thiệu Hibernate](#/docs/jpa-02) đọc lướt, chỉ cần nhớ tên các dự án trong bộ Hibernate (ORM, EntityManager, Validator, Envers, Search, OGM, Reactive) để không nhầm module. [Giới thiệu Spring Data](#/docs/jpa-02) đọc lướt tương tự, nhớ tên các module Spring Data (Commons, JPA, JDBC, REST, MongoDB, Redis). ["Hello World" với JPA](#/docs/jpa-02) cùng ba mục con — Cấu hình một persistence unit, Viết một persistent class, Lưu và nạp message — đọc kỹ và gõ lại toàn bộ, đây là ví dụ nền cho mọi chương sau. [Cấu hình native của Hibernate](#/docs/jpa-02) đọc kỹ đoạn mở đầu trước khi đọc code, vì sách tự nói rõ khi nào mục này KHÔNG cần thiết.

**Bẫy.** Nghĩ rằng gọi \`em.persist(message)\` là dữ liệu đã xuống database ngay lập tức. Listing "Lưu và nạp message" chú thích rõ: Hibernate biết bạn muốn lưu dữ liệu đó, nhưng "không nhất thiết gọi tới cơ sở dữ liệu ngay lập tức" — câu lệnh \`INSERT\` chỉ chắc chắn được sinh khi transaction commit. Bẫy thứ hai: nhảy thẳng vào cấu hình native Hibernate (\`hibernate.cfg.xml\`, \`SessionFactory\`, \`Session\`) vì nghĩ nó cần thiết để "dùng đúng cách". Ngay đầu mục Cấu hình native của Hibernate, sách nói thẳng: hầu hết ứng dụng, kể cả những ứng dụng khá phức tạp, không cần các tùy chọn cấu hình đặc biệt này — nếu chưa chắc chắn, hãy bỏ qua mục này và quay lại sau khi thực sự cần mở rộng type adapter hay hàm SQL tùy chỉnh.

**Tự kiểm tra.** Trong ví dụ "Hello World" với JPA, câu lệnh SQL \`INSERT\` được Hibernate thực thi ở bước nào — lúc gọi \`persist()\` hay lúc commit transaction? File cấu hình chuẩn cho một persistence unit tên là gì và nằm ở đâu trên classpath?`,
      },
      {
        id: "jp-w1-4",
        text: "Chuyển đổi JPA ↔ Hibernate, Spring Data JPA, và so ba cách",
        lesson: `**Mục tiêu.** Chuyển đổi qua lại được giữa \`EntityManagerFactory\` và \`SessionFactory\`, dựng lại cùng ví dụ "Hello World" bằng Spring Data JPA, và nói được ba cách tiếp cận khác nhau ở đâu.

**Đọc.** [Chuyển đổi giữa JPA và Hibernate](#/docs/jpa-02) đọc kỹ cả hai chiều: unwrap \`SessionFactory\` từ \`EntityManagerFactory\`, và dựng \`EntityManagerFactory\` từ một \`Configuration\` Hibernate. ["Hello World" với Spring Data JPA](#/docs/jpa-02) đọc kỹ và gõ lại, chú ý \`SpringDataConfiguration\` khai những bean nào (data source, transaction manager, JPA vendor adapter, entity manager factory) và \`MessageRepository\` ngắn tới mức nào. [So sánh các cách tiếp cận lưu trữ entity](#/docs/jpa-02) đọc kỹ bảng so sánh và phần phân tích thời gian chạy ngay sau đó.

**Bẫy.** Nghĩ rằng chọn JPA thuần nghĩa là mất quyền truy cập các tính năng riêng của Hibernate. Mục Chuyển đổi giữa JPA và Hibernate chỉ ra bạn có thể \`unwrap()\` một \`EntityManagerFactory\`/\`EntityManager\` để lấy ra \`SessionFactory\`/\`Session\` bất cứ lúc nào cần một tính năng chỉ Hibernate mới có — không cần viết lại toàn bộ ứng dụng bằng API native. Bẫy thứ hai: coi Spring Data JPA là lựa chọn "miễn phí" vì viết ít mã hơn. Bảng đo thời gian thực thi ở mục So sánh các cách tiếp cận cho thấy Spring Data JPA chậm hơn Hibernate/JPA đáng kể khi số bản ghi tăng — với insert, chậm hơn khoảng 2 lần ở 1.000 bản ghi và tăng lên khoảng 3,5 lần ở 50.000 bản ghi; update, select, delete cũng theo xu hướng tương tự.

**Tự kiểm tra.** Bạn cần đổi những gì trong mã để lấy một \`SessionFactory\` từ một \`EntityManagerFactory\` đã có? Theo bảng so sánh cuối chương 2, cách tiếp cận nào đòi hỏi ít mã nhất, và đánh đổi của nó là gì?`,
      },
    ],
  },
  {
    id: "jp-w2",
    week: "Tuần 2",
    title: "Domain model, metadata, và repository đầu tiên",
    goal: "Dựng được một domain model POJO có khả năng persistence với metadata khai bằng annotation, rồi lấy dữ liệu ra khỏi nó bằng năm cách khác nhau của Spring Data JPA.",
    practice: "Dựng domain model CaveatEmptor theo chương 3, bật \`spring.jpa.show-sql\` và đọc DDL Hibernate sinh ra — đối chiếu từng cột với annotation bạn đã khai. Rồi viết 5 query method Spring Data với tên method khác nhau và đối chiếu SQL mà từng cái sinh ra.",
    resources: [
      { label: "JPA 03 — Domain model và metadata", href: "#/docs/jpa-03" },
      { label: "JPA 04 — Làm việc với Spring Data JPA", href: "#/docs/jpa-04" },
    ],
    items: [
      {
        id: "jp-w2-1",
        text: "CaveatEmptor: kiến trúc phân tầng và hiện thực domain model",
        lesson: `**Mục tiêu.** Vẽ lại được domain model CaveatEmptor ở mức kiến trúc phân tầng, và viết được một persistent class POJO có association hai chiều đúng cách mà không rò rỉ mối quan tâm persistence.

**Đọc.** [Ứng dụng ví dụ CaveatEmptor](#/docs/jpa-03) cùng ba mục con — Kiến trúc phân tầng, Phân tích miền nghiệp vụ, Domain model CaveatEmptor — đọc kỹ, đây là ứng dụng ví dụ dùng xuyên suốt phần còn lại của sách. [Hiện thực domain model](#/docs/jpa-03) cùng bốn mục con — Xử lý rò rỉ mối quan tâm, Persistence trong suốt và tự động, Viết các class có khả năng persistence, Hiện thực association trong POJO — đọc kỹ toàn bộ, và gõ lại ví dụ phương thức tiện ích \`addBid()\`.

**Bẫy.** Nghĩ rằng JPA tự quản lý cả hai phía của một association hai chiều. Mục Hiện thực association trong POJO nói thẳng: "JPA không quản lý các persistent association" — nếu bạn muốn liên kết một \`Bid\` với một \`Item\`, bạn phải tự thêm \`Bid\` vào collection \`bids\` của \`Item\` VÀ tự gán \`item\` cho \`Bid\`; bỏ sót một trong hai bước để lại trạng thái không nhất quán. Bẫy thứ hai: gọi lại setter của toàn bộ một collection (ví dụ \`item.setBids(bids)\`) hai lần với cùng một reference và nghĩ điều đó vô hại. Mục Viết các class có khả năng persistence cảnh báo riêng về dirty checking với collection: vì Hibernate bọc collection trong các hiện thực riêng như \`PersistentSet\`, việc gọi lại setter như vậy vẫn có thể sinh ra một câu lệnh \`UPDATE\` không cần thiết.

**Tự kiểm tra.** Khi liên kết một \`Bid\` với một \`Item\` bằng tay, bạn phải thực hiện đúng những bước nào để cả hai phía của association đều nhất quán? Vì sao mục Xử lý rò rỉ mối quan tâm khuyến nghị domain model không nên gọi cơ sở dữ liệu trực tiếp hay qua một tầng trung gian nào?`,
      },
      {
        id: "jp-w2-2",
        text: "Metadata: annotation, constraint, XML và đọc lúc chạy",
        lesson: `**Mục tiêu.** Gắn annotation JPA và Bean Validation đúng vị trí (field hay getter) cho một entity, và biết chọn giữa annotation, XML descriptor và metamodel động/tĩnh khi cần đọc metadata lúc chạy.

**Đọc.** [Metadata dựa trên annotation](#/docs/jpa-03) đọc kỹ, chú ý quy ước đặt tên package cho annotation của Hibernate (\`org.hibernate.annotations\`) và nơi đặt metadata toàn cục (\`package-info.java\`). [Áp dụng constraint cho object Java](#/docs/jpa-03) đọc kỹ — đây là phần Bean Validation, chú ý vị trí hợp lệ để gắn annotation kiểm định. [Đưa metadata ra ngoài bằng file XML](#/docs/jpa-03) đọc lướt, chỉ cần nắm khi nào \`<xml-mapping-metadata-complete>\` bỏ qua toàn bộ annotation và khi nào XML chỉ ghi đè từng property. [Truy cập metadata lúc chạy](#/docs/jpa-03) đọc kỹ cả hai phần — Metamodel API động và static metamodel — và so sánh sự khác biệt về tính an toàn kiểu giữa hai cách.

**Bẫy.** Gắn annotation kiểm định của Bean Validation lên setter. Mục Áp dụng constraint cho object Java nói rõ: nếu bạn dùng phương thức truy cập, hãy gắn constraint lên getter, không phải setter — "annotation trên setter không được hỗ trợ". Bẫy thứ hai: tin rằng gọi \`itemType.getSingularAttribute("name")\` bằng chuỗi là an toàn khi refactor. Mục Truy cập metadata lúc chạy cảnh báo dynamic Metamodel API không an toàn về kiểu: đổi tên property mà quên sửa chuỗi, mã vẫn biên dịch được nhưng hỏng lúc chạy — đó là lý do sách giới thiệu static metamodel (class \`Item_\` được sinh tự động) như cách an toàn hơn.

**Tự kiểm tra.** Bạn nên gắn annotation kiểm định lên field, getter hay setter khi dùng phương thức truy cập, và vì sao? Khác biệt cốt lõi giữa Metamodel API động và static metamodel là gì, xét về tính an toàn kiểu lúc biên dịch?`,
      },
      {
        id: "jp-w2-3",
        text: "Dựng repository, query method, phân trang và streaming",
        lesson: `**Mục tiêu.** Dựng được một Spring Boot project dùng Spring Data JPA, viết query method bằng quy ước đặt tên, và dùng được phân trang/sắp xếp/streaming trên kết quả truy vấn.

**Đọc.** [Giới thiệu Spring Data JPA](#/docs/jpa-04) đọc lướt, chỉ cần nắm Spring Data JPA nằm trên Spring Data Commons và một JPA provider. [Bắt đầu một dự án Spring Data JPA mới](#/docs/jpa-04) đọc kỹ và dựng lại project bằng Spring Initializr, chú ý các dependency \`spring-boot-starter-data-jpa\` và driver MySQL. [Những bước đầu tiên để cấu hình một dự án Spring Data JPA mới](#/docs/jpa-04) đọc kỹ, gõ lại entity \`User\`, \`UserRepository extends CrudRepository\`, và file \`application.properties\`. [Định nghĩa query method với Spring Data JPA](#/docs/jpa-04) đọc chậm nhất trong mục này, đối chiếu bảng từ khóa (\`Is\`, \`And\`, \`Or\`, \`Between\`, \`OrderBy\`, \`Like\`...) với JPQL nó sinh ra. [Giới hạn kết quả truy vấn, sắp xếp và phân trang](#/docs/jpa-04) đọc kỹ, phân biệt \`Pageable\`/\`PageRequest\` với \`Sort\`. [Streaming kết quả](#/docs/jpa-04) đọc kỹ, chú ý \`Streamable\` khác \`Iterable\`/\`List\` thông thường ở điểm nào.

**Bẫy.** Đặt sai tên query method rồi cho rằng lỗi sẽ hiện ngay lúc biên dịch. Mục Định nghĩa query method nói rõ: nếu tên phương thức sai — chẳng hạn property của entity không khớp — bạn chỉ nhận lỗi khi application context được nạp, không phải lúc biên dịch. Bẫy thứ hai: lấy kết quả dạng \`Stream\`/\`Streamable\` từ repository rồi không đóng nó. Mục Streaming kết quả cảnh báo: nếu không đưa stream vào khối try-with-resources hoặc gọi \`close()\` tường minh, "stream sẽ giữ kết nối bên dưới tới cơ sở dữ liệu".

**Tự kiểm tra.** Nếu bạn đặt sai tên một query method (property không khớp entity), lỗi sẽ xuất hiện ở thời điểm nào — biên dịch, nạp application context, hay lúc gọi phương thức? Vì sao phải đóng một kết quả kiểu \`Stream\` lấy từ repository?`,
      },
      {
        id: "jp-w2-4",
        text: "@Query, projection, truy vấn sửa đổi và Query by Example",
        lesson: `**Mục tiêu.** Viết được truy vấn tùy chỉnh bằng \`@Query\`, tạo projection dựa trên interface, viết một modifying query, và dựng một truy vấn Query by Example đúng cách với property nguyên thủy.

**Đọc.** [Annotation @Query](#/docs/jpa-04) đọc kỹ, chú ý tham số theo tên với \`@Param\`, cờ \`nativeQuery\`, và biến \`entityName\` trong SpEL. [Projection](#/docs/jpa-04) đọc kỹ, phân biệt closed projection (chỉ có getter khớp property) và open projection (dùng \`@Value\` với SpEL). [Truy vấn sửa đổi (modifying query)](#/docs/jpa-04) đọc kỹ, phân biệt \`deleteByLevel\` (sinh từ tên phương thức, chạy callback vòng đời cho từng instance) với \`deleteBulkByLevel\` (một câu \`delete\` JPQL duy nhất, không chạy callback). [Query by Example](#/docs/jpa-04) đọc kỹ toàn mục, đặc biệt đoạn so sánh SQL sinh ra khi có và không có \`withIgnorePaths\`.

**Bẫy.** Tin rằng vì query method sinh từ tên đã được kiểm tra lúc nạp context, thì \`@Query\` cũng vậy. Ngay cuối mục Annotation @Query, sách nói rõ: nếu truy vấn viết trong \`@Query\` bị sai, lỗi chỉ xuất hiện lúc chạy khi phương thức đó được gọi — "các phương thức có @Query linh hoạt hơn nhưng cũng kém an toàn hơn" so với quy ước đặt tên. Bẫy thứ hai: dựng một probe Query by Example từ một entity có field kiểu nguyên thủy (\`int\`, \`boolean\`) mà quên gọi \`withIgnorePaths\` cho chúng. Mục Query by Example chỉ ra: matcher chỉ tự bỏ qua các property mang giá trị \`null\`; property nguyên thủy như \`level\` hay \`active\` sẽ mang giá trị mặc định (0, \`false\`) và bị đưa thẳng vào điều kiện \`WHERE\`, làm sai lệch hẳn kết quả truy vấn — sách minh họa bằng hai câu SQL sinh ra khác nhau.

**Tự kiểm tra.** Sự khác biệt về thời điểm phát hiện lỗi giữa một query method sinh từ tên và một phương thức dùng \`@Query\` là gì? Vì sao bạn phải gọi \`withIgnorePaths\` cho các property kiểu \`int\`/\`boolean\` khi dựng probe cho Query by Example?`,
      },
    ],
  },
];
