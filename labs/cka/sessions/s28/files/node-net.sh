# s28 — sửa môi trường trên mỗi node (chạy bằng user ubuntu, sudo), chạy lại được: bật TCP MTU probing để kết nối ra Internet
# tự hạ MSS khi đường ra có MTU nhỏ hơn 1500 mà không trả ICMP "fragmentation needed" (lỗ đen PMTUD: ping -M do 1500 byte mất
# hết, tracepath vẫn báo pmtu 1500). Không có nó, containerd kéo blob từ cdn.registry.k8s.io lỗi "TLS handshake timeout" (curl
# vẫn chạy), nên Pod CoreDNS dời sang worker sau `rollout restart` đứng ImagePullBackOff. Đo A/B 2026-11-18: ctr pull
# registry.k8s.io/pause:3.9 lỗi sau 11 giây trên cka-w1 và cka-cp, GODEBUG=tlsmlkem=0 vẫn lỗi, tcp_mtu_probing=1 kéo được
# (5–6 giây). Ghi vào /etc/sysctl.d nên bền qua khởi động lại. Xem labs/cka/README.md, mục Mạng.
f=/etc/sysctl.d/90-lab-tcp-mtu-probing.conf
want='net.ipv4.tcp_mtu_probing = 1'
if [ "$(cat "$f" 2>/dev/null)" != "$want" ]; then
  printf '%s\n' "$want" | sudo tee "$f" >/dev/null
fi
sudo sysctl -q -p "$f"
[ "$(cat /proc/sys/net/ipv4/tcp_mtu_probing)" = 1 ]
