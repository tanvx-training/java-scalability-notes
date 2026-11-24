# s51 — lời giải chuẩn: gây sự cố st9-multi như `begin` (setup.sh: xoá bốn tệp đáp án cũ, lab_break st9-multi), rồi
# files/solve.sh trên cka-cp (Q2, Q3, Q4, Q1 vào /opt/answers/; sửa report-svc và mở DNS; sửa nodeSelector của indexer và gỡ
# taint; shop trải hai worker; mục s51 của sổ tay; xoá Pod ngốn CPU), rồi chờ shop như s26. Trạng thái cuối là đầu vào của hai
# đề mock (mốc st9-done): lõi khoẻ, namespace s51-batch còn mà không có cruncher, /opt/answers/ chủ ubuntu, không còn lỗi nào.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/solve.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
