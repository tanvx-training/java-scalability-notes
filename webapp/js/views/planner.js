// 🗓️ Kế hoạch tuần — module toàn cục (mọi lĩnh vực): tuần hiện tại của lịch 104
// tuần, việc tuần này gom từ trục Senior + FlashSale/K8s + chương sách (tick thẳng
// vào roadmap.checked / docs.read), nhật ký giờ học so với mục tiêu, nợ tuần trước,
// nghi thức tuần / quý, mốc sắp tới, toàn bộ lịch theo quý, cài đặt kế hoạch.
//
// Route: #/planner            → tuần hiện tại (hoặc tuần 1 nếu chưa bắt đầu)
//        #/planner/<n>        → xem tuần n (1..104)

import { h, pageHead, sectionTitle, inlineMd, stripMd, toast, confirmDialog } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { dayKey, docsRead } from "../lib/activity.js";
import { docLabelWithBook } from "../data/labels.js";
import { FIELDS } from "../data/fields.js";
import { PLAN } from "../data/senior-java/schedule.js";
import {
  planConfig, setPlanConfig, schedule, weekEntry, currentWeek, phaseOf, fmtRange,
  weekProgress, debtBefore, setItemChecked, itemInfo, docInfo,
  SESSION_KINDS, logSession, removeSession, sessionsOfWeek, hoursOfWeek, hoursSummary,
  WEEKLY_RITUALS, QUARTERLY_RITUALS, isQuarterEnd, ritualState, setRitual, milestones,
} from "../lib/plan.js";

const MS_ICON = { start: "🚀", tag: "🏷️", gate: "🚪", review: "🔁", exam: "🎓", rest: "🌴" };
const PHASE_CLS = { gd1: "p1", gd2: "p2", gd3: "p3", gd4: "p4" };
const PLAN_DOCS = ["sj-06", "sj-07", "sj-08", "sj-09", "sj-10", "sj-11", "sj-12"];

export function render(root, params) {
  const now = currentWeek();
  let n = parseInt(params?.[0], 10);
  if (!(n >= 1 && n <= PLAN.weeks)) n = now >= 1 && now <= PLAN.weeks ? now : (now < 1 ? 1 : PLAN.weeks);
  const entry = weekEntry(n);
  const cfg = planConfig();
  const page = h("div", { class: "page" });
  const rerender = () => { root.innerHTML = ""; render(root, [String(n)]); };

  page.append(pageHead("🗓️ Kế hoạch tuần",
    "Một dự án, mọi cuốn sách: mỗi tuần một lát trục Senior, một lát FlashSale (năm 2: CKAD/CKA) và vài chương đọc. Tick ở đây là tick vào lộ trình; ghi giờ sau mỗi buổi.",
    "Kế hoạch 104 tuần · 05/10/2026 → 01/10/2028"));

  page.append(statusLine(now, cfg));
  page.append(headerCard(entry, now, cfg));

  const top = h("div", { class: "grid grid-2 mb-4" }, weekCard(entry, rerender), hoursCard(n, cfg, rerender));
  page.append(top);

  const mid = h("div", { class: "grid grid-2 mb-4" }, debtCard(n), ritualCard(n, rerender));
  page.append(mid);

  page.append(milestoneCard(n));
  page.append(fullSchedule(n, now));
  page.append(settingsCard(cfg, rerender));
  root.append(page);
}

// ---------- Dòng trạng thái ----------

function statusLine(now, cfg) {
  if (now < 1) {
    const [y, m, d] = cfg.start.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const days = Math.ceil((start - new Date()) / 86400000);
    return h("p", { class: "muted small", style: "margin:-8px 0 16px" },
      `Lịch bắt đầu thứ Hai ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} — còn ${days} ngày. Đang xem trước tuần 1. Tuần 0 (đo điểm xuất phát) đã gộp vào tuần 1.`);
  }
  if (now > PLAN.weeks) {
    return h("p", { class: "muted small", style: "margin:-8px 0 16px" }, "🎉 Đã qua tuần 104. Lịch kết thúc — xem review quý 8 và quyết định 24 tháng tiếp theo (sj-11 §8).");
  }
  return null;
}

