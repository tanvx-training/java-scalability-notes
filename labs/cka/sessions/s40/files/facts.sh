# s40 — dữ kiện riêng của verify s40 (cộng với s37/files/facts.sh): release shop và demo đã ra khỏi trạng thái hỏng của sự cố
# và values (-a) bằng revision tốt trước sự cố (tìm theo history: revision deployed/superseded mới nhất trước revision hỏng mới nhất,
# không ghi cứng số); không Pod/ReplicaSet nào của shop còn chạy JAVA_OPTS xấu; demo không còn image 6.99.0; release
# demo-canary đã gỡ; repo podinfo đọc được; ~/drills/s40/answers.env. In dạng KHOÁ=giá-trị. Chạy trên cka-cp bằng user ubuntu
# (helm, kubectl, python3). Chỉ đọc; mỗi lệnh có timeout.
python3 - "$HOME" <<'PY'
import json, subprocess, sys
home = sys.argv[1]
APPS = ("gateway", "gateway-v1", "catalog", "order")

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def js(rc, out):
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def k(*a): return run("kubectl", "--request-timeout=10s", *a)
def kj(*a): return js(*k(*a, "-o", "json")[:2])
def hj(*a): return js(*run("helm", *a, "-o", "json")[:2])

# check_release: release ra khỏi trạng thái hỏng `broken` (failed / pending-upgrade) của sự cố: hiện deployed, revision hiện
# tại sau revision hỏng mới nhất, values -a bằng revision tốt = revision deployed/superseded mới nhất trước revision hỏng đó
# (đo: upgrade lỗi hay kẹt giữ revision trước ở deployed; nó thành superseded khi có revision deployed mới).
def check_release(rel, ns, broken, label):
    bad = []
    hist = hj("history", rel, "-n", ns, "--max", "100")
    if not hist: return [f"không đọc được history của {rel}"], None
    hist = sorted(hist, key=lambda h: h["revision"])
    cur = hist[-1]
    brk = [h for h in hist if h["status"] == broken]
    # Gỡ bằng cách xoá Secret của revision hỏng rồi upgrade lại cũng là một cách sửa: khi đó không còn revision hỏng trong
    # history, revision tốt là revision deployed/superseded mới nhất trước revision hiện tại.
    b = brk[-1]["revision"] if brk else cur["revision"]
    good = [h for h in hist if h["status"] in ("deployed", "superseded") and h["revision"] < b]
    if cur["status"] != "deployed": bad.append(f"release {rel} đang {cur['status']} (revision {cur['revision']})")
    elif cur["revision"] < b: bad.append(f"release {rel}: revision {broken} {b} vẫn là mới nhất")
    if not good: bad.append(f"{rel}: không thấy revision tốt trước {b}"); return bad, None
    g = good[-1]["revision"]
    vg = hj("get", "values", rel, "-n", ns, "-a", "--revision", str(g))
    vc = hj("get", "values", rel, "-n", ns, "-a")
    if vg is None or vc is None: bad.append(f"không đọc được values của {rel}")
    elif vg != vc:
        diff = sorted(x for x in set(vg) | set(vc) if vg.get(x) != vc.get(x))
        bad.append(f"values của {rel} khác revision tốt {g} {label}: " + ", ".join(diff)[:60])
    return bad, vg

def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def env_of(tmpl, name):
    c = tmpl["spec"]["containers"][0]
    return next((e.get("value") for e in c.get("env") or [] if e.get("name") == name), None)

# 1. shop: deployed sau revision failed của sự cố, values bằng revision tốt.
bad, vg = check_release("shop", "shop", "failed", "(trước sự cố)")
print("SHOPREL=" + ("; ".join(bad)[:170] or "đạt"))

