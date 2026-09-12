// Ngân hàng câu hỏi phỏng vấn Java Concurrency in Practice — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Java Concurrency in Practice (Brian Goetz với Tim
// Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea —
// Addison-Wesley). Mỗi câu trỏ chương nguồn qua `refs` để tra ngược.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js. Tóm lại:
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (jcip-iq01–jcip-iq24) — thống kê tự chấm lưu theo id.

export const jcipInterview = [
  // ===== jcip-safety — Thread safety & chia sẻ đối tượng (jcip-iq01–jcip-iq04) =====
  {
    id: "jcip-iq01",
    field: "jcip",
    topic: "jcip-safety",
    level: 1,
    minutes: 5,
    question: "Một đồng nghiệp nói \"class này thread-safe vì mọi method đều `synchronized`\". Bạn phản biện thế nào, và một class thread-safe thật sự cần gì?",
    mustCover: [
      "`synchronized` từng method chỉ làm **mỗi method** atomic, không làm **chuỗi** method atomic — compound action vẫn vỡ",
      "Ba compound action sách nêu tên: **iteration**, **navigation**, và operation có điều kiện kiểu **put-if-absent**",
      "Thread safety là thuộc tính của **state** chứ không của method: mọi biến state khả biến phải được bảo vệ bởi **cùng một** lock",
      "Class không state (stateless) thread-safe **miễn phí** — không có gì để chia sẻ hỏng",
      "Khoá phải bảo vệ được cả **bất biến liên quan nhiều biến**, nên hai biến liên quan nhau không được canh bằng hai lock khác nhau",
    ],
    model: "Phản biện nằm ở chỗ `synchronized` bảo vệ từng lời gọi, còn người dùng class lại nghĩ theo chuỗi lời gọi. Sách minh hoạ bằng `getLast` và `deleteLast` trên một `Vector`: cả hai đều là chuỗi check-then-act, gọi `size` rồi dùng chỉ số thu được để `get`. `Vector` là thread-safe nên không thread nào làm hỏng cấu trúc nội bộ của nó, nhưng nếu thread A gọi `getLast` trên một `Vector` mười phần tử và thread B gọi `deleteLast` xen vào giữa hai bước, `getLast` ném `ArrayIndexOutOfBoundsException` — hoàn toàn đúng đặc tả của `Vector`, và hoàn toàn không phải điều caller mong đợi. Ba họ compound action sách gọi tên là iteration, navigation và operation có điều kiện như put-if-absent; tất cả đều cần thêm khoá ở phía client. Vậy điều kiện thật của thread safety là gì? Đó là thuộc tính của state, không của method: phải xác định mọi biến khả biến được chia sẻ, rồi bảo đảm chúng được bảo vệ bởi cùng một lock — và quan trọng hơn, mọi **bất biến trải trên nhiều biến** cũng phải nằm trong cùng một lock, vì nếu hai biến liên quan nhau mà canh bằng hai lock khác nhau thì không thời điểm nào bất biến giữa chúng được bảo đảm. Trường hợp dễ nhất là class không có state: nó thread-safe miễn phí, vì chẳng có gì để chia sẻ hỏng.",
    redFlags: [
      "Đếm số `synchronized` để kết luận thread-safe, thay vì hỏi state nào được bảo vệ bởi lock nào",
      "Nói \"dùng collection thread-safe là xong\" — chính sách đó không che được compound action ở phía client",
      "Bảo vệ hai biến liên quan nhau bằng hai lock khác nhau và tưởng như vậy là đủ",
    ],
    probes: [
      "Cho một class có hai biến đếm phải luôn bằng nhau — `synchronized` từng setter có đủ không?",
      "Vì sao class không state lại thread-safe mà không cần làm gì?",
      "Tài liệu của một class nên nói gì để người dùng biết cách khoá nó từ bên ngoài?",
    ],
    refs: ["jcip-02", "jcip-05"],
  },
  {
    id: "jcip-iq02",
    field: "jcip",
    topic: "jcip-safety",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class Holder {
    private int n;

    public Holder(int n) { this.n = n; }

    public void assertSanity() {
        if (n != n)
            throw new AssertionError("Cái này không thể xảy ra được");
    }
}

public class HolderPublisher {
    public Holder holder;          // không volatile, không final

    public void initialize() {
        holder = new Holder(42);   // publish không an toàn
    }
}`,
    },
    question: "`assertSanity` so một field với chính nó. Vậy mà nó ném `AssertionError` được. Giải thích bằng cơ chế, rồi nêu hai cách sửa khác bản chất nhau.",
    mustCover: [
      "Không dùng synchronization để publish nên `Holder` được **publish không đúng cách**: state của nó không được bảo đảm nhìn thấy được",
      "Thread khác có thể thấy tham chiếu `holder` **mới nhất** mà vẫn thấy giá trị **stale** cho state bên trong",
      "Một thread có thể thấy giá trị stale ở lần đọc đầu rồi giá trị mới hơn ở lần đọc sau — đúng hai lần đọc `n` trong `assertSanity`",
      "Giá trị stale có thật vì constructor của `Object` ghi giá trị mặc định vào mọi field **trước khi** constructor lớp con chạy",
      "Cách sửa thứ nhất: khai `n` là `final` để `Holder` trở thành immutable, khi đó JMM bảo đảm **initialization safety** kể cả publish sai",
      "Cách sửa thứ hai: publish đúng cách bằng một idiom an toàn — khai `holder` là `volatile`, hoặc `final`, hoặc cho qua một khoá",
    ],
    model: "Bẫy ở đây là `n != n` trông như một mệnh đề không thể đúng, nhưng hai lần đọc `n` là hai lần đọc riêng biệt, và không gì bảo đảm chúng thấy cùng một giá trị. Gốc rễ là publish sai: `HolderPublisher` gán `holder` mà không dùng bất kỳ synchronization nào, nên sách gọi đó là publish không đúng cách. Sách nêu rõ hai thứ có thể sai. Nhẹ hơn: thread khác thấy giá trị stale cho chính tham chiếu `holder`, tức thấy `null` hoặc giá trị cũ. Tệ hơn nhiều: thread khác thấy tham chiếu **mới nhất** nhưng lại thấy state bên trong ở giá trị stale — object bị quan sát trong trạng thái đang construct dở dang. Và vì hai lần đọc độc lập, thread có thể thấy stale lần đầu rồi thấy giá trị mới ở lần sau, đúng kịch bản làm `assertSanity` nổ. Có người sẽ phản bác rằng `n` chưa từng mang giá trị nào khác nên không có giá trị \"cũ\" để mà stale — nhưng constructor của `Object` ghi giá trị mặc định vào mọi field trước khi constructor lớp con chạy, nên `0` hoàn toàn là một giá trị stale có thể quan sát được. Hai cách sửa khác bản chất nhau. Cách thứ nhất là làm `Holder` immutable bằng cách khai `n` là `final`: JMM cho immutable object một bảo đảm đặc biệt về initialization safety, nên `assertSanity` sẽ không thể nổ **kể cả khi** vẫn publish sai — nhưng bảo đảm này chỉ có hiệu lực khi thoả đủ mọi yêu cầu của immutability: state không sửa được, mọi field `final`, và construct đúng cách. Cách thứ hai là để `Holder` nguyên như vậy và sửa chỗ publish, dùng một idiom an toàn: khai `holder` là `volatile` hoặc `final`, khởi tạo từ static initializer, hay cho tham chiếu đi qua một collection thread-safe. Hai cách chữa hai bệnh khác nhau, và nói rõ được điểm đó mới là câu trả lời đầy đủ.",
    redFlags: [
      "Kết luận `n != n` là bất khả thi nên hẳn có lỗi biên dịch hoặc lỗi JVM",
      "Nói vấn đề nằm ở class `Holder` — sách chú thích rõ vấn đề là nó không được publish đúng cách",
      "Thêm `synchronized` vào `assertSanity` mà để nguyên chỗ publish: thiếu một nửa của quan hệ happens-before",
      "Cho rằng `final` giúp được ngay cả khi field `final` đó trỏ tới một object khả biến",
    ],
    probes: [
      "Nếu `n` là `final` nhưng trỏ tới một `List` khả biến thì bảo đảm còn giữ không?",
      "Kể các idiom publish an toàn mà sách liệt kê",
      "Vì sao `0` lại là một giá trị stale quan sát được, dù `n` chưa từng mang giá trị khác?",
    ],
    refs: ["jcip-03"],
  },
  {
    id: "jcip-iq03",
    field: "jcip",
    topic: "jcip-safety",
    level: 3,
    minutes: 9,
    question: "Bạn cần chia sẻ một đối tượng mang cấu hình giữa nhiều thread, cấu hình này được nạp lại mỗi 30 giây. Bạn chọn cách chia sẻ nào?",
    tradeoffs: [
      {
        option: "Immutable object đặt sau một field `volatile`",
        when: "Mặc định của tôi cho đúng bài toán này. Mỗi lần nạp lại thay bằng một instance mới, hoàn toàn immutable; đọc không cần khoá và luôn thấy một cái nhìn nhất quán. Sách gọi đây là idiom dùng `volatile` để publish immutable object.",
      },
      {
        option: "Object khả biến bảo vệ bằng khoá",
        when: "Khi cấu hình quá lớn để dựng lại cả object mỗi 30 giây, hoặc khi cần cập nhật từng phần. Đổi lại là mọi lần đọc đều phải khoá, và phải tài liệu hoá rõ lock nào bảo vệ gì.",
      },
      {
        option: "Thread confinement — mỗi thread giữ bản riêng",
        when: "Khi các thread không cần thấy cùng một phiên bản cấu hình, hoặc khi chính giá trị đó mang ngữ cảnh theo thread. Không cần synchronization gì cả, nhưng không còn là chia sẻ nữa — và `ThreadLocal` trong một thread pool là nguồn rò rỉ nếu không dọn.",
      },
    ],
    mustCover: [
      "Trục quyết định là **tần suất đọc so với tần suất ghi**: ở đây đọc rất nhiều, ghi mỗi 30 giây",
      "Immutable object sau `volatile` cho cái nhìn nhất quán **không cần khoá khi đọc**, vì mỗi lần ghi thay cả object",
      "Object khả biến dù đặt sau `volatile` vẫn **không** an toàn: `volatile` chỉ bảo đảm thấy tham chiếu mới, không bảo đảm state bên trong nhất quán",
      "`final` cho mọi field là điều kiện để có bảo đảm initialization safety, nên immutability phải làm đủ chứ không nửa vời",
      "`ThreadLocal` trong thread pool phải dọn, vì thread sống lâu hơn request",
    ],
    model: "Hình dạng tải quyết định câu trả lời: đọc rất nhiều, ghi mỗi 30 giây một lần. Đó chính là hình dạng mà idiom sách gọi là dùng `volatile` để publish immutable object phục vụ tốt nhất. Gom toàn bộ cấu hình vào một class immutable — mọi field `final`, không setter — rồi giữ nó trong một field `volatile`. Mỗi lần nạp lại thì dựng một instance mới và gán vào field đó; người đọc chỉ đọc field một lần, nhận về một object không đổi, và thấy một cái nhìn hoàn toàn nhất quán mà không phải khoá gì. Điểm phải nói rõ vì nó là cái bẫy hay gặp: đặt một object **khả biến** sau một field `volatile` thì không đủ. `volatile` bảo đảm ta thấy tham chiếu mới nhất, nhưng không bảo đảm state bên trong object đó nhất quán — đúng phân biệt mà sách nhấn mạnh khi nói việc một tham chiếu trở nên nhìn thấy được không có nghĩa state của nó cũng vậy. Vì thế immutability phải làm đủ: state không sửa được, mọi field `final`, construct đúng cách; làm nửa vời thì mất luôn bảo đảm initialization safety. Tôi chuyển sang object khả biến có khoá chỉ khi cấu hình quá lớn để dựng lại cả object mỗi vòng hoặc khi buộc phải cập nhật từng phần — và lúc đó chấp nhận mọi lần đọc phải khoá, kèm nghĩa vụ tài liệu hoá chính sách khoá. Thread confinement thì giải một bài khác: nó hợp khi các thread **không cần** thấy cùng phiên bản, và nếu dùng `ThreadLocal` trong thread pool thì phải dọn, vì thread sống lâu hơn request.",
    redFlags: [
      "Đặt object khả biến sau `volatile` rồi tin là xong — `volatile` không làm state bên trong nhất quán",
      "Khoá mọi lần đọc cho một dữ liệu ghi mỗi 30 giây: đúng nhưng trả giá thông lượng không cần thiết",
      "Dùng `ThreadLocal` trong thread pool mà không dọn, vì thread sống lâu hơn request",
      "Làm immutability nửa vời — bỏ một field không `final` — rồi vẫn trông cậy vào initialization safety",
    ],
    probes: [
      "Nếu cấu hình có một `Map` bên trong, bạn làm gì để object vẫn thật sự immutable?",
      "Người đọc đang xử lý nửa chừng bằng cấu hình cũ thì có vấn đề gì không?",
      "Sách gọi object nào là *effectively immutable*, và nó khác immutable ở chỗ nào?",
    ],
    refs: ["jcip-03"],
  },
  {
    id: "jcip-iq04",
    field: "jcip",
    topic: "jcip-safety",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ tính phí đôi khi ghi ra hoá đơn có tổng tiền không khớp với danh sách dòng chi tiết của chính nó. Tần suất khoảng 1 trên 40.000 hoá đơn, chỉ xảy ra trên production. Class `Invoice` có hai field `lineItems` và `total`, mỗi field có một setter `synchronized` riêng, và một method `validate()` không đồng bộ đọc cả hai.",
      scale: "Khoảng 2,4 triệu hoá đơn mỗi ngày, 64 worker thread. Đã chạy 8 tháng trước khi ai đó phát hiện; ước tính 14.000 hoá đơn lệch đã phát hành.",
      constraints: "Không được khoá toàn bộ `Invoice` trên đường đọc — `validate()` bị gọi trong vòng lặp nóng và đo được là đường đi chịu tải nặng nhất. Không đổi được chữ ký public của `Invoice` vì 9 module khác đang dùng. Phải xác định được những hoá đơn nào đã lệch.",
    },
    question: "Vì sao mỗi setter đều `synchronized` mà bất biến vẫn vỡ? Nêu cách sửa của bạn, và cách bạn truy ra 14.000 hoá đơn kia.",
    mustCover: [
      "Bất biến ở đây trải trên **hai** biến, nên nó phải được bảo vệ như một đơn vị — `synchronized` từng setter chỉ làm từng lần ghi atomic",
      "Giữa hai lần gọi setter tồn tại một khoảng object ở trạng thái **không nhất quán**, và `validate()` đọc đúng vào khoảng đó",
      "`validate()` còn không đồng bộ nên ngoài chuyện đọc trạng thái nửa vời, nó không có quan hệ happens-before nào với bên ghi",
      "Cách sửa đúng bản chất: gộp hai field thành **một object immutable** đặt sau một field `volatile`, nên đọc thấy nhất quán mà vẫn không khoá",
      "Đó cũng là cách giữ được ràng buộc \"không khoá đường đọc\" — thay vì khoá, ta làm state thay theo từng khối nguyên vẹn",
      "Truy ra hoá đơn lệch bằng một job đối soát tính lại tổng từ dòng chi tiết, chạy trên bản lưu trữ chứ không dựa vào log",
    ],
    model: "Câu hỏi tự trả lời khi đặt đúng: `synchronized` trên từng setter làm mỗi **lần ghi** atomic, nhưng bất biến bị vi phạm lại trải trên **hai** biến. Sau khi `setLineItems` trả về và trước khi `setTotal` được gọi, object nằm ở một trạng thái mà tổng không khớp dòng chi tiết — và đó là trạng thái hợp lệ về mặt khoá, chỉ không hợp lệ về mặt nghiệp vụ. `validate()` đọc cả hai field và đôi khi rơi đúng vào khoảng đó. Sách nói thẳng nguyên tắc bị vi phạm: mọi bất biến trải trên nhiều biến phải được bảo vệ bởi cùng một lock, giữ suốt thời gian bất biến có thể bị vi phạm. Có một lỗi thứ hai chồng lên: `validate()` không đồng bộ nên ngoài chuyện đọc trạng thái nửa vời, nó còn không có quan hệ happens-before nào với bên ghi, tức có thể thấy giá trị stale — điều này cũng giải thích vì sao tần suất thấp và chỉ lộ ra trên production, nơi có 64 thread và một JIT chịu tải thật. Về cách sửa, ràng buộc \"không khoá đường đọc\" thực ra chỉ đường tới lời giải đúng chứ không chặn nó. Thay vì khoá, tôi gộp `lineItems` và `total` vào một object immutable — gọi là `InvoiceState`, mọi field `final`, `lineItems` bọc bất biến — rồi giữ nó trong một field `volatile` bên trong `Invoice`. Mọi thay đổi dựng một `InvoiceState` mới và gán một lần; `validate()` đọc field đó đúng một lần rồi làm việc trên một ảnh nhất quán, không khoá gì cả. Chữ ký public của `Invoice` giữ nguyên nên 9 module kia không phải đổi — hai setter cũ nay dựng state mới thay vì ghi từng field, và đây chính là chỗ cần cẩn thận: nếu vẫn còn đường nào cho phép đặt riêng một nửa, bất biến vẫn hở. Riêng việc truy ra 14.000 hoá đơn lệch thì không dựa vào log, vì log không ghi lại trạng thái đã quan sát; tôi cho một job đối soát đọc bản lưu trữ hoá đơn, tính lại tổng từ dòng chi tiết và đánh dấu mọi bản không khớp — việc này chạy được ngay, trước cả khi bản vá lên.",
    redFlags: [
      "Thêm `synchronized` vào `validate()` và coi là xong — đúng hơn hiện tại nhưng vi phạm thẳng ràng buộc về đường đọc nóng",
      "Đổi hai field sang `volatile`: mỗi lần đọc thấy giá trị mới nhất của từng field, nhưng bất biến giữa hai field vẫn không được bảo đảm",
      "Kết luận \"lỗi hiếm nên chắc do hạ tầng\" — tần suất thấp là dấu hiệu kinh điển của cửa sổ tranh chấp hẹp",
      "Sửa mã rồi bỏ qua 14.000 hoá đơn đã phát hành, trong khi đề bài đòi phải xác định được chúng",
    ],
    probes: [
      "Sau khi gộp thành một object immutable, hai setter cũ còn giữ được ngữ nghĩa cũ không?",
      "Vì sao đổi cả hai field sang `volatile` không sửa được bài toán này?",
      "Bạn viết một bài kiểm nào để cửa sổ tranh chấp này không quay lại?",
    ],
    refs: ["jcip-03", "jcip-04"],
  },

  // ===== jcip-design — Thiết kế class thread-safe (jcip-iq05–jcip-iq08) =====
  {
    id: "jcip-iq05",
    field: "jcip",
    topic: "jcip-design",
    level: 1,
    minutes: 5,
    question: "Sách nêu ba cách để một class composite đạt thread safety: instance confinement, ủy quyền, và publish state nền tảng. Phân biệt ba cách đó, và nói điều kiện nào cho phép ủy quyền.",
    mustCover: [
      "**Instance confinement** giam state khả biến bên trong object và bảo vệ bằng lock của chính object — đẩy tới cùng thì thành **Java monitor pattern**",
      "**Ủy quyền** giao nghĩa vụ thread safety cho các biến state nền tảng đã thread-safe, class composite không tự khoá gì",
      "Ủy quyền cho **nhiều** biến chỉ hợp lệ khi các biến đó **độc lập** — class composite không áp bất biến nào trải trên nhiều biến",
      "Khi có bất biến trải nhiều biến thì ủy quyền **thất bại**, phải quay về khoá tập hợp",
      "**Publish state nền tảng** là mức lỏng nhất: chỉ an toàn khi biến đó không tham gia bất biến nào và không có operation phụ thuộc state",
    ],
    model: "Ba cách xếp theo thứ tự chặt dần tới lỏng dần. Instance confinement là giam toàn bộ state khả biến bên trong object rồi bảo vệ nó bằng lock; đẩy nguyên tắc này tới kết luận logic thì được Java monitor pattern — object gói kín state khả biến và bảo vệ bằng chính intrinsic lock của mình, đúng cách `Vector` và `Hashtable` làm. Ưu điểm sách nhấn là tính đơn giản. Ủy quyền thì khác hẳn về tinh thần: class composite không tự khoá gì cả, nó giao nghĩa vụ thread safety cho các biến nền tảng vốn đã thread-safe. Điều kiện cho phép ủy quyền cho nhiều biến là điểm mấu chốt và cũng là chỗ người ta hay sai: các biến phải **độc lập**, nghĩa là class composite không áp đặt bất kỳ bất biến nào liên quan tới nhiều biến cùng lúc. Ví dụ của sách là một component đồ hoạ giữ hai danh sách listener — chuột và bàn phím — và vì không có quan hệ nào giữa hai tập đó, nó ủy quyền được cho hai list thread-safe. Ngược lại, nếu có một bất biến trải trên hai biến thì ủy quyền thất bại và phải quay về khoá tập hợp đó như một đơn vị. Cách thứ ba, publish state nền tảng, là lỏng nhất: cho phép người ngoài đọc và sửa trực tiếp một biến state thread-safe. Nó chỉ an toàn khi biến đó không tham gia bất biến nào của class và không có operation nào phụ thuộc vào state của nó — vì khi đã publish ra ngoài thì class không còn kiểm soát được ai đổi nó lúc nào.",
    redFlags: [
      "Coi ủy quyền là luôn dùng được miễn các biến nền tảng đều thread-safe — bỏ mất điều kiện độc lập",
      "Lẫn Java monitor pattern với việc chỉ cần đánh `synchronized` lên mọi method mà không giam state",
      "Publish state nền tảng cho một biến có tham gia bất biến của class",
    ],
    probes: [
      "Cho một class giữ hai số phải luôn thoả `min <= max` — ủy quyền cho hai `AtomicInteger` có đủ không?",
      "Java monitor pattern đánh đổi gì để lấy tính đơn giản?",
      "Ba annotation ở cấp class mà sách dùng là gì, và vì sao chúng có ích cho cả công cụ phân tích tĩnh?",
    ],
    refs: ["jcip-04", "jcip-A"],
  },
  {
    id: "jcip-iq06",
    field: "jcip",
    topic: "jcip-design",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class ListHelper<E> {
    public List<E> list = Collections.synchronizedList(new ArrayList<>());

    public synchronized boolean putIfAbsent(E x) {
        boolean absent = !list.contains(x);
        if (absent)
            list.add(x);
        return absent;
    }
}`,
    },
    question: "`putIfAbsent` đã là `synchronized` và `list` đã thread-safe, vậy mà hai thread vẫn thêm được cùng một phần tử hai lần. Chỉ ra lỗi, rồi nêu hai cách sửa và nói cách nào bạn chọn.",
    mustCover: [
      "`synchronized` ở đây khoá trên **sai lock**: nó lấy lock của `ListHelper`, không phải lock mà `List` dùng để bảo vệ state của nó",
      "Vì hai bên dùng hai lock khác nhau, `putIfAbsent` **không atomic** so với các operation khác trên `List` — nó chỉ tạo ảo giác về synchronization",
      "Cách sửa thứ nhất là **client-side locking**: `synchronized (list)` — dùng đúng lock mà collection wrapper cam kết, tức lock của chính wrapper chứ không của collection bên trong",
      "Cách sửa thứ hai là **composition**: bọc `List` trong một class tự giữ lock riêng và chuyển tiếp mọi operation, khi đó chính sách khoá nằm gọn một chỗ",
      "Sách cảnh báo client-side locking **mong manh hơn** cả việc extend class, vì nó đặt mã khoá của class C vào những class hoàn toàn không liên quan tới C",
    ],
    model: "Lỗi nằm ở chỗ `synchronized` không tự biết phải khoá cái gì — nó khoá `this`, tức lock của `ListHelper`. Bất kể `List` dùng lock nào để bảo vệ state của nó, chắc chắn đó không phải lock trên `ListHelper`. Nên hai thread gọi `putIfAbsent` thì loại trừ lẫn nhau, nhưng một thread thứ ba gọi `list.add` trực tiếp lại chẳng bị chặn gì; và ngay cả khi không có thread thứ ba, `contains` rồi `add` là hai operation riêng trên `List`, mỗi cái tự khoá và nhả lock của `List`, nên có một khoảng hở ở giữa. Sách gọi đúng tên hiện tượng: `ListHelper` chỉ tạo ra ảo giác về synchronization. Cách sửa thứ nhất là client-side locking — bảo vệ mã client bằng chính lock mà object đó dùng để bảo vệ state của mình, tức viết `synchronized (list)`. Muốn dùng được cách này thì phải **biết** object kia dùng lock nào, và tài liệu của `Vector` cùng các synchronized wrapper có nêu điều đó, dù hơi gián tiếp: lock là của chính wrapper, không phải của collection được bọc bên trong. Cách thứ hai là composition: viết một class bọc `List`, giữ lock riêng của nó, và chuyển tiếp mọi operation qua lớp bọc đó. Tôi chọn composition, vì sách nói rất rõ vấn đề của cách thứ nhất: nếu extend một class để thêm operation atomic đã mong manh do phân tán mã khoá ra nhiều class trong một cây phân cấp, thì client-side locking còn mong manh hơn nữa — nó đặt mã khoá cho class C vào những class hoàn toàn không liên quan tới C. Composition trả giá một lớp chuyển tiếp và một lần khoá lồng, nhưng đổi lại chính sách khoá nằm gọn trong một class và không phụ thuộc vào việc collection bên dưới có cam kết gì về lock của nó hay không.",
    redFlags: [
      "Đổi `list` sang `CopyOnWriteArrayList` rồi coi là xong — vẫn là hai operation riêng, khoảng hở check-then-act còn nguyên",
      "Nói `Collections.synchronizedList` \"chưa đủ thread-safe\" — nó thread-safe đúng như cam kết, vấn đề là compound action ở phía client",
      "Chọn client-side locking mà không nói tới tính mong manh sách cảnh báo",
      "Để `list` là field public rồi vẫn trông cậy vào khoá bên trong helper",
    ],
    probes: [
      "Nếu ai đó truyền vào một `List` không cam kết gì về chính sách khoá thì cách nào còn dùng được?",
      "Với một `Map`, vì sao `ConcurrentHashMap` làm cả bài toán này biến mất?",
      "Composition trả giá gì so với client-side locking?",
    ],
    refs: ["jcip-04", "jcip-05"],
  },
  {
    id: "jcip-iq07",
    field: "jcip",
    topic: "jcip-design",
    level: 3,
    minutes: 10,
    question: "Bạn cần thêm một operation atomic put-if-absent cho một cấu trúc map dùng chung trong ứng dụng. Bạn chọn hướng nào?",
    tradeoffs: [
      {
        option: "`ConcurrentHashMap` và dùng `putIfAbsent` có sẵn",
        when: "Gần như luôn là lựa chọn đầu. Nó cung cấp sẵn các operation map atomic bổ sung, dùng lock striping nên nhiều thread đọc chạy song song với thread ghi, iterator **weakly consistent** không ném `ConcurrentModificationException`. Không dùng được **chỉ khi** ứng dụng cần khoá cả map để truy cập độc quyền.",
      },
      {
        option: "Composition — bọc map trong một class giữ lock riêng",
        when: "Khi cần **nhiều** operation ghép phải atomic với nhau, hoặc cần khoá cả map để truy cập độc quyền — chẳng hạn thêm nhiều ánh xạ như một đơn vị, hoặc duyệt map vài lần và phải thấy cùng những phần tử theo cùng thứ tự.",
      },
      {
        option: "Client-side locking trên một `synchronizedMap`",
        when: "Khi buộc phải giữ một map đã có sẵn mà không bọc lại được, **và** map đó cam kết rõ chính sách khoá của nó. Sách xếp đây là cách mong manh nhất vì nó đặt mã khoá của một class vào những class không liên quan.",
      },
    ],
    mustCover: [
      "`ConcurrentHashMap` đánh đổi có chủ ý: `size` và `isEmpty` bị **làm yếu** thành ước lượng để tối ưu `get`, `put`, `containsKey`, `remove`",
      "Đánh đổi đó hợp lý vì trong môi trường concurrent, `size` và `isEmpty` vốn là **mục tiêu di động**",
      "Thứ duy nhất `ConcurrentHashMap` **không** cung cấp mà map đã synchronize có, là khả năng khoá map để truy cập độc quyền",
      "Iterator weakly consistent duyệt phần tử như tại thời điểm tạo iterator, chịu được sửa đổi concurrent, và **có thể nhưng không bảo đảm** phản ánh thay đổi sau đó",
      "Synchronized collection giữ lock **suốt** mỗi operation, nên một `hashCode` tồi hoặc một `equals` đắt sẽ chặn mọi thread khác",
    ],
    model: "Tôi bắt đầu từ `ConcurrentHashMap` vì nó giải đúng bài toán này ngay trong API: nó cung cấp các operation map atomic bổ sung, trong đó có `putIfAbsent`, nên không cần tự ghép check-then-act. Về hiệu năng thì khác biệt không nhỏ: synchronized collection giữ lock suốt mỗi operation, mà một operation như `get` có thể tốn hơn thoạt nhìn — duyệt bucket và gọi `equals` trên một loạt ứng viên, và nếu `hashCode` trải không đều thì trong trường hợp suy biến hash table biến thành linked list; suốt thời gian đó không thread nào khác truy cập được collection. `ConcurrentHashMap` dùng lock striping nên vô số thread đọc chạy song song, thread đọc chạy song song với thread ghi, và một số giới hạn thread ghi sửa map đồng thời. Phải nói rõ hai đánh đổi. Thứ nhất, `size` và `isEmpty` bị làm yếu thành ước lượng — hợp lý, vì kết quả của `size` lỗi thời ngay khi tính xong và trong môi trường concurrent thì hai đại lượng đó vốn là mục tiêu di động; yêu cầu được nới ra để tối ưu những operation thật sự quan trọng là `get`, `put`, `containsKey` và `remove`. Thứ hai, iterator là weakly consistent chứ không fail-fast: nó duyệt phần tử như tại thời điểm được tạo, chịu được sửa đổi concurrent, và có thể nhưng không bảo đảm phản ánh thay đổi về sau. Tính năng duy nhất bị mất là khả năng khoá map để truy cập độc quyền, và đúng khi tôi cần điều đó — thêm nhiều ánh xạ như một đơn vị, hay duyệt map vài lần và phải thấy cùng tập phần tử theo cùng thứ tự — thì tôi chuyển sang composition. Client-side locking là phương án cuối, chỉ khi không bọc lại được, vì nó mong manh nhất.",
    redFlags: [
      "Nói `ConcurrentHashMap` \"nhanh hơn nên luôn tốt hơn\" mà không nêu `size`/`isEmpty` chỉ còn là ước lượng",
      "Trông cậy vào `size()` của `ConcurrentHashMap` để ra quyết định nghiệp vụ",
      "Tự ghép `containsKey` rồi `put` trên `ConcurrentHashMap` — hai operation atomic riêng lẻ không tạo thành một operation atomic",
      "Quên rằng nhu cầu khoá cả map để truy cập độc quyền là lý do duy nhất thật sự loại `ConcurrentHashMap`",
    ],
    probes: [
      "Một `hashCode` tồi ảnh hưởng thế nào tới một `synchronizedMap` so với một `ConcurrentHashMap`?",
      "Iterator weakly consistent nghĩa là gì, và nó khác fail-fast ra sao?",
      "Bạn cần duyệt map hai lần và thấy cùng tập phần tử — làm thế nào?",
    ],
    refs: ["jcip-05", "jcip-04"],
  },
  {
    id: "jcip-iq08",
    field: "jcip",
    topic: "jcip-design",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một dịch vụ theo dõi vị trí đội xe bắt đầu ném `ConcurrentModificationException` từ tầng serialize JSON, chỉ khi có xe cập nhật vị trí trong lúc một client đang đọc bản đồ. Class `VehicleTracker` giữ một `Map<String, Point>` và có method `getLocations()` trả **thẳng** map đó ra ngoài. `Point` là class có hai field `x`, `y` với setter.",
      scale: "1.200 xe cập nhật vị trí mỗi 2 giây; 40 client dashboard đọc liên tục. Ngoại lệ xảy ra khoảng 30 lần mỗi giờ và làm request trả về 500.",
      constraints: "Chữ ký `getLocations()` trả về `Map<String, Point>` nằm trong API công khai, 4 client bên ngoài đang dùng — không đổi được kiểu trả về. Dashboard phải thấy một ảnh nhất quán của cả đội xe, không phải các xe ở những thời điểm khác nhau. Không được khoá đường cập nhật vị trí quá 1ms.",
      },
    question: "Thiết kế hiện tại sai ở mấy chỗ, không chỉ ở ngoại lệ đang thấy? Nêu cách sửa thoả được cả ba ràng buộc.",
    mustCover: [
      "Lỗi thứ nhất: `getLocations()` **publish** state khả biến nội bộ, nên người ngoài duyệt và sửa map cùng lúc với bên cập nhật",
      "Lỗi thứ hai, nặng hơn và chưa gây ngoại lệ: `Point` khả biến nên kể cả trả về bản copy của map, client vẫn giữ tham chiếu tới `Point` đang bị sửa",
      "Lỗi thứ ba: yêu cầu \"ảnh nhất quán của cả đội xe\" là một **bất biến trải toàn bộ collection**, mà thiết kế hiện tại không bảo vệ ở đâu cả",
      "Làm `Point` **immutable** là bước bắt buộc — nó biến giá trị trong map thành thứ chia sẻ an toàn được mà không cần synchronization",
      "Trả về một **bản chụp không đổi** dựng tại thời điểm gọi — thoả cả tính nhất quán lẫn việc giữ nguyên kiểu trả về",
      "Cách này giữ đường ghi rất ngắn: cập nhật chỉ là thay một giá trị immutable trong một map thread-safe",
    ],
    model: "Ngoại lệ chỉ là triệu chứng dễ thấy nhất trong ba lỗi. Lỗi thứ nhất là publish state khả biến: `getLocations()` trả thẳng map nội bộ, nên client duyệt nó trong khi bên cập nhật đang sửa — đó là `ConcurrentModificationException`. Lỗi thứ hai nghiêm trọng hơn nhưng chưa nổ thành exception: `Point` khả biến, nên kể cả khi trả về một bản copy nông của map, client vẫn giữ tham chiếu tới đúng những object `Point` mà luồng cập nhật đang gọi setter lên — dashboard sẽ đọc được toạ độ nửa cũ nửa mới của cùng một xe, im lặng và không ai biết. Lỗi thứ ba là ràng buộc nghiệp vụ chưa được bảo vệ ở đâu: \"một ảnh nhất quán của cả đội xe\" là bất biến trải trên toàn bộ collection, mà thiết kế hiện tại không có chỗ nào giữ nó. Cách sửa đi theo đúng thứ tự đó. Trước hết làm `Point` immutable — hai field `final`, không setter, muốn đổi vị trí thì tạo `Point` mới. Riêng bước này đã khử lỗi thứ hai và biến giá trị trong map thành thứ chia sẻ an toàn được mà không cần synchronization gì thêm, theo đúng bảo đảm initialization safety của JMM. Tiếp đến, giữ state nội bộ trong một `ConcurrentHashMap` và để `getLocations()` dựng một bản chụp không đổi tại thời điểm gọi — copy map rồi bọc bất biến. Vì giá trị đã immutable, bản copy nông là đủ, và vì nó được dựng trong một lần duyệt nên dashboard thấy một ảnh nhất quán chứ không phải các xe ở những thời điểm khác nhau. Kiểu trả về vẫn là `Map<String, Point>` nên 4 client bên ngoài không phải đổi gì; họ chỉ mất khả năng sửa map trả về, mà đó là thứ họ lẽ ra không bao giờ được làm. Ràng buộc 1ms cho đường ghi cũng được thoả một cách tự nhiên: cập nhật vị trí chỉ là thay một giá trị immutable trong một map thread-safe, không khoá gì trên phạm vi toàn collection. Chi phí dồn sang đường đọc, đúng chỗ nó nên ở với 1.200 xe và 40 dashboard.",
    redFlags: [
      "Bọc `Collections.unmodifiableMap` quanh map nội bộ rồi coi là xong — chặn được client sửa nhưng không chặn `ConcurrentModificationException` khi bên trong vẫn đang đổi",
      "Trả bản copy của map mà để nguyên `Point` khả biến: lỗi ồn ào biến thành lỗi âm thầm, tệ hơn",
      "Khoá cả map trên đường đọc để dựng ảnh nhất quán, vi phạm ràng buộc về đường ghi khi 40 dashboard đọc liên tục",
      "Đổi kiểu trả về sang một DTO mới — ràng buộc API công khai đã cấm",
    ],
    probes: [
      "Vì sao làm `Point` immutable lại khiến bản copy nông trở thành đủ?",
      "Nếu client bên ngoài đang gọi `put` lên map trả về, bạn xử lý việc chuyển đổi thế nào?",
      "Với 1.200 xe, việc dựng bản chụp mỗi lần đọc có phải vấn đề không, và bạn đo bằng gì?",
    ],
    refs: ["jcip-04", "jcip-03"],
  },

  // ===== jcip-blocks — Building block của java.util.concurrent (jcip-iq09–jcip-iq12) =====
  {
    id: "jcip-iq09",
    field: "jcip",
    topic: "jcip-blocks",
    level: 1,
    minutes: 5,
    question: "Kể các synchronizer mà sách trình bày và nói mỗi cái giải bài toán phối hợp nào. Riêng `Semaphore`: nó đếm cái gì?",
    mustCover: [
      "**Latch** làm cửa chặn: giữ mọi thread lại tới khi đạt trạng thái cuối, và một khi đã mở thì **không đóng lại được**",
      "**Barrier** khác latch ở chỗ nó chờ **các thread gặp nhau** tại một điểm, và dùng lại được cho vòng sau",
      "**FutureTask** mang ngữ nghĩa chờ một kết quả tính toán, chuyển từ trạng thái chờ sang hoàn tất",
      "**Semaphore** đếm **permit**, dùng để kiểm soát số hoạt động được truy cập một tài nguyên cùng lúc",
      "Semaphore với đếm ban đầu bằng một là **binary semaphore**, dùng như mutex nhưng ngữ nghĩa khoá **không reentrant**",
      "Permit không gắn với thread: acquire ở thread này release được từ thread khác, nên nên hiểu `acquire` là tiêu thụ và `release` là tạo ra permit",
    ],
    model: "Bốn synchronizer sách trình bày giải bốn bài toán phối hợp khác nhau. Latch là cửa chặn: nó giữ mọi thread lại cho tới khi đạt một trạng thái cuối, rồi mở ra cho tất cả đi qua — và đặc điểm quyết định là một khi đã mở thì không đóng lại được, nên nó dùng cho việc xảy ra đúng một lần như chờ khởi tạo xong. Barrier thoạt trông giống nhưng khác về bản chất: thay vì chờ một sự kiện, nó chờ **các thread gặp nhau** tại một điểm, và sau khi tất cả tới đủ thì cùng đi tiếp, dùng lại được cho vòng lặp sau — nên nó phục vụ tính toán chia pha. FutureTask mang ngữ nghĩa chờ kết quả một phép tính, chuyển từ trạng thái chờ sang hoàn tất. `Semaphore` thì đếm permit, và đây là chỗ hay bị mô tả sai: nó quản lý một tập permit ảo, số ban đầu truyền vào constructor; `acquire` block khi không còn permit, `release` trả permit về. Nó dùng để kiểm soát số lượng hoạt động truy cập một tài nguyên cùng lúc — sách nêu hai ứng dụng là hiện thực resource pool và áp giới hạn lên một collection. Trường hợp suy biến với đếm ban đầu bằng một là binary semaphore, dùng được như mutex, nhưng phải nói rõ ngữ nghĩa khoá của nó **không reentrant**, khác intrinsic lock. Và một điểm tinh tế đáng nêu: permit không được gắn với thread nào, nên permit acquire ở thread này hoàn toàn có thể release từ thread khác — vì vậy nên nghĩ `acquire` là tiêu thụ một permit và `release` là tạo ra một permit, và semaphore không bị giới hạn ở số permit nó được tạo ra ban đầu.",
    redFlags: [
      "Mô tả latch và barrier như cùng một thứ — latch chờ một sự kiện, barrier chờ các thread gặp nhau",
      "Nói binary semaphore là mutex mà không nêu nó không reentrant",
      "Tưởng permit gắn với thread đã acquire nó",
      "Cho rằng latch dùng lại được cho vòng sau",
    ],
    probes: [
      "Bạn dùng cái nào để giới hạn 10 request đồng thời đi ra một API bên ngoài?",
      "Vì sao sách nói cách dễ hơn để xây object pool có block là dùng một `BlockingQueue`?",
      "`Semaphore` biến một `Set` thường thành collection có giới hạn bằng cách nào?",
    ],
    refs: ["jcip-05"],
  },
  {
    id: "jcip-iq10",
    field: "jcip",
    topic: "jcip-blocks",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `public class VectorHelper {

    public static Object getLast(Vector<Object> list) {
        int lastIndex = list.size() - 1;
        return list.get(lastIndex);
    }

    public static void deleteLast(Vector<Object> list) {
        int lastIndex = list.size() - 1;
        list.remove(lastIndex);
    }
}

// Thread A                        Thread B
// getLast(shared)                 deleteLast(shared)`,
    },
    question: "`Vector` thread-safe, không thread nào làm hỏng cấu trúc nội bộ của nó. Vậy hai method này vẫn nổ `ArrayIndexOutOfBoundsException` bằng cách nào? Vẽ ra sự xen kẽ, rồi sửa.",
    mustCover: [
      "Cả hai method là chuỗi **check-then-act**: gọi `size` để lấy chỉ số, rồi dùng chỉ số đó ở một operation riêng sau",
      "Xen kẽ gây lỗi: A đọc `size` bằng 10 nên tính chỉ số 9, B xoá phần tử cuối, rồi A gọi `get(9)` trên một `Vector` chỉ còn 9 phần tử",
      "Hành vi này **nhất quán với đặc tả** của `Vector` — nó ném exception khi bị yêu cầu phần tử không tồn tại; sai là ở kỳ vọng của caller",
      "Sửa bằng **client-side locking**: bọc cả chuỗi trong `synchronized (list)`, dùng đúng lock mà `Vector` cam kết",
      "Iteration cũng là compound action và cũng cần cùng cách xử lý — kể cả các **iterator ẩn** trong `toString`, `hashCode`, `equals` hay `containsAll`",
    ],
    model: "Chìa khoá là phân biệt \"collection không bị hỏng\" với \"caller nhận được điều mình mong đợi\". `Vector` thread-safe nên dù bao nhiêu thread gọi đồng thời, cấu trúc nội bộ của nó vẫn toàn vẹn. Nhưng cả `getLast` và `deleteLast` đều là chuỗi check-then-act: chúng gọi `size` để xác định chỉ số rồi dùng chỉ số đó ở một operation **riêng biệt** tiếp sau, và giữa hai bước đó lock của `Vector` đã được nhả ra. Sự xen kẽ cụ thể: thread A gọi `getLast` trên một `Vector` mười phần tử, tính `lastIndex` bằng 9; thread B gọi `deleteLast` và xoá xong phần tử cuối; A gọi `get(9)` trên một `Vector` giờ chỉ còn 9 phần tử và nhận `ArrayIndexOutOfBoundsException`. Điều đáng nói là hành vi này hoàn toàn nhất quán với đặc tả của `Vector` — nó ném exception khi bị yêu cầu một phần tử không tồn tại. Cái sai không nằm trong `Vector` mà nằm ở kỳ vọng của caller, vốn cho rằng `getLast` không nổ trừ khi list rỗng ngay từ đầu. Sửa bằng client-side locking: bọc cả chuỗi hai bước trong `synchronized (list)` ở cả hai method, dùng đúng lock mà `Vector` cam kết dùng để bảo vệ state của nó. Điều phải nói thêm để câu trả lời đầy đủ là bài toán này không chỉ có ở cặp method này: iteration cũng là compound action và cũng cần khoá suốt vòng lặp, và nguy hiểm hơn là những **iterator ẩn** — `toString`, `hashCode`, `equals`, `containsAll`, `removeAll` đều duyệt collection bên trong, nên một dòng log tưởng vô hại cũng có thể nổ đúng kiểu này.",
    redFlags: [
      "Nói `Vector` \"không thread-safe thật\" — nó thread-safe đúng cam kết; lỗi ở compound action phía client",
      "Bọc từng lời gọi trong `synchronized` riêng lẻ, để nguyên khoảng hở giữa `size` và `get`",
      "Chuyển sang `ArrayList` không đồng bộ vì \"dù sao cũng phải tự khoá\" — mất cả bảo đảm cơ bản",
      "Không nhận ra iteration và iterator ẩn cũng cùng một loại lỗi",
    ],
    probes: [
      "Kể vài method trông vô hại nhưng thực ra duyệt collection bên trong",
      "Khoá suốt một vòng duyệt dài trả giá gì, và bạn làm gì thay thế?",
      "`ConcurrentHashMap` xử lý bài toán iteration này bằng cách nào?",
    ],
    refs: ["jcip-05"],
  },
  {
    id: "jcip-iq11",
    field: "jcip",
    topic: "jcip-blocks",
    level: 3,
    minutes: 10,
    question: "Bạn phải giới hạn số công việc đang chạy đồng thời trong một pipeline producer-consumer. Chọn `BlockingQueue` có giới hạn hay `Semaphore`?",
    tradeoffs: [
      {
        option: "`BlockingQueue` có giới hạn",
        when: "Khi công việc **đi qua** một hàng đợi và bạn muốn giới hạn chính là kích thước hàng đợi đó. Nó cho luôn cả **serial thread confinement** — object được chuyển giao an toàn từ producer sang đúng một consumer — và sách nói đây cũng là cách dễ hơn để xây một object pool có block.",
      },
      {
        option: "`Semaphore`",
        when: "Khi công việc **không** đi qua hàng đợi mà bạn chỉ cần đếm số hoạt động đồng thời — chẳng hạn giới hạn số lời gọi song song ra một API bên ngoài, hay biến một collection có sẵn thành collection có giới hạn mà chính collection đó không biết gì về giới hạn.",
      },
    ],
    mustCover: [
      "`BlockingQueue` có giới hạn tạo ra **áp lực ngược**: producer bị block khi hàng đợi đầy, nên tốc độ tự điều tiết theo consumer",
      "Nó còn cho **serial thread confinement**: quyền sở hữu object được chuyển giao an toàn từ producer sang đúng một consumer",
      "`Semaphore` đếm hoạt động đồng thời chứ không giữ công việc, nên nó áp được giới hạn lên thứ **không phải hàng đợi**",
      "Permit không gắn với thread, nên `Semaphore` mô hình hoá được cả những luồng mà chỗ acquire khác chỗ release",
      "Hàng đợi **không giới hạn** là bẫy thật: nó biến quá tải thành cạn bộ nhớ thay vì thành áp lực ngược",
    ],
    model: "Câu hỏi tự phân giải khi hỏi công việc có **đi qua** một hàng đợi hay không. Nếu có, `BlockingQueue` có giới hạn là lựa chọn đúng và cho nhiều hơn điều ta xin: producer bị block khi hàng đợi đầy, nên hệ thống tự sinh áp lực ngược và tốc độ nạp việc tự điều tiết theo tốc độ tiêu thụ; đồng thời nó cho serial thread confinement — quyền sở hữu một object được chuyển giao an toàn từ producer sang đúng một consumer, nên object khả biến vẫn dùng được mà không cần khoá thêm, miễn không ai giữ lại tham chiếu sau khi trao. Điểm phải nhấn ở đây là giới hạn không phải chi tiết phụ: hàng đợi không giới hạn biến quá tải thành cạn bộ nhớ thay vì thành áp lực ngược, và đó là một trong những cách sập âm thầm nhất của pipeline. `Semaphore` giải bài khác: nó đếm permit chứ không giữ công việc, nên nó áp giới hạn lên những thứ không có hình dạng hàng đợi — số lời gọi song song ra một API bên ngoài, số kết nối đồng thời, hay như ví dụ của sách là biến một `Set` thường thành collection có giới hạn, với `add` acquire permit trước khi thêm và release ngay nếu thao tác thêm không thực sự xảy ra; `Set` bên dưới không biết gì về giới hạn. Một đặc tính của `Semaphore` mở thêm khả năng mô hình hoá: permit không gắn với thread, nên chỗ acquire và chỗ release có thể ở hai thread khác nhau — hữu ích cho luồng bất đồng bộ, và cũng là lý do phải cẩn thận vì release quá số lần sẽ âm thầm nâng trần lên. Với pipeline trong câu hỏi, tôi chọn `BlockingQueue` có giới hạn, và giữ `Semaphore` cho tầng gọi ra ngoài nếu tầng đó cần trần riêng.",
    redFlags: [
      "Dùng hàng đợi không giới hạn rồi coi là đã có producer-consumer — mất áp lực ngược, quá tải thành cạn bộ nhớ",
      "Chọn `Semaphore` cho một luồng vốn đã đi qua hàng đợi, tự tay dựng lại thứ hàng đợi cho sẵn",
      "Không biết `BlockingQueue` cho serial thread confinement, nên vẫn khoá object sau khi đã trao tay",
      "Release permit nhiều hơn số lần acquire và tưởng semaphore sẽ tự chặn",
    ],
    probes: [
      "Serial thread confinement cho phép bạn bỏ bớt việc gì?",
      "Nếu producer không được phép block thì bạn làm gì với hàng đợi đầy?",
      "Vì sao sách nói `BlockingQueue` là cách dễ hơn để xây object pool có block so với `Semaphore`?",
    ],
    refs: ["jcip-05"],
  },
  {
    id: "jcip-iq12",
    field: "jcip",
    topic: "jcip-blocks",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ nhập liệu treo cứng sau khoảng 40 phút chạy: không ném exception, không tăng CPU, chỉ là không còn bản ghi nào được xử lý. Thread dump cho thấy 8 consumer thread đều đứng ở `take()` trên một `BlockingQueue`, còn producer thread duy nhất thì không còn trong dump. Hàng đợi rỗng.",
      scale: "Bình thường xử lý 15.000 bản ghi mỗi phút. Sự cố xảy ra 2–3 lần mỗi tuần, luôn sau 30–60 phút, và chỉ cần khởi động lại là hết — nên đã bị bỏ qua 5 tháng.",
      constraints: "Không đổi được số consumer (đã được chốt theo số phân vùng nguồn dữ liệu). Không dùng được hàng đợi không giới hạn — bộ nhớ container bị giới hạn 512MB. Phải phát hiện được sự cố trong vòng 2 phút thay vì chờ ai đó báo.",
    },
    question: "Producer biến mất khỏi thread dump nói lên điều gì? Nêu nguyên nhân, cách sửa, và cách bạn làm sự cố này tự phơi ra.",
    mustCover: [
      "Producer **không còn trong dump** nghĩa là thread đó đã **chết**, gần như chắc chắn do một exception chưa bắt thoát ra khỏi `run()`",
      "Consumer đứng ở `take()` là hành vi **đúng** của `BlockingQueue`: hàng đợi rỗng thì chờ, và chờ mãi vì không ai còn nạp việc",
      "Không có exception trong log vì exception chưa bắt của một thread không đi qua log của ứng dụng nếu không có handler",
      "Sửa gốc: bọc thân `run()` của producer để mọi exception được ghi lại, và **không** để một bản ghi lỗi giết cả thread",
      "Cần một cơ chế **poison pill** hoặc `take()` có timeout, để consumer không chờ vô hạn khi producer đã chết",
      "Làm sự cố tự phơi ra: theo dõi số bản ghi xử lý được và trạng thái sống của producer, báo động khi thông lượng về 0 trong 2 phút",
    ],
    model: "Chi tiết quyết định trong đề bài là producer không còn trong thread dump. Một thread chỉ biến mất khỏi dump khi nó đã kết thúc, và với một producer lẽ ra chạy mãi thì gần như chắc chắn nó chết vì một exception chưa bắt thoát ra khỏi `run()`. Điều đó giải thích trọn bộ triệu chứng: consumer đứng ở `take()` không phải lỗi mà là hành vi đúng của `BlockingQueue` — hàng đợi rỗng thì chờ — và chúng chờ mãi vì không còn ai nạp việc. Không CPU, không exception, không tiến triển. Việc log sạch bong cũng khớp: exception chưa bắt của một thread không đi qua log ứng dụng nếu thread đó không có handler, nó chỉ vào `UncaughtExceptionHandler` mặc định và thường biến mất trong output của container. Tính chất \"sau 30–60 phút\" thì gợi một bản ghi dữ liệu xấu xuất hiện rải rác, không phải lỗi cạnh tranh. Sửa theo ba lớp. Lớp thứ nhất là gốc rễ: thân `run()` của producer phải bọc để mọi exception được ghi lại kèm ngữ cảnh, và phải phân biệt lỗi của **một bản ghi** với lỗi của **cả luồng** — một dòng dữ liệu xấu phải bị bỏ qua và ghi log, không được giết thread; chỉ lỗi thật sự không thể tiếp tục mới được dừng. Lớp thứ hai là làm hệ thống không treo im lặng kể cả khi producer vẫn chết: dùng poison pill để producer báo hết việc khi nó thoát có chủ đích, và cho consumer dùng `take()` có timeout để chúng còn ghi được log \"chờ quá lâu\" thay vì đứng câm. Lớp thứ ba là phát hiện, và đây là phần đề bài đòi rõ: đếm số bản ghi xử lý được theo cửa sổ thời gian rồi báo động khi thông lượng về 0 quá 2 phút, cộng một chỉ số về trạng thái sống của producer — vì chính chỉ số thứ hai mới nói ngay nguyên nhân thay vì chỉ nói có sự cố. Cả ba lớp đều không cần đổi số consumer và không cần hàng đợi không giới hạn, nên thoả hết ràng buộc.",
    redFlags: [
      "Kết luận consumer bị deadlock — chúng đang chờ đúng như thiết kế, không giữ lock nào cả",
      "Chuyển sang hàng đợi không giới hạn để \"tránh block\": vi phạm giới hạn 512MB và không liên quan tới nguyên nhân",
      "Tăng số consumer, trong khi vấn đề là không có việc nào được nạp vào",
      "Bỏ qua vì \"khởi động lại là hết\" — đúng thứ đã để sự cố sống 5 tháng",
      "Bọc `run()` bằng `catch (Exception e) {}` rỗng: thread sống nhưng lỗi biến mất hoàn toàn",
    ],
    probes: [
      "Vì sao log ứng dụng không có gì dù một thread đã chết vì exception?",
      "Poison pill hoạt động thế nào với 8 consumer, và cần bao nhiêu cái?",
      "Bạn phân biệt \"một bản ghi lỗi\" với \"luồng không thể tiếp tục\" bằng tiêu chí nào?",
    ],
    refs: ["jcip-05", "jcip-07"],
  },
];
