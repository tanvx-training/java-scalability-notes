# s53 — kiểm đầu vào (thay verify.sh của s52): lõi khoẻ và etcd/dữ liệu như cuối s45. KHÔNG đòi điểm m1: người trượt Mock 1
# vẫn làm được Mock 2. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
#   Dòng 1: ba node Ready, schedulable, v1.37.x; control plane chạy, etcd từ /var/lib/etcd-restore, /readyz (CORE_NODES, CORE_CP
#           của s46/files/core-facts.sh); dữ liệu như cuối s45 (dòng STATE của s43/files/facts.sh: before-snapshot có,
#           after-snapshot không, order chạy, release shop deployed).
#   Dòng 2: shop khoẻ, trải hai worker (CORE_SHOP) — HOẶC shop chỉ hỏng vì câu q12/q14 của m1 còn làm dở: kubelet cka-w1 khác
#           bản tốt của m1 (mocks/m1/files/node.sh STEP=facts) hay DNS của cluster hỏng mà Corefile khác bản tốt của m1. Hai
#           thứ đó là đồ của m1 mà `mock cka m2 start` tự đưa về bản tốt trước khi kiểm lõi khoẻ (mocks/m1/files/heal.sh), nên
#           không chặn s53: dòng xanh, nhãn ghi rõ. Shop hỏng vì lý do khác thì đỏ như thường.
# Chờ như s26 (bootwait + wait.sh: 420 giây khi VM vừa bật, còn lại /readyz tối đa 60 giây), cộng core-facts (~25 lệnh, mỗi
# lệnh tối đa 10–30 giây), facts s43 (~15 lệnh, mỗi lệnh tối đa 10–120 giây) và hai phép thử của m1 (~1 phút): chậm nhất
# ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
m1="$SESSION_DIR/../../mocks/m1"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/../s43/files/facts.sh")" 2>/dev/null | grep '^STATE=')"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/../s50/files/rows.sh"
m1_left=""
if [ "$(fact CORE_SHOP)" != "đạt" ]; then
  w1="$(vm cka-w1 "STEP=facts
$(cat "$m1/files/node.sh")" 2>/dev/null | sed -n 's/^W1_CFG=//p' | head -n1)"
  case "$w1" in ""|"đạt"|"chưa có bản tốt"*) ;; *) m1_left="q12 của m1 (kubelet cka-w1)" ;; esac
  dns="$(vm "$cp" 'sudo -n test -s /root/.lab/m1/Corefile || exit 0
ip=$(kubectl --request-timeout=10s -n kube-system get svc kube-dns -o jsonpath="{.spec.clusterIP}")
dig +short +time=2 +tries=1 @"$ip" kubernetes.default.svc.cluster.local A 2>/dev/null | grep -q "^[0-9]" && exit 0
cf=$(kubectl --request-timeout=10s -n kube-system get cm coredns -o jsonpath="{.data.Corefile}")
[ "$cf" = "$(sudo -n cat /root/.lab/m1/Corefile)" ] || echo hỏng' 2>/dev/null)"
  [ "$dns" = "hỏng" ] && m1_left="${m1_left:+$m1_left, }q14 của m1 (Corefile)"
fi
shop_row() { if [ "$(fact CORE_SHOP)" = "đạt" ] || [ -n "$m1_left" ]; then echo "đạt"; else rows CORE_SHOP; fi; }
label="Shop khoẻ, gateway/catalog/order trải hai worker"
[ -z "$m1_left" ] || label="Shop chưa khoẻ chỉ vì $m1_left còn dở: ./labs/lab mock cka m2 start tự sửa trước khi dựng đề"
expect_eq "Ba node Ready, v1.37.x; control plane chạy, etcd từ /var/lib/etcd-restore, /readyz; dữ liệu như cuối s45" "đạt" rows CORE_NODES CORE_CP STATE
expect_eq "$label" "đạt" shop_row
assert_summary
