# s11 — lời giải chuẩn: xoá Pod lẻ catalog ở default; namespace shop; ba Deployment sinh bằng `kubectl create deploy … $do`
# lưu ở ~/shop/ (catalog 2 replica); ba Service ClusterIP cổng 8080 bằng `kubectl expose`; thử một Service selector lệch
# (catalog-api) rồi xoá; xoá một Pod catalog, lần ownerReferences ra ReplicaSet; ghi ~/drills/s11/answers.env.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm "$cp" "set -e
  do='--dry-run=client -o yaml'
  kubectl -n default delete pod catalog catalog-bad --ignore-not-found --wait=true >/dev/null
  kubectl create namespace shop \$do | kubectl apply -f - >/dev/null
  mkdir -p ~/shop ~/drills/s11
  for spec in gateway:1 catalog:2 order:1; do
    d=\${spec%%:*}; n=\${spec##*:}
    kubectl -n shop create deploy \$d --image=shop/\$d:1.0 --replicas=\$n --port=8080 \$do > ~/shop/\$d.yaml
    kubectl apply -f ~/shop/\$d.yaml >/dev/null
  done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=240s >/dev/null; done
  for d in gateway catalog order; do
    kubectl -n shop expose deploy \$d --port=8080 \$do | kubectl apply -f - >/dev/null
  done"
# Tình huống hỏng: create service lấy selector app=<tên service>, không Pod nào mang nhãn đó → EndpointSlice rỗng.
sel="$(vm "$cp" "kubectl -n shop delete svc catalog-api --ignore-not-found >/dev/null
  kubectl -n shop create service clusterip catalog-api --tcp=8080:8080 >/dev/null
  s=app=\$(kubectl -n shop get svc catalog-api -o jsonpath='{.spec.selector.app}')
  kubectl -n shop delete svc catalog-api >/dev/null; echo \"\$s\"")"
[ "$sel" = "app=catalog-api" ] || { echo "s11: selector của catalog-api là '$sel'" >&2; exit 1; }
# Xoá một Pod catalog: ReplicaSet tạo Pod thay thế; Pod mới trỏ về ReplicaSet qua ownerReferences.
vm "$cp" "set -e
  old=\$(kubectl -n shop get pod -l app=catalog -o jsonpath='{.items[0].metadata.name}')
  kubectl -n shop delete pod \"\$old\" --wait=true >/dev/null
  kubectl -n shop rollout status deploy/catalog --timeout=240s >/dev/null
  rs=\$(kubectl -n shop get pod -l app=catalog -o jsonpath='{.items[0].metadata.ownerReferences[0].name}')
  printf 'CATALOG_RS=%s\nEMPTY_SELECTOR=%s\n' \"\$rs\" '$sel' > ~/drills/s11/answers.env"
echo "s11: chờ gateway trả /api/products"
vm "$cp" "for i in \$(seq 1 60); do
  kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products 2>/dev/null | grep -q '\"id\":3' && exit 0; sleep 2
done; exit 1"
