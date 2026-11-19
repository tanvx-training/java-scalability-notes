# s35 — lời giải chuẩn: ~/shop/rbac.yaml sinh bằng `kubectl create … --dry-run=client -o yaml` (SA order, Role shop-deployer +
# RoleBinding shop-dev cho Group shop-dev ở shop, ClusterRole shop-ops-view chỉ get/list/watch + ClusterRoleBinding shop-ops cho
# Group shop-ops, Role order-config-reader theo resourceNames [order-config] + RoleBinding cùng tên cho SA order); ConfigMap
# order-config (~/shop/order-config.yaml) và ~/shop/order.yaml thêm serviceAccountName: order + envFrom; apply, chờ rollout.
# Kiểm bằng `auth can-i --as` rồi bằng kubeconfig thật; tình huống hỏng: RoleBinding nháp `kind: User` tên shop-dev; token SA
# gọi API từ Pod tạm ở default. Chạy lại nhiều lần được (files/solve.sh). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
# Sau khi VM vừa bật lại (restore): chờ apiserver và Deployment của shop như verify.
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
