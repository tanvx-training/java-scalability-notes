# s49 — kiểm đầu vào (thay verify.sh của s48): phần của cuối s48 đọc được KHI APISERVER KHÔNG CHẠY (sự cố st9-cp làm nó chết,
# và `begin cka s49` lần hai giữa buổi phải đi được). Ở đây: hai dòng node của s48 (config.toml, config.yaml của hai worker như
# bản tốt; containerd, kubelet active và enabled trên ba node: s48/files/nodes.sh, mỗi node một lần gọi vm), answers.env và
# mục s48 của sổ tay (s48/files/facts.sh: chỉ đọc tệp), etcd phục vụ (s45/files/probe.sh: sự cố này không đụng etcd). Không
# gọi kubectl. Chỉ đọc. Nạp bởi `lab` (bash 3.2). Chậm nhất ~6 phút (probe chờ etcd tới phút thứ 5 sau khi VM bật, ba node mỗi
# node ~10 lệnh tối đa 15 giây), in ra đúng con số đó.
cp="$LAB_CP"
s48="$SESSION_DIR/../s48/files"
. "$s48/nodes.sh"
echo "  (chờ etcd nếu VM vừa bật: tối đa ~6 phút)"
facts="$(vm "$cp" "$(cat "$SESSION_DIR/../s45/files/probe.sh")" 2>/dev/null)
$(s48_nodes "$s48")"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
facts="$facts
$(vm "$cp" "W2_FIELD_SET='$(fact W2_FIELD_SET)'
W1_CGROUP='$(fact W1_CGROUP)'
$(cat "$s48/facts.sh")" 2>/dev/null)"
both() { local r="" x; for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; ${x}: $(fact $x)"; done; [ -n "$r" ] && echo "${r#; }" || echo "đạt"; }
expect_eq "Đầu ra s48: config.toml, config.yaml của hai worker như bản tốt; containerd, kubelet active, enabled trên ba node" \
  "đạt" both NODES_FILES NODES_UNITS
expect_eq "Đầu ra s48: answers.env (W1_COMPONENT, W2_FIELD, NODE_DEBUG_CGROUP), mục s48 trong sổ tay" "đạt" both ANS RUNBOOK
expect_eq "etcd trên cka-cp phục vụ (endpoint health)" "ok" echo "$(fact ETCD)"
assert_summary
