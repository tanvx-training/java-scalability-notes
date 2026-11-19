# s36 — kiểm (6 dòng): mọi dòng của s35 xanh lại (s35/files/facts.sh và s35/files/rows.sh: quyền của dev/ops hỏi bằng chính
# hai kubeconfig, SA order, ~/shop/rbac.yaml khớp cluster), cộng ~/dev.kubeconfig đúng như cuối s34 (server như admin.conf, cert
# nhúng là của dev, s34/files/facts.sh) và đáp án FORBIDDEN_MISSING. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s35 (s26/files/wait.sh, 420 giây) cộng ba lần đọc dữ kiện (facts s35 ~50 lệnh kubectl,
# facts s34 ~5 lệnh, mỗi lệnh tối đa 10 giây): chậm nhất ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s35="$SESSION_DIR/../s35"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$s35/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "export S34_DURABLE=1
$(cat "$SESSION_DIR/../s34/files/facts.sh")" 2>/dev/null | sed -n 's/^DEV=/KC_DEV=/p')
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$s35/files/rows.sh"
expect_eq "~/dev.kubeconfig như cuối s34: server như admin.conf, cert + key nhúng là của dev (CN=dev, O=shop-dev), namespace shop, quyền 600" \
  "đạt" echo "$(fact KC_DEV)"
expect_eq "answers.env: FORBIDDEN_MISSING (verb, resource, API group) của thông báo trong forbidden.txt" "đạt" echo "$(fact ANS)"
assert_summary
