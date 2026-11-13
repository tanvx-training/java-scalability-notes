# s05 — lời giải chuẩn trên cka-cp: repo Kubernetes K8S_INSTALL_MINOR, containerd + cri-tools, crictl.yaml,
# nạp image shop (như `./labs/lab images cka`), chạy catalog bằng ctr với mạng host.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm_put "$SESSION_DIR/files/install-containerd.sh" "$LAB_CP" /tmp/s05-install.sh
vm "$LAB_CP" "sudo bash /tmp/s05-install.sh $K8S_INSTALL_MINOR && rm -f /tmp/s05-install.sh"
if ! vm "$LAB_CP" "sudo ctr -n k8s.io images ls -q | grep -q 'shop/catalog:1.0'"; then
  images_load
  vm "$LAB_CP" "sudo ctr -n k8s.io images ls -q | grep -q 'shop/catalog:1.0'" \
    || { echo "s05: nạp image xong mà $LAB_CP vẫn chưa có shop/catalog:1.0" >&2; exit 1; }
fi
vm_put "$SESSION_DIR/files/run-catalog.sh" "$LAB_CP" /tmp/s05-run.sh
vm "$LAB_CP" "sudo bash /tmp/s05-run.sh && rm -f /tmp/s05-run.sh"
