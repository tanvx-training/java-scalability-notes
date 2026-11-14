# s15 — kiểm: DaemonSet log-agent có Pod Ready trên cả 3 node, image busybox ghim tag, /var/log từ hostPath chỉ đọc;
# Job seed completions 3, backoffLimit 2, succeeded 3, lệnh POST /api/orders qua gateway; CronJob order-report lịch
# */5, giữ 2/1 Job, concurrencyPolicy Forbid, lệnh GET /api/orders qua gateway, đã có lastSuccessfulTime; bằng chứng Job
# order-report-manual (YAML người học lưu: ownerReference tới đúng CronJob, annotation instantiate=manual, Complete) —
# chấm qua tệp vì CronJob có thể dọn Job đó theo successfulJobsHistoryLimit; ~/shop/{log-agent,seed,order-report}.yaml
# khớp cluster; Job seed-bad đã xoá và answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và DaemonSet log-agent; lâu nhất vài phút nếu Pod đang khởi động)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n shop get ds log-agent >/dev/null 2>&1 && kubectl -n shop rollout status ds/log-agent --timeout=240s" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
nodes="$(fact NODES)"

expect_eq "DaemonSet log-agent: desired = ready = 3, một Pod Ready trên mỗi node (${nodes:-?})" "3/3 ${nodes:-?}" echo "$(fact DS)"
expect_eq "log-agent: image busybox ghim tag (không latest), hostPath /var/log mount chỉ đọc" "đạt" echo "$(fact DSCONF)"
expect_eq "Job seed: completions 3, backoffLimit 2, succeeded 3, lệnh POST /api/orders qua gateway" "đạt" echo "$(fact SEED)"
expect_eq "CronJob order-report: */5 * * * *, giữ 2/1 Job, concurrencyPolicy Forbid, GET /api/orders qua gateway, đã có lastSuccessfulTime" \
  "đạt" echo "$(fact CRON)"
expect_eq "~/drills/s15/order-report-manual.yaml: Job tạo từ CronJob order-report (ownerReference, instantiate=manual), Complete" \
  "đạt" echo "$(fact MANUAL)"
expect_eq "~/shop/log-agent.yaml, seed.yaml, order-report.yaml qua apply --dry-run=server, khớp cluster" "đạt" echo "$(fact FILES)"
expect_eq "answers.env: BROKEN_JOB_REASON=BackoffLimitExceeded; Job seed-bad đã xoá" "BackoffLimitExceeded đã xoá" \
  vm "$cp" "a=\$(sed -n 's/^BROKEN_JOB_REASON=//p' ~/drills/s15/answers.env 2>/dev/null | tr -d '\"' | tail -n1)
    j=\$(kubectl -n shop get job seed-bad --ignore-not-found -o name) || exit 1
    echo \"\$a \${j:-đã xoá}\""
assert_summary
