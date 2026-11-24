# s51 — kiểm (7 dòng): sáu câu kiểu đề (Q1–Q4 là tệp trong /opt/answers/, Q5–Q6 là hai sự cố đã sửa: files/facts.sh, chấm theo
# sự thật lúc sự cố mà st9-multi ghi ở /root/.lab/st9-multi/) và mục s51 trong sổ tay. Dòng Q6 (sự cố tầng node) gộp lõi khoẻ
# (s46/files/core-facts.sh; trên đầu vào lõi vẫn khoẻ nên một dòng riêng sẽ không đỏ) cộng dữ liệu như cuối s45 (dòng STATE của
# s43/files/facts.sh: before-snapshot có, after-snapshot không, order chạy, release shop
# deployed, ba node Ready). Chấm trạng thái: (a) sửa targetPort bằng số hay tên cổng, mở DNS bằng policy mới hay thêm vào policy
# report đều được, miễn default-deny còn nguyên; (b) sửa nodeSelector và gỡ taint. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Chờ như s26 (s46/files/bootwait.sh + s26/files/wait.sh: 420 giây khi VM vừa bật, còn lại /readyz tối đa 60 giây), cộng
# core-facts (~25 lệnh, mỗi lệnh tối đa 10–30 giây), facts s43 (~15 lệnh, mỗi lệnh tối đa 10–120 giây) và facts s51 (~10 lệnh
# tối đa 20 giây, hai lần curl tối đa 30 giây): chậm nhất ~16 phút, in ra đúng con số đó.
cp="$LAB_CP"
s46="$SESSION_DIR/../s46/files"
echo "  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)"
vm "$cp" "$(cat "$s46/bootwait.sh")
$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s46/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/../s43/files/facts.sh")" 2>/dev/null | grep '^STATE=')
$(vm "$cp" "$(cat "$s46/notes.sh")
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/../s50/files/rows.sh"
expect_eq "Q1 /opt/answers/top-cpu.txt: <namespace>/<Pod> ngốn CPU nhất toàn cluster; /opt/answers chủ ubuntu" "đạt" rows Q1
expect_eq "Q2 /opt/answers/node-metrics.json: NodeMetrics thô của cka-w1 (Metrics API), lấy sau khi begin" "đạt" rows Q2
expect_eq "Q3 /opt/answers/events.txt: reason của Event cảnh báo mới nhất của indexer" "đạt" rows Q3
expect_eq "Q4 /opt/answers/sidecar.log: đúng các dòng log của container phụ" "đạt" rows Q4
expect_eq "Q5 report-svc → report → gateway.shop trả 200 (3 sản phẩm); default-deny của s51-batch còn nguyên" "đạt" rows Q5
expect_eq "Q6 worker không còn taint lạ, indexer chạy trên node disktype=ssd; lõi khoẻ (ba node, control plane, shop), dữ liệu như s45" \
  "đạt" rows Q6 CORE_NODES CORE_CP CORE_SHOP STATE
expect_eq "~/notes/runbook.md có mục s51 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng" "đạt" rows RUNBOOK
assert_summary
