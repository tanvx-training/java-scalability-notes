# Lỗi st9-cp: "ba manifest control plane bị sửa trong một lần dọn dẹp" (không in ra đã làm gì: đây là đề bài sự cố). Mọi
# bước chạy trên cka-cp (cp.sh cùng thư mục), chỉ sửa ba tệp trong /etc/kubernetes/manifests/, không gọi kubectl để đưa về:
#   kube-apiserver.yaml           một cờ có ký tự NBSP (U+00A0) chen trước dấu `=` (cờ chọn ngẫu nhiên mỗi lần trong sáu cờ,
#                                 ghi ở /root/.lab/st9-cp/flag): container thoát ngay với `Error: unknown flag: --<cờ> ` —
#                                 tên cờ trông đúng, ký tự lạ chỉ thấy bằng `cat -A` (M-BM-) hay `:set list` trong vim.
#                                 kubectl: `The connection to the server …:6443 was refused`.
#   kube-scheduler.yaml           --kubeconfig=/etc/kubernetes/scheduler.config (tệp không có): `"command failed" err="stat
#                                 /etc/kubernetes/scheduler.config: no such file or directory"`, CrashLoopBackOff; Pod mới
#                                 Pending, không có event nào (không ai xếp lịch, không ai báo FailedScheduling).
#   kube-controller-manager.yaml  --root-ca-file=/etc/kubernetes/pki/ca.cert (tệp không có): chạy ~20 giây tới khi giành được
#                                 leader lease rồi thoát (`error parsing root-ca-file at /etc/kubernetes/pki/ca.cert …`);
#                                 Deployment tạo/scale không có ReplicaSet, Pod mới; namespace mới không có ServiceAccount
#                                 default (đo).
# Khác st8-ops (manifest etcd, kubelet 1.36) và mọi lỗi st1–st7: ở đây etcd, dữ liệu và node không bị đụng.
# Bản tốt (ba manifest) lưu ở /root/.lab/st9-cp/ lần đầu chạy, chỉ khi control plane đang khoẻ; mốc: flag và broken.sha256
# (sha256 của ba bản hỏng, verify đòi ~/drills/s49/backup/kube-apiserver.yaml trùng bản hỏng: chép TRƯỚC khi sửa).
# Chạy lại được (`begin cka s49` giữa buổi, cả khi apiserver vẫn đang hỏng): dời tệp thừa (không phải bốn manifest, không
# bắt đầu bằng dấu chấm) khỏi manifests/ sang ~/drills/s49/stray/, cài lại bản tốt bằng tệp (không cần apiserver), chờ ba
# thành phần chạy và /readyz, rồi gây lại đúng ba lỗi (cờ apiserver chọn lại). Cần etcd phục vụ (cuối s48); không thì dừng,
# không gây gì. Thường ~1–1,5 phút (chạy lại khi đang hỏng: tới ~5 phút). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/cp.sh")"
