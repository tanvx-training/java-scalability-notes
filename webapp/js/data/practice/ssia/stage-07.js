// Chặng 7 — Authorization ở endpoint: hạn chế truy cập (chương 7 của sách).
// Buổi khung: đủ trường cấu trúc (check-data PR7); nội dung đầy đủ ở đợt sau.

export const sessions = [
  {
    id: "s17",
    stage: "st07",
    title: "Hạn chế truy cập theo authority",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s16"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Dùng hasAuthority, hasAnyAuthority và access() để giới hạn endpoint theo authority.",
      "Đọc luồng một request bị 403: filter nào, AuthorizationManager nào, ngoại lệ nào.",
      "Phân biệt 401 và 403 trong phản hồi của order.",
    ],
    skills: [
      { skill: "cfg-has-authority", level: "Viết được không tra" },
      { skill: "int-authorizationmanager", level: "Giải thích được" },
      { skill: "dx-403-trace", level: "Làm được có tra" },
    ],
    uses: ["int-grantedauthority","dx-security-debug-log"],
    refs: [{ label: "Sách, mục 7.1.1", href: "#/docs/springsec-07" }],
    stateIn: "Đầu ra s16.",
    stateOut: "Endpoint của order giới hạn theo authority.",
  },
  {
    id: "s18",
    stage: "st07",
    title: "Hạn chế theo role và chặn mọi endpoint",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s17"],
    status: "skeleton",
    pieces: ["endpoint-authz"],
    goals: [
      "Dùng hasRole, hasAnyRole và hiểu vì sao role được lưu thành authority có tiền tố ROLE_.",
      "Chặn mọi request còn lại bằng denyAll và quy tắc mặc định đóng.",
      "Chẩn đoán 403 dù user đúng role (do tiền tố hoặc thứ tự luật).",
    ],
    skills: [
      { skill: "cfg-has-role", level: "Viết được không tra" },
      { skill: "cfg-deny-all", level: "Viết được không tra" },
      { skill: "dx-403-right-role", level: "Làm được có tra" },
    ],
    uses: ["cfg-has-authority"],
    refs: [{ label: "Sách, mục 7.1.2–7.1.3", href: "#/docs/springsec-07" }],
    stateIn: "Đầu ra s17.",
    stateOut: "Role của order phân quyền xong, mọi endpoint còn lại bị chặn mặc định.",
  },
];