// ---------- Đầu trang: tuần N/104, thanh 104 tuần ----------

function headerCard(entry, now, cfg) {
  const ph = phaseOf(entry.n);
  const list = schedule();
  const bar = h("div", { class: "plan-timeline", title: "104 tuần · bấm để xem tuần" });
  for (const w of list) {
    const p = weekProgress(w);
    const cls = ["plan-tl", PHASE_CLS[w.phase] ?? ""];
    if (w.rest) cls.push("rest");
    if (w.n === entry.n) cls.push("cur");
    if (w.n < now && p.complete) cls.push("done");
    if (w.n < now && !p.complete && !w.rest) cls.push("debt");
    if (w.ms) cls.push("ms");
    bar.append(h("a", { class: cls.join(" "), href: `#/planner/${w.n}`, title: `Tuần ${w.n} · ${fmtRange(w.dates)}${w.ms ? ` · ${w.ms.label}` : ""}` }));
  }
  const nav = h("div", { class: "flex flex-wrap" },
    entry.n > 1 ? h("a", { class: "btn btn-ghost btn-sm", href: `#/planner/${entry.n - 1}` }, "← Tuần trước") : null,
    now >= 1 && now <= PLAN.weeks && entry.n !== now ? h("a", { class: "btn btn-sm", href: "#/planner" }, "Về tuần hiện tại") : null,
    entry.n < PLAN.weeks ? h("a", { class: "btn btn-ghost btn-sm", href: `#/planner/${entry.n + 1}` }, "Tuần sau →") : null);
  const legend = h("div", { class: "plan-legend faint" },
    h("span", { class: "plan-tl p1" }), " GĐ1 · ", h("span", { class: "plan-tl p2" }), " GĐ2 · ",
    h("span", { class: "plan-tl p3" }), " GĐ3 · ", h("span", { class: "plan-tl p4" }), " GĐ4 · ",
    h("span", { class: "plan-tl rest" }), " nghỉ · ", h("span", { class: "plan-tl debt" }), " còn nợ · ", h("span", { class: "plan-tl ms" }), " mốc");
  return h("div", { class: "card plan-head mb-4" },
    h("div", { class: "flex spread flex-wrap" },
      h("div", {},
        h("div", { class: "eyebrow" }, `Quý ${entry.q} · ${ph?.label ?? ""}${entry.n === now ? " · tuần hiện tại" : ""}`),
        h("h2", { class: "mt0 mb-1" }, `Tuần ${entry.n}/${PLAN.weeks}`, h("span", { class: "muted small", style: "font-weight:400;margin-left:10px" }, fmtRange(entry.dates))),
        h("p", { class: "mt0 mb0", html: inlineMd(entry.focus) })),
      nav),
    bar, legend);
}

// ---------- Tuần này ----------

function weekCard(entry, rerender) {
  const p = weekProgress(entry);
  const checked = store.get("roadmap.checked", {});
  const card = h("div", { class: "card plan-week" },
    h("div", { class: "card-head" },
      h("strong", {}, entry.rest ? "🌴 Tuần nghỉ" : "📌 Việc tuần này"),
      h("span", { class: "faint" }, entry.rest ? "không lab, không dự án" : `${p.done}/${p.total} mục · ${p.readsDone}/${p.readsTotal} chương · ${p.pct}%`)),
    h("div", { class: `progress thin${p.complete ? " green" : ""} mb-3` }, h("span", { style: `width:${p.pct}%` })));

  const group = (title, refs) => {
    if (!refs.length) return null;
    const rows = [];
    for (const r of refs) {
      const info = itemInfo(r.items[0]);
      const t = info?.track;
      const wk = info?.week;
      rows.push(h("div", { class: "plan-group-head faint" },
        t ? h("a", { href: `#/roadmap/${t.id}` }, `${t.icon} ${t.label} · ${wk.week}: ${wk.title}`) : `${r.trackId}/${r.weekId}`));
      for (const id of r.items) rows.push(itemRow(id, checked, rerender));
    }
    return h("div", { class: "plan-group" }, h("h4", {}, title), rows);
  };
  card.append(
    group("🧭 Trục Senior Java", entry.spine),
    group(entry.n <= 53 ? "🛒 FlashSale" : "☸️ Giáo trình chứng chỉ", [...entry.project, ...entry.extra]),
    readsGroup(entry, rerender));

  if (entry.practice) card.append(h("div", { class: "explain-box mt-3" }, h("span", { html: "🔨 <strong>Thực hành.</strong> " + inlineMd(entry.practice) })));
  if (entry.write) card.append(h("div", { class: "explain-box mt-2" }, h("span", { html: "✍️ <strong>Viết.</strong> " + inlineMd(entry.write) })));
  const hrs = Object.entries(entry.hours).filter(([, v]) => v > 0).map(([k, v]) => `${SESSION_KINDS[k]?.label ?? k} ${v}h`).join(" · ");
  card.append(h("p", { class: "faint small mt-2 mb0" }, `Ngân sách gợi ý: ${hrs} = ${entry.hoursTotal}h.`));
  return card;
}

