# Chương 7. Xử lý dữ liệu song song và hiệu năng

> **Nội dung chương này**
>
> - Xử lý dữ liệu song song với parallel stream
> - Phân tích hiệu năng của parallel stream
> - Fork/join framework
> - Chia nhỏ một stream dữ liệu bằng Spliterator

Trong ba chương vừa qua, bạn đã thấy interface Streams mới cho phép thao tác trên các tập hợp dữ liệu theo phong cách khai báo (declarative) như thế nào. Chúng tôi cũng đã giải thích rằng việc chuyển từ external iteration sang internal iteration cho phép thư viện Java gốc giành quyền kiểm soát việc xử lý các phần tử của một stream. Cách tiếp cận này giải phóng lập trình viên Java khỏi việc phải tự tay cài đặt những tối ưu hoá cần thiết để tăng tốc quá trình xử lý các tập hợp dữ liệu. Lợi ích quan trọng nhất, vượt xa mọi lợi ích khác, là khả năng thực thi một pipeline các thao tác trên những tập hợp này sao cho tự động tận dụng được nhiều nhân (core) trên máy tính của bạn.

Chẳng hạn, trước Java 7, việc xử lý song song một tập hợp dữ liệu là cực kỳ rườm rà. Thứ nhất, bạn cần chia một cách tường minh cấu trúc dữ liệu chứa dữ liệu của mình thành các phần con. Thứ hai, bạn cần gán mỗi phần con đó cho một thread khác nhau. Thứ ba, bạn cần đồng bộ hoá chúng đúng lúc để tránh các race condition không mong muốn, chờ tất cả các thread hoàn tất, và cuối cùng kết hợp các kết quả bộ phận lại. Java 7 đã giới thiệu một framework tên là fork/join để thực hiện những thao tác này một cách nhất quán hơn và ít gây lỗi hơn. Chúng ta sẽ khám phá framework này trong mục 7.2.

Trong chương này, bạn sẽ khám phá cách interface Streams cho bạn cơ hội thực thi các thao tác song song trên một tập hợp dữ liệu mà không tốn nhiều công sức. Nó cho phép bạn biến một sequential stream thành một parallel stream theo kiểu khai báo. Hơn nữa, bạn sẽ thấy Java làm được điều kỳ diệu này bằng cách nào, hay nói thực tế hơn, parallel stream hoạt động ra sao bên dưới lớp vỏ bằng cách sử dụng fork/join framework được giới thiệu trong Java 7. Bạn cũng sẽ nhận ra rằng việc hiểu parallel stream vận hành nội bộ như thế nào là điều quan trọng, bởi nếu bỏ qua khía cạnh này, bạn có thể thu được những kết quả bất ngờ (và nhiều khả năng là sai) do dùng chúng sai cách.

Cụ thể, chúng tôi sẽ chứng minh rằng cách một parallel stream được chia thành các khối (chunk) trước khi xử lý song song các khối khác nhau, trong một số trường hợp, chính là nguồn gốc của những kết quả sai và có vẻ như không thể giải thích được đó. Vì lý do này, bạn sẽ học cách kiểm soát quá trình chia nhỏ (splitting) đó bằng việc tự cài đặt và sử dụng Spliterator của riêng mình.

## 7.1. Parallel streams

Ở chương 4, chúng ta đã đề cập ngắn gọn rằng interface Streams cho phép bạn xử lý các phần tử của nó song song một cách tiện lợi: có thể biến một collection thành một parallel stream bằng cách gọi phương thức parallelStream trên nguồn collection đó. Một parallel stream là một stream chia các phần tử của nó thành nhiều khối, xử lý mỗi khối bằng một thread khác nhau. Nhờ vậy, bạn có thể tự động phân bổ khối lượng công việc của một thao tác cho tất cả các nhân của bộ xử lý đa nhân và giữ cho tất cả chúng đều bận rộn như nhau. Hãy thử nghiệm ý tưởng này bằng một ví dụ đơn giản.

Giả sử bạn cần viết một phương thức nhận một số n làm đối số và trả về tổng các số từ một đến n. Một cách tiếp cận thẳng thắn (có lẽ hơi ngây thơ) là sinh ra một stream vô hạn các số, giới hạn nó ở số lượng được truyền vào, rồi reduce stream kết quả bằng một BinaryOperator cộng hai số, như sau:

```java
public long sequentialSum(long n) {
    return Stream.iterate(1L, i -> i + 1)   // Sinh ra stream vô hạn các số tự nhiên
                 .limit(n)                  // Giới hạn ở n số đầu tiên
                 .reduce(0L, Long::sum);    // Reduce stream bằng cách cộng tất cả các số
}
```

Theo lối Java truyền thống hơn, đoạn code này tương đương với phiên bản lặp của nó:

```java
public long iterativeSum(long n) {
    long result = 0;
    for (long i = 1L; i <= n; i++) {
        result += i;
    }
    return result;
}
```

Thao tác này có vẻ là một ứng viên tốt để song song hoá, đặc biệt với các giá trị n lớn. Nhưng bạn bắt đầu từ đâu? Bạn có đồng bộ hoá trên biến result không? Bạn dùng bao nhiêu thread? Ai chịu trách nhiệm sinh ra các số? Ai cộng chúng lại?

Đừng lo lắng về tất cả những điều đó. Bài toán sẽ đơn giản hơn nhiều nếu bạn dùng parallel stream!

### 7.1.1. Chuyển một sequential stream thành parallel stream

Bạn có thể làm cho quá trình functional reduction (tính tổng) trước đó chạy song song bằng cách biến stream thành parallel stream; hãy gọi phương thức parallel trên sequential stream:

```java
public long parallelSum(long n) {
    return Stream.iterate(1L, i -> i + 1)
                 .limit(n)
                 .parallel()                // Biến stream thành parallel stream
                 .reduce(0L, Long::sum);
}
```

Trong đoạn code trên, quá trình reduction dùng để cộng tất cả các số trong stream hoạt động theo cách tương tự như được mô tả ở mục 5.4.1. Điểm khác biệt là giờ đây stream được chia nội bộ thành nhiều khối. Kết quả là thao tác reduction có thể làm việc trên các khối khác nhau một cách độc lập và song song, như minh hoạ ở hình 7.1. Cuối cùng, chính thao tác reduction đó kết hợp các giá trị thu được từ những reduction bộ phận của mỗi substream, tạo ra kết quả của quá trình reduction trên toàn bộ stream ban đầu.

> **Hình 7.1.** Một thao tác reduction song song

Lưu ý rằng trên thực tế, việc gọi phương thức parallel trên một sequential stream không kéo theo bất kỳ biến đổi cụ thể nào trên chính stream đó. Bên trong, một cờ boolean được đặt để báo hiệu rằng bạn muốn chạy song song tất cả các thao tác đứng sau lời gọi parallel. Tương tự, bạn có thể biến một parallel stream thành sequential stream bằng cách gọi phương thức sequential trên nó. Lưu ý rằng bạn có thể nghĩ rằng bằng cách kết hợp hai phương thức này, bạn có thể đạt được sự kiểm soát chi tiết hơn về việc thao tác nào muốn thực hiện song song và thao tác nào tuần tự trong khi duyệt stream. Ví dụ, bạn có thể viết đại loại như sau:

```java
stream.parallel()
      .filter(...)
      .sequential()
      .map(...)
      .parallel()
      .reduce();
```

Nhưng lời gọi parallel hoặc sequential cuối cùng mới là lời gọi thắng thế và ảnh hưởng đến toàn bộ pipeline. Trong ví dụ này, pipeline sẽ được thực thi song song vì đó là lời gọi cuối cùng trong pipeline.

> **Cấu hình thread pool được parallel stream sử dụng**
>
> Nhìn vào phương thức parallel của stream, có lẽ bạn sẽ tự hỏi những thread mà parallel stream dùng đến từ đâu, có bao nhiêu thread, và bạn có thể tuỳ biến quá trình này ra sao.
>
> Parallel stream sử dụng nội bộ ForkJoinPool mặc định (bạn sẽ học thêm về fork/join framework ở mục 7.2), mà theo mặc định có số thread bằng số bộ xử lý bạn có, như giá trị được trả về bởi `Runtime.getRuntime().availableProcessors()`.
>
> Nhưng bạn có thể thay đổi kích thước của pool này bằng system property `java.util.concurrent.ForkJoinPool.common.parallelism`, như trong ví dụ sau:
>
> ```java
> System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "12");
> ```
>
> Đây là một thiết lập toàn cục, nên nó sẽ ảnh hưởng đến tất cả các parallel stream trong code của bạn. Ngược lại, hiện tại không thể chỉ định giá trị này cho riêng một parallel stream đơn lẻ. Nói chung, việc để kích thước của ForkJoinPool bằng số bộ xử lý trên máy của bạn là một giá trị mặc định hợp lý, và chúng tôi khuyến nghị mạnh mẽ rằng bạn không nên sửa đổi nó trừ khi có lý do chính đáng.

