# s51 — dữ kiện riêng của verify s51 trên cka-cp (user ubuntu, sudo; kubectl, curl, python3), cộng s46/files/core-facts.sh và
# dòng STATE của s43/files/facts.sh. Bên gửi ghép s46/files/notes.sh lên trước (LAB_NOTES_PY). Chấm theo sự thật lúc sự cố mà
# st9-multi ghi ở /root/.lab/st9-multi/ (top, reason, shipper.log, app.log, indexer.json, default-deny.json, started), không
# theo chuỗi đoán được. In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh có timeout.
#   Q1  /opt/answers/ chủ ubuntu; top-cpu.txt đúng một dòng `<namespace>/<Pod>` bằng Pod ngốn CPU nhất lúc sự cố (vẫn đúng khi
#       Pod đó đã bị xoá: dọn Pod ngốn CPU là việc nên làm).
#   Q2  node-metrics.json là JSON thô NodeMetrics (apiVersion metrics.k8s.io/v1beta1) của cka-w1, có usage.cpu và usage.memory,
#       timestamp không trước lúc begin quá 5 phút (lấy sau khi sự cố bắt đầu, không chép từ đâu).
#   Q3  events.txt là reason của Event Warning mới nhất của Pod indexer lúc sự cố (không phân biệt hoa thường, bỏ khoảng trắng).
#   Q4  sidecar.log có đúng các dòng log của container shipper (không thêm tiền tố thời gian, không lẫn dòng của container app).
#   Q5  (a) curl từ cka-cp tới ClusterIP:port của Service report-svc, /cgi-bin/products trả 200 với 3 sản phẩm (report gọi được
#       gateway.shop → catalog), tối đa 2 lần × 30 giây; NetworkPolicy default-deny của s51-batch còn, spec như lúc sự cố.
#   Q6  (b) cka-w1, cka-w2 không còn taint nào ngoài node.kubernetes.io/*; Deployment indexer còn (xoá rồi tạo lại đúng spec
#       cũng được), container như lúc sự cố, nodeSelector disktype=ssd, đủ replica sẵn sàng, Pod Ready trên node mang nhãn
#       disktype=ssd.
#   RUNBOOK  ~/notes/runbook.md có heading chứa `s51` với ≥ 3 dòng không rỗng.
python3 - "$HOME" <<'PY'
import calendar, json, os, re, subprocess, sys, time
exec(os.environ.get("LAB_NOTES_PY", "raise SystemExit('thiếu s46/files/notes.sh')"))
home = sys.argv[1]
LAB = "/root/.lab/st9-multi"
ANSD = "/opt/answers"
NS = "s51-batch"
def run(*args, timeout=20):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a):
    rc, out, _ = run("kubectl", "--request-timeout=10s", *a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def mark(f):
    rc, out, _ = run("sudo", "-n", "cat", f"{LAB}/{f}")
    return out if rc == 0 and out.strip() else None
def answer(f):
    try: return open(f"{ANSD}/{f}", encoding="utf-8", errors="replace").read()
    except Exception: return None
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])
NOMARK = "chưa có mốc của sự cố (chạy begin)"
def short(s): return s.strip().replace("\n", " ")[:40]

# Q1
bad = []
try:
    st = os.stat(ANSD)
    if st.st_uid != os.getuid(): bad.append("/opt/answers không thuộc ubuntu")
except Exception: bad.append("chưa có /opt/answers")
top, got = mark("top"), answer("top-cpu.txt")
lines = [l.strip() for l in (got or "").splitlines() if l.strip()]
if top is None: bad.append(NOMARK)
elif got is None: bad.append("chưa có /opt/answers/top-cpu.txt")
elif lines != [top.strip()]:
    bad.append(f"top-cpu.txt='{short(got)}' chưa đúng (cần đúng một dòng <namespace>/<Pod> ngốn CPU nhất)")
say("Q1", bad)

# Q2
bad = []
got, started = answer("node-metrics.json"), mark("started")
try: m = json.loads(got) if got is not None else None
except Exception: m = "x"
if got is None: bad.append("chưa có /opt/answers/node-metrics.json")
elif not isinstance(m, dict): bad.append("node-metrics.json không phải một đối tượng JSON")
else:
    if m.get("kind") != "NodeMetrics" or m.get("apiVersion") != "metrics.k8s.io/v1beta1": bad.append(f"kind/apiVersion {m.get('kind')} {m.get('apiVersion')}"[:60])
    if (m.get("metadata") or {}).get("name") != "cka-w1": bad.append(f"metadata.name {(m.get('metadata') or {}).get('name')}")
    u = m.get("usage") or {}
    if not (u.get("cpu") and u.get("memory")): bad.append("thiếu usage.cpu/usage.memory")
    try: ts = calendar.timegm(time.strptime(m.get("timestamp", ""), "%Y-%m-%dT%H:%M:%SZ"))
    except Exception: ts = None
    if ts is None: bad.append("thiếu timestamp")
    elif started is None: bad.append(NOMARK)
    elif ts < int(started.strip()) - 300: bad.append("timestamp trước lúc begin: lấy lại sau khi sự cố bắt đầu")
