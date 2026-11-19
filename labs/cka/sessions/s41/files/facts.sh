# s41 — dữ kiện của verify s41 (và check.sh của s41/s42): release shop, PDB, cách trải replica, node, log của vòng request
# ~/drills/s41/loop.log. In dạng KHOÁ=giá-trị. Chạy trên cka-cp bằng user ubuntu (helm, kubectl, python3/PyYAML). Chỉ đọc;
# mỗi lệnh có timeout.
python3 - "$HOME" <<'PY'
import json, subprocess, sys
import yaml
home = sys.argv[1]
SVCS = ("gateway", "catalog", "order")
WORKERS = ("cka-w1", "cka-w2")
JAVA_OPTS = "-XX:MaxRAMPercentage=50"
CHART = "shop-0.2.0"

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def js(rc, out):
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def kj(*a): return js(*run("kubectl", "--request-timeout=10s", *a, "-o", "json")[:2])
def hj(*a): return js(*run("helm", *a, "-o", "json")[:2])
def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))

# 1. SHOPBASE: release shop vẫn như cuối s40 ở những gì s41 không được đổi (deployed, javaOpts, order 2.0), cộng chart 0.2.0.
bad = []
rels = hj("list", "-n", "shop") or []
r = next((x for x in rels if x.get("name") == "shop"), None)
vals = hj("get", "values", "shop", "-n", "shop", "-a") if r else None
if r is None: bad.append("chưa có release shop ở namespace shop")
else:
    if r.get("status") != "deployed": bad.append(f"release shop đang {r.get('status')}")
    if vals is None: bad.append("không đọc được values của release shop")
    else:
        if vals.get("javaOpts") != JAVA_OPTS: bad.append(f"javaOpts là {vals.get('javaOpts')!r}, cần {JAVA_OPTS}")
        if str(((vals.get("order") or {}).get("image") or {}).get("tag")) != "2.0": bad.append("order.image.tag chưa là 2.0")
say("SHOPBASE", bad)
chart = (r or {}).get("chart")

# Manifest của release: PDB và pod template phải đến từ chart, không phải sửa tay bằng kubectl.
rc, out, _ = run("helm", "get", "manifest", "shop", "-n", "shop")
man = {}
if rc == 0:
    for d in yaml.safe_load_all(out):
        if isinstance(d, dict) and d.get("kind"): man[(d["kind"], (d.get("metadata") or {}).get("name"))] = d

# 2. PDB: gateway-pdb, catalog-pdb, order-pdb trong chart, minAvailable 1, đúng selector, có hiệu lực (ALLOWED DISRUPTIONS ≥ 1);
# không PDB nào khác trong shop chọn ba service đó (PDB thứ hai chặn drain y như minAvailable quá cao).
bad = []
pdbs = (kj("-n", "shop", "get", "pdb") or {}).get("items")
if pdbs is None: bad.append("không đọc được PDB của shop")
else:
    by = {p["metadata"]["name"]: p for p in pdbs}
    for n in SVCS:
        name = f"{n}-pdb"; p = by.get(name)
        if p is None: bad.append(f"chưa có PDB {name}"); continue
        sp, st = p.get("spec") or {}, p.get("status") or {}
        if "maxUnavailable" in sp: bad.append(f"{name} dùng maxUnavailable, cần minAvailable: 1")
        elif sp.get("minAvailable") != 1: bad.append(f"{name}: minAvailable {sp.get('minAvailable')!r}, cần 1")
        if sp.get("selector") != {"matchLabels": {"app": n}}: bad.append(f"{name}: selector {sp.get('selector')}, cần app={n}")
        if ("PodDisruptionBudget", name) not in man: bad.append(f"{name} không nằm trong release shop (tạo ngoài chart?)")
        if (st.get("currentHealthy") or 0) < 2 or (st.get("disruptionsAllowed") or 0) < 1:
            bad.append(f"{name}: healthy {st.get('currentHealthy', 0)}, cho phép {st.get('disruptionsAllowed', 0)} (cần ≥ 2 và ≥ 1)")
    for name, p in sorted(by.items()):
        if name in {f"{n}-pdb" for n in SVCS}: continue
        ml = ((p.get("spec") or {}).get("selector") or {}).get("matchLabels") or {}
        me = ((p.get("spec") or {}).get("selector") or {}).get("matchExpressions") or []
        hit = ml.get("app") in SVCS or any(e.get("key") == "app" and set(e.get("values") or []) & set(SVCS) for e in me) or not (ml or me)
        if hit: bad.append(f"PDB thừa {name} chọn Pod của gateway/catalog/order")
    if vals is not None:
        for n in SVCS:
            if (((vals.get(n) or {}).get("pdb") or {}).get("minAvailable")) != 1: bad.append(f"values {n}.pdb.minAvailable chưa là 1")
