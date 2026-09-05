# Giai đoạn 1 (Tháng 1–6): Java & Spring chuyên sâu — bản hướng dẫn thực hiện chi tiết

> Cấu trúc mỗi mục: **Mục tiêu** → **Cách thực hiện** (từng bước cụ thể) → **Hoàn thành khi** (tiêu chí nghiệm thu).

## Output bắt buộc cuối giai đoạn

1. Repo GitHub `java-deep-dive`: ≥ 10 chủ đề, mỗi chủ đề có code thử nghiệm + ghi chú Feynman.
2. 2 case optimize thực tế tại công ty, có tài liệu và số liệu trước/sau.
3. Pass mock interview Java Senior.

## Tài nguyên chính

- Sách: *Effective Java* (Bloch), *Java Concurrency in Practice* (Goetz), *High-Performance Java Persistence* (Vlad Mihalcea).
- Online: blog vladmihalcea.com, Baeldung (tra cứu), Spring source trên GitHub, JEP index (openjdk.org/jeps), talks Devoxx/Spring I/O.
- Công cụ: IntelliJ debugger, VisualVM hoặc Eclipse MAT, `jcmd`/`jstack`/`jmap`, JMH, Testcontainers, EXPLAIN của DB công ty.

---

## Tháng 1 — Java hiện đại & JVM

### Tuần 1–2: Setup + Java 17–21

**Mục tiêu:** dựng nền nếp học tập và cập nhật ngôn ngữ hiện đại.

**Cách thực hiện:**
1. Tạo repo `java-deep-dive` trên GitHub, cấu trúc: `/jvm-gc`, `/collections`, `/concurrency`, `/spring-internals`, `/jpa-sql`, `/testing`. Mỗi thư mục sẽ có `README.md` (ghi chú Feynman) + code.
2. Cài JDK 21 (SDKMAN: `sdk install java 21-tem`), tạo project Maven/Gradle trong repo.
3. Đọc Effective Java ch.1–3. Cách đọc đúng: mỗi item, gõ lại ví dụ + tự viết 1 ví dụ khác của riêng mình. Ghi vào README mỗi item 2–3 dòng "khi nào áp dụng ở dự án của tôi".
4. Với mỗi tính năng mới (records, sealed classes, pattern matching cho switch, text blocks): viết 1 file demo có cả cách viết cũ và cách viết mới cạnh nhau, kèm comment giải thích khác biệt. Ví dụ: refactor 1 DTO class 50 dòng thành record 3 dòng.
5. Áp dụng tại công ty: chọn 1 class đang dùng constructor nhiều tham số, refactor sang Builder (Item 2); thêm `Objects.requireNonNull` cho tham số bắt buộc; tự tạo PR và tự review lý do từng thay đổi.

**Hoàn thành khi:** repo đã có commit đầu tiên với ≥ 4 demo tính năng mới; PR refactor ở công ty được merge; kể được không cần nhìn tài liệu 5 items tâm đắc nhất của EJ ch.1–3.

### Tuần 3–4: JVM memory & GC

**Mục tiêu:** hiểu heap/metaspace/stack, cơ chế GC, và tự tay chẩn đoán memory leak.

**Cách thực hiện:**
1. Học lý thuyết (2 buổi): xem talk "Understanding Java Garbage Collection" (Devoxx) + đọc docs Oracle về G1. Vẽ tay sơ đồ heap: Eden → Survivor → Old gen, chụp bỏ vào README.
2. Lab gây leak: viết class có `static List<byte[]> CACHE = new ArrayList<>();`, mỗi giây add 1 mảng `new byte[1_048_576]` (1MB). Chạy với `-Xmx256m`.
3. Chẩn đoán bằng VisualVM: attach vào process → tab Monitor xem heap tăng dần không giảm sau GC (dấu hiệu leak) → bấm Heap Dump khi heap gần đầy → trong dump, sort theo Retained Size → thấy `byte[]` chiếm nhiều nhất → click chuột phải "Show Nearest GC Root" → truy ra static field. Ghi lại từng bước + ảnh chụp màn hình vào README.
4. Làm lại bằng dòng lệnh (kỹ năng production, khi không có GUI): `jcmd <pid> GC.heap_info`, `jmap -dump:live,format=b,file=heap.hprof <pid>`, mở file bằng Eclipse MAT → chạy "Leak Suspects Report".
5. Lab GC log: chạy app Spring Boot công ty (bản dev) với `-Xlog:gc*:file=gc.log:time,uptime`. Bắn tải bằng `hey -z 60s http://localhost:8080/...`. Mở gc.log, tìm các dòng Pause, ghi lại pause dài nhất. Upload log lên gceasy.io để xem biểu đồ. Đổi `-Xmx` (256m → 1g) chạy lại, so sánh tần suất GC và pause time, ghi kết luận.
6. Viết ghi chú Feynman "GC hoạt động thế nào" (1 trang): tưởng tượng giảng cho junior, không dùng từ nào mình không giải thích được.

