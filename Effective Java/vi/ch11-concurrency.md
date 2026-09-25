# Chương 11. Concurrency (Lập trình đồng thời)

Thread (luồng) cho phép nhiều hoạt động diễn ra đồng thời. Lập trình đồng thời khó hơn lập trình đơn luồng, bởi vì có nhiều thứ có thể hỏng hơn, và các lỗi có thể rất khó tái hiện. Bạn không thể tránh được concurrency. Nó là bản chất cố hữu của nền tảng và là yêu cầu bắt buộc nếu bạn muốn đạt được hiệu năng tốt trên các bộ xử lý đa nhân, thứ giờ đây đã có mặt khắp nơi. Chương này chứa những lời khuyên giúp bạn viết các chương trình đồng thời rõ ràng, đúng đắn và được tài liệu hóa tốt.

## Item 78: Đồng bộ hóa truy cập vào dữ liệu khả biến được chia sẻ

Từ khóa `synchronized` bảo đảm rằng chỉ một thread duy nhất có thể thực thi một method hoặc một khối lệnh tại một thời điểm. Nhiều lập trình viên coi đồng bộ hóa (synchronization) chỉ đơn thuần là một phương tiện *loại trừ lẫn nhau* (mutual exclusion), để ngăn một thread nhìn thấy một object ở trạng thái không nhất quán trong khi nó đang bị một thread khác sửa đổi. Theo cách nhìn này, một object được tạo ra ở trạng thái nhất quán (**Item 17**) và được khóa bởi các method truy cập nó. Các method này quan sát trạng thái và có thể gây ra một *chuyển đổi trạng thái* (state transition), biến đổi object từ trạng thái nhất quán này sang trạng thái nhất quán khác. Việc sử dụng đồng bộ hóa đúng cách bảo đảm rằng không method nào sẽ quan sát thấy object ở trạng thái không nhất quán.

Cách nhìn này đúng, nhưng nó mới chỉ là một nửa câu chuyện. Nếu không có đồng bộ hóa, những thay đổi của một thread có thể không được các thread khác nhìn thấy. Đồng bộ hóa không chỉ ngăn các thread quan sát thấy object ở trạng thái không nhất quán, mà còn bảo đảm rằng mỗi thread khi đi vào một synchronized method hoặc khối synchronized sẽ nhìn thấy tác động của tất cả các sửa đổi trước đó được bảo vệ bởi cùng một lock.

Đặc tả ngôn ngữ bảo đảm rằng việc đọc hoặc ghi một biến là *nguyên tử* (atomic) trừ khi biến đó có kiểu `long` hoặc `double` [JLS, 17.4, 17.7]. Nói cách khác, việc đọc một biến không phải kiểu `long` hay `double` được bảo đảm sẽ trả về một giá trị đã được một thread nào đó lưu vào biến ấy, ngay cả khi nhiều thread sửa đổi biến đó đồng thời mà không có đồng bộ hóa.

Bạn có thể nghe người ta nói rằng để cải thiện hiệu năng, bạn nên bỏ đồng bộ hóa khi đọc hoặc ghi dữ liệu nguyên tử. Lời khuyên này sai một cách nguy hiểm. Mặc dù đặc tả ngôn ngữ bảo đảm rằng một thread sẽ không nhìn thấy một giá trị tùy ý khi đọc một field, nó không bảo đảm rằng một giá trị được ghi bởi thread này sẽ được thread khác nhìn thấy. **Đồng bộ hóa là bắt buộc để giao tiếp một cách tin cậy giữa các thread, cũng như để loại trừ lẫn nhau.** Điều này là do một phần của đặc tả ngôn ngữ được gọi là *mô hình bộ nhớ* (memory model), phần này quy định khi nào và bằng cách nào những thay đổi do một thread thực hiện trở nên hữu hình đối với các thread khác [JLS, 17.4; Goetz06, 16].

Hậu quả của việc không đồng bộ hóa truy cập vào dữ liệu khả biến được chia sẻ có thể rất nghiêm trọng ngay cả khi dữ liệu đó có thể đọc và ghi một cách nguyên tử. Hãy xét bài toán dừng một thread từ một thread khác. Thư viện cung cấp method `Thread.stop`, nhưng method này đã bị deprecated từ lâu vì bản chất của nó là *không an toàn*—việc sử dụng nó có thể dẫn đến hỏng dữ liệu. **Không sử dụng** `Thread.stop` **.** Một cách được khuyến nghị để dừng một thread từ một thread khác là để thread thứ nhất liên tục thăm dò (poll) một field `boolean` ban đầu là `false` nhưng có thể được thread thứ hai đặt thành `true` để báo hiệu rằng thread thứ nhất phải tự dừng lại. Vì việc đọc và ghi một field `boolean` là nguyên tử, một số lập trình viên bỏ qua đồng bộ hóa khi truy cập field này:

```java
// Broken! - How long would you expect this program to run?
public class StopThread {
    private static boolean stopRequested;

    public static void main(String[] args)
            throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

Bạn có thể kỳ vọng chương trình này chạy khoảng một giây, sau đó thread chính đặt `stopRequested` thành `true`, khiến vòng lặp của thread nền kết thúc. Tuy nhiên, trên máy của tôi, chương trình *không bao giờ* kết thúc: thread nền lặp mãi mãi!

Vấn đề là khi không có đồng bộ hóa, không có gì bảo đảm về thời điểm thread nền sẽ nhìn thấy sự thay đổi giá trị của `stopRequested` do thread chính thực hiện, thậm chí không bảo đảm rằng nó sẽ nhìn thấy. Khi không có đồng bộ hóa, máy ảo hoàn toàn được phép biến đổi đoạn code này:

```java
    while (!stopRequested)
        i++;
```

thành đoạn code này:

```java
if (!stopRequested)
    while (true)
        i++;
```

Tối ưu hóa này được gọi là *hoisting*, và đó chính xác là điều mà OpenJDK Server VM thực hiện. Kết quả là một *liveness failure* (lỗi sống): chương trình không thể tiến triển được. Một cách để khắc phục vấn đề là đồng bộ hóa việc truy cập field `stopRequested`. Chương trình này kết thúc sau khoảng một giây, đúng như mong đợi:

```java
// Properly synchronized cooperative thread termination
public class StopThread {
    private static boolean stopRequested;

    private static synchronized void requestStop() {
        stopRequested = true;
    }
    private static synchronized boolean stopRequested() {
        return stopRequested;
    }

    public static void main(String[] args)
            throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested())
                i++;
        });
        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        requestStop();
    }
}
```

Lưu ý rằng cả method ghi (`requestStop`) lẫn method đọc (`stopRequested`) đều được synchronized. Chỉ đồng bộ hóa method ghi thôi là *không* đủ! **Đồng bộ hóa không được bảo đảm hoạt động trừ khi cả thao tác đọc lẫn thao tác ghi đều được đồng bộ hóa.** Đôi khi một chương trình chỉ đồng bộ hóa các thao tác ghi (hoặc đọc) có thể *có vẻ* hoạt động trên một số máy, nhưng trong trường hợp này, vẻ bề ngoài là đánh lừa.

Các hành động của những synchronized method trong `StopThread` vốn đã nguyên tử ngay cả khi không có đồng bộ hóa. Nói cách khác, đồng bộ hóa trên các method này được dùng *chỉ* vì tác dụng giao tiếp của nó, chứ không phải để loại trừ lẫn nhau. Mặc dù chi phí đồng bộ hóa ở mỗi lần lặp của vòng lặp là nhỏ, vẫn có một giải pháp thay thế đúng đắn, ít dài dòng hơn và có hiệu năng nhiều khả năng tốt hơn. Việc khóa trong phiên bản thứ hai của `StopThread` có thể được bỏ đi nếu `stopRequested` được khai báo là volatile. Mặc dù modifier `volatile` không thực hiện loại trừ lẫn nhau, nó bảo đảm rằng bất kỳ thread nào đọc field này sẽ nhìn thấy giá trị được ghi gần nhất:

```java
// Cooperative thread termination with a volatile field
public class StopThread {
    private static volatile boolean stopRequested;
    public static void main(String[] args)
            throws InterruptedException {
        Thread backgroundThread = new Thread(() -> {
            int i = 0;
            while (!stopRequested)
                i++;
        });
        backgroundThread.start();

        TimeUnit.SECONDS.sleep(1);
        stopRequested = true;
    }
}
```

Bạn vẫn phải cẩn thận khi sử dụng `volatile`. Hãy xét method sau đây, vốn được dùng để sinh số sê-ri:

```java
// Broken - requires synchronization!
private static volatile int nextSerialNumber = 0;

