# m1 — lời giải chuẩn của q12 trên cka-w1 (chỉ dùng trong s52/apply.sh; bên gửi đặt DNS_GOOD = ClusterIP của Service kube-dns,
# đọc trên cka-cp bằng `kubectl -n kube-system get svc kube-dns`). Pod mới trên cka-w1 có `nameserver <IP lạ>` trong
# /etc/resolv.conf, Pod cùng spec trên cka-w2 thì đúng: nameserver do kubelet của node ghi, từ `clusterDNS` trong
# /var/lib/kubelet/config.yaml. Sửa tệp đó về ClusterIP của kube-dns, restart kubelet (kubelet chỉ đọc tệp lúc khởi động).
# Pod đang chạy giữ resolv.conf cũ: solve.sh tạo lại Pod dns-probe sau bước này. Chạy lại được.
set -e
CFG=/var/lib/kubelet/config.yaml
[ -n "$DNS_GOOD" ] || { echo "m1/solve-node: thiếu DNS_GOOD" >&2; exit 1; }
echo "m1/solve-node: clusterDNS trong $CFG: $(sudo sed -n '/^clusterDNS:/{n;s/^- *//p;}' $CFG), kube-dns: $DNS_GOOD"
sudo sed -i "/^clusterDNS:/{n;s/^- .*/- $DNS_GOOD/;}" $CFG
sudo systemctl restart kubelet
end=$(($(date +%s) + 60)); until sudo systemctl is-active -q kubelet; do [ "$(date +%s)" -lt "$end" ] || { echo "m1/solve-node: kubelet chưa chạy" >&2; exit 1; }; sleep 2; done
echo "m1/solve-node: kubelet $(systemctl is-active kubelet), clusterDNS $(sudo sed -n '/^clusterDNS:/{n;s/^- *//p;}' $CFG)"
