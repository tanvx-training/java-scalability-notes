// Chương trình giả dùng cho test logic thuần của module Thực hành.
const base = { durationMin: 30, tasks: [], review: [], pieces: [], skills: [], uses: [] };

export function makeProgram() {
  return {
    id: "tst",
    field: "kubernetes",
    exam: {
      domains: [
        { id: "a", label: "Domain A", weight: 60 },
        { id: "b", label: "Domain B", weight: 40 },
      ],
    },
    project: {
      pieces: [
        { id: "p1", label: "Mảnh 1", sinceSession: "x1" },
        { id: "p2", label: "Mảnh 2", sinceSession: "x3" },
      ],
    },
    stages: [
      { id: "st0", title: "Chặng 0", sessions: ["x1", "x2"] },
      { id: "st1", title: "Chặng 1", sessions: ["x3", "x4"] },
    ],
    sessions: [
      { ...base, id: "x1", stage: "st0", status: "published", domain: "", pieces: ["p1"], requires: [],
        review: [{ q: "Câu 1?", a: "Đáp 1" }] },
      { ...base, id: "x2", stage: "st0", status: "published", domain: "a", requires: ["x1"],
        skills: [{ skill: "k-one", level: "Gõ được" }] },
      { ...base, id: "x3", stage: "st1", status: "published", domain: "b", pieces: ["p2"], requires: ["x2"],
        uses: ["k-one"] },
      { ...base, id: "x4", stage: "st1", status: "skeleton", domain: "a", requires: ["x3"] },
    ],
    skills: [
      { id: "k-one", kind: "command", area: "kubernetes", label: "Một" },
      { id: "k-two", kind: "command", area: "kubernetes", label: "Hai" },
      { id: "k-orphan", kind: "concept", area: "kubernetes", label: "Mồ côi" },
    ],
    mocks: [{ id: "m1", title: "Đề 1", durationMin: 120, questions: [] }],
  };
}

// Chương trình theo chủ đề: không có đề thi, không có project, không có mock, mảng kỹ năng khác hẳn.
export function makeTopicProgram() {
  return {
    id: "topic",
    field: "java",
    skillAreas: [{ id: "jvm", label: "JVM", prefix: "jvm-" }],
    stages: [{ id: "st0", title: "Chặng 0", sessions: ["y1", "y2"] }],
    sessions: [
      { ...base, id: "y1", stage: "st0", status: "published", domain: null, requires: [],
        skills: [{ skill: "jvm-gc", level: "Đọc được log GC" }], review: [{ q: "GC là gì?", a: "Thu gom rác." }] },
      { ...base, id: "y2", stage: "st0", status: "skeleton", domain: null, requires: ["y1"], uses: ["jvm-gc"] },
    ],
    skills: [{ id: "jvm-gc", kind: "concept", area: "jvm", label: "Log GC" }],
    mocks: [],
  };
}
