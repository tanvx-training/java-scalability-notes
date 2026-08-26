// Flashcards với spaced repetition rút gọn.
// Mỗi thẻ lưu { reps, interval (ngày), due (epoch ms) } trong localStorage.

import { h, pageHead, inlineMd, codeNode, shuffle } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getFlashcards, getTopics } from "../data/index.js";
import { currentField } from "../lib/field.js";
import { TOPICS } from "../data/meta.js";

const DAY = 24 * 60 * 60 * 1000;

let keyHandler = null;

export function cleanup() {
  if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
}

function grade(srs, cardId, g) {
  const e = srs[cardId] || { reps: 0, interval: 0, due: 0 };
  if (g === "again") {
    e.reps = 0;
    e.interval = 0;
    e.due = Date.now(); // ôn lại ngay trong phiên
  } else {
    if (g === "hard") e.interval = Math.max(1, Math.round(e.interval * 1.2));
    if (g === "good") e.interval = e.interval ? Math.round(e.interval * 2.5) : 1;
    if (g === "easy") e.interval = e.interval ? Math.round(e.interval * 4) : 3;
    e.reps += 1;
    e.due = Date.now() + e.interval * DAY;
  }
  srs[cardId] = e;
  store.set("flash.srs", srs);
  return e;
}

export function render(root) {
  renderSetup(root);
}

function renderSetup(root) {
  cleanup();
  const fieldKey = currentField();
  const flashcards = getFlashcards(fieldKey);
  const page = h("div", { class: "page" });
  const srs = store.get("flash.srs", {});
  const now = Date.now();

  const due = flashcards.filter((c) => srs[c.id] && srs[c.id].due <= now);
  const fresh = flashcards.filter((c) => !srs[c.id]);

  page.append(pageHead(
    "🃏 Flashcards",
    `Ôn tập ${flashcards.length} thẻ theo phương pháp lặp lại ngắt quãng. Chấm "Lại/Khó/Tốt/Dễ" sau mỗi thẻ — thẻ khó sẽ quay lại sớm hơn.`
  ));

  page.append(
    h("div", { class: "grid grid-3", style: "margin-bottom:18px" },
      h("div", { class: "card center" },
        h("div", { class: "stat-num", style: "color:var(--red)" }, String(due.length)),
        h("div", { class: "stat-label" }, "Đến hạn ôn")),
      h("div", { class: "card center" },
        h("div", { class: "stat-num", style: "color:var(--accent-text)" }, String(fresh.length)),
        h("div", { class: "stat-label" }, "Thẻ mới")),
      h("div", { class: "card center" },
        h("div", { class: "stat-num" }, String(flashcards.length - fresh.length)),
        h("div", { class: "stat-label" }, "Đã học")))
  );

  // Chọn chủ đề
  const topics = getTopics(fieldKey);
  const selected = new Set(topics.map(([k]) => k));
  const chipRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  const chips = new Map();
  for (const [key, t] of topics) {
    const count = flashcards.filter((c) => c.topic === key).length;
    if (!count) continue;
    const chip = h("button", { class: "chip on" }, `${t.label} (${count})`);
    chip.addEventListener("click", () => {
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      chip.classList.toggle("on", selected.has(key));
    });
    chips.set(key, chip);
    chipRow.append(chip);
  }

  let mode = "smart";
  const modeSmart = h("button", { class: "chip on" }, "🧠 Đến hạn + thẻ mới");
  const modeAll = h("button", { class: "chip" }, "🔀 Tất cả (xáo trộn)");
  modeSmart.addEventListener("click", () => { mode = "smart"; modeSmart.classList.add("on"); modeAll.classList.remove("on"); });
  modeAll.addEventListener("click", () => { mode = "all"; modeAll.classList.add("on"); modeSmart.classList.remove("on"); });

  const countSel = h("select", { class: "select", style: "max-width:200px" },
    h("option", { value: "10" }, "10 thẻ"),
    h("option", { value: "20", selected: true }, "20 thẻ"),
    h("option", { value: "40" }, "40 thẻ"),
    h("option", { value: "all" }, "Toàn bộ"));

  const startBtn = h("button", { class: "btn btn-primary btn-lg" }, "Bắt đầu ôn tập");
  startBtn.addEventListener("click", () => {
    const pool = flashcards.filter((c) => selected.has(c.topic));
    if (!pool.length) { alert("Hãy chọn ít nhất một chủ đề."); return; }
    let session;
    if (mode === "smart") {
      const now2 = Date.now();
      const dueCards = shuffle(pool.filter((c) => srs[c.id] && srs[c.id].due <= now2));
      const freshCards = shuffle(pool.filter((c) => !srs[c.id]));
      const rest = shuffle(pool.filter((c) => srs[c.id] && srs[c.id].due > now2));
      session = [...dueCards, ...freshCards, ...rest];
    } else {
      session = shuffle(pool);
    }
    const n = countSel.value === "all" ? session.length : Math.min(+countSel.value, session.length);
    renderSession(root, session.slice(0, n));
  });

  page.append(
    h("div", { class: "card" },
      h("strong", {}, "Chủ đề"),
      chipRow,
      h("strong", {}, "Chế độ"),
      h("div", { class: "chip-row", style: "margin:10px 0 16px" }, modeSmart, modeAll),
      h("div", { class: "flex flex-wrap" }, countSel, startBtn),
      h("p", { class: "faint", style: "margin-bottom:0" },
        "Phím tắt: ", h("span", { class: "kbd" }, "Space"), " lật thẻ · ",
        h("span", { class: "kbd" }, "1"), "–", h("span", { class: "kbd" }, "4"), " chấm điểm"))
  );

  root.append(page);
}

