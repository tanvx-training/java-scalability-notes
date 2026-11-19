# s43 — kiểm (4 dòng): snapshot /opt/backup/etcd.db hợp lệ và chụp đúng lúc (có before-snapshot và Deployment order, không có
# after-snapshot); etcd chạy từ /var/lib/etcd-restore (manifest: --data-dir, volumeMount và hostPath; container đang chạy mount
# đúng thư mục đó; chỉ một manifest etcd), etcd healthy, apiserver /readyz; shop như lúc chụp (before-snapshot có, after-snapshot
# không, order Available, release shop deployed), ba node Ready, curl TỪ MÁY MAC tới 30180 trả 200; answers.env LOST_OBJECT.
# Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) cộng facts.sh (~15 lệnh, mỗi lệnh tối đa 10–30 giây) và
# vòng curl tối đa 6 × 7 giây: chậm nhất ~15 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
# curl từ chính máy Mac: tối đa 6 lần × (5 giây curl + 2 giây nghỉ), 200 với đủ 3 sản phẩm.
mac_shop() {
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP cka-w1"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:30180/api/products" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  echo "Mac :30180 trả mã ${code:-000}"
}
state_row() {
  local r="" c
  [ "$(fact STATE)" = "đạt" ] || r="$(fact STATE)"
  c="$(mac_shop "$(fact W1_IP)")"
  [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "/opt/backup/etcd.db: etcdutl snapshot status đọc được; có before-snapshot và order, không có after-snapshot" "đạt" echo "$(fact SNAP)"
expect_eq "etcd chạy từ /var/lib/etcd-restore (--data-dir, volumeMount, hostPath, container đang chạy); etcd healthy, apiserver /readyz" \
  "đạt" echo "$(fact ETCD)"
expect_eq "shop như lúc chụp: before-snapshot có, after-snapshot không, order Available, release shop deployed; ba node Ready; Mac :30180 trả 200" \
  "đạt" state_row
expect_eq "answers.env: LOST_OBJECT là đối tượng mất khi restore" "đạt" echo "$(fact ANS)"
assert_summary