Quay lại bài tập tính tổng các số, chúng ta đã nói rằng bạn có thể kỳ vọng một cải thiện hiệu năng đáng kể ở phiên bản song song khi chạy nó trên một bộ xử lý đa nhân. Giờ đây bạn có ba phương thức thực hiện chính xác cùng một thao tác theo ba cách khác nhau (kiểu lặp, sequential reduction, và parallel reduction), vậy hãy xem cái nào nhanh nhất!

### 7.1.2. Đo hiệu năng của stream

Chúng ta đã khẳng định rằng phương thức tính tổng được song song hoá sẽ chạy tốt hơn phương thức tuần tự và phương thức lặp. Tuy nhiên, trong kỹ nghệ phần mềm, phỏng đoán không bao giờ là ý tưởng hay! Khi tối ưu hiệu năng, bạn luôn phải tuân theo ba quy tắc vàng: đo, đo, và đo. Vì mục đích này, chúng ta sẽ cài đặt một microbenchmark bằng một thư viện có tên Java Microbenchmark Harness (JMH). Đây là một bộ công cụ giúp tạo ra, theo một cách đơn giản dựa trên annotation, những microbenchmark đáng tin cậy cho các chương trình Java và cho bất kỳ ngôn ngữ nào khác nhắm tới Java Virtual Machine (JVM). Trên thực tế, phát triển các benchmark đúng đắn và có ý nghĩa cho những chương trình chạy trên JVM không phải là việc dễ dàng, bởi có nhiều yếu tố cần cân nhắc như thời gian warm-up mà HotSpot cần để tối ưu bytecode và overhead do garbage collector gây ra. Nếu bạn dùng Maven làm công cụ build, thì để bắt đầu sử dụng JMH trong dự án, bạn thêm một vài dependency vào file pom.xml (file định nghĩa quá trình build của Maven).

```xml
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.17.4</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.17.4</version>
</dependency>
```

Thư viện thứ nhất là phần cài đặt lõi của JMH, trong khi thư viện thứ hai chứa một annotation processor giúp sinh ra một file Java Archive (JAR) mà thông qua đó bạn có thể chạy benchmark một cách tiện lợi, một khi bạn cũng đã thêm plugin sau vào cấu hình Maven của mình:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-shade-plugin</artifactId>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals><goal>shade</goal></goals>
                    <configuration>
                        <finalName>benchmarks</finalName>
                        <transformers>
                            <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                <mainClass>org.openjdk.jmh.Main</mainClass>
                            </transformer>
                        </transformers>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

Sau khi làm xong việc này, bạn có thể benchmark phương thức sequentialSum được giới thiệu ở đầu mục này một cách đơn giản, như trong listing tiếp theo.

**Listing 7.1. Đo hiệu năng của một hàm tính tổng n số đầu tiên**

```java
// Đo thời gian trung bình mà phương thức được benchmark tiêu tốn
@BenchmarkMode(Mode.AverageTime)
// In kết quả benchmark với đơn vị thời gian là mili giây
@OutputTimeUnit(TimeUnit.MILLISECONDS)
// Thực thi benchmark 2 lần để tăng độ tin cậy của kết quả, với 4Gb heap space
@Fork(2, jvmArgs = {"-Xms4G", "-Xmx4G"})
public class ParallelStreamBenchmark {
    private static final long N = 10_000_000L;

    @Benchmark                              // Phương thức cần được benchmark
    public long sequentialSum() {
        return Stream.iterate(1L, i -> i + 1).limit(N)
                     .reduce(0L, Long::sum);
    }

    // Cố gắng chạy garbage collector sau mỗi lần lặp của benchmark
    @TearDown(Level.Invocation)
    public void tearDown() {
        System.gc();
    }
}
```

Khi bạn biên dịch class này, plugin Maven được cấu hình ở trên sẽ sinh ra một file JAR thứ hai tên là benchmarks.jar mà bạn có thể chạy như sau:

```bash
java -jar ./target/benchmarks.jar ParallelStreamBenchmark
```

Chúng tôi đã cấu hình benchmark sử dụng một vùng heap quá khổ để tránh tối đa mọi ảnh hưởng của garbage collector, và cũng vì lý do đó, chúng tôi đã cố ép garbage collector chạy sau mỗi lần lặp của benchmark. Bất chấp tất cả những biện pháp phòng ngừa này, cần lưu ý rằng các kết quả nên được tiếp nhận một cách dè dặt. Nhiều yếu tố sẽ ảnh hưởng đến thời gian thực thi, chẳng hạn như máy của bạn hỗ trợ bao nhiêu nhân! Bạn có thể tự thử nghiệm trên máy của mình bằng cách chạy code có sẵn trong repository của cuốn sách.

Khi bạn khởi chạy lệnh trên, JMH sẽ thực hiện 20 lần lặp warm-up của phương thức được benchmark để HotSpot có thể tối ưu code, rồi sau đó thêm 20 lần lặp nữa được dùng để tính kết quả cuối cùng. 20+20 lần lặp này là hành vi mặc định của JMH, nhưng bạn có thể thay đổi cả hai giá trị này hoặc thông qua các annotation đặc thù khác của JMH, hoặc tiện hơn nữa, bằng cách thêm chúng vào dòng lệnh với các cờ -w và -i. Thực thi trên một máy tính trang bị Intel i7-4600U 2.1 GHz bốn nhân, nó in ra kết quả sau:

```text
Benchmark                              Mode  Cnt    Score   Error  Units
ParallelStreamBenchmark.sequentialSum  avgt   40  121.843 ± 3.062  ms/op
```

Bạn nên kỳ vọng rằng phiên bản lặp dùng vòng for truyền thống chạy nhanh hơn nhiều vì nó làm việc ở mức thấp hơn nhiều và, quan trọng hơn, không cần thực hiện bất kỳ thao tác boxing hay unboxing nào trên các giá trị primitive. Chúng ta có thể kiểm chứng trực giác này bằng cách thêm một phương thức thứ hai vào class benchmark của listing 7.1 và cũng chú thích nó bằng @Benchmark:

```java
@Benchmark
public long iterativeSum() {
    long result = 0;
    for (long i = 1L; i <= N; i++) {
        result += i;
    }
    return result;
}
```

Chạy benchmark thứ hai này (có thể bạn nên comment phần benchmark đầu tiên lại để tránh chạy lại nó) trên máy thử nghiệm của chúng tôi, chúng tôi thu được kết quả sau:

```text
Benchmark                             Mode  Cnt  Score   Error  Units
ParallelStreamBenchmark.iterativeSum  avgt   40  3.278 ± 0.192  ms/op
```

Điều này xác nhận kỳ vọng của chúng ta: phiên bản lặp nhanh hơn gần 40 lần so với phiên bản dùng sequential stream, vì những lý do chúng ta đã dự đoán. Bây giờ hãy làm điều tương tự với phiên bản dùng parallel stream, cũng thêm phương thức đó vào class benchmark. Chúng tôi thu được kết quả sau:

```text
Benchmark                            Mode  Cnt    Score    Error  Units
ParallelStreamBenchmark.parallelSum  avgt   40  604.059 ± 55.288  ms/op
```

Điều này khá đáng thất vọng: phiên bản song song của phương thức tính tổng chẳng tận dụng được chút lợi thế nào từ CPU bốn nhân của chúng ta và còn chậm hơn khoảng năm lần so với phiên bản tuần tự. Bạn giải thích kết quả bất ngờ này thế nào? Có hai vấn đề trộn lẫn vào nhau:

- iterate sinh ra các đối tượng đã được boxing, mà những đối tượng này phải được unboxing về số trước khi có thể cộng lại.
- iterate khó chia thành các khối độc lập để thực thi song song.

Vấn đề thứ hai đặc biệt thú vị vì bạn cần giữ một mô hình tư duy rằng một số thao tác trên stream dễ song song hoá hơn những thao tác khác. Cụ thể, thao tác iterate rất khó chia thành các khối có thể thực thi độc lập, bởi đầu vào của một lần áp dụng hàm luôn phụ thuộc vào kết quả của lần áp dụng trước đó, như minh hoạ ở hình 7.2.

> **Hình 7.2.** iterate về bản chất là tuần tự.

Điều này có nghĩa là trong trường hợp cụ thể này, quá trình reduction không diễn ra như mô tả ở hình 7.1: toàn bộ danh sách các số không sẵn có ngay từ đầu quá trình reduction, khiến việc phân hoạch stream thành các khối để xử lý song song một cách hiệu quả trở nên bất khả thi. Bằng cách đánh dấu stream là parallel, bạn chỉ đang thêm vào quá trình xử lý tuần tự cái overhead của việc phân bổ mỗi thao tác cộng cho một thread khác nhau.

