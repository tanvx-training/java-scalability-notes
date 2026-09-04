# Chương 7. Truyền dữ liệu tin cậy (Reliable Data Delivery)

Độ tin cậy là một thuộc tính của cả hệ thống — không phải của một thành phần đơn lẻ — nên khi bàn về các bảo đảm độ tin cậy của Apache Kafka, chúng ta cần ghi nhớ toàn bộ hệ thống cùng các tình huống sử dụng của nó. Khi nói đến độ tin cậy, những hệ thống tích hợp với Kafka cũng quan trọng không kém bản thân Kafka. Và vì độ tin cậy là mối quan tâm ở cấp hệ thống, nó không thể là trách nhiệm của riêng một người. Tất cả mọi người — quản trị viên Kafka, quản trị viên Linux, quản trị viên mạng và lưu trữ, cùng các lập trình viên ứng dụng — đều phải phối hợp với nhau để xây dựng một hệ thống tin cậy.

Apache Kafka rất linh hoạt trong việc truyền dữ liệu tin cậy. Chúng tôi hiểu rằng Kafka có rất nhiều tình huống sử dụng, từ việc theo dõi các cú click trên một website cho tới các khoản thanh toán bằng thẻ tín dụng. Một số bài toán đòi hỏi độ tin cậy tối đa, trong khi những bài toán khác lại ưu tiên tốc độ và sự đơn giản hơn là độ tin cậy. Kafka được viết ra sao cho đủ khả năng cấu hình, và client API của nó đủ linh hoạt, để cho phép mọi kiểu đánh đổi về độ tin cậy.

Chính vì sự linh hoạt đó mà cũng rất dễ vô tình tự bắn vào chân mình khi dùng Kafka — tin rằng hệ thống của mình tin cậy trong khi thực tế thì không. Trong chương này, chúng ta sẽ bắt đầu bằng việc bàn về các kiểu độ tin cậy khác nhau và ý nghĩa của chúng trong bối cảnh Apache Kafka. Sau đó chúng ta sẽ nói về cơ chế replication của Kafka và cách nó góp phần vào độ tin cậy của hệ thống. Tiếp theo chúng ta sẽ thảo luận về các broker và topic của Kafka cùng cách chúng nên được cấu hình cho các tình huống sử dụng khác nhau. Rồi chúng ta sẽ bàn về các client, producer và consumer, và cách sử dụng chúng trong những kịch bản độ tin cậy khác nhau. Cuối cùng, chúng ta sẽ thảo luận chủ đề kiểm chứng độ tin cậy của hệ thống, bởi vì tin rằng một hệ thống là tin cậy thì chưa đủ — giả định đó phải được kiểm thử một cách kỹ lưỡng.

## Các bảo đảm về độ tin cậy (Reliability Guarantees)

Khi nói về độ tin cậy, chúng ta thường nói theo ngôn ngữ của các bảo đảm (guarantee), tức là những hành vi mà một hệ thống được bảo đảm sẽ duy trì trong các hoàn cảnh khác nhau.

Có lẽ bảo đảm độ tin cậy nổi tiếng nhất là ACID, chuẩn bảo đảm độ tin cậy mà các cơ sở dữ liệu quan hệ đều hỗ trợ. ACID là viết tắt của atomicity (tính nguyên tử), consistency (tính nhất quán), isolation (tính cô lập) và durability (độ bền dữ liệu). Khi một nhà cung cấp giải thích rằng cơ sở dữ liệu của họ tuân thủ ACID, điều đó nghĩa là cơ sở dữ liệu bảo đảm những hành vi nhất định liên quan đến hành vi của transaction.

Chính những bảo đảm đó là lý do người ta tin tưởng giao các ứng dụng quan trọng nhất của mình cho cơ sở dữ liệu quan hệ — họ biết chính xác hệ thống hứa hẹn điều gì và nó sẽ hành xử ra sao trong các điều kiện khác nhau. Họ hiểu các bảo đảm đó và có thể viết những ứng dụng an toàn bằng cách dựa vào chúng.

Hiểu được các bảo đảm mà Kafka cung cấp là điều tối quan trọng với những ai muốn xây dựng ứng dụng tin cậy. Sự hiểu biết này cho phép các lập trình viên của hệ thống hình dung hệ thống sẽ hành xử thế nào trong những điều kiện sự cố khác nhau. Vậy, Apache Kafka bảo đảm những gì?

- Kafka bảo đảm thứ tự của các message trong một partition. Nếu message B được ghi sau message A, bằng cùng một producer vào cùng một partition, thì Kafka bảo đảm rằng offset của message B sẽ lớn hơn của message A, và rằng các consumer sẽ đọc message B sau message A.
- Các message được produce được coi là đã "committed" khi chúng đã được ghi vào partition trên toàn bộ các in-sync replica của nó (nhưng không nhất thiết đã được flush xuống đĩa). Producer có thể chọn nhận acknowledgment cho các message đã gửi khi message được commit hoàn toàn, khi nó được ghi vào leader, hoặc khi nó được gửi đi qua mạng.
- Những message đã được commit sẽ không bị mất chừng nào còn ít nhất một replica còn sống.
- Consumer chỉ có thể đọc những message đã được commit.

Những bảo đảm cơ bản này có thể được dùng khi xây dựng một hệ thống tin cậy, nhưng bản thân chúng không làm cho hệ thống hoàn toàn tin cậy. Có những đánh đổi liên quan khi xây dựng một hệ thống tin cậy, và Kafka được xây dựng để cho phép các quản trị viên và lập trình viên quyết định họ cần bao nhiêu độ tin cậy, bằng cách cung cấp các tham số cấu hình cho phép kiểm soát những đánh đổi này. Các đánh đổi thường liên quan đến việc lưu trữ message một cách tin cậy và nhất quán quan trọng đến mức nào so với những cân nhắc quan trọng khác, chẳng hạn như tính sẵn sàng, throughput cao, latency thấp và chi phí phần cứng.

Tiếp theo chúng ta sẽ xem lại cơ chế replication của Kafka, giới thiệu thuật ngữ, và thảo luận cách độ tin cậy được xây dựng bên trong Kafka. Sau đó, chúng ta sẽ đi qua các tham số cấu hình vừa nhắc tới.

## Replication

Cơ chế replication của Kafka, với nhiều replica cho mỗi partition, là cốt lõi của mọi bảo đảm độ tin cậy của Kafka. Việc một message được ghi vào nhiều replica chính là cách Kafka cung cấp độ bền dữ liệu cho message trong trường hợp xảy ra sự cố sập hệ thống.

Chúng ta đã giải thích cơ chế replication của Kafka một cách chi tiết ở Chương 6, nhưng hãy cùng tóm tắt lại những điểm chính ở đây.

Mỗi topic Kafka được chia nhỏ thành các partition, vốn là những khối xây dựng dữ liệu cơ bản. Một partition được lưu trên một đĩa duy nhất. Kafka bảo đảm thứ tự của các event trong một partition, và một partition có thể ở trạng thái online (khả dụng) hoặc offline (không khả dụng). Mỗi partition có thể có nhiều replica, một trong số đó được chỉ định làm leader. Mọi event đều được produce tới leader replica và thường cũng được consume từ leader replica. Các replica còn lại chỉ cần giữ đồng bộ với leader và replicate mọi event gần nhất một cách kịp thời. Nếu leader trở nên không khả dụng, một trong các in-sync replica sẽ trở thành leader mới (có một ngoại lệ cho quy tắc này, chúng ta đã thảo luận ở Chương 6).

Một replica được coi là in sync nếu nó là leader của một partition, hoặc nếu nó là một follower mà:

- Có một session đang hoạt động với ZooKeeper — nghĩa là nó đã gửi heartbeat tới ZooKeeper trong vòng 6 giây gần nhất (có thể cấu hình).
- Đã fetch message từ leader trong vòng 10 giây gần nhất (có thể cấu hình).
- Đã fetch những message mới nhất từ leader trong vòng 10 giây gần nhất. Nghĩa là, việc follower vẫn đang nhận message từ leader là chưa đủ; nó phải từng không còn lag ít nhất một lần trong vòng 10 giây gần nhất (có thể cấu hình).

