// 🛠️ Thực hành — module toàn cục: chương trình thực hành trên lab thật.
// View này không biết chương trình cụ thể nào; mọi thứ riêng nằm ở data/practice/<id>/.
//
// Route: #/practice                 → danh sách chương trình (một chương trình thì vào thẳng)
//        #/practice/<p>             → trang chủ chương trình
//        #/practice/<p>/skills      → bản đồ kỹ năng
//        #/practice/<p>/project     → project
//        #/practice/<p>/mock[/<m>]  → danh sách đề mock / một đề
//        #/practice/<p>/<sessionId> → một buổi

import { h, pageHead, sectionTitle, codeNode, emptyState, inlineMd, mdInto, toast } from "../lib/ui.js";
import { createStopwatch, createCountdown } from "../lib/timer.js";
import { pushRecent } from "../lib/activity.js";
import { goTo } from "../lib/search.js";
import { renderMermaidBlocks } from "../lib/mermaid.js";
import { PROGRAMS, getProgram } from "../data/practice/index.js";
import {
  RESERVED_SEGMENTS, findSession, findMock, orderedSessions, isPublished, isDone, doneCount, nextSession, hasExam, skillAreaLabel,
  stageProgress, domainCoverage, projectPieces, reviewFor, weeksLeft, practiceState, sessionKey, taskKey,
  neighbors, missingRequires, practiceData, workBlockTitle, startStepTitle, hasPracticeBlock, bookDiffRows, isDissect, setDone, setTask, setNote, skillIndex, parseMockResult, addMockResult,
} from "../lib/practice.js";

// Hàm dọn của trang đang mở (timer…), đăng ký qua onCleanup().
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

// ---------- Tiện ích ----------

function crumbs(program, last) {
  return h("div", { class: "breadcrumb" },
    h("a", { href: "#/practice" }, "Thực hành"), " / ",
    last ? [h("a", { href: `#/practice/${program.id}` }, program.label), " / ", last] : program.label);
}

// Điền <session> / <mock> / <id> vào mẫu lệnh trong env.commands.
const fill = (tpl, values) => tpl.replace(/<(\w+)>/g, (m, k) => (k in values ? values[k] : m));
// Lệnh lab của chương trình (env.commands[key]) đã điền chỗ trống; null nếu chương trình không khai.
const labCmd = (program, key, values = {}) => {
  const tpl = ((program.env && program.env.commands) || {})[key];
  return typeof tpl === "string" && tpl ? fill(tpl, values) : null;
};
const cmd = (text) => codeNode({ lang: "bash", text });
const indexOfSession = (program, id) => orderedSessions(program).findIndex((s) => s.id === id);
const stageOf = (program, session) => (program.stages || []).find((st) => st.id === session.stage) || null;
const domainOf = (program, session) =>
  ((program.exam && program.exam.domains) || []).find((d) => d.id === session.domain) || null;

