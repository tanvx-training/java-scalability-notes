# FlashSale — Kế hoạch pet project & theo dõi tiến độ

## Tổng quan đề tài

FlashSale là nền tảng bán hàng flash sale chịu tải cao, event-driven, làm trong 24 tuần (8–10 giờ/tuần) để luyện toàn bộ kỹ năng Senior và mở đầu kỹ năng Solution Architect.

**Bài toán:** 10.000 người cùng bấm mua 500 sản phẩm trong 1 phút. Hệ thống không được bán quá tồn kho, không được tính tiền hai lần, và thanh toán lỗi thì phải hoàn kho.

**NFR mục tiêu (cố định ngay từ đầu, dùng để đo mỗi giai đoạn):**

| Thuộc tính | Mục tiêu | Cách đo |
| --- | --- | --- |
| Throughput | 10.000 request đặt hàng/phút | k6, kịch bản spike 60 giây |
| Latency | p99 API đặt hàng < 300 ms | k6 + dashboard Grafana |
| Đúng đắn | 0 oversell, 0 double-charge | Test đối chiếu tồn kho và bảng thanh toán sau mỗi lần load test |
| Khả dụng | Payment service chết vẫn không mất đơn | Chaos test tắt service giữa chừng |
| Bảo mật | Không có lỗ hổng High/Critical trong SCA và DAST | Trivy, OWASP ZAP trong CI |

**Stack:** Java 25, Spring Boot 4.1 + Spring Modulith, PostgreSQL, Redis, Kafka, Keycloak, OpenTelemetry + Grafana/Tempo/Loki, Testcontainers, k6, Kubernetes (kind), Helm, GitHub Actions.

**Giả định và giới hạn phạm vi:** payment gateway là mock; UI tối giản (hoặc chỉ dùng API); không làm catalog phức tạp; mỗi giai đoạn kết thúc bằng một Git tag và README cập nhật.

Cài đặt máy và công cụ trước khi bắt đầu: [Thiết lập môi trường](01-thiet-lap-moi-truong.md)

## Bảng theo dõi tiến độ

Giả định bắt đầu ngày Sep 28, 2026; đổi trạng thái trực tiếp trong bảng khi qua mỗi mốc.

| Giai đoạn | Tuần | Kết thúc dự kiến | Trạng thái | Mốc kiểm tra | Tag Git |
| --- | --- | --- | --- | --- | --- |
| 0. Thiết kế trước khi code | 1–2 | Oct 11, 2026 | Chưa bắt đầu | Repo có NFR, C4, ADR-001 | v0-design |
| 1. Modular monolith | 3–6 | Nov 8, 2026 | Chưa bắt đầu | 100 request đồng thời, tồn kho đúng | v1-monolith |
| 2. Chịu tải flash sale | 7–10 | Dec 6, 2026 | Chưa bắt đầu | Báo cáo p95/p99 trước và sau, kèm flame graph | v2-perf |
| 3. Event-driven, tách service | 11–15 | Jan 10, 2027 | Chưa bắt đầu | Tắt payment giữa chừng, không mất đơn | v3-events |
| 4. Production-grade | 16–19 | Feb 7, 2027 | Chưa bắt đầu | Postmortem cho sự cố tự tạo; CI xanh với SCA + DAST | v4-prod |
| 5. Góc nhìn SA | 20–24 | Mar 14, 2027 | Chưa bắt đầu | SAD arc42, threat model, ước lượng chi phí, bài viết công khai | v5-sa |

Tết 2027 rơi vào tuần 19, nên dự phòng thêm 1–2 tuần cho giai đoạn 4 và 5.

## Giai đoạn 0 — Thiết kế trước khi code (tuần 1–2)

Kết thúc giai đoạn này là một repo chưa có dòng code nghiệp vụ nào nhưng đã có NFR, sơ đồ C4 và quyết định kiến trúc đầu tiên.

**Việc cần làm**