function itemRow(id, checked, rerender) {
  const info = itemInfo(id);
  const cb = h("input", { type: "checkbox", title: "Đánh dấu đã nắm vững (ghi vào lộ trình)" });
  cb.checked = !!checked[id];
  cb.addEventListener("change", () => {
    setItemChecked(id, cb.checked);
    toast(cb.checked ? "Đã tick vào lộ trình" : "Đã bỏ tick", "success");
    rerender();
  });
  const href = info ? `#/roadmap/${info.track.id}/${id}` : "#/roadmap";
  return h("label", { class: `plan-item${cb.checked ? " done" : ""}` },
    cb,
    h("a", { href, class: "grow", onclick: (e) => e.stopPropagation() }, info ? stripMd(info.item.text) : id));
}

function readsGroup(entry, rerender) {
  if (!entry.reads.length) return null;
  const rows = entry.reads.map((id) => {
    const d = docInfo(id);
    const cb = h("input", { type: "checkbox", title: "Đánh dấu đã đọc" });
    cb.checked = docsRead.is(id);
    cb.addEventListener("change", () => { docsRead.set(id, cb.checked); rerender(); });
    const f = d ? FIELDS[d.field] : null;
    return h("label", { class: `plan-item${cb.checked ? " done" : ""}` },
      cb,
      h("a", { href: `#/docs/${id}`, class: "grow", onclick: (e) => e.stopPropagation() },
        f ? h("span", { class: "faint" }, `${f.icon} `) : null, d ? docLabelWithBook(d) : id));
  });
  return h("div", { class: "plan-group" }, h("h4", {}, "📚 Đọc"), rows);
}

// ---------- Giờ học ----------

