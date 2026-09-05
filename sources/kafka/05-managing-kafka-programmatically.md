# Chương 5. Quản trị Apache Kafka bằng lập trình (Managing Apache Kafka Programmatically)

Có rất nhiều công cụ CLI và GUI để quản trị Kafka (chúng ta sẽ bàn về chúng trong Chương 9), nhưng cũng có những lúc bạn muốn thực thi một số lệnh quản trị ngay từ bên trong ứng dụng client của mình. Tạo topic mới theo nhu cầu dựa trên dữ liệu hoặc đầu vào của người dùng là một tình huống sử dụng đặc biệt phổ biến: các ứng dụng Internet of Things (IoT) thường nhận event từ thiết bị của người dùng, rồi ghi event vào các topic dựa theo loại thiết bị. Nếu nhà sản xuất cho ra một loại thiết bị mới, bạn hoặc phải nhớ tạo thêm topic thông qua một quy trình nào đó, hoặc ứng dụng có thể tự động tạo topic mới khi nhận được event với loại thiết bị chưa được nhận diện. Phương án thứ hai có những mặt trái của nó, nhưng việc tránh được sự phụ thuộc vào một quy trình bổ sung để sinh topic là một đặc tính hấp dẫn trong những tình huống phù hợp.

Apache Kafka đã bổ sung `AdminClient` từ phiên bản 0.11 nhằm cung cấp một API lập trình cho các chức năng quản trị vốn trước đây chỉ thực hiện được qua dòng lệnh: liệt kê, tạo và xóa topic; mô tả cluster; quản lý ACL; và sửa đổi cấu hình.

Đây là một ví dụ. Ứng dụng của bạn sắp produce event vào một topic cụ thể. Điều này có nghĩa là trước khi produce event đầu tiên, topic đó phải tồn tại. Trước khi Apache Kafka bổ sung `AdminClient`, có rất ít lựa chọn, và không lựa chọn nào thực sự thân thiện: bạn có thể bắt exception `UNKNOWN_TOPIC_OR_PARTITION` từ phương thức `producer.send()` rồi báo cho người dùng biết rằng họ cần tạo topic, hoặc bạn có thể hy vọng rằng Kafka cluster mà bạn đang ghi vào đã bật tính năng tự động tạo topic, hoặc bạn có thể thử dựa vào các API nội bộ và chấp nhận hậu quả của việc không có bảo đảm nào về tính tương thích. Giờ đây khi Apache Kafka đã cung cấp `AdminClient`, có một giải pháp tốt hơn nhiều: dùng `AdminClient` để kiểm tra xem topic có tồn tại hay không, và nếu không, tạo nó ngay tại chỗ.

Trong chương này, chúng ta sẽ điểm qua tổng quan về `AdminClient` trước khi đi sâu vào chi tiết cách sử dụng nó trong ứng dụng của bạn. Chúng ta sẽ tập trung vào các chức năng được dùng phổ biến nhất: quản lý topic, consumer group, và cấu hình của các entity.

## Tổng quan về AdminClient (AdminClient Overview)

Khi bạn bắt đầu sử dụng Kafka `AdminClient`, sẽ rất hữu ích nếu nắm được các nguyên tắc thiết kế cốt lõi của nó. Khi bạn hiểu `AdminClient` được thiết kế như thế nào và nên được dùng ra sao, thì chi tiết của từng phương thức sẽ trở nên trực quan hơn nhiều.

### API bất đồng bộ và nhất quán cuối (Asynchronous and Eventually Consistent API)

Có lẽ điều quan trọng nhất cần hiểu về `AdminClient` của Kafka là nó bất đồng bộ (asynchronous). Mỗi phương thức trả về ngay lập tức sau khi gửi request tới controller của cluster, và mỗi phương thức trả về một hoặc nhiều đối tượng `Future`. Các đối tượng `Future` là kết quả của những thao tác bất đồng bộ, và chúng có các phương thức để kiểm tra trạng thái của thao tác bất đồng bộ, hủy nó, chờ nó hoàn tất, và thực thi các hàm sau khi nó hoàn tất. `AdminClient` của Kafka bọc các đối tượng `Future` vào trong các đối tượng `Result`, vốn cung cấp những phương thức để chờ thao tác hoàn tất cùng các phương thức trợ giúp cho những thao tác tiếp nối phổ biến. Ví dụ, `KafkaAdminClient.createTopics` trả về đối tượng `CreateTopicsResult`, cho phép bạn chờ cho đến khi tất cả topic được tạo xong, kiểm tra trạng thái của từng topic riêng lẻ, và truy xuất cấu hình của một topic cụ thể sau khi nó được tạo.

Bởi vì việc lan truyền metadata của Kafka từ controller tới các broker là bất đồng bộ, các `Future` mà API của `AdminClient` trả về được xem là hoàn tất khi trạng thái của controller đã được cập nhật đầy đủ. Tại thời điểm đó, không phải mọi broker đều đã biết về trạng thái mới, nên một request `listTopics` có thể lại được xử lý bởi một broker chưa cập nhật kịp và sẽ không chứa topic vừa mới được tạo. Đặc tính này còn được gọi là *eventual consistency* (nhất quán cuối): rốt cuộc thì mọi broker sẽ biết về mọi topic, nhưng chúng ta không thể bảo đảm chính xác khi nào điều đó xảy ra.

### Options

Mọi phương thức trong `AdminClient` đều nhận vào một đối số là đối tượng `Options` dành riêng cho phương thức đó. Ví dụ, phương thức `listTopics` nhận đối tượng `ListTopicsOptions` làm đối số, còn `describeCluster` nhận `DescribeClusterOptions` làm đối số. Những đối tượng này chứa các thiết lập khác nhau về cách request sẽ được broker xử lý. Thiết lập mà mọi phương thức của `AdminClient` đều có là `timeoutMs`: nó điều khiển việc client sẽ chờ phản hồi từ cluster trong bao lâu trước khi ném ra `TimeoutException`. Điều này giới hạn khoảng thời gian mà ứng dụng của bạn có thể bị chặn bởi một thao tác của `AdminClient`. Các tùy chọn khác bao gồm việc `listTopics` có nên trả về cả các topic nội bộ hay không, và việc `describeCluster` có nên trả về cả những thao tác mà client được phép thực hiện trên cluster hay không.

### Phân cấp phẳng (Flat Hierarchy)

Tất cả các thao tác quản trị được giao thức Apache Kafka hỗ trợ đều được hiện thực trực tiếp trong `KafkaAdminClient`. Không có phân cấp đối tượng hay namespace nào cả. Điều này có phần gây tranh cãi vì interface có thể khá lớn và có lẽ hơi choáng ngợp, nhưng lợi ích chính là nếu bạn muốn biết cách thực hiện bằng lập trình bất kỳ thao tác quản trị nào trên Kafka, bạn chỉ có đúng một JavaDoc để tra cứu, và tính năng autocomplete của IDE sẽ rất tiện dụng. Bạn không phải băn khoăn liệu mình có đang bỏ sót đúng chỗ cần tìm hay không. Nếu nó không có trong `AdminClient`, thì nó chưa được hiện thực (nhưng rất hoan nghênh các đóng góp!).

> **Mẹo**
>
> Nếu bạn quan tâm đến việc đóng góp cho Apache Kafka, hãy xem qua hướng dẫn “How to Contribute” của chúng tôi. Hãy bắt đầu với những bản sửa lỗi và cải tiến nhỏ, ít gây tranh cãi, trước khi bắt tay vào một thay đổi lớn hơn đối với kiến trúc hoặc giao thức. Những đóng góp phi mã nguồn như báo cáo lỗi, cải thiện tài liệu, trả lời câu hỏi, và viết bài blog cũng đều được khuyến khích.

### Một số lưu ý bổ sung (Additional Notes)

