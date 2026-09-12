// Câu hỏi phỏng vấn — tự luận có đáp án mẫu và rubric, phân theo 4 cấp năng lực.
//
// Khác trắc nghiệm ở TRỤC CHẤM ĐIỂM: quiz so `chosen` với `answer` rồi tự kết
// luận đúng/sai; ở đây không có đáp án máy so được, người học tự đối chiếu câu
// trả lời của mình với rubric `mustCover` rồi tự chấm ba mức. Vì vậy có view
// riêng thay vì nhánh thứ hai trong views/quiz.js — cùng lý do views/tracker.js
// tách khỏi views/roadmap.js.
//
// Phiên chạy hai pha có chủ đích: pha trả lời KHÔNG hiện bất cứ thứ gì thuộc
// đáp án. Thấy trước rubric là hỏng phép đo — người đọc sẽ nhận ra ý thay vì
// tự sản sinh ra nó, đúng thứ khác biệt giữa "đọc hiểu" và "nói được".

import { h, pageHead, inlineMd, codeNode, shuffle, toast, emptyState } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { recordActivity } from "../lib/activity.js";
import { getInterviews, allDocs } from "../data/index.js";
import { INTERVIEW_TOPICS } from "../data/meta.js";
import { docLabel } from "../data/labels.js";
import { currentField } from "../lib/field.js";

// Giữ ĐÚNG nhãn của ma trận năng lực (views/tracker.js) — một từ vựng cho cả app.
const LEVELS = [
  { n: 1, label: "Hiểu lý thuyết",         color: "blue"  },
  { n: 2, label: "Thực thi mã nguồn",      color: "teal"  },
  { n: 3, label: "Phân tích đánh đổi",     color: "amber" },
  { n: 4, label: "Thiết kế & xử lý sự cố", color: "red"   },
];

const GRADES = [
  { v: 0, cls: "grade-again", label: "❌ Chưa đạt",     hint: "thiếu ý cốt lõi" },
  { v: 1, cls: "grade-hard",  label: "🟡 Đạt một phần", hint: "đúng hướng, còn hổng" },
  { v: 2, cls: "grade-good",  label: "✅ Đạt",          hint: "nói được trọn ý" },
];

const levelOf = (n) => LEVELS.find((l) => l.n === n) ?? LEVELS[0];
const levelBadge = (n) =>
  h("span", { class: `badge badge-${levelOf(n).color}` }, `L${n} · ${levelOf(n).label}`);

const refChipRow = (refs) =>
  h("div", { class: "chip-row", style: "margin-top:10px" },
    refs.map((id) => {
      const d = allDocs.find((x) => x.id === id);
      return h("a", { class: "chip", href: `#/docs/${id}` }, d ? docLabel(d) : id);
    }));

export function render(root) {
  renderSetup(root);
}

// ---------- Màn cài đặt phiên ----------

