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
  {
    id: "jp-w10",
    week: "Tuần 10",
    title: "Hibernate làm gì sau lưng bạn",
    goal: "Giải thích được vì sao một vòng lặp trên collection sinh ra N+1 câu SQL, chữa được bằng ít nhất hai cách, và biết cơ chế nào đang chen vào giữa mã của bạn với database.",
    practice: "Bật `hibernate.generate_statistics`, tái hiện vấn đề n+1 selects đúng như chương 12 mô tả. Chữa bằng cách fetch kèm join, rồi chữa lại bằng entity graph. Đếm số query trước và sau mỗi cách, và ghi lại cách nào kéo về bao nhiêu dữ liệu thừa.",
    resources: [
      { label: "JPA 12 — Fetch plan, strategy và profile", href: "#/docs/jpa-12" },
      { label: "JPA 13 — Lọc dữ liệu", href: "#/docs/jpa-13" },
    ],
    items: [
      {
        id: "jp-w10-1",
        text: "Proxy, collection lazy, eager loading và vấn đề n+1 selects",
        lesson: `**Mục tiêu.** Giải thích được proxy Hibernate là gì và khi nào truy cập nó kích hoạt \`SELECT\`, phân biệt fetch plan lazy mặc định của association và collection, và nhận ra ngay pattern gây ra vấn đề n+1 selects.

**Đọc.** [Lazy loading và eager loading](#/docs/jpa-12) mở chương bằng câu hỏi cốt lõi: khi ta gọi \`entityManager.find(Item.class, 123)\`, những gì có sẵn trong bộ nhớ? Mục này giới thiệu fetch plan mặc định toàn cục với \`FetchType.LAZY\`/\`FetchType.EAGER\`, và khuyến nghị một fetch plan mặc định lazy cho mọi entity và collection — đọc kỹ vì đây là khung cho toàn bộ chương. [Hiểu về entity proxy](#/docs/jpa-12) đọc kỹ, gõ lại \`getReference()\` không thực thi \`SELECT\` nào, chỉ gọi getter của định danh (\`@Id\`) mới không kích hoạt khởi tạo còn gọi bất kỳ phương thức nào khác (như \`getName()\`) sẽ kích hoạt \`SELECT\`, và chú ý mặc định JPA cho \`@ManyToOne\` là \`FetchType.EAGER\` — sách khuyến nghị ghi đè thành \`LAZY\`. Đọc kỹ đoạn về \`LazyInitializationException\` khi truy cập proxy sau khi persistence context đã đóng. [Persistent collection lazy](#/docs/jpa-12) đọc kỹ, gõ lại việc \`@ElementCollection\`/\`@OneToMany\`/\`@ManyToMany\` lazy theo mặc định (không cần khai \`FetchType.LAZY\`), Hibernate thay collection bằng wrapper như \`PersistentSet\` chứ không phải \`HashSet\`, và \`LazyCollectionOption.EXTRA\` cho phép \`size()\`/\`isEmpty()\`/\`contains()\` sinh \`SELECT COUNT\` thay vì nạp toàn bộ. [Eager loading association và collection](#/docs/jpa-12) đọc kỹ, gõ lại \`FetchType.EAGER\` là yêu cầu cứng (khác \`LAZY\` chỉ là gợi ý), và chú ý lời cảnh báo: eager một collection thường không phải chiến lược hay.

[Chọn fetch strategy](#/docs/jpa-12) mở mục bằng mục tiêu giảm thiểu số câu SQL và độ phức tạp của chúng — đọc lướt để nắm bối cảnh trước khi vào vấn đề n+1 selects. [Vấn đề n+1 selects](#/docs/jpa-12) đọc kỹ toàn bộ — đây là mục quan trọng nhất tuần này: gõ lại ví dụ vòng lặp qua danh sách \`Item\` rồi gọi \`getSeller().getUsername()\`, sinh một \`SELECT\` cho danh sách cộng n \`SELECT\` bổ sung, và ví dụ tương tự với collection \`bids\` — 100 bid nghĩa là 101 truy vấn SQL.

**Bẫy.** Quên rằng mặc định của JPA cho \`@ManyToOne\` là \`FetchType.EAGER\`, không phải \`LAZY\`. Mục Hiểu về entity proxy nhắc thẳng: "Hãy nhớ rằng mặc định của JPA cho @ManyToOne là FetchType.EAGER! Chúng ta thường muốn ghi đè điều này để có fetch plan mặc định lazy." Bẫy thứ hai: giữ fetch plan lazy mặc định rồi duyệt một danh sách entity và truy cập association hay collection của mỗi phần tử trong vòng lặp — mục Vấn đề n+1 selects chỉ rõ: với 100 bid, "chúng ta sẽ thực thi 101 truy vấn SQL!"

**Tự kiểm tra.** Vì sao gọi \`item.getId()\` trên một proxy không kích hoạt \`SELECT\` nhưng gọi \`item.getName()\` thì có, và mặc định \`FetchType\` của \`@ManyToOne\` trong JPA là gì? Với một vòng lặp qua n instance \`Item\` rồi gọi \`getSeller().getUsername()\` trên từng cái ở fetch plan lazy mặc định, tổng số câu SQL \`SELECT\` được thực thi là bao nhiêu?`,
      },
      {
        id: "jp-w10-2",
        text: "Tích Descartes, bốn cách prefetch, fetch profile và entity graph",
        lesson: `**Mục tiêu.** Nhận diện được vấn đề tích Descartes khi eager-load nhiều collection cùng lúc, chọn đúng một trong bốn cách prefetch mà chương đưa ra, và bật được một fetch plan thay thế bằng fetch profile hoặc entity graph mà không sửa ánh xạ toàn cục.

**Đọc.** [Vấn đề tích Descartes](#/docs/jpa-12) đọc kỹ toàn bộ, gõ lại ví dụ eager-load hai collection \`bids\` và \`images\` bằng \`FetchType.EAGER\`, dẫn tới một \`JOIN\` cho ra tích 3×3 = 9 dòng, và hình dung với 50 bid và 5 image thì result set có thể lên tới 250 dòng — đọc chậm đoạn về property \`hibernate.max_fetch_depth\` kiểm soát số table được \`JOIN\` cho \`@ManyToOne\`/\`@OneToOne\` (mặc định không giới hạn, \`MySQLDialect\` đặt sẵn là 2). [Prefetch dữ liệu theo lô](#/docs/jpa-12) đọc kỹ, gõ lại \`@org.hibernate.annotations.BatchSize(size = 10)\` trên \`User\` sinh một \`SELECT ... WHERE ID IN\` với 10 dấu \`?\`, và cùng annotation trên collection \`bids\` với \`size = 5\`; chú ý đoạn gọi batch fetching là "tối ưu đoán mò". [Prefetch collection bằng subselect](#/docs/jpa-12) đọc kỹ, gõ lại \`@org.hibernate.annotations.Fetch(FetchMode.SUBSELECT)\` khiến Hibernate nhúng lại truy vấn gốc dưới dạng subselect để nạp mọi collection \`bids\` của mọi \`Item\` đã nạp cùng lúc. [Eager fetching bằng nhiều lệnh SELECT](#/docs/jpa-12) đọc kỹ, gõ lại \`@org.hibernate.annotations.Fetch(FetchMode.SELECT)\` kết hợp \`FetchType.EAGER\` khiến Hibernate nạp \`seller\` và \`bids\` bằng các lệnh \`SELECT\` riêng thay vì \`JOIN\`, tránh được tích Descartes. [Eager fetching động](#/docs/jpa-12) đọc kỹ, gõ lại cú pháp \`join fetch\` trong JPQL (\`select i from Item i join fetch i.seller\`) và phương thức \`fetch()\` trên \`Root\` của \`CriteriaQuery\`, áp dụng eager fetching cho một truy vấn cụ thể mà không đổi ánh xạ toàn cục.

[Sử dụng fetch profile](#/docs/jpa-12) mở mục bằng phân biệt hai cơ chế Hibernate hỗ trợ: fetch profile (API riêng của Hibernate) và entity graph (chuẩn hóa từ JPA 2.1) — đọc lướt để nắm bối cảnh. [Khai báo fetch profile của Hibernate](#/docs/jpa-12) đọc kỹ, gõ lại \`@org.hibernate.annotations.FetchProfiles\` khai báo trong \`package-info.java\` với tên profile và \`fetchOverrides\` (\`entity\`, \`association\`, \`mode = FetchMode.JOIN\`), và cách bật bằng \`Session#enableFetchProfile()\`. [Làm việc với entity graph](#/docs/jpa-12) đọc kỹ, gõ lại \`@NamedEntityGraph\` với \`attributeNodes\`/\`subgraphs\`, hint \`javax.persistence.loadgraph\` so với \`javax.persistence.fetchgraph\`, và đọc chậm đoạn nói entity graph chỉ sửa được fetch plan (dữ liệu nào), không sửa được fetch strategy (nạp thế nào).

**Bẫy.** Nghĩ rằng dùng \`DISTINCT\` trong SQL hay ở tầng ứng dụng có thể loại bỏ bản trùng của một tích Descartes. Mục Vấn đề tích Descartes nói thẳng: "chúng ta không thể loại bỏ những bản trùng lặp này ở mức SQL; toán tử DISTINCT của SQL không giúp được ở đây" — Hibernate chỉ loại trùng khi biên dịch result set thành instance và collection trong bộ nhớ. Bẫy thứ hai: nhầm hint \`javax.persistence.fetchgraph\` với \`javax.persistence.loadgraph\`. Mục Làm việc với entity graph cảnh báo: với fetch graph, "mọi thuộc tính và collection không có trong plan sẽ trở thành FetchType.LAZY, và mọi node trong plan sẽ là FetchType.EAGER" — nó bỏ qua mọi thiết lập \`FetchType\` trong ánh xạ, khác hẳn load graph vốn giữ nguyên \`FetchType\` mặc định cho những gì không có trong đồ thị.

**Tự kiểm tra.** Kích thước của tích Descartes phụ thuộc vào điều gì, và property nào giới hạn số table Hibernate \`JOIN\` khi eager-load các association \`@ManyToOne\`/\`@OneToOne\`? Khác biệt giữa hint \`javax.persistence.loadgraph\` và \`javax.persistence.fetchgraph\` là gì đối với những thuộc tính không nằm trong entity graph?`,
      },
      {
        id: "jp-w10-3",
        text: "Cascade các chuyển đổi trạng thái, và chặn sự kiện",
        lesson: `**Mục tiêu.** Chọn đúng \`CascadeType\` cho một association để tự động detach/merge/refresh/replicate bắc cầu, và gắn được logic tùy chỉnh vào vòng đời entity bằng callback JPA, Hibernate Interceptor hoặc event listener lõi.

**Đọc.** [Cascade các chuyển đổi trạng thái](#/docs/jpa-13) mở mục bằng nhắc lại \`CascadeType.PERSIST\` và \`CascadeType.REMOVE\` đã dùng ở chương 8 cho \`Item\`/\`Bid\`, rồi nói mục này sẽ phân tích những tùy chọn cascade khác, ít được dùng hơn — đọc lướt để nắm bối cảnh. [Các tùy chọn cascade khả dụng](#/docs/jpa-13) đọc kỹ, ghi lại bảng 13.1: \`PERSIST\`/\`REMOVE\`/\`DETACH\`/\`MERGE\`/\`REFRESH\`/\`REPLICATE\`/\`ALL\`, mỗi tùy chọn gắn với đúng một thao tác của \`EntityManager\` hoặc \`Session\`. [Detach và merge bắc cầu](#/docs/jpa-13) đọc kỹ, gõ lại \`cascade = {CascadeType.DETACH, CascadeType.MERGE}\` trên collection \`bids\`, ví dụ \`detach()\` gỡ cả \`Item\` lẫn các bid đã nạp, rồi \`merge()\` một \`Item\` detached đã sửa \`name\` và thêm \`Bid\` mới — đọc chậm hộp "Eager fetch các association khi merge": Hibernate luôn nạp eager bằng \`JOIN\` các association mang \`CascadeType.MERGE\` khi merge, bất kể chúng được ánh xạ \`FetchType.LAZY\`. [Cascade refresh](#/docs/jpa-13) đọc kỹ, gõ lại \`cascade = {CascadeType.PERSIST, CascadeType.REFRESH}\` trên \`billingDetails\`, và đọc chậm đoạn nói \`refresh()\` cascade tới từng \`BillingDetails\` managed bằng một \`SELECT\` riêng cho mỗi cái rồi nạp lại eager toàn bộ collection để tìm bản ghi mới — Hibernate "rõ ràng có thể làm việc này bằng một lệnh SELECT" nhưng không làm vậy. [Cascade replication](#/docs/jpa-13) đọc lướt, chỉ cần nắm \`@org.hibernate.annotations.Cascade(CascadeType.REPLICATE)\` và \`Session#replicate()\` dùng để sao chép dữ liệu detached sang một cơ sở dữ liệu khác.

[Lắng nghe và chặn sự kiện](#/docs/jpa-13) mở mục bằng liệt kê ba API: lifecycle callback/event listener chuẩn JPA, \`org.hibernate.Interceptor\` riêng, và SPI sự kiện lõi \`org.hibernate.event\` — đọc lướt để nắm bối cảnh. [Event listener và callback của JPA](#/docs/jpa-13) đọc kỹ, gõ lại phương thức đánh dấu \`@PostPersist\` trong một entity listener (constructor \`public\` không tham số, phi trạng thái), bảng 13.2 các annotation callback (\`@PostLoad\`, \`@PrePersist\`, \`@PostPersist\`, \`@PreUpdate\`/\`@PostUpdate\`, \`@PreRemove\`/\`@PostRemove\`), \`@EntityListeners\` nhận mảng class, và cách đặt callback ngay trên entity class (không đối số, \`this\` là entity hiện tại). [Hiện thực Hibernate interceptor](#/docs/jpa-13) đọc kỹ, gõ lại interface đánh dấu \`Auditable\`, entity \`AuditLogRecord\`, class mở rộng \`EmptyInterceptor\` ghi đè \`onSave()\`/\`onFlushDirty()\` để thu thập instance \`Auditable\`, rồi \`postFlush()\` mở một \`Session\` tạm bằng \`sessionWithOptions().connection().openSession()\` để ghi \`AuditLogRecord\` — đọc chậm cảnh báo về \`hibernate.ejb.interceptor\`: interceptor mặc định này dùng chung cho mọi \`Session\` nên phải an toàn với đa luồng. [Hệ thống sự kiện lõi](#/docs/jpa-13) đọc lướt, chỉ cần nắm mỗi phương thức của \`Session\`/\`EntityManager\` ứng với một sự kiện (như \`find()\`/\`load()\` kích hoạt \`LoadEvent\` xử lý bởi \`DefaultLoadEventListener\`), cách viết listener tùy chỉnh mở rộng \`DefaultLoadEventListener\`, và bật nó bằng property \`hibernate.ejb.event.<loại sự kiện>\` trong persistence.xml.

**Bẫy.** Merge một \`Item\` detached mà collection \`bids\` hay proxy \`seller\` của nó chưa từng được khởi tạo, rồi ngạc nhiên khi thấy một câu \`SELECT\` \`JOIN\` được thực thi. Hộp "Eager fetch các association khi merge" giải thích: "CascadeType.MERGE khiến Hibernate bỏ qua và thực chất ghi đè mọi ánh xạ FetchType.LAZY" — Hibernate luôn nạp eager bằng \`JOIN\` các association mang cascade \`MERGE\` khi merge, dù chúng ánh xạ lazy. Bẫy thứ hai: bật một Interceptor tùy chỉnh làm mặc định toàn cục qua property \`hibernate.ejb.interceptor\` mà không kiểm tra tính an toàn đa luồng của nó. Sách cảnh báo thẳng: "khác với interceptor có phạm vi session, Hibernate dùng chung interceptor mặc định này, nên nó phải an toàn với đa luồng! AuditLogInterceptor ví dụ thì không an toàn với đa luồng."

**Tự kiểm tra.** Vì sao \`merge()\` một \`Item\` detached với collection \`bids\` đã sửa lại sinh ra một \`SELECT\` \`JOIN\` nạp cả \`bids\`, dù \`bids\` được ánh xạ \`FetchType.LAZY\`? Cascade \`REFRESH\` trên \`billingDetails\` thực thi bao nhiêu câu \`SELECT\` để refresh một \`User\` có 2 \`BillingDetails\`, và vì sao sách gọi cách làm này là chưa tối ưu?`,
      },
      {
        id: "jp-w10-4",
        text: "Auditing bằng Envers, và data filter động",
        lesson: `**Mục tiêu.** Đọc và truy vấn được lịch sử một entity qua các revision của Hibernate Envers, và giới hạn động dữ liệu một Session nhìn thấy bằng data filter mà không phải sửa từng truy vấn trong ứng dụng.

**Đọc.** [Auditing và versioning với Hibernate Envers](#/docs/jpa-13) mở mục bằng so sánh Envers với các hệ quản lý phiên bản như Subversion và Git — đọc lướt để nắm bối cảnh: Envers dùng SPI sự kiện của Hibernate ở mục trước, nhóm mọi sửa đổi trong một transaction thành một change set gắn một số revision. [Bật audit logging](#/docs/jpa-13) đọc kỹ, gõ lại \`@org.hibernate.envers.Audited\` trên \`Item\` và \`@NotAudited\` trên collection \`bids\`, và chú ý các table bổ sung \`ITEM_AUD\`/\`USERS_AUD\`/\`REVINFO\` với cột \`REVTYPE\` — Envers không bao giờ tự động xóa thông tin revision hay dữ liệu lịch sử. [Tạo audit trail](#/docs/jpa-13) đọc lướt, chỉ cần thấy rằng ba transaction bình thường (persist, sửa, remove) tự động tạo ba change set mà không cần mã đặc biệt nào. [Tìm các revision](#/docs/jpa-13) đọc kỹ, gõ lại \`AuditReaderFactory.get(em)\`, \`getRevisionNumberForDate()\`, \`getRevisions(Item.class, ITEM_ID)\`, và truy vấn \`forRevisionsOfEntity()\` trả về \`List<Object[]>\` gồm entity, revision, \`RevisionType\` (\`ADD\`/\`MOD\`/\`DEL\`). [Truy cập dữ liệu lịch sử](#/docs/jpa-13) đọc kỹ, gõ lại \`AuditReader#find(Item.class, ITEM_ID, revision)\` và đọc chậm đoạn nói instance trả về không ở trạng thái persistent — nên coi chúng là detached hoặc chỉ đọc; cũng gõ lại \`forEntitiesAtRevision()\` với \`add()\`/\`addOrder()\`/\`setFirstResult()\`/\`setMaxResults()\` và \`addProjection()\`.

[Data filter động](#/docs/jpa-13) mở mục bằng ví dụ ranking: một \`User\` chỉ được đặt bid cho \`Item\` do seller có ranking bằng hoặc thấp hơn — đọc kỹ vì ví dụ này xuyên suốt mục. [Định nghĩa data filter động](#/docs/jpa-13) đọc kỹ, gõ lại \`@org.hibernate.annotations.FilterDef\` với tên duy nhất trong một persistence unit và \`@ParamDef\` khai báo tham số kiểu \`int\`. [Áp dụng data filter động](#/docs/jpa-13) đọc kỹ, gõ lại \`@org.hibernate.annotations.Filter\` trên \`Item\` với \`condition\` là một subquery SQL phải cho \`true\` để một dòng được lọt qua. [Bật data filter động](#/docs/jpa-13) đọc kỹ, gõ lại \`Session#enableFilter("limitByUserRanking")\` rồi \`filter.setParameter()\`, và đọc chậm đoạn nói bộ lọc không áp dụng cho \`em.find()\` theo định danh lẫn cho association nhiều-một/một-một. [Lọc việc truy cập collection](#/docs/jpa-13) đọc kỹ, gõ lại \`@Filter\` áp trên ánh xạ \`@OneToMany\` của \`Category#items\`, và \`defaultCondition\` trong \`@FilterDef\` để khỏi lặp lại chuỗi SQL.

**Bẫy.** Kỳ vọng \`em.find(Item.class, ITEM_ID)\` cũng bị lọc bởi data filter động đang bật. Mục Bật data filter động nói thẳng: "Hibernate không áp dụng bộ lọc cho các thao tác truy xuất theo định danh", và "lập luận tương tự áp dụng cho việc lọc các association nhiều-một hay một-một" — nếu lọc một association nhiều-một, bội số của nó sẽ đổi và "bạn sẽ không biết item có seller hay không, hay là bạn không được phép nhìn thấy nó." Bẫy thứ hai: sửa một instance \`Item\` do \`AuditReader#find()\` trả về rồi mong Hibernate lưu thay đổi. Mục Truy cập dữ liệu lịch sử cảnh báo: "các instance entity trả về không ở trạng thái persistent... Hãy coi các instance entity do API AuditReader trả về là detached, hoặc chỉ đọc."

**Tự kiểm tra.** Vì sao data filter động \`limitByUserRanking\` không lọc được kết quả của \`em.find(Item.class, ITEM_ID)\` dù nó lọc đúng khi ta duyệt collection \`Category#items\`? Nếu bạn \`remove()\` một \`Item\` đã bật \`@Audited\` rồi sửa instance mà \`AuditReader#find()\` trả về ở một revision cũ, điều gì xảy ra với dữ liệu trong cơ sở dữ liệu?`,
      },
    ],
  },
  {
    id: "jp-w11",
    week: "Tuần 11",
    title: "Ráp vào Spring bằng tay, và một lựa chọn nhẹ hơn",
    goal: "Viết được tầng persistence bằng mẫu DAO mà không có Spring Data, để hiểu Spring Data giấu đi cái gì — rồi so nó với Spring Data JDBC, nơi không có persistence context.",
    practice: "Chuyển một repository Spring Data JPA sang Spring Data JDBC. So hai bên ở hai điểm chương 15 nhấn: cách mô hình hoá quan hệ, và SQL sinh ra khi đọc một đối tượng có collection con.",
    resources: [
      { label: "JPA 14 — Tích hợp JPA và Hibernate với Spring", href: "#/docs/jpa-14" },
      { label: "JPA 15 — Làm việc với Spring Data JDBC", href: "#/docs/jpa-15" },
    ],
    items: [
      {
        id: "jp-w11-1",
        text: "Dependency injection và ứng dụng JPA dùng Spring theo mẫu DAO",
        lesson: `**Mục tiêu.** Hiện thực được một tầng persistence bằng mẫu DAO viết tay trên Spring, biết vì sao \`EntityManager\` tiêm vào DAO phải dùng \`PersistenceContextType.EXTENDED\`, và tổng quát hóa các DAO lặp lại bằng một interface generic.

**Đọc.** [Spring Framework và dependency injection](#/docs/jpa-14) đọc kỹ toàn bộ mục, gõ lại ý tưởng cốt lõi: với một thư viện bạn gọi nó, còn với một framework thì nó gọi bạn (inversion of control); IoC container kết hợp class ứng dụng với metadata cấu hình để tạo bean — bean là các object dưới sự quản lý của container. [Ứng dụng JPA dùng Spring và mẫu DAO](#/docs/jpa-14) đọc kỹ toàn bộ, gõ lại interface \`ItemDao\`/\`BidDao\` và hiện thực \`ItemDaoImpl\`/\`BidDaoImpl\` đánh dấu \`@Repository\` \`@Transactional\`, và đọc chậm đoạn về \`@PersistenceContext(type = PersistenceContextType.EXTENDED)\`: đây là điểm quan trọng nhất của mục, giữ persistence context sống suốt vòng đời bean. Đọc kỹ ba tình huống cuối mục nói khi nào nên chọn cách tiếp cận DAO này thay vì Spring Data. [Tổng quát hóa ứng dụng JPA dùng Spring và DAO](#/docs/jpa-14) đọc kỹ, gõ lại interface \`GenericDao<T>\` với \`getById\`/\`getAll\`/\`insert\`/\`delete\`/\`update(id, propertyName, propertyValue)\`/\`findByProperty(propertyName, propertyValue)\`, và \`AbstractGenericDao<T>\` hiện thực chung bằng cách nối chuỗi tên class vào JPQL; \`ItemDaoImpl\` chỉ ghi đè \`insert()\`/\`delete()\` để cascade sang \`Bid\`, còn \`BidDaoImpl\` kế thừa nguyên vẹn.

**Bẫy.** Tiêm \`EntityManager\` vào DAO bằng \`PersistenceContextType.TRANSACTION\` mặc định thay vì \`EXTENDED\`. Mục Ứng dụng JPA dùng Spring và mẫu DAO cảnh báo thẳng: "Nếu chúng ta dùng kiểu mặc định PersistenceContextType.TRANSACTION, object trả về sẽ trở nên detached khi kết thúc việc thực thi một transaction. Việc truyền nó vào phương thức delete sẽ dẫn tới ngoại lệ 'IllegalArgumentException: Removing a detached instance'." Bẫy thứ hai: nghĩ giao entity manager và transaction hoàn toàn cho Spring quản lý (qua inversion of control) không có đánh đổi gì. Sách nhắc: "Đánh đổi là bạn mất khả năng gỡ lỗi các transaction. Hãy lưu ý điều đó."

**Tự kiểm tra.** Nếu \`EntityManager\` tiêm vào một DAO dùng \`PersistenceContextType.TRANSACTION\` thay vì \`EXTENDED\`, object trả về ở trạng thái nào sau khi transaction kết thúc, và lỗi gì xuất hiện khi bạn truyền nó vào \`delete()\`? \`GenericDao<T>\` tổng quát hóa những thao tác nào để nhiều DAO không phải lặp lại mã gần giống nhau, và vì sao \`ItemDaoImpl\` vẫn phải ghi đè \`insert()\`/\`delete()\`?`,
      },
      {
        id: "jp-w11-2",
        text: "Cùng hai bước ấy cho ứng dụng Hibernate native",
        lesson: `**Mục tiêu.** Viết lại cùng tầng DAO bằng API Hibernate thuần (\`SessionFactory\`/\`Session\`) thay vì JPA, và biết khi nào \`getCurrentSession()\` an toàn, khi nào phải tự mở và đóng \`Session\`.

**Đọc.** [Ứng dụng Hibernate dùng Spring và mẫu DAO](#/docs/jpa-14) đọc kỹ toàn bộ, gõ lại \`@Autowired SessionFactory sessionFactory\` thay cho \`@PersistenceContext EntityManager\`, và \`sessionFactory.getCurrentSession()\` tạo một \`Session\` mới nếu chưa có hoặc dùng session hiện có từ context của Hibernate, tự flush và đóng khi transaction kết thúc — đọc chậm đoạn phân biệt ứng dụng đơn luồng (\`getCurrentSession()\` lý tưởng) với đa luồng (phải dùng \`openSession()\` và tự đóng, hoặc try-with-resources vì \`Session\` hiện thực \`AutoCloseable\`). Chú ý \`delete()\` trong \`ItemDaoImpl\` dùng hai lệnh HQL bulk (\`delete from Bid b where b.item.id = :id\` rồi \`delete from Item i where i.id = :id\`) thay vì lặp \`remove()\` từng \`Bid\` như bản JPA. Đọc lướt phần \`SpringConfiguration\`: \`LocalSessionFactoryBean\` thay \`LocalContainerEntityManagerFactoryBean\`, \`HibernateTransactionManager\` thay \`JpaTransactionManager\`, và \`hibernateProperties()\` đặt \`AvailableSettings.HBM2DDL_AUTO\`/\`SHOW_SQL\`/\`DIALECT\`. [Tổng quát hóa ứng dụng Hibernate dùng Spring và DAO](#/docs/jpa-14) đọc kỹ, gõ lại \`AbstractGenericDao<T>\` viết lại bằng \`sessionFactory.getCurrentSession().createQuery(...)\` cho \`getById\`/\`getAll\`/\`update\`/\`findByProperty\`, và \`delete()\` gọi thẳng \`sessionFactory.getCurrentSession().delete(entity)\` — API \`Session\` gốc, không phải \`em.remove()\`; \`ItemDaoImpl\`/\`BidDaoImpl\` theo đúng mẫu ghi đè như bản JPA.

**Bẫy.** Dùng \`sessionFactory.getCurrentSession()\` trong một ứng dụng đa luồng như thể nó luôn an toàn. Sách nói thẳng: "Trong ứng dụng đa luồng, session không an toàn với đa luồng, nên bạn nên dùng sessionFactory.openSession() và đóng session đã mở một cách tường minh." Bẫy thứ hai: mang nguyên mẫu \`delete()\` kiểu JPA (lặp \`remove()\` từng \`Bid\`) sang bản Hibernate mà không để ý \`ItemDaoImpl\` ở đây xóa bằng hai lệnh HQL bulk delete (\`delete from Bid b where b.item.id = :id\` rồi \`delete from Item i where i.id = :id\`) — nếu bạn tự thêm một association cascade mới, hai lệnh bulk này sẽ không tự cascade theo, khác với vòng lặp \`remove()\` bên bản JPA.

**Tự kiểm tra.** Vì sao sách khuyên trong ứng dụng đa luồng nên dùng \`sessionFactory.openSession()\` và tự đóng, thay vì \`sessionFactory.getCurrentSession()\`? \`ItemDaoImpl\` bản Hibernate xóa mọi \`Bid\` và \`Item\` bằng cách nào, và điều đó khác gì với vòng lặp \`remove()\` ở bản JPA?`,
      },
      {
        id: "jp-w11-3",
        text: "Dựng dự án Spring Data JDBC và truy vấn trong nó",
        lesson: `**Mục tiêu.** Dựng được một dự án Spring Data JDBC chạy trên MySQL, và viết đúng query method theo cơ chế query builder — kể cả khi cần giới hạn, sắp xếp, phân trang, streaming hay truy vấn SQL tùy chỉnh.

**Đọc.** [Tạo một dự án Spring Data JDBC](#/docs/jpa-15) đọc kỹ toàn bộ mục, gõ lại hai dependency cần thêm (\`spring-boot-starter-data-jdbc\` và \`mysql-connector-java\`), và đọc chậm đoạn về \`spring.sql.init.mode=always\` trong application.properties — cần vì script khởi tạo mặc định chỉ chạy cho cơ sở dữ liệu nhúng còn ở đây dùng MySQL. Chú ý ba annotation đặc thù Spring khác với JPA: \`org.springframework.data.relational.core.mapping.Table\`, \`org.springframework.data.annotation.Id\`, \`org.springframework.data.relational.core.mapping.Column\`, và \`UserRepository\` mở rộng \`CrudRepository<User, Long>\`.

[Làm việc với truy vấn trong Spring Data JDBC](#/docs/jpa-15) mở mục bằng nhắc rằng kể từ phiên bản 2.0, Spring Data JDBC có cơ chế query builder tương tự Spring Data JPA — đọc lướt để nắm bối cảnh, chú ý các query method định nghĩa chỉ dùng được property đưa vào \`WHERE\`, không join, và tên phương thức sai sẽ lỗi lúc application context được nạp. [Định nghĩa query method với Spring Data JDBC](#/docs/jpa-15) đọc kỹ, ghi lại bảng 15.1: \`Is\`/\`Equals\`, \`And\`, \`Or\`, \`LessThan\`(\`Equal\`), \`GreaterThan\`(\`Equal\`), \`Between\`, \`OrderBy\`, \`Like\`/\`NotLike\`, \`Before\`/\`After\`, \`Null\`/\`NotNull\`, \`Not\`. [Giới hạn kết quả truy vấn, sắp xếp và phân trang](#/docs/jpa-15) đọc kỹ, gõ lại từ khóa \`first\`/\`top\` (mặc định kích thước 1 nếu không kèm số), và \`Pageable\`/\`PageRequest\` cùng \`Sort\`/\`Sort.TypedSort\` cho sắp xếp và phân trang. [Streaming kết quả](#/docs/jpa-15) đọc kỹ, gõ lại kiểu trả về \`Streamable<User>\`, có thể nối bằng \`and()\` rồi gọi \`stream()\`, và đọc chậm đoạn nói phải đóng stream (try-with-resources hoặc \`close()\` tường minh) nếu không sẽ giữ kết nối cơ sở dữ liệu. [Annotation @Query](#/docs/jpa-15) đọc kỹ, gõ lại: khác Spring Data JPA, truy vấn ở đây là SQL thuần chứ không phải JPQL nên không có tính khả chuyển, và tham số phải được đặt tên rồi gắn bằng \`@Param\`. [Modifying query](#/docs/jpa-15) đọc kỹ, gõ lại \`@Modifying\` kết hợp \`@Query\` cho \`UPDATE\`/\`DELETE\`/DDL, và chú ý tại thời điểm viết sách, Spring Data JDBC chưa hỗ trợ suy dẫn truy vấn cho phương thức xóa.

**Bẫy.** Quên đặt \`spring.sql.init.mode=always\` khi chạy trên MySQL thật thay vì cơ sở dữ liệu nhúng. Mục Tạo một dự án Spring Data JDBC giải thích: "Vì script khởi tạo theo mặc định chỉ chạy cho các cơ sở dữ liệu nhúng, và chúng ta đang dùng MySQL, chúng ta sẽ phải ép việc thực thi script bằng cách đặt chế độ khởi tạo spring.sql.init.mode là always." Bẫy thứ hai: dùng một query method trả về \`Streamable\`/\`Stream\` rồi không đóng nó. Mục Streaming kết quả cảnh báo: "Nếu không, stream sẽ giữ kết nối bên dưới tới cơ sở dữ liệu."

**Tự kiểm tra.** Vì sao chúng ta phải đặt \`spring.sql.init.mode=always\` trong application.properties khi dùng MySQL với Spring Data JDBC, mà không cần với cơ sở dữ liệu nhúng? Nếu một query method trả về \`Stream<User>\` không được đóng bằng try-with-resources hay \`close()\` sau khi dùng, điều gì xảy ra?`,
      },
      {
        id: "jp-w11-4",
        text: "Mô hình hoá quan hệ với Spring Data JDBC",
        lesson: `**Mục tiêu.** Chọn đúng cách khai báo trường association trong Spring Data JDBC để có được đúng loại quan hệ một-một, embedded, một-nhiều hay nhiều-nhiều, và biết khi nào một query method đúng tên vẫn cần \`@Query\` tường minh.

**Đọc.** [Mô hình hóa quan hệ với Spring Data JDBC](#/docs/jpa-15) mở mục bằng nhắc rằng đây là bài toán trung tâm của ORM đã giải quyết bằng JPA và Spring Data JPA ở chương 8, còn Spring Data JDBC dùng một cơ chế khác hẳn — không có \`@OneToOne\`/\`@OneToMany\`/\`@ManyToMany\`. [Mô hình hóa quan hệ một-một với Spring Data JDBC](#/docs/jpa-15) đọc kỹ, gõ lại \`@MappedCollection(idColumn = "USER_ID")\` trên một field tham chiếu đơn \`Address address\` trong \`User\` — một tham chiếu \`Address\` duy nhất là điều khiến quan hệ trở thành một-một, và \`ADDRESSES.USER_ID\` vừa là khóa chính vừa là khóa ngoại về \`USERS.ID\`. [Mô hình hóa embedded entity với Spring Data JDBC](#/docs/jpa-15) đọc kỹ, gõ lại \`@Embedded(onEmpty = Embedded.OnEmpty.USE_NULL)\` nhúng \`STREET\`/\`CITY\` thẳng vào table \`USERS\`, field \`address\` thành \`null\` nếu các cột nhúng đều rỗng, và \`Address\` không còn đánh dấu \`@Table\` vì không có table riêng. [Mô hình hóa quan hệ một-nhiều với Spring Data JDBC](#/docs/jpa-15) đọc kỹ, gõ lại cùng \`@MappedCollection(idColumn = "USER_ID")\` nhưng lần này trên field \`Set<Address> addresses\` — kiểu collection là điều khiến quan hệ trở thành một-nhiều, với \`ADDRESSES\` có khóa chính riêng và khóa ngoại \`USER_ID\` kèm \`ON DELETE CASCADE\`. [Mô hình hóa quan hệ nhiều-nhiều với Spring Data JDBC](#/docs/jpa-15) đọc kỹ, gõ lại class trung gian \`UserAddress\` đánh dấu \`@Table("USERS_ADDRESSES")\` chỉ giữ \`addressId\`, và \`User\` có \`Set<UserAddress> addresses\` cùng \`@MappedCollection(idColumn = "USER_ID")\` — cần tới ba repository (\`User\`, \`Address\`, \`UserAddress\`) cho quan hệ này.

**Bẫy.** Đặt tên một query method đúng quy ước (như \`countByUserId\`) rồi kỳ vọng Spring Data JDBC tự suy dẫn được truy vấn. Mục Mô hình hóa quan hệ một-nhiều với Spring Data JDBC nói thẳng: "Dù tên phương thức countByUserId theo đúng mẫu đã bàn cho cả Spring Data JDBC lẫn Spring Data JPA, phương thức vẫn cần được đánh dấu bằng @Query, vì userId không tồn tại trong class Address" — cùng lý do lặp lại ở quan hệ nhiều-nhiều với class \`UserAddress\`. Bẫy thứ hai: nhầm quan hệ một-một với một-nhiều vì cả hai dùng chung một annotation \`@MappedCollection(idColumn = "USER_ID")\` — thứ phân biệt hai quan hệ này không phải annotation mà là kiểu của field: một tham chiếu \`Address address\` đơn lẻ cho một-một, còn \`Set<Address> addresses\` cho một-nhiều.

**Tự kiểm tra.** Vì sao phương thức \`countByUserId\` trong \`AddressOneToManyRepository\` và \`UserAddressManyToManyRepository\` phải được đánh dấu bằng \`@Query\` dù tên đã theo đúng quy ước đặt tên của query method? Cùng dùng \`@MappedCollection(idColumn = "USER_ID")\`, điều gì trong khai báo field của \`User\` quyết định đó là quan hệ một-một hay một-nhiều?`,
      },
    ],
  },
];
