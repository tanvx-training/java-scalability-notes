# Chương 9. Xây dựng data pipeline (Building Data Pipelines)

Khi người ta bàn về việc xây dựng data pipeline bằng Apache Kafka, họ thường muốn nói tới một vài tình huống sử dụng. Tình huống thứ nhất là xây dựng một data pipeline trong đó Apache Kafka là một trong hai đầu mút (end point) — ví dụ, đưa dữ liệu từ Kafka sang S3, hoặc đưa dữ liệu từ MongoDB vào Kafka. Tình huống thứ hai liên quan tới việc xây dựng một pipeline giữa hai hệ thống khác nhau nhưng dùng Kafka làm trung gian. Một ví dụ của trường hợp này là đưa dữ liệu từ Twitter sang Elasticsearch bằng cách gửi dữ liệu trước tiên từ Twitter tới Kafka, rồi từ Kafka tới Elasticsearch.

Khi chúng tôi bổ sung Kafka Connect vào Apache Kafka ở phiên bản 0.9, đó là sau khi chúng tôi đã thấy Kafka được dùng trong cả hai tình huống trên tại LinkedIn và các tổ chức lớn khác. Chúng tôi nhận thấy có những thách thức cụ thể khi tích hợp Kafka vào data pipeline mà tổ chức nào cũng phải giải quyết, và quyết định bổ sung vào Kafka các API giải quyết một số thách thức đó, thay vì bắt mỗi tổ chức phải tự mày mò từ đầu.

Giá trị chính mà Kafka mang lại cho data pipeline là khả năng đóng vai trò một buffer rất lớn và đáng tin cậy giữa các giai đoạn khác nhau trong pipeline. Điều này thực sự tách rời (decouple) producer và consumer của dữ liệu bên trong pipeline, và cho phép nhiều ứng dụng cũng như hệ thống đích khác nhau cùng sử dụng dữ liệu từ cùng một nguồn, với các yêu cầu về tính kịp thời (timeliness) và tính sẵn sàng khác nhau. Sự tách rời này, kết hợp với độ tin cậy, tính bảo mật và hiệu quả, khiến Kafka trở thành lựa chọn phù hợp cho hầu hết các data pipeline.

> **ĐẶT VIỆC TÍCH HỢP DỮ LIỆU TRONG BỐI CẢNH RỘNG HƠN**
>
> Một số tổ chức xem Kafka như một đầu mút của pipeline. Họ đặt những câu hỏi kiểu như "Làm sao đưa dữ liệu từ Kafka sang Elastic?" Đây là một câu hỏi hợp lệ — nhất là khi bạn cần dữ liệu nào đó trong Elastic và dữ liệu ấy hiện đang nằm trong Kafka — và chúng ta sẽ xem xét đúng cách làm điều đó. Nhưng chúng ta sẽ bắt đầu phần thảo luận bằng cách nhìn vào việc sử dụng Kafka trong một bối cảnh rộng hơn, bao gồm ít nhất hai (và có thể nhiều hơn nữa) đầu mút không phải là bản thân Kafka. Chúng tôi khuyến khích bất kỳ ai đối mặt với bài toán tích hợp dữ liệu hãy cân nhắc bức tranh lớn hơn và đừng chỉ tập trung vào các đầu mút trước mắt. Tập trung vào các tích hợp ngắn hạn chính là cách bạn kết thúc với một mớ hỗn độn tích hợp dữ liệu phức tạp và tốn kém để bảo trì.

Trong chương này, chúng ta sẽ thảo luận một số vấn đề thường gặp mà bạn cần tính đến khi xây dựng data pipeline. Những thách thức này không đặc thù cho Kafka mà là các bài toán tích hợp dữ liệu nói chung. Tuy vậy, chúng tôi sẽ chỉ ra vì sao Kafka phù hợp với các tình huống tích hợp dữ liệu và cách nó giải quyết nhiều thách thức trong số đó. Chúng ta sẽ bàn về việc Kafka Connect API khác với các client producer và consumer thông thường như thế nào, và khi nào nên dùng loại client nào. Sau đó chúng ta sẽ đi vào một số chi tiết của Kafka Connect. Dù một cuộc thảo luận đầy đủ về Kafka Connect nằm ngoài phạm vi chương này, chúng tôi sẽ đưa ra các ví dụ sử dụng cơ bản để bạn bắt đầu và chỉ cho bạn nơi tìm hiểu thêm. Cuối cùng, chúng ta sẽ thảo luận về các hệ thống tích hợp dữ liệu khác và cách chúng tích hợp với Kafka.

## Những cân nhắc khi xây dựng data pipeline

Dù chúng tôi sẽ không đi vào mọi chi tiết của việc xây dựng data pipeline ở đây, chúng tôi muốn nhấn mạnh một số điều quan trọng nhất cần tính đến khi thiết kế kiến trúc phần mềm với mục đích tích hợp nhiều hệ thống.

### Tính kịp thời (Timeliness)

Một số hệ thống kỳ vọng dữ liệu của chúng đến theo lô lớn mỗi ngày một lần; những hệ thống khác lại kỳ vọng dữ liệu đến chỉ vài millisecond sau khi được sinh ra. Hầu hết các data pipeline nằm đâu đó giữa hai thái cực này. Các hệ thống tích hợp dữ liệu tốt có thể hỗ trợ những yêu cầu về tính kịp thời khác nhau cho các pipeline khác nhau, và cũng làm cho việc chuyển đổi giữa các lịch biểu thời gian khác nhau trở nên dễ dàng hơn khi yêu cầu nghiệp vụ thay đổi. Kafka, với tư cách một nền tảng dữ liệu dạng streaming có khả năng lưu trữ mở rộng được và đáng tin cậy, có thể được dùng để hỗ trợ mọi thứ từ pipeline gần thời gian thực (near-real-time) đến các mẻ chạy hằng ngày. Producer có thể ghi vào Kafka thường xuyên hoặc thưa thớt tùy nhu cầu, và consumer cũng có thể đọc và phân phối các event mới nhất ngay khi chúng đến. Hoặc consumer có thể làm việc theo lô: chạy mỗi giờ một lần, kết nối tới Kafka, và đọc các event đã tích lũy trong giờ trước đó.

Một cách hữu ích để nhìn nhận Kafka trong bối cảnh này là xem nó như một buffer khổng lồ giúp tách rời các yêu cầu về độ nhạy thời gian giữa producer và consumer. Producer có thể ghi event theo thời gian thực, trong khi consumer xử lý các lô event, hoặc ngược lại. Điều này cũng làm cho việc áp dụng back pressure trở nên đơn giản — bản thân Kafka áp back pressure lên producer (bằng cách trì hoãn ack khi cần) vì tốc độ tiêu thụ hoàn toàn do consumer quyết định.

### Độ tin cậy (Reliability)

Chúng ta muốn tránh các điểm hỏng đơn lẻ (single point of failure) và cho phép phục hồi nhanh, tự động khỏi mọi loại sự cố. Data pipeline thường là con đường mà dữ liệu đi tới các hệ thống trọng yếu của doanh nghiệp; sự cố kéo dài hơn vài giây có thể gây gián đoạn rất lớn, đặc biệt khi yêu cầu về tính kịp thời nằm gần đầu "vài millisecond" của phổ. Một cân nhắc quan trọng khác về độ tin cậy là các bảo đảm phân phối (delivery guarantee) — một số hệ thống có thể chấp nhận mất dữ liệu, nhưng phần lớn thời gian có yêu cầu về phân phối at-least-once, nghĩa là mọi event từ hệ thống nguồn sẽ tới được đích, nhưng đôi khi retry sẽ gây trùng lặp. Thường thì thậm chí còn có yêu cầu về phân phối exactly-once — mọi event từ hệ thống nguồn sẽ tới đích mà không có khả năng bị mất hay bị trùng lặp.

Chúng ta đã thảo luận sâu về các bảo đảm tính sẵn sàng và độ tin cậy của Kafka trong Chương 7. Như đã bàn, Kafka có thể tự nó cung cấp at-least-once, và cung cấp exactly-once khi kết hợp với một kho dữ liệu bên ngoài có mô hình transaction hoặc có key duy nhất. Vì nhiều đầu mút là các kho dữ liệu cung cấp đúng ngữ nghĩa cần thiết cho phân phối exactly-once, một pipeline dựa trên Kafka thường có thể được hiện thực hóa theo kiểu exactly-once. Cũng đáng lưu ý rằng Connect API của Kafka giúp các connector dễ dàng xây dựng pipeline exactly-once đầu-cuối hơn, nhờ cung cấp một API để tích hợp với các hệ thống bên ngoài khi xử lý offset. Thực tế, nhiều connector mã nguồn mở hiện có đều hỗ trợ phân phối exactly-once.

### Throughput cao và biến động (High and Varying Throughput)

Các data pipeline mà chúng ta xây dựng phải có khả năng mở rộng tới throughput rất cao, như thường được đòi hỏi trong các hệ thống dữ liệu hiện đại. Quan trọng hơn nữa, chúng phải có khả năng thích ứng nếu throughput đột ngột tăng vọt.

Với Kafka đóng vai trò buffer giữa producer và consumer, chúng ta không còn cần ghép chặt throughput của consumer với throughput của producer nữa. Chúng ta không còn cần hiện thực một cơ chế back-pressure phức tạp, bởi vì nếu throughput của producer vượt quá throughput của consumer, dữ liệu sẽ tích lũy trong Kafka cho đến khi consumer bắt kịp. Khả năng mở rộng của Kafka bằng cách thêm consumer hoặc producer một cách độc lập cho phép chúng ta mở rộng từng phía của pipeline một cách linh động và độc lập để đáp ứng các yêu cầu đang thay đổi.

