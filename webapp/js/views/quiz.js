// Trắc nghiệm luyện tập — phản hồi ngay sau mỗi câu, kèm giải thích.

import { h, pageHead, inlineMd, codeNode, shuffle, certBadge, domainBadge, diffBadge, toast } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { recordActivity } from "../lib/activity.js";
import { getQuestions, getDomains } from "../data/index.js";
import { FIELDS, moduleAllowed } from "../data/fields.js";
import { CERTS } from "../data/meta.js";
import { currentField } from "../lib/field.js";

const OPT_KEYS = ["A", "B", "C", "D"];

export function render(root) {
  renderSetup(root);
}

function renderSetup(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const questions = getQuestions(fieldKey);
  const page = h("div", { class: "page" });

  const setupDesc = moduleAllowed(fieldKey, "exam")
    ? `${questions.length} câu hỏi có giải thích chi tiết. Chế độ luyện tập: biết đúng/sai ngay sau mỗi câu — phù hợp để học; muốn mô phỏng áp lực thật hãy dùng Thi thử.`
    : `${questions.length} câu hỏi có giải thích chi tiết. Chế độ luyện tập: biết đúng/sai ngay sau mỗi câu — phù hợp để học.`;
  page.append(pageHead("✅ Trắc nghiệm", setupDesc));

  // Tầng lọc chứng chỉ chỉ có nghĩa với lĩnh vực Kubernetes.
  const certSel = new Set();
  const certRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  if (field.certFilter) {
    certSel.add("CKAD");
    for (const key of Object.keys(CERTS)) {
      const count = questions.filter((q) => q.cert === key).length;
      if (!count) continue;
      const chip = h("button", { class: `chip${certSel.has(key) ? " on" : ""}` }, `${key} (${count})`);
      chip.addEventListener("click", () => {
        if (certSel.has(key)) certSel.delete(key);
        else certSel.add(key);
        chip.classList.toggle("on", certSel.has(key));
        syncDomains();
      });
      certRow.append(chip);
    }
  }

  // Bộ lọc domain (phụ thuộc chứng chỉ đã chọn, nếu lĩnh vực có tầng đó)
  const domainSel = new Set();
  const domainRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  function syncDomains() {
    domainRow.innerHTML = "";
    domainSel.clear();
    const visible = getDomains(fieldKey).filter(([key, d]) =>
      (!field.certFilter || certSel.has(d.cert)) && questions.some((q) => q.domain === key));
    for (const [key, d] of visible) {
      domainSel.add(key);
      const count = questions.filter((q) => q.domain === key).length;
      const chip = h("button", { class: "chip on" }, `${d.short} (${count})`);
      chip.addEventListener("click", () => {
        if (domainSel.has(key)) domainSel.delete(key);
        else domainSel.add(key);
        chip.classList.toggle("on", domainSel.has(key));
      });
      domainRow.append(chip);
    }
  }
  syncDomains();

  const countSel = h("select", { class: "select", style: "max-width:200px" },
    h("option", { value: "10" }, "10 câu"),
    h("option", { value: "20", selected: true }, "20 câu"),
    h("option", { value: "40" }, "40 câu"),
    h("option", { value: "all" }, "Toàn bộ"));

  let onlyWeak = false;
  const weakChip = h("button", { class: "chip" }, "🎯 Ưu tiên câu từng sai / chưa gặp");
  weakChip.addEventListener("click", () => {
    onlyWeak = !onlyWeak;
    weakChip.classList.toggle("on", onlyWeak);
  });

  const startBtn = h("button", { class: "btn btn-primary btn-lg" }, "Bắt đầu");
  startBtn.addEventListener("click", () => {
    let pool = questions.filter((q) =>
      (!field.certFilter || certSel.has(q.cert)) && domainSel.has(q.domain));
    if (!pool.length) { toast("Không có câu hỏi nào khớp bộ lọc.", "error"); return; }
    if (onlyWeak) {
      const stats = store.get("quiz.stats", {});
      const weight = (q) => {
        const s = stats[q.id];
        if (!s || !s.seen) return 0;          // chưa gặp — ưu tiên nhất
        if (s.correct === 0) return 1;         // từng sai
        return 2;                              // đã đúng
      };
      pool = pool.slice().sort((a, b) => weight(a) - weight(b));
      const n = countSel.value === "all" ? pool.length : Math.min(+countSel.value, pool.length);
      pool = shuffle(pool.slice(0, Math.max(n, Math.min(pool.length, n * 2)))).slice(0, n);
      return renderSession(root, pool);
    }
    const n = countSel.value === "all" ? pool.length : Math.min(+countSel.value, pool.length);
    renderSession(root, shuffle(pool).slice(0, n));
  });

  page.append(
    h("div", { class: "card" },
      field.certFilter ? h("strong", {}, "Chứng chỉ") : null,
      field.certFilter ? certRow : null,
      h("strong", {}, "Domain"), domainRow,
      h("div", { class: "flex flex-wrap", style: "margin-bottom:14px" }, countSel, weakChip),
      startBtn)
  );

  root.append(page);
}