function renderSession(root, cards) {
  cleanup();
  root.innerHTML = "";
  const page = h("div", { class: "page" });
  root.append(page);

  const srs = store.get("flash.srs", {});
  const queue = cards.slice();
  const counts = { again: 0, hard: 0, good: 0, easy: 0 };
  let total = queue.length;
  let done = 0;
  let flipped = false;

  const progressText = h("span", { class: "muted small" });
  const progressBar = h("span", {});
  const stage = h("div", { class: "flashcard-stage" });
  const gradeRow = h("div", { class: "grade-row", style: "visibility:hidden" });

  function gradeBtns(card) {
    gradeRow.innerHTML = "";
    const defs = [
      ["again", "Lại", "ôn lại ngay", "grade-again", "1"],
      ["hard", "Khó", "nhớ mơ hồ", "grade-hard", "2"],
      ["good", "Tốt", "nhớ được", "grade-good", "3"],
      ["easy", "Dễ", "quá dễ", "grade-easy", "4"],
    ];
    for (const [g, label, hint, cls] of defs) {
      const btn = h("button", { class: `grade-btn ${cls}` },
        label, h("small", {}, hint));
      btn.addEventListener("click", () => doGrade(card, g));
      gradeRow.append(btn);
    }
  }

  function doGrade(card, g) {
    counts[g]++;
    grade(srs, card.id, g);
    if (g === "again") {
      queue.push(card); // quay lại cuối phiên
      total++;
    }
    done++;
    next();
  }

  function next() {
    queue.shift();
    if (!queue.length) return renderEnd();
    showCard(queue[0]);
  }

  function showCard(card) {
    flipped = false;
    progressText.textContent = `Thẻ ${done + 1}/${total}`;
    progressBar.style.width = `${(done / total) * 100}%`;
    gradeRow.style.visibility = "hidden";
    stage.innerHTML = "";

    const topic = TOPICS[card.topic];
    const front = h("div", { class: "flashcard-face" },
      h("span", { class: "badge badge-blue" }, topic ? topic.label : card.topic),
      h("div", { class: "flashcard-q", html: inlineMd(card.front) }),
      h("div", { class: "flashcard-hintline" }, "Nhấn Space hoặc click để lật thẻ"));
    const backBody = h("div", { class: "flashcard-a", html: inlineMd(card.back) });
    const back = h("div", { class: "flashcard-face back" },
      h("div", { class: "faint", html: inlineMd(card.front) }),
      h("hr", { class: "sep", style: "margin:8px 0" }),
      backBody);
    const codeEl = codeNode(card.code);
    if (codeEl) back.append(codeEl);

    const cardEl = h("div", { class: "flashcard" }, front, back);
    cardEl.addEventListener("click", (e) => {
      if (e.target.closest(".codeblock-copy")) return;
      flip(cardEl);
    });
    stage.append(cardEl);
  }

  function flip(cardEl) {
    if (flipped) return;
    flipped = true;
    (cardEl || stage.querySelector(".flashcard")).classList.add("flipped");
    gradeRow.style.visibility = "visible";
  }

  function renderEnd() {
    cleanup();
    page.innerHTML = "";
    page.append(
      pageHead("🎉 Hoàn thành phiên ôn tập"),
      h("div", { class: "grid grid-4" },
        endStat(counts.again, "Lại", "var(--red)"),
        endStat(counts.hard, "Khó", "var(--amber)"),
        endStat(counts.good, "Tốt", "var(--accent-text)"),
        endStat(counts.easy, "Dễ", "var(--green)")),
      h("div", { class: "flex", style: "margin-top:18px" },
        h("button", {
          class: "btn btn-primary",
          onclick: () => { root.innerHTML = ""; renderSetup(root); },
        }, "Phiên mới"),
        h("a", { class: "btn", href: "#/" }, "Về bảng điều khiển"))
    );
  }

  function endStat(n, label, color) {
    return h("div", { class: "card center" },
      h("div", { class: "stat-num", style: `color:${color}` }, String(n)),
      h("div", { class: "stat-label" }, label));
  }

  keyHandler = (e) => {
    if (e.target instanceof Element && e.target.matches("input, select, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); flip(); }
    if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
      e.preventDefault();
      const g = { 1: "again", 2: "hard", 3: "good", 4: "easy" }[e.key];
      doGrade(queue[0], g);
    }
  };
  document.addEventListener("keydown", keyHandler);

  page.append(
    h("div", { class: "flex spread", style: "margin-bottom:6px" },
      h("a", { class: "btn btn-ghost btn-sm", href: "#/flashcards", onclick: (e) => { e.preventDefault(); root.innerHTML = ""; renderSetup(root); } }, "← Thoát phiên"),
      progressText),
    h("div", { class: "progress" }, progressBar),
    stage,
    gradeRow
  );

  showCard(queue[0]);
}
