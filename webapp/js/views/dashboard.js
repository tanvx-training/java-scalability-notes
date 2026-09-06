// Bảng điều khiển — điểm vào của một lĩnh vực: con đường đang đi, đang học tới đâu,
// bước tiếp theo theo Hướng dẫn học, số liệu tiến độ, khu vực học tập, lĩnh vực khác.

import { h, sectionTitle, statCard, fmtRelative } from "../lib/ui.js";
import { FIELDS, FIELD_ORDER, moduleAllowed } from "../data/fields.js";
import { PATHS, SPINE, positionOfField } from "../data/paths.js";
import { getDocs, getMatrices, getTracks } from "../data/index.js";
import { labs } from "../data/kubernetes/labs.js";
import { currentField, goToField } from "../lib/field.js";
import { recentItems, streakInfo } from "../lib/activity.js";
import { roadmapStats, docsStats, flashStats, quizStats, examStats, matrixStats, fieldSummary, trackStats } from "../lib/stats.js";
import { fieldProgress } from "../lib/guides.js";

// Tiến độ đại diện: lộ trình nếu có, không thì tài liệu đã đọc.
function fieldPct(id) {
  const rm = roadmapStats(id);
  return rm.total ? rm.pct : docsStats(id).pct;
}

export function render(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const has = (m) => moduleAllowed(fieldKey, m);
  const rm = roadmapStats(fieldKey);
  const dc = docsStats(fieldKey);
  const mx = matrixStats(fieldKey);
  const fl = flashStats(fieldKey);
  const qz = quizStats(fieldKey);
  const ex = examStats();
  const fp = has("guide") ? fieldProgress(fieldKey) : null;
  const st = streakInfo();

  const page = h("div", { class: "page" });

  // ---- Hero theo lĩnh vực ----
  page.append(
    h("div", { class: "hero" },
      h("div", { class: "hero-ico", "aria-hidden": "true" }, field.icon),
      h("h1", {}, h("span", {}, field.icon), field.label),
      h("p", {}, field.desc),
      h("div", { class: "hero-actions" },
        has("guide") ? h("a", { class: "btn btn-primary", href: "#/guide" }, "🧭 Hướng dẫn học") : null,
        has("roadmap") ? h("a", { class: "btn", href: "#/roadmap" }, "🗺️ Lộ trình") : null,
        has("docs") ? h("a", { class: "btn", href: "#/docs" }, "📚 Tài liệu") : null,
        has("exam") ? h("a", { class: "btn", href: "#/exam" }, "⏱️ Thi thử") : null,
        has("tracker") ? h("a", { class: "btn", href: "#/tracker" }, "📊 Ma trận năng lực") : null)));

  // ---- Con đường của bạn ----
  page.append(fieldKey === SPINE.field ? spineCard() : pathCard(fieldKey));

  // ---- Tiếp tục + Bước tiếp theo ----
  const recent = recentItems(fieldKey).slice(0, 4);
  const row = h("div", { class: "grid grid-2 mb-4" });
  if (recent.length) {
    row.append(h("div", { class: "card recent-card" },
      h("div", { class: "card-head" }, h("strong", {}, "⏮️ Tiếp tục")),
      recent.map((r) => h("a", { class: "recent-item", href: r.href },
        h("span", { class: "ico" }, r.icon ?? "•"),
        h("span", { class: "txt" }, h("strong", {}, r.title), h("small", {}, `${r.sub ? r.sub + " · " : ""}${fmtRelative(r.ts)}`)),
        h("span", { class: "faint" }, "→")))));
  }
  if (fp) {
    const next = fp.next;
    row.append(h("div", { class: "card next-step-card" },
      h("div", { class: "ns-label" }, next ? `Bước tiếp theo · ${fp.doneCount + 1}/${fp.total}` : "Lộ trình khuyến nghị"),
      next
        ? [
            h("h3", {}, next.step.title),
            h("p", { class: "muted small mt0 mb-2" }, next.step.desc),
            h("div", { class: "progress thin mb-3" }, h("span", { style: `width:${next.status.progress}%` })),
            h("div", { class: "flex flex-wrap" },
              next.step.href ? h("a", { class: "btn btn-primary btn-sm", href: next.step.href }, "Đi tới →") : null,
              h("a", { class: "btn btn-ghost btn-sm", href: "#/guide" }, "Xem cả lộ trình"),
              h("span", { class: "faint" }, next.status.detail)),
          ]
        : [
            h("h3", {}, "🎉 Bạn đã đi hết lộ trình khuyến nghị"),
            h("p", { class: "muted small mt0" }, "Xem lại tiêu chí “Coi như xong” trong Hướng dẫn học, hoặc sang lĩnh vực kế tiếp trên con đường."),
            h("a", { class: "btn btn-sm", href: "#/guide" }, "Mở Hướng dẫn học"),
          ]));
  }
  if (row.childElementCount) {
    if (row.childElementCount === 1) row.classList.remove("grid-2");
    page.append(row);
  }

  // ---- Số liệu ----
  const cards = [
    has("roadmap") ? statCard({ icon: "🗺️", num: `${rm.pct}%`, label: "Lộ trình hoàn thành", href: "#/roadmap",
      extra: rm.per.length > 1 ? rm.per.map((p) => `${p.label} ${p.pct}%`).join(" · ") : `${rm.done}/${rm.total} bài` }) : null,
    has("docs") ? statCard({ icon: "📚", num: `${dc.read}/${dc.total}`, label: "Tài liệu đã đọc", href: "#/docs",
      extra: dc.total ? `${dc.pct}% thư viện` : "" }) : null,
    has("flashcards") ? statCard({ icon: "🃏", num: String(fl.due), label: "Flashcard đến hạn ôn", href: "#/flashcards",
      extra: `${fl.fresh} thẻ chưa học · ${fl.total} tổng`, tone: fl.due ? "red" : null }) : null,
    has("quiz") ? statCard({ icon: "✅", num: qz.acc == null ? "—" : `${qz.acc}%`, label: "Độ chính xác trắc nghiệm", href: "#/quiz",
      extra: `đã gặp ${qz.seen}/${qz.total} câu` }) : null,
    has("exam") ? statCard({ icon: "⏱️", num: ex.best == null ? "—" : `${ex.best}%`, label: "Điểm thi thử tốt nhất", href: "#/exam",
      extra: ex.count ? `${ex.count} lượt thi · đậu ${ex.passCount}` : "chưa thi lần nào" }) : null,
    has("tracker") ? statCard({ icon: "📊", num: `${mx.pct}%`, label: "Ma trận năng lực", href: "#/tracker",
      extra: `${mx.done}/${mx.total} tiêu chí` }) : null,
    streakCard(st),
  ].filter(Boolean);
  page.append(h("div", { class: "grid grid-auto" }, cards));

  // ---- Khu vực học tập ----
  const areas = [
    has("guide") ? area("🧭", "Hướng dẫn học", fp ? `${fp.total} bước theo thứ tự khuyến nghị, cách học hiệu quả, bẫy phương pháp và tiêu chí hoàn thành.` : "Cách học lĩnh vực này.", "#/guide") : null,
    has("certs") ? area("🎓", "Chứng chỉ K8s", "So sánh KCNA, KCSA, CKAD, CKA, CKS: hình thức thi, tỷ trọng domain và lộ trình gợi ý.", "#/certs") : null,
    has("roadmap") ? area("🗺️", "Lộ trình học", `${rm.total} bài học chi tiết trong ${rm.per.length} track — tick đến đâu lưu đến đó.`, "#/roadmap") : null,
    has("docs") ? area("📚", "Thư viện tài liệu", `${getDocs(fieldKey).length} tài liệu theo sách và Phần — hướng dẫn đọc, mục lục, đánh dấu đã đọc, đọc liền mạch sang lĩnh vực khác.`, "#/docs") : null,
    has("tracker") ? area("📊", "Ma trận năng lực", `${mx.total} tiêu chí tự đánh giá theo 4 cấp độ, nhóm theo ${getMatrices(fieldKey)[0]?.modules.length ?? 0} module năng lực.`, "#/tracker") : null,
    has("commands") ? area("⚡", "Thực hành nhanh", "Tra cứu khi làm lab: lệnh, YAML mẫu, quy trình thuộc lòng, thẻ trước giờ thi. Chế độ gọn mở cạnh terminal.", "#/commands") : null,
    has("flashcards") ? area("🃏", "Flashcards", `Ôn ${fl.total} thẻ theo phương pháp lặp lại ngắt quãng (spaced repetition).`, "#/flashcards") : null,
    has("quiz") ? area("✅", "Trắc nghiệm", `${qz.total} câu hỏi có giải thích chi tiết từng câu.`, "#/quiz") : null,
    has("exam") ? area("⏱️", "Thi thử", "Mô phỏng áp lực phòng thi: bấm giờ, đánh dấu câu, chấm điểm theo domain.", "#/exam") : null,
    has("labs") ? area("🧪", "Labs thực hành", `${labs.length} bài lab kiểu đề thật kèm lời giải và cách verify.`, "#/labs") : null,
  ].filter(Boolean);
  page.append(sectionTitle("Khu vực học tập", areas.length), h("div", { class: "grid grid-2" }, areas));

  // ---- Các lĩnh vực khác (bấm để chuyển) ----
  const others = FIELD_ORDER.filter((id) => id !== fieldKey);
  page.append(sectionTitle("Lĩnh vực khác", others.length,
    h("span", { class: "faint" }, "Bấm để chuyển · hoặc dùng bộ chọn ở thanh bên")));
  const grid = h("div", { class: "grid grid-auto-sm" });
  for (const id of others) {
    const f = FIELDS[id];
    const pct = fieldPct(id);
    const sum = fieldSummary(id);
    grid.append(h("button", { class: "card card-link field-card", type: "button", onclick: () => goToField(id) },
      h("span", { class: "f-ico" }, f.icon),
      h("span", { class: "f-txt" },
        h("strong", {}, f.label),
        h("small", {}, sum.text),
        h("span", { class: `progress thin${pct >= 100 ? " green" : ""}` }, h("span", { style: `width:${pct}%` })))));
  }
  page.append(grid);

  root.append(page);
}

