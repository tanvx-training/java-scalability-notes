// Lộ trình FlashSale — Giai đoạn 1: Modular monolith chạy đúng.
//
// Nguồn: sources/flashsale/03-giai-doan-1.md (tài liệu fs-03).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd1-done` là Definition of Done (mục 1), cổng gắn tag `v1-monolith`.
//
// GIỮ NGUYÊN id (fs-gd1-w<tuần tuyệt đối> / fs-gd1-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd1 = [
  {
    id: "fs-gd1-w3",
    week: "Tuần 3",
    title: "Dựng nền: schema, module, Keycloak, admin API",
    goal: "Dựng schema, ranh giới 5 module, xác thực bằng Keycloak và API quản trị đợt sale.",
    doneWhen: "Migration chạy trên Testcontainers; Sơ đồ module từ `Documenter`; `curl` với token thật trả 200/401/403; 3 endpoint admin xanh.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/fs-03" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Làm việc với Spring Data JPA", href: "#/docs/jpa-04" },
      { label: "Hiện thực một OAuth 2 resource server", href: "#/docs/springsec-15" },
    ],
    items: [
      {
        id: "fs-gd1-w3-1",
        text: "Flyway V1 với 8 bảng",
        lesson: `**Việc cần làm.** Flyway V1 với 8 bảng; entity và repository cho \`catalog\`, \`inventory\`

**Đầu ra.** Migration chạy trên Testcontainers

**Đọc thêm.** [Làm việc với Spring Data JPA](#/docs/jpa-04)

**Nguồn.** [Giai đoạn 1 — buổi 1](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w3-2",
        text: "Khung 5 module, package `shared.events`, `@NamedInterface`",
        lesson: `**Việc cần làm.** Khung 5 module, package \`shared.events\`, \`@NamedInterface\`; \`ModularityTests\` xanh

**Đầu ra.** Sơ đồ module từ \`Documenter\`

**Nguồn.** [Giai đoạn 1 — buổi 2](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w3-3",
        text: "Keycloak realm + Spring Security 7 resource server kiểm iss/aud/exp",
        lesson: `**Việc cần làm.** Keycloak realm (2 role, 2 client, 3 user), Spring Security 7 resource server, kiểm tra iss/aud/exp

**Đầu ra.** \`curl\` với token thật trả 200/401/403

**Đọc thêm.** [Hiện thực một OAuth 2 resource server](#/docs/springsec-15)

**Nguồn.** [Giai đoạn 1 — buổi 3](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w3-4",
        text: "Admin API: tạo, mở, đóng đợt flash sale",
        lesson: `**Việc cần làm.** Admin API: tạo, mở, đóng đợt flash sale; test cho từng trạng thái

**Đầu ra.** 3 endpoint admin xanh

**Nguồn.** [Giai đoạn 1 — buổi 4](#/docs/fs-03)`,
      },
    ],
  },

  {
    id: "fs-gd1-w4",
    week: "Tuần 4",
    title: "Đặt hàng đúng dưới đồng thời",
    goal: "Luồng đặt hàng đúng tuyệt đối với 100 request đồng thời: optimistic locking, idempotency, lỗi chuẩn.",
    doneWhen: "1 endpoint đặt hàng xanh; Test idempotency xanh; Mọi lỗi trả JSON chuẩn, không stack trace; `docs/perf/baseline-v1.md`.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/fs-03" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Transaction và concurrency", href: "#/docs/jpa-11" },
      { label: "Giải phẫu các Timeout", href: "#/docs/java-02" },
    ],
    items: [
      {
        id: "fs-gd1-w4-1",
        text: "Đặt hàng happy path: giữ kho bằng optimistic locking, tạo đơn CREATED",
        lesson: `**Việc cần làm.** Đặt hàng happy path: kiểm tra đợt đang mở, giữ kho bằng optimistic locking, tạo đơn CREATED

**Đầu ra.** 1 endpoint đặt hàng xanh

**Đọc thêm.** [Transaction và concurrency](#/docs/jpa-11)

**Nguồn.** [Giai đoạn 1 — buổi 5](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w4-2",
        text: "Idempotency-Key: filter, bảng idempotency_key, 3 trường hợp",
        lesson: `**Việc cần làm.** Idempotency-Key: filter, bảng \`idempotency_key\`, 3 trường hợp (trùng, khác body, đang xử lý)

**Đầu ra.** Test idempotency xanh

**Đọc thêm.** [Giải phẫu các Timeout](#/docs/java-02)

**Nguồn.** [Giai đoạn 1 — buổi 6](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w4-3",
        text: "Bean Validation, Problem Details theo RFC 9457, danh mục lỗi ở mục 5.3",
        lesson: `**Việc cần làm.** Bean Validation, Problem Details theo RFC 9457, danh mục lỗi ở mục 5.3

**Đầu ra.** Mọi lỗi trả JSON chuẩn, không stack trace

**Nguồn.** [Giai đoạn 1 — buổi 7](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w4-4",
        text: "Test đồng thời 100 thread",
        lesson: `**Việc cần làm.** Test đồng thời 100 thread; retry với backoff và jitter; ghi baseline

**Đầu ra.** \`docs/perf/baseline-v1.md\`

**Đọc thêm.** [Giải phẫu các Timeout](#/docs/java-02) · [Transaction và concurrency](#/docs/jpa-11)

**Nguồn.** [Giai đoạn 1 — buổi 8](#/docs/fs-03)`,
      },
    ],
  },

  {
    id: "fs-gd1-w5",
    week: "Tuần 5",
    title: "Thanh toán mock, hết hạn giữ đơn, phân quyền",
    goal: "Hoàn chỉnh vòng đời đơn: thanh toán mock, hết hạn hoàn kho đúng một lần, phân quyền theo ownership.",
    doneWhen: "CREATED → PAID → CONFIRMED chạy đúng; Hoàn kho đúng 1 lần trong mọi thứ tự; Log thông báo, event không mất khi listener lỗi; Bảng ma trận quyền xanh.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/fs-03" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Row-Level Locks (Khóa mức dòng)", href: "#/docs/pg-13" },
      { label: "Transaction và concurrency", href: "#/docs/jpa-11" },
    ],
    items: [
      {
        id: "fs-gd1-w5-1",
        text: "Payment mock, endpoint pay và state machine đơn hàng",
        lesson: `**Việc cần làm.** Payment mock (\`PaymentGateway\` interface, mock thành công/thất bại theo cấu hình), endpoint pay, state machine đơn

**Đầu ra.** CREATED → PAID → CONFIRMED chạy đúng

**Nguồn.** [Giai đoạn 1 — buổi 9](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w5-2",
        text: "Scheduler hết hạn giữ đơn",
        lesson: `**Việc cần làm.** Scheduler hết hạn giữ đơn; hoàn kho qua event \`OrderCancelled\`; test race giữa hết hạn và thanh toán

**Đầu ra.** Hoàn kho đúng 1 lần trong mọi thứ tự

**Đọc thêm.** [Row-Level Locks (Khóa mức dòng)](#/docs/pg-13) · [Transaction và concurrency](#/docs/jpa-11)

**Nguồn.** [Giai đoạn 1 — buổi 10](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w5-3",
        text: "Notification nghe OrderPaid/OrderCancelled; bảng event_publication",
        lesson: `**Việc cần làm.** Notification module nghe \`OrderPaid\`, \`OrderCancelled\` bằng \`@ApplicationModuleListener\`; bảng \`event_publication\`

**Đầu ra.** Log thông báo, event không mất khi listener lỗi

**Đọc thêm.** [@Transactional Part 2: Năm cái bẫy](#/docs/java-10)

**Nguồn.** [Giai đoạn 1 — buổi 11](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w5-4",
        text: "Authorization theo ownership",
        lesson: `**Việc cần làm.** Authorization theo ownership; endpoint xem và hủy đơn; test authorization cho cả 10 endpoint

**Đầu ra.** Bảng ma trận quyền xanh

**Đọc thêm.** [Hiện thực authorization ở mức method](#/docs/springsec-11)

**Nguồn.** [Giai đoạn 1 — buổi 12](#/docs/fs-03)`,
      },
    ],
  },

  {
    id: "fs-gd1-w6",
    week: "Tuần 6",
    title: "Tự tấn công và chốt v1",
    goal: "Tự tấn công luồng vừa xây, sửa lỗ hổng tìm được và gắn tag `v1-monolith`.",
    doneWhen: "3 dòng đầu của attack log; 3 dòng sau của attack log; Coverage trên 80%; Tag `v1-monolith`.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/fs-03" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Hiện thực một OAuth 2 resource server", href: "#/docs/springsec-15" },
    ],
    items: [
      {
        id: "fs-gd1-w6-1",
        text: "CodeQL vào CI, repo chuyển public",
        lesson: `**Việc cần làm.** CodeQL vào CI, repo chuyển public; security headers; buổi tấn công 1: IDOR, mass assignment, JWT alg/aud

**Đầu ra.** 3 dòng đầu của attack log

**Đọc thêm.** [Hiện thực một OAuth 2 resource server](#/docs/springsec-15)

**Nguồn.** [Giai đoạn 1 — buổi 13](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w6-2",
        text: "Buổi tấn công 2: replay đơn, lạm dụng idempotency, race bằng Turbo Intruder",
        lesson: `**Việc cần làm.** Buổi tấn công 2: replay đơn, lạm dụng idempotency, race bằng Turbo Intruder; fix và test hồi quy

**Đầu ra.** 3 dòng sau của attack log

**Nguồn.** [Giai đoạn 1 — buổi 14](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w6-3",
        text: "JaCoCo, dọn test, C4 Component từ `Documenter`, README",
        lesson: `**Việc cần làm.** JaCoCo, dọn test, C4 Component từ \`Documenter\`, README

**Đầu ra.** Coverage trên 80%

**Nguồn.** [Giai đoạn 1 — buổi 15](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-w6-4",
        text: "Rà Definition of Done, cập nhật ADR nếu quyết định thay đổi, tag",
        lesson: `**Việc cần làm.** Rà Definition of Done, cập nhật ADR nếu quyết định thay đổi, tag

**Đầu ra.** Tag \`v1-monolith\`

**Nguồn.** [Giai đoạn 1 — buổi 16](#/docs/fs-03)`,
      },
    ],
  },

  {
    id: "fs-gd1-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 1 — gắn tag v1-monolith",
    goal: "Cổng ra của giai đoạn 1: tick đủ 11 tiêu chí Definition of Done mới gắn tag `v1-monolith` và đổi dòng giai đoạn trong bảng tiến độ sang Hoàn thành.",
    items: [
      {
        id: "fs-gd1-done-1",
        text: "`ModularityTests` xanh",
        lesson: `**Cách tự chấm.** \`ModularityTests\` xanh; \`Documenter\` sinh sơ đồ module vào \`docs/c4/components/\`.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-2",
        text: "Flyway V1 tạo đủ 8 bảng ở mục 4",
        lesson: `**Cách tự chấm.** Flyway V1 tạo đủ 8 bảng ở mục 4; \`ApplicationStartsTest\` xanh với Testcontainers.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-3",
        text: "10 endpoint có integration test: đúng, sai quyền, sai dữ liệu",
        lesson: `**Cách tự chấm.** 10 endpoint ở mục 5 có integration test cho trường hợp đúng, sai quyền và sai dữ liệu.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-4",
        text: "Test đồng thời 100 thread / 10 sản phẩm đúng, xanh 10 lần liên tiếp",
        lesson: `**Cách tự chấm.** Test đồng thời: 100 thread mua 10 sản phẩm → đúng 10 đơn CREATED, tồn kho 0, 90 request nhận 409 \`sold-out\`; xanh 10 lần liên tiếp.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-5",
        text: "Retry cùng `Idempotency-Key` trả về đúng response cũ",
        lesson: `**Cách tự chấm.** Retry cùng \`Idempotency-Key\` trả về đúng response cũ; khác body trả 422; đang xử lý trả 409.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-6",
        text: "Đơn quá 5 phút tự CANCELLED, hoàn kho đúng 1 lần kể cả khi webhook đến cùng lúc",
        lesson: `**Cách tự chấm.** Đơn quá 5 phút chưa thanh toán tự chuyển CANCELLED và hoàn kho đúng 1 lần, kể cả khi webhook thanh toán đến cùng lúc.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-7",
        text: "Mọi endpoint có test authorization: 401, 403, đơn người khác 404",
        lesson: `**Cách tự chấm.** Mọi endpoint có test authorization: không token → 401, sai role → 403, đơn của người khác → 404.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-8",
        text: "Coverage luồng đặt hàng (package `order`, `inventory`) trên 80% theo JaCoCo.",
        lesson: `**Cách tự chấm.** Coverage luồng đặt hàng (package \`order\`, \`inventory\`) trên 80% theo JaCoCo.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-9",
        text: "`docs/security/attack-log-1.md` có 6 kịch bản, kết quả và commit fix.",
        lesson: `**Cách tự chấm.** \`docs/security/attack-log-1.md\` có 6 kịch bản, kết quả và commit fix.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-10",
        text: "baseline-v1.md ghi latency và số xung đột ở 100 request đồng thời",
        lesson: `**Cách tự chấm.** \`docs/perf/baseline-v1.md\` ghi latency và số lần xung đột ở 100 request đồng thời.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
      {
        id: "fs-gd1-done-11",
        text: "README cập nhật cách chạy, cách lấy token từ Keycloak, cách chạy test đồng thời",
        lesson: `**Cách tự chấm.** README cập nhật cách chạy, cách lấy token từ Keycloak, cách chạy test đồng thời; dòng giai đoạn 1 ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 1 — Definition of Done](#/docs/fs-03)`,
      },
    ],
  },
];
