// ⚙️ Cài đặt & tiến độ — module toàn cục (mọi lĩnh vực): giao diện, cỡ chữ đọc,
// xuất/nhập toàn bộ tiến độ (localStorage kubeprep.*), dung lượng, đặt lại.

import { h, pageHead, toast, confirmDialog, sectionTitle } from "../lib/ui.js";
import { store, NS } from "../lib/store.js";
import { FIELDS, FIELD_ORDER } from "../data/fields.js";
import { roadmapStats, docsStats, flashStats, quizStats, matrixStats, examStats } from "../lib/stats.js";
import { streakInfo } from "../lib/activity.js";

const FONT_STEPS = [0.9, 1, 1.1, 1.2, 1.3];

export function currentThemePref() {
  const saved = store.get("theme");
  return saved === "light" || saved === "dark" ? saved : "system";
}

export function setThemePref(pref) {
  if (pref === "light" || pref === "dark") store.set("theme", pref);
  else store.remove("theme");
  window.dispatchEvent(new CustomEvent("devprep:theme", { detail: pref === "system" ? "" : pref }));
}

export function currentFontScale() {
  const v = parseFloat(store.get("reader.fontScale", 1));
  return Number.isFinite(v) && v >= 0.8 && v <= 1.4 ? v : 1;
}

