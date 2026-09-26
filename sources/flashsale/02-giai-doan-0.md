# Giai đoạn 0 — Thiết kế trước khi code (tài liệu chi tiết)

Sep 26, 2026 · @Nothing

Hai tuần đầu không viết code nghiệp vụ; đầu ra là một repo có yêu cầu đo được, sơ đồ C4, hai ADR, threat model sơ bộ và CI chạy xanh.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 0 tồn tại để mọi quyết định ở 5 giai đoạn sau đều đo được so với một bộ yêu cầu viết ra từ đầu, thay vì tối ưu theo cảm tính.

**Mục tiêu**

- Có bộ NFR bằng số, dùng làm tiêu chí đạt/không đạt cho mỗi tag Git.
- Có sơ đồ C4 mà bất kỳ ai đọc 5 phút cũng hiểu hệ thống gồm gì và nói chuyện với ai.
- Có hai ADR đầu tiên với phương án thay thế và hệ quả, để sau này nhìn lại biết vì sao chọn.
- Có threat model sơ bộ để security đi vào thiết kế chứ không vá sau.
- Có repo với CI chạy xanh, để từ giai đoạn 1 chỉ cần viết code.

**Trong phạm vi:** yêu cầu, ước lượng, C4 Context và Container, ADR-001 và ADR-002, STRIDE sơ bộ, khung repo, CI với build, test, gitleaks, Dependency-Check.

**Ngoài phạm vi:** code nghiệp vụ, schema chi tiết, C4 mức Component (làm ở giai đoạn 1 khi đã có module), threat model đầy đủ (giai đoạn 5), chọn cloud provider (giai đoạn 5).

**Definition of Done (đánh dấu đủ mới gắn tag `v0-design`)**

- [ ] `README.md` nêu bài toán, 5 NFR và cách chạy dự án trong 3 lệnh.
- [ ] `docs/requirements.md` có user story, NFR, abuse cases theo mẫu ở mục 3.
- [ ] `docs/estimation.md` có bảng ước lượng và giả định ở mục 4.
- [ ] `docs/c4/workspace.dsl` render được bằng Structurizr Lite, có 2 view: SystemContext và Container.
- [ ] `docs/adr/0001-modular-monolith.md` và `docs/adr/0002-datastores.md` ở trạng thái Accepted.
- [ ] `docs/security/threat-model-v0.md` có bảng STRIDE theo phần tử DFD ở mục 7.
- [ ] Repo build bằng Java 25, Spring Boot 4.1, có 1 test khởi động context với Testcontainers PostgreSQL.
- [ ] GitHub Actions xanh: build, test, gitleaks, Dependency-Check không có CVE Critical.
- [ ] `docker compose up` chạy được PostgreSQL, Redis, Kafka, Keycloak.
- [ ] Dòng "Giai đoạn 0" trong bảng theo dõi ở tab chính đổi sang Hoàn thành.

## 2. Lịch 2 tuần theo buổi

8 buổi, mỗi buổi 2–2,5 giờ, tổng khoảng 18 giờ; làm đúng thứ tự vì mỗi buổi dùng đầu ra của buổi trước.

| Buổi | Tuần | Việc | Đầu ra | Giờ |
| --- | --- | --- | --- | --- |
| 1 | 1 | Viết user story và NFR; liệt kê abuse cases | `docs/requirements.md` bản đầu | 2,5 |
| 2 | 1 | Ước lượng QPS, dung lượng, băng thông; đối chiếu NFR có khả thi không | `docs/estimation.md` | 2 |
| 3 | 1 | Vẽ C4 Context và Container bằng Structurizr DSL, render bằng Structurizr Lite | `docs/c4/workspace.dsl` + ảnh PNG | 2,5 |
| 4 | 1 | Viết ADR-001 (modular monolith) và ADR-002 (datastore); tự phản biện từng phương án thay thế | 2 ADR ở trạng thái Accepted | 2 |
| 5 | 2 | STRIDE trên từng phần tử của DFD; nối abuse cases với biện pháp và giai đoạn xử lý | `docs/security/threat-model-v0.md` | 2,5 |
| 6 | 2 | Dựng repo: Gradle, Spring Boot 4.1, Modulith, Testcontainers, Docker Compose | Build local xanh, `docker compose up` chạy | 2,5 |
| 7 | 2 | GitHub Actions: build, test, gitleaks, Dependency-Check; pre-commit hook | CI xanh trên `main` | 2 |
| 8 | 2 | Rà lại Definition of Done, viết README, cập nhật bảng theo dõi, gắn tag | Tag `v0-design` | 1,5 |

Nếu chỉ có 1 buổi/tuần, kéo giai đoạn 0 thành 4 tuần nhưng không bỏ buổi nào; buổi 4 và 5 là hai buổi hay bị bỏ qua nhất và cũng là hai buổi dạy nhiều nhất.

## 3. Tài liệu yêu cầu (`docs/requirements.md`)

Bản nháp dưới đây dùng được ngay; phần cần bạn tự chốt được đánh dấu bằng câu hỏi ở mục 9.

**3.1. Bối cảnh và ranh giới**

