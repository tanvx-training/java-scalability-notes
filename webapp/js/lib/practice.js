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

// Chương trình có đề thi (exam.domains không rỗng) hay chỉ là chương trình theo chủ đề.
// Không có đề thi thì không có độ phủ đề, ngưỡng đậu, domain của buổi hay kết quả mock.
export const hasExam = (program) =>
  !!(program && program.exam && Array.isArray(program.exam.domains) && program.exam.domains.length);

// Nhãn hiển thị của một mảng kỹ năng, lấy từ program.skillAreas; mảng không khai thì hiện đúng mã.
export function skillAreaLabel(program, areaId) {
  const a = ((program && program.skillAreas) || []).find((x) => x && x.id === areaId);
  return a && a.label ? a.label : areaId;
}

// Khối luyện tập của buổi: chương trình có đề khai session.exam, chương trình không đề khai session.work.
export const practiceData = (session) => (session && (session.exam ?? session.work)) || {};

const textOr = (v, fallback) => (typeof v === "string" && v.trim() ? v : fallback);
// Tiêu đề khối luyện tập khi chương trình không có đề thi; mặc định là chữ cũ.
export const workBlockTitle = (program) => textOr(program && program.labels && program.labels.workBlock, "🏋️ Luyện tập");
// Tiêu đề bước 1 trên trang chủ chương trình.
export const startStepTitle = (program) => textOr(program && program.labels && program.labels.startStep, "Khởi động lab");

// Chương trình có đề luôn hiện khối; chương trình không đề chỉ hiện khi buổi có dạng câu, câu luyện hay mốc thời gian.
export function hasPracticeBlock(program, session) {
  if (hasExam(program)) return true;
  const d = practiceData(session);
  return !!((d.patterns || []).length || (d.drills || []).length || d.timeTargetMin);
}

// Các dòng "Khác với sách" hợp lệ của buổi (rỗng nếu buổi không khai).
export const bookDiffRows = (session) =>
  Array.isArray(session && session.bookDiff)
    ? session.bookDiff.filter((d) => d && typeof d.book === "string" && typeof d.now === "string" && typeof d.why === "string")
    : [];

export const isDissect = (task) => !!task && task.kind === "dissect";

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
  if (!(perWeek > 0)) return null;
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
  if (!hasExam(program)) return fail("Chương trình này không có đề thi nên không nhận kết quả mock.");
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

// ---- Chuẩn hoá trạng thái đã lưu ----
// localStorage có thể chứa giá trị sai hình dạng (tệp nhập tay hay của app khác qua importAll): null, mảng,
// chuỗi, số… Mọi lần đọc đều qua đây để trang Thực hành không bao giờ văng lỗi vì dữ liệu lưu.
const isObj = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const isCount = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const normMap = (v) => (isObj(v) ? v : {});
function normNotes(v) {
  const out = {};
  for (const [k, x] of Object.entries(normMap(v))) if (typeof x === "string") out[k] = x;
  return out;
}
export function isMockRecord(r) {
  return isObj(r) && typeof r.program === "string" && typeof r.mock === "string" && typeof r.date === "string"
    && typeof r.total === "number" && Number.isFinite(r.total) && isObj(r.byDomain)
    && Object.values(r.byDomain).every((v) => isObj(v) && isCount(v.got) && isCount(v.max));
}
const normMock = (v) => (Array.isArray(v) ? v.filter(isMockRecord) : []);

// normalizeState({ done, tasks, notes, mock }): giá trị thô (bất kỳ) → đúng hình dạng spec mục 5.7.
export function normalizeState(raw) {
  const r = isObj(raw) ? raw : {};
  return { done: normMap(r.done), tasks: normMap(r.tasks), notes: normNotes(r.notes), mock: normMock(r.mock) };
}

// ---- Bọc store (nơi duy nhất đọc/ghi) ----
const NORM = { "practice.done": normMap, "practice.tasks": normMap, "practice.notes": normNotes, "practice.mock": normMock };

export function practiceState() {
  return normalizeState({
    done: store.get("practice.done", {}),
    tasks: store.get("practice.tasks", {}),
    notes: store.get("practice.notes", {}),
    mock: store.get("practice.mock", []),
  });
}

function patch(key, fn) {
  const cur = NORM[key](store.get(key, null));
  fn(cur);
  store.set(key, cur);
}

export function setDone(programId, sessionId, on) {
  const k = sessionKey(programId, sessionId);
  patch("practice.done", (d) => {
    if (on) d[k] = Date.now();
    else delete d[k];
  });
  if (on) recordActivity();
}

export function setTask(programId, sessionId, taskId, on) {
  const k = taskKey(programId, sessionId, taskId);
  patch("practice.tasks", (t) => {
    if (on) t[k] = true;
    else delete t[k];
  });
}

export function setNote(programId, sessionId, text) {
  const k = sessionKey(programId, sessionId);
  patch("practice.notes", (n) => {
    if (text) n[k] = text;
    else delete n[k];
  });
}

// Lưu một kết quả mock. Dán lại đúng dòng đã lưu (cùng chương trình, đề, ngày và điểm từng domain) thì bỏ qua.
// Trả true nếu đã thêm, false nếu là bản trùng.
export function addMockResult(record) {
  let added = false;
  patch("practice.mock", (list) => {
    const line = formatMockLine(record);
    if (list.some((r) => formatMockLine(r) === line)) return;
    list.push(record);
    added = true;
  });
  return added;
}
