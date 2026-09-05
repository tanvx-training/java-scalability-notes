// Tổng quan các chứng chỉ Kubernetes + lộ trình gợi ý.

import { h, pageHead, certBadge } from "../lib/ui.js";
import { certs, certPaths } from "../data/kubernetes/certs.js";

export function render(root) {
  const page = h("div", { class: "page page-wide" });

  page.append(pageHead(
    "🎓 Chứng chỉ Kubernetes",
    "5 chứng chỉ của CNCF / Linux Foundation — chọn đúng lộ trình để không học lan man. Giá và phiên bản thi thay đổi theo thời gian, hãy kiểm tra trang chính thức trước khi đăng ký."
  ));

  // Lộ trình gợi ý
  const paths = h("div", { class: "grid grid-3", style: "margin-bottom:22px" });
  for (const p of certPaths) {
    paths.append(
      h("div", { class: "card" },
        h("strong", {}, p.title),
        h("div", { class: "path-flow", style: "margin-top:10px" },
          p.nodes.flatMap((n, i) => [
            i > 0 ? h("span", { class: "path-arrow" }, "→") : null,
            h("span", { class: `path-node${n === p.highlight ? " hl" : ""}` }, n),
          ])
        ),
        h("p", { class: "muted small", style: "margin:8px 0 0" }, p.desc)
      )
    );
  }
  page.append(paths);

  // Bảng so sánh nhanh
  const cmp = h("div", { class: "card", style: "margin-bottom:22px" },
    h("strong", {}, "So sánh nhanh"),
    h("div", { class: "table-wrap" },
      h("table", { class: "table" },
        h("thead", {}, h("tr", {},
          h("th", {}, "Chứng chỉ"), h("th", {}, "Hình thức"), h("th", {}, "Thời gian"),
          h("th", {}, "Điểm đậu"), h("th", {}, "Hiệu lực"), h("th", {}, "Giá tham khảo"))),
        h("tbody", {}, certs.map((c) =>
          h("tr", {},
            h("td", {}, certBadge(c.id), " ", h("span", { class: "small muted" }, c.level)),
            h("td", {}, c.format),
            h("td", {}, c.duration),
            h("td", {}, c.passScore),
            h("td", {}, c.validity),
            h("td", {}, c.price))))
      )
    )
  );
  page.append(cmp);

  // Card chi tiết từng chứng chỉ
  const list = h("div", { class: "grid grid-2" });
  for (const c of certs) {
    const maxW = Math.max(...c.domains.map((d) => d[1]));
    list.append(
      h("div", { class: "card" },
        h("div", { class: "cert-head" },
          h("span", { class: "cert-abbr" }, c.id),
          certBadge(c.id),
          h("span", { class: "muted small" }, c.name)),
        h("p", { class: "small", style: "margin:8px 0" }, c.audience),
        h("dl", { class: "cert-meta" },
          h("dt", {}, "Hình thức"), h("dd", {}, c.format),
          h("dt", {}, "Thời gian"), h("dd", {}, `${c.duration} · đậu ${c.passScore}`),
          h("dt", {}, "Hiệu lực"), h("dd", {}, `${c.validity} · ${c.price}`)),
        h("div", { class: "small", style: "font-weight:700;margin:6px 0 6px" }, "Tỷ trọng domain"),
        ...c.domains.map(([name, w]) =>
          h("div", { style: "margin-bottom:7px" },
            h("div", { class: "flex spread small" },
              h("span", { class: "muted" }, name),
              h("span", { style: "font-weight:700" }, `${w}%`)),
            h("div", { class: "progress" },
              h("span", { style: `width:${(w / maxW) * 100}%` })))),
        h("p", { class: "faint", style: "margin:10px 0 8px" }, `ℹ️ ${c.note}`),
        h("a", { class: "btn btn-sm", href: c.url, target: "_blank", rel: "noopener" }, "Trang chính thức ↗")
      )
    );
  }
  page.append(list);
  root.append(page);
}
