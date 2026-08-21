// Danh mục tài liệu markdown hiển thị trong mục "Tài liệu".
// File nguồn nằm ở thư mục CKAD/ của repo; khi deploy (hoặc chạy dev.sh)
// chúng được copy vào webapp/content/.

export const docs = [
  {
    id: "prerequisites",
    title: "Kiến thức nền tảng (Prerequisites)",
    file: "content/CKAD-Prerequisites.md",
    icon: "🧱",
    desc: "Linux & command line, vim, Docker, YAML — những thứ phải vững trước khi học Kubernetes.",
    tags: ["Linux", "vim", "Docker", "YAML"],
  },
  {
    id: "study-guide",
    title: "CKAD Study Guide — Lộ trình 8–10 tuần",
    file: "content/CKAD-Study-Guide.md",
    icon: "🎯",
    desc: "Tổng quan kỳ thi, lộ trình học theo tuần, môi trường lab, chiến lược làm bài và checklist trước khi thi.",
    tags: ["CKAD", "Lộ trình", "Chiến lược thi"],
  },
  {
    id: "cheat-sheet",
    title: "CKAD Cheat Sheet — Tra cứu nhanh",
    file: "content/CKAD-Cheat-Sheet.md",
    icon: "⚡",
    desc: "Toàn bộ lệnh và YAML mẫu theo 20 chủ đề: Pods, Deployments, ConfigMaps, Ingress, NetworkPolicy, Helm…",
    tags: ["kubectl", "YAML", "Cheat sheet"],
  },
];
