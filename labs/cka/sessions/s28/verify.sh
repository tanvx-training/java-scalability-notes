# s28 — kiểm (5 dòng): CoreDNS Available, Corefile có khối hosts với db.shop.internal trỏ ClusterIP của postgres-rw và
# fallthrough; Service postgres-rw (ClusterIP thường, 5432) có endpoint postgres-0, YAML trong ~/shop/; từ postgres-0 (Pod của
# shop) db.shop.internal ra IP postgres-rw và catalog.shop.svc.cluster.local vẫn ra ClusterIP của catalog, shop Available;
# NDOTS khớp resolv.conf của Pod, Pod nháp đã xoá; KUBE_DNS_IP. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn (420 giây cho apiserver, CoreDNS, postgres-0 và ba Deployment, cộng facts.sh với
# --request-timeout 10 giây mỗi lệnh và tối đa 5 lần tra tên: in ra ~10 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, CoreDNS, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~10 phút)"
vm "$cp" "# Hạn theo đồng hồ (420 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 420))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get sts postgres -o jsonpath='{.spec.replicas} {.status.readyReplicas}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && [ \"\${o% *}\" = \"\${o#* }\" ] && break
    sleep 3
  done
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được cả bốn Deployment và cả bốn đủ Available.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$( { \$k -n kube-system get deploy coredns -o jsonpath='{.spec.replicas} {.status.availableReplicas}{\"\\n\"}' &&
          \$k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}'; } 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 4 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done
  # Ngay sau khi VM bật lại, status trong API còn là của trước lúc tắt (node chưa bị coi là NotReady): hai vòng trên có thể thoát
  # ngay. Chờ thêm tới khi exec được vào postgres-0 và tên Service phân giải được từ đó (CoreDNS đã phục vụ).
  until \$k -n shop exec postgres-0 -c postgres -- getent hosts catalog.shop.svc.cluster.local >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 3; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "CoreDNS Available; Corefile có khối hosts: db.shop.internal → ClusterIP của postgres-rw, và fallthrough" "đạt" echo "$(fact COREDNS)"
expect_eq "Service postgres-rw: ClusterIP thường, cổng 5432, endpoint ready duy nhất là postgres-0; YAML trong ~/shop/" "đạt" echo "$(fact PGRW)"
expect_eq "Từ postgres-0: db.shop.internal ra IP của postgres-rw, catalog.shop.svc.cluster.local vẫn ra ClusterIP của catalog; shop Available" \
  "đạt" echo "$(fact LOOKUP)"
expect_eq "answers.env: NDOTS khớp /etc/resolv.conf của Pod shop; Pod nháp dnspolicy-lab, dns-default đã xoá" "đạt" echo "$(fact NDOTS)"
expect_eq "answers.env: KUBE_DNS_IP là ClusterIP của Service kube-dns" "đạt" echo "$(fact KUBE_DNS)"
assert_summary
