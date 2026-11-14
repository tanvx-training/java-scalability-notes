# s17 — kiểm: mọi container (kể cả init container) của gateway, catalog, order có requests.cpu, requests.memory,
# limits.memory; mọi Pod của ba Deployment ở QoS Burstable; JAVA_OPTS có -XX:MaxRAMPercentage (heap tối đa chừa ≥ 128Mi dưới limit cho non-heap, không -Xmx/-Xms);
# ~/shop/<tên>.yaml có resources và khớp Deployment, ba Deployment Available đúng số replica; oom-lab đã xoá;
# answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for i in \$(seq 1 120); do
    u=\$(kubectl --request-timeout=10s -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null | awk '\$1!=\$2' | grep -c .)
    [ \"\$u\" = 0 ] && break; sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s17/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "gateway, catalog, order: mọi container (cả init) có requests.cpu, requests.memory, limits.memory ≥ requests" \
  "đạt" echo "$(fact RES)"
expect_eq "mọi Pod của gateway, catalog, order ở QoS Burstable" "đạt" echo "$(fact QOS)"
expect_eq "JAVA_OPTS của ba Deployment có -XX:MaxRAMPercentage, heap tối đa chừa ≥ 128Mi dưới limits.memory, không -Xmx/-Xms" "đạt" echo "$(fact JOPTS)"
expect_eq "~/shop/{gateway,catalog,order}.yaml có resources, khớp Deployment (resources, JAVA_OPTS); Available 2/2/1" \
  "đạt" echo "$(fact FILES)"
expect_eq "answers.env: OOM_REASON=OOMKilled; Deployment oom-lab đã xoá" "OOMKilled đã xoá" \
  echo "$(vm "$cp" "$(ans OOM_REASON)") $(fact OOMLAB)"
expect_eq "answers.env: OOM_EXIT_CODE=137 (128 + SIGKILL 9)" "137" vm "$cp" "$(ans OOM_EXIT_CODE)"
expect_eq "answers.env: QOS_GATEWAY=Burstable" "Burstable" vm "$cp" "$(ans QOS_GATEWAY)"
assert_summary
