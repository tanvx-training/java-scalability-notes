# Giai đoạn 3 — Event-driven và tách service (tài liệu chi tiết)

Sep 26, 2026 · @Nothing

Năm tuần này biến luồng đặt hàng → thanh toán → xác nhận thành một saga qua Kafka, tự bù khi lỗi, và tách `order` cùng `payment` thành hai service có database riêng; thước đo thành công là tắt payment-service giữa flash sale mà không mất và không trùng một đơn nào.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 3 kết thúc khi hệ thống gồm ba deployable (core, order-service, payment-service) nói chuyện qua Kafka, và chaos test tắt payment-service 2 phút giữa flash sale cho kết quả 100% đơn đúng trạng thái.

**Mục tiêu**

- Hiểu bằng tay ba mảnh của event-driven: outbox (không mất event khi commit), consumer idempotent (không xử lý trùng), saga có bù trừ (không kẹt ở trạng thái dở dang).
- Tách service theo tiêu chí đã viết ở ADR-001, không tách vì "microservices"; `inventory` cố ý ở lại monolith để có ví dụ ngược.
- Mỗi service một database; không có JOIN xuyên service, không có bảng chung.
- Có số đo: latency đặt hàng không xấu đi sau khi tách; latency xác nhận đơn end-to-end p99 dưới 2 giây; consumer lag về 0 trong 30 giây sau khi payment-service sống lại.
- Kafka và webhook được bảo vệ (SASL/SCRAM, ACL, TLS, HMAC) và có nhật ký tấn công thứ ba.

**Trong phạm vi:** Kafka KRaft, Debezium (Kafka Connect), Apicurio schema registry, CloudEvents envelope, Spring Kafka, hai service mới, mock payment gateway tách riêng, Traefik làm gateway trong Compose, contract test cho event, chaos bằng tắt container và Toxiproxy.

**Ngoài phạm vi:** Kubernetes, Helm, HPA, OpenTelemetry đầy đủ, SBOM, cosign (4); tách `inventory` và `catalog` (cố ý không tách); Kafka nhiều broker; exactly-once của Kafka Streams (không dùng Streams); orchestrator như Temporal (chỉ so sánh trong ADR-007).

**Definition of Done (đủ mới gắn tag `v3-events`)**

- [ ] Ba deployable chạy bằng `docker compose up`: `core` (catalog, inventory, notification, token), `order-service`, `payment-service`, cùng `payment-gateway-mock`, Kafka, Kafka Connect + Debezium, Apicurio, Traefik.
- [ ] Ba database riêng (`core_db`, `order_db`, `payment_db`); grep toàn repo không có service nào cấu hình datasource của service khác.
- [ ] 7 topic ở mục 4 có schema đăng ký trong Apicurio, CI chặn thay đổi không tương thích BACKWARD.
- [ ] Outbox: kill `order-service` ngay sau commit của 100 đơn, khởi động lại, 100 event `order.placed` vẫn xuất hiện đúng 1 lần mỗi đơn trên Kafka.
- [ ] Consumer idempotent: replay lại 1.000 event đã xử lý, không đổi trạng thái nào, không hoàn kho thừa.
- [ ] Saga: 4 đường (thanh toán OK, thanh toán lỗi, hết hạn, inventory từ chối sau khi đã thanh toán) có test end-to-end; đường thứ 4 có hoàn tiền.
- [ ] DLQ: event sai schema và event gây exception 5 lần liên tiếp nằm trong `<topic>.DLT` kèm header lý do; có lệnh replay từ DLT.
- [ ] Chaos: tắt `payment-service` 2 phút khi k6 đang chạy, bật lại; `verify-no-oversell` xanh, mọi đơn ở trạng thái cuối trong 60 giây, không đơn nào bị thanh toán 2 lần.
- [ ] Chaos: Toxiproxy thêm 2 giây latency vào Kafka; đặt hàng vẫn 201 trong NFR (outbox không chờ Kafka), xác nhận chậm nhưng đúng.
- [ ] k6 spike chạy lại: p99 `place` không xấu hơn mốc `v2-perf` quá 10%; metric mới `order.confirm.latency` p99 < 2 giây.
- [ ] ADR-005, ADR-006, ADR-007 ở trạng thái Accepted; C4 Container cập nhật với 3 deployable.
- [ ] `docs/security/attack-log-3.md` có 6 kịch bản; Kafka chạy SASL/SCRAM + ACL theo service; webhook có HMAC + nonce.
- [ ] Dòng giai đoạn 3 ở tab chính đổi sang Hoàn thành.

## 2. Lịch 5 tuần theo buổi

20 buổi, khoảng 45 giờ; tuần 11 hạ tầng event, tuần 12 outbox và consumer trong monolith, tuần 13 tách order-service, tuần 14 tách payment-service và saga đầy đủ, tuần 15 security, chaos và chốt. Thứ tự quan trọng: luồng event chạy đúng trong monolith trước khi tách.

