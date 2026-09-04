# Chương 14. Làm Điều Đúng Đắn

> *Nuôi dưỡng các hệ thống AI bằng vẻ đẹp, sự xấu xí và tàn nhẫn của thế giới, nhưng lại kỳ vọng nó chỉ phản chiếu vẻ đẹp, là một điều viển vông.*

> —Vinay Uday Prabhu và Abeba Birhane, “Large Datasets: A Pyrrhic Win for Computer Vision?” (2020)

Trong chương cuối cùng của cuốn sách này, hãy cùng lùi lại một bước. Xuyên suốt cuốn sách, chúng ta đã khảo sát nhiều kiến trúc khác nhau cho các hệ thống dữ liệu, đánh giá ưu và nhược điểm của chúng, và tìm hiểu các kỹ thuật để xây dựng những ứng dụng đáng tin cậy, có khả năng mở rộng và dễ bảo trì. Tuy nhiên, chúng ta đã bỏ sót một phần nền tảng của cuộc thảo luận, và giờ là lúc bổ khuyết phần đó.

Mọi hệ thống đều được xây dựng vì một mục đích nào đó; mọi hành động chúng ta thực hiện đều có cả hệ quả chủ ý lẫn hệ quả ngoài ý muốn. Mục đích có thể đơn giản chỉ là kiếm tiền, nhưng hệ quả thì có thể lan rộng rất xa. Chúng ta, những kỹ sư xây dựng nên các hệ thống này, có trách nhiệm cân nhắc thấu đáo những hệ quả đó và bảo đảm rằng các quyết định của mình không gây ra tổn hại.

Chúng ta nói về dữ liệu như một thứ trừu tượng, nhưng hãy nhớ rằng nhiều tập dữ liệu là về con người: hành vi, mối quan tâm và danh tính của họ. Chúng ta phải đối xử với dữ liệu như vậy bằng tính người và sự tôn trọng. Người dùng cũng là con người, và phẩm giá con người là điều tối thượng [1].

Phát triển phần mềm ngày càng đòi hỏi phải đưa ra những lựa chọn đạo đức quan trọng. Có những bộ hướng dẫn giúp kỹ sư phần mềm định hướng trong các vấn đề này, chẳng hạn như ACM Code of Ethics and Professional Conduct [2], nhưng chúng hiếm khi được bàn luận, áp dụng và thực thi trên thực tế. Kết quả là, các kỹ sư và quản lý sản phẩm đôi khi có thái độ xem nhẹ quyền riêng tư cũng như những hệ quả tiêu cực tiềm tàng của sản phẩm mà họ tạo ra [3, 4].

Bản thân một công nghệ không tốt cũng không xấu — điều quan trọng là nó được sử dụng như thế nào và tác động ra sao đến con người. Điều này đúng với một hệ thống phần mềm như công cụ tìm kiếm chẳng khác gì với một vũ khí như khẩu súng. Trách nhiệm đạo đức là thứ chúng ta phải gánh vác; sẽ là không đủ nếu kỹ sư phần mềm chỉ chăm chăm vào công nghệ mà phớt lờ hệ quả của nó.

Tuy nhiên, khác với phần lớn lĩnh vực điện toán, các khái niệm nằm ở trung tâm của đạo đức lại không cố định hay xác định rạch ròi về nghĩa chính xác của chúng; chúng đòi hỏi sự diễn giải, và điều đó có thể mang tính chủ quan [5]. Cái gì làm cho một điều trở nên “tốt” hay “xấu” không được định nghĩa rõ ràng, và giới chuyên môn điện toán còn thiếu những cuộc thảo luận nghiêm túc về chủ đề này [6]. Lập luận về đạo đức là việc khó, nhưng nó quá quan trọng để có thể bỏ qua. Điều đó đòi hỏi những gì? Đạo đức không phải là việc rà soát một danh sách kiểm tra để xác nhận rằng bạn tuân thủ; đó là một quá trình phản tư mang tính tham gia và lặp đi lặp lại, trong sự đối thoại với những người liên quan, cùng với trách nhiệm giải trình về kết quả [7].

## Predictive Analytics

Predictive analytics (phân tích dự đoán) là một phần quan trọng lý giải vì sao người ta hào hứng với big data và AI. Đó cũng là một lĩnh vực đầy rẫy những tình thế lưỡng nan về đạo đức. Dùng phân tích dữ liệu để dự báo thời tiết hay sự lây lan của dịch bệnh là một chuyện [8]; dự đoán xem một phạm nhân có khả năng tái phạm hay không, một người xin vay có khả năng vỡ nợ hay không, hay một khách hàng bảo hiểm có khả năng đưa ra những yêu cầu bồi thường tốn kém hay không lại là chuyện khác [9]. Những trường hợp sau có ảnh hưởng trực tiếp đến cuộc sống của từng con người cụ thể.

Lẽ tự nhiên, các mạng lưới thanh toán muốn ngăn chặn giao dịch gian lận, ngân hàng muốn tránh những khoản vay xấu, hãng hàng không muốn tránh không tặc, và các công ty muốn tránh tuyển phải những người kém hiệu quả hoặc không đáng tin cậy. Từ góc nhìn của họ, cái giá của một cơ hội kinh doanh bị bỏ lỡ là thấp, còn cái giá của một khoản vay xấu hay một nhân viên có vấn đề thì cao hơn nhiều, nên việc các tổ chức muốn thận trọng là điều dễ hiểu. Nếu còn nghi ngờ, tốt hơn hết họ nên nói không.

Tuy nhiên, khi việc ra quyết định bằng thuật toán ngày càng lan rộng, một người đã bị thuật toán gán nhãn (chính xác hoặc sai lầm) là rủi ro có thể phải hứng chịu vô số những quyết định “không” như vậy. Việc bị loại trừ một cách có hệ thống khỏi công việc, đi lại bằng đường hàng không, bảo hiểm, thuê nhà, dịch vụ tài chính và những khía cạnh then chốt khác của xã hội là một sự trói buộc lớn đến mức nó đã được gọi là “nhà tù thuật toán” (“algorithmic prison”) [10]. Ở những quốc gia tôn trọng nhân quyền, hệ thống tư pháp hình sự suy đoán vô tội cho đến khi có bằng chứng phạm tội; ngược lại, các hệ thống tự động có thể loại trừ một người khỏi việc tham gia vào xã hội một cách có hệ thống và tùy tiện, mà không cần bất kỳ bằng chứng phạm tội nào, và người đó gần như không có cơ hội kháng nghị.

### Bias and Discrimination

Các quyết định do thuật toán đưa ra không nhất thiết tốt hơn hay tệ hơn các quyết định do con người đưa ra. Ai cũng có khả năng mang thiên kiến (bias), ngay cả khi họ chủ động cố gắng chống lại chúng, và các thực hành phân biệt đối xử có thể trở nên được thể chế hóa về mặt văn hóa. Người ta hy vọng rằng việc ra quyết định dựa trên dữ liệu, thay vì dựa trên những đánh giá chủ quan và theo bản năng của con người, có thể công bằng hơn và mang lại cơ hội tốt hơn cho những người thường bị bỏ qua hoặc chịu thiệt thòi trong hệ thống truyền thống [11].

Khi phát triển các hệ thống predictive analytics và AI, chúng ta không đơn thuần tự động hóa quyết định của con người bằng cách dùng phần mềm để quy định các luật lệ về khi nào nói có hoặc không; chúng ta để cho chính các luật lệ đó được suy ra từ dữ liệu. Tuy nhiên, những khuôn mẫu mà các hệ thống này học được lại không minh bạch: ngay cả khi dữ liệu cho thấy một tương quan, chúng ta có thể không biết vì sao. Nếu đầu vào của một thuật toán mang trong nó một thiên kiến có hệ thống, hệ thống nhiều khả năng sẽ học và khuếch đại thiên kiến đó trong đầu ra của mình [12].

Ở nhiều quốc gia, luật chống phân biệt đối xử cấm việc đối xử khác biệt với con người dựa trên những đặc điểm được bảo vệ như sắc tộc, tuổi tác, giới tính, xu hướng tính dục, khuyết tật hay tín ngưỡng. Các đặc trưng khác trong dữ liệu của một người vẫn có thể được phân tích, nhưng điều gì sẽ xảy ra nếu chúng tương quan với những đặc điểm được bảo vệ? Ví dụ, ở những khu dân cư bị phân tách theo chủng tộc, mã bưu chính hay thậm chí địa chỉ IP của một người là một chỉ báo mạnh về chủng tộc. Nói như vậy, có vẻ thật nực cười khi tin rằng một thuật toán bằng cách nào đó có thể nhận dữ liệu thiên lệch làm đầu vào rồi tạo ra đầu ra công bằng và vô tư [13, 14]. Vậy mà niềm tin này lại thường được ngầm hiểu bởi những người cổ vũ cho việc ra quyết định dựa trên dữ liệu — một thái độ đã bị châm biếm là “machine learning giống như hoạt động rửa tiền dành cho thiên kiến” [15].

