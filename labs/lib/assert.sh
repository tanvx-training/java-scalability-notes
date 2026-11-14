#!/bin/bash
# Thư viện assert cho script buổi / đề mock. Được lab nạp sẵn; script chỉ việc gọi.
#   expect_ok    "<nhãn>" <lệnh…>              đạt khi lệnh trả 0
#   expect_fail  "<nhãn>" <lệnh…>              đạt khi lệnh trả khác 0
#   expect_eq    "<nhãn>" "<kỳ vọng>" <lệnh…>  đạt khi stdout (cắt khoảng trắng đầu/cuối) bằng kỳ vọng
#   expect_match "<nhãn>" "<regex>" <lệnh…>    đạt khi gộp stdout+stderr khớp regex (grep -E); expect_eq và expect_match còn đòi lệnh trả 0
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
  if [ "$rc" -ne 0 ]; then _assert_fail "$label" "mã $rc: $(_assert_short "$got")"
  elif [ "$got" = "$want" ]; then _assert_pass "$label"; else _assert_fail "$label" "$(_assert_short "$got")"; fi
}

expect_match() {
  local label="$1" re="$2" out rc=0; shift 2
  out="$("$@" 2>&1)" || rc=$?
  if [ "$rc" -ne 0 ]; then _assert_fail "$label" "mã $rc: $(_assert_short "$out")"
  elif printf '%s\n' "$out" | grep -Eq -- "$re"; then _assert_pass "$label"; else _assert_fail "$label" "$(_assert_short "$out")"; fi
}

assert_summary() {
  echo "  → $ASSERT_OK/$ASSERT_N đạt"
  [ "$ASSERT_OK" -eq "$ASSERT_N" ]
}

# ---- Chấm bằng báo cáo JUnit của Maven Surefire (driver local) ----
#   lab_tests <thư mục>                 đọc báo cáo (*.xml) trong thư mục đó thay cho mặc định
#   expect_test "<nhãn>" "<lớp>#<pt>"  đạt khi testcase đó có trong báo cáo, không failure/error/skipped
# Mặc định đọc mọi target/surefire-reports/*.xml trong workspace, nhưng chỉ sau khi lab_mvn chạy trong
# cùng script (lab_mvn xoá báo cáo cũ trước): chưa chạy Maven thì mọi dòng là ✗ "không chạy".
# Báo cáo được đọc một lần thành bảng chỉ mục (lớp, phương thức, kết quả) ở expect_test đầu tiên;
# lab_tests và lab_mvn xoá bảng để lần sau đọc lại.
LAB_TEST_REPORTS=""
_LAB_TEST_INDEX=""
_LAB_TEST_INDEX_OK=0

lab_tests() { LAB_TEST_REPORTS="$1"; _LAB_TEST_INDEX_OK=0; }

# _lab_report_files: danh sách tệp báo cáo, mỗi dòng một tệp
_lab_report_files() {
  if [ -n "$LAB_TEST_REPORTS" ]; then
    [ -d "$LAB_TEST_REPORTS" ] && find "$LAB_TEST_REPORTS" -type f -name '*.xml' -print
  elif [ "${LAB_MVN_RAN:-0}" = 1 ]; then
    find "${WS:-.}" -name .git -prune -o -type f -path '*/target/surefire-reports/*.xml' -print
  fi
  return 0
}

