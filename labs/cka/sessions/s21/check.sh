# s21 — kiểm đầu vào (thay verify.sh của s20): như verify của s20 trừ dòng "shop-quota đủ chỗ cho catalog ở maxReplicas".
# Sự cố st3-pending hạ requests.memory của shop-quota xuống 1Gi, nên dòng đó đỏ suốt buổi sự cố: bỏ nó đi để
# `begin cka s21` chạy lại được giữa chừng (gây lại sự cố, xoá answers.env cũ) mà không phải restore. Quota được
# verify của s21 chấm đúng giá trị cuối s18. Phần còn lại của s20 (metrics-server, kubectl top, HPA catalog, đáp án s20,
# hpa-lab đã xoá) sự cố không đụng tới. Dùng facts.sh của s20. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
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

facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s20/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "metrics-server (kube-system): image ghim phiên bản, có --kubelet-insecure-tls, Available; APIService v1beta1.metrics.k8s.io Available" \
  "đạt" echo "$(fact MS)"
expect_eq "kubectl top nodes: có số cho cả 3 node" "3" echo "$(fact TOP_NODES)"
expect_eq "HPA catalog: Deployment catalog, min 2, max 3, CPU Utilization 60%, behavior.scaleDown 60 giây; ~/shop/catalog-hpa.yaml (autoscaling/v2) khớp" \
  "đạt" echo "$(fact HPA)"
expect_eq "HPA catalog đọc được CPU (status.currentMetrics có số, ScalingActive); catalog Available trong khoảng 2..3" \
  "đạt" echo "$(fact CURRENT)"
expect_eq "answers.env: MAX_REPLICAS_SEEN=3 (= maxReplicas); không còn Pod lẻ sinh tải trong shop" "đạt" echo "$(fact SEEN)"
expect_eq "answers.env: UNKNOWN_REASON=FailedGetResourceMetric (Event của HPA nháp thiếu requests.cpu); namespace hpa-lab đã xoá" \
  "FailedGetResourceMetric đã xoá" echo "$(fact UNKNOWN_REASON) $(fact HPA_LAB)"
assert_summary