Các hệ thống predictive analytics chỉ đơn thuần ngoại suy từ quá khứ; nếu quá khứ mang tính phân biệt đối xử, chúng sẽ mã hóa và khuếch đại sự phân biệt đối xử ấy [16]. Nếu chúng ta muốn tương lai tốt đẹp hơn quá khứ, cần phải có trí tưởng tượng đạo đức, và đó là thứ chỉ con người mới có thể mang lại [17]. Dữ liệu và mô hình nên là công cụ của chúng ta, chứ không phải là chủ nhân của chúng ta.

### Responsibility and Accountability

Việc ra quyết định tự động đặt ra câu hỏi về trách nhiệm và trách nhiệm giải trình [17]. Nếu một con người phạm sai lầm, họ có thể bị quy trách nhiệm, và người chịu ảnh hưởng bởi quyết định đó có thể kháng nghị. Thuật toán cũng phạm sai lầm, nhưng ai sẽ chịu trách nhiệm nếu chúng sai [18]? Khi một chiếc xe tự lái gây tai nạn, ai là người chịu trách nhiệm? Nếu một thuật toán chấm điểm tín dụng tự động phân biệt đối xử một cách có hệ thống với những người thuộc một chủng tộc hay tôn giáo nhất định, liệu có cơ chế khiếu nại nào không? Nếu một quyết định của hệ thống ML của bạn bị đưa ra xem xét tại tòa, liệu bạn có thể giải thích cho thẩm phán cách thuật toán đã đi đến quyết định đó hay không? Người ta không nên được phép né tránh trách nhiệm của mình bằng cách đổ lỗi cho thuật toán.

Các cơ quan xếp hạng tín dụng là một ví dụ kinh điển về việc thu thập dữ liệu để đưa ra quyết định về con người. Điểm tín dụng xấu khiến cuộc sống trở nên khó khăn, nhưng ít nhất điểm tín dụng thường dựa trên những dữ kiện liên quan về lịch sử vay mượn thực tế của một người, và mọi sai sót trong hồ sơ đều có thể được sửa chữa (mặc dù các cơ quan này thường không làm cho việc đó dễ dàng). Tuy nhiên, các thuật toán chấm điểm dựa trên machine learning thường sử dụng phạm vi đầu vào rộng hơn nhiều và kém minh bạch hơn nhiều, khiến việc hiểu một quyết định cụ thể đã hình thành như thế nào và liệu ai đó có bị đối xử bất công hay phân biệt đối xử hay không trở nên khó khăn hơn [19].

Điểm tín dụng tóm lược câu hỏi “Bạn đã hành xử thế nào trong quá khứ?”, trong khi predictive analytics thường hoạt động trên cơ sở “Ai giống bạn, và những người như bạn đã hành xử thế nào trong quá khứ?”. Việc suy diễn tương tự từ hành vi của người khác hàm ý sự rập khuôn con người — chẳng hạn, dựa trên nơi họ sinh sống (một đại lượng thay thế khá sát cho chủng tộc và giai tầng kinh tế - xã hội). Còn những người bị xếp nhầm nhóm thì sao? Hơn nữa, nếu một quyết định sai vì dữ liệu sai, thì việc khiếu nại gần như là bất khả thi [17].

Phần lớn dữ liệu mang bản chất thống kê, nghĩa là ngay cả khi phân phối xác suất trên tổng thể là đúng, các trường hợp cá biệt vẫn hoàn toàn có thể sai. Ví dụ, nếu tuổi thọ trung bình ở quốc gia của bạn là 80 tuổi, điều đó không có nghĩa là bạn được kỳ vọng sẽ lăn ra chết vào đúng sinh nhật thứ 80 của mình. Từ giá trị trung bình và phân phối xác suất, bạn không thể nói được nhiều điều về độ tuổi mà một người cụ thể sẽ sống tới. Tương tự, đầu ra của một hệ thống dự đoán mang tính xác suất và hoàn toàn có thể sai trong từng trường hợp riêng lẻ.

Niềm tin mù quáng vào tính tối thượng của dữ liệu trong việc ra quyết định không chỉ là ảo tưởng mà còn thực sự nguy hiểm. Khi việc ra quyết định dựa trên dữ liệu ngày càng phổ biến, chúng ta sẽ cần tìm ra cách tránh củng cố những thiên kiến sẵn có, cách làm cho thuật toán có trách nhiệm giải trình và minh bạch, cũng như cách sửa chữa chúng khi chúng chắc chắn sẽ mắc sai lầm.

Chúng ta cũng sẽ cần tìm ra cách hiện thực hóa tiềm năng tích cực của dữ liệu và ngăn không cho nó bị dùng để gây hại cho con người. Ví dụ, phân tích dữ liệu có thể phơi bày những đặc điểm tài chính và xã hội trong cuộc sống của con người. Một mặt, sức mạnh này có thể được dùng để tập trung viện trợ và hỗ trợ cho những người cần nhất. Mặt khác, đôi khi nó lại được các doanh nghiệp trục lợi sử dụng để nhận diện những người dễ tổn thương và bán cho họ những sản phẩm rủi ro như các khoản vay lãi suất cao hay những tấm bằng đại học vô giá trị [17, 20].

### Feedback Loops

Ngay cả với những ứng dụng dự đoán có tác động ít sâu rộng hơn đến con người, chẳng hạn như các hệ thống gợi ý, vẫn có những vấn đề nan giải mà chúng ta phải đối mặt. Khi các dịch vụ trở nên giỏi trong việc dự đoán nội dung mà người dùng muốn xem, chúng có thể rốt cuộc chỉ cho người ta thấy những quan điểm mà họ vốn đã đồng tình, dẫn đến các buồng vọng âm (echo chamber), nơi định kiến rập khuôn, thông tin sai lệch và sự phân cực có thể sinh sôi. Chúng ta đã và đang chứng kiến tác động mà các buồng vọng âm trên mạng xã hội có thể gây ra đối với các chiến dịch tranh cử.

Khi predictive analytics tác động đến cuộc sống của con người, những vấn đề đặc biệt tai hại nảy sinh do các vòng phản hồi tự củng cố. Ví dụ, hãy xét trường hợp người sử dụng lao động dùng điểm tín dụng để đánh giá các ứng viên tiềm năng. Bạn có thể là một người lao động giỏi với điểm tín dụng tốt, nhưng đột nhiên rơi vào khó khăn tài chính vì một bất hạnh nằm ngoài tầm kiểm soát của bạn. Khi bạn trễ hạn thanh toán các hóa đơn, điểm tín dụng của bạn sụt giảm, và bạn sẽ ít có khả năng tìm được việc làm hơn. Thất nghiệp đẩy bạn tới nghèo đói, điều này lại càng làm điểm số của bạn tệ hơn, khiến việc tìm việc làm càng khó khăn hơn nữa [17]. Đó là một vòng xoáy đi xuống bắt nguồn từ những giả định độc hại, được ngụy trang dưới lớp vỏ của sự chặt chẽ toán học và dữ liệu.

Một ví dụ khác về vòng phản hồi: các nhà kinh tế học phát hiện rằng khi các trạm xăng ở Đức áp dụng cơ chế định giá bằng thuật toán, cạnh tranh bị giảm sút và giá đối với người tiêu dùng tăng lên, bởi các thuật toán đã học được cách thông đồng với nhau [21].

Chúng ta không phải lúc nào cũng dự đoán được khi nào những vòng phản hồi như vậy có thể xảy ra. Tuy nhiên, nhiều hệ quả có thể được dự đoán bằng cách suy nghĩ về toàn bộ hệ thống (không chỉ các phần được máy tính hóa, mà cả những con người tương tác với nó) — một cách tiếp cận được gọi là *systems thinking* (tư duy hệ thống) [22]. Chúng ta có thể cố gắng hiểu xem một hệ thống phân tích dữ liệu phản ứng ra sao với những hành vi, cấu trúc hay đặc điểm khác nhau. Liệu hệ thống có củng cố và khuếch đại những khác biệt sẵn có giữa con người (ví dụ, làm cho người giàu giàu thêm hoặc người nghèo nghèo đi) hay nó cố gắng chống lại bất công? Ngay cả với những ý định tốt đẹp nhất, chúng ta vẫn phải cảnh giác với khả năng xảy ra những hệ quả ngoài ý muốn.

## Privacy and Tracking

Bên cạnh những vấn đề của predictive analytics — tức là dùng dữ liệu để đưa ra các quyết định tự động về con người — bản thân việc thu thập dữ liệu cũng có những vấn đề đạo đức. Mối quan hệ giữa các tổ chức thu thập dữ liệu và những người có dữ liệu bị thu thập là gì?

Khi một hệ thống chỉ lưu trữ dữ liệu mà người dùng đã chủ động nhập vào, bởi vì họ muốn hệ thống lưu và xử lý dữ liệu đó theo một cách nhất định, thì hệ thống đang thực hiện một dịch vụ cho người dùng; người dùng là khách hàng. Nhưng khi hoạt động của người dùng bị theo dõi và ghi lại như một hệ quả phụ của những việc khác mà họ đang làm, thì mối quan hệ trở nên kém rõ ràng hơn. Dịch vụ không còn chỉ làm những gì người dùng bảo nó làm; nó mang những lợi ích riêng của mình, và những lợi ích đó có thể xung đột với lợi ích của người dùng.

