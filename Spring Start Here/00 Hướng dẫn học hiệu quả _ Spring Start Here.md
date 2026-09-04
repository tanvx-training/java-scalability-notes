# Hướng dẫn học hiệu quả với *Spring Start Here*

Tài liệu này đi kèm bộ bản dịch tiếng Việt 15 chương của cuốn *Spring Start Here* (Laurențiu Spilcă, Manning). Mục đích là giúp bạn học theo đúng thứ tự, đúng cách, và biến kiến thức đọc được thành kỹ năng thực sự thay vì chỉ "đọc cho biết".

---

## 1. Cuốn sách này dành cho ai và cần chuẩn bị gì

**Bạn phù hợp với cuốn sách nếu:**

- Đã viết được chương trình Java cơ bản: class, interface, kế thừa, generic, collection, lambda, exception.
- Chưa từng dùng Spring, hoặc đã dùng nhưng "copy cấu hình mà không hiểu vì sao nó chạy".
- Muốn hiểu **cơ chế** phía sau Spring (context, bean, DI, aspect) trước khi học các project lớn hơn như Spring Security hay Spring Cloud.

**Kiến thức nền cần có (tác giả giả định bạn đã biết):**

| Chủ đề | Cần đến ở chương | Nếu chưa vững, ôn trước |
|---|---|---|
| Java OOP, interface, abstraction | 2 đến 6 | Bất kỳ giáo trình Java cơ bản |
| Maven: pom.xml, dependency | 2 | Mục 2.1 của sách đã hướng dẫn đủ dùng |
| HTTP: request, response, method, status | 7 đến 11 | Phụ lục C của sách gốc |
| JSON | 10, 11 | Phụ lục D của sách gốc |
| SQL cơ bản và JDBC lý thuyết | 12 đến 14 | Tác giả gợi ý *Learning SQL* (Alan Beaulieu) và chương JDBC trong sách OCP Java 11 |

Bạn **không cần** biết trước: dependency injection, AOP, servlet, Thymeleaf, Hibernate, JUnit. Sách giải thích tất cả từ đầu.

**Công cụ cần cài:**

- JDK 11 trở lên (sách dùng Java 11; xem mục 7 về tương thích phiên bản mới).
- IntelliJ IDEA (Community đủ dùng) hoặc IDE bất kỳ hỗ trợ Maven.
- Maven (IntelliJ đã tích hợp sẵn).
- Postman hoặc cURL (từ chương 10).
- MySQL (chỉ cần cho mục 12.3; các ví dụ khác dùng H2 in-memory, không phải cài gì).
- Mã nguồn ví dụ của sách: tải từ mục "Resources" trên trang liveBook của Manning. Các project đặt tên theo quy ước `sq-chX-exY` (chương X, ví dụ Y). Hãy tải trước khi bắt đầu.

---

## 2. Bản đồ cuốn sách và thứ tự học

Sách chia làm hai phần rõ rệt:

**Phần 1: Nền tảng (chương 1 đến 6).** Đây là phần quan trọng nhất. Tác giả nhấn mạnh ngay ở chương 3: *mọi thứ trong cuốn sách này, và mọi thứ bạn học từ bất kỳ tài liệu Spring nào khác, đều dựa trên việc hiểu đúng các chương 2 đến 5.*

**Phần 2: Triển khai (chương 7 đến 15).** Áp dụng nền tảng vào web app, REST, database, transaction và kiểm thử.

Quan hệ phụ thuộc giữa các chương:

```text
1 ──► 2 ──► 3 ──► 4 ──► 5 ──► 6
                              │
                    ┌─────────┘
                    ▼
                    7 ──► 8 ──► 9 ──► 10 ──► 11
                                      │
                                      ▼
                                     12 ──► 13 ──► 14 ──► 15
```

Điều này có nghĩa:

- **Không được nhảy cóc trong chương 2 đến 5.** Mỗi chương xây trực tiếp trên chương trước (thêm bean → nối bean → dùng abstraction → scope).
- Chương 6 (AOP) có thể thấy trừu tượng, nhưng **bắt buộc** phải hiểu vì chương 13 (transaction) dùng đúng cơ chế aspect đó.
- Chương 9 (web scope) là tiền đề cho ví dụ unit test ở chương 15.
- Chương 12, 13, 14 phải học liên tiếp: 13 dùng lại code của 12, 14 viết lại 13 bằng Spring Data.
- Chương 15 dùng lại ví dụ của chương 9 và 14.

Nếu bạn đã biết một phần Spring, chỉ nên bỏ qua khi tự trả lời được đầy đủ **checklist ở mục 6** của chương đó.

