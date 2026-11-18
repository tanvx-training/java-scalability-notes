# s32 — kiểm: mọi dòng của s31 xanh lại (s31/files/facts.sh và s31/files/rows.sh, cùng các luồng thử thật từ Pod thật và từ Mac),
# cộng một dòng của s32: FIRST_BROKEN_HOP và không còn Pod netshoot (hay container tạm netshoot đang chạy). Chỉ đọc trạng thái buổi
# học. Nạp bởi `lab` trên Mac (bash 3.2). Sau khi VM khởi động lại: chờ có giới hạn như s31 (in ra ~14 phút).
cp="$LAB_CP"
s31="$SESSION_DIR/../s31"
echo "  (chờ apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và NGF, nếu đang khởi động: tối đa ~14 phút)"
vm "$cp" "$(cat "$s31/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$s31/files/facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$s31/files/rows.sh"
# Pod netshoot đã xoá cùng dòng với đáp án: dòng riêng của nó sẽ xanh ngay trên đầu vào.
s32_last() {
  local a b
  a="$(fact HOP)"; b="$(fact NETSHOOT)"
  [ "$a$b" = "đạtđạt" ] && { echo "đạt"; return 0; }
  printf '%s\n' "$a" "$b" | grep -v '^đạt$' | paste -sd ';' - | sed 's/;/; /g'
}
expect_eq "answers.env: FIRST_BROKEN_HOP của shop.local:30080/api/products; Pod netshoot (và kubectl debug netshoot) đã xoá" "đạt" s32_last
assert_summary
