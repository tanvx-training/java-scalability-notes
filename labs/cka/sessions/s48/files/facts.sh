# s48 — dữ kiện riêng của verify s48 trên cka-cp (user ubuntu; python3). Chỉ đọc tệp trong thư mục chủ, không gọi apiserver
# (check.sh của s49 dùng lại khi control plane đang hỏng). Bên gửi đặt hai dòng đầu W2_FIELD_SET=…, W1_CGROUP=… (từ
# files/nodes.sh: trường sự cố st9-node đã sửa trên cka-w2, cgroupDriver thật của cka-w1). In dạng KHOÁ=giá-trị:
#   ANS      ~/drills/s48/answers.env: W1_COMPONENT là containerd (thành phần hỏng trên cka-w1: kubelet chỉ là người báo tin);
#            W2_FIELD là đúng trường config.yaml của cka-w2 lần begin này (chấp nhận đường dẫn đầy đủ kiểu
#            authentication.x509.clientCAFile, không phân biệt hoa thường); NODE_DEBUG_CGROUP bằng cgroupDriver thật của cka-w1.
#   RUNBOOK  ~/notes/runbook.md có heading chứa `s48` với ≥ 3 dòng không rỗng (tới heading cùng cấp hay cao hơn).
python3 - "$HOME" "${W2_FIELD_SET:-}" "${W1_CGROUP:-}" <<'PY'
import re, sys
home, field, cgroup = sys.argv[1], sys.argv[2].strip(), sys.argv[3].strip()
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))

# 1. ANS
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s48/answers.env", encoding="utf-8"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
if ans is None: bad.append("chưa có ~/drills/s48/answers.env")
else:
    c = (ans.get("W1_COMPONENT") or "").strip().lower()
    if c not in ("containerd", "containerd.service"): bad.append(f"W1_COMPONENT={ans.get('W1_COMPONENT')} chưa đúng")
    f = (ans.get("W2_FIELD") or "").strip().rstrip(":").split(".")[-1].lower()
    if not field: bad.append("chưa có mốc của sự cố trên cka-w2 (chạy begin)")
    elif f != field.lower(): bad.append(f"W2_FIELD={ans.get('W2_FIELD')} chưa đúng")
    g = (ans.get("NODE_DEBUG_CGROUP") or "").strip().lower()
    if not cgroup: bad.append("không đọc được cgroupDriver của cka-w1")
    elif g != cgroup.lower(): bad.append(f"NODE_DEBUG_CGROUP={ans.get('NODE_DEBUG_CGROUP')} chưa đúng")
say("ANS", bad)

# 2. RUNBOOK
bad = []
try: text = open(f"{home}/notes/runbook.md", encoding="utf-8").read()
except Exception: text = None
if text is None: bad.append("chưa có ~/notes/runbook.md")
else:
    best, cur = 0, None
    for l in text.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*)", l)
        if m:
            if cur and len(m.group(1)) <= cur[0]: best = max(best, cur[1]); cur = None
            if cur is None and re.search(r"s48", m.group(2), re.I): cur = [len(m.group(1)), 0]
        elif cur and l.strip(): cur[1] += 1
    if cur: best = max(best, cur[1])
    if best < 3: bad.append("runbook.md chưa có mục s48 ≥ 3 dòng")
say("RUNBOOK", bad)
PY
