# s46 — dữ kiện riêng của verify s46 trên cka-cp (user ubuntu, sudo; kubectl, python3), cộng s46/files/core-facts.sh (lõi
# khoẻ, drift so với helm get manifest). In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh có timeout.
#   RUNBOOK   ~/notes/runbook.md có ≥ 4 heading `## `, và bốn mục KHÁC NHAU phủ bốn tầng: heading chứa (không phân biệt hoa
#             thường) một từ của mỗi nhóm `app|ứng dụng|pod`, `service|dns`, `node|kubelet`, `control plane|apiserver`;
#             mỗi mục ≥ 3 dòng không rỗng (tới heading `#`/`##` kế tiếp; dòng của `###` bên trong tính cho mục).
#   NOTREADY  ~/drills/s46/not-ready.txt: mỗi dòng không rỗng đúng dạng `<ns>/<pod>`; có Pod hỏng của catalog và của order mà
#             sự cố st9-app ghi lại (/root/.lab/st9-app/broken: Pod mới của ReplicaSet hỏng; Pod khác cùng ReplicaSet hỏng
#             cũng được, vì xoá Pod hỏng thì ReplicaSet tạo Pod mới tên khác, hỏng y hệt); không có Pod nào đang Ready lúc
#             sự cố ghi (/root/.lab/st9-app/ready) mà đến lúc chấm vẫn còn và vẫn Ready (Pod lúc đó Ready rồi sau thôi Ready
#             hay đã bị thay, như Pod gateway bị liveness giết theo chu kỳ, Pod cũ của rollout, Pod Job đã xong, được tha).
#             Pod tạo sau lúc ghi (thay tên trong lúc sửa) được chấp nhận. Liệt kê cả namespace hay mọi Pod của shop là đỏ.
#   ANS       ~/drills/s46/answers.env: CATALOG_CAUSE là một dòng log (có `Exception` hay `config data`, như `java.lang.IllegalStateException: Unable to load config data from …`) chứa đúng
#             giá trị gây lỗi mà sự cố ghi (/root/.lab/st9-app/cause, đổi mỗi lần begin); ORDER_REASON ImagePullBackOff
#             hoặc ErrImagePull; GATEWAY_PROBE liveness (hay livenessProbe).
python3 - "$HOME" <<'PY'
import itertools, json, re, subprocess, sys
home = sys.argv[1]
LAB = "/root/.lab/st9-app"
def run(*args, timeout=20):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def lab(f):
    rc, out, _ = run("sudo", "cat", f"{LAB}/{f}")
    return out if rc == 0 else None

# 1. RUNBOOK
GROUPS = (("ứng dụng/Pod", r"\bapp\b|ứng dụng|\bpods?\b"), ("Service/DNS", r"\bservices?\b|\bdns\b"),
          ("node/kubelet", r"\bnodes?\b|\bkubelet\b"), ("control plane", r"control[ -]?plane|\bapiserver\b|kube-apiserver"))
bad = []
try: text = open(f"{home}/notes/runbook.md", encoding="utf-8").read()
except Exception: text = None
if text is None: bad.append("chưa có ~/notes/runbook.md")
else:
    secs, cur = [], None
    for l in text.splitlines():
        m = re.match(r"^(#{1,2})\s+(.*)", l)
        if m:
            cur = [m.group(2).strip(), 0] if m.group(1) == "##" else None
            if cur: secs.append(cur)
        elif cur is not None and l.strip():
            cur[1] += 1
    if len(secs) < 4: bad.append(f"runbook.md có {len(secs)} mục ## (cần ≥ 4)")
    ok = lambda s, g: re.search(g[1], s[0], re.I) and s[1] >= 3
    # Bốn nhóm phải ứng với bốn mục khác nhau, mỗi mục ≥ 3 dòng.
    if not any(all(ok(secs[i], g) for i, g in zip(p, GROUPS)) for p in itertools.permutations(range(len(secs)), 4)):
        miss = [g[0] for g in GROUPS if not any(ok(s, g) for s in secs)]
        bad.append("runbook.md thiếu mục ≥ 3 dòng cho: " + ", ".join(miss) if miss else "runbook.md: bốn tầng cần bốn mục ## khác nhau")
say("RUNBOOK", bad)

# 2. NOTREADY
bad = []
broken, ready = lab("broken"), lab("ready")
try: lines = [l.strip() for l in open(f"{home}/drills/s46/not-ready.txt", encoding="utf-8") if l.strip()]
except Exception: lines = None
if broken is None or ready is None: bad.append("chưa có mốc của sự cố (chạy begin)")
elif lines is None: bad.append("chưa có ~/drills/s46/not-ready.txt")
else:
    wrong = [l for l in lines if not re.fullmatch(r"[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9.-]*", l)]
    if wrong: bad.append(f"dòng sai dạng <ns>/<pod>: {wrong[0][:40]}")
    got = set(lines)
    for row in broken.split("\n"):
        if not row.strip(): continue
        pod, rs = row.split()
        if pod not in got and not any(g.startswith(f"shop/{rs}-") for g in got): bad.append(f"thiếu {pod}")
    rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "pod", "-A", "-o", "json", timeout=30)
    try: now = {f"{p['metadata']['namespace']}/{p['metadata']['name']}" for p in json.loads(out)["items"] if any(
        c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])}
    except Exception: now = None
    if now is None: bad.append("không đọc được Pod")
    extra = sorted(got & set(ready.split()) & (now or set()))
    if extra: bad.append(f"{extra[0]} đang Ready lúc sự cố" + (f" (+{len(extra) - 1})" if len(extra) > 1 else ""))
say("NOTREADY", bad)

# 3. ANS
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s46/answers.env", encoding="utf-8"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
cause = (lab("cause") or "").strip()
if ans is None: bad.append("chưa có ~/drills/s46/answers.env")
else:
    c = ans.get("CATALOG_CAUSE")
    if c is None: bad.append("thiếu CATALOG_CAUSE")
    elif not cause: bad.append("chưa có mốc của sự cố (chạy begin)")
    elif cause not in c or not re.search(r"Exception|config data", c):
        bad.append("CATALOG_CAUSE chưa là dòng log nêu nguyên nhân")
    r = ans.get("ORDER_REASON")
    if r not in ("ImagePullBackOff", "ErrImagePull"): bad.append(f"ORDER_REASON={r} chưa đúng")
    g = (ans.get("GATEWAY_PROBE") or "").strip().lower()
    if g not in ("liveness", "livenessprobe"): bad.append(f"GATEWAY_PROBE={ans.get('GATEWAY_PROBE')} chưa đúng")
say("ANS", bad)
PY