FlashSale bán một số lượng nhỏ sản phẩm (ví dụ 500) trong một khung giờ ngắn (5–15 phút) cho lượng người mua lớn hơn nhiều lần (10.000). Hệ thống không quản lý vận chuyển, không có giỏ hàng nhiều sản phẩm, không có khuyến mãi phức tạp. Mỗi đơn chỉ có một sản phẩm, số lượng tối đa 2.

**3.2. Tác nhân**

| Tác nhân | Vai trò | Xác thực |
| --- | --- | --- |
| Customer | Xem sản phẩm, lấy token vào flash sale, đặt hàng, xem trạng thái đơn; giai đoạn 0–3 gọi API qua k6 và HTTP client, web/app ngoài phạm vi | Keycloak, role `customer` |
| Admin | Tạo và mở/đóng đợt flash sale, xem báo cáo, hủy đơn | Keycloak, role `admin`, MFA |
| Payment gateway (mock) | Nhận yêu cầu thanh toán, gọi webhook kết quả | Webhook ký HMAC |
| Hệ thống (scheduler) | Mở/đóng đợt theo giờ, thu hồi token hết hạn | Nội bộ |

**3.3. User story (ưu tiên theo MoSCoW)**

| ID | Story | Ưu tiên | Tiêu chí chấp nhận |
| --- | --- | --- | --- |
| US-01 | Là admin, tôi tạo một đợt flash sale với sản phẩm, giá, số lượng, giờ mở và đóng | Must | Đợt ở trạng thái SCHEDULED; không sửa số lượng sau khi mở |
| US-02 | Là customer, tôi xem sản phẩm và thời gian còn lại của đợt | Must | Trả về tồn kho gần đúng (cho phép lệch), không lộ số chính xác theo thời gian thực |
| US-03 | Là customer, tôi lấy token để vào đợt flash sale | Must | Token có hạn 60 giây, gắn user, dùng một lần |
| US-04 | Là customer, tôi đặt hàng với token hợp lệ | Must | Không bao giờ vượt tồn kho; retry cùng Idempotency-Key trả về cùng đơn |
| US-05 | Là customer, tôi thanh toán trong 5 phút, hết hạn thì đơn hủy và hoàn kho | Must | Đơn hết hạn chuyển CANCELLED, tồn kho tăng lại đúng 1 lần |
| US-06 | Là customer, tôi xem trạng thái đơn của mình | Must | Chỉ xem được đơn của chính mình |
| US-07 | Là customer, tôi nhận thông báo khi đơn được xác nhận hoặc hủy | Should | Thông báo gửi ít nhất 1 lần, có thể trùng |
| US-08 | Là admin, tôi xem báo cáo đợt: số đơn, tỷ lệ thanh toán, số bị chặn | Should | Báo cáo trễ tối đa 1 phút |
| US-09 | Là admin, tôi hủy một đơn nghi gian lận | Could | Có audit log ai hủy, lúc nào |

**3.4. NFR bằng số (tiêu chí đạt/không đạt cho các giai đoạn sau)**

| Mã | Thuộc tính | Mục tiêu | Cách đo | Giai đoạn kiểm tra |
| --- | --- | --- | --- | --- |
| NFR-01 | Throughput | 10.000 request đặt hàng/phút, đỉnh 2.500 request/giây tổng các API | k6 spike 60 giây | 2 |
| NFR-02 | Latency | p99 đặt hàng < 300 ms, p99 đọc sản phẩm < 100 ms | k6 + Grafana | 2 |
| NFR-03 | Đúng đắn | 0 oversell, 0 double-charge, 0 mất đơn | Test đối chiếu sau mỗi load test và chaos test | 1, 2, 3 |
| NFR-04 | Khả dụng | 99,9% request đặt hàng thành công trong đợt; payment chết 2 phút vẫn không mất đơn | SLO dashboard, chaos test | 3, 4 |
| NFR-05 | Bảo mật | ASVS mức 2; 0 lỗ hổng High/Critical trong SCA và DAST; mọi abuse case ở mục 3.5 có biện pháp | CI + attack log | Tất cả |
| NFR-06 | Quan sát được | Mọi request có traceId xuyên suốt order → Kafka → payment | Kiểm tra trace trong Tempo | 4 |
| NFR-07 | Khôi phục | RPO 0 cho đơn đã tạo (ghi đồng bộ vào PostgreSQL), RTO 5 phút cho API | Kill pod và đo | 4 |
| NFR-08 | Chi phí | Chạy 1 đợt 10.000 người dưới 5 USD hạ tầng | Ước lượng ở giai đoạn 5 | 5 |

**3.5. Abuse cases (đầu vào cho threat model)**

- AC-01: Bot lấy nhiều token bằng nhiều tài khoản hoặc nhiều thiết bị để mua gom.
- AC-02: Gửi hàng nghìn request đặt hàng cùng lúc trong cùng mili-giây để vượt tồn kho.
- AC-03: Replay request đặt hàng hoặc webhook thanh toán để tạo đơn hoặc xác nhận thanh toán giả.
- AC-04: Sửa giá hoặc số lượng trong body request.
- AC-05: Đọc hoặc hủy đơn của người khác qua ID.
- AC-06: Dùng token của người khác hoặc token đã hết hạn.
- AC-07: Làm chậm hệ thống cho người khác bằng payload lớn hoặc kết nối treo, để mình mua được.
- AC-08: Admin hoặc người có quyền nội bộ sửa tồn kho hoặc hủy đơn đối thủ mà không để lại dấu vết.