public static int generateSerialNumber() {
    return nextSerialNumber++;
}
```

Ý định của method này là bảo đảm rằng mỗi lần gọi trả về một giá trị duy nhất (miễn là không có nhiều hơn 2^32 lần gọi). Trạng thái của method chỉ gồm một field duy nhất có thể truy cập nguyên tử, `nextSerialNumber`, và mọi giá trị có thể có của field này đều hợp lệ. Do đó, không cần đồng bộ hóa để bảo vệ các bất biến (invariant) của nó. Thế nhưng, method này vẫn không hoạt động đúng nếu không có đồng bộ hóa.

Vấn đề là toán tử tăng (`++`) không nguyên tử. Nó thực hiện *hai* thao tác trên field `nextSerialNumber`: trước tiên nó đọc giá trị, sau đó nó ghi lại một giá trị mới, bằng giá trị cũ cộng một. Nếu một thread thứ hai đọc field này trong khoảng thời gian giữa lúc một thread đọc giá trị cũ và lúc ghi lại giá trị mới, thread thứ hai sẽ nhìn thấy cùng giá trị với thread thứ nhất và trả về cùng một số sê-ri. Đây là một *safety failure* (lỗi an toàn): chương trình tính ra kết quả sai.

Một cách để sửa `generateSerialNumber` là thêm modifier `synchronized` vào khai báo của nó. Điều này bảo đảm rằng nhiều lần gọi sẽ không bị xen kẽ vào nhau và mỗi lần gọi method sẽ nhìn thấy tác động của tất cả các lần gọi trước đó. Một khi đã làm vậy, bạn có thể và nên bỏ modifier `volatile` khỏi `nextSerialNumber`. Để method này thực sự vững chắc, hãy dùng `long` thay cho `int`, hoặc ném exception nếu `nextSerialNumber` sắp bị tràn (wrap).

Tốt hơn nữa, hãy làm theo lời khuyên trong **Item 59** và dùng class `AtomicLong`, thuộc package `java.util.concurrent.atomic`. Package này cung cấp các thành phần cơ bản (primitive) cho lập trình thread-safe không dùng lock (lock-free) trên các biến đơn lẻ. Trong khi volatile chỉ cung cấp tác dụng giao tiếp của đồng bộ hóa, package này còn cung cấp cả tính nguyên tử. Đây chính xác là điều chúng ta muốn cho `generateSerialNumber`, và nhiều khả năng nó sẽ có hiệu năng cao hơn phiên bản synchronized:

```java
// Lock-free synchronization with java.util.concurrent.atomic
private static final AtomicLong nextSerialNum = new AtomicLong();

public static long generateSerialNumber() {
    return nextSerialNum.getAndIncrement();
}
```

Cách tốt nhất để tránh những vấn đề được thảo luận trong item này là không chia sẻ dữ liệu khả biến. Hoặc là chia sẻ dữ liệu immutable (**Item 17**), hoặc là không chia sẻ gì cả. Nói cách khác, **hãy giới hạn dữ liệu khả biến trong một thread duy nhất.** Nếu bạn áp dụng chính sách này, điều quan trọng là phải tài liệu hóa nó để chính sách được duy trì khi chương trình của bạn phát triển. Cũng rất quan trọng là phải hiểu sâu về các framework và thư viện mà bạn đang dùng, bởi vì chúng có thể đưa vào những thread mà bạn không hề hay biết.

Việc một thread sửa đổi một object dữ liệu trong một thời gian rồi sau đó chia sẻ nó với các thread khác là chấp nhận được, miễn là chỉ đồng bộ hóa hành động chia sẻ tham chiếu object. Các thread khác sau đó có thể đọc object mà không cần đồng bộ hóa thêm, miễn là object không bị sửa đổi nữa. Những object như vậy được gọi là *effectively immutable* (bất biến trên thực tế) [**Goetz06, 3.5.4**]. Việc chuyển tham chiếu của một object như vậy từ một thread sang các thread khác được gọi là *safe publication* (công bố an toàn) [**Goetz06, 3.5.3**]. Có nhiều cách để công bố một tham chiếu object một cách an toàn: bạn có thể lưu nó vào một static field như một phần của quá trình khởi tạo class; bạn có thể lưu nó vào một volatile field, một final field, hoặc một field được truy cập với cơ chế khóa thông thường; hoặc bạn có thể đặt nó vào một concurrent collection (**Item 81**).

Tóm lại, **khi nhiều thread chia sẻ dữ liệu khả biến, mỗi thread đọc hoặc ghi dữ liệu đó đều phải thực hiện đồng bộ hóa.** Khi không có đồng bộ hóa, không có gì bảo đảm rằng những thay đổi của một thread sẽ được thread khác nhìn thấy. Cái giá phải trả cho việc không đồng bộ hóa dữ liệu khả biến được chia sẻ là các liveness failure và safety failure. Những lỗi này nằm trong số những lỗi khó gỡ nhất. Chúng có thể xảy ra ngắt quãng và phụ thuộc vào thời điểm, và hành vi của chương trình có thể khác nhau hoàn toàn từ VM này sang VM khác. Nếu bạn chỉ cần giao tiếp giữa các thread mà không cần loại trừ lẫn nhau, modifier `volatile` là một hình thức đồng bộ hóa chấp nhận được, nhưng có thể khó sử dụng đúng cách.

## Item 79: Tránh đồng bộ hóa quá mức

Item 78 cảnh báo về sự nguy hiểm của việc đồng bộ hóa không đủ. Item này bàn về vấn đề ngược lại. Tùy tình huống, đồng bộ hóa quá mức có thể gây giảm hiệu năng, deadlock, hoặc thậm chí hành vi không xác định (nondeterministic).

**Để tránh liveness failure và safety failure, đừng bao giờ nhường quyền điều khiển cho client bên trong một synchronized method hoặc khối synchronized.** Nói cách khác, bên trong một vùng synchronized, đừng gọi một method được thiết kế để override, hoặc một method do client cung cấp dưới dạng function object (**Item 24**). Từ góc nhìn của class có vùng synchronized, những method như vậy là *xa lạ* (alien). Class không biết method đó làm gì và không có quyền kiểm soát nó. Tùy vào việc alien method làm gì, gọi nó từ một vùng synchronized có thể gây ra exception, deadlock, hoặc hỏng dữ liệu.

Để cụ thể hóa, hãy xét class sau đây, class này cài đặt một wrapper cho set *có thể quan sát* (observable). Nó cho phép client đăng ký nhận thông báo khi có phần tử được thêm vào set. Đây là mẫu thiết kế *Observer* [**Gamma95**]. Để ngắn gọn, class này không cung cấp thông báo khi phần tử bị xóa khỏi set, nhưng việc cung cấp chúng cũng khá đơn giản. Class này được cài đặt dựa trên `ForwardingSet` có thể tái sử dụng từ **Item 18** (trang 90):

```java
// Broken - invokes alien method from synchronized block!
public class ObservableSet<E> extends ForwardingSet<E> {
    public ObservableSet(Set<E> set) { super(set); }

    private final List<SetObserver<E>> observers
            = new ArrayList<>();

    public void addObserver(SetObserver<E> observer) {
        synchronized(observers) {
            observers.add(observer);
        }
    }

    public boolean removeObserver(SetObserver<E> observer) {
        synchronized(observers) {
            return observers.remove(observer);
        }
    }

    private void notifyElementAdded(E element) {
        synchronized(observers) {
            for (SetObserver<E> observer : observers)
                observer.added(this, element);
        }
    }

    @Override public boolean add(E element) {
        boolean added = super.add(element);
        if (added)
            notifyElementAdded(element);
        return added;
    }

