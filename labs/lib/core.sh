#!/bin/bash
# Tiện ích lõi của CLI lab. Không chứa giá trị riêng của chương trình nào.

# Lệnh in trong mọi gợi ý và dòng "cách dùng": đường dẫn chạy được từ gốc repo.
LAB_CMD="./labs/lab"

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
  # Chỉ dọn biến của hợp đồng chung; biến riêng của chương trình do env.sh của nó tự khai
  # (mỗi lần chạy lab chỉ nạp một chương trình).
  unset LAB_PREFIX LAB_VMS LAB_CP LAB_IMAGE LAB_IMAGES LAB_CTR_NAMESPACE
  unset LAB_DRIVER LAB_APP_DIR LAB_REQUIRE LAB_PORTS LAB_COMPOSE_FILE LAB_COMPOSE_PROJECT
  unset -f lab_vm_spec lab_build_images 2>/dev/null || true
  # shellcheck disable=SC1090
  . "$LAB_ROOT/$prog/env.sh"
  LAB_PROGRAM="$prog"
  LAB_IMAGE="${LAB_IMAGE:-24.04}"
  LAB_DRIVER="${LAB_DRIVER:-multipass}"
  case "$LAB_DRIVER" in
    multipass) ;;
    local) load_local_program "$prog"; return 0 ;;
    *) die "chương trình '$prog': driver '$LAB_DRIVER' không hỗ trợ (chỉ multipass hoặc local)" ;;
  esac
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

# load_local_program <tên>: kiểm các khai báo riêng của driver local (đã nạp env.sh)
load_local_program() {
  local prog="$1" p
  LAB_APP_DIR="${LAB_APP_DIR:-app}"
  case "$LAB_APP_DIR" in
    /*|..|../*|*/..|*/../*) die "chương trình '$prog': LAB_APP_DIR '$LAB_APP_DIR' phải là đường dẫn tương đối trong chương trình" ;;
  esac
  for p in ${LAB_PORTS:-}; do
    case "$p" in *[!0-9]*) die "chương trình '$prog': cổng '$p' không hợp lệ" ;; esac
  done
  if [ -n "${LAB_COMPOSE_FILE:-}" ] || [ -n "${LAB_COMPOSE_PROJECT:-}" ]; then
    [ -n "${LAB_COMPOSE_FILE:-}" ] && [ -n "${LAB_COMPOSE_PROJECT:-}" ] \
      || die "chương trình '$prog': LAB_COMPOSE_FILE và LAB_COMPOSE_PROJECT phải đi cùng nhau"
  fi
}