Tất cả các thao tác làm thay đổi trạng thái cluster — create, delete và alter — đều được controller xử lý. Các thao tác đọc trạng thái cluster — list và describe — có thể được xử lý bởi bất kỳ broker nào và sẽ được định tuyến tới broker ít tải nhất (dựa trên những gì client biết). Điều này lẽ ra không ảnh hưởng gì tới bạn với tư cách người dùng API, nhưng biết được thì cũng tốt phòng khi bạn thấy hành vi bất thường, bạn nhận ra có thao tác thành công trong khi thao tác khác thất bại, hoặc khi bạn đang cố tìm hiểu tại sao một thao tác lại mất quá nhiều thời gian.

Tại thời điểm chúng tôi viết chương này (Apache Kafka 2.5 sắp được phát hành), hầu hết các thao tác quản trị đều có thể được thực hiện thông qua `AdminClient` hoặc trực tiếp bằng cách sửa đổi metadata của cluster trong ZooKeeper. Chúng tôi hết sức khuyến nghị bạn đừng bao giờ dùng ZooKeeper trực tiếp, và nếu bạn thực sự buộc phải làm vậy, hãy báo cáo việc này như một bug cho Apache Kafka. Lý do là trong tương lai gần, cộng đồng Apache Kafka sẽ loại bỏ sự phụ thuộc vào ZooKeeper, và mọi ứng dụng dùng ZooKeeper trực tiếp cho các thao tác quản trị sẽ phải sửa lại. Mặt khác, API của `AdminClient` sẽ vẫn giữ nguyên y hệt, chỉ khác phần hiện thực bên trong Kafka cluster.

## Vòng đời của AdminClient: Tạo, cấu hình và đóng (AdminClient Lifecycle: Creating, Configuring, and Closing)

Để sử dụng `AdminClient` của Kafka, việc đầu tiên bạn phải làm là khởi tạo một instance của lớp `AdminClient`. Việc này khá đơn giản:

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
AdminClient admin = AdminClient.create(props);
// TODO: Do something useful with AdminClient
admin.close(Duration.ofSeconds(30));
```

Phương thức tĩnh `create` nhận vào một đối số là đối tượng `Properties` chứa cấu hình. Cấu hình bắt buộc duy nhất là URI của cluster: một danh sách các broker cần kết nối, phân tách bằng dấu phẩy. Như thường lệ, trong môi trường production, bạn nên chỉ định ít nhất ba broker phòng khi một broker đang không khả dụng. Chúng ta sẽ bàn riêng về cách cấu hình một kết nối an toàn và có xác thực trong Chương 11.

Nếu bạn khởi động một `AdminClient`, thì rốt cuộc bạn cũng sẽ muốn đóng nó. Điều quan trọng cần nhớ là khi bạn gọi `close`, có thể vẫn còn một số thao tác `AdminClient` đang diễn ra. Vì vậy, phương thức `close` nhận một tham số timeout. Một khi bạn gọi `close`, bạn không thể gọi bất kỳ phương thức nào khác và không thể gửi thêm request nào nữa, nhưng client sẽ chờ phản hồi cho đến khi hết timeout. Sau khi timeout hết hạn, client sẽ hủy bỏ tất cả các thao tác đang diễn ra kèm timeout exception và giải phóng toàn bộ tài nguyên. Gọi `close` mà không có timeout đồng nghĩa với việc client sẽ chờ bao lâu cũng được cho tới khi tất cả các thao tác đang diễn ra hoàn tất.

Có lẽ bạn còn nhớ từ Chương 3 và Chương 4 rằng `KafkaProducer` và `KafkaConsumer` có khá nhiều tham số cấu hình quan trọng. Tin vui là `AdminClient` đơn giản hơn nhiều, và không có nhiều thứ để cấu hình. Bạn có thể đọc về tất cả các tham số cấu hình trong tài liệu của Kafka. Theo ý kiến của chúng tôi, những tham số cấu hình quan trọng được mô tả trong các phần dưới đây.

### client.dns.lookup

Cấu hình này được giới thiệu trong bản phát hành Apache Kafka 2.1.0.

Theo mặc định, Kafka kiểm tra tính hợp lệ, phân giải và tạo kết nối dựa trên hostname được cung cấp trong cấu hình bootstrap server (và sau đó là dựa trên các tên mà broker trả về theo như cấu hình `advertised.listeners`). Mô hình đơn giản này hoạt động tốt trong hầu hết trường hợp nhưng không bao quát được hai tình huống sử dụng quan trọng: việc dùng DNS alias, đặc biệt trong cấu hình bootstrap, và việc dùng một tên DNS duy nhất ánh xạ tới nhiều địa chỉ IP. Nghe thì có vẻ giống nhau nhưng chúng hơi khác nhau. Hãy cùng xem xét từng tình huống loại trừ lẫn nhau này chi tiết hơn một chút.

#### Sử dụng DNS alias (Use of a DNS alias)

Giả sử bạn có nhiều broker với quy ước đặt tên như sau: `broker1.hostname.com`, `broker2.hostname.com`, v.v. Thay vì chỉ định tất cả chúng trong cấu hình bootstrap server, vốn rất dễ trở nên khó bảo trì, bạn có thể muốn tạo một DNS alias duy nhất ánh xạ tới tất cả chúng. Bạn sẽ dùng `all-brokers.hostname.com` để bootstrap, vì thực ra bạn không quan tâm broker nào nhận kết nối ban đầu từ client. Tất cả rất tiện lợi, ngoại trừ khi bạn dùng SASL để xác thực. Nếu bạn dùng SASL, client sẽ cố xác thực `all-brokers.hostname.com`, nhưng server principal lại là `broker2.hostname.com`. Nếu các tên không khớp nhau, SASL sẽ từ chối xác thực (certificate của broker có thể là một cuộc tấn công man-in-the-middle), và kết nối sẽ thất bại.

Trong tình huống này, bạn sẽ muốn dùng `client.dns.lookup=resolve_canonical_bootstrap_servers_only`. Với cấu hình này, client sẽ “khai triển” DNS alias, và kết quả sẽ y hệt như thể bạn đã đưa tất cả tên broker mà DNS alias đó trỏ tới vào danh sách bootstrap ban đầu.

#### Tên DNS với nhiều địa chỉ IP (DNS name with multiple IP addresses)

Với các kiến trúc mạng hiện đại, việc đặt tất cả broker phía sau một proxy hoặc load balancer là chuyện phổ biến. Điều này đặc biệt phổ biến nếu bạn dùng Kubernetes, nơi load balancer là cần thiết để cho phép các kết nối từ bên ngoài Kubernetes cluster. Trong những trường hợp này, bạn không muốn load balancer trở thành điểm hỏng đơn lẻ (single point of failure). Do đó, rất phổ biến việc để `broker1.hostname.com` trỏ tới một danh sách các IP, tất cả đều phân giải tới các load balancer, và tất cả đều định tuyến lưu lượng tới cùng một broker. Những IP này cũng có khả năng thay đổi theo thời gian. Theo mặc định, Kafka client sẽ chỉ thử kết nối tới IP đầu tiên mà hostname phân giải ra. Điều này có nghĩa là nếu IP đó trở nên không khả dụng, client sẽ không kết nối được, ngay cả khi broker hoàn toàn khả dụng. Vì vậy, rất khuyến nghị dùng `client.dns.lookup=use_all_dns_ips` để đảm bảo client không bỏ lỡ những lợi ích của một lớp cân bằng tải có tính sẵn sàng cao.

### request.timeout.ms

Cấu hình này giới hạn khoảng thời gian mà ứng dụng của bạn có thể dành để chờ `AdminClient` phản hồi. Nó bao gồm cả thời gian dành cho việc retry nếu client nhận được lỗi có thể retry.

Giá trị mặc định là 120 giây, khá dài, nhưng một số thao tác của `AdminClient`, đặc biệt là các lệnh quản lý consumer group, có thể mất một lúc mới phản hồi. Như chúng tôi đã đề cập ở phần “Tổng quan về AdminClient”, mỗi phương thức của `AdminClient` đều nhận một đối tượng `Options`, vốn có thể chứa một giá trị timeout áp dụng riêng cho lời gọi đó. Nếu một thao tác `AdminClient` nằm trên đường găng (critical path) của ứng dụng, bạn có thể muốn dùng giá trị timeout thấp hơn và xử lý việc Kafka không phản hồi kịp thời theo một cách khác. Một ví dụ phổ biến là các dịch vụ cố kiểm tra sự tồn tại của những topic cụ thể khi chúng khởi động lần đầu, nhưng nếu Kafka mất hơn 30 giây mới phản hồi, bạn có thể muốn tiếp tục khởi động server và kiểm tra sự tồn tại của các topic sau đó (hoặc bỏ qua hoàn toàn bước kiểm tra này).

## Quản lý topic thiết yếu (Essential Topic Management)

Giờ khi chúng ta đã tạo và cấu hình một `AdminClient`, đã đến lúc xem chúng ta có thể làm gì với nó. Tình huống sử dụng phổ biến nhất của `AdminClient` trong Kafka là quản lý topic. Việc này bao gồm liệt kê topic, mô tả topic, tạo topic và xóa topic.

Hãy bắt đầu bằng việc liệt kê tất cả các topic trong cluster:

```java
ListTopicsResult topics = admin.listTopics();
topics.names().get().forEach(System.out::println);
```

Lưu ý rằng `admin.listTopics()` trả về đối tượng `ListTopicsResult`, vốn là một lớp bọc mỏng bên trên một tập hợp các `Future`. Cũng lưu ý rằng `topics.name()` trả về một `Future` chứa tập hợp các tên. Khi chúng ta gọi `get()` trên `Future` này, thread đang thực thi sẽ chờ cho tới khi server phản hồi bằng một tập hợp tên topic, hoặc chúng ta nhận được timeout exception. Một khi có được danh sách, chúng ta duyệt qua nó để in ra tất cả tên topic.

Bây giờ hãy thử một việc tham vọng hơn một chút: kiểm tra xem một topic có tồn tại hay không, và tạo nó nếu chưa tồn tại. Một cách để kiểm tra xem một topic cụ thể có tồn tại hay không là lấy danh sách toàn bộ topic rồi kiểm tra xem topic bạn cần có trong danh sách đó không. Trên một cluster lớn, cách này có thể kém hiệu quả. Thêm nữa, đôi khi bạn muốn kiểm tra nhiều hơn là chỉ việc topic có tồn tại hay không — bạn muốn chắc chắn rằng topic có đúng số lượng partition và replica. Chẳng hạn, Kafka Connect và Confluent Schema Registry dùng một Kafka topic để lưu trữ cấu hình. Khi khởi động, chúng kiểm tra xem topic cấu hình có tồn tại hay không, rằng nó chỉ có một partition để đảm bảo các thay đổi cấu hình sẽ đến theo đúng thứ tự nghiêm ngặt, rằng nó có ba replica để đảm bảo tính sẵn sàng, và rằng topic được compact để cấu hình cũ được giữ lại vô thời hạn:

```java
DescribeTopicsResult demoTopic = admin.describeTopics(TOPIC_LIST);

