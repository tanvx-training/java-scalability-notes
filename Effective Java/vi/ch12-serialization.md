# Chương 12. Serialization

Chương này bàn về *object serialization* (tuần tự hóa đối tượng), tức là framework của Java dùng để mã hóa các đối tượng thành các luồng byte (*serializing*) và dựng lại các đối tượng từ bản mã hóa của chúng (*deserializing*). Một khi đối tượng đã được serialize, bản mã hóa của nó có thể được gửi từ VM này sang VM khác hoặc lưu trên đĩa để deserialize sau này. Chương này tập trung vào những mối nguy hiểm của serialization và cách giảm thiểu chúng.

## Item 85: Ưu tiên các giải pháp thay thế cho Java serialization

Khi serialization được thêm vào Java năm 1997, người ta đã biết rằng nó có phần rủi ro. Cách tiếp cận này từng được thử nghiệm trong một ngôn ngữ nghiên cứu (Modula-3) nhưng chưa bao giờ trong một ngôn ngữ dùng cho sản phẩm thực tế. Dù lời hứa hẹn về các đối tượng phân tán mà lập trình viên chỉ tốn rất ít công sức là rất hấp dẫn, cái giá phải trả là những constructor vô hình và ranh giới mờ nhạt giữa API và phần hiện thực, kéo theo nguy cơ về tính đúng đắn, hiệu năng, bảo mật và bảo trì. Những người ủng hộ tin rằng lợi ích lớn hơn rủi ro, nhưng lịch sử đã chứng minh điều ngược lại.

Các vấn đề bảo mật được mô tả trong những lần xuất bản trước của cuốn sách này hóa ra nghiêm trọng đúng như một số người đã lo ngại. Những lỗ hổng được bàn tới vào đầu những năm 2000 đã biến thành các cuộc khai thác nghiêm trọng trong thập kỷ tiếp theo, nổi tiếng nhất là cuộc tấn công ransomware vào San Francisco Metropolitan Transit Agency Municipal Railway (SFMTA Muni) làm tê liệt toàn bộ hệ thống thu vé trong hai ngày vào tháng 11 năm 2016 [**Gallagher16**].

Một vấn đề căn bản của serialization là *attack surface* (bề mặt tấn công) của nó quá lớn để có thể bảo vệ, và không ngừng mở rộng: Các đồ thị đối tượng được deserialize bằng cách gọi method `readObject` trên một `ObjectInputStream`. Method này về bản chất là một constructor "ma thuật" có thể bị lợi dụng để khởi tạo đối tượng của hầu như bất kỳ kiểu nào có trên class path, miễn là kiểu đó implement interface `Serializable`. Trong quá trình deserialize một luồng byte, method này có thể thực thi mã từ bất kỳ kiểu nào trong số đó, vì vậy mã của *tất cả* các kiểu này đều là một phần của attack surface.

Attack surface bao gồm các class trong thư viện nền tảng Java, trong các thư viện bên thứ ba như Apache Commons Collections, và trong chính ứng dụng. Ngay cả khi bạn tuân thủ mọi thực hành tốt nhất liên quan và viết được các class serializable không thể bị tấn công, ứng dụng của bạn vẫn có thể bị tổn thương. Xin trích lời Robert Seacord, quản lý kỹ thuật của CERT Coordination Center:

Java deserialization là một mối nguy hiểm rõ ràng và hiện hữu vì nó được sử dụng rộng rãi cả trực tiếp bởi các ứng dụng lẫn gián tiếp bởi các hệ thống con của Java như RMI (Remote Method Invocation), JMX (Java Management Extension) và JMS (Java Messaging System). Deserialize các luồng không đáng tin cậy có thể dẫn đến thực thi mã từ xa (RCE), từ chối dịch vụ (DoS) và hàng loạt cuộc khai thác khác. Các ứng dụng có thể bị tổn thương bởi những cuộc tấn công này ngay cả khi chúng không làm gì sai. [**Seacord17**]

Kẻ tấn công và các nhà nghiên cứu bảo mật nghiên cứu các kiểu serializable trong thư viện Java và trong các thư viện bên thứ ba thông dụng, tìm kiếm những method được gọi trong quá trình deserialization mà thực hiện các hoạt động tiềm ẩn nguy hiểm. Những method như vậy được gọi là *gadget*. Nhiều gadget có thể được dùng phối hợp để tạo thành một *gadget chain* (chuỗi gadget). Thỉnh thoảng người ta lại phát hiện ra một gadget chain đủ mạnh để cho phép kẻ tấn công thực thi mã native tùy ý trên phần cứng bên dưới, chỉ cần có cơ hội gửi một luồng byte được chế tác cẩn thận để deserialize. Đây chính xác là những gì đã xảy ra trong cuộc tấn công SFMTA Muni. Cuộc tấn công này không phải là trường hợp đơn lẻ. Đã có những cuộc tấn công khác, và sẽ còn nhiều nữa.

Không cần dùng bất kỳ gadget nào, bạn cũng có thể dễ dàng thực hiện một cuộc tấn công từ chối dịch vụ bằng cách khiến hệ thống deserialize một luồng ngắn nhưng mất rất nhiều thời gian để deserialize. Những luồng như vậy được gọi là *deserialization bomb* (bom deserialization) [**Svoboda16**]. Dưới đây là một ví dụ của Wouter Coekaerts chỉ dùng các hash set và một string [**Coekaerts15**]:

```java
// Deserialization bomb - deserializing this stream takes forever
static byte[] bomb() {
    Set<Object> root = new HashSet<>();
    Set<Object> s1 = root;
    Set<Object> s2 = new HashSet<>();
    for (int i = 0; i < 100; i++) {
        Set<Object> t1 = new HashSet<>();
        Set<Object> t2 = new HashSet<>();
        t1.add("foo"); // Make t1 unequal to t2
        s1.add(t1);  s1.add(t2);
        s2.add(t1);  s2.add(t2);
        s1 = t1;
        s2 = t2;
    }
    return serialize(root); // Method omitted for brevity
}
```

Đồ thị đối tượng gồm 201 instance `HashSet`, mỗi instance chứa không quá 3 tham chiếu đối tượng. Toàn bộ luồng chỉ dài 5.744 byte, thế nhưng mặt trời sẽ tắt lịm từ lâu trước khi bạn có thể deserialize xong nó. Vấn đề là việc deserialize một instance `HashSet` đòi hỏi phải tính hash code của các phần tử của nó. 2 phần tử của hash set gốc bản thân chúng là các hash set chứa 2 phần tử hash set, mỗi phần tử đó lại chứa 2 phần tử hash set, và cứ thế sâu 100 tầng. Do đó, deserialize tập hợp này khiến method `hashCode` bị gọi hơn 2^100 lần. Ngoài việc quá trình deserialization kéo dài vô tận, trình deserialize không hề có dấu hiệu nào cho thấy có điều gì bất thường. Chỉ có ít đối tượng được tạo ra, và độ sâu của stack là hữu hạn.

Vậy bạn có thể làm gì để phòng vệ trước những vấn đề này? Bạn tự đặt mình vào nguy cơ bị tấn công mỗi khi deserialize một luồng byte mà bạn không tin tưởng. **Cách tốt nhất để tránh các cuộc khai thác serialization là không bao giờ deserialize bất cứ thứ gì.** Nói theo lời của chiếc máy tính tên Joshua trong bộ phim *WarGames* năm 1983, "nước đi thắng duy nhất là không chơi." **Không có lý do gì để dùng Java serialization trong bất kỳ hệ thống mới nào bạn viết.** Có những cơ chế khác để chuyển đổi giữa đối tượng và chuỗi byte, tránh được nhiều mối nguy của Java serialization đồng thời mang lại vô số lợi thế, chẳng hạn như hỗ trợ đa nền tảng, hiệu năng cao, hệ sinh thái công cụ phong phú và cộng đồng chuyên gia rộng lớn. Trong cuốn sách này, chúng tôi gọi những cơ chế đó là *cross-platform structured-data representation* (biểu diễn dữ liệu có cấu trúc đa nền tảng). Dù đôi khi người khác gọi chúng là hệ thống serialization, cuốn sách này tránh cách gọi đó để không nhầm lẫn với Java serialization. Điểm chung của các biểu diễn này là chúng đơn giản hơn Java serialization *rất nhiều*. Chúng không hỗ trợ serialize và deserialize tự động các đồ thị đối tượng tùy ý. Thay vào đó, chúng hỗ trợ các đối tượng dữ liệu đơn giản, có cấu trúc, gồm một tập hợp các cặp thuộc tính–giá trị. Chỉ một số ít kiểu dữ liệu nguyên thủy và mảng được hỗ trợ. Sự trừu tượng đơn giản này hóa ra là đủ để xây dựng các hệ thống phân tán cực kỳ mạnh mẽ, và đủ đơn giản để tránh được những vấn đề nghiêm trọng đã đeo bám Java serialization từ khi nó ra đời.

