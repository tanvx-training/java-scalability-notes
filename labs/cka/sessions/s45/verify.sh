# s45 — kiểm (5 dòng): trên từng node (s42/files/node-facts.sh) kubeadm, kubelet, kubectl 1.37.x và hold, repo v1.37, kubelet
# đang chạy bản 1.37; ba node Ready, schedulable, kubelet báo v1.37.x; etcd chạy từ /var/lib/etcd-restore (dòng ETCD của
# s43/files/facts.sh: --data-dir, volumeMount, hostPath, mount thật của container, healthy, /readyz) và revision không lùi so
# với lúc gây sự cố; dữ liệu như cuối s44 (dòng STATE của s43: before-snapshot có, after-snapshot không, order chạy thật,
# release shop deployed, ba node Ready) và curl TỪ MÁY MAC tới 30180 /api/products, /api/orders trả 200; answers.env
# BROKEN_COMPONENTS. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Chờ có giới hạn, không treo khi etcd hỏng: files/probe.sh hỏi etcd trước (tối đa 45 giây, hay tới phút thứ 5 sau khi cka-cp
# bật); etcd không phục vụ thì ba dòng cần apiserver đỏ ngay với lý do đọc từ crictl, không chạy wait.sh (đo sau begin: đỏ
# trong ~1 phút). etcd phục vụ thì chờ như s26 (files/wait.sh, 420 giây) cộng facts s43 (~15 lệnh, mỗi lệnh tối đa 10–120
# giây) và facts s45, node-facts trên ba node, hai vòng curl tối đa 6 × 7 giây: chậm nhất ~18 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ etcd tối đa 45 giây; nếu etcd phục vụ: chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~18 phút)"
etcd="$(vm "$cp" "$(cat "$SESSION_DIR/files/probe.sh")" 2>/dev/null | sed -n 's/^ETCD=//p' | head -n1)"
[ -n "$etcd" ] || etcd="không đọc được trạng thái etcd trên $cp"
if [ "$etcd" = ok ]; then
  vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
  facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s43/files/facts.sh")" 2>/dev/null | grep -E '^(ETCD|STATE|W1_IP)=')
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
else
  facts="$(vm "$cp" "FAST=1
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fi
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
# api <khoá…>: "đạt" khi mọi dữ kiện đạt; etcd không phục vụ thì lý do của probe.
api() {
  local r="" x
  [ "$etcd" = ok ] || { echo "$etcd"; return 0; }
  for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; $(fact $x)"; done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
# Gói, hold, repo, kubelet đang chạy trên từng node (như verify s42; không cần apiserver).
pkg_row() {
  local v out r="" p
  for v in $LAB_VMS; do
    out="$(vm "$v" "$(cat "$SESSION_DIR/../s42/files/node-facts.sh")" 2>/dev/null)"
    nf() { printf '%s\n' "$out" | sed -n "s/^$1=//p" | head -n1; }
    for p in kubeadm kubelet kubectl; do
      case " $(nf PKGS)" in *" $p=1.37."*) ;; *) r="$r; ${v#cka-}: $p $(printf '%s' "$(nf PKGS)" | tr ' ' '\n' | sed -n "s/^$p=//p")" ;; esac
    done
    [ "$(nf HOLD)" = "kubeadm kubectl kubelet " ] || r="$r; ${v#cka-}: hold [$(nf HOLD)]"
    [ "$(nf REPO)" = "core:/stable:/v1.37 " ] || r="$r; ${v#cka-}: repo [$(nf REPO)]"
    case "$(nf KUBELET)" in "Kubernetes v1.37."*) ;; *) r="$r; ${v#cka-}: kubelet $(nf KUBELET)" ;; esac
    [ "$(nf ACTIVE)" = active ] || r="$r; ${v#cka-}: kubelet $(nf ACTIVE)"
  done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
# curl từ chính máy Mac: tối đa 6 lần × (5 giây curl + 2 giây nghỉ). <IP> <đường dẫn> <kiểu: products|orders>
mac_get() {
  local ip="$1" path="$2" i body code
  case "$ip" in [0-9]*.[0-9]*.[0-9]*.[0-9]*) ;; *) echo "không đọc được IP cka-w1"; return 0 ;; esac
  for i in 1 2 3 4 5 6; do
    body="$(curl -s --noproxy '*' --max-time 5 -w '\n%{http_code}' "http://$ip:30180$path" 2>/dev/null)"
    code="$(printf '%s' "$body" | tail -n1)"
    if [ "$code" = 200 ]; then
      case "$path" in
        */products) [ "$(printf '%s' "$body" | grep -o '"id":[0-9]*' | sort -u | wc -l | tr -d ' ')" = 3 ] && { echo "đạt"; return 0; } ;;
        *) printf '%s' "$body" | head -c1 | grep -q '\[' && { echo "đạt"; return 0; } ;;
      esac
    fi
    sleep 2
  done
  echo "Mac $path trả mã ${code:-000}"
}
state_row() {
  local r c
  r="$(api STATE)"
  [ "$etcd" = ok ] || { echo "$r"; return 0; }
  [ "$r" = "đạt" ] && r=""
  for c in "$(mac_get "$(fact W1_IP)" /api/products)" "$(mac_get "$(fact W1_IP)" /api/orders)"; do
    [ "$c" = "đạt" ] || r="${r:+$r; }$c"
  done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "Ba node: kubeadm, kubelet, kubectl 1.37.x và hold; repo pkgs.k8s.io v1.37; kubelet đang chạy bản 1.37" "đạt" pkg_row
expect_eq "Ba node Ready, schedulable, kubelet báo v1.37.x (k get node)" "đạt" api NODES
expect_eq "etcd chạy từ /var/lib/etcd-restore (--data-dir, volumeMount, hostPath, container đang chạy), healthy; revision không lùi; apiserver /readyz" \
  "đạt" api ETCD REV
expect_eq "Dữ liệu như cuối s44: before-snapshot có, after-snapshot không, order chạy, release shop deployed; Mac :30180 /api/products, /api/orders 200" \
  "đạt" state_row
expect_eq "answers.env: BROKEN_COMPONENTS là hai thành phần bị phá" "đạt" echo "$(fact ANS)"
assert_summary
