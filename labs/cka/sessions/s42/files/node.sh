# s42 — các bước trên một node của trang "Upgrading kubeadm clusters" (lời giải; apply.sh gửi qua `vm` sau khi đặt STEP và
# PKG). Chạy bằng user ubuntu, lệnh cần root dùng sudo. Mỗi bước chạy lại được: gói đã đúng bản thì apt không làm gì.
#   STEP=repo     trỏ /etc/apt/sources.list.d/kubernetes.list sang minor của PKG, apt-get update
#   STEP=kubeadm  unhold kubeadm, cài kubeadm=$PKG, hold lại
#   STEP=kubelet  unhold kubelet kubectl, cài bản $PKG, hold lại, daemon-reload, restart kubelet
set -e
# apt-daily-upgrade.timer của Ubuntu có thể chạy unattended-upgrade đúng lúc này (đo 2026-11-24 trên cka-cp, sau khi VM bật
# lại: `dpkg frontend lock was locked by another process`, apt-mark mã 100). apt-get chờ khoá bằng DPkg::Lock::Timeout;
# apt-mark không có tuỳ chọn đó nên thử lại khi lỗi là khoá dpkg, tối đa 10 phút.
LOCKWAIT=600
apt_get() { sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=$LOCKWAIT "$@"; }
apt_mark() {
  local t=0 err
  until err="$(sudo apt-mark "$@" 2>&1 >/dev/null)"; do
    case "$err" in *lock*) ;; *) echo "$err" >&2; return 1 ;; esac
    [ "$t" -ge "$LOCKWAIT" ] && { echo "lab: khoá dpkg bị giữ quá $LOCKWAIT giây (unattended-upgrade?), thử lại sau" >&2; return 1; }
    [ "$t" -eq 0 ] && echo "khoá dpkg đang bị giữ (thường là unattended-upgrade), chờ tối đa $LOCKWAIT giây" >&2
    sleep 5; t=$((t+5))
  done
}
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
