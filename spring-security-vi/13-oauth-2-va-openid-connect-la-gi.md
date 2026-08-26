# Chương 13: OAuth 2 và OpenID Connect là gì?

> ⚠️ **Ghi chú:** Các vị trí đánh dấu `[…]` là những dòng bị cắt cụt ngay trong file PDF gốc (không thể khôi phục từ nguồn).

**Chương này bao gồm**

- Mục đích của access token

- Cách cấp phát và xác thực token trong hệ thống OAuth 2

- Các vai trò tham gia vào hệ thống OAuth 2/OpenID Connect

Giả sử bạn đang làm việc cho một tổ chức lớn và sử dụng nhiều công cụ khác nhau trong công việc hàng ngày. Bạn dùng ứng dụng theo dõi lỗi (bug tracker), ứng dụng tài liệu hóa công việc, ứng dụng chấm công, v.v. Với mỗi công cụ, bạn đều phải xác thực để có thể làm việc. Liệu bạn có muốn sử dụng các bộ thông tin đăng nhập (credentials) khác nhau cho từng ứng dụng này không? Tất nhiên, cách đó vẫn hoạt động được, nhưng nó sẽ cực kỳ phiền toái cho người dùng (chính là bạn), đồng thời làm phức tạp hóa mục tiêu cốt lõi của các ứng dụng mà bạn làm việc cùng.

Đối với bạn, sự phức tạp đến từ việc phải ghi nhớ hàng tá tài khoản và phải đăng nhập nhiều lần vào từng ứng dụng. Đối với bản thân các ứng dụng, gánh nặng phát sinh do chúng phải tự triển khai tính năng lưu trữ, bảo vệ thông tin đăng nhập và xử lý quy trình xác thực thực tế.

Vậy tại sao không chuyển giao trách nhiệm lưu trữ thông tin đăng nhập và xác thực cho một ứng dụng độc lập? Khi đó, người dùng chỉ cần đăng nhập một lần duy nhất là có thể sử dụng tất cả các ứng dụng mà không cần bận tâm đến việc xác thực lặp đi lặp lại. Liệu có giải pháp nào như vậy không? Câu trả lời là có. Bạn có thể triển khai cơ chế xác thực dựa trên đặc tả OAuth 2.

Thứ hai, chúng ta có thể hướng tới một bức tranh lớn hơn. Một ứng dụng phục vụ người dùng đại chúng (những người nằm ngoài tổ chức — một ứng dụng bạn tạo ra cho cả thế giới) cũng cần có tính năng xác thực. Ứng dụng hoàn toàn có thể tự triển khai các tính năng đó, nhưng:

- Việc tự hiện thực hóa cơ chế xác thực đòi hỏi rất nhiều thời gian và công sức.

- Người dùng buộc phải tạo thêm một bộ thông tin đăng nhập riêng cho ứng dụng của bạn.

- Đôi khi, người dùng không đủ tin tưởng để tạo tài khoản riêng cho từng ứng dụng nhỏ lẻ mà họ sử dụng.

Liệu bạn có thể cho phép người dùng đăng nhập bằng những tài khoản họ đã sở hữu từ trước? Chẳng hạn, thay vào đó, người dùng ứng dụng của bạn có thể đăng nhập bằng tài khoản Facebook, GitHub, Twitter hoặc Google của họ được không? Chắc chắn bạn đã bắt gặp điều này ở khắp mọi nơi trên Internet. Các ứng dụng web hiện nay đều cho phép người dùng đăng ký và đăng nhập thông qua các nền tảng mạng xã hội khác nhau. Bằng cách này, ứng dụng cho phép người dùng xác thực bằng tài khoản sẵn có mà bạn không cần phải tự mình triển khai một hệ thống xác thực phức tạp. Cách tiếp cận này giúp:

- Giảm thiểu chi phí (ví dụ: chi phí phát triển và bảo trì hệ thống xác thực trong ứng dụng của bạn)

- Tránh các rào cản về lòng tin của người dùng (chẳng hạn như việc họ phải đăng ký và để lại một bộ thông tin đăng nhập khác cho ứng dụng của bạn quản lý)

- Giúp người dùng tối giản số lượng tài khoản cần quản lý

OAuth 2 là một đặc tả hướng dẫn cách phân tách trách nhiệm xác thực trong một hệ thống. Nhờ đó, nhiều ứng dụng có thể dùng chung một ứng dụng khác đóng vai trò xử lý xác thực, giúp người dùng đăng nhập nhanh hơn, giữ an toàn cho thông tin cá nhân và giảm thiểu chi phí phát triển ứng dụng.

Chúng ta sẽ bắt đầu với phần 13.1, nơi tôi giới thiệu các thành phần chính tham gia vào một hệ thống có cơ chế xác thực và ủy quyền được xây dựng trên đặc tả OAuth 2. Trong phần 13.1, bạn sẽ nắm rõ trách nhiệm của từng thành phần trong hệ thống OAuth 2, bao gồm: người dùng (user), ứng dụng khách (client), máy chủ ủy quyền (authorization server) và máy chủ tài nguyên (resource server). Trong phần 13.2, chúng ta sẽ thảo luận về token. Token hoạt động giống như chiếc chìa khóa vạn năng của ứng dụng. Bạn sẽ biết được các loại token khác nhau và thời điểm tối ưu để áp dụng từng loại. Phần 13.3 sẽ điểm lại các phương thức cấp token quan trọng nhất (chúng ta sẽ triển khai và kiểm thử các phương thức này trong chương 14). Cuối cùng, chương này sẽ khép lại với phần 13.4, nơi chúng ta phân tích các cạm bẫy tiềm ẩn cần lưu ý khi triển khai OAuth 2.

Trước khi bắt đầu, tôi muốn lưu ý rằng chương này chỉ đưa ra một góc nhìn khái quát và tinh gọn nhất để giúp bạn dễ dàng tiếp cận các cuộc thảo luận chuyên sâu hơn ở chương 14 đến chương 16. Mục tiêu của tôi không phải là biến bạn thành một chuyên gia về OAuth 2 và OpenID Connect chỉ sau một chương duy nhất. Điều đó gần như là bất khả thi, bởi cả hai giao thức này đều rất phức tạp và đã có những cuốn sách dày cộp viết riêng về chúng. Nếu muốn đào sâu hơn, tôi đề xuất bạn tìm đọc cuốn OAuth 2 in Action của Justin Richer và Antonio Sanso (Manning, 2017) cùng cuốn OpenID Connect in Action của Prabath Siriwardena (Manning, 2023).