function renderSetup(root) {
  const fieldKey = currentField();
  const bank = getInterviews(fieldKey);
  const page = h("div", { class: "page" });

  if (!bank.length) {
    page.append(
      pageHead("🎤 Câu hỏi phỏng vấn", "Lĩnh vực này chưa có ngân hàng câu hỏi phỏng vấn."),
      emptyState("🎤", "Chưa có câu hỏi", "Ngân hàng câu hỏi phỏng vấn cho lĩnh vực này chưa được viết."));
    root.append(page);
    return;
  }

  page.append(pageHead("🎤 Câu hỏi phỏng vấn",
    `${bank.length} câu tự luận có đáp án mẫu và rubric, phân theo 4 cấp năng lực. ` +
    "Trả lời thành lời trước, rồi mới lật đáp án và tự chấm — đọc hiểu và nói ra được là hai việc khác nhau."));

  // Lọc cấp độ
  const levelSel = new Set(LEVELS.map((l) => l.n));
  const levelRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  for (const lv of LEVELS) {
    const count = bank.filter((q) => q.level === lv.n).length;
    if (!count) continue;
    const chip = h("button", { class: "chip on" }, `L${lv.n} ${lv.label} (${count})`);
    chip.addEventListener("click", () => {
      if (levelSel.has(lv.n)) levelSel.delete(lv.n);
      else levelSel.add(lv.n);
      chip.classList.toggle("on", levelSel.has(lv.n));
    });
    levelRow.append(chip);
  }

  // Lọc chủ đề — chỉ hiện chủ đề thực sự có câu hỏi
  const topicSel = new Set();
  const topicRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  for (const [key, t] of Object.entries(INTERVIEW_TOPICS)) {
    if (t.field !== fieldKey) continue;
    const count = bank.filter((q) => q.topic === key).length;
    if (!count) continue;
    topicSel.add(key);
    const chip = h("button", { class: "chip on" }, `${t.short} (${count})`);
    chip.addEventListener("click", () => {
      if (topicSel.has(key)) topicSel.delete(key);
      else topicSel.add(key);
      chip.classList.toggle("on", topicSel.has(key));
    });
    topicRow.append(chip);
  }

  // Mặc định 5 câu, không phải 20 như trắc nghiệm: một câu tự luận L4 ngốn
  // 8–20 phút, nên 20 câu là một buổi chiều chứ không phải một lượt ôn.
  const countSel = h("select", { class: "select", style: "max-width:200px" },
    h("option", { value: "5", selected: true }, "5 câu"),
    h("option", { value: "10" }, "10 câu"),
    h("option", { value: "all" }, "Toàn bộ"));

  let onlyWeak = false;
  const weakChip = h("button", { class: "chip" }, "🎯 Ưu tiên câu chưa đạt / chưa gặp");
  weakChip.addEventListener("click", () => {
    onlyWeak = !onlyWeak;
    weakChip.classList.toggle("on", onlyWeak);
  });

  const startBtn = h("button", { class: "btn btn-primary btn-lg" }, "Bắt đầu phỏng vấn");
  startBtn.addEventListener("click", () => {
    let pool = bank.filter((q) => levelSel.has(q.level) && topicSel.has(q.topic));
    if (!pool.length) { toast("Không có câu hỏi nào khớp bộ lọc.", "error"); return; }
    const n = countSel.value === "all" ? pool.length : Math.min(+countSel.value, pool.length);
    if (onlyWeak) {
      const stats = store.get("interview.stats", {});
      const weight = (q) => {
        const s = stats[q.id];
        if (!s || !s.seen) return 0;   // chưa gặp — ưu tiên nhất
        if (s.last < 2) return 1;      // lần gần nhất chưa đạt / một phần
        return 2;                      // đã đạt
      };
      pool = pool.slice().sort((a, b) => weight(a) - weight(b));
      // Trộn trong một cửa sổ rộng gấp đôi rồi cắt: giữ ưu tiên câu yếu mà vẫn
      // không ra đúng một thứ tự cố định mỗi lượt.
      pool = shuffle(pool.slice(0, Math.max(n, Math.min(pool.length, n * 2)))).slice(0, n);
    } else {
      pool = shuffle(pool).slice(0, n);
    }
    renderSession(root, pool);
  });

  page.append(
    h("div", { class: "card" },
      h("strong", {}, "Cấp độ"), levelRow,
      h("strong", {}, "Chủ đề"), topicRow,
      h("div", { class: "flex flex-wrap", style: "margin-bottom:14px" }, countSel, weakChip),
      startBtn)
  );

  root.append(page);
}

// ---------- Phiên phỏng vấn ----------

