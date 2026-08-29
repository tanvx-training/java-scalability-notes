# Giai đoạn 4 (Tháng 18–24): Distributed Systems & System Design — bản hướng dẫn thực hiện chi tiết

> Cấu trúc mỗi mục: **Mục tiêu** → **Cách thực hiện** → **Hoàn thành khi**.

## Output bắt buộc cuối giai đoạn

1. 2 design doc thực tế được review (ít nhất 1 tại công ty, 1 được triển khai).
2. Repo `distributed-patterns-demo`: 2–3 service Spring Boot với Kafka, Redis, Resilience4j, idempotent consumer, outbox — deploy được lên platform giai đoạn 3.
3. Pass 2 buổi mock system design mức Senior.
4. Hồ sơ Senior hoàn chỉnh: CV + GitHub + ≥ 4 bài blog.

## Tài nguyên chính

- Sách: **DDIA** (Kleppmann — quan trọng nhất cả roadmap), *Understanding Distributed Systems* (Vitillo — đọc trước nếu DDIA nặng), *System Design Interview* 1 & 2 (Alex Xu).
- Online: Kafka docs (phần Design) + developer.confluent.io; redis.io patterns; Resilience4j docs; microservices.io (saga, outbox, CQRS); ByteByteGo; engineering blog Netflix/Uber/Shopify; bài "Design Docs at Google" (industrialempathy.com).
- Công cụ: spring-kafka, Redis + Redisson, Resilience4j, Toxiproxy, k6, Excalidraw.

---

## Tháng 19–20 — Messaging, caching, resilience (vừa học vừa xây repo)

### Tuần 1–2: Kafka nền tảng

**Mục tiêu:** hiểu partition/consumer group/offset bằng thí nghiệm tự tay, không phải bằng định nghĩa.

**Cách thực hiện:**
1. Dựng Kafka 1 node KRaft bằng compose (image `apache/kafka`, lấy mẫu compose trong docs). Tạo topic 3 partition bằng `kafka-topics.sh --create --partitions 3`.
2. Khởi tạo repo `distributed-patterns-demo`: service `order-service` (REST nhận đơn → publish event `order-created` bằng `KafkaTemplate`, key = orderId) và `notification-service` (`@KafkaListener(groupId="notification")` in log).
3. Thí nghiệm 1 — cùng group chia việc: chạy 2 instance notification-service (2 port) → gửi 20 đơn → xem log: mỗi instance nhận từ partition khác nhau, không trùng message. Kill 1 instance → gửi tiếp → instance còn lại nhận hết (rebalance tận mắt).
4. Thí nghiệm 2 — khác group nhận đủ: thêm listener groupId "analytics" → mỗi message được cả 2 group nhận. Đây là khác biệt cốt lõi queue vs pub-sub.
5. Thí nghiệm 3 — ordering theo key: gửi 5 event cùng orderId → xem log chúng vào cùng 1 partition, đúng thứ tự; khác orderId thì không đảm bảo thứ tự toàn cục. Ghi chú: "Kafka chỉ đảm bảo thứ tự TRONG 1 partition".
6. Học dùng `kafka-consumer-groups.sh --describe --group notification` đọc: current offset, log-end offset, LAG — chỉ số vận hành quan trọng nhất của consumer.
7. Ghi chú Feynman: topic/partition/offset/consumer group qua chính 3 thí nghiệm trên.

**Hoàn thành khi:** 3 thí nghiệm có log bằng chứng trong README; giải thích được LAG là gì và vì sao phải theo dõi.

### Tuần 3–4: Idempotency & outbox — pattern ăn tiền của messaging

**Mục tiêu:** cài 2 pattern quan trọng nhất của hệ event-driven, có test chứng minh.

**Cách thực hiện:**
1. Hiểu vấn đề trước khi cài (viết vào README như 1 bài giảng):
   - At-least-once = message có thể đến ≥ 1 lần → consumer BẮT BUỘC idempotent.
   - Dual-write: `saveDB(); kafkaSend();` — crash giữa 2 lệnh → DB có đơn mà không có event (hoặc ngược lại). Không thể gói 2 hệ thống vào 1 transaction → outbox ra đời.