## 13.1 Bức tranh toàn cảnh về OAuth 2 và OpenID Connect

Hãy tưởng tượng bạn có một buổi phỏng vấn tại một tập đoàn lớn. Bạn được hẹn đến trụ sở chính của họ để trao đổi trực tiếp. Tuy nhiên, không phải ai cũng có thể tự do ra vào văn phòng công ty. Họ có những quy trình nghiêm ngặt dành riêng cho khách viếng thăm.

Để vào được tòa nhà và tham dự buổi phỏng vấn, trước tiên bạn phải đến quầy lễ tân và xuất trình giấy tờ tùy thân (như căn cước công dân) để xác minh danh tính. Sau khi xác minh thành công, lễ tân sẽ cấp cho bạn một chiếc thẻ từ ra vào, cho phép bạn mở một số cánh cửa nhất định. Thậm chí, bạn không thể sử dụng tùy ý tất cả các thang máy mà chỉ có thể đi những thang máy được chỉ định.

Quy trình vào tòa nhà để phỏng vấn này rất giống với cách thức hoạt động của cơ chế xác thực (authentication) và ủy quyền (authorization) trong mô hình OAuth 2. Bạn chính là người dùng (user) cần thực hiện một tác vụ cụ thể (đi đến phòng phỏng vấn được chỉ định). Để làm việc đó, bạn xuất trình thông tin định danh của mình (giấy tờ tùy thân) để xác thực tại quầy lễ tân (máy chủ ủy quyền - authorization server). Khi đã chứng minh được danh tính, bạn nhận được thẻ từ ra vào (token). Nhưng bạn chỉ có thể dùng token này để tiếp cận các tài nguyên cụ thể (như thang máy và các phòng ban được phép). Bạn cũng chỉ có thể sử dụng thẻ từ này trong một khoảng thời gian ngắn. Sau khi phỏng vấn xong, bạn phải trả lại thẻ cho quầy lễ tân. Trong phần này, chúng ta sẽ thảo luận về các thành phần tương tác với nhau trong hệ thống OAuth 2, và bạn sẽ thấy nó tương đồng thế nào với việc đến trụ sở công ty để phỏng vấn. Chúng ta cũng sẽ tìm hiểu về bản chất đặc tả của OAuth 2 cũng như sự khác biệt giữa OpenID Connect (một giao thức) và OAuth 2 (đặc tả nền tảng của nó). Tôi tin rằng việc thấu hiểu tường tận các khái niệm đằng sau cơ chế xác thực và ủy quyền này là cực kỳ quan trọng trước khi chúng ta bắt tay vào viết code ở các chương 14, 15 và 16.

Trước tiên, hãy cùng tìm hiểu các thực thể đóng vai trò chủ chốt trong hệ thống OAuth 2. Khi nói đến "thực thể" (actor), tôi muốn ám chỉ bất kỳ thành phần nào tham gia vào quá trình vận hành hệ thống. Trong một hệ thống OAuth 2, bạn sẽ bắt gặp các thực thể sau:

- Người dùng (User) — Cá nhân sử dụng ứng dụng. Người dùng thường tương tác trực tiếp với một ứng dụng frontend, ứng dụng này được gọi là client. Không phải lúc nào hệ thống OAuth 2 cũng có sự xuất hiện của người dùng; chúng ta sẽ thảo luận chi tiết vấn đề này trong phần 13.3.3 khi tìm hiểu về phương thức cấp quyền bằng thông tin xác thực của client (client credentials grant).

- Ứng dụng khách (Client app) — Ứng dụng gọi đến một dịch vụ backend để truy xuất hoặc xử lý các dữ liệu và tính năng cụ thể. Client có thể là ứng dụng web, ứng dụng di động, ứng dụng desktop hoặc thậm chí là một dịch vụ backend độc lập. Thông thường, khi client là một dịch vụ backend, hệ thống sẽ không có sự tham gia của người dùng cuối.

- Máy chủ tài nguyên (Resource server) — Ứng dụng backend chịu trách nhiệm ủy quyền và phản hồi các yêu cầu được gửi đến từ một hoặc nhiều ứng dụng khách.

- Máy chủ ủy quyền (Authorization server) — Ứng dụng chịu trách nhiệm xác thực người dùng và lưu trữ an toàn các thông tin đăng nhập.

Bây giờ, hãy phân tích cách thức quá trình xác thực và ủy quyền diễn ra trên thực tế. Các bước thực hiện rất đơn giản:

1. Người dùng thực hiện một thao tác cụ thể trên ứng dụng khách (client).

2. Ứng dụng khách cần được cấp quyền gọi đến máy chủ tài nguyên (resource server) để xử lý yêu cầu của người dùng.

3. Để được cấp quyền, trước tiên client phải yêu cầu máy chủ ủy quyền cấp một token (gọi là access token). Token này thực chất là một thông tin đặc hiệu giúp client chứng minh rằng máy chủ ủy quyền đã xác thực danh tính của họ thành công.

4. Client đính kèm token do máy chủ ủy quyền cấp để xác thực khi gửi yêu cầu đến backend (máy chủ tài nguyên).

Luồng xử lý chi tiết được biểu diễn qua chuỗi các bước sau:

1. Người dùng cố gắng thực hiện một thao tác cụ thể trên ứng dụng khách.

2. Ứng dụng khách biết rằng nó không thể gọi đến backend nếu không có một token hợp lệ để xác thực. Client sẽ gửi yêu cầu cấp access token đến máy chủ ủy quyền.

3. Nhận được yêu cầu từ ứng dụng khách, máy chủ ủy quyền sẽ tạo ra một token và gửi lại cho ứng dụng khách.

4. Client sử dụng token này để gửi yêu cầu đến backend (máy chủ tài nguyên).

