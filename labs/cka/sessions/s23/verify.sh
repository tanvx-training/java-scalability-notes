# s23 — kiểm (4 dòng): local-path-provisioner (image ghim phiên bản, Available, Pod trên cka-cp, image helper Pod ghim tag); đúng
# một StorageClass mặc định và là local-path (rancher.io/local-path, WaitForFirstConsumer); answers.env WFFC_REASON; không
# còn PVC/PV nháp; PV shop-data của s22 vẫn Retain, Bound; hai vòng Delete/Retain (DELETED_PV, RETAINED_PV, RETAINED_PHASE). Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại, Pod provisioner cần vài chục giây mới Ready (startupProbe): chờ có giới hạn.
cp="$LAB_CP"
echo "  (chờ apiserver và local-path-provisioner, nếu đang khởi động: tối đa ~5 phút)"
vm "$cp" "# Hạn theo đồng hồ (300 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 300))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  # Chỉ bỏ chờ khi chắc chắn chưa cài (NotFound); lỗi khác (hết giờ ngay sau /readyz) là \"chưa sẵn sàng\".
  until e=\$(\$k -n local-path-storage get deploy local-path-provisioner -o name 2>&1); do
    case \"\$e\" in *NotFound*) exit 0 ;; esac
    [ \$(date +%s) -ge \$end ] && exit 0; sleep 3
  done
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được và đã đủ Available.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n local-path-storage get deploy local-path-provisioner -o jsonpath='{.spec.replicas} {.status.availableReplicas}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && [ \"\${o% *}\" = \"\${o#* }\" ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Hai vòng Delete/Retain không để lại đối tượng nào: người học ghi tên hai PV động; mỗi PV phải từng được Pod wffc-pod mount
# (journal kubelet trên worker, bền qua khởi động lại, files/kubelet-mounts.sh của s22) và nay không còn.
mounts="$(vm cka-w1 "$(cat "$SESSION_DIR/../s22/files/kubelet-mounts.sh")" 2>/dev/null; vm cka-w2 "$(cat "$SESSION_DIR/../s22/files/kubelet-mounts.sh")" 2>/dev/null)"
round() {  # round <khoá answers.env>: in "đạt" hoặc lý do
  local key="$1" v
  v="$(fact "$key")"
  if ! printf '%s\n' "$v" | grep -Eqx 'pvc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'; then echo "$key='$v' (cần pvc-<uid>)"
  elif ! printf '%s\n' "$mounts" | awk -v pv="$v" '$1=="shop/wffc-pod" && $2=="host-path" && $3==pv' | grep -q .; then
    echo "$key: chưa thấy Pod wffc-pod mount $v"
  elif [ "$(fact "${key}_EXISTS")" != "không" ]; then echo "$key: PV $v $(fact "${key}_EXISTS")"
  else echo "đạt"
  fi
}
rounds="$(round DELETED_PV); $(round RETAINED_PV)"
[ "$rounds" = "đạt; đạt" ] && rounds="đạt"
[ "$rounds" = "đạt" ] && [ "$(fact DELETED_PV)" = "$(fact RETAINED_PV)" ] && rounds="DELETED_PV và RETAINED_PV trùng nhau (cần hai vòng)"
[ "$rounds" = "đạt" ] && [ "$(fact RETAINED_PHASE)" != "Released" ] && rounds="RETAINED_PHASE='$(fact RETAINED_PHASE)' (phase của PV Retain sau khi xoá PVC)"

expect_eq "local-path-provisioner (local-path-storage): image ghim phiên bản, Available, Pod chạy trên cka-cp; image helper Pod ghim tag" \
  "đạt" echo "$(fact PROVISIONER)"
expect_eq "StorageClass: đúng một mặc định và là local-path (rancher.io/local-path, WaitForFirstConsumer)" "đạt" echo "$(fact SC)"
expect_eq "answers.env: WFFC_REASON=WaitForFirstConsumer; không còn PVC/PV nháp; PV shop-data vẫn Retain, Bound với shop/shop-data" \
  "WaitForFirstConsumer đạt" echo "$(fact WFFC_REASON) $(fact CLEAN)"
expect_eq "Vòng Delete và Retain: DELETED_PV, RETAINED_PV là hai PV động Pod wffc-pod đã mount, nay đã xoá; RETAINED_PHASE=Released" \
  "đạt" echo "$rounds"
assert_summary
