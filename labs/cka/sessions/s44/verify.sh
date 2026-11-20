# s44 — kiểm (5 dòng): mười một cert kubeadm ký lại sau mốc ~/drills/s44/started; kube-apiserver và etcd phục vụ đúng cert trên
# đĩa (fingerprint qua openssl s_client), bốn container control plane khởi động lại sau lần gia hạn, /readyz, node Ready,
# cert-manager và shop chạy, curl TỪ MÁY MAC tới 30180 (/api/products và /api/orders), Ingress :30080, Gateway :30280 trả 200; ~/.kube/config mang client
# cert của admin.conf mới, dev/ops.kubeconfig của s34 vẫn gọi được API; ~/drills/s44/ha.txt có lệnh init/join control plane
# với đủ cờ; answers.env QUORUM_5. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) và s39 (files/wait-cm.sh, 240 giây) cộng facts.sh (~35
# lệnh, mỗi lệnh tối đa 10–30 giây, thường dưới 1 giây) và bốn vòng curl tối đa 6 × 7 giây: chậm nhất ~30 phút, in ra đúng
# con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver, Deployment của shop và cert-manager, nếu đang khởi động: tối đa ~30 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "$(cat "$SESSION_DIR/../s39/files/wait-cm.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
# curl từ chính máy Mac: tối đa 6 lần × (5 giây curl + 2 giây nghỉ). Có host thì gửi kèm --resolve shop.local.
mac_get() { # <IP> <cổng> <host hay ->
  local ip="$1" port="$2" host="$3" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo ":$port không đọc được IP node"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    if [ "$host" = - ]; then
      body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:$port/api/products" 2>/dev/null)"
    else
      body="$(curl -s --noproxy '*' --max-time 5 --resolve "$host:$port:$ip" -w '\n%{http_code}' "http://$host:$port/api/products" 2>/dev/null)"
    fi
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  echo ":$port trả mã ${code:-000}"
}
# order chạy thật (review M7): /api/orders (gateway → order → PostgreSQL) trả 200 với một mảng JSON; status của Deployment có thể là
# status cũ sau một lần restore etcd bằng tay ở s43.
mac_orders() {
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo ":30180/api/orders không đọc được IP node"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:30180/api/orders" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && printf '%s' "$body" | head -c1 | grep -q '\['; then echo "đạt"; return 0; fi
    sleep 2
  done
  echo "/api/orders trả mã ${code:-000}"
}
served_row() {
  local r="" c
  [ "$(fact SERVED)" = "đạt" ] || r="$(fact SERVED)"
  for c in "$(mac_get "$(fact W1_IP)" 30180 -)" "$(mac_get "$(fact W1_IP)" 30080 shop.local)" "$(mac_get "$(fact DP_IP)" 30280 shop.local)" "$(mac_orders "$(fact W1_IP)")"; do
    [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "Mười một cert kubeadm (pki, etcd, bốn kubeconfig) ký lại sau mốc ~/drills/s44/started" "đạt" echo "$(fact CERTS)"
expect_eq "apiserver :6443 và etcd :2379 phục vụ cert trên đĩa; control plane khởi động lại sau gia hạn; node, cert-manager, shop chạy; Mac :30180, :30080, :30280, /api/orders trả 200" \
  "đạt" served_row
expect_eq "~/.kube/config dùng client cert của admin.conf mới; dev/ops.kubeconfig (s34) vẫn gọi được API" "đạt" echo "$(fact KUBECONFIG)"
expect_eq "~/drills/s44/ha.txt: kubeadm init --control-plane-endpoint --upload-certs; kubeadm join --control-plane --certificate-key" \
  "đạt" echo "$(fact HA)"
expect_eq "answers.env: QUORUM_5 là số member etcd phải sống trong cụm 5" "đạt" echo "$(fact ANS)"
assert_summary
