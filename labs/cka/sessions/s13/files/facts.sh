# s13 — đọc trạng thái probe / dừng tử tế của ba Deployment trong shop, in dạng KHOÁ=giá-trị (một dòng mỗi khoá).
# Chạy trên control plane bằng user ubuntu (kubectl + python3 của Ubuntu). Chỉ đọc: kubectl get và apply --dry-run=server.
# Dùng bởi verify.sh của s13 (và check.sh của buổi sau nếu cần).
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
kubectl -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
kubectl -n shop get endpointslices -o json > "$tmp/eps.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/eps.json"
for d in gateway catalog order; do
  kubectl apply --dry-run=server -f "$HOME/shop/$d.yaml" -o json > "$tmp/file-$d.json" 2>"$tmp/file-$d.err" || : > "$tmp/file-$d.json"
done
kubectl -n shop get deploy,svc probe-lab --ignore-not-found -o name > "$tmp/lab.txt" 2>&1
python3 - "$tmp" <<'PY'
import json, os, re, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
eps = (load(f"{t}/eps.json") or {}).get("items", [])

def c0(spec):
    cs = spec.get("containers") or [{}]
    return cs[0]

def port(c, p):
    if p is None: return "?"
    if isinstance(p, int) or str(p).isdigit(): return str(p)
    for cp in c.get("ports") or []:
        if cp.get("name") == p: return str(cp.get("containerPort"))
    return str(p)

def probes(spec):
    c = c0(spec); out = []
    for k in ("startupProbe", "livenessProbe", "readinessProbe"):
        h = (c.get(k) or {}).get("httpGet")
        out.append(f"{k[:-5]}=" + (f"{h.get('path')}:{port(c, h.get('port'))}" if h else "không"))
    return " ".join(out)

def prestop(spec):
    ps = (c0(spec).get("lifecycle") or {}).get("preStop")
    if not ps: return None
    if "sleep" in ps: return int(ps["sleep"].get("seconds", 0))
    cmd = " ".join((ps.get("exec") or {}).get("command") or [])
    m = re.search(r"sleep\s+(\d+)", cmd)
    return int(m.group(1)) if m else 0

def sig(spec):
    return f"{probes(spec)} preStop={prestop(spec)} grace={spec.get('terminationGracePeriodSeconds')}"

for name in ("gateway", "catalog", "order"):
    d = deps.get(name)
    if not d:
        for k in ("PROBES", "AVAIL", "STOP", "FILE"): print(f"{k}_{name}=không có Deployment")
        continue
    spec = d["spec"]["template"]["spec"]; st = d.get("status", {})
    print(f"PROBES_{name}={probes(spec)}")
    addrs = [e for s in eps if s.get("metadata", {}).get("labels", {}).get("kubernetes.io/service-name") == name
             for e in (s.get("endpoints") or [])]
    ready = sum(1 for e in addrs if (e.get("conditions") or {}).get("ready"))
    print(f"AVAIL_{name}={d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)} "
          f"eps={ready}/{len(addrs)}")
    s = prestop(spec); g = spec.get("terminationGracePeriodSeconds")
    if s is None: stop = "không có preStop"
    elif g == 30: stop = f"grace={g} là mặc định (chưa khai)"
    elif g is None or g < s + 20: stop = f"grace={g} < preStop {s}s + 20s của Spring"
    else: stop = "đạt"
    print(f"STOP_{name}={stop} (preStop={s}, grace={g})")
    f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        print(f"FILE_{name}=lỗi: {err[-1] if err else 'rỗng'}")
    else:
        fs, ls = sig(f["spec"]["template"]["spec"]), sig(spec)
        if fs != ls: print(f"FILE_{name}=tệp: {fs} | đang chạy: {ls}")
        elif "không" in fs or prestop(spec) is None: print(f"FILE_{name}=khớp nhưng chưa đủ probe/preStop: {fs}")
        else: print(f"FILE_{name}=khớp")
    if name == "gateway":
        print("INIT_gateway=" + ",".join(c.get("name", "") for c in spec.get("initContainers") or []))
lab = open(f"{t}/lab.txt").read().split()
print("PROBELAB=" + (" ".join(lab) if lab else "đã xoá"))
PY
