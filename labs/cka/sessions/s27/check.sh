# s27 — kiểm đầu vào (thay verify.sh của s26): phần bền của cuối s26. verify của s26 đòi IP của đúng Pod catalog đã chọn còn
# chạy; t2 của s27 (đặt tên cổng → rollout ba Deployment) hay HPA thay Pod làm dòng đó đỏ, nên `begin cka s27` chạy lại giữa
# buổi (xoá answers.env của s27) sẽ bị từ chối. Ở đây chỉ đòi shop Available và đáp án s26 đủ, phần bền đúng (tunnel, CNI),
# phần theo Pod đúng dạng. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~8 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "shop như cuối s26: gateway, catalog, order và postgres đủ Available" "đạt" echo "$(fact SHOP)"
expect_eq "~/drills/s26/answers.env đủ năm đáp án; TUNNEL_IFACE theo IPPool, CNI_CONF theo /etc/cni/net.d, IP/node/veth đúng dạng" "đạt" echo "$(fact S26)"
assert_summary
