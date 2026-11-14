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
  export DK_LOG="$WORK/dk.log"; : > "$DK_LOG"
  OUT="$WORK/out"; ERR="$WORK/err"
  unset MP_LIST MP_FAIL MP_FAIL_RC MP_SNAPS MP_NOCTR DK_MISSING TRACE FAIL
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

# Đối số không bị mở rộng glob: 't*' không được thành 'tst' dù thư mục hiện tại có tệp tên tst.
new_case; mkdir -p "$WORK/globdir"; : > "$WORK/globdir/tst"
RC=0; (cd "$WORK/globdir" && env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" /bin/bash "$LAB" status 't*' >"$OUT" 2>"$ERR") || RC=$?
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "không có chương trình 't\*'"; b=$?; log_empty; c=$?
check "đối số 't*' không bị glob thành tên chương trình" $((a+b+c))

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
[ "$RC" -eq 0 ]; a=$?; tail -n 3 "$TRACE" | head -n 2 | tr "\n" " " | grep -q "^a2/setup b1/run "; b=$?
check "begin tst a2: check, setup.sh, lab_break chạy breaks/b1/run.sh" $((a+b))
sess_case; FAIL=a1/verify; export FAIL; run_lab "" begin tst a2
[ "$RC" -eq 1 ]; a=$?; trace_is "a1/verify"; b=$?; has "$ERR" 'chưa đạt, thử: ./labs/lab restore tst a1$'; c=$?
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
[ "$RC" -eq 1 ]; a=$?; has "$ERR" '^lab: VM tst-a đang dừng, chạy: ./labs/lab up tst$'; b=$?; trace_is ""; c=$?
check "verify khi VM Stopped: báo ./labs/lab up, không chạy script" $((a+b+c))

sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a2/apply a3/apply a3/verify"; b=$?
has "$MP_LOG" '^stop tst-a tst-b$'; c=$?
has "$MP_LOG" '^restore tst-a.m-a1 --destructive$'; d=$?; has "$MP_LOG" '^restore tst-b.m-a1 --destructive$'; e=$?
has "$MP_LOG" '^start tst-a tst-b$'; f=$?; ! has "$MP_LOG" '^delete'; g=$?
check "restore tst a3 --yes có mốc a1: stop, restore từng VM, start, apply lại a1 (mốc) rồi a2 a3, verify a3" $((a+b+c+d+e+f+g))
sess_case; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a2/apply a3/apply a3/verify"; b=$?
! has "$MP_LOG" '^restore'; c=$?; has "$MP_LOG" '^delete --purge tst-a tst-b$'; d=$?
check "restore tst a3 --yes không snapshot: dựng lại, apply từ đầu" $((a+b+c+d))
sess_case; MP_SNAPS="tst-a.m-a1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a2/apply a3/apply a3/verify"; b=$?; ! has "$MP_LOG" '^restore'; c=$?
check "restore: snapshot chỉ có trên một VM thì không dùng" $((a+b+c))
sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a1 --yes
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a1/verify"; b=$?
check "restore tst a1 (đúng mốc): apply lại a1 (trạng thái không bền mất khi chụp lúc VM dừng), verify" $((a+b))
sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "n
" restore tst a3
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^stop\|^restore\|^delete'; b=$?; has "$OUT" 'tst-a'; c=$?; trace_is ""; d=$?
check "restore trả lời n: không đổi gì, có liệt kê VM" $((a+b+c+d))
sess_case; run_lab "" restore tst a3
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^delete'; b=$?
check "restore stdin rỗng: không xoá VM" $((a+b))
sess_case; FAIL=a2/apply; export FAIL; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 1 ]; a=$?; trace_is "a1/apply a2/apply"; b=$?; has "$ERR" "apply.sh của 'a2' lỗi"; c=$?
check "restore: apply hỏng thì dừng, mã 1" $((a+b+c))
sess_case; FAIL=a3/verify; export FAIL; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" restore tst a3 --yes
[ "$RC" -eq 1 ]; a=$?
check "restore: verify cuối hỏng thì mã 1" $a
# Dò snapshot lỗi (mã khác 0 và khác 2 của "không có") phải dừng, không được coi là "không có mốc" rồi xoá VM.
for yes in "--yes" ""; do
  sess_case; MP_SNAPS="$SNAPS_A1"; MP_FAIL=info; MP_FAIL_RC=1; export MP_SNAPS MP_FAIL MP_FAIL_RC
  run_lab "y
" restore tst a3 $yes
  [ "$RC" -ne 0 ]; a=$?; has "$ERR" 'không dò được snapshot tst-a.m-a1 (multipass trả mã 1)'; b=$?
  ! has "$MP_LOG" '^delete\|^restore\|^stop\|^launch'; c=$?; trace_is ""; d=$?
  check "restore ${yes:-(trả lời y)} khi dò snapshot lỗi: dừng, không xoá/khôi phục/dừng VM" $((a+b+c+d))
done
sess_case; MP_FAIL=info; MP_FAIL_RC=3; export MP_FAIL MP_FAIL_RC; run_lab "" snapshot tst manual-1 --yes
[ "$RC" -ne 0 ]; a=$?; has "$ERR" 'không dò được snapshot'; b=$?; ! has "$MP_LOG" '^delete\|^snapshot\|^stop'; c=$?
check "snapshot khi dò snapshot lỗi: dừng trước khi dừng VM" $((a+b+c))
sess_case; run_lab "" restore tst a3 --yes
[ "$RC" -eq 0 ]; a=$?; has "$MP_LOG" '^delete --purge tst-a tst-b$'; b=$?
check "restore khi multipass trả 2 kèm 'No such snapshot': dựng lại như cũ" $((a+b))
# Mã 2 là mã lỗi chung của multipass: không kèm thông báo "không có" thì vẫn là lỗi dò, phải dừng.
sess_case; MP_FAIL=info; export MP_FAIL; run_lab "" restore tst a3 --yes
[ "$RC" -ne 0 ]; a=$?; has "$ERR" 'không dò được snapshot'; b=$?; ! has "$MP_LOG" '^delete\|^restore\|^stop\|^launch'; c=$?
check "restore --yes khi multipass trả 2 với lỗi khác: dừng, không xoá VM" $((a+b+c))

