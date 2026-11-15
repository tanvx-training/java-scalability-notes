# s22 — lời giải chuẩn: Pod nháp scratch (emptyDir chung giữa writer và reader) chạy, reader đọc được dòng writer ghi,
# rồi xoá; PV shop-data (hostPath /mnt/shop-data trên cka-w2, 1Gi, RWO, manual, Retain) + PVC shop/shop-data trong
# ~/shop/shop-data.yaml; Pod pvc-probe ghim cka-w2 ghi UID của chính nó vào /data/probe.txt, xoá và tạo lại Pod, Pod mới
# đọc lại đúng UID đó; xoá pvc-probe; ghi ~/drills/s22/answers.env (PVC_REUSE_CONTENT, SCRATCH_RO_ERROR).
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in shop-data scratch pvc-probe; do vm_put "$SESSION_DIR/files/$f.yaml" "$cp" "/tmp/lab-s22-$f.yaml"; done

echo "s22: Pod nháp scratch: emptyDir chung giữa writer và reader, reader mount chỉ đọc"
ro="$(vm "$cp" "set -e; mkdir -p ~/drills/s22 ~/shop
  install -m 644 /tmp/lab-s22-scratch.yaml ~/drills/s22/scratch.yaml
  install -m 644 /tmp/lab-s22-pvc-probe.yaml ~/drills/s22/pvc-probe.yaml
  install -m 644 /tmp/lab-s22-shop-data.yaml ~/shop/shop-data.yaml
  rm -f /tmp/lab-s22-*.yaml
  kubectl -n shop delete pod scratch --ignore-not-found --now --wait=true >/dev/null
  kubectl apply -f ~/drills/s22/scratch.yaml >/dev/null
  kubectl -n shop wait pod/scratch --for=condition=Ready --timeout=180s >/dev/null
  ok=''; for i in \$(seq 1 20); do
    kubectl -n shop logs scratch -c reader 2>/dev/null | grep -q . && ok=1 && break; sleep 2
  done
  [ -n \"\$ok\" ] || { echo 'scratch: reader không đọc được dòng nào writer ghi vào emptyDir' >&2; exit 1; }
  e=\$(kubectl -n shop exec scratch -c reader -- touch /cache/x 2>&1 || true)
  kubectl -n shop delete pod scratch --now --wait=true >/dev/null
  printf '%s' \"\$e\" | grep -o 'Read-only file system' | head -n1")"
echo "s22: touch trong reader báo: '$ro'"
[ "$ro" = "Read-only file system" ] || { echo "s22: reader không bị chặn ghi (readOnly)" >&2; exit 1; }

echo "s22: PV shop-data + PVC shop-data (~/shop/shop-data.yaml), chờ Bound"
vm "$cp" "set -e
  # Chạy giữa buổi (sau t3/t4): PVC sai (RWX/2Gi) không sửa được bằng apply, xoá nếu nó chưa Bound vào PV shop-data.
  v=\$(kubectl -n shop get pvc shop-data -o jsonpath='{.status.phase}/{.spec.volumeName}' 2>/dev/null || true)
  [ -z \"\$v\" ] || [ \"\$v\" = Bound/shop-data ] || kubectl -n shop delete pvc shop-data --wait=true >/dev/null
  kubectl apply -f ~/shop/shop-data.yaml >/dev/null
  for i in \$(seq 1 30); do
    [ \"\$(kubectl -n shop get pvc shop-data -o jsonpath='{.status.phase}' 2>/dev/null)\" = Bound ] && exit 0; sleep 2
  done
  echo 'PVC shop-data chưa Bound sau 60 giây' >&2; exit 1"

echo "s22: Pod pvc-probe trên cka-w2 ghi UID của nó vào probe.txt, xoá, tạo lại, đọc lại"
out="$(vm "$cp" "set -e
  kubectl -n shop delete pod pvc-probe --ignore-not-found --now --wait=true >/dev/null
  kubectl apply -f ~/drills/s22/pvc-probe.yaml >/dev/null
  kubectl -n shop wait pod/pvc-probe --for=condition=Ready --timeout=180s >/dev/null
  uid=\$(kubectl -n shop get pod pvc-probe -o jsonpath='{.metadata.uid}')
  kubectl -n shop exec pvc-probe -- sh -c \"echo \$uid > /data/probe.txt\"
  kubectl -n shop delete pod pvc-probe --now --wait=true >/dev/null
  kubectl apply -f ~/drills/s22/pvc-probe.yaml >/dev/null
  kubectl -n shop wait pod/pvc-probe --for=condition=Ready --timeout=180s >/dev/null
  c=\$(kubectl -n shop exec pvc-probe -- cat /data/probe.txt)
  kubectl -n shop delete pod pvc-probe --now --wait=true >/dev/null
  printf '%s %s' \"\$uid\" \"\$c\"")"
uid="${out%% *}"; got="${out#* }"
echo "s22: Pod thứ nhất UID $uid, Pod tạo lại đọc được: '$got'"
[ -n "$uid" ] && [ "$got" = "$uid" ] || { echo "s22: Pod tạo lại không đọc được UID Pod thứ nhất đã ghi" >&2; exit 1; }
vm "$cp" "set -e; mkdir -p ~/drills/s22; printf 'PVC_REUSE_CONTENT=%s\nSCRATCH_RO_ERROR=%s\n' '$got' '$ro' > ~/drills/s22/answers.env"