5. Máy chủ tài nguyên xác thực yêu cầu của client dựa trên token được gửi kèm. Nếu xác thực thành công, máy chủ tài nguyên sẽ thực thi yêu cầu của client và trả về kết quả.

6. Ứng dụng khách hiển thị kết quả cho người dùng.

Vậy chính xác thì token do máy chủ ủy quyền cấp là gì? Token có thể là bất kỳ mẩu dữ liệu nào (thường là một chuỗi ký tự) cho phép client chứng minh rằng họ (và/hoặc người dùng) đã được xác thực bởi máy chủ ủy quyền. Token cũng là phương tiện để truy xuất thông tin chi tiết về cả người dùng và client khi cần thiết. Vì máy chủ ủy quyền hiện tại đảm nhận việc quản lý toàn bộ thông tin của người dùng và client, nên đôi khi backend cần lấy một phần các thông tin này từ máy chủ ủy quyền để sử dụng. Backend sẽ lấy các chi tiết đó thông qua token. Trong một số trường hợp, bản thân token đã chứa sẵn các thông tin cần thiết (như bạn sẽ đọc trong phần 13.2, loại token này được gọi là non-opaque token); nếu không, backend buộc phải gọi đến máy chủ ủy quyền để lấy dữ liệu về client và người dùng (tức là opaque token). Thêm vào đó, không giống như chìa khóa vật lý, access token có vòng đời rất ngắn. Nó sẽ hết hạn sau một khoảng thời gian ngắn (thường là vài phút), sau đó client phải yêu cầu máy chủ ủy quyền cấp một token mới. Nhờ cơ chế này, một token bị thất lạc (giống như chiếc chìa khóa bị mất) sẽ không thể bị kẻ xấu lợi dụng lâu dài.

OAuth 2 định nghĩa nhiều luồng xử lý khác nhau để client có thể nhận được token. Chúng ta gọi các luồng này là "phương thức cấp quyền" (grant types), và trong phần 13.3, chúng ta sẽ thảo luận về các phương thức cấp quyền phổ biến nhất.

## 13.2 Các cách thức triển khai token

Token là những chiếc thẻ từ ra vào mà client sử dụng để xác thực khi gửi yêu cầu đến backend (máy chủ tài nguyên). Token đóng vai trò tối quan trọng trong quy trình xác thực và ủy quyền của OAuth 2, bởi chúng không chỉ là bằng chứng xác nhận tính hợp lệ của client và người dùng, mà còn là phương tiện giúp backend thu thập thêm thông tin chi tiết về họ.

Trong phần này, chúng ta sẽ tìm hiểu cách phân loại token và cách thức ứng dụng từng loại token vào quy trình ủy quyền thực tế.

Chúng ta phân loại token dựa trên cách thức chúng cung cấp dữ liệu xác thực cho máy chủ tài nguyên:

- Opaque (Dạng đục/Không trong suốt) — Các token này không tự lưu trữ dữ liệu bên trong. Để thực hiện việc ủy quyền, máy chủ tài nguyên thường phải gọi lại máy chủ ủy quyền, truyền vào opaque token đó để lấy thông tin chi tiết. Cuộc gọi này được gọi là cuộc gọi thẩm định (introspection call).

- Non-opaque (Dạng rõ/Trong suốt) — Các token tự lưu trữ dữ liệu bên trong, giúp backend có thể thực hiện việc ủy quyền ngay lập tức mà không cần truy vấn thêm. JSON Web Token (JWT) là cơ chế triển khai non-opaque token được sử dụng rộng rãi nhất hiện nay.

### 13.2.1 Sử dụng opaque token

Opaque token không chứa bất kỳ dữ liệu nào mà backend có thể đọc trực tiếp để nhận diện người dùng, client hay áp dụng các quy tắc ủy quyền. Opaque token chỉ đơn thuần là một bằng chứng xác nhận rằng một phiên đăng nhập đã thành công. Khi nhận được một opaque token, máy chủ tài nguyên buộc phải thực hiện một cuộc gọi đến máy chủ ủy quyền để kiểm tra xem token đó có còn hiệu lực hay không, đồng thời lấy thêm các thông tin cần thiết để áp dụng các ràng buộc ủy quyền.

Một opaque token thực sự giống như một chiếc chìa khóa rương báu. Bản thân chiếc chìa khóa không tiết lộ bất kỳ thông tin nào; bạn chỉ biết nó có hoạt động hay không khi trực tiếp tra vào ổ khóa. Một khi xác định được chiếc chìa khóa là khớp, bạn mới có thể tiếp cận được những thứ ẩn chứa bên trong rương (trong trường hợp này là thông tin chi tiết của người dùng và client).

Máy chủ tài nguyên sẽ gọi đến một endpoint được cung cấp bởi máy chủ ủy quyền để kiểm tra tính hợp lệ của opaque token và lấy về các thông tin cần thiết của client cùng người dùng được cấp token đó. Thao tác này được gọi là thẩm định token (token introspection). Sau khi có được các thông tin này, máy chủ tài nguyên mới có thể áp dụng các quy tắc kiểm soát quyền truy cập.

### 13.2.2 Sử dụng non-opaque token

Khác với opaque token mà chúng ta vừa thảo luận ở phần 13.2.1, non-opaque token chứa sẵn các thông tin về client và người dùng do máy chủ ủy quyền nhúng vào trong quá trình xác thực. Bạn có thể liên tưởng non-opaque token với một văn bản đã được ký đóng dấu.

Cơ chế hiện thực hóa non-opaque token phổ biến nhất hiện nay là JWT. Một JWT được cấu thành từ ba phần:

- Header (Tiêu đề) — Thường chứa thông tin cấu hình của token, chẳng hạn như thuật toán mã hóa được sử dụng để ký token hoặc ID của khóa (key ID) mà máy chủ ủy quyền đã dùng để ký.

- Body/Payload (Thân/Nội dung) — Thường chứa dữ liệu về thực thể được cấp token, chẳng hạn như thông tin chi tiết của client và người dùng.