// Thẻ "Con đường của bạn": dải lĩnh vực theo thứ tự học, lĩnh vực hiện tại nổi bật,
// mỗi nút có % và bấm được; nút "Kế tiếp" dẫn sang lĩnh vực tiếp theo.
function pathCard(fieldKey) {
  const pos = positionOfField(fieldKey);
  if (!pos) return null;
  const p = PATHS[pos.path];
  const node = (id, extraCls = "") => {
    const f = FIELDS[id];
    const pct = fieldPct(id);
    return h("a", {
      class: `path-node${id === fieldKey ? " hl" : ""}${pct >= 100 ? " done" : ""}${extraCls}`,
      href: "#/", title: f.desc,
      onclick: (e) => { e.preventDefault(); goToField(id); },
    }, `${f.icon} ${f.label}`, h("small", {}, `${pct}%`));
  };
  const flow = h("div", { class: "path-flow" });
  p.fields.forEach((id, i) => {
    if (i) flow.append(h("span", { class: "path-arrow" }, "→"));
    flow.append(node(id));
  });
  if (p.foundation.length) {
    flow.append(h("span", { class: "path-arrow", title: "Nền tuỳ chọn" }, "⋯"));
    for (const id of p.foundation) flow.append(node(id, " foundation"));
  }
  const nextId = pos.next;
  return h("div", { class: "card path-card mb-4" },
    h("div", { class: "card-head" },
      h("strong", {}, `${p.icon} Con đường ${p.label}`),
      h("span", { class: "faint" }, pos.isFoundation ? "nền tuỳ chọn" : `bước ${pos.index + 1}/${pos.total}`)),
    h("p", { class: "muted small mt0 mb-2" }, p.desc),
    flow,
    h("div", { class: "flex flex-wrap mt-3" },
      nextId ? h("button", { class: "btn btn-sm", type: "button", onclick: () => goToField(nextId) }, `Lĩnh vực kế tiếp: ${FIELDS[nextId].icon} ${FIELDS[nextId].label} →`) : null,
      pos.prev ? h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => goToField(pos.prev) }, `← ${FIELDS[pos.prev].label}`) : null,
      h("a", { class: "btn btn-ghost btn-sm", href: "#/guide" }, "Cách học lĩnh vực này")));
}

