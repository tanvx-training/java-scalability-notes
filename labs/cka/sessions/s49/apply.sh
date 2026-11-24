# s49 — lời giải chuẩn: gây sự cố st9-cp như `begin` (setup.sh: xoá answers.env và backup/, lab_break st9-cp), rồi
# files/solve.sh trên cka-cp (kubectl chết → crictl, log trên đĩa, ss; sao lưu ba manifest TRƯỚC khi sửa; cat -A thấy NBSP;
# chờ kubelet nạp lại; scheduler và controller-manager từ triệu chứng; /livez?verbose; answers.env; mục s49 của sổ tay),
# rồi chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/solve.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
