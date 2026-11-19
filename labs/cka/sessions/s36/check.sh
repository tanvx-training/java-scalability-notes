# s36 — kiểm đầu vào (thay verify.sh của s35): chỉ phần của cuối s35 mà sự cố st6-access không phá. Sự cố đổi server và cert
# của ~/dev.kubeconfig và chủ thể của ClusterRoleBinding shop-ops (trong ~/shop/rbac.yaml), nên dòng dev, ops và "rbac.yaml
# khớp cluster" của verify s35 đỏ suốt buổi: bỏ chúng để `begin cka s36` chạy lại được giữa chừng (gây lại sự cố, xoá
# answers.env cũ) mà không phải restore. Còn lại: SA order (dòng của s35), ~/ops.kubeconfig như cuối s34, và RBAC của dev trong
# cluster (hỏi bằng --as, vì kubeconfig của dev đang hỏng). Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ như verify s35 (420 giây) cộng ba lần đọc dữ kiện: in ra ~10 phút.
cp="$LAB_CP"
s35="$SESSION_DIR/../s35"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~10 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$s35/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "export S34_DURABLE=1
$(cat "$SESSION_DIR/../s34/files/facts.sh")" 2>/dev/null | sed -n 's/^OPS=/KC_OPS=/p')
$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "Pod order chạy bằng SA order, Available; token SA order đọc được ConfigMap của order, không ConfigMap khác, không Secret db-cred" \
  "đạt" echo "$(fact SA)"
expect_eq "~/ops.kubeconfig như cuối s34 (server như admin.conf, CA + cert ops nhúng, namespace default, quyền 600)" "đạt" echo "$(fact KC_OPS)"
expect_eq "RBAC của dev trong cluster (--as dev --as-group shop-dev): triển khai được ở shop, không đọc node; có ClusterRole shop-ops-view" \
  "đạt" echo "$(fact DEVRBAC)"
assert_summary
