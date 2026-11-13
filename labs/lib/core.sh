#!/bin/bash
# Tiện ích lõi của CLI lab. Không chứa giá trị riêng của chương trình nào.

die() { echo "lab: $*" >&2; exit 1; }
info() { echo "lab: $*"; }

# confirm <câu hỏi>: đọc y/yes từ stdin; mặc định là không
confirm() {
  local ans=""
  printf '%s [y/N] ' "$1" >&2
  read -r ans || true
  case "$ans" in y|Y|yes|YES) return 0 ;; esac
  return 1
}

# require_cmd <tên> <gợi ý cài>
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "chưa cài $1 ($2)"
}

# prefix_ok <tiền tố>: dạng chính xác "[a-z0-9]+-" (so khớp bằng case, không dùng regex nhiều dòng)
prefix_ok() {
  case "$1" in
    ''|-*|*[!a-z0-9-]*) return 1 ;;
    *-) ;;
    *) return 1 ;;
  esac
  case "${1%-}" in ''|*-*) return 1 ;; esac
  return 0
}

# load_program <tên>: nạp $LAB_ROOT/<tên>/env.sh và kiểm tra bất biến tiền tố
load_program() {
  local prog="$1" v
  case "$prog" in
    ''|*[!a-z0-9_-]*) die "không có chương trình '$prog'" ;;
  esac
  [ -f "${LAB_ROOT:?}/$prog/env.sh" ] || die "không có chương trình '$prog'"
  unset LAB_PREFIX LAB_VMS LAB_CP LAB_IMAGE K8S_INSTALL_MINOR K8S_TARGET_MINOR
  unset -f lab_vm_spec 2>/dev/null || true
  # shellcheck disable=SC1090
  . "$LAB_ROOT/$prog/env.sh"
  LAB_PROGRAM="$prog"
  LAB_IMAGE="${LAB_IMAGE:-24.04}"
  [ -n "${LAB_PREFIX:-}" ] || die "chương trình '$prog': LAB_PREFIX rỗng, từ chối"
  prefix_ok "$LAB_PREFIX" \
    || die "chương trình '$prog': LAB_PREFIX '$LAB_PREFIX' không hợp lệ (cần dạng 'tên-')"
  [ -n "${LAB_VMS:-}" ] || die "chương trình '$prog': LAB_VMS rỗng"
  for v in $LAB_VMS; do
    case "$v" in
      *[!a-z0-9-]*) die "chương trình '$prog': tên VM '$v' không hợp lệ" ;;
      "$LAB_PREFIX"?*) ;;
      *) die "chương trình '$prog': VM '$v' không bắt đầu bằng '$LAB_PREFIX', từ chối" ;;
    esac
  done
}