Việc theo dõi dữ liệu hành vi đã trở nên ngày càng quan trọng đối với các tính năng hướng tới người dùng của nhiều dịch vụ trực tuyến. Theo dõi kết quả tìm kiếm nào được nhấp vào giúp cải thiện thứ hạng của kết quả tìm kiếm; việc đưa ra gợi ý (“những người thích *X* cũng thích *Y*”) giúp người dùng khám phá những thứ thú vị và hữu ích; các A/B test và phân tích luồng người dùng có thể giúp chỉ ra cách cải thiện giao diện. Những tính năng đó đòi hỏi một mức độ theo dõi hành vi người dùng nhất định, và người dùng được hưởng lợi từ chúng.

Tuy nhiên, tùy thuộc vào mô hình kinh doanh của một công ty, việc theo dõi thường không dừng lại ở đó. Nếu dịch vụ được tài trợ bằng quảng cáo, thì các nhà quảng cáo mới là khách hàng thực sự, còn lợi ích của người dùng bị xếp thứ yếu. Dữ liệu theo dõi trở nên chi tiết hơn, các phân tích vươn xa hơn, và dữ liệu được lưu giữ trong thời gian dài nhằm dựng lên hồ sơ chi tiết về từng người phục vụ mục đích tiếp thị.

Giờ đây, mối quan hệ giữa công ty và người dùng có dữ liệu bị thu thập bắt đầu trông khác hẳn. Người dùng được cung cấp một dịch vụ miễn phí và được dụ dỗ tương tác với nó càng nhiều càng tốt. Việc theo dõi người dùng chủ yếu không phục vụ chính cá nhân đó mà phục vụ nhu cầu của các nhà quảng cáo đang tài trợ cho dịch vụ. Mối quan hệ này có thể được mô tả một cách thích đáng bằng một từ mang hàm ý u ám hơn: *giám sát* (*surveillance*).

### Surveillance

Như một thí nghiệm tư duy, hãy thử thay từ *data* bằng *surveillance*, rồi quan sát xem những cụm từ quen thuộc có còn nghe hay ho như vậy không [23]. Chẳng hạn thế này: “Trong tổ chức được dẫn dắt bởi giám sát của chúng tôi, chúng tôi thu thập các luồng giám sát thời gian thực và lưu chúng vào kho giám sát của mình. Các nhà khoa học giám sát của chúng tôi sử dụng phân tích nâng cao và xử lý giám sát để rút ra những hiểu biết mới.”

Thí nghiệm tư duy này mang tính luận chiến khác thường đối với cuốn sách này, *Designing Surveillance-Intensive Applications*, nhưng cần đến những lời lẽ mạnh mẽ để nhấn mạnh điểm này. Trong nỗ lực khiến phần mềm “nuốt chửng thế giới” [24], chúng ta đã dựng nên hạ tầng giám sát đại chúng lớn nhất từng thấy. Chúng ta đang nhanh chóng tiến tới một thế giới trong đó mọi không gian có người ở đều chứa ít nhất một chiếc micro kết nối internet, dưới dạng điện thoại thông minh, TV thông minh, thiết bị trợ lý điều khiển bằng giọng nói, máy theo dõi trẻ sơ sinh, và thậm chí cả đồ chơi trẻ em sử dụng nhận dạng giọng nói trên cloud. Nhiều thiết bị trong số này có hồ sơ bảo mật tệ hại [25].

Điểm mới so với quá khứ là số hóa đã khiến việc thu thập lượng lớn dữ liệu về con người trở nên dễ dàng. Việc giám sát vị trí và sự di chuyển của chúng ta, các mối quan hệ xã hội và liên lạc của chúng ta, các giao dịch mua sắm và thanh toán của chúng ta, cũng như dữ liệu sức khỏe của chúng ta, đã trở nên gần như không thể tránh khỏi. Một tổ chức giám sát rốt cuộc có thể biết về một người nhiều hơn cả chính người đó biết về bản thân mình — ví dụ, phát hiện bệnh tật hay khó khăn kinh tế trước khi cá nhân đó nhận ra.

Ngay cả những chế độ toàn trị và đàn áp nhất trong quá khứ cũng chỉ có thể mơ đến việc đặt một chiếc micro trong mọi căn phòng và buộc mọi người phải thường trực mang theo một thiết bị có khả năng theo dõi vị trí và di chuyển của họ. Vậy mà những lợi ích chúng ta nhận được từ công nghệ số lớn đến mức giờ đây chúng ta tự nguyện chấp nhận tình trạng giám sát toàn diện này. Khác biệt chỉ là ở chỗ dữ liệu đang được các tập đoàn thu thập để cung cấp dịch vụ cho chúng ta, thay vì bởi các cơ quan chính phủ đang tìm kiếm sự kiểm soát [26].

Không phải mọi hoạt động thu thập dữ liệu đều nhất thiết được coi là giám sát, nhưng việc soi xét nó dưới góc độ đó có thể giúp chúng ta hiểu mối quan hệ của mình với bên thu thập dữ liệu. Vì sao chúng ta có vẻ vui lòng chấp nhận sự giám sát của các tập đoàn? Có lẽ bạn cảm thấy mình chẳng có gì phải giấu giếm — nói cách khác, bạn hoàn toàn hòa hợp với các cấu trúc quyền lực hiện hữu, bạn không thuộc một nhóm thiểu số bị gạt ra bên lề, và bạn không cần lo sợ bị ngược đãi [27]. Không phải ai cũng may mắn như vậy. Hoặc có lẽ vì mục đích của nó có vẻ vô hại — đó không phải là sự cưỡng ép và áp đặt lộ liễu, mà chỉ đơn thuần là những gợi ý tốt hơn và tiếp thị được cá nhân hóa hơn. Tuy nhiên, kết hợp với phần thảo luận về predictive analytics ở mục trước, ranh giới đó có vẻ kém rõ ràng hơn.

Chúng ta đã và đang chứng kiến dữ liệu hành vi về việc lái xe, được ô tô theo dõi mà không có sự đồng ý của tài xế, ảnh hưởng đến phí bảo hiểm của họ [28], và phạm vi bảo hiểm y tế phụ thuộc vào việc người ta có đeo thiết bị theo dõi thể chất hay không. Khi giám sát được dùng để đưa ra những quyết định chi phối các khía cạnh quan trọng của đời sống, chẳng hạn như phạm vi bảo hiểm hay việc làm, nó bắt đầu tỏ ra kém vô hại hơn. Phân tích dữ liệu cũng có thể tiết lộ những điều xâm phạm riêng tư đến mức đáng kinh ngạc — ví dụ, cảm biến chuyển động trong đồng hồ thông minh hay thiết bị theo dõi thể chất có thể được dùng để suy ra bạn đang gõ gì (ví dụ, mật khẩu) với độ chính xác khá tốt [29]. Độ chính xác của cảm biến và các thuật toán phân tích rồi sẽ chỉ ngày càng tốt hơn.

### Consent and Freedom of Choice

Chúng ta có thể lập luận rằng người dùng tự nguyện chọn sử dụng những dịch vụ theo dõi hoạt động của họ, đồng ý với các điều khoản dịch vụ và chính sách quyền riêng tư, và chấp thuận cho việc thu thập dữ liệu. Chúng ta thậm chí có thể tuyên bố rằng người dùng đang nhận được một dịch vụ giá trị để đổi lấy dữ liệu mà họ cung cấp, và rằng việc theo dõi là cần thiết để cung cấp dịch vụ đó. Không nghi ngờ gì, các mạng xã hội, công cụ tìm kiếm và nhiều dịch vụ trực tuyến miễn phí khác đều có giá trị đối với người dùng — nhưng lập luận này có những vấn đề của nó.

Thứ nhất, chúng ta nên hỏi vì sao việc theo dõi lại cần thiết. Một số hình thức theo dõi trực tiếp góp phần cải thiện các tính năng cho người dùng — ví dụ, theo dõi tỷ lệ nhấp chuột trên kết quả tìm kiếm có thể giúp cải thiện thứ hạng và độ liên quan của kết quả trong một công cụ tìm kiếm, và theo dõi những sản phẩm mà khách hàng thường mua cùng nhau có thể giúp một cửa hàng trực tuyến gợi ý các sản phẩm liên quan. Tuy nhiên, khi theo dõi tương tác của người dùng để gợi ý nội dung, hoặc để dựng hồ sơ người dùng phục vụ mục đích quảng cáo, thì việc đó có thực sự vì lợi ích của người dùng hay không lại kém rõ ràng hơn. Phải chăng nó chỉ cần thiết vì quảng cáo là thứ chi trả cho dịch vụ?

