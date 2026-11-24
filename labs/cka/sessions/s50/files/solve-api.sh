# s50 — lời giải, phần apiserver ↔ etcd, trên cka-cp (user ubuntu, sudo; crictl, etcdctl, openssl), gọi bởi apply.sh sau khi
# setup.sh đã gây sự cố st9-etcd. Đi đúng thứ tự của buổi: kubectl chết → crictl ps -a, crictl logs của container apiserver
# (dòng `createTransport failed … tls/x509`); etcd vẫn khoẻ (endpoint status -w table, health); ba cờ --etcd-* so với pki/
# (subject của --etcd-cafile phải là issuer của cert server etcd; issuer của --etcd-certfile phải là CA etcd; key khớp cert);
# sao lưu manifest ra ~/drills/s50/backup/ TRƯỚC khi sửa; sửa đúng dòng; chờ /readyz. Ghi ETCD_FLAG, ETCD_LEADER_ID,
# ETCD_VERSION vào ~/drills/s50/answers.env (solve-ops.sh thêm EXPIRED_KUBECONFIG). Chạy lại được.
set -e
MAN=/etc/kubernetes/manifests
PKI=/etc/kubernetes/pki
E=$PKI/etcd
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s50: $*"; }
die() { echo "s50: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
etcdctl_() { sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$E/ca.crt --cert=$E/server.crt --key=$E/server.key --command-timeout=5s "$@"; }
dn() { sudo openssl x509 -in "$1" -noout "-$2" -nameopt RFC2253 | sed "s/^$2=//"; }
mkdir -p ~/drills/s50

log "1. kubectl"
k get node 2>&1 | tail -n1 || true
log "2. một tầng xuống: crictl ps -a, crictl logs"
sudo crictl ps -a --name '^kube-apiserver$' | head -n4 | cut -c1-140
# Container mới in lỗi TLS ngay khi chạy, thoát sau ~20 giây; lấy dòng đầu từ container mới nhất có nó (≤ 90 giây).
e=""; end=$(($(date +%s) + 90))
until [ -n "$e" ]; do
  for id in $(sudo crictl ps -a -q --name '^kube-apiserver$'); do
    e=$(sudo crictl logs "$id" 2>&1 | grep -m1 'createTransport failed' || true)
    [ -z "$e" ] || break
  done
  [ -n "$e" ] || { [ "$(date +%s)" -lt "$end" ] || die "không thấy lỗi kết nối etcd trong log của apiserver"; sleep 3; }
done
echo "    crictl logs: …$(printf '%s' "$e" | sed 's/.*Err: //' | cut -c1-150)"
x=$(sudo crictl ps -a -q --name '^kube-apiserver$' --state exited | head -n1)
[ -z "$x" ] || echo "    container đã thoát: $(sudo crictl logs "$x" 2>&1 | grep -m1 '"command failed"' | cut -c1-150)"
log "3. etcd có khoẻ không? (không cần apiserver)"
etcdctl_ endpoint status -w table
etcdctl_ endpoint health
st=$(etcdctl_ endpoint status -w json)
lid=$(printf '%s' "$st" | python3 -c 'import json,sys; print("%x" % json.load(sys.stdin)[0]["Status"]["leader"])')
ver=$(printf '%s' "$st" | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["Status"]["version"])')
log "4. ba cờ --etcd-* so với pki/"
sudo grep -n -- '--etcd' $MAN/kube-apiserver.yaml
caf=$(sudo sed -n 's/^ *- --etcd-cafile=//p' $MAN/kube-apiserver.yaml)
crt=$(sudo sed -n 's/^ *- --etcd-certfile=//p' $MAN/kube-apiserver.yaml)
key=$(sudo sed -n 's/^ *- --etcd-keyfile=//p' $MAN/kube-apiserver.yaml)
want=$(dn $E/server.crt issuer)
echo "    issuer của cert server etcd ($E/server.crt): $want"
echo "    subject của --etcd-cafile ($caf): $(dn "$caf" subject)"
echo "    issuer của --etcd-certfile ($crt): $(dn "$crt" issuer)"
flags=""
[ "$(dn "$caf" subject)" = "$want" ] || flags="--etcd-cafile"
if [ "$(dn "$crt" issuer)" != "$want" ] ||
   [ "$(sudo openssl x509 -in "$crt" -noout -pubkey)" != "$(sudo openssl pkey -in "$key" -pubout)" ]; then
  flags="${flags:+$flags,}--etcd-certfile,--etcd-keyfile"
fi
[ -n "$flags" ] || die "ba cờ --etcd-* trông đúng, chưa nhận ra lỗi"
for f in $PKI/*.crt $E/*.crt; do printf '    %-45s issuer=%s\n' "$f" "$(dn "$f" issuer)"; done
log "5. sao lưu TRƯỚC khi sửa (ngoài manifests/), sửa đúng dòng"
mkdir -p ~/drills/s50/backup
sudo cp $MAN/kube-apiserver.yaml ~/drills/s50/backup/
sudo chown "$(id -u):$(id -g)" ~/drills/s50/backup/kube-apiserver.yaml
case "$flags" in *cafile*) sudo sed -i "s#- --etcd-cafile=.*#- --etcd-cafile=$E/ca.crt#" $MAN/kube-apiserver.yaml ;; esac
case "$flags" in *certfile*)
  sudo sed -i -e "s#- --etcd-certfile=.*#- --etcd-certfile=$PKI/apiserver-etcd-client.crt#" \
    -e "s#- --etcd-keyfile=.*#- --etcd-keyfile=$PKI/apiserver-etcd-client.key#" $MAN/kube-apiserver.yaml ;;
esac
sudo grep -n -- '--etcd' $MAN/kube-apiserver.yaml
t0=$(date +%s)
until_t 180 readyz || die "apiserver chưa /readyz sau 3 phút"
log "   /readyz ok sau $(($(date +%s) - t0)) giây"
k get --raw '/readyz?verbose' | grep -E 'etcd|readyz check'
# scheduler và controller-manager mất leader lease ~10 giây sau khi apiserver chết (`Leaderelection lost`, đo), thoát, và kubelet
# chạy lại chúng sau back-off; mirror pod có thể còn ghi Ready cũ. Chờ tới khi bốn static pod Ready VÀ container scheduler,
# controller-manager hiện tại đã chạy liền ≥ 40 giây, hai lần cách 15 giây, tối đa 6 phút.
cp_ok() { [ "$(k -n kube-system get pod -l tier=control-plane -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | grep -c '^True$')" = 4 ]; }
age() { sudo crictl inspect "$1" 2>/dev/null | python3 -c '
import datetime, json, re, sys
s = json.load(sys.stdin)["status"]["startedAt"]
m = re.match(r"^([^.]+)(\.\d+)?(Z|[+-]\d\d:\d\d)$", s)
t = datetime.datetime.fromisoformat(m.group(1) + (m.group(2) or "")[:7] + m.group(3).replace("Z", "+00:00"))
print(int((datetime.datetime.now(datetime.timezone.utc) - t).total_seconds()))' 2>/dev/null || echo 0; }
settled() {
  local c id
  cp_ok || return 1
  for c in kube-scheduler kube-controller-manager; do
    id=$(sudo crictl ps -q --name "^$c\$" --state running 2>/dev/null | head -n1)
    [ -n "$id" ] && [ "$(age "$id")" -ge 40 ] || return 1
  done
}
twice() { settled && sleep 15 && settled; }
until_t 360 twice || die "scheduler, controller-manager chưa ổn định sau 6 phút"
k -n kube-system get pod -l tier=control-plane
printf 'ETCD_FLAG=%s\nETCD_LEADER_ID=%s\nETCD_VERSION=%s\n' "$flags" "$lid" "$ver" > ~/drills/s50/answers.env
