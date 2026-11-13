// 🛠️ Thực hành — module toàn cục: chương trình thực hành trên lab thật.
// View này không biết chương trình cụ thể nào; mọi thứ riêng nằm ở data/practice/<id>/.
//
// Route: #/practice                 → danh sách chương trình (một chương trình thì vào thẳng)
//        #/practice/<p>             → trang chủ chương trình
//        #/practice/<p>/skills      → bản đồ kỹ năng        (Task 5)
//        #/practice/<p>/project     → project               (Task 5)
//        #/practice/<p>/mock[/<m>]  → đề mock               (Task 6)
//        #/practice/<p>/<sessionId> → một buổi              (Task 5)

import { h, pageHead, sectionTitle, codeNode, emptyState, inlineMd } from "../lib/ui.js";
import { PROGRAMS, getProgram } from "../data/practice/index.js";
import {
  RESERVED_SEGMENTS, findSession, findMock, orderedSessions, isPublished, isDone, doneCount, nextSession,
  stageProgress, domainCoverage, projectPieces, reviewFor, weeksLeft, practiceState, sessionKey,
} from "../lib/practice.js";

// Hàm dọn của trang đang mở (timer…). Task 5/6 đăng ký qua onCleanup().
let cleanups = [];
export const onCleanup = (fn) => { cleanups.push(fn); };
export function cleanup() {
  const list = cleanups;
  cleanups = [];
  for (const fn of list) { try { fn(); } catch { /* ignore */ } }
}

export function render(root, params = []) {
  cleanup();
  const [pid, sub, third] = params;
  if (!pid) return renderList(root);
  const program = getProgram(pid);
  if (!program) return renderMissing(root, pid);
  if (!sub) return renderHome(root, program);
  if (sub === "skills") return renderSkills(root, program);
  if (sub === "project") return renderProject(root, program);
  if (sub === "mock") return renderMock(root, program, third || null);
  if (RESERVED_SEGMENTS.includes(sub)) return renderHome(root, program);
  const session = findSession(program, sub);
  if (!session) return renderMissing(root, pid, `Không có buổi “${sub}” trong chương trình này.`);
  return renderSession(root, program, session);
}

// ---------- Chỗ Task 5 / Task 6 sẽ điền thân ----------

function underConstruction(root, program, title) {
  const page = h("div", { class: "page" },
    crumbs(program, title),
    emptyState("🚧", "Trang này đang xây", "Sẽ có ở đợt sau.",
      h("a", { class: "btn", href: `#/practice/${program.id}` }, "← Về trang chủ chương trình")));
  root.append(page);
}
function renderSession(root, program, session) { underConstruction(root, program, `Buổi ${session.id}`); }   // Task 5
function renderSkills(root, program) { underConstruction(root, program, "Kỹ năng"); }                         // Task 5
function renderProject(root, program) { underConstruction(root, program, "Project"); }                       // Task 5
function renderMock(root, program, mockId) {                                                                  // Task 6
  if (mockId && !findMock(program, mockId)) return renderMissing(root, program.id, `Không có đề mock “${mockId}”.`);
  underConstruction(root, program, mockId ? `Đề ${mockId}` : "Đề mock");
}

// ---------- Tiện ích ----------

function crumbs(program, last) {
  return h("div", { class: "breadcrumb" },
    h("a", { href: "#/practice" }, "Thực hành"), " / ",
    last ? [h("a", { href: `#/practice/${program.id}` }, program.label), " / ", last] : program.label);
}

// Điền <session> / <mock> / <id> vào mẫu lệnh trong env.commands.
const fill = (tpl, values) => tpl.replace(/<(\w+)>/g, (m, k) => (k in values ? values[k] : m));
const cmd = (text) => codeNode({ lang: "bash", text });
const indexOfSession = (program, id) => orderedSessions(program).findIndex((s) => s.id === id);
const stageOf = (program, session) => (program.stages || []).find((st) => st.id === session.stage) || null;
const domainOf = (program, session) =>
  ((program.exam && program.exam.domains) || []).find((d) => d.id === session.domain) || null;

function renderMissing(root, pid, desc) {
  root.append(h("div", { class: "page" },
    emptyState("🛠️", "Không tìm thấy", desc || `Chưa có chương trình thực hành “${pid}”.`,
      h("a", { class: "btn", href: "#/practice" }, "← Về danh sách chương trình"))));
}

// ---------- Danh sách chương trình ----------