# Restore về buổi trước mốc đầu tiên: lời hỏi nói rõ snapshot (cả mốc sau) sẽ mất theo VM.
ms="$WORK/fx-ms"; rm -rf "$ms"; cp -R "$HERE/fixtures/tst" "$ms.tmp"; mkdir -p "$ms"; mv "$ms.tmp" "$ms/tst"
printf 'a2 m-a2\n' > "$ms/tst/milestones"
sess_case; MP_SNAPS="tst-a.m-a2 tst-b.m-a2"; export MP_SNAPS
RC=0; printf 'n\n' | env PATH="$STUBPATH" LAB_ROOT="$ms" LAB_WAIT_SECS=2 LAB_POLL_SECS=0 /bin/bash "$LAB" restore tst a1 >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; has "$OUT" 'xoá luôn MỌI snapshot'; b=$?; has "$OUT" 'gồm cả mốc: m-a2'; c=$?
has "$OUT" './labs/lab selftest tst'; d=$?; ! has "$MP_LOG" '^delete\|^stop\|^restore'; e=$?
check "restore về trước mốc đầu: hỏi kèm cảnh báo mất snapshot m-a2 và cách chụp lại; trả lời n thì không đổi gì" $((a+b+c+d+e))
sess_case; MP_SNAPS="tst-a.m-a2 tst-b.m-a2"; export MP_SNAPS
RC=0; printf '' | env PATH="$STUBPATH" LAB_ROOT="$ms" LAB_WAIT_SECS=2 LAB_POLL_SECS=0 /bin/bash "$LAB" restore tst a1 --yes >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -eq 0 ]; a=$?; trace_is "a1/apply a1/verify"; b=$?; has "$MP_LOG" '^delete --purge tst-a tst-b$'; c=$?
check "restore về trước mốc đầu --yes: dựng lại, áp a1, verify" $((a+b+c))

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
sess_case; MP_SNAPS="tst-a.manual-1 tst-b.manual-1"; export MP_SNAPS; run_lab "" snapshot tst manual-1 --yes
has "$MP_LOG" '^delete --purge tst-a.manual-1$'; a=$?; has "$MP_LOG" '^delete --purge tst-b.manual-1$'; b=$?
[ "$(grep -n '^delete' "$MP_LOG" | tail -n 1 | cut -d: -f1)" -lt "$(grep -n '^snapshot' "$MP_LOG" | head -n 1 | cut -d: -f1)" ]; c=$?
check "snapshot trùng tên --yes: xoá bản cũ trên mọi VM trước khi chụp" $((a+b+c))
sess_case; MP_SNAPS="tst-a.manual-1"; export MP_SNAPS; run_lab "n
" snapshot tst manual-1
[ "$RC" -ne 0 ]; a=$?; ! has "$MP_LOG" '^delete\|^snapshot\|^stop'; b=$?
check "snapshot trùng tên, trả lời n: không đổi gì" $((a+b))
sess_case; MP_SNAPS="tst-a.manual-1"; export MP_SNAPS; run_lab "y
" snapshot tst manual-1
[ "$RC" -eq 0 ]; a=$?; has "$MP_LOG" '^snapshot tst-a --name manual-1$'; b=$?
check "snapshot trùng tên, trả lời y: ghi đè" $((a+b))
sess_case; MP_FAIL=snapshot; export MP_FAIL; run_lab "" snapshot tst manual-1
[ "$RC" -eq 1 ]; a=$?; has "$ERR" 'VM có thể đang dừng'; b=$?
check "snapshot lỗi: thông báo lab: nhắc VM có thể đang dừng" $((a+b))
sess_case; MP_SNAPS="$SNAPS_A1"; export MP_SNAPS; run_lab "" selftest tst --yes
[ "$(grep -c 'Ghi đè' "$ERR")" = 0 ]; a=$?
check "selftest chụp mốc không hỏi ghi đè" $a
sess_case; run_lab "" up tst junk
[ "$RC" -eq 1 ]; a=$?; has "$ERR" "^lab: 'up' không nhận đối số thừa"; b=$?; log_empty; c=$?
check "up tst junk: từ chối, log rỗng" $((a+b+c))
for c in down status destroy; do
  sess_case; run_lab "" $c tst junk
  [ "$RC" -eq 1 ]; a=$?; log_empty; b=$?
  check "$c tst junk: từ chối" $((a+b))
