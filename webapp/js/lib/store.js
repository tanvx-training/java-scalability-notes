// Lưu trữ tiến độ học tập trong localStorage (JSON, có namespace).
//
// ⚠️ KHÔNG ĐỔI `NS`. App đã đổi tên KubePrep → DevPrep nhưng namespace phải
// giữ nguyên "kubeprep." — đổi prefix sẽ làm mọi người dùng hiện tại mất sạch
// tiến độ lộ trình, lịch sử flashcard và điểm thi thử.
export const NS = "kubeprep.";

function safeParse(raw, fallback) {
  try {
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const store = {
  get(key, fallback = null) {
    try {
      return safeParse(localStorage.getItem(NS + key), fallback);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* hết quota hoặc private mode — bỏ qua */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(NS + key);
    } catch { /* ignore */ }
  },

  // ---- Xuất / nhập toàn bộ (trang Cài đặt) ----
  // Trả về { "kubeprep.theme": "\"dark\"", … } — giá trị GIỮ NGUYÊN dạng chuỗi
  // JSON như trong localStorage, để nhập lại không phải hiểu từng khoá.
  exportAll() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NS)) out[k] = localStorage.getItem(k);
      }
    } catch { /* ignore */ }
    return out;
  },
  // Chỉ nhận khoá đúng namespace và giá trị parse được thành JSON — tệp lạ
  // không làm hỏng app. `replace` = xoá sạch trước khi nhập.
  importAll(obj, { replace = false } = {}) {
    if (!obj || typeof obj !== "object") return 0;
    if (replace) this.clearAll();
    let n = 0;
    for (const [k, v] of Object.entries(obj)) {
      if (!k.startsWith(NS) || typeof v !== "string") continue;
      try {
        JSON.parse(v);
        localStorage.setItem(k, v);
        n++;
      } catch { /* bỏ khoá hỏng */ }
    }
    return n;
  },
  clearAll() {
    for (const k of Object.keys(this.exportAll())) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
  },
  // Kích thước xấp xỉ (byte UTF-16 → ×2) của từng khoá, để trang Cài đặt hiển thị.
  sizes() {
    const all = this.exportAll();
    return Object.fromEntries(
      Object.entries(all).map(([k, v]) => [k.slice(NS.length), (k.length + v.length) * 2]));
  },
};

// ---- Các key dùng trong app ----
// theme                 : "light" | "dark"        (không có = theo hệ thống)
// field                 : id lĩnh vực đang chọn
// roadmap.checked       : { [itemId]: true }
// flash.srs             : { [cardId]: { reps, interval, due } }  (due = epoch ms)
// quiz.stats            : { [questionId]: { seen, correct } }
// exam.history          : [ { date, total, correct, pct, pass, byDomain } ]
// tracker.checked       : { [criteriaId]: true }   (ma trận năng lực)
// ref.pins / ref.cert / ref.compact : trang Thực hành nhanh
// docs.read             : { [docId]: epoch ms }     (tài liệu đã đánh dấu đọc xong)
// recent                : [ { type, href, title, sub, icon, field, ts } ] (tối đa 8)
// activity              : { "YYYY-MM-DD": số thao tác học }  (chuỗi ngày)
// guide.manual          : { [stepId]: epoch ms }   (bước hướng dẫn tự tick)
// reader.fontScale      : 0.9 … 1.3
