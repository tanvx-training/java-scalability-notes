// Chặng 8 — Authorization ở endpoint: áp dụng hạn chế (chương 8 của sách).
// Buổi khung: đủ trường cấu trúc (check-data PR7); nội dung đầy đủ ở đợt sau.

export const sessions = [
  {
    id: "s19",
    stage: "st08",
    title: "requestMatchers để chọn endpoint",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s18"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Chọn endpoint bằng requestMatchers theo đường dẫn và phương thức HTTP.",
      "Giải thích vì sao thứ tự khai báo luật quan trọng và gặp lỗi gì khi đặt luật chung trước luật riêng.",
      "Chẩn đoán luật không khớp vì đường dẫn có dấu / cuối hoặc phần mở rộng.",
    ],
    skills: [
      { skill: "cfg-request-matchers", level: "Viết được không tra" },
      { skill: "int-matcher-order", level: "Giải thích được" },
      { skill: "dx-matcher-miss", level: "Làm được có tra" },
    ],
    uses: ["cfg-has-role","cfg-deny-all"],
    refs: [{ label: "Sách, mục 8.1", href: "#/docs/springsec-08" }],
    stateIn: "Đầu ra s18.",
    stateOut: "Luật của order chọn endpoint theo đường dẫn và phương thức.",
  },
  {
    id: "s20",
    stage: "st08",
    title: "Chọn request áp luật và matcher dùng biểu thức chính quy",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s19"],
    status: "skeleton",
    pieces: ["matcher-rules"],
    goals: [
      "So các loại matcher có sẵn và biết khi nào dùng mỗi loại.",
      "Dùng biểu thức chính quy để chọn request mà matcher thường không chọn được.",
      "Tách luật cho từng nhóm đường dẫn bằng nhiều SecurityFilterChain và nói chain nào được chọn.",
    ],
    skills: [
      { skill: "cfg-regex-matchers", level: "Viết được không tra" },
      { skill: "cfg-multiple-filterchains", level: "Làm được có tra" },
      { skill: "int-chain-selection", level: "Giải thích được" },
    ],
    uses: ["cfg-request-matchers","dx-list-filters"],
    refs: [{ label: "Sách, mục 8.2–8.3", href: "#/docs/springsec-08" }],
    stateIn: "Đầu ra s19.",
    stateOut: "order có nhiều chain, mỗi chain áp luật cho nhóm đường dẫn của nó.",
  },
];