done
sess_case; run_lab "" begin tst a2
tail -n 1 "$TRACE" | grep -q 'sessions/a2$'; a=$?
check "SESSION_DIR không rò sau lab_break trong setup.sh" $a
sess_case; run_lab "" begin tst a2; run_lab "" begin tst a2
[ "$RC" -eq 0 ]; a=$?; [ "$(count "$TRACE" '^a1/verify')" = 2 ] && [ "$(count "$TRACE" '^a2/setup')" = 2 ]; b=$?
check "begin tst a2 hai lần (multipass): mỗi lần đều check rồi setup.sh như cũ" $((a+b))
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
new_case; assert_run 'expect_eq a x sh -c "echo x; exit 3"; expect_match b x sh -c "echo x; exit 4"; assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '✗ a (thực tế: mã 3'; b=$?; has "$OUT" '✗ b (thực tế: mã 4'; c=$?
check "assert: expect_eq/expect_match coi mã thoát khác 0 là ✗" $((a+b+c))
new_case; assert_run 'expect_ok a true; expect_eq b 1 echo 2; expect_ok c true; assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '→ 2/3 đạt'; b=$?
check "assert_summary trả 1 khi có ít nhất một ✗" $((a+b))
new_case; assert_run 'assert_summary'
[ "$RC" -eq 1 ]; a=$?; has "$OUT" '✗ không có kiểm tra nào'; b=$?; has "$OUT" '→ 0/0 đạt'; c=$?
check "assert_summary không có kiểm tra nào (0/0): ✗ kèm lý do, mã 1" $((a+b+c))

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

# ---- images ----
RUNNING2='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Running,10.0.0.2,,Ubuntu 24.04 LTS,""'
new_case; MP_LIST="$RUNNING2"; export MP_LIST; run_lab "" images tst
[ "$RC" -eq 0 ]; a=$?
[ "$(count "$DK_LOG" '^save')" = 1 ]; b=$?
has "$DK_LOG" '^save -o .* tst/a:1.0 tst/b:2.0'; c=$?
! has "$DK_LOG" '^build'; d=$?
[ "$(count "$MP_LOG" '^transfer')" = 2 ]; e=$?
has "$MP_LOG" '^transfer .* tst-a:/tmp/lab-images.tar'; f=$?
has "$MP_LOG" '^transfer .* tst-b:/tmp/lab-images.tar'; g=$?
[ "$(count "$MP_LOG" 'exec tst-.* -- bash -lc .* _ sudo ctr -n tst.ns images import /tmp/lab-images.tar')" = 2 ]; h=$?
check "images tst: save một lần, transfer + ctr import cho từng VM, không build khi đã có" $((a+b+c+d+e+f+g+h))

new_case; MP_LIST="$RUNNING2"; DK_MISSING=1; export MP_LIST DK_MISSING; run_lab "" images tst
[ "$RC" -eq 0 ]; a=$?; [ "$(count "$DK_LOG" '^build')" = 2 ]; b=$?
check "images tst: thiếu image thì gọi lab_build_images" $((a+b))

new_case; MP_LIST="$RUNNING2"; MP_NOCTR="tst-b"; export MP_LIST MP_NOCTR; run_lab "" images tst
[ "$RC" -eq 0 ]; a=$?
has "$MP_LOG" '^transfer .* tst-a:'; b=$?
! has "$MP_LOG" '^transfer .* tst-b:'; c=$?
has "$OUT" '^lab: cảnh báo: bỏ qua tst-b (chưa có containerd)'; d=$?
check "images tst: VM chưa có containerd bị bỏ qua kèm cảnh báo, VM kia vẫn nạp" $((a+b+c+d))

new_case; MP_LIST='tst-a,Running,10.0.0.1,,Ubuntu 24.04 LTS,""
tst-b,Stopped,,,Ubuntu 24.04 LTS,""'; export MP_LIST; run_lab "" images tst
[ "$RC" -eq 0 ]; a=$?; ! has "$MP_LOG" 'tst-b:'; b=$?; ! has "$MP_LOG" '^exec tst-b'; c=$?; has "$OUT" 'bỏ qua tst-b (chưa chạy)'; d=$?
check "images tst: VM đang dừng bị bỏ qua, không đụng tới" $((a+b+c+d))

new_case; MP_LIST="$RUNNING2"; MP_FAIL=transfer; export MP_LIST MP_FAIL; run_lab "" images tst
[ "$RC" -ne 0 ]; a=$?; has "$ERR" '^lab: '; b=$?
check "images tst: transfer lỗi thì thoát khác 0 kèm thông báo lab:" $((a+b))

for st in Stopped NOCTR; do
  new_case; DK_MISSING=1; export DK_MISSING
  if [ "$st" = NOCTR ]; then MP_LIST="$RUNNING2"; MP_NOCTR="tst-a tst-b"; export MP_NOCTR
  else MP_LIST='tst-a,Stopped,,,x,""
tst-b,Stopped,,,x,""'; fi
  export MP_LIST; run_lab "" images tst
  [ "$RC" -ne 0 ]; a=$?; has "$ERR" 'không có VM nào đang chạy và có containerd'; b=$?
  ! has "$DK_LOG" '^build\|^save'; c=$?; ! has "$MP_LOG" '^transfer'; d=$?
  check "images tst khi không VM nào nhận được ($st): mã khác 0, không build, không save" $((a+b+c+d))
done

new_case; MP_LIST="$RUNNING2"; export MP_LIST; run_lab "" images tst extra
[ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
check "images tst extra: từ chối đối số thừa" $((a+b))

for args in "transfer f cp1:/tmp/x" "exec cp1 -- bash -lc sudo"; do
  new_case; guard_direct $args
  [ "$RC" -ne 0 ]; a=$?; log_empty; b=$?
  check "mp $args: từ chối, log rỗng" $((a+b))
done

# ---- vm: multipass exec không bao giờ nhận stderr là /dev/null (1.16.3 treo khi đó) ----
new_case
RC=0
env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" MP_LOG="$MP_LOG" /bin/bash -c '
  . "$1/lib/core.sh"; . "$1/lib/multipass.sh"; . "$1/lib/assert.sh"; load_program tst
  vm tst-a "echo hi" 2>/dev/null
  vm tst-a "echo hi" >/dev/null 2>&1
  expect_eq "x" "" vm tst-a "echo hi"' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
[ "$(count "$MP_LOG" '^exec tst-a')" = 3 ]; a=$?; ! has "$MP_LOG" 'EXEC-STDERR-NULL'; b=$?; ! has "$MP_LOG" 'EXEC-STDOUT-NULL'; c=$?
check "vm: stdout/stderr của multipass exec không phải /dev/null kể cả khi người gọi bỏ chúng" $((a+b+c))

# ---- vm thất bại trong điều kiện if dưới set -e (apply/setup chạy set -e) không được thoát script ----
new_case
RC=0
env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" MP_LOG="$MP_LOG" MP_FAIL=exec /bin/bash -c '
  . "$1/lib/core.sh"; . "$1/lib/multipass.sh"; load_program tst
  set -e
  if vm tst-a "test -f /x"; then echo co; else echo khong; fi
  vm tst-a "false" || echo bat-duoc
  echo het' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -eq 0 ]; a=$?; has "$OUT" '^khong$'; b=$?; has "$OUT" '^bat-duoc$'; c=$?; has "$OUT" '^het$'; d=$?
check "vm lỗi trong if / || dưới set -e: script chạy tiếp (bash 3.2)" $((a+b+c+d))

# ---- vm: lệnh trong VM thoát mã 4 không được trả nguyên mã 4 cho multipass (1.16.3 chạy lại mãi) ----
new_case
RC=0
env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" MP_LOG="$MP_LOG" MP_EXEC_RUN=1 /bin/bash -c '
  . "$1/lib/core.sh"; . "$1/lib/multipass.sh"; load_program tst
  vm tst-a "echo \"a b\" | tr a A; exit 4"; echo "rc4=$?"
  vm tst-a "exit 3"; echo "rc3=$?"
  vm tst-a "echo ok"; echo "rc0=$?"' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
! has "$MP_LOG" 'EXEC-RC-4'; a=$?; has "$OUT" '^A b$'; b=$?; has "$OUT" '^rc4=104$'; c=$?
has "$OUT" '^rc3=3$'; d=$?; has "$OUT" '^ok$'; e=$?; has "$OUT" '^rc0=0$'; f=$?
check "vm: mã 4 của lệnh trong VM đổi thành 104, mã khác giữ nguyên, lệnh chạy đúng một lần" $((a+b+c+d+e+f))

# ---- vm: lệnh trong VM không thấy tham số vị trí của wrapper ($1, $#) ----
new_case
RC=0
env PATH="$STUBPATH" LAB_ROOT="$HERE/fixtures" MP_LOG="$MP_LOG" MP_EXEC_RUN=1 /bin/bash -c '
  . "$1/lib/core.sh"; . "$1/lib/multipass.sh"; load_program tst
  vm tst-a "echo n=\$# a=[\$1]"' _ "$LABS" >"$OUT" 2>"$ERR" || RC=$?
has "$OUT" '^n=0 a=\[\]$'; a=$?
check "vm: \$# = 0 và \$1 rỗng bên trong lệnh chạy trong VM" $a

# ---- Lint: lib và lab không chứa chương trình cụ thể ----
hits="$(grep -ril "cka\|kubernetes" "$LABS/lib" "$LABS/lab" 2>/dev/null)"
[ -z "$hits" ]; check "lib/lab không chứa 'cka' hay 'kubernetes'" $?
# Gợi ý in cho người học phải chạy được từ gốc repo: mọi chỗ dùng $LAB_CMD, không viết tay "./lab ".
hits="$(grep -n '\./lab ' "$LABS/lib"/*.sh "$LABS/lab" 2>/dev/null)"
[ -z "$hits" ]; check "lib/lab không viết tay './lab ' trong gợi ý" $?
new_case; MP_LIST="$RUNNING"; export MP_LIST; run_lab "" verify tst
[ "$RC" -eq 1 ]; a=$?; has "$ERR" '^lab: cách dùng: ./labs/lab verify tst <buổi>$'; b=$?
check "verify thiếu buổi: dòng cách dùng in ./labs/lab" $((a+b))

# ---- Driver local (chương trình loc): ghi thật, nên mỗi ca chạy trên bản chép của fixture ----
LOCBIN="$WORK/locbin"; mkdir -p "$LOCBIN"
for t in mvn java docker; do ln -sf "$HERE/stubs/$t" "$LOCBIN/$t"; done
LOCN=0
new_loc() { # new_loc: bản chép mới của fixture loc; không có multipass trên PATH
  new_case
  LOCN=$((LOCN+1)); LOCROOT="$WORK/loc.$LOCN"; mkdir -p "$LOCROOT"
  cp -R "$HERE/fixtures/loc" "$LOCROOT/loc"
  LOCW="$LOCROOT/loc/work"
  export MVN_LOG="$WORK/mvn.log"; : > "$MVN_LOG"
  unset MVN_REPORT MVN_COMPILE_FAIL LOCPATH
}
run_loc() { # run_loc <stdin> args…
  local input="$1"; shift
  RC=0
  printf '%s' "$input" | env PATH="${LOCPATH:-$LOCBIN:/usr/bin:/bin}" LAB_ROOT="$LOCROOT" /bin/bash "$LAB" "$@" >"$OUT" 2>"$ERR" || RC=$?
}
commits() { git -C "$LOCW" rev-list --count HEAD 2>/dev/null || echo 0; }

new_loc; run_loc "" up loc
[ "$RC" -eq 0 ]; a=$?
[ "$(commits)" = 1 ]; b=$?
[ "$(git -C "$LOCW" log -1 --format=%s)" = "lab: bản gốc" ]; c=$?
[ -f "$LOCW/pom.xml" ] && [ -f "$LOCW/src/A.java" ]; d=$?
run_loc "" up loc
[ "$RC" -eq 0 ]; e=$?; [ "$(commits)" = 1 ]; f=$?
log_empty; g=$?
check "up loc: kho git một commit 'lab: bản gốc', chạy lại không thêm commit, không gọi multipass" $((a+b+c+d+e+f+g))

new_loc; sed 's/^LAB_REQUIRE=.*/LAB_REQUIRE="git java thieu-lenh-xyz"/' "$HERE/fixtures/loc/env.sh" > "$LOCROOT/loc/env.sh"
run_loc "" up loc
[ "$RC" -ne 0 ]; a=$?; has "$ERR" 'thieu-lenh-xyz'; b=$?; [ ! -e "$LOCW" ]; c=$?
check "up loc thiếu lệnh trong LAB_REQUIRE: lỗi nêu tên lệnh, chưa tạo workspace" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" status loc
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "$LOCW"; b=$?; has "$OUT" 'lab: bản gốc'; c=$?
check "status loc: in đường dẫn workspace và nhãn commit cuối" $((a+b+c))

new_loc; sed 's/^LAB_PORTS=.*/LAB_PORTS="1"/' "$HERE/fixtures/loc/env.sh" > "$LOCROOT/loc/env.sh"
run_loc "" status loc
[ "$RC" -eq 0 ]; a=$?; has "$OUT" 'Cổng 1: trống'; b=$?
check "status loc: in trạng thái cổng trong LAB_PORTS" $((a+b))

new_loc; run_loc "" up loc; echo "x" > "$LOCW/untracked.txt"; run_loc "" destroy loc --yes
[ "$RC" -eq 0 ]; a=$?; [ ! -e "$LOCW" ]; b=$?
[ "$(ls "$LOCROOT/loc/backups" | wc -l | tr -d ' ')" = 1 ]; c=$?
tar tzf "$LOCROOT/loc/backups/"*.tar.gz | grep -q 'work/.git/HEAD'; d=$?
tar tzf "$LOCROOT/loc/backups/"*.tar.gz | grep -q 'work/untracked.txt'; e=$?
log_empty; f=$?
check "destroy loc --yes: work/ biến mất, backups/ đúng một gói có .git và tệp chưa theo dõi" $((a+b+c+d+e+f))

new_loc; run_loc "" up loc; run_loc "n
" destroy loc
[ "$RC" -ne 0 ]; a=$?; [ -d "$LOCW/.git" ]; b=$?; [ ! -e "$LOCROOT/loc/backups" ]; c=$?
check "destroy loc trả lời n: không đổi gì" $((a+b+c))

new_loc; mkdir "$LOCROOT/outside"; echo keep > "$LOCROOT/outside/f"; ln -s "$LOCROOT/outside" "$LOCW"
run_loc "" up loc; a=$RC
[ "$a" -ne 0 ]; a=$?
run_loc "" destroy loc --yes
[ "$RC" -ne 0 ]; b=$?
[ "$(ls -A "$LOCROOT/outside")" = f ] && [ ! -e "$LOCROOT/loc/backups" ]; c=$?
check "work là symlink ra ngoài: up và destroy từ chối, đích không bị đụng" $((a+b+c))

new_loc; mkdir "$LOCROOT/outside"; ln -s "$LOCROOT/outside" "$LOCROOT/loc/backups"
run_loc "" up loc; run_loc "" destroy loc --yes
[ "$RC" -ne 0 ]; a=$?; [ -d "$LOCW/.git" ]; b=$?; [ -z "$(ls -A "$LOCROOT/outside")" ]; c=$?
check "backups là symlink ra ngoài: destroy từ chối, workspace còn" $((a+b+c))

guard_ws() { # guard_ws <đường dẫn> [LAB_WORK_DIR]
  RC=0
  env PATH="$LOCBIN:/usr/bin:/bin" LAB_ROOT="$LOCROOT" LAB_WORK_DIR="${2:-}" /bin/bash -c '
    . "$1/lib/core.sh"; load_program loc; [ -n "$LAB_WORK_DIR" ] || unset LAB_WORK_DIR
    . "$1/lib/local.sh"; ws_guard "$2"' _ "$LABS" "$1" >"$OUT" 2>"$ERR" || RC=$?
}
new_loc
guard_ws "$LOCW/x"; [ "$RC" -eq 0 ]; a=$?
guard_ws "$LOCROOT/loc/backups/x.tar.gz"; [ "$RC" -eq 0 ]; b=$?
guard_ws "$LOCROOT/loc/app"; [ "$RC" -ne 0 ]; c=$?
guard_ws "$LOCW/../app"; [ "$RC" -ne 0 ]; d=$?
guard_ws "/etc/passwd"; [ "$RC" -ne 0 ]; e=$?
guard_ws "$LOCROOT/loc/app" "$WORK/sw"; [ "$RC" -ne 0 ]; f=$?
check "ws_guard: chỉ nhận work và backups, từ chối app, '..', đường dẫn ngoài" $((a+b+c+d+e+f))
new_loc
guard_ws "$WORK/sw/x" "$WORK/sw"; [ "$RC" -eq 0 ]; a=$?
guard_ws "/etc/x" "/etc"; [ "$RC" -ne 0 ]; b=$?
check "ws_guard: LAB_WORK_DIR chỉ nhận khi nằm trong thư mục tạm" $((a+b))

new_loc; run_loc "" snapshot loc x
[ "$RC" -ne 0 ]; a=$?; has "$ERR" "không áp dụng"; b=$?
run_loc "" images loc
[ "$RC" -ne 0 ]; c=$?; has "$ERR" "không áp dụng"; d=$?
run_loc "" mock loc m start
[ "$RC" -ne 0 ]; e=$?; has "$ERR" "không áp dụng"; f=$?
log_empty; g=$?
check "snapshot/images/mock với loc: lỗi 'không áp dụng', không gọi multipass" $((a+b+c+d+e+f+g))

new_loc; sed 's/^LAB_DRIVER=.*/LAB_DRIVER="kvm"/' "$HERE/fixtures/loc/env.sh" > "$LOCROOT/loc/env.sh"
run_loc "" up loc
[ "$RC" -ne 0 ]; a=$?; has "$ERR" 'kvm'; b=$?; [ ! -e "$LOCW" ]; c=$?
check "LAB_DRIVER=kvm: từ chối" $((a+b+c))

new_loc; { cat "$HERE/fixtures/loc/env.sh"; echo 'LAB_COMPOSE_FILE="dc.yml"'; echo 'LAB_COMPOSE_PROJECT="locproj"'; } > "$LOCROOT/loc/env.sh"
run_loc "" up loc; a=$RC
has "$DK_LOG" "^compose -f $LOCROOT/loc/dc.yml -p locproj up"; b=$?
run_loc "" down loc; c=$RC
has "$DK_LOG" "^compose -f $LOCROOT/loc/dc.yml -p locproj down"; d=$?
[ "$(count "$DK_LOG" .)" = 2 ]; e=$?
check "loc có compose: up/down gọi docker compose đúng tệp và project, không gì khác" $((a+c+b+d+e))

new_loc; { cat "$HERE/fixtures/loc/env.sh"; echo 'LAB_COMPOSE_FILE="dc.yml"'; } > "$LOCROOT/loc/env.sh"
run_loc "" up loc
[ "$RC" -ne 0 ]; a=$?; [ ! -s "$DK_LOG" ]; b=$?
check "LAB_COMPOSE_FILE thiếu LAB_COMPOSE_PROJECT: từ chối" $((a+b))

new_loc; run_loc "" down loc
[ "$RC" -eq 0 ]; a=$?; [ ! -s "$DK_LOG" ]; b=$?
check "down loc không compose: không làm gì, không gọi docker" $((a+b))


# ---- Driver local: lệnh theo buổi (begin/verify/restore/break/selftest) và chấm bằng báo cáo surefire ----
SF="$HERE/fixtures/surefire"
FIXDATE="$WORK/fixdate"; mkdir -p "$FIXDATE"   # date cố định để hai lần chạy rơi vào cùng một giây
cat > "$FIXDATE/date" <<'EOF'
#!/bin/bash
case "$*" in *%Y*) echo "20261114-101010"; exit 0 ;; esac
exec /bin/date "$@"
EOF
GITFAIL="$WORK/gitfail"; mkdir -p "$GITFAIL"   # git mà mọi lệnh commit đều lỗi
cat > "$GITFAIL/git" <<'EOF'
#!/bin/bash
for a in "$@"; do [ "$a" = commit ] && { echo "stub git: commit lỗi" >&2; exit 1; }; done
exec /usr/bin/git "$@"
EOF
chmod +x "$FIXDATE/date" "$GITFAIL/git"
gw() { git -C "$LOCW" -c commit.gpgsign=false "$@" 2>/dev/null; }
head_subj() { gw log -1 --format=%s; }
has_subj() { gw log --format=%s | grep -Fxq -- "$1"; }
backups() { gw for-each-ref --format='%(refname:short)' 'refs/heads/backup/*'; }
# same_tree <thư mục kỳ vọng>: workspace (bỏ .git, target) có đúng danh sách tệp và nội dung như kỳ vọng
same_tree() {
  local f
  [ "$(cd "$1" && find . -type f | sort)" = \
    "$(cd "$LOCW" && find . -path ./.git -prune -o -path ./target -prune -o -type f -print | sort)" ] || return 1
  for f in $(cd "$1" && find . -type f); do cmp -s "$1/$f" "$LOCW/$f" || return 1; done
}
LS="$HERE/fixtures/loc/sessions"

new_loc; run_loc "" up loc; run_loc "" begin loc a1
[ "$RC" -eq 0 ]; a=$?
[ -f "$LOCW/src/test/a1/A1.case" ]; b=$?
[ "$(head_subj)" = "lab: đầu buổi a1" ]; c=$?
has_subj "lab: trước buổi a1"; d=$?
gw ls-files --error-unmatch src/test/a1/A1.case >/dev/null 2>&1; e=$?
log_empty; f=$?
check "begin loc a1: test của a1 vào workspace, commit 'trước buổi a1' rồi 'đầu buổi a1', không gọi multipass" $((a+b+c+d+e+f))

new_loc; run_loc "" begin loc a1
[ "$RC" -ne 0 ]; a=$?; has "$ERR" './labs/lab up loc'; b=$?; [ ! -e "$LOCW" ]; c=$?
check "begin loc khi chưa có workspace: từ chối, gợi ý up, không tạo gì" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" begin loc a1
MVN_REPORT="$SF/a1-fail.xml"; export MVN_REPORT; run_loc "" verify loc a1
[ "$RC" -ne 0 ]; a=$?; has "$OUT" '✓ A có hello'; b=$?; has "$OUT" '✗ A có world'; c=$?
has "$OUT" '1/2 đạt'; d=$?; has_subj "lab: xong buổi a1"; [ $? -ne 0 ]; e=$?
has "$MVN_LOG" "^$LOCW -q test"; f=$?
check "verify loc a1 có một testcase lỗi: dòng đó ✗, 1/2, mã khác 0, không commit 'xong buổi', mvn chạy trong workspace" $((a+b+c+d+e+f))

new_loc; run_loc "" up loc; run_loc "" begin loc a1
MVN_REPORT="$SF/a1-pass.xml"; export MVN_REPORT; run_loc "" verify loc a1
[ "$RC" -eq 0 ]; a=$?; has "$OUT" '2/2 đạt'; b=$?; [ "$(head_subj)" = "lab: xong buổi a1" ]; c=$?
[ -z "$(gw status --porcelain)" ]; d=$?
check "verify loc a1 đạt hết: commit 'lab: xong buổi a1', cây sạch (target/ không vào kho)" $((a+b+c+d))
unset MVN_REPORT; MVN_COMPILE_FAIL=1; export MVN_COMPILE_FAIL; run_loc "" verify loc a1
[ "$RC" -ne 0 ]; a=$?; has "$OUT" '✓'; [ $? -ne 0 ]; b=$?; [ "$(count "$OUT" '✗')" = 2 ]; c=$?
has "$OUT" '0/2 đạt'; d=$?; has "$OUT" 'không chạy'; e=$?
[ -e "$LOCW/target/surefire-reports/TEST-a1-pass.xml" ]; [ $? -ne 0 ]; f=$?
check "verify khi Maven lỗi biên dịch và còn báo cáo cũ toàn đạt: mọi dòng ✗ 'không chạy', báo cáo cũ đã xoá" $((a+b+c+d+e+f))

new_loc; run_loc "" up loc; run_loc "" verify loc a1
[ "$RC" -ne 0 ]; a=$?; has "$OUT" '0/2 đạt'; b=$?; has "$OUT" '✓'; [ $? -ne 0 ]; c=$?
check "verify khi Maven đạt nhưng không test nào chạy: mọi dòng ✗" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" begin loc a1; run_loc "" begin loc a2
[ "$RC" -ne 0 ]; a=$?; has "$ERR" './labs/lab restore loc a1'; b=$?
has_subj "lab: trước buổi a2"; [ $? -ne 0 ]; c=$?; [ ! -e "$LOCW/src/test/a2" ]; d=$?
[ "$(count "$MVN_LOG" ' -q test')" = 1 ]; e=$?
check "begin loc a2 khi a1 chưa đạt: chạy verify của a1, từ chối, gợi ý './labs/lab restore loc a1', không commit" $((a+b+c+d+e))

new_loc; run_loc "" up loc; run_loc "" begin loc a1
printf 'class A { String hello = "world"; }\n' > "$LOCW/src/A.java"
n0="$(commits)"; run_loc "" check loc a2
[ "$RC" -eq 0 ]; a=$?; [ "$(commits)" = "$n0" ]; b=$?
run_loc "" begin loc a2
[ "$RC" -eq 0 ]; c=$?
[ ! -e "$LOCW/src/test/a1/A1.case" ] && [ -f "$LOCW/src/test/a2/A2.case" ]; d=$?
[ "$(cat "$LOCW/setup-a2.txt" 2>/dev/null)" = "$LOCW" ]; e=$?
[ "$(head_subj)" = "lab: đầu buổi a2" ] && gw ls-files --error-unmatch setup-a2.txt >/dev/null 2>&1; f=$?
[ "$(gw log -1 --format=%s HEAD~1)" = "lab: trước buổi a2" ] && gw cat-file -e HEAD~1:src/test/a1/A1.case \
  && [ "$(gw show HEAD~1:src/A.java)" = 'class A { String hello = "world"; }' ]; g=$?
check "check rồi begin loc a2: check không ghi; begin chạy setup.sh trong workspace, gỡ test retire, code người học nằm trong 'trước buổi a2'" $((a+b+c+d+e+f+g))

# begin/check lại một buổi đã bắt đầu: không chạy verify của buổi trước (test của nó có thể đã bị retire),
# không chép đè test, không commit; báo cách làm tiếp, chỉ gợi ý restore như cách làm lại từ đầu.
begun_a2() { # workspace đã qua a1 và đang làm dở a2 (B.java, A2.case do người học sửa, chưa commit)
  run_loc "" up loc; run_loc "" begin loc a1
  printf 'class A { String hello = "world"; }\n' > "$LOCW/src/A.java"
  run_loc "" begin loc a2
  echo "của tôi" > "$LOCW/src/B.java"; echo "tôi sửa" > "$LOCW/src/test/a2/A2.case"
}
new_loc; begun_a2; n0="$(commits)"; m0="$(count "$MVN_LOG" ' -q test')"
run_loc "" begin loc a2
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "buổi 'a2' đã bắt đầu"; b=$?; has "$OUT" './labs/lab verify loc a2'; c=$?
has "$OUT" 'làm lại từ đầu: ./labs/lab restore loc a1 rồi ./labs/lab begin loc a2'; d=$?
has "$ERR" 'chưa đạt'; [ $? -ne 0 ]; e=$?
[ "$(commits)" = "$n0" ] && [ "$(count "$MVN_LOG" ' -q test')" = "$m0" ]; f=$?
[ "$(cat "$LOCW/src/B.java")" = "của tôi" ] && [ "$(cat "$LOCW/src/test/a2/A2.case")" = "tôi sửa" ]; g=$?
run_loc "" check loc a2
[ "$RC" -eq 0 ] && has "$OUT" "buổi 'a2' đã bắt đầu"; h=$?
[ "$(commits)" = "$n0" ] && [ "$(count "$MVN_LOG" ' -q test')" = "$m0" ]; i=$?
check "begin/check loc a2 lần hai: mã 0, báo đã bắt đầu + verify, không chạy mvn, không commit, tệp đang sửa còn nguyên" $((a+b+c+d+e+f+g+h+i))

new_loc; begun_a2; run_loc "" verify loc a2; n0="$(commits)"; run_loc "" begin loc a2
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "buổi 'a2' đã bắt đầu"; b=$?; [ "$(commits)" = "$n0" ]; c=$?
check "begin loc a2 sau khi a2 đã đạt: mã 0, báo đã bắt đầu, không commit" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" begin loc a1; n0="$(commits)"; echo "tôi" > "$LOCW/src/A.java"
run_loc "" begin loc a1
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "buổi 'a1' đã bắt đầu"; b=$?; [ "$(commits)" = "$n0" ]; c=$?
[ "$(cat "$LOCW/src/A.java")" = "tôi" ]; d=$?; has "$OUT" 'restore loc'; [ $? -ne 0 ]; e=$?
check "begin loc a1 (buổi đầu) lần hai: mã 0, không commit, không gợi ý restore (không có buổi trước)" $((a+b+c+d+e))

new_loc; begun_a2; run_loc "" restore loc a1 --yes; run_loc "" begin loc a2
[ "$RC" -eq 0 ]; a=$?; [ "$(head_subj)" = "lab: đầu buổi a2" ]; b=$?; [ "$(gw log -1 --format=%s HEAD~1)" = "lab: trước buổi a2" ]; c=$?
[ "$(cat "$LOCW/src/test/a2/A2.case")" = "$(cat "$LS/a2/tests/src/test/a2/A2.case")" ]; d=$?
has "$OUT" "buổi 'a2' đã bắt đầu"; [ $? -ne 0 ]; e=$?
check "restore loc a1 rồi begin loc a2: begin bình thường (verify a1, chép lại test, commit mới)" $((a+b+c+d+e))

new_loc; run_loc "" up loc; run_loc "" restore loc a2 --yes; n0="$(commits)"; m0="$(count "$MVN_LOG" ' -q test')"
run_loc "" begin loc a2
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "khôi phục về cuối buổi 'a2'"; b=$?; has "$OUT" './labs/lab begin loc a3'; c=$?
[ "$(commits)" = "$n0" ] && [ "$(count "$MVN_LOG" ' -q test')" = "$m0" ]; d=$?
run_loc "" begin loc a1
[ "$RC" -eq 0 ] && has "$OUT" "khôi phục về cuối buổi 'a2'" && [ "$(commits)" = "$n0" ]; e=$?
check "restore loc a2 rồi begin a2 hoặc a1: mã 0, báo đã khôi phục qua buổi đó, gợi ý begin a3, không chạy gì" $((a+b+c+d+e))

new_loc; begun_a2; printf 'class B { String bee; }\n' > "$LOCW/src/B.java"; cp "$LS/a2/tests/src/test/a2/A2.case" "$LOCW/src/test/a2/"
run_loc "" begin loc a3; [ "$(head_subj)" = "lab: đầu buổi a3" ]; z=$?
echo "a3 của tôi" > "$LOCW/src/C.java"; n0="$(commits)"; m0="$(count "$MVN_LOG" ' -q test')"
run_loc "" begin loc a2
[ "$RC" -eq 0 ]; a=$?; has "$OUT" "buổi 'a2' đã bắt đầu"; b=$?; has "$OUT" "'a3'"; c=$?
[ "$(commits)" = "$n0" ] && [ "$(count "$MVN_LOG" ' -q test')" = "$m0" ] && [ "$(cat "$LOCW/src/C.java")" = "a3 của tôi" ]; d=$?
check "begin loc a2 khi a3 đã bắt đầu: mã 0, nhắc buổi đang làm là a3, không chạy gì, code a3 còn nguyên" $((a+b+c+d+z))

new_loc; run_loc "" up loc; run_loc "" begin loc a1
echo "của tôi" > "$LOCW/src/A.java"; echo "mới" > "$LOCW/notes.txt"
run_loc "" restore loc a2 --yes
[ "$RC" -eq 0 ]; a=$?
br="$(backups)"; [ -n "$br" ] && [ "$(printf '%s\n' "$br" | wc -l | tr -d ' ')" = 1 ]; b=$?
has "$OUT" "$br"; c=$?
[ "$(gw show "$br:src/A.java")" = "của tôi" ] && [ "$(gw show "$br:notes.txt")" = "mới" ]; d=$?
exp="$LOCROOT/exp"; cp -R "$LOCROOT/loc/app" "$exp"
cp -R "$LS/a1/tests/." "$LS/a1/solution/." "$LS/a2/tests/." "$exp/"; rm "$exp/src/test/a1/A1.case"
cp -R "$LS/a2/solution/." "$exp/"; rm "$exp/src/Old.java"
same_tree "$exp"; e=$?
[ "$(head_subj)" = "lab: khôi phục về cuối buổi a2" ] && [ -z "$(gw status --porcelain)" ]; f=$?
has "$OUT" '1/1 đạt'; g=$?
check "restore loc a2 --yes: tệp sửa và tệp mới còn trong nhánh backup/* đã in; cây = bản gốc + a1 + a2, retire đã gỡ; verify a2 chạy" $((a+b+c+d+e+f+g))

new_loc; run_loc "" up loc; mkdir -p "$LOCW/target" "$LOCW/src/target"
echo cũ > "$LOCW/target/stale.txt"; echo "class X {}" > "$LOCW/src/target/X.java"
run_loc "" restore loc a1 --yes
[ "$RC" -eq 0 ]; a=$?; [ ! -e "$LOCW/target/stale.txt" ] && [ ! -e "$LOCW/src/target" ]; b=$?
[ "$(gw show "$(backups):src/target/X.java")" = "class X {}" ]; c=$?
check "restore: xoá target/ cũ cạnh pom.xml; package tên 'target' trong src/ vẫn được sao lưu" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" begin loc a1; echo x > "$LOCW/src/A.java"; n0="$(commits)"
run_loc "n
" restore loc a2
[ "$RC" -ne 0 ]; a=$?; [ "$(commits)" = "$n0" ]; b=$?; [ -z "$(backups)" ]; c=$?; [ "$(cat "$LOCW/src/A.java")" = x ]; d=$?
has "$OUT" 'a1 a2'; e=$?
check "restore loc a2 trả lời n: đã liệt kê việc sẽ làm, không commit, không nhánh mới, không đổi tệp" $((a+b+c+d+e))

new_loc; LOCPATH="$FIXDATE:$LOCBIN:/usr/bin:/bin"; run_loc "" up loc
run_loc "" restore loc a1 --yes; a=$RC; run_loc "" restore loc a1 --yes; b=$RC
[ "$(backups | wc -l | tr -d ' ')" = 2 ]; c=$?
backups | grep -Fxq backup/20261114-101010; d=$?; backups | grep -Fxq backup/20261114-101010-2; e=$?
check "hai lần restore trong cùng một giây: hai nhánh sao lưu khác tên" $((a+b+c+d+e))

merge_conflict() { # workspace đang ở giữa một merge có xung đột ở src/A.java, thêm một tệp chưa theo dõi
  gw checkout -q -b side; echo side > "$LOCW/src/A.java"; gw commit -qam side
  gw checkout -q -; echo main > "$LOCW/src/A.java"; gw commit -qam main
  gw merge -q side >/dev/null 2>&1
  echo "mới" > "$LOCW/untracked.txt"
}
new_loc; run_loc "" up loc; merge_conflict
[ -f "$LOCW/.git/MERGE_HEAD" ]; a=$?
run_loc "" restore loc a1 --yes
[ "$RC" -eq 0 ]; b=$?; br="$(backups)"
gw show "$br:src/A.java" | grep -q '^<<<<<<<'; c=$?
[ "$(gw show "$br:untracked.txt")" = "mới" ]; d=$?
[ ! -f "$LOCW/.git/MERGE_HEAD" ] && [ "$(head_subj)" = "lab: khôi phục về cuối buổi a1" ]; e=$?
check "restore khi đang giữa merge: nội dung xung đột và tệp mới còn trong nhánh sao lưu" $((a+b+c+d+e))
new_loc; run_loc "" up loc; merge_conflict; run_loc "" begin loc a1
[ "$RC" -eq 0 ]; a=$?
[ "$(gw log -1 --format=%s HEAD~1)" = "lab: trước buổi a1" ] && gw show HEAD~1:src/A.java | grep -q '^<<<<<<<' \
  && [ "$(gw show HEAD~1:untracked.txt)" = "mới" ]; b=$?
check "begin khi đang giữa merge: nội dung xung đột và tệp mới nằm trong commit 'trước buổi a1'" $((a+b))

new_loc; run_loc "" up loc; h0="$(gw rev-parse HEAD)"; echo keep > "$LOCROOT/loc/x"
printf '../x\n' >> "$LOCROOT/loc/sessions/a2/solution.delete"
run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ]; a=$?; [ "$(cat "$LOCROOT/loc/x")" = keep ]; b=$?
[ "$(gw rev-parse HEAD)" = "$h0" ] && [ -z "$(backups)" ]; c=$?
printf '.git\n' > "$LOCROOT/loc/sessions/a2/solution.delete"; run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ] && [ -d "$LOCW/.git" ] && [ "$(gw rev-parse HEAD)" = "$h0" ]; d=$?
printf '/etc/x\n' > "$LOCROOT/loc/sessions/a2/solution.delete"; run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ] && [ "$(gw rev-parse HEAD)" = "$h0" ]; e=$?
printf 'src/../../x\n' > "$LOCROOT/loc/sessions/a2/solution.delete"; run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ] && [ "$(cat "$LOCROOT/loc/x")" = keep ] && [ "$(gw rev-parse HEAD)" = "$h0" ]; f=$?
: > "$LOCROOT/loc/sessions/a2/solution.delete"; mkdir -p "$LOCROOT/loc/sessions/a1/solution/.GIT"
echo x > "$LOCROOT/loc/sessions/a1/solution/.GIT/config"; run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ] && [ "$(gw rev-parse HEAD)" = "$h0" ]; g=$?
check "solution.delete có '../x', 'src/../../x', '.git' hoặc đường dẫn tuyệt đối, solution/ có '.GIT/': từ chối trước khi ghi, không sao lưu, không commit" $((a+b+c+d+e+f+g))

