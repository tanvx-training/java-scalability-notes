# Chương 5. Scoped Values

*Kẻ nào không đặt mọi thứ vào đúng chỗ của chúng thì đã phạm phải sự bất công.*

—Ali ibn Abi Talib (cầu xin Thượng đế hài lòng với ông)

Trong chương này, chúng ta sẽ khám phá `ScopedValue`, một bổ sung mạnh mẽ cho Java đã được hoàn thiện trong JDK 25. Nó cung cấp một cách có cấu trúc để gắn (bind) các giá trị vào một scope (phạm vi) cụ thể, đồng thời vẫn giữ cho chúng có thể truy cập được và nhất quán với ngữ cảnh. Không giống như các biến `ThreadLocal` truyền thống, vốn có thể cồng kềnh và dễ gây rò rỉ bộ nhớ (memory leak), cơ chế này mang lại một cách tiếp cận gọn gàng và hiệu quả hơn khi làm việc với các ứng dụng đa luồng. Trong chương này, chúng ta sẽ xem xét vì sao `ScopedValue` là sự thay thế tốt hơn cho `ThreadLocal` cùng với API của nó, rồi sau đó đi qua các trường hợp sử dụng thực tế.

Hãy bắt đầu nào.

## Gánh nặng của việc truyền ngữ cảnh

Thường có những tình huống mà chúng ta cần chia sẻ dữ liệu giữa nhiều phần khác nhau của mã nguồn, nơi mà việc chỉ đơn giản dùng tham số phương thức là không khả thi. Điều này đặc biệt phổ biến khi ứng dụng của chúng ta phụ thuộc vào một framework. Để minh họa ý tưởng này, hãy cùng xem xét một ví dụ.

Hãy hình dung một framework lập lịch công việc (job-scheduling), trong đó mã của người dùng đăng ký các tác vụ mà framework sẽ thực thi. Mỗi khi framework chạy một job, nó tạo ra một đối tượng `JobContext` chứa metadata như tên job, độ ưu tiên và các ràng buộc lập lịch. Ngữ cảnh này thiết yếu đối với các thao tác của framework nhưng phần lớn lại không liên quan gì đến mã của người dùng.

Ví dụ sau đây minh họa một framework lập lịch công việc điển hình mắc phải điều mà chúng ta gọi là “vấn đề truyền tham số” (parameter passing problem):

```java
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

interface Job {
    void execute(JobContext context);
}
enum Priority { LOW, MEDIUM, HIGH }

public record JobContext(String jobName, Priority priority,
                         Map<String, Object> metadata) {
    public JobContext(String jobName, Priority priority) {
        this(jobName, priority, new HashMap<>());
        metadata.put("jobName", jobName);
        metadata.put("priority", priority);
        metadata.put("creationTime", Instant.now());
    }

    public Object getMetadataValue(String key) {
        return metadata.get(key);
    }
}
```

Logic lập lịch cốt lõi của framework tạo ra và quản lý ngữ cảnh của job:

```java
// Framework code
public class JobScheduler {
    public void schedule(Job job, String jobName, Priority priority) {  ①
        JobContext context = new JobContext(jobName, priority);
        runJob(job, context);
    }

    private void runJob(Job job, JobContext context) {  ②
        // The framework calls user code here, passing the context
        job.execute(context);
    }

    public Object getJobMetadata(String key, JobContext context) {  ③
        if (context == null) {
            return null;
        }
        return context.getMetadataValue(key);
    }
}
```

Để sử dụng framework này, chúng ta phải hiện thực interface `Job` và làm việc với đối tượng `context` của framework:

```java
public class UserJob implements Job {
    private final JobScheduler jobScheduler;

    public UserJob(JobScheduler jobScheduler) {
        this.jobScheduler = jobScheduler;
    }
    @Override
    public void execute(JobContext context) {  ①
        System.out.println("User job is running!");

        // User code calls back into the framework to retrieve metadata
        Object creationTime
            = jobScheduler.getJobMetadata("creationTime", context);  ②
        System.out.println("Job creation time: " + creationTime);

        // Any helper methods also need the context parameter
        processJobData(context);  ③
    }

    private void processJobData(JobContext context) {  ④
        // Even though this method might not directly use context,
        // it needs the parameter to pass to other framework methods
        Object priority = jobScheduler.getJobMetadata("priority", context)
        System.out.println("Processing job with priority: " + priority);
    }
}
```

① Framework tạo ra một `JobContext` chứa metadata cần thiết trong suốt vòng đời của job.

② `context` phải được truyền xuống mã của người dùng, dù người dùng lẽ ra không cần hiểu nội bộ của framework.

③ Các phương thức của framework yêu cầu tham số `context` để truy cập metadata, buộc nó phải quay ngược lên chuỗi lời gọi (call chain).

④ Các hiện thực của người dùng phải nhận tham số `JobContext` trong phương thức `execute()` của mình.

⑤ Khi mã của người dùng cần các dịch vụ của framework, nó phải truyền `context` ngược lại cho framework.

⑥ Các phương thức trợ giúp (helper) trong mã của người dùng bị nhiễm bẩn bởi các tham số của framework.

⑦ Mọi phương thức trong chuỗi lời gọi của người dùng đều cần tham số `context`, ngay cả khi nó không trực tiếp sử dụng tham số đó.

Dù cách tiếp cận này hoạt động đúng, nó gây ra một số vấn đề về kiến trúc, và những vấn đề này càng trở nên rõ rệt hơn khi ứng dụng mở rộng quy mô.

### Ô nhiễm tham số

`JobContext` chủ yếu là một cấu trúc của framework mà các lập trình viên sử dụng framework lẽ ra không cần phải hiểu. Tuy nhiên, vì framework phải quản lý ngữ cảnh nội bộ của nó xuyên suốt chuỗi lời gọi, từ `schedule()` xuống mã của người dùng trong `execute()`, rồi quay trở lại framework bên trong `getJobMetadata()`, nên mã của người dùng bị buộc phải mang theo các tham số `JobContext`.

Mọi phương thức tham gia vào luồng thực thi job đều phải khai báo tham số này, ngay cả khi bản thân phương thức đó không dùng đến bất kỳ thông tin ngữ cảnh nào. Điều này làm ô nhiễm chữ ký phương thức (method signature) bằng những chi tiết đặc thù của framework, vốn chẳng mang ý nghĩa nghiệp vụ nào đối với logic ứng dụng.

### Sự mong manh của interface

Hãy xem điều gì xảy ra khi framework phát triển. Nếu sau này bạn mở rộng `JobContext` với dữ liệu bổ sung, chẳng hạn một trường `job category` mới, một ngữ cảnh distributed tracing, hay một tham chiếu logging, bạn có thể phải sửa đổi mọi chữ ký phương thức trong mã của người dùng có truyền ngữ cảnh đi khắp nơi. Mặc dù bản thân lớp `JobContext` vẫn giữ được tính tương thích ngược, yêu cầu phải luồn nó xuyên qua mã của người dùng có nghĩa là bất kỳ sự mở rộng nào về nhu cầu của framework cũng lan tỏa ra toàn bộ codebase của người dùng.

### Sự ràng buộc và khả năng kiểm thử

Mã của người dùng trở nên ràng buộc chặt chẽ (tightly coupled) với các chi tiết triển khai của framework. Việc kiểm thử từng phương thức riêng lẻ trở nên phức tạp hơn vì bạn luôn phải cung cấp một `JobContext` hợp lệ, ngay cả với những bài kiểm thử tập trung vào logic nghiệp vụ không liên quan gì đến framework.

Sự ràng buộc này cũng khiến việc chuyển đổi giữa các framework khác nhau, hay việc tách logic nghiệp vụ ra để tái sử dụng trong nhiều ngữ cảnh khác nhau, trở nên khó khăn hơn.

## Giới thiệu ThreadLocal

Để né tránh vấn đề này, mã của framework có thể được thiết kế một cách khôn ngoan bằng cách dùng `ThreadLocal`, một công cụ thường được sử dụng trong loại mã như vậy.

Hãy hiện thực lại đoạn mã trên bằng `ThreadLocal`:

```java
public class JobScheduler {
    private static final ThreadLocal<JobContext> jobContextHolder =
        new ThreadLocal<>();  ①

    public void schedule(Job job, String jobName, Priority priority) {
        JobContext context = new JobContext(jobName, priority);
        try {
            jobContextHolder.set(context);  ②
            runJob(job);
        } finally {
            jobContextHolder.remove();  ③
        }
    }

    private void runJob(Job job) {  ④
        job.execute();
    }

    public Object getJobMetadata(String key) {
        JobContext context = jobContextHolder.get();  ⑤
        return (context != null) ? context.getMetadataValue(key) : null;
    }
}
```

① Tạo một biến `ThreadLocal` để giữ `JobContext` cho từng thread.

② Thiết lập `context` trong thread hiện tại trước khi thực thi job.

③ Luôn gỡ bỏ `context` trong khối `finally` để ngăn rò rỉ bộ nhớ.

④ Phương thức `runJob` không còn cần tham số ngữ cảnh nữa.

⑤ Các phương thức của framework có thể lấy ngữ cảnh từ `ThreadLocal` bất cứ khi nào cần.

Giờ đây mã của người dùng trở nên gọn gàng hơn nhiều, không cần phải xử lý ngữ cảnh của framework:

```java
public class UserJob implements Job {
    private final JobScheduler jobScheduler;

    public UserJob(JobScheduler jobScheduler) {
        this.jobScheduler = jobScheduler;
    }

    @Override
    public void execute() {  ①
        System.out.println("User job is running!");
        // No context parameter needed - framework handles it internally
        Object creationTime = jobScheduler.getJobMetadata("creationTime");
        System.out.println("Job creation time: " + creationTime);
        // Helper methods are now clean
        processJobData();
    }

    private void processJobData() {  ②
        // Clean method signature - no framework parameters
        Object priority = jobScheduler.getJobMetadata("priority");
        System.out.println("Processing job with priority: " + priority);
    }
}
```

① Mã của người dùng hoàn toàn được giải phóng khỏi những mối bận tâm về ngữ cảnh của framework.

② Các dịch vụ của framework có thể truy cập được mà không cần bất kỳ tham số ngữ cảnh nào.

③ Các phương thức trợ giúp có chữ ký gọn gàng, tập trung vào logic nghiệp vụ.

Cách tiếp cận này giải quyết hiệu quả vấn đề truyền tham số. Mã của người dùng không còn cần các tham số đặc thù của framework nữa; giờ đây chúng ta có thể tập trung vào logic nghiệp vụ của riêng mình. Việc quản lý ngữ cảnh nội bộ của framework giờ đã hoàn toàn được che giấu khỏi mã của người dùng.

Mẫu (pattern) này hiệu quả đến mức hầu như mọi framework hiện đại đều dùng một dạng `ThreadLocal` nào đó để quản lý ngữ cảnh. Chẳng hạn, Spring Framework sử dụng `ThreadLocal` rất rộng rãi cho ngữ cảnh bảo mật, ngữ cảnh giao dịch (transaction) và ngữ cảnh request.

### Những hạn chế của biến ThreadLocal

Mặc dù việc có `ThreadLocal` trong mã trông có vẻ khôn ngoan và hữu ích, các biến `ThreadLocal` có nhiều khiếm khuyết thiết kế cố hữu. Hãy cùng bàn về chúng.

Thứ nhất, `ThreadLocal` cho phép thay đổi không giới hạn (unconstrained mutability). Bất kỳ đoạn mã nào có thể gọi phương thức `get()` của một biến `ThreadLocal` thì cũng có thể gọi `set()`, cho phép dữ liệu thay đổi vào bất cứ lúc nào. Điều này khiến việc theo dõi dữ liệu bị sửa đổi khi nào và ở đâu trở nên khó khăn.

Hãy xem đoạn mã sau:

```java
public class MutableLoggingContext {
 // A ThreadLocal holding the current log level
 private static final ThreadLocal<String> LOG_LEVEL = new ThreadLocal<>();

 public static void setLogLevel(String level) {
   LOG_LEVEL.set(level);  ①
 }

 public static String getLogLevel() {
   return LOG_LEVEL.get();
 }

 public static void log(String message) {
   System.out.println("[" + getLogLevel() + "] " + message);
 }

 public static void main(String[] args) throws InterruptedException {
   setLogLevel("INFO");
   log("Starting process...");  ②
   Thread thread = new Thread(() -> {
     setLogLevel("DEBUG");  ③
     log("Thread-specific debug mode enabled");
   });
   thread.start();
   Thread.sleep(100); // Give the other thread time to run
   log("Main thread still at INFO level");  ④
 }
}
```

Trong ví dụ này:

① Bất kỳ đoạn mã nào cũng có thể truy cập `ThreadLocal` tĩnh (static) này.

② Mức log có thể bị thay đổi từ bất cứ đâu trong codebase.

③ Main thread đặt mức log của nó thành `INFO`.

④ Thread con độc lập đặt mức log riêng của nó thành `DEBUG`.

⑤ Mức log của main thread vẫn giữ nguyên là `INFO` (sự cách ly thread-local).

Như bạn thấy, việc đặt mức log có thể được thực hiện ở bất cứ đâu, dẫn đến sự bối rối về việc nó đã được đặt ở chỗ nào.

Thứ hai, nó có vòng đời không giới hạn (unbounded lifetime). Một khi biến thread-local đã được thiết lập, nó tồn tại suốt vòng đời của thread đó trừ khi được gỡ bỏ một cách tường minh. Điều này có thể không thành vấn đề với các thread thông thường, nhưng ngày nay chúng ta dùng thread pool, nơi cùng những thread đó được tái sử dụng lặp đi lặp lại. Điều này có thể dẫn đến rò rỉ dữ liệu từ tác vụ này sang tác vụ khác nếu quên gọi `remove()`. Nó có thể gây rò rỉ bộ nhớ hoặc thậm chí lỗ hổng bảo mật nếu dữ liệu nhạy cảm tồn tại ngoài ý muốn.

Hãy xem xét ví dụ sau:

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadLocalLeakExample {
  private static final ThreadLocal<String> currentUser = new ThreadLocal<>

  public static void main(String[] args) throws InterruptedException {
    try (ExecutorService executor = Executors.newFixedThreadPool(1)) {  ①
      // The first task sets the current user
      executor.submit(() -> {
        currentUser.set("Alice");  ②
        System.out.println("Task 1: currentUser = " + currentUser.get());
        // Forgot to call currentUser.remove()!  ③
      });
      Thread.sleep(100); // Ensure task 1 completes
      // The second task reuses the same thread
      executor.submit(() -> {
        System.out.println("Task 2: Leaked value = " + currentUser.get());
        currentUser.set("Bob");
        System.out.println("Task 2: currentUser = " + currentUser.get());
        currentUser.remove(); //
      });
    }
  }
}
```

Ví dụ này minh họa những điều sau:

① Thread pool đơn luồng đảm bảo cùng một thread xử lý cả hai tác vụ.

② Tác vụ đầu tiên thiết lập một giá trị thread-local.

③ Thiếu bước dọn dẹp khiến giá trị tiếp tục tồn tại.

④ Tác vụ thứ hai nhìn thấy giá trị bị rò rỉ từ tác vụ đầu tiên.

Điều này có thể gây ra rò rỉ bộ nhớ khi các đối tượng vẫn được tham chiếu lâu hơn dự định, lỗ hổng bảo mật khi dữ liệu nhạy cảm như token xác thực hay ngữ cảnh người dùng bị rò rỉ giữa các request không liên quan, và hành vi sai lệch khi các tác vụ hoạt động với ngữ cảnh cũ hoặc không chính xác.

Khi dùng `InheritableThreadLocal`, các thread con tự động kế thừa giá trị từ thread cha của chúng. Dù điều này có thể tiện lợi, nó trở nên tốn kém khi tạo ra nhiều thread con:

Bây giờ hãy xem ví dụ tiếp theo:

```java
public class InheritanceOverheadExample {
  private static final InheritableThreadLocal<byte[]> LARGE_DATA =
      new InheritableThreadLocal<>();  ①

