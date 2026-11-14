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

# ws_init: tạo workspace từ LAB_APP_DIR nếu chưa có. Lỗi giữa chừng thì xoá thư mục vừa tạo
# (chưa có gì của người học trong đó) để lần `up` sau chạy lại được.
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
  cp -R "$src/." "$w/" || ws_init_fail "$w" "không chép được '$src' vào workspace"
  git -C "$w" init -q || ws_init_fail "$w" "git init lỗi"
  { git -C "$w" config user.name lab && git -C "$w" config user.email lab@localhost; } \
    || ws_init_fail "$w" "không đặt được tên người commit trong workspace"
  # Kết quả build (target/ cạnh mỗi pom.xml của bản gốc) không vào kho: commit của lab chỉ chứa code.
  # Neo đúng từng module để một thư mục mã nguồn tên 'target' vẫn được theo dõi và sao lưu.
  { mkdir -p "$w/.git/info" \
      && (cd "$w" && find . -name .git -prune -o -type f -name pom.xml -print) \
         | sed -e 's|^\./||' -e 's|pom\.xml$|target/|' -e 's|^|/|' >> "$w/.git/info/exclude"; } \
    || ws_init_fail "$w" "không ghi được .git/info/exclude"
  { ws_git add -A && ws_git commit -q --no-verify -m "lab: bản gốc"; } \
    || ws_init_fail "$w" "commit 'lab: bản gốc' lỗi"
}

# ws_init_fail <thư mục> <thông báo>: xoá workspace dở mà ws_init vừa tạo (chỉ có bản chép của app) rồi dừng
ws_init_fail() {
  rm -rf "$1"
  die "$2; đã xoá workspace dở, chạy lại '$LAB_CMD up $LAB_PROGRAM'"
}

# ws_commit <nhãn>: git add -A rồi commit "lab: <nhãn>" (cho phép rỗng). Đang giữa merge thì commit này
# ghi lại cả cây làm việc (kể cả tệp còn dấu xung đột) thành commit merge. Bỏ qua hook của người học
# để một hook lỗi không chặn được việc sao lưu.
ws_commit() {
  ws_git add -A || die "git add lỗi"
  ws_git commit -q --no-verify --allow-empty -m "lab: $1" || die "git commit lỗi"
}

# ws_enter: workspace phải tồn tại; chuyển vào đó và đặt WS. Script buổi của driver local không có vm.
ws_enter() {
  local w
  w="$(ws_dir)"
  ws_guard "$w"
  [ -e "$w" ] || die "chưa có workspace của '$LAB_PROGRAM', chạy: $LAB_CMD up $LAB_PROGRAM"
  [ -d "$w/.git" ] || die "'$w' không phải workspace của lab (thiếu .git), từ chối"
  cd "$w" || die "không vào được '$w'"
  WS="$w"
  export WS
  unset -f vm vm_put 2>/dev/null || true
}