- [ ] Viết `docs/requirements.md`: user story cho flash sale, NFR ở bảng tổng quan, và abuse cases (bot mua gom, replay request, khai thác race condition).
- [ ] Ước lượng back-of-the-envelope: QPS đỉnh, dung lượng bảng order/payment sau 1 năm, băng thông.
- [ ] Vẽ C4 mức Context và Container bằng Structurizr DSL hoặc PlantUML, lưu trong `docs/c4`.
- [ ] ADR-001: bắt đầu bằng modular monolith (Spring Modulith), tiêu chí để tách service sau này.
- [ ] ADR-002: chọn PostgreSQL + Redis + Kafka, nêu phương án thay thế đã cân nhắc.
- [ ] Threat model sơ bộ bằng STRIDE trên sơ đồ Container (chi tiết ở phần Security).
- [ ] Dựng khung repo: Java 25, Spring Boot 4.1, Gradle/Maven, Testcontainers, GitHub Actions chạy build và test.

**Bài học nhắm tới:** NFR và trade-off, ADR, C4, ước lượng, threat modeling.

**Mốc kiểm tra:** README nêu rõ NFR; `docs/adr` có 2 ADR; CI xanh trên commit rỗng; tag `v0-design`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 0 — chi tiết](02-giai-doan-0.md)

## Giai đoạn 1 — Modular monolith chạy đúng (tuần 3–6)

Mục tiêu là luồng đặt hàng đúng tuyệt đối dưới 100 request đồng thời, chưa cần nhanh.

**Việc cần làm**

- [ ] Module theo Spring Modulith: `catalog`, `inventory`, `order`, `payment` (mock), `notification`; ép ranh giới bằng `ApplicationModules.verify()` và ArchUnit.
- [ ] Domain model cho Order (trạng thái: CREATED → PAID → CONFIRMED / CANCELLED), Inventory (số lượng, phiên bản), Payment.
- [ ] API đặt hàng nhận `Idempotency-Key`; lưu key và kết quả để trả lại cùng response khi client retry.
- [ ] Trừ tồn kho bằng optimistic locking (`@Version`) trong PostgreSQL; retry có giới hạn khi xung đột.
- [ ] Flyway cho schema; Testcontainers cho PostgreSQL trong integration test.
- [ ] Test đồng thời: 100 thread cùng mua 10 sản phẩm, kiểm tra tồn kho cuối cùng bằng 0 và số đơn thành công đúng bằng 10.
- [ ] Xác thực cơ bản bằng Spring Security 7 với JWT từ Keycloak chạy trong Docker Compose; phân quyền `customer` và `admin`.
- [ ] Validation đầu vào bằng Bean Validation; lỗi trả về theo RFC 9457 (Problem Details).

**Bài học nhắm tới:** ranh giới module, idempotency, optimistic locking, test pyramid với Testcontainers, authn/authz cơ bản.

**Mốc kiểm tra:** test đồng thời xanh 10 lần liên tiếp; coverage luồng đặt hàng trên 80%; tag `v1-monolith`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 1 — chi tiết](03-giai-doan-1.md)

## Giai đoạn 2 — Chịu tải flash sale (tuần 7–10)

Mục tiêu là đạt 10.000 request/phút với p99 < 300 ms mà vẫn giữ 0 oversell, và có báo cáo số liệu chứng minh.

**Việc cần làm**

- [ ] Viết kịch bản k6 spike (0 → 10.000 người trong 10 giây, giữ 60 giây) và chạy trên bản v1 để có baseline p50/p95/p99, error rate.
- [ ] Profiling bằng JFR (JDK Mission Control) và async-profiler khi đang chịu tải; lưu flame graph vào `docs/perf`.
- [ ] Chuyển trừ tồn kho sang Redis với Lua script (kiểm tra và trừ trong một lệnh atomic); PostgreSQL chỉ còn là nguồn sự thật được đồng bộ sau.
- [ ] Rate limiting bằng Bucket4j theo user và theo IP; trả 429 kèm `Retry-After`.
- [ ] Cơ chế hàng chờ: cấp token vào flash sale với thời hạn ngắn, API đặt hàng chỉ nhận request có token hợp lệ.
- [ ] Bật virtual threads (`spring.threads.virtual.enabled=true`), so sánh với platform threads bằng k6; viết JMH cho phần trừ kho.
- [ ] Cache catalog bằng Redis, có TTL và chiến lược tránh cache stampede.
- [ ] Chạy lại kịch bản k6 và test đối chiếu tồn kho sau mỗi lần tối ưu.