Các biểu diễn dữ liệu có cấu trúc đa nền tảng hàng đầu là JSON [**JSON**] và Protocol Buffers, còn gọi là protobuf [**Protobuf**]. JSON được Douglas Crockford thiết kế cho giao tiếp giữa trình duyệt và server, còn protocol buffers được Google thiết kế để lưu trữ và trao đổi dữ liệu có cấu trúc giữa các server của họ. Dù các biểu diễn này đôi khi được gọi là *trung lập về ngôn ngữ*, JSON ban đầu được phát triển cho JavaScript và protobuf cho C++; cả hai biểu diễn đều còn giữ những dấu tích từ nguồn gốc của mình.

Những khác biệt đáng kể nhất giữa JSON và protobuf là: JSON dựa trên văn bản và con người đọc được, trong khi protobuf ở dạng nhị phân và hiệu quả hơn đáng kể; và JSON thuần túy chỉ là một biểu diễn dữ liệu, trong khi protobuf cung cấp *schema* (các kiểu) để tài liệu hóa và ép buộc cách sử dụng phù hợp. Dù protobuf hiệu quả hơn JSON, JSON cực kỳ hiệu quả đối với một biểu diễn dựa trên văn bản. Và dù protobuf là biểu diễn nhị phân, nó vẫn cung cấp một biểu diễn văn bản thay thế để dùng khi cần con người đọc được (pbtxt).

Nếu bạn không thể tránh Java serialization hoàn toàn, có lẽ vì bạn đang làm việc trong bối cảnh một hệ thống cũ (legacy) đòi hỏi nó, giải pháp tốt nhất tiếp theo là **không bao giờ deserialize dữ liệu không đáng tin cậy.** Đặc biệt, bạn không bao giờ nên chấp nhận lưu lượng RMI từ các nguồn không đáng tin cậy. Hướng dẫn lập trình an toàn chính thức của Java nói rằng "Deserialize dữ liệu không đáng tin cậy vốn dĩ là nguy hiểm và nên tránh." Câu này được in bằng chữ lớn, đậm, nghiêng, màu đỏ, và đó là đoạn văn bản duy nhất trong toàn bộ tài liệu được trình bày như vậy [Java-secure].

Nếu bạn không thể tránh serialization và bạn không tuyệt đối chắc chắn về sự an toàn của dữ liệu mình đang deserialize, hãy dùng cơ chế lọc deserialization đối tượng được thêm vào Java 9 và được backport về các phiên bản trước (`java.io.ObjectInputFilter`). Cơ chế này cho phép bạn chỉ định một bộ lọc được áp dụng lên các luồng dữ liệu trước khi chúng được deserialize. Nó hoạt động ở mức độ class, cho phép bạn chấp nhận hoặc từ chối những class nhất định. Mặc định chấp nhận các class và từ chối một danh sách các class có khả năng nguy hiểm được gọi là *blacklisting*; mặc định từ chối các class và chấp nhận một danh sách các class được cho là an toàn được gọi là *whitelisting*. **Hãy ưu tiên whitelisting hơn blacklisting**, vì blacklisting chỉ bảo vệ bạn trước những mối đe dọa đã biết. Một công cụ tên là Serial Whitelist Application Trainer (SWAT) có thể được dùng để tự động chuẩn bị whitelist cho ứng dụng của bạn [**Schneider16**]. Cơ chế lọc cũng sẽ bảo vệ bạn trước việc sử dụng bộ nhớ quá mức và các đồ thị đối tượng quá sâu, nhưng nó sẽ không bảo vệ bạn trước những serialization bomb như ví dụ ở trên.

Đáng tiếc là serialization vẫn còn phổ biến trong hệ sinh thái Java. Nếu bạn đang bảo trì một hệ thống dựa trên Java serialization, hãy nghiêm túc cân nhắc việc chuyển sang một biểu diễn dữ liệu có cấu trúc đa nền tảng, dù đây có thể là một nỗ lực tốn nhiều thời gian. Thực tế, bạn vẫn có thể thấy mình phải viết hoặc bảo trì một class serializable. Viết một class serializable đúng đắn, an toàn và hiệu quả đòi hỏi sự cẩn trọng rất lớn. Phần còn lại của chương này đưa ra lời khuyên về việc khi nào và làm thế nào để thực hiện điều đó.

Tóm lại, serialization là nguy hiểm và nên tránh. Nếu bạn đang thiết kế một hệ thống từ đầu, hãy dùng một biểu diễn dữ liệu có cấu trúc đa nền tảng như JSON hoặc protobuf thay thế. Đừng deserialize dữ liệu không đáng tin cậy. Nếu bạn buộc phải làm vậy, hãy dùng cơ chế lọc deserialization đối tượng, nhưng hãy lưu ý rằng nó không được đảm bảo sẽ ngăn chặn mọi cuộc tấn công. Tránh viết các class serializable. Nếu bạn buộc phải làm vậy, hãy hết sức thận trọng.

## Item 86: Implement `Serializable` với sự thận trọng cao độ

Cho phép các instance của một class được serialize có thể đơn giản chỉ là thêm cụm từ `implements Serializable` vào khai báo của nó. Vì việc này quá dễ, từng có một quan niệm sai lầm phổ biến rằng serialization đòi hỏi rất ít công sức từ phía lập trình viên. Sự thật phức tạp hơn nhiều. Dù chi phí trước mắt để làm cho một class trở nên serializable có thể không đáng kể, chi phí dài hạn thường rất lớn.

**Một chi phí lớn của việc implement** `Serializable` **là nó làm giảm tính linh hoạt trong việc thay đổi phần hiện thực của class sau khi đã phát hành.** Khi một class implement `Serializable`, bản mã hóa luồng byte của nó (hay *serialized form* – dạng tuần tự hóa) trở thành một phần của API được xuất ra. Một khi bạn đã phân phối rộng rãi một class, nói chung bạn buộc phải hỗ trợ serialized form đó mãi mãi, giống như bạn buộc phải hỗ trợ mọi phần khác của API được xuất ra. Nếu bạn không bỏ công thiết kế một *custom serialized form* (dạng tuần tự hóa tùy chỉnh) mà chỉ chấp nhận dạng mặc định, serialized form sẽ vĩnh viễn bị trói buộc vào biểu diễn nội bộ ban đầu của class. Nói cách khác, nếu bạn chấp nhận serialized form mặc định, các instance field private và package-private của class trở thành một phần của API được xuất ra, và thực hành tối thiểu hóa quyền truy cập vào các field (**Item 15**) mất đi hiệu lực như một công cụ che giấu thông tin.

Nếu bạn chấp nhận serialized form mặc định và sau đó thay đổi biểu diễn nội bộ của class, kết quả sẽ là một thay đổi không tương thích trong serialized form. Các client cố gắng serialize một instance bằng phiên bản cũ của class và deserialize nó bằng phiên bản mới (hoặc ngược lại) sẽ gặp lỗi chương trình. Có thể thay đổi biểu diễn nội bộ trong khi vẫn duy trì serialized form ban đầu (dùng `ObjectOutputStream.putFields` và `ObjectInputStream.readFields`), nhưng việc này có thể khó khăn và để lại những vết xấu lộ rõ trong mã nguồn. Nếu bạn chọn làm cho một class serializable, bạn nên thiết kế cẩn thận một serialized form chất lượng cao mà bạn sẵn sàng chung sống lâu dài (**Item 87**, **90**). Làm vậy sẽ tăng thêm chi phí phát triển ban đầu, nhưng công sức bỏ ra là xứng đáng. Ngay cả một serialized form được thiết kế tốt cũng đặt ra những ràng buộc lên sự tiến hóa của class; một serialized form thiết kế kém có thể gây tê liệt.

Một ví dụ đơn giản về các ràng buộc lên sự tiến hóa do tính serializable áp đặt liên quan đến *stream unique identifier* (định danh duy nhất của luồng), thường được gọi là *serial version UID*. Mỗi class serializable đều có một số định danh duy nhất gắn với nó. Nếu bạn không chỉ định số này bằng cách khai báo một field static final kiểu `long` tên là `serialVersionUID`, hệ thống sẽ tự động sinh nó lúc chạy bằng cách áp dụng một hàm băm mật mã (SHA-1) lên cấu trúc của class. Giá trị này bị ảnh hưởng bởi tên class, các interface mà nó implement, và hầu hết các thành viên của nó, bao gồm cả các thành viên tổng hợp (synthetic) do trình biên dịch sinh ra. Nếu bạn thay đổi bất kỳ điều nào trong số này, ví dụ bằng cách thêm một method tiện ích, serial version UID được sinh ra sẽ thay đổi. Nếu bạn không khai báo serial version UID, tính tương thích sẽ bị phá vỡ, dẫn đến một `InvalidClassException` lúc chạy.

**Chi phí thứ hai của việc implement** `Serializable` **là nó làm tăng khả năng xuất hiện lỗi và lỗ hổng bảo mật (Item 85).** Thông thường, các đối tượng được tạo ra bằng constructor; serialization là một *cơ chế ngoài ngôn ngữ* (extralinguistic mechanism) để tạo đối tượng. Dù bạn chấp nhận hành vi mặc định hay override nó, deserialization là một "constructor ẩn" với tất cả những vấn đề giống như các constructor khác. Vì không có constructor tường minh nào gắn với deserialization, rất dễ quên rằng bạn phải đảm bảo nó bảo toàn mọi bất biến (invariant) mà các constructor đã thiết lập và không cho phép kẻ tấn công truy cập vào phần bên trong của đối tượng đang được xây dựng. Dựa vào cơ chế deserialization mặc định có thể dễ dàng khiến các đối tượng bị hỏng bất biến và bị truy cập trái phép (**Item 88**).

