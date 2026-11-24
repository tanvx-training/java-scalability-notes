# s48 — kiểm đầu vào (thay verify.sh của s47): phần của cuối s47 mà sự cố st9-node không phá. verify s47 đòi Pod tạm chạy
# trên từng worker, mọi Pod order nối được catalog và Mac :30180 trả 200, mà sự cố st9-node làm hai worker NotReady, nên
# `begin cka s48` lần hai giữa buổi sẽ đỏ ở đó. Ở đây: hai dòng tệp của s47 (answers.env, mục s47 của sổ tay:
# s47/files/facts.sh với FAST=1, không tạo Pod tạm) và CORE_CP của s46/files/core-facts.sh (control plane, etcd). Chỉ đọc.
# Nạp bởi `lab` (bash 3.2). Chờ apiserver /readyz tối đa 180 giây, cộng core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây)
# và facts s47 (hai lệnh): chậm nhất ~5 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ apiserver nếu đang khởi động: tối đa ~5 phút)"
vm "$cp" 'end=$(($(date +%s) + 180)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ $(date +%s) -ge $end ]; do sleep 2; done' >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "FAST=1
$(cat "$SESSION_DIR/../s47/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
both() { local r="" x; for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; ${x}: $(fact $x)"; done; [ -n "$r" ] && echo "${r#; }" || echo "đạt"; }
expect_eq "Đầu ra s47: answers.env (DNS_ZONE_FOUND, PROXY_NODE, BLOCKING_POLICY, ONE_TEST), mục s47 trong sổ tay" "đạt" both ANS RUNBOOK
expect_eq "Control plane chạy, etcd từ /var/lib/etcd-restore, /readyz" "đạt" echo "$(fact CORE_CP)"
assert_summary
