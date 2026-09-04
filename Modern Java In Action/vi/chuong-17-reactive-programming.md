# Chương 17. Reactive programming

> **Nội dung chương này**
>
> - Định nghĩa reactive programming và thảo luận các nguyên tắc của Reactive Manifesto
> - Reactive programming ở cấp độ ứng dụng và cấp độ hệ thống
> - Trình bày code ví dụ sử dụng reactive streams và Flow API của Java 9
> - Giới thiệu RxJava, một thư viện reactive được sử dụng rộng rãi
> - Khám phá các thao tác của RxJava để biến đổi và kết hợp nhiều reactive stream
> - Giới thiệu marble diagram, loại sơ đồ minh hoạ trực quan các thao tác trên reactive streams

Trước khi đào sâu vào việc reactive programming là gì và nó hoạt động ra sao, sẽ hữu ích nếu ta làm rõ vì sao mô hình lập trình mới này ngày càng trở nên quan trọng. Cách đây vài năm, những ứng dụng lớn nhất cũng chỉ có vài chục server và vài gigabyte dữ liệu; thời gian phản hồi vài giây và thời gian bảo trì ngoại tuyến tính bằng giờ vẫn được xem là chấp nhận được. Ngày nay, tình hình này đang thay đổi nhanh chóng vì ít nhất ba lý do:

- **Big Data** — Big Data thường được đo bằng petabyte và tăng lên mỗi ngày.
- **Môi trường không đồng nhất (Heterogeneous environments)** — Các ứng dụng được triển khai trong đủ loại môi trường, từ thiết bị di động cho tới các cluster trên đám mây chạy hàng nghìn bộ xử lý đa nhân.
- **Thói quen sử dụng (Use patterns)** — Người dùng kỳ vọng thời gian phản hồi tính bằng mili giây và thời gian hoạt động 100%.

Những thay đổi này hàm ý rằng các đòi hỏi của ngày hôm nay không còn được đáp ứng bởi kiến trúc phần mềm của ngày hôm qua. Điều này càng trở nên rõ ràng khi thiết bị di động đã là nguồn phát sinh lưu lượng internet lớn nhất, và mọi thứ chỉ có thể tệ hơn trong tương lai gần khi lưu lượng đó bị vượt qua bởi Internet of Things (IoT).

Reactive programming giải quyết các vấn đề này bằng cách cho phép bạn xử lý và kết hợp các luồng (stream) dữ liệu đến từ những hệ thống và nguồn khác nhau theo cách asynchronous. Thực tế, các ứng dụng viết theo mô hình này phản ứng với từng phần tử dữ liệu ngay khi chúng xuất hiện, nhờ đó chúng phản hồi nhanh hơn trong tương tác với người dùng. Hơn nữa, cách tiếp cận reactive không chỉ áp dụng được cho việc xây dựng một component hay một ứng dụng đơn lẻ, mà còn để phối hợp nhiều component thành một reactive system hoàn chỉnh. Các hệ thống được thiết kế theo cách này có thể trao đổi và định tuyến message trong những điều kiện mạng biến động, đồng thời đảm bảo tính sẵn sàng dưới tải nặng, có tính đến cả các sự cố và gián đoạn. (Lưu ý rằng mặc dù các lập trình viên theo truyền thống vẫn xem hệ thống hay ứng dụng của mình là được xây từ các component, nhưng trong phong cách xây dựng hệ thống kiểu mashup, ghép nối lỏng lẻo này, bản thân những component đó thường lại là cả một ứng dụng hoàn chỉnh. Do vậy, component và ứng dụng gần như là những từ đồng nghĩa.)

Các tính năng và ưu điểm đặc trưng cho những ứng dụng và hệ thống reactive được đúc kết trong Reactive Manifesto, mà chúng ta sẽ bàn tới trong mục tiếp theo.

## 17.1. Reactive Manifesto

