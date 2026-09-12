// Ngân hàng câu hỏi phỏng vấn Spring Start Here — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Spring Start Here (Laurenţiu Spilcă, Manning 2021).
//
// LƯU Ý: đây là sách nhập môn, nên câu L3/L4 được neo vào những đánh đổi và
// sự cố mà chính sách bàn tới — bean scope, tính bất biến của singleton,
// ranh giới transaction — chứ không kéo sang nội dung ngoài phạm vi sách.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA.
//
// GIỮ NGUYÊN id (springstart-iq01–springstart-iq24).

export const springStartInterview = [
  // ===== ss-context (springstart-iq01–springstart-iq04) =====
  {
    id: "springstart-iq01",
    field: "spring-start",
    topic: "ss-context",
    level: 1,
    minutes: 5,
    question: "Spring context là gì, và vì sao sách nói dependency injection qua constructor là thực hành được ưu tiên hơn inject qua field?",
    mustCover: [
      "Spring context là nơi chứa các object mà framework quản lý — thêm một object vào context thì Spring biết nó và tiêm được nó vào nơi khác",
      "Ưu điểm thứ nhất của constructor injection: nó cho phép làm instance **bất biến**, vì các field khai được là `final`",
      "Ưu điểm thứ hai: phụ thuộc hiện ra trong **chữ ký constructor**, nên không thể tạo object ở trạng thái thiếu phụ thuộc",
      "Inject qua field thì object tồn tại một khoảng ở trạng thái **chưa đủ phụ thuộc**, và phụ thuộc bị ẩn",
      "Tính bất biến quan trọng vì phần lớn bean là **singleton**, và singleton được nhiều thread chia sẻ",
      "Nên constructor injection không chỉ là chuyện phong cách — nó là điều kiện để singleton an toàn",
    ],
    model: "Spring context là nơi chứa những object mà framework quản lý vòng đời. Ý nghĩa thực hành rất đơn giản: nếu một object không nằm trong context thì Spring không biết nó tồn tại, nên nó không tiêm được object đó vào đâu và cũng không áp được các tính năng của framework lên nó. Còn về constructor injection, sách nêu lý do mà tôi thấy là lý do đúng và nó không phải chuyện phong cách. Ưu điểm thứ nhất là nó cho phép làm instance bất biến: khi phụ thuộc được truyền qua constructor thì các field mang chúng khai được là `final`, và từ đó object không đổi state sau khi tạo. Ưu điểm thứ hai là phụ thuộc hiện ra trong chữ ký constructor, nên không có cách nào tạo object ở trạng thái thiếu phụ thuộc — nếu thiếu thì mã không biên dịch. Inject qua field thì ngược cả hai: object được tạo trước rồi framework gán phụ thuộc sau, nên tồn tại một khoảng nó ở trạng thái chưa đủ phụ thuộc và nếu ai đó tạo nó bằng `new` trong một bài kiểm thì nó sẽ ném lỗi con trỏ rỗng; và phụ thuộc bị ẩn, chỉ hiện ra khi đọc hết thân class. Điều nối hai ưu điểm đó với một chuyện lớn hơn — và là lý do tôi coi đây không phải chuyện thẩm mỹ — là phần lớn bean trong Spring là **singleton**: một instance duy nhất được nhiều thành phần chia sẻ, và trong một ứng dụng web thì nhiều thread cùng dùng nó. Sách nói rõ điều quan trọng nhất cần cân nhắc với singleton là nó phải bất biến, vì nếu nhiều thread cùng thay đổi một instance dùng chung thì ta rơi vào race condition. Nên constructor injection là công cụ giúp đạt được tính bất biến ấy, tức nó là điều kiện để mô hình singleton an toàn chứ không phải một lựa chọn viết mã.",
    redFlags: [
      "Nói constructor injection tốt hơn chỉ vì \"dễ kiểm thử hơn\"",
      "Không nối được tính bất biến với việc bean là singleton dùng chung giữa các thread",
      "Coi context chỉ là một cái map chứa object",
    ],
    probes: [
      "Bạn viết một bài kiểm cho class dùng field injection thế nào?",
      "Vì sao `final` lại quan trọng ở đây?",
      "Có trường hợp nào bạn vẫn dùng setter injection?",
    ],
    refs: ["springstart-02", "springstart-03"],
  },
  {
    id: "springstart-iq02",
    field: "spring-start",
    topic: "ss-context",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `@Service
public class CommentService {
    @Autowired                      // (1) field injection
    private CommentRepository repo;

    private int processedCount = 0; // (2) state khả biến

    public void process(Comment c) {
        repo.save(c);
        processedCount++;           // (3)
    }

    public int getProcessedCount() { return processedCount; }
}

// Trong một ứng dụng web, sau một đợt tải:
// getProcessedCount() trả về 9.847 trong khi repo đã lưu 10.000 comment.`,
    },
    question: "Giải thích vì sao con số bị thiếu, rồi viết lại class này. Nói rõ lỗi ở dòng (1) khác bản chất với lỗi ở dòng (2).",
    mustCover: [
      "`CommentService` là bean **singleton**, nên một instance duy nhất được mọi thread dùng",
      "`processedCount++` là **đọc–sửa–ghi**, ba thao tác riêng, nên hai thread có thể đọc cùng giá trị rồi ghi cùng kết quả",
      "Đó là **race condition** trên state dùng chung — mất khoảng 1,5% lần tăng khớp với con số 9.847",
      "Lỗi dòng (2) là lỗi **thiết kế**: singleton bean không nên có state khả biến",
      "Sách nói thẳng: nếu một object là bean thì nó chỉ nên là singleton khi nó **bất biến**",
      "Đồng bộ hoá được về mặt kỹ thuật nhưng **không phải thực hành tốt** — nó ảnh hưởng nghiêm trọng tới hiệu năng",
      "Lỗi dòng (1) khác bản chất: field injection không gây race condition, nó làm mất tính bất biến và ẩn phụ thuộc",
      "Bản viết lại: constructor injection với field `final`, và bỏ `processedCount` khỏi bean — đưa nó ra một thành phần đếm chuyên dụng",
    ],
    model: "Con số bị thiếu vì `processedCount++` là một chuỗi đọc–sửa–ghi trên state dùng chung. `CommentService` là bean singleton, nên chỉ có một instance và mọi thread xử lý request đều dùng nó; khi hai thread cùng chạy `processedCount++`, cả hai có thể đọc giá trị 500, cả hai tính 501, và cả hai ghi 501 — một lần tăng biến mất. Đây đúng là race condition mà sách cảnh báo về singleton: nhiều thread chia sẻ cùng một instance, và nếu chúng thay đổi instance đó thì kết quả không mong đợi. Mất khoảng 1,5% lần tăng là con số hoàn toàn hợp lý với mức tranh chấp của một đợt tải. Hai lỗi trong mã này khác bản chất và tôi muốn tách rõ. Dòng (2) là lỗi thiết kế và là nguyên nhân trực tiếp: một singleton bean không nên có state khả biến. Sách đưa ra nguyên tắc rất dứt khoát — nếu một object cần là bean thì nó chỉ nên là singleton khi nó bất biến, và hãy tránh thiết kế singleton bean khả biến. Có người sẽ đề nghị đồng bộ hoá, và về mặt kỹ thuật thì được, nhưng sách nói rõ đó không phải thực hành tốt: singleton bean không được thiết kế để đồng bộ hoá, chúng dùng để định nghĩa bộ xương của ứng dụng và ủy quyền trách nhiệm cho nhau, còn đồng bộ hoá trên một instance dùng chung có thể ảnh hưởng nghiêm trọng tới hiệu năng — và trong hầu hết trường hợp ta tìm được cách khác để giải cùng vấn đề. Dòng (1) thì không gây race condition; nó là một lỗi khác: field injection làm mất khả năng khai field là `final`, tức mất chính công cụ giúp đạt tính bất biến, và nó ẩn phụ thuộc khỏi chữ ký. Nên bản viết lại làm hai việc: chuyển sang constructor injection với `repo` khai `final`, và bỏ `processedCount` ra khỏi bean — nếu ứng dụng thật sự cần đếm thì đó là việc của một thành phần đếm chuyên dụng dùng biến atomic, hoặc của hệ thống đo lường, chứ không phải một field trong service.",
    redFlags: [
      "Thêm `synchronized` vào `process` và coi là đã sửa",
      "Đổi `int` sang `AtomicInteger` mà giữ nguyên state trong singleton — đúng về số nhưng bỏ qua nguyên tắc thiết kế",
      "Gộp hai lỗi thành một",
      "Đổi bean sang prototype scope để tránh dùng chung — khi đó mỗi lần tiêm một instance nên bộ đếm vô nghĩa",
    ],
    probes: [
      "Vì sao sách nói đồng bộ hoá singleton không phải thực hành tốt?",
      "Nếu thật sự cần một bộ đếm thì bạn đặt nó ở đâu?",
      "Đổi sang prototype scope thì chuyện gì xảy ra với bộ đếm?",
    ],
    refs: ["springstart-05", "springstart-03"],
  },
  {
    id: "springstart-iq03",
    field: "spring-start",
    topic: "ss-context",
    level: 3,
    minutes: 9,
    question: "Bạn có hai implementation của cùng một interface trong context. Spring sẽ báo lỗi không biết chọn cái nào. Bạn giải quyết thế nào?",
    tradeoffs: [
      {
        option: "Đánh dấu một cái là lựa chọn **mặc định**",
        when: "Khi thật sự có một implementation là mặc định hợp lý và cái kia là ngoại lệ. Gọn nhất, và chỗ gọi không phải biết gì. Rủi ro: khi thêm implementation thứ ba, mặc định cũ có thể không còn đúng mà không ai xét lại.",
      },
      {
        option: "Đặt **tên** và chọn tường minh ở nơi tiêm",
        when: "Khi cả hai đều là lựa chọn hợp lệ và việc chọn phụ thuộc ngữ cảnh dùng. Rõ ràng nhất về ý định: đọc chỗ tiêm là biết đang dùng cái nào. Đổi lại là mỗi chỗ tiêm phải khai.",
      },
      {
        option: "Tiêm **cả danh sách** rồi chọn lúc chạy",
        when: "Khi việc chọn phụ thuộc dữ liệu — chọn theo loại thanh toán, theo quốc gia. Đây thực ra không phải bài toán wiring mà là một mẫu hình chiến lược, và Spring chỉ cung cấp danh sách.",
      },
    ],
    mustCover: [
      "Trước khi chọn kỹ thuật, phải hỏi: hai cái này là **hai lựa chọn cấu hình** hay **hai nhánh nghiệp vụ**?",
      "Nếu là hai nhánh nghiệp vụ thì đây không phải bài toán wiring — tiêm danh sách rồi chọn theo dữ liệu mới đúng",
      "Đánh dấu mặc định che mất việc phải quyết định, nên nó lão hoá xấu khi có implementation thứ ba",
      "Chọn theo tên là rõ ràng nhất nhưng nó rải quyết định ra nhiều chỗ tiêm",
      "Dù chọn cách nào, quyết định phải **đọc được** — không để nó phụ thuộc thứ tự nạp hay tên class",
      "Dựa vào việc \"Spring tự chọn được\" là chỗ dễ vỡ nhất khi thêm implementation mới",
    ],
    model: "Tôi không bắt đầu từ kỹ thuật mà từ một câu hỏi về bản chất: hai implementation này là hai **lựa chọn cấu hình** — một cái dùng ở môi trường này, cái kia ở môi trường khác — hay là hai **nhánh nghiệp vụ** cùng tồn tại và được chọn theo dữ liệu? Trả lời sai câu này thì mọi giải pháp kỹ thuật đều lệch. Nếu là hai nhánh nghiệp vụ — xử lý thanh toán bằng thẻ và bằng chuyển khoản, chẳng hạn — thì đây không phải bài toán wiring chút nào: cả hai cùng cần tồn tại, và việc chọn xảy ra lúc chạy theo dữ liệu. Khi đó tôi tiêm cả danh sách và để một thành phần chọn theo loại, tức dùng mẫu hình chiến lược, còn Spring chỉ đóng vai cung cấp danh sách. Cố nhồi nó thành một quyết định wiring sẽ dẫn tới những giải pháp méo mó như đặt cờ cấu hình để chọn một trong hai. Nếu là hai lựa chọn cấu hình thì tôi chọn giữa hai cách còn lại theo việc có tồn tại một mặc định hợp lý hay không. Nếu có — một implementation thật, một implementation giả dùng khi phát triển — thì đánh dấu cái thật là mặc định là gọn nhất, và chỗ gọi không phải biết gì. Rủi ro tôi sẽ nêu là nó lão hoá xấu: khi ai đó thêm implementation thứ ba, mặc định cũ vẫn được chọn âm thầm dù nó có thể không còn đúng, và không có gì buộc người thêm phải xét lại. Nếu cả hai đều là lựa chọn hợp lệ tuỳ ngữ cảnh thì tôi đặt tên và chọn tường minh ở nơi tiêm, vì đọc chỗ tiêm là biết ngay đang dùng cái nào — cái giá là mỗi chỗ tiêm phải khai, nhưng tôi coi đó là cái giá đáng trả cho tính rõ ràng. Nguyên tắc xuyên suốt: quyết định phải đọc được từ mã, và tuyệt đối không để nó phụ thuộc vào thứ tự nạp bean hay vào tên class — vì đó là những thứ đổi mà không ai coi là thay đổi hành vi.",
    redFlags: [
      "Chọn kỹ thuật ngay mà không hỏi hai implementation là cấu hình hay nghiệp vụ",
      "Dùng cờ cấu hình để chọn giữa hai nhánh nghiệp vụ",
      "Dựa vào việc Spring tự phân giải được nhờ tên biến trùng tên bean",
      "Không nêu rủi ro lão hoá của lựa chọn mặc định",
    ],
    probes: [
      "Cho một ca mà hai implementation là nghiệp vụ chứ không phải cấu hình",
      "Thêm implementation thứ ba thì cách của bạn hành xử thế nào?",
      "Vì sao dựa vào tên biến để phân giải là chỗ dễ vỡ?",
    ],
    refs: ["springstart-03", "springstart-04"],
  },
  {
    id: "springstart-iq04",
    field: "spring-start",
    topic: "ss-context",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một ứng dụng web trả về dữ liệu của **người dùng khác** cho khoảng 1 trên 3.000 request. Lỗi chỉ xảy ra khi có tải. Class gây lỗi là một `@Service` singleton có một field lưu người dùng hiện tại, được đặt ở đầu mỗi lần xử lý rồi đọc ở các phương thức sau.",
      scale: "4.000 request/giây ở giờ cao điểm. 1 trên 3.000 là khoảng 1,3 request mỗi giây trả sai dữ liệu. Đã chạy 5 tháng; một khách hàng phát hiện khi thấy tên người khác trên màn hình của mình.",
      constraints: "Không đổi được chữ ký các phương thức public của service — 9 controller đang gọi. Phải chặn về mặt **cấu trúc**, không chỉ sửa một class. Phải xác định phạm vi ảnh hưởng để thông báo.",
      },
    question: "Đây là lỗi bảo mật hay lỗi đồng thời? Nêu chẩn đoán, cách chặn về cấu trúc trong ràng buộc không đổi chữ ký, và cách xác định phạm vi.",
    mustCover: [
      "Nó là **cả hai**: cơ chế là race condition, hậu quả là rò rỉ dữ liệu giữa người dùng — nên phải xử lý theo mức bảo mật",
      "Bean là singleton nên một instance duy nhất dùng chung; field \"người dùng hiện tại\" là **state khả biến** trên instance đó",
      "Thread A đặt người dùng, thread B ghi đè, rồi thread A đọc và thấy người dùng của B",
      "Tần suất thấp vì cửa sổ giữa lúc đặt và lúc đọc rất hẹp — nên nó chỉ lộ ra khi có tải",
      "Đây đúng là điều sách cảnh báo: singleton bean **không nên** có state khả biến",
      "Chặn về cấu trúc mà không đổi chữ ký public: bỏ field, truyền người dùng **qua tham số nội bộ** giữa các phương thức private",
      "Hoặc nếu chuỗi lời gọi quá sâu thì dùng một bean **request scope** giữ ngữ cảnh, không phải field trên singleton",
      "Xác định phạm vi: không dựa vào log mà đối soát dữ liệu — tìm bản ghi truy cập có người dùng không khớp phiên",
    ],
    model: "Câu hỏi \"bảo mật hay đồng thời\" có câu trả lời là cả hai, và cách phân loại quyết định mức ưu tiên: cơ chế gây lỗi là một race condition, nhưng hậu quả là dữ liệu của một người dùng bị trả cho người dùng khác — đó là rò rỉ dữ liệu, nên nó phải được xử lý theo quy trình sự cố bảo mật chứ không phải theo quy trình lỗi thường. Cơ chế thì rất gọn: `@Service` mặc định là singleton, nên chỉ có một instance và mọi thread xử lý request đều dùng nó. Một field lưu \"người dùng hiện tại\" trên instance đó là state khả biến dùng chung. Thread A đặt người dùng của nó, thread B ghi đè bằng người dùng của nó, rồi thread A đọc field và nhận người dùng của B. Tần suất 1 trên 3.000 khớp với việc cửa sổ giữa lúc đặt và lúc đọc rất hẹp — đó cũng là lý do nó chỉ lộ ra khi có tải và không bao giờ tái hiện trên máy phát triển. Đây đúng là hình dạng mà sách cảnh báo khi nói về singleton: nhiều thread chia sẻ một instance, và nếu chúng thay đổi instance thì rơi vào race condition; nguyên tắc sách đưa ra là singleton chỉ nên dùng cho object bất biến. Về cách chặn trong ràng buộc không đổi chữ ký public: ràng buộc đó không cản gì, vì thay đổi cần làm nằm **bên trong** service. Tôi bỏ hẳn field và truyền người dùng như một tham số giữa các phương thức nội bộ — các phương thức private có thể đổi chữ ký tuỳ ý, còn chín controller vẫn gọi đúng những phương thức public như cũ. Khi đó không còn state dùng chung nào, nên lỗi không phải được sửa mà là **không thể xảy ra**. Nếu chuỗi lời gọi quá sâu để truyền tham số cho tiện thì lựa chọn thứ hai là một bean request scope giữ ngữ cảnh — Spring tạo một instance cho mỗi request nên nó đúng phạm vi, khác hẳn một field trên singleton. Điều tôi muốn nhấn là cả hai cách đều mang tính cấu trúc: chúng loại bỏ điều kiện gây lỗi, thay vì thêm đồng bộ hoá — mà sách cũng nói đồng bộ hoá singleton không phải thực hành tốt. Về phạm vi ảnh hưởng, tôi không dùng log vì log không ghi lại việc dữ liệu nào đã hiển thị cho ai; tôi đối soát dữ liệu — tìm trong bản ghi truy cập những trường hợp mà người dùng của dữ liệu trả về không khớp với người dùng của phiên, và với 5 tháng thì tập đó cần được rà theo lô rồi báo cáo cho đội bảo mật.",
    redFlags: [
      "Xếp nó là lỗi đồng thời thường và xử lý theo quy trình lỗi bình thường",
      "Thêm `synchronized` quanh các phương thức — đúng về số nhưng giữ nguyên state dùng chung và phá hiệu năng",
      "Đổi bean sang prototype scope, không nhận ra nó vẫn được tiêm một lần vào controller singleton",
      "Đòi đổi chữ ký public — ràng buộc đã cấm và không cần thiết",
      "Dùng log để xác định phạm vi trong khi log không ghi dữ liệu đã hiển thị",
    ],
    probes: [
      "Vì sao đổi sang prototype scope không giải quyết được?",
      "Bean request scope khác field trên singleton ở điểm nào về vòng đời?",
      "Bạn viết điều kiện đối soát để tìm các lần trả sai dữ liệu thế nào?",
    ],
    refs: ["springstart-05", "springstart-09"],
  },

  // ===== ss-scope (springstart-iq05–springstart-iq08) =====
  {
    id: "springstart-iq05",
    field: "spring-start",
    topic: "ss-scope",
    level: 1,
    minutes: 5,
    question: "So sánh singleton và prototype scope. Nêu điều kiện để dùng mỗi cái, và cái bẫy khi tiêm prototype vào singleton.",
    mustCover: [
      "**Singleton**: một instance cho mỗi tên bean trong context, được mọi nơi chia sẻ — nên nó chỉ nên **bất biến**",
      "**Prototype**: Spring tạo một instance **mới mỗi lần được yêu cầu**, nên nó dùng được cho object có state khả biến",
      "Bẫy: tiêm một prototype vào một singleton thì việc tiêm xảy ra **một lần** khi tạo singleton",
      "Nên singleton giữ mãi **cùng một** instance prototype — ta mất đúng tính chất mình chọn prototype để có",
      "Muốn lấy instance mới mỗi lần thì phải yêu cầu context cấp, chứ không tiêm một lần",
      "Nguyên tắc sách đưa ra: nếu bean cần khả biến thì prototype là một lựa chọn; còn singleton thì phải bất biến",
    ],
    model: "Singleton nghĩa là một instance cho mỗi tên bean trong context, và mọi thành phần cần nó đều nhận cùng instance đó. Hệ quả quyết định là nó được chia sẻ giữa nhiều thread trong một ứng dụng web, nên sách đưa ra nguyên tắc rất dứt khoát: một object chỉ nên là singleton nếu nó bất biến, và hãy tránh thiết kế singleton bean khả biến. Prototype thì ngược lại: mỗi lần bean được yêu cầu, Spring tạo một instance mới — nên nó là lựa chọn khi ta cần một object có state khả biến, vì mỗi bên dùng có bản riêng và không có gì để tranh. Cái bẫy quan trọng nhất nằm ở chỗ hai scope này gặp nhau. Nếu ta tiêm một bean prototype vào một bean singleton bằng cách khai nó như một phụ thuộc thông thường, thì việc tiêm xảy ra **đúng một lần** — lúc Spring tạo singleton. Từ đó trở đi, singleton giữ mãi cùng một instance prototype và dùng nó cho mọi request. Nghĩa là ta khai prototype nhưng nhận được hành vi singleton, và mất đúng tính chất mình chọn prototype để có; tệ hơn là mã đọc như thể mọi thứ đúng, nên lỗi này rất khó thấy. Cách làm đúng khi thật sự cần một instance mới mỗi lần là yêu cầu context cấp instance tại thời điểm cần, thay vì nhận nó một lần qua constructor. Nói rộng hơn, tôi coi đây là một ví dụ về nguyên tắc chung: khi hai thành phần có vòng đời khác nhau, phải rất rõ ai tạo ai và tạo lúc nào — và nếu một bên sống lâu hơn bên kia thì không thể giữ tham chiếu tới bên kia một cách đơn thuần.",
    redFlags: [
      "Nói prototype tiêm vào singleton sẽ cho instance mới mỗi lần dùng",
      "Coi prototype là cách giải quyết mọi vấn đề về state khả biến mà không xét lại thiết kế",
      "Không nêu nguyên tắc singleton phải bất biến",
    ],
    probes: [
      "Bạn lấy một instance prototype mới bên trong một singleton bằng cách nào?",
      "Vì sao \"hai vòng đời khác nhau\" là cách nhìn đúng về cái bẫy này?",
      "Spring có gọi phương thức dọn của bean prototype không?",
    ],
    refs: ["springstart-05"],
  },
  {
    id: "springstart-iq06",
    field: "spring-start",
    topic: "ss-scope",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class CommentProcessor {
    private Comment comment;                    // state khả biến, có chủ ý
    public void setComment(Comment c) { this.comment = c; }
    public void process() { /* dùng this.comment */ }
}

@Service
public class CommentService {
    private final CommentProcessor processor;   // (1) tiêm một lần

    public CommentService(CommentProcessor processor) {
        this.processor = processor;
    }

    public void handle(Comment c) {
        processor.setComment(c);                // (2)
        processor.process();
    }
}`,
    },
    question: "Tác giả khai prototype có chủ ý nhưng vẫn gặp lỗi dữ liệu lẫn giữa các request. Giải thích, rồi sửa.",
    mustCover: [
      "`CommentService` là singleton, nên constructor của nó chạy **một lần** và `processor` được tiêm **một lần**",
      "Vậy dù `CommentProcessor` khai prototype, ứng dụng chỉ có **một** instance của nó trong suốt đời sống",
      "Nên state khả biến trong `CommentProcessor` trở thành state dùng chung giữa mọi thread",
      "Dòng (2) đặt comment rồi dòng sau đọc nó — có cửa sổ để thread khác ghi đè giữa hai dòng",
      "Khai prototype không có tác dụng gì ở đây vì không ai **yêu cầu** instance mới",
      "Sửa cách 1: yêu cầu context cấp một instance mới trong `handle` thay vì tiêm qua constructor",
      "Sửa cách 2 và tôi ưa hơn: bỏ state khỏi `CommentProcessor`, **truyền comment làm tham số** của `process`",
      "Cách 2 khử hẳn vấn đề vòng đời thay vì quản lý nó, và khi đó `CommentProcessor` thành singleton bất biến",
    ],
    model: "Tác giả đã suy nghĩ đúng một nửa: nhận ra `CommentProcessor` có state khả biến nên không thể là singleton, và khai nó prototype. Nhưng việc khai scope chỉ có ý nghĩa khi có ai đó **yêu cầu** bean, và ở đây chỉ có đúng một lần yêu cầu — lúc Spring tạo `CommentService`. `CommentService` là singleton nên constructor của nó chạy một lần, `processor` được tiêm một lần, và từ đó ứng dụng chỉ có một instance `CommentProcessor` được mọi thread dùng chung suốt đời sống. Nói cách khác, khai prototype không có tác dụng nào ở đây; hành vi thực tế y như singleton, nhưng mã đọc như thể mọi thứ an toàn. Từ đó lỗi dữ liệu lẫn nhau là hệ quả trực tiếp: dòng `setComment` đặt state, dòng `process` đọc state, và giữa hai dòng đó một thread khác hoàn toàn có thể gọi `setComment` với comment của nó — nên `process` xử lý comment của người khác. Cửa sổ hẹp nên lỗi thưa và chỉ xuất hiện khi có tải, đúng dạng khó truy. Có hai cách sửa và tôi ưa cách thứ hai rõ rệt. Cách thứ nhất là tôn trọng ý định ban đầu: yêu cầu context cấp một instance `CommentProcessor` mới bên trong `handle`, thay vì nhận một lần qua constructor. Nó hoạt động, nhưng nó khiến service phụ thuộc vào chính container và ta phải nhớ quy tắc này ở mọi chỗ dùng. Cách thứ hai là bỏ state khỏi `CommentProcessor` hoàn toàn: `process(Comment c)` nhận comment làm tham số. Khi đó `CommentProcessor` trở thành bất biến, nó là singleton hợp lệ theo đúng nguyên tắc sách nêu, và bài toán vòng đời biến mất thay vì được quản lý. Tôi ưa cách này vì nó khử điều kiện gây lỗi chứ không tổ chức lại xung quanh nó — và vì nó làm mã đơn giản hơn, không phức tạp hơn.",
    redFlags: [
      "Thêm `synchronized` vào `handle` — đúng về số nhưng tuần tự hoá toàn bộ và giữ nguyên thiết kế sai",
      "Kết luận prototype scope không hoạt động trong Spring",
      "Đổi `CommentService` sang prototype — nó vẫn được tiêm một lần vào controller singleton",
      "Giữ state và chỉ chuyển sang request scope mà không xét cách truyền tham số",
    ],
    probes: [
      "Vì sao đổi `CommentService` sang prototype cũng không giúp?",
      "Cách truyền tham số có nhược điểm nào không?",
      "Nếu `CommentProcessor` cần giữ state qua nhiều bước thì bạn thiết kế thế nào?",
    ],
    refs: ["springstart-05"],
  },
  {
    id: "springstart-iq07",
    field: "spring-start",
    topic: "ss-scope",
    level: 3,
    minutes: 9,
    question: "Bạn cần giữ dữ liệu theo từng người dùng trong một ứng dụng web. Chọn session scope, một kho ngoài, hay token mang dữ liệu?",
    tradeoffs: [
      {
        option: "Session scope",
        when: "Dữ liệu nhỏ, chỉ có nghĩa trong một phiên, và ứng dụng chạy **một instance** hoặc có cơ chế gắn phiên với instance. Đơn giản nhất, Spring lo hết vòng đời.",
      },
      {
        option: "Kho ngoài dùng chung",
        when: "Khi chạy **nhiều instance** — và đó là mặc định hiện nay. Phiên không còn gắn với một tiến trình, nên bất kỳ instance nào cũng phục vụ được. Đổi lại là một lần gọi mạng cho mỗi lần đọc và một phụ thuộc hạ tầng mới.",
      },
      {
        option: "Token mang dữ liệu, không lưu trạng thái phía server",
        when: "Khi dữ liệu nhỏ, không bí mật, và không cần thu hồi ngay. Mở rộng tốt nhất vì server không giữ gì. Nhưng thu hồi khó, và mọi thay đổi chỉ có hiệu lực khi token được cấp lại.",
      },
    ],
    mustCover: [
      "Session scope gắn dữ liệu với **phiên**, mà phiên theo mặc định nằm trong bộ nhớ của **một tiến trình**",
      "Nên với nhiều instance thì nó vỡ ngay khi request của cùng người dùng đi tới instance khác",
      "Cũng vỡ khi một instance khởi động lại — dữ liệu phiên mất",
      "Đó là lý do session scope là lựa chọn kém trong triển khai hiện đại, dù nó tiện",
      "Kho ngoài giải cả hai nhưng thêm một phụ thuộc phải khả dụng, và một lần gọi mạng mỗi lần đọc",
      "Token không lưu trạng thái mở rộng tốt nhất nhưng **không thu hồi được ngay** — đó là đánh đổi bảo mật",
      "Phải hỏi dữ liệu này **sống bao lâu** và **mất được không**, vì ba phương án khác nhau đúng ở hai trục đó",
    ],
    model: "Tôi phân định bằng hai câu hỏi: dữ liệu này sống bao lâu, và mất nó có được không? Session scope là lựa chọn tiện nhất và Spring lo hết vòng đời — dữ liệu tự sinh khi phiên bắt đầu và tự mất khi phiên hết. Nhưng nó mang một giả định ngầm rất quan trọng: phiên theo mặc định nằm trong bộ nhớ của **một tiến trình**. Nên nó chỉ đúng khi ứng dụng chạy một instance, hoặc khi có cơ chế gắn mọi request của một người dùng về cùng instance. Với triển khai hiện đại — nhiều bản sao sau một bộ cân bằng tải, pod bị thay thường xuyên — giả định đó sai, và nó sai theo hai cách: request của cùng người dùng đi tới instance khác thì không thấy dữ liệu, và một instance khởi động lại thì dữ liệu của những người đang dùng nó mất. Điều đáng nói là cả hai biểu hiện dưới dạng lỗi **thưa và khó tái hiện**, nên chúng thường sống rất lâu trước khi bị chẩn đoán đúng. Kho ngoài dùng chung giải cả hai vấn đề và là lựa chọn mặc định của tôi cho dữ liệu phiên thật: phiên không còn gắn với tiến trình nào, nên bất kỳ instance nào cũng phục vụ được và việc khởi động lại không mất gì. Cái giá phải nói rõ: một lần gọi mạng cho mỗi lần đọc, và một phụ thuộc hạ tầng mới phải khả dụng — nếu kho đó chết thì mọi người dùng bị đăng xuất. Token mang dữ liệu là hướng thứ ba và nó mở rộng tốt nhất vì server không giữ gì cả, nên không có bài toán chia sẻ trạng thái nào. Nhưng nó có một đánh đổi về bảo mật mà tôi luôn nêu trước: dữ liệu trong token không thu hồi được ngay. Nếu quyền của người dùng bị thay đổi hay tài khoản bị khoá, token đã cấp vẫn hợp lệ tới khi hết hạn — nên nó chỉ dùng được cho dữ liệu không bí mật và không cần thu hồi tức thì, và thời gian sống của token trở thành một quyết định bảo mật chứ không phải một tham số tiện dụng.",
    redFlags: [
      "Chọn session scope mà không hỏi ứng dụng chạy mấy instance",
      "Chọn token mang dữ liệu cho quyền hạn mà không nói tới bài toán thu hồi",
      "Không nêu rằng kho ngoài trở thành một phụ thuộc phải khả dụng",
      "Coi việc gắn phiên với instance là giải pháp lâu dài",
    ],
    probes: [
      "Một instance khởi động lại — người dùng thấy gì với mỗi phương án?",
      "Bạn thu hồi quyền ngay lập tức với token mang dữ liệu bằng cách nào?",
      "Kho phiên ngoài chết thì ứng dụng hành xử thế nào?",
    ],
    refs: ["springstart-09", "springstart-05"],
  },
  {
    id: "springstart-iq08",
    field: "spring-start",
    topic: "ss-scope",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Sau khi một ứng dụng được nhân từ 1 lên 6 instance để chịu tải, người dùng bắt đầu bị \"mất giỏ hàng\" ngẫu nhiên — khoảng 1 trên 6 lần tải trang thì giỏ hàng rỗng, rồi lần sau lại có. Giỏ hàng được giữ trong một bean session scope.",
      scale: "18.000 người dùng hoạt động mỗi giờ. Tỉ lệ khiếu nại tăng gấp 20 sau khi nhân instance. Doanh thu giảm 8% trong tuần đó.",
      constraints: "Không quay lại một instance — nó không chịu được tải. Không thêm hạ tầng mới trong tuần này, nhưng được thêm từ tuần sau. Phải có biện pháp giảm đau ngay trong ngày.",
      },
    question: "Tỉ lệ \"1 trên 6\" nói gì? Nêu chẩn đoán, biện pháp trong ngày, và cách sửa đúng từ tuần sau.",
    mustCover: [
      "Con số 1 trên 6 khớp chính xác với **6 instance**: phiên nằm trong bộ nhớ của instance đã tạo nó",
      "Nên chỉ khi request đi tới đúng instance đó thì giỏ hàng mới thấy được — xác suất 1 trên 6 là thấy, 5 trên 6 là rỗng",
      "Thực ra tỉ lệ khiếu nại nói ngược lại: người dùng thấy giỏ hàng 1 trên 6 lần, không phải mất 1 trên 6 lần",
      "Gốc rễ: session scope giả định phiên nằm trong **một tiến trình**, và giả định đó vỡ khi nhân instance",
      "Biện pháp trong ngày, không cần hạ tầng mới: cấu hình bộ cân bằng tải **gắn phiên** với instance",
      "Nó chỉ là giảm đau: một instance khởi động lại hay bị thay thì người dùng trên nó vẫn mất giỏ hàng",
      "Cách sửa đúng từ tuần sau: chuyển trạng thái phiên sang một **kho ngoài dùng chung**",
      "Hoặc đúng hơn về nghiệp vụ: giỏ hàng nên được **lưu bền** chứ không chỉ nằm trong phiên",
    ],
    model: "Con số 1 trên 6 là chỉ dấu mạnh nhất và nó khớp chính xác với 6 instance — nhưng tôi sẽ đọc nó ngược với cách đề bài mô tả. Bean session scope giữ giỏ hàng trong bộ nhớ của instance đã tạo phiên đó. Khi bộ cân bằng tải rải request đều, chỉ khoảng một trong sáu request đi tới đúng instance ấy, nên người dùng **thấy** giỏ hàng khoảng 1 trên 6 lần và thấy nó rỗng 5 trên 6 lần. Việc khiếu nại được mô tả là \"mất 1 trên 6 lần\" có lẽ là cách người dùng diễn đạt, nhưng con số 6 trùng với số instance là bằng chứng đủ để xác nhận chẩn đoán, và nó cũng nói rằng mức độ thiệt hại nặng hơn báo cáo. Gốc rễ là session scope mang một giả định ngầm: phiên nằm trong bộ nhớ của một tiến trình. Giả định đó đúng khi có một instance và vỡ ngay khi nhân lên — nên đây không phải lỗi mới xuất hiện mà là một lỗi thiết kế vốn có, chỉ được che bởi việc chỉ có một instance. Biện pháp trong ngày, và nó không cần hạ tầng mới nên thoả ràng buộc: cấu hình bộ cân bằng tải gắn phiên với instance, để mọi request của một người dùng luôn tới cùng chỗ. Nó khôi phục hành vi ngay và cầm được máu. Nhưng tôi sẽ nói rõ nó chỉ là giảm đau và có hai lỗ hở thật: khi một instance khởi động lại hoặc bị thay — điều xảy ra mỗi lần triển khai — thì mọi người dùng đang gắn với nó mất giỏ hàng; và tải phân bố không đều vì một instance có thể gom nhiều phiên nặng. Cách sửa đúng từ tuần sau là chuyển trạng thái phiên sang một kho ngoài dùng chung, để phiên không còn gắn với tiến trình nào và việc thay instance trở nên vô hại. Nhưng tôi sẽ đề xuất đi xa hơn một bước về mặt nghiệp vụ: giỏ hàng của một sàn thương mại điện tử không nên là dữ liệu phiên mà nên được **lưu bền** gắn với người dùng — vì người dùng mong nó còn đó khi họ quay lại ngày mai hay mở trên điện thoại, và điều đó không phiên nào cung cấp được. Nói cách khác, sự cố này đang phơi ra một quyết định mô hình hoá sai, không chỉ một vấn đề hạ tầng; và với doanh thu giảm 8% thì lập luận nghiệp vụ cho việc lưu bền là mạnh.",
    redFlags: [
      "Quay lại một instance — ràng buộc đã cấm và nó không chịu được tải",
      "Coi việc gắn phiên với bộ cân bằng tải là cách sửa cuối cùng",
      "Không nhận ra con số 6 trùng với số instance",
      "Bỏ qua việc triển khai làm mất phiên kể cả khi đã gắn phiên",
      "Chuyển sang kho phiên ngoài mà không xét việc giỏ hàng vốn nên được lưu bền",
    ],
    probes: [
      "Gắn phiên với instance còn hở ở những chỗ nào?",
      "Vì sao giỏ hàng nên được lưu bền thay vì để trong phiên?",
      "Bạn di trú phiên đang hoạt động sang kho ngoài mà không làm người dùng bị đăng xuất thế nào?",
    ],
    refs: ["springstart-09", "springstart-05"],
  },

  // ===== ss-aop (springstart-iq09–springstart-iq12) =====
  {
    id: "springstart-iq09",
    field: "spring-start",
    topic: "ss-aop",
    level: 1,
    minutes: 5,
    question: "Spring AOP hoạt động bằng cơ chế nào, và hệ quả nào của cơ chế đó mà lập trình viên phải biết?",
    mustCover: [
      "Spring AOP hoạt động bằng **proxy**: Spring đặt một object đứng trước bean và mọi lời gọi từ ngoài đi qua nó",
      "Proxy chèn logic trước và sau khi gọi phương thức thật — đó là cách `@Transactional` và các aspect khác hoạt động",
      "Hệ quả thứ nhất: lời gọi **từ bên trong cùng class** không đi qua proxy, nên aspect **không** được áp",
      "Hệ quả thứ hai: aspect chỉ áp được cho những phương thức proxy **chạm được** — `private` và `final` thì không",
      "Hệ quả thứ ba: object được tiêm vào nơi khác là **proxy**, không phải bean gốc",
      "Nên nếu mã dựa vào kiểu cụ thể hay so sánh tham chiếu với bean gốc thì nó có thể hành xử lạ",
    ],
    model: "Spring AOP hoạt động bằng proxy: Spring không sửa mã của ta mà đặt một object khác đứng trước bean, và mọi lời gọi từ bên ngoài đi qua object đó. Proxy chèn logic trước và sau lời gọi phương thức thật — đó chính là cách `@Transactional` mở và đóng transaction, cách ghi log tự động hoạt động, và cách mọi aspect khác được áp. Hiểu cơ chế này quan trọng vì nó sinh ra ba hệ quả mà không có tài liệu nào nhắc ta lúc viết mã. Hệ quả thứ nhất và là chỗ sai nhiều nhất: một lời gọi từ bên trong cùng class không đi ra ngoài rồi quay lại, nó đi thẳng tới phương thức thật trong cùng object — nên nó **không** đi qua proxy, và aspect không được áp. Điều này nghĩa là một annotation nằm chình ình trên phương thức có thể hoàn toàn vô tác dụng nếu nó chỉ được gọi nội bộ, và không có cảnh báo nào. Hệ quả thứ hai là aspect chỉ áp được cho những phương thức mà proxy chạm được. Vì proxy hoạt động bằng cách bọc hoặc kế thừa, một phương thức `private` không thể bị ghi đè và một phương thức `final` không thể bị kế thừa — nên annotation trên chúng cũng vô tác dụng. Đây là giới hạn của chính Java, không phải của Spring. Hệ quả thứ ba ít gặp hơn nhưng đáng biết: thứ được tiêm vào nơi khác là proxy chứ không phải bean gốc, nên nếu mã dựa vào kiểu cụ thể của bean, hay so sánh tham chiếu, hay đọc annotation bằng phản chiếu trên object nhận được, thì nó có thể hành xử khác kỳ vọng. Nói gọn lại, AOP rất mạnh nhưng nó là một tầng gián tiếp, và mọi hành vi lạ của nó đều truy về cùng một câu hỏi: lời gọi này có đi qua proxy hay không.",
    redFlags: [
      "Nói Spring AOP sửa bytecode của class lúc biên dịch",
      "Không biết lời gọi nội bộ không đi qua proxy",
      "Cho rằng annotation trên phương thức `private` vẫn có tác dụng",
    ],
    probes: [
      "Bạn kiểm chứng một aspect có được áp hay không bằng cách nào?",
      "Nếu bắt buộc phải gọi nội bộ mà vẫn cần aspect thì làm thế nào?",
      "Vì sao giới hạn với `private` và `final` là giới hạn của Java?",
    ],
    refs: ["springstart-06"],
  },
  {
    id: "springstart-iq10",
    field: "spring-start",
    topic: "ss-aop",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Aspect
@Component
public class LoggingAspect {
    @Around("@annotation(Logged)")
    public Object log(ProceedingJoinPoint jp) throws Throwable {
        log.info("Bắt đầu {}", jp.getSignature().getName());
        Object result = jp.proceed();
        log.info("Kết thúc {}", jp.getSignature().getName());   // (1)
        return result;
    }
}

@Service
public class OrderService {
    @Logged
    public void placeOrder(Order o) {
        validate(o);
        persist(o);          // (2) gọi nội bộ
    }

    @Logged
    private void persist(Order o) { repo.save(o); }   // (3)
}

// Log thực tế: chỉ có "Bắt đầu placeOrder" và "Kết thúc placeOrder".
// Và khi placeOrder ném exception, KHÔNG có dòng "Kết thúc" nào.`,
    },
    question: "Giải thích cả hai hiện tượng — `persist` không được ghi log, và thiếu dòng kết thúc khi có lỗi. Rồi sửa cả aspect lẫn service.",
    mustCover: [
      "`persist` không được ghi log vì **hai** lý do độc lập, và cần nêu cả hai",
      "Lý do 1: dòng (2) là lời gọi **nội bộ**, nên nó không đi qua proxy",
      "Lý do 2: dòng (3) khai `private`, nên proxy **không thể** chạm tới nó dù có gọi từ ngoài",
      "Thiếu dòng kết thúc khi lỗi vì dòng (1) nằm **sau** `proceed()` mà không có `finally`",
      "Nên khi `proceed()` ném, luồng thoát khỏi aspect trước khi tới dòng (1)",
      "Sửa aspect: bọc trong `try/finally`, và cân nhắc ghi cả thông tin ngoại lệ ở nhánh lỗi",
      "Sửa service: nếu `persist` cần được ghi log thì nó phải **public** và được gọi qua proxy — tách sang bean khác",
      "Hoặc đơn giản hơn: chấp nhận aspect chỉ áp ở ranh giới public, và không đặt annotation lên phương thức private",
    ],
    model: "Hai hiện tượng, và hiện tượng thứ nhất có hai nguyên nhân độc lập — nên chỉ sửa một cái thì vẫn không đủ. Nguyên nhân thứ nhất là dòng (2): `placeOrder` gọi `persist` từ bên trong cùng object, nên lời gọi đó không đi ra proxy mà đi thẳng tới phương thức thật; aspect không biết nó xảy ra. Nguyên nhân thứ hai là dòng (3): `persist` khai `private`, nên kể cả nếu ai đó gọi nó từ bên ngoài thì proxy cũng không thể chèn gì vào — một phương thức private không thể bị ghi đè, và đó là giới hạn của Java chứ không của Spring. Nghĩa là nếu chỉ chuyển lời gọi thành gọi qua proxy mà để nguyên `private` thì vẫn không có log, và ngược lại. Hiện tượng thứ hai thuộc về chính aspect: dòng (1) ghi \"Kết thúc\" nằm sau `proceed()` mà không có `finally`, nên khi phương thức được bọc ném ngoại lệ, `proceed()` ném, luồng thoát khỏi aspect ngay và dòng (1) không bao giờ chạy. Đó là một lỗi phổ biến và khá nguy hiểm với aspect ghi log hay đo thời gian: ta mất đúng những trường hợp cần quan sát nhất, tức các đường lỗi, nên log trông sạch trong khi hệ thống đang thất bại. Sửa aspect thì bọc `proceed()` trong `try/finally` để dòng kết thúc luôn chạy, và tôi sẽ thêm một nhánh bắt ngoại lệ để ghi cả loại lỗi — vì biết một lời gọi kết thúc bằng lỗi gì có giá trị hơn nhiều so với chỉ biết nó đã kết thúc. Sửa service thì phụ thuộc ý định. Nếu `persist` thật sự cần được ghi log riêng thì nó phải là phương thức public của một bean khác, và `placeOrder` gọi bean đó — khi ấy lời gọi đi qua proxy và annotation có tác dụng. Nếu không cần thì cách trung thực nhất là bỏ annotation khỏi `persist`, vì để nó ở đó tạo ra một lời hứa mà hệ thống không thực hiện, và người đọc sau sẽ tin là có log.",
    redFlags: [
      "Chỉ nêu một trong hai nguyên nhân của việc `persist` không được log",
      "Đổi `persist` thành public mà vẫn gọi nội bộ",
      "Sửa aspect bằng cách thêm `catch` mà không có `finally` — vẫn thiếu dòng kết thúc ở một số đường",
      "Giữ annotation trên phương thức private",
    ],
    probes: [
      "Vì sao mất log ở đường lỗi lại nguy hiểm hơn mất log ở đường thành công?",
      "Tách `persist` sang bean khác có nhược điểm gì?",
      "Aspect đo thời gian mắc cùng lỗi này thì hậu quả là gì?",
    ],
    refs: ["springstart-06"],
  },
  {
    id: "springstart-iq11",
    field: "spring-start",
    topic: "ss-aop",
    level: 3,
    minutes: 9,
    question: "Bạn cần thêm một hành vi xuyên suốt — ghi log, đo thời gian, kiểm quyền. Dùng AOP, một decorator tường minh, hay viết thẳng vào mã?",
    tradeoffs: [
      {
        option: "AOP",
        when: "Hành vi thật sự **xuyên suốt** và giống nhau ở nhiều chỗ — ghi log, đo thời gian, transaction. Không làm loãng mã nghiệp vụ, và thêm một chỗ áp dụng chỉ là một annotation.",
      },
      {
        option: "Decorator tường minh",
        when: "Khi hành vi có **logic riêng** đủ đáng kể, hoặc khi cần kiểm thử nó độc lập, hoặc khi chỉ áp cho một vài chỗ. Phụ thuộc hiện trong wiring, nên không có gì ẩn.",
      },
      {
        option: "Viết thẳng vào mã",
        when: "Khi hành vi khác nhau ở từng chỗ, hoặc khi nó là phần của nghiệp vụ chứ không phải mối quan tâm hạ tầng. Đừng ẩn thứ thuộc về bài toán.",
      },
    ],
    mustCover: [
      "Tiêu chí đầu tiên: hành vi này **giống nhau** ở mọi chỗ áp dụng hay khác nhau theo chỗ?",
      "AOP mạnh khi hành vi giống nhau; nó trở nên tệ khi ta bắt đầu thêm điều kiện vào aspect",
      "Cái giá lớn nhất của AOP là **tính ẩn**: đọc phương thức không thấy được hành vi được thêm",
      "Nên nó làm việc debug khó hơn, và người mới vào dự án không biết có gì đang chạy quanh mã",
      "Kiểm quyền là ca ranh giới: nó xuyên suốt nhưng hậu quả sai thì nghiêm trọng, nên tính ẩn đắt hơn",
      "Mọi aspect đều mang hệ quả của proxy: lời gọi nội bộ không được áp, `private` và `final` không áp được",
      "Vì vậy nếu hành vi **bắt buộc phải** luôn xảy ra thì AOP là chỗ dựa yếu",
    ],
    model: "Tiêu chí đầu tiên tôi dùng là: hành vi này có giống nhau ở mọi chỗ áp dụng hay không? Ghi log vào ra, đo thời gian thực thi, mở transaction — chúng giống nhau ở hàng chục chỗ, và viết tay ở từng chỗ vừa lặp vừa dễ quên. Đó là đúng bài của AOP, và lợi ích thật là mã nghiệp vụ không bị loãng bởi những dòng chẳng nói gì về nghiệp vụ. Nhưng khi tôi thấy mình bắt đầu thêm điều kiện vào aspect — ghi log kiểu này cho service A, kiểu khác cho service B — thì đó là dấu hiệu hành vi không còn xuyên suốt, và AOP đang biến thành một chỗ tập trung logic phân tán. Cái giá lớn nhất của AOP, và là thứ tôi luôn nêu trước khi chọn nó, là **tính ẩn**: đọc một phương thức không thấy được hành vi đã được thêm vào quanh nó. Người mới vào dự án không biết có gì đang chạy, và khi debug một sự cố thì lớp gián tiếp ấy là chỗ mất thời gian nhất. Đó là lý do tôi coi kiểm quyền là một ca ranh giới đáng bàn: nó đúng là xuyên suốt, nhưng hậu quả của việc nó không chạy là một lỗ hổng bảo mật — nên tính ẩn ở đây đắt hơn nhiều so với ghi log. Và nối vào đó là lập luận quyết định: mọi aspect đều mang hệ quả của cơ chế proxy, tức lời gọi nội bộ không được áp, phương thức `private` và `final` không áp được. Nghĩa là AOP về bản chất không bảo đảm hành vi **luôn** xảy ra — nó chỉ bảo đảm cho những lời gọi đi qua proxy. Với ghi log thì mất vài dòng là chấp nhận được; với kiểm quyền thì mất một lần là một sự cố. Nên với những hành vi bắt buộc phải luôn xảy ra, tôi ưu tiên chỗ dựa mạnh hơn: một decorator tường minh mà wiring nói rõ, hoặc kiểm ngay tại ranh giới vào của hệ thống nơi không có đường nào lách được. Còn hành vi khác nhau theo chỗ, hoặc thuộc về chính bài toán nghiệp vụ, thì tôi viết thẳng — vì ẩn thứ thuộc về bài toán là làm mã khó hiểu hơn chứ không gọn hơn.",
    redFlags: [
      "Dùng AOP cho hành vi khác nhau ở từng chỗ rồi nhồi điều kiện vào aspect",
      "Coi AOP là chỗ dựa đủ mạnh cho kiểm quyền mà không nói tới giới hạn của proxy",
      "Không nêu tính ẩn như một cái giá",
      "Viết tay một hành vi giống nhau ở ba chục chỗ rồi dựa vào review để không quên",
    ],
    probes: [
      "Vì sao AOP không bảo đảm hành vi luôn xảy ra?",
      "Bạn đặt kiểm quyền ở đâu để không có đường lách?",
      "Dấu hiệu nào cho biết một aspect đang bị lạm dụng?",
    ],
    refs: ["springstart-06"],
  },
  {
    id: "springstart-iq12",
    field: "spring-start",
    topic: "ss-aop",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một ứng dụng dùng aspect để kiểm quyền: phương thức nào có annotation `@RequiresRole` thì aspect kiểm vai trò trước khi cho chạy. Kiểm toán phát hiện 340 lần một endpoint nội bộ được gọi thành công bởi người dùng **không có** vai trò cần thiết. Endpoint đó gọi một phương thức có annotation, nhưng gọi từ bên trong cùng class.",
      scale: "12 endpoint dùng cơ chế này, 3 trong số đó có đường gọi nội bộ. 340 lần trong 4 tháng, trong đó 12 lần đã dẫn tới thay đổi dữ liệu mà người gọi không được phép.",
      constraints: "Không đổi được cơ chế kiểm quyền sang một thư viện khác trong quý này. Phải chặn về mặt cấu trúc — không chấp nhận giải pháp dựa vào việc lập trình viên nhớ quy tắc. Phải rà toàn bộ mã để tìm những chỗ tương tự.",
      },
    question: "Vì sao aspect không chạy? Và câu hỏi quan trọng hơn: vì sao đặt kiểm quyền vào AOP lại là lựa chọn sai về nguyên tắc ở đây?",
    mustCover: [
      "Aspect không chạy vì lời gọi **nội bộ** không đi qua proxy — annotation vô tác dụng",
      "Không có cảnh báo nào: mã biên dịch, chạy, và trông đúng",
      "Lỗi nguyên tắc: AOP bảo đảm hành vi cho **những lời gọi đi qua proxy**, không cho **mọi** lời gọi",
      "Với ghi log thì thiếu vài dòng là chấp nhận được; với kiểm quyền thì thiếu một lần là một lỗ hổng",
      "Nên một cơ chế \"bảo đảm theo mặc định nhưng có ngoại lệ im lặng\" là chỗ dựa sai cho bảo mật",
      "Chặn về cấu trúc: kiểm quyền ở **ranh giới vào** của hệ thống, nơi mọi request đều phải đi qua",
      "Hoặc bắt kiểm quyền thành **tham số bắt buộc** của phương thức, để không cung cấp thì không biên dịch được",
      "Rà toàn bộ mã: tìm mọi lời gọi nội bộ tới phương thức có annotation — việc này làm được bằng phân tích tĩnh",
      "Và thêm một kiểm tra ở build để lỗi cùng loại bị bắt lúc biên dịch, không phải lúc kiểm toán",
    ],
    model: "Lý do kỹ thuật thì ngắn: Spring AOP hoạt động bằng proxy, và một lời gọi từ bên trong cùng class đi thẳng tới phương thức thật mà không qua proxy — nên aspect không biết lời gọi đó xảy ra và annotation hoàn toàn vô tác dụng. Không có cảnh báo nào: mã biên dịch, chạy, trông đúng, và chỉ có kiểm toán bốn tháng sau mới phát hiện. Nhưng câu hỏi thứ hai quan trọng hơn và tôi muốn trả lời nó thẳng: đặt kiểm quyền vào AOP là lựa chọn sai **về nguyên tắc**, không phải sai vì đội đã viết nhầm. AOP bảo đảm hành vi cho những lời gọi đi qua proxy; nó không bảo đảm cho **mọi** lời gọi. Với ghi log hay đo thời gian thì sự khác biệt đó là một khiếm khuyết chấp nhận được — mất vài dòng log không ai chết. Với kiểm quyền thì mỗi lời gọi không được kiểm là một lỗ hổng, nên ta đang dựa một yêu cầu tuyệt đối lên một cơ chế chỉ cho bảo đảm có điều kiện, và điều kiện đó lại là thứ vô hình trong mã. Cộng thêm hai giới hạn cùng họ — phương thức `private` và `final` cũng không được áp — thì bức tranh rõ: đây là một cơ chế bảo đảm theo mặc định nhưng có ngoại lệ im lặng, và bảo mật không thể dựa lên một thứ như vậy. Về cách chặn theo cấu trúc, ràng buộc \"không dựa vào việc lập trình viên nhớ quy tắc\" chỉ đường tới hai lời giải. Lời giải thứ nhất và tốt nhất là chuyển kiểm quyền lên **ranh giới vào** của hệ thống — tầng lọc request — nơi mọi request từ bên ngoài đều buộc phải đi qua và không có lời gọi nội bộ nào lách được. Khi đó bảo đảm không phụ thuộc vào hình dạng lời gọi bên trong. Lời giải thứ hai, dùng cho những chỗ cần kiểm ở tầng sâu, là biến ngữ cảnh quyền thành **tham số bắt buộc** của phương thức: không cung cấp thì không biên dịch được, nên không có đường nào gọi mà bỏ qua kiểm. Về việc rà toàn bộ mã, điều tôi muốn nhất không phải rà một lần mà là dựng một cổng chặn: tìm mọi lời gọi nội bộ tới phương thức có annotation bằng phân tích tĩnh, và đưa kiểm tra đó vào build để build đỏ khi có ai thêm một chỗ như vậy. Như thế lớp lỗi này chuyển từ \"phát hiện sau bốn tháng bằng kiểm toán\" sang \"phát hiện lúc biên dịch\". Và 12 lần đã dẫn tới thay đổi dữ liệu thì phải được xử lý riêng theo quy trình sự cố bảo mật, gồm cả việc đánh giá có phải thông báo hay không.",
    redFlags: [
      "Sửa ba chỗ gọi nội bộ rồi coi là xong",
      "Đề nghị quy ước \"không gọi nội bộ phương thức có annotation\" — đó chính là dựa vào việc nhớ quy tắc",
      "Tự tiêm bean vào chính nó để lời gọi đi qua proxy — hoạt động nhưng vẫn là cơ chế có ngoại lệ im lặng",
      "Coi đây là lỗi cài đặt chứ không phải lựa chọn cơ chế sai",
      "Không tách 12 lần đã thay đổi dữ liệu ra xử lý theo quy trình bảo mật",
    ],
    probes: [
      "Vì sao tự tiêm bean vào chính nó vẫn chưa phải lời giải đúng?",
      "Kiểm tra ở build của bạn tìm mẫu hình nào, cụ thể?",
      "Kiểm quyền ở ranh giới vào có đủ cho mọi trường hợp không?",
    ],
    refs: ["springstart-06", "springstart-08"],
  },

  // ===== ss-mvc (springstart-iq13–springstart-iq16) =====
  {
    id: "springstart-iq13",
    field: "spring-start",
    topic: "ss-mvc",
    level: 1,
    minutes: 5,
    question: "Một HTTP request đi qua những thành phần nào trước khi tới action controller của bạn? Và cái gì xác định một request?",
    mustCover: [
      "**Servlet container** (Tomcat) nhận request và dịch HTTP thành đối tượng Java — nhờ nó ta không tự triển khai tầng giao tiếp",
      "Tomcat gọi **dispatcher servlet**, điểm vào duy nhất của ứng dụng Spring — nên nó còn được gọi là front controller",
      "Dispatcher servlet uỷ cho **handler mapping** để tìm action controller khớp với request",
      "Nếu handler mapping không tìm thấy action nào, ứng dụng trả về **404 Not Found**",
      "Controller trả về **tên view**, và dispatcher servlet uỷ cho **view resolver** để lấy nội dung view đó",
      "Một request được xác định bởi **cặp đường dẫn + HTTP method**, không chỉ đường dẫn",
      "Nên cùng một đường dẫn có thể gắn với nhiều action nếu chúng dùng method khác nhau",
      "Điều đáng nhớ: controller là thành phần duy nhất ta viết; Spring Boot tự cấu hình phần còn lại",
    ],
    model: "Chuỗi đi qua bốn chặng và tôi thấy nhớ được nó trả cổ tức mỗi lần debug. Tomcat — servlet container — nhận request từ mạng và dịch HTTP thành đối tượng Java; nhờ vậy ta viết mã bằng object và phương thức chứ không phải tự phân tích thông điệp HTTP. Tomcat rồi gọi dispatcher servlet, là điểm vào duy nhất của ứng dụng Spring và vì thế còn được gọi là front controller: mọi request, bất kể đường dẫn nào, đều đi qua đúng nó. Dispatcher servlet không tự biết phải gọi ai, nên nó uỷ cho handler mapping tìm action controller khớp với request; nếu không tìm được action nào thì ứng dụng trả 404 Not Found, và đó chính là ý nghĩa cơ học của 404 trong luồng này — không phải \"trang không tồn tại\" mà \"không có action nào được gắn với cặp này\". Sau khi action chạy và trả về tên view, dispatcher servlet uỷ tiếp cho view resolver để lấy nội dung view rồi gửi làm response. Điểm thứ hai câu hỏi nhắm tới là một request được xác định bởi **cặp** đường dẫn và HTTP method, chứ không chỉ đường dẫn. Hệ quả thực dụng là cùng một đường dẫn có thể gắn với nhiều action khác nhau miễn là method khác nhau — chẳng hạn một action hiển thị danh sách và một action thêm bản ghi đều ở đường dẫn `/products`. Và điều cuối tôi luôn nhấn: trong toàn bộ luồng đó, controller là thành phần duy nhất ta viết; Spring Boot cấu hình Tomcat, dispatcher servlet, handler mapping và view resolver theo quy ước. Nghĩa là khi có gì sai, phần lớn khả năng nó nằm ở mảnh ta viết hoặc ở việc ánh xạ, không phải ở khung.",
    redFlags: [
      "Nói request đi thẳng từ Tomcat tới controller, bỏ qua dispatcher servlet",
      "Cho rằng đường dẫn một mình xác định một request",
      "Không giải thích được 404 sinh ra ở chặng nào",
    ],
    probes: [
      "Hai action cùng đường dẫn `/products` khác nhau ở điểm nào để handler mapping phân biệt được?",
      "View resolver có nhiệm vụ gì mà dispatcher servlet không tự làm?",
      "Vì sao nói dispatcher servlet là front controller?",
    ],
    refs: ["springstart-07"],
  },
  {
    id: "springstart-iq14",
    field: "spring-start",
    topic: "ss-mvc",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Controller
public class ProductsController {
    private final ProductService productService;

    public ProductsController(ProductService s) { this.productService = s; }

    @GetMapping("/products")
    public String viewProducts(Model model) {
        model.addAttribute("products", productService.findAll());
        return "products.html";
    }

    @PostMapping("/products")
    public String addProduct(@RequestParam String name,
                             @RequestParam double price,
                             Model model) {
        productService.addProduct(new Product(name, price));
        return "products.html";                        // (1)
    }
}

// Hai báo lỗi từ người dùng:
// A. Sau khi bấm "Thêm", trang hiện ra với bảng sản phẩm RỖNG.
//    Bấm F5 hoặc mở lại /products thì danh sách đầy đủ, có cả sản phẩm vừa thêm.
// B. Một số người dùng có sản phẩm bị thêm hai, ba lần.`,
    },
    question: "Giải thích cả hai báo lỗi. Chúng có cùng một gốc rễ không? Sửa controller.",
    mustCover: [
      "Báo lỗi A: dòng (1) render `products.html` nhưng **không** nạp `products` vào model",
      "Model là của **từng request**, nên dữ liệu mà `viewProducts` nạp không còn ở request POST",
      "Nên view render với `products` rỗng — không phải dữ liệu bị mất mà là chưa bao giờ được nạp",
      "Báo lỗi B: response của POST là **chính trang đó**, nên URL trong trình duyệt vẫn là một POST",
      "Người dùng bấm F5 thì trình duyệt **gửi lại POST**, và sản phẩm được thêm lần nữa",
      "Hai báo lỗi có **cùng** gốc rễ: POST trả trực tiếp view thay vì chuyển hướng",
      "Sửa: POST xử lý xong thì **redirect** về `/products` — trả `\"redirect:/products\"`",
      "Sau redirect trình duyệt phát một GET mới, nên `viewProducts` chạy và nạp model đầy đủ",
      "Và URL trở thành GET, nên F5 chỉ tải lại danh sách chứ không thêm lần nữa",
    ],
    model: "Hai báo lỗi nhìn khác nhau nhưng có cùng một gốc rễ, và tôi nghĩ đó là phần đáng nói nhất. Báo lỗi A: dòng (1) trả về tên view `products.html`, nên view được render — nhưng action POST không nạp gì vào model. Model tồn tại theo từng request; dữ liệu mà `viewProducts` nạp thuộc về một request khác và không có mặt ở đây. Nên view render với `products` rỗng, và cần nói rõ bản chất: dữ liệu không bị mất, nó chưa bao giờ được nạp cho request này. Bằng chứng khớp với chẩn đoán đó — mở lại `/products` thì danh sách đầy đủ, kể cả sản phẩm vừa thêm, tức là việc lưu đã thành công. Báo lỗi B: vì POST trả trực tiếp view, response của một POST là chính trang đó, nên URL hiện tại trong trình duyệt vẫn ứng với một request POST. Khi người dùng bấm F5 — hoặc bấm Back rồi tiến lại — trình duyệt gửi lại chính POST đó, và sản phẩm được thêm lần nữa. Trình duyệt thường hỏi \"gửi lại dữ liệu?\", nhưng nhiều người bấm đồng ý, nên hiện tượng thưa và ngẫu nhiên đúng như báo cáo. Cách sửa giải cả hai cùng lúc: action POST xử lý xong thì **chuyển hướng** thay vì render, tức trả `\"redirect:/products\"`. Khi đó trình duyệt phát một GET mới tới `/products`, `viewProducts` chạy và nạp model đầy đủ nên bảng có dữ liệu; và URL sau cùng là một GET nên F5 chỉ tải lại danh sách, không thêm bản ghi nào. Đây là mẫu hình POST-rồi-chuyển-hướng-rồi-GET, và tôi coi nó là quy tắc mặc định cho mọi action thay đổi dữ liệu trong ứng dụng render phía server. Một cách sửa khác là nạp lại model trong action POST — nó chữa báo lỗi A nhưng để nguyên báo lỗi B, nên nó là nửa lời giải và tôi sẽ không chọn.",
    redFlags: [
      "Chỉ nạp lại model trong action POST rồi coi là xong — báo lỗi B vẫn còn",
      "Kết luận `productService.addProduct` không lưu được dữ liệu",
      "Đổi POST thành GET để \"tránh gửi lại\" — dùng GET cho thao tác thay đổi dữ liệu là sai nặng hơn",
      "Không nhận ra hai báo lỗi cùng một gốc rễ",
    ],
    probes: [
      "Vì sao nạp lại model không chữa được việc thêm trùng?",
      "Model sống trong phạm vi nào, và vì sao điều đó quan trọng ở đây?",
      "Nếu người dùng bấm \"Thêm\" hai lần thật nhanh thì redirect có chống được không?",
    ],
    refs: ["springstart-08", "springstart-07"],
  },
  {
    id: "springstart-iq15",
    field: "spring-start",
    topic: "ss-mvc",
    level: 3,
    minutes: 10,
    question: "Dự án mới: backend render view sẵn, hay tách frontend–backend? Lập luận theo quy mô đội và hình thái sản phẩm.",
    tradeoffs: [
      {
        option: "Backend render view (không tách)",
        when: "Đội nhỏ, ứng dụng nhỏ, phần lớn là form và bảng. Một nơi triển khai, một lần deploy, không có tầng API phải thiết kế và duy trì. Lần tải đầu nhanh và nội dung sẵn sàng cho công cụ tìm kiếm.",
      },
      {
        option: "Tách frontend–backend",
        when: "Ứng dụng lớn, nhiều người cùng làm, hoặc cần phục vụ thêm client khác (mobile). Hai đội làm song song, hai lịch deploy độc lập. Đổi lại phải thiết kế và giữ ổn định một API, cộng thêm việc xác thực và phân quyền qua ranh giới đó.",
      },
      {
        option: "Backend render, để ngỏ đường tách sau",
        when: "Chưa biết sản phẩm đi tới đâu. Giữ logic nghiệp vụ trong service, controller chỉ mỏng — khi cần tách thì thêm endpoint REST bên cạnh, không viết lại nghiệp vụ.",
      },
    ],
    mustCover: [
      "Đây không phải câu hỏi \"cái nào hiện đại hơn\" mà là câu hỏi về **quy mô đội** và **số loại client**",
      "Render phía server: một nơi triển khai, một lần deploy, không phải thiết kế API công khai",
      "Nó thắng rõ khi ứng dụng chủ yếu là form và bảng, và đội nhỏ",
      "Tách frontend–backend: hai đội làm song song và **deploy độc lập** — đó là lợi ích thật với ứng dụng lớn",
      "Nhưng nó sinh ra một **hợp đồng API** phải thiết kế, phiên bản hoá và giữ ổn định",
      "Và nó đẩy xác thực/phân quyền lên một ranh giới mới, nơi mọi thứ đều công khai truy cập được",
      "Câu hỏi phân định mạnh nhất: có **client thứ hai** (mobile, đối tác) không? Nếu có thì tách là gần như bắt buộc",
      "Quyết định có thể hoãn: giữ nghiệp vụ trong service và controller mỏng thì cả hai đường vẫn mở",
    ],
    model: "Tôi bắt đầu bằng việc gạt ra một cách đặt vấn đề sai: đây không phải câu hỏi cái nào hiện đại hơn. Nó là câu hỏi về quy mô đội và số loại client, và hai trục đó cho câu trả lời khá dứt khoát. Render phía server nghĩa là backend trả về đúng những gì trình duyệt cần hiển thị. Lợi ích của nó là sự vắng mặt: không có hợp đồng API phải thiết kế, không có tầng thứ hai phải deploy, không có trạng thái nào phải đồng bộ giữa hai bên. Với một ứng dụng nội bộ chủ yếu là form và bảng, và một đội nhỏ, tôi chọn nó không do dự — vì nó cho ta ít việc hơn ở mọi chiều, và lần tải đầu cũng nhanh hơn. Tách frontend–backend đắt hơn nhưng mua được hai thứ cụ thể. Thứ nhất là song song hoá con người: hai đội nhận trách nhiệm hai phía và có thể làm cùng lúc, nên với ứng dụng lớn thì đây là lợi ích tổ chức thật sự, không phải chuyện sở thích kỹ thuật. Thứ hai là deploy độc lập, nghĩa là đổi giao diện không cần deploy backend và ngược lại. Cái giá tôi luôn nói trước: ta vừa tạo ra một hợp đồng API, và hợp đồng thì phải được thiết kế, phiên bản hoá và giữ ổn định — mọi thay đổi phá vỡ nó đều là một cuộc di trú có phối hợp. Cộng thêm một cái giá về bảo mật mà người ta thường quên: khi backend chỉ trả dữ liệu thô, mọi endpoint đều là một mặt tiếp xúc công khai, nên phân quyền phải được đặt ở đúng ranh giới đó chứ không thể dựa vào việc \"giao diện không có nút bấm\". Câu hỏi phân định mạnh nhất của tôi là: có client thứ hai không? Nếu sản phẩm sẽ có ứng dụng di động, hoặc đối tác cần gọi, thì backend buộc phải trả dữ liệu thô cho ai đó — và khi đã phải làm việc đó thì render thêm HTML ở backend chỉ là công việc trùng lặp. Nếu chỉ có một client là trình duyệt và chưa thấy client thứ hai nào, tôi chọn render phía server và giữ đường tách để ngỏ: nghiệp vụ nằm trong service, controller mỏng đúng mức chuyển đổi dữ liệu. Khi đó việc thêm endpoint REST sau này là thêm một controller, không phải viết lại ứng dụng — và tôi coi đó là cách rẻ nhất để không phải đoán trước tương lai.",
    redFlags: [
      "Chọn tách vì đó là \"cách hiện đại\" mà không nêu lợi ích tổ chức cụ thể",
      "Không nêu hợp đồng API như một chi phí phải duy trì",
      "Bỏ qua việc tách đẩy phân quyền lên một ranh giới công khai",
      "Không hỏi có client thứ hai hay không",
    ],
    probes: [
      "Vì sao \"deploy độc lập\" là lợi ích với đội lớn nhưng gần như vô nghĩa với đội hai người?",
      "Bạn giữ controller mỏng bằng cách nào, cụ thể?",
      "Tách rồi thì phân quyền đặt ở đâu?",
    ],
    refs: ["springstart-07", "springstart-10"],
  },
  {
    id: "springstart-iq16",
    field: "spring-start",
    topic: "ss-mvc",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Một trang quản trị có bảng bản ghi, mỗi dòng có liên kết \"Xoá\" trỏ tới `/admin/delete?id=...`. Trang này chỉ người quản trị truy cập được và mọi lần xoá đều ghi log đúng người thực hiện. Sáng thứ Hai, 1.240 bản ghi biến mất, log ghi nhận tất cả do **một** tài khoản quản trị thực hiện trong vòng 40 giây — trong khi người đó khẳng định chỉ mở trang lên xem.",
      scale: "1.240 trên 3.100 bản ghi bị xoá. Bảng không có cột đánh dấu xoá mềm. Bản sao lưu gần nhất là 9 giờ trước.",
      constraints: "Phải phục hồi dữ liệu và phải giải thích được vì sao log lại chỉ đúng một người. Trang quản trị không được ngừng hoạt động quá 30 phút. Không đổi được công cụ gửi thư nội bộ mà công ty dùng.",
      },
    question: "40 giây và một tài khoản duy nhất nói gì? Nêu chẩn đoán, cách phục hồi, và cách chặn để lớp lỗi này không lặp lại.",
    mustCover: [
      "Manh mối quyết định: 1.240 lần xoá trong 40 giây thì **không phải người bấm** — đó là tốc độ của máy",
      "Cộng với \"đúng một tài khoản\" và \"người đó chỉ mở trang\": có gì đó **duyệt qua mọi liên kết trên trang** bằng phiên của người đó",
      "Gốc rễ: hành động xoá được triển khai bằng **HTTP GET** qua một liên kết",
      "GET phải là thao tác **chỉ truy xuất**; mọi thứ trong hệ thống đều tin vào giả định đó",
      "Nên bất cứ thứ gì tải trước liên kết — tiện ích trình duyệt, bộ quét an toàn của công cụ thư, trình thu thập nội bộ — đều xoá dữ liệu chỉ bằng việc đọc trang",
      "Điều đó cũng giải thích log: request thật đến từ phiên hợp lệ của người đó, nên log ghi đúng, và log **không sai**",
      "Phục hồi: dựng lại từ bản sao lưu 9 giờ trước rồi bù phần chênh, và nói rõ khoảng dữ liệu không thể phục hồi",
      "Biện pháp trong 30 phút: đổi xoá sang POST (hoặc DELETE) — liên kết thành form/nút, vì trình thu thập không gửi POST",
      "Chặn lớp lỗi: rà mọi endpoint GET có tác dụng phụ, và thêm kiểm tra ở build/review để GET không được thay đổi dữ liệu",
      "Và thêm xoá mềm — để lần sau việc phục hồi là một câu cập nhật, không phải một cuộc khôi phục",
    ],
    model: "Manh mối quyết định là 40 giây. 1.240 lần xoá trong 40 giây là khoảng 30 lần mỗi giây; không người nào bấm được như vậy, nên tác nhân là máy. Cộng thêm hai dữ kiện — tất cả đến từ đúng một tài khoản, và người đó nói chỉ mở trang lên — thì giả thuyết gần như duy nhất là: có một thứ nào đó đã duyệt qua **mọi liên kết trên trang** bằng chính phiên của người đó. Và lý do việc duyệt liên kết lại xoá được dữ liệu là gốc rễ của sự cố: hành động xoá được triển khai bằng HTTP GET. GET, theo thiết kế, là thao tác chỉ truy xuất, và cả hệ sinh thái đều tin vào giả định đó — trình duyệt tải trước liên kết, tiện ích mở rộng quét trang, bộ phận an toàn của công cụ thư mở mọi liên kết trong thư để kiểm tra, trình thu thập nội bộ lập chỉ mục. Bất cứ thứ nào trong số đó chỉ cần **đọc** trang là đã xoá dữ liệu. Điều này cũng giải thích trọn vẹn câu hỏi thứ hai của đề bài: log không sai một chút nào. Request thật sự đến từ phiên hợp lệ của người quản trị đó, nên hệ thống ghi đúng người; log chỉ không ghi được rằng thứ phát ra request là một công cụ chứ không phải một cú bấm — và đó là giới hạn của mọi log ở tầng ứng dụng, không phải một lỗi cần sửa. Về phục hồi, tôi khôi phục từ bản sao lưu 9 giờ trước vào một môi trường riêng, đối chiếu để tìm đúng 1.240 bản ghi đã mất rồi chèn lại, thay vì khôi phục đè lên toàn bộ bảng — vì đè sẽ xoá mọi thay đổi hợp lệ trong 9 giờ đó. Phần dữ liệu được tạo sau bản sao lưu và bị xoá trước khi phát hiện là phần không thể phục hồi, và tôi nêu con số đó ra một cách rõ ràng thay vì để nó lẫn vào báo cáo. Biện pháp lọt trong 30 phút là đổi hành động xoá sang POST hoặc DELETE: liên kết trở thành một form với nút bấm. Nó chặn ngay toàn bộ họ tác nhân này, vì không trình thu thập nào phát POST. Nhưng tôi không dừng ở đó, vì sửa một endpoint không sửa lớp lỗi. Tôi rà toàn bộ ứng dụng tìm mọi endpoint GET có tác dụng phụ — kinh nghiệm của tôi là ở đâu có một chỗ thì thường có vài chỗ — và đưa một kiểm tra vào build hoặc vào danh mục review để một action thay đổi dữ liệu không được gắn với GET. Cuối cùng tôi đề xuất xoá mềm cho bảng này: sự cố vừa rồi biến một thao tác nhầm thành một cuộc khôi phục từ bản sao lưu, còn với xoá mềm thì nó chỉ là một câu cập nhật. Đó là thứ tôi muốn mua bằng sự cố này.",
    redFlags: [
      "Kết luận tài khoản quản trị bị chiếm dụng và tập trung vào điều tra người đó",
      "Coi log là sai và đi sửa log",
      "Chỉ thêm hộp thoại xác nhận bằng JavaScript — trình thu thập không chạy nó, nên nó không chặn gì",
      "Khôi phục đè toàn bộ bảng từ bản sao lưu, xoá mất 9 giờ thay đổi hợp lệ",
      "Sửa đúng một endpoint mà không rà các endpoint GET còn lại",
    ],
    probes: [
      "Vì sao hộp thoại xác nhận phía trình duyệt không phải một biện pháp?",
      "Bạn xác định chính xác 1.240 bản ghi cần chèn lại bằng cách nào?",
      "Kiểm tra ở build của bạn phát hiện \"GET có tác dụng phụ\" theo tiêu chí nào?",
    ],
    refs: ["springstart-08"],
  },

  // ===== ss-rest (springstart-iq17–springstart-iq20) =====
  {
    id: "springstart-iq17",
    field: "spring-start",
    topic: "ss-rest",
    level: 1,
    minutes: 5,
    question: "`@RestController` khác `@Controller` ở điểm nào? Và bạn điều khiển status cùng header của response bằng gì?",
    mustCover: [
      "Với `@Controller`, giá trị trả về của action được hiểu là **tên view** để view resolver đi tìm",
      "Với `@RestController`, giá trị trả về được **chuyển thành response body** — thường là JSON",
      "`@RestController` chính là `@Controller` cộng thêm ý \"trả body chứ không trả tên view\"",
      "Mặc định status là 200 OK và ta không điều khiển được header",
      "Muốn đặt status và header thì trả về **`ResponseEntity`**, nó bọc cả body, status và header",
      "Về ngoại lệ: có thể bắt trong từng action, hoặc tách ra một **REST controller advice** áp cho nhiều endpoint",
      "Advice tốt hơn khi cùng một ngoại lệ phải xử lý ở nhiều endpoint — tránh trùng lặp và gom logic về một chỗ",
    ],
    model: "Khác biệt nằm ở cách Spring hiểu giá trị trả về của action. Với `@Controller`, chuỗi trả về được hiểu là tên một view, và dispatcher servlet uỷ cho view resolver đi tìm nội dung view đó — nên trả về `\"products.html\"` nghĩa là \"hãy render trang này\". Với `@RestController`, giá trị trả về được chuyển thành response body, thường là JSON; trả về một đối tượng nghĩa là \"hãy gửi chính dữ liệu này cho client\". Nói cách khác `@RestController` là `@Controller` cộng thêm ý \"body chứ không phải tên view\", và đó là toàn bộ sự khác biệt — mọi thứ còn lại của luồng request vẫn y nguyên. Về việc điều khiển response: nếu action trả về trực tiếp một đối tượng thì status mặc định là 200 OK và ta không nói được gì về header. Khi cần đặt status khác, hay thêm header, ta trả về `ResponseEntity` — nó bọc cả ba thứ: body, status và header, nên nó là công cụ để mô tả một response đầy đủ chứ chỉ không phải dữ liệu. Phần thứ ba tôi muốn nêu vì nó gắn liền trong thực tế: khi action ném ngoại lệ, ta có hai lựa chọn. Cách trực tiếp là bắt ngay trong action và trả về một `ResponseEntity` khác cho nhánh lỗi. Cách tôi ưa hơn cho ứng dụng thật là tách ra một REST controller advice — nó chặn ngoại lệ mà các action ném ra và áp logic ta định nghĩa cho từng loại ngoại lệ. Lý do có hai: cùng một ngoại lệ thường phải xử lý ở nhiều endpoint nên bắt trong từng action là mã trùng lặp; và khi cần hiểu một trường hợp lỗi hoạt động thế nào thì có một chỗ duy nhất để đọc. Đổi lại, action chỉ còn lo luồng thành công, và tôi thấy chúng đọc dễ hơn hẳn.",
    redFlags: [
      "Nói `@RestController` tự động sinh URL hay tự động tạo CRUD",
      "Không biết `ResponseEntity` là cách đặt status và header",
      "Cho rằng phải bắt ngoại lệ trong từng action, không biết tới controller advice",
    ],
    probes: [
      "Trả về `ResponseEntity<?>` và trả về đối tượng trực tiếp khác nhau thế nào từ phía client?",
      "Khi nào bắt ngoại lệ ngay trong action vẫn hợp lý?",
      "Cơ chế nào phía sau controller advice?",
    ],
    refs: ["springstart-10"],
  },
  {
    id: "springstart-iq18",
    field: "spring-start",
    topic: "ss-rest",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@RestController
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService s) { this.paymentService = s; }

    @PostMapping("/payment")
    public ResponseEntity<?> makePayment(@RequestBody PaymentRequest req) {
        try {
            return ResponseEntity.ok(paymentService.process(req));
        } catch (Exception e) {                                   // (1)
            log.error("Thanh toán thất bại", e);
            return ResponseEntity.ok(                             // (2)
                new ErrorDetails("Thanh toán thất bại, vui lòng thử lại"));
        }
    }
}

