# s50 — kiểm (7 dòng): kube-apiserver.yaml như bản tốt (ba cờ --etcd-* trỏ đúng tệp của CA etcd) và manifests/ không có tệp
# thừa; etcd khoẻ và không bị đụng (revision, raft index không lùi so với lúc begin), /readyz; ~/ops.kubeconfig nhúng cert ops
# MỚI do CA cluster ký, còn hạn ≥ 1 giờ, đồng hồ cka-cp khớp đồng hồ Mac (±5 phút), gọi API đúng quyền ops, và cấu trúc như s34
# (s34/files/facts.sh: một cluster/user/context, server, CA nhúng, key khớp, quyền 600); ~/dev.kubeconfig (như s34) và kubeconfig
# admin vẫn dùng được; answers.env (ETCD_FLAG, EXPIRED_KUBECONFIG, ETCD_LEADER_ID, ETCD_VERSION); mục s50 trong sổ tay; lõi khoẻ
# (s46/files/core-facts.sh); hàm ghép dòng ở files/rows.sh. Bản tốt và mốc là của sự cố st9-etcd (/root/.lab/st9-etcd/). Chấm trạng thái: cert mới qua CSR
# (như s33) hay `kubeadm kubeconfig user` đều được, miễn do CA cluster ký và còn hạn. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Không treo khi apiserver đang hỏng: hỏi etcd trước (s45/files/probe.sh), rồi chờ /readyz có giới hạn (tới phút thứ 5 sau khi
# VM bật, hay 60 giây); chỉ khi apiserver đã trả lời mới chờ shop như s26 (s46/files/bootwait.sh + s26/files/wait.sh, 420 giây).
# Cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây), facts s34 (~5 lệnh kubectl 10 giây) và facts s50 (~15 lệnh tối đa
# 20 giây): chậm nhất ~17 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ etcd, apiserver và Deployment của shop, nếu đang khởi động: tối đa ~17 phút)"
etcd="$(vm "$cp" "$(cat "$SESSION_DIR/../s45/files/probe.sh")" 2>/dev/null | sed -n 's/^ETCD=//p')"
if [ "$etcd" = ok ] && vm "$cp" 'now=$(date +%s); boot=$(date -d "$(uptime -s)" +%s); end=$((boot + 300)); [ $end -gt $((now + 60)) ] || end=$((now + 60))
until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; do [ $(date +%s) -lt $end ] || exit 1; sleep 2; done' >/dev/null 2>&1; then
  vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
fi
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "export S34_DURABLE=1
$(cat "$SESSION_DIR/../s34/files/facts.sh")" 2>/dev/null | grep -E '^(DEV|OPS)=')
$(vm "$cp" "$(cat "$s46/notes.sh")
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
mac_now=$(date +%s)
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/files/rows.sh"
core_row() { more "$([ "$etcd" = ok ] || echo "etcd: ${etcd:-không đọc được}")" CORE_CP CORE_NODES CORE_SHOP; }
ops_row() { more "$(clock)" OPSCERT OPS; }
expect_eq "kube-apiserver.yaml như bản tốt (--etcd-cafile, --etcd-certfile, --etcd-keyfile); manifests/ không có tệp thừa" "đạt" echo "$(fact MANIFEST)"
expect_eq "etcd healthy, không bị đụng (revision, raft index không lùi so với lúc begin); apiserver /readyz" "đạt" echo "$(fact ETCD)"
expect_eq "~/ops.kubeconfig: cert ops MỚI do CA cluster ký, còn hạn ≥ 1 giờ, giờ cka-cp đúng; whoami ops, get nodes, create Forbidden" \
  "đạt" ops_row
expect_eq "~/dev.kubeconfig (như s34) và kubeconfig admin vẫn dùng được" "đạt" rows DEV DEVADMIN
expect_eq "answers.env: ETCD_FLAG, EXPIRED_KUBECONFIG, ETCD_LEADER_ID, ETCD_VERSION" "đạt" echo "$(fact ANS)"
expect_eq "~/notes/runbook.md có mục s50 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng" "đạt" echo "$(fact RUNBOOK)"
expect_eq "Lõi khoẻ: bốn static pod Running, etcd từ /var/lib/etcd-restore, /readyz; ba node; shop trải hai worker, postgres-0" "đạt" core_row
assert_summary
