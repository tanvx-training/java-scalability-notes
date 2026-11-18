# s30 — lời giải chuẩn: CRD Gateway API v1.6.3 kênh standard (bản NGF 2.8.1 hỗ trợ) và CRD của NGINX Gateway Fabric
# (`kubectl apply --server-side`), manifest NGF v2.8.1 bản nodeport tải vào ~/drills/s30 và sửa bằng files/patch-ngf.py (control
# plane và data plane trên cka-cp, NodePort 30280 cho listener 80, requests/limits cho data plane), apply; đọc GatewayClass nginx;
# ~/shop/shop-gw.yaml (Gateway, listener http :80 shop.local), chờ Programmed; ~/shop/gateway-v1.yaml (Deployment + Service,
# image 1.0) và ~/shop/httproute.yaml (/api PathPrefix, gateway 90 / gateway-v1 10); HTTPRoute nháp shop-draft: parentRefs sai tên
# Gateway (không có điều kiện Accepted từ shop-gw), rồi backend không tồn tại (ResolvedRefs=False) → ROUTE_BAD_REASON, xoá; từ máy
# Mac gọi /api/info 100 lần đếm version 1.0 → V1_HITS. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
GWAPI_VERSION=v1.6.3
NGF_VERSION=v2.8.1
gwapi_url="https://github.com/kubernetes-sigs/gateway-api/releases/download/$GWAPI_VERSION/standard-install.yaml"
ngf_base="https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/$NGF_VERSION/deploy"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in patch-ngf.py shop-gw.yaml gateway-v1.yaml httproute.yaml route-draft.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s30-$f"
done

