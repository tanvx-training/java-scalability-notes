# s47 — lời giải chuẩn: gây sự cố st9-net như `begin` (setup.sh: xoá answers.env, lab_break st9-net), rồi files/solve.sh trên
# cka-cp (phép thử một lệnh trên từng worker, CoreDNS, kube-proxy, NetworkPolicy, thử lại, answers.env, mục s47 của sổ tay),
# rồi chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/solve.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
