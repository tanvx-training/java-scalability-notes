# Chương 16. CompletableFuture: lập trình bất đồng bộ khả kết hợp

> **Nội dung chương này**
>
> - Tạo một phép tính bất đồng bộ (asynchronous) và lấy về kết quả của nó
> - Tăng throughput bằng cách sử dụng các thao tác non-blocking
> - Thiết kế và cài đặt một API bất đồng bộ
> - Tiêu thụ một API đồng bộ (synchronous) theo cách bất đồng bộ
> - Nối ống (pipelining) và trộn (merging) hai hoặc nhiều thao tác bất đồng bộ
> - Phản ứng lại sự kiện hoàn tất của một thao tác bất đồng bộ

Chương 15 đã khám phá bối cảnh xử lý đồng thời hiện đại: có nhiều tài nguyên xử lý (các nhân CPU và những thứ tương tự) sẵn có, và bạn muốn chương trình của mình khai thác được càng nhiều tài nguyên này càng tốt theo một cách ở mức cao (thay vì làm chương trình của bạn ngổn ngang những thao tác trên thread thiếu cấu trúc và khó bảo trì). Chúng ta đã lưu ý rằng parallel stream và fork/join parallelism cung cấp các cấu trúc ở mức cao hơn để biểu diễn tính song song trong những chương trình duyệt qua các collection và trong những chương trình theo kiểu chia để trị (divide-and-conquer), nhưng các lời gọi phương thức còn mang lại thêm những cơ hội khác để thực thi code song song. Java 8 và 9 giới thiệu hai API cụ thể phục vụ mục đích này: CompletableFuture và mô hình reactive programming. Chương này giải thích, thông qua các ví dụ code thực tế, việc phần cài đặt CompletableFuture của interface Future trong Java 8 mang lại cho bạn thêm những vũ khí nào trong kho vũ khí lập trình của mình. Chương này cũng bàn về các bổ sung được đưa vào trong Java 9.

## 16.1. Sử dụng Future một cách đơn giản

Interface Future được giới thiệu trong Java 5 để mô hình hoá một kết quả sẽ trở nên sẵn sàng tại một thời điểm nào đó trong tương lai. Chẳng hạn, một truy vấn tới một dịch vụ từ xa sẽ không có kết quả ngay lập tức khi bên gọi phát ra yêu cầu. Interface Future mô hình hoá một phép tính bất đồng bộ và cung cấp một tham chiếu tới kết quả của nó, kết quả này trở nên sẵn sàng khi bản thân phép tính hoàn tất. Việc kích hoạt một hành động có khả năng tốn nhiều thời gian bên trong một Future cho phép Thread gọi tiếp tục làm những việc hữu ích khác thay vì chờ đợi kết quả của thao tác. Bạn có thể hình dung quá trình này giống như việc mang một túi quần áo tới hiệu giặt khô yêu thích của bạn. Người thợ giặt đưa cho bạn một biên nhận cho biết khi nào quần áo của bạn sẽ được giặt xong (một Future); trong lúc chờ đợi, bạn có thể làm các việc khác. Một ưu điểm khác của Future là nó thân thiện hơn khi làm việc so với Thread ở mức thấp. Để làm việc với một Future, thông thường bạn phải bọc thao tác tốn thời gian bên trong một đối tượng Callable rồi gửi (submit) nó tới một ExecutorService. Listing sau đây trình bày một ví dụ được viết trước Java 8.

**Listing 16.1. Thực thi một thao tác kéo dài theo cách bất đồng bộ trong một Future**

```java
// Tạo một ExecutorService cho phép bạn gửi các task tới một thread pool.
ExecutorService executor = Executors.newCachedThreadPool();
// Gửi một Callable tới ExecutorService.
Future<Double> future = executor.submit(new Callable<Double>() {
        public Double call() {
            // Thực thi một thao tác dài theo cách bất đồng bộ trong một thread riêng.
            return doSomeLongComputation();
        }});
// Làm việc gì đó khác trong khi thao tác bất đồng bộ đang tiến hành.
doSomethingElse();
try {
    // Lấy về kết quả của thao tác bất đồng bộ, sẽ bị block nếu kết quả chưa
    // sẵn sàng nhưng chỉ chờ tối đa 1 giây trước khi hết thời gian chờ.
    Double result = future.get(1, TimeUnit.SECONDS);
} catch (ExecutionException ee) {
    // phép tính đã ném ra một ngoại lệ
} catch (InterruptedException ie) {
    // thread hiện tại bị ngắt trong lúc đang chờ
} catch (TimeoutException te) {
    // thời gian chờ đã hết trước khi Future hoàn tất
}
```

Như minh hoạ trong hình 16.1, phong cách lập trình này cho phép thread của bạn thực hiện một số tác vụ khác trong khi thao tác kéo dài được thực thi đồng thời trong một thread riêng do ExecutorService cung cấp. Sau đó, khi bạn không thể làm bất kỳ việc có ý nghĩa nào khác mà không có kết quả của thao tác bất đồng bộ đó, bạn có thể lấy nó về từ Future bằng cách gọi phương thức get. Phương thức này trả về ngay lập tức kết quả của thao tác nếu nó đã hoàn tất, hoặc block thread của bạn để chờ cho tới khi kết quả sẵn sàng.

> **Hình 16.1.** Sử dụng một Future để thực thi một thao tác dài theo cách bất đồng bộ

Hãy chú ý tới vấn đề trong kịch bản này. Điều gì xảy ra nếu thao tác dài đó không bao giờ trả về? Để xử lý khả năng này, hầu như luôn luôn là một ý hay khi dùng phiên bản hai đối số của get, phiên bản này nhận một timeout chỉ định khoảng thời gian tối đa (cùng với đơn vị thời gian của nó) mà thread của bạn sẵn lòng chờ đợi kết quả của Future (như trong listing 16.1). Ngược lại, phiên bản không đối số của get sẽ chờ vô hạn.

### 16.1.1. Hiểu về Future và những hạn chế của nó

Ví dụ nhỏ đầu tiên này cho thấy interface Future cung cấp các phương thức để kiểm tra xem phép tính bất đồng bộ đã hoàn tất chưa (bằng cách dùng phương thức isDone), chờ đợi nó hoàn tất, và lấy về kết quả của nó. Nhưng những tính năng này chưa đủ để bạn viết được code xử lý đồng thời một cách súc tích. Chẳng hạn, rất khó để biểu diễn các phụ thuộc giữa các kết quả của một Future. Ở mức khai báo (declaratively), thật dễ để nói rằng: "Khi kết quả của phép tính dài này sẵn sàng, hãy gửi kết quả của nó tới một phép tính dài khác, và khi việc đó xong thì kết hợp kết quả của nó với kết quả từ một truy vấn khác." Nhưng cài đặt đặc tả này bằng các thao tác sẵn có trong một Future lại là một câu chuyện khác, và đó là lý do vì sao sẽ rất hữu ích nếu phần cài đặt có thêm nhiều tính năng mang tính khai báo hơn, chẳng hạn như:

- Kết hợp hai phép tính bất đồng bộ, cả khi chúng độc lập với nhau lẫn khi phép tính thứ hai phụ thuộc vào kết quả của phép tính thứ nhất
- Chờ cho tới khi tất cả các task được thực hiện bởi một tập hợp các Future hoàn tất
- Chờ cho tới khi chỉ riêng task nhanh nhất trong một tập hợp các Future hoàn tất (có thể vì các Future đang cố tính cùng một giá trị theo những cách khác nhau) và lấy về kết quả của nó
- Hoàn tất một Future theo cách lập trình (tức là cung cấp thủ công kết quả của thao tác bất đồng bộ)
- Phản ứng lại sự hoàn tất của Future (tức là được thông báo khi sự hoàn tất xảy ra và sau đó có thể thực hiện một hành động tiếp theo với kết quả của Future thay vì bị block trong khi chờ kết quả của nó)

Trong phần còn lại của chương này, bạn sẽ học cách lớp CompletableFuture (lớp này cài đặt interface Future) làm cho tất cả những điều trên trở nên khả thi theo cách khai báo, nhờ các tính năng mới của Java 8. Thiết kế của Stream và CompletableFuture tuân theo những khuôn mẫu tương tự nhau, bởi vì cả hai đều dùng lambda expression và pipelining. Vì lý do đó, bạn có thể nói rằng CompletableFuture đối với một Future thuần tuý cũng giống như Stream đối với một Collection.

### 16.1.2. Sử dụng CompletableFuture để xây dựng một ứng dụng bất đồng bộ

Để khám phá các tính năng của CompletableFuture, trong mục này bạn sẽ phát triển dần dần một ứng dụng tìm giá tốt nhất (best-price-finder) — ứng dụng liên hệ với nhiều cửa hàng trực tuyến để tìm ra mức giá thấp nhất cho một sản phẩm hoặc dịch vụ nào đó. Trên đường đi, bạn sẽ học được vài kỹ năng quan trọng:

- Cách cung cấp một API bất đồng bộ cho khách hàng của bạn (hữu ích nếu bạn là chủ của một trong những cửa hàng trực tuyến đó).
- Cách làm cho code của bạn trở nên non-blocking khi bạn là bên tiêu thụ một API đồng bộ. Bạn sẽ khám phá cách nối ống hai thao tác bất đồng bộ liên tiếp, hợp nhất chúng thành một phép tính bất đồng bộ duy nhất. Tình huống này phát sinh, chẳng hạn, khi cửa hàng trực tuyến trả về một mã giảm giá kèm theo giá gốc của món hàng bạn muốn mua. Bạn phải liên hệ với một dịch vụ giảm giá từ xa thứ hai để tìm ra phần trăm giảm giá gắn với mã giảm giá này trước khi tính được giá thực tế của món hàng đó.
- Cách xử lý theo kiểu phản ứng (reactively) các sự kiện biểu diễn sự hoàn tất của một thao tác bất đồng bộ, và cách làm như vậy cho phép ứng dụng best-price-finder liên tục cập nhật báo giá mua tốt nhất cho món hàng bạn muốn mua ngay khi từng cửa hàng trả về giá của nó, thay vì phải chờ tất cả các cửa hàng trả về báo giá tương ứng. Kỹ năng này cũng giúp tránh kịch bản mà người dùng nhìn thấy một màn hình trắng mãi mãi nếu máy chủ của một trong các cửa hàng bị sập.

