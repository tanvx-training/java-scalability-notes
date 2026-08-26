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
    field: "kubernetes",
  },
  deployment: {
    label: "Application Deployment",
    short: "Deployment",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
  observability: {
    label: "Application Observability and Maintenance",
    short: "Observability",
    weight: 15,
    cert: "CKAD",
    field: "kubernetes",
  },
  config: {
    label: "Application Environment, Configuration and Security",
    short: "Config & Security",
    weight: 25,
    cert: "CKAD",
    field: "kubernetes",
  },
  networking: {
    label: "Services and Networking",
    short: "Services & Networking",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
  "cka-core": {
    label: "CKA — Cluster Administration",
    short: "CKA Core",
    weight: 0,
    cert: "CKA",
    field: "kubernetes",
  },
  "cks-core": {
    label: "CKS — Cluster Security",
    short: "CKS Core",
    weight: 0,
    cert: "CKS",
    field: "kubernetes",
  },
  "kcna-core": {
    label: "KCNA — Cloud Native Fundamentals",
    short: "KCNA Core",
    weight: 0,
    cert: "KCNA",
    field: "kubernetes",
  },

  // ===== System Programming (chương nguồn trong ngoặc) =====
  "sp-c":           { label: "C & Bộ nhớ",               short: "C & Bộ nhớ",     weight: 0, field: "sysprog" }, // ch 2, 3, 5
  "sp-process":     { label: "Tiến trình & Tín hiệu",    short: "Tiến trình",     weight: 0, field: "sysprog" }, // ch 4, 13
  "sp-concurrency": { label: "Luồng & Đồng bộ hoá",      short: "Đồng bộ hoá",    weight: 0, field: "sysprog" }, // ch 6, 7
  "sp-deadlock":    { label: "Deadlock & Lập lịch",      short: "Deadlock",       weight: 0, field: "sysprog" }, // ch 8, 10
  "sp-memory-ipc":  { label: "Bộ nhớ ảo & IPC",          short: "Bộ nhớ ảo & IPC", weight: 0, field: "sysprog" }, // ch 9
  "sp-io":          { label: "Hệ thống tệp & Mạng",      short: "Tệp & Mạng",     weight: 0, field: "sysprog" }, // ch 11, 12
  "sp-security":    { label: "Bảo mật",                  short: "Bảo mật",        weight: 0, field: "sysprog" }, // ch 14
};

// Chủ đề flashcard.
export const TOPICS = {
  architecture: { label: "Kiến trúc K8s", field: "kubernetes" },
  pods: { label: "Pods & Multi-container", field: "kubernetes" },
  workloads: { label: "Deployments, Jobs, CronJobs", field: "kubernetes" },
  config: { label: "ConfigMaps & Secrets", field: "kubernetes" },
  resources: { label: "Resources & Quota", field: "kubernetes" },
  security: { label: "Security & RBAC", field: "kubernetes" },
  observability: { label: "Probes & Debugging", field: "kubernetes" },
  networking: { label: "Services, Ingress, NetworkPolicy", field: "kubernetes" },
  storage: { label: "Volumes, PV & PVC", field: "kubernetes" },
  helm: { label: "Helm & Kustomize", field: "kubernetes" },
  kubectl: { label: "kubectl & Imperative", field: "kubernetes" },
  "exam-tips": { label: "Mẹo phòng thi", field: "kubernetes" },

  // ===== System Programming (chương nguồn trong ngoặc) =====
  "sp-c":           { label: "C & Bộ nhớ",               field: "sysprog" }, // ch 2, 3, 5
  "sp-process":     { label: "Tiến trình & Tín hiệu",    field: "sysprog" }, // ch 4, 13
  "sp-concurrency": { label: "Luồng & Đồng bộ hoá",      field: "sysprog" }, // ch 6, 7
  "sp-deadlock":    { label: "Deadlock & Lập lịch",      field: "sysprog" }, // ch 8, 10
  "sp-memory-ipc":  { label: "Bộ nhớ ảo & IPC",          field: "sysprog" }, // ch 9
  "sp-io":          { label: "Hệ thống tệp & Mạng",      field: "sysprog" }, // ch 11, 12
  "sp-security":    { label: "Bảo mật",                  field: "sysprog" }, // ch 14
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
