// Lộ trình FlashSale — Giai đoạn 3: Event-driven và tách service.
//
// Nguồn: sources/flashsale/05-giai-doan-3.md (tài liệu fs-05).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd3-done` là Definition of Done (mục 1), cổng gắn tag `v3-events`.
//
// GIỮ NGUYÊN id (fs-gd3-w<tuần tuyệt đối> / fs-gd3-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd3 = [
  {
    id: "fs-gd3-w11",
    week: "Tuần 11",
    title: "Hạ tầng event và outbox",
    goal: "Kafka, schema registry, envelope event và outbox chạy trong monolith.",
    doneWhen: "`compose.yaml` cập nhật, `kafka/topics.sh`; `contracts/events/*.json`, mục 4 chốt; Event `order.placed` xuất hiện trên Kafka từ outbox; ADR-005 Accepted.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/fs-05" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Cài đặt Kafka", href: "#/docs/kafka-02" },
      { label: "Cơ chế bên trong Kafka", href: "#/docs/kafka-06" },
    ],
    items: [
      {
        id: "fs-gd3-w11-1",
        text: "Kafka KRaft, Apicurio, Kafka UI trong Compose",
        lesson: `**Việc cần làm.** Kafka KRaft, Apicurio, Kafka UI trong Compose; tạo 7 topic bằng script với 6 partition

**Đầu ra.** \`compose.yaml\` cập nhật, \`kafka/topics.sh\`

**Đọc thêm.** [Cài đặt Kafka](#/docs/kafka-02) · [Cơ chế bên trong Kafka](#/docs/kafka-06)

**Nguồn.** [Giai đoạn 3 — buổi 1](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w11-2",
        text: "Envelope CloudEvents, JSON Schema cho 7 event, đăng ký Apicurio",
        lesson: `**Việc cần làm.** Thiết kế envelope CloudEvents, schema JSON Schema cho 7 event, đăng ký vào Apicurio; quy tắc tương thích

**Đầu ra.** \`contracts/events/*.json\`, mục 4 chốt

**Đọc thêm.** [Encoding và Tiến hóa](#/docs/ddia-05)

**Nguồn.** [Giai đoạn 3 — buổi 2](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w11-3",
        text: "Bảng outbox trong order_db, Debezium với Outbox Event Router SMT",
        lesson: `**Việc cần làm.** Bảng \`outbox\` trong \`order_db\` (vẫn là schema trong monolith), Debezium connector với Outbox Event Router SMT

**Đầu ra.** Event \`order.placed\` xuất hiện trên Kafka từ outbox

**Đọc thêm.** [Xây dựng data pipeline](#/docs/kafka-09) · [Stream Processing](#/docs/ddia-12)

**Nguồn.** [Giai đoạn 3 — buổi 3](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w11-4",
        text: "Thử phương án thay thế: Modulith externalization sang Kafka trên nhánh riêng",
        lesson: `**Việc cần làm.** Thử phương án thay thế: Modulith externalization sang Kafka trên nhánh riêng; so sánh; viết ADR-005

**Đầu ra.** ADR-005 Accepted

**Nguồn.** [Giai đoạn 3 — buổi 4](#/docs/fs-05)`,
      },
    ],
  },

  {
    id: "fs-gd3-w12",
    week: "Tuần 12",
    title: "Consumer idempotent và saga trong monolith",
    goal: "Consumer idempotent, DLT và bốn đường saga chạy đúng trước khi tách service.",
    doneWhen: "Inventory trừ và hoàn kho qua Kafka thay vì Modulith event; Test poison message xanh; Saga chạy trong một process; 4 test xanh.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/fs-05" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Kafka Consumer: Đọc dữ liệu từ Kafka", href: "#/docs/kafka-04" },
      { label: "Truyền dữ liệu tin cậy", href: "#/docs/kafka-07" },
    ],
    items: [
      {
        id: "fs-gd3-w12-1",
        text: "Consumer idempotent: bảng processed_events, inventory nghe event đơn hàng",
        lesson: `**Việc cần làm.** Consumer idempotent: bảng \`processed_events\`, \`@KafkaListener\` cho \`inventory\` nghe \`order.placed\` và \`order.cancelled\`

**Đầu ra.** Inventory trừ và hoàn kho qua Kafka thay vì Modulith event

**Đọc thêm.** [Kafka Consumer: Đọc dữ liệu từ Kafka](#/docs/kafka-04) · [Truyền dữ liệu tin cậy](#/docs/kafka-07)

**Nguồn.** [Giai đoạn 3 — buổi 5](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w12-2",
        text: "Retry với backoff, DLT, header lý do",
        lesson: `**Việc cần làm.** Retry với backoff, DLT, header lý do; lệnh replay từ DLT

**Đầu ra.** Test poison message xanh

**Đọc thêm.** [Truyền dữ liệu tin cậy](#/docs/kafka-07)

**Nguồn.** [Giai đoạn 3 — buổi 6](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w12-3",
        text: "State machine đơn hàng mới (mục 6.2) với hai cờ `reserved`, `paid`",
        lesson: `**Việc cần làm.** State machine đơn hàng mới (mục 6.2) với hai cờ \`reserved\`, \`paid\`; \`payment.requested\` và \`payment.completed/failed\` vẫn trong monolith

**Đầu ra.** Saga chạy trong một process

**Nguồn.** [Giai đoạn 3 — buổi 7](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w12-4",
        text: "Test end-to-end 4 đường saga bằng Testcontainers Kafka",
        lesson: `**Việc cần làm.** Test end-to-end 4 đường saga bằng Testcontainers Kafka; đo \`order.confirm.latency\`

**Đầu ra.** 4 test xanh

**Nguồn.** [Giai đoạn 3 — buổi 8](#/docs/fs-05)`,
      },
    ],
  },

  {
    id: "fs-gd3-w13",
    week: "Tuần 13",
    title: "Tách order-service",
    goal: "Tách order-service với database riêng và contract test giữa producer và consumer.",
    doneWhen: "Build multi-module xanh; 2 database; 2 deployable; Contract test xanh.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/fs-05" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Encoding và Tiến hóa", href: "#/docs/ddia-05" },
    ],
    items: [
      {
        id: "fs-gd3-w13-1",
        text: "Tách Gradle module order-service, shared.events thành thư viện contracts",
        lesson: `**Việc cần làm.** Tách Gradle module \`order-service\` trong cùng repo (multi-project), package \`order\` chuyển sang, \`shared.events\` thành thư viện \`contracts\`

**Đầu ra.** Build multi-module xanh

**Nguồn.** [Giai đoạn 3 — buổi 9](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w13-2",
        text: "Tách order_db thật: Flyway riêng, migrate dữ liệu, xoá truy cập chéo",
        lesson: `**Việc cần làm.** \`order_db\` tách thật: Flyway riêng, migrate dữ liệu bằng script, xóa quyền truy cập chéo

**Đầu ra.** 2 database

**Nguồn.** [Giai đoạn 3 — buổi 10](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w13-3",
        text: "order-service chạy riêng sau Traefik, token hàng chờ chuyển sang",
        lesson: `**Việc cần làm.** \`order-service\` chạy riêng, Traefik route \`/api/orders/**\` và \`/api/flash-sales/{id}/token\`; token hàng chờ chuyển sang order-service

**Đầu ra.** 2 deployable

**Nguồn.** [Giai đoạn 3 — buổi 11](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w13-4",
        text: "Contract test: producer test sinh event mẫu và kiểm tra khớp schema",
        lesson: `**Việc cần làm.** Contract test: producer test sinh event mẫu và kiểm tra khớp schema; consumer test đọc event mẫu của producer; CI kiểm tra tương thích

**Đầu ra.** Contract test xanh

**Đọc thêm.** [Encoding và Tiến hóa](#/docs/ddia-05)

**Nguồn.** [Giai đoạn 3 — buổi 12](#/docs/fs-05)`,
      },
    ],
  },

  {
    id: "fs-gd3-w14",
    week: "Tuần 14",
    title: "Tách payment-service và saga đầy đủ",
    goal: "Tách payment-service, webhook ký HMAC, hoàn tiền và hai ADR về cách tách.",
    doneWhen: "3 deployable + mock; Luồng thanh toán bất đồng bộ end-to-end; Test hoàn tiền xanh; 2 ADR Accepted.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/fs-05" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd3-w14-1",
        text: "Tách `payment-service` + `payment_db`",
        lesson: `**Việc cần làm.** Tách \`payment-service\` + \`payment_db\`; \`payment-gateway-mock\` thành container riêng có webhook

**Đầu ra.** 3 deployable + mock

**Nguồn.** [Giai đoạn 3 — buổi 13](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w14-2",
        text: "Webhook HMAC + timestamp + nonce ở payment-service",
        lesson: `**Việc cần làm.** Webhook HMAC + timestamp + nonce ở payment-service; \`payment.completed/failed\` từ webhook

**Đầu ra.** Luồng thanh toán bất đồng bộ end-to-end

**Nguồn.** [Giai đoạn 3 — buổi 14](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w14-3",
        text: "Hoàn tiền: `refund.requested` → payment-service → `payment.refunded`",
        lesson: `**Việc cần làm.** Hoàn tiền: \`refund.requested\` → payment-service → \`payment.refunded\`; đường saga thứ 4

**Đầu ra.** Test hoàn tiền xanh

**Nguồn.** [Giai đoạn 3 — buổi 15](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w14-4",
        text: "Viết ADR-006 (tách gì) và ADR-007 (choreography vs orchestration)",
        lesson: `**Việc cần làm.** Viết ADR-006 (tách gì, không tách gì) và ADR-007 (choreography vs orchestration) với số đo

**Đầu ra.** 2 ADR Accepted

**Nguồn.** [Giai đoạn 3 — buổi 16](#/docs/fs-05)`,
      },
    ],
  },

  {
    id: "fs-gd3-w15",
    week: "Tuần 15",
    title: "Security Kafka, chaos và chốt v3",
    goal: "Khoá Kafka bằng SASL/ACL/TLS, chạy chaos và gắn tag `v3-events`.",
    doneWhen: "Mỗi service chỉ ghi/đọc topic của mình; 3–4 dòng attack log; Kết quả chaos + report cập nhật; Tag `v3-events`.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/fs-05" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Bảo mật Kafka", href: "#/docs/kafka-11" },
      { label: "Những rắc rối của hệ phân tán", href: "#/docs/ddia-09" },
    ],
    items: [
      {
        id: "fs-gd3-w15-1",
        text: "Kafka SASL/SCRAM + ACL theo service + TLS",
        lesson: `**Việc cần làm.** Kafka SASL/SCRAM + ACL theo service + TLS; Apicurio auth cơ bản

**Đầu ra.** Mỗi service chỉ ghi/đọc topic của mình

**Đọc thêm.** [Bảo mật Kafka](#/docs/kafka-11)

**Nguồn.** [Giai đoạn 3 — buổi 17](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w15-2",
        text: "Tấn công 5: event giả, replay webhook, sai schema, poison message",
        lesson: `**Việc cần làm.** Buổi tấn công 5: publish event giả, replay webhook, event sai schema, poison message

**Đầu ra.** 3–4 dòng attack log

**Nguồn.** [Giai đoạn 3 — buổi 18](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w15-3",
        text: "Chaos: tắt payment-service 2 phút, Toxiproxy latency Kafka",
        lesson: `**Việc cần làm.** Chaos: tắt payment-service 2 phút, Toxiproxy latency Kafka; k6 spike hồi quy; buổi tấn công 6 nếu còn giờ

**Đầu ra.** Kết quả chaos + report cập nhật

**Đọc thêm.** [Những rắc rối của hệ phân tán](#/docs/ddia-09)

**Nguồn.** [Giai đoạn 3 — buổi 19](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-w15-4",
        text: "Cập nhật C4, README, `docs/runbook-replay.md`, rà Definition of Done, tag",
        lesson: `**Việc cần làm.** Cập nhật C4, README, \`docs/runbook-replay.md\`, rà Definition of Done, tag

**Đầu ra.** Tag \`v3-events\`

**Nguồn.** [Giai đoạn 3 — buổi 20](#/docs/fs-05)`,
      },
    ],
  },

  {
    id: "fs-gd3-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 3 — gắn tag v3-events",
    goal: "Cổng ra của giai đoạn 3: tick đủ 13 tiêu chí Definition of Done mới gắn tag `v3-events` và đổi dòng giai đoạn trong bảng tiến độ sang Hoàn thành.",
    items: [
      {
        id: "fs-gd3-done-1",
        text: "Ba deployable cùng hạ tầng event chạy bằng docker compose up",
        lesson: `**Cách tự chấm.** Ba deployable chạy bằng \`docker compose up\`: \`core\` (catalog, inventory, notification, token), \`order-service\`, \`payment-service\`, cùng \`payment-gateway-mock\`, Kafka, Kafka Connect + Debezium, Apicurio, Traefik.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-2",
        text: "Ba database riêng (`core_db`, `order_db`, `payment_db`)",
        lesson: `**Cách tự chấm.** Ba database riêng (\`core_db\`, \`order_db\`, \`payment_db\`); grep toàn repo không có service nào cấu hình datasource của service khác.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-3",
        text: "7 topic có schema trong Apicurio, CI chặn thay đổi không tương thích",
        lesson: `**Cách tự chấm.** 7 topic ở mục 4 có schema đăng ký trong Apicurio, CI chặn thay đổi không tương thích BACKWARD.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-4",
        text: "Outbox: kill order-service sau commit, mỗi event xuất hiện đúng 1 lần",
        lesson: `**Cách tự chấm.** Outbox: kill \`order-service\` ngay sau commit của 100 đơn, khởi động lại, 100 event \`order.placed\` vẫn xuất hiện đúng 1 lần mỗi đơn trên Kafka.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-5",
        text: "Replay 1.000 event đã xử lý không đổi trạng thái, không hoàn kho thừa",
        lesson: `**Cách tự chấm.** Consumer idempotent: replay lại 1.000 event đã xử lý, không đổi trạng thái nào, không hoàn kho thừa.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-6",
        text: "4 đường saga có test end-to-end, đường thứ 4 có hoàn tiền",
        lesson: `**Cách tự chấm.** Saga: 4 đường (thanh toán OK, thanh toán lỗi, hết hạn, inventory từ chối sau khi đã thanh toán) có test end-to-end; đường thứ 4 có hoàn tiền.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-7",
        text: "Event sai schema và event lỗi 5 lần vào DLT kèm lý do; có lệnh replay",
        lesson: `**Cách tự chấm.** DLQ: event sai schema và event gây exception 5 lần liên tiếp nằm trong \`<topic>.DLT\` kèm header lý do; có lệnh replay từ DLT.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-8",
        text: "Chaos: tắt `payment-service` 2 phút khi k6 đang chạy, bật lại",
        lesson: `**Cách tự chấm.** Chaos: tắt \`payment-service\` 2 phút khi k6 đang chạy, bật lại; \`verify-no-oversell\` xanh, mọi đơn ở trạng thái cuối trong 60 giây, không đơn nào bị thanh toán 2 lần.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-9",
        text: "Chaos: Toxiproxy thêm 2 giây latency vào Kafka",
        lesson: `**Cách tự chấm.** Chaos: Toxiproxy thêm 2 giây latency vào Kafka; đặt hàng vẫn 201 trong NFR (outbox không chờ Kafka), xác nhận chậm nhưng đúng.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-10",
        text: "K6 spike chạy lại: p99 `place` không xấu hơn mốc `v2-perf` quá 10%",
        lesson: `**Cách tự chấm.** k6 spike chạy lại: p99 \`place\` không xấu hơn mốc \`v2-perf\` quá 10%; metric mới \`order.confirm.latency\` p99 < 2 giây.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-11",
        text: "ADR-005, ADR-006, ADR-007 ở trạng thái Accepted",
        lesson: `**Cách tự chấm.** ADR-005, ADR-006, ADR-007 ở trạng thái Accepted; C4 Container cập nhật với 3 deployable.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-12",
        text: "`docs/security/attack-log-3.md` có 6 kịch bản",
        lesson: `**Cách tự chấm.** \`docs/security/attack-log-3.md\` có 6 kịch bản; Kafka chạy SASL/SCRAM + ACL theo service; webhook có HMAC + nonce.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
      {
        id: "fs-gd3-done-13",
        text: "Dòng giai đoạn 3 ở tab chính đổi sang Hoàn thành.",
        lesson: `**Cách tự chấm.** Dòng giai đoạn 3 ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 3 — Definition of Done](#/docs/fs-05)`,
      },
    ],
  },
];
