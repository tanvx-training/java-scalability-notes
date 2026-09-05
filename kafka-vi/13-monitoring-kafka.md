# Chương 13. Giám sát Kafka (Monitoring Kafka)

Các ứng dụng Apache Kafka cung cấp rất nhiều phép đo về hoạt động của chúng — nhiều đến mức rất dễ trở nên bối rối không biết cái gì là quan trọng cần theo dõi và cái gì có thể bỏ qua. Chúng trải dài từ những metric đơn giản về tốc độ lưu lượng tổng thể, đến các metric đo thời gian chi tiết cho từng loại request, cho đến các metric theo từng topic và từng partition. Chúng cung cấp một góc nhìn chi tiết vào mọi thao tác trong broker, nhưng cũng có thể biến bạn thành nỗi ám ảnh của bất kỳ ai chịu trách nhiệm quản lý hệ thống giám sát của bạn.

Chương này sẽ trình bày chi tiết các metric quan trọng nhất cần giám sát mọi lúc và cách phản ứng với chúng. Chúng ta cũng sẽ mô tả một số metric quan trọng hơn cần có sẵn khi gỡ lỗi (debug) các sự cố. Tuy nhiên, đây không phải là một danh sách đầy đủ tất cả các metric hiện có, bởi vì danh sách đó thay đổi thường xuyên, và nhiều metric chỉ có ý nghĩa với một nhà phát triển Kafka thực thụ.

## Kiến thức cơ bản về metric (Metric Basics)

Trước khi đi vào các metric cụ thể do Kafka broker và các client cung cấp, hãy cùng bàn về những kiến thức cơ bản của việc giám sát ứng dụng Java và một số thực hành tốt nhất xoay quanh việc giám sát và cảnh báo. Điều này sẽ tạo nền tảng để hiểu cách giám sát các ứng dụng và vì sao các metric cụ thể được mô tả ở phần sau của chương này lại được chọn là quan trọng nhất.

### Các metric nằm ở đâu?

Tất cả các metric mà Kafka phơi bày (expose) đều có thể được truy cập thông qua giao diện Java Management Extensions (JMX). Cách dễ nhất để sử dụng chúng trong một hệ thống giám sát bên ngoài là dùng một collection agent do hệ thống giám sát của bạn cung cấp và gắn nó vào tiến trình Kafka. Đó có thể là một tiến trình riêng biệt chạy trên hệ thống và kết nối tới giao diện JMX, chẳng hạn như plug-in `check_jmx` của Nagios XI hoặc `jmxtrans`. Bạn cũng có thể tận dụng một JMX agent chạy trực tiếp bên trong tiến trình Kafka để truy cập metric qua kết nối HTTP, chẳng hạn như Jolokia hoặc MX4J.

Việc thảo luận sâu về cách thiết lập các monitoring agent nằm ngoài phạm vi của chương này, và có quá nhiều lựa chọn để có thể trình bày trọn vẹn tất cả. Nếu tổ chức của bạn hiện chưa có kinh nghiệm giám sát ứng dụng Java, có lẽ bạn nên cân nhắc dùng dịch vụ giám sát (monitoring as a service). Có nhiều công ty cung cấp trọn gói dịch vụ gồm monitoring agent, điểm thu thập metric, lưu trữ, vẽ biểu đồ và cảnh báo. Họ có thể hỗ trợ bạn thêm trong việc thiết lập các monitoring agent cần thiết.

> **TÌM CỔNG JMX**
>
> Để hỗ trợ việc cấu hình các ứng dụng kết nối trực tiếp tới JMX trên Kafka broker, chẳng hạn như các hệ thống giám sát, broker sẽ ghi cổng JMX đã cấu hình vào thông tin broker được lưu trong ZooKeeper. Znode `/brokers/ids/<ID>` chứa dữ liệu định dạng JSON cho broker, bao gồm các key `hostname` và `jmx_port`. Tuy nhiên, cần lưu ý rằng JMX từ xa (remote JMX) bị vô hiệu hóa theo mặc định trong Kafka vì lý do bảo mật. Nếu bạn định bật nó, bạn phải cấu hình bảo mật cho cổng đó một cách đúng đắn. Lý do là vì JMX không chỉ cho phép nhìn vào trạng thái của ứng dụng, nó còn cho phép thực thi mã. Khuyến nghị mạnh mẽ là bạn nên dùng một JMX metrics agent được nạp vào bên trong ứng dụng.

#### Metric không đến từ ứng dụng (Nonapplication metrics)

Không phải mọi metric đều đến từ chính Kafka. Có năm nhóm chung về nơi bạn có thể lấy metric. Bảng 13-1 mô tả các nhóm này khi chúng ta giám sát các Kafka broker.

**Bảng 13-1. Các nguồn metric**

| Nhóm | Mô tả |
|---|---|
| Application metrics (metric ứng dụng) | Đây là các metric bạn lấy được từ chính Kafka, qua giao diện JMX. |
| Logs | Một loại dữ liệu giám sát khác cũng đến từ chính Kafka. Vì nó ở dạng văn bản hoặc dữ liệu có cấu trúc, chứ không chỉ là một con số, nên nó đòi hỏi xử lý nhiều hơn một chút. |
| Infrastructure metrics (metric hạ tầng) | Các metric này đến từ những hệ thống mà bạn đặt phía trước Kafka nhưng vẫn nằm trong đường đi của request và nằm dưới sự kiểm soát của bạn. Một ví dụ là load balancer. |
| Synthetic clients (client tổng hợp) | Đây là dữ liệu từ các công cụ nằm ngoài hệ thống triển khai Kafka của bạn, giống như một client, nhưng nằm dưới sự kiểm soát trực tiếp của bạn và thường không thực hiện cùng công việc như các client của bạn. Một bộ giám sát bên ngoài như Kafka Monitor thuộc nhóm này. |
| Client metrics (metric client) | Đây là các metric được phơi bày bởi các Kafka client kết nối tới cluster của bạn. |

Log do Kafka sinh ra sẽ được bàn tới ở phần sau của chương này, cũng như các client metric. Chúng ta cũng sẽ đề cập rất ngắn gọn tới synthetic metric. Tuy nhiên, infrastructure metric phụ thuộc vào môi trường cụ thể của bạn và nằm ngoài phạm vi thảo luận ở đây. Bạn càng đi xa trên hành trình Kafka của mình, các nguồn metric này càng trở nên quan trọng để hiểu đầy đủ cách ứng dụng của bạn đang chạy, bởi vì càng xuống dưới trong danh sách, chúng càng cung cấp một góc nhìn khách quan hơn về Kafka. Ví dụ, dựa vào metric từ các broker của bạn là đủ ở giai đoạn đầu, nhưng về sau bạn sẽ muốn có một góc nhìn khách quan hơn về hiệu năng của chúng.

Một ví dụ quen thuộc về giá trị của các phép đo khách quan là giám sát sức khỏe của một website. Web server đang chạy đúng, và tất cả các metric mà nó báo cáo đều nói rằng nó đang hoạt động. Tuy nhiên, có vấn đề với mạng giữa web server của bạn và người dùng bên ngoài, nghĩa là không người dùng nào truy cập được web server. Một synthetic client chạy bên ngoài mạng của bạn và kiểm tra khả năng truy cập website sẽ phát hiện điều này và cảnh báo cho bạn về tình huống đó.

### Tôi cần những metric nào?

Câu hỏi metric nào là quan trọng đối với bạn cũng hóc búa gần như câu hỏi trình soạn thảo nào là tốt nhất. Nó phụ thuộc đáng kể vào việc bạn định làm gì với chúng, bạn có sẵn công cụ gì để thu thập dữ liệu, bạn đã đi được bao xa trong việc sử dụng Kafka, và bạn có bao nhiêu thời gian để dành cho việc xây dựng hạ tầng xung quanh Kafka. Một nhà phát triển các thành phần bên trong broker sẽ có nhu cầu rất khác so với một site reliability engineer đang vận hành một hệ thống Kafka.

#### Cảnh báo hay gỡ lỗi?

Câu hỏi đầu tiên bạn nên tự đặt ra là mục tiêu chính của bạn là cảnh báo cho bạn khi có sự cố với Kafka, hay là gỡ lỗi các sự cố đã xảy ra. Câu trả lời thường sẽ bao gồm một chút của cả hai, nhưng việc biết một metric phục vụ mục đích nào sẽ cho phép bạn đối xử với nó khác đi sau khi thu thập.

Một metric dùng cho cảnh báo chỉ hữu ích trong một khoảng thời gian rất ngắn — thường không lâu hơn nhiều so với khoảng thời gian cần để phản ứng với sự cố. Bạn có thể đo nó ở cấp độ hàng giờ, hoặc có thể là vài ngày. Các metric này sẽ được tiêu thụ bởi hệ thống tự động hóa phản ứng với những sự cố đã biết thay cho bạn, cũng như bởi con người vận hành trong các trường hợp chưa có tự động hóa. Thường thì việc các metric này mang tính khách quan hơn là quan trọng, vì một sự cố không ảnh hưởng tới client thì ít nghiêm trọng hơn nhiều so với một sự cố có ảnh hưởng.

Dữ liệu chủ yếu dùng để gỡ lỗi có chân trời thời gian dài hơn vì bạn thường xuyên phải chẩn đoán các sự cố đã tồn tại một thời gian, hoặc xem xét sâu hơn một vấn đề phức tạp hơn. Dữ liệu này cần phải còn khả dụng trong nhiều ngày hoặc nhiều tuần sau thời điểm thu thập. Nó cũng thường là các phép đo mang tính chủ quan hơn, hoặc là dữ liệu từ chính ứng dụng Kafka. Hãy nhớ rằng không phải lúc nào cũng cần thu thập dữ liệu này vào một hệ thống giám sát. Nếu các metric được dùng để gỡ lỗi ngay tại chỗ, chỉ cần các metric có sẵn khi cần là đủ. Bạn không cần phải làm quá tải hệ thống giám sát bằng cách thu thập hàng chục nghìn giá trị một cách liên tục.

> **METRIC LỊCH SỬ**
>
> Có một loại dữ liệu thứ ba mà rốt cuộc bạn sẽ cần, đó là dữ liệu lịch sử về ứng dụng của bạn. Công dụng phổ biến nhất của dữ liệu lịch sử là phục vụ mục đích quản lý dung lượng (capacity management), và vì vậy nó bao gồm thông tin về các tài nguyên đã sử dụng, gồm tài nguyên tính toán, lưu trữ và mạng. Các metric này sẽ cần được lưu trữ trong một khoảng thời gian rất dài, đo bằng năm. Bạn cũng có thể cần thu thập thêm metadata để đặt các metric vào đúng ngữ cảnh, chẳng hạn như thời điểm các broker được thêm vào hoặc gỡ khỏi cluster.

#### Tự động hóa hay con người?

Một câu hỏi khác cần cân nhắc là ai sẽ là người tiêu thụ các metric. Nếu metric được tiêu thụ bởi hệ thống tự động hóa, chúng nên rất cụ thể. Việc có một số lượng lớn metric, mỗi metric mô tả một chi tiết nhỏ, là chấp nhận được, bởi vì đó chính là lý do máy tính tồn tại: để xử lý nhiều dữ liệu. Dữ liệu càng cụ thể thì càng dễ tạo ra tự động hóa hành động dựa trên nó, bởi vì dữ liệu không để lại nhiều khoảng trống cho việc diễn giải ý nghĩa của nó. Mặt khác, nếu metric được tiêu thụ bởi con người, việc trình bày một số lượng lớn metric sẽ gây choáng ngợp. Điều này càng trở nên quan trọng hơn khi định nghĩa các cảnh báo dựa trên những phép đo đó. Quá dễ để rơi vào "alert fatigue" (mệt mỏi vì cảnh báo), khi có quá nhiều cảnh báo nổ ra đến mức khó biết được mức độ nghiêm trọng của sự cố. Cũng rất khó để định nghĩa đúng ngưỡng cho mọi metric và giữ chúng luôn cập nhật. Khi các cảnh báo quá nhiều hoặc thường xuyên sai, chúng ta bắt đầu không còn tin rằng các cảnh báo mô tả đúng trạng thái ứng dụng của mình.

Hãy nghĩ về việc vận hành một chiếc xe hơi. Để điều chỉnh đúng tỉ lệ không khí và nhiên liệu trong lúc xe đang chạy, máy tính cần một loạt phép đo về mật độ không khí, nhiên liệu, khí thải và các chi tiết nhỏ khác về hoạt động của động cơ. Tuy nhiên, những phép đo này sẽ gây choáng ngợp cho người lái xe. Thay vào đó, chúng ta có đèn "Check Engine". Một chỉ báo duy nhất cho bạn biết rằng có sự cố, và có cách để tìm hiểu thông tin chi tiết hơn nhằm cho bạn biết chính xác vấn đề là gì. Xuyên suốt chương này, chúng ta sẽ xác định những metric cung cấp mức độ bao phủ cao nhất để giữ cho việc cảnh báo của bạn được đơn giản.

### Kiểm tra sức khỏe ứng dụng (Application Health Checks)

Bất kể bạn thu thập metric từ Kafka bằng cách nào, bạn nên đảm bảo rằng mình cũng có cách để giám sát sức khỏe tổng thể của tiến trình ứng dụng thông qua một health check đơn giản. Điều này có thể được thực hiện theo hai cách:

- Một tiến trình bên ngoài báo cáo broker đang hoạt động hay đã ngừng (health check)
- Cảnh báo dựa trên việc thiếu vắng metric được báo cáo bởi Kafka broker (đôi khi gọi là stale metrics)

Mặc dù cách thứ hai có hiệu quả, nó có thể làm cho việc phân biệt giữa lỗi của Kafka broker và lỗi của chính hệ thống giám sát trở nên khó khăn.

Đối với Kafka broker, việc này đơn giản có thể là kết nối tới cổng bên ngoài (chính cổng mà các client dùng để kết nối tới broker) để kiểm tra xem nó có phản hồi hay không. Đối với các ứng dụng client, việc này có thể phức tạp hơn, từ một kiểm tra đơn giản xem tiến trình có đang chạy hay không, cho tới một phương thức nội bộ xác định sức khỏe của ứng dụng.

## Mục tiêu mức dịch vụ (Service-Level Objectives)

Một lĩnh vực giám sát đặc biệt quan trọng đối với các dịch vụ hạ tầng, chẳng hạn như Kafka, là mục tiêu mức dịch vụ, hay SLO (service-level objectives). Đây là cách chúng ta truyền đạt cho khách hàng của mình mức dịch vụ mà họ có thể kỳ vọng từ dịch vụ hạ tầng. Các client muốn có thể xem những dịch vụ như Kafka là một hệ thống hộp đen: họ không muốn và không cần hiểu chi tiết bên trong nó hoạt động thế nào — họ chỉ cần giao diện mà họ đang sử dụng và biết rằng nó sẽ làm điều họ cần.

### Các định nghĩa mức dịch vụ (Service-Level Definitions)

