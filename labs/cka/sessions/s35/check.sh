# s35 — kiểm đầu vào (thay verify.sh của s34): chỉ phần của cuối s34 còn đúng sau khi s35 cấp quyền: hai kubeconfig (một
# cluster/user/context, server như admin.conf, CA + cert nhúng đúng CN/O, namespace, quyền 600), whoami bằng chính hai tệp ra đúng
# user/group, ~/.kube/config vẫn là kubernetes-admin, đáp án s34. Bỏ phép thử "get pods phải Forbidden" của verify s34 (đỏ ngay
# khi RoleBinding của s35 có hiệu lực), để `begin cka s35` chạy lại được giữa buổi. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ apiserver tối đa 180 giây, cộng facts của s34 (3 lệnh kubectl, mỗi lệnh 10 giây): in ra ~4 phút.
cp="$LAB_CP"
s34="$SESSION_DIR/../s34"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~4 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until sudo kubectl --kubeconfig /etc/kubernetes/admin.conf --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "export S34_DURABLE=1
$(cat "$s34/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "~/dev.kubeconfig: 1 cluster/user/context, server như admin.conf, CA + cert dev nhúng, namespace shop, quyền 600" \
  "đạt" echo "$(fact DEV)"
expect_eq "~/ops.kubeconfig: 1 cluster/user/context, server như admin.conf, CA + cert ops nhúng, namespace default, quyền 600" \
  "đạt" echo "$(fact OPS)"
expect_eq "Gọi API bằng hai tệp: whoami ra dev/shop-dev, ops/shop-ops; ~/.kube/config vẫn là admin" "đạt" echo "$(fact AUTH)"
expect_eq "answers.env của s34: STRANGER_SERVER, STRANGER_USER, STRANGER_NS" "đạt" echo "$(fact ANS)"
assert_summary