# rel_ok <đường dẫn>: tương đối, không rỗng, không có thành phần '..', '.', rỗng hay '.git'
# ('.git' so không phân biệt hoa thường: ổ đĩa macOS mặc định coi '.GIT' là '.git')
rel_ok() {
  case "$1" in
    ''|/*|*//*) return 1 ;;
    ..|../*|*/..|*/../*) return 1 ;;
    .|./*|*/.|*/./*) return 1 ;;
    .[Gg][Ii][Tt]|.[Gg][Ii][Tt]/*|*/.[Gg][Ii][Tt]|*/.[Gg][Ii][Tt]/*) return 1 ;;
  esac
  return 0
}

# ws_target <đường dẫn tương đối>: đặt WS_T = đường dẫn đó trong workspace; die nếu sai dạng, là symlink,
# hoặc sau khi giải symlink không nằm hẳn trong workspace (kể cả khi trỏ sang backups/).
ws_target() {
  local w real wr
  rel_ok "$1" || die "đường dẫn '$1' không hợp lệ (cần đường dẫn tương đối trong workspace, không '..', không '.git'), từ chối"
  w="$(ws_dir)"
  ws_guard "$w/$1"
  real="$(ws_resolve "$w/$1")" || die "không giải được đường dẫn '$1', từ chối"
  wr="$(ws_resolve "$w")" || die "không giải được workspace '$w'"
  { ws_under "$real" "$wr" && [ "$real" != "$wr" ]; } || die "'$1' trỏ ra ngoài workspace, từ chối"
  WS_T="$w/$1"
}

# list_lines <tệp>: in các dòng không rỗng, không phải chú thích (#)
list_lines() {
  local l
  [ -f "$1" ] || return 0
  while IFS= read -r l || [ -n "$l" ]; do
    case "$l" in ''|'#'*) continue ;; esac
    printf '%s\n' "$l"
  done < "$1"
}

# tree_files <thư mục>: đường dẫn tương đối của mọi tệp trong cây
tree_files() { (cd "$1" && find . -type f -print) | sed 's|^\./||' | sort; }

# check_tree <thư mục>: cây (nếu có) chỉ gồm tệp thường và thư mục, mọi đường dẫn hợp lệ
check_tree() {
  local bad rel list
  [ -e "$1" ] || [ -L "$1" ] || return 0
  { [ -d "$1" ] && [ ! -L "$1" ]; } || die "'$1' phải là thư mục, từ chối"
  bad="$(cd "$1" && find . ! -type f ! -type d -print | head -n 1)"
  [ -z "$bad" ] || die "'$1' chứa '$bad' không phải tệp thường (symlink?), từ chối"
  list="$(tree_files "$1")"
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    rel_ok "$rel" || die "'$1' chứa đường dẫn '$rel' không hợp lệ, từ chối"
  done <<EOF
$list
EOF
}

# check_list_file <tệp>: mọi dòng là đường dẫn tương đối hợp lệ
check_list_file() {
  local l list
  list="$(list_lines "$1")"
  while IFS= read -r l; do
    [ -n "$l" ] || continue
    rel_ok "$l" || die "'$1' có dòng '$l' không hợp lệ (cần đường dẫn tương đối trong workspace, không '..', không '.git'), từ chối"
  done <<EOF
$list
EOF
}

# session_check <id> [build]: kiểm dữ liệu của buổi trước khi ghi gì; build: buổi phải có lời giải
session_check() {
  local d
  d="$(session_dir "$1")"
  check_tree "$d/tests"
  check_tree "$d/solution"
  check_list_file "$d/retire"
  check_list_file "$d/solution.delete"
  if [ "${2:-}" = build ] && [ ! -d "$d/solution" ] && [ ! -f "$d/apply.sh" ]; then
    die "buổi '$1' chưa có lời giải (solution/ hoặc apply.sh)"
  fi
  return 0
}

# ws_copy_tree <thư mục>: chép đè mọi tệp của cây vào workspace theo cùng đường dẫn tương đối
ws_copy_tree() {
  local src="$1" rel list
  [ -d "$src" ] || return 0
  check_tree "$src"
  list="$(tree_files "$src")"
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    ws_target "$rel"
    [ -d "$WS_T" ] && die "'$rel' trong workspace là thư mục, không chép đè được"
    mkdir -p "$(dirname "$WS_T")" || die "không tạo được thư mục cho '$rel'"
    cp "$src/$rel" "$WS_T" || die "không chép được '$rel'"
  done <<EOF
$list
EOF
}

# ws_remove_list <tệp>: xoá khỏi workspace từng đường dẫn liệt kê trong tệp (nếu có)
ws_remove_list() {
  local l list
  check_list_file "$1"
  list="$(list_lines "$1")"
  while IFS= read -r l; do
    [ -n "$l" ] || continue
    ws_target "$l"
    rm -rf "$WS_T" || die "không xoá được '$l'"
  done <<EOF
$list
EOF
}

# sessions_upto <id>: các buổi có thư mục script theo ORDER, từ đầu tới <id>
sessions_upto() {
  local s
  for s in $(order_list); do
    id_ok "$s" || die "sessions/ORDER có id '$s' không hợp lệ"
    [ -d "$(session_dir "$s")" ] && echo "$s"
    [ "$s" = "$1" ] && return 0
  done
  return 0
}

# ws_apply_session <id>: áp lời giải của một buổi: chép tests/, gỡ retire, chép solution/,
# xoá theo solution.delete, chạy apply.sh
ws_apply_session() {
  local d rc=0
  d="$(session_dir "$1")"
  ws_copy_tree "$d/tests"
  ws_remove_list "$d/retire"
  ws_copy_tree "$d/solution"
  ws_remove_list "$d/solution.delete"
  if [ -f "$d/apply.sh" ]; then
    run_script e "$d/apply.sh" "$d" || rc=$?
    [ "$rc" -eq 0 ] || die "apply.sh của '$1' lỗi (mã $rc)"
  fi
  return 0
}

# ws_pristine: in commit "lab: bản gốc" (commit gốc của workspace)
ws_pristine() {
  local c
  for c in $(ws_git rev-list --max-parents=0 HEAD 2>/dev/null); do
    [ "$(ws_git log -1 --format=%s "$c")" = "lab: bản gốc" ] && { echo "$c"; return 0; }
  done
  return 1
}

# ws_backup: commit mọi thay đổi (kể cả tệp chưa theo dõi, kể cả khi đang giữa merge) rồi tạo nhánh
# backup/<YYYYmmdd-HHMMSS> (trùng thì thêm -2, -3…; không ghi đè nhánh nào). Đặt BACKUP_BRANCH và in tên nhánh.
ws_backup() {
  local base name n=1
  base="backup/$(date +%Y%m%d-%H%M%S)"
  ws_commit "sao lưu trước khi khôi phục"
  name="$base"
  while ws_git rev-parse -q --verify "refs/heads/$name" >/dev/null; do
    n=$((n+1)); name="$base-$n"
  done
  ws_git branch "$name" || die "không tạo được nhánh sao lưu '$name', chưa ghi đè gì"
  BACKUP_BRANCH="$name"
  info "đã lưu mọi thay đổi vào nhánh $name"
}

# ws_build <id>: đưa cây làm việc về bản gốc (bỏ cả target/ cạnh pom.xml, tức kết quả build cũ) rồi áp
# lời giải mọi buổi từ đầu ORDER tới <id>.
# Chỉ chạy trên cây sạch (sau ws_backup), nên không có thay đổi nào của người học bị mất.
ws_build() {
  local root w list d s chain
  w="$(ws_dir)"
  [ -z "$(ws_git status --porcelain)" ] || die "workspace còn thay đổi chưa commit, cần sao lưu trước khi dựng lại"
  root="$(ws_pristine)" || die "không thấy commit 'lab: bản gốc' trong workspace"
  chain="$(sessions_upto "$1")" || exit 1
  ws_git read-tree --reset -u "$root" || die "không đưa được workspace về bản gốc"
  list="$(find "$w" -name .git -prune -o -type d -name target -prune -print)"
  while IFS= read -r d; do
    [ -n "$d" ] && [ -f "$(dirname "$d")/pom.xml" ] || continue
    ws_guard "$d"
    rm -rf "$d" || die "không xoá được '$d'"
  done <<EOF
$list
EOF
  for s in $chain; do
    ws_apply_session "$s"
  done
}

# lab_mvn <đối số…>: xoá mọi báo cáo surefire cũ trong workspace rồi chạy mvn ở đó; trả mã của Maven.
# Gọi trực tiếp trong verify.sh (không trong $(…)) để expect_test biết Maven vừa chạy.
lab_mvn() {
  local w list d rc=0
  _LAB_TEST_INDEX_OK=0   # bảng chỉ mục của expect_test phải đọc lại báo cáo mới
  w="${WS:-$(ws_dir)}"
  list="$(find "$w" -name .git -prune -o -type d -path '*/target/surefire-reports' -print)"
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    ws_guard "$d"
    rm -rf "$d" || { echo "lab: không xoá được báo cáo cũ '$d'" >&2; return 1; }
  done <<EOF
$list
EOF
  LAB_MVN_RAN=1
  (cd "$w" && mvn "$@") || rc=$?
  return "$rc"
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
  local w b name arc n
  w="$(ws_dir)"
  ws_guard "$w"
  [ -e "$w" ] || { info "chưa có workspace của '$LAB_PROGRAM' để xoá"; return 0; }
  [ -d "$w/.git" ] || die "'$w' không phải workspace của lab (thiếu .git), từ chối"
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
  n=1
  # Một symlink (kể cả treo) ở đường dẫn gói cũng tính là đã có: không ghi theo nó.
  while [ -e "$arc" ] || [ -L "$arc" ]; do
    n=$((n+1)); arc="$b/$name-$n.tar.gz"
  done
  ws_guard "$arc"
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

# ---- Lệnh theo buổi ----
# Hợp đồng thư mục buổi (labs/<chương trình>/sessions/<id>/) của driver local:
#   verify.sh        bắt buộc, kết thúc bằng assert_summary (thường: lab_mvn … rồi expect_test …)
#   solution/        cây tệp chép đè lên workspace; solution.delete: mỗi dòng một đường dẫn cần xoá
#   apply.sh         tuỳ chọn, chạy sau khi chép solution/. Buổi đã phát hành phải có solution/ hoặc apply.sh
#   tests/           cây tệp test, chép vào workspace lúc begin; có tệp tests.hidden thì chép lúc verify
#   retire           mỗi dòng một đường dẫn test hết hiệu lực, gỡ lúc begin và khi dựng lại
#   setup.sh, check.sh  tuỳ chọn như driver multipass
# Script chạy với thư mục hiện hành là workspace, có WS, SESSION_DIR và các hàm assert; không có vm.

local_cmd_check() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD check $LAB_PROGRAM <buổi>"
  local rc=0
  check_input "$1" || rc=$?
  return "$rc"
}

