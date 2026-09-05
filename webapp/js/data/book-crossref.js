// Liên kết chéo: tuần của giáo trình chứng chỉ → chương sách.
//
// Ba cuốn dùng CHUNG bảng này: Kubernetes in Action (k8sbook-*), CKA Study
// Guide (ckabook-*) và Kubernetes: Up and Running (kuar-*). Đây là MỘT object,
// mỗi id tuần đúng MỘT khoá — viết một tuần thành hai khoá cho hai cuốn là lỗi
// im lặng: JavaScript giữ khoá cuối và bỏ khoá trước, không cảnh báo, và N1
// không bắt được vì nó chỉ thấy object đã hợp nhất.
//
// roadmap.js merge bảng này vào `week.resources` lúc dựng track, nên dữ liệu
// lộ trình chứng chỉ (154 mục) không phải sửa một ký tự nào.
//
// Khoá là id tuần CÓ THẬT của track ckad/cka/cks; giá trị là id tài liệu sách.
// check-data.mjs (N1) chặn cả hai loại gõ nhầm.

export const bookCrossref = {
  // ----- CKAD -----
  "w1": ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10"],
  "w2": ["k8sbook-05", "k8sbook-06"],
  "w3": ["k8sbook-13", "k8sbook-14", "k8sbook-17"],
  "w4": ["k8sbook-09"],
  "w5": ["k8sbook-06"],
  "w6": ["k8sbook-11", "k8sbook-12"],
  "w7": ["k8sbook-07", "k8sbook-08", "k8sbook-15"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04", "ckabook-02", "ckabook-03"],
  "cka-w2": ["ckabook-04"],
  "cka-w3": ["ckabook-05"],
  "cka-w4": ["k8sbook-16", "ckabook-13", "ckabook-14"],
  "cka-w5": ["k8sbook-07", "k8sbook-08", "ckabook-15", "ckabook-16"],
  "cka-w6": ["k8sbook-11", "k8sbook-12", "ckabook-17", "ckabook-18", "ckabook-19", "ckabook-20"],
  "cka-w7": ["ckabook-06", "ckabook-07", "ckabook-08"],
  "cka-w8": ["ckabook-21", "ckabook-22"],
  "cka-w9": ["ckabook-01", "ckabook-A"],

  // ----- CKS -----
  "cks-w4": ["k8sbook-09"],
};
