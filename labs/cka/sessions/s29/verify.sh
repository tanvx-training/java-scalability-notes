# s29 — kiểm (8 dòng): controller ingress-nginx Available trên cka-cp, Service NodePort http 30080 / https 30443; IngressClass
# nginx; Ingress shop (class nginx, shop.local, /api Prefix → gateway:8080, /orders Exact → order:8080, tls shop-tls, có ADDRESS,
# YAML trong ~/shop/); Secret shop-tls (kubernetes.io/tls, SAN shop.local, khoá khớp); /etc/hosts của cka-cp; curl TỪ MÁY MAC
# http (30080) và https (30443, --cacert bằng chính chứng chỉ của shop-tls) tới shop.local qua IP cka-w1 đọc từ API, dùng
# --resolve nên không phụ thuộc /etc/hosts của Mac; PATH_EXACT_RESULT, PATH_EXACT_FROM, Ingress nháp đã xoá. Chỉ đọc. Nạp bởi `lab` trên máy Mac
# (bash 3.2). Sau khi VM khởi động lại: chờ có giới hạn (420 giây cho apiserver, CoreDNS, postgres-0, ba Deployment và
# controller, cộng facts.sh với --request-timeout 10 giây mỗi lệnh và hai vòng curl tối đa 6 × 7 giây: in ra ~11 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, CoreDNS, postgres-0, ba Deployment và ingress-nginx, nếu đang khởi động: tối đa ~11 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

ca="$(mktemp)"; trap 'rm -f "$ca"' EXIT
fact CA_B64 | base64 -D > "$ca" 2>/dev/null || : > "$ca"

# curl từ chính máy Mac tới shop.local qua NodePort của ingress-nginx. --resolve gắn shop.local vào IP cka-w1 (đọc từ API) cho
# riêng lệnh này: Host và SNI là shop.local, không cần /etc/hosts của Mac. --noproxy: Mac có http_proxy thì không gửi qua proxy.
# Tối đa 6 lần × (5 giây curl + 2 giây nghỉ) cho mỗi URL.
mac_get() { # <scheme> <port> <path> <cần 3 sản phẩm: 1|0>
  local ip="$W1_IP" i body code err extra=""
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP của cka-w1"; return 0 ;; esac
  if [ "$1" = https ]; then
    [ -s "$ca" ] || { echo "không đọc được chứng chỉ của Secret shop-tls để gọi https"; return 0; }
    extra="--cacert $ca"
  fi
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 $extra --resolve "shop.local:$2:$ip" -w '\n%{http_code}' "$1://shop.local:$2$3" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && { [ "$4" = 0 ] || [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; }; then
      return 0
    fi
    sleep 2
  done
  # Thông báo ngắn (dòng chấm cắt ở 80 ký tự): điều gì hỏng trước, chi tiết sau.
  case "${code:-000}" in
    000)
      if [ "$1" = https ]; then
        err="$(curl -sS --noproxy '*' --max-time 5 $extra --resolve "shop.local:$2:$ip" -o /dev/null "$1://shop.local:$2$3" 2>&1 | head -n1 | sed 's/^curl: //')"
        echo "https :$2 lỗi ${err:-không kết nối được} (chứng chỉ có phải shop-tls?)"
      else
        echo "Mac không nối được shop.local:$2 qua $ip (controller, NodePort?)"
      fi ;;
    308|301|302) echo "http :$2$3 trả $code sang https (Ingress có tls: ssl-redirect)" ;;
    404) echo "$1 :$2$3 trả 404 (Ingress không khớp host/path/class)" ;;
    200) echo "$1 :$2$3 trả 200 nhưng không đủ 3 sản phẩm" ;;
    *) echo "$1 :$2$3 trả mã $code" ;;
  esac
}
W1_IP="$(fact W1_IP)"
mac_http() {
  local a b
  a="$(mac_get http 30080 /api/products 1)"; b="$(mac_get http 30080 /orders 0)"
  [ -z "$a$b" ] && { echo "đạt"; return 0; }
  printf '%s\n' "$a" "$b" | grep . | paste -sd ';' - | sed 's/;/; /g'
}
mac_https() { local a; a="$(mac_get https 30443 /api/products 1)"; echo "${a:-đạt}"; }

expect_eq "ingress-nginx: controller Available, chạy trên cka-cp; Service NodePort http 30080, https 30443" "đạt" echo "$(fact CTRL)"
expect_eq "IngressClass nginx (controller k8s.io/ingress-nginx)" "đạt" echo "$(fact ICLASS)"
expect_eq "Ingress shop: class nginx, shop.local, /api Prefix → gateway:8080, /orders Exact → order:8080, tls shop-tls, có ADDRESS; YAML trong ~/shop/" \
  "đạt" echo "$(fact INGRESS)"
expect_eq "Secret shop-tls: kubernetes.io/tls, SAN DNS:shop.local, khoá khớp chứng chỉ, còn hạn" "đạt" echo "$(fact SECRET)"
expect_eq "cka-cp: shop.local trong /etc/hosts trỏ IP một node; curl http://shop.local:30080/api/products trả 200" "đạt" echo "$(fact CPHOSTS)"
expect_eq "Từ máy Mac: http://shop.local:30080/api/products (3 sản phẩm) và /orders trả 200 (--resolve tới IP cka-w1)" "đạt" mac_http
expect_eq "Từ máy Mac: https://shop.local:30443/api/products trả 200, chứng chỉ là shop-tls (--cacert, không -k)" "đạt" mac_https
expect_eq "answers.env: PATH_EXACT_RESULT=404, PATH_EXACT_FROM=nginx; Ingress nháp không có ingressClassName đã xoá" "đạt" echo "$(fact ANSWERS)"
assert_summary
