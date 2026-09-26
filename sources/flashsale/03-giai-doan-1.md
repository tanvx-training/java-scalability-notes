# Giai đoạn 1 — Modular monolith chạy đúng (tài liệu chi tiết)

Bốn tuần này làm cho luồng đặt hàng đúng tuyệt đối dưới 100 request đồng thời, chưa cần nhanh; mọi con số đo được ở đây là baseline cho giai đoạn 2.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 1 kết thúc khi 100 request đồng thời mua 10 sản phẩm cho đúng 10 đơn thành công, tồn kho về 0, và mọi endpoint từ chối người không có quyền.

**Mục tiêu**

- Luồng đặt hàng → thanh toán (mock) → xác nhận đúng trong mọi thứ tự và mọi lần retry.
- Ranh giới 5 module được máy kiểm tra, không dựa vào kỷ luật cá nhân.
- Có baseline đo được: số lần xung đột optimistic lock và latency ở 100 request đồng thời, để giai đoạn 2 so sánh.
- Authn/authz đúng từ đầu: JWT từ Keycloak, phân quyền theo role và theo ownership.
- Có nhật ký tấn công đầu tiên (`docs/security/attack-log-1.md`) với ít nhất 6 kịch bản đã thử.

**Trong phạm vi:** 5 module, schema V1, API ở mục 5, idempotency, optimistic locking, hết hạn giữ đơn, payment mock đồng bộ, notification ghi log, Keycloak + Spring Security 7, test đồng thời, CodeQL trong CI.

**Ngoài phạm vi (để dành cho giai đoạn sau):** Redis, token hàng chờ, rate limiting (2); Kafka, outbox, saga, tách service (3); Kubernetes, OpenTelemetry, SBOM (4). Không tối ưu hiệu năng ở giai đoạn này dù thấy chậm.

**Definition of Done (đủ mới gắn tag `v1-monolith`)**

- [ ] `ModularityTests` xanh; `Documenter` sinh sơ đồ module vào `docs/c4/components/`.
- [ ] Flyway V1 tạo đủ 8 bảng ở mục 4; `ApplicationStartsTest` xanh với Testcontainers.
- [ ] 10 endpoint ở mục 5 có integration test cho trường hợp đúng, sai quyền và sai dữ liệu.
- [ ] Test đồng thời: 100 thread mua 10 sản phẩm → đúng 10 đơn CREATED, tồn kho 0, 90 request nhận 409 `sold-out`; xanh 10 lần liên tiếp.
- [ ] Retry cùng `Idempotency-Key` trả về đúng response cũ; khác body trả 422; đang xử lý trả 409.
- [ ] Đơn quá 5 phút chưa thanh toán tự chuyển CANCELLED và hoàn kho đúng 1 lần, kể cả khi webhook thanh toán đến cùng lúc.
- [ ] Mọi endpoint có test authorization: không token → 401, sai role → 403, đơn của người khác → 404.
- [ ] Coverage luồng đặt hàng (package `order`, `inventory`) trên 80% theo JaCoCo.
- [ ] `docs/security/attack-log-1.md` có 6 kịch bản, kết quả và commit fix.
- [ ] `docs/perf/baseline-v1.md` ghi latency và số lần xung đột ở 100 request đồng thời.
- [ ] README cập nhật cách chạy, cách lấy token từ Keycloak, cách chạy test đồng thời; dòng giai đoạn 1 ở tab chính đổi sang Hoàn thành.

## 2. Lịch 4 tuần theo buổi

16 buổi, mỗi buổi 2–2,5 giờ, tổng khoảng 36 giờ; tuần 3 dựng nền, tuần 4 làm đặt hàng đúng, tuần 5 làm thanh toán và hết hạn, tuần 6 tấn công và chốt.

| Buổi | Tuần | Việc | Đầu ra |
| --- | --- | --- | --- |
| 1 | 3 | Flyway V1 với 8 bảng; entity và repository cho `catalog`, `inventory` | Migration chạy trên Testcontainers |
| 2 | 3 | Khung 5 module, package `shared.events`, `@NamedInterface`; `ModularityTests` xanh | Sơ đồ module từ `Documenter` |
| 3 | 3 | Keycloak realm (2 role, 2 client, 3 user), Spring Security 7 resource server, kiểm tra iss/aud/exp | `curl` với token thật trả 200/401/403 |
| 4 | 3 | Admin API: tạo, mở, đóng đợt flash sale; test cho từng trạng thái | 3 endpoint admin xanh |
| 5 | 4 | Đặt hàng happy path: kiểm tra đợt đang mở, giữ kho bằng optimistic locking, tạo đơn CREATED | 1 endpoint đặt hàng xanh |
| 6 | 4 | Idempotency-Key: filter, bảng `idempotency_key`, 3 trường hợp (trùng, khác body, đang xử lý) | Test idempotency xanh |
| 7 | 4 | Bean Validation, Problem Details theo RFC 9457, danh mục lỗi ở mục 5.3 | Mọi lỗi trả JSON chuẩn, không stack trace |
| 8 | 4 | Test đồng thời 100 thread; retry với backoff và jitter; ghi baseline | `docs/perf/baseline-v1.md` |
| 9 | 5 | Payment mock (`PaymentGateway` interface, mock thành công/thất bại theo cấu hình), endpoint pay, state machine đơn | CREATED → PAID → CONFIRMED chạy đúng |
| 10 | 5 | Scheduler hết hạn giữ đơn; hoàn kho qua event `OrderCancelled`; test race giữa hết hạn và thanh toán | Hoàn kho đúng 1 lần trong mọi thứ tự |
| 11 | 5 | Notification module nghe `OrderPaid`, `OrderCancelled` bằng `@ApplicationModuleListener`; bảng `event_publication` | Log thông báo, event không mất khi listener lỗi |
| 12 | 5 | Authorization theo ownership; endpoint xem và hủy đơn; test authorization cho cả 10 endpoint | Bảng ma trận quyền xanh |
| 13 | 6 | CodeQL vào CI, repo chuyển public; security headers; buổi tấn công 1: IDOR, mass assignment, JWT alg/aud | 3 dòng đầu của attack log |
| 14 | 6 | Buổi tấn công 2: replay đơn, lạm dụng idempotency, race bằng Turbo Intruder; fix và test hồi quy | 3 dòng sau của attack log |
| 15 | 6 | JaCoCo, dọn test, C4 Component từ `Documenter`, README | Coverage trên 80% |
| 16 | 6 | Rà Definition of Done, cập nhật ADR nếu quyết định thay đổi, tag | Tag `v1-monolith` |