local_cmd_begin() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD begin $LAB_PROGRAM <buổi>"
  local id="$1" d prev rc=0
  check_input "$id" || rc=$?
  if [ "$rc" -ne 0 ]; then
    prev="$(session_prev "$id")"
    echo "lab: đầu vào của '$id' chưa đạt, thử: $LAB_CMD restore $LAB_PROGRAM $prev" >&2
    return 1
  fi
  d="$(session_dir "$id")"
  session_check "$id"
  ws_commit "trước buổi $id"
  if [ -f "$d/setup.sh" ]; then
    info "chuẩn bị buổi '$id' (setup.sh)"
    run_session_file "$id" setup.sh e || rc=$?
    [ "$rc" -eq 0 ] || die "setup.sh của '$id' lỗi (mã $rc)"
  fi
  if [ -e "$d/tests.hidden" ]; then
    info "test của buổi '$id' được chép vào lúc verify"
  else
    ws_copy_tree "$d/tests"
  fi
  ws_remove_list "$d/retire"
  ws_commit "đầu buổi $id"
  info "đã bắt đầu buổi '$id' (code trước đó nằm ở commit 'lab: trước buổi $id')"
}

local_cmd_verify() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD verify $LAB_PROGRAM <buổi>"
  local id="$1" d rc=0
  require_session "$id"
  ws_enter
  d="$(session_dir "$id")"
  if [ -e "$d/tests.hidden" ]; then
    session_check "$id"
    # Chép test ẩn có thể đè tệp người học đã sửa: commit trước để không mất gì.
    [ -z "$(ws_git status --porcelain)" ] || ws_commit "trước khi chấm $id"
    ws_copy_tree "$d/tests"
  fi
  info "kiểm $id"
  run_session_file "$id" verify.sh n || rc=$?
  if [ "$rc" -eq 0 ]; then
    ws_commit "xong buổi $id"
    info "buổi '$id' đạt, đã commit 'lab: xong buổi $id'"
  fi
  return "$rc"
}

