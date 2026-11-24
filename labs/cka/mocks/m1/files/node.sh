# m1 — câu q12 (kubelet của cka-w1). Chạy trên cka-w1 (user ubuntu, sudo không hỏi mật khẩu). Bên gửi đặt STEP:
#   STEP=restore  (setup.sh, trước khi kiểm lõi khoẻ) đưa kubelet về bản tốt nếu lần làm trước của m1 còn để lại: cài lại
#                 /var/lib/kubelet/config.yaml từ /root/.lab/m1/config.yaml (bản tốt), gỡ /etc/default/kubelet nếu nó do lần
#                 làm trước thêm `--cluster-dns` (cách lách bằng cờ, xem facts), restart kubelet khi có đổi. Chưa từng gây (không
#                 có bản tốt) thì không làm gì. Không in gì khi thành công.
#   STEP=break    (setup.sh, sau khi dựng các câu khác; bên gửi đặt DNS_GOOD = ClusterIP của kube-dns, DNS_BAD = một IP không
#                 Service nào dùng) lưu bản tốt nếu chưa có — chỉ khi clusterDNS hiện tại là DNS_GOOD và kubelet đang chạy —
#                 rồi đổi clusterDNS trong config.yaml thành DNS_BAD và restart kubelet. Node vẫn Ready (kubelet chạy, không
#                 Pod nào bị đuổi); Pod tạo MỚI trên cka-w1 nhận `nameserver DNS_BAD` trong /etc/resolv.conf và không phân giải
#                 được tên nào. Khác st1 (sai /etc/default/kubelet; disable kubelet), st8-ops (kubelet 1.36), st9-node
#                 (containerd, containerRuntimeEndpoint/clientCAFile làm kubelet chết): ở đây kubelet chạy và node Ready.
#                 Không làm node NotReady có chủ ý: Pod bị đuổi sau 300 giây sẽ dồn sang cka-w2 và (đo) metrics-server
#                 (system-cluster-critical) preempt postgres-0 trên cka-w2.
#   STEP=facts    (score.sh) chỉ đọc, in KHOÁ=giá-trị:
#                 W1_ACTIVE  `systemctl is-active kubelet`
#                 W1_CFG     `đạt` khi config.yaml trùng bản tốt (bỏ dòng trống, khoảng trắng cuối dòng) và /etc/default/kubelet
#                            không có --cluster-dns; còn lại lý do.
# Mọi lệnh có timeout; lỗi ở restore/break thì một dòng `lab: …` ra stderr và trả 1.
H=/root/.lab/m1
CFG=/var/lib/kubelet/config.yaml
S() { sudo -n timeout 30 "$@"; }
norm() { S cat "$1" 2>/dev/null | sed -e 's/[[:space:]]*$//' -e '/^$/d'; }
dns_now() { S sed -n '/^clusterDNS:/{n;s/^- *//p;}' $CFG | head -n1; }
active() { S systemctl is-active -q kubelet; }
wait_active() {
  local end=$(($(date +%s) + 60))
  until active; do [ "$(date +%s)" -lt "$end" ] || { echo "lab: kubelet của cka-w1 không chạy sau 60 giây" >&2; return 1; }; sleep 2; done
}
case "$STEP" in
  restore)
    S test -f $H/config.yaml || exit 0
    changed=0
    if [ "$(norm $H/config.yaml)" != "$(norm $CFG)" ]; then S install -m 644 $H/config.yaml $CFG; changed=1; fi
    if S grep -q -- '--cluster-dns' /etc/default/kubelet 2>/dev/null; then
      S sed -i 's/[[:space:]]*--cluster-dns[= ][^[:space:]"]*//g' /etc/default/kubelet; changed=1
    fi
    S systemctl enable kubelet >/dev/null 2>&1 || true
    if [ "$changed" = 1 ] || ! active; then S systemctl restart kubelet || true; fi
    wait_active || exit 1
    ;;
  break)
    [ -n "$DNS_GOOD" ] && [ -n "$DNS_BAD" ] || { echo "lab: thiếu DNS_GOOD/DNS_BAD" >&2; exit 1; }
    S install -d -m 700 $H
    if ! S test -f $H/config.yaml; then
      [ "$(dns_now)" = "$DNS_GOOD" ] && active || { echo "lab: kubelet của cka-w1 không ở trạng thái tốt (clusterDNS $(dns_now)), không lưu bản tốt" >&2; exit 1; }
      S cp -p $CFG $H/config.yaml
    fi
    S sed -i "/^clusterDNS:/{n;s/^- .*/- $DNS_BAD/;}" $CFG
    [ "$(dns_now)" = "$DNS_BAD" ] || { echo "lab: không gây được lỗi của câu q12" >&2; exit 1; }
    S systemctl restart kubelet
    wait_active || exit 1
    ;;
  facts)
    echo "W1_ACTIVE=$(S systemctl is-active kubelet 2>/dev/null | head -n1)"
    why=""
    if ! S test -f $H/config.yaml; then why="chưa có bản tốt (chạy mock start)"
    elif [ "$(norm $H/config.yaml)" != "$(norm $CFG)" ]; then why="config.yaml của kubelet cka-w1 khác bản kubeadm (clusterDNS $(dns_now))"
    fi
    S grep -q -- '--cluster-dns' /etc/default/kubelet 2>/dev/null && why="${why:+$why; }/etc/default/kubelet có --cluster-dns (sửa config.yaml, đừng chèn cờ)"
    echo "W1_CFG=${why:-đạt}"
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 1 ;;
esac
