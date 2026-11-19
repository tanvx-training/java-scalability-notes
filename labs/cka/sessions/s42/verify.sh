# s42 — kiểm (5 dòng): ba node kubelet v1.37.x cùng bản, Ready, schedulable; kube-apiserver/controller-manager/scheduler image
# v1.37.x, etcd/CoreDNS/kube-proxy đúng image `kubeadm config images list` của bản đó, kubeadm-config 1.37; shop (release, ba
# service ≥ 2 replica, postgres) và cert-manager (Certificate shop-local, webhook nhận dry-run) chạy; curl TỪ MÁY MAC tới
# 30180, Ingress :30080, Gateway :30280 trả 200 (một dòng). Trên từng node (files/node-facts.sh): kubeadm, kubelet, kubectl
# 1.37.x và hold, repo pkgs.k8s.io v1.37, kubelet active bản 1.37. ~/drills/s42/loop-cp-w1.log: cka-cp rồi cka-w1 được drain,
# lên 1.37 trong lúc drain, uncordon, 0 lỗi; loop-w2.log: cka-w2 cũng vậy, W2_OUTAGE_SECONDS khớp khoảng lỗi (±10 giây);
# SKEW_RULE. Chỉ đọc (một Certificate tạo thử bằng --dry-run=server, không lưu). Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) cộng facts.sh (~25 lệnh kubectl/helm/kubeadm, mỗi lệnh tối
# đa 10–30 giây), node-facts.sh trên ba node (vài giây) và ba vòng curl tối đa 6 × 7 giây: chậm nhất ~22 phút, in ra đúng
# con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~22 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

# Gói, hold, repo trên từng node.
pkg_row() {
  local v out r="" p
  for v in $LAB_VMS; do
    out="$(vm "$v" "$(cat "$SESSION_DIR/files/node-facts.sh")" 2>/dev/null)"
    nf() { printf '%s\n' "$out" | sed -n "s/^$1=//p" | head -n1; }
    for p in kubeadm kubelet kubectl; do
      case " $(nf PKGS)" in *" $p=1.37."*) ;; *) r="$r; $v: $p $(printf '%s' "$(nf PKGS)" | tr ' ' '\n' | sed -n "s/^$p=//p")" ;; esac
    done
    [ "$(nf HOLD)" = "kubeadm kubectl kubelet " ] || r="$r; $v: hold [$(nf HOLD)]"
    [ "$(nf REPO)" = "core:/stable:/v1.37 " ] || r="$r; $v: repo [$(nf REPO)]"
    case "$(nf KUBELET)" in "Kubernetes v1.37."*) ;; *) r="$r; $v: kubelet $(nf KUBELET)" ;; esac
    [ "$(nf ACTIVE)" = active ] || r="$r; $v: kubelet $(nf ACTIVE)"
  done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
# curl từ chính máy Mac: tối đa 6 lần × (5 giây curl + 2 giây nghỉ). Có host thì gửi kèm --resolve shop.local.
mac_get() { # <IP> <cổng> <host hay ->
  local ip="$1" port="$2" host="$3" i body code url
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo ":$port không đọc được IP node"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    if [ "$host" = - ]; then
      body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:$port/api/products" 2>/dev/null)"
    else
      body="$(curl -s --noproxy '*' --max-time 5 --resolve "$host:$port:$ip" -w '\n%{http_code}' "http://$host:$port/api/products" 2>/dev/null)"
    fi
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ] && [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ]; then
      echo "đạt"; return 0
    fi
    sleep 2
  done
  echo ":$port/api/products trả mã ${code:-000}"
}
cluster_row() {
  local r="" x c
  for x in CLUSTER APPS; do [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"; done
  for c in "$(mac_get "$(fact W1_IP)" 30180 -)" "$(mac_get "$(fact W1_IP)" 30080 shop.local)" "$(mac_get "$(fact DP_IP)" 30280 shop.local)"; do
    [ "$c" = "đạt" ] || r="$r; $c"
  done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
expect_eq "Ba node v1.37.x cùng bản, Ready, schedulable; control plane, etcd, CoreDNS (có PDB), kube-proxy theo kubeadm 1.37; shop, cert-manager (Certificate, webhook) chạy; từ Mac :30180, Ingress :30080, Gateway :30280 trả 200" \
  "đạt" cluster_row
expect_eq "Ba node: kubeadm, kubelet, kubectl 1.37.x và hold; repo pkgs.k8s.io trỏ v1.37; kubelet active bản 1.37" "đạt" pkg_row
expect_eq "~/drills/s42/loop-cp-w1.log: cka-cp rồi cka-w1 được drain, lên 1.37 trong lúc drain, uncordon; request đều, 0 lỗi" \
  "đạt" echo "$(fact LOG1)"
expect_eq "~/drills/s42/loop-w2.log: cka-w2 được drain, lên 1.37, uncordon; W2_OUTAGE_SECONDS khớp khoảng lỗi trong log (±10 giây)" \
  "đạt" echo "$(fact LOG2)"
expect_eq "answers.env: SKEW_RULE là số minor kubelet được cũ hơn kube-apiserver" "đạt" echo "$(fact SKEW)"
assert_summary
