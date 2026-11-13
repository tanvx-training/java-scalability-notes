// 🛠️ Thực hành — module toàn cục: chương trình thực hành trên lab thật.
// View này không biết chương trình cụ thể nào; mọi thứ riêng nằm ở data/practice/<id>/.
//
// Route: #/practice                 → danh sách chương trình (một chương trình thì vào thẳng)
//        #/practice/<p>             → trang chủ chương trình
//        #/practice/<p>/skills      → bản đồ kỹ năng        (Task 5)
//        #/practice/<p>/project     → project               (Task 5)
//        #/practice/<p>/mock[/<m>]  → đề mock               (Task 6)
//        #/practice/<p>/<sessionId> → một buổi              (Task 5)

import { h, pageHead, sectionTitle, codeNode, emptyState, inlineMd, mdInto, toast } from "../lib/ui.js";
import { createStopwatch } from "../lib/timer.js";
import { pushRecent } from "../lib/activity.js";
import { goTo } from "../lib/search.js";
import { PROGRAMS, getProgram } from "../data/practice/index.js";
import {
  RESERVED_SEGMENTS, findSession, findMock, orderedSessions, isPublished, isDone, doneCount, nextSession,
  stageProgress, domainCoverage, projectPieces, reviewFor, weeksLeft, practiceState, sessionKey, taskKey,
  neighbors, missingRequires, setDone, setTask, setNote,
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
    savedNote ? h("div", { class: "card mt-2" }, h("strong", { class: "small" }, "Ghi chú của bạn ở buổi trước"), h("p", { class: "mt-1 mb0", style: "white-space:pre-wrap" }, savedNote)) : null,
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

// ---------- Trang một buổi ----------

const SKILL_GROUPS = [
  ["command", "⌨️ Lệnh"], ["yaml", "📄 YAML"], ["procedure", "🧭 Quy trình"],
  ["concept", "💡 Khái niệm"], ["docs", "🔖 Trang docs"], ["path", "📁 File và đường dẫn"],
];
const AREA_LABEL = { vim: "vim", linux: "Linux", network: "Network" }; // khu vực khác hiện đúng mã khu vực
// Cùng đích với lib/search.js: loại ref → trang Thực hành nhanh.
const REF_HREF = { command: "#/commands", snippet: "#/commands/yaml", playbook: "#/commands/playbooks" };

function block(title, ...body) {
  return h("div", { class: "card mb-4" }, h("div", { class: "card-head" }, h("strong", {}, title)), body);
}
function md(text, cls = "prose") { const n = h("div", { class: cls }); mdInto(n, text); return n; }
function reveal(title, ...body) {
  return h("details", { class: "reveal" }, h("summary", {}, title), h("div", { class: "reveal-body" }, body));
}

function skillLink(program, skill) {
  const ref = skill.ref;
  const base = ref && REF_HREF[ref.type];
  if (!base) return h("span", {}, skill.label);
  // Dùng goTo() của search.js: đặt hash rồi cuộn tới anchor và làm nổi thẻ.
  const item = { field: program.field, href: base, anchor: ref.id };
  return h("a", { href: base, title: "Mở trong Thực hành nhanh", onclick: (e) => { e.preventDefault(); goTo(item); } }, skill.label);
}

function skillsBlock(program, session) {
  const byId = new Map((program.skills || []).map((s) => [s.id, s]));
  const rows = (session.skills || []).map((x) => ({ skill: byId.get(x.skill), level: x.level })).filter((r) => r.skill);
  if (!rows.length) return null;
  const table = h("table", { class: "table pr-skills" },
    h("thead", {}, h("tr", {}, h("th", {}, "Kỹ năng"), h("th", {}, "Mức cần đạt"))));
  const body = h("tbody");
  for (const [kind, label] of SKILL_GROUPS) {
    const group = rows.filter((r) => r.skill.kind === kind);
    if (!group.length) continue;
    body.append(h("tr", { class: "pr-group" }, h("th", { colspan: 2 }, label)));
    for (const r of group) body.append(h("tr", {}, h("td", {}, skillLink(program, r.skill)), h("td", { class: "muted" }, r.level)));
  }
  table.append(body);
  return block("🧰 Sau buổi này bạn làm được", h("div", { class: "table-wrap" }, table));
}

function sessionHead(program, session, idx) {
  const stage = stageOf(program, session);
  const domain = domainOf(program, session);
  const req = (session.requires || []).map((id) => findSession(program, id)).filter(Boolean);
  return [
    crumbs(program, `Buổi ${idx}`),
    pageHead(`${idx}. ${session.title}`, stage ? stage.title : "", `${program.label} · Buổi ${idx}`),
    h("div", { class: "chip-row mb-4" },
      domain ? h("span", { class: "badge badge-blue" }, `${domain.label} ${domain.weight}%`) : null,
      session.durationMin ? h("span", { class: "badge" }, `⏱ ${session.durationMin} phút`) : null,
      req.map((r) => h("a", { class: "badge", href: `#/practice/${program.id}/${r.id}` }, `Cần: ${r.title}`))),
  ];
}

function stateBlock(title, text) { return text ? block(title, md(text)) : null; }

function renderSession(root, program, session) {
  const idx = indexOfSession(program, session.id) + 1;
  const state = practiceState();
  const page = h("div", { class: "page" }, sessionHead(program, session, idx));

  if ((session.goals || []).length) {
    page.append(block("🎯 Mục tiêu", h("ul", { class: "pr-list" }, session.goals.map((g) => h("li", { html: inlineMd(g) })))));
  }
  // Native append(null) in ra chữ "null": chỉ nối các khối có thật.
  const add = (...nodes) => page.append(...nodes.filter(Boolean));
  add(skillsBlock(program, session));

  if (!isPublished(session)) {
    add(stateBlock("📥 Trạng thái đầu vào", session.stateIn), stateBlock("📤 Trạng thái đầu ra", session.stateOut));
    page.append(emptyState("🚧", "Nội dung buổi này sẽ phát hành ở đợt sau", "Khung buổi đã có; nhiệm vụ, gợi ý và lời giải sẽ bổ sung sau."));
    page.append(sessionNav(program, session));
    pushRecentSession(program, session, idx);
    root.append(page);
    return;
  }

  if (session.foundation) {
    page.append(block(`🧱 Nền tảng cần cho buổi này${session.foundation.area ? ` · ${AREA_LABEL[session.foundation.area] || session.foundation.area}` : ""}`, md(session.foundation.md)));
  }
  page.append(block("🧠 Tư duy", md(session.mindset)));
  if ((session.refs || []).length) {
    page.append(block("📖 Tham chiếu", h("ul", { class: "pr-list" }, session.refs.map((r) => {
      const ext = !String(r.href).startsWith("#/");
      return h("li", {}, h("a", ext ? { href: r.href, target: "_blank", rel: "noopener" } : { href: r.href }, r.label, ext ? " ↗" : ""));
    }))));
  }
  add(stateBlock("📥 Trạng thái đầu vào", session.stateIn));
  page.append(tasksBlock(program, session, state));
  page.append(hintsBlock(session));
  page.append(examBlock(program, session));
  if ((session.tips || []).length) {
    page.append(block("⚡ Tips", h("ul", { class: "pr-list" }, session.tips.map((t) => h("li", { html: inlineMd(t) })))));
  }
  page.append(outcomeBlock(session));
  page.append(finishBlock(program, session, state));
  page.append(sessionNav(program, session));
  pushRecentSession(program, session, idx);
  root.append(page);
}

function pushRecentSession(program, session, idx) {
  pushRecent({ type: "lab", icon: program.icon, title: `Buổi ${idx}: ${session.title}`, sub: program.label,
    field: program.field, href: `#/practice/${program.id}/${session.id}` });
}

function tasksBlock(program, session, state) {
  const tasks = session.tasks || [];
  const count = h("span", { class: "faint" });
  const refresh = () => {
    const n = tasks.filter((t) => practiceState().tasks[taskKey(program.id, session.id, t.id)]).length;
    count.textContent = `${n} / ${tasks.length} bước`;
  };
  const list = h("div", { class: "pr-tasks" }, tasks.map((t) => {
    const box = h("input", { type: "checkbox", id: `pr-${session.id}-${t.id}` });
    box.checked = !!state.tasks[taskKey(program.id, session.id, t.id)];
    box.addEventListener("change", () => { setTask(program.id, session.id, t.id, box.checked); refresh(); });
    return h("label", { class: "pr-task", for: box.id }, box, h("span", { html: inlineMd(t.text) }));
  }));
  refresh();
  return h("div", { class: "card mb-4" }, h("div", { class: "card-head" }, h("strong", {}, "📋 Nhiệm vụ"), count), list);
}

function hintsBlock(session) {
  const hints = session.hints || [];
  return h("div", { class: "mb-4" },
    hints.map((t, i) => reveal(`💡 Gợi ý ${i + 1}`, h("p", { class: "mt0 mb0", html: inlineMd(t) }))),
    session.solution ? reveal("🔓 Cách xử lý", md(session.solution)) : null);
}

function examBlock(program, session) {
  const domain = domainOf(program, session);
  const ex = session.exam || {};
  const box = block(`🎓 Trong đề thi${domain ? ` · ${domain.label} ${domain.weight}%` : ""}`);
  if ((ex.patterns || []).length) {
    box.append(h("p", { class: "muted small mt0" }, "Dạng câu thường gặp:"),
      h("ul", { class: "pr-list" }, ex.patterns.map((t) => h("li", { html: inlineMd(t) }))));
  }
  if (ex.timeTargetMin) box.append(h("p", { class: "small" }, `⏱ Thời gian mục tiêu trong phòng thi: `, h("strong", {}, `${ex.timeTargetMin} phút`), " cho mỗi câu dạng này."));
  (ex.drills || []).forEach((d, i) => {
    const slot = h("span", { class: "pr-drill-clock" });
    const det = h("details", { class: "reveal" },
      h("summary", {}, `Câu luyện ${i + 1}`, d.timeLimitMin ? ` · giới hạn ${d.timeLimitMin} phút` : "", " ", slot),
      h("div", { class: "reveal-body" }, h("div", { html: inlineMd(d.text) }), reveal("Lời giải", md(d.solution))));
    let sw = null, used = false;
    // Bấm giờ khi mở câu, dừng khi đóng; mỗi câu chỉ bấm một lần.
    det.addEventListener("toggle", () => {
      if (det.open && !used) {
        used = true;
        sw = createStopwatch({ limitSec: d.timeLimitMin ? d.timeLimitMin * 60 : undefined });
        slot.append(sw.el); // gắn vào DOM ngay, trước nhịp đầu (timer.js tự dừng nếu el chưa gắn)
        onCleanup(sw.stop);
      } else if (!det.open && sw) sw.stop();
    });
    box.append(det);
  });
  return box;
}

function outcomeBlock(session) {
  const o = session.outcome || {};
  return block("✅ Kết quả mong muốn", md(o.md),
    o.verifyOutput ? [h("p", { class: "small muted mb-1" }, "Output kỳ vọng của ", h("code", {}, "./lab verify"), ":"), cmd(o.verifyOutput)] : null,
    o.projectDelta ? h("p", { class: "small mt-2 mb0" }, h("strong", {}, "Project thay đổi: "), h("span", { html: inlineMd(o.projectDelta) })) : null);
}

function finishBlock(program, session, state) {
  const doneBtn = h("button", { class: "btn" });
  const paint = () => {
    const on = isDone(program, session.id, practiceState().done);
    doneBtn.textContent = on ? "✓ Đã hoàn thành (bấm để bỏ)" : "Đánh dấu hoàn thành";
    doneBtn.className = on ? "btn" : "btn btn-primary";
  };
  doneBtn.addEventListener("click", () => {
    const on = !isDone(program, session.id, practiceState().done);
    setDone(program.id, session.id, on);
    if (on) {
      const miss = missingRequires(program, session.id, practiceState().done);
      if (miss.length) toast(`Bạn còn thiếu buổi tiên quyết: ${miss.map((id) => (findSession(program, id) || {}).title || id).join("; ")}`, "info", 5000);
    }
    paint();
  });
  paint();

  const noteKey = sessionKey(program.id, session.id);
  const area = h("textarea", { class: "input", rows: 4, placeholder: "Điều bạn rút ra, chỗ vấp, lệnh cần nhớ…" });
  area.value = state.notes[noteKey] || "";
  const save = () => setNote(program.id, session.id, area.value.trim());
  area.addEventListener("blur", save);
  onCleanup(save); // rời trang khi đang gõ dở vẫn giữ được

  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "Hoàn thành & ghi chú")),
    h("p", { class: "muted small mt0" }, "Bấm sau khi ", h("code", {}, "./lab verify"), " đạt."), doneBtn,
    h("label", { class: "small muted mt-3", style: "display:block", for: "pr-note" }, "Ghi chú của tôi (hiện ở bước ôn của buổi kế tiếp)"),
    (area.id = "pr-note", area));
}

function sessionNav(program, session) {
  const { prev, next } = neighbors(program, session.id);
  const link = (s, label, cls) => s
    ? h("a", { class: `btn ${cls}`, href: `#/practice/${program.id}/${s.id}` }, `${label} ${s.title}`)
    : h("span");
  return h("div", { class: "flex pr-nav" }, link(prev, "←", "btn-ghost"), h("span", { class: "grow" }), link(next, "→", "btn-ghost"));
}
