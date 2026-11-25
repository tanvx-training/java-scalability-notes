# Đề mock m2 — chấm (chạy bởi `./labs/lab mock cka m2 score`, và bởi s53/apply.sh, s53/verify.sh). Chỉ đọc. Nạp bởi `lab`
# trên Mac (bash 3.2), SESSION_DIR = labs/cka/mocks/m2. In ra stdout đúng 16 dòng `<câu> <domain> <got> <max>` theo bảng TABLE
# (trùng `questions` của webapp/js/data/practice/cka/mocks.js: id, domain, weight — check-data PR11), không gì khác: lab cộng
# theo domain và in dòng devprep-mock:v1:…. Chi tiết từng câu (điểm, lý do thiếu) in ra stderr khi MOCK_WHY=1.
# Dữ kiện: mocks/m1/files/qlib.sh (thư viện chung của hai đề) + files/facts.sh trên cka-cp, một lần gọi VM. Chỉ nhìn đồ của m2
# (m2-*, /opt/m2): đồ m1 để lại không cho điểm. Câu nào không có dữ kiện (VM không trả lời, apiserver hỏng, facts hết giờ) là
# 0 điểm — vẫn đủ 16 dòng (mocks/m1/files/scorelib.sh). Mỗi lệnh trong VM có timeout và qlib có hạn chót chung
# (MOCK_DEADLINE, 180 giây: quá hạn thì lệnh còn lại trả lỗi ngay): chậm nhất ~4 phút, thường 30–60 giây.
TABLE="q1:troubleshooting:8 q2:architecture:6 q3:workloads:5 q4:storage:5 q5:networking:7 q6:architecture:7 q7:troubleshooting:8
q8:workloads:5 q9:networking:7 q10:architecture:6 q11:troubleshooting:7 q12:storage:5 q13:workloads:5 q14:networking:6
q15:architecture:6 q16:troubleshooting:7"
. "$SESSION_DIR/../m1/files/scorelib.sh"
echo "  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)" >&2
facts="$(vm "$LAB_CP" "$(cat "$SESSION_DIR/../m1/files/qlib.sh")
$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null || true)"
mock_lines "$TABLE" "$facts"
