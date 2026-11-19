# s42 — kiểm đầu vào (thay verify.sh của s41): verify s41 đòi Pod của mỗi service Ready trên cả hai worker và hai worker
# schedulable, mà chính s42 drain từng node; ở đây chỉ đọc phần của cuối s41 mà việc nâng cấp không được phá: ba PDB trong chart,
# release shop deployed (javaOpts, order 2.0), ~/drills/s41/loop.log có đoạn drain cka-w1 0 lỗi (s41/files/facts.sh PDB,
# SHOPBASE, LOG). Dòng PDB cần ALLOWED DISRUPTIONS ≥ 1, nên `begin cka s42` chạy lại giữa buổi được khi không node nào đang
# drain. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) cộng facts s41 (~15 lệnh, mỗi lệnh tối đa 10–30 giây):
# chậm nhất ~15 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s41/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "PDB gateway-pdb, catalog-pdb, order-pdb trong chart: minAvailable 1, ALLOWED DISRUPTIONS ≥ 1; không PDB thừa" "đạt" echo "$(fact PDB)"
expect_eq "Release shop deployed, javaOpts và order 2.0 như cũ" "đạt" echo "$(fact SHOPBASE)"
expect_eq "~/drills/s41/loop.log: drain cka-w1 (cordon → Pod về 0 → uncordon) với request đều, 0 lỗi" "đạt" echo "$(fact LOG)"
assert_summary
