# s18 — lời giải chuẩn: namespace mặc định của context (user ubuntu trên cka-cp) là shop; namespace nháp quota-lab với
# quota pods=2: Deployment busy scale lên 3 → ReplicaSet FailedCreate, Pod tạo thẳng bị từ chối Forbidden, trả scale
# về 1, xoá namespace; ~/shop/limits.yaml (LimitRange shop-limits) rồi ~/shop/quota.yaml (ResourceQuota shop-quota)
# trong shop; ghi ~/drills/s18/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in limits.yaml quota.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s18-$f"
done
vm "$cp" "set -e; kubectl config set-context --current --namespace=shop >/dev/null"

echo "s18: quota-lab (pods=2): scale vượt quota, tạo Pod thẳng vượt quota"
out="$(vm "$cp" "set -e
  kubectl delete ns quota-lab --ignore-not-found --wait=true >/dev/null
  kubectl create ns quota-lab >/dev/null
  kubectl -n quota-lab create quota pod-cap --hard=pods=2 >/dev/null
  kubectl -n quota-lab create deploy busy --image=busybox:1.37 -- sleep 3600 >/dev/null
  kubectl -n quota-lab rollout status deploy/busy --timeout=180s >/dev/null
  kubectl -n quota-lab scale deploy/busy --replicas=3 >/dev/null
  kind=''; for i in \$(seq 1 60); do
    kind=\$(kubectl -n quota-lab get events --field-selector reason=FailedCreate -o jsonpath='{.items[0].involvedObject.kind}' 2>/dev/null)
    [ -n \"\$kind\" ] && break; sleep 2
  done
  err=\$(kubectl -n quota-lab run extra --image=busybox:1.37 -- sleep 3600 2>&1 || true)
  kubectl -n quota-lab scale deploy/busy --replicas=1 >/dev/null
  kubectl delete ns quota-lab --wait=true >/dev/null
  echo \"\$kind|\$(printf '%s' \"\$err\" | sed -n 's/^Error from server (\\([A-Za-z]*\\)).*/\\1/p' | head -n1)\"")"
echo "s18: đối tượng mang Event FailedCreate | lỗi khi tạo Pod thẳng: $out"
[ "$out" = "ReplicaSet|Forbidden" ] || { echo "s18: quota-lab không cho kết quả như mong đợi: '$out'" >&2; exit 1; }

echo "s18: LimitRange shop-limits rồi ResourceQuota shop-quota trong shop"
vm "$cp" "set -e
  mkdir -p ~/shop ~/drills/s18
  for f in limits.yaml quota.yaml; do install -m 644 /tmp/lab-s18-\$f ~/shop/\$f; rm -f /tmp/lab-s18-\$f; done
  # LimitRange trước: khi quota có requests.cpu/limits.memory, Pod mới thiếu các trường đó (Pod của CronJob) bị từ chối
  # nếu chưa có giá trị mặc định.
  kubectl apply -f ~/shop/limits.yaml >/dev/null
  kubectl apply -f ~/shop/quota.yaml >/dev/null
  for i in \$(seq 1 30); do [ -n \"\$(kubectl -n shop get quota shop-quota -o jsonpath='{.status.used.pods}')\" ] && break; sleep 2; done
  printf 'QUOTA_ERROR_KIND=%s\nPOD_QUOTA_ERROR=%s\n' '${out%|*}' '${out#*|}' > ~/drills/s18/answers.env"
