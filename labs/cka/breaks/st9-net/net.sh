# st9-net trên cka-cp (user ubuntu, sudo; kubectl, dig, python3). Gọi bởi run.sh cùng thư mục; chú thích ở đó.
# Không in gì khi thành công; lỗi đầu vào thì in một dòng `lab: …` ra stderr và trả 1 trước khi gây gì.
set -e
end=$(($(date +%s) + 180))
until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; do
  [ "$(date +%s)" -lt "$end" ] || { echo "lab: apiserver chưa sẵn sàng sau 3 phút" >&2; exit 1; }
  sleep 2
done
sudo install -d -m 700 /root/.lab/st9-net
python3 - <<'PY'
import copy, json, re, secrets, subprocess, sys, time
LAB = "/root/.lab/st9-net"
S31 = ("default-deny", "allow-dns-egress", "gateway", "catalog", "order", "postgres", "shop-gw-data-plane", "jobs")
FQDN = "catalog.shop.svc.cluster.local"

def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a, timeout=20, inp=None): return run("kubectl", "--request-timeout=10s", *a, timeout=timeout, inp=inp)
def kj(*a):
    rc, out, _ = k(*a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def die(msg): sys.stderr.write(f"lab: {msg}\n"); sys.exit(1)
def must(rc_out_err, what):
    rc, _, err = rc_out_err
    if rc != 0: die(f"{what}: {err.strip()[:100]}")
def saved(name):
    rc, out, _ = run("sudo", "cat", f"{LAB}/{name}")
    return out if rc == 0 and out else None
def put(name, text):
    rc, _, err = run("sudo", "tee", f"{LAB}/{name}", inp=text.encode())
    if rc != 0: die(f"không ghi được {LAB}/{name}: {err.strip()[:80]}")
def until(sec, fn):
    end = time.time() + sec
    while True:
        if fn(): return True
        if time.time() > end: return False
        time.sleep(3)
def rollout(kind, name, ns, sec=300):
    return run("kubectl", "-n", ns, "rollout", "status", f"{kind}/{name}", f"--timeout={sec}s", timeout=sec + 30)[0] == 0
def strip_ann(t):
    t = copy.deepcopy(t)
    (t.get("metadata") or {}).get("annotations", {}).pop("kubectl.kubernetes.io/restartedAt", None)
    if not (t.get("metadata") or {}).get("annotations"): (t.get("metadata") or {}).pop("annotations", None)
    return t

# 0. Trạng thái hiện tại và bản tốt (lưu lần đầu, chỉ khi trạng thái hiện tại là trạng thái tốt).
cm = kj("-n", "kube-system", "get", "cm", "coredns")
ds = kj("-n", "kube-system", "get", "ds", "kube-proxy")
nps = (kj("-n", "shop", "get", "netpol") or {}).get("items")
if cm is None or ds is None or nps is None: die("không đọc được ConfigMap coredns, DaemonSet kube-proxy hay NetworkPolicy của shop")
core = cm["data"]["Corefile"]
good_core = saved("Corefile")
if good_core is None:
    if not re.search(r"^\s*kubernetes cluster\.local ", core, re.M): die("Corefile chưa ở trạng thái tốt (zone cluster.local) và chưa có bản lưu; thử: ./labs/lab restore cka s45")
    put("Corefile", core); good_core = core
good_ds = saved("kube-proxy.json")
if good_ds is None:
    vols = {v["name"]: v for v in ds["spec"]["template"]["spec"].get("volumes") or []}
    if ds["spec"]["updateStrategy"].get("type") != "RollingUpdate" or (vols.get("kube-proxy") or {}).get("configMap", {}).get("name") != "kube-proxy":
        die("DaemonSet kube-proxy chưa ở trạng thái tốt và chưa có bản lưu; thử: ./labs/lab restore cka s45")
    good_ds = json.dumps({"template": ds["spec"]["template"], "updateStrategy": ds["spec"]["updateStrategy"]}, indent=1)
    put("kube-proxy.json", good_ds)
good_ds = json.loads(good_ds)
good_np = saved("netpol.json")
if good_np is None:
    by = {n["metadata"]["name"]: n["spec"] for n in nps}
    o = by.get("order") or {}
    if set(S31) - set(by) or not any(p.get("podSelector", {}).get("matchLabels", {}).get("app") == "catalog"
                                     for r in o.get("egress") or [] for p in r.get("to") or []):
        die("NetworkPolicy của shop chưa như cuối s31 (thiếu policy hay order không có egress tới catalog); thử: ./labs/lab restore cka s45")
    good_np = json.dumps({n: s for n, s in by.items() if n != "allow-monitoring"}, indent=1, sort_keys=True)
    put("netpol.json", good_np)
good_np = json.loads(good_np)

# 1. Về bản tốt.
if core != good_core:
    must(k("-n", "kube-system", "patch", "cm", "coredns", "--type=merge", "-p", json.dumps({"data": {"Corefile": good_core}})), "không trả Corefile")
if strip_ann(ds["spec"]["template"]) != strip_ann(good_ds["template"]) or ds["spec"]["updateStrategy"] != good_ds["updateStrategy"]:
    must(k("-n", "kube-system", "patch", "ds", "kube-proxy", "--type=json", "-p", json.dumps([
        {"op": "replace", "path": "/spec/template", "value": good_ds["template"]},
        {"op": "replace", "path": "/spec/updateStrategy", "value": good_ds["updateStrategy"]}])), "không trả DaemonSet kube-proxy")
k("-n", "kube-system", "delete", "cm", "kube-proxy-next", "--ignore-not-found")
live = {n["metadata"]["name"]: n for n in nps}
for name, spec in good_np.items():
    if name not in live:
        obj = {"apiVersion": "networking.k8s.io/v1", "kind": "NetworkPolicy", "metadata": {"name": name, "namespace": "shop"}, "spec": spec}
        must(k("create", "-f", "-", inp=json.dumps(obj).encode()), f"không tạo lại NetworkPolicy {name}")
    elif live[name]["spec"] != spec:
        must(k("-n", "shop", "patch", "netpol", name, "--type=json", "-p", json.dumps([{"op": "replace", "path": "/spec", "value": spec}])), f"không trả NetworkPolicy {name}")
k("-n", "shop", "delete", "netpol", "allow-monitoring", "--ignore-not-found")
if not rollout("ds", "kube-proxy", "kube-system", 240): die("kube-proxy chưa về bản tốt sau 4 phút")
def dns_pods():
    return [p["status"].get("podIP") for p in (kj("-n", "kube-system", "get", "pod", "-l", "k8s-app=kube-dns") or {}).get("items", [])
            if p["status"].get("podIP") and not p["metadata"].get("deletionTimestamp")]
def answer(ip):
    rc, out, _ = run("dig", "+time=2", "+tries=1", f"@{ip}", FQDN, timeout=10)
    m = re.search(r"status: (\w+)", out)
    return m.group(1) if m else "?"
if not until(180, lambda: dns_pods() and all(answer(ip) == "NOERROR" for ip in dns_pods())): die("CoreDNS chưa trả lời catalog.shop sau 3 phút")
for d in ("gateway", "catalog", "order"):
    if not rollout("deploy", d, "shop", 300): die(f"shop chưa sẵn sàng (rollout {d})")

# 2a. kube-proxy của cka-w1: ConfigMap riêng (mode gõ sai), OnDelete, xoá Pod của cka-w1.
kp = kj("-n", "kube-system", "get", "cm", "kube-proxy")
conf = kp["data"]["config.conf"]
bad_conf, n = re.subn(r"(?m)^mode: .*$", "mode: iptable", conf)
if n != 1: die("không thấy dòng mode trong ConfigMap kube-proxy")
must(k("create", "-f", "-", inp=json.dumps({"apiVersion": "v1", "kind": "ConfigMap",
     "metadata": {"name": "kube-proxy-next", "namespace": "kube-system"},
     "data": {**kp["data"], "config.conf": bad_conf}}).encode()), "không tạo kube-proxy-next")
vols = good_ds["template"]["spec"]["volumes"]
i = next(j for j, v in enumerate(vols) if v["name"] == "kube-proxy")
must(k("-n", "kube-system", "patch", "ds", "kube-proxy", "--type=json", "-p", json.dumps([
    {"op": "replace", "path": "/spec/updateStrategy", "value": {"type": "OnDelete"}},
    {"op": "replace", "path": f"/spec/template/spec/volumes/{i}/configMap/name", "value": "kube-proxy-next"}])), "không sửa DaemonSet kube-proxy")
def w1_pod():
    return next((p for p in (kj("-n", "kube-system", "get", "pod", "-l", "k8s-app=kube-proxy", "--field-selector", "spec.nodeName=cka-w1") or {}).get("items", [])
                 if not p["metadata"].get("deletionTimestamp")), None)
old = w1_pod()
if old: must(k("-n", "kube-system", "delete", "pod", old["metadata"]["name"], "--wait=true", timeout=90), "không xoá Pod kube-proxy của cka-w1")
def w1_broken():
    p = w1_pod()
    if not p or (old and p["metadata"]["name"] == old["metadata"]["name"]): return False
    cs = (p["status"].get("containerStatuses") or [{}])[0]
    return cs.get("restartCount", 0) >= 1 or ((cs.get("state") or {}).get("waiting") or {}).get("reason") == "CrashLoopBackOff"
until(90, w1_broken)

# 2b. Endpoint đổi sau khi kube-proxy của cka-w1 đã dừng: gateway trước (init container của nó gọi catalog), rồi catalog.
for d in ("gateway", "catalog"):
    must(k("-n", "shop", "rollout", "restart", f"deploy/{d}"), f"không restart {d}")
    if not rollout("deploy", d, "shop", 360): die(f"rollout restart {d} chưa xong sau 6 phút")

# 2c. Corefile: zone sai, chờ cả hai Pod CoreDNS nạp lại.
zone = f"cluster-{secrets.token_hex(2)}.internal"
bad_core, n = re.subn(r"(?m)^(\s*kubernetes) cluster\.local ", rf"\1 {zone} ", good_core)
if n != 1: die("không thấy dòng kubernetes cluster.local trong Corefile")
put("zone", zone + "\n")
must(k("-n", "kube-system", "patch", "cm", "coredns", "--type=merge", "-p", json.dumps({"data": {"Corefile": bad_core}})), "không sửa Corefile")
until(150, lambda: dns_pods() and all(answer(ip) == "NXDOMAIN" for ip in dns_pods()))

# 2d. "Gộp" policy order vào allow-monitoring, quên egress tới catalog.
o = good_np["order"]
am = {"apiVersion": "networking.k8s.io/v1", "kind": "NetworkPolicy",
      "metadata": {"name": "allow-monitoring", "namespace": "shop"},
      "spec": {"podSelector": {"matchLabels": {"app": "order"}}, "policyTypes": ["Ingress", "Egress"],
               "ingress": list(o.get("ingress") or []) + [{"from": [{"namespaceSelector": {"matchLabels": {"kubernetes.io/metadata.name": "monitoring"}}}],
                                                         "ports": [{"protocol": "TCP", "port": 8080}]}],
               "egress": [r for r in o.get("egress") or [] if any(p.get("podSelector", {}).get("matchLabels", {}).get("app") == "postgres" for p in r.get("to") or [])]}}
must(k("create", "-f", "-", inp=json.dumps(am).encode()), "không tạo allow-monitoring")
must(k("-n", "shop", "delete", "netpol", "order"), "không xoá policy order")
PY
