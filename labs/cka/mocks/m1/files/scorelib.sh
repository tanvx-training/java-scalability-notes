# Mock — ghép dòng điểm trên Mac (bash 3.2), dùng chung cho score.sh của hai đề mock và verify của s52/s53.
#   m1: . "$SESSION_DIR/files/scorelib.sh"      m2: . "$SESSION_DIR/../m1/files/scorelib.sh"
#
# HỢP ĐỒNG
#   mock_lines "<bảng>" "<dữ kiện>"
#       <bảng>    danh sách "qN:domain:max" cách nhau bởi khoảng trắng, đúng thứ tự in (trùng `questions` của mocks.js).
#       <dữ kiện> văn bản có các dòng `GOT qN <số>` và `WHY qN <lý do>` (qlib.sh emit()).
#       In ra stdout đúng một dòng `qN domain got max` cho mỗi câu trong bảng, theo thứ tự bảng: câu không có dòng GOT (facts
#       hết giờ, apiserver hỏng, VM không trả lời) là 0, got bị kẹp trong [0, max]. Luôn trả 0. Đây là định dạng mà
#       `./labs/lab mock … score` đọc.
#       MOCK_WHY=1: in thêm ra stderr mỗi câu một dòng `  qN got/max  <lý do>` (lý do chỉ khi chưa đủ điểm).
#   mock_total "<dòng của mock_lines>"   in "<tổng got> <tổng max>".
mock_lines() {
  local table="$1" facts="$2" e q dom max got why
  for e in $table; do
    q="${e%%:*}"; dom="${e#*:}"; max="${dom#*:}"; dom="${dom%%:*}"
    got="$(printf '%s\n' "$facts" | sed -n "s/^GOT $q \([0-9][0-9]*\)\$/\1/p" | head -n1)"
    case "$got" in ''|*[!0-9]*) got=0 ;; esac
    [ "$got" -le "$max" ] || got="$max"
    echo "$q $dom $got $max"
    if [ "${MOCK_WHY:-}" = 1 ]; then
      why="$(printf '%s\n' "$facts" | sed -n "s/^WHY $q //p" | head -n1)"
      [ "$got" = "$max" ] && why=""
      printf '  %-4s %2s/%-2s %s\n' "$q" "$got" "$max" "$why" | sed 's/[[:space:]]*$//' >&2
    fi
  done
  return 0
}
mock_total() { printf '%s\n' "$1" | awk 'NF==4 {g+=$3; m+=$4} END {printf "%d %d\n", g, m}'; }
