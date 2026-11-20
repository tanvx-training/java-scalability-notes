# s45 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s45`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính. Chạy lại giữa buổi được: sự cố st8-ops đưa etcd về bản tốt trước rồi gây lại.
vm "$LAB_CP" "mkdir -p ~/drills/s45 && rm -f ~/drills/s45/answers.env"
echo "s45: đã xoá ~/drills/s45/answers.env của lần trước (nếu có). Đang gây sự cố, thường dưới 1 phút (sau một sự cố dài có thể tới ~8 phút)…"
lab_break st8-ops
echo "s45: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k get node' trên $LAB_CP."
