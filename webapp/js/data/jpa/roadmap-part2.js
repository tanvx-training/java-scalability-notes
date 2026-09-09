// Lộ trình đọc Java Persistence with Spring Data and Hibernate — Phần 2 (Tuần 8–13).
//
// Nguồn: bản dịch tiếng Việt "Java Persistence with Spring Data and Hibernate"
// (Cătălin Tudose — Manning).
// Thư mục nguồn: sources/jpa/ — đủ 20 chương, không thiếu chương nào.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jp-w<N> / jp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jpaWeeksPart2 = [
  {
    id: "jp-w8",
    week: "Tuần 8",
    title: "Vòng đời persistence và EntityManager",
    goal: "Nói được một entity đang ở trạng thái nào và thao tác nào chuyển nó sang trạng thái nào, và giải thích được vì sao sửa một object đang được quản lý là đủ để dữ liệu xuống database.",
    practice: "Tái hiện `LazyInitializationException` bằng cách chạm vào một proxy sau khi persistence context đã đóng. Rồi sửa bằng ba cách khác nhau, và với mỗi cách viết ra cái giá của nó — cách nào kéo thêm dữ liệu, cách nào kéo dài transaction, cách nào đổi thiết kế tầng.",
    resources: [
      { label: "JPA 10 — Quản lý dữ liệu", href: "#/docs/jpa-10" },
    ],
    items: [
      {
        id: "jp-w8-1",
        text: "Bốn trạng thái của một instance entity, và persistence context",
        lesson: `**Mục tiêu.** Nhìn một đoạn mã là nói được entity trong đó đang ở trạng thái nào, và thao tác nào chuyển nó sang trạng thái nào.

**Đọc.** [Vòng đời persistence](#/docs/jpa-10) mở chương bằng khung mà cả phần còn lại đứng lên trên. [Các trạng thái của instance entity](#/docs/jpa-10) là mục phải đọc chậm và vẽ lại thành sơ đồ trên giấy — bốn trạng thái cùng các mũi tên giữa chúng là thứ bạn sẽ tra lại suốt các chương sau. [Persistence context](#/docs/jpa-10) giải thích cái hộp giữ các instance đang được quản lý; đọc kỹ đoạn nói nó tồn tại trong bao lâu, vì đó là nguồn gốc của gần như mọi bất ngờ ở chương 12.

**Bẫy.** Nghĩ rằng gọi setter trên một object là chưa đủ để dữ liệu xuống database. Với một instance đang được quản lý, sửa trạng thái của nó là đủ — persistence context sẽ phát hiện thay đổi và sinh UPDATE khi flush, không cần gọi một phương thức lưu nào. Bẫy ngược lại cũng thật: sửa một instance **detached** thì không có gì xảy ra cả, và đây là chỗ chương 10 dành hẳn một mục cuối để nói về merge.

**Tự kiểm tra.** Bốn trạng thái mà chương này liệt kê là gì, và thao tác nào đưa một instance từ transient sang persistent? Persistence context sống trong bao lâu, và điều gì xảy ra với các instance nó đang giữ khi nó đóng lại?`,
      },
      {
        id: "jp-w8-2",
        text: "Đơn vị công việc: persist, truy xuất, sửa, reference và remove",
        lesson: `**Mục tiêu.** Gọi đúng \`persist()\`/\`find()\`/\`getReference()\`/\`remove()\` tại đúng thời điểm trong một đơn vị công việc, và biết \`remove()\` trên một proxy vẫn cần một \`SELECT\` để hoàn tất vòng đời.

**Đọc.** [Interface EntityManager](#/docs/jpa-10) mở mục bằng nhắc rằng interface chính để tạo đơn vị công việc trong Jakarta Persistence là \`EntityManager\`, và lưu ý các ví dụ của chương dùng thẳng JPA/Hibernate, không qua Spring Data — đọc lướt để nắm bối cảnh. [Đơn vị công việc chuẩn mực](#/docs/jpa-10) đọc kỹ, gõ lại dạng chuẩn \`emf.createEntityManager()\` rồi \`begin()\`/\`commit()\` trong khối \`try\`/\`finally\` với \`close()\`, và chú ý đoạn giải thích Hibernate không lấy \`Connection\` JDBC cho tới khi thật sự cần. [Làm cho dữ liệu trở nên persistent](#/docs/jpa-10) đọc kỹ, gõ lại \`em.persist(item)\`, và đọc chậm đoạn nói Hibernate không rollback thay đổi trong bộ nhớ nếu \`INSERT\`/\`UPDATE\` thất bại. [Truy xuất và sửa đổi dữ liệu persistent](#/docs/jpa-10) đọc kỹ, gõ lại \`em.find()\` rồi sửa trực tiếp property để dirty checking tự sinh \`UPDATE\`, cùng ví dụ \`itemA == itemB\` chứng minh đọc lặp lại được trong cùng persistence context. [Lấy một reference](#/docs/jpa-10) đọc kỹ, gõ lại \`em.getReference()\` cùng \`PersistenceUnitUtil#isLoaded()\`, và đọc chậm đoạn về \`LazyInitializationException\`. [Làm cho dữ liệu trở nên transient](#/docs/jpa-10) đọc kỹ, gõ lại \`em.remove(item)\`, và chú ý trường hợp gọi \`remove()\` trên một proxy.

**Bẫy.** Gọi \`getReference()\` rồi trì hoãn việc truy cập dữ liệu của proxy tới sau khi persistence context đã đóng. Mục Lấy một reference nói thẳng: "Nếu chúng ta không khởi tạo proxy khi persistence context còn mở, chúng ta sẽ nhận \`LazyInitializationException\` nếu truy cập proxy... Chúng ta không thể nạp dữ liệu theo yêu cầu một khi persistence context đã đóng." Bẫy thứ hai: tin rằng một lỗi lúc flush sẽ rollback luôn thay đổi trong bộ nhớ. Mục Làm cho dữ liệu trở nên persistent cảnh báo: "Hibernate không rollback các thay đổi trong bộ nhớ trên các instance persistent. Nếu chúng ta đổi \`Item#name\` sau \`persist()\`, một lỗi commit sẽ không đưa tên về giá trị cũ."

**Tự kiểm tra.** Vì sao gọi \`Item#getName()\` trên một proxy sau khi persistence context đã đóng ném \`LazyInitializationException\`, và cách khắc phục đơn giản mà chương đưa ra là gì? Khi lệnh \`INSERT\` hoặc \`UPDATE\` thất bại lúc flush, Hibernate rollback gì ở cấp cơ sở dữ liệu, và điều gì KHÔNG được rollback trong bộ nhớ ứng dụng?`,
      },
      {
        id: "jp-w8-3",
        text: "Refresh, replicate, cache trong persistence context và flush",
        lesson: `**Mục tiêu.** Biết dùng \`refresh()\`/\`replicate()\`/\`flush()\` đúng lúc, và tránh để persistence context phình to tới mức gây \`OutOfMemoryError\`.

**Đọc.** [Làm mới dữ liệu](#/docs/jpa-10) đọc kỹ, gõ lại \`em.refresh(item)\` ghi đè thay đổi trong bộ nhớ bằng dữ liệu mới nhất từ cơ sở dữ liệu, và đọc đoạn nói trường hợp dùng tốt nhất của nó là một persistence context mở rộng. [Nhân bản dữ liệu](#/docs/jpa-10) đọc lướt, chỉ cần nắm \`replicate()\` là thao tác riêng của API \`Session\` Hibernate và bốn giá trị của \`ReplicationMode\`. [Caching trong persistence context](#/docs/jpa-10) đọc chậm nhất trong bốn mục con — đọc kỹ đoạn cảnh báo \`OutOfMemoryError\`, và gõ lại \`em.detach()\`/\`em.clear()\` cùng \`setDefaultReadOnly(true)\`. [Flush persistence context](#/docs/jpa-10) đọc kỹ, gõ lại ví dụ \`setFlushMode(FlushModeType.COMMIT)\` và so sánh với \`FlushModeType.AUTO\` mặc định.

**Bẫy.** Nạp hàng nghìn instance entity trong một đơn vị công việc mà không hề định sửa đổi chúng. Mục Caching trong persistence context nói thẳng: "Nhiều người dùng Hibernate bỏ qua sự thật đơn giản này và gặp \`OutOfMemoryError\`... Cache của persistence context không bao giờ tự thu nhỏ." Bẫy thứ hai: đặt \`FlushModeType.COMMIT\` rồi ngạc nhiên khi một truy vấn trả về dữ liệu khác với thay đổi vừa gõ trong bộ nhớ. Mục Flush persistence context giải thích: "Với \`FlushModeType.COMMIT\`, chúng ta tắt việc flush trước truy vấn, nên có thể thấy dữ liệu trả về từ truy vấn khác với dữ liệu chúng ta có trong bộ nhớ."

**Tự kiểm tra.** Vì sao cache của persistence context có thể dẫn tới \`OutOfMemoryError\` khi nạp hàng nghìn entity mà không sửa đổi chúng, và Hibernate cung cấp thao tác nào để gỡ instance ra khỏi cache? Sự khác biệt giữa \`FlushModeType.AUTO\` và \`FlushModeType.COMMIT\` là gì, và mặc định nào áp dụng khi \`EntityManager\` tham gia một transaction?`,
      },
      {
        id: "jp-w8-4",
        text: "Trạng thái detached: identity, equals, detach và merge",
        lesson: `**Mục tiêu.** Hiện thực đúng \`equals()\`/\`hashCode()\` bằng business key cho một entity dùng ở trạng thái detached, và biết \`merge()\` trả về gì cùng tham chiếu nào nên bỏ đi sau đó.

**Đọc.** [Làm việc với trạng thái detached](#/docs/jpa-10) mở mục bằng cảnh báo vấn đề bí danh (aliasing) khi một tham chiếu rời khỏi phạm vi identity được persistence context bảo đảm — đọc lướt để nắm bối cảnh. [Identity của các instance detached](#/docs/jpa-10) đọc kỹ, gõ lại ví dụ hai tham chiếu \`a\`/\`b\` từ cùng một persistence context so với \`c\` từ một persistence context khác, và ví dụ thêm cả ba vào một \`Set\` chỉ còn 2 phần tử vì \`equals()\` mặc định dùng Java identity. [Hiện thực các phương thức equality](#/docs/jpa-10) đọc kỹ, gõ lại \`equals()\`/\`hashCode()\` của \`User\` dựa trên business key \`username\`, chú ý dùng getter thay vì truy cập field trực tiếp (vì tham chiếu \`other\` có thể là proxy) và dùng \`instanceof\` thay vì so \`getClass()\`, cùng danh sách gợi ý chọn business key ở cuối mục. [Detach các instance entity](#/docs/jpa-10) đọc kỹ, gõ lại \`em.detach(user)\` và \`em.contains()\`. [Merge các instance entity](#/docs/jpa-10) đọc kỹ, gõ lại \`em.merge(detachedUser)\` trả về \`mergedUser\`, và đọc kỹ đoạn nói phải bỏ tham chiếu \`detachedUser\` cũ.

**Bẫy.** Hiện thực \`equals()\` dựa trên giá trị định danh cơ sở dữ liệu (surrogate primary key). Mục Hiện thực các phương thức equality nói thẳng: "giá trị định danh không được Hibernate gán cho tới khi một instance trở thành persistent. Nếu một instance transient được thêm vào \`Set\` trước khi được lưu, thì khi chúng ta lưu nó, giá trị băm của nó sẽ thay đổi trong khi nó vẫn nằm trong \`Set\`... Chúng tôi mạnh mẽ khuyên không nên dùng equality theo định danh cơ sở dữ liệu." Bẫy thứ hai: tiếp tục dùng tham chiếu detached cũ sau khi đã merge. Mục Merge các instance entity cảnh báo: "Chúng ta phải bỏ \`detachedUser\` và từ giờ tham chiếu tới \`mergedUser\` hiện tại. Mọi thành phần khác trong ứng dụng vẫn còn giữ \`detachedUser\` đều phải chuyển sang \`mergedUser\`."

**Tự kiểm tra.** Vì sao sách khuyên mạnh mẽ không nên hiện thực \`equals()\` dựa trên giá trị định danh cơ sở dữ liệu (surrogate primary key)? Sau khi gọi \`em.merge(detachedUser)\`, bạn nên tiếp tục làm việc với tham chiếu nào, và vì sao?`,
      },
    ],
  },
  {
    id: "jp-w9",
    week: "Tuần 9",
    title: "Transaction và điều khiển đồng thời",
    goal: "Chặn được lost update bằng optimistic locking, và nói được trường hợp nào bắt buộc phải chuyển sang pessimistic.",
    practice: "Cho hai luồng cùng đọc rồi cùng sửa một entity để tái hiện lost update. Chặn nó bằng optimistic locking theo cách chương 11 chỉ, rồi chặn lại bằng pessimistic locking tường minh. So hai lần: hành vi khi xung đột xảy ra, và câu SQL mà mỗi cách sinh ra.",
    resources: [
      { label: "JPA 11 — Transaction và concurrency", href: "#/docs/jpa-11" },
    ],
    items: [
      {
        id: "jp-w9-1",
        text: "ACID, và database transaction so với system transaction",
        lesson: `**Mục tiêu.** Kể tên bốn thuộc tính ACID và nói được tính đúng đắn (correctness) khác tính nhất quán (consistency) ở chỗ nào, và phân biệt được database transaction với system transaction.

**Đọc.** [Những điều thiết yếu về transaction](#/docs/jpa-11) mở mục bằng ví dụ CaveatEmptor kết thúc một phiên đấu giá — ba nhiệm vụ phải cùng thành công hoặc cùng thất bại — đọc kỹ vì ví dụ này quay lại xuyên suốt chương. [Các thuộc tính ACID](#/docs/jpa-11) đọc kỹ, ghi lại bốn chữ cái atomicity/consistency/isolation/durability, và đọc chậm đoạn phân biệt tính đúng đắn (trách nhiệm ứng dụng) với tính nhất quán (trách nhiệm cơ sở dữ liệu). [Database transaction và system transaction](#/docs/jpa-11) đọc kỹ, chú ý ví dụ transaction trải qua nhiều hệ thống (cơ sở dữ liệu và bộ xử lý thanh toán bên ngoài) và khái niệm transaction demarcation.

**Bẫy.** Nghĩ rằng ràng buộc nhất quán của cơ sở dữ liệu tự động bảo đảm luôn cả tính đúng đắn nghiệp vụ. Mục Các thuộc tính ACID nói thẳng: "tính đúng đắn của một transaction là trách nhiệm của ứng dụng, trong khi tính nhất quán là trách nhiệm của cơ sở dữ liệu" — quy tắc "chỉ tính phí người bán một lần" là một giả định hợp lý nhưng "chúng ta có thể không diễn đạt được nó bằng ràng buộc cơ sở dữ liệu." Bẫy thứ hai: coi "transaction" là một khái niệm duy nhất, không phân biệt database transaction (một hệ thống) với system transaction (nhiều hệ thống được phối hợp) — mục Database transaction và system transaction minh họa chính bằng ví dụ đánh dấu bid thắng trong cơ sở dữ liệu rồi giao tiếp với một hệ thống bên ngoài để tính phí thẻ tín dụng, "một transaction trải qua nhiều hệ thống, với các transaction con được phối hợp trên có thể nhiều tài nguyên."

**Tự kiểm tra.** Theo chương 11, tính nhất quán (consistency) là trách nhiệm của ai, và tính đúng đắn (correctness) là trách nhiệm của ai? Sự khác biệt giữa database transaction và system transaction là gì, và chương này tập trung phân tích loại nào?`,
      },
      {
        id: "jp-w9-2",
        text: "Concurrency ở mức database, và kiểm soát lạc quan",
        lesson: `**Mục tiêu.** Phân biệt được bốn hiện tượng mất cô lập (lost update/dirty read/unrepeatable read/phantom read), chọn đúng mức cô lập ANSI cho một tình huống, và bật cùng đọc được optimistic locking qua \`@Version\`.

**Đọc.** [Điều khiển truy cập đồng thời](#/docs/jpa-11) mở mục bằng phân biệt hai cách DBMS hiện thực cô lập — khóa (locking) truyền thống và multi-version concurrency control (MVCC) — đọc lướt để nắm bối cảnh. [Hiểu về concurrency ở mức cơ sở dữ liệu](#/docs/jpa-11) đọc kỹ toàn bộ — đây là mục dài và quan trọng nhất tuần này: bốn hiện tượng lost update/dirty read/unrepeatable read/phantom read, bảng các mức cô lập ANSI (\`READ_UNCOMMITTED\`/\`READ_COMMITTED\`/\`REPEATABLE_READ\`/\`SERIALIZABLE\`) cùng những gì mỗi mức ngăn được, rồi đọc chậm đoạn khuyến nghị chọn mức cô lập, đặc biệt lý do read committed kết hợp entity versioning là đủ cho hầu hết ứng dụng JPA đa người dùng. [Kiểm soát đồng thời lạc quan (optimistic)](#/docs/jpa-11) đọc kỹ toàn bộ mục, gõ lại annotation \`@Version\` bật versioning tự động và ví dụ SQL \`update ITEM set NAME = ?, VERSION = 1 where ID = ? and VERSION = 0\` cho thấy Hibernate tăng và kiểm tra phiên bản lúc flush rồi ném \`OptimisticLockException\` khi xung đột, rồi đọc kỹ hai kỹ thuật thủ công ở cuối mục: kiểm tra phiên bản thủ công bằng \`setLockMode(LockModeType.OPTIMISTIC)\` trên một \`Query\` để bảo đảm đọc lặp lại được, và buộc tăng phiên bản bằng \`LockModeType.OPTIMISTIC_FORCE_INCREMENT\` trên \`find()\` khi một entity con (như \`Bid\`) thay đổi mà entity cha (\`Item\`) không hề bị sửa.

**Bẫy.** Dùng mức cô lập read uncommitted vì tưởng nó chỉ đánh đổi hiệu năng lấy an toàn. Mục Hiểu về concurrency ở mức cơ sở dữ liệu nói thẳng: "với gần như mọi kịch bản, hãy loại bỏ mức cô lập read uncommitted... người bán một mặt hàng đấu giá có thể bị tính phí hai lần." Bẫy thứ hai: nghĩ rằng bật versioning trên \`Item\` là đủ để phát hiện mọi xung đột liên quan tới nó. Mục Kiểm soát đồng thời lạc quan cảnh báo về việc hai người dùng đặt bid đồng thời: "ngay cả việc bật versioning cho \`Item\` cũng không giúp được. \`Item\` không bao giờ bị sửa đổi trong thủ tục này" — chỉ \`OPTIMISTIC_FORCE_INCREMENT\` mới làm xung đột trở nên phát hiện được.

**Tự kiểm tra.** Chương 11 khuyến nghị loại bỏ mức cô lập nào gần như trong mọi kịch bản, và vì sao? Vì sao việc bật versioning trên \`Item\` không đủ để phát hiện xung đột khi hai người dùng đặt bid đồng thời, và \`LockModeType\` nào giải quyết vấn đề này?`,
      },
      {
        id: "jp-w9-3",
        text: "Pessimistic locking tường minh và cách tránh deadlock",
        lesson: `**Mục tiêu.** Chọn đúng \`PESSIMISTIC_READ\`/\`PESSIMISTIC_WRITE\`, biết phạm vi thật của một khóa bi quan, và áp dụng được cách giảm xác suất deadlock mà chương khuyên.

**Đọc.** [Pessimistic locking tường minh](#/docs/jpa-11) đọc kỹ, gõ lại \`setLockMode(LockModeType.PESSIMISTIC_READ)\` cùng hint \`javax.persistence.lock.timeout\`, đọc chậm đoạn liệt kê \`FOR UPDATE\`/\`FOR SHARE\` sinh ra khác nhau theo dialect (H2, PostgreSQL, MySQL), và đọc kỹ đoạn nói khóa chỉ áp dụng cho dòng của chính entity, không lan sang association mà foreign key nằm ở bảng khác. [Tránh deadlock](#/docs/jpa-11) đọc kỹ, gõ lại ví dụ hai transaction cập nhật hai \`Item\` theo thứ tự ngược nhau, và ghi nhớ \`hibernate.order_updates\` như cách giảm xác suất deadlock thực dụng mà chương đề xuất.

**Bẫy.** Nghĩ rằng khóa bi quan trên một \`Item\` cũng khóa luôn association \`Item#seller\` của nó. Mục Pessimistic locking tường minh nói thẳng: "association \`Item#seller\` bị khóa nếu cột foreign key \`SELLER_ID\` nằm trong table \`ITEM\`, nhưng instance \`Seller\` thực tế thì không bị khóa!" — các collection hay association khác mà foreign key nằm ở table khác cũng không bị khóa. Bẫy thứ hai: nghĩ rằng chuyển sang mức cô lập cao hơn là cách duy nhất tránh deadlock. Mục Tránh deadlock chỉ ra một tối ưu thực dụng khác: "sắp xếp các câu lệnh \`UPDATE\` theo giá trị primary key... Bạn có thể bật tối ưu này cho toàn bộ persistence unit bằng property cấu hình \`hibernate.order_updates\`."

**Tự kiểm tra.** Nếu bạn khóa một instance \`Item\` bằng \`PESSIMISTIC_WRITE\`, association \`Item#seller\` (khóa ngoại nằm trong bảng \`ITEM\`) có bị khóa theo không, còn instance \`Seller\` thực tế thì sao? Deadlock trong ví dụ chương 11 xảy ra vì hai transaction cập nhật hai dòng \`Item\` theo thứ tự nào, và property cấu hình nào giúp Hibernate giảm xác suất này?`,
      },
      {
        id: "jp-w9-4",
        text: "Truy cập phi giao dịch, và transaction với Spring / Spring Data",
        lesson: `**Mục tiêu.** Phân biệt được truy cập dữ liệu ở chế độ auto-commit/unsynchronized với truy cập trong transaction, và chọn đúng propagation cho một phương thức Spring Data khi nó được gọi từ trong hay ngoài một transaction khác.

**Đọc.** [Truy cập dữ liệu phi giao dịch](#/docs/jpa-11) mở mục bằng nhắc rằng một \`Connection\` JDBC mặc định ở chế độ auto-commit, tiện cho SQL tùy ứng nhưng không phù hợp cho một chuỗi câu lệnh có kế hoạch — đọc lướt để nắm bối cảnh. [Đọc dữ liệu ở chế độ auto-commit](#/docs/jpa-11) đọc kỹ, gõ lại việc tạo \`EntityManager\` không tham gia transaction khiến persistence context ở chế độ unsynchronized không tự flush, ví dụ truy vấn "select i.name..." trả về giá trị cũ trong khi \`find()\` trả về instance đã sửa từ cache, và đoạn nói cố \`flush()\` sẽ ném \`TransactionRequiredException\`. [Xếp hàng các sửa đổi](#/docs/jpa-11) đọc kỹ, gõ lại \`persist()\` một instance mới rồi \`em.getTransaction().begin()\`/\`joinTransaction()\`/\`commit()\` sau đó — thao tác được xếp hàng và chỉ thật sự ghi xuống khi transaction commit.

[Quản lý transaction với Spring và Spring Data](#/docs/jpa-11) mở mục bằng giới thiệu \`PlatformTransactionManager\`, trừu tượng giao dịch trung tâm của Spring, và phân biệt quản lý transaction khai báo (annotation) với bằng chương trình — đọc lướt để nắm bối cảnh. [Transaction propagation](#/docs/jpa-11) đọc kỹ, gõ lại bảy giá trị của \`Propagation\` (\`REQUIRED\`, \`SUPPORTS\`, \`MANDATORY\`, \`REQUIRES_NEW\`, \`NOT_SUPPORTED\`, \`NEVER\`, \`NESTED\`) và bảng tóm tắt hành vi mỗi giá trị khi phương thức gọi đã có hoặc chưa có transaction. [Rollback transaction](#/docs/jpa-11) đọc kỹ, gõ lại bốn thuộc tính \`rollbackFor\`/\`rollbackForClassName\`/\`noRollbackFor\`/\`noRollbackForClassName\` của \`@Transactional\` và quy tắc mặc định rollback với \`RuntimeException\`. [Các thuộc tính của transaction](#/docs/jpa-11) đọc kỹ, gõ lại bốn thuộc tính \`isolation\`/\`propagation\`/\`timeout\`/\`readOnly\` của \`@Transactional\`, và chú ý khuyến nghị áp annotation ở mức phương thức trong class để có hành vi mịn. [Định nghĩa transaction bằng chương trình](#/docs/jpa-11) đọc lướt, chỉ cần nắm \`TransactionTemplate\` với \`setIsolationLevel()\`/\`setPropagationBehavior()\`/\`setTimeout()\`/\`setReadOnly()\` và callback \`execute()\`. [Phát triển có giao dịch với Spring và Spring Data](#/docs/jpa-11) đọc kỹ toàn bộ ví dụ CaveatEmptor — gõ lại \`ItemRepositoryCustom\`/\`ItemRepositoryImpl\` với quy ước hậu tố \`Impl\`, và các mức propagation khác nhau trên từng phương thức: \`MANDATORY\` trên \`checkNameDuplicate\`, \`REQUIRED\` mặc định trên \`addItem\`, \`noRollbackFor\` trên \`addItemNoRollback\`, và \`REQUIRES_NEW\`/\`NOT_SUPPORTED\`/\`SUPPORTS\`/\`NEVER\` trên các phương thức của \`LogRepositoryImpl\`.

**Bẫy.** Nghĩ rằng gọi \`persist()\` trên một \`EntityManager\` chưa tham gia transaction (unsynchronized) sẽ ghi ngay lệnh \`INSERT\` xuống cơ sở dữ liệu. Mục Xếp hàng các sửa đổi nói rõ: Hibernate "chỉ lấy một giá trị định danh mới... nhưng lệnh SQL \`INSERT\` chưa xảy ra" — instance ở trạng thái persistent trong context, còn việc ghi xuống bị hoãn tới khi persistence context tham gia và commit một transaction. Bẫy thứ hai: gọi một phương thức \`@Transactional(propagation = Propagation.NEVER)\` từ bên trong một phương thức khác đang transactional. Mục Phát triển có giao dịch với Spring và Spring Data minh họa đúng tình huống này với \`LogRepositoryImpl#showLogs\` (propagation \`NEVER\`) được gọi từ \`ItemRepository#showLogs\` (đang transactional): test ném \`IllegalTransactionStateException\` với thông điệp "Existing transaction found for transaction marked with propagation 'never'".

**Tự kiểm tra.** Với một \`EntityManager\` chưa tham gia transaction, gọi \`persist()\` có ghi ngay lệnh \`INSERT\` xuống cơ sở dữ liệu không? Điều gì thật sự xảy ra, và khi nào lệnh đó mới được thực thi? Nếu một phương thức mang \`@Transactional(propagation = Propagation.NEVER)\` được gọi từ bên trong một transaction đang diễn ra, điều gì xảy ra?`,
      },
    ],
  },
];
