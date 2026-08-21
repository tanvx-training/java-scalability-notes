// Tra cứu lệnh kubectl — lọc tức thì theo từ khóa và nhóm lệnh.

import { h, pageHead } from "../lib/ui.js";
import { escapeHtml } from "../lib/markdown.js";
import { commands } from "../data/commands.js";
import { COMMAND_CATEGORIES } from "../data/meta.js";

let keyHandler = null;

export function cleanup() {
  if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
}

export function render(root) {
  const page = h("div", { class: "page" });
  page.append(pageHead(
    "⌨️ Tra cứu kubectl",
    `${commands.length} lệnh hay dùng trong phòng thi. Gõ để lọc tức thì — nhấn "/" để nhảy vào ô tìm kiếm.`
  ));

  const input = h("input", {
    class: "input",
    type: "search",
    placeholder: "Tìm lệnh… (vd: rollout, secret, expose, jsonpath)",
    autocomplete: "off",
  });

  let activeCat = null;
  const chips = h("div", { class: "chip-row", style: "margin:12px 0 18px" });
  const allChip = h("button", { class: "chip on" }, "Tất cả");
  allChip.addEventListener("click", () => { activeCat = null; syncChips(); refresh(); });
  chips.append(allChip);
  const catChips = new Map();
  for (const [key, cat] of Object.entries(COMMAND_CATEGORIES)) {
    const chip = h("button", { class: "chip" }, cat.label);
    chip.addEventListener("click", () => {
      activeCat = activeCat === key ? null : key;
      syncChips();
      refresh();
    });
    catChips.set(key, chip);
    chips.append(chip);
  }
  function syncChips() {
    allChip.classList.toggle("on", activeCat === null);
    catChips.forEach((chip, key) => chip.classList.toggle("on", key === activeCat));
  }

  const list = h("div", {});
  const counter = h("p", { class: "faint" });

  function refresh() {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const matched = commands.filter((c) => {
      if (activeCat && c.category !== activeCat) return false;
      if (!terms.length) return true;
      const hay = `${c.desc} ${c.cmd} ${(c.tags || []).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });

    counter.textContent = `${matched.length} lệnh`;
    list.innerHTML = "";
    for (const c of matched) {
      const cat = COMMAND_CATEGORIES[c.category];
      const codeEl = h("code", { html: escapeHtml(c.cmd) });
      const copyBtn = h("button", { class: "icon-btn", title: "Copy lệnh" }, "📋");
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(c.cmd);
          copyBtn.textContent = "✓";
        } catch { copyBtn.textContent = "✗"; }
        setTimeout(() => (copyBtn.textContent = "📋"), 1200);
      });
      list.append(
        h("div", { class: "cmd-row" },
          h("div", { class: "cmd-desc" },
            cat ? h("span", { class: "badge badge-blue" }, cat.label) : null,
            h("span", {}, c.desc)),
          h("div", { class: "cmd-line" }, codeEl, copyBtn))
      );
    }
    if (!matched.length) {
      list.append(h("div", { class: "empty" },
        h("div", { class: "big" }, "🔍"),
        h("p", {}, "Không tìm thấy lệnh phù hợp.")));
    }
  }

  input.addEventListener("input", refresh);

  cleanup();
  keyHandler = (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  };
  document.addEventListener("keydown", keyHandler);

  page.append(input, chips, counter, list);
  root.append(page);
  refresh();
}
