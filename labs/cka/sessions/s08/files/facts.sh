# Đọc trên control plane (cần sudo) sáu giá trị cấu hình của cluster kubeadm, in dạng KEY=giá-trị.
# Dùng chung cho apply.sh (ghi đáp án) và verify.sh (so đáp án). Nguồn: manifest static pod, cấu hình kubelet, chứng chỉ.
m=/etc/kubernetes/manifests
flag() { sudo grep -oE -- "--$2=[^ \"]+" "$m/$1" | head -n1 | cut -d= -f2-; }
echo "ETCD_DATA_DIR=$(flag etcd.yaml data-dir)"
echo "APISERVER_ADVERTISE_ADDRESS=$(flag kube-apiserver.yaml advertise-address)"
echo "POD_CIDR=$(flag kube-controller-manager.yaml cluster-cidr)"
echo "SERVICE_CIDR=$(flag kube-apiserver.yaml service-cluster-ip-range)"
echo "KUBELET_CGROUP_DRIVER=$(sudo awk '$1=="cgroupDriver:"{print $2}' /var/lib/kubelet/config.yaml)"
end="$(sudo openssl x509 -noout -enddate -in /etc/kubernetes/pki/apiserver.crt | cut -d= -f2)"
echo "APISERVER_CERT_EXPIRY=$(date -u -d "$end" +%F)"
