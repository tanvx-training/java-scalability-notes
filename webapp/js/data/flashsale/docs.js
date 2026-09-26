// Tài liệu lĩnh vực "Pet project FlashSale" — 10 tài liệu.
// Nguồn markdown: sources/flashsale/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/flashsale/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// Không phải sách: chapter/part null (giống senior-java).

export const docs = [
  {
    id: "fs-00", field: "flashsale", chapter: null, part: null,
    title: "FlashSale — Kế hoạch & theo dõi tiến độ",
    file: "content/flashsale/00-ke-hoach-tong-quan.md",
    icon: "🛒",
    desc: "Bài toán 10.000 người tranh 500 sản phẩm, NFR đo được, stack, bảng tiến độ 6 giai đoạn, luồng security và nhật ký ADR.",
    tags: ["Tổng quan", "NFR", "Kế hoạch", "ADR"],
  },
  {
    id: "fs-01", field: "flashsale", chapter: null, part: null,
    title: "Thiết lập môi trường",
    file: "content/flashsale/01-thiet-lap-moi-truong.md",
    icon: "🧰",
    desc: "Yêu cầu máy, công cụ cần cài theo từng giai đoạn, script cài đặt và Makefile, cấu hình IDE, lỗi thường gặp và smoke test.",
    tags: ["Môi trường", "Docker", "Công cụ"],
  },
  {
    id: "fs-02", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 0 — Thiết kế trước khi code",
    file: "content/flashsale/02-giai-doan-0.md",
    icon: "📐",
    desc: "Tuần 1–2: requirements và abuse cases, ước lượng back-of-the-envelope, C4 bằng Structurizr, ADR-001/002, threat model STRIDE, khung repo và CI.",
    tags: ["NFR", "C4", "ADR", "STRIDE", "CI"],
  },
  {
    id: "fs-03", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 1 — Modular monolith chạy đúng",
    file: "content/flashsale/03-giai-doan-1.md",
    icon: "🧱",
    desc: "Tuần 3–6: Spring Modulith, domain và schema V1, hợp đồng API, Idempotency-Key, optimistic locking, Keycloak + Spring Security 7, test đồng thời.",
    tags: ["Spring Modulith", "Idempotency", "Optimistic locking", "Keycloak", "Testcontainers"],
  },
  {
    id: "fs-04", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 2 — Chịu tải flash sale",
    file: "content/flashsale/04-giai-doan-2.md",
    icon: "⚡",
    desc: "Tuần 7–10: phương pháp đo với k6, profiling JFR/async-profiler, Redis Lua trừ kho, token hàng chờ, rate limit, virtual threads và JMH.",
    tags: ["k6", "Profiling", "Redis", "Rate limit", "Virtual threads"],
  },
  {
    id: "fs-05", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 3 — Event-driven và tách service",
    file: "content/flashsale/05-giai-doan-3.md",
    icon: "📨",
    desc: "Tuần 11–15: Kafka và schema registry, outbox với Debezium, saga choreography, consumer idempotent, DLQ, tách order và payment, contract test.",
    tags: ["Kafka", "Outbox", "Saga", "DLQ", "Contract test"],
  },
  {
    id: "fs-06", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 4 — Production-grade",
    file: "content/flashsale/06-giai-doan-4.md",
    icon: "🚀",
    desc: "Tuần 16–19: OpenTelemetry và SLO, image an toàn, kind + Helm, CI ký image kèm SBOM, resilience, chaos engineering, postmortem và runbook.",
    tags: ["Observability", "Kubernetes", "Supply chain", "Resilience", "Chaos"],
  },
  {
    id: "fs-07", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 5 — Góc nhìn Solution Architect",
    file: "content/flashsale/07-giai-doan-5.md",
    icon: "🏛️",
    desc: "Tuần 20–24: SAD theo arc42, threat model đầy đủ và risk register, TCO ba phương án và ADR-008, Well-Architected, GraalVM native, tech talk.",
    tags: ["arc42", "TCO", "Well-Architected", "GraalVM", "Solution Architect"],
  },
  {
    id: "fs-08", field: "flashsale", chapter: null, part: null,
    title: "Security xuyên suốt",
    file: "content/flashsale/08-security.md",
    icon: "🛡️",
    desc: "Vòng xây–tấn công–sửa qua 6 giai đoạn: bộ công cụ, mẫu attack log, secure coding cho Spring, secrets, supply chain, ASVS mức 2 và playbook sự cố.",
    tags: ["Security", "OWASP", "ASVS", "Threat model"],
  },
  {
    id: "fs-09", field: "flashsale", chapter: null, part: null,
    title: "Quy ước làm việc và tự đánh giá",
    file: "content/flashsale/09-quy-uoc-tu-danh-gia.md",
    icon: "📏",
    desc: "Nhịp tuần, git workflow một người, quy trình ADR, Definition of Done chung, nhật ký học, bảng tự đánh giá Senior/SA, rủi ro và ngân sách.",
    tags: ["Quy ước", "ADR", "Tự đánh giá", "Git"],
  },
];