Reactive Manifesto (https://www.reactivemanifesto.org) — được Jonas Bonér, Dave Farley, Roland Kuhn và Martin Thompson phát triển trong hai năm 2013 và 2014 — đã hình thức hoá một tập các nguyên tắc cốt lõi để phát triển các ứng dụng và hệ thống reactive. Bản Manifesto này xác định bốn đặc tính:

- **Responsive (phản hồi tốt)** — Một reactive system có thời gian phản hồi nhanh và, quan trọng hơn nữa, ổn định và dự đoán được. Nhờ vậy, người dùng biết mình có thể trông đợi điều gì. Điều này lại làm tăng sự tin tưởng của người dùng, một khía cạnh chắc chắn là then chốt của một ứng dụng dùng được.
- **Resilient (kiên cường)** — Hệ thống phải duy trì được khả năng phản hồi bất chấp các sự cố. Reactive Manifesto gợi ý nhiều kỹ thuật khác nhau để đạt được tính kiên cường, bao gồm nhân bản việc thực thi của các component, tách rời các component đó theo thời gian (bên gửi và bên nhận có vòng đời độc lập) và theo không gian (bên gửi và bên nhận chạy trong những tiến trình khác nhau), cũng như để mỗi component uỷ thác công việc cho các component khác một cách asynchronous.
- **Elastic (co giãn)** — Một vấn đề khác gây tổn hại đến khả năng phản hồi của ứng dụng là việc chúng có thể phải chịu những mức tải khác nhau trong suốt vòng đời. Các reactive system được thiết kế để tự động phản ứng với khối lượng công việc nặng hơn bằng cách tăng lượng tài nguyên cấp phát cho những component bị ảnh hưởng.
- **Message-driven (hướng message)** — Tính kiên cường và tính co giãn đòi hỏi ranh giới giữa các component tạo nên hệ thống phải được định nghĩa rõ ràng để bảo đảm sự ghép nối lỏng lẻo, sự cô lập và tính trong suốt về vị trí (location transparency). Việc giao tiếp xuyên qua những ranh giới này được thực hiện thông qua trao đổi message asynchronous. Lựa chọn này cho phép đạt được cả tính kiên cường (bằng cách uỷ thác các sự cố dưới dạng message) lẫn tính co giãn (bằng cách theo dõi số lượng message được trao đổi rồi điều chỉnh tương ứng số lượng tài nguyên dùng để xử lý chúng).

Hình 17.1 cho thấy bốn đặc tính này liên hệ và phụ thuộc lẫn nhau như thế nào. Những nguyên tắc này đúng ở nhiều quy mô khác nhau, từ việc tổ chức nội bộ một ứng dụng nhỏ cho đến việc xác định cách các ứng dụng đó phải được phối hợp để dựng nên một hệ thống lớn. Tuy nhiên, những điểm cụ thể liên quan đến mức độ chi tiết mà các ý tưởng này được áp dụng đáng để bàn kỹ hơn.

> **Hình 17.1.** Các đặc tính chính của một reactive system

### 17.1.1. Reactive ở cấp độ ứng dụng

Tính năng chính của reactive programming đối với các component ở cấp độ ứng dụng là cho phép các tác vụ được thực thi asynchronous. Như chúng ta sẽ bàn trong phần còn lại của chương này, việc xử lý các luồng sự kiện theo cách asynchronous và non-blocking là điều thiết yếu để tối đa hoá mức độ sử dụng của các CPU đa nhân hiện đại và, chính xác hơn, của những thread đang cạnh tranh để dùng chúng. Để đạt mục tiêu này, các framework và thư viện reactive chia sẻ các thread (vốn là tài nguyên tương đối đắt đỏ và khan hiếm) giữa những cấu trúc nhẹ hơn như future; actor; và (phổ biến hơn cả) event loop điều phối một chuỗi callback nhằm tổng hợp, biến đổi và quản lý các sự kiện cần xử lý.

> **Kiểm tra kiến thức nền**
>
> Nếu bạn thấy bối rối với các thuật ngữ như event, message, signal và event loop (hoặc publish-subscribe, listener và backpressure, những khái niệm sẽ được dùng ở phần sau của chương này), hãy đọc phần giới thiệu nhẹ nhàng hơn ở chương 15. Nếu không, hãy đọc tiếp.

Các kỹ thuật này không chỉ có lợi ích là rẻ hơn thread, mà còn có một ưu điểm lớn dưới góc nhìn của lập trình viên: chúng nâng mức trừu tượng của việc cài đặt các ứng dụng đồng thời và asynchronous, cho phép lập trình viên tập trung vào yêu cầu nghiệp vụ thay vì phải vật lộn với những vấn đề kinh điển của đa luồng mức thấp như đồng bộ hoá, race condition và deadlock.

Điều quan trọng nhất cần chú ý khi sử dụng những chiến lược ghép kênh thread (thread-multiplexing) này là **không bao giờ được thực hiện các thao tác blocking bên trong event loop chính**. Sẽ hữu ích nếu ta xem là thao tác blocking tất cả các thao tác I/O-bound như truy cập cơ sở dữ liệu hay hệ thống tệp, hoặc gọi một dịch vụ từ xa có thể mất nhiều thời gian hoặc mất một khoảng thời gian không đoán trước được để hoàn thành. Sẽ dễ hiểu và thú vị khi giải thích lý do bạn nên tránh các thao tác blocking bằng một ví dụ thực tế.

Hãy hình dung một kịch bản ghép kênh đơn giản nhưng điển hình với một pool gồm hai thread xử lý ba luồng sự kiện. Chỉ có hai luồng được xử lý cùng lúc, và các luồng phải cạnh tranh để chia sẻ hai thread đó sao cho công bằng và hiệu quả nhất có thể. Bây giờ giả sử việc xử lý một sự kiện của một luồng kích hoạt một thao tác I/O tiềm ẩn chậm chạp, chẳng hạn ghi vào hệ thống tệp hoặc lấy dữ liệu từ cơ sở dữ liệu bằng một API blocking. Như hình 17.2 cho thấy, trong tình huống này Thread 2 bị chặn một cách lãng phí trong lúc chờ thao tác I/O hoàn tất, nên mặc dù Thread 1 có thể xử lý luồng thứ nhất, luồng thứ ba lại không thể được xử lý cho tới khi thao tác blocking kết thúc.

> **Hình 17.2.** Một thao tác blocking giữ thread bận một cách lãng phí, ngăn nó thực hiện các tính toán khác.

Để khắc phục vấn đề này, hầu hết các framework reactive (như RxJava và Akka) cho phép các thao tác blocking được thực thi bởi một thread pool riêng, chuyên dụng. Toàn bộ thread trong pool chính khi đó được tự do chạy liên tục không gián đoạn, giữ cho tất cả các nhân CPU đạt mức sử dụng cao nhất có thể. Việc duy trì các thread pool riêng biệt cho các thao tác CPU-bound và I/O-bound còn có thêm lợi ích là cho phép bạn định cỡ và cấu hình các pool với mức độ chi tiết cao hơn, cũng như theo dõi hiệu năng của hai loại tác vụ này một cách chính xác hơn.

Phát triển ứng dụng theo các nguyên tắc reactive chỉ là một khía cạnh của reactive programming, và thường thậm chí còn chưa phải là khía cạnh khó nhất. Có được một tập hợp các ứng dụng reactive được thiết kế đẹp đẽ và chạy hiệu quả một cách riêng lẻ ít nhất cũng quan trọng ngang với việc khiến chúng hợp tác được với nhau trong một reactive system được phối hợp tốt.

### 17.1.2. Reactive ở cấp độ hệ thống

Một reactive system là một kiến trúc phần mềm cho phép nhiều ứng dụng hoạt động như một nền tảng thống nhất, kiên cường, đồng thời cho phép các ứng dụng đó được tách rời đủ mức để khi một trong số chúng hỏng, nó không kéo sập cả hệ thống. Điểm khác biệt chính giữa reactive application và reactive system là loại thứ nhất thường thực hiện các tính toán dựa trên những luồng dữ liệu phù du (ephemeral) và được gọi là **event-driven**. Loại thứ hai nhằm mục đích kết hợp các ứng dụng lại và tạo thuận lợi cho việc giao tiếp. Các hệ thống mang tính chất này thường được gọi là **message-driven**.

Một phân biệt quan trọng khác giữa message và event là message được hướng tới một đích đến xác định duy nhất, trong khi event là những sự kiện sẽ được nhận bởi các component đã đăng ký quan sát chúng. Trong reactive system, việc các message này mang tính asynchronous cũng là điều thiết yếu, để giữ cho thao tác gửi và thao tác nhận lần lượt được tách rời khỏi bên gửi và bên nhận. Sự tách rời này là một yêu cầu cho sự cô lập hoàn toàn giữa các component và là nền tảng để giữ cho hệ thống phản hồi tốt cả khi có sự cố (tính kiên cường) lẫn khi tải nặng (tính co giãn).

Chính xác hơn, trong các kiến trúc reactive, tính kiên cường đạt được bằng cách cô lập sự cố ngay tại component nơi chúng xảy ra, nhằm ngăn các trục trặc lan sang những component lân cận và từ đó lan theo dạng thác đổ thảm khốc ra phần còn lại của hệ thống. Tính kiên cường theo nghĩa reactive này còn hơn cả khả năng chịu lỗi (fault-tolerance). Hệ thống không suy giảm dần một cách nhẹ nhàng mà phục hồi hoàn toàn khỏi sự cố bằng cách cô lập chúng và đưa hệ thống trở lại trạng thái lành mạnh. "Phép màu" này có được nhờ việc khoanh vùng các lỗi và vật thể hoá (reify) chúng thành các message gửi tới những component khác đóng vai trò giám sát (supervisor). Bằng cách này, việc quản lý vấn đề có thể được thực hiện từ một ngữ cảnh an toàn nằm bên ngoài chính component đang gặp sự cố.

Nếu sự cô lập và tách rời là chìa khoá cho tính kiên cường, thì yếu tố chính tạo điều kiện cho tính co giãn là location transparency, cho phép bất kỳ component nào của một reactive system giao tiếp được với bất kỳ dịch vụ nào khác, bất kể bên nhận nằm ở đâu. Location transparency đến lượt nó cho phép hệ thống nhân bản và (tự động) mở rộng quy mô bất kỳ ứng dụng nào tuỳ theo khối lượng công việc hiện tại. Kiểu mở rộng quy mô không phụ thuộc vị trí như vậy cho thấy một khác biệt nữa giữa reactive application (asynchronous, đồng thời và tách rời theo thời gian) và reactive system (có thể trở nên tách rời theo không gian thông qua location transparency).

Trong phần còn lại của chương này, bạn sẽ đưa một số ý tưởng trên vào thực hành với vài ví dụ về reactive programming, và cụ thể là khám phá Flow API của Java 9.

## 17.2. Reactive streams và Flow API

Reactive programming là lối lập trình sử dụng reactive streams. Reactive streams là một kỹ thuật đã được chuẩn hoá (dựa trên giao thức publish-subscribe, hay pub-sub, đã được giải thích ở chương 15) để xử lý những luồng dữ liệu có thể vô hạn theo cách asynchronous, tuần tự và bắt buộc phải có backpressure non-blocking. Backpressure là một cơ chế điều khiển luồng (flow control) được dùng trong publish-subscribe để ngăn một bên tiêu thụ sự kiện chậm chạp bị quá tải bởi một hay nhiều bên sản xuất nhanh hơn. Khi tình huống này xảy ra, việc component đang chịu áp lực sụp đổ thảm khốc hoặc vứt bỏ sự kiện một cách mất kiểm soát là điều không thể chấp nhận. Component đó cần một cách để yêu cầu các bên sản xuất phía trên (upstream) chậm lại, hoặc để nói cho họ biết nó có thể tiếp nhận và xử lý bao nhiêu sự kiện tại một thời điểm trước khi nhận thêm dữ liệu.

Đáng lưu ý rằng yêu cầu về backpressure tích hợp sẵn được biện minh bởi bản chất asynchronous của việc xử lý luồng. Thực tế, khi các lời gọi đồng bộ được thực hiện, hệ thống ngầm được backpressure bởi chính các API blocking. Đáng tiếc là tình huống đó lại ngăn bạn thực hiện bất kỳ tác vụ hữu ích nào khác cho tới khi thao tác blocking hoàn tất, nên rốt cuộc bạn lãng phí rất nhiều tài nguyên vào việc chờ đợi. Ngược lại, với các API asynchronous, bạn có thể tối đa hoá mức sử dụng phần cứng, nhưng lại chịu rủi ro làm quá tải một component chậm hơn nào đó ở phía dưới (downstream). Cơ chế backpressure hay điều khiển luồng phát huy tác dụng trong tình huống này; chúng thiết lập một giao thức ngăn bên nhận dữ liệu bị quá tải mà không phải chặn bất kỳ thread nào.

Những yêu cầu này cùng hành vi mà chúng hàm ý đã được cô đọng trong dự án Reactive Streams[1] (www.reactive-streams.org), với sự tham gia của các kỹ sư từ Netflix, Red Hat, Twitter, Lightbend và nhiều công ty khác, và đã cho ra đời định nghĩa của bốn interface liên quan lẫn nhau, biểu diễn tập tính năng tối thiểu mà bất kỳ phần cài đặt Reactive Streams nào cũng phải cung cấp. Các interface này giờ đây là một phần của Java 9, được lồng bên trong class mới `java.util.concurrent.Flow`, và được cài đặt bởi nhiều thư viện của bên thứ ba, bao gồm Akka Streams (Lightbend), Reactor (Pivotal), RxJava (Netflix) và Vert.x (Red Hat). Trong mục tiếp theo, chúng ta sẽ xem xét chi tiết các phương thức được khai báo bởi những interface này và làm rõ cách chúng được kỳ vọng sẽ được dùng để biểu diễn các component reactive.

> **[1]** Chúng tôi viết hoa **Reactive Streams** khi nói về dự án, nhưng dùng **reactive streams** cho khái niệm.

### 17.2.1. Giới thiệu class Flow

Java 9 bổ sung một class mới cho reactive programming: `java.util.concurrent.Flow`. Class này chỉ chứa các thành phần static và không thể được khởi tạo. Class Flow chứa bốn interface lồng nhau để biểu diễn mô hình publish-subscribe của reactive programming như đã được dự án Reactive Streams chuẩn hoá:

- Publisher
- Subscriber
- Subscription
- Processor

Class Flow cho phép các interface liên quan lẫn nhau cùng các phương thức static thiết lập nên những component có điều khiển luồng, trong đó các Publisher sản xuất ra các phần tử được tiêu thụ bởi một hoặc nhiều Subscriber, mỗi Subscriber được quản lý bởi một Subscription. Publisher là bên cung cấp một số lượng sự kiện có thứ tự có thể vô hạn, nhưng nó bị ràng buộc bởi cơ chế backpressure để chỉ sản xuất chúng theo đúng nhu cầu nhận được từ (các) Subscriber của nó. Publisher là một functional interface của Java (chỉ khai báo duy nhất một phương thức trừu tượng) cho phép một Subscriber tự đăng ký làm listener cho các sự kiện do Publisher phát ra; việc điều khiển luồng, bao gồm cả backpressure, giữa Publisher và Subscriber được quản lý bởi một Subscription. Ba interface này, cùng với interface Processor, được thể hiện trong các listing 17.1, 17.2, 17.3 và 17.4.

**Listing 17.1. Interface Flow.Publisher**

```java
@FunctionalInterface
public interface Publisher<T> {
    void subscribe(Subscriber<? super T> s);
}
```

Ở phía bên kia, interface Subscriber có bốn phương thức callback được Publisher gọi khi nó sản sinh ra các sự kiện tương ứng.

**Listing 17.2. Interface Flow.Subscriber**

```java
public interface Subscriber<T> {
    void onSubscribe(Subscription s);
    void onNext(T t);
    void onError(Throwable t);
    void onComplete();
}
```

Các sự kiện đó phải được phát ra (và các phương thức tương ứng phải được gọi) tuân thủ nghiêm ngặt trình tự được định nghĩa bởi giao thức sau:

```text
onSubscribe onNext* (onError | onComplete)?
```

Ký hiệu này có nghĩa là `onSubscribe` luôn được gọi như sự kiện đầu tiên, theo sau là một số lượng tuỳ ý các tín hiệu `onNext`. Luồng sự kiện có thể tiếp diễn mãi mãi, hoặc có thể được kết thúc bởi callback `onComplete` để báo hiệu rằng sẽ không còn phần tử nào được sản sinh nữa, hoặc bởi `onError` nếu Publisher gặp sự cố. (Hãy so sánh với việc đọc từ terminal, khi bạn nhận được một chuỗi ký tự, hoặc một dấu hiệu kết thúc tệp, hoặc một lỗi I/O.)

Khi một Subscriber tự đăng ký với một Publisher, hành động đầu tiên của Publisher là gọi phương thức `onSubscribe` để trả về một đối tượng Subscription. Interface Subscription khai báo hai phương thức. Subscriber có thể dùng phương thức thứ nhất để thông báo cho Publisher rằng nó đã sẵn sàng xử lý một số lượng sự kiện nhất định; phương thức thứ hai cho phép nó huỷ Subscription, qua đó nói với Publisher rằng nó không còn quan tâm đến việc nhận sự kiện nữa.

**Listing 17.3. Interface Flow.Subscription**

```java
public interface Subscription {
    void request(long n);
    void cancel();
}
```

Đặc tả Flow của Java 9 định nghĩa một tập quy tắc mà theo đó các phần cài đặt của những interface này phải hợp tác với nhau. Có thể tóm tắt các quy tắc đó như sau:

- Publisher phải gửi cho Subscriber một số lượng phần tử không lớn hơn số được chỉ định bởi phương thức `request` của Subscription. Tuy nhiên, một Publisher có thể gửi ít `onNext` hơn số đã yêu cầu và kết thúc Subscription bằng cách gọi `onComplete` nếu thao tác kết thúc thành công, hoặc `onError` nếu nó thất bại. Trong những trường hợp này, khi một trạng thái kết thúc đã đạt tới (`onComplete` hoặc `onError`), Publisher không được gửi bất kỳ tín hiệu nào khác tới các Subscriber của nó, và Subscription phải được xem là đã bị huỷ.
- Subscriber phải thông báo cho Publisher rằng nó đã sẵn sàng nhận và xử lý n phần tử. Bằng cách này, Subscriber áp dụng backpressure lên Publisher, ngăn bản thân Subscriber bị quá tải bởi quá nhiều sự kiện cần quản lý. Hơn nữa, khi xử lý các tín hiệu `onComplete` hoặc `onError`, Subscriber không được phép gọi bất kỳ phương thức nào trên Publisher hay Subscription và phải xem Subscription là đã bị huỷ. Cuối cùng, Subscriber phải sẵn sàng nhận những tín hiệu kết thúc đó ngay cả khi trước đó chưa hề có lời gọi `Subscription.request()` nào, và sẵn sàng nhận một hoặc nhiều `onNext` ngay cả sau khi đã gọi `Subscription.cancel()`.
- Subscription được chia sẻ bởi đúng một Publisher và một Subscriber, và biểu diễn mối quan hệ duy nhất giữa hai bên. Vì lý do này, nó phải cho phép Subscriber gọi phương thức `request` của nó một cách đồng bộ từ cả `onSubscribe` lẫn `onNext`. Chuẩn quy định rằng phần cài đặt của phương thức `Subscription.cancel()` phải mang tính idempotent (gọi nhiều lần cũng cho cùng kết quả như gọi một lần) và thread-safe, sao cho sau lần gọi đầu tiên, mọi lời gọi bổ sung nào khác trên Subscription đều không có tác dụng. Việc gọi phương thức này yêu cầu Publisher rốt cuộc phải bỏ mọi tham chiếu tới Subscriber tương ứng. Việc đăng ký lại với cùng một đối tượng Subscriber là không được khuyến khích, nhưng đặc tả không bắt buộc phải ném ra ngoại lệ trong tình huống này, bởi khi đó mọi subscription đã bị huỷ trước đó sẽ phải được lưu giữ vô thời hạn.

Hình 17.3 minh hoạ vòng đời điển hình của một ứng dụng cài đặt các interface được định nghĩa bởi Flow API.

> **Hình 17.3.** Vòng đời của một reactive application sử dụng Flow API

Thành viên thứ tư và cũng là cuối cùng của class Flow là interface Processor, mở rộng cả Publisher lẫn Subscriber mà không đòi hỏi thêm phương thức nào.

**Listing 17.4. Interface Flow.Processor**

```java
public interface Processor<T, R> extends Subscriber<T>, Publisher<R> { }
```

Thực tế, interface này biểu diễn một giai đoạn biến đổi của các sự kiện được xử lý qua reactive stream. Khi nhận được lỗi, Processor có thể chọn phục hồi từ lỗi đó (và sau đó xem Subscription là đã bị huỷ) hoặc lập tức truyền tín hiệu `onError` tới (các) Subscriber của nó. Processor cũng nên huỷ Subscription phía upstream của mình khi Subscriber cuối cùng của nó huỷ Subscription, nhằm lan truyền tín hiệu huỷ (dù việc huỷ này không phải là bắt buộc nghiêm ngặt theo đặc tả).

Flow API/Reactive Streams API của Java 9 bắt buộc rằng mọi phần cài đặt của tất cả các phương thức trong interface Subscriber đều không bao giờ được chặn Publisher, nhưng nó không quy định các phương thức này phải xử lý sự kiện một cách đồng bộ hay asynchronous. Tuy nhiên, hãy lưu ý rằng tất cả các phương thức được định nghĩa bởi những interface này đều trả về `void`, nhờ đó chúng có thể được cài đặt theo cách hoàn toàn asynchronous.

Trong mục tiếp theo, bạn sẽ thử áp dụng những gì đã học được cho tới giờ thông qua một ví dụ thực tế đơn giản.

### 17.2.2. Tạo reactive application đầu tiên của bạn

Trong phần lớn trường hợp, các interface được định nghĩa trong class Flow không nhằm mục đích được cài đặt trực tiếp. Bất thường thay, thư viện Java 9 cũng chẳng cung cấp class nào cài đặt chúng! Các interface này được cài đặt bởi những thư viện reactive mà chúng ta đã nhắc tới (Akka, RxJava, v.v.). Đặc tả `java.util.concurrency.Flow` của Java 9 vừa đóng vai trò một bản hợp đồng mà mọi thư viện đó phải tuân thủ, vừa là một ngôn ngữ chung (lingua franca) cho phép các ứng dụng reactive được phát triển trên nền những thư viện reactive khác nhau hợp tác và trò chuyện với nhau. Hơn nữa, các thư viện reactive đó thường cung cấp nhiều tính năng hơn hẳn (các class và phương thức để biến đổi và trộn các reactive stream, vượt xa tập con tối thiểu được quy định bởi interface `java.util.concurrency.Flow`).

Dẫu vậy, việc bạn phát triển một reactive application đầu tiên trực tiếp trên nền Flow API của Java 9 vẫn có ý nghĩa, để cảm nhận xem bốn interface đã bàn ở các mục trước phối hợp với nhau ra sao. Với mục đích đó, bạn sẽ viết một chương trình báo cáo nhiệt độ đơn giản theo các nguyên tắc reactive. Chương trình này có hai component:

- **TempInfo**, mô phỏng một nhiệt kế từ xa (liên tục báo về những nhiệt độ được chọn ngẫu nhiên trong khoảng từ 0 đến 99 độ F, mức phù hợp với các thành phố Mỹ trong phần lớn thời gian)
- **TempSubscriber**, lắng nghe những báo cáo này và in ra luồng nhiệt độ được báo về bởi một cảm biến đặt tại một thị trấn cho trước

Bước đầu tiên là định nghĩa một class đơn giản mang thông tin nhiệt độ hiện đang được báo về, như trong listing sau.

**Listing 17.5. Một Java bean mang thông tin nhiệt độ hiện đang được báo về**

```java
import java.util.Random;

public class TempInfo {

    public static final Random random = new Random();

    private final String town;
    private final int temp;

    public TempInfo(String town, int temp) {
        this.town = town;
        this.temp = temp;
    }

    // Instance TempInfo cho một thị trấn cho trước được tạo qua một static factory method.
    public static TempInfo fetch(String town) {
        // Việc lấy nhiệt độ hiện tại có thể thất bại ngẫu nhiên một lần trên mười.
        if (random.nextInt(10) == 0)
            throw new RuntimeException("Error!");
        // Trả về một nhiệt độ ngẫu nhiên trong khoảng 0 đến 99 độ F
        return new TempInfo(town, random.nextInt(100));
    }

    @Override
    public String toString() {
        return town + " : " + temp;
    }

    public int getTemp() {
        return temp;
    }

    public String getTown() {
        return town;
    }
}
```

Sau khi định nghĩa mô hình miền đơn giản này, bạn có thể cài đặt một Subscription cho nhiệt độ của một thị trấn cho trước, gửi một báo cáo nhiệt độ mỗi khi Subscriber của nó yêu cầu, như trong listing sau.

**Listing 17.6. Một Subscription gửi luồng TempInfo tới Subscriber của nó**

```java
import java.util.concurrent.Flow.*;

public class TempSubscription implements Subscription {

    private final Subscriber<? super TempInfo> subscriber;
    private final String town;

    public TempSubscription( Subscriber<? super TempInfo> subscriber,
                             String town ) {
        this.subscriber = subscriber;
        this.town = town;
    }

    @Override
    public void request( long n ) {
        // Lặp một lần cho mỗi phần tử mà Subscriber yêu cầu
        for (long i = 0L; i < n; i++) {
            try {
                // Gửi nhiệt độ hiện tại tới Subscriber
                subscriber.onNext( TempInfo.fetch( town ) );
            } catch (Exception e) {
                // Nếu có lỗi khi lấy nhiệt độ, truyền lỗi tới Subscriber
                subscriber.onError( e );
                break;
            }
        }
    }

    @Override
    public void cancel() {
        // Nếu subscription bị huỷ, gửi tín hiệu hoàn tất (onComplete) tới Subscriber.
        subscriber.onComplete();
    }
}
```

Bước tiếp theo là tạo một Subscriber mà mỗi lần nhận được một phần tử mới sẽ in ra nhiệt độ nhận được từ Subscription và yêu cầu một báo cáo mới, như trong listing kế tiếp.

**Listing 17.7. Một Subscriber in ra các nhiệt độ nhận được**

```java
import java.util.concurrent.Flow.*;

public class TempSubscriber implements Subscriber<TempInfo> {

    private Subscription subscription;

    @Override
    public void onSubscribe( Subscription subscription ) {
        // Lưu lại subscription và gửi yêu cầu đầu tiên
        this.subscription = subscription;
        subscription.request( 1 );
    }

    @Override
    public void onNext( TempInfo tempInfo ) {
        // In nhiệt độ nhận được và yêu cầu thêm một giá trị nữa
        System.out.println( tempInfo );
        subscription.request( 1 );
    }

    @Override
    public void onError( Throwable t ) {
        // In thông báo lỗi trong trường hợp có lỗi
        System.err.println(t.getMessage());
    }

    @Override
    public void onComplete() {
        System.out.println("Done!");
    }
}
```

Listing tiếp theo đưa reactive application của bạn vào hoạt động với một class Main tạo ra một Publisher rồi đăng ký vào đó bằng TempSubscriber.

**Listing 17.8. Class main: tạo một Publisher và đăng ký TempSubscriber vào nó**

```java
import java.util.concurrent.Flow.*;

public class Main {
    public static void main( String[] args ) {
        // Tạo một Publisher mới cho nhiệt độ ở New York và đăng ký TempSubscriber vào đó
        getTemperatures( "New York" ).subscribe( new TempSubscriber() );
    }

    // Trả về một Publisher gửi một TempSubscription tới Subscriber đăng ký với nó
    private static Publisher<TempInfo> getTemperatures( String town ) {
        return subscriber -> subscriber.onSubscribe(
                                 new TempSubscription( subscriber, town ) );
    }
}
```

Ở đây, phương thức `getTemperatures` trả về một lambda expression nhận một Subscriber làm đối số và gọi phương thức `onSubscribe` của nó, truyền vào một instance TempSubscription mới. Bởi vì chữ ký của lambda này trùng khớp với phương thức trừu tượng duy nhất của functional interface Publisher, trình biên dịch Java có thể tự động chuyển lambda thành một Publisher (như bạn đã học ở chương 3). Phương thức `main` tạo một Publisher cho nhiệt độ ở New York rồi đăng ký một instance mới của class TempSubscriber vào đó. Chạy `main` sinh ra kết quả đại loại như sau:

```text
New York : 44
New York : 68
New York : 95
New York : 30
Error!
```

Trong lần chạy trên, TempSubscription đã lấy thành công nhiệt độ ở New York bốn lần nhưng thất bại ở lần đọc thứ năm. Có vẻ như bạn đã cài đặt bài toán một cách đúng đắn bằng cách dùng ba trong bốn interface của Flow API. Nhưng bạn có chắc là không có lỗi nào trong code không? Hãy suy nghĩ về câu hỏi này bằng cách hoàn thành quiz sau đây.

---

**Quiz 17.1:**

Ví dụ đã phát triển tới giờ có một vấn đề tinh vi. Tuy nhiên, vấn đề này bị che khuất bởi việc tại một thời điểm nào đó, luồng nhiệt độ sẽ bị gián đoạn bởi lỗi được sinh ngẫu nhiên bên trong factory method của TempInfo. Bạn có đoán được điều gì sẽ xảy ra nếu bạn comment câu lệnh sinh lỗi ngẫu nhiên đó đi và để `main` chạy đủ lâu không?

**Đáp án:**

Vấn đề với những gì bạn đã làm cho tới giờ là mỗi lần TempSubscriber nhận được một phần tử mới trong phương thức `onNext` của nó, nó lại gửi một yêu cầu mới tới TempSubscription, rồi phương thức `request` lại gửi thêm một phần tử nữa tới chính TempSubscriber. Những lời gọi đệ quy này được đẩy lên stack cái này nối tiếp cái kia cho tới khi stack tràn, sinh ra `StackOverflowError` như sau:

```text
Exception in thread "main" java.lang.StackOverflowError
     at java.base/java.io.PrintStream.print(PrintStream.java:666)
     at java.base/java.io.PrintStream.println(PrintStream.java:820)
     at flow.TempSubscriber.onNext(TempSubscriber.java:36)
     at flow.TempSubscriber.onNext(TempSubscriber.java:24)
     at flow.TempSubscription.request(TempSubscription.java:60)
     at flow.TempSubscriber.onNext(TempSubscriber.java:37)
     at flow.TempSubscriber.onNext(TempSubscriber.java:24)
     at flow.TempSubscription.request(TempSubscription.java:60)
     ...
```

---

Bạn có thể làm gì để sửa vấn đề này và tránh làm tràn stack? Một giải pháp khả dĩ là thêm một Executor vào TempSubscription rồi dùng nó để gửi các phần tử mới tới TempSubscriber từ một thread khác. Để đạt được mục tiêu này, bạn có thể sửa TempSubscription như trong listing kế tiếp. (Class này chưa đầy đủ; định nghĩa hoàn chỉnh sử dụng các phần định nghĩa còn lại từ listing 17.6.)

**Listing 17.9. Thêm một Executor vào TempSubscription**

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Phần code không thay đổi của TempSubscription gốc đã được lược bỏ.
public class TempSubscription implements Subscription {

    private static final ExecutorService executor =
                             Executors.newSingleThreadExecutor();

    @Override
    public void request( long n ) {
        // Gửi các phần tử tiếp theo tới subscriber từ một thread khác
        executor.submit( () -> {
            for (long i = 0L; i < n; i++) {
                try {
                    subscriber.onNext( TempInfo.fetch( town ) );
                } catch (Exception e) {
                    subscriber.onError( e );
                    break;
                }
            }
        });
    }
}
```

Cho tới giờ, bạn mới chỉ dùng ba trong bốn interface được định nghĩa bởi Flow API. Còn interface Processor thì sao? Một ví dụ tốt về cách dùng interface đó là tạo một Publisher báo cáo nhiệt độ theo thang Celsius thay vì Fahrenheit (dành cho các subscriber bên ngoài nước Mỹ).

### 17.2.3. Biến đổi dữ liệu với Processor

Như đã mô tả ở mục 17.2.1, một Processor vừa là một Subscriber vừa là một Publisher. Thực tế, mục đích của nó là đăng ký vào một Publisher rồi phát hành lại dữ liệu mà nó nhận được sau khi biến đổi dữ liệu đó. Như một ví dụ thực tế, hãy cài đặt một Processor đăng ký vào một Publisher phát ra nhiệt độ theo thang Fahrenheit và phát hành lại chúng sau khi chuyển sang thang Celsius, như trong listing kế tiếp.

**Listing 17.10. Một Processor biến đổi nhiệt độ từ Fahrenheit sang Celsius**

```java
import java.util.concurrent.Flow.*;

// Một processor biến đổi một TempInfo thành một TempInfo khác
public class TempProcessor implements Processor<TempInfo, TempInfo> {

    private Subscriber<? super TempInfo> subscriber;

    @Override
    public void subscribe( Subscriber<? super TempInfo> subscriber ) {
        this.subscriber = subscriber;
    }

    @Override
    public void onNext( TempInfo temp ) {
        // Phát hành lại TempInfo sau khi đã chuyển nhiệt độ sang Celsius
        subscriber.onNext( new TempInfo( temp.getTown(),
                                         (temp.getTemp() - 32) * 5 / 9) );
    }

    // Mọi tín hiệu khác đều được uỷ thác nguyên vẹn cho subscriber phía upstream.
    @Override
    public void onSubscribe( Subscription subscription ) {
        subscriber.onSubscribe( subscription );
    }

    @Override
    public void onError( Throwable throwable ) {
        subscriber.onError( throwable );
    }

    @Override
    public void onComplete() {
        subscriber.onComplete();
    }
}
```

Lưu ý rằng phương thức duy nhất của TempProcessor chứa logic nghiệp vụ là `onNext`, nơi phát hành lại nhiệt độ sau khi chuyển từ Fahrenheit sang Celsius. Tất cả các phương thức khác cài đặt interface Subscriber chỉ đơn thuần chuyển tiếp nguyên vẹn (uỷ thác) mọi tín hiệu nhận được cho Subscriber phía upstream, còn phương thức `subscribe` của Publisher thì đăng ký Subscriber phía upstream vào Processor.

Listing kế tiếp đưa TempProcessor vào hoạt động bằng cách dùng nó trong class Main của bạn.

**Listing 17.11. Class Main: tạo một Publisher và đăng ký TempSubscriber vào nó**

```java
import java.util.concurrent.Flow.*;

public class Main {
    public static void main( String[] args ) {
        // Tạo một Publisher mới cho nhiệt độ Celsius ở New York
        getCelsiusTemperatures( "New York" )
            // Đăng ký TempSubscriber vào Publisher
            .subscribe( new TempSubscriber() );
    }

    public static Publisher<TempInfo> getCelsiusTemperatures(String town) {
        return subscriber -> {
            // Tạo một TempProcessor và đặt nó giữa Subscriber và Publisher được trả về
            TempProcessor processor = new TempProcessor();
            processor.subscribe( subscriber );
            processor.onSubscribe( new TempSubscription(processor, town) );
        };
    }
}
```

Lần này, chạy Main sinh ra kết quả sau, với những nhiệt độ điển hình của thang Celsius:

```text
New York : 10
New York : -12
New York : 23
Error!
```

Trong mục này, bạn đã trực tiếp cài đặt các interface được định nghĩa trong Flow API, và qua đó, bạn đã làm quen với việc xử lý luồng asynchronous thông qua giao thức publish-subscribe, vốn tạo nên ý tưởng cốt lõi của Flow API. Nhưng có một điều hơi bất thường trong ví dụ này, mà chúng ta sẽ bàn tới trong mục tiếp theo.

### 17.2.4. Tại sao Java không cung cấp một phần cài đặt cho Flow API?

Flow API trong Java 9 khá kỳ lạ. Thư viện Java thường cung cấp cả interface lẫn phần cài đặt cho chúng, nhưng ở đây, bạn phải tự cài đặt Flow API. Hãy so sánh với List API. Như bạn đã biết, Java cung cấp interface `List<T>` được cài đặt bởi nhiều class, trong đó có `ArrayList<T>`. Chính xác hơn (và khá vô hình với người dùng), class `ArrayList<T>` mở rộng abstract class `AbstractList<T>`, class này lại cài đặt interface `List<T>`. Ngược lại, Java 9 khai báo interface `Publisher<T>` mà không cung cấp phần cài đặt nào, đó là lý do bạn phải tự định nghĩa lấy (bên cạnh lợi ích học tập mà bạn thu được từ việc cài đặt nó). Phải thừa nhận rằng: một interface đứng một mình có thể giúp bạn cấu trúc suy nghĩ lập trình của mình, nhưng nó không giúp bạn viết chương trình nhanh hơn!

Chuyện gì đang xảy ra vậy? Câu trả lời nằm ở lịch sử: đã có nhiều thư viện code Java về reactive streams (chẳng hạn Akka và RxJava). Ban đầu, các thư viện này được phát triển riêng rẽ, và mặc dù chúng đều cài đặt reactive programming thông qua các ý tưởng publish-subscribe, chúng lại dùng những cách gọi tên và API khác nhau. Trong quá trình chuẩn hoá của Java 9, những thư viện này đã tiến hoá để các class của chúng chính thức cài đặt các interface trong `java.util.concurrent.Flow`, thay vì chỉ đơn thuần cài đặt các khái niệm reactive. Chuẩn này giúp tăng khả năng cộng tác giữa các thư viện khác nhau.

Lưu ý rằng việc xây dựng một phần cài đặt reactive streams là phức tạp, nên phần lớn người dùng sẽ chỉ đơn giản dùng một phần cài đặt sẵn có. Giống như nhiều class cài đặt một interface, chúng thường cung cấp chức năng phong phú hơn nhiều so với mức tối thiểu mà một phần cài đặt cần có.

Trong mục tiếp theo, bạn sẽ dùng một trong những thư viện được sử dụng rộng rãi nhất: thư viện RxJava (reactive extensions to Java) do Netflix phát triển, cụ thể là phiên bản RxJava 2.0 hiện tại, vốn cài đặt các interface Flow của Java 9.

## 17.3. Sử dụng thư viện reactive RxJava

RxJava là một trong những thư viện đầu tiên để phát triển ứng dụng reactive trong Java. Nó ra đời tại Netflix như một bản chuyển đổi của dự án Reactive Extensions (Rx), vốn được Microsoft phát triển ban đầu trong môi trường .Net. RxJava phiên bản 2.0 đã được điều chỉnh để tuân thủ Reactive Streams API đã giải thích ở phần trước của chương này và được Java 9 tiếp nhận dưới dạng `java.util.concurrent.Flow`.

Khi bạn sử dụng một thư viện bên ngoài trong Java, điều này thể hiện rõ qua các câu lệnh import. Chẳng hạn, bạn import các interface Flow của Java, bao gồm cả Publisher, bằng một dòng như sau:

```java
import java.lang.concurrent.Flow.*;
```

Nhưng bạn cũng cần import các class cài đặt tương ứng bằng một dòng như

```java
import io.reactivex.Observable;
```

nếu bạn muốn dùng phần cài đặt Observable của Publisher, như bạn sẽ chọn làm ở phần sau của chương này.

Chúng ta phải nhấn mạnh một vấn đề kiến trúc: phong cách kiến trúc hệ thống tốt là tránh làm cho những khái niệm chi tiết vốn chỉ được dùng ở một phần của hệ thống trở nên hiện diện khắp toàn hệ thống. Theo đó, một thực hành tốt là chỉ dùng Observable ở nơi mà cấu trúc bổ sung của Observable thực sự cần thiết, còn những chỗ khác thì dùng interface Publisher của nó. Lưu ý rằng bạn vẫn tuân theo hướng dẫn này với interface List mà chẳng cần suy nghĩ. Ngay cả khi một phương thức được truyền vào một giá trị mà bạn biết chắc là một ArrayList, bạn vẫn khai báo tham số cho giá trị này có kiểu List, nhờ đó bạn tránh phơi bày và ràng buộc vào các chi tiết cài đặt. Quả thực, bạn cho phép một thay đổi cài đặt sau này từ ArrayList sang LinkedList mà không đòi hỏi phải sửa đổi ở khắp nơi.

Trong phần còn lại của mục này, bạn sẽ định nghĩa một hệ thống báo cáo nhiệt độ bằng cách dùng phần cài đặt reactive streams của RxJava. Vấn đề đầu tiên bạn gặp phải là RxJava cung cấp hai class, cả hai đều cài đặt `Flow.Publisher`.

Khi đọc tài liệu của RxJava, bạn sẽ thấy một class là `io.reactivex.Flowable`, bao gồm tính năng backpressure kiểu reactive dựa trên cơ chế kéo (pull-based) của Flow trong Java 9 (sử dụng `request`), được minh hoạ ở các listing 17.7 và 17.9. Backpressure ngăn một Subscriber bị tràn ngập bởi dữ liệu do một Publisher nhanh sản xuất. Class còn lại là phiên bản Publisher nguyên thuỷ của RxJava, `io.reactivex.Observable`, vốn không hỗ trợ backpressure. Class này vừa đơn giản hơn khi lập trình vừa phù hợp hơn cho các sự kiện giao diện người dùng (chẳng hạn chuyển động của chuột); những sự kiện này là các luồng không thể áp dụng backpressure một cách hợp lý. (Bạn đâu thể yêu cầu người dùng chậm lại hay ngừng di chuyển chuột!) Vì lý do này, RxJava cung cấp hai class cài đặt cho cùng một ý tưởng chung là luồng sự kiện.

Lời khuyên của RxJava là dùng Observable không backpressure khi bạn có một luồng không quá một nghìn phần tử, hoặc khi bạn đang xử lý các sự kiện GUI như di chuyển chuột hay chạm màn hình, vốn không thể áp dụng backpressure và dù sao cũng không xảy ra quá thường xuyên.

Bởi vì chúng ta đã phân tích kịch bản backpressure khi bàn về Flow API ở mục trước, chúng ta sẽ không bàn thêm về Flowable nữa; thay vào đó, chúng ta sẽ minh hoạ interface Observable đang hoạt động trong một tình huống sử dụng không có backpressure. Đáng lưu ý rằng bất kỳ subscriber nào cũng có thể thực sự tắt backpressure bằng cách gọi `request(Long.MAX_VALUE)` trên subscription, dù thực hành này không được khuyến khích trừ phi bạn chắc chắn rằng Subscriber sẽ luôn có khả năng xử lý kịp thời tất cả các sự kiện nhận được.

### 17.3.1. Tạo và sử dụng một Observable

Các class Observable và Flowable đi kèm nhiều factory method tiện lợi cho phép bạn tạo ra đủ loại reactive stream. (Cả Observable lẫn Flowable đều cài đặt Publisher, nên những factory method này phát hành reactive stream.)

Observable đơn giản nhất mà bạn có thể muốn tạo được cấu thành từ một số lượng cố định các phần tử định sẵn, như sau:

```java
Observable<String> strings = Observable.just( "first", "second" );
```

Ở đây, factory method `just()`[2] chuyển một hoặc nhiều phần tử thành một Observable phát ra chính những phần tử đó. Một subscriber của Observable này sẽ nhận được các message `onNext("first")`, `onNext("second")` và `onComplete()`, theo đúng thứ tự đó.

> **[2]** Quy ước đặt tên này hơi đáng tiếc, bởi Java 8 đã bắt đầu dùng `of()` cho các factory method tương tự, được phổ biến bởi các API Stream và Optional.

Một factory method khác của Observable cũng khá phổ biến, đặc biệt khi ứng dụng của bạn tương tác với người dùng theo thời gian thực, phát ra các sự kiện theo một nhịp thời gian cố định:

```java
Observable<Long> onePerSec = Observable.interval(1, TimeUnit.SECONDS);
```

Factory method `interval` trả về một Observable, đặt tên là `onePerSec`, phát ra một dãy vô hạn các giá trị kiểu `long` tăng dần, bắt đầu từ 0, theo một khoảng thời gian cố định do bạn chọn (1 giây trong ví dụ này). Giờ hãy dự tính dùng `onePerSec` làm cơ sở cho một Observable khác phát ra nhiệt độ được báo về cho một thị trấn cho trước, mỗi giây một lần.

Như một bước trung gian hướng tới mục tiêu này, bạn có thể in ra những nhiệt độ đó mỗi giây. Để làm vậy, bạn cần đăng ký vào `onePerSec` để được nó thông báo mỗi khi một giây trôi qua, rồi lấy và in nhiệt độ của thị trấn bạn quan tâm. Trong RxJava, Observable[3] đóng vai trò của Publisher trong Flow API, nên Observer tương ứng với interface Subscriber của Flow. Interface Observer của RxJava khai báo cùng những phương thức như Subscriber của Java 9 đã cho ở listing 17.2, với khác biệt là phương thức `onSubscribe` có một đối số Disposable thay vì Subscription. Như chúng ta đã đề cập trước đó, Observable không hỗ trợ backpressure, nên nó không có phương thức `request` vốn là một phần của Subscription. Interface Observer đầy đủ như sau:

> **[3]** Lưu ý rằng interface Observer và class Observable (của java.util) đã bị deprecated kể từ Java 9. Code mới nên dùng Flow API. Vẫn còn phải chờ xem RxJava sẽ tiến hoá ra sao.

```java
public interface Observer<T> {
    void onSubscribe(Disposable d);
    void onNext(T t);
    void onError(Throwable t);
    void onComplete();
}
```

Tuy nhiên, hãy lưu ý rằng các API của RxJava linh hoạt hơn (có nhiều biến thể nạp chồng hơn) so với Flow API gốc của Java 9. Chẳng hạn, bạn có thể đăng ký vào một Observable bằng cách truyền vào một lambda expression có chữ ký của phương thức `onNext` và bỏ qua ba phương thức còn lại. Nói cách khác, bạn có thể đăng ký vào một Observable với một Observer chỉ cài đặt phương thức `onNext` bằng một Consumer của sự kiện nhận được, để các phương thức còn lại mặc định là không làm gì cả đối với việc hoàn tất và xử lý lỗi. Bằng cách dùng tính năng này, bạn có thể đăng ký vào Observable `onePerSec` và dùng nó để in nhiệt độ ở New York mỗi giây một lần, tất cả chỉ trong một dòng code:

```java
onePerSec.subscribe(i -> System.out.println(TempInfo.fetch( "New York" )));
```

Trong câu lệnh này, Observable `onePerSec` phát ra một sự kiện mỗi giây, và khi nhận được message này, Subscriber lấy nhiệt độ ở New York rồi in ra. Tuy nhiên, nếu bạn đặt câu lệnh này vào một phương thức `main` và thử chạy nó, bạn sẽ chẳng thấy gì cả, bởi vì Observable phát ra một sự kiện mỗi giây được thực thi trong một thread thuộc computation thread pool của RxJava, vốn được tạo thành từ các daemon thread.[4] Nhưng chương trình main của bạn kết thúc ngay lập tức và khi làm vậy, nó giết chết daemon thread trước khi thread này kịp tạo ra bất kỳ output nào.

> **[4]** Điều này có vẻ không được nói rõ trong tài liệu, mặc dù bạn có thể tìm thấy những phát biểu theo hướng này trong cộng đồng lập trình viên trực tuyến stackoverflow.com.

Như một mẹo nhỏ hơi thủ công, bạn có thể ngăn việc kết thúc tức thời này bằng cách đặt một lệnh cho thread ngủ (sleep) ngay sau câu lệnh trên. Tốt hơn nữa, bạn có thể dùng phương thức `blockingSubscribe`, phương thức này gọi các callback trên thread hiện tại (trong trường hợp này là thread main). Cho mục đích trình diễn một chương trình đang chạy, `blockingSubscribe` là hoàn toàn phù hợp. Tuy nhiên, trong ngữ cảnh production, bạn thường dùng phương thức `subscribe`. Đoạn code như sau:

```java
onePerSec.blockingSubscribe(
    i -> System.out.println(TempInfo.fetch( "New York" ))
);
```

Bạn có thể nhận được output như thế này:

```text
New York : 87
New York : 18
New York : 75
java.lang.RuntimeException: Error!
at flow.common.TempInfo.fetch(TempInfo.java:18)
at flow.Main.lambda$main$0(Main.java:12)
at io.reactivex.internal.observers.LambdaObserver
              .onNext(LambdaObserver.java:59)
at io.reactivex.internal.operators.observable
           .ObservableInterval$IntervalObserver.run(ObservableInterval.java)
```

Đáng tiếc là, theo đúng thiết kế, việc lấy nhiệt độ có thể thất bại ngẫu nhiên (và quả thực đã thất bại sau ba lần đọc). Bởi vì Observer của bạn chỉ cài đặt đường đi thuận lợi (happy path) và không có bất kỳ dạng quản lý lỗi nào, chẳng hạn `onError`, nên sự cố này nổ tung ngay trước mặt người dùng dưới dạng một ngoại lệ không được bắt.

Đã đến lúc nâng mức độ lên và bắt đầu làm ví dụ này phức tạp hơn một chút. Bạn không chỉ muốn thêm phần quản lý lỗi. Bạn còn phải tổng quát hoá những gì đang có. Bạn không muốn in nhiệt độ ngay lập tức mà muốn cung cấp cho người dùng một factory method trả về một Observable phát ra những nhiệt độ đó mỗi giây một lần, tối đa (giả sử) năm lần trước khi hoàn tất. Bạn có thể đạt mục tiêu này một cách dễ dàng bằng cách dùng một factory method tên là `create`, nó tạo một Observable từ một lambda nhận vào một Observer khác làm đối số và trả về `void`, như trong listing sau đây.

**Listing 17.12. Tạo một Observable phát ra nhiệt độ mỗi giây một lần**

```java
public static Observable<TempInfo> getTemperature(String town) {
    // Tạo một Observable từ một hàm tiêu thụ một Observer
    return Observable.create(emitter ->
            // Một Observable phát ra dãy vô hạn các long tăng dần, mỗi giây một giá trị
            Observable.interval(1, TimeUnit.SECONDS)
                .subscribe(i -> {
                    // Chỉ làm gì đó nếu observer được tiêu thụ chưa bị dispose
                    // (do một lỗi trước đó).
                    if (!emitter.isDisposed()) {
                        if ( i >= 5 ) {
                            // Nếu nhiệt độ đã được phát ra đủ năm lần,
                            // hoàn tất observer để kết thúc luồng
                            emitter.onComplete();
                        } else {
                            try {
                                // Ngược lại, gửi một báo cáo nhiệt độ tới Observer
                                emitter.onNext(TempInfo.fetch(town));
                            } catch (Exception e) {
                                // Trong trường hợp lỗi, thông báo cho Observer
                                emitter.onError(e);
                            }
                        }
                    }
                }));
}
```

Ở đây, bạn đang tạo Observable được trả về từ một hàm tiêu thụ một ObservableEmitter, gửi các sự kiện mong muốn tới nó. Interface ObservableEmitter của RxJava mở rộng interface Emitter cơ bản của RxJava, mà bạn có thể xem như một Observer không có phương thức `onSubscribe`,

```java
public interface Emitter<T> {
    void onNext(T t);
    void onError(Throwable t);
    void onComplete();
}
```

với một vài phương thức bổ sung để đặt một Disposable mới lên Emitter và kiểm tra xem dãy đã bị dispose ở phía downstream hay chưa.

Bên trong, bạn đăng ký vào một Observable chẳng hạn `onePerSec`, thứ phát hành một dãy vô hạn các long tăng dần, mỗi giây một giá trị. Bên trong hàm đăng ký (được truyền như một đối số cho phương thức `subscribe`), trước hết bạn kiểm tra xem Observer được tiêu thụ đã bị dispose hay chưa, bằng phương thức `isDisposed` do interface ObservableEmitter cung cấp. (Tình huống này có thể xảy ra nếu một lỗi đã xảy ra ở một vòng lặp trước đó.) Nếu nhiệt độ đã được phát ra đủ năm lần, code sẽ hoàn tất Observer, kết thúc luồng; ngược lại, nó gửi báo cáo nhiệt độ mới nhất của thị trấn được yêu cầu tới Observer bên trong một khối try/catch. Nếu xảy ra lỗi trong lúc lấy nhiệt độ, nó truyền lỗi đó tới Observer.

Giờ thì việc cài đặt một Observer hoàn chỉnh trở nên dễ dàng; Observer này sau đó sẽ được dùng để đăng ký vào Observable do phương thức `getTemperature` trả về và in ra những nhiệt độ mà nó phát hành, như trong listing kế tiếp.

**Listing 17.13. Một Observer in ra các nhiệt độ nhận được**

```java
import io.reactivex.Observer;
import io.reactivex.disposables.Disposable;

public class TempObserver implements Observer<TempInfo> {

    @Override
    public void onComplete() {
        System.out.println( "Done!" );
    }

    @Override
    public void onError( Throwable throwable ) {
        System.out.println( "Got problem: " + throwable.getMessage() );
    }

    @Override
    public void onSubscribe( Disposable disposable ) {
    }

    @Override
    public void onNext( TempInfo tempInfo ) {
        System.out.println( tempInfo );
    }
}
```

Observer này tương tự class TempSubscriber ở listing 17.7 (vốn cài đặt `Flow.Subscriber` của Java 9), nhưng bạn có thêm một sự đơn giản hoá nữa. Bởi vì Observable của RxJava không hỗ trợ backpressure, bạn không cần gọi `request()` để yêu cầu thêm phần tử sau khi xử lý xong những phần tử đã được phát hành.

Trong listing kế tiếp, bạn tạo một chương trình main trong đó bạn đăng ký Observer này vào Observable được trả về bởi phương thức `getTemperature` từ listing 17.12.

**Listing 17.14. Một class main in ra nhiệt độ ở New York**

```java
public class Main {

    public static void main(String[] args) {
        // Tạo một Observable phát ra nhiệt độ được báo về ở New York, mỗi giây một lần
        Observable<TempInfo> observable = getTemperature( "New York" );
        // Đăng ký vào Observable đó bằng một Observer đơn giản in ra các nhiệt độ
        observable.blockingSubscribe( new TempObserver() );
    }
}
```

Giả sử lần này không có lỗi nào xảy ra trong lúc lấy nhiệt độ, `main` sẽ in ra một dòng mỗi giây, năm lần, rồi Observable phát ra tín hiệu `onComplete`, nên bạn có thể nhận được output như sau:

```text
New York : 69
New York : 26
New York : 85
New York : 94
New York : 29
Done!
```

Đã đến lúc làm phong phú thêm ví dụ RxJava của bạn, và đặc biệt là xem thư viện này cho phép bạn thao tác trên một hay nhiều reactive stream như thế nào.

### 17.3.2. Biến đổi và kết hợp các Observable

Một trong những ưu điểm chính của RxJava và các thư viện reactive khác khi làm việc với reactive streams, so với những gì Flow API gốc của Java 9 cung cấp, là chúng đem lại một bộ công cụ phong phú gồm nhiều hàm để kết hợp, tạo mới và lọc bất kỳ luồng nào trong số đó. Như chúng ta đã minh hoạ ở các mục trước, một luồng có thể được dùng làm đầu vào cho một luồng khác. Ngoài ra, bạn đã học về `Flow.Processor` của Java 9 được dùng ở mục 17.2.3 để chuyển nhiệt độ từ Fahrenheit sang Celsius. Nhưng bạn cũng có thể lọc một luồng để lấy một luồng khác chỉ chứa những phần tử bạn quan tâm, biến đổi những phần tử đó bằng một hàm ánh xạ cho trước (cả hai việc này đều có thể làm được với `Flow.Processor`), hoặc thậm chí trộn hay kết hợp hai luồng theo nhiều cách khác nhau (điều mà `Flow.Processor` không làm được).

Những hàm biến đổi và kết hợp này có thể khá tinh vi, tới mức giải thích hành vi của chúng bằng lời lẽ thông thường có thể dẫn tới những câu văn vụng về, rối rắm. Để hình dung, hãy xem cách RxJava viết tài liệu cho hàm `mergeDelayError` của nó:

> Làm phẳng một Observable phát ra các Observable thành một Observable duy nhất, theo cách cho phép một Observer nhận được tất cả các phần tử được phát ra thành công từ mọi Observable nguồn mà không bị gián đoạn bởi một thông báo lỗi từ một trong số chúng, đồng thời giới hạn số lượng subscription đồng thời tới các Observable này.

Bạn phải thừa nhận rằng chức năng của hàm này không hề hiển nhiên ngay lập tức. Để giảm bớt vấn đề này, cộng đồng reactive-streams đã quyết định ghi lại hành vi của các hàm này một cách trực quan, bằng cách dùng cái gọi là **marble diagram**. Một marble diagram, chẳng hạn như trong hình 17.4, biểu diễn dãy phần tử được sắp thứ tự theo thời gian trong một reactive stream dưới dạng các hình khối trên một đường nằm ngang; các ký hiệu đặc biệt biểu diễn tín hiệu lỗi và tín hiệu hoàn tất. Các hộp chỉ ra cách các toán tử có tên biến đổi những phần tử đó hoặc kết hợp nhiều luồng.

> **Hình 17.4.** Chú giải của một marble diagram mô tả một toán tử do một thư viện reactive điển hình cung cấp

Dùng ký pháp này, thật dễ dàng để cung cấp một biểu diễn trực quan cho các tính năng của tất cả các hàm trong thư viện RxJava, như trong hình 17.5, minh hoạ `map` (biến đổi các phần tử được phát hành bởi một Observable) và `merge` (kết hợp các sự kiện được phát ra bởi hai hoặc nhiều Observable thành một).

> **Hình 17.5.** Marble diagram cho các hàm map và merge

Bạn có thể tự hỏi làm thế nào để dùng `map` và `merge` nhằm cải thiện và bổ sung tính năng cho ví dụ RxJava mà bạn đã phát triển ở mục trước. Dùng `map` là cách ngắn gọn hơn để đạt được phép biến đổi từ Fahrenheit sang Celsius mà bạn đã cài đặt bằng Processor của Flow API, như trong listing sau.

**Listing 17.15. Dùng map trên Observable để biến đổi Fahrenheit thành Celsius**

```java
public static Observable<TempInfo> getCelsiusTemperature(String town) {
    return getTemperature( town )
               .map( temp -> new TempInfo( temp.getTown(),
                                           (temp.getTemp() - 32) * 5 / 9) );
}
```

Phương thức đơn giản này nhận Observable được trả về bởi phương thức `getTemperature` ở listing 17.12 và trả về một Observable khác, phát lại những nhiệt độ được phát hành (mỗi giây một lần) bởi Observable thứ nhất sau khi đã chuyển chúng từ Fahrenheit sang Celsius.

Để củng cố hiểu biết của bạn về cách thao tác trên các phần tử được phát ra bởi một Observable, hãy thử dùng một hàm biến đổi khác trong quiz sau đây.

---

**Quiz 17.2: Chỉ lọc các nhiệt độ âm**

Phương thức `filter` của class Observable nhận một Predicate làm đối số và tạo ra một Observable thứ hai chỉ phát ra những phần tử vượt qua bài kiểm tra được định nghĩa bởi Predicate đó. Giả sử bạn được yêu cầu phát triển một hệ thống cảnh báo, thông báo cho người dùng khi có nguy cơ đóng băng. Bạn có thể dùng toán tử này thế nào để tạo ra một Observable chỉ phát ra nhiệt độ tính theo Celsius được ghi nhận tại một thị trấn trong trường hợp nhiệt độ dưới 0? (Thang Celsius rất tiện lợi khi dùng số 0 cho điểm đóng băng của nước.)

**Đáp án:**

Chỉ cần lấy Observable được trả về bởi phương thức ở listing 17.15 và áp dụng lên nó toán tử `filter` với một Predicate chỉ chấp nhận nhiệt độ âm, như sau:

```java
public static Observable<TempInfo> getNegativeTemperature(String town) {
    return getCelsiusTemperature( town )
               .filter( temp -> temp.getTemp() < 0 );
}
```

---

Giờ hãy hình dung thêm rằng bạn được yêu cầu tổng quát hoá phương thức cuối cùng này và cho phép người dùng của bạn có một Observable phát ra nhiệt độ không chỉ cho một thị trấn duy nhất, mà cho cả một tập các thị trấn. Listing 17.16 thoả mãn yêu cầu cuối cùng này bằng cách gọi phương thức ở listing 17.15 một lần cho mỗi thị trấn và kết hợp tất cả các Observable thu được từ những lời gọi đó thành một Observable duy nhất thông qua hàm `merge`.

**Listing 17.16. Trộn các nhiệt độ được báo về cho một hoặc nhiều thị trấn**

```java
public static Observable<TempInfo> getCelsiusTemperatures(String... towns) {
    return Observable.merge(Arrays.stream(towns)
                                  .map(TempObservable::getCelsiusTemperature)
                                  .collect(toList()));
}
```

Phương thức này nhận một đối số varargs chứa tập các thị trấn mà bạn muốn lấy nhiệt độ. Varargs này được chuyển thành một stream các String; sau đó mỗi String được truyền vào phương thức `getCelsiusTemperature` của listing 17.11 (đã được cải tiến ở listing 17.15). Bằng cách này, mỗi thị trấn được biến đổi thành một Observable phát ra nhiệt độ của thị trấn đó mỗi giây một lần. Cuối cùng, stream các Observable được thu thập vào một danh sách, và danh sách này được truyền vào static factory method `merge` do chính class Observable cung cấp. Phương thức này nhận một Iterable các Observable và kết hợp đầu ra của chúng lại sao cho chúng hoạt động như một Observable duy nhất. Nói cách khác, Observable kết quả phát ra tất cả các sự kiện được phát hành bởi toàn bộ các Observable chứa trong Iterable được truyền vào, đồng thời bảo toàn thứ tự thời gian của chúng.

Để kiểm thử phương thức này, hãy dùng nó trong một class main cuối cùng như trong listing sau đây.

**Listing 17.17. Một class main in ra nhiệt độ ở ba thị trấn**

```java
public class Main {

    public static void main(String[] args) {
        Observable<TempInfo> observable = getCelsiusTemperatures(
                              "New York", "Chicago", "San Francisco" );
        observable.blockingSubscribe( new TempObserver() );
    }
}
```

Class main này giống hệt class ở listing 17.14, ngoại trừ việc bây giờ bạn đăng ký vào Observable được trả về bởi phương thức `getCelsiusTemperatures` ở listing 17.16 và in ra nhiệt độ được ghi nhận cho ba thị trấn. Chạy `main` này sinh ra output như sau:

```text
New York : 21
Chicago : 6
San Francisco : -15
New York : -3
Chicago : 12
San Francisco : 5
Got problem: Error!
```

Mỗi giây, `main` in ra nhiệt độ của từng thị trấn được yêu cầu cho tới khi một trong các thao tác lấy nhiệt độ ném ra lỗi, lỗi này được truyền tới Observer và làm gián đoạn luồng dữ liệu.

Mục đích của chương này không phải là cung cấp một cái nhìn tổng quan đầy đủ về RxJava (hay bất kỳ thư viện reactive nào khác), bởi để làm điều đó thì cần cả một cuốn sách, mà là để bạn cảm nhận được cách loại bộ công cụ này hoạt động và giới thiệu cho bạn các nguyên tắc của reactive programming. Chúng ta mới chỉ chạm tới bề mặt của phong cách lập trình này, nhưng chúng tôi hy vọng đã chứng minh được một số ưu điểm của nó và khơi gợi được sự tò mò của bạn về nó.

## Tóm tắt

- Những ý tưởng nền tảng đằng sau reactive programming đã có từ 20 đến 30 năm trước, nhưng gần đây mới trở nên phổ biến do những đòi hỏi cao của các ứng dụng hiện đại về lượng dữ liệu cần xử lý và kỳ vọng của người dùng.
- Những ý tưởng này đã được hình thức hoá bởi Reactive Manifesto, trong đó nêu rằng phần mềm reactive phải được đặc trưng bởi bốn tính chất liên quan lẫn nhau: khả năng phản hồi (responsiveness), tính kiên cường (resiliency), tính co giãn (elasticity) và tính chất hướng message (message-driven).
- Các nguyên tắc của reactive programming có thể được áp dụng, với một vài khác biệt, khi cài đặt một ứng dụng đơn lẻ cũng như khi thiết kế một reactive system tích hợp nhiều ứng dụng.
- Một reactive application dựa trên việc xử lý asynchronous một hoặc nhiều dòng sự kiện được truyền tải bởi các reactive stream. Bởi vì vai trò của reactive streams là quá trung tâm trong việc phát triển ứng dụng reactive, một liên minh các công ty bao gồm Netflix, Pivotal, Lightbend và Red Hat đã chuẩn hoá các khái niệm này để tối đa hoá khả năng tương tác giữa những phần cài đặt khác nhau.
- Bởi vì reactive streams được xử lý một cách asynchronous, chúng đã được thiết kế với một cơ chế backpressure tích hợp sẵn. Cơ chế này ngăn một bên tiêu thụ chậm bị quá tải bởi những bên sản xuất nhanh hơn.
- Kết quả của quá trình thiết kế và chuẩn hoá này đã được đưa vào Java. Flow API của Java 9 định nghĩa bốn interface cốt lõi: Publisher, Subscriber, Subscription và Processor.
- Trong phần lớn trường hợp, những interface này không nhằm mục đích được lập trình viên cài đặt trực tiếp, mà đóng vai trò một ngôn ngữ chung (lingua franca) cho các thư viện khác nhau cài đặt mô hình reactive.
- Một trong những bộ công cụ được dùng phổ biến nhất trong số đó là RxJava, thư viện này (bên cạnh các tính năng cơ bản được định nghĩa bởi Flow API của Java 9) cung cấp nhiều toán tử hữu ích và mạnh mẽ. Ví dụ bao gồm các toán tử biến đổi và lọc một cách tiện lợi những phần tử được phát hành bởi một reactive stream đơn lẻ, và các toán tử kết hợp và tổng hợp nhiều luồng.