> **API đồng bộ và API bất đồng bộ**
>
> Cụm từ *API đồng bộ* (synchronous API) là một cách nói khác về một lời gọi phương thức truyền thống: bạn gọi nó, bên gọi chờ trong lúc phương thức tính toán, phương thức trả về, và bên gọi tiếp tục với giá trị được trả về. Ngay cả khi bên gọi và bên bị gọi được thực thi trên các thread khác nhau, bên gọi vẫn sẽ chờ bên bị gọi hoàn tất. Tình huống này làm nảy sinh cụm từ *blocking call* (lời gọi gây block).
>
> Ngược lại, trong một *API bất đồng bộ* (asynchronous API), phương thức trả về ngay lập tức (hoặc ít nhất là trước khi phép tính của nó hoàn tất), uỷ thác phần tính toán còn lại cho một thread chạy bất đồng bộ so với bên gọi — do đó có cụm từ *nonblocking call* (lời gọi không gây block). Phần tính toán còn lại trao giá trị của nó cho bên gọi bằng cách gọi một phương thức callback, hoặc bên gọi sẽ gọi thêm một phương thức kiểu "chờ cho tới khi phép tính hoàn tất". Phong cách tính toán này rất phổ biến trong lập trình hệ thống I/O: bạn khởi động một lượt truy cập đĩa, việc này diễn ra bất đồng bộ trong khi bạn tính toán thêm, và khi bạn không còn việc gì hữu ích hơn để làm, bạn chờ cho tới khi các khối dữ liệu trên đĩa được nạp vào bộ nhớ. Lưu ý rằng blocking và nonblocking thường được dùng cho những phần cài đặt cụ thể của I/O bởi hệ điều hành. Tuy nhiên, các thuật ngữ này lại có xu hướng được dùng thay thế cho asynchronous và synchronous ngay cả trong những ngữ cảnh không phải I/O.

## 16.2. Cài đặt một API bất đồng bộ

Để bắt đầu cài đặt ứng dụng best-price-finder, hãy định nghĩa API mà mỗi cửa hàng nên cung cấp. Trước tiên, một cửa hàng khai báo một phương thức trả về giá của một sản phẩm, cho trước tên của sản phẩm đó:

```java
public class Shop {
    public double getPrice(String product) {
        // sẽ được cài đặt sau
    }
}
```

Phần cài đặt bên trong của phương thức này sẽ truy vấn cơ sở dữ liệu của cửa hàng, nhưng có lẽ cũng thực hiện các tác vụ tốn thời gian khác, chẳng hạn như liên hệ với các dịch vụ bên ngoài khác (như nhà cung cấp của cửa hàng hoặc các chương trình khuyến mãi liên quan tới nhà sản xuất). Để giả lập một lần thực thi phương thức kéo dài như vậy, trong phần còn lại của chương này bạn sẽ dùng một phương thức delay, phương thức này đưa vào một độ trễ nhân tạo 1 giây, như được định nghĩa trong listing sau đây.

**Listing 16.2. Một phương thức mô phỏng độ trễ 1 giây**

```java
public static void delay() {
    try {
        Thread.sleep(1000L);
    } catch (InterruptedException e) {
        throw new RuntimeException(e);
    }
}
```

Với mục đích của chương này, bạn có thể mô hình hoá phương thức getPrice bằng cách gọi delay rồi trả về một giá trị giá được tính ngẫu nhiên, như trong listing tiếp theo. Đoạn code trả về giá được tính ngẫu nhiên có thể trông hơi "chắp vá"; nó sinh ngẫu nhiên giá dựa trên tên sản phẩm bằng cách dùng kết quả của charAt như một con số.

**Listing 16.3. Đưa vào một độ trễ mô phỏng trong phương thức getPrice**

```java
public double getPrice(String product) {
    return calculatePrice(product);
}

private double calculatePrice(String product) {
    delay();
    return random.nextDouble() * product.charAt(0) + product.charAt(1);
}
```

Đoạn code này hàm ý rằng khi bên tiêu thụ API này (trong trường hợp này là ứng dụng best-price-finder) gọi phương thức này, nó sẽ bị block và rồi ngồi không trong 1 giây trong lúc chờ phương thức hoàn tất một cách đồng bộ. Tình huống này là không thể chấp nhận được, đặc biệt khi xét tới việc ứng dụng best-price-finder phải lặp lại thao tác này cho tất cả các cửa hàng trong mạng lưới của nó. Trong các mục tiếp theo của chương này, bạn sẽ khám phá cách giải quyết vấn đề này bằng cách tiêu thụ API đồng bộ này theo một cách bất đồng bộ. Nhưng với mục đích học cách thiết kế một API bất đồng bộ, trong mục này bạn hãy tiếp tục giả vờ rằng mình đang ở phía bên kia chiến tuyến. Bạn là một chủ cửa hàng khôn ngoan, nhận ra API đồng bộ này gây khó chịu tới mức nào cho người dùng, và bạn muốn viết lại nó thành một API bất đồng bộ để cuộc sống của khách hàng dễ dàng hơn.

### 16.2.1. Chuyển một phương thức đồng bộ thành phương thức bất đồng bộ

Để đạt được mục tiêu này, trước tiên bạn phải biến phương thức getPrice thành một phương thức getPriceAsync và thay đổi giá trị trả về của nó, như sau:

```java
public Future<Double> getPriceAsync(String product) { ... }
```

Như chúng ta đã đề cập trong phần mở đầu của chương này, interface `java.util.concurrent.Future` được giới thiệu trong Java 5 để biểu diễn kết quả của một phép tính bất đồng bộ. (Nghĩa là thread gọi được phép tiếp tục mà không bị block.) Một Future là một "tay cầm" cho một giá trị chưa sẵn sàng nhưng có thể được lấy về bằng cách gọi phương thức get của nó sau khi phép tính của nó cuối cùng cũng kết thúc. Kết quả là, phương thức getPriceAsync có thể trả về ngay lập tức, cho thread gọi một cơ hội để thực hiện các phép tính hữu ích khác trong thời gian đó. Lớp CompletableFuture của Java 8 mang lại cho bạn nhiều khả năng khác nhau để cài đặt phương thức này một cách dễ dàng, như trong listing sau đây.

**Listing 16.4. Cài đặt phương thức getPriceAsync**

```java
public Future<Double> getPriceAsync(String product) {
    // Tạo CompletableFuture sẽ chứa kết quả của phép tính.
    CompletableFuture<Double> futurePrice = new CompletableFuture<>();
    // Thực thi phép tính bất đồng bộ trong một Thread khác.
    new Thread( () -> {
        double price = calculatePrice(product);
        // Đặt giá trị do phép tính dài trả về vào Future khi nó sẵn sàng.
        futurePrice.complete(price);
    }).start();
    // Trả về Future mà không chờ phép tính của kết quả bên trong nó hoàn tất.
    return futurePrice;
}
```

Ở đây, bạn tạo một thể hiện của CompletableFuture, đại diện cho một phép tính bất đồng bộ và sẽ chứa một kết quả khi kết quả đó sẵn sàng. Sau đó bạn tách (fork) ra một Thread khác để thực hiện việc tính giá thực sự, và trả về thể hiện Future mà không chờ phép tính kéo dài đó kết thúc. Khi giá của sản phẩm được yêu cầu cuối cùng đã sẵn sàng, bạn có thể hoàn tất CompletableFuture bằng cách dùng phương thức complete của nó để đặt giá trị. Tính năng này cũng lý giải cho cái tên của phần cài đặt Future này trong Java 8. Một client của API này có thể gọi nó như trong listing tiếp theo.

**Listing 16.5. Sử dụng một API bất đồng bộ**

```java
Shop shop = new Shop("BestShop");
long start = System.nanoTime();
// Truy vấn cửa hàng để lấy về giá của một sản phẩm.
Future<Double> futurePrice = shop.getPriceAsync("my favorite product");
long invocationTime = ((System.nanoTime() - start) / 1_000_000);
System.out.println("Invocation returned after " + invocationTime
                                                + " msecs");
// Làm thêm vài tác vụ khác, chẳng hạn truy vấn các cửa hàng khác
doSomethingElse();
// trong lúc giá của sản phẩm đang được tính
try {
    // Đọc giá từ Future hoặc bị block cho tới khi nó sẵn sàng.
    double price = futurePrice.get();
    System.out.printf("Price is %.2f%n", price);
} catch (Exception e) {
    throw new RuntimeException(e);
}
long retrievalTime = ((System.nanoTime() - start) / 1_000_000);
System.out.println("Price returned after " + retrievalTime + " msecs");
```

Như bạn có thể thấy, client yêu cầu cửa hàng lấy giá của một sản phẩm nhất định. Bởi vì cửa hàng cung cấp một API bất đồng bộ, lời gọi này gần như trả về Future ngay lập tức, và thông qua Future đó client có thể lấy về giá của sản phẩm sau này. Sau đó client có thể thực hiện các tác vụ khác, chẳng hạn truy vấn các cửa hàng khác, thay vì bị block để chờ cửa hàng đầu tiên tạo ra kết quả được yêu cầu. Sau đó, khi client không còn việc có ý nghĩa nào khác để làm mà không có giá sản phẩm, nó có thể gọi get trên Future. Bằng cách đó, client mở gói giá trị chứa trong Future (nếu task bất đồng bộ đã kết thúc) hoặc bị block cho tới khi giá trị đó sẵn sàng. Đầu ra do đoạn code trong listing 16.5 sinh ra có thể trông như thế này:

```text
Invocation returned after 43 msecs
Price is 123.26
Price returned after 1045 msecs
```

Bạn có thể thấy rằng lời gọi phương thức getPriceAsync trả về sớm hơn rất nhiều so với thời điểm việc tính giá cuối cùng kết thúc. Trong mục 16.4, bạn sẽ học được rằng client cũng có thể tránh được mọi rủi ro bị block. Thay vào đó, client có thể được thông báo khi Future hoàn tất và có thể thực thi một đoạn code callback, được định nghĩa thông qua một lambda expression hoặc một method reference, chỉ khi kết quả của phép tính đã sẵn sàng. Còn bây giờ, chúng ta sẽ giải quyết một vấn đề khác: làm sao quản lý lỗi trong quá trình thực thi task bất đồng bộ.

### 16.2.2. Xử lý lỗi