Trước khi bàn về SLO trong Kafka, cần có sự thống nhất về thuật ngữ được sử dụng. Bạn sẽ thường xuyên nghe các kỹ sư, quản lý, lãnh đạo và tất cả mọi người dùng sai các thuật ngữ trong không gian "mức dịch vụ", dẫn đến sự nhầm lẫn về điều thực sự đang được nói đến.

Một service-level indicator (SLI) là một metric mô tả một khía cạnh về độ tin cậy của dịch vụ. Nó nên bám sát trải nghiệm của client, vì vậy thường thì các phép đo này càng khách quan càng tốt. Trong một hệ thống xử lý request, chẳng hạn như Kafka, thường tốt nhất là biểu diễn các phép đo này dưới dạng tỉ lệ giữa số sự kiện tốt và tổng số sự kiện — ví dụ, tỉ lệ các request tới một web server trả về response 2xx, 3xx hoặc 4xx.

Một service-level objective (SLO), cũng có thể được gọi là service-level threshold (SLT), kết hợp một SLI với một giá trị mục tiêu. Một cách phổ biến để biểu diễn mục tiêu là bằng số chữ số chín (99,9% là "ba số chín"), mặc dù điều đó hoàn toàn không bắt buộc. SLO cũng nên bao gồm khung thời gian mà nó được đo, thường ở quy mô ngày. Ví dụ, 99% các request tới web server phải trả về response 2xx, 3xx hoặc 4xx trong vòng 7 ngày.

Một service-level agreement (SLA) là một hợp đồng giữa nhà cung cấp dịch vụ và khách hàng. Nó thường bao gồm nhiều SLO, cũng như chi tiết về cách chúng được đo và báo cáo, cách khách hàng tìm kiếm hỗ trợ từ nhà cung cấp dịch vụ, và các hình phạt mà nhà cung cấp dịch vụ phải chịu nếu họ không hoạt động đúng theo SLA. Ví dụ, một SLA cho SLO ở trên có thể quy định rằng nếu nhà cung cấp dịch vụ không hoạt động trong phạm vi SLO, họ sẽ hoàn lại toàn bộ phí mà khách hàng đã trả cho khoảng thời gian mà dịch vụ nằm ngoài SLO.

> **THỎA THUẬN MỨC VẬN HÀNH**
>
> Thuật ngữ operational-level agreement (OLA) ít được dùng hơn. Nó mô tả các thỏa thuận giữa nhiều dịch vụ nội bộ hoặc nhiều bên hỗ trợ trong quá trình cung cấp tổng thể một SLA. Mục tiêu là đảm bảo rằng nhiều hoạt động cần thiết để thực hiện SLA được mô tả và tính đến một cách đúng đắn trong vận hành hằng ngày.

Rất phổ biến việc nghe mọi người nói về SLA trong khi thực ra họ đang muốn nói về SLO. Trong khi những ai cung cấp dịch vụ cho khách hàng trả tiền có thể có SLA với những khách hàng đó, thì hiếm khi các kỹ sư vận hành ứng dụng phải chịu trách nhiệm về điều gì hơn ngoài hiệu năng của dịch vụ đó trong phạm vi SLO. Ngoài ra, những ai chỉ có khách hàng nội bộ (tức là vận hành Kafka như một hạ tầng dữ liệu nội bộ cho một dịch vụ lớn hơn nhiều) nói chung không có SLA với các khách hàng nội bộ đó. Tuy nhiên, điều này không nên ngăn bạn thiết lập và truyền đạt các SLO, bởi vì làm vậy sẽ giúp giảm bớt những giả định của khách hàng về việc họ nghĩ Kafka nên hoạt động ra sao.

### Metric nào tạo nên SLI tốt?

Nói chung, các metric cho SLI của bạn nên được thu thập bằng một thứ gì đó nằm bên ngoài các Kafka broker. Lý do là SLO phải mô tả liệu người dùng điển hình của dịch vụ có hài lòng hay không, và bạn không thể đo điều đó một cách chủ quan. Các client của bạn không quan tâm bạn nghĩ dịch vụ của mình đang chạy đúng hay không; chính trải nghiệm của họ (ở dạng tổng hợp) mới là điều quan trọng. Điều này có nghĩa là infrastructure metric thì ổn, synthetic client thì tốt, và metric phía client có lẽ là tốt nhất cho hầu hết các SLI của bạn.

Dù hoàn toàn không phải là danh sách đầy đủ, các SLI phổ biến nhất được dùng trong các hệ thống request/response và lưu trữ dữ liệu được liệt kê trong Bảng 13-2.

> **KHÁCH HÀNG LUÔN MUỐN NHIỀU HƠN**
>
> Có một số SLO mà khách hàng của bạn có thể quan tâm, quan trọng với họ nhưng lại không nằm trong tầm kiểm soát của bạn. Ví dụ, họ có thể lo lắng về tính đúng đắn hoặc độ tươi mới của dữ liệu được produce vào Kafka. Đừng đồng ý hỗ trợ các SLO mà bạn không chịu trách nhiệm, vì điều đó sẽ chỉ dẫn đến việc nhận thêm công việc làm loãng nhiệm vụ cốt lõi là giữ cho Kafka chạy đúng. Hãy đảm bảo kết nối họ với nhóm phù hợp để thiết lập sự thấu hiểu và các thỏa thuận xoay quanh những yêu cầu bổ sung này.

**Bảng 13-2. Các loại SLI**

| Loại | Mô tả |
|---|---|
| Availability (tính sẵn sàng) | Client có thể thực hiện một request và nhận được response hay không? |
| Latency (độ trễ) | Response được trả về nhanh đến mức nào? |
| Quality (chất lượng) | Response có bao gồm nội dung phản hồi đúng đắn hay không? |
| Security (bảo mật) | Request và response có được bảo vệ phù hợp hay không, dù đó là authorization hay mã hóa? |
| Throughput (thông lượng) | Client có thể lấy đủ dữ liệu, đủ nhanh hay không? |

Hãy nhớ rằng thường thì tốt hơn nếu các SLI của bạn dựa trên bộ đếm các sự kiện nằm trong ngưỡng của SLO. Điều này có nghĩa là lý tưởng nhất, mỗi sự kiện sẽ được kiểm tra riêng lẻ xem nó có đáp ứng ngưỡng của SLO hay không. Điều này loại trừ các metric dạng quantile khỏi nhóm SLI tốt, vì chúng chỉ cho bạn biết rằng 90% sự kiện của bạn nằm dưới một giá trị nào đó mà không cho phép bạn kiểm soát giá trị đó là bao nhiêu. Tuy nhiên, việc gộp các giá trị vào các nhóm (bucket) (ví dụ "dưới 10 ms", "10–50 ms", "50–100 ms", v.v.) có thể hữu ích khi làm việc với SLO, đặc biệt khi bạn chưa chắc chắn ngưỡng tốt là bao nhiêu. Điều này sẽ cho bạn một góc nhìn về phân bố của các sự kiện trong phạm vi của SLO, và bạn có thể cấu hình các bucket sao cho ranh giới của chúng là những giá trị hợp lý cho ngưỡng SLO.

### Dùng SLO trong cảnh báo (Using SLOs in Alerting)

Nói ngắn gọn, SLO nên định hình các cảnh báo chính của bạn. Lý do là SLO mô tả các sự cố từ góc nhìn của khách hàng, và đó chính là những thứ bạn nên quan tâm trước tiên. Nói chung, nếu một sự cố không ảnh hưởng tới client của bạn, nó không cần phải đánh thức bạn giữa đêm. SLO cũng sẽ cho bạn biết về những sự cố mà bạn không biết cách phát hiện vì bạn chưa từng gặp trước đây. Chúng sẽ không cho bạn biết những sự cố đó là gì, nhưng chúng sẽ cho bạn biết rằng chúng tồn tại.

Thách thức là rất khó để dùng trực tiếp một SLO làm cảnh báo. SLO phù hợp nhất với các khung thời gian dài, chẳng hạn một tuần, vì chúng ta muốn báo cáo chúng cho ban quản lý và khách hàng theo cách có thể tiêu thụ được. Ngoài ra, đến lúc cảnh báo SLO nổ ra thì đã quá muộn — bạn đã hoạt động ngoài phạm vi SLO rồi. Một số người sẽ dùng một giá trị đạo hàm để cung cấp cảnh báo sớm, nhưng cách tốt nhất để tiếp cận việc dùng SLO cho cảnh báo là quan sát tốc độ mà bạn đang "đốt" hạn mức SLO của mình trong khung thời gian của nó.

Ví dụ, giả sử cluster Kafka của bạn nhận một triệu request mỗi tuần, và bạn có một SLO được định nghĩa rằng 99,9% request phải gửi byte đầu tiên của response trong vòng 10 ms. Điều này có nghĩa là trong cả tuần, bạn có thể có tới một nghìn request phản hồi chậm hơn mức này mà mọi thứ vẫn ổn. Bình thường, bạn thấy một request như vậy mỗi giờ, tức khoảng 168 request tệ mỗi tuần, đo từ Chủ nhật đến thứ Bảy. Bạn có một metric hiển thị con số này dưới dạng tốc độ đốt SLO (SLO burn rate), và một request mỗi giờ trên một triệu request mỗi tuần là tốc độ đốt 0,1% mỗi giờ.

Vào 10 giờ sáng thứ Ba, metric của bạn thay đổi và giờ cho thấy tốc độ đốt là 0,4% mỗi giờ. Điều này không hay, nhưng vẫn chưa phải là vấn đề vì bạn sẽ vẫn nằm gọn trong SLO vào cuối tuần. Bạn mở một ticket để xem xét vấn đề nhưng rồi quay lại với công việc ưu tiên cao hơn. Vào 2 giờ chiều thứ Tư, tốc độ đốt nhảy lên 2% mỗi giờ và các cảnh báo của bạn nổ ra. Bạn biết rằng với tốc độ này, bạn sẽ vi phạm SLO vào giờ ăn trưa thứ Sáu. Bỏ hết mọi thứ, bạn chẩn đoán vấn đề, và sau khoảng 4 giờ bạn đưa tốc độ đốt trở lại 0,4% mỗi giờ, và nó giữ nguyên ở đó trong phần còn lại của tuần. Bằng cách sử dụng tốc độ đốt, bạn đã tránh được việc vi phạm SLO cho tuần đó.

