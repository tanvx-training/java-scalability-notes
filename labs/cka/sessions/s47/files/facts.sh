# s47 — dữ kiện riêng của verify s47 trên cka-cp (user ubuntu, sudo; kubectl, python3), cộng s46/files/core-facts.sh. So với
# bản tốt mà sự cố st9-net lưu lần đầu ở /root/.lab/st9-net/ (Corefile, kube-proxy.json, netpol.json; mốc zone). In dạng
# KHOÁ=giá-trị. Chỉ đọc, trừ namespace tạm lab-verify-s47-… (hai Pod busybox, xoá khi xong, spec 8.4); mỗi lệnh có timeout.
#   COREDNS  Corefile trong ConfigMap kube-system/coredns giống bản tốt (so từng dòng, bỏ khoảng trắng cuối dòng); Deployment
#            coredns đủ replica sẵn sàng.
#   PROXY    DaemonSet kube-proxy: template (bỏ annotation restartedAt của `rollout restart`) và updateStrategy giống bản tốt;
#            ba Pod, mỗi node một, Ready và đúng revision hiện tại (updatedNumberScheduled = numberReady = 3).
#   PROBE    từ một Pod busybox:1.37 trên MỖI worker (namespace tạm, nodeName ghim): nslookup catalog.shop.svc.cluster.local
#            ra đúng ClusterIP của Service catalog, và wget ClusterIP của Service gateway :8080/api/info trả JSON của gateway
#            (gateway là Service duy nhất của shop nhận 8080 từ mọi nguồn; catalog chỉ nhận từ Pod của shop: s31).
#   NETPOL   mọi NetworkPolicy của shop lúc lưu (cuối s46) còn đủ và đúng spec, không thêm policy nào khác ngoài
#            allow-monitoring (để lại hay xoá đều được); từ MỖI Pod order đang Ready, `bash -c '</dev/tcp/catalog/8080'` nối
#            được trong 4 giây (DNS, kube-proxy và policy cùng đúng).
#   ANS      ~/drills/s47/answers.env: DNS_ZONE_FOUND bằng zone sự cố đã ghi; PROXY_NODE cka-w1; BLOCKING_POLICY allow-monitoring;
#            ONE_TEST có nslookup hay dig và một ClusterIP hay tên Service đang có trong cluster.
#   RUNBOOK  ~/notes/runbook.md có heading chứa `s47` với ≥ 3 dòng không rỗng (tới heading cùng cấp hay cao hơn).
# FAST=1 (dòng đầu của lệnh gửi, check.sh của s48): chỉ ANS và RUNBOOK, không tạo Pod tạm, không exec (sự cố st9-node làm
# hai worker NotReady: Pod tạm ghim node sẽ treo ở đó và làm rối `k get pod -A` của bạn).
python3 - "$HOME" "${FAST:-0}" <<'PY'
import copy, json, re, secrets, subprocess, sys, time
home = sys.argv[1]
LAB = "/root/.lab/st9-net"
def run(*args, timeout=20):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a, timeout=20): return run("kubectl", "--request-timeout=10s", *a, timeout=timeout)
def kj(*a):
    rc, out, _ = k(*a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def saved(name):
    rc, out, _ = run("sudo", "cat", f"{LAB}/{name}")
    return out if rc == 0 and out else None
def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def strip_ann(t):
    t = copy.deepcopy(t or {})
    (t.get("metadata") or {}).get("annotations", {}).pop("kubectl.kubernetes.io/restartedAt", None)
    if not (t.get("metadata") or {}).get("annotations"): (t.get("metadata") or {}).pop("annotations", None)
    return t
NOMARK = "chưa có bản tốt của sự cố (chạy begin)"

# 5. ANS
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s47/answers.env", encoding="utf-8"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
zone = (saved("zone") or "").strip()
if ans is None: bad.append("chưa có ~/drills/s47/answers.env")
else:
    z = (ans.get("DNS_ZONE_FOUND") or "").strip().lower().rstrip(".")
    if not zone: bad.append(NOMARK)
    elif z != zone: bad.append(f"DNS_ZONE_FOUND={ans.get('DNS_ZONE_FOUND')} chưa đúng")
    if (ans.get("PROXY_NODE") or "").strip().lower() not in ("cka-w1", "node/cka-w1"): bad.append(f"PROXY_NODE={ans.get('PROXY_NODE')} chưa đúng")
    b = re.sub(r"^(networkpolic(y|ies)(\.networking\.k8s\.io)?/|netpol/|shop/)", "", (ans.get("BLOCKING_POLICY") or "").strip().lower())
    if b != "allow-monitoring": bad.append(f"BLOCKING_POLICY={ans.get('BLOCKING_POLICY')} chưa đúng")
    t = ans.get("ONE_TEST") or ""
    ips = {s["spec"].get("clusterIP") for s in (kj("get", "svc", "-A") or {}).get("items", [])} - {None, "None", ""}
    names = {s["metadata"]["name"] for s in (kj("get", "svc", "-A") or {}).get("items", [])}
    if not re.search(r"\b(nslookup|dig)\b", t): bad.append("ONE_TEST chưa có nslookup/dig")
    elif not (any(ip in t for ip in ips) or any(re.search(rf"\b{re.escape(n)}(\.|\b)", t) for n in names)):
        bad.append("ONE_TEST chưa nêu ClusterIP hay tên Service")
say("ANS", bad)

# 6. RUNBOOK
bad = []
try: text = open(f"{home}/notes/runbook.md", encoding="utf-8").read()
except Exception: text = None
if text is None: bad.append("chưa có ~/notes/runbook.md")
else:
    best, cur = 0, None
    for l in text.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*)", l)
        if m:
            if cur and len(m.group(1)) <= cur[0]: best = max(best, cur[1]); cur = None
            if cur is None and re.search(r"s47", m.group(2), re.I): cur = [len(m.group(1)), 0]
        elif cur and l.strip(): cur[1] += 1
    if cur: best = max(best, cur[1])
    if best < 3: bad.append("runbook.md chưa có mục s47 ≥ 3 dòng")
