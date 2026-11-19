# s36 — phần lời giải chạy trên cka-cp bằng user ubuntu sau khi apply.sh đã gây sự cố st6-access: đọc lỗi theo thứ tự của buổi
# (lỗi TLS → server của kubeconfig; whoami → cert của ai; Forbidden của ops → describe binding), sửa ~/dev.kubeconfig bằng
# `kubectl config set-cluster/set-credentials --embed-certs` (server như admin.conf), sửa ClusterRoleBinding shop-ops trong
# ~/shop/rbac.yaml (Group), apply; ghi đáp án. Chạy lại được.
set -e
k() { kubectl --request-timeout=10s "$@"; }
mkdir -p ~/drills/s36
echo "== dev: get pods"
k --kubeconfig ~/dev.kubeconfig get pods 2>&1 | tail -1 || true
k config view --minify --kubeconfig ~/dev.kubeconfig -o jsonpath='{.clusters[0].cluster.server}'; echo
echo "== ops: get nodes"
k --kubeconfig ~/ops.kubeconfig get nodes 2>&1 | tail -1 || true
k --kubeconfig ~/ops.kubeconfig auth whoami
k describe clusterrolebinding shop-ops | sed -n '/^Subjects/,$p'

echo "== sửa ~/dev.kubeconfig: server như admin.conf, cert dev"
server=$(sudo -n cat /etc/kubernetes/admin.conf | sed -n 's/^ *server: *//p' | head -n1)
# Nhúng lại CA cùng lúc (sự cố không đụng CA, nhưng một lần thử --insecure-skip-tls-verify=true đã xoá certificate-authority-data: đo).
k config set-cluster kubernetes --server="$server" --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig ~/dev.kubeconfig >/dev/null
k --kubeconfig ~/dev.kubeconfig auth whoami | sed -n 2p
k config set-credentials dev --client-certificate="$HOME/users/dev.crt" --client-key="$HOME/users/dev.key" --embed-certs --kubeconfig ~/dev.kubeconfig >/dev/null
chmod 600 ~/dev.kubeconfig
k --kubeconfig ~/dev.kubeconfig auth whoami | sed -n 2,3p
k --kubeconfig ~/dev.kubeconfig get pods -l app=order

echo "== sửa ClusterRoleBinding shop-ops trong ~/shop/rbac.yaml (Group shop-ops), apply"
python3 - <<'PY'
import os, yaml
p = os.path.expanduser('~/shop/rbac.yaml')
with open(p) as f: docs = [d for d in yaml.safe_load_all(f) if d]
for d in docs:
    if d.get('kind') == 'ClusterRoleBinding' and d['metadata']['name'] == 'shop-ops':
        d['subjects'] = [{'apiGroup': 'rbac.authorization.k8s.io', 'kind': 'Group', 'name': 'shop-ops'}]
with open(p, 'w') as f: yaml.safe_dump_all(docs, f, sort_keys=False, allow_unicode=True, width=1000)
PY
k apply -f ~/shop/rbac.yaml
k --kubeconfig ~/ops.kubeconfig get nodes

echo "== thông báo cho sẵn, API group"
cat ~/drills/s36/forbidden.txt
k api-resources | awk 'NR==1 || $1 ~ /^(deployments|networkpolicies)$/'
printf 'FORBIDDEN_MISSING=%s\n' 'patch,deployments/scale,apps' > ~/drills/s36/answers.env
cat ~/drills/s36/answers.env
