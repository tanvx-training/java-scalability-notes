#!/bin/bash
# Hàm bao multipass. Mọi lời gọi multipass trong labs/ phải đi qua `mp`.
# Chặn: mọi tên instance phải bắt đầu bằng $LAB_PREFIX của chương trình đang nạp.

# guard_vm <tên|tên.snapshot|tên:đường-dẫn>
guard_vm() {
  local raw="$1" name
  prefix_ok "${LAB_PREFIX:-}" || die "chưa nạp chương trình hoặc LAB_PREFIX không hợp lệ, từ chối thao tác VM '$raw'"
  name="${raw%%[.:]*}"
  case "$name" in
    *[!a-z0-9-]*) die "từ chối thao tác VM '$raw': tên không hợp lệ" ;;
    "$LAB_PREFIX"?*) return 0 ;;
  esac
  die "từ chối thao tác VM '$raw': tên không bắt đầu bằng '$LAB_PREFIX'"
}

# mp_opt_kind <lệnh con> <tuỳ chọn>: in "flag" hoặc "value"; lỗi nếu tuỳ chọn không được phép.
# Danh sách cho phép theo từng lệnh con (đối chiếu `multipass help <lệnh>`); mặc định là từ chối.
# Không nhận dạng gộp (-pa) hay dạng --opt=value.
mp_opt_kind() {
  local sub="$1" opt="$2"
  # Hình dạng: đúng "-<một chữ cái>" hoặc "--<chữ thường và dấu gạch>"; mọi thứ khác bị loại.
  case "$opt" in
    -[a-zA-Z]) ;;
    --[a-z]*) case "$opt" in *[!a-z-]*) return 1 ;; esac ;;
    *) return 1 ;;
  esac
  case "$opt" in -v) echo flag; return 0 ;; esac
  case "$sub" in
    launch)
      case "$opt" in
        --name|--cpus|--memory|--disk|--timeout) echo value ;;
        *) return 1 ;;
      esac ;;
    start)
      case "$opt" in --timeout) echo value ;; *) return 1 ;; esac ;;
    stop)
      case "$opt" in --force) echo flag ;; *) return 1 ;; esac ;;
    delete)
      case "$opt" in --purge|-p) echo flag ;; *) return 1 ;; esac ;;
    list|info)
      case "$opt" in --format) echo value ;; *) return 1 ;; esac ;;
    exec)
      case "$opt" in
        -n|--no-map-working-directory) echo flag ;;
        -d|--working-directory) echo value ;;
        *) return 1 ;;
      esac ;;
    transfer)
      case "$opt" in -r|--recursive|-p|--parents) echo flag ;; *) return 1 ;; esac ;;
    snapshot)
      case "$opt" in --name|-n|--comment) echo value ;; *) return 1 ;; esac ;;
    restore)
      case "$opt" in --destructive|-d) echo flag ;; *) return 1 ;; esac ;;
    *) return 1 ;;
  esac
}

# mp <lệnh con> [đối số…]: kiểm toàn bộ đối số TRƯỚC khi gọi multipass.
mp() {
  [ $# -gt 0 ] || die "mp: thiếu lệnh con"
  local sub="$1"; shift
  local checked=0 a kind pending=""   # pending: "" | skip | name

  case "$sub" in
    list|info|start|stop|delete|recover|exec|launch|transfer|snapshot|restore|restart) ;;
    *) die "mp: không cho phép lệnh con '$sub'" ;;
  esac

  for a in "$@"; do
    case "$pending" in
      skip) pending=""; continue ;;
      name) pending=""; guard_vm "$a"; checked=$((checked+1)); continue ;;
      rest) continue ;;                                # sau `--` là lệnh chạy trong VM
    esac
    case "$a" in
      --)
        [ "$sub" = exec ] || die "mp: '--' không hợp lệ với '$sub'"
        pending=rest ;;
      -*)
        kind="$(mp_opt_kind "$sub" "$a")" || die "mp: tuỳ chọn '$a' không được phép với '$sub'"
        if [ "$kind" = value ]; then
          if [ "$sub:$a" = "launch:--name" ]; then pending=name; else pending=skip; fi
        fi ;;
      *)
        case "$sub" in
          launch|list) ;;                              # ảnh nền / không có tên
          transfer) case "$a" in *:*) guard_vm "$a"; checked=$((checked+1)) ;; esac ;;
          *) guard_vm "$a"; checked=$((checked+1)) ;;
        esac ;;
    esac
  done
  case "$pending" in name|skip) die "mp: tuỳ chọn cuối thiếu giá trị" ;; esac

  # Lệnh nào cũng cần ít nhất một tên instance đã qua kiểm (trừ list).
  if [ "$sub" != list ] && [ "$checked" -eq 0 ]; then
    die "mp: '$sub' không chỉ rõ VM nào, từ chối"
  fi
  # Không dùng `command multipass`: trong bash 3.2, `command X` thất bại dưới set -e làm thoát shell
  # kể cả khi nằm trong if / || (apply.sh, setup.sh chạy với set -e). Lấy đường dẫn thật từ PATH.
  local bin
  bin="$(type -P multipass)" || die "chưa cài multipass"
  "$bin" "$sub" "$@"
}

# vm_field <tên> <cột: 2=State 3=IPv4>: lấy từ `list --format csv` (dòng cuối thắng)
vm_field() {
  local name="$1" col="$2" out
  out="$(mp list --format csv 2>/dev/null)" || return 1
  printf '%s\n' "$out" | awk -F, -v n="$name" -v c="$col" 'NR>1 && $1==n {v=$c} END{print v}'
}

# vm_state <tên>: in State, rỗng nếu VM chưa tồn tại
vm_state() { vm_field "$1" 2; }

# vm <tên> <lệnh…>: chạy lệnh trong VM (login shell của user mặc định), trả mã thoát của lệnh.
# Hai lỗi của multipass 1.16.3 được tránh ở đây:
#  - Treo (quay CPU mãi) khi stdout hoặc stderr của nó là /dev/null — đúng tình huống
#    `vm … 2>/dev/null` hay `vm … >/dev/null 2>&1`: cả hai luôn đi qua một pipe (cat chuyển tiếp).
#  - Lệnh trong VM thoát mã 4 (trùng mã "retry" của multipass) thì multipass chạy lại lệnh mãi
#    (vd. `systemctl is-active <unit chưa có>`): mã 4 được đổi thành 104, mã khác giữ nguyên.
#    Lệnh chạy trong subshell để `exit 4` bên trong lệnh cũng bị bắt.
vm() {
  local name="$1"; shift
  mp exec "$name" -- bash -lc '(eval "$1"); r=$?; [ "$r" -eq 4 ] && r=104; exit "$r"' _ "$*" > >(cat) 2> >(cat >&2)
}

# vm_put <nguồn> <tên> <đích>
vm_put() { mp transfer "$1" "$2:$3"; }
