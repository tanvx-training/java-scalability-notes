// Ma trận năng lực — module → chủ đề → tiêu chí tự đánh giá theo 4 cấp độ.
//
// Khác lộ trình học ở trục dữ liệu: lộ trình chia theo TUẦN và mỗi mục là một
// bài học; ma trận chia theo MODULE NĂNG LỰC và mỗi mục là một tiêu chí tự
// chấm. Vì vậy có view riêng thay vì nhánh thứ hai trong views/roadmap.js.
//
// Tiến độ lưu ở khoá riêng "tracker.checked", tách khỏi "roadmap.checked":
// hai không gian id khác nhau và người dùng đặt lại được từng cái.

import { h, pageHead, inlineMd } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getMatrices } from "../data/index.js";
import { currentField } from "../lib/field.js";

const LEVELS = [
  { n: 1, label: "Hiểu lý thuyết" },
  { n: 2, label: "Thực thi mã nguồn" },
  { n: 3, label: "Phân tích đánh đổi" },
  { n: 4, label: "Thiết kế & xử lý sự cố" },
];

const IMPORTANCE = {
  HIGH: { label: "Cao", color: "red" },
  MEDIUM: { label: "Trung bình", color: "amber" },
  LOW: { label: "Thấp", color: "blue" },
};

export function render(root, params) {
  const matrix = getMatrices(currentField())[0];
  if (!matrix) {
    root.append(h("div", { class: "page" },
      pageHead("📊 Ma trận năng lực", "Lĩnh vực này chưa có ma trận năng lực.")));
    return;
  }
  renderMatrix(root, matrix, params[0]);
}