| Buổi | Tuần | Việc | Đầu ra |
| --- | --- | --- | --- |
| 1 | 11 | Kafka KRaft, Apicurio, Kafka UI trong Compose; tạo 7 topic bằng script với 6 partition | `compose.yaml` cập nhật, `kafka/topics.sh` |
| 2 | 11 | Thiết kế envelope CloudEvents, schema JSON Schema cho 7 event, đăng ký vào Apicurio; quy tắc tương thích | `contracts/events/*.json`, mục 4 chốt |
| 3 | 11 | Bảng `outbox` trong `order_db` (vẫn là schema trong monolith), Debezium connector với Outbox Event Router SMT | Event `order.placed` xuất hiện trên Kafka từ outbox |
| 4 | 11 | Thử phương án thay thế: Modulith externalization sang Kafka trên nhánh riêng; so sánh; viết ADR-005 | ADR-005 Accepted |
| 5 | 12 | Consumer idempotent: bảng `processed_events`, `@KafkaListener` cho `inventory` nghe `order.placed` và `order.cancelled` | Inventory trừ và hoàn kho qua Kafka thay vì Modulith event |
| 6 | 12 | Retry với backoff, DLT, header lý do; lệnh replay từ DLT | Test poison message xanh |
| 7 | 12 | State machine đơn hàng mới (mục 6.2) với hai cờ `reserved`, `paid`; `payment.requested` và `payment.completed/failed` vẫn trong monolith | Saga chạy trong một process |
| 8 | 12 | Test end-to-end 4 đường saga bằng Testcontainers Kafka; đo `order.confirm.latency` | 4 test xanh |
| 9 | 13 | Tách Gradle module `order-service` trong cùng repo (multi-project), package `order` chuyển sang, `shared.events` thành thư viện `contracts` | Build multi-module xanh |
| 10 | 13 | `order_db` tách thật: Flyway riêng, migrate dữ liệu bằng script, xóa quyền truy cập chéo | 2 database |
| 11 | 13 | `order-service` chạy riêng, Traefik route `/api/orders/**` và `/api/flash-sales/{id}/token`; token hàng chờ chuyển sang order-service | 2 deployable |
| 12 | 13 | Contract test: producer test sinh event mẫu và kiểm tra khớp schema; consumer test đọc event mẫu của producer; CI kiểm tra tương thích | Contract test xanh |
| 13 | 14 | Tách `payment-service` + `payment_db`; `payment-gateway-mock` thành container riêng có webhook | 3 deployable + mock |
| 14 | 14 | Webhook HMAC + timestamp + nonce ở payment-service; `payment.completed/failed` từ webhook | Luồng thanh toán bất đồng bộ end-to-end |
| 15 | 14 | Hoàn tiền: `refund.requested` → payment-service → `payment.refunded`; đường saga thứ 4 | Test hoàn tiền xanh |
| 16 | 14 | Viết ADR-006 (tách gì, không tách gì) và ADR-007 (choreography vs orchestration) với số đo | 2 ADR Accepted |
| 17 | 15 | Kafka SASL/SCRAM + ACL theo service + TLS; Apicurio auth cơ bản | Mỗi service chỉ ghi/đọc topic của mình |
| 18 | 15 | Buổi tấn công 5: publish event giả, replay webhook, event sai schema, poison message | 3–4 dòng attack log |
| 19 | 15 | Chaos: tắt payment-service 2 phút, Toxiproxy latency Kafka; k6 spike hồi quy; buổi tấn công 6 nếu còn giờ | Kết quả chaos + report cập nhật |
| 20 | 15 | Cập nhật C4, README, `docs/runbook-replay.md`, rà Definition of Done, tag | Tag `v3-events` |

Tuần 15 trùng vùng Tết 2027 (theo bảng theo dõi ở tab chính); nếu trượt, cắt buổi 19 phần "buổi tấn công 6" chứ không cắt chaos test.

## 3. Kiến trúc sau khi tách

Hai module có nhịp thay đổi và yêu cầu cô lập lỗi khác hẳn phần còn lại (`order` chịu tải đỉnh, `payment` gọi bên thứ ba và hay lỗi) được tách thành service; `catalog`, `inventory`, `notification` ở lại `core` vì không đạt tiêu chí nào trong ADR-001.

**3.1. Deployable và trách nhiệm**

| Deployable | Module | Database | API đồng bộ | Publish | Consume |
| --- | --- | --- | --- | --- | --- |
| `order-service` | order, token hàng chờ, idempotency, hết hạn | `order_db` (+ `outbox`, `processed_events`) | `/api/orders/**`, `/api/flash-sales/{id}/token` | `order.placed`, `order.cancelled`, `order.confirmed`, `payment.requested`, `refund.requested` | `inventory.reserved`, `inventory.rejected`, `payment.completed`, `payment.failed`, `payment.refunded` |
| `payment-service` | payment, webhook từ gateway | `payment_db` (+ `outbox`, `processed_events`) | `/webhooks/payment` (chỉ gateway gọi) | `payment.completed`, `payment.failed`, `payment.refunded` | `payment.requested`, `refund.requested` |
| `core` | catalog, inventory, notification, admin | `core_db` (+ `processed_events`) | `/api/flash-sales/{id}`, `/api/admin/**` | `inventory.reserved`, `inventory.rejected` | `order.placed`, `order.cancelled`, `order.confirmed` |
| `payment-gateway-mock` | mô phỏng cổng thanh toán | không | `/charge`, `/refund` | webhook HTTP ký HMAC | — |

Redis vẫn một node: `order-service` chạy Lua reserve trên key `sale:*`, `core` chạy job đối chiếu và hoàn kho; hai service dùng hai user Redis khác nhau với ACL khác nhau (mục 9). Catalog đọc đợt (cache) vẫn ở `core`; `order-service` cần giá và trạng thái đợt thì đọc từ Redis cache do `core` ghi, không gọi HTTP sang `core` trên đường nóng.

**3.2. Luồng event**

&#91;embedded content: ba deployable và 7 topic · saga choreography\]

Không service nào gọi HTTP sang service khác; mọi tương tác giữa ba deployable là event qua Kafka, xuất phát từ outbox của bên publish. Chỉ có hai cuộc gọi HTTP ra ngoài: `payment-service` → gateway và gateway → webhook.

**3.3. Các bước của saga (đường thành công)**

| Bước | Ai | Làm gì | Event phát | Trạng thái đơn sau bước |
| --- | --- | --- | --- | --- |
| 1 | order-service | Lua reserve OK, ghi đơn và outbox trong một transaction | `order.placed` | CREATED |
| 2 | core: inventory | Trừ `inventory.available` trong `core_db` (vẫn `CHECK >= 0`) | `inventory.reserved` | — |
| 3 | order-service | Nhận `inventory.reserved`, bật cờ `reserved` | — | CREATED (reserved) |
| 4 | order-service | Khách gọi `POST /orders/{id}/pay`; ghi outbox; trả 202 | `payment.requested` | PAYMENT\_PENDING |
| 5 | payment-service | Gọi gateway `/charge`; gateway trả 202 và gọi webhook sau 0–3 giây | — | — |
| 6 | payment-service | Webhook hợp lệ (HMAC, nonce mới); ghi `payment` và outbox | `payment.completed` | — |
| 7 | order-service | Bật cờ `paid`; cả hai cờ bật thì chuyển CONFIRMED | `order.confirmed` | CONFIRMED |
| 8 | core: notification | Gửi thông báo | — | — |

Bước 2 và bước 6 không có thứ tự cố định; state machine ở mục 6.2 xử lý cả hai thứ tự. Các đường lỗi và bù trừ ở mục 6.3.

## 4. Topic, partition, envelope và schema

Bảy topic, mỗi topic 6 partition, partition key luôn là `orderId` để mọi event của một đơn đi qua cùng partition và consumer thấy chúng theo đúng thứ tự phát.

**4.1. Topic**

