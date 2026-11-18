# s32 — kiểm: mọi dòng của s31 xanh lại (s31/files/facts.sh và s31/files/rows.sh, cùng các luồng thử thật từ Pod thật và từ Mac),
# cộng hai dòng của s32: không còn Pod netshoot (hay container tạm netshoot đang chạy), FIRST_BROKEN_HOP. Chỉ đọc trạng thái buổi
# học. Nạp bởi `lab` trên Mac (bash 3.2). Sau khi VM khởi động lại: chờ có giới hạn như s31 (in ra ~14 phút).
cp="$LAB_CP"
s31="$SESSION_DIR/../s31"
echo "  (chờ apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và NGF, nếu đang khởi động: tối đa ~14 phút)"
vm "$cp" "$(cat "$s31/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$s31/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$s31/files/rows.sh"
expect_eq "Pod netshoot đã xoá (cả container tạm netshoot của kubectl debug không còn chạy)" "đạt" echo "$(fact NETSHOOT)"
expect_eq "answers.env: FIRST_BROKEN_HOP là chặng hỏng đầu tiên của shop.local:30080/api/products" "đạt" echo "$(fact HOP)"
assert_summary
