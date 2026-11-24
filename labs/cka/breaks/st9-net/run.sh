# Lỗi st9-net: "ba lỗi tầng mạng" (không in ra đã làm gì: đây là đề bài sự cố). Cả ba qua kubectl trên cka-cp (net.sh cùng
# thư mục), không sửa tệp nào trong ~/shop/:
#   CoreDNS    Corefile (ConfigMap kube-system/coredns): zone của plugin kubernetes từ cluster.local sang cluster-<4 hex>.internal
#              (giá trị mới mỗi lần). Tên trong cluster rơi xuống `forward . /etc/resolv.conf` và nhận NXDOMAIN từ DNS phía trên;
#              tên ngoài và db.shop.internal (plugin hosts của s28) vẫn được. Chờ tới khi cả hai Pod CoreDNS trả NXDOMAIN cho
#              catalog.shop.svc.cluster.local (plugin reload, ≤ 150 giây).
#   kube-proxy chỉ trên cka-w1: DaemonSet kube-proxy sang updateStrategy OnDelete và volume cấu hình trỏ ConfigMap mới
#              kube-proxy-next (bản sao của kube-proxy với `mode: iptable`, gõ thiếu chữ s) — "một đồng nghiệp thử cấu hình mới
#              trên một node" — rồi xoá Pod kube-proxy của cka-w1: Pod mới đọc cấu hình đó và thoát ngay (CrashLoopBackOff,
#              lỗi đọc được bằng `k -n kube-system logs`), hai node kia giữ Pod cũ. Rule iptables của cka-w1 đứng yên ở lúc
#              đó; rồi `rollout restart` gateway và catalog (lần lượt, chờ xong) để Endpoint đổi: từ Pod trên cka-w1 và từ
#              NodePort 30180 của cka-w1, ClusterIP của gateway, catalog trỏ vào IP Pod đã mất (treo), từ cka-w2 vẫn tới.
#   NetworkPolicy  "gộp policy order vào allow-monitoring": tạo allow-monitoring (chọn app=order, Ingress như policy order cộng
#              cổng 8080 cho namespace monitoring, Egress chỉ tới postgres 5432) rồi xoá policy order. NetworkPolicy chỉ cộng
#              quyền: order vẫn bị default-deny cô lập, và policy duy nhất mở egress riêng cho order giờ là allow-monitoring,
#              thiếu luật tới catalog → order không gọi được catalog (POST /api/orders 503), GET vẫn 200.
# Khác st5-network (selector Service catalog, targetPort Service order, namespace ingress-nginx trong policy order, nhãn CoreDNS
# trong allow-dns-egress — đều sửa tệp ~/shop/) và khác mọi lỗi st1–st8.
# Bản tốt lưu ở /root/.lab/st9-net/ trên cka-cp lần đầu chạy (khi chưa có): Corefile, kube-proxy.json (template và
# updateStrategy của DaemonSet), netpol.json (spec mọi NetworkPolicy của shop lúc đó, tức cuối s45/s46); mốc: zone.
# Chạy lại được (`begin cka s47` giữa buổi): trước hết đưa ba thứ về bản tốt (Corefile, DaemonSet và xoá kube-proxy-next,
# NetworkPolicy đủ và đúng spec, xoá allow-monitoring), chờ kube-proxy, CoreDNS và shop (tối đa ~10 phút), rồi gây lại đúng ba lỗi.
# Không đụng dữ liệu (etcd, PV postgres). Cần trạng thái cuối s46 (hay bản tốt đã lưu); thiếu thì dừng, không gây gì. Đo 80–146
# giây (hai lần rollout của Java, CoreDNS nạp lại), lần chạy lại giữa buổi 183 giây (chờ tối đa ~12 phút). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/net.sh")"
