# s44 — dữ kiện của verify s44 trên cka-cp (user ubuntu, sudo không hỏi mật khẩu): mốc ~/drills/s44/started; mười một chứng
# chỉ kubeadm (notBefore so với mốc); cert mà kube-apiserver (:6443) và etcd (:2379) đang phục vụ so với tệp trên đĩa; lúc
# container control plane khởi động so với lúc gia hạn; ~/.kube/config so với admin.conf; kubeconfig dev/ops của s34; node,
# cert-manager, shop; ~/drills/s44/ha.txt, answers.env. In dạng KHOÁ=giá-trị. Chỉ đọc (một Certificate tạo thử bằng
# --dry-run=server, không lưu); mỗi lệnh có timeout. Lab in tối đa 80 ký tự đầu của lý do đỏ, nên lý do viết ngắn.
python3 - "$HOME" <<'PY'
import calendar, json, os, re, subprocess, sys, time
import yaml
home = sys.argv[1]
K = "/etc/kubernetes"
# kubeadm lùi notBefore 5 phút so với lúc ký (đo trên 1.37.2: notBefore = lúc ký − 300 giây, notAfter = lúc ký + 1 năm), nên
# "gia hạn sau mốc" là notBefore + 300 ≥ mốc (chừa 1 giây vì cả hai làm tròn tới giây).
BACKDATE = 300
CERTS = [("apiserver", f"{K}/pki/apiserver.crt"), ("apiserver-kubelet-client", f"{K}/pki/apiserver-kubelet-client.crt"),
         ("apiserver-etcd-client", f"{K}/pki/apiserver-etcd-client.crt"), ("front-proxy-client", f"{K}/pki/front-proxy-client.crt"),
         ("etcd-server", f"{K}/pki/etcd/server.crt"), ("etcd-peer", f"{K}/pki/etcd/peer.crt"),
         ("etcd-healthcheck-client", f"{K}/pki/etcd/healthcheck-client.crt"),
         ("admin.conf", f"{K}/admin.conf"), ("super-admin.conf", f"{K}/super-admin.conf"),
         ("controller-manager.conf", f"{K}/controller-manager.conf"), ("scheduler.conf", f"{K}/scheduler.conf")]

def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a):
    rc, out, _ = run("kubectl", "--request-timeout=10s", *a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])
def available(d):
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return st.get("availableReplicas", 0) >= want and st.get("updatedReplicas", 0) >= want
def x509(pem):
    """(notBefore epoch, sha256 fingerprint) của một cert PEM; None nếu không đọc được."""
    rc, out, _ = run("openssl", "x509", "-noout", "-startdate", "-fingerprint", "-sha256", inp=pem.encode())
    m = re.search(r"notBefore=(.+)", out); f = re.search(r"Fingerprint=([0-9A-F:]+)", out)
    if rc != 0 or not m or not f: return None
    return calendar.timegm(time.strptime(m.group(1).strip(), "%b %d %H:%M:%S %Y %Z")), f.group(1)
def conf_cert(path):
    """PEM của client cert trong một kubeconfig (client-certificate-data, base64)."""
    import base64
    rc, out, _ = run("sudo", "cat", path) if path.startswith(K) else (0, open(path).read(), "")
    try:
        u = yaml.safe_load(out)["users"][0]["user"]
        return base64.b64decode(u["client-certificate-data"]).decode()
    except Exception: return None
def pem_of(path):
    if path.endswith(".conf"): return conf_cert(path)
    rc, out, _ = run("sudo", "cat", path)
    return out if rc == 0 else None
def mtime(path):
    rc, out, _ = run("sudo", "stat", "-c", "%Y", path)
    return int(out) if rc == 0 and out.strip().isdigit() else None

try: started = int(open(f"{home}/drills/s44/started").read().split()[0])
except Exception: started = None

# 1. CERTS: mọi chứng chỉ kubeadm ký lại sau mốc started (notBefore + 300 ≥ mốc).
bad = []
info = {}
if started is None: bad.append("chưa có ~/drills/s44/started (chạy begin)")
old = []
for name, path in CERTS:
    pem = pem_of(path)
    x = x509(pem) if pem else None
    if x is None: bad.append(f"không đọc được {name}"); continue
    info[name] = x
    if started is not None and x[0] + BACKDATE + 1 < started: old.append(name.replace("apiserver-", "as-").replace(".conf", ""))