say("RUNBOOK", bad)
if sys.argv[2:3] == ["1"]: sys.exit(0)   # FAST=1: chỉ hai dòng tệp (check.sh của s48: node có thể đang NotReady)

# 1. COREDNS
bad = []
good = saved("Corefile")
cm = kj("-n", "kube-system", "get", "cm", "coredns")
norm = lambda s: [l.rstrip() for l in (s or "").strip().splitlines()]
if good is None: bad.append(NOMARK)
elif cm is None: bad.append("không đọc được ConfigMap coredns")
elif norm(cm["data"].get("Corefile")) != norm(good):
    z = re.search(r"^\s*kubernetes (\S+)", cm["data"].get("Corefile", ""), re.M)
    bad.append("Corefile khác bản tốt" + (f" (zone {z.group(1)})" if z else ""))
d = kj("-n", "kube-system", "get", "deploy", "coredns")
if d is None or (d.get("status") or {}).get("availableReplicas", 0) < d["spec"].get("replicas", 1): bad.append("CoreDNS chưa đủ replica sẵn sàng")
say("COREDNS", bad)

# 2. PROXY
bad = []
g = saved("kube-proxy.json")
ds = kj("-n", "kube-system", "get", "ds", "kube-proxy")
if g is None: bad.append(NOMARK)
elif ds is None: bad.append("không đọc được DaemonSet kube-proxy")
else:
    g = json.loads(g)
    if ds["spec"]["updateStrategy"] != g["updateStrategy"]: bad.append(f"updateStrategy {ds['spec']['updateStrategy'].get('type')} khác bản tốt")
    if strip_ann(ds["spec"]["template"]) != strip_ann(g["template"]):
        cms = [v.get("configMap", {}).get("name") for v in ds["spec"]["template"]["spec"].get("volumes") or [] if v.get("configMap")]
        bad.append("template khác bản tốt (ConfigMap " + ",".join(cms) + ")")
    st = ds.get("status") or {}
    if not (st.get("desiredNumberScheduled") == st.get("updatedNumberScheduled") == st.get("numberReady") == 3):
        bad.append(f"Pod: {st.get('numberReady', 0)}/3 Ready, {st.get('updatedNumberScheduled', 0)}/3 đúng revision")
    for p in (kj("-n", "kube-system", "get", "pod", "-l", "k8s-app=kube-proxy") or {}).get("items", []):
        if not ready(p): bad.append(f"kube-proxy trên {p['spec'].get('nodeName', '?')} chưa Ready")
