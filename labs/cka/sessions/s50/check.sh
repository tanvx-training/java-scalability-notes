# s50 — kiểm đầu vào (thay verify.sh của s49): phần của cuối s49 đọc được KHI APISERVER KHÔNG CHẠY (sự cố st9-etcd làm nó chết,
# và `begin cka s50` lần hai giữa buổi phải đi được). Ở đây: manifest scheduler và controller-manager như bản tốt của s49
# (files/check-facts.sh), bản sao lưu, answers.env và mục s49 của sổ tay (s49/files/facts.sh với FAST=1: chỉ đọc tệp), etcd
# phục vụ (s45/files/probe.sh: sự cố này không đụng etcd). Không xét kube-apiserver.yaml (sự cố sửa nó), không gọi kubectl.
# Chỉ đọc. Nạp bởi `lab` (bash 3.2). Chậm nhất ~5,5 phút (probe chờ etcd tới phút thứ 5 sau khi VM bật, hai lần đọc tệp mỗi
# lần dưới 30 giây), in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ etcd nếu VM vừa bật: tối đa ~5,5 phút)"
facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s45/files/probe.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)
$(vm "$cp" "FAST=1
$(cat "$SESSION_DIR/../s49/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
both() { local r="" x; for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; ${x}: $(fact $x)"; done; [ -n "$r" ] && echo "${r#; }" || echo "đạt"; }
expect_eq "Đầu ra s49: kube-scheduler.yaml, kube-controller-manager.yaml như bản tốt" "đạt" echo "$(fact CPFILES)"
expect_eq "Đầu ra s49: ~/drills/s49/backup/, answers.env (APISERVER_BAD_FLAG, SCHEDULER_SYMPTOM, CM_SYMPTOM), mục s49 trong sổ tay" \
  "đạt" both BACKUP ANS RUNBOOK
expect_eq "etcd trên cka-cp phục vụ (endpoint health)" "ok" echo "$(fact ETCD)"
assert_summary
