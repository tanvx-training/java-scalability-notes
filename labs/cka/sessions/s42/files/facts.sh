# s42 — dữ kiện của verify s42 trên cka-cp (cộng node-facts.sh trên từng node, do verify.sh gọi): phiên bản node, image của
# control plane, kube-proxy, CoreDNS, etcd theo kubeadm, kubeadm-config; shop, cert-manager (Certificate, webhook nhận dry-run);
# hai log của vòng request ~/drills/s42/loop-cp-w1.log, loop-w2.log và ~/drills/s42/answers.env. In dạng KHOÁ=giá-trị. Chạy bằng
# user ubuntu (kubectl, helm, kubeadm, python3). Chỉ đọc (dry-run phía server không lưu gì); mỗi lệnh có timeout.
python3 - "$HOME" <<'PY'
import json, re, subprocess, sys
import yaml
home = sys.argv[1]
MINOR = "v1.37."
NODES = ("cka-cp", "cka-w1", "cka-w2")

def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def js(rc, out):
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def kj(*a): return js(*run("kubectl", "--request-timeout=10s", *a, "-o", "json")[:2])
def hj(*a): return js(*run("helm", *a, "-o", "json")[:2])
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])
def available(d):
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return st.get("observedGeneration", 0) >= d["metadata"]["generation"] and st.get("availableReplicas", 0) >= want and st.get("updatedReplicas", 0) >= want
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def tag(img): return img.rsplit(":", 1)[-1] if ":" in img else ""

# 1. NODES: ba node kubelet v1.37.x cùng một bản, Ready, không cordon; ClusterConfiguration kubernetesVersion 1.37. Thông báo
# lỗi ngắn: lab chỉ in 80 ký tự đầu của mỗi dòng đỏ, nên mỗi dòng gom ít tiêu chí và mỗi lý do vài chữ.
bad = []
nodes = (kj("get", "node") or {}).get("items")
ver = None
if nodes is None: bad.append("không đọc được node")
else:
    vs = {n["metadata"]["name"]: n["status"]["nodeInfo"]["kubeletVersion"] for n in nodes}
    old = [f"{a.replace('cka-', '')} {b}" for a, b in sorted(vs.items()) if not b.startswith(MINOR)]
    if old: bad.append("node cũ: " + ", ".join(old))
    elif len(set(vs.values())) != 1: bad.append("ba node khác bản: " + ", ".join(f"{a} {b}" for a, b in sorted(vs.items())))
    else: ver = next(iter(vs.values()))
    for n in nodes:
        nm = n["metadata"]["name"]
        if not ready(n): bad.append(f"{nm} chưa Ready")
        if n["spec"].get("unschedulable"): bad.append(f"{nm} đang cordon")
    if sorted(vs) != sorted(NODES): bad.append("node: " + ", ".join(sorted(vs)))
cm = kj("-n", "kube-system", "get", "cm", "kubeadm-config")
try: kv = yaml.safe_load(cm["data"]["ClusterConfiguration"]).get("kubernetesVersion")
except Exception: kv = None
if not str(kv).startswith(MINOR): bad.append(f"kubeadm-config {kv}")
say("NODES", bad)

# 2. IMAGES: static pod control plane v1.37.x cùng bản node; etcd, CoreDNS, kube-proxy đúng image kubeadm của bản đó liệt kê.
bad = []
want = {}
if not ver: bad.append("node chưa cùng bản 1.37")
if ver:
    rc, out, _ = run("kubeadm", "config", "images", "list", "--kubernetes-version", ver)
    for l in out.split():
        name = l.rsplit("/", 1)[-1].split(":")[0]; want[name] = l
    if rc != 0 or not want: bad.append(f"kubeadm config images list --kubernetes-version {ver} lỗi")
pods = (kj("-n", "kube-system", "get", "pod") or {}).get("items") or []
for comp in ("kube-apiserver", "kube-controller-manager", "kube-scheduler", "etcd"):
    p = next((x for x in pods if x["metadata"]["name"] == f"{comp}-cka-cp"), None)
    if p is None: bad.append(f"chưa có Pod {comp}-cka-cp"); continue
    img = p["spec"]["containers"][0]["image"]
    short = comp.replace("kube-", "")
    if comp != "etcd" and not tag(img).startswith(MINOR): bad.append(f"{short} {tag(img)}")
    elif want.get(comp) and img != want[comp]: bad.append(f"{short} {tag(img)}≠{tag(want[comp])}")
    if not ready(p): bad.append(f"{short} chưa Ready")
