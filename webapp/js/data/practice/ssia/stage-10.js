// Chặng 10 — Cấu hình CORS (chương 10 của sách).
// Buổi khung: đủ trường cấu trúc (check-data PR7); nội dung đầy đủ ở đợt sau.

export const sessions = [
  {
    id: "s24",
    stage: "st10",
    title: "CORS hoạt động thế nào; @CrossOrigin",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s23"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Tạo một cuộc gọi cross-origin bị trình duyệt chặn và đọc lỗi ở DevTools.",
      "Quan sát request preflight OPTIONS và các header Access-Control-*.",
      "Áp chính sách bằng @CrossOrigin trên controller của order.",
    ],
    skills: [
      { skill: "pro-cors-preflight", level: "Giải thích được" },
      { skill: "cfg-cross-origin-annotation", level: "Viết được không tra" },
      { skill: "dx-cors-devtools", level: "Làm được có tra" },
    ],
    uses: ["dx-401-vs-redirect"],
    refs: [{ label: "Sách, mục 10.1–10.2", href: "#/docs/springsec-10" }],
    stateIn: "Đầu ra s23.",
    stateOut: "Một client web ở origin khác gọi được endpoint order đã khai CORS.",
  },
  {
    id: "s25",
    stage: "st10",
    title: "CORS bằng CorsConfigurer và vị trí của nó trong chuỗi filter",
    durationMin: 60,
    domain: null,
    competencies: [],
    requires: ["s24"],
    status: "skeleton",
    pieces: ["cors"],
    goals: [
      "Cấu hình CORS tập trung bằng http.cors và CorsConfigurationSource.",
      "Giải thích vì sao preflight không mang thông tin xác thực mà vẫn phải được trả lời trước authorization.",
      "Chẩn đoán preflight bị 401 hoặc 403.",
    ],
    skills: [
      { skill: "cfg-cors-configurer", level: "Viết được không tra" },
      { skill: "int-cors-filter-order", level: "Giải thích được" },
      { skill: "dx-preflight-denied", level: "Làm được có tra" },
    ],
    uses: ["pro-cors-preflight","dx-list-filters"],
    refs: [{ label: "Sách, mục 10.3", href: "#/docs/springsec-10" }],
    stateIn: "Đầu ra s24.",
    stateOut: "CORS của order cấu hình tập trung và preflight được trả lời đúng.",
  },
];
