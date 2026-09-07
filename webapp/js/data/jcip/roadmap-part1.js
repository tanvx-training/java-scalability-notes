// Lộ trình đọc Java Concurrency in Practice — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Java Concurrency in Practice" (Brian Goetz với
// Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea —
// Addison-Wesley, 2006). Thư mục nguồn: sources/jcip/
// Bản dịch gồm chương 2–8, 10, 11, 13–16 và phụ lục A; chương 1, 9 (GUI) và
// 12 (kiểm thử chương trình concurrent) không thuộc phạm vi và không có PDF gốc.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jc-w<N> / jc-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jcipWeeksPart1 = [
  {
    id: "jc-w1",
    week: "Tuần 1",
    title: "Thread safety, atomicity và locking",
    goal: "Nói được một class thread-safe nghĩa là gì bằng ngôn ngữ bất biến, nhận ra hai dạng race condition mà sách đặt tên, và biết bốn annotation mà mọi listing code về sau sẽ dùng.",
    practice:
      "Lấy servlet đếm số ở chương 2 (bản không đồng bộ), viết một test cho nhiều thread gọi đồng thời và làm cho bộ đếm sai. Sửa bằng `synchronized`, chạy lại test để nó xanh, rồi đo throughput hai bản và ghi lại chênh lệch — đó chính là cái giá của lock mà mục 2.5 nói tới.",
    resources: [
      { label: "JCiP 02 — Thread Safety", href: "#/docs/jcip-02" },
      { label: "JCiP A — Annotations for Concurrency", href: "#/docs/jcip-A" },
    ],
    items: [
      {
        id: "jc-w1-1",
        text: "Thread safety là gì, và stateless thì miễn nhiễm",
        lesson: `**Mục tiêu.** Định nghĩa được thread safety theo ngôn ngữ correctness và invariant — thay vì cảm tính "chạy được là an toàn" — và giải thích được vì sao một object hoàn toàn stateless luôn thread-safe.

**Đọc.** [2.1. Thread Safety là gì?](#/docs/jcip-02) mở đầu bằng việc phê phán những định nghĩa thread-safety mơ hồ kiểu "dùng được từ nhiều thread mà không có vấn đề" — đọc kỹ đoạn đó rồi đọc chậm định nghĩa chính thức dựa trên correctness và invariant mà sách đưa ra ngay sau. Rồi đọc [2.1.1. Ví dụ: Một Stateless Servlet](#/docs/jcip-02) — chú ý lý do \`StatelessFactorizer\` an toàn: nó không có field nào, nên state tạm thời của một request chỉ tồn tại trên stack riêng của thread đang xử lý request đó.

**Bẫy.** Nghĩ rằng "chạy qua hết test, hoạt động ổn nhiều năm" là bằng chứng đủ để coi một class là thread-safe — sách cảnh báo một chương trình thiếu synchronization vẫn có thể trông như chạy tốt rất lâu rồi fail bất ngờ vào một thời điểm bất kỳ. Bẫy thứ hai: nhầm "class không field" với "an toàn do may mắn" — lý do thật sự sách đưa ra là không có state nào bị share nên không có gì cần điều phối; chỉ cần servlet đó có thêm một field mutable, lập luận "vì nó stateless" không còn áp dụng được nữa.

**Tự kiểm tra.** Theo định nghĩa của sách, thread safety gắn với "chạy đúng bất kể cách runtime interleave các thread" hay gắn với "không bao giờ ném exception"? Vì sao \`StatelessFactorizer\` an toàn dù nó không hề dùng \`synchronized\`?`,
      },
      {
        id: "jc-w1-2",
        text: "Atomicity: race condition, lazy initialization và compound action",
        lesson: `**Mục tiêu.** Phân biệt được race condition dạng check-then-act với dạng read-modify-write, và giải thích được vì sao một compound action phải được thực thi atomic để tránh cả hai dạng đó.

**Đọc.** [2.2. Atomicity](#/docs/jcip-02) mở đầu bằng việc thêm một hit counter vào servlet stateless — đọc kỹ chỗ sách chỉ ra vì sao \`++count\` trong \`UnsafeCountingFactorizer\` tưởng như một thao tác nhưng thực ra là ba bước rời rạc. [2.2.1. Race Conditions](#/docs/jcip-02) đặt tên chính thức cho hiện tượng đó và giới thiệu dạng check-then-act qua ví dụ hẹn gặp ở hai quán cà phê cùng tên. [2.2.2. Ví dụ: Race Condition trong Lazy Initialization](#/docs/jcip-02) áp lại check-then-act vào \`LazyInitRace\` — đọc kỹ vì sao hai caller gọi \`getInstance\` cùng lúc có thể nhận về hai instance khác nhau. Rồi đọc [2.2.3. Compound Actions](#/docs/jcip-02) cho định nghĩa hình thức của atomic operation, và cách \`CountingFactorizer\` dùng \`AtomicLong\` để sửa vấn đề.

**Bẫy.** Tưởng cú pháp gọn gàng của \`count++\` đồng nghĩa với việc nó atomic — sách chỉ rõ đây là ảo giác cú pháp, thực chất là đọc giá trị hiện tại, cộng một, rồi ghi lại — ba operation rời rạc. Bẫy thứ hai: nghĩ một hit counter đếm sai một chút thì vô hại nên bỏ qua race condition — sách cảnh báo cùng kiểu lỗi read-modify-write đó, nếu áp cho việc sinh sequence hay ID duy nhất, sẽ gây hỏng toàn vẹn dữ liệu nghiêm trọng hơn nhiều.

**Tự kiểm tra.** \`UnsafeCountingFactorizer\` sai vì thao tác nào không atomic, và nó thực chất gồm mấy bước rời rạc? Trong \`LazyInitRace\`, điều gì khiến hai thread cùng gọi \`getInstance\` có thể nhận về hai instance \`ExpensiveObject\` khác nhau?`,
      },
      {
        id: "jc-w1-3",
        text: "Locking: intrinsic lock và tính reentrant",
        lesson: `**Mục tiêu.** Giải thích được vì sao làm cho từng biến state atomic riêng lẻ vẫn không đủ để một class thread-safe, và nói được intrinsic lock của Java bảo vệ cái gì cùng vì sao nó reentrant.

**Đọc.** [2.3. Locking](#/docs/jcip-02) mở đầu bằng một servlet nhớ đệm kết quả gần nhất — đọc kỹ chỗ sách chỉ ra rằng dùng hai biến atomic vẫn hỏng, vì bất biến ràng buộc hai biến đó với nhau. Rồi [2.3.1. Intrinsic Locks](#/docs/jcip-02) cho khối \`synchronized\` và monitor lock, và [2.3.2. Reentrancy](#/docs/jcip-02) — mục ngắn nhưng quan trọng: gõ lại ví dụ lớp con gọi \`super\` mà sách đưa ra, và tự hỏi điều gì xảy ra nếu lock không reentrant.

**Bẫy.** Nghĩ rằng cứ làm mọi biến thành atomic là xong. Sách nói thẳng: khi một bất biến ràng buộc nhiều biến với nhau, các biến đó phải được đọc và ghi trong **cùng một** atomic operation — atomic từng biến riêng lẻ không cứu được. Bẫy thứ hai: tưởng \`synchronized\` trên method là bảo vệ method; nó bảo vệ **object**, và mọi method \`synchronized\` của cùng một object dùng chung một lock.

**Tự kiểm tra.** Trong ví dụ servlet nhớ đệm, hai bất biến nào bị vi phạm khi dùng hai biến atomic riêng lẻ? Và nếu intrinsic lock không reentrant, đoạn mã lớp con gọi \`super\` sẽ xảy ra chuyện gì?`,
      },
      {
        id: "jc-w1-4",
        text: "Bảo vệ state bằng lock, cái giá của lock, và bộ annotation của sách",
        lesson: `**Mục tiêu.** Phát biểu đúng quy tắc "mọi biến tham gia cùng một invariant phải được cùng một lock bảo vệ", nhận ra đánh đổi giữa đơn giản và performance khi chọn phạm vi \`synchronized\` block, và biết bốn annotation \`@GuardedBy\`, \`@Immutable\`, \`@ThreadSafe\`, \`@NotThreadSafe\` mà các chương sau dùng liên tục.

**Đọc.** [2.4. Bảo vệ State bằng Lock](#/docs/jcip-02) — đọc kỹ quy tắc mọi biến trong cùng một invariant phải được cùng một lock bảo vệ, và ví dụ put-if-absent trên \`Vector\` cho thấy synchronize từng method riêng lẻ chưa chắc đủ cho một compound action. [2.5. Liveness và Performance](#/docs/jcip-02) theo dõi \`SynchronizedFactorizer\` bị nghẽn vì synchronize nguyên method \`service\`, rồi cách \`CachedFactorizer\` thu hẹp lock thành hai khối ngắn để lấy lại concurrency. Rồi đọc [A.1. Class Annotation](#/docs/jcip-A) cho ba annotation cấp class, và [A.2. Field và Method Annotation](#/docs/jcip-A) cho \`@GuardedBy\` cùng năm dạng đối số \`lock\` của nó.

**Bẫy.** Nghĩ rằng cứ đánh dấu mọi method là \`synchronized\` (như \`Vector\` làm) là đủ an toàn cho mọi cách dùng — sách chỉ ra thao tác put-if-absent trên \`Vector\` vẫn có race condition dù \`contains\` và \`add\` đều atomic riêng lẻ, vì bản thân chuỗi hai lời gọi đó không được bảo vệ như một khối duy nhất. Bẫy thứ hai: thu hẹp \`synchronized\` block quá đà, tách cả \`++hits\` ra thành một block riêng để "tối ưu" — sách cảnh báo điều này chỉ tổ tốn thêm chi phí acquire/release lock mà không mang lại lợi ích nào.

**Tự kiểm tra.** Vì sao thao tác put-if-absent trên \`Vector\` vẫn có race condition dù cả \`contains\` lẫn \`add\` đều là method \`synchronized\`? \`@GuardedBy("fieldName")\` khác \`@GuardedBy("this")\` ở điểm nào?`,
      },
    ],
  },
  {
    id: "jc-w2",
    week: "Tuần 2",
    title: "Chia sẻ object: visibility, confinement và safe publication",
    goal: "Giải thích được vì sao một thread ghi mà thread khác không thấy, và chọn đúng một trong các idiom safe publication cho từng tình huống.",
    practice:
      "Viết đoạn mã tái hiện lỗi visibility mà mục 3.1.1 mô tả — một thread chạy vòng lặp đọc biến cờ không `volatile`, thread khác đặt cờ, và vòng lặp không bao giờ dừng. Chạy với `-server` để thấy nó thật sự treo. Rồi sửa hai cách — bằng `volatile`, và bằng `synchronized` cho cả đọc lẫn ghi — và viết ra vì sao cả hai đều đúng nhưng khác nhau.",
    resources: [{ label: "JCiP 03 — Sharing Objects", href: "#/docs/jcip-03" }],
    items: [
      {
        id: "jc-w2-1",
        text: "Visibility: stale data, phép ghi 64-bit, và biến volatile",
        lesson: `**Mục tiêu.** Giải thích được vì sao thiếu synchronization có thể khiến một thread không bao giờ thấy giá trị mới do thread khác ghi, và biết khi nào \`volatile\` đủ dùng, khi nào không.

**Đọc.** [3.1. Visibility](#/docs/jcip-03) mở đầu bằng \`NoVisibility\` — đọc kỹ vì sao chương trình chỉ hai thread và hai shared variable này có thể in ra số không hoặc chạy mãi không dừng. [3.1.1. Stale Data](#/docs/jcip-03) đặt tên cho hiện tượng đó qua cặp \`MutableInteger\`/\`SynchronizedInteger\`. [3.1.2. Các Operation 64-bit không Atomic](#/docs/jcip-03) — mục ngắn, dễ bỏ sót: đọc kỹ trường hợp ngoại lệ của \`long\`/\`double\` không \`volatile\`. [3.1.3. Locking và Visibility](#/docs/jcip-03) nối lock với visibility, không chỉ mutual exclusion. [3.1.4. Biến Volatile](#/docs/jcip-03) — đọc kỹ ba điều kiện bắt buộc để dùng \`volatile\` an toàn, và ví dụ đếm cừu ở Listing 3.4.

**Bẫy.** Nghĩ rằng chỉ thao tác ghi cần synchronize, còn đọc thì không sao — sách nói thẳng đây là một sai lầm phổ biến, vì thread đọc không giữ đúng lock vẫn có thể thấy giá trị cũ. Bẫy thứ hai: coi \`volatile\` như một cách làm cho \`count++\` atomic — sách cảnh báo \`volatile\` chỉ đảm bảo visibility chứ không đảm bảo atomicity của một read-modify-write, trừ khi biến đó chỉ có đúng một thread từng ghi vào.

**Tự kiểm tra.** Vì sao \`NoVisibility\` có thể lặp vô hạn thay vì chỉ đơn giản in ra số không? Ba điều kiện nào phải đúng đồng thời thì mới được dùng \`volatile\` thay cho lock?`,
      },
      {
        id: "jc-w2-2",
        text: "Publication, escape, và thread confinement",
        lesson: `**Mục tiêu.** Nhận ra một object "escape" như thế nào trong lúc publish hoặc trong lúc construct, và chọn được giữa ba kỹ thuật thread confinement — ad-hoc, stack, \`ThreadLocal\`.

**Đọc.** [3.2. Publication và Escape](#/docs/jcip-03) — đọc kỹ khái niệm alien method và vì sao truyền một object cho nó cũng phải coi là publish object đó; xem qua \`UnsafeStates\` và \`ThisEscape\`. [3.2.1. Thực hành khởi tạo an toàn](#/docs/jcip-03) — đọc kỹ vì sao khởi động một thread ngay trong constructor là cách phổ biến khiến \`this\` escape, và cách \`SafeListener\` dùng private constructor cộng factory method để tránh điều đó. [3.3. Thread Confinement](#/docs/jcip-03) giới thiệu ý tưởng qua ví dụ Swing event thread và JDBC connection pool. Rồi đọc [3.3.1. Ad-hoc Thread Confinement](#/docs/jcip-03), [3.3.2. Stack Confinement](#/docs/jcip-03) và [3.3.3. ThreadLocal](#/docs/jcip-03) — đọc kỹ ví dụ \`ConnectionHolder\` và lời cảnh báo về lạm dụng \`ThreadLocal\` như một dạng biến toàn cục trá hình.

**Bẫy.** Tin rằng chỉ cần không lưu object vào field \`public\` là nó không escape — sách chỉ ra publish có thể xảy ra gián tiếp, chẳng hạn thêm một object vào một collection đã publish, hoặc truyền nó cho một alien method mà bạn không kiểm soát được hành vi. Bẫy thứ hai: khởi động một thread ngay trong constructor cho "tiện" — sách cảnh báo cách này gần như luôn làm lộ tham chiếu \`this\` của object mẹ ra ngoài trước khi nó construct xong, kể cả khi lệnh publish là dòng cuối cùng của constructor.

**Tự kiểm tra.** Vì sao truyền một object cho một alien method cũng bị coi là publish, dù bạn không hề lưu tham chiếu nào tới nó? \`ConnectionHolder\` dùng \`ThreadLocal\` để giải quyết vấn đề gì mà một \`Connection\` toàn cục dùng chung không giải quyết được?`,
      },
      {
        id: "jc-w2-3",
        text: "Immutability và final field",
        lesson: `**Mục tiêu.** Nêu đúng ba điều kiện để một object được coi là immutable, và giải thích được vì sao khai báo mọi field \`final\` chưa đủ để đảm bảo điều đó.

**Đọc.** [3.4. Immutability](#/docs/jcip-03) — đọc kỹ ba điều kiện định nghĩa immutable object, và ví dụ \`ThreeStooges\` cho thấy một immutable object vẫn có thể dùng một \`Set\` mutable bên trong miễn nó không bao giờ để lộ \`Set\` đó ra ngoài. [3.4.1. Final Fields](#/docs/jcip-03) — mục ngắn nhưng quan trọng, nói về semantics đặc biệt của \`final\` trong Java Memory Model. [3.4.2. Ví dụ: Dùng Volatile để Publish Immutable Object](#/docs/jcip-03) — đọc kỹ cách \`OneValueCache\` cùng \`VolatileCachedFactorizer\` giải quyết đúng bài toán mà \`UnsafeCachingFactorizer\` ở chương 2 làm hỏng.

**Bẫy.** Nghĩ rằng khai báo hết field là \`final\` là đủ để object immutable — sách chỉ rõ một field \`final\` vẫn có thể tham chiếu tới một object mutable, nên bản thân object đó vẫn có thể bị sửa qua tham chiếu ấy. Bẫy thứ hai: tưởng \`VolatileCachedFactorizer\` vẫn dính race condition giống \`UnsafeCachingFactorizer\` vì cùng quản lý hai giá trị liên quan nhau (số và các thừa số) — sách chỉ ra điểm khác biệt: gộp cả hai giá trị vào một immutable holder object duy nhất rồi mới gán qua field \`volatile\`, nên chỉ có một tham chiếu cần đọc/ghi, không phải hai biến rời rạc.

**Tự kiểm tra.** Vì sao \`ThreeStooges\` vẫn được coi là immutable dù nó dùng một \`Set\` mutable bên trong? \`OneValueCache\` giải quyết bài toán atomicity mà hai \`AtomicReference\` riêng lẻ ở chương 2 không giải quyết được bằng cách nào?`,
      },
      {
        id: "jc-w2-4",
        text: "Safe publication: chọn idiom nào cho tình huống nào",
        lesson: `**Mục tiêu.** Liệt kê đúng các idiom safe publication sách đưa ra, và chọn đúng yêu cầu publication tương ứng với ba mức khả biến: immutable, effectively immutable, mutable.

**Đọc.** [3.5. Safe Publication](#/docs/jcip-03) mở đầu bằng ví dụ publish một object qua một field \`public\` thông thường và cho thấy vì sao cách đó chưa đủ an toàn. [3.5.1. Publication không đúng cách](#/docs/jcip-03) — đọc kỹ ví dụ \`Holder\`/\`assertSanity\` để thấy một object được construct đúng vẫn có thể "tỏ ra" không nhất quán nếu publish sai cách. [3.5.2. Immutable Object và Initialization Safety](#/docs/jcip-03) giải thích bảo đảm đặc biệt mà Java Memory Model dành riêng cho immutable object. [3.5.3. Các Idiom cho Safe Publication](#/docs/jcip-03) — đọc kỹ danh sách các cách publish an toàn và danh sách các collection thread-safe tự động publish an toàn phần tử của chúng. [3.5.4. Object Effectively Immutable](#/docs/jcip-03) và [3.5.5. Mutable Object](#/docs/jcip-03) phân biệt rạch ròi ba mức khả biến. [3.5.6. Share Object một cách an toàn](#/docs/jcip-03) tổng hợp lại bằng bốn policy: thread-confined, shared read-only, shared thread-safe, guarded.

**Bẫy.** Nghĩ rằng một object được construct đúng (constructor chạy xong, invariant đã thiết lập) thì publish kiểu gì cũng an toàn — sách chứng minh ngược lại bằng \`Holder\`: \`assertSanity\` vẫn có thể ném \`AssertionError\` nếu publication không đúng cách, dù constructor của \`Holder\` hoàn toàn hợp lệ. Bẫy thứ hai: áp yêu cầu publication của immutable object cho một object chỉ "hiện tại chưa bị sửa" — sách phân biệt rõ effectively immutable (chỉ cần safe publication) với mutable object (cần safe publication cộng thêm thread-safe hoặc được lock bảo vệ ở mọi lần truy cập sau đó).

**Tự kiểm tra.** Kể tên các idiom safe publication mà 3.5.3 liệt kê cho một object được construct đúng cách. Nếu một giá trị \`Date\` trong \`Map\` không bao giờ bị sửa sau khi đưa vào, nó thuộc mức khả biến nào và cần yêu cầu publication gì?`,
      },
    ],
  },
  {
    id: "jc-w3",
    week: "Tuần 3",
    title: "Ghép object: confinement, uỷ quyền và tài liệu hoá policy",
    goal: "Xây được một class thread-safe từ các thành phần thread-safe có sẵn, và viết ra được synchronization policy của nó thay vì để nó nằm trong đầu.",
    practice:
      "Tuần này không có bài gõ tay riêng — chương 4 là chương thiết kế, cần đọc chậm và vẽ lại quan hệ sở hữu state. Nếu còn thời gian, quay lại bài thực hành tuần 2 và thử áp Java monitor pattern cho class bạn đã sửa.",
    resources: [{ label: "JCiP 04 — Composing Objects", href: "#/docs/jcip-04" }],
    items: [
      {
        id: "jc-w3-1",
        text: "Thiết kế class thread-safe: bất biến, operation phụ thuộc state, quyền sở hữu",
        lesson: `**Mục tiêu.** Nêu đúng ba yếu tố cơ bản trong quy trình thiết kế một thread-safe class, phân biệt được operation phụ thuộc state với operation thông thường, và giải thích được vì sao quyền sở hữu (ownership) — chứ không phải khả năng truy cập — mới quyết định biến nào thuộc state của một object.

**Đọc.** [4.1. Thiết kế một Thread-safe Class](#/docs/jcip-04) mở đầu bằng ba việc phải làm: xác định các biến tạo nên state, xác định các invariant ràng buộc chúng, và thiết lập một synchronization policy — đọc kỹ ví dụ \`Counter\` ở Listing 4.1, class chỉ có một field \`value\`. [4.1.1. Thu thập các yêu cầu về Synchronization](#/docs/jcip-04) — đọc kỹ khái niệm state space và chỗ sách nói một invariant ràng buộc nhiều biến (như \`NumberRange\` sẽ gặp lại ở mục sau) đòi hỏi các biến đó phải được đọc/ghi trong cùng một atomic operation, và lock bảo vệ chúng phải được giữ trong suốt operation đó. [4.1.2. Các Operation phụ thuộc State](#/docs/jcip-04) — mục ngắn, giới thiệu khái niệm precondition dựa trên state (như không lấy được phần tử từ queue rỗng) và vì sao chương trình concurrent có thêm lựa chọn "chờ" thay vì chỉ có "thất bại". [4.1.3. Quyền sở hữu State](#/docs/jcip-04) — đọc kỹ ví dụ \`HashMap\` (state logic gồm cả các \`Map.Entry\` nội bộ) và ví dụ \`ServletContext\` minh hoạ "split ownership": container sở hữu hạ tầng, ứng dụng sở hữu các object được lưu bằng \`setAttribute\`.

**Bẫy.** Nghĩ rằng có thể cập nhật một biến trong một invariant nhiều-biến, release lock, acquire lại rồi mới cập nhật biến còn lại — sách cảnh báo cách này có thể để object ở trạng thái không hợp lệ đúng lúc lock được release; lock phải được giữ **trong suốt** bất kỳ operation nào truy cập các biến liên quan. Bẫy thứ hai: nghĩ rằng một class sở hữu mọi object được truyền vào constructor hay method của nó — sách nói thẳng một class thường **không** sở hữu những object đó, trừ khi method được thiết kế để chuyển giao ownership một cách tường minh, như các factory method wrapper của synchronized collection.

**Tự kiểm tra.** Ba việc nào theo sách phải làm khi thiết kế một thread-safe class? Vì sao ví dụ \`ServletContext\` lại minh hoạ "split ownership" — phần nào của state thuộc về container, và phần nào thuộc về ứng dụng?`,
      },
      {
        id: "jc-w3-2",
        text: "Instance confinement và Java monitor pattern",
        lesson: `**Mục tiêu.** Giải thích được cơ chế instance confinement giúp một object không thread-safe vẫn được dùng an toàn, mô tả đúng Java monitor pattern, và theo dõi được vì sao \`getLocation\` của vehicle tracker bản monitor phải sao chép dữ liệu thay vì trả về tham chiếu trực tiếp.

**Đọc.** [4.2. Instance Confinement](#/docs/jcip-04) — đọc kỹ ví dụ \`PersonSet\` ở Listing 4.2: state của nó nằm trong một \`HashSet\` không thread-safe, nhưng vì \`HashSet\` đó là \`private\` và chỉ hai method \`synchronized\` (\`addPerson\`, \`containsPerson\`) đụng tới nó, toàn bộ state được bảo vệ nhất quán bởi một lock duy nhất. [4.2.1. Java Monitor Pattern](#/docs/jcip-04) — đọc kỹ định nghĩa: một object tuân theo pattern này encapsulate toàn bộ mutable state và bảo vệ nó bằng chính intrinsic lock của mình; xem lại \`Counter\` rồi đọc Listing 4.3, class dùng một **private lock** riêng thay vì intrinsic lock, và lý do sách đưa ra cho lựa chọn đó. [4.2.2. Ví dụ: Theo dõi đội xe](#/docs/jcip-04) — đọc kỹ hiện thực vehicle tracker dựa trên monitor (Listing 4.4) dùng \`MutablePoint\` (Listing 4.5): cả \`Map\` lẫn các \`MutablePoint\` bên trong không bao giờ được publish, \`getLocation\` trả về bản sao qua copy constructor hoặc \`deepCopy\`.

**Bẫy.** Nghĩ rằng một object bị confine sẽ tự động an toàn mãi mãi — sách cảnh báo confinement vẫn có thể bị vi phạm bằng cách publish chính object lẽ ra phải bị confine, hoặc gián tiếp hơn, bằng cách publish những object khác như iterator hay instance của inner class, thứ có thể "mượn đường" để lộ object bị confine ra ngoài. Bẫy thứ hai: nghĩ rằng chỉ cần bọc \`Map\` bằng \`unmodifiableMap\` là đủ để \`deepCopy\` an toàn — sách chỉ rõ cách đó chỉ bảo vệ **collection** khỏi bị sửa chứ không ngăn caller sửa các \`MutablePoint\` mutable bên trong; vì cùng lý do, điền \`HashMap\` mới qua một copy constructor cũng không hoạt động, vì chỉ tham chiếu tới point được sao chép chứ không phải bản thân object point.

**Tự kiểm tra.** Vì sao \`PersonSet\` thread-safe dù \`HashSet\` nền tảng của nó thì không? Vì sao \`deepCopy\` trong vehicle tracker bản monitor phải tự tạo bản sao từng \`MutablePoint\` thay vì chỉ bọc \`Map\` bằng \`unmodifiableMap\`?`,
      },
      {
        id: "jc-w3-3",
        text: "Uỷ quyền thread safety — và chỗ uỷ quyền thất bại",
        lesson: `**Mục tiêu.** Phân biệt được ba tình huống ủy quyền thread safety — một state variable duy nhất, nhiều state variable độc lập, và state variable bị ràng buộc bởi invariant — và giải thích được chính xác vì sao \`NumberRange\` không thread-safe dù cả hai state variable nền tảng của nó đều là \`AtomicInteger\`.

**Đọc.** [4.3. Ủy quyền Thread Safety (Delegating Thread Safety)](#/docs/jcip-04) mở đầu bằng \`CountingFactorizer\` — đọc lại vì sao nó thread-safe **vì** \`AtomicLong\` thread-safe, đây là hình mẫu của delegation. [4.3.1. Ví dụ: Vehicle Tracker dùng Delegation](#/docs/jcip-04) xây một vehicle tracker khác ủy quyền cho \`ConcurrentHashMap\` cùng một \`Point\` **immutable** (Listing 4.6, 4.7) — đọc kỹ điểm khác biệt so với bản monitor tuần trước: \`getLocations\` giờ trả về một view "sống" chứ không phải snapshot, và Listing 4.8 cho cách lấy lại một bản sao tĩnh nếu cần. [4.3.2. Các State Variable độc lập](#/docs/jcip-04) dùng \`VisualComponent\` (Listing 4.9) để cho thấy ủy quyền vẫn đúng khi có **nhiều** state variable, miễn chúng độc lập — ở đây là hai \`CopyOnWriteArrayList\` cho mouse listener và key listener. Rồi đọc kỹ [4.3.3. Khi Delegation thất bại](#/docs/jcip-04): \`NumberRange\` (Listing 4.10) dùng hai \`AtomicInteger\` cho \`lower\` và \`upper\`, nhưng áp thêm ràng buộc \`lower <= upper\` — theo dõi từng bước kịch bản \`setLower(5)\` và \`setUpper(4)\` chạy đồng thời trên range (0, 10). [4.3.4. Publish các State Variable nền tảng](#/docs/jcip-04) nêu điều kiện để publish một state variable an toàn, và [4.3.5. Ví dụ: Vehicle Tracker publish State của nó](#/docs/jcip-04) dùng \`SafePoint\` (Listing 4.11) — point mutable nhưng thread-safe — để xây \`PublishingVehicleTracker\` (Listing 4.12), publish thẳng state nền tảng mà vẫn thread-safe.

**Bẫy.** Tưởng cứ mọi state variable nền tảng thread-safe là composite chắc chắn thread-safe — \`NumberRange\` chứng minh ngược lại: dù \`lower\` và \`upper\` đều là \`AtomicInteger\`, chúng **không độc lập** vì bị ràng buộc bởi invariant \`lower <= upper\`, nên với một chút timing không may, hai thread gọi \`setLower\` và \`setUpper\` đồng thời có thể cùng vượt qua phép kiểm tra check-then-act và để range ở trạng thái không hợp lệ như (5, 4). Bẫy thứ hai: tưởng một state variable cứ thread-safe là publish được — sách chỉ rõ chỉ an toàn khi biến đó **không** tham gia bất kỳ invariant nào ràng buộc giá trị của nó và **không** có chuyển đổi state bị cấm; nếu để field \`value\` của \`Counter\` là \`public\`, client có thể gán nó một giá trị âm dù bản thân kiểu số nguyên đó thread-safe.

**Tự kiểm tra.** Vì sao \`NumberRange\` không thread-safe dù cả \`lower\` lẫn \`upper\` đều là \`AtomicInteger\`? Theo 4.3.4, một state variable thread-safe cần thoả thêm điều kiện gì nữa thì mới được publish an toàn?`,
      },
      {
        id: "jc-w3-4",
        text: "Thêm chức năng vào class có sẵn, và ghi tài liệu synchronization policy",
        lesson: `**Mục tiêu.** Phân biệt được các cách thêm một atomic operation mới vào một thread-safe class có sẵn — sửa trực tiếp, extend, client-side locking, composition — và nói được ghi tài liệu về thread safety khác ghi tài liệu về synchronization policy ở chỗ nào.

**Đọc.** [4.4. Thêm chức năng vào các Thread-safe Class có sẵn](#/docs/jcip-04) — đọc kỹ bài toán put-if-absent atomic trên một \`List\`, và vì sao sửa trực tiếp class gốc là cách an toàn nhất nhưng không phải lúc nào cũng khả thi; \`BetterVector\` (Listing 4.13) minh hoạ cách extend, và lý do extension "mong manh" hơn sửa trực tiếp. [4.4.1. Client-side Locking](#/docs/jcip-04) — đọc kỹ \`ListHelper\` **thất bại** ở Listing 4.14 rồi so với bản **đúng** ở Listing 4.15: cả hai đều khai báo \`putIfAbsent\` là \`synchronized\`, khác biệt nằm ở lock nào được dùng. [4.4.2. Composition](#/docs/jcip-04) — \`ImprovedList\` (Listing 4.16) thêm một tầng locking riêng bằng intrinsic lock của chính nó, không quan tâm \`List\` nền tảng có thread-safe hay không. [4.5. Ghi tài liệu về Synchronization Policy](#/docs/jcip-04) — đọc kỹ câu sách đóng khung: ghi tài liệu về bảo đảm thread safety cho client, ghi tài liệu về synchronization policy cho người bảo trì. [4.5.1. Diễn giải tài liệu mơ hồ](#/docs/jcip-04) — đọc kỹ lập luận "sẽ thật vô lý nếu nó không thread-safe" áp cho \`ServletContext\`, \`HttpSession\`, và \`DataSource\`.

**Bẫy.** Nghĩ rằng \`ListHelper\` ở Listing 4.14 đã an toàn vì \`putIfAbsent\` của nó được khai báo \`synchronized\` — sách chỉ rõ nó synchronize trên **sai lock**: bất kể \`List\` nền tảng dùng lock nào để bảo vệ state, chắc chắn đó không phải lock trên \`ListHelper\`, nên \`putIfAbsent\` chỉ tạo ra **ảo giác** về synchronization và không atomic so với các operation khác trên \`List\`. Bẫy thứ hai: giả định một class thread-safe chỉ vì nó "có vẻ nên thế" — sách nêu đích danh \`java.text.SimpleDateFormat\` **không** thread-safe, nhưng Javadoc của nó bỏ sót không nhắc điều này cho đến tận JDK 1.4, khiến nhiều developer bất ngờ khi dùng chung một instance từ nhiều thread.

**Tự kiểm tra.** Vì sao \`ListHelper.putIfAbsent\` ở Listing 4.14 không atomic dù bản thân method đó được khai báo \`synchronized\`? Theo 4.5, tài liệu về "bảo đảm thread safety" nên viết cho ai, và tài liệu về "synchronization policy" nên viết cho ai?`,
      },
    ],
  },
  {
    id: "jc-w4",
    week: "Tuần 4",
    title: "Building block của java.util.concurrent",
    goal: "Chọn đúng collection và đúng synchronizer cho từng bài toán, và hiểu vì sao `ConcurrentHashMap` không chỉ là `synchronizedMap` nhanh hơn.",
    practice:
      "Xây lại result cache của mục 5.6 theo đúng trình tự sách đưa ra: bắt đầu từ `HashMap` bọc `synchronized`, rồi `ConcurrentHashMap`, rồi `FutureTask`. Ở mỗi bước, chạy nhiều thread cùng yêu cầu một khoá và đếm số lần phép tính bị chạy trùng. Ba con số đó là bài học của mục này.",
    resources: [{ label: "JCiP 05 — Building Blocks", href: "#/docs/jcip-05" }],
    items: [
      {
        id: "jc-w4-1",
        text: "Synchronized collection và vì sao lặp trên nó vẫn hỏng",
        lesson: `**Mục tiêu.** Giải thích được vì sao các compound action trên synchronized collection — như \`getLast\`/\`deleteLast\` hay duyệt bằng iterator — vẫn có thể hỏng nếu không thêm client-side locking, và nhận ra được iterator ẩn trong những đoạn code không có vòng lặp tường minh.

**Đọc.** [5.1. Synchronized Collections](#/docs/jcip-05) — đọc lướt: \`Vector\`, \`Hashtable\`, và các wrapper \`Collections.synchronizedXxx\` đạt thread safety bằng cách synchronize mọi public method. [5.1.1. Vấn đề với Synchronized Collections](#/docs/jcip-05) — đọc kỹ \`getLast\` và \`deleteLast\` ở Listing 5.1, cả hai đều là chuỗi check-then-act trên \`Vector\`; theo dõi Figure 5.1 để thấy chính xác cách xen kẽ khiến \`getLast\` ném \`ArrayIndexOutOfBoundsException\`, rồi xem Listing 5.2 sửa bằng client-side locking, và Listing 5.3/5.4 cho rủi ro tương tự khi duyệt \`Vector\`. [5.1.2. Iterator và ConcurrentModificationException](#/docs/jcip-05) — đọc kỹ vì sao các iterator fail-fast dùng một modification count được kiểm tra **không có synchronization**, nên có thể bỏ sót một sửa đổi; và phương án thay thế là clone collection rồi duyệt bản sao. [5.1.3. Iterator ẩn](#/docs/jcip-05) — đọc kỹ \`HiddenIterator\` ở Listing 5.6: không có vòng lặp tường minh nào trong code, nhưng phép nối chuỗi vẫn kéo theo việc duyệt.

**Bẫy.** Nghĩ rằng vì \`Vector\` bản thân thread-safe nên \`getLast\` gọi trên nó luôn an toàn — sách chỉ ra nếu thread A gọi \`getLast\` trong khi thread B gọi \`deleteLast\` trên cùng \`Vector\`, với một chút timing không may, chỉ số tính được ở lời gọi \`size\` không còn hợp lệ khi \`get\` chạy tới, và \`getLast\` ném \`ArrayIndexOutOfBoundsException\` dù \`Vector\` vẫn hoàn toàn hợp lệ theo đặc tả của nó. Bẫy thứ hai: nghĩ rằng chỉ vòng lặp tường minh mới cần lo iterator — \`HiddenIterator\` cho thấy một lệnh in log nối chuỗi \`"..." + set\` bị compiler biến thành lời gọi \`toString\` của \`set\`, và \`toString\` của collection chuẩn tự duyệt qua từng phần tử, nên \`addTenThings\` có thể ném \`ConcurrentModificationException\` dù không hề có \`for\` hay \`while\` nào truy cập trực tiếp \`set\`.

**Tự kiểm tra.** Trong ví dụ \`getLast\`/\`deleteLast\`, hai lời gọi nào bên trong \`getLast\` tạo ra chuỗi check-then-act, và tại sao acquire lock của \`Vector\` trước khi gọi cả hai lại sửa được vấn đề? Vì sao đoạn code chỉ để in một thông điệp debug bằng nối chuỗi lại có thể ném \`ConcurrentModificationException\`?`,
      },
      {
        id: "jc-w4-2",
        text: "Concurrent collection: ConcurrentHashMap và CopyOnWriteArrayList",
        lesson: `**Mục tiêu.** Nêu được lock striping giúp \`ConcurrentHashMap\` scale tốt hơn \`Hashtable\`/\`synchronizedMap\` ở điểm nào, và giải thích được vì sao \`CopyOnWriteArrayList\` chỉ hợp lý khi duyệt phổ biến hơn nhiều so với sửa đổi.

**Đọc.** [5.2. Concurrent Collections](#/docs/jcip-05) — đọc lướt phần giới thiệu \`ConcurrentHashMap\`, \`CopyOnWriteArrayList\`, và interface \`ConcurrentMap\` mới hỗ trợ các compound action như put-if-absent. [5.2.1. ConcurrentHashMap](#/docs/jcip-05) — đọc kỹ cơ chế **lock striping** thay cho một lock chung, và việc semantics của \`size\`/\`isEmpty\` bị làm yếu đi thành ước lượng để đổi lấy performance tốt hơn cho \`get\`/\`put\`/\`containsKey\`/\`remove\`; chú ý cả điểm duy nhất \`Hashtable\` làm được mà \`ConcurrentHashMap\` thì không — lock map để truy cập độc quyền. [5.2.2. Các Atomic Map Operation bổ sung](#/docs/jcip-05) — mục ngắn: vì \`ConcurrentHashMap\` không lock được độc quyền, các compound action như put-if-absent, remove-if-equal, replace-if-equal được đặc tả sẵn thành atomic operation trên interface \`ConcurrentMap\` (Listing 5.7). [5.2.3. CopyOnWriteArrayList](#/docs/jcip-05) — đọc kỹ cách nó tạo và republish một bản sao mới của mảng nền tảng mỗi lần sửa, iterator giữ tham chiếu tới mảng tại thời điểm duyệt nên không bao giờ ném \`ConcurrentModificationException\`, và ví dụ hệ thống thông báo sự kiện là tình huống lý tưởng để dùng nó.

**Bẫy.** Nghĩ \`size()\` hay \`isEmpty()\` trên \`ConcurrentHashMap\` trả về một con số chính xác như trên \`HashMap\` — sách nói thẳng đây chỉ là **ước lượng**, vì kết quả có thể đã lỗi thời ngay khi vừa tính xong trong một collection đang bị nhiều thread sửa đổi. Bẫy thứ hai: mang thói quen client-side locking vừa học ở chương 4 (khoá \`Vector\` để tự chế put-if-absent) sang áp cho \`ConcurrentHashMap\` — sách chỉ rõ \`ConcurrentHashMap\` **không thể** bị lock để truy cập độc quyền, nên cách đúng là dùng các atomic method có sẵn của \`ConcurrentMap\` chứ không phải tự khoá nó.

**Tự kiểm tra.** \`ConcurrentHashMap\` đạt được concurrency tốt hơn \`Hashtable\` bằng cơ chế locking nào, và cái giá đánh đổi thể hiện ở hai method nào? \`CopyOnWriteArrayList\` phù hợp nhất khi tỉ lệ giữa duyệt và sửa đổi như thế nào, và vì sao?`,
      },
      {
        id: "jc-w4-3",
        text: "BlockingQueue, producer-consumer, và method interrupt được",
        lesson: `**Mục tiêu.** Giải thích được cách \`BlockingQueue\` hiện thực pattern producer-consumer, vì sao bounded queue là một công cụ quản lý tài nguyên, và biết đúng hai cách xử lý \`InterruptedException\` mà sách chấp nhận.

**Đọc.** [5.3. Blocking Queue và Pattern Producer-Consumer](#/docs/jcip-05) — đọc kỹ vì sao \`put\`/\`take\` có block giúp decouple producer và consumer, và đoạn sách nhấn mạnh **bounded queue là công cụ quản lý tài nguyên mạnh mẽ**; đọc lướt qua các hiện thực \`LinkedBlockingQueue\`, \`ArrayBlockingQueue\`, \`PriorityBlockingQueue\`, và \`SynchronousQueue\` — hiện thực đặc biệt "không phải một queue" vì nó chuyển giao trực tiếp giữa hai thread. [5.3.1. Ví dụ: Desktop Search](#/docs/jcip-05) — đọc lướt \`DiskCrawler\`/\`Indexer\` (Listing 5.8, 5.9) để thấy pattern áp dụng vào một bài toán cụ thể. [5.3.2. Serial Thread Confinement](#/docs/jcip-05) — đọc kỹ khái niệm chuyển giao quyền sở hữu một mutable object từ thread này sang thread khác qua safe publication, và cách object pool khai thác nó. [5.3.3. Deque và Work Stealing](#/docs/jcip-05) — đọc kỹ khác biệt với producer-consumer truyền thống: mỗi consumer có deque riêng, và khi hết việc thì "đánh cắp" từ **đuôi** deque của người khác để giảm tranh chấp. Rồi đọc [5.4. Các Method Blocking và Interruptible](#/docs/jcip-05) — đọc kỹ hai chính sách hợp lệ khi method của bạn gọi phải một blocking method: lan truyền \`InterruptedException\`, hoặc khôi phục interrupted status (Listing 5.10) khi bạn không thể ném checked exception.

**Bẫy.** Tin rằng consumer sẽ luôn theo kịp nên dùng một queue unbounded cho "an toàn" — sách cảnh báo đây là "công thức để phải kiến trúc lại hệ thống sau này": nếu producer tạo công việc nhanh hơn consumer xử lý, ứng dụng sẽ hết bộ nhớ vì work item chất đống không giới hạn; hãy đưa quản lý tài nguyên vào thiết kế ngay từ đầu bằng bounded queue. Bẫy thứ hai: bắt \`InterruptedException\` rồi **không làm gì cả** — sách nói thẳng đây là điều duy nhất bạn không nên làm với nó, vì làm vậy tước mất bằng chứng interrupt đã xảy ra khỏi code cao hơn trên call stack; ngoại lệ duy nhất chấp nhận được là khi bạn đang extend \`Thread\` và kiểm soát toàn bộ code phía trên.

**Tự kiểm tra.** Vì sao sách gọi bounded queue là "công cụ quản lý tài nguyên", và điều gì xảy ra nếu bạn dùng một unbounded queue trong khi producer nhanh hơn consumer? Khi code của bạn nằm trong một \`Runnable\` và không thể ném \`InterruptedException\` tiếp, sách khuyên bạn làm gì với nó thay vì nuốt nó?`,
      },
      {
        id: "jc-w4-4",
        text: "Bốn synchronizer, và một result cache tiến hoá dần",
        lesson: `**Mục tiêu.** Phân biệt đúng vai trò của bốn synchronizer — latch, \`FutureTask\`, semaphore, barrier — và theo dõi được vì sao result cache phải tiến hoá qua bốn phiên bản để đóng dần "cửa sổ tổn thương" khiến hai thread tính trùng một giá trị.

**Đọc.** [5.5. Synchronizers](#/docs/jcip-05) — đọc lướt định nghĩa chung: một synchronizer encapsulate state quyết định thread nào được qua, thread nào phải chờ. [5.5.1. Latch](#/docs/jcip-05) — đọc kỹ \`CountDownLatch\` và ví dụ \`TestHarness\` (Listing 5.11) dùng hai latch làm "cổng xuất phát" và "cổng về đích" để đo thời gian chạy đồng thời chính xác hơn. [5.5.2. FutureTask](#/docs/jcip-05) — đọc kỹ vì sao nó "hoạt động như một latch", ba trạng thái chờ chạy/đang chạy/đã hoàn tất, và cách \`Preloader\` (Listing 5.12) dùng nó để nạp trước dữ liệu. [5.5.3. Semaphore](#/docs/jcip-05) — đọc kỹ counting semaphore, trường hợp suy biến binary semaphore dùng như mutex, và \`BoundedHashSet\` (Listing 5.14) biến một \`Set\` thường thành collection có giới hạn và có block. [5.5.4. Barrier](#/docs/jcip-05) — đọc kỹ câu sách phân biệt latch với barrier, \`CyclicBarrier\` trong \`CellularAutomata\` (Listing 5.15), và \`Exchanger\` như một barrier hai bên trao đổi dữ liệu. Cuối cùng đọc chậm [5.6. Xây dựng một Result Cache hiệu quả, có khả năng mở rộng](#/docs/jcip-05) — theo đúng trình tự \`Memoizer1\` (Listing 5.16, \`HashMap\` + synchronize toàn method) → \`Memoizer2\` (Listing 5.17, \`ConcurrentHashMap\`) → \`Memoizer3\` (Listing 5.18, \`ConcurrentHashMap<A, Future<V>>\`) → \`Memoizer\` cuối cùng (Listing 5.19, dùng \`putIfAbsent\`).

**Bẫy.** Nhầm lẫn latch với barrier vì cả hai đều "chặn thread lại chờ" — sách phân biệt rạch ròi: **latch là để chờ sự kiện; barrier là để chờ các thread khác**, và một khi latch vào trạng thái kết thúc nó không thể reset, trong khi \`CyclicBarrier\` tự reset để dùng lại ở vòng lặp kế tiếp. Bẫy thứ hai: nghĩ rằng đổi \`HashMap\` sang \`ConcurrentHashMap\` (\`Memoizer2\`) là đã giải quyết xong bài toán cache — sách chỉ ra \`Memoizer2\` vẫn có một cửa sổ tổn thương khiến hai thread cùng gọi \`compute\` có thể cùng tính trùng một giá trị, và ngay cả \`Memoizer3\` dùng \`FutureTask\` cũng chỉ thu hẹp chứ chưa đóng cửa sổ đó, vì khối \`if\` trong \`compute\` vẫn là một chuỗi check-then-act không atomic.

**Tự kiểm tra.** Theo sách, khác biệt cốt lõi giữa một latch và một barrier là gì? \`Memoizer3\` dùng \`FutureTask\` vẫn còn cửa sổ tổn thương nào, và bản \`Memoizer\` cuối cùng đóng cửa sổ đó bằng method atomic nào của \`ConcurrentMap\`?`,
      },
    ],
  },
  {
    id: "jc-w5",
    week: "Tuần 5",
    title: "Thực thi task: từ thread thủ công tới framework Executor",
    goal: "Tách được việc gửi task khỏi việc chạy task, và nói được execution policy gồm những gì.",
    practice:
      "Tuần này không có bài gõ tay riêng — chương 6 đọc để đổi cách nghĩ, và tuần 6 sẽ có bài nặng về huỷ task. Nếu còn thời gian, chạy lại ví dụ page renderer của mục 6.3 qua ba phiên bản (tuần tự, Future, CompletionService) và so thời gian.",
    resources: [{ label: "JCiP 06 — Task Execution", href: "#/docs/jcip-06" }],
    items: [
      {
        id: "jc-w5-1",
        text: "Ba cách chạy task, và vì sao tạo thread không giới hạn thì sụp",
        lesson: `**Mục tiêu.** Phân biệt được ba cách chạy task trong thread — tuần tự và tạo thread tường minh cho từng task — và giải thích được chính xác vì sao tạo thread không giới hạn theo tốc độ request đến thì sớm muộn cũng sụp trong production.

**Đọc.** [6.1. Thực thi Task trong Thread](#/docs/jcip-06) mở đầu bằng lập luận chọn ranh giới task: task nên độc lập và đại diện một phần nhỏ năng lực xử lý, và với ứng dụng server, ranh giới tự nhiên là từng request của client. [6.1.1. Thực thi Task tuần tự](#/docs/jcip-06) — đọc kỹ \`SingleThreadWebServer\` (Listing 6.1) xử lý request tuần tự trong một thread duy nhất — đúng về lý thuyết nhưng chỉ xử lý được một request tại một thời điểm, nên một request block I/O lâu sẽ ngăn hoàn toàn các request khác. [6.1.2. Tạo Thread tường minh cho từng Task](#/docs/jcip-06) — đọc kỹ \`ThreadPerTaskWebServer\` (Listing 6.2) tạo một thread mới cho mỗi request, và ba hệ quả sách liệt kê: việc xử lý task chuyển khỏi thread chính, task có thể chạy song song, và code xử lý task phải thread-safe. [6.1.3. Nhược điểm của việc tạo Thread không giới hạn](#/docs/jcip-06) — đọc kỹ ba nhược điểm: chi phí vòng đời thread, tiêu thụ tài nguyên (đặc biệt bộ nhớ của các thread nằm không), và tính ổn định khi chạm giới hạn số thread mà nền tảng cho phép, dẫn tới \`OutOfMemoryError\`.

**Bẫy.** Nghĩ rằng \`SingleThreadWebServer\` "đúng về lý thuyết" thì dùng được cho production — sách nói thẳng nó "sẽ chạy rất tệ trong production" vì trong khi server đang xử lý một request, mọi kết nối mới phải chờ cho đến khi request hiện tại xong, và nếu một request block bất thường lâu, người dùng có thể nghĩ server không khả dụng. Bẫy thứ hai: nghĩ thread-per-task luôn là cải tiến an toàn vì nó phản hồi tốt hơn dưới tải nhẹ — sách chỉ rõ cách tiếp cận này "không có gì đặt giới hạn lên số thread được tạo ngoài tốc độ mà người dùng ở xa có thể ném HTTP request vào nó", nên một người dùng độc hại hoặc đủ nhiều người dùng bình thường có thể làm server crash khi chạm giới hạn thread của nền tảng.

**Tự kiểm tra.** Trong \`SingleThreadWebServer\`, vì sao mức sử dụng CPU lại kém trong khi thread duy nhất đang chờ I/O của một request? Theo 6.1.3, vì sao "không có gì đặt giới hạn lên số thread được tạo" lại là một khiếm khuyết nghiêm trọng đối với một ứng dụng server cần suy giảm êm ái dưới tải?`,
      },
      {
        id: "jc-w5-2",
        text: "Framework Executor: execution policy, thread pool, vòng đời",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`Executor\` decouple việc gửi task khỏi việc thực thi task, liệt kê được các thành phần của một execution policy, phân biệt được bốn loại thread pool chuẩn và ba trạng thái vòng đời của \`ExecutorService\`, và biết vì sao \`ScheduledThreadPoolExecutor\` nên thay thế \`Timer\`.

**Đọc.** [6.2. Framework Executor](#/docs/jcip-06) — đọc kỹ vì sao "sự trừu tượng hóa chính cho việc thực thi task... không phải \`Thread\`, mà là \`Executor\`", dựa trên pattern producer-consumer. [6.2.1. Ví dụ: Web Server dùng Executor](#/docs/jcip-06) — đọc kỹ \`TaskExecutionWebServer\` (Listing 6.4) dùng một thread pool cỡ cố định 100 thread, và cách đổi hành vi chỉ bằng cách đổi hiện thực \`Executor\` (\`ThreadPerTaskExecutor\` ở Listing 6.5, \`WithinThreadExecutor\` ở Listing 6.6). [6.2.2. Execution Policy](#/docs/jcip-06) — đọc kỹ danh sách câu hỏi một execution policy phải trả lời: thread nào, thứ tự nào, bao nhiêu task đồng thời, bao nhiêu task xếp hàng, task nào bị từ chối khi quá tải. [6.2.3. Thread Pool](#/docs/jcip-06) — đọc kỹ bốn factory của \`Executors\`: \`newFixedThreadPool\`, \`newCachedThreadPool\` (không đặt giới hạn kích thước pool), \`newSingleThreadExecutor\`, \`newScheduledThreadPool\`. [6.2.4. Vòng đời của Executor](#/docs/jcip-06) — đọc kỹ ba trạng thái running/shutting down/terminated, và khác biệt giữa \`shutdown\` (graceful) và \`shutdownNow\` (abrupt). [6.2.5. Task có trì hoãn và định kỳ](#/docs/jcip-06) — đọc kỹ vì sao \`Timer\` chỉ dùng một thread duy nhất khiến một task chạy lâu làm lệch giờ các \`TimerTask\` khác, và vì sao một unchecked exception ném từ một \`TimerTask\` giết chết toàn bộ \`Timer\` (minh hoạ bằng \`OutOfTime\` ở Listing 6.9), trong khi \`ScheduledThreadPoolExecutor\` xử lý đúng cách những task hư hỏng.

**Bẫy.** Quên gọi \`shutdown\` trên một \`ExecutorService\` khi ứng dụng không cần nó nữa — sách cảnh báo "JVM không thể thoát cho đến khi tất cả thread (không phải daemon) đã kết thúc, nên việc không tắt một \`Executor\` có thể khiến JVM không thoát được". Bẫy thứ hai: dùng \`Timer\` cho task định kỳ mà không biết nó chỉ chạy trên một thread duy nhất — sách chỉ ra nếu một \`TimerTask\` ném một unchecked exception, thread của \`Timer\` không bắt exception đó và kết thúc luôn, còn \`Timer\` thì "nhầm lẫn giả định rằng toàn bộ \`Timer\` đã bị hủy": mọi \`TimerTask\` đã lập lịch nhưng chưa chạy sẽ không bao giờ chạy nữa, và caller tiếp theo cố gửi một \`TimerTask\` sẽ nhận một \`IllegalStateException\`.

**Tự kiểm tra.** Vì sao quên gọi \`shutdown\` trên một \`ExecutorService\` có thể khiến JVM không thoát được? Theo 6.2.5, điều gì xảy ra với các \`TimerTask\` còn lại nếu một \`TimerTask\` ném một unchecked exception, và \`ScheduledThreadPoolExecutor\` khắc phục vấn đề này bằng cách nào?`,
      },
      {
        id: "jc-w5-3",
        text: "Tìm parallelism khai thác được: Callable, Future, và giới hạn của nó",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`Callable\`/\`Future\` là trừu tượng hoá tốt hơn \`Runnable\` cho các phép tính bị trì hoãn, theo dõi được cách \`FutureRenderer\` tách page rendering thành hai task chạy song song, và nêu được giới hạn của việc song song hoá các task không đồng nhất.

**Đọc.** [6.3. Tìm kiếm Parallelism có thể khai thác](#/docs/jcip-06) giới thiệu component mẫu xuyên suốt mục này: page renderer nhận HTML và render vào image buffer. [6.3.1. Ví dụ: Page Renderer tuần tự](#/docs/jcip-06) — đọc kỹ \`SingleThreadRenderer\` (Listing 6.10): render text trước, để lại ô giữ chỗ cho ảnh, rồi tải và vẽ ảnh sau — cách này dùng CPU dưới mức vì tải ảnh chủ yếu là chờ I/O. [6.3.2. Task có mang kết quả: Callable và Future](#/docs/jcip-06) — đọc kỹ vì sao \`run()\` của \`Runnable\` không thể trả về giá trị hay ném checked exception trong khi \`call()\` của \`Callable\` thì có; bốn giai đoạn vòng đời của task (created/submitted/started/completed); và hành vi của \`Future.get\` — trả về ngay hoặc block, ném lại exception bọc trong \`ExecutionException\` nếu task lỗi, ném \`CancellationException\` nếu task bị hủy. [6.3.3. Ví dụ: Page Renderer dùng Future](#/docs/jcip-06) — đọc kỹ \`FutureRenderer\` (Listing 6.13) tách thành một task tải ảnh (submit tới \`ExecutorService\`, nhận về một \`Future\`) và một task render text chạy trong thread chính. [6.3.4. Hạn chế của việc song song hóa các Task không đồng nhất](#/docs/jcip-06) — đọc kỹ ví dụ "hai người rửa bát" không mở rộng tốt khi thêm người, và ví dụ số liệu: nếu task A mất gấp mười lần thời gian so với task B khi chia cho hai worker, toàn bộ quá trình chỉ nhanh hơn 9%.

**Bẫy.** Dùng \`Runnable\` cho một phép tính bị trì hoãn như truy vấn database hay tính một hàm phức tạp — sách chỉ rõ \`run()\` "không thể trả về giá trị hay ném checked exception", nên \`Callable\` mới là trừu tượng hoá phù hợp cho loại task này. Bẫy thứ hai: mong đợi \`FutureRenderer\` luôn tăng tốc đáng kể vì đã chia thành hai task chạy song song — sách cảnh báo nếu việc render văn bản nhanh hơn nhiều so với tải ảnh, "performance kết quả không khác mấy so với phiên bản tuần tự, nhưng code lại phức tạp hơn nhiều", và với hai thread, mức tăng tốc tối đa có thể đạt được chỉ là gấp đôi.

**Tự kiểm tra.** Theo 6.3.2, \`Future.get\` ném gì nếu task kết thúc bằng một exception, và ném gì nếu task bị hủy? Theo 6.3.4, nếu task A mất gấp mười lần thời gian so với task B khi chia đôi công việc cho hai worker, mức tăng tốc đạt được là bao nhiêu?`,
      },
      {
        id: "jc-w5-4",
        text: "CompletionService, và đặt hạn thời gian cho task",
        lesson: `**Mục tiêu.** Giải thích được \`CompletionService\` kết hợp \`Executor\` và \`BlockingQueue\` ra sao để lấy kết quả ngay khi sẵn sàng, và biết dùng \`Future.get\` có timeout cùng \`invokeAll\` có timeout để đặt một ngân sách thời gian cho một task hay một lô task.

**Đọc.** [6.3.5. CompletionService: Khi Executor gặp BlockingQueue](#/docs/jcip-06) — đọc kỹ vì sao lặp poll \`Future.get\` với timeout bằng không cho từng task là "khả thi, nhưng tẻ nhạt", và cách \`ExecutorCompletionService\` giải quyết việc này bằng \`QueueingFuture\` (Listing 6.14) — một \`FutureTask\` override \`done\` để đặt kết quả lên một \`BlockingQueue\` nội bộ, còn \`take\`/\`poll\` ủy quyền cho queue đó. [6.3.6. Ví dụ: Page Renderer dùng CompletionService](#/docs/jcip-06) — đọc kỹ \`Renderer\` (Listing 6.15): mỗi ảnh là một task riêng chạy trong thread pool, và ảnh được render ngay khi nó sẵn sàng thay vì chờ tất cả — chú ý đoạn sách nói nhiều \`ExecutorCompletionService\` có thể dùng chung một \`Executor\`. [6.3.7. Đặt giới hạn thời gian cho Task](#/docs/jcip-06) — đọc kỹ ví dụ ad server hai giây (Listing 6.16): \`get\` có timeout ném \`TimeoutException\` nếu chưa sẵn sàng, và sau đó task nên bị hủy qua \`Future.cancel\` để không lãng phí tài nguyên tính toán một kết quả sẽ không dùng. [6.3.8. Ví dụ: Cổng đặt chỗ du lịch](#/docs/jcip-06) — đọc kỹ phiên bản có timeout của \`invokeAll\` (Listing 6.17): nhận một collection task, trả về một collection \`Future\` cùng cấu trúc thứ tự, và trả về khi tất cả task hoàn tất, thread gọi bị interrupt, hoặc timeout hết hạn — task nào chưa hoàn tất khi đó bị hủy.

**Bẫy.** Tự chế một vòng lặp gọi \`get\` với timeout bằng không cho từng \`Future\` để "poll" xem task nào đã xong — sách gọi thẳng cách này là "tẻ nhạt" và khuyên dùng \`CompletionService\` để lấy kết quả theo đúng thứ tự hoàn tất thay vì thứ tự gửi. Bẫy thứ hai: khi \`Future.get\` có timeout ném \`TimeoutException\`, chỉ dùng giá trị mặc định mà quên hủy task qua \`Future.cancel\` — sách nhấn mạnh cần dừng những task đã hết ngân sách thời gian để chúng "không lãng phí tài nguyên tính toán bằng cách tiếp tục tính một kết quả sẽ không được dùng".

**Tự kiểm tra.** Theo 6.3.5, \`CompletionService\` kết hợp chức năng của hai thứ nào, và \`QueueingFuture\` override method nào của \`FutureTask\` để đặt kết quả lên \`BlockingQueue\`? Theo 6.3.8, \`invokeAll\` có timeout trả về khi nào, và chuyện gì xảy ra với những task chưa hoàn tất lúc đó?`,
      },
    ],
  },
];
