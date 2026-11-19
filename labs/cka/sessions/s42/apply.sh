# s42 — lời giải chuẩn: nâng cluster 1.36 → 1.37.2 theo trang "Upgrading kubeadm clusters". setup.sh (loop.sh, xoá
# answers.env); vòng request loop-cp-w1.log; cka-cp: repo apt v1.37, kubeadm 1.37.2 (unhold/hold), kéo trước image, `kubeadm
# upgrade plan`, `kubeadm upgrade apply v1.37.2 --yes`, drain, kubelet + kubectl 1.37.2, daemon-reload, restart kubelet,
# uncordon; cka-w1: repo, kubeadm, `kubeadm upgrade node`, drain, kubelet, uncordon, rollout restart service nào dồn về một
# worker; dừng vòng; vòng loop-w2.log và cka-w2 như cka-w1 (postgres-0 ngừng tới khi uncordon), chờ shop trả 200 lại, dừng
# vòng; answers.env (W2_OUTAGE_SECONDS đo từ loop-w2.log, SKEW_RULE). Node nào đã ở 1.37.2 (kubelet, gói, hold) thì bỏ qua,
# cả vòng request của nó: chạy lần hai trên cluster đã nâng chỉ ghi lại answers.env. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
V=1.37.2            # bản vá 1.37 hiện hành 2026-11-20 (https://dl.k8s.io/release/stable-1.37.txt; pkgs.k8s.io v1.37: 1.37.0–1.37.2)
PKG=1.37.2-1.1      # tên gói trong repo pkgs.k8s.io/core:/stable:/v1.37/deb
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
loop="~/drills/s42/loop.sh"
node_step() { vm "$1" "export STEP=$2 PKG=$PKG
$(cat "$SESSION_DIR/files/node.sh")"; }
# done_node <node>: kubelet báo v$V, gói đủ bản $PKG và hold.
done_node() {
  [ "$(vm "$cp" "kubectl --request-timeout=10s get node $1 -o jsonpath='{.status.nodeInfo.kubeletVersion}'" 2>/dev/null)" = "v$V" ] || return 1
  [ "$(vm "$1" "dpkg-query -W -f='\${Version} ' kubeadm kubelet kubectl; apt-mark showhold | grep -cxE 'kubeadm|kubelet|kubectl'" 2>/dev/null)" = "$PKG $PKG $PKG 3" ]
}
wait_shop() { # chờ gateway/catalog/order Available, tối đa 5 phút
  vm "$cp" 'end=$(($(date +%s) + 300)); until [ "$(kubectl --request-timeout=10s -n shop get deploy gateway catalog order -o jsonpath="{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\n\"}{end}" | awk "\$1!=\$2" | grep -c .)" = 0 ] || [ $(date +%s) -ge $end ]; do sleep 3; done'
}
rebalance() { # service nào có Pod Running chỉ trên một worker thì rollout restart (spread của chart trải lại)
  vm "$cp" 'for n in gateway catalog order; do
    nodes=$(kubectl --request-timeout=10s -n shop get pod -l app=$n --field-selector=status.phase=Running -o jsonpath="{range .items[*]}{.spec.nodeName}{\"\n\"}{end}" | sort -u | tr "\n" " ")
    case "$nodes" in *cka-w1*cka-w2*) ;; *) echo "$n chỉ ở: $nodes→ rollout restart"; kubectl -n shop rollout restart deploy/$n
      kubectl --request-timeout=10s -n shop rollout status deploy/$n --timeout=5m ;; esac
  done'
}
upgrade_worker() { # <node>: repo, kubeadm, kubeadm upgrade node, drain, kubelet, uncordon
  node_step "$1" repo
  node_step "$1" kubeadm
  vm "$1" "sudo kubeadm upgrade node" | tail -3
  vm "$cp" "kubectl drain $1 --ignore-daemonsets --delete-emptydir-data --timeout=5m"
  node_step "$1" kubelet
  vm "$cp" "sleep 10; kubectl get node $1; kubectl uncordon $1"
}

if done_node cka-cp && done_node cka-w1 && done_node cka-w2; then
  echo "s42: ba node đã ở v$V, gói $PKG và hold: bỏ qua phần nâng cấp, giữ log của lần nâng."
else
  if ! done_node cka-cp || ! done_node cka-w1; then
    vm "$cp" "$loop stop ~/drills/s42/loop-cp-w1.log >/dev/null; $loop start ~/drills/s42/loop-cp-w1.log; sleep 5"
    if ! done_node cka-cp; then
      echo "== cka-cp"
      node_step "$cp" repo
      node_step "$cp" kubeadm
      vm "$cp" "sudo kubeadm config images pull --kubernetes-version v$V"
      vm "$cp" "sudo kubeadm upgrade plan v$V" | sed -n '/^COMPONENT/,/^$/p'
      if [ "$(vm "$cp" "kubectl --request-timeout=10s -n kube-system get cm kubeadm-config -o jsonpath='{.data.ClusterConfiguration}' | sed -n 's/^kubernetesVersion: //p'")" != "v$V" ]; then
        vm "$cp" "sudo kubeadm upgrade apply v$V --yes" | tail -4
      fi
      vm "$cp" "kubectl drain cka-cp --ignore-daemonsets --delete-emptydir-data --timeout=5m"
      node_step "$cp" kubelet
      vm "$cp" "sleep 10; kubectl get node cka-cp; kubectl uncordon cka-cp"
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
