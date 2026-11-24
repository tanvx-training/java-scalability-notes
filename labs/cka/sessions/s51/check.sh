# s51 — kiểm đầu vào (thay verify.sh của s50): phần của cuối s50 mà sự cố st9-multi không phá. Sự cố này không đụng apiserver,
# etcd hay kubeconfig, nhưng gắn taint NoSchedule lên cka-w2: Pod của shop bị xếp lại trong lúc đó sẽ không về cka-w2, nên
# `begin cka s51` lần hai giữa buổi không đòi shop trải hai worker (dòng CORE_SHOP). Ở đây: kube-apiserver.yaml như bản tốt,
# etcd không lùi; ~/ops.kubeconfig cert mới còn hạn và cấu trúc như s34, dev và admin dùng được; answers.env và mục s50 (cùng
# s50/files/facts.sh, s34/files/facts.sh); ba node Ready và control plane khoẻ (CORE_NODES, CORE_CP của s46/files/core-facts.sh).
# Chỉ đọc. Nạp bởi `lab` (bash 3.2). Chờ apiserver /readyz tối đa 180 giây, cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30
# giây), facts s34 và s50 (~20 lệnh tối đa 20 giây): chậm nhất ~6 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ apiserver nếu đang khởi động: tối đa ~6 phút)"
vm "$cp" 'end=$(($(date +%s) + 180)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ $(date +%s) -ge $end ]; do sleep 2; done' >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "export S34_DURABLE=1
$(cat "$SESSION_DIR/../s34/files/facts.sh")" 2>/dev/null | grep -E '^(DEV|OPS)=')
$(vm "$cp" "$(cat "$s46/notes.sh")
$(cat "$SESSION_DIR/../s50/files/facts.sh")" 2>/dev/null)"
mac_now=$(date +%s)
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/../s50/files/rows.sh"
expect_eq "Đầu ra s50: kube-apiserver.yaml như bản tốt, manifests/ không thừa; etcd không lùi, /readyz" "đạt" rows MANIFEST ETCD
expect_eq "Đầu ra s50: ~/ops.kubeconfig cert mới còn hạn, đúng quyền ops; dev.kubeconfig và admin dùng được" "đạt" more "$(clock)" OPSCERT OPS DEV DEVADMIN
expect_eq "Đầu ra s50: answers.env (ETCD_FLAG, EXPIRED_KUBECONFIG, ETCD_LEADER_ID, ETCD_VERSION), mục s50 trong sổ tay" "đạt" rows ANS RUNBOOK
expect_eq "Ba node Ready, schedulable, v1.37.x; control plane chạy, etcd từ /var/lib/etcd-restore, /readyz" "đạt" rows CORE_NODES CORE_CP
assert_summary
