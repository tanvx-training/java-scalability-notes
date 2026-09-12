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
];