new_loc; run_loc "" up loc; h0="$(gw rev-parse HEAD)"; mkdir "$LOCROOT/outside"
ln -s "$LOCROOT/outside" "$LOCROOT/loc/sessions/a1/solution/evil"
run_loc "" restore loc a1 --yes
[ "$RC" -ne 0 ]; a=$?; [ -z "$(ls -A "$LOCROOT/outside")" ]; b=$?; [ "$(gw rev-parse HEAD)" = "$h0" ]; c=$?
rm "$LOCROOT/loc/sessions/a1/solution/evil"; printf '../../x\n' > "$LOCROOT/loc/sessions/a2/retire"
run_loc "" restore loc a2 --yes
[ "$RC" -ne 0 ] && [ "$(gw rev-parse HEAD)" = "$h0" ]; d=$?
check "solution/ có symlink trỏ ra ngoài, retire có '..': từ chối, không ghi gì" $((a+b+c+d))

new_loc; run_loc "" up loc; mkdir "$LOCROOT/outside"; mkdir -p "$LOCW/src"; ln -s "$LOCROOT/outside" "$LOCW/src/test"
run_loc "" begin loc a1
[ "$RC" -ne 0 ]; a=$?; [ -z "$(ls -A "$LOCROOT/outside")" ]; b=$?
run_loc "" begin loc ../a1
[ "$RC" -ne 0 ]; c=$?
rm "$LOCW/src/test"; mkdir -p "$LOCROOT/loc/backups"; ln -s ../../backups "$LOCW/src/test"
run_loc "" begin loc a1
[ "$RC" -ne 0 ] && [ -z "$(ls -A "$LOCROOT/loc/backups")" ]; d=$?
check "begin: đích trong workspace là symlink ra ngoài (kể cả sang backups/), hoặc id buổi có '..': từ chối, đích không bị đụng" $((a+b+c+d))

