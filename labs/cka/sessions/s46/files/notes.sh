# s46 — đọc tệp đáp án và sổ tay ~/notes/runbook.md, dùng chung cho facts của chặng 9 từ s50 (s47–s49 có bản chép riêng,
# viết trước tệp này; không sửa chúng ở đợt này). Chạy trên cka-cp, không gọi apiserver.
#
# HỢP ĐỒNG: bên gửi ghép tệp này TRƯỚC facts của buổi:
#   vm "$LAB_CP" "$(cat "$SESSION_DIR/../s46/files/notes.sh")
#   $(cat "$SESSION_DIR/files/facts.sh")"
# Tệp đặt biến môi trường LAB_NOTES_PY (mã python3); facts nạp bằng `exec(os.environ["LAB_NOTES_PY"])` rồi dùng:
#   read_env(path)          dict KHOÁ → giá trị của tệp KHOÁ=giá-trị (bỏ dòng trống, dòng `#`, dấu nháy bao quanh giá trị);
#                           None nếu không đọc được tệp.
#   runbook_bad(home, sid)  [] khi ~/notes/runbook.md có một heading chứa `sid` (không phân biệt hoa thường) với ≥ 3 dòng
#                           không rỗng tới heading cùng cấp hay cao hơn; còn lại một lý do ngắn trong danh sách (cùng luật
#                           như s47–s49).
read -r -d '' LAB_NOTES_PY <<'PY' || true
import re as _re
def read_env(path):
    out = {}
    try:
        for l in open(path, encoding="utf-8"):
            if "=" in l and not l.lstrip().startswith("#"):
                a, v = l.strip().split("=", 1); out[a.strip()] = v.strip().strip('"\'')
    except Exception:
        return None
    return out
def runbook_bad(home, sid):
    try: text = open(f"{home}/notes/runbook.md", encoding="utf-8").read()
    except Exception: return ["chưa có ~/notes/runbook.md"]
    best, cur = 0, None
    for l in text.splitlines():
        m = _re.match(r"^(#{1,6})\s+(.*)", l)
        if m:
            if cur and len(m.group(1)) <= cur[0]: best = max(best, cur[1]); cur = None
            if cur is None and _re.search(_re.escape(sid), m.group(2), _re.I): cur = [len(m.group(1)), 0]
        elif cur and l.strip(): cur[1] += 1
    if cur: best = max(best, cur[1])
    return [] if best >= 3 else [f"runbook.md chưa có mục {sid} ≥ 3 dòng"]
PY
export LAB_NOTES_PY