**Chi phí thứ ba của việc implement** `Serializable` **là nó làm tăng gánh nặng kiểm thử khi phát hành phiên bản mới của một class.** Khi một class serializable được sửa đổi, điều quan trọng là phải kiểm tra rằng có thể serialize một instance trong phiên bản mới và deserialize nó trong các phiên bản cũ, và ngược lại. Do đó khối lượng kiểm thử cần thiết tỷ lệ với tích của số class serializable và số phiên bản phát hành, con số này có thể rất lớn. Bạn phải đảm bảo cả việc quá trình serialization–deserialization thành công lẫn việc nó tạo ra một bản sao trung thực của đối tượng gốc. Nhu cầu kiểm thử sẽ giảm nếu một custom serialized form được thiết kế cẩn thận ngay khi class được viết lần đầu (**Item 87**, **90**).

**Implement** `Serializable` **không phải là một quyết định có thể đưa ra một cách nhẹ nhàng.** Nó là thiết yếu nếu class cần tham gia vào một framework dựa vào Java serialization để truyền tải hoặc lưu trữ bền vững đối tượng. Ngoài ra, nó giúp việc dùng class như một thành phần trong một class khác buộc phải implement `Serializable` trở nên dễ dàng hơn nhiều. Tuy nhiên, có nhiều chi phí gắn liền với việc implement `Serializable`. Mỗi khi thiết kế một class, hãy cân nhắc chi phí so với lợi ích. Về mặt lịch sử, các value class như `BigInteger` và `Instant` đã implement `Serializable`, và các collection class cũng vậy. Các class biểu diễn những thực thể hoạt động, chẳng hạn như thread pool, hiếm khi nên implement `Serializable`.

**Các class được thiết kế để kế thừa (Item 19) hiếm khi nên implement** `Serializable`, **và các interface hiếm khi nên extend nó.** Vi phạm quy tắc này đặt một gánh nặng đáng kể lên bất kỳ ai extend class hoặc implement interface đó. Có những lúc việc vi phạm quy tắc này là phù hợp. Ví dụ, nếu một class hoặc interface tồn tại chủ yếu để tham gia vào một framework đòi hỏi mọi thành phần tham gia phải implement `Serializable`, thì việc class hoặc interface đó implement hoặc extend `Serializable` có thể là hợp lý.

Các class được thiết kế để kế thừa mà có implement `Serializable` bao gồm `Throwable` và `Component`. `Throwable` implement `Serializable` để RMI có thể gửi exception từ server đến client. `Component` implement `Serializable` để các GUI có thể được gửi đi, lưu lại và khôi phục, nhưng ngay cả trong thời hoàng kim của Swing và AWT, tính năng này cũng ít được dùng trong thực tế.

Nếu bạn implement một class có instance field mà vừa serializable vừa có thể mở rộng, có một số rủi ro cần lưu ý. Nếu có bất kỳ bất biến nào trên giá trị của các instance field, điều quan trọng là phải ngăn các subclass override method `finalize`, việc này class có thể làm bằng cách override `finalize` và khai báo nó là final. Nếu không, class sẽ dễ bị *finalizer attack* (Item 8). Cuối cùng, nếu class có các bất biến sẽ bị vi phạm khi các instance field của nó được khởi tạo bằng giá trị mặc định (0 cho các kiểu số nguyên, `false` cho `boolean`, và `null` cho các kiểu tham chiếu đối tượng), bạn phải thêm method `readObjectNoData` sau:

```java
// readObjectNoData for stateful extendable serializable classes
private void readObjectNoData() throws InvalidObjectException {
    throw new InvalidObjectException("Stream data required");
}
```

Method này được thêm vào Java 4 để xử lý một trường hợp hiếm gặp liên quan đến việc thêm một superclass serializable vào một class serializable đã có sẵn [Serialization, 3.5].

Có một lưu ý liên quan đến quyết định *không* implement `Serializable`. Nếu một class được thiết kế để kế thừa không phải là serializable, việc viết một subclass serializable có thể đòi hỏi thêm công sức. Quá trình deserialization thông thường của một class như vậy đòi hỏi superclass phải có một constructor không tham số có thể truy cập được [Serialization, 1.10]. Nếu bạn không cung cấp constructor như vậy, các subclass buộc phải dùng serialization proxy pattern (**Item 90**).

**Các inner class (Item 24) không nên implement** `Serializable`**.** Chúng dùng các *synthetic field* do trình biên dịch sinh ra để lưu tham chiếu đến *enclosing instance* (instance bao ngoài) và để lưu giá trị của các biến cục bộ từ phạm vi bao ngoài. Cách các field này tương ứng với định nghĩa class là không được đặc tả, và tên của các anonymous class cũng như local class cũng vậy. Do đó, serialized form mặc định của một inner class là không được định nghĩa rõ ràng. Tuy nhiên, một *static member class* thì có thể implement `Serializable`.

Tóm lại, sự dễ dàng của việc implement `Serializable` chỉ là bề ngoài. Trừ khi một class chỉ được dùng trong một môi trường được bảo vệ, nơi các phiên bản sẽ không bao giờ phải tương tác với nhau và các server sẽ không bao giờ tiếp xúc với dữ liệu không đáng tin cậy, implement `Serializable` là một cam kết nghiêm túc cần được đưa ra với sự thận trọng cao độ. Cần thận trọng hơn nữa nếu class cho phép kế thừa.

## Item 87: Cân nhắc sử dụng custom serialized form

Khi bạn viết một class dưới áp lực thời gian, nói chung việc tập trung công sức vào thiết kế API tốt nhất là phù hợp. Đôi khi điều này có nghĩa là phát hành một phần hiện thực "dùng tạm" mà bạn biết mình sẽ thay thế trong một phiên bản tương lai. Thông thường đây không phải là vấn đề, nhưng nếu class implement `Serializable` và dùng serialized form mặc định, bạn sẽ không bao giờ thoát khỏi hoàn toàn phần hiện thực dùng tạm đó. Nó sẽ quyết định serialized form mãi mãi. Đây không chỉ là một vấn đề lý thuyết. Nó đã xảy ra với một số class trong thư viện Java, bao gồm cả `BigInteger`.

**Đừng chấp nhận serialized form mặc định mà không cân nhắc trước xem nó có phù hợp không.** Chấp nhận serialized form mặc định phải là một quyết định có ý thức rằng cách mã hóa này là hợp lý xét trên phương diện linh hoạt, hiệu năng và tính đúng đắn. Nói chung, bạn chỉ nên chấp nhận serialized form mặc định nếu nó phần lớn giống hệt với cách mã hóa mà bạn sẽ chọn nếu tự thiết kế một custom serialized form.

Serialized form mặc định của một đối tượng là một cách mã hóa khá hiệu quả của biểu diễn *vật lý* của đồ thị đối tượng có gốc tại đối tượng đó. Nói cách khác, nó mô tả dữ liệu chứa trong đối tượng và trong mọi đối tượng có thể tiếp cận được từ đối tượng này. Nó cũng mô tả cấu trúc liên kết (topology) mà theo đó tất cả các đối tượng này được nối với nhau. Serialized form lý tưởng của một đối tượng chỉ chứa dữ liệu *logic* mà đối tượng biểu diễn. Nó độc lập với biểu diễn vật lý.

**Serialized form mặc định có khả năng phù hợp nếu biểu diễn vật lý của đối tượng giống hệt với nội dung logic của nó.** Ví dụ, serialized form mặc định sẽ hợp lý cho class sau, class này biểu diễn tên của một người theo cách đơn giản hóa:

```java
// Good candidate for default serialized form
public class Name implements Serializable {
    /**
     * Last name. Must be non-null.
     * @serial
     */
    private final String lastName;

    /**
     * First name. Must be non-null.
     * @serial
     */
    private final String firstName;

    /**
     * Middle name, or null if there is none.
     * @serial
     */
    private final String middleName;

    ... // Remainder omitted
}
```

Về mặt logic, một cái tên gồm ba string biểu diễn họ, tên và tên đệm. Các instance field trong `Name` phản ánh chính xác nội dung logic này.

**Ngay cả khi bạn quyết định rằng serialized form mặc định là phù hợp, bạn thường vẫn phải cung cấp một method** `readObject` **để đảm bảo các bất biến và tính bảo mật.** Trong trường hợp của `Name`, method `readObject` phải đảm bảo rằng các field `lastName` và `firstName` khác null. Vấn đề này được bàn kỹ trong Item 88 và 90.

Lưu ý rằng có các documentation comment trên các field `lastName`, `firstName` và `middleName`, dù chúng là private. Đó là vì những field private này định nghĩa một API public, chính là serialized form của class, và API public này phải được tài liệu hóa. Sự hiện diện của tag `@serial` báo cho Javadoc đặt phần tài liệu này vào một trang đặc biệt chuyên tài liệu hóa các serialized form.

