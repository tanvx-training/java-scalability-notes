#!/bin/bash
# Chạy: /bin/bash labs/tests/run.sh   (bash 3.2 của macOS)
HERE="$(cd "$(dirname "$0")" && pwd)"
LABS="$(dirname "$HERE")"
LAB="$LABS/lab"
export LAB_ROOT="$HERE/fixtures"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
STUBPATH="$HERE/stubs:/usr/bin:/bin"
FAILS=0
CASES=0

# new_case: dọn log, đặt biến cho ca mới
new_case() {
  export MP_LOG="$WORK/mp.log"
  rm -f "$MP_LOG" "$MP_LOG.run"
  : > "$MP_LOG"
  OUT="$WORK/out"; ERR="$WORK/err"
  unset MP_LIST MP_FAIL
}
# run_lab <stdin> args... : chạy lab với stub, đặt RC
run_lab() {
  local input="$1"; shift
  RC=0
  printf '%s' "$input" | env PATH="$STUBPATH" LAB_WAIT_SECS=2 LAB_POLL_SECS=0 /bin/bash "$LAB" "$@" >"$OUT" 2>"$ERR" || RC=$?
}
check() { # check <tên> <điều kiện: 0 = đạt>
  CASES=$((CASES+1))
  if [ "$2" -eq 0 ]; then echo "ok   $1"; else echo "FAIL $1"; FAILS=$((FAILS+1)); fi
}
log_empty() { [ ! -s "$MP_LOG" ]; }
has() { grep -q -- "$2" "$1"; }
count() { grep -c -- "$2" "$1" || true; }

# ---- Chặn tiền tố (viết trước mọi lệnh khác) ----
new_case; run_lab "" up bad
[ "$RC" -ne 0 ] && has "$ERR" 'cp1'; a=$?
log_empty; b=$?
check "up bad: từ chối, nhắc cp1, log rỗng" $((a+b))

new_case; run_lab "" up noprefix
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "tiền tố rỗng: từ chối, log rỗng" $((a+b))