---

## 3. Lộ trình gợi ý

Ước tính dựa trên độ dài thực tế của từng chương (bản dịch dài từ 5.000 đến 10.000 từ mỗi chương). Thời gian gồm cả đọc, gõ lại code, chạy ví dụ và làm bài tập tự luyện.

| Tuần | Chương | Thời gian gợi ý | Mục tiêu đầu ra |
|---|---|---|---|
| 1 | 1, 2 | 4 đến 5 giờ | Tạo được project Maven, thêm bean vào context bằng cả ba cách |
| 2 | 3, 4 | 5 đến 6 giờ | Nối bean bằng `@Autowired` qua constructor, dùng interface và `@Qualifier` |
| 3 | 5, 6 | 6 đến 7 giờ | Giải thích được singleton và prototype, viết được một aspect log thời gian chạy method |
| 4 | 7, 8 | 5 đến 6 giờ | Web app Spring Boot với trang động Thymeleaf, form POST |
| 5 | 9, 10, 11 | 7 đến 8 giờ | Đăng nhập với session scope, REST endpoint, gọi REST bằng OpenFeign |
| 6 | 12, 13, 14 | 7 đến 8 giờ | CRUD với JdbcTemplate, `@Transactional`, Spring Data repository |
| 7 | 15 + dự án tổng hợp | 6 đến 8 giờ | Unit test với Mockito, integration test với `@SpringBootTest`, hoàn thành dự án ở mục 5 |

Nhịp đề xuất: **2 đến 3 buổi mỗi tuần, mỗi buổi 60 đến 90 phút.** Học một chương trong nhiều buổi ngắn tốt hơn một buổi dài, vì các khái niệm như context và scope cần thời gian "ngấm".

Nếu bạn có ít thời gian hơn, tuyệt đối giữ nguyên tuần 1 đến 3. Có thể rút gọn tuần 4 đến 7 bằng cách chỉ chạy project mẫu thay vì gõ lại toàn bộ.

---

## 4. Cách học một chương: quy trình 6 bước

Áp dụng cho mọi chương. Đừng bỏ bước nào, đặc biệt là bước 4 và 6.

### Bước 1: Đọc khung trước khi đọc nội dung (5 phút)

Đọc ba thứ theo thứ tự: mục **"Chương này bao gồm"** ở đầu, các **tiêu đề mục** (`##`, `###`), rồi mục **"Tóm tắt"** ở cuối. Bạn sẽ biết trước chương này trả lời câu hỏi gì, nhờ đó khi đọc chi tiết bạn đọc để *tìm câu trả lời* chứ không đọc thụ động.

### Bước 2: Đọc kỹ, không bỏ chú thích hình (30 đến 60 phút)

- Bản dịch không chứa ảnh, nhưng **chú thích hình** (`> **Hình x.y**`) được dịch đầy đủ và thường tóm tắt trọn ý của đoạn. Hãy đọc chúng như một đoạn văn bình thường. Khi cần xem ảnh, mở file PDF gốc cùng tên ở cùng thư mục.
- Các khối **LƯU Ý** chứa lời khuyên thực tế của tác giả (ví dụ: không dùng field injection trong production, không lưu password trong properties). Đây là phần giá trị nhất để đi làm, hãy ghi lại.
- Các sidebar (blockquote có tiêu đề in đậm như "Một câu chuyện chuyển đổi", "Còn checked exception trong transaction thì sao?") thường trả lời đúng câu hỏi bạn sắp thắc mắc.

### Bước 3: Gõ lại code, không copy (thời gian tùy chương)

Với mỗi **Listing**, hãy tự gõ lại vào project của bạn thay vì mở project mẫu. Lý do: cú pháp Spring rất nhiều annotation, và chỉ khi tự gõ bạn mới nhớ `@ComponentScan` cần `basePackages`, `@Bean` không đặt tên theo động từ, `@Transactional` phải nằm trên method public.

Chỉ mở project mẫu `sq-chX-exY` khi code của bạn không chạy, để **so sánh** chứ không phải để chép.

Các callout ❶ ❷ ❸ dưới mỗi listing giải thích từng dòng quan trọng. Hãy đọc chúng song song với dòng code tương ứng.

### Bước 4: Phá vỡ ví dụ (15 đến 20 phút)

Đây là bước biến việc đọc thành hiểu. Sau khi ví dụ chạy được, hãy cố tình làm nó **không chạy** và quan sát:

- Chương 2: xóa `@Configuration`, hoặc khai báo hai bean cùng kiểu rồi `getBean(Parrot.class)`. Đọc kỹ thông báo `NoUniqueBeanDefinitionException`.
- Chương 3: tạo circular dependency giữa hai class. Đọc `BeanCurrentlyInCreationException`.
- Chương 5: đổi bean sang prototype rồi inject vào singleton, in `hashCode()` để thấy cùng một instance.
- Chương 6: bỏ `@EnableAspectJAutoProxy` và xem aspect ngừng chạy.
- Chương 8: bỏ `required = false` ở `@RequestParam` rồi gọi thiếu tham số, quan sát HTTP 400.
- Chương 13: bắt exception bên trong method `@Transactional` mà không ném ra, xem transaction **không** rollback.

Mỗi lần lỗi, hãy tự đọc stack trace trước khi tra Google. Kỹ năng đọc lỗi Spring đáng giá hơn bất kỳ trang tài liệu nào.

### Bước 5: Viết tóm tắt bằng lời của bạn (10 phút)

Đóng sách, viết 5 đến 10 dòng trả lời: *chương này giải quyết vấn đề gì, bằng cơ chế nào, khi nào dùng, khi nào tránh.* Nếu không viết được, bạn chưa hiểu, hãy quay lại mục chưa rõ. Kỹ thuật này (Feynman) hiệu quả hơn đọc lại nhiều lần.

### Bước 6: Ôn lại theo lịch (5 phút mỗi lần)

Trước khi bắt đầu chương mới, dành 5 phút trả lời checklist (mục 6) của **hai chương trước đó**. Lặp lại kiến thức cách quãng giúp nhớ lâu hơn nhiều so với đọc một lần.

---

## 5. Bài tập tự luyện và dự án tổng hợp

Sách không có bài tập cuối chương, nên đây là phần bạn cần tự bổ sung. Mỗi bài tập dưới đây dùng đúng kiến thức của các chương tương ứng, không cần thứ gì chưa học.

**Sau chương 2 đến 3.** Viết một ứng dụng console quản lý thư viện: `Book`, `Library`, `LibraryService`. Thêm bean bằng `@Component`, nối bằng constructor injection. Thêm hai bean `Book` và dùng `@Qualifier` để chọn.

**Sau chương 4 đến 5.** Tách `NotificationService` thành interface với hai implementation (`EmailNotification`, `SmsNotification`). Dùng `@Primary`. Sau đó tạo một bean `RequestLogger` prototype và chứng minh mỗi lần lấy là instance mới.

**Sau chương 6.** Viết aspect đo thời gian thực thi của mọi method trong package `services` và in ra console. Sau đó giới hạn chỉ những method có annotation tùy chỉnh `@Timed`.

**Sau chương 8 đến 9.** Web app ghi chú cá nhân: trang danh sách ghi chú (GET), form thêm ghi chú (POST), trang chi tiết theo path variable `/notes/{id}`. Thêm đăng nhập giả lập bằng session-scoped bean như chương 9.

**Sau chương 10 đến 11.** Chuyển ứng dụng ghi chú thành REST API trả JSON. Thêm `@RestControllerAdvice` xử lý trường hợp không tìm thấy ghi chú (trả 404). Viết một ứng dụng thứ hai gọi API này bằng OpenFeign.

**Sau chương 12 đến 14.** Thay `List` trong memory bằng H2, trước bằng `JdbcTemplate`, rồi viết lại bằng Spring Data JDBC với `CrudRepository`. Thêm use case "chuyển ghi chú giữa hai thư mục" và bọc trong `@Transactional`; cố tình ném exception để thấy rollback.

**Dự án tổng hợp sau chương 15.** Hoàn thiện ứng dụng ghi chú thành một sản phẩm nhỏ:

- REST API đầy đủ CRUD, có xử lý lỗi tập trung.
- Lưu trữ bằng Spring Data JDBC trên H2, cấu hình sẵn `schema.sql` và `data.sql`.
- Unit test cho service (Mockito, mock repository) bao gồm cả happy flow và exception flow.
- Integration test với `@SpringBootTest` cho ít nhất một use case.
- Một aspect ghi log mọi lời gọi controller.

Khi làm xong dự án này, bạn đã dùng đủ mọi cơ chế trong sách trong một ứng dụng thật, và có thể tự tin chuyển sang *Spring Security in Action* hoặc các chủ đề nâng cao.

---

## 6. Checklist tự kiểm tra theo chương

Chỉ chuyển chương khi bạn trả lời được **không cần mở sách**.

