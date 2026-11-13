# s03 — kiểm user shop, quyền /opt/shop, unit shop-heartbeat, log trong journal, jq được hold. Chỉ đọc.
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
expect_ok "id shop" vm "$cp" "id shop"
expect_eq "/opt/shop thuộc shop:shop, mode 750" "shop:shop 750" vm "$cp" "stat -c '%U:%G %a' /opt/shop"
expect_eq "shop-heartbeat enabled" "enabled" vm "$cp" "systemctl is-enabled shop-heartbeat.service"
expect_eq "shop-heartbeat active" "active" vm "$cp" "systemctl is-active shop-heartbeat.service"
expect_match "journal của shop-heartbeat có ít nhất 2 dòng" '^([2-9]|[1-9][0-9]+)$' \
  vm "$cp" "sudo journalctl _SYSTEMD_UNIT=shop-heartbeat.service -o cat --no-pager | wc -l"
expect_match "apt-mark showhold có jq" '^jq$' vm "$cp" "apt-mark showhold"
assert_summary
