# QUY TẮC DỊCH — Modern Java in Action (EN → VI)

## 1. Nguyên tắc cốt lõi
- **Dịch ĐẦY ĐỦ**: không tóm tắt, không lược bỏ, không gộp đoạn. Mọi đoạn văn, mọi ví dụ,
  mọi bảng, mọi khung Quiz/Note/Sidebar, mọi mục Summary đều phải có mặt.
- **Chính xác kỹ thuật**: nếu bản gốc nói sai/mơ hồ thì dịch trung thành, không "sửa" nội dung.
- **Giọng văn**: kỹ thuật, mạch lạc, tự nhiên như sách giáo trình tiếng Việt. Xưng hô: dùng
  "bạn" cho "you", "chúng ta/chúng tôi" cho "we". Tránh dịch word-by-word gượng ép.

## 2. Thuật ngữ — GIỮ NGUYÊN TIẾNG ANH (không dịch, không in nghiêng lặp lại)
Giữ nguyên toàn bộ tên API, từ khoá, kiểu dữ liệu và các thuật ngữ sau:

stream, Stream, parallel stream, collector, Collector, lambda, lambda expression,
functional interface, method reference, Optional, Predicate, Function, Consumer,
Supplier, Comparator, Runnable, Callable, Future, CompletableFuture, Flow, Publisher,
Subscriber, Subscription, Processor, backpressure, reactive programming, reactive streams,
default method, static method, interface, class, record, enum, generic, wildcard,
type inference, target typing, capturing, effectively final, closure,
behavior parameterization, boxing/unboxing, autoboxing, primitive, immutable, mutable,
side effect, pure function, referential transparency, first-class function,
higher-order function, currying, partial application, persistent data structure,
lazy evaluation, memoization, structural sharing, pattern matching, tail-call optimization,
combinator, monad, functor,
module, module-path, classpath, JAR, JMOD, requires, exports, opens, provides, uses,
encapsulation, fork/join, work stealing, Spliterator, ForkJoinPool, thread pool,
executor, ExecutorService, daemon thread, race condition, deadlock, non-blocking,
asynchronous, synchronous, latency, throughput, benchmark, JMH,
DSL (domain-specific language), fluent API, method chaining, builder pattern,
internal DSL, external DSL, polyglot DSL,
API, JVM, JDK, JRE, garbage collection, bytecode, compiler, refactoring, unit test,
design pattern, Strategy, Observer, Template Method, Chain of Responsibility, Factory,
anonymous class, inner class, inheritance, polymorphism, overload, override,
LocalDate, LocalTime, LocalDateTime, Instant, Duration, Period, ZoneId, ZonedDateTime,
TemporalAdjuster, DateTimeFormatter, ChronoUnit,
map, filter, reduce, flatMap, collect, forEach, sorted, distinct, limit, skip,
groupingBy, partitioningBy, joining, counting, summingInt, averagingInt, toList, toSet,
allMatch, anyMatch, noneMatch, findFirst, findAny, count, min, max, iterate, generate,
short-circuiting, pipeline, terminal operation, intermediate operation, source,
laziness, loop fusion, internal iteration, external iteration.

**Quy ước bổ sung**: lần ĐẦU TIÊN một thuật ngữ quan trọng xuất hiện trong chương, có thể
kèm giải nghĩa ngắn trong ngoặc: `behavior parameterization (tham số hoá hành vi)`.
Các lần sau dùng thẳng thuật ngữ tiếng Anh.

## 3. Từ thông dụng — DỊCH
| EN | VI |
|---|---|
| method | phương thức |
| variable | biến |
| value | giá trị |
| argument / parameter | đối số / tham số |
| return | trả về |
| list / collection | danh sách / tập hợp (collection có thể giữ nguyên) |
| element | phần tử |
| exception | ngoại lệ |
| performance | hiệu năng |
| readability | tính dễ đọc |
| maintainability | tính dễ bảo trì |
| requirement | yêu cầu |
| implementation | phần cài đặt / triển khai |
| library | thư viện |
| framework | framework (giữ nguyên) |
| feature | tính năng |
| verbose / verbosity | dài dòng / sự dài dòng |
| boilerplate | code khuôn mẫu (boilerplate) |
| overhead | chi phí phụ trội (overhead) |
| trade-off | đánh đổi |
| chapter / section | chương / mục |
| Quiz | Quiz (giữ nguyên tiêu đề, dịch nội dung) |
| Summary | Tóm tắt |
| Answer | Đáp án |

## 4. Code block
- **Code giữ nguyên 100%** tiếng Anh: tên class, biến, phương thức, chuỗi ký tự, output.
- **CHỈ dịch comment** (`//`, `/* */`) sang tiếng Việt.
- Luôn bọc trong fence có ngôn ngữ: ```java (hoặc ```scala, ```bash, ```text, ```xml).
- Sửa lại thụt lề cho đúng chuẩn Java (text trích từ PDF thường lệch thụt lề).
- **Code bị cắt cụt do lỗi trích xuất PDF**: bản gốc PDF cắt mất phần cuối dòng dài
  (ví dụ `filterApples(List<Apple> inventory, Color co` thiếu `lor, `). Hãy KHÔI PHỤC
  dòng code cho hợp lệ dựa trên ngữ cảnh Java, và ngắt dòng cho vừa. Không để lại code sai cú pháp.

## 5. Chú thích đánh số dưới code (annotation)
Bản gốc có dạng:
```
    List<Apple> result = new ArrayList<>();      1
    ...
1 An accumulator list for apples
```
→ Chuyển thành comment tiếng Việt ngay trên/cuối dòng code tương ứng, BỎ danh sách số ở dưới:
```java
List<Apple> result = new ArrayList<>();  // Danh sách tích luỹ các quả táo
```
Nếu chú thích dài, đặt comment ở dòng riêng phía trên.

## 6. Cấu trúc markdown đầu ra
- `# Chương N. <Tiêu đề tiếng Việt>` — H1 duy nhất, đầu file.
- Khối "This chapter covers" → `> **Nội dung chương này**` + danh sách gạch đầu dòng.
- Mục `2.1.` → `## 2.1. ...`; `2.1.1.` → `### 2.1.1. ...`. Giữ nguyên hệ thống đánh số gốc.
- Bảng gốc → bảng markdown.
- Hình ảnh: bản gốc là PDF nên không có file ảnh. Với mỗi hình, chèn dòng:
  `> **Hình N.M.** <chú thích hình đã dịch>` và giữ lại phần mô tả nội dung hình nếu có trong text.
- Khung "Quiz N.M" → dùng `> [!NOTE]`-style blockquote hoặc `---` + `**Quiz N.M: ...**`,
  nhất quán trong cả file. Phần "Answer" giữ nguyên vị trí như bản gốc.
- Sidebar/Note/Warning → blockquote `>`.
- Cuối file: mục `## Tóm tắt` với danh sách gạch đầu dòng.

## 7. Những gì phải LOẠI BỎ (nhiễu trích xuất PDF)
- Số trang, header/footer lặp lại, dòng "Other formats available", "Audiobook",
  "Prev / Next", tên chương lặp ở đầu mỗi trang PDF.
- Không thêm lời bình của người dịch, không thêm mục nào không có trong bản gốc.
