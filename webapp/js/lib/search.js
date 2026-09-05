// Tìm kiếm toàn cục (Ctrl/⌘+K). Chỉ mục dựng lười lần đầu mở, từ dữ liệu đã
// nạp sẵn trong app: tài liệu, mục lộ trình, lab, lệnh, YAML mẫu, quy trình,
// flashcard. Khớp không dấu: "lo trinh" tìm được "lộ trình".
//
// Không đưa câu hỏi trắc nghiệm vào chỉ mục — không có trang cho một câu đơn,
// và hiện câu hỏi kèm đáp án trong kết quả là lộ đề.

import { h, openOverlay, stripMd } from "./ui.js";
import { setCurrentField } from "./field.js";
import { FIELDS } from "../data/fields.js";
import { docs } from "../data/docs-index.js";
import { tracks } from "../data/roadmap.js";
import { allFlashcards, fieldOfRecord } from "../data/index.js";
import { TOPICS } from "../data/meta.js";
import { labs } from "../data/kubernetes/labs.js";
import { commands } from "../data/kubernetes/commands.js";
import { adminCommands } from "../data/kubernetes/commands-admin.js";
import { snippets } from "../data/kubernetes/snippets.js";
import { playbooks } from "../data/kubernetes/playbooks.js";

export function normalize(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase();
}

const TYPES = {
  doc:      { label: "Tài liệu",     order: 0 },
  lesson:   { label: "Bài học",      order: 1 },
  lab:      { label: "Lab",          order: 2 },
  playbook: { label: "Quy trình",    order: 3 },
  cmd:      { label: "Lệnh",         order: 4 },
  yaml:     { label: "YAML mẫu",     order: 5 },
  card:     { label: "Flashcard",    order: 6 },
};

let index = null;

function buildIndex() {
  const items = [];
  const add = (it) => items.push({ ...it, norm: normalize(it.text), normTitle: normalize(it.title) });

  for (const d of docs) {
    add({ type: "doc", icon: d.icon, title: d.title, sub: d.group ? `${d.group} · ${d.desc}` : d.desc,
      field: fieldOfRecord(d), href: `#/docs/${d.id}`,
      text: [d.title, d.desc, d.tags.join(" "), d.group ?? ""].join(" ") });
  }
  for (const t of tracks) {
    const field = fieldOfRecord(t);
    for (const w of t.weeks) {
      for (const it of w.items) {
        add({ type: "lesson", icon: t.icon, title: stripMd(it.text), sub: `${t.label} · ${w.week} — ${w.title}`,
          field, href: `#/roadmap/${t.id}/${it.id}`, text: `${it.text} ${t.label} ${t.name} ${w.title}` });
      }
    }
  }
  for (const l of labs) {
    add({ type: "lab", icon: "🧪", title: l.title, sub: stripMd(l.scenario).slice(0, 120),
      field: "kubernetes", href: `#/labs/${l.id}`, text: `${l.title} ${l.scenario} ${(l.tasks ?? []).join(" ")}` });
  }
  for (const p of playbooks) {
    add({ type: "playbook", icon: p.icon ?? "📋", title: p.title, sub: `${p.cert} · ${p.timeTargetMin} phút`,
      field: "kubernetes", href: "#/commands/playbooks", anchor: p.id, text: `${p.title} ${p.intro ?? ""} ${p.cert}` });
  }
  for (const c of [...commands, ...adminCommands]) {
    add({ type: "cmd", icon: "⌨️", title: stripMd(c.desc), sub: c.cmd,
      field: "kubernetes", href: "#/commands", anchor: c.id, text: `${c.desc} ${c.cmd} ${(c.tags ?? []).join(" ")}` });
  }
  for (const s of snippets) {
    add({ type: "yaml", icon: "📄", title: s.title, sub: `${s.kind} · ${(s.certs ?? []).join(", ")}`,
      field: "kubernetes", href: "#/commands/yaml", anchor: s.id, text: `${s.title} ${s.kind} ${(s.certs ?? []).join(" ")}` });
  }
  for (const c of allFlashcards) {
    const topic = TOPICS[c.topic]?.label ?? c.topic;
    add({ type: "card", icon: "🃏", title: stripMd(c.front), sub: topic,
      field: fieldOfRecord(c), href: "#/flashcards", text: `${c.front} ${topic}` });
  }
  return items;
}

