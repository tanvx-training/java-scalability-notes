# s35 — kiểm (4 dòng), quyền chấm bằng danh tính thật: `auth can-i` và một lệnh `get` thật qua /home/ubuntu/dev.kubeconfig,
# /home/ubuntu/ops.kubeconfig (không `--as`), token thật của SA order (`create token`, không lưu object nào). dev: create/patch
# deploy, get pods ở shop được; get nodes, mọi thao tác ở kube-system, create clusterrole không. ops: get nodes, list pods -A
# được; create/patch/delete (mọi namespace, cả node) và đọc Secret không. Pod order chạy bằng SA order, Available; token SA
# đọc được ConfigMap của order, không đọc ConfigMap khác hay Secret db-cred. ~/shop/rbac.yaml khớp cluster, ~/shop/ giữ
# serviceAccountName của order. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn như s26 (files/wait.sh, 420 giây), cộng facts.sh (~50 lệnh kubectl, mỗi lệnh tối
# đa 10 giây, thường dưới 1 giây; đo: 2–3 giây khi cluster đã sẵn sàng). Chậm nhất ~15 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/files/rows.sh"
assert_summary
