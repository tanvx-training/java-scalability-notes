// KubePrep — shell của ứng dụng: router theo hash, theme, sidebar mobile.

import { store } from "./lib/store.js";
import * as dashboard from "./views/dashboard.js";
import * as certs from "./views/certs.js";
import * as roadmap from "./views/roadmap.js";
import * as docs from "./views/docs.js";
import * as commands from "./views/commands.js";
import * as flashcards from "./views/flashcards.js";
import * as quiz from "./views/quiz.js";
import * as exam from "./views/exam.js";
import * as labs from "./views/labs.js";

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

// ---------- Router ----------

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const segments = hash.split("/").filter(Boolean).map(decodeURIComponent);
  return { name: segments[0] || "dashboard", params: segments.slice(1) };
}

let currentView = null;

function navigate() {
  const { name, params } = parseHash();
  const view = routes[name] || routes.dashboard;

  // Cho view đang mở cơ hội dọn dẹp (dừng timer thi thử...).
  if (currentView && typeof currentView.cleanup === "function") {
    try { currentView.cleanup(); } catch { /* ignore */ }
  }
  currentView = view;

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === (routes[name] ? name : "dashboard"));
  });

  closeSidebar();
  main.innerHTML = "";
  const page = document.createElement("div");
  page.className = "fade-in";
  main.append(page);
  view.render(page, params);
  window.scrollTo({ top: 0 });
}

window.addEventListener("hashchange", navigate);
navigate();