new_loc; run_loc "" up loc; echo mine > "$LOCW/src/A.java"; run_loc "" break loc b1
[ "$RC" -eq 0 ]; a=$?; [ "$(head_subj)" = "lab: trước sự cố b1" ]; b=$?
[ "$(gw show HEAD:src/A.java)" = mine ] && [ "$(cat "$LOCW/src/A.java")" = broken ]; c=$?
run_loc "" break loc ../b1; [ "$RC" -ne 0 ]; d=$?
run_loc "" break loc khong-co; [ "$RC" -ne 0 ] && [ "$(head_subj)" = "lab: trước sự cố b1" ]; e=$?
check "break loc b1: commit 'trước sự cố b1' giữ code người học trước khi run.sh sửa; mã lạ bị từ chối" $((a+b+c+d+e))

new_loc; run_loc "" up loc; echo dirty > "$LOCW/src/A.java"; echo u > "$LOCW/u.txt"
h0="$(gw rev-parse HEAD)"; s0="$(gw status --porcelain)"
export ST_TRACE="$WORK/st.trace"; : > "$ST_TRACE"
printf 'echo "$PWD" >> "$ST_TRACE"; echo "$PWD selftest.sh" >> "$MVN_LOG"\n' > "$LOCROOT/loc/selftest.sh"
run_loc "" selftest loc
[ "$RC" -eq 0 ]; a=$?
[ "$(gw rev-parse HEAD)" = "$h0" ] && [ "$(gw status --porcelain)" = "$s0" ] && [ "$(cat "$LOCW/src/A.java")" = dirty ]; b=$?
[ -z "$(backups)" ]; c=$?
has "$MVN_LOG" "^$LOCW "; [ $? -ne 0 ]; d=$?
tmpw="$(head -n 1 "$MVN_LOG" | cut -d' ' -f1)"; [ -n "$tmpw" ] && [ ! -e "$tmpw" ]; e=$?
[ "$(count "$ST_TRACE" .)" = 1 ] && [ "$(cat "$ST_TRACE")" = "$tmpw" ]; f=$?
has "$OUT" "bỏ qua 'a4'"; g=$?; has "$OUT" 'giây'; h=$?
# Mỗi buổi đúng hai lần Maven (verify đỏ, verify xanh): begin không chạy lại verify của buổi trước;
# selftest.sh chạy một lần, sau verify cuối cùng.
[ "$(count "$MVN_LOG" ' -q test')" = 6 ]; i=$?
[ "$(tail -n 1 "$MVN_LOG")" = "$tmpw selftest.sh" ]; j=$?
check "selftest loc: đi a1..a3 trên workspace tạm (đã dọn), 2 lần mvn mỗi buổi, selftest.sh chạy một lần ở cuối, work/ không đổi, in thời gian" $((a+b+c+d+e+f+g+h+i+j))
printf 'exit 1\n' > "$LOCROOT/loc/selftest.sh"; run_loc "" selftest loc
[ "$RC" -ne 0 ]; a=$?; has "$ERR" 'selftest.sh'; b=$?
has "$ERR" 'test còn hiệu lực của một buổi trước'; c=$?; has "$ERR" 'labs/README.md'; d=$?
check "selftest loc: selftest.sh của chương trình lỗi thì selftest lỗi, nói nghĩa và chỉ tới labs/README.md" $((a+b+c+d))

