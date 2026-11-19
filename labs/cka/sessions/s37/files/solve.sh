# s37 — phần lời giải chạy trên cka-cp bằng user ubuntu (apply.sh gửi nội dung tệp này qua `vm`, sau khi đã đặt chart chuẩn
# ở /tmp/s37-chart.tgz). Chạy lại được: helm đúng bản thì giữ; `helm upgrade --install` cho demo; release shop đã có thì chỉ
# `helm upgrade` (thêm một revision, không đổi Pod); tệp đã chuyển sang ~/shop/pre-helm thì thôi.
set -e
k() { kubectl --request-timeout=10s "$@"; }
HELM_VERSION=v4.3.2
HELM_SHA256=df31cb61680ef728f82c770e5280dd565617bee6b039d37e85c677288be4bbb0   # helm-v4.3.2-linux-arm64.tar.gz (get.helm.sh)
PODINFO_VERSION=6.16.0
mkdir -p ~/drills/s37 ~/charts

echo "== helm $HELM_VERSION"
if [ "$(helm version --template '{{.Version}}' 2>/dev/null || true)" != "$HELM_VERSION" ]; then
  t=$(mktemp -d)
  curl -fsSL --retry 3 -o "$t/helm.tgz" "https://get.helm.sh/helm-$HELM_VERSION-linux-arm64.tar.gz"
  echo "$HELM_SHA256  $t/helm.tgz" | sha256sum -c -
  tar xzf "$t/helm.tgz" -C "$t"
  sudo install -m 0755 "$t/linux-arm64/helm" /usr/local/bin/helm
  rm -rf "$t"
fi
helm version

echo "== repo công khai, cài demo (podinfo $PODINFO_VERSION) lên cka-cp"
helm repo add podinfo https://stefanprodan.github.io/podinfo --force-update
helm repo update podinfo
helm search repo podinfo/podinfo --versions | head -4
cat > ~/drills/s37/demo-values.yaml <<'EOF'
# Ghi đè cho release demo: chạy trên control plane (toleration + nodeSelector), giới hạn RAM.
nodeSelector:
  node-role.kubernetes.io/control-plane: ""
tolerations:
- key: node-role.kubernetes.io/control-plane
  operator: Exists
  effect: NoSchedule
resources:
  requests:
    cpu: 10m
    memory: 32Mi
  limits:
    memory: 64Mi
EOF
helm upgrade --install demo podinfo/podinfo --version "$PODINFO_VERSION" -n demo --create-namespace \
  --set ui.message='Xin chào từ Helm' -f ~/drills/s37/demo-values.yaml --wait --timeout 5m > ~/drills/s37/helm.log
head -6 ~/drills/s37/helm.log
k -n demo get pod -o wide

echo "== chart ~/charts/shop (lời giải chuẩn, gọt từ helm create)"
rm -rf ~/charts/shop.new && mkdir -p ~/charts/shop.new && tar xzf /tmp/s37-chart.tgz -C ~/charts/shop.new
rm -rf ~/charts/shop && mv ~/charts/shop.new/chart ~/charts/shop && rmdir ~/charts/shop.new
find ~/charts/shop -type f | sort
helm lint ~/charts/shop

# Mười lăm object đi vào chart (Quyết định của plan): Deployment + Service ClusterIP của bốn workload, ba ConfigMap, HPA,
# SA/Role/RoleBinding của order.
objs="deploy/gateway deploy/gateway-v1 deploy/catalog deploy/order svc/gateway svc/gateway-v1 svc/catalog svc/order
cm/shop-config cm/gateway-files cm/order-config hpa/catalog sa/order role/order-config-reader rolebinding/order-config-reader"

set_order_tag() { sed -i -E "/^order:/,/^[a-zA-Z]/ s/^(    tag: ).*/\1\"$1\"/" ~/charts/shop/values.yaml; }

