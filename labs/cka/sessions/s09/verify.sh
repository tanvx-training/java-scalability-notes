# s09 — kiểm: ba node Ready; kubelet active và enabled trên hai worker; Deployment thử 2 replica (anti-affinity theo
# node) chạy được trên hai worker. Namespace tạm, tự xoá: thứ duy nhất verify tạo ra. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl wait --for=condition=Ready node --all --timeout=120s" >/dev/null 2>&1 || true
for v in $LAB_VMS; do
  expect_eq "node $v Ready" "True" \
    vm "$cp" "kubectl get node $v -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status}'"
done
workers=""
for v in $LAB_VMS; do
  [ "$v" = "$cp" ] && continue
  workers="$workers $v"
  expect_eq "$v: kubelet active" "active" vm "$v" "systemctl is-active kubelet"
  expect_eq "$v: kubelet enabled" "enabled" vm "$v" "systemctl is-enabled kubelet"
done
vm_put "$SESSION_DIR/files/spread-test.sh" "$cp" /tmp/lab-spread-test.sh
expect_ok "Deployment thử 2 replica chạy trên hai worker" vm "$cp" "bash /tmp/lab-spread-test.sh$workers"
assert_summary
