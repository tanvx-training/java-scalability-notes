#!/bin/bash
# Chạy trong VM bằng root: repo pkgs.k8s.io đúng minor, containerd + cri-tools, /etc/crictl.yaml.
# Cách dùng: sudo bash install-containerd.sh <minor, vd. 1.36>
set -euo pipefail
minor="$1"
export DEBIAN_FRONTEND=noninteractive
install -d -m 755 /etc/apt/keyrings
if [ ! -s /etc/apt/keyrings/kubernetes-apt-keyring.gpg ]; then
  curl -fsSL "https://pkgs.k8s.io/core:/stable:/v$minor/deb/Release.key" \
    | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
fi
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v$minor/deb/ /" \
  > /etc/apt/sources.list.d/kubernetes.list
apt-get -o DPkg::Lock::Timeout=300 update -q >/dev/null
apt-get -o DPkg::Lock::Timeout=300 install -y -q containerd cri-tools >/dev/null
systemctl enable --now containerd >/dev/null 2>&1
cat > /etc/crictl.yaml <<'CONF'
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
CONF
