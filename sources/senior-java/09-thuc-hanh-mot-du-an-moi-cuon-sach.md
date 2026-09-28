# Thực hành — một dự án, mọi cuốn sách

> Lộ trình gốc nói "đọc mà không code = chưa đọc". Tài liệu này nói **code ở đâu**: ba tầng thực hành, bản đồ *cuốn sách này đáp xuống chỗ nào trong FlashSale*, danh sách lab thuần ngôn ngữ tối thiểu, việc áp dụng ở công ty theo quý, và luật "mỗi tuần một số đo".

---

## 1. Ba tầng thực hành

| Tầng | Nơi | Giờ/tuần | Trả lời câu | Bằng chứng |
|---|---|---|---|---|
| **1 · Lab thuần ngôn ngữ** | repo `java-deep-dive` | 1,5 | "Cơ chế này chạy thế nào khi tôi bóc trần nó?" | README có số + code ≤ 200 dòng |
| **2 · Dự án FlashSale** | repo `flashsale` (năm 1), sau đó `production-ready-platform`, `distributed-patterns-demo` | 2,5 (năm 1) / 3,5 (năm 2) | "Cơ chế này sống sót thế nào khi 10.000 người bấm mua?" | Tag Git, perf report, ADR, attack log, runbook |
| **3 · Công ty** | Codebase thật | Trong giờ làm | "Cơ chế này sửa được vấn đề thật nào, số trước/sau?" | PR đã merge, design doc, số trước/sau trong CV |

Một chủ đề lý tưởng đi qua cả ba trong 2–4 tuần: race condition trong `java-deep-dive` (tuần 17) → trừ kho atomic bằng Redis Lua trong FlashSale (tuần 16–17) → tìm một chỗ `check-then-act` ở công ty và sửa (tuần 19). Tầng 3 không ép mỗi tuần; ép **mỗi quý ≥ 2 PR có số**.

---

## 2. Bản đồ: cuốn sách → chỗ đáp xuống trong FlashSale

Mỗi dòng: chương đọc trong lịch → việc FlashSale dùng nó → tuần lịch → thứ để đo.

### 2.1 Java, JVM, concurrency

| Sách / chương | Đáp xuống FlashSale | Tuần | Số đo |
|---|---|---|---|
| OCNJ 3–5 (JVM, GC) · WGJD 4 | JVM flag của container FlashSale; GC log dưới k6; chọn G1 vs ZGC cho service order | 3–4, 32 | pause p99, allocation rate |
| OCNJ 2, 12 (phương pháp đo, profiling) | Baseline k6 và flame graph GĐ2 — *đo trước khi sửa* | 14–15 | p50/p95/p99, error rate, CPU flame |
| JCiP 2–5, 16 | Test đồng thời 100 thread; `processed_events` thread-safe; safe publication của cache catalog | 17–19 | test xanh 10 lần; JMH |
| JCiP 6, 8, 10–11 · Java Scalability 06–07 | Thread pool của Tomcat trong FlashSale tính bằng Goetz + Little; hàng chờ token | 20–21 | throughput/pool size |
| Java Scalability 03, 05 · MCJ 2–3 | Virtual threads bật/tắt so bằng k6; lab pinning trên Lua client Redis | 20, 23 | p99 hai chế độ; pinned events |
| MJIA 16 · MCJ 4–5 | `CompletableFuture` rồi structured concurrency cho fan-out (kho + giá + khuyến mãi) | 22, 85 | latency fan-out |
| Effective Java 2–3, 5, 7 | Builder cho Order, equals/hashCode của value object, generics ở port/adapter, stream đúng chỗ | 2, 13–16 | PR review tự viết |
| WGJD 11–12 · OCNJ 8–9 | Gradle reproducible, layered jar, distroless, `MaxRAMPercentage` | 32–34 | kích thước image, thời gian khởi động |

### 2.2 Spring, persistence, PostgreSQL

| Sách / chương | Đáp xuống FlashSale | Tuần | Số đo |
|---|---|---|---|
| Java Scalability 09 · SSH 6 | Proxy CGLIB trên module order; self-invocation cố ý làm hỏng rồi sửa | 5–6 | test tái hiện |
| Java Scalability 10 · JPA 10–11 | 5 bẫy @Transactional viết thành 5 test trên module order; @Version + retry có giới hạn | 7–8 | 5 test xanh; conflict rate |
| JPA 3, 8, 12 | Domain model Order/Inventory/Payment; fetch plan cho API đơn hàng; đếm query | 9–10 | số query/request, N+1 = 0 |
| JPA 20 · WGJD 13–14 | Testcontainers, ArchUnit, mutation test cho luồng đặt hàng | 11–12 | coverage luồng ≥ 80% |
| Java Scalability 08 | Hikari cho FlashSale tính theo chuỗi 5 phép tính; `pending > 0` là alert | 16 | pool size, pending |
| PG 2 · PG 16, 20, 25 | Isolation của trừ kho; EXPLAIN bảng order/outbox; index cho outbox polling | 8, 24–25 | plan trước/sau, ms |
| PG 9–11 | Buffer cache và WAL khi load test — vì sao `synchronous_commit` là đánh đổi | 47–48 | WAL rate, checkpoint |
| PG 6–7, 12–14 | Vacuum bảng outbox/processed_events tăng trưởng; lock khi migration | 82–84 | bloat, lock wait |
| SSIA 5–8, 18 | Filter chain, JWT Keycloak, authz customer/admin, test cấu hình bảo mật | 6, 10, 12 | test 401/403 |
| SSIA 13, 15 | order-service và payment-service là resource server | 29 | contract test |

