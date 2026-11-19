# s43 — cài etcdctl và etcdutl lên cka-cp (chạy bằng user ubuntu, sudo), như máy thi có sẵn hai lệnh này trên node control
# plane. Bản ghim: v3.7.0, đúng bản server của image registry.k8s.io/etcd:3.7.0-0 mà kubeadm 1.37.2 chạy (đọc từ
# /etc/kubernetes/manifests/etcd.yaml). Nguồn: https://github.com/etcd-io/etcd/releases/tag/v3.7.0, tệp
# etcd-v3.7.0-linux-arm64.tar.gz, sha256 lấy từ SHA256SUMS của chính release đó (đọc 2026-11-20). Đã có đúng bản thì bỏ qua;
# sha256 sai thì dừng, không cài. Không đụng tới etcd đang chạy (binary `etcd` trong tarball không được cài).
set -e
V=3.7.0
SHA=e61a0954fe6a3003ee20f45e773e12e15c58323ea485deb8a55d065170cdafe8
have() { "/usr/local/bin/$1" version 2>/dev/null | grep -q "^$1 version: $V\$"; }
if have etcdctl && have etcdutl; then echo "etcdctl, etcdutl $V đã có trong /usr/local/bin"; exit 0; fi
d="$(mktemp -d)"
trap 'rm -rf "$d"' EXIT
curl -fsSL --retry 3 --max-time 180 -o "$d/etcd.tgz" "https://github.com/etcd-io/etcd/releases/download/v$V/etcd-v$V-linux-arm64.tar.gz"
echo "$SHA  $d/etcd.tgz" | sha256sum -c --quiet || { echo "sha256 của etcd-v$V-linux-arm64.tar.gz không khớp, không cài" >&2; exit 1; }
tar -xzf "$d/etcd.tgz" -C "$d" --strip-components=1 "etcd-v$V-linux-arm64/etcdctl" "etcd-v$V-linux-arm64/etcdutl"
sudo install -m 0755 "$d/etcdctl" "$d/etcdutl" /usr/local/bin/
etcdctl version | head -1; etcdutl version | head -1