**Hoàn thành khi:** tự tìm ra leak trong dump mà không cần xem lại hướng dẫn; trả lời được "heap tăng liên tục sau full GC nghĩa là gì"; README có đủ ảnh + kết luận thí nghiệm GC log.

---

## Tháng 2 — Collections & Effective Java tiếp

### Tuần 5–6: Collections internals, equals/hashCode

**Mục tiêu:** hiểu HashMap tận gốc và hợp đồng equals/hashCode.

**Cách thực hiện:**
1. Đọc EJ items về equals/hashCode/compareTo. Lab nhanh: viết class chỉ override equals mà không override hashCode → bỏ vào HashSet → chứng minh bug bằng test (`set.contains()` trả false với object "bằng nhau"). Đây là demo thuyết phục nhất về hợp đồng equals-hashCode.
2. Đọc source `java.util.HashMap` trong IntelliJ (Ctrl+Click): đọc hàm `hash()`, `putVal()`, hằng số `TREEIFY_THRESHOLD = 8`, `DEFAULT_LOAD_FACTOR = 0.75`. Không cần hiểu hết, chỉ cần thấy bucket + linked list + cây.
3. Lab chính: tự cài `MyHashMap<K,V>` (~100 dòng): mảng bucket, mỗi bucket là linked list node; `put` = hash % length rồi duyệt list; resize khi size > 0.75 × capacity. Viết test so kết quả với HashMap thật. Push vào `/collections`.
4. Lab JMH: setup JMH (thêm dependency `jmh-core` + `jmh-generator-annprocess`, hoặc dùng archetype chính thức). Viết benchmark `@Benchmark` so sánh ArrayList vs LinkedList: `add(size/2, x)` với size 100k. Chạy, đọc kết quả, ghi vào README kèm giải thích tại sao LinkedList thua cả bài "sở trường" của nó (chi phí duyệt đến vị trí giữa).
5. Đọc thêm sự khác nhau ConcurrentHashMap vs HashMap vs Collections.synchronizedMap: viết bảng so sánh 5 dòng trong README (lock granularity, iterator, null key).

**Hoàn thành khi:** MyHashMap pass test; giải thích được miệng "chuyện gì xảy ra khi gọi map.put(key, value)" từ hash đến resize; benchmark có số liệu thật.

### Tuần 7–8: Generics, lambda, stream

**Mục tiêu:** dùng generics/stream đúng, biết giới hạn của chúng.

**Cách thực hiện:**
1. Đọc EJ phần generics. Lab PECS: viết method `copy(List<? super T> dst, List<? extends T> src)` và thử compile các trường hợp sai để thấy compiler chặn gì. Ghi quy tắc PECS bằng ví dụ của mình.
2. Lab type erasure: viết `List<String>` và `List<Integer>`, in `getClass()` của cả hai → cùng class. Thử `new T[]` → hiểu tại sao không được. 
3. Đọc EJ phần lambda/stream, đặc biệt item "prefer side-effect-free functions in streams".
4. Áp dụng tại công ty: `grep` toàn dự án tìm raw type (`List<`) và stream lồng 3 tầng trở lên. Chọn 1 chỗ, refactor: stream phức tạp → tách method có tên rõ nghĩa hoặc quay về for-loop nếu dễ đọc hơn. Trong description PR, viết rõ lý do — luyện kỹ năng thuyết phục bằng văn bản của Senior.

**Hoàn thành khi:** PR được merge; giải thích được PECS không cần nhìn note; nêu được 2 trường hợp stream làm code TỆ hơn.

---

## Tháng 3 — Concurrency phần 1

### Tuần 9–10: Thread safety, visibility, atomicity

