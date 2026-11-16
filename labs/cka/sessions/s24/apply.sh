# s24 — lời giải chuẩn: ~/shop/postgres.yaml (headless Service + StatefulSet postgres: postgres:17-alpine ghim bản vá,
# nodeSelector role=db, requests/limits, probe pg_isready, mật khẩu từ db-cred, volumeClaimTemplates 1Gi từ lớp mặc định);
# thêm DB_URL vào ~/shop/{catalog,order}.yaml bằng PyYAML rồi apply; chạy lại Job seed
# (3 POST /api/orders qua gateway); xoá postgres-0, chờ nó lên lại, đơn hàng còn; PV data-postgres-0 sang Retain; thử dời
# postgres-0 sang cka-w1 (gắn role=db cho cka-w1, cordon cka-w2, xoá Pod) → Pending vì node affinity của PV, rồi
# trả lại (bước cuối cùng xoá postgres-0: verify đọc thời gian Pending của Pod hiện tại); ghi ~/drills/s24/answers.env.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/postgres.yaml" "$cp" /tmp/lab-s24-postgres.yaml

echo "s24: StatefulSet postgres + headless Service (~/shop/postgres.yaml), chờ postgres-0 Ready trên cka-w2"
vm "$cp" "set -e; mkdir -p ~/shop ~/drills/s24
  install -m 644 /tmp/lab-s24-postgres.yaml ~/shop/postgres.yaml; rm -f /tmp/lab-s24-postgres.yaml
  # Lần chạy trước bị ngắt giữa bước dời node: trả node về như cũ trước.
  kubectl label node cka-w1 role- >/dev/null 2>&1 || true
  kubectl uncordon cka-w2 >/dev/null
  kubectl apply -f ~/shop/postgres.yaml >/dev/null
  kubectl -n shop rollout status sts/postgres --timeout=420s >/dev/null
  kubectl -n shop wait pod/postgres-0 --for=condition=Ready --timeout=300s >/dev/null
  [ \"\$(kubectl -n shop get pod postgres-0 -o jsonpath='{.spec.nodeName}')\" = cka-w2 ]
  kubectl -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc 'select current_database()' | grep -qx shop"

echo "s24: DB_URL cho catalog, order; rollout"
vm "$cp" "set -e
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
URL = 'jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop'
for name in ('catalog', 'order'):
    p = f'{home}/shop/{name}.yaml'
    with open(p) as f: doc = [d for d in yaml.safe_load_all(f) if d][0]
    c = [x for x in doc['spec']['template']['spec']['containers'] if x['name'] == name][0]
    env = [e for e in c.get('env', []) if e.get('name') != 'DB_URL']
    at = next((i + 1 for i, e in enumerate(env) if e.get('name') == 'JAVA_OPTS'), 0)
    env.insert(at, {'name': 'DB_URL', 'value': URL})
    c['env'] = env
    with open(p, 'w') as f: f.write(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000))
PY
kubectl apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml >/dev/null
for d in catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=420s >/dev/null; done
for i in \$(seq 1 60); do
  kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products 2>/dev/null | grep -q '\"id\":3' && exit 0; sleep 2
done; echo 'gateway chưa trả /api/products' >&2; exit 1"

echo "s24: chạy lại Job seed (3 POST /api/orders qua gateway), đếm bằng psql"
orders="$(vm "$cp" "set -e
  kubectl replace --force -f ~/shop/seed.yaml >/dev/null
  kubectl -n shop wait job/seed --for=condition=Complete --timeout=300s >/dev/null
  kubectl -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc 'select count(*) from orders'")"
echo "s24: bảng orders có $orders dòng"
[ "$orders" -ge 3 ] || { echo "s24: chưa có 3 đơn trong PostgreSQL" >&2; exit 1; }

echo "s24: xoá postgres-0, chờ nó trở lại; đơn hàng vẫn còn"
after="$(vm "$cp" "set -e
  kubectl -n shop delete pod postgres-0 --wait=true >/dev/null
  for i in \$(seq 1 60); do kubectl -n shop get pod postgres-0 >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n shop wait pod/postgres-0 --for=condition=Ready --timeout=300s >/dev/null
  kubectl -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc 'select count(*) from orders'")"
echo "s24: sau khi tạo lại postgres-0, orders có $after dòng"
[ "$after" = "$orders" ] || { echo "s24: số đơn đổi sau khi tạo lại postgres-0" >&2; exit 1; }

echo "s24: PV của data-postgres-0 sang Retain"
vm "$cp" "set -e
  pv=\$(kubectl -n shop get pvc data-postgres-0 -o jsonpath='{.spec.volumeName}')
  kubectl patch pv \$pv -p '{\"spec\":{\"persistentVolumeReclaimPolicy\":\"Retain\"}}' >/dev/null
  kubectl get pv \$pv"

echo "s24: thử dời postgres-0 sang cka-w1 (role=db cho cka-w1, cordon cka-w2, xoá Pod)"
reason="$(vm "$cp" "set -e
  kubectl label node cka-w1 role=db --overwrite >/dev/null
  kubectl cordon cka-w2 >/dev/null
  kubectl -n shop delete pod postgres-0 --wait=true >/dev/null
  m=''; for i in \$(seq 1 45); do
    m=\$(kubectl -n shop get events --field-selector reason=FailedScheduling,involvedObject.name=postgres-0 -o jsonpath='{.items[-1:].message}' 2>/dev/null)
    case \"\$m\" in *\"PersistentVolume's node affinity\"*) break ;; esac; sleep 2
  done
  [ -z \"\$(kubectl -n shop get pod postgres-0 -o jsonpath='{.spec.nodeName}')\" ]
  mkdir -p ~/drills/s24; printf '%s' \"\$m\" > ~/drills/s24/.move-reason
  # Người học đọc describe rồi mới trả node: Pod đứng Pending ít nhất ~15 giây (verify đòi ≥ 10 giây, bằng chứng bền).
  sleep 15
  printf '%s' \"\$m\"")"
echo "s24: FailedScheduling: $reason"
vm "$cp" "set -e
  kubectl label node cka-w1 role- >/dev/null
  kubectl uncordon cka-w2 >/dev/null
  kubectl -n shop wait pod/postgres-0 --for=condition=Ready --timeout=300s >/dev/null
  [ \"\$(kubectl -n shop get pod postgres-0 -o jsonpath='{.spec.nodeName}')\" = cka-w2 ]"
case "$reason" in *"PersistentVolume's node affinity"*) ;; *) echo "s24: postgres-0 không Pending vì node affinity của PV" >&2; exit 1 ;; esac

echo "s24: tên DNS của postgres-0 (từ một Pod trong shop)"
dns="$(vm "$cp" "kubectl -n shop delete pod dns-probe --ignore-not-found --now >/dev/null 2>&1
  kubectl -n shop run dns-probe --image=busybox:1.37 --restart=Never --rm -i --quiet --command -- \
  nslookup postgres-0.postgres.shop.svc.cluster.local 2>/dev/null | sed -n 's/^Name:[[:space:]]*//p' | head -n1")"
echo "s24: nslookup: '$dns'"
[ "$dns" = "postgres-0.postgres.shop.svc.cluster.local" ] || { echo "s24: không phân giải được tên của postgres-0" >&2; exit 1; }
vm "$cp" "set -e; mkdir -p ~/drills/s24
  printf 'MOVE_REASON=%s\nSTS_POD_DNS=%s\n' \"\$(cat ~/drills/s24/.move-reason)\" '$dns' > ~/drills/s24/answers.env
  rm -f ~/drills/s24/.move-reason"