try {
      topicDescription = demoTopic.values().get(TOPIC_NAME).get();
      System.out.println("Description of demo topic:" + topicDescription);


      if (topicDescription.partitions().size() != NUM_PARTITIONS) {
        System.out.println("Topic has wrong number of partitions. Exiting.");
          System.exit(-1);
      }
} catch (ExecutionException e) {
      // exit early for almost all exceptions
      if (! (e.getCause() instanceof UnknownTopicOrPartitionException)) {
          e.printStackTrace();
             throw e;
      }

      // if we are here, topic doesn't exist
   System.out.println("Topic " + TOPIC_NAME +
        " does not exist. Going to create it now");
   // Note that number of partitions and replicas is optional. If they are
   // not specified, the defaults configured on the Kafka brokers will be use
   CreateTopicsResult newTopic = admin.createTopics(Collections.singletonList
              new NewTopic(TOPIC_NAME, NUM_PARTITIONS, REP_FACTOR)));

   // Check that the topic was created correctly:
   if (newTopic.numPartitions(TOPIC_NAME).get() != NUM_PARTITIONS) {
       System.out.println("Topic has wrong number of partitions.");
        System.exit(-1);
   }
}
```

1. Để kiểm tra rằng topic tồn tại với đúng cấu hình, chúng ta gọi `describeTopics()` với một danh sách tên topic mà chúng ta muốn kiểm tra. Lời gọi này trả về đối tượng `DescribeTopicResult`, vốn bọc một map từ tên topic tới các mô tả dạng `Future`.

2. Chúng ta đã thấy rằng nếu chờ `Future` hoàn tất bằng `get()`, chúng ta có thể lấy được kết quả mong muốn, ở đây là một `TopicDescription`. Nhưng cũng có khả năng server không thể hoàn tất request một cách đúng đắn — nếu topic không tồn tại, server không thể phản hồi bằng mô tả của nó. Trong trường hợp này, server sẽ gửi lại một lỗi, và `Future` sẽ hoàn tất bằng cách ném ra `ExecutionException`. Lỗi thực sự do server gửi về sẽ là nguyên nhân (cause) của exception đó. Vì chúng ta muốn xử lý trường hợp topic không tồn tại, chúng ta bắt các exception này.

3. Nếu topic có tồn tại, `Future` hoàn tất bằng cách trả về một `TopicDescription`, vốn chứa danh sách tất cả các partition của topic, và với mỗi partition mà một broker là leader, chứa danh sách các replica và danh sách các in-sync replica. Lưu ý rằng nó không bao gồm cấu hình của topic. Chúng ta sẽ bàn về cấu hình ở phần sau của chương này.

4. Lưu ý rằng tất cả các đối tượng result của `AdminClient` đều ném ra `ExecutionException` khi Kafka phản hồi bằng một lỗi. Đó là vì các result của `AdminClient` là những đối tượng `Future` được bọc lại, và chúng bọc các exception. Bạn luôn cần xem xét nguyên nhân (cause) của `ExecutionException` để lấy được lỗi mà Kafka đã trả về.

5. Nếu topic không tồn tại, chúng ta tạo một topic mới. Khi tạo một topic, bạn có thể chỉ định mỗi tên và dùng giá trị mặc định cho tất cả các chi tiết khác. Bạn cũng có thể chỉ định số partition, số replica, và cấu hình.

6. Cuối cùng, bạn muốn chờ việc tạo topic trả về, và có lẽ kiểm tra kết quả. Trong ví dụ này, chúng ta đang kiểm tra số partition. Vì chúng ta đã chỉ định số partition khi tạo topic, chúng ta khá chắc chắn là nó đúng. Việc kiểm tra kết quả phổ biến hơn nếu bạn dựa vào giá trị mặc định của broker khi tạo topic. Lưu ý rằng vì chúng ta lại gọi `get()` để kiểm tra kết quả của `CreateTopic`, phương thức này có thể ném ra exception. `TopicExistsException` là exception phổ biến trong tình huống này, và bạn sẽ muốn xử lý nó (có lẽ bằng cách mô tả topic để kiểm tra cấu hình có đúng hay không).

Giờ khi chúng ta đã có một topic, hãy xóa nó đi:

```java
admin.deleteTopics(TOPIC_LIST).all().get();