**Mục tiêu:** tự tay tái hiện race condition và hiểu Java Memory Model ở mức thực dụng.

**Cách thực hiện:**
1. Đọc JCiP ch.1–4 (mỗi tối 1 mục nhỏ, sách này phải đọc chậm).
2. Lab race condition: class `Counter` có `int count`; 2 thread, mỗi thread gọi `count++` 1 triệu lần; join rồi in kết quả → gần như luôn < 2 triệu. Chạy 5 lần ghi 5 kết quả khác nhau vào README (tính không xác định là bài học).
3. Fix bằng 3 cách, mỗi cách 1 class: `synchronized`, `AtomicInteger`, `LongAdder`. Viết JMH benchmark 3 cách với 8 thread → thấy LongAdder thắng khi contention cao. Ghi bảng số liệu.
4. Lab visibility: thread A chạy `while(!stop) {}`, thread B set `stop = true` sau 1 giây. Không có `volatile` → có thể treo vô hạn (chạy với JIT, bỏ print trong loop). Thêm `volatile` → dừng ngay. Đây là demo visibility kinh điển — tự chạy được nó ăn đứt đọc 10 bài blog.
5. Ghi chú Feynman: "Tại sao volatile đủ cho cờ stop nhưng không đủ cho counter" (visibility ≠ atomicity).

**Hoàn thành khi:** cả 2 lab tái hiện được lỗi và fix được; phát biểu được happens-before bằng lời của mình kèm 1 ví dụ.

### Tuần 11–12: Thread pool & ExecutorService

**Mục tiêu:** cấu hình thread pool có chủ đích, không dùng mù default.

**Cách thực hiện:**
1. Đọc JCiP ch.6–8. Học thuộc thứ tự quyết định của ThreadPoolExecutor khi nhận task mới: core chưa đầy → tạo thread; core đầy → vào queue; queue đầy → tạo đến max; max đầy → rejection. (90% người dùng sai vì tưởng max được dùng trước queue.)
2. Lab: tạo `ThreadPoolExecutor(2, 4, 60s, ArrayBlockingQueue(10), AbortPolicy)`. Submit 50 task, mỗi task sleep 1s. Quan sát: 2 chạy, 10 xếp hàng, tạo thêm đến 4, còn lại văng `RejectedExecutionException`. Đổi sang `CallerRunsPolicy` chạy lại → thấy task chạy trên chính thread submit (cơ chế backpressure tự nhiên). Ghi lại quan sát.
3. Học công thức sizing: CPU-bound ≈ số core; IO-bound ≈ core × (1 + wait/compute). Làm bài tính cụ thể với app của bạn: nếu mỗi request chờ DB 80ms, xử lý 20ms, máy 4 core → pool ≈ 4 × (1 + 80/20) = 20.
4. Áp dụng tại công ty: kiểm tra `@Async` và `@Scheduled` đang chạy trên pool nào (`logging.level.org.springframework.scheduling=DEBUG` hoặc đặt breakpoint). Nếu đang dùng `SimpleAsyncTaskExecutor` (tạo thread mới mỗi lần — nguy hiểm) hoặc pool 1 thread mặc định của scheduler, viết đề xuất cấu hình `ThreadPoolTaskExecutor` tường minh kèm giải thích con số. Gửi team lead.

**Hoàn thành khi:** vẽ được từ trí nhớ sơ đồ quyết định của ThreadPoolExecutor; đề xuất cấu hình ở công ty đã gửi (được duyệt hay không cũng tính, vì mục tiêu là tư duy + trình bày).

---

## Tháng 4 — Concurrency phần 2 & Spring internals

### Tuần 13–14: CompletableFuture & virtual threads

**Mục tiêu:** xử lý song song hiện đại và biết khi nào virtual threads đáng dùng.

