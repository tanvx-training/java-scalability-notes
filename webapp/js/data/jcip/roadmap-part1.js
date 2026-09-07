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
];
