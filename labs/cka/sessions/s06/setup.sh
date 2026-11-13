# s06 — đặt bài: mỗi node có một swapfile 512 MiB đang bật và khai trong /etc/fstab (như máy chủ Ubuntu cài thường),
# để việc "tắt swap, cả fstab" là việc thật (VM Multipass mặc định không có swap). Chạy bởi `./labs/lab begin cka s06`.
# Dòng fstab dùng TAB như bộ cài Ubuntu ghi (/swap.img<TAB>none<TAB>swap<TAB>sw<TAB>0<TAB>0).
# Không đụng node đã cài kubelet (đang làm dở hoặc đã xong). Chạy lại `begin` trên node chưa cài kubelet mà dòng swap
# đã bị chú thích thì thêm một dòng swap mới đang bật: coi như đặt lại bài, có chủ ý.
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
grep -q \"^/swap.img\" /etc/fstab || printf \"/swap.img\\tnone\\tswap\\tsw\\t0\\t0\\n\" >> /etc/fstab'"
  echo "s06: $v có swap /swap.img (512 MiB, khai trong /etc/fstab)"
done