Đoạn code bạn đã phát triển đến giờ hoạt động đúng nếu mọi thứ đều suôn sẻ. Nhưng chuyện gì xảy ra nếu việc tính giá sinh ra lỗi? Đáng tiếc, trong trường hợp này bạn nhận được một kết cục đặc biệt tiêu cực: ngoại lệ được ném ra để báo hiệu lỗi vẫn bị giam trong thread đang cố tính giá sản phẩm, và cuối cùng giết chết thread đó. Hệ quả là client bị block mãi mãi, chờ đợi kết quả của phương thức get đến.

Client có thể ngăn chặn vấn đề này bằng cách dùng phiên bản nạp chồng của phương thức get, phiên bản này cũng nhận một timeout. Đó là một thực hành tốt: dùng timeout để ngăn những tình huống tương tự ở những nơi khác trong code của bạn. Bằng cách này, ít nhất client cũng tránh được việc chờ đợi vô hạn, nhưng khi timeout hết hạn, nó sẽ được thông báo bằng một TimeoutException. Hệ quả là client sẽ không có cơ hội biết được nguyên nhân gây ra thất bại bên trong thread đang cố tính giá sản phẩm là gì. Để làm cho client nhận biết được lý do vì sao cửa hàng không thể cung cấp giá của sản phẩm được yêu cầu, bạn phải lan truyền Exception gây ra vấn đề vào bên trong CompletableFuture thông qua phương thức completeExceptionally của nó. Áp dụng ý tưởng này vào listing 16.4 sẽ tạo ra đoạn code trong listing sau đây.

**Listing 16.6. Lan truyền một lỗi bên trong CompletableFuture**

```java
public Future<Double> getPriceAsync(String product) {
    CompletableFuture<Double> futurePrice = new CompletableFuture<>();
    new Thread( () -> {
        try {
            double price = calculatePrice(product);
            // Nếu việc tính giá hoàn tất bình thường, hoàn tất Future với giá đó.
            futurePrice.complete(price);
        } catch (Exception ex) {
            // Ngược lại, hoàn tất Future theo kiểu ngoại lệ với Exception
            // đã gây ra thất bại.
            futurePrice.completeExceptionally(ex);
        }
    }).start();
    return futurePrice;
}
```

Bây giờ client sẽ được thông báo bằng một ExecutionException (ngoại lệ này nhận một tham số Exception chứa nguyên nhân — chính là Exception gốc do phương thức tính giá ném ra). Chẳng hạn, nếu phương thức đó ném ra một RuntimeException nói rằng sản phẩm không có sẵn, client sẽ nhận được một ExecutionException như sau:

```text
Exception in thread "main" java.lang.RuntimeException:
    java.util.concurrent.ExecutionException: java.lang.RuntimeException
        product not available
    at java89inaction.chap16.AsyncShopClient.main(AsyncShopClient.java:1
Caused by: java.util.concurrent.ExecutionException: java.lang.RuntimeExce
    product not available
    at java.base/java.util.concurrent.CompletableFuture.reportGet
     (CompletableFuture.java:395)
    at java.base/java.util.concurrent.CompletableFuture.get
     (CompletableFuture.java:1999)
    at java89inaction.chap16.AsyncShopClient.main(AsyncShopClient.java:1
Caused by: java.lang.RuntimeException: product not available
    at java89inaction.chap16.AsyncShop.calculatePrice(AsyncShop.java:38)
    at java89inaction.chap16.AsyncShop.lambda$0(AsyncShop.java:33)
    at java.base/java.util.concurrent.CompletableFuture$AsyncSupply.run
     (CompletableFuture.java:1700)
    at java.base/java.util.concurrent.CompletableFuture$AsyncSupply.exec
     (CompletableFuture.java:1692)
    at java.base/java.util.concurrent.ForkJoinTask.doExec(ForkJoinTask.j
    at java.base/java.util.concurrent.ForkJoinPool.runWorker
     (ForkJoinPool.java:1603)
    at java.base/java.util.concurrent.ForkJoinWorkerThread.run
     (ForkJoinWorkerThread.java:175)
```

> **Tạo một CompletableFuture bằng phương thức factory supplyAsync**
>
> Cho tới giờ, bạn đã tạo các CompletableFuture và hoàn tất chúng theo cách lập trình khi thấy tiện, nhưng lớp CompletableFuture đi kèm với rất nhiều phương thức factory tiện lợi có thể làm quá trình này dễ dàng và bớt dài dòng hơn nhiều. Chẳng hạn, phương thức supplyAsync cho phép bạn viết lại phương thức getPriceAsync trong listing 16.4 chỉ bằng một câu lệnh duy nhất, như trong listing tiếp theo.

**Listing 16.7. Tạo một CompletableFuture bằng phương thức factory supplyAsync**

```java
public Future<Double> getPriceAsync(String product) {
    return CompletableFuture.supplyAsync(() -> calculatePrice(product));
}
```

Phương thức supplyAsync nhận một Supplier làm đối số và trả về một CompletableFuture sẽ được hoàn tất một cách bất đồng bộ với giá trị thu được từ việc gọi Supplier đó. Supplier này được chạy bởi một trong các Executor trong ForkJoinPool, nhưng bạn có thể chỉ định một Executor khác bằng cách truyền nó làm đối số thứ hai cho phiên bản nạp chồng của phương thức này. Tổng quát hơn, bạn có thể truyền một Executor cho tất cả các phương thức factory khác của CompletableFuture. Bạn sẽ dùng khả năng này trong mục 16.3.4, nơi chúng tôi minh hoạ rằng việc dùng một Executor phù hợp với đặc điểm của ứng dụng có thể có tác động tích cực tới hiệu năng của nó.

Cũng lưu ý rằng CompletableFuture do phương thức getPriceAsync trong listing 16.7 trả về tương đương với cái mà bạn đã tạo và hoàn tất thủ công trong listing 16.6, nghĩa là nó cung cấp cùng cơ chế quản lý lỗi mà bạn đã cẩn thận bổ sung.

Trong phần còn lại của chương này, chúng ta sẽ giả sử rằng bạn không kiểm soát được API do lớp Shop cài đặt và nó chỉ cung cấp các phương thức đồng bộ gây block. Tình huống này thường xảy ra khi bạn muốn tiêu thụ một API HTTP do một dịch vụ nào đó cung cấp. Bạn sẽ thấy rằng vẫn có thể truy vấn nhiều cửa hàng một cách bất đồng bộ, nhờ đó tránh bị block trên một yêu cầu duy nhất và qua đó tăng hiệu năng cũng như throughput của ứng dụng best-price-finder của bạn.

## 16.3. Làm cho code của bạn trở nên non-blocking

Bạn được yêu cầu phát triển một ứng dụng best-price-finder, và tất cả các cửa hàng mà bạn phải truy vấn chỉ cung cấp cùng một API đồng bộ được cài đặt như ở đầu mục 16.2. Nói cách khác, bạn có một danh sách các cửa hàng như thế này:

```java
List<Shop> shops = List.of(new Shop("BestPrice"),
                           new Shop("LetsSaveBig"),
                           new Shop("MyFavoriteShop"),
                           new Shop("BuyItAll"));
```

Bạn phải cài đặt một phương thức có chữ ký sau đây, phương thức này nhận vào tên của một sản phẩm và trả về một danh sách các chuỗi. Mỗi chuỗi chứa tên của một cửa hàng và giá của sản phẩm được yêu cầu tại cửa hàng đó, như sau:

```java
public List<String> findPrices(String product);
```

Ý tưởng đầu tiên của bạn có lẽ sẽ là dùng các tính năng của Stream mà bạn đã học ở các chương 4, 5 và 6. Bạn có thể bị cám dỗ viết một cái gì đó như listing tiếp theo. (Đúng vậy, thật tốt nếu bạn đã nghĩ rằng giải pháp đầu tiên này là dở!)

**Listing 16.8. Một phần cài đặt findPrices truy vấn tuần tự tất cả các cửa hàng**

```java
public List<String> findPrices(String product) {
    return shops.stream()
            .map(shop -> String.format("%s price is %.2f",
                    shop.getName(), shop.getPrice(product)))
            .collect(toList());
}
```

Giải pháp này rất thẳng thắn. Bây giờ hãy thử cho phương thức findPrices chạy với sản phẩm duy nhất mà bạn đang phát cuồng những ngày này: chiếc myPhone27S. Ngoài ra, hãy ghi lại thời gian phương thức chạy hết bao lâu, như trong listing sau đây. Thông tin này cho phép bạn so sánh hiệu năng của phương thức với hiệu năng của phiên bản cải tiến mà bạn sẽ phát triển sau này.

**Listing 16.9. Kiểm tra tính đúng đắn và hiệu năng của findPrices**

```java
long start = System.nanoTime();
System.out.println(findPrices("myPhone27S"));
long duration = (System.nanoTime() - start) / 1_000_000;
System.out.println("Done in " + duration + " msecs");
```

Đoạn code trong listing 16.9 tạo ra đầu ra như thế này:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74]
Done in 4032 msecs
```

Như bạn có thể đã dự đoán, thời gian mà phương thức findPrices chạy hết chỉ dài hơn 4 giây vài mili giây, bởi vì bốn cửa hàng được truy vấn tuần tự và bị block lần lượt từng cái một, và mỗi cửa hàng mất 1 giây để tính giá của sản phẩm được yêu cầu. Làm sao bạn có thể cải thiện kết quả này?

### 16.3.1. Song song hoá các yêu cầu bằng parallel Stream

Sau khi đọc chương 7, cải tiến đầu tiên và nhanh nhất mà bạn nghĩ tới có lẽ sẽ là tránh phép tính tuần tự này bằng cách dùng một parallel Stream thay cho một stream tuần tự, như trong listing tiếp theo.

**Listing 16.10. Song song hoá phương thức findPrices**

```java
public List<String> findPrices(String product) {
    // Dùng một parallel Stream để lấy giá từ các cửa hàng khác nhau song song.
    return shops.parallelStream()
            .map(shop -> String.format("%s price is %.2f",
                    shop.getName(), shop.getPrice(product)))
            .collect(toList());
}
```

Hãy tìm hiểu xem phiên bản mới này của findPrices có tốt hơn không bằng cách chạy lại đoạn code trong listing 16.9:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74]
Done in 1180 msecs
```