| Topic | Producer | Consumer | Key | Retention | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `order.placed` | order-service | core | orderId | 7 ngày | Có `flashSaleId`, `userId`, `qty` |
| `order.cancelled` | order-service | core | orderId | 7 ngày | Có `reason`, `refundRequired` |
| `order.confirmed` | order-service | core | orderId | 7 ngày | Notification dùng |
| `inventory.reserved` | core | order-service | orderId | 7 ngày |  |
| `inventory.rejected` | core | order-service | orderId | 7 ngày | Chỉ khi Redis và DB lệch |
| `payment.requested` | order-service | payment-service | orderId | 7 ngày | Có `amountCents`, `paymentMethodToken` |
| `payment.completed` / `payment.failed` / `payment.refunded` | payment-service | order-service | orderId | 7 ngày | Ba event, một topic `payment.events`, phân biệt bằng `type` |
| `refund.requested` | order-service | payment-service | orderId | 7 ngày |  |

Đếm theo tên trong cấu hình thì có 8 topic (`payment.events` gộp 3 event); tài liệu gọi chung là "7 topic" theo số loại tương tác. Mỗi topic có `<topic>.DLT` tương ứng, retention 30 ngày. `cleanup.policy=delete`; không dùng compaction vì event là sự kiện, không phải trạng thái.

**4.2. Envelope CloudEvents (JSON, structured mode)**

```json
{
  "specversion": "1.0",
  "id": "0192f1a2-7c3e-7f10-9a2b-1d2e3f4a5b6c",       // UUIDv7, dùng làm khóa idempotent
  "source": "/flashsale/order-service",
  "type": "vn.flashsale.order.placed.v1",
  "subject": "order/0192f1a2-...",
  "time": "2026-11-28T10:00:07.123Z",
  "datacontenttype": "application/json",
  "dataschema": "apicurio://order.placed/v1",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "data": { "orderId": "...", "flashSaleId": "...", "userId": "...", "qty": 1, "expiresAt": "..." }
}
```

- `id` là định danh event (không phải `orderId`); consumer ghi `id` vào `processed_events`.
- `type` mang version (`.v1`); đổi không tương thích thì phát `.v2` song song một thời gian, không sửa `.v1`.
- `traceparent` theo W3C để giai đoạn 4 nối trace qua Kafka bằng OpenTelemetry mà không đổi format.
- Dùng thư viện `cloudevents-kafka` và `cloudevents-spring` để không tự parse envelope.

**4.3. Schema registry (Apicurio) và quy tắc tương thích**

| Việc | Cách làm |
| --- | --- |
| Định dạng | JSON Schema (draft 2020-12) cho phần `data`; chọn JSON thay Avro để đọc được bằng mắt khi debug và học tương thích schema mà không cần codegen |
| Đăng ký | Artifact id = tên topic + version; CI dùng `apicurio-registry-maven-plugin` (hoặc gọi REST) để `register` và `test-update` |
| Quy tắc | Compatibility BACKWARD: consumer mới đọc được event cũ; nghĩa là chỉ được thêm field có default hoặc optional, không đổi kiểu, không xóa field bắt buộc |
| CI | Job `schema-compat` chạy `test-update` với schema trong `contracts/events/`; thay đổi vi phạm làm CI đỏ trước khi merge |
| Thư viện `contracts` | Gradle module chung chứa schema và record Java sinh từ schema (jsonschema2pojo) để ba service dùng cùng một định nghĩa; version của thư viện theo semver, service nâng version độc lập |

Hai lỗi cố tình gây ra trong buổi 2 để thấy CI chặn: đổi `qty` từ integer sang string; xóa `userId` khỏi `order.placed`.

## 5. Outbox pattern và ADR-005

Outbox giải quyết một bài toán duy nhất: không được vừa commit đơn vào PostgreSQL vừa gửi Kafka như hai việc rời nhau, vì một trong hai có thể thất bại; ghi event vào bảng `outbox` trong cùng transaction rồi để một tiến trình khác đẩy sang Kafka.

**5.1. Bảng `outbox` (trong `order_db` và `payment_db`)**