  public static void main(String[] args) {
    // Parent thread sets a large object
    LARGE_DATA.set(new byte[10_000_000]); // 10MB  ②
    // Create multiple child threads
    for (int i = 0; i < 100; i++) {
      new Thread(() -> {
        // Each child thread gets a reference to the parent’s data  ③
        byte[] inherited = LARGE_DATA.get();
        System.out.println("Child has access to " +
            inherited.length + " bytes");
      }).start();
    }
  }
}
```

Các vấn đề với việc kế thừa:

① `InheritableThreadLocal` tự động sao chép giá trị sang các thread con.

② Các đối tượng lớn được tham chiếu bởi tất cả các thread con.

③ Ngay cả khi các thread con không bao giờ sửa đổi dữ liệu, chúng vẫn duy trì tham chiếu. Ví dụ này cho thấy rõ mặt trái của việc dùng `InheritableThreadLocal` khi lưu trữ các đối tượng lớn. Dù các thread con không tường minh thiết lập hay thay đổi biến cục bộ, chúng vẫn tự động kế thừa bản sao riêng biệt của dữ liệu từ thread cha, dẫn đến việc sử dụng bộ nhớ trùng lặp.

Giờ chúng ta đã hiểu vấn đề với biến `ThreadLocal`, vậy giải pháp sẽ là gì?

### Hướng tới việc chia sẻ nhẹ nhàng

Những hạn chế của `ThreadLocal` càng trở nên rõ ràng hơn với sự ra đời của virtual thread (luồng ảo) ([JEP 444](https://oreil.ly/nXHrR)). Không giống như các platform thread truyền thống, nơi mỗi thread có tài nguyên OS dành riêng cho nó, virtual thread cho phép một OS thread duy nhất chứa hàng nghìn, thậm chí hàng triệu thread nhẹ. Dù về mặt kỹ thuật, mỗi virtual thread có thể duy trì dữ liệu `ThreadLocal` riêng của nó, chi phí bộ nhớ nhanh chóng trở nên không thể chịu nổi. Hãy hình dung một triệu virtual thread, mỗi thread mang theo một mẩu trạng thái riêng—chi phí sẽ là khủng khiếp. Rõ ràng, chúng ta cần một cách tiếp cận tốt hơn.

Vì virtual thread có vòng đời ngắn, vấn đề thread local sống lâu bớt nghiêm trọng hơn, bởi garbage collection sẽ dọn chúng đi; tuy vậy, chi phí bộ nhớ của quá nhiều bản sao trùng lặp vẫn còn đó. Lý tưởng nhất, chúng ta muốn một cơ chế mới cho phép lưu trữ dữ liệu theo từng thread, có thể kế thừa được, mà không phải chịu nhiều bản sao. Nếu dữ liệu là immutable (bất biến) thì càng tốt: một phiên bản dùng chung có thể được các thread con tham chiếu mà không cần nhân bản thêm. Chúng ta cũng cần một vòng đời có giới hạn cho dữ liệu này; một khi phương thức chia sẻ dữ liệu đã kết thúc, mọi thread local gắn kèm nên mất đi ý nghĩa của chúng. Xét cho cùng, chúng được sinh ra để làm một nơi thuận tiện giữ trạng thái trong suốt thời gian của một tác vụ, chứ không phải một kho chứa bộ nhớ vĩnh viễn.

Đó chính là lúc API mới [`ScopedValue`](https://oreil.ly/Bb5W2) xuất hiện. Hãy cùng mổ xẻ nó.

## Các thành phần cốt lõi của ScopedValue

Một `ScopedValue` hoạt động như một tham số phương thức ngầm định, cho phép dữ liệu được truyền qua một chuỗi lời gọi phương thức mà không cần khai báo tường minh trong chữ ký của từng phương thức. Điều này giúp mã gọn gàng và dễ bảo trì hơn, đặc biệt khi làm việc với các lời gọi phương thức lồng nhau sâu hoặc các cấu trúc callback.

Nó có ba đặc tính chính:

*Tính bất biến (Immutability)*

Một khi `ScopedValue` đã được gắn với một giá trị trong một scope cụ thể, nó không thể bị thay đổi, đảm bảo hành vi nhất quán và có thể dự đoán được trong suốt vòng đời của nó.

*Gắn kết theo phạm vi thread (Thread-scoped binding)*

Các binding được giới hạn trong thread hiện tại, ngăn chặn việc chia sẻ dữ liệu ngoài ý muốn giữa các thread và tăng cường thread safety.

*Vòng đời có giới hạn (Bounded lifetime)*

Binding của một `ScopedValue` chỉ giới hạn trong thời gian thực thi của một khối mã cụ thể, sau đó nó trở về trạng thái không gắn kết (unbound), hỗ trợ việc quản lý tài nguyên và giảm nguy cơ rò rỉ bộ nhớ.

> **LƯU Ý**
>
> `ScopedValue`, được khám phá trong chương này, đã có sẵn kể từ JDK 25. Nếu bạn đang dùng một JDK cũ hơn, bạn có thể bật nó bằng cờ `--enable-preview` khi biên dịch và khi chạy. Ví dụ, để biên dịch và chạy mã của bạn trên JDK 24, hãy dùng các lệnh sau:
>
> - Với `javac`: `javac --release 24 --enable-preview Main.java`
>
> - Với `java`: `java --enable-preview Main`
>
> - Với trình khởi chạy mã nguồn (source code launcher): `java --enable-preview Main.java`
>
> - Với JShell: `jshell --enable-preview`
>
> Chúng tôi dự đoán tính năng này sẽ được tích hợp vào các bản phát hành JDK trong tương lai mà không đòi hỏi bất kỳ sửa đổi nào đối với mã của bạn.
>
Để dùng một scoped value, trước tiên chúng ta khai báo nó như một trường static final. Chúng ta khai báo `ScopedValue` giống hệt cách khai báo `ThreadLocal`:

```java
private static final ScopedValue<String> NAME = ScopedValue.newInstance();
```

Chúng ta không dùng toán tử `new` để khởi tạo; thay vào đó, chúng ta dùng phương thức factory để khởi tạo, bởi các constructor của nó được cố ý đặt là private.

Sau đó, chúng ta có thể gắn một giá trị vào scoped value và thực thi mã bên trong scope đó. Điều này được thực hiện bằng các phương thức [`where()`](https://oreil.ly/2lCFt) và [`run()`](https://oreil.ly/x73-z):

```java
ScopedValue.where(NAME, "duke").run(() -> doSomething());
```

Trong ví dụ này, phương thức `where()` liên kết scoped value `NAME` với người dùng hiện tại. Phương thức `run()` thực thi khối mã được cung cấp (trong trường hợp này là một biểu thức lambda) bên trong scope của giá trị đã gắn. Mã bên trong phương thức `run()` có thể truy cập scoped value bằng phương thức `get()`. Trong trường hợp của chúng ta, phương thức `doSomething()` sẽ truy cập giá trị bằng cách gọi phương thức `get()`:

```text
NAME.get()
```

Nếu bây giờ chúng ta muốn thay thế lớp `JobScheduler` bằng `ScopedValue`, chúng ta sẽ làm như sau:

```java
private static final ScopedValue<JobContext> CONTEXT
                                            = ScopedValue.newInstance();

  public void schedule(Job job, String jobName, Priority priority) {
    JobContext context = new JobContext(jobName, priority);  ①
    ScopedValue.where(CONTEXT, context)
        .run(() -> runJob(job));  ②
  }

  private void runJob(Job job) {
    job.execute();  ③
  }

  public static JobContext getContext() {  ④
    return CONTEXT.get();
  }

  public static Object getJobMetadata(String key) {
    JobContext context = CONTEXT.get();  ⑤
    if (context != null) {
      return context.getMetadataValue(key);
    }
    return null;
  }
}
```

Các khía cạnh chính của triển khai này:

① Tạo một thể hiện (instance) `ScopedValue` bằng phương thức factory

② Xây dựng đối tượng `context` sẽ được gắn

③ Gắn `context` và thực thi job bên trong scope đó

④ Job thực thi với quyền truy cập vào `context` đã được scope

⑤ Cung cấp truy cập tĩnh (static) đến `context` hiện tại (gọn gàng hơn bản gốc)

⑥ Lấy metadata một cách an toàn với việc kiểm tra `null`

Giờ chúng ta đã hiểu cách nó hoạt động, hãy xem xét sâu hơn. Trong khi các ví dụ trước minh họa việc dùng `run()` để thực thi mã bên trong một scope, `ScopedValue` cũng cung cấp phương thức `call()` khi bạn cần trả về một giá trị từ quá trình thực thi trong scope. Sự khác biệt rất đơn giản: `run()` thực thi một `Runnable` (trả về void), còn `call()` thực thi một `Callable` (trả về một giá trị).

Hãy xem các đoạn mã sau:

```java
private static final ScopedValue<Double> DISCOUNT_RATE
                                    = ScopedValue.newInstance();

  public double calculatePrice(double basePrice) {
    // Using call() to return the calculated price from within the scope
    return ScopedValue.where(DISCOUNT_RATE, 0.20)  // 20% discount
        .call(() -> basePrice * (1 - DISCOUNT_RATE.get()));
  }

  void main() {
    PricingService service = new PricingService();
    double finalPrice = service.calculatePrice(100.0);
    System.out.println("Final price: $" + finalPrice);
    // Output: Final price: $80.00
  }
}
```

Trong ví dụ này, chúng ta dùng `call()` vì cần trả về giá đã tính. Mẫu này đặc biệt hữu ích cho các phép tính toán, biến đổi, hay bất kỳ thao tác nào mà bạn cần lấy về một kết quả trong khi vẫn duy trì quyền truy cập vào ngữ cảnh đã được scope.

### Chạy ScopedValue

`ScopedValue` có vòng đời có giới hạn. Chúng ta phải thiết lập nó trước, rồi sau đó mới có thể sử dụng.

Hãy xem ví dụ sau:

```java
public static void main(String[] args) {

   ScopedValue<String> NAME = ScopedValue.newInstance();

   Runnable task = () -> {
       if (NAME.isBound()) {
           System.out.println("Name is bound: " + NAME.get());
       } else {
           System.out.println("Name is not bound");
       }
   };
   task.run();
}
```

Nếu chạy đoạn mã này, nó sẽ in ra `Name is not bound` vì chúng ta chưa thiết lập giá trị. Để gắn một giá trị và thực thi mã bên trong scope đó, chúng ta dùng các phương thức `where()` và `run()`:

```java
   public static void main(String[] args) {
    ScopedValue<String> NAME = ScopedValue.newInstance();

    Runnable task = () -> {
        if (NAME.isBound()) {
            System.out.println("Name is bound: " + NAME.get());
        } else {
            System.out.println("Name is not bound");
        }
    };

    ScopedValue.where(NAME, "Bazlur")  ①
               .run(task);  ②
}
```

Cách tiếp cận này:

① Gắn giá trị `Bazlur` vào scoped value `NAME`

② Thực thi tác vụ bên trong scope của binding đó

Đoạn mã này sẽ chạy trong ngữ cảnh của main thread, vì phương thức `main` khởi chạy nó. Nếu chạy đoạn mã trên, chúng ta sẽ thấy kết quả sau:

```text
Name is bound: Bazlur
```

Bây giờ, có người có thể hỏi: sau khi thiết lập `ScopedValue` bằng `where().run()`, chúng ta có thể thực thi tác vụ một cách riêng rẽ và lấy được giá trị không?

Hãy kiểm tra điều này:

```java
public static void main(String[] args) {
   ScopedValue<String> NAME = ScopedValue.newInstance();
   Runnable task = () -> {
       if (NAME.isBound()) {
           System.out.println("Name is bound: " + NAME.get());
       } else {
           System.out.println("Name is not bound");
       }
   };
   // Execute within scope
   ScopedValue.where(NAME, "Bazlur").run(task);  ①
   // Try to execute outside scope
   task.run();  ②
}
```

Điều này cho thấy rằng:

① Lần thực thi đầu tiên chạy bên trong ngữ cảnh đã gắn của scoped value.

② Lần thực thi thứ hai chạy bên ngoài scope đó, nên giá trị không còn được gắn nữa.

Kết quả của đoạn mã này sẽ là:

```text
Name is bound: Bazlur
Name is not bound
```

`ScopedValue` chỉ duy trì trạng thái gắn kết bên trong scope động (dynamic scope) của lời gọi phương thức `run()`. Một khi phương thức đó hoàn thành, binding tự động được gỡ bỏ, đảm bảo ranh giới scope rõ ràng và ngăn giá trị rò rỉ giữa các phần mã không liên quan.

> **LƯU Ý**
>
> “Scope” (phạm vi) của một giá trị xác định nơi nó tồn tại và nơi nó có thể được truy cập. Trong Java, điều này thường đề cập đến *lexical scope* (phạm vi từ vựng, được xác định bởi các khối `{}`), nơi các biến chỉ có thể truy cập được trong ranh giới mà chúng được khai báo. Tuy nhiên, `ScopedValue` hoạt động dựa trên *dynamic scope* (phạm vi động), được xác định bởi *luồng thực thi* của chương trình.
>
> Dynamic scope có nghĩa là một giá trị có thể truy cập được trong quá trình thực thi của những phương thức cụ thể và những phương thức mà chúng gọi, trực tiếp hoặc gián tiếp. Ví dụ, nếu `a` gọi `b`, và `b` gọi `c`, scope chảy xuyên qua `c` nhưng kết thúc khi `c` hoàn tất. `ScopedValue` gắn một giá trị vào luồng thực thi này, khiến nó chỉ có sẵn bên trong scope của phương thức `run` đã thiết lập nó.
>
> Chính việc xác định scope tạm thời và chính xác này là điều khiến `ScopedValue` trở thành một lựa chọn thay thế gọn gàng và an toàn hơn so với `ThreadLocal`, đặc biệt là để truyền dữ liệu ngữ cảnh.
>
Chúng ta có thể đặt thêm một câu hỏi khác: thay vì dùng main thread, chúng ta có thể chạy tác vụ trong một thread khác không?

Hãy xem đoạn mã sau:

```java
public static void main(String[] args) throws InterruptedException {
    ScopedValue<String> NAME = ScopedValue.newInstance();

    Runnable task = () -> {
        if (NAME.isBound()) {
            System.out.println("Name is bound: " + NAME.get());
        } else {
            System.out.println("Name is not bound");
        }
    };

    Thread thread = Thread.ofPlatform().unstarted(task);  ①
    ScopedValue.where(NAME, "Bazlur")
               .run(thread::start);  ②

    thread.join();
}
```

Trong đoạn mã này:

① Tạo một platform thread chưa khởi chạy với tác vụ của chúng ta

② Gắn scoped value và khởi chạy thread bên trong scope đó

Khi chạy đoạn mã này, kết quả là:

```text
Name is not bound
```

Lý do chúng ta nhận được kết quả này là vì scoped value không được tự động kế thừa bởi các thread mới tạo. Mặc dù `thread::start` thực thi bên trong scope nơi `NAME` được gắn, tác vụ thực sự lại chạy trong một thread riêng biệt không kế thừa binding của scoped value. Hành vi này giống nhau đối với cả platform thread lẫn virtual thread.

Bây giờ, thay vì tạo `ScopedValue` trong main thread, hãy chuyển nó sang thread mới được tạo:

```java
public static void main(String[] args) throws InterruptedException {
    ScopedValue<String> NAME = ScopedValue.newInstance();

    Runnable task = () -> {
        if (NAME.isBound()) {
            System.out.println("Name is bound: " + NAME.get());
        } else {
            System.out.println("Name is not bound");
        }
    };

    Thread thread = Thread.ofVirtual().start(() -> {  ①
        ScopedValue.where(NAME, "Bazlur")
                   .run(task);  ②
    });
    thread.join();
}
```

Giờ đoạn mã hoạt động như mong đợi:

① Tạo và khởi chạy một virtual thread

② Gắn scoped value và chạy tác vụ bên trong ngữ cảnh của thread mới

`ScopedValue` cung cấp một fluent API; dùng nó, chúng ta có thể gắn nhiều `ScopedValue` nối chuỗi với nhau.

Hãy xem ví dụ sau:

```java
public class MultiScopedExample {
  private static final ScopedValue<String> USER_ID
                                        = ScopedValue.newInstance();
  private static final ScopedValue<String> SESSION_ID
                                        = ScopedValue.newInstance();

