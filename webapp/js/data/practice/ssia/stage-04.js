// Chặng 4 — Quản lý mật khẩu (chương 4 của sách).
// Buổi khung: đủ trường cấu trúc (check-data PR7); nội dung đầy đủ ở đợt sau.

export const sessions = [
  {
    id: "s07",
    stage: "st04",
    title: "PasswordEncoder: contract, tự viết, và các bản có sẵn",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s06"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Đọc contract PasswordEncoder (encode, matches, upgradeEncoding) và tự viết một bản để thấy vì sao không nên.",
      "So BCrypt, SCrypt, Argon2, Pbkdf2 về tham số và thời gian băm đo được trên máy bạn.",
      "Chỉ ra encoder nào đang được dùng khi xác thực và nó được gọi ở đâu.",
    ],
    skills: [
      { skill: "int-passwordencoder-contract", level: "Giải thích được" },
      { skill: "cfg-passwordencoder-bean", level: "Viết được không tra" },
      { skill: "dx-encoder-benchmark", level: "Làm được có tra" },
    ],
    uses: ["cfg-userdetailsservice-db"],
    refs: [{ label: "Sách, mục 4.1.1–4.1.3", href: "#/docs/springsec-04" }],
    stateIn: "Đầu ra s06: user trong DB.",
    stateOut: "order mã hóa mật khẩu bằng một encoder có sẵn đã chọn có lý do.",
  },
  {
    id: "s08",
    stage: "st04",
    title: "DelegatingPasswordEncoder và crypto module",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s07"],
    status: "skeleton",
    pieces: ["password-encoding"],
    goals: [
      "Đọc định dạng {id}hash của DelegatingPasswordEncoder và đăng nhập được với user cũ lẫn mới khi đổi thuật toán.",
      "Dùng key generator và encryptor của crypto module để sinh khóa và mã hóa một giá trị.",
      "Phân biệt băm mật khẩu với mã hóa hai chiều, nói khi nào dùng cái nào.",
    ],
    skills: [
      { skill: "cfg-delegating-encoder", level: "Viết được không tra" },
      { skill: "pro-hash-vs-encrypt", level: "Giải thích được" },
      { skill: "cfg-crypto-encryptors", level: "Làm được có tra" },
    ],
    uses: ["int-passwordencoder-contract"],
    refs: [{ label: "Sách, mục 4.1.4–4.2", href: "#/docs/springsec-04" }],
    stateIn: "Đầu ra s07.",
    stateOut: "Mật khẩu có tiền tố thuật toán và chuyển đổi được; người học dùng được key generator và encryptor.",
  },
];
