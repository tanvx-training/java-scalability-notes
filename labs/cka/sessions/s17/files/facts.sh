# s17 — đọc tài nguyên của ba Deployment trong shop, in dạng KHOÁ=giá-trị (một dòng mỗi khoá): requests/limits của mọi
# container (kể cả init container), QoS của mọi Pod, JAVA_OPTS, ~/shop/<tên>.yaml so với Deployment, số replica
# Available, Deployment nháp oom-lab. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
k -n shop get pod -l 'app in (gateway,catalog,order)' -o json > "$tmp/pods.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/pods.json"
for d in gateway catalog order; do
  k apply --dry-run=server -f "$HOME/shop/$d.yaml" -o json > "$tmp/file-$d.json" 2>"$tmp/file-$d.err" || : > "$tmp/file-$d.json"
done
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
pods = (load(f"{t}/pods.json") or {}).get("items", [])
want = {"gateway": 2, "catalog": 2, "order": 1}

def containers(spec):
    return (spec.get("initContainers") or []) + (spec.get("containers") or [])
def res_of(c):
    r = c.get("resources") or {}
    req, lim = r.get("requests") or {}, r.get("limits") or {}
    return req.get("cpu"), req.get("memory"), lim.get("memory")
def mib(q):
    # Số lượng bộ nhớ của Kubernetes → MiB (đủ cho Ki/Mi/Gi/k/M/G và số trơn).
    m = re.fullmatch(r"([0-9.]+)([KMGT]i?|k|)", str(q or ""))
    if not m: return None
    n, u = float(m.group(1)), m.group(2)
    f = {"": 1, "k": 1e3, "K": 1e3, "M": 1e6, "G": 1e9, "T": 1e12,
         "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4}[u]
    return n * f / 1024**2
def java_opts(spec):
    for e in (spec.get("containers") or [{}])[0].get("env") or []:
        if e.get("name") == "JAVA_OPTS": return e.get("value", "")
    return None
def sig(spec, replicas):
    return json.dumps({"replicas": replicas, "JAVA_OPTS": java_opts(spec),
                       "resources": {c.get("name"): c.get("resources") or {} for c in containers(spec)}}, sort_keys=True)

# 1. Ba trường tài nguyên ở mọi container, limits.memory ≥ requests.memory.
bad = []
for name in want:
    d = deps.get(name)
    if not d: bad.append(f"{name}: không có Deployment"); continue
    for c in containers(d["spec"]["template"]["spec"]):
        cpu, rm, lm = res_of(c)
        miss = [k for k, v in (("requests.cpu", cpu), ("requests.memory", rm), ("limits.memory", lm)) if not v]
        if miss: bad.append(f"{name}/{c.get('name')} thiếu {', '.join(miss)}")
        elif (mib(lm) or 0) < (mib(rm) or 0): bad.append(f"{name}/{c.get('name')} limits.memory < requests.memory")
print("RES=" + ("; ".join(bad) or "đạt"))

# 2. QoS của mọi Pod (đang chạy, không đang dừng) của ba Deployment.
bad = []
for p in pods:
    if p["metadata"].get("deletionTimestamp"): continue
    q = p.get("status", {}).get("qosClass")
    if q != "Burstable": bad.append(f"{p['metadata']['name']} {q}")
print("QOS=" + (", ".join(bad) if bad else ("đạt" if pods else "không có Pod")))

# 3. JAVA_OPTS: có -XX:MaxRAMPercentage=<n>, không có -Xmx/-Xms cố định (cờ đó đè MaxRAMPercentage).
bad = []
for name in want:
    d = deps.get(name)
    if not d: bad.append(f"{name}: không có Deployment"); continue
    jo = java_opts(d["spec"]["template"]["spec"])
    if jo is None: bad.append(f"{name}: không có JAVA_OPTS"); continue
    m = re.findall(r"-XX:MaxRAMPercentage=([0-9.]+)", jo)
    lim = mib(res_of((d["spec"]["template"]["spec"].get("containers") or [{}])[0])[2])
    if not m: bad.append(f"{name}: JAVA_OPTS={jo!r} không có -XX:MaxRAMPercentage=")
    elif lim and lim * (1 - float(m[-1]) / 100) < 128:
        # Đo trên lab: non-heap của một service shop ~140 MiB (metaspace, code cache, stack, GC). Cờ cuối cùng thắng.
        bad.append(f"{name}: MaxRAMPercentage={m[-1]} của limit {lim:.0f}Mi chỉ chừa {lim * (1 - float(m[-1]) / 100):.0f}Mi cho non-heap (cần ≥ 128Mi)")
    if re.search(r"-Xm[xs]", jo): bad.append(f"{name}: JAVA_OPTS còn -Xmx/-Xms")
    if any(not 32 <= ord(ch) < 127 for ch in jo): bad.append(f"{name}: JAVA_OPTS có ký tự ngoài ASCII")
print("JOPTS=" + ("; ".join(bad) or "đạt"))

# 4. ~/shop/<tên>.yaml có resources (không rỗng) và khớp Deployment; ba Deployment Available đúng số replica.
bad = []
for name, n in want.items():
    d = deps.get(name)
    if not d: bad.append(f"{name}: không có Deployment"); continue
    st = d.get("status", {})
    r = f"{d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)}"
    if r != f"{n}/{n}/{n}": bad.append(f"{name}: replica/cập nhật/Available {r}")
    f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        bad.append(f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'rỗng'}"); continue
    if f.get("kind") != "Deployment": bad.append(f"~/shop/{name}.yaml phải là đúng một Deployment"); continue
    fspec = f["spec"]["template"]["spec"]
    if not all(all(res_of(c)) for c in containers(fspec)): bad.append(f"~/shop/{name}.yaml chưa có đủ resources"); continue
    if sig(fspec, f["spec"].get("replicas")) != sig(d["spec"]["template"]["spec"], d["spec"].get("replicas")):
        bad.append(f"~/shop/{name}.yaml khác Deployment (resources/JAVA_OPTS/replicas): chưa apply từ tệp?")
print("FILES=" + ("; ".join(bad) or "đạt"))
print("OOMLAB=" + ("còn" if "oom-lab" in deps else "đã xoá"))
PY
