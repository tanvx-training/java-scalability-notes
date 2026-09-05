// Thi thử — mô phỏng áp lực phòng thi: bấm giờ, đánh dấu câu, không xem đáp án
// cho tới khi nộp bài. Chấm điểm tổng + theo domain, lưu lịch sử.

import { h, pageHead, inlineMd, codeNode, shuffle, certBadge, domainBadge, fmtClock, fmtDate } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { questions } from "../data/kubernetes/questions.js";
import { DOMAINS } from "../data/meta.js";

const OPT_KEYS = ["A", "B", "C", "D"];
const PASS_PCT = 66;

let timerId = null;

export function cleanup() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

// Lấy mẫu câu hỏi CKAD theo đúng tỷ trọng domain của kỳ thi.
function sampleWeighted(total) {
  const ckadDomains = Object.entries(DOMAINS).filter(([, d]) => d.cert === "CKAD");
  const picked = [];
  for (const [key, d] of ckadDomains) {
    const pool = shuffle(questions.filter((q) => q.domain === key));
    picked.push(...pool.slice(0, Math.round((d.weight / 100) * total)));
  }
  // Bù/cắt cho đủ số câu yêu cầu.
  if (picked.length < total) {
    const have = new Set(picked.map((q) => q.id));
    const rest = shuffle(questions.filter((q) => q.cert === "CKAD" && !have.has(q.id)));
    picked.push(...rest.slice(0, total - picked.length));
  }
  return shuffle(picked.slice(0, total));
}

export function render(root) {
  renderSetup(root);
}

function renderSetup(root) {
  cleanup();
  const page = h("div", { class: "page" });

  page.append(pageHead(
    "⏱️ Thi thử",
    `Không có phản hồi giữa chừng — nộp bài mới biết kết quả, như thi thật. Điểm đậu tham chiếu CKAD: ${PASS_PCT}%. Câu hỏi CKAD được lấy mẫu theo đúng tỷ trọng domain.`
  ));

  const presets = [
    { icon: "🎯", name: "CKAD Mock chuẩn", desc: "30 câu · 45 phút — theo tỷ trọng domain thi thật", count: 30, minutes: 45 },
    { icon: "⚡", name: "Kiểm tra nhanh", desc: "15 câu · 20 phút — ôn nhanh giữa buổi học", count: 15, minutes: 20 },
    { icon: "🔥", name: "Full luyện sức bền", desc: "60 câu · 90 phút — kiểm tra toàn diện", count: 60, minutes: 90 },
  ];

  const grid = h("div", { class: "grid grid-3" });
  for (const p of presets) {
    const card = h("button", { class: "card card-link", style: "text-align:left;cursor:pointer" },
      h("div", { style: "font-size:26px" }, p.icon),
      h("div", { class: "lab-title", style: "margin-top:6px" }, p.name),
      h("div", { class: "muted small" }, p.desc));
    card.addEventListener("click", () => startExam(root, p.count, p.minutes));
    grid.append(card);
  }
  page.append(grid);

  // Tùy chỉnh
  const countInput = h("input", { class: "input", type: "number", min: "5", max: "110", value: "20", style: "max-width:110px" });
  const minInput = h("input", { class: "input", type: "number", min: "5", max: "180", value: "30", style: "max-width:110px" });
  page.append(
    h("div", { class: "card", style: "margin-top:14px" },
      h("strong", {}, "Tùy chỉnh"),
      h("div", { class: "flex flex-wrap", style: "margin-top:10px" },
        h("span", { class: "muted small" }, "Số câu"), countInput,
        h("span", { class: "muted small" }, "Phút"), minInput,
        h("button", {
          class: "btn btn-primary",
          onclick: () => startExam(root, Math.max(5, +countInput.value || 20), Math.max(5, +minInput.value || 30)),
        }, "Bắt đầu")))
  );

  // Lịch sử
  const hist = store.get("exam.history", []);
  if (hist.length) {
    const rows = hist.slice(-8).reverse().map((e) =>
      h("tr", {},
        h("td", {}, fmtDate(e.date)),
        h("td", {}, `${e.correct}/${e.total}`),
        h("td", { style: `font-weight:700;color:${e.pass ? "var(--green)" : "var(--red)"}` }, `${e.pct}%`),
        h("td", {}, e.pass ? "✅ Đậu" : "❌ Chưa đậu")));
    page.append(
      h("div", { class: "card", style: "margin-top:14px" },
        h("div", { class: "flex spread" },
          h("strong", {}, "Lịch sử thi thử"),
          h("button", {
            class: "btn btn-ghost btn-sm",
            onclick: () => { if (confirm("Xóa lịch sử thi thử?")) { store.set("exam.history", []); root.innerHTML = ""; renderSetup(root); } },
          }, "Xóa lịch sử")),
        h("div", { class: "table-wrap" },
          h("table", { class: "table" },
            h("thead", {}, h("tr", {}, h("th", {}, "Thời điểm"), h("th", {}, "Đúng"), h("th", {}, "Điểm"), h("th", {}, "Kết quả"))),
            h("tbody", {}, rows))))
    );
  }

  root.append(page);
}

