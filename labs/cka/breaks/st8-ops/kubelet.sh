# Phần chạy trên cka-w2 của lỗi st8-ops (run.sh gửi qua `vm`): "một đồng nghiệp hạ kubelet của cka-w2 về bản cũ sau nâng
# cấp" — gói kubelet về 1.36.6-1.1 và hold ở đó, kubelet khởi động lại bằng binary 1.36. Node vẫn Ready (kubelet được cũ hơn
# kube-apiserver tới ba minor). Không in gì khi thành công. Chạy bằng user ubuntu, sudo.
# Nguồn gói: repo apt của node đã trỏ v1.37 (s42) nên apt không thấy 1.36. Lấy đúng tệp .deb của repo v1.36 trên
# pkgs.k8s.io (`Filename: arm64/kubelet_1.36.6-1.1_arm64.deb`, SHA256 trong tệp Packages của repo đó, đọc 2026-11-20), kiểm
# sha256 rồi `dpkg -i`; không thêm nguồn apt nào (repo của node vẫn chỉ v1.37). Có sẵn đúng tệp trong /var/cache/apt/archives
# (sha256 khớp) thì dùng, không tải. Phụ thuộc của gói (kubernetes-cni ≥ 1.2.0, mount, util-linux) đã có từ s06.
# Chạy lại được: kubelet đã là 1.36.6-1.1 thì chỉ hold lại và đảm bảo kubelet đang chạy bản đó.
# Khoá dpkg: apt_mark / sudo_lock của sessions/s42/files/aptlock.sh (run.sh ghép tệp đó lên trước, LOCK_QUIET=1 để không
# in gì): unattended-upgrade có thể giữ khoá ngay sau khi VM bật lại; chờ tối đa 600 giây rồi mới báo lỗi.
set -e
command -v sudo_lock >/dev/null 2>&1 || { echo "lab: kubelet.sh cần sessions/s42/files/aptlock.sh ghép phía trước" >&2; exit 2; }
V=1.36.6-1.1
SHA=3bcb290c74e70068b782d8b4578fd3d64377c2f196d6ef50272c0e45c36934dc
URL="https://pkgs.k8s.io/core:/stable:/v1.36/deb/arm64/kubelet_${V}_arm64.deb"
fail() { echo "lab: không gây được sự cố st8-ops (bước 2/3${1:+: $1}); chạy lại ./labs/lab begin cka s45, vẫn lỗi thì ./labs/lab restore cka s44" >&2; exit 1; }
if [ "$(dpkg-query -W -f='${Version}' kubelet 2>/dev/null)" != "$V" ]; then
  d=$(mktemp -d)
  trap 'rm -rf "$d"' EXIT
  deb=/var/cache/apt/archives/kubelet_${V}_arm64.deb
  if ! { [ -f "$deb" ] && echo "$SHA  $deb" | sha256sum -c --quiet >/dev/null 2>&1; }; then
    deb="$d/kubelet.deb"
    curl -fsSL --retry 3 --max-time 180 -o "$deb" "$URL" 2>/dev/null || fail "không tải được gói (cka-w2 ra được mạng?)"
    echo "$SHA  $deb" | sha256sum -c --quiet >/dev/null 2>&1 || fail "sha256 của gói không khớp"
  fi
  apt_mark unhold kubelet || fail "apt-mark"
  sudo_lock DEBIAN_FRONTEND=noninteractive dpkg -i "$deb" || fail
fi
apt_mark hold kubelet || fail "apt-mark"
case "$(/usr/bin/kubelet --version 2>/dev/null)" in "Kubernetes v${V%%-*}") ;; *) fail ;; esac
# kubelet đang chạy phải là binary 1.36: tiến trình cũ vẫn chạy binary 1.37 tới khi khởi động lại (dpkg thay tệp, nên
# /proc/<pid>/exe của nó là "/usr/bin/kubelet (deleted)").
pid=$(systemctl show -p MainPID --value kubelet 2>/dev/null)
if [ -z "$pid" ] || [ "$pid" = 0 ] || [ "$(sudo readlink /proc/$pid/exe 2>/dev/null)" != /usr/bin/kubelet ]; then
  sudo systemctl daemon-reload
  sudo systemctl restart kubelet
fi
for i in $(seq 1 30); do [ "$(systemctl is-active kubelet)" = active ] && break; sleep 2; done
[ "$(systemctl is-active kubelet)" = active ] || fail "kubelet không chạy"