function renderSession(root, list) {
  root.innerHTML = "";
  const page = h("div", { class: "page" });
  root.append(page);

  const stats = store.get("quiz.stats", {});
  let idx = 0;
  const results = []; // { q, chosen, ok }

  const progressText = h("span", { class: "muted small" });
  const progressBar = h("span", {});
  const body = h("div", {});

  page.append(
    h("div", { class: "flex spread", style: "margin-bottom:6px" },
      h("a", {
        class: "btn btn-ghost btn-sm", href: "#/quiz",
        onclick: (e) => { e.preventDefault(); root.innerHTML = ""; renderSetup(root); },
      }, "← Thoát"),
      progressText),
    h("div", { class: "progress", style: "margin-bottom:16px" }, progressBar),
    body
  );

  function showQuestion() {
    const q = list[idx];
    progressText.textContent = `Câu ${idx + 1}/${list.length}`;
    progressBar.style.width = `${(idx / list.length) * 100}%`;
    body.innerHTML = "";

    const card = h("div", { class: "card" },
      h("div", { class: "flex flex-wrap", style: "margin-bottom:10px" },
        q.cert ? certBadge(q.cert) : null,
        domainBadge(q.domain), diffBadge(q.difficulty)),
      h("div", { style: "font-size:16px;font-weight:600", html: inlineMd(q.question) }));

    const codeEl = codeNode(q.code);
    if (codeEl) card.append(codeEl);

    const optWrap = h("div", { style: "margin-top:12px" });
    const buttons = [];
    q.options.forEach((opt, i) => {
      const btn = h("button", { class: "q-option" },
        h("span", { class: "opt-key" }, OPT_KEYS[i]),
        h("span", { html: inlineMd(opt) }));
      btn.addEventListener("click", () => answer(i));
      buttons.push(btn);
      optWrap.append(btn);
    });
    card.append(optWrap);
    body.append(card);

    function answer(chosen) {
      const ok = chosen === q.answer;
      results.push({ q, chosen, ok });

      const s = stats[q.id] || { seen: 0, correct: 0 };
      s.seen++;
      if (ok) s.correct++;
      stats[q.id] = s;
      store.set("quiz.stats", stats);
      recordActivity();

      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === q.answer) b.classList.add("correct");
        else if (i === chosen) b.classList.add("wrong");
      });

      card.append(
        h("div", { class: `explain-box ${ok ? "ok" : "bad"}` },
          h("div", { style: "font-weight:700;margin-bottom:4px" },
            ok ? "✅ Chính xác!" : `❌ Chưa đúng — đáp án: ${OPT_KEYS[q.answer]}`),
          h("div", { html: inlineMd(q.explanation) })),
        h("div", { style: "margin-top:14px" },
          h("button", { class: "btn btn-primary", onclick: nextQ },
            idx + 1 < list.length ? "Câu tiếp →" : "Xem kết quả"))
      );
      card.querySelector(".btn-primary").focus();
    }
  }

  function nextQ() {
    idx++;
    if (idx >= list.length) return showSummary();
    showQuestion();
  }

  function showSummary() {
    const correct = results.filter((r) => r.ok).length;
    const pct = Math.round((correct / results.length) * 100);
    body.innerHTML = "";
    progressBar.style.width = "100%";
    progressText.textContent = "Hoàn thành";

    const wrong = results.filter((r) => !r.ok);
    body.append(
      h("div", { class: "card center" },
        h("div", { class: "stat-num", style: `color:${pct >= 66 ? "var(--green)" : "var(--red)"};font-size:42px` }, `${pct}%`),
        h("div", { class: "stat-label" }, `${correct}/${results.length} câu đúng`),
        h("div", { class: "flex", style: "justify-content:center;margin-top:14px" },
          h("button", { class: "btn btn-primary", onclick: () => { root.innerHTML = ""; renderSetup(root); } }, "Lượt mới"),
          h("a", { class: "btn", href: "#/exam" }, "Thi thử có bấm giờ →")))
    );

    if (wrong.length) {
      body.append(h("h2", { style: "font-size:18px;margin:22px 0 10px" }, `Ôn lại ${wrong.length} câu sai`));
      for (const r of wrong) {
        const card = h("div", { class: "card", style: "margin-bottom:12px" },
          h("div", { class: "flex flex-wrap", style: "margin-bottom:8px" },
            r.q.cert ? certBadge(r.q.cert) : null,
            domainBadge(r.q.domain)),
          h("div", { style: "font-weight:600", html: inlineMd(r.q.question) }));
        const codeEl = codeNode(r.q.code);
        if (codeEl) card.append(codeEl);
        card.append(
          h("p", { class: "small", style: "margin:8px 0 2px" },
            h("span", { style: "color:var(--red)" }, `✗ Bạn chọn: ${OPT_KEYS[r.chosen]}. `),
            h("span", { style: "color:var(--green)", html: `✓ Đáp án: ${OPT_KEYS[r.q.answer]} — ` + inlineMd(r.q.options[r.q.answer]) })),
          h("div", { class: "explain-box", html: inlineMd(r.q.explanation) }));
        body.append(card);
      }
    }
    window.scrollTo({ top: 0 });
  }

  showQuestion();
}
