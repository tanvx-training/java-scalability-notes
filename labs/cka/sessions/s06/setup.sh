# s06 — đặt bài: mỗi node có một swapfile 512 MiB đang bật và khai trong /etc/fstab (như máy chủ Ubuntu cài thường),
# để việc "tắt swap, cả fstab" là việc thật (VM Multipass mặc định không có swap). Chạy bởi `./labs/lab begin cka s06`.
# Dòng fstab dùng TAB như bộ cài Ubuntu ghi (/swap.img<TAB>none<TAB>swap<TAB>sw<TAB>0<TAB>0).
# Không đụng node đã cài kubelet (đang làm dở hoặc đã xong). Chạy lại `begin` trên node chưa cài kubelet mà dòng swap
# đã bị chú thích thì thêm một dòng swap mới đang bật: coi như đặt lại bài, có chủ ý.
# Môi trường lab (không thuộc bài): bật net.ipv4.tcp_mtu_probing trên mọi node (files/node-net.sh), để kubeadm init ở s07 và
# các buổi sau kéo được image từ registry.k8s.io qua đường mạng có MTU nhỏ hơn 1500 (labs/cka/README.md, mục Mạng).
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
for v in $LAB_VMS; do
  vm "$v" "$(cat "$SESSION_DIR/files/node-net.sh")" || { echo "s06: $v: không bật được net.ipv4.tcp_mtu_probing" >&2; exit 1; }
done
echo "s06: đã bật net.ipv4.tcp_mtu_probing=1 trên mọi node (môi trường lab, không thuộc bài)"
