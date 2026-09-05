// Lộ trình Senior Java — Giai đoạn 4: Distributed Systems & System Design
// (tháng 18–24).
//
// Nguồn: sources/senior-java/04-giai-doan-4-system-design.md (tài liệu sj-04).
// Mỗi mục là MỘT BƯỚC trong "Cách thực hiện" của tuần tương ứng.
//
// GIỮ NGUYÊN id (sj-gd4-w<N> / sj-gd4-w<N>-<M>) — tiến độ localStorage lưu
// theo id này. Khối cuối `sj-gd4-done` là cổng nghiệm thu giai đoạn, nhận
// badge "✓" thay cho số tuần.
//
// Tuần 9–14 trong nguồn ghi tiêu đề "Cách thực hiện (quy trình lặp mỗi
// tuần):" nhưng vẫn là 5 bước đánh số bình thường — xử lý như mọi tuần khác.
//
// Tuần 19–20, 21–22 và 23–24 không có "Mục tiêu:" trong nguồn — `goal` viết
// lại từ tiêu đề mục và phần mở đầu, theo đúng quy tắc của Task 2/3. Tuần
// 21–22 và 23–24 cũng không có "Hoàn thành khi:" — `doneWhen` bị bỏ qua
// (không bịa).
//
// Tuần 25–26 trong nguồn không có bước đánh số, chỉ có 1 câu văn xuôi — khối
// này nhận trọn 10 câu của "Bộ câu hỏi tự kiểm tra cuối roadmap" làm items,
// id sj-gd4-w11-1…10, `text` là NGUYÊN VĂN câu hỏi. KHÔNG có đáp án — nguồn
// không có, và tự soạn sẽ làm hỏng giá trị tự kiểm tra; `lesson` chỉ nêu
// cách tự chấm và trỏ lại tuần liên quan, không bịa thêm sự kiện kỹ thuật.
//
// KHÔNG cross-link sang lĩnh vực khác: mọi link #/docs/<id> trong file này
// chỉ trỏ tới sj-00…sj-04 (bất biến #3b trong check-data.mjs).

