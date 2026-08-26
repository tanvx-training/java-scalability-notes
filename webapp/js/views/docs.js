// Thư viện tài liệu đa lĩnh vực: mục lục nổi, highlight code, copy nhanh,
// ảnh minh họa (đường dẫn tương đối được resolve theo file markdown)
// và mermaid diagram (nạp lười từ CDN, offline thì hiển thị nguồn).

import { h, pageHead, mdInto } from "../lib/ui.js";
import { docs, FIELDS } from "../data/docs-index.js";
import { getDocs, fieldOfRecord } from "../data/index.js";
import { currentField } from "../lib/field.js";

let observer = null;

export function cleanup() {
  if (observer) { observer.disconnect(); observer = null; }
}

export function render(root, params) {
  const id = params[0];
  if (!id) return renderIndex(root);
  const doc = docs.find((d) => d.id === id);
  if (!doc) return renderIndex(root);
  renderDoc(root, doc);
}

// ---------------- Trang danh mục ----------------

function renderIndex(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const list = getDocs(fieldKey);

  const page = h("div", { class: "page" });
  page.append(pageHead(
    `${field.icon} Thư viện tài liệu — ${field.label}`,
    `${list.length} tài liệu — đọc trực tiếp với mục lục, sơ đồ mermaid, ảnh minh họa và code có nút copy.`
  ));
  page.append(h("p", { class: "muted small", style: "margin:-8px 0 20px" }, field.desc));

  const grid = h("div", { class: "grid", style: "margin-bottom:26px" });
  for (const d of list) {
    grid.append(
      h("a", { class: "card card-link", href: `#/docs/${d.id}` },
        h("div", { class: "flex" },
          h("span", { style: "font-size:24px" }, d.icon),
          h("div", { class: "grow" },
            h("div", { class: "lab-title" }, d.title),
            h("div", { class: "muted small" }, d.desc)),
          h("span", { class: "faint" }, "Đọc →")),
        h("div", { class: "chip-row", style: "margin-top:10px" },
          d.tags.map((t) => h("span", { class: "badge badge-blue" }, t)))
      )
    );
  }
  page.append(grid);
  root.append(page);
}

// ---------------- Trang đọc tài liệu ----------------

async function renderDoc(root, doc) {
  const field = FIELDS[doc.field];
  const prose = h("article", { class: "prose" },
    h("p", { class: "muted" }, "Đang tải tài liệu…"));
  const tocBox = h("nav", { class: "doc-toc" });

  const page = h("div", { class: "page page-wide" },
    h("div", { class: "breadcrumb" },
      h("a", { href: "#/docs" }, "Tài liệu"), " / ",
      field ? `${field.icon} ${field.label}` : "", " / ", doc.title),
    h("div", { class: "doc-layout" },
      h("div", {}, prose, navRow(doc)),
      tocBox)
  );
  root.append(page);

  let text;
  try {
    const res = await fetch(doc.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch {
    prose.innerHTML = "";
    prose.append(
      h("div", { class: "empty" },
        h("div", { class: "big" }, "📄"),
        h("p", {}, h("strong", {}, "Chưa tải được nội dung tài liệu.")),
        h("p", { class: "small" },
          "Khi chạy local, hãy khởi động bằng script ",
          h("code", {}, "webapp/dev.sh"),
          " (script sẽ copy các file markdown của repo vào webapp/content/ rồi mở server)."))
    );
    return;
  }

  const headings = mdInto(prose, text);
  fixRelativePaths(prose, doc.file);
  renderMermaidBlocks(prose);

  // Link neo nội bộ trong tài liệu (#muc-luc…) không được đụng vào hash router:
  // chặn click và cuộn tới heading tương ứng (chấp nhận slug kiểu GitHub "--").
  prose.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href.startsWith("#/")) return; // link của app
    e.preventDefault();
    const raw = decodeURIComponent(href.slice(1)).toLowerCase();
    const target =
      document.getElementById(raw) ||
      document.getElementById(raw.replace(/-+/g, "-").replace(/^-|-$/g, ""));
    target?.scrollIntoView({ behavior: "smooth" });
  });

  // Mục lục + scroll spy
  if (headings.length) {
    tocBox.append(h("div", { class: "doc-toc-title" }, "Mục lục"));
    const links = new Map();
    for (const hd of headings) {
      const a = h("a", { href: `#/docs/${doc.id}`, class: hd.level === 3 ? "lvl-3" : "" }, hd.text);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById(hd.id)?.scrollIntoView({ behavior: "smooth" });
      });
      links.set(hd.id, a);
      tocBox.append(a);
    }
    cleanup();
    observer = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.remove("active"));
          links.get(en.target.id)?.classList.add("active");
        }
      }
    }, { rootMargin: "0px 0px -75% 0px" });
    for (const hd of headings) {
      const el = document.getElementById(hd.id);
      if (el) observer.observe(el);
    }
  }
}

// Ảnh trong markdown dùng đường dẫn tương đối so với FILE (vd ../images/x.jpg);
// trình duyệt lại resolve theo URL trang, nên phải sửa lại theo thư mục chứa file.
function fixRelativePaths(prose, docFile) {
  const dir = docFile.slice(0, docFile.lastIndexOf("/") + 1);
  const base = new URL(dir, document.baseURI);
  prose.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (/^(https?:|data:|\/)/i.test(src)) return;
    img.src = new URL(src, base).href;
  });
}

// ---------------- Mermaid (nạp lười) ----------------

let mermaidPromise = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import(
      "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
    ).then((m) => m.default);
  }
  return mermaidPromise;
}

async function renderMermaidBlocks(container) {
  const blocks = container.querySelectorAll(".mermaid-block");
  if (!blocks.length) return;

  let mermaid;
  try {
    mermaid = await loadMermaid();
  } catch {
    // Offline / CDN lỗi — giữ nguyên khối nguồn làm fallback.
    return;
  }

  const dark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    securityLevel: "loose",
    fontFamily: "inherit",
  });

  let n = 0;
  for (const block of blocks) {
    if (!block.isConnected) return; // đã điều hướng sang trang khác
    const src = block.querySelector(".mermaid-src")?.textContent || "";
    try {
      const { svg } = await mermaid.render(`mmd-${Date.now()}-${n++}`, src);
      block.innerHTML = svg;
      block.classList.add("rendered");
    } catch {
      /* sơ đồ lỗi cú pháp — giữ nguồn */
    }
  }
}

function navRow(doc) {
  const sameField = getDocs(fieldOfRecord(doc));
  const idx = sameField.indexOf(doc);
  const prev = sameField[idx - 1];
  const next = sameField[idx + 1];
  const short = (t) => (t.length > 34 ? t.slice(0, 32) + "…" : t);
  return h("div", { class: "flex spread", style: "margin-top:30px;gap:10px" },
    prev
      ? h("a", { class: "btn", href: `#/docs/${prev.id}`, title: prev.title }, `← ${short(prev.title)}`)
      : h("span", {}),
    next
      ? h("a", { class: "btn", href: `#/docs/${next.id}`, title: next.title }, `${short(next.title)} →`)
      : h("span", {})
  );
}
