# s21 — kiểm (sau sự cố st3-pending): order không còn nodeSelector, gateway có lại tài nguyên cuối s17, shop-quota về
# giá trị cuối s18 (cả ba khớp ~/shop/*.yaml); ba Deployment Available, không Pod Pending, không ReplicaSet FailedCreate
# trong shop; hai worker schedulable, không taint thừa; Pod batch-7f và mem-probe ở default đã xoá; answers.env khớp.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Không chờ rollout đang kẹt (người học chạy verify nhiều lần giữa buổi sự cố): chỉ chờ khi không có gì đang hỏng mà
# Deployment chưa đủ Available (như ngay sau khi VM khởi động lại), tối đa ~6 phút. PROBE_REASON không phân biệt hoa thường.
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)"
vm "$cp" "# Hạn theo đồng hồ (360 giây), không theo số vòng: mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 360))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  while [ \$(date +%s) -lt \$end ]; do
    # Đang có lỗi của buổi sự cố (Pod chưa xếp được, ReplicaSet FailedCreate, node cordon): đọc ngay, không chờ.
    # Chỉ xét Pod của ba service: Pod Job của CronJob chạy bù ngay sau khi VM khởi động lại có thể thoáng Pending.
    o=\$(\$k -n shop get pod -l 'app in (gateway,catalog,order)' -o jsonpath='{range .items[*]}{.status.conditions[?(@.type==\"PodScheduled\")].status}{\"\\n\"}{end}' 2>/dev/null) \\
      && printf '%s\\n' \"\$o\" | grep -qx False && break
    o=\$(\$k -n shop get rs -o jsonpath='{range .items[*]}{.status.conditions[?(@.type==\"ReplicaFailure\")].status}{\"\\n\"}{end}' 2>/dev/null) \\
      && printf '%s\\n' \"\$o\" | grep -qx True && break
    o=\$(\$k get node cka-w1 cka-w2 -o jsonpath='{range .items[*]}{.spec.unschedulable}{\"\\n\"}{end}' 2>/dev/null) \\
      && printf '%s\\n' \"\$o\" | grep -qx true && break
    # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát khi đọc được cả ba Deployment và cả ba đủ Available.
    o=\$(\$k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s21/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "order: không nodeSelector/nodeAffinity, 1/1/1, rollout xong; ~/shop/order.yaml khớp" "đạt" echo "$(fact ORDER)"
expect_eq "gateway: tài nguyên như cuối s17 (100m/256Mi/384Mi, init 10m/16Mi/32Mi), 2/2/2, rollout xong; ~/shop/gateway.yaml khớp" \
  "đạt" echo "$(fact GATEWAY)"
expect_eq "shop-quota: pods 20, requests.cpu 2, requests.memory 3Gi, limits.memory 5Gi (như cuối s18); ~/shop/quota.yaml khớp" \
  "đạt" echo "$(fact QUOTA)"
expect_eq "shop: catalog Available trong khoảng của HPA; không Pod nào Pending, không ReplicaSet FailedCreate" "đạt" echo "$(fact SHOP)"
expect_eq "cka-w1, cka-w2: schedulable (không cordon), không taint thừa" "đạt" echo "$(fact NODES)"
expect_eq "answers.env: HOG_NS=default, HOG_POD=batch-7f (Pod ngốn CPU nhất cụm); Pod batch-7f đã xoá" "default/batch-7f đã xoá" \
  echo "$(vm "$cp" "$(ans HOG_NS)")/$(vm "$cp" "$(ans HOG_POD)") $(fact BATCH)"
expect_match "answers.env: PROBE_REASON có 'Insufficient memory' (FailedScheduling của Pod thử mem-probe); mem-probe đã xoá" \
  "insufficient memory.* đã xoá\$" echo "$(vm "$cp" "$(ans PROBE_REASON)" | LC_ALL=C tr 'A-Z' 'a-z' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//') $(fact PROBE)"
assert_summary
