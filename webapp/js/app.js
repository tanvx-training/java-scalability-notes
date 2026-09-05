// DevPrep — shell của ứng dụng: router theo hash, theme, sidebar mobile, bộ chọn
// lĩnh vực, tìm kiếm toàn cục, phím tắt.

import { store } from "./lib/store.js";
import { currentField, setCurrentField } from "./lib/field.js";
import { h, openOverlay, hasOpenOverlay } from "./lib/ui.js";
import { openSearch } from "./lib/search.js";
import { roadmapStats, fieldSummary } from "./lib/stats.js";
import { FIELDS, FIELD_ORDER, navFor, moduleAllowed } from "./data/fields.js";
import { fieldOfDoc, fieldOfTrack, fieldOfMatrixModule } from "./data/index.js";
import * as dashboard from "./views/dashboard.js";
import * as certs from "./views/certs.js";
import * as roadmap from "./views/roadmap.js";
import * as docs from "./views/docs.js";
import * as commands from "./views/commands.js";
import * as flashcards from "./views/flashcards.js";
import * as quiz from "./views/quiz.js";
import * as exam from "./views/exam.js";
import * as labs from "./views/labs.js";
import * as tracker from "./views/tracker.js";
import * as settings from "./views/settings.js";

const routes = {
  dashboard,
  certs,
  roadmap,
  docs,
  commands,
  flashcards,
  quiz,
  exam,
  labs,
  tracker,
  settings,
};

// Khôi phục "chế độ gọn" (ẩn sidebar, mật độ cao) nếu người dùng đã bật.
if (store.get("ref.compact")) document.body.classList.add("compact-mode");

const main = document.getElementById("main");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");

// ---------- Theme ----------

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  settings.setThemePref(cur === "dark" ? "light" : "dark");
}

document.getElementById("theme-btn").addEventListener("click", toggleTheme);
document.getElementById("theme-btn-mobile").addEventListener("click", toggleTheme);

// ---------- Sidebar (mobile) ----------

function closeSidebar() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
}

document.getElementById("menu-btn").addEventListener("click", () => {
  sidebar.classList.add("open");
  backdrop.classList.add("show");
});
backdrop.addEventListener("click", closeSidebar);

// ---------- Lĩnh vực ----------

export function switchField(id) {
  if (!setCurrentField(id)) return;
  renderSidebar();
  // Hash hiện tại có thể trỏ tới bản ghi của lĩnh vực khác (vd #/roadmap/cka).
  // Giữ nguyên thì navigate() sẽ suy ngược lĩnh vực từ nó và huỷ lựa chọn vừa
  // rồi của người dùng. Bỏ tham số: giữ lại view nếu lĩnh vực mới có module đó,
  // không thì về bảng điều khiển.
  const { name } = parseHash();
  const target = moduleAllowed(id, name) ? name : "dashboard";
  const nextHash = target === "dashboard" ? "#/" : `#/${target}`;
  if (location.hash !== nextHash) location.hash = nextHash; // hashchange -> navigate()
  else navigate();                                          // hash không đổi -> gọi thẳng
}

const fieldSwitch = document.getElementById("field-switch");
const navEl = document.getElementById("nav");
const refLink = document.getElementById("ref-link");

// Link tham khảo ngoài ở chân sidebar — theo lĩnh vực hiện tại, ẩn nếu không có.
function renderFooterLink() {
  const ref = FIELDS[currentField()].externalRef;
  if (!ref) {
    refLink.hidden = true;
    return;
  }
  refLink.href = ref.href;
  refLink.textContent = `${ref.label} ↗`;
  refLink.hidden = false;
}

function renderFieldSwitch() {
  const cur = currentField();
  const f = FIELDS[cur];
  fieldSwitch.innerHTML = "";
  const btn = h("button", { class: "field-btn", type: "button", "aria-haspopup": "dialog", title: "Đổi lĩnh vực học" },
    h("span", { class: "field-ico" }, f.icon),
    h("span", { class: "field-txt" },
      h("strong", {}, f.label),
      h("small", {}, `Lĩnh vực · ${FIELD_ORDER.length} lựa chọn`)),
    h("span", { class: "chev-down" }, "▾"));
  btn.addEventListener("click", openFieldPicker);
  fieldSwitch.append(btn);
}