**Cách thực hiện:**
1. Lab nền: viết 3 method giả lập gọi API (mỗi cái `Thread.sleep(1000)` trả về chuỗi). Cài 3 phiên bản gọi cả 3: (a) tuần tự ~3s; (b) `CompletableFuture.supplyAsync` × 3 + `allOf` ~1s; (c) virtual threads qua `Executors.newVirtualThreadPerTaskExecutor()` ~1s. Đo bằng `System.nanoTime`, ghi bảng.
2. Học kỹ CompletableFuture: `thenApply` vs `thenCompose` (map vs flatMap), `exceptionally`, `orTimeout`. Viết demo chuỗi: gọi API A → lấy kết quả gọi B → nếu lỗi trả default → timeout 2s.
3. Học virtual threads: đọc JEP 444. Lab pinning: virtual thread chạy `synchronized` block có sleep bên trong, bật `-Djdk.tracePinnedThreads=full` → thấy cảnh báo pinned. Hiểu: synchronized giữ carrier thread (trước Java 24), nên code cũ nhiều synchronized chưa hưởng lợi ngay.
4. Thí nghiệm ấn tượng: tạo 100.000 virtual threads mỗi cái sleep 1s → chạy ngon trong ~1s; thử 100.000 platform threads → OOM hoặc treo máy. Ghi số liệu — đây là câu chuyện kể hay khi phỏng vấn.

**Hoàn thành khi:** giải thích được thenApply vs thenCompose bằng ví dụ; nói được 2 trường hợp virtual threads KHÔNG giúp gì (CPU-bound, pinning).

### Tuần 15–16: Spring IoC & AOP — vén màn magic

**Mục tiêu:** debug tận mắt vòng đời bean và hiểu proxy.

**Cách thực hiện:**
1. Chuẩn bị: trong IntelliJ, mở project Spring Boot công ty (bản dev), vào 1 class của Spring → bấm "Download Sources" để đọc được source thật.
2. Lab debug bean lifecycle (lab quan trọng nhất giai đoạn): đặt breakpoint tại `AbstractAutowireCapableBeanFactory#doCreateBean`. Start app ở chế độ debug với điều kiện breakpoint `beanName.equals("tênBeanCủaBạn")`. Step qua 3 pha: `createBeanInstance` (gọi constructor) → `populateBean` (inject @Autowired) → `initializeBean` (BeanPostProcessor before → @PostConstruct → after). Vẽ sơ đồ 3 pha này, bỏ vào README.
3. Lab chứng minh proxy: inject 1 bean có `@Transactional`, đặt breakpoint và xem `getClass()` → thấy tên kiểu `...$$SpringCGLIB$$...` chứ không phải class của bạn. Đó là bằng chứng AOP = proxy bọc ngoài.
4. Lab self-invocation: trong 1 service, method `a()` (không annotation) gọi `this.b()` (có `@Transactional`). Bật log `logging.level.org.springframework.transaction.interceptor=TRACE` → gọi qua `a()` không thấy log mở transaction; gọi `b()` trực tiếp từ ngoài → có. Kết luận: `this.` đi thẳng vào object thật, né proxy.
5. Lab viết aspect: tự tạo annotation `@LogTime` + `@Aspect` với `@Around` đo thời gian method. Gắn vào 2 method trong app, xem log. Hiểu pointcut expression cơ bản.
6. Học lý thuyết bù: JDK dynamic proxy (cần interface) vs CGLIB (subclass), tại sao final method không proxy được.

**Hoàn thành khi:** kể lại được hành trình 1 bean từ class thành object trong container theo trí nhớ; giải thích được cho đồng nghiệp tại sao self-invocation làm mất @Transactional kèm demo.

---

## Tháng 5 — Transaction, JPA & SQL

### Tuần 17–18: @Transactional tận gốc

**Mục tiêu:** viết bộ test tái hiện 5 bẫy transaction — tài sản quý nhất của repo.

**Cách thực hiện:**
1. Setup: project test với Testcontainers PostgreSQL/MySQL (đúng DB công ty dùng): `@Testcontainers`, `@Container static PostgreSQLContainer<?>`, `@DynamicPropertySource` trỏ datasource vào container.
2. Cách kiểm tra "có transaction hay không" trong test: log `TransactionSynchronizationManager.isActualTransactionActive()` bên trong method, hoặc bật TRACE log transaction interceptor như tuần trước.
3. Viết 5 test, mỗi test 1 bẫy:
   - **Self-invocation**: như lab tuần trước nhưng verify bằng dữ liệu (exception giữa chừng mà dữ liệu vẫn commit).
   - **Checked exception không rollback**: method `@Transactional` insert rồi `throw new Exception()` → verify dữ liệu VẪN CÒN trong DB. Fix bằng `rollbackFor = Exception.class` → verify đã rollback.
   - **Method không public**: `@Transactional` trên method package-private → verify không có transaction.
   - **Bắt exception rồi nuốt trong transaction lồng nhau**: outer REQUIRED gọi inner REQUIRED, inner ném RuntimeException, outer catch → verify outer commit văng `UnexpectedRollbackException` (transaction đã bị đánh dấu rollback-only).
   - **REQUIRES_NEW**: inner REQUIRES_NEW commit xong, outer rollback → verify dữ liệu của inner vẫn còn, của outer mất.