Làm tốt lắm! Có vẻ như ý tưởng này đơn giản nhưng hiệu quả. Bây giờ bốn cửa hàng được truy vấn song song, nên đoạn code chỉ mất hơn một giây một chút để hoàn tất.

Bạn có thể làm tốt hơn nữa không? Hãy thử biến tất cả các lời gọi đồng bộ tới các cửa hàng trong phương thức findPrices thành các lời gọi bất đồng bộ, sử dụng những gì bạn đã học được tới giờ về CompletableFuture.

### 16.3.2. Thực hiện các yêu cầu bất đồng bộ với CompletableFuture

Bạn đã thấy trước đó rằng bạn có thể dùng phương thức factory supplyAsync để tạo các đối tượng CompletableFuture. Bây giờ hãy dùng nó:

```java
List<CompletableFuture<String>> priceFutures =
        shops.stream()
        .map(shop -> CompletableFuture.supplyAsync(
                () -> String.format("%s price is %.2f",
                        shop.getName(), shop.getPrice(product))))
        .collect(toList());
```

Với cách tiếp cận này, bạn thu được một `List<CompletableFuture<String>>`, trong đó mỗi CompletableFuture trong List chứa tên String của một cửa hàng khi phép tính của nó hoàn tất. Nhưng vì phương thức findPrices mà bạn đang cố cài đặt lại bằng CompletableFuture phải trả về một `List<String>`, bạn sẽ phải chờ tất cả các future này hoàn tất và trích xuất các giá trị chúng chứa trước khi trả về List.

Để đạt được kết quả này, bạn có thể áp dụng một thao tác map thứ hai lên `List<CompletableFuture<String>>` ban đầu, gọi join trên tất cả các future trong List và rồi chờ chúng hoàn tất từng cái một. Lưu ý rằng phương thức join của lớp CompletableFuture có cùng ý nghĩa với phương thức get cũng được khai báo trong interface Future, khác biệt duy nhất là join không ném ra bất kỳ checked exception nào. Bằng cách dùng join, bạn không phải làm phình to lambda expression được truyền cho thao tác map thứ hai này bằng một khối try/catch. Ghép tất cả lại với nhau, bạn có thể viết lại phương thức findPrices như trong listing sau đây.

**Listing 16.11. Cài đặt phương thức findPrices bằng CompletableFuture**

```java
public List<String> findPrices(String product) {
    List<CompletableFuture<String>> priceFutures =
            shops.stream()
            // Tính từng mức giá một cách bất đồng bộ bằng một CompletableFuture.
            .map(shop -> CompletableFuture.supplyAsync(
                    () -> shop.getName() + " price is " +
                            shop.getPrice(product)))
            .collect(Collectors.toList());
    return priceFutures.stream()
            // Chờ tất cả các thao tác bất đồng bộ hoàn tất.
            .map(CompletableFuture::join)
            .collect(toList());
}
```

Lưu ý rằng bạn dùng hai pipeline stream riêng biệt thay vì đặt hai thao tác map nối tiếp nhau trong cùng một pipeline xử lý stream — và điều đó có lý do chính đáng. Do bản chất lazy (laziness) của các intermediate operation trên stream, nếu bạn xử lý stream trong một pipeline duy nhất, bạn sẽ chỉ đạt được việc thực thi tất cả các yêu cầu tới các cửa hàng khác nhau một cách đồng bộ và tuần tự. Việc tạo mỗi CompletableFuture để hỏi một cửa hàng nhất định sẽ chỉ bắt đầu khi phép tính của cái trước đó hoàn tất, để cho phương thức join trả về kết quả của phép tính đó. Hình 16.2 làm rõ chi tiết quan trọng này.

Nửa trên của hình 16.2 cho thấy việc xử lý stream với một pipeline duy nhất hàm ý rằng thứ tự đánh giá (được nhận diện bởi đường chấm chấm) là tuần tự. Thực tế, một CompletableFuture mới chỉ được tạo ra sau khi cái trước đó đã được đánh giá hoàn toàn. Ngược lại, nửa dưới của hình minh hoạ việc trước tiên gom các CompletableFuture vào một danh sách (được biểu diễn bằng hình bầu dục) cho phép tất cả chúng khởi động trước khi chờ chúng hoàn tất.

> **Hình 16.2.** Vì sao tính lazy của Stream gây ra một phép tính tuần tự và làm sao để tránh điều đó

Chạy đoạn code trong listing 16.11 để kiểm tra hiệu năng của phiên bản thứ ba này của phương thức findPrices, bạn có thể thu được đầu ra đại loại như sau:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74]
Done in 2005 msecs
```

Kết quả này khá đáng thất vọng, phải không? Với thời gian chạy hơn 2 giây, phần cài đặt bằng CompletableFuture này nhanh hơn phần cài đặt tuần tự và gây block ngây thơ ban đầu ở listing 16.8. Nhưng nó cũng chậm hơn gần gấp đôi so với phần cài đặt trước đó dùng parallel stream. Điều này còn đáng thất vọng hơn nữa khi xét tới việc bạn có được phiên bản parallel stream chỉ bằng một thay đổi tầm thường so với phiên bản tuần tự.

Phiên bản mới hơn dùng CompletableFuture đòi hỏi khá nhiều công sức. Nhưng việc dùng CompletableFuture trong kịch bản này có phải là lãng phí thời gian? Hay bạn đang bỏ sót điều gì đó quan trọng? Hãy dành vài phút suy nghĩ trước khi đi tiếp, đặc biệt nhớ rằng bạn đang kiểm thử các mẫu code trên một máy có khả năng chạy song song bốn thread.[1]

> [1] Nếu bạn đang dùng một máy có khả năng chạy song song nhiều thread hơn (chẳng hạn tám), bạn cần nhiều cửa hàng và tiến trình song song hơn để tái hiện hành vi được mô tả trong những trang này.

### 16.3.3. Tìm kiếm giải pháp có khả năng mở rộng tốt hơn

Phiên bản parallel stream chạy tốt như vậy chỉ vì nó có thể chạy song song bốn task, nên nó có thể cấp phát đúng một thread cho mỗi cửa hàng. Chuyện gì xảy ra nếu bạn quyết định thêm một cửa hàng thứ năm vào danh sách các cửa hàng mà ứng dụng best-price-finder của bạn phải quét? Không có gì đáng ngạc nhiên, phiên bản tuần tự cần hơn 5 giây một chút để chạy, như đầu ra sau đây cho thấy:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74, ShopEasy price is 166.08]
Done in 5025 msecs
```

Đó là đầu ra của chương trình dùng một stream tuần tự.

Đáng tiếc, phiên bản parallel stream cũng cần thêm nguyên một giây so với trước đó, bởi vì cả bốn thread mà nó có thể chạy song song (có sẵn trong common thread pool) giờ đã bận với bốn cửa hàng đầu tiên. Truy vấn thứ năm phải chờ một trong các thao tác trước đó hoàn tất để giải phóng một thread, như sau:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74, ShopEasy price is 166.08]
Done in 2167 msecs
```

Đó là đầu ra của chương trình dùng một parallel stream.

Còn phiên bản CompletableFuture thì sao? Hãy thử nó với cửa hàng thứ năm:

```text
[BestPrice price is 123.26, LetsSaveBig price is 169.47, MyFavoriteShop p
     is 214.13, BuyItAll price is 184.74, ShopEasy price is 166.08]
Done in 2006 msecs
```

Đó là đầu ra của chương trình dùng CompletableFuture.

Phiên bản CompletableFuture có vẻ nhanh hơn một chút so với phiên bản dùng parallel stream, nhưng phiên bản này cũng chưa làm hài lòng. Nếu bạn thử chạy code với chín cửa hàng, phiên bản parallel stream mất 3143 mili giây, trong khi phiên bản CompletableFuture cần 3009 mili giây. Hai phiên bản trông tương đương nhau vì một lý do chính đáng: cả hai đều dùng cùng một common pool bên trong, pool này theo mặc định có số thread cố định bằng với con số do `Runtime.getRuntime().availableProcessors()` trả về. Tuy vậy, phiên bản CompletableFuture có một lợi thế: khác với Parallel Streams API, nó cho phép bạn chỉ định một Executor khác để gửi task tới. Bạn có thể cấu hình Executor này, và định kích thước thread pool của nó, theo cách phù hợp hơn với các yêu cầu của ứng dụng của bạn. Trong mục tiếp theo, bạn sẽ chuyển hoá mức độ khả cấu hình tốt hơn này thành lợi ích hiệu năng thực tế cho ứng dụng của bạn.

### 16.3.4. Sử dụng một Executor tuỳ chỉnh

Trong trường hợp này, một lựa chọn hợp lý có vẻ là tạo một Executor với số thread trong pool có tính tới khối lượng công việc thực tế mà bạn có thể kỳ vọng trong ứng dụng của mình. Làm sao để định kích thước Executor này cho đúng?

> **Định kích thước thread pool**
>
> Trong cuốn sách tuyệt vời *Java Concurrency in Practice* (Addison-Wesley, 2006; http://jcip.net), Brian Goetz và các đồng tác giả đưa ra một số lời khuyên về việc tìm kích thước tối ưu cho một thread pool. Lời khuyên này quan trọng bởi vì nếu số thread trong pool quá lớn, các thread rốt cuộc sẽ cạnh tranh nhau tài nguyên CPU và bộ nhớ khan hiếm, lãng phí thời gian của chúng vào việc chuyển ngữ cảnh (context switching). Ngược lại, nếu con số này quá nhỏ (như nhiều khả năng đang xảy ra trong ứng dụng của bạn), một số nhân của CPU sẽ bị sử dụng chưa hết công suất. Goetz gợi ý rằng bạn có thể tính kích thước pool phù hợp để xấp xỉ một mức sử dụng CPU mong muốn bằng công thức sau:
>
> Nthreads = NCPU * UCPU * (1 + W/C)
>
> Trong công thức này, NCPU là số nhân, có được thông qua `Runtime.getRuntime().availableProcessors()`
>
> - UCPU là mức sử dụng CPU mục tiêu (giữa 0 và 1).
> - W/C là tỷ lệ giữa thời gian chờ và thời gian tính toán.
>
> Ứng dụng dành khoảng 99 phần trăm thời gian của nó để chờ phản hồi của các cửa hàng, nên bạn có thể ước lượng tỷ lệ W/C là 100. Nếu mục tiêu của bạn là sử dụng 100 phần trăm CPU, bạn nên có một pool với 400 thread. Trên thực tế, sẽ là lãng phí nếu có nhiều thread hơn số cửa hàng, bởi vì bạn sẽ có những thread trong pool không bao giờ được dùng đến. Vì lý do đó, bạn cần thiết lập một Executor với số thread cố định bằng với số cửa hàng bạn phải truy vấn, để có một thread cho mỗi cửa hàng. Đồng thời hãy đặt một giới hạn trên là 100 thread để tránh làm sập máy chủ khi có số lượng cửa hàng lớn hơn, như trong listing sau đây.

**Listing 16.12. Một Executor tuỳ chỉnh phù hợp với ứng dụng best-price-finder**

```java
// Tạo một thread pool với số thread bằng giá trị nhỏ nhất giữa 100 và số cửa hàng.
private final Executor executor =
        Executors.newFixedThreadPool(Math.min(shops.size(), 100),
                (Runnable r) -> {
                    Thread t = new Thread(r);
                    // Dùng daemon thread, loại thread không ngăn cản chương trình kết thúc.
                    t.setDaemon(true);
                    return t;
                }
        );