say("PROXY", bad)

# 3. PROBE: namespace tạm, hai Pod busybox ghim node.
bad = []
svc = {s["metadata"]["name"]: s["spec"].get("clusterIP") for s in (kj("-n", "shop", "get", "svc") or {}).get("items", [])}
cat_ip, gw_ip = svc.get("catalog"), svc.get("gateway")
ns = f"lab-verify-s47-{secrets.token_hex(3)}"
if not cat_ip or not gw_ip: bad.append("không đọc được ClusterIP của catalog/gateway")
elif k("create", "ns", ns)[0] != 0: bad.append("không tạo được namespace tạm")
else:
    try:
        for n in ("cka-w1", "cka-w2"):
            pod = {"apiVersion": "v1", "kind": "Pod", "metadata": {"name": f"probe-{n}", "namespace": ns},
                   "spec": {"nodeName": n, "restartPolicy": "Never", "terminationGracePeriodSeconds": 0,
                            "containers": [{"name": "t", "image": "busybox:1.37", "command": ["sleep", "120"],
                                            "resources": {"requests": {"cpu": "10m", "memory": "16Mi"}, "limits": {"memory": "32Mi"}}}]}}
            subprocess.run(["kubectl", "--request-timeout=10s", "create", "-f", "-"], input=json.dumps(pod).encode(), capture_output=True, timeout=20)
        k("-n", ns, "wait", "pod", "--all", "--for=condition=Ready", "--timeout=60s", timeout=75)
        up = {p["metadata"]["name"] for p in (kj("-n", ns, "get", "pod") or {}).get("items", []) if ready(p)}
        for n in ("cka-w1", "cka-w2"):
            s = n.replace("cka-", "")
            if f"probe-{n}" not in up: bad.append(f"Pod tạm trên {s} không chạy trong 60 giây"); continue
            rc, out, err = k("-n", ns, "exec", f"probe-{n}", "--", "nslookup", "catalog.shop.svc.cluster.local", timeout=25)
            if cat_ip not in re.findall(r"Address:\s*([0-9.]+)\s*$", out, re.M): bad.append(f"{s}: nslookup catalog.shop " + ("NXDOMAIN" if "NXDOMAIN" in out else "lỗi"))
            rc, out, err = k("-n", ns, "exec", f"probe-{n}", "--", "wget", "-qO-", "-T", "3", f"http://{gw_ip}:8080/api/info", timeout=25)
            if '"service":"gateway"' not in out: bad.append(f"{s}: ClusterIP gateway không tới được")
    finally:
        k("delete", "ns", ns, "--wait=false")
say("PROBE", bad)

# 4. NETPOL
bad = []
g = saved("netpol.json")
nps = (kj("-n", "shop", "get", "netpol") or {}).get("items")
if g is None: bad.append(NOMARK)
elif nps is None: bad.append("không đọc được NetworkPolicy của shop")
else:
    g = json.loads(g)
    live = {n["metadata"]["name"]: n["spec"] for n in nps}
    miss = [n for n in sorted(g) if n not in live]
    diff = [n for n in sorted(g) if n in live and live[n] != g[n]]
    extra = [n for n in sorted(live) if n not in g and n != "allow-monitoring"]
    if miss: bad.append("thiếu NetworkPolicy " + ",".join(miss))
    if diff: bad.append("spec khác cuối s46: " + ",".join(diff))
    if extra: bad.append("thừa NetworkPolicy " + ",".join(extra))
    pods = [p for p in (kj("-n", "shop", "get", "pod", "-l", "app=order") or {}).get("items", []) if ready(p) and not p["metadata"].get("deletionTimestamp")]
    if not pods: bad.append("không có Pod order Ready")
    for p in pods:
        rc, _, _ = k("-n", "shop", "exec", p["metadata"]["name"], "-c", "order", "--", "bash", "-c", "timeout 4 bash -c '</dev/tcp/catalog/8080'", timeout=20)
        if rc != 0: bad.append(f"order trên {p['spec'].get('nodeName', '?').replace('cka-', '')} không nối được catalog:8080")
say("NETPOL", bad)

PY
