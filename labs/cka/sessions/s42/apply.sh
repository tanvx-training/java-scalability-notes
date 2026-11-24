# s42 — lời giải chuẩn: nâng cluster 1.36 → 1.37.2 theo trang "Upgrading kubeadm clusters". setup.sh (loop.sh, xoá
# answers.env); PDB coredns-pdb (kube-system, minAvailable 1, ~/drills/s42/coredns-pdb.yaml); vòng request loop-cp-w1.log; cka-cp: repo apt v1.37, kubeadm 1.37.2 (unhold/hold), kéo trước image, `kubeadm
# upgrade plan`, `kubeadm upgrade apply v1.37.2 --yes`, drain, kubelet + kubectl 1.37.2, daemon-reload, restart kubelet,
# uncordon; cka-w1: repo, kubeadm, `kubeadm upgrade node`, drain, kubelet, uncordon, rollout restart service nào dồn về một
# worker; dừng vòng; vòng loop-w2.log và cka-w2 như cka-w1 (postgres-0 ngừng tới khi uncordon), chờ shop trả 200 lại, dừng
# vòng; answers.env (W2_OUTAGE_SECONDS đo từ loop-w2.log, SKEW_RULE). Node nào đã ở 1.37.2 (kubelet, gói, hold; cka-cp thêm kubeadm-config và image kube-apiserver) thì bỏ qua,
# cả vòng request của nó: chạy lần hai trên cluster đã nâng chỉ ghi lại answers.env. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
set -o pipefail   # `vm … | tail` phải dừng khi lệnh trong VM lỗi (kubeadm upgrade apply/node), không đi tiếp tới kubelet
cp="$LAB_CP"
V=1.37.2            # bản vá 1.37 hiện hành 2026-11-20 (https://dl.k8s.io/release/stable-1.37.txt; pkgs.k8s.io v1.37: 1.37.0–1.37.2)
PKG=1.37.2-1.1      # tên gói trong repo pkgs.k8s.io/core:/stable:/v1.37/deb
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
loop="~/drills/s42/loop.sh"
node_step() { vm "$1" "export STEP=$2 PKG=$PKG
$(cat "$SESSION_DIR/files/aptlock.sh")
$(cat "$SESSION_DIR/files/node.sh")"; }
# q <node> <lệnh đọc>: in output; lệnh lỗi hay hết giờ thì thử lại, tối đa 5 lần cách nhau 6 giây (~1,5 phút), rồi trả 1.
q() {
  local i out
  for i in 1 2 3 4 5; do
    if out="$(vm "$1" "$2" 2>/dev/null)"; then printf '%s\n' "$out"; return 0; fi
    if [ "$i" -lt 5 ]; then sleep 6; fi
  done
  return 1
}
# Không đọc được trạng thái thì dừng hẳn (mã 1), không coi là "chưa nâng": đoán sai sẽ drain lại node đã nâng và ghi đè log
# của vòng request.
q_die() { echo "s42: không đọc được $1 sau 5 lần (apiserver hay VM không trả lời); dừng, chưa drain và chưa ghi log nào. Chạy lại khi cluster đã sẵn sàng." >&2; exit 1; }
# done_node <node>: kubelet báo v$V, gói đủ bản $PKG và hold; với control plane thêm kubeadm-config (kubernetesVersion) và image
# kube-apiserver đã ở v$V, tức `kubeadm upgrade apply` đã xong thật (kubelet mới trên control plane cũ không tính là xong).
done_node() {
  local kv pk cv
  kv="$(q "$cp" "kubectl --request-timeout=10s get node $1 -o jsonpath='{.status.nodeInfo.kubeletVersion}'")" || q_die "phiên bản kubelet của $1"
  [ "$kv" = "v$V" ] || return 1
  # `|| true`: grep -c in 0 và trả 1 khi chưa hold gì; mã khác 0 chỉ còn là lỗi của multipass.
  pk="$(q "$1" "dpkg-query -W -f='\${Version} ' kubeadm kubelet kubectl; apt-mark showhold | grep -cxE 'kubeadm|kubelet|kubectl' || true")" || q_die "gói trên $1"
  [ "$pk" = "$PKG $PKG $PKG 3" ] || return 1
  if [ "$1" = "$cp" ]; then
    cv="$(q "$cp" 'cfg=$(kubectl --request-timeout=10s -n kube-system get cm kubeadm-config -o jsonpath="{.data.ClusterConfiguration}") && img=$(kubectl --request-timeout=10s -n kube-system get pod -l component=kube-apiserver -o jsonpath="{.items[*].spec.containers[0].image}") && echo "$(printf "%s\n" "$cfg" | sed -n "s/^kubernetesVersion: //p") $img"')" || q_die "kubeadm-config và image kube-apiserver"
    case "$cv" in "v$V "*":v$V") ;; *) return 1 ;; esac
  fi
}
wait_shop() { # chờ gateway/catalog/order Available, tối đa 5 phút
  vm "$cp" 'end=$(($(date +%s) + 300)); until [ "$(kubectl --request-timeout=10s -n shop get deploy gateway catalog order -o jsonpath="{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\n\"}{end}" | awk "\$1!=\$2" | grep -c .)" = 0 ] || [ $(date +%s) -ge $end ]; do sleep 3; done'
}
rebalance() { # service nào có Pod Running chỉ trên một worker thì rollout restart (spread của chart trải lại)
  vm "$cp" 'for n in gateway catalog order; do
    nodes=$(kubectl --request-timeout=10s -n shop get pod -l app=$n --field-selector=status.phase=Running -o jsonpath="{range .items[*]}{.spec.nodeName}{\"\n\"}{end}" | sort -u | tr "\n" " ")
    case "$nodes" in *cka-w1*cka-w2*) ;; *) echo "$n chỉ ở: $nodes→ rollout restart"; kubectl --request-timeout=10s -n shop rollout restart deploy/$n
      kubectl --request-timeout=10s -n shop rollout status deploy/$n --timeout=5m ;; esac
  done'
}
upgrade_worker() { # <node>: repo, kubeadm, kubeadm upgrade node, drain, kubelet, uncordon
  node_step "$1" repo
  node_step "$1" kubeadm
  vm "$1" "sudo kubeadm upgrade node" | tail -3
  vm "$cp" "kubectl --request-timeout=10s drain $1 --ignore-daemonsets --delete-emptydir-data --timeout=5m"
  node_step "$1" kubelet
  vm "$cp" "sleep 10; kubectl --request-timeout=10s get node $1; kubectl --request-timeout=10s uncordon $1"
}

