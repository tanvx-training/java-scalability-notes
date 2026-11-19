# s44 — lời giải trên cka-cp (user ubuntu, sudo), gọi bởi apply.sh sau setup.sh (mốc ~/drills/s44/started mới). Gia hạn mọi
# cert kubeadm, khởi động lại bốn static pod control plane bằng cách dời manifest ra khỏi /etc/kubernetes/manifests rồi đưa
# lại (kubelet dừng Pod khi tệp biến mất, tạo lại khi tệp quay về), chép admin.conf mới vào ~/.kube/config, ghi ha.txt và
# answers.env. Lần trước bị ngắt khi manifest đang ở /etc/kubernetes/s44-off thì đưa lại trước.
set -e
MAN=/etc/kubernetes/manifests
OFF=/etc/kubernetes/s44-off
PKI=/etc/kubernetes/pki/etcd
COMPS="etcd kube-apiserver kube-controller-manager kube-scheduler"
log() { echo "s44: $*"; }
die() { echo "s44: $*" >&2; exit 1; }
for c in $COMPS; do
  if sudo test -f $OFF/$c.yaml && ! sudo test -f $MAN/$c.yaml; then log "đưa lại $c.yaml từ $OFF (lần trước bị ngắt)"; sudo mv $OFF/$c.yaml $MAN/; fi
done
wait_readyz() { local end=$(($(date +%s) + $1)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; do [ $(date +%s) -lt $end ] || return 1; sleep 2; done; }

log "1. hạn hiện tại"
sudo kubeadm certs check-expiration | sed -n '/^CERTIFICATE /,/^$/p'
log "2. kubeadm certs renew all"
sudo kubeadm certs renew all 2>&1 | tail -3
log "3. khởi động lại static pod: dời bốn manifest ra $OFF, chờ container dừng, đưa lại"
sudo mkdir -p $OFF
for c in $COMPS; do sudo mv $MAN/$c.yaml $OFF/; done
end=$(($(date +%s) + 120))
until [ -z "$(sudo crictl ps -q --name '^(etcd|kube-apiserver|kube-controller-manager|kube-scheduler)$')" ]; do
  [ $(date +%s) -lt $end ] || { for c in $COMPS; do sudo mv $OFF/$c.yaml $MAN/; done; die "container control plane chưa dừng sau 2 phút (đã đưa manifest lại)"; }
  sleep 2
done
log "   bốn container đã dừng sau $((120 - end + $(date +%s))) giây"
for c in $COMPS; do sudo mv $OFF/$c.yaml $MAN/; done
wait_readyz 300 || die "apiserver chưa sẵn sàng sau 5 phút"
sudo crictl ps --name '^(etcd|kube-apiserver|kube-controller-manager|kube-scheduler)$'
log "4. chép admin.conf mới vào ~/.kube/config"
sudo cp /etc/kubernetes/admin.conf ~/.kube/config
sudo chown "$(id -u):$(id -g)" ~/.kube/config
kubectl --request-timeout=10s auth whoami
sudo kubeadm certs check-expiration | sed -n '/^CERTIFICATE /,/^$/p'
log "5. member etcd, ha.txt, answers.env"
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt --key=$PKI/server.key member list -w table
cat > ~/drills/s44/ha.txt <<'HA'
# HA control plane, stacked etcd (lab chỉ có một control plane; đây là lệnh của một cluster dựng mới).
# Load balancer TCP 6443 đặt trước mọi apiserver; mọi node và kubeconfig trỏ vào lb.cka.local:6443.
# Control plane đầu tiên:
sudo kubeadm init --control-plane-endpoint "lb.cka.local:6443" --upload-certs --pod-network-cidr 192.168.0.0/16
# Control plane thứ hai, thứ ba (token, hash, certificate-key lấy từ output của init; certificate-key hết hạn sau 2 giờ,
# in lại bằng: sudo kubeadm init phase upload-certs --upload-certs):
sudo kubeadm join lb.cka.local:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>
# Worker:
sudo kubeadm join lb.cka.local:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
HA
printf 'QUORUM_5=3\n' > ~/drills/s44/answers.env
cat ~/drills/s44/answers.env
