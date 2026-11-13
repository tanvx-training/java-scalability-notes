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
  unset MP_LIST MP_FAIL MP_SNAPS TRACE FAIL
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
            "delete --purge=1 tst-a" \
            "stop -a:-v tst-a" "stop -at:-v tst-a" "delete -pa:-v tst-a" "delete -a:--purge tst-a" \
            "stop --all:-v tst-a" "stop -v2 tst-a" "stop -vv tst-a"; do
  new_case; guard_direct $args
  [ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
  check "mp $args: từ chối, log rỗng" $((a+b))
done
new_case; guard_direct stop "--force --all" tst-a
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "mp stop '--force --all' (token có khoảng trắng): từ chối" $((a+b))
new_case; guard_direct stop "-v tst-a"
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "mp stop '-v tst-a' (một token): từ chối" $((a+b))
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

# ---- Lệnh theo buổi ----
RUNNING='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Running,10.0.0.2,,Ubuntu 24.04 LTS,""'
SNAPS_A1="tst-a.m-a1 tst-b.m-a1"
trace_is() { [ "$(tr '\n' ' ' < "$TRACE" | sed 's/ $//')" = "$1" ]; }
sess_case() { new_case; MP_LIST="$RUNNING"; export MP_LIST; TRACE="$WORK/trace"; : > "$TRACE"; export TRACE; }

sess_case; run_lab "" verify tst a2
[ "$RC" -eq 0 ]; a=$?; trace_is "a2/verify"; b=$?; has "$OUT" '✓ a2 verify'; c=$?; has "$OUT" '→ 1/1 đạt'; d=$?
check "verify tst a2: chạy a2/verify.sh, mã 0" $((a+b+c+d))
sess_case; FAIL=a2/verify; export FAIL; run_lab "" verify tst a2
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '✗ a2 verify'; b=$?
check "verify tst a2 hỏng: mã 1, in ✗" $((a+b))

sess_case; run_lab "" check tst a2
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/verify"; b=$?
check "check tst a2: chạy a1/verify.sh" $((a+b))
sess_case; run_lab "" check tst a3
[ "$RC" -eq 0 ]; a=$?; trace_is "a3/check"; b=$?
check "check tst a3: chạy a3/check.sh, không chạy a2/verify.sh" $((a+b))
sess_case; run_lab "" check tst a1
[ "$RC" -eq 0 ]; a=$?; [ ! -s "$TRACE" ]; b=$?
check "check tst a1: chỉ kiểm VM đang chạy" $((a+b))
sess_case; FAIL=a1/verify; export FAIL; run_lab "" check tst a2
[ "$RC" -eq 1 ]; a=$?
check "check tst a2 hỏng: mã 1" $a

sess_case; run_lab "" begin tst a2
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/verify a2/setup b1/run"; b=$?
check "begin tst a2: check, setup.sh, lab_break chạy breaks/b1/run.sh" $((a+b))
sess_case; FAIL=a1/verify; export FAIL; run_lab "" begin tst a2
[ "$RC" -eq 1 ]; a=$?; trace_is "a1/verify"; b=$?; has "$ERR" 'lab restore tst a1'; c=$?
check "begin tst a2, check hỏng: không setup, gợi ý restore a1" $((a+b+c))
sess_case; run_lab "" begin tst a1
[ "$RC" -eq 0 ]; a=$?; trace_is ""; b=$?; has "$OUT" 'không có setup.sh'; c=$?
check "begin tst a1: không có setup.sh thì báo, mã 0" $((a+b+c))

sess_case; run_lab "" break tst b1
[ "$RC" -eq 0 ]; a=$?; trace_is "b1/run"; b=$?
check "break tst b1: chạy breaks/b1/run.sh" $((a+b))
sess_case; run_lab "" break tst nope
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "lab: không có lỗi 'nope'"; b=$?
check "break tst nope: lỗi, mã 1" $((a+b))
sess_case; run_lab "" break tst '../x'
[ "$RC" -eq 1 ]; a=$?; has "$ERR" '^lab: '; b=$?
check "break tên có '..': từ chối" $((a+b))

sess_case; run_lab "" verify tst zz
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "^lab: không có buổi 'zz' trong chương trình 'tst'$"; b=$?
check "verify tst zz: không có buổi, mã 1" $((a+b))
sess_case; run_lab "" verify tst a4
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "^lab: buổi 'a4' chưa có script$"; b=$?
check "verify tst a4 (trong ORDER, không thư mục): mã 1" $((a+b))
sess_case; run_lab "" verify tst '../a2'
[ "$RC" -eq 1 ]; a=$?; has "$ERR" '^lab: không có buổi'; b=$?
check "verify id có '..': từ chối" $((a+b))
sess_case; MP_LIST='tst-a,Stopped,,,x,""
tst-b,Running,10.0.0.2,,x,""'; export MP_LIST; run_lab "" verify tst a2
[ "$RC" -eq 1 ]; a=$?; has "$ERR" '^lab: VM tst-a đang dừng, chạy: ./lab up tst$'; b=$?; trace_is ""; c=$?
check "verify khi VM Stopped: báo ./lab up, không chạy script" $((a+b+c))

sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a2/apply a3/apply a3/verify"; b=$?
has "$MP_LOG" '^stop tst-a tst-b$'; c=$?
has "$MP_LOG" '^restore tst-a.m-a1 --destructive$'; d=$?; has "$MP_LOG" '^restore tst-b.m-a1 --destructive$'; e=$?
has "$MP_LOG" '^start tst-a tst-b$'; f=$?; ! has "$MP_LOG" '^delete'; g=$?
check "restore tst a3 --yes có mốc a1: stop, restore từng VM, start, apply a2 a3, verify a3" $((a+b+c+d+e+f+g))
sess_case; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a2/apply a3/apply a3/verify"; b=$?
! has "$MP_LOG" '^restore'; c=$?; has "$MP_LOG" '^delete --purge tst-a tst-b$'; d=$?
check "restore tst a3 --yes không snapshot: dựng lại, apply từ đầu" $((a+b+c+d))
sess_case; MP_SNAPS="tst-a.m-a1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a2/apply a3/apply a3/verify"; b=$?; ! has "$MP_LOG" '^restore'; c=$?
check "restore: snapshot chỉ có trên một VM thì không dùng" $((a+b+c))
sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a1 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/verify"; b=$?
check "restore tst a1 (đúng mốc): không apply, chỉ verify" $((a+b))
sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "n
" restore tst a3
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^stop\|^restore\|^delete'; b=$?; has "$OUT" 'tst-a'; c=$?; trace_is ""; d=$?
check "restore trả lời n: không đổi gì, có liệt kê VM" $((a+b+c+d))
sess_case; run_lab "" restore tst a3
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^delete'; b=$?
check "restore stdin rỗng: không xoá VM" $((a+b))
sess_case; FAIL=a2/apply; export FAIL; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 1 ]; a=$?; trace_is "a2/apply"; b=$?; has "$ERR" "apply.sh của 'a2' lỗi"; c=$?
check "restore: apply hỏng thì dừng, mã 1" $((a+b+c))
sess_case; FAIL=a3/verify; export FAIL; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 1 ]; a=$?
check "restore: verify cuối hỏng thì mã 1" $a