export function search(query, limit = 40) {
  if (!index) index = buildIndex();
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored = [];
  for (const it of index) {
    let score = 0;
    let ok = true;
    for (const tok of tokens) {
      if (!it.norm.includes(tok)) { ok = false; break; }
      if (it.normTitle.includes(tok)) score += 3;
      if (it.normTitle.startsWith(tok)) score += 2;
      score += 1;
    }
    if (!ok) continue;
    if (it.normTitle === tokens.join(" ")) score += 6;
    scored.push({ it, score });
  }
  scored.sort((a, b) => b.score - a.score || TYPES[a.it.type].order - TYPES[b.it.type].order);
  return scored.slice(0, limit).map((s) => s.it);
}

// Điều hướng tới kết quả: đổi lĩnh vực nếu cần, rồi đặt hash. Nếu hash không
// đổi (đang đứng đúng trang) thì tự phát hashchange để app render lại.
export function goTo(item) {
  if (item.field) setCurrentField(item.field);
  if (location.hash === item.href) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = item.href;
  if (item.anchor) {
    setTimeout(() => {
      const el = document.getElementById(item.anchor);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("card-active");
      setTimeout(() => el.classList.remove("card-active"), 2400);
    }, 120);
  }
}

function highlight(text, tokensRaw) {
  const safe = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = safe;
  for (const t of tokensRaw) {
    if (t.length < 2) continue;
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    out = out.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return out;
}

let current = null;

export function openSearch(initial = "") {
  if (current) { current.input.focus(); return; }
  const input = h("input", { class: "cmdk-input", type: "search", placeholder: "Tìm tài liệu, bài học, lệnh, lab…", autocomplete: "off", spellcheck: "false", "aria-label": "Tìm kiếm" });
  input.value = initial;
  const list = h("div", { class: "cmdk-list" });
  const foot = h("div", { class: "cmdk-foot" },
    h("span", {}, h("kbd", { class: "kbd" }, "↑↓"), " di chuyển"),
    h("span", {}, h("kbd", { class: "kbd" }, "Enter"), " mở"),
    h("span", {}, h("kbd", { class: "kbd" }, "Esc"), " đóng"),
    h("span", { class: "grow right" }, "Gõ không dấu cũng được"));

  let results = [];
  let active = 0;
  let rows = [];

  function render() {
    list.innerHTML = "";
    rows = [];
    const q = input.value.trim();
    if (!q) {
      list.append(h("div", { class: "cmdk-empty" }, "Nhập từ khoá — ví dụ: ", h("code", {}, "etcd snapshot"), ", ", h("code", {}, "virtual thread"), ", ", h("code", {}, "replication")));
      return;
    }
    results = search(q);
    if (!results.length) {
      list.append(h("div", { class: "cmdk-empty" }, `Không có gì khớp "${q}".`));
      return;
    }
    const tokensRaw = q.split(/\s+/).filter(Boolean);
    let lastType = null;
    results.forEach((it, i) => {
      if (it.type !== lastType) {
        list.append(h("div", { class: "cmdk-group" }, TYPES[it.type].label));
        lastType = it.type;
      }
      const f = FIELDS[it.field];
      const row = h("a", { class: `cmdk-item${i === active ? " active" : ""}`, href: it.href },
        h("span", { class: "c-ico" }, it.icon),
        h("span", { class: "c-txt" },
          h("strong", { html: highlight(it.title, tokensRaw) }),
          h("small", { html: highlight(it.sub ?? "", tokensRaw) })),
        f ? h("span", { class: "badge" }, `${f.icon} ${f.label}`) : null);
      row.addEventListener("click", (e) => { e.preventDefault(); pick(i); });
      row.addEventListener("mousemove", () => setActive(i));
      rows.push(row);
      list.append(row);
    });
  }

  function setActive(i) {
    active = Math.max(0, Math.min(i, rows.length - 1));
    rows.forEach((r, k) => r.classList.toggle("active", k === active));
    rows[active]?.scrollIntoView({ block: "nearest" });
  }

  function pick(i) {
    const it = results[i];
    if (!it) return;
    ov.close();
    goTo(it);
  }

  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { active = 0; render(); }, 60);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); pick(active); }
  });

  const ov = openOverlay({
    head: h("span", { class: "grow flex" }, h("span", {}, "🔍"), input),
    body: list,
    foot,
    onClose: () => { current = null; },
  });
  current = { input };
  render();
  input.focus();
  input.select();
}