Buổi 8 và 10 là hai buổi dễ trượt sang buổi sau nhất; nếu trượt, cắt buổi 15 xuống 1 giờ chứ không bỏ buổi 13–14.

## 3. Thiết kế module (Spring Modulith)

Năm module nghiệp vụ cộng một module `shared` chứa event và hạ tầng chung; chỉ `order` được gọi module khác, các module còn lại chỉ nói chuyện qua event, và `ModularityTests` là thứ giữ quy tắc này.

**3.1. Trách nhiệm và API public**

| Module (package `vn.flashsale.*`) | Trách nhiệm | API public (`@NamedInterface` hoặc class ở package gốc) | Bảng sở hữu |
| --- | --- | --- | --- |
| `catalog` | Sản phẩm và đợt flash sale: tạo, mở, đóng, đọc | `FlashSales.get(id)`, `FlashSales.isOpen(id, now)`, `FlashSales.priceOf(id)` | `product`, `flash_sale` |
| `inventory` | Tồn kho theo đợt: giữ, hoàn, đối chiếu | `Inventory.reserve(flashSaleId, qty)` ném `SoldOutException`; `Inventory.available(flashSaleId)` | `inventory` |
| `order` | Vòng đời đơn: tạo, thanh toán, hết hạn, hủy; idempotency | `Orders.place(cmd)`, `Orders.pay(orderId, userId)`, `Orders.get(orderId, userId)` | `orders`, `idempotency_key` |
| `payment` | Gọi cổng thanh toán (mock ở giai đoạn 1), lưu kết quả | `PaymentGateway.charge(orderId, amount)` trả `PaymentResult` | `payment` |
| `notification` | Thông báo cho khách (giai đoạn 1: ghi log có cấu trúc) | Không có API public; chỉ nghe event | — |
| `shared` | Event record, `AuditLog`, security config, Problem Details handler, `Clock` bean | `shared.events.*`, `shared.audit.AuditLog` | `audit_log`, `event_publication` |

**3.2. Quy tắc phụ thuộc**

| Từ | Được gọi trực tiếp | Được nghe event của | Cấm |
| --- | --- | --- | --- |
| `order` | `catalog`, `inventory`, `payment`, `shared` | — | Đọc bảng của module khác |
| `inventory` | `shared` | `order` (qua `shared.events`) | Gọi `order` |
| `catalog` | `shared` | — | Mọi module khác |
| `payment` | `shared` | — | Gọi `order` (order gọi payment, không ngược lại) |
| `notification` | `shared` | `order` | Gọi bất kỳ module nào |

Event đặt trong `shared.events` để `inventory` và `notification` nghe được mà không phụ thuộc vào `order`; nếu đặt event trong `order`, sẽ tạo vòng `order → inventory → order` và `ModularityTests` sẽ đỏ.

**3.3. Event nội bộ (record trong `shared.events`)**

| Event | Ai phát | Ai nghe | Khi nào |
| --- | --- | --- | --- |
| `OrderPlaced(orderId, flashSaleId, userId, qty, expiresAt)` | `order` | `notification` (giai đoạn 1 chỉ log) | Sau khi giữ kho và ghi đơn thành công |
| `OrderPaid(orderId, userId, amountCents)` | `order` | `notification` | Sau khi payment trả thành công |
| `OrderCancelled(orderId, flashSaleId, qty, reason)` | `order` | `inventory` (hoàn kho), `notification` | Hết hạn, thanh toán thất bại, admin hủy |

Listener dùng `@ApplicationModuleListener` (bất đồng bộ, chạy sau commit, ghi vào bảng `event_publication` để không mất khi listener lỗi); đây là bước đệm tự nhiên sang outbox ở giai đoạn 3.

**3.4. Cấu trúc package mẫu cho `order`**

```
order/
├── Orders.java                 # API public: interface, class ở package gốc là public API của module
├── OrderController.java
├── PlaceOrderCommand.java
├── internal/
│   ├── Order.java              # aggregate, có @Version
│   ├── OrderStatus.java
│   ├── OrderRepository.java
│   ├── OrderService.java       # transaction boundary
│   ├── OrderExpiryJob.java
│   └── IdempotencyFilter.java, IdempotencyKeyRepository.java
└── package-info.java           # @ApplicationModule(allowedDependencies = {"catalog", "inventory", "payment", "shared"})
```

