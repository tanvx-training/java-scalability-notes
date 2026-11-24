# s46 — lời giải chuẩn: gây sự cố st9-app như `begin` (setup.sh: xoá answers.env và not-ready.txt, lab_break st9-app), rồi
# files/solve.sh trên cka-cp (toàn cảnh, not-ready.txt, nguyên nhân từng Deployment, answers.env, sửa đối tượng cha về đúng
# release, sổ tay bốn tầng), rồi chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/solve.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