Ở gần đầu đối diện của phổ so với `Name`, hãy xem xét class sau, class này biểu diễn một danh sách các string (tạm bỏ qua việc bạn có lẽ sẽ tốt hơn nếu dùng một trong các hiện thực `List` chuẩn):

```java
// Awful candidate for default serialized form
public final class StringList implements Serializable {
    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {
        String data;
        Entry  next;
        Entry  previous;
    }

    ... // Remainder omitted
}
```

Về mặt logic, class này biểu diễn một dãy các string. Về mặt vật lý, nó biểu diễn dãy đó dưới dạng một danh sách liên kết đôi. Nếu bạn chấp nhận serialized form mặc định, serialized form sẽ phản ánh tỉ mỉ từng entry trong danh sách liên kết và tất cả các liên kết giữa các entry, theo cả hai chiều.

**Dùng serialized form mặc định khi biểu diễn vật lý của đối tượng khác biệt đáng kể so với nội dung dữ liệu logic của nó có bốn nhược điểm:**

- **Nó vĩnh viễn trói buộc API được xuất ra vào biểu diễn nội bộ hiện tại.** Trong ví dụ trên, class private `StringList.Entry` trở thành một phần của API public. Nếu biểu diễn bị thay đổi trong một phiên bản tương lai, class `StringList` vẫn sẽ phải chấp nhận biểu diễn danh sách liên kết ở đầu vào và sinh ra nó ở đầu ra. Class sẽ không bao giờ thoát khỏi toàn bộ phần mã xử lý các entry của danh sách liên kết, ngay cả khi nó không còn dùng chúng nữa.

- **Nó có thể tiêu tốn quá nhiều không gian.** Trong ví dụ trên, serialized form biểu diễn một cách không cần thiết từng entry trong danh sách liên kết và tất cả các liên kết. Những entry và liên kết này chỉ là chi tiết hiện thực, không đáng đưa vào serialized form. Vì serialized form quá lớn, việc ghi nó ra đĩa hoặc gửi qua mạng sẽ quá chậm.

- **Nó có thể tiêu tốn quá nhiều thời gian.** Logic serialization không biết gì về topology của đồ thị đối tượng, nên nó phải thực hiện một phép duyệt đồ thị tốn kém. Trong ví dụ trên, chỉ cần đi theo các tham chiếu `next` là đủ.

- **Nó có thể gây tràn stack.** Thủ tục serialization mặc định thực hiện một phép duyệt đệ quy đồ thị đối tượng, điều này có thể gây tràn stack ngay cả với các đồ thị đối tượng có kích thước vừa phải. Serialize một instance `StringList` với 1.000–1.800 phần tử sinh ra một `StackOverflowError` trên máy của tôi. Điều đáng ngạc nhiên là kích thước danh sách tối thiểu mà tại đó serialization gây tràn stack thay đổi giữa các lần chạy (trên máy của tôi). Kích thước danh sách tối thiểu bộc lộ vấn đề này có thể phụ thuộc vào hiện thực nền tảng và các cờ dòng lệnh; một số hiện thực có thể hoàn toàn không gặp vấn đề này.

Một serialized form hợp lý cho `StringList` đơn giản là số lượng string trong danh sách, theo sau là chính các string đó. Đây chính là dữ liệu logic mà một `StringList` biểu diễn, đã được lược bỏ các chi tiết của biểu diễn vật lý. Dưới đây là phiên bản sửa đổi của `StringList` với các method `writeObject` và `readObject` hiện thực serialized form này. Xin nhắc lại, modifier `transient` chỉ ra rằng một instance field sẽ bị bỏ qua khỏi serialized form mặc định của class:

```java
// StringList with a reasonable custom serialized form
public final class StringList implements Serializable {
    private transient int size   = 0;
    private transient Entry head = null;

    // No longer Serializable!
    private static class Entry {
        String data;
        Entry  next;
        Entry  previous;
    }

    // Appends the specified string to the list
    public final void add(String s) { ... }

    /**
     * Serialize this {@code StringList} instance.
     *
     * @serialData The size of the list (the number of strings
     * it contains) is emitted ({@code int}), followed by all of
     * its elements (each a {@code String}), in the proper
     * sequence.
     */
    private void writeObject(ObjectOutputStream s)
            throws IOException {
        s.defaultWriteObject();
        s.writeInt(size);

        // Write out all elements in the proper order.
        for (Entry e = head; e != null; e = e.next)
            s.writeObject(e.data);
    }

    private void readObject(ObjectInputStream s)
            throws IOException, ClassNotFoundException {
        s.defaultReadObject();
        int numElements = s.readInt();

        // Read in all elements and insert them in list
        for (int i = 0; i < numElements; i++)
            add((String) s.readObject());
    }
    ... // Remainder omitted
}
```

Việc đầu tiên `writeObject` làm là gọi `defaultWriteObject`, và việc đầu tiên `readObject` làm là gọi `defaultReadObject`, dù tất cả các field của `StringList` đều là transient. Bạn có thể nghe nói rằng nếu tất cả instance field của một class đều là transient, bạn có thể bỏ qua việc gọi `defaultWriteObject` và `defaultReadObject`, nhưng đặc tả serialization yêu cầu bạn phải gọi chúng bất kể thế nào. Sự hiện diện của các lời gọi này giúp có thể thêm các instance field không transient trong một phiên bản sau mà vẫn giữ được tính tương thích ngược và xuôi. Nếu một instance được serialize trong phiên bản mới hơn và được deserialize trong phiên bản cũ hơn, các field được thêm vào sẽ bị bỏ qua. Nếu method `readObject` của phiên bản cũ không gọi `defaultReadObject`, quá trình deserialization sẽ thất bại với một `StreamCorruptedException`.

Lưu ý rằng có một documentation comment trên method `writeObject`, dù nó là private. Điều này tương tự như documentation comment trên các field private trong class `Name`. Method private này định nghĩa một API public, chính là serialized form, và API public đó nên được tài liệu hóa. Giống như tag `@serial` cho các field, tag `@serialData` cho các method báo cho tiện ích Javadoc đặt phần tài liệu này vào trang serialized forms.

Để hình dung phần nào về quy mô của thảo luận hiệu năng ở trên, nếu độ dài string trung bình là mười ký tự, serialized form của phiên bản sửa đổi của `StringList` chiếm khoảng một nửa không gian so với serialized form của phiên bản gốc. Trên máy của tôi, serialize phiên bản sửa đổi của `StringList` nhanh hơn gấp đôi so với serialize phiên bản gốc, với độ dài danh sách là mười. Cuối cùng, không có vấn đề tràn stack trong phiên bản sửa đổi và do đó thực tế không có giới hạn trên cho kích thước `StringList` có thể được serialize.

Dù serialized form mặc định sẽ tệ cho `StringList`, có những class mà nó còn tệ hơn nhiều. Với `StringList`, serialized form mặc định thiếu linh hoạt và hoạt động kém, nhưng nó *đúng đắn* theo nghĩa serialize rồi deserialize một instance `StringList` cho ra một bản sao trung thực của đối tượng gốc với tất cả các bất biến còn nguyên vẹn. Điều này không đúng với bất kỳ đối tượng nào có các bất biến gắn liền với những chi tiết đặc thù của hiện thực.

Ví dụ, hãy xét trường hợp một bảng băm (hash table). Biểu diễn vật lý là một dãy các bucket băm chứa các entry khóa–giá trị. Bucket mà một entry nằm trong đó là một hàm của hash code của khóa, và hash code này nói chung không được đảm bảo giống nhau giữa các hiện thực. Thực tế, nó thậm chí không được đảm bảo giống nhau giữa các lần chạy. Do đó, chấp nhận serialized form mặc định cho một bảng băm sẽ là một lỗi nghiêm trọng. Serialize rồi deserialize bảng băm có thể cho ra một đối tượng mà các bất biến của nó bị hỏng nặng.

Dù bạn có chấp nhận serialized form mặc định hay không, mọi instance field không được đánh dấu `transient` sẽ được serialize khi method `defaultWriteObject` được gọi. Do đó, mọi instance field có thể khai báo transient thì nên khai báo như vậy. Điều này bao gồm các field dẫn xuất, mà giá trị có thể được tính từ các field dữ liệu chính, chẳng hạn như một giá trị băm được cache. Nó cũng bao gồm các field mà giá trị gắn liền với một lần chạy cụ thể của JVM, chẳng hạn như một field `long` biểu diễn con trỏ đến một cấu trúc dữ liệu native. **Trước khi quyết định làm cho một field không transient, hãy tự thuyết phục bản thân rằng giá trị của nó là một phần của trạng thái logic của đối tượng.** Nếu bạn dùng custom serialized form, hầu hết hoặc tất cả các instance field nên được đánh dấu `transient`, như trong ví dụ `StringList` ở trên.

Nếu bạn đang dùng serialized form mặc định và đã đánh dấu một hoặc nhiều field là `transient`, hãy nhớ rằng những field này sẽ được khởi tạo bằng *giá trị mặc định* khi một instance được deserialize: `null` cho các field tham chiếu đối tượng, 0 cho các field số nguyên thủy, và `false` cho các field `boolean` [JLS, 4.12.5]. Nếu những giá trị này không chấp nhận được với bất kỳ field transient nào, bạn phải cung cấp một method `readObject` gọi method `defaultReadObject` rồi khôi phục các field transient về giá trị chấp nhận được (**Item 88**). Hoặc, các field này có thể được khởi tạo lười (lazily) vào lần đầu tiên chúng được sử dụng (**Item 83**).

