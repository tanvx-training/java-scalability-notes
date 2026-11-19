# s41 — kiểm đầu vào (thay verify.sh của s40): verify s40 so values của release shop với revision tốt trước sự cố và đòi đúng
# 15 object, chart shop-0.1.0; chính s41 upgrade shop (chart 0.2.0, order 2 replica, PDB) nên dòng đó đỏ giữa buổi, và Pod
# Pending lúc drain làm dòng Pod đỏ. Ở đây chỉ đọc phần s41 không được đổi: release shop deployed với javaOpts của cuối s37 và
# order 2.0 (s41/files/facts.sh SHOPBASE), dòng demo của s37 và s40, demo-canary đã gỡ, repo podinfo, đáp án s40. Nhờ vậy
# `begin cka s41` chạy lại được giữa buổi. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) cộng facts s37, s40, s41 (~60 lệnh kubectl/helm, mỗi lệnh
# tối đa 10–30 giây, thường dưới 1 giây): chậm nhất ~25 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~25 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s37/files/facts.sh")" 2>/dev/null | sed -n 's/^DEMO=/S37_DEMO=/p')
$(vm "$cp" "$(cat "$SESSION_DIR/../s40/files/facts.sh")" 2>/dev/null | grep -E '^(DEMOREL|CANARY|ANS)=')
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null | grep '^SHOPBASE=')"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "Release shop deployed, javaOpts -XX:MaxRAMPercentage=50 như cuối s37, order.image.tag 2.0" "đạt" echo "$(fact SHOPBASE)"
expect_eq "Release demo deployed sau sự cố s40, values và image 6.16.0 như cuối s37; ui.message, Pod trên cka-cp" \
  "đạt" echo "$(fact DEMOREL)$( [ "$(fact S37_DEMO)" = "đạt" ] || echo "; $(fact S37_DEMO)")"
expect_eq "Release demo-canary đã gỡ; helm search repo thấy podinfo/podinfo 6.16.0" "đạt" echo "$(fact CANARY)"
expect_eq "answers.env của s40: BAD_VALUE" "đạt" echo "$(fact ANS)"
assert_summary
