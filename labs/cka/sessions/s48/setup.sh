# s48 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s48`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính (trường hỏng của cka-w2 đổi ngẫu nhiên mỗi lần). Không xoá
# ~/notes/runbook.md. Chạy lại giữa buổi được: sự cố st9-node đưa hai worker về bản tốt trước rồi gây lại.
vm "$LAB_CP" "mkdir -p ~/drills/s48 ~/notes && rm -f ~/drills/s48/answers.env"
echo "s48: đã xoá ~/drills/s48/answers.env của lần trước (nếu có). Đang gây sự cố, thường 1–2 phút (chạy lại giữa buổi: tới ~6 phút)…"
lab_break st9-node
echo "s48: đã gây sự cố: \"sáng nay hai worker NotReady, shop chập chờn\". Bấm giờ 20 phút; bắt đầu từ 'k get node' trên $LAB_CP. Pod bị evict sau 5 phút NotReady."