Mỗi abuse case sẽ có một dòng trong bảng STRIDE ở mục 7 và một test tấn công tương ứng ở giai đoạn 1–2.

## 4. Ước lượng back-of-the-envelope (`docs/estimation.md`)

Kết luận: NFR khả thi với 2 instance JVM 2 vCPU, 1 PostgreSQL, 1 Redis, 1 Kafka; nút thắt thật là số request đồng thời (khoảng 750), không phải dữ liệu.

**4.1. Giả định (ghi rõ để sau này đo lại)**

| Giả định | Giá trị |
| --- | --- |
| Người tham gia một đợt | 10.000 |
| Sản phẩm mỗi đợt | 500 |
| Thời lượng đợt | 10 phút, 80% traffic dồn vào 60 giây đầu |
| Request mỗi người trong đợt | 3 xem sản phẩm + 1 lấy token + 2 đặt hàng (kể cả retry) + 6 poll trạng thái = 12 |
| Hệ số burst so với trung bình | 1,5 |
| Kích thước request + response trung bình | 2 KB |
| Kích thước bản ghi | order 1 KB, payment 0,5 KB, audit 1 KB, event Kafka 1 KB, bản ghi idempotency 0,3 KB |
| Số đợt mỗi ngày (để tính dung lượng năm) | 20 |
| Latency mục tiêu API đặt hàng | p99 300 ms, trung bình 100 ms |

**4.2. Kết quả tính**

| Đại lượng | Cách tính | Kết quả |
| --- | --- | --- |
| Tổng request trong 60 giây đầu | 10.000 × 12 × 0,8 | 96.000 |
| RPS trung bình 60 giây đầu | 96.000 / 60 | 1.600 |
| RPS đỉnh (thiết kế) | 1.600 × 1,5 | 2.400, làm tròn 2.500 |
| Request đặt hàng trong 60 giây | 10.000 × 2 × 0,8 | 16.000, tức 267/giây; thiết kế 350/giây |
| Request đồng thời tại đỉnh | 2.500 × 0,3 giây (p99) | 750 |
| Redis ops/giây | 350 đặt hàng × 2 lệnh + 1.000 đọc cache | khoảng 1.700, xa mức giới hạn 100.000+ |
| Ghi PostgreSQL/giây | 350 bản ghi idempotency + đơn thành công | dưới 400, an toàn cho một instance |
| Kết nối DB cần | 350 × 0,02 giây (mỗi ghi 20 ms) | 7, pool 20 là đủ |
| Event Kafka mỗi đợt | 500 đơn × 4 event + 15.500 từ chối × 1 event | khoảng 17.500 = 17,5 MB |
| Dung lượng Kafka 7 ngày | 17,5 MB × 20 đợt × 7 ngày | 2,5 GB |
| Dung lượng PostgreSQL 1 năm | 500 đơn × 2,5 KB × 20 đợt × 365 × 1,5 (index) | 14 GB |
| Bản ghi idempotency (TTL 24 giờ) | 16.000 × 0,3 KB × 20 đợt | 96 MB ở trạng thái ổn định |
| Băng thông đỉnh | 2.500 × 2 KB | 5 MB/giây, tức 40 Mbps |
| Dữ liệu truyền mỗi đợt | 120.000 request × 2 KB | 240 MB |

Số request đồng thời tính theo định luật Little:

```latex
L = \lambda \cdot W = 2500 \times 0{,}3 = 750
```

**4.3. Hệ quả cho thiết kế**

- 750 request đồng thời vượt xa 200 thread mặc định của Tomcat, nên giai đoạn 2 phải chọn giữa virtual threads, tăng pool, hay reactive; đây là lý do có mục so sánh virtual threads trong kế hoạch.
- 15.500 trong 16.000 request đặt hàng sẽ bị từ chối vì hết hàng; đường từ chối phải rẻ (trả lời từ Redis, không chạm PostgreSQL), nếu không PostgreSQL sẽ là nút thắt.
- Xem sản phẩm chiếm 1/4 traffic; cache Redis với TTL 1–2 giây là đủ, không cần CDN ở phạm vi dự án.
- Dữ liệu cả năm dưới 20 GB nên không cần sharding; ADR-002 vì thế chọn một PostgreSQL với read replica để dự phòng, không chọn NoSQL.
- Kafka chỉ cần 1 broker cho dự án, nhưng topic nên tạo với 6 partition từ đầu để giai đoạn 3 thử scale consumer.

Các con số này là ước lượng để ra quyết định; giai đoạn 2 sẽ đo lại và ghi chênh lệch vào `docs/perf/report.md`.

## 5. Sơ đồ C4 (`docs/c4/workspace.dsl`)

Một file DSL sinh ra cả hai view; render bằng Structurizr Lite (`docker run -it --rm -p 8080:8080 -v $PWD/docs/c4:/usr/local/structurizr structurizr/lite`) rồi export PNG vào `docs/c4/`.