```

Lưu ý rằng bạn đang tạo một pool gồm các daemon thread. Một chương trình Java không thể kết thúc hoặc thoát trong khi một thread bình thường đang thực thi, nên một thread còn sót lại đang chờ một sự kiện không bao giờ được thoả mãn sẽ gây ra vấn đề. Ngược lại, đánh dấu một thread là daemon nghĩa là nó có thể bị giết khi chương trình kết thúc. Không có khác biệt về hiệu năng. Bây giờ bạn có thể truyền Executor mới làm đối số thứ hai của phương thức factory supplyAsync. Ngoài ra, bây giờ hãy tạo CompletableFuture lấy về giá của sản phẩm được yêu cầu từ một cửa hàng nhất định như sau:

```java
CompletableFuture.supplyAsync(() -> shop.getName() + " price is " +
                                    shop.getPrice(product), executor);
```

Sau cải tiến này, giải pháp CompletableFuture mất 1021 mili giây để xử lý năm cửa hàng và 1022 mili giây để xử lý chín cửa hàng. Xu hướng này tiếp tục cho tới khi số cửa hàng chạm ngưỡng 400 mà bạn đã tính trước đó. Ví dụ này minh hoạ thực tế rằng việc tạo một Executor phù hợp với đặc điểm của ứng dụng và dùng CompletableFuture để gửi task tới nó là một ý tưởng hay. Chiến lược này hầu như luôn hiệu quả và là điều đáng cân nhắc khi bạn sử dụng các thao tác bất đồng bộ một cách chuyên sâu.

> **Tính song song: qua Stream hay qua CompletableFuture?**
>
> Bạn đã thấy hai cách để thực hiện tính toán song song trên một collection: chuyển collection thành một parallel stream và dùng các thao tác như map trên nó, hoặc duyệt qua collection và sinh ra các thao tác bên trong một CompletableFuture. Kỹ thuật thứ hai cung cấp nhiều quyền kiểm soát hơn nhờ khả năng thay đổi kích thước thread pool, điều này bảo đảm rằng toàn bộ phép tính của bạn không bị block vì tất cả các thread của bạn (với số lượng cố định) đều đang chờ I/O. Lời khuyên của chúng tôi khi dùng các API này như sau:
>
> - Nếu bạn đang làm các thao tác nặng về tính toán mà không có I/O, interface Stream cung cấp phần cài đặt đơn giản nhất và nhiều khả năng cũng là hiệu quả nhất. (Nếu tất cả các thread đều bị giới hạn bởi tính toán — compute-bound — thì chẳng có ích gì khi có nhiều thread hơn số nhân bộ xử lý.)
> - Nếu các đơn vị công việc song song của bạn có liên quan tới việc chờ I/O (bao gồm cả các kết nối mạng), giải pháp CompletableFuture cung cấp nhiều linh hoạt hơn và cho phép bạn khớp số thread với tỷ lệ chờ/tính toán (W/C) như đã bàn ở trên. Một lý do khác để tránh dùng parallel stream khi có chờ I/O trong pipeline xử lý stream là tính lazy của stream có thể khiến việc suy luận về thời điểm xảy ra các lần chờ trở nên khó khăn hơn.

Bạn đã học được cách tận dụng CompletableFuture để cung cấp một API bất đồng bộ cho các client của bạn và để đóng vai client của một máy chủ đồng bộ nhưng chậm chạp, nhưng bạn mới chỉ thực hiện một thao tác tốn thời gian duy nhất trong mỗi Future. Trong mục tiếp theo, bạn sẽ dùng CompletableFuture để nối ống nhiều thao tác bất đồng bộ theo một phong cách khai báo tương tự như những gì bạn đã học khi dùng Streams API.

## 16.4. Nối ống các task bất đồng bộ

Giả sử rằng tất cả các cửa hàng đã đồng ý dùng một dịch vụ giảm giá tập trung. Dịch vụ này dùng năm mã giảm giá, mỗi mã có một phần trăm giảm giá khác nhau. Bạn biểu diễn ý tưởng này bằng cách định nghĩa một enumeration Discount.Code, như trong listing tiếp theo.

**Listing 16.13. Một enumeration định nghĩa các mã giảm giá**

```java
public class Discount {
    public enum Code {
        NONE(0), SILVER(5), GOLD(10), PLATINUM(15), DIAMOND(20);

        private final int percentage;

        Code(int percentage) {
            this.percentage = percentage;
        }
    }
    // Phần cài đặt của lớp Discount được lược bỏ, xem Listing 16.14
}
```

Cũng giả sử rằng các cửa hàng đã đồng ý thay đổi định dạng kết quả của phương thức getPrice, phương thức này nay trả về một String theo định dạng `ShopName:price:DiscountCode`. Phần cài đặt mẫu của bạn trả về một Discount.Code ngẫu nhiên cùng với mức giá ngẫu nhiên đã được tính từ trước, như sau:

```java
public String getPrice(String product) {
    double price = calculatePrice(product);
    Discount.Code code = Discount.Code.values()[
            random.nextInt(Discount.Code.values().length)];
    return String.format("%s:%.2f:%s", name, price, code);
}

private double calculatePrice(String product) {
    delay();
    return random.nextDouble() * product.charAt(0) + product.charAt(1);
}
```

Khi đó, việc gọi getPrice có thể trả về một String chẳng hạn như

```text
BestPrice:123.26:GOLD
```

### 16.4.1. Cài đặt một dịch vụ giảm giá

Bây giờ ứng dụng best-price-finder của bạn cần lấy giá từ các cửa hàng; phân tích cú pháp các String kết quả; và, với mỗi String, truy vấn nhu cầu của máy chủ giảm giá. Quá trình này xác định giá cuối cùng sau giảm giá của sản phẩm được yêu cầu. (Phần trăm giảm giá thực tế gắn với mỗi mã giảm giá có thể thay đổi, đó là lý do bạn truy vấn máy chủ mỗi lần.) Việc phân tích cú pháp các String do cửa hàng tạo ra được đóng gói trong lớp Quote sau đây:

```java
public class Quote {
    private final String shopName;
    private final double price;
    private final Discount.Code discountCode;

    public Quote(String shopName, double price, Discount.Code code) {
        this.shopName = shopName;
        this.price = price;
        this.discountCode = code;
    }

    public static Quote parse(String s) {
        String[] split = s.split(":");
        String shopName = split[0];
        double price = Double.parseDouble(split[1]);
        Discount.Code discountCode = Discount.Code.valueOf(split[2]);
        return new Quote(shopName, price, discountCode);
    }

    public String getShopName() { return shopName; }
    public double getPrice() { return price; }
    public Discount.Code getDiscountCode() { return discountCode; }
}
```

Bạn có thể lấy một thể hiện của lớp Quote — thể hiện này chứa tên cửa hàng, giá chưa giảm, và mã giảm giá — bằng cách truyền String do một cửa hàng tạo ra cho phương thức factory tĩnh parse.

Dịch vụ Discount cũng có một phương thức applyDiscount nhận một đối tượng Quote và trả về một String cho biết giá sau giảm cho cửa hàng đã tạo ra báo giá đó, như trong listing sau đây.

**Listing 16.14. Dịch vụ Discount**

```java
public class Discount {
    public enum Code {
        // phần mã nguồn được lược bỏ ...
    }

    public static String applyDiscount(Quote quote) {
        return quote.getShopName() + " price is " +
                // Áp dụng mã giảm giá lên giá gốc.
                Discount.apply(quote.getPrice(),
                        quote.getDiscountCode());
    }

    private static double apply(double price, Code code) {
        // Mô phỏng một độ trễ trong phản hồi của dịch vụ Discount.
        delay();
        return format(price * (100 - code.percentage) / 100);
    }
}
```

### 16.4.2. Sử dụng dịch vụ Discount

Bởi vì dịch vụ Discount là một dịch vụ từ xa, một lần nữa bạn thêm vào nó một độ trễ mô phỏng 1 giây, như trong listing tiếp theo. Như bạn đã làm ở mục 16.3, trước tiên hãy thử cài đặt lại phương thức findPrices để đáp ứng các yêu cầu mới này theo cách hiển nhiên nhất (nhưng đáng buồn là tuần tự và đồng bộ).

**Listing 16.15. Phần cài đặt findPrices đơn giản nhất có dùng dịch vụ Discount**

```java
public List<String> findPrices(String product) {
    return shops.stream()
            // Lấy giá chưa giảm từ mỗi cửa hàng.
            .map(shop -> shop.getPrice(product))
            // Chuyển các String do các cửa hàng trả về thành các đối tượng Quote.
            .map(Quote::parse)
            // Liên hệ dịch vụ Discount để áp dụng giảm giá cho mỗi Quote.
            .map(Discount::applyDiscount)
            .collect(toList());
}
```

Bạn thu được kết quả mong muốn bằng cách nối ống ba thao tác map trên stream các cửa hàng:

- Thao tác thứ nhất biến mỗi cửa hàng thành một String mã hoá giá và mã giảm giá của sản phẩm được yêu cầu tại cửa hàng đó.
- Thao tác thứ hai phân tích cú pháp các String đó, chuyển từng cái thành một đối tượng Quote.
- Thao tác thứ ba liên hệ với dịch vụ Discount từ xa, dịch vụ này tính giá cuối cùng sau giảm và trả về một String khác chứa tên cửa hàng cùng với mức giá đó.

Như bạn có thể hình dung, hiệu năng của phần cài đặt này còn xa mới tối ưu. Nhưng hãy thử đo nó như thường lệ bằng cách chạy benchmark của bạn:

```text
[BestPrice price is 110.93, LetsSaveBig price is 135.58, MyFavoriteShop p
     is 192.72, BuyItAll price is 184.74, ShopEasy price is 167.28]
