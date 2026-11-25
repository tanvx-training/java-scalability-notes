# m2 — lời giải chuẩn của q16 trên cka-w2 (chỉ dùng trong s53/apply.sh, sau solve.sh PART=1 đã ghi reason lúc sự cố).
# Pod `imagePullPolicy: Never` chỉ dùng image đã có trong containerd của node (namespace k8s.io — namespace mà kubelet dùng qua
# CRI; `ctr` mặc định là namespace `default`, nạp vào đó thì kubelet không thấy). Nạp bản xuất bằng ctr rồi kiểm bằng crictl
# (nhìn đúng như kubelet). Chạy lại được.
set -e
echo "m2/solve-node: nạp /opt/m2-images/tools.tar vào containerd (namespace k8s.io) của cka-w2"
sudo ctr -n k8s.io images import /opt/m2-images/tools.tar
sudo crictl images | grep -E '^m2\.lab/tools[[:space:]]+1\.0' || { echo "m2/solve-node: crictl chưa thấy m2.lab/tools:1.0" >&2; exit 1; }