sess_case; run_lab "" selftest tst --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a1/verify a2/apply a2/verify a3/apply a3/verify"; b=$?
has "$MP_LOG" '^snapshot tst-a --name m-a1$'; c=$?; has "$MP_LOG" '^snapshot tst-b --name m-a1$'; d=$?
has "$MP_LOG" '^delete --purge tst-a tst-b$'; e=$?; has "$OUT" "bỏ qua 'a4'"; f=$?
check "selftest --yes: apply+verify từng buổi có thư mục, chụp mốc a1, bỏ qua a4" $((a+b+c+d+e+f))
sess_case; FAIL=a2/verify; export FAIL; run_lab "" selftest tst --yes
[ "$RC" -eq 1 ]; a=$?; trace_is "a1/apply a1/verify a2/apply a2/verify"; b=$?; has "$ERR" "verify.sh của 'a2' chưa đạt"; c=$?
check "selftest dừng ở buổi đầu tiên hỏng" $((a+b+c))
sess_case; run_lab "" selftest tst --from a2
[ "$RC" -eq 0 ]; a=$?; trace_is "a2/apply a2/verify a3/apply a3/verify"; b=$?; ! has "$MP_LOG" '^delete'; c=$?
! has "$MP_LOG" '^snapshot'; d=$?
check "selftest --from a2: không xoá VM, bắt đầu từ a2" $((a+b+c+d))
sess_case; run_lab "n
" selftest tst
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^delete'; b=$?; trace_is ""; c=$?
check "selftest trả lời n: không xoá VM" $((a+b+c))

sess_case; run_lab "" snapshot tst manual-1
[ "$RC" -eq 0 ]; a=$?; has "$MP_LOG" '^stop tst-a tst-b$'; b=$?
has "$MP_LOG" '^snapshot tst-a --name manual-1$'; c=$?; has "$MP_LOG" '^snapshot tst-b --name manual-1$'; d=$?
has "$MP_LOG" '^start tst-a tst-b$'; e=$?
check "snapshot tst manual-1: stop, snapshot từng VM, start" $((a+b+c+d+e))
sess_case; MP_SNAPS="tst-a.manual-1"; export MP_SNAPS; run_lab "" snapshot tst manual-1
has "$MP_LOG" '^delete --purge tst-a.manual-1$'; a=$?
check "snapshot trùng tên: xoá bản cũ trước khi chụp" $a
sess_case; run_lab "" snapshot tst 'bad name;x'
[ "$RC" -eq 1 ]; a=$?; ! has "$MP_LOG" '^snapshot'; b=$?
check "snapshot tên không hợp lệ: từ chối" $((a+b))