2. Cài outbox ở order-service: trong CÙNG transaction DB, insert đơn + insert bảng `outbox(id, aggregate_id, payload, created_at, published_at null)`. Một `@Scheduled` poller mỗi 500ms đọc các dòng `published_at is null` → publish Kafka → update `published_at`. (Debezium CDC là bản xịn hơn — đọc để biết, chưa cần cài.)
3. Test chứng minh outbox: viết test tắt poller → gọi API tạo đơn → verify DB có đơn + outbox có dòng chưa publish → bật poller → verify event ra Kafka. Kịch bản "crash giữa chừng" được mô phỏng chính bằng việc tắt/bật poller.
4. Cài idempotent consumer ở notification-service: bảng `processed_messages(message_id PK)`; trong listener, cùng 1 transaction: insert message_id (trùng → văng exception unique → skip) + xử lý nghiệp vụ.
5. Test chứng minh idempotency: gửi cùng 1 message 3 lần → verify nghiệp vụ chỉ thực hiện 1 lần. Test này + test outbox là 2 viên ngọc của repo.
6. Thêm cho đủ bộ: retry với backoff và Dead Letter Topic của spring-kafka (`DefaultErrorHandler` + `DeadLetterPublishingRecoverer`) — message hỏng sau N lần retry rơi vào topic `.DLT`, kiểm chứng bằng message poison (payload sai format).
7. Ghi chú Feynman: "Tại sao không thể vừa ghi DB vừa gửi Kafka trong 1 transaction, và outbox giải quyết thế nào".

**Hoàn thành khi:** 2 test chứng minh chạy xanh; message poison nằm trong DLT; giảng lại được dual-write cho junior bằng hình vẽ.

### Tuần 5–6: Redis & caching

**Mục tiêu:** cài cache-aside đo được hiệu quả, tự gây và chống được stampede.