**5.1. Phần tử ở mức Context**

| Phần tử | Loại | Mô tả |
| --- | --- | --- |
| Customer | Person | Người mua; gọi API qua client (k6, HTTP client); web/app ngoài phạm vi đến hết giai đoạn 3 |
| Admin | Person | Vận hành đợt flash sale |
| FlashSale | Software System | Hệ thống của dự án |
| Keycloak | External System | Định danh và cấp token OIDC |
| Payment Gateway (mock) | External System | Xử lý thanh toán, gọi webhook |
| Observability Stack | External System | Grafana, Tempo, Loki, Prometheus |

**5.2. Container bên trong FlashSale (giai đoạn 0–2 là modular monolith)**

| Container | Công nghệ | Trách nhiệm |
| --- | --- | --- |
| FlashSale API | Spring Boot 4.1, Spring Modulith | Toàn bộ nghiệp vụ; module `catalog`, `inventory`, `order`, `payment`, `notification`; Swagger UI (springdoc) làm giao diện demo |
| PostgreSQL | PostgreSQL 16 | Nguồn sự thật cho đơn, thanh toán, audit |
| Redis | Redis 7 | Tồn kho nóng, token hàng chờ, cache sản phẩm, rate limit |
| Kafka | Kafka 3.x (KRaft) | Event giữa các module, sau này giữa các service |

Không có container Web UI theo quyết định ở mục 9; nếu sau giai đoạn 3 thêm UI, thêm một container và commit lại file DSL.

**5.3. Structurizr DSL**

```
workspace "FlashSale" "Nen tang ban hang flash sale chiu tai cao" {

    model {
        customer = person "Customer" "Nguoi mua, goi API qua client (k6, HTTP client)"
        admin = person "Admin" "Van hanh dot flash sale"

        keycloak = softwareSystem "Keycloak" "Dinh danh, cap token OIDC" "External"
        paymentGateway = softwareSystem "Payment Gateway (mock)" "Xu ly thanh toan, goi webhook" "External"
        observability = softwareSystem "Observability Stack" "Grafana, Tempo, Loki, Prometheus" "External"

        flashsale = softwareSystem "FlashSale" "Ban so luong nho san pham cho luong nguoi mua lon trong thoi gian ngan" {
            api = container "FlashSale API" "Toan bo nghiep vu: catalog, inventory, order, payment, notification" "Spring Boot 4.1, Spring Modulith"
            db = container "PostgreSQL" "Nguon su that: don hang, thanh toan, audit" "PostgreSQL 16" "Database"
            redis = container "Redis" "Ton kho nong, token hang cho, cache, rate limit" "Redis 7" "Database"
            kafka = container "Kafka" "Event giua cac module va service" "Kafka 3.x KRaft" "Queue"
        }

        customer -> keycloak "Lay token" "OIDC (client flashsale-cli, chi realm dev)"
        customer -> api "Goi API" "HTTPS, JSON, JWT"
        admin -> keycloak "Dang nhap, MFA" "OIDC"
        admin -> api "Quan tri dot ban" "HTTPS, admin API"
        api -> keycloak "Lay JWKS de xac minh JWT" "HTTPS"
        api -> db "Doc, ghi" "JDBC, TLS"
        api -> redis "Tru kho atomic, token, cache" "RESP, TLS"
        api -> kafka "Publish, consume event" "SASL/SCRAM, TLS"
        api -> paymentGateway "Tao yeu cau thanh toan" "HTTPS"
        paymentGateway -> api "Webhook ket qua" "HTTPS, HMAC"
        api -> observability "Gui trace, metric, log" "OTLP"
    }

    views {
        systemContext flashsale "SystemContext" {
            include *
            autolayout lr
        }
        container flashsale "Containers" {
            include *
            autolayout lr
        }
        styles {
            element "Person" { shape person; background #08427b; color #ffffff }
            element "External" { background #999999; color #ffffff }
            element "Database" { shape cylinder }
            element "Queue" { shape pipe }
        }
    }
}
```

DSL cố ý không dấu để tránh lỗi font khi export; nội dung tiếng Việt có dấu để trong README. Ở giai đoạn 3, khi tách service, chỉ cần thêm container `order-service` và `payment-service` rồi commit lại file này; lịch sử Git của một file DSL chính là lịch sử kiến trúc.

## 6. ADR-001 và ADR-002 (`docs/adr/`)

Cả hai viết theo mẫu MADR (Markdown Any Decision Records); mỗi ADR bắt buộc có ít nhất 2 phương án bị loại và hệ quả xấu của phương án được chọn.

**ADR-001: Bắt đầu bằng modular monolith với Spring Modulith**

