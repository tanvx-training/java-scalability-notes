# s05 — kiểm containerd, crictl, image shop trong namespace k8s.io và catalog trả UP trên cka-cp. Chỉ đọc.
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
expect_eq "containerd active" "active" vm "$cp" "systemctl is-active containerd"
expect_match "/etc/crictl.yaml trỏ tới containerd.sock" 'runtime-endpoint: *unix:///run/containerd/containerd.sock' \
  vm "$cp" "cat /etc/crictl.yaml"
expect_ok "crictl info chạy được" vm "$cp" "sudo crictl info"
expect_match "ctr -n k8s.io images ls có shop/catalog:1.0" 'shop/catalog:1\.0$' vm "$cp" "sudo ctr -n k8s.io images ls -q"
expect_match "curl localhost:8080/actuator/health trả UP" '"status":"UP"' vm "$cp" "curl -s localhost:8080/actuator/health"
assert_summary
