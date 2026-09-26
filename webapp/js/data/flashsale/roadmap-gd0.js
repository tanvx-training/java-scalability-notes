// Lộ trình FlashSale — Giai đoạn 0: Thiết kế trước khi code.
//
// Nguồn: sources/flashsale/02-giai-doan-0.md (tài liệu fs-02).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd0-done` là Definition of Done (mục 1), cổng gắn tag `v0-design`.
//
// GIỮ NGUYÊN id (fs-gd0-w<tuần tuyệt đối> / fs-gd0-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd0 = [
  {
    id: "fs-gd0-w1",
    week: "Tuần 1",
    title: "Yêu cầu, ước lượng, C4 và ADR",
    goal: "Biến bài toán flash sale thành NFR bằng số, ước lượng khả thi và hai quyết định kiến trúc đầu tiên.",
    doneWhen: "`docs/requirements.md` bản đầu; `docs/estimation.md`; `docs/c4/workspace.dsl` + ảnh PNG; 2 ADR ở trạng thái Accepted.",
    resources: [
      { label: "Giai đoạn 0 — bản đầy đủ", href: "#/docs/fs-02" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Xác định các yêu cầu phi chức năng", href: "#/docs/ddia-02" },
      { label: "Những sự đánh đổi trong kiến trúc hệ thống dữ liệu", href: "#/docs/ddia-01" },
    ],
    items: [
      {
        id: "fs-gd0-w1-1",
        text: "Viết user story và NFR",
        lesson: `**Việc cần làm.** Viết user story và NFR; liệt kê abuse cases

**Đầu ra.** \`docs/requirements.md\` bản đầu

**Đọc thêm.** [Xác định các yêu cầu phi chức năng](#/docs/ddia-02)

**Nguồn.** [Giai đoạn 0 — buổi 1](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w1-2",
        text: "Ước lượng QPS, dung lượng, băng thông",
        lesson: `**Việc cần làm.** Ước lượng QPS, dung lượng, băng thông; đối chiếu NFR có khả thi không

**Đầu ra.** \`docs/estimation.md\`

**Đọc thêm.** [Xác định các yêu cầu phi chức năng](#/docs/ddia-02)

**Nguồn.** [Giai đoạn 0 — buổi 2](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w1-3",
        text: "Vẽ C4 Context và Container bằng Structurizr DSL, render bằng Structurizr Lite",
        lesson: `**Việc cần làm.** Vẽ C4 Context và Container bằng Structurizr DSL, render bằng Structurizr Lite

**Đầu ra.** \`docs/c4/workspace.dsl\` + ảnh PNG

**Nguồn.** [Giai đoạn 0 — buổi 3](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w1-4",
        text: "Viết ADR-001 (modular monolith) và ADR-002 (datastore)",
        lesson: `**Việc cần làm.** Viết ADR-001 (modular monolith) và ADR-002 (datastore); tự phản biện từng phương án thay thế

**Đầu ra.** 2 ADR ở trạng thái Accepted

**Đọc thêm.** [Những sự đánh đổi trong kiến trúc hệ thống dữ liệu](#/docs/ddia-01)

**Nguồn.** [Giai đoạn 0 — buổi 4](#/docs/fs-02)`,
      },
    ],
  },

  {
    id: "fs-gd0-w2",
    week: "Tuần 2",
    title: "Threat model, khung repo và CI",
    goal: "Có threat model sơ bộ, repo build được và CI xanh trước khi viết dòng nghiệp vụ nào.",
    doneWhen: "`docs/security/threat-model-v0.md`; Build local xanh, `docker compose up` chạy; CI xanh trên `main`; Tag `v0-design`.",
    resources: [
      { label: "Giai đoạn 0 — bản đầy đủ", href: "#/docs/fs-02" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd0-w2-1",
        text: "STRIDE trên từng phần tử của DFD",
        lesson: `**Việc cần làm.** STRIDE trên từng phần tử của DFD; nối abuse cases với biện pháp và giai đoạn xử lý

**Đầu ra.** \`docs/security/threat-model-v0.md\`

**Nguồn.** [Giai đoạn 0 — buổi 5](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w2-2",
        text: "Dựng repo: Gradle, Spring Boot 4.1, Modulith, Testcontainers, Docker Compose",
        lesson: `**Việc cần làm.** Dựng repo: Gradle, Spring Boot 4.1, Modulith, Testcontainers, Docker Compose

**Đầu ra.** Build local xanh, \`docker compose up\` chạy

**Nguồn.** [Giai đoạn 0 — buổi 6](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w2-3",
        text: "GitHub Actions: build, test, gitleaks, Dependency-Check",
        lesson: `**Việc cần làm.** GitHub Actions: build, test, gitleaks, Dependency-Check; pre-commit hook

**Đầu ra.** CI xanh trên \`main\`

**Nguồn.** [Giai đoạn 0 — buổi 7](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-w2-4",
        text: "Rà lại Definition of Done, viết README, cập nhật bảng theo dõi, gắn tag",
        lesson: `**Việc cần làm.** Rà lại Definition of Done, viết README, cập nhật bảng theo dõi, gắn tag

**Đầu ra.** Tag \`v0-design\`

**Nguồn.** [Giai đoạn 0 — buổi 8](#/docs/fs-02)`,
      },
    ],
  },

  {
    id: "fs-gd0-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 0 — gắn tag v0-design",
    goal: "Cổng ra của giai đoạn 0. Mốc kiểm tra: README nêu rõ NFR; `docs/adr` có 2 ADR; CI xanh trên commit rỗng; tag `v0-design`. Tick đủ 10 tiêu chí Definition of Done bên dưới rồi mới gắn tag.",
    items: [
      {
        id: "fs-gd0-done-1",
        text: "`README.md` nêu bài toán, 5 NFR và cách chạy dự án trong 3 lệnh.",
        lesson: `**Cách tự chấm.** \`README.md\` nêu bài toán, 5 NFR và cách chạy dự án trong 3 lệnh.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-2",
        text: "`docs/requirements.md` có user story, NFR, abuse cases theo mẫu ở mục 3.",
        lesson: `**Cách tự chấm.** \`docs/requirements.md\` có user story, NFR, abuse cases theo mẫu ở mục 3.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-3",
        text: "`docs/estimation.md` có bảng ước lượng và giả định ở mục 4.",
        lesson: `**Cách tự chấm.** \`docs/estimation.md\` có bảng ước lượng và giả định ở mục 4.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-4",
        text: "C4 workspace.dsl render được, có view SystemContext và Container",
        lesson: `**Cách tự chấm.** \`docs/c4/workspace.dsl\` render được bằng Structurizr Lite, có 2 view: SystemContext và Container.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-5",
        text: "ADR-0001 (modular monolith) và ADR-0002 (datastore) ở trạng thái Accepted",
        lesson: `**Cách tự chấm.** \`docs/adr/0001-modular-monolith.md\` và \`docs/adr/0002-datastores.md\` ở trạng thái Accepted.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-6",
        text: "`docs/security/threat-model-v0.md` có bảng STRIDE theo phần tử DFD ở mục 7.",
        lesson: `**Cách tự chấm.** \`docs/security/threat-model-v0.md\` có bảng STRIDE theo phần tử DFD ở mục 7.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-7",
        text: "Repo build Java 25 + Spring Boot 4.1, test khởi động với Testcontainers",
        lesson: `**Cách tự chấm.** Repo build bằng Java 25, Spring Boot 4.1, có 1 test khởi động context với Testcontainers PostgreSQL.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-8",
        text: "GitHub Actions xanh: build, test, gitleaks, Dependency-Check không CVE Critical",
        lesson: `**Cách tự chấm.** GitHub Actions xanh: build, test, gitleaks, Dependency-Check không có CVE Critical.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-9",
        text: "`docker compose up` chạy được PostgreSQL, Redis, Kafka, Keycloak.",
        lesson: `**Cách tự chấm.** \`docker compose up\` chạy được PostgreSQL, Redis, Kafka, Keycloak.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
      {
        id: "fs-gd0-done-10",
        text: "Dòng \"Giai đoạn 0\" trong bảng theo dõi ở tab chính đổi sang Hoàn thành.",
        lesson: `**Cách tự chấm.** Dòng "Giai đoạn 0" trong bảng theo dõi ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 0 — Definition of Done](#/docs/fs-02)`,
      },
    ],
  },
];
