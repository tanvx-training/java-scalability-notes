# Chạy trong VM (bash): in ba giá trị mà ~/drills/s04/answers.env phải khớp, dạng KHOÁ=giá trị.
dev=$(ip route show default | awk '{print $5; exit}')
echo "DEFAULT_GW=$(ip route show default | awk '{print $3; exit}')"
# Máy chủ DNS cấu hình cho card ra (không phải stub 127.0.0.53 trong /etc/resolv.conf): IPv4 đầu tiên
echo "DNS_SERVER=$(resolvectl dns "$dev" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -n1)"
# Tiến trình nghe cổng 22, dạng <pid>/<tên> như netstat -p; bỏ systemd (giữ socket cho ssh.socket)
echo "SSH_PORT_PID_NAME=$(sudo ss -tlnpH 'sport = :22' | grep -oE '\("[^"]+",pid=[0-9]+' | grep -v '"systemd"' \
  | head -n1 | sed -E 's/^\("([^"]+)",pid=([0-9]+)$/\2\/\1/')"
