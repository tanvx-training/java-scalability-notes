# s26 — kiểm (4 dòng): đáp án trong ~/drills/s26/answers.env so với giá trị đọc lúc chấm. CATALOG_POD_IP/CATALOG_NODE là IP và
# node của một Pod catalog đang chạy (bất kỳ Pod nào; VM khởi động lại thì Pod giữ tên, đổi IP: files/facts.sh nhận IP cũ khi
# Pod mang đúng HOST_VETH đã khởi động lại sau lúc ghi đáp án và IP cũ thuộc khối IPAM của node); HOST_VETH là interface cali*
# mà chính node đó dùng để tới IP hiện tại của Pod (`ip route get` trên node); TUNNEL_IFACE đúng chế độ encapsulation của IPPool (IPIP → tunl0, VXLAN → vxlan.calico) và có trên
# node; CNI_CONF là tệp đầu tiên (theo tên) trong /etc/cni/net.d của node; shop không đổi so với cuối s25 (ba Deployment và
# postgres Available). Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn (420 giây cho apiserver, postgres-0 và ba Deployment, cộng facts.sh với
# --request-timeout 10 giây mỗi lệnh và một lần hỏi node: in ra ~9 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~9 phút)"
vm "$cp" "# Hạn theo đồng hồ (420 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 420))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get sts postgres -o jsonpath='{.spec.replicas} {.status.readyReplicas}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && [ \"\${o% *}\" = \"\${o#* }\" ] && break
    sleep 3
  done
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được cả ba Deployment và cả ba đủ Available.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Hỏi tiếp trên node mà đáp án ghi (chỉ nhận tên node của lab; sai tên thì đọc CNI trên cka-w1).
node="$(fact ANS_NODE)"
case "$node" in cka-cp|cka-w1|cka-w2) ;; *) node=cka-w1 ;; esac
ip="$(fact ROUTE_IP)"; case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) ip=127.0.0.1 ;; esac
tun="$(fact WANT_TUNNEL)"; case "$tun" in tunl0|vxlan.calico) ;; *) tun=lo ;; esac
nfacts="$(vm "$node" "echo ROUTE=\$(ip -o route get $ip 2>/dev/null | sed -n 's/.* dev \\([^ ]*\\).*/\\1/p' | head -n1)
  ip -o link show $tun >/dev/null 2>&1 && echo HAS_TUNNEL=yes
  echo CNI=\$(sudo ls -1 /etc/cni/net.d 2>/dev/null | grep -E '\\.(conflist|conf|json)\$' | LC_ALL=C sort | head -n1)" 2>/dev/null)"
nfact() { printf '%s\n' "$nfacts" | sed -n "s/^$1=//p" | head -n1; }

veth_row() {
  local v; v="$(fact ANS_VETH)"
  [ "$(fact POD_OK)" = "đạt" ] || { echo "cần CATALOG_POD_IP/CATALOG_NODE đúng trước"; return 0; }
  case "$v" in cali*) ;; *) echo "HOST_VETH='$v' (không phải interface cali*)"; return 0 ;; esac
  [ "$(nfact ROUTE)" = "$v" ] && echo "đạt" || echo "HOST_VETH='$v', $node tới $ip qua '$(nfact ROUTE)'"
}
tunnel_row() {
  local want got; want="$(fact WANT_TUNNEL)"; got="$(fact ANS_TUNNEL)"
  case "$want" in tunl0|vxlan.calico) ;; *) echo "không đọc được chế độ của IPPool ($want)"; return 0 ;; esac
  [ "$got" = "$want" ] || { echo "TUNNEL_IFACE='$got' ($(fact POOL_MODE))"; return 0; }
  [ "$(nfact HAS_TUNNEL)" = yes ] && echo "đạt" || echo "$node không có interface $want"
}
cni_row() {
  local want got; want="$(nfact CNI)"; got="$(fact ANS_CNI)"; got="${got##*/}"
  [ -n "$want" ] || { echo "không đọc được /etc/cni/net.d trên $node"; return 0; }
  [ "$got" = "$want" ] || { echo "CNI_CONF='$(fact ANS_CNI)' (trên $node: $want)"; return 0; }
  echo "$(fact SHOP)"
}

expect_eq "answers.env: CATALOG_POD_IP và CATALOG_NODE là IP và node của một Pod catalog đang chạy" "đạt" echo "$(fact POD_OK)"
expect_eq "answers.env: HOST_VETH là interface cali* mà node đó dùng để tới CATALOG_POD_IP (ip route get)" "đạt" veth_row
expect_eq "answers.env: TUNNEL_IFACE đúng chế độ encapsulation của IPPool Calico và có trên node" "đạt" tunnel_row
expect_eq "answers.env: CNI_CONF là tệp cấu hình CNI trong /etc/cni/net.d; shop không đổi (ba Deployment và postgres Available)" "đạt" cni_row
assert_summary
