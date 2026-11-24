# s47 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s47`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính (zone sai đổi mỗi lần). Không xoá ~/notes/runbook.md. Chạy lại giữa buổi
# được: sự cố st9-net đưa CoreDNS, kube-proxy và NetworkPolicy về bản tốt trước rồi gây lại.
vm "$LAB_CP" "mkdir -p ~/drills/s47 ~/notes && rm -f ~/drills/s47/answers.env"
echo "s47: đã xoá ~/drills/s47/answers.env của lần trước (nếu có). Đang gây sự cố, thường 1,5–3 phút (chạy lại giữa buổi: tới ~12 phút)…"
lab_break st9-net
echo "s47: đã gây sự cố: \"từ hôm qua đặt hàng lỗi 503 và vài Pod không gọi được nhau\". Bấm giờ 25 phút; bắt đầu từ một Pod busybox trên mỗi worker."
