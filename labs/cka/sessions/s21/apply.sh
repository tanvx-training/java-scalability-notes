# s21 — lời giải chuẩn: gây đúng sự cố của buổi rồi sửa theo cách chẩn đoán ra (để selftest chứng minh cách sửa khớp lỗi):
# shop-quota bị hạ requests.memory → về 3Gi; uncordon cka-w1; order có nodeSelector disktype=ssd (không node nào có nhãn)
# → bỏ; gateway requests/limits memory 1900Mi (lớn hơn allocatable của mọi node) → về 256Mi/384Mi của s17; sửa trong
# ~/shop/*.yaml rồi apply. Pod thử mem-probe 1900Mi ở default cho thấy FailedScheduling "Insufficient memory" rồi xoá.
# Tìm Pod ngốn CPU nhất bằng kubectl top --sort-by=cpu, xoá. Ghi ~/drills/s21/answers.env.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
lab_break st3-pending
echo "s21: đã gây sự cố, chờ ReplicaSet mới của order và gateway báo FailedCreate"
vm "$cp" "for i in \$(seq 1 60); do
    n=\$(kubectl -n shop get events --field-selector reason=FailedCreate -o jsonpath='{range .items[*]}{.message}{\"\\n\"}{end}' 2>/dev/null | grep -c 'exceeded quota')
    [ \"\$n\" -ge 2 ] && exit 0; sleep 2; done
  echo 'không thấy FailedCreate vì quota' >&2; exit 1"
vm "$cp" "set -e
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
def edit(name, fn):
    p = f'{home}/shop/{name}.yaml'
    with open(p) as f: doc = [d for d in yaml.safe_load_all(f) if d][0]
    fn(doc)
    with open(p, 'w') as f: f.write(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000))
def quota(d): d['spec']['hard']['requests.memory'] = '3Gi'
def order(d): d['spec']['template']['spec'].pop('nodeSelector', None)
def gateway(d):
    c = [x for x in d['spec']['template']['spec']['containers'] if x['name'] == 'gateway'][0]
    c['resources'] = {'requests': {'cpu': '100m', 'memory': '256Mi'}, 'limits': {'memory': '384Mi'}}
edit('quota', quota); edit('order', order); edit('gateway', gateway)
PY
kubectl apply -f ~/shop/quota.yaml >/dev/null
kubectl uncordon cka-w1 >/dev/null
kubectl apply -f ~/shop/order.yaml -f ~/shop/gateway.yaml >/dev/null
for d in order gateway; do kubectl -n shop rollout status deploy/\$d --timeout=420s >/dev/null; done"

echo "s21: Pod thử mem-probe (requests.memory 1900Mi) ở default: FailedScheduling"
probe="$(vm "$cp" "set -e
  kubectl -n default delete pod mem-probe --ignore-not-found --wait=true >/dev/null
  kubectl -n default run mem-probe --image=busybox:1.37 --restart=Never --dry-run=client -o json -- sleep 3600 \\
    | python3 -c 'import json,sys; p=json.load(sys.stdin); p[\"spec\"][\"containers\"][0][\"resources\"]={\"requests\":{\"memory\":\"1900Mi\"}}; print(json.dumps(p))' \\
    | kubectl apply -f - >/dev/null
  m=''; for i in \$(seq 1 30); do
    m=\$(kubectl -n default get events --field-selector reason=FailedScheduling,involvedObject.name=mem-probe -o jsonpath='{.items[-1:].message}' 2>/dev/null)
    [ -n \"\$m\" ] && break; sleep 2
  done
  kubectl -n default delete pod mem-probe --wait=true >/dev/null
  printf '%s' \"\$m\" | grep -o 'Insufficient memory' | head -n1")"
echo "s21: FailedScheduling của mem-probe có: '$probe'"
[ "$probe" = "Insufficient memory" ] || { echo "s21: mem-probe không Pending vì thiếu memory" >&2; exit 1; }

echo "s21: tìm Pod ngốn CPU nhất bằng kubectl top (chờ metrics-server có số của Pod mới, tối đa ~2 phút)"
hog="$(vm "$cp" "for i in \$(seq 1 40); do
    h=\$(kubectl top pod -A --sort-by=cpu --no-headers 2>/dev/null | head -n1 | awk '{print \$1\"/\"\$2}')
    [ \"\$h\" = default/batch-7f ] && break; sleep 3
  done; printf '%s' \"\$h\"")"
echo "s21: Pod ngốn CPU nhất: '$hog'"
[ "$hog" = "default/batch-7f" ] || { echo "s21: kubectl top không xếp batch-7f đầu" >&2; exit 1; }
vm "$cp" "set -e
  kubectl -n default delete pod batch-7f --wait=true >/dev/null
  mkdir -p ~/drills/s21
  printf 'HOG_NS=%s\nHOG_POD=%s\nPROBE_REASON=%s\n' '${hog%/*}' '${hog#*/}' '$probe' > ~/drills/s21/answers.env"
