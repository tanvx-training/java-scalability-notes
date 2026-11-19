# s36 — lời giải chuẩn: gây sự cố st6-access như `begin` (setup.sh: forbidden.txt, xoá answers.env, lab_break st6-access),
# rồi đọc lỗi và sửa (files/solve.sh): ~/dev.kubeconfig về server như admin.conf và cert/key của dev (nhúng),
# ClusterRoleBinding shop-ops về Group shop-ops trong ~/shop/rbac.yaml rồi apply; ghi FORBIDDEN_MISSING. Chạy lại nhiều lần
# được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
# Sau khi VM vừa bật lại (restore): chờ apiserver và Deployment của shop như verify.
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