    @Override public boolean addAll(Collection<? extends E> c) {
        boolean result = false;
        for (E element : c)
            result |= add(element);  // Calls notifyElementAdded
        return result;
    }
}
```

Các observer đăng ký nhận thông báo bằng cách gọi method `addObserver` và hủy đăng ký bằng cách gọi method `removeObserver`. Trong cả hai trường hợp, một instance của interface *callback* này được truyền vào method.

```java
@FunctionalInterface public interface SetObserver<E> {
    // Invoked when an element is added to the observable set
    void added(ObservableSet<E> set, E element);
}
```

Interface này về cấu trúc giống hệt `BiConsumer<ObservableSet<E>,E>`. Chúng tôi chọn định nghĩa một functional interface riêng vì tên interface và tên method làm cho code dễ đọc hơn, và vì interface này có thể phát triển để chứa nhiều callback. Dù vậy, cũng có thể đưa ra lập luận hợp lý cho việc dùng `BiConsumer` (**Item 44**).

Nhìn qua, `ObservableSet` có vẻ hoạt động tốt. Ví dụ, chương trình sau in ra các số từ `0` đến `99`:

```java
public static void main(String[] args) {
    ObservableSet<Integer> set =
            new ObservableSet<>(new HashSet<>());

    set.addObserver((s, e) -> System.out.println(e));

    for (int i = 0; i < 100; i++)
        set.add(i);
}
```

Bây giờ hãy thử một thứ cầu kỳ hơn một chút. Giả sử chúng ta thay lời gọi `addObserver` bằng một lời gọi truyền vào một observer in ra giá trị `Integer` vừa được thêm vào set và tự gỡ bỏ chính nó nếu giá trị là `23`:

```java
set.addObserver(new SetObserver<>() {
    public void added(ObservableSet<Integer> s, Integer e) {
        System.out.println(e);
        if (e == 23)
            s.removeObserver(this);
    }
});
```

Lưu ý rằng lời gọi này dùng một instance của anonymous class thay cho lambda được dùng ở lời gọi trước. Đó là vì function object cần truyền chính nó cho `s.removeObserver`, mà lambda không thể truy cập chính nó (**Item 42**).

Bạn có thể kỳ vọng chương trình in ra các số từ `0` đến `23`, sau đó observer sẽ hủy đăng ký và chương trình kết thúc trong im lặng. Thực tế, nó in ra các số này rồi ném `ConcurrentModificationException`. Vấn đề là `notifyElementAdded` đang trong quá trình duyệt (iterate) danh sách `observers` khi nó gọi method `added` của observer. Method `added` gọi method `removeObserver` của observable set, method này lại gọi tiếp method `observers.remove`. Bây giờ chúng ta gặp rắc rối. Chúng ta đang cố xóa một phần tử khỏi một list ngay giữa lúc đang duyệt nó, điều này là không hợp lệ. Vòng lặp trong method `notifyElementAdded` nằm trong một khối synchronized để ngăn sửa đổi đồng thời, nhưng nó không ngăn được chính thread đang duyệt gọi ngược lại vào observable set và sửa đổi danh sách `observers` của nó.

Bây giờ hãy thử một điều kỳ quặc: hãy viết một observer cố gắng hủy đăng ký, nhưng thay vì gọi `removeObserver` trực tiếp, nó nhờ một thread khác làm việc đó. Observer này dùng một *executor service* (**Item 80**):

```java
// Observer that uses a background thread needlessly
set.addObserver(new SetObserver<>() {
   public void added(ObservableSet<Integer> s, Integer e) {
      System.out.println(e);
      if (e == 23) {
         ExecutorService exec =
               Executors.newSingleThreadExecutor();
         try {
            exec.submit(() -> s.removeObserver(this)).get();
         } catch (ExecutionException | InterruptedException ex) {
            throw new AssertionError(ex);
         } finally {
            exec.shutdown();
         }
      }
   }
});
```

Nhân tiện, lưu ý rằng chương trình này bắt hai kiểu exception khác nhau trong cùng một mệnh đề catch. Tính năng này, thường được gọi không chính thức là *multi-catch*, đã được thêm vào Java 7. Nó có thể làm tăng đáng kể độ rõ ràng và giảm kích thước của những chương trình có hành xử giống nhau khi gặp nhiều kiểu exception.

Khi chạy chương trình này, chúng ta không nhận được exception; chúng ta nhận được deadlock. Thread nền gọi `s.removeObserver`, method này cố gắng khóa `observers`, nhưng nó không thể lấy được lock, vì thread chính đã đang giữ lock. Trong suốt thời gian đó, thread chính lại đang chờ thread nền hoàn thành việc gỡ bỏ observer, điều này giải thích cho deadlock.

Ví dụ này là giả tạo vì không có lý do gì để observer phải dùng một thread nền để tự hủy đăng ký, nhưng vấn đề thì có thật. Việc gọi alien method từ bên trong các vùng synchronized đã gây ra nhiều deadlock trong các hệ thống thực tế, chẳng hạn như các bộ công cụ GUI.

Trong cả hai ví dụ trước (exception và deadlock), chúng ta đã may mắn. Tài nguyên được bảo vệ bởi vùng synchronized (`observers`) đang ở trạng thái nhất quán khi alien method (`added`) được gọi. Giả sử bạn gọi một alien method từ một vùng synchronized trong khi bất biến được vùng synchronized đó bảo vệ đang tạm thời không hợp lệ. Vì các lock trong ngôn ngữ lập trình Java có tính *reentrant* (tái nhập), những lời gọi như vậy sẽ không gây deadlock. Như trong ví dụ đầu tiên, vốn dẫn đến một exception, thread gọi đã đang giữ lock, nên thread này sẽ thành công khi cố lấy lại lock, dù cho một thao tác khác về mặt khái niệm không liên quan đang được thực hiện trên dữ liệu mà lock bảo vệ. Hậu quả của một lỗi như vậy có thể là thảm họa. Về bản chất, lock đã không làm được nhiệm vụ của nó. Reentrant lock đơn giản hóa việc xây dựng các chương trình hướng đối tượng đa luồng, nhưng chúng có thể biến liveness failure thành safety failure.

May mắn thay, việc sửa loại vấn đề này thường không quá khó bằng cách chuyển các lời gọi alien method ra khỏi khối synchronized. Với method `notifyElementAdded`, việc này bao gồm lấy một "ảnh chụp" (snapshot) của danh sách `observers`, sau đó có thể duyệt ảnh chụp này một cách an toàn mà không cần lock. Với thay đổi này, cả hai ví dụ trước đều chạy mà không có exception hay deadlock:

```java
// Alien method moved outside of synchronized block - open calls
private void notifyElementAdded(E element) {
    List<SetObserver<E>> snapshot = null;
    synchronized(observers) {
        snapshot = new ArrayList<>(observers);
    }
    for (SetObserver<E> observer : snapshot)
        observer.added(this, element);
}
```

Thực ra, có một cách tốt hơn để chuyển các lời gọi alien method ra khỏi khối synchronized. Thư viện cung cấp một *concurrent collection* (**Item 81**) gọi là `CopyOnWriteArrayList`, được thiết kế riêng cho mục đích này. Cài đặt `List` này là một biến thể của `ArrayList` trong đó mọi thao tác sửa đổi đều được cài đặt bằng cách tạo một bản sao mới của toàn bộ mảng bên dưới. Vì mảng nội bộ không bao giờ bị sửa đổi, việc duyệt không cần khóa và rất nhanh. Với hầu hết các mục đích sử dụng, hiệu năng của `CopyOnWriteArrayList` sẽ tệ hại, nhưng nó hoàn hảo cho các danh sách observer, vốn hiếm khi bị sửa đổi nhưng thường xuyên được duyệt.

Các method `add` và `addAll` của `ObservableSet` không cần thay đổi nếu danh sách được sửa để dùng `CopyOnWriteArrayList`. Đây là phần còn lại của class. Hãy để ý rằng hoàn toàn không có đồng bộ hóa tường minh nào:

```java
// Thread-safe observable set with CopyOnWriteArrayList
private final List<SetObserver<E>> observers =
        new CopyOnWriteArrayList<>();

public void addObserver(SetObserver<E> observer) {
    observers.add(observer);
}

public boolean removeObserver(SetObserver<E> observer) {
    return observers.remove(observer);
}