Thứ hai, hầu hết người dùng biết rất ít về dữ liệu mà họ đang đưa vào cơ sở dữ liệu của chúng ta, hay về cách dữ liệu đó được lưu giữ và xử lý — và phần lớn các chính sách quyền riêng tư che mờ nhiều hơn là làm sáng tỏ. Nếu không hiểu điều gì xảy ra với dữ liệu của mình, người dùng không thể đưa ra sự đồng ý có ý nghĩa. Thường thì dữ liệu của một người dùng còn nói lên nhiều điều về những người khác vốn không phải người dùng của dịch vụ và chưa hề đồng ý với bất kỳ điều khoản nào. Những tập dữ liệu dẫn xuất (derived data) mà chúng ta đã thảo luận trong vài chương gần đây — trong đó dữ liệu từ toàn bộ cơ sở người dùng có thể đã được kết hợp với dữ liệu theo dõi hành vi và các nguồn dữ liệu bên ngoài — chính là loại dữ liệu mà người dùng không thể hiểu được một cách thấu đáo.

Hơn nữa, dữ liệu được khai thác từ người dùng thông qua một quá trình một chiều, chứ không phải một mối quan hệ có sự tương hỗ thực sự hay một cuộc trao đổi giá trị công bằng. Không có đối thoại, không có lựa chọn nào cho người dùng thương lượng về lượng dữ liệu họ cung cấp và dịch vụ họ nhận lại. Mối quan hệ giữa dịch vụ và người dùng là bất đối xứng và một chiều; các điều khoản do dịch vụ đặt ra, chứ không phải do người dùng [30, 31].

Ở Liên minh châu Âu, Quy định Bảo vệ Dữ liệu Chung (General Data Protection Regulation, GDPR) yêu cầu sự đồng ý phải được “đưa ra một cách tự do, cụ thể, có hiểu biết và rõ ràng”, và người dùng phải có khả năng “từ chối hoặc rút lại sự đồng ý mà không chịu thiệt hại” — nếu không, nó không được coi là “đưa ra một cách tự do”. Mọi yêu cầu xin sự đồng ý phải được viết “dưới một hình thức dễ hiểu và dễ tiếp cận, sử dụng ngôn ngữ rõ ràng và giản dị”, và “sự im lặng, các ô đã được tích sẵn hay sự thụ động [không] cấu thành sự đồng ý” [32].

Sự đồng ý không phải là cơ sở duy nhất cho việc xử lý hợp pháp dữ liệu cá nhân theo GDPR. Còn có một số cơ sở khác, bao gồm việc tuân thủ các quy định pháp luật khác hoặc bảo vệ tính mạng của ai đó. Ngoài ra, cơ sở lợi ích chính đáng cho phép một số cách sử dụng dữ liệu nhất định (ví dụ, để phòng chống gian lận) [33] (mà những kẻ gian lận hẳn sẽ không đồng ý). Dù vậy, sự đồng ý vẫn là cơ sở được sử dụng thường xuyên nhất cho việc xử lý dữ liệu cá nhân trong các dịch vụ internet.

Bạn có thể lập luận rằng một người dùng không đồng ý với việc bị giám sát thì đơn giản là có thể chọn không sử dụng dịch vụ. Nhưng lựa chọn này cũng chẳng hề tự do. Nếu một dịch vụ phổ biến đến mức nó “được hầu hết mọi người coi là thiết yếu cho sự tham gia xã hội cơ bản” [30], thì việc kỳ vọng người ta từ bỏ nó là không hợp lý — việc sử dụng nó trên thực tế là bắt buộc. Ví dụ, ở phần lớn các cộng đồng phương Tây, việc mang theo điện thoại thông minh, dùng mạng xã hội để giao tiếp và dùng Google để tìm thông tin đã trở thành chuẩn mực. Đặc biệt khi một dịch vụ có hiệu ứng mạng, sẽ có một cái giá xã hội đối với những người chọn *không* sử dụng nó.

Từ chối sử dụng một dịch vụ vì các chính sách theo dõi người dùng của nó là điều nói dễ hơn làm. Các nền tảng này được thiết kế đặc biệt để giữ chân người dùng. Nhiều nền tảng sử dụng các cơ chế trò chơi và những chiến thuật phổ biến trong cờ bạc để khiến người dùng quay lại [34]. Ngay cả khi một người dùng vượt qua được điều này, việc từ chối tham gia cũng chỉ là một lựa chọn dành cho số ít người đủ đặc quyền để có thời gian và kiến thức nhằm hiểu chính sách quyền riêng tư của dịch vụ, và những người có thể chấp nhận việc có khả năng bỏ lỡ sự tham gia xã hội hay các cơ hội nghề nghiệp lẽ ra đã đến nếu họ tham gia dịch vụ. Với những người ở vị thế kém đặc quyền hơn, không hề có tự do lựa chọn thực chất nào; sự giám sát trở nên không thể thoát khỏi.

### Quyền riêng tư và việc sử dụng dữ liệu

Đôi khi người ta tuyên bố rằng “quyền riêng tư đã chết” với lý do rằng một số người dùng sẵn sàng đăng đủ mọi thứ về cuộc sống của họ lên mạng xã hội, khi thì tầm thường, khi thì hết sức riêng tư. Tuy nhiên, tuyên bố này là sai và dựa trên sự hiểu lầm về từ *privacy* (quyền riêng tư).

Có quyền riêng tư không có nghĩa là giữ bí mật mọi thứ; nó có nghĩa là có sự tự do lựa chọn tiết lộ điều gì cho ai, công khai điều gì, và giữ bí mật điều gì. Quyền riêng tư là một quyền quyết định: nó cho phép mỗi người tự quyết định mình muốn ở đâu trên phổ giữa bí mật và minh bạch trong từng tình huống [30]. Đó là một khía cạnh quan trọng của sự tự do và quyền tự chủ của mỗi con người.

Ví dụ, một người mắc một bệnh hiếm gặp có thể rất vui lòng cung cấp dữ liệu y tế riêng tư của mình cho các nhà nghiên cứu nếu điều đó có thể giúp phát triển phương pháp điều trị cho căn bệnh của họ. Tuy nhiên, người này phải có quyền lựa chọn ai được truy cập dữ liệu đó và cho mục đích gì. Chẳng hạn, nếu thông tin về căn bệnh có thể cản trở họ tiếp cận bảo hiểm y tế hoặc việc làm, người này có lẽ sẽ thận trọng hơn nhiều trong việc chia sẻ dữ liệu của mình.

Khi dữ liệu được trích xuất từ con người thông qua hạ tầng giám sát (surveillance), quyền riêng tư không nhất thiết bị xói mòn mà đúng hơn là bị chuyển giao cho bên thu thập dữ liệu. Các công ty thu được dữ liệu về thực chất đang nói: “Hãy tin rằng chúng tôi sẽ làm điều đúng đắn với dữ liệu của bạn,” điều đó có nghĩa là quyền quyết định tiết lộ điều gì và giữ bí mật điều gì được chuyển từ cá nhân sang công ty.

Đến lượt mình, các công ty lại chọn giữ bí mật phần lớn kết quả của hoạt động giám sát này, bởi nếu tiết lộ ra thì sẽ bị coi là đáng sợ (creepy) và sẽ gây tổn hại đến mô hình kinh doanh của họ (vốn dựa trên việc biết về con người nhiều hơn các công ty khác). Thông tin thân mật về người dùng chỉ được tiết lộ một cách gián tiếp—chẳng hạn, dưới dạng các công cụ nhắm quảng cáo đến những nhóm người cụ thể (như những người mắc một căn bệnh nào đó).

Ngay cả khi không thể tái định danh từng người dùng cụ thể từ nhóm người được một quảng cáo nào đó nhắm tới, họ vẫn đã mất đi quyền tự quyết (agency) đối với việc tiết lộ một số thông tin thân mật. Không phải người dùng là người quyết định điều gì được tiết lộ cho ai dựa trên sở thích cá nhân của họ—mà chính công ty là bên thực thi quyền riêng tư đó với mục tiêu tối đa hóa lợi nhuận của mình.

Nhiều công ty muốn tránh bị *coi là* đáng sợ, né tránh câu hỏi về việc hoạt động thu thập dữ liệu của họ thực sự xâm phạm đến mức nào, và thay vào đó tập trung vào việc quản lý cảm nhận của người dùng. Và ngay cả những cảm nhận này cũng thường được quản lý kém—chẳng hạn, một điều gì đó có thể đúng về mặt thực tế, nhưng nếu nó gợi lại những ký ức đau buồn, người dùng có thể không muốn bị nhắc đến nó [35]. Với bất kỳ loại dữ liệu nào, chúng ta nên lường trước khả năng nó sai, không mong muốn, hoặc không phù hợp theo cách nào đó, và chúng ta cần xây dựng các cơ chế để xử lý những thất bại đó. Việc một điều gì đó là “không mong muốn” hay “không phù hợp” dĩ nhiên tùy thuộc vào phán đoán của con người; các thuật toán hoàn toàn không biết đến những khái niệm như vậy trừ khi chúng ta lập trình rõ ràng để chúng tôn trọng nhu cầu của con người. Là những kỹ sư xây dựng các hệ thống này, chúng ta phải khiêm nhường, chấp nhận và có kế hoạch đối phó với những thiếu sót như vậy.

