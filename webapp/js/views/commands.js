// ⚡ Thực hành nhanh — trung tâm tra cứu khi làm lab/thi thử:
// 4 tab: Lệnh / YAML mẫu / Quy trình (playbook) / Trước giờ thi.
// Cơ chế chung: ghim mục hay dùng, lọc theo chứng chỉ, chế độ gọn
// (thu nhỏ + ẩn sidebar để mở cạnh terminal), gợi ý tra docs trong phòng thi.

import { h, pageHead, inlineMd, codeNode, certBadge } from "../lib/ui.js";
import { escapeHtml } from "../lib/markdown.js";
import { store } from "../lib/store.js";
import { commands } from "../data/kubernetes/commands.js";
import { adminCommands } from "../data/kubernetes/commands-admin.js";
import { snippets } from "../data/kubernetes/snippets.js";
import { playbooks } from "../data/kubernetes/playbooks.js";
import { examDay } from "../data/kubernetes/examday.js";
import { COMMAND_CATEGORIES } from "../data/meta.js";

const ALL_CMDS = [...commands, ...adminCommands];
const CERT_KEYS = ["CKAD", "CKA", "CKS"];

const TABS = [
  { id: "", label: "⌨️ Lệnh" },
  { id: "yaml", label: "📄 YAML mẫu" },
  { id: "playbooks", label: "📋 Quy trình" },
  { id: "examday", label: "🎒 Trước giờ thi" },
];

let keyHandler = null;

export function cleanup() {
  if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
}

// ---------- tiện ích chung ----------

const getPins = () => store.get("ref.pins", {});

function pinButton(id, onChange) {
  const btn = h("button", { class: "pin-btn", title: "Ghim mục này" });
  const sync = () => {
    const on = !!getPins()[id];
    btn.textContent = on ? "★" : "☆";
    btn.classList.toggle("on", on);
  };
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const p = getPins();
    if (p[id]) delete p[id];
    else p[id] = true;
    store.set("ref.pins", p);
    sync();
    onChange && onChange();
  });
  sync();
  return btn;
}

function certChips(onChange) {
  const wrap = h("div", { class: "chip-row" });
  const current = () => store.get("ref.cert", null);
  const chips = new Map();
  const allChip = h("button", { class: "chip" }, "Tất cả");
  allChip.addEventListener("click", () => { store.set("ref.cert", null); sync(); onChange(); });
  wrap.append(allChip);
  for (const c of CERT_KEYS) {
    const chip = h("button", { class: "chip" }, c);
    chip.addEventListener("click", () => {
      store.set("ref.cert", current() === c ? null : c);
      sync();
      onChange();
    });
    chips.set(c, chip);
    wrap.append(chip);
  }
  function sync() {
    const cur = current();
    allChip.classList.toggle("on", cur === null);
    chips.forEach((chip, c) => chip.classList.toggle("on", c === cur));
  }
  sync();
  return wrap;
}

const matchCert = (certs) => {
  const cur = store.get("ref.cert", null);
  if (!cur) return true;
  if (!certs || !certs.length) return true; // lệnh cũ không gắn cert = dùng chung
  return certs.includes(cur);
};

function lessonChip(lesson) {
  if (!lesson) return null;
  return h("a", { class: "chip", href: `#/roadmap/${lesson.track}/${lesson.item}` }, `🎓 ${lesson.label}`);
}

function docsHintLine(hint) {
  if (!hint) return null;
  return h("p", { class: "docs-hint", html: "📖 " + inlineMd(hint) });
}

function searchBox(placeholder) {
  return h("input", { class: "input", type: "search", placeholder, autocomplete: "off" });
}

function bindSlash(input) {
  cleanup();
  keyHandler = (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  };
  document.addEventListener("keydown", keyHandler);
}

// ---------- khung trang ----------

