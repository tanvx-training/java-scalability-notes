// Ngân hàng câu hỏi phỏng vấn Designing Data-Intensive Applications — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Designing Data-Intensive Applications, ấn bản 2
// (Martin Kleppmann — O'Reilly).
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA — xem chú thích
// đầu js/data/jpa/interview.js.
//
// GIỮ NGUYÊN id (ddia-iq01–ddia-iq24) — thống kê tự chấm lưu theo id.

export const ddiaInterview = [
  // ===== dd-tradeoff — Đánh đổi kiến trúc (ddia-iq01–ddia-iq04) =====
  {
    id: "ddia-iq01",
    field: "ddia",
    topic: "dd-tradeoff",
    level: 1,
    minutes: 6,
    question: "Sách nói mọi kiến trúc hệ thống dữ liệu là một chuỗi đánh đổi. Nêu cách bạn biến những từ như \"đáng tin cậy\", \"mở rộng được\", \"dễ bảo trì\" thành thứ quyết định được.",
    mustCover: [
      "Phải biến chúng thành **yêu cầu phi chức năng định lượng** — con số cùng với điều kiện đo",
      "\"Mở rộng được\" vô nghĩa nếu không nói **tham số tải** nào tăng và tăng tới đâu",
      "Độ trễ phải nói theo **percentile**, không theo trung bình — trung bình che mất đuôi mà người dùng thật cảm nhận",
      "Percentile cao là thứ quan trọng nhất với trải nghiệm, vì khách hàng chậm nhất thường là khách hàng có nhiều dữ liệu nhất",
      "\"Đáng tin cậy\" phải nói rõ **loại hỏng** nào được chịu và mất dữ liệu tới mức nào là chấp nhận",
      "\"Dễ bảo trì\" định lượng khó nhất nhưng có proxy: thời gian đưa một người mới vào việc, thời gian khôi phục sau sự cố",
    ],
    model: "Ba từ đó không phải thuộc tính mà là nhãn dán lên một tập đánh đổi, nên việc đầu tiên là biến chúng thành yêu cầu phi chức năng định lượng — con số kèm điều kiện đo. \"Mở rộng được\" là từ mơ hồ nhất: nó vô nghĩa cho tới khi ta nói **tham số tải** nào đang tăng. Số người dùng đồng thời? Số bản ghi? Số lần ghi mỗi giây? Tỉ lệ đọc trên ghi? Kích thước một bản ghi? Hai hệ thống cùng \"mở rộng\" theo hai tham số khác nhau có kiến trúc hoàn toàn khác nhau, nên câu hỏi đúng là \"tham số nào tăng, từ bao nhiêu lên bao nhiêu, trong bao lâu\". Về hiệu năng thì điều quan trọng nhất là nói theo percentile chứ không theo trung bình. Trung bình che mất đuôi, và đuôi mới là thứ người dùng thật cảm nhận — thêm nữa, những request chậm nhất thường thuộc về khách hàng có nhiều dữ liệu nhất, tức khách hàng giá trị nhất, nên tối ưu theo trung bình là tối ưu cho người ít quan trọng nhất. Nên yêu cầu phải viết thành dạng \"p99 dưới X ms ở mức tải Y\". \"Đáng tin cậy\" thì phải tách thành hai câu hỏi cụ thể: những loại hỏng nào hệ thống phải chịu được — một node chết, một vùng mất điện, một đĩa hỏng âm thầm, một lỗi do người vận hành — và mất dữ liệu tới mức nào là chấp nhận được. Không trả lời được hai câu đó thì không thiết kế được replication hay backup, vì hai thứ ấy phục vụ hai mục đích khác nhau: replica phản ánh lần ghi nhanh chóng, còn backup lưu snapshot cũ để quay ngược thời gian — nên nếu ta xoá nhầm dữ liệu thì replication không cứu được vì thao tác xoá cũng được lan truyền. \"Dễ bảo trì\" khó định lượng nhất nhưng vẫn có proxy dùng được: thời gian để một người mới đóng góp được, và thời gian khôi phục sau một sự cố.",
    redFlags: [
      "Dùng \"mở rộng được\" mà không nêu tham số tải nào tăng",
      "Nói về hiệu năng bằng giá trị trung bình",
      "Coi replication là đủ để thay backup",
      "Coi \"dễ bảo trì\" là thứ không định lượng được nên bỏ qua",
    ],
    probes: [
      "Nêu ba tham số tải khác nhau cho cùng một hệ thống thương mại điện tử",
      "Vì sao request chậm nhất thường thuộc khách hàng giá trị nhất?",
      "Replication và backup phục vụ hai mục đích nào?",
    ],
    refs: ["ddia-01", "ddia-02"],
  },
  {
    id: "ddia-iq02",
    field: "ddia",
    topic: "dd-tradeoff",
    level: 2,
    minutes: 7,
    code: {
      lang: "text",
      text: `Bảng SLA mà một đội đề xuất cho dịch vụ mới:

  Thời gian phản hồi trung bình ......... < 100ms
  Uptime ............................... 99,9%
  "Hỗ trợ 10.000 người dùng"
  "Không mất dữ liệu"

Số liệu đo được từ bản thử nghiệm:
  trung bình 45ms · p50 30ms · p95 180ms · p99 890ms · p999 4.200ms
  Một khách hàng có 2,1 triệu bản ghi; trung vị là 400 bản ghi.`,
    },
    question: "Bảng SLA này không dùng được. Chỉ ra từng dòng có vấn đề, nói vì sao, rồi viết lại thành yêu cầu kiểm chứng được.",
    mustCover: [
      "\"Trung bình < 100ms\" **đã đạt** với số đo hiện tại (45ms) trong khi p99 là 890ms — nên nó không bảo vệ được gì",
      "Phải viết theo **percentile**: chẳng hạn p99 dưới một ngưỡng, ở một mức tải xác định",
      "\"Hỗ trợ 10.000 người dùng\" thiếu **tham số tải**: 10.000 đăng ký hay đồng thời, và mỗi người tạo bao nhiêu request",
      "Khoảng cách giữa 2,1 triệu và 400 bản ghi cho thấy phân bố **rất lệch**, nên một con số tổng hợp che mất khách hàng nặng nhất",
      "Nên SLA phải nói rõ áp cho **phân khúc** nào, hoặc đặt ngưỡng theo kích thước dữ liệu",
      "\"Uptime 99,9%\" thiếu định nghĩa **thế nào là up** và cửa sổ đo — 99,9% trong tháng khác 99,9% trong năm",
      "\"Không mất dữ liệu\" không kiểm chứng được: phải nói theo **mục tiêu điểm khôi phục** và **thời gian khôi phục**",
    ],
    model: "Cả bốn dòng đều có vấn đề, và dòng đầu là dòng tệ nhất vì nó trông như đã đạt. Trung bình đo được là 45ms nên SLA \"trung bình dưới 100ms\" đã xanh, trong khi p99 là 890ms và p999 là 4,2 giây — nghĩa là cứ một nghìn request thì có một mất hơn bốn giây, và SLA hiện tại không nói gì về điều đó. Phải viết lại theo percentile kèm mức tải, chẳng hạn p99 dưới 300ms và p999 dưới 1 giây ở mức 500 request mỗi giây. Dòng thứ hai, \"hỗ trợ 10.000 người dùng\", thiếu tham số tải: 10.000 người đăng ký là một hệ thống hoàn toàn khác 10.000 người đồng thời, và ta còn cần biết mỗi người tạo bao nhiêu request cùng đọc bao nhiêu dữ liệu. Nhưng điều đáng nói nhất nằm ở hai con số cuối của số liệu: một khách hàng có 2,1 triệu bản ghi trong khi trung vị là 400. Phân bố lệch tới mức đó nghĩa là mọi con số tổng hợp đều che mất khách hàng nặng nhất — và theo đúng nhận xét của sách, khách hàng chậm nhất thường là khách hàng có nhiều dữ liệu nhất, tức thường là khách hàng giá trị nhất. Nên SLA phải nói rõ nó áp cho phân khúc nào, hoặc đặt ngưỡng theo kích thước dữ liệu, thay vì một con số cho tất cả. Dòng \"uptime 99,9%\" thiếu hai thứ: định nghĩa thế nào là up — có tính request lỗi hay chỉ tính dịch vụ không phản hồi? — và cửa sổ đo, vì 99,9% trong một tháng cho khoảng 43 phút ngừng còn tính theo năm thì cho phép một lần ngừng dài gần 9 giờ. Dòng \"không mất dữ liệu\" không kiểm chứng được và cũng không thực hiện được tuyệt đối; nó phải được viết thành mục tiêu điểm khôi phục — mất tối đa bao nhiêu phút dữ liệu — và thời gian khôi phục, cộng với danh sách loại hỏng mà hai mục tiêu đó áp dụng.",
    redFlags: [
      "Chỉ đổi trung bình sang p99 rồi dừng, bỏ qua ba dòng còn lại",
      "Không nhận ra phân bố lệch làm mọi con số tổng hợp mất nghĩa",
      "Coi \"không mất dữ liệu\" là một yêu cầu hợp lệ",
      "Đặt p99 mà không nêu mức tải kèm theo",
    ],
    probes: [
      "Bạn viết SLA thế nào cho khách hàng có 2,1 triệu bản ghi?",
      "99,9% trong tháng và trong năm khác nhau ra sao về hệ quả vận hành?",
      "Mục tiêu điểm khôi phục của bạn quyết định điều gì về kiến trúc?",
    ],
    refs: ["ddia-02", "ddia-01"],
  },
  {
    id: "ddia-iq03",
    field: "ddia",
    topic: "dd-tradeoff",
    level: 3,
    minutes: 10,
    question: "Một dịch vụ đang chạm trần năng lực. Bạn mở rộng theo chiều dọc hay chiều ngang?",
    tradeoffs: [
      {
        option: "Chiều dọc — máy to hơn",
        when: "Còn dư dư địa phần cứng và hệ thống **chưa** được thiết kế để phân tán. Đơn giản nhất: không đổi mã, không có bài toán nhất quán, không có bài toán định tuyến. Sách nhấn rằng đây thường là lựa chọn đúng lâu hơn người ta tưởng, vì máy hiện đại rất lớn.",
      },
      {
        option: "Chiều ngang — nhiều máy",
        when: "Khi đã hết dư địa phần cứng, hoặc khi cần chịu được **hỏng một node** mà không ngừng dịch vụ. Đổi lại là toàn bộ họ vấn đề của hệ phân tán: hỏng hóc một phần, mạng không đáng tin, đồng hồ không đáng tin.",
      },
      {
        option: "Tách theo **loại tải** trước khi tách theo lượng",
        when: "Thường là bước rẻ nhất mà người ta bỏ qua: tách đường đọc khỏi đường ghi, tách báo cáo khỏi giao dịch. Nó giảm tải mà không đưa vào bài toán nhất quán mới.",
      },
    ],
    mustCover: [
      "Phải biết **tham số tải nào** đang chạm trần trước khi chọn — CPU, bộ nhớ, I/O đĩa, băng thông mạng",
      "Mở rộng dọc **không** đưa vào bài toán mới, nên nó là lựa chọn đúng cho tới khi hết dư địa",
      "Mở rộng ngang đưa vào cả họ vấn đề: hỏng hóc **một phần**, và đó là khác biệt chất so với hỏng toàn phần",
      "Trong hệ một máy, lỗi thường là **tất định**: cùng thao tác cho cùng kết quả; trong hệ phân tán thì không",
      "Nhu cầu **chịu lỗi** có thể buộc phải phân tán ngay cả khi năng lực một máy vẫn đủ",
      "Tách theo loại tải thường rẻ hơn cả hai và nên thử trước",
    ],
    model: "Câu đầu tiên tôi hỏi không phải dọc hay ngang mà là **tham số nào** đang chạm trần: CPU, bộ nhớ, I/O đĩa, hay băng thông mạng. Bốn thứ đó dẫn tới bốn quyết định khác nhau, và nếu nút thắt là I/O đĩa thì thêm máy có thể không giúp gì trong khi đổi loại đĩa thì giải quyết xong. Sau khi biết, tôi ưu tiên mở rộng dọc lâu hơn người ta thường nghĩ, vì nó không đưa vào bài toán mới nào: mã không đổi, không có bài toán nhất quán, không có định tuyến, không có hỏng hóc một phần — và máy hiện đại rất lớn, nên dư địa thường còn nhiều hơn trực giác. Mở rộng ngang đắt không phải vì tiền máy mà vì nó đưa vào một **thay đổi về chất**: trong một hệ chạy trên một máy, lỗi thường là tất định — cùng thao tác cho cùng kết quả, và nếu phần cứng hỏng thì cả hệ dừng hẳn. Khi phân tán, ta bước vào thế giới hỏng hóc một phần: một số node hoạt động còn một số không, mạng có thể làm mất hoặc làm chậm gói mà không báo, và ta thường **không phân biệt được** một node đã chết với một node chỉ đang chậm. Đó là gốc rễ của gần như mọi khó khăn còn lại, kể cả chuyện đồng hồ không đáng tin. Nên tôi chỉ trả giá đó khi có một trong hai lý do: đã hết dư địa phần cứng, hoặc — và đây là lý do hay bị bỏ qua — yêu cầu **chịu lỗi** buộc phải có nhiều node, vì một máy dù to đến đâu vẫn là một điểm hỏng duy nhất. Nếu yêu cầu là chịu được hỏng một node mà không ngừng dịch vụ thì phân tán là bắt buộc, bất kể năng lực. Còn bước tôi luôn thử trước cả hai, vì nó rẻ nhất và hay bị bỏ qua, là tách theo **loại tải** thay vì theo lượng: đưa báo cáo ra khỏi đường giao dịch, tách đường đọc khỏi đường ghi. Nó giảm tải thật mà không đưa vào bài toán nhất quán mới nào.",
    redFlags: [
      "Chọn ngang theo phản xạ vì \"đó là cách hệ thống lớn làm\"",
      "Không xác định tham số nào đang chạm trần trước khi chọn",
      "Bỏ qua lý do chịu lỗi, nên không giải thích được vì sao đôi khi phải phân tán dù một máy còn đủ",
      "Không nhắc tới hỏng hóc một phần như khác biệt về chất",
    ],
    probes: [
      "Nút thắt là I/O đĩa — lựa chọn của bạn đổi thế nào?",
      "Vì sao không phân biệt được node chết với node chậm lại là vấn đề gốc?",
      "Tách theo loại tải cho bạn gì mà tách theo lượng không cho?",
    ],
    refs: ["ddia-01", "ddia-09"],
  },
  {
    id: "ddia-iq04",
    field: "ddia",
    topic: "dd-tradeoff",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ đạt SLA \"p99 dưới 200ms\" trong mọi báo cáo, nhưng ba khách hàng doanh nghiệp lớn nhất liên tục khiếu nại về độ chậm và một trong số đó đe doạ không gia hạn. Đội không tái hiện được vấn đề trên tài khoản thử nghiệm.",
      scale: "Tổng 40.000 request/giây. Ba khách hàng đó chiếm 0,9% lưu lượng nhưng 31% doanh thu. Tài khoản lớn nhất có 4,3 triệu bản ghi; trung vị toàn hệ thống là 600.",
      constraints: "Không đổi được SLA đã ký với các khách hàng còn lại. Không tách được ba khách hàng sang hạ tầng riêng trong quý này. Phải có kết quả trước kỳ gia hạn trong 5 tuần.",
      },
    question: "p99 toàn cục đạt mà khách hàng lớn vẫn chậm — điều đó nói gì về cách đo? Nêu chẩn đoán và việc bạn làm trong 5 tuần.",
    mustCover: [
      "p99 toàn cục được tính trên **toàn bộ** lưu lượng, mà ba khách hàng đó chỉ chiếm 0,9% — nên họ nằm **hoàn toàn trong phần đuôi bị che**",
      "Số học: 0,9% lưu lượng nghĩa là dù **mọi** request của họ đều chậm, p99 toàn cục vẫn có thể đạt",
      "Nên đây không phải lỗi đo sai mà là **đo sai đại lượng**: một con số tổng hợp không trả lời được câu hỏi theo phân khúc",
      "Phân bố dữ liệu rất lệch (4,3 triệu so với trung vị 600) đúng là kiểu tải mà sách cảnh báo: khách chậm nhất thường là khách nhiều dữ liệu nhất",
      "Việc đầu tiên, rẻ nhất: **tách percentile theo khách hàng** — dữ liệu đã có, chỉ cần nhóm lại",
      "Không tái hiện được trên tài khoản thử nghiệm là vì tài khoản đó có lượng dữ liệu ở mức trung vị, không ở mức 4,3 triệu",
      "Nên phải dựng dữ liệu thử nghiệm **theo hình dạng của khách hàng lớn**, không theo trung vị",
      "Và phải nói rõ: SLA hiện tại tuy đạt nhưng **không bảo vệ** phân khúc mang 31% doanh thu",
    ],
    model: "Con số 0,9% là chìa khoá, và nó biến câu hỏi thành một phép tính đơn giản: p99 toàn cục cho phép 1% request chậm, mà ba khách hàng đó chỉ tạo ra 0,9% lưu lượng — nên kể cả khi **mọi** request của họ đều rất chậm, p99 toàn cục vẫn có thể xanh. SLA không hề bị vi phạm, nó chỉ không nói gì về phân khúc này. Nên chẩn đoán đúng không phải \"đo sai\" mà là \"đo sai đại lượng\": một con số tổng hợp trên toàn bộ lưu lượng không trả lời được câu hỏi theo phân khúc, và với một phân bố lệch như ở đây thì nó còn chủ động che đi đúng phần đáng lo. Khoảng cách giữa 4,3 triệu bản ghi và trung vị 600 là chính kiểu tải mà sách cảnh báo, kèm nhận xét rất đúng với tình huống này: khách hàng chậm nhất thường là khách hàng có nhiều dữ liệu nhất, tức khách hàng giá trị nhất — ở đây là 31% doanh thu. Việc chuyện không tái hiện được trên tài khoản thử nghiệm cũng có lời giải thích thẳng: tài khoản đó gần như chắc chắn có lượng dữ liệu ở mức trung vị, nên nó đo một tình huống khác hoàn toàn. Trong 5 tuần tôi làm theo thứ tự này. Tuần đầu, việc rẻ nhất và cho nhiều thông tin nhất: tách percentile **theo khách hàng** — dữ liệu đã có sẵn, chỉ cần nhóm lại thay vì tổng hợp. Tôi kỳ vọng thấy p99 của ba khách hàng kia cao hơn nhiều bậc, và con số đó vừa là chẩn đoán vừa là thứ mang đi nói chuyện được. Song song, dựng dữ liệu thử nghiệm theo **hình dạng** của khách hàng lớn chứ không theo trung vị, để đội tái hiện được và từ đó profile được. Sau khi có hai thứ đó, phần tối ưu mới bắt đầu có mục tiêu — và giả thuyết hàng đầu với hình dạng dữ liệu như vậy thường là những truy vấn có chi phí tăng theo lượng dữ liệu của một khách hàng, thứ vô hình ở mức 600 bản ghi. Điều tôi sẽ nói rõ với đội và với chủ sở hữu sản phẩm ngay từ đầu: SLA hiện tại tuy đạt nhưng không bảo vệ phân khúc mang gần một phần ba doanh thu, nên dù ta sửa xong ca này thì việc cần làm tiếp là đặt SLA theo phân khúc — nếu không, lần sau ta lại phát hiện vấn đề qua một lời đe doạ không gia hạn thay vì qua dashboard.",
    redFlags: [
      "Kết luận khách hàng khiếu nại sai vì SLA đã đạt",
      "Tối ưu chung cho mọi request thay vì tìm hiểu phân khúc đang chậm",
      "Tiếp tục thử tái hiện trên tài khoản có lượng dữ liệu ở mức trung vị",
      "Đề nghị tách hạ tầng riêng — ràng buộc đã cấm trong quý này, và nó cũng chưa được chẩn đoán",
      "Đổi SLA thành p999 cho mọi khách hàng mà không tách theo phân khúc",
    ],
    probes: [
      "Làm phép tính cho thấy p99 toàn cục có thể đạt dù mọi request của ba khách đều chậm",
      "Bạn dựng dữ liệu thử nghiệm theo hình dạng khách hàng lớn thế nào?",
      "SLA theo phân khúc nên được viết ra sao để không thành một lời hứa không giữ được?",
    ],
    refs: ["ddia-02"],
  },

  // ===== dd-model — Mô hình dữ liệu, lưu trữ và encoding (ddia-iq05–ddia-iq08) =====
  {
    id: "ddia-iq05",
    field: "ddia",
    topic: "dd-model",
    level: 1,
    minutes: 6,
    question: "Vì sao một storage engine tối ưu cho ghi lại thường kém cho đọc, và ngược lại? Nêu cơ chế đằng sau.",
    mustCover: [
      "Ghi nhanh nhất là **ghi thêm vào cuối** — tuần tự, không phải tìm chỗ, nên rất rẻ trên cả đĩa quay và SSD",
      "Nhưng ghi thêm nghĩa là cùng một khoá có **nhiều phiên bản** rải rác, nên đọc phải tìm bản mới nhất",
      "Họ engine dựa trên **cây có cấu trúc log** chọn hướng này: ghi rẻ, đọc phải gộp nhiều tầng, và phải **nén gộp** ở nền",
      "Họ engine dựa trên **cây cân bằng tại chỗ** thì ngược: đọc là một đường đi xuống cây, còn ghi phải sửa tại chỗ và có thể tách trang",
      "Ghi tại chỗ cũng cần **ghi trước vào log** để chịu được sự cố giữa lúc sửa, nên mỗi lần ghi tốn hai lần ghi đĩa",
      "Nên đánh đổi gốc là **khuếch đại ghi** so với **khuếch đại đọc**, và lựa chọn phụ thuộc tỉ lệ đọc/ghi thật của tải",
    ],
    model: "Đánh đổi bắt nguồn từ một sự thật về phần cứng: ghi tuần tự vào cuối một tệp rẻ hơn nhiều so với tìm tới một chỗ giữa tệp rồi sửa. Nên cách làm ghi nhanh nhất là chỉ ghi thêm, không bao giờ sửa chỗ cũ. Nhưng cái giá lộ ra ngay: nếu mỗi lần cập nhật là một lần ghi thêm thì cùng một khoá có nhiều phiên bản nằm rải rác, và đọc phải tìm ra bản mới nhất. Họ engine dựa trên cây có cấu trúc log chọn hướng này — ghi vào một cấu trúc trong bộ nhớ rồi xả xuống đĩa thành từng tệp đã sắp xếp, nên ghi rất rẻ. Đổi lại, một lần đọc có thể phải tra nhiều tầng tệp, và hệ thống phải liên tục **nén gộp** ở nền để dồn các tệp lại và loại phiên bản cũ; công việc nền đó tiêu I/O và đôi khi tranh với tải thật, nên nó là nguồn của những đợt độ trễ khó truy. Họ engine dựa trên cây cân bằng sửa tại chỗ thì đảo ngược cả hai: đọc là một đường đi xuống cây với số bước biết trước nên độ trễ đọc ổn định và dự đoán được, còn ghi phải tìm đúng trang rồi sửa, và nếu trang đầy thì phải tách ra kéo theo cập nhật trang cha. Thêm nữa, vì sửa tại chỗ có thể bị ngắt giữa đường và để lại cấu trúc hỏng, engine phải ghi trước vào một log rồi mới sửa — nghĩa là mỗi lần ghi logic tốn hai lần ghi đĩa. Nên cách đúng để phát biểu đánh đổi là **khuếch đại ghi** so với **khuếch đại đọc**: mỗi kiến trúc chọn trả nhiều hơn ở một phía. Và điều đó nghĩa là câu hỏi \"engine nào tốt hơn\" không có câu trả lời chung — nó phụ thuộc tỉ lệ đọc trên ghi thật của tải, và cả việc độ trễ đọc cần ổn định tới mức nào.",
    redFlags: [
      "Nói một họ engine \"nhanh hơn\" mà không gắn với tỉ lệ đọc/ghi",
      "Bỏ qua việc nén gộp ở nền là một nguồn tiêu I/O và gây đợt độ trễ",
      "Không biết ghi tại chỗ cần ghi trước vào log nên mỗi ghi logic tốn hai ghi đĩa",
    ],
    probes: [
      "Nén gộp ở nền ảnh hưởng tới độ trễ đọc lúc nào?",
      "Tải của bạn có tỉ lệ đọc/ghi bao nhiêu thì bạn đổi lựa chọn?",
      "Vì sao độ trễ đọc của cây cân bằng lại dễ dự đoán hơn?",
    ],
    refs: ["ddia-04"],
  },
  {
    id: "ddia-iq06",
    field: "ddia",
    topic: "dd-model",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Một dịch vụ đổi định dạng message giữa hai thành phần. Phiên bản cũ:

  { "userId": 42, "name": "An", "email": "an@example.com" }

Đội đổi thành (triển khai ĐỒNG THỜI cả producer và consumer):

  { "user_id": 42, "full_name": "An", "email": "an@example.com",
    "tier": "gold" }                       // trường mới, BẮT BUỘC ở consumer mới

Kết quả: trong 8 phút triển khai luân phiên, khoảng 12.000 message bị
consumer từ chối, và một số message cũ nằm trong hàng đợi 40 phút.`,
    },
    question: "Chỉ ra các lỗi về tiến hoá schema ở đây. Với mỗi lỗi nói nó phá chiều tương thích nào, rồi đưa ra cách triển khai đúng.",
    mustCover: [
      "Đổi tên trường phá **cả hai** chiều: consumer mới không đọc được message cũ, consumer cũ không đọc được message mới",
      "Thêm một trường **bắt buộc** phá **tương thích ngược**: consumer mới không xử lý được dữ liệu cũ vốn không có trường đó",
      "Triển khai luân phiên nghĩa là hai phiên bản **cùng tồn tại**, nên mọi thay đổi phải tương thích cả hai chiều trong khoảng đó",
      "Hàng đợi làm vấn đề nặng thêm: message cũ có thể nằm chờ 40 phút, nên \"hai phiên bản cùng tồn tại\" kéo dài hơn cửa sổ triển khai",
      "Cách đúng cho đổi tên: **thêm** trường mới, ghi **cả hai**, chuyển consumer, rồi mới bỏ trường cũ — ba lần phát hành",
      "Cách đúng cho trường mới: thêm dưới dạng **tuỳ chọn** có giá trị mặc định, không bắt buộc",
      "Nguyên tắc: mỗi lần phát hành chỉ được làm **một** thay đổi tương thích, không gộp nhiều thay đổi phá vỡ",
    ],
    model: "Có hai thay đổi và cả hai đều phá tương thích, cộng một sai lầm về quy trình triển khai. Thay đổi thứ nhất là đổi tên trường — `userId` thành `user_id`, `name` thành `full_name`. Đổi tên phá cả hai chiều cùng lúc: consumer mới không tìm thấy trường nó cần trong message cũ, và consumer cũ không tìm thấy trường nó cần trong message mới. Đây là dạng thay đổi tệ nhất vì không có phiên bản nào đọc được dữ liệu của phiên bản kia. Thay đổi thứ hai là thêm `tier` như một trường **bắt buộc**. Thêm trường tự nó vô hại, nhưng đánh dấu bắt buộc thì phá tương thích ngược: consumer mới không xử lý được toàn bộ dữ liệu cũ vốn không có trường đó. Sai lầm thứ ba là về quy trình: triển khai luân phiên nghĩa là trong suốt khoảng đó hai phiên bản cùng tồn tại và cùng đọc ghi, nên mọi thay đổi phải tương thích **cả hai chiều** trong khoảng ấy. Và ở đây hàng đợi làm cửa sổ đó dài hơn nhiều so với 8 phút triển khai: một message cũ nằm chờ 40 phút nghĩa là consumer mới vẫn phải đọc được dữ liệu cũ sau khi triển khai xong từ lâu — nên \"đợi triển khai xong rồi mọi thứ nhất quán\" là một giả định sai. Cách làm đúng tách thành nhiều lần phát hành, mỗi lần một thay đổi tương thích. Với đổi tên: phát hành một, thêm trường mới và ghi **cả hai** trường ở producer trong khi consumer vẫn đọc trường cũ; phát hành hai, chuyển consumer sang đọc trường mới có phòng lùi về trường cũ; phát hành ba, sau khi chắc chắn không còn dữ liệu cũ trong hệ thống, bỏ trường cũ khỏi producer. Với trường mới: thêm dưới dạng tuỳ chọn kèm giá trị mặc định rõ ràng, để consumer mới xử lý được cả dữ liệu không có nó. Nguyên tắc chung tôi sẽ đưa vào quy ước của đội: mỗi lần phát hành chỉ làm một thay đổi tương thích, và thời điểm được phép bỏ một trường cũ phải tính theo **thời gian sống dài nhất của dữ liệu trong hệ thống**, không theo thời gian triển khai.",
    redFlags: [
      "Chỉ nói \"thêm trường mới nên để tuỳ chọn\" mà bỏ qua việc đổi tên phá cả hai chiều",
      "Đề nghị triển khai đồng thời cả hai thành phần để tránh cùng tồn tại — không khả thi với hàng đợi",
      "Tính thời điểm bỏ trường cũ theo thời gian triển khai chứ không theo thời gian sống của dữ liệu",
      "Gộp cả hai thay đổi vào một lần phát hành có thêm mã xử lý hai định dạng",
    ],
    probes: [
      "Phân biệt tương thích xuôi và tương thích ngược trong ca này",
      "Hàng đợi giữ message 40 phút đổi tính toán của bạn thế nào?",
      "Khi nào bạn thật sự được phép bỏ trường cũ?",
    ],
    refs: ["ddia-05"],
  },
  {
    id: "ddia-iq07",
    field: "ddia",
    topic: "dd-model",
    level: 3,
    minutes: 10,
    question: "Bạn chọn mô hình dữ liệu cho một hệ thống mới. Quan hệ, tài liệu, hay đồ thị?",
    tradeoffs: [
      {
        option: "Quan hệ",
        when: "Dữ liệu có **nhiều quan hệ nhiều-nhiều** và các truy vấn cắt theo nhiều chiều khác nhau. Phép join nằm ở tầng database nên thêm một cách truy vấn mới không đòi đổi cách lưu.",
      },
      {
        option: "Tài liệu",
        when: "Dữ liệu có hình dạng **cây** và gần như luôn được đọc **nguyên cả khối** — một đơn hàng cùng các dòng của nó. Tính cục bộ tốt, và schema linh hoạt khi hình dạng chưa ổn định.",
      },
      {
        option: "Đồ thị",
        when: "Khi **chính các quan hệ** là dữ liệu quan trọng và truy vấn cần đi nhiều bước qua chúng — bạn bè của bạn bè, đường đi trong mạng. Cả hai mô hình kia diễn đạt được nhưng rất tệ.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **hình dạng truy cập**, không phải hình dạng dữ liệu nhìn từ ngoài",
      "Mô hình tài liệu thắng khi có **tính cục bộ** — đọc một lần lấy hết thứ cần, không join",
      "Nhưng nó yếu khi cần truy vấn theo chiều **không** phải chiều lồng, hoặc cần cập nhật một phần nhỏ trong tài liệu lớn",
      "Quan hệ thắng khi các cách truy vấn **chưa biết hết**, vì join ở tầng database giữ được tính linh hoạt đó",
      "Schema-on-read không phải \"không có schema\" — schema chỉ **chuyển sang mã ứng dụng**, và mọi phiên bản dữ liệu cũ vẫn phải xử lý được",
      "Đồ thị đúng khi quan hệ nhiều **loại** và truy vấn cần đi qua số bước **không biết trước**",
    ],
    model: "Tôi chọn theo hình dạng **truy cập** chứ không theo hình dạng dữ liệu, vì cùng một dữ liệu có thể vừa với hai mô hình khác nhau tuỳ cách ta đọc nó. Mô hình tài liệu thắng khi dữ liệu có hình dạng cây và gần như luôn được đọc nguyên cả khối: một đơn hàng cùng các dòng chi tiết của nó, một hồ sơ cùng các mục con. Lợi ích cụ thể là tính cục bộ — một lần đọc lấy hết thứ cần, không join, nên độ trễ ổn định và đơn giản. Nhưng nó yếu ở hai chỗ mà tôi luôn kiểm trước: khi cần truy vấn theo một chiều **không** phải chiều lồng — chẳng hạn \"tất cả dòng chi tiết có mã sản phẩm X trên toàn hệ thống\" — và khi cần cập nhật một phần rất nhỏ trong một tài liệu rất lớn, vì nhiều hệ thống phải viết lại cả tài liệu. Mô hình quan hệ thắng khi dữ liệu có nhiều quan hệ nhiều-nhiều, và đặc biệt khi ta **chưa biết hết** các cách sẽ truy vấn: vì join nằm ở tầng database chứ ở mã ứng dụng, thêm một cách cắt dữ liệu mới không đòi đổi cách lưu. Đó thường là lý do quyết định với một hệ thống nghiệp vụ sẽ sống nhiều năm. Một điểm tôi luôn làm rõ vì nó bị hiểu sai nhiều nhất: mô hình tài liệu không phải \"không có schema\" mà là **schema-on-read** — schema vẫn tồn tại, nó chỉ chuyển từ database sang mã ứng dụng, và hệ quả là mã phải xử lý được **mọi** phiên bản hình dạng dữ liệu từng được ghi. Với một hệ thống sống lâu thì đó là một khoản nợ tích luỹ, không phải một sự tự do miễn phí. Mô hình đồ thị tôi chọn khi chính các quan hệ là dữ liệu quan trọng, có nhiều **loại** quan hệ khác nhau, và truy vấn cần đi qua số bước không biết trước — hai mô hình kia diễn đạt được nhưng mỗi bước thêm là một join nữa, nên chúng hỏng dần theo độ sâu.",
    redFlags: [
      "Chọn tài liệu vì \"linh hoạt, không cần schema\"",
      "Không kiểm trước các chiều truy vấn không phải chiều lồng",
      "Chọn đồ thị cho dữ liệu chỉ có một loại quan hệ và độ sâu cố định",
      "Bỏ qua việc schema-on-read đẩy nghĩa vụ sang mã ứng dụng",
    ],
    probes: [
      "Cho một truy vấn làm mô hình tài liệu hỏng trong ví dụ đơn hàng",
      "Schema-on-read tích luỹ nợ gì sau ba năm?",
      "Khi nào bạn dùng cả hai mô hình trong cùng hệ thống?",
    ],
    refs: ["ddia-03", "ddia-04"],
  },
  {
    id: "ddia-iq08",
    field: "ddia",
    topic: "dd-model",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một hệ thống dùng mô hình tài liệu lưu \"khách hàng cùng toàn bộ đơn hàng của họ\" trong một tài liệu. Nó chạy tốt ba năm, rồi một khách hàng doanh nghiệp đạt 180.000 đơn và mọi thao tác trên tài khoản đó bắt đầu mất 9–14 giây. Thêm một đơn cho khách đó cũng mất như vậy.",
      scale: "230.000 khách hàng; trung vị 12 đơn. 40 khách vượt 10.000 đơn. Kích thước tài liệu lớn nhất là 340MB.",
      constraints: "Không đổi được sang database khác trong hai quý tới. Không có cửa sổ ngừng dịch vụ — phải di trú trực tuyến. Phải giữ được truy vấn \"toàn bộ đơn của một khách\" vì nó là màn hình chính.",
      },
    question: "Mô hình này sai ở đâu về nguyên tắc, và vì sao nó chỉ hỏng sau ba năm? Nêu đường di trú trực tuyến.",
    mustCover: [
      "Lỗi nguyên tắc: một tài liệu gom một tập **tăng không giới hạn** — số đơn của một khách không có trần",
      "Mô hình tài liệu tốt khi khối được đọc nguyên vẹn và có **kích thước bị chặn**; ở đây điều kiện thứ hai bị vi phạm",
      "Thêm một đơn cũng chậm vì nhiều hệ thống tài liệu phải **đọc và viết lại cả tài liệu**, nên chi phí ghi tỉ lệ với kích thước",
      "Nó chỉ hỏng sau ba năm vì trung vị chỉ 12 đơn — **phân bố lệch** khiến vấn đề vô hình cho 99,98% khách",
      "Cách sửa: tách đơn hàng thành **tập hợp riêng**, tham chiếu tới khách — tức chuyển quan hệ một-nhiều ra ngoài tài liệu",
      "Giữ được màn hình chính bằng cách truy vấn đơn theo khoá khách, có **phân trang** — điều mà tài liệu 340MB vốn không cho",
      "Di trú trực tuyến: ghi **cả hai** nơi, backfill theo lô, chuyển đọc sang nơi mới, rồi mới bỏ dữ liệu cũ",
      "Backfill phải bắt đầu từ **các tài liệu lớn nhất**, vì chúng vừa là nguồn sự cố vừa là phần rủi ro nhất",
    ],
    model: "Lỗi nguyên tắc rất gọn: tài liệu này gom một tập tăng không giới hạn. Mô hình tài liệu phát huy khi một khối được đọc gần như luôn nguyên vẹn **và** kích thước khối bị chặn — điều kiện thứ hai bị vi phạm ngay từ ngày đầu, chỉ là chưa ai thấy. Số đơn của một khách không có trần, nên kích thước tài liệu là một hàm tăng theo thời gian. Việc thêm một đơn cũng mất 9 giây là dấu hiệu xác nhận: nhiều hệ thống tài liệu phải đọc và viết lại cả tài liệu khi cập nhật, nên chi phí của một thao tác nhỏ tỉ lệ với kích thước cả khối — với 340MB thì con số đó là hợp lý chứ không bất thường. Câu \"vì sao chỉ hỏng sau ba năm\" có lời giải thích trong chính số liệu: trung vị là 12 đơn, và chỉ 40 trên 230.000 khách vượt 10.000 đơn. Phân bố lệch tới mức đó khiến lỗi thiết kế vô hình với 99,98% tài khoản, nên mọi phép đo tổng hợp và mọi kiểm thử trên dữ liệu trung bình đều xanh — đây là cùng một cơ chế che giấu mà ta gặp khi đo hiệu năng bằng giá trị trung bình. Cách sửa là chuyển quan hệ một-nhiều ra khỏi tài liệu: đơn hàng thành một tập hợp riêng, mỗi đơn tham chiếu tới khách. Khi đó kích thước tài liệu khách trở lại bị chặn, và thao tác thêm một đơn là ghi một bản ghi nhỏ độc lập với việc khách đó có 12 hay 180.000 đơn. Màn hình chính vẫn giữ được — truy vấn đơn theo khoá khách, và giờ **có phân trang**, điều mà một tài liệu 340MB vốn không cho phép; nên đây không chỉ là sửa hiệu năng mà còn mở ra một hành vi đúng hơn. Về di trú trực tuyến trong ràng buộc không có cửa sổ ngừng: ghi cả hai nơi trước, tức mỗi đơn mới được ghi vào cả tài liệu cũ lẫn tập hợp mới; backfill dữ liệu cũ theo lô ở nền, và tôi bắt đầu từ những tài liệu **lớn nhất** vì chúng vừa là nguồn sự cố hiện tại vừa là phần rủi ro nhất cần xác nhận sớm; sau khi backfill xong thì chuyển đường đọc sang nơi mới, giữ một khoảng để so sánh hai nguồn; cuối cùng mới ngừng ghi vào tài liệu cũ và dọn dữ liệu. Bốn mươi khách lớn có thể được ưu tiên xử lý trước để giảm đau ngay, rồi phần còn lại chạy nền.",
    redFlags: [
      "Đề nghị đổi database — ràng buộc đã cấm, và bài toán là mô hình chứ không phải công nghệ",
      "Chỉ thêm index mà giữ nguyên tài liệu khổng lồ",
      "Đi tối ưu truy vấn trong khi chi phí ghi cũng đã tỉ lệ với kích thước",
      "Backfill theo thứ tự ngẫu nhiên hoặc theo id, bỏ qua việc tài liệu lớn là phần rủi ro nhất",
      "Kết luận mô hình tài liệu là lựa chọn sai ngay từ đầu, thay vì nêu đúng điều kiện bị vi phạm",
    ],
    probes: [
      "Vì sao trung vị 12 đơn lại che được lỗi này suốt ba năm?",
      "Bạn so sánh hai nguồn dữ liệu trong giai đoạn ghi cả hai bằng cách nào?",
      "Sau khi tách, màn hình chính đổi hành vi ra sao?",
    ],
    refs: ["ddia-03", "ddia-07"],
  },

  // ===== dd-replication — Replication và sharding (ddia-iq09–ddia-iq12) =====
  {
    id: "ddia-iq09",
    field: "ddia",
    topic: "dd-replication",
    level: 1,
    minutes: 6,
    question: "Kể các bảo đảm nhất quán \"yếu hơn nhất quán mạnh nhưng mạnh hơn nhất quán sau cùng\". Mỗi cái ngăn hiện tượng bất thường nào?",
    mustCover: [
      "**Read-your-writes**: người dùng luôn thấy cập nhật mà **chính họ** vừa gửi; nó không hứa gì về người khác",
      "Nó ngăn hiện tượng: gửi xong một bản cập nhật, tải lại trang và thấy dữ liệu như chưa từng gửi",
      "**Monotonic reads**: nhiều lần đọc liên tiếp sẽ không thấy **thời gian đi ngược**",
      "Tức không đọc được dữ liệu cũ hơn sau khi trước đó đã đọc được dữ liệu mới hơn",
      "Cách đạt read-your-writes: đọc thứ người dùng **có thể đã sửa** từ leader, phần còn lại từ follower",
      "Cách đạt monotonic reads: cho mỗi người dùng luôn đọc từ **cùng một replica**, chọn theo hash id thay vì ngẫu nhiên",
      "Và hệ quả vận hành: nếu replica đó hỏng thì phải định tuyến lại, nên bảo đảm này đánh đổi với tính sẵn sàng",
    ],
    model: "Hai bảo đảm sách nêu tên nằm giữa hai đầu: yếu hơn nhất quán mạnh, mạnh hơn nhất quán sau cùng. Thứ nhất là read-your-writes, còn gọi là nhất quán đọc-sau-ghi: nó bảo đảm nếu người dùng tải lại trang thì họ luôn thấy mọi cập nhật mà **chính họ** đã gửi. Điều quan trọng phải nói kèm là nó **không** hứa gì về người dùng khác — cập nhật của người khác có thể chưa hiện ra. Hiện tượng bất thường nó ngăn rất cụ thể và rất dễ gặp: người dùng sửa hồ sơ, bấm lưu, trang tải lại đọc từ một follower chưa kịp cập nhật, và họ thấy dữ liệu cũ — họ sẽ kết luận việc lưu đã thất bại. Cách đạt nó mà sách nêu là đọc từ leader những thứ người dùng **có thể đã sửa**: chẳng hạn luôn đọc hồ sơ của chính người dùng từ leader, còn hồ sơ người khác từ follower. Nếu hầu hết dữ liệu đều có thể do người dùng sửa thì cách đó mất hiệu quả vì gần như mọi thứ phải đọc từ leader, và ta mất lợi ích mở rộng đường đọc; khi đó dùng tiêu chí khác — theo dõi thời điểm cập nhật cuối và trong một phút sau đó thì đọc từ leader, hoặc giám sát độ trễ replication rồi tránh những follower tụt lại quá xa. Thứ hai là monotonic reads: nó bảo đảm nếu một người dùng đọc nhiều lần liên tiếp thì họ không thấy thời gian đi ngược — không đọc được dữ liệu cũ hơn sau khi trước đó đã đọc được dữ liệu mới hơn. Hiện tượng nó ngăn là kiểu người dùng thấy một bình luận rồi tải lại thì bình luận biến mất, vì hai lần đọc rơi vào hai replica có độ trễ khác nhau. Cách đạt là cho mỗi người dùng luôn đọc từ cùng một replica, chọn theo hash của id thay vì chọn ngẫu nhiên. Và hệ quả vận hành đáng nêu: nếu replica đó hỏng thì truy vấn của người dùng phải được định tuyến lại, nên bảo đảm này có một đánh đổi thật với tính sẵn sàng.",
    redFlags: [
      "Gộp hai bảo đảm thành một, hoặc mô tả chúng như nhất quán mạnh",
      "Nói read-your-writes bảo đảm người dùng thấy cập nhật của **mọi** người",
      "Không nêu được cách hiện thực cụ thể cho từng bảo đảm",
    ],
    probes: [
      "Nếu hầu hết dữ liệu đều có thể do người dùng sửa thì bạn làm gì?",
      "Người dùng đổi thiết bị — read-your-writes còn giữ được không?",
      "Monotonic reads đánh đổi gì với tính sẵn sàng?",
    ],
    refs: ["ddia-06"],
  },
  {
    id: "ddia-iq10",
    field: "ddia",
    topic: "dd-replication",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Kiến trúc hiện tại: 1 leader + 3 follower, replication bất đồng bộ.
Tầng ứng dụng định tuyến đọc tới follower ngẫu nhiên để "phân tải".

Ba báo lỗi từ người dùng:
  (A) "Tôi đổi ảnh đại diện, tải lại trang thì vẫn ảnh cũ, F5 lần nữa mới thấy."
  (B) "Tôi thấy bình luận mới của đồng nghiệp, F5 thì nó biến mất, F5 nữa lại có."
  (C) "Tôi chuyển tiền xong, số dư vẫn như cũ, 3 giây sau mới đúng."

Độ trễ replication: p50 40ms, p99 1,2s, tối đa quan sát được 8s.`,
    },
    question: "Xếp ba báo lỗi vào các hiện tượng bất thường tương ứng, rồi nêu cách sửa cho từng cái — và nói cách nào **không** dùng được cho (C).",
    mustCover: [
      "(A) và (C) đều là thiếu **read-your-writes**: người dùng không thấy cập nhật của chính mình",
      "(B) là thiếu **monotonic reads**: hai lần đọc rơi vào hai replica có độ trễ khác nhau nên thời gian đi ngược",
      "Sửa (A): đọc từ leader những dữ liệu người dùng có thể đã sửa, hoặc đọc từ leader trong một khoảng sau lần cập nhật cuối",
      "Sửa (B): cho mỗi người dùng gắn với **một** replica, chọn theo hash id — bỏ hẳn việc chọn ngẫu nhiên",
      "(C) khác về **mức độ nghiêm trọng**: số dư là dữ liệu mà đọc cũ có thể dẫn tới quyết định sai của người dùng",
      "Nên với (C), read-your-writes là **chưa đủ** — thao tác tiền phải đọc từ leader hoặc đi qua một đường nhất quán mạnh",
      "Và replication bất đồng bộ với đuôi 8s nghĩa là mọi bảo đảm dựa trên \"đợi một lúc\" đều không đáng tin",
    ],
    model: "Xếp loại thì (A) và (C) cùng là thiếu read-your-writes — người dùng không thấy cập nhật của chính mình — còn (B) là thiếu monotonic reads, vì người dùng thấy dữ liệu mới rồi lại thấy dữ liệu cũ hơn, tức thời gian đi ngược. Nguyên nhân chung nằm ở dòng \"định tuyến đọc tới follower ngẫu nhiên\": chọn ngẫu nhiên nghĩa là hai lần đọc liên tiếp của cùng một người có thể rơi vào hai replica có độ trễ khác nhau, và đó chính xác là cơ chế sinh ra (B). Sửa (A): đọc từ leader những dữ liệu mà người dùng có thể đã sửa — ảnh đại diện thuộc hồ sơ của chính họ nên quy tắc \"hồ sơ của mình đọc từ leader, hồ sơ người khác đọc từ follower\" giải quyết gọn; nếu quá nhiều dữ liệu thuộc loại có thể sửa thì dùng tiêu chí thời gian, đọc từ leader trong một khoảng sau lần cập nhật cuối của người đó. Sửa (B): bỏ hẳn việc chọn ngẫu nhiên, gắn mỗi người dùng với một replica cố định chọn theo hash id, và chấp nhận phải định tuyến lại nếu replica đó hỏng. Nhưng (C) là ca tôi muốn tách riêng, vì nó khác về mức độ nghiêm trọng chứ không chỉ khác về hiện tượng: số dư là dữ liệu mà việc đọc bản cũ có thể dẫn tới một **quyết định sai của người dùng** — họ tưởng tiền chưa chuyển nên chuyển lần nữa. Với dữ liệu như vậy thì read-your-writes là chưa đủ, vì nó chỉ bảo đảm cho chính người vừa ghi, mà giao dịch tiền còn liên quan tới những đường đọc khác và tới hệ thống khác. Nên đường đi của thao tác tiền phải đọc từ leader, hoặc đi qua một đường bảo đảm nhất quán mạnh, và kiểm tra hạn mức hay số dư trước khi cho phép thao tác tiếp phải nằm trên đường đó. Một con số trong đề bài củng cố điều này: độ trễ replication có đuôi tới 8 giây, nên mọi giải pháp dựa trên \"đợi một lúc rồi đọc\" đều không đáng tin — và dùng độ trễ p50 40ms để suy luận là cách kết luận sai, đúng như việc dùng trung bình để nói về hiệu năng.",
    redFlags: [
      "Sửa cả ba bằng một cách duy nhất, không tách (C)",
      "Dựa vào độ trễ p50 40ms để kết luận \"đợi 100ms là đủ\"",
      "Giữ định tuyến ngẫu nhiên và chỉ thêm retry ở tầng giao diện",
      "Chuyển mọi lần đọc sang leader — mất hết lợi ích mở rộng đường đọc mà không cần thiết",
    ],
    probes: [
      "Vì sao đuôi 8 giây làm mọi giải pháp dựa trên chờ trở nên không đáng tin?",
      "Với (C), đọc từ leader có đủ trong mọi trường hợp không?",
      "Bạn phát hiện một follower tụt lại quá xa bằng cách nào?",
    ],
    refs: ["ddia-06"],
  },
  {
    id: "ddia-iq11",
    field: "ddia",
    topic: "dd-replication",
    level: 3,
    minutes: 11,
    question: "Bạn chọn mô hình replication cho một hệ thống. Một leader, nhiều leader, hay không leader?",
    tradeoffs: [
      {
        option: "Một leader",
        when: "Mặc định, và đúng cho phần lớn hệ thống. Mọi lần ghi đi qua một chỗ nên **không có xung đột ghi** — đó là lợi ích lớn nhất và nó khiến mọi thứ khác đơn giản hơn. Đổi lại: leader là điểm tắc của đường ghi, và việc chuyển leader khi nó hỏng là một quy trình khó làm đúng.",
      },
      {
        option: "Nhiều leader",
        when: "Khi cần ghi được ở **nhiều vùng địa lý** với độ trễ thấp, hoặc cần hoạt động khi mất kết nối giữa các vùng. Đổi lại là phải **giải quyết xung đột ghi**, và đó là bài toán không có lời giải tổng quát — mỗi ứng dụng phải tự định nghĩa quy tắc.",
      },
      {
        option: "Không leader",
        when: "Khi ưu tiên tính sẵn sàng cho cả đọc và ghi, chịu được mất node mà không cần chuyển leader. Đổi lại là ứng dụng phải hiểu **số bản đọc và ghi cần thiết**, và phải xử lý các phiên bản đồng thời.",
      },
    ],
    mustCover: [
      "Lợi ích cốt lõi của một leader là **không có xung đột ghi** — mọi thay đổi được sắp thứ tự tại một chỗ",
      "Chi phí của nó là chuyển leader khi hỏng: một quy trình nhiều bước và nhiều cách sai",
      "Nhiều leader mua độ trễ ghi thấp theo vùng bằng cách **nhận** xung đột vào hệ thống",
      "Xung đột ghi **không có** lời giải tổng quát: quy tắc hoà giải phải do ứng dụng định nghĩa",
      "Không leader dịch bài toán sang tầng ứng dụng: nó phải hiểu số bản cần đọc và ghi để có bảo đảm mong muốn",
      "Mọi mô hình đều **bất đồng bộ được hoặc đồng bộ được**, và lựa chọn đó độc lập với số leader",
      "Replication đồng bộ mua tính bền vững bằng cách để một node chậm chặn **cả đường ghi**",
    ],
    model: "Tôi bắt đầu từ một leader và chỉ rời khỏi nó khi có lý do cụ thể, vì lợi ích cốt lõi của nó lớn hơn vẻ ngoài: mọi lần ghi đi qua một chỗ nên các thay đổi được sắp thứ tự tại đó, và **không có xung đột ghi** nào phát sinh. Việc không có xung đột làm đơn giản hoá gần như mọi thứ phía trên — không cần quy tắc hoà giải, không cần lưu nhiều phiên bản, không cần giải thích cho người dùng vì sao dữ liệu của họ bị ghi đè. Cái giá là hai thứ: leader là điểm tắc của đường ghi, và khi leader hỏng thì phải chuyển leader — một quy trình nhiều bước với rất nhiều cách làm sai, gồm cả nguy cơ hai node cùng tưởng mình là leader, và nguy cơ mất những lần ghi mà leader cũ đã nhận nhưng chưa kịp lan truyền. Tôi chuyển sang nhiều leader khi có một nhu cầu địa lý thật: cần ghi với độ trễ thấp ở nhiều vùng, hoặc cần mỗi vùng hoạt động được khi mất kết nối giữa các vùng. Nhưng phải nói rõ ta đang mua gì bằng gì: ta mua độ trễ ghi thấp bằng cách **nhận xung đột ghi vào hệ thống**, và xung đột ghi không có lời giải tổng quát — không có quy tắc nào đúng cho mọi ứng dụng, nên chính ứng dụng phải định nghĩa hoà giải, và với nhiều nghiệp vụ thì câu trả lời trung thực là \"không thể hoà giải tự động, phải hỏi người dùng\". Không leader thì dịch bài toán sang một chỗ khác: ứng dụng phải hiểu cần đọc và ghi bao nhiêu bản để có bảo đảm mong muốn, và phải xử lý được trường hợp nhiều phiên bản tồn tại đồng thời. Cuối cùng, một điều tôi luôn tách ra vì nó hay bị gộp: lựa chọn **đồng bộ hay bất đồng bộ** là một trục độc lập với số leader. Replication đồng bộ mua tính bền vững bằng cách để một replica chậm chặn cả đường ghi, nên trong thực tế phần lớn hệ thống chọn đồng bộ với một replica và bất đồng bộ với phần còn lại.",
    redFlags: [
      "Chọn nhiều leader mà không có nhu cầu địa lý, chỉ để \"ghi được ở nhiều nơi\"",
      "Nói xung đột ghi có thể giải tự động bằng một quy tắc chung",
      "Gộp lựa chọn số leader với lựa chọn đồng bộ hay bất đồng bộ",
      "Bỏ qua độ khó của việc chuyển leader khi chọn một leader",
    ],
    probes: [
      "Kể những cách sai khi chuyển leader",
      "Cho một xung đột ghi mà không quy tắc tự động nào đúng",
      "Vì sao đồng bộ với một replica là thoả hiệp phổ biến?",
    ],
    refs: ["ddia-06", "ddia-07"],
  },
  {
    id: "ddia-iq12",
    field: "ddia",
    topic: "dd-replication",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Sau một sự cố mạng 90 giây giữa hai trung tâm dữ liệu, hệ thống nhiều leader hoạt động lại nhưng 4.100 bản ghi khách hàng có dữ liệu \"trộn lẫn\": địa chỉ của phiên bản vùng A ghép với số điện thoại của phiên bản vùng B. Không có log xung đột nào vì hệ thống cấu hình hoà giải theo \"bản ghi có timestamp lớn hơn thắng\", áp dụng **theo từng trường**.",
      scale: "2,4 triệu bản ghi khách hàng. Hai vùng, mỗi vùng nhận ghi từ người dùng khu vực đó. Đồng hồ hai vùng lệch nhau tối đa 220ms theo đo được.",
      constraints: "Không bỏ được mô hình nhiều leader — yêu cầu là mỗi vùng phải ghi được khi mất kết nối. Không có bản sao trạng thái trước sự cố ở mức từng trường. Phải quyết định cách hoà giải dùng được về lâu dài.",
      },
    question: "Hoà giải theo timestamp từng trường sai ở mấy chỗ? Nêu chẩn đoán và cách hoà giải bạn đề xuất.",
    mustCover: [
      "Sai thứ nhất: hoà giải **theo từng trường** phá vỡ tính toàn vẹn của bản ghi — kết quả là một trạng thái **chưa từng tồn tại** ở bất kỳ vùng nào",
      "Sai thứ hai: dựa vào **timestamp của đồng hồ tường** trong hệ phân tán, mà đồng hồ không đáng tin — ở đây lệch tới 220ms",
      "Với lệch 220ms, một lần ghi xảy ra **sau** có thể mang timestamp **nhỏ hơn**, nên \"bản mới thắng\" chọn sai bản",
      "Sai thứ ba: quy tắc \"bản lớn hơn thắng\" luôn **âm thầm bỏ** một lần ghi, nên không có log xung đột là hệ quả thiết kế chứ không phải may mắn",
      "Hệ quả: mất dữ liệu im lặng, và không phát hiện được vì không ai được thông báo",
      "Cách sửa tối thiểu: hoà giải ở mức **cả bản ghi**, không theo trường — để kết quả luôn là một trạng thái từng tồn tại",
      "Cách sửa đúng hơn: **lưu cả hai phiên bản** khi xung đột và để ứng dụng hoặc người dùng quyết, vì xung đột ghi không có lời giải tổng quát",
      "Và thay đồng hồ tường bằng một cơ chế **sắp thứ tự nhân quả** thay vì thời gian vật lý",
    ],
    model: "Cấu hình này sai ở ba chỗ độc lập, và chúng cộng lại giải thích trọn vẹn triệu chứng. Sai thứ nhất, và là thứ tạo ra dữ liệu \"trộn lẫn\": hoà giải theo **từng trường**. Khi lấy địa chỉ của phiên bản A ghép với số điện thoại của phiên bản B, kết quả là một trạng thái chưa từng tồn tại ở bất kỳ vùng nào — không ai từng nhập bản ghi đó. Với dữ liệu có ràng buộc giữa các trường thì đó còn tệ hơn mất dữ liệu, vì nó tạo ra dữ liệu sai trông hợp lệ. Sai thứ hai là dựa vào timestamp của đồng hồ tường để quyết định cái nào mới hơn. Trong hệ phân tán thì đồng hồ không đáng tin, và đề bài đã cho con số: hai vùng lệch tới 220ms. Nghĩa là một lần ghi thực sự xảy ra **sau** hoàn toàn có thể mang timestamp nhỏ hơn, nên quy tắc \"bản mới thắng\" chọn sai bản một cách hệ thống chứ không phải ngẫu nhiên — và trong 90 giây mất kết nối thì có rất nhiều cặp ghi nằm trong cửa sổ 220ms đó. Sai thứ ba giải thích vì sao không có log xung đột: quy tắc \"bản lớn hơn thắng\" **luôn** chọn một bản và bỏ bản kia, nên theo định nghĩa nó không bao giờ báo xung đột. Việc log sạch không phải may mắn mà là hệ quả trực tiếp của thiết kế: hệ thống đang mất dữ liệu một cách im lặng và không có cơ chế nào để ai đó biết. Về cách sửa, bước tối thiểu và làm được ngay là chuyển hoà giải lên mức **cả bản ghi**: dù vẫn phải chọn một bên, kết quả luôn là một trạng thái từng thực sự tồn tại, nên ta không tạo ra dữ liệu bịa. Nhưng cách đúng về lâu dài phải xuất phát từ một nhận định: xung đột ghi không có lời giải tổng quát, nên bất kỳ quy tắc tự động nào cũng đang thay ứng dụng ra một quyết định nghiệp vụ. Vì vậy tôi đề xuất **lưu cả hai phiên bản** khi phát hiện xung đột, đánh dấu bản ghi cần hoà giải, rồi để ứng dụng quyết theo quy tắc nghiệp vụ hoặc hỏi người dùng — với dữ liệu khách hàng thì hỏi người dùng thường là câu trả lời trung thực nhất. Đi kèm là thay đồng hồ tường bằng một cơ chế sắp thứ tự theo **nhân quả** thay vì theo thời gian vật lý, để việc phát hiện xung đột không còn phụ thuộc vào việc hai vùng có đồng bộ đồng hồ hay không. Riêng 4.100 bản ghi đã trộn lẫn thì cần một đường riêng: chúng không khôi phục được tự động vì không có bản sao ở mức từng trường, nên phải đánh dấu và đưa vào quy trình xác nhận với khách hàng.",
    redFlags: [
      "Đề nghị đồng bộ đồng hồ chặt hơn làm cách sửa chính — nó giảm xác suất chứ không sửa nguyên tắc",
      "Giữ hoà giải theo từng trường và chỉ đổi tiêu chí chọn",
      "Bỏ mô hình nhiều leader — ràng buộc đã cấm",
      "Coi việc không có log xung đột là dấu hiệu hệ thống hoạt động tốt",
      "Tuyên bố sẽ khôi phục tự động 4.100 bản ghi khi không có dữ liệu để khôi phục",
    ],
    probes: [
      "Vì sao đồng bộ đồng hồ chặt hơn không sửa được nguyên tắc?",
      "Sắp thứ tự theo nhân quả cho bạn gì mà timestamp không cho?",
      "Với dữ liệu khách hàng, quy tắc hoà giải tự động nào bạn thấy chấp nhận được?",
    ],
    refs: ["ddia-06", "ddia-09"],
  },

  // ===== dd-transaction — Transaction và mức cô lập (ddia-iq13–ddia-iq16) =====
  {
    id: "ddia-iq13",
    field: "ddia",
    topic: "dd-transaction",
    level: 1,
    minutes: 6,
    question: "Nêu những hiện tượng bất thường mà mức **snapshot isolation** vẫn cho phép. Vì sao chúng khó thấy hơn dirty read?",
    mustCover: [
      "Snapshot isolation cho mỗi transaction một **ảnh nhất quán** tại thời điểm bắt đầu, nên nó ngăn dirty read và unrepeatable read",
      "Nhưng nó vẫn cho **lost update** nếu hai transaction cùng đọc-sửa-ghi trên cùng một object",
      "Nó cũng cho **write skew**: hai transaction đọc cùng một tập, mỗi bên ghi một object khác nhau, và **kết quả ghép lại phá bất biến**",
      "Write skew khó thấy vì không có xung đột trên **cùng một dòng** — mỗi transaction ghi vào chỗ khác nhau",
      "Nó cũng cho **phantom** trong nghĩa: một transaction ra quyết định dựa trên kết quả truy vấn, còn transaction khác thêm dòng làm điều kiện đó sai",
      "Dirty read dễ thấy vì nó lộ ra dữ liệu chưa commit; write skew chỉ lộ ra khi **kiểm bất biến ở tầng nghiệp vụ**",
    ],
    model: "Snapshot isolation làm được một việc rất mạnh: mỗi transaction làm việc trên một ảnh nhất quán của dữ liệu tại thời điểm nó bắt đầu, nên nó không bao giờ đọc dữ liệu chưa commit và hai lần đọc cùng một dòng luôn cho cùng kết quả. Nhưng nó vẫn để hở hai họ hiện tượng. Thứ nhất là lost update, khi hai transaction cùng đọc một giá trị, cùng tính toán, rồi lần lượt ghi — cập nhật của bên đầu bị bên sau ghi đè. Nhiều hệ thống chặn được cái này bằng cơ chế phát hiện ghi đè hoặc bằng khoá tường minh, nên nó thường được biết tới. Thứ hai, và là thứ đáng nói hơn, là write skew. Hình dạng của nó là: hai transaction cùng đọc một tập dữ liệu, cùng kiểm một điều kiện và thấy nó thoả, rồi **mỗi bên ghi vào một object khác nhau** — nên không có xung đột trên bất kỳ dòng nào, và cả hai commit thành công. Nhưng kết quả ghép lại phá một bất biến mà không transaction nào đơn lẻ phá. Ví dụ kinh điển là lịch trực: quy tắc nói luôn phải có ít nhất một bác sĩ trực; hai bác sĩ cùng xem lịch, mỗi người thấy còn người kia trực nên xin nghỉ; hai transaction ghi vào hai dòng khác nhau, cả hai thành công, và cuối cùng không còn ai trực. Đó cũng là lý do write skew khó thấy hơn dirty read rất nhiều: dirty read lộ ra ngay khi ta đọc được dữ liệu chưa commit và dễ tái hiện, còn write skew không tạo ra bất kỳ xung đột kỹ thuật nào — nó chỉ lộ ra khi có người kiểm lại bất biến ở tầng nghiệp vụ, mà thường là rất muộn. Phantom là họ hàng gần: một transaction quyết định dựa trên kết quả một truy vấn, còn transaction khác thêm hoặc xoá dòng làm điều kiện đó không còn đúng — cũng không có dòng nào bị hai bên cùng ghi.",
    redFlags: [
      "Cho rằng snapshot isolation đã đủ cho mọi bất biến nghiệp vụ",
      "Gộp write skew với lost update",
      "Không nêu được rằng write skew không tạo xung đột trên cùng một dòng",
    ],
    probes: [
      "Cho một ví dụ write skew trong nghiệp vụ của bạn",
      "Vì sao khoá dòng không chặn được write skew?",
      "Bạn phát hiện write skew đã xảy ra bằng cách nào?",
    ],
    refs: ["ddia-08"],
  },
  {
    id: "ddia-iq14",
    field: "ddia",
    topic: "dd-transaction",
    level: 2,
    minutes: 9,
    code: {
      lang: "text",
      text: `Quy tắc nghiệp vụ: mỗi phòng họp không được có hai lịch trùng giờ.

Mã hiện tại (mức cô lập: snapshot isolation / REPEATABLE READ):

  BEGIN;
    SELECT count(*) FROM booking
     WHERE room_id = 7
       AND end_time > '10:00' AND start_time < '11:00';
    -- nếu count = 0 thì:
    INSERT INTO booking (room_id, start_time, end_time)
    VALUES (7, '10:00', '11:00');
  COMMIT;

Sự cố: hai người đặt cùng phòng cùng giờ, cả hai transaction COMMIT
thành công, và phòng có hai lịch trùng.`,
    },
    question: "Gọi tên hiện tượng, giải thích vì sao snapshot isolation không chặn được, rồi nêu ba cách sửa và chọn một.",
    mustCover: [
      "Đây là **write skew** dạng phantom: cả hai đọc thấy `count = 0` rồi mỗi bên **chèn một dòng mới**",
      "Không bên nào ghi vào dòng mà bên kia đọc — dòng đó **chưa tồn tại** lúc đọc, nên không có gì để khoá",
      "Snapshot isolation bảo đảm mỗi bên thấy ảnh nhất quán, nhưng **không** bảo đảm điều kiện còn đúng lúc commit",
      "Cách sửa 1: **ràng buộc ở tầng database** — chỉ mục loại trừ theo khoảng thời gian; database từ chối dòng thứ hai",
      "Cách sửa 2: **khoá vật hoá** — khoá một dòng đại diện cho phòng 7 trước khi kiểm, biến phantom thành xung đột dòng thật",
      "Cách sửa 3: nâng lên **serializable** và xử lý việc transaction bị abort rồi thử lại",
      "Chọn cách 1 nếu database hỗ trợ: nó đúng **bất kể** mã ứng dụng, nên không phụ thuộc kỷ luật của người viết sau này",
    ],
    model: "Hiện tượng là write skew, và ở đây nó có dạng phantom: cả hai transaction chạy cùng truy vấn đếm, cả hai thấy `count` bằng 0, rồi mỗi bên chèn một dòng mới. Lý do snapshot isolation không chặn được rất gọn: mỗi transaction chỉ ghi vào **dòng của riêng nó**, mà dòng ấy chưa tồn tại vào lúc bên kia đọc — nên không có dòng nào bị hai bên cùng chạm, không có gì để phát hiện xung đột, và không có gì để khoá. Snapshot isolation bảo đảm mỗi bên thấy một ảnh nhất quán tại thời điểm bắt đầu; nó không bảo đảm rằng điều kiện ta kiểm trên ảnh đó vẫn còn đúng lúc commit. Ba cách sửa. Cách thứ nhất là đẩy bất biến xuống tầng database dưới dạng một ràng buộc — với bài toán khoảng thời gian thì đó là một chỉ mục loại trừ trên `room_id` cùng khoảng `[start_time, end_time)`; khi đó database từ chối dòng thứ hai và ứng dụng nhận lỗi ràng buộc. Cách thứ hai là khoá vật hoá: tạo trước một dòng đại diện cho mỗi phòng, và transaction phải khoá dòng đó trước khi kiểm — cách này biến một xung đột phantom thành một xung đột trên dòng thật, thứ mà database biết cách xử lý. Cách thứ ba là nâng mức cô lập lên serializable, để database tự phát hiện chuỗi thao tác không tuần tự hoá được rồi abort một bên; đổi lại ứng dụng phải xử lý việc bị abort và thử lại, và thông lượng giảm khi tranh chấp cao. Tôi chọn cách thứ nhất nếu database hỗ trợ, vì nó có một tính chất mà hai cách kia không có: bất biến được thực thi **bất kể mã ứng dụng viết thế nào**. Hai cách còn lại phụ thuộc kỷ luật của người viết — ai đó thêm một đường tạo lịch mới mà quên khoá, hoặc quên xử lý abort, là bất biến lại hở. Còn khi database không hỗ trợ ràng buộc kiểu này thì tôi dùng khoá vật hoá và ghi rõ nó vào tài liệu của bảng, vì nó là một quy ước bắt buộc chứ không phải một chi tiết cài đặt.",
    redFlags: [
      "Đổi `count(*)` thành `SELECT ... FOR UPDATE` — không khoá được dòng chưa tồn tại",
      "Nghĩ rằng nâng lên `REPEATABLE READ` đã giải quyết, trong khi đó chính là mức đang chạy",
      "Kiểm trùng lịch ở tầng ứng dụng trước khi mở transaction",
      "Chọn serializable mà không nói tới việc phải xử lý abort và thử lại",
    ],
    probes: [
      "Vì sao `FOR UPDATE` không giúp ở đây?",
      "Khoá vật hoá có nhược điểm gì so với ràng buộc database?",
      "Ứng dụng phải xử lý gì nếu bạn chọn serializable?",
    ],
    refs: ["ddia-08"],
  },
  {
    id: "ddia-iq15",
    field: "ddia",
    topic: "dd-transaction",
    level: 3,
    minutes: 11,
    question: "Bạn cần bảo vệ một bất biến nghiệp vụ trong hệ thống có ghi đồng thời. Chọn mức cô lập nào, và bảo vệ ở tầng nào?",
    tradeoffs: [
      {
        option: "Ràng buộc ở tầng **database**",
        when: "Khi bất biến diễn đạt được bằng ràng buộc — duy nhất, khoá ngoại, kiểm giá trị, loại trừ khoảng. Mạnh nhất vì nó đúng **bất kể** mã ứng dụng, và nó vẫn đúng khi có đường ghi mới mà ta chưa biết.",
      },
      {
        option: "**Serializable** cộng thử lại",
        when: "Khi bất biến trải trên nhiều bảng hoặc cần logic phức tạp không diễn đạt được bằng ràng buộc. Database lo phần khó; ứng dụng chỉ cần xử lý abort. Đổi lại là thông lượng giảm khi tranh chấp cao.",
      },
      {
        option: "Khoá tường minh ở mức cô lập thấp hơn",
        when: "Khi serializable quá đắt cho toàn bộ tải nhưng chỉ vài đường ghi cần bảo vệ. Kiểm soát được phạm vi trả giá. Rủi ro: phụ thuộc kỷ luật — một đường ghi mới quên khoá là bất biến hở.",
      },
    ],
    mustCover: [
      "Ưu tiên tầng **thấp nhất** có thể thực thi bất biến, vì nó không phụ thuộc mã ứng dụng",
      "Bất biến ở tầng ứng dụng chỉ đúng nếu **mọi** đường ghi đi qua đúng đoạn mã đó — một giả định yếu dần theo thời gian",
      "Serializable không miễn phí: nó đổi thông lượng và buộc ứng dụng **xử lý abort**",
      "Thao tác thử lại phải **idempotent**, nếu không việc thử lại tự tạo ra lỗi mới",
      "Không được dùng mức cô lập thấp hơn rồi \"kiểm trước khi ghi\" ở tầng ứng dụng — đó chính là hình dạng sinh ra write skew",
      "Phải liệt kê **mọi** đường ghi vào dữ liệu đó, kể cả job batch và script vận hành",
    ],
    model: "Nguyên tắc của tôi là bảo vệ bất biến ở tầng thấp nhất có thể thực thi được nó, và lý do rất thực dụng: một bất biến ở tầng ứng dụng chỉ đúng nếu **mọi** đường ghi đều đi qua đúng đoạn mã ấy — mà giả định đó yếu dần theo thời gian. Sau hai năm sẽ có một job batch, một script vận hành, một endpoint mới do đội khác viết, và mỗi cái là một cơ hội để bất biến hở. Ràng buộc ở tầng database thì đúng bất kể ai ghi bằng đường nào, kể cả khi có người sửa dữ liệu bằng tay. Nên bước đầu tiên tôi làm không phải chọn mức cô lập mà là hỏi: bất biến này diễn đạt được bằng ràng buộc không? Duy nhất, khoá ngoại, kiểm giá trị, loại trừ khoảng — nhiều bất biến tưởng phức tạp lại vừa khít một trong số đó. Khi bất biến trải trên nhiều bảng hoặc cần logic mà ràng buộc không diễn đạt được, tôi chuyển sang serializable và chấp nhận cái giá: thông lượng giảm khi tranh chấp cao, và ứng dụng phải xử lý việc transaction bị abort. Điểm phải nói kèm là thao tác thử lại phải idempotent — nếu nó gửi một email hay gọi một API bên ngoài thì thử lại tự tạo ra lỗi mới, nên phần tác dụng phụ phải nằm ngoài transaction hoặc có khoá idempotent. Khoá tường minh ở mức cô lập thấp hơn là lựa chọn khi serializable quá đắt cho toàn bộ tải mà chỉ vài đường ghi cần bảo vệ; nó cho ta kiểm soát chỗ trả giá, nhưng nó cũng quay lại phụ thuộc kỷ luật, nên tôi luôn ghi nó thành một quy ước bắt buộc trong tài liệu của bảng chứ không để nó là chi tiết cài đặt của một service. Và điều tôi tuyệt đối không làm: dùng mức cô lập thấp rồi \"kiểm trước khi ghi\" ở tầng ứng dụng, vì đó chính xác là hình dạng sinh ra write skew — cả hai bên kiểm thấy ổn, cả hai ghi, và bất biến vỡ mà không có xung đột nào. Bước cuối trong mọi trường hợp là liệt kê mọi đường ghi vào dữ liệu đó, gồm cả job batch và script vận hành, vì một bất biến chỉ mạnh bằng đường ghi yếu nhất.",
    redFlags: [
      "Kiểm trước khi ghi ở tầng ứng dụng với mức cô lập thấp",
      "Chọn serializable mà không nói tới abort và tính idempotent của thử lại",
      "Không liệt kê job batch và script vận hành như những đường ghi",
      "Cho rằng ràng buộc database luôn diễn đạt được mọi bất biến",
    ],
    probes: [
      "Bất biến nào trong nghiệp vụ của bạn không diễn đạt được bằng ràng buộc?",
      "Thao tác thử lại có tác dụng phụ thì bạn làm gì?",
      "Bạn tìm hết các đường ghi vào một bảng bằng cách nào?",
    ],
    refs: ["ddia-08", "ddia-10"],
  },
  {
    id: "ddia-iq16",
    field: "ddia",
    topic: "dd-transaction",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một hệ thống đặt vé phát hiện 380 vé bị bán vượt số ghế trong ba tháng. Mã có kiểm số ghế còn trống trước khi ghi, chạy ở mức cô lập mặc định của database. Không có lỗi nào trong log, và bộ kiểm thử có một bài kiểm đúng tình huống này — bài đó luôn xanh.",
      scale: "12.000 lượt đặt mỗi ngày. Bán vượt chỉ xảy ra với những suất chiếu **gần hết ghế**, chiếm khoảng 3% số suất. 380 vé đã phải hoàn tiền kèm bồi thường.",
      constraints: "Không nâng được mức cô lập toàn cục — một báo cáo nặng đang dựa vào mức hiện tại để không bị abort. Phải giải thích được vì sao bài kiểm luôn xanh. Phải chặn được, không chỉ giảm.",
      },
    question: "Một bài kiểm thử đúng tình huống mà luôn xanh — nó thiếu điều kiện gì? Rồi chặn 380 vé vượt số ghế mà không nâng mức cô lập toàn cục.",
    mustCover: [
      "Hiện tượng là **write skew**: hai transaction cùng đọc số ghế còn trống, cùng thấy đủ, rồi mỗi bên ghi một dòng vé mới",
      "Bài kiểm luôn xanh vì nó gần như chắc chắn chạy **tuần tự** — hai thao tác không thật sự đồng thời",
      "Muốn bài kiểm bắt được thì phải ép **hai transaction chồng lấn thật**, và kiểm bất biến **sau khi cả hai commit**",
      "Việc chỉ xảy ra với suất **gần hết ghế** là bằng chứng khớp: cửa sổ nguy hiểm chỉ mở khi ranh giới bị chạm",
      "3% suất cộng tần suất cao giải thích 380 vé trong ba tháng — con số suy ra được, không phải nhiễu",
      "Chặn mà không nâng mức cô lập toàn cục: đặt **ràng buộc hoặc khoá** chỉ trên đường đặt vé",
      "Cụ thể: khoá vật hoá dòng suất chiếu trước khi kiểm, hoặc ràng buộc đếm ở tầng database",
      "Serializable **chỉ cho những transaction đặt vé**, để báo cáo nặng giữ mức hiện tại",
    ],
    model: "Hiện tượng là write skew: hai transaction cùng đọc số ghế còn trống, cùng thấy đủ, rồi mỗi bên chèn một dòng vé mới. Không bên nào ghi vào dòng mà bên kia đọc, nên ở mức cô lập mặc định không có xung đột nào để database phát hiện, và cả hai commit thành công — đó cũng là lý do log sạch: theo góc nhìn của hệ thống thì không có gì sai xảy ra. Phần câu hỏi về bài kiểm là phần tôi thấy quan trọng nhất, vì nó giải thích làm sao lỗi sống được ba tháng dù có người đã nghĩ tới nó. Một bài kiểm viết theo lối thông thường sẽ chạy hai thao tác lần lượt, hoặc chạy chúng trên hai luồng nhưng không ép chúng chồng lấn ở đúng khoảng giữa lúc đọc và lúc ghi. Chạy tuần tự thì bất biến luôn đúng, nên bài kiểm luôn xanh — nó đang kiểm rằng logic đúng khi không có đồng thời, mà đó không phải điều cần kiểm. Muốn bắt được thì bài kiểm phải ép hai transaction chồng lấn thật: mở cả hai, cho cả hai đọc, rồi mới cho cả hai ghi và commit, và kiểm bất biến **sau khi cả hai đã commit**. Chi tiết \"chỉ xảy ra với suất gần hết ghế\" cũng là bằng chứng khớp chứ không phải trùng hợp: cửa sổ nguy hiểm chỉ mở khi hai lượt đặt đồng thời cùng chạm vào ranh giới số ghế, và với 3% suất cộng 12.000 lượt mỗi ngày thì 380 vé trong ba tháng là con số suy ra được. Về cách chặn trong ràng buộc không nâng mức cô lập toàn cục: ràng buộc đó không cản gì cả, vì cái tôi cần là bảo vệ **một đường ghi**, không phải toàn hệ thống. Có ba cách và tôi sẽ làm theo thứ tự ưu tiên. Tốt nhất là đẩy bất biến xuống tầng database dưới dạng ràng buộc, để nó đúng bất kể mã nào ghi. Nếu không diễn đạt được thì dùng khoá vật hoá: khoá dòng của suất chiếu trước khi đếm ghế, biến xung đột phantom thành xung đột dòng thật mà database biết xử lý — và vì khoá chỉ trên đường đặt vé, báo cáo nặng không bị ảnh hưởng. Phương án thứ ba là đặt mức serializable **chỉ cho những transaction đặt vé**, giữ mức hiện tại cho phần còn lại, cộng xử lý abort và thử lại. Cuối cùng, tôi sẽ viết lại bài kiểm theo cách ép chồng lấn, vì nếu không thì lần sau ta lại có một bài kiểm xanh cho một lỗi đang chạy.",
    redFlags: [
      "Kết luận cần nâng mức cô lập toàn cục — ràng buộc đã cấm và cũng không cần",
      "Tin bài kiểm xanh nghĩa là logic đúng",
      "Thêm kiểm số ghế lần thứ hai ngay trước khi ghi — thu hẹp cửa sổ chứ không đóng nó",
      "Coi 380 trên tổng số lượt là tỉ lệ chấp nhận được",
      "Sửa mã nhưng giữ nguyên bài kiểm không có khả năng bắt lỗi",
    ],
    probes: [
      "Viết ra cấu trúc của một bài kiểm ép được hai transaction chồng lấn",
      "Vì sao kiểm thêm một lần trước khi ghi không đóng được cửa sổ?",
      "Khoá vật hoá ảnh hưởng tới báo cáo nặng không, và vì sao?",
    ],
    refs: ["ddia-08"],
  },

  // ===== dd-distributed — Rắc rối hệ phân tán và consensus (ddia-iq17–ddia-iq20) =====
  {
    id: "ddia-iq17",
    field: "ddia",
    topic: "dd-distributed",
    level: 1,
    minutes: 6,
    question: "Vì sao \"không phân biệt được một node đã chết với một node chỉ đang chậm\" lại là vấn đề gốc của hệ phân tán?",
    mustCover: [
      "Trong hệ phân tán, lỗi là **một phần**: một số node hoạt động, một số không, và không ai có cái nhìn toàn cục",
      "Mạng không đáng tin: request có thể mất, phản hồi có thể mất, cả hai có thể chỉ **chậm**",
      "Khi hết thời gian chờ, ta **không biết** node kia đã chết, hay đang chậm, hay đã xử lý xong mà phản hồi bị mất",
      "Nên timeout là một **phỏng đoán**, không phải một phát hiện — và mọi quyết định dựa trên nó có thể sai",
      "Hệ quả trực tiếp: nếu ta coi node chậm là đã chết rồi cho node khác thay, có thể có **hai** node cùng tưởng mình phụ trách",
      "Đồng hồ cũng không đáng tin, nên không thể dùng thời gian vật lý để phân định ai đúng",
      "Vì vậy hệ phân tán cần **consensus** — một cách để nhiều node đồng ý về một sự thật duy nhất",
    ],
    model: "Gốc rễ nằm ở chỗ trong hệ phân tán, lỗi mang tính **một phần**: một số node hoạt động bình thường còn một số thì không, và không node nào có cái nhìn toàn cục về việc ai đang sống. Khác hẳn một hệ chạy trên một máy, nơi hoặc mọi thứ chạy hoặc mọi thứ dừng. Cộng vào đó là mạng không đáng tin: một request có thể bị mất, một phản hồi có thể bị mất, và cả hai có thể chỉ đơn giản là chậm hơn dự kiến. Hệ quả là khi hết thời gian chờ, ta rơi vào một tình trạng không thể phân định: node kia đã chết, hay nó đang chậm, hay nó đã xử lý xong và chính phản hồi bị mất trên đường về? Ba khả năng đó đòi ba cách xử lý khác nhau — thử lại, chờ thêm, hoặc tuyệt đối không thử lại — nhưng ta không có cách nào biết mình đang ở khả năng nào. Nên điều quan trọng phải nói ra là: timeout không phải một **phát hiện** mà là một **phỏng đoán**, và mọi quyết định dựa trên nó đều có thể sai. Từ đó ra hệ quả nghiêm trọng nhất: nếu ta coi một node chậm là đã chết rồi cho node khác thay thế nó, hoàn toàn có thể có hai node cùng tin mình đang phụ trách cùng một việc — và cả hai đều ghi dữ liệu. Ta cũng không thể dùng thời gian vật lý để phân định ai đúng, vì đồng hồ giữa các node cũng không đáng tin: chúng lệch nhau, chúng có thể nhảy khi đồng bộ lại, nên một timestamp lớn hơn không bảo đảm là xảy ra sau. Đây chính là lý do hệ phân tán cần consensus: một cơ chế để nhiều node đồng ý về một sự thật duy nhất — ai là leader, thứ tự các sự kiện — mà không dựa vào giả định rằng mạng đáng tin hay đồng hồ chính xác.",
    redFlags: [
      "Coi timeout là cách phát hiện node chết một cách đáng tin",
      "Nói có thể phân biệt bằng cách đặt timeout hợp lý",
      "Dùng timestamp để phân định thứ tự sự kiện giữa các node",
    ],
    probes: [
      "Ba khả năng sau một timeout đòi ba cách xử lý khác nhau — kể ra",
      "Vì sao hai node cùng tưởng mình là leader lại nguy hiểm?",
      "Consensus cho bạn gì mà timeout không cho?",
    ],
    refs: ["ddia-09", "ddia-10"],
  },
  {
    id: "ddia-iq18",
    field: "ddia",
    topic: "dd-distributed",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Một dịch vụ ghi tệp lên storage dùng chung, bảo vệ bằng khoá phân tán:

  lock = lockService.acquire("file-A", ttl = 30s)
  try {
      data = storage.read("file-A")
      newData = transform(data)
      storage.write("file-A", newData)      // (!)
  } finally {
      lock.release()
  }

Sự cố: một tệp bị ghi bởi hai client, kết quả là nội dung của client cũ
ghi đè nội dung của client mới. Log của lockService cho thấy hai lần
acquire thành công, cách nhau 31 giây.`,
    },
    question: "Khoá có TTL đã làm gì sai? Giải thích chuỗi sự kiện, rồi nêu cơ chế cần thêm.",
    mustCover: [
      "TTL nghĩa là khoá **tự hết hạn**, nên lockService cấp khoá cho client thứ hai sau 30 giây",
      "Nhưng client thứ nhất **không biết** khoá của mình đã hết — nó có thể đang bị tạm dừng dài (GC, tiết chế CPU, mạng chậm)",
      "Khi nó tỉnh lại, nó tiếp tục ghi như thể vẫn giữ khoá — hai client cùng ghi",
      "Đây là hệ quả trực tiếp của việc không phân biệt được **chậm** với **chết**: lockService đã đoán là chết",
      "Khoá tự nó **không đủ** để bảo vệ storage, vì storage không biết gì về khoá",
      "Cơ chế cần thêm: **fencing token** — một số tăng đơn điệu cấp cùng khoá, gửi kèm mọi lần ghi",
      "Storage phải **từ chối** ghi có token nhỏ hơn token lớn nhất nó đã thấy",
      "Như vậy client cũ tỉnh lại sẽ bị từ chối, và việc bảo vệ nằm ở **nơi ghi** chứ không ở nơi cấp khoá",
    ],
    model: "Chuỗi sự kiện khớp chính xác với con số 31 giây trong log. Client thứ nhất lấy khoá với TTL 30 giây, đọc tệp, rồi bị tạm dừng dài — có thể là một lần thu gom rác dài, có thể bị tiết chế CPU, có thể mạng chậm. Sau 30 giây, lockService coi khoá đã hết hạn và cấp cho client thứ hai; client này đọc, biến đổi, ghi xong. Rồi client thứ nhất tỉnh lại. Từ góc nhìn của nó, nó vẫn đang trong khối `try` và vẫn giữ khoá, nên nó ghi dữ liệu cũ của mình lên và xoá kết quả của client thứ hai. Đây là biểu hiện trực tiếp của vấn đề gốc trong hệ phân tán: lockService không phân biệt được client đang chậm với client đã chết, nên nó **đoán** là đã chết — và phỏng đoán đó sai. Điểm quan trọng phải rút ra là khoá tự nó không đủ để bảo vệ storage, vì storage không biết gì về khoá cả: nó nhận một lệnh ghi và thực hiện. Bất kỳ cơ chế nào chỉ dựa vào việc client tin rằng mình đang giữ khoá đều có lỗ hổng này, và không TTL nào đóng được — TTL dài thì thời gian phục hồi sau sự cố dài, TTL ngắn thì cửa sổ này rộng hơn. Cơ chế cần thêm là fencing token: lockService cấp cùng với khoá một số tăng đơn điệu, và client phải gửi số đó kèm mọi lần ghi. Storage ghi nhớ token lớn nhất nó từng thấy và **từ chối** mọi lần ghi mang token nhỏ hơn. Khi client thứ hai lấy khoá, nó nhận token lớn hơn và ghi thành công; khi client thứ nhất tỉnh lại và ghi với token cũ, storage từ chối. Điều làm cơ chế này đúng là nó dịch việc bảo vệ từ **nơi cấp khoá** sang **nơi ghi** — tức tới đúng chỗ mà thao tác nguy hiểm thực sự xảy ra, và tới một nơi có thể ra quyết định mà không cần biết ai đang sống ai đã chết.",
    redFlags: [
      "Tăng TTL lên 5 phút làm cách sửa — chỉ dời cửa sổ, và làm phục hồi sau sự cố chậm hơn",
      "Thêm kiểm \"khoá còn hợp lệ không\" ngay trước khi ghi — vẫn có khoảng hở giữa kiểm và ghi",
      "Kết luận lockService bị lỗi",
      "Không nhận ra storage hoàn toàn không biết về khoá",
    ],
    probes: [
      "Vì sao kiểm khoá ngay trước khi ghi vẫn không đủ?",
      "Fencing token đòi storage hỗ trợ gì?",
      "TTL dài và ngắn đánh đổi gì với nhau?",
    ],
    refs: ["ddia-09", "ddia-10"],
  },
  {
    id: "ddia-iq19",
    field: "ddia",
    topic: "dd-distributed",
    level: 3,
    minutes: 11,
    question: "Bạn cần một hệ thống chịu được mất một vùng dữ liệu. Chọn nhất quán mạnh qua consensus, hay nhất quán sau cùng?",
    tradeoffs: [
      {
        option: "Nhất quán mạnh qua consensus",
        when: "Có bất biến **không được vi phạm dù một khoảnh khắc** — số dư, tồn kho, quyền. Hệ thống **từ chối ghi** khi mất đa số, tức chọn dừng phục vụ thay vì chấp nhận dữ liệu sai. Độ trễ ghi cao hơn vì phải chờ đa số đồng ý.",
      },
      {
        option: "Nhất quán sau cùng",
        when: "Khi nghiệp vụ chịu được dữ liệu hơi cũ và ưu tiên **luôn ghi được**. Độ trễ thấp, chịu được phân vùng mạng. Cái giá là ứng dụng phải định nghĩa quy tắc hoà giải, và phải chấp nhận rằng có lúc hai bên cùng đúng theo cách của mình.",
      },
      {
        option: "Chia theo **loại dữ liệu** trong cùng hệ thống",
        when: "Câu trả lời thực tế cho phần lớn hệ thống: một số dữ liệu cần nhất quán mạnh, phần lớn thì không. Chọn một mức duy nhất cho mọi thứ là trả giá không cần thiết ở một đầu hoặc nhận rủi ro không cần thiết ở đầu kia.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **bất biến nào** không được phép vi phạm, và hậu quả nếu nó bị vi phạm",
      "Consensus đòi **đa số** đồng ý, nên khi mất đa số thì hệ thống ngừng nhận ghi — đó là lựa chọn thiết kế, không phải lỗi",
      "Nhất quán sau cùng không \"yếu hơn\" mà **dịch chi phí** sang tầng ứng dụng dưới dạng quy tắc hoà giải",
      "Với hai vùng thì \"đa số\" là khái niệm có vấn đề — mất một vùng là mất một nửa, nên thường cần **ba** vùng",
      "Phải nói được **chế độ hỏng** của mỗi lựa chọn khi mạng phân vùng, không chỉ nói hành vi lúc bình thường",
      "Lựa chọn thực tế thường là **cả hai trong cùng hệ thống**, chia theo loại dữ liệu",
      "Và phải đối chiếu với yêu cầu nghiệp vụ, không chọn theo tiếng tăm của công nghệ",
    ],
    model: "Tôi bắt đầu bằng một câu hỏi nghiệp vụ chứ không kỹ thuật: có bất biến nào không được phép vi phạm dù chỉ một khoảnh khắc, và nếu vi phạm thì hậu quả là gì. Với số dư không được âm, tồn kho không được bán vượt, hay quyền truy cập, thì câu trả lời là có, và tôi cần nhất quán mạnh qua consensus. Nhưng phải nói rõ ta đang chọn gì: consensus đòi đa số node đồng ý, nên khi mất đa số thì hệ thống **ngừng nhận ghi**. Đó không phải lỗi mà là quyết định — chọn dừng phục vụ thay vì chấp nhận dữ liệu sai. Nếu đội không chấp nhận được hành vi đó thì họ thực ra đang không muốn nhất quán mạnh, và tốt hơn là biết điều đó trước khi triển khai. Có một chi tiết về hạ tầng tôi luôn nêu ở đây vì nó hay bị bỏ qua: với **hai** vùng thì \"đa số\" là khái niệm có vấn đề, vì mất một vùng là mất đúng một nửa và không bên nào có đa số. Nên một hệ thống consensus muốn chịu được mất một vùng thường cần **ba** vùng, hoặc ít nhất một node trọng tài ở vùng thứ ba — và đó là một yêu cầu hạ tầng phải chốt trước khi chọn kiến trúc. Với phần lớn dữ liệu còn lại thì nghiệp vụ chịu được dữ liệu hơi cũ, và nhất quán sau cùng cho độ trễ thấp cùng khả năng luôn ghi được kể cả khi phân vùng. Tôi không gọi nó là yếu hơn: nó dịch chi phí sang tầng ứng dụng dưới dạng quy tắc hoà giải, và chọn nó nghĩa là cam kết định nghĩa những quy tắc đó — bỏ qua phần cam kết ấy chính là cách nhất quán sau cùng biến thành dữ liệu sai âm thầm. Vì vậy câu trả lời thực tế của tôi hầu như luôn là cả hai trong cùng hệ thống, chia theo loại dữ liệu: chọn một mức duy nhất cho mọi thứ là trả giá không cần thiết cho phần lớn dữ liệu, hoặc nhận rủi ro không cần thiết cho phần ít ỏi thật sự quan trọng. Và trong cả hai trường hợp, tôi đòi nói rõ chế độ hỏng khi mạng phân vùng, chứ không chỉ hành vi lúc mọi thứ bình thường.",
    redFlags: [
      "Chọn nhất quán mạnh cho mọi dữ liệu \"để an toàn\"",
      "Chọn nhất quán sau cùng mà không định nghĩa quy tắc hoà giải",
      "Thiết kế consensus trên hai vùng mà không nhận ra bài toán đa số",
      "Chỉ mô tả hành vi lúc bình thường, không nói chế độ hỏng khi phân vùng",
    ],
    probes: [
      "Vì sao hai vùng lại là cấu hình có vấn đề với consensus?",
      "Hệ thống của bạn làm gì khi mất đa số, và ai đã đồng ý với hành vi đó?",
      "Kể một loại dữ liệu trong hệ thống của bạn thuộc mỗi mức",
    ],
    refs: ["ddia-10", "ddia-09"],
  },
  {
    id: "ddia-iq20",
    field: "ddia",
    topic: "dd-distributed",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một cụm ba node dùng consensus để chọn leader. Sau một đợt mạng chậm 40 giây, cụm hoạt động lại nhưng phát hiện 1.900 bản ghi có hai phiên bản khác nhau được ghi trong cùng khoảng đó. Log cho thấy node A tự coi mình là leader suốt 40 giây, còn node B và C đã chọn B làm leader mới sau 15 giây.",
      scale: "Cụm xử lý 800 lần ghi mỗi giây. Ứng dụng ghi qua bất kỳ node nào và node đó chuyển tiếp tới leader. 1.900 bản ghi cần hoà giải bằng tay.",
      constraints: "Không đổi được sang một hệ thống khác. Phải giải thích được vì sao consensus \"không ngăn được\" tình huống này, vì đội đang mất niềm tin vào nó. Phải chặn lớp lỗi này, không chỉ hoà giải 1.900 bản ghi.",
      },
    question: "Consensus đã hoạt động đúng hay sai? Nêu chẩn đoán, và chỉ ra chỗ thật sự thiếu.",
    mustCover: [
      "Consensus đã hoạt động **đúng**: B và C có đa số nên chọn được B, và A không thể được chọn vì nó thiếu đa số",
      "Nhưng consensus chỉ bảo đảm **ai được chọn**; nó không tự ngăn node cũ **tin** rằng mình còn là leader",
      "Node A bị cô lập nên nó không nhận được tin về cuộc chọn mới — nó không có cách nào biết mình đã bị thay",
      "Đây lại là bài toán gốc: A không phân biệt được \"mạng chậm\" với \"tôi đã bị loại\"",
      "Chỗ thật sự thiếu là **fencing**: phần nhận ghi không kiểm nhiệm kỳ leader, nên nó nhận ghi từ cả A lẫn B",
      "Cách chặn: mỗi nhiệm kỳ leader có một **số tăng đơn điệu**, và tầng lưu trữ **từ chối** ghi từ nhiệm kỳ cũ",
      "Một lỗi thiết kế thứ hai: ứng dụng ghi qua **bất kỳ node nào** rồi chuyển tiếp, làm node bị cô lập vẫn là đường vào",
      "Đội mất niềm tin vì kỳ vọng sai: consensus giải bài toán **đồng thuận**, không giải bài toán **thực thi**",
    ],
    model: "Câu trả lời ngắn là consensus đã hoạt động đúng, và tôi sẽ nói điều đó với đội trước tiên vì niềm tin của họ đang mất vì một kỳ vọng sai. B và C có hai trên ba node, tức đa số, nên chúng chọn được B làm leader mới; A bị cô lập nên nó không bao giờ có đa số và không thể được chọn. Giao thức làm đúng đủ việc của nó. Vấn đề là phạm vi của việc đó hẹp hơn đội tưởng: consensus bảo đảm **ai được chọn**, nó không bảo đảm rằng node cũ sẽ **biết** mình đã bị thay. Và A không có cách nào biết, vì nó đang bị cô lập — thông tin về cuộc chọn mới không tới được nó. Đây lại chính là bài toán gốc của hệ phân tán dưới một hình dạng khác: từ góc nhìn của A, nó không phân biệt được \"mạng đang chậm\" với \"tôi đã bị loại khỏi cụm\", nên nó tiếp tục hành xử như leader. Vậy chỗ thật sự thiếu là **fencing**. Cần một số nhiệm kỳ tăng đơn điệu gắn với mỗi lần chọn leader: B nhận nhiệm kỳ lớn hơn A, và mọi lần ghi phải mang theo số nhiệm kỳ của người ghi. Tầng lưu trữ ghi nhớ nhiệm kỳ lớn nhất nó từng thấy và **từ chối** mọi lần ghi mang nhiệm kỳ cũ hơn. Khi đó A vẫn tưởng mình là leader và vẫn cố ghi, nhưng nó bị từ chối ở đúng chỗ thao tác nguy hiểm xảy ra — và điều đó không đòi A phải biết bất cứ điều gì. Nguyên tắc đằng sau là dịch việc thực thi từ nơi ra quyết định sang nơi thực hiện. Có một lỗi thiết kế thứ hai trong đề bài mà tôi cũng sẽ nêu: ứng dụng ghi qua bất kỳ node nào rồi để node đó chuyển tiếp tới leader. Với thiết kế ấy, một node bị cô lập vẫn là một đường vào hợp lệ cho ứng dụng, nên nó nhận ghi rồi chuyển tiếp tới chính nó — nhân số ghi sai lên. Sửa việc này bằng cách buộc client biết leader hiện tại và ghi trực tiếp, hoặc để node chỉ chuyển tiếp khi nó xác nhận được mình còn trong đa số. Và với 1.900 bản ghi đã có hai phiên bản thì không có cách khôi phục tự động: chúng phải được hoà giải theo quy tắc nghiệp vụ, và tôi sẽ ưu tiên xây báo cáo liệt kê chúng cùng cả hai phiên bản để việc hoà giải bằng tay khả thi.",
    redFlags: [
      "Kết luận consensus bị lỗi hoặc không đáng tin",
      "Đề nghị giảm thời gian phát hiện hỏng — chỉ thu hẹp cửa sổ, không đóng nó",
      "Thêm node thứ tư, làm bài toán đa số xấu hơn",
      "Bỏ qua lỗi thiết kế cho phép ghi qua bất kỳ node nào",
      "Hứa khôi phục tự động 1.900 bản ghi khi cả hai phiên bản đều là dữ liệu thật",
    ],
    probes: [
      "Vì sao giảm thời gian phát hiện hỏng không đóng được cửa sổ?",
      "Fencing cần tầng lưu trữ hỗ trợ gì?",
      "Client nên biết leader hiện tại bằng cách nào mà không tự tạo bài toán mới?",
    ],
    refs: ["ddia-10", "ddia-09"],
  },

  // ===== dd-processing — Batch và stream processing (ddia-iq21–ddia-iq24) =====
  {
    id: "ddia-iq21",
    field: "ddia",
    topic: "dd-processing",
    level: 1,
    minutes: 5,
    question: "Batch processing và stream processing khác nhau ở đâu về bản chất, và khái niệm nào của stream không tồn tại trong batch?",
    mustCover: [
      "Batch làm việc trên dữ liệu **có biên** — biết trước tập đầu vào, nên biết khi nào xong",
      "Stream làm việc trên dữ liệu **không có biên** — sự kiện đến liên tục, không có thời điểm \"xong\"",
      "Vì không có biên, stream phải đưa vào khái niệm **cửa sổ** để có thể tổng hợp",
      "Và phải phân biệt **thời gian sự kiện** với **thời gian xử lý** — hai thứ không trùng nhau",
      "Sự kiện đến **muộn** là khái niệm chỉ có ở stream: cửa sổ đã đóng rồi mới có dữ liệu thuộc nó",
      "Batch có một lợi thế lớn: đầu vào **bất biến** nên chạy lại cho cùng kết quả, và lỗi thì chạy lại là xong",
    ],
    model: "Khác biệt gốc là biên của dữ liệu. Batch làm việc trên một tập đầu vào có biên: ta biết trước nó gồm những gì, nên ta biết khi nào công việc xong, và ta biết kết quả là đầy đủ. Stream làm việc trên dữ liệu không có biên: sự kiện đến liên tục và không bao giờ có thời điểm \"đã xong\", nên mọi kết quả đều là kết quả tại một thời điểm. Từ sự khác biệt đó sinh ra ba khái niệm chỉ tồn tại ở stream. Thứ nhất là **cửa sổ**: vì không có biên, muốn tổng hợp thì phải tự cắt dòng thành từng khoảng — theo thời gian, theo số lượng, hay theo phiên. Thứ hai là phân biệt **thời gian sự kiện** với **thời gian xử lý**: thời điểm việc đó xảy ra trong thực tế khác thời điểm hệ thống ta nhìn thấy nó, và khoảng cách giữa hai thứ không cố định — một thiết bị di động mất mạng có thể gửi sự kiện ba giờ sau khi nó xảy ra. Tổng hợp theo thời gian xử lý thì đơn giản nhưng cho ra những con số không ứng với thực tế nào; tổng hợp theo thời gian sự kiện thì đúng nhưng dẫn tới khái niệm thứ ba: **sự kiện đến muộn**. Ta đã đóng cửa sổ 10 giờ và công bố kết quả, rồi mới nhận được một sự kiện thuộc 10 giờ — và phải quyết định làm gì: bỏ nó, hay sửa lại kết quả đã công bố. Không có câu trả lời chung, nó là quyết định nghiệp vụ. Cuối cùng, batch có một lợi thế mà tôi thấy bị đánh giá thấp: đầu vào của nó **bất biến**, nên chạy lại cho đúng cùng kết quả. Điều đó biến việc xử lý lỗi thành một chuyện đơn giản — sửa mã rồi chạy lại — và nó cũng làm việc kiểm thử dễ hơn nhiều. Với stream thì \"chạy lại\" là một bài toán riêng, và đó là lý do nhiều kiến trúc giữ lại một đường batch bên cạnh đường stream.",
    redFlags: [
      "Nói khác biệt chỉ là \"batch chạy theo lịch, stream chạy liên tục\"",
      "Không phân biệt thời gian sự kiện với thời gian xử lý",
      "Bỏ qua bài toán sự kiện đến muộn",
    ],
    probes: [
      "Sự kiện đến muộn ba giờ thì bạn xử lý thế nào?",
      "Vì sao tính bất biến của đầu vào batch lại quan trọng?",
      "Cửa sổ theo thời gian xử lý cho ra sai lệch gì?",
    ],
    refs: ["ddia-11", "ddia-12"],
  },
  {
    id: "ddia-iq22",
    field: "ddia",
    topic: "dd-processing",
    level: 2,
    minutes: 8,
    code: {
      lang: "text",
      text: `Job stream đếm số đơn hàng mỗi giờ, dùng để tính hoa hồng:

  stream
    .window(TumblingWindow.of(1, HOUR))       // cắt theo thời gian XỬ LÝ
    .aggregate(count())
    .to("hourly-orders")

Quan sát được:
  - Tổng 24 cửa sổ mỗi ngày khớp tổng số đơn trong ngày.
  - Nhưng con số từng giờ lệch so với báo cáo từ database, có giờ lệch 12%.
  - Lệch nhiều nhất vào 2 giờ sáng, trùng giờ chạy job đồng bộ từ một hệ thống cũ.`,
    },
    question: "Vì sao tổng khớp mà từng giờ lại lệch? Chỉ ra lỗi, và nêu những gì bạn cần thêm để sửa.",
    mustCover: [
      "Cửa sổ đang cắt theo **thời gian xử lý**, nên một đơn được gán vào giờ hệ thống **nhận** nó, không phải giờ nó **xảy ra**",
      "Tổng vẫn khớp vì mọi đơn đều được đếm đúng một lần — chỉ **phân bổ** giữa các cửa sổ là sai",
      "Job đồng bộ 2 giờ sáng đẩy một lô đơn **cũ** vào, nên tất cả bị gán vào cửa sổ 2 giờ",
      "Sửa: cắt cửa sổ theo **thời gian sự kiện**, lấy từ trường thời điểm đặt đơn trong dữ liệu",
      "Nhưng chuyển sang thời gian sự kiện thì phải quyết định **khi nào đóng cửa sổ**, vì sự kiện có thể đến muộn",
      "Cần một cơ chế theo dõi tiến độ thời gian sự kiện và một **ngưỡng chờ** cho dữ liệu muộn",
      "Và cần quyết định nghiệp vụ: dữ liệu đến sau ngưỡng thì **bỏ** hay **sửa lại** kết quả đã công bố",
      "Với hoa hồng thì bỏ dữ liệu là không chấp nhận được, nên phải có đường sửa lại",
    ],
    model: "Hai quan sát ghép lại đã chỉ ra chẩn đoán. Tổng khớp nghĩa là không đơn nào bị mất hay bị đếm hai lần — vấn đề không phải ở việc đếm. Từng giờ lệch nghĩa là việc **phân bổ** đơn vào các cửa sổ sai. Và nguyên nhân nằm ngay trong mã: cửa sổ đang cắt theo thời gian xử lý, tức mỗi đơn được gán vào giờ mà hệ thống stream **nhận** được nó, chứ không phải giờ nó **thực sự được đặt**. Bình thường hai thời điểm gần nhau nên sai lệch nhỏ và không ai để ý. Nhưng job đồng bộ 2 giờ sáng đẩy một lô đơn cũ từ hệ thống kia vào cùng lúc, và tất cả những đơn ấy — dù được đặt rải rác trong nhiều giờ trước — đều bị gán vào cửa sổ 2 giờ. Đó chính là 12% lệch, và nó giải thích cả việc lệch tập trung đúng giờ đó. Cách sửa bắt đầu bằng việc cắt cửa sổ theo **thời gian sự kiện**, lấy từ trường thời điểm đặt đơn có trong dữ liệu. Nhưng đây là chỗ tôi muốn nói rõ vì nó là phần khó thật: chuyển sang thời gian sự kiện không phải đổi một tham số mà mở ra một bài toán mới — khi nào thì đóng một cửa sổ? Với thời gian xử lý thì câu trả lời hiển nhiên là khi đồng hồ chạy qua; với thời gian sự kiện thì ta không bao giờ chắc đã nhận hết sự kiện thuộc một giờ, vì luôn có thể có dữ liệu đến muộn. Nên cần thêm hai thứ: một cơ chế theo dõi tiến độ thời gian sự kiện để biết cửa sổ nào coi như đã đủ, và một ngưỡng chờ cho dữ liệu muộn. Và cần một quyết định nghiệp vụ mà không kỹ thuật nào thay được: dữ liệu đến sau ngưỡng thì bỏ đi hay sửa lại kết quả đã công bố? Với hoa hồng thì bỏ dữ liệu là không chấp nhận được — nó nghĩa là có người không được trả tiền — nên phải có đường sửa lại, tức kết quả từng giờ phải được thiết kế như một con số **có thể được cập nhật** thay vì một con số chốt vĩnh viễn. Đó là thay đổi lớn nhất và nó thuộc về thiết kế chứ không thuộc về mã stream.",
    redFlags: [
      "Chỉ đổi sang thời gian sự kiện rồi coi là xong, không nói tới việc đóng cửa sổ",
      "Đề nghị dừng job đồng bộ hoặc chuyển nó sang giờ khác",
      "Bỏ dữ liệu đến muộn trong một bài toán tính hoa hồng",
      "Kết luận tổng khớp nên dữ liệu đúng",
    ],
    probes: [
      "Bạn đặt ngưỡng chờ dữ liệu muộn bằng cách nào?",
      "Kết quả có thể cập nhật đòi hệ thống hạ nguồn hỗ trợ gì?",
      "Nếu không có trường thời điểm đặt đơn trong dữ liệu thì sao?",
    ],
    refs: ["ddia-12"],
  },
  {
    id: "ddia-iq23",
    field: "ddia",
    topic: "dd-processing",
    level: 3,
    minutes: 11,
    question: "Bạn cần tính một tập số liệu tổng hợp cho báo cáo nghiệp vụ. Chọn batch định kỳ, stream liên tục, hay cả hai?",
    tradeoffs: [
      {
        option: "Batch định kỳ",
        when: "Khi độ tươi tính theo giờ là đủ. Đơn giản nhất và có một tính chất rất giá trị: đầu vào **bất biến** nên chạy lại cho cùng kết quả, và sửa lỗi chỉ là sửa mã rồi chạy lại. Dễ kiểm thử, dễ đối soát.",
      },
      {
        option: "Stream liên tục",
        when: "Khi nghiệp vụ cần số liệu **trong vài giây** — phát hiện gian lận, cảnh báo vận hành, bảng điều khiển thời gian thực. Đổi lại là toàn bộ họ bài toán cửa sổ, thời gian sự kiện, dữ liệu muộn, và việc \"chạy lại\" khó hơn nhiều.",
      },
      {
        option: "Cả hai — stream cho độ tươi, batch để đối soát",
        when: "Khi cần độ tươi **và** cần con số cuối cùng đáng tin. Batch chạy lại trên dữ liệu đầy đủ là **nguồn sự thật**, còn stream cho con số tạm. Cái giá là hai bản cài đặt cùng logic, và chúng có thể trôi khỏi nhau.",
      },
    ],
    mustCover: [
      "Câu hỏi quyết định là **độ tươi** mà nghiệp vụ thật sự cần, tính bằng đơn vị thời gian cụ thể",
      "Batch có lợi thế lớn về khả năng **chạy lại** vì đầu vào bất biến — điều này quan trọng hơn người ta tưởng",
      "Stream trả giá bằng cả họ bài toán mới: cửa sổ, thời gian sự kiện, dữ liệu muộn, trạng thái phải giữ",
      "Chạy lại một job stream sau khi sửa lỗi là bài toán riêng, không đơn giản như chạy lại batch",
      "Kiến trúc hai đường cho độ tươi cộng độ tin cậy, nhưng rủi ro thật là **hai bản logic trôi khỏi nhau**",
      "Nếu chọn hai đường thì phải có cách **đối soát tự động** giữa hai con số, nếu không sự trôi sẽ không được phát hiện",
      "Nhiều đội chọn stream vì nó nghe hiện đại rồi trả giá cho một độ tươi họ không cần",
    ],
    model: "Câu đầu tiên tôi hỏi là một con số: nghiệp vụ cần số liệu tươi tới mức nào — vài giây, vài phút, hay vài giờ? Câu trả lời thường là \"càng tươi càng tốt\", nên tôi hỏi lại theo cách khác: nếu số liệu trễ một giờ thì quyết định nào bị ảnh hưởng? Rất nhiều báo cáo nghiệp vụ không có quyết định nào bị ảnh hưởng, và khi đó batch định kỳ là lựa chọn đúng. Lợi thế của nó lớn hơn vẻ ngoài: đầu vào bất biến nên chạy lại cho đúng cùng kết quả, nghĩa là sửa lỗi chỉ là sửa mã rồi chạy lại, kiểm thử thì chạy trên dữ liệu thật của hôm qua và so kết quả, và đối soát với nguồn khác thì dễ vì con số có tính tái lập. Khi độ tươi thật sự cần tính bằng giây — phát hiện gian lận, cảnh báo vận hành — thì stream là bắt buộc, và tôi sẽ nói rõ cái giá: ta nhận vào cả họ bài toán mà batch không có. Cửa sổ, thời gian sự kiện so với thời gian xử lý, dữ liệu đến muộn, trạng thái phải giữ và phải phục hồi được. Và điểm tôi thấy bị đánh giá thấp nhất: **chạy lại**. Với batch thì chạy lại là chuyện thường ngày; với stream, sau khi sửa một lỗi logic thì việc tính lại số liệu của ba tuần vừa qua là một bài toán riêng đòi thiết kế trước, không phải một lệnh. Nếu không nghĩ tới nó từ đầu thì mọi lỗi logic trong job stream đều để lại một khoảng dữ liệu sai vĩnh viễn. Kiến trúc hai đường — stream cho số tạm, batch chạy lại làm nguồn sự thật — giải được cả hai yêu cầu, và tôi chọn nó khi cần độ tươi mà con số cuối cùng vẫn phải đáng tin để đối soát. Nhưng rủi ro của nó rất thật và phải được xử lý tường minh: hai bản cài đặt cùng logic sẽ **trôi khỏi nhau** khi nghiệp vụ đổi, và sự trôi đó không tự lộ ra. Nên điều kiện tôi đặt khi chọn hai đường là phải có một cơ chế đối soát tự động giữa hai con số, báo động khi chúng lệch quá ngưỡng — nếu không xây được cái đó thì hai đường tệ hơn một đường.",
    redFlags: [
      "Chọn stream vì \"thời gian thực là tốt hơn\" mà không xác định độ tươi cần thiết",
      "Bỏ qua bài toán chạy lại khi chọn stream",
      "Chọn kiến trúc hai đường mà không có cơ chế đối soát giữa hai con số",
      "Không nhắc tính bất biến của đầu vào batch như một lợi thế thật",
    ],
    probes: [
      "Nếu số liệu trễ một giờ thì quyết định nào bị ảnh hưởng?",
      "Bạn thiết kế khả năng chạy lại cho một job stream thế nào?",
      "Cơ chế đối soát giữa hai đường của bạn trông ra sao?",
    ],
    refs: ["ddia-11", "ddia-12"],
  },
  {
    id: "ddia-iq24",
    field: "ddia",
    topic: "dd-processing",
    level: 4,
    minutes: 15,
    incident: {
      symptom: "Một job stream tính số dư ví người dùng phát hiện sai số: 2.300 ví có số dư lệch so với tổng các giao dịch, lệch cả hai chiều. Job đã chạy 7 tháng. Nó đọc từ một log sự kiện, giữ trạng thái số dư trong bộ nhớ, và ghi checkpoint mỗi 30 giây. Trong 7 tháng đó job đã bị khởi động lại 40 lần vì triển khai và 3 lần vì sự cố.",
      scale: "1,4 triệu ví, 9.000 giao dịch mỗi phút. Số dư ví được dùng để cho phép hay từ chối giao dịch, nên sai số đã dẫn tới cả từ chối oan và cho phép vượt hạn mức.",
      constraints: "Không đổi được sang batch — số dư phải cập nhật trong vài giây. Log sự kiện chỉ giữ 30 ngày, nên không tính lại được từ đầu. Phải chặn lớp lỗi và phải hoà giải 2.300 ví.",
      },
    question: "Lệch **cả hai chiều** nói gì về cơ chế lỗi? Nêu chẩn đoán, và cách bạn vừa chặn vừa hoà giải khi log chỉ giữ 30 ngày.",
    mustCover: [
      "Lệch **cả hai chiều** loại giả thuyết \"mất sự kiện\" đơn thuần — mất thì chỉ lệch một chiều",
      "Nó gợi **xử lý lặp** ở một số ví và **mất** ở một số ví khác, tức lỗi nằm ở ranh giới khởi động lại",
      "Checkpoint 30 giây nghĩa là sau khi khởi động lại, job xử lý lại tối đa 30 giây sự kiện",
      "Nếu phép cập nhật số dư **không idempotent** thì xử lý lại làm số dư tăng sai — lệch dương",
      "Nếu checkpoint được ghi **trước** khi trạng thái thực sự bền vững thì có sự kiện bị bỏ — lệch âm",
      "43 lần khởi động lại trong 7 tháng khớp với quy mô 2.300 ví bị ảnh hưởng",
      "Chặn: làm phép áp dụng giao dịch **idempotent** theo id giao dịch, để xử lý lại không đổi kết quả",
      "Và bảo đảm checkpoint cùng trạng thái được ghi **nguyên khối**, không thể lệch nhau",
      "Hoà giải khi log chỉ giữ 30 ngày: **không** tính lại từ đầu được — phải lấy số dư từ một nguồn độc lập, hoặc chốt lại bằng một mốc đối soát",
    ],
    model: "Chi tiết quyết định là lệch **cả hai chiều**, và nó loại ngay giả thuyết đơn giản nhất: nếu chỉ mất sự kiện thì mọi sai số sẽ cùng một chiều. Lệch hai chiều nghĩa là có ví bị xử lý lặp và có ví bị bỏ sót, và cả hai đều trỏ về cùng một chỗ: ranh giới khởi động lại. Cơ chế cụ thể thì có hai nửa. Nửa thứ nhất gây lệch dương: checkpoint mỗi 30 giây nghĩa là sau khi khởi động lại, job quay về checkpoint cuối và xử lý lại tối đa 30 giây sự kiện. Nếu phép cập nhật số dư là \"cộng thêm số tiền của giao dịch\" thì nó **không idempotent**, nên mỗi giao dịch bị xử lý lại làm số dư tăng thêm một lần nữa. Nửa thứ hai gây lệch âm: nếu checkpoint được ghi trước khi trạng thái tương ứng thực sự bền vững — hoặc hai thứ đó được ghi tách rời và một lần khởi động lại rơi vào giữa — thì job tin rằng nó đã xử lý tới điểm X trong khi trạng thái mới chỉ phản ánh tới điểm trước đó, và khoảng chênh bị bỏ qua vĩnh viễn. Bốn mươi ba lần khởi động lại trong bảy tháng, mỗi lần ảnh hưởng tới những ví có giao dịch trong cửa sổ 30 giây tương ứng, khớp về quy mô với 2.300 ví. Về cách chặn, phần quan trọng nhất là làm phép áp dụng giao dịch trở nên idempotent: thay vì cộng thêm, job phải ghi nhận rằng **giao dịch với id này** đã được áp dụng, và bỏ qua nếu đã thấy id đó. Khi ấy xử lý lại 30 giây sự kiện sau mỗi lần khởi động lại là vô hại, và ta có thể ngủ yên với mọi lần triển khai. Phần thứ hai là bảo đảm checkpoint và trạng thái được ghi nguyên khối, không thể lệch nhau — nếu hệ thống không cho thì phải thiết kế sao cho việc xử lý lại là an toàn, và điều đó lại quay về tính idempotent. Phần hoà giải là phần tôi phải trung thực nhất: log chỉ giữ 30 ngày nên **không** tính lại được từ đầu, và điều đó nghĩa là không có cách nào tái lập số dư đúng chỉ từ dữ liệu trong hệ thống stream. Nên hoà giải phải dựa vào một nguồn độc lập — nếu có một hệ thống ghi sổ giao dịch riêng thì lấy số dư từ đó; nếu không thì phải chốt lại bằng một mốc đối soát, tức xác nhận số dư hiện tại với từng người dùng hoặc theo một quy trình nghiệp vụ, rồi coi mốc đó là điểm khởi đầu mới. Và vì số dư đang được dùng để cho phép hay từ chối giao dịch, tôi sẽ đề xuất dừng dùng nó cho quyết định đó tới khi hoà giải xong, dùng nguồn độc lập thay thế — vì cho phép vượt hạn mức là rủi ro tiền thật.",
    redFlags: [
      "Kết luận mất sự kiện mà không giải thích được lệch chiều dương",
      "Giảm khoảng checkpoint xuống 5 giây — thu hẹp cửa sổ chứ không sửa tính không idempotent",
      "Hứa tính lại toàn bộ từ log, trong khi log chỉ giữ 30 ngày",
      "Tiếp tục dùng số dư sai để quyết định cho phép giao dịch trong lúc hoà giải",
      "Đổi sang batch — ràng buộc đã cấm và cũng không sửa được tính không idempotent",
    ],
    probes: [
      "Vì sao lệch cả hai chiều lại loại được giả thuyết mất sự kiện đơn thuần?",
      "Làm phép áp dụng giao dịch idempotent cụ thể ra sao, và nó tốn gì?",
      "Nếu không có nguồn độc lập nào thì bạn chốt mốc đối soát thế nào?",
    ],
    refs: ["ddia-12", "ddia-11"],
  },
];
