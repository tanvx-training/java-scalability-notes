# s27 — kiểm (8 dòng): ba Service ClusterIP của shop cổng 8080 tên http, targetPort theo tên cổng có trong Pod, YAML trong
# ~/shop/ khớp; Deployment khai cổng http, ~/shop/ khớp; EndpointSlice cổng http, số địa chỉ ready = replicas;
# gateway-nodeport NodePort 30180; curl TỪ MÁY MAC tới IP cka-w1:30180/api/products trả 200 với 3 sản phẩm; KUBE_SVC_CHAIN
# khớp chuỗi iptables hiện hành của shop/catalog:http; PROXY_MODE=iptables (đọc cả từ kube-proxy); Service nháp đã xoá,
# LB_EXTERNAL_IP_STATE. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn (420 giây cho apiserver, postgres-0 và ba Deployment, cộng facts.sh với
# --request-timeout 10 giây mỗi lệnh và vòng curl tối đa 6 × 5 giây: in ra ~10 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~10 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Gọi NodePort từ chính máy Mac (không qua VM): IP là InternalIP của node cka-w1 do API báo, không ghi cứng.
# Tối đa 6 lần × (5 giây curl + 2 giây nghỉ).
mac_curl() {
  local ip="$1" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP của cka-w1"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --max-time 5 -w '\n%{http_code}' "http://$ip:30180/api/products" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  echo "http://$ip:30180/api/products trả mã ${code:-000}"
}

expect_eq "Service gateway, catalog, order: ClusterIP, một cổng 8080 tên http, targetPort là tên cổng 8080 có trong Pod; YAML của chúng trong ~/shop/ khớp" \
  "đạt" echo "$(fact SERVICES)"
expect_eq "Deployment gateway, catalog, order khai containerPort 8080 tên http và rollout xong; ~/shop/ khớp" "đạt" echo "$(fact DEPLOYS)"
expect_eq "EndpointSlice của ba Service: cổng http/8080, số địa chỉ ready (bỏ terminating) bằng replicas" "đạt" echo "$(fact SLICES)"
expect_eq "Service gateway-nodeport: NodePort 30180, port 8080 → cổng 8080 của gateway, selector app=gateway" "đạt" echo "$(fact NODEPORT)"
expect_eq "Từ máy Mac: curl http://<IP cka-w1>:30180/api/products trả 200 với 3 sản phẩm" "đạt" mac_curl "$(fact W1_IP)"
expect_eq "answers.env: KUBE_SVC_CHAIN là chuỗi KUBE-SVC-… hiện hành của shop/catalog:http" "đạt" echo "$(fact SVC_CHAIN)"
expect_eq "answers.env: PROXY_MODE=iptables (kube-proxy trên node báo: $(fact NODE_MODE))" "iptables" echo "$(fact PROXY_MODE)$( [ "$(fact NODE_MODE)" = iptables ] || echo ' (kube-proxy không ở iptables)')"
expect_eq "Service nháp (LoadBalancer, catalog-bad) đã xoá; answers.env: LB_EXTERNAL_IP_STATE=<pending>" "đạt" echo "$(fact DRAFTS)"
assert_summary
