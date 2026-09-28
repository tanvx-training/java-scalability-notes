// Lớp logic của module "Kế hoạch tuần" (🗓️, toàn cục):
//   • schedule()        lịch 104 tuần đã nở, ngày tính theo ngày bắt đầu người dùng chọn
//   • currentWeek()     tuần lịch hôm nay (0 = chưa bắt đầu, weeks+1 = đã hết)
//   • weekProgress(w)   tiến độ tuần tính từ roadmap.checked + docs.read — KHÔNG lưu gì thêm
//   • nhật ký giờ học   plan.log  : [ { id, date: "YYYY-MM-DD", h, kind, note } ]
//   • nghi thức         plan.rituals : { [`w<n>`]: { [ritualId]: epoch ms } }
//   • cấu hình          plan.config  : { start?: "YYYY-MM-DD", hoursTarget?: number }
//
// Không import view nào — dashboard, planner, settings đều import được.

import { store } from "./store.js";
import { docsRead, recordActivity, dayKey } from "./activity.js";
import { tracks } from "../data/roadmap.js";
import { docs } from "../data/docs-index.js";
import { PLAN, buildSchedule } from "../data/senior-java/schedule.js";

const DAY = 24 * 60 * 60 * 1000;

// ---------- Cấu hình ----------

export function planConfig() {
  const c = store.get("plan.config", {}) || {};
  const start = /^\d{4}-\d{2}-\d{2}$/.test(c.start ?? "") ? c.start : PLAN.start;
  const hoursTarget = Number.isFinite(c.hoursTarget) && c.hoursTarget >= 3 && c.hoursTarget <= 20 ? c.hoursTarget : PLAN.hoursTarget;
  return { start, hoursTarget, customStart: start !== PLAN.start };
}

export function setPlanConfig(patch) {
  const c = store.get("plan.config", {}) || {};
  const next = { ...c, ...patch };
  if (next.start === PLAN.start) delete next.start;
  if (next.hoursTarget === PLAN.hoursTarget) delete next.hoursTarget;
  store.set("plan.config", next);
  cache = null;
}

// ---------- Lịch ----------

let cache = null;
let cacheStart = null;

export function schedule() {
  const { start } = planConfig();
  if (cache && cacheStart === start) return cache;
  const byId = new Map(tracks.map((t) => [t.id, t]));
  cache = buildSchedule(byId, start);
  cacheStart = start;
  return cache;
}

export function weekEntry(n) {
  return schedule().find((w) => w.n === n) ?? null;
}

// Tuần lịch chứa một ngày. 0 = trước ngày bắt đầu; PLAN.weeks + 1 = sau tuần cuối.
export function weekNumberOf(date = new Date()) {
  const { start } = planConfig();
  const [y, m, d] = start.split("-").map(Number);
  const s = new Date(y, m - 1, d);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((day - s) / DAY);
  if (diff < 0) return 0;
  const n = Math.floor(diff / 7) + 1;
  return n > PLAN.weeks ? PLAN.weeks + 1 : n;
}

export const currentWeek = () => weekNumberOf(new Date());

export function phaseOf(n) {
  for (const [id, p] of Object.entries(PLAN.phases)) {
    if (n >= p.weeks[0] && n <= p.weeks[1]) return { id, ...p };
  }
  return null;
}