# CoreDNS chưa có PDB (kubeadm không tạo): drain một node có Pod CoreDNS có thể đuổi Pod Ready cuối cùng (đo: drain cka-cp ngay
# sau `upgrade apply`, lúc CoreDNS còn rollout, 12 request lỗi trong 25 giây). PDB minAvailable 1 buộc drain chờ Pod mới Ready.
vm "$cp" 'cat > ~/drills/s42/coredns-pdb.yaml <<EOF
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: coredns-pdb
  namespace: kube-system
spec:
  minAvailable: 1
  selector:
    matchLabels:
      k8s-app: kube-dns
EOF
kubectl --request-timeout=10s apply -f ~/drills/s42/coredns-pdb.yaml'

# Node đã ở 1.37.2 mà còn cordon (lần chạy trước bị ngắt giữa chừng) thì uncordon.
for n in $LAB_VMS; do if done_node "$n"; then vm "$cp" "kubectl --request-timeout=10s uncordon $n" >/dev/null; fi; done
if done_node cka-cp && done_node cka-w1 && done_node cka-w2; then
  echo "s42: ba node đã ở v$V, gói $PKG và hold: bỏ qua phần nâng cấp, giữ log của lần nâng."
else
  if ! done_node cka-cp || ! done_node cka-w1; then
    # Một log phải chứa cả lúc cka-cp lẫn cka-w1 lên 1.37. cka-cp đã nâng mà cka-w1 chưa (lần trước bị ngắt) thì
    # `loop.sh start` ghi đè log và mất đoạn cka-cp: verify dòng loop-cp-w1 sẽ đỏ. Vẫn nâng tiếp cho cluster đúng, nhưng báo cách gỡ.
    if done_node cka-cp; then
      echo "s42: cka-cp đã 1.37 từ lần chạy trước; loop-cp-w1.log mới sẽ không có đoạn cka-cp. Muốn verify xanh: ./labs/lab restore cka s41 rồi làm lại s42." >&2
    fi
    vm "$cp" "$loop stop ~/drills/s42/loop-cp-w1.log >/dev/null; $loop start ~/drills/s42/loop-cp-w1.log; sleep 5"
    if ! done_node cka-cp; then
      echo "== cka-cp"
      node_step "$cp" repo
      node_step "$cp" kubeadm
      vm "$cp" "sudo kubeadm config images pull --kubernetes-version v$V"
      # Kéo trước image addon trên hai worker: `upgrade apply` thay Pod kube-proxy trên mọi node cùng lúc với rollout CoreDNS; Pod
      # kube-proxy mới phải kéo image (đo: 22 giây) và trong lúc đó node giữ rule iptables cũ trỏ Pod CoreDNS đã xoá (đo: 16
      # request lỗi trên cka-w2). crictl pull đúng image mà kubeadm 1.37.2 liệt kê.
      imgs="$(vm "$cp" "kubeadm config images list --kubernetes-version v$V | grep -E 'kube-proxy|coredns|pause'" | tr '\n' ' ')"
      for w in cka-w1 cka-w2; do vm "$w" "for i in $imgs; do sudo crictl pull \$i >/dev/null && echo \"$w: \$i\"; done"; done
      # plan chỉ để xem (in bảng COMPONENT); lỗi của nó không chặn, `upgrade apply` dưới đây tự kiểm và dừng khi lỗi.
      vm "$cp" "sudo kubeadm upgrade plan v$V" | sed -n '/^COMPONENT/,/^$/p' || echo "s42: kubeadm upgrade plan lỗi (chỉ để xem), đi tiếp" >&2
      if [ "$(vm "$cp" "kubectl --request-timeout=10s -n kube-system get cm kubeadm-config -o jsonpath='{.data.ClusterConfiguration}' | sed -n 's/^kubernetesVersion: //p'")" != "v$V" ]; then
        vm "$cp" "sudo kubeadm upgrade apply v$V --yes" | tail -4
      fi
      # `upgrade apply` trả về khi CoreDNS và kube-proxy còn đang rollout: drain ngay lúc đó đuổi Pod CoreDNS cũ còn lại khi Pod
      # mới chưa Ready (đo: 25 giây shop trả 503). Chờ rollout xong rồi mới drain.
      vm "$cp" "kubectl -n kube-system rollout status deploy/coredns --timeout=5m && kubectl -n kube-system rollout status ds/kube-proxy --timeout=5m"
      vm "$cp" "kubectl --request-timeout=10s drain cka-cp --ignore-daemonsets --delete-emptydir-data --timeout=5m"
      node_step "$cp" kubelet
      # restart kubelet trên control plane khởi động lại cả static pod: apiserver từ chối kết nối thêm vài chục giây (đo).
      vm "$cp" 'sleep 5; end=$(($(date +%s) + 180)); until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ $(date +%s) -ge $end ]; do sleep 2; done
        kubectl --request-timeout=10s get node cka-cp; kubectl --request-timeout=10s uncordon cka-cp'
    fi
    if ! done_node cka-w1; then
      echo "== cka-w1"
      upgrade_worker cka-w1
    fi
    wait_shop
    rebalance
    vm "$cp" "sleep 5; $loop stop ~/drills/s42/loop-cp-w1.log"
  fi
  if ! done_node cka-w2; then
    echo "== cka-w2 (postgres-0 ngừng tới khi uncordon)"
    vm "$cp" "$loop stop ~/drills/s42/loop-w2.log >/dev/null; $loop start ~/drills/s42/loop-w2.log; sleep 5"
    upgrade_worker cka-w2
    # Chờ shop trả 200 lại (postgres-0 Ready, catalog nối lại) rồi thêm 15 giây request tốt trước khi dừng vòng.
    vm "$cp" 'ip=$(kubectl --request-timeout=10s get node cka-w1 -o jsonpath="{.status.addresses[?(@.type==\"InternalIP\")].address}"); end=$(($(date +%s) + 300))
      until [ "$(curl -s -o /dev/null -w %{http_code} --max-time 3 http://$ip:30180/api/products)" = 200 ] || [ $(date +%s) -ge $end ]; do sleep 3; done'
    wait_shop
    rebalance
    vm "$cp" "sleep 15; $loop stop ~/drills/s42/loop-w2.log"
  fi
fi

echo "== answers.env"
vm "$cp" 'out=$(grep -v "^#" ~/drills/s42/loop-w2.log | awk "\$3!=200 {if (!f) f=\$1; l=\$1} END {if (f) printf \"%d\", l-f+0.5; else print 0}")
printf "W2_OUTAGE_SECONDS=%s\nSKEW_RULE=3\n" "$out" > ~/drills/s42/answers.env; cat ~/drills/s42/answers.env
kubectl get node -o wide'
