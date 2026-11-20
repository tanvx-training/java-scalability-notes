# Lỗi st8-ops: "sự cố sau nâng cấp và sau restore" (không in ra đã làm gì: đây là đề bài sự cố). Ba bước, mỗi bước một tệp
# cùng thư mục (chú thích đầu mỗi tệp ghi đủ):
#   etcd.sh STEP=prep   (cka-cp) đưa manifest etcd về bản tốt nếu lần trước đã gây lỗi, chờ etcd và apiserver, ghi mốc.
#   kubelet.sh          (cka-w2) hạ kubelet về 1.36.6-1.1 (gói .deb ghim sha256), hold ở 1.36.
#   etcd.sh STEP=break  (cka-cp) sửa manifest etcd để etcd không khởi động được (không bao giờ trên data-dir rỗng hay cũ).
# Chạy lại được (`begin cka s45` giữa buổi): bước prep luôn đưa etcd về bản tốt trước khi gây lại. Mất ~2–4 phút. Cần trạng
# thái cuối s44; thiếu thì dừng, không gây gì. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "STEP=prep
$(cat "$SESSION_DIR/etcd.sh")"
vm cka-w2 "$(cat "$SESSION_DIR/kubelet.sh")"
vm "$LAB_CP" "STEP=break
$(cat "$SESSION_DIR/etcd.sh")"