### 2.3 Sự kiện, dữ liệu phân tán, Kafka

| Sách / chương | Đáp xuống FlashSale | Tuần | Số đo |
|---|---|---|---|
| Kafka 3, 7 | Producer outbox: acks=all, idempotent producer | 24–25 | 0 mất khi kill broker |
| Kafka 4, 8 | Consumer idempotent + `processed_events`; exactly-once ở đâu là thật | 26 | 0 trùng sau replay |
| DDIA 5 | Schema event Avro/JSON Schema, tiến hoá tương thích | 31 | contract test xanh khi thêm field |
| Kafka 6, 11 | Replication, ISR; SASL/SCRAM + ACL theo service | 32–33 | ACL deny test |
| Kafka 12–13 | Consumer lag dashboard, alert | 43 | lag, DLT depth |
| DDIA 1–4 | SAD: NFR, mô hình dữ liệu, lưu trữ — viết arc42 mục 1–5 | 44–47 | SAD hoàn chỉnh |
| Kafka 9, 14 | Streams đếm đơn theo phút (năm 2) | 79 | throughput stream |
| DDIA 6–10 | Đọc lại toàn bộ với "hệ của tôi chọn gì" — replication PG vs Kafka, sharding order, transaction, consensus | 65–90 | 10 đoạn ngắn |

### 2.4 Vận hành, Kubernetes, bảo mật

| Sách / chương | Đáp xuống FlashSale | Tuần | Số đo |
|---|---|---|---|
| OCNJ 10–11 · sj-gd2 metrics/logs | OTel agent, Tempo, Loki; trace một đơn qua 2 service + Kafka | 35–36, 41–46 | trace hoàn chỉnh, 4 golden signals |
| Sysprog 4, 11, 13 · Java Scalability 01–02 | systemd, graceful shutdown; gây tràn accept queue trên VPS; timeout budget | 28–31 | ListenOverflows, timeout chain |
| CKA-SG 8–9, 11, 17 · sj-gd2 CI/CD | FlashSale lên kind bằng manifest rồi Helm; pipeline deploy staging | 37–40 | deploy time, rollback time |
| Sysprog 14, 18 · SSIA 9–10 | Supply chain (SBOM, cosign), CSRF/CORS đúng, postmortem-001 | 39–42 | 0 High/Critical Trivy |
| Giáo trình CKAD/CKA · CKA-SG | FlashSale là workload cho mọi lab: probe, OOMKilled, NetworkPolicy, RBAC, HPA, PVC | 53–75 | thời gian lab |
| sj-gd3 Terraform/EKS | `production-ready-platform`: EKS bằng Terraform, FlashSale Helm lên, HPA, kube-prometheus-stack, destroy | 68–72 | thời gian dựng từ số 0, chi phí/giờ |
| MCJ 6–7 · OCNJ 13–14 | Resilience: timeout, retry, circuit breaker, bulkhead, load shedding — đo p99 khi 1 dependency chậm | 85–86 | p99 có/không CB |

---

## 3. Lab thuần ngôn ngữ tối thiểu (`java-deep-dive`)

Chỉ những lab mà FlashSale **không** tự nhiên bao được. Mỗi lab ≤ 2 giờ, có README theo mẫu lab log.

| # | Lab | Thư mục | Tuần | Xong khi |
|---|---|---|---|---|
| 1 | Records/sealed/pattern matching cũ-vs-mới | `/modern-java` | 2 | 4 demo, 1 refactor DTO 50 dòng → record |
| 2 | Memory leak + heap dump (VisualVM rồi jcmd/MAT) | `/jvm-gc` | 3–4 | Tìm leak không nhìn hướng dẫn |
| 3 | GC log dưới tải, đổi -Xmx, đọc pause | `/jvm-gc` | 4 | Bảng pause theo -Xmx |
| 4 | equals-không-hashCode trong HashSet; MyHashMap | `/collections` | 13–14 | Test xanh so với HashMap |
| 5 | JMH ArrayList vs LinkedList; JMH 3 cách fix counter | `/collections`, `/concurrency` | 14, 17 | Số liệu có sai số |
| 6 | PECS + type erasure | `/generics` | 15 | Compile error đúng chỗ dự đoán |
| 7 | Race condition, volatile stop flag | `/concurrency` | 17 | 5 kết quả khác nhau; treo rồi hết treo |
| 8 | ThreadPoolExecutor 2/4/queue 10 | `/concurrency` | 20 | Vẽ được timeline task |
| 9 | 100k virtual threads; pinning với `-Djdk.tracePinnedThreads` | `/concurrency` | 23 | Thấy pinned trace |
| 10 | Breakpoint `doCreateBean`; proxy CGLIB; self-invocation | `/spring-internals` | 5–6 | Giải thích được bằng stack trace |
| 11 | EXPLAIN (ANALYZE, BUFFERS) query công ty, thêm index | `/jpa-sql` | 24–25 | Plan trước/sau |
| 12 | Redis lock có fencing token vs row lock PG | `/distributed` | 84 | Test hai client tranh nhau |