# _lab_test_index: đọc mọi báo cáo một lượt, in mỗi testcase một dòng "<lớp>\t<tên>\t<ok|lý do>".
# Đọc theo từng thẻ (RS='>'), bỏ qua nội dung CDATA và chú thích (log trong system-out có thể rất lớn)
# nên thời gian tuyến tính theo kích thước báo cáo.
_lab_test_index() {
  local f
  set --
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    case "$f" in /*) ;; *) f="./$f" ;; esac   # awk không hiểu nhầm "a=b/…" là gán biến
    set -- "$@" "$f"
  done <<EOF
$(_lab_report_files)
EOF
  [ $# -gt 0 ] || return 0
  awk '
    function attr(t, a,   r) {
      if (!match(t, "[ \t\r\n]" a "=\"[^\"]*\"")) return ""
      r = substr(t, RSTART + 1, RLENGTH - 1); sub(/^[^=]*="/, "", r); sub(/"$/, "", r)
      return unxml(r)
    }
    # unxml: giải mã thực thể XML của một giá trị thuộc tính trong một lượt quét (kết quả giải mã không bị
    # quét lại, nên "&amp;lt;" ra "&lt;" như khi giải mã &amp; sau cùng). Tham chiếu số chỉ giải mã khi là
    # ký tự ASCII (tab, xuống dòng, in được); ngoài ra giữ nguyên.
    function unxml(r,   out, ent, n, c) {
      out = ""
      while (match(r, /&(#x[0-9A-Fa-f]+|#[0-9]+|lt|gt|quot|apos|amp);/)) {
        ent = substr(r, RSTART + 1, RLENGTH - 2)
        out = out substr(r, 1, RSTART - 1)
        c = substr(r, RSTART, RLENGTH)
        if (ent == "lt") c = "<"
        else if (ent == "gt") c = ">"
        else if (ent == "quot") c = "\""
        else if (ent == "apos") c = "'\''"
        else if (ent == "amp") c = "&"
        else {
          n = (substr(ent, 2, 1) == "x") ? hex(substr(ent, 3)) : substr(ent, 2) + 0
          if (n == 9 || n == 10 || n == 13 || (n >= 32 && n < 127)) c = sprintf("%c", n)
        }
        out = out c
        r = substr(r, RSTART + RLENGTH)
      }
      return out r
    }
    function hex(h,   v, i) {
      v = 0; h = tolower(h)
      for (i = 1; i <= length(h); i++) v = v * 16 + index("0123456789abcdef", substr(h, i, 1)) - 1
      return v
    }
    function clean(v) { gsub(/[\t\r\n]+/, " ", v); return v }
    function emit(r) {
      if (r == "") r = "ok"
      print clean(cls) "\t" clean(nm) "\t" clean(r)
      inc = 0
    }
    BEGIN { RS = ">" }
    FNR == 1 { if (inc) emit(why != "" ? why : "báo cáo không trọn vẹn"); st = 0 }
    {
      r = $0
      if (st == 1) { if (r ~ /\]\]$/) st = 0; next }
      if (st == 2) { if (r ~ /--$/) st = 0; next }
      i = index(r, "<"); if (i == 0) next
      t = substr(r, i + 1)
      if (substr(t, 1, 8) == "![CDATA[") { if (!(t ~ /\]\]$/)) st = 1; next }
      if (substr(t, 1, 3) == "!--") { if (!(length(t) >= 5 && t ~ /--$/)) st = 2; next }
      if (t ~ /^\/testcase[ \t\r\n]*$/) { if (inc) emit(why); next }
      tag = t; sub(/[ \t\r\n\/].*$/, "", tag)
      if (tag == "testcase") {
        if (inc) emit(why != "" ? why : "báo cáo không trọn vẹn")
        inc = 1; why = ""; cls = attr(t, "classname"); nm = attr(t, "name")
        if (t ~ /\/[ \t\r\n]*$/) emit("")
        next
      }
      if (inc && why == "") {
        if (tag == "failure") why = "thất bại (failure)"
        else if (tag == "error") why = "lỗi (error)"
        else if (tag == "skipped") why = "bị bỏ qua (skipped)"
        else next
        msg = attr(t, "message")
        if (msg != "") why = why ": " msg
      }
    }
    END { if (inc) emit(why != "" ? why : "báo cáo không trọn vẹn") }' "$@"
}

# _lab_test_result <lớp> <phương thức>: in "ok", lý do không đạt, hoặc rỗng khi không thấy testcase.
# Khớp đúng classname; name bằng phương thức (hoặc "phương_thức(…" / "phương_thức[…" của test tham số hoá,
# khi đó mọi lần chạy đều phải đạt).
_lab_test_result() {
  [ -n "$_LAB_TEST_INDEX" ] || return 0
  printf '%s\n' "$_LAB_TEST_INDEX" | awk -F '\t' -v cls="$1" -v m="$2" '
    $1 == cls && ($2 == m || index($2, m "(") == 1 || index($2, m "[") == 1) {
      found = 1; if ($3 != "ok" && bad == "") bad = $3
    }
    END { if (bad != "") print bad; else if (found) print "ok" }'
}

expect_test() {
  local label="$1" id="$2" ok=0 res
  case "$id" in
    *'#'*'#'*) ;;
    ?*'#'?*) ok=1 ;;
  esac
  if [ "$ok" -ne 1 ]; then
    _assert_fail "$label" "định danh test '$id' sai dạng (cần <lớp>#<phương thức>)"
    return 0
  fi
  if [ "$_LAB_TEST_INDEX_OK" -ne 1 ]; then
    _LAB_TEST_INDEX="$(_lab_test_index)"
    _LAB_TEST_INDEX_OK=1
  fi
  res="$(_lab_test_result "${id%#*}" "${id#*#}")"
  case "$res" in
    ok) _assert_pass "$label" ;;
    '') _assert_fail "$label" "không chạy (không thấy testcase $2 trong báo cáo)" ;;
    *) _assert_fail "$label" "$res" ;;
  esac
}
