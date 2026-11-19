# s40 — lời giải chuẩn: gây sự cố st7-helm như `begin` (setup.sh: xoá answers.env, lab_break st7-helm), rồi chẩn đoán và sửa
# (files/solve.sh): helm list/status/history, so values của revision lỗi với revision tốt, log Pod mới; rollback shop về
# revision tốt (--force-conflicts), rollback demo khỏi pending-upgrade, uninstall demo-canary (pending-install),
# helm repo update; ghi BAD_VALUE. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