Nếu một replica mất kết nối tới ZooKeeper, ngừng fetch message mới, hoặc tụt lại phía sau và không thể bắt kịp trong vòng 10 giây, thì replica đó bị coi là out of sync. Một out-of-sync replica sẽ trở lại trạng thái in sync khi nó kết nối lại được với ZooKeeper và bắt kịp message mới nhất đã được ghi vào leader. Điều này thường xảy ra nhanh chóng sau khi một trục trặc mạng tạm thời được khắc phục, nhưng có thể mất một khoảng thời gian nếu broker chứa replica đó đã ngừng hoạt động trong một khoảng thời gian dài hơn.

> **REPLICA MẤT ĐỒNG BỘ (OUT-OF-SYNC REPLICAS)**
>
> Ở các phiên bản Kafka cũ hơn, không hiếm khi thấy một hoặc nhiều replica liên tục nhảy qua lại nhanh chóng giữa trạng thái in-sync và out-of-sync. Đây là một dấu hiệu chắc chắn rằng có gì đó không ổn với cluster. Một nguyên nhân tương đối phổ biến là kích thước request tối đa lớn cùng với JVM heap lớn, đòi hỏi phải tinh chỉnh để tránh những khoảng dừng garbage collection kéo dài khiến broker tạm thời mất kết nối với ZooKeeper. Ngày nay vấn đề này rất hiếm gặp, đặc biệt khi dùng Apache Kafka bản 2.5.0 trở lên với các cấu hình mặc định cho ZooKeeper connection timeout và maximum replica lag. Việc sử dụng JVM phiên bản 8 trở lên (nay là phiên bản tối thiểu được Kafka hỗ trợ) cùng G1 garbage collector đã giúp hạn chế vấn đề này, mặc dù vẫn có thể cần tinh chỉnh với các message lớn. Nói chung, giao thức replication của Kafka đã trở nên tin cậy hơn đáng kể trong những năm kể từ khi ấn bản đầu tiên của cuốn sách này được xuất bản. Để biết chi tiết về quá trình tiến hóa của giao thức replication của Kafka, hãy tham khảo bài nói xuất sắc của Jason Gustafson, "Hardening Apache Kafka Replication", và bài tổng quan của Gwen Shapira về các cải tiến của Kafka, "Please Upgrade Apache Kafka Now".

Một in-sync replica bị chậm hơn một chút có thể làm chậm cả producer lẫn consumer — vì chúng phải chờ tất cả các in-sync replica nhận được message trước khi message đó được commit. Một khi một replica rơi ra khỏi trạng thái in sync, chúng ta không còn chờ nó nhận message nữa. Nó vẫn tụt lại phía sau, nhưng giờ đây không còn tác động về hiệu năng. Điểm bất lợi là với ít in-sync replica hơn, replication factor hiệu dụng của partition sẽ thấp hơn, và do đó rủi ro downtime hoặc mất dữ liệu sẽ cao hơn.

Trong phần tiếp theo, chúng ta sẽ xem điều này có nghĩa là gì trên thực tế.

## Cấu hình broker (Broker Configuration)

Có ba tham số cấu hình trong broker làm thay đổi hành vi của Kafka liên quan đến việc lưu trữ message một cách tin cậy. Giống như nhiều biến cấu hình broker khác, chúng có thể được áp dụng ở cấp broker, kiểm soát cấu hình cho tất cả các topic trong hệ thống, và ở cấp topic, kiểm soát hành vi cho một topic cụ thể.

Việc có thể kiểm soát các đánh đổi về độ tin cậy ở cấp topic nghĩa là cùng một Kafka cluster có thể được dùng để chứa cả những topic tin cậy lẫn những topic không cần tin cậy. Ví dụ, tại một ngân hàng, quản trị viên có lẽ sẽ muốn thiết lập các giá trị mặc định rất tin cậy cho toàn bộ cluster, nhưng tạo ngoại lệ cho topic lưu các khiếu nại của khách hàng, nơi mà mất một chút dữ liệu là chấp nhận được.

Hãy cùng xem xét từng tham số cấu hình này và tìm hiểu chúng ảnh hưởng thế nào đến độ tin cậy của việc lưu trữ message trong Kafka cùng những đánh đổi đi kèm.

### Replication Factor

Cấu hình ở cấp topic là `replication.factor`. Ở cấp broker, chúng ta kiểm soát `default.replication.factor` cho những topic được tạo tự động.

Cho đến thời điểm này trong cuốn sách, chúng ta đã giả định rằng các topic có replication factor bằng ba, nghĩa là mỗi partition được replicate ba lần trên ba broker khác nhau. Đây là một giả định hợp lý, vì đó là giá trị mặc định của Kafka, nhưng đây là một cấu hình mà người dùng có thể thay đổi. Thậm chí sau khi một topic đã tồn tại, chúng ta vẫn có thể chọn thêm hoặc bớt replica, và qua đó thay đổi replication factor bằng công cụ replica assignment của Kafka.

Replication factor bằng N cho phép chúng ta mất N-1 broker mà vẫn có thể đọc và ghi dữ liệu vào topic. Vì vậy replication factor càng cao thì tính sẵn sàng càng cao, độ tin cậy càng cao, và ít thảm họa hơn. Ở chiều ngược lại, với replication factor bằng N, chúng ta sẽ cần ít nhất N broker và sẽ lưu N bản sao của dữ liệu, nghĩa là chúng ta sẽ cần dung lượng đĩa gấp N lần. Về cơ bản chúng ta đang đánh đổi tính sẵn sàng lấy phần cứng.

Vậy làm sao để xác định số lượng replica phù hợp cho một topic? Có một vài cân nhắc chính:

**Tính sẵn sàng (Availability)**

Một partition chỉ có một replica sẽ trở nên không khả dụng ngay cả khi chỉ khởi động lại một broker theo lịch bảo trì thông thường. Càng có nhiều replica, tính sẵn sàng mà chúng ta có thể kỳ vọng càng cao.

**Độ bền dữ liệu (Durability)**

Mỗi replica là một bản sao của toàn bộ dữ liệu trong một partition. Nếu một partition chỉ có một replica và đĩa trở nên không dùng được vì bất kỳ lý do gì, chúng ta đã mất toàn bộ dữ liệu trong partition đó. Với nhiều bản sao hơn, đặc biệt khi chúng nằm trên những thiết bị lưu trữ khác nhau, xác suất mất tất cả các bản sao sẽ giảm đi.

**Throughput**

Với mỗi replica được thêm vào, chúng ta nhân lên lượng lưu lượng giữa các broker. Nếu chúng ta produce vào một partition với tốc độ 10 MBps, thì một replica duy nhất sẽ không sinh ra lưu lượng replication nào. Nếu có 2 replica, chúng ta sẽ có 10 MBps lưu lượng replication, với 3 replica sẽ là 20 MBps, và với 5 replica sẽ là 40 MBps. Chúng ta cần tính đến điều này khi lập kế hoạch kích thước và năng lực của cluster.

**Latency đầu-cuối (End-to-end latency)**

Mỗi record được produce phải được replicate tới toàn bộ các in-sync replica trước khi nó khả dụng cho consumer. Về lý thuyết, với càng nhiều replica thì xác suất một trong các replica này hơi chậm sẽ càng cao, và do đó sẽ làm chậm các consumer. Trên thực tế, nếu một broker trở nên chậm vì bất kỳ lý do gì, nó sẽ làm chậm mọi client cố gắng sử dụng nó, bất kể replication factor là bao nhiêu.

**Chi phí (Cost)**

Đây là lý do phổ biến nhất khiến người ta dùng replication factor thấp hơn 3 cho dữ liệu không trọng yếu. Càng có nhiều replica của dữ liệu, chi phí lưu trữ và mạng càng cao. Vì nhiều hệ thống lưu trữ vốn đã replicate mỗi block 3 lần, đôi khi việc giảm chi phí bằng cách cấu hình Kafka với replication factor bằng 2 là hợp lý. Lưu ý rằng điều này vẫn sẽ làm giảm tính sẵn sàng so với replication factor bằng 3, nhưng độ bền dữ liệu sẽ được bảo đảm bởi chính thiết bị lưu trữ.