**Bài học nhắm tới:** đo trước khi tối ưu, profiling, atomic operation trên Redis, rate limiting, virtual threads, JMH.

**Mốc kiểm tra:** `docs/perf/report.md` có bảng p95/p99 trước và sau mỗi thay đổi kèm flame graph; đạt NFR throughput và latency; tag `v2-perf`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 2 — chi tiết](04-giai-doan-2.md)

## Giai đoạn 3 — Event-driven và tách service (tuần 11–15)

Mục tiêu là luồng đặt hàng → thanh toán → xác nhận kho chạy bất đồng bộ qua Kafka, tự bù khi lỗi, và `order` với `payment` là hai service riêng.

**Việc cần làm**

- [ ] Kafka trong Docker Compose và Testcontainers; topic `order.created`, `payment.completed`, `payment.failed`, `inventory.confirmed`.
- [ ] Outbox pattern: ghi event cùng transaction với dữ liệu, publish bằng Spring Modulith Event Publication Registry hoặc Debezium CDC (ghi lựa chọn vào ADR-005).
- [ ] Saga đặt hàng theo choreography: payment lỗi thì phát `payment.failed`, inventory hoàn kho, order chuyển CANCELLED; ghi ADR so sánh với orchestration.
- [ ] Consumer idempotent bằng bảng `processed_events`; dead-letter topic và cơ chế replay.
- [ ] Tách `order` và `payment` thành hai deployable riêng theo ranh giới Modulith đã có; ADR-006 nêu lý do tách và lý do chưa tách `inventory`.
- [ ] Contract test giữa hai service bằng Spring Cloud Contract hoặc Pact; schema event quản lý bằng Avro/JSON Schema và schema registry.
- [ ] Kafka bật SASL/SCRAM và ACL theo service; TLS giữa service (chi tiết ở phần Security).
- [ ] Chaos test: tắt payment service khi đang chạy k6, bật lại sau 2 phút, đối chiếu không mất và không trùng đơn.

**Bài học nhắm tới:** outbox, saga và bù trừ, idempotent consumer, DLQ, contract testing, tiêu chí tách service.

**Mốc kiểm tra:** chaos test tắt payment giữa chừng vẫn đúng 100% đơn; ADR-005, ADR-006 và ADR-007 hoàn thành; tag `v3-events`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 3 — chi tiết](05-giai-doan-3.md)

## Giai đoạn 4 — Production-grade (tuần 16–19)

Mục tiêu là hệ thống chạy trên Kubernetes với CI/CD, quan sát được theo SLO và sống sót qua chaos test.

**Việc cần làm**

- [ ] OpenTelemetry qua Micrometer: trace xuyên suốt order → Kafka → payment, metric theo RED (rate, errors, duration), log có `traceId`.
- [ ] Dashboard Grafana theo SLO (99,9% đặt hàng thành công, p99 < 300 ms), alert khi error budget cạn quá 50% trong 1 giờ.
- [ ] Dockerfile multi-stage với image distroless hoặc Temurin JRE, chạy non-root, read-only filesystem.
- [ ] Helm chart cho từng service; deploy lên kind; readiness/liveness probe, resource limit, HPA theo CPU và độ trễ.
- [ ] CI trên GitHub Actions: test → build image → SBOM (Syft) → quét (Trivy, OWASP Dependency-Check) → ký image (cosign) → push; fail khi có lỗ hổng High/Critical.
- [ ] Resilience4j: circuit breaker và timeout cho gọi payment, bulkhead cho pool Redis.
- [ ] Chaos: Toxiproxy thêm 2 giây độ trễ vào Kafka và PostgreSQL, kill pod ngẫu nhiên; ghi lại dashboard phản ứng ra sao.
- [ ] Viết postmortem blameless cho một sự cố tự tạo (ví dụ Redis mất kết nối giữa flash sale) theo mẫu SRE.