  public static void main(String[] args) {
    ScopedValue.where(USER_ID, "user123")  ①
        .where(SESSION_ID, "session456")  ②
        .run(() -> performTask());  ③
  }

  public static void performTask() {
    String userId = USER_ID.get();
    String sessionId = SESSION_ID.get();
    System.out.println("Performing task for user: " + userId +
        " in session: " + sessionId);
    logAction();
  }

  public static void logAction() {
    String userId = USER_ID.get();  ④
    String sessionId = SESSION_ID.get();
    System.out.println("Logging action for user: " + userId +
        " in session: " + sessionId);
  }
}
```

Cách tiếp cận nối chuỗi này:

① Gắn scoped value đầu tiên

② Nối chuỗi thêm một binding khác

③ Thực thi mã với cả hai giá trị đã được gắn

④ Cho phép cả hai giá trị vẫn có thể truy cập được xuyên suốt call stack `ScopedValue` có hai phương thức tiện lợi khác, [`orElse`](https://oreil.ly/BkL2X) và [`orElseThrow`](https://oreil.ly/pOT8D). Hai phương thức này hữu ích khi chúng ta muốn dùng một giá trị mặc định trong trường hợp không có giá trị nào trong `ScopedValue`, hoặc khi chúng ta muốn ném ra một ngoại lệ.

Hãy xem ví dụ tiếp theo:

```java
public class ScopedValueDefaultsExample {
  private static final ScopedValue<String> USER_NAME
      = ScopedValue.newInstance();