4. Mỗi test kèm comment giải thích "tại sao" 3–5 dòng. Push vào `/spring-internals/transactional-traps`.
5. Học propagation còn lại (NESTED, MANDATORY, NOT_SUPPORTED) ở mức đọc hiểu, không cần lab hết.
6. Viết ghi chú Feynman "5 trường hợp @Transactional không hoạt động như bạn nghĩ" — bài này có thể thành blog post đầu tiên của bạn.

**Hoàn thành khi:** 5 test xanh và tự giải thích được từng test; đồng nghiệp đọc hiểu được README của bạn.

### Tuần 19–20: JPA hiệu năng — N+1 (case optimize #1)

**Mục tiêu:** tìm và diệt N+1 thật ở công ty, có số liệu.

**Cách thực hiện:**
1. Bật công cụ đếm query trên môi trường dev công ty: thêm `spring.jpa.properties.hibernate.generate_statistics=true` + log SQL, hoặc gọn hơn: thêm p6spy/datasource-proxy để log kèm đếm số câu SQL mỗi request.
2. Săn N+1: gọi các endpoint trả về danh sách có quan hệ (order → items, user → roles). Dấu hiệu: 1 câu SELECT cha + N câu SELECT con giống hệt nhau chỉ khác id.
3. Đo "trước": số query/request + latency (dùng `curl -w "%{time_total}"` chạy 20 lần lấy trung bình, hoặc `hey -n 200`).
4. Fix theo thứ tự ưu tiên: (a) `join fetch` trong JPQL nếu luôn cần dữ liệu con; (b) `@EntityGraph` nếu muốn linh hoạt theo use case; (c) `hibernate.default_batch_fetch_size=20` nếu sửa query khó (giảm N+1 thành N/20+1). Đọc bài của Vlad Mihalcea về từng cách trước khi chọn.
5. Cẩn thận bẫy mới: join fetch 2 collection cùng lúc → `MultipleBagFetchException`; join fetch + phân trang → Hibernate phân trang trong memory (có warning trong log — phải kiểm tra).
6. Đo "sau", viết tài liệu case 1 trang: bối cảnh → cách phát hiện → phương án cân nhắc → số liệu trước/sau (VD: 41 query → 2 query, p95 780ms → 95ms). Gửi team lead + lưu bản ẩn danh vào repo.

**Hoàn thành khi:** tài liệu case #1 hoàn chỉnh có số liệu thật; giải thích được vì sao chọn phương án này thay vì 2 phương án kia.

### Tuần 21–22: SQL — index & execution plan (case optimize #2)

**Mục tiêu:** đọc execution plan thành thạo và fix 1 query chậm thật.

**Cách thực hiện:**
1. Học nền (2 buổi): B-tree index hoạt động thế nào; quy tắc leftmost prefix của composite index; covering index. Nguồn: use-the-index-luke.com (miễn phí, hay nhất về chủ đề này).
2. Luyện đọc plan trên DB công ty dùng: PostgreSQL: `EXPLAIN (ANALYZE, BUFFERS) <query>` — tìm `Seq Scan` trên bảng lớn, so `rows` ước tính vs thật; MySQL: `EXPLAIN` — nhìn cột `type` (ALL = full scan là xấu), `rows`, `Extra` (Using filesort, Using temporary là cờ đỏ).
3. Lab sandbox trước khi làm thật: tạo bảng 1 triệu dòng bằng `generate_series` (PG) hoặc procedure (MySQL). Chạy query WHERE trên cột chưa index → xem plan → tạo index → xem plan đổi. Sau đó tự phá: bọc cột trong function `WHERE UPPER(email) = ...` → index không được dùng nữa. Thử leading wildcard `LIKE '%abc'`. Ghi từng thí nghiệm vào README.
4. Săn query chậm thật ở công ty: PostgreSQL: bật/xin quyền xem `pg_stat_statements`, sort theo `total_exec_time`; MySQL: bật slow query log với `long_query_time=1`. Không có quyền → xin DBA/lead export top 10 query chậm.
5. Chọn 1 query, đo trước → đọc plan → fix (thêm/sửa composite index đúng thứ tự cột theo selectivity, hoặc viết lại query) → đo sau. Lưu ý Senior: index mới làm chậm write và tốn dung lượng — ghi rõ trade-off này trong đề xuất.
6. Học isolation levels bằng lab 2 terminal: mở 2 session cùng lúc, tự tạo non-repeatable read ở READ COMMITTED, rồi đổi REPEATABLE READ xem khác gì. Trực quan hơn mọi bài viết.
7. Viết tài liệu case #2 giống format case #1.

