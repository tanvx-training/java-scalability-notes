# s42 — các bước trên một node của trang "Upgrading kubeadm clusters" (lời giải; apply.sh gửi qua `vm` sau khi đặt STEP và
# PKG). Chạy bằng user ubuntu, lệnh cần root dùng sudo. Mỗi bước chạy lại được: gói đã đúng bản thì apt không làm gì.
#   STEP=repo     trỏ /etc/apt/sources.list.d/kubernetes.list sang minor của PKG, apt-get update
#   STEP=kubeadm  unhold kubeadm, cài kubeadm=$PKG, hold lại
#   STEP=kubelet  unhold kubelet kubectl, cài bản $PKG, hold lại, daemon-reload, restart kubelet
set -e
# Khoá dpkg: apt_get / apt_mark của files/aptlock.sh (bên gửi ghép tệp đó lên trước tệp này). unattended-upgrade có thể
# giữ khoá ngay sau khi VM bật lại (đo 2026-11-24, s42 trong selftest); thiếu aptlock.sh thì dừng, không đổi gì.
command -v apt_mark >/dev/null 2>&1 || { echo "lab: node.sh cần files/aptlock.sh ghép phía trước" >&2; exit 2; }
minor="v$(echo "$PKG" | cut -d. -f1-2)"   # 1.37.2-1.1 → v1.37
case "$STEP" in
  repo)
    sudo sed -i -E "s#/core:/stable:/v[0-9]+\.[0-9]+/deb/#/core:/stable:/$minor/deb/#" /etc/apt/sources.list.d/kubernetes.list
    cat /etc/apt/sources.list.d/kubernetes.list
    apt_get update -qq -o Dpkg::Use-Pty=0 >/dev/null
    apt-cache madison kubeadm | head -3
    ;;
  kubeadm)
    apt_mark unhold kubeadm
    apt_get install -y -qq -o Dpkg::Use-Pty=0 "kubeadm=$PKG" >/dev/null
    apt_mark hold kubeadm
    kubeadm version -o short
    ;;
  kubelet)
    apt_mark unhold kubelet kubectl
    apt_get install -y -qq -o Dpkg::Use-Pty=0 "kubelet=$PKG" "kubectl=$PKG" >/dev/null
    apt_mark hold kubelet kubectl
    sudo systemctl daemon-reload
    sudo systemctl restart kubelet
    kubelet --version
    ;;
  *) echo "STEP lạ: $STEP" >&2; exit 2 ;;
esac
