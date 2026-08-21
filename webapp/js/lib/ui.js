// Tiện ích UI dùng chung: tạo DOM, badge, copy code, render markdown vào node.

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

export function pageHead(title, sub) {
  return h("div", { class: "page-head" },
    h("h1", {}, title),
    sub ? h("p", { class: "sub" }, sub) : null
  );
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
