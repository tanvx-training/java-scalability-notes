# s45 — lời giải chuẩn: gây sự cố st8-ops như `begin` (setup.sh: xoá answers.env, lab_break st8-ops), rồi chẩn đoán và sửa
# theo thứ tự của buổi: control plane trước (files/solve-cp.sh: kubectl → kubelet → crictl → manifest etcd → sửa về bản
# tốt → etcd từ /var/lib/etcd-restore healthy → apiserver /readyz), rồi node (k get node thấy cka-w2 v1.36; trên cka-w2:
# unhold, cài kubelet/kubectl 1.37.2-1.1 từ repo v1.37, hold, restart kubelet: s42/files/node.sh STEP=kubelet), rồi
# answers.env (BROKEN_COMPONENTS) và chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
PKG=1.37.2-1.1
. "$SESSION_DIR/setup.sh"
vm "$cp" "$(cat "$SESSION_DIR/files/solve-cp.sh")"
echo "s45: 7. phiên bản từng node"
vm "$cp" "kubectl --request-timeout=10s get node; kubectl version 2>/dev/null | tail -1"
echo "s45: 8. cka-w2: kubelet --version, gói, hold; nâng kubelet và kubectl về $PKG"
vm cka-w2 "kubelet --version; dpkg-query -W -f='\${Package} \${Version}\n' kubeadm kubelet kubectl; apt-mark showhold"
vm cka-w2 "export STEP=kubelet PKG=$PKG
$(cat "$SESSION_DIR/../s42/files/node.sh")"
vm "$cp" 'end=$(($(date +%s) + 120))
until [ "$(kubectl --request-timeout=5s get node cka-w2 -o jsonpath={.status.nodeInfo.kubeletVersion} 2>/dev/null)" = v1.37.2 ] || [ $(date +%s) -ge $end ]; do sleep 2; done
kubectl --request-timeout=10s get node
echo "BROKEN_COMPONENTS=etcd,kubelet" > ~/drills/s45/answers.env
cat ~/drills/s45/answers.env'
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
