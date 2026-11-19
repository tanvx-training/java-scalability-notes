# s43 — lời giải chuẩn: setup.sh (etcdctl/etcdutl, ~/drills/s43), rồi files/solve.sh trên cka-cp: ConfigMap before-snapshot,
# `etcdctl snapshot save /opt/backup/etcd.db`, ConfigMap after-snapshot, xoá Deployment order, dừng kube-apiserver,
# kube-controller-manager, kube-scheduler (cất manifest ra /etc/kubernetes/s43-off), `etcdutl snapshot restore` vào
# /var/lib/etcd-restore, sửa manifest etcd (--data-dir, mountPath, hostPath), bật lại control plane, chờ order Available,
# answers.env. Chạy lại được: etcd đã chạy từ /var/lib/etcd-restore với đúng dấu hiệu thì bỏ qua (xem đầu solve.sh); không bao
# giờ xoá /var/lib/etcd hay trỏ etcd sang thư mục rỗng. Rồi chờ shop như s26. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
