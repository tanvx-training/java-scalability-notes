# s21 — đọc trạng thái sau buổi sự cố, in dạng KHOÁ=giá-trị. So với cuối s20: order không có nodeSelector/affinity;
# tài nguyên gateway như cuối s17; shop-quota như cuối s18 (s20 không đổi); ba Deployment Available, không Pod Pending,
# không ReplicaSet FailedCreate; hai worker schedulable, không taint thừa; Pod nền batch-7f và Pod thử mem-probe ở default
# đã xoá; ~/shop/{order,gateway,quota}.yaml khớp cluster; ~/drills/s21/answers.env.
# Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc. Lệnh lỗi → tệp ghi ERR, dòng đó không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get rs -o json > "$tmp/rs.json" 2>/dev/null || echo ERR > "$tmp/rs.json"
k -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k -n shop get hpa catalog -o json > "$tmp/hpa.json" 2>/dev/null || echo ERR > "$tmp/hpa.json"
k -n shop get resourcequota shop-quota -o json > "$tmp/quota.json" 2>/dev/null || echo ERR > "$tmp/quota.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
k -n default get pod batch-7f mem-probe --ignore-not-found -o name > "$tmp/default.txt" 2>/dev/null || echo ERR > "$tmp/default.txt"
for f in order gateway quota; do
  k apply --dry-run=server -f "$HOME/shop/$f.yaml" -o json > "$tmp/file-$f.json" 2>"$tmp/file-$f.err" || : > "$tmp/file-$f.json"
done
cp "$HOME/drills/s21/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
def num(q, kind):
    m = re.fullmatch(r"([0-9.]+)(m|[KMGT]i?|k|)", str(q if q is not None else ""))
    if not m: return None
    n, u = float(m.group(1)), m.group(2)
    if kind == "cpu": return n if u == "m" else n * 1000
    if kind == "count": return n
    f = {"": 1, "m": 1e-3, "k": 1e3, "K": 1e3, "M": 1e6, "G": 1e9, "T": 1e12,
         "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4}[u]
    return n * f / 1024**2
deps_j, rs_j, pods_j, hpa, q, nodes_j = (load(f"{t}/{x}.json") for x in ("deploy", "rs", "pods", "hpa", "quota", "nodes"))
deps = {d["metadata"]["name"]: d for d in (deps_j or {}).get("items", [])}
def file_of(name, kind):
    f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        return None, f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'không có tệp'}"
    if f.get("kind") != kind: return None, f"~/shop/{name}.yaml phải là đúng một {kind}"
    return f, None
def avail(name, lo, hi):
    d = deps.get(name)
    if not d: return f"{name}: không có Deployment"
    st = d.get("status", {}); r = d["spec"].get("replicas") or 0
    got = f"{r}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)}"
    if not lo <= r <= hi or got != f"{r}/{r}/{r}": return f"{name}: replica/cập nhật/Available {got}"
    prog = [x.get("reason") for x in st.get("conditions", []) if x.get("type") == "Progressing"]
    if prog != ["NewReplicaSetAvailable"]: return f"{name}: rollout chưa xong ({prog[0] if prog else '?'})"
    return None

# 1. order: không nodeSelector, không nodeAffinity; Available 1/1/1; tệp khớp.
bad = []
if deps_j is None: bad.append("không đọc được Deployment")
else:
    d = deps.get("order")
    if d:
        spec = d["spec"]["template"]["spec"]
        if spec.get("nodeSelector"): bad.append(f"còn nodeSelector {spec['nodeSelector']}")
        if (spec.get("affinity") or {}).get("nodeAffinity"): bad.append("có nodeAffinity (cuối s20 order không có)")
    p = avail("order", 1, 1)
    if p: bad.append(p)
    f, e = file_of("order", "Deployment")
    if e: bad.append(e)
    elif d:
        pick = lambda s: json.dumps([s.get("nodeSelector") or {}, (s.get("affinity") or {}).get("nodeAffinity")], sort_keys=True)
        if pick(f["spec"]["template"]["spec"]) != pick(d["spec"]["template"]["spec"]): bad.append("~/shop/order.yaml khác Deployment: chưa apply từ tệp?")
print("ORDER=" + ("; ".join(bad) or "đạt"))

# 2. gateway: tài nguyên như cuối s17 (gateway 100m/256Mi/384Mi, init wait-catalog 10m/16Mi/32Mi); 2/2/2; tệp khớp.
WANT = {"gateway": ("100m", "256Mi", "384Mi"), "wait-catalog": ("10m", "16Mi", "32Mi")}
def res_sig(spec):
    out = {}
    for c in (spec.get("initContainers") or []) + (spec.get("containers") or []):
        r = c.get("resources") or {}
        out[c.get("name")] = (num((r.get("requests") or {}).get("cpu"), "cpu"), num((r.get("requests") or {}).get("memory"), "memory"),
                              num((r.get("limits") or {}).get("memory"), "memory"), (r.get("limits") or {}).get("cpu"))
    return out
