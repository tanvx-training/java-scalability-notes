# s25 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s25`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính.
vm "$LAB_CP" "mkdir -p ~/drills/s25 && rm -f ~/drills/s25/answers.env"
echo "s25: đã xoá ~/drills/s25/answers.env của lần trước (nếu có)."
lab_break st4-storage
echo "s25: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k get pvc,pv' và 'k get pod -o wide' trên $LAB_CP."