Việc bố trí (placement) các replica cũng rất quan trọng. Kafka sẽ luôn bảo đảm mỗi replica của một partition nằm trên một broker riêng biệt. Trong một số trường hợp, như vậy vẫn chưa đủ an toàn. Nếu tất cả các replica của một partition được đặt trên các broker cùng nằm trên một rack, và switch đầu rack (top-of-rack switch) gặp trục trặc, chúng ta sẽ mất tính sẵn sàng của partition đó bất kể replication factor là bao nhiêu. Để phòng ngừa rủi ro ở cấp rack, chúng tôi khuyến nghị đặt các broker trên nhiều rack và dùng tham số cấu hình broker `broker.rack` để cấu hình tên rack cho từng broker. Nếu tên rack được cấu hình, Kafka sẽ bảo đảm các replica của một partition được trải ra trên nhiều rack nhằm bảo đảm tính sẵn sàng cao hơn nữa. Khi chạy Kafka trong môi trường cloud, người ta thường coi các availability zone như các rack riêng biệt. Ở Chương 6, chúng tôi đã trình bày chi tiết về cách Kafka bố trí replica trên các broker và rack.

### Unclean Leader Election

Cấu hình này chỉ có ở cấp broker (và trên thực tế là cấp toàn cluster). Tên tham số là `unclean.leader.election.enable`, và mặc định nó được đặt là `false`.

Như đã giải thích trước đó, khi leader của một partition không còn khả dụng, một trong các in-sync replica sẽ được chọn làm leader mới. Cuộc bầu chọn leader này là "clean" (sạch) theo nghĩa nó bảo đảm không mất dữ liệu đã commit — theo định nghĩa, dữ liệu đã commit tồn tại trên tất cả các in-sync replica.

Nhưng chúng ta phải làm gì khi không tồn tại in-sync replica nào ngoại trừ chính leader vừa trở nên không khả dụng?

Tình huống này có thể xảy ra trong một trong hai kịch bản:

- Partition có ba replica, và hai follower trở nên không khả dụng (giả sử hai broker bị sập). Trong tình huống này, khi producer tiếp tục ghi vào leader, tất cả các message đều được acknowledge và commit (vì leader là in-sync replica duy nhất). Bây giờ giả sử leader trở nên không khả dụng (ôi, lại thêm một broker sập). Trong kịch bản này, nếu một trong các follower out-of-sync khởi động trước, chúng ta sẽ có một out-of-sync replica là replica khả dụng duy nhất của partition.
- Partition có ba replica, và do sự cố mạng, hai follower tụt lại phía sau đến mức dù chúng vẫn đang chạy và vẫn đang replicate, chúng không còn in sync nữa. Leader tiếp tục nhận message với tư cách in-sync replica duy nhất. Bây giờ nếu leader trở nên không khả dụng, chỉ còn các out-of-sync replica sẵn sàng để trở thành leader.

Trong cả hai kịch bản này, chúng ta cần đưa ra một quyết định khó khăn:

- Nếu chúng ta không cho phép out-of-sync replica trở thành leader mới, partition sẽ vẫn offline cho đến khi chúng ta đưa leader cũ (và là in-sync replica cuối cùng) trở lại trực tuyến. Trong một số trường hợp (ví dụ, cần thay chip nhớ), việc này có thể mất nhiều giờ.
- Nếu chúng ta cho phép out-of-sync replica trở thành leader mới, chúng ta sẽ mất toàn bộ những message đã được ghi vào leader cũ trong khoảng thời gian replica đó ở trạng thái out of sync, và cũng gây ra một số bất nhất nơi các consumer. Tại sao? Hãy hình dung rằng trong khi replica 0 và 1 không khả dụng, chúng ta đã ghi các message với offset 100–200 vào replica 2 (khi đó là leader). Bây giờ replica 2 không khả dụng và replica 0 trở lại trực tuyến. Replica 0 chỉ có các message 0–100 chứ không có 100–200. Nếu chúng ta cho phép replica 0 trở thành leader mới, nó sẽ cho phép producer ghi các message mới và cho phép consumer đọc chúng. Vậy là giờ đây leader mới có các message 100–200 hoàn toàn khác. Trước hết, hãy lưu ý rằng một số consumer có thể đã đọc các message 100–200 cũ, một số consumer nhận được các message 100–200 mới, và một số nhận được hỗn hợp cả hai. Điều này có thể dẫn tới những hậu quả khá tệ khi nhìn vào những thứ như các báo cáo hạ nguồn. Ngoài ra, replica 2 sẽ quay trở lại trực tuyến và trở thành follower của leader mới. Tại thời điểm đó, nó sẽ xóa mọi message mà nó có nhưng không tồn tại trên leader hiện tại. Những message đó sẽ không còn khả dụng cho bất kỳ consumer nào trong tương lai.

Tóm lại, nếu chúng ta cho phép các out-of-sync replica trở thành leader, chúng ta chấp nhận rủi ro mất dữ liệu và bất nhất. Nếu chúng ta không cho phép chúng trở thành leader, chúng ta phải đối mặt với tính sẵn sàng thấp hơn vì phải chờ leader ban đầu trở nên khả dụng trước khi partition trở lại trực tuyến.

Theo mặc định, `unclean.leader.election.enable` được đặt là false, tức là sẽ không cho phép các out-of-sync replica trở thành leader. Đây là lựa chọn an toàn nhất vì nó cung cấp bảo đảm tốt nhất chống mất dữ liệu. Điều đó cũng có nghĩa là trong những kịch bản mất khả dụng cực đoan mà chúng ta đã mô tả ở trên, một số partition sẽ vẫn không khả dụng cho tới khi được khôi phục thủ công. Quản trị viên luôn có thể xem xét tình huống, quyết định chấp nhận mất dữ liệu để đưa các partition trở lại khả dụng, và chuyển cấu hình này thành true trước khi khởi động cluster. Chỉ cần đừng quên chuyển nó về false sau khi cluster đã hồi phục.

### Số lượng In-Sync Replica tối thiểu (Minimum In-Sync Replicas)

Cả cấu hình cấp topic lẫn cấp broker đều có tên là `min.insync.replicas`.

Như chúng ta đã thấy, có những trường hợp mặc dù đã cấu hình một topic có ba replica, chúng ta vẫn có thể chỉ còn lại một in-sync replica duy nhất. Nếu replica này trở nên không khả dụng, chúng ta có thể phải chọn giữa tính sẵn sàng và tính nhất quán. Đây không bao giờ là một lựa chọn dễ dàng. Lưu ý rằng một phần của vấn đề nằm ở chỗ, theo các bảo đảm độ tin cậy của Kafka, dữ liệu được coi là đã commit khi nó được ghi vào tất cả các in-sync replica, ngay cả khi "tất cả" chỉ là một replica duy nhất và dữ liệu có thể bị mất nếu replica đó không khả dụng.

Khi muốn chắc chắn rằng dữ liệu đã commit được ghi vào nhiều hơn một replica, chúng ta cần đặt số lượng in-sync replica tối thiểu ở một giá trị cao hơn. Nếu một topic có ba replica và chúng ta đặt `min.insync.replicas` bằng `2`, thì producer chỉ có thể ghi vào một partition trong topic đó nếu ít nhất hai trong ba replica đang in sync.

Khi cả ba replica đều in sync, mọi thứ diễn ra bình thường. Điều này cũng đúng nếu một trong các replica trở nên không khả dụng. Tuy nhiên, nếu hai trong ba replica không khả dụng, các broker sẽ không còn chấp nhận produce request nữa. Thay vào đó, các producer cố gắng gửi dữ liệu sẽ nhận `NotEnoughReplicasException`. Consumer vẫn có thể tiếp tục đọc dữ liệu hiện có. Trên thực tế, với cấu hình này, một in-sync replica duy nhất sẽ trở thành chỉ-đọc (read-only). Điều này ngăn chặn tình huống không mong muốn khi dữ liệu được produce và consume, để rồi biến mất khi xảy ra unclean election. Để khôi phục khỏi tình trạng chỉ-đọc này, chúng ta phải làm cho một trong hai partition không khả dụng trở lại khả dụng (có thể là khởi động lại broker) và chờ nó bắt kịp và trở lại in sync.

