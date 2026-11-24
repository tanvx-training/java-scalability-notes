# Lỗi st9-etcd: "sau một lần xoay vòng chứng chỉ, apiserver không lên và kubeconfig của ops bị từ chối" (không in ra đã làm
# gì: đây là đề bài sự cố). Mọi bước chạy trên cka-cp (cp.sh cùng thư mục), không gọi kubectl để đưa về bản tốt:
#   kube-apiserver.yaml   cờ TLS tới etcd trỏ tệp của một CA khác trong /etc/kubernetes/pki/ (mỗi lần begin chọn một trong bốn,
#                         ghi ở /root/.lab/st9-etcd/flag): --etcd-cafile=pki/ca.crt hay pki/front-proxy-ca.crt (apiserver không
#                         tin cert của etcd: `tls: failed to verify certificate: x509: certificate signed by unknown authority`),
#                         hay --etcd-certfile/--etcd-keyfile = apiserver-kubelet-client hay front-proxy-client (etcd từ chối
#                         client: `remote error: tls: unknown certificate authority`). Container chạy ~20 giây rồi thoát với
#                         `"command failed" err="error creating storage factory: etcd grpc connection not ready: context
#                         deadline exceeded"`, CrashLoopBackOff; kubectl lúc `connection refused`, lúc `context deadline exceeded`
#                         (đo). etcd vẫn khoẻ (`etcdctl endpoint status/health`), log của nó `rejected connection on client
#                         endpoint`.
#   ~/ops.kubeconfig      nhúng cert ops mới tạo bằng `openssl ca` (cùng key ~/users/ops.key, CN=ops O=shop-ops, client auth, do
#   ~/users/ops.crt       CA cluster ký) có notAfter 1–3 ngày trước; ~/users/ops.crt là cùng cert đó. kubectl báo `error: You
#                         must be logged in to the server (Unauthorized)`; lý do chỉ có trong log của apiserver: `x509:
#                         certificate has expired or is not yet valid: current time … is after …` (đo).
# Khác st8-ops (manifest etcd, dữ liệu etcd), st9-cp (cờ gõ hỏng, scheduler, controller-manager) và st6-access (RBAC, kubeconfig
# không nhúng): ở đây etcd, etcd.yaml, dữ liệu, ca.key và các tệp trong pki/ không bị đụng.
# Bản tốt lưu ở /root/.lab/st9-etcd/ lần đầu chạy: kube-apiserver.yaml (chỉ khi apiserver đang khoẻ), ops.kubeconfig và
# users-ops.crt (khi cert nhúng còn hạn, do CA cluster ký); mốc: flag, started, rev và raft (revision, raft index của etcd lúc
# gây), seen (sha256 mọi cert ops có từ trước sự cố: verify đòi cert MỚI).
# Chạy lại được (`begin cka s50` giữa buổi, cả khi apiserver vẫn đang hỏng): dời tệp thừa (không phải bốn manifest, không bắt
# đầu bằng dấu chấm) khỏi manifests/ sang ~/drills/s50/stray/, cài lại manifest tốt bằng tệp, chờ /readyz, dựng lại
# ~/ops.kubeconfig từ bản tốt với một cert hết hạn mới, rồi gây lại cờ (chọn lại). Cần etcd phục vụ (cuối s49); không thì
# dừng, không gây gì. Thường ~40 giây (chạy lại khi đang hỏng: tới ~1,5 phút; kubelet kẹt: tới ~6 phút). Nạp bởi `lab` trên
# máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/cp.sh")"
