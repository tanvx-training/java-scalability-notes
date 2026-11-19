# s38 — phần lời giải chạy trên cka-cp bằng user ubuntu (apply.sh đặt cây chuẩn ở /tmp/s38-kustomize.tgz và bản đầu của
# overlay dev ở /tmp/s38-dev-v1.yaml). Lần đầu: apply -k overlay dev bản chưa có literal riêng, rồi thêm literal
# LOGGING_LEVEL_SHOP=DEBUG (configMapGenerator behavior: merge) và apply lại: ConfigMap mới hậu tố khác, Pod rollout. Chạy
# lại được: catalog đã có ở shop-dev thì chỉ apply bản cuối (không đổi gì).
set -e
k() { kubectl --request-timeout=10s "$@"; }
mkdir -p ~/drills/s38 ~/kustomize
rm -rf ~/kustomize/shop.new && mkdir -p ~/kustomize/shop.new && tar xzf /tmp/s38-kustomize.tgz -C ~/kustomize/shop.new
rm -rf ~/kustomize/shop && mv ~/kustomize/shop.new/kustomize ~/kustomize/shop && rmdir ~/kustomize/shop.new
cd ~/kustomize/shop
find . -type f | sort

echo "== namespace shop-dev (namespace: trong kustomization không tạo namespace)"
k create ns shop-dev --dry-run=client -o yaml | k apply -f -

first=0
k -n shop-dev get deploy catalog >/dev/null 2>&1 || first=1
if [ "$first" = 1 ]; then
  cp overlays/dev/kustomization.yaml ~/drills/s38/dev-final.yaml
  cp /tmp/s38-dev-v1.yaml overlays/dev/kustomization.yaml
  echo "== xem trước bản đầu, rồi apply -k"
  k kustomize overlays/dev | grep -nE '^kind:|^  name:|namespace:|image:|replicas:|memory:'
  k apply -k overlays/dev
  k -n shop-dev rollout status deploy/catalog --timeout=300s
  k -n shop-dev get cm,rs
  echo "== thêm literal LOGGING_LEVEL_SHOP=DEBUG: hậu tố hash đổi → Deployment trỏ ConfigMap mới → rollout"
  cp ~/drills/s38/dev-final.yaml overlays/dev/kustomization.yaml
fi
k kustomize overlays/dev | grep -E 'name: catalog-config'
k apply -k overlays/dev
k -n shop-dev rollout status deploy/catalog --timeout=300s
k -n shop-dev get cm,rs
cm=$(k -n shop-dev get deploy catalog -o jsonpath='{.spec.template.spec.containers[0].envFrom[0].configMapRef.name}')
printf 'HASHED_CM_NAME=%s\n' "$cm" > ~/drills/s38/answers.env
cat ~/drills/s38/answers.env

echo "== overlay prod: chỉ build"
k kustomize overlays/prod | grep -nE '^kind:|^  name:|namespace:|image:|replicas:'

echo "== tình huống hỏng: patch nhắm sai tên object"
rm -rf ~/drills/s38/broken && mkdir -p ~/drills/s38/broken && cp -r overlays/dev ~/drills/s38/broken/dev
sed -i 's|- \.\./\.\./base|- ../../../../kustomize/shop/base|' ~/drills/s38/broken/dev/kustomization.yaml
sed -i 's/^  name: catalog$/  name: catalog-api/' ~/drills/s38/broken/dev/memory.yaml
k kustomize ~/drills/s38/broken/dev > /dev/null 2> ~/drills/s38/broken/error.txt || true
cat ~/drills/s38/broken/error.txt

echo "== kiểm"
k -n shop-dev get deploy,pod -o wide
p=$(k -n shop-dev get pod -l app=catalog --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1:].metadata.name}')
echo "GET /products qua apiserver proxy: $(k get --raw "/api/v1/namespaces/shop-dev/pods/$p:8080/proxy/products" 2>&1 | head -c 120)"
