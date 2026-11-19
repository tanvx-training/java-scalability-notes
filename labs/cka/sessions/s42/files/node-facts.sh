# s42 — dữ kiện của một node (chạy trên từng node bằng user ubuntu, qua `vm`): phiên bản gói kubeadm/kubelet/kubectl, gói
# đang hold, minor của repo pkgs.k8s.io, kubelet đang chạy bản nào. In dạng KHOÁ=giá-trị. Chỉ đọc.
echo "PKGS=$(dpkg-query -W -f='${Package}=${Version} ' kubeadm kubelet kubectl 2>/dev/null)"
echo "HOLD=$(apt-mark showhold 2>/dev/null | grep -xE 'kubeadm|kubelet|kubectl' | sort | tr '\n' ' ')"
echo "REPO=$(grep -ho 'core:/stable:/v[0-9]*\.[0-9]*' /etc/apt/sources.list.d/kubernetes.list 2>/dev/null | sort -u | tr '\n' ' ')"
echo "KUBELET=$(/usr/bin/kubelet --version 2>/dev/null)"
echo "ACTIVE=$(systemctl is-active kubelet 2>/dev/null)"
