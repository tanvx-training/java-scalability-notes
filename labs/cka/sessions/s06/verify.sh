# s06 — kiểm từng node: swap tắt (cả fstab), module, sysctl, containerd SystemdCgroup, ba gói đúng minor và hold;
# container catalog của s05 đã dọn; worker có image shop. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
minor_re="$(printf '%s' "$K8S_INSTALL_MINOR" | sed 's/\./\\./g')"
for v in $LAB_VMS; do
  expect_eq "$v: swapon --show rỗng" "" vm "$v" "swapon --show"
  expect_fail "$v: /etc/fstab không còn dòng swap đang bật" vm "$v" "grep -Eq '^[^#].*[[:space:]]swap[[:space:]]' /etc/fstab"
  for m in overlay br_netfilter; do
    expect_ok "$v: module $m đã nạp và có trong /etc/modules-load.d/" \
      vm "$v" "grep -q '^$m ' /proc/modules && grep -rqx '$m' /etc/modules-load.d/"
  done
  expect_eq "$v: ba sysctl mạng bằng 1" "1 1 1" \
    vm "$v" "echo \$(sysctl -n net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.ipv4.ip_forward)"
  expect_eq "$v: containerd active" "active" vm "$v" "systemctl is-active containerd"
  expect_ok "$v: /etc/containerd/config.toml có SystemdCgroup = true" \
    vm "$v" "grep -Eq '^[[:space:]]*SystemdCgroup[[:space:]]*=[[:space:]]*true' /etc/containerd/config.toml"
  for p in kubeadm kubelet kubectl; do
    expect_match "$v: $p bản $K8S_INSTALL_MINOR và đang hold" "^$p $minor_re\\.[0-9]+-[^ ]+ hold\$" \
      vm "$v" "echo $p \$(dpkg-query -W -f='\${Version}' $p) \$(apt-mark showhold | grep -qx $p && echo hold)"
  done
done
expect_fail "$LAB_CP: không còn container catalog (ctr) của s05" vm "$LAB_CP" "sudo ctr -n k8s.io containers ls -q | grep -qx catalog"
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  expect_match "$v: có image shop/catalog:1.0 trong k8s.io" 'shop/catalog:1\.0$' vm "$v" "sudo ctr -n k8s.io images ls -q"
done
assert_summary
