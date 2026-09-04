# Chương 12. Quản trị vận hành Kafka (Administering Kafka)

Việc quản lý một Kafka cluster đòi hỏi thêm các công cụ hỗ trợ để thực hiện những thay đổi mang tính quản trị đối với topic, cấu hình và nhiều thứ khác. Kafka cung cấp một số tiện ích giao diện dòng lệnh (command-line interface — CLI) hữu ích cho việc thực hiện các thay đổi quản trị trên cluster của bạn. Các công cụ này được hiện thực bằng các class Java, kèm theo là một tập các script được cung cấp sẵn để gọi các class đó một cách đúng đắn. Mặc dù những công cụ này cung cấp các chức năng cơ bản, bạn có thể thấy chúng còn thiếu sót đối với các thao tác phức tạp hơn, hoặc trở nên bất tiện khi vận hành ở quy mô lớn. Chương này sẽ chỉ mô tả các công cụ cơ bản có sẵn trong dự án mã nguồn mở Apache Kafka. Thông tin thêm về các công cụ nâng cao được phát triển bởi cộng đồng, nằm ngoài dự án lõi, có thể tìm thấy trên website của Apache Kafka.

> **Phân quyền cho các thao tác quản trị (Authorizing admin operations)**
>
> Mặc dù Apache Kafka có hiện thực authentication và authorization để kiểm soát các thao tác trên topic, cấu hình mặc định lại không hạn chế việc sử dụng những công cụ này. Điều đó có nghĩa là các công cụ CLI này có thể được dùng mà không cần bất kỳ authentication nào, cho phép các thao tác như thay đổi topic được thực thi mà không qua kiểm tra bảo mật hay ghi nhận audit nào. Hãy luôn đảm bảo rằng quyền truy cập vào bộ công cụ này trong môi trường triển khai của bạn chỉ giới hạn cho các quản trị viên, nhằm ngăn chặn những thay đổi trái phép.

## Thao tác với topic (Topic Operations)

Công cụ `kafka-topics.sh` cung cấp cách truy cập dễ dàng tới hầu hết các thao tác trên topic. Nó cho phép bạn tạo, sửa đổi, xóa và liệt kê thông tin về các topic trong cluster. Mặc dù một số cấu hình topic cũng có thể thực hiện thông qua lệnh này, chúng đã bị deprecated, và khuyến nghị nên dùng phương pháp mạnh mẽ hơn là sử dụng công cụ `kafka-config.sh` cho các thay đổi cấu hình. Để sử dụng lệnh `kafka-topics.sh`, bạn phải cung cấp chuỗi kết nối tới cluster và cổng thông qua tùy chọn `--bootstrap-server`. Trong các ví dụ tiếp theo, chuỗi kết nối cluster đang được chạy cục bộ trên một trong các host thuộc Kafka cluster, và chúng ta sẽ dùng `localhost:9092`.