Done in 10028 msecs
```

Đúng như dự kiến, đoạn code này mất 10 giây để chạy, bởi vì 5 giây cần thiết để truy vấn tuần tự năm cửa hàng được cộng thêm 5 giây mà dịch vụ giảm giá tiêu tốn khi áp dụng mã giảm giá lên các mức giá do năm cửa hàng trả về. Bạn đã biết rằng bạn có thể cải thiện kết quả này bằng cách chuyển stream thành parallel stream. Nhưng bạn cũng biết (từ mục 16.3) rằng giải pháp này không mở rộng tốt khi bạn tăng số cửa hàng cần truy vấn, do common thread pool cố định mà stream dựa vào. Ngược lại, bạn đã học được rằng bạn có thể tận dụng CPU tốt hơn bằng cách định nghĩa một Executor tuỳ chỉnh để lập lịch cho các task được thực hiện bởi CompletableFuture.

### 16.4.3. Kết hợp các thao tác đồng bộ và bất đồng bộ

Trong mục này, bạn sẽ thử cài đặt lại phương thức findPrices theo cách bất đồng bộ, một lần nữa dùng các tính năng do CompletableFuture cung cấp. Listing tiếp theo trình bày đoạn code. Đừng lo nếu có điều gì đó trông xa lạ; chúng tôi sẽ giải thích đoạn code trong mục này.

**Listing 16.16. Cài đặt phương thức findPrices bằng CompletableFuture**

```java
public List<String> findPrices(String product) {
    List<CompletableFuture<String>> priceFutures =
            shops.stream()
            // Lấy giá chưa giảm từ mỗi cửa hàng một cách bất đồng bộ.
            .map(shop -> CompletableFuture.supplyAsync(
                    () -> shop.getPrice(product), executor))
            // Biến String do một cửa hàng trả về thành một đối tượng Quote
            // khi nó sẵn sàng.
            .map(future -> future.thenApply(Quote::parse))
            // Kết hợp Future kết quả với một task bất đồng bộ khác,
            // áp dụng mã giảm giá.
            .map(future -> future.thenCompose(quote ->
                    CompletableFuture.supplyAsync(
                            () -> Discount.applyDiscount(quote), executor)))
            .collect(toList());
    // Chờ tất cả các Future trong stream hoàn tất và trích xuất
    // các kết quả tương ứng của chúng.
    return priceFutures.stream()
            .map(CompletableFuture::join)
            .collect(toList());
}
```

Lần này mọi thứ trông có vẻ phức tạp hơn một chút, nên hãy cố hiểu chuyện gì đang xảy ra theo từng bước. Hình 16.3 mô tả trình tự của ba phép biến đổi này.

> **Hình 16.3.** Kết hợp các thao tác đồng bộ và các task bất đồng bộ

Bạn đang thực hiện đúng ba thao tác map như trong giải pháp đồng bộ ở listing 16.15, nhưng bạn làm cho các thao tác đó trở nên bất đồng bộ khi cần, bằng cách dùng tính năng do lớp CompletableFuture cung cấp.

**Lấy giá**

Bạn đã thấy thao tác đầu tiên trong ba thao tác này ở nhiều ví dụ trong chương này; bạn truy vấn cửa hàng một cách bất đồng bộ bằng cách truyền một lambda expression cho phương thức factory supplyAsync. Kết quả của phép biến đổi đầu tiên này là một `Stream<CompletableFuture<String>>`, trong đó mỗi CompletableFuture, khi hoàn tất, chứa String do cửa hàng tương ứng trả về. Lưu ý rằng bạn cấu hình các CompletableFuture với Executor tuỳ chỉnh đã phát triển trong listing 16.12.

**Phân tích cú pháp các báo giá**

Bây giờ bạn phải chuyển các String đó thành các Quote bằng một phép biến đổi thứ hai. Nhưng vì thao tác phân tích cú pháp này không gọi bất kỳ dịch vụ từ xa nào hay thực hiện I/O nói chung, nó có thể được thực hiện gần như tức thời và có thể được làm một cách đồng bộ mà không đưa vào bất kỳ độ trễ nào. Vì lý do đó, bạn cài đặt phép biến đổi thứ hai này bằng cách gọi phương thức thenApply trên các CompletableFuture do bước đầu tiên tạo ra và truyền cho nó một Function chuyển một String thành một thể hiện của Quote.

Lưu ý rằng việc dùng phương thức thenApply không làm code của bạn bị block cho tới khi CompletableFuture mà bạn gọi nó lên hoàn tất. Khi CompletableFuture cuối cùng hoàn tất, bạn muốn biến đổi giá trị mà nó chứa bằng lambda expression được truyền cho phương thức thenApply, qua đó biến mỗi `CompletableFuture<String>` trong stream thành một `CompletableFuture<Quote>` tương ứng. Bạn có thể xem quá trình này như việc xây dựng một công thức chỉ rõ phải làm gì với kết quả của CompletableFuture, giống như khi bạn làm việc với một pipeline stream.

**Kết hợp các future để tính giá sau giảm**

Thao tác map thứ ba liên quan tới việc liên hệ dịch vụ Discount từ xa để áp dụng phần trăm giảm giá phù hợp lên các mức giá chưa giảm nhận được từ các cửa hàng. Phép biến đổi này khác với phép biến đổi trước đó ở chỗ nó phải được thực thi từ xa (hoặc, trong trường hợp này, phải mô phỏng lời gọi từ xa bằng một độ trễ), và vì lý do đó, bạn cũng muốn thực hiện nó một cách bất đồng bộ.

Để đạt được mục tiêu này, cũng như bạn đã làm với lời gọi supplyAsync đầu tiên cùng getPrice, bạn truyền thao tác này dưới dạng một lambda expression cho phương thức factory supplyAsync, phương thức này trả về một CompletableFuture khác. Đến đây bạn có hai thao tác bất đồng bộ, được mô hình hoá bằng hai CompletableFuture riêng biệt, mà bạn muốn thực hiện nối tiếp nhau:

- Lấy giá từ một cửa hàng rồi biến nó thành một Quote.
- Lấy Quote này và truyền nó cho dịch vụ Discount để có được giá cuối cùng sau giảm.

CompletableFuture API của Java 8 cung cấp phương thức thenCompose chuyên cho mục đích này, cho phép bạn nối ống hai thao tác bất đồng bộ, truyền kết quả của thao tác thứ nhất cho thao tác thứ hai khi nó sẵn sàng. Nói cách khác, bạn có thể kết hợp hai CompletableFuture bằng cách gọi phương thức thenCompose trên CompletableFuture thứ nhất và truyền cho nó một Function. Function này nhận đối số là giá trị do CompletableFuture thứ nhất trả về khi nó hoàn tất, và nó trả về một CompletableFuture thứ hai dùng kết quả của cái thứ nhất làm đầu vào cho phép tính của mình. Lưu ý rằng với cách tiếp cận này, trong khi các Future đang lấy về các báo giá từ các cửa hàng, thread chính có thể thực hiện các thao tác hữu ích khác, chẳng hạn phản hồi các sự kiện giao diện người dùng.

Thu thập các phần tử của Stream kết quả từ ba thao tác map này vào một List, bạn thu được một `List<CompletableFuture<String>>`. Cuối cùng, bạn có thể chờ các CompletableFuture đó hoàn tất và trích xuất giá trị của chúng bằng cách dùng join, đúng như bạn đã làm ở listing 16.11. Phiên bản mới này của phương thức findPrices được cài đặt trong listing 16.8 có thể tạo ra đầu ra như sau:

```text
[BestPrice price is 110.93, LetsSaveBig price is 135.58, MyFavoriteShop p
     is 192.72, BuyItAll price is 184.74, ShopEasy price is 167.28]
Done in 2035 msecs
```

Phương thức thenCompose mà bạn đã dùng trong listing 16.16, giống như các phương thức khác của lớp CompletableFuture, có một biến thể với hậu tố Async là thenComposeAsync. Nói chung, một phương thức không có hậu tố Async trong tên sẽ thực thi task của nó trên cùng thread với task trước đó, trong khi một phương thức kết thúc bằng Async luôn gửi task kế tiếp tới thread pool, nên mỗi task có thể được xử lý bởi một thread khác nhau. Trong trường hợp này, kết quả của CompletableFuture thứ hai phụ thuộc vào cái thứ nhất, nên việc bạn kết hợp hai CompletableFuture bằng biến thể này hay biến thể kia của phương thức này cũng không tạo ra khác biệt cho kết quả cuối cùng hay cho thời gian chạy ở mức tổng quát. Bạn chọn dùng biến thể thenCompose chỉ vì nó hiệu quả hơn một chút do ít overhead chuyển thread hơn. Tuy nhiên, hãy lưu ý rằng không phải lúc nào cũng rõ ràng thread nào đang được sử dụng, đặc biệt nếu bạn chạy một ứng dụng tự quản lý thread pool của riêng nó (chẳng hạn như Spring).

### 16.4.4. Kết hợp hai CompletableFuture: phụ thuộc và độc lập

Trong listing 16.16, bạn đã gọi phương thức thenCompose trên một CompletableFuture và truyền cho nó một CompletableFuture thứ hai, cái này cần giá trị kết quả từ việc thực thi cái thứ nhất làm đầu vào. Trong một trường hợp phổ biến khác, bạn cần kết hợp kết quả của các thao tác được thực hiện bởi hai CompletableFuture độc lập, và bạn không muốn chờ cái thứ nhất hoàn tất rồi mới bắt đầu cái thứ hai.

Trong những tình huống như thế này, hãy dùng phương thức thenCombine. Phương thức này nhận làm đối số thứ hai một BiFunction, hàm này định nghĩa cách kết hợp kết quả của hai CompletableFuture khi cả hai đều sẵn sàng. Giống như thenCompose, phương thức thenCombine cũng đi kèm một biến thể Async. Trong trường hợp này, việc dùng phương thức thenCombineAsync khiến thao tác kết hợp được định nghĩa bởi BiFunction được gửi tới thread pool và sau đó được thực thi bất đồng bộ trong một task riêng.

Quay lại ví dụ xuyên suốt chương này, bạn có thể biết rằng một trong các cửa hàng cung cấp giá bằng € (EUR), nhưng bạn luôn muốn truyền đạt chúng tới khách hàng của mình bằng $ (USD). Bạn có thể hỏi cửa hàng giá của một sản phẩm nhất định một cách bất đồng bộ và, một cách tách biệt, lấy về từ một dịch vụ tỷ giá hối đoái từ xa tỷ giá hiện tại giữa € và $. Sau khi cả hai yêu cầu đã hoàn tất, bạn có thể kết hợp các kết quả bằng cách nhân giá với tỷ giá. Với cách tiếp cận này, bạn thu được một CompletableFuture thứ ba, cái này hoàn tất khi kết quả của hai CompletableFuture kia đều sẵn sàng và đã được kết hợp thông qua BiFunction, như trong listing sau đây.

**Listing 16.17. Kết hợp hai CompletableFuture độc lập**

```java
Future<Double> futurePriceInUSD =
        // Tạo task thứ nhất truy vấn cửa hàng để lấy giá của một sản phẩm.
        CompletableFuture.supplyAsync(() -> shop.getPrice(product))
        .thenCombine(
                // Tạo task thứ hai độc lập để lấy tỷ giá chuyển đổi
                // giữa USD và EUR.
                CompletableFuture.supplyAsync(
                        () -> exchangeService.getRate(Money.EUR, Money.USD)),
                // Kết hợp giá và tỷ giá bằng cách nhân chúng với nhau.
                (price, rate) -> price * rate
        );
