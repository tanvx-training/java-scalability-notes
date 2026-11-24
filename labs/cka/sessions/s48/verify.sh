# s48 — kiểm (5 dòng): config.toml (containerd) và config.yaml (kubelet) của hai worker như bản tốt; containerd, kubelet
# active và enabled trên ba node; answers.env (W1_COMPONENT, W2_FIELD, NODE_DEBUG_CGROUP); mục s48 trong sổ tay; lõi khoẻ
# (s46/files/core-facts.sh: ba node Ready và không cordon, control plane, shop trải lại hai worker như s41 và postgres-0
# Ready) cộng curl TỪ MÁY MAC tới :30180 /api/products, /api/orders (s46/files/mac.sh). Bản tốt là bản sự cố st9-node lưu
# lần đầu (/root/.lab/st9-node/ trên từng worker); so nội dung đã nạp, không so byte. Chấm trạng thái, không chấm cách sửa:
# sửa tệp bằng vim hay sed, `rollout restart` hay scale đều được. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Chờ như s26 chỉ khi cka-cp mới bật chưa tới 15 phút (s46/files/bootwait.sh + s26/files/wait.sh, 420 giây), cộng core-facts
# (~25 lệnh, mỗi lệnh tối đa 10–30 giây), dữ kiện ba node (mỗi node ~10 lệnh, tối đa 15 giây mỗi lệnh) và hai vòng curl tối
# đa 42 giây: chậm nhất ~14 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
. "$s46/mac.sh"
. "$SESSION_DIR/files/nodes.sh"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~14 phút)"
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(s48_nodes "$SESSION_DIR/files")"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
facts="$facts
$(vm "$cp" "W2_FIELD_SET='$(fact W2_FIELD_SET)'
W1_CGROUP='$(fact W1_CGROUP)'
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
core_row() {
  local r="" x c
  for x in CORE_NODES CORE_SHOP CORE_CP; do [ "$(fact $x)" = "đạt" ] || r="${r:+$r; }$(fact $x)"; done
  for c in "$(mac_get "$(fact W1_IP)" /api/products)" "$(mac_get "$(fact W1_IP)" /api/orders)"; do
    [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "cka-w1, cka-w2: /etc/containerd/config.toml và /var/lib/kubelet/config.yaml như bản tốt" "đạt" echo "$(fact NODES_FILES)"
expect_eq "containerd và kubelet active, enabled trên ba node" "đạt" echo "$(fact NODES_UNITS)"
expect_eq "answers.env: W1_COMPONENT, W2_FIELD, NODE_DEBUG_CGROUP" "đạt" echo "$(fact ANS)"
expect_eq "~/notes/runbook.md có mục s48 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng" "đạt" echo "$(fact RUNBOOK)"
expect_eq "Lõi khoẻ: ba node Ready, không cordon; control plane; shop trải hai worker, postgres-0 Ready; Mac /api/products, /api/orders 200" \
  "đạt" core_row
assert_summary