Dù bạn có dùng serialized form mặc định hay không, **bạn phải áp đặt lên object serialization mọi sự đồng bộ hóa mà bạn sẽ áp đặt lên bất kỳ method nào khác đọc toàn bộ trạng thái của đối tượng.** Vì vậy, ví dụ, nếu bạn có một đối tượng thread-safe (**Item 82**) đạt được tính thread-safe bằng cách đồng bộ hóa mọi method và bạn chọn dùng serialized form mặc định, hãy dùng method `writeObject` sau:

```java
// writeObject for synchronized class with default serialized form
private synchronized void writeObject(ObjectOutputStream s)
        throws IOException {
    s.defaultWriteObject();
}
```

Nếu bạn đặt sự đồng bộ hóa trong method `writeObject`, bạn phải đảm bảo rằng nó tuân thủ cùng các ràng buộc về thứ tự khóa (lock-ordering) như các hoạt động khác, nếu không bạn có nguy cơ gặp deadlock do thứ tự tài nguyên [Goetz06, 10.1.5].

**Bất kể bạn chọn serialized form nào, hãy khai báo tường minh một serial version UID trong mọi class serializable bạn viết.** Điều này loại bỏ serial version UID như một nguồn tiềm ẩn gây không tương thích (**Item 86**). Cũng có một lợi ích nhỏ về hiệu năng. Nếu không cung cấp serial version UID, một phép tính tốn kém sẽ được thực hiện để sinh ra nó lúc chạy.

Khai báo serial version UID rất đơn giản. Chỉ cần thêm dòng này vào class của bạn:

```java
private static final long serialVersionUID = randomLongValue;
```

Nếu bạn viết một class mới, giá trị bạn chọn cho *randomLongValue* là gì không quan trọng. Bạn có thể sinh giá trị bằng cách chạy tiện ích `serialver` trên class, nhưng chọn đại một số cũng hoàn toàn được. Serial version UID *không* bắt buộc phải là duy nhất. Nếu bạn sửa đổi một class hiện có mà thiếu serial version UID, và bạn muốn phiên bản mới chấp nhận các instance đã được serialize trước đó, bạn phải dùng giá trị đã được tự động sinh ra cho phiên bản cũ. Bạn có thể lấy số này bằng cách chạy tiện ích `serialver` trên phiên bản cũ của class—phiên bản mà các instance đã serialize tồn tại.

Nếu có lúc bạn muốn tạo một phiên bản mới của class *không tương thích* với các phiên bản hiện có, chỉ cần thay đổi giá trị trong khai báo serial version UID. Điều này sẽ khiến các nỗ lực deserialize những instance đã serialize của các phiên bản trước ném ra `InvalidClassException`. **Đừng thay đổi serial version UID trừ khi bạn muốn phá vỡ tính tương thích với tất cả các instance đã serialize hiện có của một class.**

Tóm lại, nếu bạn đã quyết định rằng một class nên là serializable (**Item 86**), hãy suy nghĩ kỹ xem serialized form nên như thế nào. *Chỉ* dùng serialized form mặc định nếu nó là một mô tả hợp lý về trạng thái logic của đối tượng; nếu không, hãy thiết kế một custom serialized form mô tả đối tượng một cách thích đáng. Bạn nên dành thời gian cho việc thiết kế serialized form của một class nhiều như thời gian bạn dành để thiết kế một method được xuất ra (**Item 51**). Giống như bạn không thể loại bỏ các method đã xuất ra khỏi các phiên bản tương lai, bạn không thể loại bỏ các field khỏi serialized form; chúng phải được giữ mãi mãi để đảm bảo tính tương thích serialization. Chọn sai serialized form có thể gây tác động tiêu cực vĩnh viễn lên độ phức tạp và hiệu năng của một class.

## Item 88: Viết các method `readObject` một cách phòng thủ

Item 50 có một class khoảng thời gian (date-range) bất biến với các field `Date` private có thể thay đổi. Class này bỏ rất nhiều công sức để bảo toàn các bất biến và tính bất biến (immutability) của nó bằng cách sao chép phòng thủ các đối tượng `Date` trong constructor và các accessor. Đây là class đó:

```java
// Immutable class that uses defensive copying
public final class Period {
    private final Date start;
    private final Date end;
    /**
     * @param  start the beginning of the period
     * @param  end the end of the period; must not precede start
     * @throws IllegalArgumentException if start is after end
     * @throws NullPointerException if start or end is null
     */
    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end   = new Date(end.getTime());
        if (this.start.compareTo(this.end) > 0)
            throw new IllegalArgumentException(
                          start + " after " + end);
    }
    public Date start () { return new Date(start.getTime()); }

    public Date end () { return new Date(end.getTime()); }

    public String toString() { return start + " - " + end; }

    ... // Remainder omitted
}
```

Giả sử bạn quyết định muốn class này là serializable. Vì biểu diễn vật lý của một đối tượng `Period` phản ánh chính xác nội dung dữ liệu logic của nó, dùng serialized form mặc định là không hề vô lý (**Item 87**). Do đó, có vẻ như tất cả những gì bạn phải làm để class trở nên serializable là thêm cụm từ `implements Serializable` vào khai báo class. Tuy nhiên, nếu bạn làm vậy, class sẽ không còn đảm bảo được các bất biến quan trọng của nó nữa.

Vấn đề là method `readObject` thực chất là một constructor public khác, và nó đòi hỏi tất cả sự cẩn trọng giống như bất kỳ constructor nào khác. Giống như constructor phải kiểm tra tính hợp lệ của các đối số (**Item 49**) và sao chép phòng thủ các tham số khi thích hợp (**Item 50**), method `readObject` cũng phải làm vậy. Nếu một method `readObject` không làm một trong hai việc này, kẻ tấn công có thể vi phạm các bất biến của class một cách tương đối đơn giản.

Nói một cách đại khái, `readObject` là một constructor nhận một luồng byte làm tham số duy nhất. Trong sử dụng thông thường, luồng byte được sinh ra bằng cách serialize một instance được xây dựng bình thường. Vấn đề nảy sinh khi `readObject` được đưa cho một luồng byte được tạo ra một cách nhân tạo để sinh ra một đối tượng vi phạm các bất biến của class. Luồng byte như vậy có thể được dùng để tạo ra một *đối tượng bất khả thi* (impossible object), thứ không thể được tạo ra bằng constructor thông thường.

Giả sử chúng ta chỉ đơn giản thêm `implements Serializable` vào khai báo class `Period`. Chương trình xấu xí sau đây khi đó sẽ sinh ra một instance `Period` có thời điểm kết thúc đứng trước thời điểm bắt đầu. Các phép ép kiểu trên những giá trị `byte` có bit cao nhất được bật là hệ quả của việc Java thiếu literal kiểu `byte` kết hợp với quyết định đáng tiếc là làm cho kiểu `byte` có dấu:

```java
public class BogusPeriod {
  // Byte stream couldn't have come from a real Period instance!
  private static final byte[] serializedForm = {
    (byte)0xac, (byte)0xed, 0x00, 0x05, 0x73, 0x72, 0x00, 0x06,
    0x50, 0x65, 0x72, 0x69, 0x6f, 0x64, 0x40, 0x7e, (byte)0xf8,
    0x2b, 0x4f, 0x46, (byte)0xc0, (byte)0xf4, 0x02, 0x00, 0x02,
    0x4c, 0x00, 0x03, 0x65, 0x6e, 0x64, 0x74, 0x00, 0x10, 0x4c,
    0x6a, 0x61, 0x76, 0x61, 0x2f, 0x75, 0x74, 0x69, 0x6c, 0x2f,
    0x44, 0x61, 0x74, 0x65, 0x3b, 0x4c, 0x00, 0x05, 0x73, 0x74,
    0x61, 0x72, 0x74, 0x71, 0x00, 0x7e, 0x00, 0x01, 0x78, 0x70,
    0x73, 0x72, 0x00, 0x0e, 0x6a, 0x61, 0x76, 0x61, 0x2e, 0x75,
    0x74, 0x69, 0x6c, 0x2e, 0x44, 0x61, 0x74, 0x65, 0x68, 0x6a,
    (byte)0x81, 0x01, 0x4b, 0x59, 0x74, 0x19, 0x03, 0x00, 0x00,
    0x78, 0x70, 0x77, 0x08, 0x00, 0x00, 0x00, 0x66, (byte)0xdf,
    0x6e, 0x1e, 0x00, 0x78, 0x73, 0x71, 0x00, 0x7e, 0x00, 0x03,
    0x77, 0x08, 0x00, 0x00, 0x00, (byte)0xd5, 0x17, 0x69, 0x22,
    0x00, 0x78
  };

  public static void main(String[] args) {
    Period p = (Period) deserialize(serializedForm);
    System.out.println(p);
  }

  // Returns the object with the specified serialized form
  static Object deserialize(byte[] sf) {
    try {
      return new ObjectInputStream(
          new ByteArrayInputStream(sf)).readObject();
    } catch (IOException | ClassNotFoundException e) {
      throw new IllegalArgumentException(e);
    }
  }
}
```

