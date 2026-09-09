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

**Đọc.** [Giới thiệu Hibernate](#/docs/jpa-02) đọc lướt, chỉ cần nhớ tên các dự án trong bộ Hibernate (ORM, EntityManager, Validator, Envers, Search, OGM, Reactive) để không nhầm module. [Giới thiệu Spring Data](#/docs/jpa-02) đọc lướt tương tự, nhớ tên các module Spring Data (Commons, JPA, JDBC, REST, MongoDB, Redis). [Cấu hình một persistence unit](#/docs/jpa-02) đọc kỹ và gõ lại. [Viết một persistent class](#/docs/jpa-02) đọc kỹ và gõ lại. [Lưu và nạp message](#/docs/jpa-02) đọc kỹ và gõ lại toàn bộ, đây là ví dụ nền cho mọi chương sau. [Cấu hình native của Hibernate](#/docs/jpa-02) đọc kỹ đoạn mở đầu trước khi đọc code, vì sách tự nói rõ khi nào mục này KHÔNG cần thiết.

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

**Đọc.** [Giới thiệu Spring Data JPA](#/docs/jpa-04) đọc lướt, chỉ cần nắm Spring Data JPA nằm trên Spring Data Commons và một JPA provider. [Bắt đầu một dự án Spring Data JPA mới](#/docs/jpa-04) đọc kỹ và dựng lại project bằng Spring Initializr, chú ý các dependency \`spring-boot-starter-data-jpa\` và driver MySQL. [Những bước đầu tiên để cấu hình một dự án Spring Data JPA](#/docs/jpa-04) đọc kỹ, gõ lại entity \`User\`, \`UserRepository extends CrudRepository\`, và file \`application.properties\`. [Định nghĩa query method với Spring Data JPA](#/docs/jpa-04) đọc chậm nhất trong mục này, đối chiếu bảng từ khóa (\`Is\`, \`And\`, \`Or\`, \`Between\`, \`OrderBy\`, \`Like\`...) với JPQL nó sinh ra. [Giới hạn kết quả truy vấn, sắp xếp và phân trang](#/docs/jpa-04) đọc kỹ, phân biệt \`Pageable\`/\`PageRequest\` với \`Sort\`. [Streaming kết quả](#/docs/jpa-04) đọc kỹ, chú ý \`Streamable\` khác \`Iterable\`/\`List\` thông thường ở điểm nào.

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
  {
    id: "jp-w3",
    week: "Tuần 3",
    title: "Entity, value type và identity",
    goal: "Nhìn một khái niệm trong domain model là quyết định được nó nên là entity hay value type, và chọn được chiến lược sinh định danh phù hợp với cách ứng dụng ghi dữ liệu.",
    practice: "Ánh xạ một entity với ba chiến lược sinh id khác nhau (IDENTITY, SEQUENCE, TABLE — dùng đúng tên chương 5 gọi). Insert 100 bản ghi bằng mỗi kiểu, bật SQL log và đếm số round-trip tới database; giải thích chênh lệch bằng cơ chế chương mô tả.",
    resources: [
      { label: "JPA 05 — Ánh xạ các persistent class", href: "#/docs/jpa-05" },
    ],
    items: [
      {
        id: "jp-w3-1",
        text: "Domain model mịn, và ranh giới entity với value type",
        lesson: `**Mục tiêu.** Nhìn một class trong domain model là quyết định được nó nên là entity hay value type, dựa trên ba câu hỏi mà chương 5 đặt ra: shared reference, vòng đời và identity.

**Đọc.** [Hiểu về entity và value type](#/docs/jpa-05) mở mục bằng câu hỏi vì sao một số class trong domain model "quan trọng" hơn số khác — đọc lướt để nắm bối cảnh. [Domain model mịn](#/docs/jpa-05) đọc kỹ, đây là khái niệm nền: mịn (fine-grained) nghĩa là có nhiều class hơn số table, và ví dụ \`Address\` tách khỏi ba cột chuỗi trên \`User\` minh họa rõ điều đó. [Định nghĩa các khái niệm của ứng dụng](#/docs/jpa-05) đọc chậm ví dụ John và Jane dùng chung một \`Address\`, đây là phép thử cốt lõi: nếu một instance cần hỗ trợ tham chiếu dùng chung lúc chạy thì nó là entity, nếu không thì là value type. [Phân biệt entity và value type](#/docs/jpa-05) đọc kỹ toàn bộ, đặc biệt ví dụ \`Bid\` — class này minh họa trực tiếp quy tắc chọn mặc định.

**Bẫy.** Thấy composition trong sơ đồ UML (hình thoi đặc) giữa \`Item\` và \`Bid\` rồi kết luận ngay \`Bid\` phải là entity. Mục Phân biệt entity và value type đi qua đúng tình huống này và kết luận ngược lại: "\`Bid\` là một value type vì identity của nó được định nghĩa bởi \`Item\` và \`User\`" — composition chỉ gợi ý phụ thuộc vòng đời, không tự động đòi hỏi identity riêng. Sách nói thẳng nguyên tắc chung: "phản ứng đầu tiên của bạn nên là biến mọi thứ thành class kiểu value type và chỉ nâng cấp nó thành entity khi thực sự cần thiết" — \`Bid\` chỉ cần trở thành entity nếu một mở rộng tương lai đòi một association hai chiều \`User#bids\`. Bẫy thứ hai: viết POJO cho một value type mà không khóa quyền tham chiếu dùng chung. Chương liệt kê ba điều phải làm khi hiện thực POJO — tránh shared reference (chỉ một \`User\` được tham chiếu tới một \`Address\`, bằng cách làm \`Address\` bất biến và không có setter \`setUser()\` public), phụ thuộc vòng đời (cascade khi entity sở hữu bị xóa), và identity (value type không cần property định danh).

**Tự kiểm tra.** Phép thử nào chương 5 dùng để phân biệt một class nên là entity hay value type — dựa trên hình 5.2 và 5.3 với \`User\`/\`Address\`? Vì sao \`Bid\` được sách xếp là value type dù nó tham gia một quan hệ composition trong sơ đồ UML, và điều gì sẽ khiến nó phải trở thành entity?`,
      },
      {
        id: "jp-w3-2",
        text: "Identity, equality và ánh xạ entity đầu tiên",
        lesson: `**Mục tiêu.** Phân biệt được ba khái niệm object identity, object equality và database identity, và viết được một entity class tối thiểu với \`@Id\`/\`@GeneratedValue\` đúng quy ước.

**Đọc.** [Ánh xạ entity với identity](#/docs/jpa-05) đọc lướt phần mở đầu để nắm lộ trình mục 5.2. [Hiểu về identity và equality trong Java](#/docs/jpa-05) đọc chậm, ghi lại đúng ba khái niệm: object identity (\`==\`), object equality (\`equals()\`), database identity (so sánh table và giá trị primary key). [Entity class và ánh xạ đầu tiên](#/docs/jpa-05) đọc kỹ và gõ lại listing \`Item\` với \`@Entity\`/\`@Id\`/\`@GeneratedValue\`, chú ý đoạn giải thích vì sao Hibernate hay Spring Data JPA dùng Hibernate truy cập field thay vì getter/setter khi \`@Id\` nằm trên field.

**Bẫy.** Phơi bày một setter public cho property định danh vì nghĩ điều đó vô hại như mọi property khác. Mục Entity class và ánh xạ đầu tiên nói rõ: giá trị primary key không bao giờ thay đổi, Hibernate và Spring Data JPA dùng Hibernate làm provider sẽ không cập nhật cột primary key, "bạn không nên phơi bày phương thức setter public cho định danh trên một entity". Bẫy thứ hai: coi \`equals()\` hoặc \`==\` là đủ để biết hai object có "cùng một dòng dữ liệu" hay không. Mục Hiểu về identity và equality trong Java nhắc lại: hai instance không đồng nhất (\`a != b\`) vẫn có thể biểu diễn cùng một dòng trong cơ sở dữ liệu — database identity là một khái niệm thứ ba, tách biệt với cả \`==\` lẫn \`equals()\`.

**Tự kiểm tra.** Ba khái niệm object identity, object equality và database identity khác nhau ở đâu, và mỗi khái niệm được kiểm tra bằng cách nào trong mã Java? Vì sao một entity class không nên có setter public cho property \`id\`?`,
      },
      {
        id: "jp-w3-3",
        text: "Chọn primary key và cấu hình key generator",
        lesson: `**Mục tiêu.** Chọn được surrogate key thay vì natural key cho một table mới, và cấu hình đúng một named identifier generator bằng ba chiến lược \`IDENTITY\`, \`SEQUENCE\`, \`TABLE\`.

**Đọc.** [Chọn primary key](#/docs/jpa-05) đọc kỹ, đặc biệt ba yêu cầu của một candidate key (không null, duy nhất, bất biến) và lý do chương khuyến nghị mạnh surrogate key thay vì natural key hay composite natural key. [Cấu hình key generator](#/docs/jpa-05) đọc kỹ và gõ lại listing \`@GeneratedValue\` cùng bốn giá trị \`GenerationType\` (\`AUTO\`, \`SEQUENCE\`, \`IDENTITY\`, \`TABLE\`), rồi đọc phần dùng \`@GenericGenerator\` với \`enhanced-sequence\` — đây là cấu hình sách khuyến nghị. [Các chiến lược sinh định danh](#/docs/jpa-05) đọc chậm toàn bộ danh sách chiến lược của Hibernate (\`native\`, \`sequence\`, \`enhanced-sequence\`, \`enhanced-table\`, \`identity\`, \`increment\`, \`select\`, \`uuid2\`, \`guid\`) và hộp giải thích khác biệt sinh định danh trước-insert với sau-insert.

**Bẫy.** Chọn một natural key (như Social Security Number) làm primary key vì nó có sẵn trong dữ liệu nghiệp vụ. Mục Chọn primary key cảnh báo natural primary key "thường gây rắc rối về sau" — ít thuộc tính thỏa đồng thời ba yêu cầu duy nhất/bất biến/không null, và natural key hợp thành (composite) làm việc bảo trì, truy vấn tùy ứng và tiến hóa schema khó hơn nhiều; sách "mạnh mẽ khuyến nghị" thêm synthetic/surrogate key thay vào đó. Bẫy thứ hai: gọi \`someItem.getId()\` ngay sau khi \`persist()\` và mong luôn có giá trị. Hộp "Sinh định danh trước hay sau INSERT" giải thích: với các chiến lược sinh sau-insert (như cột auto-increment), lời gọi \`persist()\` chỉ xếp hàng thao tác chèn, và \`getId()\` gọi ngay sau đó có thể trả về \`null\` — sách vì vậy ưa các chiến lược sinh trước-insert như \`enhanced-sequence\`.

**Tự kiểm tra.** Ba yêu cầu của một candidate key là gì, và vì sao chương 5 khuyến nghị dùng surrogate key thay vì natural key? Khác biệt giữa chiến lược sinh định danh trước-insert và sau-insert là gì, và vì sao nó ảnh hưởng tới việc gọi \`getId()\` ngay sau \`persist()\`?`,
      },
      {
        id: "jp-w3-4",
        text: "Điều khiển tên, SQL động, entity bất biến và subselect",
        lesson: `**Mục tiêu.** Ghi đè được tên table/property truy vấn khi cần, bật insert/update động cho một entity nhiều cột, đánh dấu một entity bất biến, và ánh xạ một view chỉ-đọc bằng subselect.

**Đọc.** [Điều khiển tên](#/docs/jpa-05) đọc kỹ, chú ý \`@Table(name = ...)\` cho trường hợp \`User\` xung đột với từ khóa dành riêng \`USER\`, và phần đặt tên entity cho truy vấn (\`@Entity(name = "AuctionItem")\`) khi có hai class \`Item\` trùng tên ở hai package. [Sinh SQL động](#/docs/jpa-05) đọc kỹ, nắm vì sao Hibernate mặc định sinh sẵn câu lệnh CRUD lúc khởi động persistence unit, và khi nào nên chuyển sang \`@DynamicInsert\`/\`@DynamicUpdate\`. [Làm cho một entity bất biến](#/docs/jpa-05) đọc kỹ, gõ lại ví dụ \`@org.hibernate.annotations.Immutable\` trên \`Bid\`. [Ánh xạ một entity tới subselect](#/docs/jpa-05) đọc kỹ toàn bộ listing \`ItemBidSummary\`, đặc biệt vai trò của \`@Subselect\` và \`@Synchronize\`.

**Bẫy.** Nghĩ rằng câu lệnh \`UPDATE\` mặc định của Hibernate chỉ chứa những cột thực sự thay đổi. Mục Sinh SQL động giải thích ngược lại: vì câu lệnh được sinh lúc khởi động khi chưa biết cột nào sẽ đổi, \`UPDATE\` mặc định cập nhật tất cả cột — cột không đổi chỉ đơn giản được đặt lại giá trị cũ; chỉ khi bật \`@DynamicUpdate\` thì Hibernate mới sinh SQL lúc chạy và chỉ liệt kê cột có giá trị thay đổi. Bẫy thứ hai: ánh xạ một entity chỉ-đọc bằng \`@Subselect\` mà quên khai \`@Synchronize\`. Mục Ánh xạ một entity tới subselect nói rõ: vì \`ItemBidSummary\` không có \`@Table\`, framework "không biết khi nào phải auto-flush trước khi thực thi truy vấn" — thiếu \`@Synchronize({"ITEM", "BID"})\`, một truy vấn trên \`ItemBidSummary\` có thể đọc phải dữ liệu cũ (stale) nếu có thay đổi \`Item\`/\`Bid\` chưa được flush.

**Tự kiểm tra.** Vì sao câu lệnh \`UPDATE\` mặc định của Hibernate cập nhật mọi cột thay vì chỉ cột thay đổi, và annotation nào đổi hành vi đó? Annotation \`@Synchronize\` trên một entity ánh xạ tới subselect dùng để làm gì, và điều gì xảy ra nếu bạn quên nó?`,
      },
    ],
  },
  {
    id: "jp-w4",
    week: "Tuần 4",
    title: "Value type: property, embeddable và converter",
    goal: "Ánh xạ được mọi thứ không phải entity — từ một cột boolean tới một component lồng nhau tới một kiểu tự định nghĩa — và biết cột SQL sinh ra sẽ trông thế nào trước khi chạy.",
    practice: "Ánh xạ một @Embeddable vào một entity, rồi viết một converter cho một kiểu Java tự định nghĩa theo đúng cách chương 6 chỉ. Sinh schema và kiểm từng cột SQL thật sinh ra khớp với điều bạn nghĩ — chỗ nào lệch, tìm mục trong chương giải thích vì sao.",
    resources: [
      { label: "JPA 06 — Ánh xạ value type", href: "#/docs/jpa-06" },
    ],
    items: [
      {
        id: "jp-w4-1",
        text: "Ghi đè mặc định, cách truy cập, derived property và biến đổi cột",
        lesson: `**Mục tiêu.** Loại một property khỏi persistence bằng \`@Transient\`/\`transient\`, chọn access type field hay property cho từng property riêng lẻ, và ánh xạ được một derived property hoặc một cột cần biến đổi giá trị hai chiều.

**Đọc.** [Ánh xạ basic property](#/docs/jpa-06) đọc kỹ đoạn mở đầu liệt kê bốn quy tắc mặc định JPA áp cho property của một persistent class — đây là configuration by exception, nền cho toàn mục 6.1. [Ghi đè giá trị mặc định của basic property](#/docs/jpa-06) đọc kỹ, chú ý khác biệt giữa \`transient\` của Java (loại khỏi cả serialization lẫn persistence) và \`@Transient\` của JPA (chỉ loại khỏi persistence), cùng ba cách khai một property bắt buộc (\`@Basic(optional = false)\`, \`@Column(nullable = false)\`, \`@NotNull\` của Bean Validation). [Tùy chỉnh cách truy cập property](#/docs/jpa-06) đọc kỹ, gõ lại listing \`Item\` với \`@Access(AccessType.PROPERTY)\` trên field \`name\`. [Sử dụng derived property](#/docs/jpa-06) đọc kỹ hai ví dụ \`@Formula\`. [Biến đổi giá trị cột](#/docs/jpa-06) đọc kỹ ví dụ \`@ColumnTransformer\` chuyển \`IMPERIALWEIGHT\` sang \`metricWeight\`, kể cả đoạn về SQL sinh ra cho một ràng buộc \`WHERE\`.

**Bẫy.** Nghĩ rằng một derived property khai bằng \`@Formula\` có thể tham gia câu lệnh \`INSERT\`/\`UPDATE\` như property thường. Mục Sử dụng derived property nói rõ: các property này "không bao giờ xuất hiện trong câu lệnh SQL \`INSERT\` hay \`UPDATE\`, chỉ trong \`SELECT\`" — giá trị được tính lại mỗi lần entity được truy xuất, nên có thể trở nên lỗi thời nếu các property khác vừa bị sửa mà chưa flush. Bẫy thứ hai: dùng \`@ColumnTransformer\` trong một ràng buộc \`WHERE\` rồi kỳ vọng cơ sở dữ liệu vẫn dùng được index. Mục Biến đổi giá trị cột chỉ ra SQL sinh ra sẽ nhúng biểu thức (ví dụ \`i.IMPERIALWEIGHT / 2.20462=?\`) ngay trong \`WHERE\`, và cảnh báo "cơ sở dữ liệu có lẽ sẽ không thể dựa vào chỉ mục cho ràng buộc này; một lần quét toàn bảng sẽ được thực hiện".

**Tự kiểm tra.** Khác biệt giữa từ khóa \`transient\` của Java và annotation \`@Transient\` của JPA khi loại một property khỏi persistence là gì? Vì sao một property ánh xạ bằng \`@Formula\` không bao giờ xuất hiện trong câu lệnh \`INSERT\` hay \`UPDATE\`?`,
      },
      {
        id: "jp-w4-2",
        text: "Giá trị được sinh ra, @Temporal và ánh xạ enum",
        lesson: `**Mục tiêu.** Đánh dấu đúng một property do cơ sở dữ liệu sinh giá trị bằng \`@Generated\`/\`@CreationTimestamp\`/\`@UpdateTimestamp\`, và chọn chiến lược ánh xạ enum an toàn khi domain model có thể mở rộng.

**Đọc.** [Giá trị property được sinh ra và giá trị mặc định](#/docs/jpa-06) đọc kỹ toàn mục, gõ lại listing với \`@CreationTimestamp\`, \`@UpdateTimestamp\`, và \`@Generated(GenerationTime.INSERT)\` kèm \`@ColumnDefault\`, chú ý khác biệt \`GenerationTime.ALWAYS\` với \`GenerationTime.INSERT\`. [Annotation @Temporal](#/docs/jpa-06) đọc lướt, chỉ cần nhớ ba giá trị \`TemporalType\` (\`DATE\`, \`TIME\`, \`TIMESTAMP\`) và rằng annotation này không còn cần thiết với các kiểu \`java.time\` của Java 8. [Ánh xạ enum](#/docs/jpa-06) đọc kỹ, gõ lại ví dụ \`@Enumerated(EnumType.STRING)\` trên \`AuctionType\`.

**Bẫy.** Đánh dấu một property là "được sinh ra" rồi nghĩ Hibernate tự biết cần đọc lại giá trị đó mà không cần khai báo gì thêm. Mục Giá trị property được sinh ra và giá trị mặc định nói rõ: nếu không đánh dấu property bằng \`@Generated\` (hay \`@CreationTimestamp\`/\`@UpdateTimestamp\`), ứng dụng "sẽ phải thực hiện thêm một vòng gọi tới cơ sở dữ liệu để đọc giá trị sau khi chèn hoặc cập nhật" — chỉ khi khai đúng annotation, Hibernate mới tự phát thêm một \`SELECT\` ngay sau \`INSERT\`/\`UPDATE\` để làm mới instance. Bẫy thứ hai: bỏ qua \`@Enumerated(EnumType.STRING)\` vì nghĩ mặc định cũng đủ dùng. Mục Ánh xạ enum cảnh báo: không có \`@Enumerated\`, Hibernate lưu vị trí \`ORDINAL\` của giá trị enum (1, 2, 3...) — "một mặc định mong manh"; chỉ cần thêm một hằng số enum mới ở giữa, các giá trị đã lưu có thể không còn khớp đúng vị trí và làm hỏng ứng dụng.

**Tự kiểm tra.** Khác biệt giữa \`GenerationTime.ALWAYS\` và \`GenerationTime.INSERT\` là gì, xét về thời điểm Hibernate làm mới instance? Vì sao ánh xạ enum theo \`ORDINAL\` mặc định được sách gọi là "một mặc định mong manh", và \`EnumType.STRING\` giải quyết vấn đề đó thế nào?`,
      },
      {
        id: "jp-w4-3",
        text: "Embeddable component, ghi đè thuộc tính và component lồng nhau",
        lesson: `**Mục tiêu.** Ánh xạ được một class value type tùy chỉnh thành \`@Embeddable\`, ghi đè cột cho hai property cùng kiểu embeddable trên một entity, và lồng một embeddable component vào bên trong một embeddable component khác.

**Đọc.** [Schema cơ sở dữ liệu](#/docs/jpa-06) đọc kỹ, nắm hình ảnh cột của component được nhúng thẳng vào table của entity sở hữu — không có table riêng cho \`Address\`. [Làm cho class trở nên embeddable](#/docs/jpa-06) đọc kỹ toàn bộ listing \`Address\`, chú ý hộp cảnh báo về lỗi Hibernate Validator (mã HVAL-3). [Ghi đè các thuộc tính được nhúng](#/docs/jpa-06) đọc kỹ, gõ lại listing \`User\` dùng \`@AttributeOverride\` lặp lại ba lần cho \`billingAddress\`. [Ánh xạ embedded component lồng nhau](#/docs/jpa-06) đọc kỹ, gõ lại class \`City\` được nhúng vào trong \`Address\`, và chú ý ký pháp dấu chấm \`city.name\` khi ghi đè property lồng nhau từ entity gốc.

**Bẫy.** Gắn \`@NotNull\` của Bean Validation lên property của một class \`@Embeddable\` rồi tin rằng nó đủ để sinh constraint \`NOT NULL\` trong schema. Mục Làm cho class trở nên embeddable cảnh báo đây là một lỗi chưa khắc phục của Hibernate Validator (HVAL-3): "Hibernate sẽ chỉ dùng \`@NotNull\` trên property của component lúc chạy cho Bean Validation" — bạn phải tự thêm \`@Column(nullable = false)\` tường minh để có constraint trong DDL. Bẫy thứ hai: dùng \`@AttributeOverride\` cho \`billingAddress\` và nghĩ nó chỉ đổi tên cột, giữ lại các ràng buộc khác của \`Address\`. Mục Ghi đè các thuộc tính được nhúng nói rõ mỗi \`@AttributeOverride\` là "trọn vẹn" — mọi annotation JPA hay Hibernate trên property bị ghi đè đều bị bỏ qua, nên nếu không tự khai lại \`nullable = false\`, "tất cả cột \`BILLING_*\` đều cho phép \`NULL\`" dù \`Address\` gốc đã ràng buộc \`NOT NULL\`.

**Tự kiểm tra.** Vì sao chỉ gắn \`@NotNull\` của Bean Validation trên một property của class \`@Embeddable\` không đủ để sinh constraint \`NOT NULL\` trong schema, theo cảnh báo HVAL-3? Khi dùng \`@AttributeOverride\` để ghi đè cột của \`billingAddress\`, điều gì xảy ra với các annotation khác (như ràng buộc \`nullable\`) đã khai trên property gốc của \`Address\`?`,
      },
      {
        id: "jp-w4-4",
        text: "Converter: kiểu dựng sẵn, JPA converter và Hibernate UserType",
        lesson: `**Mục tiêu.** Biết Hibernate ánh xạ kiểu JDK nào tới kiểu SQL nào theo mặc định, viết được một \`AttributeConverter\` cho một class value type tùy chỉnh, và biết khi nào converter chuẩn JPA không đủ và cần \`UserType\` native của Hibernate.

**Đọc.** [Các kiểu dựng sẵn](#/docs/jpa-06) đọc kỹ các đoạn văn xung quanh bảng kiểu số/ký tự/ngày giờ/nhị phân (không cần thuộc bảng), đặc biệt đoạn giải thích Hibernate trả về \`java.sql.Date\`/\`Time\`/\`Timestamp\` chứ không phải \`java.util.Date\` sau khi nạp, và khuyến nghị dùng các kiểu \`java.time\` của Java 8 để tránh vấn đề này. [Tạo JPA converter tùy chỉnh](#/docs/jpa-06) đọc kỹ toàn bộ listing \`MonetaryAmountConverter\` hiện thực \`AttributeConverter\`, gõ lại cả hai phương thức \`convertToDatabaseColumn\`/\`convertToEntityAttribute\`. [Mở rộng Hibernate bằng UserType](#/docs/jpa-06) đọc kỹ đoạn mở đầu giải thích hai hạn chế của JPA converter chuẩn (không chuyển đổi từ/tới nhiều cột, không tích hợp engine truy vấn) trước khi đọc lướt qua listing \`MonetaryAmountUserType\` — không cần nhớ từng phương thức của \`CompositeUserType\`.

**Bẫy.** So sánh hai giá trị \`java.util.Date\` bằng \`equals()\` sau khi nạp lại từ cơ sở dữ liệu và ngạc nhiên vì kết quả sai. Mục Các kiểu dựng sẵn giải thích: Hibernate luôn trả về subclass JDBC (\`java.sql.Date\`, \`Time\` hay \`Timestamp\`) chứ không phải \`java.util.Date\` gốc, vì cơ sở dữ liệu có độ chính xác cao hơn; \`equals()\` giữa hai kiểu này "không đối xứng", nên sách khuyến nghị luôn so sánh bằng \`getTime()\` thay vì \`equals()\`. Bẫy thứ hai: nghĩ một \`AttributeConverter\` chuẩn JPA giải quyết được mọi bài toán chuyển đổi kiểu. Mục Mở rộng Hibernate bằng UserType nêu rõ hai hạn chế: "các JPA converter chuẩn hóa không hỗ trợ việc biến đổi giá trị từ hoặc tới nhiều cột", và không tích hợp với engine truy vấn — bạn không thể viết \`select i from Item i where i.buyNowPrice.amount > 100\` dù đã có converter, vì Hibernate không biết \`MonetaryAmount\` có thuộc tính \`amount\`; chỉ \`CompositeUserType\` mới cho phép ký pháp dấu chấm đó trong truy vấn.

**Tự kiểm tra.** Sau khi nạp lại một property \`java.util.Date\` từ cơ sở dữ liệu, Hibernate trả về đúng kiểu \`java.util.Date\` hay một kiểu khác, và bạn nên so sánh hai giá trị đó bằng phương thức nào thay vì \`equals()\`? Hai hạn chế nào của \`AttributeConverter\` chuẩn JPA khiến bạn phải chuyển sang \`UserType\` native của Hibernate?`,
      },
    ],
  },
];