guard_direct() { # guard_direct <args…>: gọi mp trực tiếp qua lib với chương trình tst
  RC=0
  env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" MP_LOG="$MP_LOG" /bin/bash -c '
    . "$1/lib/core.sh"; . "$1/lib/multipass.sh"; load_program tst; shift 1; mp "$@"' _ "$LABS" "$@" >"$OUT" 2>"$ERR" || RC=$?
}
for args in "delete cp1" "restore w1.snap" "delete tst-a cp1" "stop w2" "start --all" "delete --all" \
            "purge" "snapshot w1" "exec cp1 -- ls" "transfer f cp1:/tmp" "info w1:x" "delete --purge cp1" \
            "launch --name cp1 24.04" "delete" "start" "frobnicate tst-a" "delete tst-a.snap cp1.snap" \
            "delete -- cp1" "stop --cpus 2 cp1" \
            "stop -c cp1 tst-a" "exec -n cp1 tst-a -- ls" "restore -d cp1.snap tst-a.snap" \
            "delete -pa tst-a" "delete -ap tst-a" "delete --all" "delete --bogus tst-a" \
            "launch --name=cp1 24.04" "launch --bridged --name tst-a 24.04" "stop -t 1 tst-a" \
            "delete --purge=1 tst-a"; do
  new_case; guard_direct $args
  [ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
  check "mp $args: từ chối, log rỗng" $((a+b))
done
for args in "stop tst-a" "restore tst-a.snap" "info tst-a tst-b" "exec tst-a -- ls cp1" "transfer f tst-a:/tmp" "delete --purge tst-a" "delete -p tst-a" "list --format csv" "launch --name tst-a --cpus 1 --memory 1G --disk 5G 24.04" "exec -n tst-a -- ls" "restore -d tst-a.snap"; do
  new_case; guard_direct $args
  [ "$RC" -eq 0 ]; a=$?; [ "$(wc -l < "$MP_LOG" | tr -d ' ')" = 1 ]; b=$?
  check "mp $args: cho phép, một lời gọi" $((a+b))
done

# ---- Lệnh ----
new_case; run_lab "" up tst
[ "$RC" -eq 0 ]; a=$?
[ "$(count "$MP_LOG" '^launch')" = 2 ]; b=$?
has "$MP_LOG" 'launch --name tst-a --cpus 2 --memory 3G --disk 20G 24.04'; c=$?
has "$MP_LOG" 'launch --name tst-b --cpus 1 --memory 2G --disk 15G 24.04'; d=$?
check "up tst (chưa có VM): launch đúng mỗi VM với spec" $((a+b+c+d))

new_case; MP_LIST='tst-a,Stopped,,,Ubuntu 24.04 LTS,""
tst-b,Stopped,,,Ubuntu 24.04 LTS,""'; export MP_LIST; run_lab "" up tst
[ "$RC" -eq 0 ]; a=$?
has "$MP_LOG" '^start tst-a'; b=$?
! has "$MP_LOG" '^launch'; c=$?
check "up tst (Stopped): start, không launch" $((a+b+c))

new_case; MP_LIST='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Running,10.0.0.2,,Ubuntu 24.04 LTS,""'; export MP_LIST; run_lab "" up tst
! has "$MP_LOG" '^launch'; a=$?; ! has "$MP_LOG" '^start'; b=$?
check "up tst (đã Running): không làm gì" $((a+b))

new_case; MP_FAIL=launch; export MP_FAIL; run_lab "" up tst
[ "$RC" -ne 0 ]; a=$?; has "$ERR" '^lab: '; b=$?
! has "$ERR" '^+'; c=$?
check "up tst khi launch lỗi: mã khác 0, thông báo lab:" $((a+b+c))

new_case; MP_LIST='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Running,10.0.0.2,,Ubuntu 24.04 LTS,""
cp1,Running,10.0.0.3,,Ubuntu 24.04 LTS,""'; export MP_LIST; run_lab "" down tst
[ "$RC" -eq 0 ]; a=$?; has "$MP_LOG" '^stop tst-a tst-b$'; b=$?; ! has "$MP_LOG" 'cp1'; c=$?
check "down tst: stop đúng VM của tst" $((a+b+c))

new_case; MP_LIST='cp1,Running,10.0.0.3,,Ubuntu 24.04 LTS,""
w1,Stopped,,,Ubuntu 24.04 LTS,""
w2,Stopped,,,Ubuntu 24.04 LTS,""'; export MP_LIST
run_lab "n
" destroy tst
! has "$MP_LOG" '^delete'; a=$?
check "destroy tst (không VM của tst): không delete" $a

new_case; MP_LIST='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Stopped,,,Ubuntu 24.04 LTS,""
cp1,Stopped,,,Ubuntu 24.04 LTS,""
w1,Stopped,,,Ubuntu 24.04 LTS,""
w2,Stopped,,,Ubuntu 24.04 LTS,""'; export MP_LIST
run_lab "n
" destroy tst
! has "$MP_LOG" '^delete'; a=$?; has "$OUT" 'tst-a'; b=$?
check "destroy tst, trả lời n: không delete, có liệt kê VM" $((a+b))
run_lab "" destroy tst
! has "$MP_LOG" '^delete'; a=$?; [ "$RC" -ne 0 ]; b=$?
check "destroy tst, stdin rỗng: không delete" $((a+b))
run_lab "" destroy tst --yes
[ "$RC" -eq 0 ]; a=$?; [ "$(count "$MP_LOG" '^delete')" = 1 ]; b=$?
has "$MP_LOG" '^delete --purge tst-a tst-b$'; c=$?
! has "$MP_LOG" 'cp1\|w1\|w2'; d=$?
check "destroy tst --yes: delete đúng VM của tst, không VM khác" $((a+b+c+d))

new_case; MP_LIST='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
cp1,Stopped,,,Ubuntu 24.04 LTS,""'; export MP_LIST; run_lab "" status tst
[ "$RC" -eq 0 ]; a=$?; ! has "$OUT" 'cp1'; b=$?; has "$OUT" 'tst-a'; c=$?; has "$OUT" 'tst-b'; d=$?
check "status tst: không nhắc cp1, có VM của tst" $((a+b+c+d))

new_case; run_lab "" up nope
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "lab: không có chương trình 'nope'"; b=$?
check "up nope: lỗi, mã 1" $((a+b))

new_case; run_lab "" up '../x'
[ "$RC" -eq 1 ]; a=$?; log_empty; b=$?
check "tên chương trình không hợp lệ: mã 1" $((a+b))

new_case; run_lab ""
[ "$RC" -eq 1 ]; a=$?; has "$OUT" 'Cách dùng'; b=$?
check "lab không tham số: in trợ giúp, mã 1" $((a+b))

new_case; run_lab "" help
[ "$RC" -eq 0 ]; a=$?; has "$OUT" 'Cách dùng'; b=$?
check "lab help: mã 0" $((a+b))

new_case; RC=0; env PATH="/usr/bin:/bin" LAB_ROOT="$HERE/fixtures" /bin/bash "$LAB" up tst >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -eq 1 ]; a=$?; has "$ERR" 'lab: chưa cài multipass'; b=$?
check "không có multipass: lỗi, mã 1" $((a+b))