Kafka là một hệ phân tán có throughput cao — có khả năng xử lý hàng trăm megabyte mỗi giây ngay cả trên các cluster khiêm tốn — nên không có gì phải lo rằng pipeline của chúng ta sẽ không mở rộng được khi nhu cầu tăng lên. Ngoài ra, Kafka Connect API tập trung vào việc song song hóa công việc và có thể làm điều đó trên một node đơn lẻ cũng như bằng cách mở rộng theo chiều ngang, tùy theo yêu cầu của hệ thống. Trong các phần tiếp theo, chúng tôi sẽ mô tả cách nền tảng này cho phép các nguồn dữ liệu (source) và đích dữ liệu (sink) chia nhỏ công việc giữa nhiều thread thực thi và tận dụng tài nguyên CPU sẵn có ngay cả khi chạy trên một máy duy nhất.

Kafka cũng hỗ trợ vài kiểu nén (compression), cho phép người dùng và quản trị viên kiểm soát việc sử dụng tài nguyên mạng và lưu trữ khi yêu cầu về throughput tăng lên.

### Định dạng dữ liệu (Data Formats)

Một trong những cân nhắc quan trọng nhất trong một data pipeline là dung hòa các định dạng dữ liệu và kiểu dữ liệu khác nhau. Các kiểu dữ liệu được hỗ trợ khác nhau giữa các cơ sở dữ liệu và các hệ thống lưu trữ khác. Bạn có thể đang nạp XML và dữ liệu quan hệ vào Kafka, dùng Avro bên trong Kafka, rồi cần chuyển dữ liệu sang JSON khi ghi vào Elasticsearch, sang Parquet khi ghi vào HDFS, và sang CSV khi ghi vào S3.

Bản thân Kafka và Connect API hoàn toàn trung lập (agnostic) đối với định dạng dữ liệu. Như chúng ta đã thấy trong các chương trước, producer và consumer có thể dùng bất kỳ serializer nào để biểu diễn dữ liệu ở bất kỳ định dạng nào phù hợp với bạn. Kafka Connect có các đối tượng in-memory riêng bao gồm kiểu dữ liệu và schema, nhưng như chúng ta sẽ sớm thảo luận, nó cho phép cắm thêm (pluggable) các converter để lưu các record này ở bất kỳ định dạng nào. Điều đó nghĩa là bất kể bạn dùng định dạng dữ liệu nào cho Kafka, nó cũng không hạn chế lựa chọn connector của bạn.

Nhiều source và sink có schema; chúng ta có thể đọc schema từ nguồn cùng với dữ liệu, lưu lại, và dùng nó để kiểm tra tính tương thích hoặc thậm chí cập nhật schema trong cơ sở dữ liệu đích. Một ví dụ kinh điển là data pipeline từ MySQL tới Snowflake. Nếu ai đó thêm một cột trong MySQL, một pipeline tốt sẽ bảo đảm cột đó cũng được thêm vào Snowflake khi chúng ta nạp dữ liệu mới vào đó.

Ngoài ra, khi ghi dữ liệu từ Kafka ra các hệ thống bên ngoài, sink connector chịu trách nhiệm về định dạng dữ liệu được ghi ra hệ thống bên ngoài. Một số connector chọn cách làm cho định dạng này có thể cắm thêm được. Ví dụ, connector S3 cho phép lựa chọn giữa định dạng Avro và Parquet.

Hỗ trợ các kiểu dữ liệu khác nhau thôi thì chưa đủ. Một framework tích hợp dữ liệu tổng quát cũng phải xử lý được sự khác biệt về hành vi giữa các source và sink khác nhau. Ví dụ, Syslog là một source đẩy (push) dữ liệu ra, trong khi các cơ sở dữ liệu quan hệ đòi hỏi framework phải kéo (pull) dữ liệu ra. HDFS chỉ cho phép ghi thêm (append-only) và chúng ta chỉ có thể ghi dữ liệu vào đó, trong khi hầu hết các hệ thống cho phép chúng ta vừa ghi thêm dữ liệu vừa cập nhật các record hiện có.

### Biến đổi dữ liệu (Transformations)

Việc biến đổi dữ liệu gây tranh cãi nhiều hơn các yêu cầu khác. Nhìn chung có hai cách tiếp cận để xây dựng data pipeline: ETL và ELT. ETL, viết tắt của Extract-Transform-Load, nghĩa là data pipeline chịu trách nhiệm sửa đổi dữ liệu khi dữ liệu đi qua nó. Cách này có lợi ích được cho là tiết kiệm thời gian và dung lượng lưu trữ, vì bạn không cần lưu dữ liệu, sửa đổi nó, rồi lưu lại lần nữa. Tùy vào các phép biến đổi, lợi ích này đôi khi có thật, nhưng đôi khi nó chuyển gánh nặng tính toán và lưu trữ sang chính data pipeline, điều có thể mong muốn hoặc không. Nhược điểm chính của cách tiếp cận này là các phép biến đổi xảy ra với dữ liệu trong pipeline có thể trói tay những người muốn xử lý dữ liệu thêm nữa ở phía sau. Nếu người xây dựng pipeline giữa MongoDB và MySQL quyết định lọc bỏ một số event hoặc loại bỏ một số trường khỏi record, thì tất cả người dùng và ứng dụng truy cập dữ liệu trong MySQL sẽ chỉ có được dữ liệu không đầy đủ. Nếu họ cần truy cập những trường bị thiếu, pipeline phải được xây dựng lại, và dữ liệu lịch sử sẽ phải xử lý lại (giả sử nó còn sẵn có).

ELT viết tắt của Extract-Load-Transform và nghĩa là data pipeline chỉ thực hiện biến đổi ở mức tối thiểu (chủ yếu quanh việc chuyển đổi kiểu dữ liệu), với mục tiêu bảo đảm dữ liệu tới đích giống với dữ liệu nguồn nhất có thể. Trong các hệ thống này, hệ thống đích thu thập "dữ liệu thô" (raw data) và mọi xử lý cần thiết được thực hiện tại hệ thống đích. Lợi ích ở đây là hệ thống mang lại sự linh hoạt tối đa cho người dùng của hệ thống đích, vì họ có quyền truy cập toàn bộ dữ liệu. Các hệ thống này cũng thường dễ xử lý sự cố hơn vì mọi xử lý dữ liệu đều giới hạn trong một hệ thống thay vì bị chia nhỏ giữa pipeline và các ứng dụng bổ sung. Nhược điểm là các phép biến đổi tiêu tốn tài nguyên CPU và lưu trữ tại hệ thống đích. Trong một số trường hợp, các hệ thống này đắt đỏ và có động lực mạnh để chuyển việc tính toán ra khỏi chúng khi có thể.

Kafka Connect có tính năng Single Message Transformation, tính năng này biến đổi các record trong lúc chúng đang được sao chép từ một source vào Kafka, hoặc từ Kafka tới một đích. Nó bao gồm việc định tuyến message tới các topic khác nhau, lọc message, thay đổi kiểu dữ liệu, che (redact) một số trường cụ thể, và nhiều thứ khác. Những phép biến đổi phức tạp hơn liên quan tới join và aggregation thường được thực hiện bằng Kafka Streams, và chúng ta sẽ khám phá chi tiết những điều đó trong một chương riêng.

> **Cảnh báo**
>
> Khi xây dựng một hệ thống ETL với Kafka, hãy nhớ rằng Kafka cho phép bạn xây dựng các pipeline một-tới-nhiều, trong đó dữ liệu nguồn được ghi vào Kafka một lần rồi được nhiều ứng dụng tiêu thụ và ghi ra nhiều hệ thống đích. Một số bước tiền xử lý và làm sạch là điều được mong đợi, chẳng hạn chuẩn hóa timestamp và kiểu dữ liệu, thêm thông tin nguồn gốc (lineage), và có thể loại bỏ thông tin cá nhân — những phép biến đổi có lợi cho tất cả consumer của dữ liệu. Nhưng đừng làm sạch và tối ưu dữ liệu quá sớm ngay khi nạp vào, bởi nơi khác có thể cần dữ liệu ở dạng ít tinh chế hơn.

### Bảo mật (Security)

Bảo mật luôn phải là một mối quan tâm. Về mặt data pipeline, những mối quan tâm bảo mật chính thường là:

- Ai có quyền truy cập dữ liệu được nạp vào Kafka?
- Chúng ta có thể bảo đảm dữ liệu đi qua ống dẫn được mã hóa không? Đây chủ yếu là mối lo với các data pipeline vượt qua ranh giới datacenter.
- Ai được phép sửa đổi các pipeline?
- Nếu data pipeline cần đọc hoặc ghi từ những vị trí có kiểm soát truy cập, nó có thể xác thực (authenticate) đúng cách không?
- Việc xử lý PII (Personally Identifiable Information — thông tin định danh cá nhân) của chúng ta có tuân thủ luật pháp và các quy định về lưu trữ, truy cập và sử dụng nó không?

Kafka cho phép mã hóa dữ liệu trên đường truyền, khi nó được dẫn từ các source tới Kafka và từ Kafka tới các sink. Nó cũng hỗ trợ authentication (qua SASL) và authorization — nên bạn có thể chắc chắn rằng nếu một topic chứa thông tin nhạy cảm, nó không thể bị ai đó không có thẩm quyền dẫn sang các hệ thống kém an toàn hơn. Kafka cũng cung cấp audit log để theo dõi truy cập — cả trái phép lẫn hợp lệ. Với một chút code bổ sung, cũng có thể theo dõi các event trong mỗi topic đến từ đâu và ai đã sửa đổi chúng, để bạn có thể cung cấp toàn bộ lineage cho từng record.

Bảo mật Kafka được thảo luận chi tiết trong Chương 11. Tuy nhiên, Kafka Connect và các connector của nó cần có khả năng kết nối tới, và xác thực với, các hệ thống dữ liệu bên ngoài, và cấu hình của connector sẽ bao gồm thông tin đăng nhập (credential) để xác thực với các hệ thống dữ liệu bên ngoài.