function renderMissing(root, pid, desc) {
  root.append(h("div", { class: "page pr-page" },
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
  const page = h("div", { class: "page pr-page" },
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
  const exam = hasExam(program);
  // Chương trình có đề thi thì hiện nhịp tới ngày thi; chương trình theo chủ đề thì chỉ hiện tiến độ.
  const pace = n >= total ? "đã xong" : exam ? `còn khoảng ${weeksLeft(program, state.done)} tuần ở nhịp 3 buổi/tuần` : null;

  const page = h("div", { class: "page pr-page" });
  page.append(
    crumbs(program),
    pageHead(`${program.icon} ${program.label}`, program.name, "Thực hành"),
    h("div", { class: "card mb-4" },
      h("div", { class: "flex" },
        h("strong", {}, `${n} / ${total} buổi`),
        h("div", { class: `progress grow${pct >= 100 ? " green" : ""}` }, h("span", { style: `width:${pct}%` })),
        pace ? h("span", { class: "faint" }, pace) : null),
      h("div", { class: "chip-row mt-3" },
        h("a", { class: "chip", href: `#/practice/${program.id}/skills` }, "🧩 Bản đồ kỹ năng"),
        hasProject(program) ? h("a", { class: "chip", href: `#/practice/${program.id}/project` }, "🏗️ Project") : null,
        hasMockPage(program) ? h("a", { class: "chip", href: `#/practice/${program.id}/mock` }, "⏱️ Đề mock") : null)));

  page.append(todayBlock(program, state, next));
  if (hasProject(program)) page.append(projectBlock(program, state));
  page.append(stagesBlock(program, state, next));
  if (exam) {
    page.append(coverageBlock(program, state));
    const mock = latestMock(program, state);
    if (mock) page.append(mockBlock(program, mock));
  }
  root.append(page);
}

const hasProject = (program) => !!(program.project && (program.project.summary || (program.project.pieces || []).length));
// Trang đề mock: có đề, hoặc chương trình có đề thi (đề sẽ phát hành sau).
const hasMockPage = (program) => (program.mocks || []).length > 0 || hasExam(program);

function todayBlock(program, state, next) {
  const box = h("div", { class: "card card-accent mb-4" });
  if (!next) {
    box.append(h("div", { class: "card-head" }, h("strong", {}, "🎉 Đã xong toàn bộ chương trình")),
      h("p", { class: "muted mt0 mb0" }, hasMockPage(program)
        ? "Mọi buổi đều đã hoàn thành. Làm các đề mock để tổng duyệt trước ngày thi."
        : "Mọi buổi đều đã hoàn thành."));
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
  const step1 = [labCmd(program, "up"), labCmd(program, "begin", { session: next.id })].filter(Boolean).map(cmd);
  const restore = prev ? labCmd(program, "restore", { session: prev.id }) : null;
  const note = restore ? h("p", { class: "muted small mt-2 mb0" },
    "Nếu lệch trạng thái, đưa lab về cuối buổi trước:", cmd(restore)) : null;

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
    step("1", startStepTitle(program), step1, note),
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
    program.project.summary ? h("p", { class: "muted small mt0", html: inlineMd(program.project.summary) }) : null,
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
        h("span", { class: `pr-num${complete ? " ok" : stage.id === curStage ? " now" : ""}` }, complete ? "✓" : String(Number.isFinite(stage.num) ? stage.num : i)),
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
      h("span", { class: "faint" }, [passPctOf(program) == null ? null : `đậu từ ${passPctOf(program)}%`,
        typeof program.exam.durationMin === "number" ? `${program.exam.durationMin} phút` : null].filter(Boolean).join(" · "))),
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
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "⏱️ Điểm mock gần nhất"), h("span", { class: "faint" }, `${rec.mock} · ${rec.date}`)),
    h("div", { class: "flex" }, passBadge(program, rec.total)),
    h("a", { class: "btn btn-ghost btn-sm mt-3", href: `#/practice/${program.id}/mock` }, "Mở đề mock"));
}

// ---------- Trang một buổi ----------

const SKILL_GROUPS = [
  ["command", "⌨️ Lệnh"], ["yaml", "📄 YAML"], ["procedure", "🧭 Quy trình"],
  ["concept", "💡 Khái niệm"], ["docs", "🔖 Trang docs"], ["path", "📁 File và đường dẫn"],
];
// Cùng đích với lib/search.js: loại ref → trang Thực hành nhanh.
const REF_HREF = { command: "#/commands", snippet: "#/commands/yaml", playbook: "#/commands/playbooks" };

