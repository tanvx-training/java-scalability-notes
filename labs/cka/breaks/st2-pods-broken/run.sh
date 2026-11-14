# Lỗi st2-pods-broken: "một đồng nghiệp" sửa ~/shop/*.yaml rồi apply, và tạo một Pod báo cáo lẻ. Không in ra đã làm
# gì (đây là đề bài sự cố). Chạy lại được: lần sau đặt lại đúng các lỗi đó, không thêm lỗi khác.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
python3 - <<'PY'
import os, sys, yaml
home = os.path.expanduser('~')
def catalog(c):
    c['image'] = 'shop/catalog:1.1'
def order(c):
    for e in c.get('env') or []:
        ref = (e.get('valueFrom') or {}).get('secretKeyRef')
        if ref and e.get('name') == 'DB_PASSWORD': ref['key'] = 'DB_PASS'
def gateway(c):
    env = [e for e in (c.get('env') or []) if e.get('name') != 'JAVA_OPTS']
    env.append({'name': 'JAVA_OPTS', 'value': '-XX:+UseSerialGC@@NBSP@@-XX:MaxRAMPercentage=60'})
    c['env'] = env
out = {}
for name, fn in (('catalog', catalog), ('order', order), ('gateway', gateway)):
    p = f'{home}/shop/{name}.yaml'
    try:
        with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
        deps = [d for d in docs if d.get('kind') == 'Deployment']
        if len(docs) != 1 or len(deps) != 1: raise ValueError
        fn(deps[0]['spec']['template']['spec']['containers'][0])
    except Exception:
        sys.stderr.write(f'lab: không đọc được ~/shop/{name}.yaml: cần đúng một Deployment (trạng thái cuối s15)\n'); sys.exit(1)
    out[p] = yaml.safe_dump(deps[0], sort_keys=False, allow_unicode=True, width=1000)
for p, text in out.items():
    with open(p, 'w') as f: f.write(text.replace('@@NBSP@@', '\u00a0'))
PY
kubectl apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml -f ~/shop/gateway.yaml 2>/dev/null
mkdir -p ~/drills/s16
cat > ~/drills/s16/report-once.yaml <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: report-once
  namespace: shop
  labels:
    app: report-once
spec:
  restartPolicy: Never
  containers:
  - name: report
    image: busybox:1.37
    command:
    - sh
    - -c
    - |
      set -e; o=\$(wget -qO- http://gateway:8080/api/oders); echo \"\$(date -Iseconds) đơn hàng: \$o\"
YAML
kubectl replace --force -f ~/drills/s16/report-once.yaml 2>/dev/null || kubectl apply -f ~/drills/s16/report-once.yaml
" >/dev/null
