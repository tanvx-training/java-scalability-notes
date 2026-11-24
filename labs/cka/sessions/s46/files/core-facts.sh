# s46 — "lõi khoẻ" dùng chung cho chặng 9 và hai đề mock. Chạy trên cka-cp (user ubuntu, sudo không hỏi mật khẩu; kubectl,
# helm, crictl, python3 + PyYAML). Chỉ đọc; mỗi lệnh có timeout (kubectl --request-timeout=10s), lệnh lỗi hay hết giờ là
# "chưa đạt", không treo: apiserver chết thì mỗi lệnh kubectl trả lỗi trong ≤ 10 giây, cả tệp ≤ ~2 phút.
#
# HỢP ĐỒNG (verify của s46–s51, setup/score của mock gọi tệp này theo đường dẫn, không chép lại):
#   Gửi:  vm "$LAB_CP" "$(cat "$SESSION_DIR/../s46/files/core-facts.sh")"          (buổi)
#         vm "$LAB_CP" "$(cat "$SESSION_DIR/../../sessions/s46/files/core-facts.sh")" (mock)
#   In đúng bốn dòng KHOÁ=giá-trị, theo thứ tự này; giá trị là `đạt` hoặc lý do ngắn (≤ 170 ký tự, lý do quan trọng trước:
#   lab chỉ in 80 ký tự đầu), riêng W1_IP là IPv4 (rỗng nếu không đọc được):
#     CORE_NODES  ba node cka-cp, cka-w1, cka-w2 Ready, không cordon (spec.unschedulable, taint unschedulable), kubelet v1.37.x.
#     CORE_CP     bốn static pod control plane (etcd, kube-apiserver, kube-controller-manager, kube-scheduler): đúng một
#                 container đang chạy mỗi thứ (crictl) và mirror pod Running + Ready; etcd chạy từ /var/lib/etcd-restore
#                 (--data-dir, volumeMount, hostPath của manifest và mount thật của container); apiserver /readyz = ok.
#     CORE_SHOP   release shop `deployed`; Deployment gateway, gateway-v1, catalog, order rollout xong (observedGeneration,
#                 updated = ready = available = replicas, condition Available) ; gateway, catalog, order mỗi cái ≥ 2 Pod Ready
#                 trải cả cka-w1 lẫn cka-w2 (trạng thái của s41); postgres-0 Ready; không drift so với `helm get manifest shop`:
#                 container (số lượng, tên, image, env, envFrom, ba probe) của bốn Deployment và Service (type, selector,
#                 ports) của bốn service khớp manifest của release (so tập con: trường manifest ghi thì cluster phải đúng như
#                 vậy, danh sách phải cùng độ dài — thêm một biến env bằng `kubectl set env` là drift).
#     W1_IP       InternalIP của cka-w1 (cho mac_get của s46/files/mac.sh).
#   Không chờ gì: bên gọi tự chờ trước (s26/files/wait.sh, hay probe như s45/files/probe.sh khi control plane có thể hỏng).
python3 - <<'PY'
import json, subprocess
import yaml
NEW = "/var/lib/etcd-restore"
NODES = ("cka-cp", "cka-w1", "cka-w2")
WORKERS = ("cka-w1", "cka-w2")
CP = ("etcd", "kube-apiserver", "kube-controller-manager", "kube-scheduler")
DEPLOYS = ("gateway", "gateway-v1", "catalog", "order")
SPREAD = ("gateway", "catalog", "order")

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a):
    rc, out, _ = run("kubectl", "--request-timeout=10s", *a, "-o", "json", timeout=20)
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))

