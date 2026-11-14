# s16 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s16`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính (mã thoát và byte phải đọc lại trên sự cố mới).
vm "$LAB_CP" "rm -f ~/drills/s16/answers.env"
echo "s16: đã xoá ~/drills/s16/answers.env của lần trước (nếu có)."
lab_break st2-pods-broken
echo "s16: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k -n shop get pod' trên $LAB_CP."
