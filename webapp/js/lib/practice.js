// Logic thuần của module Thực hành: nhận chương trình + trạng thái làm tham số.
// Chỉ bốn hàm bọc ở cuối tệp mới đọc/ghi store.
import { store } from "./store.js";
import { recordActivity } from "./activity.js";

export const RESERVED_SEGMENTS = ["skills", "project", "mock"];

export const sessionKey = (programId, sessionId) => `${programId}:${sessionId}`;
export const taskKey = (programId, sessionId, taskId) => `${programId}:${sessionId}:${taskId}`;

export function findSession(program, sessionId) {
  return (program.sessions || []).find((s) => s.id === sessionId) || null;
}
export function findMock(program, mockId) {
  return (program.mocks || []).find((m) => m.id === mockId) || null;
}

export function orderedSessions(program) {
  const out = [];
  for (const st of program.stages || []) {
    for (const id of st.sessions || []) {
      const s = findSession(program, id);
      if (s) out.push(s);
    }
  }
  return out;
}

export const isPublished = (session) => !!session && session.status === "published";

export function isDone(program, sessionId, done) {
  const s = findSession(program, sessionId);
  return !!s && isPublished(s) && !!(done || {})[sessionKey(program.id, sessionId)];
}

export function doneCount(program, done) {
  return orderedSessions(program).filter((s) => isDone(program, s.id, done)).length;
}

export function nextSession(program, done) {
  return orderedSessions(program).find((s) => !isDone(program, s.id, done)) || null;
}

export function neighbors(program, sessionId) {
  const list = orderedSessions(program);
  const i = list.findIndex((s) => s.id === sessionId);
  if (i < 0) return { prev: null, next: null };
  return { prev: list[i - 1] || null, next: list[i + 1] || null };
}

export function missingRequires(program, sessionId, done) {
  const s = findSession(program, sessionId);
  if (!s) return [];
  return (s.requires || []).filter((id) => !isDone(program, id, done));
}

export function stageProgress(program, done) {
  return (program.stages || []).map((stage) => {
    const ids = (stage.sessions || []).filter((id) => findSession(program, id));
    return { stage, done: ids.filter((id) => isDone(program, id, done)).length, total: ids.length };
  });
}

export function domainCoverage(program, done) {
  const list = orderedSessions(program).filter((s) => s.domain);
  return ((program.exam && program.exam.domains) || []).map((domain) => {
    const mine = list.filter((s) => s.domain === domain.id);
    return { domain, done: mine.filter((s) => isDone(program, s.id, done)).length, total: mine.length };
  });
}

export function weeksLeft(program, done, perWeek = 3) {
  const left = orderedSessions(program).length - doneCount(program, done);
  return Math.ceil(left / perWeek);
}

export function projectPieces(program, done) {
  const sessions = orderedSessions(program);
  return ((program.project && program.project.pieces) || []).map((piece) => ({
    piece,
    have: sessions.some((s) => (s.pieces || []).includes(piece.id) && isDone(program, s.id, done)),
  }));
}

export function skillIndex(program, skills) {
  const sessions = orderedSessions(program);
  return (skills || []).map((skill) => {
    const learned = sessions.find((s) => (s.skills || []).some((x) => x.skill === skill.id));
    return {
      skill,
      learnedIn: learned ? learned.id : null,
      usedIn: sessions.filter((s) => (s.uses || []).includes(skill.id)).map((s) => s.id),
    };
  });
}

export function reviewFor(program, sessionId) {
  const { prev } = neighbors(program, sessionId);
  if (!prev || !prev.review || prev.review.length === 0) return null;
  return { session: prev, review: prev.review };
}

// ---- Kết quả đề mock ----
const MOCK_PREFIX = "devprep-mock";

export function formatMockLine(record) {
  const parts = Object.entries(record.byDomain).map(([d, v]) => `${d}=${v.got}/${v.max}`);
  return [MOCK_PREFIX, "v1", record.program, record.mock, record.date, parts.join(",")].join(":");
}

const fail = (error) => ({ ok: false, error });

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

export function parseMockResult(line, program) {
  const text = String(line == null ? "" : line).trim();
  if (!text) return fail("Dòng kết quả trống.");
  const f = text.split(":");
  if (f[0] !== MOCK_PREFIX || f.length !== 6) return fail("Không đúng định dạng devprep-mock.");
  if (f[1] !== "v1") return fail(`Phiên bản không hỗ trợ: ${f[1]}.`);
  const [, , programId, mockId, date, rest] = f;
  if (programId !== program.id) return fail(`Kết quả thuộc chương trình khác: ${programId}.`);
  if (!findMock(program, mockId)) return fail(`Không có đề mock ${mockId}.`);
  if (!validDate(date)) return fail(`Ngày không hợp lệ: ${date}.`);
  const byDomain = {};
  for (const part of rest.split(",")) {
    const m = /^([^=]+)=(\d+)\/(\d+)$/.exec(part);
    if (!m) return fail(`Phần điểm không hợp lệ: ${part}.`);
    const [, d, got, max] = m;
    if (!(program.exam.domains || []).some((x) => x.id === d)) return fail(`Domain lạ: ${d}.`);
    if (Object.prototype.hasOwnProperty.call(byDomain, d)) return fail(`Trùng domain: ${d}.`);
    if (+got > +max) return fail(`Điểm vượt tối đa ở ${d}.`);
    byDomain[d] = { got: +got, max: +max };
  }
  const missing = program.exam.domains.filter((x) => !(x.id in byDomain)).map((x) => x.id);
  if (missing.length) return fail(`Thiếu domain: ${missing.join(", ")}.`);
  const vals = Object.values(byDomain);
  const got = vals.reduce((a, v) => a + v.got, 0);
  const max = vals.reduce((a, v) => a + v.max, 0);
  const total = max > 0 ? Math.round((got / max) * 100) : 0;
  return { ok: true, record: { program: programId, mock: mockId, date, total, byDomain } };
}

// ---- Bọc store (nơi duy nhất đọc/ghi) ----
export function practiceState() {
  return {
    done: store.get("practice.done", {}),
    tasks: store.get("practice.tasks", {}),
    notes: store.get("practice.notes", {}),
    mock: store.get("practice.mock", []),
  };
}

function patch(key, fallback, fn) {
  const cur = store.get(key, fallback);
  fn(cur);
  store.set(key, cur);
}

export function setDone(programId, sessionId, on) {
  const k = sessionKey(programId, sessionId);
  patch("practice.done", {}, (d) => {
    if (on) d[k] = Date.now();
    else delete d[k];
  });
  if (on) recordActivity();
}

export function setTask(programId, sessionId, taskId, on) {
  const k = taskKey(programId, sessionId, taskId);
  patch("practice.tasks", {}, (t) => {
    if (on) t[k] = true;
    else delete t[k];
  });
}

export function setNote(programId, sessionId, text) {
  const k = sessionKey(programId, sessionId);
  patch("practice.notes", {}, (n) => {
    if (text) n[k] = text;
    else delete n[k];
  });
}

export function addMockResult(record) {
  patch("practice.mock", [], (list) => list.push(record));
}