private void notifyElementAdded(E element) {
    for (SetObserver<E> observer : observers)
        observer.added(this, element);
}
```

Một alien method được gọi bên ngoài vùng synchronized được gọi là *open call* (lời gọi mở) [**Goetz06, 10.1.4**]. Ngoài việc ngăn ngừa lỗi, open call có thể làm tăng đáng kể mức độ đồng thời. Một alien method có thể chạy trong một khoảng thời gian dài tùy ý. Nếu alien method được gọi từ một vùng synchronized, các thread khác sẽ bị từ chối truy cập vào tài nguyên được bảo vệ một cách không cần thiết.

**Theo nguyên tắc chung, bạn nên làm càng ít việc càng tốt bên trong các vùng synchronized.** Lấy lock, kiểm tra dữ liệu được chia sẻ, biến đổi nó nếu cần, rồi nhả lock. Nếu bạn phải thực hiện một hoạt động tốn thời gian, hãy tìm cách chuyển nó ra khỏi vùng synchronized mà không vi phạm các hướng dẫn trong **Item 78**.

Phần đầu của item này nói về tính đúng đắn. Bây giờ hãy xem xét ngắn gọn về hiệu năng. Mặc dù chi phí đồng bộ hóa đã giảm mạnh so với thời kỳ đầu của Java, việc không đồng bộ hóa quá mức giờ đây quan trọng hơn bao giờ hết. Trong thế giới đa nhân, chi phí thực sự của đồng bộ hóa quá mức không phải là thời gian CPU bỏ ra để lấy lock; mà là *sự tranh chấp* (contention): những cơ hội song song hóa bị mất đi và độ trễ phát sinh do phải bảo đảm mọi nhân đều có một góc nhìn nhất quán về bộ nhớ. Một chi phí ẩn khác của đồng bộ hóa quá mức là nó có thể hạn chế khả năng tối ưu hóa việc thực thi code của VM.

Nếu bạn đang viết một class khả biến, bạn có hai lựa chọn: bạn có thể bỏ hết đồng bộ hóa và để client tự đồng bộ hóa từ bên ngoài nếu muốn dùng đồng thời, hoặc bạn có thể đồng bộ hóa bên trong, làm cho class trở nên *thread-safe* (**Item 82**). Bạn chỉ nên chọn lựa chọn thứ hai nếu bạn có thể đạt được mức độ đồng thời cao hơn đáng kể bằng đồng bộ hóa nội bộ so với việc để client khóa toàn bộ object từ bên ngoài. Các collection trong `java.util` (ngoại trừ `Vector` và `Hashtable` đã lỗi thời) theo cách tiếp cận thứ nhất, trong khi các collection trong `java.util.concurrent` theo cách tiếp cận thứ hai (**Item 81**).

Trong thời kỳ đầu của Java, nhiều class đã vi phạm những hướng dẫn này. Ví dụ, các instance của `StringBuffer` hầu như luôn được dùng bởi một thread duy nhất, thế nhưng chúng lại thực hiện đồng bộ hóa nội bộ. Chính vì lý do này mà `StringBuffer` đã bị thay thế bởi `StringBuilder`, thứ chẳng qua là một `StringBuffer` không đồng bộ hóa. Tương tự, đó cũng là phần lớn lý do khiến bộ sinh số giả ngẫu nhiên thread-safe trong `java.util.Random` bị thay thế bởi cài đặt không đồng bộ hóa trong `java.util.concurrent.ThreadLocalRandom`. Khi còn nghi ngờ, *đừng* đồng bộ hóa class của bạn, nhưng hãy tài liệu hóa rằng nó không thread-safe.

Nếu bạn đồng bộ hóa class của mình từ bên trong, bạn có thể dùng nhiều kỹ thuật khác nhau để đạt được mức độ đồng thời cao, chẳng hạn như lock splitting (tách lock), lock striping (phân dải lock), và nonblocking concurrency control (kiểm soát đồng thời không chặn). Những kỹ thuật này nằm ngoài phạm vi của cuốn sách, nhưng chúng được thảo luận ở những nơi khác [**Goetz06**, **Herlihy12**].

Nếu một method sửa đổi một static field và có bất kỳ khả năng nào method đó được gọi từ nhiều thread, bạn *phải* đồng bộ hóa việc truy cập field đó từ bên trong (trừ khi class có thể chấp nhận hành vi không xác định). Một client đa luồng không thể thực hiện đồng bộ hóa bên ngoài đối với một method như vậy, vì các client không liên quan có thể gọi method đó mà không có đồng bộ hóa. Field này về bản chất là một biến toàn cục ngay cả khi nó là private, vì nó có thể được đọc và sửa đổi bởi các client không liên quan. Field `nextSerialNumber` được method `generateSerialNumber` trong **Item 78** sử dụng là một ví dụ điển hình cho tình huống này.

Tóm lại, để tránh deadlock và hỏng dữ liệu, đừng bao giờ gọi một alien method từ bên trong một vùng synchronized. Tổng quát hơn, hãy giữ lượng công việc bạn làm bên trong các vùng synchronized ở mức tối thiểu. Khi bạn thiết kế một class khả biến, hãy cân nhắc xem nó có nên tự đồng bộ hóa hay không. Trong kỷ nguyên đa nhân, việc không đồng bộ hóa quá mức quan trọng hơn bao giờ hết. Chỉ đồng bộ hóa class của bạn từ bên trong khi có lý do chính đáng để làm vậy, và hãy tài liệu hóa rõ ràng quyết định của bạn (**Item 82**).

## Item 80: Ưu tiên executor, task và stream hơn thread

Ấn bản đầu tiên của cuốn sách này có chứa code cho một *work queue* (hàng đợi công việc) đơn giản [**Bloch01**, **Item 49**]. Class này cho phép client đưa công việc vào hàng đợi để một thread nền xử lý bất đồng bộ. Khi không cần work queue nữa, client có thể gọi một method để yêu cầu thread nền tự kết thúc một cách êm thấm sau khi hoàn thành mọi công việc đã có trong hàng đợi. Cài đặt đó chẳng hơn gì một món đồ chơi, nhưng ngay cả vậy, nó vẫn cần đến cả một trang code tinh tế, mong manh, thuộc loại dễ gây ra safety failure và liveness failure nếu bạn không làm thật chuẩn xác. May mắn thay, giờ đây không còn lý do gì để viết loại code này nữa.

Đến khi ấn bản thứ hai của cuốn sách này ra đời, `java.util.concurrent` đã được thêm vào Java. Package này chứa một *Executor Framework*, là một cơ chế thực thi task linh hoạt dựa trên interface. Tạo một work queue tốt hơn về mọi mặt so với cái trong ấn bản đầu tiên của cuốn sách này chỉ cần đúng một dòng code:

```java
ExecutorService exec = Executors.newSingleThreadExecutor();
```

Đây là cách nộp một runnable để thực thi:

`exec.execute(runnable);`

Và đây là cách yêu cầu executor kết thúc êm thấm (nếu bạn không làm điều này, nhiều khả năng VM của bạn sẽ không thoát): `exec.shutdown();`

Bạn có thể làm *nhiều* việc hơn nữa với một executor service. Ví dụ, bạn có thể chờ một task cụ thể hoàn thành (bằng method `get`, như trong **Item 79**, trang 319), bạn có thể chờ bất kỳ hoặc tất cả các task trong một tập hợp hoàn thành (dùng method `invokeAny` hoặc `invokeAll`), bạn có thể chờ executor service kết thúc (dùng method `awaitTermination`), bạn có thể lấy kết quả của các task lần lượt từng cái một khi chúng hoàn thành (dùng `ExecutorCompletionService`), bạn có thể lập lịch cho các task chạy vào một thời điểm cụ thể hoặc chạy định kỳ (dùng `ScheduledThreadPoolExecutor`), v.v.

Nếu bạn muốn nhiều hơn một thread xử lý các yêu cầu từ hàng đợi, chỉ cần gọi một static factory khác để tạo ra một loại executor service khác gọi là *thread pool*. Bạn có thể tạo một thread pool với số lượng thread cố định hoặc thay đổi. Class `java.util.concurrent.Executors` chứa các static factory cung cấp hầu hết các executor bạn sẽ cần. Tuy nhiên, nếu bạn muốn điều gì đó khác thường, bạn có thể dùng trực tiếp class `ThreadPoolExecutor`. Class này cho phép bạn cấu hình gần như mọi khía cạnh trong hoạt động của một thread pool.

Việc chọn executor service cho một ứng dụng cụ thể có thể không dễ. Với một chương trình nhỏ, hoặc một server tải nhẹ, `Executors.newCachedThreadPool` thường là lựa chọn tốt vì nó không đòi hỏi cấu hình và nhìn chung "làm đúng việc cần làm". Nhưng cached thread pool không phải lựa chọn tốt cho một server production tải nặng! Trong một cached thread pool, các task được nộp không bị xếp hàng mà được giao ngay cho một thread để thực thi. Nếu không có thread nào rảnh, một thread mới sẽ được tạo. Nếu server tải nặng đến mức tất cả CPU của nó đều được sử dụng hết và có thêm task đến, thêm nhiều thread sẽ được tạo ra, điều này chỉ khiến mọi việc tệ hơn. Do đó, trong một server production tải nặng, tốt hơn nhiều là bạn dùng `Executors.newFixedThreadPool`, thứ cho bạn một pool với số thread cố định, hoặc dùng trực tiếp class `ThreadPoolExecutor` để có khả năng kiểm soát tối đa.

Không chỉ nên tránh tự viết work queue, mà nhìn chung bạn còn nên tránh làm việc trực tiếp với thread. Khi bạn làm việc trực tiếp với thread, một `Thread` vừa là đơn vị công việc vừa là cơ chế để thực thi công việc đó. Trong executor framework, đơn vị công việc và cơ chế thực thi là tách biệt. Sự trừu tượng then chốt là đơn vị công việc, tức là *task*. Có hai loại task: `Runnable` và người anh em gần gũi của nó, `Callable` (giống `Runnable`, ngoại trừ việc nó trả về một giá trị và có thể ném exception tùy ý). Cơ chế tổng quát để thực thi các task là *executor service*. Nếu bạn tư duy theo task và để một executor service thực thi chúng cho bạn, bạn có được sự linh hoạt trong việc chọn một chính sách thực thi phù hợp với nhu cầu và thay đổi chính sách đó khi nhu cầu thay đổi. Về bản chất, Executor Framework làm cho việc thực thi điều mà Collections Framework đã làm cho việc tập hợp dữ liệu.

Trong Java 7, Executor Framework được mở rộng để hỗ trợ fork-join task, được chạy bởi một loại executor service đặc biệt gọi là fork-join pool. Một fork-join task, được biểu diễn bởi một instance `ForkJoinTask`, có thể được chia thành các subtask nhỏ hơn, và các thread cấu thành một `ForkJoinPool` không chỉ xử lý những task này mà còn "đánh cắp" task của nhau để bảo đảm mọi thread luôn bận rộn, dẫn đến mức sử dụng CPU cao hơn, thông lượng cao hơn và độ trễ thấp hơn. Viết và tinh chỉnh fork-join task là việc khó. Parallel stream (**Item 48**) được xây dựng trên nền fork-join pool và cho phép bạn tận dụng lợi ích hiệu năng của chúng với rất ít công sức, với giả định rằng chúng phù hợp với bài toán đang xét.

Việc trình bày đầy đủ về Executor Framework nằm ngoài phạm vi của cuốn sách này, nhưng bạn đọc quan tâm có thể tham khảo *Java Concurrency in Practice* [**Goetz06**].

## Item 81: Ưu tiên các tiện ích concurrency hơn `wait` và `notify`

Ấn bản đầu tiên của cuốn sách này dành hẳn một item cho việc sử dụng đúng `wait` và `notify` [**Bloch01**, **Item 50**]. Lời khuyên trong đó vẫn còn giá trị và được tóm tắt ở cuối item này, nhưng lời khuyên ấy giờ đây kém quan trọng hơn nhiều so với trước. Đó là vì có ít lý do hơn hẳn để dùng `wait` và `notify`. Kể từ Java 5, nền tảng đã cung cấp các tiện ích concurrency cấp cao hơn, làm những việc mà trước đây bạn phải tự viết tay dựa trên `wait` và `notify`. **Do việc sử dụng đúng** `wait` **và** `notify` **là rất khó, bạn nên dùng các tiện ích concurrency cấp cao hơn thay thế.** Các tiện ích cấp cao trong `java.util.concurrent` thuộc ba nhóm: Executor Framework, đã được đề cập ngắn gọn trong **Item 80**; concurrent collection; và synchronizer. Concurrent collection và synchronizer được đề cập ngắn gọn trong item này.

Các concurrent collection là những cài đặt đồng thời hiệu năng cao của các interface collection chuẩn như `List`, `Queue` và `Map`. Để cung cấp mức độ đồng thời cao, những cài đặt này tự quản lý đồng bộ hóa bên trong (**Item 79**). Do đó, **không thể loại trừ hoạt động đồng thời khỏi một concurrent collection; khóa nó chỉ làm chương trình chậm đi.**

Vì bạn không thể loại trừ hoạt động đồng thời trên các concurrent collection, bạn cũng không thể kết hợp các lời gọi method trên chúng một cách nguyên tử. Do đó, các interface concurrent collection được trang bị các *thao tác sửa đổi phụ thuộc trạng thái* (state-dependent modify operation), kết hợp nhiều thao tác cơ bản thành một thao tác nguyên tử duy nhất. Những thao tác này tỏ ra hữu ích đến mức trên các concurrent collection, chúng đã được thêm vào các interface collection tương ứng trong Java 8, dưới dạng default method (**Item 21**).

Ví dụ, method `putIfAbsent(key, value)` của `Map` chèn một ánh xạ cho một key nếu chưa có, và trả về giá trị trước đó gắn với key, hoặc `null` nếu không có. Điều này giúp dễ dàng cài đặt các canonicalizing map (map chuẩn hóa) thread-safe. Method này mô phỏng hành vi của `String.intern`:

```java
// Concurrent canonicalizing map atop ConcurrentMap - not optimal
private static final ConcurrentMap<String, String> map =
        new ConcurrentHashMap<>();