local_cmd_restore() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD restore $LAB_PROGRAM <buổi>"
  local id="$1" chain s rc=0
  require_session "$id"
  ws_enter
  ws_pristine >/dev/null || die "không thấy commit 'lab: bản gốc' trong workspace, không dựng lại được"
  chain="$(sessions_upto "$id")" || exit 1
  for s in $chain; do session_check "$s" build; done
  echo "Sẽ khôi phục workspace $WS về cuối buổi '$id':"
  echo "  1. commit mọi thay đổi hiện có (kể cả tệp chưa theo dõi) và giữ trong nhánh backup/<thời điểm>"
  echo "  2. đưa cây làm việc về bản gốc rồi áp lời giải của các buổi:" $chain
  echo "  3. commit 'lab: khôi phục về cuối buổi $id' rồi chạy verify của '$id'"
  if [ "$YES" -ne 1 ]; then
    confirm "Khôi phục?" || die "đã huỷ, không đổi gì"
  fi
  ws_backup
  ws_build "$id"
  ws_commit "khôi phục về cuối buổi $id"
  info "kiểm $id"
  run_session_file "$id" verify.sh n || rc=$?
  [ "$rc" -eq 0 ] || echo "lab: verify của '$id' chưa đạt sau khi khôi phục" >&2
  info "code của bạn trước khi khôi phục nằm trong nhánh $BACKUP_BRANCH (xem: git -C $WS log $BACKUP_BRANCH)"
  return "$rc"
}

