#!/bin/bash
# Driver `local`: chương trình chạy trong workspace git `labs/<p>/work/`, không có VM.
# Chỉ ghi vào labs/<p>/work, labs/<p>/backups và (khi selftest/test đặt LAB_WORK_DIR) thư mục tạm.

# ws_dir: đường dẫn workspace
ws_dir() { echo "${LAB_WORK_DIR:-$LAB_ROOT/$LAB_PROGRAM/work}"; }

# ws_resolve <đường dẫn>: in đường dẫn vật lý (đã giải symlink phần đã tồn tại) cộng phần chưa tồn tại.
# Trả 1 nếu gặp symlink treo.
ws_resolve() {
  local p="$1" tail="" base
  case "$p" in /*) ;; *) p="$PWD/$p" ;; esac
  while [ ! -e "$p" ]; do
    [ -L "$p" ] && return 1
    base="${p##*/}"; tail="/$base$tail"; p="${p%/*}"
    [ -n "$p" ] || p=/
  done
  if [ -d "$p" ]; then
    p="$(cd -P "$p" && pwd -P)" || return 1
  else
    p="$(cd -P "$(dirname "$p")" && pwd -P)/$(basename "$p")" || return 1
  fi
  [ "$p" = / ] && p=""
  echo "$p$tail"
}

# ws_under <đường dẫn> <gốc>: đường dẫn bằng gốc hoặc nằm trong gốc
ws_under() {
  case "$1" in "$2"|"$2"/*) return 0 ;; esac
  return 1
}

# ws_guard <đường dẫn>: die nếu đường dẫn không nằm trong work, backups hoặc LAB_WORK_DIR (trong thư mục tạm)
ws_guard() {
  local path="$1" real prog t tmp
  case "$path" in
    ''|..|../*|*/..|*/../*) die "đường dẫn '$path' không hợp lệ, từ chối" ;;
  esac
  [ -L "$path" ] && die "'$path' là symlink, từ chối"
  real="$(ws_resolve "$path")" || die "không giải được đường dẫn '$path', từ chối"
  prog="$(ws_resolve "$LAB_ROOT/$LAB_PROGRAM")" || die "không giải được thư mục chương trình '$LAB_PROGRAM'"
  ws_under "$real" "$prog/work" && return 0
  ws_under "$real" "$prog/backups" && return 0
  if [ -n "${LAB_WORK_DIR:-}" ]; then
    t="$(ws_resolve "$LAB_WORK_DIR")" || die "LAB_WORK_DIR không hợp lệ"
    for tmp in "${TMPDIR:-/tmp}" /tmp; do
      tmp="$(ws_resolve "$tmp")" || continue
      [ -n "$tmp" ] && ws_under "$t" "$tmp" && [ "$t" != "$tmp" ] && ws_under "$real" "$t" && return 0
    done
  fi
  die "'$path' nằm ngoài workspace của '$LAB_PROGRAM', từ chối"
}

ws_git() { local w; w="$(ws_dir)"; git -C "$w" -c commit.gpgsign=false "$@"; }

# ws_init: tạo workspace từ LAB_APP_DIR nếu chưa có
ws_init() {
  local w src
  w="$(ws_dir)"
  ws_guard "$w"
  if [ -e "$w" ]; then
    [ -d "$w/.git" ] || die "'$w' đã có nhưng không phải workspace của lab (thiếu .git), từ chối"
    return 0
  fi
  src="$LAB_ROOT/$LAB_PROGRAM/$LAB_APP_DIR"
  [ -d "$src" ] || die "không thấy thư mục ứng dụng gốc '$src'"
  mkdir -p "$w" || die "không tạo được '$w'"
  cp -R "$src/." "$w/" || die "không chép được '$src' vào workspace"
  git -C "$w" init -q || die "git init lỗi"
  git -C "$w" config user.name lab
  git -C "$w" config user.email lab@localhost
  ws_commit "bản gốc"
}

# ws_commit <nhãn>: git add -A rồi commit "lab: <nhãn>" (cho phép rỗng)
ws_commit() {
  ws_git add -A || die "git add lỗi"
  ws_git commit -q --allow-empty -m "lab: $1" || die "git commit lỗi"
}

# local_compose <đối số…>: chỉ gọi compose với đúng tệp và project của chương trình
local_compose() {
  local f="$LAB_COMPOSE_FILE"
  case "$f" in /*) ;; *) f="$LAB_ROOT/$LAB_PROGRAM/$f" ;; esac
  docker compose -f "$f" -p "$LAB_COMPOSE_PROJECT" "$@"
}

local_cmd_up() {
  local c
  for c in $LAB_REQUIRE; do
    require_cmd "$c" "cần có '$c' để chạy chương trình '$LAB_PROGRAM'"
  done
  ws_init
  if [ -n "${LAB_COMPOSE_FILE:-}" ]; then
    require_cmd docker "cần Docker cho chương trình '$LAB_PROGRAM'"
    local_compose up -d || die "docker compose up lỗi"
  fi
  local_cmd_status
}

local_cmd_down() {
  if [ -n "${LAB_COMPOSE_FILE:-}" ]; then
    require_cmd docker "cần Docker cho chương trình '$LAB_PROGRAM'"
    local_compose down || die "docker compose down lỗi"
  else
    info "không có gì để dừng (chương trình '$LAB_PROGRAM' không chạy dịch vụ nền)"
  fi
}

local_cmd_status() {
  local w last p state
  w="$(ws_dir)"
  echo "Workspace: $w"
  if [ -d "$w/.git" ]; then
    last="$(git -C "$w" log -1 --format=%s 2>/dev/null)"
    echo "Commit cuối: ${last:-(chưa có)}"
  else
    echo "Commit cuối: (chưa tạo workspace, chạy '$LAB_CMD up $LAB_PROGRAM')"
  fi
  for p in ${LAB_PORTS:-}; do
    if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then state="đang được dùng"; else state="trống"; fi
    echo "Cổng $p: $state"
  done
  return 0
}

local_cmd_destroy() {
  local w b name arc
  w="$(ws_dir)"
  ws_guard "$w"
  [ -e "$w" ] || { info "chưa có workspace của '$LAB_PROGRAM' để xoá"; return 0; }
  b="$LAB_ROOT/$LAB_PROGRAM/backups"
  ws_guard "$b"
  echo "Sẽ lưu workspace vào gói trong $b rồi xoá hẳn:"
  echo "  $w"
  if [ "$YES" -ne 1 ]; then
    confirm "Xoá workspace trên?" || die "đã huỷ, không xoá gì"
  fi
  mkdir -p "$b" || die "không tạo được '$b'"
  name="$LAB_PROGRAM-$(date +%Y%m%d-%H%M%S)"
  arc="$b/$name.tar.gz"
  [ -e "$arc" ] && arc="$b/$name-$$.tar.gz"
  tar czf "$arc" -C "$(dirname "$w")" "$(basename "$w")" || { rm -f "$arc"; die "không lưu được gói, giữ nguyên workspace"; }
  tar tzf "$arc" >/dev/null 2>&1 || die "gói '$arc' không đọc lại được, giữ nguyên workspace"
  rm -rf "$w"
  info "đã lưu gói $arc và xoá workspace"
}

# Lệnh không có nghĩa với driver local
local_not_applicable() {
  die "lệnh '$1' không áp dụng cho chương trình '$LAB_PROGRAM' (driver local)"
}
local_cmd_snapshot() { local_not_applicable snapshot; }
local_cmd_images() { local_not_applicable images; }
local_cmd_mock() { local_not_applicable mock; }
