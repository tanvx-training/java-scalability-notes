# Đề mock m1 — chấm (chạy bởi `./labs/lab mock cka m1 score`, và bởi s52/apply.sh, s52/verify.sh). Chỉ đọc. Nạp bởi `lab`
# trên Mac (bash 3.2), SESSION_DIR = labs/cka/mocks/m1. In ra stdout đúng 16 dòng `<câu> <domain> <got> <max>` theo bảng TABLE
# (trùng `questions` của webapp/js/data/practice/cka/mocks.js: id, domain, weight), không gì khác: lab cộng theo domain và in
# dòng devprep-mock:v1:…. Chi tiết từng câu (điểm, lý do thiếu) in ra stderr khi MOCK_WHY=1.
# Dữ kiện: files/node.sh STEP=facts trên cka-w1 (q12), rồi files/qlib.sh + files/facts.sh trên cka-cp (16 câu, lý do ở đầu
# tệp đó). Câu nào không có dữ kiện (VM không trả lời, apiserver hỏng, facts hết giờ) là 0 điểm — vẫn đủ 16 dòng. Mỗi lệnh
# trong VM có timeout; chậm nhất ~4 phút (apiserver chết: ~1 phút), thường 30–60 giây.
TABLE="q1:architecture:6 q2:workloads:5 q3:storage:5 q4:troubleshooting:8 q5:networking:7 q6:architecture:7 q7:workloads:5
q8:troubleshooting:7 q9:networking:7 q10:architecture:6 q11:storage:5 q12:troubleshooting:8 q13:workloads:5 q14:networking:6
q15:architecture:6 q16:troubleshooting:7"
. "$SESSION_DIR/files/scorelib.sh"
echo "  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)" >&2
w1="$(vm cka-w1 "STEP=facts
$(cat "$SESSION_DIR/files/node.sh")" 2>/dev/null | grep -E '^W1_[A-Z]+=' || true)"
env1=""
for k in W1_ACTIVE W1_CFG; do
  v="$(printf '%s\n' "$w1" | sed -n "s/^$k=//p" | head -n1 | tr -d "'\\\\")"
  env1="$env1$k='$v'
"
done
facts="$(vm "$LAB_CP" "$env1
export W1_ACTIVE W1_CFG
$(cat "$SESSION_DIR/files/qlib.sh")
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null || true)"
mock_lines "$TABLE" "$facts"
