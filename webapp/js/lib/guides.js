// Lớp logic của module "Hướng dẫn học":
//   • docGuide(docId): đảo chỉ mục lộ trình → hướng dẫn đọc cho MỘT tài liệu
//     (mục tiêu, bẫy, câu tự kiểm tra, bài học liên quan) — không viết tay 196 bản.
//   • stepStatus(step, field): trạng thái một bước trong fieldGuides[].steps, tính
//     từ tiến độ đã lưu (không lưu gì thêm, trừ bước kind "manual").
//   • fieldProgress(field): tiến độ tổng + bước tiếp theo.

import { store } from "./store.js";
import { tracks } from "../data/roadmap.js";
import { docs } from "../data/docs-index.js";
import { fieldOfRecord } from "../data/index.js";
import { fieldGuides, trackGuides, groupGuides } from "../data/guides.js";
import { roadmapStats, docsStats, flashStats, quizStats, examStats, matrixStats, trackStats, pct } from "./stats.js";

// ---------- Đảo chỉ mục: tài liệu ← bài học ----------

const SECTION_RE = /\*\*(Mục tiêu|Đọc|Bẫy|Tự kiểm tra|Việc cần làm|Nguồn)\.\*\*\s*/g;

// Tách lesson markdown thành { "Mục tiêu": "...", "Bẫy": "...", … } — lấy tới hết
// đoạn (dòng trống kế tiếp) hoặc tới nhãn kế tiếp.
export function lessonSections(lesson) {
  const out = {};
  if (!lesson) return out;
  const text = String(lesson);
  const marks = [...text.matchAll(SECTION_RE)];
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const start = m.index + m[0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    let body = text.slice(start, end).trim();
    const para = body.indexOf("\n\n");
    if (para > 0) body = body.slice(0, para).trim();
    if (body && !out[m[1]]) out[m[1]] = body;
  }
  return out;
}

let invIndex = null;

function buildInverse() {
  const byDoc = new Map(); // docId → { lessons: [], weeks: [] }
  const get = (id) => {
    if (!byDoc.has(id)) byDoc.set(id, { lessons: [], weeks: [] });
    return byDoc.get(id);
  };
  const linkRe = /#\/docs\/([A-Za-z0-9_-]+)/g;
  for (const t of tracks) {
    const field = fieldOfRecord(t);
    for (const w of t.weeks) {
      const weekRef = { trackId: t.id, trackLabel: t.label, trackIcon: t.icon, weekId: w.id, weekLabel: w.week, weekTitle: w.title, field };
      const inWeek = new Set();
      for (const r of w.resources ?? []) {
        for (const m of String(r.href).matchAll(linkRe)) inWeek.add(m[1]);
      }
      for (const id of inWeek) get(id).weeks.push(weekRef);
      for (const it of w.items) {
        const ids = new Set([...String(it.lesson ?? "").matchAll(linkRe)].map((m) => m[1]));
        if (!ids.size) continue;
        const sec = lessonSections(it.lesson);
        const ref = { ...weekRef, itemId: it.id, text: it.text, href: `#/roadmap/${t.id}/${it.id}`, sections: sec };
        for (const id of ids) get(id).lessons.push(ref);
      }
    }
  }
  return byDoc;
}

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

export function docGuide(docId) {
  if (!invIndex) invIndex = buildInverse();
  const doc = docs.find((d) => d.id === docId);
  const entry = invIndex.get(docId) ?? { lessons: [], weeks: [] };
  const checked = store.get("roadmap.checked", {});
  const lessons = entry.lessons.map((l) => ({ ...l, checked: !!checked[l.itemId] }));
  return {
    lessons,
    weeks: entry.weeks,
    goals: uniq(lessons.map((l) => l.sections["Mục tiêu"])),
    pitfalls: uniq(lessons.map((l) => l.sections["Bẫy"])),
    selfChecks: uniq(lessons.map((l) => l.sections["Tự kiểm tra"])),
    group: doc?.group ? groupGuides[doc.group] ?? null : null,
    hasAny: lessons.length > 0 || entry.weeks.length > 0,
  };
}

// ---------- Trạng thái bước ----------