- Trạng thái: Accepted, 2026-10.
- Bối cảnh: một người làm 8–10 giờ/tuần; nghiệp vụ nhỏ nhưng cần ranh giới rõ để giai đoạn 3 tách service mà không viết lại. Chi phí vận hành nhiều service ngay từ đầu (network, deploy, debug) sẽ nuốt hết thời gian học.
- Tiêu chí quyết định: tốc độ đi đến v1 chạy đúng; khả năng tách service sau này; chi phí vận hành local; giá trị học tập.
- Phương án đã cân nhắc:
  1. Monolith truyền thống theo layer (controller, service, repository chung): nhanh nhất nhưng ranh giới mờ, tách sau rất đau.
  2. Modular monolith với Spring Modulith: một deployable, module theo nghiệp vụ, ranh giới được verify bằng test, event nội bộ có thể chuyển sang Kafka sau.
  3. Microservices từ ngày đầu: đúng "đích" nhưng debug phân tán trước khi luồng nghiệp vụ đúng, và không có gì để so sánh khi tách.
- Quyết định: phương án 2. Package gốc `vn.flashsale`, mỗi module một package con (`catalog`, `inventory`, `order`, `payment`, `notification`); module chỉ gọi nhau qua API public của module hoặc qua event; `ApplicationModules.of(App.class).verify()` chạy trong test.
- Tiêu chí để tách một module thành service (dùng ở ADR-006): module có nhịp thay đổi hoặc yêu cầu scale khác hẳn phần còn lại; hoặc cần cô lập lỗi (payment chết không được kéo order chết); hoặc cần ranh giới bảo mật riêng.
- Hệ quả tốt: một process để debug; test integration nhanh; luồng nghiệp vụ đúng trước khi phân tán.
- Hệ quả xấu: dễ "lười" gọi thẳng repository của module khác nếu không verify; scale toàn khối; một lỗi OOM kéo cả hệ thống. Chấp nhận vì giai đoạn 3 sẽ tách.

**ADR-002: PostgreSQL làm nguồn sự thật, Redis cho tồn kho nóng, Kafka cho event**

- Trạng thái: Accepted, 2026-10.
- Bối cảnh: theo ước lượng ở mục 4, dữ liệu cả năm dưới 20 GB, ghi dưới 400/giây, nhưng cần trừ tồn kho atomic ở hàng nghìn request/giây và cần event bền để làm saga.
- Tiêu chí quyết định: tính đúng đắn của giao dịch; throughput trừ kho; độ phổ biến trên thị trường tuyển dụng Việt Nam; chạy được trên laptop.
- Phương án đã cân nhắc cho nguồn sự thật:
  1. PostgreSQL: ACID, `SELECT FOR UPDATE` và optimistic locking đều có, JSONB, logical replication cho Debezium.
  2. MySQL: phổ biến ở Việt Nam không kém, nhưng hỗ trợ CDC và tính năng SQL kém hơn cho mục đích học.
  3. MongoDB: không cần schema linh hoạt, giao dịch đa document phức tạp hơn cho bài toán này.
- Phương án đã cân nhắc cho tồn kho nóng:
  1. Redis với Lua script: atomic, đơn giản, chuẩn ngành cho flash sale.
  2. Hazelcast hoặc cache trong JVM: khó đúng khi có nhiều instance API.
  3. Chỉ dùng PostgreSQL với row lock: đúng nhưng nghẽn ở 15.500 request từ chối mỗi đợt (mục 4.3).
- Phương án đã cân nhắc cho event:
  1. Kafka: log bền, replay, partition để scale consumer, phổ biến ở ngân hàng và thương mại điện tử Việt Nam.
  2. RabbitMQ: đơn giản hơn, nhưng không replay được và ít giá trị học cho SA.
  3. Chỉ dùng Spring Modulith event registry: đủ cho giai đoạn 1–2 nhưng không vượt ra khỏi một process.
- Quyết định: PostgreSQL 16 (một primary, read replica ở giai đoạn 4), Redis 7 (Lua script cho trừ kho, token hàng chờ, cache, rate limit), Kafka 3.x KRaft (6 partition mỗi topic, retention 7 ngày). Giai đoạn 1 chưa dùng Redis cho tồn kho, để có baseline so sánh ở giai đoạn 2.
- Hệ quả tốt: mỗi kho dữ liệu làm đúng việc của nó; toàn bộ stack chạy trong Docker Compose trên laptop 16 GB.
- Hệ quả xấu: ba hệ thống phải giữ nhất quán với nhau (Redis và PostgreSQL có thể lệch, cần cơ chế đối chiếu và sửa); vận hành Kafka phức tạp hơn RabbitMQ. Chấp nhận vì chính sự lệch này là bài học của giai đoạn 2 và 3.

**Mẫu MADR dùng chung cho các ADR sau**

```markdown
# ADR-00X: <Quyết định, viết ở thể khẳng định>

- Trạng thái: Proposed | Accepted | Superseded by ADR-00Y
- Ngày: YYYY-MM-DD

## Bối cảnh và vấn đề
## Tiêu chí quyết định
## Phương án đã cân nhắc
## Quyết định
## Hệ quả (tốt và xấu)
## Cách xác nhận quyết định đúng (test, số liệu, mốc xem lại)
```

## 7. Threat model sơ bộ theo STRIDE (`docs/security/threat-model-v0.md`)

Threat model v0 đi theo từng phần tử và luồng dữ liệu của sơ đồ Container ở mục 5, mỗi dòng nối với một abuse case ở mục 3.5 và một giai đoạn xử lý; bản đầy đủ làm ở giai đoạn 5 khi kiến trúc đã tách service.

