# Lỗi st4-storage: "một đồng nghiệp" thêm ~/shop/reports.yaml (PVC reports xin StorageClass fast-ssd không có + Deployment
# reports dùng nó), sửa DB_URL của ~/shop/order.yaml sang cổng 5433 rồi apply, và "dọn" postgres: xoá StatefulSet postgres
# cùng PVC data-postgres-0 (PV Retain của s24 ở lại Released, dữ liệu còn trên cka-w2). Không in ra đã làm gì (đây là đề bài
# sự cố). Chạy lại được: lần sau đặt lại đúng các lỗi đó, không thêm lỗi khác. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
# Điều kiện của sự cố: còn PV Retain từng giữ shop/data-postgres-0 (cuối s24). Không có thì không gây gì cả.
# Cũng nhận PV Retain đã bị gỡ hẳn claimRef (người học đang làm theo cách thứ hai), nhận ra qua đường dẫn …_shop_data-postgres-0.
pv=\$(kubectl get pv -o jsonpath='{range .items[*]}{.metadata.name} {.spec.claimRef.namespace}/{.spec.claimRef.name} {.spec.persistentVolumeReclaimPolicy} {.spec.hostPath.path}{\"\\n\"}{end}' \\
  | awk '\$3==\"Retain\" && (\$2==\"shop/data-postgres-0\" || (\$2==\"/\" && \$4 ~ /_shop_data-postgres-0\$/)) {print \$1}' | head -n1)
[ -n \"\$pv\" ] || { echo 'lab: không thấy PV Retain của shop/data-postgres-0 (trạng thái cuối s24); thử: ./labs/lab restore cka s24' >&2; exit 1; }
python3 - <<'PY'
import os, sys, yaml
home = os.path.expanduser('~')
p = f'{home}/shop/order.yaml'
try:
    with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
    if len(docs) != 1 or docs[0].get('kind') != 'Deployment': raise ValueError
    c = [x for x in docs[0]['spec']['template']['spec']['containers'] if x.get('name') == 'order'][0]
    e = [x for x in c.get('env') or [] if x.get('name') == 'DB_URL'][0]
    e.pop('valueFrom', None)
    e['value'] = 'jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5433/shop'
except Exception:
    sys.stderr.write('lab: không đọc được ~/shop/order.yaml: cần đúng một Deployment có DB_URL (trạng thái cuối s24)\n'); sys.exit(1)
with open(p, 'w') as f: f.write(yaml.safe_dump(docs[0], sort_keys=False, allow_unicode=True, width=1000))
PY
kubectl apply -f ~/shop/order.yaml >/dev/null
# PVC reports đã được sửa sang lớp khác ở lần trước: storageClassName không sửa được, xoá rồi tạo lại.
sc=\$(kubectl -n shop get pvc reports -o jsonpath='{.spec.storageClassName}' 2>/dev/null || true)
if [ -n \"\$sc\" ] && [ \"\$sc\" != fast-ssd ]; then
  kubectl -n shop delete deploy reports --ignore-not-found --wait=true >/dev/null
  kubectl -n shop delete pvc reports --wait=true --timeout=120s >/dev/null
fi
cat > ~/shop/reports.yaml <<'YAML'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: reports
  namespace: shop
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 256Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reports
  namespace: shop
  labels:
    app: reports
spec:
  replicas: 1
  selector:
    matchLabels:
      app: reports
  template:
    metadata:
      labels:
        app: reports
    spec:
      containers:
      - name: writer
        image: busybox:1.37
        command: [\"sh\", \"-c\", \"while true; do date >> /reports/heartbeat.log; sleep 30; done\"]
        readinessProbe:
          exec:
            command: [\"test\", \"-s\", \"/reports/heartbeat.log\"]
          periodSeconds: 10
        resources:
          requests:
            cpu: 10m
            memory: 16Mi
          limits:
            memory: 32Mi
        volumeMounts:
        - name: reports
          mountPath: /reports
      volumes:
      - name: reports
        persistentVolumeClaim:
          claimName: reports
YAML
kubectl apply -f ~/shop/reports.yaml >/dev/null
# Dọn postgres: StatefulSet (Pod đi theo) rồi PVC; PV Retain ở lại Released.
kubectl -n shop delete sts postgres --ignore-not-found --wait=true >/dev/null
kubectl -n shop delete pod postgres-0 --ignore-not-found --wait=true --timeout=120s >/dev/null
kubectl -n shop delete pvc data-postgres-0 --ignore-not-found --wait=true --timeout=120s >/dev/null
# PV đã được người học gỡ claimRef (hẳn, hay chỉ uid) ở lần trước: đặt lại claimRef trỏ một PVC đã mất (uid giả) để PV về
# đúng trạng thái Released của sự cố (có cả resourceVersion để lệnh json-patch gỡ uid/resourceVersion trong bài vẫn chạy).
uid=\$(kubectl get pv \$pv -o jsonpath='{.spec.claimRef.uid}')
if [ -z \"\$uid\" ]; then
  kubectl patch pv \$pv --type=merge -p '{\"spec\":{\"claimRef\":{\"apiVersion\":\"v1\",\"kind\":\"PersistentVolumeClaim\",\"namespace\":\"shop\",\"name\":\"data-postgres-0\",\"uid\":\"00000000-0000-4000-8000-000000000000\",\"resourceVersion\":\"1\"}}}' >/dev/null
fi
for i in \$(seq 1 30); do
  ph=\$(kubectl get pv \$pv -o jsonpath='{.status.phase}')
  [ \"\$ph\" = Released ] && break; sleep 2
done
" >/dev/null
