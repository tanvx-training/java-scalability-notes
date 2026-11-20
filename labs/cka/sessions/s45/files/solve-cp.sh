# s45 — phần lời giải trên cka-cp (user ubuntu, sudo), gọi bởi apply.sh sau khi setup.sh đã gây sự cố st8-ops. Đi đúng quy
# trình khi kubectl không dùng được: kubectl → kubelet (systemctl, journalctl) → crictl (ps -a, logs) → manifest → sửa →
# etcdctl. Sửa manifest etcd như người học (hai dòng path/type của volume etcd-data về /var/lib/etcd-restore và
# DirectoryOrCreate), rồi so với bản tốt mà sự cố đã lưu trước khi gây lỗi (/root/.lab/st8-ops/etcd.yaml): khác thì cài
# đúng bản đó (theo nội dung). Không bao giờ trỏ etcd sang thư mục nào khác /var/lib/etcd-restore, không xoá gì.
# Chạy lại được: manifest đã như bản tốt và etcd chạy từ /var/lib/etcd-restore thì chỉ chờ apiserver.
set -e
NEW=/var/lib/etcd-restore
MAN=/etc/kubernetes/manifests
GOOD=/root/.lab/st8-ops/etcd.yaml
OFF=/etc/kubernetes/s45-off
PKI=/etc/kubernetes/pki/etcd
k() { kubectl --request-timeout=5s "$@"; }
ec() { sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt --key=$PKI/server.key --command-timeout=3s "$@"; }
log() { echo "s45: $*"; }
die() { echo "s45: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ $(date +%s) -lt $end ] || return 1; sleep 2; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
# kick_apiserver: kube-apiserver kẹt trong back-off của CrashLoopBackOff (tới 5 phút) dù etcd đã lên. Bộ đếm back-off chỉ
# nằm trong bộ nhớ của kubelet: `systemctl restart kubelet` xoá nó, kubelet thử lại apiserver ngay; container đang chạy
# không bị khởi động lại (đo, cả cka-cp lẫn cka-w2). Đo sau ≥ 6 phút hỏng, tính từ lúc cài lại manifest etcd tốt: chỉ chờ
# /readyz 310 giây; dời manifest apiserver ra, chờ kubelet bỏ hẳn Pod (49 giây) rồi đưa lại 71 giây; restart kubelet
# 51 giây.
kick_apiserver() {
  sudo systemctl restart kubelet
}
live_new() {
  local id
  id=$(sudo crictl ps -q --name '^etcd$' --state running 2>/dev/null | head -1)
  [ -n "$id" ] && sudo crictl inspect "$id" 2>/dev/null | python3 -c '
import json, sys
d = json.load(sys.stdin); c = d["info"].get("config") or {}; a = (c.get("command") or []) + (c.get("args") or [])
dd = next(x.split("=", 1)[1] for x in a if x.startswith("--data-dir="))
sys.exit(0 if any(m["containerPath"] == dd and m["hostPath"] == sys.argv[1] for m in d["status"]["mounts"]) else 1)' "$NEW" &&
    ec endpoint health >/dev/null 2>&1
}

# Lần trước bị ngắt giữa lúc kick_apiserver (manifest đang ở $OFF): đưa lại trước (như s44).
if sudo test -f $OFF/kube-apiserver.yaml && ! sudo test -f $MAN/kube-apiserver.yaml; then log "đưa lại kube-apiserver.yaml từ $OFF (lần trước bị ngắt)"; sudo mv $OFF/kube-apiserver.yaml $MAN/; fi
sudo rm -f /root/.lab/st8-ops/active   # dấu của bản trước; không còn dùng
log "1. kubectl"
k get node 2>&1 | tail -1 || true
log "2. kubelet trên cka-cp"
systemctl is-active kubelet
sudo journalctl -u kubelet --since -3min --no-pager 2>/dev/null | grep -E 'etcd-cka-cp|hostPath' | tail -2 | cut -c1-300 || true
log "3. crictl: container control plane (cả container đã dừng)"
sudo crictl ps -a --name '^(etcd|kube-apiserver)$' | head -5
id=$(sudo crictl ps -a -q --name '^etcd$' | head -1)
[ -n "$id" ] && { sudo crictl logs --tail 2 "$id" 2>&1 | cut -c1-300; sudo crictl inspect "$id" | python3 -c '
import json, sys
d = json.load(sys.stdin)
print("mounts:", [(m["containerPath"], m["hostPath"]) for m in d["status"]["mounts"] if "etcd" in m["containerPath"]])'; } || true
log "4. manifest etcd: --data-dir, volumeMounts, volumes"
sudo grep -nE -e '--data-dir|mountPath|path:|type:|name: etcd' $MAN/etcd.yaml
log "5. sửa volume etcd-data: hostPath về $NEW, type DirectoryOrCreate"
t=$(mktemp)
sudo cat $MAN/etcd.yaml | python3 -c '
import re, sys
new = sys.argv[1]; L = sys.stdin.read().split("\n")
for i, l in enumerate(L):
    if l.strip() == "name: etcd-data" and not (i and "mountPath" in L[i - 1]):
        j = i - 1
        while j > 0 and "hostPath:" not in L[j]:
            if re.match(r"^\s*path: ", L[j]): L[j] = re.sub(r"path: .*", "path: " + new, L[j])
            if re.match(r"^\s*type: ", L[j]): L[j] = re.sub(r"type: .*", "type: DirectoryOrCreate", L[j])
            j -= 1
sys.stdout.write("\n".join(L))' "$NEW" > "$t"
if sudo test -f $GOOD && ! sudo cmp -s "$t" $GOOD; then
  log "   bản sửa khác bản manifest trước sự cố: cài đúng bản đó"
  sudo diff "$t" $GOOD || true
  sudo cp $GOOD "$t"
fi
sudo cmp -s "$t" $MAN/etcd.yaml || sudo install -m 0600 -o root -g root "$t" $MAN/etcd.yaml
rm -f "$t"
sudo grep -nE -e '--data-dir|mountPath|path:|type:' $MAN/etcd.yaml | grep -E 'etcd-restore|File|Directory' | head -6
log "6. chờ etcd chạy từ $NEW"
s=$(date +%s)
until_t 180 live_new || die "etcd chưa chạy từ $NEW sau 3 phút: sudo crictl ps -a --name etcd, sudo crictl logs <id>"
log "   etcd healthy sau $(($(date +%s) - s)) giây"
ec endpoint health
ec endpoint status -w table
# kube-apiserver nằm trong CrashLoopBackOff suốt lúc etcd vắng (kubelet chờ tới 5 phút giữa hai lần thử): chưa /readyz
# sau 60 giây thì kick_apiserver (cách đã đo, xem hàm).
until_t 60 readyz || { log "   apiserver chưa /readyz sau 60 giây (CrashLoopBackOff)"; kick_apiserver; }
until_t 300 readyz || die "apiserver chưa /readyz sau 5 phút"
log "   apiserver /readyz sau $(($(date +%s) - s)) giây"
# /readyz vừa ok mà apiserver còn chậm (đo, lần chạy thứ hai khi máy chủ tải cao: `k get node` hết 5 giây ngay sau /readyz):
# không coi là lỗi của lời giải; verify chờ có giới hạn riêng.
k get node || true