Điều này cho thấy lập trình song song có thể phức tạp và đôi khi phản trực giác đến mức nào. Khi bị dùng sai (ví dụ, dùng một thao tác không thân thiện với song song hoá như iterate), nó có thể làm tệ đi hiệu năng tổng thể của chương trình, nên bắt buộc phải hiểu điều gì diễn ra hậu trường khi bạn gọi phương thức parallel tưởng chừng như kỳ diệu đó.

**Sử dụng các phương thức chuyên biệt hơn**

Vậy làm sao bạn có thể tận dụng bộ xử lý đa nhân và dùng stream để thực hiện phép tính tổng song song một cách hiệu quả? Chúng ta đã bàn về một phương thức tên là LongStream.rangeClosed ở chương 5. Phương thức này có hai lợi ích so với iterate:

- LongStream.rangeClosed làm việc trực tiếp trên các số primitive long nên không có overhead boxing và unboxing.
- LongStream.rangeClosed tạo ra các khoảng số, vốn có thể dễ dàng được chia thành các khối độc lập. Ví dụ, khoảng 1–20 có thể được chia thành 1–5, 6–10, 11–15, và 16–20.

Trước hết hãy xem nó hoạt động thế nào trên một sequential stream bằng cách thêm phương thức sau vào class benchmark để kiểm tra xem overhead liên quan đến unboxing có đáng kể hay không:

```java
@Benchmark
public long rangedSum() {
    return LongStream.rangeClosed(1, N)
                     .reduce(0L, Long::sum);
}
```

Lần này đầu ra là:

```text
Benchmark                          Mode  Cnt  Score   Error  Units
ParallelStreamBenchmark.rangedSum  avgt   40  5.315 ± 0.285  ms/op
```

Numeric stream nhanh hơn nhiều so với phiên bản tuần tự trước đó vốn được sinh ra bằng factory method iterate, bởi numeric stream tránh được toàn bộ overhead gây ra bởi những thao tác autoboxing và auto-unboxing không cần thiết mà stream không chuyên biệt phải thực hiện. Đây là bằng chứng cho thấy việc chọn đúng cấu trúc dữ liệu thường quan trọng hơn việc song song hoá thuật toán sử dụng chúng. Nhưng điều gì xảy ra nếu bạn thử dùng parallel stream trong phiên bản mới sau đây?

```java
@Benchmark
public long parallelRangedSum() {
    return LongStream.rangeClosed(1, N)
                     .parallel()
                     .reduce(0L, Long::sum);
}
```

Bây giờ, thêm phương thức này vào class benchmark, chúng tôi thu được:

```text
Benchmark                                 Mode  Cnt  Score   Error  Units
ParallelStreamBenchmark.parallelRangedSum avgt   40  2.677 ± 0.214  ms/op
```

Cuối cùng, chúng ta cũng có một parallel reduction nhanh hơn phiên bản tuần tự tương ứng, bởi lần này thao tác reduction có thể được thực thi như trình bày ở hình 7.1. Điều này cũng chứng minh rằng việc dùng đúng cấu trúc dữ liệu rồi mới cho nó chạy song song sẽ đảm bảo hiệu năng tốt nhất. Lưu ý rằng phiên bản mới nhất này cũng nhanh hơn khoảng 20% so với phiên bản lặp ban đầu, cho thấy rằng khi được dùng đúng cách, phong cách functional-programming cho phép chúng ta tận dụng tính song song của các CPU đa nhân hiện đại theo cách đơn giản và trực tiếp hơn so với phiên bản mệnh lệnh (imperative) tương ứng.

Tuy nhiên, hãy nhớ rằng song song hoá không phải là thứ miễn phí. Bản thân quá trình song song hoá đòi hỏi bạn phải phân hoạch đệ quy stream, gán thao tác reduction của mỗi substream cho một thread khác nhau, rồi kết hợp kết quả của những thao tác này thành một giá trị duy nhất. Nhưng việc di chuyển dữ liệu giữa nhiều nhân cũng đắt hơn bạn tưởng, nên điều quan trọng là công việc cần làm song song trên một nhân khác phải tốn nhiều thời gian hơn thời gian cần thiết để chuyển dữ liệu từ nhân này sang nhân kia. Nói chung, có nhiều trường hợp mà việc song song hoá là không thể hoặc không thuận tiện. Nhưng trước khi dùng parallel stream để làm code chạy nhanh hơn, bạn phải chắc chắn rằng mình đang dùng nó đúng cách; sẽ chẳng ích gì nếu tạo ra kết quả trong thời gian ngắn hơn mà kết quả lại sai. Hãy cùng xem một cạm bẫy phổ biến.

### 7.1.3. Sử dụng parallel stream đúng cách

Nguyên nhân chính gây ra các lỗi do dùng sai parallel stream là việc sử dụng những thuật toán làm biến đổi (mutate) một trạng thái được chia sẻ. Sau đây là một cách cài đặt phép tính tổng n số tự nhiên đầu tiên bằng cách biến đổi một accumulator dùng chung:

```java
public long sideEffectSum(long n) {
    Accumulator accumulator = new Accumulator();
    LongStream.rangeClosed(1, n).forEach(accumulator::add);
    return accumulator.total;
}

public class Accumulator {
    public long total = 0;
    public void add(long value) { total += value; }
}
```

Việc viết loại code này khá phổ biến, đặc biệt với những lập trình viên quen thuộc với các mô hình lập trình mệnh lệnh. Đoạn code này rất giống với những gì bạn vẫn làm khi duyệt một danh sách số theo lối mệnh lệnh: bạn khởi tạo một accumulator và duyệt lần lượt từng phần tử trong danh sách, cộng chúng vào accumulator.

Đoạn code này sai ở chỗ nào? Đáng tiếc là nó hỏng không thể cứu vãn được, bởi nó về bản chất là tuần tự. Bạn có một data race ở mỗi lần truy cập total. Và nếu bạn cố sửa điều đó bằng đồng bộ hoá, bạn sẽ mất hết tính song song. Để hiểu điều này, hãy thử biến stream thành parallel stream:

```java
public long sideEffectParallelSum(long n) {
    Accumulator accumulator = new Accumulator();
    LongStream.rangeClosed(1, n).parallel().forEach(accumulator::add);
    return accumulator.total;
}
```

Hãy thử chạy phương thức cuối cùng này với harness của listing 7.1, đồng thời in ra kết quả của mỗi lần thực thi:

```java
System.out.println("SideEffect parallel sum done in: " +
        measurePerf(ParallelStreams::sideEffectParallelSum, 10_000_000L) + " msecs");
```

Bạn có thể thu được kết quả đại loại như sau:

```text
Result: 5959989000692
Result: 7425264100768
Result: 6827235020033
Result: 7192970417739
Result: 6714157975331
Result: 7497810541907
Result: 6435348440385
Result: 6999349840672
Result: 7435914379978
Result: 7715125932481
SideEffect parallel sum done in: 49 msecs
```

Lần này hiệu năng của phương thức không quan trọng. Điều duy nhất đáng lưu ý là mỗi lần thực thi lại trả về một kết quả khác nhau, tất cả đều cách xa giá trị đúng là 50000005000000. Điều này bị gây ra bởi thực tế là nhiều thread đang đồng thời truy cập accumulator và, cụ thể là, thực thi `total += value`, một câu lệnh mà dù trông có vẻ đơn giản, lại không phải là một thao tác nguyên tử (atomic). Nguồn gốc của vấn đề là phương thức được gọi bên trong khối forEach có side effect làm thay đổi trạng thái mutable của một đối tượng được chia sẻ giữa nhiều thread. Bắt buộc phải tránh những tình huống kiểu này nếu bạn muốn dùng parallel stream mà không gặp phải những bất ngờ khó chịu tương tự.

Giờ bạn đã biết rằng trạng thái mutable được chia sẻ không hợp với parallel stream và với tính toán song song nói chung. Chúng ta sẽ quay lại ý tưởng tránh mutation này ở chương 18 và 19 khi bàn chi tiết hơn về lập trình hàm. Còn bây giờ, hãy nhớ rằng việc tránh trạng thái mutable dùng chung đảm bảo parallel stream của bạn sẽ tạo ra kết quả đúng. Tiếp theo, chúng ta sẽ xem một vài lời khuyên thực tế mà bạn có thể dùng để xác định khi nào thì thích hợp để dùng parallel stream nhằm cải thiện hiệu năng.

### 7.1.4. Sử dụng parallel stream một cách hiệu quả

Nói chung, không thể (và cũng vô nghĩa) khi cố đưa ra bất kỳ gợi ý định lượng nào về thời điểm nên dùng parallel stream, bởi bất kỳ tiêu chí cụ thể nào chẳng hạn như "chỉ dùng khi stream chứa hơn một nghìn phần tử" đều có thể đúng cho một thao tác cụ thể chạy trên một máy cụ thể, nhưng lại hoàn toàn sai trong một bối cảnh chỉ khác đi chút xíu. Tuy nhiên, ít nhất vẫn có thể đưa ra một vài lời khuyên định tính hữu ích khi quyết định xem dùng parallel stream trong một tình huống nhất định có hợp lý hay không:

