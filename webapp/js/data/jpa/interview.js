// Ngân hàng câu hỏi phỏng vấn JPA — 24 câu, 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Java Persistence with Spring Data and Hibernate
// (Cătălin Tudose — Manning). Mỗi câu trỏ chương nguồn qua `refs` để tra ngược.
//
// Thang cấp độ lấy nguyên từ ma trận năng lực Senior Java (senior-java/matrix.js):
//   1 Hiểu lý thuyết · 2 Thực thi mã nguồn · 3 Phân tích đánh đổi ·
//   4 Thiết kế & xử lý sự cố
//
// HỢP ĐỒNG THEO CẤP (check-data.mjs nhóm #IQ ép, không phải gợi ý):
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (jpa-iq01–jpa-iq24) — thống kê tự chấm trong localStorage lưu theo id.

export const jpaInterview = [
  // ===== jpa-mapping — Ánh xạ & domain model (jpa-iq01–jpa-iq04) =====
  {
    id: "jpa-iq01",
    field: "jpa",
    topic: "jpa-mapping",
    level: 1,
    minutes: 5,
    question: "Trong domain model của một sàn đấu giá, bạn có `User`, `Address` và `Bid`. Bạn dựa vào đâu để quyết định mỗi class là entity hay value type, và chọn sai thì hỏng ở đâu?",
    mustCover: [
      "Tiêu chí quyết định là **tham chiếu dùng chung**: nếu nhiều instance khác có thể trỏ tới cùng một instance thì nó cần identity riêng, tức là entity",
      "Value type có **vòng đời phụ thuộc** vật chứa — xoá `User` thì `Address` của nó cũng phải biến mất, nên metadata phải khai quy tắc cascade tương ứng",
      "Entity cần property định danh; value type **không có** property định danh vì được định danh thông qua entity sở hữu nó",
      "Sách khuyên phản ứng đầu tiên là coi mọi thứ là value type và chỉ nâng lên entity khi thật sự cần — `Bid` là ví dụ nằm giữa, nó đổi phe ngay khi cần một collection `User#bids` hai chiều",
    ],
    model: "Ranh giới không nằm ở chỗ class đó có bảng riêng hay không, mà ở chỗ có ai khác trỏ tới nó không. `User` và `Item` rõ ràng là entity: mỗi cái có identity riêng, được nhiều instance khác tham chiếu, và tuổi đời độc lập. `Address` là value type vì association được mô hình hoá dưới dạng composition — đúng một `User` chịu trách nhiệm về vòng đời của nó, nên nó không cần identity riêng; để giữ đúng tính chất đó, sách gợi ý làm `Address` bất biến, bỏ `setUser()` public và ép quan hệ qua constructor nhận `User`. `Bid` mới là ca đáng bàn: hiện tại association từ `Bid` tới `User` là một chiều nên `Bid` là value type, identity của nó do `Item` và `User` định nghĩa. Nhưng nếu domain model mở rộng và cần `User#bids`, sẽ có tham chiếu dùng chung tới cùng một `Bid`, và lúc đó `Bid` **buộc phải** là entity — vòng đời vẫn phụ thuộc, nhưng identity thì phải có. Chọn sai theo hướng nâng mọi thứ thành entity làm các association phình ra mà không đổi lại lợi thế nào; chọn sai theo hướng ngược lại thì không thể chia sẻ tham chiếu và phải sửa ánh xạ về sau. Lưu ý value type vẫn có thể nằm ở bảng riêng — bảng riêng không phải dấu hiệu của entity.",
    redFlags: [
      "Cho rằng value type chỉ là kiểu nguyên thuỷ hoặc class JDK như `String`, `Integer` — `Address` là class do ta viết và vẫn là value type",
      "Lấy \"có bảng riêng\" làm tiêu chí phân biệt: sách nói thẳng `Bid` là value type nhưng điều đó không có nghĩa nó không nằm trong table riêng",
      "Trả lời bằng danh sách annotation (`@Entity` với `@Embeddable`) mà không chạm tới tham chiếu dùng chung và vòng đời — đó là cách ánh xạ, không phải lý do chọn",
    ],
    probes: [
      "Nếu sau này cần `User#bids`, `Bid` phải đổi thành gì và bạn phải sửa những gì trong ánh xạ?",
      "Làm sao ép ở mức mã nguồn rằng không `Address` nào bị hai `User` cùng trỏ tới?",
      "Sách gợi ý thay vì ánh xạ cả `Item#bids` lẫn `User#bids` thì nên làm gì?",
    ],
    refs: ["jpa-05"],
  },
  {
    id: "jpa-iq02",
    field: "jpa",
    topic: "jpa-mapping",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `@Entity
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Item)) return false;
        return Objects.equals(id, ((Item) o).id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

// Trong một service:
Set<Item> batch = new HashSet<>();
Item item = new Item("Bàn phím cơ");
batch.add(item);

entityManager.persist(item);

boolean found = batch.contains(item);   // ???
for (Item i : batch) { /* ... */ }`,
    },
    question: "Đoạn này in ra `false` ở dòng `contains`, dù `item` chính là object vừa bỏ vào `batch`. Giải thích vì sao, rồi sửa lại.",
    mustCover: [
      "Với `GenerationType.IDENTITY`, giá trị khoá chỉ được sinh **khi `INSERT` dòng**, nên trước đó `id` còn `null`",
      "`HashSet` chọn bucket theo `hashCode()` **lúc thêm vào**; `persist` gán `id` làm `hashCode()` đổi, object nằm lại ở bucket cũ nên `contains` tra nhầm chỗ",
      "Cách sửa thứ nhất: `equals`/`hashCode` theo **business key** ổn định, hoặc trả `hashCode()` hằng số và chỉ so `id` trong `equals` có phòng `null`",
      "Cách sửa thứ hai: chuyển sang chiến lược sinh **trước `INSERT`** như `enhanced-sequence`, để `id` có giá trị ngay khi `persist` xếp hàng thao tác",
    ],
    model: "Vấn đề nằm ở chỗ khoá băm của object thay đổi trong lúc nó đang nằm trong một `HashSet`. `GenerationType.IDENTITY` ánh xạ tới chiến lược `identity` của Hibernate, vốn dựa vào cột `IDENTITY`/auto-increment và **chỉ có giá trị sau khi dòng được chèn**. Lúc `batch.add(item)` chạy, `id` là `null` nên `hashCode()` là `Objects.hash((Object) null)`; `HashSet` cất object vào bucket ứng với giá trị đó. Sau `persist`, `id` được gán, `hashCode()` trả về số khác, còn object thì vẫn nằm ở bucket cũ — `contains` đi tìm ở bucket mới và không thấy gì. Sách cảnh báo chính cơ chế này khi bàn về sinh định danh trước hay sau `INSERT`: gọi `getId()` sau `persist` vẫn có thể nhận `null` nếu engine không sinh được khoá trước `INSERT`. Có hai đường sửa. Đường thứ nhất là bỏ `id` khỏi khoá băm: dùng một business key ổn định và không bao giờ đổi, hoặc giữ `equals` theo `id` nhưng cho `hashCode()` trả về một hằng cho cả class. Đường thứ hai, mà sách ưa hơn ở tầng ánh xạ, là chuyển sang chiến lược sinh trước `INSERT` — `enhanced-sequence` dùng sequence native khi DBMS hỗ trợ và lùi về một bảng mô phỏng sequence khi không — để `id` đã có giá trị trước khi object kịp đi vào bất kỳ collection băm nào.",
    redFlags: [
      "Đổi sang `GenerationType.AUTO` rồi coi là xong — `AUTO` vẫn có thể phân giải thành `identity` tuỳ dialect, và bài toán khoá băm đổi giữa chừng không hề mất đi",
      "Bỏ hẳn `equals`/`hashCode` để \"cho an toàn\" — khi đó hai instance cùng trỏ một dòng database lại không bằng nhau, và `Set` mất đúng ngữ nghĩa mình cần",
      "Đổ lỗi cho `HashSet` và chuyển sang `ArrayList` — che triệu chứng, để nguyên lỗi ở chỗ khoá băm không ổn định",
    ],
    probes: [
      "Nếu buộc phải giữ `IDENTITY` vì schema có sẵn, bạn viết `equals`/`hashCode` thế nào?",
      "Vì sao sách nói `persist()` chỉ xếp hàng thao tác chèn chứ không chạy `INSERT` ngay, và điều đó liên quan gì tới câu hỏi này?",
      "Cùng lỗi này biểu hiện thế nào trong một `@OneToMany` ánh xạ bằng `Set`?",
    ],
    refs: ["jpa-05", "jpa-03"],
  },
  {
    id: "jpa-iq03",
    field: "jpa",
    topic: "jpa-mapping",
    level: 3,
    minutes: 10,
    question: "Bạn có cây phân cấp `BillingDetails` với hai lớp con `CreditCard` và `BankAccount`. Bạn chọn chiến lược ánh xạ inheritance nào, và điều gì khiến bạn đổi ý?",
    tradeoffs: [
      {
        option: "`InheritanceType.SINGLE_TABLE` — table per class hierarchy",
        when: "Cần association hoặc truy vấn đa hình, **và** lớp con khai tương đối ít property — đặc biệt khi khác biệt chính giữa chúng nằm ở hành vi chứ không ở dữ liệu. Chỉ chọn khi số cột buộc phải cho phép `null` là ít, và bạn thuyết phục được cả chính mình lẫn DBA rằng schema phi chuẩn hoá không gây vấn đề lâu dài.",
      },
      {
        option: "`InheritanceType.JOINED` — table per subclass với join",
        when: "Cần đa hình, **và** lớp con khai nhiều property không tuỳ chọn — tức các lớp con khác nhau chủ yếu ở dữ liệu chúng chứa. Đây cũng là lựa chọn khi ràng buộc `NOT NULL` và tính chuẩn hoá được người mô hình hoá dữ liệu đặt lên trên.",
      },
      {
        option: "`InheritanceType.TABLE_PER_CLASS` — table per concrete class với union",
        when: "Không bao giờ hoặc hiếm khi viết truy vấn kiểu `select bd from BillingDetails bd`, và không class nào có association tới superclass. Cũng cân nhắc khi cây phân cấp rộng hoặc sâu khiến chi phí `JOIN` vượt chi phí `UNION` — quyết định này nên dựa trên kế hoạch thực thi SQL với dữ liệu thật.",
      },
    ],
    mustCover: [
      "Hai trục quyết định của sách là: có cần association hay truy vấn đa hình không, và lớp con khác nhau ở **dữ liệu** hay ở **hành vi**",
      "Chiến lược gộp một bảng buộc mọi cột riêng của lớp con phải cho phép `null`, tức đánh đổi tính chuẩn hoá lấy tốc độ truy vấn không `JOIN`",
      "Sách chỉ đặt `SINGLE_TABLE` làm mặc định cho **bài toán đơn giản**; ca phức tạp nên nghiêng về `JOINED`",
      "Khi cây phân cấp đủ phức tạp để phải cân nhắc trộn chiến lược, câu hỏi đúng là có nên mô hình hoá lại inheritance thành **delegation** hay không",
    ],
    model: "Sách đưa ra ba quy tắc kinh nghiệm theo đúng hai trục. Không cần đa hình thì nghiêng về table-per-concrete-class, và nên dùng bản tường minh dựa trên `UNION` với `InheritanceType.TABLE_PER_CLASS` thay vì đa hình ngầm định, vì như vậy truy vấn và association đa hình vẫn khả thi về sau. Cần đa hình mà lớp con ít property thì nghiêng về `InheritanceType.SINGLE_TABLE` — đổi lại phải chấp nhận các cột của lớp con đều nullable, nên chỉ hợp lý khi số cột đó nhỏ. Cần đa hình mà lớp con nhiều property bắt buộc thì nghiêng về `InheritanceType.JOINED`, hoặc `TABLE_PER_CLASS` nếu chiều rộng và chiều sâu của cây khiến `JOIN` đắt hơn `UNION` — và sách nói rõ quyết định này có thể phải dựa vào việc đọc kế hoạch thực thi SQL với dữ liệu thực chứ không suy luận suông. Mặc định nên là `SINGLE_TABLE` cho bài toán đơn giản; khi tính chuẩn hoá và `NOT NULL` được đặt nặng thì chuyển sang `JOINED`. Và ở đúng thời điểm bắt đầu muốn trộn chiến lược, sách khuyên lùi lại một bước để tự hỏi liệu mô hình hoá lại inheritance thành delegation có tốt hơn không — inheritance phức tạp thường nên tránh vì nhiều lý do chẳng liên quan gì tới ORM.",
    redFlags: [
      "Nói `JOINED` luôn tốt nhất vì chuẩn hoá — bỏ qua chi phí `JOIN` mà chính sách bảo phải đo bằng kế hoạch thực thi trên dữ liệu thật",
      "Chọn theo số bảng cho gọn thay vì theo nhu cầu đa hình — đây chính là trục thứ nhất của sách và bỏ qua nó là bỏ qua cả bài toán",
      "Quên rằng gộp một bảng buộc phải nới `NOT NULL` trên các cột riêng của lớp con, rồi ngạc nhiên khi DBA phản đối",
    ],
    probes: [
      "Nếu `CreditCard` có 12 cột bắt buộc còn `BankAccount` có 3, lựa chọn của bạn đổi thế nào?",
      "Bạn đặt annotation inheritance lên một interface được không, và vì sao?",
      "Hibernate trả lời `select o from ElectronicPaymentOption o` bằng cách nào khi interface đó không có khía cạnh persistence?",
    ],
    refs: ["jpa-07"],
  },
  {
    id: "jpa-iq04",
    field: "jpa",
    topic: "jpa-mapping",
    level: 4,
    minutes: 12,
    incident: {
      symptom: "Sàn đấu giá mở thị trường thứ hai và phải hỗ trợ nhiều loại tiền tệ. Cột `ITEM.BUYNOWPRICE` hiện là `NUMERIC(10,2)` và toàn bộ mã nguồn ngầm hiểu đó là một loại tiền duy nhất. Bản build đầu tiên thêm cột đơn vị tiền tệ làm `hbm2ddl` sinh schema lệch với schema đang chạy, và một job đêm đọc thẳng bảng đã ghi nhầm số tiền của thị trường mới vào đơn vị cũ.",
      scale: "4,2 triệu dòng `ITEM`, 11 dịch vụ khác nhau đọc bảng này, trong đó 3 dịch vụ không do đội bạn sở hữu và có dịch vụ đọc bằng SQL thuần chứ không qua JPA.",
      constraints: "Không được downtime quá 5 phút, không được sửa đồng thời 11 dịch vụ trong một lần phát hành, và dữ liệu lịch sử phải đọc lại được đúng giá trị cũ để đối soát.",
    },
    question: "Bạn chẩn đoán và xử lý tình huống này thế nào?",
    mustCover: [
      "Tách bạch hai việc khác nhau: đổi **kiểu trong domain model** và đổi **schema cơ sở dữ liệu** — sách nêu đúng ba mặt phải làm là sửa schema, di trú dữ liệu hiện có, và cập nhật mọi ứng dụng truy cập database",
      "Đưa vào một class value type **bất biến** mang cả số tiền lẫn đơn vị, rồi ánh xạ nó bằng JPA converter — converter đóng vai vùng đệm linh hoạt giữa ứng dụng và cơ sở dữ liệu",
      "Di trú nhiều pha: thêm cột mới cho phép `null`, backfill giá trị đơn vị cũ, rồi mới siết ràng buộc — để 11 dịch vụ chuyển dần thay vì cùng lúc",
      "Tắt sinh schema tự động trên môi trường chạy thật và chuyển sang script di trú có phiên bản, vì chính `hbm2ddl` là thứ tạo ra chênh lệch",
      "Dịch vụ đọc bằng SQL thuần **không** đi qua converter, nên vùng đệm của converter không che được chúng — phải xử lý riêng",
    ],
    model: "Triệu chứng có hai nguồn khác nhau và phải tách ra trước. Nguồn thứ nhất là sinh schema tự động: để `hbm2ddl` quyết định hình dạng bảng trên môi trường thật nghĩa là mỗi lần đổi ánh xạ là một lần schema trôi, nên việc đầu tiên là tắt nó và chuyển sang script di trú có phiên bản. Nguồn thứ hai là giả định ngầm \"một loại tiền\" nằm rải trong mã nguồn, và đây mới là phần khó. Sách mô tả đúng tình huống này khi giới thiệu converter: hỗ trợ nhiều loại tiền tệ đòi hỏi sửa schema, di trú dữ liệu hiện có, và cập nhật mọi ứng dụng truy cập cơ sở dữ liệu — rồi chỉ ra JPA converter cùng hệ thống kiểu mở rộng được của Hibernate là vùng đệm giúp làm việc đó dần dần. Cụ thể: đưa vào một class value type bất biến giữ cả giá trị lẫn đơn vị tiền tệ, ánh xạ qua một converter, và di trú theo pha — thêm cột đơn vị cho phép `null`, backfill bằng đơn vị cũ cho toàn bộ 4,2 triệu dòng theo lô, rồi mới đặt `NOT NULL`. Nhờ cột mới có `null`-able ở pha đầu, các dịch vụ chưa chuyển vẫn chạy được và 11 dịch vụ có thể lần lượt cập nhật thay vì phải phát hành đồng thời. Điểm phải nói rõ với người phỏng vấn là giới hạn của cách này: converter chỉ có tác dụng với đường đi qua JPA, nên dịch vụ đọc bằng SQL thuần vẫn thấy hai cột trần và phải được xử lý riêng — hoặc bọc lại sau một view, hoặc chuyển nó sang đọc qua API. Còn yêu cầu đối soát lịch sử thì được thoả mãn miễn là ta chỉ **thêm** cột chứ không viết đè cột giá trị cũ.",
    redFlags: [
      "Đề xuất một lần phát hành lớn sửa hết 11 dịch vụ cùng lúc — ràng buộc của đề bài đã loại bỏ phương án này",
      "Nói converter giải quyết trọn vẹn bài toán mà không nhận ra dịch vụ đọc SQL thuần hoàn toàn không đi qua nó",
      "Giữ `hbm2ddl` sinh schema và chỉ thêm annotation, tức là để nguyên đúng cơ chế đã gây ra chênh lệch schema",
      "Ghi đè cột giá trị cũ trong lúc backfill, làm mất khả năng đối soát dữ liệu lịch sử",
    ],
    probes: [
      "Bạn backfill 4,2 triệu dòng thế nào để không khoá bảng quá 5 phút?",
      "Khi nào bạn chọn `UserType` của Hibernate thay vì JPA converter chuẩn?",
      "Nếu class mang số tiền không bất biến thì hỏng ở đâu?",
    ],
    refs: ["jpa-06", "jpa-05"],
  },
];
