// Lộ trình đọc Kafka: The Definitive Guide — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Kafka: The Definitive Guide", ấn bản 2
// (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly).
// Thư mục nguồn: sources/kafka/ — bản dịch gồm chương 2–14; chương 1 không thuộc phạm vi.
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

**Đọc.** [Thiết lập môi trường (Environment Setup)](#/docs/kafka-02) chỉ vài dòng dẫn nhập. [Lựa chọn hệ điều hành](#/docs/kafka-02) đọc lướt, nhớ đúng một điều: mọi bước trong chương đều giả định Linux. [Cài đặt Java](#/docs/kafka-02) ngắn, nhưng ghi lại phiên bản cả chương dựa vào — JDK 11 update 10 tại \`/usr/java/jdk-11.0.10\`. [Cài đặt ZooKeeper](#/docs/kafka-02) mở bằng Hình 2-1; đọc kỹ câu nói rằng ZooKeeper lưu metadata về cluster và cả chi tiết về các consumer client. [Standalone server](#/docs/kafka-02) thì gõ lại trọn khối lệnh dựng \`zoo.cfg\` (bản in trong sách ghi \`# cp >\`, một lỗi OCR — gõ \`cat >\` mới chạy được) rồi \`zkServer.sh start\`, và xác minh bằng lệnh bốn chữ cái \`srvr\` cho tới khi thấy dòng \`Mode: standalone\`. [ZooKeeper ensemble](#/docs/kafka-02) là mục đọc chậm nhất: định dạng \`server.X=hostname:peerPort:leaderPort\`, ba cổng, file \`myid\` trong \`dataDir\`, và cặp \`initLimit\` với \`syncLimit\` tính theo bội của \`tickTime\`. Cuối cùng [Cài đặt một Kafka broker (Installing a Kafka Broker)](#/docs/kafka-02) — chạy thật cả bốn bước xác minh: tạo topic \`test\`, \`--describe\` nó, produce hai dòng bằng console producer, rồi consume lại với \`--from-beginning\`.

**Bẫy.** Chọn ensemble ba node cho gọn. Khung "XÁC ĐỊNH KÍCH THƯỚC CHO ZOOKEEPER ENSEMBLE CỦA BẠN" khuyên cân nhắc năm node: mọi thay đổi cấu hình phải nạp lại từng node, nên ensemble chỉ nên chịu mất một node là an toàn; đừng vượt bảy node vì hiệu năng có thể suy giảm do bản chất giao thức đồng thuận. Bẫy thứ hai: gõ CLI theo trí nhớ cũ với cờ \`--zookeeper\`. Khung "VIỆC LOẠI BỎ DẦN KẾT NỐI ZOOKEEPER TRÊN CÁC TIỆN ÍCH CLI CỦA KAFKA" nói rõ tùy chọn đó đã deprecated; nay dùng \`--bootstrap-server\` trỏ thẳng \`host:port\` của bất kỳ broker nào trong cluster.

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

**Đọc.** [Lựa chọn phần cứng (Selecting Hardware)](#/docs/kafka-02) mở bằng câu thú nhận rằng việc này mang tính nghệ thuật hơn khoa học, rồi liệt kê bốn nút cổ chai. [Disk Throughput](#/docs/kafka-02) là mục quyết định latency của producer — nắm kết luận HDD hợp với cluster lưu trữ lớn ít bị truy cập, SSD hợp khi số kết nối client rất lớn. [Disk Capacity](#/docs/kafka-02) chỉ là một phép nhân, hãy tự chạy nó cho lưu lượng của bạn: 1 TB mỗi ngày, 7 ngày retention là 7 TB, cộng ít nhất 10% overhead. [Memory](#/docs/kafka-02) đọc kỹ — page cache mới là thứ quyết định consumer nhanh hay chậm, còn heap JVM thì nhỏ đến bất ngờ: 150.000 message mỗi giây vẫn chạy được trong heap 5 GB. [Networking](#/docs/kafka-02) nói về sự mất cân đối vào/ra do nhiều consumer, và ngưỡng NIC 10 Gb. [CPU](#/docs/kafka-02) ngắn, nhưng nhớ vì sao broker phải giải nén rồi nén lại mọi batch. [Kafka trên cloud (Kafka in the Cloud)](#/docs/kafka-02) cùng [Microsoft Azure](#/docs/kafka-02) và [Amazon Web Services](#/docs/kafka-02) đọc như một bảng tra: các loại instance \`Standard D16s v3\`, \`D64s v4\`, \`m4\`, \`r3\` và thứ mỗi loại đánh đổi.

**Bẫy.** Nhét Kafka chung máy với một ứng dụng đáng kể khác cho tiết kiệm. Mục Memory nói thẳng đây là lý do chính khiến việc đặt chung không được khuyến nghị: ứng dụng kia sẽ phải chia sẻ page cache, làm giảm hiệu năng consumer của Kafka. Bẫy thứ hai: dùng đĩa tạm thời trên Azure vì nó rẻ và nhanh. Sách rất khuyến nghị Azure Managed Disks thay vì ephemeral disk, với lý do rất cụ thể: nếu một VM bị di chuyển, bạn có nguy cơ mất toàn bộ dữ liệu trên Kafka broker của mình — còn HDD Managed Disks thì rẻ nhưng không có SLA rõ ràng về tính sẵn sàng.

**Tự kiểm tra.** Vì sao một broker ghi 1 MB mỗi giây vẫn có thể làm bão hòa NIC 1 Gb? Và trong hai lựa chọn \`m4\` và \`r3\` trên AWS, cái nào cho retention dài hơn, và bạn trả giá bằng gì?`,
      },
      {
        id: "kf-w1-4",
        text: "Từ một broker lên một cluster, và những gì production đòi hỏi",
        lesson: `**Mục tiêu.** Tính được số broker tối thiểu cho một yêu cầu retention và replication cho trước, và kể được ba nhóm thiết lập ngoài Kafka — kernel, GC, bố trí vật lý — mà thiếu chúng thì cluster chưa sẵn sàng chạy production.

**Đọc.** [Cấu hình các cụm Kafka (Configuring Kafka Clusters)](#/docs/kafka-02) với Hình 2-2. [Cần bao nhiêu broker? (How Many Brokers?)](#/docs/kafka-02) là mục cần đọc chậm: bốn ràng buộc, phép tính 10 TB chia 2 TB ra 5 broker rồi nhân đôi khi bật replication, và cặp con số khuyến nghị hiện hành — không quá 14.000 partition replica trên mỗi broker và 1 triệu replica trên mỗi cluster. [Cấu hình broker (Broker Configuration)](#/docs/kafka-02) chỉ có đúng hai yêu cầu, đọc lướt nhưng nhớ cả hai. [Tinh chỉnh hệ điều hành (OS Tuning)](#/docs/kafka-02) rồi [Virtual memory](#/docs/kafka-02) — \`vm.swappiness\`, \`vm.dirty_background_ratio\`, \`vm.dirty_ratio\`, \`vm.max_map_count\`, \`vm.overcommit_memory\`; chạy thật lệnh \`cat /proc/vmstat\` trên máy của bạn để có con số nền. [Disk](#/docs/kafka-02) cho cặp XFS/Ext4 và tùy chọn mount \`noatime\`; [Networking](#/docs/kafka-02) cho các tham số buffer socket. [Các vấn đề cần lưu ý khi chạy production (Production Concerns)](#/docs/kafka-02) với [Tùy chọn Garbage Collector (Garbage Collector Options)](#/docs/kafka-02) — gõ lại khối \`KAFKA_JVM_PERFORMANCE_OPTS\` — rồi [Bố trí datacenter (Datacenter Layout)](#/docs/kafka-02) và [Đặt chung các ứng dụng trên ZooKeeper (Colocating Applications on ZooKeeper)](#/docs/kafka-02). [Tóm tắt (Summary)](#/docs/kafka-02) khép chương.

**Bẫy.** Đặt \`vm.swappiness\` bằng 0 vì đó là lời khuyên bạn nhớ được. Khung "TẠI SAO KHÔNG ĐẶT SWAPPINESS BẰNG 0?" nói rõ ý nghĩa của giá trị này đã đổi kể từ Linux kernel 3.5-rc1: trước kia là "không swap trừ khi có tình trạng hết bộ nhớ", nay là "không bao giờ swap trong bất kỳ hoàn cảnh nào" — vì thế giá trị được khuyến nghị hiện là 1. Bẫy thứ hai: đặt \`broker.rack\` một lần rồi coi cluster đã rack-aware vĩnh viễn. Mục Bố trí datacenter cảnh báo điều này chỉ áp dụng cho những partition mới được tạo; Kafka cluster không giám sát những partition không còn nhận biết rack nữa, chẳng hạn sau một lần tái phân bổ, và cũng không tự động sửa tình huống đó.

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

**Đọc.** [Tổng quan về Producer (Producer Overview)](#/docs/kafka-03) đọc chậm: bám Hình 3-1 và tự kể lại từng ô, đặc biệt chỗ record được gộp vào một batch cùng topic-partition và một thread riêng mới chịu trách nhiệm gửi batch đi. [Khởi tạo một Kafka Producer (Constructing a Kafka Producer)](#/docs/kafka-03) cho ba thuộc tính bắt buộc \`bootstrap.servers\`, \`key.serializer\`, \`value.serializer\` — chú ý \`key.serializer\` vẫn bắt buộc kể cả khi bạn chỉ gửi value; gõ lại đoạn \`Properties\`. Ba kiểu gửi ở cuối mục — fire-and-forget, synchronous send, asynchronous send — chép ra giấy, cả chương xoay quanh chúng. [Gửi message tới Kafka (Sending a Message to Kafka)](#/docs/kafka-03) cho bản đơn giản nhất cùng danh sách exception bắt được ngay tại chỗ gọi. [Gửi message đồng bộ (Sending a Message Synchronously)](#/docs/kafka-03) ngắn nhưng chứa cặp khái niệm quan trọng nhất của mục: lỗi có thể retry và lỗi không thể retry. [Gửi message bất đồng bộ (Sending a Message Asynchronously)](#/docs/kafka-03) thì chạy thật với một \`DemoProducerCallback\` để thấy callback nổ ra sau khi \`send()\` đã trả về.

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

**Đọc.** [Serializer (Serializers)](#/docs/kafka-03) rồi [Serializer tùy chỉnh (Custom Serializers)](#/docs/kafka-03) — đọc \`CustomerSerializer\` như một cảnh báo, không phải khuôn mẫu để chép. [Serialize bằng Apache Avro (Serializing Using Apache Avro)](#/docs/kafka-03) là mục nặng nhất, đọc chậm: bám cặp schema cũ với \`faxNumber\` và schema mới với \`email\`, rồi tự trả lời cả hai chiều: ứng dụng cũ đọc dữ liệu mới, ứng dụng mới đọc dữ liệu cũ. [Dùng Avro Record với Kafka (Using Avro Records with Kafka)](#/docs/kafka-03) giải thích vì sao schema không nằm trong record mà nằm trong Schema Registry, kèm Hình 3-3; gõ lại đoạn cấu hình \`KafkaAvroSerializer\`. [Partition (Partitions)](#/docs/kafka-03) cho hành vi sticky khi key null, cách băm key, cùng \`RoundRobinPartitioner\` với \`UniformStickyPartitioner\`; [Hiện thực chiến lược phân vùng tùy chỉnh (Implementing a custom partitioning strategy)](#/docs/kafka-03) thì chạy thật \`BananaPartitioner\`. [Header (Headers)](#/docs/kafka-03) ngắn. [Interceptor (Interceptors)](#/docs/kafka-03) đáng gõ lại \`CountingProducerInterceptor\` và chạy nó với \`kafka-console-producer\` theo ba bước cuối mục. [Quota và Throttling (Quotas and Throttling)](#/docs/kafka-03) khép chương — nắm ba loại quota và biết quota động được đặt bằng \`kafka-configs\`; lưu ý các dòng lệnh ví dụ ở mục này bị bản PDF gốc cắt cụt, nên tra cú pháp đầy đủ ở tài liệu chính thức thay vì đoán.

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

**Đọc.** [Tạo một Kafka Consumer (Creating a Kafka Consumer)](#/docs/kafka-04) cho ba thuộc tính bắt buộc cùng \`group.id\`; gõ lại đoạn \`Properties\` và so với bản producer tuần trước. [Subscribe vào các topic (Subscribing to Topics)](#/docs/kafka-04) ngắn, hai dạng — danh sách tường minh và biểu thức chính quy — cùng khung "Cảnh báo" ngay sau. [Vòng lặp poll (The Poll Loop)](#/docs/kafka-04) là mục đọc chậm nhất: chạy thật đoạn đếm khách hàng theo quốc gia, và đọc kỹ phép so sánh với con cá mập — consumer phải liên tục poll, nếu không nó bị coi là đã chết; nhớ luôn rằng lần \`poll()\` đầu tiên còn gánh việc tìm \`GroupCoordinator\`, gia nhập group và nhận phân bổ partition, nên gần như mọi thứ hỏng hóc đều lộ ra dưới dạng exception ném từ \`poll()\`. [Thread Safety (An toàn luồng)](#/docs/kafka-04) chốt quy tắc một consumer trên mỗi thread. [Cấu hình Consumer (Configuring Consumers)](#/docs/kafka-04) thì đọc theo cụm: [\`fetch.min.bytes\`](#/docs/kafka-04) với [\`fetch.max.wait.ms\`](#/docs/kafka-04), rồi [\`fetch.max.bytes\`](#/docs/kafka-04), [\`max.poll.records\`](#/docs/kafka-04) và [\`max.partition.fetch.bytes\`](#/docs/kafka-04); nhóm sống-chết gồm [\`session.timeout.ms\` và \`heartbeat.interval.ms\`](#/docs/kafka-04) với [\`max.poll.interval.ms\`](#/docs/kafka-04); rồi [\`default.api.timeout.ms\`](#/docs/kafka-04), [\`request.timeout.ms\`](#/docs/kafka-04), [\`auto.offset.reset\`](#/docs/kafka-04), [\`enable.auto.commit\`](#/docs/kafka-04), [\`partition.assignment.strategy\`](#/docs/kafka-04) với bốn chiến lược, và cuối cùng [\`offsets.retention.minutes\`](#/docs/kafka-04).

**Bẫy.** Subscribe bằng biểu thức chính quy cho tiện. Khung "Cảnh báo" nói rõ việc lọc topic diễn ra ở phía client: consumer bắt broker gửi toàn bộ danh sách topic/partition theo chu kỳ, và trên cluster 30.000 partition, overhead lên broker, client, mạng là đáng kể — băng thông metadata có khi còn lớn hơn băng thông dữ liệu, chưa kể client cần quyền describe toàn cluster. Bẫy thứ hai: đổi \`poll(0)\` thành \`poll(Duration.ofMillis(0))\` khi nâng cấp. Khung "Cảnh báo" thứ hai chỉ ra ngữ nghĩa đã đổi: \`poll(long)\` block đủ lâu để lấy metadata dù vượt timeout, còn \`poll(Duration)\` tuân thủ timeout và không chờ metadata — mẹo cũ không còn tương đương, giải pháp thường là chuyển logic đó vào \`onPartitionsAssigned()\` (khung "Cảnh báo" viết dưới tên cũ \`rebalanceListener.onPartitionAssignment()\`, nhưng đây mới là tên phương thức thật của interface).

**Tự kiểm tra.** \`session.timeout.ms\` và \`max.poll.interval.ms\` cùng phát hiện "consumer đã chết", vậy mỗi cái bắt được kiểu chết nào mà cái kia bỏ sót? Và vì sao sách khuyên dùng \`fetch.max.bytes\` thay cho \`max.partition.fetch.bytes\`?`,
      },
      {
        id: "kf-w3-3",
        text: "Commit offset — các cách và cái giá của từng cách",
        lesson: `**Mục tiêu.** Chọn được kiểu commit phù hợp với mức chịu đựng trùng lặp và mất mát của ứng dụng, và cài được một rebalance listener commit đúng lúc trước khi mất partition.

**Đọc.** [Commit và Offset (Commits and Offsets)](#/docs/kafka-04) mở bằng topic đặc biệt \`__consumer_offsets\` và hai hình đối xứng — Hình 4-8 khi offset commit nhỏ hơn offset đã xử lý, Hình 4-9 khi nó lớn hơn; vẽ lại cả hai, đây là toàn bộ trực giác của mục. Khung "OFFSET NÀO ĐƯỢC COMMIT?" đọc lướt nhưng nhớ quy ước "commit offset cuối cùng" thực ra nghĩa là lớn hơn một đơn vị. [Automatic Commit (Commit tự động)](#/docs/kafka-04) chạy thật với mặc định năm giây rồi tự dựng cảnh crash sau ba giây. [Commit offset hiện tại (Commit Current Offset)](#/docs/kafka-04) đọc kỹ — gõ lại vòng lặp \`commitSync()\` với \`CommitFailedException\`. [Asynchronous Commit (Commit bất đồng bộ)](#/docs/kafka-04) cùng khung "RETRY CÁC ASYNC COMMIT" với mẹo số thứ tự tăng đơn điệu. [Kết hợp commit đồng bộ và bất đồng bộ (Combining Synchronous and Asynchronous Commits)](#/docs/kafka-04) chỉ là một mẫu ngắn nhưng đáng thuộc. [Commit một offset được chỉ định (Committing a Specified Offset)](#/docs/kafka-04) cho \`currentOffsets\` và nhịp commit mỗi 1.000 record. [Rebalance Listener](#/docs/kafka-04) khép mục với ba phương thức \`onPartitionsAssigned\`, \`onPartitionsRevoked\`, \`onPartitionsLost\`, khung "Mẹo" ba gạch đầu dòng, và listing \`HandleRebalance\` — chạy thật listing này.

**Bẫy.** Để \`enable.auto.commit\` ở mặc định rồi thoát khỏi vòng lặp poll giữa chừng khi gặp exception. Sách nói rõ autocommit không biết event nào thực sự đã được xử lý: lần poll kế tiếp commit offset cuối cùng của lần poll trước, nên điều tối quan trọng là xử lý hết toàn bộ event mà \`poll()\` trả về trước khi gọi \`poll()\` lần nữa. Bẫy thứ hai: retry một \`commitAsync()\` thất bại ngay trong callback. Sách dựng đúng kịch bản hỏng: request commit offset 2000 thất bại vì sự cố giao tiếp tạm thời, trong lúc đó offset 3000 đã commit thành công, và lần retry lại commit đè 2000 lên — khi có rebalance, điều này sinh ra nhiều bản trùng lặp hơn.

**Tự kiểm tra.** Vì sao mẫu kết hợp gọi \`commitAsync()\` trong vòng lặp nhưng \`commitSync()\` ngay trước khi đóng? Và trong \`HandleRebalance\`, vì sao commit offset cho *tất cả* partition chứ không chỉ những partition sắp mất lại là vô hại?`,
      },
      {
        id: "kf-w3-4",
        text: "Đọc từ offset cụ thể, thoát sạch, deserializer và standalone consumer",
        lesson: `**Mục tiêu.** Đưa được consumer về một thời điểm bất kỳ trong quá khứ, tắt nó mà không mất offset, và biết khi nào nên bỏ consumer group để tự gán partition.

**Đọc.** [Tiêu thụ record với offset cụ thể (Consuming Records with Specific Offsets)](#/docs/kafka-04) cho \`seekToBeginning\`, \`seekToEnd\` và \`seek\`; chạy thật listing dùng \`offsetsForTimes\` để kéo mọi partition về một giờ trước — công cụ khôi phục bạn sẽ cần vào một ngày xấu trời. [Nhưng làm sao để thoát? (But How Do We Exit?)](#/docs/kafka-04) là mục cần đọc chậm nhất — gõ lại \`ShutdownHook\` gọi \`consumer.wakeup()\`, khối \`try\` bắt \`WakeupException\`, và \`finally\` gọi \`consumer.close()\`; chú ý ghi chú về poll timeout dài với topic throughput thấp. [Deserializer](#/docs/kafka-04) mở bằng nguyên tắc serializer phải khớp deserializer, và vì sao Avro với Schema Registry biến lỗi tương thích thành thông báo lỗi tử tế. [Deserializer tùy chỉnh (Custom Deserializers)](#/docs/kafka-04) đọc để hiểu logic đảo ngược của serializer chương 3, không phải để chép — lưu ý khối \`catch\` trong listing này bị bản PDF gốc cắt cụt, nên đừng lấy nó làm bài gõ lại và cũng đừng đoán phần thiếu. [Dùng Avro Deserialization với Kafka Consumer (Using Avro Deserialization with Kafka Consumer)](#/docs/kafka-04) mới là bản đáng gõ. [Standalone Consumer: Tại sao và làm thế nào để dùng một Consumer không thuộc Group (Standalone Consumer: Why and How to Use a Consumer Without a Group)](#/docs/kafka-04) và [Tổng kết (Summary)](#/docs/kafka-04) khép chương.

**Bẫy.** Gọi thẳng một phương thức consumer từ shutdown hook. Sách nói rõ \`consumer.wakeup()\` là phương thức consumer duy nhất an toàn để gọi từ một thread khác, và dù \`WakeupException\` không cần xử lý, bạn vẫn phải gọi \`consumer.close()\` trước khi thoát khỏi thread — chính lời đóng này commit offset nếu cần và báo group coordinator để rebalance diễn ra ngay thay vì chờ session hết hạn. Bẫy thứ hai: dùng \`assign()\` rồi quên rằng topic có thể lớn lên. Sách nhắc thẳng: nếu ai đó thêm partition mới vào topic, consumer sẽ không được thông báo — bạn phải tự kiểm tra \`consumer.partitionsFor()\` định kỳ hoặc khởi động lại ứng dụng mỗi khi có partition mới.

**Tự kiểm tra.** Một standalone consumer không gia nhập group nào, vậy vì sao nó vẫn cần cấu hình \`group.id\`? Và \`offsetsForTimes\` lấy offset ở đâu ra, thay vì quét toàn bộ partition?`,
      },
    ],
  },
  {
    id: "kf-w4",
    week: "Tuần 4",
    title: "AdminClient, và cơ chế bên trong Kafka",
    goal: "Làm được mọi thao tác quản trị thường ngày từ trong code thay vì từ dòng lệnh, và giải thích được những hành vi khó hiểu của cluster bằng chính cơ chế bên trong sinh ra chúng.",
    practice:
      "Viết một chương trình dùng `AdminClient` làm đủ vòng: tạo topic, đổi một cấu hình của nó, liệt kê consumer group, và đọc metadata cluster — thay cho script dòng lệnh. Rồi dùng đúng lệnh mà chính mục \"Physical Storage (Lưu trữ vật lý)\" của ch.6 đưa ra — `kafka-run-class.sh kafka.tools.DumpLogSegments` — trên một segment của topic đó, để nhìn thấy tận mắt bố cục mà mục ấy mô tả. Đừng với sang `kafka-dump-log.sh` ở bước này — công cụ đó thuộc chương 12, bạn sẽ gặp nó ở tuần 9.",
    resources: [
      { label: "Kafka 05 — Quản trị Apache Kafka bằng lập trình", href: "#/docs/kafka-05" },
      { label: "Kafka 06 — Cơ chế bên trong Kafka", href: "#/docs/kafka-06" },
    ],
    items: [
      {
        id: "kf-w4-1",
        text: "AdminClient: vòng đời, quản lý topic và cấu hình",
        lesson: `**Mục tiêu.** Thay được một chuỗi lệnh CLI bằng code: dựng \`AdminClient\`, kiểm tra topic có đúng số partition hay không, tạo nó nếu chưa có, rồi sửa cấu hình của nó — và nói được vì sao mọi phương thức đều trả về \`Future\`.

**Đọc.** [Tổng quan về AdminClient (AdminClient Overview)](#/docs/kafka-05) chỉ vài dòng dẫn nhập. [API bất đồng bộ và nhất quán cuối (Asynchronous and Eventually Consistent API)](#/docs/kafka-05) là mục đọc chậm nhất tuần dù rất ngắn: nắm cặp \`Future\` bọc trong \`Result\`, và hiểu vì sao một \`listTopics\` ngay sau \`createTopics\` vẫn có thể không thấy topic vừa tạo. [Một số lưu ý bổ sung (Additional Notes)](#/docs/kafka-05) đọc lướt: nhớ \`timeoutMs\`, và nhớ ai xử lý create/delete/alter, ai xử lý list/describe. [Vòng đời của AdminClient: Tạo, cấu hình và đóng (AdminClient Lifecycle: Creating, Configuring, and Closing)](#/docs/kafka-05) — gõ lại đoạn \`Properties\` ba dòng, chú ý \`close\` nhận tham số timeout. [client.dns.lookup](#/docs/kafka-05) là hai tình huống loại trừ nhau — DNS alias, và một tên DNS trỏ nhiều IP — mỗi tình huống một giá trị cấu hình; [request.timeout.ms](#/docs/kafka-05) ngắn, nhớ mặc định 120 giây. [Quản lý topic thiết yếu (Essential Topic Management)](#/docs/kafka-05) là mục dài nhất — chạy thật listing \`describeTopics\` bắt \`ExecutionException\` rồi \`createTopics\`, và cả bản Vert.x dùng \`whenComplete\` thay cho \`get()\`. [Quản lý cấu hình (Configuration Management)](#/docs/kafka-05) khép lại với \`ConfigResource\`, \`isDefault()\` và bốn kiểu \`AlterConfigOp\`.

**Bẫy.** Gọi \`deleteTopics\` trong một script dọn dẹp vì đoạn code quá đơn giản. Khung "Cảnh báo" ngay sau listing nói thẳng: trong Kafka việc xóa topic là vĩnh viễn — không có thùng rác nào cứu lại topic đã xóa, và không có bước kiểm tra nào xác nhận topic đang rỗng hay rằng bạn thực sự muốn xóa nó. Bẫy thứ hai: sửa metadata thẳng trong ZooKeeper khi \`AdminClient\` chưa có phương thức bạn cần. Mục Một số lưu ý bổ sung khuyến nghị hết sức đừng bao giờ làm vậy, và nếu buộc phải làm thì hãy báo cáo như một bug: cộng đồng sắp gỡ bỏ phụ thuộc vào ZooKeeper, mọi ứng dụng dùng nó trực tiếp sẽ phải sửa lại.

**Tự kiểm tra.** Vì sao mọi đối tượng result của \`AdminClient\` đều ném \`ExecutionException\`, và phải làm gì để lấy được lỗi thật Kafka trả về? Và trong bản Vert.x, vì sao request timeout ngắn lại phản hồi trước request gửi trước nó?`,
      },
      {
        id: "kf-w4-2",
        text: "Quản lý consumer group, metadata và thao tác nâng cao bằng code",
        lesson: `**Mục tiêu.** Đo được một consumer group đang tụt lại bao xa, đưa nó về đầu topic một cách có kiểm soát, và biết ba thao tác nguy hiểm mà một SRE sẽ cần vào đúng lúc tệ nhất.

**Đọc.** [Quản lý consumer group (Consumer Group Management)](#/docs/kafka-05) mở bằng lý do: xử lý lại dữ liệu ngay cả khi ứng dụng không được viết sẵn khả năng đó. [Khám phá consumer group (Exploring Consumer Groups)](#/docs/kafka-05) đọc kỹ — phân biệt \`valid()\`, \`errors()\` và \`all()\`, rồi chạy thật listing ghép \`listConsumerGroupOffsets\` với \`listOffsets\` để in ra lag cho từng partition; nhớ ba hiện thực \`OffsetSpec\`: \`earliest()\`, \`latest()\`, \`forTimestamp()\`. [Sửa đổi consumer group (Modifying Consumer Groups)](#/docs/kafka-05) thì đọc chậm: vì sao xóa offset không tương đương với reset, và vì sao Kafka chặn bạn sửa offset khi group còn đang chạy. [Metadata của cluster (Cluster Metadata)](#/docs/kafka-05) chỉ vài dòng cùng listing \`describeCluster\`. [Các thao tác quản trị nâng cao (Advanced Admin Operations)](#/docs/kafka-05) mở bằng lời dặn đừng đợi tới lúc sự cố mới học chúng; [Thêm partition vào một topic (Adding Partitions to a Topic)](#/docs/kafka-05), [Xóa record khỏi một topic (Deleting Records from a Topic)](#/docs/kafka-05) — chú ý vì sao retention của Kafka không đủ để tuân thủ pháp lý — [Bầu chọn leader (Leader Election)](#/docs/kafka-05) với cặp preferred và unclean, rồi [Tái phân bổ replica (Reassigning Replicas)](#/docs/kafka-05) đọc kỹ bốn dòng \`reassignment.put\` và tự nói ra mỗi dòng làm gì. [Kiểm thử (Testing)](#/docs/kafka-05) khép chương: gõ lại \`TopicCreator\`, phần \`setUp\` với \`spy\` và hai test.

**Bẫy.** Reset offset về đầu topic để "tính lại cho đúng" mà quên state store. Sách dựng đúng cảnh đó: ứng dụng đếm số giày bán ra, bạn reset về 3:00 sáng mà không sửa giá trị tổng hợp đã lưu, kết quả là mỗi đôi giày bán hôm nay bị đếm hai lần; trong môi trường phát triển các tác giả thường xóa hẳn state store trước khi reset. Bẫy thứ hai: truyền số partition muốn thêm vào \`createPartitions\`. Khung "Mẹo" nói rõ phương thức nhận tổng số partition mà topic sẽ có sau khi thêm, nên bạn có thể cần describe topic trước để biết nó đang có bao nhiêu.

**Tự kiểm tra.** \`alterConsumerGroupOffsets\` thất bại với \`UnknownMemberIdException\` nghĩa là bạn quên làm gì? Và vì sao \`deleteRecords\` xóa được record mà chính sách retention của topic thì không?`,
      },
      {
        id: "kf-w4-3",
        text: "Thành viên cluster và controller — ZooKeeper và KRaft",
        lesson: `**Mục tiêu.** Kể được chuyện gì xảy ra bên trong cluster từ lúc một broker khởi động tới lúc nó biến mất, ai bầu partition leader, và vì sao cộng đồng thay hẳn cơ chế đó bằng KRaft.

**Đọc.** [Cluster Membership (Thành viên của cluster)](#/docs/kafka-06) ngắn nhưng đọc kỹ: ephemeral node dưới \`/brokers/ids\`, chuyện gì xảy ra khi broker mất kết nối ZooKeeper, và điều then chốt là broker ID vẫn tồn tại trong danh sách replica của mỗi topic ngay cả khi node biến mất. [The Controller (Controller)](#/docs/kafka-06) là phần cần đọc kỹ nhất — bám theo trình tự: node \`/controller\`, ngoại lệ "node already exists", ZooKeeper watch, controller epoch tăng bằng thao tác tăng có điều kiện, rồi request \`LeaderAndISR\` gửi tới các broker chứa replica và request \`UpdateMetadata\` gửi tới tất cả để cập nhật \`MetadataCache\`; tự kể lại thành một mạch. [KRaft: Controller mới dựa trên Raft của Kafka](#/docs/kafka-06) đọc chậm phần bốn mối lo ngại đã thúc đẩy thay đổi, rồi tới kiến trúc mới: metadata trở thành một log event, các controller node là một Raft quorum tự bầu leader, active controller xử lý mọi RPC, còn broker chuyển từ bị đẩy cập nhật sang tự \`MetadataFetch\` theo offset. Ghi lại trạng thái fenced dành cho broker online nhưng lạc hậu.

**Bẫy.** Tin rằng một controller mất kết nối ZooKeeper vì GC thì cũng ngừng hành động. Mục The Controller mô tả kịch bản ngược lại: trong khoảng dừng đó một controller mới đã được bầu, và khi controller cũ sống lại nó vẫn gửi thông điệp tới các broker mà không biết mình đã bị thay — nó là một zombie, và thứ chặn nó là việc broker bỏ qua thông điệp mang epoch cũ hơn. Bẫy thứ hai: tái sử dụng broker ID của một máy đã chết cho một máy trắng. Mục Cluster Membership nói thẳng hệ quả: broker mới sẽ ngay lập tức gia nhập cluster thay chỗ broker đã mất, với cùng các partition và topic được gán cho nó — tiện khi bạn cố ý, tai hại khi bạn không.

**Tự kiểm tra.** Vì sao việc khởi động lại controller lại chậm dần khi số partition tăng, và KRaft gỡ nút đó bằng cách nào? Và số epoch ngăn được chính xác kịch bản hỏng nào?`,
      },
      {
        id: "kf-w4-4",
        text: "Replication: leader, follower và ISR",
        lesson: `**Mục tiêu.** Định nghĩa được chính xác "in sync" theo cách Kafka đo nó, và nói được vì sao chỉ in-sync replica mới đủ điều kiện làm leader mới.

**Đọc.** [Replication](#/docs/kafka-06) đọc chậm, dù chỉ vài trang. Bắt đầu từ hai định nghĩa: leader replica nhận mọi produce request, follower replica chỉ replicate và không phục vụ client trừ khi được cấu hình khác đi. Khung "ĐỌC TỪ FOLLOWER (READ FROM FOLLOWER)" giới thiệu KIP-392 cùng cặp cấu hình \`client.rack\` phía consumer và \`replica.selector.class\` phía broker, với \`RackAwareReplicaSelector\` thay cho \`LeaderSelector\` mặc định — đọc kỹ, vì đoạn ngay sau nó giải thích high-water mark được đưa vào dữ liệu gửi cho follower để bảo toàn bảo đảm độ tin cậy. Rồi tới phần định nghĩa in sync: follower gửi Fetch request đúng như consumer, offset trong request cho leader biết mỗi replica đang ở đâu, và ngưỡng \`replica.lag.time.max.ms\` quyết định khi nào một replica bị coi là out of sync. Cuối mục là preferred leader cùng \`auto.leader.rebalance.enable=true\`, và khung "TÌM CÁC PREFERRED LEADER (FINDING THE PREFERRED LEADERS)" — đọc kỹ khung này, nó là cầu nối sang phần tái phân bổ replica bạn vừa gặp ở chương 5.

**Bẫy.** Chuyển consumer sang đọc từ follower để tiết kiệm băng thông rồi kỳ vọng latency y như cũ. Sách nói rõ việc lan truyền high-water mark tạo ra một độ trễ nhỏ: dữ liệu khả dụng để consume từ leader sớm hơn so với khi khả dụng trên follower, và cần ghi nhớ độ trễ bổ sung này. Bẫy thứ hai: tái phân bổ replica thủ công mà xếp danh sách tùy tiện. Khung "TÌM CÁC PREFERRED LEADER (FINDING THE PREFERRED LEADERS)" cảnh báo replica bạn chỉ định đầu tiên sẽ là preferred replica, nên hãy bảo đảm trải chúng ra các broker khác nhau để tránh làm một số broker quá tải vì gánh nhiều leader trong khi các broker khác không làm phần việc công bằng của mình.

**Tự kiểm tra.** Một follower vẫn đang fetch đều đặn nhưng không bao giờ bắt kịp — nó in sync hay out of sync, và theo điều kiện nào? Và vì sao một in-sync replica hơi chậm lại làm chậm cả producer lẫn consumer?`,
      },
      {
        id: "kf-w4-5",
        text: "Xử lý request, và lưu trữ vật lý trên đĩa",
        lesson: `**Mục tiêu.** Đi theo một produce request và một fetch request từ socket tới đĩa và ngược lại, rồi mở một segment thật ra xem Kafka đã ghi gì vào đó.

**Đọc.** [Request Processing (Xử lý request)](#/docs/kafka-06) mở bằng header chuẩn bốn trường và Hình 6-1 — acceptor thread, network thread, request queue, I/O thread, purgatory; vẽ lại hình này. [Produce Requests (Produce request)](#/docs/kafka-06) cho ba kiểm tra hợp lệ và lý do \`acks=all\` khiến request nằm lại purgatory. [Fetch Requests (Fetch request)](#/docs/kafka-06) đọc kỹ: zero-copy, giới hạn trên và dưới với Hình 6-3, rồi Hình 6-4 giải thích vì sao consumer không thấy dữ liệu chưa replicate xong; cuối mục là fetch session cache. [Other Requests (Các loại request khác)](#/docs/kafka-06) đọc lướt, nhớ vì sao phải nâng cấp broker trước client. [Physical Storage (Lưu trữ vật lý)](#/docs/kafka-06) rồi [Tiered Storage (Lưu trữ phân tầng)](#/docs/kafka-06) lấy ý tưởng hai tầng local/remote. [Partition Allocation (Phân bổ partition)](#/docs/kafka-06) tự chạy lại ví dụ 6 broker, 10 partition, RF 3 với Hình 6-5. [File Management (Quản lý file)](#/docs/kafka-06) cho khái niệm active segment. [File Format (Định dạng file)](#/docs/kafka-06) là mục nặng nhất — đọc hết header của batch và của record, rồi chạy thật \`kafka-run-class.sh kafka.tools.DumpLogSegments\` như phần thực hành. [Indexes (Chỉ mục)](#/docs/kafka-06), [Compaction (Nén log theo key)](#/docs/kafka-06), [How Compaction Works (Compaction hoạt động như thế nào)](#/docs/kafka-06) với Hình 6-6 và 6-7, rồi [When Are Topics Compacted? (Khi nào thì các topic được compact?)](#/docs/kafka-06) khép chương.

**Bẫy.** Thêm một đĩa lớn vào broker rồi tin dữ liệu sẽ tự cân bằng. Khung "CHÚ Ý DUNG LƯỢNG ĐĨA (MIND THE DISK SPACE)" nói rõ việc phân bổ partition cho broker không tính đến dung lượng khả dụng hay tải hiện có, còn việc phân bổ cho đĩa thì đếm số partition chứ không nhìn kích thước. Bẫy thứ hai: để lại vài client cũ vì "chúng vẫn chạy được". Khung "CHUYỂN ĐỔI XUỐNG ĐỊNH DẠNG THÔNG ĐIỆP (MESSAGE FORMAT DOWN CONVERSION)" cho thấy cái giá: broker phải chuyển message v2 xuống v1 cho consumer cũ, việc này tốn CPU và bộ nhớ hơn nhiều so với consume thông thường, và KIP-188 cho bạn hai metric để nhìn thấy nó.

**Tự kiểm tra.** Vì sao đặt retention một ngày mà mỗi segment chứa năm ngày dữ liệu thì bạn giữ đủ năm ngày? Và vì sao topic chứa key null làm compaction thất bại?`,
      },
    ],
  },
  {
    id: "kf-w5",
    week: "Tuần 5",
    title: "Truyền dữ liệu tin cậy và exactly-once",
    goal: "Chọn được đúng bộ cấu hình broker, producer và consumer cho mức bảo đảm mà nghiệp vụ đòi hỏi, và biết chính xác transaction của Kafka giải và không giải vấn đề gì.",
    practice:
      "Dựng cluster 3 broker. Tạo topic với `replication.factor=3` và `min.insync.replicas=2`. Dừng hai broker và quan sát producer `acks=all` bị chặn thế nào. Khôi phục, rồi viết một vòng read-process-write bọc trong transaction và xác nhận consumer đặt `isolation.level=read_committed` không thấy dữ liệu của transaction bị abort.",
    resources: [
      { label: "Kafka 07 — Truyền dữ liệu tin cậy", href: "#/docs/kafka-07" },
      { label: "Kafka 08 — Ngữ nghĩa Exactly-Once", href: "#/docs/kafka-08" },
    ],
    items: [
      {
        id: "kf-w5-1",
        text: "Kafka bảo đảm chính xác những gì, và replication làm nền ra sao",
        lesson: `**Mục tiêu.** Đọc thuộc bốn bảo đảm Kafka thực sự hứa, tách chúng khỏi những thứ bạn tưởng nó hứa, và nói lại ba điều kiện để một replica được coi là in sync.

**Đọc.** [Các bảo đảm về độ tin cậy (Reliability Guarantees)](#/docs/kafka-07) là mục đọc chậm nhất tuần dù chỉ hơn một trang: chép ra giấy bốn gạch đầu dòng — thứ tự trong một partition, định nghĩa "committed" là đã ghi vào toàn bộ in-sync replica nhưng không nhất thiết đã flush xuống đĩa, message đã commit không mất chừng nào còn ít nhất một replica sống, và consumer chỉ đọc được message đã commit. Nhớ câu ngay sau: chúng chỉ là vật liệu, chưa phải một hệ thống tin cậy. [Replication](#/docs/kafka-07) tóm tắt lại chương 6 nhưng thêm thứ chương 6 không có — ba điều kiện cụ thể để một follower được coi là in sync: có session ZooKeeper đang hoạt động, đã fetch trong 10 giây gần nhất, và ít nhất một lần trong 10 giây đó đã bắt kịp hoàn toàn; điều kiện thứ ba mới là cái dễ bỏ sót. Đọc kỹ khung "REPLICA MẤT ĐỒNG BỘ (OUT-OF-SYNC REPLICAS)". Đoạn cuối mục, về ảnh hưởng hiệu năng của một in-sync replica chậm, là bản lề sang mục cấu hình broker.

**Bẫy.** Thấy một replica rơi khỏi ISR rồi latency đẹp lên, và kết luận cluster đã khoẻ. Sách nói đúng cơ chế: một in-sync replica hơi chậm làm chậm cả producer lẫn consumer vì phải chờ nó, nhưng khi nó rơi khỏi in sync thì ta không chờ nữa — cái giá là replication factor hiệu dụng thấp hơn, và rủi ro downtime hoặc mất dữ liệu cao hơn. Bẫy thứ hai: coi replica nhảy qua lại giữa in-sync và out-of-sync là chuyện vặt. Khung "REPLICA MẤT ĐỒNG BỘ (OUT-OF-SYNC REPLICAS)" gọi đó là dấu hiệu chắc chắn rằng cluster có gì đó không ổn, và chỉ ngay nguyên nhân phổ biến: kích thước request tối đa lớn cùng JVM heap lớn, đòi hỏi tinh chỉnh để tránh những khoảng dừng garbage collection kéo dài.

**Tự kiểm tra.** "Message đã commit" theo định nghĩa của Kafka có nghĩa là dữ liệu đã nằm trên đĩa chưa, và điều đó đổi cách đánh giá rủi ro thế nào? Và vì sao điều kiện in sync thứ ba chặt hơn điều kiện thứ hai?`,
      },
      {
        id: "kf-w5-2",
        text: "Cấu hình broker cho độ tin cậy",
        lesson: `**Mục tiêu.** Đặt được ba tham số broker quyết định độ tin cậy — và nói được mỗi tham số đổi tính sẵn sàng lấy tính nhất quán ở mức nào, ở cấp cluster hay cấp từng topic.

**Đọc.** [Cấu hình broker (Broker Configuration)](#/docs/kafka-07) mở bằng một ý dễ bỏ qua: cùng một cluster có thể chứa cả topic rất tin cậy lẫn topic chấp nhận mất mát, vì các tham số này có ở cả cấp broker lẫn cấp topic — ví dụ ngân hàng đặt mặc định rất tin cậy toàn cluster nhưng nới lỏng cho topic khiếu nại khách hàng. [Replication Factor](#/docs/kafka-07) đọc chậm: cặp \`replication.factor\` và \`default.replication.factor\`, quy tắc mất N-1 broker mà vẫn đọc ghi được, rồi năm cân nhắc — tính sẵn sàng, độ bền dữ liệu, throughput với phép tính 10 MBps nhân theo số replica, latency đầu-cuối, và chi phí; đoạn cuối về \`broker.rack\` nối thẳng vào chương 6. [Unclean Leader Election](#/docs/kafka-07) là phần khó nhất — dựng lại cả hai kịch bản dẫn tới chỗ không còn in-sync replica nào, rồi tự kể ví dụ replica 0 với message 0–100 chống lại replica 2 với message 100–200 để thấy "bất nhất" ở đây không phải lời nói suông. [Số lượng In-Sync Replica tối thiểu (Minimum In-Sync Replicas)](#/docs/kafka-07) ngắn nhưng đọc kỹ. [Giữ cho các replica đồng bộ (Keeping Replicas In Sync)](#/docs/kafka-07) cho cặp \`zookeeper.session.timeout.ms\` và \`replica.lag.time.max.ms\` cùng các giá trị đã đổi ở bản 2.5.0. [Ghi bền xuống đĩa (Persisting to Disk)](#/docs/kafka-07) khép mục với \`flush.messages\` và \`flush.ms\`.

**Bẫy.** Đặt \`min.insync.replicas=2\` rồi ngạc nhiên khi producer chết lúc mất hai broker. Sách mô tả đúng hành vi ấy như một tính năng: broker ngừng chấp nhận produce request và producer nhận \`NotEnoughReplicasException\`, consumer vẫn đọc được — một in-sync replica duy nhất trở thành chỉ-đọc, và đó chính là thứ ngăn dữ liệu được ghi rồi biến mất khi xảy ra unclean election. Bẫy thứ hai: bật \`unclean.leader.election.enable\` để cứu một partition rồi để đó. Sách dặn thẳng ngay sau khi cho phép làm vậy: chỉ cần đừng quên chuyển nó về false sau khi cluster đã hồi phục.

**Tự kiểm tra.** Nâng \`replica.lag.time.max.ms\` lên 30 giây mua cho bạn gì và lấy đi của consumer gì? Và vì sao replication factor 2 đôi khi hợp lý trên một hệ lưu trữ vốn đã replicate ba lần?`,
      },
      {
        id: "kf-w5-3",
        text: "Producer và consumer trong hệ tin cậy, và cách kiểm chứng",
        lesson: `**Mục tiêu.** Ghép cấu hình client vào cấu hình broker thành một chuỗi không đứt, và dựng bài kiểm chứng cho thấy chuỗi đó giữ được message khi bạn giết một broker.

**Đọc.** [Sử dụng producer trong một hệ thống tin cậy (Using Producers in a Reliable System)](#/docs/kafka-07) mở bằng hai kịch bản mất message dù broker cấu hình hoàn hảo; đọc chậm cả hai. [Send Acknowledgments](#/docs/kafka-07) điểm lại ba giá trị \`acks\` từ góc độ độ tin cậy: \`acks=0\` cho produce latency thấp nhưng không cải thiện latency đầu-cuối. Mục cấu hình retry cho producer cho cặp lỗi retry được và không, kèm khuyến nghị để \`retries\` ở mặc định và điều khiển bằng \`delivery.timeout.ms\`; mục sau liệt kê bốn nhóm lỗi producer không tự lo. [Sử dụng consumer trong một hệ thống tin cậy (Using Consumers in a Reliable System)](#/docs/kafka-07) cùng khung phân biệt message đã commit với offset đã commit: hai chữ "commit" khác nghĩa. Bốn thuộc tính consumer cho xử lý tin cậy — \`group.id\`, \`auto.offset.reset\`, \`enable.auto.commit\`, \`auto.commit.interval.ms\` — đọc liền một mạch. [Commit offset một cách tường minh trong consumer (Explicitly Committing Offsets in Consumers)](#/docs/kafka-07) là mục cần đọc kỹ nhất — sáu mục con ngắn tới mức dễ lướt qua, hãy đọc từng cái và đối chiếu với code consumer của bạn. Cuối cùng [Kiểm chứng độ tin cậy của hệ thống (Validating System Reliability)](#/docs/kafka-07): chạy thật \`VerifiableProducer\` và \`VerifiableConsumer\`, rồi để mắt tới error-rate, retry-rate và consumer lag.

**Bẫy.** Bỏ qua record #30 hỏng rồi commit offset #31 vì #31 xử lý xong. Mục Consumer có thể cần retry nói rõ consumer của Kafka commit offset chứ không "ack" từng message: commit #31 đánh dấu đã xử lý mọi record cho tới #31, gồm cả #30. Bẫy thứ hai: dùng \`acks=1\` rồi tin ba replica đã bảo vệ bạn. Kịch bản đầu mục cho thấy leader trả lời "đã ghi thành công" rồi sập trước khi replicate; các replica khác vẫn được coi là in sync, một trong số chúng lên leader, và message biến mất — hệ thống vẫn nhất quán vì chưa consumer nào thấy nó, nhưng với producer đó là mất dữ liệu.

**Tự kiểm tra.** Hai mẫu retry sách đưa ra — \`pause()\` và topic riêng — mỗi mẫu đánh đổi gì? Và vì sao commit sau mỗi message chỉ nên làm trên topic throughput rất thấp?`,
      },
      {
        id: "kf-w5-4",
        text: "Idempotent producer giải và không giải vấn đề gì",
        lesson: `**Mục tiêu.** Bật idempotent producer một cách có ý thức: biết nó thêm gì vào mỗi batch, chặn đúng loại trùng lặp nào, và loại nào nó không thấy.

**Đọc.** [Idempotent Producer](#/docs/kafka-08) mở bằng cặp câu \`UPDATE\` kinh điển của cơ sở dữ liệu, rồi dựng kịch bản: leader nhận record, replicate xong, sập trước khi kịp phản hồi, producer gửi lại, thành một bản trùng. [Idempotent Producer hoạt động như thế nào?](#/docs/kafka-08) đọc kỹ: mỗi message mang producer ID và sequence number, broker theo dõi năm message cuối cho mỗi partition, và chính giới hạn đó buộc \`max.inflight.requests\` không quá 5. Hai mục con [Producer khởi động lại (Producer restart)](#/docs/kafka-08) và [Broker gặp sự cố (Broker failure)](#/docs/kafka-08) thì đọc chậm: mục đầu cho thấy producer mới nhận ID hoàn toàn mới nên bản trùng của producer cũ không bị phát hiện; mục sau đi qua ba tình huống phục hồi — follower lên leader đã sẵn sequence trong bộ nhớ, leader cũ quay lại đọc snapshot, và crash khi snapshot chưa kịp cập nhật. [Giới hạn của Idempotent Producer](#/docs/kafka-08) ngắn nhưng phải thuộc, cùng khung "Mẹo" ngay sau. [Làm thế nào để dùng Kafka Idempotent Producer?](#/docs/kafka-08) liệt kê bốn thứ đổi khi bật cờ, kể cả 96 bit thêm vào mỗi record batch; khung "Lưu ý" cuối mục kể KIP-360 đã sửa gì ở bản 2.5.

**Bẫy.** Thấy lỗi "out of order sequence" trong log rồi bỏ qua vì producer vẫn chạy. Khung "Cảnh báo" nói rõ tuy producer tiếp tục hoạt động bình thường, lỗi này thường cho thấy message đã bị mất giữa producer và broker — nhận message số 2 rồi tới số 27 nghĩa là đã có chuyện với các message từ 3 đến 26; hãy soát lại cấu hình producer và topic, và kiểm tra có xảy ra unclean leader election hay không. Bẫy thứ hai: chạy hai instance ứng dụng cùng đọc một thư mục file và tin idempotence sẽ dọn hộ. Khung "Mẹo" chốt phạm vi: idempotent producer chỉ ngăn các bản trùng lặp gây ra bởi cơ chế retry của chính producer, ngoài ra không ngăn được gì khác — kể cả việc bạn gọi \`producer.send()\` hai lần với cùng một message.

**Tự kiểm tra.** Nếu đã đặt \`acks=all\`, bật \`enable.idempotence\` tốn thêm gì về hiệu năng? Và vì sao broker chỉ cần nhớ năm sequence gần nhất mỗi partition?`,
      },
      {
        id: "kf-w5-5",
        text: "Transaction, exactly-once, và cái giá hiệu năng",
        lesson: `**Mục tiêu.** Viết được một vòng consume-process-produce bọc trong transaction, và kể tên năm tình huống mà nhãn "exactly-once" không còn đúng.

**Đọc.** [Transactions](#/docs/kafka-08) mở bằng phạm vi thiết kế: transaction sinh ra cho mẫu hình consume-process-produce của stream processing, kèm khung "Lưu ý" tách bạch cơ chế transaction với hành vi exactly-once. [Các tình huống sử dụng Transaction](#/docs/kafka-08) ngắn. [Transaction giải quyết những vấn đề gì?](#/docs/kafka-08) với [Xử lý lại do ứng dụng crash (Reprocessing caused by application crashes)](#/docs/kafka-08) và [Xử lý lại do ứng dụng zombie (Reprocessing caused by zombie applications)](#/docs/kafka-08) — hai kịch bản này là lý do tồn tại của cả mục. [Transaction bảo đảm Exactly-Once bằng cách nào?](#/docs/kafka-08) thì đọc chậm: atomic multipartition write với Hình 8-1, \`transactional.id\` bền qua các lần khởi động lại, zombie fencing bằng epoch, rồi phía consumer là \`isolation.level=read_committed\` với Hình 8-2 và Last Stable Offset. [Những vấn đề nào không được Transaction giải quyết?](#/docs/kafka-08) đọc hết năm mục con, từ [Tác dụng phụ trong lúc stream processing (Side effects while stream processing)](#/docs/kafka-08) tới [Mẫu hình publish/subscribe (Publish/subscribe pattern)](#/docs/kafka-08); khung "Lưu ý" về outbox pattern đáng ghi lại. [Làm thế nào để dùng Transaction?](#/docs/kafka-08) thì gõ lại trọn vòng lặp với \`initTransactions\`, \`beginTransaction\`, \`sendOffsetsToTransaction\`, \`commitTransaction\` và hai khối \`catch\`. [Transactional ID và Fencing](#/docs/kafka-08) cùng Hình 8-3 và 8-4, [Transaction hoạt động như thế nào](#/docs/kafka-08) với bốn bước two-phase commit, rồi [Hiệu năng của Transaction](#/docs/kafka-08) khép chương.

**Bẫy.** Publish một message trong transaction rồi chờ ứng dụng khác phản hồi mới commit. Khung "Cảnh báo" cuối mục publish/subscribe gọi đây là mẫu hình quan trọng cần tránh: ứng dụng kia sẽ không nhận được message cho tới sau khi transaction được commit, và bạn có deadlock. Bẫy thứ hai: sinh \`transactional.id\` mới cho mỗi lần chạy cho tiện. Khung "Cảnh báo" cuối mục Transaction hoạt động như thế nào định lượng cái giá: broker giữ trạng thái mỗi producer trong \`transactional.id.expiration.ms\`, mặc định bảy ngày — ba producer mới mỗi giây suốt một tuần thành 1,8 triệu bản ghi trạng thái, khoảng 5 GB RAM, đủ gây hết bộ nhớ hoặc GC nghiêm trọng; sách khuyên khởi tạo vài producer sống lâu rồi tái sử dụng.

**Tự kiểm tra.** Vì sao phải tắt auto-commit và không được gọi API commit của consumer khi dùng transaction? Và vì sao nhiều message hơn trong mỗi transaction lại làm throughput tổng thể cao hơn?`,
      },
    ],
  },
  {
    id: "kf-w6",
    week: "Tuần 6",
    title: "Xây dựng data pipeline với Kafka Connect",
    goal: "Nối được hai hệ thống qua Kafka bằng file cấu hình thay vì code, và biện hộ được lựa chọn đó trước các phương án thay thế.",
    practice:
      "Chạy Kafka Connect ở chế độ standalone với `FileStreamSource` đọc một tệp và `FileStreamSink` ghi ra tệp khác. Rồi đổi converter từ JSON sang String trong tệp cấu hình worker và dùng `kafka-console-consumer.sh` xem topic trung gian đổi hình dạng thế nào.",
    resources: [
      { label: "Kafka 09 — Xây dựng data pipeline", href: "#/docs/kafka-09" },
      { label: "kafka.apache.org — Kafka Connect", href: "https://kafka.apache.org/documentation/#connect" },
    ],
    items: [
      {
        id: "kf-w6-1",
        text: "Những gì phải cân nhắc khi nối hai hệ thống qua Kafka",
        lesson: `**Mục tiêu.** Lập danh sách yêu cầu cho một pipeline trước khi chọn công cụ, và nhận ra ba kiểu ghép nối ngoài ý muốn ngay từ bản thiết kế.

**Đọc.** [Những cân nhắc khi xây dựng data pipeline](#/docs/kafka-09) là phần đọc chậm nhất tuần: một danh sách yêu cầu, không phải dẫn nhập — đọc từng mục rồi tự trả lời cho một pipeline có thật của bạn. [Tính kịp thời (Timeliness)](#/docs/kafka-09) cho hình dung Kafka như buffer tách rời độ nhạy thời gian hai phía. [Độ tin cậy (Reliability)](#/docs/kafka-09) nối vào tuần trước: Kafka tự nó cho at-least-once, exactly-once cần một kho dữ liệu bên ngoài có transaction hoặc key duy nhất. [Định dạng dữ liệu (Data Formats)](#/docs/kafka-09) đọc kỹ đoạn schema với ví dụ MySQL tới Snowflake, cùng khác biệt push/pull giữa Syslog và cơ sở dữ liệu quan hệ. [Biến đổi dữ liệu (Transformations)](#/docs/kafka-09) là mục cần đọc kỹ nhất: đặt ETL cạnh ELT và tự nói ra ai gánh chi phí tính toán trong mỗi phương án. [Bảo mật (Security)](#/docs/kafka-09) cho năm câu hỏi phải trả lời và lời khuyên dùng external config provider thay vì để credential trong file cấu hình. [Sự ghép nối và tính linh hoạt (Coupling and Agility)](#/docs/kafka-09) khép mục với ba kiểu ghép nối: pipeline tùy tiện, mất metadata, xử lý thái quá.

**Bẫy.** Làm sạch và chuẩn hoá dữ liệu thật kỹ ngay lúc nạp vào Kafka. Khung "Cảnh báo" cuối mục Biến đổi dữ liệu vạch ranh giới: một số bước tiền xử lý là điều được mong đợi — chuẩn hoá timestamp và kiểu dữ liệu, thêm thông tin nguồn gốc, loại bỏ thông tin cá nhân — nhưng đừng làm sạch và tối ưu quá sớm, bởi nơi khác có thể cần dữ liệu ở dạng ít tinh chế hơn. Bẫy thứ hai: bỏ qua schema vì "hai đầu đều do đội mình viết". Mục Mất metadata dựng đúng hậu quả: nếu pipeline không bảo tồn schema và không cho phép schema evolution, một DBA thêm một trường ở nguồn sẽ hoặc làm hỏng mọi ứng dụng đọc ở đích hoặc buộc mọi lập trình viên nâng cấp đồng loạt.

**Tự kiểm tra.** Vì sao Kafka áp được back pressure mà không cần bạn viết cơ chế nào? Và lọc bỏ vài trường giữa đường trong pipeline MongoDB sang MySQL gây vấn đề gì về sau?`,
      },
      {
        id: "kf-w6-2",
        text: "Khi nào Connect thắng producer/consumer tự viết, và Connect gồm gì",
        lesson: `**Mục tiêu.** Chọn giữa client tự viết và Connect bằng một tiêu chí rõ ràng, rồi chạy được pipeline hai đầu chỉ bằng file cấu hình và REST API.

**Đọc.** [Khi nào dùng Kafka Connect thay vì producer và consumer](#/docs/kafka-09) ngắn nhưng đọc kỹ: dùng client khi bạn sửa được code ứng dụng cần kết nối, dùng Connect khi datastore không do bạn viết và bạn không muốn sửa. [Kafka Connect](#/docs/kafka-09) dựng bộ từ vựng — worker, connector, task, converter — cả mục sau xoay quanh bốn từ này. [Chạy Kafka Connect](#/docs/kafka-09) là mục nặng nhất: \`bootstrap.servers\`, \`group.id\`, \`plugin.path\` với quy ước thư mục con cho mỗi connector, cặp converter key/value, rồi \`rest.host.name\` và \`rest.port\`; chạy hai lệnh \`curl\` xem phiên bản và danh sách plug-in, rồi đọc khung "CHẾ ĐỘ STANDALONE" — phần thực hành tuần dùng chế độ ấy. [Ví dụ connector: File source và file sink](#/docs/kafka-09) thì chạy nửa đầu — nạp \`config/server.properties\` vào \`kafka-config-topic\` rồi soi bằng console consumer; lưu ý lệnh tạo file sink và vài dòng output Elasticsearch ở mục sau bị bản PDF gốc cắt cụt: đừng gõ lại, đừng đoán phần thiếu — tra tài liệu chính thức. Mục ví dụ MySQL tới Elasticsearch cho vai trò \`key.ignore\` và khung "CHANGE DATA CAPTURE VÀ DỰ ÁN DEBEZIUM"; [Single Message Transformations](#/docs/kafka-09) là bảng tra mười một SMT, kèm khung "XỬ LÝ LỖI VÀ DEAD LETTER QUEUE". [Nhìn sâu hơn vào Kafka Connect](#/docs/kafka-09) khép mục: connector, task, worker, converter, quản lý offset — nắm cặp partition/offset logic.

**Bẫy.** Đưa FileStream connector từ bài tập lên production. Khung "Cảnh báo" sau ví dụ nói thẳng: chúng có mặt vì đơn giản và tích hợp sẵn, nhưng không nên dùng cho pipeline production vì nhiều hạn chế và không có bảo đảm nào về độ tin cậy; ba lựa chọn thay thế được nêu tên: FilePulse Connector, FileSystem Connector, SpoolDir. Bẫy thứ hai: đổ jar của connector cùng dependency vào thẳng thư mục \`plugin.path\`. Sách dặn tạo một thư mục con cho mỗi connector, và nói rõ đặt dependency ở thư mục cấp cao nhất sẽ không hoạt động; nhét vào classpath cũng không được khuyến nghị vì dễ xung đột với dependency của chính Kafka.

**Tự kiểm tra.** Ai quyết định số task của một connector, dựa trên cái gì? Và với source connector, "partition" và "offset" nghĩa là gì nếu không phải của Kafka?`,
      },
      {
        id: "kf-w6-3",
        text: "Các lựa chọn thay thế Connect, và khi nào chọn chúng",
        lesson: `**Mục tiêu.** Biết ba họ công cụ cạnh tranh với Kafka Connect và điều kiện khiến mỗi họ là đúng — thay vì mặc định chọn Connect vì đang đọc sách Kafka.

**Đọc.** [Các lựa chọn thay thế Kafka Connect](#/docs/kafka-09) chỉ hơn một trang nhưng đọc kỹ: phần duy nhất trong chương đặt Connect vào thế cạnh tranh. [Framework nạp dữ liệu cho các datastore khác](#/docs/kafka-09) cho tiêu chí rõ nhất: Kafka là phần không thể thiếu của kiến trúc và mục tiêu là nối rất nhiều source và sink thì dùng Connect; còn nếu bạn xây một hệ lấy Hadoop hoặc Elastic làm trung tâm, Kafka chỉ là một trong nhiều đầu vào, thì Flume, Logstash hay Fluentd hợp lý hơn. [Công cụ ETL dựa trên giao diện đồ họa (GUI)](#/docs/kafka-09) đọc chậm hơn — Informatica, Talend, Pentaho, NiFi, StreamSets đều coi Kafka vừa là nguồn vừa là đích, nên câu hỏi là bạn đã có sẵn hệ nào; ghi lại lời khuyên nhìn Kafka như nền tảng làm cả ba việc: tích hợp dữ liệu bằng Connect, tích hợp ứng dụng bằng client, và stream processing. [Framework stream processing](#/docs/kafka-09) ngắn nhất: nếu bạn vốn đã dùng một framework xử lý event từ Kafka và hệ thống đích được nó hỗ trợ, dùng luôn nó cho khâu tích hợp sẽ tiết kiệm một vòng ghi ngược.

**Bẫy.** Kéo một công cụ ETL đồ hoạ vào chỉ để đưa dữ liệu ra vào Kafka. Sách nêu đúng nhược điểm chính: các hệ này thường được xây cho những luồng công việc phức tạp, thành ra khá nặng nề và rườm rà nếu tất cả những gì bạn muốn chỉ là đưa dữ liệu ra vào Kafka — hầu hết công cụ ETL đều thêm sự phức tạp không cần thiết, trong khi tích hợp dữ liệu nên tập trung vào việc phân phối message trung thực trong mọi điều kiện. Bẫy thứ hai: bỏ vòng ghi ngược về Kafka cho gọn khi dùng framework stream processing. Sách ghi rõ cái giá: có thể khó xử lý sự cố hơn với những chuyện như message bị mất hoặc bị hỏng.

**Tự kiểm tra.** Điều kiện nào khiến Flume hoặc Logstash đúng hơn Connect, và nó nói gì về vai trò của Kafka? Và bỏ bước lưu event đã xử lý trở lại Kafka tiết kiệm gì, đánh đổi gì?`,
      },
    ],
  },
];