export function fmtRange({ from, to }) {
  const f = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${f(from)} → ${f(to)}/${to.getFullYear()}`;
}

// ---------- Tiến độ tuần (đọc từ tiến độ thật) ----------

const docById = new Map(docs.map((d) => [d.id, d]));
const itemIndex = (() => {
  const m = new Map();
  for (const t of tracks) for (const w of t.weeks) for (const it of w.items) {
    m.set(it.id, { item: it, week: w, track: t });
  }
  return m;
})();

export function itemInfo(id) {
  return itemIndex.get(id) ?? null;
}

export function docInfo(id) {
  return docById.get(id) ?? null;
}

export function weekProgress(entry, checked = store.get("roadmap.checked", {})) {
  const items = entry.items;
  const done = items.filter((id) => checked[id]).length;
  const readsDone = entry.reads.filter((id) => docsRead.is(id)).length;
  const total = items.length + entry.reads.length;
  const doneAll = done + readsDone;
  return {
    done, total: items.length,
    readsDone, readsTotal: entry.reads.length,
    pct: total ? Math.round((doneAll / total) * 100) : (entry.rest ? 100 : 0),
    complete: total ? doneAll === total : true,
  };
}

// Nợ: mục của các tuần TRƯỚC tuần n chưa tick. Trả về tối đa `limit` mục gần nhất.
export function debtBefore(n, limit = 12) {
  const checked = store.get("roadmap.checked", {});
  const out = [];
  for (const w of schedule()) {
    if (w.n >= n) break;
    for (const id of w.items) if (!checked[id]) out.push({ week: w.n, id });
    for (const id of w.reads) if (!docsRead.is(id)) out.push({ week: w.n, id, doc: true });
  }
  return { count: out.length, items: out.slice(-limit) };
}

export function setItemChecked(id, on) {
  const checked = store.get("roadmap.checked", {});
  if (on) { checked[id] = true; recordActivity(); }
  else delete checked[id];
  store.set("roadmap.checked", checked);
}

// ---------- Nhật ký giờ học ----------

export const SESSION_KINDS = {
  read: { label: "Đọc", icon: "📖" },
  lab: { label: "Lab sách", icon: "🧪" },
  project: { label: "Dự án", icon: "🛒" },
  write: { label: "Viết note", icon: "✍️" },
  review: { label: "Ôn / phỏng vấn", icon: "🎤" },
};

export function sessions() {
  const list = store.get("plan.log", []);
  return Array.isArray(list) ? list : [];
}

export function logSession({ date = dayKey(), h, kind = "read", note = "" }) {
  const hours = Math.round(Number(h) * 4) / 4;
  if (!(hours > 0) || hours > 16) return null;
  const s = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, date, h: hours, kind: SESSION_KINDS[kind] ? kind : "read", note: String(note).slice(0, 140) };
  const list = sessions();
  list.push(s);
  store.set("plan.log", list.slice(-2000));
  recordActivity();
  return s;
}

export function removeSession(id) {
  store.set("plan.log", sessions().filter((s) => s.id !== id));
}

export function sessionsOfWeek(n) {
  const w = weekEntry(n);
  if (!w) return [];
  const from = dayKey(w.dates.from), to = dayKey(w.dates.to);
  return sessions().filter((s) => s.date >= from && s.date <= to).sort((a, b) => a.date.localeCompare(b.date));
}

export function hoursOfWeek(n) {
  const list = sessionsOfWeek(n);
  const byKind = {};
  let total = 0;
  for (const s of list) { byKind[s.kind] = (byKind[s.kind] || 0) + s.h; total += s.h; }
  return { total: Math.round(total * 4) / 4, byKind, count: list.length };
}

// Tổng giờ mọi tuần đã ghi — cho biểu đồ 8 tuần và thống kê toàn kỳ.
export function hoursSummary(uptoWeek) {
  const all = sessions();
  let total = 0;
  for (const s of all) total += s.h;
  const weeks = [];
  for (let n = Math.max(1, uptoWeek - 7); n <= uptoWeek; n++) {
    if (n > PLAN.weeks) break;
    weeks.push({ n, ...hoursOfWeek(n) });
  }
  return { total: Math.round(total * 4) / 4, sessions: all.length, weeks };
}

// ---------- Nghi thức ----------

export const WEEKLY_RITUALS = [
  { id: "journal", label: "Viết nhật ký tuần (mẫu sj-12)" },
  { id: "tick", label: "Tick lộ trình CHỈ những mục đạt “Hoàn thành khi”" },
  { id: "note", label: "Đọc lại 1 Feynman note cũ, sửa nếu đã hiểu khác" },
  { id: "plan", label: "Đặt 5 khối thời gian tuần sau vào lịch" },
  { id: "export", label: "Xuất tiến độ JSON (cuối tháng)" },
];

export const QUARTERLY_RITUALS = [
  { id: "matrix", label: "Chấm lại ma trận năng lực, so với quý trước theo module" },
  { id: "interview", label: "Làm lại 24 câu phỏng vấn của lĩnh vực vừa xong, ghi rụng ở tầng nào" },
  { id: "gate", label: "Chấm checklist cuối giai đoạn / DoD giai đoạn FlashSale" },
  { id: "cv", label: "Cập nhật CV với thành tích đo được; dọn README repo" },
  { id: "backup", label: "Xuất tiến độ app ra JSON, commit vào learning-notes" },
  { id: "five", label: "Viết 5 dòng: quý này tôi làm được gì mà 3 tháng trước chưa làm được?" },
  { id: "scope", label: "Trượt 2 quý liên tiếp? → thu hẹp phạm vi, không kéo dài vô hạn" },
];

export const isQuarterEnd = (n) => n > 0 && n % PLAN.quarterWeeks === 0;

export function ritualState(n) {
  const all = store.get("plan.rituals", {}) || {};
  return all[`w${n}`] || {};
}

export function setRitual(n, id, on) {
  const all = store.get("plan.rituals", {}) || {};
  const key = `w${n}`;
  const w = all[key] || {};
  if (on) w[id] = Date.now(); else delete w[id];
  if (Object.keys(w).length) all[key] = w; else delete all[key];
  store.set("plan.rituals", all);
  if (on) recordActivity();
}

// ---------- Mốc ----------

export function milestones(fromWeek, limit = 5) {
  return schedule().filter((w) => w.ms && w.n >= fromWeek).slice(0, limit)
    .map((w) => ({ n: w.n, dates: w.dates, ...w.ms }));
}

// Tóm tắt cho thẻ trên bảng điều khiển.
export function planSummary() {
  const n = currentWeek();
  const { hoursTarget } = planConfig();
  const entry = n >= 1 && n <= PLAN.weeks ? weekEntry(n) : null;
  return {
    n, total: PLAN.weeks, entry,
    started: n >= 1, finished: n > PLAN.weeks,
    progress: entry ? weekProgress(entry) : null,
    hours: entry ? hoursOfWeek(n) : { total: 0, byKind: {}, count: 0 },
    hoursTarget,
    phase: entry ? phaseOf(n) : null,
  };
}