# 1. CORE_NODES
bad = []
nodes = (kj("get", "node") or {}).get("items")
ips = {}
if nodes is None: bad.append("không đọc được node (apiserver?)")
else:
    by = {n["metadata"]["name"]: n for n in nodes}
    if sorted(by) != sorted(NODES): bad.append("node: " + ",".join(sorted(by)))
    for name in NODES:
        n = by.get(name)
        if n is None: continue
        s = name.replace("cka-", "")
        if not ready(n): bad.append(f"{s} chưa Ready")
        if n["spec"].get("unschedulable") or any(t.get("key") == "node.kubernetes.io/unschedulable" for t in n["spec"].get("taints") or []):
            bad.append(f"{s} đang cordon")
        v = n["status"]["nodeInfo"]["kubeletVersion"]
        if not v.startswith("v1.37."): bad.append(f"{s} kubelet {v}")
        ips[name] = next((a["address"] for a in n["status"].get("addresses") or [] if a.get("type") == "InternalIP"), "")
say("CORE_NODES", bad)

# 2. CORE_CP
bad = []
for c in CP:
    rc, out, _ = run("sudo", "crictl", "ps", "-q", "--name", f"^{c}$", "--state", "running", timeout=15)
    n = len(out.split()) if rc == 0 else -1
    if n != 1: bad.append(f"{c}: {n if n >= 0 else '?'} container chạy")
pods = {p["metadata"]["name"]: p for p in (kj("-n", "kube-system", "get", "pod", "-l", "tier=control-plane") or {}).get("items", [])}
for c in CP:
    p = pods.get(f"{c}-cka-cp")
    if p is None: bad.append(f"không thấy Pod {c}-cka-cp")
    elif (p.get("status") or {}).get("phase") != "Running" or not ready(p): bad.append(f"{c}-cka-cp chưa Running/Ready")
rc, txt, _ = run("sudo", "cat", "/etc/kubernetes/manifests/etcd.yaml")
dd = hp = None
try:
    doc = yaml.safe_load(txt)
    c = doc["spec"]["containers"][0]
    dd = next((a.split("=", 1)[1] for a in (c.get("command") or []) + (c.get("args") or []) if a.startswith("--data-dir=")), None)
    m = next((v for v in c.get("volumeMounts") or [] if (v.get("mountPath") or "").rstrip("/") == (dd or "").rstrip("/")), None)
    vol = next((v for v in doc["spec"].get("volumes") or [] if m and v.get("name") == m.get("name")), None)
    hp = ((vol or {}).get("hostPath") or {}).get("path")
except Exception: pass
if dd != NEW or hp != NEW: bad.append(f"manifest etcd: data-dir {dd}, hostPath {hp}")
rc, out, _ = run("sudo", "crictl", "ps", "-q", "--name", "^etcd$", "--state", "running", timeout=15)
cid = out.split()[0] if rc == 0 and out.split() else None
if cid:
    rc, out, _ = run("sudo", "crictl", "inspect", cid, timeout=15)
    try:
        info = json.loads(out)
        cfg = (info.get("info") or {}).get("config") or {}
        live = next((a.split("=", 1)[1] for a in (cfg.get("command") or []) + (cfg.get("args") or []) if a.startswith("--data-dir=")), None)
        src = next((m.get("hostPath") for m in (info.get("status") or {}).get("mounts") or []
                    if (m.get("containerPath") or "").rstrip("/") == (live or "").rstrip("/")), None)
        if src != NEW: bad.append(f"etcd đang chạy dùng {src}")
    except Exception: bad.append("crictl inspect etcd lỗi")
rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "--raw", "/readyz", timeout=20)
if out.strip() != "ok": bad.append("apiserver /readyz chưa ok")
say("CORE_CP", bad)

# 3. CORE_SHOP
def sub(m, l):
    """m (manifest) là tập con của l (cluster): dict thì mọi khoá của m có trong l và khớp; list thì cùng độ dài, khớp từng
    phần tử; số và chuỗi so sau khi đổi về chuỗi (cổng 8080 và "8080")."""
    if isinstance(m, dict): return isinstance(l, dict) and all(k in l and sub(v, l[k]) for k, v in m.items())
    if isinstance(m, list): return isinstance(l, list) and len(m) == len(l) and all(sub(a, b) for a, b in zip(m, l))
    return str(m) == str(l)
