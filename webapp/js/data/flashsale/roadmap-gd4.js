// Lộ trình FlashSale — Giai đoạn 4: Production-grade.
//
// Nguồn: sources/flashsale/06-giai-doan-4.md (tài liệu fs-06).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd4-done` là Definition of Done (mục 1), cổng gắn tag `v4-prod`.
//
// GIỮ NGUYÊN id (fs-gd4-w<tuần tuyệt đối> / fs-gd4-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd4 = [
  {
    id: "fs-gd4-w16",
    week: "Tuần 16",
    title: "Observability trên Compose",
    goal: "Có trace, metric, log và SLO ngay trên Compose trước khi chuyển lên Kubernetes.",
    doneWhen: "Một trace qua 3 service; Panel metric nghiệp vụ; Lọc log theo traceId; Dashboard + alert rule.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/fs-06" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Triển khai Observability trong Java", href: "#/docs/ocnj-11" },
      { label: "Giới thiệu về Observability", href: "#/docs/ocnj-10" },
    ],
    items: [
      {
        id: "fs-gd4-w16-1",
        text: "Micrometer Tracing + OpenTelemetry bridge + OTLP exporter cho 3 service",
        lesson: `**Việc cần làm.** Micrometer Tracing + OpenTelemetry bridge + OTLP exporter cho 3 service; propagation qua Kafka (\`traceparent\` trong header, Spring Kafka observation); Tempo + Grafana trong Compose

**Đầu ra.** Một trace qua 3 service

**Đọc thêm.** [Triển khai Observability trong Java](#/docs/ocnj-11) · [Giới thiệu về Observability](#/docs/ocnj-10)

**Nguồn.** [Giai đoạn 4 — buổi 1](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w16-2",
        text: "Metric RED cho HTTP và Kafka listener cùng metric nghiệp vụ",
        lesson: `**Việc cần làm.** Metric: RED cho HTTP và Kafka listener, \`order.confirm.latency\`, \`saga.stuck\`, \`inventory.drift\`, \`inventory.compensation\`, \`ratelimit.rejected\`; Prometheus scrape qua OTel Collector

**Đầu ra.** Panel metric nghiệp vụ

**Đọc thêm.** [Triển khai Observability trong Java](#/docs/ocnj-11)

**Nguồn.** [Giai đoạn 4 — buổi 2](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w16-3",
        text: "Log JSON có traceId, spanId, che token và PII; đẩy vào Loki",
        lesson: `**Việc cần làm.** Log JSON (Logback + \`logstash-logback-encoder\`) có \`traceId\`, \`spanId\`, \`sub\` masked; Loki qua OTel Collector; mask token và PII

**Đầu ra.** Lọc log theo traceId

**Nguồn.** [Giai đoạn 4 — buổi 3](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w16-4",
        text: "4 SLI/SLO, dashboard SLO, alert multiwindow burn rate kèm runbook",
        lesson: `**Việc cần làm.** Định nghĩa 4 SLI/SLO, recording rules, dashboard SLO, alert multiwindow burn rate; runbook link trong alert

**Đầu ra.** Dashboard + alert rule

**Đọc thêm.** [Giới thiệu về Observability](#/docs/ocnj-10)

**Nguồn.** [Giai đoạn 4 — buổi 4](#/docs/fs-06)`,
      },
    ],
  },

  {
    id: "fs-gd4-w17",
    week: "Tuần 17",
    title: "Đóng gói và lên kind",
    goal: "Image an toàn, cụm kind đủ hạ tầng và bốn đường saga chạy end-to-end trên cụm.",
    doneWhen: "3 image local; Cụm nền; 3 service chạy trên kind; E2E xanh trên kind.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/fs-06" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Triển khai Java trên Cloud", href: "#/docs/ocnj-09" },
      { label: "Triển khai một Kubernetes Cluster", href: "#/docs/kuar-03" },
    ],
    items: [
      {
        id: "fs-gd4-w17-1",
        text: "Dockerfile multi-stage, layered jar, AOT cache Java 25, non-root, read-only",
        lesson: `**Việc cần làm.** Dockerfile multi-stage, layered jar, AOT cache Java 25, non-root, read-only; \`docker scout\` hoặc Trivy local; healthcheck

**Đầu ra.** 3 image local

**Đọc thêm.** [Triển khai Java trên Cloud](#/docs/ocnj-09)

**Nguồn.** [Giai đoạn 4 — buổi 5](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w17-2",
        text: "Cụm kind 3 node với Strimzi, CloudNativePG, Redis Sentinel, Grafana",
        lesson: `**Việc cần làm.** kind với 3 node; Strimzi, CloudNativePG, Redis Sentinel, ingress-nginx, Grafana stack bằng Helm; \`make cluster-up\`

**Đầu ra.** Cụm nền

**Đọc thêm.** [Triển khai một Kubernetes Cluster](#/docs/kuar-03)

**Nguồn.** [Giai đoạn 4 — buổi 6](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w17-3",
        text: "Helm chart cho 3 service (umbrella `deploy/flashsale`)",
        lesson: `**Việc cần làm.** Helm chart cho 3 service (umbrella \`deploy/flashsale\`); probe, resource, PDB, graceful shutdown; ConfigMap, Secret; ingress thay Traefik

**Đầu ra.** 3 service chạy trên kind

**Đọc thêm.** [Deployment](#/docs/kuar-10) · [ConfigMap và Secret](#/docs/kuar-13)

**Nguồn.** [Giai đoạn 4 — buổi 7](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w17-4",
        text: "Debezium, Keycloak, Apicurio, gateway mock lên kind; saga E2E trên kind",
        lesson: `**Việc cần làm.** Strimzi KafkaConnect + Debezium connector CRD, Keycloak, Apicurio, gateway mock lên kind; end-to-end 4 đường saga chạy trên kind

**Đầu ra.** E2E xanh trên kind

**Nguồn.** [Giai đoạn 4 — buổi 8](#/docs/fs-06)`,
      },
    ],
  },

  {
    id: "fs-gd4-w18",
    week: "Tuần 18",
    title: "Pipeline supply chain và resilience",
    goal: "CI ký image kèm SBOM, GitOps với Kyverno, resilience và autoscaling dưới tải.",
    doneWhen: "Image có chữ ký trên GHCR; GitOps chạy; Failover Redis xanh; Bảng scale.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/fs-06" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Chính sách và quản trị cho Cluster", href: "#/docs/kuar-20" },
      { label: "Giải phẫu các Timeout", href: "#/docs/java-02" },
    ],
    items: [
      {
        id: "fs-gd4-w18-1",
        text: "CI: buildx, SBOM Syft, Trivy, cosign keyless, attest, push GHCR",
        lesson: `**Việc cần làm.** CI: buildx, Syft SBOM, Trivy, cosign keyless (OIDC GitHub), attest SBOM và provenance, push GHCR

**Đầu ra.** Image có chữ ký trên GHCR

**Nguồn.** [Giai đoạn 4 — buổi 9](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w18-2",
        text: "Argo CD (app-of-apps), CI commit tag vào `deploy/values/`",
        lesson: `**Việc cần làm.** Argo CD (app-of-apps), CI commit tag vào \`deploy/values/\`; Kyverno: verifyImages, disallow-latest, require-resources, PSS restricted; test image không ký bị từ chối

**Đầu ra.** GitOps chạy

**Đọc thêm.** [Chính sách và quản trị cho Cluster](#/docs/kuar-20)

**Nguồn.** [Giai đoạn 4 — buổi 10](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w18-3",
        text: "Resilience4j (circuit breaker, bulkhead, timeout) cho payment-service và Redis",
        lesson: `**Việc cần làm.** Resilience4j (circuit breaker, bulkhead, timeout) cho payment-service và Redis; Lettuce với Sentinel; ShedLock cho 3 job; xử lý L1 cache lệch giữa instance

**Đầu ra.** Failover Redis xanh

**Đọc thêm.** [Giải phẫu các Timeout](#/docs/java-02) · [Tomcat Thread Pool Internals](#/docs/java-06)

**Nguồn.** [Giai đoạn 4 — buổi 11](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w18-4",
        text: "HPA order-service, KEDA cho consumer, PDB",
        lesson: `**Việc cần làm.** HPA order-service, KEDA cho consumer, PDB; k6 chạy trong cụm (\`k6-operator\` hoặc Job); test scale lên và xuống; rolling update dưới tải

**Đầu ra.** Bảng scale

**Nguồn.** [Giai đoạn 4 — buổi 12](#/docs/fs-06)`,
      },
    ],
  },

  {
    id: "fs-gd4-w19",
    week: "Tuần 19",
    title: "Security cụm, chaos và postmortem",
    goal: "Khoá cụm, chaos có kiểm chứng SLO, postmortem sự cố giả lập và gắn tag `v4-prod`.",
    doneWhen: "Attack log 3 dòng; Kết quả chaos; `docs/postmortem-001.md`; Tag `v4-prod`.",
    resources: [
      { label: "Giai đoạn 4 — bản đầy đủ", href: "#/docs/fs-06" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Bảo mật ứng dụng trong Kubernetes", href: "#/docs/kuar-19" },
      { label: "Kiểm soát truy cập dựa trên vai trò (RBAC)", href: "#/docs/kuar-14" },
    ],
    items: [
      {
        id: "fs-gd4-w19-1",
        text: "NetworkPolicy default-deny + allowlist",
        lesson: `**Việc cần làm.** NetworkPolicy default-deny + allowlist; PSS restricted; RBAC tối thiểu; kube-bench; ZAP baseline và schemathesis vào CI; buổi tấn công 7

**Đầu ra.** Attack log 3 dòng

**Đọc thêm.** [Bảo mật ứng dụng trong Kubernetes](#/docs/kuar-19) · [Kiểm soát truy cập dựa trên vai trò (RBAC)](#/docs/kuar-14)

**Nguồn.** [Giai đoạn 4 — buổi 13](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w19-2",
        text: "Chaos Mesh: pod kill, network delay, Redis master kill, node drain, CPU stress",
        lesson: `**Việc cần làm.** Chaos Mesh: pod kill, network delay, Redis master kill, node drain, CPU stress; đối chiếu dashboard và alert; buổi tấn công 8 nếu còn giờ

**Đầu ra.** Kết quả chaos

**Đọc thêm.** [Những rắc rối của hệ phân tán](#/docs/ddia-09)

**Nguồn.** [Giai đoạn 4 — buổi 14](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w19-3",
        text: "Sự cố giả lập (mục 10.1) chạy như thật, viết postmortem, 4 runbook",
        lesson: `**Việc cần làm.** Sự cố giả lập (mục 10.1) chạy như thật, viết postmortem, 4 runbook

**Đầu ra.** \`docs/postmortem-001.md\`

**Nguồn.** [Giai đoạn 4 — buổi 15](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-w19-4",
        text: "Cập nhật C4 Deployment view, README, rà Definition of Done, tag",
        lesson: `**Việc cần làm.** Cập nhật C4 Deployment view, README, rà Definition of Done, tag

**Đầu ra.** Tag \`v4-prod\`

**Nguồn.** [Giai đoạn 4 — buổi 16](#/docs/fs-06)`,
      },
    ],
  },

  {
    id: "fs-gd4-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 4 — gắn tag v4-prod",
    goal: "Cổng ra của giai đoạn 4: tick đủ 13 tiêu chí Definition of Done mới gắn tag `v4-prod` và đổi dòng giai đoạn trong bảng tiến độ sang Hoàn thành.",
    items: [
      {
        id: "fs-gd4-done-1",
        text: "Trace end-to-end qua 3 service và Kafka; log lọc được theo traceId",
        lesson: `**Cách tự chấm.** Trace end-to-end trong Tempo: một \`traceId\` đi qua 3 service và qua Kafka (span \`order.placed publish\` → \`inventory consume\`); log của cả 3 service lọc được bằng \`traceId\` đó trong Loki.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-2",
        text: "Dashboard SLO có error budget, burn rate; alert đã bắn thử trong chaos",
        lesson: `**Cách tự chấm.** Dashboard Grafana \`FlashSale SLO\` có 4 SLI ở mục 3.3, error budget còn lại 30 ngày, và panel burn rate; alert rule multiwindow (1 giờ / 6 giờ) đã bắn thử một lần trong chaos test.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-3",
        text: "Ba image non-root, read-only, khởi động < 3 giây, dưới 200 MB",
        lesson: `**Cách tự chấm.** Ba image build từ CI, chạy non-root, filesystem read-only, \`USER 10001\`, startup dưới 3 giây nhờ AOT cache, kích thước dưới 200 MB.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-4",
        text: "make cluster-up dựng đủ hạ tầng trên kind trong 15 phút, không thao tác tay",
        lesson: `**Cách tự chấm.** \`kind create cluster\` + \`make cluster-up\` dựng đủ: Strimzi Kafka + Connect + Debezium, CloudNativePG, Redis Sentinel, Keycloak, Apicurio, gateway mock, ingress-nginx, Grafana stack, Argo CD, Kyverno, KEDA, Chaos Mesh, trong 15 phút không cần thao tác tay.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-5",
        text: "Helm chart có probe, resource, PDB, graceful shutdown; rolling update 0 5xx",
        lesson: `**Cách tự chấm.** Helm chart cho 3 service: startup/readiness/liveness probe, requests và limits, PDB \`minAvailable: 1\`, \`terminationGracePeriodSeconds\` 30 với preStop, \`server.shutdown=graceful\`; rolling update không có 5xx khi k6 chạy.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-6",
        text: "HPA order-service 2–6 replica theo CPU 60%",
        lesson: `**Cách tự chấm.** HPA order-service 2–6 replica theo CPU 60%; KEDA scale consumer \`inventory\` theo lag Kafka; test tải trên kind thấy scale lên và xuống.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-7",
        text: "Pipeline ký image, attest SBOM, GitOps; Kyverno chặn image không chữ ký",
        lesson: `**Cách tự chấm.** Pipeline: test → build image (buildx) → SBOM (Syft, SPDX) → Trivy (fail High/Critical) → cosign sign keyless + attest SBOM → push GHCR → commit tag mới vào \`deploy/values/\` → Argo CD sync; Kyverno từ chối image không chữ ký hoặc tag \`latest\` (test bằng một image cố tình không ký).

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-8",
        text: "Circuit breaker mở và đóng đúng lúc, thấy trên dashboard, đặt hàng vẫn chạy",
        lesson: `**Cách tự chấm.** Resilience4j: circuit breaker mở khi gateway mock trả lỗi 50% trong 10 giây và đóng lại sau khi phục hồi; dashboard thấy trạng thái; đặt hàng không bị ảnh hưởng.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-9",
        text: "Redis Sentinel: kill master giữa k6",
        lesson: `**Cách tự chấm.** Redis Sentinel: kill master giữa k6; Lettuce chuyển sang master mới trong 10 giây; \`verify-no-oversell\` xanh; ghi rõ số request lỗi trong cửa sổ failover.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-10",
        text: "NetworkPolicy default-deny ở namespace `flashsale`",
        lesson: `**Cách tự chấm.** NetworkPolicy default-deny ở namespace \`flashsale\`; Pod Security \`restricted\`; kube-bench không có FAIL ở mức cluster mình kiểm soát; ZAP baseline và schemathesis chạy trong CI, không có High.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-11",
        text: "Chaos Mesh: 5 kịch bản ở mục 9 có kết quả",
        lesson: `**Cách tự chấm.** Chaos Mesh: 5 kịch bản ở mục 9 có kết quả; \`docs/postmortem-001.md\` theo mẫu mục 10; 4 runbook trong \`docs/runbooks/\`.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-12",
        text: "`docs/security/attack-log-4.md` có 6 kịch bản",
        lesson: `**Cách tự chấm.** \`docs/security/attack-log-4.md\` có 6 kịch bản; realm Keycloak import lên kind **không** có client \`flashsale-cli\`.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
      {
        id: "fs-gd4-done-13",
        text: "Dòng giai đoạn 4 ở tab chính đổi sang Hoàn thành.",
        lesson: `**Cách tự chấm.** Dòng giai đoạn 4 ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 4 — Definition of Done](#/docs/fs-06)`,
      },
    ],
  },
];