```

Ở đây, bởi vì thao tác kết hợp chỉ là một phép nhân đơn giản, việc thực hiện nó trong một task riêng sẽ là lãng phí tài nguyên, nên bạn cần dùng phương thức thenCombine thay vì biến thể bất đồng bộ thenCombineAsync của nó. Hình 16.4 cho thấy cách các task được tạo ra trong listing 16.17 được thực thi trên các thread khác nhau của pool và cách kết quả của chúng được kết hợp.

> **Hình 16.4.** Kết hợp hai task bất đồng bộ độc lập

### 16.4.5. Suy ngẫm về Future và CompletableFuture

Hai ví dụ cuối cùng trong các listing 16.16 và 16.17 cho thấy rõ một trong những lợi thế lớn nhất của CompletableFuture so với các phần cài đặt Future khác trước Java 8. CompletableFuture dùng lambda expression để cung cấp một API mang tính khai báo. API này cho phép bạn dễ dàng kết hợp và ghép nối nhiều task đồng bộ và bất đồng bộ khác nhau để thực hiện một thao tác phức tạp theo cách hiệu quả nhất. Để có một hình dung cụ thể hơn về lợi ích của CompletableFuture đối với tính dễ đọc của code, hãy thử thu được kết quả của listing 16.17 hoàn toàn bằng Java 7. Listing tiếp theo chỉ cho bạn cách làm.

**Listing 16.18. Kết hợp hai Future trong Java 7**

```java
// Tạo một ExecutorService cho phép bạn gửi các task tới một thread pool.
ExecutorService executor = Executors.newCachedThreadPool();
// Tạo một Future lấy về tỷ giá hối đoái giữa EUR và USD.
final Future<Double> futureRate = executor.submit(new Callable<Double>() {
        public Double call() {
            return exchangeService.getRate(Money.EUR, Money.USD);
        }});
// Tìm giá của sản phẩm được yêu cầu tại một cửa hàng nhất định
// trong một Future thứ hai.
Future<Double> futurePriceInUSD = executor.submit(new Callable<Double>() {
        public Double call() {
            double priceInEUR = shop.getPrice(product);
            // Nhân giá với tỷ giá trong cùng Future đã dùng để tìm giá.
            return priceInEUR * futureRate.get();
        }});
```

Trong listing 16.18, bạn tạo một Future thứ nhất, gửi một Callable tới một Executor để truy vấn một dịch vụ bên ngoài nhằm tìm tỷ giá hối đoái giữa EUR và USD. Sau đó bạn tạo một Future thứ hai, lấy về giá bằng EUR của sản phẩm được yêu cầu tại một cửa hàng nhất định. Cuối cùng, như bạn đã làm trong listing 16.17, bạn nhân tỷ giá với giá trong cùng future cũng đã truy vấn cửa hàng để lấy giá bằng EUR. Lưu ý rằng việc dùng thenCombineAsync thay cho thenCombine trong listing 16.17 sẽ tương đương với việc thực hiện phép nhân giá với tỷ giá trong một Future thứ ba ở listing 16.18. Khác biệt giữa hai phần cài đặt này có vẻ nhỏ chỉ vì bạn mới đang kết hợp có hai Future.

### 16.4.6. Sử dụng timeout một cách hiệu quả

Như đã đề cập ở mục 16.2.2, luôn là một ý hay khi chỉ định một timeout lúc bạn cố đọc giá trị được tính bởi một Future, để tránh bị block vô hạn trong khi chờ phép tính của giá trị đó. Java 9 giới thiệu vài phương thức tiện lợi làm phong phú thêm các khả năng về timeout do CompletableFuture cung cấp. Phương thức orTimeout dùng một ScheduledThreadExecutor để hoàn tất CompletableFuture bằng một TimeoutException sau khi khoảng thời gian timeout được chỉ định trôi qua, và nó trả về một CompletableFuture khác. Bằng cách dùng phương thức này, bạn có thể tiếp tục nối chuỗi pipeline tính toán của mình và xử lý TimeoutException bằng cách trả về một thông điệp thân thiện. Bạn có thể thêm một timeout vào Future trong listing 16.17 và làm cho nó ném ra một TimeoutException nếu không hoàn tất sau 3 giây, bằng cách thêm phương thức này vào cuối chuỗi phương thức, như trong listing tiếp theo. Tất nhiên, thời lượng timeout nên khớp với các yêu cầu nghiệp vụ của bạn.

**Listing 16.19. Thêm một timeout vào CompletableFuture**

```java
Future<Double> futurePriceInUSD =
        CompletableFuture.supplyAsync(() -> shop.getPrice(product))
        .thenCombine(
                CompletableFuture.supplyAsync(
                        () -> exchangeService.getRate(Money.EUR, Money.USD)),
                (price, rate) -> price * rate
        )
        // Làm cho Future ném ra TimeoutException nếu không hoàn tất sau 3 giây.
        // Quản lý timeout bất đồng bộ được thêm vào trong Java 9.
        .orTimeout(3, TimeUnit.SECONDS);
```

Đôi khi, cũng có thể chấp nhận được việc dùng một giá trị mặc định trong trường hợp một dịch vụ tạm thời không thể phản hồi kịp thời. Bạn có thể quyết định rằng trong listing 16.19, bạn muốn chờ dịch vụ hối đoái cung cấp tỷ giá EUR sang USD hiện tại không quá 1 giây, nhưng nếu yêu cầu mất nhiều thời gian hơn để hoàn tất, bạn không muốn huỷ bỏ toàn bộ phép tính bằng một Exception. Thay vào đó, bạn có thể dự phòng bằng cách dùng một tỷ giá định sẵn. Bạn có thể dễ dàng thêm loại timeout thứ hai này bằng cách dùng phương thức completeOnTimeout, cũng được giới thiệu trong Java 9 (listing sau đây).

**Listing 16.20. Hoàn tất một CompletableFuture bằng một giá trị mặc định sau khi hết timeout**

```java
Future<Double> futurePriceInUSD =
        CompletableFuture.supplyAsync(() -> shop.getPrice(product))
        .thenCombine(
                CompletableFuture.supplyAsync(
                        () -> exchangeService.getRate(Money.EUR, Money.USD))
                // Dùng một tỷ giá mặc định nếu dịch vụ hối đoái không cung cấp
                // kết quả trong 1 giây.
                .completeOnTimeout(DEFAULT_RATE, 1, TimeUnit.SECONDS),
                (price, rate) -> price * rate
        )
        .orTimeout(3, TimeUnit.SECONDS);
```

Giống như phương thức orTimeout, phương thức completeOnTimeout trả về một CompletableFuture, nên bạn có thể nối chuỗi nó với các phương thức CompletableFuture khác. Tóm lại, bạn đã cấu hình hai loại timeout: một loại làm cho toàn bộ phép tính thất bại nếu nó mất hơn 3 giây, và một loại hết hạn sau 1 giây nhưng hoàn tất Future bằng một giá trị định trước thay vì gây ra thất bại.

Bạn đã gần hoàn thành ứng dụng best-price-finder của mình, nhưng vẫn còn thiếu một thành phần. Bạn muốn hiển thị cho người dùng các mức giá do các cửa hàng cung cấp ngay khi chúng sẵn sàng (như các website so sánh bảo hiểm xe hơi và vé máy bay thường làm), thay vì chờ tất cả các yêu cầu giá hoàn tất như bạn đã làm tới giờ. Trong mục tiếp theo, bạn sẽ khám phá cách đạt được mục tiêu này bằng cách phản ứng lại sự hoàn tất của một CompletableFuture thay vì gọi get hoặc join trên nó và qua đó bị block cho tới khi bản thân CompletableFuture hoàn tất.

## 16.5. Phản ứng lại sự hoàn tất của một CompletableFuture

Trong tất cả các ví dụ code bạn đã thấy trong chương này, bạn đã mô phỏng các phương thức thực hiện lời gọi từ xa bằng một độ trễ 1 giây trong phản hồi của chúng. Trong một kịch bản thực tế, các dịch vụ từ xa mà bạn cần liên hệ từ ứng dụng của mình nhiều khả năng có độ trễ không đoán trước được, gây ra bởi đủ thứ từ tải máy chủ tới độ trễ mạng, và có lẽ cả bởi việc máy chủ đánh giá giá trị kinh doanh của ứng dụng của bạn ra sao so với các ứng dụng trả nhiều tiền hơn cho mỗi truy vấn.

Vì những lý do đó, nhiều khả năng giá của các sản phẩm bạn muốn mua sẽ sẵn sàng ở một số cửa hàng sớm hơn nhiều so với các cửa hàng khác. Trong listing tiếp theo, bạn mô phỏng kịch bản này bằng cách đưa vào một độ trễ ngẫu nhiên từ 0,5 đến 2,5 giây, dùng phương thức randomDelay thay cho phương thức delay vốn chờ 1 giây.

**Listing 16.21. Một phương thức mô phỏng độ trễ ngẫu nhiên từ 0,5 đến 2,5 giây**

```java
private static final Random random = new Random();