  public static void main(String[] args) {
    // Using orElse for default values
    String userNameUnbound = USER_NAME.orElse("Guest");  ①
    System.out.println("No binding -> user name defaults to: "
        + userNameUnbound);
    // Using orElseThrow for validation
    try {
      USER_NAME.orElseThrow(() ->
          new IllegalStateException("No user name bound yet!"));  ②
    } catch (IllegalStateException e) {
      System.out.println("Caught exception: " + e.getMessage());
    }
    // Within a bound scope
    ScopedValue.where(USER_NAME, "Bazlur").run(() -> {
      String boundUserName = USER_NAME.orElse("Guest");  ③
      System.out.println("Within binding -> user name is: " + boundUserName
      // This won’t throw since the value is bound
      String validatedName = USER_NAME.orElseThrow(()
          -> new IllegalStateException("No user name bound yet!"));  ④
      System.out.println("Validated name: " + validatedName);
    });
  }
}
```

Các phương thức này:

① Cung cấp truy cập an toàn với một giá trị mặc định khi chưa được gắn

② Cho phép kiểm tra hợp lệ (validation) bằng cách ném ra một ngoại lệ tùy chỉnh khi chưa được gắn

③ Trả về giá trị đã gắn (bỏ qua giá trị mặc định)

④ Có thể dùng phiên bản không tham số khi bạn chắc chắn rằng giá trị tồn tại

Thiết kế API này đảm bảo mã có thể xử lý êm đẹp cả hai trạng thái đã gắn và chưa gắn, khiến scoped value trở nên vững chắc cho nhiều trường hợp sử dụng khác nhau.

#### Gắn lại (rebind) ScopedValue trong các scope lồng nhau

Một trong những tính năng mạnh mẽ của `ScopedValue` là khả năng *gắn lại* (rebind) bên trong các scope lồng nhau. Việc gắn lại cho phép bạn gán một giá trị mới cho cùng một `ScopedValue` trong một khoảng thời gian giới hạn, gói gọn trong một scope con cụ thể. Một khi scope con kết thúc, giá trị ban đầu được tự động khôi phục, đảm bảo việc quản lý ngữ cảnh gọn gàng và có thể dự đoán được.

Tính năng gắn lại này đặc biệt hữu ích trong các tình huống như kiểm soát truy cập dựa trên vai trò (role-based access control), nơi vai trò của người dùng có thể được tạm thời chuyển đổi trong một thao tác cụ thể. Nó cũng cho phép các cấu hình nhạy cảm theo ngữ cảnh, ví dụ, cho phép điều chỉnh các thiết lập cho một luồng thực thi cụ thể mà không ảnh hưởng đến ngữ cảnh rộng hơn. Ngoài ra, nó có thể hỗ trợ việc ghi đè theo từng tác vụ bằng cách cung cấp dữ liệu tạm thời cho một tác vụ hoặc hành động cụ thể.

Bây giờ hãy xem ví dụ này:

```java
public class ScopedValueRebindingExample {
  private static final ScopedValue<String> USER_ROLE = ScopedValue.newInsta
  public static void main(String[] args) {
    // Bind initial value in outer scope
    ScopedValue.where(USER_ROLE, "Admin").run(() -> {  ①
      System.out.println("Outer scope: User role is " + USER_ROLE.get());
      performTask();
      // Rebind in nested scope
      ScopedValue.where(USER_ROLE, "Guest").run(() -> {  ②
        System.out.println("Inner scope: User role is " + USER_ROLE.get())
        performTask();
      });  ③
      // Original value restored automatically
      System.out.println("Back to outer scope: User role is " + USER_ROLE.g
      performTask();
    });
  }
  public static void performTask() {
    System.out.println("  Performing task as: " + USER_ROLE.get());  ④
  }
}
```

Các khía cạnh chính của ví dụ này:

① Thiết lập binding ban đầu là `Admin` trong scope ngoài.

② Tạo một scope lồng bên trong tạm thời gắn lại giá trị thành `Guest`.

③ Khi scope này thoát, giá trị `Admin` ban đầu được khôi phục.

④ Cùng một phương thức truy cập các giá trị khác nhau tùy theo scope hiện tại.

Nếu chạy đoạn mã này, chúng ta sẽ nhận được kết quả sau:

```text
Outer scope: User role is Admin
  Performing task as: Admin
Inner scope: User role is Guest
  Performing task as: Guest
Back to outer scope: User role is Admin
  Performing task as: Admin
```

### ScopedValue và Structured Concurrency

`ScopedValue` được thiết kế để hoạt động liền mạch với structured concurrency. Như chúng ta đã thấy trong ví dụ trước, `ScopedValue` không được các thread con kế thừa; tuy nhiên, khi được dùng bên trong một `StructuredTaskScope`, các binding của `ScopedValue` được tự động kế thừa bởi tất cả các thread con được tạo ra trong scope đó. Cơ chế kế thừa này tạo điều kiện chia sẻ dữ liệu hiệu quả giữa thread cha và thread con mà không cần truyền dữ liệu tường minh dưới dạng tham số. Đó là vì structured concurrency có các ranh giới được xác định rõ ràng. Khi chúng ta thoát khỏi `StructuredTaskScope`, tất cả các thread được tạo trong scope đều bị interrupt rồi sau đó được garbage collection thu dọn; do đó, không có vấn đề rò rỉ bộ nhớ.

Hãy xem một ví dụ:

```java
import java.util.concurrent.StructuredTaskScope;

public class ScopedValueStructuredConcurrencyExample {
   private static final ScopedValue<String>
           USERNAME = ScopedValue.newInstance();

   public static void main(String[] args) {
       ScopedValue.where(USERNAME, "Bazlur").run(() -> {
           doSomething();
       });
   }

