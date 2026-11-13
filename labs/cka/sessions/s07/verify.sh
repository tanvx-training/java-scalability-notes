# s07 — kiểm: ba node Ready đúng minor, calico-node Running trên từng node, kubectl chạy bằng user ubuntu trên cka-cp,
# Pod trên cka-w1 ping được Pod trên cka-w2 (namespace tạm, tự xoá: thứ duy nhất verify tạo ra).
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
minor_re="$(printf '%s' "$K8S_INSTALL_MINOR" | sed 's/\./\\./g')"
# Sau khi bật VM, apiserver và kubelet cần một lúc: chờ có giới hạn (không sửa gì)
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl wait --for=condition=Ready node --all --timeout=180s
  kubectl -n kube-system rollout status daemonset/calico-node --timeout=180s" >/dev/null 2>&1 || true

expect_ok "kubectl chạy được bằng user ubuntu trên $cp" vm "$cp" "test \$(id -un) = ubuntu && kubectl get --raw /readyz"
for v in $LAB_VMS; do
  expect_match "node $v Ready, kubelet v$K8S_INSTALL_MINOR" "^True v$minor_re\\.[0-9]+\$" \
    vm "$cp" "kubectl get node $v -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status} {.status.nodeInfo.kubeletVersion}'"
done
for v in $LAB_VMS; do
  expect_match "calico-node Running và Ready trên $v" '(^| )Running/true( |$)' \
    vm "$cp" "kubectl -n kube-system get pods -l k8s-app=calico-node --field-selector spec.nodeName=$v -o jsonpath='{range .items[*]}{.status.phase}/{.status.containerStatuses[0].ready} {end}'"
done
w1=""; w2=""
for v in $LAB_VMS; do
  [ "$v" = "$cp" ] && continue
  if [ -z "$w1" ]; then w1="$v"; else w2="$v"; fi
done
vm_put "$SESSION_DIR/files/pod-ping.sh" "$cp" /tmp/lab-pod-ping.sh
expect_ok "Pod trên $w1 ping được Pod trên $w2" vm "$cp" "bash /tmp/lab-pod-ping.sh $w1 $w2"
assert_summary
