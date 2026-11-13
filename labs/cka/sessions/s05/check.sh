# s05 — kiểm đầu vào: phần BỀN qua khởi động lại của đầu ra s01–s04 (netns và rule iptables của s04 mất khi reboot,
# nên không kiểm ở đây). Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
for o in $LAB_VMS; do
  [ "$o" = "$cp" ] && continue
  expect_eq "$cp: ssh -o BatchMode=yes $o hostname (s01)" "$o" vm "$cp" "ssh -o BatchMode=yes -o ConnectTimeout=5 $o hostname"
done
expect_ok "~/.bashrc có alias k=kubectl (s02)" vm "$cp" "grep -Eq '^[[:space:]]*alias k=' ~/.bashrc"
expect_eq "shop-heartbeat active (s03)" "active" vm "$cp" "systemctl is-active shop-heartbeat.service"
expect_match "jq đang hold (s03)" '^jq$' vm "$cp" "apt-mark showhold"
for key in DEFAULT_GW DNS_SERVER SSH_PORT_PID_NAME; do
  expect_ok "answers.env có $key (s04)" vm "$cp" "grep -Eq '^$key=.+' ~/drills/s04/answers.env"
done
assert_summary
