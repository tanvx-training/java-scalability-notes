#!/bin/bash
# Hàm bao multipass. Mọi lời gọi multipass trong labs/ phải đi qua `mp`.
# Chặn: mọi tên instance phải bắt đầu bằng $LAB_PREFIX của chương trình đang nạp.

# guard_vm <tên|tên.snapshot|tên:đường-dẫn>
guard_vm() {
  local raw="$1" name
  [ -n "${LAB_PREFIX:-}" ] || die "chưa nạp chương trình (LAB_PREFIX rỗng), từ chối thao tác VM '$raw'"
  name="${raw%%[.:]*}"
  case "$name" in
    "$LAB_PREFIX"?*) return 0 ;;
  esac
  die "từ chối thao tác VM '$raw': tên không bắt đầu bằng '$LAB_PREFIX'"
}

# mp <lệnh con> [đối số…]: kiểm toàn bộ đối số TRƯỚC khi gọi multipass.
mp() {
  [ $# -gt 0 ] || die "mp: thiếu lệnh con"
  local sub="$1"; shift
  local checked=0 arg skip=0 rest=0 expect_name=0 a

  case "$sub" in
    list|info|start|stop|restart|delete|recover|exec|launch|transfer|snapshot|restore) ;;
    *) die "mp: không cho phép lệnh con '$sub'" ;;
  esac

  for a in "$@"; do
    if [ "$rest" -eq 1 ]; then continue; fi          # sau `--` là lệnh chạy trong VM
    if [ "$skip" -eq 1 ]; then skip=0; continue; fi  # giá trị của tuỳ chọn
    if [ "$expect_name" -eq 1 ]; then expect_name=0; guard_vm "$a"; checked=$((checked+1)); continue; fi
    case "$a" in
      --) if [ "$sub" = exec ]; then rest=1; continue; else die "mp: '--' không hợp lệ với '$sub'"; fi ;;
      --all|-a) die "mp: từ chối '$a' (sẽ chạm VM không thuộc chương trình)" ;;
      --name|-n)
        if [ "$sub" = launch ]; then expect_name=1; else skip=1; fi ;;
      --name=*|-n=*)
        if [ "$sub" = launch ]; then guard_vm "${a#*=}"; checked=$((checked+1)); fi ;;
      --cpus|-c|--memory|-m|--disk|-d|--format|--timeout|--cloud-init|--network|--mount|--bridged|--snapshot|--comment) skip=1 ;;
      -*) ;;                                          # cờ không có giá trị
      *)
        case "$sub" in
          launch) ;;                                  # ảnh nền, không phải tên instance
          list) ;;
          transfer)
            case "$a" in *:*) guard_vm "$a"; checked=$((checked+1)) ;; esac ;;
          *) guard_vm "$a"; checked=$((checked+1)) ;;
        esac ;;
    esac
  done
  [ "$expect_name" -eq 0 ] || die "mp: --name thiếu giá trị"

  # Lệnh nào cũng cần ít nhất một tên instance đã qua kiểm (trừ list).
  if [ "$sub" != list ] && [ "$checked" -eq 0 ]; then
    die "mp: '$sub' không chỉ rõ VM nào, từ chối"
  fi
  command multipass "$sub" "$@"
}

# vm_field <tên> <cột: 2=State 3=IPv4>: lấy từ `list --format csv` (dòng cuối thắng)
vm_field() {
  local name="$1" col="$2" out
  out="$(mp list --format csv 2>/dev/null)" || return 1
  printf '%s\n' "$out" | awk -F, -v n="$name" -v c="$col" 'NR>1 && $1==n {v=$c} END{print v}'
}

# vm_state <tên>: in State, rỗng nếu VM chưa tồn tại
vm_state() { vm_field "$1" 2; }

# vm <tên> <lệnh…>: chạy lệnh trong VM
vm() {
  local name="$1"; shift
  mp exec "$name" -- bash -lc "$*"
}

# vm_put <nguồn> <tên> <đích>
vm_put() { mp transfer "$1" "$2:$3"; }
