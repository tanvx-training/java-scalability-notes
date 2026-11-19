# s41 — kiểm (3 dòng): PDB gateway-pdb, catalog-pdb, order-pdb trong chart (minAvailable 1, đúng selector, ALLOWED
# DISRUPTIONS ≥ 1, không PDB thừa chọn ba service); release shop deployed (shop-0.2.0, javaOpts và order 2.0 như cũ), mỗi service
# ≥ 2 replica, cách trải theo kubernetes.io/hostname nằm trong chart, Pod Ready trên cả cka-w1 và cka-w2; ~/drills/s41/loop.log
# có đoạn drain cka-w1 (cordon → Pod gateway/catalog/order trên cka-w1 về 0 → uncordon) với request đều và 0 lỗi, ba node
# Ready, hai worker schedulable. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) cộng facts.sh (~15 lệnh kubectl/helm, mỗi lệnh tối đa 10–30
# giây, thường dưới 1 giây): chậm nhất ~15 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
rows() {
  local r="" x
  for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"; done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
expect_eq "PDB gateway-pdb, catalog-pdb, order-pdb trong chart: minAvailable 1, selector app=<service>, ALLOWED DISRUPTIONS ≥ 1; không PDB thừa" \
  "đạt" rows PDB
expect_eq "Release shop deployed (shop-0.2.0, javaOpts và order 2.0 như cũ); gateway, catalog, order ≥ 2 replica, trải theo hostname trong chart, Pod Ready trên cka-w1 và cka-w2; catalog, order, postgres có priority không thấp hơn gateway" \
  "đạt" rows SHOPBASE SPREAD
expect_eq "~/drills/s41/loop.log: drain cka-w1 (cordon → Pod về 0 → uncordon) với request đều, 0 lỗi; ba node Ready, cka-w1 và cka-w2 schedulable" \
  "đạt" rows LOG NODE
assert_summary