   public static void doSomething() {
       try (var scope = StructuredTaskScope.open()) {
           StructuredTaskScope.Subtask<String> task1 = scope.fork(()
                   -> USERNAME.get() + " from task 1");
           StructuredTaskScope.Subtask<String> task2 = scope.fork(()
                   -> USERNAME.get() + " from task 2");
           scope.join();
           String result1 = task1.get();
           String result2 = task2.get();
           System.out.println(result1);
           System.out.println(result2);
       } catch (InterruptedException e) {
           throw new RuntimeException(e);
       }
   }
}
```

Trong ví dụ này, scoped value `USERNAME` được gắn với chuỗi `Bazlur` trong main thread. Khi `doSomething()` được gọi, nó tạo một `StructuredTaskScope` và fork hai thread con. Các thread con này kế thừa binding `USERNAME` từ thread cha và có thể truy cập nó bằng `USERNAME.get()`.

### Những cân nhắc về hiệu năng

`ScopedValue` nhìn chung cho thấy hiệu năng tốt hơn so với `ThreadLocal`, đặc biệt khi làm việc với virtual thread. Lợi thế hiệu năng này là kết quả của một số yếu tố. Thứ nhất, chi phí phụ trội (overhead) được giảm bớt: các biến `ThreadLocal` có thể gây ra chi phí đáng kể khi mỗi virtual thread cần bản sao riêng của nó, làm tăng mức tiêu thụ bộ nhớ. Ngược lại, `ScopedValue` cho phép chúng ta chia sẻ dữ liệu giữa các thread trong một scope xác định, giảm thiểu việc sử dụng bộ nhớ và tăng hiệu năng. Thứ hai, `ScopedValue` được tối ưu cho virtual thread và structured concurrency. Nó tận dụng bản chất nhẹ của virtual thread để cung cấp việc chia sẻ dữ liệu hiệu quả mà không gặp những nút thắt cổ chai thường thấy của các biến thread-local truyền thống. Ví dụ, hãy xem xét một web server khởi tạo hàng nghìn virtual thread để xử lý các request đồng thời. Mỗi request có thể cần dữ liệu ngữ cảnh như chi tiết xác thực người dùng. Bằng cách dùng `ScopedValue` để chia sẻ dữ liệu này trong scope của từng request, chúng ta giảm đáng kể mức tiêu thụ bộ nhớ và cải thiện throughput tổng thể so với việc dùng `ThreadLocal`.

### Tính khả dụng và thiết kế API

Ngoài hiệu năng, `ScopedValue` mang lại một số lợi thế về tính khả dụng khiến nó trở thành lựa chọn thay thế tốt hơn cho `ThreadLocal`. Thứ nhất, `ScopedValue` bắt buộc tính bất biến, nghĩa là một khi giá trị đã được liên kết với một `ScopedValue` trong một scope, nó không thể bị sửa đổi. Tính bất biến này giúp việc suy luận về mã đơn giản hơn và giảm nguy cơ lỗi do những sửa đổi ngoài ý muốn. Trong môi trường đồng thời, tính bất biến đặc biệt hữu ích vì nó ngăn chặn race condition và sự không nhất quán dữ liệu thường phát sinh khi nhiều thread cố gắng sửa đổi các biến dùng chung.

Thứ hai, `ScopedValue` xác định tường minh vòng đời của dữ liệu dùng chung thông qua thiết kế API của nó. Phương thức `run()` đánh dấu rõ ràng scope nơi giá trị có thể truy cập được. Vòng đời tường minh này cải thiện khả năng đọc mã và giúp dễ hiểu hơn về cách dữ liệu chảy qua chương trình. Không giống hành vi ngầm định của `ThreadLocal`, thiết kế này đảm bảo một ranh giới rõ ràng hơn cho nơi giá trị có hiệu lực.

Thứ ba, API của `ScopedValue` ngắn gọn và trực quan hơn. Các phương thức `where()` và `run()` cung cấp một cách có cấu trúc để thiết lập và truy cập dữ liệu dùng chung trong một scope cụ thể. So với các phương thức thường dài dòng và kém thẳng thắn của `ThreadLocal`, cách tiếp cận của `ScopedValue` cho cảm giác tự nhiên hơn và dễ làm việc hơn.

Thêm vào đó, `ScopedValue` hoạt động như một capability object (đối tượng năng lực), cho phép kiểm soát chính xác ai có thể truy cập dữ liệu dùng chung. Bằng cách khai báo đối tượng `ScopedValue` với các access modifier như `private`, ta có thể giới hạn quyền truy cập chỉ cho các thành phần được ủy quyền, bổ sung một lớp bảo mật và đóng gói (encapsulation) cho thiết kế.

Cuối cùng, `ScopedValue` xử lý giá trị `null` một cách tường minh hơn `ThreadLocal`. Với `ThreadLocal`, việc gọi `get()` sẽ trả về `null` bất kể giá trị đã được đặt tường minh là `null` hay chưa bao giờ được đặt, điều này có thể dẫn đến những lỗi khó phát hiện. Ngược lại, `ScopedValue` phân biệt rõ ràng. Nếu giá trị chưa được gắn, việc gọi `get()` sẽ ném ra `NoSuchElement Exception`, đảm bảo bất kỳ sơ suất nào trong việc thiết lập giá trị đều được phát hiện sớm, khiến mã vững chắc và dễ dự đoán hơn.

### Di chuyển sang Scoped Values

Scoped value có khả năng hữu ích và đáng ưu tiên hơn trong nhiều tình huống mà biến thread-local đang được dùng ngày nay. Ngoài việc đóng vai trò là tham số phương thức ẩn, scoped value có thể đặc biệt hữu ích trong một số lĩnh vực.

Thứ nhất, đôi khi chúng ta muốn phát hiện đệ quy, có lẽ vì một framework không có tính re-entrant (tái nhập) hoặc vì đệ quy phải bị giới hạn theo một cách nào đó. Scoped value cung cấp một cách để phát hiện và xử lý đệ quy.

Bạn có thể thiết lập nó như bình thường, với `ScopedValue.run()`, rồi ở sâu trong call stack, gọi `ScopedValue.isBound()` để kiểm tra xem nó có binding cho thread hiện tại hay không. Tinh vi hơn, scoped value có thể mô hình hóa một bộ đếm đệ quy bằng cách được gắn lại nhiều lần.

Hãy xem xét một hệ thống xử lý tài liệu đảm nhiệm các template lồng nhau. Nếu không có giới hạn đệ quy, một template được tạo ra với ý đồ xấu chứa tham chiếu vòng có thể làm sập ứng dụng của bạn. Hãy xem đoạn mã sau:

```java
public class TemplateProcessor {
    private static final ScopedValue<Integer> RECURSION_DEPTH
                                    = ScopedValue.newInstance();  ①
    private static final int MAX_NESTING_LEVEL = 50;

