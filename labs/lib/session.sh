#!/bin/bash
# Lệnh theo buổi: check, begin, verify, break, mock. Nạp sau core.sh, multipass.sh, assert.sh.
# Dùng các hàm của labs/lab: check_list, cmd_up, wait_running, existing_vms.
#
# Hợp đồng script buổi (labs/<chương trình>/sessions/<id>/):
#   verify.sh  bắt buộc, chỉ đọc, kết thúc bằng assert_summary
#   apply.sh   bắt buộc, lời giải chuẩn, chạy lại được
#   check.sh   tuỳ chọn, thay verify.sh của buổi trước khi kiểm đầu vào, kết thúc bằng assert_summary
#   setup.sh   tuỳ chọn, chạy bởi `begin`
#   files/     tuỳ chọn
# Script được `source` trong subshell (stdin = /dev/null) với sẵn: vm, vm_put, lab_break, LAB_CP, LAB_VMS,
# LAB_PROGRAM, SESSION_DIR và các hàm assert. apply/setup/break chạy với `set -e`.

# order_list: in id các buổi theo sessions/ORDER
order_list() {
  local f="$LAB_ROOT/$LAB_PROGRAM/sessions/ORDER" l
  [ -f "$f" ] || die "chương trình '$LAB_PROGRAM' chưa có sessions/ORDER"
  while read -r l || [ -n "$l" ]; do
    case "$l" in ''|'#'*) continue ;; esac
    set -- $l
    echo "$1"
  done < "$f"
}

id_ok() { case "$1" in ''|*[!a-z0-9_-]*) return 1 ;; esac; return 0; }

# session_prev <id>: id đứng trước trong ORDER (rỗng nếu là buổi đầu)
session_prev() { order_list | awk -v t="$1" '$0==t{print p; exit} {p=$0}'; }

session_dir() { echo "$LAB_ROOT/$LAB_PROGRAM/sessions/$1"; }

# require_session <id>: id có trong ORDER và có thư mục script
require_session() {
  local ord
  ord="$(order_list)" || exit 1
  id_ok "$1" && printf '%s\n' "$ord" | grep -Fxq -- "$1" \
    || die "không có buổi '$1' trong chương trình '$LAB_PROGRAM'"
  [ -d "$(session_dir "$1")" ] || die "buổi '$1' chưa có script"
}

# require_running: mọi VM của chương trình phải Running
require_running() {
  local v s
  check_list
  for v in $LAB_VMS; do
    s="$(vm_state "$v")"
    case "$s" in
      Running) ;;
      '') die "VM $v chưa tạo, chạy: $LAB_CMD up $LAB_PROGRAM" ;;
      *) die "VM $v đang dừng, chạy: $LAB_CMD up $LAB_PROGRAM" ;;
    esac
  done
}

# run_script <e|n> <tệp> <SESSION_DIR>: source trong subshell; e = bật set -e. Trả mã thoát của script.
run_script() {
  local mode="$1" f="$2"
  export LAB_PROGRAM LAB_CP LAB_VMS LAB_ROOT
  # SESSION_DIR đặt bên trong subshell để không rò sang script gọi (vd. setup.sh gọi lab_break)
  if [ "$mode" = e ]; then
    ( export SESSION_DIR="$3"; set -e; . "$f" ) </dev/null
  else
    ( export SESSION_DIR="$3"; . "$f" ) </dev/null
  fi
}

# run_session_file <id> <tên tệp> <e|n>: chạy script của buổi; thiếu tệp là lỗi
run_session_file() {
  local id="$1" name="$2" mode="$3" d
  d="$(session_dir "$id")"
  [ -f "$d/$name" ] || die "buổi '$id' thiếu $name"
  run_script "$mode" "$d/$name" "$d"
}

# lab_break <id>: gây lỗi theo labs/<chương trình>/breaks/<id>/run.sh (dùng được trong setup.sh)
lab_break() {
  local id="$1" f
  id_ok "$id" || die "tên lỗi '$id' không hợp lệ"
  f="$LAB_ROOT/$LAB_PROGRAM/breaks/$id/run.sh"
  [ -f "$f" ] || die "không có lỗi '$id' trong chương trình '$LAB_PROGRAM'"
  run_script e "$f" "$(dirname "$f")"
}

cmd_verify() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD verify $LAB_PROGRAM <buổi>"
  local rc=0
  require_session "$1"
  require_running
  info "kiểm $1"
  run_session_file "$1" verify.sh n || rc=$?
  return "$rc"
}