sess_case; run_lab "" mock tst m1 score
[ "$RC" -eq 0 ]; a=$?
tail -n 1 "$OUT" | grep -Eq '^devprep-mock:v1:tst:m1:[0-9]{4}-[0-9]{2}-[0-9]{2}:a=3/6,b=2/4$'; b=$?
check "mock tst m1 score: dòng cuối là devprep-mock đúng định dạng" $((a+b))
sess_case; run_lab "" mock tst m1 start
[ "$RC" -eq 0 ]; a=$?; trace_is "m1/setup"; b=$?
check "mock tst m1 start: chạy mocks/m1/setup.sh" $((a+b))
sess_case; run_lab "" mock tst m9 score
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "đề mock 'm9' chưa có script"; b=$?
check "mock đề không có: mã 1" $((a+b))
sess_case; run_lab "" mock tst m1 frob
[ "$RC" -eq 1 ]; a=$?
check "mock hành động lạ: mã 1" $a
bad="$WORK/fx2"; mkdir -p "$bad/tst/mocks/mx" "$bad/tst/sessions"; cp "$HERE/fixtures/tst/env.sh" "$bad/tst/"
printf 'echo "q1 a 5 3"\n' > "$bad/tst/mocks/mx/score.sh"
sess_case; RC=0; printf '' | env PATH="$STUBPATH" LAB_ROOT="$bad" /bin/bash "$LAB" mock tst mx score >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -eq 1 ]; a=$?; ! has "$OUT" 'devprep-mock'; b=$?
check "mock score got > max: lỗi, không in dòng kết quả" $((a+b))
printf 'echo "q1 a 1 3"\necho "đang chấm..."\n' > "$bad/tst/mocks/mx/score.sh"
sess_case; RC=0; printf '' | env PATH="$STUBPATH" LAB_ROOT="$bad" /bin/bash "$LAB" mock tst mx score >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -eq 1 ]; a=$?; ! has "$OUT" 'devprep-mock'; b=$?
check "mock score dòng sai định dạng: lỗi, không in dòng kết quả" $((a+b))

# ---- assert ----
assert_run() { # assert_run <thân script>: chạy trong subshell sạch với assert.sh
  RC=0; /bin/bash -c ". \"$LABS/lib/assert.sh\"; $1" >"$OUT" 2>"$ERR" || RC=$?
}
new_case; assert_run 'expect_eq "gt" "ok" echo ok; assert_summary'
[ "$RC" -eq 0 ]; a=$?; has "$OUT" '  ✓ gt'; b=$?; has "$OUT" '  → 1/1 đạt'; c=$?
check "assert: expect_eq đúng in ✓, summary 0" $((a+b+c))
new_case; assert_run 'expect_eq "gt" "ok" echo bad; assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '  ✗ gt (thực tế: bad)'; b=$?; has "$OUT" '  → 0/1 đạt'; c=$?
check "assert: expect_eq sai in ✗ kèm giá trị thực tế, summary 1" $((a+b+c))
new_case; assert_run 'expect_ok a true; expect_fail b false; expect_match c "^x+$" echo xxx; expect_eq d "1" echo " 1 "; assert_summary'
[ "$RC" -eq 0 ]; a=$?; has "$OUT" '→ 4/4 đạt'; b=$?
check "assert: ok/fail/match/eq cùng đạt" $((a+b))
new_case; assert_run 'expect_ok a false; expect_fail b true; expect_match c "^y$" echo x; assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '✗ a (thực tế: mã 1'; b=$?; has "$OUT" '✗ b'; c=$?; has "$OUT" '✗ c (thực tế: x)'; d=$?; has "$OUT" '→ 0/3 đạt'; e=$?
check "assert: ok/fail/match sai đều in ✗" $((a+b+c+d+e))
new_case; assert_run 'expect_ok a true; expect_eq b 1 echo 2; expect_ok c true; assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '→ 2/3 đạt'; b=$?
check "assert_summary trả 1 khi có ít nhất một ✗" $((a+b))

# ---- mp: snapshot, restore, info, delete snapshot ----
for args in "snapshot tst-a --name x" "snapshot tst-a -n x --comment hi" "info tst-a.x --format csv" "delete --purge tst-a.x" "restore --destructive tst-a.x"; do
  new_case; MP_SNAPS="tst-a.x"; export MP_SNAPS; guard_direct $args
  [ "$RC" -eq 0 ]; a=$?; [ "$(wc -l < "$MP_LOG" | tr -d ' ')" = 1 ]; b=$?
  check "mp $args: cho phép, một lời gọi" $((a+b))
done
for args in "snapshot cp1 --name x" "snapshot tst-a --name x cp1" "restore --destructive cp1.x" "restore tst-a.x cp1.y" "info cp1.x --format csv" \
            "delete --purge cp1.x" "snapshot tst-a --all" "restore --force tst-a.x" "info --snapshots tst-a"; do
  new_case; guard_direct $args
  [ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
  check "mp $args: từ chối, log rỗng" $((a+b))
done

# ---- Lint: lib và lab không chứa chương trình cụ thể ----
hits="$(grep -ril "cka\|kubernetes" "$LABS/lib" "$LABS/lab" 2>/dev/null)"
[ -z "$hits" ]; check "lib/lab không chứa 'cka' hay 'kubernetes'" $?

echo "---"
echo "$((CASES-FAILS))/$CASES ca đạt"
[ "$FAILS" -eq 0 ]
