// Tài liệu lĩnh vực "Lộ trình Senior Java" — 5 tài liệu.
// Nguồn markdown: sources/senior-java/ — được scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/senior-java/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.

export const docs = [
  {
    id: "sj-00",
    field: "senior-java",
    title: "Tổng quan roadmap 24 tháng",
    file: "content/senior-java/00-tong-quan.md",
    icon: "🧭",
    desc: "Bức tranh 4 giai đoạn, tỷ trọng Java/DevOps theo thời gian, nghi thức review hàng quý và quy tắc học xuyên suốt.",
    tags: ["Tổng quan", "Kế hoạch", "Review quý"],
  },
  {
    id: "sj-01",
    field: "senior-java",
    title: "Giai đoạn 1 — Java & Spring chuyên sâu (tháng 1–6)",
    file: "content/senior-java/01-giai-doan-1-java-spring.md",
    icon: "☕",
    desc: "JVM & GC, collections internals, concurrency, Spring IoC/AOP, @Transactional, JPA N+1, index & execution plan, testing với Testcontainers.",
    tags: ["JVM", "Concurrency", "Spring", "JPA", "SQL"],
  },
  {
    id: "sj-02",
    field: "senior-java",
    title: "Giai đoạn 2 — DevOps nền tảng (tháng 6–12)",
    file: "content/senior-java/02-giai-doan-2-devops.md",
    icon: "🔧",
    desc: "Linux thực chiến, networking, image Docker tối ưu, CI/CD GitHub Actions, Prometheus/Grafana/Loki, game day và runbook.",
    tags: ["Linux", "Docker", "CI/CD", "Observability"],
  },
  {
    id: "sj-03",
    field: "senior-java",
    title: "Giai đoạn 3 — Kubernetes, AWS & Terraform (tháng 12–18)",
    file: "content/senior-java/03-giai-doan-3-k8s-cloud.md",
    icon: "☸️",
    desc: "Workload và networking K8s, probe cùng JVM trong container, Helm chart tự viết, HPA, IAM/VPC, EKS và Terraform.",
    tags: ["Kubernetes", "Helm", "AWS", "Terraform"],
  },
  {
    id: "sj-04",
    field: "senior-java",
    title: "Giai đoạn 4 — Distributed Systems & System Design (tháng 18–24)",
    file: "content/senior-java/04-giai-doan-4-system-design.md",
    icon: "🌐",
    desc: "Kafka, outbox và idempotent consumer, Redis caching, resilience patterns, DDIA, design doc và luyện system design.",
    tags: ["Kafka", "Redis", "Resilience", "DDIA", "System Design"],
  },
];
