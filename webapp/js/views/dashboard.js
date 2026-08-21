// Bảng điều khiển — tổng quan tiến độ học tập.

import { h } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { tracks } from "../data/roadmap.js";
import { flashcards } from "../data/flashcards.js";
import { questions } from "../data/questions.js";
import { labs } from "../data/labs.js";

function roadmapStats() {
  const checked = store.get("roadmap.checked", {});
  const per = tracks.map((t) => {
    const items = t.weeks.flatMap((w) => w.items);
    const done = items.filter((it) => checked[it.id]).length;
    return { label: t.label, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  });
  const done = per.reduce((a, p) => a + p.done, 0);
  const total = per.reduce((a, p) => a + p.total, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, per };
}

function flashStats() {
  const srs = store.get("flash.srs", {});
  const now = Date.now();
  let due = 0, learned = 0;
  for (const c of flashcards) {
    const e = srs[c.id];
    if (!e) continue;
    learned++;
    if (e.due <= now) due++;
  }
  return { due, learned, fresh: flashcards.length - learned, total: flashcards.length };
}

function quizStats() {
  const stats = store.get("quiz.stats", {});
  let seen = 0, correct = 0;
  for (const q of questions) {
    const s = stats[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (s.correct > 0) correct++;
  }
  return { seen, correct, total: questions.length, acc: seen ? Math.round((correct / seen) * 100) : null };
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
  const rm = roadmapStats();
  const fl = flashStats();
  const qz = quizStats();
  const ex = examStats();

  root.append(
    h("div", { class: "page" },
      h("div", { class: "hero" },
        h("h1", {}, "☸️ KubePrep — luyện thi chứng chỉ Kubernetes"),
        h("p", {},
          "Học theo lộ trình, tra cứu tài liệu và lệnh kubectl, ghi nhớ bằng flashcards, ",
          "kiểm tra kiến thức với trắc nghiệm, thi thử có bấm giờ và labs mô phỏng đề thật. ",
          "Tiến độ được lưu ngay trên trình duyệt của bạn."),
        h("div", { class: "flex flex-wrap", style: "margin-top:16px" },
          h("a", { class: "btn btn-primary", href: "#/roadmap" }, "🗺️ Bắt đầu lộ trình"),
          h("a", { class: "btn", href: "#/exam" }, "⏱️ Thi thử ngay"),
          h("a", { class: "btn", href: "#/docs" }, "📚 Đọc tài liệu"),
        )
      ),

      h("div", { class: "grid grid-4" },
        statCard(`${rm.pct}%`, "Lộ trình hoàn thành", "#/roadmap",
          rm.per.map((p) => `${p.label} ${p.pct}%`).join(" · ")),
        statCard(String(fl.due), "Flashcard đến hạn ôn", "#/flashcards", `${fl.fresh} thẻ chưa học · ${fl.total} tổng`),
        statCard(qz.acc == null ? "—" : `${qz.acc}%`, "Độ chính xác trắc nghiệm", "#/quiz", `đã gặp ${qz.seen}/${qz.total} câu`),
        statCard(ex.best == null ? "—" : `${ex.best}%`, "Điểm thi thử tốt nhất", "#/exam", ex.count ? `${ex.count} lượt thi` : "chưa thi lần nào"),
      ),

      h("h2", { style: "margin:28px 0 12px;font-size:19px" }, "Khu vực học tập"),
      h("div", { class: "grid grid-2" },
        area("🎓", "Chứng chỉ K8s", "So sánh KCNA, KCSA, CKAD, CKA, CKS: hình thức thi, tỷ trọng domain và lộ trình gợi ý.", "#/certs"),
        area("📚", "Thư viện tài liệu", "Trọn bộ CKAD/CKA/CKS + series blog Java & Spring Boot Scalability (10 bài) — có mục lục, sơ đồ mermaid, copy nhanh.", "#/docs"),
        area("⚡", "Thực hành nhanh", "Tra cứu khi làm lab: 130 lệnh, 48 YAML mẫu, 16 quy trình thuộc lòng, thẻ trước giờ thi — có ghim và chế độ gọn cạnh terminal.", "#/commands"),
        area("🃏", "Flashcards", `Ôn ${fl.total} thẻ theo phương pháp lặp lại ngắt quãng (spaced repetition).`, "#/flashcards"),
        area("✅", "Trắc nghiệm", `${qz.total} câu hỏi theo từng domain, có giải thích chi tiết từng câu.`, "#/quiz"),
        area("⏱️", "Thi thử", "Mô phỏng áp lực phòng thi: bấm giờ, đánh dấu câu, chấm điểm theo domain.", "#/exam"),
        area("🧪", "Labs thực hành", `${labs.length} bài lab kiểu đề thật (CKAD 100% thực hành) kèm lời giải và cách verify.`, "#/labs"),
        area("🗺️", "Lộ trình học", "3 giáo trình CKAD / CKA / CKS với 154 bài học chi tiết: lý thuyết dễ hiểu, lệnh mẫu, bẫy thường gặp — tick đến đâu lưu đến đó.", "#/roadmap"),
      ),

      h("p", { class: "faint", style: "margin-top:26px" },
        "💡 Mẹo: trong phòng thi CKAD bạn được mở kubernetes.io/docs — hãy luyện thói quen tra cứu nhanh ngay từ bây giờ.")
    )
  );
}

function area(icon, title, desc, href) {
  return h("a", { class: "card card-link", href },
    h("div", { class: "flex" },
      h("span", { style: "font-size:22px" }, icon),
      h("strong", {}, title)),
    h("p", { class: "muted small", style: "margin:8px 0 0" }, desc)
  );
}