function hoursCard(n, cfg, rerender) {
  const hw = hoursOfWeek(n);
  const target = cfg.hoursTarget;
  const pct = Math.min(100, Math.round((hw.total / target) * 100));
  const tone = pct >= 80 ? " green" : pct >= 60 ? " amber" : hw.total ? " red" : "";
  const card = h("div", { class: "card plan-hours" },
    h("div", { class: "card-head" },
      h("strong", {}, "⏱️ Giờ học"),
      h("span", { class: "faint" }, `${hw.total}h / ${target}h · ${hw.count} buổi`)),
    h("div", { class: `progress thin${tone} mb-3` }, h("span", { style: `width:${pct}%` })));

  // Ghi buổi
  const entry = weekEntry(n);
  const today = dayKey();
  const inWeek = today >= dayKey(entry.dates.from) && today <= dayKey(entry.dates.to);
  const date = h("input", { class: "input", type: "date", value: inWeek ? today : dayKey(entry.dates.from), min: dayKey(entry.dates.from), max: dayKey(entry.dates.to) });
  const hours = h("select", { class: "select" }, [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4].map((v) => h("option", { value: String(v), selected: v === 1 ? true : null }, `${v} h`)));
  let kind = "read";
  const kindSeg = h("div", { class: "seg plan-kinds" });
  for (const [k, v] of Object.entries(SESSION_KINDS)) {
    const b = h("button", { type: "button", class: k === kind ? "on" : "", title: v.label, onclick: () => {
      kind = k;
      kindSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    } }, `${v.icon} ${v.label}`);
    kindSeg.append(b);
  }
  const note = h("input", { class: "input", type: "text", placeholder: "Ghi chú một dòng (JCiP ch.3, lab visibility…)", maxlength: "140" });
  const add = h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: () => {
    const s = logSession({ date: date.value, h: parseFloat(hours.value), kind, note: note.value });
    if (!s) { toast("Số giờ không hợp lệ", "error"); return; }
    toast(`Đã ghi ${s.h}h ${SESSION_KINDS[s.kind].label}`, "success");
    rerender();
  } }, "+ Ghi buổi học");
  card.append(h("div", { class: "plan-log-form" },
    h("div", { class: "flex flex-wrap" }, date, hours, add),
    kindSeg, note));

  // Danh sách buổi tuần này
  const list = sessionsOfWeek(n);
  if (list.length) {
    card.append(h("div", { class: "plan-sessions mt-3" }, list.map((s) =>
      h("div", { class: "plan-session" },
        h("span", { class: "faint nowrap" }, s.date.slice(5).replace("-", "/")),
        h("span", { class: "badge" }, `${SESSION_KINDS[s.kind]?.icon ?? ""} ${s.h}h`),
        h("span", { class: "grow truncate", title: s.note }, s.note || SESSION_KINDS[s.kind]?.label || ""),
        h("button", { class: "icon-btn plan-del", type: "button", title: "Xoá", onclick: async () => {
          if (!await confirmDialog("Xoá buổi học này?", { okLabel: "Xoá", danger: true })) return;
          removeSession(s.id); rerender();
        } }, "✕")))));
  } else {
    card.append(h("p", { class: "faint small mt-2 mb0" }, "Chưa ghi buổi nào trong tuần này. Sau mỗi buổi ghi một dòng — 15 giây."));
  }

  // 8 tuần gần nhất
  const sum = hoursSummary(n);
  const max = Math.max(target, ...sum.weeks.map((w) => w.total));
  card.append(h("div", { class: "mt-3" },
    h("div", { class: "faint small mb-1" }, `8 tuần gần nhất · tổng toàn kỳ ${sum.total}h / ${sum.sessions} buổi`),
    h("div", { class: "plan-bars" }, sum.weeks.map((w) => {
      const hgt = max ? Math.round((w.total / max) * 100) : 0;
      const c = w.total >= target * 0.8 ? "ok" : w.total >= target * 0.6 ? "mid" : w.total ? "low" : "";
      return h("a", { class: `plan-bar ${c}${w.n === n ? " cur" : ""}`, href: `#/planner/${w.n}`, title: `Tuần ${w.n}: ${w.total}h` },
        h("span", { style: `height:${hgt}%` }), h("small", {}, String(w.n)));
    }))));
  return card;
}

// ---------- Nợ tuần trước ----------

function debtCard(n) {
  const d = debtBefore(n);
  const card = h("div", { class: "card" },
    h("div", { class: "card-head" }, h("strong", {}, "⏳ Nợ tuần trước"), h("span", { class: `faint${d.count ? " text-amber" : ""}` }, d.count ? `${d.count} mục chưa xong` : "sạch nợ")));
  if (!d.count) {
    card.append(h("p", { class: "muted small mt0 mb0" }, n <= 1 ? "Tuần đầu — chưa có gì để nợ." : "Mọi mục của các tuần trước đã tick. Giữ nhịp."));
    return card;
  }
  card.append(h("p", { class: "muted small mt0 mb-2" }, "Luật: còn nợ lab thì tuần này không mở chương mới — dùng khối Đọc để trả nợ (sj-07 §4)."));
  card.append(h("div", { class: "plan-debt" }, d.items.map((x) => {
    if (x.doc) {
      const doc = docInfo(x.id);
      return h("a", { class: "plan-debt-row", href: `#/docs/${x.id}` }, h("span", { class: "badge" }, `t${x.week}`), h("span", { class: "grow truncate" }, `📚 ${doc ? docLabelWithBook(doc) : x.id}`));
    }
    const info = itemInfo(x.id);
    return h("a", { class: "plan-debt-row", href: info ? `#/roadmap/${info.track.id}/${x.id}` : "#/roadmap" },
      h("span", { class: "badge" }, `t${x.week}`), h("span", { class: "grow truncate" }, `${info?.track.icon ?? ""} ${info ? stripMd(info.item.text) : x.id}`));
  })));
  if (d.count > d.items.length) card.append(h("p", { class: "faint small mt-2 mb0" }, `… và ${d.count - d.items.length} mục cũ hơn. Mở các tuần trước trên thanh 104 tuần.`));
  return card;
}

