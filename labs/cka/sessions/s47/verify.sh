# s47 — kiểm (7 dòng): Corefile như bản tốt; DaemonSet kube-proxy như bản tốt và chạy đúng revision trên ba node; từ Pod tạm
# trên MỖI worker phân giải catalog.shop.svc.cluster.local và tới ClusterIP của gateway; NetworkPolicy của shop như cuối s46
# và order nối được catalog; answers.env (DNS_ZONE_FOUND, PROXY_NODE, BLOCKING_POLICY, ONE_TEST); mục s47 trong sổ tay; lõi
# khoẻ (s46/files/core-facts.sh) cộng curl TỪ MÁY MAC tới :30180 của cka-w1 /api/products, /api/orders (s46/files/mac.sh).
# Bản tốt là bản sự cố st9-net lưu lần đầu (/root/.lab/st9-net/). Chấm trạng thái, không chấm cách sửa: xoá hay sửa
# allow-monitoring đều được (sau khi policy order trở lại, allow-monitoring chỉ cộng quyền); kube-proxy sửa bằng rollout undo,
# patch hay edit đều được. Chỉ đọc, trừ namespace tạm lab-verify-s47-… (xoá khi xong). Nạp bởi `lab` trên Mac (bash 3.2).
# Chờ như s26 chỉ khi cka-cp mới bật chưa tới 15 phút (s46/files/bootwait.sh + s26/files/wait.sh, 420 giây), cộng core-facts
# (~25 lệnh, mỗi lệnh tối đa 10–30 giây), facts (Pod tạm tối đa 60 giây, ~12 lệnh tối đa 20–25 giây) và hai vòng curl tối đa
# 42 giây: chậm nhất ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
. "$s46/mac.sh"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
core_row() {
  local r="" x c
  for c in "$(mac_get "$(fact W1_IP)" /api/products)" "$(mac_get "$(fact W1_IP)" /api/orders)"; do
    [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  done
  for x in CORE_SHOP CORE_NODES CORE_CP; do [ "$(fact $x)" = "đạt" ] || r="${r:+$r; }$(fact $x)"; done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "CoreDNS: Corefile như bản tốt (zone cluster.local), đủ replica" "đạt" echo "$(fact COREDNS)"
expect_eq "kube-proxy: DaemonSet (template, updateStrategy) như bản tốt, ba Pod Ready đúng revision" "đạt" echo "$(fact PROXY)"
expect_eq "Pod tạm trên cka-w1 và cka-w2: nslookup catalog.shop.svc.cluster.local, wget ClusterIP gateway:8080" "đạt" echo "$(fact PROBE)"
expect_eq "NetworkPolicy của shop như cuối s46 (đủ, đúng spec); mỗi Pod order nối được catalog:8080" "đạt" echo "$(fact NETPOL)"
expect_eq "answers.env: DNS_ZONE_FOUND, PROXY_NODE, BLOCKING_POLICY, ONE_TEST" "đạt" echo "$(fact ANS)"
expect_eq "~/notes/runbook.md có mục s47 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng" "đạt" echo "$(fact RUNBOOK)"
expect_eq "Lõi khoẻ: Mac :30180 của cka-w1 /api/products, /api/orders 200; shop rollout xong, không lệch release; node; control plane" \
  "đạt" core_row
assert_summary
