// Trình xem tài liệu markdown: mục lục nổi, highlight code, copy nhanh.

import { h, pageHead, mdInto } from "../lib/ui.js";
import { docs } from "../data/docs-index.js";

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

function renderIndex(root) {
  const page = h("div", { class: "page" });
  page.append(pageHead(
    "📚 Tài liệu",
    "Bộ tài liệu CKAD tiếng Việt của repo — đọc trực tiếp với mục lục, code có nút copy. Trong phòng thi bạn được mở kubernetes.io/docs, hãy luyện đọc tài liệu song song."
  ));

  const grid = h("div", { class: "grid" });
  for (const d of docs) {
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

async function renderDoc(root, doc) {
  const idx = docs.indexOf(doc);
  const prose = h("article", { class: "prose" },
    h("p", { class: "muted" }, "Đang tải tài liệu…"));
  const tocBox = h("nav", { class: "doc-toc" });

  const page = h("div", { class: "page page-wide" },
    h("div", { class: "breadcrumb" },
      h("a", { href: "#/docs" }, "Tài liệu"), " / ", doc.title),
    h("div", { class: "doc-layout" },
      h("div", {}, prose, navRow(idx)),
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
          " (script sẽ copy các file markdown từ thư mục CKAD/ vào webapp/content/ rồi mở server)."))
    );
    return;
  }

  const headings = mdInto(prose, text);

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

function navRow(idx) {
  const prev = docs[idx - 1];
  const next = docs[idx + 1];
  return h("div", { class: "flex spread", style: "margin-top:30px" },
    prev
      ? h("a", { class: "btn", href: `#/docs/${prev.id}` }, `← ${prev.title.split(" — ")[0]}`)
      : h("span", {}),
    next
      ? h("a", { class: "btn", href: `#/docs/${next.id}` }, `${next.title.split(" — ")[0]} →`)
      : h("span", {})
  );
}