// ---------- Nghi thức ----------

function ritualCard(n, rerender) {
  const quarter = isQuarterEnd(n);
  const list = quarter ? QUARTERLY_RITUALS : WEEKLY_RITUALS;
  const st = ritualState(n);
  const done = list.filter((r) => st[r.id]).length;
  const card = h("div", { class: "card" },
    h("div", { class: "card-head" },
      h("strong", {}, quarter ? `🔁 Review quý ${n / PLAN.quarterWeeks} (2 giờ)` : "✅ Review tuần (15 phút, Chủ nhật)"),
      h("span", { class: "faint" }, `${done}/${list.length}`)),
    h("div", { class: "list-check plan-rituals" }, list.map((r) => {
      const cb = h("input", { type: "checkbox" });
      cb.checked = !!st[r.id];
      cb.addEventListener("change", () => { setRitual(n, r.id, cb.checked); rerender(); });
      return h("label", { class: `plan-item${cb.checked ? " done" : ""}` }, cb, h("span", { class: "grow" }, r.label));
    })));
  if (quarter) card.append(h("p", { class: "faint small mt-2 mb0" }, "Chương trình theo phút và mục tiêu ma trận quý này: ", h("a", { href: "#/docs/sj-11" }, "sj-11 §3–4"), "."));
  return card;
}

// ---------- Mốc sắp tới ----------

function milestoneCard(n) {
  const ms = milestones(n, 6);
  if (!ms.length) return null;
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "🚩 Mốc sắp tới")),
    h("div", { class: "chip-row" }, ms.map((m) =>
      h("a", { class: `chip${m.n === n ? " on" : ""}`, href: `#/planner/${m.n}`, title: fmtRange(m.dates) },
        `${MS_ICON[m.kind] ?? "•"} t${m.n} · ${m.label}`))));
}

// ---------- Toàn bộ lịch ----------

