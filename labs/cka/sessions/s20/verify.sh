# s20 — kiểm: metrics-server trong kube-system (image ghim phiên bản, --kubelet-insecure-tls, Available; APIService
# v1beta1.metrics.k8s.io Available); `kubectl top nodes` ra 3 dòng; HPA catalog (autoscaling/v2 trong
# ~/shop/catalog-hpa.yaml, min 2, max theo số đo, CPU 60%, behavior.scaleDown 60 giây) khớp tệp và đang đọc được số
# CPU; shop-quota đủ chỗ cho catalog ở maxReplicas; answers.env; không còn Pod tải hay namespace nháp hpa-lab.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại, metrics-server cần ~1 phút mới có số và HPA thêm một chu kỳ 15 giây: chờ có giới hạn.
cp="$LAB_CP"
echo "  (chờ apiserver, ba Deployment, kubectl top và số CPU của HPA, nếu đang khởi động: tối đa ~10 phút)"
vm "$cp" "# Hạn theo đồng hồ (600 giây), không theo số vòng: mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 600))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được và đã đạt.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done
  \$k -n kube-system get deploy metrics-server >/dev/null 2>&1 || exit 0
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k top nodes --no-headers 2>/dev/null) && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$2 ~ /^[0-9]/' | grep -c .)\" = 3 ] && break
    sleep 3
  done
  \$k -n shop get hpa catalog >/dev/null 2>&1 || exit 0
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get hpa catalog -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "metrics-server (kube-system): image ghim phiên bản, có --kubelet-insecure-tls, Available; APIService v1beta1.metrics.k8s.io Available" \
  "đạt" echo "$(fact MS)"
expect_eq "kubectl top nodes: có số cho cả 3 node" "3" echo "$(fact TOP_NODES)"
expect_eq "HPA catalog: Deployment catalog, min 2, max 3, CPU Utilization 60%, behavior.scaleDown 60 giây; ~/shop/catalog-hpa.yaml (autoscaling/v2) khớp" \
  "đạt" echo "$(fact HPA)"
expect_eq "HPA catalog đọc được CPU (status.currentMetrics có số, ScalingActive); catalog Available trong khoảng 2..3" \
  "đạt" echo "$(fact CURRENT)"
expect_eq "shop-quota đủ chỗ cho catalog ở maxReplicas (pods, requests.cpu, requests.memory, limits.memory)" "đạt" echo "$(fact QUOTA_ROOM)"
expect_eq "answers.env: MAX_REPLICAS_SEEN=3 (= maxReplicas); không còn Pod lẻ sinh tải trong shop" "đạt" echo "$(fact SEEN)"
expect_eq "answers.env: UNKNOWN_REASON=FailedGetResourceMetric (Event của HPA nháp thiếu requests.cpu); namespace hpa-lab đã xoá" \
  "FailedGetResourceMetric đã xoá" echo "$(fact UNKNOWN_REASON) $(fact HPA_LAB)"
assert_summary