# 2. Không Pod nào (đang chạy hay đang khởi động lại) và không ReplicaSet nào còn replicas > 0 của bốn workload dùng JAVA_OPTS
# khác javaOpts tốt; mọi Pod của chúng Ready.
bad = []
good_opts = (vg or {}).get("javaOpts")
if good_opts is None: bad.append("không biết javaOpts của revision tốt")
pods = [p for p in (kj("-n", "shop", "get", "pod", "-l", "app in (gateway,gateway-v1,catalog,order)") or {}).get("items", [])
        if not p["metadata"].get("deletionTimestamp") and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
if not pods: bad.append("không có Pod nào của gateway/catalog/order")
if good_opts is not None:
    off = sorted(p["metadata"]["name"] for p in pods if env_of(p, "JAVA_OPTS") != good_opts)
    if off: bad.append(f"Pod dùng JAVA_OPTS khác {good_opts}: " + ", ".join(off)[:70])
    rss = [r for r in (kj("-n", "shop", "get", "rs", "-l", "app in (gateway,gateway-v1,catalog,order)") or {}).get("items", [])
           if (r["spec"].get("replicas") or 0) > 0 and env_of(r["spec"]["template"], "JAVA_OPTS") != good_opts]
    if rss: bad.append("ReplicaSet còn chạy JAVA_OPTS xấu: " + ", ".join(r["metadata"]["name"] for r in rss)[:60])
nr = sorted(p["metadata"]["name"] for p in pods if not ready(p))
if nr: bad.append("Pod chưa Ready: " + ", ".join(nr)[:60])
print("SHOPPODS=" + ("; ".join(bad)[:170] or "đạt"))

# 3. demo: deployed sau revision pending-upgrade của sự cố, values bằng revision tốt; Deployment và Pod không còn image 6.99.0.
bad, dv = check_release("demo", "demo", "pending-upgrade", "(trước sự cố)")
d = kj("-n", "demo", "get", "deploy", "demo-podinfo")
if d is None: bad.append("chưa có Deployment demo-podinfo")
else:
    img = d["spec"]["template"]["spec"]["containers"][0].get("image", "")
    if img.endswith(":6.99.0"): bad.append(f"Deployment demo-podinfo vẫn mang {img}")
    pods = [p for p in (kj("-n", "demo", "get", "pod", "-l", "app.kubernetes.io/name=demo-podinfo") or {}).get("items", [])
            if not p["metadata"].get("deletionTimestamp")]
    if any(p["spec"]["containers"][0].get("image", "").endswith(":6.99.0") for p in pods): bad.append("còn Pod demo chạy image 6.99.0")
    if not pods or not all(ready(p) for p in pods): bad.append("Pod demo chưa Ready")
print("DEMOREL=" + ("; ".join(bad)[:170] or "đạt"))

# 4. demo-canary (pending-install) đã gỡ hẳn: không còn release, Secret release, Deployment; repo podinfo đọc được
# (index trong cache: `helm search repo` thấy podinfo 6.16.0).
bad = []
rels = hj("list", "-A") or []
left = [f"{r['name']}/{r['namespace']} ({r['status']})" for r in rels if r.get("name") == "demo-canary"]
if left: bad.append("còn release " + ", ".join(left))
rc, out, _ = k("-n", "demo", "get", "deploy,secret", "-o", "name")
if rc != 0: bad.append("không đọc được namespace demo")
else:
    junk = [l for l in out.split() if "demo-canary" in l]
    if junk and not left: bad.append("còn object của demo-canary: " + ", ".join(junk)[:60])
rc, out, err = run("helm", "search", "repo", "podinfo/podinfo", "--version", "6.16.0", "-o", "json")
res = js(rc, out)
if not res: bad.append("helm search repo podinfo/podinfo --version 6.16.0 không thấy gì (cache của repo?)")
print("CANARY=" + ("; ".join(bad)[:170] or "đạt"))

# 5. answers.env: BAD_VALUE là khoá values gây lỗi của release shop.
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s40/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: bad.append("chưa có ~/drills/s40/answers.env")
if not bad:
    v = ans.get("BAD_VALUE")
    if v is None: bad.append("answers.env chưa có BAD_VALUE")
    elif v != "javaOpts": bad.append(f"BAD_VALUE={v} chưa đúng (khoá values, viết như trong values.yaml)")
print("ANS=" + ("; ".join(bad)[:170] or "đạt"))
PY
