# s06 — kiểm đầu vào: phần BỀN của đầu ra chặng 0 (container catalog chạy bằng ctr không bền qua reboot và
# sẽ được dọn trong buổi này, nên không kiểm). Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
for o in $LAB_VMS; do
  [ "$o" = "$cp" ] && continue
  expect_eq "$cp: ssh -o BatchMode=yes $o hostname (s01)" "$o" vm "$cp" "ssh -o BatchMode=yes -o ConnectTimeout=5 $o hostname"
done
expect_eq "$cp: containerd active (s05)" "active" vm "$cp" "systemctl is-active containerd"
expect_match "$cp: /etc/crictl.yaml trỏ tới containerd.sock (s05)" 'runtime-endpoint: *unix:///run/containerd/containerd.sock' \
  vm "$cp" "cat /etc/crictl.yaml"
expect_match "$cp: repo pkgs.k8s.io v$K8S_INSTALL_MINOR (s05)" "core:/stable:/v$K8S_INSTALL_MINOR/deb/" \
  vm "$cp" "cat /etc/apt/sources.list.d/kubernetes.list"
expect_match "$cp: ctr -n k8s.io images ls có shop/catalog:1.0 (s05)" 'shop/catalog:1\.0$' vm "$cp" "sudo ctr -n k8s.io images ls -q"
assert_summary
