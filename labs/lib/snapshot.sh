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
# Vì chụp lúc VM dừng, phần KHÔNG bền của đầu ra buổi mốc (netns, container chạy bằng tay…) không có trong
# snapshot: restore về mốc xong thì áp lại apply.sh của chính buổi mốc (apply.sh chạy lại được theo hợp đồng).

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

# snap_exists <vm> <tên>: 0 nếu có snapshot, 1 nếu không có (multipass trả 2: "No such snapshot" hoặc
# instance chưa tồn tại). Mã khác (daemon không trả lời, lỗi lạ) là lỗi dò: dừng hẳn, không đoán là "không có",
# vì "không có mốc" dẫn tới nhánh xoá và dựng lại VM.
snap_exists() {
  local rc=0 out
  out="$(mp info "$1.$2" --format csv 2>&1)" || rc=$?
  case "$rc" in
    0) return 0 ;;
    2) # mã 2 là mã lỗi chung của multipass: chỉ tin là "không có" khi chính thông báo nói vậy
       case "$out" in *"No such snapshot"*|*"does not exist"*) return 1 ;; esac ;;
  esac
  die "không dò được snapshot $1.$2 (multipass trả mã $rc), dừng lại, không đổi gì"
}

# milestone_all_names: tên mọi snapshot mốc khai trong milestones (theo thứ tự tệp)
milestone_all_names() {
  local f="$LAB_ROOT/$LAB_PROGRAM/milestones" sid name rest
  [ -f "$f" ] || return 0
  while read -r sid name rest || [ -n "$sid" ]; do
    case "$sid" in ''|'#'*) continue ;; esac
    snap_name_ok "$name" && echo "$name"
  done < "$f"
  return 0
}

# snapshot_everywhere <tên>: có snapshot này trên mọi VM của chương trình
snapshot_everywhere() {
  local v
  for v in $LAB_VMS; do
    snap_exists "$v" "$1" || return 1
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

# snapshot_take <tên>: dừng, xoá snapshot cùng tên trên mọi VM, chụp mọi VM, bật lại.
# Xoá hết bản cũ trước khi chụp để một lần lỗi giữa chừng không để lại tên mốc chứa các trạng thái lẫn lộn.
snapshot_take() {
  local name="$1" v hint
  hint="VM có thể đang dừng, chạy: $LAB_CMD up $LAB_PROGRAM"
  snap_name_ok "$name" || die "tên snapshot '$name' không hợp lệ (chỉ chữ thường, số, dấu gạch)"
  for v in $LAB_VMS; do
    [ -n "$(vm_state "$v")" ] || die "VM $v chưa tạo, chạy: $LAB_CMD up $LAB_PROGRAM"
  done
  info "chụp snapshot '$name' cho:$(printf ' %s' $LAB_VMS)"
  stop_running
  for v in $LAB_VMS; do
    if snap_exists "$v" "$name"; then
      mp delete --purge "$v.$name" >/dev/null || die "không xoá được snapshot cũ $v.$name ($hint)"
    fi
  done
  for v in $LAB_VMS; do
    mp snapshot "$v" --name "$name" >/dev/null || die "không chụp được snapshot $v.$name, mốc '$name' có thể chưa đủ ($hint)"
  done
  mp start $LAB_VMS >/dev/null || die "không khởi động lại được VM sau khi chụp ($hint)"
  wait_running
}

cmd_snapshot() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD snapshot $LAB_PROGRAM <tên>"
  local v old=""
  check_list
  snap_name_ok "$1" || die "tên snapshot '$1' không hợp lệ (chỉ chữ thường, số, dấu gạch)"
  for v in $LAB_VMS; do
    if snap_exists "$v" "$1"; then old="$old $v"; fi
  done
  if [ -n "$old" ] && [ "$YES" -ne 1 ]; then
    echo "Snapshot '$1' đã có trên:$old"
    confirm "Ghi đè snapshot '$1'?" || die "đã huỷ, không đổi gì"
  fi
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
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD restore $LAB_PROGRAM <buổi>"
  local target="$1" sid name ms_sid="" ms_name="" rev list v gone rc=0
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
    list="$(existing_vms)" || exit 1
    echo "Không có mốc dùng được. Sẽ xoá hẳn và dựng lại VM, rồi áp lại từ đầu tới '$target':"
    for v in $LAB_VMS; do echo "  $v"; done
    if [ -n "$list" ]; then
      # Xoá hẳn VM là mất luôn snapshot của nó, kể cả mốc của các buổi SAU buổi đích.
      gone=""
      for name in $(milestone_all_names); do
        for v in $list; do
          if snap_exists "$v" "$name"; then gone="$gone $name"; break; fi
        done
      done
      echo "Xoá hẳn VM là xoá luôn MỌI snapshot của các VM đó${gone:+, gồm cả mốc:$gone}."
      echo "Mốc đã mất thì restore về buổi sau mốc sẽ phải dựng lại từ đầu, cho tới khi bạn chụp lại mốc:"
      echo "  $LAB_CMD selftest $LAB_PROGRAM   (dựng sạch và chụp mọi mốc), hoặc"
      echo "  $LAB_CMD snapshot $LAB_PROGRAM <tên mốc>   (sau khi tự đi tới buổi mốc)"
    fi
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
  if [ -n "$ms_sid" ]; then
    apply_chain "$ms_sid" $(sessions_through "$target" "$ms_sid")
  else
    apply_chain $(sessions_through "$target")
  fi
  info "kiểm '$target'"
  run_session_file "$target" verify.sh n || rc=$?
  return "$rc"
}

cmd_selftest() {
  local from="" sid name started n=0 rc list v
  while [ $# -gt 0 ]; do
    case "$1" in
      --from) [ $# -ge 2 ] || die "--from cần một id buổi"; from="$2"; shift 2 ;;
      *) die "đối số '$1' không hợp lệ, cách dùng: $LAB_CMD selftest $LAB_PROGRAM [--from <buổi>]" ;;
    esac
  done
  check_list
  if [ -n "$from" ]; then
    id_ok "$from" && order_list | grep -Fxq -- "$from" || die "không có buổi '$from' trong chương trình '$LAB_PROGRAM'"
    require_running
  else
    list="$(existing_vms)" || exit 1
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
