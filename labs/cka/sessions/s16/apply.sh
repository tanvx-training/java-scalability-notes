# s16 — lời giải chuẩn: gây đúng sự cố của buổi rồi sửa theo cách chẩn đoán ra (để selftest chứng minh cách sửa khớp lỗi):
# catalog: tag image không có → về shop/catalog:1.0; order: secretKeyRef trỏ khoá DB_PASS không có trong db-cred → về
# DB_PASSWORD; gateway: JAVA_OPTS nối hai cờ bằng NBSP (U+00A0) nên JVM thấy một cờ lạ → thay bằng dấu cách; sửa trong
# ~/shop/*.yaml rồi apply. Pod report-once chạy image không có wget, đã Failed → sửa image trong tệp, replace --force.
# Ghi ~/drills/s16/answers.env. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
lab_break st2-pods-broken
echo "s16: đã gây sự cố, chờ các Pod hỏng hiện lý do rồi sửa"
code="$(vm "$cp" "for i in \$(seq 1 60); do
    c=\$(kubectl -n shop get pod report-once -o jsonpath='{.status.containerStatuses[0].state.terminated.exitCode}' 2>/dev/null)
    [ -n \"\$c\" ] && break; sleep 2; done; echo \"\$c\"")"
[ "$code" = 127 ] || { echo "s16: report-once không thoát với mã 127: '$code'" >&2; exit 1; }
vm "$cp" "set -e
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
def edit(name, fn):
    p = f'{home}/shop/{name}.yaml'
    with open(p) as f: doc = yaml.safe_load(f)
    fn(doc['spec']['template']['spec']['containers'][0])
    with open(p, 'w') as f: f.write(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000))
def catalog(c): c['image'] = 'shop/catalog:1.0'
def order(c):
    for e in c.get('env') or []:
        ref = (e.get('valueFrom') or {}).get('secretKeyRef')
        if ref and ref.get('key') == 'DB_PASS': ref['key'] = 'DB_PASSWORD'
def gateway(c):
    for e in c.get('env') or []:
        if e.get('name') == 'JAVA_OPTS': e['value'] = e['value'].replace(' ', ' ')
edit('catalog', catalog); edit('order', order); edit('gateway', gateway)
PY
kubectl apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml -f ~/shop/gateway.yaml >/dev/null
for d in catalog order gateway; do kubectl -n shop rollout status deploy/\$d --timeout=300s >/dev/null; done
sed -i 's|image: shop/gateway:2.0|image: busybox:1.37|' ~/drills/s16/report-once.yaml
kubectl replace --force -f ~/drills/s16/report-once.yaml >/dev/null
for i in \$(seq 1 60); do
  [ \"\$(kubectl -n shop get pod report-once -o jsonpath='{.status.phase}')\" = Succeeded ] && break; sleep 2; done
[ \"\$(kubectl -n shop get pod report-once -o jsonpath='{.status.phase}')\" = Succeeded ]
printf 'REPORT_EXIT_CODE=%s\nBAD_CHAR=c2a0\n' '$code' > ~/drills/s16/answers.env"
