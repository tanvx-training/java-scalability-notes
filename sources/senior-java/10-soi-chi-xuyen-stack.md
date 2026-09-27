# Mười sợi chỉ xuyên stack

> Kết hợp stack không phải là biết mỗi thứ một ít. Nó là **kể được một câu chuyện đi xuyên qua nhiều tầng** — một request từ card mạng tới `COMMIT`, một byte từ heap tới cgroup, một sự kiện từ outbox tới consumer idempotent. Tài liệu này định nghĩa 10 sợi chỉ như thế. Mỗi sợi: câu hỏi dẫn, chuỗi tài liệu trong kho theo thứ tự nên đọc, điểm chạm trong FlashSale, tuần trong lịch, và cách kiểm tra bạn đã nắm sợi đó chưa.
>
> **Cách dùng:** tạo `learning-notes/threads/<id>.md` cho mỗi sợi (mẫu ở [sj-12](12-mau-ghi-chep.md) §9). Mỗi khi đọc một chương chạm sợi chỉ, thêm 3–5 dòng: *tầng này góp gì vào câu chuyện, con số nào, bẫy nào*. Cuối mỗi quý đọc lại 10 tệp — đó là bài ôn xuyên stack tốt nhất kho có thể cho bạn.

---

## T1 · Một request đi qua hệ thống

**Câu hỏi dẫn:** Từ lúc client gửi SYN đến lúc PostgreSQL `COMMIT` và Kafka nhận event, request của FlashSale đi qua bao nhiêu hàng chờ, bao nhiêu thread, bao nhiêu timeout — và mỗi chỗ tràn thì trông như thế nào?

| Tầng | Đọc | Góp gì |
|---|---|---|
| Kernel, socket | Java Scalability 01 · Sysprog 11 | SYN/accept queue, `somaxconn`, `ListenOverflows` |
| Tomcat | Java Scalability 06–07 | Acceptor, Poller, TaskQueue "nói dối", pool size |
| Spring | Java Scalability 09 · SSIA 5 | Filter chain, proxy, ThreadLocal transaction |
| JDBC/PG | Java Scalability 08 · PG 16 · JPA 10 | Hikari pending, planner, persistence context |
| Kafka | Kafka 3, 6 | Producer buffer, acks, partition leader |
| K8s | CKA-SG 17–18 · sj-gd3 networking | Service, Ingress, kube-proxy, probe |
| Timeout | Java Scalability 02 | Ai ngắt, timeout budget giảm dần |

**FlashSale:** vẽ sơ đồ "5 cánh cửa" cho API đặt hàng ở tuần 29 với số thật từ VPS; cập nhật khi lên K8s (tuần 37) và EKS (tuần 72).
**Tuần:** 5–6, 20–21, 28–31, 37, 55, 72.
**Kiểm tra:** câu L3–L4 chủ đề request flow của `java`; giảng được sơ đồ cho junior không nhìn.

## T2 · Pool và backpressure

**Câu hỏi dẫn:** Hệ thống có bao nhiêu pool (Tomcat, Hikari, Kafka consumer, HPA replica, rate limiter), chúng nối nhau như chuỗi mắt xích nào, và nới một mắt thì hàng chờ dời đi đâu?

| Tầng | Đọc |
|---|---|
| Thread pool | JCiP 6, 8 · Java Scalability 06–07 |
| Connection pool | Java Scalability 08 · JPA 10 |
| Consumer | Kafka 4 · Kafka 12–13 (lag) |
| Rate limit / bulkhead | Java Scalability 06 §van hai tầng · sj-gd4 resilience |
| Autoscale | sj-gd3 HPA · CKA-SG 12–13 |
| Nguyên lý | Java Scalability README "Năm nguyên tắc" · DDIA 2 (NFR) |

**FlashSale:** hàng chờ token (tuần 19), Bucket4j (19), Hikari 17 (16), HPA theo đơn/phút (62), load shedding (86).
**Kiểm tra:** giải thích *Throughput = mắt xích hẹp nhất* bằng số của FlashSale; câu L4 `java` chủ đề pool sizing.

## T3 · Đúng đắn dưới đồng thời

**Câu hỏi dẫn:** "Không bán quá tồn kho" được bảo đảm ở tầng nào — JMM, lock JVM, `@Version`, isolation của PG, Lua atomic trên Redis, exactly-once của Kafka hay saga bù trừ — và mỗi tầng hứa gì, không hứa gì?

| Tầng | Đọc |
|---|---|
| JVM | JCiP 2–5, 16 · MCJ 3 · WGJD 5 |
| ORM | JPA 11 · Java Scalability 10 |
| PostgreSQL | PG 2, 4, 12–13 · DDIA 8 |
| Redis | FlashSale GĐ2 (fs-04) · sj-gd4 Redis |
| Kafka | Kafka 7–8 |
| Hệ phân tán | DDIA 9–10 |

