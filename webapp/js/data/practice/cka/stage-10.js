// Chặng 10 — Mock. Hai buổi là trang mỏng dẫn sang đề mock tương ứng (spec mục
// 12): kind "mock", 120 phút, không dạy kỹ năng mới, ngoài domain đề thi.

export const sessions = [
  {
    id: "s52",
    stage: "st10",
    kind: "mock",
    title: "Mock 1",
    durationMin: 120,
    domain: null,
    competencies: [],
    requires: ["s51"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Làm trọn một đề 120 phút trên cluster lab, không tra gì ngoài kubernetes.io.",
      "Đạt ít nhất 66% và biết domain nào đang kéo điểm xuống.",
    ],
    skills: [],
    uses: [],
    stateIn: "Đầu ra chặng 9; `./labs/lab mock cka m1 start` dựng đề trên cluster.",
    stateOut: "Đã chấm bằng `./labs/lab mock cka m1 score` và dán dòng kết quả vào app.",
  },
  {
    id: "s53",
    stage: "st10",
    kind: "mock",
    title: "Mock 2",
    durationMin: 120,
    domain: null,
    competencies: [],
    requires: ["s52"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Làm đề thứ hai sau khi đã ôn các domain yếu của Mock 1.",
      "Đạt ít nhất 75% để có biên an toàn trước khi đặt lịch thi thật.",
    ],
    skills: [],
    uses: [],
    stateIn: "Đã xong Mock 1; `./labs/lab mock cka m2 start` dựng đề trên cluster.",
    stateOut: "Đã chấm bằng `./labs/lab mock cka m2 score` và dán dòng kết quả vào app.",
  },
];
