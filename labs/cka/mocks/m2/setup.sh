# Đề mock m2 — dựng đề (chạy bởi `./labs/lab mock cka m2 start`, và bởi s53/apply.sh). Không in lời giải: đề ở trang
# #/practice/cka/mock/m2. Nạp bởi `lab` trên Mac (bash 3.2, set -e), SESSION_DIR = labs/cka/mocks/m2.
#   1. Chữa phần lần làm dở để lại, TRƯỚC khi kiểm lõi khoẻ (không xoá gì của m1-*):
#      cka-cp: kube-scheduler về bản tốt nếu câu q1 của chính m2 còn hỏng (files/cp.sh STEP=restore);
#      cka-w1: kubelet về bản tốt nếu câu q12 của **m1** còn hỏng (mocks/m1/files/heal.sh m1_heal_kubelet — m1 là chủ của
#      tệp đó); cka-cp, sau khi chờ như s26: Corefile về bản tốt của m1 chỉ khi DNS của cluster đang hỏng vì câu q14 của m1
#      làm dở (m1_heal_dns); rồi tạo lại Pod ngoài m1-* còn giữ nameserver sai và Pod shop chưa Ready vì DNS hỏng, chờ shop
#      sẵn sàng (m1_heal_pods, tối đa ~5 phút).
#   2. Lõi khoẻ (s46/files/core-facts.sh: ba node, control plane, shop trải hai worker) sau khi chờ như s26 (bootwait + wait.sh);
#      chưa khoẻ thì dừng, không dựng gì, báo `restore cka s52`.
#   3. cka-cp: dọn lần làm trước của **chính đề m2** (files/stage.sh PHASE=clean: namespace m2-*, đối tượng cluster tên m2-*,
#      StorageClass mặc định về như cũ, token m2-*, /opt/m2). Không đụng m1-*, shop, s51-batch, etcd đang chạy, PV postgres.
#   4. cka-w2: tạo bản xuất image của q16, gỡ image khỏi containerd (files/w2.sh STEP=prep).
#   5. cka-cp: dựng 16 câu (stage.sh PHASE=main), hỏng kube-scheduler (cp.sh STEP=break: sau khi mọi Pod của đề đã được xếp
#      lịch), tạo Deployment nightly của q1 (stage.sh PHASE=after: Pod của nó Pending).
#   6. Ghi /opt/m2/started (epoch, root 644): mốc "đã dựng" của verify s53; điểm chỉ tính cho việc làm sau mốc này.
# Chạy lại được bất cứ lúc nào (lần làm trước bị xoá sạch). Thường 2–4 phút; chậm nhất ~20 phút (chờ VM vừa bật 7 phút, xoá
# namespace kẹt 5 phút, chờ Pod của đề) — in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../../sessions/s46/files"
M1="$SESSION_DIR/../m1"
echo "m2: dọn lần làm trước và dựng đề, thường 2–4 phút (VM vừa bật: tới ~20 phút)…"
vm "$cp" 'sudo rm -f /root/.lab/m2/started'
vm "$cp" "STEP=restore
$(cat "$SESSION_DIR/files/cp.sh")"
. "$M1/files/heal.sh"
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
  echo "lab: cluster chưa khoẻ, chưa dựng đề m2. Thử: ./labs/lab restore cka s52" >&2
  exit 1
fi
vm "$cp" "PHASE=clean
$(cat "$SESSION_DIR/files/stage.sh")"
vm cka-w2 "STEP=prep
$(cat "$SESSION_DIR/files/w2.sh")"
vm "$cp" "PHASE=main
$(cat "$SESSION_DIR/files/stage.sh")"
vm "$cp" "STEP=break
$(cat "$SESSION_DIR/files/cp.sh")"
vm "$cp" "PHASE=after
$(cat "$SESSION_DIR/files/stage.sh")"
vm "$cp" 'date +%s | sudo tee /root/.lab/m2/started | sudo tee /opt/m2/started >/dev/null && sudo chmod 644 /opt/m2/started'
echo "m2: đã dựng đề (16 câu, namespace m2-q*, đáp án ghi vào /opt/m2/). Bấm giờ 120 phút; xong thì: ./labs/lab mock cka m2 score"
