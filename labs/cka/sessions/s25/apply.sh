# s25 — lời giải chuẩn: gây đúng sự cố st4-storage rồi sửa theo quy trình chẩn đoán lưu trữ (để selftest chứng minh cách sửa
# khớp lỗi): PV Retain Released của data-postgres-0 → gỡ uid/resourceVersion khỏi claimRef (PV giữ chỗ cho đúng tên PVC đó,
# không PVC nào khác lấy được), apply lại ~/shop/postgres.yaml để StatefulSet tạo PVC cùng tên và bind vào PV cũ; PVC reports
# xin lớp fast-ssd không có → sửa storageClassName trong ~/shop/reports.yaml thành local-path, xoá PVC (không sửa được lớp; Pod
# Pending chưa được xếp lên node nên không giữ PVC lại) rồi apply, Pod reports tự được xếp; order DB_URL cổng 5433 → 5432 trong
# ~/shop/order.yaml, apply. Finalizer đọc trên PVC data-postgres-0 đang được postgres-0 dùng. Ghi ~/drills/s25/answers.env.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
lab_break st4-storage
echo "s25: đã gây sự cố; chờ PVC reports báo ProvisioningFailed và PV của data-postgres-0 Released"
pv="$(vm "$cp" "for i in \$(seq 1 60); do
    m=\$(kubectl -n shop get events --field-selector involvedObject.kind=PersistentVolumeClaim,involvedObject.name=reports,reason=ProvisioningFailed -o jsonpath='{.items[-1:].message}' 2>/dev/null)
    pv=\$(kubectl get pv -o jsonpath='{range .items[?(@.spec.claimRef.name==\"data-postgres-0\")]}{.metadata.name} {.status.phase} {.spec.persistentVolumeReclaimPolicy}{\"\\n\"}{end}' | awk '\$2==\"Released\" && \$3==\"Retain\" {print \$1}' | head -n1)
    case \"\$m\" in *fast-ssd*not\ found*) [ -n \"\$pv\" ] && { echo \"\$pv\"; exit 0; } ;; esac; sleep 2
  done; echo 'không thấy ProvisioningFailed của reports hoặc PV Released' >&2; exit 1")"
echo "s25: PV Released giữ dữ liệu cuối s24: $pv"
vm "$cp" "kubectl -n shop describe pvc reports | sed -n '/^Events/,\$p'; kubectl get pv $pv"
vm cka-w2 "df -h /opt/local-path-provisioner | tail -n1; sudo du -sh /opt/local-path-provisioner/*_shop_data-postgres-0"

echo "s25: PV $pv giữ chỗ cho shop/data-postgres-0 (bỏ uid, resourceVersion của claimRef), apply lại ~/shop/postgres.yaml"
vm "$cp" "set -e
  kubectl patch pv $pv --type=merge -p '{\"spec\":{\"claimRef\":{\"uid\":null,\"resourceVersion\":null}}}' >/dev/null
  kubectl apply -f ~/shop/postgres.yaml >/dev/null
  kubectl -n shop rollout status sts/postgres --timeout=420s >/dev/null
  kubectl -n shop wait pod/postgres-0 --for=condition=Ready --timeout=300s >/dev/null
  [ \"\$(kubectl -n shop get pvc data-postgres-0 -o jsonpath='{.spec.volumeName}')\" = $pv ]
  kubectl -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc 'select count(*) from orders'"

echo "s25: PVC reports sang local-path (xoá PVC, apply lại), order DB_URL về cổng 5432"
fin="$(vm "$cp" "set -e
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
p = f'{home}/shop/reports.yaml'
with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
for d in docs:
    if d['kind'] == 'PersistentVolumeClaim': d['spec']['storageClassName'] = 'local-path'
with open(p, 'w') as f: yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
p = f'{home}/shop/order.yaml'
with open(p) as f: doc = [d for d in yaml.safe_load_all(f) if d][0]
c = [x for x in doc['spec']['template']['spec']['containers'] if x['name'] == 'order'][0]
for e in c['env']:
    if e['name'] == 'DB_URL': e['value'] = e['value'].replace(':5433/', ':5432/')
with open(p, 'w') as f: f.write(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000))
PY
  f=\$(kubectl -n shop get pvc data-postgres-0 -o jsonpath='{.metadata.finalizers[0]}')
  kubectl -n shop delete pvc reports --wait=true --timeout=120s >/dev/null
  kubectl apply -f ~/shop/reports.yaml -f ~/shop/order.yaml >/dev/null
  for d in reports order catalog; do kubectl -n shop rollout status deploy/\$d --timeout=420s >/dev/null; done
  printf '%s' \"\$f\"")"
echo "s25: finalizer của PVC data-postgres-0: '$fin'"
[ "$fin" = "kubernetes.io/pvc-protection" ] || { echo "s25: PVC không có finalizer kubernetes.io/pvc-protection" >&2; exit 1; }
vm "$cp" "set -e; mkdir -p ~/drills/s25; printf 'PROTECTION_FINALIZER=%s\n' '$fin' > ~/drills/s25/answers.env
  kubectl -n shop get pvc"
