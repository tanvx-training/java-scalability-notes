// Thư viện tài liệu đa lĩnh vực: mục lục nổi (desktop) / gọn (mobile), thanh tiến
// độ đọc, thời gian đọc ước tính, đánh dấu đã đọc, chỉnh cỡ chữ, khối "Hướng dẫn
// đọc" suy từ lộ trình, highlight code, copy nhanh, ảnh (resolve theo file
// markdown), link .md tương đối → tài liệu trong app, mermaid (nạp lười từ CDN).

import { h, pageHead, mdInto, toast, readingMinutes, inlineMd, emptyState } from "../lib/ui.js";
import { docs } from "../data/docs-index.js";
import { FIELDS } from "../data/fields.js";
import { getDocs, fieldOfRecord } from "../data/index.js";
import { currentField } from "../lib/field.js";
import { docsRead, pushRecent } from "../lib/activity.js";
import { docGuide } from "../lib/guides.js";
import { currentFontScale, setFontScale } from "./settings.js";

let observer = null;
let scrollHandler = null;

export function cleanup() {
  if (observer) { observer.disconnect(); observer = null; }
  if (scrollHandler) { window.removeEventListener("scroll", scrollHandler); scrollHandler = null; }
  const bar = document.getElementById("read-progress");
  if (bar) bar.hidden = true;
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
  const readMap = docsRead.all();
  const readCount = list.filter((d) => readMap[d.id]).length;

  const page = h("div", { class: "page" });
  page.append(pageHead(
    `${field.icon} Thư viện tài liệu — ${field.label}`,
    `${list.length} tài liệu · đã đọc ${readCount} — đọc trực tiếp với mục lục, hướng dẫn đọc, sơ đồ mermaid, ảnh minh họa và code có nút copy.`
  ));
  page.append(h("p", { class: "muted small", style: "margin:-8px 0 20px" }, field.desc));

  // Gom theo `group`, giữ thứ tự xuất hiện đầu tiên trong mảng docs — thứ tự
  // mảng đang là thứ tự đọc có chủ ý, không được sắp xếp lại. Tài liệu không
  // khai `group` rơi vào nhóm không tiêu đề đứng trước.
  const groups = new Map();
  for (const d of list) {
    const key = d.group ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  for (const [label, items] of groups) {
    if (label) {
      const done = items.filter((d) => readMap[d.id]).length;
      page.append(h("h2", { class: "section-title" },
        label,
        h("span", { class: "count" }, `${items.length} tài liệu · đã đọc ${done}`)));
    }
    const grid = h("div", { class: "grid mb-5" });
    for (const d of items) {
      const read = !!readMap[d.id];
      grid.append(
        h("a", { class: `card card-link${read ? " doc-card-read" : ""}`, href: `#/docs/${d.id}` },
          h("div", { class: "flex flex-start" },
            h("span", { style: "font-size:24px" }, d.icon),
            h("div", { class: "grow" },
              h("div", { class: "lab-title" }, d.title),
              h("div", { class: "muted small" }, d.desc)),
            read ? h("span", { class: "read-mark nowrap" }, "✓ Đã đọc") : h("span", { class: "faint nowrap" }, "Đọc →")),
          h("div", { class: "chip-row mt-3" },
            d.tags.map((t) => h("span", { class: "badge badge-blue" }, t)))));
    }
    page.append(grid);
  }
  root.append(page);
}

// ---------------- Trang đọc tài liệu ----------------

async function renderDoc(root, doc) {
  const field = FIELDS[doc.field];
  const prose = h("article", { class: "prose" },
    h("div", { class: "skeleton", style: "width:60%;height:22px" }),
    h("div", { class: "skeleton" }), h("div", { class: "skeleton", style: "width:90%" }), h("div", { class: "skeleton", style: "width:75%" }));
  const tocBox = h("nav", { class: "doc-toc" });
  const tocMobile = h("details", { class: "card doc-toc-mobile", hidden: true },
    h("summary", {}, "Mục lục"), h("div", { class: "doc-toc-list" }));
  const meta = h("div", { class: "doc-meta" });
  const actions = h("div", { class: "doc-actions" });
  const guideBox = h("div", {});
  const bottom = h("div", { class: "doc-actions mt-5" });

  const page = h("div", { class: "page page-wide" },
    h("div", { class: "breadcrumb" },
      h("a", { href: "#/docs" }, "Tài liệu"), " / ",
      field ? `${field.icon} ${field.label}` : "", doc.group ? ` / ${doc.group}` : "", " / ", doc.title),
    h("div", { class: "doc-layout" },
      h("div", {}, meta, actions, guideBox, tocMobile, prose, bottom, navRow(doc)),
      tocBox)
  );
  root.append(page);

  pushRecent({ type: "doc", icon: doc.icon, title: doc.title, sub: doc.group ?? field?.label ?? "", field: doc.field, href: `#/docs/${doc.id}` });

  // ---- Nút đánh dấu đã đọc (xuất hiện hai lần: đầu và cuối bài) ----
  const readBtns = [];
  function syncRead() {
    const on = docsRead.is(doc.id);
    for (const b of readBtns) {
      b.classList.toggle("on", on);
      b.textContent = on ? "✓ Đã đọc" : "Đánh dấu đã đọc";
      b.title = on ? "Bấm để bỏ đánh dấu" : "Đánh dấu tài liệu này là đã đọc xong";
    }
    statusEl.textContent = on ? "✓ đã đọc" : "chưa đọc";
    statusEl.className = on ? "text-green bold" : "";
  }
  function makeReadBtn() {
    const b = h("button", { class: "btn btn-sm btn-success", type: "button" });
    b.addEventListener("click", () => {
      const on = docsRead.toggle(doc.id);
      toast(on ? "Đã đánh dấu đọc xong 🎉" : "Đã bỏ đánh dấu", on ? "success" : "info");
      syncRead();
    });
    readBtns.push(b);
    return b;
  }

  // ---- Cỡ chữ ----
  const fontCtl = h("div", { class: "reader-controls", role: "group", "aria-label": "Cỡ chữ" },
    h("button", { type: "button", title: "Chữ nhỏ hơn", onclick: () => setFontScale(currentFontScale() - 0.1) }, "A−"),
    h("button", { type: "button", title: "Chữ lớn hơn", onclick: () => setFontScale(currentFontScale() + 0.1) }, "A+"));

  const timeEl = h("span", {}, "…");
  const statusEl = h("span", {});
  meta.append(
    doc.group ? h("span", {}, doc.group) : h("span", {}, field?.label ?? ""),
    h("span", { class: "dot" }, "·"), h("span", {}, "⏱️ ", timeEl),
    h("span", { class: "dot" }, "·"), statusEl);
  actions.append(makeReadBtn(), fontCtl);
  bottom.append(
    h("span", { class: "muted small grow" }, "Đọc xong? Đánh dấu để bảng điều khiển và hướng dẫn học ghi nhận."),
    makeReadBtn());
  syncRead();

  // ---- Khối hướng dẫn đọc (suy từ lộ trình) ----
  const g = docGuide(doc.id);
  if (g.hasAny || g.group) guideBox.append(readingGuide(g, docsRead.is(doc.id)));

  // ---- Tải markdown ----
  let text;
  try {
    const res = await fetch(doc.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch {
    prose.innerHTML = "";
    prose.append(emptyState("📄", "Chưa tải được nội dung tài liệu.",
      null,
      h("p", { class: "small" },
        "Khi chạy local, hãy khởi động bằng script ",
        h("code", {}, "webapp/scripts/dev.sh"),
        " (script sao chép sources/ vào webapp/content/ rồi mở server).")));
    timeEl.textContent = "—";
    return;
  }
  if (!prose.isConnected) return; // đã điều hướng đi

  timeEl.textContent = `≈ ${readingMinutes(text)} phút đọc`;
  const headings = mdInto(prose, text);
  fixRelativePaths(prose, doc.file);
  rewriteMarkdownLinks(prose, doc.file);
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

  // ---- Mục lục + scroll spy ----
  if (headings.length) {
    tocBox.append(h("div", { class: "doc-toc-title" }, "Mục lục"));
    const links = new Map();
    const mobileList = tocMobile.querySelector(".doc-toc-list");
    for (const hd of headings) {
      const go = (e) => { e.preventDefault(); document.getElementById(hd.id)?.scrollIntoView({ behavior: "smooth" }); tocMobile.removeAttribute("open"); };
      const a = h("a", { href: `#/docs/${doc.id}`, class: hd.level === 3 ? "lvl-3" : "", onclick: go }, hd.text);
      links.set(hd.id, a);
      tocBox.append(a);
      mobileList.append(h("a", { href: `#/docs/${doc.id}`, class: hd.level === 3 ? "lvl-3" : "", onclick: go }, hd.text));
    }
    tocMobile.hidden = false;
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

  // ---- Thanh tiến độ đọc ----
  const bar = document.getElementById("read-progress");
  if (bar) {
    bar.hidden = false;
    const fill = bar.firstElementChild;
    scrollHandler = () => {
      const rect = prose.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const seen = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      fill.style.width = `${total > 0 ? Math.round((seen / total) * 100) : 100}%`;
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });
    scrollHandler();
  }
}

// Khối "📖 Hướng dẫn đọc": cách đọc nhóm sách, mục tiêu, bài học liên quan, bẫy,
// câu tự kiểm tra — tất cả suy từ các mục lộ trình trỏ tới tài liệu này.
function readingGuide(g, alreadyRead) {
  const body = h("div", { class: "rg-body" });
  if (g.group) {
    body.append(h("div", {},
      h("h4", {}, "Cách đọc cuốn này"),
      h("p", { class: "mt0 mb0 small", html: inlineMd(g.group.howToRead) }),
      g.group.pace ? h("p", { class: "faint mt-1 mb0" }, `Nhịp: ${g.group.pace}`) : null));
  }
  if (g.goals.length) {
    body.append(h("div", {},
      h("h4", {}, `Mục tiêu đọc (${g.goals.length})`),
      h("ul", {}, g.goals.slice(0, 4).map((x) => h("li", { html: inlineMd(x) })))));
  }
  if (g.lessons.length) {
    const shown = g.lessons.slice(0, 8);
    body.append(h("div", { class: "rg-lessons" },
      h("h4", {}, `Bài học trỏ tới tài liệu này (${g.lessons.length})`),
      shown.map((l) => h("a", { href: l.href, class: l.checked ? "done" : "" },
        h("span", {}, l.checked ? "✓" : l.trackIcon),
        h("span", { class: "grow", html: inlineMd(l.text) }),
        h("span", { class: "faint" }, `${l.trackLabel} · ${l.weekLabel}`))),
      g.lessons.length > shown.length ? h("p", { class: "faint mb0" }, `… và ${g.lessons.length - shown.length} bài khác`) : null));
  } else if (g.weeks.length) {
    body.append(h("div", {},
      h("h4", {}, "Tài nguyên của tuần"),
      h("ul", {}, g.weeks.slice(0, 6).map((w) => h("li", {}, h("a", { href: `#/roadmap/${w.trackId}` }, `${w.trackIcon} ${w.trackLabel} · ${w.weekLabel} — ${w.weekTitle}`))))));
  }
  if (g.pitfalls.length) {
    body.append(h("details", {},
      h("summary", { class: "small bold", style: "cursor:pointer" }, `⚠️ Bẫy thường gặp (${g.pitfalls.length})`),
      h("ul", { class: "mt-2" }, g.pitfalls.slice(0, 5).map((x) => h("li", { html: inlineMd(x) })))));
  }
  if (g.selfChecks.length) {
    body.append(h("details", {},
      h("summary", { class: "small bold", style: "cursor:pointer" }, `❓ Câu tự kiểm tra sau khi đọc (${g.selfChecks.length})`),
      h("ol", { class: "mt-2" }, g.selfChecks.map((x) => h("li", { html: inlineMd(x) })))));
  }
  const details = h("details", { class: "card reading-guide" },
    h("summary", {},
      h("span", {}, "📖"),
      h("span", { class: "grow" }, "Hướng dẫn đọc"),
      h("span", { class: "faint" }, g.lessons.length ? `${g.lessons.length} bài học liên quan` : "theo lộ trình"),
      h("span", { class: "chev" }, "▸")),
    body);
  if (!alreadyRead) details.setAttribute("open", "");
  return details;
}

// Ảnh trong markdown dùng đường dẫn tương đối so với FILE (vd images/x.jpg);
// trình duyệt lại resolve theo URL trang, nên phải sửa lại theo thư mục chứa file.
function fixRelativePaths(prose, docFile) {
  const dir = docFile.slice(0, docFile.lastIndexOf("/") + 1);
  const base = new URL(dir, document.baseURI);
  prose.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    const src = img.getAttribute("src") || "";
    if (/^(https?:|data:|\/)/i.test(src)) return;
    img.src = new URL(src, base).href;
  });
}

// Link `.md` tương đối (vd 07-threadpool-sizing.md, ../README.md) → #/docs/<id>
// khi tìm được tài liệu có `file` tương ứng; không tìm được thì để nguyên.
const fileToId = new Map(docs.map((d) => [new URL(d.file, document.baseURI).pathname, d.id]));
function rewriteMarkdownLinks(prose, docFile) {
  const dir = docFile.slice(0, docFile.lastIndexOf("/") + 1);
  const base = new URL(dir, document.baseURI);
  prose.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (/^(https?:|mailto:|#|\/)/i.test(href) || !/\.md(#|$)/i.test(href)) return;
    let path;
    try { path = new URL(href.split("#")[0], base).pathname; } catch { return; }
    const id = fileToId.get(path);
    if (id) {
      a.setAttribute("href", `#/docs/${id}`);
      a.removeAttribute("target");
    }
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
    return; // Offline / CDN lỗi — giữ nguyên khối nguồn làm fallback.
  }

  const dark = document.documentElement.getAttribute("data-theme") === "dark";
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
  return h("div", { class: "flex spread mt-4", style: "gap:10px" },
    prev
      ? h("a", { class: "btn", href: `#/docs/${prev.id}`, title: prev.title }, `← ${short(prev.title)}`)
      : h("span", {}),
    next
      ? h("a", { class: "btn", href: `#/docs/${next.id}`, title: next.title }, `${short(next.title)} →`)
      : h("a", { class: "btn", href: "#/docs" }, "Về thư viện →")
  );
}