for kind, name, cname in (("ds", "kube-proxy", "kube-proxy"), ("deploy", "coredns", "coredns")):
    o = kj("-n", "kube-system", "get", kind, name)
    img = o["spec"]["template"]["spec"]["containers"][0]["image"] if o else "?"
    if want.get(cname) and img != want[cname]: bad.append(f"{name} {tag(img)}")
    if o and kind == "deploy" and not available(o): bad.append("coredns chưa Available")
    if o and kind == "ds" and (o.get("status") or {}).get("numberReady") != (o.get("status") or {}).get("desiredNumberScheduled"): bad.append("kube-proxy chưa Ready đủ")
say("IMAGES", bad)
print("VER=" + (ver or ""))

# CoreDNS có PDB thật sự giữ được Pod (kubeadm không tạo PDB nào): giữ ít nhất một Pod (minAvailable ≥ 1 hay ≥ 1%) hay không
# cho đuổi hết (maxUnavailable là số, hay phần trăm < 100%), và lúc này còn ít nhất một Pod không được đuổi (ALLOWED
# DISRUPTIONS < số Pod khoẻ). Nhận cả dạng phần trăm (minAvailable: 50%). maxUnavailable 100%, minAvailable 0
# hay 0%, hay maxUnavailable 2 với 2 replica (ALLOWED DISRUPTIONS = số Pod khoẻ): đỏ.
pdbs = (kj("-n", "kube-system", "get", "pdb") or {}).get("items") or []
def intstr(v):
    """(số, có phải phần trăm) của một IntOrString của PDB; None nếu không đọc được."""
    if isinstance(v, int): return v, False
    m = re.fullmatch(r"\s*(\d+)\s*(%?)\s*", str(v)) if v is not None else None
    return (int(m.group(1)), m.group(2) == "%") if m else None
def dns_pdb(p):
    sp, st = p.get("spec") or {}, p.get("status") or {}
    if ((sp.get("selector") or {}).get("matchLabels") or {}).get("k8s-app") != "kube-dns": return False
    mn, mx = intstr(sp.get("minAvailable")), intstr(sp.get("maxUnavailable"))
    if mn is not None: ok = mn[0] >= 1
    elif mx is not None: ok = not mx[1] or mx[0] < 100
    else: ok = False
    return ok and (st.get("disruptionsAllowed") or 0) < (st.get("currentHealthy") or 0)
dns_ok = any(dns_pdb(p) for p in pdbs)
# 2. APPS: release shop deployed; gateway, catalog, order (≥ 2 replica) và postgres Available; cert-manager ba Deployment
# Available, Certificate shop-local Ready, webhook trả lời (tạo thử một Certificate bằng --dry-run=server).
bad = []
if not dns_ok: bad.append("CoreDNS không có PDB giữ Pod")
r = next((x for x in hj("list", "-n", "shop") or [] if x.get("name") == "shop"), None)
if r is None or r.get("status") != "deployed": bad.append(f"release shop {'chưa có' if r is None else r.get('status')}")
for n in ("gateway", "catalog", "order"):
    d = kj("-n", "shop", "get", "deploy", n)
    if d is None or not available(d) or d["spec"].get("replicas", 1) < 2: bad.append(f"{n} <2 Pod sẵn sàng")
s = kj("-n", "shop", "get", "sts", "postgres")
if s is None or (s.get("status") or {}).get("readyReplicas") != 1: bad.append("postgres-0 chưa Ready")
for n in ("cert-manager", "cert-manager-webhook", "cert-manager-cainjector"):
    d = kj("-n", "cert-manager", "get", "deploy", n)
    if d is None or not available(d): bad.append(f"{n.replace('cert-manager-', 'cm-')} chưa sẵn sàng")