// Bảng chọn lĩnh vực: 10 thẻ có icon, tiến độ lộ trình và số lượng nội dung.
export function openFieldPicker() {
  const cur = currentField();
  const grid = h("div", { class: "picker-grid" });
  let ov;
  for (const id of FIELD_ORDER) {
    const f = FIELDS[id];
    const rm = roadmapStats(id);
    const sum = fieldSummary(id);
    const item = h("button", { class: `picker-item${id === cur ? " on" : ""}`, type: "button" },
      h("span", { class: "p-ico" }, f.icon),
      h("span", { class: "p-txt" },
        h("strong", {}, f.label),
        h("small", {}, sum.text),
        rm.total
          ? h("div", { class: "progress thin green" }, h("span", { style: `width:${rm.pct}%` }))
          : null));
    item.addEventListener("click", () => { ov.close(); switchField(id); });
    grid.append(item);
  }
  ov = openOverlay({ title: "Chọn lĩnh vực học", body: h("div", { class: "overlay-body" }, grid) });
}

function renderNav() {
  const cur = currentField();
  navEl.innerHTML = "";
  for (const group of navFor(cur)) {
    const g = document.createElement("div");
    g.className = "nav-group";
    const t = document.createElement("div");
    t.className = "nav-title";
    t.textContent = group.title;
    g.append(t);
    for (const item of group.items) {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.href = item.href;
      a.dataset.route = item.id;
      const ico = document.createElement("span");
      ico.className = "nav-ico";
      ico.textContent = item.icon;
      a.append(ico, document.createTextNode(" " + item.label));
      g.append(a);
    }
    navEl.append(g);
  }
}

function renderSidebar() {
  renderFieldSwitch();
  renderNav();
  renderFooterLink();
}

// ---------- Tìm kiếm & phím tắt ----------

document.getElementById("search-btn").addEventListener("click", () => openSearch());
document.getElementById("search-btn-mobile").addEventListener("click", () => openSearch());
document.getElementById("shortcuts-btn").addEventListener("click", openShortcuts);

function openShortcuts() {
  const rows = [
    ["Ctrl / ⌘ + K", "Mở tìm kiếm toàn cục"],
    ["/", "Mở tìm kiếm (khi không gõ trong ô nhập)"],
    ["?", "Bảng phím tắt này"],
    ["Esc", "Đóng bảng đang mở"],
    ["Space", "Lật flashcard"],
    ["1 · 2 · 3 · 4", "Chấm Lại / Khó / Tốt / Dễ sau khi lật"],
  ];
  openOverlay({
    title: "⌨️ Phím tắt",
    body: h("div", { class: "overlay-body" },
      h("table", { class: "shortcut-table" },
        h("tbody", {}, rows.map(([k, d]) =>
          h("tr", {}, h("td", {}, k.split(" · ").map((x, i) => [i ? " · " : null, h("kbd", { class: "kbd" }, x)])), h("td", {}, d)))))),
  });
}

document.addEventListener("keydown", (e) => {
  const typing = e.target instanceof Element && e.target.matches("input, select, textarea, [contenteditable]");
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSearch();
    return;
  }
  if (typing || hasOpenOverlay() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "/") { e.preventDefault(); openSearch(); }
  else if (e.key === "?") { e.preventDefault(); openShortcuts(); }
});

// ---------- Router ----------

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const segments = hash.split("/").filter(Boolean).map(decodeURIComponent);
  return { name: segments[0] || "dashboard", params: segments.slice(1) };
}

let currentView = null;

function navigate() {
  const { name, params } = parseHash();

  // Deep-link tới tài liệu/track của lĩnh vực khác → chuyển lĩnh vực theo nội dung.
  let owner = null;
  if (name === "docs" && params[0]) owner = fieldOfDoc(params[0]);
  if (name === "roadmap" && params[0]) owner = fieldOfTrack(params[0]);
  if (name === "tracker" && params[0]) owner = fieldOfMatrixModule(params[0]);
  if (owner) setCurrentField(owner);
  // Sidebar luôn đồng bộ với lĩnh vực hiện tại — tìm kiếm/bộ chọn có thể đã đổi nó.
  renderSidebar();

  // Route không thuộc lĩnh vực đang chọn → về bảng điều khiển.
  let routeName = routes[name] ? name : "dashboard";
  if (!moduleAllowed(currentField(), routeName)) routeName = "dashboard";
  const view = routes[routeName];

  if (currentView && typeof currentView.cleanup === "function") {
    try { currentView.cleanup(); } catch { /* ignore */ }
  }
  currentView = view;

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === routeName);
  });
  document.getElementById("settings-link")?.classList.toggle("active", routeName === "settings");
  document.getElementById("read-progress").hidden = true;
  main.dataset.route = routeName;

  closeSidebar();
  main.innerHTML = "";
  const page = document.createElement("div");
  page.className = "fade-in";
  main.append(page);
  view.render(page, routeName === name ? params : []);
  window.scrollTo({ top: 0 });
}

window.addEventListener("hashchange", navigate);
navigate();
