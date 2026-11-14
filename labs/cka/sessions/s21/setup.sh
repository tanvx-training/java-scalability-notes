# s21 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s21`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính (phải tìm lại trên sự cố mới).
vm "$LAB_CP" "rm -f ~/drills/s21/answers.env"
echo "s21: đã xoá ~/drills/s21/answers.env của lần trước (nếu có)."
lab_break st3-pending
echo "s21: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k get pod -A -o wide' trên $LAB_CP."
