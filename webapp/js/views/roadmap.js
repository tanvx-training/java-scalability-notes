// Lộ trình học đa track (CKAD / CKA / CKS) — giáo trình tương tác theo tuần:
// mỗi mục là một bài học chi tiết (mở/đóng được), tiến độ lưu localStorage.

import { h, pageHead, inlineMd, mdInto } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { tracks, getTrack } from "../data/roadmap.js";
import { getTracks } from "../data/index.js";
import { FIELDS } from "../data/fields.js";
import { currentField } from "../lib/field.js";

export function render(root, params) {
  const track = getTrack(params[0]);
  if (!track) return renderChooser(root);
  renderTrack(root, track, params[1]);
}

// ---------------- Trang chọn lộ trình ----------------

function trackStats(track, checked) {
  const items = track.weeks.flatMap((w) => w.items);
  const done = items.filter((it) => checked[it.id]).length;
  return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}

function renderChooser(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const list = getTracks(fieldKey);
  const page = h("div", { class: "page" });
  const checked = store.get("roadmap.checked", {});

  page.append(pageHead(
    "🗺️ Lộ trình học",
    list.length > 1
      ? `${list.length} giáo trình tương tác của lĩnh vực ${field.label} — mỗi mục là một bài học, tick đến đâu lưu đến đó.`
      : `Giáo trình tương tác của lĩnh vực ${field.label} — mỗi mục là một bài học, tick đến đâu lưu đến đó.`
  ));

  // Dải thứ tự khuyến nghị chỉ có nghĩa với 3 chứng chỉ Kubernetes.
  if (fieldKey === "kubernetes") {
    page.append(
      h("div", { class: "path-flow", style: "margin-bottom:18px" },
        h("span", { class: "path-node" }, "🎯 CKAD"),
        h("span", { class: "path-arrow" }, "→"),
        h("span", { class: "path-node" }, "🛠️ CKA"),
        h("span", { class: "path-arrow" }, "→"),
        h("span", { class: "path-node" }, "🔐 CKS"))
    );
  }

  const grid = h("div", { class: "grid" });
  for (const track of list) {
    const s = trackStats(track, checked);
    const started = s.done > 0;
    grid.append(
      h("a", { class: "card card-link", href: `#/roadmap/${track.id}` },
        h("div", { class: "flex", style: "align-items:flex-start" },
          h("span", { style: "font-size:30px" }, track.icon),
          h("div", { class: "grow", style: "min-width:0" },
            h("div", { class: "flex flex-wrap" },
              h("strong", { style: "font-size:17px" }, track.label),
              h("span", { class: "muted small" }, track.name)),
            h("p", { class: "muted small", style: "margin:6px 0" }, track.desc),
            h("p", { class: "faint", style: "margin:0 0 8px" }, `ℹ️ ${track.prereq}`),
            h("div", { class: "flex" },
              h("div", { class: "progress green grow", style: "max-width:260px" },
                h("span", { style: `width:${s.pct}%` })),
              h("span", { class: "small", style: "font-weight:700" }, `${s.done}/${s.total} bài · ${s.pct}%`))),
          h("span", { class: "btn btn-sm", style: "flex:none" },
            started ? "Tiếp tục →" : "Bắt đầu →")))
    );
  }
  page.append(grid);
  root.append(page);
}

// ---------------- Trang giáo trình của một track ----------------

function renderTrack(root, track, focusItemId) {
  const page = h("div", { class: "page" });
  const checked = store.get("roadmap.checked", {});

  const allItems = track.weeks.flatMap((w) => w.items);
  const doneCount = () => allItems.filter((it) => checked[it.id]).length;

  const weekRefreshers = [];
  const lessonOpeners = new Map();

  const progressBar = h("span", {});
  const progressText = h("span", { style: "font-weight:700" });

  function refreshProgress() {
    const done = doneCount();
    const pct = Math.round((done / allItems.length) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = `${done}/${allItems.length} bài · ${pct}%`;
  }

  page.append(
    h("div", { class: "breadcrumb" },
      h("a", { href: "#/roadmap" }, "Lộ trình học"), " / ", track.label),
    pageHead(
      `${track.icon} Lộ trình ${track.label} (8–10 tuần)`,
      `${track.desc} Bấm vào tiêu đề mỗi mục để mở bài học, tick ô vuông khi đã nắm vững. ${track.prereq}`
    )
  );

  const continueBtn = h("button", { class: "btn btn-primary btn-sm" }, "▶ Tiếp tục học");
  continueBtn.addEventListener("click", () => {
    const next = allItems.find((it) => !checked[it.id]);
    if (!next) { alert(`Bạn đã hoàn thành toàn bộ lộ trình ${track.label}! 🎉`); return; }
    lessonOpeners.get(next.id)?.();
  });

  page.append(
    h("div", { class: "card", style: "margin-bottom:16px" },
      h("div", { class: "flex spread" },
        h("strong", {}, `Tiến độ ${track.label}`),
        progressText),
      h("div", { class: "progress green", style: "margin-top:8px" }, progressBar),
      h("div", { class: "flex", style: "margin-top:12px" },
        continueBtn,
        h("button", {
          class: "btn btn-sm btn-danger",
          onclick: () => {
            if (confirm(`Xóa tiến độ lộ trình ${track.label}? (Các lộ trình khác không bị ảnh hưởng)`)) {
              for (const it of allItems) delete checked[it.id];
              store.set("roadmap.checked", checked);
              location.reload();
            }
          },
        }, "Đặt lại tiến độ"))
    )
  );

  const firstOpen = track.weeks.find((w) => w.items.some((it) => !checked[it.id]))?.id;

  for (const week of track.weeks) {
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

  // Deep-link từ nơi khác (vd YAML mẫu → bài học): #/roadmap/<track>/<itemId>
  if (focusItemId && lessonOpeners.has(focusItemId)) {
    setTimeout(() => lessonOpeners.get(focusItemId)(), 60);
  }
}
