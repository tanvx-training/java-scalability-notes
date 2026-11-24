# s51 — gây sự cố của buổi tổng hợp (chạy bởi `./labs/lab begin cka s51`). Không nói đã làm gì: đề sáu câu ở trang buổi.
# Làm lại buổi: tệp đáp án của lần trước trong /opt/answers/ không được tính (tên Pod ngốn CPU và mã lô đổi mỗi lần). Không xoá
# ~/notes/runbook.md. Chạy lại giữa buổi được: sự cố st9-multi gỡ taint, xoá namespace s51-batch rồi dựng lại.
vm "$LAB_CP" "mkdir -p ~/notes && sudo install -d -m 755 -o \$(id -u) -g \$(id -g) /opt/answers &&
  sudo rm -f /opt/answers/top-cpu.txt /opt/answers/node-metrics.json /opt/answers/events.txt /opt/answers/sidecar.log"
echo "s51: đã xoá bốn tệp đáp án của lần trước trong /opt/answers/ (nếu có). Đang gây sự cố, thường ~1 phút (chạy lại: tới ~3 phút)…"
lab_break st9-multi
echo "s51: đã gây sự cố: \"một lô việc batch mới vào namespace s51-batch, vài thứ chưa chạy\". Bấm giờ 60 phút cho sáu câu; làm Q1–Q4 trước."
