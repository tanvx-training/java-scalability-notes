# s07 — lời giải chuẩn: kubeadm init trên cka-cp (pod CIDR 10.244.0.0/16), kubeconfig cho ubuntu, Calico từ manifest
# (phiên bản ghim), tạo lệnh join mới rồi join hai worker, chờ ba node Ready. Chạy lại nhiều lần được.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
POD_CIDR="10.244.0.0/16"
CALICO_VERSION="v3.33.0"
# IP advertise = địa chỉ nguồn của route mặc định trong VM (card chính). Không lấy từ `multipass list`: sau khi có Calico,
# cka-cp có thêm địa chỉ 10.244.x.y trên tunl0 và thứ tự các IP trong danh sách không được bảo đảm.
cp_ip="$(vm "$LAB_CP" "ip -4 -o route get 1.1.1.1 | sed -n 's/.* src \\([0-9.]*\\).*/\\1/p'")"
case "$cp_ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "s07: không lấy được IP của $LAB_CP: '$cp_ip'" >&2; exit 1 ;; esac
vm_put "$SESSION_DIR/files/init-cp.sh" "$LAB_CP" /tmp/s07-init.sh
echo "s07: kubeadm init + Calico trên $LAB_CP (lần đầu mất vài phút)"
vm "$LAB_CP" "sudo bash /tmp/s07-init.sh $cp_ip $POD_CIDR $CALICO_VERSION && rm -f /tmp/s07-init.sh"
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  if vm "$v" "sudo test -f /etc/kubernetes/kubelet.conf"; then
    echo "s07: $v đã join"
    continue
  fi
  join="$(vm "$LAB_CP" "sudo kubeadm token create --print-join-command --ttl 15m")"
  case "$join" in "kubeadm join "*) ;; *) echo "s07: không tạo được lệnh join: $join" >&2; exit 1 ;; esac
  echo "s07: join $v"
  vm "$v" "sudo $join >/tmp/kubeadm-join.log 2>&1 || { tail -20 /tmp/kubeadm-join.log >&2; exit 1; }"
done
echo "s07: chờ ba node Ready và calico-node sẵn sàng"
vm "$LAB_CP" "kubectl wait --for=condition=Ready node --all --timeout=600s >/dev/null &&
  kubectl -n kube-system rollout status daemonset/calico-node --timeout=600s >/dev/null &&
  kubectl -n kube-system rollout status deployment/calico-kube-controllers --timeout=600s >/dev/null &&
  kubectl -n kube-system rollout status deployment/coredns --timeout=600s >/dev/null"