Các thiết lập quyền riêng tư cho phép người dùng của một dịch vụ trực tuyến kiểm soát những khía cạnh nào trong dữ liệu của họ mà người dùng khác có thể thấy là điểm khởi đầu để trao lại một phần quyền kiểm soát cho người dùng. Tuy nhiên, bất kể thiết lập thế nào, bản thân dịch vụ vẫn có quyền truy cập không giới hạn vào dữ liệu và được tự do sử dụng nó theo bất kỳ cách nào mà chính sách quyền riêng tư cho phép. Ngay cả khi dịch vụ hứa không bán dữ liệu cho bên thứ ba, nó thường tự trao cho mình quyền không hạn chế trong việc xử lý và phân tích dữ liệu nội bộ, thường đi xa hơn nhiều so với những gì người dùng nhìn thấy một cách rõ ràng.

Kiểu chuyển giao quyền riêng tư quy mô lớn từ cá nhân sang các tập đoàn như thế này là chưa từng có tiền lệ trong lịch sử [30]. Giám sát luôn tồn tại, nhưng trước đây nó tốn kém và thủ công, không có khả năng mở rộng và tự động hóa. Các mối quan hệ tin cậy cũng luôn tồn tại—ví dụ, giữa bệnh nhân và bác sĩ, hay giữa bị cáo và luật sư của họ—nhưng trong những trường hợp này, việc sử dụng dữ liệu được quản lý chặt chẽ bởi các ràng buộc đạo đức, pháp lý và quy định. Các dịch vụ Internet đã làm cho việc tích lũy lượng lớn thông tin nhạy cảm mà không có sự đồng ý thực chất trở nên dễ dàng hơn nhiều, và sử dụng nó ở quy mô khổng lồ mà người dùng không hiểu điều gì đang xảy ra với dữ liệu riêng tư của họ.

### Dữ liệu là tài sản và quyền lực

Vì dữ liệu hành vi là sản phẩm phụ của việc người dùng tương tác với một dịch vụ, nó đôi khi được gọi là “data exhaust” (khí thải dữ liệu)—hàm ý rằng dữ liệu đó là phế liệu vô giá trị. Nhìn theo cách này, phân tích hành vi và phân tích dự đoán có thể được xem như một hình thức tái chế, trích xuất giá trị từ dữ liệu mà nếu không thì đã bị vứt đi.

Đúng hơn sẽ là nhìn theo chiều ngược lại. Từ góc độ kinh tế, nếu quảng cáo nhắm mục tiêu là thứ trả tiền cho một dịch vụ, thì hoạt động của người dùng tạo ra dữ liệu hành vi có thể được xem là một hình thức lao động [36]. Người ta thậm chí có thể đi xa hơn và lập luận rằng ứng dụng mà người dùng tương tác chỉ đơn thuần là phương tiện để dụ dỗ người dùng đưa ngày càng nhiều thông tin cá nhân vào hạ tầng giám sát [30]. Sự sáng tạo đáng yêu của con người và các mối quan hệ xã hội vốn thường được thể hiện qua các dịch vụ trực tuyến bị cỗ máy trích xuất dữ liệu khai thác một cách đầy toan tính.

Dữ liệu cá nhân là một tài sản có giá trị, bằng chứng là sự tồn tại của các nhà môi giới dữ liệu (data broker) hoạt động trong bí mật, mua, tổng hợp, phân tích và bán lại dữ liệu cá nhân của mọi người, chủ yếu cho mục đích marketing [20]. Các startup được định giá theo số lượng người dùng, hay “eyeballs” (số cặp mắt)—tức là theo năng lực giám sát của họ.

Vì dữ liệu có giá trị, nhiều người muốn có nó. Dĩ nhiên, các công ty muốn có nó—đó là lý do họ thu thập nó ngay từ đầu. Nhưng các chính phủ cũng muốn có nó, và họ có thể tìm cách chiếm được nó bằng các thỏa thuận bí mật, ép buộc, cưỡng chế pháp lý, hoặc đơn giản là đánh cắp [37]. Khi một công ty phá sản, dữ liệu cá nhân mà nó đã thu thập là một trong những tài sản bị bán đi. Và vì dữ liệu khó bảo mật, các vụ rò rỉ dữ liệu (breach) xảy ra thường xuyên đến mức đáng lo ngại.

Những quan sát này đã khiến các nhà phê bình nói rằng dữ liệu không chỉ là một tài sản, mà là một “tài sản độc hại” [37], hoặc ít nhất là “vật liệu nguy hiểm” [38]. Có lẽ dữ liệu không phải là vàng mới, hay dầu mỏ mới, mà đúng hơn là uranium mới [39]. Ngay cả khi chúng ta nghĩ rằng mình có khả năng ngăn chặn việc lạm dụng dữ liệu, mỗi khi thu thập nó, chúng ta cần cân bằng giữa lợi ích và rủi ro dữ liệu rơi vào tay kẻ xấu. Các hệ thống máy tính có thể bị tội phạm hoặc cơ quan tình báo nước ngoài thù địch xâm nhập, dữ liệu có thể bị người trong nội bộ làm rò rỉ, công ty có thể rơi vào tay ban lãnh đạo vô đạo đức không chia sẻ các giá trị của chúng ta, hoặc đất nước có thể bị thâu tóm bởi một chế độ không hề ngần ngại buộc chúng ta phải giao nộp dữ liệu.

Như nhận xét đó gợi ra, khi thu thập dữ liệu, chúng ta cần cân nhắc không chỉ môi trường chính trị hiện tại, mà cả mọi chính phủ có thể có trong tương lai. Không có gì bảo đảm rằng mọi chính phủ được bầu lên trong tương lai đều sẽ tôn trọng nhân quyền và các quyền tự do dân sự, và như Bruce Schneier nhận xét, “Việc triển khai những công nghệ mà một ngày nào đó có thể tiếp tay cho một nhà nước cảnh sát là một thói quen công dân kém lành mạnh” [40].

“Tri thức là quyền lực,” như câu ngạn ngữ xưa vẫn nói. Và hơn nữa, “Soi xét người khác trong khi bản thân tránh được sự soi xét là một trong những hình thức quyền lực quan trọng nhất” [41]. Đây là lý do các chính phủ toàn trị muốn giám sát: nó cho họ quyền lực để kiểm soát dân chúng. Mặc dù các công ty công nghệ ngày nay không công khai tìm kiếm quyền lực chính trị, dữ liệu và tri thức mà họ đã tích lũy—phần lớn một cách lén lút, nằm ngoài sự giám sát của công chúng—dù vậy vẫn trao cho họ rất nhiều quyền lực đối với cuộc sống của chúng ta [42].

### Nhớ lại cuộc Cách mạng Công nghiệp

Dữ liệu là đặc trưng định hình của thời đại thông tin. Internet, việc lưu trữ và xử lý dữ liệu, cùng tự động hóa dựa trên phần mềm đang có tác động lớn đến nền kinh tế toàn cầu và xã hội loài người. Khi cuộc sống hàng ngày và tổ chức xã hội của chúng ta đã bị công nghệ thông tin thay đổi, và có lẽ sẽ tiếp tục thay đổi triệt để trong những thập kỷ tới, sự so sánh với cuộc Cách mạng Công nghiệp tự nhiên hiện lên trong đầu [17, 26].

Cuộc Cách mạng Công nghiệp ra đời nhờ những tiến bộ lớn về công nghệ và nông nghiệp, và nó mang lại tăng trưởng kinh tế bền vững cùng mức sống được cải thiện đáng kể về lâu dài—nhưng nó cũng đi kèm với những vấn đề lớn. Ô nhiễm không khí (do khói và các quy trình hóa học) và ô nhiễm nước (từ chất thải công nghiệp và chất thải sinh hoạt) là khủng khiếp. Các chủ nhà máy sống trong xa hoa, trong khi công nhân thành thị thường sống trong những khu nhà chật chội, mất vệ sinh và làm việc nhiều giờ trong điều kiện khắc nghiệt. Lao động trẻ em rất phổ biến, bao gồm cả công việc nguy hiểm và được trả lương thấp trong các hầm mỏ.

Phải mất một thời gian dài trước khi các biện pháp bảo vệ được thiết lập, như các quy định bảo vệ môi trường, quy trình an toàn nơi làm việc, luật cấm lao động trẻ em, và kiểm tra vệ sinh thực phẩm. Không thể phủ nhận rằng chi phí kinh doanh đã tăng lên khi các nhà máy không còn được phép đổ chất thải ra sông, bán thực phẩm nhiễm bẩn, hay bóc lột công nhân. Nhưng xã hội nói chung đã được hưởng lợi to lớn từ những quy định này, và rất ít người trong chúng ta muốn quay lại thời kỳ trước đó [17].

Giống như cuộc Cách mạng Công nghiệp có một mặt tối cần được kiểm soát, quá trình chuyển đổi của chúng ta sang thời đại thông tin cũng có những vấn đề lớn mà chúng ta cần đối mặt và giải quyết [43, 44]. Việc thu thập và sử dụng dữ liệu là một trong những vấn đề đó. Theo lời của Bruce Schneier [26]:

- *Dữ liệu là vấn đề ô nhiễm của thời đại thông tin, và bảo vệ quyền riêng tư là thách thức môi trường. Hầu như mọi máy tính đều tạo ra thông tin. Nó tồn tại dai dẳng, mưng mủ. Cách chúng ta xử lý nó—cách chúng ta kiềm chế nó và cách chúng ta loại bỏ nó—là trọng tâm đối với sức khỏe của nền kinh tế thông tin của chúng ta. Giống như ngày nay chúng ta nhìn lại những thập kỷ đầu của thời đại công nghiệp và tự hỏi làm sao tổ tiên chúng ta có thể bỏ qua vấn đề ô nhiễm trong cơn vội vã xây dựng một thế giới công nghiệp, con cháu chúng ta sẽ nhìn lại chúng ta trong những thập kỷ đầu này của thời đại thông tin và phán xét chúng ta về cách chúng ta đã giải quyết thách thức của việc thu thập và lạm dụng dữ liệu.*

- *Chúng ta nên cố gắng làm cho họ tự hào.*

### Luật pháp và tự điều chỉnh

Các luật bảo vệ dữ liệu có thể giúp bảo toàn quyền của các cá nhân. Ví dụ, GDPR quy định rằng dữ liệu cá nhân phải được “thu thập cho các mục đích cụ thể, rõ ràng và hợp pháp, và không được xử lý thêm theo cách không tương thích với các mục đích đó” và phải “thích đáng, có liên quan và giới hạn ở mức cần thiết so với các mục đích mà [nó được] xử lý” [32].

Tuy nhiên, nguyên tắc *data minimization* (tối thiểu hóa dữ liệu) này đi ngược lại trực tiếp với triết lý của big data, đó là tối đa hóa việc thu thập dữ liệu, kết hợp dữ liệu đã thu thập với các tập dữ liệu (dataset) khác, và thử nghiệm, khám phá để tạo ra những hiểu biết mới. Khám phá có nghĩa là sử dụng dữ liệu cho những mục đích không lường trước, điều mà GDPR cho là trái ngược với các mục đích “cụ thể và rõ ràng” mà dữ liệu phải được thu thập vì chúng. Mặc dù quy định này đã có một số tác động đến ngành quảng cáo trực tuyến [45], nó được thực thi yếu ớt [46] và dường như không dẫn đến nhiều thay đổi về văn hóa và thực hành trong ngành công nghệ nói chung.

Các công ty thu thập nhiều dữ liệu về con người nhìn chung phản đối quy định pháp lý, coi đó là gánh nặng và rào cản đối với đổi mới. Ở một mức độ nào đó, sự phản đối này là có cơ sở. Ví dụ, chia sẻ dữ liệu y tế tạo ra những rủi ro rõ ràng đối với quyền riêng tư nhưng cũng mang lại những cơ hội tiềm năng: bao nhiêu ca tử vong có thể được ngăn chặn nếu phân tích dữ liệu có thể giúp chúng ta chẩn đoán tốt hơn hoặc tìm ra phương pháp điều trị tốt hơn [47]? Quy định quá mức có thể ngăn cản những đột phá như vậy. Rất khó để cân bằng giữa những cơ hội tiềm năng và các rủi ro [41].

Về căn bản, chúng ta cần một sự thay đổi văn hóa trong ngành công nghệ đối với dữ liệu cá nhân. Chúng ta nên ngừng coi người dùng là những chỉ số (metric) cần được tối ưu hóa, và nhớ rằng họ là những con người xứng đáng được tôn trọng, có phẩm giá và quyền tự quyết. Chúng ta nên tự điều chỉnh các thực hành thu thập và xử lý dữ liệu của mình để thiết lập và duy trì niềm tin của những người phụ thuộc vào phần mềm của chúng ta [48]. Và chúng ta nên tự nhận lấy trách nhiệm giáo dục người dùng cuối về cách dữ liệu của họ được sử dụng thay vì giữ họ trong bóng tối.

Chúng ta nên cho phép mỗi cá nhân duy trì quyền riêng tư của họ (tức là quyền kiểm soát dữ liệu của chính họ) và không đánh cắp quyền kiểm soát đó khỏi họ thông qua giám sát. Quyền cá nhân của chúng ta trong việc kiểm soát dữ liệu của mình giống như môi trường tự nhiên của một vườn quốc gia: nếu chúng ta không chủ động bảo vệ và chăm sóc nó, nó sẽ bị phá hủy. Đó sẽ là bi kịch của tài sản chung (tragedy of the commons), và tất cả chúng ta đều sẽ chịu thiệt vì điều đó. Giám sát khắp nơi không phải là điều không thể tránh khỏi. Chúng ta vẫn có thể ngăn chặn nó.

Bước đầu tiên, chúng ta không nên lưu giữ dữ liệu mãi mãi, mà hãy xóa nó ngay khi không còn cần thiết, và tối thiểu hóa những gì chúng ta thu thập ngay từ đầu [48, 49]. Dữ liệu bạn không có là dữ liệu không thể bị rò rỉ, bị đánh cắp, hay bị chính phủ buộc phải giao nộp. Nhìn chung, những thay đổi về văn hóa và thái độ sẽ là cần thiết. Là những người làm việc trong ngành công nghệ, nếu chúng ta không cân nhắc tác động xã hội của công việc mình làm, thì chúng ta đang không làm đúng công việc của mình [50].

## Tóm tắt

Đến đây chúng ta đã đi đến cuối cuốn sách. Chúng ta đã đi qua rất nhiều nội dung:

- Trong Chương 1, chúng ta đã đối chiếu hệ thống phân tích (analytical) và hệ thống vận hành (operational), so sánh cloud với tự vận hành (self-hosting), cân nhắc giữa hệ phân tán (distributed system) và hệ đơn nút (single-node), và thảo luận về việc cân bằng nhu cầu của doanh nghiệp với nhu cầu của người dùng.

- Trong Chương 2, chúng ta đã thấy cách định nghĩa một số yêu cầu phi chức năng, như hiệu năng, độ tin cậy, khả năng mở rộng và khả năng bảo trì.

- Trong Chương 3, chúng ta đã khám phá một phổ các mô hình dữ liệu (data model), bao gồm mô hình quan hệ, document và graph, event sourcing, và DataFrame. Chúng ta cũng đã xem các ví dụ về nhiều ngôn ngữ truy vấn khác nhau, bao gồm SQL, Cypher, SPARQL, Datalog và GraphQL.

- Trong Chương 4, chúng ta đã thảo luận về các storage engine cho OLTP (LSM-tree và B-tree) và cho phân tích (lưu trữ hướng cột), cũng như các index cho truy hồi thông tin (tìm kiếm toàn văn và tìm kiếm vector).

- Trong Chương 5, chúng ta đã xem xét các cách khác nhau để encoding các đối tượng dữ liệu thành byte và cách hỗ trợ sự tiến hóa (evolution) khi yêu cầu thay đổi. Chúng ta cũng đã so sánh một số cách dữ liệu luân chuyển giữa các process: qua database, lời gọi dịch vụ, workflow engine và kiến trúc hướng sự kiện (event-driven). Trong Chương 6, chúng ta đã nghiên cứu sự đánh đổi (trade-off) giữa replication single-leader, multi-leader và leaderless. Chúng ta cũng đã xem các mô hình nhất quán (consistency model) như read-after-write consistency và các sync engine cho phép client làm việc offline.

- Trong Chương 7, chúng ta đã xem xét sharding, bao gồm các chiến lược rebalancing, định tuyến request và secondary index.

- Trong Chương 8, chúng ta đã đề cập đến transaction, xem xét tính bền vững (durability), cách đạt được các mức cô lập (isolation level) khác nhau (read committed, snapshot isolation và serializable), và cách bảo đảm tính nguyên tử (atomicity) trong các transaction phân tán.

- Trong Chương 9, chúng ta đã khảo sát những vấn đề căn bản xảy ra trong hệ phân tán (lỗi và độ trễ mạng, sai số đồng hồ, process bị tạm dừng, sự cố crash) và thấy chúng khiến việc triển khai đúng ngay cả một thứ tưởng chừng đơn giản như lock cũng trở nên khó khăn.

- Trong Chương 10, chúng ta đã đi sâu vào các hình thức consensus khác nhau và mô hình nhất quán (linearizability) mà nó cho phép.

- Trong Chương 11, chúng ta đã đào sâu vào batch processing, xây dựng dần từ những chuỗi công cụ Unix đơn giản đến các bộ xử lý batch phân tán quy mô lớn sử dụng hệ thống tệp phân tán hoặc object storage.

- Trong Chương 12, chúng ta đã tổng quát hóa batch processing thành stream processing và thảo luận về các message broker nền tảng, CDC, khả năng chịu lỗi, và các mẫu xử lý như streaming join.

- Trong Chương 13, chúng ta đã khám phá một triết lý về các hệ thống streaming cho phép tích hợp các hệ thống dữ liệu khác biệt, tiến hóa các hệ thống, và mở rộng ứng dụng dễ dàng hơn.

