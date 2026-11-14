# s13 — kiểm: ba Deployment của shop có startupProbe + livenessProbe → /actuator/health/liveness và readinessProbe →
# /actuator/health/readiness (cổng 8080), đủ replica Available và EndpointSlice chỉ chứa địa chỉ ready; preStop và
# terminationGracePeriodSeconds khai rõ, đủ cho preStop + 20 giây shutdown của Spring; gateway có initContainer
# wait-catalog; ~/shop/*.yaml khớp Deployment đang chạy; Deployment nháp probe-lab đã xoá; answers.env khớp.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment; lâu nhất vài phút nếu Pod đang khởi động)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=240s; done
  # EndpointSlice controller cập nhật ready sau khi Deployment đã thấy Pod Available: chờ tối đa 30 giây tới khi số địa
  # chỉ ready (không terminating) bằng số replica của từng Deployment.
  for i in \$(seq 1 15); do ok=1
    for d in gateway catalog order; do
      n=\$(kubectl -n shop get deploy \$d -o jsonpath='{.spec.replicas}' 2>/dev/null)
      r=\$(kubectl -n shop get endpointslices -l kubernetes.io/service-name=\$d -o jsonpath='{range .items[*].endpoints[*]}{.conditions.ready}/{.conditions.terminating}{\"\\n\"}{end}' 2>/dev/null | grep -cE '^true/(false)?$')
      [ -n \"\$n\" ] && [ \"\$r\" != \"\$n\" ] && ok=0
    done
    [ \$ok = 1 ] && break; sleep 2
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s13/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }
lv="/actuator/health/liveness:8080"; rd="/actuator/health/readiness:8080"

for spec in gateway:1 catalog:2 order:1; do
  d="${spec%%:*}"; n="${spec##*:}"
  expect_eq "$d: startup/liveness → $lv, readiness → $rd; $n/$n/$n Available, EndpointSlice $n/$n địa chỉ ready" \
    "startup=$lv liveness=$lv readiness=$rd $n/$n/$n eps=$n/$n" echo "$(fact "PROBES_$d") $(fact "AVAIL_$d")"
done
for d in gateway catalog order; do
  expect_match "$d: preStop có, terminationGracePeriodSeconds khai rõ và ≥ preStop + 20 giây" '^đạt ' echo "$(fact "STOP_$d")"
done
expect_eq "gateway: initContainer wait-catalog" "wait-catalog" echo "$(fact INIT_gateway)"
for d in gateway catalog order; do
  expect_eq "~/shop/$d.yaml (apply --dry-run=server): probe, preStop, grace khớp Deployment đang chạy" "khớp" echo "$(fact "FILE_$d")"
done
expect_eq "answers.env: READINESS_RESTARTS=0 (readiness sai không restart); probe-lab đã xoá" "0 đã xoá" \
  vm "$cp" "echo \"\$($(ans READINESS_RESTARTS)) $(fact PROBELAB)\""
expect_eq "answers.env: LIVENESS_RESTARTS_GE1=yes (liveness sai thì kubelet restart container)" "yes" vm "$cp" "$(ans LIVENESS_RESTARTS_GE1)"
expect_eq "answers.env: LIVENESS_EXIT_CODE=143 (lastState.terminated của container bị liveness giết: SIGTERM)" "143" \
  vm "$cp" "$(ans LIVENESS_EXIT_CODE)"
expect_eq "answers.env: PROBE_PERIOD_DEFAULT=10 (k explain …livenessProbe.periodSeconds)" "10" vm "$cp" "$(ans PROBE_PERIOD_DEFAULT)"
assert_summary