function fullSchedule(n, now) {
  const list = schedule();
  const wrap = h("div", { class: "mb-4" });
  wrap.append(sectionTitle("Toàn bộ lịch", `${PLAN.weeks} tuần`, h("a", { class: "faint", href: "#/docs/sj-06" }, "Bản đầy đủ có lý do: sj-06 →")));
  const quarters = Math.ceil(PLAN.weeks / PLAN.quarterWeeks);
  const qNames = ["Nền và luồng đúng", "Chịu tải: concurrency gặp k6", "Event-driven và DevOps nền tảng", "Production-grade và góc nhìn SA",
    "Kubernetes: CKAD", "CKA, AWS, Terraform", "Distributed systems", "System design và hồ sơ Senior"];
  for (let q = 1; q <= quarters; q++) {
    const weeks = list.filter((w) => w.q === q);
    const doneN = weeks.filter((w) => weekProgress(w).complete).length;
    const det = h("details", { class: "card plan-quarter" },
      h("summary", {},
        h("span", {}, "📅"),
        h("span", { class: "grow" }, `Quý ${q} — ${qNames[q - 1] ?? ""}`),
        h("span", { class: "faint nowrap" }, `${fmtRange({ from: weeks[0].dates.from, to: weeks[weeks.length - 1].dates.to })} · ${doneN}/${weeks.length} tuần xong`),
        h("span", { class: "chev" }, "▸")),
      h("div", { class: "table-wrap mt-2" }, h("table", { class: "table plan-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Tuần"), h("th", {}, "Từ"), h("th", {}, "Trọng tâm"), h("th", {}, "Tiến độ"), h("th", {}, "Giờ"), h("th", {}, "Mốc"))),
        h("tbody", {}, weeks.map((w) => {
          const p = weekProgress(w);
          const hw = hoursOfWeek(w.n);
          const cls = [w.n === n ? "cur" : "", w.n === now ? "now" : "", w.rest ? "rest" : ""].filter(Boolean).join(" ");
          return h("tr", { class: cls, onclick: () => { location.hash = `#/planner/${w.n}`; } },
            h("td", {}, h("a", { href: `#/planner/${w.n}` }, String(w.n))),
            h("td", { class: "nowrap faint" }, fmtRange(w.dates).slice(0, 5)),
            h("td", {}, w.focus),
            h("td", { class: "nowrap" }, w.rest ? "—" : h("div", { class: `progress thin${p.complete ? " green" : ""}`, style: "width:90px", title: `${p.pct}%` }, h("span", { style: `width:${p.pct}%` }))),
            h("td", { class: "nowrap faint" }, hw.total ? `${hw.total}h` : ""),
            h("td", { class: "nowrap" }, w.ms ? `${MS_ICON[w.ms.kind] ?? ""} ${w.ms.label}` : ""));
        })))));
    if (weeks.some((w) => w.n === n)) det.setAttribute("open", "");
    wrap.append(det);
  }
  return wrap;
}

// ---------- Cài đặt ----------

function settingsCard(cfg, rerender) {
  const start = h("input", { class: "input", type: "date", value: cfg.start });
  const target = h("input", { class: "input", type: "number", min: "3", max: "20", step: "0.5", value: String(cfg.hoursTarget), style: "width:90px" });
  const save = h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: () => {
    const d = new Date(start.value + "T00:00:00");
    if (Number.isNaN(d.getTime())) { toast("Ngày không hợp lệ", "error"); return; }
    if (d.getDay() !== 1) { toast("Ngày bắt đầu phải là thứ Hai để tuần khớp lịch", "error"); return; }
    setPlanConfig({ start: start.value, hoursTarget: parseFloat(target.value) });
    toast("Đã lưu cấu hình kế hoạch", "success");
    location.hash = "#/planner";
    rerender();
  } }, "Lưu");
  const reset = h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => {
    setPlanConfig({ start: PLAN.start, hoursTarget: PLAN.hoursTarget });
    toast("Đã về mặc định", "success");
    location.hash = "#/planner";
    rerender();
  } }, "Mặc định");
  return h("div", { class: "card mb-4" },
    h("div", { class: "card-head" }, h("strong", {}, "⚙️ Cấu hình kế hoạch"), cfg.customStart ? h("span", { class: "badge badge-amber" }, "đã dịch ngày bắt đầu") : null),
    h("div", { class: "settings-row" },
      h("div", { class: "s-label" }, h("strong", {}, "Ngày bắt đầu (thứ Hai)"), h("small", {}, `Mặc định 05/10/2026. Dịch ngày = dịch cả lịch; id mục không đổi. Tối đa 4 lần dịch trong 24 tháng (sj-07 §3).`)),
      start),
    h("div", { class: "settings-row" },
      h("div", { class: "s-label" }, h("strong", {}, "Giờ mục tiêu mỗi tuần"), h("small", {}, "8–10 theo lộ trình gốc; 6 nếu chỉ có 5–6 giờ (lộ trình thành ~36 tháng).")),
      target),
    h("div", { class: "flex flex-wrap mt-2" }, save, reset),
    h("p", { class: "faint small mt-3 mb0" }, "Tài liệu kế hoạch: ",
      PLAN_DOCS.map((id, i) => { const d = docInfo(id); return [i ? " · " : null, h("a", { href: `#/docs/${id}` }, d ? `${d.icon} ${d.title.split(" — ")[0]}` : id)]; })));
}