Ngày nay, người ta không khuyến nghị lưu credential trong các file cấu hình, vì như vậy nghĩa là các file cấu hình phải được xử lý cực kỳ cẩn thận và bị hạn chế truy cập. Một giải pháp phổ biến là dùng hệ thống quản lý bí mật (secret management) bên ngoài như HashiCorp Vault. Kafka Connect có hỗ trợ cấu hình bí mật bên ngoài. Apache Kafka chỉ bao gồm framework cho phép đưa vào các external config provider dạng pluggable, một provider mẫu đọc cấu hình từ một file, và có những external config provider do cộng đồng phát triển tích hợp với Vault, AWS và Azure.

### Xử lý sự cố (Failure Handling)

Giả định rằng mọi dữ liệu sẽ luôn hoàn hảo là điều nguy hiểm. Điều quan trọng là lên kế hoạch xử lý sự cố từ trước. Chúng ta có thể ngăn các record lỗi lọt vào pipeline ngay từ đầu không? Chúng ta có thể phục hồi từ các record không thể phân tích cú pháp (parse) không? Các record hỏng có thể được sửa (có lẽ bởi con người) và xử lý lại không? Điều gì xảy ra nếu event xấu trông y hệt một event bình thường và bạn chỉ phát hiện vấn đề vài ngày sau đó?

Vì Kafka có thể được cấu hình để lưu tất cả event trong thời gian dài, ta có thể quay ngược thời gian và phục hồi khỏi lỗi khi cần. Điều này cũng cho phép phát lại (replay) các event đã lưu trong Kafka tới hệ thống đích nếu chúng bị mất.

### Sự ghép nối và tính linh hoạt (Coupling and Agility)

Một đặc tính đáng mong muốn của việc hiện thực data pipeline là tách rời (decouple) nguồn dữ liệu và đích dữ liệu. Có nhiều cách mà sự ghép nối ngoài ý muốn có thể xảy ra:

- **Pipeline tùy tiện (ad hoc)**

  Một số công ty rốt cuộc xây dựng một pipeline riêng cho từng cặp ứng dụng mà họ muốn kết nối. Ví dụ, họ dùng Logstash để đổ log vào Elasticsearch, Flume để đổ log vào HDFS, Oracle GoldenGate để lấy dữ liệu từ Oracle sang HDFS, Informatica để lấy dữ liệu từ MySQL và XML sang Oracle, v.v. Cách này ghép chặt data pipeline với các đầu mút cụ thể và tạo ra một mớ hỗn độn các điểm tích hợp đòi hỏi nỗ lực đáng kể để triển khai, bảo trì và giám sát. Nó cũng có nghĩa là mỗi hệ thống mới mà công ty áp dụng sẽ đòi hỏi xây dựng thêm pipeline, làm tăng chi phí áp dụng công nghệ mới và kìm hãm đổi mới.

- **Mất metadata**

  Nếu data pipeline không bảo tồn metadata về schema và không cho phép schema evolution (tiến hóa schema), bạn sẽ ghép chặt phần mềm sinh dữ liệu ở nguồn với phần mềm sử dụng dữ liệu đó ở đích. Không có thông tin schema, cả hai sản phẩm phần mềm đều phải chứa thông tin về cách parse và diễn giải dữ liệu. Nếu dữ liệu chảy từ Oracle sang HDFS và một DBA thêm một trường mới trong Oracle mà không bảo tồn thông tin schema và không cho phép schema evolution, thì hoặc mọi ứng dụng đọc dữ liệu từ HDFS sẽ hỏng, hoặc tất cả lập trình viên sẽ phải nâng cấp ứng dụng của họ cùng lúc. Không lựa chọn nào trong hai là linh hoạt cả. Với hỗ trợ schema evolution trong pipeline, mỗi nhóm có thể sửa đổi ứng dụng của mình theo nhịp độ riêng mà không lo mọi thứ sẽ hỏng ở phía sau.

- **Xử lý thái quá (Extreme processing)**

  Như chúng ta đã đề cập khi bàn về biến đổi dữ liệu, một mức độ xử lý dữ liệu nào đó là bản chất vốn có của data pipeline. Suy cho cùng, chúng ta đang di chuyển dữ liệu giữa các hệ thống khác nhau, nơi các định dạng dữ liệu khác nhau là hợp lý và các tình huống sử dụng khác nhau được hỗ trợ. Tuy nhiên, xử lý quá nhiều sẽ trói tất cả các hệ thống ở hạ nguồn vào những quyết định được đưa ra khi xây dựng pipeline về việc giữ lại trường nào, tổng hợp dữ liệu ra sao, v.v. Điều này thường dẫn tới việc phải liên tục thay đổi pipeline khi yêu cầu của các ứng dụng hạ nguồn thay đổi, và như vậy thì không linh hoạt, không hiệu quả, cũng không an toàn. Cách linh hoạt hơn là bảo tồn càng nhiều dữ liệu thô càng tốt và để các ứng dụng hạ nguồn, bao gồm cả các ứng dụng Kafka Streams, tự đưa ra quyết định của mình về việc xử lý và tổng hợp dữ liệu.

## Khi nào dùng Kafka Connect thay vì producer và consumer

Khi ghi vào Kafka hoặc đọc từ Kafka, bạn có lựa chọn giữa việc dùng các client producer và consumer truyền thống, như đã mô tả trong Chương 3 và 4, hoặc dùng Kafka Connect API và các connector, như chúng tôi sẽ mô tả trong các phần tiếp theo. Trước khi bắt đầu đi sâu vào chi tiết của Kafka Connect, có lẽ bạn đã tự hỏi: "Khi nào thì tôi dùng cái nào?"

Như chúng ta đã thấy, các Kafka client là những client được nhúng vào bên trong ứng dụng của chính bạn. Chúng cho phép ứng dụng của bạn ghi dữ liệu vào Kafka hoặc đọc dữ liệu từ Kafka. Hãy dùng Kafka client khi bạn có thể sửa đổi code của ứng dụng mà bạn muốn kết nối, và khi bạn muốn hoặc đẩy dữ liệu vào Kafka, hoặc kéo dữ liệu ra từ Kafka.

Bạn sẽ dùng Connect để kết nối Kafka với các datastore mà bạn không viết ra và bạn không thể hoặc không muốn sửa đổi code hay API của chúng. Connect sẽ được dùng để kéo dữ liệu từ datastore bên ngoài vào Kafka hoặc đẩy dữ liệu từ Kafka ra kho bên ngoài. Để dùng Kafka Connect, bạn cần một connector cho datastore mà bạn muốn kết nối tới, và ngày nay các connector này rất phong phú. Điều đó có nghĩa là trên thực tế, người dùng Kafka Connect chỉ cần viết các file cấu hình.

Nếu bạn cần kết nối Kafka với một datastore mà chưa có connector nào tồn tại, bạn có thể chọn giữa việc viết một ứng dụng dùng Kafka client hoặc dùng Connect API. Connect được khuyến nghị vì nó cung cấp sẵn các tính năng như quản lý cấu hình, lưu trữ offset, song song hóa, xử lý lỗi, hỗ trợ các kiểu dữ liệu khác nhau, và các REST API quản trị chuẩn. Viết một ứng dụng nhỏ kết nối Kafka với một datastore nghe có vẻ đơn giản, nhưng có rất nhiều chi tiết nhỏ bạn sẽ phải xử lý liên quan tới kiểu dữ liệu và cấu hình, khiến công việc này không hề tầm thường. Hơn nữa, bạn sẽ phải bảo trì và viết tài liệu cho ứng dụng pipeline này, và đồng đội của bạn sẽ phải học cách sử dụng nó. Kafka Connect là một phần chuẩn của hệ sinh thái Kafka, và nó xử lý hầu hết những việc này thay cho bạn, cho phép bạn tập trung vào việc vận chuyển dữ liệu đến và đi từ các kho bên ngoài.

## Kafka Connect

Kafka Connect là một phần của Apache Kafka và cung cấp một cách mở rộng được và đáng tin cậy để sao chép dữ liệu giữa Kafka và các datastore khác. Nó cung cấp các API và một runtime để phát triển và chạy các plug-in connector — các thư viện được Kafka Connect thực thi và chịu trách nhiệm di chuyển dữ liệu. Kafka Connect chạy dưới dạng một cluster gồm các tiến trình worker. Bạn cài các plug-in connector lên các worker rồi dùng REST API để cấu hình và quản lý các connector, những connector này chạy với một cấu hình cụ thể. Connector khởi động thêm các task để di chuyển lượng lớn dữ liệu song song và sử dụng tài nguyên sẵn có trên các node worker hiệu quả hơn. Các task của source connector chỉ cần đọc dữ liệu từ hệ thống nguồn và cung cấp các đối tượng dữ liệu Connect cho các tiến trình worker. Các task của sink connector nhận các đối tượng dữ liệu connector từ worker và chịu trách nhiệm ghi chúng ra hệ thống dữ liệu đích. Kafka Connect dùng các converter để hỗ trợ việc lưu các đối tượng dữ liệu đó vào Kafka ở nhiều định dạng khác nhau — hỗ trợ định dạng JSON là một phần của Apache Kafka, còn Confluent Schema Registry cung cấp các converter cho Avro, Protobuf và JSON Schema. Điều này cho phép người dùng chọn định dạng lưu dữ liệu trong Kafka một cách độc lập với connector mà họ dùng, cũng như cách xử lý schema của dữ liệu (nếu có xử lý gì).

Chương này không thể nào đi hết mọi chi tiết của Kafka Connect và vô số connector của nó. Riêng chuyện đó cũng đủ để lấp đầy cả một cuốn sách. Tuy nhiên, chúng tôi sẽ đưa ra một cái nhìn tổng quan về Kafka Connect và cách sử dụng nó, đồng thời chỉ ra các tài nguyên bổ sung để tham khảo.

### Chạy Kafka Connect

Kafka Connect đi kèm với Apache Kafka, nên không cần cài đặt riêng. Đối với môi trường production, đặc biệt nếu bạn dự định dùng Connect để di chuyển lượng lớn dữ liệu hoặc chạy nhiều connector, bạn nên chạy Connect trên các server tách biệt khỏi các Kafka broker. Trong trường hợp đó, hãy cài Apache Kafka trên tất cả các máy, rồi đơn giản là khởi động broker trên một số server và khởi động Connect trên các server khác.