bad = []
rc, out, _ = run("helm", "list", "-n", "shop", "-o", "json", timeout=30)
try: rel = next((x for x in json.loads(out) if x.get("name") == "shop"), None) if rc == 0 else None
except Exception: rel = None
if rel is None: bad.append("không đọc được release shop")
elif rel.get("status") != "deployed": bad.append(f"release shop {rel.get('status')}")
rc, out, _ = run("helm", "get", "manifest", "shop", "-n", "shop", timeout=30)
man = {}
try:
    for d in yaml.safe_load_all(out if rc == 0 else ""):
        if isinstance(d, dict) and d.get("kind"): man[(d["kind"], (d.get("metadata") or {}).get("name"))] = d
except Exception: man = {}
if rc != 0 or not man: bad.append("không đọc được helm get manifest shop")
live = {d["metadata"]["name"]: d for d in (kj("-n", "shop", "get", "deploy") or {}).get("items", [])}
svcs = {s["metadata"]["name"]: s for s in (kj("-n", "shop", "get", "svc") or {}).get("items", [])}
podl = (kj("-n", "shop", "get", "pod") or {}).get("items")
if podl is None: bad.append("không đọc được Pod của shop")
podl = [p for p in podl or [] if not p["metadata"].get("deletionTimestamp")]
drift, roll = [], []
for n in DEPLOYS:
    d = live.get(n)
    if d is None: bad.append(f"thiếu Deployment {n}"); continue
    sp, st = d["spec"], d.get("status") or {}
    want = sp.get("replicas", 1)
    avail = any(c.get("type") == "Available" and c.get("status") == "True" for c in st.get("conditions") or [])
    if not avail or st.get("observedGeneration", 0) < d["metadata"].get("generation", 0) or \
       not (st.get("updatedReplicas", 0) == st.get("readyReplicas", 0) == st.get("availableReplicas", 0) == want) or st.get("replicas", 0) != want:
        roll.append(f"{n}: rollout chưa xong ({st.get('updatedReplicas', 0)} mới, {st.get('availableReplicas', 0)}/{want} sẵn sàng)")
    md = man.get(("Deployment", n))
    if md is None: drift.append(f"{n} không có trong release"); continue
    mc = md["spec"]["template"]["spec"]["containers"]
    lc = sp["template"]["spec"]["containers"]
    if [c.get("name") for c in mc] != [c.get("name") for c in lc]: drift.append(f"{n}: container"); continue
    for a, b in zip(mc, lc):
        for k in ("image", "env", "envFrom", "livenessProbe", "readinessProbe", "startupProbe"):
            if (k in a or k in b) and not (k in a and k in b and sub(a[k], b[k])): drift.append(f"{n}.{k}")
    ms = man.get(("Service", n))
    s = svcs.get(n)
    if ms is None or s is None: drift.append(f"Service {n} " + ("không có trong release" if ms is None else "không có"))
    else:
        for k in ("type", "selector", "ports"):
            if k in ms["spec"] and not sub(ms["spec"][k], s["spec"].get(k)): drift.append(f"Service {n}.{k}")
# Drift in trước (lab in 80 ký tự đầu): nó nói chỗ cần sửa, còn rollout kẹt chỉ là hệ quả.
if drift: bad.append("lệch helm get manifest: " + ", ".join(drift))
bad += roll
for n in SPREAD:
    ps = [p for p in podl if (p["metadata"].get("labels") or {}).get("app") == n and ready(p)]
    where = sorted({p["spec"].get("nodeName", "?").replace("cka-", "") for p in ps})
    if len(ps) < 2: bad.append(f"{n}: {len(ps)} Pod Ready")
    elif not all(w.replace("cka-", "") in where for w in WORKERS): bad.append(f"{n}: Pod Ready chỉ ở {','.join(where)}")
pg = next((p for p in podl if p["metadata"]["name"] == "postgres-0"), None)
if pg is None or not ready(pg): bad.append("postgres-0 chưa Ready")
say("CORE_SHOP", bad)

print("W1_IP=" + ips.get("cka-w1", ""))
PY
