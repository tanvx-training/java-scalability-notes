# s38 — kiểm (4 dòng): verify tự build overlays/dev và so với namespace shop-dev; shop-dev chạy catalog H2 (Available, 1
# replica, tag 1.0, limit hạ bằng patch) bằng ConfigMap catalog-config-<hash> mà Pod đang dùng, và đã có một lần rollout do đổi
# literal (hai ReplicaSet trỏ hai ConfigMap khác nhau); verify tự build overlays/prod: 2 replica, tag 2.0, namespace riêng, chưa
# apply; HASHED_CM_NAME khớp; shop như cuối s37 (release shop, 15 object, bốn Deployment Available) và không bị overlay chạm.
# Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây; nó không đợi shop-dev) rồi chờ catalog ở shop-dev Ready sau
# lúc boot (tối đa 240 giây), cộng facts s37 (~30 lệnh) và s38 (~15 lệnh, hai lần kustomize), mỗi lệnh tối đa 10–30 giây:
# chậm nhất ~20 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver, shop và shop-dev, nếu đang khởi động: tối đa ~20 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "$(cat "$SESSION_DIR/files/wait-dev.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s37/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
# Dòng shop-dev gộp luôn phép giữ shop như cuối s37 (release, 15 object, bốn Deployment Available, không bị overlay chạm), để
# dòng nào cũng đỏ trên đầu vào.
dev_row() {
  local r="" x
  for x in DEV SHOP ADOPT APPS SHOPSAFE; do
    [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"
  done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
expect_eq "~/kustomize/shop/{base,overlays/dev,overlays/prod}; build overlays/dev (namespace shop-dev, ConfigMap có hash) khớp shop-dev" \
  "đạt" echo "$(fact KUST)"
expect_eq "shop-dev: catalog H2 Available, 1 replica, tag 1.0, limit hạ, Pod dùng đúng ConfigMap catalog-config-<hash>, đã rollout do đổi literal; shop như cuối s37, không bị overlay chạm" \
  "đạt" dev_row
expect_eq "Build overlays/prod (verify tự build): 2 replica, tag 2.0, namespace riêng khác shop-dev và shop, chưa apply" "đạt" echo "$(fact PROD)"
expect_eq "answers.env: HASHED_CM_NAME là ConfigMap Pod catalog ở shop-dev đang dùng" "đạt" echo "$(fact ANS)"
assert_summary