say("PDB", bad)

# 3. SPREAD: mỗi service ≥ 2 replica (catalog: HPA minReplicas ≥ 2), pod template trải theo kubernetes.io/hostname
# (topologySpreadConstraints maxSkew 1, hay podAntiAffinity) và đến từ chart; Pod Ready trên cả cka-w1 lẫn cka-w2; chart 0.2.0.
bad = []
if chart != CHART: bad.append(f"release shop là {chart}, cần {CHART} (tăng version trong Chart.yaml)")
def spreads(tmpl, n):
    ps = (tmpl or {}).get("spec") or {}
    for t in ps.get("topologySpreadConstraints") or []:
        if t.get("topologyKey") == "kubernetes.io/hostname" and t.get("maxSkew") == 1 and \
           ((t.get("labelSelector") or {}).get("matchLabels") or {}).get("app") == n: return True
    aa = (ps.get("affinity") or {}).get("podAntiAffinity") or {}
    terms = list(aa.get("requiredDuringSchedulingIgnoredDuringExecution") or []) + \
            [w.get("podAffinityTerm") or {} for w in aa.get("preferredDuringSchedulingIgnoredDuringExecution") or []]
    return any(t.get("topologyKey") == "kubernetes.io/hostname" and
               ((t.get("labelSelector") or {}).get("matchLabels") or {}).get("app") == n for t in terms)
hpa = kj("-n", "shop", "get", "hpa", "catalog")
for n in SVCS:
    d = kj("-n", "shop", "get", "deploy", n)
    if d is None: bad.append(f"chưa có Deployment {n}"); continue
    want = d["spec"].get("replicas", 1)
    if n == "catalog" and hpa is not None and (hpa["spec"].get("minReplicas") or 1) < 2: bad.append("HPA catalog minReplicas < 2")
    if want < 2: bad.append(f"{n}: {want} replica, cần ≥ 2")
    if not spreads(d["spec"]["template"], n): bad.append(f"{n}: pod template không trải theo kubernetes.io/hostname")
    md = man.get(("Deployment", n))
    if md is None or not spreads((md.get("spec") or {}).get("template"), n): bad.append(f"{n}: cách trải không nằm trong chart")
    pods = [p for p in (kj("-n", "shop", "get", "pod", "-l", f"app={n}") or {}).get("items", [])
            if not p["metadata"].get("deletionTimestamp") and ready(p)]
    nodes = sorted({p["spec"].get("nodeName") for p in pods})
    if len(pods) < 2: bad.append(f"{n}: {len(pods)} Pod Ready")
    elif not all(w in nodes for w in WORKERS): bad.append(f"{n}: Pod Ready chỉ ở {', '.join(nodes)} (cần cả cka-w1 và cka-w2)")
# Ưu tiên: lúc drain, Pod thay của gateway (PriorityClass shop-critical, s19) được preempt Pod ưu tiên thấp hơn trên worker còn
# lại (đo: đá postgres-0 và catalog của shop-dev). catalog, order và postgres phải có priority ≥ gateway; ~/shop/ giữ điều đó
# cho postgres.
pcs = {p["metadata"]["name"]: p.get("value", 0) for p in (kj("get", "priorityclass") or {}).get("items", [])}
def prio(kind, name):
    o = kj("-n", "shop", "get", kind, name)
    if o is None: return None, None
    pc = o["spec"]["template"]["spec"].get("priorityClassName")
    return pc, pcs.get(pc, 0) if pc else 0
gpc, gv = prio("deploy", "gateway")
for kind, name in (("deploy", "catalog"), ("deploy", "order"), ("sts", "postgres")):
    pc, v = prio(kind, name)
    if v is None: bad.append(f"chưa có {name}"); continue
    if gv is not None and v < gv: bad.append(f"{name}: priority {v} ({pc or 'không có PriorityClass'}) thấp hơn gateway {gv} ({gpc}): bị preempt lúc drain")
for n in ("catalog", "order"):
    md = man.get(("Deployment", n))
    if md is not None and not (((md.get("spec") or {}).get("template") or {}).get("spec") or {}).get("priorityClassName"):
        bad.append(f"{n}: priorityClassName không nằm trong chart")