**Bài học nhắm tới:** observability theo SLO, container và Kubernetes, supply-chain security trong CI, resilience patterns, chaos engineering, postmortem.

**Mốc kiểm tra:** `docs/postmortem-001.md`; CI xanh có SBOM và chữ ký image; dashboard cho thấy circuit breaker mở và đóng đúng lúc; tag `v4-prod`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 4 — chi tiết](06-giai-doan-4.md)

## Giai đoạn 5 — Góc nhìn SA (tuần 20–24)

Mục tiêu là biến dự án thành portfolio kiến trúc: một SAD hoàn chỉnh, ước lượng chi phí có trade-off và một bài trình bày công khai.

**Việc cần làm**

- [ ] Viết Solution Architecture Document theo template arc42 (12 phần), dùng lại C4, ADR và số liệu perf đã có.
- [ ] Threat model đầy đủ theo STRIDE trên kiến trúc cuối; bảng rủi ro, biện pháp đã làm và biện pháp còn thiếu (chi tiết ở phần Security).
- [ ] Ước lượng chi phí chạy thật 1 năm trên AWS cho 3 phương án: EKS, ECS Fargate, và serverless (Lambda + SQS thay Kafka); ghi thành ADR-008 kèm bảng TCO từ Pricing Calculator.
- [ ] Kiểm tra kiến trúc theo 6 trụ cột AWS Well-Architected, ghi điểm mạnh và khoảng trống.
- [ ] Thử GraalVM native cho `payment` service, so sánh startup time và RSS memory với JVM.
- [ ] So sánh thiết kế của mình với bài viết công khai của Tiki (tồn kho) và Shopee/Grab (flash sale), ghi 3 điểm khác biệt và lý do.
- [ ] Viết bài trên Viblo hoặc chuẩn bị tech talk 20 phút trình bày các quyết định và trade-off; ghi lại phản biện nhận được.

**Bài học nhắm tới:** SAD, FinOps và TCO, Well-Architected, security architecture, giao tiếp kiến trúc với người không chuyên.

**Mốc kiểm tra:** `docs/sad` hoàn chỉnh; ADR-008 có bảng chi phí; bài viết hoặc slide công khai; tag `v5-sa`.

Tài liệu chi tiết của giai đoạn này: [Giai đoạn 5 — chi tiết](07-giai-doan-5.md)

## Luồng Security xuyên suốt

Security không phải một giai đoạn riêng mà là một luồng chạy song song: mỗi giai đoạn có việc phòng thủ phải làm và một buổi tự tấn công (2–3 giờ) trước khi gắn tag. Flash sale là mục tiêu tấn công tự nhiên (bot mua gom, khai thác race condition, replay), nên đây cũng là phần làm dự án khác biệt so với các pet project thông thường.

**Abuse cases và biện pháp (nền của threat model)**

