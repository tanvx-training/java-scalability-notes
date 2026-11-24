# s47 — kiểm đầu vào (thay verify.sh của s46): phần của cuối s46 mà sự cố st9-net không phá. verify s46 đòi shop rollout xong
# trên hai worker và Mac :30180 trả 200, mà sự cố st9-net làm cả hai đỏ (DNS, kube-proxy của cka-w1), nên `begin cka s47` lần
# hai giữa buổi sẽ đỏ ở đó. Ở đây: ba dòng tệp của s46 (sổ tay bốn tầng, not-ready.txt, answers.env: s46/files/facts.sh) và
# CORE_NODES, CORE_CP của s46/files/core-facts.sh (node, control plane, etcd). Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Chờ apiserver /readyz tối đa 180 giây, cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây) và facts s46: chậm nhất ~5
# phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ apiserver nếu đang khởi động: tối đa ~5 phút)"
vm "$cp" 'end=$(($(date +%s) + 180)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ $(date +%s) -ge $end ]; do sleep 2; done' >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$s46/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
both() { local r="" x; for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; ${x}: $(fact $x)"; done; [ -n "$r" ] && echo "${r#; }" || echo "đạt"; }
expect_eq "Đầu ra s46: ~/notes/runbook.md bốn tầng" "đạt" echo "$(fact RUNBOOK)"
expect_eq "Đầu ra s46: not-ready.txt và answers.env của s46" "đạt" both NOTREADY ANS
expect_eq "Ba node Ready, schedulable, v1.37.x; control plane chạy, etcd từ /var/lib/etcd-restore, /readyz" "đạt" both CORE_NODES CORE_CP
assert_summary