if old: bad.append(f"{len(old)}/{len(CERTS)} chưa gia hạn: " + ",".join(old))
say("CERTS", bad)

# 2. SERVED: kube-apiserver và etcd đang phục vụ đúng cert trên đĩa (openssl s_client); bốn container control plane khởi động
# SAU mốc và sau lần ghi tệp cert/kubeconfig của chính nó (gia hạn mà không khởi động lại: đỏ); /readyz; ba node Ready;
# cert-manager (ba Deployment, Certificate shop-local, webhook nhận dry-run); gateway/catalog/order Available.
bad = []
if started is None: bad.append("chưa có mốc started")
def served(port, extra=()):
    rc, out, _ = run("sh", "-c", f"openssl s_client -connect 127.0.0.1:{port} {' '.join(extra)} </dev/null 2>/dev/null | openssl x509 -noout -fingerprint -sha256", timeout=20)
    f = re.search(r"Fingerprint=([0-9A-F:]+)", out)
    return f.group(1) if f else None
pk = f"{K}/pki/etcd"
for label, port, name, extra in (("apiserver", 6443, "apiserver", ()),
                                 ("etcd", 2379, "etcd-server", ("-cert", f"{pk}/healthcheck-client.crt", "-key", f"{pk}/healthcheck-client.key", "-CAfile", f"{pk}/ca.crt"))):
    if extra:  # khoá của healthcheck-client chỉ root đọc được: chạy openssl bằng sudo
        rc, out, _ = run("sudo", "sh", "-c", f"openssl s_client -connect 127.0.0.1:{port} {' '.join(extra)} </dev/null 2>/dev/null | openssl x509 -noout -fingerprint -sha256", timeout=20)
        m = re.search(r"Fingerprint=([0-9A-F:]+)", out); fp = m.group(1) if m else None
    else: fp = served(port)
    if fp is None: bad.append(f"{label} :{port} không trả cert")
    elif name in info and fp != info[name][1]: bad.append(f"{label} phục vụ cert cũ")
for comp, files in (("kube-apiserver", [f"{K}/pki/apiserver.crt", f"{K}/pki/apiserver-kubelet-client.crt", f"{K}/pki/apiserver-etcd-client.crt", f"{K}/pki/front-proxy-client.crt"]),
                    ("kube-controller-manager", [f"{K}/controller-manager.conf"]), ("kube-scheduler", [f"{K}/scheduler.conf"]),
                    ("etcd", [f"{pk}/server.crt", f"{pk}/peer.crt"])):
    rc, out, _ = run("sudo", "crictl", "ps", "--name", f"^{comp}$", "--state", "running", "-q")
    cid = out.split()[0] if out.split() else None
    short = comp.replace("kube-", "")
    if not cid: bad.append(f"{short} không chạy"); continue
    rc, out, _ = run("sudo", "crictl", "inspect", cid)
    try:
        # startedAt có múi giờ của node (đo: 2026-11-20T05:52:42.823873335+07:00) hay Z: bỏ phần lẻ của giây, giữ offset.
        import datetime
        s = re.sub(r"\.\d+", "", json.loads(out)["status"]["startedAt"]).replace("Z", "+00:00")
        t = int(datetime.datetime.fromisoformat(s).timestamp())
    except Exception: bad.append(f"không đọc được giờ chạy {short}"); continue
    need = max([m for m in map(mtime, files) if m] + [started or 0])
    if t < need: bad.append(f"{short} chưa khởi động lại")
rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "--raw", "/readyz")
if out.strip() != "ok": bad.append("/readyz chưa ok")
nodes = (kj("get", "node") or {}).get("items")
if nodes is None: bad.append("không đọc được node")
else:
    nr = [n["metadata"]["name"].replace("cka-", "") for n in nodes if not ready(n)]
    if nr: bad.append("node chưa Ready: " + ",".join(nr))
for n in ("cert-manager", "cert-manager-webhook", "cert-manager-cainjector"):
    d = kj("-n", "cert-manager", "get", "deploy", n)
    if d is None or not available(d): bad.append(f"{n.replace('cert-manager-', 'cm-')} chưa sẵn sàng")
