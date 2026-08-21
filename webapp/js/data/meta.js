// Danh mục dùng chung cho toàn bộ dữ liệu học tập.
// Mọi câu hỏi / flashcard / lab đều tham chiếu các key ở đây.

export const CERTS = {
  KCNA: { label: "KCNA", color: "teal" },
  KCSA: { label: "KCSA", color: "cyan" },
  CKAD: { label: "CKAD", color: "blue" },
  CKA: { label: "CKA", color: "indigo" },
  CKS: { label: "CKS", color: "purple" },
};

// Domain theo curriculum CKAD (kèm tỷ trọng điểm), cộng thêm nhóm mở rộng
// cho câu hỏi thuộc CKA / CKS / KCNA.
export const DOMAINS = {
  design: {
    label: "Application Design and Build",
    short: "Design & Build",
    weight: 20,
    cert: "CKAD",
  },
  deployment: {
    label: "Application Deployment",
    short: "Deployment",
    weight: 20,
    cert: "CKAD",
  },
  observability: {
    label: "Application Observability and Maintenance",
    short: "Observability",
    weight: 15,
    cert: "CKAD",
  },
  config: {
    label: "Application Environment, Configuration and Security",
    short: "Config & Security",
    weight: 25,
    cert: "CKAD",
  },
  networking: {
    label: "Services and Networking",
    short: "Services & Networking",
    weight: 20,
    cert: "CKAD",
  },
  "cka-core": {
    label: "CKA — Cluster Administration",
    short: "CKA Core",
    weight: 0,
    cert: "CKA",
  },
  "cks-core": {
    label: "CKS — Cluster Security",
    short: "CKS Core",
    weight: 0,
    cert: "CKS",
  },
  "kcna-core": {
    label: "KCNA — Cloud Native Fundamentals",
    short: "KCNA Core",
    weight: 0,
    cert: "KCNA",
  },
};

// Chủ đề flashcard.
export const TOPICS = {
  architecture: { label: "Kiến trúc K8s" },
  pods: { label: "Pods & Multi-container" },
  workloads: { label: "Deployments, Jobs, CronJobs" },
  config: { label: "ConfigMaps & Secrets" },
  resources: { label: "Resources & Quota" },
  security: { label: "Security & RBAC" },
  observability: { label: "Probes & Debugging" },
  networking: { label: "Services, Ingress, NetworkPolicy" },
  storage: { label: "Volumes, PV & PVC" },
  helm: { label: "Helm & Kustomize" },
  kubectl: { label: "kubectl & Imperative" },
  "exam-tips": { label: "Mẹo phòng thi" },
};

// Nhóm lệnh cho trang tra cứu kubectl.
export const COMMAND_CATEGORIES = {
  setup: { label: "Setup & Context" },
  cluster: { label: "Cluster Admin (kubeadm, etcd)" },
  node: { label: "Node & Runtime" },
  sectools: { label: "Security Tools" },
  pods: { label: "Pods" },
  workloads: { label: "Deployments, Jobs, CronJobs" },
  config: { label: "ConfigMaps & Secrets" },
  security: { label: "Security & RBAC" },
  networking: { label: "Services & Networking" },
  storage: { label: "Volumes & PVC" },
  helm: { label: "Helm & Kustomize" },
  debug: { label: "Debug & Observability" },
  output: { label: "Output & JSONPath" },
};

export const DIFFICULTY = {
  1: { label: "Dễ", color: "green" },
  2: { label: "Trung bình", color: "amber" },
  3: { label: "Khó", color: "red" },
};
