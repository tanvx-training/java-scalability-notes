// Lộ trình học tương tác — giáo trình theo tuần: mỗi mục là một bài học
// chi tiết (mở/đóng được), tick đến đâu tiến độ lưu đến đó (localStorage).

import { h, pageHead, inlineMd, mdInto } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { roadmap } from "../data/roadmap.js";

export function render(root) {
  const page = h("div", { class: "page" });
  const checked = store.get("roadmap.checked", {});

  const allItems = roadmap.flatMap((w) => w.items);
  const doneCount = () => allItems.filter((it) => checked[it.id]).length;

  // Các callback đồng bộ tiến độ của từng tuần, gọi khi tick bất kỳ mục nào.
  const weekRefreshers = [];
  // Mở bài học của một mục theo id (dùng cho nút "Tiếp tục học").
  const lessonOpeners = new Map();

  const progressBar = h("span", {});
  const progressText = h("span", { style: "font-weight:700" });

  function refreshProgress() {
    const done = doneCount();
    const pct = Math.round((done / allItems.length) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = `${done}/${allItems.length} bài · ${pct}%`;
  }

  page.append(pageHead(
    "🗺️ Lộ trình học CKAD (8–10 tuần)",
    "Giáo trình tương tác phát triển từ CKAD Study Guide: mỗi mục là một bài học chi tiết — bấm vào tiêu đề để mở nội dung, tick ô vuông khi đã nắm vững. Giả định học 1.5–2 giờ/ngày, 5–6 ngày/tuần."
  ));

  // ---- Thanh tiến độ tổng + Tiếp tục học ----
  const continueBtn = h("button", { class: "btn btn-primary btn-sm" }, "▶ Tiếp tục học");
  continueBtn.addEventListener("click", () => {
    const next = allItems.find((it) => !checked[it.id]);
    if (!next) { alert("Bạn đã hoàn thành toàn bộ lộ trình! 🎉"); return; }
    lessonOpeners.get(next.id)?.();
  });

  page.append(
    h("div", { class: "card", style: "margin-bottom:16px" },
      h("div", { class: "flex spread" },
        h("strong", {}, "Tiến độ tổng"),
        progressText),
      h("div", { class: "progress green", style: "margin-top:8px" }, progressBar),
      h("div", { class: "flex", style: "margin-top:12px" },
        continueBtn,
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
    const weekCount = h("span", { class: "faint", style: "white-space:nowrap" });
    const weekBar = h("span", {});
    const body = h("div", { style: "margin-top:12px" });

    function refreshWeek() {
      const d = weekDone();
      weekCount.textContent = `${d}/${week.items.length}`;
      weekBar.style.width = `${(d / week.items.length) * 100}%`;
      weekNum.classList.toggle("done", d === week.items.length);
    }
    weekRefreshers.push(refreshWeek);

    // Tài nguyên liên quan của tuần
    if (week.resources && week.resources.length) {
      body.append(
        h("div", { class: "chip-row", style: "margin-bottom:10px" },
          week.resources.map((r) =>
            h("a", {
              class: "chip",
              href: r.href,
              target: /^https?:/.test(r.href) ? "_blank" : null,
              rel: /^https?:/.test(r.href) ? "noopener" : null,
            }, /^https?:/.test(r.href) ? `${r.label} ↗` : r.label)))
      );
    }

    const details = h("details", { class: "card week-card" },
      h("summary", { class: "week-head", style: "list-style:none" },
        weekNum,
        h("div", { class: "grow", style: "min-width:0" },
          h("div", { class: "lab-title" }, `${week.week} — ${week.title}`),
          h("div", { class: "muted small" }, week.goal),
          h("div", { class: "progress", style: "margin-top:7px;height:5px;max-width:220px" }, weekBar)),
        weekCount),
      body
    );

    for (const item of week.items) {
      body.append(buildLessonItem(item, details));
    }

    body.append(
      h("div", { class: "explain-box", style: "margin-top:10px" },
        h("span", { html: "🔨 <strong>Thực hành cuối tuần:</strong> " + inlineMd(week.practice) }))
    );

    if (week.id === firstOpen) details.setAttribute("open", "");
    refreshWeek();
    page.append(details);
  }

  // ---- Một mục = một bài học mở/đóng được ----
  function buildLessonItem(item, weekDetails) {
    const cb = h("input", { type: "checkbox", title: "Đánh dấu đã nắm vững" });
    cb.checked = !!checked[item.id];

    const chev = h("span", { class: "chev" }, "▸");
    const titleBtn = h("button", { class: "lesson-toggle" },
      h("span", { class: "check-text", html: inlineMd(item.text) }),
      chev);

    const lessonBody = h("div", { class: "lesson-body prose", hidden: true });
    let rendered = false;

    const wrap = h("div", { class: `lesson-item${cb.checked ? " done" : ""}` },
      h("div", { class: "lesson-row" }, cb, titleBtn),
      lessonBody);

    function setChecked(on) {
      if (on) checked[item.id] = true;
      else delete checked[item.id];
      store.set("roadmap.checked", checked);
      cb.checked = on;
      wrap.classList.toggle("done", on);
      weekRefreshers.forEach((f) => f());
      refreshProgress();
    }

    function toggleLesson(forceOpen) {
      const open = forceOpen === true ? true : lessonBody.hidden;
      if (open && !rendered) {
        rendered = true;
        if (item.lesson) {
          mdInto(lessonBody, item.lesson);
          lessonBody.append(
            h("div", { style: "margin:14px 0 4px" },
              h("button", {
                class: "btn btn-sm",
                onclick: (e) => {
                  setChecked(true);
                  e.target.textContent = "✓ Đã đánh dấu hoàn thành";
                  e.target.disabled = true;
                },
              }, "✓ Đã học xong — đánh dấu hoàn thành"))
          );
        } else {
          lessonBody.append(h("p", { class: "muted small" }, "Chưa có nội dung bài học cho mục này."));
        }
      }
      lessonBody.hidden = !open;
      chev.classList.toggle("open", open);
    }

    cb.addEventListener("change", () => setChecked(cb.checked));
    titleBtn.addEventListener("click", () => toggleLesson());

    lessonOpeners.set(item.id, () => {
      weekDetails.setAttribute("open", "");
      toggleLesson(true);
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return wrap;
  }

  refreshProgress();
  root.append(page);
}