Literal mảng `byte` dùng để khởi tạo `serializedForm` được sinh ra bằng cách serialize một instance `Period` bình thường rồi chỉnh sửa thủ công luồng byte thu được. Các chi tiết của luồng không quan trọng đối với ví dụ này, nhưng nếu bạn tò mò, định dạng luồng byte của serialization được mô tả trong *Java Object Serialization Specification* [Serialization, 6]. Nếu bạn chạy chương trình này, nó in ra `Fri Jan 01 12:00:00 PST 1999 - Sun Jan 01 12:00:00 PST 1984`. Chỉ đơn giản khai báo `Period` là serializable đã cho phép chúng ta tạo ra một đối tượng vi phạm các bất biến của class.

Để khắc phục vấn đề này, hãy cung cấp một method `readObject` cho `Period` gọi `defaultReadObject` rồi kiểm tra tính hợp lệ của đối tượng đã deserialize. Nếu kiểm tra tính hợp lệ thất bại, method `readObject` ném ra `InvalidObjectException`, ngăn không cho quá trình deserialization hoàn tất:

```java
// readObject method with validity checking - insufficient!
private void readObject(ObjectInputStream s)
        throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // Check that our invariants are satisfied
    if (start.compareTo(end) > 0)
        throw new InvalidObjectException(start +" after "+ end);
}
```

Dù điều này ngăn kẻ tấn công tạo ra một instance `Period` không hợp lệ, vẫn còn một vấn đề tinh vi hơn đang ẩn nấp. Có thể tạo ra một instance `Period` có thể thay đổi được bằng cách chế tạo một luồng byte bắt đầu bằng một instance `Period` hợp lệ rồi nối thêm các tham chiếu bổ sung tới các field `Date` private bên trong instance `Period` đó. Kẻ tấn công đọc instance `Period` từ `ObjectInputStream` rồi đọc các "tham chiếu đối tượng giả mạo" (rogue object references) đã được nối vào luồng. Những tham chiếu này cho kẻ tấn công quyền truy cập vào các đối tượng được tham chiếu bởi các field `Date` private bên trong đối tượng `Period`. Bằng cách thay đổi các instance `Date` này, kẻ tấn công có thể thay đổi instance `Period`. Class sau đây minh họa cuộc tấn công này:

```java
public class MutablePeriod {
    // A period instance
    public final Period period;

    // period's start field, to which we shouldn't have access
    public final Date start;
    // period's end field, to which we shouldn't have access
    public final Date end;

    public MutablePeriod() {
        try {
            ByteArrayOutputStream bos =
                new ByteArrayOutputStream();
            ObjectOutputStream out =
                new ObjectOutputStream(bos);

            // Serialize a valid Period instance
            out.writeObject(new Period(new Date(), new Date()));

            /*
             * Append rogue "previous object refs" for internal
             * Date fields in Period. For details, see "Java
             * Object Serialization Specification," Section 6.4.
             */
            byte[] ref = { 0x71, 0, 0x7e, 0, 5 };  // Ref #5
            bos.write(ref); // The start field
            ref[4] = 4;     // Ref # 4
            bos.write(ref); // The end field

            // Deserialize Period and "stolen" Date references
            ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(bos.toByteArray()));
            period = (Period) in.readObject();
            start  = (Date)   in.readObject();
            end    = (Date)   in.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new AssertionError(e);
        }
    }
}
```

Để xem cuộc tấn công diễn ra, hãy chạy chương trình sau:

```java
public static void main(String[] args) {
    MutablePeriod mp = new MutablePeriod();
    Period p = mp.period;
    Date pEnd = mp.end;
    // Let's turn back the clock
    pEnd.setYear(78);
    System.out.println(p);

    // Bring back the 60s!
    pEnd.setYear(69);
    System.out.println(p);
}
```

Trong locale của tôi, chạy chương trình này cho ra kết quả sau:

```java
Wed Nov 22 00:21:29 PST 2017 - Wed Nov 22 00:21:29 PST 1978
Wed Nov 22 00:21:29 PST 2017 - Sat Nov 22 00:21:29 PST 1969
```

Dù instance `Period` được tạo ra với các bất biến còn nguyên vẹn, vẫn có thể tùy ý sửa đổi các thành phần bên trong của nó. Một khi nắm trong tay một instance `Period` có thể thay đổi, kẻ tấn công có thể gây tổn hại lớn bằng cách truyền instance đó cho một class dựa vào tính bất biến của `Period` để đảm bảo an toàn. Điều này không hề xa vời: có những class dựa vào tính bất biến của `String` để đảm bảo an toàn cho chúng.

Nguồn gốc của vấn đề là method `readObject` của `Period` không sao chép phòng thủ đầy đủ. **Khi một đối tượng được deserialize, điều cực kỳ quan trọng là phải sao chép phòng thủ bất kỳ field nào chứa tham chiếu đối tượng mà client không được phép sở hữu.** Do đó, mọi class bất biến serializable chứa các thành phần private có thể thay đổi đều phải sao chép phòng thủ các thành phần này trong method `readObject` của nó. Method `readObject` sau đây là đủ để đảm bảo các bất biến của `Period` và duy trì tính bất biến của nó:

```java
// readObject method with defensive copying and validity checking
private void readObject(ObjectInputStream s)
        throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // Defensively copy our mutable components
    start = new Date(start.getTime());
    end   = new Date(end.getTime());

    // Check that our invariants are satisfied
    if (start.compareTo(end) > 0)
        throw new InvalidObjectException(start +" after "+ end);
}
```

Lưu ý rằng việc sao chép phòng thủ được thực hiện trước khi kiểm tra tính hợp lệ và chúng ta không dùng method `clone` của `Date` để sao chép phòng thủ. Cả hai chi tiết này đều cần thiết để bảo vệ `Period` trước tấn công (**Item 50**). Cũng lưu ý rằng không thể sao chép phòng thủ các field final. Để dùng method `readObject`, chúng ta phải làm cho các field `start` và `end` không còn là final. Điều này đáng tiếc, nhưng đó là cái xấu ít hơn trong hai cái xấu. Với method `readObject` mới được đưa vào và modifier `final` được gỡ khỏi các field `start` và `end`, class `MutablePeriod` trở nên vô hiệu. Chương trình tấn công ở trên giờ đây cho ra kết quả này:

```java
Wed Nov 22 00:23:41 PST 2017 - Wed Nov 22 00:23:41 PST 2017
Wed Nov 22 00:23:41 PST 2017 - Wed Nov 22 00:23:41 PST 2017
```

Đây là một phép thử đơn giản để quyết định liệu method `readObject` mặc định có chấp nhận được cho một class hay không: bạn có cảm thấy thoải mái khi thêm một constructor public nhận làm tham số giá trị của từng field không transient trong đối tượng và lưu các giá trị đó vào các field mà không kiểm tra gì cả không? Nếu không, bạn phải cung cấp một method `readObject`, và nó phải thực hiện mọi kiểm tra tính hợp lệ và sao chép phòng thủ mà một constructor sẽ cần làm. Hoặc, bạn có thể dùng *serialization proxy pattern* (**Item 90**). Pattern này rất được khuyến nghị vì nó giảm bớt phần lớn công sức cần cho việc deserialize an toàn.

Có một điểm tương đồng khác giữa các method `readObject` và constructor, áp dụng cho các class serializable không final. Giống như constructor, một method `readObject` không được gọi một method có thể override, dù trực tiếp hay gián tiếp (**Item 19**). Nếu quy tắc này bị vi phạm và method đó bị override, method override sẽ chạy trước khi trạng thái của subclass được deserialize. Kết quả nhiều khả năng là lỗi chương trình [Bloch05, Puzzle 91].

Tóm lại, bất cứ khi nào bạn viết một method `readObject`, hãy nhận thức rằng bạn đang viết một constructor public phải tạo ra một instance hợp lệ bất kể luồng byte nào được đưa vào. Đừng giả định rằng luồng byte biểu diễn một instance đã được serialize thực sự. Dù các ví dụ trong item này liên quan đến một class dùng serialized form mặc định, tất cả các vấn đề được nêu đều áp dụng như nhau cho các class có custom serialized form. Dưới đây, ở dạng tóm tắt, là các hướng dẫn để viết một method `readObject`:

- Với các class có field tham chiếu đối tượng phải giữ ở trạng thái private, hãy sao chép phòng thủ từng đối tượng trong field đó. Các thành phần có thể thay đổi của các class bất biến thuộc nhóm này.

- Kiểm tra mọi bất biến và ném `InvalidObjectException` nếu một kiểm tra thất bại. Các kiểm tra nên được thực hiện sau mọi thao tác sao chép phòng thủ.

- Nếu toàn bộ đồ thị đối tượng phải được xác thực sau khi deserialize, hãy dùng interface `ObjectInputValidation` (không được bàn tới trong cuốn sách này).

- Không gọi bất kỳ method có thể override nào trong class, dù trực tiếp hay gián tiếp.

## Item 89: Để kiểm soát instance, ưu tiên enum type hơn `readResolve`

