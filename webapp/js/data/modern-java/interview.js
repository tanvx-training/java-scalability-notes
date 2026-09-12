// Ngân hàng câu hỏi phỏng vấn Modern Java in Action — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Modern Java in Action (Raoul-Gabriel Urma,
// Mario Fusco, Alan Mycroft — Manning). Mỗi câu trỏ chương nguồn qua `refs`.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js. Tóm lại:
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (mj-iq01–mj-iq24) — thống kê tự chấm lưu theo id.

export const modernJavaInterview = [
  // ===== mj-lambda — Lambda và behavior parameterization (mj-iq01–mj-iq04) =====
  {
    id: "mjia-iq01",
    field: "modern-java",
    topic: "mj-lambda",
    level: 1,
    minutes: 5,
    question: "Behavior parameterization là gì, và nó giải bài toán nào mà việc thêm tham số thường không giải được?",
    mustCover: [
      "Behavior parameterization là **truyền hành vi** vào một method dưới dạng đối số, thay vì truyền dữ liệu rồi để method tự quyết định",
      "Bài toán nó giải: mỗi yêu cầu mới lại sinh ra một method gần giống method cũ, khác đúng **một điều kiện**",
      "Thêm tham số kiểu `boolean` hay `int` cờ chỉ nhân số nhánh lên và làm chỗ gọi **không đọc được**",
      "Truyền hành vi cho phép method giữ nguyên phần **duyệt và gom kết quả**, chỉ phần quyết định là thay đổi",
      "Lambda là cú pháp làm việc này **gọn** — trước đó vẫn làm được bằng anonymous class, chỉ là quá ồn",
    ],
    model: "Behavior parameterization là truyền chính hành vi vào method dưới dạng đối số. Bài toán nó giải xuất hiện rất sớm trong mọi codebase: ta viết một method lọc táo xanh, rồi được yêu cầu lọc táo nặng hơn 150g, rồi lọc theo cả màu lẫn khối lượng. Cách đối phó tự nhiên là nhân bản method, và sau ba lần thì có ba method gần như giống nhau, khác đúng một dòng điều kiện — mọi sửa lỗi phải làm ba lần. Cách đối phó thứ hai là thêm tham số cờ, nhưng nó tệ hơn: một chữ ký nhận `boolean flag` khiến chỗ gọi trở nên không đọc được — `filter(list, true, false)` chẳng nói lên điều gì — và mỗi yêu cầu mới lại thêm một cờ, nhân số nhánh bên trong lên. Behavior parameterization tách bài toán theo đúng đường nối: phần duyệt danh sách và gom kết quả là **bất biến**, chỉ phần quyết định \"phần tử này có được nhận không\" là thay đổi. Nên ta biến phần quyết định thành một đối số, và method chỉ còn một bản duy nhất. Điểm đáng nói về lambda là nó **không** phải cơ chế mới: cùng việc đó làm được bằng anonymous class từ trước, nhưng phần cú pháp ồn ào đến mức nó che mất phần logic — sáu dòng khung để nói một điều kiện một dòng. Lambda bỏ phần khung đó đi, nên ý định hiện ra. Nói cách khác lambda là bước tiến về khả năng đọc, còn behavior parameterization là bước tiến về thiết kế, và bước thứ hai quan trọng hơn.",
    redFlags: [
      "Trả lời thành \"lambda là hàm vô danh\" mà không nói nó giải bài toán thiết kế nào",
      "Cho rằng lambda mang lại năng lực mới, không nhận ra anonymous class đã làm được",
      "Coi việc thêm tham số cờ là giải pháp tương đương",
    ],
    probes: [
      "Vì sao một chữ ký nhận `boolean` cờ lại làm hỏng khả năng đọc ở chỗ gọi?",
      "Phần nào của method là bất biến và phần nào thay đổi trong ví dụ lọc danh sách?",
      "Khi nào bạn vẫn chọn anonymous class thay vì lambda?",
    ],
    refs: ["mjia-02", "mjia-03"],
  },
  {
    id: "mjia-iq02",
    field: "modern-java",
    topic: "mj-lambda",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `public class OrderFilter {

    // Ba method gần như giống nhau, khác đúng một điều kiện
    public List<Order> filterPending(List<Order> orders) {
        List<Order> out = new ArrayList<>();
        for (Order o : orders)
            if (o.getStatus() == PENDING) out.add(o);
        return out;
    }

    public List<Order> filterAbove(List<Order> orders, BigDecimal min) {
        List<Order> out = new ArrayList<>();
        for (Order o : orders)
            if (o.getTotal().compareTo(min) > 0) out.add(o);
        return out;
    }

    public List<Order> filterByCustomer(List<Order> orders, Long customerId) {
        List<Order> out = new ArrayList<>();
        for (Order o : orders)
            if (o.getCustomerId().equals(customerId)) out.add(o);
        return out;
    }
}`,
    },
    question: "Viết lại ba method này thành một. Sau đó nói rõ chữ ký mới **mất** đi điều gì so với ba method cũ, và bạn bù lại thế nào.",
    mustCover: [
      "Ba method chia sẻ cùng phần duyệt và gom kết quả; chỉ **điều kiện** là khác",
      "Gộp lại thành một method nhận một `Predicate<Order>` làm đối số",
      "Điều **mất đi**: tên method cũ tự tài liệu hoá ý định, còn `filter(orders, o -> ...)` thì không",
      "Bù lại bằng cách đặt các predicate thành **hằng có tên** hoặc factory method, để chỗ gọi vẫn đọc được",
      "Hệ quả thiết kế: phần thay đổi giờ nằm ở **một chỗ tập trung** và kiểm thử được độc lập",
    ],
    model: "Ba method chia sẻ đúng cùng một khung — tạo danh sách kết quả, duyệt, thêm nếu thoả, trả về — và khác nhau duy nhất ở biểu thức điều kiện. Nên bản viết lại là một method nhận `Predicate<Order>`: `public List<Order> filter(List<Order> orders, Predicate<Order> p)`, bên trong đổi `if` thành `if (p.test(o))`. Ba chỗ gọi cũ trở thành ba lambda tại chỗ dùng. Nhưng phần thứ hai của câu hỏi mới là phần đáng nói, vì nó là cái giá mà người ta hay bỏ qua khi khoe refactoring này: ba method cũ có **tên**, và tên đó tự tài liệu hoá ý định — đọc `filterPending(orders)` là hiểu ngay. Sau khi gộp, chỗ gọi trở thành `filter(orders, o -> o.getStatus() == PENDING)`, và ý định nghiệp vụ \"đơn đang chờ\" bị hạ cấp thành một biểu thức kỹ thuật lặp lại ở mọi chỗ gọi. Nếu định nghĩa \"đang chờ\" đổi thì ta lại phải sửa nhiều chỗ — đúng bài toán ta vừa bỏ công loại bỏ, chỉ dịch sang chỗ khác. Cách bù là đặt tên cho hành vi: khai các predicate thành hằng có tên hoặc factory method trên chính `Order`, ví dụ `Order.isPending()` và `Order.totalAbove(min)`, rồi chỗ gọi viết `filter(orders, Order::isPending)`. Khi đó ta được cả hai: một bản cài đặt duy nhất cho phần duyệt, và một cái tên duy nhất cho mỗi quy tắc nghiệp vụ — và quy tắc đó giờ kiểm thử được độc lập, không cần đi qua vòng lặp. Đó mới là điểm đến của behavior parameterization.",
    redFlags: [
      "Gộp thành một method rồi dừng, không nhận ra mất khả năng tự tài liệu hoá của tên method",
      "Rải lambda trùng lặp ở mọi chỗ gọi, tức dịch chỗ trùng lặp chứ không loại bỏ nó",
      "Dùng `Function<Order, Boolean>` thay vì `Predicate<Order>` — thêm một lần boxing không cần thiết",
      "Đổi chữ ký thành nhận `String` mô tả điều kiện rồi so chuỗi bên trong",
    ],
    probes: [
      "Vì sao `Predicate<Order>` tốt hơn `Function<Order, Boolean>`?",
      "Nếu cần tổ hợp hai điều kiện thì bạn làm thế nào mà không sửa method `filter`?",
      "Đặt quy tắc nghiệp vụ ở đâu — trên `Order`, hay trong một class riêng?",
    ],
    refs: ["mjia-02", "mjia-03"],
  },
  {
    id: "mjia-iq03",
    field: "modern-java",
    topic: "mj-lambda",
    level: 3,
    minutes: 9,
    question: "Bạn cần truyền một hành vi vào một API. Chọn lambda, method reference, hay một class có tên?",
    tradeoffs: [
      {
        option: "Method reference",
        when: "Khi hành vi **đã có tên** ở đâu đó — một method có sẵn hoặc một method mới đáng có tên. Ngắn nhất, và cái tên nói lên ý định, nên nó là lựa chọn đầu tiên tôi thử.",
      },
      {
        option: "Lambda tại chỗ",
        when: "Khi hành vi ngắn, dùng đúng một lần, và ý định hiện rõ từ chính biểu thức. Đặt tên cho nó sẽ là một lớp gián tiếp không trả lại gì.",
      },
      {
        option: "Class có tên",
        when: "Khi hành vi **có state**, cần kiểm thử độc lập, dài hơn vài dòng, hoặc xuất hiện ở nhiều chỗ. Cũng là lựa chọn khi cần đặt tài liệu và bất biến lên chính hành vi đó.",
      },
    ],
    mustCover: [
      "Trục quyết định là **hành vi này có đáng một cái tên hay không**, không phải cú pháp nào ngắn hơn",
      "Lambda dài quá vài dòng là tín hiệu nó đang làm quá nhiều việc cho một biểu thức tại chỗ",
      "Method reference thắng khi tên đã tồn tại, vì nó vừa ngắn vừa nói được ý định",
      "Hành vi có **state** thì thuộc về class có tên — lambda bắt biến ngoài dễ tạo phụ thuộc ẩn",
      "Lambda bắt biến phải là **effectively final**, nên nó không mô hình hoá được state biến đổi",
      "Kiểm thử là một tiêu chí thật: hành vi trong một lambda tại chỗ không gọi trực tiếp được từ test",
    ],
    model: "Tôi không chọn theo độ ngắn của cú pháp mà theo một câu hỏi duy nhất: hành vi này có đáng một cái tên hay không. Nếu nó đã có tên ở đâu đó thì method reference thắng — nó ngắn nhất và đồng thời nói được ý định, nên `filter(orders, Order::isPending)` đọc tốt hơn cả lambda tương đương. Nếu chưa có tên nhưng hành vi đủ ngắn để ý định hiện ngay từ biểu thức, và nó chỉ dùng một lần, thì lambda tại chỗ là đúng: đặt tên khi đó chỉ thêm một lớp gián tiếp mà không trả lại gì. Ngưỡng tôi dùng trong thực tế là vài dòng — một lambda dài hơn thế gần như luôn là tín hiệu nó đang làm quá nhiều việc, và nên tách ra thành một method có tên rồi tham chiếu tới. Class có tên thắng trong ba tình huống cụ thể. Thứ nhất là khi hành vi có state: lambda chỉ bắt được biến effectively final nên nó không mô hình hoá được state biến đổi, và nếu ta cố lách bằng cách bắt một object khả biến thì ta vừa tạo một phụ thuộc ẩn mà chữ ký không hề nói ra. Thứ hai là khi cần kiểm thử độc lập — một hành vi nằm trong lambda tại chỗ thì test không gọi trực tiếp được, chỉ kiểm được gián tiếp qua API bao ngoài, và đó là một mất mát thật khi hành vi có nhiều nhánh. Thứ ba là khi hành vi lặp lại ở nhiều chỗ hoặc cần mang theo tài liệu và bất biến của riêng nó. Một điểm cuối về khả năng đọc: lambda lồng trong lambda hầu như luôn nên tách, vì hai tầng ngữ cảnh bắt biến chồng nhau là chỗ người đọc mất dấu nhanh nhất.",
    redFlags: [
      "Chọn theo tiêu chí \"cái nào ngắn hơn\"",
      "Viết lambda dài hàng chục dòng tại chỗ",
      "Dùng lambda cho hành vi có state bằng cách bắt một object khả biến",
      "Không xét khả năng kiểm thử độc lập của hành vi",
    ],
    probes: [
      "Lambda bắt biến phải effectively final — điều đó chặn bạn làm gì?",
      "Bạn kiểm thử một hành vi phức tạp nằm trong lambda tại chỗ bằng cách nào?",
      "Lambda lồng lambda thì bạn xử lý thế nào?",
    ],
    refs: ["mjia-03", "mjia-09"],
  },
  {
    id: "mjia-iq04",
    field: "modern-java",
    topic: "mj-lambda",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một dịch vụ xử lý sự kiện bị rò rỉ bộ nhớ chậm: heap sau mỗi lần GC tăng đều, khoảng 40MB mỗi giờ, tới khi pod bị khởi động lại. Heap dump cho thấy hàng trăm nghìn instance của một lambda được sinh trong một method đăng ký listener, mỗi instance giữ tham chiếu tới một object ngữ cảnh của request đã kết thúc từ lâu.",
      scale: "1.200 sự kiện mỗi giây. Pod bị khởi động lại khoảng 20 giờ một lần. 14 instance, nên có vài lần khởi động lại mỗi giờ trên toàn cụm.",
      constraints: "Không đổi được API đăng ký listener — nó thuộc một thư viện nội bộ dùng bởi 6 dịch vụ. Phải giữ được ngữ cảnh request trong lúc listener còn sống. Phải xác định được rò rỉ đã dừng, không chỉ giảm.",
      },
    question: "Lambda tự nó không rò rỉ bộ nhớ. Vậy cơ chế rò rỉ ở đây là gì, và bạn sửa thế nào?",
    mustCover: [
      "Lambda **bắt** biến từ ngữ cảnh bao quanh, nên nó giữ tham chiếu mạnh tới những object đó",
      "Nếu lambda được **đăng ký** vào một nơi sống lâu, nó neo cả cây object nó bắt vào đó",
      "Rò rỉ ở đây là **listener không được gỡ đăng ký** — lambda sống bằng tuổi của registry, không bằng tuổi của request",
      "Lambda bắt `this` một cách ẩn khi nó dùng field hoặc method của instance — nên nó có thể neo cả object bao ngoài",
      "Sửa gốc: mỗi đăng ký phải có một đường **gỡ đăng ký** được gọi chắc chắn khi request kết thúc",
      "Nếu không gỡ được, phải thay tham chiếu mạnh bằng cách chỉ bắt **dữ liệu tối thiểu** thay vì cả object ngữ cảnh",
      "Xác nhận rò rỉ đã dừng bằng mức chiếm dụng heap **sau GC** phẳng lại, không bằng việc pod sống lâu hơn",
    ],
    model: "Lambda không rò rỉ, nhưng nó là một object và nó giữ tham chiếu mạnh tới mọi biến nó bắt từ ngữ cảnh bao quanh. Đó là toàn bộ cơ chế. Ở đây một lambda được sinh trong method đăng ký listener và bắt object ngữ cảnh của request; rồi nó được đăng ký vào một registry sống bằng tuổi của ứng dụng. Từ giây phút đó, tuổi thọ của lambda không còn gắn với request mà gắn với registry — và vì nó giữ tham chiếu mạnh, cả object ngữ cảnh cùng mọi thứ object đó trỏ tới đều không thể bị thu gom. Nhân 1.200 sự kiện mỗi giây với một object ngữ cảnh nhỏ thôi cũng ra 40MB mỗi giờ. Có một chi tiết đáng nêu vì nó làm rò rỉ lớn hơn ta tưởng: lambda bắt `this` một cách **ẩn** ngay khi nó dùng tới một field hay một method của instance, nên đôi khi ta nghĩ mình chỉ bắt một biến nhỏ mà thực ra đã neo cả object bao ngoài. Đọc heap dump thì phải lần đường tham chiếu từ GC root để biết chính xác cái gì đang bị neo, chứ không dừng ở \"có nhiều lambda\". Cách sửa gốc là đối xứng hoá vòng đời: mỗi lần đăng ký phải có một đường gỡ đăng ký được gọi chắc chắn khi request kết thúc, kể cả trên đường ngoại lệ — tức đặt nó vào `finally` hoặc một cơ chế đóng tài nguyên, chứ không tin vào đường đi thành công. Việc này nằm hoàn toàn trong mã của tôi nên không cần đổi API thư viện. Nếu vì lý do nào đó không gỡ được — chẳng hạn listener phải sống qua request — thì hướng thứ hai là giảm thứ bị neo: thay vì bắt cả object ngữ cảnh, chỉ bắt đúng những giá trị tối thiểu mà listener cần, thường là vài `String` và `long`. Điều đó không sửa được việc listener tích tụ, nhưng nó cắt kích thước mỗi lần tích tụ xuống nhiều bậc và biến một rò rỉ 20 giờ thành một mức nền chấp nhận được. Về tiêu chí nghiệm thu, tôi không dùng \"pod sống lâu hơn\" vì đó là dấu hiệu mơ hồ: tôi theo dõi mức chiếm dụng heap **sau mỗi lần GC** và đòi nó phẳng lại chứ chỉ chậm hơn thì chưa đạt.",
    redFlags: [
      "Kết luận \"lambda gây rò rỉ bộ nhớ\" như một đặc tính của lambda",
      "Nâng heap hoặc chỉnh GC — rò rỉ vẫn nguyên, chỉ dời thời điểm khởi động lại",
      "Dùng tham chiếu yếu cho listener như cách sửa duy nhất, không tạo đường gỡ đăng ký",
      "Lấy \"pod sống lâu hơn\" làm bằng chứng đã sửa xong thay vì mức chiếm dụng sau GC",
      "Bỏ qua việc lambda bắt `this` một cách ẩn, nên đánh giá thấp phạm vi bị neo",
    ],
    probes: [
      "Khi nào lambda bắt `this`, và làm sao biết nó có bắt hay không?",
      "Bạn đảm bảo gỡ đăng ký được gọi cả trên đường ngoại lệ bằng cách nào?",
      "Vì sao mức chiếm dụng sau GC mới là chỉ số đúng?",
    ],
    refs: ["mjia-03", "mjia-09"],
  },

  // ===== mj-stream — Stream và collector (mj-iq05–mj-iq08) =====
  {
    id: "mjia-iq05",
    field: "modern-java",
    topic: "mj-stream",
    level: 1,
    minutes: 5,
    question: "Stream khác Collection ở những điểm nào? Nêu ba khác biệt về bản chất, không phải về API.",
    mustCover: [
      "Collection lưu **giá trị đã tính**; stream **tính theo yêu cầu** khi thao tác kết thúc chạy",
      "Vì vậy stream **duyệt được đúng một lần** — duyệt lần hai là lỗi, còn Collection duyệt bao nhiêu lần cũng được",
      "Stream duyệt **nội bộ**: ta khai *cái gì* cần làm, thư viện quyết định *cách* duyệt; Collection duyệt ngoài bằng vòng lặp của ta",
      "Duyệt nội bộ là điều kiện để thư viện **song song hoá** và **gộp** các bước lại",
      "Thao tác trung gian **lười** và chỉ chạy khi có thao tác kết thúc, nên `filter` rồi `findFirst` không duyệt hết",
    ],
    model: "Ba khác biệt về bản chất. Thứ nhất là **thời điểm tính**: một Collection là một cấu trúc lưu trữ chứa những giá trị đã được tính và nằm sẵn trong bộ nhớ, còn một stream là một mô tả về phép tính, chỉ thực sự chạy khi có thao tác kết thúc. Từ đó suy ra khác biệt thứ hai, thứ hay làm người mới ngạc nhiên: stream **duyệt được đúng một lần**. Sau khi một thao tác kết thúc đã tiêu thụ stream, thử duyệt lại sẽ ném lỗi — trong khi một Collection duyệt bao nhiêu lần cũng được vì nó là dữ liệu, không phải phép tính. Thứ ba, và về thiết kế là quan trọng nhất: stream duyệt **nội bộ**. Với Collection ta viết vòng lặp, tức ta quyết định cách duyệt; với stream ta khai cái gì cần làm — lọc, biến đổi, gom — và thư viện quyết định cách duyệt. Điểm này không chỉ là chuyện cú pháp: vì thư viện nắm quyền duyệt nên nó làm được hai thứ ta không làm được từ ngoài. Nó gộp các bước lại thành một lần đi qua dữ liệu thay vì tạo danh sách trung gian cho mỗi bước, và nó song song hoá được khi ta yêu cầu, vì nó biết cách chia dữ liệu thành khối. Tính lười cũng theo về cùng lý do đó: các thao tác trung gian không làm gì cho tới khi có thao tác kết thúc, nên `filter` rồi `findFirst` chỉ duyệt đến khi tìm được phần tử đầu tiên thoả điều kiện chứ không duyệt hết — điều mà một chuỗi vòng lặp viết tay phải tự tổ chức mới đạt được.",
    redFlags: [
      "Chỉ nói stream \"gọn hơn\" hoặc \"hiện đại hơn\" mà không nêu khác biệt về bản chất",
      "Không biết stream chỉ duyệt được một lần",
      "Tưởng mọi thao tác chạy ngay khi gọi, nên không giải thích được tính lười",
    ],
    probes: [
      "Vì sao tính lười lại là hệ quả của việc duyệt nội bộ?",
      "Cho một chuỗi thao tác mà tính lười giúp tiết kiệm công việc thật",
      "Stream vô hạn tồn tại được nhờ đặc tính nào?",
    ],
    refs: ["mjia-04", "mjia-05"],
  },
  {
    id: "mjia-iq06",
    field: "modern-java",
    topic: "mj-stream",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Cần: với mỗi thành phố, tổng doanh thu của các đơn đã hoàn tất,
// chỉ giữ thành phố có tổng > 1 triệu, sắp giảm dần.

// Bản hiện tại:
Map<String, BigDecimal> result = new HashMap<>();
for (Order o : orders) {
    if (o.getStatus() != DONE) continue;
    String city = o.getCustomer().getCity();
    result.merge(city, o.getTotal(), BigDecimal::add);
}
Map<String, BigDecimal> filtered = new HashMap<>();
for (Map.Entry<String, BigDecimal> e : result.entrySet()) {
    if (e.getValue().compareTo(MILLION) > 0) filtered.put(e.getKey(), e.getValue());
}
// rồi sắp xếp bằng cách đổ vào List<Entry> và gọi sort...`,
    },
    question: "Viết lại bằng stream và collector. Rồi nói rõ bản stream **được** gì và **mất** gì so với bản vòng lặp này.",
    mustCover: [
      "Gom nhóm và tính tổng trong **một** bước bằng `groupingBy` với một collector hạ nguồn",
      "Lọc sau khi gom phải làm trên kết quả đã gom, vì `filter` trước đó lọc **đơn hàng** chứ không lọc **nhóm**",
      "Giữ thứ tự sắp giảm dần cần một `Map` có thứ tự — `HashMap` không giữ thứ tự chèn",
      "**Được**: ý định hiện ra ở một chỗ, không có ba biến trung gian, và đổi sang song song là một lời gọi",
      "**Mất**: khó debug hơn — không đặt được breakpoint giữa các bước như trong vòng lặp",
      "**Mất** thứ hai: stack trace khi có ngoại lệ đi qua nhiều tầng của thư viện, khó đọc hơn",
    ],
    model: "Bản stream gom cả ba giai đoạn lại: lọc đơn đã hoàn tất, gom nhóm theo thành phố với collector hạ nguồn tính tổng, rồi lọc trên kết quả đã gom và sắp xếp vào một `Map` giữ thứ tự. Điểm kỹ thuật dễ sai nhất là thứ tự hai phép lọc: `filter` trước `groupingBy` lọc **đơn hàng**, còn điều kiện tổng lớn hơn một triệu là điều kiện trên **nhóm** — nên nó phải nằm sau bước gom, trên tập entry. Ai gộp hai phép lọc vào cùng một chỗ sẽ ra kết quả sai mà không nhận ra. Điểm thứ hai là `Map` đích: nếu muốn giữ thứ tự sắp giảm dần thì phải gom vào một cấu trúc giữ thứ tự, vì `HashMap` không có khái niệm thứ tự chèn — đây là chỗ bản gốc cũng đã hỏng sẵn khi nó định sắp xếp rồi đổ lại vào `HashMap`. Phần so sánh mới là phần tôi muốn nói đầy đủ, vì viết lại bằng stream không phải luôn thắng. Bản stream **được** ba thứ: ý định nằm ở một chỗ và đọc gần như đọc câu hỏi nghiệp vụ; không còn ba biến trung gian mà mỗi biến là một cơ hội để ai đó dùng sai; và nếu sau này cần song song hoá thì đó là một lời gọi thay vì viết lại. Nhưng nó **mất** hai thứ thật. Thứ nhất là khả năng debug: trong vòng lặp ta đặt breakpoint ở giữa và xem từng phần tử, còn trong chuỗi stream thì không có chỗ tự nhiên để dừng — phải chèn `peek` hoặc tách chuỗi ra, tức phải sửa mã để quan sát nó. Thứ hai là stack trace: một ngoại lệ ném từ trong lambda đi qua nhiều tầng nội bộ của thư viện stream, nên dòng đầu tiên hữu ích nằm khá sâu. Với một chuỗi ba bước như ở đây tôi vẫn chọn stream, nhưng với một chuỗi mười bước có logic điều kiện phức tạp thì vòng lặp đôi khi là lựa chọn trung thực hơn.",
    redFlags: [
      "Đặt điều kiện tổng lớn hơn một triệu vào `filter` trước `groupingBy` — lọc sai đối tượng",
      "Gom vào `HashMap` rồi tuyên bố đã sắp xếp",
      "Nói bản stream thắng ở mọi mặt, không nêu cái giá về debug và stack trace",
      "Dùng `forEach` với một `Map` bên ngoài để cộng dồn — quay lại đúng lối vòng lặp, chỉ khoác cú pháp stream",
    ],
    probes: [
      "Vì sao `filter` trước và sau `groupingBy` lại lọc hai thứ khác nhau?",
      "Bạn quan sát giá trị ở giữa một chuỗi stream bằng cách nào?",
      "Khi nào bạn sẽ chọn giữ vòng lặp?",
    ],
    refs: ["mjia-05", "mjia-06"],
  },
  {
    id: "mjia-iq07",
    field: "modern-java",
    topic: "mj-stream",
    level: 3,
    minutes: 10,
    question: "Bạn cần gom một stream thành kết quả tổng hợp. Chọn `reduce`, `collect`, hay một vòng lặp?",
    tradeoffs: [
      {
        option: "`collect` với collector",
        when: "Khi kết quả là một **container khả biến** — danh sách, map, chuỗi. Collector mô tả cách tạo, cách nạp và cách **gộp hai kết quả bộ phận**, nên nó song song hoá đúng đắn được. Đây là lựa chọn mặc định cho việc gom nhóm.",
      },
      {
        option: "`reduce`",
        when: "Khi phép gộp là một **phép toán trên giá trị bất biến** và có phần tử đơn vị — cộng, nhân, max. Gọn và diễn đạt đúng ý định. Đòi phép toán phải **kết hợp** được, nếu không thì bản song song cho kết quả sai.",
      },
      {
        option: "Vòng lặp",
        when: "Khi logic gom có nhiều nhánh, cần thoát sớm theo điều kiện phức tạp, hoặc cần ghi log và debug từng bước. Trung thực hơn là nhồi cả logic đó vào một lambda dài trong `reduce`.",
      },
    ],
    mustCover: [
      "`reduce` với một container khả biến là **sai thiết kế**: nó biến phép gộp thành thao tác có tác dụng phụ",
      "Cụ thể, dùng `reduce` để nối vào cùng một danh sách thì bản song song sẽ **tranh chấp** và cho kết quả sai",
      "`collect` đúng vì collector khai rõ **cách gộp hai kết quả bộ phận**, nên mỗi luồng có container riêng",
      "`reduce` đòi phép toán **kết hợp** được; nếu không, kết quả song song khác kết quả tuần tự",
      "Không được dùng lambda có **tác dụng phụ** trong bất kỳ thao tác stream nào — đó là nguồn lỗi chỉ lộ ra khi song song",
      "Vòng lặp vẫn là lựa chọn đúng khi logic không khớp hình dạng của cả hai cơ chế kia",
    ],
    model: "Tôi chọn theo hình dạng của kết quả. Nếu kết quả là một container khả biến — một `List`, một `Map`, một chuỗi được nối — thì đó là việc của `collect`. Lý do không phải cú pháp mà là tính đúng đắn: một collector khai ba thứ gồm cách tạo container, cách nạp một phần tử, và **cách gộp hai container bộ phận**. Chính phần thứ ba làm nó song song hoá đúng, vì mỗi luồng làm việc trên container riêng rồi gộp lại. Nếu ta thay vào đó dùng `reduce` và nối phần tử vào cùng một danh sách dùng chung, ta đã biến phép gộp thành một thao tác có tác dụng phụ: bản tuần tự may mắn chạy đúng, còn bản song song thì nhiều luồng cùng ghi vào một danh sách và kết quả sai hoặc ném lỗi. Đây là loại lỗi tệ nhất vì nó không lộ ra cho tới khi ai đó thêm một lời gọi `parallel()`. Nếu kết quả là một giá trị bất biến và phép gộp là một phép toán có phần tử đơn vị — tổng, tích, max — thì `reduce` diễn đạt đúng ý định và gọn hơn. Điều kiện bắt buộc là phép toán phải **kết hợp** được, tức thứ tự nhóm các phép không đổi kết quả; nếu không, bản song song chia dữ liệu thành khối rồi gộp theo thứ tự khác và cho ra con số khác. Trừ một chỗ dễ quên, phép trừ và phép chia không kết hợp được, nên chúng không phải phép gộp hợp lệ. Còn vòng lặp thì tôi vẫn chọn khi logic gom có nhiều nhánh, cần thoát sớm theo điều kiện phức tạp, hoặc cần ghi log từng bước — nhồi tất cả vào một lambda dài trong `reduce` chỉ tạo ra mã trông có vẻ hàm mà đọc khó hơn hẳn vòng lặp tương đương. Nguyên tắc xuyên suốt là không dùng lambda có tác dụng phụ trong bất kỳ thao tác stream nào.",
    redFlags: [
      "Dùng `reduce` để nạp vào một danh sách dùng chung",
      "Không nêu điều kiện kết hợp được của phép gộp trong `reduce`",
      "Dùng `forEach` cộng một biến bên ngoài để gom kết quả",
      "Cho rằng vòng lặp luôn là lựa chọn kém hơn",
    ],
    probes: [
      "Cho một phép toán không kết hợp được và nói bản song song sai thế nào",
      "Ba phần của một collector là gì, và phần nào làm nó song song hoá được?",
      "Vì sao lỗi tác dụng phụ trong stream thường chỉ lộ ra rất muộn?",
    ],
    refs: ["mjia-05", "mjia-06"],
  },
  {
    id: "mjia-iq08",
    field: "modern-java",
    topic: "mj-stream",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một báo cáo tổng hợp cho ra con số **khác nhau** giữa các lần chạy trên cùng dữ liệu, lệch khoảng 0,01–3%. Chạy lại trên máy phát triển thì luôn đúng. Mã dùng một chuỗi stream có `parallel()` được thêm vào ba tháng trước để \"tăng tốc báo cáo\", và bên trong có một `forEach` cập nhật một `HashMap` được khai ở ngoài chuỗi.",
      scale: "Báo cáo chạy 4 lần mỗi ngày trên 2,8 triệu bản ghi, dùng để đối soát doanh thu. Ba tháng số liệu đã phát hành có thể sai.",
      constraints: "Không được bỏ song song hoá — báo cáo phải xong trong cửa sổ 15 phút và bản tuần tự mất 22 phút. Phải xác định được những lần chạy nào đã sai. Không đổi được định dạng đầu ra vì hệ thống kế toán đọc nó.",
      },
    question: "Vì sao lỗi chỉ xuất hiện trên production mà không tái hiện trên máy phát triển? Nêu chẩn đoán, cách sửa giữ được song song hoá, và cách truy lại ba tháng.",
    mustCover: [
      "`forEach` cập nhật một `HashMap` bên ngoài là một thao tác có **tác dụng phụ** trên state dùng chung",
      "Với `parallel()`, nhiều luồng cùng ghi vào `HashMap` — vốn **không thread-safe** — nên bản ghi bị mất hoặc cấu trúc bị hỏng",
      "Đó giải thích sai số **không cố định**: nó phụ thuộc thời điểm các luồng giao nhau",
      "Máy phát triển không tái hiện vì ít lõi và dữ liệu nhỏ nên stream có thể **không chia khối** hoặc ít tranh chấp",
      "Việc không tái hiện được là bằng chứng về **xác suất**, không phải về tính đúng đắn",
      "Sửa **giữ** song song: thay `forEach` có tác dụng phụ bằng `collect` với collector — mỗi luồng có container riêng rồi gộp",
      "Truy lại ba tháng bằng cách **chạy lại** bản đúng trên dữ liệu lưu trữ và so từng kỳ, không dựa vào log",
    ],
    model: "Gốc rễ là một thao tác có tác dụng phụ trong một chuỗi song song. `forEach` cập nhật một `HashMap` khai ở ngoài chuỗi nghĩa là mọi luồng cùng ghi vào một cấu trúc không thread-safe: bản ghi bị ghi đè lẫn nhau, và trong trường hợp xấu hơn thì cấu trúc nội bộ của map bị hỏng. Điều đó giải thích trọn vẹn đặc điểm lạ nhất của triệu chứng — sai số không cố định, lệch từ 0,01% tới 3% — vì lượng mất mát phụ thuộc thời điểm các luồng giao nhau, khác nhau mỗi lần chạy. Bản tuần tự chạy đúng chỉ vì chỉ có một luồng ghi, nên lỗi đã nằm sẵn trong mã từ trước và lời gọi `parallel()` ba tháng trước chỉ là thứ kích hoạt nó. Về việc máy phát triển không tái hiện: với ít lõi và dữ liệu nhỏ, stream có thể quyết định không chia khối, hoặc chia thành rất ít khối nên gần như không có tranh chấp. Điểm tôi muốn nhấn với đội là không tái hiện được ở đây là bằng chứng về xác suất chứ không phải bằng chứng về tính đúng đắn — một chuỗi stream có tác dụng phụ trên state dùng chung là sai trên mọi máy, chỉ khác tần suất phơi ra. Cách sửa vừa đúng vừa giữ được song song hoá, nên ràng buộc 15 phút không cản gì: thay `forEach` cộng map bên ngoài bằng `collect` với một collector gom nhóm. Collector khai rõ cách gộp hai kết quả bộ phận, nên mỗi luồng làm việc trên container riêng của nó rồi gộp lại một cách có kiểm soát — không còn state dùng chung, và song song hoá vẫn nguyên. Định dạng đầu ra không đổi vì thay đổi nằm ở cách gom, không ở cách xuất. Về việc truy lại ba tháng, tôi không dùng log vì log không ghi lại con số từng lần: tôi chạy lại bản đã sửa trên dữ liệu lưu trữ cho từng kỳ báo cáo rồi so với số đã phát hành. Cái được thêm là bản đúng có tính tái lập, nên mỗi kỳ chỉ cần chạy một lần và kết quả đó là con số tham chiếu để đối soát với kế toán. Cuối cùng, tôi sẽ thêm một bài kiểm chạy cùng dữ liệu qua cả bản tuần tự và bản song song rồi đòi hai kết quả **bằng nhau** — bài kiểm đó bắt được đúng lớp lỗi này và lẽ ra đã chặn nó ba tháng trước.",
    redFlags: [
      "Bỏ `parallel()` làm cách sửa — vi phạm ràng buộc 15 phút, và để nguyên lỗi thiết kế",
      "Đổi `HashMap` sang `ConcurrentHashMap` rồi coi là xong: hết hỏng cấu trúc nhưng kết quả vẫn có thể sai tuỳ cách cộng dồn, và vẫn là tác dụng phụ trong stream",
      "Kết luận \"không tái hiện trên máy dev nên chỉ là lỗi hạ tầng\"",
      "Dựa vào log để dựng lại ba tháng con số",
      "Không thêm bài kiểm so bản tuần tự với bản song song",
    ],
    probes: [
      "Vì sao đổi sang `ConcurrentHashMap` vẫn chưa phải cách sửa đúng?",
      "Bài kiểm nào bắt được lớp lỗi này một cách tin cậy?",
      "Sai số phụ thuộc thời điểm giao nhau của luồng — điều đó nói gì về việc thử lại để xác nhận?",
    ],
    refs: ["mjia-06", "mjia-07"],
  },

  // ===== mj-parallel — Xử lý song song và hiệu năng (mjia-iq09–mjia-iq12) =====
  {
    id: "mjia-iq09",
    field: "modern-java",
    topic: "mj-parallel",
    level: 1,
    minutes: 5,
    question: "Thêm `.parallel()` vào một stream không phải lúc nào cũng làm nó nhanh hơn. Nêu các yếu tố quyết định, và ba quy tắc vàng khi tối ưu hiệu năng.",
    mustCover: [
      "Ba quy tắc vàng của sách là **đo, đo, và đo** — phỏng đoán không bao giờ là ý tưởng hay",
      "Nguồn dữ liệu quyết định khả năng **chia khối**: mảng và `ArrayList` chia rẻ, `LinkedList` và stream sinh từ `iterate` thì không",
      "Chi phí cố định của việc chia khối, phân phối và gộp phải **nhỏ hơn** phần tiết kiệm được",
      "Nếu mỗi phần tử tốn ít công thì chi phí điều phối lấn hết lợi ích",
      "Thao tác có **boxing** hoặc phụ thuộc thứ tự làm bản song song mất lợi thế",
      "Benchmark trên JVM khó vì phải tính **thời gian warm-up** để HotSpot tối ưu bytecode và chi phí garbage collector",
    ],
    model: "Sách mở đầu phần này bằng một nguyên tắc tôi coi là câu trả lời đúng cho mọi câu hỏi tối ưu: trong kỹ nghệ phần mềm, phỏng đoán không bao giờ là ý tưởng hay, và ba quy tắc vàng khi tối ưu hiệu năng là đo, đo, và đo. Nói riêng về `parallel()` thì có mấy yếu tố quyết định. Thứ nhất là nguồn dữ liệu, vì song song hoá đòi chia dữ liệu thành khối: một mảng hay một `ArrayList` chia rất rẻ vì biết ngay kích thước và truy cập được theo chỉ số, còn một `LinkedList` phải duyệt mới chia được, và một stream vô hạn sinh bằng `iterate` thì về bản chất là tuần tự — mỗi phần tử phụ thuộc phần tử trước nên không có cách chia nào rẻ. Đây là lý do một ví dụ kinh điển trong sách, tính tổng 1 tới n bằng `Stream.iterate`, lại **chậm hơn** khi thêm `parallel()`. Thứ hai là tỉ lệ giữa công việc trên mỗi phần tử và chi phí điều phối: chia khối, phân phối cho các luồng, rồi gộp kết quả đều tốn, nên nếu mỗi phần tử chỉ cộng một số thì chi phí cố định lấn hết lợi ích. Thứ ba là hình dạng thao tác: boxing và unboxing làm mỗi phần tử đắt thêm, còn thao tác phụ thuộc thứ tự thì buộc thư viện phải làm thêm việc để giữ thứ tự. Và cuối cùng, về chính việc đo: benchmark trên JVM không dễ vì phải tính tới thời gian warm-up mà HotSpot cần để tối ưu bytecode cùng chi phí của garbage collector — nên sách dùng một bộ công cụ chuyên dụng thay vì đo bằng đồng hồ tường quanh một vòng lặp.",
    redFlags: [
      "Nói `parallel()` luôn nhanh hơn trên máy nhiều lõi",
      "Không nhắc tới khả năng chia khối của nguồn dữ liệu",
      "Đo bằng cách bọc đồng hồ quanh một vòng lặp, bỏ qua warm-up",
    ],
    probes: [
      "Vì sao stream sinh bằng `iterate` lại chậm hơn khi song song hoá?",
      "Nguồn nào chia khối rẻ và nguồn nào không?",
      "Warm-up ảnh hưởng thế nào tới một phép đo ngây thơ?",
    ],
    refs: ["mjia-07"],
  },
  {
    id: "mjia-iq10",
    field: "modern-java",
    topic: "mj-parallel",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Ba cách tính tổng 1..n, đội đo được: (c) nhanh nhất, (b) CHẬM NHẤT
public long a_iterative(long n) {
    long sum = 0;
    for (long i = 1L; i <= n; i++) sum += i;
    return sum;
}

public long b_parallelIterate(long n) {
    return Stream.iterate(1L, i -> i + 1)
                 .limit(n)
                 .parallel()
                 .reduce(0L, Long::sum);
}

public long c_parallelRange(long n) {
    return LongStream.rangeClosed(1, n)
                     .parallel()
                     .reduce(0L, Long::sum);
}`,
    },
    question: "Giải thích vì sao (b) chậm hơn cả bản vòng lặp (a) dù đã song song hoá, còn (c) lại nhanh nhất — dù (b) và (c) đều là parallel stream.",
    mustCover: [
      "`Stream.iterate` sinh phần tử **tuần tự**: mỗi giá trị phụ thuộc giá trị trước, nên không chia khối được một cách có ý nghĩa",
      "Không chia được thì song song hoá chỉ **thêm chi phí** điều phối mà không thêm công song song — nên chậm hơn cả tuần tự",
      "`Stream.iterate` tạo `Stream<Long>` nên mỗi phần tử bị **boxing** thành object",
      "`LongStream.rangeClosed` làm việc trên **long nguyên thuỷ**, không boxing",
      "Nó cũng biết trước **biên** của dãy nên chia khối được rẻ và đều",
      "Bài học: `parallel()` chỉ có lợi khi **nguồn** chia khối được và phần tử **không bị boxing**",
    ],
    model: "Hai stream song song mà chênh nhau nhiều lần vì hai thứ khác nhau, và cả hai đều thuộc về **nguồn** chứ không thuộc về lời gọi `parallel()`. Thứ nhất là khả năng chia khối. `Stream.iterate(1L, i -> i + 1)` sinh phần tử một cách tuần tự theo định nghĩa: muốn biết phần tử thứ một triệu thì phải tính xong phần tử thứ 999.999. Nên không có cách nào chia dãy này thành các khối độc lập; thư viện buộc phải sinh tuần tự rồi cố phân phối, và ta trả toàn bộ chi phí chia khối, đồng bộ và gộp mà không nhận được chút công song song nào. Đó là lý do (b) chậm hơn cả (a) — song song hoá ở đây là chi phí thuần. `LongStream.rangeClosed(1, n)` thì ngược lại: nó biết trước cả hai biên nên chia thành khối đều là chuyện tức thì, mỗi luồng tự tính phần của mình mà không cần biết luồng khác. Thứ hai là boxing. `Stream.iterate` với `1L` cho ra một `Stream<Long>`, nên mỗi phần tử là một object `Long` phải cấp phát rồi unbox khi cộng — với n lớn thì đó là hàng triệu object rác, và gánh nặng đó rơi cả lên bộ cấp phát lẫn garbage collector. `LongStream` làm việc trên `long` nguyên thuỷ nên không có object nào được tạo. Hai yếu tố này cộng lại giải thích trọn vẹn thứ tự (c) nhanh nhất, (a) ở giữa, (b) chậm nhất. Bài học rút ra cho thực hành: trước khi thêm `parallel()` phải hỏi hai câu — nguồn này chia khối được không, và phần tử có bị boxing không. Nếu câu trả lời là không và có, thì `parallel()` sẽ làm mọi thứ tệ hơn, và cách sửa nằm ở việc đổi nguồn chứ không ở việc chỉnh mức song song.",
    redFlags: [
      "Quy sự chênh lệch cho số lõi hoặc cho pool dùng chung, không nhắc khả năng chia khối",
      "Bỏ qua boxing như một yếu tố",
      "Kết luận \"parallel stream không đáng dùng\" từ ca (b)",
      "Đề nghị chỉnh kích thước pool fork/join làm cách sửa cho (b)",
    ],
    probes: [
      "Nếu bỏ `parallel()` khỏi (b) thì nó nhanh hơn hay chậm hơn, và vì sao?",
      "Còn thao tác nào trên stream mang chi phí boxing tương tự?",
      "Bạn kiểm tra một nguồn có chia khối rẻ hay không bằng cách nào?",
    ],
    refs: ["mjia-07"],
  },
  {
    id: "mjia-iq11",
    field: "modern-java",
    topic: "mj-parallel",
    level: 3,
    minutes: 10,
    question: "Bạn cần xử lý song song một khối công việc. Chọn parallel stream, fork/join trực tiếp, hay một executor riêng?",
    tradeoffs: [
      {
        option: "Parallel stream",
        when: "Công việc là một phép biến đổi dữ liệu **thuần tính toán** trên một nguồn chia khối rẻ. Ngắn nhất và khai báo được ý định. Nhược điểm phải biết: nó chạy trên một pool **dùng chung toàn JVM**, nên một tác vụ dài chiếm chỗ của mọi đoạn song song khác.",
      },
      {
        option: "Fork/join trực tiếp",
        when: "Khi thuật toán **đệ quy chia để trị** và ta cần tự quyết định ngưỡng chia. Kiểm soát được hình dạng cây chia, và tận dụng cơ chế cướp việc. Đổi lại là nhiều mã hơn và dễ sai ngưỡng.",
      },
      {
        option: "Executor riêng",
        when: "Khi công việc có **chờ I/O**, hoặc khi cần cô lập khỏi pool dùng chung. Đây là lựa chọn đúng cho mọi thứ không thuần tính toán — và parallel stream là lựa chọn **sai** cho việc chờ.",
      },
    ],
    mustCover: [
      "Parallel stream dùng **pool dùng chung** của cả JVM, nên một tác vụ dài trong đó ảnh hưởng ra ngoài phạm vi của nó",
      "Công việc có chờ I/O **không** thuộc về parallel stream: nó giữ thread của pool dùng chung mà không tiêu CPU",
      "Số thread của pool đó xấp xỉ **số lõi**, hợp cho tính toán và sai cho chờ",
      "Fork/join đúng khi thuật toán **đệ quy chia để trị**, và ngưỡng chia là tham số phải tự chọn",
      "Ngưỡng quá nhỏ tạo quá nhiều task nhỏ, chi phí quản lý lấn lợi ích; quá lớn thì không đủ việc để chia",
      "Trong mọi trường hợp: đo trước, và so với **bản tuần tự** làm mốc",
    ],
    model: "Tôi phân loại theo bản chất công việc chứ không theo công cụ. Nếu là phép biến đổi dữ liệu thuần tính toán trên một nguồn chia khối rẻ thì parallel stream là lựa chọn đúng: ngắn nhất, khai báo được ý định, và thư viện lo phần chia cùng gộp. Nhưng phải biết một điều về nó mà cú pháp không hề nói ra — nó chạy trên một pool dùng chung của cả JVM, với số thread xấp xỉ số lõi. Hệ quả là một tác vụ song song dài chiếm chỗ của mọi đoạn `parallel()` khác trong ứng dụng, nên một quyết định cục bộ trở thành ảnh hưởng toàn cục. Từ đó ra ranh giới quan trọng nhất: công việc có chờ I/O **không** thuộc về parallel stream. Một luồng đang chờ mạng vẫn chiếm một thread của pool dùng chung mà không tiêu chu kỳ CPU nào, nên vừa không nhanh hơn vừa làm chậm mọi thứ khác. Việc chờ thuộc về một executor riêng, kích thước đặt theo tỉ lệ chờ trên tính — và tách riêng còn cho ta cô lập lỗi, thứ pool dùng chung không có. Fork/join trực tiếp tôi chọn khi thuật toán có hình dạng đệ quy chia để trị và tôi cần tự quyết định ngưỡng dừng chia. Cơ chế cướp việc của nó cân bằng tải tốt khi các nhánh không đều nhau, nhưng cái giá là nhiều mã hơn và một tham số dễ sai: ngưỡng quá nhỏ sinh ra rất nhiều task tí hon và chi phí quản lý lấn hết lợi ích, còn quá lớn thì không đủ việc để chia cho các lõi. Quy tắc xuyên suốt cả ba, và là điều tôi làm trước khi chọn: đo, và luôn so với bản tuần tự làm mốc — vì khả năng thật là bản tuần tự đã đủ nhanh, và khi đó lựa chọn đúng là không song song hoá gì cả.",
    redFlags: [
      "Dùng parallel stream cho công việc có gọi mạng hoặc đọc đĩa",
      "Không biết parallel stream dùng pool dùng chung toàn JVM",
      "Chọn fork/join cho một phép biến đổi phẳng không có hình dạng đệ quy",
      "Song song hoá mà không có mốc tuần tự để so",
    ],
    probes: [
      "Một tác vụ parallel stream dài ảnh hưởng tới phần nào khác của ứng dụng?",
      "Bạn chọn ngưỡng chia cho fork/join thế nào?",
      "Khi nào câu trả lời đúng là không song song hoá?",
    ],
    refs: ["mjia-07"],
  },
  {
    id: "mjia-iq12",
    field: "modern-java",
    topic: "mj-parallel",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ API có độ trễ p99 nhảy từ 80ms lên 2,4 giây vào những khoảng ngẫu nhiên mỗi 10–30 phút, kéo dài chừng 20 giây rồi tự hết. CPU trong khoảng đó đạt 100%. Không có GC dài, không có truy vấn chậm. Một đội khác vừa thêm một job xuất báo cáo dùng `parallelStream()` trên danh sách 400.000 bản ghi, chạy theo lịch không đều.",
      scale: "3.400 request/giây trên 12 pod. Job báo cáo chạy khoảng 40 lần mỗi ngày. 4% request trong các khoảng đó vượt SLA.",
      constraints: "Không bỏ được job báo cáo — nó là yêu cầu nghiệp vụ. Không tách được sang dịch vụ riêng trong quý này. Không tăng CPU limit vì ngân sách cụm đã chốt.",
      },
    question: "Nối hai hiện tượng lại: vì sao một job báo cáo lại làm độ trễ của API nhảy lên? Nêu chẩn đoán và cách sửa trong ràng buộc.",
    mustCover: [
      "`parallelStream()` chạy trên **pool dùng chung của cả JVM**, không phải pool riêng của job",
      "Job chiếm gần hết thread của pool đó trong 20 giây, nên mọi đoạn song song khác trong tiến trình phải chờ",
      "CPU 100% khớp: 400.000 bản ghi chia cho số lõi là công việc thật, không phải chờ",
      "Tính **ngẫu nhiên** của triệu chứng khớp với lịch chạy không đều của job, không khớp với bất kỳ chu kỳ nội tại nào",
      "Sửa đúng bản chất: chạy job trong một **pool riêng**, để nó không dùng pool dùng chung",
      "Kèm theo: giới hạn mức song song của job xuống dưới số lõi, để luôn còn lõi cho đường phục vụ request",
      "Ràng buộc CPU đã chốt nghĩa là phải **nhường**, không thể thêm — nên đây là bài toán ưu tiên, không phải bài toán dung lượng",
    ],
    model: "Mắt nối giữa hai hiện tượng là một chi tiết mà cú pháp `parallelStream()` không hề nói ra: nó không tạo pool riêng cho job mà dùng pool song song **dùng chung của cả JVM**. Nên khi job xuất báo cáo chia 400.000 bản ghi cho các luồng, nó chiếm gần hết thread của pool đó trong suốt 20 giây; mọi đoạn mã khác trong cùng tiến trình có dùng parallel stream — kể cả trên đường phục vụ request — đều phải xếp hàng sau nó. Một quyết định trông rất cục bộ trong mã của đội khác trở thành ảnh hưởng lên độ trễ của toàn API. Hai dữ kiện còn lại xác nhận chẩn đoán: CPU 100% là đúng vì đây là công việc tính toán thật chứ không phải chờ, và tính ngẫu nhiên của các khoảng khớp với lịch chạy không đều của job chứ không khớp với chu kỳ nội tại nào của hệ thống — nếu là GC hay cache hết hạn thì ta sẽ thấy chu kỳ đều hơn. Cách sửa đúng bản chất nằm hoàn toàn trong mã và không cần thêm tài nguyên: cho job chạy trong một pool riêng thay vì pool dùng chung, để việc nó chiếm thread không còn ảnh hưởng ra ngoài. Nhưng như thế vẫn chưa đủ với ràng buộc CPU đã chốt, vì hai bên vẫn tranh cùng số lõi — nên bước thứ hai là giới hạn mức song song của job xuống dưới số lõi, chừa lại năng lực cho đường phục vụ request. Điểm tôi muốn nói rõ với cả hai đội là ở đây ta không giải bài toán dung lượng mà giải bài toán **ưu tiên**: ngân sách CPU không đổi được, nên phải quyết định ai được nhường, và câu trả lời hợp lý là job báo cáo chạy chậm hơn còn API giữ SLA. Nếu chỉnh mức song song mà job vượt quá cửa sổ cho phép thì bài toán thật là chia nhỏ job theo lô và rải ra theo thời gian, chứ không phải xin thêm lõi. Việc tách sang dịch vụ riêng vẫn là lời giải sạch nhất về lâu dài, và tôi sẽ ghi nó lại như một món nợ có lý do rõ ràng thay vì bỏ quên.",
    redFlags: [
      "Kết luận API và job không liên quan vì chúng là hai đường mã khác nhau",
      "Đi tìm nguyên nhân ở GC hay truy vấn chậm sau khi dữ liệu đã loại cả hai",
      "Đòi thêm CPU — ràng buộc đã cấm, và đây là bài toán ưu tiên chứ không phải dung lượng",
      "Bỏ `parallelStream()` để chạy tuần tự mà không kiểm job còn xong trong cửa sổ hay không",
      "Chỉnh pool dùng chung to hơn — làm mọi đoạn song song khác cũng tranh nhiều hơn",
    ],
    probes: [
      "Vì sao tính ngẫu nhiên của các khoảng lại là bằng chứng có ích?",
      "Bạn giới hạn mức song song của job bằng cách nào?",
      "Nếu job không xong trong cửa sổ sau khi giới hạn thì bước tiếp theo là gì?",
    ],
    refs: ["mjia-07"],
  },

  // ===== mj-optional — Optional, Date/Time và default method (mjia-iq13–mjia-iq16) =====
  {
    id: "mjia-iq13",
    field: "modern-java",
    topic: "mj-optional",
    level: 1,
    minutes: 5,
    question: "Một method khai trả về `Car` và một method khai trả về `Optional<Car>` — khác biệt thật sự nằm ở đâu? Và kể ba chỗ bạn **từ chối** dùng `Optional`.",
    mustCover: [
      "`Optional` đưa sự **vắng mặt của giá trị** vào **hệ thống kiểu**, nên trình biên dịch nhắc ta xử lý",
      "Kiểm `null` phụ thuộc kỷ luật của người viết; chữ ký trả `T` không nói gì về việc nó có thể `null`",
      "Nó cũng khử được chuỗi kiểm `null` lồng nhau khi đi qua một cấu trúc object lồng",
      "**Không** nên dùng làm kiểu của field trong entity — nó không `Serializable` và làm mô hình nặng thêm",
      "**Không** nên dùng làm kiểu tham số method — chỗ gọi buộc phải bọc, và vẫn có thể truyền `null` vào",
      "Dùng đúng nhất ở **giá trị trả về** của method có thể không tìm thấy kết quả",
    ],
    model: "Vấn đề với `null` không phải là nó tồn tại mà là nó **vô hình trong hệ thống kiểu**: một method khai trả về `Car` không nói gì về việc nó có thể trả `null`, nên người gọi phải đoán, và cách duy nhất để biết là đọc mã hoặc gặp lỗi lúc chạy. `Optional<Car>` đưa khả năng vắng mặt vào chính kiểu trả về, nên trình biên dịch và cả người đọc đều bị nhắc phải xử lý trường hợp không có. Lợi ích thứ hai lộ ra khi đi qua một cấu trúc lồng: cách viết bằng `null` cho ra một chuỗi `if` lồng nhau hoặc một chuỗi return sớm, còn với `Optional` thì các bước nối lại thành một biểu thức đọc theo đúng thứ tự ý định, và trường hợp vắng mặt được truyền qua tự động. Phần \"không nên dùng\" quan trọng không kém vì đây là chỗ `Optional` bị lạm dụng nhiều nhất. Nó không nên là kiểu của field trong một entity: nó không `Serializable`, nó thêm một tầng object cho mỗi field, và nó không hợp với các framework ánh xạ dữ liệu. Nó cũng không nên là kiểu tham số method — người gọi buộc phải bọc mọi thứ trong `Optional.of` hay `Optional.ofNullable`, làm chỗ gọi ồn hơn, mà vẫn không ngăn được ai đó truyền thẳng `null` vào tham số đó, nên ta trả giá mà không nhận được bảo đảm. Với tham số thì cách đúng là nạp chồng method hoặc nhận giá trị thường rồi kiểm tường minh. Chỗ `Optional` đúng nhất là giá trị trả về của một method có thể không tìm thấy kết quả — và đó cũng là lý do các API tra cứu trong thư viện chuẩn trả về nó.",
    redFlags: [
      "Nói `Optional` \"thay thế null\" ở mọi chỗ",
      "Dùng `Optional` làm kiểu field hoặc kiểu tham số",
      "Gọi `get()` ngay sau khi nhận `Optional` — quay về đúng hành vi của `null` nhưng ồn hơn",
    ],
    probes: [
      "Vì sao `Optional` làm tham số lại không mang bảo đảm nào?",
      "Bạn xử lý một `Optional` rỗng theo những cách nào, và chọn cách nào khi nào?",
      "Trong một entity, bạn diễn đạt field có thể vắng mặt bằng gì?",
    ],
    refs: ["mjia-11"],
  },
  {
    id: "mjia-iq14",
    field: "modern-java",
    topic: "mj-optional",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `// Mô hình lồng: Person -> Car -> Insurance -> name
public String getCarInsuranceName(Person person) {
    if (person != null) {
        Car car = person.getCar();
        if (car != null) {
            Insurance insurance = car.getInsurance();
            if (insurance != null) {
                return insurance.getName();
            }
        }
    }
    return "Unknown";
}

// Một đồng nghiệp viết lại thành:
public String getCarInsuranceNameV2(Person person) {
    return Optional.ofNullable(person)
        .map(p -> p.getCar())
        .map(c -> c.getInsurance())     // (!) getInsurance() trả về Optional<Insurance>
        .map(i -> i.getName())
        .orElse("Unknown");
}`,
    },
    question: "Bản viết lại không biên dịch được ở dòng có dấu `(!)`. Giải thích vì sao, sửa lại, và nói rõ sai lầm khái niệm phía sau.",
    mustCover: [
      "`getInsurance()` trả về `Optional<Insurance>`, nên `map` sinh ra `Optional<Optional<Insurance>>`",
      "`map` bọc kết quả vào một tầng `Optional` **mới**, nên hàm trả về `Optional` sẽ tạo hai tầng",
      "Sửa bằng `flatMap`, vốn **làm phẳng** một tầng: nó nhận hàm trả về `Optional` và không bọc thêm",
      "Quy tắc phân biệt: hàm trả **giá trị thường** thì `map`, hàm trả **`Optional`** thì `flatMap`",
      "Sai lầm khái niệm: coi `Optional` như một cái bọc tiện lợi thay vì như một **cấu trúc có phép nối**",
      "Bản sửa cũng cho thấy lợi ích thật so với bản `null`: không còn lồng `if`, và ý định đọc theo thứ tự",
    ],
    model: "Lỗi biên dịch nằm ở chỗ `map` luôn bọc kết quả của hàm vào một tầng `Optional` mới. Nếu hàm trả về `Insurance` thì `map` cho `Optional<Insurance>` — đúng như mong đợi. Nhưng ở đây `getInsurance()` đã trả về `Optional<Insurance>`, nên `map` cho ra `Optional<Optional<Insurance>>`, và bước `.map(i -> i.getName())` tiếp sau không gọi được `getName()` trên một `Optional`. Cách sửa là `flatMap` cho đúng bước đó: `flatMap` nhận một hàm trả về `Optional` và **làm phẳng** một tầng thay vì bọc thêm, nên chuỗi giữ nguyên độ sâu. Quy tắc phân biệt rất gọn và đáng nhớ: hàm trả giá trị thường thì dùng `map`, hàm đã trả `Optional` thì dùng `flatMap`. Đây cũng đúng quan hệ giữa `map` và `flatMap` trên stream, nên biết một chỗ là biết cả hai. Sai lầm khái niệm phía sau đáng nói hơn bản thân lỗi cú pháp: người viết đang coi `Optional` như một cái bọc tiện lợi để tránh viết `if`, nên khi gặp một bọc lồng bọc thì bí. Nhìn đúng thì `Optional` là một cấu trúc có phép nối, và `map` cùng `flatMap` là hai phép nối khác nhau cho hai hình dạng hàm khác nhau — hiểu vậy thì lỗi này không xảy ra. Về so sánh hai bản, bản `Optional` sau khi sửa cho thấy lợi ích thật chứ không chỉ là gọn hơn: bản `null` có bốn tầng lồng và trường hợp \"không có\" bị tách ra ở cuối, nên người đọc phải tự ghép lại; bản `Optional` đọc theo đúng thứ tự ý định — lấy xe, lấy bảo hiểm, lấy tên, nếu thiếu bất cứ bước nào thì trả về mặc định — và trường hợp vắng mặt được truyền qua tự động thay vì phải kiểm tay ở từng bước.",
    redFlags: [
      "Sửa bằng cách gọi `get()` trên tầng trong",
      "Đổi hết sang `flatMap` cho mọi bước, kể cả những bước trả giá trị thường",
      "Kết luận `Optional` gây phức tạp nên quay lại bản `null`",
      "Không nêu được quy tắc phân biệt `map` với `flatMap`",
    ],
    probes: [
      "Quan hệ giữa `map` và `flatMap` ở đây giống gì trên stream?",
      "Khi nào `orElse` là sai và bạn nên dùng `orElseGet`?",
      "Bản `Optional` xử lý trường hợp `person` là `null` ở đâu?",
    ],
    refs: ["mjia-11"],
  },
  {
    id: "mjia-iq15",
    field: "modern-java",
    topic: "mj-optional",
    level: 3,
    minutes: 9,
    question: "Bạn thêm một method mới vào một interface đã được nhiều class bên ngoài implement. Chọn cách nào?",
    tradeoffs: [
      {
        option: "Default method trên interface",
        when: "Khi có một hành vi mặc định **đúng** cho mọi implementation hiện có. Đây chính là bài toán default method sinh ra để giải: mở rộng interface mà không phá mã của người dùng. Đổi lại là mỗi default method là một cam kết lâu dài và có thể gây **xung đột** khi một class thừa hưởng từ nhiều nguồn.",
      },
      {
        option: "Một interface mới mở rộng interface cũ",
        when: "Khi **không** có hành vi mặc định đúng, hoặc khi hành vi mới chỉ có nghĩa với một phần implementation. Rõ ràng hơn về ý định, và không ép ai phải nhận một mặc định có thể sai.",
      },
      {
        option: "Abstract class hoặc một class helper",
        when: "Khi hành vi mới cần **state**. Default method không có state, nên nếu hành vi đòi nhớ gì đó thì interface là chỗ sai.",
      },
    ],
    mustCover: [
      "Default method sinh ra để **tiến hoá interface** mà không phá mã đã implement — đó là lý do tồn tại của nó",
      "Nó khác abstract class ở chỗ **không mang state**",
      "Khi một class nhận cùng một method từ nhiều interface thì có **xung đột**, và phải giải theo quy tắc ưu tiên",
      "Quy tắc: class cụ thể thắng interface; interface **cụ thể hơn** thắng interface tổng quát hơn; còn lại phải khai tường minh",
      "Một mặc định **sai** còn tệ hơn không có mặc định: nó thất bại âm thầm ở những implementation không phù hợp",
      "Nếu không có mặc định đúng cho mọi implementation thì tách interface mới là lựa chọn trung thực hơn",
    ],
    model: "Câu hỏi quyết định là: có một hành vi mặc định **đúng cho mọi** implementation hiện có hay không. Nếu có thì default method là công cụ đúng, và đây chính là bài toán nó sinh ra để giải — thêm method vào một interface đã công bố mà không phá mã của những người đã implement nó, điều mà trước đó là bất khả thi. Nếu không có, tôi không đặt một mặc định gần đúng, vì một mặc định sai tệ hơn việc không có mặc định: nó biên dịch được, chạy được, và thất bại âm thầm ở những implementation mà nó không phù hợp — trong khi một method abstract mới sẽ làm mã không biên dịch được và buộc mọi người phải nghĩ. Khi không có mặc định đúng, lựa chọn trung thực là một interface mới mở rộng interface cũ, để chỉ những implementation thật sự có hành vi đó mới nhận nó. Hai điều phải cân khi chọn default method. Thứ nhất, nó là một cam kết lâu dài: một khi đã công bố thì không bỏ đi được mà không phá ai đó. Thứ hai là xung đột kế thừa — nếu một class nhận cùng một chữ ký method từ nhiều interface thì phải giải theo quy tắc ưu tiên: class cụ thể thắng interface, interface cụ thể hơn thắng interface tổng quát hơn, và nếu vẫn không phân định được thì class phải override và khai tường minh nó chọn bản nào. Đây là lý do thêm default method vào một interface được nhiều nơi implement không phải thay đổi vô hại: nó có thể làm hỏng biên dịch của một class vốn đang implement hai interface cùng lúc. Còn nếu hành vi mới cần state thì interface là chỗ sai ngay từ đầu, vì default method không mang state — lúc đó phải là abstract class hoặc một class helper riêng.",
    redFlags: [
      "Thêm default method với một mặc định \"tạm\" không đúng cho mọi implementation",
      "Coi default method là cách để interface có state",
      "Không biết quy tắc giải xung đột khi thừa hưởng từ nhiều interface",
      "Cho rằng thêm default method luôn là thay đổi tương thích ngược hoàn toàn",
    ],
    probes: [
      "Nêu quy tắc ưu tiên khi một class nhận cùng method từ hai interface",
      "Vì sao một mặc định sai tệ hơn không có mặc định?",
      "Default method có phá được tương thích biên dịch của mã hiện có không?",
    ],
    refs: ["mjia-13"],
  },
  {
    id: "mjia-iq16",
    field: "modern-java",
    topic: "mj-optional",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một dịch vụ báo giá tính sai múi giờ cho khoảng 0,2% đơn: hạn hiệu lực lệch đúng một giờ, nhưng chỉ với đơn tạo trong hai khoảng cụ thể của năm. Mã dùng một kiểu ngày giờ không mang múi giờ, cộng thêm số giờ bằng phép cộng số nguyên, rồi quy đổi sang giờ địa phương của khách khi hiển thị.",
      scale: "Khoảng 18.000 báo giá mỗi ngày, nên 0,2% là chừng 36 đơn mỗi ngày. Đã chạy hai năm; một khách hàng lớn vừa phát hiện khi đối soát.",
      constraints: "Không đổi được schema cột lưu ngày giờ trong đợt này — 7 dịch vụ khác đọc nó. Phải xác định được toàn bộ đơn đã lệch trong hai năm. Phải giải thích được vì sao chỉ hai khoảng trong năm, vì đội nghi đó là lỗi ngẫu nhiên.",
      },
    question: "Đội nghi đây là lỗi ngẫu nhiên. \"Chỉ hai khoảng cụ thể của năm\" nói ngược lại điều gì? Schema không đổi được — vậy sửa ở đâu, và 36 đơn mỗi ngày trong hai năm truy lại bằng cách nào?",
    mustCover: [
      "Hai khoảng trong năm là dấu hiệu của **chuyển đổi giờ tiết kiệm ánh sáng** — nó xảy ra đúng hai lần mỗi năm",
      "Nên đây **không** phải lỗi ngẫu nhiên mà là lỗi xác định, chỉ phơi ra vào hai thời điểm đó",
      "Gốc rễ: dùng kiểu ngày giờ **không mang múi giờ** rồi cộng số giờ bằng phép cộng số nguyên",
      "Cộng số giờ theo số nguyên giả định mỗi ngày có đúng 24 giờ — giả định sai vào ngày chuyển đổi",
      "Cách đúng: dùng kiểu mang **múi giờ**, và dùng phép cộng của API ngày giờ vốn hiểu quy tắc lịch",
      "Phân biệt hai phép cộng khác nhau: cộng theo **khoảng thời gian vật lý** so với cộng theo **đơn vị lịch**",
      "Trong ràng buộc không đổi schema: lưu tiếp giá trị cũ nhưng **tính** bằng kiểu mang múi giờ rồi quy đổi trước khi ghi",
    ],
    model: "Chi tiết \"chỉ hai khoảng cụ thể của năm\" gần như tự nói ra chẩn đoán: giờ tiết kiệm ánh sáng chuyển đổi đúng hai lần mỗi năm. Nên đây không phải lỗi ngẫu nhiên mà là một lỗi hoàn toàn xác định, chỉ phơi ra vào hai thời điểm ấy — và tôi sẽ nói điều này với đội trước tiên, vì \"ngẫu nhiên\" là cách người ta bỏ qua một lỗi có thể truy được. Gốc rễ gồm hai phần cộng lại. Phần một là chọn sai kiểu: một kiểu ngày giờ không mang múi giờ chỉ biểu diễn một thời điểm trên đồng hồ tường, không biểu diễn một thời điểm trong thực tế — nên nó thiếu đúng thông tin cần để trả lời \"một giờ sau đó là lúc nào\". Phần hai là cộng số giờ bằng phép cộng số nguyên, tức ngầm giả định mỗi ngày có đúng 24 giờ và mỗi giờ trôi đều nhau. Vào ngày chuyển đổi thì giả định đó sai: có ngày 23 giờ và có ngày 25 giờ, và có một khoảng đồng hồ tường lặp lại hoặc nhảy qua. Đây cũng là chỗ phải phân biệt hai phép cộng khác nhau về ý nghĩa: cộng theo khoảng thời gian vật lý — 24 giờ thật đã trôi — khác với cộng theo đơn vị lịch — cùng giờ này ngày mai. API ngày giờ của Java tách hai thứ đó thành hai kiểu và hai họ phép toán riêng, chính vì chúng cho kết quả khác nhau vào ngày chuyển đổi; chọn sai một trong hai là nguồn của gần như mọi lỗi múi giờ. Ở đây \"hạn hiệu lực sau N giờ\" là một khoảng thời gian vật lý, nên phải tính bằng kiểu mang múi giờ và phép cộng khoảng. Về ràng buộc không đổi schema: nó không cản cách sửa, vì tôi chỉ cần đổi cách **tính** chứ không đổi cách **lưu** — tính bằng kiểu mang múi giờ, rồi quy đổi sang định dạng cột hiện tại trước khi ghi. Bảy dịch vụ kia đọc đúng thứ chúng vẫn đọc, chỉ là giá trị bên trong giờ đã đúng. Món nợ còn lại là cột không mang múi giờ, và tôi ghi nó lại kèm lý do thay vì bỏ quên. Về truy lại hai năm, tôi không dùng log mà tính lại: lọc những đơn có hạn hiệu lực rơi vào các cửa sổ chuyển đổi giờ trong hai năm, tính lại bằng bản đúng, và so với giá trị đã lưu — phần lệch chính là tập cần đối soát, và vì lỗi là xác định nên tập đó tái lập được chính xác.",
    redFlags: [
      "Coi đó là lỗi ngẫu nhiên hoặc lỗi làm tròn",
      "Cộng thêm hoặc bớt một giờ để bù — sửa triệu chứng và sẽ sai chiều ở lần chuyển đổi kia",
      "Chuyển hết sang UTC rồi bỏ qua việc hiển thị theo giờ khách, hoặc ngược lại",
      "Đòi đổi schema như điều kiện tiên quyết — ràng buộc đã cấm và không cần thiết",
      "Không phân biệt cộng theo khoảng vật lý với cộng theo đơn vị lịch",
    ],
    probes: [
      "Cho một ví dụ mà cộng 24 giờ và cộng một ngày cho hai kết quả khác nhau",
      "Kiểu nào bạn dùng để lưu, và kiểu nào để tính?",
      "Đơn có hạn rơi đúng vào giờ bị lặp lại thì bạn quyết định thế nào?",
    ],
    refs: ["mjia-12"],
  },

  // ===== mj-async — CompletableFuture và reactive (mjia-iq17–mjia-iq20) =====
  {
    id: "mjia-iq17",
    field: "modern-java",
    topic: "mj-async",
    level: 1,
    minutes: 6,
    question: "`CompletableFuture` thêm gì so với `Future`? Nêu những việc `Future` không làm được.",
    mustCover: [
      "`Future` chỉ cho một cách lấy kết quả: gọi `get()`, và lời gọi đó **chặn** luồng gọi",
      "Vì vậy `Future` **không kết hợp được**: không nối được hai tác vụ mà không chặn giữa hai bước",
      "`Future` cũng không có cách khai báo \"khi xong thì làm gì\" — không có phản ứng lúc hoàn tất",
      "`CompletableFuture` cho **nối ống** các tác vụ: kết quả của bước này thành đầu vào bước sau, không chặn",
      "Nó cho **kết hợp** hai future độc lập, và cho phản ứng khi bất kỳ cái nào hoàn tất",
      "Nó cũng mang theo cơ chế xử lý **ngoại lệ** dọc chuỗi, thứ `Future` chỉ phơi ra khi gọi `get()`",
    ],
    model: "`Future` đại diện cho một kết quả sẽ có sau, nhưng nó chỉ cấp đúng một cách để lấy kết quả đó: gọi `get()`. Và `get()` chặn luồng gọi tới khi có kết quả. Hệ quả lớn nhất không phải chuyện chặn một lần mà là `Future` **không kết hợp được**: nếu ta cần kết quả của tác vụ A làm đầu vào cho tác vụ B, cách duy nhất là `get()` trên A rồi gửi B — nghĩa là giữa hai bước bất đồng bộ có một điểm chặn, và toàn bộ lợi ích của việc chạy song song bị cắt ở đó. Tương tự, `Future` không có cách khai báo \"khi xong thì làm gì\", nên mọi thứ sau khi hoàn tất đều phải chờ ở một chỗ nào đó. `CompletableFuture` mở ra bốn nhóm việc mà `Future` không làm được. Thứ nhất là nối ống: khai rằng khi bước này xong thì kết quả của nó đi vào bước sau, và cả chuỗi được mô tả trước mà không chặn ở đâu. Thứ hai là kết hợp hai future độc lập, chờ cả hai xong rồi gộp kết quả — hoặc chờ cái nào xong trước thì dùng cái đó. Thứ ba là phản ứng khi hoàn tất, tức chạy một hành động tại thời điểm xong mà không có luồng nào ngồi chờ. Thứ tư, và hay bị bỏ qua khi so sánh, là xử lý ngoại lệ: với `Future` thì ngoại lệ chỉ lộ ra lúc gọi `get()` và bị bọc lại, còn `CompletableFuture` cho khai cách xử lý lỗi dọc chuỗi nên phần xử lý lỗi nằm cạnh phần logic. Nói ngắn thì `Future` là một **giá trị** sẽ có, còn `CompletableFuture` là một **phép tính** có thể mô tả trước và ghép lại được — và khác biệt đó mới là lý do nó tồn tại.",
    redFlags: [
      "Chỉ nói `CompletableFuture` \"tiện hơn\" mà không nêu việc `Future` không kết hợp được",
      "Không nhắc tới xử lý ngoại lệ dọc chuỗi",
      "Coi cả hai là tương đương và chỉ khác API",
    ],
    probes: [
      "Vì sao việc chỉ có `get()` lại làm `Future` không kết hợp được?",
      "Bạn chờ cả hai future xong bằng cách nào, và chờ cái nào xong trước bằng cách nào?",
      "Ngoại lệ trong một bước giữa chuỗi đi đâu?",
    ],
    refs: ["mjia-15", "mjia-16"],
  },
  {
    id: "mjia-iq18",
    field: "modern-java",
    topic: "mj-async",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Cần: lấy giá từ 4 nhà cung cấp, mỗi lời gọi ~1 giây, rồi trả bản rẻ nhất.
public Quote cheapest(List<Shop> shops) {
    return shops.stream()
        .map(shop -> CompletableFuture.supplyAsync(() -> shop.getPrice()))  // (1)
        .map(future -> future.join())                                       // (2)
        .map(this::parse)
        .min(comparing(Quote::getPrice))
        .orElseThrow();
}`,
    },
    question: "Đoạn này mất khoảng 4 giây thay vì khoảng 1 giây dù đã dùng `CompletableFuture`. Giải thích vì sao, sửa lại, và nói bạn còn cần cấu hình gì.",
    mustCover: [
      "Stream **lười**: hai `map` liền nhau được gộp vào **một** lần đi qua phần tử",
      "Nên với mỗi shop, `supplyAsync` gửi tác vụ rồi `join` chặn ngay lập tức — trước khi shop kế tiếp được gửi",
      "Kết quả là bốn lời gọi chạy **tuần tự**, và `CompletableFuture` không mang lại gì",
      "Sửa bằng **hai lần duyệt**: đợt một gửi hết tác vụ và thu vào một `List<CompletableFuture>`, đợt hai mới `join`",
      "Ép duyệt xong đợt một bằng cách `collect` vào danh sách — đó chính là chỗ tính lười bị chặn lại",
      "Còn cần cấu hình **executor riêng**: mặc định chạy trên pool dùng chung, và pool đó cỡ số lõi nên sai cho việc chờ I/O",
      "Kích thước executor nên đặt theo số lời gọi đồng thời cần, không theo số lõi",
    ],
    model: "Nguyên nhân là tính lười của stream, và nó là một cái bẫy rất đẹp vì mã trông hoàn toàn hợp lý. Stream không chạy `map` thứ nhất cho toàn bộ phần tử rồi mới chạy `map` thứ hai; nó gộp các thao tác trung gian vào một lần đi qua, nên với mỗi shop nó làm lần lượt: gửi tác vụ bất đồng bộ, rồi `join` ngay — và `join` chặn tới khi lời gọi đó xong. Chỉ sau đó shop thứ hai mới được gửi. Bốn lời gọi vì thế chạy tuần tự, mỗi cái một giây, ra bốn giây, và `CompletableFuture` không đóng góp gì ngoài chi phí. Cách sửa là ép tách thành hai lần duyệt: đợt một `map` sang `CompletableFuture` rồi **`collect` vào một `List`** — chính bước `collect` chặn tính lười lại và bảo đảm cả bốn tác vụ đã được gửi; đợt hai mới stream trên danh sách đó và `join` từng cái. Khi đó bốn lời gọi chạy đồng thời và tổng thời gian xấp xỉ lời gọi chậm nhất, khoảng một giây. Phần cấu hình mà câu hỏi hỏi thêm là phần quan trọng không kém: `supplyAsync` không truyền executor sẽ chạy trên pool song song dùng chung, mà pool đó có số thread xấp xỉ số lõi. Với bốn shop thì chưa thấy vấn đề, nhưng đây là công việc **chờ mạng** chứ không phải tính toán, nên số thread đúng phải đặt theo số lời gọi đồng thời cần chứ không theo số lõi — với vài chục shop trên một máy bốn lõi thì pool dùng chung lại trở thành nút thắt, và tệ hơn là nó chiếm chỗ của mọi đoạn song song khác trong ứng dụng. Nên tôi truyền một executor riêng cho các lời gọi này, kích thước đặt theo số shop cần gọi đồng thời, và có giới hạn trên để nó không mọc vô hạn.",
    redFlags: [
      "Thêm `.parallel()` vào stream để chữa — sai công cụ, và vẫn còn điểm chặn ở `join`",
      "Chỉ đổi `join` sang `get` hoặc thêm timeout mà không tách hai lần duyệt",
      "Sửa xong phần tuần tự nhưng để `supplyAsync` chạy trên pool dùng chung cho việc chờ I/O",
      "Đặt kích thước executor theo số lõi cho một tác vụ thuần chờ",
    ],
    probes: [
      "Vì sao `collect` vào danh sách lại là chỗ then chốt của bản sửa?",
      "Nếu có 200 shop thì bạn đặt kích thước executor thế nào?",
      "Một shop trả lỗi thì cả chuỗi hành xử thế nào, và bạn muốn nó hành xử thế nào?",
    ],
    refs: ["mjia-16"],
  },
  {
    id: "mjia-iq19",
    field: "modern-java",
    topic: "mj-async",
    level: 3,
    minutes: 10,
    question: "Bạn cần gọi nhiều dịch vụ rồi gộp kết quả. Chọn `CompletableFuture`, reactive streams, hay virtual thread?",
    tradeoffs: [
      {
        option: "`CompletableFuture`",
        when: "Khi luồng là **một tập hữu hạn** lời gọi rồi gộp — đúng hình dạng bài toán này. Có trong thư viện chuẩn, không thêm phụ thuộc, và diễn đạt tốt việc nối ống cùng kết hợp. Đổi lại là mã khó đọc dần khi chuỗi dài, và stack trace mất nghĩa.",
      },
      {
        option: "Reactive streams",
        when: "Khi dữ liệu là một **dòng không biết trước độ dài** và cần **áp lực ngược** — người tiêu thụ phải điều tiết được tốc độ người sản xuất. Đó là thứ `CompletableFuture` không mô hình hoá được vì nó nói về một giá trị, không về một dòng.",
      },
      {
        option: "Virtual thread với mã tuần tự",
        when: "Khi lý do duy nhất chọn bất đồng bộ là **trần số thread**. Viết tuần tự, đọc tuần tự, debug tuần tự, mà vẫn mở rộng được. Không giúp gì cho bài toán áp lực ngược, và không phải mọi nền tảng đã dùng được.",
      },
    ],
    mustCover: [
      "Trục phân biệt đầu tiên: **một giá trị** so với **một dòng nhiều giá trị**",
      "`CompletableFuture` mô hình hoá một giá trị sẽ có; reactive streams mô hình hoá một dòng",
      "**Áp lực ngược** là năng lực riêng của reactive: người tiêu thụ báo cho người sản xuất biết mình chịu được bao nhiêu",
      "Nếu không cần áp lực ngược thì reactive là chi phí học và chi phí đọc mà không có lợi ích tương ứng",
      "Virtual thread đổi trục: nó làm mã **tuần tự** mở rộng được, nên bỏ được lý do phải viết bất đồng bộ",
      "Nhưng virtual thread không giải bài toán dòng và áp lực ngược",
      "Mọi lựa chọn đều cần **xử lý lỗi và timeout** rõ ràng cho từng lời gọi, không chỉ cho cả chuỗi",
    ],
    model: "Tôi phân biệt trước bằng một câu hỏi: đây là một tập hữu hạn giá trị, hay một dòng không biết trước độ dài? Bài toán đề bài nêu — gọi nhiều dịch vụ rồi gộp — là tập hữu hạn, nên `CompletableFuture` khớp hình dạng: nó diễn đạt tốt việc gửi song song, nối ống, và kết hợp kết quả; nó nằm trong thư viện chuẩn nên không thêm phụ thuộc. Cái giá tôi sẽ nói trước là khả năng đọc: một chuỗi ba bốn bước còn ổn, nhưng khi có nhánh điều kiện và xử lý lỗi riêng cho từng bước thì mã khó đọc nhanh, và stack trace khi có ngoại lệ gần như không chỉ được chỗ hỏng. Reactive streams giải một bài khác, và điểm phân biệt là **áp lực ngược**: người tiêu thụ có cách báo cho người sản xuất biết mình chịu được bao nhiêu, nên dòng tự điều tiết. Đó là thứ `CompletableFuture` về bản chất không mô hình hoá được vì nó nói về một giá trị chứ không về một dòng. Nhưng nếu bài toán không cần áp lực ngược thì chọn reactive là trả chi phí học và chi phí đọc cho một năng lực không dùng tới — và tôi thấy đây là sai lầm phổ biến nhất trong nhóm này. Virtual thread thì đổi hẳn trục câu hỏi: nếu lý do duy nhất ta viết bất đồng bộ là trần số thread, thì virtual thread bỏ đúng lý do đó, và ta được viết tuần tự — đọc tuần tự, debug tuần tự, stack trace có nghĩa — mà vẫn mở rộng được tới số lời gọi đồng thời rất lớn. Với bài toán fan-out rồi gộp thì đó thường là lựa chọn sạch nhất hiện nay. Điều nó không làm là giải bài toán dòng và áp lực ngược, nên nó không thay được reactive ở đúng chỗ reactive mạnh. Cuối cùng, một yêu cầu áp cho cả ba mà người ta hay bỏ: mỗi lời gọi ra ngoài phải có timeout và đường xử lý lỗi **riêng**, không chỉ một timeout cho cả chuỗi — vì một dịch vụ chậm trong sáu dịch vụ là tình huống thường gặp nhất, và ta cần quyết định trước là bỏ nó hay chờ nó.",
    redFlags: [
      "Chọn reactive vì \"nó hiện đại\" mà không cần áp lực ngược",
      "Nói `CompletableFuture` và reactive là hai cách làm cùng một việc",
      "Đặt một timeout duy nhất cho cả chuỗi, không xử lý riêng từng lời gọi",
      "Cho rằng virtual thread thay được reactive trong mọi trường hợp",
    ],
    probes: [
      "Áp lực ngược cụ thể là gì, và cho một ca mà thiếu nó gây sự cố",
      "Một trong sáu dịch vụ chậm gấp mười — chuỗi của bạn hành xử thế nào?",
      "Vì sao stack trace trong chuỗi bất đồng bộ lại mất nghĩa?",
    ],
    refs: ["mjia-15", "mjia-17"],
  },
  {
    id: "mjia-iq20",
    field: "modern-java",
    topic: "mj-async",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một endpoint tổng hợp gọi 6 dịch vụ bằng `CompletableFuture` và gộp kết quả. Nó hoạt động tốt nhiều tháng, rồi sau khi một dịch vụ phụ thuộc chậm đi, endpoint bắt đầu trả về **thiếu dữ liệu** thay vì báo lỗi — một phần kết quả rỗng, không có ngoại lệ nào trong log. Mã có `exceptionally(e -> null)` ở cuối chuỗi.",
      scale: "2.200 request/giây. Khoảng 7% response thiếu dữ liệu trong giờ cao điểm. Đã ba tuần, và một đội hạ nguồn đã dựng logic bù dựa trên dữ liệu thiếu đó.",
      constraints: "Không sửa được dịch vụ phụ thuộc trong quý này. Hợp đồng API không cho phép thêm trường mới vào response. Phải quyết định trong sprint này vì đội hạ nguồn đang xây tiếp trên hành vi hiện tại.",
      },
    question: "Vì sao lỗi biến thành dữ liệu thiếu thay vì ngoại lệ? Nêu chẩn đoán và quyết định của bạn, kể cả phần phải nói với đội hạ nguồn.",
    mustCover: [
      "`exceptionally(e -> null)` **nuốt** mọi ngoại lệ và biến chúng thành giá trị `null` hợp lệ",
      "Vì vậy timeout hay lỗi của một dịch vụ trở thành một phần kết quả rỗng, không phân biệt được với \"thật sự không có dữ liệu\"",
      "Đó là lý do log sạch: không có ngoại lệ nào thoát ra để ghi",
      "Lỗi thiết kế gốc: **gộp hai trạng thái khác nhau** — \"không có dữ liệu\" và \"không lấy được dữ liệu\" — thành cùng một biểu diễn",
      "Quyết định phải là **nghiệp vụ**: response thiếu dữ liệu có hợp lệ hay không, và ai được quyết",
      "Việc cần làm ngay: ghi log và metric cho mỗi lần `exceptionally` chạy, để lỗi thôi im lặng",
      "Phải nói với đội hạ nguồn **trước khi** sửa: họ đang xây trên một hành vi vô tình, và sửa sẽ phá logic bù của họ",
      "Hợp đồng API không cho thêm trường nghĩa là phải diễn đạt trạng thái lỗi bằng **mã trạng thái** hoặc bằng cách từ chối",
    ],
    model: "Cơ chế nằm gọn trong một dòng: `exceptionally(e -> null)` bắt mọi ngoại lệ của chuỗi và trả về `null` như một giá trị hoàn toàn hợp lệ. Nên khi một dịch vụ chậm đi và lời gọi timeout, ngoại lệ không thoát ra đâu cả — nó được đổi thành `null`, `null` đi vào bước gộp, và response ra ngoài với một phần dữ liệu rỗng. Log sạch vì chẳng có ngoại lệ nào để ghi. Lỗi thiết kế phía sau lớn hơn bản thân dòng mã: nó gộp hai trạng thái khác nhau về bản chất — \"dịch vụ trả lời rằng không có dữ liệu\" và \"ta không lấy được dữ liệu\" — thành cùng một biểu diễn, nên từ đó trở đi không ai, kể cả client, phân biệt được hai thứ. Việc tôi làm ngay trong ngày đầu, trước cả khi bàn thiết kế: ghi log kèm metric cho mỗi lần nhánh `exceptionally` chạy. Nó không sửa gì nhưng biến một lỗi im lặng thành một con số quan sát được, và con số đó là cơ sở cho mọi quyết định sau — hiện tại ta còn chưa biết 7% là bao nhiêu phần do timeout và bao nhiêu phần là dữ liệu thật sự trống. Quyết định chính thì không phải quyết định kỹ thuật: có hay không được trả về một response thiếu dữ liệu là câu hỏi nghiệp vụ, và người quyết là chủ sở hữu API chứ không phải tôi. Tôi sẽ trình bày hai hướng kèm hệ quả. Hướng thứ nhất là thất bại tường minh: khi không lấy được một phần bắt buộc thì trả về mã trạng thái lỗi — vì hợp đồng API không cho thêm trường nên trạng thái lỗi phải diễn đạt bằng mã trạng thái chứ không bằng nội dung. Hướng thứ hai là hạ cấp có chủ ý: chấp nhận trả thiếu nhưng chỉ với những phần được khai là **tuỳ chọn**, và phần bắt buộc thì thất bại. Phần khó nhất và cũng là phần tôi sẽ làm trước khi sửa mã: nói với đội hạ nguồn. Họ đã dựng logic bù trên một hành vi mà không ai thiết kế và không ai ghi vào hợp đồng, nên bất kỳ cách sửa nào cũng phá thứ họ đang xây. Sửa âm thầm rồi để họ vỡ là cách chắc chắn nhất để đổi một sự cố dữ liệu thành hai sự cố. Nên thứ tự của tôi là: bật quan sát ngay, mang số liệu cho chủ sở hữu API quyết, thống nhất với đội hạ nguồn về hành vi mới và thời điểm, rồi mới đổi mã.",
    redFlags: [
      "Xoá `exceptionally` để ngoại lệ thoát ra mà không báo trước cho đội hạ nguồn",
      "Coi đây là quyết định kỹ thuật thuần và tự chọn hành vi mới",
      "Thêm trường trạng thái vào response — hợp đồng API đã cấm",
      "Giữ nguyên vì \"đội hạ nguồn đã thích ứng được\", để nguyên việc gộp hai trạng thái",
      "Sửa mã trước rồi mới thông báo",
    ],
    probes: [
      "Bạn phân biệt \"không có dữ liệu\" với \"không lấy được dữ liệu\" trong response thế nào khi không thêm được trường?",
      "Số liệu nào bạn cần trước khi đề xuất hướng sửa?",
      "Nếu đội hạ nguồn từ chối đổi thì bạn làm gì?",
    ],
    refs: ["mjia-16"],
  },

  // ===== mj-functional — Tư duy hàm và kỹ thuật FP (mjia-iq21–mjia-iq24) =====
  {
    id: "mjia-iq21",
    field: "modern-java",
    topic: "mj-functional",
    level: 1,
    minutes: 5,
    question: "\"Hàm thuần khiết\" và \"không có tác dụng phụ\" nghĩa là gì trong thực hành Java? Vì sao điều đó lại quan trọng khi ta song song hoá?",
    mustCover: [
      "Hàm thuần khiết: cùng đầu vào luôn cho cùng đầu ra, và **không thay đổi** state quan sát được ở bên ngoài",
      "Tác dụng phụ gồm: sửa field, sửa cấu trúc dữ liệu do người gọi truyền vào, ghi ra I/O, ném ngoại lệ như một cơ chế điều khiển",
      "Một hàm đọc state khả biến bên ngoài cũng **không** thuần khiết dù nó không ghi gì",
      "Quan trọng khi song song vì hàm thuần khiết **không cần đồng bộ hoá**: không có state dùng chung thì không có tranh chấp",
      "Nó cũng làm mã **kiểm thử được** mà không cần dựng ngữ cảnh, và **suy luận được** cục bộ",
      "Trong Java thì đây là kỷ luật, không phải bảo đảm của ngôn ngữ — nên phải giữ bằng quy ước và review",
    ],
    model: "Một hàm thuần khiết là hàm mà cùng một đầu vào luôn cho cùng một đầu ra, và không làm thay đổi state nào quan sát được từ bên ngoài. Trong Java thì tác dụng phụ có nhiều dạng hơn người ta thường nghĩ: sửa một field của object, sửa một cấu trúc dữ liệu mà người gọi truyền vào, ghi ra tệp hay gửi một request, và cả việc dùng ngoại lệ như một cơ chế điều khiển luồng. Một dạng dễ bỏ qua: hàm chỉ **đọc** một state khả biến bên ngoài cũng đã không thuần khiết, vì cùng đầu vào có thể cho hai kết quả khác nhau ở hai thời điểm — nó vẫn đủ để làm mất tính suy luận được, dù nó không phá gì. Vì sao điều này quan trọng khi song song hoá? Vì nút thắt của lập trình đồng thời là state dùng chung có thể thay đổi, và hàm thuần khiết loại bỏ chính điều kiện đó. Nếu một phép biến đổi không đọc và không ghi state dùng chung thì hai luồng chạy nó đồng thời không có gì để tranh, nên không cần khoá, không cần suy nghĩ về thứ tự, và không có lớp lỗi chỉ xuất hiện dưới tải. Đó cũng là lý do stream đặt điều kiện rằng lambda truyền vào không được có tác dụng phụ: cả việc gộp các bước lại thành một lần đi qua và việc song song hoá đều dựa trên giả định ấy, và vi phạm nó cho ra những lỗi chỉ lộ ra rất muộn. Hai lợi ích còn lại thuộc về đời sống hàng ngày: hàm thuần khiết kiểm thử được mà không cần dựng ngữ cảnh hay mock gì, và đọc được cục bộ — muốn hiểu nó làm gì thì chỉ cần đọc nó, không phải đi tìm xem ai đã đổi cái gì ở đâu. Cần nói rõ một điều: Java không bảo đảm tính thuần khiết, nên đây là kỷ luật phải giữ bằng quy ước và review chứ không phải thứ trình biên dịch ép được.",
    redFlags: [
      "Định nghĩa thuần khiết chỉ là \"không sửa gì\", bỏ qua yêu cầu cùng đầu vào cho cùng đầu ra",
      "Không nhận ra việc chỉ đọc state khả biến bên ngoài cũng phá tính thuần khiết",
      "Nói Java ép được tính thuần khiết",
    ],
    probes: [
      "Một hàm chỉ đọc một biến static khả biến — nó thuần khiết không?",
      "Vì sao stream đòi lambda không có tác dụng phụ?",
      "Bạn giữ kỷ luật này trong một đội bằng cách nào?",
    ],
    refs: ["mjia-18", "mjia-19"],
  },
  {
    id: "mjia-iq22",
    field: "modern-java",
    topic: "mj-functional",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `// Một "cây danh mục" bất biến, thêm node mới
public class Tree {
    private final String key;
    private final int value;
    private final Tree left, right;
    // constructor, getter...
}

// Đội viết hàm update như sau và gọi nó là "persistent data structure":
public static Tree update(Tree t, String k, int newVal) {
    if (t == null) return new Tree(k, newVal, null, null);
    if (k.compareTo(t.getKey()) < 0)
        t.left = update(t.getLeft(), k, newVal);       // (!) gán vào field
    else if (k.compareTo(t.getKey()) > 0)
        t.right = update(t.getRight(), k, newVal);     // (!)
    else
        t.value = newVal;                              // (!)
    return t;
}`,
    },
    question: "Hàm này **không** phải persistent data structure dù các field khai `final`. Giải thích mâu thuẫn, viết lại cho đúng, và nói bản đúng tốn thêm gì.",
    mustCover: [
      "Các field khai `final` nên ba dòng gán kia **không biên dịch được** — mã và ý định đang nói hai điều khác nhau",
      "Kể cả bỏ `final` để nó biên dịch, hàm vẫn **sửa cây cũ**, nên mọi ai đang giữ tham chiếu tới cây cũ sẽ thấy nó đổi",
      "Persistent nghĩa là phiên bản cũ **vẫn dùng được nguyên vẹn** sau khi tạo phiên bản mới",
      "Bản đúng **tạo node mới** dọc đường đi và **dùng lại** các nhánh không bị ảnh hưởng",
      "Chi phí thêm là số node mới bằng **độ sâu** đường đi, không phải bằng kích thước cây",
      "Đổi lại: chia sẻ cây giữa nhiều luồng an toàn không cần khoá, và có sẵn lịch sử phiên bản",
    ],
    model: "Mâu thuẫn hiện ra ngay ở tầng biên dịch: các field khai `final` nên ba dòng gán kia không thể biên dịch. Điều đó nói lên chuyện đáng nói hơn bản thân lỗi cú pháp — mã đang tuyên bố bất biến qua từ khoá `final`, còn thuật toán thì viết theo lối sửa tại chỗ, và người viết chưa nhận ra hai thứ đó loại trừ nhau. Giả sử ai đó bỏ `final` để nó chạy được, hàm vẫn không phải persistent, vì nó **sửa cây cũ**: mọi thành phần đang giữ tham chiếu tới cây trước khi cập nhật sẽ đột nhiên thấy nó đổi, và nếu một luồng khác đang duyệt cây thì nó duyệt một cấu trúc đang bị thay đổi dưới chân. Persistent data structure có nghĩa chính xác là: sau khi tạo phiên bản mới, phiên bản cũ vẫn dùng được nguyên vẹn. Bản viết lại giữ nguyên chữ ký nhưng đổi thuật toán: thay vì gán vào `t.left`, nó trả về một `Tree` **mới** với nhánh trái là kết quả đệ quy và nhánh phải **dùng lại y nguyên** nhánh phải cũ — và ngược lại. Với nhánh không nằm trên đường đi tới khoá cần cập nhật, ta không sao chép gì cả, chỉ chia sẻ tham chiếu, và điều đó an toàn chính vì cấu trúc là bất biến. Nên chi phí thêm không phải là sao chép cả cây như trực giác lo: số node mới bằng độ sâu đường đi, tức với cây cân bằng thì là logarit của số phần tử. Đổi lại ta được hai thứ đáng giá: cây chia sẻ được giữa nhiều luồng mà không cần khoá và không cần bản sao phòng ngừa, và mọi phiên bản cũ vẫn còn dùng được nên ta có sẵn lịch sử — thứ mà một cấu trúc sửa tại chỗ phải tự dựng thêm mới có. Cái giá thật cần nói ra là áp lực cấp phát: mỗi lần cập nhật sinh ra node mới, nên với tần suất ghi rất cao thì phải đo chứ không giả định nó miễn phí.",
    redFlags: [
      "Bỏ `final` để mã biên dịch được rồi coi là đã xong",
      "Sao chép toàn bộ cây mỗi lần cập nhật, cho rằng đó là cái giá của bất biến",
      "Nói bất biến luôn tốn nhiều bộ nhớ hơn mà không nhắc việc chia sẻ nhánh",
      "Không nêu được định nghĩa của persistent là phiên bản cũ vẫn dùng được",
    ],
    probes: [
      "Với cây 1 triệu node cân bằng, một lần cập nhật tạo bao nhiêu node mới?",
      "Vì sao chia sẻ nhánh lại an toàn ở đây mà không an toàn với cấu trúc khả biến?",
      "Áp lực cấp phát tăng lên — bạn đo và xử lý thế nào?",
    ],
    refs: ["mjia-19"],
  },
  {
    id: "mjia-iq23",
    field: "modern-java",
    topic: "mj-functional",
    level: 3,
    minutes: 10,
    question: "Đội bạn muốn viết theo lối hàm nhiều hơn. Bạn áp dụng tới đâu trong một codebase Java nghiệp vụ?",
    tradeoffs: [
      {
        option: "Bất biến ở tầng **mô hình dữ liệu** và hàm thuần khiết cho **logic nghiệp vụ**",
        when: "Áp dụng rộng, và là nơi lợi ích rõ nhất: mã kiểm thử được không cần mock, suy luận được cục bộ, chia sẻ giữa luồng không cần khoá. Cái giá thấp và trả một lần.",
      },
      {
        option: "Tách **phần thuần khiết** khỏi **phần có tác dụng phụ** ở biên",
        when: "Nguyên tắc tổ chức tôi ưu tiên nhất: đọc và ghi nằm ở biên, phần quyết định nằm ở giữa và thuần khiết. Nó cho phần lớn lợi ích của FP mà không đòi đổi phong cách toàn bộ mã.",
      },
      {
        option: "Kỹ thuật FP nâng cao — hàm bậc cao mọi nơi, currying, lazy, pattern matching tự dựng",
        when: "Rất chọn lọc. Trong một codebase Java nghiệp vụ, phần lớn chúng làm mã khó đọc với người mới và khó debug, mà lợi ích thường không tương xứng. Dùng khi bài toán **thật sự** có hình dạng đó.",
      },
    ],
    mustCover: [
      "Lợi ích lớn nhất của FP ở đây không phải cú pháp mà là **bất biến** cộng **hàm thuần khiết**",
      "Nguyên tắc tổ chức hiệu quả nhất: đẩy tác dụng phụ ra **biên**, giữ phần giữa thuần khiết",
      "Tiêu chí quyết định là **khả năng đọc của đội**, không phải mức độ \"hàm\" của mã",
      "Kỹ thuật nâng cao có chi phí thật: người mới đọc chậm hơn, debug khó hơn, stack trace mất nghĩa",
      "Java **không** ép tính thuần khiết, nên áp dụng nửa vời cho ra codebase có hai phong cách trộn lẫn — tệ hơn cả hai",
      "Nhất quán quan trọng hơn thuần khiết: chọn một mức rồi áp đều, đừng để mỗi module một kiểu",
    ],
    model: "Tôi tách phần có lợi ích rõ ràng khỏi phần chủ yếu là phong cách. Phần có lợi ích rõ ràng là bất biến ở tầng mô hình dữ liệu và hàm thuần khiết cho logic nghiệp vụ — và lợi ích của nó cụ thể, đo được: logic kiểm thử được mà không cần dựng mock, đọc một hàm là hiểu nó làm gì mà không phải đi tìm ai đã đổi cái gì, và object chia sẻ được giữa các luồng mà không cần khoá cũng không cần bản sao phòng ngừa. Cái giá thấp và trả một lần khi thiết kế. Nguyên tắc tổ chức tôi ưu tiên nhất, vì nó cho phần lớn lợi ích với ít xáo trộn nhất, là đẩy tác dụng phụ ra biên: đọc dữ liệu ở đầu, ghi dữ liệu ở cuối, còn phần quyết định ở giữa là hàm thuần khiết nhận vào dữ liệu và trả ra quyết định. Khi đó phần khó nhất của nghiệp vụ trở thành phần dễ kiểm thử nhất, và ta không cần đổi phong cách của toàn bộ mã. Phần tôi rất chọn lọc là các kỹ thuật FP nâng cao — hàm bậc cao ở mọi nơi, currying, lazy evaluation, pattern matching tự dựng. Chúng không sai, nhưng trong một codebase Java nghiệp vụ mà đội có người mới vào, chi phí là thật: đọc chậm hơn, debug khó hơn, stack trace mất nghĩa, và người sửa lỗi lúc hai giờ sáng phải giải mã ba tầng gián tiếp trước khi tới được logic. Tôi dùng chúng khi bài toán thật sự có hình dạng đó, không dùng vì chúng đẹp. Tiêu chí cuối mà tôi coi là quan trọng hơn mọi tiêu chí trên: **nhất quán**. Java không ép tính thuần khiết, nên áp dụng nửa vời cho ra một codebase mà mỗi module một phong cách, và đọc nó tốn hơn cả hai phong cách thuần — người đọc phải đoán xem đoạn này chơi theo luật nào. Nên tôi thà chọn một mức vừa phải rồi áp đều, còn hơn chọn mức cao rồi chỉ đạt ở một phần ba codebase.",
    redFlags: [
      "Đẩy mọi thứ sang lối hàm rồi coi khả năng đọc là vấn đề của người đọc",
      "Giữ tác dụng phụ rải rác ở giữa logic rồi gọi đó là \"thực dụng\"",
      "Áp dụng nửa vời và để hai phong cách trộn lẫn",
      "Đánh giá thành công bằng mức độ \"hàm\" của mã thay vì bằng khả năng đọc và kiểm thử",
    ],
    probes: [
      "Cho một ví dụ tách phần thuần khiết khỏi biên trong một luồng nghiệp vụ thật",
      "Bạn thuyết phục một đội chưa quen FP bằng lập luận nào?",
      "Khi nào lazy evaluation đáng dùng trong mã nghiệp vụ?",
    ],
    refs: ["mjia-18", "mjia-19"],
  },
  {
    id: "mjia-iq24",
    field: "modern-java",
    topic: "mj-functional",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ tính giá cho ra kết quả khác nhau giữa hai lần gọi cùng tham số, tỉ lệ khoảng 1/5.000. Logic tính giá là một chuỗi hàm biến đổi trông rất \"hàm\": không có vòng lặp, không gán biến, toàn `map` và `reduce`. Nhưng một trong các hàm đọc một `Map` cấu hình static được một job nền nạp lại mỗi 5 phút.",
      scale: "45.000 lần tính giá mỗi giờ. Sai lệch nhỏ nhưng đủ để hai hệ thống đối soát lệch nhau, và một khách hàng doanh nghiệp đã gửi khiếu nại chính thức.",
      constraints: "Không bỏ được việc nạp lại cấu hình — giá phải cập nhật trong vòng 5 phút theo yêu cầu nghiệp vụ. Không đổi được chữ ký hàm tính giá vì 4 chỗ gọi. Phải bảo đảm một lần tính giá cho ra kết quả tái lập được, kể cả khi đối soát lại sau nhiều tháng.",
      },
    question: "Mã trông rất \"hàm\" mà vẫn không tất định. Chỉ ra vì sao, và nêu cách sửa thoả cả ba ràng buộc.",
    mustCover: [
      "Chuỗi `map` và `reduce` **không** làm một hàm thuần khiết — nó chỉ làm mã trông theo lối hàm",
      "Phụ thuộc vào cấu hình đang là **phụ thuộc ẩn**: nó không có trong chữ ký nên không ai ở chỗ gọi biết phép tính này phụ thuộc thời điểm",
      "Cùng đầu vào cho hai kết quả khác nhau ở hai thời điểm — mất tính tất định, đúng định nghĩa",
      "Tỉ lệ 1/5.000 đo được chính là **độ rộng cửa sổ nạp lại** chia cho khoảng 5 phút — một con số suy ra được, không phải nhiễu",
      "Nó còn có thể tệ hơn: nếu `Map` bị nạp lại **tại chỗ** thì một lần tính giá đọc được **hai** phiên bản cấu hình",
      "Sửa: biến cấu hình thành **đầu vào tường minh** của phép tính, và chụp nó **một lần** ở đầu mỗi lần tính",
      "Thay cấu hình bằng một object **bất biến** đặt sau một tham chiếu đổi nguyên khối, nên không bao giờ đọc được nửa cũ nửa mới",
      "Để tái lập được sau nhiều tháng, phải **lưu lại phiên bản cấu hình** đã dùng cùng kết quả",
    ],
    model: "Điểm cần nói trước tiên là một nhận định về bản chất: viết bằng `map` và `reduce` không làm hàm trở nên thuần khiết. Tính thuần khiết là thuộc tính về quan hệ giữa đầu vào và đầu ra cùng việc không chạm state ngoài, không phải thuộc tính của cú pháp. Ở đây một hàm trong chuỗi đọc một `Map` static mà job nền nạp lại mỗi 5 phút, nên cùng một đầu vào cho hai kết quả khác nhau ở hai thời điểm — mất tính tất định đúng theo định nghĩa, dù mã không có vòng lặp nào và không gán biến nào. Tỉ lệ 1/5.000 cũng khớp và nên được đọc là bằng chứng chứ không phải là lý do bỏ qua: nó tương ứng với cửa sổ hẹp quanh thời điểm nạp lại, không phải lỗi ngẫu nhiên. Còn một khả năng tệ hơn phải kiểm ngay: nếu job nền nạp lại bằng cách sửa `Map` **tại chỗ** thì một lần tính giá đọc `Map` nhiều lần có thể đọc được hai phiên bản cấu hình khác nhau trong cùng một phép tính — cho ra một con số không ứng với bất kỳ cấu hình nào từng tồn tại, và đó là loại sai không thể giải thích được cho khách hàng. Cách sửa đi theo ba bước, và cả ba nằm trong ràng buộc. Bước một, biến cấu hình từ một phụ thuộc ẩn thành **đầu vào tường minh** của phép tính: chụp nó đúng một lần ở đầu mỗi lần tính rồi truyền xuống dọc chuỗi. Chữ ký công khai của hàm tính giá không phải đổi vì việc chụp nằm trong thân nó — bốn chỗ gọi không bị ảnh hưởng. Riêng bước này đã khử được cả hai vấn đề: phép tính trở nên tất định với ảnh cấu hình đã chụp, và không còn đọc được nửa cũ nửa mới. Bước hai, đổi cấu hình thành một object bất biến đặt sau một tham chiếu, và job nền thay cả object thay vì sửa tại chỗ — nên yêu cầu cập nhật trong 5 phút vẫn nguyên, chỉ khác là mỗi lần đổi là đổi nguyên khối. Bước ba trả lời ràng buộc khó nhất, việc đối soát lại sau nhiều tháng: tất định với một ảnh cấu hình là chưa đủ nếu ta không biết ảnh nào đã được dùng, nên phải gán phiên bản cho cấu hình và **lưu phiên bản đó cùng kết quả**. Khi ấy tính lại một báo giá của sáu tháng trước cho ra đúng con số cũ, và đó mới là điều khách hàng doanh nghiệp thật sự đang đòi.",
    redFlags: [
      "Kết luận mã đã \"hàm\" nên lỗi phải nằm ở chỗ khác",
      "Đổi `Map` sang `ConcurrentHashMap` rồi coi là xong — hết hỏng cấu trúc nhưng vẫn không tất định",
      "Giảm tần suất nạp lại để \"giảm xác suất\" — vi phạm yêu cầu 5 phút và không sửa gốc",
      "Sửa tính tất định nhưng không lưu phiên bản cấu hình, nên vẫn không đối soát lại được",
      "Coi 1/5.000 là trong ngưỡng chấp nhận",
    ],
    probes: [
      "Vì sao chụp cấu hình một lần ở đầu phép tính lại đủ để khử cả hai vấn đề?",
      "Làm sao bạn biết job nền đang sửa tại chỗ hay thay cả object?",
      "Bạn cần lưu gì để tính lại một báo giá sáu tháng trước ra đúng con số cũ?",
    ],
    refs: ["mjia-18", "mjia-19"],
  },
];