function renderList(root) {
  if (PROGRAMS.length === 1) {
    location.replace(`#/practice/${PROGRAMS[0].id}`);
    return;
  }
  const state = practiceState();
  const page = h("div", { class: "page" },
    pageHead("🛠️ Thực hành", "Chương trình thực hành trên lab thật, từng buổi có tiêu chí xong rõ ràng.", "Kế hoạch"));
  if (!PROGRAMS.length) {
    page.append(emptyState("🛠️", "Chưa có chương trình nào"));
  } else {
    page.append(h("div", { class: "grid grid-2" }, PROGRAMS.map((p) => {
      const total = orderedSessions(p).length;
      const n = doneCount(p, state.done);
      return h("a", { class: "card card-link card-accent", href: `#/practice/${p.id}` },
        h("div", { class: "card-head" }, h("strong", {}, `${p.icon} ${p.label}`), h("span", { class: "faint" }, `${n}/${total} buổi`)),
        h("p", { class: "muted small mt0" }, p.name),
        h("div", { class: "progress thin" }, h("span", { style: `width:${total ? Math.round((n / total) * 100) : 0}%` })));
    })));
  }
  root.append(page);
}

// ---------- Trang chủ chương trình ----------

function renderHome(root, program) {
  const state = practiceState();
  const sessions = orderedSessions(program);
  const total = sessions.length;
  const n = doneCount(program, state.done);
  const pct = total ? Math.round((n / total) * 100) : 0;
  const next = nextSession(program, state.done);

  const page = h("div", { class: "page" });
  page.append(
    crumbs(program),
    pageHead(`${program.icon} ${program.label}`, program.name, "Thực hành"),
    h("div", { class: "card mb-4" },
      h("div", { class: "flex" },
        h("strong", {}, `${n} / ${total} buổi`),
        h("div", { class: `progress grow${pct >= 100 ? " green" : ""}` }, h("span", { style: `width:${pct}%` })),
        h("span", { class: "faint" }, n >= total ? "đã xong" : `còn khoảng ${weeksLeft(program, state.done)} tuần ở nhịp 3 buổi/tuần`)),
      h("div", { class: "chip-row mt-3" },
        h("a", { class: "chip", href: `#/practice/${program.id}/skills` }, "🧩 Bản đồ kỹ năng"),
        h("a", { class: "chip", href: `#/practice/${program.id}/project` }, "🏗️ Project"),
        h("a", { class: "chip", href: `#/practice/${program.id}/mock` }, "⏱️ Đề mock"))));

  page.append(todayBlock(program, state, next));
  page.append(projectBlock(program, state));
  page.append(stagesBlock(program, state, next));
  page.append(coverageBlock(program, state));
  const mock = latestMock(program, state);
  if (mock) page.append(mockBlock(program, mock));
  root.append(page);
}

function todayBlock(program, state, next) {
  const box = h("div", { class: "card card-accent mb-4" });
  if (!next) {
    box.append(h("div", { class: "card-head" }, h("strong", {}, "🎉 Đã xong toàn bộ chương trình")),
      h("p", { class: "muted mt0 mb0" }, "Mọi buổi đều đã hoàn thành. Làm các đề mock để tổng duyệt trước ngày thi."));
    return box;
  }
  const idx = indexOfSession(program, next.id) + 1;
  const stage = stageOf(program, next);
  const domain = domainOf(program, next);
  box.append(
    h("div", { class: "card-head" }, h("strong", {}, `▶ Buổi hôm nay: ${idx} · ${next.title}`)),
    h("div", { class: "chip-row mb-3" },
      stage ? h("span", { class: "badge" }, stage.title) : null,
      domain ? h("span", { class: "badge badge-blue" }, `${domain.label} ${domain.weight}%`) : null,
      next.durationMin ? h("span", { class: "badge" }, `⏱ ${next.durationMin} phút`) : null));

  if (!isPublished(next)) {
    box.append(h("p", { class: "muted mt0 mb0" },
      h("strong", {}, "Buổi này chưa có nội dung. "),
      "Khung buổi đã có (mục tiêu, kỹ năng, trạng thái đầu vào) nhưng phần nhiệm vụ và lời giải sẽ bổ sung ở đợt sau."));
    return box;
  }

  const { prev } = prevOf(program, next.id);
  const c = program.env.commands;
  const step1 = [
    cmd(c.up),
    cmd(fill(c.begin, { session: next.id })),
  ];
  const note = prev ? h("p", { class: "muted small mt-2 mb0" },
    "Nếu lệch trạng thái, đưa cluster về cuối buổi trước:",
    cmd(fill(c.restore, { session: prev.id }))) : null;

  const rf = reviewFor(program, next.id);
  const savedNote = prev ? state.notes[sessionKey(program.id, prev.id)] : null;
  const step2 = [
    rf
      ? h("div", {}, rf.review.map((r) =>
          h("details", { class: "mb-2" },
            h("summary", { html: inlineMd(r.q) }),
            h("p", { class: "muted mt-2 mb0", html: inlineMd(r.a) }))))
      : h("p", { class: "muted mt0" }, "Chưa có câu ôn từ buổi trước."),
    savedNote ? h("div", { class: "card mt-2" }, h("strong", { class: "small" }, "Ghi chú của anh ở buổi trước"), h("p", { class: "mt-1 mb0", style: "white-space:pre-wrap" }, savedNote)) : null,
  ];
  const step3 = h("a", { class: "btn btn-primary", href: `#/practice/${program.id}/${next.id}` }, `Bắt đầu buổi ${idx} →`);

  box.append(h("div", { class: "stepper" },
    step("1", "Khởi động cluster", step1, note),
    step("2", "Ôn nhanh buổi trước (5 phút)", step2),
    step("3", "Vào buổi", [step3])));
  return box;
}

