// Chương trình thực hành CKA — meta, đề thi, môi trường lab, project, chặng.
// Buổi nằm ở stage-NN.js, kỹ năng ở skills.js, đề mock ở mocks.js; ráp lại ở
// data/practice/index.js. `project.pieces[].sinceSession` KHÔNG khai ở đây:
// index.js suy ra từ `session.pieces` để không phải khai hai nơi.
//
// Đối chiếu nguồn chính thức ngày 2026-11-13: curriculum CNCF bản v1.37
// (github.com/cncf/curriculum, CKA_Curriculum_v1.37.pdf) và trang kỳ thi CKA của
// Linux Foundation (đề chạy Kubernetes v1.37). Năng lực và tỷ trọng dưới đây
// chép đúng bản đó.

export const program = {
  id: "cka",
  field: "kubernetes",
  label: "CKA",
  icon: "🛠️",
  name: "Thực hành CKA: dựng và vận hành một hệ thống Spring Boot trên cluster kubeadm",
  // Mảng kỹ năng: mỗi kỹ năng trong skills.js khai `area` là một id ở đây, và id kỹ năng phải bắt đầu bằng
  // `prefix` của mảng đó (check-data PR5). `label` hiện trên bản đồ kỹ năng và khối nền tảng của buổi.
  skillAreas: [
    { id: "kubernetes", label: "Kubernetes", prefix: "k-" },
    { id: "vim", label: "vim", prefix: "vim-" },
    { id: "linux", label: "Linux", prefix: "lx-" },
    { id: "network", label: "Network", prefix: "net-" },
  ],
  exam: {
    k8sVersion: "1.37",
    curriculum: {
      version: "1.37",
      href: "https://github.com/cncf/curriculum/blob/master/CKA_Curriculum_v1.37.pdf",
      checkedOn: "2026-11-13",
    },
    infoHref: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
    passPct: 66,
    durationMin: 120,
    domains: [
      { id: "troubleshooting", label: "Troubleshooting", weight: 30 },
      { id: "architecture", label: "Cluster Architecture, Installation and Configuration", weight: 25 },
      { id: "networking", label: "Services and Networking", weight: 20 },
      { id: "workloads", label: "Workloads and Scheduling", weight: 15 },
      { id: "storage", label: "Storage", weight: 10 },
    ],
    competencies: [
      { id: "ar-rbac", domain: "architecture", text: "Manage role based access control (RBAC)" },
      { id: "ar-infra", domain: "architecture", text: "Prepare underlying infrastructure for installing a Kubernetes cluster" },
      { id: "ar-kubeadm", domain: "architecture", text: "Create and manage Kubernetes clusters using kubeadm" },
      { id: "ar-lifecycle", domain: "architecture", text: "Manage the lifecycle of Kubernetes clusters" },
      { id: "ar-ha", domain: "architecture", text: "Implement and configure a highly-available control plane" },
      { id: "ar-helm-kustomize", domain: "architecture", text: "Use Helm and Kustomize to install cluster components" },
      { id: "ar-ext", domain: "architecture", text: "Understand extension interfaces (CNI, CSI, CRI, etc.)" },
      { id: "ar-crd", domain: "architecture", text: "Understand CRDs, install and configure operators" },
      { id: "wl-deploy-rollout", domain: "workloads", text: "Understand application deployments and how to perform rolling update and rollbacks" },
      { id: "wl-config", domain: "workloads", text: "Use ConfigMaps and Secrets to configure applications" },
      { id: "wl-autoscale", domain: "workloads", text: "Configure workload autoscaling" },
      { id: "wl-selfheal", domain: "workloads", text: "Understand the primitives used to create robust, self-healing, application deployments" },
      { id: "wl-admission-sched", domain: "workloads", text: "Configure Pod admission and scheduling (limits, node affinity, etc.)" },
      { id: "nw-pod-conn", domain: "networking", text: "Understand connectivity between Pods" },
      { id: "nw-netpol", domain: "networking", text: "Define and enforce Network Policies" },
      { id: "nw-svc", domain: "networking", text: "Use ClusterIP, NodePort, LoadBalancer service types and endpoints" },
      { id: "nw-gateway", domain: "networking", text: "Use the Gateway API to manage Ingress traffic" },
      { id: "nw-ingress", domain: "networking", text: "Know how to use Ingress controllers and Ingress resources" },
      { id: "nw-dns", domain: "networking", text: "Understand and use CoreDNS" },
      { id: "st-sc-dynamic", domain: "storage", text: "Implement storage classes and dynamic volume provisioning" },
      { id: "st-volume-types", domain: "storage", text: "Configure volume types, access modes and reclaim policies" },
      { id: "st-pv-pvc", domain: "storage", text: "Manage persistent volumes and persistent volume claims" },
      { id: "ts-nodes", domain: "troubleshooting", text: "Troubleshoot clusters and nodes" },
      { id: "ts-components", domain: "troubleshooting", text: "Troubleshoot cluster components" },
      { id: "ts-monitor", domain: "troubleshooting", text: "Monitor cluster and application resource usage" },
      { id: "ts-logs", domain: "troubleshooting", text: "Manage and evaluate container output streams" },
      { id: "ts-net", domain: "troubleshooting", text: "Troubleshoot services and networking" },
    ],
  },
  env: {
    tool: "multipass",
    image: "24.04",
    // Cluster cài thấp hơn đề một minor để buổi nâng cấp (s42) lên đúng bản thi.
    k8sInstallMinor: "1.36",
    k8sTargetMinor: "1.37",
    vms: [
      { name: "cka-cp", role: "control plane", cpus: 2, memGB: 3, diskGB: 20 },
      { name: "cka-w1", role: "worker", cpus: 2, memGB: 2, diskGB: 15 },
      { name: "cka-w2", role: "worker", cpus: 2, memGB: 2, diskGB: 15 },
    ],
    // Chạy từ gốc repo trên máy Mac. <session>, <mock>, <id> là chỗ điền.
    commands: {
      up: "./labs/lab up cka",
      down: "./labs/lab down cka",
      status: "./labs/lab status cka",
      shell: "multipass shell cka-cp",
      begin: "./labs/lab begin cka <session>",
      check: "./labs/lab check cka <session>",
      verify: "./labs/lab verify cka <session>",
      restore: "./labs/lab restore cka <session>",
      break: "./labs/lab break cka <id>",
      images: "./labs/lab images cka",
      mockStart: "./labs/lab mock cka <mock> start",
      mockScore: "./labs/lab mock cka <mock> score",
      selftest: "./labs/lab selftest cka",
      destroy: "./labs/lab destroy cka",
    },
  },
  project: {
    summary:
      "Hệ thống \"shop\" gồm ba service Spring Boot viết sẵn — `gateway` (cửa vào, gọi hai service kia), " +
      "`catalog` (đọc sản phẩm từ PostgreSQL) và `order` (ghi đơn hàng, gọi `catalog`) — cùng một PostgreSQL. " +
      "Bạn không viết Java trong buổi học: mỗi chặng đưa hệ thống tiến thêm một bước trên cluster 3 node tự dựng bằng kubeadm, " +
      "tới trạng thái cuối cài bằng Helm chart, có Ingress và Gateway API, NetworkPolicy mặc định chặn, RBAC cho hai vai " +
      "\"dev\" và \"ops\", PostgreSQL trên StatefulSet giữ dữ liệu, requests/limits và HPA, đã qua một lần nâng cấp cluster " +
      "và một lần khôi phục etcd.",
    architectureMd: [
      "```mermaid",
      "flowchart LR",
      "  mac[Máy Mac: curl / trình duyệt] --> edge[Ingress / Gateway API]",
      "  edge --> gw[gateway]",
      "  gw --> cat[catalog]",
      "  gw --> ord[order]",
      "  ord --> cat",
      "  cat --> pg[(PostgreSQL<br/>StatefulSet + PVC)]",
      "  ord --> pg",
      "```",
      "",
      "Cả hệ thống chạy trên cluster kubeadm 3 node: `cka-cp` (control plane) và hai worker `cka-w1`, `cka-w2`, " +
        "mỗi node là một VM Multipass. Image build trên Mac rồi nạp thẳng vào containerd của từng node (`./labs/lab images cka`), " +
        "không cần registry.",
    ].join("\n"),
    pieces: [
      { id: "vms", label: "Ba VM" },
      { id: "images", label: "Image shop" },
      { id: "cluster", label: "Cluster kubeadm 3 node" },
      { id: "deployments", label: "Ba service Spring Boot" },
      { id: "config", label: "ConfigMap và Secret" },
      { id: "probes", label: "Probe và graceful shutdown" },
      { id: "resources", label: "Requests và limits" },
      { id: "hpa", label: "HPA" },
      { id: "postgres", label: "PostgreSQL bền vững" },
      { id: "services", label: "Service" },
      { id: "ingress", label: "Ingress" },
      { id: "gateway-api", label: "Gateway API" },
      { id: "netpol", label: "NetworkPolicy" },
      { id: "rbac", label: "RBAC dev và ops" },
      { id: "helm", label: "Helm chart" },
      { id: "upgraded", label: "Cluster đã nâng cấp" },
      { id: "etcd-restore", label: "Đã khôi phục etcd" },
    ],
  },
  stages: [
    {
      id: "st0",
      title: "Môi trường và kỹ năng nền",
      goal: "Có 3 VM lab và đủ tay nghề vim, tmux, bash, Linux quản trị, Linux network và container thuần để không bị chậm ở phòng thi vì thứ không phải Kubernetes.",
      projectMilestone: "3 VM sẵn sàng, bộ lệnh lab chạy được",
      sessions: ["s01", "s02", "s03", "s04", "s05"],
    },
    {
      id: "st1",
      title: "Dựng cluster",
      goal: "Tự dựng cluster 3 node bằng kubeadm từ VM trống và hiểu từng mảnh nó đặt lên đĩa: static pod, PKI, kubeconfig, CRI/CNI.",
      projectMilestone: "Cluster 3 node Ready tự dựng",
      sessions: ["s06", "s07", "s08", "s09"],
    },
    {
      id: "st2",
      title: "Workload",
      goal: "Chạy ba service shop bằng Pod, Deployment, ConfigMap/Secret, probe; cập nhật và rollback không rớt request; dùng DaemonSet, Job, CronJob.",
      projectMilestone: "3 service chạy, cấu hình tách khỏi image",
      sessions: ["s10", "s11", "s12", "s13", "s14", "s15", "s16"],
    },
    {
      id: "st3",
      title: "Scheduling và tài nguyên",
      goal: "Đặt requests/limits hợp với JVM, khoá namespace bằng quota và LimitRange, điều khiển Pod chạy ở node nào, và để HPA tự co giãn.",
      projectMilestone: "App có giới hạn tài nguyên, tự co giãn",
      sessions: ["s17", "s18", "s19", "s20", "s21"],
    },
    {
      id: "st4",
      title: "Storage",
      goal: "Cấp lưu trữ bền cho PostgreSQL bằng PV/PVC, StorageClass động và StatefulSet; hiểu access mode và reclaim policy.",
      projectMilestone: "PostgreSQL giữ dữ liệu qua restart và dời node",
      sessions: ["s22", "s23", "s24", "s25"],
    },
    {
      id: "st5",
      title: "Networking",
      goal: "Nắm mô hình mạng Pod và CNI, các loại Service và kube-proxy, CoreDNS, đưa shop ra ngoài bằng Ingress và Gateway API, khoá mạng nội bộ bằng NetworkPolicy.",
      projectMilestone: "Gọi được từ máy Mac, mạng nội bộ khoá đúng mức",
      sessions: ["s26", "s27", "s28", "s29", "s30", "s31", "s32"],
    },
    {
      id: "st6",
      title: "Bảo mật truy cập",
      goal: "Cấp danh tính cho người dùng mới bằng PKI và CSR, ghép kubeconfig, phân quyền bằng RBAC và ServiceAccount.",
      projectMilestone: "Vai \"dev\" và \"ops\" với quyền khác nhau",
      sessions: ["s33", "s34", "s35", "s36"],
    },
    {
      id: "st7",
      title: "Đóng gói và mở rộng",
      goal: "Đóng gói shop thành Helm chart, quản lý môi trường bằng Kustomize, cài và dùng CRD cùng operator.",
      projectMilestone: "Cả hệ thống cài lại bằng một lệnh",
      sessions: ["s37", "s38", "s39", "s40"],
    },
    {
      id: "st8",
      title: "Vận hành cluster",
      goal: "Bảo trì node, nâng cluster một minor bằng kubeadm, backup/restore etcd, gia hạn chứng chỉ và hiểu control plane HA.",
      projectMilestone: "Cluster nâng một phiên bản, app không gián đoạn; khôi phục được từ snapshot etcd",
      sessions: ["s41", "s42", "s43", "s44", "s45"],
    },
    {
      id: "st9",
      title: "Troubleshooting tổng hợp",
      goal: "Chẩn đoán theo tầng (app, Service/DNS, node, control plane) các lỗi ẩn do `./labs/lab break` gây ra, có bấm giờ như phòng thi.",
      projectMilestone: "Sổ tay sự cố riêng (ghi chú các buổi)",
      sessions: ["s46", "s47", "s48", "s49", "s50", "s51"],
    },
    {
      id: "st10",
      title: "Mock",
      goal: "Làm hai đề thi thử đầy đủ 120 phút trên chính cluster lab, chấm điểm theo domain.",
      projectMilestone: "Điểm theo domain",
      sessions: ["s52", "s53"],
    },
  ],
};