c = kj("-n", "shop", "get", "certificate", "shop-local")
if c is None or not ready(c): bad.append("shop-local chưa Ready")
probe = """apiVersion: cert-manager.io/v1
kind: Certificate
metadata: {name: s44-probe, namespace: shop}
spec: {secretName: s44-probe-tls, dnsNames: [probe.shop.local], issuerRef: {name: selfsigned, kind: Issuer}}
"""
rc, out, err = run("kubectl", "--request-timeout=15s", "create", "--dry-run=server", "-f", "-", inp=probe.encode())
if rc != 0: bad.append("webhook cert-manager từ chối")
for n in ("gateway", "catalog", "order"):
    d = kj("-n", "shop", "get", "deploy", n)
    if d is None or not available(d): bad.append(f"{n} chưa Available")
say("SERVED", bad)
ips = {n["metadata"]["name"]: next((a["address"] for a in n["status"]["addresses"] if a["type"] == "InternalIP"), "") for n in nodes or []}
dp = [p for p in (kj("-n", "shop", "get", "pod", "-l", "gateway.networking.k8s.io/gateway-name=shop-gw") or {}).get("items", [])
      if (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")]
print("W1_IP=" + ips.get("cka-w1", ""))
print("DP_IP=" + (ips.get(dp[0]["spec"].get("nodeName"), "") if dp else ""))

# 3. KUBECONFIG: ~/.kube/config mang đúng client cert của admin.conf mới (đã gia hạn sau mốc), gọi được API là
# kubernetes-admin; dev/ops.kubeconfig của s34 (CA không đổi khi gia hạn) vẫn gọi được API đúng danh tính.
bad = []
mine, adm = conf_cert(f"{home}/.kube/config"), conf_cert(f"{K}/admin.conf")
if mine is None: bad.append("~/.kube/config không có client cert")
elif adm is None: bad.append("không đọc được admin.conf")
elif x509(mine) != x509(adm): bad.append("~/.kube/config khác admin.conf")
elif "admin.conf" in info and started is not None and info["admin.conf"][0] + BACKDATE + 1 < started: bad.append("admin.conf chưa gia hạn")
rc, out, err = run("kubectl", "--request-timeout=10s", "auth", "whoami", "-o", "jsonpath={.status.userInfo.username}")
if out.strip() != "kubernetes-admin": bad.append("~/.kube/config: " + (out.strip() or (err.strip().splitlines() or [""])[-1])[:40])
for u in ("dev", "ops"):
    p = f"{home}/{u}.kubeconfig"
    rc, out, err = run("kubectl", "--kubeconfig", p, "--request-timeout=10s", "auth", "whoami", "-o", "jsonpath={.status.userInfo.username}")
    if out.strip() != u: bad.append(f"{u}.kubeconfig: " + (out.strip() or (err.strip().splitlines() or ["lỗi"])[-1])[:40])
say("KUBECONFIG", bad)

# 4. HA: ~/drills/s44/ha.txt có lệnh kubeadm init và kubeadm join cho control plane thứ hai với đủ cờ.
bad = []
try: ha = open(f"{home}/drills/s44/ha.txt").read()
except Exception: ha = None
if ha is None: bad.append("chưa có ~/drills/s44/ha.txt")
else:
    init = [l for l in re.sub(r"\\\n", " ", ha).splitlines() if re.search(r"\bkubeadm\s+init\b", l)]
    join = [l for l in re.sub(r"\\\n", " ", ha).splitlines() if re.search(r"\bkubeadm\s+join\b", l)]
    if not init: bad.append("chưa có kubeadm init")
    elif not any("--control-plane-endpoint" in l and "--upload-certs" in l for l in init): bad.append("init thiếu --control-plane-endpoint/--upload-certs")
    if not join: bad.append("chưa có kubeadm join")
    elif not any(re.search(r"--control-plane(\s|$)", l) and "--certificate-key" in l for l in join): bad.append("join thiếu --control-plane/--certificate-key")
say("HA", bad)

# 5. ANS: QUORUM_5 = số member phải còn sống để cụm etcd 5 member có quorum (⌊5/2⌋ + 1 = 3).
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s44/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
if ans is None: bad.append("chưa có ~/drills/s44/answers.env")
elif ans.get("QUORUM_5") is None: bad.append("answers.env chưa có QUORUM_5")
elif ans.get("QUORUM_5") != "3": bad.append(f"QUORUM_5={ans.get('QUORUM_5')} chưa đúng")
say("ANS", bad)
PY
