# s40 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s40`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính.
vm "$LAB_CP" "mkdir -p ~/drills/s40 && rm -f ~/drills/s40/answers.env"
echo "s40: đã xoá ~/drills/s40/answers.env của lần trước (nếu có). Đang gây sự cố, mất khoảng 1,5 phút…"
lab_break st7-helm
echo "s40: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'helm list -A' trên $LAB_CP."
