// Con đường học — tầng bao trên các lĩnh vực. Lĩnh vực vẫn là đơn vị dữ liệu và
// tiến độ (field/id/localStorage không đổi); con đường chỉ trả lời "học theo thứ
// tự nào" và "cái này thuộc nghề gì". Thứ tự `fields` là thứ tự học khuyến nghị.
//
// Lộ trình Senior Java là TRỤC XUYÊN SUỐT (SPINE), đi qua cả ba con đường theo
// thời gian — không xếp ngang hàng con đường. check-data.mjs (P1) kiểm mọi lĩnh
// vực xuất hiện đúng một lần trong PATHS ∪ SPINE.

export const PATHS = {
  kubernetes: {
    label: "Kubernetes & Cloud",
    icon: "☸️",
    desc: "Từ container tới ba chứng chỉ CNCF: giáo trình CKAD → CKA → CKS, ba cuốn sách đọc nền và đọc sâu, labs và thi thử.",
    fields: ["kubernetes"],
    foundation: [],
  },
  java: {
    label: "Java Backend",
    icon: "☕",
    desc: "Một nghề, chín chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM (bytecode, JMM, build, container) → nền concurrency cổ điển (thread safety, lock, AQS, JMM) → đo và tối ưu trên cloud (GC, JIT, observability, profiling) → persistence (ánh xạ, persistence context, transaction, fetch) → khả năng mở rộng trên Tomcat → concurrency sau Loom → bảo mật. Lập trình hệ thống là nền tuỳ chọn cho ai muốn hiểu tới tầng kernel.",
    fields: ["spring-start", "modern-java", "wgjd", "jcip", "ocnj", "jpa", "java", "modern-concurrency", "spring-security"],
    foundation: ["sysprog"],
  },
  data: {
    label: "Data & Distributed",
    icon: "🗄️",
    desc: "Lý thuyết hệ dữ liệu phân tán (DDIA) rồi một hệ thật để chạm tay (Kafka): replication, sharding, transaction, exactly-once, stream.",
    fields: ["ddia", "kafka"],
    foundation: [],
  },
};

export const PATH_ORDER = ["kubernetes", "java", "data"];

export const SPINE = {
  field: "senior-java",
  label: "Trục xuyên suốt",
  desc: "Kế hoạch 24 tháng đi qua cả ba con đường: mỗi giai đoạn mượn một con đường làm nội dung, còn ma trận năng lực đo bạn đang ở đâu.",
  stages: [
    { track: "sj-gd1", path: "java" },
    { track: "sj-gd2", path: null, note: "DevOps nền tảng — chưa có lĩnh vực tương ứng trong app; học theo tài liệu giai đoạn 2." },
    { track: "sj-gd3", path: "kubernetes" },
    { track: "sj-gd4", path: "data" },
  ],
};

// Module ma trận năng lực → con đường (null = không thuộc con đường nào trong app).
export const MATRIX_PATHS = {
  "sj-m1": "java",
  "sj-m2": "java",
  "sj-m3": "data",
  "sj-m4": "data",
  "sj-m5": "kubernetes",
  "sj-m6": null,
};

// Con đường chứa một lĩnh vực (kể cả nền tuỳ chọn); null cho trục Senior Java.
export function pathOfField(fieldId) {
  for (const [id, p] of Object.entries(PATHS)) {
    if (p.fields.includes(fieldId) || p.foundation.includes(fieldId)) return id;
  }
  return null;
}

// Vị trí của lĩnh vực trong con đường: { path, index, total, isFoundation, prev, next }
export function positionOfField(fieldId) {
  const pid = pathOfField(fieldId);
  if (!pid) return null;
  const p = PATHS[pid];
  const idx = p.fields.indexOf(fieldId);
  if (idx < 0) return { path: pid, index: null, total: p.fields.length, isFoundation: true, prev: null, next: p.fields[0] ?? null };
  return { path: pid, index: idx, total: p.fields.length, isFoundation: false, prev: p.fields[idx - 1] ?? null, next: p.fields[idx + 1] ?? null };
}
