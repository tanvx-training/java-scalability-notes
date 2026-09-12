// Số liệu tiến độ theo lĩnh vực — dùng chung cho bảng điều khiển, bộ chọn lĩnh
// vực, trang Hướng dẫn học và trang Cài đặt. Mọi hàm đọc localStorage tại thời
// điểm gọi (không cache) để luôn phản ánh thao tác vừa làm.

import { store } from "./store.js";
import { docsRead } from "./activity.js";
import { getDocs, getTracks, getFlashcards, getQuestions, getMatrices, getInterviews } from "../data/index.js";

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function trackStats(track, checked = store.get("roadmap.checked", {})) {
  const items = track.weeks.flatMap((w) => w.items);
  const done = items.filter((it) => checked[it.id]).length;
  return { id: track.id, label: track.label, icon: track.icon, done, total: items.length, pct: pct(done, items.length) };
}

export function roadmapStats(field) {
  const checked = store.get("roadmap.checked", {});
  const per = getTracks(field).map((t) => trackStats(t, checked));
  const done = per.reduce((a, p) => a + p.done, 0);
  const total = per.reduce((a, p) => a + p.total, 0);
  return { done, total, pct: pct(done, total), per };
}

export function docsStats(field) {
  const list = getDocs(field);
  const read = docsRead.count(list.map((d) => d.id));
  return { read, total: list.length, pct: pct(read, list.length) };
}

export function flashStats(field) {
  const srs = store.get("flash.srs", {});
  const now = Date.now();
  const cards = getFlashcards(field);
  let due = 0, learned = 0;
  for (const c of cards) {
    const e = srs[c.id];
    if (!e) continue;
    learned++;
    if (e.due <= now) due++;
  }
  return { due, learned, fresh: cards.length - learned, total: cards.length, learnedPct: pct(learned, cards.length) };
}

export function quizStats(field) {
  const stats = store.get("quiz.stats", {});
  const qs = getQuestions(field);
  let seen = 0, correct = 0;
  for (const q of qs) {
    const s = stats[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (s.correct > 0) correct++;
  }
  return { seen, correct, total: qs.length, acc: seen ? pct(correct, seen) : null, seenPct: pct(seen, qs.length) };
}

// Tự chấm, không chấm máy: `last` là trạng thái HIỆN TẠI của một câu (0 chưa
// đạt · 1 một phần · 2 đạt), `best` là kỷ lục. Thống kê lấy `last` vì câu hỏi
// "giờ tôi đứng ở đâu" mới là câu đáng trả lời — một lần đạt hồi tháng trước
// rồi nay trả lời hụt thì không còn là đạt.
export function interviewStats(field) {
  const saved = store.get("interview.stats", {});
  const bank = getInterviews(field);
  const byLevel = { 1: { seen: 0, passed: 0, total: 0 }, 2: { seen: 0, passed: 0, total: 0 },
                    3: { seen: 0, passed: 0, total: 0 }, 4: { seen: 0, passed: 0, total: 0 } };
  let seen = 0, passed = 0;
  for (const q of bank) {
    const lv = byLevel[q.level];
    if (lv) lv.total++;
    const s = saved[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (lv) lv.seen++;
    if (s.last === 2) {
      passed++;
      if (lv) lv.passed++;
    }
  }
  return {
    seen, passed, total: bank.length,
    seenPct: pct(seen, bank.length),
    passPct: seen ? pct(passed, seen) : null,
    byLevel,
  };
}

export function examStats() {
  const hist = store.get("exam.history", []);
  if (!hist.length) return { best: null, count: 0, passCount: 0 };
  return {
    best: Math.max(...hist.map((e) => e.pct)),
    count: hist.length,
    passCount: hist.filter((e) => e.pass).length,
  };
}

export function matrixStats(field) {
  const checked = store.get("tracker.checked", {});
  const all = getMatrices(field)
    .flatMap((m) => m.modules).flatMap((m) => m.topics).flatMap((t) => t.checklist);
  const done = all.filter((c) => checked[c.id]).length;
  return { done, total: all.length, pct: pct(done, all.length) };
}

// Số lượng bản ghi của một lĩnh vực — cho thẻ lĩnh vực / bộ chọn.
export function fieldSummary(field) {
  const parts = [];
  const nDocs = getDocs(field).length;
  if (nDocs) parts.push(`${nDocs} tài liệu`);
  const items = getTracks(field).reduce((n, t) => n + t.weeks.flatMap((w) => w.items).length, 0);
  if (items) parts.push(`${items} bài học`);
  const cards = getFlashcards(field).length;
  if (cards) parts.push(`${cards} thẻ`);
  const qs = getQuestions(field).length;
  if (qs) parts.push(`${qs} câu hỏi`);
  const iq = getInterviews(field).length;
  if (iq) parts.push(`${iq} câu phỏng vấn`);
  const cr = getMatrices(field).flatMap((m) => m.modules).flatMap((m) => m.topics).flatMap((t) => t.checklist).length;
  if (cr) parts.push(`${cr} tiêu chí`);
  return { docs: nDocs, items, cards, questions: qs, interviews: iq, criteria: cr, text: parts.join(" · ") };
}
