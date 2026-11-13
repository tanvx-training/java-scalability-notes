# s06 — lời giải chuẩn: dọn container catalog (ctr) của s05 trên cka-cp; trên cả ba node tắt swap bền, nạp và khai
# overlay + br_netfilter, ba sysctl mạng, containerd SystemdCgroup = true, kubeadm/kubelet/kubectl đúng minor và hold;
# nạp image shop vào worker. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "sudo bash -c 'ns=\"ctr -n k8s.io\"
\$ns task kill -s SIGKILL catalog >/dev/null 2>&1 || true
for i in 1 2 3 4 5; do \$ns task ls -q 2>/dev/null | grep -qx catalog || break; sleep 1; done
\$ns task rm -f catalog >/dev/null 2>&1 || true
\$ns container rm catalog >/dev/null 2>&1 || true
! \$ns container ls -q | grep -qx catalog'"
for v in $LAB_VMS; do
  echo "s06: chuẩn bị $v"
  vm_put "$SESSION_DIR/files/prepare-node.sh" "$v" /tmp/s06-prepare.sh
  vm "$v" "sudo bash /tmp/s06-prepare.sh $K8S_INSTALL_MINOR && rm -f /tmp/s06-prepare.sh"
done
# Worker cần image shop cho các chặng sau (containerd vừa cài trên worker)
need=0
for v in $LAB_VMS; do
  vm "$v" "sudo ctr -n k8s.io images ls -q | grep -q 'shop/catalog:1.0'" || need=1
done
if [ "$need" -eq 1 ]; then
  # images_load gọi die (thoát) khi lỗi: chạy trong subshell để thử lại một lần nếu `multipass transfer` hỏng giữa chừng
  # (đã gặp thật: "ssh connection failed: Timeout connecting" khi chuyển tệp tar image vào worker).
  ( images_load ) || { echo "s06: nạp image lỗi, thử lại một lần"; ( images_load ); }
fi
