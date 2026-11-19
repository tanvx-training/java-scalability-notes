# s40 — kiểm (5 dòng): release shop deployed sau revision failed của sự cố, values (-a) bằng revision tốt trước đó (tìm theo
# history, không ghi cứng số), cộng phần release/nhận lại của s37 (s37/files/facts.sh: chart shop-0.1.0, order 2.0, Deployment
# khớp values, 15 object); không Pod/ReplicaSet nào của shop còn JAVA_OPTS xấu, bốn Deployment Available, curl TỪ MÁY MAC tới
# cka-w1:30180 trả 200; release demo deployed sau revision pending-upgrade, values bằng revision tốt, không còn image 6.99.0
# (cộng dòng demo của s37); demo-canary đã gỡ và repo podinfo đọc được; BAD_VALUE. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây), cộng facts s37 (~30 lệnh kubectl/helm, mỗi lệnh tối đa
# 10–30 giây), facts s40 (~20 lệnh) và vòng curl tối đa 6 × 7 giây: chậm nhất ~33 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~33 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s37/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Gọi NodePort từ chính máy Mac (như s37): tối đa 6 lần × (5 giây curl + 2 giây nghỉ).
mac_curl() {
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP của cka-w1"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:30180/api/products" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  echo "http://$ip:30180/api/products trả mã ${code:-000}"
}
# rows <khoá…>: "đạt" khi mọi dữ kiện đạt, không thì gộp lý do.
rows() {
  local r="" x
  for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"; done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
pods_row() {
  local r c
  r="$(rows SHOPPODS APPS)"
  c="$(mac_curl "$(fact W1_IP)")"
  [ "$c" = "đạt" ] || { [ "$r" = "đạt" ] && r="$c" || r="$r; $c"; }
  echo "$r"
}
expect_eq "Release shop deployed sau revision failed của sự cố, values (-a) bằng revision tốt trước đó; chart shop-0.1.0, order 2.0, Deployment khớp values, 15 object của release" \
  "đạt" rows SHOPREL SHOP ADOPT
expect_eq "Không Pod/ReplicaSet nào của shop còn JAVA_OPTS xấu, mọi Pod Ready; bốn Deployment Available; từ Mac curl <IP cka-w1>:30180/api/products trả 200" \
  "đạt" pods_row
expect_eq "Release demo deployed sau revision pending-upgrade, values bằng revision tốt, không còn image 6.99.0; podinfo-6.16.0, ui.message, Pod trên cka-cp" \
  "đạt" rows DEMOREL DEMO
expect_eq "Release demo-canary (pending-install) đã gỡ hẳn; helm search repo thấy podinfo/podinfo 6.16.0" "đạt" echo "$(fact CANARY)"
expect_eq "answers.env: BAD_VALUE là khoá values gây lỗi của release shop" "đạt" echo "$(fact ANS)"
assert_summary
