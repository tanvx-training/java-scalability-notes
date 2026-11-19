# s34 — đọc ~/dev.kubeconfig, ~/ops.kubeconfig (PyYAML + openssl), gọi API bằng chính hai tệp đó (auth whoami, get pods),
# đọc danh tính của ~/.kube/config và ~/drills/s34/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu
# (kubectl + openssl + python3; server so với /etc/kubernetes/admin.conf đọc bằng sudo). Chỉ đọc; mỗi lệnh kubectl có --request-timeout 10 giây.
python3 - "$HOME" <<'PY'
import base64, json, os, re, stat, subprocess, sys, tempfile
import yaml
home = sys.argv[1]
CA = "/etc/kubernetes/pki/ca.crt"
ROLES = (("dev", "shop-dev", "shop"), ("ops", "shop-ops", "default"))

def run(*args, data=None, timeout=20):
    try:
        p = subprocess.run(args, input=data, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)

def pem_body(b):
    m = re.search(rb"-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----", b or b"", re.S)
    return re.sub(rb"\s", b"", m.group(1)) if m else None

def admin_server():
    # Server trong /etc/kubernetes/admin.conf (đọc bằng sudo): kubeadm ghi đúng một cluster, https://<advertise>:6443. Không đọc
    # ~/.kube/config, để một tệp admin hỏng chỉ làm đỏ dòng AUTH chứ không làm đỏ cả hai dòng kubeconfig.
    rc, out, _ = run("sudo", "-n", "cat", "/etc/kubernetes/admin.conf")
    try: cl = (yaml.safe_load(out) or {}).get("clusters") or [] if rc == 0 else []
    except Exception: cl = []
    if not cl: return None
    return ((cl[0].get("cluster") or {}).get("server") or "").rstrip("/") or None

SERVER = admin_server()
ca_body = pem_body(open(CA, "rb").read())

def check_file(u, g, ns):
    p = f"{home}/{u}.kubeconfig"
    if not os.path.isfile(p): return f"chưa có ~/{u}.kubeconfig"
    st = os.stat(p)
    bad = []
    if stat.S_IMODE(st.st_mode) != 0o600: bad.append(f"quyền {oct(stat.S_IMODE(st.st_mode))[2:]}")
    if st.st_uid != os.getuid(): bad.append("chủ không phải ubuntu")
    try: cfg = yaml.safe_load(open(p)) or {}
    except Exception: return f"~/{u}.kubeconfig không phải YAML"
    cl, us, cx = cfg.get("clusters") or [], cfg.get("users") or [], cfg.get("contexts") or []
    if (len(cl), len(us), len(cx)) != (1, 1, 1): return f"{u}: {len(cl)} cluster/{len(us)} user/{len(cx)} context (cần 1/1/1)"
    c, usr, ctx = cl[0].get("cluster") or {}, us[0].get("user") or {}, cx[0].get("context") or {}
    if cfg.get("current-context") != cx[0].get("name"): bad.append("current-context chưa trỏ context duy nhất")
    if ctx.get("cluster") != cl[0].get("name") or ctx.get("user") != us[0].get("name"): bad.append("context không trỏ cluster/user trong tệp")
    if SERVER is None: bad.append("không đọc được server trong /etc/kubernetes/admin.conf")
    elif (c.get("server") or "").rstrip("/") != SERVER: bad.append(f"server {c.get('server')}")
    if c.get("insecure-skip-tls-verify"): bad.append("insecure-skip-tls-verify")
    if c.get("certificate-authority") or usr.get("client-certificate") or usr.get("client-key"): bad.append("còn đường dẫn tệp (chưa --embed-certs)")
    try: ca_ok = pem_body(base64.b64decode(c.get("certificate-authority-data") or "")) == ca_body
    except Exception: ca_ok = False
    if not ca_ok: bad.append("certificate-authority-data không phải CA cluster")
    extra = [k for k in usr if k not in ("client-certificate-data", "client-key-data")]
    if extra: bad.append("user có thêm " + ",".join(extra)[:30])
    try:
        crt = base64.b64decode(usr.get("client-certificate-data") or "")
        key = base64.b64decode(usr.get("client-key-data") or "")
    except Exception: crt = key = b""
    if not crt or not key: bad.append("thiếu client-certificate-data/client-key-data")
    else:
        with tempfile.NamedTemporaryFile() as f:
            f.write(crt); f.flush()
            rc, _, _ = run("openssl", "verify", "-CAfile", CA, f.name)
            if rc != 0: bad.append("cert nhúng không do CA cluster ký")
            rc, subj, _ = run("openssl", "x509", "-in", f.name, "-noout", "-subject", "-nameopt", "RFC2253")
            parts = sorted(subj.strip()[len("subject="):].split(","))
            if parts != sorted([f"CN={u}", f"O={g}"]): bad.append("cert nhúng " + subj.strip()[8:40])
            rc, pub1, _ = run("openssl", "x509", "-in", f.name, "-noout", "-pubkey")
        rc, pub2, _ = run("openssl", "pkey", "-pubout", data=key)
        if not pub1.strip() or pub1.strip() != pub2.strip(): bad.append("key nhúng không khớp cert")
    if (ctx.get("namespace") or "default") != ns: bad.append(f"namespace {ctx.get('namespace')}")
    return f"~/{u}.kubeconfig: " + ", ".join(bad) if bad else "đạt"