**FlashSale:** test 100 thread (tuần 8) → Redis Lua (16–17) → consumer idempotent (26) → saga (27) → chaos (33) → write skew tái hiện (89) → fencing token (84).
**Kiểm tra:** câu L3–L4 của `jcip`, `jpa`, `pg-internals`, `kafka` chủ đề transaction/isolation; kể được "0 oversell" ở FlashSale bảo đảm bởi đúng những gì.

## T4 · Bộ nhớ: từ heap tới cgroup

**Câu hỏi dẫn:** Vì sao pod bị OOMKilled khi heap chưa đầy, và `-Xmx`, `MaxRAMPercentage`, metaspace, off-heap của thread, requests/limits, CFS throttling liên hệ nhau thế nào?

| Tầng | Đọc |
|---|---|
| GC, heap | OCNJ 3–5 · WGJD 4, 7 |
| Thread cost | Java Scalability 07 §chi phí thật của thread |
| Container | WGJD 12 · OCNJ 8–9 · Java Scalability 07 §container-aware |
| K8s | CKA-SG 13 · sj-gd3 probe/JVM · CKAD tuần 4 |
| Native | OCNJ 15 · WGJD 17 |

**FlashSale:** GC log dưới k6 (tuần 4, 32); OOMKilled tự gây (57); RSS native vs JIT (50).
**Kiểm tra:** câu L4 `ocnj` chủ đề GC/container; lab OOMKilled sửa đúng lần đầu.

## T5 · Đo, đừng đoán

**Câu hỏi dẫn:** Một con số hiệu năng đáng tin cần gì (phân phối, warm-up, sai số, điều kiện), và chuỗi công cụ JMH → k6 → JFR/async-profiler → Micrometer/Prometheus → SLO nối nhau ra sao?

| Tầng | Đọc |
|---|---|
| Phương pháp | OCNJ 1–2 |
| Micro | JCiP 11 · OCNJ 6 (JIT) |
| Load | FlashSale GĐ2 (fs-04) |
| Profiling | OCNJ 12 |
| Metrics | OCNJ 10–11 · Java Scalability README bảng metrics · Kafka 13 |
| SLO/alert | sj-gd2 metrics/alert · DDIA 2 |

**FlashSale:** baseline (14), flame graph (15), JMH trừ kho (20), dashboard + SLO (36), alert burn rate (44).
**Kiểm tra:** perf report của FlashSale có bảng trước/sau đủ điều kiện đo; câu L3 `ocnj` chủ đề đo lường.

## T6 · Timeout, retry, idempotency, resilience

**Câu hỏi dẫn:** Khi payment chậm 5 giây, chuyện gì xảy ra ở client, LB, Tomcat, HTTP client, Kafka producer, consumer — và retry ở đâu là an toàn, ở đâu là nhân đôi tiền?

| Tầng | Đọc |
|---|---|
| Timeout | Java Scalability 02 |
| Idempotency | FlashSale GĐ1 (fs-03) · sj-gd4 idempotency & outbox · Kafka 8 |
| Resilience | sj-gd4 resilience · MCJ 4 (structured concurrency huỷ) · OCNJ 14 |
| Lý thuyết | DDIA 9 |
| Chaos | FlashSale GĐ3–4 (fs-05, fs-06) · Sysprog 18 |

**FlashSale:** Idempotency-Key (8), timeout budget (31), circuit breaker payment (39), chaos payment (33), load shedding (86).
**Kiểm tra:** câu L4 `java` chủ đề timeout; kể được 3 câu chuyện production về retry sai chỗ (ít nhất 1 từ chaos của mình).

## T7 · Dữ liệu: mô hình, index, planner

**Câu hỏi dẫn:** Từ entity JPA tới trang B-tree trên đĩa, mỗi quyết định (ánh xạ, fetch, index, isolation, vacuum) đổi gì ở EXPLAIN và ở p99?

| Tầng | Đọc |
|---|---|
| ORM | JPA 3, 8, 12–13 |
| Lưu trữ | DDIA 3–4 · PG 3, 5 |
| Planner | PG 16–17, 20–23 |
| Index | PG 19, 25, 28 |
| Bảo trì | PG 6–8 |
| Sharding | DDIA 7 |

**FlashSale:** N+1 (9), index outbox (24–25), vacuum bảng lớn (83), GIN tìm sản phẩm (90), đề xuất sharding order (88).
**Kiểm tra:** case optimize #2 có plan trước/sau; câu L3–L4 `pg-internals` và `jpa`.

## T8 · Sự kiện và tiến hoá schema