new_loc; export ST_TRACE="$WORK/st.trace"; : > "$ST_TRACE"
printf 'echo "check $SESSION_DIR" >> "$ST_TRACE"\nlab_mvn -q test\nexpect_test "A có hello" lab.a1.A1Test#greets\nassert_summary\n' > "$LOCROOT/loc/sessions/a2/check.sh"
run_loc "" selftest loc
[ "$RC" -eq 0 ]; a=$?; [ "$(cat "$ST_TRACE")" = "check $LOCROOT/loc/sessions/a2" ]; b=$?
[ "$(count "$MVN_LOG" ' -q test')" = 7 ]; c=$?
check "selftest loc: buổi có check.sh thì check.sh vẫn chạy lúc begin (chỉ bỏ verify của buổi trước)" $((a+b+c))

new_loc; printf 'class A { String hello = "world"; }\n' > "$LOCROOT/loc/app/src/A.java"; run_loc "" selftest loc
[ "$RC" -ne 0 ]; a=$?; has "$ERR" "'a1'"; b=$?; has "$ERR" 'xanh ngay sau begin'; c=$?; [ ! -e "$LOCW" ]; d=$?
check "selftest loc: buổi xanh ngay sau begin thì báo lỗi" $((a+b+c+d))

new_loc; printf 'class A {}\n' > "$LOCROOT/loc/sessions/a1/solution/src/A.java"; run_loc "" selftest loc
[ "$RC" -ne 0 ]; a=$?; has "$ERR" "'a1'"; b=$?; has "$ERR" 'lời giải'; c=$?
check "selftest loc: lời giải không làm verify xanh thì báo lỗi" $((a+b+c))

