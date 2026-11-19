# s36 — kiểm đầu vào: RBAC của dev trong cluster hỏi bằng quyền admin và --as (kubeconfig của dev là thứ sự cố phá), và
# ClusterRole shop-ops-view còn, chỉ get/list/watch. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu. Chỉ đọc.
k() { kubectl --request-timeout=10s "$@" 2>/dev/null; }
as='--as dev --as-group shop-dev'
bad=''
[ "$(k auth can-i create deployments.apps -n shop $as)" = yes ] || bad="$bad; dev chưa create deployments ở shop"
[ "$(k auth can-i get pods -n shop $as)" = yes ] || bad="$bad; dev chưa get pods ở shop"
[ "$(k auth can-i get nodes $as)" = no ] || bad="$bad; dev không được get nodes"
[ "$(k auth can-i list pods -n kube-system $as)" = no ] || bad="$bad; dev không được list pods ở kube-system"
v=$(k get clusterrole shop-ops-view -o jsonpath='{.rules[*].verbs}')
if [ -z "$v" ]; then bad="$bad; chưa có ClusterRole shop-ops-view"
elif printf '%s' "$v" | tr -d '[]"' | tr ', ' '\n\n' | grep -v '^$' | grep -qvxE 'get|list|watch'; then
  bad="$bad; shop-ops-view có verb ngoài get/list/watch"
fi
if [ -n "$bad" ]; then echo "DEVRBAC=${bad#; }"; else echo "DEVRBAC=đạt"; fi
