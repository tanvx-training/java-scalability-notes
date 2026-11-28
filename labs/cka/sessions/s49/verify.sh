# s49 — kiểm (6 dòng): ba manifest control plane như bản tốt (nội dung YAML) và manifests/ không có tệp thừa; Deployment tạm
# được xếp lịch và đạt 2 replica trong 90 giây (scheduler, controller-manager); ~/drills/s49/backup/kube-apiserver.yaml là
# bản chép trước khi sửa (sha256 bằng bản hỏng); answers.env (APISERVER_BAD_FLAG, SCHEDULER_SYMPTOM, CM_SYMPTOM); mục s49
# trong sổ tay; lõi khoẻ (s46/files/core-facts.sh: bốn static pod Running, etcd từ /var/lib/etcd-restore, /readyz, ba
# node, shop trải hai worker). Bản tốt và mốc là của sự cố st9-cp (/root/.lab/st9-cp/). Chấm trạng thái: sửa bằng vim (thứ tự
# khoá khác) hay sed đều được. Chỉ đọc, trừ namespace tạm lab-verify-s49-… (xoá khi xong). Nạp bởi `lab` trên Mac (bash 3.2).
# Không treo khi apiserver đang hỏng: hỏi etcd trước (s45/files/probe.sh), rồi chờ /readyz có giới hạn (tới phút thứ 5 sau
# khi VM bật, hay 60 giây); chỉ khi apiserver đã trả lời mới chờ shop như s26 (s46/files/bootwait.sh + s26/files/wait.sh, 420
# giây). Cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây) và facts (Deployment tạm tối đa 90 giây, ~10 lệnh tối đa
# 20 giây): chậm nhất ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ etcd, apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
etcd="$(vm "$cp" "$(cat "$SESSION_DIR/../s45/files/probe.sh")" 2>/dev/null | sed -n 's/^ETCD=//p')"
if [ "$etcd" = ok ] && vm "$cp" 'now=$(date +%s); boot=$(date -d "$(uptime -s)" +%s); end=$((boot + 300)); [ $end -gt $((now + 60)) ] || end=$((now + 60))
until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; do [ $(date +%s) -lt $end ] || exit 1; sleep 2; done' >/dev/null 2>&1; then
  vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
fi
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
core_row() {
  local r="" x v
  [ "$etcd" = ok ] || r="etcd: ${etcd:-không đọc được}"
  for x in CORE_CP CORE_NODES CORE_SHOP; do v="$(fact $x)"; [ "$v" = "đạt" ] || r="${r:+$r; }${v:-$x không đọc được}"; done
  [ -n "$r" ] && echo "$r" || echo "đạt"
}
expect_eq "Ba manifest (apiserver, scheduler, controller-manager) như bản tốt; /etc/kubernetes/manifests không có tệp thừa" "đạt" echo "$(fact MANIFESTS)"
expect_eq "Deployment tạm 2 replica được xếp lịch và sẵn sàng trong 90 giây (scheduler, controller-manager làm việc)" "đạt" echo "$(fact SCHED)"
expect_eq "~/drills/s49/backup/kube-apiserver.yaml là bản chép TRƯỚC khi sửa (sha256 bằng bản hỏng)" "đạt" echo "$(fact BACKUP)"
expect_eq "answers.env: APISERVER_BAD_FLAG, SCHEDULER_SYMPTOM, CM_SYMPTOM" "đạt" echo "$(fact ANS)"
expect_eq "~/notes/runbook.md có mục s49 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng" "đạt" echo "$(fact RUNBOOK)"
expect_eq "Lõi khoẻ: bốn static pod Running, etcd từ /var/lib/etcd-restore, /readyz; ba node; shop trải hai worker, postgres-0" "đạt" core_row
assert_summary