# check_input <id>: kiểm đầu vào của buổi (VM chạy, rồi check.sh hoặc verify.sh của buổi trước)
check_input() {
  local id="$1" prev d rc=0
  require_session "$id"
  require_running
  prev="$(session_prev "$id")"
  [ -n "$prev" ] || { info "buổi '$id' là buổi đầu, chỉ cần VM đang chạy"; return 0; }
  d="$(session_dir "$id")"
  if [ -f "$d/check.sh" ]; then
    info "kiểm đầu vào của '$id' (check.sh)"
    run_script n "$d/check.sh" "$d" || rc=$?
  else
    require_session "$prev"
    info "kiểm đầu vào của '$id' bằng verify của '$prev'"
    run_session_file "$prev" verify.sh n || rc=$?
  fi
  return "$rc"
}

cmd_check() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD check $LAB_PROGRAM <buổi>"
  local rc=0
  check_input "$1" || rc=$?
  return "$rc"
}

cmd_begin() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD begin $LAB_PROGRAM <buổi>"
  local id="$1" prev rc=0
  check_input "$id" || rc=$?
  if [ "$rc" -ne 0 ]; then
    prev="$(session_prev "$id")"
    echo "lab: đầu vào của '$id' chưa đạt, thử: $LAB_CMD restore $LAB_PROGRAM $prev" >&2
    return 1
  fi
  if [ -f "$(session_dir "$id")/setup.sh" ]; then
    info "chuẩn bị buổi '$id' (setup.sh)"
    run_session_file "$id" setup.sh e || rc=$?
    [ "$rc" -eq 0 ] || die "setup.sh của '$id' lỗi (mã $rc)"
  else
    info "buổi '$id' không có setup.sh"
  fi
  return 0
}

cmd_break() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD break $LAB_PROGRAM <mã-lỗi>"
  local rc=0
  id_ok "$1" || die "tên lỗi '$1' không hợp lệ"
  [ -f "$LAB_ROOT/$LAB_PROGRAM/breaks/$1/run.sh" ] || die "không có lỗi '$1' trong chương trình '$LAB_PROGRAM'"
  require_running
  lab_break "$1" || rc=$?
  [ "$rc" -eq 0 ] || die "lỗi '$1' chạy không xong (mã $rc)"
}

# mock_dir <id>: kiểm tên và thư mục đề mock
mock_dir() {
  id_ok "$1" || die "tên đề mock '$1' không hợp lệ"
  [ -d "$LAB_ROOT/$LAB_PROGRAM/mocks/$1" ] || die "đề mock '$1' chưa có script"
  echo "$LAB_ROOT/$LAB_PROGRAM/mocks/$1"
}

cmd_mock() {
  [ $# -eq 2 ] || die "cách dùng: $LAB_CMD mock $LAB_PROGRAM <đề> start|score"
  local m="$1" action="$2" d rc=0 out agg line today
  d="$(mock_dir "$m")"
  case "$action" in
    start)
      [ -f "$d/setup.sh" ] || die "đề mock '$m' thiếu setup.sh"
      require_running
      info "bắt đầu đề '$m'"
      run_script e "$d/setup.sh" "$d" || rc=$?
      [ "$rc" -eq 0 ] || die "setup.sh của đề '$m' lỗi (mã $rc)"
      ;;
    score)
      [ -f "$d/score.sh" ] || die "đề mock '$m' thiếu score.sh"
      require_running
      out="$(run_script n "$d/score.sh" "$d")" || die "score.sh của đề '$m' lỗi"
      # Mỗi dòng: <câu> <domain> <got> <max>. Sai hình dạng là lỗi, không bỏ qua im lặng.
      agg="$(printf '%s\n' "$out" | awk '
        NF==0 { next }
        NF!=4 || $2 !~ /^[a-z0-9_-]+$/ || $3 !~ /^[0-9]+$/ || $4 !~ /^[0-9]+$/ || ($3+0) > ($4+0) {
          print $0 > "/dev/stderr"; bad=1; exit 1 }
        { if (!($2 in g)) ord[++n]=$2; g[$2]+=$3; m[$2]+=$4 }
        END { if (bad) exit 1; for (i=1;i<=n;i++) printf "%s %d %d\n", ord[i], g[ord[i]], m[ord[i]] }')" \
        || die "score.sh của đề '$m' in dòng sai định dạng (cần: <câu> <domain> <got> <max>)"
      [ -n "$agg" ] || die "score.sh của đề '$m' không in dòng điểm nào"
      printf '%-18s %s\n' DOMAIN ĐIỂM
      line=""
      while read -r dom got max; do
        printf '%-18s %s/%s\n' "$dom" "$got" "$max"
        line="${line:+$line,}$dom=$got/$max"
      done <<EOF2
$agg
EOF2
      today="$(date +%Y-%m-%d)"
      echo "devprep-mock:v1:$LAB_PROGRAM:$m:$today:$line"
      ;;
    *) die "hành động '$action' không có, dùng start hoặc score" ;;
  esac
}