- **Nếu nghi ngờ, hãy đo.** Biến một sequential stream thành parallel stream là việc dễ dàng nhưng không phải lúc nào cũng là điều nên làm. Như chúng ta đã chứng minh trong mục này, một parallel stream không phải lúc nào cũng nhanh hơn phiên bản tuần tự tương ứng. Hơn nữa, parallel stream đôi khi hoạt động theo cách phản trực giác, nên gợi ý đầu tiên và quan trọng nhất khi chọn giữa sequential stream và parallel stream là luôn kiểm tra hiệu năng của chúng bằng một benchmark thích hợp.
- **Cẩn thận với boxing.** Các thao tác boxing và unboxing tự động có thể làm tổn hại hiệu năng nghiêm trọng. Java 8 bao gồm các primitive stream (IntStream, LongStream, và DoubleStream) để tránh những thao tác đó, nên hãy dùng chúng khi có thể.
- **Một số thao tác vốn dĩ chạy tệ hơn trên parallel stream so với sequential stream.** Cụ thể, các thao tác như limit và findFirst vốn dựa vào thứ tự các phần tử thì rất đắt đỏ trên một parallel stream. Ví dụ, findAny sẽ chạy tốt hơn findFirst vì nó không bị ràng buộc phải hoạt động theo encounter order. Bạn luôn có thể biến một stream có thứ tự thành stream không có thứ tự bằng cách gọi phương thức unordered trên nó. Chẳng hạn, nếu bạn cần N phần tử của stream và không nhất thiết quan tâm đến việc chúng có phải là N phần tử đầu tiên hay không, thì gọi limit trên một parallel stream không có thứ tự có thể thực thi hiệu quả hơn so với trên một stream có encounter order (ví dụ, khi nguồn là một List).
- **Hãy cân nhắc tổng chi phí tính toán của pipeline các thao tác được stream thực hiện.** Với N là số phần tử cần xử lý và Q là chi phí xấp xỉ để xử lý một trong các phần tử đó qua pipeline của stream, tích N*Q cho ta một ước lượng định tính thô về chi phí này. Giá trị Q càng cao thì càng có khả năng đạt hiệu năng tốt khi dùng parallel stream.
- **Với lượng dữ liệu nhỏ, chọn parallel stream gần như không bao giờ là quyết định thắng lợi.** Lợi thế của việc xử lý song song chỉ một vài phần tử không đủ để bù đắp cho chi phí phụ trội do quá trình song song hoá gây ra.
- **Hãy tính đến việc cấu trúc dữ liệu nền tảng của stream phân rã tốt đến mức nào.** Chẳng hạn, một ArrayList có thể được chia hiệu quả hơn nhiều so với một LinkedList, bởi cái thứ nhất có thể được chia đều mà không cần duyệt qua, trong khi cái thứ hai thì bắt buộc phải duyệt. Ngoài ra, các primitive stream được tạo bằng factory method range cũng có thể được phân rã nhanh chóng. Cuối cùng, như bạn sẽ học ở mục 7.3, bạn có thể giành toàn quyền kiểm soát quá trình phân rã này bằng cách tự cài đặt Spliterator của riêng mình.
- **Các đặc tính (characteristics) của một stream, và cách các intermediate operation trong pipeline sửa đổi chúng, có thể làm thay đổi hiệu năng của quá trình phân rã.** Ví dụ, một stream SIZED có thể được chia thành hai phần bằng nhau, rồi mỗi phần có thể được xử lý song song hiệu quả hơn, nhưng một thao tác filter có thể loại bỏ một số lượng phần tử không dự đoán được, khiến chính kích thước của stream trở nên không xác định.
- **Hãy cân nhắc xem terminal operation có bước merge rẻ hay đắt (ví dụ, phương thức combiner trong một Collector).** Nếu bước này đắt, thì chi phí gây ra bởi việc kết hợp các kết quả bộ phận do mỗi substream tạo ra có thể vượt trội hơn lợi ích về hiệu năng của parallel stream.

Bảng 7.1 tổng kết mức độ thân thiện với song song hoá của một số nguồn stream xét theo khả năng phân rã của chúng.

**Bảng 7.1. Các nguồn stream và khả năng phân rã**

| Nguồn | Khả năng phân rã |
|---|---|
| ArrayList | Xuất sắc |
| LinkedList | Kém |
| IntStream.range | Xuất sắc |
| Stream.iterate | Kém |
| HashSet | Tốt |
| TreeSet | Tốt |

Cuối cùng, chúng tôi cần nhấn mạnh rằng hạ tầng được parallel stream sử dụng hậu trường để thực thi các thao tác song song chính là fork/join framework được giới thiệu trong Java 7. Ví dụ tính tổng song song đã chứng minh rằng việc hiểu rõ nội bộ của parallel stream là điều tối quan trọng để dùng chúng đúng cách, nên chúng ta sẽ khảo sát chi tiết fork/join framework trong mục tiếp theo.

## 7.2. Fork/join framework

Fork/join framework được thiết kế để chia đệ quy một tác vụ có thể song song hoá thành các tác vụ nhỏ hơn rồi kết hợp kết quả của mỗi subtask để tạo ra kết quả tổng thể. Nó là một phần cài đặt của interface ExecutorService, phân phối các subtask đó cho các worker thread trong một thread pool gọi là ForkJoinPool. Hãy bắt đầu bằng việc khám phá cách định nghĩa một task và các subtask.

### 7.2.1. Làm việc với RecursiveTask

Để submit các task vào pool này, bạn phải tạo một lớp con của RecursiveTask&lt;R&gt;, trong đó R là kiểu của kết quả được tạo ra bởi task được song song hoá (và bởi mỗi subtask của nó), hoặc của RecursiveAction nếu task không trả về kết quả (dù vậy nó vẫn có thể cập nhật các cấu trúc phi cục bộ khác). Để định nghĩa một RecursiveTask, bạn chỉ cần cài đặt phương thức trừu tượng duy nhất của nó là compute:

```java
protected abstract R compute();
```

Phương thức này định nghĩa cả logic chia tác vụ hiện tại thành các subtask lẫn thuật toán tạo ra kết quả của một subtask đơn lẻ khi không còn có thể hoặc không còn thuận tiện để chia nhỏ nó thêm nữa. Vì lý do đó, một phần cài đặt của phương thức này thường trông giống như đoạn mã giả sau:

```text
if (task đủ nhỏ hoặc không còn chia được nữa) {
    tính toán task một cách tuần tự
} else {
    chia task thành hai subtask
    gọi đệ quy phương thức này, có thể tiếp tục chia nhỏ mỗi subtask
    chờ tất cả các subtask hoàn tất
    kết hợp kết quả của mỗi subtask
}
```

Nói chung, không có tiêu chí chính xác nào để quyết định xem một task có nên được chia nhỏ tiếp hay không, nhưng có nhiều heuristic khác nhau mà bạn có thể theo để hỗ trợ quyết định này. Chúng tôi sẽ làm rõ chúng chi tiết hơn ở mục 7.2.2. Quá trình chia task một cách đệ quy được tóm lược trực quan qua hình 7.3.

> **Hình 7.3.** Quá trình fork/join

Như bạn có thể đã nhận ra, đây chẳng qua chỉ là phiên bản song song của thuật toán chia để trị (divide-and-conquer) nổi tiếng. Để minh hoạ một ví dụ thực tế về cách dùng fork/join framework và để tiếp nối các ví dụ trước, hãy thử tính tổng của một dãy số (ở đây được biểu diễn bằng một mảng số `long[]`) bằng framework này. Như đã giải thích, trước hết bạn cần cung cấp một phần cài đặt cho class RecursiveTask, như được minh hoạ bởi ForkJoinSumCalculator trong listing 7.2.

**Listing 7.2. Thực hiện phép tính tổng song song bằng fork/join framework**

