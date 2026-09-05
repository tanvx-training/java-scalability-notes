// Tiện ích UI dùng chung: tạo DOM, badge, copy code, render markdown vào node,
// toast, dialog xác nhận, overlay, thẻ số liệu.

import { renderMarkdown, codeBlockHtml } from "./markdown.js";
import { CERTS, DOMAINS, DIFFICULTY } from "../data/meta.js";

// Tạo element nhanh: h("div", { class: "card", onclick: fn }, child1, child2…)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "html") {
      el.innerHTML = v;
    } else if (v === true) {
      el.setAttribute(k, "");
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Gắn nút copy cho mọi code block trong container.
export function enhanceCodeBlocks(container) {
  container.querySelectorAll(".codeblock").forEach((block) => {
    const btn = block.querySelector(".codeblock-copy");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
      const code = block.dataset.code
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = "✓ Đã copy";
      } catch {
        btn.textContent = "Lỗi copy";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
  });
}

// Render markdown vào một node (kèm nút copy + trả về danh sách heading).
export function mdInto(node, md) {
  const { html, headings } = renderMarkdown(md);
  node.innerHTML = html;
  enhanceCodeBlocks(node);
  return headings;
}

// Node hiển thị 1 đoạn code (object { lang, text } trong dữ liệu).
export function codeNode(code) {
  if (!code || !code.text) return null;
  const div = h("div", { html: codeBlockHtml(code.text, code.lang || "") });
  enhanceCodeBlocks(div);
  return div;
}

// Badge cho chứng chỉ / domain / độ khó.
export function certBadge(certKey) {
  const c = CERTS[certKey];
  return h("span", { class: `badge badge-${c ? c.color : "blue"}` }, certKey);
}

export function domainBadge(domainKey) {
  const d = DOMAINS[domainKey];
  return h("span", { class: "badge" }, d ? d.short : domainKey);
}

export function diffBadge(level) {
  const d = DIFFICULTY[level] || DIFFICULTY[2];
  return h("span", { class: `badge badge-${d.color}` }, d.label);
}

// Inline markdown nhẹ cho text dữ liệu (chỉ `code`, **bold**).
export function inlineMd(text) {
  const esc = String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

// Bỏ markdown để lấy text thuần (tiêu đề bài học trong tìm kiếm, "gần đây"…).
export function stripMd(text) {
  return String(text ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function pageHead(title, sub, eyebrow) {
  return h("div", { class: "page-head" },
    eyebrow ? h("div", { class: "eyebrow" }, eyebrow) : null,
    h("h1", {}, title),
    sub ? h("p", { class: "sub" }, sub) : null
  );
}

// Tiêu đề mục trong trang: "Khu vực học tập  · 6" + phần phụ bên phải (tuỳ chọn).
export function sectionTitle(text, count, extra) {
  return h("h2", { class: "section-title" },
    text,
    count != null ? h("span", { class: "count" }, String(count)) : null,
    extra ? h("span", { class: "spacer" }) : null,
    extra || null);
}

// Thẻ số liệu: { icon, num, label, href, extra, tone }
export function statCard({ icon, num, label, href, extra, tone }) {
  const inner = [
    icon ? h("div", { class: "stat-ico" }, icon) : null,
    h("div", { class: `stat-num${tone ? ` text-${tone}` : ""}` }, String(num)),
    h("div", { class: "stat-label" }, label),
    extra ? h("div", { class: "stat-extra" }, extra) : null,
  ];
  return href
    ? h("a", { class: "card card-link stat-card", href }, inner)
    : h("div", { class: "card stat-card" }, inner);
}

export function emptyState(icon, title, desc, action) {
  return h("div", { class: "empty" },
    h("div", { class: "big" }, icon),
    h("p", {}, h("strong", {}, title)),
    desc ? h("p", { class: "small" }, desc) : null,
    action || null);
}

// Trộn mảng (Fisher–Yates, không đổi mảng gốc).
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtClock(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// "vừa xong" / "3 giờ trước" / "hôm qua" / "5 ngày trước" / dd/mm
export function fmtRelative(ts) {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.round(hr / 24);
  if (day === 1) return "hôm qua";
  if (day < 14) return `${day} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// Thời gian đọc ước tính từ markdown (~220 từ/phút cho tiếng Việt kỹ thuật).
export function readingMinutes(text) {
  const words = String(text).replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

// ---------- Toast ----------

let toastStack = null;
export function toast(message, kind = "info", ms = 2600) {
  if (!toastStack) {
    toastStack = h("div", { class: "toast-stack", role: "status", "aria-live": "polite" });
    (document.getElementById("overlay-root") || document.body).append(toastStack);
  }
  const el = h("div", { class: `toast ${kind}` }, message);
  toastStack.append(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 220);
  }, ms);
  return el;
}

// ---------- Dialog xác nhận (thay confirm()) ----------

export function confirmDialog(message, { title = "Xác nhận", okLabel = "Đồng ý", cancelLabel = "Huỷ", danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = h("dialog", { class: "modal" },
      h("h3", {}, title),
      h("p", {}, message),
      h("div", { class: "dlg-actions" },
        h("button", { class: "btn", type: "button", onclick: () => finish(false) }, cancelLabel),
        h("button", { class: `btn ${danger ? "btn-danger" : "btn-primary"}`, type: "button", onclick: () => finish(true) }, okLabel)));
    let settled = false;
    function finish(v) {
      if (settled) return;
      settled = true;
      resolve(v);
      try { dlg.close(); } catch { /* ignore */ }
      dlg.remove();
    }
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); finish(false); });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) finish(false); });
    (document.getElementById("overlay-root") || document.body).append(dlg);
    if (typeof dlg.showModal === "function") dlg.showModal();
    else { dlg.setAttribute("open", ""); }
    dlg.querySelector(".btn-primary, .btn-danger")?.focus();
  });
}

// ---------- Overlay (bảng chọn lĩnh vực, tìm kiếm, phím tắt) ----------

let openOverlays = 0;
export function openOverlay({ title, head, body, foot, onClose, className = "" }) {
  const root = document.getElementById("overlay-root") || document.body;
  const panel = h("div", { class: `overlay-panel ${className}`, role: "dialog", "aria-modal": "true" });
  const closeBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "Đóng" }, "✕");
  panel.append(
    h("div", { class: "overlay-head" }, head || h("strong", {}, title || ""), closeBtn),
    body,
    foot || null);
  const overlay = h("div", { class: "overlay" }, panel);
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    openOverlays--;
    onClose?.();
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);
  root.append(overlay);
  openOverlays++;
  const focusable = panel.querySelector("input, button:not(.icon-btn), a");
  (focusable || closeBtn).focus();
  return { close, panel, overlay };
}

export const hasOpenOverlay = () => openOverlays > 0;