// Báo cáo từ đội client: khi tài khoản không đủ tiền, ứng dụng di động
// hiện vòng xoay rồi tự gọi lại endpoint 5 lần, cuối cùng báo "thành công".
// Bảng đối soát cho thấy 0 giao dịch được ghi nhận cho những lượt đó.`,
    },
    question: "Vì sao client lại thử lại và báo thành công? Nêu vấn đề ở dòng (1) và (2) rồi viết lại theo hướng bạn ưa.",
    mustCover: [
      "Dòng (2) trả về **200 OK** cho một lượt thất bại — nên với client, request đã thành công",
      "Client đọc status trước, không phải body, và đó là hành vi đúng của mọi thư viện HTTP",
      "Nên client thấy 200 rồi cố đọc trường dữ liệu mong đợi, không thấy, và rơi vào nhánh thử lại",
      "Việc nó \"báo thành công\" ở lần cuối chỉ là hệ quả: nó luôn nhận 200",
      "Nghĩa là status code là **phần hợp đồng**, không phải chi tiết trang trí — body không thay được nó",
      "Dòng (1) bắt `Exception` — nó gộp \"không đủ tiền\" với lỗi hạ tầng vào **một** response giống nhau",
      "Không đủ tiền là lỗi của **phía client** (4xx), còn database chết là lỗi của **phía server** (5xx)",
      "Gộp chúng lại thì client không thể xử lý đúng: 4xx thì **không nên** thử lại, 5xx thì có thể",
      "Viết lại: bỏ try/catch khỏi action, chuyển sang **REST controller advice** ánh xạ từng loại ngoại lệ sang từng status",
      "Và ghi log ở advice, để action chỉ còn luồng thành công",
    ],
    model: "Nguyên nhân nằm gọn ở dòng (2): nó trả về 200 OK cho một lượt thất bại. Mọi thư viện HTTP phía client đều quyết định dựa trên status trước, không phải trên body — nên với client, request này đã thành công. Sau đó nó cố đọc trường dữ liệu mà nó mong đợi trong một response thành công, không thấy, và rơi vào nhánh xử lý \"response lạ\", mà ở ứng dụng này là thử lại. Việc nó báo \"thành công\" ở lần cuối cũng không bí ẩn: nó luôn nhận 200, nên sau khi hết số lần thử nó kết luận điều duy nhất status cho phép. Bài học ở đây là status code là phần của hợp đồng, không phải chi tiết trang trí, và không có thông điệp nào trong body sửa được một status sai. Dòng (1) là vấn đề thứ hai và nghiêm trọng theo cách khác: bắt `Exception` gộp mọi thứ vào một nhánh — \"tài khoản không đủ tiền\" và \"database không kết nối được\" cho ra cùng một response. Hai tình huống đó khác nhau về bản chất: không đủ tiền là vấn đề của phía gọi, client phải sửa dữ liệu hoặc thông báo cho người dùng, nên nó thuộc họ 4xx và **không nên** thử lại — thử lại chỉ thất bại y như cũ. Còn database chết là vấn đề của phía server, nên nó thuộc họ 5xx và thử lại là hợp lý. Gộp lại thì ta lấy đi khả năng quyết định của client, và đúng như báo cáo, nó chọn sai. Cách tôi viết lại: bỏ hẳn try/catch khỏi action để nó chỉ còn luồng thành công, rồi đưa việc xử lý ngoại lệ sang một REST controller advice ánh xạ mỗi loại ngoại lệ sang một status cụ thể — ngoại lệ \"không đủ tiền\" thành 400 với body mô tả rõ lý do, và mọi ngoại lệ không lường trước thành 500 với thông điệp chung, không rò rỉ chi tiết nội bộ. Ghi log cũng chuyển về advice, nơi nó thấy được mọi đường lỗi của mọi endpoint. Lợi ích ngoài việc sửa lỗi: khi có endpoint thứ hai cũng ném \"không đủ tiền\", nó được xử lý đúng mà không ai phải nhớ viết lại try/catch.",
    redFlags: [
      "Chỉ đổi thông điệp trong body, giữ nguyên 200",
      "Đổi tất cả nhánh lỗi thành 500 — không đủ tiền không phải lỗi server",
      "Giữ `catch (Exception e)` rồi chỉ đổi status thành 400 — giờ lỗi hạ tầng bị báo là lỗi client",
      "Sửa ở phía client bằng cách đọc body để phát hiện lỗi",
      "Trả nguyên thông điệp ngoại lệ ra body cho mọi loại lỗi",
    ],
    probes: [
      "Vì sao client **không nên** thử lại một 4xx?",
      "Advice của bạn xử lý ngoại lệ không lường trước thế nào, và nó trả gì ra body?",
      "Nếu đội client đã viết mã dựa vào 200 hiện tại thì bạn triển khai thay đổi này ra sao?",
    ],
    refs: ["springstart-10"],
  },
  {
    id: "springstart-iq19",
    field: "spring-start",
    topic: "ss-rest",
    level: 3,
    minutes: 10,
    question: "Ứng dụng của bạn cần gọi endpoint của một hệ thống khác. Chọn OpenFeign, RestTemplate hay WebClient — và điều gì thực sự quyết định chất lượng của lời gọi đó?",
    tradeoffs: [
      {
        option: "OpenFeign",
        when: "Ứng dụng theo cách tiếp cận tiêu chuẩn, không reactive — tức phần lớn ứng dụng. Ta khai một interface và để thư viện sinh phần gọi, nên lượng mã ít nhất và ý định đọc rõ nhất.",
      },
      {
        option: "WebClient",
        when: "Ứng dụng được **thiết kế** theo hướng reactive từ đầu. Nó rất mạnh, nhưng dùng nó trong một ứng dụng đồng bộ thì ta trả giá phức tạp mà không nhận được lợi ích — cần hiểu reactive trước khi chọn.",
      },
      {
        option: "RestTemplate",
        when: "Chỉ trong mã đã có sẵn. Không nên chọn nó cho phần triển khai mới; nếu đang dùng thì đó là một khoản nợ, không phải một lựa chọn.",
      },
    ],
    mustCover: [
      "Với ứng dụng tiêu chuẩn, không reactive, lựa chọn mặc định là **OpenFeign**",
      "`WebClient` dành cho ứng dụng được thiết kế reactive — dùng nó trong ứng dụng đồng bộ là trả giá mà không nhận lợi ích",
      "`RestTemplate` **không nên** dùng cho phần triển khai mới",
      "Nhưng cả ba câu trên là phần dễ, và không phải điều quyết định chất lượng",
      "Điều quyết định là cách ta xử lý **thất bại của phía kia**: timeout, số lần thử lại, và hành vi khi nó chậm",
      "Không đặt timeout thì một hệ thống chậm biến thành một hệ thống của ta **ngừng hoạt động**",
      "Thử lại phải phân biệt theo status: 5xx thì hợp lý, 4xx thì vô nghĩa",
      "Và thử lại một thao tác thay đổi dữ liệu thì cần **khoá idempotent**, nếu không có thể tạo hai giao dịch",
      "Nên câu hỏi thật sự không phải \"API nào đẹp hơn\" mà \"hệ thống của tôi hành xử thế nào khi phía kia hỏng\"",
    ],
    model: "Phần chọn công cụ khá dứt khoát và tôi trả lời nhanh: với một ứng dụng theo cách tiếp cận tiêu chuẩn — không reactive, tức phần lớn ứng dụng tôi gặp — tôi chọn OpenFeign. Ta khai một interface mô tả endpoint và để thư viện sinh phần gọi, nên lượng mã ít nhất và mã đọc ra ý định chứ không ra thao tác HTTP. `WebClient` là công cụ tốt, nhưng nó thuộc về ứng dụng được **thiết kế** reactive từ đầu; đưa nó vào một ứng dụng đồng bộ thì ta nhận độ phức tạp của mô hình reactive mà không nhận được lợi ích của nó, và tôi cho rằng nên hiểu reactive khá sâu trước khi chọn nó. `RestTemplate` thì tôi không dùng cho phần triển khai mới; nếu mã hiện có đang dùng thì tôi coi đó là một khoản nợ để trả dần, chứ không phải một lựa chọn còn hiệu lực. Nhưng tôi muốn nói rằng toàn bộ đoạn trên là phần dễ của câu hỏi, và nó không quyết định chất lượng của lời gọi. Điều quyết định là ta xử lý thế nào khi phía kia hỏng. Trục thứ nhất là timeout, và nó là trục quan trọng nhất: một lời gọi không có timeout nghĩa là thread của ta chờ vô hạn, nên một hệ thống bên ngoài **chậm** biến thành một hệ thống của ta **ngừng hoạt động** — và đó là kiểu sự cố tệ hơn nhiều so với việc phía kia chết hẳn, vì khi nó chết hẳn ta nhận lỗi ngay. Trục thứ hai là thử lại, và nó phải phân biệt theo status: 5xx thì thử lại hợp lý vì có khả năng đó là lỗi tạm thời, còn 4xx thì thử lại vô nghĩa vì request của ta sai và lần sau vẫn sai. Trục thứ ba, và là chỗ tôi thấy sai nhiều nhất: thử lại một thao tác **thay đổi dữ liệu** thì cần một khoá idempotent gửi kèm, nếu không ta có thể tạo hai giao dịch cho một lần thanh toán — và trường hợp nguy hiểm nhất là khi request thứ nhất **đã** thành công ở phía kia nhưng response bị timeout, vì lúc đó ta không hề biết nên thử lại hay không. Nên câu trả lời gọn của tôi là: chọn OpenFeign, rồi dành phần lớn sự chú ý cho timeout, chính sách thử lại theo status, và tính idempotent — vì đó là những thứ quyết định hệ thống của ta hành xử thế nào vào ngày phía kia gặp vấn đề.",
    redFlags: [
      "Chọn WebClient vì \"nó reactive nên nhanh hơn\" trong một ứng dụng đồng bộ",
      "Chọn RestTemplate cho mã mới",
      "Bàn xong API rồi không nói gì tới timeout",
      "Bật thử lại cho mọi status, kể cả 4xx",
      "Thử lại thao tác thay đổi dữ liệu mà không có khoá idempotent",
    ],
    probes: [
      "Vì sao phía kia **chậm** nguy hiểm hơn phía kia **chết**?",
      "Request đã thành công nhưng response bị timeout — bạn xử lý thế nào?",
      "Bạn đặt timeout bao nhiêu, và căn cứ vào đâu?",
    ],
    refs: ["springstart-11"],
  },
  {
    id: "springstart-iq20",
    field: "spring-start",
    topic: "ss-rest",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Ứng dụng thương mại điện tử có một endpoint thanh toán gọi sang hệ thống của đối tác. Lúc 10:15, đối tác bắt đầu trả lời chậm — từ 200 ms lên 45 giây, nhưng **không** trả lỗi. Trong 4 phút, toàn bộ ứng dụng ngừng phản hồi: cả trang chủ, trang tìm kiếm, trang đăng nhập — những trang không liên quan gì tới thanh toán — đều hết thời gian chờ.",
      scale: "Tomcat cấu hình 200 thread. Lưu lượng bình thường 900 request/phút, trong đó khoảng 40 là thanh toán. Ngừng phản hồi 26 phút, mất khoảng 11.000 lượt truy cập.",
      constraints: "Không tác động được lên hệ thống của đối tác. Phải có biện pháp triển khai được trong ngày. Không được làm mất giao dịch thanh toán nào đang dở.",
      },
    question: "Vì sao một endpoint chậm làm sập mọi endpoint khác? Nêu chẩn đoán, xử lý ngay, và thiết kế để lần sau nó không lan.",
    mustCover: [
      "Chi tiết quyết định: đối tác **chậm** mà không **lỗi** — nên lời gọi của ta không kết thúc, nó chỉ chờ",
      "Mỗi request thanh toán giữ một thread Tomcat suốt 45 giây thay vì 200 ms",
      "40 request/phút × 45 giây ≈ 30 thread bị giữ liên tục, và con số tăng vì request mới vẫn tới",
      "Khi 200 thread đều bị giữ, Tomcat **không còn thread** để phục vụ bất kỳ request nào",
      "Đó là lý do trang chủ và đăng nhập cũng sập: chúng không liên quan tới thanh toán nhưng **dùng chung** pool thread",
      "Gọi tên đúng: một tài nguyên dùng chung tạo ra **khớp nối ẩn** giữa các tính năng không liên quan",
      "Nguyên nhân cho phép nó xảy ra: lời gọi ra ngoài **không có timeout đọc**",
      "Xử lý ngay trong ngày: đặt timeout đọc cho lời gọi đối tác — biến \"chờ mãi\" thành \"lỗi nhanh\"",
      "Và ngắt mạch: sau N lỗi liên tiếp thì thôi gọi trong một khoảng, trả lỗi ngay cho endpoint thanh toán",
      "Thiết kế dài hạn: **cách ly tài nguyên** — thanh toán không được tiêu thread dùng chung của mọi endpoint",
      "Hoặc đúng hơn với nghiệp vụ: thanh toán thành **không đồng bộ** — nhận yêu cầu, trả 202, xử lý qua hàng đợi",
      "Giữ giao dịch đang dở: ghi ý định thanh toán vào lưu trữ bền **trước** khi gọi đối tác, rồi đối soát lại",
    ],
    model: "Chi tiết quyết định nằm trong chính mô tả: đối tác **chậm** chứ không **lỗi**. Nếu nó trả lỗi, lời gọi của ta kết thúc ngay và thread được giải phóng; vì nó chỉ chậm, lời gọi không kết thúc — thread của ta ngồi chờ. Từ đó phép tính rất đơn giản và nó khớp với thời gian sự cố: mỗi request thanh toán giữ một thread Tomcat 45 giây thay vì 200 ms, tức gấp hơn 200 lần. Với 40 request thanh toán mỗi phút, số thread bị giữ đồng thời khoảng 30 và tiếp tục cộng dồn vì request mới vẫn đến trong khi request cũ chưa xong. Sau vài phút, cả 200 thread đều bị giữ, và khi Tomcat không còn thread thì nó không phục vụ được request nào — kể cả trang chủ. Đó là câu trả lời cho câu hỏi trung tâm: trang chủ và đăng nhập không liên quan gì tới thanh toán về mặt nghiệp vụ, nhưng chúng dùng chung một pool thread, và một tài nguyên dùng chung là một khớp nối ẩn giữa những tính năng mà ta tưởng là độc lập. Nguyên nhân cho phép tất cả chuyện này xảy ra là lời gọi ra ngoài không có timeout đọc — và tôi muốn nhấn rằng thiếu timeout không phải một khiếm khuyết nhỏ về cấu hình, nó là điều biến một sự suy giảm ở hệ thống khác thành một sự cố ngừng hoạt động ở hệ thống của ta. Xử lý trong ngày, theo thứ tự tôi làm. Đầu tiên là đặt timeout đọc cho lời gọi đối tác, chọn theo phân vị cao của thời gian đáp ứng bình thường cộng một khoảng dư — cỡ vài giây, không phải 45. Nó biến \"chờ mãi\" thành \"lỗi nhanh\", nên thread quay về pool và các endpoint khác sống. Thứ hai là thêm ngắt mạch: sau một số lỗi liên tiếp thì thôi gọi đối tác trong một khoảng và trả lỗi ngay cho endpoint thanh toán. Điều này quan trọng vì timeout một mình vẫn để ta tiêu thread cho những lời gọi chắc chắn thất bại. Kết quả sau hai bước: thanh toán không dùng được trong lúc đối tác có vấn đề, nhưng phần còn lại của cửa hàng hoạt động bình thường — và đó là sự suy giảm đúng cách. Về thiết kế dài hạn tôi đề xuất hai tầng. Tầng thứ nhất là cách ly tài nguyên: thanh toán chỉ được dùng một hạn mức thread hay kết nối riêng, để nó không bao giờ tiêu hết tài nguyên dùng chung nữa — đây là biện pháp cấu trúc, nó chặn cả những lớp lỗi tương tự mà ta chưa nghĩ ra. Tầng thứ hai, và tôi cho là đúng hơn về nghiệp vụ: một lời gọi sang hệ thống bên ngoài không nên nằm trên đường đồng bộ của request. Ứng dụng nhận yêu cầu thanh toán, ghi nó vào lưu trữ bền, trả về 202 và xử lý qua hàng đợi. Khi đó độ chậm của đối tác chỉ làm hàng đợi dài hơn, không làm ai mất trang. Việc ghi ý định thanh toán vào lưu trữ bền **trước** khi gọi đối tác cũng đúng luôn ràng buộc \"không mất giao dịch đang dở\": với những request bị timeout trong 26 phút vừa rồi, ta không biết đối tác đã xử lý hay chưa, nên phải đối soát từng cái với họ — và nếu không có bản ghi ý định thì ta còn không biết có bao nhiêu cái cần đối soát.",
    redFlags: [
      "Tăng số thread Tomcat lên vài nghìn — chỉ dịch thời điểm sập, không chặn cơ chế",
      "Khởi động lại ứng dụng theo chu kỳ để dọn thread",
      "Chờ đối tác sửa, coi đây là lỗi của họ",
      "Đặt timeout nhưng không ngắt mạch, vẫn tiêu thread cho những lời gọi chắc chắn thất bại",
      "Không đối soát các giao dịch bị timeout, coi timeout là thất bại",
    ],
    probes: [
      "Vì sao tăng số thread không phải lời giải?",
      "Bạn chọn giá trị timeout bao nhiêu và căn cứ vào đâu?",
      "Với những request bị timeout, làm sao biết đối tác đã trừ tiền hay chưa?",
    ],
    refs: ["springstart-11", "springstart-07"],
  },

  // ===== ss-data (springstart-iq21–springstart-iq24) =====
  {
    id: "springstart-iq21",
    field: "spring-start",
    topic: "ss-data",
    level: 1,
    minutes: 5,
    question: "Data source là gì và vì sao ứng dụng cần nó? JDBC driver đóng vai gì trong bức tranh đó?",
    mustCover: [
      "JDK chỉ cung cấp **abstraction** để kết nối relational database, không cung cấp cài đặt cụ thể",
      "**JDBC driver** là runtime dependency cung cấp cài đặt cho một công nghệ cụ thể — do nhà cung cấp phát hành, không đến từ JDK hay Spring",
      "**Data source** là thành phần **quản lý các kết nối** tới DBMS",
      "Không có nó, ứng dụng phải mở kết nối mới cho **mỗi** thao tác — và mỗi lần mở là một vòng giao tiếp mạng cộng xác thực",
      "Điều đó làm ứng dụng chậm đáng kể, nên nó không dùng được trong môi trường thực tế",
      "Data source giữ một **pool** để tái sử dụng kết nối, chỉ mở kết nối mới khi cần, và đảm bảo đóng khi giải phóng",
      "Spring Boot mặc định cấu hình **HikariCP** làm data source",
      "Hệ quả cần nhớ: số kết nối trong pool là **hữu hạn**, nên nó là một tài nguyên có thể cạn",
    ],
    model: "Có ba tầng và tôi thấy nên kể theo thứ tự đó. Tầng dưới cùng: JDK cung cấp các abstraction để một ứng dụng Java nói chuyện với relational database, nhưng nó không cung cấp cài đặt cho công nghệ cụ thể nào. Vì thế ứng dụng luôn phải thêm một runtime dependency gọi là JDBC driver — nó do nhà cung cấp database phát hành, mỗi công nghệ một driver riêng, và nó không đến từ JDK cũng không đến từ Spring. Tầng giữa là data source, và đây là câu trả lời chính: nó là thành phần quản lý các kết nối tới DBMS. Nếu không có nó, ứng dụng sẽ dùng trực tiếp driver và mở một kết nối mới cho mỗi thao tác trên dữ liệu — mà mỗi lần mở gồm một vòng giao tiếp mạng cộng với xác thực. Cách đó xuất hiện trong các hướng dẫn Java cơ bản nhưng không dùng được trong môi trường thực tế, vì nó lãng phí thời gian và tài nguyên ở cả hai phía cho một việc chẳng liên quan gì tới dữ liệu. Data source giữ một pool kết nối để tái sử dụng: nó cấp kết nối khi ứng dụng cần, chỉ mở kết nối mới khi thực sự cần, và đảm bảo đóng kết nối khi chúng được giải phóng. Tầng trên cùng là những công cụ ta thực sự gọi — chẳng hạn `JdbcTemplate` — và chúng đều dựa trên data source. Spring Boot mặc định cấu hình HikariCP làm data source, nên trong hầu hết dự án ta có pool mà không phải viết dòng nào. Điều tôi luôn nói thêm, vì nó quan trọng khi hệ thống chịu tải: số kết nối trong pool là hữu hạn và thường nhỏ hơn nhiều so với số thread xử lý request. Nghĩa là kết nối database là một tài nguyên có thể cạn, và khi cạn thì mọi thứ dùng database đều phải chờ — nên biết pool tồn tại cũng là biết nó có thể trở thành điểm nghẽn.",
    redFlags: [
      "Cho rằng JDBC driver là một phần của JDK hay của Spring",
      "Nói data source chỉ là chỗ lưu URL, tên đăng nhập và mật khẩu",
      "Không biết pool kết nối là hữu hạn",
    ],
    probes: [
      "Vì sao mở kết nối mới cho mỗi thao tác lại đắt?",
      "Pool có bao nhiêu kết nối theo mặc định, và số đó nên so với cái gì?",
      "Khi nào bạn cần khai một bean data source tuỳ chỉnh?",
    ],
    refs: ["springstart-12"],
  },
  {
    id: "springstart-iq22",
    field: "spring-start",
    topic: "ss-data",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `@Service
public class TransferService {
    private final AccountRepository repo;

    public TransferService(AccountRepository repo) { this.repo = repo; }

    @Transactional
    public void transferMoney(long fromId, long toId, BigDecimal amount) {
        Account from = repo.findById(fromId);
        Account to   = repo.findById(toId);

        repo.changeAmount(fromId, from.getAmount().subtract(amount));   // (1)
        try {
            repo.changeAmount(toId, to.getAmount().add(amount));        // (2)
        } catch (RuntimeException e) {                                  // (3)
            log.error("Không nạp được vào tài khoản đích", e);          // (4)
        }
    }
}

// Đối soát cuối tháng: 37 lượt chuyển tiền có bản ghi log ở dòng (4).
// Với cả 37 lượt, tài khoản nguồn ĐÃ bị trừ và tài khoản đích KHÔNG được nạp.`,
    },
    question: "Phương thức có `@Transactional` mà tiền vẫn bốc hơi. Giải thích chính xác vì sao, rồi sửa.",
    mustCover: [
      "`@Transactional` được hiện thực bằng một **aspect** bọc lời gọi phương thức",
      "Aspect quyết định rollback khi phương thức **ném ngoại lệ ra ngoài** — nó chỉ thấy được điều đó",
      "Dòng (3) bắt ngoại lệ và dòng (4) chỉ ghi log, nên phương thức **kết thúc bình thường**",
      "Aspect không thấy ngoại lệ nào, nên nó **commit** — bao gồm việc trừ tiền ở dòng (1)",
      "Nên nghịch lý biến mất: transaction hoạt động đúng như thiết kế, mã đã che mất tín hiệu rollback",
      "Sửa cốt lõi: **bỏ** try/catch, để ngoại lệ ném ra ngoài phương thức transactional",
      "Nếu cần ghi log thì bắt rồi **ném lại** — ghi log không được đồng nghĩa với xử lý xong",
      "Điểm bẫy liên quan: mặc định Spring chỉ rollback với **runtime exception**, không với checked exception",
      "Nên nếu đổi sang một checked exception thì phải khai rõ trong thuộc tính của `@Transactional`",
      "37 lượt đã lệch phải được sửa dữ liệu riêng — sửa mã không hoàn tiền cho ai",
    ],
    model: "Không có nghịch lý nào ở đây, và nói được điều đó là phần quan trọng nhất. `@Transactional` được hiện thực bằng một aspect bọc lời gọi phương thức, và cách duy nhất aspect biết cần rollback là phương thức **ném ngoại lệ ra ngoài**. Dòng (3) bắt ngoại lệ và dòng (4) chỉ ghi log rồi để luồng chạy tiếp, nên `transferMoney` kết thúc bình thường. Từ góc nhìn của aspect, mọi thứ thành công — nên nó commit, và việc commit bao gồm cả câu trừ tiền ở dòng (1) đã thực thi trước đó. Nghĩa là transaction hoạt động đúng như thiết kế; chính mã đã che mất tín hiệu mà nó dựa vào. Tôi nhấn điều này vì nó là chỗ ngộ nhận phổ biến: người ta tưởng chỉ cần có ngoại lệ xảy ra **bên trong** phương thức là đủ, nhưng ngoại lệ bị bắt và không ném lại thì với aspect nó không tồn tại. Cách sửa cốt lõi là bỏ try/catch và để ngoại lệ ném ra ngoài. Nếu thật sự cần ghi log tại đây, tôi bắt rồi ném lại — vì ghi log không đồng nghĩa với xử lý xong, và đây đúng là trường hợp mà lẫn hai việc đó gây mất tiền. Tôi cũng sẽ nêu một điểm bẫy cùng họ vì nó rất dễ vấp khi refactor: mặc định Spring chỉ rollback với runtime exception, không với checked exception. Nên nếu ai đó đổi ngoại lệ này thành checked exception để \"buộc phía gọi xử lý\", thì transaction sẽ commit trở lại và lỗi quay về y nguyên mà không ai sửa gì ở logic — muốn rollback thì phải khai rõ loại ngoại lệ đó trong thuộc tính của `@Transactional`. Cuối cùng, phần mà tôi sẽ không để bị bỏ sót: 37 lượt đã lệch là tiền thật của người dùng. Sửa mã chặn lỗi trong tương lai nhưng không hoàn tiền cho ai, nên phải có một việc riêng để đối soát và sửa dữ liệu cho đúng 37 bản ghi đó — cộng với việc kiểm tra xem còn lượt nào bị lệch mà dòng (4) không ghi log được không.",
    redFlags: [
      "Thêm `rollbackFor = Exception.class` mà vẫn giữ try/catch — không có gì ném ra thì không có gì để rollback",
      "Tự gọi một API rollback thủ công thay vì để ngoại lệ ném ra",
      "Kết luận `@Transactional` không hoạt động, hoặc repository có lỗi",
      "Sửa mã rồi coi là xong, không xử lý 37 bản ghi đã lệch",
      "Đảo thứ tự (1) và (2) — vẫn mất tiền, chỉ đổi chiều mất",
    ],
    probes: [
      "Vì sao `rollbackFor` không giúp gì khi try/catch còn đó?",
      "Nếu đổi sang checked exception thì hành vi thay đổi thế nào?",
      "Bạn tìm những lượt bị lệch mà log không ghi được bằng cách nào?",
    ],
    refs: ["springstart-13"],
  },
  {
    id: "springstart-iq23",
    field: "spring-start",
    topic: "ss-data",
    level: 3,
    minutes: 10,
    question: "Ranh giới transaction đặt ở đâu — repository, service, hay controller? Và điều gì không được nằm trong ranh giới đó?",
    tradeoffs: [
      {
        option: "Ở phương thức service",
        when: "Mặc định đúng cho gần như mọi trường hợp: phương thức service là nơi một **use case** được hiện thực, và tính nguyên tử là tính chất của use case chứ không của từng câu truy vấn. Ranh giới trùng với đơn vị nghiệp vụ, nên nó dễ lập luận.",
      },
      {
        option: "Ở từng phương thức repository",
        when: "Chỉ đúng khi mỗi thao tác **là** một use case trọn vẹn. Đặt ở đây cho một use case nhiều bước là sai: mỗi bước commit riêng, nên không có gì để rollback khi bước sau thất bại.",
      },
      {
        option: "Ở controller",
        when: "Hầu như không bao giờ. Nó kéo cả việc chuyển đổi dữ liệu và tuần tự hoá response vào trong transaction, làm ranh giới dài ra mà không mua được gì.",
      },
    ],
    mustCover: [
      "Mặc định: ranh giới đặt ở **phương thức service** hiện thực use case",
      "Lý do: tính nguyên tử là tính chất của **use case**, không của từng câu truy vấn",
      "Đặt ở repository cho một use case nhiều bước là sai vì mỗi bước **commit riêng** — không còn gì để rollback",
      "Đặt ở controller kéo thêm việc chuyển đổi dữ liệu và tuần tự hoá vào ranh giới, làm nó dài ra vô ích",
      "Nguyên tắc thứ hai và quan trọng ngang: transaction **giữ một kết nối** trong suốt thời gian nó mở",
      "Nên độ dài của ranh giới trực tiếp quyết định việc pool kết nối có cạn hay không",
      "Từ đó: **không** đặt lời gọi mạng ra ngoài (HTTP, gửi thư, hàng đợi) bên trong transaction",
      "Vì phía kia chậm thì kết nối database bị giữ theo, dù nó chẳng làm gì với database",
      "Cũng không đặt vòng lặp xử lý hàng loạt trong một transaction dài — cắt thành lô",
      "Và lời gọi ra ngoài trong transaction còn sai về mặt logic: thư đã gửi thì rollback không thu lại được",
    ],
    model: "Mặc định của tôi rõ: ranh giới đặt ở phương thức service hiện thực use case. Lý do là tính nguyên tử vốn là tính chất của use case, không của từng câu truy vấn — \"chuyển tiền\" phải xảy ra trọn vẹn hay không xảy ra, còn \"cập nhật một dòng\" tự nó không có yêu cầu nào như vậy. Khi ranh giới trùng với đơn vị nghiệp vụ thì nó dễ lập luận: đọc tên phương thức là biết cái gì nguyên tử. Đặt ở từng phương thức repository là lỗi tôi gặp nhiều, và nó tệ theo cách âm thầm: mỗi bước commit riêng, nên khi bước thứ hai thất bại thì bước thứ nhất **đã** được lưu và không còn gì để rollback. Nhìn vào mã thì thấy `@Transactional` ở khắp nơi và cảm giác rất an toàn, trong khi thực tế không có bảo đảm nào cho use case. Đặt ở controller thì không sai về tính nguyên tử nhưng vô ích: nó kéo việc chuyển đổi dữ liệu và tuần tự hoá response vào trong ranh giới, làm transaction dài hơn mà không mua thêm bảo đảm nào. Phần thứ hai của câu hỏi tôi cho là quan trọng ngang, và nó đến từ một sự thật cơ học: một transaction giữ một kết nối database trong suốt thời gian nó mở. Kết nối là tài nguyên hữu hạn trong pool, nên độ dài của ranh giới transaction trực tiếp quyết định pool có cạn hay không. Từ đó ra quy tắc mạnh nhất của tôi về chủ đề này: không đặt lời gọi mạng ra ngoài bên trong transaction — không gọi HTTP sang hệ thống khác, không gửi thư, không đẩy vào hàng đợi. Nếu phía kia chậm mất 30 giây thì kết nối database bị giữ 30 giây dù nó chẳng làm gì với database, và với vài chục request đồng thời là pool cạn — lúc đó mọi tính năng dùng database đều chết, kể cả những tính năng không liên quan. Quy tắc tương tự áp cho vòng lặp xử lý hàng loạt: một transaction bọc mười nghìn bản ghi vừa giữ kết nối rất lâu vừa tích luỹ khoá, nên tôi cắt thành lô và mỗi lô một transaction, đánh đổi có ý thức là mất tính nguyên tử toàn cục để lấy lại khả năng vận hành. Và tôi muốn nêu thêm một lập luận không thuộc về tài nguyên: lời gọi ra ngoài trong transaction còn sai về mặt logic, vì rollback chỉ hoàn tác được thứ nằm trong database — thư đã gửi thì không thu lại được, tiền đã gọi đối tác trừ thì không tự quay về. Nên thứ tự tôi thiết kế luôn là: đóng transaction, xác nhận dữ liệu đã nhất quán, rồi mới làm những việc không thể hoàn tác.",
    redFlags: [
      "Đặt `@Transactional` ở mọi phương thức repository rồi tin use case đã nguyên tử",
      "Đặt `@Transactional` trên cả class controller cho tiện",
      "Gọi HTTP hay gửi thư bên trong transaction",
      "Bọc một vòng lặp hàng loạt trong một transaction duy nhất",
      "Không nhận ra transaction giữ một kết nối trong pool",
    ],
    probes: [
      "Vì sao `@Transactional` ở mỗi repository lại cho cảm giác an toàn sai?",
      "Cắt xử lý hàng loạt thành lô thì bạn mất bảo đảm gì, và bạn bù lại thế nào?",
      "Cần gửi thư sau khi chuyển tiền thành công — bạn đặt nó ở đâu để không mất thư?",
    ],
    refs: ["springstart-13", "springstart-12"],
  },
  {
    id: "springstart-iq24",
    field: "spring-start",
    topic: "ss-data",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Đội vừa phát hành tính năng xuất báo cáo: một endpoint quản trị quét toàn bộ bảng đơn hàng rồi dựng tệp. Từ hôm phát hành, mỗi lần có người bấm xuất báo cáo thì **toàn bộ** ứng dụng chậm thảm khốc trong 2–3 phút — mọi endpoint, kể cả những endpoint chỉ đọc một dòng. Log không có ngoại lệ nào; các request chỉ mất 20–40 giây thay vì 100 ms.",
      scale: "Pool kết nối 10 (mặc định Hikari), Tomcat 200 thread. Bảng đơn hàng 4,2 triệu dòng. Báo cáo được bấm 15–20 lần mỗi ngày, thường vào giờ cao điểm. Không có yêu cầu hỗ trợ nào nói về báo cáo — người dùng chỉ báo \"trang web lúc nhanh lúc chậm\".",
      constraints: "Báo cáo là yêu cầu của ban giám đốc, không được bỏ. Không được nâng cấu hình database trong quý này. Phải phân biệt được nguyên nhân với giả thuyết \"database yếu\" mà đội hạ tầng đang đưa ra.",
      },
    question: "Đội hạ tầng kết luận \"database yếu\" và xin nâng cấu hình. Bạn phân định giả thuyết đó bằng số đo nào, và bạn sửa gì?",
    mustCover: [
      "Manh mối quyết định: **mọi** endpoint chậm, kể cả endpoint chỉ đọc một dòng — nên nút thắt là thứ **dùng chung**",
      "Cặp số nói lên tất cả: pool **10** kết nối so với **200** thread — kết nối cạn rất lâu trước khi thread cạn",
      "Endpoint báo cáo quét 4,2 triệu dòng, nên nó giữ kết nối của mình trong hàng phút",
      "Vài lượt xuất báo cáo đồng thời là chiếm phần lớn pool, và mọi request khác phải **xếp hàng chờ** kết nối",
      "Vì thế chúng chậm 20–40 giây mà **không** lỗi — chờ kết nối không sinh ngoại lệ, nên log trống là điều dự đoán được",
      "Bác giả thuyết \"database yếu\": nếu DBMS là nút thắt thì thời gian **truy vấn** phải tăng, ở đây thời gian chờ nằm ở phía ứng dụng",
      "Cách chứng minh: đo thời gian chờ lấy kết nối từ pool và số kết nối đang hoạt động theo thời gian",
      "Bằng chứng khớp là: chờ-lấy-kết-nối tăng vọt đúng lúc bấm báo cáo, trong khi thời gian thực thi truy vấn không đổi",
      "Sửa theo cấu trúc, quan trọng nhất: **cách ly tài nguyên** — báo cáo dùng data source/pool riêng",
      "Thứ hai: báo cáo không chạy trên đường request — chuyển thành việc **không đồng bộ**, trả về tệp khi xong",
      "Thứ ba: đọc theo trang/dòng chảy thay vì nạp toàn bảng, và đặt giới hạn thời gian cho truy vấn",
      "Và nâng pool là biện pháp tình thế, không phải lời giải — nó chỉ nâng ngưỡng của cùng một cơ chế",
    ],
    model: "Manh mối quyết định là phạm vi của triệu chứng: **mọi** endpoint chậm, kể cả endpoint chỉ đọc một dòng. Một truy vấn đọc một dòng không thể chậm vì bảng đơn hàng lớn, nên nguyên nhân không nằm trong truy vấn — nó nằm ở một thứ mà mọi endpoint đều phải đi qua. Và cặp số trong đề bài chỉ thẳng vào thứ đó: pool 10 kết nối so với 200 thread Tomcat. Tức ứng dụng có thể nhận 200 request đồng thời nhưng chỉ 10 trong số đó chạm được database; kết nối cạn rất lâu trước khi thread cạn. Endpoint báo cáo quét 4,2 triệu dòng nên nó giữ kết nối của mình trong hàng phút, và chỉ cần vài lượt xuất đồng thời là phần lớn pool bị chiếm. Mọi request khác vào xếp hàng chờ một kết nối, và đó là nguồn của 20–40 giây. Chi tiết \"log không có ngoại lệ nào\" khớp hoàn hảo với chẩn đoán này và tôi coi nó là bằng chứng ủng hộ chứ không phải điều bí ẩn: chờ lấy kết nối không sinh ngoại lệ, request cuối cùng vẫn thành công, chỉ chậm — nên nếu ta chỉ dựa vào log lỗi thì lớp sự cố này vô hình. Về giả thuyết \"database yếu\" của đội hạ tầng, tôi bác nó bằng một lập luận kiểm chứng được: nếu DBMS là nút thắt thì thời gian **thực thi truy vấn** phải tăng lên, kể cả với truy vấn đọc một dòng. Nên cách chứng minh là đo tách hai đại lượng — thời gian chờ lấy kết nối từ pool, và thời gian thực thi truy vấn sau khi đã có kết nối — rồi vẽ theo thời gian cùng với số kết nối đang hoạt động. Nếu chẩn đoán của tôi đúng, ta sẽ thấy chờ-lấy-kết-nối tăng vọt đúng vào các thời điểm bấm báo cáo, số kết nối hoạt động dính trần 10, trong khi thời gian thực thi truy vấn phẳng. Đó là một dự đoán cụ thể và nó phân định được hai giả thuyết, nên tôi muốn đo trước khi đề nghị ai mua gì. Về cách sửa, tôi sắp theo thứ tự giá trị. Quan trọng nhất là cách ly tài nguyên: báo cáo dùng một data source với pool riêng, nhỏ, tách khỏi pool phục vụ request người dùng. Nó chặn đúng cơ chế gây sự cố — một tính năng nặng không còn tiêu được tài nguyên của mọi tính năng khác — và nó là biện pháp cấu trúc, nghĩa là nó cũng chặn những tính năng nặng mà ta chưa viết. Thứ hai, báo cáo không nên chạy trên đường request đồng bộ: người dùng bấm, ứng dụng nhận việc và trả về ngay, báo cáo được dựng ở tiến trình nền rồi thông báo khi có tệp. Điều này cũng đúng về mặt trải nghiệm, vì một báo cáo hàng phút không nên là một request HTTP đang treo. Thứ ba là sửa chính truy vấn: đọc theo trang hoặc theo dòng chảy thay vì nạp toàn bảng vào bộ nhớ, và đặt giới hạn thời gian cho truy vấn để một lượt xuất bất thường không thể giữ kết nối vô hạn. Điều tôi sẽ nói rõ là nâng pool từ 10 lên, chẳng hạn, 50: nó giảm đau thật và tôi có thể làm ngay, nhưng nó chỉ nâng ngưỡng của đúng cơ chế cũ — thêm người bấm báo cáo là sập lại, và nó còn đẩy tải lên DBMS mà ràng buộc không cho nâng cấu hình. Nên tôi dùng nó như biện pháp tình thế và nói thẳng rằng nó không phải lời giải. Cuối cùng, một quan sát về vận hành: người dùng báo \"trang web lúc nhanh lúc chậm\" còn không ai báo về báo cáo, nghĩa là tín hiệu từ người dùng chỉ vào **hậu quả** chứ không vào nguyên nhân. Đó là lý do tôi muốn có sẵn số đo về pool kết nối — không có nó, lớp sự cố này chỉ được tìm ra bằng cách đoán.",
    redFlags: [
      "Nâng pool kết nối rồi coi là đã sửa",
      "Chấp nhận giả thuyết \"database yếu\" và đề nghị nâng cấu hình",
      "Tăng số thread Tomcat — nút thắt là kết nối, không phải thread",
      "Đề nghị bỏ tính năng báo cáo, trái ràng buộc",
      "Chỉ tối ưu truy vấn báo cáo mà không cách ly tài nguyên — một lượt xuất vẫn tiêu pool dùng chung",
      "Kết luận \"không có lỗi trong log nên không có vấn đề ở ứng dụng\"",
    ],
    probes: [
      "Hai đại lượng bạn đo tách nhau ra là gì, và mỗi kết quả loại bỏ giả thuyết nào?",
      "Pool riêng cho báo cáo nên có mấy kết nối, và bạn suy ra từ đâu?",
      "Vì sao \"log không có ngoại lệ\" lại là bằng chứng ủng hộ chẩn đoán của bạn?",
    ],
    refs: ["springstart-12", "springstart-13"],
  },
];
