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

  // ===== jpa-assoc — Collection & association (jpa-iq05–jpa-iq08) =====
  {
    id: "jpa-iq05",
    field: "jpa",
    topic: "jpa-assoc",
    level: 1,
    minutes: 5,
    question: "Trong một association hai chiều `Item` ↔ `Bid`, tham số `mappedBy` nói lên điều gì, và nếu chỉ cập nhật collection bên `Item` mà quên gán `bid.setItem(item)` thì chuyện gì xảy ra?",
    mustCover: [
      "`mappedBy` chỉ ra rằng phía này **không** sở hữu quan hệ: nó bảo Hibernate nạp collection bằng cột foreign key đã được ánh xạ bởi property được nêu tên",
      "Phía sở hữu là phía có cột foreign key — ở đây là `Bid#item` ánh xạ bằng `@ManyToOne`, vì cột `ITEM_ID` nằm trên bảng `BID`",
      "Chỉ phía sở hữu mới sinh ra `UPDATE` cột khoá ngoại; thêm vào collection nghịch không ghi gì xuống, nên khoá ngoại vẫn `null` hoặc giữ giá trị cũ",
      "`mappedBy` là **bắt buộc** khi association một-nhiều là hai chiều và cột khoá ngoại đã được ánh xạ ở phía kia",
    ],
    model: "Một association hai chiều trong JPA vẫn chỉ là **một** cột khoá ngoại trong cơ sở dữ liệu, và hai property Java cùng nhìn vào cột đó. `mappedBy` là cách nói ai không chịu trách nhiệm: đặt `@OneToMany(mappedBy = \"item\")` trên `Item#bids` nghĩa là collection này được nạp từ cột khoá ngoại mà property `Bid#item` đã ánh xạ, chứ bản thân nó không ánh xạ cột nào. Phía sở hữu là `Bid`, vì cột `ITEM_ID` nằm trên bảng `BID` và được ánh xạ bằng `@ManyToOne`. Hệ quả trực tiếp: khi chỉ gọi `item.getBids().add(bid)`, không có gì được ghi xuống — phía nghịch không sinh câu lệnh cập nhật khoá ngoại — nên hoặc bản ghi không được lưu, hoặc được lưu với `ITEM_ID` là `null`. Tệ hơn, trong cùng một persistence context thì collection trong bộ nhớ trông vẫn đúng, nên lỗi chỉ lộ ra sau khi context đóng và dữ liệu được đọc lại. Vì vậy thành ngữ chuẩn là viết một hàm tiện ích đặt cả hai phía trong một lần gọi. Sách cũng lưu ý mặc định `fetch` của mọi ánh xạ collection là `FetchType.LAZY`, và đó là mặc định tốt — `EAGER` hiếm khi cần.",
    redFlags: [
      "Nói `mappedBy` chỉ để \"tránh tạo bảng nối\" — nó nói về quyền sở hữu cột khoá ngoại, không phải về bảng nối",
      "Khẳng định Hibernate tự đồng bộ hai phía; nó không làm vậy, và ảo giác đó bền vì trong cùng persistence context collection trông vẫn đúng",
      "Đề nghị bỏ `mappedBy` cho \"cả hai phía cùng ghi\" — khi đó JPA coi đây là hai association riêng biệt và sinh thêm bảng nối",
    ],
    probes: [
      "Vì sao lỗi này thường chỉ lộ ra ở lần đọc sau khi persistence context đã đóng?",
      "Nếu bỏ hẳn `mappedBy` khỏi `@OneToMany` thì schema sinh ra khác thế nào?",
      "Sách liệt kê những lợi ích nào của việc ánh xạ collection `Item#bids`, và nói cái giá là gì?",
    ],
    refs: ["jpa-08"],
  },
  {
    id: "jpa-iq06",
    field: "jpa",
    topic: "jpa-assoc",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Entity
public class Item {
    @Id @GeneratedValue
    private Long id;

    @OneToMany(mappedBy = "item", cascade = CascadeType.PERSIST)
    private Set<Bid> bids = new HashSet<>();

    public Set<Bid> getBids() { return bids; }
}

@Entity
public class Bid {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    private Item item;

    public void setItem(Item item) { this.item = item; }
}

// Trong service:
@Transactional
public void addBid(Long itemId, BigDecimal amount) {
    Item item = itemRepository.findById(itemId).orElseThrow();
    Bid bid = new Bid(amount);
    item.getBids().add(bid);          // chỉ đụng một phía
}`,
    },
    question: "Sau khi method này chạy xong, bảng `BID` có thêm dòng mới nhưng cột `ITEM_ID` lại là `NULL`. Giải thích cơ chế, rồi sửa cho đúng.",
    mustCover: [
      "Cascade `PERSIST` từ collection khiến `Bid` **được lưu**, nên có dòng mới — đó là lý do triệu chứng là `NULL` chứ không phải mất hẳn bản ghi",
      "Nhưng cột khoá ngoại do phía sở hữu `Bid#item` quyết định, và property đó chưa bao giờ được gán nên ghi xuống `null`",
      "Sửa bằng một hàm tiện ích đặt **cả hai phía** trong một lần gọi, đặt trên entity cha để không chỗ gọi nào quên được",
      "Hàm gỡ liên kết cũng phải đối xứng: xoá khỏi collection **và** gán `null` cho phía sở hữu, nếu không dòng cũ vẫn giữ khoá ngoại",
    ],
    model: "Hai chuyện độc lập đang xảy ra cùng lúc. Việc dòng mới xuất hiện là nhờ `cascade = CascadeType.PERSIST`: khi persistence context flush, `Item` đang ở trạng thái được quản lý nên thao tác lưu lan sang mọi `Bid` trong collection, và `INSERT` chạy. Việc `ITEM_ID` là `NULL` thì thuộc về quyền sở hữu quan hệ: `Item#bids` khai `mappedBy` nên nó chỉ đọc cột khoá ngoại chứ không ghi; giá trị cột hoàn toàn do `Bid#item` quyết định, mà property ấy chưa được gán. Cách sửa đúng là không để chỗ gọi phải nhớ hai bước — đặt một hàm tiện ích trên `Item` làm cả hai việc: thêm vào collection rồi gọi `bid.setItem(this)`. Và phải làm đối xứng cho chiều gỡ: chỉ `bids.remove(bid)` là chưa đủ, phải `bid.setItem(null)` thì dòng cũ mới thôi trỏ về `Item`. Một điểm dễ bỏ sót khi kiểm thử: nếu viết assert ngay trong cùng transaction, `item.getBids()` vẫn trả về bid vừa thêm dù cột khoá ngoại sai, vì ta đang đọc collection trong bộ nhớ chứ không đọc lại từ database — test phải flush và clear persistence context trước khi kiểm.",
    redFlags: [
      "Thêm `@JoinColumn(nullable = false)` rồi coi là đã sửa — đó chỉ đổi lỗi `NULL` âm thầm thành lỗi ràng buộc, nguyên nhân vẫn nguyên",
      "Đổ lỗi cho cascade: cascade đang hoạt động đúng như khai báo, vấn đề nằm ở phía sở hữu chưa được gán",
      "Viết test assert trong cùng transaction rồi kết luận đã sửa xong — collection trong bộ nhớ che mất cột khoá ngoại sai",
    ],
    probes: [
      "Viết hàm gỡ liên kết cho đúng đối xứng, và nói rõ nó phải làm những gì",
      "Nếu đổi `Set<Bid>` sang `Collection<Bid>` khởi tạo bằng `ArrayList` thì hành vi nạp đổi thế nào?",
      "Vì sao thêm phần tử vào một bag không kích hoạt nạp collection, còn thêm vào set thì có?",
    ],
    refs: ["jpa-08"],
  },
  {
    id: "jpa-iq07",
    field: "jpa",
    topic: "jpa-assoc",
    level: 3,
    minutes: 9,
    question: "Bạn ánh xạ `Item#bids` — một collection có thể rất lớn và được thêm phần tử liên tục. Chọn kiểu collection nào ở phía nghịch, và khi nào bạn đổi ý?",
    tradeoffs: [
      {
        option: "Bag — `Collection<Bid>` khởi tạo bằng `ArrayList`, `@OneToMany(mappedBy = \"item\")`",
        when: "Collection có thể rất lớn và thao tác chính là **thêm** phần tử. Bag không phải giữ chỉ số như list, cũng không phải kiểm tra trùng lặp như set, nên thêm phần tử mới **không kích hoạt nạp** collection. Sách gọi đây là collection nghịch tốt nhất cho một association một-nhiều ánh xạ bằng `mappedBy`.",
      },
      {
        option: "`Set<Bid>` khởi tạo bằng `HashSet`",
        when: "Cần ngữ nghĩa không trùng lặp và collection đủ nhỏ để việc nạp khi thêm phần tử không thành vấn đề. Đây là lựa chọn mọi JPA provider đều hỗ trợ, nên hợp khi cần khả chuyển ngoài Hibernate.",
      },
      {
        option: "`List<Bid>` với `@OrderColumn`",
        when: "Thứ tự phần tử là **dữ liệu nghiệp vụ** cần lưu lại, chứ không phải thứ tự hiển thị tính được lúc truy vấn. Đắt hơn hẳn vì Hibernate phải duy trì cột chỉ số; nếu chỉ cần sắp xếp lúc đọc thì dùng `ORDER BY` khi nạp, hoặc sắp trong bộ nhớ bằng comparator.",
      },
    ],
    mustCover: [
      "Trục quyết định thứ nhất là **chi phí nạp khi thêm phần tử**: bag thêm được mà không nạp, set và list thì phải nạp trước",
      "Trục thứ hai là ngữ nghĩa cần giữ: cho phép trùng lặp hay không, và thứ tự có phải dữ liệu phải lưu hay không",
      "Sách phân biệt **sắp xếp** trong bộ nhớ bằng comparator với **sắp thứ tự** khi nạp bằng mệnh đề `ORDER BY` của SQL — hai cơ chế khác nhau",
      "Giới hạn của bag: không eager-fetch được hai bag cùng lúc, vì các câu `SELECT` sinh ra độc lập với nhau",
      "Nhưng giới hạn đó không phải mất mát lớn, vì nạp hai collection cùng lúc luôn dẫn tới tích Descartes bất kể kiểu collection nào",
    ],
    model: "Sách trả lời câu này khá dứt khoát cho đúng tình huống đang hỏi: bag có đặc tính hiệu năng tốt nhất trong các collection dùng cho association một-nhiều hai chiều. Lý do nằm ở chỗ collection trong Hibernate mặc định được nạp khi truy cập lần đầu, mà bag không phải duy trì chỉ số phần tử như list cũng không phải kiểm tra trùng lặp như set — nên thêm một phần tử mới không buộc phải nạp toàn bộ collection trước. Với một `Item` có hàng nghìn bid và thao tác chính là thêm bid mới, khác biệt này là một lần nạp toàn bảng con so với không nạp gì. Cái giá là không thể eager-fetch hai bag cùng lúc, vì các câu `SELECT` sinh ra không liên quan nhau và phải giữ riêng — nhưng sách nói rõ đây không phải mất mát lớn, bởi nạp hai collection đồng thời luôn tạo tích Descartes và ta muốn tránh nó bất kể kiểu collection là gì. Chọn `Set` khi thật sự cần chặn trùng lặp và collection đủ nhỏ, hoặc khi cần khả chuyển sang JPA provider khác. Chọn `List` với `@OrderColumn` chỉ khi thứ tự là dữ liệu nghiệp vụ phải lưu — và ở đây phải phân biệt rõ hai cơ chế sách tách bạch: sắp xếp trong bộ nhớ bằng comparator của Java, so với sắp thứ tự lúc nạp bằng mệnh đề `ORDER BY` trong SQL. Nếu chỉ cần hiển thị bid theo thời gian giảm dần thì đó là việc của truy vấn, không phải của kiểu collection.",
    redFlags: [
      "Chọn `List` vì \"cần thứ tự\" mà không tách bạch thứ tự hiển thị lúc đọc với thứ tự là dữ liệu phải lưu",
      "Cho rằng `Set` luôn an toàn nhất — với collection lớn, mỗi lần thêm phần tử là một lần nạp toàn bộ",
      "Nói bag \"không dùng được vì không eager-fetch hai cái cùng lúc\" mà không nhận ra việc đó tự nó đã là thứ nên tránh",
    ],
    probes: [
      "`SortedSet` khởi tạo bằng `TreeSet` khác gì, và vì sao sách cảnh báo về nó?",
      "Nếu cần cả `bids` lẫn `images` của cùng một `Item` trong một màn hình, bạn nạp thế nào để không tạo tích Descartes?",
      "Vì sao sách khuyên khởi tạo collection ngay ở chỗ khai báo field chứ không trong constructor hay setter?",
    ],
    refs: ["jpa-08", "jpa-09"],
  },
  {
    id: "jpa-iq08",
    field: "jpa",
    topic: "jpa-assoc",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Quan hệ `Category` ↔ `Item` được ánh xạ `@ManyToMany` thuần với bảng nối `CATEGORY_ITEM`. Nghiệp vụ vừa yêu cầu ghi lại ai gán item vào category và lúc nào. Bản vá đầu tiên thêm hai cột vào bảng nối, nhưng Hibernate không ghi gì vào đó; tệ hơn, mỗi lần lưu một `Category` đã sửa, log SQL cho thấy một lệnh `DELETE FROM CATEGORY_ITEM WHERE CATEGORY_ID = ?` rồi chèn lại toàn bộ.",
      scale: "Category lớn nhất có 47.000 item; thao tác sửa một category mất 9–14 giây và khoá bảng nối đủ lâu để các request khác timeout.",
      constraints: "Dữ liệu gán hiện có phải giữ nguyên, không được mất lịch sử. Hai dịch vụ khác đang đọc bảng nối trực tiếp. Cửa sổ phát hành 30 phút vào ban đêm.",
    },
    question: "Bạn chẩn đoán và thiết kế lại quan hệ này thế nào?",
    mustCover: [
      "`@ManyToMany` thuần **che giấu** bảng nối sau một collection, nên không có chỗ nào để mang thuộc tính riêng của liên kết",
      "Hành vi xoá-rồi-chèn-lại là hệ quả của việc Hibernate quản lý bảng nối như một collection giá trị chứ không như tập entity có định danh",
      "Cách sửa của sách: biểu diễn nhiều-nhiều thành **hai association nhiều-một** tới một entity trung gian ánh xạ thẳng vào bảng nối",
      "Sách khuyến nghị cân nhắc entity trung gian **trước** khi ánh xạ `@ManyToMany`, chính vì thêm cột vào bảng nối là điều gần như không tránh khỏi",
      "Entity trung gian dùng khoá hợp thành gói trong class embeddable, ánh xạ bằng `@EmbeddedId`; đánh dấu bất biến cho phép Hibernate bỏ dirty checking",
      "Di trú giữ nguyên dữ liệu: bảng nối không đổi hình, chỉ thêm cột cho phép `null` rồi backfill — nên hai dịch vụ đọc trực tiếp vẫn chạy",
    ],
    model: "Cả hai triệu chứng có chung một gốc: `@ManyToMany` thuần cố tình che giấu bảng nối, coi nó như một collection giá trị của `Category` chứ không như một tập thực thể có định danh riêng. Vì thế nó không có chỗ để mang thuộc tính nào của chính liên kết — hai cột mới thêm vào không thuộc ánh xạ nào nên không bao giờ được ghi. Và vì Hibernate không biết dòng nào trong bảng nối tương ứng với phần tử nào, cách an toàn duy nhất khi collection đổi là xoá sạch theo `CATEGORY_ID` rồi chèn lại — với 47.000 item thì đó chính là 9–14 giây và khoảng khoá bảng đang gây timeout. Sách đưa ra đúng lối thoát và còn khuyên nên nghĩ tới nó từ trước: luôn có thể biểu diễn một association nhiều-nhiều thành hai association nhiều-một tới một class trung gian, và mô hình đó dễ mở rộng hơn, nên các tác giả có xu hướng không dùng `@ManyToMany` thông thường — bởi việc phải thêm cột vào bảng nối là điều không tránh khỏi và sửa mã về sau rất tốn công. Cụ thể, dựng một entity `CategorizedItem` ánh xạ thẳng vào bảng nối, mang timestamp và người tạo liên kết, với khoá hợp thành gói trong một class embeddable lồng tĩnh và ánh xạ bằng `@EmbeddedId`; đánh dấu nó `@Immutable` để Hibernate bỏ được dirty checking khi flush. Từ đó `Category` và `Item` mỗi bên giữ một `@OneToMany` tới entity trung gian, và sửa một liên kết chỉ còn là một `INSERT` hoặc `DELETE` đúng một dòng. Về di trú thì đây là ca dễ chịu: hình dạng bảng nối không đổi, ta chỉ thêm hai cột cho phép `null` rồi backfill, nên hai dịch vụ đọc trực tiếp vẫn thấy đúng cấu trúc cũ và không phải phát hành cùng đêm — vừa với cửa sổ 30 phút.",
    redFlags: [
      "Đề xuất thêm `@JoinTable` với cột phụ và nghĩ Hibernate sẽ tự ghi — `@ManyToMany` không có chỗ nào để ánh xạ thuộc tính của liên kết",
      "Quy hành vi xoá-rồi-chèn cho cấu hình cascade hoặc kiểu collection, thay vì cho việc bảng nối không có định danh phần tử",
      "Giữ `@ManyToMany` rồi thêm một bảng thứ hai chỉ để chứa metadata — sinh ra hai nguồn sự thật cho cùng một liên kết",
      "Đổi schema bảng nối theo cách buộc hai dịch vụ kia phải phát hành cùng lúc, trong khi chỉ cần thêm cột nullable là đủ",
    ],
    probes: [
      "Vì sao khoá hợp thành ở entity trung gian nên gói trong embeddable thay vì hai field rời?",
      "Đánh dấu entity trung gian là bất biến giúp được gì lúc flush?",
      "Sau khi đổi, một thao tác gỡ một item khỏi category sinh ra mấy câu SQL?",
    ],
    refs: ["jpa-09", "jpa-08"],
  },

  // ===== jpa-lifecycle — Persistence context & vòng đời (jpa-iq09–jpa-iq12) =====
  {
    id: "jpa-iq09",
    field: "jpa",
    topic: "jpa-lifecycle",
    level: 1,
    minutes: 6,
    question: "JPA định nghĩa bốn trạng thái cho một instance entity. Kể tên chúng, nói rõ cái gì đẩy một instance từ trạng thái này sang trạng thái kia, và persistence context đóng vai trò gì trong bức tranh đó?",
    mustCover: [
      "Bốn trạng thái là **transient**, **persistent**, **detached** và **removed**",
      "Instance tạo bằng `new` là transient: trạng thái mất và bị thu gom rác ngay khi không còn ai tham chiếu, và không có cơ chế rollback nào cho nó",
      "Chuyển từ transient sang persistent cần **hoặc** một lời gọi `persist()`, **hoặc** tạo tham chiếu từ một instance đã persistent có bật cascade cho association đó",
      "Persistence context là dịch vụ ghi nhớ mọi sửa đổi và thay đổi trạng thái trong một **đơn vị công việc**, và là phạm vi của identity — đây cũng chính là bộ nhớ đệm cấp một",
    ],
    model: "JPA phơi ra bốn trạng thái và giấu độ phức tạp nội bộ của Hibernate khỏi mã client. **Transient** là instance vừa `new` ra: nó chỉ sống trong bộ nhớ, mất đi khi hết tham chiếu, và Hibernate không cung cấp chức năng hoàn tác nào cho nó — sửa giá một `Item` transient rồi thì không tự động undo được. **Persistent** là instance đang được một persistence context quản lý và gắn với một dòng trong cơ sở dữ liệu. **Detached** là instance từng persistent nhưng context quản lý nó đã đóng; nó vẫn giữ giá trị định danh nên vẫn nói được nó ứng với dòng nào, nhưng không còn ai theo dõi thay đổi của nó. **Removed** là instance đã được đánh dấu xoá và sẽ biến thành lệnh `DELETE` khi context flush. Về chuyển đổi, điểm hay bị bỏ sót là có **hai** đường đi từ transient sang persistent: gọi `persist()` tường minh, hoặc chỉ cần tạo một tham chiếu từ một instance đã persistent nếu association đó bật cascade — chính đường thứ hai giải thích vì sao nhiều object được lưu mà mã nguồn chẳng gọi `save` lần nào. Persistence context là thứ buộc tất cả lại: nó ghi nhớ mọi sửa đổi trong một đơn vị công việc, và nó là phạm vi định danh — trong cùng một context, hai lần nạp cùng một dòng luôn trả về cùng một instance, và đó cũng là điều khiến nó đóng vai bộ nhớ đệm cấp một.",
    redFlags: [
      "Chỉ kể ba trạng thái, bỏ sót removed — hoặc coi removed đồng nghĩa với đã xoá khỏi cơ sở dữ liệu, trong khi lệnh `DELETE` mới chỉ được xếp hàng",
      "Nói cách duy nhất để lưu một object là gọi `persist()` — bỏ qua đường cascade từ một instance đã persistent",
      "Mô tả persistence context chỉ như một cache tăng tốc, không nói tới vai trò phạm vi định danh và nơi ghi nhớ thay đổi",
    ],
    probes: [
      "Trong cùng một persistence context, hai lần `find()` cùng một id trả về cùng một instance hay hai instance?",
      "Instance ở trạng thái removed còn quay lại persistent được không, và bằng cách nào?",
      "Vì sao sách nói mã nghiệp vụ như `calculateTotalPrice()` có thể hoàn toàn không biết tới persistence?",
    ],
    refs: ["jpa-10"],
  },
  {
    id: "jpa-iq10",
    field: "jpa",
    topic: "jpa-lifecycle",
    level: 2,
    minutes: 7,
    code: {
      lang: "java",
      text: `@Service
public class ItemService {

    @Transactional
    public void applyDiscount(Long itemId, BigDecimal percent) {
        Item item = itemRepository.findById(itemId).orElseThrow();
        item.setBuyNowPrice(item.getBuyNowPrice().multiply(percent));
        // không gọi itemRepository.save(item)
    }

    @Transactional(readOnly = false)
    public void renameFromDto(ItemDto dto) {
        Item detached = dto.toEntity();      // có id, tạo bằng new
        detached.setName(dto.getName());
        // không gọi save, không gọi merge
    }
}`,
    },
    question: "Method thứ nhất vẫn ghi được giá mới xuống cơ sở dữ liệu dù không gọi `save`. Method thứ hai thì không ghi gì. Giải thích hai hành vi này.",
    mustCover: [
      "Ở method thứ nhất, `findById` trả về instance ở trạng thái **persistent**, được persistence context quản lý",
      "Persistence context ghi nhớ trạng thái lúc nạp và so lại khi **flush**; phát hiện chênh lệch thì tự sinh `UPDATE` — không cần lời gọi lưu nào",
      "Ở method thứ hai, object tạo bằng `new` **không** được context nào quản lý dù đã có giá trị định danh, nên không ai theo dõi thay đổi của nó",
      "Muốn ghi object ở trạng thái đó phải gọi `merge()`, và phải dùng **instance trả về** chứ không dùng tiếp tham chiếu cũ",
    ],
    model: "Khác biệt nằm ở chỗ object có đang được persistence context quản lý hay không. Trong `applyDiscount`, `findById` nạp `Item` vào persistence context của transaction hiện hành, nên nó ở trạng thái persistent. Context giữ lại ảnh chụp trạng thái lúc nạp; tới lúc flush — thường là khi commit — nó so ảnh chụp đó với trạng thái hiện tại, thấy `buyNowPrice` đã đổi và tự sinh một lệnh `UPDATE`. Không có lời gọi lưu nào vì không cần: cơ chế theo dõi thay đổi là mặc định của một instance được quản lý. Trong `renameFromDto` thì ngược lại: `dto.toEntity()` tạo object bằng `new`, và dù ta có tự gán id cho nó thì nó vẫn không nằm trong persistence context nào. Về phân loại nó tương đương trạng thái detached — có định danh, biết ứng với dòng nào, nhưng không ai theo dõi. Không có ảnh chụp để so, nên flush không sinh câu lệnh nào và thay đổi im lặng biến mất. Cách sửa là gọi `merge()`: Hibernate tìm trong context xem có instance persistent nào cùng định danh không, không có thì nạp từ cơ sở dữ liệu, rồi **sao chép** trạng thái của object ta đưa vào lên instance persistent ấy và trả instance đó về. Điểm bắt buộc phải nói: từ đó trở đi phải dùng instance trả về và bỏ tham chiếu cũ — nó đã cũ và không còn biểu diễn trạng thái hiện tại; mọi thành phần khác trong ứng dụng còn giữ tham chiếu cũ đều phải chuyển sang.",
    redFlags: [
      "Nói `findById` \"tự động bật chế độ lưu\" — cơ chế là so ảnh chụp lúc flush, không phải một chế độ nào được bật",
      "Sửa method thứ hai bằng cách gọi `save()` mà không nói gì tới việc phải dùng instance trả về",
      "Cho rằng gán id thủ công là đủ để object được quản lý — định danh không quyết định trạng thái quản lý",
    ],
    probes: [
      "Nếu `applyDiscount` ném exception sau dòng `setBuyNowPrice` thì `UPDATE` có chạy không?",
      "`merge()` xử lý một object hoàn toàn chưa có định danh thế nào?",
      "Đặt `@Transactional(readOnly = true)` lên method thứ nhất thì điều gì đổi?",
    ],
    refs: ["jpa-10"],
  },
  {
    id: "jpa-iq11",
    field: "jpa",
    topic: "jpa-lifecycle",
    level: 3,
    minutes: 9,
    question: "Tầng web gửi xuống một object đã mang sẵn định danh, dựng lại từ form người dùng. Bạn lưu nó bằng cách nào, và điều gì khiến bạn chọn khác đi?",
    tradeoffs: [
      {
        option: "`merge()` object dựng từ form",
        when: "Kiến trúc dựa hẳn trên detachment: tầng web dựng object đầy đủ và gửi xuống nguyên khối. Sách lưu ý `merge()` xử lý được **cả** object detached lẫn transient, nên một kiến trúc kiểu này có thể không bao giờ gọi tới `persist()`. Đổi lại phải kỷ luật chuyển mọi tham chiếu sang instance trả về.",
      },
      {
        option: "Nạp lại bằng `find()` rồi chép từng field cần sửa",
        when: "Form chỉ gửi một phần entity, hoặc có field người dùng **không được phép** đổi. `merge()` chép toàn bộ trạng thái nên field vắng mặt trong form sẽ bị ghi đè thành `null` — đây là ca phải tránh `merge()`.",
      },
      {
        option: "`persist()` một object hoàn toàn mới",
        when: "Object chưa có định danh và ta biết chắc đây là bản ghi mới. Rõ ràng về ý định hơn `merge()`, và không tốn một lần `SELECT` để đi tìm dòng cũ.",
      },
    ],
    mustCover: [
      "`merge()` không gắn object của bạn vào context — nó **sao chép** trạng thái lên một instance persistent rồi trả instance đó về",
      "Nếu chưa có instance nào cùng định danh trong context, Hibernate **nạp từ cơ sở dữ liệu** trước, nên `merge()` có thể tốn thêm một câu `SELECT`",
      "Nếu tra cứu theo định danh cũng không thấy dòng nào, Hibernate khởi tạo instance mới và chèn — `merge()` im lặng trở thành thao tác chèn",
      "Rủi ro lớn nhất của `merge()` là ghi đè: nó chép toàn bộ trạng thái, nên field không có trong form sẽ thành `null`",
      "Sau `merge()` phải bỏ tham chiếu cũ và chuyển mọi thành phần đang giữ nó sang instance trả về",
    ],
    model: "Trước khi chọn, phải nói đúng `merge()` làm gì, vì tên gọi dễ gây hiểu nhầm. Nó không biến object của ta thành persistent. Hibernate tìm trong persistence context một instance persistent cùng định danh; không có thì nạp từ cơ sở dữ liệu; rồi sao chép trạng thái từ object ta đưa vào lên instance ấy và **trả instance ấy về**. Object gốc vẫn nằm ngoài context và từ giây phút đó đã lỗi thời. Ba hệ quả thực tế. Thứ nhất, `merge()` có thể tốn một câu `SELECT` mà `persist()` không cần. Thứ hai, nếu không tìm thấy dòng nào mang định danh đó, Hibernate khởi tạo instance mới rồi chèn — nên một thao tác ta nghĩ là cập nhật có thể lặng lẽ thành thao tác chèn, và với id đến từ phía client thì đó là một lỗ hổng cần chặn ở tầng kiểm tra đầu vào. Thứ ba, và đây là cái bẫy hay gặp nhất: `merge()` chép **toàn bộ** trạng thái, nên nếu form chỉ gửi ba field còn entity có mười field, bảy field kia sẽ bị ghi thành `null`. Vì vậy tôi chọn `merge()` khi tầng web thật sự gửi xuống entity đầy đủ và kiến trúc đã chấp nhận mô hình detachment; còn khi form gửi một phần, tôi nạp lại bằng `find()` rồi chép đúng những field được phép sửa — chậm hơn một câu `SELECT` nhưng không có đường nào để mất dữ liệu. Và trong cả hai trường hợp, kỷ luật bắt buộc là từ sau `merge()` thì mọi chỗ phải dùng instance trả về.",
    redFlags: [
      "Nói `merge()` \"gắn object vào persistence context\" — nó sao chép sang một instance khác, và tiếp tục dùng tham chiếu cũ là nguồn lỗi kinh điển",
      "Dùng `merge()` cho form gửi một phần entity mà không nhận ra các field vắng mặt sẽ bị ghi đè thành `null`",
      "Tin rằng `merge()` luôn là cập nhật — không có dòng nào mang định danh đó thì nó chèn mới",
    ],
    probes: [
      "Id đến từ client và không tồn tại trong cơ sở dữ liệu — bạn chặn ở đâu để `merge()` không lặng lẽ chèn bản ghi mới?",
      "Nếu persistence context đã có sẵn một instance cùng định danh thì `merge()` còn chạy `SELECT` không?",
      "Sách nói một kiến trúc dựa trên detachment có thể không bao giờ gọi `persist()` — bạn thấy đánh đổi gì ở đó?",
    ],
    refs: ["jpa-10", "jpa-02"],
  },
  {
    id: "jpa-iq12",
    field: "jpa",
    topic: "jpa-lifecycle",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Sau khi tách tầng controller khỏi service để dựng một API mới, `LazyInitializationException` nổ ở khâu serialize JSON. Lỗi không xuất hiện đều: endpoint danh sách thì chạy, endpoint chi tiết thì hỏng, và test tích hợp vẫn xanh toàn bộ.",
      scale: "23 endpoint đang dùng chung 6 entity có association lazy; khoảng 4% request của giờ cao điểm trả về 500.",
      constraints: "Không được bật `spring.jpa.open-in-view` — đội đã ra quyết định kiến trúc cấm giữ persistence context mở qua tầng view. Không được đổi `FetchType` sang `EAGER` trên các association dùng chung. Không được dừng dịch vụ để phát hành.",
    },
    question: "Bạn chẩn đoán và xử lý thế nào?",
    mustCover: [
      "Ngoại lệ này nghĩa là một association lazy được chạm tới **sau khi** persistence context đã đóng, tức object đã ở trạng thái detached",
      "Nó xuất hiện ngay sau khi tách tầng vì trước đó lời gọi nằm trong cùng đơn vị công việc, còn giờ serialize xảy ra bên ngoài ranh giới transaction",
      "Test vẫn xanh vì test chạy trong transaction nên context chưa đóng — phải flush và clear context, hoặc kiểm ngoài transaction, mới tái hiện được",
      "Bật giữ context mở qua tầng view là **đường cụt**: nó chỉ đẩy việc nạp ra ngoài ranh giới transaction, sinh truy vấn ngoài kiểm soát và che mất lỗi thiết kế fetch plan",
      "Cách đúng là quyết định fetch plan tại chỗ gọi — nạp sẵn đúng thứ cần bằng `join fetch` hoặc `@EntityGraph` — và trả về DTO thay vì entity ra khỏi tầng service",
    ],
    model: "Ngoại lệ nói đúng một chuyện: có người chạm vào một association lazy khi object đã detached, tức persistence context quản lý nó đã đóng. Trước khi tách tầng, việc serialize vô tình vẫn nằm trong cùng đơn vị công việc nên proxy còn khởi tạo được; tách xong thì transaction kết thúc ở ranh giới service, còn Jackson mới bắt đầu duyệt object sau đó. Điều đó giải thích cả tính không đều: endpoint danh sách trả về projection phẳng nên không chạm association nào, còn endpoint chi tiết trả nguyên entity và đi vào nhánh lazy. Nó cũng giải thích vì sao test xanh — test chạy trong transaction nên context chưa đóng; muốn tái hiện phải flush rồi clear context, hoặc kiểm ở ngoài ranh giới transaction, và đó là việc phải làm đầu tiên để có một bài kiểm tái hiện được. Về cách chữa, ràng buộc của đề bài đã chặn sẵn hai lối tắt phổ biến, và chặn đúng. Giữ persistence context mở qua tầng view không sửa gì cả: nó chỉ dời thời điểm nạp ra ngoài ranh giới transaction, khiến truy vấn phát sinh ở chỗ không ai kiểm soát và che mất chính lỗi thiết kế fetch plan. Đổi `FetchType` sang `EAGER` còn tệ hơn vì nó là quyết định toàn cục cho mọi chỗ dùng entity đó, trong khi nhu cầu nạp lại khác nhau theo từng màn hình — mà sách cũng nói rõ mặc định lazy của collection là mặc định tốt và `EAGER` hiếm khi cần. Đường đúng là đưa quyết định nạp về đúng chỗ gọi: mỗi truy vấn khai fetch plan của riêng nó bằng `join fetch` hoặc `@EntityGraph`, và tầng service trả DTO thay vì để entity đi ra ngoài ranh giới transaction. Thứ tự triển khai thì bám theo dữ liệu: log ngoại lệ để xếp hạng 23 endpoint theo số lỗi thật, sửa nhóm gây ra phần lớn 4% trước, và vì mỗi endpoint sửa được độc lập nên không cần dừng dịch vụ.",
    redFlags: [
      "Đề xuất bật giữ context mở qua tầng view — ràng buộc đã cấm, và kể cả không cấm thì nó che lỗi chứ không sửa",
      "Chuyển association sang `EAGER` cho xong: một quyết định toàn cục cho một nhu cầu cục bộ, và thường kéo theo N+1 ở chỗ khác",
      "Gọi `Hibernate.initialize()` rải rác trong controller — vẫn là nạp ngoài fetch plan, chỉ khác ở chỗ thủ công",
      "Kết luận \"test xanh nên nhánh đó không lỗi\" mà không nhận ra test đang chạy trong transaction nên không bao giờ tái hiện được",
    ],
    probes: [
      "Viết một test thật sự bắt được lỗi này — nó phải khác test hiện tại ở chỗ nào?",
      "Vì sao endpoint danh sách không hỏng còn endpoint chi tiết thì hỏng?",
      "Nếu buộc phải trả entity ra ngoài service, bạn còn cách nào an toàn không?",
    ],
    refs: ["jpa-10"],
  },

  // ===== jpa-tx — Transaction & concurrency (jpa-iq13–jpa-iq16) =====
  {
    id: "jpa-iq13",
    field: "jpa",
    topic: "jpa-tx",
    level: 1,
    minutes: 6,
    question: "Chuẩn ANSI SQL định nghĩa các mức cô lập theo hiện tượng nào được phép xảy ra. Kể bốn hiện tượng đó, và nói mức nào chặn được cái nào.",
    mustCover: [
      "**Lost update**: hai transaction cùng đọc một giá trị rồi lần lượt ghi đè nhau — lần commit cuối cùng thắng, cập nhật của bên kia biến mất",
      "**Dirty read**: đọc phải thay đổi mà transaction khác chưa commit, nguy hiểm vì thay đổi đó có thể bị rollback sau đó",
      "**Unrepeatable read**: đọc cùng một mục dữ liệu hai lần và mỗi lần ra một trạng thái khác, do bên khác ghi rồi commit xen vào giữa",
      "**Phantom read**: chạy một truy vấn hai lần, lần sau có thêm hoặc bớt dòng vì bên khác đã chèn hoặc xoá xen vào giữa",
      "Tăng mức cô lập kéo theo chi phí cao hơn và **suy giảm nghiêm trọng** về hiệu năng lẫn khả năng mở rộng — không thể \"dừng thế giới\" trong hệ thống OLTP đa người dùng",
    ],
    model: "Bốn hiện tượng xếp theo đúng thứ tự các mức cô lập nới dần ra. Lost update là nặng nhất: hai transaction cùng đọc một giá trị, transaction thứ nhất ghi bản cập nhật của nó, rồi transaction thứ hai ghi đè bằng bản của nó — cập nhật thứ nhất mất sạch, và sách gọi đúng tên hiện tượng này là *lần commit cuối cùng thắng*. Nó chỉ xảy ra ở hệ thống không hiện thực kiểm soát đồng thời nào cả. Dirty read là đọc phải dữ liệu chưa commit của bên khác; nguy hiểm vì bên đó có thể rollback và ta đã đọc thứ chưa bao giờ tồn tại. Unrepeatable read là đọc cùng một mục hai lần ra hai trạng thái, vì có bên ghi và commit xen vào giữa. Phantom read thì khác ở chỗ nó nói về **tập kết quả** chứ không về một dòng: chạy lại truy vấn thì thấy thêm dòng mới hoặc mất dòng cũ do bên khác chèn hoặc xoá. Về các mức: read uncommitted đã chặn lost update — một transaction không được ghi vào dòng mà transaction chưa commit khác đã ghi — nhưng vẫn cho đọc mọi dòng nên dirty read còn nguyên. Read committed thêm việc chặn dirty read, nhưng vẫn cho phép unrepeatable read và phantom read. Càng lên cao càng chặn được nhiều nhưng sách nói rõ cái giá: chi phí cao hơn và suy giảm nghiêm trọng về hiệu năng lẫn khả năng mở rộng. Đó là lý do phần lớn hệ thống dừng ở read committed rồi xử lý phần còn lại bằng kiểm soát đồng thời ở tầng ứng dụng, chứ không nâng mức cô lập của cơ sở dữ liệu.",
    redFlags: [
      "Gộp unrepeatable read với phantom read làm một — cái thứ nhất nói về một dòng đổi giá trị, cái thứ hai nói về tập kết quả đổi số dòng",
      "Đề nghị đặt serializable cho chắc, không nhắc gì tới việc hiệu năng và khả năng mở rộng suy giảm nghiêm trọng",
      "Cho rằng mức cô lập mặc định của cơ sở dữ liệu đã đủ chặn lost update giữa hai lần đọc-sửa-ghi ở tầng ứng dụng",
    ],
    probes: [
      "Vì sao read committed vẫn không cứu được một luồng đọc-sửa-ghi kéo dài qua nhiều lần gọi?",
      "Mức cô lập đặt ở đâu trong một ứng dụng Spring, và nó áp lên phạm vi nào?",
      "Hiện tượng nào trong bốn cái trên là thứ `@Version` nhắm tới?",
    ],
    refs: ["jpa-11"],
  },
  {
    id: "jpa-iq14",
    field: "jpa",
    topic: "jpa-tx",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `@Entity
public class Item {
    @Id @GeneratedValue
    private Long id;

    private BigDecimal buyNowPrice;
    // không có field nào mang @Version

    public BigDecimal getBuyNowPrice() { return buyNowPrice; }
    public void setBuyNowPrice(BigDecimal p) { this.buyNowPrice = p; }
}

@Service
public class PricingService {

    @Transactional                         // isolation mặc định: READ_COMMITTED
    public void applyMarkdown(Long itemId, BigDecimal percent) {
        Item item = itemRepository.findById(itemId).orElseThrow();
        BigDecimal current = item.getBuyNowPrice();
        BigDecimal next = current.multiply(percent);
        item.setBuyNowPrice(next);
    }
}`,
    },
    question: "Hai người vận hành cùng chạy method này trên một item trong vòng một giây. Item đang để giá 1.000.000. Người A giảm 10%, người B giảm 20%. Dựng lại từng bước điều thực sự xảy ra, rồi sửa.",
    mustCover: [
      "Cả hai transaction đọc cùng giá trị gốc 1.000.000 vì lần đọc của B xảy ra trước khi A commit",
      "A ghi 900.000, B ghi 800.000 — kết quả cuối là 800.000, đúng bằng chỉ áp một lần giảm giá; cập nhật của A mất",
      "Đây chính là **lost update**, và mức cô lập read committed không chặn được vì cả hai lần ghi đều hợp lệ với từng transaction riêng lẻ",
      "Cách sửa là thêm một field `@Version`: Hibernate đưa số phiên bản vào mệnh đề `WHERE` của `UPDATE` và tăng nó lên, nên lần ghi thứ hai không khớp dòng nào và ném ngoại lệ",
      "Ngoại lệ đó phải được xử lý ở tầng gọi — thử lại hoặc báo cho người dùng — chứ bản thân `@Version` không tự hoà giải xung đột",
    ],
    model: "Đây là lost update đúng theo định nghĩa sách. Diễn biến từng bước: A đọc 1.000.000; B đọc 1.000.000 — hợp lệ vì A chưa commit và read committed chỉ chặn đọc dữ liệu chưa commit chứ không chặn đọc dữ liệu cũ; A tính 900.000 và commit; B tính 800.000 từ giá trị nó đọc lúc đầu và commit đè lên. Kết quả cuối là 800.000, tức giá chỉ giảm một lần thay vì hai. Không transaction nào làm gì sai theo góc nhìn của riêng nó, nên không mức cô lập thông thường nào báo lỗi — và đây chính là lý do sách tách kiểm soát đồng thời thành một mục riêng thay vì để mặc cho mức cô lập. Cách sửa là kiểm soát đồng thời lạc quan: thêm một field mang `@Version` vào `Item`. Từ đó mỗi lệnh `UPDATE` Hibernate sinh ra đều mang thêm điều kiện phiên bản trong `WHERE` và tăng phiên bản lên; khi B commit, dòng đã ở phiên bản mới do A ghi nên câu lệnh không khớp dòng nào, Hibernate thấy số dòng bị ảnh hưởng bằng không và ném ngoại lệ. Phải nói rõ giới hạn: `@Version` chỉ **phát hiện** xung đột chứ không giải quyết nó. Tầng gọi phải quyết định làm gì — với thao tác giảm giá theo phần trăm thì thử lại là an toàn vì phép tính dựa trên giá trị vừa đọc lại, còn với thao tác người dùng nhập tay thì nên báo lỗi để họ xem lại. Nếu tranh chấp cao đến mức thử lại liên tục thất bại thì mới tính tới khoá bi quan.",
    redFlags: [
      "Nâng mức cô lập lên serializable để chữa — chặn được nhưng đổi lấy suy giảm hiệu năng nghiêm trọng cho một bài toán chỉ cần một cột phiên bản",
      "Nói `@Transactional` tự nó đã chặn lost update: transaction bảo đảm tính nguyên tử, không bảo đảm giá trị vừa đọc còn nguyên lúc ghi",
      "Thêm `@Version` rồi để ngoại lệ nổi thẳng ra người dùng, không có chiến lược thử lại hay thông báo nào",
      "Gộp cả hai thao tác vào một câu `UPDATE ... SET price = price * ?` rồi coi là xong — đúng cho riêng ca này nhưng không trả lời được câu hỏi về đọc-sửa-ghi nói chung",
    ],
    probes: [
      "Sau khi thêm `@Version`, câu `UPDATE` Hibernate sinh ra trông thế nào?",
      "Thao tác nào thử lại được an toàn, thao tác nào thì không?",
      "Nếu `Item` được sửa từ một job batch không đi qua JPA thì cột phiên bản còn đáng tin không?",
    ],
    refs: ["jpa-11"],
  },
  {
    id: "jpa-iq15",
    field: "jpa",
    topic: "jpa-tx",
    level: 3,
    minutes: 10,
    question: "Một bảng tồn kho bị nhiều luồng cùng ghi. Bạn chọn kiểm soát đồng thời lạc quan hay khoá bi quan tường minh, và ngưỡng nào khiến bạn đổi?",
    tradeoffs: [
      {
        option: "Lạc quan — một field `@Version`",
        when: "Tranh chấp **thưa**: phần lớn transaction chạy qua không đụng nhau. Không giữ khoá nào ở cơ sở dữ liệu nên không chặn ai, mở rộng tốt. Cái giá là khi xung đột xảy ra thì công đã làm bị bỏ đi và phải thử lại — chấp nhận được khi thử lại hiếm và rẻ.",
      },
      {
        option: "Bi quan — `LockModeType.PESSIMISTIC_READ` hoặc `PESSIMISTIC_WRITE` kèm timeout",
        when: "Tranh chấp **dày**, hoặc thử lại đắt, hoặc thao tác không lặp lại được một cách an toàn. Khoá được giữ ở cơ sở dữ liệu nên bên kia phải chờ thay vì làm hỏng việc. Luôn đặt `javax.persistence.lock.timeout` để một luồng kẹt không kéo cả hệ thống theo, và cân nhắc nguy cơ deadlock.",
      },
    ],
    mustCover: [
      "Lạc quan **không khoá gì**: nó phát hiện xung đột lúc ghi, nên chi phí dồn vào những lần thử lại",
      "Bi quan **khoá thật** ở cơ sở dữ liệu: nó ngăn xung đột từ đầu, nên chi phí dồn vào thời gian chờ và nguy cơ deadlock",
      "Trục quyết định là **tần suất tranh chấp** đối chiếu với **chi phí thử lại** — không phải cái nào an toàn hơn về mặt lý thuyết",
      "Khoá bi quan phải đi kèm timeout tường minh, nếu không một luồng giữ khoá lâu sẽ kéo theo cả hàng đợi",
      "Sách dành một mục riêng cho việc tránh deadlock, tức đây là rủi ro thật của hướng bi quan chứ không phải chuyện lý thuyết",
    ],
    model: "Hai hướng này khác nhau ở chỗ đặt chi phí. Lạc quan không giữ khoá nào: mỗi lần ghi mang theo điều kiện phiên bản, xung đột chỉ bị phát hiện tại thời điểm ghi, và chi phí là toàn bộ công đã làm trong transaction thất bại phải làm lại. Vì không chặn ai nên nó mở rộng rất tốt khi tranh chấp thưa — và với phần lớn nghiệp vụ thì tranh chấp đúng là thưa. Bi quan thì ngược lại: `setLockMode` với `PESSIMISTIC_READ` hoặc `PESSIMISTIC_WRITE` khiến cơ sở dữ liệu giữ khoá thật, bên kia phải chờ, nên không có công nào bị bỏ phí nhưng thông lượng bị giới hạn bởi thời gian giữ khoá. Vậy trục quyết định không phải cái nào an toàn hơn — cả hai đều đúng — mà là tần suất tranh chấp nhân với chi phí một lần thử lại. Tồn kho là ca đáng cân nhắc vì nó hay có điểm nóng: vài SKU chiếm phần lớn lượt ghi. Tôi sẽ bắt đầu bằng lạc quan cho toàn bộ, đo tỉ lệ ngoại lệ phiên bản theo từng SKU, và chỉ chuyển sang bi quan cho nhóm điểm nóng nếu tỉ lệ thử lại vượt ngưỡng chịu được. Một tín hiệu khác buộc phải dùng bi quan là thao tác **không lặp lại an toàn được** — có gọi ra ngoài, có gửi thư, có ghi sổ kế toán — vì khi đó thử lại không còn là chuyện rẻ. Chọn bi quan thì bắt buộc đi kèm hai thứ: một timeout tường minh như sách minh hoạ bằng `javax.persistence.lock.timeout`, và một trật tự khoá nhất quán để tránh deadlock — sách dành hẳn một mục cho việc này nên đó là rủi ro thật.",
    redFlags: [
      "Chọn bi quan làm mặc định \"cho chắc\" mà không đo tần suất tranh chấp — đổi thông lượng lấy một sự an toàn thường không cần tới",
      "Nói lạc quan \"nhẹ hơn\" mà không tính chi phí thử lại khi điểm nóng khiến xung đột xảy ra liên tục",
      "Đặt khoá bi quan không kèm timeout, rồi xử lý hàng đợi kẹt bằng cách khởi động lại dịch vụ",
      "Bỏ qua việc có thao tác không thể thử lại an toàn — đây là tín hiệu mạnh hơn mọi con số về tần suất",
    ],
    probes: [
      "`PESSIMISTIC_READ` khác `PESSIMISTIC_WRITE` ở chỗ nào, và bạn chọn cái nào cho việc trừ tồn kho?",
      "Bạn đo tần suất tranh chấp bằng chỉ số nào trước khi quyết định đổi?",
      "Hai luồng cùng khoá hai dòng theo thứ tự ngược nhau — chuyện gì xảy ra và bạn chặn thế nào?",
    ],
    refs: ["jpa-11"],
  },
  {
    id: "jpa-iq16",
    field: "jpa",
    topic: "jpa-tx",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Mỗi ngày vào khung 19–20h, ứng dụng bắt đầu ném `CannotGetJdbcConnectionException` hàng loạt. Các endpoint hoàn toàn không đụng cơ sở dữ liệu cũng chậm theo. Log cho thấy một method `@Transactional` gọi một API đối tác để xác thực thanh toán, ngay giữa thân transaction.",
      scale: "HikariCP với maximum-pool-size 20; thời gian chờ lấy connection trung bình nhảy từ 2ms lên 28 giây. API đối tác có p99 khoảng 6 giây và thỉnh thoảng lên 30 giây. Giờ cao điểm khoảng 340 request/giây.",
      constraints: "Không được nâng pool size — DBA đã chốt trần kết nối cho cả cụm. Không đổi được SLA của API đối tác. Phải giữ tính nhất quán giữa việc ghi đơn hàng và kết quả xác thực.",
    },
    question: "Bạn chẩn đoán và sửa thế nào?",
    mustCover: [
      "Connection được giữ suốt **toàn bộ** thân transaction, nên thời gian chờ API đối tác cộng thẳng vào thời gian giữ connection",
      "Số học pool là thứ phải nói ra: 20 connection chia cho thời gian giữ ~6 giây cho thông lượng tối đa khoảng 3 giao dịch/giây, quá xa 340 request/giây",
      "Endpoint không đụng cơ sở dữ liệu cũng chậm vì chúng chờ cùng một pool — pool cạn là lỗi lan toàn hệ thống, không phải lỗi cục bộ",
      "Cách sửa cốt lõi: đưa lời gọi ra ngoài ranh giới transaction — cắt thành ghi trước, gọi ngoài, rồi transaction thứ hai ghi kết quả",
      "Tính nhất quán giữ bằng trạng thái trung gian cộng cơ chế hoà giải, chứ không bằng cách kéo dài transaction",
      "Đặt timeout tường minh cho lời gọi ra ngoài — không có timeout thì p99 30 giây của đối tác trở thành thời gian giữ connection của ta",
    ],
    model: "Gốc rễ là một câu đơn giản: một connection bị giữ suốt thân `@Transactional`, nên mọi thứ nằm trong thân đó — kể cả việc chờ một hệ thống khác — đều tính vào thời gian giữ connection. Làm phép tính sẽ thấy vấn đề không có đường thoát nào khác: pool 20 connection, mỗi giao dịch giữ khoảng 6 giây thì trần thông lượng là quãng 3 giao dịch mỗi giây, trong khi giờ cao điểm cần 340 request mỗi giây. Pool cạn trong vài chục giây đầu và sau đó mọi thứ xếp hàng — đó cũng là lý do các endpoint không đụng cơ sở dữ liệu cũng chậm: chúng chờ chính cái pool ấy, nên một điểm tắc cục bộ biến thành sự cố toàn hệ thống. Nâng pool size không phải câu trả lời kể cả khi DBA cho phép, vì nó chỉ dời điểm gãy sang cơ sở dữ liệu; ở đây ràng buộc đã chặn sẵn lối tắt đó, và chặn đúng. Cách sửa là cắt đơn vị công việc thành ba đoạn: transaction thứ nhất ghi đơn hàng ở trạng thái chờ xác thực rồi commit và **trả connection lại**; lời gọi API đối tác chạy hoàn toàn ngoài transaction, có timeout tường minh thấp hơn hẳn p99 của đối tác; transaction thứ hai ghi kết quả và chuyển trạng thái. Về yêu cầu nhất quán — vốn là ràng buộc khó nhất của đề bài — thì đúng là ta đánh đổi tính nguyên tử tức thời lấy tính nhất quán cuối cùng, nên phải bù bằng thiết kế chứ không bằng hy vọng: trạng thái chờ phải là trạng thái hợp lệ mà mọi phần đọc đơn hàng đều hiểu, và phải có một job hoà giải quét các đơn kẹt ở trạng thái chờ quá lâu để hỏi lại đối tác hoặc huỷ. Việc cần làm ngay trong lúc chờ triển khai là đặt timeout cho lời gọi ra ngoài — chỉ riêng nó đã cắt được phần đuôi 30 giây đang phá pool.",
    redFlags: [
      "Nâng maximum-pool-size làm cách sửa chính — ràng buộc đã cấm, và kể cả không cấm thì nó chỉ dời điểm gãy sang cơ sở dữ liệu",
      "Đổ lỗi cho API đối tác chậm mà không nhận ra lỗi thiết kế là để lời gọi đó nằm trong thân transaction",
      "Chuyển lời gọi sang bất đồng bộ nhưng vẫn nằm trong thân transaction — connection vẫn bị giữ y như cũ",
      "Bỏ qua yêu cầu nhất quán, cắt transaction ra mà không có trạng thái trung gian và cơ chế hoà giải nào",
      "Không đặt timeout cho lời gọi ra ngoài, tức là để SLA của bên thứ ba quyết định thời gian giữ connection của mình",
    ],
    probes: [
      "Làm phép tính: pool 20, mỗi giao dịch giữ 6 giây thì trần thông lượng là bao nhiêu?",
      "Đơn hàng kẹt ở trạng thái chờ xác thực thì ai dọn, và dọn theo quy tắc nào?",
      "Bạn dựng lại sự cố này trong môi trường kiểm thử bằng cách nào?",
    ],
    refs: ["jpa-11"],
  },
];
