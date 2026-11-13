// Mermaid nạp lười, dùng chung cho mọi view render markdown (docs, practice).

let mermaidPromise = null;

function loadMermaid() {
  if (!mermaidPromise) {
    // Dùng bản UMD nhúng kèm trong js/vendor/ (không phải CDN) để app chạy được
    // trên server nội bộ không ra internet. Bản ESM của mermaid bị code-split
    // thành ~1.000 tệp chunk nên không nhúng kèm được.
    mermaidPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = new URL("../vendor/mermaid.min.js", import.meta.url).href;
      s.onload = () =>
        window.mermaid
          ? resolve(window.mermaid)
          : reject(new Error("mermaid nạp xong nhưng không thấy window.mermaid"));
      s.onerror = () => reject(new Error("không nạp được js/vendor/mermaid.min.js"));
      document.head.append(s);
    });
  }
  return mermaidPromise;
}

export async function renderMermaidBlocks(container) {
  const blocks = container.querySelectorAll(".mermaid-block");
  if (!blocks.length) return;

  let mermaid;
  try {
    mermaid = await loadMermaid();
  } catch {
    return; // Offline / CDN lỗi — giữ nguyên khối nguồn làm fallback.
  }

  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    securityLevel: "loose",
    fontFamily: "inherit",
  });

  let n = 0;
  for (const block of blocks) {
    if (!block.isConnected) return; // đã điều hướng sang trang khác
    const src = block.querySelector(".mermaid-src")?.textContent || "";
    try {
      const { svg } = await mermaid.render(`mmd-${Date.now()}-${n++}`, src);
      block.innerHTML = svg;
      block.classList.add("rendered");
    } catch {
      /* sơ đồ lỗi cú pháp — giữ nguồn */
    }
  }
}

