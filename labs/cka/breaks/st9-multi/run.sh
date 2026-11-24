# Lỗi st9-multi: "một lô việc batch mới được đưa vào cluster, vài thứ chưa chạy" (không in ra đã làm gì: đây là đề bài của buổi
# tổng hợp s51). Mọi bước chạy trên cka-cp (multi.sh cùng thư mục), bằng kubectl:
#   namespace s51-batch   Pod cruncher-<hex> ngốn CPU có chủ ý (vòng lặp rỗng, limits 300m: luôn đứng đầu `k top pod -A`,
#                         đo 5 lần cách 30 giây: 299–301m, Pod kế tiếp 24–100m); Pod ingest hai container (app ghi bốn dòng
#                         INFO, shipper — container phụ — ghi bốn dòng ERROR, mã lô ngẫu nhiên mỗi lần, rồi nằm yên);
#   (a) report            Deployment report (busybox httpd, CGI /cgi-bin/products gọi gateway.shop:8080/api/products) hỏng
#                         hai chỗ cùng lúc: Service report-svc có targetPort 8081 (container nghe 8080; policy chỉ mở ingress
#                         8080 nên gói tới 8081 bị bỏ: curl treo tới hết giờ, đo), và default-deny chặn mọi egress; policy `report`
#                         chỉ mở egress tới gateway của shop, thiếu DNS (CGI trả 502 `bad address 'gateway.shop:8080'` sau
#                         ~20 giây, đo). Gọi qua gateway vì policy `catalog` của s31 chỉ nhận từ gateway, order trong shop.
#   (b) indexer           cka-w2 bị gắn taint lạ maintenance=planned:NoSchedule; Deployment indexer có nodeSelector disk: ssd
#                         (nhãn thật trên cka-w2 là disktype=ssd): Pending, Event Warning FailedScheduling `0/3 nodes are
#                         available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s)`.
# Khác st3-pending (s21: tài nguyên, PVC), st5-network (s32) và st9-net (s47: CoreDNS, kube-proxy, policy của shop): ở đây
# không đụng namespace shop, release shop, etcd, PV postgres; taint NoSchedule không đuổi Pod đang chạy của shop.
# Mốc ở /root/.lab/st9-multi/: top (<ns>/<Pod> ngốn CPU), reason (Event cảnh báo mới nhất của Pod indexer), shipper.log và
# app.log (log thật của hai container), indexer.json (spec container), default-deny.json, started. /opt/answers/ chủ ubuntu.
# Chạy lại được (`begin cka s51` giữa buổi): gỡ taint `maintenance` và nhãn `disk` trên mọi node, xoá cả namespace s51-batch
# (chờ xoá xong), rồi dựng lại đúng các lỗi đó với tên cruncher và mã lô mới. Cần apiserver và ba node Ready (cuối s50); không
# thì dừng, không gây gì. Thường ~1 phút (chạy lại: tới ~2 phút; xoá namespace kẹt: tới ~5 phút). Nạp bởi `lab` trên máy Mac
# (bash 3.2, set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/multi.sh")"
