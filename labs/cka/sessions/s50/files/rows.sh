# s50 — hàm ghép dòng chấm trên Mac (bash 3.2), dùng ở s50/verify.sh và s51/check.sh, s51/verify.sh. Nạp sau khi bên gọi đã định
# nghĩa fact() (đọc KHOÁ=giá-trị từ $facts) và đặt mac_now=$(date +%s) ngay sau khi lấy dữ kiện.
#   rows <khoá…>          `đạt` khi mọi dữ kiện là đạt; còn lại nối các lý do bằng "; " (khoá không in ra là "<khoá> không
#                         đọc được", không bao giờ là đạt).
#   more <lý do> <khoá…>  như rows, thêm một lý do đứng trước (rỗng = không có).
#   clock                 rỗng khi giờ của cka-cp (dữ kiện NOW, epoch) lệch giờ Mac ≤ 5 phút; còn lại một lý do. cert chỉ "còn
#                         hạn" theo đồng hồ của chính cka-cp: chỉnh giờ hệ thống thay cho cấp cert mới thì đỏ ở đây.
rows() { local r="" x v; for x in "$@"; do v="$(fact $x)"; [ "$v" = "đạt" ] || r="${r:+$r; }${v:-$x không đọc được}"; done; echo "${r:-đạt}"; }
more() { local r="$1" c; shift; c="$(rows "$@")"; [ "$c" = "đạt" ] || r="${r:+$r; }$c"; echo "${r:-đạt}"; }
clock() {
  local n d
  n="$(fact NOW)"
  case "$n" in ''|*[!0-9]*) echo "không đọc được giờ của cka-cp"; return 0 ;; esac
  d=$((n - mac_now)); [ "$d" -lt 0 ] && d=$((-d))
  [ "$d" -le 300 ] || echo "đồng hồ cka-cp lệch giờ Mac $d giây"
}
