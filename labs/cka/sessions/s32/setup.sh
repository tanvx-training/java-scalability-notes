# s32 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s32`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính.
vm "$LAB_CP" "mkdir -p ~/drills/s32 && rm -f ~/drills/s32/answers.env"
echo "s32: đã xoá ~/drills/s32/answers.env của lần trước (nếu có)."
lab_break st5-network
echo "s32: đã gây sự cố. Bấm giờ 25 phút; bắt đầu từ 'curl -s -o /dev/null -w \"%{http_code}\\n\" http://shop.local:30080/api/products' trên $LAB_CP."
