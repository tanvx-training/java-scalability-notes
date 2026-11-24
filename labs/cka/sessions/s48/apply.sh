# s48 — lời giải chuẩn: gây sự cố st9-node như `begin` (setup.sh: xoá answers.env, lab_break st9-node), rồi đi đúng thứ tự
# của buổi: files/solve-cp.sh STEP=look trên cka-cp (node, Conditions, thử kubectl debug node trên node hỏng), files/solve-node.sh
# trên từng worker (systemctl, journalctl, sửa đúng dòng hỏng; in FIELD=<trường config.yaml đã sửa> nếu có), rồi
# solve-cp.sh STEP=fix (chờ Ready, đọc cgroupDriver bằng kubectl debug node, postgres-0, trải lại hai worker nếu mất,
# answers.env, mục s48 của sổ tay), rồi chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "STEP=look
$(cat "$SESSION_DIR/files/solve-cp.sh")"
field=""
for v in cka-w1 cka-w2; do
  out="$(vm "$v" "$(cat "$SESSION_DIR/files/solve-node.sh")")"
  printf '%s\n' "$out" | grep -v '^FIELD=' || true
  f="$(printf '%s\n' "$out" | sed -n 's/^FIELD=//p' | tail -n1)"
  [ -z "$f" ] || field="$f"
done
[ -n "$field" ] || { echo "s48: không tìm ra trường hỏng trong config.yaml của cka-w2" >&2; exit 1; }
vm "$LAB_CP" "STEP=fix
FIELD=$field
$(cat "$SESSION_DIR/files/solve-cp.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