```sql
CREATE TABLE outbox (
  id             uuid PRIMARY KEY,            -- = CloudEvents id
  aggregate_type text NOT NULL,               -- 'order'
  aggregate_id   uuid NOT NULL,               -- = Kafka key (orderId)
  type           text NOT NULL,               -- 'vn.flashsale.order.placed.v1'
  payload        jsonb NOT NULL,              -- toàn bộ envelope CloudEvents
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

Ứng dụng chỉ INSERT vào bảng này trong transaction nghiệp vụ; không bao giờ gọi `KafkaTemplate` trong transaction.

**5.2. Debezium Outbox Event Router (`kafka-connect/order-outbox.json`, trích)**

```json
{
  "name": "order-outbox",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "order-db", "database.dbname": "order_db",
    "database.user": "debezium", "database.password": "${file:/secrets/debezium.properties:password}",
    "plugin.name": "pgoutput", "slot.name": "order_outbox", "publication.autocreate.mode": "filtered",
    "table.include.list": "public.outbox",
    "tombstones.on.delete": "false",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.route.by.field": "type",
    "transforms.outbox.route.topic.replacement": "${routedByValue}",
    "transforms.outbox.table.field.event.key": "aggregate_id",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.table.expand.json.payload": "true"
  }
}
```

- PostgreSQL bật `wal_level=logical`; user `debezium` chỉ có `REPLICATION` và `SELECT` trên `outbox`.
- Ánh xạ `type` → topic bằng một SMT `RegexRouter` thêm phía sau (`vn\.flashsale\.(order\.placed)\.v1` → `order.placed`) hoặc thêm cột `topic` vào outbox; chọn cột `topic` cho dễ đọc.
- Dọn bảng: Debezium đọc WAL nên xóa dòng ngay sau INSERT trong cùng transaction là hợp lệ (pattern "insert then delete"); dễ hiểu hơn là job xóa dòng cũ hơn 1 giờ. Chọn job xóa để còn xem được outbox khi debug.
- Kafka Connect chạy 1 worker trong Compose; connector đăng ký bằng script `kafka-connect/register.sh` lúc khởi động.

**5.3. ADR-005: Outbox bằng Debezium CDC, so với Modulith externalization**

| Tiêu chí | Debezium CDC (chọn) | Spring Modulith `@Externalized` + registry | Polling publisher tự viết |
| --- | --- | --- | --- |
| Đảm bảo | At-least-once, thứ tự theo WAL, không mất khi app chết sau commit | At-least-once, publish sau commit trong process; app chết giữa chừng thì `resubmitIncompletePublications` khi khởi động lại | At-least-once nếu viết đúng |
| Độ trễ | Dưới 100 ms | Dưới 10 ms | Theo chu kỳ poll (100–500 ms) |
| Thành phần thêm | Kafka Connect + Debezium, WAL logical | Không | Không |
| Giá trị học | CDC, WAL, Kafka Connect, SMT; là cách các hệ thống lớn ở Việt Nam làm (Tiki dùng binlog MySQL) | Ít; đã học ở giai đoạn 1 | Trung bình; dễ viết sai (polling race, thứ tự) |
| Vận hành | Nặng nhất; replication slot đầy nếu Connect chết lâu | Nhẹ nhất | Nhẹ |

Quyết định: Debezium cho `order-service` và `payment-service`; `core` giữ Modulith event nội bộ và publish `inventory.*` bằng `@Externalized` (đã có registry, không đáng thêm connector thứ ba). Hệ quả xấu chấp nhận: thêm hai container và một cảnh báo cần theo dõi (`pg_replication_slots` lag). Cách xác nhận: test kill `order-service` sau commit ở Definition of Done, và test tắt Kafka Connect 5 phút rồi bật lại thấy event vẫn đến đủ và đúng thứ tự.

## 6. Saga chi tiết và ADR-007

Saga choreography: không có bộ điều phối trung tâm, mỗi service phản ứng với event và phát event tiếp; đơn hàng chỉ có ba trạng thái cuối (CONFIRMED, CANCELLED, CANCELLED sau hoàn tiền) và không được kẹt ở trạng thái giữa quá 10 phút.

**6.1. Vì sao giai đoạn 1 có PAID ngay mà giờ phải đợi**

Ở giai đoạn 1, thanh toán và xác nhận nằm trong một transaction; giờ `inventory.reserved` và `payment.completed` đến từ hai service với độ trễ khác nhau và thứ tự bất kỳ, nên đơn phải nhớ hai sự kiện độc lập bằng hai cờ và chỉ CONFIRMED khi đủ cả hai.

**6.2. State machine của `Order` trong order-service**

| Trạng thái | Cờ `reserved` | Cờ `paid` | Sự kiện đến | Trạng thái mới | Event phát |
| --- | --- | --- | --- | --- | --- |
| CREATED | false | false | `inventory.reserved` | CREATED | — |
| CREATED | any | false | Khách gọi pay (202) | PAYMENT\_PENDING | `payment.requested` |
| CREATED | any | false | Hết hạn 5 phút | CANCELLED (EXPIRED) | `order.cancelled(refundRequired=false)` |
| CREATED / PAYMENT\_PENDING | false | any | `inventory.rejected` | CANCELLED (REJECTED) hoặc REFUND\_PENDING nếu `paid` | `order.cancelled(...)`, và `refund.requested` nếu đã trả tiền |
| PAYMENT\_PENDING | any | false | `payment.completed` | PAYMENT\_PENDING với `paid=true`, hoặc CONFIRMED nếu `reserved=true` | `order.confirmed` khi CONFIRMED |
| PAYMENT\_PENDING | true | true | (sau khi cả hai cờ bật) | CONFIRMED | `order.confirmed` |
| PAYMENT\_PENDING | any | false | `payment.failed` | CANCELLED (PAYMENT\_FAILED) | `order.cancelled(refundRequired=false)` |
| PAYMENT\_PENDING | any | false | Hết hạn 5 phút mà chưa có kết quả thanh toán | PAYMENT\_PENDING, ghi cảnh báo; không hủy | — (xem 6.4) |
| REFUND\_PENDING | — | true | `payment.refunded` | CANCELLED (REFUNDED) | — |
| CONFIRMED / CANCELLED | — | — | Bất kỳ event nào | Không đổi, ghi log `late-event` | — |

- Mỗi chuyển trạng thái là một UPDATE với `WHERE version = ?`; event đến muộn hoặc trùng rơi vào dòng cuối bảng và bị bỏ qua.
- Cờ `reserved`, `paid` là hai cột boolean; `status` chỉ là hàm của hai cờ và các sự kiện lỗi, tính lại sau mỗi event.
- `PAYMENT_PENDING` thay cho PAID của giai đoạn 1; API `GET /orders/{id}` thêm trường `paymentStatus` để client biết đang chờ.

**6.3. Bốn đường của saga và bước bù**

| Đường | Điều gì xảy ra | Bù trừ | Ai bù |
| --- | --- | --- | --- |
| 1. Thành công | reserved + paid | Không | — |
| 2. Thanh toán lỗi | `payment.failed` | Hoàn kho DB và Redis | core: inventory nghe `order.cancelled` |
| 3. Hết hạn | Không pay trong 5 phút | Hoàn kho | core: inventory |
| 4. Inventory từ chối sau khi đã trả tiền | Redis cho qua nhưng `core_db` từ chối (drift) rồi `payment.completed` đến | Hoàn tiền: `refund.requested` → payment-service gọi `/refund` → `payment.refunded`; Redis được job đối chiếu sửa | order-service phát, payment-service thực hiện |

Đường 4 hiếm nhưng là bài học chính của saga: bù trừ không phải rollback, tiền đã đi thì phải có bước trả lại và trạng thái riêng cho nó.

**6.4. Timeout và "đơn kẹt"**

- `payment.requested` đã phát mà 10 phút không có `payment.completed/failed`: job trong order-service phát lại `payment.requested` với cùng `orderId` (payment-service idempotent theo `orderId`, không tính tiền hai lần); sau 3 lần thì chuyển CANCELLED (PAYMENT\_TIMEOUT) và phát `refund.requested` phòng trường hợp gateway đã trừ tiền; payment-service trả `payment.refunded` với `amount=0` nếu không có gì để hoàn.
- Metric `saga.stuck` đếm đơn ở trạng thái giữa quá 10 phút; alert ở giai đoạn 4.
- Không có bảng saga riêng: trạng thái saga chính là trạng thái đơn cộng hai cờ; đây là điểm khác biệt với orchestration.

**6.5. ADR-007: Choreography, so với orchestration**

| Tiêu chí | Choreography (chọn) | Orchestration (Temporal, Camunda, hoặc orchestrator tự viết) |
| --- | --- | --- |
| Nơi giữ logic luồng | Rải trong 3 service, mỗi service biết event mình nghe và phát | Một chỗ, dễ đọc toàn luồng |
| Coupling | Thấp nhất; thêm consumer không sửa producer | Orchestrator biết mọi service |
| Debug | Cần trace phân tán (giai đoạn 4); khó thấy toàn cảnh | Dễ, có state của saga |
| Số bước | 4 bước, 2 bù: còn quản được | Đáng dùng khi trên 5–6 bước hoặc nhiều nhánh |
| Giá trị học | Học đúng cái khó của event-driven (thứ tự, trùng, kẹt) | Học thêm một công cụ |

Quyết định: choreography cho FlashSale; ghi rõ ngưỡng đổi sang orchestration (trên 6 bước hoặc cần SLA theo dõi từng saga) và để một buổi ở giai đoạn 5 đọc kiến trúc Temporal để so sánh. Cách xác nhận: 4 test end-to-end ở mục 10 và chaos test tắt payment-service.

## 7. Consumer idempotent, retry, DLQ, replay

Kafka chỉ cam kết at-least-once ở cấu hình này, nên mọi consumer đều phải chịu được event trùng và event đến muộn; exactly-once là kết quả của consumer idempotent cộng outbox, không phải của Kafka.

**7.1. Cấu hình consumer (Spring Kafka)**

| Tham số | Giá trị | Lý do |
| --- | --- | --- |
| `enable.auto.commit` | false; `AckMode.RECORD` | Commit offset sau khi xử lý xong từng record |
| `isolation.level` | read\_committed | Sẵn cho khi producer bật transaction (không dùng ở giai đoạn này) |
| `max.poll.records` | 100; `max.poll.interval.ms` 300000 | Tránh rebalance khi xử lý chậm |
| Concurrency | 3 consumer thread mỗi service (6 partition / 2 instance ở giai đoạn 4) | Song song theo partition |
| Producer `acks` | all; `enable.idempotence` true | Không mất, không trùng do retry của producer |

**7.2. Idempotent bằng bảng `processed_events`**

```sql
CREATE TABLE processed_events (
  consumer   text NOT NULL,          -- 'inventory', 'order-saga'
  event_id   uuid NOT NULL,          -- CloudEvents id
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, event_id)
);
```

Listener chạy trong một transaction DB: `INSERT INTO processed_events` trước, rồi xử lý nghiệp vụ; INSERT vấp PK thì bỏ qua cả event. Vì INSERT và nghiệp vụ cùng transaction, app chết giữa chừng thì cả hai rollback và event được đọc lại. Dọn bảng sau 30 ngày (dài hơn retention topic).

Với `inventory`, thêm lớp idempotent theo nghiệp vụ: `HDEL reserved user` trả 0 nghĩa là đã hoàn, không `INCRBY` lần nữa; hai lớp vì Redis nằm ngoài transaction DB.

**7.3. Retry và dead-letter**

- `DefaultErrorHandler` với `ExponentialBackOff` (1 giây, nhân 2, tối đa 30 giây, 5 lần); exception loại `NonRetryable` (sai schema, validation) đi thẳng DLT.
- `DeadLetterPublishingRecoverer` publish sang `<topic>.DLT` với header `x-exception-class`, `x-exception-message`, `x-original-partition`, `x-original-offset`, `x-attempts`.
- Trong lúc retry, partition bị chặn (blocking retry) là cố ý: giữ thứ tự cho cùng `orderId`; ghi rõ trade-off này vào runbook, và đo consumer lag khi một event xấu chặn partition 30 giây.

**7.4. Replay (`docs/runbook-replay.md`)**

| Tình huống | Lệnh | Điều kiện |
| --- | --- | --- |
| Replay một event từ DLT | `flashsale-cli replay --topic order.placed.DLT --offset N` (copy record về topic gốc, giữ key, thêm header `x-replayed-from`) | Đã sửa bug gây lỗi; consumer idempotent nên replay thừa cũng vô hại |
| Đọc lại toàn bộ topic cho consumer mới | `kafka-consumer-groups --reset-offsets --to-earliest --group inventory` | Consumer group dừng; `processed_events` chặn xử lý trùng |
| Bỏ qua poison message | Reset offset của một partition lên +1 | Ghi vào audit ai bỏ, vì sao |

`flashsale-cli` là một Gradle module nhỏ dùng `KafkaTemplate`; viết 30 phút, dùng suốt phần còn lại của dự án.

## 8. Cách tách service và ADR-006

Tách theo bốn bước có thể dừng ở bất kỳ bước nào mà hệ thống vẫn chạy: tách build, tách database, tách deployable, rồi mới cắt đường gọi trực tiếp; ranh giới Modulith từ giai đoạn 1 là thứ làm bước 1 chỉ mất một buổi.

**8.1. Bốn bước (áp dụng cho `order` ở tuần 13, `payment` ở tuần 14)**

| Bước | Việc | Kiểm tra dừng được |
| --- | --- | --- |
| 1. Tách build | Gradle multi-project: `core`, `order-service`, `payment-service`, `contracts` (schema + record), `common` (Problem Details, security config, `Clock`) | Build xanh; `core` không import package `order` |
| 2. Tách database | Flyway riêng cho `order_db`; script copy dữ liệu `orders`, `idempotency_key`; xóa FK từ `orders` sang `flash_sale` (thay bằng `flash_sale_id` thuần và xác thực qua Redis cache); thu hồi quyền của user `core` trên bảng đã chuyển | Hai DB; `core` chạy bình thường không có bảng `orders` |
| 3. Tách deployable | `order-service` chạy riêng, Traefik route theo path; `core` bỏ controller order | k6 spike xanh qua Traefik |
| 4. Cắt gọi trực tiếp | Mọi call `Orders.*` từ `core` (admin cancel, report) chuyển sang event hoặc API; admin cancel thành `POST /api/orders/{id}/cancel` với role admin trên order-service; report của admin đọc từ `core_db` (đã có `inventory`) cộng số đếm nhận qua event | Grep không còn import chéo; `ModularityTests` của `core` xanh |

**8.2. Dữ liệu cần ở cả hai bên**

| Dữ liệu | Chủ sở hữu | Bên kia cần | Cách lấy |
| --- | --- | --- | --- |
| Giá và trạng thái đợt | core: catalog | order-service (khi đặt hàng) | Đọc `cache:sale:{id}` trên Redis do core ghi khi mở/đóng đợt; TTL dài (đến `ends_at`) vì đây là dữ liệu chủ, không phải cache tùy chọn; thiếu key → 409 `sale-not-open` |
| Tồn kho nóng | core: inventory | order-service (Lua) | Redis key `sale:{id}:stock`; core khởi tạo, order-service trừ, core hoàn |
| Số đơn theo trạng thái (report admin) | order-service | core (report) | core đếm từ event `order.*` vào bảng `sale_stats` (read model), trễ tối đa vài giây |
| Số tiền và token thanh toán | order-service | payment-service | Trong `payment.requested` |
| `userId` | JWT | cả ba | Không lưu chéo; mỗi service lấy từ token hoặc event |

Không có JOIN qua service; nếu cần dữ liệu của service khác thì hoặc nhận qua event và giữ bản sao, hoặc chấp nhận là dữ liệu cũ vài giây.

**8.3. Gateway và định tuyến (Traefik trong Compose)**

| Route | Đích | Ghi chú |
| --- | --- | --- |
| `/api/orders/**`, `/api/flash-sales/{id}/token` | order-service | Rate limit vẫn nằm trong order-service |
| `/api/flash-sales/**`, `/api/admin/**` | core |  |
| `/webhooks/payment` | payment-service | Chỉ mở cho mạng của gateway mock; giai đoạn 4 dùng NetworkPolicy |

Traefik chỉ định tuyến, không xác thực; mỗi service tự kiểm tra JWT như giai đoạn 1 (không tin "gateway đã kiểm"). Spring Cloud Gateway không dùng vì thêm một service Java để bảo trì mà không dạy thêm gì ở giai đoạn này; giai đoạn 4 thay Traefik bằng ingress của Kubernetes.

**8.4. Contract test cho event**

- Producer test (order-service): với mỗi loại event, tạo event từ code thật rồi validate với schema trong `contracts` bằng `networknt/json-schema-validator`; lưu event mẫu vào `contracts/samples/`.
- Consumer test (core, payment-service): đọc event mẫu của producer từ `contracts/samples/` và chạy listener thật với Testcontainers Kafka; đổi schema mà không cập nhật mẫu thì test đỏ.
- CI `schema-compat` (mục 4.3) chặn thay đổi không tương thích ở registry; ba lớp này thay cho Pact vì Pact cho message cần broker riêng và không dạy thêm về schema.

**8.5. ADR-006: Tách `order` và `payment`, giữ `catalog`, `inventory`, `notification` trong `core`**

- Tiêu chí từ ADR-001: nhịp thay đổi hoặc yêu cầu scale khác hẳn; cần cô lập lỗi; cần ranh giới bảo mật riêng.
- `order`: chịu 2.500 request/giây ở đỉnh trong khi phần còn lại vài trăm; scale riêng; thay đổi nhiều nhất (đạt tiêu chí 1).
- `payment`: gọi bên thứ ba hay lỗi và chậm; lỗi không được kéo đặt hàng chết; xử lý webhook và dữ liệu tài chính cần ACL riêng (đạt tiêu chí 2 và 3).
- `inventory`: gắn chặt với catalog và job đối chiếu; tách sẽ tạo một service chỉ có một bảng và một job; không đạt tiêu chí nào; nếu tách sẽ là microservice vì microservice.
- `notification`: sẽ là ứng viên tách ở giai đoạn 4 nếu thêm email/SMS thật (lý do: bên thứ ba); ghi làm "quyết định để mở".
- Hệ quả xấu chấp nhận: hai bản sao dữ liệu đợt (Redis) và một read model (`sale_stats`) cần theo dõi; ba pipeline deploy; debug cần trace phân tán (giai đoạn 4 giải quyết).
- Cách xác nhận: k6 spike sau tách không xấu hơn 10%; chaos tắt payment-service không ảnh hưởng `place`; `ModularityTests` của `core` vẫn xanh.

## 9. Security giai đoạn 3

Ranh giới tin cậy 2 giờ có ba service và một message bus; nguyên tắc là mỗi service chỉ có đúng quyền nó cần trên Kafka, Redis và PostgreSQL, và mọi thứ đến từ ngoài (webhook) phải chứng minh nguồn gốc bằng chữ ký.

**9.1. Kafka**

| Việc | Cách làm |
| --- | --- |
| Xác thực | SASL/SCRAM-SHA-512; mỗi service một user: `order-service`, `payment-service`, `core`, `kafka-connect`, `flashsale-cli`; mật khẩu qua biến môi trường, không trong `application.yaml` |
| Mã hóa | TLS với CA tự ký cho Compose (`SASL_SSL`); PLAINTEXT chỉ cho listener nội bộ của controller |
| ACL | `order-service`: WRITE `order.*`, `payment.requested`, `refund.requested`; READ `inventory.*`, `payment.events`; group `order-saga`. `payment-service`: WRITE `payment.events`; READ `payment.requested`, `refund.requested`; group `payment`. `core`: WRITE `inventory.*`; READ `order.*`; group `inventory`, `notification`. `kafka-connect`: WRITE `order.*`, `payment.*`, `refund.requested` và các topic nội bộ của Connect. `flashsale-cli`: READ và WRITE `*.DLT`, WRITE topic gốc để replay, chỉ dùng tay |
| Tạo topic | `auto.create.topics.enable=false`; script tạo topic chạy bằng user admin lúc khởi động |
| Apicurio | Bật xác thực cơ bản; CI dùng user riêng chỉ có quyền đăng ký và test-update |

**9.2. Webhook từ gateway (`POST /webhooks/payment`)**

- Header `X-Signature: t=<unix-ms>,v1=<hex HMAC-SHA256(secret, t + "." + body)>`; payment-service từ chối nếu `|now - t| > 5 phút` hoặc chữ ký sai (so sánh bằng `MessageDigest.isEqual`).
- Header `X-Event-Id` (UUID của gateway); lưu vào `processed_webhooks` trong cùng transaction với `payment` và outbox; trùng thì 200 nhưng không làm gì (gateway thật sẽ retry nên phải idempotent).
- Body chỉ chứa `providerRef`, `orderId`, `status`, `amountCents`; payment-service đối chiếu `amountCents` với `payment.requested` đã lưu; lệch thì `payment.failed` với lý do `amount-mismatch` và cảnh báo.
- Secret của webhook khác secret gọi `/charge`; xoay được bằng cách chấp nhận hai secret trong 24 giờ.
- Endpoint không có JWT (gateway không phải user), nên phải nằm ngoài `authenticated()` và có rate limit theo IP riêng; giai đoạn 4 giới hạn bằng NetworkPolicy.

**9.3. PostgreSQL và Redis theo service**

- Ba user DB: `order_app`, `payment_app`, `core_app`, mỗi user chỉ thấy database của mình; `debezium` có REPLICATION và SELECT trên `outbox` của `order_db` và `payment_db`, không thấy `orders`.
- Hai user Redis: `order-svc` (Lua trên `sale:*`, `ratelimit:*`, đọc `cache:sale:*`), `core-svc` (`sale:*` để khởi tạo và hoàn, `cache:*` ghi, SCAN cho đối chiếu).

**9.4. Cập nhật threat model**

- Dòng "API ↔ Kafka": biện pháp đã làm SASL, ACL, TLS, schema validation; mức còn lại Thấp.
- Dòng "Payment Gateway → API (webhook)": biện pháp HMAC, timestamp, nonce, đối chiếu số tiền; mức còn lại Thấp–Trung bình (secret rò rỉ).
- Dòng mới "Kafka Connect / Debezium": có quyền đọc WAL của outbox; nếu bị chiếm, có thể đọc mọi event; biện pháp user REPLICATION tối thiểu, Connect không mở REST ra ngoài mạng Compose; mức Trung bình, ghi vào rủi ro chấp nhận vì không bật xác thực REST của Connect trong dự án.

**9.5. Hai buổi tự tấn công (buổi 18 và 19) — `docs/security/attack-log-3.md`**

| # | Kịch bản | Cách thử | Kết quả kỳ vọng | Test hồi quy |
| --- | --- | --- | --- | --- |
| 1 | Publish `payment.completed` giả bằng user `core` | `kafka-console-producer` với credential của core | Bị ACL từ chối (`TopicAuthorizationException`) | `KafkaAclTest` bằng Testcontainers với ACL |
| 2 | Publish event giả bằng credential của `flashsale-cli` | Như trên | Thành công về mặt Kafka (cli có quyền) nhưng order-service từ chối vì `source` không phải payment-service và schema không có chữ ký; ghi nhận: cli là quyền cao, chỉ dùng tay, log đầy đủ | Test `source` allowlist |
| 3 | Replay webhook cũ | Gửi lại body và chữ ký hợp lệ sau 6 phút; gửi lại trong 5 phút | 401 vì `t` quá cũ; 200 nhưng không tác dụng vì `X-Event-Id` trùng | `WebhookReplayTest` |
| 4 | Webhook sửa số tiền | Đổi `amountCents` giữ chữ ký; ký lại với secret đoán | 401 chữ ký sai; nếu có secret (giả lập rò rỉ) thì `payment.failed(amount-mismatch)` do đối chiếu | `WebhookAmountTest` |
| 5 | Event sai schema và poison message | Producer gửi `qty: "one"`, rồi gửi event làm listener ném NPE | Vào DLT với header lý do sau 1 lần (schema) và 5 lần (NPE); partition không kẹt quá 30 giây | `DltRoutingTest` |
| 6 | Gửi trùng 1.000 event `order.placed` | Replay bằng cli | `processed_events` chặn; tồn kho không đổi | `IdempotentConsumerTest` |

## 10. Test, chaos và hồi quy hiệu năng

Ba tầng test mới xuất hiện ở giai đoạn này: component test cho từng service với Kafka thật (Testcontainers), end-to-end test cho 4 đường saga qua toàn bộ Compose, và chaos test là thứ chứng minh outbox, idempotent consumer và saga thực sự hoạt động.

**10.1. Test theo tầng**

| Tầng | Công cụ | Nội dung | Thời gian |
| --- | --- | --- | --- |
| Unit | JUnit | State machine mục 6.2: bảng chuyển trạng thái chạy như parameterized test, cả hai thứ tự `reserved` và `paid` | Giây |
| Component | `@SpringBootTest` + Testcontainers PostgreSQL và Kafka (KRaft) | Mỗi service: nhận event mẫu từ `contracts/samples/` → kiểm tra DB và outbox; publish → kiểm tra record trên Kafka; retry và DLT | 2–3 phút mỗi service |
| Contract | Xem mục 8.4 | Producer sinh mẫu, consumer đọc mẫu, CI kiểm tra registry | Giây |
| End-to-end | Testcontainers `ComposeContainer` với `compose.yaml` đầy đủ, hoặc `docker compose` + test client | 4 đường saga; chờ trạng thái cuối bằng Awaitility (tối đa 30 giây) | 5–8 phút, chỉ chạy trên `main` |
| Chaos | Script bash + k6 + Toxiproxy | Mục 10.3 | 10 phút, chạy tay ở buổi 19 và trước tag |

**10.2. Bốn test end-to-end**

1. Thành công: đặt hàng → pay(`tok_success`) → chờ CONFIRMED; kiểm tra `core_db.inventory.available` giảm, `sale_stats` cập nhật, notification log có đơn.
2. Thanh toán lỗi: pay(`tok_declined`) → CANCELLED(PAYMENT\_FAILED); tồn kho DB và Redis hoàn; không có `payment` SUCCESS.
3. Hết hạn: đặt hàng, không pay, dịch `Clock` (order-service có endpoint `/test/clock` chỉ bật ở profile `e2e`) qua 5 phút → CANCELLED(EXPIRED); hoàn kho.
4. Inventory từ chối sau khi trả tiền: ép drift bằng cách `SET sale:{id}:stock 5` khi DB chỉ còn 0, đặt hàng (Redis cho qua), pay(`tok_success`) trước khi core xử lý (dừng consumer `inventory` bằng Actuator `pause`), rồi bật lại → `inventory.rejected` → REFUND\_PENDING → `payment.refunded` → CANCELLED(REFUNDED); gateway mock ghi nhận một lệnh `/refund` đúng số tiền.

**10.3. Chaos test (`perf/chaos/`)**

| # | Kịch bản | Cách làm | Kỳ vọng |
| --- | --- | --- | --- |
| 1 | payment-service chết 2 phút giữa flash sale | `docker compose stop payment-service` ở giây 30 của `spike.js`, `start` ở giây 150 | `place` p99 không đổi; đơn ở PAYMENT\_PENDING chờ; sau khi bật lại, consumer lag về 0 trong 30 giây; mọi đơn về trạng thái cuối trong 60 giây; `verify-no-oversell` xanh; không `payment` SUCCESS trùng |
| 2 | Kafka chậm 2 giây | Toxiproxy `latency` 2000 ms trên cổng Kafka mà order-service dùng | `place` vẫn 201 trong NFR (chỉ ghi outbox); `order.confirm.latency` tăng nhưng đúng |
| 3 | Kafka Connect chết 5 phút | `stop kafka-connect` | Không mất event; khi bật lại, event theo đúng thứ tự; kiểm tra `pg_replication_slots` lag về 0 |
| 4 | order-service chết ngay sau commit | `kill -9` khi k6 đang chạy (dùng `docker kill`) | Mọi đơn đã commit đều có `order.placed` đúng 1 lần (đếm bằng cli); đơn chưa commit không tồn tại |
| 5 | Poison message trong `order.placed` | Publish event làm inventory ném exception | Vào DLT sau 5 lần; partition khác vẫn chạy; replay sau khi sửa |

Mỗi kịch bản có kết quả ghi vào `docs/perf/report.md` mục "Chaos giai đoạn 3" kèm thời điểm, và một dòng "điều gì bất ngờ".

**10.4. Hồi quy hiệu năng sau khi tách**

- Chạy lại `spike.js` qua Traefik trên `compose.perf.yaml` cập nhật (order-service 2 CPU, core 1 CPU, payment-service 0,5 CPU, Kafka 1 CPU).
- Ngưỡng: p99 `place` không xấu hơn mốc `v2-perf` quá 10%; p99 `sale` không đổi; metric mới `order.confirm.latency` (từ `created_at` đến CONFIRMED, tính trong order-service) p99 < 2 giây ở đỉnh.
- Consumer lag của `inventory` và `order-saga` (metric `kafka.consumer.fetch.manager.records.lag.max`) dưới 1.000 record ở đỉnh, về 0 trong 30 giây sau đỉnh.
- Nếu `place` xấu hơn 10%: nghi ngờ đầu tiên là Traefik và kết nối giữa container, đo lại bằng cách gọi thẳng order-service để tách bạch.

## 11. Nguồn học cho giai đoạn 3 và quyết định cho các câu hỏi mở

Khoảng 10 giờ đọc; hai nguồn xương sống là *Microservices Patterns* (Richardson, ví dụ Java) và microservices.io, cộng tài liệu Debezium.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1 | Kafka docs: Design, KRaft; Apicurio Registry docs | Partition, ordering, retention; đăng ký schema | Có |
| 2 | CloudEvents spec 1.0 và Kafka protocol binding; JSON Schema compatibility (Apicurio docs) | Envelope, structured vs binary mode; quy tắc BACKWARD | Có |
| 3–4 | Debezium docs: PostgreSQL connector, Outbox Event Router; bài "Reliable Microservices Data Exchange With the Outbox Pattern" (Debezium blog); microservices.io: Transactional outbox | CDC, SMT, dọn outbox | Có |
| 3–4 | Spring Modulith docs: Externalized events | Phương án thay thế trong ADR-005 | Có |
| 5–6 | Spring Kafka reference: Error handling, Retrying, Dead-letter; microservices.io: Idempotent consumer | Backoff, DLT, header | Có |
| 7 | *Microservices Patterns* chương 4 (Saga); microservices.io: Saga, Choreography, Orchestration | Bù trừ, semantic lock, countermeasures | Sách không; site có |
| 7 | *Designing Data-Intensive Applications* 2nd: chương về consistency, exactly-once và idempotence | Vì sao at-least-once + idempotent | Không |
| 9–10 | *Monolith to Microservices* (Sam Newman): chương về tách database | Bốn bước tách DB, read model | Không |
| 11 | Traefik docs: Docker provider, routers | Route theo path | Có |
| 12 | networknt json-schema-validator README; bài về consumer-driven contracts cho event | Ba lớp contract | Có |
| 14 | Stripe docs: Webhook signatures; Slack: Verifying requests | Mẫu HMAC + timestamp trong thực tế | Có |
| 16 | Temporal docs: Concepts (chỉ đọc, không cài); bài so sánh choreography vs orchestration của Chris Richardson | ADR-007 | Có |
| 17 | Kafka docs: Security (SASL/SCRAM, ACL, SSL); Redis ACL | Cấu hình theo service | Có |
| 19 | Toxiproxy README; bài Principles of Chaos Engineering | Kịch bản chaos | Có |

**Quyết định cho các câu hỏi mở** (chốt sẵn theo tiêu chí thực tế và học sâu; đổi được bằng cách sửa bảng này)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | Một repo nhiều module hay tách repo mỗi service? | **Một repo (monorepo), Gradle multi-project** | Một người làm; atomic commit khi đổi contract; giai đoạn 4 build image riêng từng module vẫn được |
| 2 | JSON Schema hay Avro? | **JSON Schema** | Đọc bằng mắt khi debug, học tương thích schema mà không codegen; Avro để dành khi cần payload nhỏ |
| 3 | Debezium cho cả `core` hay chỉ hai service mới? | **Chỉ order-service và payment-service**; `core` dùng Modulith `@Externalized` | Học cả hai cách trên cùng dự án, không thêm connector thứ ba |
| 4 | Blocking retry (giữ thứ tự) hay non-blocking retry topic? | **Blocking retry** với backoff ngắn, tối đa 5 lần | Thứ tự theo `orderId` quan trọng hơn throughput ở đây; ghi trade-off vào runbook; non-blocking là bài đọc thêm |
| 5 | Traefik hay Spring Cloud Gateway? | **Traefik** | Định tuyến thuần, không thêm service Java; giai đoạn 4 đổi sang ingress |
| 6 | Mock gateway là WireMock hay service Spring nhỏ? | **Service Spring nhỏ** (`payment-gateway-mock`) có `/charge`, `/refund`, webhook có chữ ký và độ trễ cấu hình được | Cần ký HMAC và delay động; WireMock làm được nhưng khó đọc hơn khi demo |
| 7 | Pay đồng bộ (giữ 200 như giai đoạn 1) hay bất đồng bộ (202 + poll)? | **202 + poll**, có `paymentStatus` trong `GET /orders/{id}` | Đúng cách gateway thật hoạt động; buộc client và test xử lý trạng thái chờ |
| 8 | Read model `sale_stats` cho report admin, hay gọi HTTP sang order-service? | **Read model từ event** | Không gọi đồng bộ giữa service; chấp nhận trễ vài giây, ghi rõ trong API report |