new_loc; run_loc "" up loc; run_loc "" restore loc a2 --yes; run_loc "" begin loc a3
[ "$RC" -eq 0 ]; a=$?; [ ! -e "$LOCW/src/test/a3" ]; b=$?
printf 'class C { String cee; }\n' > "$LOCW/src/C.java"; run_loc "" verify loc a3
[ "$RC" -eq 0 ]; c=$?; [ -f "$LOCW/src/test/a3/A3.case" ]; d=$?
[ "$(head_subj)" = "lab: xong buổi a3" ] && gw ls-files --error-unmatch src/test/a3/A3.case >/dev/null 2>&1; e=$?
check "a3 có tests.hidden: sau begin chưa có test, sau verify có và đã commit" $((a+b+c+d+e))

et() { # et <Lớp#phương_thức> [thư mục báo cáo]: một dòng expect_test
  env PATH="/usr/bin:/bin" /bin/bash -c '. "$1/lib/assert.sh"; [ -n "$3" ] && lab_tests "$3"; expect_test "t" "$2"' \
    _ "$LABS" "$1" "${2-$SF}" 2>&1
}
P=lab.s01.FilterChainTest
et "$P#passes" | grep -q '^  ✓ t$'; a=$?
et "$P#fails" | grep -q '^  ✗ t (thực tế: .*failure.*expected 401 but was 200'; b=$?
et "$P#errors" | grep -q '^  ✗ t (thực tế: .*error.*boom'; c=$?
et "$P#skips" | grep -q '^  ✗ t (thực tế: .*skipped'; d=$?
et "$P#missing" | grep -q '^  ✗ t (thực tế: không chạy'; e=$?
et "$P#noisy" | grep -q '^  ✓ t$'; f=$?
et "$P\$Inner\$Deep#inner" | grep -q '^  ✓ t$'; g=$?
et "$P\$Inner#inner" | grep -q 'không chạy'; h=$?
et "lab.s01XFilterChainTest#passes" | grep -q 'không chạy'; i=$?
et "$P#pass" | grep -q 'không chạy'; j=$?
et "$P#flaky" | grep -q '^  ✓ t$'; k=$?
et "$P#passes" "" | grep -q 'không chạy'; l=$?
et "$P" | grep -q '^  ✗'; m=$?
check "expect_test: đạt, failure, error, skipped, không tồn tại, log giả, lớp có '.' và '\$', chưa chạy Maven" $((a+b+c+d+e+f+g+h+i+j+k+l+m))

