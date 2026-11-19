# s39 — phần lời giải chạy trên cka-cp bằng user ubuntu (apply.sh đã đặt bốn tệp của files/ vào /tmp/s39/). Chạy lại được:
# CRD và ShopFeature bằng `kubectl apply`, cert-manager bằng `helm upgrade --install` (đã có thì không đổi Pod),
# Issuer/Certificate bằng `kubectl apply`; answers.env ghi lại từ số CRD đếm được.
set -e
k() { kubectl --request-timeout=10s "$@"; }
CM_VERSION=v1.21.3
mkdir -p ~/drills/s39
install -m 644 /tmp/s39/shopfeature-crd.yaml ~/shop/shopfeature-crd.yaml
install -m 644 /tmp/s39/shopfeatures.yaml ~/shop/shopfeatures.yaml
install -m 644 /tmp/s39/shop-local-cert.yaml ~/shop/shop-local-cert.yaml
install -m 644 /tmp/s39/cert-manager-values.yaml ~/drills/s39/cert-manager-values.yaml
rm -rf /tmp/s39

echo "== api-resources: namespaced và cluster-scoped"
echo "namespaced: $(k api-resources --namespaced=true --no-headers | wc -l), cluster: $(k api-resources --namespaced=false --no-headers | wc -l)"

echo "== CRD shopfeatures.shop.example.com"
k apply -f ~/shop/shopfeature-crd.yaml
k wait --for=condition=Established crd/shopfeatures.shop.example.com --timeout=60s
# API mới phải hiện trong discovery trước khi apply resource của nó (kubectl đọc discovery lúc apply).
for i in $(seq 1 30); do k api-resources --api-group=shop.example.com --no-headers 2>/dev/null | grep -q shopfeatures && break; sleep 2; done
k api-resources --api-group=shop.example.com
k apply -f ~/shop/shopfeatures.yaml
k -n shop get shopfeatures
k explain shopfeature.spec | sed -n '1,20p'

echo "== tình huống hỏng: resource sai schema"
cat > ~/drills/s39/bad-feature.yaml <<'EOF'
apiVersion: shop.example.com/v1
kind: ShopFeature
metadata:
  name: bad-feature
  namespace: shop
spec:
  enabled: "yes"
  rolloutPercent: 150
EOF
k apply -f ~/drills/s39/bad-feature.yaml > ~/drills/s39/rejected.txt 2>&1 || true
cat ~/drills/s39/rejected.txt

echo "== cert-manager $CM_VERSION bằng Helm (crds.enabled=true, ba thành phần trên cka-cp)"
helm repo add jetstack https://charts.jetstack.io --force-update
helm repo update jetstack
helm upgrade --install cert-manager jetstack/cert-manager --version "$CM_VERSION" -n cert-manager --create-namespace \
  -f ~/drills/s39/cert-manager-values.yaml --wait --timeout 10m > ~/drills/s39/helm.log
head -6 ~/drills/s39/helm.log
k -n cert-manager get deploy,pod -o wide

echo "== Issuer selfsigned và Certificate shop-local (Secret shop-local-cm-tls)"
# Webhook của cert-manager có thể chưa nhận kết nối ngay sau khi Deployment Available: thử lại tới 90 giây.
for i in $(seq 1 30); do k apply -f ~/shop/shop-local-cert.yaml && break; sleep 3; done
k -n shop wait --for=condition=Ready issuer/selfsigned --timeout=60s
k -n shop wait --for=condition=Ready certificate/shop-local --timeout=120s
k -n shop get issuer,certificate,certificaterequest
k -n shop get secret shop-local-cm-tls -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -subject -issuer -ext subjectAltName -enddate

n=$(k get crd -o name | grep -c '\.cert-manager\.io$')
echo "CERT_MANAGER_CRDS=$n" > ~/drills/s39/answers.env
cat ~/drills/s39/answers.env