Khởi động một Connect worker rất giống với khởi động một broker — bạn gọi script khởi động với một file properties:

```bash
bin/connect-distributed.sh config/connect-distributed.properties
```

Có một vài cấu hình then chốt cho các Connect worker:

- `bootstrap.servers`

  Một danh sách các Kafka broker mà Connect sẽ làm việc cùng. Các connector sẽ dẫn dữ liệu của chúng tới hoặc từ các broker này. Bạn không cần chỉ định mọi broker trong cluster, nhưng nên chỉ định ít nhất ba broker.

- `group.id`

  Tất cả các worker có cùng group ID đều thuộc cùng một Connect cluster. Một connector được khởi động trên cluster sẽ chạy trên bất kỳ worker nào, và các task của nó cũng vậy.

- `plugin.path`

  Kafka Connect dùng kiến trúc pluggable, trong đó các connector, converter, transformation và secret provider có thể được tải về và thêm vào nền tảng. Để làm được điều đó, Kafka Connect phải có khả năng tìm và nạp các plug-in này.

  Chúng ta có thể cấu hình một hoặc nhiều thư mục làm nơi chứa các connector và các phụ thuộc (dependency) của chúng. Ví dụ, chúng ta có thể cấu hình `plugin.path=/opt/connectors,/home/gwenshap/connectors`. Bên trong một trong các thư mục này, chúng ta thường tạo một thư mục con cho mỗi connector, nên trong ví dụ trên, chúng ta sẽ tạo `/opt/connectors/jdbc` và `/opt/connectors/elastic`. Bên trong mỗi thư mục con, chúng ta sẽ đặt chính file jar của connector cùng toàn bộ các dependency của nó. Nếu connector được phát hành dưới dạng uberJar và không có dependency nào, nó có thể được đặt trực tiếp trong `plugin.path` và không cần thư mục con. Nhưng lưu ý rằng đặt các dependency ở thư mục cấp cao nhất sẽ không hoạt động.

  Một cách khác là thêm các connector cùng toàn bộ dependency của chúng vào classpath của Kafka Connect, nhưng cách này không được khuyến nghị và có thể gây lỗi nếu bạn dùng một connector mang theo một dependency xung đột với một trong các dependency của Kafka. Cách tiếp cận được khuyến nghị là dùng cấu hình `plugin.path`.

- `key.converter` và `value.converter`

  Connect có thể xử lý nhiều định dạng dữ liệu được lưu trong Kafka. Hai cấu hình này đặt converter cho phần key và phần value của message sẽ được lưu trong Kafka. Mặc định là định dạng JSON dùng `JSONConverter` có sẵn trong Apache Kafka. Các cấu hình này cũng có thể được đặt thành `AvroConverter`, `ProtobufConverter`, hoặc `JscoSchemaConverter`, những converter thuộc Confluent Schema Registry.

  Một số converter có các tham số cấu hình riêng của chúng. Bạn cần thêm tiền tố `key.converter.` hoặc `value.converter.` vào các tham số này, tùy theo bạn muốn áp dụng chúng cho key converter hay value converter. Ví dụ, message JSON có thể bao gồm một schema hoặc không có schema. Để hỗ trợ cả hai, bạn có thể đặt `key.converter.schemas.enable=true` hoặc `false` tương ứng. Cùng cấu hình đó có thể được dùng cho value converter bằng cách đặt `value.converter.schemas.enable` thành `true` hoặc `false`. Message Avro cũng chứa một schema, nhưng bạn cần cấu hình vị trí của Schema Registry bằng `key.converter.schema.registry.url` và `value.converter.schema.registry.url`.

- `rest.host.name` và `rest.port`

  Các connector thường được cấu hình và giám sát thông qua REST API của Kafka Connect. Bạn có thể cấu hình cổng cụ thể cho REST API.

Khi các worker đã chạy và bạn đã có một cluster, hãy kiểm tra xem nó có hoạt động hay không bằng cách gọi REST API:

```bash
$ curl http://localhost:8083/
{"version":"3.0.0-SNAPSHOT","commit":"fae0784ce32a448a","kafka_cluster_id":"pfkYIGZQSXm8
```

Truy cập URI REST gốc sẽ trả về phiên bản hiện tại mà bạn đang chạy. Chúng ta đang chạy một bản snapshot của Kafka 3.0.0 (bản tiền phát hành). Chúng ta cũng có thể kiểm tra xem những plug-in connector nào đang có sẵn:

```bash
$ curl http://localhost:8083/connector-plugins


[
    {
        "class": "org.apache.kafka.connect.file.FileStreamSinkConnector",
      "type": "sink",
      "version": "3.0.0-SNAPSHOT"
    },
    {
        "class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
        "type": "source",
        "version": "3.0.0-SNAPSHOT"
    },
    {
      "class": "org.apache.kafka.connect.mirror.MirrorCheckpointConnector",
      "type": "source",
      "version": "1"
    },
    {
        "class": "org.apache.kafka.connect.mirror.MirrorHeartbeatConnector",
        "type": "source",
      "version": "1"
    },
    {
        "class": "org.apache.kafka.connect.mirror.MirrorSourceConnector",
        "type": "source",
        "version": "1"
    }
]
```

Chúng ta đang chạy Apache Kafka thuần, nên các plug-in connector duy nhất có sẵn là file source, file sink, và các connector thuộc MirrorMaker 2.0.

Hãy xem cách cấu hình và sử dụng các connector ví dụ này, rồi sau đó chúng ta sẽ đi sâu vào các ví dụ nâng cao hơn đòi hỏi phải thiết lập các hệ thống dữ liệu bên ngoài để kết nối tới.

> **CHẾ ĐỘ STANDALONE**
>
> Hãy lưu ý rằng Kafka Connect cũng có chế độ standalone. Nó tương tự chế độ distributed — bạn chỉ cần chạy `bin/connect-standalone.sh` thay vì `bin/connect-distributed.sh`. Bạn cũng có thể truyền vào một file cấu hình connector trên dòng lệnh thay vì thông qua REST API. Ở chế độ này, tất cả các connector và task chạy trên một worker standalone duy nhất. Nó được dùng trong các trường hợp mà connector và task cần chạy trên một máy cụ thể (ví dụ, connector syslog lắng nghe trên một cổng, nên bạn cần biết nó đang chạy trên máy nào).

### Ví dụ connector: File source và file sink

Ví dụ này sẽ dùng các file connector và JSON converter là một phần của Apache Kafka. Để làm theo, hãy chắc chắn rằng bạn đã có ZooKeeper và Kafka đang chạy.

Để bắt đầu, hãy chạy một Connect worker ở chế độ distributed. Trong một môi trường production thực tế, bạn sẽ muốn có ít nhất hai hoặc ba worker chạy để bảo đảm tính sẵn sàng cao. Trong ví dụ này, chúng ta chỉ khởi động một worker:

```bash
bin/connect-distributed.sh config/connect-distributed.properties &
```

Bây giờ là lúc khởi động một file source. Làm ví dụ, chúng ta sẽ cấu hình nó để đọc file cấu hình của Kafka — về cơ bản là dẫn cấu hình của Kafka vào một Kafka topic:

```bash
echo '{"name":"load-kafka-config", "config":{"connector.class":
"FileStreamSource","file":"config/server.properties","topic":
"kafka-config-topic"}}' | curl -X POST -d @- http://localhost:8083/connectors
-H "Content-Type: application/json"


{
    "name": "load-kafka-config",
    "config": {
         "connector.class": "FileStreamSource",
         "file": "config/server.properties",
         "topic": "kafka-config-topic",
      "name": "load-kafka-config"
    },
    "tasks": [
         {
             "connector": "load-kafka-config",
             "task": 0
      }
    ],
    "type": "source"
}
```

Để tạo một connector, chúng ta đã viết một JSON bao gồm tên connector, `load-kafka-config`, và một map cấu hình connector, bao gồm class của connector, file mà chúng ta muốn nạp, và topic mà chúng ta muốn nạp file đó vào.

Hãy dùng Kafka Console consumer để kiểm tra rằng chúng ta đã nạp được cấu hình vào một topic:

```bash
gwen$ bin/kafka-console-consumer.sh --bootstrap-server=localhost:9092
--topic kafka-config-topic --from-beginning
```

Nếu mọi thứ suôn sẻ, bạn sẽ thấy thứ gì đó đại loại như:

```json
{"schema":{"type":"string","optional":false},"payload":"# Licensed to the Apache Softwar


<more stuff here>

{"schema":{"type":"string","optional":false},"payload":"############################# Se
{"schema":{"type":"string","optional":false},"payload":""}
{"schema":{"type":"string","optional":false},"payload":"# The id of the broker. This mus
{"schema":{"type":"string","optional":false},"payload":"broker.id=0"}
{"schema":{"type":"string","optional":false},"payload":""}


<more stuff here>
```

Đây đúng theo nghĩa đen là nội dung của file *config/server.properties*, khi nó được chuyển sang JSON theo từng dòng và được đặt vào `kafka-config-topic` bởi connector của chúng ta. Lưu ý rằng theo mặc định, JSON converter đặt một schema vào mỗi record. Trong trường hợp cụ thể này, schema rất đơn giản — chỉ có một cột duy nhất, tên là `payload` kiểu `string`, và nó chứa một dòng từ file cho mỗi record.

Bây giờ hãy dùng file sink converter để đổ nội dung của topic đó ra một file. File kết quả phải hoàn toàn giống hệt file *server.properties* gốc, vì JSON converter sẽ chuyển các record JSON trở lại thành các dòng văn bản đơn giản:

```bash
echo '{"name":"dump-kafka-config", "config":{"connector.class":"FileStreamSink","file":"

{"name":"dump-kafka-config","config":{"connector.class":"FileStreamSink","file":"copy-of
```