**Chương 1**
- Framework khác library ở điểm nào? Bốn trường hợp nào không nên dùng framework?
- Spring Core, Spring MVC, Spring Data Access, Spring Boot, Spring Data khác nhau ra sao?

**Chương 2**
- Ba cách thêm bean vào context là gì? Khi nào dùng `@Bean` thay vì `@Component`?
- Tên bean mặc định lấy từ đâu? `@Primary` giải quyết vấn đề gì?

**Chương 3**
- Ba cách dùng `@Autowired`; vì sao constructor injection được khuyến nghị?
- Circular dependency là gì và Spring báo lỗi nào?
- Khi có nhiều bean cùng kiểu, Spring chọn theo thứ tự ưu tiên nào?

**Chương 4**
- Vì sao inject qua interface thay vì class cụ thể? `@Service`, `@Repository` khác `@Component` ở điểm nào?

**Chương 5**
- Singleton trong Spring khác singleton pattern ra sao? Vì sao singleton bean nên bất biến?
- Eager và lazy khác nhau thế nào; mặc định là gì và vì sao tác giả khuyên giữ mặc định?
- Điều gì xảy ra khi inject prototype bean vào singleton bean?

**Chương 6**
- Định nghĩa aspect, advice, pointcut, join point, target object, proxy.
- Vì sao khi dùng AOP, bạn phải inject qua interface hoặc để Spring tạo proxy? Thứ tự nhiều aspect quyết định bằng gì?

**Chương 7**
- Servlet container làm gì? Dispatcher servlet, handler mapping, view resolver nằm ở đâu trong luồng Spring MVC?
- Spring Boot cung cấp ba thứ gì (Initializr, starter, autoconfiguration)?

**Chương 8**
- Request parameter và path variable: khi nào dùng cái nào? Mặc định request parameter có bắt buộc không?
- HTML form gửi được những HTTP method nào?

**Chương 9**
- Request, session, application scope khác nhau ra sao? Vì sao tác giả khuyên tránh application scope?

**Chương 10**
- `@RestController` bằng tổ hợp của gì? `ResponseEntity` dùng để làm gì?
- Ưu điểm của `@RestControllerAdvice` so với try/catch trong controller?

**Chương 11**
- Ba cách gọi REST endpoint trong Spring; tác giả khuyên chọn gì cho ứng dụng không reactive?

**Chương 12**
- Data source là gì và vì sao không dùng `DriverManager` trực tiếp? `RowMapper` làm nhiệm vụ gì?
- Khi nào phải tự định nghĩa bean `DataSource`?

**Chương 13**
- Commit và rollback là gì? Spring rollback mặc định với loại exception nào?
- Vì sao bắt exception bên trong method `@Transactional` làm transaction không rollback?

**Chương 14**
- Khác nhau giữa `Repository`, `CrudRepository`, `PagingAndSortingRepository`?
- Vì sao tác giả khuyên dùng `@Query` thay vì dựa vào tên method? `@Modifying` cần khi nào?

**Chương 15**
- Ba phần của một test (assumptions, call, validations). Mock là gì và vì sao unit test cần mock repository?
- Unit test và Spring integration test khác nhau ở điểm nào; khi nào dùng mỗi loại?

---

## 7. Lưu ý về phiên bản khi chạy ví dụ trên Spring mới

Sách viết cho **Spring 5.2 / Spring Boot 2.x / Java 11**. Nếu bạn tạo project mới bằng start.spring.io hôm nay, bạn sẽ nhận Spring Boot 3.x, cần Java 17 trở lên và có vài khác biệt. Kiến thức cốt lõi trong sách **không đổi**; chỉ cần điều chỉnh những điểm sau:

| Trong sách | Với Spring Boot 3.x |
|---|---|
| `javax.annotation.PostConstruct` (chương 2) | `jakarta.annotation.PostConstruct`; dependency `jakarta.annotation-api` |
| `spring.datasource.initialization-mode=always` (chương 12) | `spring.sql.init.mode=always` |
| Artifact `mysql:mysql-connector-java` (chương 12) | `com.mysql:mysql-connector-j` |
| `@MockBean` (chương 15) | Vẫn chạy, nhưng từ Boot 3.4 bị đánh dấu deprecated; thay bằng `@MockitoBean` |
| Phiên bản Spring Cloud OpenFeign (chương 11) | Chọn phiên bản Spring Cloud tương thích với Boot của bạn theo bảng trên spring.io |

Lời khuyên: khi mới học, **dùng đúng phiên bản trong project mẫu của sách** để mọi ví dụ chạy ngay. Sau khi hoàn thành sách, tạo lại dự án tổng hợp trên phiên bản mới nhất; việc tự xử lý các khác biệt trên cũng là một bài học tốt.

