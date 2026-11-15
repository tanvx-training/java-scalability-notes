# s22 — kiểm: PV shop-data (hostPath, 1Gi, RWO, storageClassName manual, Retain, nodeAffinity ghim cka-w2) và PVC
# shop/shop-data khớp, Bound với nhau; probe.txt trên hostPath của cka-w2 chứa UID của một Pod pvc-probe đã mount shop-data
# trên cka-w2, sau đó có Pod pvc-probe khác (tạo lại) mount shop-data, và PVC_REUSE_CONTENT bằng UID đó; Pod scratch có
# emptyDir đã chạy, SCRATCH_RO_ERROR là lỗi ghi vào mount readOnly; Pod nháp scratch và pvc-probe đã xoá.
# Pod đã chạy rồi bị xoá được chứng minh bằng journal của kubelet trên worker (bền qua khởi động lại; files/kubelet-mounts.sh).
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~3 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
trim() { sed 's/^[[:space:]]*//; s/[[:space:]]*$//'; }

# Tệp trên hostPath: đọc thẳng trên đĩa của cka-w2 (đường dẫn lấy từ PV; chỉ nhận đường dẫn tuyệt đối "sạch").
path="$(fact HOSTPATH)"
content=""
case "$path" in
  /*) case "$path" in *[!A-Za-z0-9._/-]*) path="" ;; esac ;;
  *) path="" ;;
esac
if [ -n "$path" ]; then
  content="$(vm cka-w2 "sudo head -n1 -- '$path/probe.txt' 2>/dev/null" 2>/dev/null | tr -d '\r' | trim)"
fi
mounts_w1="$(vm cka-w1 "$(cat "$SESSION_DIR/files/kubelet-mounts.sh")" 2>/dev/null)"
mounts_w2="$(vm cka-w2 "$(cat "$SESSION_DIR/files/kubelet-mounts.sh")" 2>/dev/null)"
# UID các Pod pvc-probe đã mount PV shop-data trên cka-w2, theo thứ tự thời gian, không lặp liền nhau.
probe_uids="$(printf '%s\n' "$mounts_w2" | awk '$1=="shop/pvc-probe" && $2=="host-path" && $3=="shop-data" && $4!=last {print $4; last=$4}')"
answer="$(fact ANSWER | trim)"

reuse=""
if [ -z "$content" ]; then reuse="chưa có probe.txt trên cka-w2"
elif ! printf '%s\n' "$content" | grep -Eqx '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'; then
  reuse="probe.txt là '$content', cần UID của Pod pvc-probe đã ghi nó"
elif ! printf '%s\n' "$probe_uids" | grep -qx "$content"; then
  reuse="probe.txt chứa UID không thuộc Pod pvc-probe nào đã mount shop-data trên cka-w2"
elif [ -z "$(printf '%s\n' "$probe_uids" | awk -v u="$content" 'f && $0!=u {print; exit} $0==u {f=1}')" ]; then
  reuse="chưa thấy Pod pvc-probe tạo lại (UID khác) mount shop-data sau Pod đã ghi"
elif [ "$answer" != "$content" ]; then reuse="PVC_REUSE_CONTENT='${answer}' khác probe.txt"
else reuse="đạt"
fi

ro="$(fact SCRATCH_RO | LC_ALL=C tr 'A-Z' 'a-z' | trim)"
scratch=""
if ! printf '%s\n%s\n' "$mounts_w1" "$mounts_w2" | awk '$1=="shop/scratch" && $2=="empty-dir"' | grep -q .; then
  scratch="chưa thấy Pod scratch có emptyDir chạy trên worker nào"
else
  case "$ro" in
    *"read-only file system"*) scratch="đạt" ;;
    *) scratch="SCRATCH_RO_ERROR='$(fact SCRATCH_RO)' (cần lỗi khi ghi vào mount readOnly)" ;;
  esac
fi

expect_eq "PV shop-data: hostPath, 1Gi, ReadWriteOnce, storageClassName manual, Retain, nodeAffinity ghim cka-w2" \
  "đạt" echo "$(fact PV)"
expect_eq "PVC shop/shop-data: 1Gi, ReadWriteOnce, storageClassName manual; Bound với PV shop-data" "đạt" echo "$(fact PVC)"
expect_eq "probe.txt trên cka-w2 = UID Pod pvc-probe đã ghi; Pod pvc-probe tạo lại (UID khác) mount lại shop-data; PVC_REUSE_CONTENT khớp" \
  "đạt" echo "$reuse"
expect_eq "Pod scratch (emptyDir) đã chạy, SCRATCH_RO_ERROR là lỗi ghi vào mount readOnly; Pod nháp scratch, pvc-probe (shop) đã xoá" \
  "đạt đã xoá" echo "$scratch $(fact PODS)"
assert_summary
