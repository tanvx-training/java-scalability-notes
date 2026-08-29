// Lưu trữ tiến độ học tập trong localStorage (JSON, có namespace).
//
// ⚠️ KHÔNG ĐỔI `NS`. App đã đổi tên KubePrep → DevPrep nhưng namespace phải
// giữ nguyên "kubeprep." — đổi prefix sẽ làm mọi người dùng hiện tại mất sạch
// tiến độ lộ trình, lịch sử flashcard và điểm thi thử.
const NS = "kubeprep.";

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
};

// ---- Các key dùng trong app ----
// theme                 : "light" | "dark"
// roadmap.checked       : { [itemId]: true }
// flash.srs             : { [cardId]: { reps, interval, due } }  (due = epoch ms)
// quiz.stats            : { [questionId]: { seen, correct } }
// exam.history          : [ { date, total, correct, pct, pass, byDomain } ]
// tracker.checked       : { [criteriaId]: true }   (ma trận năng lực)