**7.1. Phạm vi và ranh giới tin cậy**

- Ranh giới 1: Internet ↔ Web UI/API (mọi thứ từ Customer là không tin cậy).
- Ranh giới 2: API ↔ PostgreSQL, Redis, Kafka (mạng nội bộ, nhưng vẫn xác thực và mã hóa vì giai đoạn 4 chạy trên Kubernetes dùng chung).
- Ranh giới 3: API ↔ Payment Gateway và Keycloak (đối tác bên ngoài, tin cậy có điều kiện qua chữ ký và chứng chỉ).
- Tài sản cần bảo vệ, theo thứ tự: tính đúng của tồn kho và đơn hàng; tiền (không double-charge); dữ liệu cá nhân khách hàng; tính sẵn sàng trong 10 phút của đợt; audit log.

**7.2. Bảng STRIDE theo phần tử**

| Phần tử / luồng | Mối đe dọa | STRIDE | Abuse case | Biện pháp (giai đoạn) | Mức rủi ro |
| --- | --- | --- | --- | --- | --- |
| Customer → API (đặt hàng) | Gửi hàng loạt request đồng thời để vượt kho | Tampering | AC-02 | Optimistic locking (1), Lua atomic trên Redis (2), test đồng thời | Cao |
| Customer → API (đặt hàng) | Replay request tạo nhiều đơn | Tampering, Repudiation | AC-03 | Idempotency-Key gắn user (1), token dùng một lần (2) | Cao |
| Customer → API (đặt hàng) | Sửa giá, số lượng trong body | Tampering | AC-04 | Giá và số lượng đọc từ server; DTO riêng; Bean Validation (1) | Cao |
| Customer → API (xem/hủy đơn) | Truy cập đơn người khác qua ID | Information disclosure | AC-05 | Kiểm tra ownership; UUIDv7; test authorization mọi endpoint (1) | Cao |
| Customer → API (lấy token) | Nhiều tài khoản/thiết bị lấy nhiều token để mua gom | Elevation | AC-01 | Token HMAC gắn user + thiết bị; giới hạn 1 token/user/đợt; proof-of-work hoặc CAPTCHA (2) | Trung bình |
| Customer → API | Dùng token người khác hoặc hết hạn | Spoofing | AC-06 | Token chứa userId, kiểm tra khớp JWT; TTL 60 giây; SETNX khi dùng (2) | Trung bình |
| Customer → API | Payload lớn, kết nối treo, ReDoS | Denial of service | AC-07 | Giới hạn body 16 KB, timeout 5 giây, rate limit, không regex trên input (2, 4) | Trung bình |
| Client ↔ Keycloak (đến giai đoạn 3: client dev, chưa có UI) | Password grant của client dev bị lạm dụng ngoài môi trường dev; sau này: đánh cắp token qua XSS hoặc redirect | Spoofing | — | Client flashsale-cli chỉ tồn tại trong realm dev, không import lên môi trường giai đoạn 4 (1, 4); khi có UI: Authorization Code + PKCE, token trong memory, CSP | Trung bình |
| API ← Keycloak (JWKS) | JWT cấu hình sai: alg none, thiếu aud/iss, token dài hạn | Spoofing | — | Resource server kiểm tra iss, aud, exp, alg; access token 5 phút (1) | Cao |
| API → PostgreSQL | SQL injection; đọc trộm dữ liệu trên đường truyền | Tampering, Information disclosure | — | JPA/JDBC tham số hóa; TLS; user DB tối thiểu quyền (1, 4) | Trung bình |
| API → Redis | Kẻ nội bộ hoặc pod khác sửa tồn kho trực tiếp | Tampering | AC-08 | ACL Redis theo user, TLS, NetworkPolicy; đối chiếu Redis với PostgreSQL định kỳ (2, 4) | Trung bình |
| API ↔ Kafka | Bơm event giả, đọc trộm event có PII | Spoofing, Information disclosure | — | SASL/SCRAM + ACL theo service, TLS, schema validation (3) | Trung bình |
| Payment Gateway → API (webhook) | Webhook giả xác nhận thanh toán; replay webhook cũ | Spoofing, Tampering | AC-03 | HMAC-SHA256, timestamp + nonce, so sánh hằng thời gian (3) | Cao |
| Admin → API | Admin sửa kho hoặc hủy đơn không dấu vết; tài khoản admin bị chiếm | Repudiation, Elevation | AC-08 | Audit log bất biến có userId và traceId; MFA cho admin; admin API tách route (1, 4) | Trung bình |
| Repo, CI, image | Lộ secrets; dependency hoặc image bị cài mã độc | Information disclosure, Tampering | — | gitleaks, Dependency-Check (0); SBOM, Trivy, cosign, Kyverno (4) | Trung bình |
| Observability | Log chứa token, PII | Information disclosure | — | Mask ở logback; không log body request (4) | Thấp |

**7.3. Rủi ro chấp nhận ở v0 (xem lại ở giai đoạn 5)**

