# Lỗi st1-node-notready: làm hỏng kubelet của hai worker theo hai cách khác nhau. Không in ra đã làm gì
# (đây là đề bài sự cố). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
w1=""; w2=""
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  if [ -z "$w1" ]; then w1="$v"; else w2="$v"; fi
done
vm "$w1" "sudo bash -euc '
printf \"KUBELET_EXTRA_ARGS=--config=/var/lib/kubelet/kubelet-config.yaml\n\" > /etc/default/kubelet
systemctl restart kubelet'" >/dev/null 2>&1
vm "$w2" "sudo bash -euc 'systemctl disable kubelet >/dev/null 2>&1; systemctl stop kubelet'" >/dev/null 2>&1
