// Lộ trình FlashSale — Giai đoạn 2: Chịu tải flash sale.
//
// Nguồn: sources/flashsale/04-giai-doan-2.md (tài liệu fs-04).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd2-done` là Definition of Done (mục 1), cổng gắn tag `v2-perf`.
//
// GIỮ NGUYÊN id (fs-gd2-w<tuần tuyệt đối> / fs-gd2-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd2 = [
  {
    id: "fs-gd2-w7",
    week: "Tuần 7",
    title: "Đo baseline và tìm nút thắt",
    goal: "Có baseline đo được và danh sách nút thắt từ flame graph trước khi đổi bất cứ thứ gì.",
    doneWhen: "`perf/k6/spike.js`, `perf/verify-no-oversell.sh`; `docs/perf/baseline-v1.md`; `docs/perf/flame-v1.html`, mục \"Nút thắt\" trong report; ADR-003 Proposed.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/fs-04" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Phương pháp luận Kiểm thử Hiệu năng", href: "#/docs/ocnj-02" },
      { label: "Database Connection Pool: pool size bao nhiêu là đủ?", href: "#/docs/java-08" },
    ],
    items: [
      {
        id: "fs-gd2-w7-1",
        text: "Dựng môi trường đo cố định, kịch bản k6 spike và verify-no-oversell",
        lesson: `**Việc cần làm.** Dựng môi trường đo cố định (Docker resource limit), viết kịch bản k6 spike và script verify-no-oversell

**Đầu ra.** \`perf/k6/spike.js\`, \`perf/verify-no-oversell.sh\`

**Đọc thêm.** [Phương pháp luận Kiểm thử Hiệu năng](#/docs/ocnj-02)

**Nguồn.** [Giai đoạn 2 — buổi 1](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w7-2",
        text: "Đo v1 3 lần, lấy trung vị",
        lesson: `**Việc cần làm.** Đo v1 3 lần, lấy trung vị; ghi baseline; xác nhận hệ thống gãy ở đâu (timeout, 5xx, pool wait)

**Đầu ra.** \`docs/perf/baseline-v1.md\`

**Đọc thêm.** [Database Connection Pool: pool size bao nhiêu là đủ?](#/docs/java-08) · [Tomcat Thread Pool: pool size bao nhiêu là đủ?](#/docs/java-07)

**Nguồn.** [Giai đoạn 2 — buổi 2](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w7-3",
        text: "Profiling v1 dưới tải bằng JFR và async-profiler",
        lesson: `**Việc cần làm.** Profiling v1 dưới tải bằng JFR và async-profiler; đọc flame graph; liệt kê 3 nút thắt theo thứ tự

**Đầu ra.** \`docs/perf/flame-v1.html\`, mục "Nút thắt" trong report

**Đọc thêm.** [Profiling](#/docs/ocnj-12)

**Nguồn.** [Giai đoạn 2 — buổi 3](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w7-4",
        text: "Thiết kế luồng đặt hàng mới, viết ADR-003 Proposed với giả thuyết và cách đo",
        lesson: `**Việc cần làm.** Thiết kế luồng đặt hàng mới (mục 5), viết ADR-003 ở trạng thái Proposed với giả thuyết và cách đo

**Đầu ra.** ADR-003 Proposed

**Nguồn.** [Giai đoạn 2 — buổi 4](#/docs/fs-04)`,
      },
    ],
  },

  {
    id: "fs-gd2-w8",
    week: "Tuần 8",
    title: "Đường ghi qua Redis Lua",
    goal: "Đưa việc trừ kho sang Redis bằng Lua atomic mà vẫn giữ 0 oversell và PostgreSQL là nguồn sự thật.",
    doneWhen: "Script + test xanh; Luồng mới chạy, test đồng thời giai đoạn 1 vẫn xanh; `InventoryReconciler` + test; Mốc \"sau Redis Lua\" trong report.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/fs-04" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd2-w8-1",
        text: "Lua script trừ kho và giới hạn per-user trên Redis",
        lesson: `**Việc cần làm.** Lua script trừ kho và giới hạn per-user trên Redis; \`RedisInventory\` với Lettuce; test đơn vị script bằng Testcontainers Redis

**Đầu ra.** Script + test xanh

**Nguồn.** [Giai đoạn 2 — buổi 5](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w8-2",
        text: "Nối vào `Orders.place`: Redis là cổng, PostgreSQL ghi sau",
        lesson: `**Việc cần làm.** Nối vào \`Orders.place\`: Redis là cổng, PostgreSQL ghi sau; bù trừ khi ghi DB lỗi

**Đầu ra.** Luồng mới chạy, test đồng thời giai đoạn 1 vẫn xanh

**Nguồn.** [Giai đoạn 2 — buổi 6](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w8-3",
        text: "Job đối chiếu Redis và PostgreSQL",
        lesson: `**Việc cần làm.** Job đối chiếu Redis và PostgreSQL; metric drift; test ép lệch

**Đầu ra.** \`InventoryReconciler\` + test

**Nguồn.** [Giai đoạn 2 — buổi 7](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w8-4",
        text: "Đo lại, so với baseline, cập nhật report và ADR-003 sang Accepted",
        lesson: `**Việc cần làm.** Đo lại, so với baseline, cập nhật report và ADR-003 sang Accepted

**Đầu ra.** Mốc "sau Redis Lua" trong report

**Nguồn.** [Giai đoạn 2 — buổi 8](#/docs/fs-04)`,
      },
    ],
  },

  {
    id: "fs-gd2-w9",
    week: "Tuần 9",
    title: "Chặn lạm dụng và đổi mô hình thread",
    goal: "Token hàng chờ, rate limit và thí nghiệm virtual threads, mỗi thay đổi có số đo.",
    doneWhen: "Token chạy, k6 xanh; 429 đúng chỗ, test bypass thất bại; Bảng so sánh, ADR-004; Report cập nhật.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/fs-04" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Tomcat Thread Pool Internals", href: "#/docs/java-06" },
      { label: "Giải phẫu các Timeout", href: "#/docs/java-02" },
    ],
    items: [
      {
        id: "fs-gd2-w9-1",
        text: "Token hàng chờ: endpoint cấp token, HMAC, TTL, dùng một lần bằng SETNX",
        lesson: `**Việc cần làm.** Token hàng chờ: endpoint cấp token, HMAC, TTL, dùng một lần bằng SETNX; k6 cập nhật để lấy token trước

**Đầu ra.** Token chạy, k6 xanh

**Nguồn.** [Giai đoạn 2 — buổi 9](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w9-2",
        text: "Rate limiting bằng Bucket4j + Redis",
        lesson: `**Việc cần làm.** Rate limiting bằng Bucket4j + Redis; cấu hình trust proxy; giới hạn body và timeout

**Đầu ra.** 429 đúng chỗ, test bypass thất bại

**Đọc thêm.** [Tomcat Thread Pool Internals](#/docs/java-06) · [Giải phẫu các Timeout](#/docs/java-02)

**Nguồn.** [Giai đoạn 2 — buổi 10](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w9-3",
        text: "Thí nghiệm thread: Tomcat 200, Tomcat 750, virtual threads",
        lesson: `**Việc cần làm.** Thí nghiệm thread: Tomcat 200, Tomcat 750, virtual threads; đo 3 lần mỗi cấu hình; kiểm tra pinning

**Đầu ra.** Bảng so sánh, ADR-004

**Đọc thêm.** [Virtual Threads](#/docs/java-05) · [Tìm hiểu về Virtual Thread](#/docs/modconc-02)

**Nguồn.** [Giai đoạn 2 — buổi 11](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w9-4",
        text: "JMH cho HMAC verify và SHA-256 request hash",
        lesson: `**Việc cần làm.** JMH cho HMAC verify và SHA-256 request hash; đo lại toàn bộ; mốc "sau rate limit và token", "sau virtual threads"

**Đầu ra.** Report cập nhật

**Nguồn.** [Giai đoạn 2 — buổi 12](#/docs/fs-04)`,
      },
    ],
  },

  {
    id: "fs-gd2-w10",
    week: "Tuần 10",
    title: "Đường đọc, tự tấn công và chốt v2",
    goal: "Cache đường đọc, tự tấn công đường Redis và gắn tag `v2-perf` với report đầy đủ.",
    doneWhen: "p99 đọc < 100 ms; 3 dòng attack log; 3 dòng attack log; Tag `v2-perf`.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/fs-04" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd2-w10-1",
        text: "Cache đọc đợt và sản phẩm trên Redis, chống stampede, `availableApprox`",
        lesson: `**Việc cần làm.** Cache đọc đợt và sản phẩm trên Redis, chống stampede, \`availableApprox\`; đo mốc "sau cache đọc"

**Đầu ra.** p99 đọc < 100 ms

**Nguồn.** [Giai đoạn 2 — buổi 13](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w10-2",
        text: "Redis ACL, TLS local, mật khẩu riêng",
        lesson: `**Việc cần làm.** Redis ACL, TLS local, mật khẩu riêng; buổi tấn công 3: dùng lại token, token user khác, bypass rate limit

**Đầu ra.** 3 dòng attack log

**Nguồn.** [Giai đoạn 2 — buổi 14](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w10-3",
        text: "Buổi tấn công 4: single-packet race trên đường Redis, payload lớn, slow client",
        lesson: `**Việc cần làm.** Buổi tấn công 4: single-packet race trên đường Redis, payload lớn, slow client; fix và test hồi quy

**Đầu ra.** 3 dòng attack log

**Nguồn.** [Giai đoạn 2 — buổi 15](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-w10-4",
        text: "Chạy k6 lần cuối, verify-no-oversell, kết luận report, rà DoD và gắn tag",
        lesson: `**Việc cần làm.** Chạy đủ kịch bản k6 lần cuối, verify-no-oversell, rà Definition of Done, viết kết luận report, tag

**Đầu ra.** Tag \`v2-perf\`

**Nguồn.** [Giai đoạn 2 — buổi 16](#/docs/fs-04)`,
      },
    ],
  },

  {
    id: "fs-gd2-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 2 — gắn tag v2-perf",
    goal: "Cổng ra của giai đoạn 2. Mốc kiểm tra: `docs/perf/report.md` có bảng p95/p99 trước và sau mỗi thay đổi kèm flame graph; đạt NFR throughput và latency; tag `v2-perf`. Tick đủ 11 tiêu chí Definition of Done bên dưới rồi mới gắn tag.",
    items: [
      {
        id: "fs-gd2-done-1",
        text: "baseline-v1.md đo lại tag v1-monolith trên đúng môi trường đo mục 3.1",
        lesson: `**Cách tự chấm.** \`docs/perf/baseline-v1.md\` có số đo của tag \`v1-monolith\` trên đúng môi trường đo ở mục 3.1 (đo lại, không dùng số của giai đoạn 1).

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-2",
        text: "report.md có p50/p95/p99, RPS, error rate cho ≥ 5 mốc, kèm flame graph",
        lesson: `**Cách tự chấm.** \`docs/perf/report.md\` có bảng p50/p95/p99, RPS, error rate cho ít nhất 5 mốc: v1, sau Redis Lua, sau rate limit và token, sau virtual threads, sau cache đọc; mỗi mốc kèm commit và flame graph.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-3",
        text: "k6 spike đạt: p99 đặt hàng < 300 ms, p99 đọc < 100 ms, 5xx < 0,1%",
        lesson: `**Cách tự chấm.** Kịch bản k6 spike đạt: p99 đặt hàng < 300 ms, p99 đọc đợt < 100 ms, tỷ lệ 5xx < 0,1%, 429 chỉ xuất hiện với client vượt giới hạn.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-4",
        text: "verify-no-oversell xanh sau mỗi lần k6: không oversell, không double-charge",
        lesson: `**Cách tự chấm.** Script \`verify-no-oversell\` chạy sau mỗi lần k6: số đơn không CANCELLED ≤ tồn kho ban đầu; Redis stock + số đơn đã giữ = tồn kho ban đầu; không có 2 payment SUCCESS cho một đơn.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-5",
        text: "Job đối chiếu Redis–PostgreSQL mỗi phút, metric inventory.drift, test ép lệch",
        lesson: `**Cách tự chấm.** Job đối chiếu Redis và PostgreSQL chạy mỗi phút, có metric \`inventory.drift\` và test ép lệch rồi tự sửa.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-6",
        text: "Token hàng chờ: 1 token/user/đợt, TTL 60 giây, dùng một lần",
        lesson: `**Cách tự chấm.** Token hàng chờ: 1 token/user/đợt, TTL 60 giây, dùng một lần; test dùng lại và test token của user khác đều bị từ chối.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-7",
        text: "Rate limit theo user và theo IP, 429 kèm `Retry-After`",
        lesson: `**Cách tự chấm.** Rate limit theo user và theo IP, 429 kèm \`Retry-After\`; test bypass qua \`X-Forwarded-For\` thất bại.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-8",
        text: "Thí nghiệm virtual threads so sánh 3 cấu hình, kết luận thành ADR-004",
        lesson: `**Cách tự chấm.** Thí nghiệm virtual threads có bảng so sánh 3 cấu hình và kết luận ghi thành ADR-004.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-9",
        text: "ADR-0003 (Redis reservation) và ADR-0004 (virtual threads) ở trạng thái Accepted",
        lesson: `**Cách tự chấm.** \`docs/adr/0003-redis-reservation.md\` và \`0004-virtual-threads.md\` ở trạng thái Accepted.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-10",
        text: "`docs/security/attack-log-2.md` có 6 kịch bản",
        lesson: `**Cách tự chấm.** \`docs/security/attack-log-2.md\` có 6 kịch bản; Redis chạy với ACL và mật khẩu riêng cho ứng dụng.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
      {
        id: "fs-gd2-done-11",
        text: "Dòng giai đoạn 2 ở tab chính đổi sang Hoàn thành.",
        lesson: `**Cách tự chấm.** Dòng giai đoạn 2 ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 2 — Definition of Done](#/docs/fs-04)`,
      },
    ],
  },
];
