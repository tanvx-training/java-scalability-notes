# s15 — lời giải chuẩn: ~/shop/log-agent.yaml (DaemonSet busybox, hostPath /var/log chỉ đọc, toleration control plane),
# ~/shop/seed.yaml (Job 3 lần POST /api/orders qua gateway, backoffLimit 2), ~/shop/order-report.yaml (CronJob */5 gọi
# GET /api/orders, giữ 2 Job thành công / 1 Job lỗi); apply; chạy CronJob ngay bằng create job --from và lưu YAML của
# Job đó vào ~/drills/s15/order-report-manual.yaml; thử một Job lệnh
# sai chạm backoffLimit, đọc lý do rồi xoá; ghi ~/drills/s15/answers.env.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in log-agent.yaml seed.yaml order-report.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s15-$f"
done
echo "s15: DaemonSet log-agent, Job seed, CronJob order-report"
vm "$cp" "set -e
  mkdir -p ~/shop ~/drills/s15
  for f in log-agent.yaml seed.yaml order-report.yaml; do install -m 644 /tmp/lab-s15-\$f ~/shop/\$f; rm -f /tmp/lab-s15-\$f; done
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  # Template của Job bất biến: chỉ xoá và tạo lại khi Job seed chưa có hoặc chưa đủ 3 lần thành công.
  if [ \"\$(kubectl -n shop get job seed -o jsonpath='{.status.succeeded}' 2>/dev/null)\" != 3 ]; then
    kubectl -n shop delete job seed --ignore-not-found --wait=true >/dev/null
  fi
  kubectl apply -f ~/shop/log-agent.yaml -f ~/shop/seed.yaml -f ~/shop/order-report.yaml >/dev/null
  kubectl -n shop rollout status ds/log-agent --timeout=300s >/dev/null
  kubectl -n shop wait --for=condition=Complete job/seed --timeout=300s >/dev/null
  kubectl -n shop delete job order-report-manual --ignore-not-found --wait=true >/dev/null
  kubectl -n shop create job order-report-manual --from=cronjob/order-report >/dev/null
  kubectl -n shop wait --for=condition=Complete job/order-report-manual --timeout=180s >/dev/null
  # Job chạy tay cũng thuộc CronJob (ownerReference) nên có thể bị dọn theo successfulJobsHistoryLimit: lưu bằng chứng.
  kubectl -n shop get job order-report-manual -o yaml > ~/drills/s15/order-report-manual.yaml"

# Tình huống hỏng: lệnh gọi sai đường dẫn → wget thoát 1 → sau backoffLimit lần thử, Job dừng với lý do riêng.
echo "s15: Job seed-bad chạm backoffLimit (khoảng một phút)"
reason="$(vm "$cp" "kubectl -n shop delete job seed-bad --ignore-not-found --wait=true >/dev/null
  kubectl -n shop create job seed-bad --image=busybox:1.37 --dry-run=client -o yaml -- sh -c 'wget -qO- http://gateway:8080/api/order' \\
    | sed 's/^spec:\$/spec:\\n  backoffLimit: 1/' | kubectl apply -f - >/dev/null
  r=''; for i in \$(seq 1 90); do
    r=\$(kubectl -n shop get job seed-bad -o jsonpath='{.status.conditions[?(@.type==\"Failed\")].reason}' 2>/dev/null)
    [ -n \"\$r\" ] && break; sleep 2
  done
  kubectl -n shop delete job seed-bad --wait=true >/dev/null; echo \"\$r\"")"
[ "$reason" = BackoffLimitExceeded ] || { echo "s15: Job seed-bad không dừng với BackoffLimitExceeded: '$reason'" >&2; exit 1; }
vm "$cp" "printf 'BROKEN_JOB_REASON=%s\n' '$reason' > ~/drills/s15/answers.env"
