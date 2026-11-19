# s37 — lời giải chuẩn: helm v4.3.2 (ghim, sha256) trên cka-cp; release demo (podinfo 6.16.0, namespace demo, --set ui.message
# và -f demo-values.yaml đặt Pod lên cka-cp); chart files/chart chép vào ~/charts/shop; lần đầu: helm template | kubectl diff,
# thử cài khi chưa gắn nhãn (lỗi "exists and cannot be imported"), gắn nhãn/annotation cho 15 object rồi helm install shop
# (order 1.0 như đang chạy), sửa values order.image.tag 2.0 và helm upgrade --force-conflicts; tệp của object đã vào chart
# chuyển sang ~/shop/pre-helm/ (rbac.yaml tách: SA/Role/RoleBinding của order đi, RBAC của dev/ops ở lại). Chạy lại nhiều
# lần được (files/solve.sh). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
# Sau khi VM vừa bật lại (restore): chờ apiserver và Deployment của shop như verify.
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
t="$(mktemp -t s37-chart)"
( cd "$SESSION_DIR/files" && COPYFILE_DISABLE=1 tar --no-mac-metadata -czf "$t" chart 2>/dev/null || COPYFILE_DISABLE=1 tar -czf "$t" chart )
vm_put "$t" "$cp" /tmp/s37-chart.tgz
rm -f "$t"
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
