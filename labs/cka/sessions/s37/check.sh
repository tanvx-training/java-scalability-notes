# s37 — kiểm đầu vào (thay verify.sh của s36): mọi dòng của s36 trừ dòng "~/shop/rbac.yaml có đủ 7 object và ~/shop/ giữ
# Deployment order", vì chính s37 chuyển SA/Role/RoleBinding của order và order.yaml sang ~/shop/pre-helm (dòng đó đỏ giữa buổi,
# `begin cka s37` phải chạy lại được). Còn lại: quyền của dev/ops bằng hai kubeconfig, SA order (s35/files/facts.sh),
# ~/dev.kubeconfig như cuối s34, đáp án s36. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ như verify s36 (420 giây) cộng ba lần đọc dữ kiện (~60 lệnh kubectl, mỗi lệnh tối đa 10
# giây): chậm nhất ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s35="$SESSION_DIR/../s35"
s36="$SESSION_DIR/../s36"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$s35/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "export S34_DURABLE=1
$(cat "$SESSION_DIR/../s34/files/facts.sh")" 2>/dev/null | sed -n 's/^DEV=/KC_DEV=/p')
$(vm "$cp" "$(cat "$s36/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "dev (dev.kubeconfig): create/patch deploy, get pods ở shop được; node, kube-system, clusterrole, và Secret/RBAC/NetworkPolicy/quota/scale ở shop không" \
  "đạt" echo "$(fact DEV)"
expect_eq "ops (ops.kubeconfig): get nodes, list pods -A được; create/patch/delete, exec, impersonate ở mọi nơi và đọc Secret không" \
  "đạt" echo "$(fact OPS)"
expect_eq "Pod order chạy bằng SA order, Available; token SA order đọc được ConfigMap của order, không ConfigMap khác, không Secret db-cred" \
  "đạt" echo "$(fact SA)"
expect_eq "~/dev.kubeconfig như cuối s34: server như admin.conf, cert + key nhúng là của dev (CN=dev, O=shop-dev), namespace shop, quyền 600" \
  "đạt" echo "$(fact KC_DEV)"
expect_eq "answers.env của s36: FORBIDDEN_MISSING" "đạt" echo "$(fact ANS)"
assert_summary
