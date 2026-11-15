# s23 — kiểm: local-path-provisioner (image ghim phiên bản, Available, Pod trên cka-cp, image helper Pod ghim tag); đúng
# một StorageClass mặc định và là local-path (rancher.io/local-path, WaitForFirstConsumer); answers.env WFFC_REASON; không
# còn PVC/PV nháp; PV shop-data của s22 vẫn Retain, Bound. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại, Pod provisioner cần vài chục giây mới Ready (startupProbe): chờ có giới hạn.
cp="$LAB_CP"
echo "  (chờ apiserver và local-path-provisioner, nếu đang khởi động: tối đa ~5 phút)"
vm "$cp" "# Hạn theo đồng hồ (300 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 300))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  \$k -n local-path-storage get deploy local-path-provisioner >/dev/null 2>&1 || exit 0
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được và đã đủ Available.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n local-path-storage get deploy local-path-provisioner -o jsonpath='{.spec.replicas} {.status.availableReplicas}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && [ \"\${o% *}\" = \"\${o#* }\" ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "local-path-provisioner (local-path-storage): image ghim phiên bản, Available, Pod chạy trên cka-cp; image helper Pod ghim tag" \
  "đạt" echo "$(fact PROVISIONER)"
expect_eq "StorageClass: đúng một mặc định và là local-path (rancher.io/local-path, WaitForFirstConsumer)" "đạt" echo "$(fact SC)"
expect_eq "answers.env: WFFC_REASON=WaitForFirstConsumer; không còn PVC/PV nháp; PV shop-data vẫn Retain, Bound với shop/shop-data" \
  "WaitForFirstConsumer đạt" echo "$(fact WFFC_REASON) $(fact CLEAN)"
assert_summary