| Mối đe dọa | STRIDE | Biện pháp | Giai đoạn |
| --- | --- | --- | --- |
| Bot mua gom toàn bộ hàng | Elevation | Token hàng chờ ký HMAC gắn user + thiết bị, dùng một lần; rate limit theo user và IP; giới hạn số lượng/user; proof-of-work hoặc CAPTCHA ở bước lấy token | 2 |
| Khai thác race condition để mua quá kho (TOCTOU) | Tampering | Optimistic locking rồi Lua script atomic trên Redis; test đồng thời; tự tấn công bằng single-packet attack (Turbo Intruder) | 1–2 |
| Replay hoặc gửi trùng request để tạo nhiều đơn | Tampering | Idempotency-Key gắn với user; nonce + timestamp; token hàng chờ SETNX trên Redis | 1–2 |
| Sửa giá, số lượng trong request (mass assignment, BOPLA) | Tampering | Giá và tồn kho luôn lấy phía server; DTO riêng cho input; không bind entity trực tiếp | 1 |
| Đọc hoặc hủy đơn người khác qua ID (BOLA/IDOR) | Information disclosure | Kiểm tra ownership ở tầng service; ID không đoán được (UUIDv7); test authorization cho mọi endpoint | 1 |
| JWT cấu hình sai (alg none, thiếu kiểm tra aud/iss, token dài hạn) | Spoofing | Resource server kiểm tra iss, aud, exp; JWKS xoay khóa; access token 5 phút; refresh qua Keycloak | 1 |
| Giả mạo webhook thanh toán | Spoofing | Ký HMAC-SHA256 webhook, timestamp + nonce chống replay, so sánh chữ ký hằng thời gian | 3 |
| Bơm event giả vào Kafka | Spoofing, Tampering | SASL/SCRAM + ACL theo service, TLS, schema validation trước khi xử lý | 3 |
| DoS bằng payload lớn, kết nối chậm, ReDoS | Denial of service | Giới hạn body size và timeout, rate limit, không dùng regex trên input người dùng | 2, 4 |
| Rò rỉ secrets trong repo, image, log | Information disclosure | gitleaks trong pre-commit và CI; Kubernetes Secret hoặc External Secrets; mask token trong log | 1, 4 |
| Dependency hoặc image bị cài mã độc (supply chain) | Tampering | Pin version, Renovate, OWASP Dependency-Check, Trivy, SBOM (Syft), ký và verify image bằng cosign, Kyverno chặn image không chữ ký | 4 |
| Khách chối đã đặt hàng; admin lạm quyền | Repudiation, Elevation | Audit log bất biến có traceId và userId; RBAC tách admin API; review log admin | 1, 4 |

**Việc security theo từng giai đoạn**

- [ ] Giai đoạn 0: threat model sơ bộ bằng STRIDE trên sơ đồ Container (OWASP Threat Dragon); viết abuse cases vào `docs/requirements.md`; chọn OWASP ASVS mức 2 làm chuẩn kiểm tra; bật gitleaks và Dependency-Check trong CI ngay từ commit đầu.
- [ ] Giai đoạn 1: Spring Security 7 làm resource server với Keycloak; authorization theo ownership; Bean Validation và Problem Details không lộ stack trace; security headers; Semgrep hoặc CodeQL trong CI. Tự tấn công: IDOR, mass assignment, JWT alg confusion, thử bỏ Idempotency-Key.
- [ ] Giai đoạn 2: rate limiting, token hàng chờ, giới hạn body và timeout. Tự tấn công: race condition bằng Turbo Intruder single-packet, bypass rate limit qua header X-Forwarded-For, tái sử dụng token hàng chờ.
- [ ] Giai đoạn 3: SASL + ACL + TLS cho Kafka; ký webhook; schema validation; consumer từ chối event thiếu chữ ký hoặc sai schema. Tự tấn công: publish event giả, replay webhook cũ, gửi event sai schema vào DLQ.
- [ ] Giai đoạn 4: image non-root và read-only; NetworkPolicy chỉ cho phép luồng đã vẽ trong C4; SBOM, Trivy, cosign, Kyverno; kube-bench theo CIS Benchmark; OWASP ZAP baseline scan trong CI; schemathesis fuzz API từ OpenAPI. Tự tấn công: exec vào pod xem có đọc được secret hay không, thử pull image không chữ ký.
- [ ] Giai đoạn 5: threat model đầy đủ trên kiến trúc cuối, bảng rủi ro còn tồn đọng có chủ sở hữu và hạn xử lý; kiểm tra lại theo ASVS mức 2; đưa kết quả vào phần Security của SAD và trụ cột Security của Well-Architected.

**Nguồn học đi kèm**

