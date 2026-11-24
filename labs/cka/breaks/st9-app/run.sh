# Lỗi st9-app: "ba lỗi tầng ứng dụng trên release shop" (không in ra đã làm gì: đây là đề bài sự cố). Cả ba sửa thẳng đối tượng
# Helm quản lý bằng kubectl (không đổi chart, không đổi values, release vẫn `deployed`):
#   catalog  `kubectl set env` thêm SPRING_CONFIG_IMPORT=configserver:http://config-<4 hex>.shop:8888 (giá trị mới mỗi lần):
#            Spring Boot dừng ngay lúc khởi động vì không có bộ đọc nào cho tiền tố configserver: (không có Spring Cloud
#            Config trong image), Pod mới CrashLoopBackOff; Pod cũ vẫn phục vụ (maxUnavailable 0).
#   order    `kubectl set image` sang shop/order:2.1 (không có ở đâu): Pod mới ErrImagePull/ImagePullBackOff, rollout kẹt,
#            hai Pod cũ vẫn phục vụ (lỗi ẩn: shop vẫn trả lời).
#   gateway  livenessProbe.httpGet.path sang /actuator/health/live (404): startup và readiness vẫn đúng nên rollout đi hết,
#            rồi kubelet giết container sau 3 lần liveness lỗi (~30 giây), restart lặp, CrashLoopBackOff.
# Lỗi khác st1–st8: st2 sửa tệp ~/shop/ (catalog tag 1.1, Secret key của order, NBSP trong JAVA_OPTS của gateway), st4 đổi DB_URL
# của order trong ~/shop/; ở đây là drift trên release Helm, không có tệp nào bị sửa.
# Bản tốt là manifest của chính release (`helm get manifest shop`), lưu thêm ở /root/.lab/st9-app/good.json lần đầu chạy; mốc
# của sự cố ở /root/.lab/st9-app/: cause (giá trị gây lỗi của catalog), broken (Pod hỏng của catalog và order, kèm ReplicaSet),
# ready (Pod đang Ready lúc ghi, mọi namespace).
# Chạy lại được (`begin cka s46` giữa buổi): trước hết đưa ba Deployment về đúng container của manifest release (chỉ trường bị
# sửa) và chờ rollout (tối đa 5 phút), rồi gây lại đúng ba lỗi đó với giá trị catalog mới. Cần trạng thái cuối s45 (release
# shop deployed, ba Deployment); thiếu thì dừng, không gây gì. Đo 11–14 giây, lần chạy lại giữa buổi 23 giây (chờ tối đa ~6 phút). Nạp bởi `lab`
# trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/app.sh")"
