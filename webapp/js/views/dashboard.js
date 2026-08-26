// Bảng điều khiển — tổng quan tiến độ học tập.

import { h } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getTracks, getFlashcards, getQuestions, getDocs } from "../data/index.js";
import { FIELDS, FIELD_ORDER, moduleAllowed } from "../data/fields.js";
import { labs } from "../data/labs.js";
import { currentField } from "../lib/field.js";

function roadmapStats(fieldKey) {
  const checked = store.get("roadmap.checked", {});
  const per = getTracks(fieldKey).map((t) => {
    const items = t.weeks.flatMap((w) => w.items);
    const done = items.filter((it) => checked[it.id]).length;
    return { label: t.label, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  });
  const done = per.reduce((a, p) => a + p.done, 0);
  const total = per.reduce((a, p) => a + p.total, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, per };
}

function flashStats(fieldKey) {
  const srs = store.get("flash.srs", {});
  const now = Date.now();
  const cards = getFlashcards(fieldKey);
  let due = 0, learned = 0;
  for (const c of cards) {
    const e = srs[c.id];
    if (!e) continue;
    learned++;
    if (e.due <= now) due++;
  }
  return { due, learned, fresh: cards.length - learned, total: cards.length };
}

function quizStats(fieldKey) {
  const stats = store.get("quiz.stats", {});
  const qs = getQuestions(fieldKey);
  let seen = 0, correct = 0;
  for (const q of qs) {
    const s = stats[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (s.correct > 0) correct++;
  }
  return { seen, correct, total: qs.length, acc: seen ? Math.round((correct / seen) * 100) : null };
}

function examStats() {
  const hist = store.get("exam.history", []);
  if (!hist.length) return { best: null, count: 0 };
  return { best: Math.max(...hist.map((e) => e.pct)), count: hist.length };
}

function statCard(num, label, href, extra) {
  return h("a", { class: "card card-link", href },
    h("div", { class: "stat-num" }, num),
    h("div", { class: "stat-label" }, label),
    extra ? h("div", { class: "faint", style: "margin-top:4px" }, extra) : null
  );
}

export function render(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const rm = roadmapStats(fieldKey);
  const fl = flashStats(fieldKey);
  const qz = quizStats(fieldKey);
  const ex = examStats();
  const has = (m) => moduleAllowed(fieldKey, m);

  const page = h("div", { class: "page" },
    h("div", { class: "hero" },
      h("h1", {}, "📚 DevPrep — học, ôn tập và luyện thi"),
      h("p", {},
        "Ba lĩnh vực: Kubernetes & chứng chỉ, Lập trình hệ thống, Java & Spring Boot Scalability. ",
        "Chọn lĩnh vực ở thanh bên để đổi nội dung. Tiến độ được lưu ngay trên trình duyệt của bạn."),
      h("div", { class: "flex flex-wrap", style: "margin-top:16px" },
        has("roadmap") ? h("a", { class: "btn btn-primary", href: "#/roadmap" }, "🗺️ Bắt đầu lộ trình") : null,
        has("exam") ? h("a", { class: "btn", href: "#/exam" }, "⏱️ Thi thử ngay") : null,
        h("a", { class: "btn", href: "#/docs" }, "📚 Đọc tài liệu"))));

  // Dải tổng quan 3 lĩnh vực
  const overview = h("div", { class: "grid grid-3", style: "margin-bottom:22px" });
  for (const id of FIELD_ORDER) {
    const f = FIELDS[id];
    const parts = [`${getDocs(id).length} tài liệu`];
    const t = getTracks(id).reduce((n, x) => n + x.weeks.flatMap((w) => w.items).length, 0);
    if (t) parts.push(`${t} bài học`);
    const c = getFlashcards(id).length;
    if (c) parts.push(`${c} thẻ`);
    const q = getQuestions(id).length;
    if (q) parts.push(`${q} câu hỏi`);
    overview.append(
      h("div", { class: `card${id === fieldKey ? " card-active" : ""}` },
        h("div", { class: "flex" },
          h("span", { style: "font-size:22px" }, f.icon),
          h("strong", {}, f.label)),
        h("p", { class: "muted small", style: "margin:8px 0 0" }, parts.join(" · "))));
  }
  page.append(overview);

  const cards = [
    statCard(`${rm.pct}%`, "Lộ trình hoàn thành", "#/roadmap",
      rm.per.map((p) => `${p.label} ${p.pct}%`).join(" · ") || "chưa có lộ trình"),
    has("flashcards")
      ? statCard(String(fl.due), "Flashcard đến hạn ôn", "#/flashcards", `${fl.fresh} thẻ chưa học · ${fl.total} tổng`)
      : null,
    has("quiz")
      ? statCard(qz.acc == null ? "—" : `${qz.acc}%`, "Độ chính xác trắc nghiệm", "#/quiz", `đã gặp ${qz.seen}/${qz.total} câu`)
      : null,
    has("exam")
      ? statCard(ex.best == null ? "—" : `${ex.best}%`, "Điểm thi thử tốt nhất", "#/exam", ex.count ? `${ex.count} lượt thi` : "chưa thi lần nào")
      : null,
  ].filter(Boolean);
  if (has("roadmap")) page.append(h("div", { class: "grid grid-4" }, cards));

  // Khu vực học tập — chỉ những module lĩnh vực này có
  const areas = [
    has("certs") ? area("🎓", "Chứng chỉ K8s", "So sánh KCNA, KCSA, CKAD, CKA, CKS: hình thức thi, tỷ trọng domain và lộ trình gợi ý.", "#/certs") : null,
    area("📚", "Thư viện tài liệu", `${getDocs(fieldKey).length} tài liệu của lĩnh vực ${field.label} — mục lục nổi, sơ đồ mermaid, ảnh minh hoạ, copy nhanh.`, "#/docs"),
    has("commands") ? area("⚡", "Thực hành nhanh", "Tra cứu khi làm lab: 130 lệnh, 48 YAML mẫu, 16 quy trình thuộc lòng, thẻ trước giờ thi.", "#/commands") : null,
    has("flashcards") ? area("🃏", "Flashcards", `Ôn ${fl.total} thẻ theo phương pháp lặp lại ngắt quãng (spaced repetition).`, "#/flashcards") : null,
    has("quiz") ? area("✅", "Trắc nghiệm", `${qz.total} câu hỏi có giải thích chi tiết từng câu.`, "#/quiz") : null,
    has("exam") ? area("⏱️", "Thi thử", "Mô phỏng áp lực phòng thi: bấm giờ, đánh dấu câu, chấm điểm theo domain.", "#/exam") : null,
    has("labs") ? area("🧪", "Labs thực hành", `${labs.length} bài lab kiểu đề thật kèm lời giải và cách verify.`, "#/labs") : null,
    has("roadmap") ? area("🗺️", "Lộ trình học", `${rm.total} bài học chi tiết — tick đến đâu lưu đến đó.`, "#/roadmap") : null,
  ].filter(Boolean);

  page.append(
    h("h2", { style: "margin:28px 0 12px;font-size:19px" }, "Khu vực học tập"),
    h("div", { class: "grid grid-2" }, areas));

  root.append(page);
}

function area(icon, title, desc, href) {
  return h("a", { class: "card card-link", href },
    h("div", { class: "flex" },
      h("span", { style: "font-size:22px" }, icon),
      h("strong", {}, title)),
    h("p", { class: "muted small", style: "margin:8px 0 0" }, desc)
  );
}