Xuyên suốt chương này, tất cả các công cụ sẽ nằm trong thư mục */usr/local/kafka/bin/*. Các lệnh ví dụ trong mục này giả định rằng bạn đang ở trong thư mục đó hoặc đã thêm thư mục đó vào biến `$PATH`.

> **Kiểm tra phiên bản (Check the version)**
>
> Nhiều công cụ dòng lệnh của Kafka phụ thuộc vào phiên bản Kafka đang chạy để hoạt động đúng. Điều này bao gồm cả một số lệnh có thể lưu dữ liệu trong ZooKeeper thay vì kết nối trực tiếp tới các broker. Vì lý do đó, điều quan trọng là phải đảm bảo phiên bản của công cụ bạn đang dùng khớp với phiên bản của các broker trong cluster. Cách an toàn nhất là chạy các công cụ ngay trên chính các Kafka broker, sử dụng phiên bản đã được triển khai ở đó.

### Tạo một topic mới (Creating a New Topic)

Khi tạo một topic mới thông qua lệnh `--create`, có một vài tham số bắt buộc để tạo topic mới trong cluster. Các tham số này phải được cung cấp khi dùng lệnh này ngay cả khi một số trong chúng đã có sẵn giá trị mặc định ở mức broker. Tại thời điểm này cũng có thể cung cấp thêm các tham số khác và các cấu hình ghi đè (configuration override) bằng tùy chọn `--config`, nhưng phần đó sẽ được đề cập ở phần sau của chương. Dưới đây là danh sách ba tham số bắt buộc:

- `--topic`

    Tên của topic mà bạn muốn tạo.

- `--replication-factor`

    Số lượng replica của topic cần duy trì trong cluster.

- `--partitions`

    Số lượng partition cần tạo cho topic.

> **Thực hành tốt khi đặt tên topic (Good topic naming practices)**
>
> Tên topic có thể chứa ký tự chữ và số, dấu gạch dưới, dấu gạch ngang và dấu chấm; tuy nhiên, không nên dùng dấu chấm trong tên topic. Các metric nội bộ bên trong Kafka chuyển ký tự dấu chấm thành ký tự gạch dưới (ví dụ: "topic.1" trở thành "topic_1" trong các phép tính metric), điều này có thể dẫn tới xung đột tên topic.
>
> Một khuyến nghị khác là tránh dùng hai dấu gạch dưới liên tiếp để bắt đầu tên topic của bạn. Theo quy ước, các topic nội bộ phục vụ hoạt động của Kafka được tạo với quy ước đặt tên bắt đầu bằng hai dấu gạch dưới (như topic `__consumer_offsets`, dùng để theo dõi việc lưu trữ offset của consumer group). Do đó, không nên đặt tên topic bắt đầu bằng hai dấu gạch dưới để tránh gây nhầm lẫn.

Việc tạo một topic mới rất đơn giản. Hãy chạy `kafka-topics.sh` như sau:

```bash
# kafka-topics.sh --bootstrap-server <connection-string>:<port> --create --topic <string
--replication-factor <integer> --partitions <integer>
#
```

Lệnh này sẽ khiến cluster tạo một topic với tên và số partition đã chỉ định. Với mỗi partition, cluster sẽ chọn số lượng replica được chỉ định một cách phù hợp. Điều này có nghĩa là nếu cluster được thiết lập để gán replica có nhận biết rack (rack-aware replica assignment), thì các replica của mỗi partition sẽ nằm ở các rack khác nhau. Nếu bạn không muốn việc gán theo rack, hãy chỉ định tham số dòng lệnh `--disable-rack-aware`.

Ví dụ, tạo một topic tên "my-topic" với tám partition, mỗi partition có hai replica:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092 --create
--topic my-topic --replication-factor 2 --partitions 8
Created topic "my-topic".
#
```

> **Sử dụng đúng cách các tham số if-exists và if-not-exists**
>
> Khi dùng `kafka-topics.sh` trong tự động hóa, bạn có thể muốn dùng tham số `--if-not-exists` khi tạo topic mới, để lệnh không trả về lỗi nếu topic đã tồn tại.
>
> Mặc dù tham số `--if-exists` cũng được cung cấp cho lệnh `--alter`, việc sử dụng nó không được khuyến nghị. Dùng tham số này sẽ khiến lệnh không trả về lỗi nếu topic đang được thay đổi không tồn tại. Điều đó có thể che giấu các vấn đề trong trường hợp một topic đáng lẽ phải được tạo nhưng lại không tồn tại.

### Liệt kê tất cả topic trong một cluster (Listing All Topics in a Cluster)

Lệnh `--list` liệt kê tất cả các topic trong một cluster. Danh sách được định dạng mỗi dòng một topic, không theo thứ tự cụ thể nào, rất hữu ích để tạo ra danh sách đầy đủ các topic.

Đây là ví dụ về tùy chọn `--list` liệt kê tất cả topic trong cluster:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092 --list
__consumer_offsets
my-topic
other-topic
```

Bạn sẽ để ý thấy topic nội bộ `__consumer_offsets` cũng được liệt kê ở đây. Chạy lệnh với `--exclude-internal` sẽ loại bỏ khỏi danh sách tất cả các topic bắt đầu bằng hai dấu gạch dưới đã đề cập ở trên, điều này có thể hữu ích.

### Xem chi tiết thông tin topic (Describing Topic Details)

Bạn cũng có thể lấy thông tin chi tiết về một hoặc nhiều topic trong cluster. Kết quả xuất ra bao gồm số lượng partition, các cấu hình ghi đè của topic, và danh sách từng partition cùng với việc gán replica của nó. Có thể giới hạn kết quả chỉ cho một topic bằng cách cung cấp tham số `--topic` cho lệnh.

Ví dụ, mô tả topic "my-topic" mà chúng ta vừa tạo trong cluster:

```bash
# kafka-topics.sh --boostrap-server localhost:9092 --describe --topic my-topic
Topic: my-topic PartitionCount: 8       ReplicationFactor: 2    Configs: segment.bytes=1
                    Topic: my-topic Partition: 0                                        Leader: 1   Replicas: 1,0   Isr: 1,0
                    Topic: my-topic Partition: 1                                        Leader: 0   Replicas: 0,1   Isr: 0,1
                    Topic: my-topic Partition: 2                                        Leader: 1   Replicas: 1,0   Isr: 1,0
                    Topic: my-topic Partition: 3                                        Leader: 0   Replicas: 0,1   Isr: 0,1
                    Topic: my-topic Partition: 4                                        Leader: 1   Replicas: 1,0   Isr: 1,0
                    Topic: my-topic Partition: 5                                        Leader: 0   Replicas: 0,1   Isr: 0,1
                    Topic: my-topic Partition: 6                                        Leader: 1   Replicas: 1,0   Isr: 1,0
                    Topic: my-topic Partition: 7                                        Leader: 0   Replicas: 0,1   Isr: 0,1
#
```

Lệnh `--describe` cũng có một số tùy chọn hữu ích để lọc kết quả xuất ra. Chúng có thể giúp chẩn đoán các vấn đề của cluster dễ dàng hơn. Với những lệnh này, chúng ta thường không chỉ định tham số `--topic` bởi vì mục đích là tìm tất cả các topic hoặc partition trong cluster khớp với tiêu chí đưa ra. Các tùy chọn này không hoạt động với lệnh list. Dưới đây là danh sách các cặp tùy chọn hữu ích nên dùng:

- `--topics-with-overrides`

    Tùy chọn này sẽ chỉ mô tả những topic có cấu hình khác với mặc định của cluster.

- `--exclude-internal`

    Lệnh đã đề cập trước đó sẽ loại bỏ khỏi danh sách tất cả các topic bắt đầu bằng quy ước đặt tên hai dấu gạch dưới.

Các lệnh sau đây được dùng để giúp tìm ra những topic partition có thể đang gặp vấn đề:

- `--under-replicated-partitions`

    Tùy chọn này hiển thị tất cả các partition mà một hoặc nhiều replica không đồng bộ (in sync) với leader. Điều này không nhất thiết là xấu, vì việc bảo trì cluster, triển khai và rebalance đều sẽ gây ra các partition thiếu bản sao (under-replicated partition, hay URP), nhưng đây là điều bạn cần lưu tâm.

- `--at-min-isr-partitions`

    Tùy chọn này hiển thị tất cả các partition mà số lượng replica, bao gồm cả leader, đúng bằng giá trị thiết lập cho số lượng in-sync replica (ISR) tối thiểu. Những topic này vẫn khả dụng cho các client producer hoặc consumer, nhưng toàn bộ khả năng dự phòng đã mất, và chúng đang có nguy cơ trở nên không khả dụng.

- `--under-min-isr-partitions`

    Tùy chọn này hiển thị tất cả các partition mà số lượng ISR thấp hơn mức tối thiểu được cấu hình để thao tác produce thành công. Các partition này thực chất đang ở chế độ chỉ đọc (read-only) và không thể produce dữ liệu vào.

- `--unavailable-partitions`

    Tùy chọn này hiển thị tất cả các topic partition không có leader. Đây là một tình huống nghiêm trọng và cho thấy partition đang offline, không khả dụng đối với các client producer hoặc consumer.

Sau đây là ví dụ tìm các topic đang ở mức ISR tối thiểu. Trong ví dụ này, topic được cấu hình với min-ISR bằng 1 và có replication factor (RF) bằng 2. Host 0 đang online, còn host 1 đã ngừng hoạt động để bảo trì:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092 --describe --at-min-isr-partitions
           Topic: my-topic Partition: 0               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 1               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 2               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 3               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 4               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 5               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 6               Leader: 0             Replicas: 0,1   Isr: 0
           Topic: my-topic Partition: 7               Leader: 0             Replicas: 0,1   Isr: 0
#
```

### Thêm partition (Adding Partitions)

Đôi khi cần phải tăng số lượng partition cho một topic. Partition là cách để topic được mở rộng quy mô và được replicate trên toàn cluster. Lý do phổ biến nhất để tăng số lượng partition là mở rộng theo chiều ngang (horizontally scale) một topic trên nhiều broker hơn bằng cách giảm throughput trên mỗi partition. Số partition của topic cũng có thể được tăng nếu một consumer cần mở rộng để chạy nhiều bản sao hơn trong cùng một consumer group, vì một partition chỉ có thể được consume bởi một thành viên duy nhất trong group.

Sau đây là ví dụ tăng số lượng partition cho topic tên "my-topic" lên 16 bằng lệnh `--alter`, tiếp theo là bước kiểm tra để xác nhận thao tác đã thành công:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092
--alter --topic my-topic --partitions 16

# kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-topic
Topic: my-topic PartitionCount: 16                       ReplicationFactor: 2    Configs: segment.bytes=1
        Topic: my-topic Partition: 0                     Leader: 1       Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 1          Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 2          Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 3          Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 4          Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 5          Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 6          Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 7          Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 8          Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 9          Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 10         Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 11         Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 12         Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 13         Leader: 0               Replicas: 0,1   Isr: 0,1
                   Topic: my-topic Partition: 14         Leader: 1               Replicas: 1,0   Isr: 1,0
                   Topic: my-topic Partition: 15         Leader: 0               Replicas: 0,1   Isr: 0,1
#
```

> **Điều chỉnh các topic có key (Adjusting keyed topics)**
>
> Các topic được produce với message có key có thể rất khó để thêm partition, xét từ góc nhìn của consumer. Lý do là ánh xạ từ key sang partition sẽ thay đổi khi số lượng partition thay đổi. Vì vậy, nên đặt số lượng partition cho một topic sẽ chứa các message có key một lần duy nhất, ngay khi topic được tạo, và tránh thay đổi kích thước của topic về sau.

### Giảm số lượng partition (Reducing Partitions)

Không thể giảm số lượng partition của một topic. Việc xóa một partition khỏi topic sẽ khiến một phần dữ liệu trong topic đó cũng bị xóa, điều này sẽ gây ra sự thiếu nhất quán từ góc nhìn của client. Thêm vào đó, việc cố gắng phân phối lại dữ liệu sang các partition còn lại sẽ rất khó khăn và dẫn tới các message bị sai thứ tự. Nếu bạn cần giảm số lượng partition, khuyến nghị là xóa topic và tạo lại nó, hoặc (nếu không thể xóa) tạo một phiên bản mới của topic hiện có và chuyển toàn bộ lưu lượng produce sang topic mới (ví dụ: "my-topic-v2").

### Xóa một topic (Deleting a Topic)

Ngay cả một topic không có message nào cũng vẫn tiêu tốn tài nguyên của cluster như dung lượng đĩa, filehandle đang mở và bộ nhớ. Controller cũng phải lưu giữ những metadata rác mà nó buộc phải nắm giữ, điều này có thể làm giảm hiệu năng ở quy mô lớn. Nếu một topic không còn cần thiết nữa, có thể xóa nó đi để giải phóng các tài nguyên này. Để thực hiện thao tác này, các broker trong cluster phải được cấu hình với tùy chọn `delete.topic.enable` đặt thành `true`. Nếu nó được đặt thành `false`, thì yêu cầu xóa topic sẽ bị bỏ qua và sẽ không thành công.

Việc xóa topic là một thao tác bất đồng bộ. Điều này có nghĩa là chạy lệnh này sẽ đánh dấu một topic để xóa, nhưng việc xóa có thể không xảy ra ngay lập tức, tùy thuộc vào lượng dữ liệu và công việc dọn dẹp cần thiết. Controller sẽ thông báo cho các broker về việc xóa đang chờ xử lý sớm nhất có thể (sau khi các tác vụ hiện có của controller hoàn tất), và các broker sau đó sẽ vô hiệu hóa metadata của topic và xóa các file khỏi đĩa. Rất khuyến nghị rằng người vận hành không nên xóa quá một hoặc hai topic cùng lúc, và cho các thao tác đó đủ thời gian để hoàn tất trước khi xóa các topic khác, do những hạn chế trong cách controller thực thi các thao tác này. Trong cluster nhỏ được minh họa ở các ví dụ trong cuốn sách này, việc xóa topic sẽ diễn ra gần như ngay lập tức, nhưng trong các cluster lớn hơn nó có thể mất nhiều thời gian hơn.

> **Cảnh báo: nguy cơ mất dữ liệu (Data loss ahead)**
>
> Việc xóa một topic cũng sẽ xóa toàn bộ message của nó. Đây là thao tác không thể hoàn tác. Hãy chắc chắn rằng nó được thực thi một cách cẩn trọng.

Sau đây là ví dụ xóa topic tên "my-topic" bằng tham số `--delete`. Tùy thuộc vào phiên bản Kafka, sẽ có một dòng ghi chú cho bạn biết rằng tham số này sẽ không có tác dụng nếu một cấu hình khác chưa được thiết lập:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092
--delete --topic my-topic


Note: This will have no impact if delete.topic.enable is not set
to true.
#
```

Bạn sẽ thấy rằng không có phản hồi trực quan nào cho biết việc xóa topic đã hoàn tất thành công hay chưa. Hãy kiểm tra xem việc xóa có thành công không bằng cách chạy tùy chọn `--list` hoặc `--describe` để thấy rằng topic không còn trong cluster nữa.

## Consumer Groups

Consumer group là các nhóm Kafka consumer được điều phối để consume từ các topic hoặc từ nhiều partition của một topic đơn lẻ. Công cụ `kafka-consumer-groups.sh` giúp quản lý và nắm bắt thông tin về các consumer group đang consume từ các topic trong cluster. Nó có thể được dùng để liệt kê các consumer group, mô tả chi tiết các group cụ thể, xóa consumer group hoặc thông tin cụ thể của group, hoặc reset thông tin offset của consumer group.

> **Consumer group dựa trên ZooKeeper (ZooKeeper-based consumer groups)**
>
> Trong các phiên bản Kafka cũ hơn, consumer group có thể được quản lý và duy trì trong ZooKeeper. Hành vi này đã bị deprecated từ phiên bản 0.11.0.* trở đi, và các consumer group kiểu cũ không còn được sử dụng nữa. Một số phiên bản của các script được cung cấp có thể vẫn hiển thị các lệnh dùng chuỗi kết nối `--zookeeper` đã bị deprecated, nhưng không nên sử dụng chúng trừ khi bạn có một môi trường cũ với một số consumer group chưa được nâng cấp lên các phiên bản Kafka mới hơn.

### Liệt kê và mô tả group (List and Describe Groups)

Để liệt kê các consumer group, hãy dùng tham số `--bootstrap-server` và `--list`. Các consumer tạm thời (ad hoc) sử dụng script `kafka-consumer-groups.sh` sẽ xuất hiện dưới dạng `console-consumer-<generated_id>` trong danh sách consumer:

```bash
# kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
console-consumer-95554
console-consumer-9581
my-consumer
#
```

Với bất kỳ group nào được liệt kê, bạn có thể lấy thêm chi tiết bằng cách đổi tham số `--list` thành `--describe` và thêm tham số `--group`. Lệnh này sẽ liệt kê tất cả các topic và partition mà group đang consume, cũng như các thông tin bổ sung như offset của từng topic partition. Bảng 12-1 mô tả đầy đủ tất cả các trường có trong kết quả xuất ra.

Ví dụ, lấy chi tiết consumer group cho group ad hoc tên "my-consumer":

```bash
# kafka-consumer-groups.sh --bootstrap-server localhost:9092
--describe --group my-consumer
GROUP          TOPIC           PARTITION CURRENT-OFFSET LOG-END-OFFSET             LAG   CONS
my-consumer               my-topic               0          2                  4    2     con
my-consumer               my-topic               1          2                  3    1     con
my-consumer               my-topic               2          2                  3    1     con
#
```

**Bảng 12-1. Các trường được cung cấp cho group tên "my-consumer"**

| Trường | Mô tả |
|---|---|
| `GROUP` | Tên của consumer group. |
| `TOPIC` | Tên của topic đang được consume. |
| `PARTITION` | Số ID của partition đang được consume. |
| `CURRENT-OFFSET` | Offset tiếp theo sẽ được consumer group consume cho topic partition này. Đây là vị trí của consumer bên trong partition. |
| `LOG-END-OFFSET` | Offset high-water mark hiện tại từ broker cho topic partition này. Đây là offset của message tiếp theo sẽ được produce vào partition này. |
| `LAG` | Chênh lệch giữa Current-Offset của consumer và Log-End-Offset của broker cho topic partition này. |
| `CONSUMER-ID` | Một consumer-id duy nhất được sinh ra dựa trên client-id được cung cấp. |
| `HOST` | Địa chỉ của host mà consumer group đang đọc dữ liệu. |
| `CLIENT-ID` | Chuỗi do client cung cấp để định danh client đang consume từ group. |

### Xóa group (Delete Group)

Việc xóa consumer group có thể được thực hiện bằng tham số `--delete`. Lệnh này sẽ xóa toàn bộ group, bao gồm tất cả offset đã lưu cho tất cả các topic mà group đang consume. Để thực hiện thao tác này, tất cả consumer trong group phải được tắt, vì consumer group không được phép có bất kỳ thành viên nào đang hoạt động. Nếu bạn cố gắng xóa một group chưa rỗng, một lỗi với nội dung "The group is not empty" sẽ được ném ra và không có gì xảy ra. Cũng có thể dùng chính lệnh này để xóa offset cho một topic đơn lẻ mà group đang consume mà không xóa toàn bộ group, bằng cách thêm tham số `--topic` và chỉ định offset của topic nào cần xóa.

Sau đây là ví dụ xóa toàn bộ consumer group tên "my-consumer":

```bash
# kafka-consumer-groups.sh --bootstrap-server localhost:9092 --delete --group my-consume
Deletion of requested consumer groups ('my-consumer') was successful.
#
```

### Quản lý offset (Offset Management)

Ngoài việc hiển thị và xóa offset của một consumer group, bạn cũng có thể truy xuất các offset và lưu các offset mới theo lô (batch). Điều này hữu ích khi cần reset offset cho một consumer trong trường hợp có sự cố đòi hỏi phải đọc lại các message, hoặc để đẩy offset tiến lên và bỏ qua một message mà consumer đang gặp vấn đề khi xử lý (ví dụ: nếu có một message bị định dạng sai mà consumer không thể xử lý được).

#### Xuất offset (Export offsets)

Để xuất offset từ một consumer group ra file CSV, hãy dùng tham số `--reset-offsets` với tùy chọn `--dry-run`. Việc này sẽ cho phép chúng ta tạo ra một bản xuất các offset hiện tại theo định dạng file có thể tái sử dụng để import hoặc rollback offset về sau. Bản xuất định dạng CSV sẽ có cấu trúc như sau:

```
<topic-name>,<partition-number>,<offset>
```

Chạy chính lệnh đó mà không có tùy chọn `--dry-run` sẽ reset các offset một cách hoàn toàn, vì vậy hãy cẩn thận.

Sau đây là ví dụ xuất các offset cho topic "my-topic" đang được consume bởi consumer group tên "my-consumer" ra file có tên *offsets.csv*:

```bash
# kafka-consumer-groups.sh --bootstrap-server localhost:9092
--export --group my-consumer --topic my-topic
--reset-offsets --to-current --dry-run > offsets.csv


# cat offsets.csv
my-topic,0,8905
my-topic,1,8915
my-topic,2,9845
my-topic,3,8072
my-topic,4,8008
my-topic,5,8319
my-topic,6,8102
my-topic,7,12739
#
```

#### Nhập offset (Import offsets)

Công cụ nhập offset là thao tác ngược lại của việc xuất. Nó nhận file được tạo ra bởi việc xuất offset ở phần trước và dùng file đó để thiết lập offset hiện tại cho consumer group. Một thực hành phổ biến là xuất các offset hiện tại của consumer group, tạo một bản sao của file (để bạn giữ lại một bản backup), rồi chỉnh sửa bản sao đó để thay thế các offset bằng những giá trị mong muốn.

> **Dừng consumer trước (Stop consumers first)**
>
> Trước khi thực hiện bước này, điều quan trọng là tất cả consumer trong group phải được dừng lại. Chúng sẽ không đọc các offset mới nếu những offset đó được ghi trong lúc consumer group đang hoạt động. Các consumer sẽ chỉ ghi đè lên những offset đã được import.

Trong ví dụ sau, chúng ta nhập các offset cho consumer group tên "my-consumer" từ file mà chúng ta đã tạo ở ví dụ trước có tên *offsets.csv*:

```bash
# kafka-consumer-groups.sh --bootstrap-server localhost:9092
--reset-offsets --group my-consumer
--from-file offsets.csv --execute
  TOPIC                           PARTITION NEW-OFFSET
     my-topic                                  0              8905
     my-topic                                  1              8915
     my-topic                                  2              9845
     my-topic                                  3              8072
     my-topic                                  4              8008
     my-topic                                  5              8319
     my-topic                                  6              8102
     my-topic                                  7              12739
#
```

## Thay đổi cấu hình động (Dynamic Configuration Changes)

Có vô số cấu hình cho topic, client, broker và nhiều thành phần khác có thể được cập nhật động trong lúc chạy mà không cần phải tắt hay triển khai lại cluster. `kafka-configs.sh` là công cụ chính để sửa đổi các cấu hình này. Hiện tại có bốn nhóm chính, hay entity-type, của các thay đổi cấu hình động có thể thực hiện: topics, brokers, users và clients. Với mỗi entity-type có những cấu hình cụ thể có thể được ghi đè. Các cấu hình động mới liên tục được bổ sung qua mỗi bản phát hành Kafka, vì vậy nên đảm bảo rằng bạn có cùng phiên bản của công cụ này khớp với phiên bản Kafka mà bạn đang chạy. Để thuận tiện cho việc thiết lập các cấu hình này một cách nhất quán qua tự động hóa, tham số `--add-config-file` có thể được dùng với một file đã được định dạng sẵn chứa tất cả các cấu hình mà bạn muốn quản lý và cập nhật.

### Ghi đè cấu hình mặc định của topic (Overriding Topic Configuration Defaults)

Có nhiều cấu hình được đặt mặc định cho topic, được định nghĩa trong các file cấu hình tĩnh của broker (ví dụ: chính sách thời gian retention). Với cấu hình động, chúng ta có thể ghi đè các giá trị mặc định ở mức cluster cho từng topic riêng lẻ nhằm đáp ứng các tình huống sử dụng khác nhau trong cùng một cluster. Bảng 12-2 liệt kê các khóa cấu hình hợp lệ cho topic có thể được thay đổi động.

Định dạng của lệnh để thay đổi cấu hình topic là:

```bash
kafka-configs.sh --bootstrap-server localhost:9092
--alter --entity-type topics --entity-name <topic-name>
--add-config <key>=<value>[,<key>=<value>...]
```

Sau đây là ví dụ đặt thời gian retention cho topic tên "my-topic" thành 1 giờ (3.600.000 ms):

```bash
# kafka-configs.sh --bootstrap-server localhost:9092
--alter --entity-type topics --entity-name my-topic
--add-config retention.ms=3600000
Updated config for topic: "my-topic".
#
```

**Bảng 12-2. Các khóa hợp lệ cho topic**

| Khóa cấu hình | Mô tả |
|---|---|
| `cleanup.policy` | Nếu đặt thành `compact`, các message trong topic này sẽ bị loại bỏ và chỉ message mới nhất với một key cho trước được giữ lại (log compacted). |
| `compression.type` | Kiểu nén mà broker sử dụng khi ghi các batch message của topic này xuống đĩa. |
| `delete.retention.ms` | Khoảng thời gian, tính bằng mili giây, mà các tombstone đã xóa sẽ được giữ lại cho topic này. Chỉ hợp lệ với các topic đã bật log compaction. |
| `file.delete.delay.ms` | Khoảng thời gian, tính bằng mili giây, cần chờ trước khi xóa các log segment và index của topic này khỏi đĩa. |
| `flush.messages` | Số lượng message được nhận trước khi buộc phải flush các message của topic này xuống đĩa. |
| `flush.ms` | Khoảng thời gian, tính bằng mili giây, trước khi buộc phải flush các message của topic này xuống đĩa. |
| `follower.replication.throttled.replicas` | Danh sách các replica mà việc replicate log sẽ bị điều tiết (throttle) bởi follower. |
| `index.interval.bytes` | Số byte message có thể được produce giữa các mục (entry) trong index của log segment. |
| `leader.replication.throttled.replicas` | Danh sách các replica mà việc replicate log sẽ bị điều tiết (throttle) bởi leader. |
| `max.compaction.lag.ms` | Giới hạn thời gian tối đa mà một message sẽ không đủ điều kiện để được compaction trong log. |
| `max.message.bytes` | Kích thước tối đa của một message đơn lẻ cho topic này, tính bằng byte. |
| `message.downconversion.enable` | Cho phép hạ cấp (down-convert) phiên bản định dạng message về phiên bản trước đó nếu được bật, kèm theo một chút overhead. |
| `message.format.version` | Phiên bản định dạng message mà broker sẽ dùng khi ghi message xuống đĩa. Phải là một số hiệu phiên bản API hợp lệ. |
| `message.timestamp.difference.max.ms` | Chênh lệch tối đa cho phép, tính bằng mili giây, giữa timestamp của message và timestamp của broker khi message được nhận. Điều này chỉ hợp lệ nếu `message.timestamp.type` được đặt thành `CreateTime`. |
| `message.timestamp.type` | Timestamp nào sẽ được dùng khi ghi message xuống đĩa. Các giá trị hiện tại là `CreateTime` cho timestamp do client chỉ định và `LogAppendTime` cho thời điểm message được broker ghi vào partition. |
| `min.cleanable.dirty.ratio` | Mức độ thường xuyên mà bộ nén log (log compactor) sẽ cố gắng compact các partition của topic này, biểu diễn dưới dạng tỉ lệ giữa số lượng log segment chưa được compact và tổng số log segment. Chỉ hợp lệ với các topic đã bật log compaction. |
| `min.compaction.lag.ms` | Thời gian tối thiểu mà một message sẽ vẫn chưa bị compact trong log. |
| `min.insync.replicas` | Số lượng replica tối thiểu phải ở trạng thái in sync để một partition của topic được coi là khả dụng. |
| `preallocate` | Nếu đặt thành `true`, các log segment của topic này sẽ được cấp phát trước (preallocate) khi một segment mới được xoay vòng. |
| `retention.bytes` | Lượng message, tính bằng byte, cần giữ lại cho topic này. |
| `retention.ms` | Khoảng thời gian message cần được giữ lại cho topic này, tính bằng mili giây. |
| `segment.bytes` | Lượng message, tính bằng byte, sẽ được ghi vào một log segment đơn lẻ trong một partition. |
| `segment.index.bytes` | Kích thước tối đa, tính bằng byte, của một index của log segment đơn lẻ. |
| `segment.jitter.ms` | Số mili giây tối đa được sinh ngẫu nhiên và cộng thêm vào `segment.ms` khi xoay vòng các log segment. |
| `segment.ms` | Mức độ thường xuyên, tính bằng mili giây, mà log segment của mỗi partition nên được xoay vòng. |
| `unclean.leader.election.enable` | Nếu đặt thành `false`, các cuộc bầu chọn leader không sạch (unclean leader election) sẽ không được phép đối với topic này. |

### Ghi đè cấu hình mặc định của client và user (Overriding Client and User Configuration Defaults)

Đối với Kafka client và user, chỉ có một vài cấu hình có thể được ghi đè, và tất cả về bản chất đều là các loại quota. Hai trong số các cấu hình thường được thay đổi nhất là tốc độ byte/giây được phép cho producer và consumer với một client ID cụ thể, tính trên từng broker. Danh sách đầy đủ các cấu hình dùng chung có thể sửa đổi cho cả user lẫn client được trình bày trong Bảng 12-3.

> **Hành vi throttling không đồng đều trong các cluster mất cân bằng (Uneven throttling behavior in poorly balanced clusters)**
>
> Vì việc throttling diễn ra trên từng broker, sự cân bằng leadership của các partition trên toàn cluster trở nên đặc biệt quan trọng để thực thi điều này một cách đúng đắn. Nếu bạn có 5 broker trong một cluster và bạn chỉ định quota producer là 10 MBps cho một client, client đó sẽ được phép produce 10 MBps trên mỗi broker cùng lúc, tổng cộng là 50 MBps, giả sử leadership được cân bằng trên cả 5 host. Tuy nhiên, nếu leadership của mọi partition đều nằm trên broker 1, thì cũng producer đó chỉ có thể produce tối đa 10 MBps.

**Bảng 12-3. Các cấu hình (khóa) dành cho client**

| Khóa cấu hình | Mô tả |
|---|---|
| `consumer_bytes_rate` | Lượng message, tính bằng byte, mà một client ID đơn lẻ được phép consume từ một broker đơn lẻ trong một giây. |
| `producer_bytes_rate` | Lượng message, tính bằng byte, mà một client ID đơn lẻ được phép produce tới một broker đơn lẻ trong một giây. |
| `controller_mutations_rate` | Tốc độ mà các thay đổi (mutation) được chấp nhận đối với request tạo topic, request tạo partition và request xóa topic. Tốc độ này được tích lũy theo số lượng partition được tạo hoặc bị xóa. |
| `request_percentage` | Tỉ lệ phần trăm cho mỗi cửa sổ quota (trên tổng số `(num.io.threads + num.network.threads) × 100%`) dành cho các request từ user hoặc client. |

> **Client ID và consumer group (Client ID versus consumer group)**
>
> Client ID không nhất thiết phải giống với tên consumer group. Các consumer có thể tự đặt client ID riêng của mình, và bạn có thể có nhiều consumer thuộc các group khác nhau lại chỉ định cùng một client ID. Được coi là thực hành tốt nhất khi đặt client ID cho mỗi consumer group thành một giá trị duy nhất định danh cho group đó. Điều này cho phép một consumer group chia sẻ chung một quota, và giúp dễ dàng hơn trong việc xác định qua log rằng group nào chịu trách nhiệm cho các request.

Các thay đổi cấu hình tương thích cho user và client có thể được chỉ định cùng nhau đối với những cấu hình tương thích áp dụng cho cả hai. Sau đây là ví dụ về lệnh thay đổi tốc độ mutation của controller cho cả một user và một client trong cùng một bước cấu hình:

```bash
# kafka-configs.sh --bootstrap-server localhost:9092
--alter --add-config "controller_mutations_rate=10"
--entity-type clients --entity-name <client ID>
--entity-type users --entity-name <user ID>
#
```

### Ghi đè cấu hình mặc định của broker (Overriding Broker Configuration Defaults)

Các cấu hình ở mức broker và cluster chủ yếu sẽ được cấu hình tĩnh trong các file cấu hình của cluster, nhưng có vô số cấu hình có thể được ghi đè trong lúc chạy mà không cần phải triển khai lại Kafka. Hơn 80 giá trị ghi đè có thể được thay đổi bằng `kafka-configs.sh` cho broker. Vì vậy, chúng ta sẽ không liệt kê tất cả chúng trong cuốn sách này, nhưng bạn có thể tra cứu chúng bằng lệnh `--help` hoặc tìm trong tài liệu mã nguồn mở. Một vài cấu hình quan trọng đáng để nêu ra cụ thể là:

- `min.insync.replicas`

    Điều chỉnh số lượng replica tối thiểu cần xác nhận (acknowledge) một lần ghi để một produce request được coi là thành công khi producer đã đặt `acks` thành `all` (hoặc `–1`).

- `unclean.leader.election.enable`

    Cho phép các replica được bầu làm leader ngay cả khi điều đó dẫn tới mất dữ liệu. Điều này hữu ích khi việc mất một phần dữ liệu là chấp nhận được, hoặc để bật trong thời gian ngắn nhằm gỡ kẹt cho một Kafka cluster khi không thể tránh khỏi việc mất dữ liệu không thể khôi phục.

- `max.connections`

    Số lượng kết nối tối đa được phép tới một broker tại bất kỳ thời điểm nào. Chúng ta cũng có thể dùng `max.connections.per.ip` và `max.connections.per.ip.overrides` để throttling tinh chỉnh hơn.

### Xem các cấu hình ghi đè (Describing Configuration Overrides)

Tất cả các cấu hình ghi đè có thể được liệt kê bằng công cụ `kafka-config.sh`. Điều này cho phép bạn kiểm tra cấu hình cụ thể của một topic, broker hoặc client. Tương tự các công cụ khác, việc này được thực hiện bằng lệnh `--describe`.

Trong ví dụ sau, chúng ta có thể lấy tất cả các cấu hình ghi đè cho topic tên "my-topic", và ta thấy rằng chỉ có thời gian retention:

```bash
# kafka-configs.sh --bootstrap-server localhost:9092
--describe --entity-type topics --entity-name my-topic
Configs for topics:my-topic are
retention.ms=3600000
#
```

> **Chỉ hiển thị các giá trị ghi đè của topic (Topic overrides only)**
>
> Phần mô tả cấu hình sẽ chỉ hiển thị các giá trị ghi đè — nó không bao gồm các cấu hình mặc định của cluster. Không có cách nào để khám phá động cấu hình của chính các broker. Điều này có nghĩa là khi dùng công cụ này để khám phá thiết lập của topic hoặc client trong tự động hóa, người dùng phải tự nắm được cấu hình mặc định của cluster một cách riêng biệt.

### Gỡ bỏ các cấu hình ghi đè (Removing Configuration Overrides)

Các cấu hình động có thể được gỡ bỏ hoàn toàn, khiến thực thể (entity) đó quay trở lại các giá trị mặc định của cluster. Để xóa một cấu hình ghi đè, hãy dùng lệnh `--alter` cùng với tham số `--delete-config`.

Ví dụ, xóa cấu hình ghi đè cho `retention.ms` của topic tên "my-topic":

```bash
# kafka-configs.sh --bootstrap-server localhost:9092
--alter --entity-type topics --entity-name my-topic
--delete-config retention.ms
Updated config for topic: "my-topic".
#
```

## Produce và consume (Producing and Consuming)

Trong khi làm việc với Kafka, bạn sẽ thường thấy cần phải produce hoặc consume thủ công một vài message mẫu để kiểm chứng xem điều gì đang diễn ra với các ứng dụng của mình. Hai tiện ích được cung cấp để hỗ trợ việc này là `kafka-console-consumer.sh` và `kafka-console-producer.sh`, đã được đề cập sơ lược ở Chương 2 để kiểm tra quá trình cài đặt của chúng ta. Các công cụ này là lớp bao (wrapper) quanh các thư viện Java client chính, cho phép bạn tương tác với các Kafka topic mà không cần phải viết cả một ứng dụng để làm việc đó.

> **Chuyển hướng output sang một ứng dụng khác (Piping output to another application)**
>
> Mặc dù có thể viết các ứng dụng bao quanh console consumer hoặc producer (ví dụ: để consume message rồi chuyển tiếp chúng sang một ứng dụng khác để xử lý), loại ứng dụng này khá mong manh và nên tránh. Rất khó để tương tác với console consumer theo cách không làm mất message. Tương tự, console producer không cho phép sử dụng tất cả các tính năng, và việc gửi byte một cách chính xác là điều phức tạp. Tốt nhất là dùng trực tiếp các thư viện Java client hoặc một thư viện client bên thứ ba cho các ngôn ngữ khác sử dụng trực tiếp giao thức Kafka.

### Console Producer

Công cụ `kakfa-console-producer.sh` có thể được dùng để ghi message vào một Kafka topic trong cluster của bạn. Mặc định, message được đọc theo từng dòng, với một ký tự tab phân tách key và value (nếu không có ký tự tab, key sẽ là null). Cũng giống như console consumer, producer đọc vào và produce các byte thô bằng serializer mặc định (chính là `DefaultEncoder`).

Console producer yêu cầu tối thiểu hai tham số được cung cấp để biết cần kết nối tới Kafka cluster nào và cần produce vào topic nào trong cluster đó. Tham số thứ nhất là chuỗi kết nối `--bootstrap-server` quen thuộc mà chúng ta vẫn thường dùng. Khi bạn đã produce xong, hãy gửi ký tự kết thúc file (end-of-file — EOF) để đóng client. Trong hầu hết các terminal thông dụng, việc này được thực hiện bằng tổ hợp Control-D.

Ở đây chúng ta có thể thấy ví dụ produce bốn message tới topic tên "my-topic":

```bash
# kafka-console-producer.sh --bootstrap-server localhost:9092 --topic my-topic
>Message 1
>Test Message 2
>Test Message 3
>Message 4
>^D
#
```

#### Sử dụng các tùy chọn cấu hình producer (Using producer configuration options)

Bạn cũng có thể truyền các tùy chọn cấu hình producer thông thường cho console producer. Việc này có thể được thực hiện theo hai cách, tùy thuộc vào số lượng tùy chọn bạn cần truyền và cách bạn muốn làm. Cách thứ nhất là cung cấp một file cấu hình producer bằng cách chỉ định `--producer.config <config-file>`, trong đó `<config-file>` là đường dẫn đầy đủ tới file chứa các tùy chọn cấu hình. Cách còn lại là chỉ định các tùy chọn ngay trên dòng lệnh với một hoặc nhiều tham số theo dạng `--producer-property <key>=<value>`, trong đó `<key>` là tên tùy chọn cấu hình và `<value>` là giá trị cần đặt. Cách này có thể hữu ích với các tùy chọn producer như cấu hình gom batch message (chẳng hạn `linger.ms` hoặc `batch.size`).

> **Các tùy chọn dòng lệnh dễ gây nhầm lẫn (Confusing command-line options)**
>
> Tùy chọn dòng lệnh `--property` có sẵn cho cả console producer lẫn console consumer, nhưng không nên nhầm lẫn nó với các tùy chọn `--producer-property` hoặc `--consumer-property` tương ứng. Tùy chọn `--property` chỉ được dùng để truyền cấu hình cho message formatter, chứ không phải cho chính client.

Console producer có nhiều tham số dòng lệnh có thể dùng với tùy chọn `--producer-property` để điều chỉnh hành vi của nó. Một số tùy chọn hữu ích hơn cả là:

- `--batch-size`

    Chỉ định số lượng message được gửi trong một batch đơn lẻ nếu chúng không được gửi đồng bộ.

- `--timeout`

    Nếu producer đang chạy ở chế độ bất đồng bộ, tùy chọn này quy định thời gian tối đa chờ đủ batch size trước khi produce, nhằm tránh phải chờ lâu trên các topic có lưu lượng produce thấp.

- `--compression-codec <string>`

    Chỉ định kiểu nén được dùng khi produce message. Các kiểu hợp lệ có thể là một trong các giá trị sau: `none`, `gzip`, `snappy`, `zstd`, hoặc `lz4`. Giá trị mặc định là `gzip`.

- `--sync`

    Produce message một cách đồng bộ, chờ mỗi message được xác nhận trước khi gửi message tiếp theo.

#### Các tùy chọn của trình đọc dòng (Line-reader options)

Class `kafka.tools.ConsoleProducer$LineMessageReader`, chịu trách nhiệm đọc standard input và tạo ra các producer record, cũng có một vài tùy chọn hữu ích có thể được truyền cho console producer bằng tùy chọn dòng lệnh `--property`:

- `ignore.error`

    Đặt thành `false` để ném ra một exception khi `parse.key` được đặt thành `true` mà không có ký tự phân tách key. Mặc định là `true`.

- `parse.key`

    Đặt thành `false` để luôn đặt key thành null. Mặc định là `true`.

- `key.separator`

    Chỉ định ký tự phân tách được dùng giữa key và value của message khi đọc. Mặc định là ký tự tab.

> **Thay đổi hành vi đọc dòng (Changing line-reading behavior)**
>
> Bạn có thể cung cấp cho Kafka class của riêng mình để tùy biến cách đọc dòng. Class mà bạn tạo phải kế thừa `kafka.common.MessageReader` và sẽ chịu trách nhiệm tạo ra `ProducerRecord`. Hãy chỉ định class của bạn trên dòng lệnh với tùy chọn `--line-reader`, và đảm bảo rằng file JAR chứa class đó nằm trong classpath. Giá trị mặc định là `kafka.tools.ConsoleProducer$LineMessageReader`.

Khi produce message, `LineMessageReader` sẽ tách dữ liệu đầu vào tại lần xuất hiện đầu tiên của `key.separator`. Nếu không còn ký tự nào sau đó, value của message sẽ rỗng. Nếu không có ký tự phân tách key nào trên dòng, hoặc nếu `parse.key` là false, thì key sẽ là null.

### Console Consumer

Công cụ `kafka-console-consumer.sh` cung cấp phương tiện để consume message từ một hoặc nhiều topic trong Kafka cluster của bạn. Các message được in ra standard output, phân tách bằng ký tự xuống dòng. Mặc định, nó xuất ra các byte thô trong message, không kèm key, không có định dạng nào (sử dụng `DefaultFormatter`). Tương tự như producer, có một vài tùy chọn cơ bản cần thiết để bắt đầu: chuỗi kết nối tới cluster, topic bạn muốn consume, và khoảng thời gian bạn muốn consume.

> **Kiểm tra phiên bản công cụ (Checking tool versions)**
>
> Việc dùng consumer có cùng phiên bản với Kafka cluster của bạn là rất quan trọng. Các console consumer cũ hơn có thể gây hư hại cho cluster do tương tác với cluster hoặc ZooKeeper theo những cách không đúng.

Cũng như trong các lệnh khác, chuỗi kết nối tới cluster sẽ là tùy chọn `--bootstrap-server`; tuy nhiên, bạn có thể chọn một trong hai tùy chọn để chỉ định các topic cần consume:

- `--topic`

    Chỉ định một topic đơn lẻ để consume.

- `--whitelist`

    Một biểu thức chính quy khớp với tất cả các topic cần consume (hãy nhớ escape biểu thức chính quy một cách đúng đắn để nó không bị shell xử lý sai).

Chỉ nên chọn và dùng một trong hai tùy chọn trên. Khi console consumer đã khởi động, công cụ sẽ tiếp tục cố gắng consume cho tới khi lệnh thoát của shell được đưa ra (trong trường hợp này là Ctrl-C). Sau đây là ví dụ consume tất cả các topic trong cluster của chúng ta khớp với tiền tố `my` (trong ví dụ này chỉ có một topic duy nhất, đó là "my-topic"):

```bash
# kafka-console-consumer.sh --bootstrap-server localhost:9092
--whitelist 'my.*' --from-beginning
Message 1
Test Message 2
Test Message 3
Message 4
^C
#
```

#### Sử dụng các tùy chọn cấu hình consumer (Using consumer configuration options)

Ngoài các tùy chọn dòng lệnh cơ bản này, bạn cũng có thể truyền các tùy chọn cấu hình consumer thông thường cho console consumer. Tương tự công cụ `kafka-console-producer.sh`, việc này có thể được thực hiện theo hai cách, tùy thuộc vào số lượng tùy chọn bạn cần truyền và cách bạn muốn làm. Cách thứ nhất là cung cấp một file cấu hình consumer bằng cách chỉ định `--consumer.config <config-file>`, trong đó `<config-file>` là đường dẫn đầy đủ tới file chứa các tùy chọn cấu hình. Cách còn lại là chỉ định các tùy chọn trên dòng lệnh với một hoặc nhiều tham số theo dạng `--consumer-property <key>=<value>`, trong đó `<key>` là tên tùy chọn cấu hình và `<value>` là giá trị cần đặt.

Có một vài tùy chọn khác thường được dùng cho console consumer mà bạn nên biết và làm quen:

- `--formatter <classname>`

    Chỉ định class message formatter được dùng để giải mã các message. Giá trị này mặc định là `kafka.tools.DefaultMessageFormatter`.

- `--from-beginning`

    Consume message trong (các) topic được chỉ định bắt đầu từ offset cũ nhất. Nếu không, việc consume sẽ bắt đầu từ offset mới nhất.

- `--max-messages <int>`

    Số lượng message tối đa được consume trước khi thoát.

- `--partition <int>`

    Chỉ consume từ partition có ID được đưa ra.

- `--offset`

    ID offset để bắt đầu consume, nếu được cung cấp (`<int>`). Các tùy chọn hợp lệ khác là `earliest`, sẽ consume từ đầu, và `latest`, sẽ bắt đầu consume từ offset mới nhất.

- `--skip-message-on-error`

    Bỏ qua một message nếu có lỗi khi xử lý thay vì dừng hẳn. Hữu ích khi debug.

#### Các tùy chọn của message formatter (Message formatter options)

Có ba message formatter khả dụng để sử dụng ngoài formatter mặc định:

- `kafka.tools.LoggingMessageFormatter`

    Xuất message thông qua logger, thay vì standard out. Các message được in ở mức INFO và bao gồm timestamp, key và value.

- `kafka.tools.ChecksumMessageFormatter`

    Chỉ in ra checksum của message.

- `kafka.tools.NoOpMessageFormatter`

    Consume message nhưng hoàn toàn không xuất chúng ra.

Sau đây là ví dụ consume chính những message như trước nhưng dùng `kafka.tools.ChecksumMessageFormatter` thay cho formatter mặc định:

```bash
# kafka-console-consumer.sh --bootstrap-server localhost:9092
--whitelist 'my.*' --from-beginning
--formatter kafka.tools.ChecksumMessageFormatter
checksum:0
checksum:0
checksum:0
checksum:0
#
```

`kafka.tools.DefaultMessageFormatter` cũng có một vài tùy chọn hữu ích có thể được truyền bằng tùy chọn dòng lệnh `--property`, được trình bày trong Bảng 12-4.

**Bảng 12-4. Các thuộc tính của message formatter**

| Thuộc tính | Mô tả |
|---|---|
| `print.timestamp` | Đặt thành `true` để hiển thị timestamp của mỗi message (nếu có). |
| `print.key` | Đặt thành `true` để hiển thị key của message bên cạnh value. |
| `print.offset` | Đặt thành `true` để hiển thị offset của message bên cạnh value. |
| `print.partition` | Đặt thành `true` để hiển thị topic partition mà message được consume từ đó. |
| `key.separator` | Chỉ định ký tự phân tách được dùng giữa key và value của message khi in ra. |
| `line.separator` | Chỉ định ký tự phân tách được dùng giữa các message. |
| `key.deserializer` | Cung cấp tên một class được dùng để deserialize key của message trước khi in ra. |
| `value.deserializer` | Cung cấp tên một class được dùng để deserialize value của message trước khi in ra. |

Các class deserializer phải hiện thực `org.apache.kafka.common.serialization.Deserializer`, và console consumer sẽ gọi phương thức `toString` trên chúng để lấy nội dung hiển thị. Thông thường, bạn sẽ hiện thực các deserializer này dưới dạng một class Java rồi đưa vào classpath của console consumer bằng cách đặt biến môi trường `CLASSPATH` trước khi thực thi `kafka_console_consumer.sh`.

#### Consume các topic offset (Consuming the offsets topics)

Đôi khi việc xem xem những offset nào đang được commit cho các consumer group của cluster là rất hữu ích. Bạn có thể muốn biết một group cụ thể có commit offset hay không, hoặc offset được commit thường xuyên đến mức nào. Việc này có thể được thực hiện bằng cách dùng console consumer để consume topic nội bộ đặc biệt tên là `__consumer_offsets`. Tất cả các offset của consumer đều được ghi dưới dạng message vào topic này. Để giải mã các message trong topic này, bạn phải dùng class formatter `kafka.coordinator.group.GroupMetadataManager$OffsetsMessageFormatter`.

Kết hợp tất cả những gì đã học, sau đây là ví dụ consume message cũ nhất từ topic `__consumer_offsets`:

```bash
# kafka-console-consumer.sh --bootstrap-server localhost:9092
--topic __consumer_offsets --from-beginning --max-messages 1
--formatter "kafka.coordinator.group.GroupMetadataManager\$OffsetsMessageFormatter"
--consumer-property exclude.internal.topics=false
[my-group-name,my-topic,0]::[OffsetMetadata[1,NO_METADATA]
CommitTime 1623034799990 ExpirationTime 1623639599990]
Processed a total of 1 messages
#
```

## Quản lý partition (Partition Management)

Một bản cài đặt Kafka mặc định cũng chứa một vài script phục vụ việc quản lý partition. Một trong các công cụ này cho phép bầu lại (reelection) các replica leader; một công cụ khác là tiện ích ở mức thấp để gán partition cho các broker. Kết hợp lại, các công cụ này có thể hỗ trợ trong những tình huống cần đến cách tiếp cận thủ công, trực tiếp hơn để cân bằng lưu lượng message trong một cluster gồm nhiều Kafka broker.

### Bầu chọn replica ưu tiên (Preferred Replica Election)

Như đã mô tả ở Chương 7, các partition có thể có nhiều replica để đảm bảo độ tin cậy. Điều quan trọng cần hiểu là chỉ một trong các replica này có thể là leader của partition tại bất kỳ thời điểm nào, và mọi thao tác produce và consume đều diễn ra trên broker đó. Việc duy trì sự cân bằng về việc replica của partition nào giữ leadership trên broker nào là cần thiết để đảm bảo tải được phân bổ đều trên toàn bộ Kafka cluster.

Leadership được định nghĩa trong Kafka là in-sync replica đầu tiên trong danh sách replica. Tuy nhiên, khi một broker bị dừng hoặc mất kết nối với phần còn lại của cluster, leadership sẽ được chuyển sang một in-sync replica khác, và replica ban đầu sẽ không tự động lấy lại leadership của bất kỳ partition nào. Điều này có thể gây ra tình trạng mất cân bằng nghiêm trọng sau một đợt triển khai trên toàn cluster nếu việc cân bằng leader tự động không được bật. Vì vậy, khuyến nghị là đảm bảo thiết lập này được bật, hoặc sử dụng các công cụ mã nguồn mở khác như Cruise Control để đảm bảo duy trì được sự cân bằng tốt tại mọi thời điểm.

Nếu bạn thấy Kafka cluster của mình bị mất cân bằng, có một quy trình nhẹ nhàng và nhìn chung không gây ảnh hưởng, gọi là bầu chọn leader ưu tiên (preferred leader election), có thể được thực hiện. Nó yêu cầu cluster controller chọn ra leader lý tưởng cho các partition. Client có thể theo dõi các thay đổi về leadership một cách tự động, vì vậy chúng sẽ có thể chuyển sang broker mới trong cluster nơi leadership được chuyển tới. Thao tác này có thể được kích hoạt thủ công bằng tiện ích `kafka-leader-election.sh`. Một phiên bản cũ hơn của công cụ này tên là `kafka-preferred-replica-election.sh` cũng có sẵn nhưng đã bị deprecated để nhường chỗ cho công cụ mới, vốn cho phép tùy biến nhiều hơn, chẳng hạn như chỉ định xem chúng ta muốn kiểu bầu chọn "preferred" hay "unclean".

Ví dụ, việc khởi động một cuộc bầu chọn leader ưu tiên cho tất cả các topic trong một cluster có thể được thực thi bằng lệnh sau:

```bash
# kafka-leader-election.sh --bootstrap-server localhost:9092
--election-type PREFERRED --all-topic-partitions
#
```

Bạn cũng có thể khởi động các cuộc bầu chọn trên những partition hoặc topic cụ thể. Việc này có thể được thực hiện bằng cách truyền vào tên topic với tùy chọn `--topic` và một partition với tùy chọn `--partition` một cách trực tiếp. Bạn cũng có thể truyền vào một danh sách gồm nhiều partition cần được bầu chọn. Việc này được thực hiện bằng cách cấu hình một file JSON mà chúng ta sẽ gọi là *partitions.json*:

```json
{
      "partitions": [
           {
                 "partition": 1,
                 "topic": "my-topic"
           },
           {
                 "partition": 2,
                 "topic": "foo"
           }
      ]
}
```

Trong ví dụ này, chúng ta sẽ khởi động một cuộc bầu chọn replica ưu tiên với danh sách partition được chỉ định trong file có tên *partitions.json*:

```bash
# kafka-leader-election.sh --bootstrap-server localhost:9092
--election-type PREFERRED --path-to-json-file partitions.json
#
```

### Thay đổi replica của một partition (Changing a Partition's Replicas)

Đôi khi có thể cần phải thay đổi thủ công việc gán replica cho một partition. Một số ví dụ về khi nào điều này có thể cần thiết là:

- Có tải không đồng đều trên các broker mà cơ chế phân phối leader tự động không xử lý đúng.
- Nếu một broker bị đưa offline và partition bị thiếu bản sao (under replicated).
- Nếu một broker mới được thêm vào và chúng ta muốn cân bằng các partition mới trên broker đó nhanh hơn.
- Bạn muốn điều chỉnh replication factor của một topic.

Công cụ `kafka-reassign-partitions.sh` có thể được dùng để thực hiện thao tác này. Đây là một quy trình gồm nhiều bước: sinh ra một tập hợp các bước di chuyển (move set) rồi thực thi trên đề xuất di chuyển đó. Trước tiên, chúng ta muốn dùng một danh sách broker và một danh sách topic để sinh ra đề xuất cho tập hợp các bước di chuyển. Việc này sẽ đòi hỏi tạo ra một file JSON chứa danh sách các topic cần cung cấp. Bước tiếp theo là thực thi các bước di chuyển đã được sinh ra bởi đề xuất trước đó. Cuối cùng, công cụ có thể được dùng với danh sách đã sinh ra để theo dõi và kiểm chứng tiến độ hoặc việc hoàn tất của các thao tác gán lại partition (partition reassignment).

Hãy dựng lên một tình huống giả định trong đó bạn có một Kafka cluster gồm bốn broker. Gần đây bạn đã thêm hai broker mới, nâng tổng số lên sáu, và bạn muốn chuyển hai topic của mình sang broker 5 và 6.

Để sinh ra một tập hợp các bước di chuyển partition, trước tiên bạn phải tạo một file chứa một đối tượng JSON liệt kê các topic. Đối tượng JSON được định dạng như sau (số hiệu phiên bản hiện tại luôn là 1):

```json
{
      "topics": [
           {
                 "topic": "foo1"
           },
           {
                 "topic": "foo2"
           }
        ],
        "version": 1
}
```

Khi đã định nghĩa xong file JSON, chúng ta có thể dùng nó để sinh ra một tập hợp các bước di chuyển partition nhằm chuyển các topic được liệt kê trong file *topics.json* sang các broker có ID là 5 và 6:

```bash
# kafka-reassign-partitions.sh --bootstrap-server localhost:9092
--topics-to-move-json-file topics.json
--broker-list 5,6 --generate
  {"version":1,
    "partitions":[{"topic":"foo1","partition":2,"replicas":[1,2]},
                      {"topic":"foo1","partition":0,"replicas":[3,4]},
                      {"topic":"foo2","partition":2,"replicas":[1,2]},
                      {"topic":"foo2","partition":0,"replicas":[3,4]},
                      {"topic":"foo1","partition":1,"replicas":[2,3]},
                      {"topic":"foo2","partition":1,"replicas":[2,3]}]
    }


    Proposed partition reassignment configuration


    {"version":1,
    "partitions":[{"topic":"foo1","partition":2,"replicas":[5,6]},
                      {"topic":"foo1","partition":0,"replicas":[5,6]},
                      {"topic":"foo2","partition":2,"replicas":[5,6]},
                      {"topic":"foo2","partition":0,"replicas":[5,6]},
                      {"topic":"foo1","partition":1,"replicas":[5,6]},
                      {"topic":"foo2","partition":1,"replicas":[5,6]}]
    }
#
```

Kết quả đề xuất được xuất ra ở đây đã được định dạng đúng, từ đó chúng ta có thể lưu thành hai file JSON mới mà ta sẽ gọi là *revert-reassignment.json* và *expand-cluster-reassignment.json*. File thứ nhất có thể được dùng để chuyển các partition trở lại vị trí ban đầu nếu vì lý do nào đó bạn cần rollback. File thứ hai có thể được dùng cho bước tiếp theo, vì đây mới chỉ là một đề xuất và chưa thực thi bất cứ điều gì. Bạn sẽ để ý trong kết quả xuất ra rằng leadership không được cân bằng tốt, vì đề xuất này sẽ dẫn tới việc toàn bộ leadership chuyển sang broker 5. Chúng ta sẽ tạm bỏ qua điều này và giả định rằng tính năng cân bằng leadership tự động của cluster đã được bật, tính năng này sẽ giúp phân phối lại leadership về sau. Cần lưu ý rằng bước đầu tiên có thể được bỏ qua nếu bạn biết chính xác mình muốn chuyển các partition đi đâu và bạn tự soạn thủ công file JSON để di chuyển partition.

Để thực thi đề xuất gán lại partition từ file *expand-cluster-reassignment.json*, hãy chạy lệnh sau:

```bash
# kafka-reassign-partitions.sh --bootstrap-server localhost:9092
--reassignment-json-file expand-cluster-reassignment.json
--execute
    Current partition replica assignment


    {"version":1,
    "partitions":[{"topic":"foo1","partition":2,"replicas":[1,2]},
                      {"topic":"foo1","partition":0,"replicas":[3,4]},
                      {"topic":"foo2","partition":2,"replicas":[1,2]},
                      {"topic":"foo2","partition":0,"replicas":[3,4]},
                      {"topic":"foo1","partition":1,"replicas":[2,3]},
                     {"topic":"foo2","partition":1,"replicas":[2,3]}]
    }


    Save this to use as the --reassignment-json-file option during rollback
    Successfully started reassignment of partitions
    {"version":1,
    "partitions":[{"topic":"foo1","partition":2,"replicas":[5,6]},
                     {"topic":"foo1","partition":0,"replicas":[5,6]},
                     {"topic":"foo2","partition":2,"replicas":[5,6]},
                     {"topic":"foo2","partition":0,"replicas":[5,6]},
                     {"topic":"foo1","partition":1,"replicas":[5,6]},
                     {"topic":"foo2","partition":1,"replicas":[5,6]}]
    }
#
```

Lệnh này sẽ bắt đầu việc gán lại các replica của partition được chỉ định sang các broker mới. Kết quả xuất ra giống với phần kiểm chứng đề xuất đã sinh ra trước đó. Cluster controller thực hiện thao tác gán lại này bằng cách thêm các replica mới vào danh sách replica của mỗi partition, điều này sẽ tạm thời làm tăng replication factor của các topic đó. Các replica mới sau đó sẽ sao chép toàn bộ message hiện có của mỗi partition từ leader hiện tại. Tùy thuộc vào kích thước của các partition trên đĩa, việc này có thể mất một khoảng thời gian đáng kể vì dữ liệu được sao chép qua mạng tới các replica mới. Khi việc replication hoàn tất, controller sẽ loại bỏ các replica cũ khỏi danh sách replica bằng cách giảm replication factor về kích thước ban đầu với các replica cũ đã bị loại bỏ.

Sau đây là một vài tính năng hữu ích khác của lệnh này mà bạn có thể tận dụng:

- `--additional`

    Tùy chọn này sẽ cho phép bạn bổ sung thêm vào các thao tác gán lại đang tồn tại để chúng có thể tiếp tục được thực hiện mà không bị gián đoạn và không cần phải chờ đến khi các bước di chuyển ban đầu hoàn tất mới bắt đầu được một lô mới.

- `--disable-rack-aware`

    Sẽ có những lúc mà, do các thiết lập nhận biết rack (rack awareness), trạng thái cuối cùng của một đề xuất là không thể đạt được. Điều này có thể được ghi đè bằng lệnh này nếu cần thiết.

- `--throttle`

    Giá trị này có đơn vị là byte/giây. Việc gán lại partition có ảnh hưởng lớn tới hiệu năng của cluster, vì chúng sẽ gây ra thay đổi trong tính nhất quán của memory page cache và sử dụng I/O mạng lẫn đĩa. Việc throttling quá trình di chuyển partition có thể hữu ích để ngăn chặn vấn đề này. Tùy chọn này có thể được kết hợp với cờ `--additional` để throttling một quá trình gán lại đã bắt đầu mà có thể đang gây ra vấn đề.

> **Cải thiện việc sử dụng mạng khi gán lại replica (Improving network utilization when reassigning replicas)**
>
> Khi loại bỏ nhiều partition khỏi một broker đơn lẻ, chẳng hạn khi broker đó đang được gỡ khỏi cluster, có thể sẽ hữu ích nếu trước hết loại bỏ toàn bộ leadership khỏi broker đó. Việc này có thể được thực hiện bằng cách chuyển leadership ra khỏi broker một cách thủ công; tuy nhiên, dùng bộ công cụ nói trên để làm việc này thì rất vất vả. Các công cụ mã nguồn mở khác như Cruise Control có sẵn những tính năng như "demotion" (hạ cấp) broker, giúp chuyển leadership ra khỏi một broker một cách an toàn và có lẽ là cách đơn giản nhất để làm điều này.
>
> Tuy nhiên, nếu bạn không có quyền truy cập vào những công cụ như vậy, chỉ cần khởi động lại một broker là đủ. Khi một broker đang chuẩn bị tắt, toàn bộ leadership của các partition trên broker cụ thể đó sẽ chuyển sang các broker khác trong cluster. Điều này có thể cải thiện đáng kể hiệu năng của các thao tác gán lại và giảm ảnh hưởng lên cluster, vì lưu lượng replication sẽ được phân phối tới nhiều broker. Tuy nhiên, nếu việc gán lại leader tự động được bật sau khi broker được khởi động lại, leadership có thể sẽ quay trở lại broker này, nên có thể sẽ có lợi nếu tạm thời tắt tính năng đó.

Để kiểm tra tiến độ của các bước di chuyển partition, công cụ này có thể được dùng để xác minh trạng thái của thao tác gán lại. Nó sẽ hiển thị những thao tác gán lại nào đang diễn ra, những thao tác nào đã hoàn tất, và (nếu có lỗi) những thao tác nào đã thất bại. Để làm điều này, bạn phải có file chứa đối tượng JSON đã được dùng trong bước execute.

Sau đây là ví dụ về kết quả có thể có khi dùng tùy chọn `--verify` trong lúc chạy thao tác gán lại partition ở trên từ file *expand-cluster-reassignment.json*:

```bash
# kafka-reassign-partitions.sh --bootstrap-server localhost:9092
--reassignment-json-file expand-cluster-reassignment.json
--verify
Status of partition reassignment:
  Status of partition reassignment:
    Reassignment of partition [foo1,0] completed successfully
    Reassignment of partition [foo1,1] is in progress
    Reassignment of partition [foo1,2] is in progress
    Reassignment of partition [foo2,0] completed successfully
    Reassignment of partition [foo2,1] completed successfully
    Reassignment of partition [foo2,2] completed successfully
#
```

#### Thay đổi replication factor (Changing the replication factor)

Công cụ `kafka-reassign-partitions.sh` cũng có thể được dùng để tăng hoặc giảm replication factor (RF) cho một partition. Điều này có thể cần thiết trong các tình huống mà partition được tạo với RF sai, bạn muốn tăng mức dự phòng khi mở rộng cluster, hoặc bạn muốn giảm mức dự phòng để tiết kiệm chi phí. Một ví dụ rõ ràng là nếu thiết lập RF mặc định của cluster được điều chỉnh, các topic hiện có sẽ không tự động được tăng theo. Công cụ này có thể được dùng để tăng RF trên các partition hiện có.

Ví dụ, nếu chúng ta muốn tăng topic "foo1" từ ví dụ trước từ RF = 2 lên RF = 3, thì chúng ta có thể soạn một file JSON tương tự như đề xuất thực thi mà ta đã dùng trước đó, ngoại trừ việc ta sẽ thêm một broker ID nữa vào tập replica. Chẳng hạn, chúng ta có thể tạo một file JSON tên là *increase-foo1-RF.json* trong đó ta thêm broker 4 vào tập hợp 5,6 đã có sẵn:

```json
{
    {"version":1,
    "partitions":[{"topic":"foo1","partition":1,"replicas":[5,6,4]},
                  {"topic":"foo1","partition":2,"replicas":[5,6,4]},
                  {"topic":"foo1","partition":3,"replicas":[5,6,4]},
   }
}
```

Sau đó chúng ta sẽ dùng các lệnh đã trình bày ở trên để thực thi đề xuất này. Khi nó hoàn tất, chúng ta có thể kiểm chứng rằng RF đã được tăng bằng cách dùng cờ `--verify` hoặc dùng script `kafka-topics.sh` để mô tả topic:

```bash
# kafka-topics.sh --bootstrap-server localhost:9092 --topic foo1 --describe
      Topic:foo1     PartitionCount:3                ReplicationFactor:3       Configs:
          Topic: foo1 Partition: 0        Leader: 5             Replicas: 5,6,4 Isr: 5,6,4
          Topic: foo1 Partition: 1        Leader: 5             Replicas: 5,6,4 Isr: 5,6,4
          Topic: foo1 Partition: 2        Leader: 5             Replicas: 5,6,4 Isr: 5,6,4
#
```

#### Hủy các thao tác gán lại replica (Canceling replica reassignments)

Trước đây, việc hủy một thao tác gán lại replica là một quy trình nguy hiểm, đòi hỏi phải can thiệp thủ công thiếu an toàn vào các node ZooKeeper (hay znode) bằng cách xóa znode `/admin/reassign_partitions`. May mắn thay, điều đó không còn đúng nữa. Script `kafka-reassign-partitions.sh` (cũng như `AdminClient` mà nó bao bọc) hiện đã hỗ trợ tùy chọn `--cancel`, tùy chọn này sẽ hủy các thao tác gán lại đang diễn ra trong một cluster. Khi dừng một quá trình di chuyển partition đang diễn ra, lệnh `--cancel` được thiết kế để khôi phục tập replica về trạng thái trước khi thao tác gán lại được khởi tạo. Vì vậy, nếu các replica đang bị loại bỏ khỏi một broker đã chết hoặc một broker đang quá tải, việc này có thể khiến cluster rơi vào trạng thái không mong muốn. Cũng không có gì đảm bảo rằng tập replica được khôi phục sẽ có cùng thứ tự như trước đó.

### Kết xuất các log segment (Dumping Log Segments)

Đôi khi bạn có thể cần đọc nội dung cụ thể của một message, có lẽ vì bạn đã gặp phải một message "poison pill" trong topic của mình vốn bị hỏng và consumer của bạn không thể xử lý được. Công cụ `kafka-dump-log.sh` được cung cấp để giải mã các log segment của một partition. Nó sẽ cho phép bạn xem từng message riêng lẻ mà không cần phải consume và giải mã chúng. Công cụ này nhận một danh sách các file log segment phân tách bằng dấu phẩy làm tham số và có thể in ra hoặc thông tin tóm tắt về message, hoặc dữ liệu chi tiết của message.

Trong ví dụ này, chúng ta sẽ kết xuất log từ một topic mẫu, "my-topic", là một topic mới chỉ có bốn message trong đó. Trước tiên, chúng ta sẽ chỉ đơn giản giải mã file log segment tên *00000000000000000000.log* và lấy về thông tin metadata cơ bản về mỗi message mà không thực sự in ra nội dung message. Trong bản cài đặt Kafka ví dụ của chúng ta, thư mục dữ liệu Kafka được thiết lập tại */tmp/kafka-logs*. Vì vậy, thư mục để tìm các log segment sẽ là `/tmp/kafka-logs/<topic-name>-<partition>`, trong trường hợp này là */tmp/kafka-logs/my-topic-0/*:

```bash
# kafka-dump-log.sh --files /tmp/kafka-logs/my-topic-0/00000000000000000000.log
Dumping /tmp/kafka-logs/my-topic-0/00000000000000000000.log
Starting offset: 0
baseOffset: 0 lastOffset: 0 count: 1 baseSequence: -1 lastSequence: -1
      producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
      isTransactional: false isControl: false position: 0
      CreateTime: 1623034799990 size: 77 magic: 2
      compresscodec: NONE crc: 1773642166 isvalid: true
baseOffset: 1 lastOffset: 1 count: 1 baseSequence: -1 lastSequence: -1
  producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 77
    CreateTime: 1623034803631 size: 82 magic: 2
    compresscodec: NONE crc: 1638234280 isvalid: true
baseOffset: 2 lastOffset: 2 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 159
    CreateTime: 1623034808233 size: 82 magic: 2
    compresscodec: NONE crc: 4143814684 isvalid: true
baseOffset: 3 lastOffset: 3 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 241
    CreateTime: 1623034811837 size: 77 magic: 2
    compresscodec: NONE crc: 3096928182 isvalid: true
#
```

Trong ví dụ tiếp theo, chúng ta thêm tùy chọn `--print-data-log`, tùy chọn này sẽ cung cấp cho chúng ta thông tin payload thực tế và nhiều hơn thế:

```bash
# kafka-dump-log.sh --files /tmp/kafka-logs/my-topic-0/00000000000000000000.log --print-
Dumping /tmp/kafka-logs/my-topic-0/00000000000000000000.log
Starting offset: 0
baseOffset: 0 lastOffset: 0 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false        isControl: false position: 0
    CreateTime: 1623034799990 size: 77 magic: 2
    compresscodec: NONE crc: 1773642166 isvalid: true
| offset: 0 CreateTime: 1623034799990 keysize: -1 valuesize: 9
    sequence: -1 headerKeys: [] payload: Message 1
baseOffset: 1 lastOffset: 1 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 77
    CreateTime: 1623034803631 size: 82 magic: 2
  compresscodec: NONE crc: 1638234280 isvalid: true
| offset: 1 CreateTime: 1623034803631 keysize: -1 valuesize: 14
     sequence: -1 headerKeys: [] payload: Test Message 2
baseOffset: 2 lastOffset: 2 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 159
    CreateTime: 1623034808233 size: 82 magic: 2
    compresscodec: NONE crc: 4143814684 isvalid: true
| offset: 2 CreateTime: 1623034808233 keysize: -1 valuesize: 14
     sequence: -1 headerKeys: [] payload: Test Message 3
baseOffset: 3 lastOffset: 3 count: 1 baseSequence: -1 lastSequence: -1
    producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0
    isTransactional: false isControl: false position: 241
    CreateTime: 1623034811837 size: 77 magic: 2
    compresscodec: NONE crc: 3096928182 isvalid: true
| offset: 3 CreateTime: 1623034811837 keysize: -1 valuesize: 9
     sequence: -1 headerKeys: [] payload: Message 4
#
```

Công cụ này còn chứa một vài tùy chọn hữu ích khác, chẳng hạn như kiểm tra tính hợp lệ của file index đi kèm với một log segment. Index được dùng để tìm message bên trong một log segment, và nếu bị hỏng sẽ gây ra lỗi khi consume. Việc kiểm tra được thực hiện mỗi khi một broker khởi động trong trạng thái không sạch (unclean state — tức là nó đã không được dừng một cách bình thường), nhưng nó cũng có thể được thực hiện thủ công. Có hai tùy chọn để kiểm tra index, tùy thuộc vào mức độ kiểm tra bạn muốn thực hiện. Tùy chọn `--index-sanity-check` sẽ chỉ kiểm tra rằng index đang ở trạng thái có thể sử dụng được, trong khi `--verify-index-only` sẽ kiểm tra xem có sự không khớp nào trong index hay không mà không in ra tất cả các mục của index. Một tùy chọn hữu ích khác là `--value-decoder-class`, cho phép các message đã được serialize được deserialize bằng cách truyền vào một decoder.

### Kiểm chứng replica (Replica Verification)

Việc replicate partition hoạt động tương tự như một Kafka consumer client thông thường: broker follower bắt đầu replicate từ offset cũ nhất và định kỳ ghi checkpoint offset hiện tại xuống đĩa. Khi việc replication dừng lại rồi khởi động lại, nó sẽ tiếp tục từ checkpoint cuối cùng. Có khả năng các log segment đã được replicate trước đó bị xóa khỏi một broker, và trong trường hợp này follower sẽ không lấp đầy những khoảng trống đó.

Để kiểm chứng rằng các replica của các partition thuộc một topic là giống nhau trên toàn cluster, bạn có thể dùng công cụ `kafka-replica-verification.sh` để xác minh. Công cụ này sẽ lấy message từ tất cả các replica của một tập topic partition cho trước, kiểm tra rằng tất cả message đều tồn tại trên mọi replica, và in ra độ lag tối đa cho các partition đó. Quá trình này sẽ chạy liên tục theo vòng lặp cho tới khi bị hủy. Để làm điều này, bạn phải cung cấp một danh sách rõ ràng các broker cần kết nối, phân tách bằng dấu phẩy. Mặc định, tất cả các topic đều được kiểm chứng; tuy nhiên, bạn cũng có thể cung cấp cho công cụ một biểu thức chính quy khớp với các topic mà bạn muốn kiểm chứng.

> **Thận trọng: sẽ có tác động lên cluster (Caution: cluster impact ahead)**
>
> Công cụ kiểm chứng replica sẽ gây tác động lên cluster của bạn tương tự như việc gán lại partition, vì nó phải đọc toàn bộ message từ offset cũ nhất để kiểm chứng replica. Ngoài ra, nó đọc từ tất cả các replica của một partition một cách song song, nên cần được sử dụng một cách thận trọng.

Ví dụ, kiểm chứng các replica cho những topic bắt đầu bằng `my` trên các Kafka broker 1 và 2, vốn chứa partition 0 của "my-topic":

```bash
# kafka-replica-verification.sh --broker-list kafka.host1.domain.com:9092,kafka.host2.dom
--topic-white-list 'my.*'

2021-06-07 03:28:21,829: verification process is started.
2021-06-07 03:28:51,949: max lag is 0 for partition my-topic-0 at offset 4 among 1 parti
2021-06-07 03:29:22,039: max lag is 0 for partition my-topic-0 at offset 4 among 1 parti
...
#
```

## Các công cụ khác (Other Tools)

Bản phân phối Kafka còn bao gồm một số công cụ khác không được đề cập sâu trong cuốn sách này nhưng có thể hữu ích cho việc quản trị Kafka cluster của bạn trong những tình huống sử dụng cụ thể. Thông tin thêm về chúng có thể tìm thấy trên website của Apache Kafka:

- Client ACL

    Một công cụ dòng lệnh, `kafka-acls.sh`, được cung cấp để tương tác với các kiểm soát truy cập (access control) dành cho Kafka client. Công cụ này bao gồm đầy đủ các tính năng cho các thuộc tính authorizer, thiết lập theo nguyên tắc từ chối (deny) hoặc cho phép (allow), giới hạn ở mức cluster hoặc topic, cấu hình file TLS cho ZooKeeper, và nhiều hơn nữa.

- MirrorMaker nhẹ (Lightweight MirrorMaker)

    Một script nhẹ `kafka-mirror-maker.sh` có sẵn để mirror dữ liệu. Cái nhìn sâu hơn về replication có thể tìm thấy ở Chương 10.

- Công cụ kiểm thử (Testing tools)

    Có một số script khác được dùng để kiểm thử Kafka hoặc hỗ trợ thực hiện nâng cấp các tính năng. `kafka-broker-api-versions.sh` giúp dễ dàng xác định các phiên bản khác nhau của những thành phần API có thể sử dụng khi nâng cấp từ phiên bản Kafka này lên phiên bản khác và kiểm tra các vấn đề về tương thích. Có các script kiểm thử hiệu năng cho producer và consumer. Cũng có một số script giúp quản trị ZooKeeper. Ngoài ra còn có `trogdor.sh`, là một framework kiểm thử được thiết kế để chạy các benchmark và các workload khác nhằm cố gắng kiểm thử áp lực (stress test) hệ thống.

## Các thao tác không an toàn (Unsafe Operations)

Có một số tác vụ quản trị về mặt kỹ thuật là có thể thực hiện được nhưng không nên thử ngoại trừ trong những tình huống cực đoan nhất. Thường thì đó là khi bạn đang chẩn đoán một vấn đề và đã hết cách, hoặc bạn đã phát hiện một bug cụ thể mà bạn cần né tránh tạm thời. Những tác vụ này thường không có tài liệu, không được hỗ trợ, và mang lại một mức độ rủi ro nhất định cho ứng dụng của bạn.

Một số tác vụ phổ biến hơn trong nhóm này được ghi lại ở đây để trong tình huống khẩn cấp, sẽ có một phương án tiềm năng để khôi phục. Việc sử dụng chúng không được khuyến nghị trong điều kiện vận hành cluster bình thường và cần được cân nhắc cẩn thận trước khi thực thi.

> **Nguy hiểm: vùng đất của rồng (Danger: here be dragons)**
>
> Các thao tác trong mục này thường liên quan tới việc làm việc trực tiếp với metadata của cluster được lưu trong ZooKeeper. Đây có thể là một thao tác rất nguy hiểm, nên bạn phải hết sức cẩn thận để không sửa đổi trực tiếp thông tin trong ZooKeeper, ngoại trừ những trường hợp được nêu rõ.

### Di chuyển cluster controller (Moving the Cluster Controller)

Mỗi Kafka cluster có một broker duy nhất được chỉ định làm controller. Controller có một thread đặc biệt chịu trách nhiệm giám sát các hoạt động của cluster bên cạnh công việc broker thông thường. Bình thường, việc bầu chọn controller được thực hiện tự động thông qua việc theo dõi các znode tạm thời (ephemeral) của ZooKeeper. Khi một controller tắt hoặc trở nên không khả dụng, các broker khác sẽ tự đề cử chính mình sớm nhất có thể, vì một khi controller tắt, znode sẽ bị xóa.

Đôi khi, khi xử lý sự cố cho một cluster hoặc broker đang hoạt động bất thường, có thể sẽ hữu ích nếu buộc chuyển controller sang một broker khác mà không cần tắt host. Một ví dụ như vậy là khi controller đã gặp một exception hoặc vấn đề nào đó khiến nó vẫn đang chạy nhưng không còn hoạt động đúng chức năng. Việc di chuyển controller trong những tình huống này thường không có rủi ro cao, nhưng vì đây không phải là tác vụ thông thường nên không nên thực hiện thường xuyên.

Để buộc di chuyển một controller, việc xóa thủ công znode của ZooKeeper tại `/admin/controller` sẽ khiến controller hiện tại từ nhiệm, và cluster sẽ chọn ngẫu nhiên một controller mới. Hiện tại không có cách nào để chỉ định một broker cụ thể làm controller trong Apache Kafka.

### Gỡ bỏ các topic đang chờ xóa (Removing Topics to Be Deleted)

Khi cố gắng xóa một topic trong Kafka, một node ZooKeeper yêu cầu việc xóa sẽ được tạo ra. Khi mọi replica hoàn tất việc xóa topic và xác nhận rằng việc xóa đã hoàn thành, znode sẽ được gỡ bỏ. Trong điều kiện bình thường, việc này được cluster thực thi rất nhanh chóng. Tuy nhiên, đôi khi mọi thứ có thể trục trặc với quy trình này. Sau đây là một số tình huống trong đó một yêu cầu xóa có thể bị kẹt:

1. Bên gửi yêu cầu không có cách nào biết được việc xóa topic có được bật trong cluster hay không, và có thể yêu cầu xóa một topic từ một cluster mà việc xóa đang bị tắt.
2. Một topic rất lớn được yêu cầu xóa, nhưng trước khi yêu cầu được xử lý, một hoặc nhiều tập replica bị offline do lỗi phần cứng, và việc xóa không thể hoàn tất vì controller không thể xác nhận rằng việc xóa đã hoàn thành thành công.

Để "gỡ kẹt" việc xóa topic, trước tiên hãy xóa znode `/admin/delete_topic/<topic>`. Việc xóa các node ZooKeeper của topic (nhưng không xóa node cha `/admin/delete_topic`) sẽ gỡ bỏ các yêu cầu đang chờ xử lý. Nếu việc xóa bị đưa lại vào hàng đợi bởi các yêu cầu đã được cache trong controller, có thể sẽ cần phải buộc di chuyển controller như đã trình bày ở trên ngay sau khi gỡ bỏ znode của topic, nhằm đảm bảo không còn yêu cầu nào được cache đang chờ xử lý trong controller.

### Xóa topic một cách thủ công (Deleting Topics Manually)

Nếu bạn đang vận hành một cluster với tính năng xóa topic bị tắt, hoặc nếu bạn thấy mình cần xóa một số topic nằm ngoài quy trình vận hành thông thường, bạn vẫn có thể xóa chúng thủ công khỏi cluster. Tuy nhiên, việc này đòi hỏi phải tắt hoàn toàn tất cả các broker trong cluster, và không thể thực hiện khi bất kỳ broker nào trong cluster còn đang chạy.

> **Tắt các broker trước (Shut down brokers first)**
>
> Việc sửa đổi metadata của cluster trong ZooKeeper khi cluster đang online là một thao tác rất nguy hiểm và có thể đưa cluster vào trạng thái không ổn định. Đừng bao giờ cố gắng xóa hoặc sửa đổi metadata của topic trong ZooKeeper khi cluster đang online.

Để xóa một topic khỏi cluster:

1. Tắt tất cả các broker trong cluster.
2. Gỡ bỏ đường dẫn ZooKeeper `/brokers/topics/<topic>` khỏi đường dẫn của Kafka cluster. Lưu ý rằng node này có các node con phải được xóa trước.
3. Gỡ bỏ các thư mục partition khỏi các thư mục log trên mỗi broker. Chúng sẽ được đặt tên là `<topic>-<int>`, trong đó `<int>` là ID của partition.
4. Khởi động lại tất cả các broker.

## Tóm tắt (Summary)

Vận hành một Kafka cluster có thể là một công việc đầy thách thức, với vô số cấu hình và tác vụ bảo trì cần thực hiện để giữ cho hệ thống chạy ở hiệu năng cao nhất. Trong chương này, chúng ta đã thảo luận nhiều tác vụ thường nhật, chẳng hạn như quản lý cấu hình topic và client, mà bạn sẽ cần xử lý thường xuyên. Chúng ta cũng đã đề cập tới một số tác vụ khó hiểu hơn mà bạn sẽ cần đến khi debug các vấn đề, như việc kiểm tra các log segment. Cuối cùng, chúng ta đã điểm qua một vài thao tác mà, dù không an toàn hay thường quy, vẫn có thể được dùng để đưa bạn thoát khỏi một tình huống hóc búa. Tất cả những công cụ này sẽ giúp bạn quản lý Kafka cluster của mình. Khi bạn bắt đầu mở rộng các Kafka cluster lên quy mô lớn hơn, thì ngay cả việc sử dụng những công cụ này cũng có thể trở nên vất vả và khó quản lý. Rất khuyến nghị bạn tham gia vào cộng đồng mã nguồn mở Kafka và tận dụng nhiều dự án mã nguồn mở khác trong hệ sinh thái để giúp tự động hóa nhiều tác vụ đã được nêu ra trong chương này.

Giờ đây khi chúng ta đã tự tin với các công cụ cần thiết để quản trị và quản lý cluster của mình, thì điều đó vẫn là bất khả thi nếu không có hệ thống giám sát (monitoring) phù hợp. Chương 13 sẽ thảo luận các cách giám sát tình trạng và hoạt động của broker và cluster để bạn có thể chắc chắn rằng Kafka đang hoạt động tốt (và biết được khi nào nó không như vậy). Chúng ta cũng sẽ đưa ra những thực hành tốt nhất để giám sát các client của bạn, bao gồm cả producer lẫn consumer.