- Chưa có WAF và chống DDoS ở tầng mạng; phạm vi dự án dừng ở rate limit tầng ứng dụng.
- Chưa mã hóa dữ liệu cá nhân tại chỗ (at rest) trong PostgreSQL; sẽ đánh giá lại khi làm SAD.
- Chưa có cơ chế phát hiện gian lận dựa trên hành vi; chỉ có giới hạn số lượng và token.

**7.4. Cách làm buổi 5**

1. Mở OWASP Threat Dragon, vẽ lại DFD từ sơ đồ Container, đánh dấu 3 ranh giới tin cậy.
2. Với mỗi phần tử, đi qua 6 chữ cái STRIDE và hỏi "kẻ tấn công ở ranh giới này làm được gì"; ghi cả những dòng không có mối đe dọa.
3. Nối mỗi dòng với abuse case và giai đoạn xử lý; dòng nào không có giai đoạn nào nhận thì đưa vào mục 7.3.
4. Commit file `.json` của Threat Dragon cạnh file markdown để giai đoạn 5 cập nhật thay vì vẽ lại.

## 8. Khung repo, build và CI

Repo `flashsale` sinh từ start.spring.io (Gradle Kotlin DSL, Java 25, Spring Boot 4.1.x, dependency: Web, Validation, Data JPA, PostgreSQL Driver, Data Redis, Kafka, Security, OAuth2 Resource Server, Actuator, Modulith, Testcontainers, Flyway); tên starter kiểm tra lại trên Initializr vì Boot 4 đổi tên một số starter.

**8.1. Cấu trúc thư mục**

```
flashsale/
├── README.md
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/libs.versions.toml          # version catalog: pin mọi version ở một chỗ
├── compose.yaml                       # PostgreSQL, Redis, Kafka, Keycloak
├── .github/workflows/ci.yml
├── .gitleaks.toml
├── .pre-commit-config.yaml            # gitleaks + spotless trước khi commit
├── docs/
│   ├── requirements.md
│   ├── estimation.md
│   ├── c4/workspace.dsl
│   ├── adr/0001-modular-monolith.md
│   ├── adr/0002-datastores.md
│   ├── security/threat-model-v0.md
│   └── perf/                          # giai đoạn 2
├── keycloak/realm-flashsale.json      # realm import: 2 role, 2 client, 3 user mẫu
└── src/
    ├── main/java/vn/flashsale/
    │   ├── FlashSaleApplication.java
    │   ├── catalog/
    │   ├── inventory/
    │   ├── order/
    │   ├── payment/
    │   ├── notification/
    │   └── shared/                    # @NamedInterface, exception, security config
    ├── main/resources/
    │   ├── application.yaml
    │   └── db/migration/V1__baseline.sql   # rỗng ở giai đoạn 0
    └── test/java/vn/flashsale/
        ├── ModularityTests.java       # ApplicationModules.verify()
        └── ApplicationStartsTest.java # context + Testcontainers PostgreSQL
```

**8.2. Version catalog (`gradle/libs.versions.toml`, trích)**

```toml
[versions]
java = "25"
spring-boot = "4.1.x"          # điền version cụ thể từ Initializr
spring-modulith = "2.x"        # dòng tương thích Boot 4, lấy từ BOM
testcontainers = "1.2x"
dependency-check = "12.x"

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
dependency-check = { id = "org.owasp.dependencycheck", version.ref = "dependency-check" }
spotless = { id = "com.diffplug.spotless", version = "7.x" }
```

Quy ước: không dùng dấu `+` hay range trong version; Renovate mở PR nâng version hàng tuần (bật ở giai đoạn 4).

**8.3. Docker Compose (`compose.yaml`, trích)**

```yaml
services:
  postgres:
    image: postgres:16
    environment: { POSTGRES_DB: flashsale, POSTGRES_USER: flashsale, POSTGRES_PASSWORD: dev-only }
    ports: ["5432:5432"]
  redis:
    image: redis:7
    command: ["redis-server", "--requirepass", "dev-only"]
    ports: ["6379:6379"]
  kafka:
    image: apache/kafka:3.9.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
    ports: ["9092:9092"]
  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    command: ["start-dev", "--import-realm"]
    environment: { KC_BOOTSTRAP_ADMIN_USERNAME: admin, KC_BOOTSTRAP_ADMIN_PASSWORD: dev-only }
    volumes: ["./keycloak:/opt/keycloak/data/import"]
    ports: ["8081:8080"]
```

Mật khẩu `dev-only` chỉ dùng local và được liệt kê trong allowlist của gitleaks; SASL cho Kafka và TLS bật ở giai đoạn 3–4, không bật ở giai đoạn 0 để giữ compose đơn giản.

**8.4. GitHub Actions (`.github/workflows/ci.yml`)**

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }          # gitleaks cần toàn bộ lịch sử
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '25' }
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew spotlessCheck build   # build đã gồm test và Testcontainers
      - run: ./gradlew dependencyCheckAnalyze
        env: { NVD_API_KEY: ${{ secrets.NVD_API_KEY }} }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: dependency-check-report, path: build/reports/dependency-check-report.html }