local_cmd_break() {
  [ $# -eq 1 ] || die "cách dùng: $LAB_CMD break $LAB_PROGRAM <mã-lỗi>"
  local rc=0
  id_ok "$1" || die "tên lỗi '$1' không hợp lệ"
  [ -f "$LAB_ROOT/$LAB_PROGRAM/breaks/$1/run.sh" ] || die "không có lỗi '$1' trong chương trình '$LAB_PROGRAM'"
  ws_enter
  ws_commit "trước sự cố $1"
  lab_break "$1" || rc=$?
  [ "$rc" -eq 0 ] || die "lỗi '$1' chạy không xong (mã $rc)"
  info "đã gây sự cố '$1' (code trước đó nằm ở commit 'lab: trước sự cố $1')"
}

# selftest_cleanup: xoá workspace tạm của selftest (chạy lúc thoát)
selftest_cleanup() {
  [ -n "${SELFTEST_TMP:-}" ] || return 0
  ( ws_guard "$LAB_WORK_DIR" && rm -rf "$LAB_WORK_DIR" ) && rmdir "$SELFTEST_TMP" 2>/dev/null
  return 0
}

local_cmd_selftest() {
  [ $# -eq 0 ] || die "cách dùng: $LAB_CMD selftest $LAB_PROGRAM"
  local started id n=0 st="$LAB_ROOT/$LAB_PROGRAM/selftest.sh"
  started="$(date +%s)"
  SELFTEST_TMP="$(mktemp -d)" || die "không tạo được thư mục tạm"
  LAB_WORK_DIR="$SELFTEST_TMP/work"
  export LAB_WORK_DIR
  trap selftest_cleanup EXIT
  info "selftest trên workspace tạm $LAB_WORK_DIR (không đụng workspace của bạn)"
  ( ws_init ) || die "không tạo được workspace tạm"
  for id in $(order_list); do
    id_ok "$id" || die "sessions/ORDER có id '$id' không hợp lệ"
    if [ ! -d "$(session_dir "$id")" ]; then
      info "bỏ qua '$id' (chưa có script)"
      continue
    fi
    info "selftest '$id'"
    ( local_cmd_begin "$id" ) || die "selftest dừng: begin '$id' lỗi"
    if ( local_cmd_verify "$id" ); then
      die "selftest dừng: buổi '$id' đã xanh ngay sau begin (verify phải đỏ trước khi áp lời giải)"
    fi
    ( ws_enter && session_check "$id" build && ws_apply_session "$id" ) || die "selftest dừng: áp lời giải của '$id' lỗi"
    ( local_cmd_verify "$id" ) || die "selftest dừng: lời giải của '$id' không làm verify xanh"
    if [ -f "$st" ]; then
      ( ws_enter && run_script n "$st" "$(dirname "$st")" ) \
        || die "selftest dừng: selftest.sh của chương trình lỗi sau buổi '$id'"
    fi
    n=$((n+1))
  done
  info "selftest xong, $n buổi đạt, tổng thời gian $(( $(date +%s) - started )) giây"
}