Đủ 12 lab này + README là output "≥ 10 chủ đề" của Giai đoạn 1 (lab 12 thuộc GĐ4).

---

## 4. Mỗi tuần một số đo

Luật: **tuần nào không sinh ra ít nhất một con số thì tuần đó chưa thực hành.** Con số ghi vào lab log hoặc perf report, kèm điều kiện đo. Ví dụ theo quý:

| Quý | Số đo điển hình |
|---|---|
| 1 | Pause GC dài nhất theo -Xmx; số query/request trước–sau fetch plan; 5 test bẫy @Transactional xanh 10 lần |
| 2 | p50/p95/p99 baseline v1; p99 sau Redis Lua; virtual vs platform threads; JMH LongAdder vs AtomicInteger 8 thread; ms trước–sau index |
| 3 | 0 mất/0 trùng khi kill broker và payment; ListenOverflows khi tràn accept queue; kích thước image; thời gian CI |
| 4 | Deploy time trước–sau; consumer lag; RSS native vs JIT; TCO 3 phương án |
| 5–6 | Thời gian từng lab CKAD/CKA; thời gian dựng EKS từ số 0; chi phí/giờ; điểm thi thử |
| 7–8 | p99 có/không circuit breaker; hit ratio cache; throughput Streams; số ý `mustCover` đạt ở L3–L4 |

Con số là thứ đi vào CV theo công thức *làm X, bằng Y, kết quả Z*. Không có số, không có dòng CV.

---

## 5. Nghi thức thực hành

- **Làm hỏng nó.** Sau khi lab chạy đúng, dành 10 phút làm nó sai có chủ ý (bỏ `volatile`, bỏ `@Version`, giảm pool xuống 1, tắt broker) và ghi triệu chứng. Triệu chứng là thứ bạn nhận ra lúc 2 giờ sáng, không phải cơ chế.
- **Đọc source một class mỗi tuần** (15 phút, trong khối Ôn): `HashMap.putVal`, `ThreadPoolExecutor.execute`, `TransactionInterceptor.invoke`, `HikariPool.getConnection`, `KafkaProducer.send`, `TaskQueue.offer`. Ghi 3 dòng vào concept card.
- **Chaos thứ Sáu cuối tháng** (từ quý 3): 30 phút, chọn một thứ trong FlashSale để giết (pod, Redis, broker, disk) trong lúc k6 chạy, xem dashboard, viết 5 dòng. Đến quý 8 bạn có ~18 câu chuyện production thật.
- **Buổi tấn công** của FlashSale (mỗi giai đoạn, theo `fs-08`) là bắt buộc — đó là nơi bảo mật thành phản xạ.

---

## 6. Áp dụng ở công ty theo quý

| Quý | ≥ 2 việc có số | Từ tuần |
|---|---|---|
| 1 | Refactor Builder + `requireNonNull` (PR); case optimize #1 N+1 có số trước/sau | 2, 10 |
| 2 | PR refactor stream/raw type có lý do viết rõ; case optimize #2 query + index; tính lại pool Tomcat/Hikari cho một service | 16, 21, 25 |
| 3 | Integration test Testcontainers cho module mình; graceful shutdown + timeout budget cho một cuộc gọi ra ngoài | 11, 31 |
| 4 | Dashboard 4 golden signals cho một service thật; 1 alert theo SLO; 1 runbook | 43–47 |
| 5–6 | Probe/resource của một Deployment công ty sửa theo số đo; tech-sharing 30 phút K8s cho dev | 57, 77 |
| 7 | Đề xuất outbox/idempotency cho một luồng thật (dù không được duyệt, gửi design 1 trang) | 81 |
| 8 | Design doc #1 và #2 được review; mentor 1 junior | 92–97 |

Công ty không cho động vào hạ tầng → làm trên FlashSale + VPS, vẫn đủ portfolio (lộ trình gốc §Điều chỉnh). Nhưng PR tầng ứng dụng thì hầu như công ty nào cũng cho; không có lý do bỏ tầng 3 hoàn toàn.

---

## 7. Definition of Done của một lab

- [ ] Có giả thuyết viết trước khi chạy ("tôi nghĩ LinkedList thắng khi insert giữa").
- [ ] Có số đo, có điều kiện đo, chạy ≥ 3 lần nếu là hiệu năng.
- [ ] Đã làm hỏng có chủ ý và ghi triệu chứng.
- [ ] README/lab log theo mẫu sj-12, ≤ 40 dòng, có "làm lại thì đổi gì".
- [ ] Link tới mục lộ trình (`#/roadmap/...`) và chương sách (`#/docs/...`).
- [ ] Tick mục lộ trình **sau** khi 5 ô trên xong, không trước.