# Thông báo lỗi trong báo cáo surefire là thuộc tính XML: thực thể được giải mã khi in, xuống dòng thành
# một dấu cách (mỗi kiểm tra vẫn một dòng); giải mã một lượt, như &amp; sau cùng: "&amp;lt;" in ra "&lt;", "&#38;lt;" cũng vậy.
E=lab.s01.EntityTest
want="  ✗ t (thực tế: thất bại (failure): Status expected:<401> but was:<200> Expected: 'Basic' and \"realm\" at x &lt;y&gt; &amp; AA )"
[ "$(et "$E#multiline")" = "$want" ]; a=$?
[ "$(et "$E#multiline" | wc -l | tr -d ' ')" = 1 ]; b=$?
[ "$(et "$E#literal")" = "  ✗ t (thực tế: lỗi (error): tệp &#10;.env thiếu &lt;, ký tự &#233; giữ nguyên)" ]; c=$?
check "expect_test: thông báo lỗi giải mã thực thể XML (&#10; &apos; &quot; &lt; &gt; &amp;), một dòng" $((a+b+c))

# Báo cáo lớn (log DEBUG trong system-out): 30 testcase × 1000 dòng log (~3 MB), testcase cuối lỗi.
BIG="$WORK/big"; mkdir -p "$BIG"
awk 'BEGIN {
  print "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"; print "<testsuite name=\"lab.big.BigTest\">"
  for (t = 1; t <= 30; t++) {
    printf "  <testcase name=\"t%d\" classname=\"lab.big.BigTest\" time=\"0.1\">\n", t
    if (t == 30) print "    <failure message=\"hỏng ở cuối\" type=\"java.lang.AssertionError\">x</failure>"
    printf "    <system-out><![CDATA["
    for (l = 1; l <= 1000; l++) printf "2026-11-14 DEBUG o.s.s.w.FilterChainProxy > Securing GET /x <failure/> line %d of test %d -->\n", l, t
    print "]]></system-out>"; print "  </testcase>"
  }
  print "</testsuite>" }' > "$BIG/TEST-big.xml"
t0="$(date +%s)"
out="$(env PATH="/usr/bin:/bin" /bin/bash -c '. "$1/lib/assert.sh"; lab_tests "$2"
  for i in 1 2 3 4 5 6 7 8 9; do expect_test "t$i" "lab.big.BigTest#t$i"; done
  expect_test "t30" "lab.big.BigTest#t30"' _ "$LABS" "$BIG" 2>&1)"
t1="$(date +%s)"
[ $((t1 - t0)) -le 5 ]; a=$?
[ "$(printf '%s\n' "$out" | grep -c '✓')" = 9 ]; b=$?
printf '%s\n' "$out" | grep -q '^  ✗ t30 (thực tế: thất bại (failure): hỏng ở cuối)$'; c=$?
check "expect_test trên báo cáo ~3 MB log: 10 dòng xong trong ≤ 5 giây, kết quả đúng" $((a+b+c))

out="$(env PATH="/usr/bin:/bin" /bin/bash -c '. "$1/lib/assert.sh"
  lab_tests "$2"; expect_test "a" "lab.big.BigTest#t1"; lab_tests "$3"; expect_test "b" "lab.big.BigTest#t1"
  expect_test "c" "lab.s01.FilterChainTest#passes"' _ "$LABS" "$BIG" "$SF" 2>&1)"
printf '%s\n' "$out" | grep -q '^  ✓ a$'; a=$?
printf '%s\n' "$out" | grep -q '^  ✗ b (thực tế: không chạy'; b=$?
printf '%s\n' "$out" | grep -q '^  ✓ c$'; c=$?
check "expect_test: đổi lab_tests thì đọc lại báo cáo (không dùng bảng cũ)" $((a+b+c))

# LAB_MVN_RAN có sẵn trong môi trường người gọi không được làm verify đọc báo cáo cũ khi script không gọi lab_mvn.
new_loc; run_loc "" up loc; run_loc "" begin loc a1
mkdir -p "$LOCW/target/surefire-reports"; cp "$SF/a1-pass.xml" "$LOCW/target/surefire-reports/TEST-old.xml"
printf 'expect_test "A có hello" "lab.a1.A1Test#greets"\nassert_summary\n' > "$LOCROOT/loc/sessions/a1/verify.sh"
RC=0; printf '' | env PATH="$LOCBIN:/usr/bin:/bin" LAB_ROOT="$LOCROOT" LAB_MVN_RAN=1 /bin/bash "$LAB" verify loc a1 >"$OUT" 2>"$ERR" || RC=$?
[ "$RC" -ne 0 ]; a=$?; has "$OUT" '✗ A có hello (thực tế: không chạy'; b=$?; has "$OUT" '✓'; [ $? -ne 0 ]; c=$?
check "verify với LAB_MVN_RAN=1 từ môi trường, script không gọi lab_mvn, còn báo cáo cũ: ✗ 'không chạy'" $((a+b+c))

new_loc; LOCPATH="$GITFAIL:$LOCBIN:/usr/bin:/bin"; run_loc "" up loc
[ "$RC" -ne 0 ]; a=$?; [ ! -e "$LOCW" ]; b=$?
unset LOCPATH; run_loc "" up loc
[ "$RC" -eq 0 ] && [ "$(commits)" = 1 ]; c=$?
check "up loc lỗi giữa chừng (commit đầu lỗi): không để lại work/ dở, lần up sau chạy được" $((a+b+c))

new_loc; mkdir -p "$LOCW"; echo keep > "$LOCW/f"; run_loc "" destroy loc --yes
[ "$RC" -ne 0 ]; a=$?; [ "$(cat "$LOCW/f")" = keep ]; b=$?; [ ! -e "$LOCROOT/loc/backups" ]; c=$?
check "destroy loc trên thư mục không phải workspace (thiếu .git): từ chối, không đụng" $((a+b+c))

new_loc; run_loc "" up loc; mkdir -p "$LOCROOT/loc/backups" "$LOCROOT/nowhere"
ln -s "$LOCROOT/nowhere/x.tar.gz" "$LOCROOT/loc/backups/loc-20261114-101010.tar.gz"
LOCPATH="$FIXDATE:$LOCBIN:/usr/bin:/bin"; run_loc "" destroy loc --yes
[ "$RC" -eq 0 ]; a=$?; [ ! -e "$LOCROOT/nowhere/x.tar.gz" ]; b=$?
[ -L "$LOCROOT/loc/backups/loc-20261114-101010.tar.gz" ]; c=$?
[ "$(find "$LOCROOT/loc/backups" -type f -name '*.tar.gz' | wc -l | tr -d ' ')" = 1 ]; d=$?
check "destroy loc khi đường dẫn gói trùng một symlink treo: không ghi theo symlink, gói sang tên khác" $((a+b+c+d))

echo "---"
echo "$((CASES-FAILS))/$CASES ca đạt"
[ "$FAILS" -eq 0 ]