export function setFontScale(v) {
  const scale = Math.min(1.3, Math.max(0.9, Math.round(v * 10) / 10));
  store.set("reader.fontScale", scale);
  document.documentElement.style.setProperty("--reader-scale", String(scale));
  return scale;
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const KEY_LABELS = {
  "roadmap.checked": "Tiến độ lộ trình",
  "tracker.checked": "Ma trận năng lực",
  "flash.srs": "Lịch ôn flashcard",
  "quiz.stats": "Thống kê trắc nghiệm",
  "exam.history": "Lịch sử thi thử",
  "docs.read": "Tài liệu đã đọc",
  "recent": "Mục mở gần đây",
  "activity": "Chuỗi ngày học",
  "guide.manual": "Bước hướng dẫn tự tick",
  "ref.pins": "Mục đã ghim (Thực hành nhanh)",
  "ref.cert": "Bộ lọc chứng chỉ",
  "ref.compact": "Chế độ gọn",
  "theme": "Giao diện",
  "field": "Lĩnh vực đang chọn",
  "reader.fontScale": "Cỡ chữ đọc",
};

export function render(root) {
  const page = h("div", { class: "page" });
  page.append(pageHead("⚙️ Cài đặt & tiến độ",
    "Mọi thứ lưu ngay trên trình duyệt này. Xuất tệp JSON để mang tiến độ sang máy khác hoặc sao lưu trước khi xoá cache."));

  // ---- Giao diện ----
  const themeSeg = h("div", { class: "seg", role: "group", "aria-label": "Giao diện" });
  const themeOpts = [["light", "☀️ Sáng"], ["dark", "🌙 Tối"], ["system", "🖥️ Theo hệ thống"]];
  function syncTheme() {
    const cur = currentThemePref();
    themeSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === cur));
  }
  for (const [v, label] of themeOpts) {
    themeSeg.append(h("button", { type: "button", "data-v": v, onclick: () => { setThemePref(v); syncTheme(); } }, label));
  }
  syncTheme();

  const fontVal = h("strong", {}, `${Math.round(currentFontScale() * 100)}%`);
  const fontSeg = h("div", { class: "reader-controls", role: "group", "aria-label": "Cỡ chữ đọc" },
    h("button", { type: "button", title: "Nhỏ hơn", onclick: () => { fontVal.textContent = `${Math.round(setFontScale(currentFontScale() - 0.1) * 100)}%`; } }, "A−"),
    h("button", { type: "button", title: "Mặc định", onclick: () => { fontVal.textContent = `${Math.round(setFontScale(1) * 100)}%`; } }, "100%"),
    h("button", { type: "button", title: "Lớn hơn", onclick: () => { fontVal.textContent = `${Math.round(setFontScale(currentFontScale() + 0.1) * 100)}%`; } }, "A+"));

  page.append(
    sectionTitle("Giao diện"),
    h("div", { class: "card" },
      h("div", { class: "settings-row" },
        h("div", { class: "s-label" }, h("strong", {}, "Chế độ màu"), h("small", {}, "Theo hệ thống sẽ tự đổi khi máy đổi sáng/tối.")),
        themeSeg),
      h("div", { class: "settings-row" },
        h("div", { class: "s-label" }, h("strong", {}, "Cỡ chữ khi đọc"), h("small", {}, "Áp cho tài liệu và bài học trong lộ trình. Hiện: ", fontVal)),
        fontSeg)));

  // ---- Tổng quan tiến độ mọi lĩnh vực ----
  const st = streakInfo();
  const rows = FIELD_ORDER.map((id) => {
    const f = FIELDS[id];
    const rm = roadmapStats(id), dc = docsStats(id), fl = flashStats(id), qz = quizStats(id), mx = matrixStats(id);
    const bits = [];
    if (rm.total) bits.push(`lộ trình ${rm.done}/${rm.total}`);
    if (dc.total) bits.push(`đọc ${dc.read}/${dc.total}`);
    if (fl.total) bits.push(`thẻ ${fl.learned}/${fl.total}`);
    if (qz.total) bits.push(`câu hỏi ${qz.seen}/${qz.total}`);
    if (mx.total) bits.push(`tiêu chí ${mx.done}/${mx.total}`);
    return h("tr", {},
      h("td", {}, `${f.icon} ${f.label}`),
      h("td", {}, bits.join(" · ") || "—"));
  });
  const ex = examStats();
  page.append(
    sectionTitle("Tiến độ đã lưu"),
    h("div", { class: "card" },
      h("p", { class: "muted small mt0" },
        `🔥 Chuỗi hiện tại ${st.current} ngày · dài nhất ${st.best} ngày · ${st.totalDays} ngày có học` +
        (ex.count ? ` · ${ex.count} lượt thi thử (đậu ${ex.passCount})` : "")),
      h("div", { class: "table-wrap" }, h("table", { class: "storage-table" }, h("tbody", {}, rows)))));

  // ---- Xuất / nhập ----
  const fileInput = h("input", { type: "file", accept: "application/json,.json", hidden: true });
  const modeSeg = h("div", { class: "seg" });
  let importMode = "merge";
  for (const [v, label] of [["merge", "Gộp vào hiện có"], ["replace", "Thay thế toàn bộ"]]) {
    const b = h("button", { type: "button", class: v === importMode ? "on" : "", onclick: () => {
      importMode = v;
      modeSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    } }, label);
    modeSeg.append(b);
  }

  function doExport() {
    const data = store.exportAll();
    const payload = { app: "devprep", version: 1, exportedAt: new Date().toISOString(), keys: Object.keys(data).length, data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: `devprep-tien-do-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast(`Đã xuất ${payload.keys} khoá tiến độ`, "success");
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast("Tệp không phải JSON hợp lệ", "error");
      return;
    }
    const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
    const keys = Object.keys(data).filter((k) => k.startsWith(NS));
    if (!keys.length) {
      toast("Tệp không chứa tiến độ DevPrep (không có khoá kubeprep.*)", "error");
      return;
    }
    const ok = await confirmDialog(
      importMode === "replace"
        ? `Xoá toàn bộ tiến độ hiện tại và thay bằng ${keys.length} khoá trong tệp? Không hoàn tác được.`
        : `Gộp ${keys.length} khoá trong tệp vào tiến độ hiện tại? Khoá trùng sẽ bị ghi đè bằng giá trị trong tệp.`,
      { title: "Nhập tiến độ", okLabel: "Nhập", danger: importMode === "replace" });
    if (!ok) return;
    const n = store.importAll(data, { replace: importMode === "replace" });
    toast(`Đã nhập ${n} khoá — tải lại trang…`, "success");
    setTimeout(() => location.reload(), 700);
  });

  page.append(
    sectionTitle("Sao lưu & đồng bộ"),
    h("div", { class: "card" },
      h("div", { class: "settings-row" },
        h("div", { class: "s-label" }, h("strong", {}, "Xuất tiến độ"), h("small", {}, "Một tệp JSON chứa mọi khoá kubeprep.* — lộ trình, flashcard, trắc nghiệm, thi thử, ma trận, tài liệu đã đọc.")),
        h("button", { class: "btn btn-primary", type: "button", onclick: doExport }, "⬇️ Xuất JSON")),
      h("div", { class: "settings-row" },
        h("div", { class: "s-label" }, h("strong", {}, "Nhập tiến độ"), h("small", {}, "Chọn tệp đã xuất từ máy khác. Chỉ nhận khoá đúng namespace; giá trị hỏng bị bỏ qua.")),
        h("div", { class: "flex flex-wrap" }, modeSeg,
          h("button", { class: "btn", type: "button", onclick: () => fileInput.click() }, "⬆️ Chọn tệp…"), fileInput))));

  // ---- Dung lượng & đặt lại ----
  const sizes = store.sizes();
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  const sizeRows = Object.entries(sizes).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
    h("tr", {}, h("td", {}, KEY_LABELS[k] ?? k), h("td", {}, fmtBytes(v))));

  async function resetAll() {
    const ok = await confirmDialog(
      "Xoá TOÀN BỘ tiến độ trên trình duyệt này (lộ trình, flashcard, trắc nghiệm, thi thử, ma trận, tài liệu đã đọc, cài đặt)? Hãy xuất JSON trước nếu cần giữ lại.",
      { title: "Đặt lại toàn bộ", okLabel: "Xoá hết", danger: true });
    if (!ok) return;
    store.clearAll();
    toast("Đã xoá toàn bộ tiến độ — tải lại trang…", "success");
    setTimeout(() => location.reload(), 600);
  }

  page.append(
    sectionTitle("Dung lượng đã dùng", fmtBytes(total)),
    h("div", { class: "card" },
      sizeRows.length
        ? h("div", { class: "table-wrap" }, h("table", { class: "storage-table" }, h("tbody", {}, sizeRows)))
        : h("p", { class: "muted small mt0 mb0" }, "Chưa có gì được lưu."),
      h("div", { class: "settings-row mt-3" },
        h("div", { class: "s-label" }, h("strong", { class: "text-red" }, "Đặt lại toàn bộ"), h("small", {}, "Xoá sạch mọi khoá kubeprep.* trên trình duyệt này. Không hoàn tác được.")),
        h("button", { class: "btn btn-danger", type: "button", onclick: resetAll }, "🗑️ Xoá hết"))));

  page.append(
    sectionTitle("Về DevPrep"),
    h("div", { class: "card" },
      h("p", { class: "mt0" }, "Web app tĩnh, không backend, không tài khoản. Mã nguồn và toàn bộ nội dung nằm trong một repo Git; tiến độ chỉ ở trình duyệt của bạn."),
      h("p", { class: "muted small mb0" }, "Phím tắt: ", h("kbd", { class: "kbd" }, "Ctrl/⌘ K"), " tìm kiếm · ", h("kbd", { class: "kbd" }, "?"), " bảng phím tắt · ", h("kbd", { class: "kbd" }, "Space"), " lật flashcard.")));

  root.append(page);
}
