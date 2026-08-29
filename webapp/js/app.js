// KubePrep — shell của ứng dụng: router theo hash, theme, sidebar mobile.

import { store } from "./lib/store.js";
import { currentField, setCurrentField } from "./lib/field.js";
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
};

// Khôi phục "chế độ gọn" (ẩn sidebar, mật độ cao) nếu người dùng đã bật.
if (store.get("ref.compact")) document.body.classList.add("compact-mode");

const main = document.getElementById("main");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");

// ---------- Theme ----------

function currentTheme() {
  const saved = store.get("theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  store.set("theme", next);
  document.documentElement.setAttribute("data-theme", next);
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

function onFieldChange(id) {
  if (!setCurrentField(id)) return;
  renderFieldSwitch();
  renderNav();
  renderFooterLink();
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
  fieldSwitch.innerHTML = "";
  const sel = document.createElement("select");
  sel.className = "select field-select";
  sel.setAttribute("aria-label", "Chọn lĩnh vực học");
  for (const id of FIELD_ORDER) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${FIELDS[id].icon} ${FIELDS[id].label}`;
    if (id === cur) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener("change", () => onFieldChange(sel.value));
  fieldSwitch.append(sel);
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
  if (owner && setCurrentField(owner)) {
    renderFieldSwitch();
    renderNav();
    renderFooterLink();
  }

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

  closeSidebar();
  main.innerHTML = "";
  const page = document.createElement("div");
  page.className = "fade-in";
  main.append(page);
  view.render(page, routeName === name ? params : []);
  window.scrollTo({ top: 0 });
}

window.addEventListener("hashchange", navigate);
renderFieldSwitch();
renderNav();
renderFooterLink();
navigate();