**Câu hỏi dẫn:** Một sự kiện `order.created` sinh ra ở transaction nào, được ghi ở đâu trước, ai đảm bảo nó đến đúng một lần, và đổi schema mà không hỏng consumer cũ bằng cách nào?

| Tầng | Đọc |
|---|---|
| Outbox | FlashSale GĐ3 (fs-05) · sj-gd4 outbox |
| Broker | Kafka 3–4, 6–8 |
| Schema | DDIA 5 · FlashSale ADR-007 |
| Stream | DDIA 11–13 · Kafka 9, 14 |
| Ranh giới service | FlashSale ADR-006 · OCNJ 14 |

**FlashSale:** outbox (24–25), consumer idempotent (26), tách service + contract test (28–31), registry (31), Streams (79), distributed-patterns-demo (80–82).
**Kiểm tra:** câu L3–L4 `kafka`, `ddia`; blog #4a viết được không nhìn tài liệu.

## T9 · Bảo mật xuyên suốt

**Câu hỏi dẫn:** Một token JWT của khách đi từ Keycloak qua Ingress, filter chain, method security, tới Kafka ACL và NetworkPolicy — và STRIDE trên sơ đồ Container chỉ ra lỗ nào ở mỗi tầng?

| Tầng | Đọc |
|---|---|
| App | SSIA 5–12, 18 |
| OAuth2 | SSIA 13–16 |
| Kafka | Kafka 11 |
| Cụm | CKA-SG 6, 20 · CKS (tra cứu) |
| Supply chain | FlashSale Security (fs-08) · Sysprog 14 |
| Threat model | FlashSale GĐ0, GĐ5 (fs-02, fs-07) |

**FlashSale:** JWT (6), authz (10), buổi tấn công mỗi giai đoạn (11, 22, 33, 42), SASL/ACL (32), resource server (29), NetworkPolicy/RBAC (41), SBOM/cosign (39), threat model v2 (46).
**Kiểm tra:** attack log 5 giai đoạn có ít nhất 8 lỗ tự tìm và đã vá; câu L3–L4 `spring-security`.

## T10 · Vận hành: quan sát, triển khai, sự cố

**Câu hỏi dẫn:** Khi alert p99 kêu lúc 2 giờ sáng, từ log → trace → metric → pod → node → runbook → postmortem, mỗi bước bạn mở gì và hỏi gì?

| Tầng | Đọc |
|---|---|
| Observability | OCNJ 10–12 · Kafka 13 |
| Deploy | sj-gd2 CI/CD · CKA-SG 11 (rollout) · CKAD tuần 3 |
| Debug | Java Scalability 04 §thread dump · CKA-SG 21–22 · CKA tuần 8 |
| Sự cố | Sysprog 18 · sj-gd2 game day · FlashSale GĐ4 postmortem |
| Runbook | FlashSale Quy ước (fs-09) §4 |

**FlashSale:** OTel (35), pipeline (38–40), postmortem-001 (42), game day (47–48), runbook troubleshooting cụm (74).
**Kiểm tra:** 6 ca debug pod bấm giờ ≤ 5 phút mỗi ca; câu L4 `ocnj` và trắc nghiệm troubleshooting CKA ≥ 80%.

---

## Bảng tra ngược: chương nào chạm sợi nào

| Tài liệu | Sợi |
|---|---|
| Java Scalability 01–02 | T1, T6 |
| Java Scalability 03–05 | T1, T4 |
| Java Scalability 06–08 | T1, T2, T5 |
| Java Scalability 09–10 | T1, T3 |
| JCiP 2–5, 16 | T3 |
| JCiP 6, 8, 10–11 | T2, T5 |
| OCNJ 1–2, 12 | T5 |
| OCNJ 3–5, 15 | T4 |
| OCNJ 8–11 | T4, T5, T10 |
| OCNJ 14 | T6, T8 |
| JPA 3, 8, 12–13 | T7 |
| JPA 10–11 | T1, T3 |
| PG 2, 4, 12–14 | T3 |
| PG 16–23, 25, 28 | T7 |
| PG 6–11 | T7, T5 |
| Kafka 3–4, 6–8 | T1, T3, T8 |
| Kafka 11 | T9 |
| Kafka 12–13 | T2, T10 |
| DDIA 2 | T2, T5 |
| DDIA 3–4, 7 | T7 |
| DDIA 5, 11–13 | T8 |
| DDIA 8–10 | T3, T6 |
| SSIA 5–18 | T9 |
| MCJ 2–7 | T3, T4, T6 |
| WGJD 4, 7, 12, 17 | T4 |
| Sysprog 11, 14, 18 | T1, T9, T10 |
| CKA Study Guide, CKAD/CKA | T1, T2, T4, T9, T10 |
| FlashSale fs-02…fs-09 | Tất cả |