### Giữ cho các replica đồng bộ (Keeping Replicas In Sync)

Như đã đề cập trước đó, các out-of-sync replica làm giảm độ tin cậy tổng thể, nên điều quan trọng là tránh chúng nhiều nhất có thể. Chúng ta cũng đã giải thích rằng một replica có thể trở thành out of sync theo một trong hai cách: hoặc nó mất kết nối tới ZooKeeper, hoặc nó không theo kịp leader và tích tụ replication lag. Kafka có hai cấu hình broker kiểm soát độ nhạy của cluster đối với hai điều kiện này.

`zookeeper.session.timeout.ms` là khoảng thời gian mà trong đó một Kafka broker có thể ngừng gửi heartbeat tới ZooKeeper mà ZooKeeper vẫn chưa coi broker đó là đã chết và loại nó khỏi cluster. Ở phiên bản 2.5.0, giá trị này được tăng từ 6 giây lên 18 giây, nhằm tăng tính ổn định của các Kafka cluster trong môi trường cloud nơi độ trễ mạng biến động lớn hơn. Nói chung, chúng ta muốn khoảng thời gian này đủ lớn để tránh hiện tượng nhảy trạng thái ngẫu nhiên do garbage collection hoặc điều kiện mạng gây ra, nhưng vẫn đủ nhỏ để bảo đảm những broker thực sự bị treo sẽ được phát hiện kịp thời.

Nếu một replica không fetch từ leader hoặc không bắt kịp những message mới nhất trên leader trong khoảng thời gian dài hơn `replica.lag.time.max.ms`, nó sẽ trở thành out of sync. Giá trị này được tăng từ 10 giây lên 30 giây ở bản phát hành 2.5.0 nhằm cải thiện khả năng chống chịu của cluster và tránh hiện tượng nhảy trạng thái không cần thiết. Lưu ý rằng giá trị cao hơn này cũng tác động tới latency tối đa của consumer — với giá trị cao hơn, có thể mất tới 30 giây cho tới khi một message đến được tất cả các replica và các consumer được phép consume nó.

### Ghi bền xuống đĩa (Persisting to Disk)

Chúng ta đã đề cập vài lần rằng Kafka sẽ acknowledge những message chưa được ghi bền xuống đĩa, chỉ dựa vào số lượng replica đã nhận được message. Kafka sẽ flush message xuống đĩa khi xoay vòng segment (mặc định kích thước 1 GB) và trước khi khởi động lại, nhưng ngoài ra sẽ dựa vào page cache của Linux để flush message khi nó đầy. Ý tưởng đằng sau điều này là việc có ba máy trên các rack hoặc availability zone riêng biệt, mỗi máy giữ một bản sao dữ liệu, thì an toàn hơn so với việc ghi message xuống đĩa trên leader, bởi vì sự cố xảy ra đồng thời trên hai rack hoặc hai zone khác nhau là cực kỳ khó xảy ra. Tuy vậy, vẫn có thể cấu hình các broker để ghi bền message xuống đĩa thường xuyên hơn. Tham số cấu hình `flush.messages` cho phép chúng ta kiểm soát số lượng message tối đa chưa được sync xuống đĩa, và `flush.ms` cho phép chúng ta kiểm soát tần suất sync xuống đĩa. Trước khi sử dụng tính năng này, nên đọc về việc `fsync` ảnh hưởng thế nào tới throughput của Kafka và cách giảm thiểu những nhược điểm của nó.

## Sử dụng producer trong một hệ thống tin cậy (Using Producers in a Reliable System)

Ngay cả khi chúng ta cấu hình các broker theo cấu hình tin cậy nhất có thể, hệ thống xét như một tổng thể vẫn có khả năng mất dữ liệu nếu chúng ta không cấu hình các producer cho tin cậy.

Dưới đây là hai kịch bản ví dụ để minh họa điều này:

- Chúng ta cấu hình các broker với ba replica, và unclean leader election bị tắt. Vậy thì lẽ ra chúng ta không bao giờ được mất một message nào đã được commit vào Kafka cluster. Tuy nhiên, chúng ta lại cấu hình producer gửi message với `acks=1`. Chúng ta gửi một message từ producer, và nó được ghi vào leader nhưng chưa được ghi vào các in-sync replica. Leader gửi lại phản hồi cho producer nói rằng "Message đã được ghi thành công" và ngay lập tức sập trước khi dữ liệu được replicate sang các replica khác. Các replica khác vẫn được coi là in sync (nhớ rằng phải mất một khoảng thời gian trước khi chúng ta tuyên bố một replica là out of sync), và một trong số chúng sẽ trở thành leader. Vì message chưa được ghi vào các replica, nó đã bị mất. Nhưng ứng dụng produce lại nghĩ rằng nó đã được ghi thành công. Hệ thống vẫn nhất quán bởi vì không có consumer nào nhìn thấy message đó (nó chưa bao giờ được commit vì các replica chưa bao giờ nhận được nó), nhưng từ góc nhìn của producer, một message đã bị mất.
- Chúng ta cấu hình các broker với ba replica, và unclean leader election bị tắt. Chúng ta đã rút kinh nghiệm từ sai lầm và bắt đầu produce message với `acks=all`. Giả sử chúng ta đang cố ghi một message vào Kafka, nhưng leader của partition mà chúng ta đang ghi vào vừa sập và một leader mới vẫn đang trong quá trình được bầu chọn. Kafka sẽ phản hồi "Leader not Available." Tại thời điểm này, nếu producer không xử lý lỗi đúng cách và không retry cho tới khi ghi thành công, message có thể bị mất. Một lần nữa, đây không phải là vấn đề độ tin cậy của broker vì broker chưa bao giờ nhận được message; và cũng không phải vấn đề nhất quán vì các consumer cũng chưa bao giờ nhận được message. Nhưng nếu producer không xử lý lỗi đúng cách, chúng có thể gây mất message.

Như các ví dụ cho thấy, có hai điều quan trọng mà bất kỳ ai viết ứng dụng produce vào Kafka đều phải chú ý:

- Dùng cấu hình `acks` đúng để phù hợp với các yêu cầu về độ tin cậy
- Xử lý lỗi đúng cách, cả trong cấu hình lẫn trong code

Chúng ta đã thảo luận sâu về cấu hình producer ở Chương 3, nhưng hãy cùng điểm lại những điểm quan trọng.

### Send Acknowledgments

Producer có thể chọn giữa ba chế độ acknowledgment khác nhau:

**`acks=0`**

Nghĩa là một message được coi là đã ghi thành công vào Kafka nếu producer gửi được nó đi qua mạng. Chúng ta vẫn sẽ nhận lỗi nếu đối tượng chúng ta đang gửi không thể serialize được hoặc nếu card mạng bị hỏng, nhưng chúng ta sẽ không nhận được bất kỳ lỗi nào nếu partition đang offline, đang có một cuộc bầu chọn leader diễn ra, hoặc thậm chí nếu toàn bộ Kafka cluster không khả dụng. Chạy với `acks=0` cho produce latency thấp (đó là lý do chúng ta thấy rất nhiều benchmark dùng cấu hình này), nhưng nó sẽ không cải thiện latency đầu-cuối (hãy nhớ rằng consumer sẽ không thấy message cho tới khi chúng được replicate tới tất cả các replica khả dụng).

**`acks=1`**