```java
// Kế thừa RecursiveTask để tạo một task dùng được với fork/join framework
public class ForkJoinSumCalculator
        extends java.util.concurrent.RecursiveTask<Long> {

    private final long[] numbers;       // Mảng các số cần tính tổng
    // Vị trí đầu và cuối của mảng con được subtask này xử lý
    private final int start;
    private final int end;
    // Ngưỡng kích thước để chia thành các subtask
    public static final long THRESHOLD = 10_000;

    // Constructor public để tạo task chính
    public ForkJoinSumCalculator(long[] numbers) {
        this(numbers, 0, numbers.length);
    }

    // Constructor private để tạo các subtask của task chính
    private ForkJoinSumCalculator(long[] numbers, int start, int end) {
        this.numbers = numbers;
        this.start = start;
        this.end = end;
    }

    @Override                           // Override phương thức trừu tượng của RecursiveTask
    protected Long compute() {
        // Kích thước của mảng con được task này tính tổng
        int length = end - start;
        // Nếu kích thước nhỏ hơn hoặc bằng ngưỡng, tính kết quả một cách tuần tự
        if (length <= THRESHOLD) {
            return computeSequentially();
        }
        // Tạo một subtask để tính tổng nửa đầu của mảng
        ForkJoinSumCalculator leftTask =
                new ForkJoinSumCalculator(numbers, start, start + length / 2);
        // Thực thi bất đồng bộ subtask vừa tạo bằng một thread khác của ForkJoinPool
        leftTask.fork();
        // Tạo một subtask để tính tổng nửa sau của mảng
        ForkJoinSumCalculator rightTask =
                new ForkJoinSumCalculator(numbers, start + length / 2, end);
        // Thực thi subtask thứ hai này một cách đồng bộ, có thể cho phép chia nhỏ đệ quy tiếp
        Long rightResult = rightTask.compute();
        // Đọc kết quả của subtask thứ nhất — chờ nếu nó chưa sẵn sàng
        Long leftResult = leftTask.join();
        // Kết hợp kết quả của hai subtask
        return leftResult + rightResult;
    }

    // Một thuật toán tuần tự đơn giản cho các kích thước dưới ngưỡng
    private long computeSequentially() {
        long sum = 0;
        for (int i = start; i < end; i++) {
            sum += numbers[i];
        }
        return sum;
    }
}
```

Giờ đây việc viết một phương thức thực hiện phép tính tổng song song n số tự nhiên đầu tiên trở nên hết sức đơn giản. Bạn cần truyền mảng số mong muốn vào constructor của ForkJoinSumCalculator:

```java
public static long forkJoinSum(long n) {
    long[] numbers = LongStream.rangeClosed(1, n).toArray();
    ForkJoinTask<Long> task = new ForkJoinSumCalculator(numbers);
    return new ForkJoinPool().invoke(task);
}
```

Ở đây, bạn sinh ra một mảng chứa n số tự nhiên đầu tiên bằng một LongStream. Sau đó bạn tạo một ForkJoinTask (lớp cha của RecursiveTask), truyền mảng này vào constructor public của ForkJoinSumCalculator được trình bày ở listing 7.2. Cuối cùng, bạn tạo một ForkJoinPool mới và truyền task đó vào phương thức invoke của nó. Giá trị được trả về bởi phương thức cuối cùng này chính là kết quả của task được định nghĩa bởi class ForkJoinSumCalculator khi được thực thi bên trong ForkJoinPool.

Lưu ý rằng trong một ứng dụng thực tế, việc dùng nhiều hơn một ForkJoinPool là vô nghĩa. Vì lý do đó, điều bạn thường nên làm là chỉ khởi tạo nó một lần và giữ instance này trong một trường static, biến nó thành một singleton, để nó có thể được tái sử dụng tiện lợi bởi bất kỳ phần nào trong phần mềm của bạn. Ở đây, để tạo nó, bạn dùng constructor mặc định không đối số, nghĩa là bạn muốn cho phép pool sử dụng tất cả các bộ xử lý sẵn có với JVM. Chính xác hơn, constructor này sẽ dùng giá trị được trả về bởi Runtime.availableProcessors để xác định số thread mà pool sử dụng. Lưu ý rằng phương thức availableProcessors, bất chấp tên gọi của nó, trên thực tế trả về số nhân khả dụng, bao gồm cả những nhân ảo do hyperthreading.

**Chạy ForkJoinSumCalculator**

Khi bạn truyền task ForkJoinSumCalculator vào ForkJoinPool, task này được thực thi bởi một thread của pool, và thread đó lần lượt gọi phương thức compute của task. Phương thức này kiểm tra xem task có đủ nhỏ để được thực hiện tuần tự hay không; nếu không, nó chia mảng số cần tính tổng thành hai nửa và gán chúng cho hai ForkJoinSumCalculator mới được lên lịch để thực thi bởi ForkJoinPool. Kết quả là quá trình này có thể được lặp lại một cách đệ quy, cho phép task ban đầu được chia thành các task nhỏ hơn, cho tới khi thoả mãn điều kiện dùng để kiểm tra xem việc chia nhỏ tiếp có còn thuận tiện hoặc còn khả thi hay không (trong trường hợp này là khi số phần tử cần tính tổng nhỏ hơn hoặc bằng 10.000). Tại thời điểm đó, kết quả của mỗi subtask được tính một cách tuần tự, và cây nhị phân (ngầm định) các task được tạo ra bởi quá trình forking sẽ được duyệt ngược trở lại về gốc của nó. Kết quả của task sau đó được tính bằng cách kết hợp các kết quả bộ phận của mỗi subtask. Quá trình này được trình bày ở hình 7.4.

> **Hình 7.4.** Thuật toán fork/join

Một lần nữa, bạn có thể kiểm tra hiệu năng của phương thức tính tổng sử dụng fork/join framework một cách tường minh bằng harness đã được phát triển ở đầu chương này:

```java
System.out.println("ForkJoin sum done in: " + measureSumPerf(
        ForkJoinSumCalculator::forkJoinSum, 10_000_000) + " msecs");
```

Trong trường hợp này nó tạo ra đầu ra sau:

```text
ForkJoin sum done in: 41 msecs
```

Ở đây, hiệu năng tệ hơn phiên bản dùng parallel stream, nhưng chỉ vì bạn buộc phải đưa toàn bộ stream các số vào một mảng `long[]` trước khi được phép dùng nó trong task ForkJoinSumCalculator.

### 7.2.2. Các best practice khi sử dụng fork/join framework

Mặc dù fork/join framework tương đối dễ dùng, đáng tiếc là nó cũng dễ bị dùng sai. Sau đây là một vài best practice để sử dụng nó hiệu quả:

- Gọi phương thức join trên một task sẽ chặn (block) bên gọi cho tới khi kết quả do task đó tạo ra sẵn sàng. Vì lý do này, cần phải gọi nó sau khi quá trình tính toán của cả hai subtask đã bắt đầu. Nếu không, bạn sẽ có được một phiên bản chậm hơn và phức tạp hơn của chính thuật toán tuần tự ban đầu, bởi mỗi subtask sẽ phải chờ subtask kia hoàn thành trước khi bắt đầu.
- Phương thức invoke của một ForkJoinPool không nên được dùng từ bên trong một RecursiveTask. Thay vào đó, bạn nên luôn gọi trực tiếp các phương thức compute hoặc fork; chỉ có code tuần tự mới nên dùng invoke để bắt đầu quá trình tính toán song song.
- Gọi phương thức fork trên một subtask là cách để lên lịch cho nó trên ForkJoinPool. Có vẻ tự nhiên khi gọi nó trên cả subtask trái lẫn phải, nhưng làm vậy kém hiệu quả hơn so với việc gọi trực tiếp compute trên một trong hai. Làm như thế cho phép bạn tái sử dụng cùng một thread cho một trong hai subtask và tránh được overhead gây ra bởi việc cấp phát không cần thiết thêm một task nữa vào pool.
- Việc debug một quá trình tính toán song song dùng fork/join framework có thể khá rối rắm. Cụ thể, thông thường ta rất hay xem stack trace trong IDE yêu thích để tìm ra nguyên nhân của một vấn đề, nhưng điều này không hoạt động với tính toán fork/join, bởi lời gọi compute diễn ra trong một thread khác với bên gọi theo quan niệm thông thường, tức là đoạn code đã gọi fork.
- Như bạn đã khám phá với parallel stream, bạn không bao giờ nên mặc định rằng một phép tính dùng fork/join framework trên một bộ xử lý đa nhân sẽ nhanh hơn phiên bản tuần tự tương ứng. Chúng ta đã nói rằng một task nên có khả năng phân rã thành nhiều subtask độc lập thì mới song song hoá được với mức tăng hiệu năng đáng kể. Tất cả các subtask này nên tốn nhiều thời gian thực thi hơn so với việc fork một task mới; một thủ pháp thường dùng là đặt I/O vào một subtask và phần tính toán vào subtask kia, nhờ đó chồng lấn phần tính toán với phần I/O. Hơn nữa, bạn nên cân nhắc những điều khác khi so sánh hiệu năng của phiên bản tuần tự và phiên bản song song của cùng một thuật toán. Giống như mọi code Java khác, fork/join framework cần được "làm nóng" (warm up), tức là được thực thi vài lần, trước khi được JIT compiler tối ưu. Đây là lý do vì sao luôn quan trọng phải chạy chương trình nhiều lần trước khi đo hiệu năng của nó, như chúng ta đã làm trong harness của mình. Cũng cần lưu ý rằng những tối ưu hoá được cài sẵn trong compiler có thể mang lại lợi thế không công bằng cho phiên bản tuần tự (ví dụ, bằng cách thực hiện phân tích dead code — loại bỏ một phép tính không bao giờ được dùng đến).

