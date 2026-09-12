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

  // ===== jcip-exec — Thực thi task, huỷ và thread pool (jcip-iq13–jcip-iq16) =====
  {
    id: "jcip-iq13",
    field: "jcip",
    topic: "jcip-exec",
    level: 1,
    minutes: 6,
    question: "Sách nói framework `Executor` tách việc gửi task khỏi việc thực thi task, rồi tự nhận định đó \"hơi quá lời\". Những loại task nào ràng buộc ngầm lên execution policy?",
    mustCover: [
      "**Task phụ thuộc nhau**: gửi task phụ thuộc task khác vào cùng pool tạo ràng buộc ngầm lên execution policy và có thể gây vấn đề liveness",
      "**Task khai thác thread confinement**: executor single-threaded bảo đảm task **không chạy đồng thời**, nên mã task được phép nới lỏng thread safety",
      "Đổi từ single-threaded sang pool nhiều thread có thể **mất thread safety** — bảo đảm mà mã task đang dựa vào biến mất",
      "Yêu cầu thật của loại task đó không phải \"đúng một thread\", mà là task không chạy đồng thời **và** hiệu ứng bộ nhớ của task này nhìn thấy được với task sau",
      "Hệ quả thực hành: task **độc lập** cho phép đổi kích thước và cấu hình pool mà không ảnh hưởng gì ngoài hiệu năng",
    ],
    model: "Sách tự đính chính vì `Executor` tách được *cơ chế* nhưng không tách được *giả định*. Hai loại task mang ràng buộc ngầm. Thứ nhất là task phụ thuộc nhau: task hành xử tốt nhất là task độc lập, không phụ thuộc thời điểm, kết quả hay tác dụng phụ của task khác — với chúng ta đổi kích thước và cấu hình pool tuỳ ý, ảnh hưởng duy nhất là hiệu năng. Nhưng khi gửi task phụ thuộc task khác vào cùng một pool, ta ngầm tạo ràng buộc lên execution policy và phải quản lý cẩn thận để tránh vấn đề liveness — trường hợp kinh điển là một task chờ kết quả của task khác trong khi cả hai cùng tranh số thread hữu hạn của một pool. Thứ hai, và tinh vi hơn, là task khai thác thread confinement: executor single-threaded đưa ra cam kết mạnh hơn một pool bất kỳ, nó bảo đảm task không được thực thi đồng thời, nên ta được phép nới lỏng thread safety trong mã task và cho object bị giam vào thread đó, truy cập không cần synchronization kể cả khi chúng không thread-safe. Đây là gắn kết ngầm rõ nhất: task **đòi hỏi** executor của nó phải là single-threaded, và nếu ai đó đổi sang thread pool thì thread safety mất, âm thầm. Sách còn nói chính xác hơn ở chú thích: yêu cầu thực ra không mạnh đến mức \"đúng một thread\", mà là bảo đảm task không chạy đồng thời và có đủ synchronization để hiệu ứng bộ nhớ của task này nhìn thấy được với task tiếp theo — đúng bộ bảo đảm mà `newSingleThreadExecutor` cung cấp. Bài học vận hành: những ràng buộc này không nằm trong chữ ký nào, nên phải ghi thành tài liệu, nếu không một lần \"tối ưu\" pool sẽ phá chúng.",
    redFlags: [
      "Nói `Executor` tách hoàn toàn task khỏi execution policy nên đổi pool luôn an toàn",
      "Không phân biệt task độc lập với task phụ thuộc khi bàn về việc đổi kích thước pool",
      "Tưởng executor single-threaded chỉ khác pool ở hiệu năng, không thấy nó là một cam kết ngữ nghĩa",
    ],
    probes: [
      "Cho một ví dụ task phụ thuộc gây đứng khi pool quá nhỏ",
      "Bạn ghi ràng buộc \"task này cần executor single-threaded\" ở đâu để người sau không phá?",
      "Bảo đảm mà `newSingleThreadExecutor` cho, phát biểu chính xác là gì?",
    ],
    refs: ["jcip-08", "jcip-06"],
  },
  {
    id: "jcip-iq14",
    field: "jcip",
    topic: "jcip-exec",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class ReportGenerator {
    private final ExecutorService pool = Executors.newFixedThreadPool(4);

    public Report generate(List<Long> regionIds) throws Exception {
        List<Future<Section>> futures = new ArrayList<>();
        for (Long id : regionIds) {
            futures.add(pool.submit(() -> {
                // mỗi region lại chia nhỏ thành 3 phần và gửi tiếp vào CÙNG pool
                List<Future<Part>> parts = new ArrayList<>();
                for (int i = 0; i < 3; i++) {
                    int k = i;
                    parts.add(pool.submit(() -> fetchPart(id, k)));
                }
                List<Part> done = new ArrayList<>();
                for (Future<Part> f : parts) done.add(f.get());   // chờ ở đây
                return merge(done);
            }));
        }
        List<Section> sections = new ArrayList<>();
        for (Future<Section> f : futures) sections.add(f.get());
        return assemble(sections);
    }
}`,
    },
    question: "Với 3 region thì method này chạy tốt; với 5 region nó treo vĩnh viễn và không ném gì. Giải thích bằng cơ chế, rồi nêu hai cách sửa.",
    mustCover: [
      "Task cha **chiếm một thread và chờ** task con, nhưng task con lại xếp hàng sau chính những task cha đang chiếm hết thread",
      "Với pool 4 thread và 5 region, 4 task cha chiếm sạch thread; task con không bao giờ được lập lịch nên không `Future` nào hoàn tất",
      "Gọi đúng tên hiện tượng — **thread starvation deadlock** — và nêu được **ngưỡng chính xác**: nó xảy ra ngay khi số task cha đồng thời đạt kích thước pool",
      "Không exception nào ném ra vì mọi thread đều đang chờ `get()` một cách hợp lệ — pool không có cơ chế phát hiện chu trình như database server",
      "Cách sửa thứ nhất: **hai pool riêng** — task cha và task con không tranh cùng tập thread",
      "Cách sửa thứ hai: **bỏ hẳn việc chờ lồng** — dàn phẳng thành một đợt gửi task con rồi mới gộp kết quả ở tầng gọi",
    ],
    model: "Lỗi không nằm ở số học mà ở hình dạng phụ thuộc. Mỗi task cha, sau khi gửi ba task con, **chiếm một thread của pool và ngồi chờ** `f.get()`. Nhưng ba task con ấy lại nằm trong hàng đợi của chính pool đó, phía sau những task cha đang chiếm thread. Với pool 4 thread: 3 region thì 3 task cha chiếm 3 thread, còn một thread rảnh để task con lần lượt chạy, nên nó bò được tới đích. Với 5 region thì 4 task cha chiếm sạch 4 thread và cùng chờ; không thread nào còn để chạy task con; không task con nào hoàn tất; không task cha nào thoát khỏi `get()`. Sách gọi đúng tên đây là thread starvation deadlock, và đặt nó vào phần gắn kết ngầm giữa task và execution policy: task phụ thuộc nhau gửi vào cùng pool tạo ràng buộc lên chính sách thực thi, và ràng buộc đó bị vi phạm ngay khi số task cha đạt kích thước pool. Không có exception nào vì mọi thread đều đang chờ một cách hoàn toàn hợp lệ — và khác database server vốn tìm chu trình trong đồ thị chờ rồi chọn nạn nhân để abort, JVM không làm gì cả; khi một tập thread Java deadlock thì thế là hết. Hai cách sửa khác bản chất. Cách thứ nhất giữ nguyên cấu trúc lồng nhưng cho task cha và task con **hai pool riêng**, nên chúng không bao giờ tranh cùng tập thread — rẻ, ít sửa mã, nhưng vẫn để lại một đường đi có thread ngồi chờ. Cách thứ hai, tôi ưa hơn, là bỏ hẳn việc chờ lồng: dàn phẳng thành một đợt gửi toàn bộ task con lên pool, rồi gộp kết quả theo region ở tầng gọi. Khi đó không task nào trong pool chờ task nào trong pool, ràng buộc ngầm biến mất, và kích thước pool trở lại là thứ chỉ ảnh hưởng tới hiệu năng — đúng tính chất mà sách nói task độc lập mang lại.",
    redFlags: [
      "Tăng kích thước pool để chữa — chỉ đẩy ngưỡng treo lên cao hơn, hình dạng phụ thuộc còn nguyên",
      "Thêm timeout cho `get()` rồi coi là xong: phát hiện được sự cố nhưng báo cáo vẫn không sinh ra",
      "Đổi sang `newCachedThreadPool` vì \"pool không giới hạn thì không treo\" — đổi deadlock thành nguy cơ cạn thread của cả tiến trình",
      "Nói đây là deadlock do lock, trong khi không lock nào tham gia — nó là cạn thread",
    ],
    probes: [
      "Vì sao 3 region chạy được mà 5 thì không — ngưỡng chính xác nằm ở đâu?",
      "Nếu buộc phải giữ cấu trúc lồng, hai pool riêng đủ an toàn trong mọi trường hợp chưa?",
      "Vì sao JVM không tự phát hiện tình huống này như database server làm với transaction?",
    ],
    refs: ["jcip-08", "jcip-06"],
  },
  {
    id: "jcip-iq15",
    field: "jcip",
    topic: "jcip-exec",
    level: 3,
    minutes: 10,
    question: "Bạn phải chọn kích thước cho thread pool xử lý request của một service. Bạn quyết định theo cách nào, và điều gì làm bạn đổi con số?",
    tradeoffs: [
      {
        option: "Task thiên về tính toán — khoảng `N` processor cộng một",
        when: "Task gần như chỉ dùng CPU. Sách giải thích lý do có thêm một thread: kể cả thread thiên tính toán cũng thỉnh thoảng gặp page fault hay tạm dừng, nên một thread dư sẵn sàng chạy giúp không bỏ phí chu kỳ CPU.",
      },
      {
        option: "Task có I/O hoặc blocking — mở rộng theo tỉ lệ chờ trên tính",
        when: "Task có gọi mạng, đọc đĩa hay chờ khoá. Pool phải lớn hơn vì không phải thread nào cũng được lập lịch ở mọi thời điểm; phải **ước lượng tỉ lệ giữa thời gian chờ và thời gian tính**, và ước lượng này không cần chính xác — profiling hay instrumentation là đủ.",
      },
      {
        option: "Nhiều pool riêng cho từng loại task",
        when: "Khi có những loại task hành vi rất khác nhau, hoặc khi task cần một tài nguyên khan hiếm như JDBC connection. Mỗi pool tinh chỉnh theo khối lượng công việc của nó, và nó cũng là cách khử ràng buộc ngầm khi task phụ thuộc nhau.",
      },
    ],
    mustCover: [
      "Kích thước pool **hiếm khi nên hard-code** — nên lấy từ cấu hình hoặc tính động từ số processor có sẵn",
      "Chỉ cần tránh hai cực đoan: quá lớn thì thread tranh CPU và bộ nhớ, có thể cạn tài nguyên; quá nhỏ thì thông lượng suy giảm vì processor rảnh dù có việc",
      "Phải biết ba thứ: môi trường tính toán, ngân sách tài nguyên, và bản chất task",
      "Nếu task cần một **tài nguyên khan hiếm** như JDBC connection thì chính tài nguyên đó là trần thật, không phải số CPU",
      "Đây không phải khoa học chính xác: cách thực tế là chạy với vài kích thước dưới tải benchmark và quan sát mức dùng CPU",
    ],
    model: "Sách mở đầu bằng một câu đáng lấy làm nguyên tắc: xác định kích thước thread pool không phải khoa học chính xác, may mắn là ta chỉ cần tránh hai cực đoan. Quá lớn thì thread cạnh tranh CPU và bộ nhớ khan hiếm, đẩy mức dùng bộ nhớ lên và có thể cạn tài nguyên; quá nhỏ thì thông lượng suy giảm vì processor không được dùng dù có việc chờ. Nên trước khi tính, tôi trả lời ba câu hỏi sách đặt ra: hệ thống có bao nhiêu processor và bao nhiêu bộ nhớ, task chủ yếu tính toán hay I/O hay cả hai, và task có cần tài nguyên khan hiếm nào không. Câu thứ ba quan trọng hơn vẻ ngoài: nếu mỗi task giữ một JDBC connection thì trần thật là kích thước connection pool, và nới thread pool vượt qua đó chỉ tạo ra một hàng đợi chờ connection — con số đúng không đến từ số CPU. Với task thiên tính toán, điểm khởi đầu là số processor cộng một, và lý do của cái \"cộng một\" đáng nói ra vì nó cho thấy đang suy nghĩ đúng tầng: kể cả thread tính toán thuần cũng thỉnh thoảng gặp page fault hay tạm dừng, nên một thread dư sẵn sàng chạy ngăn chu kỳ CPU bị bỏ phí. Với task có I/O thì pool phải lớn hơn và đại lượng cần ước lượng là tỉ lệ giữa thời gian chờ và thời gian tính — sách nhấn rằng ước lượng này không cần chính xác, lấy từ profiling hoặc instrumentation là đủ. Khi có nhiều loại task hành vi rất khác nhau, tôi tách pool để mỗi cái tinh chỉnh riêng, và đó cũng là cách khử gắn kết ngầm nếu có task phụ thuộc nhau. Cuối cùng, tôi không hard-code con số: lấy từ cấu hình hoặc tính từ số processor có sẵn, rồi chạy vài kích thước dưới tải benchmark và quan sát mức dùng CPU — vì con số đúng phụ thuộc hệ thống triển khai, không phụ thuộc công thức.",
    redFlags: [
      "Đưa ra một công thức rồi dừng, không hỏi task là loại gì và có tài nguyên khan hiếm nào",
      "Hard-code kích thước pool trong mã",
      "Nới thread pool trong khi trần thật là connection pool — chỉ tạo thêm hàng đợi chờ connection",
      "Giải thích \"cộng một\" là quy ước, không nêu lý do về page fault và chu kỳ CPU bỏ phí",
    ],
    probes: [
      "Mỗi task giữ một JDBC connection từ pool 20 — con số của bạn đổi thế nào?",
      "Bạn đo tỉ lệ chờ trên tính bằng cách gì?",
      "Định luật Amdahl nói gì về giới hạn của việc thêm thread?",
    ],
    refs: ["jcip-08", "jcip-11"],
  },
  {
    id: "jcip-iq16",
    field: "jcip",
    topic: "jcip-exec",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ gửi thông báo im lặng bỏ mất khoảng 0,3% tin nhắn. Không log lỗi, không metric nào giảm, chỉ có khách hàng báo không nhận được. Mã gửi dùng `pool.submit(task)` và **không** giữ lại `Future`. Task có một nhánh ném `IllegalStateException` khi bản ghi thiếu số điện thoại.",
      scale: "4,1 triệu thông báo mỗi ngày, nên 0,3% là khoảng 12.000 tin nhắn. Đã chạy 14 tháng. Pool là `newFixedThreadPool(32)`.",
      constraints: "Không đổi được chữ ký của method gửi vì 6 chỗ gọi. Không được làm chậm đường gửi — đây là đường nóng, p99 hiện 40ms. Phải truy được những tin nhắn đã mất trong 30 ngày gần nhất.",
    },
    question: "Vì sao exception biến mất hoàn toàn mà thread pool vẫn sống? Nêu cách sửa và cách truy lại 12.000 tin nhắn mỗi ngày.",
    mustCover: [
      "`submit()` **bắt và gói** exception của task vào `Future`; không gọi `get()` thì exception không bao giờ được quan sát",
      "Khác `execute()`, vốn để exception thoát ra tới `UncaughtExceptionHandler` — nên với `submit` thì `UncaughtExceptionHandler` **không** chạy",
      "Đó là lý do thread pool vẫn khoẻ: thread không chết, nó chỉ hoàn tất một task đã thất bại và nhận task tiếp theo",
      "Sửa mà không làm chậm đường gửi: bọc thân task trong `try/catch` của chính nó và ghi log kèm ngữ cảnh — chi phí bằng không khi không có lỗi",
      "Lỗi dữ liệu (thiếu số điện thoại) phải được **kiểm ở tầng đầu vào** và trở thành trạng thái nghiệp vụ, không phải exception ném từ trong pool",
      "Truy lại tin nhắn mất bằng đối soát: so tập yêu cầu gửi với tập đã gửi thành công trên bản lưu trữ, không dựa vào log",
    ],
    model: "Cơ chế nằm ở khác biệt giữa `submit` và `execute`. `submit` bọc task lại và **bắt** mọi exception thoát ra, gói vào `Future` để caller lấy qua `get()`. Nếu không ai giữ `Future` và không ai gọi `get()`, exception đó nằm trong một object bị thu gom rác mà không ai từng đọc — nên nó biến mất trọn vẹn: không log, không `UncaughtExceptionHandler`, không metric. Với `execute` thì ngược lại, exception thoát tới `UncaughtExceptionHandler` và ít nhất còn thấy được. Điều này cũng giải thích vì sao pool vẫn khoẻ suốt 14 tháng: thread không chết, nó chỉ kết thúc một task đã thất bại rồi nhận task kế tiếp — hệ thống mất việc mà không mất năng lực, đúng dạng hỏng khó thấy nhất. Về cách sửa, ràng buộc \"không làm chậm đường nóng\" thực ra không cản gì: tôi bọc thân task trong `try/catch` của chính nó, ghi log kèm id bản ghi và lý do, và tăng một counter lỗi — `try/catch` không tốn gì khi không có exception, nên p99 không đổi. Chữ ký method gửi cũng giữ nguyên vì thay đổi nằm bên trong task chứ không ở giao diện, nên 6 chỗ gọi không phải sửa. Nhưng đó chỉ là cầm máu; nguyên nhân sâu hơn là một lỗi dữ liệu bình thường — bản ghi thiếu số điện thoại — đang được biểu đạt bằng exception ném từ trong một pool không ai quan sát. Việc đó phải chuyển lên tầng đầu vào: kiểm tính hợp lệ trước khi gửi vào pool, và biến \"thiếu số điện thoại\" thành một trạng thái nghiệp vụ có ghi nhận, có báo cáo, thay vì một ngoại lệ. Riêng 12.000 tin mỗi ngày thì không thể lấy từ log vì log chưa từng có gì; tôi đối soát trên bản lưu trữ — so tập yêu cầu gửi với tập đã gửi thành công trong 30 ngày, phần chênh chính là tập đã mất, và tập đó vừa để gửi bù vừa để kiểm chứng rằng bản vá đã thật sự chặn được lỗ hổng.",
    redFlags: [
      "Gọi `get()` ngay sau `submit()` trên đường nóng — biến gửi bất đồng bộ thành đồng bộ, phá p99",
      "Đặt một `UncaughtExceptionHandler` rồi tưởng đã xong: với `submit` nó không bao giờ được gọi",
      "Bọc `catch (Exception e) {}` rỗng để \"cho an toàn\" — vẫn mất tin nhắn, chỉ khác là mất có chủ ý",
      "Dựa vào log để dựng lại 30 ngày, trong khi log chưa từng ghi gì về những tin nhắn này",
      "Kết luận 0,3% là \"trong ngưỡng chấp nhận\" mà không hỏi 0,3% đó là gì",
    ],
    probes: [
      "Khác biệt chính xác giữa `submit` và `execute` về xử lý exception là gì?",
      "Nếu phải giữ `submit` và không được gọi `get()`, còn cách nào quan sát được lỗi?",
      "Bạn viết metric gì để lần sau lỗi này tự phơi ra trong vòng vài phút?",
    ],
    refs: ["jcip-07", "jcip-06"],
  },

  // ===== jcip-liveness — Deadlock, hiệu năng & khả năng mở rộng (jcip-iq17–jcip-iq20) =====
  {
    id: "jcip-iq17",
    field: "jcip",
    topic: "jcip-liveness",
    level: 1,
    minutes: 6,
    question: "So sánh cách một database server và JVM đối xử với deadlock. Khác biệt đó đổi gì trong cách bạn viết mã Java?",
    mustCover: [
      "Deadlock là nhiều thread chờ mãi mãi do một **phụ thuộc locking có chu trình** — nghĩ theo đồ thị có hướng \"A chờ tài nguyên B giữ\", có chu trình là có deadlock",
      "Database server **phát hiện và khôi phục**: tìm chu trình trong đồ thị đang-chờ, chọn một **nạn nhân** và abort transaction đó để nhả lock",
      "Ứng dụng sau đó **thử lại** transaction bị abort, và lần này thường xong vì bên cạnh tranh đã kết thúc",
      "JVM **không làm gì cả**: khi một tập thread Java deadlock thì thế là hết, chúng vĩnh viễn ngừng hoạt động",
      "Cách duy nhất đưa ứng dụng trở lại khoẻ là **abort và khởi động lại** — nên với Java, phòng ngừa là toàn bộ chiến lược",
      "Deadlock hiếm khi biểu hiện ngay: class có nguy cơ deadlock không có nghĩa nó sẽ deadlock, và khi nó xảy ra thì thường **dưới tải nặng ở production**",
    ],
    model: "Về bản chất thì hai bên gặp cùng một hiện tượng: nhiều bên chờ mãi mãi do phụ thuộc locking có chu trình — cách hình dung của sách là coi thread như node của một đồ thị có hướng, cạnh biểu diễn quan hệ \"A đang chờ tài nguyên do B giữ\", và chu trình trong đồ thị đó chính là deadlock. Khác biệt nằm ở cách đối xử. Database server được thiết kế để phát hiện và khôi phục: nó tìm chu trình trong đồ thị đang-chờ, chọn một nạn nhân, abort transaction đó để nhả lock, và các transaction khác tiếp tục; ứng dụng thử lại transaction bị abort và lần này thường hoàn tất vì bên cạnh tranh đã xong. Nên với database, deadlock là một điều kiện vận hành có thể sống cùng, miễn mã có đường thử lại. JVM thì không hữu ích được như vậy: khi một tập thread Java deadlock, thế là hết — chúng vĩnh viễn ngừng hoạt động, và tuỳ chúng đang làm gì mà ứng dụng đứng hình hoàn toàn, hoặc một subsystem đứng, hoặc hiệu năng suy giảm. Cách duy nhất để đưa ứng dụng trở lại khoẻ là abort và khởi động lại rồi hy vọng nó không tái diễn. Khác biệt đó đổi hẳn chiến lược: với Java không có cơ chế hồi phục nào để dựa vào, nên toàn bộ công phải dồn vào phòng ngừa — thứ tự khoá nhất quán trên toàn hệ thống, không gọi method lạ khi đang giữ lock, thu hẹp phạm vi lock, và dùng khoá có timeout ở những chỗ không bảo đảm được thứ tự. Thêm một điểm khiến việc này khó: deadlock hiếm khi biểu hiện ngay, việc một class có nguy cơ deadlock không có nghĩa nó sẽ deadlock, chỉ là nó có thể — và khi nó thật sự xảy ra thì thường vào thời điểm tệ nhất, dưới tải nặng ở production. Nên không thể trông cậy vào việc kiểm thử tìm ra nó.",
    redFlags: [
      "Tin rằng JVM tự phát hiện và khôi phục deadlock giống database",
      "Nói \"cứ thử lại là được\" cho deadlock Java — không có ai abort thread để mà thử lại",
      "Kết luận kiểm thử không thấy deadlock nghĩa là mã không có nguy cơ",
    ],
    probes: [
      "Bạn phòng ngừa deadlock bằng những kỹ thuật nào, xếp theo thứ tự ưu tiên?",
      "Vì sao gọi một method lạ trong lúc giữ lock là nguy hiểm?",
      "Thread dump cho bạn thấy gì khi deadlock đã xảy ra?",
    ],
    refs: ["jcip-10"],
  },
  {
    id: "jcip-iq18",
    field: "jcip",
    topic: "jcip-liveness",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `public class Account {
    private final Object lock = new Object();
    private BigDecimal balance;

    public void transfer(Account to, BigDecimal amount) {
        synchronized (this.lock) {
            synchronized (to.lock) {
                this.balance = this.balance.subtract(amount);
                to.balance = to.balance.add(amount);
            }
        }
    }
}

// Thread A: accountX.transfer(accountY, TEN);
// Thread B: accountY.transfer(accountX, TEN);`,
    },
    question: "Vẽ ra sự xen kẽ làm hai thread này chờ mãi mãi, rồi sửa mà vẫn giữ được tính nguyên tử của việc chuyển tiền.",
    mustCover: [
      "A lấy lock của X rồi chờ lock của Y; B lấy lock của Y rồi chờ lock của X — phụ thuộc có chu trình, cả hai chờ mãi mãi",
      "Thứ tự khoá ở đây phụ thuộc **tham số truyền vào**, nên hai lời gọi ngược chiều nhau tạo ra hai thứ tự khoá trái nhau",
      "Cách sửa chuẩn: áp một **thứ tự khoá toàn cục** không phụ thuộc lời gọi — sắp hai account theo một khoá so sánh được rồi khoá theo thứ tự đó",
      "Khoá so sánh phải **ổn định và duy nhất**; `System.identityHashCode` có thể trùng nên cần một lock phụ cho trường hợp trùng",
      "Tính nguyên tử được giữ vì vẫn khoá cả hai account trước khi sửa, chỉ đổi **thứ tự** lấy lock",
      "Phương án thay thế khi không áp được thứ tự: dùng khoá có **timeout** rồi thử lại, tức chuyển deadlock thành thất bại tạm thời",
    ],
    model: "Sự xen kẽ rất ngắn: thread A gọi `accountX.transfer(accountY, …)` nên lấy lock của X rồi xin lock của Y; cùng lúc thread B gọi `accountY.transfer(accountX, …)` nên lấy lock của Y rồi xin lock của X. Mỗi bên giữ đúng thứ bên kia cần và không nhả cho tới khi lấy được thứ mình chưa có — đúng định nghĩa deadlock, và đúng phiên bản \"triết gia ăn tối\" mà sách dùng để mở đầu chương. Điều làm mã này nguy hiểm là thứ tự khoá không nằm trong mã mà nằm trong **tham số**: cùng một dòng `synchronized` lồng nhau sinh ra thứ tự khoá khác nhau tuỳ ai gọi với đối số nào, nên đọc mã không thấy gì sai. Cách sửa chuẩn là làm thứ tự khoá trở thành thuộc tính của hệ thống chứ không của lời gọi: chọn một khoá so sánh được, ổn định và duy nhất cho mỗi account — id số của account là lựa chọn tự nhiên nhất — rồi luôn khoá theo thứ tự tăng dần của khoá đó, bất kể ai là bên gửi. Khi đó A và B đều khoá X trước Y, một bên phải chờ nhưng không bên nào chờ mãi. Nếu không có id ổn định thì có thể dùng `System.identityHashCode`, nhưng phải nói kèm cái bẫy: giá trị đó có thể trùng nhau, nên cần một lock phụ dùng riêng cho trường hợp trùng, khoá nó trước rồi mới khoá hai account. Tính nguyên tử của việc chuyển tiền không bị ảnh hưởng: ta vẫn giữ cả hai lock trước khi sửa số dư, chỉ đổi thứ tự lấy. Còn nếu ở một hệ thống mà không áp được thứ tự toàn cục — chẳng hạn lock đến từ những thành phần không do ta kiểm soát — thì phương án là khoá có timeout rồi thử lại, tức chấp nhận biến deadlock thành một thất bại tạm thời quan sát được, thứ luôn tốt hơn một treo vĩnh viễn.",
    redFlags: [
      "Bỏ lock lồng và khoá từng account riêng lẻ — hết deadlock nhưng mất nguyên tử, xuất hiện trạng thái tiền đã trừ chưa cộng",
      "Dùng một lock tĩnh duy nhất cho mọi account: đúng nhưng tuần tự hoá toàn bộ hệ thống chuyển tiền",
      "Nói \"hiếm khi xảy ra nên bỏ qua\" — sách nói rõ nó sẽ xảy ra dưới tải nặng ở production",
      "Dùng `identityHashCode` làm thứ tự mà không xử lý trường hợp trùng giá trị",
    ],
    probes: [
      "Vì sao một lock tĩnh duy nhất là đúng nhưng tồi?",
      "Nếu chuyển tiền phải đi qua ba account thì cách sửa của bạn còn đủ không?",
      "Khoá có timeout đổi chế độ hỏng thành gì, và bên gọi phải làm gì thêm?",
    ],
    refs: ["jcip-10", "jcip-13"],
  },
  {
    id: "jcip-iq19",
    field: "jcip",
    topic: "jcip-liveness",
    level: 3,
    minutes: 11,
    question: "Một đoạn mã có tranh chấp lock cao đang giới hạn thông lượng. Bạn có những hướng giảm tranh chấp nào, và chọn hướng nào trước?",
    tradeoffs: [
      {
        option: "Thu hẹp phạm vi lock — giữ lock ngắn hơn",
        when: "Hướng đầu tiên tôi thử vì rẻ nhất và ít rủi ro nhất: đẩy mọi việc không cần bảo vệ ra ngoài block `synchronized`, đặc biệt là I/O và tính toán dài. Không đổi kiến trúc, không đổi ngữ nghĩa.",
      },
      {
        option: "Giảm tần suất lấy lock — lock striping / tách lock",
        when: "Khi một lock đang bảo vệ những state **độc lập** với nhau. Tách thành nhiều lock, hoặc phân dải như `ConcurrentHashMap` làm. Đổi lại: bất biến trải trên nhiều dải trở nên khó hoặc không thể bảo vệ, và việc khoá tất cả dải trở nên đắt.",
      },
      {
        option: "Bỏ lock — biến atomic hoặc immutable",
        when: "Khi state đủ nhỏ để gói vào một biến atomic, hoặc đủ ít ghi để thay bằng immutable object sau `volatile`. Thông lượng tốt nhất, nhưng chỉ áp được cho hình dạng state hẹp.",
      },
    ],
    mustCover: [
      "Định luật **Amdahl** đặt trần cho mọi hướng: phần **phải thực thi tuần tự** quyết định mức tăng tốc tối đa, dù thêm bao nhiêu processor",
      "Nên **đo trước khi đoán**: phải biết lock nào bị tranh chấp và giữ bao lâu, chứ không chỉnh theo trực giác",
      "Thu hẹp phạm vi lock là hướng rẻ nhất và nên thử đầu tiên — đặc biệt là đẩy I/O ra ngoài block",
      "Lock striping chỉ hợp lệ khi các state được bảo vệ **độc lập**; nó làm bất biến trải nhiều dải trở nên khó bảo vệ",
      "Không bao giờ được đổi tính đúng đắn lấy thông lượng: một thiết kế nhanh mà vi phạm bất biến là thiết kế sai",
    ],
    model: "Trước khi chọn hướng, tôi đặt hai mỏ neo. Neo thứ nhất là định luật Amdahl: nếu một phần phép tính buộc phải thực thi tuần tự thì chính phần đó đặt trần cho mức tăng tốc, bất kể thêm bao nhiêu processor — nên câu hỏi đầu tiên không phải \"giảm tranh chấp thế nào\" mà \"phần tuần tự này có thật cần tuần tự không\". Neo thứ hai là phải đo: biết lock nào bị tranh chấp, tranh chấp bao nhiêu, và giữ bao lâu, trước khi sửa bất cứ gì. Sau đó tôi đi theo thứ tự chi phí tăng dần. Hướng đầu là thu hẹp phạm vi lock: đẩy ra khỏi block `synchronized` mọi thứ không cần bảo vệ, và ưu tiên tuyệt đối là I/O cùng các tính toán dài — giữ lock trong lúc gọi mạng là cách nhanh nhất biến một lock ít tranh chấp thành điểm tắc. Hướng này rẻ, không đổi kiến trúc, không đổi ngữ nghĩa, và thường đủ. Hướng thứ hai là giảm tần suất lấy lock bằng cách tách lock hoặc phân dải, đúng kỹ thuật `ConcurrentHashMap` dùng để cho nhiều thread đọc và một số thread ghi làm việc đồng thời. Điều kiện áp dụng phải nói rõ: chỉ hợp lệ khi các state đang bị một lock bảo vệ thật sự **độc lập** với nhau — nếu có bất biến trải trên chúng thì tách lock là phá bất biến, và cái giá kèm theo là những operation cần khoá toàn bộ, như đếm chính xác, trở nên đắt hoặc không còn chính xác được nữa. Hướng thứ ba là bỏ lock hẳn, gói state vào biến atomic hoặc thay bằng immutable object sau `volatile`; thông lượng tốt nhất nhưng chỉ dùng được cho hình dạng state hẹp. Nguyên tắc xuyên suốt cả ba: không đổi tính đúng đắn lấy thông lượng — một thiết kế nhanh mà vi phạm bất biến chỉ là một thiết kế sai chạy nhanh hơn.",
    redFlags: [
      "Nhảy thẳng vào lock striping mà chưa đo và chưa thử thu hẹp phạm vi lock",
      "Giữ lock trong lúc gọi I/O rồi đi tối ưu chỗ khác",
      "Tách lock cho những state có bất biến trải qua chúng",
      "Không nhắc Amdahl, nên không trả lời được câu \"tối ưu tới đâu thì hết ý nghĩa\"",
    ],
    probes: [
      "Amdahl nói gì nếu 10% công việc buộc phải tuần tự?",
      "Sau khi phân dải, bạn còn đếm chính xác được số phần tử không?",
      "Bạn đo tranh chấp lock bằng công cụ gì?",
    ],
    refs: ["jcip-11", "jcip-10"],
  },
  {
    id: "jcip-iq20",
    field: "jcip",
    topic: "jcip-liveness",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một dịch vụ định giá đứng hình hoàn toàn mỗi 3–10 ngày: không phục vụ request nào, CPU gần 0, không log mới. Thread dump cho thấy 6 thread cùng đứng ở `synchronized` trên hai object `PriceBook` và `RateTable`; hai trong số chúng giữ lock theo thứ tự ngược nhau. Khởi động lại là hết.",
      scale: "48 instance sau load balancer nên mỗi lần đứng chỉ mất 2% năng lực — đó là lý do nó sống 11 tháng. Nhưng tháng vừa rồi có 3 instance đứng trong cùng một giờ cao điểm và gây sự cố thật.",
      constraints: "Hai class `PriceBook` và `RateTable` nằm trong một thư viện nội bộ dùng bởi 7 dịch vụ khác — không đổi được API công khai của chúng. Phải giữ được tính nguyên tử khi đọc cặp giá và tỉ giá. Không được tuần tự hoá toàn bộ đường định giá; đây là đường nóng.",
      },
    question: "Chẩn đoán của bạn là gì, và bạn sửa thế nào khi không được đổi API của hai class kia và không được tuần tự hoá đường nóng?",
    mustCover: [
      "Đây là deadlock do **thứ tự khoá không nhất quán**: hai đường mã lấy cùng hai lock theo hai thứ tự trái nhau",
      "CPU gần 0 là dấu hiệu phân biệt quan trọng: deadlock **không** tiêu CPU, khác livelock và khác vòng lặp nóng",
      "JVM không khôi phục được nên khởi động lại là **cách duy nhất** — chứ không phải là cách sửa",
      "Tần suất 3–10 ngày và \"chỉ dưới tải\" là hành vi kinh điển: nguy cơ có sẵn từ lâu, chỉ cần một cửa sổ xen kẽ hẹp để hiện ra",
      "Sửa bằng **thứ tự khoá toàn cục** áp ở phía gọi, không cần đổi API của hai class — mọi đường mã đều khoá theo cùng một thứ tự quy ước",
      "Tính nguyên tử vẫn giữ vì vẫn khoá cả hai trước khi đọc; chỉ đổi thứ tự, nên đường nóng không bị tuần tự hoá",
      "Cần một cổng chặn tái diễn: thread dump tự động khi phát hiện đứng, và một quy ước thứ tự khoá được ghi thành tài liệu kèm kiểm tra",
    ],
    model: "Thread dump đã cho sẵn kết luận: 6 thread đứng ở `synchronized` trên hai object, và hai trong số đó giữ lock theo thứ tự ngược nhau — phụ thuộc locking có chu trình, tức deadlock. Chi tiết CPU gần 0 là thứ tôi sẽ nêu ngay vì nó phân biệt được deadlock với hai chẩn đoán dễ lẫn: livelock và vòng lặp nóng đều đốt CPU, deadlock thì không tiêu gì cả. Còn tần suất 3–10 ngày và chỉ xảy ra dưới tải là hành vi sách đã cảnh báo: một class có nguy cơ deadlock không có nghĩa nó sẽ deadlock, và khi nó xảy ra thì thường vào thời điểm tệ nhất; ở đây nguy cơ tồn tại suốt 11 tháng và chỉ cần một cửa sổ xen kẽ đủ hẹp. Việc khởi động lại làm hết cũng khớp: JVM không phát hiện và không khôi phục được, nên abort rồi khởi động lại là cách duy nhất đưa ứng dụng về khoẻ — nó là biện pháp tình thế, không phải cách sửa. Về cách sửa, hai ràng buộc của đề bài thực ra không cản lời giải đúng. Tôi không cần đổi API của `PriceBook` hay `RateTable`, vì thứ tự khoá là thuộc tính của **phía gọi**: tôi áp một thứ tự quy ước duy nhất — chẳng hạn luôn khoá `PriceBook` trước `RateTable` — cho mọi đường mã trong dịch vụ này, và sửa đường nào đang làm ngược. Tính nguyên tử khi đọc cặp giá và tỉ giá vẫn nguyên vì ta vẫn giữ cả hai lock trước khi đọc; thay đổi duy nhất là thứ tự lấy chúng, nên đường nóng cũng không bị tuần tự hoá — không thêm lock nào, không mở rộng phạm vi lock nào. Nhưng vì hai class ấy được 7 dịch vụ khác dùng, sửa riêng dịch vụ này chỉ chữa cho mình; nên tôi sẽ ghi quy ước thứ tự khoá thành tài liệu của thư viện và bổ sung một kiểm tra để đường mã nào lấy lock nghịch thứ tự sẽ bị bắt lúc build chứ không lúc 3 giờ sáng. Cuối cùng là làm sự cố tự phơi ra thay vì chờ khách báo: một cảnh báo khi instance không xử lý request nào trong vài phút, kèm tự động chụp thread dump — chính thứ đã cho ta câu trả lời lần này, chỉ là lần này ai đó phải chụp bằng tay.",
    redFlags: [
      "Kết luận treo vì tải cao hoặc vì GC — CPU gần 0 loại cả hai giả thuyết đó",
      "Thêm một lock chung cho cả hai object: khử deadlock nhưng tuần tự hoá đường nóng, đúng thứ ràng buộc đã cấm",
      "Đặt lịch khởi động lại định kỳ và gọi đó là cách sửa",
      "Bỏ lock lồng để hết deadlock, đánh mất tính nguyên tử khi đọc cặp giá và tỉ giá",
      "Sửa xong cho dịch vụ mình rồi bỏ mặc 7 dịch vụ khác dùng cùng thư viện",
    ],
    probes: [
      "Điều gì trong thread dump cho bạn phân biệt deadlock với livelock?",
      "Bạn áp quy ước thứ tự khoá lên 7 dịch vụ khác bằng cách nào?",
      "Nếu không thể áp thứ tự vì lock đến từ mã bên ngoài thì phương án còn lại là gì?",
    ],
    refs: ["jcip-10", "jcip-11"],
  },

  // ===== jcip-lowlevel — Explicit lock, AQS, atomic và JMM (jcip-iq21–jcip-iq24) =====
  {
    id: "jcip-iq21",
    field: "jcip",
    topic: "jcip-lowlevel",
    level: 1,
    minutes: 6,
    question: "Phát biểu quan hệ happens-before và kể các quy tắc của nó. Data race được định nghĩa thế nào theo quan hệ đó?",
    mustCover: [
      "Happens-before là một **quan hệ thứ tự bộ phận** trên mọi action của chương trình; action gồm đọc/ghi biến, lock/unlock monitor, khởi động và join thread",
      "Để thread thực thi B thấy được kết quả của A thì **phải có** quan hệ happens-before giữa A và B; không có thì JVM **được tự do reorder tuỳ ý**",
      "Quy tắc thứ tự chương trình: mỗi action happens-before mọi action sau nó **trong cùng thread**",
      "Quy tắc monitor lock: một lần unlock happens-before mọi lần lock **tiếp theo** trên **chính** monitor đó",
      "Quy tắc volatile: một lần ghi field `volatile` happens-before mọi lần đọc **tiếp theo** của chính field đó; đọc/ghi atomic variable có **cùng** memory semantics",
      "**Data race** là khi một biến được nhiều thread đọc và ít nhất một thread ghi, mà các thao tác đó **không được sắp thứ tự bởi happens-before**",
      "Chương trình synchronize đúng cách là chương trình **không có data race**, và nó thể hiện **sequential consistency**",
    ],
    model: "Happens-before là một quan hệ thứ tự bộ phận mà JMM định nghĩa trên toàn bộ action của chương trình, trong đó action gồm đọc và ghi biến, lock và unlock monitor, khởi động và join thread. Phát biểu cốt lõi rất gọn: để thread thực thi action B có thể thấy kết quả của action A — bất kể chúng ở cùng thread hay khác thread — phải tồn tại quan hệ happens-before giữa A và B; và khi không có thứ tự happens-before giữa hai operation, JVM được tự do reorder chúng tuỳ ý. Chữ \"bộ phận\" quan trọng: không phải cặp action nào cũng so sánh được với nhau, giống như ta có thể thích sushi hơn bánh phô mai và thích Mozart hơn Mahler mà không có sở thích rõ ràng giữa bánh phô mai và Mozart. Các quy tắc gồm: thứ tự chương trình — mỗi action happens-before mọi action xuất hiện sau nó trong cùng thread; monitor lock — một lần unlock happens-before mọi lần lock tiếp theo trên chính monitor đó; volatile — một lần ghi field `volatile` happens-before mọi lần đọc tiếp theo của chính field đó; khởi động thread — `Thread.start` happens-before mọi action trong thread được khởi động; cộng các quy tắc về kết thúc thread, interrupt, finalizer, và tính bắc cầu. Hai chú thích đáng nhớ vì chúng trả lời trước nhiều câu hỏi thực hành: lock và unlock trên object `Lock` tường minh có **cùng** memory semantics như intrinsic lock, và đọc ghi atomic variable có **cùng** memory semantics như biến volatile. Từ đó data race được định nghĩa chính xác: một biến được nhiều hơn một thread đọc và ít nhất một thread ghi, mà các thao tác đọc ghi ấy không được sắp thứ tự bởi happens-before. Chương trình synchronize đúng cách là chương trình không có data race, và những chương trình như vậy thể hiện sequential consistency — mọi action tỏ ra xảy ra theo một thứ tự toàn cục cố định.",
    redFlags: [
      "Mô tả happens-before như thứ tự thời gian thực — nó là quan hệ thứ tự bộ phận về khả năng nhìn thấy, không phải về thời điểm",
      "Định nghĩa data race là \"hai thread ghi cùng lúc\" — định nghĩa thật cần ít nhất một ghi và **thiếu** thứ tự happens-before",
      "Nói `volatile` chỉ chống caching mà không nêu nó thiết lập quan hệ happens-before",
      "Không biết `Lock` tường minh và atomic variable có cùng memory semantics như intrinsic lock và volatile",
    ],
    probes: [
      "Vì sao \"thứ tự bộ phận\" chứ không phải thứ tự toàn phần?",
      "Hai thread cùng chỉ đọc một biến — có data race không?",
      "Sequential consistency mang lại gì cho người đọc mã?",
    ],
    refs: ["jcip-16"],
  },
  {
    id: "jcip-iq22",
    field: "jcip",
    topic: "jcip-lowlevel",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `public class Counter {
    private volatile int count;

    public void increment() {
        count++;                 // (1)
    }

    public int get() {
        return count;
    }
}

// Và một phiên bản khác:
public class Flag {
    private volatile boolean shutdown;

    public void requestShutdown() { shutdown = true; }      // (2)
    public boolean isShutdown()   { return shutdown; }
}`,
    },
    question: "Một trong hai class này đúng, class kia thì không. Chỉ ra class nào sai, vì sao `volatile` không cứu được nó, và sửa lại.",
    mustCover: [
      "`Counter` sai: `count++` là **đọc–sửa–ghi**, ba action riêng, nên hai thread có thể đọc cùng giá trị rồi ghi cùng kết quả",
      "`volatile` cho bảo đảm **visibility** nhưng **không thể xây compound action atomic** — đó là hạn chế sách nêu thẳng",
      "Cụ thể hơn: `volatile` không dùng được khi **giá trị mới của một biến phụ thuộc giá trị cũ của nó**, đúng trường hợp bộ đếm",
      "Sách nói rõ vì lý do đó `volatile` không hiện thực đáng tin cậy được những công cụ phổ biến như **bộ đếm** hay **mutex**",
      "`Flag` đúng vì nó chỉ ghi một giá trị **không phụ thuộc giá trị cũ**, và `volatile` đủ cho tín hiệu một chiều kiểu này",
      "Sửa `Counter` bằng `AtomicInteger` — đọc ghi atomic variable có **cùng** memory semantics như volatile, cộng thêm operation đọc–sửa–ghi atomic",
    ],
    model: "`Flag` đúng và `Counter` sai, và khác biệt nằm ở chỗ giá trị mới có phụ thuộc giá trị cũ hay không. `requestShutdown` chỉ ghi hằng `true`; giá trị mới không phụ thuộc gì vào giá trị đang có, nên một lần ghi `volatile` là một action duy nhất, và theo quy tắc volatile của JMM nó happens-before mọi lần đọc tiếp theo — mọi thread sẽ thấy cờ đã bật. Đây đúng là loại việc `volatile` làm tốt: tín hiệu một chiều. `Counter` thì khác. `count++` trông như một lệnh nhưng thực chất là ba action — đọc `count`, cộng một, ghi lại — nên hai thread hoàn toàn có thể đọc cùng giá trị 7, cả hai tính 8, và cả hai ghi 8; một lần tăng biến mất. `volatile` không giúp gì ở đây vì nó giải bài toán khác: sách nói rõ dù `volatile` cung cấp bảo đảm visibility tương tự locking, nó **không thể được dùng để xây dựng các compound action atomic** — nghĩa là không dùng được khi một biến phụ thuộc biến khác, hoặc khi giá trị mới của một biến phụ thuộc giá trị cũ của nó. Và sách rút ra đúng kết luận cho trường hợp này: vì giới hạn đó, `volatile` không hiện thực đáng tin cậy được những công cụ phổ biến như bộ đếm hay mutex. Cách sửa là `AtomicInteger` với `incrementAndGet`: nó cho operation đọc–sửa–ghi atomic dựa trên hỗ trợ phần cứng, và về memory semantics thì đọc ghi atomic variable tương đương biến volatile, nên ta không mất gì về visibility. Nếu vì lý do nào đó phải giữ một `int` thường thì phương án còn lại là khoá cả cụm đọc–sửa–ghi, nhưng với một bộ đếm thì đó là đổi một biến atomic lấy chi phí lập lịch thread mà chẳng được gì.",
    redFlags: [
      "Nói `volatile` làm `count++` atomic — lẫn visibility với atomicity",
      "Thêm `synchronized` vào `increment` nhưng để `get` đọc `volatile` và cho rằng đã đủ với mọi bất biến",
      "Cho rằng `Flag` cũng sai và cần `AtomicBoolean` — giá trị mới không phụ thuộc giá trị cũ nên `volatile` là đủ",
      "Bỏ `volatile` khỏi `Flag` vì \"đã có atomic ở chỗ khác\" — mất luôn bảo đảm visibility cho cờ",
    ],
    probes: [
      "Còn operation nào trông như một lệnh mà thực ra là đọc–sửa–ghi?",
      "Nếu cần hai bộ đếm phải luôn bằng nhau, hai `AtomicInteger` có đủ không?",
      "Hỗ trợ phần cứng nào làm nên các operation atomic này?",
    ],
    refs: ["jcip-15", "jcip-03"],
  },
  {
    id: "jcip-iq23",
    field: "jcip",
    topic: "jcip-lowlevel",
    level: 3,
    minutes: 10,
    question: "Bạn viết một class thread-safe mới. Chọn `synchronized`, `ReentrantLock`, hay biến atomic?",
    tradeoffs: [
      {
        option: "`synchronized` — intrinsic lock",
        when: "Mặc định. Sách nói thẳng: hãy ưu tiên `synchronized`, và để dành `ReentrantLock` cho những tình huống cần thứ nó cung cấp mà intrinsic locking không có. Ký pháp quen và gọn, và bản chất theo cấu trúc khối nghĩa là **không thể quên nhả lock**.",
      },
      {
        option: "`ReentrantLock`",
        when: "Chỉ khi cần một trong các tính năng nâng cao: acquire lock **có timeout**, **có poll**, hay **có thể interrupt**; **fair queueing**; hoặc locking **không theo cấu trúc khối**. Sách gọi nó là công cụ **nguy hiểm hơn**: quên bọc `unlock` trong `finally` thì mã vẫn trông như chạy đúng nhưng đã thành một quả bom hẹn giờ.",
      },
      {
        option: "Biến atomic",
        when: "Khi state đủ nhỏ để gói vào một biến và operation là đọc–sửa–ghi trên đúng biến đó. Tránh được chi phí treo và đánh thức thread — thứ mà sách nói kéo theo rất nhiều overhead, đặc biệt tệ với các class có operation **mịn** nơi tỉ lệ giữa chi phí lập lịch và công việc hữu ích rất cao.",
      },
    ],
    mustCover: [
      "`ReentrantLock` cho **cùng** semantics về locking và bộ nhớ như intrinsic lock, cộng các tính năng nâng cao",
      "Hiệu năng không còn là lý do chọn: JVM hiện đại tối ưu tốt lock **không bị tranh chấp**",
      "Rủi ro thật của `ReentrantLock` là quên `unlock` trong `finally` — mã vẫn trông đúng nhưng hỏng về sau",
      "Trộn lẫn hai kiểu locking trong một codebase gây nhầm lẫn và dễ sinh lỗi",
      "Khi lock bị tranh chấp, JVM nhờ tới hệ điều hành và một thread bị **treo rồi đánh thức** — overhead lớn và gián đoạn kéo dài",
      "`ReentrantLock` **không theo cấu trúc khối** nên lần acquire không gắn được với stack frame cụ thể, làm thread dump khó đọc hơn",
    ],
    model: "Sách trả lời câu này bằng một khuyến nghị dứt khoát mà tôi thấy vẫn đúng: ưu tiên `synchronized`, để dành `ReentrantLock` cho những tình huống cần đúng thứ nó cung cấp. Lý do không phải hiệu năng — `ReentrantLock` thực ra nhanh hơn ở các bản Java cũ, và JVM hiện đại tối ưu rất tốt việc acquire lock không bị tranh chấp, nên hiệu năng đã thôi là tiêu chí. Lý do là an toàn và khả năng đọc. Intrinsic lock theo cấu trúc khối nên không thể quên nhả; `ReentrantLock` thì nếu quên bọc `unlock` trong `finally`, mã vẫn trông như chạy đúng nhưng ta đã tạo một quả bom hẹn giờ làm hại những người vô can — đúng cách sách diễn đạt. Thêm nữa, trộn lẫn hai kiểu locking trong cùng codebase gây nhầm lẫn và dễ sinh lỗi, và bản chất không theo cấu trúc khối của `ReentrantLock` làm lần acquire không gắn được với stack frame cụ thể nên thread dump khó đọc hơn khi đi debug. Vậy tôi chuyển sang `ReentrantLock` khi nào? Đúng khi cần một trong bốn thứ: acquire có timeout, acquire có poll, acquire có thể interrupt, hoặc fair queueing — và khoá có timeout chính là công cụ để biến một nguy cơ deadlock không tránh được thành một thất bại tạm thời quan sát được. Còn biến atomic thì giải một bài khác hẳn và nên xét trước cả hai: khi state đủ nhỏ để gói vào một biến, nó tránh được toàn bộ chi phí treo và đánh thức thread. Chi phí đó không nhỏ: khi nhiều thread cùng xin một lock, JVM nhờ tới hệ điều hành, một thread bị treo và phải được đánh thức, rồi có thể còn phải chờ các thread khác dùng hết lượng thời gian lập lịch. Với những class có operation mịn — như các synchronized collection, nơi hầu hết method chỉ chứa vài operation — tỉ lệ giữa chi phí lập lịch và công việc hữu ích có thể rất cao. Nên thứ tự tôi xét là: atomic nếu state vừa, `synchronized` cho phần còn lại, `ReentrantLock` chỉ khi cần tính năng nâng cao.",
    redFlags: [
      "Chọn `ReentrantLock` vì \"nhanh hơn\" — khoảng cách hiệu năng đó thuộc về các bản Java cũ",
      "Dùng `ReentrantLock` mà không bọc `unlock` trong `finally`",
      "Trộn `synchronized` và `ReentrantLock` trong cùng một class",
      "Bỏ qua biến atomic cho một state chỉ gồm một biến, rồi đi tối ưu lock",
    ],
    probes: [
      "Bốn tính năng nào của `ReentrantLock` biện minh cho việc dùng nó?",
      "Vì sao thread dump khó đọc hơn khi dùng `ReentrantLock`?",
      "Fair queueing đánh đổi gì để lấy tính công bằng?",
    ],
    refs: ["jcip-13", "jcip-15"],
  },
  {
    id: "jcip-iq24",
    field: "jcip",
    topic: "jcip-lowlevel",
    level: 4,
    minutes: 16,
    incident: {
      symptom: "Một cache trong bộ nhớ đôi khi trả về object cấu hình mà một field bên trong là `null`, dù constructor gán nó không điều kiện. Xảy ra khoảng 1 lần mỗi 2 triệu lượt đọc, chỉ trên máy production 32 core, chưa bao giờ tái hiện được trên máy phát triển 8 core. Cache dùng double-checked locking với field `instance` không `volatile`.",
      scale: "Khoảng 90.000 lượt đọc cache mỗi giây. Mỗi lần xảy ra là một request trả 500. Đã tồn tại từ lúc dịch vụ ra đời, 3 năm.",
      constraints: "Không được thêm khoá vào đường đọc — đo được là nó sẽ làm p99 tăng gấp bốn ở 90.000 lượt/giây. Object cấu hình có 14 field và được nạp từ một nguồn ngoài, không thể dựng sẵn lúc khởi động. Phải giải thích được vì sao máy 8 core không tái hiện, để đội tin rằng bản vá thật sự cần.",
      },
    question: "Vì sao một field được constructor gán không điều kiện lại đọc ra `null`? Giải thích bằng JMM, sửa, và nói vì sao máy 8 core không tái hiện được.",
    mustCover: [
      "Không có quan hệ **happens-before** giữa lần ghi `instance` của thread khởi tạo và lần đọc của thread khác, nên đây là **data race**",
      "Khi thiếu thứ tự happens-before, JVM **được tự do reorder** — tham chiếu có thể nhìn thấy được **trước khi** state bên trong nhìn thấy được",
      "Đó chính là hình dạng \"thấy tham chiếu mới nhất nhưng state stale\" mà sách nêu ở phần publish không đúng cách",
      "Giá trị `null` là quan sát được vì constructor của `Object` **ghi giá trị mặc định** vào mọi field trước khi constructor lớp con chạy",
      "Sửa **không cần khoá đường đọc**: khai `instance` là `volatile` — quy tắc volatile cho happens-before giữa ghi và mọi lần đọc sau đó",
      "Sửa tốt hơn nữa: làm object cấu hình **immutable** với mọi field `final`, khi đó JMM cho bảo đảm **initialization safety**",
      "Máy 8 core không tái hiện vì cửa sổ reorder phụ thuộc kiến trúc bộ nhớ và mức song song thật — ít core thì ít cơ hội, **không phải** vì mã đúng ở đó",
    ],
    model: "Nghịch lý tan ngay khi đặt câu hỏi đúng: không phải \"constructor có gán field không\" mà \"có gì bảo đảm thread đọc thấy được lần gán đó\". Ở đây không có gì cả. Field `instance` không `volatile`, và không lock nào nằm trên đường đọc nhanh, nên giữa lần ghi của thread khởi tạo và lần đọc của thread khác không tồn tại quan hệ happens-before — theo đúng định nghĩa của sách, đó là một data race, vì biến được nhiều thread đọc và ít nhất một thread ghi mà các thao tác ấy không được sắp thứ tự. Và khi không có thứ tự happens-before, JVM được tự do reorder tuỳ ý. Hệ quả cụ thể là tham chiếu `instance` có thể trở nên nhìn thấy được **trước** khi các lần ghi field bên trong constructor trở nên nhìn thấy được — đúng hình dạng tệ nhất mà sách nêu khi bàn về publish không đúng cách: thread khác thấy tham chiếu mới nhất nhưng thấy giá trị stale cho state. Còn vì sao giá trị stale lại là `null`? Vì constructor của `Object` ghi giá trị mặc định vào mọi field trước khi constructor lớp con chạy, nên `null` hoàn toàn là một giá trị quan sát được, không cần field từng mang giá trị nào khác. Cách sửa thoả ràng buộc không khoá đường đọc: khai `instance` là `volatile`. Quy tắc volatile của JMM nói một lần ghi field `volatile` happens-before mọi lần đọc tiếp theo của chính field đó, nên chuỗi \"ghi 14 field rồi ghi `instance`\" trở nên nhìn thấy được như một khối, và đường đọc vẫn là một lần đọc field, không lock. Nhưng tôi sẽ đề xuất thêm một bước nữa vì nó khử cả lớp lỗi chứ không chỉ ca này: làm object cấu hình immutable với cả 14 field `final`. Khi đó JMM cho bảo đảm initialization safety, và object dùng an toàn được kể cả khi publish không đúng cách — tức mã còn đúng ngay cả khi ai đó về sau vô tình bỏ `volatile`. Riêng câu hỏi vì sao máy 8 core không tái hiện, và đây là phần đề bài đòi để thuyết phục đội: reorder và độ trễ nhìn thấy phụ thuộc kiến trúc bộ nhớ, số core và mức song song thực tế; ít core nghĩa là ít cơ hội để hai thread quan sát chéo nhau trong cửa sổ hẹp đó. Việc không tái hiện được là bằng chứng về xác suất, **không** phải bằng chứng về tính đúng đắn — mã có data race thì sai trên mọi máy, chỉ khác tần suất phơi ra. Con số 1 trên 2 triệu ở 90.000 lượt mỗi giây nghĩa là khoảng mỗi 22 giây một lần có một request lẽ ra đã có thể hỏng, và nó đã hỏng 3 năm.",
    redFlags: [
      "Kết luận \"không tái hiện được trên máy dev nên chỉ là lỗi hạ tầng production\"",
      "Thêm `synchronized` vào đường đọc — sửa đúng nhưng vi phạm ràng buộc p99 mà đề bài đã đo",
      "Bọc `try/catch` hoặc kiểm `null` rồi nạp lại: che triệu chứng, để nguyên data race",
      "Nói `null` không thể là giá trị stale vì field chưa từng mang giá trị khác",
      "Đặt `volatile` lên các field bên trong thay vì lên chính `instance` — không thiết lập được happens-before cho lần publish",
    ],
    probes: [
      "Vì sao đặt `volatile` lên `instance` là đủ, mà không cần `volatile` cho 14 field kia?",
      "Nếu một trong 14 field `final` trỏ tới một `Map` khả biến thì bảo đảm initialization safety còn giữ không?",
      "Bạn viết bài kiểm nào để bắt được data race mà không dựa vào may mắn?",
    ],
    refs: ["jcip-16", "jcip-03"],
  },
];
