# Mock — thư viện python dùng chung cho facts chấm điểm của hai đề mock (m1, m2). Chạy trên cka-cp, không gọi gì khi nạp.
#
# HỢP ĐỒNG: bên gửi ghép tệp này TRƯỚC facts của đề trong cùng một lệnh vm:
#   vm "$LAB_CP" "$(cat "$SESSION_DIR/files/qlib.sh")          (m1; m2: "$SESSION_DIR/../m1/files/qlib.sh")
#   $(cat "$SESSION_DIR/files/facts.sh")"
# Tệp đặt biến môi trường MOCK_QLIB_PY (mã python3); facts nạp bằng `exec(os.environ["MOCK_QLIB_PY"])` rồi dùng:
#   run(*args, timeout=20)         (mã, stdout, stderr); hết giờ hay lỗi chạy là mã 99, không ném lỗi.
#   kj(*args, timeout=15)          kubectl --request-timeout=8s <args> -o json → dict, None khi lỗi.
#   API                            True khi apiserver trả /readyz = ok (hỏi tối đa 2 × 5 giây lúc nạp). Câu cần apiserver
#                                  kiểm API trước: False thì 0 điểm cho phần đó, không gọi kubectl nữa (không treo).
#   ready(obj)                     condition Ready = True.
#   cond(obj, type)                dict condition theo type ({} nếu không có).
#   pods(ns, sel)                  Pod khớp selector, bỏ Pod đang xoá.
#   live_pod(ns, sel)              tên một Pod Running + Ready (không đang xoá) khớp selector, None nếu không có.
#   pexec(ns, pod, *cmd, t=10)     kubectl exec (mã, stdout); Pod trên node hỏng trả lỗi trong ≤ t giây.
#   wget(ns, pod, url, t=3)        stdout của `wget -qO- -T t url` chạy trong Pod (chuỗi rỗng khi lỗi).
#   curl(url, host=None, t=4)      curl từ cka-cp (chuỗi thân, rỗng khi lỗi hay mã ≠ 200).
#   rfile(path)                    nội dung tệp (đọc bằng sudo -n cat), None nếu không có.
#   mark(base, name)               rfile(f"{base}/{name}") đã strip, None nếu rỗng hay không có (mốc do setup ghi).
#   lines(text)                    các dòng không rỗng đã strip.
#   qty(s)                         số lượng Kubernetes ("100m", "128Mi", "1Gi", "2") → float đơn vị gốc (cpu lõi, byte).
#   Q                              dict id câu → [điểm, [lý do]]; add(q, pts, ok, why) cộng pts khi ok, không thì ghi why.
#   emit()                         in `GOT <q> <điểm>` rồi `WHY <q> <lý do; …>` (≤ 170 ký tự) cho mọi câu đã gọi add.
read -r -d '' MOCK_QLIB_PY <<'PY' || true
import json as _json, subprocess as _sp, time as _time
def run(*args, timeout=20):
    try:
        p = _sp.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a, timeout=15):
    rc, out, _ = run("kubectl", "--request-timeout=8s", *a, "-o", "json", timeout=timeout)
    try: return _json.loads(out) if rc == 0 else None
    except Exception: return None
def _readyz():
    for _ in range(2):
        rc, out, _ = run("kubectl", "--request-timeout=5s", "get", "--raw", "/readyz", timeout=8)
        if rc == 0 and out.strip() == "ok": return True
    return False
API = _readyz()
def cond(o, t):
    return next((c for c in ((o or {}).get("status") or {}).get("conditions") or [] if c.get("type") == t), {})
def ready(o): return cond(o, "Ready").get("status") == "True"
def pods(ns, sel):
    if not API: return []
    items = (kj("-n", ns, "get", "pod", "-l", sel) or {}).get("items") or []
    return [p for p in items if not p["metadata"].get("deletionTimestamp")]
def live_pod(ns, sel):
    for p in pods(ns, sel):
        if (p.get("status") or {}).get("phase") == "Running" and ready(p): return p["metadata"]["name"]
    return None
def pexec(ns, pod, *cmd, t=10):
    if not (API and pod): return 99, ""
    rc, out, _ = run("kubectl", f"--request-timeout={t}s", "-n", ns, "exec", pod, "--", *cmd, timeout=t + 3)
    return rc, out
def wget(ns, pod, url, t=3):
    rc, out = pexec(ns, pod, "wget", "-qO-", "-T", str(t), url, t=t + 5)
    return out if rc == 0 else ""
def curl(url, host=None, t=4):
    a = ["curl", "-s", "--noproxy", "*", "-m", str(t), "-w", "\n%{http_code}"]
    if host: a += ["-H", f"Host: {host}"]
    rc, out, _ = run(*a, url, timeout=t + 3)
    body, _, code = out.rpartition("\n")
    return body if code.strip() == "200" else ""
def rfile(path):
    rc, out, _ = run("sudo", "-n", "cat", path, timeout=10)
    return out if rc == 0 else None
def mark(base, name):
    v = rfile(f"{base}/{name}")
    return v.strip() if v and v.strip() else None
def lines(text): return [l.strip() for l in (text or "").splitlines() if l.strip()]
_U = {"m": 1e-3, "": 1, "k": 1e3, "M": 1e6, "G": 1e9, "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3}
def qty(s):
    s = str(s or "").strip()
    for u in ("Ki", "Mi", "Gi", "m", "k", "M", "G"):
        if s.endswith(u):
            try: return float(s[: -len(u)]) * _U[u]
            except Exception: return None
    try: return float(s)
    except Exception: return None
Q = {}
def add(q, pts, ok, why):
    e = Q.setdefault(q, [0, []])
    if ok: e[0] += pts
    elif why: e[1].append(why)
    return bool(ok)
def emit():
    for q, (g, w) in Q.items():
        print(f"GOT {q} {g}")
        print(f"WHY {q} " + ("; ".join(w)[:170] or "đủ điểm"))
PY
export MOCK_QLIB_PY
