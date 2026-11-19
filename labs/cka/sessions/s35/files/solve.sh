# s35 — phần lời giải chạy trên cka-cp bằng user ubuntu (apply.sh gửi nội dung tệp này qua `vm`). Chạy lại được: mọi tệp sinh
# lại từ lệnh `kubectl create … --dry-run=client -o yaml` rồi `apply`; Pod thử và RoleBinding nháp xoá trước khi tạo lại.
set -e
k() { kubectl --request-timeout=10s "$@"; }
NETSHOOT='nicolaka/netshoot:v0.16@sha256:b09d9b21381f47a79b3cbcb30da25266dc17186ea00ae65e99fdc51396f48e70'
mkdir -p ~/drills/s35
cd ~/shop

echo "== sinh ~/shop/rbac.yaml bằng kubectl create --dry-run=client -o yaml"
d='--dry-run=client -o yaml'
{
  k -n shop create serviceaccount order $d; echo '---'
  # shop-deployer: đủ cho việc của đội ứng dụng trong shop (Deployment, Service, ConfigMap, HPA; xem Pod, log, exec, Event;
  # xoá Pod để tạo lại). Không Secret, NetworkPolicy, StatefulSet, quota hay RBAC.
  # (Người học: `create role … --dry-run=client -o yaml` cho dòng đầu rồi thêm các rule còn lại bằng tay.)
  cat <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: shop-deployer
  namespace: shop
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch", "delete"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
EOF
  echo '---'
  k -n shop create rolebinding shop-dev --role=shop-deployer --group=shop-dev $d; echo '---'
  # shop-ops-view: chỉ đọc, cả node và mọi namespace; không Secret (như ClusterRole view có sẵn).
  k create clusterrole shop-ops-view --verb=get,list,watch \
    --resource=nodes,namespaces,pods,pods/log,services,endpoints,events,configmaps,persistentvolumes,persistentvolumeclaims,deployments.apps,replicasets.apps,statefulsets.apps,daemonsets.apps,horizontalpodautoscalers.autoscaling,jobs.batch,cronjobs.batch,networkpolicies.networking.k8s.io,ingresses.networking.k8s.io,endpointslices.discovery.k8s.io,nodes.metrics.k8s.io,pods.metrics.k8s.io $d
  echo '---'
  k create clusterrolebinding shop-ops --clusterrole=shop-ops-view --group=shop-ops $d; echo '---'
  k -n shop create role order-config-reader --verb=get,list,watch --resource=configmaps --resource-name=order-config $d; echo '---'
  k -n shop create rolebinding order-config-reader --role=order-config-reader --serviceaccount=shop:order $d
} > ~/drills/s35/rbac.yaml.new
# Bỏ creationTimestamp: null do --dry-run in ra (không ảnh hưởng, chỉ cho gọn).
grep -v 'creationTimestamp: null' ~/drills/s35/rbac.yaml.new > ~/shop/rbac.yaml; rm -f ~/drills/s35/rbac.yaml.new
k -n shop create configmap order-config --from-literal=CATALOG_URL=http://catalog:8080 $d | grep -v 'creationTimestamp: null' > ~/shop/order-config.yaml

echo "== ~/shop/order.yaml: serviceAccountName order, envFrom order-config"
python3 - <<'PY'
import os, yaml
p = os.path.expanduser('~/shop/order.yaml')
with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
for d in docs:
    if d.get('kind') == 'Deployment' and d['metadata']['name'] == 'order':
        ps = d['spec']['template']['spec']
        ps['serviceAccountName'] = 'order'
        ps.pop('serviceAccount', None)
        c = [x for x in ps['containers'] if x['name'] == 'order'][0]
        ef = c.setdefault('envFrom', [])
        if not any((x.get('configMapRef') or {}).get('name') == 'order-config' for x in ef):
            ef.append({'configMapRef': {'name': 'order-config'}})
with open(p, 'w') as f: yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
PY
k apply -f ~/shop/rbac.yaml -f ~/shop/order-config.yaml -f ~/shop/order.yaml
k -n shop rollout status deploy/order --timeout=420s
k -n shop get pod -l app=order -o custom-columns=POD:.metadata.name,SA:.spec.serviceAccountName,READY:.status.containerStatuses[0].ready

echo "== auth can-i: --as trước khi giao, rồi bằng kubeconfig thật"
for q in 'create deployments -n shop' 'patch deployments -n shop' 'get pods -n shop' 'get nodes' 'list pods -n kube-system' 'create clusterroles'; do
  printf '%-28s --as: %-4s dev.kubeconfig: %s\n' "$q" "$(k auth can-i $q --as dev --as-group shop-dev 2>/dev/null || true)" \
    "$(k --kubeconfig ~/dev.kubeconfig auth can-i $q 2>/dev/null || true)"
done
k --kubeconfig ~/dev.kubeconfig auth can-i --list | head -20
for q in 'get nodes' 'list pods -A' 'delete pods -n shop' 'patch nodes' 'get secrets -n shop'; do
  printf '%-28s ops.kubeconfig: %s\n' "$q" "$(k --kubeconfig ~/ops.kubeconfig auth can-i $q 2>/dev/null || true)"
done
k --kubeconfig ~/ops.kubeconfig get nodes
k --kubeconfig ~/dev.kubeconfig get pods

echo "== tình huống hỏng: RoleBinding trỏ kind: User tên shop-dev thay vì Group"
k -n default delete rolebinding dev-draft --ignore-not-found >/dev/null
k -n default create rolebinding dev-draft --clusterrole=view --group=shop-dev $d |
  sed -e 's/kind: Group/kind: User/' > ~/drills/s35/dev-draft.yaml
k apply -f ~/drills/s35/dev-draft.yaml >/dev/null
echo "list pods -n default --as dev --as-group shop-dev: $(k auth can-i list pods -n default --as dev --as-group shop-dev || true)"
echo "list pods -n default --as shop-dev:                $(k auth can-i list pods -n default --as shop-dev || true)"
k -n default delete rolebinding dev-draft >/dev/null

echo "== token của SA order, gọi API từ một Pod tạm ở default (shop đã default-deny)"
t=$(k -n shop create token order --duration=10m)
k -n default delete pod sa-probe --ignore-not-found --grace-period=1 --wait=true >/dev/null
k -n default run sa-probe --image="$NETSHOOT" --restart=Never --command -- sleep 600 >/dev/null
k -n default wait --for=condition=Ready pod/sa-probe --timeout=300s >/dev/null
for path in configmaps/order-config configmaps/shop-config secrets/db-cred; do
  code=$(k -n default exec sa-probe -- curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt -H "Authorization: Bearer $t" \
    "https://kubernetes.default.svc/api/v1/namespaces/shop/$path")
  echo "GET /api/v1/namespaces/shop/$path → $code"
done
k -n default delete pod sa-probe --grace-period=1 --wait=false >/dev/null