    public String processTemplate(String template) {
        if (!RECURSION_DEPTH.isBound()) {  ②
            return ScopedValue.where(RECURSION_DEPTH, 0)  ③
                    .call(() -> processTemplateInternal(template));
        } else {
            return processTemplateInternal(template);
        }
    }
}
```

① Tạo một `ScopedValue` để theo dõi độ sâu đệ quy xuyên suốt các lời gọi phương thức

② Dùng `isBound()` ở sâu trong call stack để kiểm tra xem nó có binding cho thread hiện tại hay không

③ Thiết lập nó như bình thường với `ScopedValue.run()` (lưu ý: `where()` và `call()` thuộc API hiện đại)

Logic xử lý chính đảm nhiệm việc phân tích template và quản lý đệ quy. Phương thức này được gọi bên trong ngữ cảnh đã scope và có quyền truy cập vào độ sâu đệ quy hiện tại:

```java
private String processTemplateInternal(String template) {
    int currentDepth = RECURSION_DEPTH.get();  ①

    if (currentDepth >= MAX_NESTING_LEVEL) {  ②
      throw new TemplateProcessingException(
          "Template nesting too deep: " + currentDepth + " levels");
    }

    StringBuilder result = new StringBuilder();

    // Simplified template processing logic
    int includeStart = template.indexOf("{{include:");
    if (includeStart >= 0) {
      int includeEnd = template.indexOf("}}", includeStart);
      String includePath = template.substring(includeStart + 10, includeEnd

      String nestedContent = ScopedValue
          .where(RECURSION_DEPTH, currentDepth + 1)  ③
          .call(() -> processTemplateInternal(loadTemplate(includePath)));

      result.append(template, 0, includeStart);
      result.append(nestedContent);
      result.append(template.substring(includeEnd + 2));
    } else {
      result.append(template);
    }
    return result.toString();  ④
  }
```

① Lấy độ sâu đệ quy hiện tại bên trong scope.

② Hiện thực một kiểm tra an toàn để ngăn việc lồng nhau quá mức trong các framework không re-entrant.

③ Scoped value mô hình hóa một bộ đếm đệ quy bằng cách được gắn lại nhiều lần với các giá trị tăng dần.

④ Khi phương thức này trả về, giá trị độ sâu trước đó được tự động khôi phục.

Để hoàn thiện triển khai của mình, chúng ta cần các phương thức hỗ trợ cho việc tải template và xử lý lỗi. Phương thức `loadTemplate()` mô phỏng việc đọc template từ hệ thống tệp, bao gồm một số template tạo ra sự lồng nhau sâu để kiểm thử:

```java
private String loadTemplate(String path) {
    return switch (path) {
      case "header.tpl" -> "<!-- HEADER START -->";
      case "footer.tpl" -> "<!-- FOOTER END -->";
      default -> {
        if (path.startsWith("level")) {
          int level = Integer.parseInt(path.replaceAll("[^0-9]", ""));
          if (level < 10) {
            yield "Level " + level
                + " {{include:level" + (level + 1) + ".tpl}}";
          }
        }
        yield "<!-- Template content from " + path + " -->";
      }
    };
  }
```

Hãy xem tất cả những thứ này phối hợp với nhau như thế nào. Phương thức `main` sau đây minh họa nhiều kịch bản sử dụng khác nhau, từ các template đơn giản đến những template lồng nhau sâu kích hoạt cơ chế bảo vệ đệ quy của chúng ta:

```java
void main() {
        TemplateProcessor processor = new TemplateProcessor();

        // Example 1: Simple template without nesting
        String simpleTemplate = "Hello, this is a simple template!";
        System.out.println("Simple template result:");
        System.out.println(processor.processTemplate(simpleTemplate));
        System.out.println();

        // Example 2: Template with nested includes
        String nestedTemplate = "Header: {{include:header.tpl}} " +
                               "Content goes here {{include:footer.tpl}}";
        System.out.println("Nested template result:");
        System.out.println(processor.processTemplate(nestedTemplate));
        System.out.println();

        // Example 3: Demonstrate recursion depth tracking
        String deeplyNested = "Level 0 {{include:level1.tpl}}";
        System.out.println("Processing deeply nested template...");
        try {
            String result = processor.processTemplate(deeplyNested);
            System.out.println("Result: " + result);
        } catch (TemplateProcessingException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
```

Khi chạy đoạn mã trên, chúng ta nhận được kết quả sau:

```text
Simple template result:
Hello, this is a simple template!

Nested template result:
Header: <!-- HEADER START --> Content goes here <!-- FOOTER END -->

Processing deeply nested template...
Result: Level 0 Level 1 Level 2 Level 3 Level 4 Level 5 Level 6 Level 7 Lev
Level 9 <!-- Template content from level10.tpl -->
```

Thứ hai, việc phát hiện đệ quy cũng có thể hữu ích trong trường hợp các giao dịch được làm phẳng (flattened transaction): bất kỳ giao dịch nào được bắt đầu trong khi một giao dịch khác đang diễn ra sẽ trở thành một phần của giao dịch ngoài cùng.

Hãy xem ví dụ đơn giản hóa sau:

```java
public class FlattenedTransactionExample {
  private static final ScopedValue<Transaction> CURRENT_TRANSACTION =
      ScopedValue.newInstance();

  public static void main(String[] args) {
    performBusinessOperation();
  }

  private static void performBusinessOperation() {
    // Start outer transaction
    Transaction outerTx = new Transaction("OUTER_TX");
    ScopedValue.where(CURRENT_TRANSACTION, outerTx).run(() -> {  ①
      System.out.println("Starting: " + outerTx.name());
      // Nested operation that might start its own transaction
      performNestedOperation();
      System.out.println("Committing: " + outerTx.name());
    });
  }

  private static void performNestedOperation() {
    if (CURRENT_TRANSACTION.isBound()) {  ②
      // Join existing transaction
      Transaction currentTx = CURRENT_TRANSACTION.get();
      System.out.println("  Joining existing transaction: " + currentTx.nam
      performDatabaseOperation();
    } else {
      // Start new transaction if none exists
      Transaction newTx = new Transaction("NESTED_TX");
      ScopedValue.where(CURRENT_TRANSACTION, newTx).run(() -> {  ③
        System.out.println("  Starting new transaction: " + newTx.name());
        performDatabaseOperation();
      });
    }
  }

  private static void performDatabaseOperation() {
    Transaction tx = CURRENT_TRANSACTION.get();
    System.out.println("    Executing in transaction: " + tx.name());  ④
  }

  record Transaction(String name) {
  }
}
```

Mẫu này:

① Thiết lập giao dịch ngoài cùng

② Phát hiện xem một giao dịch đã đang hoạt động hay chưa

③ Chỉ tạo giao dịch mới nếu chưa có giao dịch nào tồn tại

④ Có nghĩa là mọi thao tác đều tham gia vào cùng một ngữ cảnh giao dịch

Đoạn mã trên dùng `ScopedValue` để quản lý các giao dịch lồng nhau. Nó bắt đầu một giao dịch ngoài và gắn nó vào một `ScopedValue`. Khi một giao dịch lồng bên trong được thử khởi tạo, mã sẽ kiểm tra xem đã có giao dịch nào được gắn hay chưa, thực chất là tham gia vào giao dịch ngoài. Điều này đảm bảo mọi thao tác, kể cả những thao tác lồng nhau, đều là một phần của cùng một giao dịch bao trùm, giúp đơn giản hóa việc quản lý và duy trì tính nhất quán của dữ liệu.

Nếu chạy đoạn mã này, chúng ta sẽ nhận được kết quả sau:

```text
Starting: OUTER_TX
  Joining existing transaction: OUTER_TX
    Executing in transaction: OUTER_TX
Committing: OUTER_TX
```

Một ví dụ khác xuất hiện trong đồ họa, nơi thường có một ngữ cảnh vẽ (drawing context) cần được chia sẻ giữa các phần của chương trình. Các `ScopedValue`, nhờ khả năng tự động dọn dẹp và tính re-entrant, phù hợp với việc này hơn các biến thread-local.

Hãy xem xét một ứng dụng đồ họa điển hình, nơi các thao tác vẽ, chẳng hạn màu sắc, độ rộng đường kẻ và các phép biến đổi, cần chia sẻ trạng thái. Các cách tiếp cận truyền thống dùng biến thread-local đòi hỏi việc dọn dẹp thủ công cẩn thận và dễ bị rò rỉ ngữ cảnh. `ScopedValue` sẽ cung cấp một lựa chọn thay thế gọn gàng và an toàn hơn.

Hãy xem các `ScopedValue` có thể quản lý ngữ cảnh vẽ trong một hệ phân cấp thành phần (component hierarchy) như thế nào:

```java
import java.awt.Color;

public class SimpleGraphicsExample {

    // Drawing context as ScopedValues
    private static final ScopedValue<Color> DRAW_COLOR
                              = ScopedValue.newInstance();  ①
    private static final ScopedValue<Integer> LINE_WIDTH
                              = ScopedValue.newInstance();

    // Simulated drawing methods
    static void drawLine(String from, String to) {
        Color color = DRAW_COLOR.isBound() ? DRAW_COLOR.get() : Color.BLACK
        int width = LINE_WIDTH.isBound() ? LINE_WIDTH.get() : 1;

        System.out.printf("Drawing line from %s to %s [Color: %s, Width: %d
            from, to, color.toString(), width);
    }

    static void drawRectangle(String name) {
        Color color = DRAW_COLOR.isBound() ? DRAW_COLOR.get() : Color.BLACK
        int width = LINE_WIDTH.isBound() ? LINE_WIDTH.get() : 1;

        System.out.printf("Drawing rectangle ’%s’ [Color: %s, Width: %d]\n
            name, color.toString(), width);
    }
```

① Các thuộc tính vẽ được khai báo dưới dạng các `ScopedValue`, cung cấp việc quản lý ngữ cảnh thread-safe.

② Việc kiểm tra `isBound()` đảm bảo chúng ta có phương án dự phòng khi chưa có ngữ cảnh nào được thiết lập.

Các thành phần trong một hệ phân cấp UI thường cần kiểu vẽ riêng của chúng trong khi vẫn kế thừa từ thành phần cha:

```java
// Component that draws itself and its children
    static void drawButton(String label) {
        System.out.println("\n--- Drawing Button: " + label + " ---");

        // Button uses blue color with thick border
        ScopedValue.where(DRAW_COLOR, Color.BLUE)  ①
            .where(LINE_WIDTH, 3)
            .run(() -> {
                drawRectangle("button-background");

                // Text inside button uses different color
                ScopedValue.where(DRAW_COLOR, Color.WHITE)  ②
                    .where(LINE_WIDTH, 1)
                    .run(() -> {
                        System.out.println("Drawing text: " + label);
                    });

                // Border automatically uses blue again
                drawRectangle("button-border");  ③
            });
    }
```

① Nút bấm tạo ngữ cảnh vẽ riêng của nó với màu xanh dương và độ rộng đường kẻ 3 pixel.

② Việc hiển thị văn bản tạm thời ghi đè màu thành trắng, minh họa việc lồng nhau an toàn.

③ Sau khi scope của văn bản kết thúc, ngữ cảnh màu xanh dương của nút bấm được tự động khôi phục.

Các container có thể thiết lập một ngữ cảnh vẽ ảnh hưởng đến tất cả các thành phần con của chúng:

```java
// Panel that contains multiple components
    static void drawPanel() {
        System.out.println("\n--- Drawing Panel ---");

        // Panel uses gray theme
        ScopedValue.where(DRAW_COLOR, Color.GRAY)
            .where(LINE_WIDTH, 2)
            .run(() -> {
                drawRectangle("panel-background");

                // Draw child components - each with their own style
                drawButton("OK");  ①
                drawButton("Cancel");

                // Back to panel’s gray automatically
                drawLine("divider-start", "divider-end");  ②
            });
    }
```

① Mỗi nút bấm duy trì ngữ cảnh vẽ riêng của nó, không bị ảnh hưởng bởi chủ đề màu xám của panel.

② Sau khi vẽ các thành phần con, ngữ cảnh của panel vẫn nguyên vẹn.

Bây giờ hãy xem phương thức `main` của chúng ta để hoàn tất ví dụ:

```java
void main() {
        System.out.println("=== Graphics Context Example ===\n");

        // Set default drawing context
        ScopedValue.where(DRAW_COLOR, Color.BLACK)  ①
            .where(LINE_WIDTH, 1)
            .run(() -> {
                // Draw with default black color
                drawLine("A", "B");

                // Draw a panel (which has its own colors)
                drawPanel();

                // Automatically back to black after panel
                System.out.println("\n--- Back to main context ---");
                drawLine("C", "D");  ②
            });

        // Outside the scope - no context available
        System.out.println("\n--- Outside any context ---");
        drawLine("E", "F");  // Will use defaults  ③
    }
}
```

① Thiết lập ngữ cảnh vẽ mặc định cho toàn bộ ứng dụng.

② Sau khi panel hoàn tất, ngữ cảnh chính được tự động khôi phục mà không cần can thiệp thủ công.

③ Các thao tác nằm ngoài bất kỳ ngữ cảnh nào sẽ quay về các giá trị mặc định hợp lý.

Chạy ví dụ này cho ra kết quả sau, thể hiện rõ ràng những thay đổi về ngữ cảnh:

```text
=== Graphics Context Example ===
Drawing line from A to B [Color: java.awt.Color[r=0,g=0,b=0], Width: 1]
--- Drawing Panel ---
Drawing rectangle 'panel-background' [Color: java.awt.Color[r=128,g=128,b=1
Width: 2]
--- Drawing Button: OK ---
Drawing rectangle 'button-background' [Color: java.awt.Color[r=0,g=0,b=255
Width: 3]
Drawing text: OK
Drawing rectangle 'button-border' [Color: java.awt.Color[r=0,g=0,b=255],
Width: 3]
--- Drawing Button: Cancel ---
Drawing rectangle 'button-background' [Color: java.awt.Color[r=0,g=0,b=255
Width: 3]
Drawing text: Cancel
Drawing rectangle 'button-border' [Color: java.awt.Color[r=0,g=0,b=255],
Width: 3]
Drawing line from divider-start to divider-end [Color: java.awt.Color
[r=128,g=128,b=128], Width: 2]
--- Back to main context ---
Drawing line from C to D [Color: java.awt.Color[r=0,g=0,b=0], Width: 1]
--- Outside any context ---
Drawing line from E to F [Color: java.awt.Color[r=0,g=0,b=0], Width: 1]
```

Giờ chúng ta đã hiểu những lợi ích của `ScopedValue`, hãy cân nhắc một vài yếu tố quan trọng trước khi di chuyển. Thứ nhất, API vẫn đang ở giai đoạn preview, nên tốt nhất là bạn hãy làm quen với nó và khám phá các khả năng của nó cho đến khi nó có sẵn trong JDK mà không đòi hỏi các cờ preview. Bằng cách này, bạn có thể áp dụng nó một cách liền mạch ngay khi nó được phát hành chính thức. Ngoài ra, việc di chuyển sang một JDK mới hơn nên là một cân nhắc then chốt, vì `ScopedValue` chỉ có sẵn trong JDK mới nhất. Hãy đánh giá bất kỳ ràng buộc nào bạn có thể gặp phải trước khi nâng cấp để đảm bảo quá trình chuyển đổi suôn sẻ.

Khi dùng `ScopedValue`, điều quan trọng là đảm bảo dữ liệu chúng ta định chia sẻ là immutable, vì `ScopedValue` bắt buộc tính bất biến. `ScopedValue` có thể không phải là lựa chọn phù hợp nếu trường hợp sử dụng của chúng ta đòi hỏi dữ liệu có thể thay đổi. Việc xác định tường minh scope của dữ liệu dùng chung bằng các phương thức `where()` và `run()` cũng quan trọng không kém. Điều này đảm bảo dữ liệu vẫn có thể truy cập được trong ngữ cảnh dự định, tránh những tác dụng phụ ngoài ý muốn.

Chúng ta cũng nên lưu tâm đến sự khác biệt trong cách xử lý giá trị `null` giữa `ScopedValue` và `ThreadLocal`. `ScopedValue` ném ra `NoSuchElementException` khi truy cập giá trị chưa được gắn, trong khi `ThreadLocal` trả về `null`. Cách xử lý lỗi tường minh này có thể giúp phát hiện vấn đề sớm nhưng đòi hỏi sự chú ý cẩn thận trong quá trình di chuyển.

Cuối cùng, điều thiết yếu là kiểm thử kỹ lưỡng ứng dụng của bạn sau khi áp dụng `ScopedValue` để đảm bảo tính đồng thời và tính nhất quán dữ liệu được bảo toàn, đồng thời giải quyết bất kỳ vấn đề không lường trước nào có thể phát sinh.

## Lời kết

`ScopedValue` mang lại một lựa chọn thay thế gọn gàng hơn, an toàn hơn và hiệu quả hơn so với `ThreadLocal` để chia sẻ ngữ cảnh xuyên suốt một chuỗi lời gọi. Nhờ tính bất biến và bị giới hạn trong một dynamic scope được xác định rõ ràng, nó giải quyết nhiều thiếu sót của `ThreadLocal`: khả năng thay đổi không giới hạn, vòng đời không giới hạn và chi phí bộ nhớ. Bản chất nhẹ của nó đặc biệt phù hợp với virtual thread và structured concurrency, giúp giảm mức sử dụng tài nguyên khi khởi tạo số lượng lớn các tác vụ đồng thời. Cú pháp tường minh của `where()` và `run()` làm rõ khi nào và ở đâu một giá trị nhất định có hiệu lực, cải thiện khả năng đọc và bảo trì mã.

Kể từ JDK 25, `ScopedValue` đã tốt nghiệp khỏi trạng thái preview và giờ là một API ổn định, sẵn sàng để sử dụng trong production. Sự ổn định hóa này đánh dấu nó là giải pháp được khuyến nghị cho việc lan truyền ngữ cảnh (context propagation) trong các ứng dụng Java hiện đại. Chúng ta có thể tự tin di chuyển mã hiện có dựa trên `ThreadLocal` sang dùng scoped value mà không lo ngại về những thay đổi API.
