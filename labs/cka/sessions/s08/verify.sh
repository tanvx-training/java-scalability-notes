# s08 — kiểm: từng giá trị trong ~/drills/s08/answers.env khớp giá trị script tự đọc trên cluster; Pod web-static-cka-w1
# Running (mirror pod của static pod); ~/.bashrc bật kubectl completion và completion cho alias k. Chỉ đọc.
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
w1=""
for v in $LAB_VMS; do [ "$v" = "$cp" ] || { w1="$v"; break; }; done
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl wait --for=condition=Ready node --all --timeout=180s" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")")"
for key in ETCD_DATA_DIR APISERVER_ADVERTISE_ADDRESS POD_CIDR SERVICE_CIDR KUBELET_CGROUP_DRIVER APISERVER_CERT_EXPIRY; do
  want="$(printf '%s\n' "$facts" | sed -n "s/^$key=//p")"
  expect_eq "answers.env: $key=${want:-?}" "${want:-?}" \
    vm "$cp" "sed -n 's/^$key=//p' ~/drills/s08/answers.env | tr -d '\"' | tail -n1"
done
expect_eq "Pod web-static-$w1 Running" "Running" \
  vm "$cp" "for i in \$(seq 1 30); do p=\$(kubectl get pod web-static-$w1 -o jsonpath='{.status.phase}' 2>/dev/null); [ \"\$p\" = Running ] && break; sleep 2; done; echo \$p"
expect_ok "~/.bashrc có source <(kubectl completion bash)" vm "$cp" "grep -Eq '^[[:space:]]*(source|\\.) <\\(kubectl completion bash\\)' ~/.bashrc"
expect_ok "~/.bashrc có complete -F __start_kubectl k" vm "$cp" "grep -Eq '^[[:space:]]*complete( -o default)? -F __start_kubectl k[[:space:]]*\$' ~/.bashrc"
expect_match "shell tương tác: complete -p k dùng __start_kubectl" '-F __start_kubectl k$' vm "$cp" "bash -ic 'complete -p k' 2>/dev/null"
assert_summary