- OWASP ASVS, OWASP API Security Top 10 (2023) và OWASP Cheat Sheet Series: chuẩn kiểm tra và hướng dẫn cụ thể cho từng biện pháp trong bảng trên.
- PortSwigger Web Security Academy (miễn phí): lab về race conditions, JWT, access control; dùng để luyện phần tự tấn công.
- *Secure by Design* (Bergh Johnsson, Deogun, Sawano, Manning): ví dụ bằng Java, gắn DDD với bảo mật, rất hợp với dự án này.
- *Threat Modeling: Designing for Security* (Adam Shostack) cho giai đoạn 0 và 5.
- SLSA và OpenSSF Scorecard cho supply chain ở giai đoạn 4; tài liệu Spring Security 7 cho giai đoạn 1.

**Mốc kiểm tra:** mỗi tag Git kèm `docs/security/attack-log-<giai đoạn>.md` ghi lại đã thử tấn công gì, kết quả, và fix nào được đưa vào; CI không có lỗ hổng High/Critical; threat model cuối cùng nằm trong SAD.

Tài liệu chi tiết của luồng này: [Security — chi tiết](08-security.md)

## Nguyên tắc làm việc và nhật ký

Dự án chỉ dạy được bạn khi mỗi quyết định để lại dấu vết và mỗi giai đoạn có số liệu chứng minh.

- Mỗi quyết định kỹ thuật là một ADR theo mẫu MADR trong `docs/adr`; ADR bị thay thế thì đánh dấu superseded, không xóa.
- Mỗi giai đoạn kết thúc bằng một Git tag, README cập nhật và một dòng trong bảng theo dõi ở trên.
- Luôn đo trước khi tối ưu: không thay đổi gì ở giai đoạn 2 và 4 nếu chưa có số baseline.
- Cưỡng lại việc mở rộng scope: không làm UI đẹp, không thêm tính năng ngoài flash sale, payment luôn là mock.
- Mỗi tuần dành 1 giờ viết lại điều đã học vào nhật ký bên dưới; đây là nguyên liệu cho bài viết ở giai đoạn 5.

**Nhật ký ADR**

| ADR | Quyết định | Giai đoạn | Trạng thái |
| --- | --- | --- | --- |
| ADR-001 | Bắt đầu bằng modular monolith với Spring Modulith | 0 | Đề xuất |
| ADR-002 | PostgreSQL + Redis + Kafka | 0 | Đề xuất |
| ADR-003 | Trừ kho trên Redis bằng Lua, PostgreSQL là nguồn sự thật ghi sau | 2 | Đề xuất |
| ADR-004 | Virtual threads cho request handling | 2 | Đề xuất |
| ADR-005 | Outbox bằng Debezium CDC cho order và payment; Modulith externalization cho core | 3 | Đề xuất |
| ADR-006 | Tách order và payment, giữ catalog, inventory, notification trong core | 3 | Đề xuất |
| ADR-007 | Saga choreography, ngưỡng đổi sang orchestration | 3 | Đề xuất |
| ADR-008 | Phương án hạ tầng và chi phí: EKS, ECS Fargate hay serverless | 5 | Đề xuất |

**Nhật ký tiến độ** (thêm dòng mới lên đầu)

| Ngày | Ghi chú |
| --- | --- |
| 26/9/2026 | Hoàn thành tài liệu chi tiết cho cả 6 giai đoạn (tab Giai đoạn 0–5); ADR đánh số 001–008 theo thứ tự tạo; mọi câu hỏi mở đã có quyết định mặc định kèm lý do. |
| 26/9/2026 | Chốt 10 câu hỏi mở của giai đoạn 0 và 1: qty tối đa 2, giữ đơn 5 phút, không làm UI đến hết giai đoạn 3, ASVS mức 2, O'Reilly Learning; một đơn mỗi user mỗi đợt, mock payment theo test token, tự viết retry, test đồng thời chạy mọi PR, repo public + CodeQL. |
| 25/9/2026 | Lập kế hoạch; chưa bắt đầu code. |

Tài liệu chi tiết của phần này: [Quy ước & tự đánh giá](09-quy-uoc-tu-danh-gia.md)
