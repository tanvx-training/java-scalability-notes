#!/bin/bash
# Checkpoint (snapshot Multipass), restore, selftest. Nạp sau session.sh.
#
# Thử trên VM thật (Multipass 1.16.3, macOS), qua `mp`:
#   stop VM; snapshot VM --name probe; restore VM.probe --destructive; delete --purge VM.probe
# đều chạy đúng. Hành vi cần biết:
#   - snapshot chỉ lấy khi VM đã Stopped; restore --destructive đưa VM về đúng trạng thái lúc chụp và để VM Stopped.
#   - `info <VM>.<snapshot> --format csv` trả 0 nếu snapshot có, 2 nếu không: dùng để dò sự tồn tại.
# Vì vậy mốc luôn được chụp cho mọi VM của chương trình, khi tất cả đã dừng, và được khôi phục cùng nhau.
#
# milestones: mỗi dòng "<id buổi> <tên snapshot>"; snapshot chụp sau khi buổi đó qua verify trong selftest.

snap_name_ok() { case "$1" in ''|-*|*[!a-z0-9-]*) return 1 ;; esac; return 0; }

# milestone_names <id buổi>: tên các snapshot khai báo cho buổi đó
milestone_names() {
  local f="$LAB_ROOT/$LAB_PROGRAM/milestones" sid name rest
  [ -f "$f" ] || return 0
  while read -r sid name rest || [ -n "$sid" ]; do
    case "$sid" in ''|'#'*) continue ;; esac
    [ "$sid" = "$1" ] && [ -n "$name" ] && echo "$name"
  done < "$f"
  return 0
}

# snapshot_everywhere <tên>: có snapshot này trên mọi VM của chương trình
snapshot_everywhere() {
  local v
  for v in $LAB_VMS; do
    mp info "$v.$1" --format csv >/dev/null 2>&1 || return 1
  done
}

# stop_running: dừng các VM đang chạy (nếu có)
stop_running() {
  local list="" v
  for v in $LAB_VMS; do
    [ "$(vm_state "$v")" = Running ] && list="$list $v"
  done
  [ -z "$list" ] || mp stop $list >/dev/null || die "không dừng được VM"
  return 0
}

start_all() {
  mp start $LAB_VMS >/dev/null || die "không khởi động được VM"
  wait_running
}

# snapshot_take <tên>: dừng, chụp mọi VM (thay snapshot cùng tên nếu có), bật lại
snapshot_take() {
  local name="$1" v
  snap_name_ok "$name" || die "tên snapshot '$name' không hợp lệ (chỉ chữ thường, số, dấu gạch)"
  for v in $LAB_VMS; do
    [ -n "$(vm_state "$v")" ] || die "VM $v chưa tạo, chạy: ./lab up $LAB_PROGRAM"
  done
  info "chụp snapshot '$name' cho:$(printf ' %s' $LAB_VMS)"
  stop_running
  for v in $LAB_VMS; do
    if mp info "$v.$name" --format csv >/dev/null 2>&1; then
      mp delete --purge "$v.$name" >/dev/null || die "không xoá được snapshot cũ $v.$name"
    fi
    mp snapshot "$v" --name "$name" >/dev/null || die "không chụp được snapshot $v.$name"
  done
  start_all
}

