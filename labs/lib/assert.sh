#!/bin/bash
# Thư viện assert cho script buổi / đề mock. Được lab nạp sẵn; script chỉ việc gọi.
#   expect_ok    "<nhãn>" <lệnh…>              đạt khi lệnh trả 0
#   expect_fail  "<nhãn>" <lệnh…>              đạt khi lệnh trả khác 0
#   expect_eq    "<nhãn>" "<kỳ vọng>" <lệnh…>  đạt khi stdout (cắt khoảng trắng đầu/cuối) bằng kỳ vọng
#   expect_match "<nhãn>" "<regex>" <lệnh…>    đạt khi gộp stdout+stderr khớp regex (grep -E)
#   assert_summary                             in "  → a/b đạt", trả 0 khi đủ
# Bộ đếm là biến của shell hiện tại: mỗi lần lab chạy một script trong subshell mới thì đếm lại từ 0.

ASSERT_OK=0
ASSERT_N=0

# _assert_short <văn bản>: dòng đầu, tối đa 80 ký tự
_assert_short() {
  local s
  s="$(printf '%s\n' "$1" | head -n 1 | cut -c 1-80)"
  [ -n "$s" ] || s="(rỗng)"
  printf '%s' "$s"
}

_assert_pass() { ASSERT_N=$((ASSERT_N+1)); ASSERT_OK=$((ASSERT_OK+1)); echo "  ✓ $1"; }
_assert_fail() { ASSERT_N=$((ASSERT_N+1)); echo "  ✗ $1 (thực tế: $2)"; }

expect_ok() {
  local label="$1" out rc=0; shift
  out="$("$@" 2>&1)" || rc=$?
  if [ "$rc" -eq 0 ]; then _assert_pass "$label"; else _assert_fail "$label" "mã $rc: $(_assert_short "$out")"; fi
}

expect_fail() {
  local label="$1" out rc=0; shift
  out="$("$@" 2>&1)" || rc=$?
  if [ "$rc" -ne 0 ]; then _assert_pass "$label"; else _assert_fail "$label" "lệnh thành công (mã 0)"; fi
}

expect_eq() {
  local label="$1" want="$2" got rc=0; shift 2
  got="$("$@" 2>/dev/null)" || rc=$?
  got="$(printf '%s' "$got" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if [ "$got" = "$want" ]; then _assert_pass "$label"; else _assert_fail "$label" "$(_assert_short "$got")"; fi
}

expect_match() {
  local label="$1" re="$2" out; shift 2
  out="$("$@" 2>&1)" || true
  if printf '%s\n' "$out" | grep -Eq -- "$re"; then _assert_pass "$label"; else _assert_fail "$label" "$(_assert_short "$out")"; fi
}

assert_summary() {
  echo "  → $ASSERT_OK/$ASSERT_N đạt"
  [ "$ASSERT_OK" -eq "$ASSERT_N" ]
}