public static void randomDelay() {
    int delay = 500 + random.nextInt(2000);
    try {
        Thread.sleep(delay);
    } catch (InterruptedException e) {
        throw new RuntimeException(e);
    }
}
```

Cho tới giờ, bạn đã cài đặt phương thức findPrices sao cho nó chỉ hiển thị các mức giá do các cửa hàng cung cấp khi tất cả chúng đều sẵn sàng. Bây giờ bạn muốn ứng dụng best-price-finder hiển thị giá cho một cửa hàng nhất định ngay khi nó sẵn sàng mà không phải chờ cửa hàng chậm nhất (cửa hàng này thậm chí có thể bị timeout). Làm sao bạn có thể đạt được cải tiến tiếp theo này?

### 16.5.1. Refactor ứng dụng best-price-finder

Điều đầu tiên cần tránh là chờ đợi việc tạo ra một List đã chứa sẵn tất cả các mức giá. Bạn cần làm việc trực tiếp với stream các CompletableFuture, trong đó mỗi CompletableFuture đang thực thi chuỗi các thao tác cần thiết cho một cửa hàng nhất định. Trong listing tiếp theo, bạn refactor phần đầu của phần cài đặt ở listing 16.16 thành một phương thức findPricesStream để tạo ra stream các CompletableFuture này.

**Listing 16.22. Refactor phương thức findPrices để trả về một stream các Future**

```java
public Stream<CompletableFuture<String>> findPricesStream(String product) {
    return shops.stream()
            .map(shop -> CompletableFuture.supplyAsync(
                    () -> shop.getPrice(product), executor))
            .map(future -> future.thenApply(Quote::parse))
            .map(future -> future.thenCompose(quote ->
                    CompletableFuture.supplyAsync(
                            () -> Discount.applyDiscount(quote), executor)));
}
```

Đến đây, bạn thêm một thao tác map thứ tư trên Stream do phương thức findPricesStream trả về, bên cạnh ba thao tác đã được thực hiện bên trong phương thức đó. Thao tác mới này đăng ký một hành động trên mỗi CompletableFuture; hành động này tiêu thụ giá trị của CompletableFuture ngay khi nó hoàn tất. CompletableFuture API của Java 8 cung cấp tính năng này thông qua phương thức thenAccept, phương thức này nhận làm đối số một Consumer của giá trị mà nó hoàn tất cùng. Trong trường hợp này, giá trị đó là String do các dịch vụ giảm giá trả về, chứa tên một cửa hàng cùng với giá sau giảm của sản phẩm được yêu cầu tại cửa hàng đó. Hành động duy nhất mà bạn muốn thực hiện để tiêu thụ giá trị này là in nó ra:

```java
findPricesStream("myPhone").map(f -> f.thenAccept(System.out::println));
```

Như bạn đã thấy với các phương thức thenCompose và thenCombine, phương thức thenAccept có một biến thể Async tên là thenAcceptAsync. Biến thể Async lập lịch việc thực thi Consumer được truyền cho nó trên một thread mới lấy từ thread pool thay vì thực hiện nó trực tiếp bằng chính thread đã hoàn tất CompletableFuture. Bởi vì bạn muốn tránh một lần chuyển ngữ cảnh không cần thiết, và bởi vì (quan trọng hơn) bạn muốn phản ứng lại sự hoàn tất của CompletableFuture càng sớm càng tốt thay vì chờ một thread mới trở nên sẵn sàng, bạn không dùng biến thể này ở đây.

Bởi vì phương thức thenAccept đã chỉ rõ cách tiêu thụ kết quả do CompletableFuture tạo ra khi nó sẵn sàng, nó trả về một `CompletableFuture<Void>`. Kết quả là, thao tác map trả về một `Stream<CompletableFuture<Void>>`. Bạn không thể làm được gì nhiều với một `CompletableFuture<Void>` ngoài việc chờ nó hoàn tất, nhưng đó chính xác là điều bạn cần. Bạn cũng muốn cho cửa hàng chậm nhất một cơ hội để cung cấp phản hồi và in ra mức giá nó trả về. Để làm điều đó, bạn có thể đưa tất cả các `CompletableFuture<Void>` của stream vào một mảng rồi chờ tất cả chúng hoàn tất, như trong listing tiếp theo.

**Listing 16.23. Phản ứng lại sự hoàn tất của CompletableFuture**

```java
CompletableFuture[] futures = findPricesStream("myPhone")
        .map(f -> f.thenAccept(System.out::println))
        .toArray(size -> new CompletableFuture[size]);
CompletableFuture.allOf(futures).join();
```

Phương thức factory allOf nhận đầu vào là một mảng các CompletableFuture và trả về một `CompletableFuture<Void>` chỉ hoàn tất khi tất cả các CompletableFuture được truyền vào đã hoàn tất. Việc gọi join trên CompletableFuture do phương thức allOf trả về cung cấp một cách dễ dàng để chờ tất cả các CompletableFuture trong stream ban đầu hoàn tất. Kỹ thuật này hữu ích cho ứng dụng best-price-finder vì nó có thể hiển thị một thông điệp chẳng hạn như `All shops returned results or timed out` để người dùng không phải tiếp tục băn khoăn liệu có thêm mức giá nào nữa sắp xuất hiện hay không.

Trong các ứng dụng khác, bạn có thể muốn chờ chỉ một trong các CompletableFuture của một mảng hoàn tất, chẳng hạn nếu bạn đang tham vấn hai máy chủ tỷ giá hối đoái và sẵn lòng lấy kết quả của máy chủ nào phản hồi trước. Trong trường hợp này, bạn có thể dùng phương thức factory anyOf. Về mặt chi tiết, phương thức này nhận đầu vào là một mảng các CompletableFuture và trả về một `CompletableFuture<Object>` hoàn tất với cùng giá trị của CompletableFuture hoàn tất đầu tiên.

### 16.5.2. Ghép tất cả lại với nhau

Như đã bàn ở đầu mục 16.5, bây giờ hãy giả sử rằng tất cả các phương thức mô phỏng lời gọi từ xa đều dùng phương thức randomDelay của listing 16.21, đưa vào một độ trễ ngẫu nhiên phân bố trong khoảng 0,5 đến 2,5 giây thay vì độ trễ 1 giây. Chạy đoạn code trong listing 16.23 với thay đổi này, bạn sẽ thấy rằng các mức giá do các cửa hàng cung cấp không xuất hiện cùng một lúc như trước đây, mà được in ra dần dần ngay khi giá sau giảm của một cửa hàng nhất định sẵn sàng. Để kết quả của thay đổi này rõ ràng hơn, đoạn code được sửa đổi một chút để báo cáo một dấu thời gian cho thấy thời gian cần thiết để tính từng mức giá:

```java
long start = System.nanoTime();
CompletableFuture[] futures = findPricesStream("myPhone27S")
        .map(f -> f.thenAccept(
                s -> System.out.println(s + " (done in " +
                        ((System.nanoTime() - start) / 1_000_000) + " msecs)")))
        .toArray(size -> new CompletableFuture[size]);
CompletableFuture.allOf(futures).join();
System.out.println("All shops have now responded in "
                   + ((System.nanoTime() - start) / 1_000_000) + " msecs");
```

Chạy đoạn code này tạo ra đầu ra tương tự như sau:

```text
BuyItAll price is 184.74 (done in 2005 msecs)
MyFavoriteShop price is 192.72 (done in 2157 msecs)
LetsSaveBig price is 135.58 (done in 3301 msecs)
ShopEasy price is 167.28 (done in 3869 msecs)
BestPrice price is 110.93 (done in 4188 msecs)
All shops have now responded in 4188 msecs
```

Bạn có thể thấy rằng, do tác động của các độ trễ ngẫu nhiên, mức giá đầu tiên giờ được in ra nhanh hơn hai lần so với mức giá cuối cùng!

## 16.6. Lộ trình phía trước

Chương 17 khám phá Flow API của Java 9, API này tổng quát hoá ý tưởng của CompletableFuture (một lần duy nhất, hoặc đang tính toán hoặc đã kết thúc với một giá trị) bằng cách cho phép các phép tính tạo ra một chuỗi các giá trị trước khi tuỳ chọn kết thúc.

## Tóm tắt

- Việc thực thi các thao tác kéo dài tương đối lâu bằng các task bất đồng bộ có thể tăng hiệu năng và độ đáp ứng của ứng dụng của bạn, đặc biệt nếu nó phụ thuộc vào một hoặc nhiều dịch vụ bên ngoài từ xa.
- Bạn nên cân nhắc cung cấp một API bất đồng bộ cho các client của mình. Bạn có thể dễ dàng cài đặt một API như vậy bằng cách dùng các tính năng của CompletableFuture.
- Một CompletableFuture cho phép bạn lan truyền và quản lý các lỗi được sinh ra bên trong một task bất đồng bộ.
- Bạn có thể tiêu thụ một API đồng bộ theo cách bất đồng bộ bằng cách bọc lời gọi của nó trong một CompletableFuture.
- Bạn có thể ghép nối (compose) hoặc kết hợp (combine) nhiều task bất đồng bộ, cả khi chúng độc lập với nhau lẫn khi kết quả của một trong số chúng được dùng làm đầu vào cho task khác.
- Bạn có thể đăng ký một callback trên một CompletableFuture để thực thi một đoạn code theo kiểu phản ứng khi Future hoàn tất và kết quả của nó trở nên sẵn sàng.
- Bạn có thể xác định khi nào tất cả các giá trị trong một danh sách các CompletableFuture đã hoàn tất, hoặc bạn có thể chỉ chờ cái đầu tiên hoàn tất.
- Java 9 bổ sung hỗ trợ cho timeout bất đồng bộ trên CompletableFuture thông qua các phương thức orTimeout và completeOnTimeout.
