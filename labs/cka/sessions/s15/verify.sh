# s15 — kiểm: DaemonSet log-agent có Pod ready trên cả 3 node, image busybox ghim tag, /var/log từ hostPath chỉ đọc;
# Job seed completions 3, backoffLimit 2, succeeded 3; CronJob order-report đúng lịch và giới hạn lịch sử, đã có
# lastSuccessfulTime; Job order-report-manual Complete và tạo từ CronJob; ~/shop/{log-agent,seed,order-report}.yaml qua
# --dry-run=server; Job seed-bad đã xoá và answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và DaemonSet log-agent; lâu nhất vài phút nếu Pod đang khởi động)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n shop get ds log-agent >/dev/null 2>&1 && kubectl -n shop rollout status ds/log-agent --timeout=240s" >/dev/null 2>&1 || true

nodes="$(vm "$cp" "kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{\"\\n\"}{end}' | sort | tr '\\n' ' '" 2>/dev/null)"
nodes="${nodes% }"
expect_eq "DaemonSet log-agent: desired = ready = 3, một Pod Running trên mỗi node (${nodes:-?})" "3/3 ${nodes:-?}" \
  vm "$cp" "s=\$(kubectl -n shop get ds log-agent -o jsonpath='{.status.desiredNumberScheduled}/{.status.numberReady}') || exit 1
    n=\$(kubectl -n shop get pod -l app=log-agent --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}' | sort | tr '\\n' ' ')
    echo \"\$s \${n% }\""
expect_eq "log-agent: image busybox ghim tag (không latest), hostPath /var/log mount chỉ đọc" "đạt" \
  vm "$cp" "o=\$(kubectl -n shop get ds log-agent -o json) || exit 1
    printf '%s' \"\$o\" | python3 -c '
import json, sys
s = json.load(sys.stdin)[\"spec\"][\"template\"][\"spec\"]; c = s[\"containers\"][0]; img = c.get(\"image\", \"\")
hp = {v[\"name\"] for v in s.get(\"volumes\", []) if (v.get(\"hostPath\") or {}).get(\"path\", \"\").rstrip(\"/\") == \"/var/log\"}
ro = [m for m in c.get(\"volumeMounts\", []) if m[\"name\"] in hp and m.get(\"readOnly\")]
tag = img.rsplit(\":\", 1)[1] if \":\" in img.rsplit(\"/\", 1)[-1] else \"\"
bad = []
if not img.split(\"/\")[-1].startswith(\"busybox\") or tag in (\"\", \"latest\"): bad.append(\"image \" + img)
if not ro: bad.append(\"không có mount chỉ đọc từ hostPath /var/log\")
print(\"; \".join(bad) or \"đạt\")'"
expect_eq "Job seed: completions 3, backoffLimit 2, succeeded 3" "3 2 3" \
  vm "$cp" "kubectl -n shop get job seed -o jsonpath='{.spec.completions} {.spec.backoffLimit} {.status.succeeded}'"
expect_eq "CronJob order-report: lịch */5 * * * *, giữ 2 Job thành công / 1 Job lỗi, đã có lastSuccessfulTime" \
  "*/5 * * * * 2/1 có" \
  vm "$cp" "o=\$(kubectl -n shop get cronjob order-report -o jsonpath='{.spec.schedule} {.spec.successfulJobsHistoryLimit}/{.spec.failedJobsHistoryLimit}|{.status.lastSuccessfulTime}') || exit 1
    t=\${o#*|}; echo \"\${o%%|*} \${t:+có}\""
expect_eq "Job order-report-manual: Complete, tạo từ CronJob order-report (ownerReference)" "Complete CronJob/order-report" \
  vm "$cp" "kubectl -n shop get job order-report-manual -o jsonpath='{.status.conditions[?(@.status==\"True\")].type} {.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}' | sed 's/SuccessCriteriaMet //'"
expect_eq "~/shop/log-agent.yaml, seed.yaml, order-report.yaml qua apply --dry-run=server" \
  "DaemonSet/log-agent Job/seed CronJob/order-report" \
  vm "$cp" "for f in log-agent seed order-report; do kubectl apply --dry-run=server -f ~/shop/\$f.yaml -o jsonpath='{.kind}/{.metadata.name}{\"\\n\"}' || exit 1; done | tr '\\n' ' '"
expect_eq "answers.env: BROKEN_JOB_REASON=BackoffLimitExceeded; Job seed-bad đã xoá" "BackoffLimitExceeded đã xoá" \
  vm "$cp" "a=\$(sed -n 's/^BROKEN_JOB_REASON=//p' ~/drills/s15/answers.env 2>/dev/null | tr -d '\"' | tail -n1)
    j=\$(kubectl -n shop get job seed-bad --ignore-not-found -o name) || exit 1
    echo \"\$a \${j:-đã xoá}\""
assert_summary