// step.done: { kind, id?, pct?, learnedPct?, seenPct?, accuracy?, bestPct?, readPct? }
// Trả về { done: bool, progress: 0..100, detail: "72 % lộ trình" }
export function stepStatus(step, field) {
  const d = step.done ?? { kind: "manual" };
  switch (d.kind) {
    case "track": {
      const t = tracks.find((x) => x.id === d.id);
      if (!t) return { done: false, progress: 0, detail: "track không tồn tại" };
      const s = trackStats(t);
      const need = d.pct ?? 100;
      return { done: s.pct >= need, progress: Math.min(100, Math.round((s.pct / need) * 100)), detail: `${s.done}/${s.total} bài · ${s.pct}%` };
    }
    case "roadmap": {
      const s = roadmapStats(field);
      const need = d.pct ?? 100;
      return { done: s.pct >= need, progress: Math.min(100, Math.round((s.pct / need) * 100)), detail: `${s.done}/${s.total} bài · ${s.pct}%` };
    }
    case "docs": {
      const s = docsStats(field);
      const need = d.readPct ?? 100;
      return { done: s.pct >= need, progress: Math.min(100, Math.round((s.pct / need) * 100)), detail: `${s.read}/${s.total} tài liệu đã đọc` };
    }
    case "doc": {
      const read = !!store.get("docs.read", {})[d.id];
      return { done: read, progress: read ? 100 : 0, detail: read ? "đã đọc" : "chưa đọc" };
    }
    case "flashcards": {
      const s = flashStats(field);
      const need = d.learnedPct ?? 80;
      return { done: s.learnedPct >= need, progress: Math.min(100, Math.round((s.learnedPct / need) * 100)), detail: `${s.learned}/${s.total} thẻ đã học` };
    }
    case "quiz": {
      const s = quizStats(field);
      const needSeen = d.seenPct ?? 50;
      const needAcc = d.accuracy ?? 70;
      const okSeen = s.seenPct >= needSeen;
      const okAcc = (s.acc ?? 0) >= needAcc;
      const progress = Math.round((Math.min(1, s.seenPct / needSeen) * 50) + (Math.min(1, (s.acc ?? 0) / needAcc) * 50));
      return { done: okSeen && okAcc, progress, detail: `đã gặp ${s.seen}/${s.total} câu${s.acc != null ? ` · đúng ${s.acc}%` : ""}` };
    }
    case "exam": {
      const s = examStats();
      const need = d.bestPct ?? 66;
      const best = s.best ?? 0;
      return { done: best >= need, progress: Math.min(100, Math.round((best / need) * 100)), detail: s.count ? `tốt nhất ${best}% · ${s.count} lượt` : "chưa thi" };
    }
    case "tracker": {
      const s = matrixStats(field);
      const need = d.pct ?? 100;
      return { done: s.pct >= need, progress: Math.min(100, Math.round((s.pct / need) * 100)), detail: `${s.done}/${s.total} tiêu chí` };
    }
    case "manual":
    default: {
      const m = store.get("guide.manual", {});
      const on = !!m[step.id];
      return { done: on, progress: on ? 100 : 0, detail: on ? "đã tự đánh dấu" : "tự đánh dấu khi xong", manual: true };
    }
  }
}

export function setManualStep(stepId, on) {
  const m = store.get("guide.manual", {});
  if (on) m[stepId] = Date.now();
  else delete m[stepId];
  store.set("guide.manual", m);
}

// Tiến độ tổng của hướng dẫn một lĩnh vực + bước tiếp theo.
export function fieldProgress(field) {
  const g = fieldGuides[field];
  if (!g) return null;
  const steps = g.steps.map((s) => ({ step: s, status: stepStatus(s, field) }));
  const doneCount = steps.filter((s) => s.status.done).length;
  const progress = steps.length ? Math.round(steps.reduce((a, s) => a + s.status.progress, 0) / steps.length) : 0;
  const next = steps.find((s) => !s.status.done) ?? null;
  return { guide: g, steps, doneCount, total: steps.length, progress, next, pct: pct(doneCount, steps.length) };
}

export function trackGuide(trackId) {
  return trackGuides[trackId] ?? null;
}

// Track "bắt đầu tại đây" của lĩnh vực = track ở bước đầu tiên có kind "track".
export function firstTrackOf(field) {
  const g = fieldGuides[field];
  const s = g?.steps.find((x) => x.done?.kind === "track");
  return s?.done.id ?? null;
}