cmd_snapshot() {
  [ $# -eq 1 ] || die "cách dùng: ./lab snapshot $LAB_PROGRAM <tên>"
  check_list
  snapshot_take "$1"
  info "đã chụp snapshot '$1'"
}

# sessions_through <đích> [<sau mốc>]: id từ đầu (hoặc sau mốc) đến đích
sessions_through() {
  order_list | awk -v t="$1" -v m="${2:-}" 'BEGIN{f=(m=="")} f{print} $0==m{f=1} $0==t{exit}'
}

# apply_chain <id…>: chạy apply.sh từng buổi; buổi chưa có thư mục thì báo và bỏ qua
apply_chain() {
  local sid rc
  for sid in "$@"; do
    if [ ! -d "$(session_dir "$sid")" ]; then
      info "bỏ qua '$sid' (chưa có script)"
      continue
    fi
    info "áp lời giải buổi '$sid'"
    rc=0
    run_session_file "$sid" apply.sh e || rc=$?
    [ "$rc" -eq 0 ] || die "apply.sh của '$sid' lỗi (mã $rc)"
  done
}

cmd_restore() {
  [ $# -eq 1 ] || die "cách dùng: ./lab restore $LAB_PROGRAM <buổi>"
  local target="$1" sid name ms_sid="" ms_name="" rev list v rc=0
  require_session "$target"
  check_list
  # mốc gần nhất tại hoặc trước buổi đích mà mọi VM đều có snapshot
  rev="$(sessions_through "$target" | awk '{a[NR]=$0} END{for(i=NR;i>=1;i--) print a[i]}')"
  for sid in $rev; do
    for name in $(milestone_names "$sid"); do
      snap_name_ok "$name" || continue
      if snapshot_everywhere "$name"; then ms_sid="$sid"; ms_name="$name"; break 2; fi
    done
  done

  if [ -n "$ms_name" ]; then
    echo "Sẽ khôi phục các VM về mốc '$ms_name' (sau buổi '$ms_sid'), rồi áp lại tới '$target':"
    for v in $LAB_VMS; do echo "  $v"; done
  else
    list="$(existing_vms)"
    echo "Không có mốc dùng được. Sẽ xoá hẳn và dựng lại VM, rồi áp lại từ đầu tới '$target':"
    for v in $LAB_VMS; do echo "  $v"; done
  fi
  if [ "$YES" -ne 1 ]; then
    confirm "Tiếp tục?" || die "đã huỷ, không đổi gì"
  fi

  if [ -n "$ms_name" ]; then
    stop_running
    for v in $LAB_VMS; do
      mp restore "$v.$ms_name" --destructive >/dev/null || die "không khôi phục được $v.$ms_name"
    done
    start_all
  else
    [ -z "$list" ] || mp delete --purge $list >/dev/null || die "không xoá được VM"
    cmd_up
  fi
  apply_chain $(sessions_through "$target" "$ms_sid")
  info "kiểm '$target'"
  run_session_file "$target" verify.sh n || rc=$?
  return "$rc"
}

cmd_selftest() {
  local from="" sid name started n=0 rc list v
  while [ $# -gt 0 ]; do
    case "$1" in
      --from) [ $# -ge 2 ] || die "--from cần một id buổi"; from="$2"; shift 2 ;;
      *) die "đối số '$1' không hợp lệ, cách dùng: ./lab selftest $LAB_PROGRAM [--from <buổi>]" ;;
    esac
  done
  check_list
  if [ -n "$from" ]; then
    id_ok "$from" && order_list | grep -Fxq -- "$from" || die "không có buổi '$from' trong chương trình '$LAB_PROGRAM'"
    require_running
  else
    list="$(existing_vms)"
    echo "Selftest dựng VM sạch. Sẽ xoá hẳn rồi tạo lại:"
    for v in $LAB_VMS; do echo "  $v"; done
    if [ "$YES" -ne 1 ]; then
      confirm "Tiếp tục?" || die "đã huỷ, không đổi gì"
    fi
    [ -z "$list" ] || mp delete --purge $list >/dev/null || die "không xoá được VM"
    cmd_up
  fi
  started=0; [ -z "$from" ] && started=1
  for sid in $(order_list); do
    [ "$started" -eq 1 ] || { [ "$sid" = "$from" ] && started=1; }
    [ "$started" -eq 1 ] || continue
    if [ ! -d "$(session_dir "$sid")" ]; then
      info "bỏ qua '$sid' (chưa có script)"
      continue
    fi
    info "selftest '$sid'"
    rc=0; run_session_file "$sid" apply.sh e || rc=$?
    [ "$rc" -eq 0 ] || die "selftest dừng: apply.sh của '$sid' lỗi (mã $rc)"
    rc=0; run_session_file "$sid" verify.sh n || rc=$?
    [ "$rc" -eq 0 ] || die "selftest dừng: verify.sh của '$sid' chưa đạt"
    n=$((n+1))
    for name in $(milestone_names "$sid"); do snapshot_take "$name"; done
  done
  info "selftest xong, $n buổi đạt"
}
