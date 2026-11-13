// Đồng hồ cho module Thực hành: bấm giờ (stopwatch) và đếm ngược (countdown).
// Lưu ý: interval tự dừng ở nhịp đầu nếu `el` chưa gắn vào DOM, nên gắn `el` ngay sau khi tạo.
// Cả hai trả về { el, ... }; stop() gọi nhiều lần vẫn an toàn. Interval tự dừng
// khi `el` bị gỡ khỏi trang (đổi route) để không rò timer.
import { h, fmtClock } from "./ui.js";

function ticker(el, step) {
  let id = null;
  const stop = () => {
    if (id != null) { clearInterval(id); id = null; }
  };
  const start = () => {
    if (id != null) return;
    id = setInterval(() => {
      if (!el.isConnected) { stop(); return; }
      step();
    }, 1000);
  };
  return { start, stop };
}

// Bấm giờ chạy ngay khi tạo; đổi sang màu đỏ khi quá limitSec (nếu có).
export function createStopwatch({ limitSec } = {}) {
  let elapsed = 0;
  const el = h("span", { class: "pr-timer", role: "timer" }, fmtClock(0));
  const render = () => {
    el.textContent = limitSec ? `${fmtClock(elapsed)} / ${fmtClock(limitSec)}` : fmtClock(elapsed);
    el.classList.toggle("over", !!limitSec && elapsed > limitSec);
  };
  render();
  const t = ticker(el, () => { elapsed += 1; render(); });
  t.start();
  return { el, stop: t.stop };
}

// Đếm ngược; start() bắt đầu, onEnd() gọi đúng một lần khi về 0.
export function createCountdown({ totalSec, onEnd } = {}) {
  let left = totalSec;
  let ended = false;
  const el = h("span", { class: "pr-timer", role: "timer" }, fmtClock(left));
  const render = () => {
    el.textContent = fmtClock(Math.max(0, left));
    el.classList.toggle("over", left <= 300);
  };
  render();
  const t = ticker(el, () => {
    left -= 1;
    render();
    if (left <= 0) {
      t.stop();
      if (!ended) { ended = true; if (typeof onEnd === "function") onEnd(); }
    }
  });
  return { el, start: t.start, stop: t.stop };
}