Hãy chú ý những thay đổi so với cấu hình source: class mà chúng ta đang dùng bây giờ là `FileStreamSink` chứ không phải `FileStreamSource`. Chúng ta vẫn có một thuộc tính `file`, nhưng giờ nó chỉ tới file đích chứ không phải nguồn của các record, và thay vì chỉ định `topic`, bạn chỉ định `topics`. Hãy để ý dạng số nhiều — với sink, bạn có thể ghi nhiều topic vào một file, trong khi source chỉ cho phép ghi vào một topic.

Nếu mọi thứ suôn sẻ, bạn sẽ có một file tên là *copy-of-server-properties*, hoàn toàn giống hệt file *config/server.properties* mà chúng ta đã dùng để nạp vào `kafka-config-topic`.

Để xóa một connector, bạn có thể chạy:

```bash
curl -X DELETE http://localhost:8083/connectors/dump-kafka-config
```

> **Cảnh báo**
>
> Ví dụ này dùng các connector FileStream vì chúng đơn giản và được tích hợp sẵn trong Kafka, cho phép bạn tạo pipeline đầu tiên của mình mà không cần cài gì ngoài Kafka. Không nên dùng chúng cho các pipeline production thực tế, vì chúng có nhiều hạn chế và không có bảo đảm nào về độ tin cậy. Có vài lựa chọn thay thế mà bạn có thể dùng nếu muốn nạp dữ liệu từ file: FilePulse Connector, FileSystem Connector, hoặc SpoolDir.

### Ví dụ connector: MySQL tới Elasticsearch

Bây giờ khi đã có một ví dụ đơn giản chạy được, hãy làm điều gì đó hữu ích hơn. Hãy lấy một bảng MySQL, stream nó vào một Kafka topic, và từ đó nạp nó vào Elasticsearch rồi đánh index nội dung của nó.

Chúng tôi đang chạy các bài kiểm thử trên một chiếc MacBook. Để cài MySQL và Elasticsearch, chỉ cần chạy:

```bash
brew install mysql
brew install elasticsearch
```

Bước tiếp theo là bảo đảm bạn có các connector. Có một vài lựa chọn:

1. Tải về và cài đặt bằng Confluent Hub client.
2. Tải về từ website Confluent Hub (hoặc từ bất kỳ website nào khác nơi connector bạn quan tâm được lưu trữ).
3. Build từ mã nguồn. Để làm điều này, bạn cần:
   1. Clone mã nguồn của connector:

      ```bash
      git clone https://github.com/confluentinc/kafka-connect-elasticsearch
      ```

   2. Chạy `mvn install -DskipTests` để build dự án.
   3. Lặp lại với connector JDBC.

Bây giờ chúng ta cần nạp các connector này. Hãy tạo một thư mục, chẳng hạn */opt/connectors*, và cập nhật *config/connect-distributed.properties* để bao gồm `plugin.path=/opt/connectors`.

Sau đó lấy các file jar được tạo ra trong thư mục *target* nơi bạn đã build từng connector, và sao chép từng file, cùng với các dependency của chúng, vào các thư mục con tương ứng của `plugin.path`:

```bash
gwen$ mkdir /opt/connectors/jdbc
gwen$ mkdir /opt/connectors/elastic
gwen$ cp .../kafka-connect-jdbc/target/kafka-connect-jdbc-10.3.x-SNAPSHOT.jar /opt/conne
gwen$ cp ../kafka-connect-elasticsearch/target/kafka-connect-elasticsearch-11.1.0-SNAPSH
gwen$ cp ../kafka-connect-elasticsearch/target/kafka-connect-elasticsearch-11.1.0-SNAPSH
```

Ngoài ra, vì chúng ta cần kết nối không phải tới một cơ sở dữ liệu bất kỳ mà cụ thể là tới MySQL, bạn sẽ cần tải về và cài đặt MySQL JDBC driver. Driver này không đi kèm với connector vì lý do bản quyền. Bạn có thể tải driver từ website MySQL rồi đặt file jar vào */opt/connectors/jdbc*.

Khởi động lại các Kafka Connect worker và kiểm tra xem các plug-in connector mới đã được liệt kê hay chưa:

```bash
gwen$      bin/connect-distributed.sh config/connect-distributed.properties &

gwen$      curl http://localhost:8083/connector-plugins
[
    {
        "class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
        "type": "sink",
        "version": "11.1.0-SNAPSHOT"
    },
    {
        "class": "io.confluent.connect.jdbc.JdbcSinkConnector",
        "type": "sink",
      "version": "10.3.x-SNAPSHOT"
    },
    {
        "class": "io.confluent.connect.jdbc.JdbcSourceConnector",
        "type": "source",
        "version": "10.3.x-SNAPSHOT"
    }
```

Chúng ta có thể thấy rằng bây giờ đã có thêm các plug-in connector sẵn dùng trong Connect cluster của mình.

Bước tiếp theo là tạo một bảng trong MySQL mà chúng ta có thể stream vào Kafka bằng connector JDBC của mình:

```sql
gwen$ mysql.server restart
gwen$ mysql --user=root


mysql> create database test;
Query OK, 1 row affected (0.00 sec)


mysql> use test;
Database changed
mysql> create table login (username varchar(30), login_time datetime);
Query OK, 0 rows affected (0.02 sec)

mysql> insert into login values ('gwenshap', now());
Query OK, 1 row affected (0.01 sec)

mysql> insert into login values ('tpalino', now());
Query OK, 1 row affected (0.00 sec)
```

Như bạn có thể thấy, chúng ta đã tạo một database và một bảng, và chèn vào vài dòng làm ví dụ.

Bước tiếp theo là cấu hình JDBC source connector của chúng ta. Chúng ta có thể tìm hiểu những tùy chọn cấu hình nào sẵn có bằng cách xem tài liệu, nhưng chúng ta cũng có thể dùng REST API để tìm các tùy chọn cấu hình sẵn có:

```bash
gwen$ curl -X PUT -d '{"connector.class":"JdbcSource"}' localhost:8083/connector-plugins


{
        "configs": [
            {
                "definition": {
                    "default_value": "",
                     "dependents": [],
                     "display_name": "Timestamp Column Name",
                     "documentation": "The name of the timestamp column to use
                     to detect new or modified rows. This column may not be
                     nullable.",
                     "group": "Mode",
                     "importance": "MEDIUM",
                     "name": "timestamp.column.name",
                     "order": 3,
                     "required": false,
                     "type": "STRING",
                     "width": "MEDIUM"
                },
                <more stuff>
```

Chúng ta đã yêu cầu REST API kiểm tra tính hợp lệ của cấu hình cho một connector và gửi cho nó một cấu hình chỉ có tên class (đây là cấu hình tối thiểu cần thiết). Đáp lại, chúng ta nhận được định nghĩa JSON của tất cả các cấu hình sẵn có.

Với thông tin này trong tay, đã đến lúc tạo và cấu hình JDBC connector của chúng ta:

```bash
echo '{"name":"mysql-login-connector", "config":{"connector.class":"JdbcSourceConnector"


{
     "name": "mysql-login-connector",
     "config": {
       "connector.class": "JdbcSourceConnector",
         "connection.url": "jdbc:mysql://127.0.0.1:3306/test?user=root",
         "mode": "timestamp",
         "table.whitelist": "login",
         "validate.non.null": "false",
         "timestamp.column.name": "login_time",
         "topic.prefix": "mysql.",
         "name": "mysql-login-connector"
     },
     "tasks": []
}
```

Hãy chắc chắn rằng nó hoạt động bằng cách đọc dữ liệu từ topic `mysql.login`:

```bash
gwen$ bin/kafka-console-consumer.sh --bootstrap-server=localhost:9092 --topic mysql.logi
```

Nếu bạn gặp lỗi báo rằng topic không tồn tại hoặc bạn không thấy dữ liệu nào, hãy kiểm tra log của Connect worker để tìm các lỗi như:

```
[2016-10-16 19:39:40,482] ERROR Error while starting connector mysql-login-connector (or
org.apache.kafka.connect.errors.ConnectException: java.sql.SQLException: Access denied f
                  at io.confluent.connect.jdbc.JdbcSourceConnector.start(JdbcSourceConnector.java:
```

Các vấn đề khác có thể liên quan tới sự tồn tại của driver trong classpath hoặc quyền đọc bảng.

Khi connector đã chạy, nếu bạn chèn thêm các dòng vào bảng `login`, bạn sẽ thấy chúng được phản ánh ngay lập tức trong topic `mysql.login`.

> **CHANGE DATA CAPTURE VÀ DỰ ÁN DEBEZIUM**
>
> Connector JDBC mà chúng ta đang dùng sử dụng JDBC và SQL để quét các bảng cơ sở dữ liệu tìm record mới. Nó phát hiện record mới bằng cách dùng các trường timestamp hoặc một primary key tăng dần. Đây là một quy trình tương đối kém hiệu quả và đôi khi thiếu chính xác. Mọi cơ sở dữ liệu quan hệ đều có một transaction log (còn gọi là redo log, binlog, hoặc write-ahead log) như một phần trong cách hiện thực của chúng, và nhiều hệ thống cho phép các hệ thống bên ngoài đọc dữ liệu trực tiếp từ transaction log của chúng — một quy trình chính xác và hiệu quả hơn nhiều, được gọi là *change data capture*. Hầu hết các hệ thống ETL hiện đại đều dựa vào change data capture như một nguồn dữ liệu. Dự án Debezium cung cấp một bộ sưu tập các connector change capture mã nguồn mở chất lượng cao cho nhiều loại cơ sở dữ liệu. Nếu bạn đang dự định stream dữ liệu từ một cơ sở dữ liệu quan hệ vào Kafka, chúng tôi rất khuyến nghị dùng connector change capture của Debezium nếu có sẵn cho cơ sở dữ liệu của bạn. Ngoài ra, tài liệu của Debezium là một trong những tài liệu tốt nhất mà chúng tôi từng thấy — bên cạnh việc mô tả bản thân các connector, nó còn trình bày các design pattern và tình huống sử dụng hữu ích liên quan tới change data capture, đặc biệt trong bối cảnh microservices.

