// Ngân hàng câu hỏi phỏng vấn Kafka: The Definitive Guide — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Kafka: The Definitive Guide, ấn bản 2
// (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly),
// chương 2–14.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js.
//
// GIỮ NGUYÊN id (kafka-iq01–kafka-iq24) — thống kê tự chấm lưu theo id.

export const kafkaInterview = [
  // ===== kf-producer — Producer (kafka-iq01–kafka-iq04) =====
  {
    id: "kafka-iq01",
    field: "kafka",
    topic: "kf-producer",
    level: 1,
    minutes: 6,
    question: "Giải thích `acks` của producer. Ba giá trị cho ba bảo đảm gì, và `acks=all` thật sự bảo đảm điều gì?",
    mustCover: [
      "`acks=0`: producer **không chờ** phản hồi — nhanh nhất, và mất message mà không biết",
      "`acks=1`: chờ **leader** ghi xong; message vẫn mất nếu leader hỏng trước khi replica kịp sao",
      "`acks=all`: chờ message được ghi vào **tất cả in-sync replica**",
      "Điểm mấu chốt: \"tất cả\" nghĩa là tất cả replica **đang in sync**, có thể chỉ còn **một**",
      "Nên `acks=all` một mình **không** bảo đảm nhiều bản — phải đi kèm `min.insync.replicas`",
      "Đánh đổi đi kèm: mỗi bậc `acks` cao hơn là thêm một vòng chờ, nên độ trễ ghi tăng — và với `acks=all` nó tăng theo replica **chậm nhất**",
    ],
    model: "`acks` quyết định producer chờ tới mức nào trước khi coi một lần gửi là thành công. Với `acks=0`, nó không chờ gì cả: thông lượng cao nhất, độ trễ thấp nhất, và nếu broker không nhận được thì producer cũng không biết — nên nó chỉ dùng được cho dữ liệu mà mất một phần là chấp nhận được. Với `acks=1`, producer chờ leader của partition ghi xong. Nghe an toàn nhưng vẫn có một cửa sổ mất dữ liệu thật: nếu leader xác nhận rồi hỏng trước khi các replica kịp sao bản ghi đó, message mất trong khi producer đã nhận thành công. Với `acks=all`, producer chờ message được ghi vào tất cả in-sync replica. Và đây là chỗ tôi muốn nhấn vì nó bị hiểu sai nhiều nhất: \"tất cả\" ở đây nghĩa là tất cả replica **đang in sync** tại thời điểm đó, chứ không phải tất cả replica đã cấu hình. Kafka coi dữ liệu là đã commit khi nó được ghi vào mọi in-sync replica — ngay cả khi \"mọi\" chỉ là **một** replica duy nhất. Nên hoàn toàn có thể xảy ra chuyện một topic cấu hình ba replica mà chỉ còn một cái in sync; lúc đó `acks=all` được thoả bởi đúng một bản ghi, và nếu replica đó mất khả dụng thì dữ liệu mất dù producer đã nhận xác nhận. Kết luận thực hành: `acks=all` một mình không phải một bảo đảm về số bản; nó phải đi cùng `min.insync.replicas` đặt ở giá trị lớn hơn một. Khi topic có ba replica và `min.insync.replicas` là hai, producer chỉ ghi được khi có ít nhất hai replica in sync — và nếu chỉ còn một thì broker từ chối produce request thay vì âm thầm nhận. Đó mới là cấu hình diễn đạt đúng ý \"dữ liệu đã commit nằm trên nhiều hơn một máy\".",
    redFlags: [
      "Nói `acks=all` nghĩa là ghi vào tất cả replica đã cấu hình",
      "Không nhắc `min.insync.replicas` khi bàn về bảo đảm của `acks=all`",
      "Coi `acks=1` là an toàn vì leader đã xác nhận",
    ],
    probes: [
      "Topic ba replica, chỉ còn một in sync — `acks=all` bảo đảm gì?",
      "Producer nhận lỗi gì khi không đủ in-sync replica?",
      "Bạn chọn `acks` nào cho dữ liệu đo lường không quan trọng, và vì sao?",
    ],
    refs: ["kafka-03", "kafka-07"],
  },
  {
    id: "kafka-iq02",
    field: "kafka",
    topic: "kf-producer",
    level: 2,
    minutes: 8,
    code: {
      lang: "java",
      text: `Properties props = new Properties();
props.put("acks", "all");
props.put("retries", 3);
props.put("max.in.flight.requests.per.connection", 5);   // (1) mặc định
props.put("enable.idempotence", false);                  // (2) tắt tường minh
KafkaProducer<String, String> producer = new KafkaProducer<>(props);

for (Order o : orders) {
    producer.send(new ProducerRecord<>("orders", o.getId(), toJson(o)));  // (3)
}
producer.close();

// Sự cố: log của consumer cho thấy một số đơn xuất hiện HAI lần,
// và với một key, thứ tự hai bản ghi bị ĐẢO so với thứ tự gửi.`,
    },
    question: "Giải thích cả hai triệu chứng — trùng lặp và đảo thứ tự — rồi sửa. Nói rõ dòng (3) còn một lỗi riêng.",
    mustCover: [
      "Trùng lặp đến từ `retries`: một request có thể đã được broker ghi nhưng phản hồi bị mất, nên producer gửi lại",
      "Đảo thứ tự đến từ **nhiều request đang bay cùng lúc**: nếu request đầu thất bại và được gửi lại, nó tới **sau** request thứ hai",
      "Hai triệu chứng cùng một gốc: thử lại **không idempotent** cộng nhiều request song song trên một connection",
      "Sửa gọn nhất: bật `enable.idempotence` — nó khử trùng lặp và **giữ thứ tự** ngay cả khi có thử lại",
      "Nếu không bật được thì phải đặt `max.in.flight.requests.per.connection` về **1**, đổi thông lượng lấy thứ tự",
      "Lỗi riêng ở dòng (3): `send` là **bất đồng bộ** và không kiểm kết quả — mọi lỗi gửi bị bỏ qua hoàn toàn",
      "Phải xử lý kết quả qua callback hoặc `Future`, nếu không `close()` xong ta vẫn không biết gì đã thất bại",
    ],
    model: "Hai triệu chứng có cùng một gốc. Việc thử lại là nguồn của trùng lặp: một produce request có thể đã được broker ghi thành công nhưng phản hồi bị mất trên đường về, nên producer coi là thất bại và gửi lại — bản ghi vào log hai lần. Đây là hệ quả không tránh được của việc thử lại trên một mạng không đáng tin, chừng nào phép ghi chưa idempotent. Việc đảo thứ tự thì đến từ tương tác giữa thử lại và `max.in.flight.requests.per.connection` bằng 5: producer có tới năm request đang bay cùng lúc trên một connection, nên nếu request thứ nhất thất bại và được gửi lại trong khi request thứ hai đã thành công, thì bản ghi của request đầu vào log **sau** bản ghi của request sau. Với một key thì đó là đảo thứ tự thật, và với dữ liệu đơn hàng thì nó đổi ý nghĩa nghiệp vụ. Cách sửa gọn nhất là bật `enable.idempotence`: producer gán số thứ tự cho mỗi bản ghi và broker loại bản trùng, nên thử lại trở nên vô hại; và quan trọng là nó **giữ thứ tự** ngay cả khi có nhiều request đang bay, nên ta không phải đánh đổi thông lượng. Nếu vì lý do nào đó không bật được, thì cách duy nhất giữ thứ tự là đặt `max.in.flight.requests.per.connection` về 1 — nhưng nó cắt thông lượng đáng kể, nên đó là phương án cuối. Dòng (3) còn một lỗi độc lập mà tôi muốn nêu vì nó thường tệ hơn cả hai lỗi trên: `send` là bất đồng bộ và trả về một `Future`, mà mã này bỏ hoàn toàn giá trị trả về. Nghĩa là mọi lỗi gửi — hết bộ đệm, không đủ in-sync replica, bản ghi quá lớn — đều bị bỏ qua, và sau `close()` ta không biết đơn nào đã không được gửi. Phải xử lý kết quả qua callback hoặc kiểm `Future`, và với dữ liệu đơn hàng thì lỗi gửi phải được ghi lại và xử lý chứ không được bỏ im lặng.",
    redFlags: [
      "Đặt `retries` về 0 để hết trùng lặp — đổi trùng lặp thành mất dữ liệu",
      "Chỉ sửa thứ tự bằng cách hạ số request đang bay mà bỏ qua idempotence",
      "Không thấy lỗi bỏ qua kết quả của `send`",
      "Kết luận Kafka không bảo đảm thứ tự nên phải tự sắp ở consumer",
    ],
    probes: [
      "Idempotent producer khử trùng lặp bằng cơ chế gì?",
      "Vì sao nó giữ được thứ tự mà không cần hạ số request đang bay?",
      "Bạn xử lý một lỗi gửi cho dữ liệu đơn hàng thế nào?",
    ],
    refs: ["kafka-03", "kafka-08"],
  },
  {
    id: "kafka-iq03",
    field: "kafka",
    topic: "kf-producer",
    level: 3,
    minutes: 10,
    question: "Bạn chọn khoá cho message. Dùng key có nghĩa nghiệp vụ, key ngẫu nhiên, hay không key?",
    tradeoffs: [
      {
        option: "Key có nghĩa nghiệp vụ",
        when: "Khi cần **thứ tự** giữa các message liên quan — mọi sự kiện của một đơn hàng, một người dùng. Cùng key thì cùng partition nên thứ tự được giữ. Đổi lại là nguy cơ **lệch partition** nếu phân bố key không đều.",
      },
      {
        option: "Không key",
        when: "Khi thứ tự không quan trọng và ta muốn phân bố đều. Producer rải message theo lô qua các partition, nên tải cân. Mất hẳn bảo đảm thứ tự, kể cả giữa các message liên quan.",
      },
      {
        option: "Key có nghĩa cộng thêm thành phần rải",
        when: "Khi có **điểm nóng**: một key chiếm phần lớn lưu lượng. Ghép thêm một thành phần để chia nó ra nhiều partition — nhưng khi đó **mất thứ tự** trong phạm vi key gốc, nên chỉ làm được nếu nghiệp vụ chịu được.",
      },
    ],
    mustCover: [
      "Kafka bảo đảm thứ tự **trong một partition**, không phải trong một topic",
      "Nên chọn key là chọn **phạm vi mà thứ tự được bảo đảm**",
      "Key quyết định partition, nên phân bố key lệch sẽ làm một partition nóng và mở rộng bị chặn ở đó",
      "Số partition là **trần** của mức song song phía consumer, nên nó phải được chọn cùng lúc với key",
      "Thêm partition **về sau** sẽ đổi việc ánh xạ key sang partition, nên thứ tự lịch sử không còn liền mạch",
      "Vì vậy số partition là quyết định khó đảo — phải dự trù, chứ không đặt vừa đủ hôm nay",
    ],
    model: "Điều đầu tiên phải nói rõ vì mọi thứ khác suy ra từ nó: Kafka bảo đảm thứ tự trong một **partition**, không phải trong một topic. Nên chọn key thực chất là chọn phạm vi mà thứ tự được bảo đảm. Nếu nghiệp vụ cần mọi sự kiện của một đơn hàng phải được xử lý theo thứ tự thì key phải là mã đơn hàng, và thế là xong — không có cách nào khác đạt được điều đó. Cái giá của key có nghĩa là phân bố có thể lệch: nếu một khách hàng lớn tạo 30% lưu lượng và key là mã khách hàng, thì một partition nhận 30% tải và mở rộng bị chặn ở đó, vì một partition chỉ được một consumer trong nhóm đọc. Nên tôi luôn kiểm phân bố key thật trước khi chốt, chứ không giả định nó đều. Không dùng key thì producer rải message theo lô qua các partition nên tải cân, và đó là lựa chọn đúng khi thứ tự thật sự không quan trọng — nhưng phải chắc là **thật sự** không quan trọng, vì mất thứ tự là thứ không lấy lại được ở phía consumer nếu không có thông tin bổ sung. Khi có điểm nóng mà vẫn cần một phần thứ tự, cách ghép thêm một thành phần rải vào key chia được điểm nóng ra nhiều partition, nhưng nó **hy sinh thứ tự trong phạm vi key gốc** — nên nó chỉ dùng được khi nghiệp vụ chịu được điều đó, chẳng hạn khi các sự kiện của cùng một khách độc lập với nhau. Điểm cuối và là điểm tôi thấy bị bỏ qua nhiều nhất: số partition phải được quyết định cùng lúc với key, vì nó là trần của mức song song phía consumer — thêm consumer vượt số partition thì consumer dư nằm không. Và nó là quyết định khó đảo: thêm partition về sau đổi việc ánh xạ key sang partition, nên các message cùng key trước và sau khi thêm sẽ nằm ở hai partition khác nhau và thứ tự lịch sử không còn liền mạch. Vì vậy tôi chọn số partition có dự trù cho tăng trưởng, chứ không đặt vừa đủ cho hôm nay.",
    redFlags: [
      "Nói Kafka bảo đảm thứ tự trong một topic",
      "Chọn key có nghĩa mà không kiểm phân bố thật của key",
      "Đặt số partition vừa đủ cho tải hiện tại",
      "Thêm thành phần rải vào key mà không nói nó hy sinh thứ tự",
    ],
    probes: [
      "Một khách hàng chiếm 30% lưu lượng — bạn xử lý thế nào mà vẫn giữ thứ tự?",
      "Thêm partition về sau phá vỡ điều gì?",
      "Consumer nhiều hơn số partition thì chuyện gì xảy ra?",
    ],
    refs: ["kafka-03", "kafka-06"],
  },
  {
    id: "kafka-iq04",
    field: "kafka",
    topic: "kf-producer",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ ghi sự kiện vào Kafka bắt đầu mất khoảng 0,4% sự kiện trong giờ cao điểm. Không có ngoại lệ nào trong log ứng dụng. Cấu hình producer: `acks=1`, `retries=0`, `linger.ms=100`, `buffer.memory` mặc định, và mã gọi `send` không xử lý kết quả trả về.",
      scale: "22.000 sự kiện mỗi giây ở đỉnh, 6.000 ở mức nền. Sự kiện dùng để đối soát doanh thu, nên 0,4% là khoảng 300.000 sự kiện mỗi ngày bị thiếu.",
      constraints: "Không giảm được lưu lượng. Không thêm broker trong quý này. Phải phân biệt được sự kiện mất ở phía producer với mất ở phía broker, vì hai đội đang chỉ trách nhau.",
      },
    question: "Có bao nhiêu đường mất dữ liệu trong cấu hình này? Kể ra, nói cách phân biệt chúng, rồi sửa.",
    mustCover: [
      "Đường 1: `send` không xử lý kết quả nên **mọi** lỗi gửi bị bỏ qua im lặng — đó là lý do log sạch",
      "Đường 2: `acks=1` nghĩa là message mất nếu leader hỏng trước khi replica kịp sao",
      "Đường 3: `retries=0` nghĩa là mọi lỗi tạm thời — leader đang chuyển, mạng nhấp nháy — thành mất dữ liệu ngay",
      "Đường 4: bộ đệm producer đầy ở giờ cao điểm; khi đầy, `send` **chặn** rồi **ném** — và ngoại lệ đó cũng bị bỏ qua",
      "`linger.ms=100` làm bộ đệm giữ message lâu hơn, nên nó **tăng** nguy cơ đầy ở đỉnh",
      "Phân biệt bằng cách **xử lý kết quả `send`** trước tiên: nó chuyển phần lớn mất mát từ im lặng thành đếm được",
      "Rồi so số gửi thành công phía producer với số bản ghi phía broker — chênh lệch mới là phần broker",
      "Sửa: xử lý kết quả, `acks=all` cộng `min.insync.replicas`, bật idempotence và cho `retries` lớn",
    ],
    model: "Cấu hình này có **bốn** đường mất dữ liệu độc lập, và tôi sẽ kể theo thứ tự đóng góp. Đường thứ nhất, và là lý do log sạch: mã gọi `send` mà không xử lý kết quả trả về. `send` là bất đồng bộ, mọi lỗi được báo qua `Future` hoặc callback, nên bỏ giá trị trả về là bỏ toàn bộ thông tin về thất bại. Hệ thống đang mất dữ liệu một cách hoàn toàn im lặng, và điều đó cũng giải thích vì sao hai đội chỉ trách nhau được — không bên nào có số liệu. Đường thứ hai là `acks=1`: producer coi thành công khi leader ghi xong, nên nếu leader hỏng trước khi replica kịp sao thì message mất dù producer đã nhận xác nhận. Đường thứ ba là `retries=0`: mọi lỗi tạm thời trở thành mất dữ liệu ngay, và lỗi tạm thời là chuyện bình thường trong Kafka — mỗi lần leader của một partition chuyển sang broker khác là một khoảng ngắn producer nhận lỗi. Đường thứ tư giải thích vì sao chỉ mất ở giờ cao điểm: bộ đệm của producer có giới hạn, và với `linger.ms=100` thì message nằm trong bộ đệm lâu hơn để gom lô — tốt cho thông lượng nhưng làm bộ đệm dễ đầy hơn. Khi đầy, `send` chặn tới một ngưỡng rồi ném ngoại lệ; và vì kết quả không được xử lý, ngoại lệ đó cũng biến mất. Tỉ lệ 0,4% chỉ ở đỉnh khớp chính xác với hình dạng này. Về cách phân biệt phía producer với phía broker — đúng thứ hai đội đang cần — việc phải làm đầu tiên và rẻ nhất là xử lý kết quả `send` rồi đếm: nó chuyển phần lớn mất mát từ im lặng thành một con số. Sau đó so số lần gửi thành công mà producer ghi nhận với số bản ghi thực tế trong topic; nếu hai con số khớp thì mất mát nằm hoàn toàn ở phía producer, còn chênh lệch mới là phần thuộc broker. Không có bước đó thì mọi tranh luận là phỏng đoán. Sửa thì làm cả bốn: xử lý kết quả `send` và ghi log mọi thất bại; đổi sang `acks=all` kèm `min.insync.replicas` lớn hơn một; bật idempotence và cho `retries` giá trị lớn — idempotence khiến thử lại nhiều không sinh trùng lặp, nên ta được cả hai; và nới `buffer.memory` cùng theo dõi mức dùng bộ đệm ở đỉnh.",
    redFlags: [
      "Chỉ đổi `acks=all` rồi coi là xong, để nguyên việc bỏ kết quả `send`",
      "Tăng `retries` mà không bật idempotence — đổi mất dữ liệu thành trùng lặp",
      "Đòi thêm broker trước khi có số liệu phân biệt hai phía",
      "Kết luận Kafka mất dữ liệu",
      "Giảm `linger.ms` về 0 làm cách sửa chính — giảm gom lô mà không chạm ba đường kia",
    ],
    probes: [
      "Vì sao 0,4% chỉ xuất hiện ở giờ cao điểm?",
      "Bạn đếm số gửi thành công phía producer bằng cách nào?",
      "Bật idempotence rồi thì `retries` lớn còn rủi ro gì?",
    ],
    refs: ["kafka-03", "kafka-07"],
  },

  // ===== kf-consumer — Consumer (kafka-iq05–kafka-iq08) =====
  {
    id: "kafka-iq05",
    field: "kafka",
    topic: "kf-consumer",
    level: 1,
    minutes: 6,
    question: "Giải thích consumer group và rebalance. Khi nào rebalance xảy ra, và nó gây ra hệ quả gì cho ứng dụng?",
    mustCover: [
      "Mỗi partition được gán cho **đúng một** consumer trong nhóm, nên số partition là **trần** của mức song song",
      "Rebalance xảy ra khi **thành viên nhóm đổi**: consumer mới vào, consumer rời, hoặc consumer bị coi là đã chết",
      "Nó cũng xảy ra khi **số partition của topic đổi**",
      "Trong rebalance, consumer **mất quyền** với partition cũ và có thể nhận partition khác",
      "Hệ quả: mọi trạng thái cục bộ gắn với partition trở nên vô nghĩa, và công việc đang xử lý dở phải được xử lý lại",
      "Nên trước khi mất partition phải **commit offset**, nếu không sẽ xử lý lại phần đã làm",
      "Consumer bị coi là đã chết khi nó không gửi tín hiệu sống đúng hạn — kể cả khi nó chỉ **xử lý chậm**",
    ],
    model: "Consumer group là cơ chế chia việc: mỗi partition của topic được gán cho đúng một consumer trong nhóm, nên nhiều consumer cùng nhóm chia nhau các partition. Hệ quả trực tiếp và quan trọng là số partition đặt trần cho mức song song — thêm consumer vượt số partition thì những cái dư nằm không. Rebalance là quá trình gán lại partition, và nó xảy ra khi thành viên nhóm đổi: một consumer mới tham gia, một consumer rời đi một cách sạch sẽ, hoặc một consumer bị nhóm coi là đã chết. Nó cũng xảy ra khi số partition của topic thay đổi. Điều quan trọng phải nói kèm là chuyện gì diễn ra với ứng dụng trong lúc đó: consumer mất quyền với những partition nó đang giữ và có thể nhận một tập khác. Nghĩa là mọi trạng thái cục bộ mà nó đang giữ gắn với partition cũ trở nên vô nghĩa, và bất kỳ công việc đang xử lý dở cho những message đã đọc nhưng chưa commit đều sẽ được một consumer khác xử lý lại. Đó là lý do thời điểm commit offset quan trọng: trước khi mất partition ta phải commit những gì đã xử lý xong, nếu không phần công việc đó bị làm lại. Còn về việc bị coi là đã chết thì có một điểm dễ gây sự cố: consumer phải gửi tín hiệu sống đúng hạn, và nếu nó **xử lý một lô quá lâu** thì nhóm sẽ kết luận nó đã chết dù tiến trình vẫn sống khoẻ — dẫn tới rebalance, rồi lô đó bị consumer khác xử lý lại, rồi consumer cũ commit một offset đã không còn thuộc nó. Đây là hình dạng sự cố rất hay gặp khi mỗi message tốn nhiều thời gian xử lý, và cách phòng là giới hạn kích thước lô kéo về cho khớp với thời gian xử lý thực tế.",
    redFlags: [
      "Nói nhiều consumer cùng nhóm có thể cùng đọc một partition",
      "Không biết consumer xử lý chậm cũng bị coi là đã chết",
      "Bỏ qua việc trạng thái cục bộ mất nghĩa sau rebalance",
    ],
    probes: [
      "Consumer xử lý một lô mất 10 phút — chuyện gì xảy ra?",
      "Bạn giới hạn kích thước lô kéo về theo tiêu chí nào?",
      "Trạng thái cục bộ gắn với partition thì bạn xử lý thế nào khi rebalance?",
    ],
    refs: ["kafka-04"],
  },
  {
    id: "kafka-iq06",
    field: "kafka",
    topic: "kf-consumer",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `props.put("enable.auto.commit", "true");        // (1)
props.put("auto.commit.interval.ms", "5000");
props.put("max.poll.records", "500");
props.put("max.poll.interval.ms", "300000");

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(ofMillis(100));
    for (ConsumerRecord<String, String> r : records) {
        process(r);            // (2) ghi vào database, ~40ms mỗi bản ghi
    }
}

// Hai sự cố quan sát được:
//  (A) Sau mỗi lần triển khai, một số bản ghi bị xử lý HAI lần.
//  (B) Thỉnh thoảng có bản ghi KHÔNG BAO GIỜ được xử lý, và log có
//      "rebalance" ngay trước đó.`,
    },
    question: "Giải thích (A) và (B) — chúng là hai lỗi khác nhau. Rồi sửa, và nói bạn chọn mô hình bảo đảm nào.",
    mustCover: [
      "(A) là **xử lý lặp**: auto-commit mỗi 5 giây, nên khi tiến trình dừng, phần đã xử lý sau lần commit cuối bị làm lại",
      "(B) là **mất xử lý**: auto-commit có thể commit offset của những bản ghi **chưa** xử lý xong",
      "Cụ thể, commit xảy ra trong `poll`, nên nó commit cả lô đã kéo về dù vòng lặp xử lý chưa tới bản ghi cuối",
      "Số học: 500 bản ghi × 40ms là 20 giây xử lý, vượt xa khoảng auto-commit 5 giây — nên (B) xảy ra thường xuyên",
      "Sửa: tắt auto-commit và **commit sau khi xử lý xong**, thủ công",
      "Khi đó mô hình là **ít nhất một lần**: vẫn có thể lặp, nhưng không bao giờ mất",
      "Muốn không lặp thì phải làm `process` **idempotent**, hoặc ghi offset cùng dữ liệu trong một transaction",
      "Cũng nên giảm `max.poll.records` để thời gian xử lý một lô nằm an toàn dưới `max.poll.interval.ms`",
    ],
    model: "Hai sự cố là hai lỗi khác nhau và cùng đến từ auto-commit, nhưng theo hai cơ chế đối nghịch. (A) là xử lý lặp: auto-commit chỉ commit mỗi 5 giây, nên nếu tiến trình dừng — mà triển khai chính là dừng có chủ ý — thì mọi bản ghi đã xử lý sau lần commit cuối chưa được ghi nhận, và consumer mới đọc lại từ offset cũ. Đây là hành vi mong đợi của mô hình ít nhất một lần và thường chấp nhận được. (B) nghiêm trọng hơn nhiều: auto-commit có thể commit offset của những bản ghi **chưa** được xử lý xong. Cơ chế là commit xảy ra bên trong lời gọi `poll`, và `poll` commit cho cả lô đã kéo về lần trước — nên nếu vòng lặp xử lý chưa đi tới bản ghi cuối của lô mà đã quay lại `poll`, hoặc nếu rebalance xảy ra giữa đường, thì offset đã tiến lên trong khi công việc chưa làm. Những bản ghi đó sẽ không bao giờ được đọc lại. Làm số học thì thấy vì sao nó xảy ra thường xuyên: 500 bản ghi nhân 40ms là khoảng 20 giây để xử lý một lô, trong khi auto-commit đặt 5 giây — nên cửa sổ nguy hiểm mở ở gần như mọi lô. Cách sửa là tắt auto-commit và commit thủ công **sau khi** xử lý xong, đồng bộ hoá thời điểm commit với thời điểm công việc thực sự hoàn tất. Khi đó mô hình bảo đảm trở thành ít nhất một lần: vẫn có thể xử lý lặp nếu tiến trình chết giữa lúc xử lý xong và lúc commit, nhưng không bao giờ mất — và với dữ liệu nghiệp vụ thì đó là hướng đánh đổi đúng, vì lặp có thể khử được còn mất thì không. Muốn khử lặp thì có hai đường: làm `process` idempotent theo id bản ghi, hoặc ghi dữ liệu và offset trong cùng một transaction để hai thứ luôn khớp. Cuối cùng, tôi cũng giảm `max.poll.records` để thời gian xử lý một lô nằm an toàn dưới `max.poll.interval.ms` — vì 20 giây hiện tại thì ổn so với 5 phút, nhưng nếu database chậm đi gấp mười lần thì consumer sẽ bị coi là đã chết và ta có thêm một lớp sự cố.",
    redFlags: [
      "Chỉ tắt auto-commit mà commit trước khi xử lý",
      "Coi (A) và (B) là cùng một lỗi",
      "Giảm `auto.commit.interval.ms` xuống 100ms làm cách sửa — thu hẹp cửa sổ chứ không đóng nó",
      "Tuyên bố đạt được đúng một lần chỉ bằng commit thủ công",
    ],
    probes: [
      "Vì sao lặp khử được mà mất thì không?",
      "Ghi dữ liệu và offset trong một transaction cần gì?",
      "Nếu `process` gọi một API bên ngoài thì idempotent thế nào?",
    ],
    refs: ["kafka-04", "kafka-07"],
  },
  {
    id: "kafka-iq07",
    field: "kafka",
    topic: "kf-consumer",
    level: 3,
    minutes: 11,
    question: "Consumer của bạn đang tụt lại so với producer. Bạn xử lý theo hướng nào?",
    tradeoffs: [
      {
        option: "Thêm consumer trong nhóm",
        when: "Khi số consumer còn **nhỏ hơn số partition**. Rẻ nhất, không đổi mã. Nhưng nó đụng trần ngay khi số consumer bằng số partition — quá đó thì consumer dư nằm không.",
      },
      {
        option: "Tăng số partition",
        when: "Khi đã đụng trần trên. Nó nâng trần song song, nhưng là quyết định **khó đảo**: việc ánh xạ key sang partition đổi, nên thứ tự lịch sử theo key không còn liền mạch.",
      },
      {
        option: "Làm việc xử lý mỗi message **nhanh hơn**",
        when: "Hướng tôi thử trước cả hai nếu nút thắt nằm trong mã: gom lô ghi database, bỏ lời gọi đồng bộ không cần thiết, xử lý song song trong một consumer. Không đổi kiến trúc và thường cho lợi ích lớn nhất.",
      },
    ],
    mustCover: [
      "Trước mọi thứ: phải biết nút thắt nằm ở **đâu** — đọc từ Kafka, xử lý, hay ghi xuống hạ nguồn",
      "Nếu nút thắt ở hạ nguồn thì thêm consumer chỉ **dồn thêm tải** vào chỗ đang tắc",
      "Số partition là trần của mức song song, nên thêm consumer vượt trần là vô ích",
      "Tăng số partition đổi ánh xạ key sang partition, nên nó phá tính liền mạch của thứ tự lịch sử",
      "Xử lý song song **trong** một consumer giữ được số partition nhưng làm việc commit offset phức tạp hơn",
      "Phân bố độ tụt **quyết định hướng sửa**: tụt đều là bài toán năng lực, tụt dồn một chỗ là bài toán lệch key — và hai cái đòi hai cách làm loại trừ nhau",
      "Nếu tụt do lệch key thì thêm consumer không giúp gì, phải xử lý điểm nóng",
    ],
    model: "Việc đầu tiên không phải thêm gì mà là xác định nút thắt nằm ở đâu trong ba chặng: đọc từ Kafka, xử lý trong bộ nhớ, hay ghi xuống hạ nguồn. Ba chỗ này cho ba cách sửa khác nhau, và nếu nút thắt nằm ở hạ nguồn — một database đã bão hoà — thì thêm consumer chỉ dồn thêm tải vào chỗ đang tắc và làm mọi thứ chậm hơn. Việc thứ hai, và rẻ như việc thứ nhất, là đo độ tụt **theo từng partition** thay vì chỉ nhìn tổng. Nếu độ tụt phân bố đều thì đó là bài toán năng lực; nếu nó tập trung ở một hoặc hai partition thì đó là bài toán **lệch key**, và khi đó thêm consumer hoàn toàn không giúp gì, vì một partition chỉ được một consumer đọc. Rất nhiều đội thêm consumer rồi không hiểu vì sao độ tụt không giảm, và lý do luôn là họ chưa tách hai trường hợp này. Giả sử là bài toán năng lực phân bố đều, tôi đi theo thứ tự chi phí. Hướng đầu là làm việc xử lý mỗi message nhanh hơn, vì nó thường cho lợi ích lớn nhất mà không đổi kiến trúc: gom lô các lần ghi database thay vì ghi từng bản ghi, bỏ những lời gọi đồng bộ không cần nằm trên đường nóng, hoặc xử lý song song trong một consumer. Hướng thứ hai là thêm consumer, và nó chỉ có tác dụng khi số consumer còn nhỏ hơn số partition — đó là trần cứng. Hướng thứ ba là tăng số partition, và tôi để cuối vì nó là quyết định khó đảo: nó đổi việc ánh xạ key sang partition, nên các message cùng key trước và sau khi thêm nằm ở hai partition khác nhau, và thứ tự lịch sử theo key không còn liền mạch. Với dữ liệu mà thứ tự có ý nghĩa nghiệp vụ thì đó là một hệ quả phải được chấp nhận tường minh, không phải một chi tiết vận hành. Còn nếu xử lý song song trong một consumer thì phải nói rõ cái giá: việc commit offset trở nên phức tạp vì các message của cùng partition không còn hoàn tất theo thứ tự, nên phải theo dõi offset nào đã xử lý xong thay vì commit thẳng offset cuối.",
    redFlags: [
      "Thêm consumer mà chưa đo độ tụt theo partition",
      "Thêm consumer khi nút thắt nằm ở database hạ nguồn",
      "Tăng số partition mà không nói tới hệ quả với thứ tự theo key",
      "Xử lý song song trong consumer mà vẫn commit offset cuối của lô",
    ],
    probes: [
      "Độ tụt tập trung ở một partition — bạn kết luận gì?",
      "Xử lý song song trong một consumer thì commit offset thế nào?",
      "Gom lô ghi database đổi mô hình bảo đảm của bạn ra sao?",
    ],
    refs: ["kafka-04", "kafka-06"],
  },
  {
    id: "kafka-iq08",
    field: "kafka",
    topic: "kf-consumer",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một consumer group vào vòng lặp rebalance liên tục: cứ khoảng 40 giây lại rebalance, và giữa các lần rebalance gần như không bản ghi nào được xử lý. Độ tụt tăng đều. Trước đó đội vừa đổi `process` để gọi thêm một API làm giàu dữ liệu, API này có p99 khoảng 2 giây.",
      scale: "12 partition, 12 consumer. `max.poll.records` là 500, `max.poll.interval.ms` mặc định 5 phút. Độ tụt đã đạt 40 triệu bản ghi.",
      constraints: "Không bỏ được lời gọi làm giàu — nó là yêu cầu nghiệp vụ. Không tăng được số partition trong đợt này. Phải dừng vòng lặp rebalance trước, rồi mới xử lý độ tụt.",
      },
    question: "Vì sao thêm một lời gọi 2 giây lại gây vòng lặp rebalance? Làm phép tính, rồi nêu thứ tự xử lý.",
    mustCover: [
      "Phép tính: 500 bản ghi × 2 giây là khoảng **1.000 giây** cho một lô, vượt xa `max.poll.interval.ms` 5 phút",
      "Vượt ngưỡng đó nghĩa là nhóm coi consumer đã **chết** dù tiến trình vẫn sống",
      "Nhóm rebalance, partition được gán lại, lô đang xử lý bị bỏ dở — và consumer mới bắt đầu lại từ offset cũ",
      "Consumer mới cũng kéo 500 bản ghi và cũng vượt ngưỡng, nên vòng lặp **tự duy trì**",
      "Đó là lý do gần như không bản ghi nào được xử lý: mỗi chu kỳ đều bị cắt trước khi commit được",
      "Sửa ngay: giảm `max.poll.records` mạnh, để thời gian xử lý một lô nằm **an toàn dưới** ngưỡng",
      "Với p99 2 giây thì lô phải ở bậc vài chục bản ghi, không phải 500",
      "Sau khi hết vòng lặp mới xử lý độ tụt, và lúc đó hướng đúng là **song song hoá lời gọi làm giàu** thay vì xử lý tuần tự",
    ],
    model: "Phép tính trả lời trọn vẹn câu hỏi. Mỗi lô kéo về 500 bản ghi, mỗi bản ghi giờ cần một lời gọi có p99 khoảng 2 giây, và nếu xử lý tuần tự thì một lô cần cỡ 1.000 giây — gần 17 phút, trong khi `max.poll.interval.ms` mặc định là 5 phút. Vượt ngưỡng đó thì nhóm kết luận consumer đã chết, dù tiến trình vẫn đang chạy khoẻ và đang làm việc. Nhóm rebalance, partition được gán lại, lô đang xử lý bị bỏ dở mà không commit được gì. Consumer mới nhận partition, kéo đúng 500 bản ghi từ offset cũ, và gặp đúng tình huống ấy — nên vòng lặp tự duy trì, và đó là lý do gần như không bản ghi nào được xử lý xong: mỗi chu kỳ đều bị cắt trước khi tới điểm commit. Đây cũng là ví dụ rõ nhất cho việc consumer bị coi là đã chết khi nó chỉ **xử lý chậm**. Thứ tự xử lý thì tôi làm đúng như đề bài đòi — dừng vòng lặp trước. Việc rẻ nhất và hiệu quả ngay là giảm `max.poll.records` mạnh: với p99 2 giây thì để thời gian xử lý một lô nằm an toàn dưới 5 phút, lô phải ở bậc vài chục bản ghi chứ không phải 500. Tôi sẽ chọn một con số có biên khá rộng, chẳng hạn 50, vì p99 nghĩa là vẫn có những bản ghi chậm hơn nhiều và ta không muốn đứng sát ngưỡng. Chỉ riêng thay đổi cấu hình này đã dừng vòng lặp và consumer bắt đầu commit được, nên độ tụt thôi tăng. Sau đó mới tới bài toán 40 triệu bản ghi tồn, và ở đây hướng đúng không phải thêm consumer — số consumer đã bằng số partition nên đã đụng trần, và ràng buộc cũng không cho tăng partition. Hướng đúng là song song hoá chính lời gọi làm giàu **trong** mỗi consumer: thay vì gọi tuần tự cho từng bản ghi, gọi đồng thời cho cả lô với một trần song song hợp lý. Một lô 50 bản ghi gọi đồng thời 10 lời gọi một lúc thì hết khoảng 10 giây thay vì 100, và khi đó ta có thể nâng lại kích thước lô. Đi kèm là hai việc bắt buộc: đặt timeout cho lời gọi làm giàu để một lời gọi treo không kéo cả lô vượt ngưỡng, và theo dõi offset đã xử lý xong thay vì commit thẳng offset cuối, vì xử lý song song làm các bản ghi hoàn tất không theo thứ tự.",
    redFlags: [
      "Tăng `max.poll.interval.ms` lên rất lớn làm cách sửa chính — che mất cơ chế phát hiện consumer chết",
      "Thêm consumer khi số consumer đã bằng số partition",
      "Xử lý độ tụt trước khi dừng vòng lặp rebalance",
      "Bỏ lời gọi làm giàu — ràng buộc đã cấm",
      "Song song hoá lời gọi mà không đặt timeout và không đổi cách commit offset",
    ],
    probes: [
      "Bạn chọn `max.poll.records` bằng bao nhiêu, và tính từ đâu?",
      "Vì sao nâng `max.poll.interval.ms` là cách sửa tệ?",
      "Xử lý song song trong lô đổi cách commit offset thế nào?",
    ],
    refs: ["kafka-04"],
  },

  // ===== kf-internals — Cơ chế bên trong (kafka-iq09–kafka-iq12) =====
  {
    id: "kafka-iq09",
    field: "kafka",
    topic: "kf-internals",
    level: 1,
    minutes: 6,
    question: "Giải thích in-sync replica, và vì sao khái niệm này quyết định cả độ tin cậy lẫn tính sẵn sàng của một partition.",
    mustCover: [
      "In-sync replica là replica **theo kịp** leader trong một ngưỡng nhất định",
      "Dữ liệu được coi là **đã commit** khi ghi vào **tất cả** in-sync replica",
      "Một replica tụt lại quá lâu bị **loại khỏi** tập in sync, và nó có thể quay lại sau khi bắt kịp",
      "Nên tập in sync là **động**: một topic ba replica có thể chỉ còn một cái in sync",
      "Điều đó quyết định độ tin cậy vì \"đã commit\" có thể chỉ nghĩa là **một** bản ghi",
      "Và quyết định tính sẵn sàng vì `min.insync.replicas` khiến broker **từ chối ghi** khi không đủ",
      "Cụ thể: ba replica với `min.insync.replicas` bằng 2 thì khi chỉ còn một in sync, partition thành **chỉ đọc**",
    ],
    model: "In-sync replica là những replica đang theo kịp leader trong một ngưỡng nhất định — về số bản ghi tụt lại và về thời gian từ lần sao chép cuối. Tập này **động**: một replica chậm đi vì đĩa hỏng, mạng nghẽn hay broker quá tải sẽ bị loại khỏi tập in sync, và nó quay lại sau khi bắt kịp. Khái niệm này là trung tâm vì định nghĩa \"đã commit\" của Kafka dựa trên nó: một bản ghi được coi là đã commit khi nó được ghi vào **tất cả** in-sync replica. Từ đó ra hệ quả về độ tin cậy mà nhiều người bỏ qua: nếu một topic cấu hình ba replica mà hai cái đã bị loại khỏi tập in sync, thì \"tất cả in-sync replica\" chỉ là **một** — nên `acks=all` được thoả bởi đúng một bản ghi, và nếu replica đó mất khả dụng thì dữ liệu mất dù producer đã nhận xác nhận. Nói cách khác, số replica cấu hình là một lời hứa về **tiềm năng**, còn số in-sync replica là sự thật ở thời điểm đó. Về tính sẵn sàng thì `min.insync.replicas` là chỗ ta chọn phía nào của đánh đổi. Với ba replica và `min.insync.replicas` bằng 2: khi cả ba in sync thì bình thường; mất một cái vẫn bình thường; nhưng nếu hai cái không khả dụng thì broker **từ chối** produce request và producer nhận lỗi không đủ replica. Consumer vẫn đọc được dữ liệu hiện có, nên thực chất partition trở thành chỉ đọc. Đó là một lựa chọn có chủ ý: thà dừng nhận ghi còn hơn nhận ghi vào một bản duy nhất rồi mất nó. Để thoát khỏi trạng thái chỉ đọc thì phải đưa một trong hai replica kia trở lại và chờ nó bắt kịp. Nên `min.insync.replicas` chính là núm điều chỉnh giữa \"luôn ghi được\" và \"đã commit nghĩa là nhiều bản\".",
    redFlags: [
      "Coi số replica cấu hình là số bản thật sự có mọi lúc",
      "Không biết tập in sync là động",
      "Nói `min.insync.replicas` chỉ ảnh hưởng độ tin cậy mà không ảnh hưởng tính sẵn sàng",
    ],
    probes: [
      "Producer nhận lỗi gì khi không đủ in-sync replica, và consumer thì sao?",
      "Bạn thoát khỏi trạng thái chỉ đọc bằng cách nào?",
      "Một replica bị loại khỏi tập in sync vì những lý do nào?",
    ],
    refs: ["kafka-06", "kafka-07"],
  },
  {
    id: "kafka-iq10",
    field: "kafka",
    topic: "kf-internals",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Cấu hình topic và broker của một hệ thống thanh toán:

  topic: payments
    replication.factor = 3
    min.insync.replicas = 1              # (1)

  broker (toàn cluster):
    unclean.leader.election.enable = true    # (2)

  producer:
    acks = all
    enable.idempotence = true

Đội nói: "replication.factor 3 và acks=all nên không thể mất dữ liệu."`,
    },
    question: "Chứng minh tuyên bố của đội là sai. Dựng một kịch bản mất dữ liệu cụ thể, rồi đưa ra cấu hình đúng.",
    mustCover: [
      "`min.insync.replicas = 1` nghĩa là \"tất cả in-sync replica\" có thể chỉ là **một**, nên `acks=all` không bảo đảm nhiều bản",
      "Kịch bản: hai follower tụt lại và bị loại khỏi tập in sync; leader vẫn nhận ghi và xác nhận `acks=all`",
      "Leader hỏng; dữ liệu đã commit chỉ tồn tại trên nó — mất",
      "`unclean.leader.election.enable = true` làm tình hình tệ hơn: một replica **out of sync** được chọn làm leader",
      "Replica đó thiếu những bản ghi đã commit, nên chọn nó là **chấp nhận mất dữ liệu** một cách tường minh",
      "Mặc định của cấu hình đó là `false` chính vì nó là lựa chọn an toàn nhất chống mất dữ liệu",
      "Cấu hình đúng: `min.insync.replicas = 2` và `unclean.leader.election.enable = false`",
      "Đánh đổi phải nói rõ: khi chỉ còn một in-sync replica thì partition **không nhận ghi** — đó là điều ta chọn",
    ],
    model: "Tuyên bố của đội sai vì nó gộp hai thứ khác nhau: `replication.factor` là số replica **cấu hình**, còn `acks=all` nói về số replica **đang in sync**. Hai con số đó không nhất thiết bằng nhau, và `min.insync.replicas = 1` cho phép chúng lệch tới mức tồi nhất. Kịch bản mất dữ liệu cụ thể: hai follower chậm đi — đĩa đầy, mạng nghẽn, hoặc broker đang nén gộp nặng — và bị loại khỏi tập in sync. Lúc này tập in sync chỉ còn leader. Producer tiếp tục ghi với `acks=all`, và vì `min.insync.replicas` là 1 nên broker vẫn nhận; producer nhận xác nhận thành công cho những bản ghi chỉ tồn tại trên một máy. Rồi leader hỏng. Những bản ghi đã commit ấy không có ở đâu khác — mất, và mất im lặng vì producer đã được xác nhận. Cấu hình thứ hai làm tình hình tệ thêm một tầng. `unclean.leader.election.enable = true` cho phép một replica **out of sync** được chọn làm leader khi không còn in-sync replica nào. Replica đó theo định nghĩa đang thiếu những bản ghi đã commit, nên chọn nó là chấp nhận mất dữ liệu một cách tường minh — và đó chính là lý do mặc định của tham số này là `false`, vì đây là lựa chọn an toàn nhất chống mất dữ liệu. Cấu hình đúng cho một hệ thống thanh toán là `min.insync.replicas = 2` và `unclean.leader.election.enable = false`. Nhưng tôi sẽ nói rõ đánh đổi thay vì để đội phát hiện lúc 3 giờ sáng: với cấu hình đó, khi hai trong ba replica không khả dụng thì partition **không nhận ghi nữa** và producer nhận lỗi không đủ replica; consumer vẫn đọc được dữ liệu cũ, nên partition thành chỉ đọc cho tới khi một replica trở lại và bắt kịp. Đó là điều ta cố tình chọn: với dữ liệu thanh toán thì dừng nhận ghi tốt hơn nhận rồi mất. Và nếu có lúc buộc phải chấp nhận mất dữ liệu để đưa partition trở lại thì quản trị viên bật `unclean.leader.election` lên như một quyết định có ý thức — rồi **tắt lại** sau khi cluster hồi phục, vì để bật vĩnh viễn là mang rủi ro đó vào mọi sự cố tương lai.",
    redFlags: [
      "Đồng ý với đội vì `replication.factor` là 3",
      "Chỉ đổi `min.insync.replicas` mà để `unclean.leader.election.enable` bật",
      "Nói `enable.idempotence` bảo vệ được khỏi mất dữ liệu ở đây",
      "Đổi cấu hình mà không nêu đánh đổi về tính sẵn sàng",
    ],
    probes: [
      "Với `min.insync.replicas = 2`, mất hai broker thì hệ thống hành xử thế nào?",
      "Khi nào bạn chấp nhận bật unclean leader election?",
      "`enable.idempotence` bảo vệ khỏi điều gì, và không bảo vệ khỏi điều gì?",
    ],
    refs: ["kafka-07", "kafka-06"],
  },
  {
    id: "kafka-iq11",
    field: "kafka",
    topic: "kf-internals",
    level: 3,
    minutes: 10,
    question: "Bạn chọn `min.insync.replicas` và `unclean.leader.election` cho một cluster. Quyết định theo tiêu chí nào?",
    tradeoffs: [
      {
        option: "`min.insync.replicas = 2` với `replication.factor = 3`, unclean tắt",
        when: "Mặc định của tôi cho dữ liệu nghiệp vụ. \"Đã commit\" nghĩa là nằm trên ít nhất hai máy, và chịu được mất một broker mà vẫn ghi được. Đổi lại: mất hai broker thì partition thành **chỉ đọc**.",
      },
      {
        option: "`min.insync.replicas = 1`, unclean tắt",
        when: "Khi ưu tiên **luôn ghi được** và mất một phần dữ liệu là chấp nhận được — log đo lường, dữ liệu tạm. Ghi được kể cả khi chỉ còn một replica, nhưng \"đã commit\" có thể chỉ là một bản.",
      },
      {
        option: "Bật unclean leader election",
        when: "Không phải cấu hình thường trực mà là một **hành động vận hành** khi cần đưa partition trở lại khả dụng và đã quyết định chấp nhận mất dữ liệu. Bật, khôi phục, rồi **tắt lại**.",
      },
    ],
    mustCover: [
      "Đây là chỗ chọn giữa **tính nhất quán** và **tính sẵn sàng**, và không có lựa chọn đúng cho mọi topic",
      "Nên quyết định theo **từng topic**, vì `min.insync.replicas` có cả ở cấp topic",
      "Với `replication.factor = 3` thì `min.insync.replicas = 2` là điểm cân bằng: chịu được mất một broker mà vẫn ghi được",
      "Đặt `min.insync.replicas` bằng `replication.factor` là cấu hình rất giòn: mất **một** broker là mất khả năng ghi",
      "Unclean leader election tắt nghĩa là có những kịch bản partition **không khả dụng** cho tới khi khôi phục thủ công",
      "Bật nó là chấp nhận mất dữ liệu đã commit — nên nó thuộc về quy trình xử lý sự cố, không thuộc về cấu hình mặc định",
      "Và nếu đã bật thì phải nhớ **tắt lại** sau khi cluster hồi phục",
    ],
    model: "Hai tham số này là nơi ta chọn phía nào của đánh đổi giữa nhất quán và sẵn sàng, nên không có giá trị đúng cho mọi topic — và may là `min.insync.replicas` có cả ở cấp topic, nên tôi quyết định theo từng topic thay vì áp một con số cho cả cluster. Với dữ liệu nghiệp vụ tôi dùng `replication.factor = 3` và `min.insync.replicas = 2`. Đó là điểm cân bằng: \"đã commit\" nghĩa là bản ghi nằm trên ít nhất hai máy, và cluster chịu được mất một broker mà vẫn ghi bình thường. Đánh đổi là khi mất hai broker thì partition thành chỉ đọc, và tôi coi đó là hành vi mong muốn cho dữ liệu quan trọng. Có một cấu hình cần tránh mà người ta hay chọn vì tưởng an toàn hơn: đặt `min.insync.replicas` bằng `replication.factor`, tức 3 với 3. Nó rất giòn — mất đúng **một** broker là mất khả năng ghi, và bảo trì luân phiên bình thường cũng gây ngừng ghi. Nó không an toàn hơn, chỉ giòn hơn. Với dữ liệu mà mất một phần là chấp nhận được — log đo lường, dữ liệu tạm, sự kiện theo dõi hành vi — tôi để `min.insync.replicas = 1` và ưu tiên luôn ghi được, vì mất vài bản ghi đo lường không đáng đổi lấy việc producer bị chặn. Còn `unclean.leader.election` thì tôi không coi nó là một tham số cấu hình mà là một **hành động vận hành**. Để tắt nghĩa là có những kịch bản partition không khả dụng cho tới khi khôi phục thủ công, và đó là giá của việc bảo đảm không mất dữ liệu đã commit. Khi thật sự rơi vào kịch bản đó, quản trị viên xem xét tình huống, quyết định chấp nhận mất dữ liệu để đưa partition trở lại, bật nó lên, khôi phục — rồi **tắt lại**. Chỗ hay sai nhất là bước cuối: để bật vĩnh viễn nghĩa là mang rủi ro mất dữ liệu im lặng vào mọi sự cố tương lai, và không ai nhớ vì sao nó đang bật.",
    redFlags: [
      "Áp một con số `min.insync.replicas` cho cả cluster mà không xét từng topic",
      "Đặt `min.insync.replicas` bằng `replication.factor` vì tưởng an toàn hơn",
      "Bật unclean leader election thường trực để \"luôn khả dụng\"",
      "Không nêu rằng phải tắt lại sau khi khôi phục",
    ],
    probes: [
      "Vì sao `min.insync.replicas` bằng `replication.factor` lại giòn?",
      "Bảo trì luân phiên ảnh hưởng tới lựa chọn của bạn thế nào?",
      "Ai được quyền bật unclean leader election, và theo quy trình nào?",
    ],
    refs: ["kafka-07"],
  },
  {
    id: "kafka-iq12",
    field: "kafka",
    topic: "kf-internals",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Sau khi một broker được thay thế, ba partition của một topic quan trọng ở trạng thái không có leader và producer nhận lỗi. Log cho thấy các replica còn lại đều **out of sync**. Đội đã bật `unclean.leader.election.enable = true` để đưa dịch vụ trở lại, và nó hoạt động — nhưng ba tuần sau, đối soát phát hiện 47.000 bản ghi bị thiếu, và không ai nhớ đã bật cấu hình đó.",
      scale: "Topic có `replication.factor = 3`, `min.insync.replicas = 1`. 15.000 bản ghi mỗi giây. Bản ghi dùng để đối soát với đối tác, và thiếu 47.000 bản ghi đã gây một tranh chấp hợp đồng.",
      constraints: "Không thể lấy lại 47.000 bản ghi — dữ liệu gốc đã hết thời gian lưu ở hệ thống nguồn. Phải chặn cả lớp sự cố, không chỉ tắt lại cấu hình. Cluster vẫn phải chịu được mất một broker mà không ngừng ghi.",
      },
    question: "Nối chuỗi nguyên nhân từ `min.insync.replicas = 1` tới 47.000 bản ghi mất. Rồi nêu cách chặn cả lớp sự cố.",
    mustCover: [
      "`min.insync.replicas = 1` cho phép leader **một mình** nhận ghi khi hai follower tụt lại",
      "Những bản ghi đó được coi là đã commit dù chỉ tồn tại trên một máy",
      "Khi broker đó được thay thế, các replica còn lại out of sync vì chúng **chưa từng nhận** những bản ghi ấy",
      "Đó là lý do không có in-sync replica nào để chọn làm leader — trạng thái này là **hệ quả trực tiếp** của cấu hình",
      "Bật unclean leader election đưa một replica out of sync lên làm leader, và **cắt bỏ** những bản ghi nó thiếu",
      "47.000 bản ghi là chính lượng dữ liệu chỉ tồn tại trên broker đã bị thay",
      "Chặn lớp sự cố: đặt `min.insync.replicas = 2` — nó khiến trạng thái \"chỉ một replica có dữ liệu\" **không thể xảy ra**",
      "Và cấu hình rủi ro phải có **cảnh báo** cùng thời hạn tự động, để \"không ai nhớ\" không còn là một chế độ hỏng",
    ],
    model: "Chuỗi nguyên nhân bắt đầu từ rất sớm, trước cả lúc broker được thay. `min.insync.replicas = 1` cho phép leader một mình nhận ghi khi hai follower đã tụt lại và bị loại khỏi tập in sync. Với 15.000 bản ghi mỗi giây thì chỉ cần vài giây ở trạng thái đó là đã có hàng chục nghìn bản ghi chỉ tồn tại trên một máy — và chúng được coi là **đã commit**, producer nhận xác nhận thành công. Khi broker đó được thay thế, các replica còn lại out of sync không phải vì chúng chậm mà vì chúng **chưa từng nhận** những bản ghi ấy; và vì không replica nào in sync, không có ai hợp lệ để làm leader. Nên trạng thái \"ba partition không có leader\" không phải một sự cố ngẫu nhiên mà là hệ quả trực tiếp của cấu hình — nó chỉ đang chờ một broker bị thay. Bật unclean leader election đưa một replica out of sync lên làm leader, và hành động đó **cắt bỏ** những bản ghi mà replica ấy thiếu; 47.000 bản ghi là chính lượng dữ liệu chỉ tồn tại trên broker đã bị thay. Điều đáng nói là việc bật đó đã hoạt động đúng như thiết kế: nó là một cách nói \"tôi chấp nhận mất dữ liệu để đưa dịch vụ trở lại\", và đội đã nói câu đó mà không biết. Về cách chặn cả lớp sự cố, điểm mấu chốt là không tấn công vào bước cuối mà vào bước đầu: đặt `min.insync.replicas = 2`. Khi đó trạng thái \"chỉ một replica có dữ liệu đã commit\" trở nên **không thể xảy ra** — nếu chỉ còn một replica in sync thì broker từ chối ghi, producer nhận lỗi, và ta mất khả năng ghi trong một khoảng ngắn thay vì mất dữ liệu vĩnh viễn. Và ràng buộc \"chịu được mất một broker mà không ngừng ghi\" vẫn thoả, vì với ba replica và ngưỡng hai thì mất một cái vẫn đủ. Phần thứ hai của việc chặn thuộc về vận hành và tôi coi nó quan trọng ngang phần cấu hình: \"không ai nhớ đã bật\" là một chế độ hỏng phải được thiết kế ra khỏi hệ thống, không phải một sơ suất cá nhân. Nên mọi cấu hình mang rủi ro mất dữ liệu phải có cảnh báo khi nó khác giá trị an toàn, và lý tưởng là có thời hạn tự động trở về mặc định. Cuối cùng, việc producer nhận xác nhận cho dữ liệu chỉ nằm trên một máy là điều đội cần biết đã xảy ra, nên tôi sẽ thêm cảnh báo khi số in-sync replica của một partition tụt xuống dưới ngưỡng — đó là chỉ báo sớm thật sự, chứ không phải lỗi lúc thay broker.",
    redFlags: [
      "Chỉ tắt lại `unclean.leader.election.enable` và coi là đã xử lý",
      "Quy lỗi cho người bật cấu hình thay vì cho thiết kế cho phép trạng thái đó tồn tại",
      "Đặt `min.insync.replicas = 3` — vi phạm ràng buộc chịu được mất một broker",
      "Hứa khôi phục 47.000 bản ghi khi dữ liệu nguồn đã hết hạn lưu",
      "Không thêm cảnh báo cho số in-sync replica tụt dưới ngưỡng",
    ],
    probes: [
      "Vì sao `min.insync.replicas = 2` làm trạng thái kia không thể xảy ra?",
      "Chỉ báo sớm nào bạn đặt cảnh báo, và ở ngưỡng nào?",
      "Cấu hình rủi ro nên có thời hạn tự động — bạn hiện thực thế nào?",
    ],
    refs: ["kafka-07", "kafka-12"],
  },

  // ===== kf-reliability — Tin cậy và exactly-once (kafka-iq13–kafka-iq16) =====
  {
    id: "kafka-iq13",
    field: "kafka",
    topic: "kf-reliability",
    level: 1,
    minutes: 6,
    question: "Idempotent producer và transaction giải hai bài toán khác nhau. Phân biệt chúng, và nói \"exactly-once\" thật sự nghĩa là gì.",
    mustCover: [
      "**Idempotent producer** khử trùng lặp do **thử lại** của chính producer trong một partition",
      "Nó không giải quyết gì về việc ghi vào **nhiều partition** như một đơn vị",
      "**Transaction** cho phép ghi vào nhiều partition **nguyên khối**, và gộp cả việc commit offset của consumer",
      "Nhờ vậy nó cho mô hình **đọc–xử lý–ghi** nguyên khối, tức exactly-once trong phạm vi Kafka",
      "\"Exactly-once\" **không** có nghĩa message chỉ được gửi đúng một lần trên đường truyền",
      "Nó nghĩa là **tác dụng** chỉ xảy ra một lần: message có thể được gửi lại, nhưng kết quả không nhân đôi",
      "Và nó chỉ áp trong phạm vi Kafka — ghi ra hệ thống ngoài vẫn cần idempotent ở phía đó",
    ],
    model: "Hai cơ chế giải hai bài toán ở hai phạm vi khác nhau. Idempotent producer giải bài toán trùng lặp do thử lại: producer gán số thứ tự cho mỗi bản ghi, broker nhận ra bản trùng và bỏ nó, nên việc thử lại trở nên vô hại và thứ tự được giữ. Nhưng phạm vi của nó là **một partition và một producer**; nó không nói gì về việc ghi vào nhiều partition như một đơn vị. Transaction mở rộng đúng chỗ đó: nó cho phép một producer ghi vào nhiều partition, và những lần ghi ấy trở nên nhìn thấy được với consumer một cách nguyên khối — hoặc tất cả, hoặc không gì. Quan trọng hơn, transaction gộp được cả việc commit offset của consumer vào cùng phạm vi, nên nó hiện thực được mô hình đọc–xử lý–ghi nguyên khối: đọc từ topic vào, xử lý, ghi ra topic khác, và commit offset — bốn việc thành một đơn vị. Đó là điều làm nên \"exactly-once\" trong phạm vi Kafka. Phần định nghĩa là phần tôi muốn nói rõ nhất vì nó bị hiểu sai thường xuyên: exactly-once **không** có nghĩa message được gửi đúng một lần trên đường truyền — điều đó bất khả thi trên một mạng không đáng tin, vì ta không bao giờ phân biệt được \"chưa tới\" với \"đã tới mà phản hồi mất\". Nó nghĩa là **tác dụng** chỉ xảy ra một lần: message có thể được gửi lại nhiều lần, nhưng kết quả quan sát được không nhân đôi. Và giới hạn cuối cùng phải nêu: bảo đảm đó chỉ áp trong phạm vi Kafka. Nếu bước xử lý ghi ra một database hay gọi một API bên ngoài, transaction của Kafka không bao gồm hành động đó — nên hệ thống ngoài vẫn phải idempotent ở phía nó, thường bằng một khoá idempotent do ta cấp.",
    redFlags: [
      "Nói exactly-once nghĩa là message được truyền đúng một lần",
      "Cho rằng idempotent producer đủ cho mô hình đọc–xử lý–ghi",
      "Tin rằng transaction của Kafka bao trùm cả việc ghi ra database ngoài",
    ],
    probes: [
      "Bước xử lý gọi một API bên ngoài — exactly-once còn giữ được không?",
      "Vì sao gửi đúng một lần trên đường truyền là bất khả thi?",
      "Transaction gộp commit offset vào để làm gì?",
    ],
    refs: ["kafka-08", "kafka-07"],
  },
  {
    id: "kafka-iq14",
    field: "kafka",
    topic: "kf-reliability",
    level: 2,
    minutes: 9,
    code: {
      lang: "java",
      text: `// Luồng đọc–xử lý–ghi, đội nói "đã bật exactly-once"
props.put("enable.idempotence", true);
props.put("transactional.id", "enricher-1");        // (1) cố định
producer.initTransactions();

while (true) {
    var records = consumer.poll(ofMillis(100));
    producer.beginTransaction();
    for (var r : records) {
        var out = enrich(r);
        producer.send(new ProducerRecord<>("enriched", out));
        db.insert(out);                              // (2) ghi thêm vào database
    }
    producer.sendOffsetsToTransaction(offsetsOf(records), consumer.groupMetadata());
    producer.commitTransaction();
}

// Chạy 3 instance của dịch vụ này để tăng thông lượng.`,
    },
    question: "Chỉ ra hai lỗi khiến bảo đảm này không thành. Một ở dòng (1), một ở dòng (2).",
    mustCover: [
      "Dòng (1): `transactional.id` **cố định** mà chạy 3 instance nghĩa là ba instance dùng **cùng** một id",
      "Kafka dùng `transactional.id` để loại bỏ producer cũ — nên instance mới khởi tạo sẽ **vô hiệu hoá** hai instance kia",
      "Kết quả: các instance liên tục đá nhau ra, transaction bị abort, và thông lượng sụp thay vì tăng",
      "Mỗi instance phải có `transactional.id` **duy nhất và ổn định** qua các lần khởi động lại",
      "Dòng (2): `db.insert` **nằm ngoài** phạm vi transaction của Kafka",
      "Nên nếu transaction abort sau đó, bản ghi trong database **vẫn còn** — dữ liệu hai bên lệch nhau",
      "Sửa: làm `db.insert` idempotent theo một khoá suy từ bản ghi, để lần ghi lại không nhân đôi",
      "Hoặc bỏ hẳn việc ghi database khỏi vòng lặp này và để một consumer riêng đọc topic `enriched`",
    ],
    model: "Hai lỗi, và mỗi lỗi đủ để phá bảo đảm. Lỗi ở dòng (1) là `transactional.id` cố định trong khi chạy ba instance. Kafka dùng `transactional.id` để định danh một producer có giao dịch **qua các lần khởi động lại**, và cơ chế của nó là: khi một producer khởi tạo giao dịch với một id, mọi producer cũ dùng cùng id đó bị loại bỏ — đó là cách Kafka bảo đảm không có hai producer zombie cùng ghi. Nên ba instance dùng cùng một id nghĩa là mỗi lần một instance khởi động hoặc khởi tạo lại, nó vô hiệu hoá hai instance kia; chúng nhận lỗi, khởi tạo lại, và đá ngược lại. Kết quả là một vòng lặp đá nhau: transaction liên tục bị abort, và thông lượng sụp chứ không tăng như đội mong. Sửa bằng cách cho mỗi instance một `transactional.id` duy nhất — và phải **ổn định** qua các lần khởi động lại của chính instance đó, vì nếu sinh ngẫu nhiên thì producer cũ không bao giờ bị loại bỏ và ta mất chính bảo đảm mà id này tồn tại để cung cấp. Lỗi ở dòng (2) thuộc phạm vi: `db.insert` nằm hoàn toàn ngoài transaction của Kafka. Transaction của Kafka bao được việc gửi vào topic và việc commit offset, nhưng nó không biết gì về database. Nên nếu transaction bị abort sau khi vòng lặp đã chèn vài bản ghi — vì đá nhau như trên, vì timeout, hay vì tiến trình chết — thì những bản ghi đó vẫn nằm trong database trong khi Kafka coi như lô này chưa xử lý; lần xử lý lại sẽ chèn lần nữa. Dữ liệu hai bên lệch nhau và \"exactly-once\" chỉ đúng về phía Kafka. Có hai cách sửa và tôi ưa cách thứ hai. Cách thứ nhất là làm `db.insert` idempotent theo một khoá suy được từ bản ghi — chẳng hạn topic cộng partition cộng offset — để lần ghi lại không nhân đôi. Cách thứ hai, sạch hơn về kiến trúc, là bỏ việc ghi database khỏi vòng lặp này và để một consumer riêng đọc topic `enriched` rồi ghi xuống database với khoá idempotent của nó. Khi đó mỗi thành phần có đúng một nơi đến, và phạm vi bảo đảm khớp với phạm vi transaction.",
    redFlags: [
      "Chỉ thấy lỗi ở dòng (2) mà bỏ qua `transactional.id` dùng chung",
      "Sinh `transactional.id` ngẫu nhiên mỗi lần khởi động",
      "Cho rằng transaction của Kafka có thể bao trùm database nếu cấu hình đúng",
      "Bỏ transaction và quay về commit thủ công để tránh phức tạp",
    ],
    probes: [
      "Vì sao `transactional.id` phải ổn định qua khởi động lại?",
      "Khoá idempotent cho `db.insert` bạn suy từ đâu?",
      "Vì sao tách consumer riêng lại sạch hơn về kiến trúc?",
    ],
    refs: ["kafka-08"],
  },
  {
    id: "kafka-iq15",
    field: "kafka",
    topic: "kf-reliability",
    level: 3,
    minutes: 11,
    question: "Bạn cần bảo đảm cho một luồng đọc–xử lý–ghi. Chọn ít nhất một lần cộng idempotent hạ nguồn, hay transaction của Kafka?",
    tradeoffs: [
      {
        option: "Ít nhất một lần cộng **idempotent ở hạ nguồn**",
        when: "Khi nơi đến là một hệ thống **ngoài Kafka** — database, API. Transaction của Kafka không bao được nó, nên tính idempotent ở hạ nguồn là thứ duy nhất thật sự bảo vệ. Đơn giản hơn, ít chi phí hơn.",
      },
      {
        option: "Transaction của Kafka",
        when: "Khi luồng **nằm trong Kafka**: đọc topic, xử lý, ghi topic khác. Nó cho nguyên khối cả việc ghi lẫn commit offset, nên không có trạng thái nửa vời. Đổi lại là chi phí hiệu năng và thêm một tầng cấu hình dễ sai.",
      },
      {
        option: "Cả hai ở hai chặng khác nhau",
        when: "Kiến trúc thường thấy: transaction cho chặng trong Kafka, rồi một consumer riêng ghi ra ngoài với khoá idempotent. Mỗi chặng có bảo đảm đúng phạm vi của nó, thay vì một cơ chế cố bao cả hai.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **nơi đến nằm trong hay ngoài Kafka**",
      "Transaction của Kafka chỉ bao được thứ nằm trong Kafka — ghi ra ngoài không thuộc phạm vi",
      "Nên với nơi đến ngoài Kafka, tính idempotent ở hạ nguồn là bắt buộc bất kể ta dùng gì ở phía Kafka",
      "Ít nhất một lần cộng idempotent hạ nguồn thường **đủ** và đơn giản hơn nhiều",
      "Transaction có chi phí hiệu năng thật, và thêm cấu hình dễ sai như `transactional.id`",
      "Consumer đọc topic có transaction cần đặt mức cô lập phù hợp, nếu không nó vẫn đọc được dữ liệu chưa commit",
      "Khoá idempotent nên suy từ dữ liệu một cách **tất định**, không sinh ngẫu nhiên",
    ],
    model: "Tôi quyết định bằng một câu hỏi duy nhất: nơi đến nằm trong Kafka hay ngoài Kafka? Nếu luồng là đọc một topic, xử lý, rồi ghi sang topic khác thì transaction của Kafka đúng việc và cho một thứ rất giá trị — nó gộp cả việc ghi lẫn việc commit offset vào một đơn vị, nên không có trạng thái nửa vời kiểu \"đã ghi nhưng chưa commit offset\" hay ngược lại. Đổi lại là chi phí hiệu năng thật và một tầng cấu hình dễ sai, trong đó `transactional.id` là chỗ hay sai nhất. Một chi tiết cũng phải làm đúng ở phía tiêu thụ: consumer đọc topic có transaction phải đặt mức cô lập phù hợp, nếu không nó vẫn đọc được cả những bản ghi thuộc transaction chưa commit — và khi đó toàn bộ công sức ở phía ghi trở nên vô nghĩa. Nếu nơi đến ở ngoài Kafka — một database, một API đối tác — thì transaction của Kafka không bao được nó, và không cấu hình nào đổi được điều đó. Khi ấy thứ duy nhất thật sự bảo vệ là tính idempotent ở phía hạ nguồn, và tôi chọn mô hình đơn giản hơn: ít nhất một lần ở phía Kafka, cộng một khoá idempotent ở phía ghi. Khoá đó phải suy từ dữ liệu một cách tất định — topic cộng partition cộng offset, hoặc một id nghiệp vụ — chứ không sinh ngẫu nhiên, vì nếu nó đổi giữa hai lần thử thì nó không khử được gì. Cách này ít chi phí hơn, ít chỗ sai hơn, và nó đặt bảo đảm ở đúng nơi thao tác nguy hiểm xảy ra. Trong thực tế thì kiến trúc tôi thường dùng là cả hai ở hai chặng: transaction cho chặng trong Kafka, rồi một consumer riêng đọc topic kết quả và ghi ra ngoài với khoá idempotent. Lý do không phải để \"an toàn hơn\" mà để mỗi chặng có bảo đảm đúng phạm vi của nó — thay vì một cơ chế cố bao cả hai rồi để lại một khoảng hở mà không ai nhận ra cho tới lúc đối soát.",
    redFlags: [
      "Chọn transaction của Kafka cho một luồng có nơi đến là database và tin rằng thế là đủ",
      "Dùng transaction mà không đặt mức cô lập ở phía consumer",
      "Sinh khoá idempotent ngẫu nhiên",
      "Nói ít nhất một lần là lựa chọn kém hơn về bản chất",
    ],
    probes: [
      "Consumer không đặt mức cô lập phù hợp thì đọc được gì?",
      "Bạn suy khoá idempotent từ đâu cho một bản ghi Kafka?",
      "Chi phí hiệu năng của transaction đến từ đâu?",
    ],
    refs: ["kafka-08", "kafka-07"],
  },
  {
    id: "kafka-iq16",
    field: "kafka",
    topic: "kf-reliability",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một luồng xử lý dùng transaction của Kafka báo \"exactly-once\", nhưng đối soát phát hiện 8.400 bản ghi **trùng lặp** trong database hạ nguồn trong ba tháng. Topic Kafka thì không có bản trùng nào. Consumer ghi xuống database bằng `INSERT` đơn thuần, và nó commit offset sau khi `INSERT` thành công.",
      scale: "6.000 bản ghi mỗi phút. Consumer đã bị khởi động lại 61 lần trong ba tháng vì triển khai. Bản ghi trùng gây sai số trong báo cáo doanh thu.",
      constraints: "Không đổi được schema database để thêm ràng buộc duy nhất — 4 hệ thống khác đang ghi vào bảng đó với quy ước khác. Phải chặn được, và phải xác định được 8.400 bản ghi đã trùng.",
      },
    question: "Topic sạch mà database trùng: bảo đảm \"exactly-once\" của Kafka thực ra kết thúc ở đâu? Và làm gì khi không đổi được schema?",
    mustCover: [
      "Topic không trùng nghĩa là bảo đảm phía Kafka **đang hoạt động đúng** — lỗi nằm ở chặng sau",
      "Chặng ghi ra database **không** nằm trong phạm vi transaction của Kafka, nên nó chỉ có bảo đảm ít nhất một lần",
      "Cửa sổ lỗi cụ thể: `INSERT` thành công rồi tiến trình chết **trước khi** commit offset",
      "Lần đọc lại sẽ `INSERT` lần nữa — và `INSERT` đơn thuần không có gì chặn",
      "61 lần khởi động lại khớp về quy mô với 8.400 bản ghi ở 6.000 bản ghi mỗi phút",
      "Sửa mà không đổi schema: dùng **khoá idempotent tất định** suy từ topic, partition và offset",
      "Cụ thể là một bảng phụ ghi nhận những khoá đã xử lý, kiểm trước khi chèn — hoặc chèn cả hai trong một transaction database",
      "Xác định 8.400 bản ghi trùng bằng cách tìm các nhóm bản ghi giống nhau trong cửa sổ quanh mỗi lần khởi động lại",
    ],
    model: "Việc topic Kafka không có bản trùng là dữ kiện quan trọng nhất và nó khoanh vùng rất gọn: bảo đảm phía Kafka đang hoạt động đúng như thiết kế, nên lỗi nằm hoàn toàn ở chặng sau nó. Và chặng đó — ghi xuống database — không nằm trong phạm vi transaction của Kafka, bất kể ta cấu hình gì. Transaction của Kafka bao được việc ghi vào topic và việc commit offset; nó không biết gì về database. Nên chặng này thực chất chỉ có bảo đảm ít nhất một lần, và cửa sổ lỗi rất cụ thể: `INSERT` thành công, rồi tiến trình chết trước khi commit offset. Kafka coi lô đó chưa được xử lý, consumer mới đọc lại từ offset cũ, và `INSERT` chạy lần nữa — với một `INSERT` đơn thuần thì không có gì chặn nó. Con số khớp: 61 lần khởi động lại, mỗi lần xử lý lại một lô ở tốc độ 6.000 bản ghi mỗi phút, cho ra bậc hàng nghìn tới chục nghìn bản ghi trùng, đúng 8.400. Điều đáng nói với đội là \"exactly-once\" của họ chưa bao giờ sai — nó chỉ có phạm vi hẹp hơn họ tưởng, và khoảng hở nằm đúng ở ranh giới ra khỏi Kafka. Về cách sửa trong ràng buộc không đổi schema: ràng buộc duy nhất trên bảng chính là cách đẹp nhất nhưng đã bị loại, nên tôi chuyển việc khử trùng sang một khoá idempotent tất định. Mỗi bản ghi Kafka có một định danh tự nhiên và duy nhất: topic cộng partition cộng offset. Tôi dùng nó làm khoá, và ghi nhận những khoá đã xử lý vào một bảng phụ của riêng dịch vụ này — bảng đó do tôi sở hữu nên không vướng bốn hệ thống kia. Cách làm đúng là chèn khoá vào bảng phụ và chèn dữ liệu vào bảng chính **trong cùng một transaction database**: nếu khoá đã tồn tại thì transaction thất bại và ta biết bản ghi đã được xử lý, còn nếu thành công thì cả hai cùng có. Khi đó việc xử lý lại sau khởi động lại trở nên vô hại, và tôi không còn phải lo về thời điểm commit offset. Về việc xác định 8.400 bản ghi đã trùng: tôi không dùng log mà truy trên dữ liệu — tìm các nhóm bản ghi giống nhau về nội dung nghiệp vụ, và đối chiếu thời điểm của chúng với các mốc khởi động lại đã biết để xác nhận nguyên nhân. Vì lỗi là xác định và có cửa sổ rõ, tập tìm được sẽ đủ tin để đưa vào đối soát doanh thu.",
    redFlags: [
      "Kết luận Kafka mất bảo đảm exactly-once",
      "Đổi thứ tự thành commit offset trước rồi `INSERT` — đổi trùng lặp thành mất dữ liệu",
      "Đòi thêm ràng buộc duy nhất vào bảng chính — ràng buộc đã cấm",
      "Giảm số lần triển khai để giảm trùng lặp",
      "Dùng một khoá idempotent sinh từ thời điểm xử lý thay vì từ định danh bản ghi",
    ],
    probes: [
      "Vì sao commit offset trước lại đổi trùng lặp thành mất dữ liệu?",
      "Bảng phụ của bạn cần những cột gì, và dọn dữ liệu cũ ra sao?",
      "Nếu database không hỗ trợ transaction giữa hai bảng thì bạn làm gì?",
    ],
    refs: ["kafka-08", "kafka-07"],
  },

  // ===== kf-integration — Pipeline, mirroring và admin (kafka-iq17–kafka-iq20) =====
  {
    id: "kafka-iq17",
    field: "kafka",
    topic: "kf-integration",
    level: 1,
    minutes: 5,
    question: "Khi nào bạn dùng Kafka Connect thay vì tự viết một producer hoặc consumer? Nêu những gì nó cho mà mã tự viết thường thiếu.",
    mustCover: [
      "Connect là khung cho việc **di chuyển dữ liệu** giữa Kafka và hệ thống khác, không phải cho việc biến đổi nghiệp vụ",
      "Nó cho sẵn những thứ mã tự viết thường thiếu: **quản lý offset**, khởi động lại, phân phối công việc, xử lý lỗi",
      "Nó cũng cho **quản lý cấu hình qua API** thay vì phát hành lại mã mỗi lần đổi nguồn hay đích",
      "Nên dùng Connect khi việc cần làm là \"đọc từ A ghi vào Kafka\" hoặc ngược lại, **không** kèm logic nghiệp vụ",
      "Tự viết khi có biến đổi nghiệp vụ đáng kể, hoặc cần kiểm soát chi tiết mà Connect không cho",
      "Sai lầm phổ biến: nhồi logic nghiệp vụ vào các phép biến đổi đơn giản của Connect rồi khó bảo trì",
    ],
    model: "Connect là một khung dành riêng cho việc di chuyển dữ liệu giữa Kafka và các hệ thống khác — đọc từ một nguồn vào Kafka, hoặc lấy từ Kafka ghi ra một đích. Nó không phải khung để biến đổi dữ liệu theo nghiệp vụ, và phân biệt đó quyết định khi nào nên dùng nó. Giá trị của Connect nằm ở những thứ mà một producer hay consumer tự viết gần như luôn thiếu ở lần đầu, rồi phải bổ sung dần qua nhiều sự cố: quản lý offset và vị trí đọc ở phía nguồn, khởi động lại sạch sẽ sau khi chết, phân phối công việc giữa nhiều worker, xử lý lỗi và bản ghi lỗi, và theo dõi trạng thái. Mỗi việc trong số đó không khó, nhưng làm đúng cả gói thì tốn nhiều thời gian hơn người ta dự tính — và đó là công việc lặp lại y nhau cho mọi kết nối. Một giá trị thực hành nữa là quản lý cấu hình qua API: thêm một bảng cần đồng bộ, đổi một tham số của đích, hay tạm dừng một connector đều làm được mà không phát hành lại mã — điều mà một consumer tự viết thường đòi một lần triển khai. Nên nguyên tắc của tôi là: nếu việc cần làm là di chuyển dữ liệu mà không kèm logic nghiệp vụ đáng kể, dùng Connect. Nếu có biến đổi nghiệp vụ thật — làm giàu từ nhiều nguồn, quyết định theo quy tắc, tính toán trạng thái — thì viết ứng dụng riêng, hoặc dùng một khung xử lý luồng. Sai lầm tôi thấy nhiều nhất là nhồi logic nghiệp vụ vào các phép biến đổi đơn giản mà Connect cung cấp: nó chạy được ở mức đơn giản, rồi lớn dần thành một tập cấu hình không kiểm thử được và không ai dám sửa.",
    redFlags: [
      "Coi Connect là khung xử lý nghiệp vụ",
      "Chỉ nói \"Connect tiện hơn\" mà không nêu những thứ nó cho sẵn",
      "Tự viết consumer cho một việc thuần di chuyển dữ liệu rồi tự làm lại quản lý offset",
    ],
    probes: [
      "Ranh giới giữa \"biến đổi đơn giản\" và \"logic nghiệp vụ\" ở đâu?",
      "Bạn kiểm thử một cấu hình Connect thế nào?",
      "Bản ghi lỗi trong Connect nên đi đâu?",
    ],
    refs: ["kafka-09", "kafka-05"],
  },
  {
    id: "kafka-iq18",
    field: "kafka",
    topic: "kf-integration",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Cấu hình mirroring giữa hai cluster để dự phòng:

  source: cluster-A (vùng 1)   →   target: cluster-B (vùng 2)
  topic: orders → orders          # giữ NGUYÊN tên
  consumer group offset: KHÔNG đồng bộ

Kế hoạch dự phòng: khi vùng 1 sập, chuyển consumer sang cluster-B,
đọc topic "orders" từ offset đã commit.

Sự cố khi diễn tập: consumer chuyển sang cluster-B rồi đọc lại
toàn bộ topic từ đầu, xử lý lại 40 triệu bản ghi.`,
    },
    question: "Vì sao offset không dùng được ở cluster đích? Nêu hai lỗi của kế hoạch này và cách sửa từng cái.",
    mustCover: [
      "Offset là **vị trí trong log của một partition cụ thể trên một cluster cụ thể** — nó không mang nghĩa xuyên cluster",
      "Cluster đích nhận bản ghi theo thứ tự nó sao chép được, nên cùng một bản ghi có offset **khác nhau** ở hai cluster",
      "Vì vậy commit offset ở cluster A hoàn toàn vô nghĩa với cluster B",
      "Lỗi thứ hai: giữ nguyên tên topic làm việc mirroring **hai chiều** trở nên nguy hiểm — dễ tạo vòng lặp sao chép",
      "Sửa lỗi offset: dùng cơ chế **đồng bộ offset** của công cụ mirroring, nó ánh xạ offset giữa hai cluster",
      "Hoặc thiết kế consumer không dựa vào offset mà dựa vào một **mốc nghiệp vụ** tất định trong dữ liệu",
      "Sửa lỗi tên: dùng tiền tố theo cluster nguồn để phân biệt topic gốc với topic đã sao chép",
      "Và phải **diễn tập** việc chuyển vùng — chính buổi diễn tập này đã làm đúng việc của nó",
    ],
    model: "Offset không dùng được xuyên cluster vì bản chất của nó: offset là vị trí trong log của một partition cụ thể trên một cluster cụ thể — nó là một số đếm tăng theo thứ tự bản ghi được ghi vào log đó. Cluster đích nhận bản ghi qua quá trình sao chép, và thứ tự cùng thời điểm nó ghi vào log của nó không nhất thiết trùng với cluster nguồn; hơn nữa nó bắt đầu từ một thời điểm khác và có thể đã cắt bớt dữ liệu cũ theo chính sách lưu của nó. Nên cùng một bản ghi nghiệp vụ có hai offset khác nhau ở hai cluster, và một offset đã commit ở cluster A trỏ vào một chỗ hoàn toàn khác ở cluster B — hoặc không hợp lệ, và khi đó consumer rơi về hành vi mặc định là đọc lại từ đầu. Đó chính xác là điều đã xảy ra trong buổi diễn tập. Cách sửa là dùng cơ chế đồng bộ offset của công cụ mirroring: nó theo dõi ánh xạ giữa offset nguồn và offset đích rồi chuyển đổi vị trí đã commit của consumer group sang cluster đích, nên consumer tiếp tục được từ đúng chỗ. Một hướng bổ sung mà tôi thường khuyên cho những luồng quan trọng: thiết kế consumer sao cho nó không phụ thuộc hoàn toàn vào offset mà có một mốc nghiệp vụ tất định — chẳng hạn nó ghi nhận id bản ghi cuối đã xử lý — để việc chuyển vùng không phụ thuộc vào một cơ chế hạ tầng duy nhất. Lỗi thứ hai của kế hoạch là giữ nguyên tên topic ở cả hai cluster. Nó có vẻ tiện vì consumer không phải đổi cấu hình, nhưng nó xoá mất thông tin về nguồn gốc của dữ liệu, và nếu về sau có ai bật sao chép theo chiều ngược lại — điều rất hay xảy ra khi vùng 1 hồi phục — thì bản ghi đi vòng giữa hai cluster mãi. Cách làm an toàn là đặt tiền tố theo cluster nguồn cho topic đã sao chép, để phân biệt rõ dữ liệu gốc với dữ liệu sao chép. Điều cuối tôi muốn nhấn: buổi diễn tập này đã làm đúng việc của nó — một kế hoạch dự phòng chưa diễn tập thì chỉ là một tài liệu, và phát hiện lỗi trong diễn tập rẻ hơn vô cùng so với phát hiện lúc vùng 1 thật sự sập.",
    redFlags: [
      "Cho rằng offset là một định danh toàn cục của bản ghi",
      "Đề nghị chấp nhận xử lý lại từ đầu như một phần của kế hoạch dự phòng",
      "Giữ nguyên tên topic và bật sao chép hai chiều",
      "Kết luận kế hoạch dự phòng đã ổn vì dữ liệu đã có ở cluster B",
    ],
    probes: [
      "Vì sao sao chép hai chiều với cùng tên topic lại tạo vòng lặp?",
      "Mốc nghiệp vụ tất định của bạn trông thế nào?",
      "Ngoài offset, còn gì không chuyển được xuyên cluster?",
    ],
    refs: ["kafka-10", "kafka-09"],
  },
  {
    id: "kafka-iq19",
    field: "kafka",
    topic: "kf-integration",
    level: 3,
    minutes: 10,
    question: "Bạn cần đưa dữ liệu từ một database vào Kafka. Chọn đọc định kỳ theo truy vấn, hay đọc log thay đổi của database?",
    tradeoffs: [
      {
        option: "Đọc log thay đổi của database",
        when: "Khi cần **mọi** thay đổi, kể cả xoá, và cần độ trễ thấp. Nó bắt được cả những thay đổi mà truy vấn định kỳ bỏ sót, và không tạo tải truy vấn lên database. Đổi lại là phụ thuộc cơ chế nội bộ của database và cần quyền cao hơn.",
      },
      {
        option: "Đọc định kỳ theo một cột mốc",
        when: "Khi chỉ cần dữ liệu mới hoặc mới cập nhật và độ trễ tính bằng phút là đủ. Đơn giản, không cần quyền đặc biệt. Nhưng nó **không bắt được xoá**, và bỏ sót thay đổi nếu cột mốc không đáng tin.",
      },
      {
        option: "Ứng dụng tự phát sự kiện khi ghi",
        when: "Khi ta kiểm soát mã ghi và muốn sự kiện mang **ngữ nghĩa nghiệp vụ** thay vì hình dạng bảng. Đổi lại là nguy cơ ghi database thành công mà phát sự kiện thất bại — cần mẫu hộp thư đi để hai việc nguyên khối.",
      },
    ],
    mustCover: [
      "Đọc định kỳ theo cột mốc **không bắt được xoá** — đó là giới hạn cơ bản, không phải chi tiết",
      "Nó cũng bỏ sót thay đổi nếu cột mốc không được cập nhật đúng, hoặc nếu có nhiều thay đổi trong cùng một đơn vị thời gian của cột mốc",
      "Đọc log thay đổi bắt được mọi thao tác và không tạo tải truy vấn, nhưng gắn chặt với **cơ chế nội bộ** của database",
      "Sự kiện do ứng dụng phát mang được ngữ nghĩa nghiệp vụ — thứ mà hai cách kia chỉ cho hình dạng bảng",
      "Nhưng nó có bài toán **hai lần ghi**: database và Kafka có thể lệch nhau nếu một trong hai thất bại",
      "Mẫu **hộp thư đi** giải bài toán đó: ghi sự kiện vào cùng transaction với dữ liệu, rồi một tiến trình riêng đẩy sang Kafka",
      "Chọn theo nhu cầu: bắt xoá hay không, độ trễ bao nhiêu, và sự kiện cần mang ngữ nghĩa nghiệp vụ hay không",
    ],
    model: "Ba cách này khác nhau ở một điểm quyết định trước cả độ trễ: **thứ chúng có thể thấy**. Đọc định kỳ theo một cột mốc chỉ thấy những dòng hiện có mà cột mốc lớn hơn lần đọc trước, nên nó về nguyên tắc **không bắt được xoá** — dòng đã biến mất thì không truy vấn nào tìm ra được. Đó không phải một chi tiết mà là một giới hạn cơ bản, và nó đủ để loại cách này với mọi luồng cần trạng thái đầy đủ. Nó còn hai điểm yếu nữa: nếu cột mốc không được cập nhật đúng trong một đường ghi nào đó thì thay đổi đó im lặng bị bỏ sót, và nếu có nhiều thay đổi trong cùng một đơn vị thời gian của cột mốc thì ranh giới giữa hai lần đọc dễ mất hoặc lặp bản ghi. Đọc log thay đổi của database thấy được mọi thao tác, gồm cả xoá, theo đúng thứ tự chúng xảy ra, và nó không tạo tải truy vấn lên database vì nó đọc log. Cái giá là nó gắn chặt với cơ chế nội bộ của database, cần quyền cao hơn, và nâng cấp database trở thành việc phải kiểm lại đường dữ liệu. Cách thứ ba khác hẳn về bản chất: ứng dụng tự phát sự kiện khi ghi. Ưu điểm lớn nhất không phải kỹ thuật mà là ngữ nghĩa — sự kiện mang ý nghĩa nghiệp vụ như \"đơn hàng đã được thanh toán\", thay vì \"dòng trong bảng orders đã đổi cột status\". Hai cách kia chỉ cho ta hình dạng bảng, và người tiêu thụ phải tự suy ra nghiệp vụ từ đó, nên mọi lần đổi schema là một lần đổi hợp đồng với mọi người tiêu thụ. Nhưng cách này có bài toán hai lần ghi: nếu ghi database thành công mà phát sự kiện thất bại thì hai hệ thống lệch nhau, và ngược lại. Lời giải là mẫu hộp thư đi — ghi sự kiện vào một bảng trong **cùng transaction** với dữ liệu, rồi một tiến trình riêng đọc bảng đó và đẩy sang Kafka; hai việc trở nên nguyên khối vì chúng nằm trong cùng một transaction database. Nên tôi chọn theo ba câu hỏi: có cần bắt xoá không, độ trễ cần bao nhiêu, và sự kiện có cần mang ngữ nghĩa nghiệp vụ không.",
    redFlags: [
      "Chọn đọc định kỳ cho một luồng cần trạng thái đầy đủ, bỏ qua việc không bắt được xoá",
      "Phát sự kiện trực tiếp trong mã ghi mà không có mẫu hộp thư đi",
      "Không phân biệt sự kiện mang hình dạng bảng với sự kiện mang ngữ nghĩa nghiệp vụ",
      "Chọn đọc log thay đổi mà không nói tới ràng buộc về quyền và nâng cấp database",
    ],
    probes: [
      "Người tiêu thụ nhận sự kiện hình dạng bảng chịu hệ quả gì khi bạn đổi schema?",
      "Mẫu hộp thư đi cần gì để không tích tụ vô hạn?",
      "Cột mốc kiểu timestamp có những cách sai nào?",
    ],
    refs: ["kafka-09"],
  },
  {
    id: "kafka-iq20",
    field: "kafka",
    topic: "kf-integration",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một pipeline đồng bộ database sang Kafka bằng truy vấn định kỳ theo cột `updated_at`. Sau hai năm, đối soát phát hiện hệ thống hạ nguồn thiếu 2.900 bản ghi và có 15.000 bản ghi **đã bị xoá** ở nguồn nhưng vẫn tồn tại ở đích.",
      scale: "1,2 triệu bản ghi, khoảng 40.000 thay đổi mỗi ngày. Hệ thống hạ nguồn dùng để tính hoa hồng cho 300 đối tác.",
      constraints: "Không bật được đọc log thay đổi của database trong quý này — cần quyền mà đội DBA chưa cấp. Phải hoà giải cả hai loại sai lệch. Phải chặn cả hai loại, không chỉ loại thiếu bản ghi.",
      },
    question: "Hai loại sai lệch có hai nguyên nhân khác nhau. Chẩn đoán từng loại, rồi nêu cách chặn khi chưa bật được đọc log thay đổi.",
    mustCover: [
      "15.000 bản ghi tồn tại ở đích là do truy vấn định kỳ **về nguyên tắc không bắt được xoá**",
      "Đó không phải lỗi cài đặt mà là giới hạn của phương pháp — không tinh chỉnh nào sửa được",
      "2.900 bản ghi thiếu là loại khác: thay đổi bị **bỏ sót** giữa hai lần đọc",
      "Nguyên nhân khả dĩ: `updated_at` không được cập nhật ở một đường ghi nào đó, hoặc ranh giới thời gian giữa hai lần đọc bị mất bản ghi",
      "Cũng có thể do nhiều bản ghi cùng một mốc thời gian nằm vắt qua ranh giới đọc",
      "Chặn loại xoá khi chưa có log thay đổi: chuyển sang **xoá mềm** ở nguồn, để xoá trở thành một lần cập nhật",
      "Chặn loại thiếu: đối soát định kỳ **toàn bộ** theo lô — so tập id và một tổng kiểm để phát hiện lệch",
      "Và phải rà mọi đường ghi để bảo đảm `updated_at` luôn được cập nhật; đường nào không thì đó là nguồn bỏ sót",
    ],
    model: "Hai loại sai lệch có hai nguyên nhân khác nhau về bản chất, và tôi sẽ tách rõ vì cách chặn cũng khác nhau. 15.000 bản ghi đã xoá ở nguồn mà vẫn còn ở đích không phải một lỗi cài đặt — nó là giới hạn cơ bản của phương pháp. Một truy vấn định kỳ chỉ thấy những dòng **đang tồn tại** thoả điều kiện; dòng đã bị xoá thì không có truy vấn nào tìm ra nó, nên không có cách nào để pipeline biết mà truyền tin xoá đi. Điều quan trọng phải nói với đội là không tinh chỉnh nào sửa được điều này: tăng tần suất đọc, mở rộng cửa sổ, thêm chỉ mục — không cái nào chạm tới vấn đề. 2.900 bản ghi thiếu là loại hoàn toàn khác: những thay đổi thật đã xảy ra nhưng bị bỏ sót giữa hai lần đọc. Có ba nguyên nhân khả dĩ và tôi sẽ kiểm cả ba. Thứ nhất, có đường ghi nào đó không cập nhật `updated_at` — một script vận hành, một migration, một đường API cũ; với dữ liệu hai năm thì gần như chắc chắn có. Thứ hai, ranh giới thời gian giữa hai lần đọc bị mất bản ghi, chẳng hạn nếu truy vấn dùng so sánh nghiêm ngặt và có bản ghi rơi đúng mốc. Thứ ba, nhiều bản ghi cùng một giá trị `updated_at` nằm vắt qua ranh giới đọc, nên phần sau bị bỏ. Về cách chặn khi chưa bật được đọc log thay đổi — ràng buộc thật và tôi tôn trọng nó — tôi làm ba việc. Việc quan trọng nhất là chuyển sang **xoá mềm** ở nguồn: thay vì xoá dòng, đánh dấu nó đã xoá và cập nhật `updated_at`. Khi đó việc xoá trở thành một lần cập nhật bình thường mà truy vấn định kỳ bắt được, và giới hạn cơ bản kia biến mất — đây là thay đổi quan trọng nhất và nó thuộc về ứng dụng nguồn chứ không thuộc pipeline. Việc thứ hai là rà mọi đường ghi vào bảng để bảo đảm `updated_at` luôn được cập nhật, và tốt nhất là đưa việc đó xuống tầng database bằng trigger hoặc mặc định, để không phụ thuộc kỷ luật của từng đường mã. Việc thứ ba, và là lưới an toàn cho cả hai loại: đối soát định kỳ toàn bộ theo lô — so tập id giữa nguồn và đích cùng một tổng kiểm trên các trường quan trọng, rồi báo động khi lệch. Với 1,2 triệu bản ghi thì việc này chạy được hàng đêm, và nó biến \"phát hiện sau hai năm\" thành \"phát hiện sau một ngày\". Riêng phần hoà giải thì loại xoá dễ hơn: so tập id để tìm 15.000 bản ghi cần xoá ở đích. Loại thiếu thì phải lấy lại từ nguồn theo tập id chênh lệch, và vì hoa hồng 300 đối tác đã được tính trên dữ liệu sai nên cần một đường tính lại cho các kỳ bị ảnh hưởng.",
    redFlags: [
      "Tăng tần suất đọc hoặc mở rộng cửa sổ thời gian để chữa loại xoá",
      "Gộp hai loại sai lệch thành một nguyên nhân",
      "Đòi bật đọc log thay đổi làm điều kiện tiên quyết — ràng buộc đã cấm trong quý này",
      "Chỉ sửa pipeline mà không chạm tới việc `updated_at` không đáng tin",
      "Bỏ qua việc hoa hồng đã được tính trên dữ liệu sai",
    ],
    probes: [
      "Vì sao tăng tần suất đọc không chạm tới bài toán xoá?",
      "Bạn rà các đường ghi không cập nhật `updated_at` bằng cách nào?",
      "Tổng kiểm của bạn tính trên những trường nào, và vì sao?",
    ],
    refs: ["kafka-09", "kafka-07"],
  },

  // ===== kf-ops — Vận hành, giám sát và stream (kafka-iq21–kafka-iq24) =====
  {
    id: "kafka-iq21",
    field: "kafka",
    topic: "kf-ops",
    level: 1,
    minutes: 5,
    question: "Nếu chỉ được theo dõi ba đại lượng của một cụm Kafka, bạn chọn ba cái nào và vì sao?",
    mustCover: [
      "**Độ tụt của consumer group** — nó là chỉ báo trực tiếp nhất về việc hệ thống có theo kịp hay không",
      "Phải xem độ tụt **theo từng partition**, không chỉ tổng, vì tụt tập trung một chỗ nghĩa là lệch key",
      "**Số partition dưới số replica mong muốn** — nó báo trước nguy cơ mất dữ liệu trước khi mất thật",
      "Đây là chỉ báo sớm: khi nó khác không, \"đã commit\" đang nghĩa là ít bản ghi hơn ta tưởng",
      "**Số partition không có leader** — nó nghĩa là đang có partition không nhận ghi được",
      "Ba đại lượng này phủ ba câu hỏi khác nhau: có theo kịp không, có an toàn không, có phục vụ được không",
    ],
    model: "Tôi chọn ba đại lượng trả lời ba câu hỏi khác nhau, vì nếu cả ba cùng nói về một chuyện thì ta chỉ có một đại lượng. Thứ nhất là độ tụt của consumer group — khoảng cách giữa offset mới nhất và offset đã commit. Nó là chỉ báo trực tiếp nhất cho câu \"hệ thống có theo kịp hay không\", và nó bắt được mọi thứ làm consumer chậm mà không cần biết nguyên nhân. Điều kiện để nó hữu ích là phải xem theo từng partition chứ không chỉ tổng: độ tụt phân bố đều là bài toán năng lực, còn tụt tập trung ở một hai partition là bài toán lệch key — hai chẩn đoán khác nhau, và con số tổng không phân biệt được. Thứ hai là số partition đang có ít replica in sync hơn số replica mong muốn. Đây là đại lượng tôi coi quan trọng nhất mà hay bị bỏ qua, vì nó là chỉ báo **sớm**: khi nó khác không, nghĩa là ở những partition đó \"dữ liệu đã commit\" đang chỉ nằm trên ít máy hơn ta tưởng — và ta còn chưa mất gì. Nếu chỉ theo dõi lúc mất dữ liệu thì ta luôn phát hiện muộn; theo dõi đại lượng này thì ta thấy trước. Thứ ba là số partition không có leader, vì đó là trạng thái mà partition không nhận ghi được — tức một phần hệ thống đang không phục vụ. Ba cái này phủ ba câu hỏi: có theo kịp không, có an toàn không, và có phục vụ được không. Nếu được thêm cái thứ tư thì tôi sẽ lấy tỉ lệ lỗi ở phía producer, vì nó là nơi sự cố phía broker biểu hiện thành trải nghiệm của ứng dụng.",
    redFlags: [
      "Chỉ chọn các đại lượng về tài nguyên broker như CPU và đĩa",
      "Theo dõi độ tụt tổng mà không theo partition",
      "Không nhắc tới số partition dưới số replica mong muốn",
    ],
    probes: [
      "Độ tụt bằng không nhưng người dùng báo chậm — bạn nghi gì?",
      "Vì sao số partition dưới replica mong muốn là chỉ báo sớm?",
      "Bạn đặt ngưỡng cảnh báo cho độ tụt thế nào?",
    ],
    refs: ["kafka-13", "kafka-12"],
  },
  {
    id: "kafka-iq22",
    field: "kafka",
    topic: "kf-ops",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Cấu hình topic của một hệ thống dùng Kafka làm nguồn sự thật:

  topic: account-events
    cleanup.policy = delete        # (1)
    retention.ms = 604800000       # 7 ngày
    partitions = 6

Cách dùng: khi một dịch vụ mới cần dựng lại trạng thái tài khoản,
nó đọc topic từ đầu và áp dụng lần lượt các sự kiện.

Sự cố: một dịch vụ mới triển khai sau 3 tuần dựng ra trạng thái SAI
cho những tài khoản không có hoạt động gần đây.`,
    },
    question: "Chỉ ra sự mâu thuẫn giữa cách dùng và cấu hình. Nêu cách sửa và nói nó đổi ngữ nghĩa của topic thế nào.",
    mustCover: [
      "`cleanup.policy = delete` với 7 ngày nghĩa là sự kiện **cũ hơn 7 ngày bị xoá**",
      "Nhưng cách dùng là \"đọc từ đầu để dựng lại trạng thái\" — điều đó đòi **toàn bộ lịch sử** còn nguyên",
      "Nên tài khoản không có hoạt động trong 7 ngày đã mất hết sự kiện của nó, và dịch vụ mới dựng ra trạng thái rỗng hoặc thiếu",
      "Sửa: đổi sang `cleanup.policy = compact` — nó giữ **bản ghi mới nhất cho mỗi key** thay vì xoá theo thời gian",
      "Điều đó đòi mỗi sự kiện phải có **key** là định danh tài khoản, nếu không nén gộp không biết giữ gì",
      "Ngữ nghĩa đổi: topic thôi là **dòng sự kiện đầy đủ** và trở thành **ảnh trạng thái mới nhất theo key**",
      "Nên nếu cần cả lịch sử **và** khả năng dựng lại thì phải có hai topic, hoặc một ảnh chụp định kỳ cộng sự kiện gần đây",
      "Xoá một tài khoản trong mô hình nén gộp cần một bản ghi có giá trị rỗng để đánh dấu",
    ],
    model: "Mâu thuẫn nằm giữa một dòng cấu hình và một cách dùng. `cleanup.policy = delete` với thời gian lưu 7 ngày nghĩa là Kafka xoá sự kiện cũ hơn 7 ngày — đó là chính sách lưu theo thời gian, hợp cho dữ liệu mà giá trị giảm dần theo tuổi. Nhưng cách dùng lại là \"dịch vụ mới đọc từ đầu để dựng lại trạng thái\", và điều đó đòi toàn bộ lịch sử còn nguyên vẹn. Hai thứ này loại trừ nhau. Hệ quả khớp chính xác với triệu chứng: một tài khoản có hoạt động cuối cách đây hai tháng thì mọi sự kiện của nó đã bị xoá, nên dịch vụ mới đọc từ đầu chẳng thấy gì và dựng ra trạng thái rỗng — trong khi những tài khoản hoạt động gần đây thì đúng, nên lỗi trông có vẻ ngẫu nhiên. Cách sửa là đổi sang `cleanup.policy = compact`. Nén gộp làm việc khác hoàn toàn: nó giữ bản ghi **mới nhất cho mỗi key** và loại các bản cũ hơn của cùng key, nên dung lượng bị chặn bởi số key chứ không bởi thời gian, và mỗi key luôn còn ít nhất bản mới nhất. Điều kiện bắt buộc là mọi sự kiện phải có key là định danh tài khoản — không có key thì nén gộp không biết giữ gì, nên đây là thay đổi phải kiểm ở phía producer trước. Phần tôi muốn nhấn là nó **đổi ngữ nghĩa** của topic, không chỉ đổi chính sách dọn: topic thôi là một dòng sự kiện đầy đủ và trở thành một ảnh trạng thái mới nhất theo key. Ta mất khả năng đọc lại lịch sử từng bước, nên nếu có ai đang dựa vào việc đọc toàn bộ chuỗi sự kiện để tính toán gì đó thì họ sẽ vỡ. Nếu cần cả hai — lịch sử đầy đủ và khả năng dựng lại nhanh — thì phải có hai topic, hoặc một ảnh chụp trạng thái định kỳ cộng với các sự kiện kể từ ảnh chụp đó. Một chi tiết vận hành đi kèm: trong mô hình nén gộp, xoá một tài khoản phải được diễn đạt bằng một bản ghi có giá trị rỗng cho key đó, vì nếu không thì bản mới nhất của nó sẽ tồn tại mãi.",
    redFlags: [
      "Chỉ tăng thời gian lưu lên rất dài — dung lượng tăng vô hạn và vấn đề vẫn còn về nguyên tắc",
      "Đổi sang nén gộp mà không kiểm mọi sự kiện đã có key",
      "Không nói rằng nén gộp đổi ngữ nghĩa của topic",
      "Bỏ qua cách diễn đạt việc xoá trong mô hình nén gộp",
    ],
    probes: [
      "Ai có thể vỡ khi bạn đổi sang nén gộp?",
      "Bạn diễn đạt việc xoá một tài khoản thế nào?",
      "Nếu cần cả lịch sử đầy đủ thì kiến trúc của bạn ra sao?",
    ],
    refs: ["kafka-06", "kafka-12"],
  },
  {
    id: "kafka-iq23",
    field: "kafka",
    topic: "kf-ops",
    level: 3,
    minutes: 10,
    question: "Bạn cần xử lý luồng có trạng thái — tổng hợp theo cửa sổ, join hai dòng. Chọn tự viết bằng consumer, hay dùng một khung xử lý luồng?",
    tradeoffs: [
      {
        option: "Khung xử lý luồng",
        when: "Khi có **trạng thái** thật — tổng hợp theo cửa sổ, join, đếm theo key. Nó lo phần khó: giữ trạng thái, phục hồi sau khi chết, phân phối lại khi rebalance, và quản lý thời gian sự kiện cùng dữ liệu muộn.",
      },
      {
        option: "Tự viết bằng consumer",
        when: "Khi xử lý **không trạng thái** — biến đổi từng bản ghi, lọc, gửi sang nơi khác. Đơn giản hơn, ít phụ thuộc, và ta kiểm soát hoàn toàn. Với việc không trạng thái thì khung xử lý luồng là chi phí không đổi lại gì.",
      },
      {
        option: "Tự viết cộng một kho trạng thái ngoài",
        when: "Khi cần trạng thái nhưng cũng cần nó **chia sẻ được** với các thành phần khác, hoặc khi trạng thái quá lớn để giữ cục bộ. Đổi lại là mỗi bản ghi thành một lần gọi mạng, và ta tự lo tính nhất quán giữa offset và trạng thái.",
      },
    ],
    mustCover: [
      "Trục quyết định là **có trạng thái hay không** — đây là khác biệt lớn nhất về độ khó",
      "Xử lý không trạng thái thì tự viết là đủ và đơn giản hơn",
      "Xử lý có trạng thái đặt ra bốn bài toán khó: giữ trạng thái, phục hồi, phân phối lại khi rebalance, và thời gian sự kiện",
      "Tự viết phần đó gần như luôn dẫn tới việc dựng lại một khung xử lý luồng, tệ hơn",
      "Trạng thái cục bộ phải **phục hồi được** — nếu không thì mất consumer là mất trạng thái",
      "Khung xử lý luồng giải việc đó bằng cách ghi thay đổi trạng thái vào một topic để dựng lại",
      "Nếu dùng kho trạng thái ngoài thì phải tự bảo đảm offset và trạng thái **khớp nhau** sau khi chết",
    ],
    model: "Trục quyết định duy nhất tôi dùng là: xử lý này có trạng thái hay không. Nếu không — biến đổi từng bản ghi, lọc, đổi định dạng, gửi sang nơi khác — thì tự viết bằng consumer là đủ, và tôi ưu tiên nó: ít phụ thuộc, dễ đọc, dễ debug, và ta kiểm soát hoàn toàn thời điểm commit offset. Với việc không trạng thái thì một khung xử lý luồng chỉ là chi phí học và chi phí vận hành mà không đổi lại gì. Nếu có trạng thái thì bức tranh đổi hẳn, vì nó mở ra bốn bài toán khó mà mỗi cái đều tốn nhiều hơn dự tính. Thứ nhất là giữ trạng thái ở đâu và làm sao nó không lớn vô hạn. Thứ hai là phục hồi: nếu trạng thái giữ trong bộ nhớ cục bộ thì mất tiến trình là mất trạng thái, nên phải có cách dựng lại — và cách mà các khung xử lý luồng dùng là ghi mọi thay đổi trạng thái vào một topic riêng để đọc lại khi cần, một cơ chế đơn giản về ý tưởng nhưng nhiều chi tiết khi hiện thực. Thứ ba là phân phối lại khi rebalance: khi partition chuyển sang consumer khác thì trạng thái tương ứng cũng phải chuyển theo, nếu không consumer mới tính trên trạng thái rỗng. Thứ tư là thời gian sự kiện và dữ liệu muộn — phân biệt thời điểm việc xảy ra với thời điểm ta thấy nó, quyết định khi nào đóng cửa sổ, và làm gì với sự kiện đến sau đó. Kinh nghiệm của tôi là tự viết bốn thứ này gần như luôn dẫn tới việc dựng lại một khung xử lý luồng, chỉ là tệ hơn và không ai ngoài đội hiểu nó. Nên với xử lý có trạng thái tôi dùng khung có sẵn. Phương án kho trạng thái ngoài tôi chọn khi trạng thái cần chia sẻ với thành phần khác hoặc quá lớn để giữ cục bộ; cái giá là mỗi bản ghi thành một lần gọi mạng, và ta tự phải bảo đảm offset đã commit và trạng thái trong kho khớp nhau sau khi tiến trình chết — đúng bài toán hai lần ghi, và nó cần một khoá idempotent hoặc một cơ chế tương đương.",
    redFlags: [
      "Dùng khung xử lý luồng cho việc biến đổi không trạng thái",
      "Tự viết xử lý có trạng thái mà giữ trạng thái trong bộ nhớ không có cách phục hồi",
      "Bỏ qua việc trạng thái phải chuyển theo partition khi rebalance",
      "Dùng kho trạng thái ngoài mà không xử lý việc offset và trạng thái lệch nhau",
    ],
    probes: [
      "Trạng thái cục bộ của bạn phục hồi bằng cách nào sau khi tiến trình chết?",
      "Rebalance xảy ra giữa lúc cửa sổ chưa đóng — chuyện gì xảy ra?",
      "Kho trạng thái ngoài đổi độ trễ mỗi bản ghi thế nào?",
    ],
    refs: ["kafka-14"],
  },
  {
    id: "kafka-iq24",
    field: "kafka",
    topic: "kf-ops",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một cụm Kafka đang chạy tốt thì một broker hết dung lượng đĩa và dừng. Đội thêm một broker mới, nhưng ba ngày sau hai broker khác cũng gần hết đĩa. Đội đã tăng dung lượng đĩa hai lần trong hai tuần. Một topic chiếm 71% tổng dung lượng, và nó có `retention.ms` đặt là -1.",
      scale: "9 broker, 240 topic. Topic lớn nhất nhận 40.000 bản ghi mỗi giây. Tổng dung lượng đã tăng từ 12TB lên 30TB trong hai tuần.",
      constraints: "Không xoá được dữ liệu của topic đó — đội sở hữu nó nói là nguồn sự thật. Không thêm broker nữa trong quý này. Phải đưa ra giải pháp trong tuần này vì đĩa sẽ đầy trong 6 ngày.",
      },
    question: "`retention.ms = -1` nghĩa là gì, và vì sao thêm broker không giúp? Nêu giải pháp trong ràng buộc.",
    mustCover: [
      "`retention.ms = -1` nghĩa là **giữ vĩnh viễn** — không bao giờ xoá theo thời gian",
      "Nên dung lượng của topic đó tăng đơn điệu theo lưu lượng, không có trần",
      "Thêm broker **không** giúp vì nó chỉ chia dung lượng hiện tại ra nhiều máy hơn; tốc độ tăng không đổi",
      "Đó là bài toán **tốc độ tăng**, không phải bài toán dung lượng — nên mọi cách thêm dung lượng chỉ mua thêm thời gian",
      "Với 40.000 bản ghi mỗi giây giữ vĩnh viễn thì không lượng đĩa nào là đủ",
      "Giải pháp không xoá dữ liệu: đổi sang **nén gộp** nếu bản ghi có key và chỉ cần trạng thái mới nhất",
      "Hoặc chuyển dữ liệu cũ sang **lưu trữ tầng lạnh** và giữ Kafka cho phần gần đây",
      "Trước cả hai, việc làm ngay trong 6 ngày: giảm `replication.factor` của topic đó là **sai**; đúng hơn là đổi chính sách lưu cho các topic **khác** để mua thời gian",
    ],
    model: "`retention.ms = -1` nghĩa là giữ vĩnh viễn — Kafka không bao giờ xoá bản ghi của topic đó theo thời gian. Nên dung lượng của nó là một hàm tăng đơn điệu theo lưu lượng, và với 40.000 bản ghi mỗi giây thì nó không có trần. Đó là lý do thêm broker không giúp, và tôi sẽ giải thích bằng cách đặt lại vấn đề: thêm broker chia dung lượng **hiện tại** ra nhiều máy hơn, nhưng nó không đổi **tốc độ tăng**. Đây là bài toán về tốc độ, không phải về dung lượng, nên mọi cách thêm dung lượng — thêm broker, tăng đĩa — chỉ mua thêm thời gian với giá tuyến tính, trong khi nhu cầu tăng không giới hạn. Hai tuần qua đội đã trả giá đó hai lần và sẽ phải trả lần thứ ba trong 6 ngày. Về giải pháp, ràng buộc \"không xoá dữ liệu\" không loại hết lựa chọn vì có hai cách giữ dữ liệu mà không giữ nó **trong Kafka dưới dạng dòng sự kiện đầy đủ**. Cách thứ nhất là đổi sang nén gộp, nếu điều đội thật sự cần là trạng thái mới nhất cho mỗi thực thể chứ không phải toàn bộ chuỗi sự kiện. Nén gộp giữ bản ghi mới nhất cho mỗi key, nên dung lượng bị chặn bởi **số key** thay vì bởi lưu lượng — và đó là sự khác biệt giữa có trần và không có trần. Điều kiện là mọi bản ghi phải có key, và phải xác nhận với đội sở hữu rằng họ không cần đọc lại lịch sử từng bước; đây là một cuộc trao đổi về ngữ nghĩa, không phải một thay đổi cấu hình. Cách thứ hai, nếu họ thật sự cần lịch sử đầy đủ, là chuyển dữ liệu cũ sang một tầng lưu trữ lạnh — dữ liệu vẫn còn và vẫn đọc lại được, chỉ không nằm trong Kafka nữa; Kafka giữ phần gần đây với một thời gian lưu hữu hạn. Điều tôi sẽ nói rõ với đội sở hữu là \"nguồn sự thật\" không bắt buộc phải nằm trong Kafka, và dùng Kafka làm kho lưu trữ vĩnh viễn là dùng sai công cụ — nó là một log có thời gian lưu, không phải một hệ thống lưu trữ. Còn việc mua thời gian trong 6 ngày: tôi không giảm số replica của topic đó vì đó là đổi rủi ro mất dữ liệu lấy dung lượng, đúng thứ không nên làm với dữ liệu quan trọng. Thay vào đó tôi rà 239 topic còn lại để tìm những chỗ thời gian lưu đặt quá dài so với nhu cầu thật — với 240 topic thì gần như chắc chắn có vài chỗ giữ hàng tháng dữ liệu mà không ai đọc, và đó là dung lượng lấy lại được ngay mà không đụng tới dữ liệu quan trọng.",
    redFlags: [
      "Thêm dung lượng đĩa lần thứ ba làm giải pháp chính",
      "Giảm `replication.factor` của topic quan trọng để lấy dung lượng",
      "Đề nghị xoá dữ liệu — ràng buộc đã cấm và cũng không cần",
      "Không phân biệt bài toán tốc độ tăng với bài toán dung lượng",
      "Đổi sang nén gộp mà không xác nhận với đội sở hữu về việc mất lịch sử từng bước",
    ],
    probes: [
      "Vì sao nén gộp đổi bài toán từ không trần thành có trần?",
      "Bạn thuyết phục đội sở hữu rằng Kafka không nên là kho lưu trữ vĩnh viễn thế nào?",
      "Rà 239 topic để tìm dung lượng lấy lại được — bạn làm theo tiêu chí nào?",
    ],
    refs: ["kafka-12", "kafka-06"],
  },
];
