# s31 — các dòng chấm, dùng chung cho verify.sh của s31 và s32 (s32: mọi dòng của s31 phải xanh lại). Cần sẵn: $facts (đầu ra
# của files/facts.sh), hàm fact, expect_eq của lab. curl TỪ MÁY MAC: --noproxy '*', --max-time 5, tối đa 6 lần, --resolve gắn
# shop.local vào IP đọc từ API (cka-w1 cho 30180/30080, node chạy data plane cho 30280). bash 3.2.

# mac_get <IP> <vai trò> <cổng> <path> <cần 3 sản phẩm: 1|0>: in "đạt" hoặc một thông báo ngắn.
s31_mac_get() {
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP của $2"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 --resolve "shop.local:$3:$ip" -w '\n%{http_code}' "http://shop.local:$3$4" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && { [ "$5" = 0 ] || [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; }; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  case "${code:-000}" in
    000) echo ":$3$4 hết giờ qua $ip" ;;
    *) echo ":$3$4 trả $code" ;;
  esac
}
# Bốn đường gọi song song (mỗi đường tối đa 6 × 7 giây): đường bị chặn không cộng dồn thời gian chờ.
s31_mac_all() {
  local d out
  [ "$(fact DENY_OK)" = 1 ] || { echo "chưa có default-deny: chưa có gì để chứng minh"; return 0; }
  d="$(mktemp -d)"
  s31_mac_get "$(fact W1_IP)" cka-w1 30180 /api/products 1 > "$d/1" &
  s31_mac_get "$(fact W1_IP)" cka-w1 30080 /api/products 1 > "$d/2" &
  s31_mac_get "$(fact W1_IP)" cka-w1 30080 /orders 0 > "$d/3" &
  s31_mac_get "$(fact DP_IP)" "node chạy data plane" 30280 /api/products 1 > "$d/4" &
  wait
  out="$(cat "$d/1" "$d/2" "$d/3" "$d/4" | grep . | grep -v '^đạt$' | paste -sd ';' - | sed 's/;/; /g')"
  rm -rf "$d"
  echo "${out:-đạt}"
}

expect_eq "default-deny: podSelector {}, policyTypes Ingress + Egress, không rule; mọi NetworkPolicy của shop có YAML trong ~/shop/" \
  "đạt" echo "$(fact DENY)"
expect_eq "Egress DNS cho mọi Pod: kube-system VÀ k8s-app=kube-dns (một phần tử), UDP+TCP 53; order phân giải được tên" \
  "đạt" echo "$(fact DNS)"
expect_eq "Pod tạm trong namespace tạm của verify → catalog:8080 bị chặn (hết giờ), DNS của nó vẫn chạy" "đạt" echo "$(fact OUTSIDE)"
expect_eq "kubectl exec từ Pod thật: luồng của app mở (gateway, gateway-v1, order, data plane), catalog→order, gateway→postgres chặn" \
  "đạt" echo "$(fact FLOWS)"
expect_eq "Dưới default-deny, từ máy Mac: :30180, Ingress :30080 (/api/products, /orders), Gateway :30280 đều trả 200" "đạt" s31_mac_all
expect_eq "Dưới default-deny: HPA catalog có số liệu CPU; gateway, gateway-v1, catalog, order, data plane, postgres, controller sẵn sàng" \
  "đạt" echo "$(fact HEALTH)"
expect_eq "answers.env: DEFAULT_NS_TO_CATALOG=blocked, DRAFT_TWO_PEERS=open; NetworkPolicy nháp allow-probe đã xoá" "đạt" echo "$(fact ANSWERS)"
