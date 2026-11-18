# s30 — kiểm (9 dòng): CRD Gateway API v1.6.3 kênh standard (gatewayclasses, gateways, httproutes phục vụ v1); control plane
# NGINX Gateway Fabric trên cka-cp, GatewayClass nginx Accepted; Gateway shop-gw (HTTP :80 shop.local) Programmed, Service data
# plane NodePort 30280; gateway-v1 (1 replica, image 1.0, probe/tài nguyên như gateway) và Service của nó; HTTPRoute shop
# (shop-gw, shop.local, PathPrefix /api, gateway 90 / gateway-v1 10) Accepted và ResolvedRefs, YAML trong ~/shop/; curl TỪ MÁY
# MAC tới shop.local:30280 (IP node chạy data plane, đọc từ API, --resolve); Ingress của s29 vẫn phục vụ (shop.local:30080 qua
# IP cka-w1); V1_HITS trong 3–20; ROUTE_BAD_REASON, HTTPRoute nháp đã xoá. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn (420 giây cho apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và
# NGF, cộng facts.sh với --request-timeout 10 giây mỗi lệnh và hai vòng curl tối đa 6 × 7 giây: in ra ~11 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và NGF, nếu đang khởi động: tối đa ~11 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# curl từ chính máy Mac. --resolve gắn shop.local vào IP node cho riêng lệnh này (không cần /etc/hosts của Mac), --noproxy: Mac có
# http_proxy thì không gửi qua proxy. Tối đa 6 lần × (5 giây curl + 2 giây nghỉ). Thông báo ngắn: dòng chấm cắt ở 80 ký tự.
mac_get() { # <IP> <tên node/vai trò> <cổng>
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP của $2"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 --resolve "shop.local:$3:$ip" -w '\n%{http_code}' "http://shop.local:$3/api/products" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  case "${code:-000}" in
    000) echo "Mac không nối được shop.local:$3 qua $ip ($2)" ;;
    404) echo ":$3/api/products trả 404 (route/Ingress không khớp host, path)" ;;
    200) echo ":$3/api/products trả 200 nhưng không đủ 3 sản phẩm" ;;
    *) echo ":$3/api/products trả mã $code" ;;
  esac
}

expect_eq "CRD Gateway API v1.6.3 kênh standard: gatewayclasses, gateways, httproutes phục vụ v1" "đạt" echo "$(fact CRD)"
expect_eq "NGINX Gateway Fabric: control plane Available trên cka-cp; GatewayClass nginx Accepted=True" "đạt" echo "$(fact NGF)"
expect_eq "Gateway shop-gw: class nginx, listener HTTP :80 shop.local, Programmed=True; data plane NodePort 30280; YAML trong ~/shop/" \
  "đạt" echo "$(fact GATEWAY)"
expect_eq "gateway-v1: 1 replica shop/gateway:1.0, probe và tài nguyên như gateway, Available; Service gateway-v1 http 8080; ~/shop/" \
  "đạt" echo "$(fact V1)"
expect_eq "HTTPRoute shop: shop-gw, shop.local, PathPrefix /api → gateway 90 / gateway-v1 10; Accepted, ResolvedRefs; ~/shop/ khớp" \
  "đạt" echo "$(fact ROUTE)"
expect_eq "Từ máy Mac: http://shop.local:30280/api/products qua Gateway trả 200 với 3 sản phẩm (--resolve tới node chạy data plane)" \
  "đạt" mac_get "$(fact DP_IP)" "node chạy data plane" 30280
expect_eq "Từ máy Mac: Ingress của s29 vẫn phục vụ: http://shop.local:30080/api/products trả 200 (--resolve tới IP cka-w1)" \
  "đạt" mac_get "$(fact W1_IP)" cka-w1 30080
expect_eq "answers.env: V1_HITS (số lần /api/info trả version 1.0 trên 100 request) trong 3–20" "đạt" echo "$(fact HITS)"
expect_eq "answers.env: ROUTE_BAD_REASON là lý do của ResolvedRefs khi backend sai tên; HTTPRoute nháp đã xoá" "đạt" echo "$(fact BAD)"
assert_summary
