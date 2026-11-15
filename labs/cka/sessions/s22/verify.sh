# s22 — kiểm: PV shop-data (hostPath, 1Gi, RWO, storageClassName manual, Retain, nodeAffinity ghim cka-w2) và PVC
# shop/shop-data khớp, Bound với nhau; tệp probe.txt trên hostPath của cka-w2 có nội dung; answers.env PVC_REUSE_CONTENT
# khớp nội dung đó; Pod nháp scratch và pvc-probe đã xoá. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# PV/PVC và tệp trên đĩa của cka-w2 bền qua khởi động lại; chỉ cần chờ apiserver.
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~3 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Tệp trên hostPath: đọc thẳng trên đĩa của cka-w2 (đường dẫn lấy từ PV; chỉ nhận đường dẫn tuyệt đối "sạch").
path="$(fact HOSTPATH)"
content=""
case "$path" in
  /*) case "$path" in *[!A-Za-z0-9._/-]*) path="" ;; esac ;;
  *) path="" ;;
esac
if [ -n "$path" ]; then
  content="$(vm cka-w2 "sudo head -n1 -- '$path/probe.txt' 2>/dev/null" 2>/dev/null | tr -d '\r' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
fi
answer="$(fact ANSWER | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
if [ -z "$content" ]; then same="chưa có tệp để so"
elif [ "$answer" = "$content" ]; then same="khớp"
else same="PVC_REUSE_CONTENT='${answer}' khác tệp"
fi

expect_eq "PV shop-data: hostPath, 1Gi, ReadWriteOnce, storageClassName manual, Retain, nodeAffinity ghim cka-w2" \
  "đạt" echo "$(fact PV)"
expect_eq "PVC shop/shop-data: 1Gi, ReadWriteOnce, storageClassName manual; Bound với PV shop-data" "đạt" echo "$(fact PVC)"
expect_match "probe.txt trên hostPath của cka-w2 có nội dung (Pod pvc-probe đã ghi)" "." echo "$content"
expect_eq "answers.env: PVC_REUSE_CONTENT khớp dòng đầu probe.txt; Pod nháp scratch, pvc-probe (shop) đã xoá" "khớp đã xoá" \
  echo "$same $(fact PODS)"
assert_summary