export const seniorJavaGd4 = [
  {
    id: "sj-gd4-w1",
    week: "Tuần 1–2",
    title: "Kafka nền tảng",
    goal: "Hiểu partition/consumer group/offset bằng thí nghiệm tự tay, không phải bằng định nghĩa.",
    doneWhen: "3 thí nghiệm có log bằng chứng trong README; giải thích được LAG là gì và vì sao phải theo dõi.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "developer.confluent.io", href: "https://developer.confluent.io/" },
      { label: "📨 Sang lĩnh vực Kafka — lộ trình đọc 11 tuần", href: "#/roadmap/kafka" },
    ],
    items: [
      {
        id: "sj-gd4-w1-1",
        text: "Dựng Kafka 1 node KRaft bằng compose, tạo topic 3 partition bằng kafka-topics.sh --create --partitions 3",
        lesson: `**Việc cần làm.** Dựng Kafka 1 node KRaft bằng compose (image \`apache/kafka\`, lấy mẫu compose trong docs). Tạo topic 3 partition bằng \`kafka-topics.sh --create --partitions 3\`.

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-2",
        text: "Khởi tạo repo distributed-patterns-demo: order-service publish order-created, notification-service lắng nghe",
        lesson: `**Việc cần làm.** Khởi tạo repo \`distributed-patterns-demo\`: service \`order-service\` (REST nhận đơn → publish event \`order-created\` bằng \`KafkaTemplate\`, key = orderId) và \`notification-service\` (\`@KafkaListener(groupId="notification")\` in log).

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-3",
        text: "Thí nghiệm 1: cùng consumer group chia việc theo partition, kill 1 instance để thấy rebalance tận mắt",
        lesson: `**Việc cần làm.** Thí nghiệm 1 — cùng group chia việc: chạy 2 instance notification-service (2 port) → gửi 20 đơn → xem log: mỗi instance nhận từ partition khác nhau, không trùng message. Kill 1 instance → gửi tiếp → instance còn lại nhận hết (rebalance tận mắt).

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-4",
        text: "Thí nghiệm 2: khác consumer group đều nhận đủ message — khác biệt cốt lõi queue vs pub-sub",
        lesson: `**Việc cần làm.** Thí nghiệm 2 — khác group nhận đủ: thêm listener groupId "analytics" → mỗi message được cả 2 group nhận. Đây là khác biệt cốt lõi queue vs pub-sub.

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-5",
        text: "Thí nghiệm 3: gửi event cùng key vào cùng 1 partition đúng thứ tự, khác key không đảm bảo thứ tự toàn cục",
        lesson: `**Việc cần làm.** Thí nghiệm 3 — ordering theo key: gửi 5 event cùng orderId → xem log chúng vào cùng 1 partition, đúng thứ tự; khác orderId thì không đảm bảo thứ tự toàn cục. Ghi chú: "Kafka chỉ đảm bảo thứ tự TRONG 1 partition".

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-6",
        text: "Học đọc kafka-consumer-groups.sh --describe: current offset, log-end offset và LAG",
        lesson: `**Việc cần làm.** Học dùng \`kafka-consumer-groups.sh --describe --group notification\` đọc: current offset, log-end offset, LAG — chỉ số vận hành quan trọng nhất của consumer.

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w1-7",
        text: "Ghi chú Feynman về topic/partition/offset/consumer group qua 3 thí nghiệm vừa làm",
        lesson: `**Việc cần làm.** Ghi chú Feynman: topic/partition/offset/consumer group qua chính 3 thí nghiệm trên.

**Nguồn.** [Giai đoạn 4 — Tuần 1–2](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w2",
    week: "Tuần 3–4",
    title: "Idempotency & outbox — pattern ăn tiền của messaging",
    goal: "Cài 2 pattern quan trọng nhất của hệ event-driven, có test chứng minh.",
    doneWhen: "2 test chứng minh chạy xanh; message poison nằm trong DLT; giảng lại được dual-write cho junior bằng hình vẽ.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "microservices.io", href: "https://microservices.io/" },
    ],
    items: [
      {
        id: "sj-gd4-w2-1",
        text: "Hiểu vấn đề dual-write trước khi cài: at-least-once buộc idempotent, crash giữa saveDB và kafkaSend",
        lesson: `**Việc cần làm.** Hiểu vấn đề trước khi cài (viết vào README như 1 bài giảng):
- At-least-once = message có thể đến ≥ 1 lần → consumer BẮT BUỘC idempotent.
- Dual-write: \`saveDB(); kafkaSend();\` — crash giữa 2 lệnh → DB có đơn mà không có event (hoặc ngược lại). Không thể gói 2 hệ thống vào 1 transaction → outbox ra đời.

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-2",
        text: "Cài outbox ở order-service: insert đơn + outbox cùng transaction, poller 500ms publish Kafka",
        lesson: `**Việc cần làm.** Cài outbox ở order-service: trong CÙNG transaction DB, insert đơn + insert bảng \`outbox(id, aggregate_id, payload, created_at, published_at null)\`. Một \`@Scheduled\` poller mỗi 500ms đọc các dòng \`published_at is null\` → publish Kafka → update \`published_at\`. (Debezium CDC là bản xịn hơn — đọc để biết, chưa cần cài.)

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-3",
        text: "Test chứng minh outbox bằng cách tắt/bật poller để mô phỏng crash giữa chừng",
        lesson: `**Việc cần làm.** Test chứng minh outbox: viết test tắt poller → gọi API tạo đơn → verify DB có đơn + outbox có dòng chưa publish → bật poller → verify event ra Kafka. Kịch bản "crash giữa chừng" được mô phỏng chính bằng việc tắt/bật poller.

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-4",
        text: "Cài idempotent consumer: bảng processed_messages(message_id PK), insert trùng bị chặn bởi unique",
        lesson: `**Việc cần làm.** Cài idempotent consumer ở notification-service: bảng \`processed_messages(message_id PK)\`; trong listener, cùng 1 transaction: insert message_id (trùng → văng exception unique → skip) + xử lý nghiệp vụ.

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-5",
        text: "Test chứng minh idempotency: gửi cùng message 3 lần, verify nghiệp vụ chỉ chạy 1 lần",
        lesson: `**Việc cần làm.** Test chứng minh idempotency: gửi cùng 1 message 3 lần → verify nghiệp vụ chỉ thực hiện 1 lần. Test này + test outbox là 2 viên ngọc của repo.

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-6",
        text: "Thêm retry backoff và Dead Letter Topic, kiểm chứng bằng message poison rơi vào .DLT",
        lesson: `**Việc cần làm.** Thêm cho đủ bộ: retry với backoff và Dead Letter Topic của spring-kafka (\`DefaultErrorHandler\` + \`DeadLetterPublishingRecoverer\`) — message hỏng sau N lần retry rơi vào topic \`.DLT\`, kiểm chứng bằng message poison (payload sai format).

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w2-7",
        text: "Ghi chú Feynman: vì sao không ghi DB và gửi Kafka trong 1 transaction, outbox giải quyết thế nào",
        lesson: `**Việc cần làm.** Ghi chú Feynman: "Tại sao không thể vừa ghi DB vừa gửi Kafka trong 1 transaction, và outbox giải quyết thế nào".

**Nguồn.** [Giai đoạn 4 — Tuần 3–4](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w3",
    week: "Tuần 5–6",
    title: "Redis & caching",
    goal: "Cài cache-aside đo được hiệu quả, tự gây và chống được stampede.",
    doneWhen: `bảng benchmark trước/sau; ảnh "răng cưa" stampede trước fix và phẳng sau fix; nêu được rủi ro của cache (stale data, invalidation sai) chứ không chỉ lợi ích.`,
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "redis.io", href: "https://redis.io/" },
    ],
    items: [
      {
        id: "sj-gd4-w3-1",
        text: "Học 30 phút chiến lược cache-aside/read-write-through/write-behind, ghi bảng trade-off 4 dòng",
        lesson: `**Việc cần làm.** Học 30 phút các chiến lược (cache-aside, read/write-through, write-behind) — nguồn: bài Caching challenges and strategies (AWS Builders' Library). Ghi bảng trade-off 4 dòng.

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w3-2",
        text: "Cài cache-aside cho order-service: @Cacheable TTL 60s + serializer JSON, evict bằng @CacheEvict",
        lesson: `**Việc cần làm.** Cài cache-aside cho endpoint đọc nhiều của order-service: \`@Cacheable(cacheNames="orders")\` + \`RedisCacheConfiguration\` đặt TTL 60s + serializer JSON. Evict khi update (\`@CacheEvict\`).

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w3-3",
        text: "Benchmark trước/sau bằng k6 100 VUs 1 phút: đo p95 và throughput, ghi bảng vào README",
        lesson: `**Việc cần làm.** Benchmark trước/sau bằng k6 (100 VUs, 1 phút): p95 và throughput — thường thấy cải thiện 5–20 lần. Ghi bảng vào README.

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w3-4",
        text: "Lab stampede TTL 10s dưới tải cao, fix bằng jitter TTL hoặc lock Redisson tryLock, đo lại",
        lesson: `**Việc cần làm.** Lab stampede: đặt TTL 10s, k6 giữ tải cao → quan sát mỗi 10s có "răng cưa" query DB dội lên (dùng log đếm query của giai đoạn 1). Fix 2 cách và đo lại: (a) jitter TTL (60s ± random 10s) — rẻ, hiệu quả; (b) lock: chỉ 1 request rebuild cache (Redisson \`tryLock\`), số còn lại chờ/nhận giá trị cũ.

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w3-5",
        text: "Lab thêm Redis: rate limiter bằng INCR+EXPIRE, leaderboard bằng sorted set ZADD/ZRANGE",
        lesson: `**Việc cần làm.** Học thêm Redis ngoài cache qua 2 lab nhỏ: rate limiter bằng \`INCR + EXPIRE\` (cửa sổ cố định) cho 1 endpoint; leaderboard bằng sorted set (\`ZADD\`/\`ZRANGE\`).

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w3-6",
        text: "Áp dụng tại công ty: tìm endpoint đọc nhiều ghi ít, đo thử làm chất liệu cho design doc #1",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: tìm endpoint đọc nhiều ghi ít → đo thử → nếu đáng, đây chính là chất liệu cho **design doc #1** (tuần 15–16).

**Nguồn.** [Giai đoạn 4 — Tuần 5–6](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w4",
    week: "Tuần 7–8",
    title: "Resilience patterns",
    goal: "Thấy tận mắt circuit breaker cứu hệ thống, hiểu timeout là pattern số 1.",
    doneWhen: `demo "không timeout làm chết cả service" tái hiện được; xem được breaker đổi trạng thái trên Grafana; trả lời được "khi nào KHÔNG nên retry".`,
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd4-w4-1",
        text: "Học lý thuyết theo thứ tự: timeout, retry+backoff+jitter (biết khi nào retry gây hại), circuit breaker, bulkhead",
        lesson: `**Việc cần làm.** Học lý thuyết 2 buổi theo thứ tự tầm quan trọng: timeout (mọi cuộc gọi ra ngoài PHẢI có timeout — không timeout là nguồn treo hệ thống số 1) → retry + exponential backoff + jitter (và khi nào retry GÂY HẠI: retry lên hệ đang quá tải = đổ dầu vào lửa; chỉ retry lỗi tạm thời, không retry lỗi 4xx) → circuit breaker (CLOSED/OPEN/HALF_OPEN) → bulkhead.

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w4-2",
        text: "Setup order-service gọi REST sang payment-service giả lập, thêm resilience4j-spring-boot3",
        lesson: `**Việc cần làm.** Setup: order-service gọi REST sang \`payment-service\` (service giả lập mới, có endpoint chỉnh được độ trễ/lỗi). Thêm \`resilience4j-spring-boot3\`.

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w4-3",
        text: "Lab timeout: không timeout khiến cả thread pool bị giam, thêm timeout 2s để cô lập lỗi",
        lesson: `**Việc cần làm.** Lab timeout + hậu quả của việc thiếu nó: payment-service delay 30s, order-service KHÔNG timeout → bắn 50 request → toàn bộ thread pool của order-service bị giam, endpoint KHÁC cũng chết theo (đo bằng curl endpoint không liên quan). Thêm timeout 2s (TimeLimiter/Feign timeout) → chỉ luồng payment lỗi, phần còn lại sống. Đây là demo thuyết phục nhất giai đoạn.

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w4-4",
        text: "Lab circuit breaker: sliding window 10, failureRateThreshold 50%, waitDuration 10s, theo dõi trên Grafana",
        lesson: `**Việc cần làm.** Lab circuit breaker: cấu hình sliding window 10, failureRateThreshold 50%, waitDuration 10s, fallback trả "payment đang bận, đơn ghi nhận xử lý sau". Bật payment-service lỗi 100% → gọi 10 lần → breaker OPEN (gọi tiếp bị chặn ngay, không chờ timeout — chính là giá trị: fail fast) → sau 10s HALF_OPEN thử vài request → payment hồi phục → CLOSED. Theo dõi trạng thái qua \`/actuator/circuitbreakers\` + metrics Micrometer trên Grafana (nối kỹ năng giai đoạn 2).

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w4-5",
        text: "Dùng Toxiproxy chen giữa 2 service để giả lập mạng chậm/đứt thay vì sửa code",
        lesson: `**Việc cần làm.** Dùng Toxiproxy (container) chen giữa 2 service để giả lập mạng chậm/đứt thay vì sửa code — công cụ chaos-testing nhẹ đáng biết.

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w4-6",
        text: "Ghi chú Feynman: circuit breaker khác retry chỗ nào, vì sao retry vô tội vạ làm sập hệ thống nhanh hơn",
        lesson: `**Việc cần làm.** Ghi chú Feynman: "Circuit breaker khác retry chỗ nào, và vì sao retry vô tội vạ làm sập hệ thống nhanh hơn".

**Nguồn.** [Giai đoạn 4 — Tuần 7–8](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w5",
    week: "Tuần 9–14",
    title: "Đọc DDIA có kỷ luật",
    goal: "Nắm phần lõi DDIA và biết soi hệ thống của mình qua lăng kính đó. Lịch 6 tuần ở đây cố ý chỉ quét phần lõi ở nhịp gấp; muốn đọc đủ 14 chương thì theo lộ trình đọc 12 tuần của lĩnh vực DDIA.",
    doneWhen: `6 ghi chú Feynman đều có mục "hệ thống của tôi"; kể được 3 ví dụ nối lý thuyết DDIA với lab đã tự làm.`,
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "🗺️ Sang lĩnh vực DDIA — lộ trình đọc 12 tuần", href: "#/roadmap/ddia" },
    ],
    items: [
      {
        id: "sj-gd4-w5-1",
        text: "Lịch đọc DDIA T9–T14: ch.1–3, ch.4, ch.6, ch.7–8, ch.9–10, ch.12–13 + tổng kết",
        lesson: `**Việc cần làm.** Lịch chương: T9: ch.1–3 → T10: ch.4 (LSM-tree vs B-tree) → T11: ch.6 (replication) → T12: ch.7–8 (sharding, transaction) → T13: ch.9–10 (network/clock không tin được, consensus — đọc mức khái niệm, đừng sa lầy) → T14: ch.12–13 (stream) + tổng kết.

**Nguồn.** [Giai đoạn 4 — Tuần 9–14](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w5-2",
        text: `Nghi thức mỗi chương: đọc + gạch chân 2 buổi, buổi 3 viết Feynman 1 trang kèm mục "hệ thống của tôi"`,
        lesson: `**Việc cần làm.** Nghi thức mỗi chương (3 buổi): buổi 1–2 đọc + gạch chân; buổi 3 viết ghi chú Feynman 1 trang KÈM mục bắt buộc "Hệ thống công ty tôi đang đứng đâu trong trade-off này?" — ví dụ ch.6: DB công ty replicate kiểu gì, replication lag từng gây bug đọc-sau-ghi nào chưa?

**Nguồn.** [Giai đoạn 4 — Tuần 9–14](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w5-3",
        text: "Móc nối lý thuyết với lab đã làm: ch.4 với Kafka, ch.8 với isolation levels, ch.12 với outbox/CDC",
        lesson: `**Việc cần làm.** Móc nối với lab đã làm để kiến thức bám rễ: ch.4 giải thích vì sao Kafka ghi nhanh (log tuần tự); ch.8 nối lại isolation levels giai đoạn 1 lên tầm phân tán; ch.12 chính là lý thuyết của outbox/CDC bạn đã cài.

**Nguồn.** [Giai đoạn 4 — Tuần 9–14](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w5-4",
        text: "Từ T11: mỗi tuần đọc 1 bài engineering blog Netflix/Uber/Shopify, ghi 3 điều vào reading-notes.md",
        lesson: `**Việc cần làm.** Song song từ T11: mỗi tuần đọc 1 bài engineering blog (Netflix/Uber/Shopify), ghi 3 điều học được vào file \`reading-notes.md\`. Chọn bài liên quan chương đang đọc càng tốt.

**Nguồn.** [Giai đoạn 4 — Tuần 9–14](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w5-5",
        text: "Nếu DDIA quá nặng ở ch.4: đọc Understanding Distributed Systems trước 3 tuần rồi quay lại",
        lesson: `**Việc cần làm.** Nếu DDIA quá nặng ngay ch.4: đọc *Understanding Distributed Systems* trước 3 tuần rồi quay lại — đường vòng này nhanh hơn bỏ cuộc.

**Nguồn.** [Giai đoạn 4 — Tuần 9–14](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w6",
    week: "Tuần 15–16",
    title: "Design doc #1 tại công ty",
    goal: "Viết và bảo vệ design doc đầu tiên — nghi thức trưởng thành của Senior.",
    doneWhen: "doc đã qua review thật, có phần phản hồi và quyết định cuối; việc triển khai đã bắt đầu.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "industrialempathy.com — 'Design Docs at Google'", href: "https://www.industrialempathy.com/" },
    ],
    items: [
      {
        id: "sj-gd4-w6-1",
        text: "Chọn đề bài THẬT đang nhức nhối tại công ty — nhỏ mà thật hơn đề to mà tưởng tượng",
        lesson: `**Việc cần làm.** Chọn đề bài THẬT đang nhức nhối: thêm cache cho endpoint chậm (chất liệu tuần 5–6), chuyển 1 luồng đồng bộ sang async qua queue, cải thiện resilience khi gọi bên thứ 3, hay tách 1 module nặng. Đề nhỏ mà thật hơn đề to mà tưởng tượng.

**Nguồn.** [Giai đoạn 4 — Tuần 15–16](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w6-2",
        text: "Viết design doc theo template: Context, Goals/Non-goals, 2–3 phương án, đề xuất, rollout plan, rủi ro",
        lesson: `**Việc cần làm.** Viết theo template (đọc "Design Docs at Google" trước): **Context** (vấn đề, số liệu hiện trạng) → **Goals / Non-goals** (non-goals quan trọng không kém — chặn phình phạm vi) → **2–3 phương án** mỗi cái ưu/nhược/chi phí (BẮT BUỘC ≥ 2 phương án nghiêm túc; 1 phương án = chưa phải design doc) → **Đề xuất + lý do** → **Rollout plan** (feature flag? rollback thế nào?) → **Rủi ro & câu hỏi mở**. Dài 2–4 trang, có 1 sơ đồ.

**Nguồn.** [Giai đoạn 4 — Tuần 15–16](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w6-3",
        text: "Gửi nháp cho đồng nghiệp tin cậy, xin lead 30–45 phút review với team, ghi hết phản hồi không phòng thủ",
        lesson: `**Việc cần làm.** Gửi trước cho 1 đồng nghiệp tin cậy đọc nháp → sửa → xin lead 30–45 phút review với team. Trong buổi review: ghi hết phản hồi, KHÔNG phòng thủ; câu "em chưa nghĩ đến, để em phân tích thêm" là câu của Senior thật.

**Nguồn.** [Giai đoạn 4 — Tuần 15–16](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w6-4",
        text: "Sửa bản cuối, xin nhận triển khai, lưu bản ẩn danh hóa vào repo cá nhân",
        lesson: `**Việc cần làm.** Sửa bản cuối, xin nhận triển khai. Lưu bản ẩn danh hóa vào repo cá nhân.

**Nguồn.** [Giai đoạn 4 — Tuần 15–16](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w7",
    week: "Tuần 17–18",
    title: "Luyện system design có phương pháp",
    goal: "Có framework trả lời và luyện 4 đề đầu đúng chuẩn phỏng vấn.",
    doneWhen: "4 đề có bản vẽ + ghi âm + bản tự chấm; làm chủ nhịp 45 phút không cháy giờ.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd4-w7-1",
        text: "Đọc Alex Xu tập 1 ch.1–4, thuộc framework 4 bước và phân bổ thời gian cho buổi 45 phút",
        lesson: `**Việc cần làm.** Đọc Alex Xu tập 1 ch.1–4, thuộc framework 4 bước + phân bổ thời gian cho buổi 45 phút: làm rõ yêu cầu + ước lượng (5–7') → thiết kế high-level, vẽ hộp và luồng (15') → đào sâu 1–2 component nóng nhất (15') → trade-off, bottleneck, failure mode (5–7').

**Nguồn.** [Giai đoạn 4 — Tuần 17–18](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w7-2",
        text: "Luyện ước lượng nhanh: thuộc con số 86.400s/ngày, 12 rps/triệu request/ngày, tập 10 bài tính nhẩm",
        lesson: `**Việc cần làm.** Luyện ước lượng nhanh (kỹ năng hay bị lộ yếu nhất): thuộc vài con số — 1 ngày ≈ 86.400s; 1 triệu request/ngày ≈ 12 rps (peak ×5–10); 1 server DB gánh vài nghìn qps đọc đơn giản. Tập 10 bài tính nhẩm dạng "10M user, mỗi người 5 request/ngày → rps trung bình? peak? dung lượng lưu trữ nếu mỗi request sinh 1KB/ngày trong 1 năm?".

**Nguồn.** [Giai đoạn 4 — Tuần 17–18](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w7-3",
        text: "Luyện 4 đề đúng nghi thức thi thật: bấm giờ 45', vẽ Excalidraw, nói to và ghi âm",
        lesson: `**Việc cần làm.** Luyện 4 đề, mỗi đề đúng nghi thức thi thật: bấm giờ 45 phút, vẽ trên Excalidraw, NÓI THÀNH TIẾNG và ghi âm (nói to là một nửa của phỏng vấn — luyện sớm): URL shortener, rate limiter, notification system, news feed.

**Nguồn.** [Giai đoạn 4 — Tuần 17–18](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w7-4",
        text: "Sau mỗi đề: nghe lại ghi âm, đối chiếu Alex Xu, tự chấm theo 4 lỗi phổ biến",
        lesson: `**Việc cần làm.** Sau mỗi đề: nghe lại ghi âm, đối chiếu chương tương ứng trong Alex Xu, tự chấm theo 4 lỗi phổ biến: quên hỏi làm rõ yêu cầu; không ước lượng số; không bàn failure mode; không chốt trade-off mà chỉ liệt kê.

**Nguồn.** [Giai đoạn 4 — Tuần 17–18](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w8",
    week: "Tuần 19–20",
    title: "4 đề nâng cao + design doc #2 + mentoring",
    goal: "Luyện 4 đề khó hơn, viết design doc #2, và bắt đầu mentoring chính thức.",
    doneWhen: "tổng 8 đề đã luyện có ghi âm; doc #2 hoàn chỉnh; lịch mentoring chạy đều ≥ 3 tuần.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd4-w8-1",
        text: "Luyện 4 đề khó hơn: chat system, key-value store phân tán, payment flow, web crawler",
        lesson: `**Việc cần làm.** Luyện tiếp 4 đề khó hơn, cùng nghi thức: chat system (WebSocket, presence), key-value store phân tán (áp dụng trực tiếp DDIA ch.6–7), **payment flow (trọng tâm idempotency — bạn có lab thật để kể)**, web crawler.

**Nguồn.** [Giai đoạn 4 — Tuần 19–20](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w8-2",
        text: "Design doc #2: đề bài thật tại công ty, hoặc kiến trúc hoàn chỉnh cho distributed-patterns-demo",
        lesson: `**Việc cần làm.** Design doc #2: tại công ty nếu có đề bài (tốt nhất); không có thì viết tài liệu kiến trúc hoàn chỉnh cho chính \`distributed-patterns-demo\` theo đúng template — ít nhất được luyện văn phong và trở thành tài liệu đỉnh của repo.

**Nguồn.** [Giai đoạn 4 — Tuần 19–20](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w8-3",
        text: "Bắt đầu mentoring chính thức: pair 45'/tuần với junior, hoặc 30'/tuần trả lời cộng đồng",
        lesson: `**Việc cần làm.** Mentoring — bắt đầu chính thức: đề nghị lead cho kèm 1 junior/fresher. Cấu trúc: 1 buổi pair 45'/tuần + review code của bạn ấy với quy tắc "mỗi comment phải có TẠI SAO, không chỉ hãy sửa thành X". Không có junior → 30'/tuần trả lời câu hỏi cộng đồng (Stack Overflow, group Java Việt Nam) — cũng luyện được kỹ năng giải thích.

**Nguồn.** [Giai đoạn 4 — Tuần 19–20](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w9",
    week: "Tuần 21–22",
    title: "Mock system design interview",
    goal: "Pass 2 buổi mock system design mức Senior và luyện bù đúng điểm yếu.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "interviewing.io", href: "https://interviewing.io/" },
    ],
    items: [
      {
        id: "sj-gd4-w9-1",
        text: "Sắp xếp 2 buổi mock với người có kinh nghiệm phỏng vấn Senior, đề chưa luyện, xin chấm thẳng tay",
        lesson: `**Việc cần làm.** Sắp xếp 2 buổi mock với người có kinh nghiệm phỏng vấn Senior (đồng nghiệp senior/mentor/Pramp/interviewing.io), mỗi buổi 1 đề BẠN CHƯA LUYỆN, 45–60 phút, xin chấm thẳng tay theo 3 câu: đủ tầm Senior chưa? điểm yếu nhất? nếu là hội đồng thật anh/chị pass không?

**Nguồn.** [Giai đoạn 4 — Tuần 21–22](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w9-2",
        text: "Giữa 2 buổi cách 1 tuần: luyện bù đúng điểm yếu buổi 1 chỉ ra",
        lesson: `**Việc cần làm.** Giữa 2 buổi cách 1 tuần: luyện bù đúng điểm yếu buổi 1 chỉ ra (thường là ước lượng, failure mode, hoặc nói lan man không chốt).

**Nguồn.** [Giai đoạn 4 — Tuần 21–22](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w10",
    week: "Tuần 23–24",
    title: "Đóng gói hồ sơ",
    goal: "Đóng gói CV, GitHub và blog thành hồ sơ Senior hoàn chỉnh, chọn nước đi tiếp theo.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd4-w10-1",
        text: "Viết CV theo công thức làm X bằng cách Y kết quả Z đo được, lôi nguyên liệu 24 tháng ra",
        lesson: `**Việc cần làm.** CV theo công thức thành tích "làm X, bằng cách Y, kết quả Z đo được" — lôi nguyên liệu 24 tháng ra: case N+1 (41 query → 2), deploy (30' → 5'), platform IaC, design doc đã triển khai, mentoring. Mỗi gạch đầu dòng phải có con số.

**Nguồn.** [Giai đoạn 4 — Tuần 23–24](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w10-2",
        text: "GitHub: pin 3 repo java-deep-dive, production-ready-platform, distributed-patterns-demo, rà README",
        lesson: `**Việc cần làm.** GitHub: pin 3 repo (\`java-deep-dive\`, \`production-ready-platform\`, \`distributed-patterns-demo\`), rà README từng repo bằng con mắt nhà tuyển dụng lướt 60 giây.

**Nguồn.** [Giai đoạn 4 — Tuần 23–24](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w10-3",
        text: "Viết blog tổng kết 24 tháng từ CRUD developer đến Senior: những gì tôi làm khác đi",
        lesson: `**Việc cần làm.** Viết blog tổng kết "24 tháng từ CRUD developer đến Senior: những gì tôi làm khác đi" — bài dạng này luôn được đọc nhiều nhất và là lời giới thiệu bản thân tốt nhất.

**Nguồn.** [Giai đoạn 4 — Tuần 23–24](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w10-4",
        text: "Chấm checklist cuối, chọn nước đi: thăng chức nội bộ hoặc ra thị trường",
        lesson: `**Việc cần làm.** Chấm checklist cuối. Chọn nước đi: (a) đề xuất thăng chức nội bộ — đặt lịch 1:1 với manager, mang theo bộ bằng chứng + khung "tôi đã làm việc ở mức Senior 6 tháng qua, đây là bằng chứng"; hoặc (b) ra thị trường — rải CV có chọn lọc, tận dụng blog/GitHub làm điểm khác biệt.

**Nguồn.** [Giai đoạn 4 — Tuần 23–24](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-w11",
    week: "Tuần 25–26",
    title: "Buffer + phỏng vấn thật",
    goal: "Dùng làm thời gian đệm, ôn theo bộ câu hỏi tự kiểm tra cuối roadmap, hoặc bắt đầu phỏng vấn.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/sj-04" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd4-w11-1",
        text: "Thiết kế notification system cho 10 triệu user trong 45 phút.",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, bấm giờ 45 phút và ghi âm. Nghe lại và soát theo bốn lỗi phổ biến mà nguồn nêu ở tuần 17–18: quên hỏi làm rõ yêu cầu, không ước lượng số, không bàn failure mode, không chốt trade-off mà chỉ liệt kê. Ấp úng chỗ nào thì quay lại tuần tương ứng.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-2",
        text: `Kafka: đạt "exactly-once" thực tế bằng cách nào?`,
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Tự hỏi đã nối được với 3 thí nghiệm Kafka ở tuần 1–2 và pattern idempotent consumer + outbox ở tuần 3–4 chưa. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-3",
        text: "Outbox giải quyết gì, cài thế nào, trade-off (độ trễ, thứ tự)?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Đối chiếu với chính README và test outbox đã tự viết ở tuần 3–4. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-4",
        text: "Các chiến lược cache invalidation và rủi ro từng cái?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Đối chiếu với bảng trade-off 4 dòng và lab stampede đã làm ở tuần 5–6. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-5",
        text: "Circuit breaker khác retry chỗ nào? Khi nào retry gây hại?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Đối chiếu với đúng ghi chú Feynman đã viết ở tuần 7–8 cho câu hỏi này. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-6",
        text: "Replication lag gây vấn đề gì? Xử lý đọc-sau-ghi ra sao?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Đối chiếu với ghi chú Feynman ch.6 (replication) ở tuần 9–14, đặc biệt mục "hệ thống công ty tôi đang đứng đâu". Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-7",
        text: "Vì sao timeout là resilience pattern quan trọng nhất? (kể demo của bạn)",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm, kể lại đúng demo "không timeout làm chết cả service" đã tự tay làm ở tuần 7–8. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-8",
        text: "Thiết kế idempotency key cho payment flow?",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, ghi âm. Đối chiếu với pattern idempotent consumer đã cài ở tuần 3–4 và đề payment flow đã luyện ở tuần 19–20. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-9",
        text: "Trình bày design doc của bạn: các phương án và lý do chọn.",
        lesson: `**Cách tự chấm.** Trình bày thành tiếng như đang bảo vệ trước team, bấm giờ và ghi âm. Đối chiếu với chính design doc #1 (tuần 15–16) và #2 (tuần 19–20) đã viết — kiểm tra có nêu đủ các phương án và lý do chọn hay chỉ nói 1 phương án. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-w11-10",
        text: `Junior hỏi "sao không microservices hết cho máu?" — trả lời thế nào?`,
        lesson: `**Cách tự chấm.** Trả lời thành tiếng như đang giải thích cho junior, ghi âm. Đối chiếu với phần trade-off, bottleneck, failure mode trong khung 4 bước đã luyện ở tuần 17–18 — câu trả lời tốt phải có trade-off cụ thể, không chỉ khẩu hiệu. Ấp úng chỗ nào thì quay lại tuần đó ôn lại rồi thử trả lời lần nữa.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
    ],
  },

  {
    id: "sj-gd4-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 4 — 7 tiêu chí bắt buộc",
    goal: "Cổng ra của giai đoạn 4 — và của cả roadmap 24 tháng. Đạt ≥ 6/7 thì bạn đã làm việc ở mức Senior.",
    items: [
      {
        id: "sj-gd4-done-1",
        text: "2 design doc, ≥ 1 được triển khai thật",
        lesson: `**Cách tự chấm.** Kiểm tra đã có 2 design doc thực tế được review — design doc #1 tại công ty (tuần 15–16) và design doc #2 (tuần 19–20) — và ít nhất 1 trong 2 đã thực sự được triển khai, không chỉ nằm trên giấy.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-2",
        text: "Repo demo có test chứng minh outbox + idempotency, demo circuit breaker trên Grafana",
        lesson: `**Cách tự chấm.** Kiểm tra repo \`distributed-patterns-demo\` có test chứng minh outbox và test chứng minh idempotency chạy xanh như đã viết ở tuần 3–4, và demo circuit breaker đổi trạng thái xem được trên Grafana như ở tuần 7–8.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-3",
        text: `6 ghi chú Feynman DDIA có mục "hệ thống của tôi"`,
        lesson: `**Cách tự chấm.** Đếm lại 6 ghi chú Feynman DDIA viết ở tuần 9–14 (1 ghi chú mỗi chương/nhóm chương), mỗi ghi chú đều có mục "Hệ thống công ty tôi đang đứng đâu trong trade-off này?".

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-4",
        text: "8 đề system design đã luyện + pass 2 buổi mock",
        lesson: `**Cách tự chấm.** Đếm lại: 4 đề ở tuần 17–18 (URL shortener, rate limiter, notification system, news feed) + 4 đề ở tuần 19–20 (chat system, key-value store phân tán, payment flow, web crawler) đều có bản vẽ + ghi âm, và đã pass 2 buổi mock ở tuần 21–22.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-5",
        text: "Mentoring chạy đều, junior chủ động tìm đến hỏi",
        lesson: `**Cách tự chấm.** Kiểm tra lịch mentoring bắt đầu ở tuần 19–20 đã chạy đều liên tục, và tự hỏi: junior có chủ động tìm đến hỏi mình hay chỉ mình phải chủ động tìm họ.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-6",
        text: "Trả lời trôi chảy ≥ 8/10 câu tự kiểm tra",
        lesson: `**Cách tự chấm.** Đếm lại trong 10 câu tự kiểm tra ở tuần 25–26, có ít nhất 8 câu trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
      {
        id: "sj-gd4-done-7",
        text: "CV + GitHub + ≥ 4 blog sẵn sàng nộp Senior",
        lesson: `**Cách tự chấm.** Kiểm tra CV đã viết theo công thức thành tích đo được, GitHub đã pin đủ 3 repo với README chỉn chu, và tổng số bài blog xuyên suốt roadmap đã đạt ≥ 4 bài — tất cả đã đóng gói xong ở tuần 23–24.

**Nguồn.** [Giai đoạn 4 — Checklist đánh giá cuối giai đoạn](#/docs/sj-04)`,
      },
    ],
  },
];