export function render(root, params) {
  const tab = TABS.some((t) => t.id === params[0]) ? params[0] : "";
  const page = h("div", { class: "page" });

  const compactBtn = h("button", { class: "btn btn-sm" });
  const syncCompact = () => {
    const on = document.body.classList.contains("compact-mode");
    compactBtn.textContent = on ? "🗖 Thoát chế độ gọn" : "🗜️ Chế độ gọn";
  };
  compactBtn.addEventListener("click", () => {
    const on = !document.body.classList.contains("compact-mode");
    document.body.classList.toggle("compact-mode", on);
    store.set("ref.compact", on);
    syncCompact();
  });
  syncCompact();

  page.append(
    h("div", { class: "page-head" },
      h("div", { class: "flex spread flex-wrap" },
        h("h1", {}, "⚡ Thực hành nhanh"),
        compactBtn),
      h("p", { class: "sub" },
        "Tra cứu khi đang làm lab: lệnh, YAML mẫu và quy trình thuộc lòng — kèm gợi ý tìm trong docs được phép dùng lúc thi. Nhấn ",
        h("span", { class: "kbd" }, "/"), " để tìm, ☆ để ghim mục hay dùng lên đầu.")),
    h("div", { class: "tab-bar" },
      TABS.map((t) =>
        h("a", {
          class: `tab-link${t.id === tab ? " on" : ""}`,
          href: `#/commands${t.id ? "/" + t.id : ""}`,
        }, t.label)))
  );

  const body = h("div", {});
  page.append(body);
  root.append(page);

  if (tab === "yaml") renderYaml(body);
  else if (tab === "playbooks") renderPlaybooks(body);
  else if (tab === "examday") renderExamDay(body);
  else renderCommands(body);
}

// ---------- Tab 1: Lệnh ----------

