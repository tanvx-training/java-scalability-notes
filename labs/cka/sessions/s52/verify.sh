# s52 — kiểm (3 dòng) buổi Mock 1: (1) đề m1 đã dựng (/opt/m1/started, do mocks/m1/setup.sh ghi); (2) điểm m1 ≥ 66% (tổng của
# mocks/m1/score.sh, chấm từng phần 16 câu; dòng này in điểm và các câu chưa đủ); (3) câu sự cố cấp node của đề đã sửa
# (q12: kubelet cka-w1 chạy, đúng ExecStart, node Ready) và lõi khoẻ (s46/files/core-facts.sh: ba node, control plane, shop
# trải hai worker). Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2). Chờ như s26 (s46/files/bootwait.sh + s26/files/wait.sh: 420
# giây khi VM vừa bật, còn lại /readyz tối đa 60 giây), cộng score.sh (tối đa ~4 phút) và core-facts (~25 lệnh, mỗi lệnh tối
# đa 10–30 giây): chậm nhất ~14 phút, in ra đúng con số đó.
cp="$LAB_CP"
m1="$SESSION_DIR/../../mocks/m1"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~14 phút)"
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
started="$(vm "$cp" 'v=$(cat /opt/m1/started 2>/dev/null); case "$v" in ""|*[!0-9]*) echo "chưa có /opt/m1/started (chạy ./labs/lab mock cka m1 start)";; *) echo đạt;; esac' 2>/dev/null)"
out="$(SESSION_DIR="$m1"; . "$m1/score.sh" 2>/dev/null)"
. "$m1/files/scorelib.sh"
set -- $(mock_total "$out")
# Tên biến riêng: expect_eq khai `local got`, hàm nó gọi sẽ thấy biến đó thay cho biến toàn cục cùng tên.
m1_got="${1:-0}"; m1_max="${2:-100}"
score_row() {
  local miss
  miss="$(printf '%s\n' "$out" | awk 'NF==4 && $3<$4 {printf "%s %d/%d, ", $1, $3, $4}' | sed 's/, $//')"
  if [ $((m1_got * 100)) -ge $((m1_max * 66)) ] && [ "$m1_max" -gt 0 ]; then echo "đạt"; else echo "$m1_got/$m1_max < 66%: ${miss:-không chấm được}"; fi
}
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
q12="$(printf '%s\n' "$out" | awk '$1=="q12" {print ($3==$4) ? "đạt" : "q12 (kubelet cka-w1) " $3 "/" $4}')"
facts="$facts
Q12=${q12:-q12 không chấm được}"
. "$SESSION_DIR/../s50/files/rows.sh"
expect_eq "Đề m1 đã dựng (/opt/m1/started)" "đạt" echo "$started"
expect_eq "Điểm m1 ≥ 66%: $m1_got/$m1_max (score.sh, 16 câu chấm từng phần)" "đạt" score_row
expect_eq "Câu sự cố q12 đã sửa (kubelet cka-w1: clusterDNS, Pod mới phân giải được); lõi khoẻ: ba node, control plane, shop" "đạt" \
  rows Q12 CORE_NODES CORE_CP CORE_SHOP
assert_summary