for u, g, ns in ROLES:
    print(f"{u.upper()}=" + check_file(u, g, ns))

# Gọi API bằng chính kubeconfig: whoami ra đúng user/group; `get pods` (chưa có quyền) trả Forbidden có tên user và namespace
# mặc định, không phải Unauthorized. ~/.kube/config vẫn là kubernetes-admin.
bad = []
for u, g, ns in ROLES:
    p = f"{home}/{u}.kubeconfig"
    if not os.path.isfile(p): bad.append(f"chưa có ~/{u}.kubeconfig"); continue
    rc, out, err = run("kubectl", "--kubeconfig", p, "--request-timeout=10s", "auth", "whoami", "-o", "json")
    try:
        ui = json.loads(out)["status"]["userInfo"]
        if ui.get("username") != u or g not in (ui.get("groups") or []): bad.append(f"{u}: whoami ra {ui.get('username')} {ui.get('groups')}"[:60])
    except Exception:
        bad.append(f"{u}: " + ("Unauthorized" if "Unauthorized" in err else (err.strip().splitlines() or ["whoami lỗi"])[-1][:50]))
        continue
    rc, out, err = run("kubectl", "--kubeconfig", p, "--request-timeout=10s", "get", "pods")
    if rc == 0: bad.append(f"{u}: get pods chạy được (đã có quyền?)")
    elif not ("Forbidden" in err and f'User "{u}"' in err and f'namespace "{ns}"' in err):
        bad.append(f"{u}: get pods: " + (err.strip().splitlines() or [""])[-1][:50])
rc, out, err = run("kubectl", "--kubeconfig", f"{home}/.kube/config", "--request-timeout=10s", "auth", "whoami", "-o", "jsonpath={.status.userInfo.username}")
if out.strip() != "kubernetes-admin":
    bad.append(f"~/.kube/config ra '{out.strip()[:20]}', không phải kubernetes-admin" if out.strip()
               else "~/.kube/config không dùng được: " + (err.strip().splitlines() or [""])[-1][:40])
print("AUTH=" + ("; ".join(bad) or "đạt"))

ans = {}
try:
    for line in open(f"{home}/drills/s34/answers.env"):
        if "=" in line:
            k, v = line.split("=", 1); ans[k.strip()] = v.strip().strip('"').strip("'")
except Exception: pass
want = {"STRANGER_SERVER": "https://10.20.30.40:6443", "STRANGER_USER": "auditor", "STRANGER_NS": "billing"}
bad = [f"{k}='{ans.get(k, '')[:30]}'" for k, v in want.items() if ans.get(k, "").strip().rstrip("/").lower() != v]
print("ANS=" + ("; ".join(bad) or "đạt"))
PY
