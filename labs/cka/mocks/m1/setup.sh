# Đề mock m1 — dựng đề (chạy bởi `./labs/lab mock cka m1 start`, và bởi s52/apply.sh). Không in lời giải: đề ở trang
# #/practice/cka/mock/m1. Nạp bởi `lab` trên Mac (bash 3.2, set -e), SESSION_DIR = labs/cka/mocks/m1.
#   1. cka-w1: kubelet về bản tốt nếu lần làm trước của m1 còn hỏng (files/heal.sh m1_heal_kubelet: node.sh STEP=restore;
#      sau bootwait: m1_heal_dns Corefile về bản tốt nếu q14 làm dở đã làm DNS hỏng, rồi m1_heal_pods: tạo lại Pod ngoài m1-* còn giữ nameserver sai); cka-cp: kube-scheduler về bản tốt nếu câu q1 của m2 còn hỏng
#      (mocks/m2/files/cp.sh STEP=restore: không thì Pod mới của đề m1 không bao giờ được xếp lịch); xoá mốc started cũ.
#   2. Lõi khoẻ (s46/files/core-facts.sh: ba node, control plane, shop trải hai worker) sau khi chờ như s26 (bootwait + wait.sh);
#      chưa khoẻ thì dừng, không dựng gì, báo `restore cka s51`.
#   3. cka-cp: dọn lần làm trước của **chính đề m1** (namespace m1-*, StorageClass/PV của m1, Corefile về bản tốt, /opt/m1) rồi
#      dựng các câu (files/stage.sh PHASE=main; CRI/CNI thật của cka-w2 làm đáp án q15). Không đụng m2-*, shop, s51-batch,
#      etcd, PV postgres.
#   4. cka-w1: gây lỗi kubelet của q12 (node.sh STEP=break: clusterDNS sai, kubelet vẫn chạy, node vẫn Ready), rồi cka-cp tạo
#      Deployment dns-probe của q12 trên cka-w1 SAU lỗi đó (stage.sh PHASE=after: Pod mới nhận nameserver sai, không Ready).
#   5. Ghi /opt/m1/started (epoch, root 644): mốc "đã dựng" của verify s52; điểm chỉ tính cho việc làm sau mốc này.
# Chạy lại được bất cứ lúc nào (lần làm trước bị xoá sạch). Thường 1–3 phút; chậm nhất ~12 phút (chờ VM vừa bật 7 phút, xoá
# namespace kẹt 5 phút) — in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../../sessions/s46/files"
echo "m1: dọn lần làm trước và dựng đề, thường 1–3 phút (VM vừa bật: tới ~12 phút)…"
M1="$SESSION_DIR"
. "$SESSION_DIR/files/heal.sh"
vm "$cp" 'sudo rm -f /root/.lab/m1/started'
if [ -f "$SESSION_DIR/../m2/files/cp.sh" ]; then vm "$cp" "STEP=restore
$(cat "$SESSION_DIR/../m2/files/cp.sh")"; fi
m1_heal_kubelet
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../../sessions/s26/files/wait.sh")" >/dev/null 2>&1 || true
m1_heal_dns
m1_heal_pods
vm "$cp" 'end=$(($(date +%s) + 120)); until [ "$(kubectl --request-timeout=5s get node -o jsonpath="{range .items[*]}{.status.conditions[?(@.type==\"Ready\")].status}{\"\n\"}{end}" 2>/dev/null | grep -c True)" = 3 ] || [ $(date +%s) -ge $end ]; do sleep 3; done' >/dev/null 2>&1 || true
core="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null || true)"
bad="$(printf '%s\n' "$core" | grep -E '^CORE_(NODES|CP|SHOP)=' | grep -v '=đạt$' || true)"
if [ -n "$bad" ] || [ "$(printf '%s\n' "$core" | grep -c '^CORE_.*=đạt$')" != 3 ]; then
  printf '%s\n' "${bad:-không đọc được lõi khoẻ (s46/files/core-facts.sh)}" | sed 's/^/  /' >&2
  echo "lab: cluster chưa khoẻ, chưa dựng đề m1. Thử: ./labs/lab restore cka s51" >&2
  exit 1
fi
cri="$(vm cka-w2 "sudo -n sed -n 's/^containerRuntimeEndpoint:[[:space:]]*//p' /var/lib/kubelet/config.yaml | head -n1" 2>/dev/null | tr -d '\r')"
cni="$(vm cka-w2 "sudo -n ls /etc/cni/net.d | grep -E '\\.(conf|conflist|json)\$' | sort | head -n1" 2>/dev/null | tr -d '\r')"
dns="$(vm "$cp" 'g=$(kubectl --request-timeout=10s -n kube-system get svc kube-dns -o jsonpath="{.spec.clusterIP}")
used=$(kubectl --request-timeout=10s get svc -A -o jsonpath="{range .items[*]}{.spec.clusterIP}{\"\n\"}{end}")
for b in 10.96.0.100 10.96.0.110 10.96.0.120 10.96.0.130; do printf "%s\n" "$used" | grep -qx "$b" || { echo "$g $b"; break; }; done' 2>/dev/null)"
set -- $dns
[ $# = 2 ] || { echo "lab: không đọc được ClusterIP của kube-dns; thử lại, vẫn lỗi thì ./labs/lab restore cka s51" >&2; exit 1; }
dns_good="$1"; dns_bad="$2"
vm "$cp" "PHASE=main
CRI_W2='$cri'
CNI_W2='$cni'
$(cat "$SESSION_DIR/files/stage.sh")"
vm cka-w1 "STEP=break
DNS_GOOD=$dns_good
DNS_BAD=$dns_bad
$(cat "$SESSION_DIR/files/node.sh")"
vm "$cp" "PHASE=after
DNS_BAD=$dns_bad
$(cat "$SESSION_DIR/files/stage.sh")"
vm "$cp" 'date +%s | sudo tee /root/.lab/m1/started | sudo tee /opt/m1/started >/dev/null && sudo chmod 644 /opt/m1/started'
echo "m1: đã dựng đề (16 câu, namespace m1-q*, đáp án ghi vào /opt/m1/). Bấm giờ 120 phút; xong thì: ./labs/lab mock cka m1 score"