Để biết thêm thông tin về việc tận dụng SLO và tốc độ đốt cho cảnh báo, bạn sẽ thấy rằng *Site Reliability Engineering* và *The Site Reliability Workbook*, cả hai đều do Betsy Beyer và cộng sự biên tập (O'Reilly), là những nguồn tài liệu tuyệt vời.

## Metric của Kafka Broker (Kafka Broker Metrics)

Có rất nhiều metric của Kafka broker. Nhiều trong số đó là các phép đo ở mức thấp, được các nhà phát triển thêm vào khi điều tra một vấn đề cụ thể hoặc để dự phòng cho nhu cầu thông tin phục vụ gỡ lỗi về sau. Có các metric cung cấp thông tin về gần như mọi chức năng bên trong broker, nhưng những metric phổ biến nhất mới cung cấp thông tin cần thiết để vận hành Kafka hằng ngày.

> **AI SẼ GIÁM SÁT NGƯỜI GIÁM SÁT?**
>
> Nhiều tổ chức dùng Kafka để thu thập metric ứng dụng, metric hệ thống và log để một hệ thống giám sát trung tâm tiêu thụ. Đây là cách tuyệt vời để tách rời các ứng dụng khỏi hệ thống giám sát, nhưng nó đặt ra một mối lo ngại riêng cho chính Kafka. Nếu bạn dùng chính hệ thống này để giám sát Kafka, rất có khả năng bạn sẽ không bao giờ biết khi nào Kafka hỏng bởi vì luồng dữ liệu cho hệ thống giám sát của bạn cũng sẽ hỏng theo.
>
> Có nhiều cách để xử lý điều này. Một cách là dùng một hệ thống giám sát riêng cho Kafka mà không phụ thuộc vào Kafka. Một cách khác, nếu bạn có nhiều datacenter, là đảm bảo rằng metric cho cluster Kafka ở datacenter A được produce sang datacenter B, và ngược lại. Dù bạn quyết định xử lý thế nào, hãy đảm bảo rằng việc giám sát và cảnh báo cho Kafka không phụ thuộc vào việc Kafka đang hoạt động.

Trong phần này, chúng ta sẽ bắt đầu bằng việc thảo luận quy trình ở mức cao để chẩn đoán các sự cố với cluster Kafka của bạn, có tham chiếu tới các metric hữu ích. Những metric đó, cùng các metric khác, sẽ được mô tả chi tiết hơn ở phần sau của chương. Đây hoàn toàn không phải là danh sách đầy đủ các metric của broker, mà là một số metric "bắt buộc phải có" để kiểm tra sức khỏe của broker và của cluster. Chúng ta sẽ khép lại bằng một thảo luận về logging trước khi chuyển sang các metric của client.

### Chẩn đoán sự cố cluster (Diagnosing Cluster Problems)

Khi nói tới các sự cố với một cluster Kafka, có ba nhóm chính:

- Sự cố ở một broker đơn lẻ (single-broker problems)
- Cluster quá tải (overloaded clusters)
- Sự cố với controller (controller problems)

Các vấn đề với từng broker riêng lẻ, cho đến nay, là dễ chẩn đoán và phản ứng nhất. Chúng sẽ hiện ra dưới dạng các giá trị ngoại lai trong metric của cluster và thường liên quan tới thiết bị lưu trữ chậm hoặc hỏng, hoặc bị ràng buộc về tài nguyên tính toán bởi các ứng dụng khác trên hệ thống. Để phát hiện chúng, hãy đảm bảo bạn đang giám sát tính sẵn sàng của từng máy chủ riêng lẻ, cũng như trạng thái của các thiết bị lưu trữ, bằng cách sử dụng các metric của hệ điều hành (OS).

Tuy nhiên, nếu không có vấn đề nào được xác định ở mức OS hoặc phần cứng, thì nguyên nhân gần như luôn là sự mất cân bằng tải trong cluster Kafka. Mặc dù Kafka cố gắng giữ dữ liệu trong cluster được trải đều trên tất cả các broker, điều đó không có nghĩa là việc truy cập của client vào dữ liệu đó được phân bố đều. Nó cũng không phát hiện các vấn đề như hot partition. Khuyến nghị mạnh mẽ rằng bạn nên tận dụng một công cụ bên ngoài để giữ cho cluster luôn cân bằng. Một công cụ như vậy là Cruise Control, một ứng dụng liên tục giám sát cluster và tái cân bằng các partition bên trong nó. Nó cũng cung cấp một số chức năng quản trị khác, chẳng hạn như thêm và gỡ broker.

> **BẦU CHỌN PREFERRED REPLICA**
>
> Bước đầu tiên trước khi cố gắng chẩn đoán sâu hơn một vấn đề là đảm bảo rằng bạn đã chạy một preferred replica election (xem Chương 12) gần đây. Các Kafka broker không tự động lấy lại quyền leadership của partition (trừ khi auto leader rebalance được bật) sau khi chúng đã nhả quyền leadership (ví dụ khi broker gặp sự cố hoặc bị tắt). Điều này có nghĩa là leader replica rất dễ trở nên mất cân bằng trong một cluster. Preferred replica election an toàn và dễ chạy, nên việc chạy nó trước và xem sự cố có biến mất hay không là một ý hay.

Cluster quá tải là một vấn đề khác dễ phát hiện. Nếu cluster đã cân bằng, và nhiều broker đang cho thấy độ trễ request tăng cao hoặc tỉ lệ nhàn rỗi của request handler pool thấp, thì bạn đang chạm tới giới hạn khả năng phục vụ lưu lượng của các broker cho cluster này. Khi kiểm tra sâu hơn, bạn có thể phát hiện ra rằng có một client đã thay đổi mẫu request của nó và giờ đang gây ra vấn đề. Tuy nhiên, ngay cả khi điều này xảy ra, có thể bạn cũng chẳng làm được gì nhiều để thay đổi client. Các giải pháp khả dụng cho bạn là hoặc giảm tải cho cluster, hoặc tăng số lượng broker.

Các vấn đề với controller trong cluster Kafka khó chẩn đoán hơn nhiều và thường rơi vào nhóm bug của chính Kafka. Những vấn đề này biểu hiện dưới dạng metadata của broker không đồng bộ, replica offline trong khi các broker có vẻ vẫn ổn, và các thao tác điều khiển topic như tạo topic không diễn ra đúng cách. Nếu bạn đang gãi đầu trước một vấn đề trong cluster và nói "Chuyện này thật kỳ lạ", thì rất có khả năng đó là vì controller đã làm điều gì đó khó lường và tệ hại. Không có nhiều cách để giám sát controller, nhưng việc giám sát active controller count cũng như controller queue size sẽ cho bạn một chỉ báo ở mức cao rằng có vấn đề hay không.

### Nghệ thuật của Under-Replicated Partitions

Một trong những metric phổ biến nhất được dùng khi giám sát Kafka là under-replicated partitions. Phép đo này, được cung cấp trên mỗi broker trong cluster, cho biết số lượng partition mà broker đó là leader replica, nhưng các follower replica lại chưa bắt kịp. Chỉ một phép đo này thôi cũng cung cấp cái nhìn về một loạt vấn đề với cluster Kafka, từ việc một broker bị ngừng hoạt động cho tới việc cạn kiệt tài nguyên. Với sự đa dạng các vấn đề mà metric này có thể chỉ ra, nó xứng đáng được xem xét kỹ lưỡng về cách phản ứng khi giá trị khác không. Nhiều metric được dùng để chẩn đoán các loại vấn đề này sẽ được mô tả ở phần sau của chương. Xem Bảng 13-3 để biết thêm chi tiết về under-replicated partitions.

**Bảng 13-3. Chi tiết metric under-replicated partitions**

| Mục | Giá trị |
|---|---|
| Metric name | Under-replicated partitions |
| JMX MBean | `kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions` |
| Value range | Số nguyên, bằng không hoặc lớn hơn |

> **CÁI BẪY CẢNH BÁO URP**
>
> Trong ấn bản trước của cuốn sách này, cũng như trong nhiều bài nói tại hội nghị, các tác giả đã nói rất nhiều về việc metric under-replicated partitions (URP) nên là metric cảnh báo chính của bạn vì nó mô tả được rất nhiều vấn đề. Cách tiếp cận này có một số lượng đáng kể các vấn đề, không kém phần quan trọng trong đó là việc metric URP thường xuyên có thể khác không vì những lý do vô hại. Điều này có nghĩa là với tư cách người vận hành một cluster Kafka, bạn sẽ nhận được các cảnh báo giả, dẫn tới việc cảnh báo bị bỏ qua. Nó cũng đòi hỏi một lượng kiến thức đáng kể để có thể hiểu metric này đang nói với bạn điều gì. Vì lý do đó, chúng tôi không còn khuyến nghị dùng URP để cảnh báo nữa. Thay vào đó, bạn nên dựa vào cảnh báo dựa trên SLO để phát hiện các vấn đề chưa biết.

Một số lượng under-replicated partitions ổn định (không thay đổi) được báo cáo bởi nhiều broker trong một cluster thường cho thấy rằng một trong các broker của cluster đang offline. Tổng số under-replicated partitions trên toàn cluster sẽ bằng số partition được gán cho broker đó, và broker bị ngừng sẽ không báo cáo metric. Trong trường hợp này, bạn sẽ cần điều tra xem điều gì đã xảy ra với broker đó và giải quyết tình huống. Đây thường là một lỗi phần cứng, nhưng cũng có thể là vấn đề của OS hoặc Java gây ra.

Nếu số lượng under-replicated partitions dao động, hoặc nếu con số ổn định nhưng không có broker nào offline, thì điều này thường cho thấy một vấn đề về hiệu năng trong cluster. Những loại vấn đề này khó chẩn đoán hơn nhiều do sự đa dạng của chúng, nhưng có một số bước bạn có thể thực hiện để thu hẹp về các nguyên nhân khả dĩ nhất. Bước đầu tiên là cố gắng xác định xem vấn đề liên quan tới một broker đơn lẻ hay toàn bộ cluster. Đôi khi đây là một câu hỏi khó trả lời. Nếu các under-replicated partition nằm trên một broker duy nhất, như trong ví dụ sau, thì broker đó thường là vấn đề. Lỗi cho thấy các broker khác đang gặp vấn đề khi replicate message từ broker đó.

Nếu nhiều broker có under-replicated partitions, thì đó có thể là vấn đề của cluster, nhưng cũng vẫn có thể là do một broker duy nhất. Trong trường hợp đó, sẽ là do một broker duy nhất đang gặp vấn đề khi replicate message từ mọi nơi, và bạn sẽ phải tìm ra đó là broker nào. Một cách để làm điều này là lấy danh sách các under-replicated partition của cluster và xem có broker cụ thể nào xuất hiện chung trong tất cả các partition bị under-replicated hay không. Sử dụng công cụ `kafka-topics.sh` (được trình bày chi tiết ở Chương 12), bạn có thể lấy danh sách các under-replicated partition để tìm điểm chung.

Ví dụ, liệt kê các under-replicated partition trong một cluster:

```bash
# kafka-topics.sh --bootstrap-server kafka1.example.com:9092/kafka-cluster --describe --under-replicated
    Topic: topicOne   Partition: 5    Leader: 1    Replicas: 1,2 Isr: 1
    Topic: topicOne   Partition: 6    Leader: 3    Replicas: 2,3 Isr: 3
    Topic: topicTwo   Partition: 3    Leader: 4    Replicas: 2,4 Isr: 4
    Topic: topicTwo   Partition: 7    Leader: 5    Replicas: 5,2 Isr: 5
    Topic: topicSix   Partition: 1    Leader: 3    Replicas: 2,3 Isr: 3
    Topic: topicSix   Partition: 2    Leader: 1    Replicas: 1,2 Isr: 1
    Topic: topicSix   Partition: 5    Leader: 6    Replicas: 2,6 Isr: 6
    Topic: topicSix   Partition: 7    Leader: 7    Replicas: 7,2 Isr: 7
    Topic: topicNine  Partition: 1    Leader: 1    Replicas: 1,2 Isr: 1
    Topic: topicNine  Partition: 3    Leader: 3    Replicas: 2,3 Isr: 3
    Topic: topicNine  Partition: 4    Leader: 3    Replicas: 3,2 Isr: 3
    Topic: topicNine  Partition: 7    Leader: 3    Replicas: 2,3 Isr: 3
    Topic: topicNine  Partition: 0    Leader: 3    Replicas: 2,3 Isr: 3
    Topic: topicNine  Partition: 5    Leader: 6    Replicas: 6,2 Isr: 6
#
```

Trong ví dụ này, broker chung là số 2. Điều này cho thấy broker này đang gặp vấn đề với việc replicate message và sẽ dẫn chúng ta tập trung điều tra vào riêng broker đó. Nếu không có broker chung nào, thì nhiều khả năng đây là một vấn đề trên toàn cluster.

#### Sự cố ở mức cluster (Cluster-level problems)

Các vấn đề của cluster thường rơi vào một trong hai nhóm:

- Tải mất cân bằng (unbalanced load)
- Cạn kiệt tài nguyên (resource exhaustion)

Vấn đề thứ nhất, partition hoặc leadership mất cân bằng, là dễ tìm ra nhất mặc dù việc khắc phục nó có thể là một quá trình phức tạp. Để chẩn đoán vấn đề này, bạn sẽ cần một số metric từ các broker trong cluster:

- Partition count
- Leader partition count
- All topics messages in rate
- All topics bytes in rate
- All topics bytes out rate

Hãy xem xét các metric này. Trong một cluster cân bằng hoàn hảo, các con số sẽ đồng đều trên tất cả các broker trong cluster, như trong Bảng 13-4.

**Bảng 13-4. Các metric về mức sử dụng**

| Broker | Partitions | Leaders | Messages in | Bytes in | Bytes out |
|---|---|---|---|---|---|
| 1 | 100 | 50 | 13130 msg/s | 3.56 MBps | 9.45 MBps |
| 2 | 101 | 49 | 12842 msg/s | 3.66 MBps | 9.25 MBps |
| 3 | 100 | 50 | 13086 msg/s | 3.23 MBps | 9.82 MBps |

Điều này cho thấy tất cả các broker đang nhận xấp xỉ cùng một lượng lưu lượng. Giả sử bạn đã chạy preferred replica election, một độ lệch lớn cho thấy lưu lượng không được cân bằng trong cluster. Để giải quyết, bạn sẽ cần chuyển các partition từ những broker đang bị tải nặng sang những broker tải nhẹ hơn. Việc này được thực hiện bằng công cụ `kafka-reassign-partitions.sh` được mô tả ở Chương 12.

> **CÔNG CỤ HỖ TRỢ CÂN BẰNG CLUSTER**
>
> Bản thân Kafka broker không cung cấp cơ chế tự động gán lại partition trong một cluster. Điều này có nghĩa là việc cân bằng lưu lượng trong một cluster Kafka có thể là một quá trình nhàm chán đến tê liệt khi phải rà soát thủ công những danh sách metric dài dằng dặc và cố nghĩ ra một cách gán replica khả thi. Để hỗ trợ việc này, một số tổ chức đã phát triển các công cụ tự động thực hiện tác vụ đó. Một ví dụ là công cụ `kafka-assigner` mà LinkedIn đã phát hành trong repository mã nguồn mở `kafka-tools` trên GitHub. Một số gói hỗ trợ Kafka thương mại cũng cung cấp tính năng này.

Một vấn đề hiệu năng phổ biến khác của cluster là vượt quá khả năng phục vụ request của các broker. Có nhiều nút thắt cổ chai có thể làm mọi thứ chậm lại: CPU, disk IO và network throughput là một vài trong số phổ biến nhất. Mức sử dụng đĩa không nằm trong số đó, vì các broker sẽ hoạt động bình thường cho tới đúng thời điểm đĩa bị đầy, và rồi đĩa này sẽ hỏng một cách đột ngột. Để chẩn đoán một vấn đề về dung lượng, có nhiều metric bạn có thể theo dõi ở mức OS, bao gồm:

- CPU utilization
- Inbound network throughput
- Outbound network throughput
- Disk average wait time
- Disk percent utilization

Việc cạn kiệt bất kỳ tài nguyên nào trong số này thường sẽ biểu hiện thành cùng một vấn đề: under-replicated partitions. Điều quan trọng cần nhớ là quá trình replication của broker hoạt động theo đúng cách mà các Kafka client khác hoạt động. Nếu cluster của bạn đang gặp vấn đề với replication, thì khách hàng của bạn cũng đang gặp vấn đề với việc produce và consume message. Việc xây dựng một đường cơ sở (baseline) cho các metric này khi cluster của bạn đang hoạt động đúng, rồi đặt ngưỡng chỉ ra một vấn đề đang hình thành từ rất lâu trước khi bạn cạn dung lượng, là hợp lý. Bạn cũng sẽ muốn xem xét xu hướng của các metric này khi lưu lượng tới cluster tăng lên theo thời gian. Xét riêng về metric của Kafka broker, All Topics Bytes In Rate là một chỉ dẫn tốt để thể hiện mức sử dụng cluster.

#### Sự cố ở mức host (Host-level problems)

Nếu vấn đề hiệu năng với Kafka không xuất hiện trên toàn bộ cluster và có thể khoanh vùng về một hoặc hai broker, thì đã đến lúc xem xét máy chủ đó và tìm hiểu điều gì làm nó khác biệt so với phần còn lại của cluster. Những loại vấn đề này rơi vào một số nhóm chung:

- Lỗi phần cứng (hardware failures)
- Mạng (networking)
- Xung đột với tiến trình khác (conflicts with another process)
- Khác biệt cấu hình cục bộ (local configuration differences)

> **MÁY CHỦ ĐIỂN HÌNH VÀ CÁC SỰ CỐ**
>
> Một máy chủ và hệ điều hành của nó là một cỗ máy phức tạp với hàng nghìn thành phần, bất kỳ thành phần nào cũng có thể gặp vấn đề và gây ra hoặc là lỗi hoàn toàn hoặc chỉ là suy giảm hiệu năng. Chúng tôi không thể bao quát mọi thứ có thể hỏng trong cuốn sách này — đã có vô số cuốn sách được viết, và sẽ tiếp tục được viết, về chủ đề này. Nhưng chúng ta có thể thảo luận một số vấn đề phổ biến nhất thường gặp. Phần này sẽ tập trung vào các vấn đề với một máy chủ điển hình chạy hệ điều hành Linux.

Lỗi phần cứng đôi khi rất rõ ràng, chẳng hạn khi máy chủ ngừng hoạt động hoàn toàn, nhưng chính những vấn đề ít rõ ràng hơn mới gây ra các sự cố hiệu năng. Đây thường là các lỗi mềm (soft failure) cho phép hệ thống tiếp tục chạy nhưng làm suy giảm hoạt động. Đó có thể là một phần bộ nhớ bị lỗi, khi hệ thống đã phát hiện vấn đề và bỏ qua đoạn đó (làm giảm tổng dung lượng bộ nhớ khả dụng). Điều tương tự có thể xảy ra với lỗi CPU. Với những vấn đề như thế này, bạn nên sử dụng các tiện ích mà phần cứng của bạn cung cấp, chẳng hạn như intelligent platform management interface (IPMI) để giám sát sức khỏe phần cứng. Khi có một vấn đề đang hoạt động, việc xem kernel ring buffer bằng `dmesg` sẽ giúp bạn thấy các thông điệp log đang được đẩy ra system console.

Loại lỗi phần cứng phổ biến hơn dẫn tới suy giảm hiệu năng trong Kafka là lỗi đĩa. Apache Kafka phụ thuộc vào đĩa để lưu trữ bền vững các message, và hiệu năng của producer gắn trực tiếp với việc đĩa của bạn commit các thao tác ghi nhanh đến mức nào. Bất kỳ sai lệch nào ở đây cũng sẽ biểu hiện thành vấn đề với hiệu năng của producer và của các replica fetcher. Cái sau chính là thứ dẫn tới under-replicated partitions. Vì vậy, việc giám sát sức khỏe của các đĩa mọi lúc và xử lý nhanh mọi vấn đề là rất quan trọng.

> **MỘT QUẢ TRỨNG HỎNG**
>
> Một lỗi đĩa duy nhất trên một broker duy nhất có thể phá hủy hiệu năng của cả cluster. Đó là bởi vì các producer client sẽ kết nối tới tất cả các broker đang làm leader cho các partition của một topic, và nếu bạn đã tuân theo thực hành tốt nhất, những partition đó sẽ được trải đều trên toàn bộ cluster. Nếu một broker bắt đầu hoạt động kém và làm chậm các produce request, điều này sẽ gây ra back pressure ở phía producer, làm chậm các request tới tất cả các broker.

Trước hết, hãy đảm bảo bạn đang giám sát thông tin trạng thái phần cứng của các đĩa từ IPMI, hoặc từ giao diện mà phần cứng của bạn cung cấp. Ngoài ra, bên trong OS bạn nên chạy các công cụ SMART (Self-Monitoring, Analysis and Reporting Technology) để vừa giám sát vừa kiểm tra các đĩa một cách định kỳ. Điều này sẽ cảnh báo cho bạn về một lỗi sắp xảy ra. Cũng quan trọng không kém là để mắt tới disk controller, đặc biệt nếu nó có chức năng RAID, dù bạn có đang dùng RAID phần cứng hay không. Nhiều controller có cache tích hợp chỉ được sử dụng khi controller khỏe mạnh và battery backup unit (BBU) đang hoạt động. Một lỗi của BBU có thể khiến cache bị vô hiệu hóa, làm suy giảm hiệu năng đĩa.

Mạng là một lĩnh vực khác mà các lỗi cục bộ sẽ gây ra vấn đề. Một số vấn đề này là lỗi phần cứng, chẳng hạn như cáp mạng hoặc đầu nối bị hỏng. Một số là vấn đề cấu hình, thường là thay đổi ở thiết lập tốc độ hoặc duplex cho kết nối, hoặc ở phía máy chủ hoặc ở phía trên tại thiết bị mạng. Vấn đề cấu hình mạng cũng có thể là vấn đề của OS, chẳng hạn như network buffer bị đặt quá nhỏ hoặc quá nhiều kết nối mạng chiếm quá nhiều dung lượng bộ nhớ tổng thể. Một trong những chỉ báo then chốt cho các vấn đề trong lĩnh vực này là số lỗi được phát hiện trên các network interface. Nếu số lỗi đang tăng lên, thì có lẽ có một vấn đề chưa được xử lý.

Nếu không có vấn đề phần cứng nào, một vấn đề phổ biến khác cần tìm là một ứng dụng khác đang chạy trên hệ thống và tiêu thụ tài nguyên, gây áp lực lên Kafka broker. Đó có thể là thứ gì đó được cài đặt nhầm, hoặc có thể là một tiến trình lẽ ra phải chạy, chẳng hạn như monitoring agent, nhưng đang gặp vấn đề. Hãy dùng các công cụ trên hệ thống của bạn, chẳng hạn như `top`, để xác định xem có tiến trình nào đang dùng nhiều CPU hoặc bộ nhớ hơn dự kiến hay không.

Nếu các lựa chọn khác đã cạn và bạn vẫn chưa tìm ra nguồn gốc của sự khác biệt trên host, thì có khả năng một khác biệt cấu hình đã len lỏi vào, hoặc ở broker hoặc ở chính hệ thống. Với số lượng ứng dụng đang chạy trên bất kỳ máy chủ đơn lẻ nào và số lượng tùy chọn cấu hình cho mỗi ứng dụng, việc tìm ra một khác biệt có thể là một nhiệm vụ nản lòng. Đó là lý do vì sao việc bạn tận dụng một hệ thống quản lý cấu hình, chẳng hạn như Chef hoặc Puppet, để duy trì cấu hình nhất quán trên toàn bộ hệ điều hành và ứng dụng (bao gồm cả Kafka) là điều then chốt.

### Broker Metrics

Ngoài under-replicated partitions, còn có những metric khác hiện diện ở mức broker tổng thể mà bạn nên giám sát. Dù bạn có thể không muốn đặt ngưỡng cảnh báo cho tất cả chúng, chúng vẫn cung cấp thông tin giá trị về các broker và cluster của bạn. Chúng nên có mặt trong bất kỳ dashboard giám sát nào bạn tạo ra.

#### Active controller count

Metric active controller count cho biết broker hiện có đang là controller của cluster hay không. Metric này sẽ có giá trị 0 hoặc 1, với 1 nghĩa là broker hiện đang là controller. Ở mọi thời điểm, chỉ một broker được là controller, và luôn phải có một broker là controller trong cluster. Nếu hai broker nói rằng chúng hiện là controller, điều này nghĩa là bạn đang gặp vấn đề khi một controller thread lẽ ra đã phải thoát thì lại bị kẹt. Điều này có thể gây ra vấn đề không thể thực thi đúng các tác vụ quản trị, chẳng hạn như di chuyển partition. Để khắc phục, ít nhất bạn sẽ cần khởi động lại cả hai broker. Tuy nhiên, khi có một controller thừa trong cluster, thường sẽ có vấn đề khi thực hiện việc tắt an toàn một broker, và bạn sẽ phải buộc dừng broker thay vì tắt bình thường. Xem Bảng 13-5 để biết thêm chi tiết về active controller count.

**Bảng 13-5. Chi tiết metric active controller count**

| Mục | Giá trị |
|---|---|
| Metric name | Active controller count |
| JMX MBean | `kafka.controller:type=KafkaController,name=ActiveControllerCount` |
| Value range | Không hoặc một |

Nếu không có broker nào nhận mình là controller trong cluster, cluster sẽ không phản hồi đúng khi có các thay đổi trạng thái, bao gồm việc tạo topic hoặc partition, hoặc khi broker gặp sự cố. Trong tình huống này, bạn phải điều tra thêm để tìm ra vì sao các controller thread không hoạt động đúng. Ví dụ, một network partition tách khỏi cluster ZooKeeper có thể dẫn tới vấn đề như thế này. Khi vấn đề gốc rễ đó đã được khắc phục, việc khởi động lại tất cả các broker trong cluster để reset trạng thái cho các controller thread là một quyết định khôn ngoan.

#### Controller queue size

Metric controller queue size cho biết controller hiện đang chờ xử lý bao nhiêu request cho các broker. Metric này sẽ có giá trị từ 0 trở lên, với giá trị dao động thường xuyên khi các request mới từ broker đến và các hành động quản trị, chẳng hạn như tạo partition, di chuyển partition, và xử lý thay đổi leader, diễn ra. Các đỉnh nhọn trong metric là điều bình thường, nhưng nếu giá trị này liên tục tăng, hoặc giữ ổn định ở mức cao và không giảm xuống, thì điều đó cho thấy controller có thể đang bị kẹt. Điều này có thể gây ra vấn đề không thể thực thi đúng các tác vụ quản trị. Để khắc phục, bạn sẽ cần chuyển controller sang một broker khác, việc này đòi hỏi tắt broker hiện đang là controller. Tuy nhiên, khi controller bị kẹt, thường sẽ có vấn đề khi thực hiện controlled shutdown cho bất kỳ broker nào. Xem Bảng 13-6 để biết thêm chi tiết về controller queue size.

**Bảng 13-6. Chi tiết metric controller queue size**

| Mục | Giá trị |
|---|---|
| Metric name | Controller queue size |
| JMX MBean | `kafka.controller:type=ControllerEventManager,name=EventQueueSize` |
| Value range | Số nguyên, bằng không hoặc lớn hơn |

#### Request handler idle ratio

Kafka sử dụng hai thread pool để xử lý mọi client request: network thread và request handler thread (còn gọi là I/O thread). Các network thread chịu trách nhiệm đọc và ghi dữ liệu tới các client qua mạng. Việc này không đòi hỏi xử lý đáng kể, nghĩa là việc cạn kiệt network thread ít đáng lo hơn. Tuy nhiên, các request handler thread chịu trách nhiệm phục vụ chính client request, bao gồm việc đọc hoặc ghi message xuống đĩa. Vì vậy, khi các broker bị tải nặng hơn, sẽ có ảnh hưởng đáng kể lên thread pool này. Xem Bảng 13-7 để biết thêm chi tiết về request handler idle ratio.

**Bảng 13-7. Chi tiết metric request handler idle ratio**

| Mục | Giá trị |
|---|---|
| Metric name | Request handler average idle percentage |
| JMX MBean | `kafka.server:type=KafkaRequestHandlerPool,name=RequestHandlerAvgIdlePercent` |
| Value range | Số thực, nằm trong khoảng từ không đến một (bao gồm cả hai đầu) |

> **SỬ DỤNG THREAD MỘT CÁCH THÔNG MINH**
>
> Dù có vẻ như bạn sẽ cần hàng trăm request handler thread, nhưng thực tế bạn không cần cấu hình nhiều thread hơn số CPU có trong broker. Apache Kafka rất thông minh trong cách nó sử dụng các request handler, đảm bảo đẩy sang purgatory những request sẽ mất nhiều thời gian xử lý. Điều này được dùng, ví dụ, khi các request đang bị áp quota hoặc khi cần nhiều hơn một acknowledgment cho produce request.

Metric request handler idle ratio cho biết tỉ lệ phần trăm thời gian mà các request handler không được sử dụng. Con số này càng thấp thì broker càng bị tải nặng. Kinh nghiệm cho thấy tỉ lệ nhàn rỗi dưới 20% cho thấy một vấn đề tiềm tàng, và dưới 10% thường là một vấn đề hiệu năng đang thực sự diễn ra. Ngoài việc cluster bị thiết kế thiếu dung lượng, có hai lý do khiến mức sử dụng thread trong pool này cao. Thứ nhất là không có đủ thread trong pool. Nói chung, bạn nên đặt số request handler thread bằng số bộ xử lý trong hệ thống (bao gồm cả các bộ xử lý hyperthread).

Lý do phổ biến còn lại khiến mức sử dụng request handler thread cao là các thread đang làm những việc không cần thiết cho mỗi request. Trước Kafka 0.10, request handler thread chịu trách nhiệm giải nén mọi message batch đến, kiểm tra tính hợp lệ của các message và gán offset, rồi nén lại message batch cùng với offset trước khi ghi xuống đĩa. Tệ hơn nữa, các phương thức nén đều nằm sau một khóa đồng bộ. Từ phiên bản 0.10, có một định dạng message mới cho phép dùng offset tương đối trong một message batch. Điều này có nghĩa là các producer mới hơn sẽ đặt offset tương đối trước khi gửi message batch, cho phép broker bỏ qua bước nén lại message batch. Một trong những cải thiện hiệu năng lớn nhất mà bạn có thể thực hiện là đảm bảo tất cả producer và consumer client đều hỗ trợ định dạng message 0.10, và đổi phiên bản định dạng message trên các broker sang 0.10 luôn. Điều này sẽ giảm đáng kể mức sử dụng của các request handler thread.

#### All topics bytes in

Tốc độ all topics bytes in, biểu diễn bằng byte mỗi giây, hữu ích như một phép đo về lượng lưu lượng message mà các broker của bạn đang nhận từ các client producing. Đây là một metric tốt để theo dõi xu hướng theo thời gian nhằm giúp bạn xác định khi nào cần mở rộng cluster hoặc làm các công việc liên quan tới tăng trưởng khác. Nó cũng hữu ích để đánh giá xem một broker trong cluster có đang nhận nhiều lưu lượng hơn các broker khác hay không, điều đó sẽ cho thấy cần phải cân bằng lại các partition trong cluster. Xem Bảng 13-8 để biết thêm chi tiết.

**Bảng 13-8. Chi tiết metric all topics bytes in**

| Mục | Giá trị |
|---|---|
| Metric name | Bytes in per second |
| JMX MBean | `kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec` |
| Value range | Rate ở dạng double, count ở dạng số nguyên |

Vì đây là metric dạng rate đầu tiên được bàn tới, cũng đáng để thảo luận ngắn về các thuộc tính (attribute) mà loại metric này cung cấp. Tất cả các metric dạng rate đều có bảy thuộc tính, và việc chọn dùng thuộc tính nào phụ thuộc vào loại phép đo bạn muốn. Các thuộc tính cung cấp một số đếm rời rạc của các sự kiện, cũng như giá trị trung bình của số sự kiện trên các khoảng thời gian khác nhau. Hãy đảm bảo dùng các metric một cách phù hợp, nếu không bạn sẽ có một góc nhìn sai lệch về broker.

Hai thuộc tính đầu tiên không phải là phép đo, nhưng chúng sẽ giúp bạn hiểu metric mà bạn đang xem:

- **EventType**

  Đây là đơn vị đo cho tất cả các thuộc tính. Trong trường hợp này, nó là "bytes".

- **RateUnit**

  Đối với các thuộc tính rate, đây là khoảng thời gian cho rate. Trong trường hợp này, nó là "seconds".

Hai thuộc tính mô tả này cho chúng ta biết rằng các rate, bất kể chúng lấy trung bình trên khoảng thời gian nào, đều được trình bày dưới dạng giá trị byte mỗi giây. Có bốn thuộc tính rate được cung cấp với các mức chi tiết khác nhau:

- **OneMinuteRate**

  Giá trị trung bình trong 1 phút trước đó

- **FiveMinuteRate**

  Giá trị trung bình trong 5 phút trước đó

- **FifteenMinuteRate**

  Giá trị trung bình trong 15 phút trước đó

- **MeanRate**

  Giá trị trung bình kể từ khi broker được khởi động

`OneMinuteRate` sẽ dao động nhanh và cung cấp một góc nhìn thiên về "tại một thời điểm" của phép đo. Điều này hữu ích để thấy các đỉnh lưu lượng ngắn hạn. `MeanRate` sẽ hầu như không biến động nhiều và cung cấp một xu hướng tổng thể. Mặc dù `MeanRate` có công dụng riêng, nó có lẽ không phải là metric mà bạn muốn dùng để cảnh báo. `FiveMinuteRate` và `FifteenMinuteRate` cung cấp một sự dung hòa giữa hai loại trên.

Ngoài các thuộc tính rate, còn có thuộc tính `Count`. Đây là một giá trị tăng liên tục của metric kể từ thời điểm broker được khởi động. Đối với metric này, all topics bytes in, `Count` biểu diễn tổng số byte đã được produce tới broker kể từ khi tiến trình được khởi động. Khi được dùng với một hệ thống metric hỗ trợ counter metric, nó có thể cho bạn một góc nhìn tuyệt đối về phép đo thay vì một rate đã được lấy trung bình.

#### All topics bytes out

Tốc độ all topics bytes out, tương tự tốc độ bytes in, là một metric tăng trưởng tổng thể khác. Trong trường hợp này, tốc độ bytes out cho thấy tốc độ mà các consumer đang đọc message ra. Tốc độ byte đi ra có thể co giãn khác với tốc độ byte đi vào, nhờ khả năng của Kafka trong việc phục vụ nhiều consumer một cách dễ dàng. Có nhiều hệ thống Kafka triển khai mà tốc độ đi ra có thể dễ dàng gấp sáu lần tốc độ đi vào! Đó là lý do vì sao việc quan sát và theo dõi xu hướng của tốc độ byte đi ra một cách riêng biệt là quan trọng. Xem Bảng 13-9 để biết thêm chi tiết.

**Bảng 13-9. Chi tiết metric all topics bytes out**

| Mục | Giá trị |
|---|---|
| Metric name | Bytes out per second |
| JMX MBean | `kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec` |
| Value range | Rate ở dạng double, count ở dạng số nguyên |

> **CÓ TÍNH CẢ REPLICA FETCHER**
>
> Tốc độ byte đi ra cũng bao gồm cả lưu lượng replica. Điều này có nghĩa là nếu tất cả các topic đều được cấu hình với replication factor là 2, bạn sẽ thấy tốc độ bytes out bằng với tốc độ bytes in khi không có consumer client nào. Nếu bạn có một consumer client đọc tất cả message trong cluster, thì tốc độ bytes out sẽ gấp đôi tốc độ bytes in. Điều này có thể gây bối rối khi nhìn vào các metric nếu bạn không biết cái gì đang được tính vào.

#### All topics messages in

Trong khi các tốc độ byte được mô tả ở trên cho thấy lưu lượng broker theo số byte tuyệt đối, thì tốc độ messages in cho thấy số lượng message riêng lẻ, bất kể kích thước của chúng, được produce mỗi giây. Điều này hữu ích như một metric tăng trưởng theo một thước đo khác về lưu lượng producer. Nó cũng có thể được dùng kết hợp với tốc độ bytes in để xác định kích thước message trung bình. Bạn cũng có thể thấy sự mất cân bằng giữa các broker, giống như với tốc độ bytes in, điều này sẽ cảnh báo cho bạn về công việc bảo trì cần thiết. Xem Bảng 13-10 để biết thêm chi tiết.

**Bảng 13-10. Chi tiết metric all topics messages in**

| Mục | Giá trị |
|---|---|
| Metric name | Messages in per second |
| JMX MBean | `kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec` |
| Value range | Rate ở dạng double, count ở dạng số nguyên |

> **TẠI SAO KHÔNG CÓ MESSAGES OUT?**
>
> Mọi người thường hỏi vì sao không có metric messages out cho Kafka broker. Lý do là khi message được consume, broker chỉ gửi batch tiếp theo tới consumer mà không giải nén nó ra để biết bên trong có bao nhiêu message. Do đó, broker thực sự không biết đã gửi ra bao nhiêu message. Metric duy nhất có thể cung cấp là số lượng fetch mỗi giây, và đó là một tốc độ request, chứ không phải số đếm message.

#### Partition count

Partition count của một broker nói chung không thay đổi nhiều, vì nó là tổng số partition được gán cho broker đó. Con số này bao gồm mọi replica mà broker có, bất kể nó là leader hay follower cho partition đó. Việc giám sát metric này thường thú vị hơn trong một cluster có bật tính năng tự động tạo topic, vì điều đó có thể khiến việc tạo topic nằm ngoài tầm kiểm soát của người vận hành cluster. Xem Bảng 13-11 để biết thêm chi tiết.

**Bảng 13-11. Chi tiết metric partition count**

| Mục | Giá trị |
|---|---|
| Metric name | Partition count |
| JMX MBean | `kafka.server:type=ReplicaManager,name=PartitionCount` |
| Value range | Số nguyên, bằng không hoặc lớn hơn |

#### Leader count

Metric leader count cho thấy số lượng partition mà broker hiện đang là leader. Cũng như phần lớn các phép đo khác trên broker, metric này nói chung nên đồng đều giữa các broker trong cluster. Việc kiểm tra leader count một cách định kỳ, thậm chí đặt cảnh báo cho nó, là quan trọng hơn nhiều, vì nó sẽ cho biết khi nào cluster mất cân bằng ngay cả khi số lượng và kích thước replica được cân bằng hoàn hảo trên toàn cluster. Đó là vì một broker có thể mất quyền leadership của một partition vì nhiều lý do, chẳng hạn như hết hạn phiên ZooKeeper, và nó sẽ không tự động lấy lại quyền leadership khi khôi phục (trừ khi bạn đã bật tự động cân bằng leader). Trong những trường hợp này, metric này sẽ hiển thị số leader ít hơn, hoặc thường là bằng không, điều đó cho thấy bạn cần chạy một preferred replica election để cân bằng lại leadership trong cluster. Xem Bảng 13-12 để biết thêm chi tiết.

**Bảng 13-12. Chi tiết metric leader count**

| Mục | Giá trị |
|---|---|
| Metric name | Leader count |
| JMX MBean | `kafka.server:type=ReplicaManager,name=LeaderCount` |
| Value range | Số nguyên, bằng không hoặc lớn hơn |

Một cách hữu ích để sử dụng metric này là dùng nó cùng với partition count để hiển thị tỉ lệ phần trăm số partition mà broker đang làm leader. Trong một cluster được cân bằng tốt sử dụng replication factor là 2, tất cả các broker nên là leader cho khoảng 50% số partition của chúng. Nếu replication factor đang dùng là 3, tỉ lệ này giảm xuống 33%.

#### Offline partitions

Cùng với số lượng under-replicated partitions, số lượng offline partitions là một metric then chốt cần giám sát (xem Bảng 13-13). Phép đo này chỉ được cung cấp bởi broker đang là controller của cluster (tất cả các broker khác sẽ báo cáo 0) và cho thấy số lượng partition trong cluster hiện không có leader. Partition không có leader có thể xảy ra vì hai lý do chính:

- Tất cả các broker chứa replica cho partition này đều đã ngừng hoạt động
- Không có in-sync replica nào có thể nhận quyền leadership do sai lệch về số lượng message (với unclean leader election bị tắt)

**Bảng 13-13. Chi tiết metric offline partitions count**

| Mục | Giá trị |
|---|---|
| Metric name | Offline partitions count |
| JMX MBean | `kafka.controller:type=KafkaController,name=OfflinePartitionsCount` |
| Value range | Số nguyên, bằng không hoặc lớn hơn |

Trong một cluster Kafka production, một offline partition có thể đang ảnh hưởng tới các producer client, gây mất message hoặc gây back pressure trong ứng dụng. Đây thường là loại sự cố "sập dịch vụ" và cần được xử lý ngay lập tức.

#### Request metrics

Giao thức Kafka, được mô tả ở Chương 6, có nhiều loại request khác nhau. Các metric được cung cấp cho biết mỗi loại request đó hoạt động ra sao. Tính đến phiên bản 2.5.0, các request sau đây có metric được cung cấp:

**Bảng 13-14. Tên các request metric**

| | | |
|---|---|---|
| AddOffsetsToTxn | AddPartitionsToTxn | AlterConfigs |
| AlterPartitionReassignments | AlterReplicaLogDirs | ApiVersions |
| ControlledShutdown | CreateAcls | CreateDelegationToken |
| CreatePartitions | CreateTopics | DeleteAcls |
| DeleteGroups | DeleteRecords | DeleteTopics |
| DescribeAcls | DescribeConfigs | DescribeDelegationToken |
| DescribeGroups | DescribeLogDirs | ElectLeaders |
| EndTxn | ExpireDelegationToken | Fetch |
| FetchConsumer | FetchFollower | FindCoordinator |
| Heartbeat | IncrementalAlterConfigs | InitProducerId |
| JoinGroup | LeaderAndIsr | LeaveGroup |
| ListGroups | ListOffsets | ListPartitionReassignments |
| Metadata | OffsetCommit | OffsetDelete |
| OffsetFetch | OffsetsForLeaderEpoch | Produce |
| RenewDelegationToken | SaslAuthenticate | SaslHandshake |
| StopReplica | SyncGroup | TxnOffsetCommit |
| UpdateMetadata | WriteTxnMarkers | |

Với mỗi request trong số này, có tám metric được cung cấp, mang lại cái nhìn vào từng giai đoạn của quá trình xử lý request. Ví dụ, với request `Fetch`, các metric trong Bảng 13-15 là khả dụng.

**Bảng 13-15. Các metric của request Fetch**

| Name | JMX MBean |
|---|---|
| Total time | `kafka.network:type=RequestMetrics,name=TotalTimeMs,request=Fetch` |
| Request queue time | `kafka.network:type=RequestMetrics,name=RequestQueueTimeMs,request=Fetch` |
| Local time | `kafka.network:type=RequestMetrics,name=LocalTimeMs,request=Fetch` |
| Remote time | `kafka.network:type=RequestMetrics,name=RemoteTimeMs,request=Fetch` |
| Throttle time | `kafka.network:type=RequestMetrics,name=ThrottleTimeMs,request=Fetch` |
| Response queue time | `kafka.network:type=RequestMetrics,name=ResponseQueueTimeMs,request=Fetch` |
| Response send time | `kafka.network:type=RequestMetrics,name=ResponseSendTimeMs,request=Fetch` |
| Requests per second | `kafka.network:type=RequestMetrics,name=RequestsPerSec,request=Fetch` |

Metric requests per second là một metric dạng rate, như đã bàn ở trên, và cho thấy tổng số request thuộc loại đó đã được nhận và xử lý trong đơn vị thời gian. Nó cung cấp cái nhìn về tần suất của từng loại request, mặc dù cần lưu ý rằng nhiều request, chẳng hạn như `StopReplica` và `UpdateMetadata`, xảy ra không thường xuyên.

Bảy metric thời gian mỗi cái đều cung cấp một tập các percentile cho các request, cũng như một thuộc tính `Count` rời rạc, tương tự như các metric dạng rate. Tất cả các metric đều được tính kể từ khi broker được khởi động, vì vậy hãy ghi nhớ điều đó khi xem các metric không thay đổi trong thời gian dài; broker của bạn chạy càng lâu thì các con số càng ổn định. Các phần của quá trình xử lý request mà chúng biểu diễn là:

- **Total time**

  Tổng thời gian broker dành để xử lý request, từ lúc nhận nó cho tới lúc gửi response trả lại cho bên gửi request

- **Request queue time**

  Khoảng thời gian request nằm trong hàng đợi sau khi đã được nhận nhưng trước khi việc xử lý bắt đầu

- **Local time**

  Khoảng thời gian partition leader dành để xử lý một request, bao gồm cả việc gửi nó xuống đĩa (nhưng không nhất thiết là flush)

- **Remote time**

  Khoảng thời gian dành cho việc chờ các follower trước khi việc xử lý request có thể hoàn tất

- **Throttle time**

  Khoảng thời gian response phải được giữ lại nhằm làm chậm bên gửi request để thỏa mãn các thiết lập quota của client

- **Response queue time**

  Khoảng thời gian response của request nằm trong hàng đợi trước khi có thể được gửi tới bên gửi request

- **Response send time**

  Khoảng thời gian thực sự dành cho việc gửi response

Các thuộc tính được cung cấp cho mỗi metric là:

- **Count**

  Số đếm tuyệt đối của số request kể từ khi tiến trình khởi động

- **Min**

  Giá trị nhỏ nhất trong tất cả các request

- **Max**

  Giá trị lớn nhất trong tất cả các request

- **Mean**

  Giá trị trung bình của tất cả các request

- **StdDev**

  Độ lệch chuẩn của toàn bộ các phép đo thời gian request

- **Percentiles**

  `50thPercentile`, `75thPercentile`, `95thPercentile`, `98thPercentile`, `99thPercentile`, `999thPercentile`

> **PERCENTILE LÀ GÌ?**
>
> Percentile là một cách phổ biến để nhìn vào các phép đo thời gian. Một phép đo percentile thứ 99 cho chúng ta biết rằng 99% tất cả các giá trị trong nhóm mẫu (ở đây là thời gian của các request) nhỏ hơn giá trị của metric. Điều này nghĩa là 1% các giá trị lớn hơn giá trị được nêu. Một mẫu hình phổ biến là xem giá trị trung bình cùng với giá trị 99% hoặc 99,9%. Bằng cách này, bạn có thể hiểu request trung bình hoạt động ra sao và các giá trị ngoại lai là gì.

Trong tất cả các metric và thuộc tính này cho request, cái nào là quan trọng cần giám sát? Ở mức tối thiểu, bạn nên thu thập ít nhất giá trị trung bình và một trong các percentile cao hơn (99% hoặc 99,9%) cho metric total time, cũng như metric requests per second, cho mọi loại request. Điều này cho một cái nhìn về hiệu năng tổng thể của các request tới Kafka broker. Nếu có thể, bạn cũng nên thu thập các phép đo đó cho sáu metric thời gian còn lại của từng loại request, vì việc này sẽ cho phép bạn thu hẹp bất kỳ vấn đề hiệu năng nào về một giai đoạn cụ thể của quá trình xử lý request.

Đối với việc đặt ngưỡng cảnh báo, các metric thời gian có thể khó xử lý. Ví dụ, thời gian cho một request `Fetch` có thể biến thiên rất mạnh tùy thuộc vào nhiều yếu tố, bao gồm thiết lập trên client về việc nó sẽ chờ message bao lâu, topic đang được fetch bận rộn đến mức nào, và tốc độ kết nối mạng giữa client và broker. Tuy nhiên, việc xây dựng một giá trị cơ sở cho phép đo percentile thứ 99,9 cho ít nhất total time, đặc biệt là với các request `Produce`, và đặt cảnh báo dựa trên đó có thể rất hữu ích. Cũng giống như metric under-replicated partitions, một sự tăng vọt đột ngột ở percentile thứ 99,9 cho các request `Produce` có thể cảnh báo cho bạn về một loạt các vấn đề hiệu năng.

### Metric của topic và partition (Topic and Partition Metrics)

Ngoài rất nhiều metric có sẵn trên broker mô tả hoạt động của Kafka broker nói chung, còn có các metric riêng cho topic và partition. Trong các cluster lớn, những metric này có thể rất nhiều, và có thể không khả thi để thu thập tất cả chúng vào một hệ thống metric như một phần của vận hành thông thường. Tuy nhiên, chúng khá hữu ích để gỡ lỗi các vấn đề cụ thể với một client. Ví dụ, các metric của topic có thể được dùng để xác định một topic cụ thể đang gây ra sự tăng mạnh lưu lượng tới cluster. Cũng có thể quan trọng khi cung cấp các metric này để người dùng Kafka (các producer và consumer client) có thể truy cập chúng. Bất kể bạn có thể thu thập các metric này thường xuyên hay không, bạn nên biết cái nào là hữu ích.

Với tất cả các ví dụ trong Bảng 13-16, chúng ta sẽ dùng tên topic ví dụ là `TOPICNAME`, cũng như partition 0. Khi truy cập các metric được mô tả, hãy đảm bảo thay thế bằng tên topic và số partition phù hợp với cluster của bạn.

#### Metric theo từng topic (Per-topic metrics)

Với tất cả các metric theo từng topic, các phép đo rất giống với các metric của broker đã mô tả ở trên. Thực tế, khác biệt duy nhất là có thêm tên topic được cung cấp, và các metric sẽ chỉ dành riêng cho topic được nêu tên. Với số lượng metric khả dụng khổng lồ, tùy thuộc vào số lượng topic hiện có trong cluster của bạn, đây gần như chắc chắn là những metric mà bạn sẽ không muốn thiết lập giám sát và cảnh báo. Tuy nhiên, chúng hữu ích để cung cấp cho các client, giúp họ có thể đánh giá và gỡ lỗi việc sử dụng Kafka của chính mình.

**Bảng 13-16. Metric cho từng topic**

| Name | JMX MBean |
|---|---|
| Bytes in rate | `kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec,topic=TOPICNAME` |
| Bytes out rate | `kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec,topic=TOPICNAME` |
| Failed fetch rate | `kafka.server:type=BrokerTopicMetrics,name=FailedFetchRequestsPerSec,topic=TOPICNAME` |
| Failed produce rate | `kafka.server:type=BrokerTopicMetrics,name=FailedProduceRequestsPerSec,topic=TOPICNAME` |
| Messages in rate | `kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec,topic=TOPICNAME` |
| Fetch request rate | `kafka.server:type=BrokerTopicMetrics,name=TotalFetchRequestsPerSec,topic=TOPICNAME` |
| Produce request rate | `kafka.server:type=BrokerTopicMetrics,name=TotalProduceRequestsPerSec,topic=TOPICNAME` |

#### Metric theo từng partition (Per-partition metrics)

Các metric theo từng partition có xu hướng ít hữu ích hơn trên cơ sở liên tục so với các metric theo từng topic. Ngoài ra, chúng khá nhiều, vì hàng trăm topic có thể dễ dàng trở thành hàng nghìn partition. Tuy nhiên, chúng có thể hữu ích trong một số tình huống hạn chế. Cụ thể, metric partition-size cho biết lượng dữ liệu (tính bằng byte) hiện đang được lưu giữ trên đĩa cho partition đó (Bảng 13-17). Khi kết hợp lại, chúng sẽ cho biết lượng dữ liệu được lưu giữ cho một topic duy nhất, điều này có thể hữu ích trong việc phân bổ chi phí Kafka cho từng client. Sự chênh lệch giữa kích thước của hai partition thuộc cùng một topic có thể cho thấy một vấn đề là các message không được phân bố đều theo key được dùng khi produce. Metric log-segment count cho thấy số lượng file log segment trên đĩa cho partition đó. Điều này có thể hữu ích cùng với partition size để theo dõi tài nguyên.

**Bảng 13-17. Metric cho từng partition**

| Name | JMX MBean |
|---|---|
| Partition size | `kafka.log:type=Log,name=Size,topic=TOPICNAME,partition=0` |
| Log segment count | `kafka.log:type=Log,name=NumLogSegments,topic=TOPICNAME,partition=0` |
| Log end offset | `kafka.log:type=Log,name=LogEndOffset,topic=TOPICNAME,partition=0` |
| Log start offset | `kafka.log:type=Log,name=LogStartOffset,topic=TOPICNAME,partition=0` |

Các metric log end offset và log start offset lần lượt là offset cao nhất và thấp nhất cho các message trong partition đó. Tuy nhiên, cần lưu ý rằng hiệu giữa hai con số này không nhất thiết cho biết số lượng message trong partition, vì log compaction có thể dẫn tới các offset "bị thiếu" đã bị xóa khỏi partition do có các message mới hơn với cùng key. Trong một số môi trường, việc theo dõi các offset này cho một partition có thể hữu ích. Một tình huống sử dụng như vậy là cung cấp một ánh xạ chi tiết hơn từ timestamp sang offset, cho phép các consumer client dễ dàng quay ngược offset về một thời điểm cụ thể (mặc dù điều này ít quan trọng hơn với việc tìm kiếm theo index dựa trên thời gian, được giới thiệu trong Kafka 0.10.1).

> **METRIC UNDER-REPLICATED PARTITION**
>
> Có một metric theo từng partition được cung cấp để cho biết partition đó có bị under-replicated hay không. Nói chung, metric này không hữu ích lắm trong vận hành hằng ngày, vì có quá nhiều metric để thu thập và theo dõi. Sẽ dễ dàng hơn nhiều khi giám sát số lượng under-replicated partition ở mức toàn broker rồi dùng các công cụ dòng lệnh (được mô tả ở Chương 12) để xác định các partition cụ thể nào đang bị under-replicated.

### Giám sát JVM (JVM Monitoring)

Ngoài các metric do Kafka broker cung cấp, bạn nên giám sát một bộ các phép đo tiêu chuẩn cho tất cả máy chủ của mình, cũng như cho chính Java Virtual Machine (JVM). Chúng sẽ hữu ích trong việc cảnh báo cho bạn về một tình huống, chẳng hạn như hoạt động garbage collection tăng lên, sẽ làm suy giảm hiệu năng của broker. Chúng cũng sẽ cho bạn cái nhìn về lý do vì sao bạn thấy các thay đổi ở những metric phía sau trong broker.

#### Garbage collection

Đối với JVM, thứ quan trọng cần giám sát là trạng thái của garbage collection (GC). Các bean cụ thể mà bạn phải giám sát để có thông tin này sẽ khác nhau tùy vào Java Runtime Environment (JRE) cụ thể mà bạn đang dùng, cũng như các thiết lập GC cụ thể đang được sử dụng. Với một Oracle Java 1.8 JRE chạy với G1 garbage collection, các bean cần dùng được liệt kê trong Bảng 13-18.

**Bảng 13-18. Metric của G1 garbage collection**

| Name | JMX MBean |
|---|---|
| Full GC cycles | `java.lang:type=GarbageCollector,name=G1 Old Generation` |
| Young GC cycles | `java.lang:type=GarbageCollector,name=G1 Young Generation` |

Lưu ý rằng trong ngữ nghĩa của GC, "Old" và "Full" là cùng một thứ. Với mỗi metric này, hai thuộc tính cần theo dõi là `CollectionCount` và `CollectionTime`. `CollectionCount` là số chu kỳ GC thuộc loại đó (Full hoặc Young) kể từ khi JVM được khởi động. `CollectionTime` là lượng thời gian, tính bằng mili giây, đã dành cho loại chu kỳ GC đó kể từ khi JVM được khởi động. Vì các phép đo này là counter, chúng có thể được một hệ thống metric sử dụng để cho bạn biết số chu kỳ GC tuyệt đối và thời gian dành cho GC trên mỗi đơn vị thời gian. Chúng cũng có thể được dùng để cung cấp lượng thời gian trung bình cho mỗi chu kỳ GC, mặc dù điều này ít hữu ích hơn trong vận hành bình thường.

Mỗi metric này cũng có một thuộc tính `LastGcInfo`. Đây là một giá trị hỗn hợp (composite), gồm năm trường, cung cấp cho bạn thông tin về chu kỳ GC gần nhất thuộc loại GC được mô tả bởi bean đó. Giá trị quan trọng cần xem là giá trị `duration`, vì nó cho bạn biết chu kỳ GC gần nhất kéo dài bao lâu, tính bằng mili giây. Các giá trị khác trong composite (`GcThreadCount`, `id`, `startTime` và `endTime`) mang tính thông tin và không hữu ích lắm. Cần lưu ý rằng bạn sẽ không thể thấy thời gian của mọi chu kỳ GC bằng thuộc tính này, vì các chu kỳ young GC nói riêng có thể xảy ra rất thường xuyên.

#### Giám sát OS qua Java (Java OS monitoring)

JVM có thể cung cấp cho bạn một số thông tin về OS thông qua bean `java.lang:type=OperatingSystem`. Tuy nhiên, thông tin này bị hạn chế và không phản ánh mọi thứ bạn cần biết về hệ thống đang chạy broker của mình. Hai thuộc tính có thể thu thập ở đây và có ích, mà lại khó thu thập ở mức OS, là `MaxFileDescriptorCount` và `OpenFileDescriptorCount`. `MaxFileDescriptorCount` sẽ cho bạn biết số lượng file descriptor (FD) tối đa mà JVM được phép mở. Thuộc tính `OpenFileDescriptorCount` cho bạn biết số FD hiện đang mở. Sẽ có FD mở cho mỗi log segment và mỗi kết nối mạng, và chúng có thể tăng lên rất nhanh. Một vấn đề trong việc đóng kết nối mạng đúng cách có thể khiến broker nhanh chóng cạn kiệt số FD cho phép.

### Giám sát hệ điều hành (OS Monitoring)

JVM không thể cung cấp cho chúng ta tất cả thông tin mà chúng ta cần biết về hệ thống mà nó đang chạy. Vì lý do này, chúng ta không chỉ phải thu thập metric từ broker mà còn từ chính OS. Hầu hết các hệ thống giám sát sẽ cung cấp các agent thu thập nhiều thông tin OS hơn cả những gì bạn có thể quan tâm. Các lĩnh vực chính cần theo dõi là mức sử dụng CPU, mức sử dụng bộ nhớ, mức sử dụng đĩa, disk I/O và mức sử dụng mạng.

Với mức sử dụng CPU, ít nhất bạn sẽ muốn xem system load average. Nó cung cấp một con số duy nhất cho biết mức sử dụng tương đối của các bộ xử lý. Ngoài ra, cũng có thể hữu ích khi ghi nhận tỉ lệ phần trăm sử dụng CPU, được phân tách theo loại. Tùy vào phương pháp thu thập và OS cụ thể của bạn, bạn có thể có một số hoặc tất cả các phân tách tỉ lệ CPU sau (kèm theo chữ viết tắt được dùng):

- **us**

  Thời gian dành trong user space

- **sy**

  Thời gian dành trong kernel space

- **ni**

  Thời gian dành cho các tiến trình có độ ưu tiên thấp

- **id**

  Thời gian nhàn rỗi

- **wa**

  Thời gian dành cho việc chờ (đĩa)

- **hi**

  Thời gian dành cho việc xử lý ngắt phần cứng

- **si**

  Thời gian dành cho việc xử lý ngắt phần mềm

- **st**

  Thời gian chờ hypervisor

> **SYSTEM LOAD LÀ GÌ?**
>
> Trong khi nhiều người biết rằng system load là một thước đo mức sử dụng CPU trên hệ thống, đa số lại hiểu sai về cách nó được đo. Load average là số lượng tiến trình đang ở trạng thái sẵn sàng chạy và đang chờ một bộ xử lý để thực thi. Linux cũng bao gồm cả các thread đang ở trạng thái ngủ không thể ngắt (uninterruptable sleep), chẳng hạn như đang chờ đĩa. Load được trình bày dưới dạng ba con số, là số đếm trung bình trong 1 phút, 5 phút và 15 phút gần nhất. Trong một hệ thống một CPU, giá trị 1 sẽ nghĩa là hệ thống tải 100%, với luôn có một thread đang chờ để thực thi. Điều này nghĩa là trên một hệ thống nhiều CPU, con số load average tương ứng 100% bằng với số CPU trong hệ thống. Ví dụ, nếu có 24 bộ xử lý trong hệ thống, 100% sẽ là load average bằng 24.

Kafka broker sử dụng một lượng xử lý đáng kể cho việc xử lý request. Vì lý do này, việc theo dõi mức sử dụng CPU là quan trọng khi giám sát Kafka. Bộ nhớ ít quan trọng hơn để theo dõi đối với chính broker, vì Kafka thường được chạy với kích thước JVM heap tương đối nhỏ. Nó sẽ dùng một lượng nhỏ bộ nhớ nằm ngoài heap cho các chức năng nén, nhưng phần lớn bộ nhớ hệ thống sẽ được để dành cho cache. Dù vậy, bạn vẫn nên theo dõi mức sử dụng bộ nhớ để đảm bảo các ứng dụng khác không xâm phạm vào phần của broker. Bạn cũng sẽ muốn đảm bảo rằng swap memory không được sử dụng, bằng cách giám sát tổng dung lượng swap và dung lượng swap còn trống.

Đĩa cho đến nay là hệ thống con quan trọng nhất khi nói tới Kafka. Tất cả message đều được lưu bền vững xuống đĩa, vì vậy hiệu năng của Kafka phụ thuộc nặng nề vào hiệu năng của các đĩa. Việc giám sát mức sử dụng cả không gian đĩa lẫn inode (inode là các đối tượng metadata của file và thư mục trong hệ thống file Unix) là quan trọng, vì bạn cần đảm bảo mình không hết chỗ trống. Điều này đặc biệt đúng với các phân vùng nơi dữ liệu Kafka được lưu trữ. Cũng cần giám sát các thống kê disk I/O, vì điều đó sẽ cho chúng ta biết đĩa có đang được sử dụng hiệu quả hay không. Ít nhất với các đĩa lưu trữ dữ liệu Kafka, hãy giám sát số lần đọc và ghi mỗi giây, kích thước hàng đợi đọc và ghi trung bình, thời gian chờ trung bình, và tỉ lệ phần trăm sử dụng của đĩa.

Cuối cùng, hãy giám sát mức sử dụng mạng trên các broker. Đây đơn giản là lượng lưu lượng mạng vào và ra, thường được báo cáo bằng bit mỗi giây. Hãy nhớ rằng mỗi bit đi vào Kafka broker sẽ tương ứng với một số bit đi ra bằng với replication factor của các topic, chưa tính tới consumer. Tùy vào số lượng consumer, lưu lượng mạng đi ra có thể dễ dàng lớn hơn lưu lượng đi vào cả một bậc độ lớn. Hãy ghi nhớ điều này khi đặt ngưỡng cho cảnh báo.

### Logging

Không có cuộc thảo luận nào về giám sát là trọn vẹn nếu thiếu một vài lời về logging. Giống như nhiều ứng dụng khác, Kafka broker sẽ lấp đầy đĩa bằng các thông điệp log chỉ trong vài phút nếu bạn để mặc nó. Để lấy được thông tin hữu ích từ logging, điều quan trọng là bật đúng các logger ở đúng mức. Chỉ bằng cách log tất cả các thông điệp ở mức INFO, bạn sẽ thu được một lượng đáng kể thông tin quan trọng về trạng thái của broker. Tuy nhiên, việc tách một vài logger ra khỏi nhóm này là hữu ích, nhằm cung cấp một tập file log gọn gàng hơn.

Có hai logger ghi ra các file riêng biệt trên đĩa. Cái đầu tiên là `kafka.controller`, vẫn ở mức INFO. Logger này được dùng để cung cấp các thông điệp cụ thể liên quan tới cluster controller. Tại bất kỳ thời điểm nào, chỉ một broker là controller, và do đó chỉ một broker sẽ ghi vào logger này. Thông tin bao gồm việc tạo và sửa đổi topic, thay đổi trạng thái broker, và các hoạt động của cluster như preferred replica election và di chuyển partition. Logger còn lại cần tách ra là `kafka.server.ClientQuotaManager`, cũng ở mức INFO. Logger này được dùng để hiển thị các thông điệp liên quan tới hoạt động quota của produce và consume. Dù đây là thông tin hữu ích, tốt hơn là không để nó trong file log chính của broker.

Cũng hữu ích khi log thông tin liên quan tới trạng thái của các thread log compaction. Không có metric đơn lẻ nào cho thấy sức khỏe của các thread này, và hoàn toàn có thể xảy ra việc lỗi khi compaction một partition duy nhất làm dừng hẳn các thread log compaction, một cách âm thầm. Việc bật các logger `kafka.log.LogCleaner`, `kafka.log.Cleaner` và `kafka.log.LogCleanerManager` ở mức DEBUG sẽ xuất ra thông tin về trạng thái của các thread này. Nó sẽ bao gồm thông tin về từng partition đang được compaction, gồm kích thước và số lượng message trong mỗi partition. Trong vận hành bình thường, lượng log này không nhiều, nghĩa là nó có thể được bật mặc định mà không làm bạn quá tải.

Cũng có một số logging có thể hữu ích để bật lên khi gỡ lỗi các vấn đề với Kafka. Một logger như vậy là `kafka.request.logger`, bật ở mức DEBUG hoặc TRACE. Nó ghi log thông tin về mọi request được gửi tới broker. Ở mức DEBUG, log bao gồm các endpoint kết nối, thời gian request và thông tin tóm tắt. Ở mức TRACE, nó cũng sẽ bao gồm thông tin về topic và partition — gần như toàn bộ thông tin request ngoại trừ chính payload của message. Ở cả hai mức, logger này sinh ra một lượng dữ liệu đáng kể, và không nên bật nó trừ khi cần thiết cho việc gỡ lỗi.

## Giám sát client (Client Monitoring)

Mọi ứng dụng đều cần được giám sát. Những ứng dụng khởi tạo một Kafka client, dù là producer hay consumer, đều có các metric riêng của client cần được thu thập. Phần này trình bày về các thư viện client Java chính thức, mặc dù các bản hiện thực khác cũng nên có những phép đo riêng của chúng.

### Producer Metrics

Kafka producer client đã cô đọng đáng kể các metric khả dụng bằng cách cung cấp chúng dưới dạng thuộc tính trên một số ít JMX MBean. Ngược lại, phiên bản producer client trước đây (hiện không còn được hỗ trợ) dùng một số lượng MBean lớn hơn nhưng lại chi tiết hơn ở nhiều metric (cung cấp nhiều phép đo percentile hơn và các đường trung bình động khác nhau). Kết quả là, tổng số metric được cung cấp bao phủ một diện tích rộng hơn, nhưng lại có thể khó theo dõi các giá trị ngoại lai hơn.

Tất cả các metric của producer đều có client ID của producer client trong tên bean. Trong các ví dụ được cung cấp, phần này đã được thay bằng `CLIENTID`. Ở nơi tên bean chứa broker ID, nó đã được thay bằng `BROKERID`. Tên topic đã được thay bằng `TOPICNAME`. Xem Bảng 13-19 để có ví dụ.

**Bảng 13-19. Các MBean metric của Kafka producer**

| Name | JMX MBean |
|---|---|
| Overall producer | `kafka.producer:type=producer-metrics,client-id=CLIENTID` |
| Per-broker | `kafka.producer:type=producer-node-metrics,client-id=CLIENTID,node-id=node-BROKERID` |
| Per-topic | `kafka.producer:type=producer-topic-metrics,client-id=CLIENTID,topic=TOPICNAME` |

Mỗi bean metric trong Bảng 13-19 đều có nhiều thuộc tính khả dụng để mô tả trạng thái của producer. Các thuộc tính hữu ích nhất được mô tả trong phần tiếp theo. Trước khi tiếp tục, hãy chắc chắn rằng bạn hiểu ngữ nghĩa hoạt động của producer, như đã mô tả ở Chương 3.

#### Metric tổng thể của producer (Overall producer metrics)

Bean metric tổng thể của producer cung cấp các thuộc tính mô tả mọi thứ, từ kích thước của các message batch cho tới mức sử dụng bộ đệm bộ nhớ. Dù tất cả các phép đo này đều có chỗ dùng trong việc gỡ lỗi, chỉ có một số ít là cần thiết một cách thường xuyên, và chỉ vài trong số đó nên được giám sát và đặt cảnh báo. Lưu ý rằng trong khi chúng ta sẽ bàn về một số metric là giá trị trung bình (kết thúc bằng `-avg`), cũng có các giá trị lớn nhất cho mỗi metric (kết thúc bằng `-max`) nhưng chúng có tính hữu dụng hạn chế.

`record-error-rate` là một thuộc tính mà bạn chắc chắn sẽ muốn đặt cảnh báo. Metric này luôn phải bằng không, và nếu nó lớn hơn không, thì producer đang làm rơi các message mà nó cố gửi tới các Kafka broker. Producer có một số lần retry được cấu hình và một khoảng lùi (backoff) giữa các lần retry, và một khi số đó đã cạn, các message (ở đây gọi là record) sẽ bị loại bỏ. Cũng có một thuộc tính `record-retry-rate` có thể theo dõi, nhưng nó ít nghiêm trọng hơn error rate vì việc retry là bình thường.

Metric còn lại cần đặt cảnh báo là `request-latency-avg`. Đây là lượng thời gian trung bình mà một produce request gửi tới các broker mất. Bạn nên có thể thiết lập một giá trị cơ sở cho con số này trong vận hành bình thường, và đặt ngưỡng cảnh báo cao hơn mức đó. Việc request latency tăng lên nghĩa là các produce request đang trở nên chậm hơn. Điều này có thể do vấn đề mạng, hoặc có thể cho thấy vấn đề ở các broker. Dù thế nào đi nữa, đó là một vấn đề hiệu năng sẽ gây back pressure và các vấn đề khác trong ứng dụng producing của bạn.

Ngoài các metric then chốt này, việc biết producer của bạn đang gửi bao nhiêu lưu lượng message luôn là điều tốt. Ba thuộc tính sẽ cung cấp ba góc nhìn khác nhau về điều này. `outgoing-byte-rate` mô tả các message theo kích thước tuyệt đối bằng byte mỗi giây. `record-send-rate` mô tả lưu lượng theo số message được produce mỗi giây. Cuối cùng, `request-rate` cung cấp số produce request được gửi tới các broker mỗi giây. Một request chứa một hoặc nhiều batch. Một batch chứa một hoặc nhiều message. Và, tất nhiên, mỗi message được tạo thành từ một số byte nào đó. Các metric này đều hữu ích để có mặt trên dashboard ứng dụng.

Cũng có các metric mô tả kích thước của record, request và batch. Metric `request-size-avg` cung cấp kích thước trung bình của các produce request được gửi tới các broker, tính bằng byte. `batch-size-avg` cung cấp kích thước trung bình của một message batch đơn lẻ (mà theo định nghĩa, gồm các message cho một topic partition duy nhất), tính bằng byte. `record-size-avg` cho thấy kích thước trung bình của một record đơn lẻ, tính bằng byte. Với một producer chỉ làm việc với một topic, điều này cung cấp thông tin hữu ích về các message đang được produce. Với các producer làm việc với nhiều topic, chẳng hạn như MirrorMaker, nó ít mang tính thông tin hơn. Ngoài ba metric này, còn có metric `records-per-request-avg` mô tả số lượng message trung bình có trong một produce request duy nhất.

Thuộc tính metric tổng thể cuối cùng của producer được khuyến nghị là `record-queue-time-avg`. Phép đo này là lượng thời gian trung bình, tính bằng mili giây, mà một message đơn lẻ chờ trong producer, sau khi ứng dụng gửi nó, trước khi nó thực sự được produce tới Kafka. Sau khi một ứng dụng gọi producer client để gửi một message (bằng cách gọi phương thức `send`), producer chờ cho tới khi một trong hai điều sau xảy ra:

- Nó có đủ message để lấp đầy một batch dựa trên cấu hình `batch.size`.
- Đã đủ lâu kể từ lần gửi batch cuối cùng dựa trên cấu hình `linger.ms`.

Một trong hai điều này sẽ khiến producer client đóng batch hiện đang được xây dựng và gửi nó tới các broker. Cách dễ nhất để hiểu là với các topic bận rộn, điều kiện thứ nhất sẽ áp dụng, còn với các topic chậm, điều kiện thứ hai sẽ áp dụng. Phép đo `record-queue-time-avg` sẽ cho biết message mất bao lâu để được produce, và do đó hữu ích khi tinh chỉnh hai cấu hình này nhằm đáp ứng yêu cầu về độ trễ của ứng dụng của bạn.

#### Metric theo broker và theo topic (Per-broker and per-topic metrics)

Ngoài các metric tổng thể của producer, còn có các metric bean cung cấp một tập thuộc tính hạn chế cho kết nối tới từng Kafka broker, cũng như cho từng topic đang được produce. Các phép đo này hữu ích để gỡ lỗi trong một số trường hợp, nhưng chúng không phải là những metric mà bạn sẽ muốn xem xét thường xuyên. Tất cả các thuộc tính trên những bean này đều giống với các thuộc tính của bean producer tổng thể đã mô tả ở trên và mang cùng ý nghĩa như đã mô tả (ngoại trừ việc chúng áp dụng cho một broker cụ thể hoặc một topic cụ thể).

Metric hữu ích nhất do các metric producer theo broker cung cấp là phép đo `request-latency-avg`. Đó là bởi vì metric này sẽ khá ổn định (với giả định việc gom batch message ổn định) và vẫn có thể cho thấy vấn đề với kết nối tới một broker cụ thể. Các thuộc tính khác, chẳng hạn như `outgoing-byte-rate` và `request-latency-avg`, có xu hướng biến thiên tùy theo việc mỗi broker đang làm leader cho những partition nào. Điều này nghĩa là giá trị "đáng lẽ phải là" của các phép đo này tại bất kỳ thời điểm nào cũng có thể thay đổi nhanh chóng, tùy vào trạng thái của cluster Kafka.

Các metric theo topic thú vị hơn một chút so với các metric theo broker, nhưng chúng chỉ hữu ích với những producer làm việc với nhiều hơn một topic. Chúng cũng chỉ có thể dùng được một cách thường xuyên nếu producer không làm việc với quá nhiều topic. Ví dụ, một MirrorMaker có thể đang produce hàng trăm hoặc hàng nghìn topic. Rất khó để xem xét tất cả các metric đó, và gần như không thể đặt ngưỡng cảnh báo hợp lý cho chúng. Cũng như với các metric theo broker, các phép đo theo topic được dùng tốt nhất khi điều tra một vấn đề cụ thể. Ví dụ, các thuộc tính `record-send-rate` và `record-error-rate` có thể được dùng để khoanh vùng các message bị mất về một topic cụ thể (hoặc xác nhận rằng nó xảy ra trên tất cả các topic). Ngoài ra, có một metric `byte-rate` cung cấp tốc độ message tổng thể tính bằng byte mỗi giây cho topic đó.

### Consumer Metrics

Tương tự producer client, consumer trong Kafka hợp nhất nhiều metric thành các thuộc tính chỉ trên một vài metric bean. Các metric này cũng đã loại bỏ các percentile cho độ trễ và các đường trung bình động cho rate, vốn có mặt trong Scala consumer đã bị deprecated, tương tự như với producer client. Ở consumer, vì logic xoay quanh việc consume message phức tạp hơn một chút so với chỉ bắn message vào các Kafka broker, nên cũng có thêm vài metric nữa cần xử lý. Xem Bảng 13-20.

**Bảng 13-20. Các MBean metric của Kafka consumer**

| Name | JMX MBean |
|---|---|
| Overall consumer | `kafka.consumer:type=consumer-metrics,client-id=CLIENTID` |
| Fetch manager | `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=CLIENTID` |
| Per-topic | `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=CLIENTID,topic=TOPICNAME` |
| Per-broker | `kafka.consumer:type=consumer-node-metrics,client-id=CLIENTID,node-id=node-BROKERID` |
| Coordinator | `kafka.consumer:type=consumer-coordinator-metrics,client-id=CLIENTID` |

#### Metric của fetch manager (Fetch manager metrics)

Trong consumer client, bean metric tổng thể của consumer ít hữu ích hơn đối với chúng ta vì các metric đáng quan tâm lại nằm trong các bean của fetch manager. Bean consumer tổng thể có các metric liên quan tới những thao tác mạng ở mức thấp hơn, còn bean fetch manager có các metric liên quan tới tốc độ byte, request và record. Không giống producer client, các metric do consumer cung cấp thì hữu ích để xem nhưng lại không hữu ích để thiết lập cảnh báo.

Đối với fetch manager, một thuộc tính bạn có thể muốn thiết lập giám sát và cảnh báo là `fetch-latency-avg`. Cũng như `request-latency-avg` tương đương ở producer client, metric này cho chúng ta biết các fetch request tới các broker mất bao lâu. Vấn đề với việc cảnh báo dựa trên metric này là độ trễ bị chi phối bởi các cấu hình consumer `fetch.min.bytes` và `fetch.max.wait.ms`. Một topic chậm sẽ có độ trễ thất thường, vì đôi khi broker sẽ phản hồi nhanh (khi có message sẵn sàng), và đôi khi nó sẽ không phản hồi trong suốt `fetch.max.wait.ms` (khi không có message nào). Khi consume các topic có lưu lượng message đều đặn và dồi dào hơn, metric này có thể hữu ích hơn để xem xét.

> **KHOAN! KHÔNG CÓ LAG SAO?**
>
> Lời khuyên tốt nhất cho mọi consumer là bạn phải giám sát consumer lag. Vậy tại sao chúng tôi lại không khuyến nghị giám sát thuộc tính `records-lag-max` trên bean fetch manager? Metric này cho thấy lag hiện tại (hiệu giữa offset của consumer và log-end offset của broker) cho partition đang bị tụt lại xa nhất.
>
> Vấn đề với điều này gồm hai mặt: nó chỉ cho thấy lag của một partition, và nó dựa vào việc consumer hoạt động đúng. Nếu bạn không có lựa chọn nào khác, hãy dùng thuộc tính này cho lag và thiết lập cảnh báo cho nó. Nhưng thực hành tốt nhất là dùng giám sát lag từ bên ngoài, như sẽ được mô tả trong mục "Giám sát lag (Lag Monitoring)".

Để biết consumer client của bạn đang xử lý bao nhiêu lưu lượng message, bạn nên thu thập `bytes-consumed-rate` hoặc `records-consumed-rate`, hoặc tốt nhất là cả hai. Các metric này lần lượt mô tả lưu lượng message được consume bởi instance client này theo byte mỗi giây và message mỗi giây. Một số người dùng đặt ngưỡng tối thiểu cho các metric này để cảnh báo, nhằm được thông báo nếu consumer không làm đủ việc. Tuy nhiên, bạn nên cẩn thận khi làm vậy. Kafka được thiết kế để tách rời consumer và producer client, cho phép chúng hoạt động độc lập. Tốc độ mà consumer có thể consume message thường phụ thuộc vào việc producer có đang hoạt động đúng hay không, vì vậy việc giám sát các metric này trên consumer là đang đưa ra các giả định về trạng thái của producer. Điều này có thể dẫn tới các cảnh báo giả trên các consumer client.

Cũng nên hiểu mối quan hệ giữa byte, message và request, và fetch manager cung cấp các metric giúp làm điều này. Phép đo `fetch-rate` cho chúng ta biết số fetch request mỗi giây mà consumer đang thực hiện. Metric `fetch-size-avg` cho biết kích thước trung bình của các fetch request đó tính bằng byte. Cuối cùng, metric `records-per-request-avg` cho chúng ta biết số message trung bình trong mỗi fetch request. Lưu ý rằng consumer không cung cấp thứ tương đương với metric `record-size-avg` của producer để cho chúng ta biết kích thước trung bình của một message. Nếu điều này quan trọng, bạn sẽ cần suy ra nó từ các metric khác có sẵn hoặc tự ghi nhận nó trong ứng dụng của bạn sau khi nhận message từ thư viện consumer client.

#### Metric theo broker và theo topic (Per-broker and per-topic metrics)

Các metric mà consumer client cung cấp cho từng kết nối tới broker và cho từng topic đang được consume, cũng như với producer client, hữu ích để gỡ lỗi các vấn đề với việc consume, nhưng có lẽ sẽ không phải là các phép đo mà bạn xem xét hằng ngày. Cũng như với fetch manager, thuộc tính `request-latency-avg` do bean metric theo broker cung cấp có tính hữu dụng hạn chế, phụ thuộc vào lưu lượng message trong các topic bạn đang consume. Các metric `incoming-byte-rate` và `request-rate` phân tách các metric message được consume mà fetch manager cung cấp thành các phép đo byte mỗi giây và request mỗi giây theo từng broker. Chúng có thể được dùng để giúp khoanh vùng các vấn đề mà consumer đang gặp với kết nối tới một broker cụ thể.

Các metric theo topic do consumer client cung cấp là hữu ích nếu có nhiều hơn một topic đang được consume. Nếu không, các metric này sẽ giống hệt metric của fetch manager và việc thu thập chúng là dư thừa. Ở thái cực ngược lại, nếu client đang consume rất nhiều topic (ví dụ Kafka MirrorMaker), các metric này sẽ khó xem xét. Nếu bạn định thu thập chúng, các metric quan trọng nhất cần lấy là `bytes-consumed-rate`, `records-consumed-rate` và `fetch-size-avg`. `bytes-consumed-rate` cho thấy kích thước tuyệt đối tính bằng byte được consume mỗi giây cho topic cụ thể, trong khi `records-consumed-rate` cho thấy cùng thông tin đó theo số lượng message. `fetch-size-avg` cung cấp kích thước trung bình của mỗi fetch request cho topic đó tính bằng byte.

#### Metric của consumer coordinator (Consumer coordinator metrics)

Như đã mô tả ở Chương 4, các consumer client nói chung làm việc cùng nhau như một phần của một consumer group. Group này có các hoạt động phối hợp, chẳng hạn như việc các thành viên group tham gia, và các thông điệp heartbeat tới các broker để duy trì tư cách thành viên group. Consumer coordinator là phần của consumer client chịu trách nhiệm xử lý công việc này, và nó duy trì tập metric riêng của mình. Cũng như với mọi metric, có rất nhiều con số được cung cấp nhưng chỉ một vài con số then chốt mà bạn nên giám sát thường xuyên.

Vấn đề lớn nhất mà các consumer có thể gặp phải do các hoạt động của coordinator là việc tạm dừng consume trong khi consumer group đồng bộ. Đây là lúc các instance consumer trong một group thương lượng xem partition nào sẽ được consume bởi instance client nào. Tùy thuộc vào số lượng partition đang được consume, việc này có thể mất một khoảng thời gian. Coordinator cung cấp thuộc tính metric `sync-time-avg`, là lượng thời gian trung bình, tính bằng mili giây, mà hoạt động đồng bộ mất. Cũng hữu ích khi thu thập thuộc tính `sync-rate`, là số lần đồng bộ group xảy ra mỗi giây. Với một consumer group ổn định, con số này nên bằng không trong phần lớn thời gian.

Consumer cần commit offset để đánh dấu tiến trình của nó trong việc consume message, hoặc là tự động theo một khoảng thời gian đều đặn, hoặc bằng các checkpoint thủ công được kích hoạt trong mã ứng dụng. Các commit này về bản chất chỉ là các produce request (mặc dù chúng có loại request riêng), ở chỗ offset commit là một message được produce vào một topic đặc biệt. Consumer coordinator cung cấp thuộc tính `commit-latency-avg`, đo lượng thời gian trung bình mà các offset commit mất. Bạn nên giám sát giá trị này giống như cách bạn giám sát request latency ở producer. Bạn nên có thể thiết lập một giá trị cơ sở kỳ vọng cho metric này, và đặt các ngưỡng cảnh báo hợp lý phía trên giá trị đó.

Một metric coordinator cuối cùng có thể hữu ích để thu thập là `assigned-partitions`. Đây là số lượng partition mà consumer client (với tư cách một instance đơn lẻ trong consumer group) đã được gán để consume. Điều này hữu ích bởi vì, khi so sánh với metric này từ các consumer client khác trong group, có thể thấy được sự cân bằng tải trên toàn bộ consumer group. Chúng ta có thể dùng nó để xác định các mất cân bằng có thể do vấn đề trong thuật toán mà consumer coordinator dùng để phân phối partition cho các thành viên group.

### Quotas

Apache Kafka có khả năng điều tiết (throttle) các request của client nhằm ngăn một client làm quá tải toàn bộ cluster. Điều này có thể cấu hình cho cả producer và consumer client và được biểu diễn theo lượng lưu lượng cho phép từ một client ID riêng lẻ tới một broker riêng lẻ, tính bằng byte mỗi giây. Có một cấu hình ở broker đặt giá trị mặc định cho tất cả client, cũng như các giá trị ghi đè theo từng client có thể được đặt động. Khi broker tính ra rằng một client đã vượt quá quota của nó, nó sẽ làm chậm client lại bằng cách giữ response lại đủ lâu để giữ client nằm dưới quota.

Kafka broker không dùng mã lỗi trong response để cho biết client đang bị điều tiết. Điều này nghĩa là ứng dụng sẽ không dễ nhận ra rằng việc điều tiết đang diễn ra nếu không giám sát các metric được cung cấp để cho biết lượng thời gian mà client bị điều tiết. Các metric bắt buộc phải giám sát được liệt kê trong Bảng 13-21.

**Bảng 13-21. Các metric cần giám sát**

| Client | Tên bean |
|---|---|
| Consumer | bean `kafka.consumer:type=consumer-fetch-manager-metrics,client-id=CLIENTID`, thuộc tính `fetch-throttle-time-avg` |
| Producer | bean `kafka.producer:type=producer-metrics,client-id=CLIENTID`, thuộc tính `produce-throttle-time-avg` |

Quota không được bật theo mặc định trên các Kafka broker, nhưng việc giám sát các metric này là an toàn bất kể bạn hiện có đang dùng quota hay không. Việc giám sát chúng là một thực hành tốt vì chúng có thể được bật vào một thời điểm nào đó trong tương lai, và việc bắt đầu giám sát ngay từ đầu sẽ dễ hơn so với việc thêm metric về sau.

## Giám sát lag (Lag Monitoring)

Đối với các Kafka consumer, thứ quan trọng nhất cần giám sát là consumer lag. Được đo bằng số lượng message, đây là hiệu giữa message cuối cùng được produce trong một partition cụ thể và message cuối cùng được consumer xử lý. Mặc dù chủ đề này thông thường sẽ nằm trong phần trước về giám sát consumer client, đây là một trong những trường hợp mà giám sát từ bên ngoài vượt trội hơn hẳn so với những gì có sẵn từ chính client. Như đã đề cập ở trên, có một metric lag trong consumer client, nhưng việc sử dụng nó có nhiều vấn đề. Nó chỉ đại diện cho một partition duy nhất, partition có lag lớn nhất, nên nó không thể hiện chính xác consumer đang tụt lại xa đến mức nào. Ngoài ra, nó đòi hỏi consumer hoạt động đúng, bởi vì metric được consumer tính toán ở mỗi fetch request. Nếu consumer bị hỏng hoặc offline, metric hoặc là không chính xác hoặc là không khả dụng.

Phương pháp được ưa chuộng để giám sát consumer lag là có một tiến trình bên ngoài có thể quan sát cả trạng thái của partition trên broker, theo dõi offset của message được produce gần nhất, lẫn trạng thái của consumer, theo dõi offset cuối cùng mà consumer group đã commit cho partition đó. Điều này cung cấp một góc nhìn khách quan có thể được cập nhật bất kể trạng thái của chính consumer. Việc kiểm tra này phải được thực hiện cho mọi partition mà consumer group consume. Với một consumer lớn, như MirrorMaker, điều này có thể có nghĩa là hàng chục nghìn partition.

Chương 12 đã cung cấp thông tin về việc dùng các tiện ích dòng lệnh để lấy thông tin consumer group, bao gồm các offset đã commit và lag. Tuy nhiên, việc giám sát lag theo cách này có những vấn đề riêng của nó. Trước hết, bạn phải hiểu với mỗi partition thì mức lag bao nhiêu là hợp lý. Một topic nhận 100 message mỗi giờ sẽ cần một ngưỡng khác với một topic nhận 100.000 message mỗi giây. Sau đó, bạn phải có khả năng đưa tất cả các metric lag vào một hệ thống giám sát và đặt cảnh báo cho chúng. Nếu bạn có một consumer group consume 100.000 partition trên 1.500 topic, bạn có thể thấy đây là một nhiệm vụ nản lòng.

Một cách để giám sát consumer group nhằm giảm bớt sự phức tạp này là dùng Burrow. Đây là một ứng dụng mã nguồn mở, ban đầu được phát triển bởi LinkedIn, cung cấp việc giám sát trạng thái consumer bằng cách thu thập thông tin lag cho tất cả consumer group trong một cluster và tính ra một trạng thái duy nhất cho mỗi group, cho biết consumer group đó đang hoạt động đúng, đang tụt lại phía sau, hay đã đình trệ hoặc dừng hẳn. Nó làm được điều này mà không cần ngưỡng, bằng cách giám sát tiến độ mà consumer group đạt được trong việc xử lý message, mặc dù bạn cũng có thể lấy message lag dưới dạng một con số tuyệt đối. Có một thảo luận sâu về lý do và phương pháp luận đằng sau cách Burrow hoạt động trên blog LinkedIn Engineering. Việc triển khai Burrow có thể là một cách dễ dàng để cung cấp giám sát cho tất cả consumer trong một cluster, cũng như trong nhiều cluster, và nó có thể dễ dàng tích hợp với hệ thống giám sát và cảnh báo hiện có của bạn.

Nếu không còn lựa chọn nào khác, metric `records-lag-max` từ consumer client ít nhất cũng sẽ cung cấp một góc nhìn phần nào về trạng thái consumer. Tuy nhiên, chúng tôi khuyến nghị mạnh mẽ rằng bạn nên tận dụng một hệ thống giám sát bên ngoài như Burrow.

## Giám sát đầu-cuối (End-to-End Monitoring)

Một loại giám sát bên ngoài khác được khuyến nghị để xác định xem các cluster Kafka của bạn có đang hoạt động đúng hay không là một hệ thống giám sát đầu-cuối, cung cấp góc nhìn của client về sức khỏe của cluster Kafka. Các consumer và producer client có những metric có thể cho thấy rằng có thể đang có vấn đề với cluster Kafka, nhưng điều này có thể trở thành một trò đoán mò về việc độ trễ tăng lên là do vấn đề của client, của mạng, hay của chính Kafka. Ngoài ra, điều đó có nghĩa là nếu bạn chịu trách nhiệm vận hành cluster Kafka chứ không phải các client, thì giờ đây bạn sẽ phải giám sát cả tất cả các client nữa. Điều bạn thực sự cần biết là:

- Tôi có thể produce message tới cluster Kafka không?
- Tôi có thể consume message từ cluster Kafka không?

Trong một thế giới lý tưởng, bạn sẽ có thể giám sát điều này cho từng topic riêng lẻ. Tuy nhiên, trong hầu hết các tình huống, việc bơm lưu lượng tổng hợp vào mọi topic để làm điều này là không hợp lý. Tuy vậy, ít nhất chúng ta có thể cung cấp những câu trả lời đó cho mọi broker trong cluster, và đó chính là điều mà Xinfra Monitor (trước đây được gọi là Kafka Monitor) làm. Công cụ này, được nhóm Kafka tại LinkedIn phát hành dưới dạng mã nguồn mở, liên tục produce và consume dữ liệu từ một topic được trải trên tất cả các broker trong cluster. Nó đo tính sẵn sàng của cả produce request lẫn consume request trên mỗi broker, cũng như tổng độ trễ từ lúc produce tới lúc consume. Loại giám sát này là vô giá để có thể xác minh từ bên ngoài rằng cluster Kafka đang hoạt động đúng như dự định, bởi vì cũng giống như việc giám sát consumer lag, Kafka broker không thể báo cáo liệu các client có sử dụng được cluster đúng cách hay không.

## Tóm tắt (Summary)

Giám sát là một khía cạnh then chốt trong việc vận hành Apache Kafka đúng cách, điều này giải thích vì sao rất nhiều đội ngũ dành một lượng thời gian đáng kể để hoàn thiện phần đó của công tác vận hành. Nhiều tổ chức dùng Kafka để xử lý các luồng dữ liệu quy mô petabyte. Việc đảm bảo rằng dữ liệu không bị dừng, và message không bị mất, là một yêu cầu nghiệp vụ then chốt. Cũng là trách nhiệm của chúng ta khi hỗ trợ người dùng giám sát cách ứng dụng của họ sử dụng Kafka, bằng cách cung cấp các metric mà họ cần để làm điều này.

Trong chương này chúng ta đã trình bày những kiến thức cơ bản về cách giám sát ứng dụng Java, và cụ thể là các ứng dụng Kafka. Chúng ta đã điểm qua một tập con trong số rất nhiều metric có sẵn ở Kafka broker, cũng đề cập tới việc giám sát Java và OS, cũng như logging. Sau đó chúng ta đã trình bày chi tiết việc giám sát có sẵn trong các thư viện client Kafka, bao gồm cả giám sát quota. Cuối cùng, chúng ta đã thảo luận việc sử dụng các hệ thống giám sát bên ngoài cho việc giám sát consumer lag và tính sẵn sàng đầu-cuối của cluster. Dù chắc chắn không phải là danh sách đầy đủ các metric có sẵn, chương này đã điểm lại những metric quan trọng nhất cần để mắt tới.
