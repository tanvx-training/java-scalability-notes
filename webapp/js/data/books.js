// Siêu dữ liệu nhóm tài liệu (docs[].group) — hiện chỉ lĩnh vực Kubernetes có nhóm.
// `short` dùng khi cần phân biệt sách trong ngữ cảnh trộn nhiều sách (chip trong
// tuần giáo trình, kết quả tìm kiếm); `unit` là từ đi trước số chương.
// Lĩnh vực một sách khai short/unit ngay trong FIELDS (fields.js).

export const BOOKS = {
  "Luyện thi & tra cứu (tự biên)":         { short: "Luyện thi", unit: null },
  "Kubernetes in Action (Lukša, Manning)": { short: "KIA",       unit: "Ch." },
  "CKA Study Guide (Muschko, O'Reilly)":   { short: "CKA SG",    unit: "Ch." },
  "Kubernetes: Up and Running (O'Reilly)": { short: "KUAR",      unit: "Ch." },
};