Nghĩa là leader sẽ gửi lại hoặc một acknowledgment hoặc một lỗi ngay khoảnh khắc nó nhận được message và ghi vào file dữ liệu của partition (nhưng không nhất thiết đã sync xuống đĩa). Chúng ta có thể mất dữ liệu nếu leader tắt hoặc sập và một số message đã được ghi thành công vào leader và đã được acknowledge nhưng chưa được replicate sang các follower trước khi sập. Với cấu hình này, cũng có khả năng chúng ta ghi vào leader nhanh hơn tốc độ nó có thể replicate message và kết thúc với các partition bị under-replicated, vì leader sẽ acknowledge message từ producer trước khi replicate chúng.

**`acks=all`**

Nghĩa là leader sẽ chờ cho tới khi tất cả các in-sync replica nhận được message trước khi gửi lại acknowledgment hoặc lỗi. Kết hợp với cấu hình `min.insync.replicas` trên broker, điều này cho phép chúng ta kiểm soát bao nhiêu replica phải nhận được message trước khi nó được acknowledge. Đây là lựa chọn an toàn nhất — producer sẽ không ngừng cố gắng gửi message cho tới khi nó được commit hoàn toàn. Đây cũng là lựa chọn có producer latency dài nhất — producer chờ tất cả các in-sync replica nhận được toàn bộ message trước khi có thể đánh dấu batch message là "xong" và đi tiếp.

### Cấu hình retry cho producer (Configuring Producer Retries)

Có hai phần trong việc xử lý lỗi ở producer: những lỗi mà producer tự động xử lý giùm chúng ta và những lỗi mà chúng ta, với tư cách lập trình viên sử dụng thư viện producer, phải tự xử lý.

Producer có thể xử lý các lỗi có thể retry (retriable error). Khi producer gửi message tới một broker, broker có thể trả về hoặc một thành công hoặc một mã lỗi. Những mã lỗi này thuộc về hai nhóm — những lỗi có thể được giải quyết sau khi retry và những lỗi sẽ không được giải quyết. Ví dụ, nếu broker trả về mã lỗi `LEADER_NOT_AVAILABLE`, producer có thể thử gửi lại message — có lẽ một broker mới đã được bầu làm leader và lần thử thứ hai sẽ thành công. Điều này nghĩa là `LEADER_NOT_AVAILABLE` là một lỗi có thể retry. Ngược lại, nếu một broker trả về ngoại lệ `INVALID_CONFIG`, việc thử lại cùng message đó sẽ không làm thay đổi cấu hình. Đây là một ví dụ về lỗi không thể retry.

Nói chung, khi mục tiêu của chúng ta là không bao giờ mất một message nào, cách tiếp cận tốt nhất là cấu hình producer tiếp tục cố gắng gửi message khi nó gặp một lỗi có thể retry. Và cách tiếp cận tốt nhất cho retry, như đã khuyến nghị ở Chương 3, là để nguyên số lần retry ở giá trị mặc định hiện tại (`MAX_INT`, hay thực chất là vô hạn) và dùng `delivery.timout.ms` để cấu hình khoảng thời gian tối đa mà chúng ta sẵn sàng chờ trước khi bỏ cuộc trong việc gửi một message — producer sẽ retry gửi message nhiều lần nhất có thể trong khoảng thời gian này.

Việc retry gửi một message thất bại kèm theo rủi ro là cả hai message đều được ghi thành công vào broker, dẫn tới trùng lặp. Retry cùng với việc xử lý lỗi cẩn thận có thể bảo đảm mỗi message sẽ được lưu ít nhất một lần (at-least-once), nhưng không phải đúng một lần (exactly-once). Dùng `enable.idempotence=true` sẽ khiến producer đưa thêm thông tin bổ sung vào các record của nó, và các broker sẽ dùng thông tin đó để bỏ qua các message trùng lặp do retry gây ra. Ở Chương 8, chúng ta sẽ thảo luận chi tiết về việc này hoạt động như thế nào và khi nào.

### Xử lý lỗi bổ sung (Additional Error Handling)

Sử dụng cơ chế retry có sẵn của producer là một cách dễ dàng để xử lý đúng đắn nhiều loại lỗi mà không mất message, nhưng với tư cách lập trình viên, chúng ta vẫn phải có khả năng xử lý những loại lỗi khác. Chúng bao gồm:

- Các lỗi broker không thể retry, chẳng hạn như lỗi liên quan đến kích thước message, lỗi authorization, v.v.
- Các lỗi xảy ra trước khi message được gửi tới broker — ví dụ, lỗi serialization
- Các lỗi xảy ra khi producer đã dùng hết mọi lần retry hoặc khi bộ nhớ khả dụng mà producer sử dụng đã đầy tới giới hạn do dùng hết bộ nhớ để lưu message trong lúc retry
- Timeout

Ở Chương 3, chúng ta đã thảo luận cách viết các error handler cho cả hai phương thức gửi message đồng bộ và bất đồng bộ. Nội dung của những error handler này phụ thuộc vào từng ứng dụng cụ thể và mục tiêu của nó — chúng ta có vứt bỏ những "message xấu" không? Ghi log lỗi? Ngừng đọc message từ hệ thống nguồn? Áp dụng back pressure lên hệ thống nguồn để ngừng gửi message trong một khoảng thời gian? Lưu những message này vào một thư mục trên đĩa cục bộ? Những quyết định này phụ thuộc vào kiến trúc và yêu cầu sản phẩm. Chỉ cần lưu ý rằng nếu tất cả những gì error handler làm chỉ là retry gửi message, thì tốt hơn hết chúng ta nên dựa vào chính chức năng retry của producer.

## Sử dụng consumer trong một hệ thống tin cậy (Using Consumers in a Reliable System)

Giờ khi đã học được cách produce dữ liệu trong khi tính đến các bảo đảm độ tin cậy của Kafka, đã đến lúc xem cách consume dữ liệu. Như chúng ta đã thấy ở phần đầu chương này, dữ liệu chỉ khả dụng cho consumer sau khi nó đã được commit vào Kafka — nghĩa là nó đã được ghi vào tất cả các in-sync replica. Điều này nghĩa là consumer nhận được dữ liệu được bảo đảm là nhất quán. Điều duy nhất còn lại mà consumer phải làm là bảo đảm chúng theo dõi được những message nào chúng đã đọc và những message nào chưa. Đây là mấu chốt để không mất message trong quá trình consume.

Khi đọc dữ liệu từ một partition, consumer đang fetch một batch message, kiểm tra offset cuối cùng trong batch, rồi yêu cầu một batch message khác bắt đầu từ offset cuối cùng đã nhận. Điều này bảo đảm rằng một Kafka consumer sẽ luôn nhận được dữ liệu mới theo đúng thứ tự mà không bỏ sót message nào.

Khi một consumer dừng lại, một consumer khác cần biết phải tiếp tục công việc từ đâu — offset cuối cùng mà consumer trước đã xử lý trước khi nó dừng là gì? Consumer "khác" đó thậm chí có thể chính là consumer ban đầu sau khi khởi động lại. Điều đó không thực sự quan trọng — sẽ có một consumer nào đó tiếp tục consume từ partition đó, và nó cần biết bắt đầu từ offset nào. Đây là lý do các consumer cần "commit" offset của chúng. Với mỗi partition mà nó đang consume, consumer lưu lại vị trí hiện tại của mình, để chính nó hoặc một consumer khác biết phải tiếp tục từ đâu sau khi khởi động lại. Cách chính khiến consumer có thể mất message là khi commit offset cho những event chúng đã đọc nhưng chưa xử lý xong. Như vậy, khi một consumer khác tiếp nhận công việc, nó sẽ bỏ qua những message đó và chúng sẽ không bao giờ được xử lý. Đây là lý do việc chú ý cẩn thận tới thời điểm và cách thức commit offset là cực kỳ quan trọng.

> **MESSAGE ĐÃ COMMIT SO VỚI OFFSET ĐÃ COMMIT (COMMITTED MESSAGES VERSUS COMMITTED OFFSETS)**
>
> Điều này khác với một message đã commit, vốn như đã thảo luận trước đó, là message đã được ghi vào tất cả các in-sync replica và khả dụng cho các consumer. Offset đã commit là những offset mà consumer đã gửi tới Kafka để xác nhận rằng nó đã nhận và xử lý toàn bộ các message trong một partition cho tới offset cụ thể này.

