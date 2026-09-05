// 🧭 Hướng dẫn học — trả lời "học lĩnh vực này như thế nào, bắt đầu từ đâu, xong
// khi nào": lộ trình cấp module có trạng thái tính từ tiến độ thật, cách học,
// bẫy phương pháp, tiêu chí hoàn thành, và cách học từng track.

import { h, pageHead, sectionTitle, inlineMd, toast } from "../lib/ui.js";
import { currentField } from "../lib/field.js";
import { FIELDS } from "../data/fields.js";
import { getTracks } from "../data/index.js";
import { fieldProgress, setManualStep, trackGuide } from "../lib/guides.js";
import { trackStats } from "../lib/stats.js";

export function render(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const fp = fieldProgress(fieldKey);
  const page = h("div", { class: "page" });

  if (!fp) {
    page.append(pageHead("🧭 Hướng dẫn học", "Lĩnh vực này chưa có hướng dẫn học."));
    root.append(page);
    return;
  }
  const g = fp.guide;

  page.append(pageHead(`${field.icon} Hướng dẫn học — ${field.label}`, g.tagline, "Hướng dẫn học"));

  // ---- Bối cảnh: cho ai, bao lâu, cần gì trước ----
  page.append(
    h("div", { class: "card guide-hero" },
      h("div", {},
        h("p", { class: "mt0", html: inlineMd(g.audience) }),
        h("dl", { class: "guide-facts" },
          h("dt", {}, "⏱️ Thời lượng"), h("dd", {}, g.hoursPerWeek),
          h("dt", {}, "📚 Cần có trước"), h("dd", {}, h("ul", { class: "list-check mt0" }, g.prereqs.map((p) => h("li", { html: inlineMd(p) })))))),
      h("div", { class: "card card-soft", style: "min-width:220px" },
        h("div", { class: "stat-label" }, "Bạn đang ở đâu"),
        h("div", { class: "stat-num" }, `${fp.progress}%`),
        h("div", { class: "progress green mt-2" }, h("span", { style: `width:${fp.progress}%` })),
        h("div", { class: "faint mt-2" }, `${fp.doneCount}/${fp.total} bước đã xong`),
        fp.next
          ? h("a", { class: "btn btn-primary btn-sm mt-3", href: fp.next.step.href }, `▶ ${fp.next.step.title}`)
          : h("div", { class: "badge badge-green mt-3" }, "🎉 Hoàn thành lộ trình khuyến nghị"))));

  // ---- Stepper ----
  page.append(sectionTitle("Lộ trình khuyến nghị", `${fp.total} bước`));
  const stepper = h("div", { class: "card" }, h("div", { class: "stepper" },
    fp.steps.map(({ step, status }, i) => {
      const isCurrent = fp.next && fp.next.step.id === step.id;
      const cls = `step${status.done ? " done" : ""}${isCurrent ? " current" : ""}`;
      const meta = h("div", { class: "step-meta" },
        h("div", { class: `progress thin ${status.done ? "green" : ""}` }, h("span", { style: `width:${status.progress}%` })),
        h("span", {}, status.detail));
      let manualToggle = null;
      if (status.manual) {
        const cb = h("input", { type: "checkbox" });
        cb.checked = status.done;
        cb.addEventListener("change", () => {
          setManualStep(step.id, cb.checked);
          toast(cb.checked ? "Đã đánh dấu bước hoàn thành" : "Đã bỏ đánh dấu", "success");
          root.innerHTML = "";
          render(root);
        });
        manualToggle = h("label", { class: "flex small", style: "gap:6px" }, cb, "Tôi đã làm xong bước này");
      }
      return h("div", { class: cls },
        h("div", { class: "step-dot" }, status.done ? "✓" : String(i + 1)),
        h("div", { class: "step-body" },
          h("h3", {}, step.title),
          h("p", { html: inlineMd(step.desc) }),
          meta,
          h("div", { class: "flex flex-wrap mt-2" },
            step.href ? h("a", { class: `btn btn-sm${isCurrent ? " btn-primary" : ""}`, href: step.href }, status.done ? "Xem lại →" : "Đi tới →") : null,
            manualToggle)));
    })));
  page.append(stepper);

  // ---- Cách học ----
  page.append(sectionTitle("Cách học hiệu quả"));
  page.append(h("div", { class: "grid grid-auto" },
    g.method.map((m) => h("div", { class: "card method-card" }, h("strong", {}, m.title), h("p", { class: "muted small mb0", html: inlineMd(m.desc) })))));

  // ---- Bẫy & tiêu chí xong ----
  page.append(h("div", { class: "grid grid-2 mt-5" },
    h("div", { class: "card" },
      h("div", { class: "card-head" }, h("strong", {}, "⚠️ Bẫy phương pháp")),
      h("ul", { class: "list-check list-warn" }, g.pitfalls.map((p) => h("li", { html: inlineMd(p) })))),
    h("div", { class: "card" },
      h("div", { class: "card-head" }, h("strong", {}, "🏁 Coi như xong lĩnh vực khi")),
      h("ul", { class: "list-check" }, g.doneWhen.map((p) => h("li", { html: inlineMd(p) }))))));

  // ---- Từng track ----
  const list = getTracks(fieldKey);
  if (list.length) {
    page.append(sectionTitle("Cách học từng track", list.length));
    for (const t of list) {
      const tg = trackGuide(t.id);
      const s = trackStats(t);
      page.append(
        h("details", { class: "card track-guide", style: "border-left-color:var(--accent)" },
          h("summary", {},
            h("span", {}, t.icon),
            h("span", { class: "grow" }, `${t.label} — ${t.name}`),
            h("span", { class: "faint nowrap" }, `${s.done}/${s.total} · ${s.pct}%`),
            h("span", { class: "chev" }, "▸")),
          tg ? trackGuideBody(tg) : h("p", { class: "muted small" }, "Chưa có hướng dẫn riêng."),
          h("div", { class: "mt-3" }, h("a", { class: "btn btn-sm", href: `#/roadmap/${t.id}` }, "Mở lộ trình →"))));
    }
  }

  root.append(page);
}

// Dùng chung với trang track (views/roadmap.js).
export function trackGuideBody(tg) {
  const col = (title, items) => items?.length
    ? h("div", {}, h("h4", {}, title), h("ul", {}, items.map((x) => h("li", { html: inlineMd(x) }))))
    : null;
  return h("div", { class: "tg-body" },
    h("div", { class: "rhythm", html: "🎵 <strong>Nhịp học.</strong> " + inlineMd(tg.rhythm) }),
    col("Trước khi bắt đầu", tg.before),
    col("Khi làm từng mục", tg.during),
    col("Sau khi hết track", tg.after));
}
