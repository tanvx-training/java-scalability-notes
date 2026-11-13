#!/bin/bash
# Chạy trong VM bằng root: chuẩn bị một node cho kubeadm theo trang "Installing kubeadm".
# Cách dùng: sudo bash prepare-node.sh <minor, vd. 1.36>
# Chạy lại nhiều lần được.
set -euo pipefail
minor="$1"
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a NEEDRESTART_SUSPEND=1

# 1. Swap: tắt ngay và chú thích mọi dòng swap trong fstab (bền qua reboot)
swapoff -a
sed -i -E '/^[^#].*[[:space:]]swap[[:space:]]/s/^/# (kubeadm) /' /etc/fstab

# 2. Module kernel: khai bền rồi nạp ngay
cat > /etc/modules-load.d/k8s.conf <<'CONF'
overlay
br_netfilter
CONF
modprobe overlay
modprobe br_netfilter

# 3. Ba sysctl mạng: khai bền rồi áp ngay
cat > /etc/sysctl.d/k8s.conf <<'CONF'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
CONF
sysctl --system >/dev/null

# 4. Repo pkgs.k8s.io đúng minor
install -d -m 755 /etc/apt/keyrings
if [ ! -s /etc/apt/keyrings/kubernetes-apt-keyring.gpg ]; then
  curl -fsSL "https://pkgs.k8s.io/core:/stable:/v$minor/deb/Release.key" \
    | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
fi
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v$minor/deb/ /" \
  > /etc/apt/sources.list.d/kubernetes.list
apt-get -o DPkg::Lock::Timeout=300 update -qq >/dev/null

# 5. containerd với SystemdCgroup = true
apt-get -o DPkg::Lock::Timeout=300 install -y -qq containerd >/dev/null
install -d -m 755 /etc/containerd
if [ ! -s /etc/containerd/config.toml ]; then
  containerd config default > /etc/containerd/config.toml
fi
sed -i -E 's/^([[:space:]]*SystemdCgroup[[:space:]]*=[[:space:]]*)false/\1true/' /etc/containerd/config.toml
grep -Eq '^[[:space:]]*SystemdCgroup[[:space:]]*=[[:space:]]*true' /etc/containerd/config.toml
systemctl enable containerd >/dev/null 2>&1
systemctl restart containerd
cat > /etc/crictl.yaml <<'CONF'
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
CONF

# 6. kubeadm, kubelet, kubectl đúng minor, hold cả ba. cri-tools (crictl) cài riêng: kubeadm 1.36 không kéo theo nó.
apt-mark unhold kubelet kubeadm kubectl >/dev/null 2>&1 || true
for p in kubelet kubeadm kubectl cri-tools; do
  dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q 'ok installed' \
    || apt-get -o DPkg::Lock::Timeout=300 install -y -qq "$p" >/dev/null
done
apt-mark hold kubelet kubeadm kubectl >/dev/null
systemctl enable kubelet >/dev/null 2>&1