Ở Chương 4, chúng ta đã thảo luận chi tiết về Consumer API và đã đề cập nhiều phương thức để commit offset. Ở đây chúng ta sẽ đề cập một số cân nhắc và lựa chọn quan trọng, nhưng hãy quay lại Chương 4 để biết chi tiết về cách sử dụng các API.

### Các thuộc tính cấu hình consumer quan trọng cho việc xử lý tin cậy (Important Consumer Configuration Properties for Reliable Processing)

Có bốn thuộc tính cấu hình consumer quan trọng cần hiểu để cấu hình consumer của chúng ta theo hành vi độ tin cậy mong muốn.

Thuộc tính thứ nhất là `group.id`, như đã giải thích rất chi tiết ở Chương 4. Ý tưởng cơ bản là nếu hai consumer có cùng group ID và subscribe cùng một topic, mỗi consumer sẽ được gán một tập con các partition trong topic đó và do đó sẽ chỉ đọc một tập con các message xét riêng từng consumer (nhưng toàn bộ message sẽ được đọc bởi cả consumer group xét như một tổng thể). Nếu chúng ta cần một consumer tự nó nhìn thấy từng message trong các topic mà nó subscribe, nó sẽ cần một `group.id` riêng biệt.

Cấu hình liên quan thứ hai là `auto.offset.reset`. Tham số này kiểm soát việc consumer sẽ làm gì khi chưa có offset nào được commit (ví dụ, khi consumer khởi động lần đầu) hoặc khi consumer yêu cầu những offset không tồn tại trên broker (Chương 4 giải thích việc này có thể xảy ra như thế nào). Chỉ có hai lựa chọn ở đây. Nếu chúng ta chọn `earliest`, consumer sẽ bắt đầu từ đầu partition mỗi khi nó không có một offset hợp lệ. Điều này có thể dẫn tới việc consumer xử lý rất nhiều message hai lần, nhưng nó bảo đảm giảm thiểu mất dữ liệu. Nếu chúng ta chọn `latest`, consumer sẽ bắt đầu từ cuối partition. Điều này giảm thiểu việc xử lý trùng lặp bởi consumer nhưng gần như chắc chắn dẫn tới việc một số message bị consumer bỏ sót.

Cấu hình liên quan thứ ba là `enable.auto.commit`. Đây là một quyết định lớn: chúng ta sẽ để consumer commit offset giùm chúng ta theo lịch, hay chúng ta dự định commit offset thủ công trong code của mình? Lợi ích chính của việc tự động commit offset là bớt được một thứ phải lo lắng khi sử dụng consumer trong ứng dụng. Khi chúng ta thực hiện toàn bộ việc xử lý các record đã consume ngay bên trong vòng lặp poll của consumer, thì việc tự động commit offset bảo đảm chúng ta sẽ không bao giờ vô tình commit một offset mà chúng ta chưa xử lý. Nhược điểm chính của việc tự động commit offset là chúng ta không kiểm soát được số lượng record trùng lặp mà ứng dụng có thể xử lý do nó bị dừng sau khi xử lý một số record nhưng trước khi lần commit tự động kịp diễn ra. Khi ứng dụng có phần xử lý phức tạp hơn, chẳng hạn như chuyển record sang một thread khác để xử lý ở nền, thì không còn lựa chọn nào khác ngoài việc dùng commit offset thủ công, vì việc commit tự động có thể commit offset cho những record mà consumer đã đọc nhưng có lẽ chưa xử lý.

Cấu hình liên quan thứ tư, `auto.commit.interval.ms`, gắn liền với cấu hình thứ ba. Nếu chúng ta chọn commit offset tự động, cấu hình này cho phép chúng ta cấu hình tần suất chúng được commit. Mặc định là mỗi năm giây. Nói chung, commit thường xuyên hơn làm tăng chi phí phát sinh (overhead) nhưng giảm số lượng bản trùng lặp có thể xảy ra khi một consumer dừng.

Tuy không liên quan trực tiếp tới việc xử lý dữ liệu tin cậy, nhưng khó có thể coi một consumer là tin cậy nếu nó thường xuyên ngừng consume để rebalance. Chương 4 bao gồm lời khuyên về cách cấu hình consumer để giảm thiểu rebalance không cần thiết và giảm thiểu các khoảng dừng trong lúc rebalance.

### Commit offset một cách tường minh trong consumer (Explicitly Committing Offsets in Consumers)

Nếu chúng ta quyết định cần kiểm soát nhiều hơn và chọn commit offset thủ công, chúng ta cần quan tâm tới những hệ quả về tính đúng đắn và về hiệu năng.

Chúng ta sẽ không đi qua các cơ chế và API liên quan tới việc commit offset ở đây, vì chúng đã được trình bày rất sâu ở Chương 4. Thay vào đó, chúng ta sẽ điểm lại những cân nhắc quan trọng khi phát triển một consumer để xử lý dữ liệu một cách tin cậy. Chúng ta sẽ bắt đầu với những điểm đơn giản và có lẽ hiển nhiên, rồi chuyển sang những mẫu (pattern) phức tạp hơn.

#### Luôn commit offset sau khi các message đã được xử lý

Nếu chúng ta thực hiện toàn bộ việc xử lý bên trong vòng lặp poll và không duy trì trạng thái giữa các vòng lặp poll (ví dụ, cho việc tổng hợp), thì điều này khá dễ. Chúng ta có thể dùng cấu hình auto-commit, commit offset ở cuối vòng lặp poll, hoặc commit offset bên trong vòng lặp với tần suất cân bằng giữa yêu cầu về overhead và yêu cầu về việc không xử lý trùng lặp. Nếu có thêm các thread hoặc có xử lý stateful, việc này trở nên phức tạp hơn, đặc biệt vì đối tượng consumer không thread safe. Ở Chương 4, chúng ta đã thảo luận cách làm điều này và cung cấp các tham chiếu kèm ví dụ bổ sung.

#### Tần suất commit là một đánh đổi giữa hiệu năng và số lượng bản trùng lặp khi xảy ra sự cố sập

Ngay cả trong trường hợp đơn giản nhất khi chúng ta thực hiện toàn bộ việc xử lý bên trong vòng lặp poll và không duy trì trạng thái giữa các vòng lặp poll, chúng ta vẫn có thể chọn commit nhiều lần trong một vòng lặp hoặc chọn chỉ commit sau vài vòng lặp. Việc commit có chi phí phát sinh đáng kể về hiệu năng. Nó tương tự như produce với `acks=all`, nhưng tất cả các lần commit offset của một consumer group đều được produce tới cùng một broker, và broker này có thể bị quá tải. Tần suất commit phải cân bằng giữa yêu cầu về hiệu năng và yêu cầu về việc không có bản trùng lặp. Việc commit sau mỗi message chỉ nên thực hiện trên những topic có throughput rất thấp.

#### Commit đúng offset vào đúng thời điểm

Một cạm bẫy phổ biến khi commit ở giữa vòng lặp poll là vô tình commit offset cuối cùng đã đọc được khi poll thay vì offset ngay sau offset cuối cùng đã xử lý. Hãy nhớ rằng điều tối quan trọng là luôn commit offset cho các message sau khi chúng đã được xử lý — commit offset cho những message đã đọc nhưng chưa xử lý có thể dẫn tới việc consumer bỏ sót message. Chương 4 có các ví dụ minh họa cách làm đúng điều đó.

#### Rebalance

Khi thiết kế một ứng dụng, chúng ta cần nhớ rằng consumer rebalance sẽ xảy ra, và chúng ta cần xử lý chúng đúng cách. Chương 4 chứa một vài ví dụ. Việc này thường bao gồm commit offset trước khi các partition bị thu hồi (revoked) và dọn dẹp mọi trạng thái mà ứng dụng đang duy trì khi nó được gán các partition mới.

#### Consumer có thể cần retry