function renderCommands(body) {
  const input = searchBox("Tìm lệnh… (vd: rollout, etcdctl, trivy, drain)");
  let activeCat = null;

  const catRow = h("div", { class: "chip-row", style: "margin:10px 0" });
  const allChip = h("button", { class: "chip on" }, "Mọi nhóm");
  allChip.addEventListener("click", () => { activeCat = null; syncCats(); refresh(); });
  catRow.append(allChip);
  const catChips = new Map();
  for (const [key, cat] of Object.entries(COMMAND_CATEGORIES)) {
    if (!ALL_CMDS.some((c) => c.category === key)) continue;
    const chip = h("button", { class: "chip" }, cat.label);
    chip.addEventListener("click", () => { activeCat = activeCat === key ? null : key; syncCats(); refresh(); });
    catChips.set(key, chip);
    catRow.append(chip);
  }
  function syncCats() {
    allChip.classList.toggle("on", activeCat === null);
    catChips.forEach((chip, key) => chip.classList.toggle("on", key === activeCat));
  }

  const counter = h("p", { class: "faint" });
  const list = h("div", {});

  function row(c) {
    const cat = COMMAND_CATEGORIES[c.category];
    const copyBtn = h("button", { class: "icon-btn", title: "Copy lệnh" }, "📋");
    copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(c.cmd); copyBtn.textContent = "✓"; }
      catch { copyBtn.textContent = "✗"; }
      setTimeout(() => (copyBtn.textContent = "📋"), 1200);
    });
    return h("div", { class: "cmd-row" },
      h("div", { class: "cmd-desc" },
        pinButton(c.id, refresh),
        cat ? h("span", { class: "badge badge-blue" }, cat.label) : null,
        (c.certs || []).map((k) => certBadge(k)),
        h("span", {}, c.desc)),
      h("div", { class: "cmd-line" },
        h("code", { html: escapeHtml(c.cmd) }), copyBtn));
  }

  function refresh() {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const matched = ALL_CMDS.filter((c) => {
      if (activeCat && c.category !== activeCat) return false;
      if (!matchCert(c.certs)) return false;
      if (!terms.length) return true;
      const hay = `${c.desc} ${c.cmd} ${(c.tags || []).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    const p = getPins();
    const pinned = matched.filter((c) => p[c.id]);
    const rest = matched.filter((c) => !p[c.id]);

    counter.textContent = `${matched.length} lệnh`;
    list.innerHTML = "";
    if (pinned.length) {
      list.append(h("div", { class: "pin-head" }, "📌 Đã ghim"));
      pinned.forEach((c) => list.append(row(c)));
      list.append(h("hr", { class: "sep" }));
    }
    rest.forEach((c) => list.append(row(c)));
    if (!matched.length) list.append(h("div", { class: "empty" }, h("p", {}, "Không tìm thấy lệnh phù hợp.")));
  }

  input.addEventListener("input", refresh);
  bindSlash(input);
  body.append(input, h("div", { style: "margin:10px 0" }, certChips(refresh)), catRow, counter, list);
  refresh();
}

// ---------- Tab 2: YAML mẫu ----------

function renderYaml(body) {
  const input = searchBox("Tìm YAML mẫu… (vd: probe, netpol, pvc, audit)");
  let activeKind = null;

  const kinds = [...new Set(snippets.map((s) => s.kind))];
  const kindRow = h("div", { class: "chip-row", style: "margin:10px 0" });
  const allChip = h("button", { class: "chip on" }, "Mọi kind");
  allChip.addEventListener("click", () => { activeKind = null; syncKinds(); refresh(); });
  kindRow.append(allChip);
  const kindChips = new Map();
  for (const k of kinds) {
    const chip = h("button", { class: "chip" }, k);
    chip.addEventListener("click", () => { activeKind = activeKind === k ? null : k; syncKinds(); refresh(); });
    kindChips.set(k, chip);
    kindRow.append(chip);
  }
  function syncKinds() {
    allChip.classList.toggle("on", activeKind === null);
    kindChips.forEach((chip, k) => chip.classList.toggle("on", k === activeKind));
  }

  const counter = h("p", { class: "faint" });
  const list = h("div", {});

  function card(s) {
    const el = h("div", { class: "card", style: "margin-bottom:12px" },
      h("div", { class: "flex spread flex-wrap" },
        h("div", { class: "flex flex-wrap" },
          h("span", { class: "badge badge-purple" }, s.kind),
          s.certs.map((k) => certBadge(k)),
          h("strong", {}, s.title)),
        pinButton(s.id, refresh)));
    const code = codeNode(s.code);
    if (code) el.append(code);
    if (s.note) el.append(h("p", { class: "small", style: "margin:8px 0 0", html: "💡 " + inlineMd(s.note) }));
    const hint = docsHintLine(s.docsHint);
    if (hint) el.append(hint);
    const lc = lessonChip(s.lesson);
    if (lc) el.append(h("div", { style: "margin-top:8px" }, lc));
    return el;
  }

  function refresh() {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const matched = snippets.filter((s) => {
      if (activeKind && s.kind !== activeKind) return false;
      if (!matchCert(s.certs)) return false;
      if (!terms.length) return true;
      const hay = `${s.title} ${s.kind} ${s.code.text}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    const p = getPins();
    const pinned = matched.filter((s) => p[s.id]);
    const rest = matched.filter((s) => !p[s.id]);

    counter.textContent = `${matched.length} mẫu`;
    list.innerHTML = "";
    if (pinned.length) {
      list.append(h("div", { class: "pin-head" }, "📌 Đã ghim"));
      pinned.forEach((s) => list.append(card(s)));
      list.append(h("hr", { class: "sep" }));
    }
    rest.forEach((s) => list.append(card(s)));
    if (!matched.length) list.append(h("div", { class: "empty" }, h("p", {}, "Không tìm thấy mẫu phù hợp.")));
  }

  input.addEventListener("input", refresh);
  bindSlash(input);
  body.append(input, h("div", { style: "margin:10px 0" }, certChips(refresh)), kindRow, counter, list);
  refresh();
}

// ---------- Tab 3: Quy trình (playbooks) ----------

function renderPlaybooks(body) {
  const counter = h("p", { class: "faint" });
  const list = h("div", {});

  function card(pb) {
    const stepsWrap = h("ol", { class: "pb-steps" });
    pb.steps.forEach((st) => {
      const li = h("li", {},
        h("div", { html: inlineMd(st.text) }));
      const code = codeNode(st.code);
      if (code) li.append(code);
      if (st.verify) li.append(h("div", { class: "pb-verify", html: "✔️ " + inlineMd(st.verify) }));
      stepsWrap.append(li);
    });

    const bodyEl = h("div", { class: "reveal-body" },
      pb.intro ? h("p", { class: "small", style: "margin-top:8px", html: inlineMd(pb.intro) }) : null,
      stepsWrap,
      pb.pitfall ? h("div", { class: "explain-box bad", html: inlineMd(pb.pitfall) }) : null,
      docsHintLine(pb.docsHint),
      pb.lesson ? h("div", { style: "margin-top:8px" }, lessonChip(pb.lesson)) : null);

    return h("details", { class: "reveal", style: "margin:0 0 10px" },
      h("summary", {},
        h("span", { class: "flex flex-wrap", style: "display:inline-flex" },
          pinButton(pb.id, refresh),
          h("span", {}, `${pb.icon} ${pb.title}`),
          certBadge(pb.cert),
          h("span", { class: "badge badge-amber" }, `⏱️ < ${pb.timeTargetMin} phút`))),
      bodyEl);
  }

  function refresh() {
    const matched = playbooks.filter((pb) => matchCert([pb.cert]));
    const p = getPins();
    const pinned = matched.filter((x) => p[x.id]);
    const rest = matched.filter((x) => !p[x.id]);
    counter.textContent = `${matched.length} quy trình — mỗi quy trình có chỉ tiêu thời gian như phòng thi`;
    list.innerHTML = "";
    if (pinned.length) {
      list.append(h("div", { class: "pin-head" }, "📌 Đã ghim"));
      pinned.forEach((x) => list.append(card(x)));
      list.append(h("hr", { class: "sep" }));
    }
    rest.forEach((x) => list.append(card(x)));
  }

  body.append(h("div", { style: "margin:10px 0" }, certChips(refresh)), counter, list);
  refresh();
}

// ---------- Tab 4: Trước giờ thi ----------

function renderExamDay(body) {
  const list = h("div", {});

  function refresh() {
    list.innerHTML = "";
    for (const e of examDay.filter((x) => matchCert([x.cert]))) {
      const card = h("div", { class: "card", style: "margin-bottom:14px" },
        h("div", { class: "flex flex-wrap" },
          h("span", { style: "font-size:24px" }, e.icon),
          h("strong", { style: "font-size:17px" }, e.cert),
          certBadge(e.cert),
          h("span", { class: "badge badge-green" }, `Đậu ≥ ${e.passScore}`),
          h("span", { class: "badge" }, e.duration)),
        h("div", { style: "font-weight:700;margin:12px 0 4px" }, `⚙️ ${e.setup.title}`));
      const code = codeNode(e.setup.code);
      if (code) card.append(code);

      const section = (title, items, cls) =>
        card.append(
          h("div", { style: "font-weight:700;margin:12px 0 4px" }, title),
          h("ul", { class: `examday-list${cls ? " " + cls : ""}` },
            items.map((it) => h("li", { html: inlineMd(it) }))));

      section("🕐 Chiến lược thời gian", e.timePlan);
      section("🧠 Phải thuộc lòng", e.mustKnow);
      section("💀 Bẫy chết người", e.fatalTraps, "danger");
      card.append(h("p", { class: "docs-hint" }, `📖 Docs được phép mở: ${e.docsAllowed}`));
      list.append(card);
    }
  }

  body.append(h("div", { style: "margin:10px 0" }, certChips(refresh)), list);
  refresh();
}
