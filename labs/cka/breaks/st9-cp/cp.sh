# st9-cp trên cka-cp (user ubuntu, sudo; crictl, etcdctl, python3 + PyYAML). Gọi bởi run.sh cùng thư mục; chú thích ở đó.
# Không gọi kubectl để đưa về bản tốt (chạy được khi apiserver đang hỏng từ lần trước): chỉ tệp, crictl, etcdctl, /readyz.
# Không in gì khi thành công, trừ một dòng `lab: đã dời …` ra stderr khi phải dời tệp thừa của bạn khỏi manifests/; lỗi đầu
# vào thì một dòng `lab: …` ra stderr và trả 1 trước khi gây gì. KHÔNG BAO GIỜ đụng etcd.yaml hay dữ liệu etcd.
set -e
H=/root/.lab/st9-cp
MAN=/etc/kubernetes/manifests
PKI=/etc/kubernetes/pki/etcd
CPS="kube-apiserver kube-scheduler kube-controller-manager"
# Cờ của kube-apiserver có thể bị gõ hỏng (mỗi lần begin chọn một; đều có trong manifest kubeadm của cka-cp).
FLAGS="authorization-mode service-cluster-ip-range etcd-servers client-ca-file secure-port service-account-issuer"
miss() { echo "lab: $1; thử: ./labs/lab restore cka s48" >&2; exit 1; }
fail() { echo "lab: không gây được sự cố st9-cp (bước $1); chạy lại ./labs/lab begin cka s49, vẫn lỗi thì ./labs/lab restore cka s48" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
etcd_ok() { sudo timeout 8 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt \
  --key=$PKI/server.key --command-timeout=3s endpoint health >/dev/null 2>&1; }
readyz() { [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; }
# cp_up: mỗi thành phần đúng một container đang chạy, chạy liền ≥ 25 giây (controller-manager chỉ thoát sau khi giành được
# leader lease, ~20 giây sau khi khởi động: đo), và apiserver /readyz.
cp_up() {
  local c id n
  for c in $CPS; do
    id=$(sudo crictl ps -q --name "^$c\$" --state running 2>/dev/null)
    n=$(printf '%s\n' "$id" | grep -c .)
    [ "$n" = 1 ] || return 1
    sudo crictl inspect "$id" 2>/dev/null | python3 -c '
import datetime, json, re, sys
s = json.load(sys.stdin)["status"]["startedAt"]          # vd. 2026-11-25T01:05:47.255804669+07:00 (đo)
m = re.match(r"^([^.]+)(\.\d+)?(Z|[+-]\d\d:\d\d)$", s)
t = datetime.datetime.fromisoformat(m.group(1) + (m.group(2) or "")[:7] + m.group(3).replace("Z", "+00:00"))
sys.exit(0 if (datetime.datetime.now(datetime.timezone.utc) - t).total_seconds() >= 25 else 1)' || return 1
  done
  readyz
}
api_down() { ! readyz && [ -z "$(sudo crictl ps -q --name '^kube-apiserver$' --state running 2>/dev/null)" ]; }

# 0. Đầu vào: etcd phục vụ (sự cố này không đụng etcd; etcd hỏng là trạng thái khác, không gây gì).
until_t 240 etcd_ok || miss "etcd trên cka-cp không phục vụ sau 4 phút (sự cố này không đụng etcd)"
sudo install -d -m 700 $H

# 1. Tệp thừa trong manifests/ (kubelet chạy MỌI tệp không bắt đầu bằng dấu chấm, kể cả *.bak): dời sang ~/drills/s49/stray/.
for f in $(sudo find $MAN -mindepth 1 -maxdepth 1 ! -name '.*' -printf '%f\n'); do
  case "$f" in etcd.yaml|kube-apiserver.yaml|kube-scheduler.yaml|kube-controller-manager.yaml) continue ;; esac
  mkdir -p ~/drills/s49/stray
  sudo mv "$MAN/$f" ~/drills/s49/stray/
  sudo chown -R "$(id -u):$(id -g)" ~/drills/s49/stray
  echo "lab: đã dời $MAN/$f sang ~/drills/s49/stray/ (tệp thừa từ lần trước)" >&2
done

# 2. Bản tốt: lưu lần đầu (chỉ khi control plane đang khoẻ), các lần sau cài lại tệp nào khác bản lưu.
changed=0
for c in $CPS; do
  if ! sudo test -s $H/$c.yaml; then
    sudo test -s $MAN/$c.yaml || miss "thiếu $MAN/$c.yaml"
    until_t 120 cp_up || miss "control plane chưa khoẻ (apiserver, scheduler, controller-manager) và chưa có bản lưu"
    sudo install -m 600 -o root -g root $MAN/$c.yaml $H/$c.yaml
  elif ! sudo cmp -s $H/$c.yaml $MAN/$c.yaml; then
    sudo install -m 600 -o root -g root $H/$c.yaml $MAN/$c.yaml
    changed=1
  fi
done
# kubelet nạp lại manifest sau ≤ 20 giây; manifest đổi là Pod mới (không chờ back-off): đo apiserver /readyz 17 giây,
# scheduler và controller-manager Running 24 giây. Kẹt quá 2 phút thì restart kubelet (xoá bộ đếm back-off, như s45).
if [ $changed = 1 ] || ! cp_up; then
  until_t 120 cp_up || { sudo systemctl restart kubelet; until_t 180 cp_up || fail 1; }
fi

# 3. Gây lại: một cờ apiserver có NBSP (U+00A0) chen trước dấu =, scheduler trỏ kubeconfig không có, controller-manager trỏ
# root CA không có. Ghi mốc trước khi cài: cờ ($H/flag) và sha256 ba bản hỏng ($H/broken.sha256, dạng sha256sum).
set -- $FLAGS
shift $((RANDOM % $#))
flag=$1
d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
sudo cat $H/kube-apiserver.yaml | python3 -c '
import sys
s, f = sys.stdin.read(), sys.argv[1]
old = f"- --{f}="
assert s.count(old) == 1, f
sys.stdout.write(s.replace(old, f"- --{f} =", 1))' "$flag" > "$d/kube-apiserver.yaml" || fail 2
sudo cat $H/kube-scheduler.yaml | python3 -c '
import sys
s = sys.stdin.read(); old = "- --kubeconfig=/etc/kubernetes/scheduler.conf\n"
assert s.count(old) == 1
sys.stdout.write(s.replace(old, "- --kubeconfig=/etc/kubernetes/scheduler.config\n"))' > "$d/kube-scheduler.yaml" || fail 2
sudo cat $H/kube-controller-manager.yaml | python3 -c '
import sys
s = sys.stdin.read(); old = "- --root-ca-file=/etc/kubernetes/pki/ca.crt\n"
assert s.count(old) == 1
sys.stdout.write(s.replace(old, "- --root-ca-file=/etc/kubernetes/pki/ca.cert\n"))' > "$d/kube-controller-manager.yaml" || fail 2
(cd "$d" && sha256sum kube-apiserver.yaml kube-scheduler.yaml kube-controller-manager.yaml) | sudo tee $H/broken.sha256 >/dev/null
echo "$flag" | sudo tee $H/flag >/dev/null
for c in kube-scheduler kube-controller-manager kube-apiserver; do sudo install -m 600 -o root -g root "$d/$c.yaml" $MAN/$c.yaml; done
until_t 120 api_down || fail 3
