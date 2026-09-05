// Dấu vết học tập: chuỗi ngày (activity), mục mở gần đây (recent) và tài liệu
// đã đọc (docs.read). Không import view nào — view nào cũng import được.

import { store } from "./store.js";

const DAY = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" theo giờ địa phương — chuỗi ngày phải tính theo ngày của người học.
export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Gọi khi có một thao tác học thật: tick bài, chấm flashcard, trả lời câu hỏi,
// nộp bài thi, tick tiêu chí, đánh dấu đã đọc.
export function recordActivity() {
  const a = store.get("activity", {});
  const k = dayKey();
  a[k] = (a[k] || 0) + 1;
  store.set("activity", a);
}

export function streakInfo() {
  const a = store.get("activity", {});
  // Chuỗi hiện tại: hôm nay chưa học thì vẫn còn chuỗi nếu hôm qua có học.
  let d = new Date();
  if (!a[dayKey(d)]) d = new Date(d.getTime() - DAY);
  let current = 0;
  while (a[dayKey(d)]) { current++; d = new Date(d.getTime() - DAY); }

  const keys = Object.keys(a).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const t = new Date(k + "T00:00:00").getTime();
    run = prev != null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dd = new Date(Date.now() - i * DAY);
    const k = dayKey(dd);
    days.push({ key: k, n: a[k] || 0, today: i === 0 });
  }
  return { current, best, days, totalDays: keys.length };
}

// ---- Gần đây ----
// item: { type: "doc"|"lesson"|"criteria"|"lab", href, title, sub, icon, field }
export function pushRecent(item) {
  if (!item?.href) return;
  const list = store.get("recent", []).filter((r) => r.href !== item.href);
  list.unshift({ ...item, ts: Date.now() });
  store.set("recent", list.slice(0, 8));
}

export function recentItems(field) {
  const list = store.get("recent", []);
  return field ? list.filter((r) => r.field === field) : list;
}

// ---- Tài liệu đã đọc ----
export const docsRead = {
  all() { return store.get("docs.read", {}); },
  is(id) { return !!this.all()[id]; },
  set(id, on) {
    const m = this.all();
    if (on) m[id] = Date.now();
    else delete m[id];
    store.set("docs.read", m);
    if (on) recordActivity();
    return on;
  },
  toggle(id) { return this.set(id, !this.is(id)); },
  count(ids) {
    const m = this.all();
    return ids.filter((id) => m[id]).length;
  },
};
