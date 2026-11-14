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
LAB_TEST_REPORTS=""

lab_tests() { LAB_TEST_REPORTS="$1"; }

# _lab_report_files: danh sách tệp báo cáo, mỗi dòng một tệp
_lab_report_files() {
  if [ -n "$LAB_TEST_REPORTS" ]; then
    [ -d "$LAB_TEST_REPORTS" ] && find "$LAB_TEST_REPORTS" -type f -name '*.xml' -print
  elif [ "${LAB_MVN_RAN:-0}" = 1 ]; then
    find "${WS:-.}" -name .git -prune -o -type f -path '*/target/surefire-reports/*.xml' -print
  fi
  return 0
}

# _lab_test_result <lớp> <phương thức>: in "ok", lý do không đạt, hoặc rỗng khi không thấy testcase.
# Khớp đúng classname; name bằng phương thức (hoặc "phương_thức(…" / "phương_thức[…" của test tham số hoá,
# khi đó mọi lần chạy đều phải đạt). Bỏ CDATA và chú thích trước khi tìm failure/error/skipped.
_lab_test_result() {
  _lab_report_files | awk -v cls="$1" -v m="$2" '
    function attr(t, a,   r) {
      if (!match(t, "[ \t\r\n]" a "=\"[^\"]*\"")) return ""
      r = substr(t, RSTART + 1, RLENGTH - 1); sub(/^[^=]*="/, "", r); sub(/"$/, "", r)
      gsub(/&lt;/, "<", r); gsub(/&gt;/, ">", r); gsub(/&quot;/, "\"", r); gsub(/&amp;/, "\\&", r)
      return r
    }
    function cut(s, op, cl,   i, j, out) {
      out = ""
      while ((i = index(s, op)) > 0) {
        out = out substr(s, 1, i - 1)
        s = substr(s, i + length(op))
        j = index(s, cl)
        if (j == 0) { s = ""; break }
        s = substr(s, j + length(cl))
      }
      return out s
    }
    function scan(s,   i, e, c, tag, body, nm, why, t) {
      s = cut(s, "<![CDATA[", "]]>"); s = cut(s, "<!--", "-->")
      while ((i = index(s, "<testcase")) > 0) {
        s = substr(s, i + 9)
        c = substr(s, 1, 1)
        if (c != " " && c != "\t" && c != "\n" && c != "\r" && c != "/" && c != ">") continue
        e = index(s, ">"); if (e == 0) break
        tag = substr(s, 1, e - 1); s = substr(s, e + 1)
        body = ""
        if (substr(tag, length(tag)) != "/") {
          e = index(s, "</testcase>")
          if (e == 0) { body = s; s = "" } else { body = substr(s, 1, e - 1); s = substr(s, e + 11) }
        }
        if (attr(tag, "classname") != cls) continue
        nm = attr(tag, "name")
        if (nm != m && index(nm, m "(") != 1 && index(nm, m "[") != 1) continue
        found = 1
        why = ""
        if (match(body, /<failure[ \t\r\n\/>]/)) why = "thất bại (failure)"
        else if (match(body, /<error[ \t\r\n\/>]/)) why = "lỗi (error)"
        else if (match(body, /<skipped[ \t\r\n\/>]/)) why = "bị bỏ qua (skipped)"
        if (why != "") {
          t = substr(body, RSTART); e = index(t, ">"); if (e > 0) t = substr(t, 1, e)
          t = attr(t, "message")
          if (t != "") why = why ": " t
          if (bad == "") bad = why
        }
      }
    }
    { f = $0; s = ""; while ((getline line < f) > 0) s = s line "\n"; close(f); scan(s) }
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
  res="$(_lab_test_result "${id%#*}" "${id#*#}")"
  case "$res" in
    ok) _assert_pass "$label" ;;
    '') _assert_fail "$label" "không chạy (không thấy testcase $2 trong báo cáo)" ;;
    *) _assert_fail "$label" "$res" ;;
  esac
}
