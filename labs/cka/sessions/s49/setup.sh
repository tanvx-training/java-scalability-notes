# s49 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s49`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án và bản sao lưu của lần trước không được tính (cờ hỏng đổi mỗi lần; bản sao lưu phải là bản hỏng của
# lần này). Không xoá ~/notes/runbook.md. Chạy lại giữa buổi được, cả khi apiserver vẫn đang hỏng: sự cố st9-cp đưa ba
# manifest về bản tốt bằng tệp (không cần kubectl) rồi gây lại.
vm "$LAB_CP" "mkdir -p ~/drills/s49 ~/notes && rm -f ~/drills/s49/answers.env && sudo rm -rf ~/drills/s49/backup"
echo "s49: đã xoá ~/drills/s49/answers.env và ~/drills/s49/backup/ của lần trước (nếu có). Đang gây sự cố, thường 1–1,5 phút (chạy lại khi đang hỏng: tới ~5 phút)…"
lab_break st9-cp
echo "s49: đã gây sự cố: \"sau một lần dọn dẹp cka-cp, kubectl báo connection refused\". Bấm giờ 15 phút cho apiserver, 15 phút cho phần còn lại. Sao lưu trước khi sửa."
