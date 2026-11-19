# s44 — lời giải chuẩn: setup.sh (mốc started mới), rồi files/solve.sh trên cka-cp: `kubeadm certs check-expiration`,
# `kubeadm certs renew all`, khởi động lại bốn static pod control plane (dời manifest ra /etc/kubernetes/s44-off rồi đưa lại,
# chờ container cũ dừng và /readyz), chép admin.conf mới vào ~/.kube/config, `etcdctl member list`, ~/drills/s44/ha.txt và
# answers.env (QUORUM_5). Chạy lại được: mỗi lần là một lần gia hạn mới sau mốc mới. Rồi chờ shop như s26 và cert-manager
# như s39. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
vm "$cp" "sleep 2; $(cat "$SESSION_DIR/files/solve.sh")"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
