# Lỗi st2-pods-broken: "một đồng nghiệp" sửa ~/shop/*.yaml rồi apply, và tạo một Pod báo cáo lẻ. Không in ra đã làm
# gì (đây là đề bài sự cố). Chạy lại được: lần sau đặt lại đúng các lỗi đó, không thêm lỗi khác.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
def edit(name, fn):
    p = f'{home}/shop/{name}.yaml'
    with open(p) as f: doc = yaml.safe_load(f)
    c = doc['spec']['template']['spec']['containers'][0]
    fn(c)
    text = yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000)
    with open(p, 'w') as f: f.write(text.replace('@@NBSP@@', ' '))
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
edit('catalog', catalog); edit('order', order); edit('gateway', gateway)
PY
kubectl apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml -f ~/shop/gateway.yaml
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
    image: shop/gateway:2.0
    command:
    - sh
    - -c
    - |
      set -e; o=\$(wget -qO- http://gateway:8080/api/orders); echo \"\$(date -Iseconds) đơn hàng: \$o\"
YAML
kubectl replace --force -f ~/drills/s16/report-once.yaml 2>/dev/null || kubectl apply -f ~/drills/s16/report-once.yaml
" >/dev/null 2>&1
