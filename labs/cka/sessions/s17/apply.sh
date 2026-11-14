# s17 — lời giải chuẩn: requests/limits cho ba Deployment (requests.cpu, requests.memory, limits.memory; không đặt
# limits.cpu → QoS Burstable) và JAVA_OPTS=-XX:MaxRAMPercentage=50 (~/shop/{gateway,catalog,order}.yaml); Deployment
# nháp oom-lab với -Xmx bằng memory limit, gọi /internal/alloc cho tới khi kernel giết container (OOMKilled, 137), rồi
# sửa bằng MaxRAMPercentage và gọi lại (JVM báo OutOfMemoryError, container sống); xoá oom-lab; ghi
# ~/drills/s17/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in gateway.yaml catalog.yaml order.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s17-$f"
done
echo "s17: requests/limits và MaxRAMPercentage cho ba Deployment"
vm "$cp" "set -e
  mkdir -p ~/shop ~/drills/s17
  for f in gateway.yaml catalog.yaml order.yaml; do install -m 644 /tmp/lab-s17-\$f ~/shop/\$f; rm -f /tmp/lab-s17-\$f; done
  # catalog trước: init container của gateway chờ catalog sẵn sàng.
  for d in catalog order gateway; do
    kubectl apply -f ~/shop/\$d.yaml >/dev/null
    kubectl -n shop rollout status deploy/\$d --timeout=420s >/dev/null
  done"

# Hàm dùng trong VM: pod = tên Pod đang chạy của oom-lab; alloc <mb> gọi /internal/alloc qua apiserver proxy.
fns="pod() { kubectl -n shop get pod -l app=oom-lab --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null; }
  up() { for i in \$(seq 1 90); do p=\$(pod); [ -n \"\$p\" ] && kubectl get --raw \"/api/v1/namespaces/shop/pods/\$p:8080/proxy/actuator/health\" 2>/dev/null | grep -q UP && return 0; sleep 2; done; return 1; }
  alloc() { kubectl get --raw \"/api/v1/namespaces/shop/pods/\$(pod):8080/proxy/internal/alloc?mb=\$1\" 2>&1 | tail -n1; }"

echo "s17: oom-lab với -Xmx bằng memory limit, gọi /internal/alloc (khoảng hai phút)"
res="$(vm "$cp" "set -e; $fns
  kubectl -n shop delete deploy oom-lab --ignore-not-found --wait=true >/dev/null
  kubectl -n shop wait --for=delete pod -l app=oom-lab --timeout=120s >/dev/null 2>&1 || true
  # Một lần apply (một ReplicaSet): create rồi set env/resources trên Deployment đang chạy sẽ tạo ba ReplicaSet, và
  # Pod cũ (chưa có limit) đang dừng có thể nhận request alloc thay cho Pod mới.
  kubectl -n shop create deploy oom-lab --image=shop/catalog:1.0 --dry-run=client -o yaml \\
    | kubectl set env --local -f - JAVA_OPTS=-Xmx384m -o yaml \\
    | kubectl set resources --local -f - --requests=cpu=50m,memory=384Mi --limits=memory=384Mi -o yaml \\
    | kubectl apply -f - >/dev/null
  kubectl -n shop rollout status deploy/oom-lab --timeout=300s >/dev/null
  for i in \$(seq 1 60); do [ \"\$(kubectl -n shop get pod -l app=oom-lab -o name | grep -c .)\" = 1 ] && break; sleep 2; done
  up
  alloc 320 >/dev/null || true
  r=''; for i in \$(seq 1 60); do
    r=\$(kubectl -n shop get pod -l app=oom-lab -o jsonpath='{.items[0].status.containerStatuses[0].lastState.terminated.reason} {.items[0].status.containerStatuses[0].lastState.terminated.exitCode}')
    [ \"\$r\" != ' ' ] && break; sleep 2
  done; echo \"\$r\"")"
echo "s17: lastState của oom-lab: $res"
[ "$res" = "OOMKilled 137" ] || { echo "s17: oom-lab không bị OOMKilled: '$res'" >&2; exit 1; }

echo "s17: sửa oom-lab bằng MaxRAMPercentage=50, gọi lại /internal/alloc"
out="$(vm "$cp" "set -e; $fns
  kubectl -n shop set env deploy/oom-lab JAVA_OPTS=-XX:MaxRAMPercentage=50 >/dev/null
  kubectl -n shop rollout status deploy/oom-lab --timeout=300s >/dev/null
  for i in \$(seq 1 60); do [ \"\$(kubectl -n shop get pod -l app=oom-lab -o name | grep -c .)\" = 1 ] && break; sleep 2; done
  up
  a=\$(alloc 320); sleep 5
  echo \"\$a | restarts=\$(kubectl -n shop get pod \$(pod) -o jsonpath='{.status.containerStatuses[0].restartCount}')\"")"
echo "s17: sau khi sửa: $out"
case "$out" in *restarts=0) ;; *) echo "s17: oom-lab vẫn bị giết sau khi đặt MaxRAMPercentage" >&2; exit 1 ;; esac

qos="$(vm "$cp" "set -e; $fns
  kubectl -n shop delete deploy oom-lab --wait=true >/dev/null
  kubectl -n shop get pod -l app=gateway -o jsonpath='{.items[0].status.qosClass}'")"
vm "$cp" "printf 'OOM_REASON=%s\nOOM_EXIT_CODE=%s\nQOS_GATEWAY=%s\n' '${res% *}' '${res#* }' '$qos' > ~/drills/s17/answers.env"