Cuối cùng, trong chương cuối này, chúng ta đã lùi lại một bước và xem xét một số khía cạnh đạo đức của việc xây dựng các ứng dụng thâm dụng dữ liệu (data-intensive). Chúng ta đã thấy rằng mặc dù dữ liệu có thể được dùng để làm điều tốt, nó cũng có thể gây tổn hại đáng kể: đưa ra những quyết định ảnh hưởng nghiêm trọng đến cuộc sống của con người và khó có thể khiếu nại, dẫn đến phân biệt đối xử và bóc lột, bình thường hóa việc giám sát, và phơi bày thông tin thân mật. Chúng ta cũng đối mặt với rủi ro rò rỉ dữ liệu, và có thể nhận ra rằng một cách sử dụng dữ liệu với ý định tốt lại mang đến những hậu quả không mong muốn.

Với tác động to lớn mà phần mềm và dữ liệu có đối với thế giới, chúng ta, những kỹ sư, phải nhớ rằng mình mang trách nhiệm hướng tới kiểu thế giới mà chúng ta muốn sống: một thế giới đối xử với con người bằng lòng nhân ái và sự tôn trọng. Hãy cùng nhau làm việc vì mục tiêu đó.

#### Tài liệu tham khảo

[1] David Schmudde. [“What If Data Is a Bad Idea?”](https://schmud.de/posts/2024-08-18-data-is-a-bad-idea.html) *schmud.de*, August 2024. Archived at [*perma.cc/ZXU5-XMCT*](https://perma.cc/ZXU5-XMCT)

[2] Association for Computing Machinery. [“ACM Code of Ethics and Professional Conduct.”](https://www.acm.org/code-of-ethics) *acm.org*, 2018. Archived at [*perma.cc/SEA8-CMB8*](https://perma.cc/SEA8-CMB8)

[3] Igor Perisic. [“Making Hard Choices: The Quest for Ethics in Machine Learning.”](https://www.linkedin.com/blog/engineering/archive/making-hard-choices-the-quest-for-ethics-in-machine-learning) *linkedin.com*, November 2016. Archived at [*perma.cc/DGF8-KNT7*](https://perma.cc/DGF8-KNT7)

[4] John Naughton. [“Algorithm Writers Need a Code of Conduct.”](https://www.theguardian.com/commentisfree/2015/dec/06/algorithm-writers-should-have-code-of-conduct) *theguardian.com*, December 2015. Archived at [*perma.cc/TBG2-3NG6*](https://perma.cc/TBG2-3NG6)

[5] Deborah G. Johnson and Mario Verdicchio. [“Ethical AI Is Not About AI.”](https://cacm.acm.org/opinion/ethical-ai-is-not-about-ai/) *Communications of the ACM*, volume 66, issue 2, pages 32–34, January 2023. [*doi:10.1145/3576932*](https://doi.org/10.1145/3576932)

[6] Ben Green. [“‘Good’ Isn’t Good Enough.”](https://www.benzevgreen.com/wp-content/uploads/2019/11/19-ai4sg.pdf) At *NeurIPS Joint Workshop on AI for Social Good*, December 2019. Archived at [*perma.cc/H4LN-7VY3*](https://perma.cc/H4LN-7VY3)

[7] Marc Steen. [“Ethics as a Participatory and Iterative Process.”](https://cacm.acm.org/opinion/ethics-as-a-participatory-and-iterative-process/) *Communications of the ACM*, volume 66, issue 5, pages 27–29, April 2023. [*doi:10.1145/3550069*](https://doi.org/10.1145/3550069)

[8] Logan Kugler. [“What Happens When Big Data Blunders?”](https://cacm.acm.org/news/what-happens-when-big-data-blunders/) *Communications of the ACM*, volume 59, issue 6, pages 15–16, June 2016. [*doi:10.1145/2911975*](https://doi.org/10.1145/2911975)

[9] Miri Zilka. [“Algorithms and the Criminal Justice System: Promises and Challenges in Deployment and Research.”](https://www.cl.cam.ac.uk/research/security/seminars/archive/video/2023-03-07-t196231.html) At *University of Cambridge Security Seminar Series*, March 2023. Archived at [*archive.org*](https://web.archive.org/web/20250219090946/https://www.cl.cam.ac.uk/research/security/seminars/archive/video/2023-03-07-t196231.html)

[10] Bill Davidow. [“Welcome to Algorithmic Prison.”](https://www.theatlantic.com/technology/archive/2014/02/welcome-to-algorithmic-prison/283985/) *theatlantic.com*, February 2014. Archived at [*archive.org*](https://web.archive.org/web/20171019201812/https://www.theatlantic.com/technology/archive/2014/02/welcome-to-algorithmic-prison/283985/)

[11] Don Peck. [“They’re Watching You at Work.”](https://www.theatlantic.com/magazine/archive/2013/12/theyre-watching-you-at-work/354681/) *theatlantic.com*, December 2013. Archived at [*perma.cc/YR9T-6M38*](https://perma.cc/YR9T-6M38)

[12] Leigh Alexander. [“Is an Algorithm Any Less Racist Than a Human?”](https://www.theguardian.com/technology/2016/aug/03/algorithm-racist-human-employers-work) *theguardian.com*, August 2016. Archived at [*perma.cc/XP93-DSVX*](https://perma.cc/XP93-DSVX)

[13] Jesse Emspak. [“How a Machine Learns Prejudice.”](https://www.scientificamerican.com/article/how-a-machine-learns-prejudice/) *scientificamerican.com*, December 2016. [perma.cc/R3L5-55E6](https://perma.cc/R3L5-55E6)

[14] Rohit Chopra, Kristen Clarke, Charlotte A. Burrows, and Lina M. Khan. [“Joint Statement on Enforcement Efforts Against Discrimination and Bias in Automated Systems.”](https://www.ftc.gov/system/files/ftc_gov/pdf/EEOC-CRT-FTC-CFPB-AI-Joint-Statement%28final%29.pdf) *ftc.gov*, April 2023. Archived at [*perma.cc/YY4Y-RCCA*](https://perma.cc/YY4Y-RCCA)

[15] Maciej Cegłowski. [“The Moral Economy of Tech.”](https://idlewords.com/talks/sase_panel.htm) *idlewords.com*, June 2016. Archived at [*perma.cc/L8XV-BKTD*](https://perma.cc/L8XV-BKTD)

[16] Greg Nichols. [“Artificial Intelligence in Healthcare Is Racist.”](https://www.zdnet.com/article/artificial-intelligence-in-healthcare-is-racist/) *zdnet.com*, November 2020. Archived at [*perma.cc/3MKW-YKRS*](https://perma.cc/3MKW-YKRS)

[17] Cathy O’Neil. *Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy*. Crown Publishing, 2016. ISBN: 9780553418811

[18] Julia Angwin. [“Make Algorithms Accountable.”](https://www.nytimes.com/2016/08/01/opinion/make-algorithms-accountable.html) *nytimes.com*, August 2016. Archived at [*archive.org*](https://web.archive.org/web/20230819055242/https://www.nytimes.com/2016/08/01/opinion/make-algorithms-accountable.html)

[19] Bryce Goodman and Seth Flaxman. [“European Union Regulations on Algorithmic Decision-Making and a ‘Right to Explanation.’”](https://arxiv.org/abs/1606.08813) At *ICML Workshop on Human Interpretability in Machine Learning*, June 2016. Archived at [*arxiv.org*](https://arxiv.org/abs/1606.08813)

[20] United States Senate Committee on Commerce, Science, and Transportation, Office of Oversight and Investigations, Majority Staff. [“A Review of the Data Broker Industry: Collection, Use, and Sale of Consumer Data for Marketing Purposes.”](https://www.commerce.senate.gov/services/files/0d2b3642-6221-4888-a631-08f2f255b577) Staff Report, *commerce.senate.gov*, December 2013. Archived at [*perma.cc/32NV-* *YWLQ*](https://perma.cc/32NV-YWLQ)

[21] Stephanie Assad, Robert Clark, Daniel Ershov, and Lei Xu. [“Algorithmic Pricing and Competition: Empirical Evidence from the German Retail Gasoline Market.”](https://economics.yale.edu/sites/default/files/clark_acex_jan_2021.pdf) *Journal of Political Economy*, volume 132, issue 3, pages 723–771, March 2024. [*doi:10.1086/726906*](https://doi.org/10.1086/726906)

[22] Donella H. Meadows and Diana Wright. *Thinking in Systems: A Primer*. Chelsea Green Publishing, 2008. ISBN: 9781603580557

[23] Daniel J. Bernstein. [“Listening to a ‘big data’/‘data science’ talk. Mentally translat- ing ‘data’ to '‘surveillance’: ‘…everything starts with surveillance…’”](https://x.com/hashbreaker/status/598076230437568512) *x.com*, May 2015. Archived at [*perma.cc/EY3D-WBBJ*](https://perma.cc/EY3D-WBBJ)

[24] Marc Andreessen. [“Why Software Is Eating the World.”](https://a16z.com/why-software-is-eating-the-world/) *a16z.com*, August 2011. Archived at [*perma.cc/3DCC-W3G6*](https://perma.cc/3DCC-W3G6)

[25] J. M. Porup. [“‘Internet of Things’ Security Is Hilariously Broken and Getting Worse.”](https://arstechnica.com/information-technology/2016/01/how-to-search-the-internet-of-things-for-photos-of-sleeping-babies/) *arstechnica.com*, January 2016. Archived at [*archive.org*](https://web.archive.org/web/20250823001716/https://arstechnica.com/information-technology/2016/01/how-to-search-the-internet-of-things-for-photos-of-sleeping-babies/)

[26] Bruce Schneier. [*Data and Goliath: The Hidden Battles to Collect Your Data and* *Control Your World*.](https://www.schneier.com/books/data_and_goliath/) W. W. Norton, 2015. ISBN: 9780393352177

[27] The Grugq. [“Nothing to Hide.”](https://grugq.tumblr.com/post/142799983558/nothing-to-hide) *grugq.tumblr.com*, April 2016. Archived at [*perma.cc/BL95-8W5M*](https://perma.cc/BL95-8W5M)

[28] Federal Trade Commission. [“FTC Takes Action Against General Motors for Sharing Drivers’ Precise Location and Driving Behavior Data Without Consent.”](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-takes-action-against-general-motors-sharing-drivers-precise-location-driving-behavior-data) *ftc.gov*, January 2025. Archived at [*perma.cc/3XGV-3HRD*](https://perma.cc/3XGV-3HRD)

[29] Tony Beltramelli. [“Deep-Spying: Spying Using Smartwatch and Deep Learning.”](https://arxiv.org/abs/1512.05616) Masters thesis, IT University of Copenhagen, December 2015. Archived at [*arx-* *iv.org*](https://arxiv.org/abs/1512.05616)

[30] Shoshana Zuboff. [“Big Other: Surveillance Capitalism and the Prospects of an Information Civilization.”](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2594754) *Journal of Information Technology*, volume 30, issue 1, pages 75–89, April 2015. [*doi:10.1057/jit.2015.5*](https://doi.org/10.1057/jit.2015.5)

[31] Michiel Rhoen. [“Beyond Consent: Improving Data Protection Through Consumer Protection Law.”](https://policyreview.info/articles/analysis/beyond-consent-improving-data-protection-through-consumer-protection-law) *Internet Policy Review*, volume 5, issue 1, March 2016. [*doi:10.14763/2016.1.404*](https://doi.org/10.14763/2016.1.404)

[32] [“Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016.”](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) *Official Journal of the European Union*, L 119/1, May 2016.

[33] UK Information Commissioner’s Office. [“What Is the ‘Legitimate Interests’ Basis?”](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/what-is-the-legitimate-interests-basis/) *ico.org.uk*. Archived at [*perma.cc/W8XR-F7ML*](https://perma.cc/W8XR-F7ML)

[34] Tristan Harris. [“How a Handful of Tech Companies Control Billions of Minds Every Day.”](https://www.ted.com/talks/tristan_harris_how_a_handful_of_tech_companies_control_billions_of_minds_every_day) At *TED2017*, April 2017. Archived at [*archive.org*](https://web.archive.org/web/20250915195357/https://www.ted.com/talks/tristan_harris_how_a_handful_of_tech_companies_control_billions_of_minds_every_day)

[35] Carina C. Zona. [“Consequences of an Insightful Algorithm.”](https://www.youtube.com/watch?v=YRI40A4tyWU) At *GOTO Berlin*, November 2016.

[36] Imanol Arrieta Ibarra, Leonard Goff, Diego Jiménez Hernández, Jaron Lanier, and E. Glen Weyl. [“Should We Treat Data as Labor? Moving Beyond ‘Free.’”](https://www.aeaweb.org/conference/2018/preliminary/paper/2Y7N88na) *American Economic Association Papers Proceedings*, volume 108, pages 38–42, May 2018. *doi:10.1257/pandp.20181003*

[37] Bruce Schneier. [“Data Is a Toxic Asset, So Why Not Throw It Out?”](https://www.schneier.com/essays/archives/2016/03/data_is_a_toxic_asse.html) *schneier.com*, March 2016. Archived at [*perma.cc/4GZH-WR3D*](https://perma.cc/4GZH-WR3D)

[38] Cory Scott. [“Data is not toxic—which implies no benefit—but rather hazardous material, where we must balance need vs. want.”](https://x.com/cory_scott/status/706586399483437056) *x.com*, March 2016. Archived at [*perma.cc/CLV7-JF2E*](https://perma.cc/CLV7-JF2E)

[39] Mark Pesce. [“Data Is The New Uranium—Incredibly Powerful And Amazingly Dangerous.”](https://www.theregister.com/2024/11/20/data_is_the_new_uranium/) *theregister.com*, November 2024. Archived at [*perma.cc/NV8B-GYGV*](https://perma.cc/NV8B-GYGV)

[40] Bruce Schneier. [“Mission Creep: When Everything Is Terrorism.”](https://www.schneier.com/essays/archives/2013/07/mission_creep_when_e.html) *schneier.com*, July 2013. Archived at [*perma.cc/QB2C-5RCE*](https://perma.cc/QB2C-5RCE)

[41] Lena Ulbricht and Maximilian von Grafenstein. [“Big Data: Big Power Shifts?”](https://policyreview.info/articles/analysis/big-data-big-power-shifts) *Internet Policy Review*, volume 5, issue 1, March 2016. [*doi:10.14763/2016.1.406*](https://doi.org/10.14763/2016.1.406)

[42] Ellen P. Goodman and Julia Powles. [“Facebook and Google: Most Powerful and Secretive Empires We’ve Ever Known.”](https://www.theguardian.com/technology/2016/sep/28/google-facebook-powerful-secretive-empire-transparency) *theguardian.com*, September 2016. Archived at [*perma.cc/8UJA-43G6*](https://perma.cc/8UJA-43G6)

[43] Judy Estrin and Sam Gill. [“The World Is Choking on Digital Pollution.”](https://washingtonmonthly.com/2019/01/13/the-world-is-choking-on-digital-pollution/) *washington-monthly.com*, January 2019. Archived at [*perma.cc/3VHF-C6UC*](https://perma.cc/3VHF-C6UC)

[44] A. Michael Froomkin. [“Regulating Mass Surveillance as Privacy Pollution: Learning from Environmental Impact Statements.”](https://repository.law.miami.edu/cgi/viewcontent.cgi?article=1062&context=fac_articles) *University of Illinois Law Review*, volume 2015, issue 5, August 2015. Archived at [*perma.cc/24ZL-VK2T*](https://perma.cc/24ZL-VK2T)

[45] Pengyuan Wang, Li Jiang, and Jian Yang. [“The Early Impact of GDPR Compliance on Display Advertising: The Case of an Ad Publisher.”](https://openreview.net/pdf?id=TUnLHNo19S) *Journal of Marketing Research*, volume 61, issue 1, April 2023. [*doi:10.1177/00222437231171848*](https://doi.org/10.1177/00222437231171848)

[46] Johnny Ryan. [“Don’t Be Fooled by Meta’s Fine for Data Breaches.”](https://www.economist.com/by-invitation/2023/05/24/dont-be-fooled-by-metas-fine-for-data-breaches-says-johnny-ryan) *The Economist*, May 2023. Archived at [*perma.cc/VCR6-55HR*](https://perma.cc/VCR6-55HR)

[47] Jessica Leber. [“Your Data Footprint Is Affecting Your Life in Ways You Can’t Even Imagine.”](https://www.fastcompany.com/3057514/your-data-footprint-is-affecting-your-life-in-ways-you-cant-even-imagine) *fastcompany.com*, March 2016. Archived at [*archive.org*](https://web.archive.org/web/20161128133016/https://www.fastcoexist.com/3057514/your-data-footprint-is-affecting-your-life-in-ways-you-cant-even-imagine)

[48] Maciej Cegłowski. [“Haunted by Data.”](https://idlewords.com/talks/haunted_by_data.htm) *idlewords.com*, October 2015. Archived at [*archive.org*](https://web.archive.org/web/20161130143932/https://idlewords.com/talks/haunted_by_data.htm)

[49] Sam Thielman. [“You Are Not What You Read: Librarians Purge User Data to Protect Privacy.”](https://www.theguardian.com/us-news/2016/jan/13/us-library-records-purged-data-privacy) *theguardian.com*, January 2016. Archived at [*archive.org*](https://web.archive.org/web/20250828224851/https://www.theguardian.com/us-news/2016/jan/13/us-library-records-purged-data-privacy)

[50] Jez Humble. [“It’s a cliché that people get into tech to ‘change the world.’ So then, you have to actually consider what the impact of your work is on the world. The idea that you can or should exclude societal and political discussions in tech is idi- otic. It means you’re not doing your job.”](https://x.com/jezhumble/status/1386758340894597122) *x.com*, April 2021. Archived at [*perma.cc/3NYS-MHLC*](https://perma.cc/3NYS-MHLC)