// Thẻ cho trục Senior Java: 4 giai đoạn → con đường tương ứng, tiến độ từng giai đoạn.
function spineCard() {
  const tracks = getTracks(SPINE.field);
  const stages = SPINE.stages.map((s, i) => {
    const t = tracks.find((x) => x.id === s.track);
    const st = t ? trackStats(t) : null;
    const p = s.path ? PATHS[s.path] : null;
    return h("div", { class: "spine-stage" },
      h("span", { class: "num" }, `Giai đoạn ${i + 1}`),
      h("strong", {}, t?.name ?? s.track),
      st ? h("div", { class: `progress thin${st.pct >= 100 ? " green" : ""}` }, h("span", { style: `width:${st.pct}%` })) : null,
      h("span", { class: "faint" }, st ? `${st.done}/${st.total} mục · ${st.pct}%` : ""),
      p
        ? h("button", { class: "badge badge-purple", type: "button", title: "Mở con đường tương ứng", onclick: () => goToField(p.fields[0]) }, `${p.icon} ${p.label} →`)
        : h("span", { class: "badge", title: s.note ?? "" }, "DevOps · theo tài liệu giai đoạn"),
      t ? h("a", { class: "btn btn-ghost btn-sm", href: `#/roadmap/${t.id}`, style: "align-self:flex-start" }, "Mở lộ trình") : null);
  });
  return h("div", { class: "card path-card mb-4" },
    h("div", { class: "card-head" },
      h("strong", {}, `🧭 ${SPINE.label} — 24 tháng qua ba con đường`),
      h("span", { class: "faint" }, "mỗi giai đoạn mượn một con đường")),
    h("p", { class: "muted small mt0 mb-3" }, SPINE.desc),
    h("div", { class: "spine-stages" }, stages));
}

function streakCard(st) {
  const dots = h("div", { class: "streak-dots", title: "14 ngày gần nhất" },
    st.days.map((d) => h("span", { class: `${d.n ? "on" : ""}${d.today ? " today" : ""}`, title: `${d.key}: ${d.n} thao tác` })));
  return h("div", { class: "card stat-card" },
    h("div", { class: "stat-ico" }, "🔥"),
    h("div", { class: `stat-num${st.current ? " text-amber" : ""}` }, `${st.current} ngày`),
    h("div", { class: "stat-label" }, "Chuỗi ngày học"),
    h("div", { class: "stat-extra" }, st.best ? `dài nhất ${st.best} · ${st.totalDays} ngày có học` : "tick bài, chấm thẻ hay đánh dấu đã đọc để bắt đầu"),
    dots);
}

function area(icon, title, desc, href) {
  return h("a", { class: "card card-link", href },
    h("div", { class: "flex" },
      h("span", { style: "font-size:22px" }, icon),
      h("strong", {}, title)),
    h("p", { class: "muted small mt-2 mb0" }, desc));
}