say("Q2", bad)

# Q3
bad = []
want, got = mark("reason"), answer("events.txt")
if want is None: bad.append(NOMARK)
elif got is None: bad.append("chưa có /opt/answers/events.txt")
elif got.strip().lower() != want.strip().lower(): bad.append(f"events.txt='{short(got)}' chưa đúng")
say("Q3", bad)

# Q4
bad = []
ship, app, got = mark("shipper.log"), mark("app.log"), answer("sidecar.log")
if ship is None or app is None: bad.append(NOMARK)
elif got is None: bad.append("chưa có /opt/answers/sidecar.log")
else:
    want = [l.rstrip() for l in ship.splitlines() if l.strip()]
    have = [l.rstrip() for l in got.splitlines() if l.strip()]
    applines = {l.rstrip() for l in app.splitlines() if l.strip()}
    if any(l in applines for l in have): bad.append("sidecar.log có dòng của container app (chọn container bằng -c)")
    elif have != want:
        miss = sum(1 for l in want if l not in have)
        bad.append(f"sidecar.log chưa đúng các dòng của container phụ ({len(have)} dòng, thiếu {miss})")
say("Q4", bad)

# Q5
bad = []
want = mark("default-deny.json")
dd = kj("-n", NS, "get", "netpol", "default-deny")
if want is None: bad.append(NOMARK)
elif dd is None: bad.append("thiếu NetworkPolicy default-deny trong s51-batch")
elif dd.get("spec") != json.loads(want): bad.append("default-deny đã bị sửa")
svc = kj("-n", NS, "get", "svc", "report-svc")
if svc is None: bad.append("thiếu Service report-svc")
else:
    ip, port = svc["spec"].get("clusterIP"), ((svc["spec"].get("ports") or [{}])[0]).get("port")
    code, body = "000", ""
    for _ in range(2):
        rc, out, _ = run("curl", "-s", "--noproxy", "*", "-m", "30", "-w", "\n%{http_code}", f"http://{ip}:{port}/cgi-bin/products", timeout=35)
        body, _, code = out.rpartition("\n")
        if code == "200" and len(set(re.findall(r'"id":\d+', body))) == 3: break
        time.sleep(2)
    if not (code == "200" and len(set(re.findall(r'"id":\d+', body))) == 3):
        bad.append(f"report-svc /cgi-bin/products trả {code or '000'}" + (f": {short(body)}" if body.strip() else ""))
say("Q5", bad)

# Q6
bad = []
nodes = (kj("get", "node") or {}).get("items")
if nodes is None: bad.append("không đọc được node")
else:
    for n in nodes:
        name = n["metadata"]["name"]
        if name == "cka-cp": continue
        odd = [f"{t.get('key')}={t.get('value', '')}:{t.get('effect')}" for t in n["spec"].get("taints") or []
               if not t.get("key", "").startswith("node.kubernetes.io/")]
        if odd: bad.append(f"{name} còn taint " + ",".join(odd))
    ssd = {n["metadata"]["name"] for n in nodes if (n["metadata"].get("labels") or {}).get("disktype") == "ssd"}
    want = mark("indexer.json")
    d = kj("-n", NS, "get", "deploy", "indexer")
    if want is None: bad.append(NOMARK)
    elif d is None: bad.append("thiếu Deployment indexer (sửa, đừng xoá)")
    else:
        sp = d["spec"]["template"]["spec"]
        keys = ("name", "image", "command", "args")
        if [{k: c.get(k) for k in keys} for c in sp.get("containers") or []] != [{k: c.get(k) for k in keys} for c in json.loads(want)]:
            bad.append("container của indexer khác lúc sự cố")
        if (sp.get("nodeSelector") or {}).get("disktype") != "ssd": bad.append(f"nodeSelector của indexer {sp.get('nodeSelector')}"[:60])
        stt = d.get("status") or {}
        if stt.get("availableReplicas", 0) < 1 or stt.get("availableReplicas", 0) != d["spec"].get("replicas", 1):
            bad.append(f"indexer {stt.get('availableReplicas', 0)}/{d['spec'].get('replicas', 1)} sẵn sàng")
        pods = [p for p in (kj("-n", NS, "get", "pod", "-l", "app=indexer") or {}).get("items", []) if not p["metadata"].get("deletionTimestamp")]
        rp = [p for p in pods if ready(p)]
        if not rp: bad.append("không Pod indexer nào Ready")
        elif any(p["spec"].get("nodeName") not in ssd for p in rp): bad.append("Pod indexer chạy trên node không có disktype=ssd")
say("Q6", bad)

say("RUNBOOK", runbook_bad(home, "s51"))
PY