---

## 8. Những bẫy thường gặp khi mới học Spring

Đây là các lỗi mà người mới hay gặp, gom lại từ các cảnh báo rải rác trong sách:

1. **Thêm mọi object vào context.** Chỉ những object cần Spring quản lý (để được DI, transaction, aspect) mới nên là bean. `Comment`, `Product` là POJO, không phải bean (chương 4, 5).
2. **Dùng field injection trong production.** Không đặt được `final`, khó test. Dùng constructor (chương 3).
3. **Singleton bean có trạng thái thay đổi.** Gây race condition trong web app. `ProductService` với `List` ở chương 8 là ví dụ cố tình sai để minh họa (chương 5, 8).
4. **Inject prototype vào singleton rồi mong đợi instance mới.** Sẽ chỉ có một instance. Lấy từ `ApplicationContext` bên trong method (chương 5).
5. **Gọi method `@Transactional` từ chính class đó.** Proxy không được đi qua nên transaction không có tác dụng. Tách ra bean khác (hệ quả của cơ chế proxy ở chương 6, 13).
6. **Nuốt exception trong method `@Transactional`.** Không rollback (chương 13).
7. **Dựa vào tên method của Spring Data cho query phức tạp.** Dùng `@Query` (chương 14).
8. **Viết integration test cho mọi kịch bản.** Chậm và tốn tài nguyên; dùng unit test cho logic, integration test cho tích hợp với framework (chương 15).
9. **Tự viết đăng nhập trong ứng dụng thật.** Ví dụ chương 9 chỉ để học web scope; production dùng Spring Security.
10. **Lưu mật khẩu trong `application.properties`.** Chỉ dành cho ví dụ (chương 12).

---

## 9. Cách dùng bộ bản dịch này

- Mỗi file `.md` tương ứng đúng một file PDF cùng tên. Mở song song khi cần xem hình.
- Quy ước trong bản dịch:
  - `> **Hình x.y**`: chú thích hình (ảnh không trích xuất được, xem PDF).
  - `**Listing x.y**` + khối code: code giữ nguyên tiếng Anh 100%, kể cả comment và chuỗi.
  - ❶ ❷ ❸ trong code: xem giải thích ngay dưới khối code.
  - `> **LƯU Ý**`: tương ứng NOTE trong sách gốc.
  - Blockquote có tiêu đề in đậm: sidebar của sách.
- Thuật ngữ được giữ nguyên tiếng Anh theo đúng cách cộng đồng Việt Nam dùng khi đi làm: bean, context, dependency injection, aspect, proxy, scope, controller, repository, endpoint, transaction, commit, rollback, mock. Bạn nên **học và dùng các từ này bằng tiếng Anh**, vì tài liệu, thông báo lỗi và phỏng vấn đều dùng chúng.
- Một số dòng code trong PDF bị cắt cụt khi trích xuất đã được khôi phục theo đúng code trong sách; nếu thấy khác biệt nhỏ về thụt lề so với project mẫu thì đó là bình thường.
- Đọc trên máy tính với trình xem Markdown (VS Code, Obsidian, Typora) để có mục lục và tô màu code. Obsidian đặc biệt phù hợp vì bạn có thể viết ghi chú ở bước 5 ngay bên cạnh từng chương.

---

## 10. Sau khi đọc xong sách

Tác giả gợi ý các bước tiếp theo, theo thứ tự ưu tiên:

1. **Spring Security in Action** (cùng tác giả): xác thực và phân quyền, thứ bạn cần ngay cho bất kỳ ứng dụng thật nào.
2. **JUnit in Action** (Cătălin Tudose): đào sâu kiểm thử, phần sách này chỉ giới thiệu.
3. **Flyway hoặc Liquibase**: quản lý phiên bản schema database thay cho `schema.sql`.
4. **Spring Data JPA và Hibernate**: sách chỉ dùng Spring Data JDBC; JPA là thứ bạn gặp nhiều nhất khi đi làm.
5. **API Design Patterns** (J. J. Geewax): thiết kế REST API tốt.
6. Tài liệu chính thức: https://spring.io/projects và https://docs.spring.io/spring-framework/reference/. Sau cuốn sách này, bạn đã đủ nền để đọc trực tiếp tài liệu gốc.

Điều quan trọng nhất: **đừng đọc sách tiếp theo trước khi hoàn thành dự án tổng hợp ở mục 5.** Một ứng dụng nhỏ tự tay làm từ đầu đến cuối đáng giá hơn ba cuốn sách đọc lướt.