function block(title, ...body) {
  return h("div", { class: "card mb-4" }, h("div", { class: "card-head" }, h("strong", {}, title)), body);
}
function md(text, cls = "prose") {
  const n = h("div", { class: cls });
  mdInto(n, text);
  renderMermaidBlocks(n); // async; chờ n được gắn vào trang rồi mới thay bằng SVG
  return n;
}
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
  const page = h("div", { class: "page pr-page" }, sessionHead(program, session, idx));

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

  if (session.kind === "mock") {
    // Buổi mock là trang mỏng: dẫn sang danh sách đề, không có khối bài học.
    add(stateBlock("📥 Trạng thái đầu vào", session.stateIn), stateBlock("📤 Trạng thái đầu ra", session.stateOut));
    page.append(block("⏱️ Làm đề mock",
      h("p", { class: "muted mt0" }, "Buổi này làm trọn một đề thi thử bấm giờ trên cluster lab, rồi dán dòng kết quả vào app để xem điểm theo domain."),
      h("a", { class: "btn btn-primary", href: `#/practice/${program.id}/mock` }, "Mở danh sách đề mock →")));
    page.append(finishBlock(program, session, state));
    page.append(sessionNav(program, session));
    pushRecentSession(program, session, idx);
    root.append(page);
    return;
  }

  if (session.foundation) {
    page.append(block(`🧱 Nền tảng cần cho buổi này${session.foundation.area ? ` · ${skillAreaLabel(program, session.foundation.area)}` : ""}`, md(session.foundation.md)));
  }
  page.append(block("🧠 Tư duy", md(session.mindset)));
  add(bookDiffBlock(session));
  if ((session.refs || []).length) {
    page.append(block("📖 Tham chiếu", h("ul", { class: "pr-list" }, session.refs.map((r) => {
      const ext = !String(r.href).startsWith("#/");
      return h("li", {}, h("a", ext ? { href: r.href, target: "_blank", rel: "noopener" } : { href: r.href }, r.label, ext ? " ↗" : ""));
    }))));
  }
  add(stateBlock("📥 Trạng thái đầu vào", session.stateIn));
  page.append(tasksBlock(program, session, state));
  page.append(hintsBlock(session));
  add(examBlock(program, session));
  if ((session.tips || []).length) {
    page.append(block("⚡ Tips", h("ul", { class: "pr-list" }, session.tips.map((t) => h("li", { html: inlineMd(t) })))));
  }
  page.append(outcomeBlock(program, session));
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
    return h("label", { class: "pr-task", for: box.id }, box, ...(isDissect(t) ? [h("span", { class: "badge" }, "mổ xẻ"), " "] : []), h("span", { html: inlineMd(t.text) }));
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

function bookDiffBlock(session) {
  const rows = bookDiffRows(session);
  if (!rows.length) return null;
  const table = h("table", { class: "table" },
    h("thead", {}, h("tr", {}, h("th", {}, "Sách"), h("th", {}, "Bản đang chạy"), h("th", {}, "Vì sao"))),
    h("tbody", {}, rows.map((r) => h("tr", {},
      h("td", { html: inlineMd(r.book) }), h("td", { html: inlineMd(r.now) }), h("td", { class: "muted", html: inlineMd(r.why) })))));
  return block("📕 Khác với sách", h("div", { class: "table-wrap" }, table));
}