**Cách thực hiện:**
1. Học 30 phút các chiến lược (cache-aside, read/write-through, write-behind) — nguồn: bài Caching challenges and strategies (AWS Builders' Library). Ghi bảng trade-off 4 dòng.
2. Cài cache-aside cho endpoint đọc nhiều của order-service: `@Cacheable(cacheNames="orders")` + `RedisCacheConfiguration` đặt TTL 60s + serializer JSON. Evict khi update (`@CacheEvict`). 
3. Benchmark trước/sau bằng k6 (100 VUs, 1 phút): p95 và throughput — thường thấy cải thiện 5–20 lần. Ghi bảng vào README.
4. Lab stampede: đặt TTL 10s, k6 giữ tải cao → quan sát mỗi 10s có "răng cưa" query DB dội lên (dùng log đếm query của giai đoạn 1). Fix 2 cách và đo lại: (a) jitter TTL (60s ± random 10s) — rẻ, hiệu quả; (b) lock: chỉ 1 request rebuild cache (Redisson `tryLock`), số còn lại chờ/nhận giá trị cũ.
5. Học thêm Redis ngoài cache qua 2 lab nhỏ: rate limiter bằng `INCR + EXPIRE` (cửa sổ cố định) cho 1 endpoint; leaderboard bằng sorted set (`ZADD`/`ZRANGE`).
6. Áp dụng tại công ty: tìm endpoint đọc nhiều ghi ít → đo thử → nếu đáng, đây chính là chất liệu cho **design doc #1** (tuần 15–16).

**Hoàn thành khi:** bảng benchmark trước/sau; ảnh "răng cưa" stampede trước fix và phẳng sau fix; nêu được rủi ro của cache (stale data, invalidation sai) chứ không chỉ lợi ích.

### Tuần 7–8: Resilience patterns

**Mục tiêu:** thấy tận mắt circuit breaker cứu hệ thống, hiểu timeout là pattern số 1.

**Cách thực hiện:**
1. Học lý thuyết 2 buổi theo thứ tự tầm quan trọng: timeout (mọi cuộc gọi ra ngoài PHẢI có timeout — không timeout là nguồn treo hệ thống số 1) → retry + exponential backoff + jitter (và khi nào retry GÂY HẠI: retry lên hệ đang quá tải = đổ dầu vào lửa; chỉ retry lỗi tạm thời, không retry lỗi 4xx) → circuit breaker (CLOSED/OPEN/HALF_OPEN) → bulkhead.
2. Setup: order-service gọi REST sang `payment-service` (service giả lập mới, có endpoint chỉnh được độ trễ/lỗi). Thêm `resilience4j-spring-boot3`.
3. Lab timeout + hậu quả của việc thiếu nó: payment-service delay 30s, order-service KHÔNG timeout → bắn 50 request → toàn bộ thread pool của order-service bị giam, endpoint KHÁC cũng chết theo (đo bằng curl endpoint không liên quan). Thêm timeout 2s (TimeLimiter/Feign timeout) → chỉ luồng payment lỗi, phần còn lại sống. Đây là demo thuyết phục nhất giai đoạn.
4. Lab circuit breaker: cấu hình sliding window 10, failureRateThreshold 50%, waitDuration 10s, fallback trả "payment đang bận, đơn ghi nhận xử lý sau". Bật payment-service lỗi 100% → gọi 10 lần → breaker OPEN (gọi tiếp bị chặn ngay, không chờ timeout — chính là giá trị: fail fast) → sau 10s HALF_OPEN thử vài request → payment hồi phục → CLOSED. Theo dõi trạng thái qua `/actuator/circuitbreakers` + metrics Micrometer trên Grafana (nối kỹ năng giai đoạn 2).
5. Dùng Toxiproxy (container) chen giữa 2 service để giả lập mạng chậm/đứt thay vì sửa code — công cụ chaos-testing nhẹ đáng biết.
6. Ghi chú Feynman: "Circuit breaker khác retry chỗ nào, và vì sao retry vô tội vạ làm sập hệ thống nhanh hơn".

**Hoàn thành khi:** demo "không timeout làm chết cả service" tái hiện được; xem được breaker đổi trạng thái trên Grafana; trả lời được "khi nào KHÔNG nên retry".

---

## Tháng 21–22 — DDIA & design doc #1

### Tuần 9–14: Đọc DDIA có kỷ luật (6 tuần)

**Mục tiêu:** nắm phần lõi DDIA và biết soi hệ thống của mình qua lăng kính đó.

**Cách thực hiện (quy trình lặp mỗi tuần):**
1. Lịch chương: T9: ch.1–2 → T10: ch.3 (LSM-tree vs B-tree) → T11: ch.5 (replication) → T12: ch.6–7 (partitioning, transactions) → T13: ch.8–9 (network/clock không tin được, consensus — đọc mức khái niệm, đừng sa lầy) → T14: ch.11–12 (stream) + tổng kết.
2. Nghi thức mỗi chương (3 buổi): buổi 1–2 đọc + gạch chân; buổi 3 viết ghi chú Feynman 1 trang KÈM mục bắt buộc "Hệ thống công ty tôi đang đứng đâu trong trade-off này?" — ví dụ ch.5: DB công ty replicate kiểu gì, replication lag từng gây bug đọc-sau-ghi nào chưa?
3. Móc nối với lab đã làm để kiến thức bám rễ: ch.3 giải thích vì sao Kafka ghi nhanh (log tuần tự); ch.7 nối lại isolation levels giai đoạn 1 lên tầm phân tán; ch.11 chính là lý thuyết của outbox/CDC bạn đã cài.
4. Song song từ T11: mỗi tuần đọc 1 bài engineering blog (Netflix/Uber/Shopify), ghi 3 điều học được vào file `reading-notes.md`. Chọn bài liên quan chương đang đọc càng tốt.
5. Nếu DDIA quá nặng ngay ch.3: đọc *Understanding Distributed Systems* trước 3 tuần rồi quay lại — đường vòng này nhanh hơn bỏ cuộc.

**Hoàn thành khi:** 6 ghi chú Feynman đều có mục "hệ thống của tôi"; kể được 3 ví dụ nối lý thuyết DDIA với lab đã tự làm.

### Tuần 15–16: Design doc #1 tại công ty

**Mục tiêu:** viết và bảo vệ design doc đầu tiên — nghi thức trưởng thành của Senior.

**Cách thực hiện:**
1. Chọn đề bài THẬT đang nhức nhối: thêm cache cho endpoint chậm (chất liệu tuần 5–6), chuyển 1 luồng đồng bộ sang async qua queue, cải thiện resilience khi gọi bên thứ 3, hay tách 1 module nặng. Đề nhỏ mà thật hơn đề to mà tưởng tượng.
2. Viết theo template (đọc "Design Docs at Google" trước): **Context** (vấn đề, số liệu hiện trạng) → **Goals / Non-goals** (non-goals quan trọng không kém — chặn phình phạm vi) → **2–3 phương án** mỗi cái ưu/nhược/chi phí (BẮT BUỘC ≥ 2 phương án nghiêm túc; 1 phương án = chưa phải design doc) → **Đề xuất + lý do** → **Rollout plan** (feature flag? rollback thế nào?) → **Rủi ro & câu hỏi mở**. Dài 2–4 trang, có 1 sơ đồ.
3. Gửi trước cho 1 đồng nghiệp tin cậy đọc nháp → sửa → xin lead 30–45 phút review với team. Trong buổi review: ghi hết phản hồi, KHÔNG phòng thủ; câu "em chưa nghĩ đến, để em phân tích thêm" là câu của Senior thật.
4. Sửa bản cuối, xin nhận triển khai. Lưu bản ẩn danh hóa vào repo cá nhân.

**Hoàn thành khi:** doc đã qua review thật, có phần phản hồi và quyết định cuối; việc triển khai đã bắt đầu.

---

## Tháng 23 — System design & mentoring

### Tuần 17–18: Luyện system design có phương pháp

**Mục tiêu:** có framework trả lời và luyện 4 đề đầu đúng chuẩn phỏng vấn.

**Cách thực hiện:**
1. Đọc Alex Xu tập 1 ch.1–4, thuộc framework 4 bước + phân bổ thời gian cho buổi 45 phút: làm rõ yêu cầu + ước lượng (5–7') → thiết kế high-level, vẽ hộp và luồng (15') → đào sâu 1–2 component nóng nhất (15') → trade-off, bottleneck, failure mode (5–7').
2. Luyện ước lượng nhanh (kỹ năng hay bị lộ yếu nhất): thuộc vài con số — 1 ngày ≈ 86.400s; 1 triệu request/ngày ≈ 12 rps (peak ×5–10); 1 server DB gánh vài nghìn qps đọc đơn giản. Tập 10 bài tính nhẩm dạng "10M user, mỗi người 5 request/ngày → rps trung bình? peak? dung lượng lưu trữ nếu mỗi request sinh 1KB/ngày trong 1 năm?".
3. Luyện 4 đề, mỗi đề đúng nghi thức thi thật: bấm giờ 45 phút, vẽ trên Excalidraw, NÓI THÀNH TIẾNG và ghi âm (nói to là một nửa của phỏng vấn — luyện sớm): URL shortener, rate limiter, notification system, news feed.
4. Sau mỗi đề: nghe lại ghi âm, đối chiếu chương tương ứng trong Alex Xu, tự chấm theo 4 lỗi phổ biến: quên hỏi làm rõ yêu cầu; không ước lượng số; không bàn failure mode; không chốt trade-off mà chỉ liệt kê.

**Hoàn thành khi:** 4 đề có bản vẽ + ghi âm + bản tự chấm; làm chủ nhịp 45 phút không cháy giờ.

### Tuần 19–20: 4 đề nâng cao + design doc #2 + mentoring

**Cách thực hiện:**
1. Luyện tiếp 4 đề khó hơn, cùng nghi thức: chat system (WebSocket, presence), key-value store phân tán (áp dụng trực tiếp DDIA ch.5–6), **payment flow (trọng tâm idempotency — bạn có lab thật để kể)**, web crawler.
2. Design doc #2: tại công ty nếu có đề bài (tốt nhất); không có thì viết tài liệu kiến trúc hoàn chỉnh cho chính `distributed-patterns-demo` theo đúng template — ít nhất được luyện văn phong và trở thành tài liệu đỉnh của repo.
3. Mentoring — bắt đầu chính thức: đề nghị lead cho kèm 1 junior/fresher. Cấu trúc: 1 buổi pair 45'/tuần + review code của bạn ấy với quy tắc "mỗi comment phải có TẠI SAO, không chỉ hãy sửa thành X". Không có junior → 30'/tuần trả lời câu hỏi cộng đồng (Stack Overflow, group Java Việt Nam) — cũng luyện được kỹ năng giải thích.

**Hoàn thành khi:** tổng 8 đề đã luyện có ghi âm; doc #2 hoàn chỉnh; lịch mentoring chạy đều ≥ 3 tuần.

---

## Tháng 24 — Mock interview & đóng gói hồ sơ Senior

### Tuần 21–22: Mock system design interview

**Cách thực hiện:**
1. Sắp xếp 2 buổi mock với người có kinh nghiệm phỏng vấn Senior (đồng nghiệp senior/mentor/Pramp/interviewing.io), mỗi buổi 1 đề BẠN CHƯA LUYỆN, 45–60 phút, xin chấm thẳng tay theo 3 câu: đủ tầm Senior chưa? điểm yếu nhất? nếu là hội đồng thật anh/chị pass không?
2. Giữa 2 buổi cách 1 tuần: luyện bù đúng điểm yếu buổi 1 chỉ ra (thường là ước lượng, failure mode, hoặc nói lan man không chốt).

### Tuần 23–24: Đóng gói hồ sơ

**Cách thực hiện:**
1. CV theo công thức thành tích "làm X, bằng cách Y, kết quả Z đo được" — lôi nguyên liệu 24 tháng ra: case N+1 (41 query → 2), deploy (30' → 5'), platform IaC, design doc đã triển khai, mentoring. Mỗi gạch đầu dòng phải có con số.
2. GitHub: pin 3 repo (`java-deep-dive`, `production-ready-platform`, `distributed-patterns-demo`), rà README từng repo bằng con mắt nhà tuyển dụng lướt 60 giây.
3. Viết blog tổng kết "24 tháng từ CRUD developer đến Senior: những gì tôi làm khác đi" — bài dạng này luôn được đọc nhiều nhất và là lời giới thiệu bản thân tốt nhất.
4. Chấm checklist cuối. Chọn nước đi: (a) đề xuất thăng chức nội bộ — đặt lịch 1:1 với manager, mang theo bộ bằng chứng + khung "tôi đã làm việc ở mức Senior 6 tháng qua, đây là bằng chứng"; hoặc (b) ra thị trường — rải CV có chọn lọc, tận dụng blog/GitHub làm điểm khác biệt.

### Tuần 25–26: Buffer + phỏng vấn thật

Dùng làm buffer, ôn tập theo bộ câu hỏi dưới, hoặc bắt đầu phỏng vấn.

## Bộ câu hỏi tự kiểm tra cuối roadmap

1. Thiết kế notification system cho 10 triệu user trong 45 phút.
2. Kafka: đạt "exactly-once" thực tế bằng cách nào?
3. Outbox giải quyết gì, cài thế nào, trade-off (độ trễ, thứ tự)?
4. Các chiến lược cache invalidation và rủi ro từng cái?
5. Circuit breaker khác retry chỗ nào? Khi nào retry gây hại?
6. Replication lag gây vấn đề gì? Xử lý đọc-sau-ghi ra sao?
7. Vì sao timeout là resilience pattern quan trọng nhất? (kể demo của bạn)
8. Thiết kế idempotency key cho payment flow?
9. Trình bày design doc của bạn: các phương án và lý do chọn.
10. Junior hỏi "sao không microservices hết cho máu?" — trả lời thế nào?

## Checklist đánh giá cuối giai đoạn (và cuối roadmap)

- [ ] 2 design doc, ≥ 1 được triển khai thật
- [ ] Repo demo có test chứng minh outbox + idempotency, demo circuit breaker trên Grafana
- [ ] 6 ghi chú Feynman DDIA có mục "hệ thống của tôi"
- [ ] 8 đề system design đã luyện + pass 2 buổi mock
- [ ] Mentoring chạy đều, junior chủ động tìm đến hỏi
- [ ] Trả lời trôi chảy ≥ 8/10 câu tự kiểm tra
- [ ] CV + GitHub + ≥ 4 blog sẵn sàng nộp Senior

Đạt ≥ 6/7 → bạn đã làm việc ở mức Senior; việc còn lại là lấy chức danh — đàm phán nội bộ với bộ bằng chứng, hoặc ra thị trường với hồ sơ mà phần lớn ứng viên không có.