Chiến lược chia nhỏ của fork/join xứng đáng có một lưu ý cuối cùng: bạn phải chọn tiêu chí dùng để quyết định xem một subtask cho trước nên được chia nhỏ tiếp hay đã đủ nhỏ để được đánh giá một cách tuần tự. Chúng tôi sẽ đưa ra vài gợi ý về điều này ở mục tiếp theo.

### 7.2.3. Work stealing

Trong ví dụ ForkJoinSumCalculator, chúng ta đã quyết định ngừng tạo thêm subtask khi mảng số cần tính tổng chứa nhiều nhất 10.000 phần tử. Đây là một lựa chọn tuỳ ý, nhưng trong hầu hết các trường hợp, rất khó tìm được một heuristic tốt ngoài việc thử tối ưu nó bằng cách thử đi thử lại nhiều lần với các đầu vào khác nhau. Trong ca kiểm thử của chúng ta, chúng ta bắt đầu với một mảng 10 triệu phần tử, nghĩa là ForkJoinSumCalculator sẽ fork ít nhất 1.000 subtask. Điều này có vẻ như lãng phí tài nguyên vì chúng ta chạy nó trên một máy chỉ có bốn nhân. Trong trường hợp cụ thể này, điều đó có lẽ đúng, bởi tất cả các task đều bị giới hạn bởi CPU (CPU bound) và được kỳ vọng tốn một lượng thời gian tương tự nhau.

Nhưng việc fork một số lượng khá lớn các task chi tiết (fine-grained) nói chung lại là một lựa chọn thắng lợi. Đó là bởi vì, lý tưởng nhất, bạn muốn phân hoạch khối lượng công việc của một task được song song hoá sao cho mỗi subtask tốn đúng bằng lượng thời gian như nhau, giữ cho tất cả các nhân của CPU đều bận rộn như nhau. Đáng tiếc là, đặc biệt trong những trường hợp gần với kịch bản thực tế hơn so với ví dụ đơn giản mà chúng tôi trình bày ở đây, thời gian mà mỗi subtask tiêu tốn có thể chênh lệch rất lớn, hoặc do sử dụng một chiến lược phân hoạch kém hiệu quả, hoặc vì những nguyên nhân không lường trước được như truy cập đĩa chậm hoặc nhu cầu phối hợp việc thực thi với các dịch vụ bên ngoài.

Fork/join framework giải quyết vấn đề này bằng một kỹ thuật gọi là work stealing. Trên thực tế, điều này có nghĩa là các task được chia ít nhiều đều nhau cho tất cả các thread trong ForkJoinPool. Mỗi thread trong số đó giữ một hàng đợi liên kết đôi (doubly linked queue) chứa các task được gán cho nó, và ngay khi hoàn thành một task, nó lấy một task khác từ đầu hàng đợi và bắt đầu thực thi. Vì những lý do chúng tôi liệt kê ở trên, một thread có thể hoàn thành tất cả các task được gán cho nó nhanh hơn nhiều so với các thread khác, nghĩa là hàng đợi của nó sẽ trở nên rỗng trong khi các thread khác vẫn còn khá bận rộn. Trong trường hợp này, thay vì rơi vào trạng thái nhàn rỗi, thread đó chọn ngẫu nhiên hàng đợi của một thread khác và "đánh cắp" (steal) một task, lấy nó từ đuôi hàng đợi. Quá trình này tiếp diễn cho tới khi tất cả các task được thực thi xong, và rồi tất cả các hàng đợi đều trở nên rỗng. Đó là lý do vì sao việc có nhiều task nhỏ, thay vì chỉ vài task lớn, có thể giúp cân bằng khối lượng công việc giữa các worker thread tốt hơn.

Tổng quát hơn, thuật toán work-stealing này được dùng để tái phân phối và cân bằng các task giữa các worker thread trong pool. Hình 7.5 cho thấy quá trình này diễn ra như thế nào. Khi một task trong hàng đợi của một worker được chia thành hai subtask, một trong hai subtask sẽ bị một worker đang nhàn rỗi khác đánh cắp. Như đã mô tả ở trên, quá trình này có thể tiếp diễn một cách đệ quy cho tới khi điều kiện dùng để xác định rằng một subtask nhất định nên được thực thi tuần tự trở thành đúng.

> **Hình 7.5.** Thuật toán work-stealing được fork/join framework sử dụng

Đến đây hẳn đã rõ ràng rằng một stream có thể dùng fork/join framework để xử lý song song các phần tử của nó như thế nào, nhưng vẫn còn thiếu một thành phần. Trong mục này, chúng ta đã phân tích một ví dụ mà bạn tự tay phát triển logic chia một mảng số thành nhiều task. Tuy nhiên, bạn đã không phải làm bất cứ điều gì tương tự khi dùng parallel stream ở đầu chương này, và điều đó có nghĩa là phải tồn tại một cơ chế tự động chia stream giúp bạn. Cơ chế tự động mới này được gọi là Spliterator, và chúng ta sẽ khám phá nó trong mục tiếp theo.

## 7.3. Spliterator

Spliterator là một interface mới khác được thêm vào Java 8; tên của nó là viết tắt của "splitable iterator" (bộ lặp có thể chia nhỏ). Giống như Iterator, Spliterator được dùng để duyệt các phần tử của một nguồn, nhưng chúng cũng được thiết kế để làm việc đó một cách song song. Mặc dù trên thực tế bạn có thể không cần tự phát triển Spliterator của riêng mình, nhưng hiểu cách làm điều đó sẽ mang lại cho bạn hiểu biết rộng hơn về cách parallel stream hoạt động. Java 8 đã cung cấp sẵn một phần cài đặt Spliterator mặc định cho tất cả các cấu trúc dữ liệu có trong Collections Framework của nó. Interface Collection nay cung cấp một default method `spliterator()` (bạn sẽ học thêm về default method ở chương 13) trả về một đối tượng Spliterator. Interface Spliterator định nghĩa một số phương thức, như trình bày trong listing sau.

**Listing 7.3. Interface Spliterator**

```java
public interface Spliterator<T> {
    boolean tryAdvance(Consumer<? super T> action);
    Spliterator<T> trySplit();
    long estimateSize();
    int characteristics();
}
```

Như thường lệ, T là kiểu của các phần tử được Spliterator duyệt qua. Phương thức tryAdvance hoạt động theo cách tương tự như một Iterator thông thường, ở chỗ nó được dùng để tiêu thụ tuần tự từng phần tử một của Spliterator, trả về true nếu vẫn còn phần tử khác cần duyệt. Nhưng phương thức trySplit thì đặc thù hơn cho interface Spliterator, bởi nó được dùng để tách một phần các phần tử của nó sang một Spliterator thứ hai (chính là cái được phương thức này trả về), cho phép hai bên được xử lý song song. Một Spliterator cũng có thể cung cấp một ước lượng về số phần tử còn lại cần duyệt thông qua phương thức estimateSize của nó, bởi ngay cả một giá trị không chính xác nhưng tính nhanh cũng có thể hữu ích để chia cấu trúc dữ liệu một cách ít nhiều đồng đều.

Điều quan trọng là phải hiểu quá trình chia nhỏ này được thực hiện nội bộ ra sao để có thể kiểm soát nó khi cần. Do đó, chúng ta sẽ phân tích nó chi tiết hơn ở mục tiếp theo.

### 7.3.1. Quá trình chia nhỏ (splitting)

Thuật toán chia một stream thành nhiều phần là một quá trình đệ quy và diễn ra như minh hoạ ở hình 7.6. Ở bước thứ nhất, trySplit được gọi trên Spliterator đầu tiên và sinh ra một Spliterator thứ hai. Rồi ở bước thứ hai, nó lại được gọi trên cả hai Spliterator này, dẫn tới tổng cộng bốn cái. Framework tiếp tục gọi phương thức trySplit trên một Spliterator cho tới khi nó trả về null để báo hiệu rằng cấu trúc dữ liệu mà nó đang xử lý không còn chia được nữa, như thể hiện ở bước 3. Cuối cùng, quá trình chia nhỏ đệ quy này kết thúc ở bước 4, khi tất cả các Spliterator đều đã trả về null cho một lời gọi trySplit.

> **Hình 7.6.** Quá trình chia nhỏ đệ quy

Quá trình chia nhỏ này cũng có thể bị ảnh hưởng bởi chính các đặc tính (characteristics) của Spliterator, vốn được khai báo qua phương thức characteristics.

**Các characteristic của Spliterator**

Phương thức trừu tượng cuối cùng được khai báo bởi interface Spliterator là characteristics, phương thức này trả về một int mã hoá tập các đặc tính của chính Spliterator đó. Các client của Spliterator có thể dùng những đặc tính này để kiểm soát và tối ưu việc sử dụng nó tốt hơn. Bảng 7.2 tổng kết chúng. (Đáng tiếc là, mặc dù về mặt khái niệm chúng chồng lấn với các đặc tính của một collector, chúng lại được mã hoá khác nhau.) Các đặc tính là những hằng số int được định nghĩa trong interface Spliterator.

