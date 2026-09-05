// Labs thực hành kiểu đề thi CKAD — đề bài, gợi ý, lời giải ẩn, cách verify,
// kèm đồng hồ bấm giờ so với thời gian mục tiêu.

import { h, pageHead, mdInto, inlineMd, domainBadge, diffBadge, fmtClock } from "../lib/ui.js";
import { labs } from "../data/kubernetes/labs.js";
import { DOMAINS, DIFFICULTY } from "../data/meta.js";

let watchId = null;

export function cleanup() {
  if (watchId) { clearInterval(watchId); watchId = null; }
}

export function render(root, params) {
  const id = params[0];
  const lab = labs.find((l) => l.id === id);
  if (lab) return renderLab(root, lab);
  renderIndex(root);
}

function renderIndex(root) {
  cleanup();
  const page = h("div", { class: "page" });
  page.append(pageHead(
    "🧪 Labs thực hành",
    `${labs.length} bài mô phỏng đề CKAD (100% thực hành). Mở cluster thật (minikube/kind/Killercoda), tự làm trong thời gian mục tiêu rồi mới xem lời giải.`
  ));

  let domain = null;
  const chipRow = h("div", { class: "chip-row", style: "margin-bottom:16px" });
  const allChip = h("button", { class: "chip on" }, "Tất cả");
  allChip.addEventListener("click", () => { domain = null; sync(); });
  chipRow.append(allChip);
  const chips = new Map();
  for (const key of Object.keys(DOMAINS)) {
    const count = labs.filter((l) => l.domain === key).length;
    if (!count) continue;
    const chip = h("button", { class: "chip" }, `${DOMAINS[key].short} (${count})`);
    chip.addEventListener("click", () => { domain = domain === key ? null : key; sync(); });
    chips.set(key, chip);
    chipRow.append(chip);
  }

  const list = h("div", {});
  function sync() {
    allChip.classList.toggle("on", domain === null);
    chips.forEach((c, k) => c.classList.toggle("on", k === domain));
    list.innerHTML = "";
    for (const lab of labs.filter((l) => !domain || l.domain === domain)) {
      list.append(
        h("a", { class: "card card-link", href: `#/labs/${lab.id}`, style: "margin-bottom:10px" },
          h("div", { class: "lab-row" },
            h("div", { class: "grow" },
              h("div", { class: "lab-title" }, `${lab.id.replace("lab", "Lab ")}. ${lab.title}`),
              h("div", { class: "flex flex-wrap", style: "margin-top:6px" },
                domainBadge(lab.domain), diffBadge(lab.difficulty),
                h("span", { class: "badge" }, `🎯 ${lab.timeLimitMin} phút`))),
            h("span", { class: "faint" }, "Làm bài →")))
      );
    }
  }
  sync();

  page.append(chipRow, list);
  root.append(page);
}

function renderLab(root, lab) {
  cleanup();
  const idx = labs.indexOf(lab);
  const page = h("div", { class: "page" });

  page.append(
    h("div", { class: "breadcrumb" },
      h("a", { href: "#/labs" }, "Labs"), " / ", lab.title),
    h("div", { class: "page-head" },
      h("h1", {}, `${lab.id.replace("lab", "Lab ")}. ${lab.title}`),
      h("div", { class: "flex flex-wrap", style: "margin-top:8px" },
        domainBadge(lab.domain), diffBadge(lab.difficulty),
        h("span", { class: "badge" }, `🎯 Mục tiêu: ${lab.timeLimitMin} phút`)))
  );

  // Đồng hồ bấm giờ
  let elapsed = 0;
  let running = false;
  const clock = h("span", { class: "exam-timer" }, "00:00");
  const startBtn = h("button", { class: "btn btn-sm btn-primary" }, "▶ Bắt đầu");
  startBtn.addEventListener("click", () => {
    running = !running;
    startBtn.textContent = running ? "⏸ Tạm dừng" : "▶ Tiếp tục";
    if (running && !watchId) {
      watchId = setInterval(() => {
        if (!running) return;
        elapsed++;
        clock.textContent = fmtClock(elapsed);
        clock.classList.toggle("low", elapsed > lab.timeLimitMin * 60);
      }, 1000);
    }
  });
  const resetBtn = h("button", {
    class: "btn btn-sm",
    onclick: () => { elapsed = 0; clock.textContent = "00:00"; clock.classList.remove("low"); },
  }, "↺");
  page.append(
    h("div", { class: "exam-topbar" },
      clock,
      h("span", { class: "muted small grow" }, "Tự làm trên cluster của bạn trước khi mở lời giải."),
      startBtn, resetBtn)
  );

  // Đề bài
  const scenario = h("div", { class: "prose" });
  mdInto(scenario, lab.scenario);
  const taskList = h("ol", { style: "margin:8px 0 0;padding-left:22px" });
  lab.tasks.forEach((t) => {
    taskList.append(h("li", { style: "margin:6px 0", html: inlineMd(t) }));
  });
  page.append(
    h("div", { class: "card" },
      h("strong", {}, "📋 Đề bài"),
      scenario,
      h("div", { style: "font-weight:700;margin-top:12px" }, "Yêu cầu:"),
      taskList)
  );

  // Gợi ý từng bước
  if (lab.hints && lab.hints.length) {
    const hintsWrap = h("div", {});
    lab.hints.forEach((hint, i) => {
      hintsWrap.append(
        h("details", { class: "reveal" },
          h("summary", {}, `💡 Gợi ý ${i + 1}`),
          h("div", { class: "reveal-body", html: inlineMd(hint) }))
      );
    });
    page.append(hintsWrap);
  }

  // Lời giải + verify
  const solBody = h("div", { class: "reveal-body prose" });
  mdInto(solBody, lab.solution);
  const verifyBody = h("div", { class: "reveal-body prose" });
  mdInto(verifyBody, lab.verify);
  page.append(
    h("details", { class: "reveal" },
      h("summary", {}, "🔓 Xem lời giải"),
      solBody),
    h("details", { class: "reveal" },
      h("summary", {}, "✔️ Cách kiểm chứng (verify)"),
      verifyBody)
  );

  // Điều hướng
  const prev = labs[idx - 1];
  const next = labs[idx + 1];
  page.append(
    h("div", { class: "flex spread", style: "margin-top:22px" },
      prev ? h("a", { class: "btn", href: `#/labs/${prev.id}` }, "← Lab trước") : h("span", {}),
      next ? h("a", { class: "btn", href: `#/labs/${next.id}` }, "Lab sau →") : h("span", {}))
  );

  root.append(page);
}