Item 3 mô tả pattern *Singleton* và đưa ra ví dụ sau về một class singleton. Class này hạn chế quyền truy cập vào constructor của nó để đảm bảo chỉ có duy nhất một instance được tạo ra:

```java
public class Elvis {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() {  ... }

    public void leaveTheBuilding() { ... }
}
```

Như đã lưu ý trong **Item 3**, class này sẽ không còn là singleton nếu cụm từ `implements Serializable` được thêm vào khai báo của nó. Việc class dùng serialized form mặc định hay custom serialized form (**Item 87**) không quan trọng, và việc class có cung cấp method `readObject` tường minh hay không (**Item 88**) cũng không quan trọng. Bất kỳ method `readObject` nào, dù tường minh hay mặc định, đều trả về một instance mới được tạo, và đó sẽ không phải là instance đã được tạo lúc khởi tạo class.

Tính năng `readResolve` cho phép bạn thay thế instance do `readObject` tạo ra bằng một instance khác [Serialization, 3.7]. Nếu class của đối tượng đang được deserialize định nghĩa một method `readResolve` với khai báo đúng, method này sẽ được gọi trên đối tượng mới được tạo sau khi nó được deserialize. Tham chiếu đối tượng mà method này trả về sau đó được trả về thay cho đối tượng mới được tạo. Trong hầu hết các cách dùng tính năng này, không có tham chiếu nào đến đối tượng mới được tạo được giữ lại, nên nó lập tức trở thành đối tượng đủ điều kiện để bị thu gom rác (garbage collection).

Nếu class `Elvis` được làm cho implement `Serializable`, method `readResolve` sau đây là đủ để đảm bảo tính chất singleton:

```java
// readResolve for instance control - you can do better!
private Object readResolve() {
    // Return the one true Elvis and let the garbage collector
    // take care of the Elvis impersonator.
    return INSTANCE;
}
```

Method này bỏ qua đối tượng đã deserialize, trả về instance `Elvis` đặc biệt đã được tạo khi class được khởi tạo. Do đó, serialized form của một instance `Elvis` không cần chứa dữ liệu thực nào; tất cả instance field nên được khai báo transient. Thực tế, **nếu bạn dựa vào** `readResolve` **để kiểm soát instance, tất cả instance field có kiểu tham chiếu đối tượng phải được khai báo** `transient`**.** Nếu không, một kẻ tấn công quyết tâm có thể giành được tham chiếu đến đối tượng đã deserialize trước khi method `readResolve` của nó chạy, bằng một kỹ thuật khá giống với cuộc tấn công `MutablePeriod` trong **Item 88**.

Cuộc tấn công hơi phức tạp, nhưng ý tưởng cơ bản thì đơn giản. Nếu một singleton chứa một field tham chiếu đối tượng không transient, nội dung của field này sẽ được deserialize trước khi method `readResolve` của singleton chạy. Điều này cho phép một luồng được chế tác cẩn thận "đánh cắp" tham chiếu đến singleton được deserialize ban đầu tại thời điểm nội dung của field tham chiếu đối tượng được deserialize.

Đây là cách nó hoạt động chi tiết hơn. Trước tiên, viết một class "kẻ trộm" (stealer) có cả method `readResolve` lẫn một instance field tham chiếu đến singleton đã serialize mà kẻ trộm "ẩn náu" bên trong. Trong luồng serialization, thay field không transient của singleton bằng một instance của kẻ trộm. Giờ bạn có một vòng tròn: singleton chứa kẻ trộm, và kẻ trộm tham chiếu đến singleton.

Vì singleton chứa kẻ trộm, method `readResolve` của kẻ trộm chạy trước khi singleton được deserialize xong. Kết quả là, khi method `readResolve` của kẻ trộm chạy, instance field của nó vẫn tham chiếu đến singleton đã được deserialize một phần (và chưa được resolve).

Method `readResolve` của kẻ trộm sao chép tham chiếu từ instance field của nó vào một static field để tham chiếu này có thể được truy cập sau khi method `readResolve` chạy xong. Sau đó method trả về một giá trị có kiểu đúng cho field mà nó đang ẩn náu. Nếu không làm vậy, VM sẽ ném `ClassCastException` khi hệ thống serialization cố lưu tham chiếu kẻ trộm vào field này.

Để cụ thể hóa, hãy xét singleton bị lỗi sau:

```java
// Broken singleton - has nontransient object reference field!
public class Elvis implements Serializable {
    public static final Elvis INSTANCE = new Elvis();
    private Elvis() { }

    private String[] favoriteSongs =
        { "Hound Dog", "Heartbreak Hotel" };
    public void printFavorites() {
        System.out.println(Arrays.toString(favoriteSongs));
    }
    private Object readResolve() {
        return INSTANCE;
    }
}
```

Đây là class "kẻ trộm", được xây dựng theo mô tả ở trên:

```java
public class ElvisStealer implements Serializable {
    static Elvis impersonator;
    private Elvis payload;

    private Object readResolve() {
        // Save a reference to the "unresolved" Elvis instance
        impersonator = payload;

        // Return object of correct type for favoriteSongs field
        return new String[] { "A Fool Such as I" };
    }
    private static final long serialVersionUID = 0;
}
```

Cuối cùng, đây là một chương trình xấu xí deserialize một luồng được chế tác thủ công để tạo ra hai instance phân biệt của singleton bị lỗi. Method deserialize được lược bỏ khỏi chương trình này vì nó giống hệt với method ở trang 354:

```java
public class ElvisImpersonator {
  // Byte stream couldn't have come from a real Elvis instance!
  private static final byte[] serializedForm = {
    (byte)0xac, (byte)0xed, 0x00, 0x05, 0x73, 0x72, 0x00, 0x05,
    0x45, 0x6c, 0x76, 0x69, 0x73, (byte)0x84, (byte)0xe6,
    (byte)0x93, 0x33, (byte)0xc3, (byte)0xf4, (byte)0x8b,
    0x32, 0x02, 0x00, 0x01, 0x4c, 0x00, 0x0d, 0x66, 0x61, 0x76,
    0x6f, 0x72, 0x69, 0x74, 0x65, 0x53, 0x6f, 0x6e, 0x67, 0x73,
    0x74, 0x00, 0x12, 0x4c, 0x6a, 0x61, 0x76, 0x61, 0x2f, 0x6c,
    0x61, 0x6e, 0x67, 0x2f, 0x4f, 0x62, 0x6a, 0x65, 0x63, 0x74,
    0x3b, 0x78, 0x70, 0x73, 0x72, 0x00, 0x0c, 0x45, 0x6c, 0x76,
    0x69, 0x73, 0x53, 0x74, 0x65, 0x61, 0x6c, 0x65, 0x72, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0x4c, 0x00, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64,
    0x74, 0x00, 0x07, 0x4c, 0x45, 0x6c, 0x76, 0x69, 0x73, 0x3b,
    0x78, 0x70, 0x71, 0x00, 0x7e, 0x00, 0x02
  };

  public static void main(String[] args) {
    // Initializes ElvisStealer.impersonator and returns
    // the real Elvis (which is Elvis.INSTANCE)
    Elvis elvis = (Elvis) deserialize(serializedForm);
    Elvis impersonator = ElvisStealer.impersonator;

    elvis.printFavorites();
    impersonator.printFavorites();
  }
}
```

Chạy chương trình này cho ra kết quả sau, chứng minh một cách thuyết phục rằng có thể tạo ra hai instance `Elvis` phân biệt (với gu âm nhạc khác nhau):

```java
[Hound Dog, Heartbreak Hotel]
[A Fool Such as I]
```

Bạn có thể khắc phục vấn đề bằng cách khai báo field `favoriteSongs` là `transient`, nhưng tốt hơn là khắc phục bằng cách biến `Elvis` thành một enum type có một phần tử duy nhất (**Item 3**). Như cuộc tấn công `ElvisStealer` đã cho thấy, dùng method `readResolve` để ngăn một instance đã deserialize "tạm thời" bị kẻ tấn công truy cập là mong manh và đòi hỏi sự cẩn trọng cao độ.

Nếu bạn viết class serializable có kiểm soát instance dưới dạng enum, Java đảm bảo với bạn rằng không thể có instance nào ngoài các hằng đã khai báo, trừ khi kẻ tấn công lạm dụng một method đặc quyền như `AccessibleObject.setAccessible`. Bất kỳ kẻ tấn công nào có thể làm điều đó thì đã có đủ đặc quyền để thực thi mã native tùy ý rồi, và khi đó mọi thứ đều không còn gì đảm bảo. Đây là ví dụ `Elvis` của chúng ta dưới dạng enum:

```java
// Enum singleton - the preferred approach
public enum Elvis {
    INSTANCE;
    private String[] favoriteSongs =
        { "Hound Dog", "Heartbreak Hotel" };
    public void printFavorites() {
        System.out.println(Arrays.toString(favoriteSongs));
    }
}
```

Việc dùng `readResolve` để kiểm soát instance chưa hẳn đã lỗi thời. Nếu bạn phải viết một class serializable có kiểm soát instance mà các instance của nó không được biết tại thời điểm biên dịch, bạn sẽ không thể biểu diễn class đó dưới dạng enum type.