function startExam(root, count, minutes) {
  cleanup();
  root.innerHTML = "";
  const page = h("div", { class: "page" });
  root.append(page);

  const list = sampleWeighted(count);
  const answers = new Array(list.length).fill(null);
  const flagged = new Set();
  let idx = 0;
  let remaining = minutes * 60;
  let submitted = false;

  const timerEl = h("span", { class: "exam-timer" }, fmtClock(remaining));
  const answeredEl = h("span", { class: "muted small" });
  const submitBtn = h("button", { class: "btn btn-primary btn-sm" }, "Nộp bài");
  const palette = h("div", { class: "palette", style: "margin-bottom:16px" });
  const body = h("div", {});

  page.append(
    h("div", { class: "exam-topbar" },
      timerEl,
      h("div", { class: "grow" }, answeredEl),
      submitBtn),
    palette,
    body
  );

  const palBtns = list.map((_, i) => {
    const b = h("button", {}, String(i + 1));
    b.addEventListener("click", () => { idx = i; showQuestion(); });
    palette.append(b);
    return b;
  });

  function syncPalette() {
    palBtns.forEach((b, i) => {
      b.classList.toggle("answered", answers[i] != null);
      b.classList.toggle("current", i === idx);
      b.classList.toggle("flagged", flagged.has(i));
    });
    const done = answers.filter((a) => a != null).length;
    answeredEl.textContent = `Đã trả lời ${done}/${list.length}`;
  }

  timerId = setInterval(() => {
    remaining--;
    timerEl.textContent = fmtClock(Math.max(0, remaining));
    if (remaining <= 120) timerEl.classList.add("low");
    if (remaining <= 0) {
      submit(true);
    }
  }, 1000);

  submitBtn.addEventListener("click", () => {
    const left = answers.filter((a) => a == null).length;
    if (left > 0 && !confirm(`Còn ${left} câu chưa trả lời. Nộp bài luôn?`)) return;
    submit(false);
  });

  function showQuestion() {
    const q = list[idx];
    body.innerHTML = "";

    const flagBtn = h("button", { class: `chip${flagged.has(idx) ? " on" : ""}` }, "⚑ Đánh dấu");
    flagBtn.addEventListener("click", () => {
      if (flagged.has(idx)) flagged.delete(idx);
      else flagged.add(idx);
      flagBtn.classList.toggle("on", flagged.has(idx));
      syncPalette();
    });

    const card = h("div", { class: "card" },
      h("div", { class: "flex spread flex-wrap", style: "margin-bottom:10px" },
        h("div", { class: "flex flex-wrap" },
          h("strong", {}, `Câu ${idx + 1}/${list.length}`),
          certBadge(q.cert), domainBadge(q.domain)),
        flagBtn),
      h("div", { style: "font-size:16px;font-weight:600", html: inlineMd(q.question) }));

    const codeEl = codeNode(q.code);
    if (codeEl) card.append(codeEl);

    const optWrap = h("div", { style: "margin-top:12px" });
    q.options.forEach((opt, i) => {
      const btn = h("button", { class: `q-option${answers[idx] === i ? " selected" : ""}` },
        h("span", { class: "opt-key" }, OPT_KEYS[i]),
        h("span", { html: inlineMd(opt) }));
      btn.addEventListener("click", () => {
        answers[idx] = answers[idx] === i ? null : i;
        showQuestion();
      });
      optWrap.append(btn);
    });
    card.append(optWrap);

    card.append(
      h("div", { class: "flex spread", style: "margin-top:16px" },
        h("button", { class: "btn", disabled: idx === 0, onclick: () => { idx--; showQuestion(); } }, "← Câu trước"),
        h("button", { class: "btn", disabled: idx === list.length - 1, onclick: () => { idx++; showQuestion(); } }, "Câu sau →"))
    );

    body.append(card);
    syncPalette();
  }

  function submit(auto) {
    if (submitted) return;
    submitted = true;
    cleanup();

    const results = list.map((q, i) => ({ q, chosen: answers[i], ok: answers[i] === q.answer }));
    const correct = results.filter((r) => r.ok).length;
    const pct = Math.round((correct / results.length) * 100);
    const pass = pct >= PASS_PCT;

    // Thống kê theo domain
    const byDomain = {};
    for (const r of results) {
      const d = (byDomain[r.q.domain] ||= { total: 0, correct: 0 });
      d.total++;
      if (r.ok) d.correct++;
    }

    const hist = store.get("exam.history", []);
    hist.push({ date: Date.now(), total: results.length, correct, pct, pass, byDomain });
    store.set("exam.history", hist);

    renderResult(page, { results, correct, pct, pass, byDomain, auto, root });
  }

  showQuestion();
}

