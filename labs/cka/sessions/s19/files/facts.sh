# s19 — đọc nhãn/taint của hai worker, podAntiAffinity và vị trí Pod của catalog, PriorityClass shop-critical và
# gateway, Pod/Deployment nháp của buổi, số replica Available; so ~/shop/{catalog,gateway}.yaml với cluster.
# In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/nodes.json"
k -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
k -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/pods.json"
k get priorityclass shop-critical -o json > "$tmp/pc.json" 2>/dev/null || echo '{}' > "$tmp/pc.json"
for d in gateway catalog; do
  k apply --dry-run=server -f "$HOME/shop/$d.yaml" -o json > "$tmp/file-$d.json" 2>"$tmp/file-$d.err" || : > "$tmp/file-$d.json"
done
python3 - "$tmp" <<'PY'
import json, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
nodes = {n["metadata"]["name"]: n for n in (load(f"{t}/nodes.json") or {}).get("items", [])}
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
pods = [p for p in (load(f"{t}/pods.json") or {}).get("items", []) if not p["metadata"].get("deletionTimestamp")]
pc = load(f"{t}/pc.json") or {}

def avail(name, n):
    d = deps.get(name)
    if not d: return f"{name}: không có Deployment"
    st = d.get("status", {})
    r = f"{d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)}"
    prog = [x.get("reason") for x in st.get("conditions", []) if x.get("type") == "Progressing"]
    if r != f"{n}/{n}/{n}": return f"{name}: replica/cập nhật/Available {r}"
    if prog != ["NewReplicaSetAvailable"]: return f"{name}: rollout chưa xong"
    return None
def file_problem(name, pick):
    d = deps.get(name); f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        return f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'rỗng'}"
    if f.get("kind") != "Deployment": return f"~/shop/{name}.yaml phải là đúng một Deployment"
    if d and pick(f["spec"]["template"]["spec"]) != pick(d["spec"]["template"]["spec"]):
        return f"~/shop/{name}.yaml khác Deployment: chưa apply từ tệp?"
    return None

# 1. Nhãn role=db trên cka-w2; hai worker không có taint nào (worker của kubeadm mặc định không có taint).
bad = []
w2 = nodes.get("cka-w2")
if not w2: bad.append("không có node cka-w2")
elif w2["metadata"].get("labels", {}).get("role") != "db": bad.append("cka-w2 chưa có nhãn role=db")
others = sorted(n for n, o in nodes.items() if n != "cka-w2" and o["metadata"].get("labels", {}).get("role") == "db")
if others: bad.append(f"nhãn role=db cả trên {', '.join(others)}")
for n in ("cka-w1", "cka-w2"):
    o = nodes.get(n)
    if not o: continue
    ts = [f"{x.get('key')}={x.get('value', '')}:{x.get('effect')}" for x in (o.get("spec") or {}).get("taints") or []]
    if ts: bad.append(f"{n} còn taint {', '.join(ts)}")
    if (o.get("spec") or {}).get("unschedulable"): bad.append(f"{n} đang cordon")
print("NODES=" + ("; ".join(bad) or "đạt"))

# 2. catalog: podAntiAffinity preferred theo kubernetes.io/hostname, chọn chính Pod catalog; hai Pod Ready ở hai node.
bad = []
def anti(spec):
    a = ((spec.get("affinity") or {}).get("podAntiAffinity") or {})
    return json.dumps(a, sort_keys=True)
d = deps.get("catalog")
if not d: bad.append("không có Deployment catalog")
else:
    spec = d["spec"]["template"]["spec"]
    a = (spec.get("affinity") or {}).get("podAntiAffinity") or {}
    pref = a.get("preferredDuringSchedulingIgnoredDuringExecution") or []
    labels = d["spec"]["template"]["metadata"].get("labels", {})
    def selects_self(term):
        sel = (term.get("labelSelector") or {})
        conds = [labels.get(k) == v for k, v in (sel.get("matchLabels") or {}).items()]
        conds += [labels.get(e.get("key")) in (e.get("values") or []) for e in sel.get("matchExpressions") or []
                  if e.get("operator") == "In"]
        return bool(conds) and all(conds)
    good = [p for p in pref if (p.get("podAffinityTerm") or {}).get("topologyKey") == "kubernetes.io/hostname"
            and selects_self(p.get("podAffinityTerm") or {})]
    if not good: bad.append("không có podAntiAffinity preferred theo kubernetes.io/hostname chọn Pod app=catalog")
    if a.get("requiredDuringSchedulingIgnoredDuringExecution"): bad.append("còn podAntiAffinity required (HPA ở s20 cần quá 2 replica)")
    p = avail("catalog", 2)
    if p: bad.append(p)
    ready = [x for x in pods if x["metadata"].get("labels", {}).get("app") == "catalog"
             and any(c.get("type") == "Ready" and c.get("status") == "True" for c in x.get("status", {}).get("conditions") or [])]
    on = sorted(x["spec"].get("nodeName") or "?" for x in ready)
    if len(set(on)) < 2: bad.append(f"Pod catalog Ready trên: {' '.join(on) or 'không có'} (cần hai node khác nhau)")
    p = file_problem("catalog", anti)
    if p: bad.append(p)
print("CATALOG=" + ("; ".join(bad) or "đạt"))

# 3. PriorityClass shop-critical; gateway dùng nó (Pod mang priority bằng value); ba Deployment Available.
bad = []
val = pc.get("value")
if not pc: bad.append("không có PriorityClass shop-critical")
elif pc.get("globalDefault"): bad.append("shop-critical là globalDefault (mọi Pod mới đều nhận)")
g = deps.get("gateway")
if g and g["spec"]["template"]["spec"].get("priorityClassName") != "shop-critical": bad.append("gateway chưa dùng priorityClassName shop-critical")
gp = [x for x in pods if x["metadata"].get("labels", {}).get("app") == "gateway"]
wrong = [x["metadata"]["name"] for x in gp if val is not None and x["spec"].get("priority") != val]
if wrong: bad.append(f"Pod gateway chưa mang priority {val}: {' '.join(wrong)}")
for name, n in {"gateway": 2, "catalog": 2, "order": 1}.items():
    p = avail(name, n)
    if p: bad.append(p)
p = file_problem("gateway", lambda s: s.get("priorityClassName"))
if p: bad.append(p)
print("PRIORITY=" + ("; ".join(bad) or "đạt"))
print(f"PC_VALUE={val}")

names = {x["metadata"]["name"] for x in pods}
print("DB_PROBE=" + ("còn" if "db-probe" in names else "đã xoá"))
left = [n for n in ("pinned",) if n in names] + (["deploy/spread-lab"] if "spread-lab" in deps else [])
left += [x["metadata"]["name"] for x in pods if x["metadata"].get("labels", {}).get("app") == "spread-lab"
         and "spread-lab" not in deps]
print("DRAFTS=" + (" ".join(left) if left else "đã xoá"))
PY