**Khả năng truy cập (accessibility) của** `readResolve` **là quan trọng.** Nếu bạn đặt một method `readResolve` trên một class final, nó nên là private. Nếu bạn đặt một method `readResolve` trên một class không final, bạn phải cân nhắc cẩn thận khả năng truy cập của nó. Nếu nó là private, nó sẽ không áp dụng cho bất kỳ subclass nào. Nếu nó là package-private, nó sẽ chỉ áp dụng cho các subclass trong cùng package. Nếu nó là protected hoặc public, nó sẽ áp dụng cho tất cả các subclass không override nó. Nếu một method `readResolve` là protected hoặc public và một subclass không override nó, deserialize một instance của subclass sẽ tạo ra một instance của superclass, điều này nhiều khả năng gây ra `ClassCastException`.

Tóm lại, hãy dùng enum type để thực thi các bất biến về kiểm soát instance ở bất cứ đâu có thể. Nếu không thể và bạn cần một class vừa serializable vừa có kiểm soát instance, bạn phải cung cấp một method `readResolve` và đảm bảo rằng tất cả instance field của class đều là kiểu nguyên thủy hoặc transient.

## Item 90: Cân nhắc dùng serialization proxy thay cho các instance được serialize

Như đã đề cập trong Item 85 và 86 và được bàn xuyên suốt chương này, quyết định implement `Serializable` làm tăng khả năng xuất hiện lỗi và các vấn đề bảo mật vì nó cho phép tạo ra các instance bằng một cơ chế ngoài ngôn ngữ thay cho các constructor thông thường. Tuy nhiên, có một kỹ thuật giúp giảm đáng kể những rủi ro này. Kỹ thuật này được gọi là *serialization proxy pattern*.

Serialization proxy pattern khá đơn giản. Trước tiên, thiết kế một class lồng (nested class) private static biểu diễn một cách cô đọng trạng thái logic của một instance của class bao ngoài. Nested class này được gọi là *serialization proxy* của class bao ngoài. Nó nên có một constructor duy nhất, với kiểu tham số là class bao ngoài. Constructor này chỉ đơn thuần sao chép dữ liệu từ đối số của nó: nó không cần kiểm tra tính nhất quán hay sao chép phòng thủ. Theo thiết kế, serialized form mặc định của serialization proxy chính là serialized form hoàn hảo của class bao ngoài. Cả class bao ngoài lẫn serialization proxy của nó đều phải được khai báo implement `Serializable`.

Ví dụ, hãy xét class bất biến `Period` được viết trong **Item 50** và được làm cho serializable trong **Item 88**. Đây là một serialization proxy cho class này. `Period` đơn giản đến mức serialization proxy của nó có chính xác các field giống như class:

```java
// Serialization proxy for Period class
private static class SerializationProxy implements Serializable {
    private final Date start;
    private final Date end;

    SerializationProxy(Period p) {
        this.start = p.start;
        this.end = p.end;
    }

    private static final long serialVersionUID =
        234098243823485285L; // Any number will do (Item  87)
}
```

Tiếp theo, thêm method `writeReplace` sau vào class bao ngoài. Method này có thể được sao chép nguyên văn vào bất kỳ class nào có serialization proxy:

```java
// writeReplace method for the serialization proxy pattern
private Object writeReplace() {
    return new SerializationProxy(this);
}
```

Sự hiện diện của method này trên class bao ngoài khiến hệ thống serialization phát ra một instance `SerializationProxy` thay vì một instance của class bao ngoài. Nói cách khác, method `writeReplace` chuyển đổi một instance của class bao ngoài thành serialization proxy của nó trước khi serialize.

Với method `writeReplace` này được đưa vào, hệ thống serialization sẽ không bao giờ sinh ra một instance đã serialize của class bao ngoài, nhưng kẻ tấn công có thể chế tạo một instance như vậy nhằm vi phạm các bất biến của class. Để đảm bảo cuộc tấn công như vậy sẽ thất bại, chỉ cần thêm method `readObject` này vào class bao ngoài:

```java
// readObject method for the serialization proxy pattern
private void readObject(ObjectInputStream stream)
        throws InvalidObjectException {
    throw new InvalidObjectException("Proxy required");
}
```

Cuối cùng, cung cấp một method `readResolve` trên class `SerializationProxy` trả về một instance tương đương về mặt logic của class bao ngoài. Sự hiện diện của method này khiến hệ thống serialization chuyển đổi serialization proxy trở lại thành một instance của class bao ngoài khi deserialize.

Method `readResolve` này tạo ra một instance của class bao ngoài chỉ bằng API public của nó, và đó chính là vẻ đẹp của pattern này. Nó phần lớn loại bỏ tính chất ngoài ngôn ngữ của serialization, vì instance được deserialize được tạo ra bằng cùng các constructor, static factory và method như bất kỳ instance nào khác. Điều này giải phóng bạn khỏi việc phải đảm bảo riêng rằng các instance được deserialize tuân thủ các bất biến của class. Nếu các static factory hoặc constructor của class thiết lập các bất biến này và các instance method của nó duy trì chúng, bạn đã đảm bảo rằng các bất biến cũng sẽ được duy trì bởi serialization.

Đây là method `readResolve` cho `Period.SerializationProxy` ở trên:

```java
// readResolve method for Period.SerializationProxy
private Object readResolve() {
    return new Period(start, end);    // Uses public constructor
}
```

Giống như cách tiếp cận sao chép phòng thủ (trang 357), cách tiếp cận serialization proxy chặn đứng hoàn toàn cuộc tấn công bằng luồng byte giả mạo (trang 354) và cuộc tấn công đánh cắp field nội bộ (trang 356). Khác với hai cách tiếp cận trước, cách này cho phép các field của `Period` là final, điều cần thiết để class `Period` thực sự bất biến (**Item 17**). Và khác với hai cách tiếp cận trước, cách này không đòi hỏi phải suy nghĩ nhiều. Bạn không phải tìm ra field nào có thể bị xâm phạm bởi các cuộc tấn công serialization tinh vi, cũng không phải thực hiện kiểm tra tính hợp lệ một cách tường minh như một phần của deserialization.

Còn một khía cạnh khác mà serialization proxy pattern mạnh hơn sao chép phòng thủ trong `readObject`. Serialization proxy pattern cho phép instance được deserialize có class khác với instance được serialize ban đầu. Bạn có thể không nghĩ rằng điều này hữu ích trong thực tế, nhưng nó thực sự hữu ích.

Hãy xét trường hợp của `EnumSet` (**Item 36**). Class này không có constructor public, chỉ có các static factory. Từ góc nhìn của client, chúng trả về các instance `EnumSet`, nhưng trong hiện thực OpenJDK hiện tại, chúng trả về một trong hai subclass, tùy thuộc vào kích thước của enum type bên dưới. Nếu enum type bên dưới có sáu mươi tư phần tử trở xuống, các static factory trả về một `RegularEnumSet`; nếu không, chúng trả về một `JumboEnumSet`.

Bây giờ hãy xét điều gì xảy ra nếu bạn serialize một enum set mà enum type của nó có sáu mươi phần tử, sau đó thêm năm phần tử nữa vào enum type, rồi deserialize enum set đó. Nó là một instance `RegularEnumSet` khi được serialize, nhưng tốt hơn hết nó nên là một instance `JumboEnumSet` sau khi được deserialize. Thực tế, đó chính xác là điều xảy ra, vì `EnumSet` dùng serialization proxy pattern. Nếu bạn tò mò, đây là serialization proxy của `EnumSet`. Nó thực sự đơn giản như thế này:

```java
// EnumSet's serialization proxy
private static class SerializationProxy <E extends Enum<E>>
        implements Serializable {
    // The element type of this enum set.
    private final Class<E> elementType;

    // The elements contained in this enum set.
    private final Enum<?>[] elements;

    SerializationProxy(EnumSet<E> set) {
        elementType = set.elementType;
        elements = set.toArray(new Enum<?>[0]);
    }

    private Object readResolve() {
        EnumSet<E> result = EnumSet.noneOf(elementType);
        for (Enum<?> e : elements)
            result.add((E)e);
        return result;
    }

    private static final long serialVersionUID =
        362491234563181265L;
}
```

Serialization proxy pattern có hai hạn chế. Nó không tương thích với các class có thể được người dùng mở rộng (**Item 19**). Ngoài ra, nó không tương thích với một số class mà đồ thị đối tượng của chúng chứa các vòng tròn: nếu bạn cố gọi một method trên một đối tượng như vậy từ bên trong method `readResolve` của serialization proxy của nó, bạn sẽ nhận được `ClassCastException` vì bạn chưa có đối tượng đó, mà chỉ có serialization proxy của nó.

Cuối cùng, sức mạnh và sự an toàn tăng thêm của serialization proxy pattern không phải là miễn phí. Trên máy của tôi, serialize và deserialize các instance `Period` bằng serialization proxy tốn kém hơn 14 phần trăm so với dùng sao chép phòng thủ.

Tóm lại, hãy cân nhắc serialization proxy pattern bất cứ khi nào bạn thấy mình phải viết một method `readObject` hoặc `writeObject` trên một class mà client không thể mở rộng. Pattern này có lẽ là cách dễ nhất để serialize một cách vững chắc các đối tượng có những bất biến không tầm thường.
