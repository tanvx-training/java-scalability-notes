# st9-etcd trên cka-cp (user ubuntu, sudo; crictl, etcdctl, openssl, python3 + PyYAML). Gọi bởi run.sh cùng thư mục; chú thích
# ở đó. Không gọi kubectl để đưa về bản tốt (chạy được khi apiserver đang hỏng từ lần trước): chỉ tệp, crictl, etcdctl, /readyz.
# Không in gì khi thành công, trừ một dòng `lab: đã dời …` ra stderr khi phải dời tệp thừa của bạn khỏi manifests/; lỗi đầu
# vào thì một dòng `lab: …` ra stderr và trả 1 trước khi gây gì. KHÔNG BAO GIỜ đụng etcd.yaml, dữ liệu etcd hay ca.key.
set -e
H=/root/.lab/st9-etcd
MAN=/etc/kubernetes/manifests
PKI=/etc/kubernetes/pki
E=$PKI/etcd
miss() { echo "lab: $1; thử: ./labs/lab restore cka s49" >&2; exit 1; }
fail() { echo "lab: không gây được sự cố st9-etcd (bước $1); chạy lại ./labs/lab begin cka s50, vẫn lỗi thì ./labs/lab restore cka s49" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
etcdctl_() { sudo timeout 10 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$E/ca.crt --cert=$E/server.crt \
  --key=$E/server.key --command-timeout=5s "$@"; }
etcd_ok() { etcdctl_ endpoint health >/dev/null 2>&1; }
readyz() { [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; }
api_id() { sudo crictl ps -q --name '^kube-apiserver$' --state running 2>/dev/null | head -n1; }
fp() { openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2; }

# 0. Đầu vào: etcd phục vụ (sự cố này không đụng etcd; etcd hỏng là trạng thái khác, không gây gì).
until_t 240 etcd_ok || miss "etcd trên cka-cp không phục vụ sau 4 phút (sự cố này không đụng etcd)"
sudo install -d -m 700 $H

# 1. Tệp thừa trong manifests/ (kubelet chạy MỌI tệp không bắt đầu bằng dấu chấm, kể cả *.bak): dời sang ~/drills/s50/stray/.
for f in $(sudo find $MAN -mindepth 1 -maxdepth 1 ! -name '.*' -printf '%f\n'); do
  case "$f" in etcd.yaml|kube-apiserver.yaml|kube-scheduler.yaml|kube-controller-manager.yaml) continue ;; esac
  mkdir -p ~/drills/s50/stray
  sudo mv "$MAN/$f" ~/drills/s50/stray/
  sudo chown -R "$(id -u):$(id -g)" ~/drills/s50/stray
  echo "lab: đã dời $MAN/$f sang ~/drills/s50/stray/ (tệp thừa từ lần trước)" >&2
done

# 2. Bản tốt của kube-apiserver.yaml: lưu lần đầu (chỉ khi apiserver đang khoẻ), các lần sau cài lại nếu khác. Manifest đổi
# là Pod mới, không chờ back-off: /readyz 16–18 giây (đo). Kẹt quá 150 giây thì restart kubelet (xoá back-off, như s45).
if ! sudo test -s $H/kube-apiserver.yaml; then
  until_t 120 readyz || miss "apiserver chưa /readyz và chưa có bản lưu của sự cố"
  sudo cat $MAN/kube-apiserver.yaml | python3 -c '
import sys
s = sys.stdin.read()
for want in ("- --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt\n", "- --etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt\n",
             "- --etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key\n"):
    assert s.count(want) == 1, want' || miss "ba cờ --etcd-* của kube-apiserver.yaml không như kubeadm tạo"
  sudo install -m 600 -o root -g root $MAN/kube-apiserver.yaml $H/kube-apiserver.yaml
elif ! sudo cmp -s $H/kube-apiserver.yaml $MAN/kube-apiserver.yaml; then
  sudo install -m 600 -o root -g root $H/kube-apiserver.yaml $MAN/kube-apiserver.yaml
fi
until_t 150 readyz || { sudo systemctl restart kubelet; until_t 180 readyz || fail 1; }

# 3. Bản tốt của ~/ops.kubeconfig và ~/users/ops.crt (cuối s34–s49): lưu lần đầu, khi cert nhúng còn hạn và do CA cluster ký.
# $H/seen: sha256 của mọi cert ops có từ trước sự cố (bản gốc và mọi cert hết hạn đã gây) — verify đòi cert mới.
if ! sudo test -s $H/ops.kubeconfig; then
  [ -s ~/ops.kubeconfig ] && [ -s ~/users/ops.key ] && [ -s ~/users/ops.crt ] || miss "thiếu ~/ops.kubeconfig hay ~/users/ops.{key,crt} (s33–s34)"
  d=$(mktemp -d)
  kubectl config view --raw --kubeconfig ~/ops.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d > "$d/c.pem" 2>/dev/null || true
  ok=0
  openssl verify -CAfile $PKI/ca.crt "$d/c.pem" >/dev/null 2>&1 &&
    [ "$(openssl x509 -in "$d/c.pem" -noout -subject -nameopt RFC2253 2>/dev/null | tr ',' '\n' | sed 's/^subject=//' | sort | tr '\n' ' ')" = "CN=ops O=shop-ops " ] && ok=1
  { fp < "$d/c.pem"; fp < ~/users/ops.crt; } | grep . | sort -u | sudo tee $H/seen >/dev/null
  rm -rf "$d"
  [ $ok = 1 ] || miss "~/ops.kubeconfig chưa nhúng cert ops còn hạn do CA cluster ký (như cuối s34)"
  sudo install -m 600 -o root -g root ~/ops.kubeconfig $H/ops.kubeconfig
  sudo install -m 600 -o root -g root ~/users/ops.crt $H/users-ops.crt
fi

# 4. Mốc: lúc gây, revision và raft index của etcd (verify: không lùi; khôi phục snapshot cũ là lùi dữ liệu).
st=$(etcdctl_ endpoint status -w json) || fail 2
printf '%s' "$st" | python3 -c 'import json,sys; s=json.load(sys.stdin)[0]["Status"]; print(s["header"]["revision"]); print(s["raftIndex"])' > /tmp/lab-st9-etcd.rev || fail 2
sudo sh -c "sed -n 1p /tmp/lab-st9-etcd.rev > $H/rev; sed -n 2p /tmp/lab-st9-etcd.rev > $H/raft; date +%s > $H/started"
rm -f /tmp/lab-st9-etcd.rev

# 5. Cert ops hết hạn: cùng key ~/users/ops.key, CN=ops O=shop-ops, client auth, do CA cluster ký (`openssl ca` với -startdate,
# -enddate trong quá khứ: OpenSSL 3.0 của Ubuntu 24.04 không có -not_after cho `x509`, đo), serial ngẫu nhiên, hết hạn 1–3 ngày
# trước. Ghi đè ~/users/ops.crt và nhúng vào ~/ops.kubeconfig dựng lại từ bản tốt (cluster, context như cũ).
d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
mkdir -p "$d/new"; : > "$d/index.txt"; openssl rand -hex 16 | sed 's/^[89a-f]/7/' > "$d/serial"
cat > "$d/ca.cnf" <<EOF
[ ca ]
default_ca = lab
[ lab ]
dir = $d
database = $d/index.txt
new_certs_dir = $d/new
serial = $d/serial
default_md = sha256
policy = any
unique_subject = no
copy_extensions = none
[ any ]
organizationName = supplied
commonName = supplied
[ ext ]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = clientAuth
authorityKeyIdentifier = keyid
EOF
openssl req -new -key ~/users/ops.key -subj "/O=shop-ops/CN=ops" -out "$d/ops.csr" 2>/dev/null || fail 3
start=$(date -u -d "-$((30 + RANDOM % 20)) days" +%Y%m%d%H%M%SZ)
end=$(date -u -d "-$((1 + RANDOM % 3)) days -$((RANDOM % 3600)) seconds" +%Y%m%d%H%M%SZ)
sudo openssl ca -batch -config "$d/ca.cnf" -cert $PKI/ca.crt -keyfile $PKI/ca.key -in "$d/ops.csr" -out "$d/ops.crt" \
  -startdate "$start" -enddate "$end" -extensions ext -notext -preserveDN >/dev/null 2>&1 || fail 3
sudo chown "$(id -u):$(id -g)" "$d/ops.crt"
openssl x509 -in "$d/ops.crt" -noout -checkend 0 >/dev/null 2>&1 && fail 3
fp < "$d/ops.crt" | sudo tee -a $H/seen >/dev/null
sudo cat $H/ops.kubeconfig | python3 -c '
import base64, sys, yaml
c = yaml.safe_load(sys.stdin)
u = c["users"][0]["user"]
u.pop("client-certificate", None); u.pop("client-key", None)
u["client-certificate-data"] = base64.b64encode(open(sys.argv[1], "rb").read()).decode()
u["client-key-data"] = base64.b64encode(open(sys.argv[2], "rb").read()).decode()
sys.stdout.write(yaml.safe_dump(c, default_flow_style=False))' "$d/ops.crt" ~/users/ops.key > "$d/ops.kubeconfig" || fail 3
install -m 600 "$d/ops.kubeconfig" ~/ops.kubeconfig
install -m 664 "$d/ops.crt" ~/users/ops.crt

# 6. kube-apiserver.yaml: cờ TLS tới etcd trỏ tệp của CA khác trong pki/ (mỗi lần begin chọn một trong bốn; ghi cờ đã đổi ở
# $H/flag). etcd, etcd.yaml và các tệp trong pki/ không đổi.
case $((RANDOM % 4)) in
  0) flag="etcd-cafile"; from="etcd-cafile=$E/ca.crt"; to="etcd-cafile=$PKI/ca.crt" ;;
  1) flag="etcd-cafile"; from="etcd-cafile=$E/ca.crt"; to="etcd-cafile=$PKI/front-proxy-ca.crt" ;;
  2) flag="etcd-certfile etcd-keyfile"; from="apiserver-etcd-client."; to="apiserver-kubelet-client." ;;
  *) flag="etcd-certfile etcd-keyfile"; from="apiserver-etcd-client."; to="front-proxy-client." ;;
esac
sudo cat $H/kube-apiserver.yaml | python3 -c '
import sys
s, a, b = sys.stdin.read(), sys.argv[1], sys.argv[2]
n = 1 if a.startswith("etcd-cafile") else 2
assert s.count(a) == n, a
sys.stdout.write(s.replace(a, b))' "$from" "$to" > "$d/kube-apiserver.yaml" || fail 4
echo "$flag" | sudo tee $H/flag >/dev/null
old=$(api_id)
sudo install -m 600 -o root -g root "$d/kube-apiserver.yaml" $MAN/kube-apiserver.yaml
# Container cũ bị thay; container mới không nối được etcd, thoát sau ~20 giây (`etcd grpc connection not ready`, đo).
down() { ! readyz && [ "$(api_id)" != "$old" ]; }
until_t 120 down || fail 5
