# s45 — trước khi chờ (verify, check): etcd trên cka-cp có đang phục vụ không? Chạy trên cka-cp (user ubuntu, sudo). Chỉ đọc.
# VM vừa bật (cka-cp chạy chưa tới 5 phút) thì chờ etcd tới phút thứ 5 sau boot; còn lại chờ tối đa 45 giây. etcd không lên
# trong khoảng đó là "đang hỏng", không phải "đang khởi động": verify đỏ ngay thay vì chờ apiserver 420 giây (s26/files/wait.sh)
# khi chính etcd làm apiserver không lên. In ETCD=ok, hay ETCD=<lý do ngắn> đọc từ crictl (trạng thái container etcd mới
# nhất, số container etcd kể cả đã dừng).
PKI=/etc/kubernetes/pki/etcd
now=$(date +%s)
boot=$(date -d "$(uptime -s)" +%s)
end=$((boot + 300)); [ "$end" -gt $((now + 45)) ] || end=$((now + 45))
ok() { sudo -n timeout 8 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt \
  --key=$PKI/server.key --command-timeout=3s endpoint health >/dev/null 2>&1; }
until ok; do [ "$(date +%s)" -lt "$end" ] || break; sleep 3; done
if ok; then echo "ETCD=ok"; exit 0; fi
ids=$(sudo -n timeout 10 crictl ps -a -q --name '^etcd$' 2>/dev/null)
n=$(printf '%s\n' "$ids" | grep -c .)
st=$( [ "$n" -gt 0 ] && sudo -n timeout 10 crictl inspect "$(printf '%s\n' "$ids" | head -1)" 2>/dev/null |
  python3 -c 'import json,sys; s=json.load(sys.stdin)["status"]; print(s.get("state","?").replace("CONTAINER_","").lower(), "mã", s.get("exitCode"))' 2>/dev/null)
echo "ETCD=etcd không phục vụ ($(( $(date +%s) - now )) giây; crictl: ${n} container etcd${st:+, mới nhất $st})"