function renderMatrix(root, matrix, focusModuleId) {
  const page = h("div", { class: "page" });
  const checked = store.get("tracker.checked", {});

  const allCriteria = matrix.modules
    .flatMap((m) => m.topics)
    .flatMap((t) => t.checklist);
  const doneCount = () => allCriteria.filter((c) => checked[c.id]).length;

  const refreshers = [];
  const progressBar = h("span", {});
  const progressText = h("span", { style: "font-weight:700" });

  function refreshProgress() {
    const done = doneCount();
    const pct = Math.round((done / allCriteria.length) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = `${done}/${allCriteria.length} tiêu chí · ${pct}%`;
    refreshers.forEach((f) => f());
  }

  page.append(pageHead(
    `📊 ${matrix.title}`,
    `${matrix.modules.length} module năng lực, ${allCriteria.length} tiêu chí tự đánh giá theo 4 cấp độ. ` +
    "Tick khi bạn tự tin trình bày được tiêu chí đó mà không cần nhìn tài liệu."
  ));

  const nextBtn = h("button", { class: "btn btn-primary btn-sm" }, "▶ Tiêu chí kế tiếp");
  const openers = new Map();
  nextBtn.addEventListener("click", () => {
    const next = allCriteria.find((c) => !checked[c.id]);
    if (!next) { alert("Bạn đã đạt toàn bộ tiêu chí của ma trận! 🎉"); return; }
    openers.get(next.id)?.();
  });

  page.append(
    h("div", { class: "card", style: "margin-bottom:16px" },
      h("div", { class: "flex spread" },
        h("strong", {}, "Tiến độ ma trận năng lực"),
        progressText),
      h("div", { class: "progress green", style: "margin-top:8px" }, progressBar),
      h("div", { class: "flex", style: "margin-top:12px" },
        nextBtn,
        h("button", {
          class: "btn btn-sm btn-danger",
          onclick: () => {
            if (confirm("Xóa tiến độ ma trận năng lực? (Lộ trình học không bị ảnh hưởng)")) {
              for (const c of allCriteria) delete checked[c.id];
              store.set("tracker.checked", checked);
              location.reload();
            }
          },
        }, "Đặt lại tiến độ")))
  );

  // Bảng cấp độ — phần riêng của view này: thấy ngay mình mạnh ở tầng nào.
  const levelGrid = h("div", {
    class: "grid",
    style: "margin-bottom:18px;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr))",
  });
  for (const lv of LEVELS) {
    const total = allCriteria.filter((c) => c.level === lv.n).length;
    const bar = h("span", {});
    const txt = h("span", { class: "small", style: "font-weight:700" });
    refreshers.push(() => {
      const done = allCriteria.filter((c) => c.level === lv.n && checked[c.id]).length;
      bar.style.width = (total ? (done / total) * 100 : 0) + "%";
      txt.textContent = `${done}/${total}`;
    });
    levelGrid.append(
      h("div", { class: "card" },
        h("div", { class: "flex spread" },
          h("strong", {}, `L${lv.n} · ${lv.label}`), txt),
        h("div", { class: "progress", style: "margin-top:8px;height:5px" }, bar))
    );
  }
  page.append(levelGrid);

  const firstOpen = matrix.modules.find(
    (m) => m.topics.some((t) => t.checklist.some((c) => !checked[c.id])))?.id;

  for (const mod of matrix.modules) {
    const modCriteria = mod.topics.flatMap((t) => t.checklist);
    const modNum = h("div", { class: "week-num" }, mod.code);
    const modCount = h("span", { class: "faint", style: "white-space:nowrap" });
    const modBar = h("span", {});
    const body = h("div", { style: "margin-top:12px" });

    refreshers.push(() => {
      const d = modCriteria.filter((c) => checked[c.id]).length;
      modCount.textContent = `${d}/${modCriteria.length}`;
      modBar.style.width = `${modCriteria.length ? (d / modCriteria.length) * 100 : 0}%`;
      modNum.classList.toggle("done", modCriteria.length > 0 && d === modCriteria.length);
    });

    const details = h("details", { class: "card week-card" },
      h("summary", { class: "week-head", style: "list-style:none" },
        modNum,
        h("div", { class: "grow", style: "min-width:0" },
          h("div", { class: "lab-title" }, mod.title),
          h("div", { class: "muted small" }, mod.summary),
          h("div", { class: "progress", style: "margin-top:7px;height:5px;max-width:220px" }, modBar)),
        h("span", { class: "badge" }, `trọng số ${mod.weight}%`),
        modCount),
      body);

    for (const topic of mod.topics) {
      const imp = IMPORTANCE[topic.importance] ?? IMPORTANCE.MEDIUM;
      const block = h("div", { class: "lesson-item", style: "padding:10px 0" },
        h("div", { class: "flex flex-wrap" },
          h("strong", {}, topic.title),
          h("span", { class: `badge badge-${imp.color}` }, `Quan trọng: ${imp.label}`)));

      if (topic.resources?.length) {
        block.append(
          h("div", { class: "chip-row", style: "margin:8px 0" },
            topic.resources.map((r) =>
              h("a", { class: "chip", href: r.url, target: "_blank", rel: "noopener" },
                `${r.title} ↗`))));
      }

      for (const c of topic.checklist) {
        const cb = h("input", { type: "checkbox", title: "Đánh dấu đã đạt tiêu chí" });
        cb.checked = !!checked[c.id];
        const row = h("label", { class: `check-item${cb.checked ? " done" : ""}` },
          cb,
          h("span", { class: "badge", style: "flex:none" }, `L${c.level}`),
          h("span", { class: "check-text", html: inlineMd(c.criteria) }));
        cb.addEventListener("change", () => {
          if (cb.checked) checked[c.id] = true;
          else delete checked[c.id];
          store.set("tracker.checked", checked);
          row.classList.toggle("done", cb.checked);
          refreshProgress();
        });
        openers.set(c.id, () => {
          details.setAttribute("open", "");
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        block.append(row);
      }
      body.append(block);
    }

    if (mod.id === firstOpen) details.setAttribute("open", "");
    page.append(details);
  }

  refreshProgress();
  root.append(page);

  if (focusModuleId) {
    const target = matrix.modules.find((m) => m.id === focusModuleId);
    if (target) {
      const first = target.topics.flatMap((t) => t.checklist)[0];
      if (first) setTimeout(() => openers.get(first.id)?.(), 60);
    }
  }
}
