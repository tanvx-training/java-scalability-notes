# Lỗi st3-pending: "một đồng nghiệp" sửa ~/shop/{order,gateway,quota}.yaml rồi apply, cordon một worker và chạy một
# Pod nền ngốn CPU. Không in ra đã làm gì (đây là đề bài sự cố). Chạy lại được: lần sau đặt lại đúng các lỗi đó, không
# thêm lỗi khác (Pod nền đang chạy thì giữ nguyên). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "set -e
for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
python3 - <<'PY'
import os, sys, yaml
home = os.path.expanduser('~')
def order(d):
    d['spec']['template']['spec']['nodeSelector'] = {'disktype': 'ssd'}
def gateway(d):
    c = [x for x in d['spec']['template']['spec']['containers'] if x.get('name') == 'gateway'][0]
    r = c.setdefault('resources', {})
    r.setdefault('requests', {})['memory'] = '1900Mi'
    r.setdefault('limits', {})['memory'] = '1900Mi'
def quota(d):
    d['spec']['hard']['requests.memory'] = '1Gi'
out = {}
for name, kind, fn in (('order', 'Deployment', order), ('gateway', 'Deployment', gateway), ('quota', 'ResourceQuota', quota)):
    p = f'{home}/shop/{name}.yaml'
    try:
        with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
        if len(docs) != 1 or docs[0].get('kind') != kind: raise ValueError
        fn(docs[0])
    except Exception:
        sys.stderr.write(f'lab: không đọc được ~/shop/{name}.yaml: cần đúng một {kind} (trạng thái cuối s20)\n'); sys.exit(1)
    out[p] = yaml.safe_dump(docs[0], sort_keys=False, allow_unicode=True, width=1000)
for p, text in out.items():
    with open(p, 'w') as f: f.write(text)
PY
kubectl apply -f ~/shop/quota.yaml -f ~/shop/order.yaml -f ~/shop/gateway.yaml >/dev/null 2>&1 \\
  || { echo 'lab: không apply được ~/shop/{quota,order,gateway}.yaml (xem lại tệp của trạng thái cuối s20)' >&2; exit 1; }
# Pod nền ngốn CPU, giới hạn 500m để đứng đầu kubectl top mà không làm đói cả node. Pod đang chạy (hay vừa tạo) thì giữ;
# Pod đã dừng (restartPolicy Never: sau khi VM khởi động lại nó Failed/Unknown, không còn đốt CPU) thì tạo lại.
ph=\$(kubectl -n default get pod batch-7f -o jsonpath='{.status.phase}' 2>/dev/null || true)
case \"\$ph\" in Running|Pending) ;; *) kubectl -n default delete pod batch-7f --ignore-not-found --wait=true >/dev/null ;; esac
kubectl -n default get pod batch-7f >/dev/null 2>&1 || kubectl apply -f - >/dev/null <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: batch-7f
  namespace: default
  labels:
    app: batch
spec:
  restartPolicy: Never
  containers:
  - name: worker
    image: busybox:1.37
    command: [\"sh\", \"-c\", \"while :; do :; done\"]
    resources:
      limits:
        cpu: 500m
YAML
kubectl cordon cka-w1 >/dev/null
" >/dev/null