Đưa dữ liệu MySQL vào Kafka tự nó đã hữu ích, nhưng hãy làm cho mọi thứ thú vị hơn bằng cách ghi dữ liệu ra Elasticsearch.

Trước tiên, chúng ta khởi động Elasticsearch và xác minh nó đang chạy bằng cách truy cập cổng cục bộ của nó:

```bash
gwen$ elasticsearch &
gwen$ curl http://localhost:9200/
{
    "name" : "Chens-MBP",
    "cluster_name" : "elasticsearch_gwenshap",
    "cluster_uuid" : "X69zu3_sQNGb7zbMh7NDVw",
    "version" : {
        "number" : "7.5.2",
        "build_flavor" : "default",
        "build_type" : "tar",
        "build_hash" : "8bec50e1e0ad29dad5653712cf3bb580cd1afcdf",
        "build_date" : "2020-01-15T12:11:52.313576Z",
        "build_snapshot" : false,
        "lucene_version" : "8.3.0",
        "minimum_wire_compatibility_version" : "6.8.0",
        "minimum_index_compatibility_version" : "6.0.0-beta1"
    },
    "tagline" : "You Know, for Search"
}
```

Bây giờ hãy tạo và khởi động connector:

```bash
echo '{"name":"elastic-login-connector", "config":{"connector.class":"ElasticsearchSinkC


{
    "name": "elastic-login-connector",
    "config": {
        "connector.class": "ElasticsearchSinkConnector",
        "connection.url": "http://localhost:9200",
        "topics": "mysql.login",
        "key.ignore": "true",
        "name": "elastic-login-connector"
    },
    "tasks": [
      {
            "connector": "elastic-login-connector",
            "task": 0
        }
    ]
}
```

Có một vài cấu hình chúng ta cần giải thích ở đây. `connection.url` đơn giản là URL của server Elasticsearch cục bộ mà chúng ta đã cấu hình trước đó. Theo mặc định, mỗi topic trong Kafka sẽ trở thành một index Elasticsearch riêng biệt, với cùng tên như topic. Topic duy nhất chúng ta đang ghi ra Elasticsearch là `mysql.login`. Connector JDBC không điền giá trị cho key của message. Kết quả là các event trong Kafka có key null. Vì các event trong Kafka thiếu key, chúng ta cần bảo connector Elasticsearch dùng tên topic, ID partition và offset làm key cho mỗi event. Điều này được thực hiện bằng cách đặt cấu hình `key.ignore` thành `true`.

Hãy kiểm tra xem index chứa dữ liệu `mysql.login` đã được tạo hay chưa:

```bash
gwen$ curl 'localhost:9200/_cat/indices?v'
health status index                uuid                         pri rep docs.count docs.deleted store.s
yellow open        mysql.login wkeyk9-bQea6NJmAFjv4hw              1      1      2            0      3.
```

Nếu index không có ở đó, hãy tìm lỗi trong log của Connect worker. Thiếu cấu hình hoặc thiếu thư viện là những nguyên nhân gây lỗi phổ biến. Nếu mọi thứ ổn, chúng ta có thể tìm kiếm các record của mình trong index:

```bash
gwen$ curl -s -X "GET" "http://localhost:9200/mysql.login/_search?pretty=true"
{
    "took" : 40,
    "timed_out" : false,
    "_shards" : {
        "total" : 1,
        "successful" : 1,
        "skipped" : 0,
      "failed" : 0
    },
    "hits" : {
        "total" : {
          "value" : 2,
            "relation" : "eq"
        },
        "max_score" : 1.0,
        "hits" : [
            {
                "_index" : "mysql.login",
                "_type" : "_doc",
                "_id" : "mysql.login+0+0",
                "_score" : 1.0,
                "_source" : {
                    "username" : "gwenshap",
                    "login_time" : 1621699811000
                }
            },
            {
                "_index" : "mysql.login",
                "_type" : "_doc",
                "_id" : "mysql.login+0+1",
                "_score" : 1.0,
                "_source" : {
                    "username" : "tpalino",
                    "login_time" : 1621699816000
                }
            }
        ]
    }
}
```

Nếu bạn thêm các record mới vào bảng trong MySQL, chúng sẽ tự động xuất hiện trong topic `mysql.login` trong Kafka và trong index Elasticsearch tương ứng.

Bây giờ khi đã thấy cách build và cài đặt JDBC source và Elasticsearch sink, chúng ta có thể build và dùng bất kỳ cặp connector nào phù hợp với tình huống sử dụng của mình. Confluent duy trì một bộ connector dựng sẵn của riêng họ, cũng như một số connector từ cộng đồng và các nhà cung cấp khác, tại Confluent Hub. Bạn có thể chọn bất kỳ connector nào trong danh sách mà bạn muốn thử, tải nó về, cấu hình nó — dựa trên tài liệu hoặc bằng cách lấy cấu hình từ REST API — và chạy nó trên cluster Connect worker của bạn.

> **TỰ XÂY DỰNG CONNECTOR CỦA BẠN**
>
> Connector API là công khai và bất kỳ ai cũng có thể tạo connector mới. Vì vậy nếu datastore mà bạn muốn tích hợp chưa có connector sẵn có, chúng tôi khuyến khích bạn tự viết connector của mình. Sau đó bạn có thể đóng góp nó cho Confluent Hub để người khác có thể tìm thấy và sử dụng. Việc bàn hết mọi chi tiết liên quan tới xây dựng một connector nằm ngoài phạm vi chương này, nhưng có nhiều bài blog giải thích cách làm, cùng các bài nói hay từ Kafka Summit NY 2019, Kafka Summit London 2018, và ApacheCon. Chúng tôi cũng khuyến nghị xem các connector hiện có làm điểm khởi đầu và có lẽ khởi động nhanh bằng một Apache Maven archetype. Chúng tôi luôn khuyến khích bạn hỏi xin trợ giúp hoặc khoe những connector mới nhất của bạn trên mailing list của cộng đồng Apache Kafka (users@kafka.apache.org) hoặc gửi chúng lên Confluent Hub để chúng dễ được tìm thấy.

### Single Message Transformations

Sao chép record từ MySQL vào Kafka rồi từ đó sang Elastic tự nó đã khá hữu ích, nhưng các pipeline ETL thường có thêm một bước biến đổi. Trong hệ sinh thái Kafka, chúng ta phân tách các phép biến đổi thành single message transformation (SMT), vốn stateless, và stream processing, vốn có thể stateful. SMT có thể được thực hiện ngay bên trong Kafka Connect, biến đổi message trong lúc chúng đang được sao chép, thường mà không cần viết dòng code nào. Những phép biến đổi phức tạp hơn, thường liên quan tới join hoặc aggregation, sẽ đòi hỏi framework stateful là Kafka Streams. Chúng ta sẽ thảo luận về Kafka Streams trong một chương sau.

Apache Kafka bao gồm các SMT sau:

- **Cast**

  Thay đổi kiểu dữ liệu của một trường.

- **MaskField**

  Thay thế nội dung của một trường bằng null. Điều này hữu ích để loại bỏ dữ liệu nhạy cảm hoặc dữ liệu định danh cá nhân.

- **Filter**

  Loại bỏ hoặc giữ lại tất cả các message khớp với một điều kiện cụ thể. Các điều kiện dựng sẵn bao gồm khớp theo tên topic, theo một header cụ thể, hoặc theo việc message có phải là tombstone hay không (tức là có value null).

- **Flatten**

  Biến đổi một cấu trúc dữ liệu lồng nhau thành một cấu trúc phẳng. Điều này được thực hiện bằng cách nối tất cả tên của tất cả các trường trên đường dẫn tới một giá trị cụ thể.

- **HeaderFrom**

  Di chuyển hoặc sao chép các trường từ message vào header.

- **InsertHeader**

  Thêm một chuỗi tĩnh vào header của mỗi message.

- **InsertField**

  Thêm một trường mới vào message, hoặc dùng giá trị từ metadata của nó như offset, hoặc dùng một giá trị tĩnh.

- **RegexRouter**

  Thay đổi topic đích bằng một biểu thức chính quy và một chuỗi thay thế.

- **ReplaceField**

  Loại bỏ hoặc đổi tên một trường trong message.

- **TimestampConverter**

  Sửa đổi định dạng thời gian của một trường — ví dụ, từ Unix Epoch sang String.

- **TimestampRouter**

  Sửa đổi topic dựa trên timestamp của message. Điều này chủ yếu hữu ích trong các sink connector khi chúng ta muốn sao chép message tới các partition bảng cụ thể dựa trên timestamp của chúng và trường topic được dùng để tìm một tập dữ liệu tương đương trong hệ thống đích.

Ngoài ra, còn có các phép biến đổi từ những người đóng góp bên ngoài mã nguồn chính của Apache Kafka. Bạn có thể tìm thấy chúng trên GitHub (Lenses.io, Aiven, và Jeremy Custenborder có những bộ sưu tập hữu ích) hoặc trên Confluent Hub.

Để tìm hiểu thêm về Kafka Connect SMT, bạn có thể đọc các ví dụ chi tiết về nhiều phép biến đổi trong loạt bài blog "Twelve Days of SMT". Ngoài ra, bạn có thể học cách tự viết phép biến đổi của mình bằng cách theo một tutorial và một bài phân tích chuyên sâu.

Làm ví dụ, giả sử chúng ta muốn thêm một header record vào mỗi record được sinh ra bởi MySQL connector mà chúng ta đã tạo trước đó. Header sẽ cho biết record được tạo bởi MySQL connector này, điều này hữu ích trong trường hợp các kiểm toán viên muốn xem xét lineage của những record đó.

Để làm điều này, chúng ta sẽ thay thế cấu hình MySQL connector trước đó bằng cấu hình sau:

```bash
echo '{
  "name": "mysql-login-connector",
    "config": {
        "connector.class": "JdbcSourceConnector",
        "connection.url": "jdbc:mysql://127.0.0.1:3306/test?user=root",
        "mode": "timestamp",
        "table.whitelist": "login",
        "validate.non.null": "false",
        "timestamp.column.name": "login_time",
        "topic.prefix": "mysql.",
        "name": "mysql-login-connector",
        "transforms": "InsertHeader",
        "transforms.InsertHeader.type":
          "org.apache.kafka.connect.transforms.InsertHeader",
        "transforms.InsertHeader.header": "MessageSource",
      "transforms.InsertHeader.value.literal": "mysql-login-connector"
    }}' | curl -X POST -d @- http://localhost:8083/connectors --header "content-Type:appli
```

Bây giờ, nếu bạn chèn thêm một vài record vào bảng MySQL mà chúng ta đã tạo ở ví dụ trước, bạn sẽ thấy các message mới trong topic `mysql.login` có header (lưu ý rằng bạn cần Apache Kafka 2.7 trở lên để in header trong console consumer):

```bash
bin/kafka-console-consumer.sh --bootstrap-server=localhost:9092 --topic mysql.login --fr

NO_HEADERS           {"schema":{"type":"struct","fields":[{"type":"string","optional":true,"f
MessageSource:mysql-login-connector                  {"schema":{"type":"struct","fields":

[{"type":"string","optional":true,"field":"username"},{"type":"int64","optional":true,"n
```

Như bạn có thể thấy, các record cũ hiển thị `NO_HEADERS`, còn các record mới hiển thị `MessageSource:mysql-login-connector`.

> **XỬ LÝ LỖI VÀ DEAD LETTER QUEUE**
>
> Transforms là một ví dụ về cấu hình connector không đặc thù cho một connector cụ thể mà có thể dùng trong cấu hình của bất kỳ connector nào. Một cấu hình connector rất hữu ích khác có thể dùng trong bất kỳ sink connector nào là `error.tolerance` — bạn có thể cấu hình bất kỳ connector nào để âm thầm loại bỏ các message hỏng, hoặc để định tuyến chúng tới một topic đặc biệt gọi là "dead letter queue". Bạn có thể tìm thêm chi tiết trong bài blog "Kafka Connect Deep Dive—Error Handling and Dead Letter Queues".

### Nhìn sâu hơn vào Kafka Connect

Để hiểu Kafka Connect hoạt động thế nào, bạn cần hiểu ba khái niệm cơ bản và cách chúng tương tác với nhau. Như chúng tôi đã giải thích trước đó và minh họa bằng các ví dụ, để dùng Kafka Connect, bạn cần chạy một cluster gồm các worker và tạo/xóa các connector. Một chi tiết bổ sung mà chúng ta chưa đi sâu trước đây là việc xử lý dữ liệu bởi các converter — đây là những thành phần chuyển các dòng MySQL thành các record JSON mà connector ghi vào Kafka.

Hãy nhìn sâu hơn một chút vào từng hệ thống con và cách chúng tương tác với nhau.

#### Connector và task

Các plug-in connector hiện thực Connector API, gồm hai phần:

- **Connector**

  Connector chịu trách nhiệm ba việc quan trọng:

  - Xác định sẽ chạy bao nhiêu task cho connector
  - Quyết định cách chia công việc sao chép dữ liệu giữa các task
  - Lấy cấu hình cho các task từ worker và chuyển tiếp chúng

  Ví dụ, JDBC source connector sẽ kết nối tới cơ sở dữ liệu, khám phá các bảng hiện có cần sao chép, và dựa vào đó quyết định cần bao nhiêu task — chọn giá trị nhỏ hơn giữa cấu hình `tasks.max` và số lượng bảng. Khi đã quyết định sẽ chạy bao nhiêu task, nó sẽ sinh ra một cấu hình cho mỗi task — dùng cả cấu hình của connector (ví dụ `connection.url`) và một danh sách các bảng mà nó gán cho mỗi task sao chép. Phương thức `taskConfigs()` trả về một danh sách các map (tức là một cấu hình cho mỗi task mà chúng ta muốn chạy). Sau đó các worker chịu trách nhiệm khởi động các task và trao cho mỗi task cấu hình riêng duy nhất của nó, để mỗi task sao chép một tập con bảng duy nhất từ cơ sở dữ liệu. Lưu ý rằng khi bạn khởi động connector qua REST API, nó có thể khởi động trên bất kỳ node nào, và sau đó các task mà nó khởi động cũng có thể thực thi trên bất kỳ node nào.

- **Task**

  Các task chịu trách nhiệm thực sự đưa dữ liệu vào và ra khỏi Kafka. Tất cả các task được khởi tạo bằng cách nhận một context từ worker. Context của source bao gồm một đối tượng cho phép source task lưu offset của các record nguồn (ví dụ, trong file connector, offset là vị trí trong file; trong JDBC source connector, offset có thể là một cột timestamp trong bảng). Context cho sink connector bao gồm các phương thức cho phép connector kiểm soát các record mà nó nhận từ Kafka — điều này được dùng cho những việc như áp dụng back pressure, retry, và lưu offset ra bên ngoài để bảo đảm phân phối exactly-once. Sau khi các task được khởi tạo, chúng được khởi động với một đối tượng `Properties` chứa cấu hình mà `Connector` đã tạo cho task. Một khi các task đã khởi động, các source task poll một hệ thống bên ngoài và trả về các danh sách record mà worker gửi tới các Kafka broker. Các sink task nhận record từ Kafka thông qua worker và chịu trách nhiệm ghi các record đó ra một hệ thống bên ngoài.

#### Worker

Các tiến trình worker của Kafka Connect là các tiến trình "container" thực thi các connector và task. Chúng chịu trách nhiệm xử lý các HTTP request định nghĩa connector và cấu hình của chúng, cũng như lưu cấu hình connector vào một Kafka topic nội bộ, khởi động các connector và task của chúng, và chuyển tiếp các cấu hình phù hợp. Nếu một tiến trình worker bị dừng hoặc bị crash, các worker khác trong Connect cluster sẽ nhận ra điều đó (nhờ các heartbeat trong giao thức consumer của Kafka) và gán lại các connector và task từng chạy trên worker đó cho những worker còn lại. Nếu một worker mới tham gia vào Connect cluster, các worker khác sẽ nhận ra và gán connector hoặc task cho nó để bảo đảm tải được cân bằng công bằng giữa tất cả các worker. Worker cũng chịu trách nhiệm tự động commit offset cho cả source connector lẫn sink connector vào các Kafka topic nội bộ, và xử lý việc retry khi các task ném ra lỗi.

Cách tốt nhất để hiểu về worker là nhận ra rằng connector và task chịu trách nhiệm phần "di chuyển dữ liệu" của việc tích hợp dữ liệu, trong khi worker chịu trách nhiệm về REST API, quản lý cấu hình, độ tin cậy, tính sẵn sàng cao, khả năng mở rộng và cân bằng tải.

Sự tách bạch trách nhiệm này chính là lợi ích chính của việc dùng Connect API so với các API consumer/producer cổ điển. Các lập trình viên có kinh nghiệm đều biết rằng viết code đọc dữ liệu từ Kafka và chèn vào một cơ sở dữ liệu có lẽ mất một hai ngày, nhưng nếu bạn cần xử lý cấu hình, lỗi, REST API, giám sát, triển khai, mở rộng lên xuống, và xử lý sự cố, thì có thể mất vài tháng mới làm đúng được mọi thứ. Và hầu hết các data pipeline tích hợp dữ liệu đều liên quan tới nhiều hơn chỉ một source hay một target. Vậy giờ hãy hình dung nỗ lực đó dành cho code viết riêng chỉ để tích hợp một cơ sở dữ liệu, rồi lặp lại nhiều lần cho các công nghệ khác. Nếu bạn hiện thực việc sao chép dữ liệu bằng một connector, connector của bạn cắm vào các worker vốn xử lý cả đống vấn đề vận hành phức tạp mà bạn không cần phải bận tâm.

#### Converter và mô hình dữ liệu của Connect

Mảnh ghép cuối cùng trong bức tranh Connect API là mô hình dữ liệu của connector và các converter. Connect API của Kafka bao gồm một data API, trong đó có cả các đối tượng dữ liệu và một schema mô tả dữ liệu đó. Ví dụ, JDBC source đọc một cột từ cơ sở dữ liệu và dựng một đối tượng `Schema` của Connect dựa trên các kiểu dữ liệu của những cột mà cơ sở dữ liệu trả về. Sau đó nó dùng schema này để dựng một `Struct` chứa tất cả các trường trong record của cơ sở dữ liệu. Với mỗi cột, chúng ta lưu tên cột và giá trị trong cột đó. Mọi source connector đều làm điều tương tự — đọc một event từ hệ thống nguồn và sinh ra một cặp `Schema` và `Value`. Các sink connector làm điều ngược lại — nhận một cặp `Schema` và `Value` rồi dùng `Schema` để phân tích các giá trị và chèn chúng vào hệ thống đích.

Dù các source connector biết cách sinh ra các đối tượng dựa trên Data API, vẫn còn câu hỏi là các Connect worker lưu những đối tượng này vào Kafka như thế nào. Đây là lúc các converter xuất hiện. Khi người dùng cấu hình worker (hoặc connector), họ chọn converter nào họ muốn dùng để lưu dữ liệu trong Kafka. Hiện tại, các lựa chọn sẵn có là kiểu nguyên thủy, mảng byte, chuỗi, Avro, JSON, JSON schema, hoặc Protobuf. JSON converter có thể được cấu hình để hoặc bao gồm một schema trong record kết quả hoặc không bao gồm — nhờ vậy chúng ta có thể hỗ trợ cả dữ liệu có cấu trúc lẫn dữ liệu bán cấu trúc. Khi connector trả về một record Data API cho worker, worker sau đó dùng converter đã cấu hình để chuyển record thành một đối tượng Avro, một đối tượng JSON, hoặc một chuỗi, và kết quả sau đó được lưu vào Kafka.