// Check that it is gone. Note that due to the async nature of deletes,
// it is possible that at this point the topic still exists
try {
    topicDescription = demoTopic.values().get(TOPIC_NAME).get();
          System.out.println("Topic " + TOPIC_NAME + " is still around");
} catch (ExecutionException e) {
    System.out.println("Topic " + TOPIC_NAME + " is gone");
}
```

Tới đây thì đoạn code hẳn đã khá quen thuộc. Chúng ta gọi phương thức `deleteTopics` với một danh sách tên topic cần xóa, và chúng ta dùng `get()` để chờ việc này hoàn tất.

> **Cảnh báo**
>
> Mặc dù đoạn code rất đơn giản, xin hãy nhớ rằng trong Kafka, việc xóa topic là vĩnh viễn — không có thùng rác hay sọt rác nào để giúp bạn cứu lại topic đã xóa, và cũng không có bước kiểm tra nào để xác nhận rằng topic đang rỗng và rằng bạn thực sự có ý định xóa nó. Xóa nhầm topic có thể đồng nghĩa với việc mất dữ liệu không thể khôi phục, vì vậy hãy hết sức cẩn thận với phương thức này.

Tất cả các ví dụ cho đến giờ đều dùng lời gọi chặn (blocking) `get()` trên `Future` do các phương thức khác nhau của `AdminClient` trả về. Phần lớn thời gian, chỉ cần vậy là đủ — các thao tác quản trị hiếm khi xảy ra, và việc chờ cho tới khi thao tác thành công hoặc hết thời gian thường là chấp nhận được. Có một ngoại lệ: nếu bạn đang viết một server được kỳ vọng sẽ xử lý một lượng lớn các request quản trị. Trong trường hợp này, bạn không muốn chặn các thread của server trong khi chờ Kafka phản hồi. Bạn muốn tiếp tục nhận request từ người dùng và gửi chúng tới Kafka, rồi khi Kafka phản hồi thì gửi phản hồi đó tới client. Trong những tình huống như vậy, tính linh hoạt của `KafkaFuture` trở nên rất hữu ích. Đây là một ví dụ đơn giản.

```java
vertx.createHttpServer().requestHandler(request -> {
          String topic = request.getParam("topic");
          String timeout = request.getParam("timeout");
          int timeoutMs = NumberUtils.toInt(timeout, 1000);
   DescribeTopicsResult demoTopic = admin.describeTopics(
                Collections.singletonList(topic),
                new DescribeTopicsOptions().timeoutMs(timeoutMs));


   demoTopic.values().get(topic).whenComplete(
                new KafkaFuture.BiConsumer<TopicDescription, Throwable>() {
                    @Override
                    public void accept(final TopicDescription topicDescription,
                                         final Throwable throwable) {
                          if (throwable != null) {
                              request.response().end("Error trying to describe topic "
                                     + topic + " due to " + throwable.getMessage());
                          } else {
                               request.response().end(topicDescription.toString());
                          }
                    }
          });
}).listen(8080);
```

1. Chúng ta đang dùng Vert.x để tạo một HTTP server đơn giản. Mỗi khi server này nhận được một request, nó gọi `requestHandler` mà chúng ta định nghĩa ở đây.

2. Request bao gồm một tên topic dưới dạng tham số, và chúng ta sẽ phản hồi bằng mô tả của topic này.

3. Chúng ta gọi `AdminClient.describeTopics` như thường lệ và nhận về một `Future` được bọc lại.

4. Thay vì dùng lời gọi chặn `get()`, chúng ta xây dựng một hàm sẽ được gọi khi `Future` hoàn tất.

5. Nếu `Future` hoàn tất kèm một exception, chúng ta gửi lỗi tới HTTP client.

6. Nếu `Future` hoàn tất thành công, chúng ta phản hồi cho client bằng mô tả của topic.

Điểm mấu chốt ở đây là chúng ta không chờ phản hồi từ Kafka. `DescribeTopicResult` sẽ gửi phản hồi tới HTTP client khi phản hồi từ Kafka về tới nơi. Trong lúc đó, HTTP server có thể tiếp tục xử lý các request khác. Bạn có thể kiểm chứng hành vi này bằng cách dùng `SIGSTOP` để tạm dừng Kafka (đừng thử điều này trong production!) rồi gửi hai HTTP request tới Vert.x: một request với giá trị timeout dài và một request với giá trị timeout ngắn. Mặc dù bạn gửi request thứ hai sau request thứ nhất, nó sẽ phản hồi sớm hơn nhờ giá trị timeout thấp hơn, và không bị chặn phía sau request thứ nhất.

## Quản lý cấu hình (Configuration Management)

Việc quản lý cấu hình được thực hiện bằng cách mô tả và cập nhật các tập hợp `ConfigResource`. Config resource có thể là broker, broker logger, và topic. Việc kiểm tra và sửa đổi cấu hình broker cũng như cấu hình logging của broker thường được làm bằng các công cụ như `kafka-config.sh` hoặc các công cụ quản trị Kafka khác, nhưng việc kiểm tra và cập nhật cấu hình topic từ chính các ứng dụng sử dụng chúng lại khá phổ biến.

Ví dụ, nhiều ứng dụng dựa vào các topic được compact để hoạt động đúng. Hợp lý khi định kỳ (thường xuyên hơn khoảng thời gian retention mặc định, cho chắc ăn) những ứng dụng đó kiểm tra xem topic có thực sự đang được compact hay không và hành động để sửa lại cấu hình topic nếu không phải vậy.

Đây là một ví dụ về cách làm điều này:

```java
ConfigResource configResource =
            new ConfigResource(ConfigResource.Type.TOPIC, TOPIC_NAME);
DescribeConfigsResult configsResult =
        admin.describeConfigs(Collections.singleton(configResource));
Config configs = configsResult.all().get().get(configResource);


// print nondefault configs
configs.entries().stream().filter(
            entry -> !entry.isDefault()).forEach(System.out::println);


// Check if topic is compacted
ConfigEntry compaction = new ConfigEntry(TopicConfig.CLEANUP_POLICY_CONFIG,
        TopicConfig.CLEANUP_POLICY_COMPACT);
