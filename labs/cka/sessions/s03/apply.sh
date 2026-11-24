# s03 — lời giải chuẩn trên cka-cp: user shop, /opt/shop, unit shop-heartbeat, jq được hold.
# Khoá dpkg: apt_get / apt_mark của s42/files/aptlock.sh (ghép vào lệnh bên dưới): unattended-upgrade có thể giữ khoá ngay sau
# khi VM bật lại; apt-get chờ bằng DPkg::Lock::Timeout, apt-mark thử lại khi lỗi là khoá, tối đa 600 giây.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm_put "$SESSION_DIR/files/heartbeat.sh" "$LAB_CP" /tmp/heartbeat.sh
vm_put "$SESSION_DIR/files/shop-heartbeat.service" "$LAB_CP" /tmp/shop-heartbeat.service
vm "$LAB_CP" "sudo bash -euc '
$(cat "$SESSION_DIR/../s42/files/aptlock.sh")
id shop >/dev/null 2>&1 || useradd -m -s /bin/bash shop
install -d -o shop -g shop -m 750 /opt/shop
install -o shop -g shop -m 750 /tmp/heartbeat.sh /opt/shop/heartbeat.sh
install -o root -g root -m 644 /tmp/shop-heartbeat.service /etc/systemd/system/shop-heartbeat.service
rm -f /tmp/heartbeat.sh /tmp/shop-heartbeat.service
systemctl daemon-reload
systemctl enable --now shop-heartbeat.service
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a NEEDRESTART_SUSPEND=1
apt-get -o DPkg::Lock::Timeout=\$LOCKWAIT install -y -q jq >/dev/null
apt_mark hold jq
# chờ tới khi journal có ít nhất 2 dòng của service (mỗi dòng cách 10 giây)
for i in \$(seq 1 30); do
  n=\$(journalctl _SYSTEMD_UNIT=shop-heartbeat.service -o cat --no-pager | wc -l)
  [ \"\$n\" -ge 2 ] && exit 0
  sleep 1
done
echo \"s03: journal của shop-heartbeat mới có \$n dòng\" >&2; exit 1'"