Mọi thứ trong `internal` là riêng của module; Spring Modulith coi package con là internal mặc định, nên chỉ cần giữ API public ở package gốc.

## 4. Domain model, vòng đời đơn hàng và schema V1

Ba aggregate có bất biến rõ ràng; mọi quy tắc đúng đắn của giai đoạn này quy về việc giữ ba bất biến đó dưới đồng thời.

**4.1. Aggregate và bất biến**

| Aggregate | Thuộc tính chính | Bất biến | Cơ chế giữ |
| --- | --- | --- | --- |
| `FlashSale` (catalog) | product, priceCents, initialQty, startsAt, endsAt, status SCHEDULED/OPEN/CLOSED | Không sửa giá và số lượng sau khi OPEN; chỉ nhận đơn khi OPEN và trong khung giờ | Kiểm tra trạng thái trong `FlashSales.isOpen`, `Clock` inject được để test |
| `Inventory` (inventory) | flashSaleId, available, version | `available >= 0` luôn đúng; tổng đã giữ + available = initialQty | `@Version` + `CHECK (available >= 0)` ở DB là lưới an toàn cuối |
| `Order` (order) | flashSaleId, userId, qty (1–2), amountCents, status, expiresAt, version | Mỗi chuyển trạng thái chỉ đi theo sơ đồ bên dưới; mỗi user tối đa 1 đơn chưa hủy cho mỗi đợt | Method `pay()`, `confirm()`, `cancel(reason)` ném `IllegalStateException` khi sai trạng thái; unique index `(flash_sale_id, user_id) WHERE status <> 'CANCELLED'` |

**4.2. Vòng đời đơn hàng**

&#91;embedded content: vòng đời đơn hàng · 4 trạng thái, 1 nhánh hủy\]

Ở giai đoạn 1, PAID sang CONFIRMED xảy ra ngay trong cùng transaction vì kho đã giữ lúc đặt hàng; giai đoạn 3 sẽ tách bước này thành event qua Kafka. CANCELLED là trạng thái cuối; admin hủy đơn đã PAID (hoàn tiền) nằm ngoài phạm vi.

**4.3. Schema Flyway V1 (`db/migration/V1__baseline.sql`, trích phần quan trọng)**

```sql
CREATE TABLE product (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  description text,
  image_url   text
);

CREATE TABLE flash_sale (
  id          uuid PRIMARY KEY,
  product_id  uuid NOT NULL REFERENCES product(id),
  price_cents bigint NOT NULL CHECK (price_cents > 0),
  initial_qty int NOT NULL CHECK (initial_qty > 0),
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL CHECK (ends_at > starts_at),
  status      text NOT NULL CHECK (status IN ('SCHEDULED','OPEN','CLOSED'))
);

CREATE TABLE inventory (
  flash_sale_id uuid PRIMARY KEY REFERENCES flash_sale(id),
  available     int NOT NULL CHECK (available >= 0),
  version       bigint NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id            uuid PRIMARY KEY,           -- UUIDv7, không đoán được, sắp xếp theo thời gian
  flash_sale_id uuid NOT NULL REFERENCES flash_sale(id),
  user_id       text NOT NULL,              -- claim sub của JWT
  qty           smallint NOT NULL CHECK (qty BETWEEN 1 AND 2),
  amount_cents  bigint NOT NULL,
  status        text NOT NULL CHECK (status IN ('CREATED','PAID','CONFIRMED','CANCELLED')),
  cancel_reason text,
  created_at    timestamptz NOT NULL,
  expires_at    timestamptz NOT NULL,
  version       bigint NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_orders_one_active_per_user
  ON orders (flash_sale_id, user_id) WHERE status <> 'CANCELLED';
CREATE INDEX ix_orders_expiry ON orders (expires_at) WHERE status = 'CREATED';
CREATE INDEX ix_orders_user ON orders (user_id, created_at DESC);

CREATE TABLE payment (
  id           uuid PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES orders(id),
  status       text NOT NULL CHECK (status IN ('SUCCESS','FAILED')),
  provider_ref text,
  created_at   timestamptz NOT NULL
);

CREATE TABLE idempotency_key (
  user_id         text NOT NULL,
  key             uuid NOT NULL,
  request_hash    text NOT NULL,            -- SHA-256 của method + path + body
  state           text NOT NULL CHECK (state IN ('IN_PROGRESS','DONE')),
  response_status int,
  response_body   jsonb,
  created_at      timestamptz NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE INDEX ix_idem_created ON idempotency_key (created_at);   -- job xóa sau 24 giờ

CREATE TABLE audit_log (
  id        bigserial PRIMARY KEY,
  actor     text NOT NULL,
  action    text NOT NULL,
  target    text NOT NULL,
  detail    jsonb,
  trace_id  text,
  at        timestamptz NOT NULL
);

-- event_publication: chép DDL từ schema-postgresql.sql của spring-modulith-events-jdbc
-- và tắt spring.modulith.events.jdbc.schema-initialization để Flyway là nơi duy nhất quản lý schema.
```

Hai ràng buộc ở DB (`CHECK (available >= 0)` và unique index một đơn mỗi user) là lưới an toàn: nếu code sai, DB từ chối thay vì oversell. Test đồng thời ở mục 8 cố ý chạy một lần với ràng buộc bị tắt để thấy lớp ứng dụng tự giữ đúng.