function renderResult(page, { results, correct, pct, pass, byDomain, auto, root }) {
  page.innerHTML = "";

  const color = pass ? "var(--green)" : "var(--red)";
  const ring = h("div", {
    class: "score-ring",
    style: `background:conic-gradient(${color} ${pct * 3.6}deg, var(--bg-soft) 0deg)`,
  }, h("div", { class: "inner" },
    h("div", { style: `font-size:30px;font-weight:800;color:${color}` }, `${pct}%`),
    h("div", { class: "faint" }, `${correct}/${results.length} đúng`)));

  page.append(
    pageHead(auto ? "⏰ Hết giờ — bài đã tự nộp" : "📊 Kết quả thi thử"),
    h("div", { class: "card center" },
      ring,
      h("div", { style: `margin-top:12px;font-weight:800;font-size:18px;color:${color}` },
        pass ? "✅ ĐẬU (≥ 66%)" : "❌ CHƯA ĐẬU (cần ≥ 66%)"),
      h("div", { class: "flex", style: "justify-content:center;margin-top:14px" },
        h("button", { class: "btn btn-primary", onclick: () => { root.innerHTML = ""; renderSetup(root); } }, "Thi lại"),
        h("a", { class: "btn", href: "#/quiz" }, "Luyện từng domain")))
  );

  // Phân tích theo domain
  const domCard = h("div", { class: "card", style: "margin-top:14px" },
    h("strong", {}, "Kết quả theo domain"));
  for (const [key, d] of Object.entries(byDomain)) {
    const info = DOMAINS[key];
    const p = Math.round((d.correct / d.total) * 100);
    domCard.append(
      h("div", { style: "margin-top:10px" },
        h("div", { class: "flex spread small" },
          h("span", { class: "muted" }, info ? info.label : key),
          h("span", { style: "font-weight:700" }, `${d.correct}/${d.total} · ${p}%`)),
        h("div", { class: `progress ${p >= 66 ? "green" : p >= 40 ? "amber" : "red"}` },
          h("span", { style: `width:${p}%` })))
    );
  }
  page.append(domCard);

  // Review từng câu sai
  const wrong = results.filter((r) => !r.ok);
  if (wrong.length) {
    page.append(h("h2", { style: "font-size:18px;margin:22px 0 10px" }, `Review ${wrong.length} câu sai / bỏ trống`));
    for (const r of wrong) {
      const card = h("div", { class: "card", style: "margin-bottom:12px" },
        h("div", { class: "flex flex-wrap", style: "margin-bottom:8px" },
          certBadge(r.q.cert), domainBadge(r.q.domain)),
        h("div", { style: "font-weight:600", html: inlineMd(r.q.question) }));
      const codeEl = codeNode(r.q.code);
      if (codeEl) card.append(codeEl);
      card.append(
        h("p", { class: "small", style: "margin:8px 0 2px" },
          h("span", { style: "color:var(--red)" },
            r.chosen == null ? "— Bỏ trống. " : `✗ Bạn chọn: ${OPT_KEYS[r.chosen]}. `),
          h("span", { style: "color:var(--green)", html: `✓ Đáp án: ${OPT_KEYS[r.q.answer]} — ` + inlineMd(r.q.options[r.q.answer]) })),
        h("div", { class: "explain-box", html: inlineMd(r.q.explanation) }));
      page.append(card);
    }
  }
  window.scrollTo({ top: 0 });
}