new_case; RC=0; (cd / && env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" /bin/bash "$LAB" status tst >"$OUT" 2>"$ERR") || RC=$?
[ "$RC" -eq 0 ]; a=$?
check "chạy từ thư mục khác" $a

# prefix_ok / guard_vm hoạt động độc lập với load_program
RC=0; new_case
env PATH="$STUBPATH" /bin/bash -c '. "$1/lib/core.sh"; . "$1/lib/multipass.sh"; LAB_PREFIX="a-
b-"; mp stop a-x' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "LAB_PREFIX nhiều dòng: từ chối" $((a+b))

new_case; RC=0
env PATH="$STUBPATH" /bin/bash -c '. "$1/lib/core.sh"; . "$1/lib/multipass.sh"; mp stop tst-a' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "chưa load_program: mp từ chối" $((a+b))

new_case; mkdir -p "$WORK/fx/vv"; printf 'LAB_PREFIX="vv-"\nLAB_VMS="vv-a vv-B"\nLAB_CP="vv-a"\nlab_vm_spec() { echo "1 1G 1G"; }\n' > "$WORK/fx/vv/env.sh"
RC=0; env PATH="$STUBPATH" LAB_ROOT="$WORK/fx" /bin/bash "$LAB" up vv >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "LAB_VMS tên không hợp lệ: từ chối" $((a+b))

new_case; RC=0; MP_LIST='tst-a,Running,1.1.1.1,,x,""'; export MP_LIST
printf '%s' "" | env PATH="$STUBPATH" LAB_WAIT_SECS=abc /bin/bash "$LAB" up tst >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; has "$ERR" '^lab: '; b=$?; ! has "$ERR" 'syntax\|arithmetic'; c=$?
check "LAB_WAIT_SECS không phải số: thông báo lab:" $((a+b+c))

new_case; MP_FAIL=list; export MP_FAIL; run_lab "" up tst
[ "$RC" -ne 0 ]; a=$?; has "$ERR" '^lab: không đọc được danh sách'; b=$?; ! has "$MP_LOG" '^launch'; c=$?
check "mp list lỗi: up chết, không launch" $((a+b+c))
run_lab "y
" destroy tst --yes
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^delete'; b=$?
check "mp list lỗi: destroy chết, không delete" $((a+b))

# ---- Lint: lib và lab không chứa chương trình cụ thể ----
hits="$(grep -ril "cka\|kubernetes" "$LABS/lib" "$LABS/lab" 2>/dev/null)"
[ -z "$hits" ]; check "lib/lab không chứa 'cka' hay 'kubernetes'" $?

echo "---"
echo "$((CASES-FAILS))/$CASES ca đạt"
[ "$FAILS" -eq 0 ]
