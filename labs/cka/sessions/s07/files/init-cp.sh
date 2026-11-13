#!/bin/bash
# Chạy trên control plane bằng root: kubeadm init (nếu chưa), kubeconfig cho user ubuntu, cài Calico (manifest) và chờ
# node control plane Ready. Chạy lại nhiều lần được.
# Cách dùng: sudo bash init-cp.sh <IP advertise> <pod CIDR> <phiên bản Calico, vd. v3.33.0>
set -euo pipefail
ip="$1"; pod_cidr="$2"; calico="$3"
export KUBECONFIG=/etc/kubernetes/admin.conf
# kubeadm init hoàn tất thì ConfigMap kubeadm-config có trong kube-system (phase upload-config)
init_done() {
  [ -f /etc/kubernetes/admin.conf ] || return 1
  for i in $(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n kube-system get configmap kubeadm-config >/dev/null 2>&1
}
# Máy Mac quá tải có thể làm VM khựng và init hết giờ ở phase wait-control-plane (đã gặp thật):
# reset rồi thử lại, tối đa hai lần.
for attempt in 1 2; do
  init_done && break
  if [ "$attempt" -gt 1 ] || [ -f /etc/kubernetes/admin.conf ]; then
    echo "kubeadm init lần trước dở dang, kubeadm reset rồi init lại" >&2
    kubeadm reset -f >/dev/null 2>&1
  fi
  if kubeadm init --apiserver-advertise-address="$ip" --pod-network-cidr="$pod_cidr" \
      --kubernetes-version "$(kubeadm version -o short)" > /root/kubeadm-init.log 2>&1; then
    break
  fi
  tail -5 /root/kubeadm-init.log >&2
  [ "$attempt" -eq 2 ] && exit 1
done
install -d -o ubuntu -g ubuntu -m 700 /home/ubuntu/.kube
install -o ubuntu -g ubuntu -m 600 /etc/kubernetes/admin.conf /home/ubuntu/.kube/config

# apiserver có thể vừa khởi động (sau reboot/restore): chờ có giới hạn
for i in $(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
kubectl get --raw /readyz >/dev/null

[ -s "/root/calico-$calico.yaml" ] || curl -fsSL -o "/root/calico-$calico.yaml" \
  "https://raw.githubusercontent.com/projectcalico/calico/$calico/manifests/calico.yaml"
# apply chạy lại được; apiserver vừa lên có thể rớt kết nối giữa chừng (đã gặp khi máy Mac quá tải): thử lại có giới hạn
for i in 1 2 3 4 5; do
  kubectl apply -f "/root/calico-$calico.yaml" >/dev/null 2>/root/calico-apply.err && break
  echo "kubectl apply calico lần $i lỗi: $(tail -n1 /root/calico-apply.err)" >&2
  [ "$i" -eq 5 ] && exit 1
  sleep 15
  for j in $(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
done
kubectl wait --for=condition=Ready "node/$(hostname)" --timeout=600s >/dev/null
# Calico tự lấy pod CIDR từ cấu hình kubeadm (không sửa CALICO_IPV4POOL_CIDR): kiểm IPPool đúng CIDR
for i in $(seq 1 60); do
  kubectl get ippools.crd.projectcalico.org default-ipv4-ippool >/dev/null 2>&1 && break; sleep 2
done
got="$(kubectl get ippools.crd.projectcalico.org default-ipv4-ippool -o jsonpath='{.spec.cidr}')"
[ "$got" = "$pod_cidr" ] || { echo "IPPool của Calico là '$got', khác pod CIDR $pod_cidr" >&2; exit 1; }
