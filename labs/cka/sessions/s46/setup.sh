# s46 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s46`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án và not-ready.txt của lần trước không được tính (giá trị gây lỗi và tên Pod đổi mỗi lần). Không xoá
# ~/notes/runbook.md (sổ tay của cả chặng 9). Chạy lại giữa buổi được: sự cố st9-app đưa shop về bản tốt trước rồi gây lại.
vm "$LAB_CP" "mkdir -p ~/drills/s46 ~/notes && rm -f ~/drills/s46/answers.env ~/drills/s46/not-ready.txt"
echo "s46: đã xoá ~/drills/s46/answers.env, not-ready.txt của lần trước (nếu có). Đang gây sự cố, thường dưới 1 phút (chạy lại giữa buổi: tới ~6 phút)…"
lab_break st9-app
echo "s46: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k get pod -A' trên $LAB_CP."
