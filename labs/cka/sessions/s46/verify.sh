# s46 — kiểm (4 dòng): sổ tay ~/notes/runbook.md có bốn tầng; ~/drills/s46/not-ready.txt có mọi Pod hỏng mà sự cố ghi, không
# có Pod đang Ready; answers.env (CATALOG_CAUSE, ORDER_REASON, GATEWAY_PROBE); lõi khoẻ (files/core-facts.sh: ba node,
# control plane, shop rollout xong trải hai worker và KHÔNG lệch `helm get manifest shop` — xoá Pod hỏng hay chỉ chờ thì
# vẫn đỏ ở đây) cộng curl TỪ MÁY MAC tới :30180 /api/products, /api/orders (files/mac.sh). Chỉ đọc. Nạp bởi `lab` trên Mac
# (bash 3.2). Chấm trạng thái, không chấm cách sửa: helm rollback, helm upgrade, kubectl đều được nếu kết quả khớp release.
# Chờ như s26 (s26/files/wait.sh, 420 giây) chỉ khi cka-cp mới bật chưa tới 15 phút (files/bootwait.sh: giữa sự cố thì
# không chờ shop, chỉ chờ /readyz tối đa 60 giây), cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây), facts (~5 lệnh) và hai
# vòng curl tối đa 42 giây: chậm nhất ~12 phút, in ra đúng con số đó.
cp="$LAB_CP"
. "$SESSION_DIR/files/mac.sh"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~12 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
core_row() {
  local r="" x c
  for x in CORE_SHOP CORE_NODES CORE_CP; do [ "$(fact $x)" = "đạt" ] || r="${r:+$r; }$(fact $x)"; done
  for c in "$(mac_get "$(fact W1_IP)" /api/products)" "$(mac_get "$(fact W1_IP)" /api/orders)"; do
    [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "~/notes/runbook.md: ≥ 4 mục ## phủ bốn tầng (ứng dụng/Pod, Service/DNS, node/kubelet, control plane), mỗi mục ≥ 3 dòng" \
  "đạt" echo "$(fact RUNBOOK)"
expect_eq "~/drills/s46/not-ready.txt: mỗi dòng <ns>/<pod>, đủ Pod hỏng lúc sự cố, không có Pod đang Ready" "đạt" echo "$(fact NOTREADY)"
expect_eq "answers.env: CATALOG_CAUSE (dòng log nêu nguyên nhân), ORDER_REASON, GATEWAY_PROBE" "đạt" echo "$(fact ANS)"
expect_eq "Lõi khoẻ: shop rollout xong trên hai worker, không lệch helm get manifest; ba node; control plane; Mac /api/products, /api/orders 200" \
  "đạt" core_row
assert_summary