**Hoàn thành khi:** đọc plan không cần Google từng từ; case #2 có số liệu; trả lời được "composite index (a,b,c) — query WHERE b=? có dùng được không, tại sao".

---

## Tháng 6 — Testing & tổng kết

### Tuần 23–24: Testing đáng tin

**Mục tiêu:** nâng chất lượng test module mình phụ trách lên chuẩn có thể tin để refactor.

**Cách thực hiện:**
1. Học nguyên tắc (1 buổi): test hành vi qua public API, không test private method; mỗi test 1 lý do fail; đặt tên theo `should_X_when_Y`.
2. Audit module của bạn ở công ty: liệt kê các luồng nghiệp vụ chính → đánh dấu luồng nào chưa có test. Coverage số % không phải mục tiêu; mục tiêu là "luồng quan trọng nào cũng có test".
3. Viết integration test với Testcontainers cho tầng repository + 1–2 luồng API end-to-end (`@SpringBootTest` + `MockMvc`/`WebTestClient` + DB container). Bật reuse container cho nhanh: file `~/.testcontainers.properties` thêm `testcontainers.reuse.enable=true` + `.withReuse(true)`.
4. Rà mock: chỗ nào mock repository chỉ để test service gọi repository → đó là test implementation, xóa hoặc thay bằng integration test.
5. Đề xuất team: đưa Testcontainers vào dự án (nếu chưa có) kèm demo thời gian chạy thực tế.

**Hoàn thành khi:** các luồng chính của module có test; bạn dám refactor module mà chỉ cần chạy test để yên tâm — đó là thước đo thật.

### Tuần 25–26: Ôn tập & mock interview

**Cách thực hiện:**
1. Tuần 25: đọc lại toàn bộ ghi chú Feynman. Với 10 câu hỏi bên dưới: tự trả lời thành tiếng, ghi âm, nghe lại — chỗ nào ấp úng là chỗ chưa hiểu, quay lại lab tương ứng.
2. Tuần 26: hẹn 1 senior/mentor mock interview 60 phút (không có thì dùng ghi âm tự chấm theo checklist). Chấm checklist cuối giai đoạn, làm review quý theo file 00.

## Bộ câu hỏi tự kiểm tra

1. G1 hoạt động thế nào, khi nào chọn ZGC?
2. Các bước chẩn đoán memory leak trên production?
3. HashMap xử lý collision ra sao, tại sao Java 8 treeify bucket?
4. Happens-before là gì? volatile giải quyết gì và không giải quyết gì?
5. Cách tính size thread pool IO-bound vs CPU-bound (kèm ví dụ số)?
6. Virtual threads giải quyết gì, pinning là gì?
7. @Transactional mở transaction ở đâu? 5 trường hợp fail âm thầm?
8. N+1: 3 cách fix và trade-off từng cách?
9. Composite index (a,b,c): query nào dùng được?
10. Kể 2 case optimize thật: chẩn đoán, giải pháp, số liệu.

## Checklist đánh giá cuối giai đoạn

- [ ] Repo ≥ 10 chủ đề có code + ghi chú Feynman
- [ ] Bộ 5 test transactional-traps chạy xanh
- [ ] 2 case optimize có tài liệu + số liệu trước/sau
- [ ] Đã debug vào source Spring ≥ 3 lần
- [ ] Module phụ trách có integration test Testcontainers
- [ ] Trả lời trôi chảy ≥ 8/10 câu tự kiểm tra

Đạt ≥ 5/6 → sang giai đoạn 2. Trượt riêng concurrency/JPA → kéo dài chủ đề đó 3–4 tuần song song với giai đoạn 2.
