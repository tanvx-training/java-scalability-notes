# s35 — các dòng chấm, dùng chung cho verify.sh của s35 và s36 (s36: mọi dòng của s35 phải xanh lại). Cần sẵn: $facts (đầu
# ra của files/facts.sh), hàm fact, expect_eq của lab. bash 3.2.
expect_eq "dev (dev.kubeconfig): create/patch deploy, get pods ở shop được; node, kube-system, clusterrole, và Secret/RBAC/NetworkPolicy/quota/scale ở shop không" \
  "đạt" echo "$(fact DEV)"
expect_eq "ops (ops.kubeconfig): get nodes, list pods -A được; create/patch/delete, exec, impersonate ở mọi nơi và đọc Secret không" \
  "đạt" echo "$(fact OPS)"
expect_eq "Pod order chạy bằng SA order, Available; token SA order đọc được ConfigMap của order, không ConfigMap khác, không Secret db-cred" \
  "đạt" echo "$(fact SA)"
expect_eq "~/shop/rbac.yaml có đủ 7 object RBAC/SA và khớp cluster, shop-deployer không có *, không binding nào khác cho dev; ~/shop/ giữ serviceAccountName: order" \
  "đạt" echo "$(fact FILE)"
