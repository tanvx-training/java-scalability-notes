# s46 — phép thử từ chính máy Mac, dùng chung cho chặng 9 và hai đề mock. Nạp trên Mac (bash 3.2) bằng
#   . "$SESSION_DIR/../s46/files/mac.sh"            (buổi)
#   . "$SESSION_DIR/../../sessions/s46/files/mac.sh"  (mock)
# rồi gọi, thường với IP lấy từ dòng W1_IP của s46/files/core-facts.sh.
#
# HỢP ĐỒNG: mac_get <IP cka-w1> <đường dẫn>
#   curl http://<IP>:30180<đường dẫn> (NodePort gateway-nodeport), tối đa 6 lần × (5 giây curl + 2 giây nghỉ) = 42 giây.
#   In đúng một dòng: `đạt` khi có lần trả 200 với thân đúng kiểu (…/products: đủ 3 sản phẩm, "id" khác nhau; đường dẫn khác:
#   một mảng JSON, thân bắt đầu bằng `[`), hoặc lý do ngắn: `Mac <đường dẫn> trả mã <mã cuối>` (000 khi không kết nối được),
#   `không đọc được IP cka-w1` khi đối số đầu không phải IPv4. Luôn trả mã 0 (dùng trong `$(…)` dưới set -e được). Chỉ đọc.
mac_get() {
  local ip="$1" path="$2" i body code=""
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP cka-w1"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:30180$path" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ]; then
      case "$path" in
        */products) [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ] && { echo "đạt"; return 0; } ;;
        *) printf '%s' "$body" | head -c1 | grep -q '\[' && { echo "đạt"; return 0; } ;;
      esac
    fi
    [ "$i" = 6 ] || sleep 2
  done
  echo "Mac $path trả mã ${code:-000}"
}