public static String intern(String s) {
    String previousValue = map.putIfAbsent(s, s);
    return previousValue == null ? s : previousValue;
}
```

Thực ra, bạn còn có thể làm tốt hơn. `ConcurrentHashMap` được tối ưu cho các thao tác truy xuất, chẳng hạn như `get`. Do đó, đáng để gọi `get` trước và chỉ gọi `putIfAbsent` nếu `get` cho thấy điều đó là cần thiết:

```java
// Concurrent canonicalizing map atop ConcurrentMap - faster!
public static String intern(String s) {
    String result = map.get(s);
    if (result == null) {
        result = map.putIfAbsent(s, s);
        if (result == null)
            result = s;
    }
    return result;
}
```

Ngoài việc cung cấp mức độ đồng thời tuyệt vời, `ConcurrentHashMap` còn rất nhanh. Trên máy của tôi, method `intern` ở trên nhanh hơn `String.intern` hơn sáu lần (nhưng hãy nhớ rằng `String.intern` phải áp dụng chiến lược nào đó để không bị rò rỉ bộ nhớ trong một ứng dụng chạy lâu dài). Các concurrent collection khiến các synchronized collection phần lớn trở nên lỗi thời. Ví dụ, **hãy dùng** `ConcurrentHashMap` **thay vì** `Collections.synchronizedMap` **.** Chỉ cần thay các synchronized map bằng concurrent map cũng có thể tăng hiệu năng của các ứng dụng đồng thời một cách đáng kể.

Một số interface collection được mở rộng với các *thao tác chặn* (blocking operation), tức là chờ (hay *block*) cho đến khi có thể thực hiện thành công. Ví dụ, `BlockingQueue` mở rộng `Queue` và thêm vài method, trong đó có `take`, method này lấy ra và trả về phần tử đầu hàng đợi, chờ nếu hàng đợi rỗng. Điều này cho phép dùng blocking queue làm *work queue* (còn gọi là *producer-consumer queue*, hàng đợi nhà sản xuất–người tiêu thụ), nơi một hoặc nhiều *producer thread* đưa các mục công việc vào và một hoặc nhiều *consumer thread* lấy ra và xử lý các mục đó khi chúng sẵn sàng. Như bạn có thể đoán, hầu hết các cài đặt `ExecutorService`, bao gồm `ThreadPoolExecutor`, đều dùng một `BlockingQueue` (**Item 80**).

*Synchronizer* là những object cho phép các thread chờ nhau, giúp chúng phối hợp hoạt động. Các synchronizer được dùng phổ biến nhất là `CountDownLatch` và `Semaphore`. Ít phổ biến hơn là `CyclicBarrier` và `Exchanger`. Synchronizer mạnh mẽ nhất là `Phaser`.

Countdown latch là các rào chắn (barrier) dùng một lần, cho phép một hoặc nhiều thread chờ một hoặc nhiều thread khác làm việc gì đó. Constructor duy nhất của `CountDownLatch` nhận một `int` là số lần method `countDown` phải được gọi trên latch trước khi tất cả các thread đang chờ được phép tiếp tục.

Thật đáng ngạc nhiên là xây dựng những thứ hữu ích trên thành phần cơ bản đơn giản này lại dễ dàng đến vậy. Ví dụ, giả sử bạn muốn xây dựng một framework đơn giản để đo thời gian thực thi đồng thời của một hành động. Framework này gồm một method duy nhất nhận vào một executor để thực thi hành động, một mức độ đồng thời (concurrency level) biểu thị số hành động được thực thi đồng thời, và một runnable biểu thị hành động. Tất cả các worker thread tự chuẩn bị sẵn sàng để chạy hành động trước khi timer thread bấm giờ. Khi worker thread cuối cùng đã sẵn sàng chạy hành động, timer thread "nổ súng xuất phát", cho phép các worker thread thực hiện hành động. Ngay khi worker thread cuối cùng hoàn thành hành động, timer thread dừng đồng hồ. Cài đặt logic này trực tiếp trên `wait` và `notify` sẽ rất rối rắm, nói nhẹ nhất là vậy, nhưng trên `CountDownLatch` thì lại đơn giản đến bất ngờ:

```java
// Simple framework for timing concurrent execution
public static long time(Executor executor, int concurrency,
            Runnable action) throws InterruptedException {
    CountDownLatch ready = new CountDownLatch(concurrency);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done  = new CountDownLatch(concurrency);

    for (int i = 0; i < concurrency; i++) {
        executor.execute(() -> {
            ready.countDown(); // Tell timer we're ready
            try {
                start.await(); // Wait till peers are ready
                action.run();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                done.countDown();  // Tell timer we're done
            }
        });
    }
    ready.await();     // Wait for all workers to be ready
    long startNanos = System.nanoTime();
    start.countDown(); // And they're off!
    done.await();      // Wait for all workers to finish
    return System.nanoTime() - startNanos;
}
```

Lưu ý rằng method này dùng ba countdown latch. Latch thứ nhất, `ready`, được các worker thread dùng để báo cho timer thread biết khi nào chúng sẵn sàng. Sau đó các worker thread chờ trên latch thứ hai, là `start`. Khi worker thread cuối cùng gọi `ready.countDown`, timer thread ghi lại thời điểm bắt đầu và gọi `start.countDown`, cho phép tất cả các worker thread tiếp tục. Rồi timer thread chờ trên latch thứ ba, `done`, cho đến khi worker thread cuối cùng chạy xong hành động và gọi `done.countDown`. Ngay khi điều này xảy ra, timer thread thức dậy và ghi lại thời điểm kết thúc.

Có vài chi tiết nữa đáng lưu ý. Executor được truyền vào method `time` phải cho phép tạo ít nhất số thread bằng mức độ đồng thời đã cho, nếu không bài kiểm tra sẽ không bao giờ hoàn thành. Điều này được gọi là *thread starvation deadlock* (deadlock do thiếu thread) [Goetz06, 8.1.1]. Nếu một worker thread bắt được `InterruptedException`, nó tái khẳng định trạng thái interrupt bằng idiom `Thread.currentThread().interrupt()` và thoát khỏi method `run` của nó. Điều này cho phép executor xử lý interrupt theo cách nó thấy phù hợp. Lưu ý rằng `System.nanoTime` được dùng để đo thời gian hoạt động. **Để đo khoảng thời gian, hãy luôn dùng** `System.nanoTime` **thay vì** `System.currentTimeMillis` **.** `System.nanoTime` vừa chính xác hơn vừa có độ phân giải cao hơn, và không bị ảnh hưởng bởi những điều chỉnh đối với đồng hồ thời gian thực của hệ thống. Cuối cùng, lưu ý rằng code trong ví dụ này sẽ không cho kết quả đo chính xác trừ khi `action` làm một lượng công việc kha khá, chẳng hạn một giây trở lên. Microbenchmarking chính xác nổi tiếng là khó và tốt nhất nên thực hiện với sự trợ giúp của một framework chuyên dụng như jmh [**JMH**].

Item này chỉ mới chạm đến bề mặt của những gì bạn có thể làm với các tiện ích concurrency. Ví dụ, ba countdown latch trong ví dụ trước có thể được thay bằng một instance `CyclicBarrier` hoặc `Phaser` duy nhất. Code thu được sẽ ngắn gọn hơn một chút nhưng có lẽ khó hiểu hơn.

Mặc dù bạn nên luôn ưu tiên các tiện ích concurrency hơn `wait` và `notify`, bạn có thể phải bảo trì code cũ (legacy) có dùng `wait` và `notify`. Method `wait` được dùng để khiến một thread chờ một điều kiện nào đó. Nó phải được gọi bên trong một vùng synchronized khóa trên chính object mà nó được gọi. Đây là idiom chuẩn để dùng method `wait`:

```java
// The standard idiom for using the wait method
synchronized (obj) {
    while (<condition does not hold>)
        obj.wait(); // (Releases lock, and reacquires on wakeup)
    ... // Perform action appropriate to condition
}
```

**Hãy luôn dùng idiom vòng lặp wait để gọi method** `wait` **; đừng bao giờ gọi nó bên ngoài một vòng lặp.** Vòng lặp có tác dụng kiểm tra điều kiện trước và sau khi chờ.

Kiểm tra điều kiện trước khi chờ và bỏ qua việc chờ nếu điều kiện đã thỏa mãn là cần thiết để bảo đảm tính sống (liveness). Nếu điều kiện đã thỏa mãn và method `notify` (hoặc `notifyAll`) đã được gọi trước khi một thread bắt đầu chờ, không có gì bảo đảm rằng thread đó sẽ *bao giờ* thức dậy khỏi trạng thái chờ.

Kiểm tra điều kiện sau khi chờ và chờ tiếp nếu điều kiện không thỏa mãn là cần thiết để bảo đảm tính an toàn (safety). Nếu thread tiếp tục thực hiện hành động khi điều kiện không thỏa mãn, nó có thể phá hủy bất biến được lock bảo vệ. Có một số lý do khiến một thread có thể thức dậy khi điều kiện không thỏa mãn:

- Một thread khác có thể đã lấy được lock và thay đổi trạng thái được bảo vệ trong khoảng thời gian giữa lúc một thread gọi `notify` và lúc thread đang chờ thức dậy.

- Một thread khác có thể đã gọi `notify` một cách vô tình hoặc ác ý khi điều kiện không thỏa mãn. Các class tự đặt mình vào nguy cơ bị phá hoại kiểu này khi chờ trên những object có thể truy cập công khai. Bất kỳ lời gọi `wait` nào trong một synchronized method của một object có thể truy cập công khai đều dễ gặp vấn đề này.

- Thread thông báo có thể quá "hào phóng" trong việc đánh thức các thread đang chờ. Ví dụ, thread thông báo có thể gọi `notifyAll` ngay cả khi chỉ một số thread đang chờ có điều kiện được thỏa mãn.

- Thread đang chờ có thể (hiếm khi) thức dậy mà không có notify nào. Điều này được gọi là *spurious wakeup* (đánh thức giả) [**POSIX, 11.4.3.6.1**; **Java9-api**].

Một vấn đề liên quan là nên dùng `notify` hay `notifyAll` để đánh thức các thread đang chờ. (Nhắc lại rằng `notify` đánh thức một thread đang chờ duy nhất, giả sử có thread như vậy, còn `notifyAll` đánh thức tất cả các thread đang chờ.) Đôi khi người ta nói rằng bạn nên *luôn luôn* dùng `notifyAll`. Đây là lời khuyên hợp lý và thận trọng. Nó sẽ luôn cho kết quả đúng vì nó bảo đảm rằng bạn sẽ đánh thức những thread cần được đánh thức. Bạn có thể đánh thức cả một số thread khác nữa, nhưng điều này không ảnh hưởng đến tính đúng đắn của chương trình. Những thread này sẽ kiểm tra điều kiện mà chúng đang chờ, và khi thấy điều kiện sai, sẽ tiếp tục chờ.

Để tối ưu, bạn có thể chọn gọi `notify` thay vì `notifyAll` nếu tất cả các thread có thể nằm trong wait-set đều đang chờ cùng một điều kiện và tại mỗi thời điểm chỉ một thread có thể hưởng lợi khi điều kiện trở thành đúng.

Ngay cả khi các tiền điều kiện này được thỏa mãn, vẫn có thể có lý do để dùng `notifyAll` thay cho `notify`. Cũng như việc đặt lời gọi `wait` trong một vòng lặp bảo vệ khỏi các thông báo vô tình hay ác ý trên một object có thể truy cập công khai, việc dùng `notifyAll` thay cho `notify` bảo vệ khỏi các lời gọi wait vô tình hay ác ý từ một thread không liên quan. Nếu không, những lời gọi wait như vậy có thể "nuốt mất" một thông báo quan trọng, khiến người nhận dự kiến của nó phải chờ vô thời hạn.

Tóm lại, dùng trực tiếp `wait` và `notify` giống như lập trình bằng "hợp ngữ của concurrency", so với ngôn ngữ cấp cao mà `java.util.concurrent` cung cấp. **Hiếm khi, nếu không muốn nói là không bao giờ, có lý do để dùng** `wait` **và** `notify` **trong code mới.** Nếu bạn bảo trì code có dùng `wait` và `notify`, hãy bảo đảm rằng nó luôn gọi `wait` từ bên trong một vòng lặp `while` theo idiom chuẩn. Method `notifyAll` nói chung nên được ưu tiên hơn `notify`. Nếu dùng `notify`, phải hết sức cẩn thận để bảo đảm tính sống.

## Item 82: Tài liệu hóa tính thread-safe

Cách một class hành xử khi các method của nó được dùng đồng thời là một phần quan trọng trong hợp đồng (contract) giữa nó và các client. Nếu bạn không tài liệu hóa khía cạnh này trong hành vi của class, người dùng sẽ buộc phải đưa ra các giả định. Nếu những giả định này sai, chương trình thu được có thể thực hiện đồng bộ hóa không đủ (**Item 78**) hoặc đồng bộ hóa quá mức (**Item 79**). Trong cả hai trường hợp, có thể dẫn đến những lỗi nghiêm trọng.

Bạn có thể nghe người ta nói rằng bạn có thể biết một method có thread-safe hay không bằng cách tìm modifier `synchronized` trong tài liệu của nó. Điều này sai ở nhiều điểm. Trong hoạt động bình thường, Javadoc không đưa modifier `synchronized` vào kết quả của nó, và có lý do chính đáng cho việc đó. **Sự hiện diện của modifier** `synchronized` **trong khai báo method là một chi tiết cài đặt, không phải một phần của API.** Nó không chỉ ra một cách đáng tin cậy rằng method đó thread-safe.

Hơn nữa, tuyên bố rằng sự hiện diện của modifier `synchronized` là đủ để tài liệu hóa tính thread-safe thể hiện một ngộ nhận rằng thread-safe là một thuộc tính "có hoặc không". Thực tế, có nhiều cấp độ thread-safe. **Để cho phép sử dụng đồng thời một cách an toàn, một class phải tài liệu hóa rõ ràng cấp độ thread-safe mà nó hỗ trợ.** Danh sách sau đây tóm tắt các cấp độ thread-safe. Nó không đầy đủ nhưng bao quát các trường hợp phổ biến:

- **Immutable** (bất biến)—Các instance của class này trông như hằng số. Không cần đồng bộ hóa bên ngoài. Ví dụ gồm `String`, `Long` và `BigInteger` (**Item 17**).

- **Unconditionally thread-safe** (thread-safe vô điều kiện)—Các instance của class này là khả biến, nhưng class có đủ đồng bộ hóa nội bộ để các instance của nó có thể được dùng đồng thời mà không cần bất kỳ đồng bộ hóa bên ngoài nào. Ví dụ gồm `AtomicLong` và `ConcurrentHashMap`.

- **Conditionally thread-safe** (thread-safe có điều kiện)—Giống như thread-safe vô điều kiện, ngoại trừ việc một số method cần đồng bộ hóa bên ngoài để sử dụng đồng thời an toàn. Ví dụ gồm các collection được trả về bởi các wrapper `Collections.synchronized`, mà iterator của chúng cần đồng bộ hóa bên ngoài.

- **Not thread-safe** (không thread-safe)—Các instance của class này là khả biến. Để dùng chúng đồng thời, client phải bao mỗi lời gọi method (hoặc chuỗi lời gọi) bằng đồng bộ hóa bên ngoài do client tự chọn. Ví dụ gồm các cài đặt collection đa dụng, như `ArrayList` và `HashMap`.

- **Thread-hostile** (thù địch với thread)—Class này không an toàn khi dùng đồng thời ngay cả khi mọi lời gọi method đều được bao bằng đồng bộ hóa bên ngoài. Tính thù địch với thread thường bắt nguồn từ việc sửa đổi dữ liệu static mà không đồng bộ hóa. Không ai cố ý viết một class thread-hostile; những class như vậy thường là kết quả của việc không cân nhắc đến concurrency. Khi một class hay method bị phát hiện là thread-hostile, nó thường được sửa hoặc bị deprecated. Method `generateSerialNumber` trong **Item 78** sẽ là thread-hostile nếu không có đồng bộ hóa nội bộ, như đã thảo luận ở trang 322.

Các phân loại này (ngoại trừ thread-hostile) tương ứng gần đúng với các *thread safety annotation* trong *Java Concurrency in Practice*, đó là `Immutable`, `ThreadSafe` và `NotThreadSafe` [Goetz06, Appendix A]. Hai phân loại thread-safe vô điều kiện và có điều kiện trong bảng phân loại trên đều được gộp dưới annotation `ThreadSafe`.

Tài liệu hóa một class thread-safe có điều kiện đòi hỏi sự cẩn trọng. Bạn phải chỉ rõ những chuỗi lời gọi nào cần đồng bộ hóa bên ngoài, và lock nào (hoặc trong trường hợp hiếm, những lock nào) phải được lấy để thực thi các chuỗi đó. Thông thường đó là lock trên chính instance, nhưng có ngoại lệ. Ví dụ, tài liệu của `Collections.synchronizedMap` nói thế này:

Người dùng bắt buộc phải tự đồng bộ hóa trên map được trả về khi duyệt bất kỳ collection view nào của nó:

```java
Map<K, V> m = Collections.synchronizedMap(new HashMap<>());
Set<K> s = m.keySet();  // Needn't be in synchronized block
    ...