c = kj("-n", "shop", "get", "certificate", "shop-local")
if c is None or not ready(c): bad.append("shop-local chưa Ready")
probe = """apiVersion: cert-manager.io/v1
kind: Certificate
metadata: {name: s42-probe, namespace: shop}
spec: {secretName: s42-probe-tls, dnsNames: [probe.shop.local], issuerRef: {name: selfsigned, kind: Issuer}}
"""
rc, out, err = run("kubectl", "--request-timeout=15s", "create", "--dry-run=server", "-f", "-", inp=probe.encode())
if rc != 0: bad.append("webhook cert-manager từ chối")
say("APPS", bad)
ips = {n["metadata"]["name"]: next((a["address"] for a in n["status"]["addresses"] if a["type"] == "InternalIP"), "") for n in nodes or []}
dp = [p for p in (kj("-n", "shop", "get", "pod", "-l", "gateway.networking.k8s.io/gateway-name=shop-gw") or {}).get("items", [])
      if (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")]
print("W1_IP=" + ips.get("cka-w1", ""))
print("DP_IP=" + (ips.get(dp[0]["spec"].get("nodeName"), "") if dp else ""))

# Log của loop.sh: dòng request "<epoch> <giờ> <mã> <giây>", dòng trạng thái "# <epoch> <giờ> nodes a=v/sched … pods a=N …".
def parse(path):
    reqs, states = [], []
    for l in open(path):
        f = l.split()
        if not f: continue
        if f[0] == "#":
            if len(f) >= 4 and f[3] == "nodes":
                st = {"t": float(f[1]), "nodes": {}, "pods": {}}; mode = None
                for x in f[4:]:
                    if x == "pods": mode = "pods"; continue
                    if "=" not in x: continue
                    a, b = x.split("=", 1)
                    if mode == "pods": st["pods"][a] = int(b) if b.isdigit() else -1
                    else: v, _, s2 = b.partition("/"); st["nodes"][a] = (v, s2)
                states.append(st)
            continue
        try: reqs.append((float(f[0]), f[2]))
        except (ValueError, IndexError): pass
    return reqs, states
def windows(states, node):
    """Các đoạn node bị cordon rồi uncordon: [(lúc cordon, lúc uncordon, số Pod gateway/catalog/order nhỏ nhất trên node)]."""
    res, cur = [], None
    for st in states:
        s2 = (st["nodes"].get(node) or ("", ""))[1]; p = st["pods"].get(node, -1)
        if s2 == "cordon":
            if cur is None: cur = [st["t"], None, p if p >= 0 else 99]
            elif p >= 0: cur[2] = min(cur[2], p)
        elif s2 == "sched" and cur is not None:
            cur[1] = st["t"]; res.append(tuple(cur)); cur = None
    return res
def drain_upgrade(states, node, need_empty=True):
    """Lỗi (chuỗi) nếu log không có đoạn: cordon → Pod trên node về 0 (drain xong) → kubelet lên 1.37 → uncordon.
    need_empty=False cho cka-cp: loop.sh chỉ đếm Pod gateway/catalog/order, trên control plane luôn là 0, nên log không phân
    biệt được drain với cordon trần của cka-cp. Giới hạn đã biết: với cka-cp chỉ chấm "cordon → lên 1.37 trong đoạn đó →
    uncordon"; drain thật của cka-cp được kiểm gián tiếp (Ingress/Gateway/cert-manager trên cka-cp phải chạy lại sau đó)."""
    ws = windows(states, node)
    s = node.replace("cka-", "")
    if not ws: return f"không có đoạn cordon→uncordon {s}"
    if need_empty and not any(w[2] == 0 for w in ws): return f"{s}: Pod shop chưa về 0 khi cordon"
    u = upgraded(states, node)
    if u is None: return f"không thấy {s} v1.36→1.37"
    if not any((w[2] == 0 or not need_empty) and w[0] <= u <= w[1] for w in ws): return f"{s} lên 1.37 ngoài đoạn drain"
    return None
def upgraded(states, node):
    """Lúc node đổi từ v1.36.x sang v1.37.x trong log (None nếu không thấy)."""
    seen_old = False
    for st in states:
        v = (st["nodes"].get(node) or ("", ""))[0]
        if v.startswith("v1.36."): seen_old = True
        elif v.startswith(MINOR) and seen_old: return st["t"]
    return None
def max_gap(reqs, a, b):
    pts = [a] + [t for t, _ in reqs if a <= t <= b] + [b]
    return max(y - x for x, y in zip(pts, pts[1:]))
def load(name):
    try: return parse(f"{home}/drills/s42/{name}")
    except Exception: return None, None

# 3. LOG1: loop-cp-w1.log — cka-cp rồi cka-w1 lên 1.37 trong lúc vòng chạy (control plane trước), mỗi node được drain rồi
# uncordon, request đều (không hở quá 8 giây; mỗi request tối đa 5 giây), 0 lỗi.
bad = []
reqs, states = load("loop-cp-w1.log")
if reqs is None: bad.append("chưa có ~/drills/s42/loop-cp-w1.log")
elif not reqs: bad.append("loop-cp-w1.log chưa có request")
else:
    errs = [c for _, c in reqs if c != "200"]
    if errs: bad.append(f"{len(errs)}/{len(reqs)} lỗi ({', '.join(sorted(set(errs)))})")
    for n in ("cka-cp", "cka-w1"):
        e = drain_upgrade(states, n, need_empty=(n != "cka-cp"))
        if e: bad.append(e)
    # Thứ tự nâng (version skew): cka-cp trước cka-w1, và cka-w2 phải còn 1.36 suốt log này.
    ucp, uw1 = upgraded(states, "cka-cp"), upgraded(states, "cka-w1")
    if ucp and uw1 and uw1 < ucp: bad.append("w1 lên 1.37 trước cp")
    if states and not (states[0]["nodes"].get("cka-w2") or ("",))[0].startswith("v1.36."): bad.append("w2 đã 1.37 trước cp")
    if states and reqs:
        g = max_gap(reqs, states[0]["t"], states[-1]["t"])
        if g > 8: bad.append(f"hở {g:.0f} giây")
    if upgraded(states, "cka-w2"): bad.append("w2 lên 1.37 trong log này")
say("LOG1", bad)

# 4. LOG2: loop-w2.log — cka-w2 drain, lên 1.37, uncordon trong lúc vòng chạy; khoảng lỗi (request lỗi đầu tới request lỗi
# cuối) so với W2_OUTAGE_SECONDS trong answers.env (±10 giây); log kết thúc bằng request 200 (shop đã hồi).
ans = {}
try:
    for l in open(f"{home}/drills/s42/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
bad = []
reqs, states = load("loop-w2.log")
if reqs is None: bad.append("chưa có ~/drills/s42/loop-w2.log")
elif not reqs: bad.append("loop-w2.log chưa có request")
else:
    e = drain_upgrade(states, "cka-w2")
    if e: bad.append(e)
    # Thứ tự nâng: lúc loop-w2.log bắt đầu, cka-cp và cka-w1 đã 1.37, và log này bắt đầu sau khi loop-cp-w1.log kết thúc.
    first = states[0]["nodes"] if states else {}
    if not all((first.get(n) or ("",))[0].startswith(MINOR) for n in ("cka-cp", "cka-w1")): bad.append("cp/w1 chưa 1.37 khi bắt đầu")
    r1, s1 = load("loop-cp-w1.log")
    if s1 and states and states[0]["t"] < s1[-1]["t"]: bad.append("bắt đầu trước khi loop-cp-w1 xong")
    errs = [t for t, c in reqs if c != "200"]
    outage = round(errs[-1] - errs[0]) if errs else 0
    if reqs[-1][1] != "200": bad.append("request cuối chưa 200")
    if ans is None: bad.append("chưa có ~/drills/s42/answers.env")
    else:
        v = ans.get("W2_OUTAGE_SECONDS")
        if v is None: bad.append("answers.env chưa có W2_OUTAGE_SECONDS")
        elif not re.fullmatch(r"\d+", v): bad.append(f"W2_OUTAGE_SECONDS={v} không phải số giây")
        elif abs(int(v) - outage) > 10: bad.append(f"W2_OUTAGE_SECONDS={v}, log đo {outage}")
say("LOG2", bad)

# 5. SKEW: SKEW_RULE = số minor tối đa kubelet được cũ hơn kube-apiserver (version skew policy).
bad = []
if ans is None: bad.append("chưa có ~/drills/s42/answers.env")
elif ans.get("SKEW_RULE") is None: bad.append("answers.env chưa có SKEW_RULE")
elif ans.get("SKEW_RULE") != "3": bad.append(f"SKEW_RULE={ans.get('SKEW_RULE')} chưa đúng (số minor, viết bằng chữ số)")
say("SKEW", bad)
PY