```

Cấu hình Dependency-Check trong `build.gradle.kts`: `failBuildOnCVSS = 9.0f` (chặn Critical ở giai đoạn 0, hạ xuống 7.0 ở giai đoạn 4 để chặn cả High), `nvd.apiKey` lấy từ biến môi trường; đăng ký NVD API key miễn phí trước buổi 7 vì không có key thì tải dữ liệu rất chậm. Ubuntu runner có Docker sẵn nên Testcontainers chạy được không cần cấu hình thêm.

**8.5. Hai test tối thiểu của giai đoạn 0**

```java
// ModularityTests.java
class ModularityTests {
    ApplicationModules modules = ApplicationModules.of(FlashSaleApplication.class);

    @Test void modulesRespectBoundaries() { modules.verify(); }

    @Test void writeDocumentation() { new Documenter(modules).writeDocumentation(); }
}

// ApplicationStartsTest.java
@SpringBootTest
@Testcontainers
class ApplicationStartsTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Test void contextLoads() { }
}
```

`Documenter` sinh sơ đồ module vào `build/spring-modulith-docs`; từ giai đoạn 1, đây là C4 mức Component sinh tự động, không phải vẽ tay.

## 9. Nguồn học cho giai đoạn 0 và câu hỏi mở

Đọc đúng phần cần cho từng buổi thay vì đọc cả cuốn; tổng thời gian đọc khoảng 6 giờ, nằm ngoài 18 giờ làm.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1 | *Fundamentals of Software Architecture* 2nd, Richards & Ford | Chương về architecture characteristics: cách chọn và giới hạn NFR ở 5–7 thuộc tính | Không |
| 1 | arc42 Quality Model ([quality.arc42.org](https://quality.arc42.org)) | Danh mục thuộc tính chất lượng có ví dụ scenario, dùng để viết NFR bằng số | Có |
| 2 | *System Design Interview* Vol 1, Alex Xu | Chương 2: back-of-the-envelope estimation | Không |
| 2 | ByteByteGo newsletter, các bài về flash sale và inventory | Cách các hệ thống thật xử lý oversell | Có (bản miễn phí) |
| 3 | [c4model.com](https://c4model.com) và [docs.structurizr.com/dsl](https://docs.structurizr.com/dsl) | Trang tổng quan C4 và tham chiếu DSL; Structurizr Lite để render | Có |
| 4 | [adr.github.io](https://adr.github.io) và MADR template | Cấu trúc ADR; ví dụ ADR tốt và xấu | Có |
| 4 | Spring Modulith reference ([docs.spring.io/spring-modulith](https://docs.spring.io/spring-modulith/reference/)) | Fundamentals, Verification, Documentation | Có |
| 5 | *Threat Modeling: Designing for Security*, Adam Shostack | Chương 1 và chương STRIDE | Không |
| 5 | [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) và OWASP ASVS | Cách vẽ DFD; mục V1 (Architecture) và V4 (Access Control) của ASVS | Có |
| 6–7 | Testcontainers docs, Spring Boot Testcontainers support, gitleaks README, OWASP Dependency-Check Gradle plugin | Phần Getting started của mỗi công cụ | Có |

**Quyết định cho các câu hỏi mở** (chốt 26/9/2026, tiêu chí: thực tế và học sâu để ứng dụng được)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | Số lượng tối đa mỗi đơn là 1 hay 2? | **2** | Flash sale thật thường cho 1–2; qty > 1 làm bất biến "đã giữ + còn lại = ban đầu" và test đồng thời có nội dung thật, còn qty = 1 biến bài toán thành đếm đơn |
| 2 | Giữ đơn chờ thanh toán 5 hay 10 phút? | **5 phút** | Đủ thật với thanh toán ví/QR; chu kỳ test và demo ngắn; `Clock` inject được nên đổi số không tốn công |
| 3 | Có làm Web UI tối giản không? | **Không, cho đến hết giai đoạn 3**; dùng k6, HTTP client (Bruno hoặc IntelliJ) và Swagger UI từ springdoc để demo | Mục tiêu là backend và kiến trúc; 6 giờ tiết kiệm dồn cho buổi tấn công và perf. Lấy token qua client `flashsale-cli` (password grant) trong realm dev; client PKCE vẫn định nghĩa sẵn để thiết kế đúng |
| 4 | ASVS mức 2 hay 1? | **Mức 2** | Hệ thống có tiền và dữ liệu cá nhân; mức 2 ép MFA cho admin, audit log và kiểm tra authorization từ giai đoạn 1, đúng thứ Senior cần tự tay làm |
| 5 | Mua sách lẻ hay O'Reilly Learning? | **O'Reilly Learning 1–2 tháng** cho giai đoạn 0–2 (FoSA 2nd, SDI Vol 1, Optimizing Cloud Native Java, JCIP), sau đó mua bản in chỉ *Effective Java* và *DDIA* 2nd | Rẻ hơn mua 4 cuốn; hai cuốn mua bản in là hai cuốn sẽ đọc lại nhiều lần; kiểm tra giá gói hiện hành trước khi đăng ký |

Các mục 3.2, 5.1, 5.2, 5.3 và 7.2 đã cập nhật theo bảng này; bắt đầu buổi 1 được ngay.
