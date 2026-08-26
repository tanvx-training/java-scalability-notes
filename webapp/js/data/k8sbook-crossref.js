// Liên kết chéo: tuần của giáo trình chứng chỉ → chương sách Kubernetes in Action.
//
// roadmap.js merge bảng này vào `week.resources` lúc dựng track, nên dữ liệu
// lộ trình chứng chỉ (154 mục) không phải sửa một ký tự nào.
//
// Khoá là id tuần CÓ THẬT của track ckad/cka/cks; giá trị là id tài liệu
// "k8sbook-*". check-data.mjs (N1) chặn cả hai loại gõ nhầm.

export const k8sbookCrossref = {
  // ----- CKAD -----
  "w1": ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10"],
  "w2": ["k8sbook-05", "k8sbook-06"],
  "w3": ["k8sbook-13", "k8sbook-14", "k8sbook-17"],
  "w4": ["k8sbook-09"],
  "w5": ["k8sbook-06"],
  "w6": ["k8sbook-11", "k8sbook-12"],
  "w7": ["k8sbook-07", "k8sbook-08", "k8sbook-15"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04"],
  "cka-w4": ["k8sbook-16"],
  "cka-w5": ["k8sbook-07", "k8sbook-08"],
  "cka-w6": ["k8sbook-11", "k8sbook-12"],

  // ----- CKS -----
  "cks-w4": ["k8sbook-09"],
};
