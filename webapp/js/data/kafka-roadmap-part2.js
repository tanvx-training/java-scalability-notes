// Lộ trình đọc Kafka: The Definitive Guide — Phần 2 (Tuần 7–11).
//
// Nguồn: bản dịch tiếng Việt "Kafka: The Definitive Guide", ấn bản 2
// (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly).
// Thư mục nguồn: kafka-vi/ — bản dịch gồm chương 2–14; chương 1 không thuộc phạm vi.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, trên một cluster thật.
// GIỮ NGUYÊN id (kf-w<N> / kf-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const kafkaWeeksPart2 = [
  {
    id: "kf-w7",
    week: "Tuần 7",
    title: "Mirroring dữ liệu liên cluster",
    goal: "Chọn được kiến trúc multicluster đúng cho yêu cầu thật của bạn, và dựng được một luồng mirroring bằng MirrorMaker 2 mà biết rõ nó bảo toàn gì và đánh mất gì.",
    practice:
      "Dựng hai cluster local trên hai cổng khác nhau, rồi chạy MirrorMaker 2 giữa chúng theo đúng mục \"MirrorMaker của Apache Kafka\". Produce vào cluster nguồn và xác nhận topic xuất hiện ở cluster đích **kèm tiền tố tên cluster nguồn** — rồi giải thích được vì sao MM2 đặt tiền tố đó.",
    resources: [
      { label: "Kafka 10 — Mirroring dữ liệu liên cluster", href: "#/docs/kafka-10" },
    ],
    items: [
      {
        id: "kf-w7-1",
        text: "Vì sao cần nhiều cluster, và các tình huống mirroring thật",
        lesson: `**Mục tiêu.** Kể được năm tình huống buộc một tổ chức chạy nhiều cluster Kafka, và nói được vì sao ba đặc điểm của mạng xuyên datacenter — latency, băng thông, chi phí — quyết định hình dạng của mọi giải pháp trong chương.

**Đọc.** Phần mở chương tách bạch hai từ cả chương dựa vào: replication là sao chép trong một cluster, mirroring là sao chép giữa các cluster. [Các tình huống sử dụng của mirroring liên cluster](#/docs/kafka-10) là năm gạch đầu dòng — đọc kỹ từng cái rồi tự hỏi cái nào giống hệ thống của bạn: cluster theo vùng với cluster trung tâm, tính sẵn sàng cao và khôi phục thảm họa, tuân thủ pháp lý, di chuyển lên cloud, tổng hợp dữ liệu từ các cluster biên. [Các kiến trúc multicluster](#/docs/kafka-10) mở bằng một câu đáng ghi lại: các giải pháp sắp tới chỉ trông phức tạp nếu bạn quên rằng chúng là đánh đổi trước những điều kiện mạng cụ thể. [Một số thực tế của giao tiếp xuyên datacenter](#/docs/kafka-10) phải đọc chậm dù chỉ hơn một trang: ba ràng buộc — độ trễ cao, băng thông hạn chế, chi phí cao hơn — rồi lý do broker và client Kafka vốn được thiết kế và tinh chỉnh trọn trong một datacenter, điều thể hiện thẳng vào timeout mặc định và kích thước buffer. Chép ra giấy ba nguyên tắc cuối mục.

**Bẫy.** Rải broker của một cluster ra hai datacenter cho "gần dữ liệu". Sách nói thẳng đây là điều không khuyến nghị, trừ vài trường hợp cụ thể bàn sau, vì giả định latency thấp và băng thông cao đã nằm sẵn trong các giá trị mặc định. Bẫy thứ hai: để mỗi ứng dụng tự đọc thẳng qua WAN từ cluster ở xa. Sách nêu đúng lý do: vì băng thông bị giới hạn, khi nhiều ứng dụng trong một datacenter cần dữ liệu của datacenter khác thì nên cài một cluster tại mỗi nơi và mirror dữ liệu cần thiết đúng một lần, thay vì để nhiều ứng dụng cùng consume cùng một dữ liệu qua WAN.

**Tự kiểm tra.** Vì sao giao tiếp broker-consumer là dạng liên cluster an toàn nhất khi xảy ra network partition? Và trong tình huống edge, aggregate cluster gánh hộ các edge cluster đúng những yêu cầu nào?`,
      },
      {
        id: "kf-w7-2",
        text: "Kiến trúc multicluster: hub-and-spoke, active-active, active-standby",
        lesson: `**Mục tiêu.** Chọn được một trong bốn mẫu kiến trúc cho yêu cầu thật của bạn, và nói được mỗi mẫu trả giá bằng gì: vùng dữ liệu không với tới được, xung đột phải tự xử, một cluster ngồi không, hay hạ tầng ba datacenter.

**Đọc.** [Kiến trúc hub-and-spokes](#/docs/kafka-10) với Hình 10-1 và 10-2; đọc kỹ ví dụ ngân hàng nhiều chi nhánh để thấy giới hạn thật — bộ xử lý ở một datacenter khu vực không với được sang datacenter khác. [Kiến trúc active-active](#/docs/kafka-10) đọc chậm: hai ví dụ xung đột — danh sách mong muốn và hai đơn đặt sách — rồi quy ước đặt tên \`SF.users\` với \`NYC.users\` chống vòng lặp replication, thứ mà MirrorMaker cũng dùng. [Kiến trúc active-standby](#/docs/kafka-10) là mục nặng nhất, đi hết năm mục con: [Lập kế hoạch khôi phục thảm họa](#/docs/kafka-10) cho cặp RTO và RPO; [Mất dữ liệu và bất nhất trong failover ngoài kế hoạch](#/docs/kafka-10) với phép tính 1 triệu message mỗi giây nhân 5 ms ra 5.000 message; [Offset khởi đầu cho ứng dụng sau khi failover](#/docs/kafka-10) — đọc cả bốn cách, và lưu ý lệnh \`kafka-consumer-groups.sh\` reset offset theo timestamp ở mục này bị bản PDF gốc cắt cụt, nên đừng gõ lại và đừng đoán phần thiếu; rồi [Sau khi failover](#/docs/kafka-10) và [Đôi lời về cluster discovery](#/docs/kafka-10). [Stretch cluster](#/docs/kafka-10) khép mục với replication đồng bộ và khung "KIẾN TRÚC 2.5 DC".

**Bẫy.** Mirror \`__consumer_offsets\` sang cluster DR rồi tin consumer sẽ tiếp tục đúng chỗ. Sách dựng đúng cảnh hỏng: nếu cluster chính chỉ giữ ba ngày dữ liệu còn bạn bắt đầu mirror một tuần sau khi topic ra đời, offset đầu tiên ở chính có thể là 57.000.000 trong khi ở DR là 0 — consumer đọc offset 57.000.003 sẽ thất bại; và ngay cả khi mirror từ đầu, retry của producer vẫn làm offset lệch nhau. Bẫy thứ hai: cắt nhỏ cluster DR cho đỡ phí. Sách gọi đó là một quyết định rủi ro, vì bạn không thể chắc chắn rằng cluster kích thước tối thiểu này sẽ trụ vững trong trường hợp khẩn cấp.

**Tự kiểm tra.** Vì sao stretch cluster cần ba datacenter chứ không phải hai? Và sau một cuộc failover thành công, vì sao sách khuyên dọn sạch cluster cũ trước khi mirror ngược về nó?`,
      },
      {
        id: "kf-w7-3",
        text: "MirrorMaker 2: cấu hình, triển khai và tinh chỉnh",
        lesson: `**Mục tiêu.** Đọc được một file cấu hình MirrorMaker như một topology có hướng, đặt tiến trình đúng phía datacenter, và biết phải đo cái gì trước khi nâng \`tasks.max\`.

**Đọc.** [MirrorMaker của Apache Kafka](#/docs/kafka-10) mở bằng lý do MM2 tồn tại — bản cũ dùng một consumer group nên mọi thay đổi cấu hình hay thêm topic đều gây rebalance kiểu stop-the-world; khung "THÊM VỀ MIRRORMAKER" chốt rằng cả mục nói về MirrorMaker 2.0 từ bản 2.4.0. Nắm cho chắc: mỗi task là một cặp consumer và producer, và MirrorMaker phân bổ partition mà không dùng giao thức quản lý consumer group. [Cấu hình MirrorMaker](#/docs/kafka-10) gõ lại khối bốn dòng \`clusters = NYC, LON\` và tự giải thích từng chú thích, rồi đọc năm mục con: mirror topic với tiền tố alias cluster nguồn, di chuyển consumer offset, di chuyển cấu hình topic và ACL, \`tasks.max\` mặc định 1 với khuyến nghị tối thiểu 2, và bảng tiền tố cấu hình. [Topology replication multicluster](#/docs/kafka-10) chạy thật bản active-active hai chiều rồi mở rộng sang SF. [Bảo mật MirrorMaker](#/docs/kafka-10) đọc lướt nhưng nhớ danh sách ACL mà tiến trình cần. [Triển khai MirrorMaker trong production](#/docs/kafka-10) là mục đọc chậm nhất tuần: các chế độ triển khai, chọn phía datacenter, rồi năm nhóm giám sát. [Tinh chỉnh MirrorMaker](#/docs/kafka-10) khép mục — chạy thật \`kafka-performance-producer\` và đo với 1, 2, 4, 8, 16, 24 rồi 32 task.

**Bẫy.** Đặt MirrorMaker ở datacenter nguồn cho tiện quản lý. Sách dặn ngược lại: nếu có thể hãy chạy nó tại datacenter đích, vì khi network partition xảy ra, một consumer không kết nối được thì chỉ đơn giản là không đọc — event vẫn nằm an toàn trong cluster nguồn — còn nếu event đã được consume mà producer không gửi đi được, luôn có rủi ro MirrorMaker vô tình làm mất chúng. Bẫy thứ hai: nhìn lag rồi kết luận không mất message nào. Sách nói rõ nếu MirrorMaker bỏ qua hoặc làm rơi message thì không cách nào trong hai cách theo dõi lag phát hiện được, vì chúng chỉ theo dõi offset mới nhất.

**Tự kiểm tra.** Vì sao \`kafka-consumer-groups\` báo lag lớn hơn lag thật, còn consumer maximum lag qua JMX lại báo nhỏ hơn? Và khi nào hạ \`max.in.flight.requests.per.connection\` xuống 1 là cái giá đáng trả?`,
      },
      {
        id: "kf-w7-4",
        text: "Các giải pháp mirroring khác, và khi nào chọn chúng",
        lesson: `**Mục tiêu.** Biết ba họ giải pháp cạnh tranh với MirrorMaker và điều kiện khiến mỗi họ đúng hơn, thay vì mặc định chọn MirrorMaker chỉ vì nó đi kèm Apache Kafka.

**Đọc.** [Các giải pháp mirroring liên cluster khác](#/docs/kafka-10) mở bằng lời thừa nhận rằng MirrorMaker có hạn chế khi dùng thực tế. [Uber uReplicator](#/docs/kafka-10) đọc kỹ như một hồ sơ sự cố: rebalance kéo dài 5–10 phút ở quy mô rất lớn, backlog tích tụ, rồi lời giải của Uber — Apache Helix làm controller trung tâm và một Helix consumer nhận phân bổ partition từ controller thay vì thỏa thuận với nhau. [LinkedIn Brooklin](#/docs/kafka-10) đọc lướt, nhớ ba bài toán nó phục vụ và việc nó là một dịch vụ dùng chung cho nhiều pipeline. [Các giải pháp mirroring xuyên datacenter của Confluent](#/docs/kafka-10) là mục đọc chậm nhất: ba sản phẩm cho ba nhóm vấn đề — Confluent Replicator dựa trên Kafka Connect và tránh vòng lặp bằng provenance header; Multi-Region Clusters với khái niệm observer, ngưỡng latency 50 ms và cơ chế tự động thăng cấp observer; và Cluster Linking replicate có bảo toàn offset, đánh dấu mirror topic là chỉ đọc ở đích. [Tổng kết](#/docs/kafka-10) khép chương: cấu hình multicluster phải được giám sát và kiểm thử như mọi thứ khác bạn đưa vào production.

**Bẫy.** Chọn uReplicator vì nó sinh ra để sửa đúng vấn đề bạn đang gặp. Sách chốt lại ngay sau đó: phụ thuộc vào Apache Helix đưa vào một thành phần mới cần học và quản lý, làm tăng độ phức tạp cho mọi lần triển khai — trong khi MirrorMaker 2.0 đã giải quyết nhiều vấn đề khả năng mở rộng và chịu lỗi ấy mà không cần phụ thuộc bên ngoài nào. Bẫy thứ hai: coi Confluent Replicator là MirrorMaker có hỗ trợ thương mại. Sách chỉ đúng chỗ lệch: MirrorMaker di chuyển ACL và hỗ trợ offset translation cho mọi client, còn Replicator không di chuyển ACL và chỉ hỗ trợ offset translation, bằng timestamp interceptor, cho client Java.

**Tự kiểm tra.** Vì sao việc Uber thay bộ lọc biểu thức chính quy bằng danh sách tên topic chính xác lại đẻ ra một vấn đề mới? Và observer khác một follower thường ở chỗ nào, và điều đó giúp gì cho producer đặt \`acks=all\`?`,
      },
    ],
  },
  {
    id: "kf-w8",
    week: "Tuần 8",
    title: "Bảo mật Kafka — xác thực, phân quyền, mã hoá",
    goal: "Khóa chặt được một cluster ở cả bốn lớp — xác thực, mã hoá, phân quyền, kiểm toán — và nói được mỗi lớp chặn mối đe dọa nào, còn hở ở đâu.",
    practice:
      "Bật SSL cho một broker: sinh keystore và truststore, đổi `listeners` sang `SASL_SSL`, và kết nối bằng một client cấu hình đúng. Rồi tạo một ACL bằng `kafka-acls.sh` cho phép đúng một user ghi vào đúng một topic, và xác nhận user khác bị từ chối.",
    resources: [
      { label: "Kafka 11 — Bảo mật Kafka", href: "#/docs/kafka-11" },
    ],
    items: [
      {
        id: "kf-w8-1",
        text: "Mô hình bảo mật Kafka và bốn security protocol",
        lesson: `**Mục tiêu.** Đọc được luồng dữ liệu Alice–Bob của chương như một danh sách bảo đảm phải giữ, rồi chọn đúng một trong bốn security protocol cho từng listener cụ thể.

**Đọc.** [Khóa chặt Kafka (Locking Down Kafka)](#/docs/kafka-11) mở bằng năm quy trình bảo mật — authentication, authorization, encryption, auditing, quota; chép cả năm ra giấy vì phần còn lại của chương chỉ là chi tiết của chúng. Rồi bám Hình 11-1 và sáu bước của luồng ví dụ, từ lúc Alice produce một record vào \`customerOrders\` tới lúc Bob consume nó, và đối chiếu với danh sách bảo đảm ngay sau: tính xác thực của client, tính xác thực của server, tính riêng tư của dữ liệu, tính toàn vẹn của dữ liệu, kiểm soát truy cập, khả năng kiểm toán, tính sẵn sàng. Nhớ đoạn cuối: quota thuộc Chương 3, còn tính sẵn sàng của broker phụ thuộc vào tính sẵn sàng của ZooKeeper. [Security Protocols](#/docs/kafka-11) ngắn nhưng đọc kỹ: một broker có thể có nhiều listener, mỗi listener mang thiết lập bảo mật riêng, và bốn protocol PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL chỉ là tổ hợp của một tầng transport với một tầng authentication tùy chọn. Đọc khung "TLS/SSL" để nắm vai trò của PKI và session key, rồi gõ lại khối cấu hình ba listener EXTERNAL, INTERNAL, BROKER cùng \`listener.security.protocol.map\` và \`inter.broker.listener.name\`, và khối hai dòng phía client.

**Bẫy.** Chọn SASL_PLAINTEXT vì "đã có SASL là đã có bảo mật". Sách xếp nó đúng chỗ: tầng transport PLAINTEXT với SASL client authentication, không hỗ trợ mã hóa, do đó chỉ phù hợp để dùng trong mạng riêng. Bẫy thứ hai: cấu hình listener inter-broker chỉ bằng các tùy chọn phía server. Sách nói rõ cả tùy chọn phía server lẫn phía client đều phải được cung cấp trong cấu hình broker cho security protocol dùng cho giao tiếp inter-broker, lý do là chính các broker phải thiết lập kết nối client trên listener đó.

**Tự kiểm tra.** Vì sao metadata trả về cho client chỉ chứa endpoint thuộc cùng listener với bootstrap server? Và trong danh sách bảo đảm, cái nào phụ thuộc vào việc khóa chặt ZooKeeper chứ không phải khóa chặt Kafka?`,
      },
      {
        id: "kf-w8-2",
        text: "Authentication: SSL và các cơ chế SASL",
        lesson: `**Mục tiêu.** Sinh được key store và trust store cho một cluster tự ký, và chọn được một trong các cơ chế SASL bằng chính điều kiện triển khai của bạn chứ không bằng cảm giác.

**Đọc.** [Authentication](#/docs/kafka-11) định nghĩa \`KafkaPrincipal\` và cách nó gắn với kết nối suốt vòng đời, kèm khung "KẾT NỐI ẨN DANH (ANONYMOUS CONNECTIONS)". [SSL](#/docs/kafka-11) ngắn nhưng đi cùng khung "HIỆU NĂNG SSL (SSL PERFORMANCE)" — nhớ rằng zero-copy không được hỗ trợ và overhead có thể lên 20–30%. [Cấu hình TLS](#/docs/kafka-11) là mục đọc chậm nhất tuần: chạy thật cả chuỗi \`keytool\` sinh CA của broker, key store broker, trust store broker và client, rồi CA của client; sau đó là hai khối properties broker và client cùng khung "TRUST STORE". [Cân nhắc về bảo mật](#/docs/kafka-11) đọc kỹ: chỉ TLSv1.2 và TLSv1.3 được bật, không hỗ trợ renegotiation, và \`connection.failed.authentication.delay.ms\` để hãm client thử lại. [SASL](#/docs/kafka-11) cho bốn cơ chế cùng vai trò của cấu hình JAAS và callback handler. Rồi đi qua [SASL/GSSAPI](#/docs/kafka-11), [SASL/PLAIN](#/docs/kafka-11), [SASL/SCRAM](#/docs/kafka-11), [SASL/OAUTHBEARER](#/docs/kafka-11) và [Delegation token](#/docs/kafka-11) — với mỗi cơ chế, đọc phần mở đầu và phần cân nhắc bảo mật trước, phần cấu hình sau. [Reauthentication](#/docs/kafka-11) đọc chậm cùng khung "NGƯỜI DÙNG BỊ XÂM PHẠM"; [Cập nhật bảo mật không gây gián đoạn (Security Updates Without Downtime)](#/docs/kafka-11) cho hai trình tự rolling update đáng chép lại.

**Bẫy.** Tắt kiểm chứng hostname vì certificate trong lab không khớp. Khung "KIỂM CHỨNG HOSTNAME CỦA SERVER (SERVER HOSTNAME VERIFICATION)" nói rõ đây là một phần thiết yếu của server authentication, giúp chống lại các cuộc tấn công man-in-the-middle, do đó không nên tắt nó trong các hệ thống production. Bẫy thứ hai: đặt \`ssl.client.auth=requested\` rồi tin mọi client đã được xác thực. Khung "SSL CLIENT AUTHENTICATION" chỉ ra hệ quả: client không được cấu hình key store vẫn hoàn tất TLS handshake, nhưng sẽ được gán principal \`User:ANONYMOUS\`.

**Tự kiểm tra.** Vì sao bản triển khai SASL/PLAIN có sẵn — lưu mọi mật khẩu client trong cấu hình JAAS của mọi broker — vừa không an toàn vừa không linh hoạt? Và delegation token mượn cơ chế nào để authentication, với gì làm username và gì làm password?`,
      },
      {
        id: "kf-w8-3",
        text: "Mã hoá đường truyền và phân quyền bằng ACL",
        lesson: `**Mục tiêu.** Biết chính xác TLS che được đoạn nào của vòng đời dữ liệu và đoạn nào không, rồi viết được một ACL binding đủ bảy thành phần cho một producer thật.

**Đọc.** [Encryption](#/docs/kafka-11) mở bằng ranh giới: SSL và SASL_SSL lo dữ liệu đang truyền, còn dữ liệu ở trạng thái nghỉ cần mã hóa toàn đĩa hoặc mã hóa volume. Đọc chậm đoạn giải thích vì sao thế vẫn chưa đủ — dữ liệu chưa mã hóa trong bộ nhớ broker có thể xuất hiện trong heap dump. [Mã hóa đầu-cuối (End-to-End Encryption)](#/docs/kafka-11) bám Hình 11-2 và năm bước: serializer mã hóa, broker chỉ thấy bản mã, consumer giải mã bằng khóa lấy từ KMS; đọc kỹ đoạn cuối về message key: phép biến đổi phải bảo toàn tương đương hash để không phá phân vùng và compaction. [Authorization](#/docs/kafka-11) và [AclAuthorizer](#/docs/kafka-11) là phần nặng nhất: bảy thành phần của một ACL binding, quy tắc \`Deny\` thắng \`Allow\`, các quyền được ngầm cấp, rồi Bảng 11-1 đọc như bảng tra. Chạy thật ba lệnh \`kafka-acls.sh\` cuối mục, rồi tới \`super.users\` với khung "DẤU PHÂN TÁCH SUPER USER". [Tùy biến Authorization](#/docs/kafka-11) đọc lướt để biết điểm mở rộng. [Cân nhắc về bảo mật](#/docs/kafka-11) khép mục bằng nguyên tắc đặc quyền tối thiểu.

**Bẫy.** Bật nén trong Kafka cho các message đã mã hóa đầu-cuối. Khung "NÉN CÁC MESSAGE ĐÃ MÃ HÓA (COMPRESSION OF ENCRYPTED MESSAGES)" nói rõ nén sau khi mã hóa gần như không mang lại lợi ích nào về dung lượng: hãy nén trước khi mã hóa, còn nén trong Kafka thì tốt hơn là tắt vì nó chỉ tạo thêm overhead. Bẫy thứ hai: giữ \`allow.everyone.if.no.acl.found=true\` sau khi đã bật authorization xong. Sách nói thẳng nó không phù hợp để dùng trong production vì quyền truy cập có thể vô tình được cấp cho các tài nguyên mới; và chiều ngược lại: quyền có thể bị gỡ bỏ ngoài dự kiến khi bạn thêm một ACL tiền tố hoặc wildcard khớp, vì điều kiện \`no.acl.found\` không còn đúng nữa.

**Tự kiểm tra.** Một producer idempotent không dùng transaction cần thêm ACL nào ngoài \`Topic:Write\`? Và vì sao việc xoay vòng khóa mã hóa lại rắc rối riêng với các topic dùng compaction?`,
      },
      {
        id: "kf-w8-4",
        text: "Auditing, bảo mật ZooKeeper và bảo mật nền tảng",
        lesson: `**Mục tiêu.** Bật đúng hai logger để có một dấu vết kiểm toán dùng được, và kể được ba lớp bảo vệ nằm ngoài Kafka mà thiếu chúng thì phần bảo mật bạn vừa dựng vẫn hở.

**Đọc.** [Auditing](#/docs/kafka-11) ngắn nhưng đọc kỹ: hai logger \`kafka.authorizer.logger\` và \`kafka.request.logger\` cấu hình độc lập trong *log4j.properties*, cùng nhịp mức log — authorizer ghi \`INFO\` cho mọi thao tác bị từ chối và \`DEBUG\` cho mọi thao tác được cấp quyền, còn request logger phải ở \`TRACE\` mới ghi trọn chi tiết request. Ba dòng log ví dụ trong mục này bị bản PDF gốc cắt cụt giữa chừng, nên hãy đọc chúng như minh họa về hình dạng: đừng gõ lại và đừng đoán phần thiếu. [Bảo mật ZooKeeper (Securing ZooKeeper)](#/docs/kafka-11) rồi [SASL](#/docs/kafka-11) với khung "PRINCIPAL CỦA BROKER (BROKER PRINCIPAL)", [SSL](#/docs/kafka-11) — chú ý khác biệt so với Kafka: một kết nối có cả SASL lẫn SSL client authentication sẽ gắn nhiều principal, và authorizer cho phép truy cập nếu bất kỳ principal nào đủ quyền — và [Authorization](#/docs/kafka-11) với \`zookeeper.set.acl=true\`. [Bảo mật nền tảng (Securing the Platform)](#/docs/kafka-11) đọc chậm phần mô hình mối đe dọa, gồm cả mối đe dọa từ bên trong. [Bảo vệ mật khẩu (Password Protection)](#/docs/kafka-11) thì gõ lại \`GpgProvider\`, lệnh \`gpg --symmetric\` và bốn dòng \`config.providers\`. [Tóm tắt](#/docs/kafka-11) khép chương.

**Bẫy.** Dùng SASL/DIGEST-MD5 cho ZooKeeper vì nó có sẵn và dễ đặt. Sách cảnh báo thẳng: cơ chế này chỉ nên được dùng kèm mã hóa TLS và không phù hợp để dùng trong production do có những lỗ hổng bảo mật đã biết. Bẫy thứ hai: để ZooKeeper nhận diện mỗi broker bằng principal Kerberos đầy đủ của nó. Khung "PRINCIPAL CỦA BROKER (BROKER PRINCIPAL)" chỉ ra hệ quả: mặc định ZooKeeper lấy nguyên dạng \`kafka/broker1.example.com@EXAMPLE.COM\` làm danh tính client, nên khi bật ACL cho authorization của ZooKeeper, phải cấu hình \`kerberos.removeHostFromPrincipal=true\` và \`kerberos.removeRealmFromPrincipal=true\` để tất cả broker cùng chung một principal.

**Tự kiểm tra.** Ở mức log mặc định, log của authorizer cho bạn thấy thao tác bị từ chối hay thao tác được cho phép, và điều đó đổi cách dựng cảnh báo thế nào? Và vì sao mã hóa đĩa vẫn chưa đủ để giấu dữ liệu khỏi quản trị viên nền tảng?`,
      },
    ],
  },
  {
    id: "kf-w9",
    week: "Tuần 9",
    title: "Quản trị vận hành Kafka",
    goal: "Làm được trọn một vòng vận hành thường ngày bằng bộ công cụ dòng lệnh có sẵn, và nhận ra ranh giới giữa thao tác thường quy với thao tác chỉ chạm tới khi đã hết cách.",
    practice:
      "Làm đủ một vòng vận hành trên cluster thử: tạo topic, tăng số partition, xem lag của một consumer group, và reset offset của group đó theo đúng mục \"Consumer Groups\" của chương. **Đọc hết mục \"Các thao tác không an toàn (Unsafe Operations)\" TRƯỚC khi thử bất cứ thứ gì trong đó** — và không thử trên cluster có dữ liệu thật.",
    resources: [
      { label: "Kafka 12 — Quản trị vận hành Kafka", href: "#/docs/kafka-12" },
    ],
    items: [
      {
        id: "kf-w9-1",
        text: "Thao tác topic bằng dòng lệnh",
        lesson: `**Mục tiêu.** Làm chủ \`kafka-topics.sh\` cho trọn vòng đời một topic, và dùng bốn tùy chọn lọc của \`--describe\` như bộ chẩn đoán đầu tiên khi cluster có chuyện.

**Đọc.** Phần mở chương cùng khung "Phân quyền cho các thao tác quản trị (Authorizing admin operations)" và khung "Kiểm tra phiên bản (Check the version)" — đọc cả hai trước khi gõ lệnh đầu tiên: mặc định bộ công cụ này không đòi authentication nào. [Thao tác với topic (Topic Operations)](#/docs/kafka-12) rồi [Tạo một topic mới (Creating a New Topic)](#/docs/kafka-12) với ba tham số bắt buộc \`--topic\`, \`--replication-factor\`, \`--partitions\`, khung "Thực hành tốt khi đặt tên topic (Good topic naming practices)" và khung "Sử dụng đúng cách các tham số if-exists và if-not-exists"; chạy thật lệnh tạo \`my-topic\` tám partition. [Liệt kê tất cả topic trong một cluster (Listing All Topics in a Cluster)](#/docs/kafka-12) ngắn, nhớ \`--exclude-internal\`. [Xem chi tiết thông tin topic (Describing Topic Details)](#/docs/kafka-12) là mục đọc kỹ nhất: bốn tùy chọn \`--under-replicated-partitions\`, \`--at-min-isr-partitions\`, \`--under-min-isr-partitions\` và \`--unavailable-partitions\` — tự nói ra cái nào chỉ đáng lưu tâm, cái nào là sự cố thật. Lưu ý các dòng \`Configs:\` trong output ví dụ của chương bị bản PDF gốc cắt cụt: đừng lấy chúng làm kết quả kỳ vọng. [Thêm partition (Adding Partitions)](#/docs/kafka-12), [Giảm số lượng partition (Reducing Partitions)](#/docs/kafka-12) và [Xóa một topic (Deleting a Topic)](#/docs/kafka-12) với khung "Cảnh báo: nguy cơ mất dữ liệu (Data loss ahead)" khép mục.

**Bẫy.** Thêm partition vào một topic đang mang message có key. Khung "Điều chỉnh các topic có key (Adjusting keyed topics)" nói rõ lý do: ánh xạ từ key sang partition đổi khi số partition đổi, nên hãy đặt số partition cho topic có key đúng một lần lúc tạo và tránh thay đổi kích thước về sau. Bẫy thứ hai: thêm \`--if-exists\` vào lệnh \`--alter\` trong script tự động cho khỏi báo lỗi. Sách khuyến nghị không dùng: nó khiến lệnh im lặng khi topic cần sửa không tồn tại, che giấu đúng vấn đề bạn cần thấy — một topic đáng lẽ phải được tạo nhưng lại không có.

**Tự kiểm tra.** Vì sao xóa topic là thao tác bất đồng bộ, và điều đó đổi cách bạn xác nhận nó đã xong thế nào? Và vì sao sách khuyên tạo \`my-topic-v2\` thay vì giảm số partition?`,
      },
      {
        id: "kf-w9-2",
        text: "Consumer group và thay đổi cấu hình động",
        lesson: `**Mục tiêu.** Đọc được lag của một consumer group tới từng partition, đưa group về một offset cụ thể một cách có kiểm soát, và đổi cấu hình topic, client hay broker mà không phải khởi động lại gì.

**Đọc.** [Consumer Groups](#/docs/kafka-12) cùng khung "Consumer group dựa trên ZooKeeper (ZooKeeper-based consumer groups)" — đủ để biết vì sao đừng đụng vào \`--zookeeper\`. [Liệt kê và mô tả group (List and Describe Groups)](#/docs/kafka-12) chạy thật cả \`--list\` lẫn \`--describe --group\`, rồi đọc Bảng 12-1 cho kỹ ba cột \`CURRENT-OFFSET\`, \`LOG-END-OFFSET\` và \`LAG\`. [Xóa group (Delete Group)](#/docs/kafka-12) ngắn: group phải rỗng mới xóa được. [Quản lý offset (Offset Management)](#/docs/kafka-12) là mục nặng nhất, gồm [Xuất offset (Export offsets)](#/docs/kafka-12) — nhớ rằng chính lệnh ấy chạy mà thiếu \`--dry-run\` sẽ reset offset thật — và [Nhập offset (Import offsets)](#/docs/kafka-12) với thói quen giữ một bản sao làm backup trước khi sửa. [Thay đổi cấu hình động (Dynamic Configuration Changes)](#/docs/kafka-12) cho bốn entity-type: topics, brokers, users, clients. [Ghi đè cấu hình mặc định của topic (Overriding Topic Configuration Defaults)](#/docs/kafka-12) với Bảng 12-2 đọc như bảng tra; [Ghi đè cấu hình mặc định của client và user (Overriding Client and User Configuration Defaults)](#/docs/kafka-12) với Bảng 12-3; [Ghi đè cấu hình mặc định của broker (Overriding Broker Configuration Defaults)](#/docs/kafka-12) cho ba cấu hình đáng nhớ; rồi [Xem các cấu hình ghi đè (Describing Configuration Overrides)](#/docs/kafka-12) cùng khung "Chỉ hiển thị các giá trị ghi đè của topic".

**Bẫy.** Import offset trong khi consumer group vẫn đang chạy. Khung "Dừng consumer trước (Stop consumers first)" nói rõ hai điều: các consumer sẽ không đọc offset mới nếu chúng được ghi lúc group còn hoạt động, và chúng sẽ ghi đè lên chính các offset bạn vừa import. Bẫy thứ hai: đặt quota producer 10 MBps rồi tin client bị chặn ở 10 MBps. Khung "Hành vi throttling không đồng đều trong các cluster mất cân bằng" đưa ngay phép tính: throttling diễn ra trên từng broker, nên với 5 broker và leadership cân bằng, client đó produce được tới 50 MBps — còn nếu mọi leadership dồn về broker 1 thì đúng là 10 MBps.

**Tự kiểm tra.** Muốn xóa offset của đúng một topic mà không xóa cả group thì thêm tham số nào? Và vì sao \`--describe\` cấu hình không đủ để biết một topic đang chạy với retention bao lâu?`,
      },
      {
        id: "kf-w9-3",
        text: "Produce/consume từ dòng lệnh, và quản lý partition",
        lesson: `**Mục tiêu.** Dùng console producer và console consumer như dụng cụ chẩn đoán chứ không như mắt xích của hệ thống, rồi cân lại leadership và di chuyển replica mà không làm gãy cluster.

**Đọc.** [Produce và consume (Producing and Consuming)](#/docs/kafka-12) mở ngay bằng khung "Chuyển hướng output sang một ứng dụng khác". [Console Producer](#/docs/kafka-12) chạy thật bốn message rồi Control-D; [Sử dụng các tùy chọn cấu hình producer (Using producer configuration options)](#/docs/kafka-12) với khung "Các tùy chọn dòng lệnh dễ gây nhầm lẫn" và [Các tùy chọn của trình đọc dòng (Line-reader options)](#/docs/kafka-12). [Console Consumer](#/docs/kafka-12) cùng khung "Kiểm tra phiên bản công cụ", rồi [Các tùy chọn của message formatter (Message formatter options)](#/docs/kafka-12) với Bảng 12-4 và [Consume các topic offset (Consuming the offsets topics)](#/docs/kafka-12). [Quản lý partition (Partition Management)](#/docs/kafka-12) rồi [Bầu chọn replica ưu tiên (Preferred Replica Election)](#/docs/kafka-12). [Thay đổi replica của một partition (Changing a Partition's Replicas)](#/docs/kafka-12) là mục đọc chậm nhất tuần: ba bước generate, execute, verify cùng khung "Cải thiện việc sử dụng mạng khi gán lại replica"; rồi [Thay đổi replication factor (Changing the replication factor)](#/docs/kafka-12) và [Hủy các thao tác gán lại replica (Canceling replica reassignments)](#/docs/kafka-12). [Kết xuất các log segment (Dumping Log Segments)](#/docs/kafka-12) chạy thật cả hai dạng, có và không có \`--print-data-log\`. [Kiểm chứng replica (Replica Verification)](#/docs/kafka-12) khép mục — cả dòng lệnh lẫn dòng output ví dụ ở đây đều bị bản PDF gốc cắt cụt, nên đừng gõ lại và đừng chờ thấy đúng chúng.

**Bẫy.** Chạy \`kafka-reassign-partitions.sh --execute\` trên cluster production mà không kèm \`--throttle\`. Sách nói rõ việc gán lại partition ảnh hưởng lớn tới hiệu năng cluster vì nó thay đổi tính nhất quán của memory page cache và tiêu tốn cả I/O mạng lẫn đĩa; \`--throttle\` nhận byte/giây và ghép được với \`--additional\` để hãm một lần gán lại đã lỡ bắt đầu. Bẫy thứ hai: bọc console consumer trong một ứng dụng để chuyển tiếp message. Khung "Chuyển hướng output sang một ứng dụng khác" gọi loại ứng dụng này là mong manh và nên tránh: rất khó tương tác với console consumer theo cách không làm mất message.

**Tự kiểm tra.** Vì sao \`--cancel\` một thao tác gán lại có thể đẩy cluster vào trạng thái không mong muốn? Và trước khi rút một broker khỏi cluster, vì sao khởi động lại nó lại làm việc gán lại nhẹ đi?`,
      },
      {
        id: "kf-w9-4",
        text: "Các công cụ khác, và những thao tác KHÔNG an toàn",
        lesson: `**Mục tiêu.** Biết những công cụ còn lại trong bản phân phối tồn tại để làm gì, và đọc mục thao tác không an toàn như một quy trình khẩn cấp: hiểu trước, không thử trước.

**Đọc.** [Các công cụ khác (Other Tools)](#/docs/kafka-12) đọc lướt ba nhóm: \`kafka-acls.sh\` nối vào tuần 8, \`kafka-mirror-maker.sh\` nối vào tuần 7, và nhóm kiểm thử với \`kafka-broker-api-versions.sh\`, các script benchmark và \`trogdor.sh\`. [Các thao tác không an toàn (Unsafe Operations)](#/docs/kafka-12) thì đọc chậm và đọc hết trước khi gõ bất cứ thứ gì — đúng như phần thực hành tuần yêu cầu. Hai đoạn mở đầu định khung: các tác vụ ở đây thường không có tài liệu, không được hỗ trợ, mang rủi ro, chỉ dùng khi hết cách. Khung "Nguy hiểm: vùng đất của rồng (Danger: here be dragons)" là ranh giới của cả mục. [Di chuyển cluster controller (Moving the Cluster Controller)](#/docs/kafka-12) — xóa znode \`/admin/controller\` khiến controller hiện tại từ nhiệm; không có cách nào chỉ định broker cụ thể làm controller. [Gỡ bỏ các topic đang chờ xóa (Removing Topics to Be Deleted)](#/docs/kafka-12) cho hai tình huống khiến yêu cầu xóa bị kẹt. [Xóa topic một cách thủ công (Deleting Topics Manually)](#/docs/kafka-12) bốn bước cùng khung "Tắt các broker trước (Shut down brokers first)". [Tóm tắt (Summary)](#/docs/kafka-12) khép chương.

**Bẫy.** Mở ZooKeeper ra sửa metadata vì như thế nhanh hơn. Khung "Nguy hiểm: vùng đất của rồng" đặt luật cho cả mục: các thao tác ở đây làm việc trực tiếp với metadata cluster trong ZooKeeper, đây có thể là thao tác rất nguy hiểm, nên phải hết sức cẩn thận để không sửa đổi trực tiếp thông tin trong ZooKeeper ngoài những trường hợp được nêu rõ. Bẫy thứ hai: xóa topic thủ công trên một cluster đang chạy. Khung "Tắt các broker trước (Shut down brokers first)" nói thẳng: sửa metadata cluster trong ZooKeeper khi cluster online là thao tác rất nguy hiểm, có thể đưa cluster vào trạng thái không ổn định — đừng bao giờ thử; quy trình bốn bước bắt đầu bằng việc tắt toàn bộ broker.

**Tự kiểm tra.** Sau khi gỡ znode \`/admin/delete_topic/<topic>\`, vì sao đôi khi vẫn phải buộc di chuyển controller ngay sau đó? Và trong bốn bước xóa topic thủ công, bỏ sót bước nào sẽ khiến dữ liệu vẫn nằm lại trên đĩa?`,
      },
    ],
  },
];