synchronized(m) {  // Synchronizing on m, not s!
    for (K key : s)
        key.f();
}
```

Không tuân theo lời khuyên này có thể dẫn đến hành vi không xác định.

Mô tả về tính thread-safe của một class thường thuộc về doc comment của class, nhưng những method có thuộc tính thread-safe đặc biệt nên mô tả các thuộc tính đó trong doc comment của riêng chúng. Không cần tài liệu hóa tính bất biến của các kiểu enum. Trừ khi điều đó là hiển nhiên từ kiểu trả về, các static factory phải tài liệu hóa tính thread-safe của object được trả về, như `Collections.synchronizedMap` (ở trên) đã minh họa.

Khi một class cam kết sử dụng một lock có thể truy cập công khai, nó cho phép client thực thi một chuỗi lời gọi method một cách nguyên tử, nhưng sự linh hoạt này phải trả giá. Nó không tương thích với cơ chế kiểm soát đồng thời nội bộ hiệu năng cao, thuộc loại được dùng bởi các concurrent collection như `ConcurrentHashMap`. Ngoài ra, một client có thể thực hiện tấn công từ chối dịch vụ (denial-of-service) bằng cách giữ lock có thể truy cập công khai trong một thời gian dài. Điều này có thể xảy ra do vô tình hoặc cố ý.

Để ngăn cuộc tấn công từ chối dịch vụ này, bạn có thể dùng một *private lock object* (object lock riêng) thay vì dùng các synchronized method (vốn ngụ ý một lock có thể truy cập công khai):

```java
// Private lock object idiom - thwarts denial-of-service attack
private final Object lock = new Object();

