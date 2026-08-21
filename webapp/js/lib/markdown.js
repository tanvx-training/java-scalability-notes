// Trình render Markdown gọn nhẹ, không phụ thuộc thư viện ngoài.
// Hỗ trợ: heading (sinh id cho TOC), bảng, fenced code (highlight yaml/bash),
// blockquote, danh sách lồng nhau + task list, bold/italic/code/link/ảnh.

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------- Syntax highlight ----------------

const BASH_CMDS =
  /^(kubectl|k|docker|podman|helm|kind|minikube|git|curl|wget|vim|grep|cat|echo|export|alias|source|sudo|apt|yum|brew|cd|ls|cp|mv|rm|mkdir|chmod|chown|tar|base64|watch|sleep|go|node|npm|python3?|ssh|systemctl|journalctl|crictl|etcdctl|kubeadm|openssl|set)\b/;

function highlightLine(line, lang) {
  // Tách phần comment ra trước để không highlight chồng lên nó.
  let code = line;
  let comment = "";
  const ci = findCommentStart(line, lang);
  if (ci >= 0) {
    code = line.slice(0, ci);
    comment = `<span class="tok-c">${line.slice(ci)}</span>`;
  }

  if (lang === "yaml") {
    code = code.replace(
      /^(\s*(?:-\s+)?)([\w./-]+)(:)(?=\s|$)/,
      '$1<span class="tok-k">$2</span>$3'
    );
    code = code.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tok-s">$1</span>');
    code = code.replace(/\b(true|false|null|Always|Never|OnFailure|IfNotPresent)\b/g, '<span class="tok-b">$1</span>');
    code = code.replace(/(:\s|^\s*-\s+)(\d+[\w%]*)(?=\s*$)/g, '$1<span class="tok-n">$2</span>');
  } else if (lang === "bash") {
    code = code.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tok-s">$1</span>');
    code = code.replace(/(\$\{[^}]+\}|\$\w+)/g, '<span class="tok-v">$1</span>');
    code = code.replace(/(^|\s)(--?[\w][\w-]*(?:=[^\s"']*)?)/g, '$1<span class="tok-f">$2</span>');
    code = code.replace(BASH_CMDS, '<span class="tok-k">$&</span>');
  }
  return code + comment;
}

function findCommentStart(line, lang) {
  if (lang !== "yaml" && lang !== "bash" && lang !== "basic") return -1;
  let inS = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    // dòng đã được escapeHtml nên nháy là &quot; / &#39;
    if (line.startsWith("&quot;", i)) { inS = inS === '"' ? null : inS === null ? '"' : inS; i += 5; continue; }
    if (line.startsWith("&#39;", i)) { inS = inS === "'" ? null : inS === null ? "'" : inS; i += 4; continue; }
    if (ch === "#" && !inS && (i === 0 || /\s/.test(line[i - 1]))) {
      if (lang === "bash" && i > 0 && line[i - 1] === "$") continue;
      return i;
    }
  }
  return -1;
}

function normalizeLang(lang) {
  const l = (lang || "").toLowerCase();
  if (["yaml", "yml"].includes(l)) return "yaml";
  if (["bash", "sh", "shell", "console", "zsh"].includes(l)) return "bash";
  if (["vim", "ini", "dockerfile", "conf", "properties", "text", "txt", ""].includes(l)) return "basic";
  return "plain";
}

export function highlightCode(raw, lang) {
  const norm = normalizeLang(lang);
  const escaped = escapeHtml(raw.replace(/\n$/, ""));
  if (norm === "plain") return escaped;
  return escaped
    .split("\n")
    .map((l) => highlightLine(l, norm))
    .join("\n");
}

export function codeBlockHtml(rawCode, lang) {
  const label = (lang || "code").toLowerCase();
  return (
    `<div class="codeblock" data-code="${escapeHtml(rawCode.replace(/\n$/, ""))}">` +
    `<div class="codeblock-head"><span>${escapeHtml(label)}</span>` +
    `<button class="codeblock-copy" type="button">Copy</button></div>` +
    `<pre><code>${highlightCode(rawCode, lang)}</code></pre></div>`
  );
}

// ---------------- Inline ----------------

function inline(text) {
  let s = escapeHtml(text);

  // Bảo vệ inline code trước khi xử lý các cú pháp khác.
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`);
    return `\x00${codes.length - 1}\x00`;
  });

  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, href) => {
    const ext = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${href}"${ext}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Cho phép riêng thẻ xuống dòng (hay dùng trong bảng của các bài blog).
  s = s.replace(/&lt;br\s*\/?&gt;/gi, "<br />");

  s = s.replace(/\x00(\d+)\x00/g, (_, i) => codes[+i]);
  return s;
}

// ---------------- Slug / TOC ----------------

function makeSlugger() {
  const used = new Map();
  return (text) => {
    let slug = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/[\s-]+/g, "-");
    if (!slug) slug = "section";
    const n = used.get(slug) || 0;
    used.set(slug, n + 1);
    return n === 0 ? slug : `${slug}-${n}`;
  };
}

// ---------------- Block parser ----------------

export function renderMarkdown(md, opts = {}) {
  const slug = opts.slugger || makeSlugger();
  const headings = [];
  const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const isTableSep = (l) =>
    l != null && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Fenced code
    const fence = line.match(/^```(\S*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // bỏ dòng đóng
      if (lang.toLowerCase() === "mermaid") {
        // Nguồn mermaid giữ trong <pre> (fallback khi chưa/không render được);
        // docs view sẽ nạp mermaid và thay bằng SVG.
        out.push(
          `<div class="mermaid-block"><pre class="mermaid-src">${escapeHtml(buf.join("\n"))}</pre></div>`
        );
      } else {
        out.push(codeBlockHtml(buf.join("\n"), lang));
      }
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      const level = h[1].length;
      const raw = h[2];
      const plain = raw.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
      const id = slug(plain);
      if (level >= 2 && level <= 3) headings.push({ id, text: plain, level });
      out.push(`<h${level} id="${id}">${inline(raw)}</h${level}>`);
      i++;
      continue;
    }

    // HR
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push("<hr />"); i++; continue; }

    // Blockquote
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      const innerHtml = renderMarkdown(buf.join("\n"), { slugger: slug }).html;
      out.push(`<blockquote>${innerHtml}</blockquote>`);
      continue;
    }

    // Table
    if (line.includes("|") && isTableSep(lines[i + 1])) {
      const parseRow = (l) =>
        l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      let html = '<div class="table-wrap"><table><thead><tr>';
      html += header.map((c) => `<th>${inline(c)}</th>`).join("");
      html += "</tr></thead><tbody>";
      for (const r of rows) {
        html += "<tr>" + header.map((_, k) => `<td>${inline(r[k] ?? "")}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table></div>";
      out.push(html);
      continue;
    }

    // List (có lồng nhau + task list)
    const listStart = line.match(/^(\s*)([-*+]|\d+[.)])\s+/);
    if (listStart) {
      const items = []; // {indent, ordered, text[]}
      while (i < lines.length) {
        const l = lines[i];
        const m = l.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (m && !/^\s*(?:-{3,}|\*{3,})\s*$/.test(l)) {
          items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: [m[3]] });
          i++;
        } else if (l.trim() && /^\s{2,}/.test(l) && items.length) {
          items[items.length - 1].text.push(l.trim()); // dòng nối tiếp của item
          i++;
        } else if (!l.trim()) {
          // dòng trống: còn item tiếp theo không?
          const next = lines[i + 1];
          if (next && /^(\s*)([-*+]|\d+[.)])\s+/.test(next)) { i++; continue; }
          break;
        } else break;
      }
      out.push(buildList(items, 0));
      continue;
    }

    // Paragraph
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|\s*>|\s*(?:[-*+]|\d+[.)])\s|\s*(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i]) &&
      !(lines[i].includes("|") && isTableSep(lines[i + 1]))
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }

  return { html: out.join("\n"), headings };
}

function buildList(items, start) {
  if (start >= items.length) return "";
  const baseIndent = items[start].indent;
  const ordered = items[start].ordered;
  let html = ordered ? "<ol>" : "<ul>";
  let k = start;
  while (k < items.length && items[k].indent >= baseIndent) {
    if (items[k].indent > baseIndent + 1) {
      // cấp con — tìm phạm vi và đệ quy
      const childStart = k;
      while (k < items.length && items[k].indent > baseIndent + 1) k++;
      html = html.replace(/<\/li>$/, buildList(items.slice(childStart, k), 0) + "</li>");
      continue;
    }
    let text = items[k].text.join(" ");
    const task = text.match(/^\[( |x|X)\]\s+(.*)$/);
    if (task) {
      const checked = task[1].toLowerCase() === "x";
      text = `<input type="checkbox" disabled${checked ? " checked" : ""} /> ${inline(task[2])}`;
      html += `<li class="task${checked ? " done" : ""}">${text}</li>`;
    } else {
      html += `<li>${inline(text)}</li>`;
    }
    k++;
  }
  html += ordered ? "</ol>" : "</ul>";
  return html;
}