**Bảng 7.2. Các characteristic của Spliterator**

| Characteristic | Ý nghĩa |
|---|---|
| ORDERED | Các phần tử có một thứ tự xác định (ví dụ, một List), nên Spliterator tuân thủ thứ tự này khi duyệt và phân hoạch chúng. |
| DISTINCT | Với mỗi cặp phần tử x và y được duyệt qua, `x.equals(y)` trả về false. |
| SORTED | Các phần tử được duyệt tuân theo một thứ tự sắp xếp đã định trước. |
| SIZED | Spliterator này đã được tạo ra từ một nguồn có kích thước đã biết (ví dụ, một Set), nên giá trị được trả về bởi `estimatedSize()` là chính xác. |
| NONNULL | Được đảm bảo rằng các phần tử được duyệt qua sẽ không phải là null. |
| IMMUTABLE | Nguồn của Spliterator này không thể bị sửa đổi. Điều này hàm ý rằng không phần tử nào có thể được thêm vào, xoá đi, hay sửa đổi trong quá trình duyệt chúng. |
| CONCURRENT | Nguồn của Spliterator này có thể được sửa đổi một cách an toàn và đồng thời bởi các thread khác mà không cần bất kỳ đồng bộ hoá nào. |
| SUBSIZED | Cả Spliterator này lẫn mọi Spliterator khác sinh ra từ việc chia nhỏ nó đều là SIZED. |

Giờ đây khi đã thấy interface Spliterator là gì và nó định nghĩa những phương thức nào, bạn có thể thử tự phát triển một phần cài đặt Spliterator của riêng mình.

### 7.3.2. Tự cài đặt Spliterator của bạn

Hãy xem một ví dụ thực tế về trường hợp bạn có thể cần tự cài đặt Spliterator. Chúng ta sẽ phát triển một phương thức đơn giản đếm số từ trong một String. Một phiên bản lặp của phương thức này có thể được viết như trong listing sau.

**Listing 7.4. Một phương thức đếm từ theo kiểu lặp**

```java
public int countWordsIteratively(String s) {
    int counter = 0;
    boolean lastSpace = true;
    // Duyệt lần lượt từng ký tự trong String
    for (char c : s.toCharArray()) {
        if (Character.isWhitespace(c)) {
            lastSpace = true;
        } else {
            // Tăng bộ đếm từ khi ký tự trước là khoảng trắng
            // còn ký tự đang duyệt thì không
            if (lastSpace) counter++;
            lastSpace = false;
        }
    }
    return counter;
}
```

