# s06 — đặt bài: mỗi node có một swapfile 512 MiB đang bật và khai trong /etc/fstab (như máy chủ Ubuntu cài thường),
# để việc "tắt swap, cả fstab" là việc thật (VM Multipass mặc định không có swap). Chạy bởi `./labs/lab begin cka s06`.
# Không đụng node đã cài kubelet (đang làm dở hoặc đã xong).
for v in $LAB_VMS; do
  if vm "$v" "command -v kubelet >/dev/null"; then
    echo "s06: $v đã cài kubelet, không thêm swap"
    continue
  fi
  vm "$v" "sudo bash -euc '
if ! swapon --show=NAME --noheadings | grep -qx /swap.img; then
  [ -f /swap.img ] || { fallocate -l 512M /swap.img; chmod 600 /swap.img; mkswap /swap.img >/dev/null; }
  swapon /swap.img
fi
grep -q \"^/swap.img\" /etc/fstab || echo \"/swap.img none swap sw 0 0\" >> /etc/fstab'"
  echo "s06: $v có swap /swap.img (512 MiB, khai trong /etc/fstab)"
done