const prevOf = (program, id) => {
  const list = orderedSessions(program);
  const i = list.findIndex((s) => s.id === id);
  return { prev: i > 0 ? list[i - 1] : null };
};

function step(num, title, body, extra) {
  return h("div", { class: "step current" },
    h("div", { class: "step-dot" }, num),
    h("div", { class: "step-body" }, h("h3", {}, title), body, extra || null));
}

function projectBlock(program, state) {
  const pieces = projectPieces(program, state.done);
  const have = pieces.filter((p) => p.have).length;
  const firstMissing = pieces.findIndex((p) => !p.have);
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "🏗️ Project đang lớn dần"), h("span", { class: "faint" }, `${have}/${pieces.length} phần`)),
    h("p", { class: "muted small mt0", html: inlineMd(program.project.summary) }),
    h("div", { class: "chip-row" }, pieces.map((p, i) =>
      h("span", { class: `badge ${p.have ? "badge-green" : i === firstMissing ? "badge-blue" : ""}`, style: p.have || i === firstMissing ? null : "opacity:.55" },
        p.have ? `✓ ${p.piece.label}` : p.piece.label))),
    h("a", { class: "btn btn-ghost btn-sm mt-3", href: `#/practice/${program.id}/project` }, "Xem sơ đồ hệ thống"));
}

function stagesBlock(program, state, next) {
  const rows = stageProgress(program, state.done);
  const curStage = next ? next.stage : null;
  const box = h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, `🗺️ Lộ trình ${rows.length} chặng`)));
  rows.forEach(({ stage, done, total }, i) => {
    const complete = total > 0 && done === total;
    const list = h("ul", { class: "pr-sessions" }, stage.sessions.map((id) => {
      const s = findSession(program, id);
      if (!s) return null;
      const ok = isDone(program, id, state.done);
      return h("li", {},
        h("span", { class: ok ? "text-green" : "faint" }, ok ? "✓" : "○"), " ",
        h("a", { href: `#/practice/${program.id}/${id}` }, `${indexOfSession(program, id) + 1}. ${s.title}`),
        isPublished(s) ? null : h("span", { class: "badge ml-2" }, "chưa có nội dung"));
    }));
    const det = h("details", { class: "pr-stage" },
      h("summary", {},
        h("span", { class: `pr-num${complete ? " ok" : stage.id === curStage ? " now" : ""}` }, complete ? "✓" : String(i)),
        h("span", { class: "grow" }, h("strong", {}, stage.title)),
        h("span", { class: "faint" }, `${done}/${total}`)),
      stage.goal ? h("p", { class: "muted small" }, stage.goal) : null,
      list);
    if (stage.id === curStage) det.open = true;
    box.append(det);
  });
  return box;
}

function coverageBlock(program, state) {
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "🎓 Độ phủ đề thi"),
      h("span", { class: "faint" }, `đậu từ ${program.exam.passPct}% · ${program.exam.durationMin} phút`)),
    domainCoverage(program, state.done).map(({ domain, done, total }) => {
      const pct = total ? Math.round((done / total) * 100) : 0;
      return h("div", { class: "pr-cov" },
        h("span", { class: "pr-cov-label" }, `${domain.label} (${domain.weight}%)`),
        h("div", { class: `progress thin grow${pct >= 100 ? " green" : ""}` }, h("span", { style: `width:${pct}%` })),
        h("span", { class: "faint" }, `${done}/${total}`));
    }));
}

function latestMock(program, state) {
  const mine = (state.mock || []).filter((m) => m.program === program.id);
  if (!mine.length) return null;
  return mine.reduce((a, b) => (b.date >= a.date ? b : a));
}

function mockBlock(program, rec) {
  const pass = rec.total >= program.exam.passPct;
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "⏱️ Điểm mock gần nhất"), h("span", { class: "faint" }, `${rec.mock} · ${rec.date}`)),
    h("div", { class: "flex" },
      h("span", { class: `badge badge-${pass ? "green" : "amber"}` }, `${rec.total}%`),
      h("span", { class: "muted small" }, pass ? `Đạt ngưỡng ${program.exam.passPct}%` : `Chưa đạt ngưỡng ${program.exam.passPct}%`)),
    h("a", { class: "btn btn-ghost btn-sm mt-3", href: `#/practice/${program.id}/mock` }, "Mở đề mock"));
}