function renderSession(root, list) {
  root.innerHTML = "";
  const page = h("div", { class: "page" });
  root.append(page);

  const stats = store.get("interview.stats", {});
  const notes = store.get("interview.notes", {});
  let idx = 0;
  const results = []; // { q, grade, covered }

  const progressText = h("span", { class: "muted small" });
  const progressBar = h("span", {});
  const body = h("div", {});

  page.append(
    h("div", { class: "flex spread", style: "margin-bottom:6px" },
      h("a", {
        class: "btn btn-ghost btn-sm", href: "#/interview",
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

    const topic = INTERVIEW_TOPICS[q.topic];
    const card = h("div", { class: "card" },
      h("div", { class: "flex flex-wrap", style: "margin-bottom:10px" },
        levelBadge(q.level),
        h("span", { class: "badge" }, topic ? topic.short : q.topic),
        h("span", { class: "faint small" }, `⏱ ${q.minutes} phút`),
        clockEl()),
      h("div", { style: "font-size:16px;font-weight:600", html: inlineMd(q.question) }));

    if (q.incident) card.append(incidentBlock(q.incident));
    const codeEl = codeNode(q.code);
    if (codeEl) card.append(codeEl);

    const note = h("textarea", {
      class: "input",
      rows: "4",
      placeholder: "Ghi ý bạn định trả lời (tuỳ chọn) — viết ra trước khi lật đáp án",
      style: "margin-top:12px;width:100%;resize:vertical",
    });
    note.value = notes[q.id] ?? "";
    const saveNote = () => {
      const v = note.value.trim();
      if (v) notes[q.id] = v; else delete notes[q.id];
      store.set("interview.notes", notes);
    };
    note.addEventListener("blur", saveNote);
    card.append(note);

    const revealBtn = h("button", { class: "btn btn-primary", style: "margin-top:12px" },
      "Xem đáp án mẫu →");
    revealBtn.addEventListener("click", () => { saveNote(); reveal(); });
    card.append(revealBtn);
    body.append(card);

    function reveal() {
      revealBtn.remove();
      note.disabled = true;

      // Rubric: người học tick từng ý mình thật sự nói được.
      const covered = new Set();
      const gradeBtns = [];
      const rubric = h("div", { style: "margin-top:16px" },
        h("strong", {}, "Bạn có nói được ý này không?"));
      q.mustCover.forEach((m, i) => {
        const cb = h("input", { type: "checkbox" });
        const row = h("label", { class: "check-item" },
          cb, h("span", { class: "check-text", html: inlineMd(m) }));
        cb.addEventListener("change", () => {
          if (cb.checked) covered.add(i); else covered.delete(i);
          row.classList.toggle("done", cb.checked);
          syncSuggestion();
        });
        rubric.append(row);
      });

      const suggestion = h("div", { class: "faint small", style: "margin:10px 0 6px" });
      function syncSuggestion() {
        const ratio = q.mustCover.length ? covered.size / q.mustCover.length : 0;
        const v = ratio >= 0.85 ? 2 : ratio >= 0.5 ? 1 : 0;
        suggestion.textContent =
          `Đã tick ${covered.size}/${q.mustCover.length} ý — gợi ý: ${GRADES[v].label}. Bạn vẫn là người chấm cuối.`;
        // Viền dày lên bằng token sẵn có thay vì một class mới: không có
        // .suggested trong style.css, và đợt này không đụng tới style.css.
        gradeBtns.forEach((b, i) => {
          b.style.borderColor = i === v ? "var(--accent)" : "";
          b.style.borderWidth = i === v ? "2px" : "";
        });
      }

      const grades = h("div", {
        class: "grade-row",
        style: "margin-top:10px;grid-template-columns:repeat(3,1fr)",
      });
      for (const g of GRADES) {
        const btn = h("button", { class: `grade-btn ${g.cls}` },
          h("span", {}, g.label), h("small", {}, g.hint));
        btn.addEventListener("click", () => answer(g.v, [...covered]));
        gradeBtns.push(btn);
        grades.append(btn);
      }

      card.append(
        rubric,
        h("div", { class: "explain-box ok", style: "margin-top:14px" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Đáp án mẫu"),
          h("div", { html: inlineMd(q.model) })),
        q.tradeoffs ? tradeoffTable(q.tradeoffs) : null,
        h("div", { class: "explain-box bad" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Dấu hiệu trả lời thuộc lòng"),
          h("ul", { class: "list-warn" }, q.redFlags.map((r) => h("li", { html: inlineMd(r) })))),
        h("div", { class: "explain-box" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Người phỏng vấn sẽ hỏi tiếp"),
          h("ul", {}, q.probes.map((p) => h("li", { html: inlineMd(p) })))),
        refChipRow(q.refs),
        suggestion,
        grades);

      syncSuggestion();
      grades.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function answer(grade, covered) {
      results.push({ q, grade, covered });
      const s = stats[q.id] ?? { seen: 0, last: 0, best: 0, lastAt: 0, covered: [] };
      s.seen++;
      s.last = grade;
      s.best = Math.max(s.best ?? 0, grade);
      s.lastAt = Date.now();
      s.covered = covered;
      stats[q.id] = s;
      store.set("interview.stats", stats);
      recordActivity();
      idx++;
      if (idx >= list.length) showSummary();
      else showQuestion();
    }
  }

  // Đồng hồ ĐẾM LÊN, không đếm ngược: phỏng vấn thật không có chuông, và ép giờ
  // ở đây chỉ tạo áp lực giả mà không đo thêm được gì.
  function clockEl() {
    const el = h("span", { class: "faint small" }, "0:00");
    const t0 = Date.now();
    const timer = setInterval(() => {
      if (!el.isConnected) { clearInterval(timer); return; }
      const s = Math.floor((Date.now() - t0) / 1000);
      el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
    return el;
  }

  function incidentBlock(inc) {
    const row = (label, text) =>
      h("div", { style: "margin-top:4px" },
        h("strong", {}, `${label}: `), h("span", { html: inlineMd(text) }));
    return h("div", { class: "explain-box bad", style: "margin-top:12px" },
      h("div", { style: "font-weight:700" }, "🔥 Tình huống production"),
      row("Triệu chứng", inc.symptom),
      row("Quy mô", inc.scale),
      row("Ràng buộc", inc.constraints));
  }

  function tradeoffTable(rows) {
    return h("div", { class: "table-wrap", style: "margin-top:12px" },
      h("table", { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Phương án"), h("th", {}, "Chọn khi"))),
        h("tbody", {}, rows.map((t) =>
          h("tr", {},
            h("td", { html: inlineMd(t.option) }),
            h("td", { html: inlineMd(t.when) }))))));
  }

  function showSummary() {
    body.innerHTML = "";
    progressBar.style.width = "100%";
    progressText.textContent = "Hoàn thành";

    const passed = results.filter((r) => r.grade === 2).length;
    const pct = Math.round((passed / results.length) * 100);

    body.append(
      h("div", { class: "card center" },
        h("div", { class: "stat-num", style: `color:${pct >= 66 ? "var(--green)" : "var(--red)"};font-size:42px` }, `${pct}%`),
        h("div", { class: "stat-label" }, `${passed}/${results.length} câu tự chấm Đạt`),
        h("div", { class: "flex", style: "justify-content:center;margin-top:14px" },
          h("button", { class: "btn btn-primary", onclick: () => { root.innerHTML = ""; renderSetup(root); } }, "Phiên mới"),
          h("a", { class: "btn", href: "#/docs" }, "Về thư viện tài liệu →")))
    );

    // Bảng theo cấp — phần riêng của view này. Tỉ lệ đạt tổng che mất chuyện
    // quan trọng nhất: rụng ở tầng nào. Bốn dòng này trả lời đúng câu đó.
    const grid = h("div", {
      class: "grid",
      style: "margin:18px 0;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr))",
    });
    for (const lv of LEVELS) {
      const inLv = results.filter((r) => r.q.level === lv.n);
      if (!inLv.length) continue;
      const ok = inLv.filter((r) => r.grade === 2).length;
      grid.append(
        h("div", { class: "card" },
          h("div", { class: "flex spread" },
            h("strong", {}, `L${lv.n} · ${lv.label}`),
            h("span", { class: "small", style: "font-weight:700" }, `${ok}/${inLv.length}`)),
          h("div", { class: "progress", style: "margin-top:8px;height:5px" },
            h("span", { style: `width:${(ok / inLv.length) * 100}%` }))));
    }
    if (grid.children.length) body.append(grid);

    const weak = results.filter((r) => r.grade < 2);
    if (weak.length) {
      body.append(h("h2", { style: "font-size:18px;margin:22px 0 10px" },
        `Ôn lại ${weak.length} câu chưa trọn ý`));
      for (const r of weak) {
        const missed = r.q.mustCover.filter((_, i) => !r.covered.includes(i));
        const card = h("div", { class: "card", style: "margin-bottom:12px" },
          h("div", { class: "flex flex-wrap", style: "margin-bottom:8px" },
            levelBadge(r.q.level),
            h("span", { class: "badge" }, GRADES[r.grade].label)),
          h("div", { style: "font-weight:600", html: inlineMd(r.q.question) }));
        if (missed.length) {
          card.append(
            h("div", { class: "explain-box bad", style: "margin-top:10px" },
              h("div", { style: "font-weight:700;margin-bottom:4px" }, "Ý còn thiếu"),
              h("ul", { class: "list-warn" }, missed.map((m) => h("li", { html: inlineMd(m) })))));
        }
        card.append(refChipRow(r.q.refs));
        body.append(card);
      }
    }
    window.scrollTo({ top: 0 });
  }

  showQuestion();
}
