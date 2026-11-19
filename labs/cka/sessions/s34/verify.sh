# s34 — kiểm (4 dòng): ~/dev.kubeconfig và ~/ops.kubeconfig mỗi tệp đúng một cluster/user/context, current-context trỏ nó,
# server như ~/.kube/config, CA và cert/key nhúng (không đường dẫn, không insecure-skip-tls-verify), cert nhúng đúng CN/O và do
# CA cluster ký, namespace mặc định shop (dev) / default (ops), quyền 600 chủ ubuntu; gọi API bằng chính hai tệp: whoami đúng
# user/group, `get pods` Forbidden có tên user (không Unauthorized), ~/.kube/config vẫn là kubernetes-admin; ba đáp án về
# stranger.kubeconfig. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chỉ cần apiserver, chờ có giới hạn 180 giây, cộng facts.sh (5 lệnh kubectl, mỗi lệnh 10 giây):
# in ra ~5 phút.
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~5 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until sudo kubectl --kubeconfig /etc/kubernetes/admin.conf --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "~/dev.kubeconfig: 1 cluster/user/context, server như ~/.kube/config, CA + cert dev nhúng, namespace shop, quyền 600" \
  "đạt" echo "$(fact DEV)"
expect_eq "~/ops.kubeconfig: 1 cluster/user/context, server như ~/.kube/config, CA + cert ops nhúng, namespace default, quyền 600" \
  "đạt" echo "$(fact OPS)"
expect_eq "Gọi API bằng hai tệp: whoami ra dev/shop-dev, ops/shop-ops; get pods Forbidden đúng user; ~/.kube/config vẫn là admin" \
  "đạt" echo "$(fact AUTH)"
expect_eq "answers.env: STRANGER_SERVER, STRANGER_USER, STRANGER_NS của current-context trong stranger.kubeconfig" "đạt" echo "$(fact ANS)"
assert_summary