if (!configs.entries().contains(compaction)) {
      // if topic is not compacted, compact it
      Collection<AlterConfigOp> configOp = new ArrayList<AlterConfigOp>();
      configOp.add(new AlterConfigOp(compaction, AlterConfigOp.OpType.SET));
      Map<ConfigResource, Collection<AlterConfigOp>> alterConf = new HashMap<>(
      alterConf.put(configResource, configOp);
      admin.incrementalAlterConfigs(alterConf).all().get();
} else {
    System.out.println("Topic " + TOPIC_NAME + " is compacted topic");
}
```

1. Như đã đề cập ở trên, có vài kiểu `ConfigResource`; ở đây chúng ta đang kiểm tra cấu hình cho một topic cụ thể. Bạn có thể chỉ định nhiều resource khác nhau thuộc nhiều kiểu khác nhau trong cùng một request.

2. Kết quả của `describeConfigs` là một map từ mỗi `ConfigResource` tới một tập hợp các cấu hình. Mỗi mục cấu hình có một phương thức `isDefault()` cho chúng ta biết những cấu hình nào đã bị sửa đổi. Một cấu hình topic được coi là không mặc định (nondefault) nếu người dùng đã cấu hình topic để có giá trị khác mặc định, hoặc nếu một cấu hình ở cấp broker đã bị sửa đổi và topic được tạo ra đã kế thừa giá trị không mặc định này từ broker.

3. Để sửa đổi một cấu hình, hãy chỉ định một map gồm `ConfigResource` mà bạn muốn sửa và một tập hợp các thao tác. Mỗi thao tác sửa đổi cấu hình bao gồm một mục cấu hình (tên và giá trị của cấu hình; trong trường hợp này, `cleanup.policy` là tên cấu hình và `compacted` là giá trị) và kiểu thao tác. Có bốn kiểu thao tác sửa đổi cấu hình trong Kafka: `SET`, đặt giá trị cấu hình; `DELETE`, xóa giá trị và đặt lại về mặc định; `APPEND`; và `SUBSTRACT`. Hai kiểu cuối chỉ áp dụng cho các cấu hình có kiểu List và cho phép thêm hoặc bớt giá trị khỏi danh sách mà không phải gửi toàn bộ danh sách tới Kafka mỗi lần.

Việc mô tả cấu hình có thể hữu ích đến bất ngờ trong tình huống khẩn cấp. Chúng tôi còn nhớ một lần trong quá trình nâng cấp, file cấu hình cho các broker vô tình bị thay bằng một bản sao bị hỏng. Điều này chỉ được phát hiện sau khi khởi động lại broker đầu tiên và nhận thấy nó không khởi động được. Đội ngũ không có cách nào khôi phục bản gốc, và chúng tôi đã chuẩn bị tinh thần cho một quá trình mò mẫm thử-và-sai đáng kể khi cố dựng lại cấu hình đúng và đưa broker sống lại. Một site reliability engineer (SRE) đã cứu vãn tình thế bằng cách kết nối tới một trong các broker còn lại và dump cấu hình của nó ra bằng `AdminClient`.

## Quản lý consumer group (Consumer Group Management)

Chúng tôi đã đề cập trước đây rằng khác với hầu hết các message queue, Kafka cho phép bạn xử lý lại dữ liệu theo đúng thứ tự mà nó đã được consume và xử lý trước đó. Trong Chương 4, nơi chúng ta bàn về consumer group, chúng tôi đã giải thích cách dùng các Consumer API để quay lại và đọc lại những message cũ hơn từ một topic. Nhưng việc dùng các API này có nghĩa là bạn đã lập trình sẵn khả năng xử lý lại dữ liệu vào ứng dụng của mình từ trước. Bản thân ứng dụng của bạn phải phơi bày chức năng “xử lý lại” đó.

Có vài tình huống trong đó bạn sẽ muốn khiến một ứng dụng xử lý lại các message, ngay cả khi khả năng này không được xây dựng sẵn vào ứng dụng từ trước. Xử lý sự cố cho một ứng dụng đang trục trặc trong một sự cố vận hành là một tình huống như vậy. Một tình huống khác là khi chuẩn bị cho một ứng dụng bắt đầu chạy trên một cluster mới trong kịch bản failover khắc phục thảm họa (chúng ta sẽ bàn chi tiết hơn về điều này trong Chương 9, khi thảo luận về các kỹ thuật khắc phục thảm họa).

Trong phần này, chúng ta sẽ xem cách bạn có thể dùng `AdminClient` để khám phá và sửa đổi các consumer group cùng những offset đã được các group đó commit, bằng lập trình. Trong Chương 10 chúng ta sẽ xem xét các công cụ bên ngoài có sẵn để thực hiện cùng những thao tác này.

### Khám phá consumer group (Exploring Consumer Groups)

Nếu bạn muốn khám phá và sửa đổi consumer group, bước đầu tiên là liệt kê chúng:

```java
admin.listConsumerGroups().valid().get().forEach(System.out::println);
```

Lưu ý rằng khi dùng phương thức `valid()`, tập hợp mà `get()` trả về sẽ chỉ chứa những consumer group mà cluster trả về không kèm lỗi, nếu có. Mọi lỗi sẽ bị bỏ qua hoàn toàn, thay vì bị ném ra như exception. Phương thức `errors()` có thể được dùng để lấy tất cả các exception. Nếu bạn dùng `all()` như chúng ta đã làm trong những ví dụ khác, chỉ lỗi đầu tiên mà cluster trả về mới bị ném ra như một exception. Nguyên nhân thường gặp của những lỗi như vậy là vấn đề phân quyền, khi bạn không có quyền xem group đó, hoặc những trường hợp mà coordinator cho một số consumer group không khả dụng.

Nếu chúng ta muốn biết thêm thông tin về một số group, chúng ta có thể mô tả chúng:

```java
ConsumerGroupDescription groupDescription = admin
          .describeConsumerGroups(CONSUMER_GRP_LIST)
          .describedGroups().get(CONSUMER_GROUP).get();
          System.out.println("Description of group " + CONSUMER_GROUP
                        + ":" + groupDescription);
```

Phần mô tả chứa vô số thông tin về group. Nó bao gồm các thành viên của group, định danh và host của họ, các partition được gán cho họ, thuật toán dùng để gán, và host của group coordinator. Phần mô tả này rất hữu ích khi xử lý sự cố với consumer group. Một trong những mẩu thông tin quan trọng nhất về một consumer group lại bị thiếu trong phần mô tả này — chắc chắn chúng ta sẽ muốn biết offset cuối cùng mà group đã commit cho từng partition mà nó đang consume là bao nhiêu, và nó đang tụt lại bao xa so với những message mới nhất trong log.

Trước đây, cách duy nhất để lấy thông tin này là phân tích các message commit mà consumer group ghi vào một topic nội bộ của Kafka. Dù phương pháp này đạt được mục đích, Kafka không đảm bảo tính tương thích của các định dạng message nội bộ, và vì vậy phương pháp cũ không được khuyến nghị. Chúng ta sẽ xem cách `AdminClient` của Kafka cho phép chúng ta truy xuất thông tin này:

```java
Map<TopicPartition, OffsetAndMetadata> offsets =
        admin.listConsumerGroupOffsets(CONSUMER_GROUP)
                      .partitionsToOffsetAndMetadata().get();

Map<TopicPartition, OffsetSpec> requestLatestOffsets = new HashMap<>();


for(TopicPartition tp: offsets.keySet()) {
      requestLatestOffsets.put(tp, OffsetSpec.latest());
}


Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> latestOffsets =
           admin.listOffsets(requestLatestOffsets).all().get();


for (Map.Entry<TopicPartition, OffsetAndMetadata> e: offsets.entrySet()) {
      String topic = e.getKey().topic();
      int partition = e.getKey().partition();
      long committedOffset = e.getValue().offset();
      long latestOffset = latestOffsets.get(e.getKey()).offset();


      System.out.println("Consumer group " + CONSUMER_GROUP
                + " has committed offset " + committedOffset
                + " to topic " + topic + " partition " + partition
                + ". The latest offset in the partition is "
                +   latestOffset + " so consumer group is "
                + (latestOffset - committedOffset) + " records behind");
}
```

1. Chúng ta truy xuất một map gồm tất cả các topic và partition mà consumer group xử lý, cùng offset đã commit gần nhất cho mỗi cặp. Lưu ý rằng khác với `describeConsumerGroups`, `listConsumerGroupOffsets` chỉ nhận một consumer group duy nhất chứ không nhận một tập hợp.

2. Với mỗi topic và partition trong kết quả, chúng ta muốn lấy offset của message cuối cùng trong partition. `OffsetSpec` có ba hiện thực rất tiện lợi: `earliest()`, `latest()`, và `forTimestamp()`, cho phép chúng ta lấy offset sớm nhất và mới nhất trong partition, cũng như offset của record được ghi tại hoặc ngay sau thời điểm được chỉ định.

3. Cuối cùng, chúng ta duyệt qua tất cả các partition, và với mỗi partition in ra offset commit cuối cùng, offset mới nhất trong partition, và độ trễ (lag) giữa chúng.

### Sửa đổi consumer group (Modifying Consumer Groups)

Cho đến giờ, chúng ta mới chỉ khám phá những thông tin sẵn có. `AdminClient` cũng có các phương thức để sửa đổi consumer group: xóa group, loại bỏ thành viên, xóa các offset đã commit, và sửa đổi offset. Những thao tác này thường được các SRE dùng để xây dựng công cụ tạm thời (ad hoc) nhằm khắc phục một tình huống khẩn cấp.

Trong số đó, sửa đổi offset là hữu ích nhất. Xóa offset thoạt trông có vẻ là cách đơn giản để khiến một consumer “bắt đầu lại từ đầu”, nhưng điều này thực ra phụ thuộc vào cấu hình của consumer — nếu consumer khởi động và không tìm thấy offset nào, nó sẽ bắt đầu từ đầu? Hay nhảy tới message mới nhất? Trừ khi biết được giá trị của `auto.offset.reset`, chúng ta không thể biết được. Việc sửa đổi tường minh các offset đã commit về những offset sớm nhất còn khả dụng sẽ buộc consumer bắt đầu xử lý từ đầu topic, và về bản chất khiến consumer được “reset”.

Hãy nhớ rằng consumer group không nhận được cập nhật khi offset thay đổi trong topic offset. Chúng chỉ đọc offset khi một consumer được gán một partition mới hoặc lúc khởi động. Để ngăn bạn thực hiện những thay đổi offset mà consumer sẽ không biết tới (và do đó sẽ ghi đè lên), Kafka sẽ ngăn bạn sửa đổi offset trong khi consumer group đang hoạt động.

Cũng hãy nhớ rằng nếu ứng dụng consumer duy trì trạng thái (và hầu hết ứng dụng stream processing đều duy trì trạng thái), việc reset offset và khiến consumer group bắt đầu xử lý từ đầu topic có thể gây ra tác động kỳ lạ lên trạng thái đã lưu. Ví dụ, giả sử bạn có một ứng dụng stream liên tục đếm số giày bán ra trong cửa hàng của bạn, và giả sử vào lúc 8:00 sáng bạn phát hiện có lỗi trong dữ liệu đầu vào và bạn muốn tính lại hoàn toàn số lượng kể từ 3:00 sáng. Nếu bạn reset offset về 3:00 sáng mà không sửa đổi tương ứng giá trị tổng hợp đã lưu, bạn sẽ đếm hai lần mỗi đôi giày đã bán hôm nay (bạn cũng sẽ xử lý lại toàn bộ dữ liệu từ 3:00 sáng tới 8:00 sáng, nhưng hãy giả định rằng điều này là cần thiết để sửa lỗi). Bạn cần cẩn thận cập nhật trạng thái đã lưu cho phù hợp. Trong môi trường phát triển, chúng tôi thường xóa hoàn toàn state store trước khi reset offset về đầu topic đầu vào.

Với tất cả những cảnh báo đó trong đầu, hãy xem một ví dụ:

```java
Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> earliestOffsets =
      admin.listOffsets(requestEarliestOffsets).all().get();

Map<TopicPartition, OffsetAndMetadata> resetOffsets = new HashMap<>();
for (Map.Entry<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> e:
           earliestOffsets.entrySet()) {
    resetOffsets.put(e.getKey(), new OffsetAndMetadata(e.getValue().offset()));
}


try {
    admin.alterConsumerGroupOffsets(CONSUMER_GROUP, resetOffsets).all().get();
} catch (ExecutionException e) {
    System.out.println("Failed to update the offsets committed by group "
                 + CONSUMER_GROUP + " with error " + e.getMessage());
    if (e.getCause() instanceof UnknownMemberIdException)
        System.out.println("Check if consumer group is still active.");
}
```

1. Để reset consumer group sao cho nó bắt đầu xử lý từ offset sớm nhất, trước tiên chúng ta cần lấy các offset sớm nhất. Việc lấy offset sớm nhất tương tự như lấy offset mới nhất, đã trình bày trong ví dụ trước.

2. Trong vòng lặp này, chúng ta chuyển đổi map với các giá trị `ListOffsetsResultInfo` do `listOffsets` trả về thành một map với các giá trị `OffsetAndMetadata` mà `alterConsumerGroupOffsets` yêu cầu.

3. Sau khi gọi `alterConsumerGroupOffsets`, chúng ta chờ `Future` hoàn tất để có thể biết nó có hoàn tất thành công hay không.

4. Một trong những nguyên nhân phổ biến nhất khiến `alterConsumerGroupOffsets` thất bại là chúng ta đã không dừng consumer group trước (việc này phải được làm bằng cách tắt trực tiếp ứng dụng consumer; không có lệnh quản trị nào để tắt một consumer group). Nếu group vẫn đang hoạt động, nỗ lực sửa đổi offset của chúng ta sẽ hiện ra trước mắt consumer coordinator như thể một client không phải thành viên của group đang commit offset cho group đó. Trong trường hợp này, chúng ta sẽ nhận được `UnknownMemberIdException`.

## Metadata của cluster (Cluster Metadata)

Hiếm khi một ứng dụng phải tường minh khám phá bất cứ điều gì về cluster mà nó kết nối tới. Bạn có thể produce và consume message mà không bao giờ cần biết có bao nhiêu broker tồn tại và broker nào là controller. Các Kafka client trừu tượng hóa thông tin này đi — client chỉ cần bận tâm tới topic và partition.

Nhưng phòng khi bạn tò mò, đoạn code nhỏ này sẽ thỏa mãn sự tò mò của bạn:

```java
DescribeClusterResult cluster = admin.describeCluster();


System.out.println("Connected to cluster " + cluster.clusterId().get());
System.out.println("The brokers in the cluster are:");
cluster.nodes().get().forEach(node -> System.out.println("                    * " + node));
System.out.println("The controller is: " + cluster.controller().get());
```

1. Định danh của cluster là một GUID và vì vậy không thể đọc hiểu bằng mắt người. Nó vẫn hữu ích để kiểm tra xem client của bạn đã kết nối đúng cluster hay chưa.

## Các thao tác quản trị nâng cao (Advanced Admin Operations)

Trong phần này, chúng ta sẽ bàn về một vài phương thức hiếm khi được dùng, và có thể tiềm ẩn rủi ro khi dùng, nhưng lại vô cùng hữu ích khi cần đến. Chúng chủ yếu quan trọng với các SRE trong các sự cố — nhưng đừng đợi tới lúc đang gặp sự cố mới học cách dùng chúng. Hãy đọc và thực hành trước khi quá muộn. Lưu ý rằng các phương thức ở đây gần như chẳng liên quan gì tới nhau, ngoại trừ việc tất cả đều thuộc về nhóm này.

### Thêm partition vào một topic (Adding Partitions to a Topic)

Thông thường số partition trong một topic được đặt khi topic được tạo. Và vì mỗi partition có thể có throughput rất cao, việc chạm tới giới hạn dung lượng của một topic là hiếm gặp. Thêm nữa, nếu các message trong topic có key, thì consumer có thể giả định rằng tất cả message có cùng key sẽ luôn đi vào cùng một partition và sẽ được xử lý theo cùng thứ tự bởi cùng một consumer.

Vì những lý do đó, việc thêm partition vào một topic hiếm khi cần thiết và có thể tiềm ẩn rủi ro. Bạn sẽ cần kiểm tra rằng thao tác này sẽ không làm hỏng bất kỳ ứng dụng nào đang consume từ topic đó. Tuy nhiên, đôi khi bạn thực sự chạm trần về lượng throughput có thể xử lý với số partition hiện có và không còn lựa chọn nào khác ngoài việc thêm partition.

Bạn có thể thêm partition cho một tập hợp các topic bằng phương thức `createPartitions`. Lưu ý rằng nếu bạn cố mở rộng nhiều topic cùng lúc, có khả năng một số topic sẽ được mở rộng thành công, trong khi những topic khác thất bại.

```java
Map<String, NewPartitions> newPartitions = new HashMap<>();
newPartitions.put(TOPIC_NAME, NewPartitions.increaseTo(NUM_PARTITIONS+2));
admin.createPartitions(newPartitions).all().get();
```

1. Khi mở rộng topic, bạn cần chỉ định tổng số partition mà topic sẽ có sau khi thêm partition, chứ không phải số partition mới.

> **Mẹo**
>
> Vì phương thức `createPartition` nhận tham số là tổng số partition trong topic sau khi các partition mới được thêm vào, bạn có thể cần mô tả topic để biết nó đang có bao nhiêu partition trước khi mở rộng.

### Xóa record khỏi một topic (Deleting Records from a Topic)

Các luật về quyền riêng tư hiện hành quy định những chính sách retention cụ thể cho dữ liệu. Đáng tiếc, mặc dù Kafka có chính sách retention cho topic, chúng không được hiện thực theo cách đảm bảo tuân thủ pháp lý. Một topic với chính sách retention 30 ngày vẫn có thể lưu dữ liệu cũ hơn nếu toàn bộ dữ liệu vừa vặn trong một segment duy nhất ở mỗi partition.

Phương thức `deleteRecords` sẽ đánh dấu là đã xóa tất cả các record có offset cũ hơn offset được chỉ định khi gọi phương thức, và khiến chúng không còn truy cập được bởi các Kafka consumer. Phương thức trả về các offset bị xóa cao nhất, nhờ đó chúng ta có thể kiểm tra xem việc xóa có thực sự diễn ra đúng như mong đợi hay không. Việc dọn dẹp hoàn toàn khỏi đĩa sẽ diễn ra bất đồng bộ. Hãy nhớ rằng phương thức `listOffsets` có thể được dùng để lấy offset của những record được ghi tại hoặc ngay sau một thời điểm cụ thể. Kết hợp lại, những phương thức này có thể được dùng để xóa các record cũ hơn bất kỳ mốc thời gian cụ thể nào:

```java
Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> olderOffsets =
        admin.listOffsets(requestOlderOffsets).all().get();
Map<TopicPartition, RecordsToDelete> recordsToDelete = new HashMap<>();
for (Map.Entry<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo>          e:
            olderOffsets.entrySet())
       recordsToDelete.put(e.getKey(),
                 RecordsToDelete.beforeOffset(e.getValue().offset()));
 admin.deleteRecords(recordsToDelete).all().get();
```

### Bầu chọn leader (Leader Election)

Phương thức này cho phép bạn kích hoạt hai loại bầu chọn leader khác nhau:

**Preferred leader election (bầu chọn leader ưu tiên)**

Mỗi partition có một replica được chỉ định là *preferred leader*. Nó được gọi là ưu tiên vì nếu tất cả các partition dùng preferred leader replica của mình làm leader, thì số lượng leader trên mỗi broker sẽ được cân bằng. Theo mặc định, cứ mỗi năm phút Kafka sẽ kiểm tra xem preferred leader replica có thực sự là leader hay không, và nếu không phải nhưng nó đủ điều kiện trở thành leader, Kafka sẽ bầu preferred leader replica làm leader. Nếu `auto.leader.rebalance.enable` là `false`, hoặc nếu bạn muốn việc này diễn ra nhanh hơn, phương thức `electLeader()` có thể kích hoạt quá trình này.

**Unclean leader election (bầu chọn leader không sạch)**

Nếu leader replica của một partition trở nên không khả dụng, và các replica khác không đủ điều kiện trở thành leader (thường vì chúng thiếu dữ liệu), partition sẽ không có leader và do đó không khả dụng. Một cách để giải quyết là kích hoạt unclean leader election, tức là bầu một replica vốn không đủ điều kiện làm leader lên làm leader bất chấp điều đó. Việc này sẽ gây mất dữ liệu — tất cả các event đã được ghi vào leader cũ mà chưa được replicate sang leader mới sẽ bị mất. Phương thức `electLeader()` cũng có thể được dùng để kích hoạt unclean leader election.

Phương thức này là bất đồng bộ, nghĩa là ngay cả sau khi nó trả về thành công, vẫn phải mất một lúc cho tới khi tất cả broker nhận biết được trạng thái mới, và các lời gọi `describeTopics()` có thể trả về kết quả không nhất quán. Nếu bạn kích hoạt bầu chọn leader cho nhiều partition, có khả năng thao tác sẽ thành công với một số partition và thất bại với những partition khác:

```java
Set<TopicPartition> electableTopics = new HashSet<>();
electableTopics.add(new TopicPartition(TOPIC_NAME, 0));
try {
      admin.electLeaders(ElectionType.PREFERRED, electableTopics).all().get();
} catch (ExecutionException e) {
      if (e.getCause() instanceof ElectionNotNeededException) {
              System.out.println("All leaders are preferred already");
      }
}
```

1. Chúng ta đang bầu preferred leader trên một partition duy nhất của một topic cụ thể. Chúng ta có thể chỉ định số lượng partition và topic tùy ý. Nếu bạn gọi lệnh với `null` thay vì một tập hợp partition, nó sẽ kích hoạt loại bầu chọn mà bạn đã chọn cho tất cả các partition.

2. Nếu cluster đang ở trạng thái khỏe mạnh, lệnh sẽ không làm gì cả. Preferred leader election và unclean leader election chỉ có tác dụng khi một replica khác preferred leader đang là leader hiện tại.

### Tái phân bổ replica (Reassigning Replicas)

Đôi khi, bạn không hài lòng với vị trí hiện tại của một số replica. Có thể một broker đang quá tải và bạn muốn di chuyển bớt một số replica. Có thể bạn muốn thêm replica. Có thể bạn muốn di chuyển tất cả replica khỏi một broker để có thể gỡ bỏ máy đó. Hoặc có thể một vài topic quá “ồn ào” đến mức bạn cần cô lập chúng khỏi phần còn lại của workload. Trong tất cả những tình huống này, `alterPartitionReassignments` cho bạn quyền kiểm soát chi tiết đối với vị trí đặt của từng replica riêng lẻ của một partition. Hãy nhớ rằng việc tái phân bổ replica từ broker này sang broker khác có thể kéo theo việc sao chép một lượng lớn dữ liệu từ broker này sang broker kia. Hãy chú ý tới băng thông mạng khả dụng, và điều tiết (throttle) việc replication bằng quota nếu cần; quota là một cấu hình ở cấp broker, nên bạn có thể mô tả và cập nhật chúng bằng `AdminClient`.

Với ví dụ này, giả sử chúng ta có một broker duy nhất với ID là 0. Topic của chúng ta có vài partition, tất cả đều có một replica trên broker này. Sau khi thêm một broker mới, chúng ta muốn dùng nó để lưu một số replica của topic. Chúng ta sẽ gán mỗi partition trong topic theo một cách hơi khác nhau:

```java
Map<TopicPartition, Optional<NewPartitionReassignment>> reassignment = new Has
reassignment.put(new TopicPartition(TOPIC_NAME, 0),
              Optional.of(new NewPartitionReassignment(Arrays.asList(0,1))));
reassignment.put(new TopicPartition(TOPIC_NAME, 1),
              Optional.of(new NewPartitionReassignment(Arrays.asList(1))));
reassignment.put(new TopicPartition(TOPIC_NAME, 2),
           Optional.of(new NewPartitionReassignment(Arrays.asList(1,0))));
reassignment.put(new TopicPartition(TOPIC_NAME, 3), Optional.empty());

admin.alterPartitionReassignments(reassignment).all().get();


System.out.println("currently reassigning: " +
           admin.listPartitionReassignments().reassignments().get());
demoTopic = admin.describeTopics(TOPIC_LIST);
topicDescription = demoTopic.values().get(TOPIC_NAME).get();
System.out.println("Description of demo topic:" + topicDescription);
```

1. Chúng ta đã thêm một replica nữa cho partition 0, đặt replica mới trên broker mới có ID là 1, nhưng giữ nguyên leader.

2. Chúng ta không thêm replica nào cho partition 1; chúng ta chỉ đơn giản di chuyển replica duy nhất hiện có sang broker mới. Vì chúng ta chỉ có một replica, nó cũng chính là leader.

3. Chúng ta đã thêm một replica nữa cho partition 2 và biến nó thành preferred leader. Lần preferred leader election tiếp theo sẽ chuyển quyền leader sang replica mới trên broker mới. Replica hiện có khi đó sẽ trở thành follower.

4. Không có việc tái phân bổ nào đang diễn ra cho partition 3, nhưng nếu có, thì lệnh này sẽ hủy nó và đưa trạng thái trở lại như trước khi thao tác tái phân bổ bắt đầu.

5. Chúng ta có thể liệt kê các thao tác tái phân bổ đang diễn ra.

6. Chúng ta cũng có thể in ra trạng thái mới, nhưng hãy nhớ rằng có thể mất một lúc cho tới khi nó hiển thị kết quả nhất quán.

## Kiểm thử (Testing)

Apache Kafka cung cấp một lớp test là `MockAdminClient`, mà bạn có thể khởi tạo với số lượng broker bất kỳ và dùng để kiểm thử rằng ứng dụng của bạn hoạt động đúng mà không cần phải chạy một Kafka cluster thật và thực sự thực hiện các thao tác quản trị trên đó. Mặc dù `MockAdminClient` không thuộc về API của Kafka và do đó có thể thay đổi mà không báo trước, nó mock các phương thức vốn là public, và vì vậy chữ ký của các phương thức sẽ vẫn tương thích. Có một chút đánh đổi ở chỗ liệu sự tiện lợi của lớp này có xứng đáng với rủi ro rằng nó sẽ thay đổi và làm hỏng các test của bạn hay không, nên hãy lưu ý điều này.

Điều làm cho lớp test này đặc biệt hấp dẫn là một số phương thức phổ biến được mock rất toàn diện: bạn có thể tạo topic bằng `MockAdminClient`, và một lời gọi `listTopics()` sau đó sẽ liệt kê những topic bạn đã “tạo”.

Tuy nhiên, không phải mọi phương thức đều được mock. Nếu bạn dùng `AdminClient` phiên bản 2.5 hoặc cũ hơn và gọi `incrementalAlterConfigs()` của `MockAdminClient`, bạn sẽ nhận được `UnsupportedOperationException`, nhưng bạn có thể xử lý việc này bằng cách tiêm (inject) phần hiện thực của riêng mình.

Để minh họa cách kiểm thử bằng `MockAdminClient`, hãy bắt đầu bằng việc hiện thực một lớp được khởi tạo với một admin client và dùng nó để tạo topic:

```java
public TopicCreator(AdminClient admin) {
      this.admin = admin;
}


// Example of a method that will create a topic if its name starts with "test"
public void maybeCreateTopic(String topicName)
        throws ExecutionException, InterruptedException {
      Collection<NewTopic> topics = new ArrayList<>();
      topics.add(new NewTopic(topicName, 1, (short) 1));
      if (topicName.toLowerCase().startsWith("test")) {
              admin.createTopics(topics);

              // alter configs just to demonstrate a point
              ConfigResource configResource =
                          new ConfigResource(ConfigResource.Type.TOPIC, topicName);
              ConfigEntry compaction =
                          new ConfigEntry(TopicConfig.CLEANUP_POLICY_CONFIG,
                                      TopicConfig.CLEANUP_POLICY_COMPACT);
              Collection<AlterConfigOp> configOp = new ArrayList<AlterConfigOp>();
              configOp.add(new AlterConfigOp(compaction, AlterConfigOp.OpType.SET))
              Map<ConfigResource, Collection<AlterConfigOp>> alterConf =
                  new HashMap<>();
              alterConf.put(configResource, configOp);
              admin.incrementalAlterConfigs(alterConf).all().get();
      }
}
```

Logic ở đây không có gì phức tạp: `maybeCreateTopic` sẽ tạo topic nếu tên topic bắt đầu bằng “test.” Chúng ta cũng sửa đổi cấu hình topic, để có thể minh họa cách xử lý trường hợp phương thức chúng ta dùng chưa được hiện thực trong mock client.

> **Lưu ý**
>
> Chúng ta đang dùng framework kiểm thử Mockito để xác minh rằng các phương thức của `MockAdminClient` được gọi đúng như mong đợi và để thế chỗ cho những phương thức chưa được hiện thực. Mockito là một framework mocking khá đơn giản với các API đẹp, khiến nó rất phù hợp cho một ví dụ nhỏ về unit test.

Chúng ta sẽ bắt đầu kiểm thử bằng việc khởi tạo mock client của mình:

```java
@Before
public void setUp() {
     Node broker = new Node(0,"localhost",9092);
     this.admin = spy(new MockAdminClient(Collections.singletonList(broker),
           broker));


     // without this, the tests will throw
     // `java.lang.UnsupportedOperationException: Not implemented yet`
     AlterConfigsResult emptyResult = mock(AlterConfigsResult.class);
     doReturn(KafkaFuture.completedFuture(null)).when(emptyResult).all();
     doReturn(emptyResult).when(admin).incrementalAlterConfigs(any());
}
```

1. `MockAdminClient` được khởi tạo với một danh sách các broker (ở đây chúng ta chỉ dùng một) và một broker sẽ đóng vai trò controller của chúng ta. Các broker chỉ gồm broker ID, hostname và port — tất nhiên tất cả đều là giả. Không có broker nào chạy trong khi thực thi các test này. Chúng ta sẽ dùng cơ chế tiêm `spy` của Mockito, để sau đó có thể kiểm tra rằng `TopicCreator` đã thực thi đúng.

2. Ở đây chúng ta dùng các phương thức `doReturn` của Mockito để đảm bảo mock admin client không ném exception. Phương thức chúng ta đang kiểm thử kỳ vọng đối tượng `AlterConfigsResult` có một phương thức `all()` trả về một `KafkaFuture`. Chúng ta đã đảm bảo rằng `incrementalAlterConfigs` giả trả về đúng như vậy.

Giờ khi chúng ta đã có một AdminClient giả đúng chuẩn, chúng ta có thể dùng nó để kiểm thử xem phương thức `maybeCreateTopic()` có hoạt động đúng hay không:

```java
@Test
public void testCreateTestTopic()
         throws ExecutionException, InterruptedException {
     TopicCreator tc = new TopicCreator(admin);
     tc.maybeCreateTopic("test.is.a.test.topic");
     verify(admin, times(1)).createTopics(any());
}


@Test
public void testNotTopic() throws ExecutionException, InterruptedException {
     TopicCreator tc = new TopicCreator(admin);
     tc.maybeCreateTopic("not.a.test");
     verify(admin, never()).createTopics(any());
}
```

1. Tên topic bắt đầu bằng “test,” nên chúng ta kỳ vọng `maybeCreateTopic()` sẽ tạo một topic. Chúng ta kiểm tra rằng `createTopics()` đã được gọi một lần.

2. Khi tên topic không bắt đầu bằng “test,” chúng ta xác minh rằng `createTopics()` hoàn toàn không được gọi.

Một lưu ý cuối cùng: Apache Kafka công bố `MockAdminClient` trong một test jar, nên hãy đảm bảo file `pom.xml` của bạn có khai báo test dependency:

```xml
<dependency>
     <groupId>org.apache.kafka</groupId>
     <artifactId>kafka-clients</artifactId>
     <version>2.5.0</version>
     <classifier>test</classifier>
     <scope>test</scope>
</dependency>
```

## Tóm tắt (Summary)

`AdminClient` là một công cụ hữu ích để có trong bộ đồ nghề phát triển Kafka của bạn. Nó hữu ích cho các lập trình viên ứng dụng muốn tạo topic ngay lập tức và xác nhận rằng những topic họ đang dùng được cấu hình đúng cho ứng dụng của họ. Nó cũng hữu ích cho các operator và SRE muốn xây dựng công cụ và tự động hóa xung quanh Kafka hoặc cần khắc phục sau một sự cố. `AdminClient` có nhiều phương thức hữu ích đến mức các SRE có thể coi nó như một con dao Thụy Sĩ đa năng cho các thao tác vận hành Kafka.

Trong chương này, chúng ta đã bao quát tất cả những điều cơ bản về việc sử dụng `AdminClient` của Kafka: quản lý topic, quản lý cấu hình, và quản lý consumer group, cộng thêm một vài phương thức hữu ích khác nên có sẵn trong túi — bạn không bao giờ biết khi nào mình sẽ cần đến chúng.
