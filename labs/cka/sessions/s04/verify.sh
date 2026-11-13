# s04 — kiểm netns + veth, chain SHOP-DEMO, và đáp án trong ~/drills/s04/answers.env trên cka-cp. Chỉ đọc.
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
for ns in shop-a shop-b; do
  expect_match "ip netns có $ns" "^$ns( |\$)" vm "$cp" "ip netns list"
done
expect_ok "shop-a ping được 10.200.0.2" vm "$cp" "sudo ip netns exec shop-a ping -c1 -W2 10.200.0.2"
expect_ok "shop-b ping được 10.200.0.1" vm "$cp" "sudo ip netns exec shop-b ping -c1 -W2 10.200.0.1"
expect_ok "chain SHOP-DEMO tồn tại" vm "$cp" "sudo iptables -S SHOP-DEMO"
expect_eq "SHOP-DEMO có đúng một rule" "1" vm "$cp" "sudo iptables -S SHOP-DEMO | grep -c '^-A SHOP-DEMO '"

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")")"
for key in DEFAULT_GW DNS_SERVER SSH_PORT_PID_NAME; do
  want="$(printf '%s\n' "$facts" | sed -n "s/^$key=//p")"
  expect_eq "answers.env: $key=${want:-?}" "${want:-?}" \
    vm "$cp" "sed -n 's/^$key=//p' ~/drills/s04/answers.env | tr -d '\"' | tail -n1"
done
assert_summary
