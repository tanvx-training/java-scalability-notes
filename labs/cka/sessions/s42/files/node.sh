# s42 — các bước trên một node của trang "Upgrading kubeadm clusters" (lời giải; apply.sh gửi qua `vm` sau khi đặt STEP và
# PKG). Chạy bằng user ubuntu, lệnh cần root dùng sudo. Mỗi bước chạy lại được: gói đã đúng bản thì apt không làm gì.
#   STEP=repo     trỏ /etc/apt/sources.list.d/kubernetes.list sang minor của PKG, apt-get update
#   STEP=kubeadm  unhold kubeadm, cài kubeadm=$PKG, hold lại
#   STEP=kubelet  unhold kubelet kubectl, cài bản $PKG, hold lại, daemon-reload, restart kubelet
set -e
minor="v$(echo "$PKG" | cut -d. -f1-2)"   # 1.37.2-1.1 → v1.37
case "$STEP" in
  repo)
    sudo sed -i -E "s#/core:/stable:/v[0-9]+\.[0-9]+/deb/#/core:/stable:/$minor/deb/#" /etc/apt/sources.list.d/kubernetes.list
    cat /etc/apt/sources.list.d/kubernetes.list
    sudo apt-get update -qq -o Dpkg::Use-Pty=0 >/dev/null
    apt-cache madison kubeadm | head -3
    ;;
  kubeadm)
    sudo apt-mark unhold kubeadm >/dev/null
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Use-Pty=0 "kubeadm=$PKG" >/dev/null
    sudo apt-mark hold kubeadm >/dev/null
    kubeadm version -o short
    ;;
  kubelet)
    sudo apt-mark unhold kubelet kubectl >/dev/null
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Use-Pty=0 "kubelet=$PKG" "kubectl=$PKG" >/dev/null
    sudo apt-mark hold kubelet kubectl >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl restart kubelet
    kubelet --version
    ;;
  *) echo "STEP lạ: $STEP" >&2; exit 2 ;;
esac
