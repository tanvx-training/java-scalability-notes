// Lộ trình học tương tác — checklist theo tuần, tiến độ lưu localStorage.

import { h, pageHead, inlineMd } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { roadmap } from "../data/roadmap.js";

export function render(root) {
  const page = h("div", { class: "page" });
  const checked = store.get("roadmap.checked", {});

  const allItems = roadmap.flatMap((w) => w.items);
  const doneCount = () => allItems.filter((it) => checked[it.id]).length;

  const progressBar = h("span", {});
  const progressText = h("span", { style: "font-weight:700" });

  function refreshProgress() {
    const done = doneCount();
    const pct = Math.round((done / allItems.length) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = `${done}/${allItems.length} mục · ${pct}%`;
  }

  page.append(pageHead(
    "🗺️ Lộ trình học CKAD (8–10 tuần)",
    "Trích từ CKAD Study Guide — giả định học 1.5–2 giờ/ngày, 5–6 ngày/tuần. Nếu ít thời gian hơn, hãy kéo dài lộ trình thay vì bỏ phần thực hành."
  ));

  page.append(
    h("div", { class: "card", style: "margin-bottom:16px" },
      h("div", { class: "flex spread" },
        h("strong", {}, "Tiến độ tổng"),
        progressText),
      h("div", { class: "progress green", style: "margin-top:8px" }, progressBar),
      h("div", { style: "margin-top:12px" },
        h("button", {
          class: "btn btn-sm btn-danger",
          onclick: () => {
            if (confirm("Xóa toàn bộ tiến độ lộ trình?")) {
              store.set("roadmap.checked", {});
              location.reload();
            }
          },
        }, "Đặt lại tiến độ"))
    )
  );

  // Tuần đầu tiên chưa hoàn thành sẽ được mở sẵn.
  const firstOpen = roadmap.find((w) => w.items.some((it) => !checked[it.id]))?.id;

  for (const week of roadmap) {
    const weekDone = () => week.items.filter((it) => checked[it.id]).length;

    const weekNum = h("div", { class: "week-num" }, week.week.replace("Tuần ", ""));
    const weekCount = h("span", { class: "faint" });
    const body = h("div", { style: "margin-top:12px" });

    function refreshWeek() {
      const d = weekDone();
      weekCount.textContent = `${d}/${week.items.length}`;
      weekNum.classList.toggle("done", d === week.items.length);
    }

    for (const item of week.items) {
      const cb = h("input", { type: "checkbox" });
      cb.checked = !!checked[item.id];
      const row = h("label", { class: `check-item${cb.checked ? " done" : ""}` },
        cb,
        h("span", { class: "check-text", html: inlineMd(item.text) })
      );
      cb.addEventListener("change", () => {
        if (cb.checked) checked[item.id] = true;
        else delete checked[item.id];
        store.set("roadmap.checked", checked);
        row.classList.toggle("done", cb.checked);
        refreshWeek();
        refreshProgress();
      });
      body.append(row);
    }

    body.append(
      h("div", { class: "explain-box", style: "margin-top:10px" },
        h("span", { html: "🔨 <strong>Thực hành:</strong> " + inlineMd(week.practice) }))
    );

    const details = h("details", { class: "card week-card" },
      h("summary", { class: "week-head", style: "list-style:none" },
        weekNum,
        h("div", { class: "grow" },
          h("div", { class: "lab-title" }, `${week.week} — ${week.title}`),
          h("div", { class: "muted small" }, week.goal)),
        weekCount),
      body
    );
    if (week.id === firstOpen) details.setAttribute("open", "");
    refreshWeek();
    page.append(details);
  }

  refreshProgress();
  root.append(page);
}