bad = []
if deps_j is None: bad.append("không đọc được Deployment")
else:
    d = deps.get("gateway")
    if d:
        have = res_sig(d["spec"]["template"]["spec"])
        for name, (cpu, mem, lim) in WANT.items():
            want = (num(cpu, "cpu"), num(mem, "memory"), num(lim, "memory"), None)
            if have.get(name) != want:
                h = have.get(name)
                bad.append(f"{name}: requests cpu/memory, limits memory = " + (f"{h[0]:.0f}m/{h[1]:.0f}Mi/{h[2]:.0f}Mi" if h and None not in h[:3] else str(h))
                           + f" (cuối s17: {cpu}/{mem}/{lim})")
    p = avail("gateway", 2, 2)
    if p: bad.append(p)
    f, e = file_of("gateway", "Deployment")
    if e: bad.append(e)
    elif d and res_sig(f["spec"]["template"]["spec"]) != res_sig(d["spec"]["template"]["spec"]):
        bad.append("~/shop/gateway.yaml khác Deployment: chưa apply từ tệp?")
print("GATEWAY=" + ("; ".join(bad) or "đạt"))

# 3. shop-quota như cuối s18 (s20 không đổi quota); tệp khớp.
WANTQ = {"pods": ("20", "count"), "requests.cpu": ("2", "cpu"), "requests.memory": ("3Gi", "memory"), "limits.memory": ("5Gi", "memory")}
bad = []
if q is None: bad.append("không có ResourceQuota shop-quota (hoặc không đọc được)")
else:
    hard = (q.get("spec") or {}).get("hard") or {}
    for key, (v, kind) in WANTQ.items():
        if key not in hard or num(hard[key], kind) is None or abs(num(hard[key], kind) - num(v, kind)) > 1e-6:
            bad.append(f"{key}={hard.get(key)} (cuối s18: {v})")
    extra = sorted(set(hard) - set(WANTQ))
    if extra: bad.append(f"khoá thừa {', '.join(extra)}")
    f, e = file_of("quota", "ResourceQuota")
    if e: bad.append(e)
    elif json.dumps(f.get("spec"), sort_keys=True) != json.dumps(q.get("spec"), sort_keys=True):
        bad.append("~/shop/quota.yaml khác ResourceQuota trong cluster: chưa apply từ tệp?")
print("QUOTA=" + ("; ".join(bad) or "đạt"))

# 4. shop: catalog Available trong khoảng của HPA; không Pod nào Pending (chưa xếp được); không ReplicaSet FailedCreate.
bad = []
if pods_j is None or rs_j is None or deps_j is None: bad.append("không đọc được Pod/ReplicaSet/Deployment")
else:
    lo, hi = 2, 2
    if hpa: lo, hi = hpa["spec"].get("minReplicas") or 1, hpa["spec"].get("maxReplicas") or 1
    p = avail("catalog", lo, hi)
    if p: bad.append(p)
    pend = [x["metadata"]["name"] for x in pods_j.get("items", []) if x.get("status", {}).get("phase") == "Pending"
            and any(c.get("type") == "PodScheduled" and c.get("status") == "False" for c in x.get("status", {}).get("conditions") or [])]
    if pend: bad.append(f"Pod Pending: {' '.join(sorted(pend))}")
    fail = [r["metadata"]["name"] for r in rs_j.get("items", []) if (r["spec"].get("replicas") or 0) > 0
            and any(c.get("type") == "ReplicaFailure" and c.get("status") == "True" for c in r.get("status", {}).get("conditions") or [])]
    if fail: bad.append(f"ReplicaSet không tạo được Pod (ReplicaFailure): {' '.join(sorted(fail))}")
print("SHOP=" + ("; ".join(bad) or "đạt"))

# 5. Hai worker schedulable, không taint (ngoài taint tạm node.kubernetes.io/* do node lifecycle tự đặt).
bad = []
if nodes_j is None: bad.append("không đọc được node")
else:
    nodes = {n["metadata"]["name"]: n for n in nodes_j.get("items", [])}
    for n in ("cka-w1", "cka-w2"):
        o = nodes.get(n)
        if not o: bad.append(f"không có node {n}"); continue
        if (o.get("spec") or {}).get("unschedulable"): bad.append(f"{n} đang cordon (SchedulingDisabled)")
        ts = [f"{x.get('key')}={x.get('value', '')}:{x.get('effect')}" for x in (o.get("spec") or {}).get("taints") or []
              if not str(x.get("key", "")).startswith("node.kubernetes.io/")]
        if ts: bad.append(f"{n} có taint {', '.join(ts)}")
print("NODES=" + ("; ".join(bad) or "đạt"))

left = open(f"{t}/default.txt").read().strip()
names = [l.split("/", 1)[-1] for l in left.splitlines() if l.strip()]
print("BATCH=" + ("không đọc được" if left == "ERR" else ("còn" if "batch-7f" in names else "đã xoá")))
print("PROBE=" + ("không đọc được" if left == "ERR" else ("còn" if "mem-probe" in names else "đã xoá")))
PY