echo "s30: CRD Gateway API $GWAPI_VERSION (standard) và NGINX Gateway Fabric $NGF_VERSION"
vm "$cp" "set -e; mkdir -p ~/drills/s30; cd ~/drills/s30
  get() { [ -s \"\$2\" ] && grep -q \"\$3\" \"\$2\" && return 0; curl -fsSL --retry 3 --max-time 120 -o \"\$2.tmp\" \"\$1\"; mv \"\$2.tmp\" \"\$2\"; }
  get '$gwapi_url' gateway-api-standard.yaml 'bundle-version: $GWAPI_VERSION'
  get '$ngf_base/crds.yaml' ngf-crds.yaml 'nginxproxies.gateway.nginx.org'
  get '$ngf_base/nodeport/deploy.yaml' ngf-deploy.yaml 'nginx-gateway-fabric:${NGF_VERSION#v}'
  kubectl apply --server-side -f gateway-api-standard.yaml >/dev/null
  kubectl apply --server-side -f ngf-crds.yaml >/dev/null
  kubectl wait --for=condition=Established --timeout=120s crd/gatewayclasses.gateway.networking.k8s.io crd/gateways.gateway.networking.k8s.io \
    crd/httproutes.gateway.networking.k8s.io crd/nginxproxies.gateway.nginx.org >/dev/null
  kubectl get crd -o 'custom-columns=NAME:.metadata.name,VERSION:.metadata.annotations.gateway\\.networking\\.k8s\\.io/bundle-version,CHANNEL:.metadata.annotations.gateway\\.networking\\.k8s\\.io/channel' | grep -E 'NAME|gateway.networking'
  python3 /tmp/lab-s30-patch-ngf.py ngf-deploy.yaml; rm -f /tmp/lab-s30-patch-ngf.py
  grep -E 'image:|repository:|tag:|- port:|listenerPort:' ngf-deploy.yaml
  kubectl apply -f ngf-deploy.yaml >/dev/null
  kubectl -n nginx-gateway rollout status deploy/nginx-gateway --timeout=600s >/dev/null
  kubectl wait --for=condition=Accepted gatewayclass/nginx --timeout=180s >/dev/null
  kubectl -n nginx-gateway get pod -o wide
  kubectl get gatewayclass nginx
  kubectl get gatewayclass nginx -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}{\"\\n\"}{end}'"

echo "s30: Gateway shop-gw (listener http :80, shop.local), chờ Programmed"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s30-shop-gw.yaml ~/shop/shop-gw.yaml; rm -f /tmp/lab-s30-shop-gw.yaml
  kubectl apply -f ~/shop/shop-gw.yaml >/dev/null
  kubectl -n shop wait --for=condition=Programmed gateway/shop-gw --timeout=600s >/dev/null
  kubectl -n shop get gateway shop-gw
  kubectl -n shop get deploy,svc,pod -l gateway.networking.k8s.io/gateway-name=shop-gw -o wide"

echo "s30: gateway-v1 (image 1.0) và HTTPRoute shop chia 90/10"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s30-gateway-v1.yaml ~/shop/gateway-v1.yaml; install -m 644 /tmp/lab-s30-httproute.yaml ~/shop/httproute.yaml
  rm -f /tmp/lab-s30-gateway-v1.yaml /tmp/lab-s30-httproute.yaml
  kubectl apply -f ~/shop/gateway-v1.yaml >/dev/null
  kubectl -n shop rollout status deploy/gateway-v1 --timeout=600s >/dev/null
  kubectl apply -f ~/shop/httproute.yaml >/dev/null
  kubectl -n shop wait --for=condition=Accepted httproute/shop --timeout=120s >/dev/null 2>&1 || true
  for i in \$(seq 1 40); do
    st=\$(kubectl -n shop get httproute shop -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {end}')
    case \"\$st\" in *Accepted=True*ResolvedRefs=True*|*ResolvedRefs=True*Accepted=True*) break ;; esac; sleep 3
  done
  kubectl -n shop get httproute shop -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}{\"\\n\"}{end}'
  case \"\$st\" in *Accepted=True*) ;; *) echo 'HTTPRoute shop chưa Accepted' >&2; exit 1 ;; esac"

echo "s30: HTTPRoute nháp shop-draft: parentRefs sai tên Gateway, rồi backend không tồn tại"
vm "$cp" "set -e
  sed 's/name: shop-gw\$/name: shop-gateway/' /tmp/lab-s30-route-draft.yaml > ~/drills/s30/route-draft.yaml
  kubectl apply -f ~/drills/s30/route-draft.yaml >/dev/null
  sleep 10
  echo '--- parentRefs: shop-gateway (không có Gateway này)'
  kubectl -n shop get httproute shop-draft -o jsonpath='{.status}'; echo
  kubectl -n shop describe httproute shop-draft | sed -n '/^Status:/,\$p'
  install -m 644 /tmp/lab-s30-route-draft.yaml ~/drills/s30/route-draft.yaml; rm -f /tmp/lab-s30-route-draft.yaml
  kubectl apply -f ~/drills/s30/route-draft.yaml >/dev/null
  reason=''
  for i in \$(seq 1 40); do
    reason=\$(kubectl -n shop get httproute shop-draft -o jsonpath='{.status.parents[0].conditions[?(@.type==\"ResolvedRefs\")].reason}')
    [ -n \"\$reason\" ] && [ \"\$reason\" != ResolvedRefs ] && break; sleep 3
  done
  echo '--- parentRefs: shop-gw, backend gateway-v2 (không có Service này)'
  kubectl -n shop get httproute shop-draft -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}: {.message}{\"\\n\"}{end}'
  kubectl -n shop delete httproute shop-draft >/dev/null
  [ -n \"\$reason\" ] && [ \"\$reason\" != ResolvedRefs ]
  printf 'ROUTE_BAD_REASON=%s\n' \"\$reason\" > ~/drills/s30/answers.env.part"

# IP của node chạy data plane (Service NodePort externalTrafficPolicy Local: chỉ node có Pod mới trả lời).
ip="$(vm "$cp" "n=\$(kubectl -n shop get pod -l gateway.networking.k8s.io/gateway-name=shop-gw --field-selector=status.phase=Running -o jsonpath='{.items[0].spec.nodeName}')
  kubectl get node \"\$n\" -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}'")"
echo "s30: từ máy Mac: 100 lần curl --resolve shop.local:30280:$ip http://shop.local:30280/api/info, đếm version 1.0"
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf --noproxy '*' --max-time 5 --resolve "shop.local:30280:$ip" http://shop.local:30280/api/products | grep -q '"id":3' && { ok=1; break; }
  sleep 3
done
[ "$ok" = 1 ] || { echo "s30: http://shop.local:30280/api/products (qua $ip) không trả 3 sản phẩm" >&2; exit 1; }
hits=0
for t in 1 2 3; do
  hits=0; other=0
  for i in $(seq 1 100); do
    v="$(curl -s --noproxy '*' --max-time 5 --resolve "shop.local:30280:$ip" http://shop.local:30280/api/info | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')"
    case "$v" in 1.0) hits=$((hits + 1)) ;; 2.0) ;; *) other=$((other + 1)) ;; esac
  done
  echo "s30: lần $t: version 1.0 = $hits/100, lỗi = $other"
  [ "$other" -le 5 ] && [ "$hits" -ge 3 ] && [ "$hits" -le 20 ] && break
done
[ "$hits" -ge 3 ] && [ "$hits" -le 20 ] || { echo "s30: V1_HITS=$hits ngoài 3–20" >&2; exit 1; }
vm "$cp" "set -e; { printf 'V1_HITS=%s\n' $hits; cat ~/drills/s30/answers.env.part; } > ~/drills/s30/answers.env
  rm -f ~/drills/s30/answers.env.part; cat ~/drills/s30/answers.env"
