// Lộ trình đọc Kafka: The Definitive Guide — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Kafka: The Definitive Guide", ấn bản 2
// (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly).
// Thư mục nguồn: kafka-vi/ — bản dịch gồm chương 2–14; chương 1 không thuộc phạm vi.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, trên một cluster thật.
// GIỮ NGUYÊN id (kf-w<N> / kf-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const kafkaWeeksPart1 = [
  {
    id: "kf-w1",
    week: "Tuần 1",
    title: "Cài đặt Kafka và cấu hình broker",
    goal: "Dựng được một broker chạy thật và đọc được file server.properties như một bảng đánh đổi, thay vì một danh sách tham số phải học thuộc.",
    practice:
      "Dựng một broker chạy được theo đúng các bước của mục \"Cài đặt một Kafka broker (Installing a Kafka Broker)\" — tarball hoặc Docker Compose đều được. Rồi mở `server.properties`, đặt lại ba tham số mà mục \"Cấu hình broker (Configuring the Broker)\" bàn — `num.partitions`, `log.retention.hours`, `log.segment.bytes` — khởi động lại và dùng `kafka-topics.sh --describe` xác nhận topic mới sinh ra đúng số partition bạn đặt.",
    resources: [
      { label: "Kafka 02 — Cài đặt Kafka", href: "#/docs/kafka-02" },
      { label: "kafka.apache.org — Quickstart", href: "https://kafka.apache.org/quickstart" },
    ],
    items: [
      {
        id: "kf-w1-1",
        text: "Dựng broker đầu tiên: Java, ZooKeeper, rồi Kafka",
        lesson: `**Mục tiêu.** Dựng được một Kafka broker chạy thật từ con số không — Java, ZooKeeper, rồi Kafka — và nói được ZooKeeper đang giữ hộ Kafka thứ gì, vì sao ensemble phải có số node lẻ.

**Đọc.** [Thiết lập môi trường (Environment Setup)](#/docs/kafka-02) chỉ vài dòng dẫn nhập. [Lựa chọn hệ điều hành](#/docs/kafka-02) đọc lướt, nhớ đúng một điều: mọi bước trong chương đều giả định Linux. [Cài đặt Java](#/docs/kafka-02) ngắn, nhưng ghi lại phiên bản cả chương dựa vào — JDK 11 update 10 tại \`/usr/java/jdk-11.0.10\`. [Cài đặt ZooKeeper](#/docs/kafka-02) mở bằng Hình 2-1; đọc kỹ câu nói rằng ZooKeeper lưu metadata về cluster và cả chi tiết về các consumer client. [Standalone server](#/docs/kafka-02) thì gõ lại trọn khối lệnh dựng \`zoo.cfg\` rồi \`zkServer.sh start\`, và xác minh bằng lệnh bốn chữ cái \`srvr\` cho tới khi thấy dòng \`Mode: standalone\`. [ZooKeeper ensemble](#/docs/kafka-02) là mục đọc chậm nhất tuần: định dạng \`server.X=hostname:peerPort:leaderPort\`, ba cổng, file \`myid\` trong \`dataDir\`, và cặp \`initLimit\` với \`syncLimit\` tính theo bội của \`tickTime\`. Cuối cùng [Cài đặt một Kafka broker (Installing a Kafka Broker)](#/docs/kafka-02) — chạy thật cả bốn bước xác minh: tạo topic \`test\`, \`--describe\` nó, produce hai dòng bằng console producer, rồi consume lại với \`--from-beginning\`.

**Bẫy.** Chọn ensemble ba node cho gọn. Khung "XÁC ĐỊNH KÍCH THƯỚC CHO ZOOKEEPER ENSEMBLE CỦA BẠN" khuyên cân nhắc năm node, vì mọi thay đổi cấu hình đều phải nạp lại từng node một: nếu ensemble của bạn không chịu nổi việc mất hơn một node, thì chính công việc bảo trì lại tạo thêm rủi ro; ngược lại cũng không nên vượt bảy node, vì hiệu năng có thể suy giảm do bản chất của giao thức đồng thuận. Bẫy thứ hai: gõ các lệnh CLI theo trí nhớ cũ với cờ \`--zookeeper\`. Khung "VIỆC LOẠI BỎ DẦN KẾT NỐI ZOOKEEPER TRÊN CÁC TIỆN ÍCH CLI CỦA KAFKA" nói rõ tùy chọn đó đã bị deprecated trong hầu hết mọi trường hợp; thực hành tốt nhất hiện nay là \`--bootstrap-server\` trỏ thẳng vào \`host:port\` của bất kỳ broker nào trong cluster.

**Tự kiểm tra.** Vì sao ensemble năm node chịu được hai node hỏng còn ensemble ba node chỉ chịu được một? Và trong khối lệnh cài broker, thư mục \`/tmp/kafka-logs\` giữ thứ gì, và vì sao để nó nằm dưới \`/tmp\` là một ý tồi trên máy thật?`,
      },
      {
        id: "kf-w1-2",
        text: "Cấu hình broker: tham số bắt buộc và mặc định của topic",
        lesson: `**Mục tiêu.** Đọc được \`server.properties\` như một bảng đánh đổi: mỗi tham số đổi thứ gì lấy thứ gì, cái nào bắt buộc phải sửa khi rời khỏi một broker đơn lẻ, và cái nào để nguyên mặc định là đúng.

**Đọc.** [Cấu hình broker (Configuring the Broker)](#/docs/kafka-02) mở đầu bằng lời trấn an rằng phần lớn tùy chọn cứ để nguyên mặc định. [Các tham số broker chung (General Broker Parameters)](#/docs/kafka-02) mới là phần bắt buộc: [broker.id](#/docs/kafka-02) cùng lời khuyên gắn số vào hostname, [listeners](#/docs/kafka-02) với định dạng \`<protocol>://<hostname>:<port>\`, [zookeeper.connect](#/docs/kafka-02) và khung "TẠI SAO NÊN DÙNG ĐƯỜNG DẪN CHROOT?", [log.dirs](#/docs/kafka-02) — chú ý "ít được dùng nhất" nghĩa là ít partition nhất chứ không phải ít dung lượng nhất — rồi [num.recovery.threads.per.data.dir](#/docs/kafka-02) với phép nhân 8 × 3 = 24. Ba mục [auto.create.topics.enable](#/docs/kafka-02), [auto.leader.rebalance.enable](#/docs/kafka-02) và [delete.topic.enable](#/docs/kafka-02) đọc lướt. [Giá trị mặc định cho topic (Topic Defaults)](#/docs/kafka-02) là nửa sau: [num.partitions](#/docs/kafka-02) cùng khung "CÁCH CHỌN SỐ LƯỢNG PARTITION" là mục đọc chậm nhất tuần, rồi [default.replication.factor](#/docs/kafka-02) với quy tắc RF++, [log.retention.ms](#/docs/kafka-02), [log.retention.bytes](#/docs/kafka-02), [log.segment.bytes](#/docs/kafka-02) — tự tính lại ví dụ 17 ngày — [log.roll.ms](#/docs/kafka-02), [min.insync.replicas](#/docs/kafka-02) và [message.max.bytes](#/docs/kafka-02).

**Bẫy.** Đặt \`num.partitions\` thấp rồi tính sẽ sửa sau. Sách nhắc thẳng rằng số lượng partition của một topic chỉ có thể tăng lên, không bao giờ giảm xuống; nếu một topic cần ít partition hơn giá trị mặc định, bạn phải cẩn thận tạo nó thủ công. Bẫy thứ hai: bật cả retention theo thời gian lẫn theo kích thước cho chắc ăn. Khung "CẤU HÌNH RETENTION THEO KÍCH THƯỚC VÀ THEO THỜI GIAN" cho thấy message sẽ bị xóa khi *một trong hai* tiêu chí được thỏa: với \`log.retention.ms\` một ngày và \`log.retention.bytes\` 1 GB, message chưa đầy một ngày tuổi vẫn bị xóa nếu khối lượng trong ngày vượt 1 GB — sách khuyến nghị chọn hoặc kích thước, hoặc thời gian, chứ không phải cả hai.

**Tự kiểm tra.** Với \`log.retention.bytes\` bằng 1 GB trên một topic 8 partition, cluster giữ lại tối đa bao nhiêu dữ liệu, và con số đó đổi thế nào khi bạn thêm partition? Và vì sao \`min.insync.replicas\` chỉ có tác dụng khi producer đặt \`acks\` phù hợp?`,
      },
      {
        id: "kf-w1-3",
        text: "Chọn phần cứng, và Kafka trên cloud",
        lesson: `**Mục tiêu.** Xếp được thứ tự ưu tiên giữa đĩa, bộ nhớ, mạng và CPU cho chính khối lượng công việc của bạn, và chọn được loại instance cùng lưu trữ trên cloud mà không phải đoán.

**Đọc.** [Lựa chọn phần cứng (Selecting Hardware)](#/docs/kafka-02) mở bằng câu thú nhận rằng việc này mang tính nghệ thuật hơn khoa học, rồi liệt kê bốn nút cổ chai. [Disk Throughput](#/docs/kafka-02) là mục quyết định latency của producer — nắm kết luận HDD hợp với cluster lưu trữ lớn ít bị truy cập, SSD hợp khi số kết nối client rất lớn. [Disk Capacity](#/docs/kafka-02) chỉ là một phép nhân, hãy tự chạy nó cho lưu lượng của bạn: 1 TB mỗi ngày, 7 ngày retention là 7 TB, cộng ít nhất 10% overhead. [Memory](#/docs/kafka-02) đọc chậm nhất tuần — page cache mới là thứ quyết định consumer nhanh hay chậm, còn heap JVM thì nhỏ đến bất ngờ: 150.000 message mỗi giây vẫn chạy được trong heap 5 GB. [Networking](#/docs/kafka-02) nói về sự mất cân đối vào/ra do nhiều consumer, và ngưỡng NIC 10 Gb. [CPU](#/docs/kafka-02) ngắn, nhưng nhớ vì sao broker phải giải nén rồi nén lại mọi batch. [Kafka trên cloud (Kafka in the Cloud)](#/docs/kafka-02) cùng [Microsoft Azure](#/docs/kafka-02) và [Amazon Web Services](#/docs/kafka-02) đọc như một bảng tra: các loại instance \`Standard D16s v3\`, \`D64s v4\`, \`m4\`, \`r3\` và thứ mỗi loại đánh đổi.

**Bẫy.** Nhét Kafka chung máy với một ứng dụng đáng kể khác cho tiết kiệm. Mục Memory nói thẳng đây là lý do chính khiến việc đặt chung không được khuyến nghị: ứng dụng kia sẽ phải chia sẻ page cache, làm giảm hiệu năng consumer của Kafka. Bẫy thứ hai: dùng đĩa tạm thời trên Azure vì nó rẻ và nhanh. Sách rất khuyến nghị Azure Managed Disks thay vì ephemeral disk, với lý do rất cụ thể: nếu một VM bị di chuyển, bạn có nguy cơ mất toàn bộ dữ liệu trên Kafka broker của mình — còn HDD Managed Disks thì rẻ nhưng không có SLA rõ ràng về tính sẵn sàng.

**Tự kiểm tra.** Vì sao một broker ghi 1 MB mỗi giây vẫn có thể làm bão hòa NIC 1 Gb? Và trong hai lựa chọn \`m4\` và \`r3\` trên AWS, cái nào cho retention dài hơn, và bạn trả giá bằng gì?`,
      },
      {
        id: "kf-w1-4",
        text: "Từ một broker lên một cluster, và những gì production đòi hỏi",
        lesson: `**Mục tiêu.** Tính được số broker tối thiểu cho một yêu cầu retention và replication cho trước, và kể được ba nhóm thiết lập ngoài Kafka — kernel, GC, bố trí vật lý — mà thiếu chúng thì cluster chưa sẵn sàng chạy production.

**Đọc.** [Cấu hình các cụm Kafka (Configuring Kafka Clusters)](#/docs/kafka-02) với Hình 2-2. [Cần bao nhiêu broker? (How Many Brokers?)](#/docs/kafka-02) là mục đọc chậm nhất tuần: bốn ràng buộc, phép tính 10 TB chia 2 TB ra 5 broker rồi nhân đôi khi bật replication, và cặp con số khuyến nghị hiện hành — không quá 14.000 partition replica trên mỗi broker và 1 triệu replica trên mỗi cluster. [Cấu hình broker (Broker Configuration)](#/docs/kafka-02) chỉ có đúng hai yêu cầu, đọc lướt nhưng nhớ cả hai. [Tinh chỉnh hệ điều hành (OS Tuning)](#/docs/kafka-02) rồi [Virtual memory](#/docs/kafka-02) — \`vm.swappiness\`, \`vm.dirty_background_ratio\`, \`vm.dirty_ratio\`, \`vm.max_map_count\`, \`vm.overcommit_memory\`; chạy thật lệnh \`cat /proc/vmstat\` trên máy của bạn để có con số nền. [Disk](#/docs/kafka-02) cho cặp XFS/Ext4 và tùy chọn mount \`noatime\`; [Networking](#/docs/kafka-02) cho các tham số buffer socket. [Các vấn đề cần lưu ý khi chạy production (Production Concerns)](#/docs/kafka-02) với [Tùy chọn Garbage Collector (Garbage Collector Options)](#/docs/kafka-02) — gõ lại khối \`KAFKA_JVM_PERFORMANCE_OPTS\` — rồi [Bố trí datacenter (Datacenter Layout)](#/docs/kafka-02) và [Đặt chung các ứng dụng trên ZooKeeper (Colocating Applications on ZooKeeper)](#/docs/kafka-02). [Tóm tắt (Summary)](#/docs/kafka-02) khép chương.

**Bẫy.** Đặt \`vm.swappiness\` bằng 0 vì đó là lời khuyên bạn nhớ được. Khung "TẠI SAO KHÔNG ĐẶT SWAPPINESS BẰNG 0?" nói rõ ý nghĩa của giá trị này đã đổi kể từ Linux kernel 3.5-rc1: trước kia là "không swap trừ khi hết bộ nhớ", nay là "không bao giờ swap trong bất kỳ hoàn cảnh nào" — vì thế giá trị được khuyến nghị hiện là 1. Bẫy thứ hai: đặt \`broker.rack\` một lần rồi coi cluster đã rack-aware vĩnh viễn. Mục Bố trí datacenter cảnh báo điều này chỉ áp dụng cho những partition mới được tạo; Kafka cluster không giám sát những partition không còn nhận biết rack nữa, chẳng hạn sau một lần tái phân bổ, và cũng không tự động sửa tình huống đó.

**Tự kiểm tra.** Nếu hai broker cùng khởi động với một \`broker.id\`, chuyện gì xảy ra với broker thứ hai? Và vì sao sách khuyên tách các ứng dụng khác ra khỏi ZooKeeper ensemble của Kafka, dù lưu lượng ghi của Kafka vốn tối thiểu?`,
      },
    ],
  },
  {
    id: "kf-w2",
    week: "Tuần 2",
    title: "Producer: ghi message vào Kafka",
    goal: "Gửi được message vào Kafka với đúng mức đảm bảo mà tình huống đòi hỏi, và giải thích được mỗi tham số cấu hình đang mua gì bằng cái gì.",
    practice:
      "Viết một producer gửi 1.000 message vào một topic 3 partition. Chạy ba lần với `acks=0`, `acks=1`, `acks=all` và ghi lại thời gian mỗi lần. Rồi bật `enable.idempotence=true` và xem những cấu hình nào bị ép đổi theo — mục \"Cấu hình Producer (Configuring Producers)\" nói rõ cái nào.",
    resources: [
      { label: "Kafka 03 — Kafka Producer: Ghi message vào Kafka", href: "#/docs/kafka-03" },
    ],
    items: [
      {
        id: "kf-w2-1",
        text: "Đường đi của một message từ `send()` tới broker",
        lesson: `**Mục tiêu.** Vẽ lại được đường đi của một \`ProducerRecord\` — serialize, partitioner, batch, sender thread, response — và chọn đúng một trong ba kiểu gửi cho một yêu cầu độ tin cậy cho trước.

**Đọc.** [Tổng quan về Producer (Producer Overview)](#/docs/kafka-03) là mục đọc chậm nhất tuần: bám Hình 3-1 và tự kể lại từng ô, đặc biệt chỗ record được gộp vào một batch cùng topic-partition và một thread riêng mới chịu trách nhiệm gửi batch đi. [Khởi tạo một Kafka Producer (Constructing a Kafka Producer)](#/docs/kafka-03) cho ba thuộc tính bắt buộc \`bootstrap.servers\`, \`key.serializer\`, \`value.serializer\` — chú ý \`key.serializer\` vẫn bắt buộc kể cả khi bạn chỉ gửi value; gõ lại đoạn \`Properties\`. Ba kiểu gửi ở cuối mục — fire-and-forget, synchronous send, asynchronous send — chép ra giấy, cả chương xoay quanh chúng. [Gửi message tới Kafka (Sending a Message to Kafka)](#/docs/kafka-03) cho bản đơn giản nhất cùng danh sách exception bắt được ngay tại chỗ gọi. [Gửi message đồng bộ (Sending a Message Synchronously)](#/docs/kafka-03) ngắn nhưng chứa cặp khái niệm quan trọng nhất của mục: lỗi có thể retry và lỗi không thể retry. [Gửi message bất đồng bộ (Sending a Message Asynchronously)](#/docs/kafka-03) thì chạy thật với một \`DemoProducerCallback\` để thấy callback nổ ra sau khi \`send()\` đã trả về.

**Bẫy.** Làm việc nặng bên trong callback. Khung "Cảnh báo" cuối mục nói rõ callback được thực thi trong main thread của producer: điều đó bảo toàn thứ tự callback cho hai message gửi liên tiếp vào cùng một partition, nhưng cũng nghĩa là callback phải đủ nhanh để không làm chậm producer — không nên thực hiện thao tác blocking bên trong callback, hãy đẩy nó sang một thread khác. Bẫy thứ hai: dùng \`send().get()\` trong production vì nó dễ đọc. Sách nói thẳng đánh đổi chính ở đây là hiệu năng: broker có thể mất từ 2 ms tới vài giây để phản hồi, và trong khoảng đó thread gửi chỉ ngồi chờ — nên gửi đồng bộ thường không được dùng trong ứng dụng production, dù rất phổ biến trong ví dụ mã nguồn.

**Tự kiểm tra.** Vì sao sách nói Kafka producer *luôn luôn* bất đồng bộ, kể cả trong ví dụ "gửi đồng bộ"? Và lỗi "Message size too large" thuộc loại nào, và producer làm gì với nó?`,
      },
      {
        id: "kf-w2-2",
        text: "Cấu hình producer: acks, retry, batching và độ trễ",
        lesson: `**Mục tiêu.** Đặt được một bộ cấu hình producer bảo vệ đúng thứ bạn cần bảo vệ, và nói được mỗi tham số đang mua gì bằng cái gì — độ bền, latency, throughput, hay bộ nhớ.

**Đọc.** [Cấu hình Producer (Configuring Producers)](#/docs/kafka-03) mở bằng lời nhắc rằng phần lớn tham số có mặc định hợp lý. [\`client.id\`](#/docs/kafka-03) đọc lướt nhưng nhớ ví dụ về việc xử lý sự cố dễ hơn hẳn khi tên client có nghĩa. [\`acks\`](#/docs/kafka-03) là mục đọc chậm nhất tuần — ba giá trị \`0\`, \`1\`, \`all\` cùng khung "Mẹo" ngay sau đó. [Thời gian gửi message (Message Delivery Time)](#/docs/kafka-03) dựng khung hai khoảng thời gian và Hình 3-2; đọc kỹ khung "Lưu ý" giải thích vì sao cả chương giả định \`send()\` bất đồng bộ kèm callback. Bốn mục con [\`max.block.ms\`](#/docs/kafka-03), [\`delivery.timeout.ms\`](#/docs/kafka-03), [\`request.timeout.ms\`](#/docs/kafka-03) và [\`retries\` và \`retry.backoff.ms\`](#/docs/kafka-03) nên đọc liền một mạch, vì chúng chỉ có nghĩa khi đặt cạnh nhau. Rồi tới nhóm hiệu năng: [\`linger.ms\`](#/docs/kafka-03), [\`buffer.memory\`](#/docs/kafka-03), [\`compression.type\`](#/docs/kafka-03), [\`batch.size\`](#/docs/kafka-03), [\`max.in.flight.requests.per.connection\`](#/docs/kafka-03) cùng khung "ĐẢM BẢO THỨ TỰ (ORDERING GUARANTEES)", [\`max.request.size\`](#/docs/kafka-03) và [\`receive.buffer.bytes\` và \`send.buffer.bytes\`](#/docs/kafka-03). Khép lại bằng [\`enable.idempotence\`](#/docs/kafka-03) — đây là mục nối thẳng vào phần thực hành của tuần.

**Bẫy.** Bật retry rồi giữ nguyên nhiều request in-flight và tin rằng thứ tự vẫn được bảo toàn. Khung "ĐẢM BẢO THỨ TỰ (ORDERING GUARANTEES)" dựng đúng kịch bản hỏng: broker ghi thất bại batch đầu, ghi thành công batch thứ hai vốn đã in-flight, rồi retry batch đầu và thành công — thứ tự bị đảo ngược; lời giải của sách là \`enable.idempotence=true\`. Bẫy thứ hai: hạ \`acks\` để "giảm độ trễ". Khung "Mẹo" bác lại: latency đầu-cuối, đo từ lúc record được produce tới lúc consumer đọc được, là như nhau với cả ba tùy chọn, vì Kafka không cho consumer đọc record cho tới khi chúng được ghi vào tất cả in-sync replica — nếu bạn quan tâm tới latency đầu-cuối thì không có đánh đổi nào cả.

**Tự kiểm tra.** Vì sao \`delivery.timeout.ms\` phải lớn hơn cả \`linger.ms\` lẫn \`request.timeout.ms\`, và chuyện gì xảy ra nếu không? Và bật \`enable.idempotence\` ép ba tham số nào phải nhận giá trị gì?`,
      },
      {
        id: "kf-w2-3",
        text: "Serializer, partition, header, interceptor và quota",
        lesson: `**Mục tiêu.** Chọn đúng cách serialize cho dữ liệu của bạn, dự đoán được message rơi vào partition nào, và biết ba cơ chế kiểm soát producer từ bên ngoài code ứng dụng.

**Đọc.** [Serializer (Serializers)](#/docs/kafka-03) rồi [Serializer tùy chỉnh (Custom Serializers)](#/docs/kafka-03) — đọc \`CustomerSerializer\` như một cảnh báo, không phải khuôn mẫu để chép. [Serialize bằng Apache Avro (Serializing Using Apache Avro)](#/docs/kafka-03) là mục đọc chậm nhất tuần: bám cặp schema cũ với \`faxNumber\` và schema mới với \`email\`, rồi tự trả lời cả hai chiều: ứng dụng cũ đọc dữ liệu mới, ứng dụng mới đọc dữ liệu cũ. [Dùng Avro Record với Kafka (Using Avro Records with Kafka)](#/docs/kafka-03) giải thích vì sao schema không nằm trong record mà nằm trong Schema Registry, kèm Hình 3-3; gõ lại đoạn cấu hình \`KafkaAvroSerializer\`. [Partition (Partitions)](#/docs/kafka-03) cho hành vi sticky khi key null, cách băm key, cùng \`RoundRobinPartitioner\` với \`UniformStickyPartitioner\`; [Hiện thực chiến lược phân vùng tùy chỉnh (Implementing a custom partitioning strategy)](#/docs/kafka-03) thì chạy thật \`BananaPartitioner\`. [Header (Headers)](#/docs/kafka-03) ngắn. [Interceptor (Interceptors)](#/docs/kafka-03) đáng gõ lại \`CountingProducerInterceptor\` và chạy nó với \`kafka-console-producer\` theo ba bước cuối mục. [Quota và Throttling (Quotas and Throttling)](#/docs/kafka-03) khép chương — nắm ba loại quota và biết quota động được đặt bằng \`kafka-configs\`; lưu ý các dòng lệnh ví dụ ở mục này bị bản PDF gốc cắt cụt, nên tra cú pháp đầy đủ ở tài liệu chính thức thay vì đoán.

**Bẫy.** Tự viết serializer cho một class domain vì "chỉ có hai trường". Sách chỉ ra mã nguồn mong manh tới mức nào: đổi \`customerID\` sang \`Long\` hay thêm một trường \`startDate\` là bạn gặp vấn đề nghiêm trọng về tương thích giữa message cũ và mới, còn gỡ lỗi thì phải so sánh các mảng byte thô — và nếu nhiều nhóm cùng ghi dữ liệu đó, tất cả phải sửa mã vào đúng cùng một thời điểm. Bẫy thứ hai: coi quota chỉ là chuyện của quản trị viên. Khung "Cảnh báo" cuối chương cho thấy nó dội thẳng vào producer: nếu bạn gửi nhanh hơn tốc độ broker chấp nhận, message xếp hàng trong bộ nhớ client, rồi \`Producer.send()\` bị block và cuối cùng ném \`TimeoutException\`.

**Tự kiểm tra.** Vì sao Kafka băm key bằng thuật toán riêng thay vì \`hashCode()\` của Java? Và việc thêm partition vào một topic phá vỡ điều gì mà bạn vốn đang dựa vào?`,
      },
    ],
  },
  {
    id: "kf-w3",
    week: "Tuần 3",
    title: "Consumer, consumer group và rebalance",
    goal: "Đọc dữ liệu từ Kafka bằng một consumer group mà kiểm soát được chính xác message nào đã coi là xử lý xong, kể cả khi rebalance xen vào giữa.",
    practice:
      "Chạy hai consumer cùng một group trên topic 4 partition. Giết một con và đọc log để thấy rebalance chia lại partition. Rồi chuyển từ auto-commit sang `commitSync()`, cố tình ném lỗi giữa lúc xử lý, và xác nhận message được đọc lại sau khi khởi động lại.",
    resources: [
      { label: "Kafka 04 — Kafka Consumer: Đọc dữ liệu từ Kafka", href: "#/docs/kafka-04" },
    ],
    items: [
      {
        id: "kf-w3-1",
        text: "Consumer group chia partition thế nào, và rebalance xảy ra khi nào",
        lesson: `**Mục tiêu.** Nói được điều gì xảy ra với các partition khi bạn thêm, bớt hay giết một consumer, và phân biệt được eager rebalance với cooperative rebalance bằng thứ mà mỗi loại tạm dừng.

**Đọc.** [Khái niệm về Kafka Consumer (Kafka Consumer Concepts)](#/docs/kafka-04) chỉ vài dòng dẫn nhập. [Consumer và Consumer Group](#/docs/kafka-04) đi qua năm hình liên tiếp trên cùng topic T1 bốn partition — Hình 4-1 tới Hình 4-5; đừng đọc lướt hình nào, đây là bộ khung cả chương treo lên. Rút ra hai câu: thêm consumer vào một group là cách mở rộng việc xử lý, còn tạo group mới là cách để ứng dụng khác nhận trọn vẹn mọi message. [Consumer Group và Partition Rebalance](#/docs/kafka-04) là mục đọc chậm nhất tuần: đặt cạnh nhau Hình 4-6 và Hình 4-7 rồi tự nói ra khác biệt — eager thu hồi tất cả partition và tạo một khoảng "dừng cả thế giới", còn cooperative chỉ gán lại một tập con, có thể cần vài vòng lặp mới ổn định. Đoạn về heartbeat, group coordinator và việc đóng consumer sạch sẽ thì ghi lại nguyên ý. Khung "QUÁ TRÌNH GÁN PARTITION CHO CONSUMER HOẠT ĐỘNG NHƯ THẾ NÀO?" giải thích vai trò group leader và \`PartitionAssignor\`. [Static Group Membership (Tư cách thành viên tĩnh)](#/docs/kafka-04) khép mục, đọc kỹ.

**Bẫy.** Thêm consumer vào group để chạy nhanh hơn mà không nhìn số partition. Hình 4-4 dựng đúng cảnh đó: nếu số consumer trong một group vượt số partition của topic, một số consumer sẽ nhàn rỗi và không nhận được message nào cả — sách nói thẳng không có ích gì khi thêm nhiều consumer hơn số partition bạn có. Bẫy thứ hai: bật \`group.instance.id\` cho mọi consumer vì nó "tránh rebalance". Sách nhắc mặt còn lại: thành viên tĩnh không chủ động rời group khi tắt, nên các partition của nó không được gán lại — trong khoảng đó sẽ không có consumer nào tiêu thụ từ chúng, và khi consumer khởi động trở lại nó sẽ bị tụt lại phía sau; việc phát hiện nó "thực sự biến mất" phụ thuộc hoàn toàn vào \`session.timeout.ms\`.

**Tự kiểm tra.** Vì sao đóng consumer một cách sạch sẽ lại rút ngắn khoảng trống xử lý so với để nó crash? Và trong một cooperative rebalance, consumer vẫn được phép làm gì mà eager rebalance cấm?`,
      },
      {
        id: "kf-w3-2",
        text: "Vòng lặp poll, và các tham số cấu hình consumer",
        lesson: `**Mục tiêu.** Viết được một vòng lặp poll đúng chuẩn, và chỉnh được bộ tham số consumer để cân giữa latency, throughput và tốc độ phát hiện một consumer đã chết.

**Đọc.** [Tạo một Kafka Consumer (Creating a Kafka Consumer)](#/docs/kafka-04) cho ba thuộc tính bắt buộc cùng \`group.id\`; gõ lại đoạn \`Properties\` và so với bản producer tuần trước. [Subscribe vào các topic (Subscribing to Topics)](#/docs/kafka-04) ngắn, hai dạng — danh sách tường minh và biểu thức chính quy — cùng khung "Cảnh báo" ngay sau. [Vòng lặp poll (The Poll Loop)](#/docs/kafka-04) là mục đọc chậm nhất tuần: chạy thật đoạn đếm khách hàng theo quốc gia, và đọc kỹ phép so sánh với con cá mập — consumer phải liên tục poll, nếu không nó bị coi là đã chết; nhớ luôn rằng lần \`poll()\` đầu tiên còn gánh việc tìm \`GroupCoordinator\`, gia nhập group và nhận phân bổ partition, nên gần như mọi thứ hỏng hóc đều lộ ra dưới dạng exception ném từ \`poll()\`. [Thread Safety (An toàn luồng)](#/docs/kafka-04) chốt quy tắc một consumer trên mỗi thread. [Cấu hình Consumer (Configuring Consumers)](#/docs/kafka-04) thì đọc theo cụm: [\`fetch.min.bytes\`](#/docs/kafka-04) với [\`fetch.max.wait.ms\`](#/docs/kafka-04), rồi [\`fetch.max.bytes\`](#/docs/kafka-04), [\`max.poll.records\`](#/docs/kafka-04) và [\`max.partition.fetch.bytes\`](#/docs/kafka-04); nhóm sống-chết gồm [\`session.timeout.ms\` và \`heartbeat.interval.ms\`](#/docs/kafka-04) với [\`max.poll.interval.ms\`](#/docs/kafka-04); rồi [\`default.api.timeout.ms\`](#/docs/kafka-04), [\`request.timeout.ms\`](#/docs/kafka-04), [\`auto.offset.reset\`](#/docs/kafka-04), [\`enable.auto.commit\`](#/docs/kafka-04), [\`partition.assignment.strategy\`](#/docs/kafka-04) với bốn chiến lược, và cuối cùng [\`offsets.retention.minutes\`](#/docs/kafka-04).

**Bẫy.** Subscribe bằng biểu thức chính quy cho tiện. Khung "Cảnh báo" nói rõ việc lọc topic được thực hiện ở phía client: consumer bắt broker gửi danh sách toàn bộ topic và partition theo chu kỳ, và trên cluster cỡ 30.000 partition thì overhead lên broker, client và mạng là đáng kể — có trường hợp băng thông cho metadata còn lớn hơn băng thông dữ liệu, chưa kể client cần quyền describe trên toàn cluster. Bẫy thứ hai: đổi \`poll(0)\` thành \`poll(Duration.ofMillis(0))\` khi nâng cấp. Khung "Cảnh báo" thứ hai chỉ ra ngữ nghĩa đã đổi: \`poll(long)\` block đủ lâu để lấy metadata dù vượt timeout, còn \`poll(Duration)\` tuân thủ timeout và không chờ metadata — mẹo cũ không còn tương đương, giải pháp thường là chuyển logic đó vào \`onPartitionsAssigned()\`.

**Tự kiểm tra.** \`session.timeout.ms\` và \`max.poll.interval.ms\` cùng phát hiện "consumer đã chết", vậy mỗi cái bắt được kiểu chết nào mà cái kia bỏ sót? Và vì sao sách khuyên dùng \`fetch.max.bytes\` thay cho \`max.partition.fetch.bytes\`?`,
      },
      {
        id: "kf-w3-3",
        text: "Commit offset — các cách và cái giá của từng cách",
        lesson: `**Mục tiêu.** Chọn được kiểu commit phù hợp với mức chịu đựng trùng lặp và mất mát của ứng dụng, và cài được một rebalance listener commit đúng lúc trước khi mất partition.

**Đọc.** [Commit và Offset (Commits and Offsets)](#/docs/kafka-04) mở bằng topic đặc biệt \`__consumer_offsets\` và hai hình đối xứng — Hình 4-8 khi offset commit nhỏ hơn offset đã xử lý, Hình 4-9 khi nó lớn hơn; vẽ lại cả hai, đây là toàn bộ trực giác của mục. Khung "OFFSET NÀO ĐƯỢC COMMIT?" đọc lướt nhưng nhớ quy ước "commit offset cuối cùng" thực ra nghĩa là lớn hơn một đơn vị. [Automatic Commit (Commit tự động)](#/docs/kafka-04) chạy thật với mặc định năm giây rồi tự dựng cảnh crash sau ba giây. [Commit offset hiện tại (Commit Current Offset)](#/docs/kafka-04) là mục đọc chậm nhất tuần — gõ lại vòng lặp \`commitSync()\` với \`CommitFailedException\`. [Asynchronous Commit (Commit bất đồng bộ)](#/docs/kafka-04) cùng khung "RETRY CÁC ASYNC COMMIT" với mẹo số thứ tự tăng đơn điệu. [Kết hợp commit đồng bộ và bất đồng bộ (Combining Synchronous and Asynchronous Commits)](#/docs/kafka-04) chỉ là một mẫu ngắn nhưng đáng thuộc. [Commit một offset được chỉ định (Committing a Specified Offset)](#/docs/kafka-04) cho \`currentOffsets\` và nhịp commit mỗi 1.000 record. [Rebalance Listener](#/docs/kafka-04) khép mục với ba phương thức \`onPartitionsAssigned\`, \`onPartitionsRevoked\`, \`onPartitionsLost\`, khung "Mẹo" ba gạch đầu dòng, và listing \`HandleRebalance\` — chạy thật listing này.

**Bẫy.** Để \`enable.auto.commit\` ở mặc định rồi thoát khỏi vòng lặp poll giữa chừng khi gặp exception. Sách nói rõ autocommit không biết event nào thực sự đã được xử lý: lần poll kế tiếp commit offset cuối cùng của lần poll trước, nên điều tối quan trọng là xử lý hết toàn bộ event mà \`poll()\` trả về trước khi gọi \`poll()\` lần nữa. Bẫy thứ hai: retry một \`commitAsync()\` thất bại ngay trong callback. Sách dựng đúng kịch bản hỏng: request commit offset 2000 thất bại vì sự cố giao tiếp tạm thời, trong lúc đó offset 3000 đã commit thành công, và lần retry lại commit đè 2000 lên — khi có rebalance, điều này sinh ra nhiều bản trùng lặp hơn.

**Tự kiểm tra.** Vì sao mẫu kết hợp gọi \`commitAsync()\` trong vòng lặp nhưng \`commitSync()\` ngay trước khi đóng? Và trong \`HandleRebalance\`, vì sao commit offset cho *tất cả* partition chứ không chỉ những partition sắp mất lại là vô hại?`,
      },
      {
        id: "kf-w3-4",
        text: "Đọc từ offset cụ thể, thoát sạch, deserializer và standalone consumer",
        lesson: `**Mục tiêu.** Đưa được consumer về một thời điểm bất kỳ trong quá khứ, tắt nó mà không mất offset, và biết khi nào nên bỏ consumer group để tự gán partition.

**Đọc.** [Tiêu thụ record với offset cụ thể (Consuming Records with Specific Offsets)](#/docs/kafka-04) cho \`seekToBeginning\`, \`seekToEnd\` và \`seek\`; chạy thật listing dùng \`offsetsForTimes\` để kéo mọi partition về một giờ trước — công cụ khôi phục bạn sẽ cần vào một ngày xấu trời. [Nhưng làm sao để thoát? (But How Do We Exit?)](#/docs/kafka-04) là mục đọc chậm nhất tuần — gõ lại \`ShutdownHook\` gọi \`consumer.wakeup()\`, khối \`try\` bắt \`WakeupException\`, và \`finally\` gọi \`consumer.close()\`; chú ý ghi chú về poll timeout dài với topic throughput thấp. [Deserializer](#/docs/kafka-04) mở bằng nguyên tắc serializer phải khớp deserializer, và vì sao Avro với Schema Registry biến lỗi tương thích thành thông báo lỗi tử tế. [Deserializer tùy chỉnh (Custom Deserializers)](#/docs/kafka-04) đọc để hiểu logic đảo ngược của serializer chương 3, không phải để chép — lưu ý khối \`catch\` trong listing này bị bản PDF gốc cắt cụt, nên đừng lấy nó làm bài gõ lại và cũng đừng đoán phần thiếu. [Dùng Avro Deserialization với Kafka Consumer (Using Avro Deserialization with Kafka Consumer)](#/docs/kafka-04) mới là bản đáng gõ. [Standalone Consumer: Tại sao và làm thế nào để dùng một Consumer không thuộc Group (Standalone Consumer: Why and How to Use a Consumer Without a Group)](#/docs/kafka-04) và [Tổng kết (Summary)](#/docs/kafka-04) khép chương.

**Bẫy.** Gọi thẳng một phương thức consumer từ shutdown hook. Sách nói rõ \`consumer.wakeup()\` là phương thức consumer duy nhất an toàn để gọi từ một thread khác, và dù \`WakeupException\` không cần xử lý, bạn vẫn phải gọi \`consumer.close()\` trước khi thoát khỏi thread — chính lời đóng này commit offset nếu cần và báo group coordinator để rebalance diễn ra ngay thay vì chờ session hết hạn. Bẫy thứ hai: dùng \`assign()\` rồi quên rằng topic có thể lớn lên. Sách nhắc thẳng: nếu ai đó thêm partition mới vào topic, consumer sẽ không được thông báo — bạn phải tự kiểm tra \`consumer.partitionsFor()\` định kỳ hoặc khởi động lại ứng dụng mỗi khi có partition mới.

**Tự kiểm tra.** Một standalone consumer không gia nhập group nào, vậy vì sao nó vẫn cần cấu hình \`group.id\`? Và \`offsetsForTimes\` lấy offset ở đâu ra, thay vì quét toàn bộ partition?`,
      },
    ],
  },
];