- Signature (Chữ ký) — Một giá trị được tạo ra bằng các thuật toán mật mã nhằm chứng minh rằng token này thực sự do máy chủ ủy quyền phát hành và nội dung của nó (trong phần header và body) không hề bị thay đổi hay giả mạo kể từ thời điểm khởi tạo.

Dữ liệu trong phần header và body được định dạng dưới dạng JSON (JavaScript Object Notation), sau đó được mã hóa Base64 để tối giản kích thước và dễ dàng truyền tải trên môi trường mạng. Ba phần này được phân tách với nhau bằng dấu chấm (`.`).

Ví dụ về cấu trúc của các thành phần này trước khi mã hóa:

Header:

```json
{
  "alg": "HS256"
}
```

Body:

```json
{
  "username": "bill",
  "roles": ["admin"]
}
```

Signature:

```
Chuỗi mã băm được tạo ra dựa trên header và body
```

Đoạn văn bản dưới đây minh họa một chuỗi JWT hoàn chỉnh sau khi cả ba phần đã được mã hóa Base64 và nối với nhau bằng các dấu chấm:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lI […]
```

Lúc này chắc chắn bạn sẽ tự hỏi: "Khi nào tôi nên dùng opaque token, và khi nào nên dùng non-opaque token?" Như tôi đã chia sẻ ở trên, non-opaque token hiện đang là lựa chọn phổ biến nhất vì chúng giúp loại bỏ hoàn toàn các cuộc gọi thẩm định (introspection) để xác thực token. Tuy nhiên, vì non-opaque token mang theo dữ liệu và client phải truyền tải dữ liệu này qua môi trường mạng đến backend, bất kỳ ai đánh cắp được token đều có thể đọc được các thông tin nhúng bên trong nó. Trong hầu hết các trường hợp, đây không phải là vấn đề quá nghiêm trọng. Và tôi khuyên bạn nên tránh việc nhồi nhét quá nhiều dữ liệu nhạy cảm vào trong token.

Nhưng bạn phải làm sao nếu có một lượng lớn dữ liệu hoặc có những thông tin quá nhạy cảm, không an toàn để truyền tải tự do trên mạng thông qua token? Trong trường hợp đó, opaque token sẽ là một giải pháp thay thế tuyệt vời. Lời khuyên của tôi là hãy luôn ưu tiên cân nhắc non-opaque token trước tiên, và chỉ chuyển sang dùng opaque token khi lượng dữ liệu cần truyền tải quá lớn, hoặc khi bạn cần truyền các thông tin cực kỳ nhạy cảm và muốn tránh việc để lộ chúng trực tiếp trên token.

## 13.3 Nhận token thông qua các phương thức cấp quyền khác nhau

Phần này sẽ thảo luận về các phương thức cấp quyền (grant types). Phương thức cấp quyền là một quy trình chuẩn hóa giúp ứng dụng khách lấy được token. Trong thực tế phát triển ứng dụng, bạn sẽ gặp nhiều cách thức khác nhau để client lấy token từ máy chủ ủy quyền. Chúng ta sẽ cùng tìm hiểu ba phương thức cấp quyền được sử dụng rộng rãi nhất. Ở cuối phần này, chúng ta cũng sẽ khám phá cách client có thể tự động tái tạo (re-generate) một token mới sau khi token cũ hết hạn.

> **LƯU Ý**
>
> Có thể bạn vẫn sẽ bắt gặp một số ứng dụng triển khai hai phương thức cấp quyền khác là: implicit (cấp quyền ngầm định) và password grant (cấp quyền bằng mật khẩu). Hai phương thức này hiện đã bị phản đối (deprecated) vì các chuyên gia bảo mật phát hiện ra chúng không còn đảm bảo an toàn. Chúng ta sẽ không thảo luận về chúng trong cuốn sách này và tôi khuyên bạn tuyệt đối không nên áp dụng chúng vào các dự án thực tế nữa. Bạn luôn có thể thay thế chúng bằng một trong các phương thức cấp quyền an toàn hơn được đề cập trong chương này. Nếu muốn tìm hiểu sâu hơn về password grant type, bạn có thể tham khảo phần thảo luận rất chi tiết tại chương 12 thuộc ấn bản lần thứ nhất của cuốn sách này. Chúng ta cũng sẽ lướt nhanh qua implicit grant type và lý do tại sao nó bị khai tử khi thảo luận về authorization code grant type ngay dưới đây.

Phần 13.3.1 thảo luận về authorization code grant type (phương thức cấp mã ủy quyền) — phương thức phổ biến nhất hiện nay khi hệ thống cần cho phép người dùng xác thực. Trong phần 13.3.2, chúng ta tìm hiểu về một cơ chế bổ trợ cực kỳ quan trọng cho authorization code — PKCE (Proof Key for Code Exchange). Phần 13.3.3 tiếp tục với kịch bản ứng dụng cần lấy token mà không cần có sự tương tác hay đăng nhập của người dùng cuối, và chúng ta sẽ khép lại với cách tái tạo token ở phần 13.3.4.

### 13.3.1 Lấy token bằng phương thức cấp mã ủy quyền (Authorization Code Grant)

Phương thức cấp mã ủy quyền (authorization code grant) là phương thức được sử dụng phổ biến nhất hiện nay khi ứng dụng cần xác thực người dùng cuối:

1. Người dùng muốn thực hiện một hành động nào đó trong ứng dụng họ đang dùng. Ví dụ, hãy tưởng tượng cô gái ở phía bên trái sơ đồ là Mary, một kế toán viên muốn xem danh sách toàn bộ các hóa đơn cần thanh toán của công ty.

2. Ứng dụng mà Mary đang dùng đóng vai trò là client. Trong trường hợp này, Mary đang ngồi trước máy tính, vì vậy ứng dụng khách của cô là một ứng dụng web. Nhưng ngay cả khi Mary sử dụng phiên bản di động của ứng dụng, luồng đi của phương thức cấp quyền này vẫn hoàn toàn tương tự. Vì Mary chưa đăng nhập, ứng dụng khách sẽ tự động chuyển hướng (redirect) cô đến trang đăng nhập được lưu trữ trên máy chủ ủy quyền.

3. Lúc này, Mary nhìn thấy trang đăng nhập hiển thị trên trình duyệt của mình. Trang đăng nhập này không nằm trong ứng dụng hóa đơn mà cô vừa truy cập, mà được cung cấp bởi một hệ thống quản lý tập trung khác. Mary nhanh chóng nhận ra đây là hệ thống xác thực tập trung của công ty mà cô vẫn dùng để đăng nhập vào mọi ứng dụng nội bộ khác. Mary biết rằng sau khi nhập thông tin đăng nhập, trình duyệt sẽ tự động đưa cô quay trở lại ứng dụng hóa đơn để cô có thể xem dữ liệu và làm việc. Cô điền thông tin tài khoản và nhấn nút đăng nhập.

4. Vì thông tin Mary cung cấp hoàn toàn chính xác, máy chủ ủy quyền sẽ chuyển hướng trình duyệt quay trở lại ứng dụng hóa đơn. Đồng thời, máy chủ ủy quyền cũng cung cấp cho ứng dụng ban đầu (client) một đoạn mã độc nhất vô nhị gọi là "mã ủy quyền" (authorization code). Client sẽ dùng chính mã này để đổi lấy access token.

5. Client gửi yêu cầu lấy access token. Client bắt buộc phải có access token này thì mới có thể gửi các yêu cầu hợp lệ đến backend của nó (máy chủ tài nguyên).

6. Vì mã ủy quyền gửi lên hoàn toàn trùng khớp (chính là mã mà máy chủ đã cấp ở bước 4), máy chủ ủy quyền sẽ phản hồi bằng một access token.

7. Ứng dụng khách sử dụng access token này để gửi yêu cầu đến backend của nó và thực hiện xác thực thành công.

Dưới đây là một vài lưu ý quan trọng giúp bạn nắm bắt luồng xử lý này một cách thấu đáo:

- Hãy chú ý đến các mũi tên nét đứt. Đây là chi tiết cực kỳ quan trọng: chúng biểu thị các hành động chuyển hướng (redirect) trên trình duyệt chứ không phải là các yêu cầu (request) hay phản hồi (response) trực tiếp giữa các server với nhau. Ở bước 2, client chuyển hướng người dùng đến trang đăng nhập của máy chủ ủy quyền (chuyển hướng trình duyệt sang một trang web thuộc ứng dụng khác). Ở bước 4, máy chủ ủy quyền chuyển hướng ngược lại trình duyệt về ứng dụng khách và đính kèm mã ủy quyền (thường là dưới dạng tham số truy vấn - query parameter).

- Mary (người dùng) hoàn toàn không hề biết đến sự tồn tại của các bước từ 4 đến 7. Sau khi đăng nhập thành công, trải nghiệm cuối cùng của cô chỉ đơn giản là nhìn thấy danh sách hóa đơn hiển thị trên màn hình — kết quả mà ứng dụng khách lấy được sau khi hoàn tất bước 7 thành công.

- Hãy lưu ý không nhầm lẫn giữa mã ủy quyền (authorization code) và access token. Access token mới là đích đến cuối cùng mà client cần để xác thực với backend (bước 7). Nhưng để chạm tới access token, client bắt buộc phải đi đường vòng để lấy được mã ủy quyền trước (bước 4 và 5).

Ngoài ra, rất nhiều lập trình viên khi mới tiếp cận quy trình xác thực và ủy quyền thường thắc mắc ở bước 4: "Tại sao máy chủ ủy quyền không trả thẳng access token về đây luôn cho tiện?" Việc bắt client phải thực hiện thêm một bước trung gian để đổi mã lấy token có vẻ như đang làm phức tạp hóa vấn đề một cách không cần thiết.

Nhưng cơ chế này hoàn toàn có lý do của nó. Trên thực tế, trong phiên bản đầu tiên của OAuth, máy chủ ủy quyền đã từng trả thẳng access token ngay tại bước 4 thay vì trả về mã ủy quyền. Đó chính là phương thức cấp quyền ngầm định (implicit grant type) hiện đã bị loại bỏ và nghiêm cấm sử dụng. Lý do là vì hành động chuyển hướng (redirect) trên trình duyệt cực kỳ dễ bị đánh chặn, và một kẻ tấn công có ý đồ xấu có thể dễ dàng tóm được access token này. Bằng cách chỉ trả về mã ủy quyền trung gian, máy chủ ủy quyền buộc client phải thực hiện thêm một yêu cầu trực tiếp (direct request) từ server-to-server, nơi client phải tự xác thực lại bằng chính thông tin đăng nhập của nó (client credentials). Nhờ đó, ngay cả khi kẻ xấu có chặn được trình duyệt và lấy được mã ủy quyền, họ cũng không thể đổi lấy access token nếu không có trong tay thông tin đăng nhập bí mật của client.

### 13.3.2 Áp dụng cơ chế bảo mật PKCE cho phương thức cấp mã ủy quyền

Điều gì sẽ xảy ra nếu kẻ xấu bằng cách nào đó sở hữu được cả thông tin đăng nhập bí mật của client? Trong trường hợp tồi tệ đó, chúng hoàn toàn có thể giả mạo client để đổi lấy access token và gửi các yêu cầu phá hoại đến máy chủ tài nguyên. Liệu có giải pháp nào để ngăn chặn kịch bản này? Có, cơ chế Khóa chứng thực trao đổi mã (PKCE - Proof Key for Code Exchange, thường được phát âm là "pixy") chính là một lớp bảo mật bổ sung được thiết kế riêng cho luồng cấp mã ủy quyền nhằm nâng cao tính an toàn lên một tầm cao mới. Trong phần này, chúng ta sẽ phân tích cách thức PKCE vô hiệu hóa nỗ lực chiếm đoạt access token ngay cả khi kẻ xấu đã đánh cắp được thông tin đăng nhập của client.

Việc áp dụng PKCE chỉ can thiệp và làm thay đổi hai bước cụ thể trong luồng cấp mã ủy quyền mà chúng ta đã thảo luận ở phần 13.3.1. Dưới đây là cách thức PKCE vận hành tại hai bước này:

1. Đầu tiên, client sẽ tự động tạo ra một giá trị ngẫu nhiên. Giá trị này có thể là một chuỗi byte ngẫu nhiên, được gọi là mã xác thực (verifier).

2. Tiếp theo, client sẽ áp dụng một hàm băm mật mã (hash function) lên mã xác thực vừa tạo ở bước 1. Hàm băm là một thuật toán mã hóa một chiều, nghĩa là bạn không thể dịch ngược kết quả đầu ra để tìm lại dữ liệu đầu vào ban đầu (như đã thảo luận ở chương 4). Kết quả thu được sau khi băm mã xác thực được gọi là mã thử thách (challenge).

```java
verifier = random();
challenge = hash(verifier);
```

Client sẽ gửi kèm mã thử thách (challenge) này lên cùng với yêu cầu đăng nhập của người dùng ở bước 3. Máy chủ ủy quyền sẽ lưu lại mã thử thách này, đồng thời chờ đợi client gửi kèm mã xác thực (verifier) gốc lên trong yêu cầu đổi token ở bước 5. Nếu mã xác thực do client gửi lên ở bước 5 sau khi đi qua hàm băm cho ra kết quả trùng khớp với mã thử thách mà máy chủ đã lưu ở bước 3, máy chủ ủy quyền sẽ xác nhận ứng dụng đang yêu cầu cấp token chính là ứng dụng đã khởi xướng yêu cầu đăng nhập của người dùng trước đó. Nhờ cơ chế này, kẻ tấn công hoàn toàn không có cơ hội lấy được access token ngay cả khi chúng đã chặn và chiếm đoạt được mã ủy quyền ở bước 4. Bởi lẽ, để đổi được token, chúng bắt buộc phải cung cấp đúng mã xác thực (verifier) gốc. Kẻ tấn công không thể biết được mã xác thực này vì client chưa từng truyền nó lên môi trường mạng trước đó. Chúng cũng không thể suy ngược ra mã xác thực từ mã thử thách thu được ở bước 3, bởi hàm băm mật mã là một chiều và không thể bị giải mã ngược.

### 13.3.3 Lấy token bằng phương thức cấp quyền của client (Client Credentials Grant)

Đôi khi, ứng dụng cần được cấp quyền truy cập tài nguyên một cách tự động mà không cần đến bất kỳ sự tương tác hay đăng nhập nào từ phía người dùng cuối. Khi không có sự hiện diện của người dùng, ứng dụng sẽ sử dụng phương thức cấp quyền bằng thông tin xác thực của client (client credentials grant) để lấy access token. Kịch bản này thường xảy ra khi một dịch vụ backend cần gọi đến một dịch vụ backend khác khi có một sự kiện hệ thống kích hoạt, chẳng hạn như một tiến trình được lập lịch (cron job) chạy theo giờ. Với phương thức này, ứng dụng chỉ cần tự xác thực với máy chủ ủy quyền bằng chính thông tin đăng nhập của nó. Luồng xử lý diễn ra như sau:

1. Ứng dụng khách gửi yêu cầu cấp access token đến máy chủ ủy quyền, sử dụng thông tin đăng nhập của chính nó để xác thực.

2. Nếu thông tin đăng nhập hoàn toàn hợp lệ, máy chủ ủy quyền sẽ cấp access token cho ứng dụng.

3. Ứng dụng khách đính kèm access token này để thực hiện xác thực khi gửi yêu cầu truy xuất dữ liệu từ máy chủ tài nguyên.

### 13.3.4 Sử dụng refresh token để lấy access token mới

Một nguyên tắc cốt lõi mà bạn bắt buộc phải ghi nhớ về token là chúng chỉ được phép có một vòng đời tương đối ngắn. Thời gian tồn tại cụ thể của một token thường được quyết định tùy theo từng ngữ cảnh bảo mật của ứng dụng, nhưng thông thường nó chỉ kéo dài khoảng 15 phút, và cá nhân tôi chưa từng cấu hình hệ thống nào cho phép token sống quá một giờ. Sớm hay muộn, mọi token đều phải hết hạn. Một khi token đã hết hạn, máy chủ tài nguyên sẽ lập tức từ chối nó. Trong tình huống đó, khi client nhận ra token hiện tại đã hết hạn, họ có hai sự lựa chọn:

1. Bắt đầu lại toàn bộ quy trình của phương thức cấp quyền từ đầu để lấy một access token mới. Điều này đồng nghĩa với việc bắt người dùng phải thực hiện đăng nhập lại nếu ứng dụng đang sử dụng phương thức cấp mã ủy quyền.

2. Sử dụng một refresh token để đổi lấy access token mới một cách âm thầm.

Refresh token là một cơ chế cực kỳ hữu ích, đặc biệt là khi client sử dụng các phương thức cấp quyền yêu cầu sự tương tác của người dùng như phương thức cấp mã ủy quyền. Hãy thử tưởng tượng nếu ứng dụng cấu hình access token chỉ có thời hạn 15 phút. Với tư cách là người dùng, liệu bạn có cảm thấy phát điên khi cứ mỗi 15 phút ứng dụng lại đẩy bạn ra trang đăng nhập và bắt bạn nhập lại mật khẩu không? Chắc chắn là có! Để giải quyết triệt để vấn đề này, ứng dụng khách có thể sử dụng refresh token để lấy một access token mới hoàn toàn tự động thay vì làm phiền người dùng bắt họ phải đăng nhập lại mỗi khi access token cũ hết hạn. Quy trình sử dụng refresh token diễn ra qua các bước sau:

1. Người dùng thực hiện thao tác yêu cầu dữ liệu, đồng nghĩa với việc client phải gọi xuống backend.

2. Do access token hiện tại đã hết hạn, client cần phải lấy một mã mới. Client sẽ gửi refresh token lên máy chủ ủy quyền để chứng minh rằng họ chính là thực thể đã xác thực thành công trước đó.

3. Máy chủ ủy quyền xác thực tính hợp lệ của refresh token và phản hồi lại cho client một access token mới.

4. Client sử dụng access token mới này để gọi xuống backend (máy chủ tài nguyên) và tiếp tục thực hiện yêu cầu của người dùng một cách trơn tru.

## 13.4 Những giá trị OpenID Connect mang lại cho OAuth 2

Hiện nay vẫn còn tồn tại rất nhiều sự mơ hồ và nhầm lẫn xung quanh hai khái niệm OpenID Connect (thường gọi tắt là OIDC) và OAuth 2, cũng như sự khác biệt thực sự giữa chúng. Tôi thường khuyên các học viên của mình rằng không cần phải quá căng thẳng về chủ đề này: "Một khi bạn đã hiểu rõ OAuth 2, bạn tự khắc sẽ biết cách làm việc với OpenID Connect."

Thực chất, OIDC là một giao thức (protocol) được xây dựng trực tiếp trên nền tảng đặc tả (specification) của OAuth 2. Đó là lý do tại sao việc thấu hiểu OAuth 2 sẽ giúp bạn dễ dàng làm chủ OIDC. Hãy để tôi lấy một ví dụ thực tế để giúp bạn phân biệt rõ ràng giữa "đặc tả" và "giao thức".

Tất cả chúng ta đều sử dụng ổ cắm điện hàng ngày. Tuy nhiên, hình dáng của các ổ cắm điện lại có sự khác biệt rất lớn tùy theo từng quốc gia. Đây thực sự là một cơn ác mộng mỗi khi bạn đi du lịch nước ngoài. Bạn thường phải mang theo các đầu chuyển đổi (adapter) để đảm bảo có thể sạc được điện thoại hay máy tính của mình, đặc biệt là khi di chuyển giữa các châu lục khác nhau.

Thế nhưng, đằng sau lớp vỏ nhựa khác biệt đó, tất cả các ổ cắm điện trên thế giới đều vận hành theo chung một nguyên lý vật lý. Luôn có các sợi dây dẫn truyền tải điện áp. Chúng ta có thể định nghĩa một "khung đặc tả" chung cho mọi ổ cắm điện trên toàn cầu chỉ với hai gạch đầu dòng đơn giản:

- Một ổ cắm điện tiêu chuẩn luôn có ba sợi dây để dòng điện lưu thông: dây pha (dây nóng), dây trung tính (dây nguội) và dây tiếp địa (dây mát). Trong đó dây tiếp địa có thể có hoặc không.

- Ổ cắm điện cung cấp một mức điện áp tiêu chuẩn nằm trong khoảng 120 Volt hoặc 230 Volt.

Ngay cả khi bạn không phải là một kỹ sư điện, bạn cũng không cần quá bận tâm đến hai gạch đầu dòng kỹ thuật trên — ít nhất là cho việc học Spring Security. Hãy cứ tạm tin tôi ở điểm này.

Vấn đề nằm ở chỗ: mặc dù tất cả các ổ cắm trên thế giới đều tuân thủ hoàn hảo các đặc tả vật lý nêu trên, chúng ta vẫn phải khốn khổ mang theo các bộ chuyển đổi khi đi du lịch. Nguyên nhân là vì các quốc gia không sử dụng chung một "giao thức" thiết kế đầu cắm vật lý giống nhau. Các bộ adapter sinh ra là để chuyển đổi đầu cắm từ giao thức của vùng này sang giao thức của vùng khác (ví dụ: từ chuẩn Bắc Mỹ sang chuẩn Châu Âu).

Câu chuyện tương tự cũng xảy ra với các ứng dụng phần mềm trong thế giới xác thực và ủy quyền. Nếu hai ứng dụng cùng tuân theo đặc tả OAuth 2, chúng vẫn có nguy cơ xung đột và không thể giao tiếp trực tiếp với nhau nếu không được viết thêm các bộ chuyển đổi, đơn giản là vì chúng không chạy trên cùng một giao thức. OpenID Connect xuất hiện như một giao thức chuẩn hóa, giúp siết chặt các quyền tự do quá rộng rãi của đặc tả OAuth 2 bằng cách đưa vào một số quy chuẩn đồng bộ. Những thay đổi mang tính bước ngoặt bao gồm:

- Định nghĩa sẵn các giá trị cụ thể cho phạm vi truy cập (scopes) tiêu chuẩn (chẳng hạn như profile hoặc openid).

- Bổ sung thêm một loại token đặc biệt gọi là ID token, được thiết kế riêng để lưu trữ thông tin nhận dạng chi tiết về người dùng và client được cấp token.

- Trong thế giới OIDC, thuật ngữ grant typt (phương thức cấp quyền) thường được gọi là flow (luồng xử lý), trong khi authorization server (máy chủ ủy quyền) thường được gọi bằng cái tên identity provider (nhà cung cấp danh tính) hay viết tắt là IdP.

## 13.5 Những gót chân Achilles của OAuth 2

Phần này sẽ phân tích các lỗ hổng bảo mật tiềm ẩn mà các ứng dụng sử dụng cơ chế xác thực và ủy quyền OAuth 2 có thể gặp phải. Việc thấu hiểu tường tận những kịch bản rủi ro này là vô cùng quan trọng để giúp bạn né tránh các sai lầm nghiêm trọng khi phát triển ứng dụng thực tế. Tất nhiên, giống như bất kỳ giải pháp công nghệ nào khác trong thế giới phần mềm, OAuth 2 không phải là một chiếc áo giáp chống đạn tuyệt đối. Nó vẫn tồn tại những điểm yếu cố hữu mà chúng ta cần đặc biệt lưu ý khi xây dựng hệ thống. Dưới đây là danh sách những lỗ hổng phổ biến nhất:

- Tấn công giả mạo yêu cầu chéo trang (CSRF) phía client — Khi người dùng đã đăng nhập thành công, các cuộc tấn công CSRF hoàn toàn có thể xảy ra nếu ứng dụng không được trang bị bất kỳ cơ chế phòng chống CSRF nào. Chúng ta đã có một cuộc thảo luận rất chi tiết về các giải pháp chống CSRF được tích hợp sẵn trong Spring Security tại chương 9.

- Đánh cắp thông tin đăng nhập của client — Việc lưu trữ hoặc truyền tải thông tin đăng nhập của client một cách hớ hênh, không được mã hóa bảo vệ sẽ tạo cơ hội cho tin tặc dễ dàng đánh cắp và lạm dụng chúng.

- Tấn công phát lại token (Token replay) — Như đã phân tích ở phần 13.2, token chính là những "chiếc chìa khóa" bảo mật mà chúng ta truyền tải qua môi trường mạng để truy cập tài nguyên trong kiến trúc OAuth 2. Trong quá trình truyền tải này, chúng hoàn toàn có nguy cơ bị kẻ xấu chặn bắt. Nếu bị đánh cặn, những chiếc chìa khóa này coi như đã bị đánh cắp và kẻ gian có thể sử dụng lại chúng nhiều lần. Hãy tưởng tượng bạn bị đánh rơi chùm chìa khóa nhà ngay trước cửa. Điều gì sẽ xảy ra? Bất kỳ ai nhặt được đều có thể dùng nó để tự do ra vào nhà bạn bao nhiêu lần tùy thích (phát lại).

- Đánh tráo token (Token hijacking) — Kẻ tấn công can thiệp trực tiếp vào quy trình xác thực để nẫng tay trên các token và dùng chúng để chiếm đoạt tài nguyên. Đây cũng là một nguy cơ bảo mật tiềm ẩn đối với refresh token, bởi nếu refresh token bị lộ, kẻ xấu có thể dùng nó để liên tục tạo ra các access token mới để phá hoại lâu dài. Để tìm hiểu sâu hơn về vấn đề này, tôi đề xuất bạn tham khảo bài viết rất hữu ích tại địa chỉ: http://mng.bz/am5z.

Hãy luôn ghi nhớ rằng: OAuth 2 chỉ là một khung đặc tả lý thuyết. Các lỗ hổng bảo mật phát sinh hoàn toàn là do quá trình triển khai các tính năng trên thực tế bị sai lệch hoặc thiếu sót. Việc sử dụng Spring Security sẽ giúp chúng ta giảm thiểu tối đa phần lớn các nguy cơ bảo mật này trong ứng dụng. Khi xây dựng ứng dụng với Spring Security, như bạn đã thấy trong chương này, công việc của chúng ta chỉ là thiết lập cấu hình chuẩn xác, còn toàn bộ luồng xử lý phức tạp và an toàn đã được Spring Security tự động đảm nhận bên dưới. Để tìm hiểu chi tiết hơn về các lỗ hổng liên quan đến khung đặc tả OAuth 2 và cách thức một tin tặc có thể khai thác chúng trong thực tế, bạn có thể tham khảo phần 3 của cuốn sách OAuth 2 In Action viết bởi Justin Richer và Antonio Sanso (Manning, 2017), hiện có sẵn tại địa chỉ: http://mng.bz/g7Ql.

## Tóm tắt

- Khung đặc tả OAuth 2 vạch ra các phương thức an toàn giúp một hệ thống backend xác thực các client của nó. OpenID Connect là một giao thức chuẩn hóa việc triển khai OAuth 2 bằng cách áp dụng thêm các ràng buộc kỹ thuật chặt chẽ.

- Bốn thực thể cốt lõi trong một hệ thống OAuth 2 bao gồm:

    - Người dùng (User) — Cá nhân muốn thực thi một tác vụ cụ thể trong hệ thống.

    - Ứng dụng khách (Client) — Ứng dụng cần được cấp quyền để truy cập tài nguyên hoặc thực thi tác vụ trên hệ thống backend.

    - Máy chủ tài nguyên (Resource server) — Hệ thống backend có nhiệm vụ xác thực quyền truy cập của client trước khi cho phép họ thực thi tác vụ hoặc chạm vào tài nguyên bảo mật.

    - Máy chủ ủy quyền (Authorization server) — Ứng dụng chịu trách nhiệm quản lý thông tin tài khoản của cả người dùng và client, xử lý quy trình đăng nhập và cấp phát token làm công cụ để ủy quyền.

- Token đóng vai trò như một chiếc thẻ từ ra vào (hoặc chìa khóa) mà client nhận được từ máy chủ ủy quyền, dùng để chứng minh quyền hạn khi gọi đến các tính năng hoặc truy cập tài nguyên trên một backend được bảo vệ (máy chủ tài nguyên).

- Chúng ta phân loại token thành hai nhóm chính:

    - Opaque (Dạng đục) — Các token không tự chứa thông tin chi tiết về người dùng hay client được cấp. Đối với loại này, máy chủ tài nguyên luôn phải gọi ngược lại máy chủ ủy quyền để kiểm tra tính hợp lệ và lấy dữ liệu cần thiết. Yêu cầu kiểm tra này được gọi là thẩm định token (introspection).

    - Non-opaque (Dạng rõ) — Các token chứa sẵn thông tin chi tiết về người dùng và client ngay bên trong cấu trúc của nó. Cơ chế hiện thực hóa phổ biến nhất của non-opaque token chính là JSON Web Token (JWT).

- Có nhiều luồng xử lý khác nhau giúp ứng dụng khách yêu cầu máy chủ ủy quyền cấp token. Các luồng này được gọi là phương thức cấp quyền (grant types). Các phương thức phổ biến nhất gồm có:

    - Phương thức cấp mã ủy quyền (Authorization code grant)

    - Phương thức cấp quyền bằng thông tin xác thực của client (Client credentials grant)

- Trong nhiều trường hợp, chúng ta tăng cường bảo mật cho phương thức cấp mã ủy quyền bằng cách áp dụng cơ chế khóa chứng thực trao đổi mã (PKCE). Với giải pháp này, client sử dụng thêm các giá trị bảo mật động để ngăn chặn kẻ xấu chiếm đoạt access token ngay cả khi chúng đã đánh cắp được thông tin đăng nhập của client và mã ủy quyền.

- Trong các tình huống cụ thể, ứng dụng cần phải lấy access token mới mà không muốn làm phiền người dùng bắt họ phải đăng nhập lại. Để giải quyết bài toán này, ứng dụng có thể sử dụng refresh token. Refresh token là một loại token đặc biệt chỉ có một nhiệm vụ duy nhất là đổi lấy các access token mới.