if ! helm status shop -n shop >/dev/null 2>&1; then
  # Lần đầu: cài đúng như cluster đang chạy (order 1.0), rồi upgrade đổi một value (order 2.0).
  set_order_tag 1.0
  echo "== helm template so với cluster (kubectl diff: chỉ replicas của catalog, vì chart để HPA giữ replicas)"
  helm template shop ~/charts/shop -n shop | k diff -n shop -f - || true
  echo "== tình huống hỏng: cài khi object chưa mang nhãn/annotation của release"
  helm install shop ~/charts/shop -n shop > ~/drills/s37/install-error.txt 2>&1 || true
  cat ~/drills/s37/install-error.txt
  echo "== nhận lại (adoption): nhãn managed-by=Helm, annotation release-name/namespace"
  k -n shop label $objs app.kubernetes.io/managed-by=Helm --overwrite
  k -n shop annotate $objs meta.helm.sh/release-name=shop meta.helm.sh/release-namespace=shop --overwrite
  helm install shop ~/charts/shop -n shop --wait --timeout 5m > ~/drills/s37/helm.log
  head -6 ~/drills/s37/helm.log
  set_order_tag 2.0
fi
grep -A3 '^order:' ~/charts/shop/values.yaml
echo "== helm upgrade (order.image.tag 2.0); --force-conflicts: field image vẫn thuộc kubectl-client-side-apply"
helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait --timeout 5m > ~/drills/s37/helm.log
head -6 ~/drills/s37/helm.log
helm history shop -n shop
helm list -A

echo "== ~/shop/: tệp của object đã vào chart chuyển sang ~/shop/pre-helm/"
python3 - <<'PY'
import glob, os, yaml
home = os.path.expanduser('~')
shop, pre = f'{home}/shop', f'{home}/shop/pre-helm'
os.makedirs(pre, exist_ok=True)
CHART = {('Deployment', n) for n in ('gateway', 'gateway-v1', 'catalog', 'order')} | \
        {('Service', n) for n in ('gateway', 'gateway-v1', 'catalog', 'order')} | \
        {('ConfigMap', n) for n in ('shop-config', 'gateway-files', 'order-config')} | \
        {('HorizontalPodAutoscaler', 'catalog'), ('ServiceAccount', 'order'),
         ('Role', 'order-config-reader'), ('RoleBinding', 'order-config-reader')}
def dump(p, docs):
    with open(p, 'w') as f: yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
for p in sorted(glob.glob(f'{shop}/*.yaml') + glob.glob(f'{shop}/*.yml')):
    try: docs = [d for d in yaml.safe_load_all(open(p)) if d]
    except Exception: continue
    inc = [d for d in docs if isinstance(d, dict) and (d.get('kind'), (d.get('metadata') or {}).get('name')) in CHART]
    if not inc: continue
    name = os.path.basename(p)
    if len(inc) == len(docs):
        os.replace(p, f'{pre}/{name}'); print(f'chuyển {name}')
    else:
        rest = [d for d in docs if not any(d is x for x in inc)]
        dump(f'{pre}/{os.path.splitext(name)[0]}-chart.yaml', inc); dump(p, rest)
        print(f'tách {name}: {len(inc)} object sang pre-helm/{os.path.splitext(name)[0]}-chart.yaml, giữ {len(rest)}')
if os.path.isdir(f'{shop}/config') and not os.path.exists(f'{pre}/config'):
    os.replace(f'{shop}/config', f'{pre}/config'); print('chuyển config/ (nguồn của gateway-files, nay là files/ trong chart)')
PY
ls ~/shop ~/shop/pre-helm
k apply -f ~/shop/ --dry-run=server >/dev/null && echo "k apply -f ~/shop/ --dry-run=server: được"

echo "== kiểm"
k -n shop get deploy gateway gateway-v1 catalog order -o wide
k -n shop get deploy,svc,cm,hpa,sa,role,rolebinding -l app.kubernetes.io/managed-by=Helm
w1=$(k get node cka-w1 -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}')
echo "curl http://$w1:30180/api/products → $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$w1:30180/api/products")"
