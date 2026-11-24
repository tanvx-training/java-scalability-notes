# s50 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s50`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính (cờ hỏng đổi mỗi lần). Không xoá ~/notes/runbook.md. Chạy lại giữa buổi
# được, cả khi apiserver vẫn đang hỏng: sự cố st9-etcd đưa manifest về bản tốt bằng tệp (không cần kubectl) rồi gây lại, và
# dựng lại ~/ops.kubeconfig với một cert hết hạn mới (cert bạn đã cấp lần trước bị thay).
vm "$LAB_CP" "mkdir -p ~/drills/s50 ~/notes && rm -f ~/drills/s50/answers.env"
echo "s50: đã xoá ~/drills/s50/answers.env của lần trước (nếu có). Đang gây sự cố, thường dưới 1 phút (chạy lại khi đang hỏng: tới ~2 phút)…"
lab_break st9-etcd
echo "s50: đã gây sự cố: \"sau một lần xoay vòng chứng chỉ, kubectl không vào được cluster, và nhóm ops báo kubeconfig của họ bị từ chối\". Bấm giờ 20 phút."