## 5. Hợp đồng API

10 endpoint, mô tả bằng OpenAPI trong `src/main/resources/openapi.yaml` (viết tay, không sinh từ code) để giai đoạn 3 làm contract test và giai đoạn 4 fuzz bằng schemathesis.

**5.1. Endpoint**

| # | Method và path | Role | Request | Response thành công | Lỗi có thể gặp |
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api/admin/flash-sales` | admin | productId, priceCents, initialQty, startsAt, endsAt | 201, body FlashSale | 400, 401, 403 |
| 2 | `POST /api/admin/flash-sales/{id}/open` | admin | — | 200 | 401, 403, 404, 409 `invalid-state` |
| 3 | `POST /api/admin/flash-sales/{id}/close` | admin | — | 200 | 401, 403, 404, 409 `invalid-state` |
| 4 | `GET /api/admin/flash-sales/{id}/report` | admin | — | 200, tổng đơn theo trạng thái, tồn kho | 401, 403, 404 |
| 5 | `GET /api/flash-sales/{id}` | customer | — | 200, sản phẩm, giá, giờ, `availableApprox` | 401, 404 |
| 6 | `POST /api/orders` | customer | header `Idempotency-Key` (UUID); body flashSaleId, qty | 201, body Order, `Location` | 400, 401, 404, 409 `sold-out`, 409 `sale-not-open`, 409 `already-ordered`, 409 `idempotency-in-progress`, 422 `idempotency-mismatch` |
| 7 | `GET /api/orders/{id}` | customer (chủ đơn) | — | 200, body Order | 401, 404 (kể cả đơn người khác) |
| 8 | `GET /api/orders?mine=true` | customer | — | 200, danh sách đơn của mình | 401 |
| 9 | `POST /api/orders/{id}/pay` | customer (chủ đơn) | header `Idempotency-Key`; body paymentMethodToken (tok\_success, tok\_declined, tok\_timeout) | 200, body Order ở PAID hoặc CONFIRMED | 401, 404, 409 `invalid-state`, 409 `order-expired`, 402 `payment-declined` |
| 10 | `POST /api/admin/orders/{id}/cancel` | admin | reason | 200, body Order CANCELLED | 401, 403, 404, 409 `invalid-state` |

Đơn của người khác trả 404 chứ không 403 để không xác nhận ID tồn tại; `availableApprox` ở endpoint 5 làm tròn xuống bội số của 10 để không lộ tồn kho chính xác theo thời gian thực (abuse case AC-01).

**5.2. Ngữ nghĩa `Idempotency-Key` (endpoint 6 và 9)**

| Tình huống | Điều kiện | Kết quả |
| --- | --- | --- |
| Lần đầu | Chưa có bản ghi `(user_id, key)` | Ghi bản ghi IN\_PROGRESS, xử lý, lưu status + body, chuyển DONE |
| Retry đúng | Có bản ghi DONE, `request_hash` khớp | Trả lại đúng status và body đã lưu, không xử lý lại |
| Dùng lại key cho body khác | Có bản ghi, `request_hash` khác | 422 `idempotency-mismatch` |
| Hai request cùng key đến cùng lúc | Có bản ghi IN\_PROGRESS | 409 `idempotency-in-progress`, kèm `Retry-After: 1` |
| Thiếu header | — | 400 `idempotency-key-required` |
| Key của user khác | Bản ghi thuộc user khác | Coi như lần đầu (key có scope theo user) |

Bản ghi giữ 24 giờ rồi xóa bằng job; `request_hash` = SHA-256 của method, path và body đã chuẩn hóa. Cách làm bám theo Internet-Draft `draft-ietf-httpapi-idempotency-key-header` của IETF HTTP API WG.

**5.3. Định dạng lỗi (RFC 9457 Problem Details)**

```json
{
  "type": "https://flashsale.example/problems/sold-out",
  "title": "Sản phẩm đã hết",
  "status": 409,
  "detail": "Đợt 0192f1a2-... đã hết hàng lúc 10:00:07",
  "instance": "/api/orders",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

Danh mục `type` cố định: `validation-error`, `sale-not-open`, `sold-out`, `already-ordered`, `invalid-state`, `order-expired`, `payment-declined`, `idempotency-key-required`, `idempotency-in-progress`, `idempotency-mismatch`, `not-found`. `detail` không bao giờ chứa stack trace, tên class hay câu SQL; `@ControllerAdvice` trong `shared` là nơi duy nhất tạo Problem Details.

**5.4. Ma trận quyền (test ở buổi 12 phải phủ hết)**

| Endpoint | Không token | customer | customer khác chủ đơn | admin |
| --- | --- | --- | --- | --- |
| 1–4 admin | 401 | 403 | 403 | 200/201 |
| 5 xem đợt | 401 | 200 | 200 | 200 |
| 6 đặt hàng | 401 | 201 | 201 | 403 (admin không mua) |
| 7, 9 đơn cụ thể | 401 | 200 | 404 | 404 (admin dùng endpoint 10) |
| 8 đơn của mình | 401 | 200 | 200 (chỉ thấy đơn mình) | 403 |
| 10 admin hủy | 401 | 403 | 403 | 200 |

## 6. Luồng đặt hàng và xử lý đồng thời

Một request đặt hàng đi qua 6 bước trong đúng một transaction PostgreSQL; tính đúng đắn dựa vào optimistic locking trên `inventory` và unique index trên `orders`, còn retry nằm ngoài transaction.

**6.1. Các bước của `Orders.place(cmd)`**

1. `IdempotencyFilter` (ngoài transaction): tìm `(user_id, key)`; theo bảng ở mục 5.2, hoặc trả response cũ, hoặc ghi IN\_PROGRESS rồi cho đi tiếp.
2. Kiểm tra `FlashSales.isOpen(flashSaleId, clock.now())`; sai thì 409 `sale-not-open`.
3. `Inventory.reserve(flashSaleId, qty)`: đọc dòng `inventory`, nếu `available < qty` ném `SoldOutException`; ngược lại `available -= qty` và `save()`; JPA thêm `WHERE version = ?` vào UPDATE.
4. Tạo `Order` ở CREATED với `expiresAt = now + 5 phút`, `amountCents = price × qty`; INSERT có thể vấp unique index → 409 `already-ordered`.
5. Ghi `audit_log` và đăng ký event `OrderPlaced` (Modulith ghi vào `event_publication` cùng transaction).
6. Commit. Sau commit, filter lưu status và body vào `idempotency_key`, chuyển DONE; listener bất đồng bộ chạy.

Nếu bước 3 vấp `ObjectOptimisticLockingFailureException`, transaction rollback và `OrderService` retry toàn bộ từ bước 2, tối đa 3 lần, chờ 5–20 ms ngẫu nhiên giữa các lần; hết 3 lần thì 409 `sold-out` (với 100 request tranh 10 sản phẩm, thực tế phần lớn request thua sẽ thua ở bước 3 ngay lần đầu vì `available` đã về 0).

**6.2. Vì sao optimistic thay vì pessimistic ở giai đoạn 1**

| Tiêu chí | Optimistic (`@Version`) | Pessimistic (`SELECT ... FOR UPDATE`) |
| --- | --- | --- |
| Đúng đắn | Đúng, nhờ `WHERE version = ?` | Đúng, nhờ row lock |
| Hành vi dưới 100 request | Nhiều rollback và retry, đo được số lần xung đột | Request xếp hàng chờ lock, latency tăng đều |
| Giá trị học | Thấy rõ tại sao DB không phải nơi trừ kho ở 2.500 request/giây | Ít bài học hơn, dễ che giấu vấn đề |
| Giai đoạn 2 | Baseline để so sánh với Lua script trên Redis | — |

Chọn optimistic và ghi số lần xung đột vào `docs/perf/baseline-v1.md`; buổi 8 chạy thêm một lần với pessimistic (đổi 1 annotation) để có hai baseline. Nếu test đồng thời cho ít hơn 10 đơn thành công vì hết retry, tăng số lần retry chứ không đổi cơ chế; đó chính là số liệu cần ghi lại.

**6.3. Hết hạn giữ đơn (`OrderExpiryJob`)**

- Chạy mỗi 10 giây bằng `@Scheduled`, dùng `ShedLock` để chỉ một instance chạy (chuẩn bị cho giai đoạn 4).
- Query `SELECT id FROM orders WHERE status = 'CREATED' AND expires_at < now() LIMIT 100` (dùng index `ix_orders_expiry`), rồi xử lý từng đơn trong transaction riêng: `order.cancel(EXPIRED)` → đăng ký `OrderCancelled`.
- `inventory` nghe `OrderCancelled` và cộng lại `qty`; listener idempotent nhờ bảng `event_publication` chỉ đánh dấu hoàn thành khi listener trả về thành công.
- Race với thanh toán: nếu `pay()` và `cancel()` chạy cùng lúc trên một đơn, `@Version` trên `orders` làm một bên thất bại; bên thua đọc lại trạng thái và trả 409 `order-expired` (nếu thua là pay) hoặc bỏ qua (nếu thua là expiry). Test ở mục 8.3 ép tình huống này bằng `Clock` cố định.

**6.4. Thanh toán (`Orders.pay`)**

1. Filter idempotency như đặt hàng.
2. Tải đơn của đúng user (không tìm thấy → 404); `order.status` phải là CREATED và chưa quá `expiresAt`, sai thì 409.
3. Gọi `PaymentGateway.charge(orderId, amountCents, paymentMethodToken)`; mock trả SUCCESS với `tok_success`, FAILED với `tok_declined`, chờ 3 giây rồi ném `PaymentTimeoutException` với `tok_timeout` (giai đoạn 1 ánh xạ thành 402 `payment-declined`; giai đoạn 3 dùng cho chaos test), token khác → 400 `validation-error`.
4. SUCCESS: lưu `payment`, `order.pay()` rồi `order.confirm()`, đăng ký `OrderPaid`. FAILED: `order.cancel(PAYMENT_FAILED)`, đăng ký `OrderCancelled`, trả 402.
5. Cả 4 bước trong một transaction; cuộc gọi gateway ở giai đoạn 1 là in-process nên chấp nhận nằm trong transaction, giai đoạn 3 sẽ tách ra vì gọi mạng trong transaction là anti-pattern.

**6.5. Ranh giới transaction và những gì không được làm**

- `@Transactional` chỉ đặt ở `OrderService`, không ở controller, không ở repository.
- Không gọi HTTP hay gửi email trong transaction (giai đoạn 1 chưa có, nhưng ghi thành quy tắc trong `docs/adr` khi tới giai đoạn 3).
- Không dùng `synchronized` hay lock trong JVM để "sửa" race condition: sẽ sai ngay khi có 2 instance ở giai đoạn 4.

## 7. Security giai đoạn 1

Giai đoạn 1 khép lại 6 dòng của threat model v0 (JWT, BOLA, mass assignment, replay, SQL injection, audit) và mở nhật ký tấn công đầu tiên; mọi biện pháp đều có test hồi quy để không bị phá ở giai đoạn sau.

**7.1. Keycloak realm `flashsale` (`keycloak/realm-flashsale.json`)**

| Thành phần | Cấu hình |
| --- | --- |
| Realm roles | `customer`, `admin` |
| Client `flashsale-web` | Public, Standard Flow, PKCE S256 bắt buộc, redirect URI chỉ `http://localhost:3000/*`; định nghĩa sẵn để thiết kế đúng dù chưa có UI |
| Client `flashsale-cli` | Public, chỉ bật Direct Access Grants (password grant) để k6 và HTTP client lấy token; **chỉ tồn tại trong realm dev**, không đưa lên môi trường ở giai đoạn 4 |
| Client `flashsale-api` | Không dùng để đăng nhập; tồn tại để làm giá trị `aud` qua Audience Mapper gắn vào cả `flashsale-web` và `flashsale-cli` |
| Mapper | Realm roles → claim `roles` (mảng), không dùng `realm_access` lồng nhau để `JwtAuthenticationConverter` đơn giản |
| Token | Access token 5 phút, refresh 30 phút, ký RS256; JWKS tại `/realms/flashsale/protocol/openid-connect/certs` |
| User mẫu | `alice` và `bob` (customer), `carol` (admin, bật OTP) — mật khẩu chỉ trong realm import, nằm trong allowlist gitleaks |

**7.2. Spring Security 7 resource server (`shared/security/SecurityConfig.java`, trích)**

```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                       // API stateless dùng Bearer, không cookie
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers("/api/admin/**").hasRole("admin")
            .requestMatchers(HttpMethod.POST, "/api/orders/**").hasRole("customer")
            .requestMatchers("/api/**").authenticated()
            .anyRequest().denyAll())
        .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(rolesConverter())))
        .headers(h -> h
            .contentSecurityPolicy(c -> c.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
            .referrerPolicy(r -> r.policy(NO_REFERRER)))
        .build();
}

@Bean
JwtDecoder jwtDecoder(@Value("${flashsale.security.issuer}") String issuer) {
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);   // JWKS + kiểm tra iss
    OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>(
        "aud", aud -> aud != null && aud.contains("flashsale-api"));
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer(issuer), audience));
    return decoder;
}
```

`JwtValidators.createDefaultWithIssuer` đã kiểm tra `exp`, `nbf`, `iss`; thêm `aud` bằng tay vì Spring không bật mặc định. Thuật toán ký lấy từ JWKS nên token `alg: none` hoặc HS256 ký bằng public key bị từ chối; test ở buổi 13 xác nhận điều này.

**7.3. Authorization theo ownership**

- Mọi query đơn hàng đi qua `OrderRepository.findByIdAndUserId(id, userId)`; không có method `findById` public trong module `order`.
- `userId` lấy từ `jwt.getSubject()` trong controller, không nhận từ body hay query string.
- Admin không dùng endpoint của customer; endpoint 10 là đường riêng, có `audit_log` với `actor = sub của admin`.
- ArchUnit rule: class trong `order.internal` không được gọi `JpaRepository.findById` trực tiếp, buộc đi qua method có `userId`.

**7.4. Validation và lộ thông tin**

- DTO input là record riêng (`PlaceOrderRequest(UUID flashSaleId, @Min(1) @Max(2) int qty)`); entity không bao giờ là tham số controller, nên không có mass assignment.
- `@ControllerAdvice` trong `shared` ánh xạ: `MethodArgumentNotValidException` → 400 `validation-error` (liệt kê field), `EntityNotFound` và `AccessDenied` trên đơn → 404 `not-found`, mọi exception khác → 500 `internal-error` với `traceId` và **không** `detail`.
- Log request chỉ ghi method, path, status, latency, `sub`; không ghi header `Authorization`, không ghi body.

**7.5. CI: CodeQL**

```yaml
# .github/workflows/codeql.yml
name: codeql
on:
  push: { branches: [main] }
  pull_request:
  schedule: [{ cron: '0 2 * * 1' }]
permissions: { security-events: write, contents: read }
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '25' }
      - uses: github/codeql-action/init@v3
        with: { languages: java-kotlin, queries: security-extended }
      - run: ./gradlew build -x test
      - uses: github/codeql-action/analyze@v3
```

Repo để public nên CodeQL miễn phí và kết quả hiện trong tab Security của GitHub; bật thêm Dependabot alerts và OpenSSF Scorecard cùng lúc. Chặn merge khi có finding mức High trở lên bằng branch protection. Nếu Java 25 chưa được CodeQL hỗ trợ tại thời điểm làm, tạm build bằng toolchain 21 riêng cho job này và ghi vào nhật ký.

**7.6. Hai buổi tự tấn công (buổi 13 và 14) — `docs/security/attack-log-1.md`**

| # | Kịch bản | Cách thử | Kết quả kỳ vọng | Test hồi quy |
| --- | --- | --- | --- | --- |
| 1 | BOLA: đọc đơn của bob bằng token alice | `GET /api/orders/{id của bob}` | 404 | `OrderAuthorizationTest` |
| 2 | Mass assignment: gửi `amountCents: 1` và `status: PAID` trong body đặt hàng | Burp Repeater | 201 nhưng giá và trạng thái lấy từ server; field lạ bị bỏ qua hoặc 400 | `PlaceOrderValidationTest` |
| 3 | JWT: `alg: none`; HS256 ký bằng public key của Keycloak; token thiếu `aud`; token hết hạn | jwt\_tool | 401 cả 4 trường hợp | `JwtValidationTest` với token tự ký |
| 4 | Replay: gửi lại y nguyên request đặt hàng 20 lần | Turbo Intruder | 1 đơn, 19 lần trả lại response cũ | `IdempotencyTest` |
| 5 | Lạm dụng idempotency: cùng key, đổi `qty` 1 → 2; cùng key từ user khác | Repeater | 422; và user khác được coi là lần đầu | `IdempotencyTest` |
| 6 | Race: 30 request đặt hàng cùng user, cùng đợt, key khác nhau, gửi bằng single-packet attack | Turbo Intruder | Đúng 1 đơn CREATED nhờ unique index; 29 request 409 `already-ordered` | `ConcurrentSameUserTest` |
| 7 | SQL injection ở `id` và query param `mine` | sqlmap ở mức nhẹ | 400 hoặc 404, không 500 | Semgrep + test 400 |
| 8 | Lộ thông tin: gây lỗi 500 cố ý, đọc body và log | Repeater | Không stack trace, không SQL, có `traceId` | `ProblemDetailsTest` |

Mỗi dòng ghi thêm: ngày thử, commit fix (nếu có), và một câu "bài học". Dòng nào không như kỳ vọng là thành công của buổi tấn công, không phải thất bại của dự án.

## 8. Chiến lược test

Bốn tầng test, mỗi tầng trả lời một câu hỏi khác nhau; test đồng thời là tầng quan trọng nhất của giai đoạn này và là thứ được chạy 10 lần liên tiếp trước khi gắn tag.

**8.1. Test pyramid của giai đoạn 1**

| Tầng | Công cụ | Trả lời câu hỏi | Số lượng ước tính | Thời gian chạy |
| --- | --- | --- | --- | --- |
| Kiến trúc | `ApplicationModules.verify()`, ArchUnit | Module có gọi trộm nhau không? Có gọi `findById` không có userId không? | 4–6 rule | Giây |
| Unit | JUnit 5, AssertJ, `Clock` cố định | State machine của `Order`, tính tiền, hết hạn | 30–40 | Giây |
| Integration | `@SpringBootTest` + Testcontainers PostgreSQL, `MockMvc` hoặc `RestTestClient`, JWT tự ký | Mỗi endpoint đúng/sai quyền/sai dữ liệu; Flyway; Modulith event | 40–60 | 1–2 phút |
| Đồng thời | JUnit + `ExecutorService` + `CountDownLatch`, chạy trên app thật qua HTTP | Tồn kho có đúng dưới tranh chấp không? | 3 kịch bản | 30 giây |

Không mock repository trong integration test; mock duy nhất được phép là `PaymentGateway` (và nó vốn đã là mock). JWT trong test ký bằng key pair sinh lúc chạy, `JwtDecoder` trong profile `test` trỏ vào JWKS giả để không cần Keycloak khi chạy test.

**8.2. Test đồng thời chính (`ConcurrentOrderTest`)**

```java
@Test
void hundredBuyersTenItems() throws Exception {
    UUID sale = seedOpenSale(initialQty = 10);
    int buyers = 100;
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(buyers);
    var statuses = new ConcurrentHashMap<Integer, LongAdder>();

    try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < buyers; i++) {
            String token = tokenFor("user-" + i);           // 100 user khác nhau
            pool.submit(() -> {
                start.await();                              // tất cả bắn cùng lúc
                int status = placeOrder(token, sale, qty = 1, UUID.randomUUID());
                statuses.computeIfAbsent(status, k -> new LongAdder()).increment();
                done.countDown();
                return null;
            });
        }
        start.countDown();
        assertThat(done.await(30, SECONDS)).isTrue();
    }

    assertThat(statuses.get(201).sum()).isEqualTo(10);
    assertThat(statuses.get(409).sum()).isEqualTo(90);
    assertThat(inventoryAvailable(sale)).isZero();
    assertThat(countOrders(sale, CREATED)).isEqualTo(10);
    // baseline: ghi số lần retry từ metric orders.place.retries vào docs/perf/baseline-v1.md
}
```

Ba kịch bản: (a) 100 user tranh 10 sản phẩm như trên; (b) 30 request cùng user, key khác nhau → đúng 1 đơn (unique index); (c) 50 request `pay` cùng đơn với 50 key khác nhau → đúng 1 payment, 49 request 409 `invalid-state`. Số lần lặp đọc từ system property `flashsale.test.repeat`: CI đặt 10 khi push lên `main`, 3 khi chạy PR; local mặc định 1.

**8.3. Test race giữa hết hạn và thanh toán**

- Dùng `MutableClock` inject vào cả `OrderService` và `OrderExpiryJob`.
- Tạo đơn, dịch clock qua `expiresAt` 1 giây, rồi gọi `expiryJob.run()` và `orders.pay()` đồng thời bằng 2 thread với `CountDownLatch`.
- Chấp nhận cả hai kết quả hợp lệ: đơn CANCELLED và pay trả 409 `order-expired`, hoặc đơn CONFIRMED và expiry bỏ qua; **không** chấp nhận: đơn CONFIRMED mà tồn kho đã được hoàn, hoặc đơn CANCELLED mà có bản ghi payment SUCCESS.
- Chạy `@RepeatedTest(50)` vì race chỉ xuất hiện theo xác suất.

**8.4. Test Modulith event**

- `@ApplicationModuleTest` cho `inventory` với `Scenario`: publish `OrderCancelled` → chờ `Inventory.available` tăng đúng `qty`.
- Test listener lỗi: ném exception trong listener của `notification` → bản ghi trong `event_publication` chưa có `completion_date`; gọi `IncompleteEventPublications.resubmitIncompletePublications` → xử lý lại thành công.

**8.5. Coverage và dữ liệu test**

- JaCoCo với ngưỡng 80% line coverage cho package `order` và `inventory`; các package khác không đặt ngưỡng ở giai đoạn 1.
- Dữ liệu test tạo bằng builder (`aFlashSale().open().withQty(10)`), không dùng file SQL cố định, để test không phụ thuộc thứ tự.
- Tắt ràng buộc `CHECK (available >= 0)` trong một test riêng (`@Sql` drop constraint) và chạy lại kịch bản (a): nếu vẫn đúng 10 đơn, lớp ứng dụng tự giữ bất biến, không dựa vào DB.

## 9. Nguồn học cho giai đoạn 1 và câu hỏi mở

Khoảng 8 giờ đọc ngoài 36 giờ làm; ưu tiên tài liệu chính chủ của Spring Modulith và Spring Security vì cả hai đổi nhiều ở thế hệ Boot 4.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1 | Flyway docs; PostgreSQL docs về partial index và `CHECK` | Migration naming, partial unique index | Có |
| 2 | Spring Modulith reference: Fundamentals, Verifying Application Module Structure, Working with Application Events, Testing | Toàn bộ 4 chương, khoảng 2 giờ | Có |
| 3 | Spring Security reference: OAuth2 Resource Server (JWT); Keycloak docs: Audience mapper, PKCE | Cấu hình decoder, validator, converter | Có |
| 5–6 | *Java Concurrency in Practice*, chương 2–3; Spring Data JPA docs về `@Version`; IETF draft Idempotency-Key header | Thread-safety, publication; optimistic locking; ngữ nghĩa idempotency | JCIP không; còn lại có |
| 7 | RFC 9457 Problem Details; Spring Framework docs về `ProblemDetail` và `@ControllerAdvice` | Định dạng lỗi chuẩn | Có |
| 8 | *Optimizing Cloud Native Java* 2nd, chương về đo đạc và benchmark | Cách ghi baseline có ý nghĩa, tránh kết luận sai | Không |
| 10 | Spring Modulith docs: Event Publication Registry; ShedLock README | At-least-once và resubmit | Có |
| 12 | OWASP ASVS V4 Access Control; OWASP API Security Top 10: API1 BOLA, API3 BOPLA | Checklist authorization | Có |
| 13–14 | PortSwigger Web Security Academy: JWT attacks, Access control, Race conditions; jwt\_tool README; Turbo Intruder single-packet attack | Lab tương ứng từng kịch bản tấn công | Có |
| 15 | JaCoCo Gradle plugin; ArchUnit user guide | Ngưỡng coverage, custom rule | Có |

**Quyết định cho các câu hỏi mở** (chốt 26/9/2026, tiêu chí: thực tế và học sâu để ứng dụng được)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | Một đơn chưa hủy mỗi user mỗi đợt, hay nhiều đơn tới tổng 2 sản phẩm? | **Một đơn chưa hủy mỗi user mỗi đợt**, qty 1–2 trong đơn đó | Đúng quy tắc flash sale thật; bất biến gói gọn trong một unique index nên test và tấn công (kịch bản 6) rõ ràng; quy tắc "tổng 2" phải đếm qua nhiều dòng, dễ sai và không dạy thêm gì |
| 2 | Mock payment thất bại theo số tiền hay theo header test? | **Theo `paymentMethodToken` trong body**: `tok_success`, `tok_declined`, `tok_timeout` | Bắt chước cách Stripe và các cổng thật dùng test token; demo và test đọc là hiểu; `tok_timeout` dùng lại cho chaos test giai đoạn 3 |
| 3 | Tự viết retry ở service hay dùng Spring Retry? | **Tự viết ở `OrderService`** ở giai đoạn 1; so sánh với Resilience4j `Retry` ở giai đoạn 4 | Tự viết buộc hiểu rollback, backoff và jitter; giai đoạn 4 thay bằng thư viện là một ADR nhỏ có số liệu |
| 4 | Test đồng thời chạy khi nào trong CI? | **Mọi PR và push lên `main`**; `main` lặp 10 lần, PR lặp 3 lần qua system property | Tính đúng đắn là mục tiêu số một của giai đoạn; 2 phút mỗi lần chạy rẻ hơn một lỗi oversell lọt qua |
| 5 | Semgrep hay CodeQL? | **Repo public, dùng CodeQL** (default setup, miễn phí cho public repo); Semgrep chỉ chạy local qua pre-commit nếu muốn | Repo public là điều kiện để bài viết và portfolio ở giai đoạn 5 có giá trị; CodeQL tích hợp sẵn GitHub, có Dependabot và OpenSSF Scorecard đi kèm |

Các mục 2 (buổi 13), 5.1 (endpoint 9), 6.4, 7.1, 7.5 và 8.2 đã cập nhật theo bảng này.
