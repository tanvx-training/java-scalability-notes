# s16 — kiểm (sau sự cố st2-pods-broken): mỗi Deployment về đúng trạng thái cuối s15 (image, số replica, rollout xong,
# EndpointSlice đủ địa chỉ ready, envFrom/volume/secretKeyRef/probe/preStop nguyên, ~/shop/<tên>.yaml khớp); gateway
# không có JAVA_OPTS; Pod report-once chạy image của CronJob order-report, gọi /api/orders, Succeeded; namespace shop
# không còn Pod lỗi hay Pod lẻ; answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Không chờ rollout đang kẹt: người học chạy verify nhiều lần giữa buổi sự cố. Có Pod đang hỏng thì đọc ngay; không có
# Pod hỏng mà Deployment chưa đủ Available (như ngay sau khi VM khởi động lại) thì chờ có giới hạn (tối đa ~3 phút).
cp="$LAB_CP"
echo "  (chờ apiserver và các Pod đang khởi động, nếu có)"
vm "$cp" "# Hạn theo đồng hồ (240 giây), không theo số vòng: mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 240))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s -n shop'
  while [ \$(date +%s) -lt \$end ]; do
    # Pod của ba service đang hỏng (đúng lúc buổi sự cố): đọc ngay, không chờ. (Pod Job của CronJob chạy bù sau khi
    # VM khởi động lại có thể CrashLoopBackOff trong lúc gateway chưa lên: không tính.)
    \$k get pod -l 'app in (gateway,catalog,order)' -o jsonpath='{range .items[*].status.containerStatuses[*]}{.state.waiting.reason}{\"\\n\"}{end}' 2>/dev/null \\
      | grep -qE 'CrashLoopBackOff|ImagePullBackOff|ErrImagePull|CreateContainerConfigError|InvalidImageName' && break
    # Không Pod nào hỏng: chờ tới khi mọi Deployment đủ Available (vd. ngay sau khi VM khởi động lại).
    # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát khi đọc được cả ba Deployment và cả ba đủ Available.
    o=\$(\$k get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s16/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "gateway: shop/gateway:2.0, 2/2/2, rollout xong, EndpointSlice 2/2; envFrom, volume, probe, preStop nguyên; ~/shop/gateway.yaml khớp" \
  "đạt" echo "$(fact DEP_gateway)"
expect_eq "catalog: shop/catalog:1.0, 2/2/2, rollout xong, EndpointSlice 2/2; secretKeyRef, probe, preStop nguyên; ~/shop/catalog.yaml khớp" \
  "đạt" echo "$(fact DEP_catalog)"
expect_eq "order: shop/order:1.0, 1/1/1, rollout xong, EndpointSlice 1/1; secretKeyRef, probe, preStop nguyên; ~/shop/order.yaml khớp" \
  "đạt" echo "$(fact DEP_order)"
expect_eq "gateway: không có JAVA_OPTS (như cuối s15)" "không có JAVA_OPTS" echo "$(fact JOPTS)"
ci="$(fact CRON_IMAGE)"
expect_eq "Pod report-once: image ${ci:-?} (như CronJob order-report), gọi /api/orders, Succeeded" "${ci:-?} /api/orders Succeeded" echo "$(fact REPORT)"
expect_eq "namespace shop: không Pod nào Failed, chờ vì lỗi, hay là Pod lẻ ngoài report-once" "sạch" echo "$(fact PODS)"
expect_eq "answers.env: REPORT_EXIT_CODE=1 (mã thoát của report-once trước khi sửa)" "1" vm "$cp" "$(ans REPORT_EXIT_CODE)"
expect_eq "answers.env: BAD_CHAR=c2a0 (hai byte của ký tự lạ trong JAVA_OPTS)" "c2a0" \
  vm "$cp" "$(ans BAD_CHAR) | tr 'A-F' 'a-f' | sed -e 's/0x//g' -e 's/\\\\x//g' -e 's/[ :]//g'"
assert_summary
