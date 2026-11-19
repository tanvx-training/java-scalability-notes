# s37 — kiểm (4 dòng): helm v4.3.2 trên cka-cp và release demo (podinfo-6.16.0, deployed, ui.message của --set và limits/
# nodeSelector của -f có hiệu lực, Pod trên cka-cp); release shop (namespace shop, chart shop-0.1.0, deployed, revision ≥ 2,
# image/resources/replicas của Deployment bằng values, order.image.tag 2.0); đúng 15 object trong release, mỗi object mang
# nhãn/annotation của release shop, không object nào khác trong shop mang annotation release, Deployment/Service có trước
# revision 1 (nhận lại, không tạo lại); selector không đổi, bốn Deployment Available, order chạy bằng SA order; curl TỪ MÁY MAC
# tới cka-w1:30180/api/products trả 200 với 3 sản phẩm; ~/shop/ không còn tệp của object đã vào chart. Chỉ đọc. Nạp bởi `lab`
# trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn như s26 (files/wait.sh, 420 giây), cộng facts.sh (~30 lệnh kubectl/helm, mỗi
# lệnh tối đa 10–30 giây, thường dưới 1 giây), facts của s35 (~50 lệnh kubectl, mỗi lệnh tối đa 10 giây) và vòng curl tối đa
# 6 × 7 giây: chậm nhất ~24 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~24 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

# Thêm dòng SA của s35 (token thật của SA order): Role của order nay nằm trong chart, quyền rộng hơn phải đỏ ở đây.
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/../s35/files/facts.sh")" 2>/dev/null | sed -n 's/^SA=/S35_SA=/p')"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Gọi NodePort từ chính máy Mac (như s27): IP là InternalIP của cka-w1 do API báo. Tối đa 6 lần × (5 giây curl + 2 giây nghỉ).
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

expect_eq "helm v4.3.2 trên cka-cp; release demo (namespace demo) deployed, chart podinfo-6.16.0, ui.message và limits/nodeSelector ghi đè có hiệu lực, Pod trên cka-cp" \
  "đạt" echo "$(fact DEMO)"
expect_eq "Release shop ở namespace shop: deployed, chart shop-0.1.0, đã upgrade (order.image.tag 2.0); Deployment khớp values; ~/charts/shop đủ khoá" \
  "đạt" echo "$(fact SHOP)"
# Nhận lại, selector/Available và đường vào từ Mac gộp một dòng: trên đầu vào (cuối s36) shop đã chạy và 30180 đã trả 200,
# nên tách riêng thì hai dòng đó xanh sẵn.
run_row() {
  local r="" x c
  for x in ADOPT APPS S35_SA; do
    [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"
  done
  c="$(mac_curl "$(fact W1_IP)")"
  [ "$c" = "đạt" ] || r="$r; $c"
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
expect_eq "Đúng 15 object trong release, mang nhãn/annotation của release shop, nhận lại chứ không tạo lại, ngoài chart không object nào mang annotation release; selector không đổi, bốn Deployment Available, order chạy bằng SA order chỉ đọc được ConfigMap order-config; từ Mac curl <IP cka-w1>:30180/api/products trả 200 với 3 sản phẩm" \
  "đạt" run_row
expect_eq "~/shop/ không còn tệp của object đã vào chart (bản cũ ở ~/shop/pre-helm/); ~/shop/rbac.yaml giữ RBAC của dev/ops" \
  "đạt" echo "$(fact FILES)"
assert_summary