function examBlock(program, session) {
  const domain = domainOf(program, session);
  const ex = practiceData(session);
  const exam = hasExam(program);
  // Chương trình không có đề thi: chỉ hiện khối khi buổi có câu luyện hay dạng câu để làm.
  if (!hasPracticeBlock(program, session)) return null;
  const box = block(exam ? `🎓 Trong đề thi${domain ? ` · ${domain.label} ${domain.weight}%` : ""}` : workBlockTitle(program));
  if ((ex.patterns || []).length) {
    box.append(h("p", { class: "muted small mt0" }, "Dạng câu thường gặp:"),
      h("ul", { class: "pr-list" }, ex.patterns.map((t) => h("li", { html: inlineMd(t) }))));
  }
  if (ex.timeTargetMin) box.append(h("p", { class: "small" }, exam ? "⏱ Thời gian mục tiêu trong phòng thi: " : "⏱ Thời gian mục tiêu: ", h("strong", {}, `${ex.timeTargetMin} phút`), " cho mỗi câu dạng này."));
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

function outcomeBlock(program, session) {
  const o = session.outcome || {};
  const verify = labCmd(program, "verify", { session: session.id });
  return block("✅ Kết quả mong muốn", md(o.md),
    o.verifyOutput ? [h("p", { class: "small muted mb-1" }, "Output kỳ vọng của ", verify ? h("code", {}, verify) : "bước kiểm", ":"), cmd(o.verifyOutput)] : null,
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

  const verify = labCmd(program, "verify", { session: session.id });
  const noteKey = sessionKey(program.id, session.id);
  const area = h("textarea", { class: "input", rows: 4, placeholder: "Điều bạn rút ra, chỗ vấp, lệnh cần nhớ…" });
  area.value = state.notes[noteKey] || "";
  const save = () => setNote(program.id, session.id, area.value.trim());
  area.addEventListener("blur", save);
  onCleanup(save); // rời trang khi đang gõ dở vẫn giữ được

  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "Hoàn thành & ghi chú")),
    h("p", { class: "muted small mt0" }, "Bấm sau khi ", verify ? h("code", {}, verify) : "bước kiểm", " đạt."), doneBtn,
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

// ---------- Bản đồ kỹ năng ----------

const KIND_LABEL = Object.fromEntries(SKILL_GROUPS);
const areaLabel = skillAreaLabel;
const sessionLink = (program, id) => {
  const s = findSession(program, id);
  if (!s) return null;
  return h("a", { href: `#/practice/${program.id}/${id}`, title: s.title }, `Buổi ${indexOfSession(program, id) + 1}`);
};
const joinNodes = (nodes) => nodes.flatMap((n, i) => (i ? [", ", n] : [n]));

function renderSkills(root, program) {
  const rows = skillIndex(program, program.skills || []);
  const kinds = SKILL_GROUPS.map(([k]) => k).filter((k) => rows.some((r) => r.skill.kind === k));
  const areas = [...new Set(rows.map((r) => r.skill.area))];
  const sel = { kind: null, area: null };

  const kindBar = h("div", { class: "chip-row" });
  const areaBar = h("div", { class: "chip-row mt-2" });
  const total = h("p", { class: "faint small" });
  const tbody = h("tbody");

  const chip = (label, on, fn) => h("button", { type: "button", class: `chip${on ? " on" : ""}`, onclick: fn }, label);
  const paint = () => {
    kindBar.replaceChildren(chip("Tất cả loại", !sel.kind, () => { sel.kind = null; paint(); }),
      ...kinds.map((k) => chip(KIND_LABEL[k], sel.kind === k, () => { sel.kind = sel.kind === k ? null : k; paint(); })));
    areaBar.replaceChildren(chip("Tất cả mảng", !sel.area, () => { sel.area = null; paint(); }),
      ...areas.map((a) => chip(areaLabel(program, a), sel.area === a, () => { sel.area = sel.area === a ? null : a; paint(); })));
    const shown = rows.filter((r) => (!sel.kind || r.skill.kind === sel.kind) && (!sel.area || r.skill.area === sel.area));
    total.textContent = `${shown.length} kỹ năng`;
    tbody.replaceChildren(...shown.map(({ skill, learnedIn, usedIn }) => {
      const learned = learnedIn ? sessionLink(program, learnedIn) : null;
      const used = usedIn.map((id) => sessionLink(program, id)).filter(Boolean);
      return h("tr", {},
        h("td", {}, skillLink(program, skill), h("div", { class: "faint small" }, `${KIND_LABEL[skill.kind] || skill.kind} · ${areaLabel(program, skill.area)}`)),
        h("td", {}, learned || h("span", { class: "faint" }, "—")),
        h("td", {}, used.length ? joinNodes(used) : h("span", { class: "faint" }, "—")));
    }));
    if (!shown.length) tbody.append(h("tr", {}, h("td", { colspan: 3, class: "faint" }, "Không có kỹ năng nào khớp bộ lọc.")));
  };
  paint();

  root.append(h("div", { class: "page pr-page" },
    crumbs(program, "Kỹ năng"),
    pageHead("🧩 Bản đồ kỹ năng", "Mục lục mọi kỹ năng của chương trình: học ở buổi nào, dùng lại ở buổi nào.", `${program.label} · Kỹ năng`),
    h("div", { class: "card mb-4" }, kindBar, areaBar),
    total,
    h("div", { class: "table-wrap" },
      h("table", { class: "table pr-skills" },
        h("thead", {}, h("tr", {}, h("th", {}, "Kỹ năng"), h("th", {}, "Học ở"), h("th", {}, "Dùng lại ở"))),
        tbody))));
}

// ---------- Project ----------

function renderProject(root, program) {
  const state = practiceState();
  const pieces = projectPieces(program, state.done);
  const page = h("div", { class: "page pr-page" },
    crumbs(program, "Project"),
    pageHead("🏗️ Project xuyên suốt", "Hệ thống lớn dần qua từng chặng.", `${program.label} · Project`));
  const add = (...n) => page.append(...n.filter(Boolean));
  if (!hasProject(program)) {
    add(emptyState("🏗️", "Chương trình này không có project xuyên suốt"));
    root.append(page);
    return;
  }
  if (program.project.summary) add(h("div", { class: "card mb-4" }, h("p", { class: "mt0 mb0", html: inlineMd(program.project.summary) })));
  if (program.project.architectureMd) add(block("🧭 Kiến trúc", md(program.project.architectureMd)));

  const body = h("tbody", {}, pieces.map(({ piece, have }) => {
    const sid = piece.sinceSession;
    const link = sid ? sessionLink(program, sid) : null;
    const s = sid ? findSession(program, sid) : null;
    return h("tr", {},
      h("td", {}, piece.label),
      h("td", {}, link ? [link, s ? ` · ${s.title}` : ""] : h("span", { class: "faint" }, "—")),
      h("td", {}, have ? h("span", { class: "badge badge-green" }, "✓ đã có") : h("span", { class: "faint" }, "chưa")));
  }));
  add(block("🧱 Các mảnh của project",
    h("div", { class: "table-wrap" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Mảnh"), h("th", {}, "Hoàn thành ở buổi"), h("th", {}, "Trạng thái"))), body))));

  const stages = (program.stages || []).filter((st) => st.projectMilestone);
  if (stages.length) {
    add(block("🚩 Mốc từng chặng", h("ul", { class: "pr-list" }, stages.map((st) =>
      h("li", {}, h("strong", {}, st.title), ": ", h("span", { html: inlineMd(st.projectMilestone) }))))));
  }
  root.append(page);
}

// ---------- Đề mock ----------

const pctOf = (got, max) => (max > 0 ? Math.round((got / max) * 100) : 0);
const mockCmd = (program, mock, which) => {
  const text = labCmd(program, which === "start" ? "mockStart" : "mockScore", { mock: mock.id });
  return text ? cmd(text) : null;
};

// Ngưỡng đậu của đề thi; null nếu chương trình không khai.
const passPctOf = (program) => (program.exam && typeof program.exam.passPct === "number" ? program.exam.passPct : null);
const passBadge = (program, total) => {
  const pp = passPctOf(program);
  const pass = pp == null || total >= pp;
  return [h("span", { class: `badge badge-${pass ? "green" : "amber"}` }, `${total}%`),
    pp == null ? null : h("span", { class: "muted small" }, pass ? `Đạt ngưỡng ${pp}%` : `Chưa đạt ngưỡng ${pp}%`)];
};
const examDomains = (program) => (hasExam(program) ? program.exam.domains : []);

function scoreTable(program, rec) {
  const rows = examDomains(program).filter((d) => rec.byDomain[d.id]).map((d) => {
    const v = rec.byDomain[d.id];
    return h("tr", {}, h("td", {}, `${d.label} (${d.weight}%)`), h("td", {}, `${v.got} / ${v.max}`), h("td", {}, `${pctOf(v.got, v.max)}%`));
  });
  return h("div", {},
    h("div", { class: "flex mb-2" }, passBadge(program, rec.total)),
    h("div", { class: "table-wrap" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Domain"), h("th", {}, "Điểm"), h("th", {}, "Tỷ lệ"))),
      h("tbody", {}, rows))));
}

function mockHistory(program, state) {
  const mine = (state.mock || []).filter((m) => m.program === program.id).slice().reverse();
  if (!mine.length) return null;
  const doms = examDomains(program);
  const pp = passPctOf(program);
  return block("📈 Lịch sử các lần làm",
    h("div", { class: "table-wrap" }, h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Ngày"), h("th", {}, "Đề"), h("th", {}, "Tổng"),
        doms.map((d) => h("th", { title: d.label }, d.label.split(" ")[0])))),
      h("tbody", {}, mine.map((r) => h("tr", {},
        h("td", {}, r.date), h("td", {}, h("a", { href: `#/practice/${program.id}/mock/${r.mock}` }, r.mock)),
        h("td", {}, h("span", { class: `badge badge-${pp == null || r.total >= pp ? "green" : "amber"}` }, `${r.total}%`)),
        doms.map((d) => { const v = r.byDomain[d.id]; return h("td", {}, v ? `${pctOf(v.got, v.max)}%` : "—"); })))))));
}

function renderMock(root, program, mockId) {
  if (!mockId) return renderMockIndex(root, program);
  const mock = findMock(program, mockId);
  if (!mock) return renderMissing(root, program.id, `Không có đề mock “${mockId}”.`);
  return renderMockPage(root, program, mock);
}

function examLine(program) {
  const e = program.exam || {};
  const parts = [];
  if (typeof e.passPct === "number") parts.push(`đậu từ ${e.passPct}%`);
  if (typeof e.durationMin === "number") parts.push(`trong ${e.durationMin} phút`);
  return parts.length ? `Đề thi thử bấm giờ, ${parts.join(" ")}.` : "Đề thi thử bấm giờ.";
}

function renderMockIndex(root, program) {
  const mocks = program.mocks || [];
  const page = h("div", { class: "page pr-page" },
    crumbs(program, "Đề mock"),
    pageHead("⏱️ Đề mock", hasExam(program) ? examLine(program) : "", `${program.label} · Mock`));
  const add = (...n) => page.append(...n.filter(Boolean));
  if (!mocks.length) {
    add(hasExam(program)
      ? emptyState("⏱️", "Đề mock phát hành ở đợt cuối", "Hoàn thành các buổi trước rồi quay lại làm đề tổng duyệt.")
      : emptyState("⏱️", "Chương trình này không có đề mock"));
  } else {
    add(h("div", { class: "grid grid-2 mb-4" }, mocks.map((m) =>
      h("a", { class: "card card-link card-accent", href: `#/practice/${program.id}/mock/${m.id}` },
        h("div", { class: "card-head" }, h("strong", {}, m.title), h("span", { class: "faint" }, `${m.durationMin} phút`)),
        h("p", { class: "muted small mt0 mb0" }, `${(m.questions || []).length} câu`)))));
  }
  add(mockHistory(program, practiceState()));
  root.append(page);
}

function renderMockPage(root, program, mock) {
  const questions = mock.questions || [];
  const page = h("div", { class: "page pr-page" },
    crumbs(program, mock.title),
    pageHead(`⏱️ ${mock.title}`,
      [`${mock.durationMin} phút`, `${questions.length} câu`, passPctOf(program) == null ? null : `đậu từ ${passPctOf(program)}%`].filter(Boolean).join(" · "),
      `${program.label} · Mock`));
  const add = (...n) => page.append(...n.filter(Boolean));

  const startCmd = mockCmd(program, mock, "start");
  add(block("📋 Trước khi làm",
    h("div", { class: "chip-row mb-3" }, examDomains(program).map((d) => h("span", { class: "badge badge-blue" }, `${d.label} ${d.weight}%`))),
    startCmd ? [h("p", { class: "muted small mt0" }, "Dựng đề trên lab:"), startCmd] : null));

  // Đồng hồ: gắn el vào DOM trước khi start() (timer tự dừng nếu el chưa gắn).
  const clockSlot = h("span", { class: "pr-mock-clock" });
  const startBtn = h("button", { class: "btn btn-primary", type: "button" }, "▶ Bắt đầu đếm giờ");
  startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    const cd = createCountdown({ totalSec: mock.durationMin * 60, onEnd: () => toast("Hết giờ. Chấm đề và dán dòng kết quả bên dưới.", "info", 6000) });
    clockSlot.append(cd.el);
    cd.start();
    onCleanup(cd.stop);
  });
  add(h("div", { class: "card mb-4" }, h("div", { class: "flex" }, startBtn, clockSlot)));

  // Đánh dấu câu chỉ giữ trong bộ nhớ trang.
  const marked = new Set();
  const markCount = h("span", { class: "faint" });
  const solutionSlots = new Map();
  const list = h("div", {}, questions.map((q, i) => {
    const dom = examDomains(program).find((d) => d.id === q.domain);
    const box = h("input", { type: "checkbox" });
    const card = h("div", { class: "card mb-3 pr-q" });
    box.addEventListener("change", () => {
      if (box.checked) marked.add(q.id); else marked.delete(q.id);
      card.classList.toggle("marked", box.checked);
      markCount.textContent = marked.size ? `${marked.size} câu đã đánh dấu` : "";
    });
    const slot = h("div", {});
    solutionSlots.set(q.id, slot);
    card.append(...[
      h("div", { class: "card-head" }, h("strong", {}, `Câu ${i + 1}`),
        h("span", { class: "chip-row" },
          dom ? h("span", { class: "badge badge-blue" }, dom.label) : null,
          h("span", { class: "badge" }, `${q.weight}%`))),
      q.context ? h("p", { class: "small muted mt0" }, `Làm việc trên: ${q.context}`) : null,
      md(q.text),
      h("label", { class: "small muted flex mt-2" }, box, " Đánh dấu để quay lại"),
      slot].filter(Boolean));
    return card;
  }));
  add(h("div", { class: "card-head" }, h("strong", {}, "📝 Danh sách câu"), markCount), list);

  // Dán kết quả.
  const input = h("input", { class: "input grow", type: "text", placeholder: "devprep-mock:v1:…", "aria-label": "Dòng kết quả mock" });
  const err = h("p", { class: "pr-err small mb0", role: "alert" });
  const out = h("div", { class: "mt-3" });
  const submit = () => {
    const r = parseMockResult(input.value, program);
    err.textContent = r.ok ? "" : r.error;
    if (!r.ok) return;
    if (!addMockResult(r.record)) toast("Dòng kết quả này đã lưu trước đó, không lưu thêm lần nữa.", "info", 4000);
    out.replaceChildren(h("strong", {}, "Điểm lần này"), scoreTable(program, r.record));
    for (const q of questions) {
      const slot = solutionSlots.get(q.id);
      if (slot && q.solution) slot.replaceChildren(reveal("🔓 Lời giải", md(q.solution)));
    }
    input.value = "";
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  add(block("📥 Kết quả",
    h("p", { class: "muted small mt0" }, "Sau khi làm xong, chấm đề rồi dán dòng kết quả in ra:"), mockCmd(program, mock, "score"),
    h("div", { class: "flex mt-2" }, input, h("button", { class: "btn btn-primary", type: "button", onclick: submit }, "Lưu kết quả")),
    err, out));
  add(h("a", { class: "btn btn-ghost btn-sm", href: `#/practice/${program.id}/mock` }, "← Danh sách đề mock"));
  root.append(page);
}