pg = False
for p in sorted(__import__("glob").glob(f"{home}/shop/*.yaml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind") == "StatefulSet" and (d.get("metadata") or {}).get("name") == "postgres":
                pg = pg or bool(((d.get("spec") or {}).get("template") or {}).get("spec", {}).get("priorityClassName"))
    except Exception: pass
if not pg: bad.append("~/shop/: StatefulSet postgres chưa ghi priorityClassName")
say("SPREAD", bad)

# 4. NODE: ba node Ready, cka-w1 và cka-w2 schedulable (không unschedulable, không taint unschedulable).
bad = []
nodes = (kj("get", "node") or {}).get("items")
if nodes is None: bad.append("không đọc được node")
else:
    for nd in nodes:
        nm = nd["metadata"]["name"]
        if not any(c.get("type") == "Ready" and c.get("status") == "True" for c in nd["status"].get("conditions") or []):
            bad.append(f"{nm} chưa Ready")
        if nm in WORKERS and (nd["spec"].get("unschedulable") or
                              any(t.get("key") == "node.kubernetes.io/unschedulable" for t in nd["spec"].get("taints") or [])):
            bad.append(f"{nm} đang cordon (SchedulingDisabled)")
say("NODE", bad)

# 5. LOG: ~/drills/s41/loop.log do loop.sh ghi có một đoạn cka-w1 bị cordon, trong đoạn đó Pod gateway/catalog/order trên
# cka-w1 về 0 (drain xong), rồi cka-w1 được uncordon; request đều (không hở quá 5 giây) suốt đoạn đó, ≥ 20 request; cả log
# 0 lỗi (mã khác 200).
def parse(path):
    reqs, states = [], []
    for l in open(path):
        f = l.split()
        if not f: continue
        if f[0] == "#":
            if len(f) >= 4 and f[3] == "nodes":
                st = {"t": float(f[1]), "nodes": {}, "pods": {}}
                mode = None
                for x in f[4:]:
                    if x == "pods": mode = "pods"; continue
                    if "=" not in x: continue
                    a, b = x.split("=", 1)
                    if mode == "pods": st["pods"][a] = int(b) if b.isdigit() else -1
                    else:
                        v, _, s = b.partition("/"); st["nodes"][a] = (v, s)
                states.append(st)
            continue
        if len(f) >= 3:
            try: reqs.append((float(f[0]), f[2]))
            except ValueError: pass
    return reqs, states
def windows(states, node):
    """Các đoạn [cordon, uncordon] của node; mỗi đoạn kèm số Pod trên node lúc đầu và nhỏ nhất trong đoạn."""
    res, cur = [], None
    for st in states:
        s = (st["nodes"].get(node) or ("", ""))[1]
        p = st["pods"].get(node, -1)
        if s == "cordon" and cur is None: cur = {"a": st["t"], "first": p, "min": p}
        elif s == "cordon": cur["min"] = min(cur["min"], p) if p >= 0 else cur["min"]
        elif s == "sched" and cur is not None:
            cur["b"] = st["t"]; res.append(cur); cur = None
    return res
def gap_ok(reqs, a, b, maxgap=5.0):
    ts = [t for t, _ in reqs if a - maxgap <= t <= b + maxgap]
    inside = [t for t in ts if a <= t <= b]
    if len(inside) < 20: return False, f"chỉ {len(inside)} request trong đoạn drain"
    pts = [a] + inside + [b]
    g = max(y - x for x, y in zip(pts, pts[1:]))
    return (g <= maxgap), f"vòng request hở {g:.0f} giây trong đoạn drain (loop.sh đã dừng?)"
bad = []
path = f"{home}/drills/s41/loop.log"
try: reqs, states = parse(path)
except Exception: reqs = states = None
if reqs is None: bad.append("chưa có ~/drills/s41/loop.log (loop.sh start)")
elif not reqs: bad.append("loop.log chưa có request nào")
else:
    errs = [(t, c) for t, c in reqs if c != "200"]
    if errs: bad.append(f"{len(errs)}/{len(reqs)} request lỗi (mã {', '.join(sorted({c for _, c in errs}))})")
    ws = windows(states, "cka-w1")
    good = [w for w in ws if w["first"] > 0 and w["min"] == 0]
    if not ws: bad.append("log không có đoạn cka-w1 bị cordon rồi uncordon")
    elif not good: bad.append("trong đoạn cordon, Pod gateway/catalog/order trên cka-w1 chưa về 0 (chưa drain xong)")
    else:
        msgs = [gap_ok(reqs, w["a"], w["b"]) for w in good]
        if not any(ok for ok, _ in msgs): bad.append(msgs[-1][1])
say("LOG", bad)
PY
