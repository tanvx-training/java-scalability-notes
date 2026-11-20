# s45 — kiểm đầu vào (thay verify.sh của s44): phần của cuối s44 mà sự cố st8-ops không phá và đọc được cả khi apiserver không
# chạy (files/check-facts.sh): cert kubeadm gia hạn sau mốc của s44, ha.txt, QUORUM_5; công cụ etcd, snapshot, dữ liệu thật
# trong /var/lib/etcd-restore; control plane khoẻ, hoặc sự cố của lần begin trước đang dở. Nhờ vậy `begin cka s45` chạy lại
# được giữa buổi (etcd đang không lên, cka-w2 đang ở 1.36) mà không phải restore: chính sự cố đưa etcd về bản tốt trước khi gây
# lại. Không kiểm node, phiên bản gói hay shop ở đây: sự cố phá hay làm chúng tạm mất. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Chưa có sự cố nào đang dở (manifest etcd giống bản tốt, hay chưa begin lần nào): chờ như s26 (files/wait.sh, 420 giây) trước; còn lại không chờ. facts ~20 lệnh, mỗi lệnh tối đa
# 10–60 giây: chậm nhất ~10 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop nếu đang khởi động và chưa có sự cố dở: tối đa ~10 phút)"
vm "$cp" 'sudo test -f /root/.lab/st8-ops/etcd.yaml && ! sudo cmp -s /root/.lab/st8-ops/etcd.yaml /etc/kubernetes/manifests/etcd.yaml' >/dev/null 2>&1 ||
  vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "Đầu ra s44: mười một cert kubeadm ký lại sau ~/drills/s44/started; ha.txt; QUORUM_5" "đạt" echo "$(fact S44)"
expect_eq "etcdctl/etcdutl 3.7.0; /opt/backup/etcd.db đọc được; /var/lib/etcd-restore có dữ liệu của cluster" "đạt" echo "$(fact DATA)"
expect_eq "etcd healthy và apiserver /readyz, hoặc sự cố st8-ops đang dở (manifest etcd khác bản tốt đã lưu)" "đạt" echo "$(fact CP)"
assert_summary
