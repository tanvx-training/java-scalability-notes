# Lỗi st9-node: "hai worker NotReady, mỗi node một lý do" (không in ra đã làm gì: đây là đề bài sự cố). Hai tệp cùng thư mục
# (chú thích đầu mỗi tệp ghi đủ): node.sh chạy trên từng worker, cp.sh trên cka-cp.
#   cka-w1  containerd không lên: /etc/containerd/config.toml dòng `SystemdCgroup = true` thành `SystemdCgroup = True` ("một
#           đồng nghiệp bật SystemdCgroup bằng sed"), containerd restart. TOML chỉ có true/false: containerd thoát ngay
#           (`failed to unmarshal TOML at row 109 column 29: toml: incomplete number`), systemd chạy lại mỗi 5 giây. kubelet
#           VẪN chạy và báo runtime hỏng: node NotReady sau ~40 giây, Ready=False `KubeletNotReady` `container runtime is down`
#           (đo). Container đang chạy vẫn sống (KillMode=process: containerd-shim ở lại). Restart kubelet mà chưa sửa
#           containerd làm tệ hơn: kubelet thoát lúc khởi động (`validate CRI v1 runtime API …`), node chuyển Unknown
#           `Kubelet stopped posting node status` (đo, ~45 giây sau).
#   cka-w2  /var/lib/kubelet/config.yaml sai một trường, chọn ngẫu nhiên mỗi lần và ghi ở /root/.lab/st9-node/field của
#           cka-w2: `containerRuntimeEndpoint: unix:///var/run/cri-dockerd.sock` (log `validate CRI v1 runtime API for
#           endpoint "unix:///var/run/cri-dockerd.sock" …`) hay `clientCAFile: /etc/kubernetes/pki/ca.pem` (log `open
#           /etc/kubernetes/pki/ca.pem: no such file or directory`, không nêu tên trường). kubelet restart, thoát ngay, systemd
#           chạy lại mỗi 10 giây; node Unknown sau ~40 giây.
# Khác st1-node-notready (chỉ phá kubelet: /etc/default/kubelet của cka-w1, kubelet disable trên cka-w2) và st8-ops (kubelet
# 1.36 trên cka-w2): ở đây cka-w1 hỏng ở container runtime, cka-w2 ở tệp cấu hình của kubelet.
# Hai node NotReady quá 300 giây thì Pod bị evict (đo: ReplicaSet tạo Pod mới Pending, Pod cũ Terminating tới khi kubelet
# của node đó quay lại; CoreDNS dời sang cka-cp vì chịu được taint control-plane; postgres-0 chờ cka-w2 và Running lại ~8
# giây sau khi kubelet của cka-w2 chạy). Sau đó gateway, catalog, order có thể dồn về một worker: verify đòi trải lại hai
# worker như s41 (`rollout restart`).
# Bản tốt (config.toml, config.yaml của chính node đó) lưu ở /root/.lab/st9-node/ trên mỗi worker lần đầu chạy, chỉ khi
# trạng thái hiện tại là tốt (containerd trả lời crictl, SystemdCgroup true, endpoint và CA đúng, kubelet chạy).
# Chạy lại được (`begin cka s48` giữa buổi): trước hết cài lại hai tệp từ bản tốt, enable và chạy containerd, kubelet, bỏ
# cordon hai worker, chờ ba node Ready, rồi gây lại đúng hai lỗi (trường của cka-w2 chọn lại). Không đụng dữ liệu (etcd, PV
# postgres): chỉ hai tệp cấu hình và hai unit. Cần ba node của cuối s47; thiếu thì dừng, không gây gì. Thường ~1,5 phút
# (lần chạy lại giữa buổi tới ~6 phút). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
for r in w1 w2; do
  vm "cka-$r" "STEP=prep
ROLE=$r
$(cat "$SESSION_DIR/node.sh")"
done
vm "$LAB_CP" "STEP=ready
$(cat "$SESSION_DIR/cp.sh")"
for r in w1 w2; do
  vm "cka-$r" "STEP=break
ROLE=$r
$(cat "$SESSION_DIR/node.sh")"
done
vm "$LAB_CP" "STEP=down
$(cat "$SESSION_DIR/cp.sh")"