Hãy cho phương thức này chạy trên câu đầu tiên của tác phẩm Inferno của Dante (xem http://en.wikipedia.org/wiki/Inferno_(Dante)):

```java
final String SENTENCE =
        " Nel   mezzo del cammin  di nostra   vita " +
        "mi ritrovai in una selva oscura" +
        " ché la dritta via era    smarrita ";
System.out.println("Found " + countWordsIteratively(SENTENCE) + " words");
```

Lưu ý rằng chúng tôi đã thêm một số khoảng trắng ngẫu nhiên vào câu này để chứng minh rằng phần cài đặt lặp vẫn hoạt động đúng ngay cả khi có nhiều khoảng trắng giữa hai từ. Như dự đoán, đoạn code này in ra:

```text
Found 19 words
```

Lý tưởng nhất là bạn muốn đạt được cùng kết quả đó theo phong cách hàm (functional) hơn, bởi bằng cách này bạn sẽ có thể, như đã trình bày ở trên, song song hoá quá trình này bằng một parallel stream mà không phải xử lý tường minh các thread và việc đồng bộ hoá chúng.

**Viết lại WordCounter theo phong cách functional**

Trước hết, bạn cần chuyển String thành một stream. Đáng tiếc là chỉ có các primitive stream cho int, long, và double, nên bạn sẽ phải dùng một `Stream<Character>`:

```java
Stream<Character> stream = IntStream.range(0, SENTENCE.length())
                                    .mapToObj(SENTENCE::charAt);
```

Bạn có thể tính số từ bằng cách thực hiện một reduction trên stream này. Trong khi reduce stream, bạn sẽ phải mang theo một trạng thái gồm hai biến: một int đếm số từ tìm được cho tới hiện tại và một boolean để ghi nhớ xem Character gặp gần nhất có phải là khoảng trắng hay không. Bởi Java không có tuple (một cấu trúc để biểu diễn một danh sách có thứ tự gồm các phần tử không đồng nhất mà không cần đối tượng bao bọc), bạn sẽ phải tạo một class mới, WordCounter, để đóng gói trạng thái này như trong listing sau.

**Listing 7.5. Một class để đếm từ trong khi duyệt một stream các Character**

```java
class WordCounter {
    private final int counter;
    private final boolean lastSpace;

    public WordCounter(int counter, boolean lastSpace) {
        this.counter = counter;
        this.lastSpace = lastSpace;
    }

    // Phương thức accumulate duyệt lần lượt từng Character
    // giống như thuật toán lặp đã làm
    public WordCounter accumulate(Character c) {
        if (Character.isWhitespace(c)) {
            return lastSpace ?
                    this :
                    new WordCounter(counter, true);
        } else {
            // Tăng bộ đếm từ khi ký tự trước là khoảng trắng
            // còn ký tự đang duyệt thì không
            return lastSpace ?
                    new WordCounter(counter + 1, false) :
                    this;
        }
    }

    // Kết hợp hai WordCounter bằng cách cộng các bộ đếm của chúng
    public WordCounter combine(WordCounter wordCounter) {
        // Chỉ dùng tổng của các bộ đếm nên bạn không quan tâm đến lastSpace
        return new WordCounter(counter + wordCounter.counter,
                               wordCounter.lastSpace);
    }

    public int getCounter() {
        return counter;
    }
}
```

Trong listing này, phương thức accumulate định nghĩa cách thay đổi trạng thái của WordCounter, hay chính xác hơn là với trạng thái nào thì tạo ra một WordCounter mới, bởi đây là một class immutable. Điều này rất quan trọng cần hiểu. Chúng ta đang tích luỹ trạng thái với một class immutable một cách có chủ đích, để quá trình này có thể được song song hoá ở bước tiếp theo. Phương thức accumulate được gọi mỗi khi một Character mới của stream được duyệt qua. Cụ thể, như bạn đã làm trong phương thức countWordsIteratively ở listing 7.4, bộ đếm được tăng lên khi gặp một ký tự không phải khoảng trắng mới, và ký tự gặp trước đó là khoảng trắng. Hình 7.7 cho thấy các chuyển trạng thái của WordCounter khi một Character mới được duyệt qua bởi phương thức accumulate.

> **Hình 7.7.** Các chuyển trạng thái của WordCounter khi một Character c mới được duyệt qua

Phương thức thứ hai, combine, được gọi để tổng hợp các kết quả bộ phận của hai WordCounter đang làm việc trên hai phần con khác nhau của stream các Character, nên nó kết hợp hai WordCounter bằng cách cộng các bộ đếm nội bộ của chúng.

Giờ đây khi bạn đã mã hoá logic về cách tích luỹ các ký tự vào một WordCounter và cách kết hợp chúng ngay bên trong chính WordCounter, việc viết một phương thức reduce stream các Character trở nên hết sức đơn giản:

```java
private int countWords(Stream<Character> stream) {
    WordCounter wordCounter = stream.reduce(new WordCounter(0, true),
                                            WordCounter::accumulate,
                                            WordCounter::combine);
    return wordCounter.getCounter();
}
```

Bây giờ bạn có thể thử phương thức này với stream được tạo từ String chứa câu đầu tiên của Inferno của Dante:

```java
Stream<Character> stream = IntStream.range(0, SENTENCE.length())
                                    .mapToObj(SENTENCE::charAt);
System.out.println("Found " + countWords(stream) + " words");
```

Bạn có thể kiểm tra rằng đầu ra của nó tương ứng với đầu ra được sinh ra bởi phiên bản lặp:

```text
Found 19 words
```

Cho đến giờ mọi thứ đều ổn, nhưng chúng ta đã nói rằng một trong những lý do chính để cài đặt WordCounter theo phong cách functional là để có thể dễ dàng song song hoá thao tác này, vậy hãy xem điều đó hoạt động ra sao.

**Làm cho WordCounter chạy song song**

Bạn có thể thử tăng tốc thao tác đếm từ bằng một parallel stream, như sau:

```java
System.out.println("Found " + countWords(stream.parallel()) + " words");
```

Đáng tiếc là lần này đầu ra lại là:

```text
Found 25 words
```

Rõ ràng có gì đó đã sai, nhưng là gì? Vấn đề không khó phát hiện. Bởi String ban đầu bị chia ở những vị trí tuỳ ý, đôi khi một từ bị chia làm đôi và rồi bị đếm hai lần. Nói chung, điều này chứng minh rằng việc chuyển từ một sequential stream sang một parallel stream có thể dẫn tới kết quả sai nếu kết quả đó có thể bị ảnh hưởng bởi vị trí mà stream bị chia.

Bạn sửa vấn đề này bằng cách nào? Giải pháp nằm ở việc đảm bảo rằng String không bị chia tại một vị trí ngẫu nhiên mà chỉ bị chia tại cuối một từ. Để làm điều này, bạn sẽ phải cài đặt một Spliterator của Character chỉ chia một String giữa hai từ (như trong listing sau) rồi tạo parallel stream từ nó.

**Listing 7.6. WordCounterSpliterator**

```java
class WordCounterSpliterator implements Spliterator<Character> {
    private final String string;
    private int currentChar = 0;

    public WordCounterSpliterator(String string) {
        this.string = string;
    }

    @Override
    public boolean tryAdvance(Consumer<? super Character> action) {
        action.accept(string.charAt(currentChar++));  // Tiêu thụ ký tự hiện tại
        // Trả về true nếu còn ký tự nữa cần được tiêu thụ
        return currentChar < string.length();
    }

    @Override
    public Spliterator<Character> trySplit() {
        int currentSize = string.length() - currentChar;
        if (currentSize < 10) {
            // Trả về null để báo hiệu rằng String cần phân tích đã đủ nhỏ
            // để được xử lý một cách tuần tự
            return null;
        }
        // Đặt vị trí chia ứng viên bằng nửa của String cần phân tích
        for (int splitPos = currentSize / 2 + currentChar;
                 splitPos < string.length(); splitPos++) {   // Đẩy vị trí chia tới cho tới khoảng trắng kế tiếp
            if (Character.isWhitespace(string.charAt(splitPos))) {
                // Tạo một WordCounterSpliterator mới phân tích String
                // từ vị trí bắt đầu tới vị trí chia
                Spliterator<Character> spliterator =
                        new WordCounterSpliterator(string.substring(currentChar,
                                                                    splitPos));
                // Đặt vị trí bắt đầu của WordCounterSpliterator hiện tại
                // bằng vị trí chia
                currentChar = splitPos;
                // Đã tìm thấy khoảng trắng và tạo được Spliterator mới, nên thoát vòng lặp
                return spliterator;
            }
        }
        return null;
    }

    @Override
    public long estimateSize() {
        return string.length() - currentChar;
    }

    @Override
    public int characteristics() {
        return ORDERED + SIZED + SUBSIZED + NONNULL + IMMUTABLE;
    }
}
```

Spliterator này được tạo từ String cần phân tích và lặp qua các Character của nó bằng cách giữ chỉ số của ký tự đang được duyệt. Hãy điểm nhanh lại các phương thức của WordCounterSpliterator cài đặt interface Spliterator:

- Phương thức tryAdvance đưa cho Consumer Character trong String tại vị trí chỉ số hiện tại và tăng vị trí này lên. Consumer được truyền vào làm đối số của nó là một class nội bộ của Java, có nhiệm vụ chuyển tiếp Character được tiêu thụ tới tập các hàm phải được áp dụng lên nó trong khi duyệt stream, mà trong trường hợp này chỉ là một hàm reducing, cụ thể là phương thức accumulate của class WordCounter. Phương thức tryAdvance trả về true nếu vị trí con trỏ mới nhỏ hơn tổng độ dài của String và còn Character nữa cần được lặp qua.
- Phương thức trySplit là phương thức quan trọng nhất trong một Spliterator, bởi nó là phương thức định nghĩa logic dùng để chia cấu trúc dữ liệu cần được lặp qua. Như bạn đã làm trong phương thức compute của RecursiveTask được cài đặt ở listing 7.1, điều đầu tiên bạn phải làm ở đây là đặt một giới hạn mà dưới nó bạn không muốn thực hiện chia nhỏ tiếp nữa. Ở đây, bạn dùng một giới hạn thấp chỉ 10 Character để đảm bảo rằng chương trình của bạn sẽ thực hiện một vài lần chia với String tương đối ngắn mà bạn đang phân tích. Nhưng trong các ứng dụng thực tế, bạn sẽ phải dùng một giới hạn cao hơn, như bạn đã làm trong ví dụ fork/join, để tránh tạo ra quá nhiều task. Nếu số Character còn lại cần duyệt nằm dưới giới hạn này, bạn trả về null để báo hiệu rằng không cần chia nhỏ thêm nữa. Ngược lại, nếu bạn cần thực hiện một lần chia, bạn đặt vị trí chia ứng viên tại nửa của khối String còn lại cần phân tích. Nhưng bạn không dùng trực tiếp vị trí chia này vì bạn muốn tránh chia ở giữa một từ, nên bạn tiến về phía trước cho tới khi tìm được một Character trắng. Một khi bạn tìm được vị trí chia thích hợp, bạn tạo một Spliterator mới sẽ duyệt khối chuỗi con đi từ vị trí hiện tại tới vị trí chia; bạn đặt vị trí hiện tại của Spliterator này bằng vị trí chia, bởi phần trước đó sẽ do Spliterator mới quản lý, rồi bạn trả về nó.
- estimatedSize của các phần tử vẫn còn cần duyệt là hiệu giữa tổng độ dài của String được Spliterator này phân tích và vị trí hiện đang được lặp tới.
- Cuối cùng, phương thức characteristics báo hiệu cho framework rằng Spliterator này là ORDERED (thứ tự chính là dãy các Character trong String), SIZED (giá trị được trả về bởi phương thức estimatedSize là chính xác), SUBSIZED (các Spliterator khác được tạo ra bởi phương thức trySplit cũng có kích thước chính xác), NONNULL (không thể có Character null trong String), và IMMUTABLE (không thể thêm Character nào nữa trong khi phân tích String, bởi bản thân String là một class immutable).

**Đưa WordCounterSpliterator vào hoạt động**

Giờ bạn có thể dùng một parallel stream với WordCounterSpliterator mới này như sau:

```java
Spliterator<Character> spliterator = new WordCounterSpliterator(SENTENCE);
Stream<Character> stream = StreamSupport.stream(spliterator, true);
```

Đối số boolean thứ hai được truyền vào factory method StreamSupport.stream có nghĩa là bạn muốn tạo một parallel stream. Truyền parallel stream này vào phương thức countWords:

```java
System.out.println("Found " + countWords(stream) + " words");
```

tạo ra đầu ra đúng, như mong đợi:

```text
Found 19 words
```

Bạn đã thấy một Spliterator có thể cho bạn giành quyền kiểm soát chính sách dùng để chia một cấu trúc dữ liệu như thế nào. Một tính năng đáng chú ý cuối cùng của Spliterator là khả năng ràng buộc (bind) nguồn các phần tử cần duyệt tại thời điểm duyệt lần đầu, chia lần đầu, hoặc truy vấn kích thước ước lượng lần đầu, thay vì tại thời điểm nó được tạo ra. Khi điều này xảy ra, nó được gọi là late-binding Spliterator. Chúng tôi đã dành riêng phụ lục C để trình bày cách bạn có thể phát triển một class tiện ích có khả năng thực hiện song song nhiều thao tác trên cùng một stream bằng cách dùng tính năng này.

## Tóm tắt

- Internal iteration cho phép bạn xử lý một stream một cách song song mà không cần dùng và điều phối tường minh các thread khác nhau trong code của mình.
- Ngay cả khi việc xử lý một stream song song dễ dàng đến vậy, cũng không có gì đảm bảo rằng làm như thế sẽ khiến chương trình của bạn chạy nhanh hơn trong mọi hoàn cảnh. Hành vi và hiệu năng của phần mềm song song đôi khi có thể phản trực giác, và vì lý do này, luôn cần phải đo chúng và đảm bảo rằng bạn không đang làm chương trình của mình chậm đi.
- Việc thực thi song song một thao tác trên một tập dữ liệu, như parallel stream vẫn làm, có thể mang lại một sự tăng tốc về hiệu năng, đặc biệt khi số phần tử cần xử lý là rất lớn hoặc khi việc xử lý mỗi phần tử đơn lẻ đặc biệt tốn thời gian.
- Xét từ góc độ hiệu năng, việc dùng đúng cấu trúc dữ liệu, chẳng hạn như sử dụng primitive stream thay vì stream không chuyên biệt bất cứ khi nào có thể, gần như luôn quan trọng hơn việc cố song song hoá một số thao tác.
- Fork/join framework cho phép bạn chia đệ quy một task có thể song song hoá thành các task nhỏ hơn, thực thi chúng trên các thread khác nhau, rồi kết hợp kết quả của mỗi subtask để tạo ra kết quả tổng thể.
- Spliterator định nghĩa cách một parallel stream chia nhỏ dữ liệu mà nó duyệt qua.