public void foo() {
    synchronized(lock) {
        ...
    }
}
```

Vì private lock object không thể truy cập được từ bên ngoài class, client không thể can thiệp vào việc đồng bộ hóa của object. Thực chất, chúng ta đang áp dụng lời khuyên của **Item 15** bằng cách đóng gói (encapsulate) lock object bên trong object mà nó đồng bộ hóa.

Lưu ý rằng field `lock` được khai báo `final`. Điều này ngăn bạn vô tình thay đổi nội dung của nó, việc có thể dẫn đến truy cập không đồng bộ hóa với hậu quả thảm khốc (**Item 78**). Chúng ta đang áp dụng lời khuyên của **Item 17**, bằng cách giảm thiểu tính khả biến của field `lock`. **Các field lock phải luôn được khai báo** `final` **.** Điều này đúng dù bạn dùng một monitor lock thông thường (như ở trên) hay một lock từ package `java.util.concurrent.locks`.

Idiom private lock object chỉ có thể dùng trên các class thread-safe *vô điều kiện*. Các class thread-safe có điều kiện không thể dùng idiom này vì chúng phải tài liệu hóa lock nào mà client cần lấy khi thực hiện những chuỗi lời gọi method nhất định.

Idiom private lock object đặc biệt phù hợp với các class được thiết kế để kế thừa (**Item 19**). Nếu một class như vậy dùng các instance của nó để khóa, một subclass có thể dễ dàng và vô tình can thiệp vào hoạt động của class cơ sở, hoặc ngược lại. Bằng cách dùng cùng một lock cho những mục đích khác nhau, subclass và class cơ sở có thể rơi vào cảnh "giẫm lên chân nhau". Đây không chỉ là vấn đề lý thuyết; nó đã xảy ra với class `Thread` [**Bloch05**, Puzzle 77].

Tóm lại, mọi class nên tài liệu hóa rõ ràng các thuộc tính thread-safe của nó bằng một mô tả văn xuôi được diễn đạt cẩn thận hoặc một thread safety annotation. Modifier `synchronized` không đóng vai trò gì trong việc tài liệu hóa này. Các class thread-safe có điều kiện phải tài liệu hóa những chuỗi lời gọi method nào cần đồng bộ hóa bên ngoài và lock nào cần lấy khi thực thi các chuỗi đó. Nếu bạn viết một class thread-safe vô điều kiện, hãy cân nhắc dùng private lock object thay cho các synchronized method. Điều này bảo vệ bạn khỏi sự can thiệp vào đồng bộ hóa từ client và subclass, đồng thời cho bạn nhiều linh hoạt hơn để áp dụng một cách tiếp cận tinh vi hơn đối với kiểm soát đồng thời trong một bản phát hành sau.

## Item 83: Sử dụng lazy initialization một cách thận trọng

*Lazy initialization* (khởi tạo lười) là hành động trì hoãn việc khởi tạo một field cho đến khi giá trị của nó được cần đến. Nếu giá trị không bao giờ được cần đến, field không bao giờ được khởi tạo. Kỹ thuật này áp dụng được cho cả static field lẫn instance field. Mặc dù lazy initialization chủ yếu là một tối ưu hóa, nó cũng có thể được dùng để phá vỡ các vòng phụ thuộc có hại trong quá trình khởi tạo class và instance [**Bloch05**, Puzzle 51].

Như với hầu hết các tối ưu hóa, lời khuyên tốt nhất cho lazy initialization là "đừng làm trừ khi bạn cần" (**Item 67**). Lazy initialization là con dao hai lưỡi. Nó giảm chi phí khởi tạo một class hoặc tạo một instance, đổi lại làm tăng chi phí truy cập field được khởi tạo lười. Tùy vào tỷ lệ những field này rốt cuộc cần được khởi tạo, chi phí khởi tạo chúng tốn kém ra sao, và mỗi field được truy cập thường xuyên thế nào sau khi khởi tạo, lazy initialization (giống như nhiều "tối ưu hóa" khác) thực ra có thể làm giảm hiệu năng.

Dù vậy, lazy initialization vẫn có chỗ dùng. Nếu một field chỉ được truy cập trên một phần nhỏ các instance của class *và* việc khởi tạo field đó tốn kém, thì lazy initialization có thể đáng giá. Cách duy nhất để biết chắc là đo hiệu năng của class khi có và khi không có lazy initialization.

Khi có nhiều thread, lazy initialization trở nên phức tạp. Nếu hai hay nhiều thread chia sẻ một field được khởi tạo lười, điều tối quan trọng là phải dùng một hình thức đồng bộ hóa nào đó, nếu không có thể dẫn đến những lỗi nghiêm trọng (**Item 78**). Tất cả các kỹ thuật khởi tạo được thảo luận trong item này đều thread-safe.

**Trong hầu hết các trường hợp, khởi tạo thông thường tốt hơn lazy initialization.** Đây là một khai báo điển hình cho một instance field được khởi tạo thông thường. Lưu ý việc dùng modifier `final` (**Item 17**):

```java
// Normal initialization of an instance field
private final FieldType field = computeFieldValue();
```

**Nếu bạn dùng lazy initialization để phá vỡ một vòng phụ thuộc khởi tạo, hãy dùng synchronized accessor** vì đó là giải pháp đơn giản và rõ ràng nhất:

```java
// Lazy initialization of instance field - synchronized accessor
private FieldType field;

private synchronized FieldType getField() {
    if (field == null)
        field = computeFieldValue();
    return field;
}
```

Cả hai idiom này (*khởi tạo thông thường* và *lazy initialization với synchronized accessor*) đều không thay đổi khi áp dụng cho static field, ngoại trừ việc bạn thêm modifier `static` vào khai báo field và accessor.

**Nếu bạn cần dùng lazy initialization vì hiệu năng trên một static field, hãy dùng idiom lazy initialization holder class.** Idiom này khai thác sự bảo đảm rằng một class sẽ không được khởi tạo cho đến khi nó được sử dụng [JLS, 12.4.1]. Nó trông như thế này:

```java
// Lazy initialization holder class idiom for static fields
private static class FieldHolder {
    static final FieldType field = computeFieldValue();
}

private static FieldType getField() { return FieldHolder.field; }
```

Khi `getField` được gọi lần đầu tiên, nó đọc `FieldHolder.field` lần đầu tiên, gây ra việc khởi tạo class `FieldHolder`. Vẻ đẹp của idiom này là method `getField` không được synchronized và chỉ thực hiện một truy cập field, nên lazy initialization gần như không thêm gì vào chi phí truy cập. Một VM điển hình sẽ chỉ đồng bộ hóa truy cập field để khởi tạo class. Một khi class đã được khởi tạo, VM vá lại code để các truy cập tiếp theo vào field không cần bất kỳ kiểm tra hay đồng bộ hóa nào.

**Nếu bạn cần dùng lazy initialization vì hiệu năng trên một instance field, hãy dùng idiom double-check.** Idiom này tránh chi phí khóa khi truy cập field sau khi đã khởi tạo (**Item 79**). Ý tưởng đằng sau idiom này là kiểm tra giá trị của field hai lần (do đó có tên *double-check*): một lần không khóa, và sau đó, nếu field có vẻ chưa được khởi tạo, một lần thứ hai có khóa. Chỉ khi lần kiểm tra thứ hai cho thấy field chưa được khởi tạo thì lời gọi mới khởi tạo field. Vì không có khóa một khi field đã được khởi tạo, điều *tối quan trọng* là field phải được khai báo `volatile` (**Item 78**). Đây là idiom:

```java
// Double-check idiom for lazy initialization of instance fields
private volatile FieldType field;