Quy trình ngược lại xảy ra với các sink connector. Khi Connect worker đọc một record từ Kafka, nó dùng converter đã cấu hình để chuyển record từ định dạng trong Kafka (tức là kiểu nguyên thủy, mảng byte, chuỗi, Avro, JSON, JSON schema, hoặc Protobuf) sang record Data API của Connect rồi chuyển nó cho sink connector, và connector này chèn nó vào hệ thống đích.

Điều này cho phép Connect API hỗ trợ các kiểu dữ liệu khác nhau được lưu trong Kafka, độc lập với cách hiện thực của connector (tức là bất kỳ connector nào cũng có thể dùng với bất kỳ kiểu record nào, miễn là có sẵn một converter phù hợp).

#### Quản lý offset

Quản lý offset là một trong những dịch vụ tiện lợi mà các worker thực hiện thay cho connector (bên cạnh việc quản lý triển khai và cấu hình qua REST API). Ý tưởng là các connector cần biết dữ liệu nào chúng đã xử lý rồi, và chúng có thể dùng các API do Kafka cung cấp để duy trì thông tin về những event nào đã được xử lý.

Với các source connector, điều này nghĩa là các record mà connector trả về cho Connect worker bao gồm một partition logic và một offset logic. Đó không phải là partition và offset của Kafka, mà là partition và offset theo nghĩa cần thiết trong hệ thống nguồn. Ví dụ, trong file source, một partition có thể là một file và một offset có thể là số dòng hoặc số ký tự trong file đó. Trong một JDBC source, một partition có thể là một bảng cơ sở dữ liệu và offset có thể là một ID hoặc timestamp của một record trong bảng. Một trong những quyết định thiết kế quan trọng nhất khi viết một source connector là quyết định cách phân chia dữ liệu tốt trong hệ thống nguồn và cách theo dõi offset — điều này sẽ ảnh hưởng tới mức độ song song mà connector có thể đạt được và việc nó có thể cung cấp ngữ nghĩa at-least-once hay exactly-once.

Khi source connector trả về một danh sách record, trong đó mỗi record kèm theo partition và offset nguồn, worker sẽ gửi các record đó tới các Kafka broker. Nếu các broker xác nhận (acknowledge) thành công các record, worker sau đó sẽ lưu offset của những record mà nó đã gửi tới Kafka. Điều này cho phép các connector bắt đầu xử lý event từ offset được lưu gần nhất sau khi khởi động lại hoặc sau một sự cố crash. Cơ chế lưu trữ này là pluggable và thường là một Kafka topic; bạn có thể kiểm soát tên topic bằng cấu hình `offset.storage.topic`. Ngoài ra, Connect dùng các Kafka topic để lưu cấu hình của tất cả các connector mà chúng ta đã tạo và trạng thái của từng connector — những topic này dùng tên được cấu hình bởi `config.storage.topic` và `status.storage.topic` tương ứng.

Các sink connector có một luồng công việc ngược lại nhưng tương tự: chúng đọc các record Kafka, vốn đã có sẵn định danh topic, partition và offset. Sau đó chúng gọi phương thức `put()` của connector, phương thức này có nhiệm vụ lưu các record đó vào hệ thống đích. Nếu connector báo thành công, chúng commit các offset mà chúng đã trao cho connector trở lại Kafka, dùng các phương thức commit thông thường của consumer.

Việc theo dõi offset do chính framework cung cấp sẽ giúp các lập trình viên viết connector dễ dàng hơn và bảo đảm một mức độ nhất quán nào đó về hành vi khi dùng các connector khác nhau.

## Các lựa chọn thay thế Kafka Connect

Cho tới đây, chúng ta đã xem xét Connect API của Kafka khá chi tiết. Dù chúng tôi yêu thích sự tiện lợi và độ tin cậy mà Connect API mang lại, nó không phải là cách duy nhất để đưa dữ liệu vào và ra khỏi Kafka. Hãy xem các lựa chọn thay thế khác và khi nào chúng thường được sử dụng.

### Framework nạp dữ liệu cho các datastore khác

Dù chúng ta thích nghĩ rằng Kafka là trung tâm của vũ trụ, một số người không đồng ý. Một số người xây dựng phần lớn kiến trúc dữ liệu của họ quanh những hệ thống như Hadoop hoặc Elasticsearch. Những hệ thống đó có công cụ nạp dữ liệu riêng của chúng — Flume cho Hadoop, và Logstash hoặc Fluentd cho Elasticsearch. Chúng tôi khuyến nghị dùng Connect API của Kafka khi Kafka là một phần không thể thiếu của kiến trúc và khi mục tiêu là kết nối một số lượng lớn source và sink. Nếu bạn thực sự đang xây dựng một hệ thống lấy Hadoop làm trung tâm hoặc lấy Elastic làm trung tâm và Kafka chỉ là một trong nhiều đầu vào của hệ thống đó, thì việc dùng Flume hoặc Logstash là hợp lý.

### Công cụ ETL dựa trên giao diện đồ họa (GUI)

Các hệ thống kiểu cũ như Informatica, các lựa chọn mã nguồn mở như Talend và Pentaho, và thậm chí những lựa chọn mới hơn như Apache NiFi và StreamSets, đều hỗ trợ Apache Kafka vừa như một nguồn dữ liệu vừa như một đích dữ liệu. Nếu bạn đã đang dùng các hệ thống này — chẳng hạn nếu bạn đã làm mọi thứ bằng Pentaho — thì có lẽ bạn không hứng thú với việc thêm một hệ thống tích hợp dữ liệu nữa chỉ để phục vụ Kafka. Chúng cũng hợp lý nếu bạn đang dùng cách tiếp cận dựa trên GUI để xây dựng các pipeline ETL. Nhược điểm chính của các hệ thống này là chúng thường được xây dựng cho những luồng công việc phức tạp và sẽ là một giải pháp khá nặng nề, rườm rà nếu tất cả những gì bạn muốn chỉ là đưa dữ liệu vào và ra khỏi Kafka. Chúng tôi tin rằng việc tích hợp dữ liệu nên tập trung vào việc phân phối message một cách trung thực trong mọi điều kiện, trong khi hầu hết các công cụ ETL đều thêm vào sự phức tạp không cần thiết.

Chúng tôi khuyến khích bạn nhìn Kafka như một nền tảng có thể xử lý việc tích hợp dữ liệu (với Connect), tích hợp ứng dụng (với producer và consumer), và stream processing. Kafka có thể là một lựa chọn thay thế khả thi cho một công cụ ETL chỉ làm nhiệm vụ tích hợp các kho dữ liệu.

### Framework stream processing

Gần như tất cả các framework stream processing đều có khả năng đọc event từ Kafka và ghi chúng ra một vài hệ thống khác. Nếu hệ thống đích của bạn được hỗ trợ và bạn vốn đã có ý định dùng framework stream processing đó để xử lý event từ Kafka, thì có vẻ hợp lý khi dùng luôn cùng framework đó cho việc tích hợp dữ liệu. Cách này thường tiết kiệm được một bước trong luồng công việc stream processing (không cần lưu các event đã xử lý trở lại Kafka — chỉ cần đọc chúng ra rồi ghi sang hệ thống khác), với nhược điểm là có thể khó xử lý sự cố hơn với những chuyện như message bị mất hoặc bị hỏng.

## Tóm tắt

Trong chương này, chúng ta đã thảo luận về việc dùng Kafka để tích hợp dữ liệu. Bắt đầu từ những lý do để dùng Kafka cho tích hợp dữ liệu, chúng ta đã điểm qua các cân nhắc chung cho các giải pháp tích hợp dữ liệu. Chúng tôi đã chỉ ra vì sao chúng tôi cho rằng Kafka và Connect API của nó là lựa chọn phù hợp. Sau đó chúng tôi đưa ra vài ví dụ về cách dùng Kafka Connect trong các kịch bản khác nhau, dành thời gian tìm hiểu cách Connect hoạt động, rồi thảo luận một vài lựa chọn thay thế Kafka Connect.

Dù cuối cùng bạn chọn giải pháp tích hợp dữ liệu nào, tính năng quan trọng nhất luôn sẽ là khả năng phân phối tất cả message trong mọi điều kiện sự cố. Chúng tôi tin rằng Kafka Connect cực kỳ đáng tin cậy — dựa trên sự tích hợp của nó với các tính năng độ tin cậy đã được kiểm chứng của Kafka — nhưng điều quan trọng là bạn phải kiểm thử hệ thống mà mình chọn, đúng như cách chúng tôi làm. Hãy chắc chắn rằng hệ thống tích hợp dữ liệu bạn chọn có thể sống sót qua các tiến trình bị dừng, máy bị crash, độ trễ mạng, và tải cao mà không bỏ sót message nào. Suy cho cùng, về bản chất, các hệ thống tích hợp dữ liệu chỉ có một nhiệm vụ — phân phối những message đó.

Tất nhiên, dù độ tin cậy thường là yêu cầu quan trọng nhất khi tích hợp các hệ thống dữ liệu, nó chỉ là một trong các yêu cầu. Khi chọn một hệ thống dữ liệu, điều quan trọng là trước hết hãy xem lại các yêu cầu của bạn (tham khảo mục "Những cân nhắc khi xây dựng data pipeline" để có ví dụ), rồi bảo đảm hệ thống bạn chọn thỏa mãn chúng. Nhưng như vậy vẫn chưa đủ — bạn còn phải tìm hiểu giải pháp tích hợp dữ liệu của mình đủ kỹ để chắc chắn rằng bạn đang dùng nó theo cách hỗ trợ các yêu cầu của bạn. Việc Kafka hỗ trợ ngữ nghĩa at-least-once là chưa đủ; bạn phải chắc chắn rằng mình không vô tình cấu hình nó theo cách rốt cuộc dẫn tới độ tin cậy không trọn vẹn.
