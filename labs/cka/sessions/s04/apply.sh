# s04 — lời giải chuẩn trên cka-cp: hai netns nối veth, chain SHOP-DEMO một rule, answers.env.
# Netns và iptables không bền qua reboot; chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
vm "$LAB_CP" "sudo bash -euc '
for ns in shop-a shop-b; do ip netns list | grep -qw \$ns || ip netns add \$ns; done
if ! ip -n shop-a link show veth-a >/dev/null 2>&1; then
  ip link del veth-a 2>/dev/null || true
  ip link add veth-a type veth peer name veth-b
  ip link set veth-a netns shop-a
  ip link set veth-b netns shop-b
fi
ip -n shop-a addr replace 10.200.0.1/24 dev veth-a
ip -n shop-b addr replace 10.200.0.2/24 dev veth-b
for ns in shop-a shop-b; do ip -n \$ns link set lo up; done
ip -n shop-a link set veth-a up
ip -n shop-b link set veth-b up
iptables -N SHOP-DEMO 2>/dev/null || iptables -F SHOP-DEMO
iptables -A SHOP-DEMO -p tcp --dport 9999 -j DROP
iptables -C INPUT -j SHOP-DEMO 2>/dev/null || iptables -I INPUT -j SHOP-DEMO'"
facts="$(vm "$LAB_CP" "$(cat "$SESSION_DIR/files/facts.sh")")"
vm "$LAB_CP" "mkdir -p ~/drills/s04 && printf '%s\n' '$facts' > ~/drills/s04/answers.env"