private FieldType getField() {
   FieldType result = field;
   if (result != null)    // First check (no locking)
       return result;

   synchronized(this) {
       if (field == null) // Second check (with locking)
           field = computeFieldValue();
       return field;
   }
}
```

Code này có thể trông hơi rối. Đặc biệt, sự cần thiết của biến cục bộ (`result`) có thể không rõ ràng. Việc biến này làm là bảo đảm rằng `field` chỉ được đọc một lần trong trường hợp phổ biến khi nó đã được khởi tạo. Mặc dù không hoàn toàn bắt buộc, điều này có thể cải thiện hiệu năng và thanh lịch hơn theo các tiêu chuẩn áp dụng cho lập trình đồng thời cấp thấp. Trên máy của tôi, method ở trên nhanh hơn khoảng 1,4 lần so với phiên bản hiển nhiên không có biến cục bộ.

Mặc dù bạn cũng có thể áp dụng idiom double-check cho static field, không có lý do gì để làm vậy: idiom lazy initialization holder class là lựa chọn tốt hơn.

Có hai biến thể của idiom double-check đáng lưu ý. Đôi khi, bạn có thể cần khởi tạo lười một instance field có thể chấp nhận việc bị khởi tạo lặp lại. Nếu bạn rơi vào tình huống này, bạn có thể dùng một biến thể của idiom double-check bỏ đi lần kiểm tra thứ hai. Không có gì ngạc nhiên, nó được gọi là *idiom single-check*. Nó trông như thế này. Lưu ý rằng `field` vẫn được khai báo `volatile`:

```java
// Single-check idiom - can cause repeated initialization!
private volatile FieldType field;

private FieldType getField() {
    FieldType result = field;
    if (result == null)
        field = result = computeFieldValue();
    return result;
}
```

Tất cả các kỹ thuật khởi tạo được thảo luận trong item này đều áp dụng cho các field kiểu nguyên thủy (primitive) cũng như các field tham chiếu object. Khi idiom double-check hoặc single-check được áp dụng cho một field số kiểu nguyên thủy, giá trị của field được so sánh với `0` (giá trị mặc định của các biến số kiểu nguyên thủy) thay vì `null`.

Nếu bạn không quan tâm việc *mọi* thread có tính lại giá trị của field hay không, và kiểu của field là một kiểu nguyên thủy khác `long` hay `double`, thì bạn có thể chọn bỏ modifier `volatile` khỏi khai báo field trong idiom single-check. Biến thể này được gọi là *idiom racy single-check.* Nó tăng tốc truy cập field trên một số kiến trúc, đổi lại có thêm các lần khởi tạo (tối đa một lần cho mỗi thread truy cập field). Đây chắc chắn là một kỹ thuật lạ thường, không dành cho việc dùng hằng ngày.

Tóm lại, bạn nên khởi tạo hầu hết các field theo cách thông thường, không phải lười. Nếu bạn phải khởi tạo lười một field để đạt mục tiêu hiệu năng hoặc để phá vỡ một vòng phụ thuộc khởi tạo có hại, thì hãy dùng kỹ thuật lazy initialization phù hợp. Với instance field, đó là idiom double-check; với static field, là idiom lazy initialization holder class. Với những instance field có thể chấp nhận khởi tạo lặp lại, bạn cũng có thể cân nhắc idiom single-check.

## Item 84: Đừng phụ thuộc vào bộ lập lịch thread

Khi có nhiều thread ở trạng thái runnable (sẵn sàng chạy), bộ lập lịch thread (thread scheduler) quyết định thread nào được chạy và chạy trong bao lâu. Bất kỳ hệ điều hành hợp lý nào cũng sẽ cố gắng đưa ra quyết định này một cách công bằng, nhưng chính sách có thể khác nhau. Do đó, các chương trình được viết tốt không nên phụ thuộc vào chi tiết của chính sách này. **Bất kỳ chương trình nào dựa vào bộ lập lịch thread để bảo đảm tính đúng đắn hay hiệu năng đều có nhiều khả năng không khả chuyển (nonportable).**

Cách tốt nhất để viết một chương trình vững chắc, phản hồi nhanh và khả chuyển là bảo đảm rằng số thread *runnable* trung bình không lớn hơn đáng kể số bộ xử lý. Điều này để lại cho bộ lập lịch thread rất ít lựa chọn: nó chỉ đơn giản chạy các thread runnable cho đến khi chúng không còn runnable nữa. Hành vi của chương trình không thay đổi quá nhiều, ngay cả dưới những chính sách lập lịch thread hoàn toàn khác nhau. Lưu ý rằng số thread runnable không giống với tổng số thread, con số này có thể cao hơn nhiều. Các thread đang chờ thì không runnable.

Kỹ thuật chính để giữ số thread runnable ở mức thấp là để mỗi thread làm một việc hữu ích nào đó, rồi chờ thêm việc. **Các thread không nên chạy nếu chúng không làm việc hữu ích.** Theo ngôn ngữ của Executor Framework (**Item 80**), điều này có nghĩa là định kích thước thread pool phù hợp [Goetz06, 8.2] và giữ cho các task ngắn, nhưng không *quá* ngắn, nếu không chi phí điều phối sẽ làm giảm hiệu năng.

Các thread không nên *busy-wait* (chờ bận), tức là liên tục kiểm tra một object được chia sẻ để chờ trạng thái của nó thay đổi. Ngoài việc khiến chương trình dễ bị ảnh hưởng bởi sự thất thường của bộ lập lịch thread, busy-wait còn làm tăng đáng kể tải lên bộ xử lý, làm giảm lượng công việc hữu ích mà các thread khác có thể hoàn thành. Như một ví dụ cực đoan về điều *không* nên làm, hãy xét cài đặt lại méo mó này của `CountDownLatch`:

```java
// Awful CountDownLatch implementation - busy-waits incessantly!
public class SlowCountDownLatch {
    private int count;

    public SlowCountDownLatch(int count) {
        if (count < 0)
            throw new IllegalArgumentException(count + " < 0");
        this.count = count;
    }

    public void await() {
        while (true) {
            synchronized(this) {
                if (count == 0)
                    return;
            }
        }
    }

    public synchronized void countDown() {
        if (count != 0)
            count--;
    }
}
```

Trên máy của tôi, `SlowCountDownLatch` chậm hơn khoảng mười lần so với `CountDownLatch` của Java khi 1.000 thread chờ trên một latch. Mặc dù ví dụ này có vẻ hơi xa vời, không hiếm khi thấy các hệ thống có một hoặc nhiều thread ở trạng thái runnable một cách không cần thiết. Hiệu năng và tính khả chuyển nhiều khả năng sẽ bị ảnh hưởng.

Khi đối mặt với một chương trình chỉ vừa đủ chạy được vì một số thread không nhận đủ thời gian CPU so với các thread khác, **hãy cưỡng lại cám dỗ "sửa" chương trình bằng cách chèn các lời gọi** `Thread.yield` **.** Bạn có thể thành công trong việc khiến chương trình chạy được phần nào, nhưng nó sẽ không khả chuyển. Cùng những lời gọi `yield` cải thiện hiệu năng trên một cài đặt JVM có thể làm nó tệ hơn trên cài đặt thứ hai và không có tác dụng gì trên cài đặt thứ ba. `Thread.yield` **không có ngữ nghĩa nào có thể kiểm thử được.** Hướng hành động tốt hơn là tái cấu trúc ứng dụng để giảm số thread runnable đồng thời.

Một kỹ thuật liên quan, với những lưu ý tương tự, là điều chỉnh độ ưu tiên (priority) của thread. **Độ ưu tiên thread nằm trong số những tính năng ít khả chuyển nhất của Java.** Việc tinh chỉnh khả năng phản hồi của một ứng dụng bằng cách điều chỉnh vài độ ưu tiên thread không phải là vô lý, nhưng hiếm khi cần thiết và không khả chuyển. Việc cố gắng giải quyết một vấn đề liveness nghiêm trọng bằng cách điều chỉnh độ ưu tiên thread là vô lý. Vấn đề nhiều khả năng sẽ quay lại cho đến khi bạn tìm ra và sửa nguyên nhân gốc rễ.

Tóm lại, đừng phụ thuộc vào bộ lập lịch thread để bảo đảm tính đúng đắn của chương trình. Chương trình thu được sẽ không vững chắc cũng không khả chuyển. Hệ quả là, đừng dựa vào `Thread.yield` hay độ ưu tiên thread. Những cơ chế này chỉ đơn thuần là gợi ý cho bộ lập lịch. Độ ưu tiên thread có thể được dùng một cách dè dặt để cải thiện chất lượng dịch vụ của một chương trình đã hoạt động tốt, nhưng chúng không bao giờ nên được dùng để "sửa" một chương trình chỉ vừa đủ chạy được.