Trong một số trường hợp, sau khi gọi poll và xử lý các record, một số record chưa được xử lý hoàn toàn và sẽ cần được xử lý sau. Ví dụ, chúng ta có thể thử ghi các record từ Kafka vào một cơ sở dữ liệu nhưng phát hiện cơ sở dữ liệu đang không khả dụng vào thời điểm đó và chúng ta cần retry sau. Lưu ý rằng khác với các hệ thống nhắn tin pub/sub truyền thống, consumer của Kafka commit offset chứ không "ack" từng message riêng lẻ. Điều này nghĩa là nếu chúng ta xử lý thất bại record #30 và xử lý thành công record #31, chúng ta không nên commit offset #31 — làm vậy sẽ đánh dấu là đã xử lý tất cả các record cho tới #31 bao gồm cả #30, điều mà thường không phải là ý muốn của chúng ta.

Thay vào đó, hãy thử theo một trong hai mẫu sau đây.

Một lựa chọn khi chúng ta gặp một lỗi có thể retry là commit record cuối cùng mà chúng ta đã xử lý thành công. Sau đó chúng ta sẽ lưu những record vẫn cần được xử lý vào một buffer (để lần poll tiếp theo không ghi đè lên chúng), dùng phương thức `pause()` của consumer để bảo đảm những lần poll bổ sung sẽ không trả về dữ liệu, và tiếp tục cố gắng xử lý các record đó.

Lựa chọn thứ hai khi gặp một lỗi có thể retry là ghi nó vào một topic riêng và đi tiếp. Một consumer group riêng có thể được dùng để xử lý các lần retry từ topic retry đó, hoặc một consumer có thể subscribe cả topic chính lẫn topic retry nhưng pause topic retry giữa các lần retry. Mẫu này tương tự như hệ thống dead-letter-queue được dùng trong nhiều hệ thống nhắn tin.

#### Consumer có thể cần duy trì trạng thái

Trong một số ứng dụng, chúng ta cần duy trì trạng thái xuyên suốt nhiều lần gọi poll. Ví dụ, nếu muốn tính trung bình trượt (moving average), chúng ta sẽ muốn cập nhật giá trị trung bình sau mỗi lần poll Kafka để lấy message mới. Nếu tiến trình của chúng ta được khởi động lại, chúng ta sẽ không chỉ cần bắt đầu consume từ offset cuối cùng, mà còn cần khôi phục giá trị trung bình trượt tương ứng. Một cách để làm điều này là ghi giá trị tích lũy mới nhất vào một topic "results" cùng lúc với khi ứng dụng commit offset. Điều này nghĩa là khi một thread khởi động, nó có thể lấy giá trị tích lũy mới nhất khi bắt đầu và tiếp tục ngay từ chỗ nó đã dừng lại. Ở Chương 8, chúng ta sẽ thảo luận cách một ứng dụng có thể ghi kết quả và commit offset trong cùng một transaction. Nói chung, đây là một bài toán khá phức tạp để giải quyết, và chúng tôi khuyến nghị nên xem xét một thư viện như Kafka Streams hoặc Flink, vốn cung cấp các API kiểu DSL mức cao cho việc tổng hợp, join, window, và các phân tích phức tạp khác.

## Kiểm chứng độ tin cậy của hệ thống (Validating System Reliability)

Một khi đã trải qua quá trình xác định các yêu cầu về độ tin cậy, cấu hình các broker, cấu hình các client, và sử dụng các API theo cách tốt nhất cho bài toán của mình, chúng ta có thể thảnh thơi chạy mọi thứ trên production, tự tin rằng sẽ không bao giờ có event nào bị bỏ lỡ, phải không? Chúng tôi khuyến nghị nên kiểm chứng trước đã, và đề xuất ba lớp kiểm chứng: kiểm chứng cấu hình, kiểm chứng ứng dụng, và giám sát ứng dụng trên production. Hãy cùng xem xét từng bước này và tìm hiểu chúng ta cần kiểm chứng cái gì và bằng cách nào.

### Kiểm chứng cấu hình (Validating Configuration)

Rất dễ để kiểm thử cấu hình broker và client một cách tách biệt khỏi logic ứng dụng, và việc này được khuyến nghị vì hai lý do:

- Nó giúp kiểm tra xem cấu hình chúng ta đã chọn có thể đáp ứng các yêu cầu của mình hay không.
- Đó là một bài tập tốt để suy luận thấu đáo về hành vi kỳ vọng của hệ thống.

Kafka bao gồm hai công cụ quan trọng để hỗ trợ việc kiểm chứng này. Package `org.apache.kafka.tools` bao gồm các class `VerifiableProducer` và `VerifiableConsumer`. Chúng có thể chạy như những công cụ dòng lệnh hoặc được nhúng vào một framework kiểm thử tự động.

Ý tưởng là verifiable producer sẽ produce một dãy message chứa các số từ 1 tới một giá trị mà chúng ta chọn. Chúng ta có thể cấu hình verifiable producer theo đúng cách chúng ta cấu hình producer của mình, thiết lập đúng số lượng `acks`, `retries`, `delivery.timeout.ms`, và tốc độ produce message. Khi chạy nó, nó sẽ in ra thành công hoặc lỗi cho từng message được gửi tới broker, dựa trên các `acks` nhận được. Verifiable consumer thực hiện phép kiểm tra bổ trợ. Nó consume các event (thường là những event được produce bởi verifiable producer) và in ra các event nó đã consume theo thứ tự. Nó cũng in ra thông tin liên quan tới commit và rebalance.

Điều quan trọng là cân nhắc xem chúng ta muốn chạy những bài kiểm thử nào. Ví dụ:

- Leader election: điều gì xảy ra nếu chúng ta giết leader? Producer và consumer mất bao lâu để bắt đầu hoạt động bình thường trở lại?
- Controller election: hệ thống mất bao lâu để hoạt động trở lại sau khi khởi động lại controller?
- Rolling restart: chúng ta có thể khởi động lại lần lượt từng broker mà không mất message nào không?
- Kiểm thử unclean leader election: điều gì xảy ra khi chúng ta giết lần lượt từng replica của một partition (để bảo đảm mỗi replica đều rơi ra khỏi trạng thái in sync) rồi khởi động một broker vốn đã out of sync? Cần điều gì xảy ra để có thể tiếp tục vận hành? Điều đó có chấp nhận được không?

Sau đó chúng ta chọn một kịch bản, khởi động verifiable producer, khởi động verifiable consumer, và chạy qua kịch bản đó — ví dụ, giết leader của partition mà chúng ta đang produce dữ liệu vào. Nếu chúng ta kỳ vọng một khoảng dừng ngắn rồi mọi thứ tiếp tục bình thường mà không mất message, chúng ta cần bảo đảm rằng số lượng message được produce bởi producer và số lượng message được consume bởi consumer khớp nhau.

Kho mã nguồn của Apache Kafka bao gồm một bộ kiểm thử phong phú. Nhiều bài kiểm thử trong bộ này dựa trên cùng nguyên tắc đó và dùng verifiable producer cùng verifiable consumer để bảo đảm rằng các bản nâng cấp cuốn chiếu (rolling upgrade) hoạt động đúng.

### Kiểm chứng ứng dụng (Validating Applications)

Một khi đã chắc chắn rằng cấu hình broker và client đáp ứng các yêu cầu của mình, đã đến lúc kiểm thử xem ứng dụng có cung cấp những bảo đảm mà chúng ta cần hay không. Việc này sẽ kiểm tra những thứ như code xử lý lỗi tùy chỉnh, việc commit offset, các rebalance listener, và những chỗ tương tự nơi logic ứng dụng tương tác với các thư viện client của Kafka.

Đương nhiên, vì logic ứng dụng có thể rất khác nhau, chúng tôi chỉ có thể đưa ra một mức hướng dẫn nhất định về cách kiểm thử nó. Chúng tôi khuyến nghị đưa integration test cho ứng dụng vào như một phần của bất kỳ quy trình phát triển nào, và chúng tôi khuyến nghị chạy các bài kiểm thử dưới nhiều điều kiện sự cố khác nhau:

- Client mất kết nối tới một trong các broker
- Latency cao giữa client và broker
- Đĩa đầy
- Đĩa bị treo (còn gọi là "brown out")
- Leader election
- Rolling restart các broker
- Rolling restart các consumer
- Rolling restart các producer

Có rất nhiều công cụ có thể được dùng để tiêm lỗi mạng và lỗi đĩa, và nhiều công cụ trong số đó rất tốt, nên chúng tôi sẽ không cố đưa ra khuyến nghị cụ thể. Bản thân Apache Kafka bao gồm framework kiểm thử Trogdor để tiêm lỗi (fault injection). Với mỗi kịch bản, chúng ta sẽ có một hành vi kỳ vọng, tức là điều chúng ta dự tính sẽ thấy khi phát triển ứng dụng. Sau đó chúng ta chạy bài kiểm thử để xem điều gì thực sự xảy ra. Ví dụ, khi lập kế hoạch cho một đợt rolling restart các consumer, chúng ta dự tính sẽ có một khoảng dừng ngắn trong lúc các consumer rebalance rồi tiếp tục consume với không quá 1.000 giá trị trùng lặp. Bài kiểm thử của chúng ta sẽ cho thấy liệu cách ứng dụng commit offset và xử lý rebalance có thực sự hoạt động theo cách này hay không.

### Giám sát độ tin cậy trên production (Monitoring Reliability in Production)

Kiểm thử ứng dụng là quan trọng, nhưng nó không thay thế được nhu cầu liên tục giám sát các hệ thống production để bảo đảm dữ liệu đang chảy đúng như kỳ vọng. Chương 12 sẽ trình bày các gợi ý chi tiết về cách giám sát Kafka cluster, nhưng ngoài việc giám sát sức khỏe của cluster, điều quan trọng là cũng phải giám sát các client và dòng chảy dữ liệu xuyên suốt hệ thống.

Các Java client của Kafka bao gồm các JMX metric cho phép giám sát trạng thái và event ở phía client. Với các producer, hai metric quan trọng nhất đối với độ tin cậy là error-rate và retry-rate trên mỗi record (đã tổng hợp). Hãy để mắt tới chúng, vì tỷ lệ lỗi hoặc tỷ lệ retry tăng lên có thể cho thấy có vấn đề với hệ thống. Cũng hãy giám sát log của producer để phát hiện các lỗi xảy ra khi gửi event vốn được ghi log ở mức WARN, và có nội dung đại loại như "Got error produce response with correlation id 5689 on topic-partition [topic-1,3], retrying (two attempts left). Error: …" Khi chúng ta thấy các event với 0 lần thử còn lại, tức là producer đang cạn kiệt số lần retry. Ở Chương 3, chúng ta đã thảo luận cách cấu hình `delivery.timeout.ms` và `retries` để cải thiện việc xử lý lỗi ở producer và tránh cạn kiệt số lần retry quá sớm. Tất nhiên, luôn tốt hơn nếu giải quyết được ngay từ đầu vấn đề đã gây ra các lỗi đó. Các thông điệp log ở mức ERROR trên producer nhiều khả năng cho thấy việc gửi message đã thất bại hoàn toàn do một lỗi không thể retry, một lỗi có thể retry nhưng đã cạn kiệt số lần retry, hoặc một timeout. Khi có thể, lỗi chính xác từ broker cũng sẽ được ghi log.

Về phía consumer, metric quan trọng nhất là consumer lag. Metric này cho biết consumer đang cách xa bao nhiêu so với message mới nhất đã được commit vào partition trên broker. Lý tưởng thì lag luôn bằng không và consumer sẽ luôn đọc message mới nhất. Trên thực tế, vì việc gọi `poll()` trả về nhiều message và sau đó consumer dành thời gian xử lý chúng trước khi fetch thêm message, lag sẽ luôn dao động một chút. Điều quan trọng là bảo đảm các consumer rốt cuộc bắt kịp chứ không tụt lại ngày càng xa. Do sự dao động dự kiến của consumer lag, việc thiết lập các cảnh báo truyền thống trên metric này có thể là một thách thức. Burrow là một công cụ kiểm tra consumer lag của LinkedIn và có thể giúp việc này dễ dàng hơn.

Giám sát dòng chảy dữ liệu cũng có nghĩa là bảo đảm rằng toàn bộ dữ liệu được produce đều được consume trong một khoảng thời gian hợp lý ("khoảng thời gian hợp lý" thường dựa trên yêu cầu nghiệp vụ). Để bảo đảm dữ liệu được consume kịp thời, chúng ta cần biết dữ liệu được produce khi nào. Kafka hỗ trợ điều này: bắt đầu từ phiên bản 0.10.0, mọi message đều bao gồm một timestamp cho biết event được produce khi nào (tuy nhiên, lưu ý rằng giá trị này có thể bị ghi đè bởi ứng dụng gửi event hoặc bởi chính các broker nếu chúng được cấu hình để làm vậy).

Để bảo đảm mọi message được produce đều được consume trong một khoảng thời gian hợp lý, chúng ta sẽ cần ứng dụng produce message ghi nhận số lượng event được produce (thường là số event mỗi giây). Các consumer cần ghi nhận số lượng event được consume trên mỗi đơn vị thời gian, và độ trễ tính từ thời điểm event được produce tới thời điểm chúng được consume, sử dụng timestamp của event. Sau đó chúng ta sẽ cần một hệ thống để đối chiếu các con số event mỗi giây từ cả producer và consumer (để bảo đảm không có message nào bị mất trên đường đi) và để bảo đảm khoảng cách giữa thời điểm produce và thời điểm consume là hợp lý. Loại hệ thống giám sát đầu-cuối này có thể là một thách thức và tốn nhiều thời gian để triển khai. Theo hiểu biết tốt nhất của chúng tôi, chưa có một triển khai mã nguồn mở nào cho loại hệ thống này, nhưng Confluent cung cấp một triển khai thương mại như một phần của Confluent Control Center.

Ngoài việc giám sát các client và dòng chảy dữ liệu đầu-cuối, các Kafka broker còn có những metric chỉ ra tỷ lệ các phản hồi lỗi được gửi từ broker tới client. Chúng tôi khuyến nghị thu thập `kafka.server:type=BrokerTopicMetrics,name=FailedProduceRequestsPerSec` và `kafka.server:type=BrokerTopicMetrics,name=FailedFetchRequestsPerSec`. Đôi khi, một mức độ phản hồi lỗi nhất định là điều được dự kiến — ví dụ, nếu chúng ta tắt một broker để bảo trì và các leader mới được bầu trên một broker khác, thì việc các producer nhận lỗi `NOT_LEADER_FOR_PARTITION` là điều được dự kiến, và lỗi này sẽ khiến chúng yêu cầu metadata cập nhật trước khi tiếp tục produce event như bình thường. Những đợt tăng không giải thích được của các request thất bại thì luôn cần được điều tra. Để hỗ trợ những cuộc điều tra như vậy, các metric về request thất bại được gắn nhãn (tag) với phản hồi lỗi cụ thể mà broker đã gửi.

## Tổng kết (Summary)

Như chúng tôi đã nói ở đầu chương, độ tin cậy không chỉ là vấn đề của các tính năng cụ thể của Kafka. Chúng ta cần xây dựng cả một hệ thống tin cậy, bao gồm kiến trúc ứng dụng, cách các ứng dụng sử dụng Producer API và Consumer API, cấu hình producer và consumer, cấu hình topic, và cấu hình broker. Làm cho hệ thống tin cậy hơn luôn kéo theo những đánh đổi về độ phức tạp của ứng dụng, hiệu năng, tính sẵn sàng, hoặc dung lượng đĩa sử dụng. Bằng cách hiểu tất cả các lựa chọn và các mẫu phổ biến, cùng với việc hiểu các yêu cầu của từng tình huống sử dụng, chúng ta có thể đưa ra những quyết định có cơ sở về mức độ tin cậy mà ứng dụng và việc triển khai Kafka cần có, cũng như những đánh đổi nào là hợp lý.
