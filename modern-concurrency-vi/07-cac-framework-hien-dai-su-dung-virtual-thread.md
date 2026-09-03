# Chương 7. Các framework hiện đại sử dụng virtual thread

*Cách tốt nhất để dự đoán tương lai là tạo ra nó.*

—Alan Kay

Với sự ra đời của virtual thread (luồng ảo) trong JDK 21, hệ sinh thái Java đã chứng kiến một sự thay đổi đáng kể trong cách các framework xử lý concurrency. Nhiều framework hiện đại đã đón nhận virtual thread để cải thiện hiệu năng, scalability và hiệu quả sử dụng tài nguyên.

Trong chương này, chúng ta sẽ khám phá cách các framework hàng đầu, chẳng hạn như Spring Boot, Quarkus và Jakarta EE, đang tích hợp virtual thread. Tuy nhiên, chúng ta sẽ không đi sâu vào cơ chế hoạt động bên trong của các framework này, vì tôi cho rằng những ai quan tâm sẽ muốn tự mình tìm hiểu kỹ từng framework.

Hãy bắt đầu nào.

## Spring Boot

[Spring Boot](https://oreil.ly/JE9kr) là một trong những framework mặc định trên thực tế (de facto) để xây dựng các ứng dụng doanh nghiệp trong hệ sinh thái Java.

Về mặt lịch sử, các ứng dụng web Spring Boot chủ yếu tuân theo mô hình *thread-per-request*, trong đó một platform thread riêng biệt xử lý từng request đến từ client. Mặc dù cách tiếp cận này hoạt động tốt dưới tải vừa phải, nó gặp phải những thách thức về scalability khi phải xử lý một lượng lớn request I/O-bound đồng thời, vì các request này luôn được phục vụ thông qua các platform thread.

Để giảm thiểu vấn đề này, Spring Boot đã giới thiệu các khả năng lập trình bất đồng bộ với các annotation như [`@Async`](https://oreil.ly/_7x7K) và các abstraction như [`TaskExecutor`](https://oreil.ly/Hkgxi). Tuy nhiên, cách tiếp cận này vẫn dựa vào các pool platform thread có giới hạn, như minh họa trong ví dụ sau:

```java
@Configuration
public class ThreadPoolConfig {
    @Bean
    public AsyncTaskExecutor applicationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(100);
        executor.initialize();
        return executor;
    }
}
```

Ở đây, mỗi request hoặc tác vụ tiêu tốn một thread từ một pool hữu hạn, có khả năng dẫn đến các nút thắt cổ chai về hiệu năng dưới tải nặng.

Với việc phát hành Spring Boot 3.2, được xây dựng trên Spring Framework 6.1, vào tháng 11 năm 2023, hỗ trợ chính thức cho Java 21, phiên bản đã hoàn thiện virtual thread, đã được giới thiệu. Mặc dù Java 17 vẫn là JDK cơ sở (baseline), Java 21 giờ đây được coi là một môi trường runtime hạng nhất trong framework. Một khía cạnh quan trọng của sự hỗ trợ này là việc cung cấp một thuộc tính cấu hình đơn giản để bật virtual thread:

```text
# application.properties
spring.threads.virtual.enabled=true .
```

Hoặc ở định dạng YAML:

```text
# application.yml
spring:
  threads:
    virtual:
      enabled: true
```

Việc thiết lập thuộc tính cấu hình này sẽ bật virtual thread trong toàn bộ ứng dụng. Spring Boot tự động cấu hình một [`AsyncTaskExecutor`](https://oreil.ly/8F5jm) được hỗ trợ bởi virtual thread (thông qua một [`SimpleAsyncTaskExecutor`](https://oreil.ly/h95RG)) khi không có bean executor tùy chỉnh nào được định nghĩa. Cấu hình này áp dụng một cách liền mạch cho nhiều tính năng liên quan đến concurrency, chẳng hạn như:

- Thực thi tác vụ bất đồng bộ ( [`@EnableAsync`](https://oreil.ly/ASk3i))

- Xử lý bất đồng bộ các giá trị trả về [`Callable`](https://oreil.ly/k5KXf) trong Spring

- Xử lý request bất đồng bộ của Spring Web MVC

- Hỗ trợ của Spring WebFlux cho việc thực thi blocking không thường xuyên

Hãy xem ví dụ sau:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingsController {
   private static final Logger LOGGER
           = LoggerFactory.getLogger(GreetingsController.class.getName());

   @GetMapping("/hello")
   public String hello() {
       LOGGER.info("Received request for /hello");
       LOGGER.info("Running on {}", Thread.currentThread());
       return "Hello from Spring Boot";
   }
}
```

Khi virtual thread được bật, nếu chúng ta chạy ứng dụng Spring Boot rồi gửi một request bằng curl đến endpoint, chúng ta sẽ thấy log sau trong console:

```text
06:11:51.355 [tomcat-handler-0] INFO  c.b.m.c.c.GreetingsController - Recei
quest for /hello
06:11:51.356 [tomcat-handler-0] INFO  c.b.m.c.c.GreetingsController - Runni
VirtualThread[#63,tomcat-handler-0]/runnable@ForkJoinPool-1-worker-1
```

Hãy xem xét một phương thức controller xử lý các request bất đồng bộ:

```java
import org.slf4j.Logger;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.concurrent.Callable;

@RestController
public class AsyncController {
   private static final Logger LOGGER
           = LoggerFactory.getLogger(AsyncController.class.getName());
   @GetMapping("/async-call")
   public Callable<String> handleAsyncRequest() {
       return () -> {
           Thread.sleep(500); // Simulate an I/O-bound operation
           LOGGER.info("Running on {}", Thread.currentThread());
           return "Hello from Virtual Thread!";
       };
   }
}
```

Nếu bạn bật virtual thread, bạn sẽ thấy output như sau:

```text
06:55:01.784 [task-1] INFO  c.b.m.c.controller.AsyncController - Running on
    alThread[#74,task-1]/runnable@ForkJoinPool-1-worker-1
```

Bây giờ, hãy khám phá một kịch bản thực tế khác liên quan đến các tác vụ được lập lịch (scheduled task):

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@EnableScheduling
@Component
public class ScheduledTasks {
   private static final Logger LOGGER
           = LoggerFactory.getLogger(ScheduledTasks.class.getName());
   @Scheduled(fixedRate = 1000)
   public void scheduledTask() {
       LOGGER.info("Scheduled task running on:  {}", Thread.currentThread(
   }
}
```

Với virtual thread được bật, log của tác vụ được lập lịch của bạn sẽ trông giống như sau:

```text
07:01:51.082 [scheduling-36] INFO  c.b.m.c.controller.ScheduledTasks - Sche
task running on:  VirtualThread[#105,scheduling-36]/runnable@ForkJoinPool-1
r-5
```

> **LƯU Ý**
>
> Spring Boot tự động cấu hình các executor và scheduler cho việc thực thi tác vụ một cách tiện lợi. Khi virtual thread được bật, nó tự động sử dụng [`SimpleAsyncTaskExecutor`](https://oreil.ly/ODEKW) (có tên `applicationTaskExecutor`) và [`SimpleAsyncTaskScheduler`](https://oreil.ly/nOpwy) (có tên `taskScheduler`). Khi không có virtual thread, nó mặc định sử dụng một [`ThreadPoolTaskExecutor`](https://oreil.ly/rs8sF) và [`ThreadPoolTaskScheduler`](https://oreil.ly/w769a) với các thiết lập có thể cấu hình. Bạn có thể dễ dàng tùy chỉnh các giá trị mặc định này hoặc tạo các executor và scheduler tùy chỉnh bằng cách sử dụng các lớp builder mà Spring Boot cung cấp. Cấu hình liền mạch này giúp đơn giản hóa việc quản lý concurrency và tối ưu hóa hiệu năng trong các ứng dụng của bạn.
>
### Cấu hình thủ công

Nếu chúng ta đang sử dụng một phiên bản Spring Boot cũ hơn (trước 3.2) hoặc muốn kiểm soát nhiều hơn đối với cấu hình executor của mình, chúng ta có thể định nghĩa một cách tường minh một executor được hỗ trợ bởi virtual thread.

Hãy xem xét cách tùy chỉnh này ( `applicationTaskExecutor`) hoạt động trong thực tế:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.support.TaskExecutorAdapter;
import java.util.concurrent.Executors;

@Configuration
public class VirtualThreadConfig {
  @Bean
  public AsyncTaskExecutor applicationTaskExecutor() {
    return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecuto
  }
}
```

Với cấu hình này, mọi việc sử dụng các phương thức `@Async` trong ứng dụng của bạn sẽ tự động chạy trên virtual thread thay vì các platform thread truyền thống, như minh họa ở đây:

```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;

@Component
public class RemoteApiService {
   @Async
   public CompletableFuture<String> fetchDataFromRemoteApi() {
       try {
           Thread.sleep(1000); // Simulating an I/O-bound operation
       } catch (InterruptedException e) {
           Thread.currentThread().interrupt();
       }
       return CompletableFuture
          .completedFuture("Data fetched using virtual thread");
   }
}
```

Trong mô hình lập trình bất đồng bộ của Spring, các phương thức được chú thích bằng `@Async` dựa vào `applicationTaskExecutor` đã được cấu hình. Nếu chúng ta thay thế executor mặc định bằng một executor dựa trên virtual thread, các phương thức `@Async` của chúng ta sẽ chạy liền mạch trên các virtual thread nhẹ.

> **MẸO**
>
> Khi cấu hình thủ công một executor virtual thread trong Spring Boot, điều quan trọng là phải hiểu sự khác biệt giữa việc sử dụng `TaskExecutorAdapter` và `Executors.newVirtualThreadPerTaskExecutor()`. Mặc dù cả hai đều bật virtual thread, `TaskExecutorAdapter` cung cấp sự tích hợp tốt hơn với việc quản lý vòng đời bean của Spring. Hãy cân nhắc các khả năng quản lý của Spring (ví dụ: khởi tạo, shutdown) khi lựa chọn cách tiếp cận phù hợp.
>
Ngoài ra, bạn có thể tận dụng virtual thread cho web server nhúng của mình để nâng cao scalability và mức sử dụng tài nguyên. Ví dụ, nếu bạn đang sử dụng Apache Tomcat làm web server nhúng, bạn có thể tùy chỉnh protocol handler của nó để sử dụng virtual thread bằng cách định nghĩa một bean [`TomcatProtocolHandlerCustomizer`](https://oreil.ly/mDDIk):

```java
import org.springframework.boot.web.embedded.tomcat
    .TomcatProtocolHandlerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executors;

@Configuration
public class TomcatConfig {

  @Bean
  public TomcatProtocolHandlerCustomizer<?> virtualThreadExecutor() {
    return protocolHandler
        -> protocolHandler.setExecutor(
              Executors.newVirtualThreadPerTaskExecutor());
  }
}
```

## Quarkus

[Quarkus](https://quarkus.io/) là một framework Java hiện đại được thiết kế để nhấn mạnh năng suất của lập trình viên, thời gian khởi động nhanh và hiệu năng hiệu quả. Nó lý tưởng cho việc xây dựng các microservice và ứng dụng serverless. Được xây dựng trên [Vert.x](https://vertx.io/) với mô hình lập trình reactive, Quarkus đã tích hợp hỗ trợ virtual thread một cách có chủ đích và tường minh, nâng cao sự phù hợp của nó cho các ứng dụng đồng thời.

Không giống như cách tiếp cận toàn cục, Quarkus giới thiệu một cách có mục tiêu để áp dụng virtual thread thông qua các annotation cụ thể. Lập trình viên có thể bật virtual thread một cách chọn lọc trên các endpoint hoặc service cụ thể bằng cách chú thích các phương thức với [`@RunOnVirtualThread`](https://oreil.ly/p2aCw). Annotation này chỉ thị cho Quarkus thực thi phương thức được chú thích trên một virtual thread thay vì một platform thread truyền thống. Framework xử lý hiệu quả vòng đời của các virtual thread này, bao gồm việc tạo, thực thi và quản lý vòng đời.

Quarkus tích hợp virtual thread chủ yếu thông qua các extension reactive của nó, kết hợp lập trình reactive với virtual threading. Cách tiếp cận này giúp các ứng dụng Quarkus xử lý concurrency một cách hiệu quả, khiến chúng đặc biệt phù hợp cho các môi trường microservice và serverless, nhờ khả năng khởi động nhanh và sử dụng tài nguyên hiệu quả.

> **LƯU Ý**
>
> Quarkus tận dụng Vert.x làm reactive engine nền tảng của nó. Mô hình concurrency event-loop của Vert.x khác với mô hình thread-per-request truyền thống. Annotation `@RunOnVirtualThread` của Quarkus cho phép lập trình viên chuyển các tác vụ cụ thể ra khỏi event loop của Vert.x sang các virtual thread, ngăn các thao tác blocking ảnh hưởng đến khả năng phản hồi của event loop. Sự kết hợp giữa lập trình reactive và virtual thread này nâng cao khả năng xử lý concurrency hiệu quả của Quarkus.
>
Dưới đây là một ví dụ thực tế về cách virtual thread được sử dụng trong Quarkus:

```java
package ca.bazlur;
import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/greetings")
public class VirtualThreadApp {
   private static final Logger logger
           = LoggerFactory.getLogger(VirtualThreadApp.class);
   @Inject
   @RestClient
   RemoteService remoteService;

   @GET
   @RunOnVirtualThread
   @Produces(MediaType.TEXT_PLAIN)
   public String process() {
       logger.info("Received greetings request");
       var response = remoteService.greetings();
       logger.info("Received response: {}", response);
       logger.info("Running on {}", Thread.currentThread());
       return response.toUpperCase();
   }
}
```

Phương thức `process()`, được chú thích bằng `@RunOnVirtualThread`, sẽ được thực thi trên một virtual thread.

Nếu chúng ta chạy đoạn mã này, chúng ta sẽ nhận được log sau trong console:

```text
2025-03-16 00:12:31,453 INFO  [ca.baz.VirtualThreadApp] (quarkus-virtual-th
1) Received greetings request
2025-03-16 00:12:31,458 INFO  [ca.baz.VirtualThreadApp] (quarkus-virtual-th
1) Received response: Hey!
2025-03-16 00:12:31,458 INFO  [ca.baz.VirtualThreadApp] (quarkus-virtual-th
1) Running on VirtualThread[#219,quarkus-virtual-thread-1]/runnable@ForkJoi
-1-worker-2
```

Log này chứng tỏ rằng phương thức `process` thực sự đang chạy trên các virtual thread.

Để kích hoạt remote service này, chúng ta đã tạo một interface như sau:

```java
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/remote")
@RegisterRestClient
public interface RemoteService {
   @Path("greetings")
   @GET
   @Produces(MediaType.TEXT_PLAIN)
   String greetings();
}
```

Để đăng ký nó, chúng ta cần mục sau trong file *application.properties*:

```text
quarkus.rest-client."ca.bazlur.RemoteService".url=http://localhost:8081
```

Chúng ta vừa tạo một REST endpoint đơn giản cho các service bên ngoài, phục vụ các thông điệp chào hỏi ngẫu nhiên. Chúng ta có thể dễ dàng tạo REST endpoint này bằng cách sử dụng các khả năng HTTP server tích hợp sẵn của Java. JDK bao gồm các lớp như [`HttpServer`](https://oreil.ly/fd9lJ) và [`HttpHandler`](https://oreil.ly/wphhE), cho phép chúng ta nhanh chóng thiết lập các dịch vụ HTTP nhẹ mà không cần thêm framework hay dependency nào:

```java
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.Random;
import java.util.concurrent.Executors;

public class SimpleHttpServer {
   private static final String[] GREETINGS = {
           "Hello, world!",
           "Hi there!",
           "Greetings!",
           "Good day!",
           "Hey!",
           "Howdy!",
           "Hola!",
           "Bonjour!",
           "Ciao!"
   };

   public static void main(String[] args) throws IOException {
       int port = 8081;
       HttpServer server = HttpServer.create(new InetSocketAddress(port), 0
       server.createContext("/remote/greetings", new GreetingHandler());
       server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
       System.out.println("Server started on port " + port);
       server.start();
   }

   static class GreetingHandler implements HttpHandler {
       @Override
       public void handle(HttpExchange exchange) throws IOException {
           if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
               String response = getRandomGreeting();
               exchange.sendResponseHeaders(200, response.length());
               try (OutputStream os = exchange.getResponseBody()) {
                   os.write(response.getBytes());
               }
           } else {
               exchange.sendResponseHeaders(405, -1); // Method Not Allowed
           }
       }

       private String getRandomGreeting() {
           Random random = new Random();
           return GREETINGS[random.nextInt(GREETINGS.length)];
       }
   }
}
```

> **MẸO**
>
> Chúng ta có thể chạy trực tiếp server này bằng tính năng khởi chạy từ file mã nguồn (source-file launching) của Java, có sẵn từ Java 11 trở đi. Tính năng này cho phép chúng ta thực thi các chương trình Java một file mà không cần các bước biên dịch tường minh. Chỉ cần mở terminal của bạn và chạy lệnh:
>
> ```bash
> java SimpleHttpServer.java
> ```
>
> Lệnh này biên dịch và chạy file trong một bước, loại bỏ nhu cầu sử dụng `javac` thủ công. Nó lý tưởng để nhanh chóng tạo prototype hoặc chạy các ứng dụng Java độc lập đơn giản.
>
Chúng ta thậm chí có thể tích hợp các khả năng lập trình reactive của Quarkus với virtual thread. Hãy xem đoạn mã sau:

```java
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import io.smallrye.common.annotation.RunOnVirtualThread;
import io.smallrye.mutiny.Uni;
import java.time.Duration;
import jakarta.enterprise.context.ApplicationScoped;

@Path("/reactive")
public class ReactiveResource {
   @Inject
   HelloService helloService;
   @GET
   @Path("/hello")
   @RunOnVirtualThread
   @Produces(MediaType.TEXT_PLAIN)
   public String hello() {
       return helloService.getHello()
               .await()
               .atMost(Duration.ofSeconds(5));
   }
}

@ApplicationScoped
class HelloService {
   @Inject
   @RestClient
   ExternalService externalService;
   Uni<String> getHello() {
       return externalService.hello();
   }
}

@Path("/reactive")
@RegisterRestClient
interface ExternalService {
   @GET
   @Path("/hello")
   Uni<String> hello();
}
```

Phương thức `hello()` trong `ReactiveResource` gọi một service bên ngoài bằng một REST client reactive ( `ExternalService`). Phương thức `getHello()` trả về một `Uni<String>`, đại diện cho một phép tính được trì hoãn (deferred computation). Bên trong phương thức `hello()`, `uni.await().atMost(Duration.ofSeconds(5))` được sử dụng để block virtual thread cho đến khi kết quả sẵn sàng hoặc xảy ra timeout.

### Jakarta EE

[Jakarta Concurrency](https://oreil.ly/JbYoV) là một đặc tả tiêu chuẩn cho phép các ứng dụng sử dụng concurrency trong khi vẫn duy trì các lợi ích của việc chạy bên trong một runtime [Jakarta EE](https://jakarta.ee/). Việc phát hành [Jakarta Concurrency 3.1](https://oreil.ly/ffFz_) đã giới thiệu hỗ trợ cho virtual thread, cho phép các ứng dụng tận dụng mô hình threading nhẹ của Java 21.

Virtual thread có thể được bật trong Jakarta Concurrency 3.1 bằng cách chỉ định `virtual = true` trong các annotation sau:

```text
@ManagedExecutorDefinition
@ManagedScheduledExecutorDefinition
@ManagedThreadFactory
```

Khi chạy trên Java 21, virtual thread sẽ được sử dụng; tuy nhiên, nếu ứng dụng chạy trên Java 17, phiên bản không hỗ trợ virtual thread, các runtime Jakarta EE sẽ tự động quay về (fall back) sử dụng platform thread.

Ví dụ sau minh họa cách cấu hình và sử dụng virtual thread trong Jakarta Concurrency 3.1:

```java
import jakarta.enterprise.concurrent.ManagedExecutorDefinition;
import jakarta.enterprise.concurrent.ManagedExecutorService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.concurrent.ExecutionException;

@ManagedExecutorDefinition(name = "java:module/concurrent/virtual-executor
    qualifiers = WithVirtualThreads.class,
    virtual = true)
@Path("/virtualThreads")
public class VirtualThreadExampleService {

  @Inject
  @WithVirtualThreads
  ManagedExecutorService virtualManagedExecutor;

  @Inject
  GreetingService greetingService;

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  public String virtualThreads()
          throws InterruptedException, ExecutionException {
      return virtualManagedExecutor.submit(() -> {
          System.out.println("Received request on virtual thread: "
              + Thread.currentThread());
          return greetingService.getRandomGreeting();
      }).get();
}
}
```

Bây giờ, nếu chúng ta chạy đoạn mã trên bằng runtime Open Liberty, chúng ta sẽ truy cập endpoint sau:

```text
GET http://localhost:9080/api/virtualThreads
```

Bạn sẽ thấy phần thực thi để lấy lời chào ngẫu nhiên; nó sẽ nằm trên các virtual thread:

```text
[INFO] Received request on virtual thread: VirtualThread[#115,application[j
ee-vthrads]/module[jakartaee-vthrads.war]/managedExecutorService[java:modul
urrent/virtual-executor]/concurrencyPolicy:1]/runnable@ForkJoinPool-1-worke
```

Tương tự, nếu chúng ta muốn chạy virtual thread trên một `ManagedScheduledExecutorService` cho phép thực thi tác vụ định kỳ hoặc có độ trễ, chúng ta sẽ làm như sau:

```java
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.concurrent.ManagedScheduledExecutorService;
import jakarta.enterprise.concurrent.ManagedScheduledExecutorDefinition;

import java.util.concurrent.TimeUnit;

@ApplicationScoped
@ManagedScheduledExecutorDefinition(
    name = "java:module/concurrent/virtual-scheduler",
    virtual = true // Enables Virtual Threads for Scheduled Tasks
)
public class VirtualThreadSchedulerExample {

  @Resource(lookup = "java:module/concurrent/virtual-scheduler")
  private ManagedScheduledExecutorService scheduledExecutor;

  public void scheduleTask() {
    scheduledExecutor.schedule(() -> {
      System.out.println("Scheduled task running in virtual thread: "
          + Thread.currentThread());
    }, 5, TimeUnit.SECONDS); // Delay execution by 5 seconds
  }
}
```

> **LƯU Ý**
>
> Mặc dù Jakarta Concurrency 3.1 cung cấp các đặc tả cho việc sử dụng virtual thread, hành vi thực tế có thể khác nhau giữa các runtime Jakarta EE. Bạn nên lưu ý đến các vấn đề tương thích tiềm ẩn và đọc tài liệu của runtime Jakarta EE cụ thể mà mình dùng (ví dụ: Open Liberty, Payara, WildFly) để biết các chi tiết triển khai cụ thể và các thực hành tốt nhất. Ví dụ, các tính năng và cấu hình có thể hoạt động khác nhau hoặc có thể không có mặt trong tất cả các runtime Jakarta EE.
>
Tại thời điểm viết cuốn sách này, Open Liberty 24.0.0.6-beta là runtime Jakarta EE đầu tiên hỗ trợ đầy đủ Jakarta Concurrency 3.1 với virtual thread. Tuy nhiên, khi Jakarta EE 11 tiến gần đến bản phát hành chính thức, các runtime Jakarta EE khác, chẳng hạn như Payara, WildFly, TomEE và GlassFish, được kỳ vọng sẽ tích hợp hỗ trợ virtual thread.

## Lời kết

Bên cạnh các framework lớn như Jakarta EE, Spring và Quarkus, một số framework khác cũng đã đón nhận virtual thread để nâng cao hiệu quả concurrency trong các ứng dụng Java hiện đại.

Một framework như vậy là [Helidon Níma](https://helidon.io/nima), một framework microservice được thiết kế từ đầu để tận dụng virtual thread một cách tự nhiên (natively). Không giống như các framework truyền thống bổ sung hỗ trợ virtual thread sau này (retrofit), Helidon Níma được xây dựng xoay quanh virtual thread, khiến nó trở thành một giải pháp nhẹ và hiệu năng cao cho các microservice.

Tương tự, framework [Micronaut](https://micronaut.io/) tự động sử dụng virtual thread nếu ứng dụng chạy trên một phiên bản JDK hỗ trợ virtual thread (Java 21 trở lên). Điều này có nghĩa là các lập trình viên sử dụng Micronaut có thể hưởng lợi một cách minh bạch từ những cải thiện hiệu năng của virtual thread mà không cần cấu hình thêm.

Khi Java tiếp tục phát triển, virtual thread đã trở thành một tính năng then chốt để xây dựng các ứng dụng có khả năng mở rộng, hiệu quả và thân thiện với lập trình viên. Dù sử dụng Jakarta EE 11, Quarkus, Spring Boot 3, Helidon Níma hay Micronaut, các lập trình viên giờ đây đã có những công cụ mạnh mẽ để viết các ứng dụng có tính đồng thời cao trong khi vẫn duy trì một phong cách lập trình mệnh lệnh (imperative) đơn giản.

Với virtual thread giờ đây đã là một phần không thể thiếu của hệ sinh thái Java, tương lai của concurrency trong Java trông hiệu quả hơn, có khả năng mở rộng hơn và thân thiện với lập trình viên hơn bao giờ hết.
