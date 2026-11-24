# Chờ khoá dpkg (dùng chung: s42/files/node.sh, breaks/st8-ops/kubelet.sh). Bên gửi ghép tệp này lên trước script chính
# trong cùng một lệnh `vm`, nên các hàm dưới có sẵn trên node.
# Vì sao: apt-daily-upgrade.timer của Ubuntu chạy unattended-upgrade sau khi VM bật lại; nó giữ khoá dpkg vài phút (đo
# 2026-11-24 trên cka-cp, selftest đợt 4: `dpkg frontend lock was locked by another process with pid 43545`, apt-mark
# mã 100). apt-get chờ được bằng DPkg::Lock::Timeout; apt-mark và dpkg -i không có tuỳ chọn đó nên thử lại khi lỗi là
# khoá, tối đa LOCKWAIT giây. Không bao giờ xoá tệp khoá.
#   LOCK_QUIET=1  không in gì (dùng trong sự cố: không được lộ đã làm gì); lỗi thì chỉ trả mã khác 0.
LOCKWAIT=${LOCKWAIT:-600}
apt_get() { sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=$LOCKWAIT "$@"; }
# sudo_lock <lệnh...>: sudo <lệnh>, bỏ stdout; lỗi khoá dpkg thì chờ 5 giây rồi thử lại, lỗi khác thì dừng ngay.
sudo_lock() {
  local t=0 err
  until err="$(sudo "$@" 2>&1 >/dev/null)"; do
    case "$err" in
      *lock*) ;;
      *) [ "${LOCK_QUIET:-}" = 1 ] || echo "$err" >&2; return 1 ;;
    esac
    if [ "$t" -ge "$LOCKWAIT" ]; then
      [ "${LOCK_QUIET:-}" = 1 ] || echo "lab: khoá dpkg bị giữ quá $LOCKWAIT giây (unattended-upgrade?), thử lại sau" >&2
      return 1
    fi
    [ "$t" -eq 0 ] && [ "${LOCK_QUIET:-}" != 1 ] && echo "khoá dpkg đang bị giữ (thường là unattended-upgrade), chờ tối đa $LOCKWAIT giây" >&2
    sleep 5; t=$((t+5))
  done
}
apt_mark() { sudo_lock apt-mark "$@"; }
