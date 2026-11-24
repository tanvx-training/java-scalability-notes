# s50 — dữ kiện riêng của verify s50 trên cka-cp (user ubuntu, sudo; kubectl, etcdctl, openssl, python3 + PyYAML), cộng
# s46/files/core-facts.sh và s34/files/facts.sh (S34_DURABLE=1: cấu trúc hai kubeconfig). Bên gửi ghép s46/files/notes.sh lên
# trước (LAB_NOTES_PY). So với bản tốt và mốc mà sự cố st9-etcd lưu ở /root/.lab/st9-etcd/. In dạng KHOÁ=giá-trị. Chỉ đọc
# (phép thử `create` dùng --dry-run=server: không lưu gì); mỗi lệnh có timeout, apiserver chết thì mỗi lệnh kubectl lỗi ≤ 10 giây.
#   MANIFEST  kube-apiserver.yaml giống bản tốt theo NỘI DUNG YAML đã nạp (sửa bằng vim, đổi thứ tự khoá, comment vẫn được);
#             manifests/ không có tệp nào khác ngoài bốn manifest (tệp bắt đầu bằng dấu chấm thì kubelet bỏ qua). Lý do đỏ
#             không nêu tên cờ (đó là đáp án).
#   ETCD      etcd healthy; revision và raft index không nhỏ hơn mốc lúc begin (rev, raft: khôi phục snapshot là lùi dữ liệu);
#             apiserver /readyz.
#   OPSCERT   cert nhúng trong ~/ops.kubeconfig là cert MỚI (sha256 không có trong mốc seen: không phải cert hết hạn đã gây hay
#             cert gốc của s33), CN=ops O=shop-ops, do CA cluster ký (openssl verify), notBefore đã qua, còn hạn ≥ 1 giờ
#             (openssl -checkend 3600); gọi API bằng chính tệp: whoami ra ops/shop-ops, get nodes được, `create configmap
#             --dry-run=server` ở default Forbidden có `User "ops"`.
#   DEVADMIN  ~/dev.kubeconfig: whoami ra dev/shop-dev; ~/.kube/config: whoami kubernetes-admin, get nodes được.
#   ANS       ~/drills/s50/answers.env: ETCD_FLAG là cờ bị đổi (bỏ `--`, `=…`; cờ cert/key thì một hay cả hai, cách bằng dấu
#             phẩy hay khoảng trắng); EXPIRED_KUBECONFIG là ops (ops, ops.kubeconfig, ~/ops.kubeconfig, đường dẫn đầy đủ);
#             ETCD_LEADER_ID bằng leader thật (hex như cột ID của `-w table`, hay số thập phân của `-w json`); ETCD_VERSION
#             bằng phiên bản thật (có hay không chữ v).
#   RUNBOOK   ~/notes/runbook.md có heading chứa `s50` với ≥ 3 dòng không rỗng.
#   NOW       giờ hệ thống của cka-cp (epoch): verify.sh so với giờ của Mac (chỉnh giờ để cert "còn hạn" là đỏ).
python3 - "$HOME" <<'PY'
import base64, calendar, json, os, re, subprocess, sys, tempfile, time
import yaml
exec(os.environ.get("LAB_NOTES_PY", "raise SystemExit('thiếu s46/files/notes.sh')"))
home = sys.argv[1]
LAB = "/root/.lab/st9-etcd"
MAN = "/etc/kubernetes/manifests"
PKI = "/etc/kubernetes/pki"
E = f"{PKI}/etcd"
def run(*args, timeout=20, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a, timeout=20): return run("kubectl", "--request-timeout=10s", *a, timeout=timeout)
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def cat(p):
    rc, out, _ = run("sudo", "-n", "cat", p)
    return out if rc == 0 else None
def last(err): return (err.strip().splitlines() or ["lỗi"])[-1][:60]
NOMARK = "chưa có mốc của sự cố (chạy begin)"
print(f"NOW={int(time.time())}")

# 1. MANIFEST
bad = []
rc, out, _ = run("sudo", "-n", "ls", "-A", MAN)
if rc != 0: bad.append("không đọc được /etc/kubernetes/manifests")
else:
    extra = sorted(f for f in out.split() if not f.startswith(".") and f not in
                   ("etcd.yaml", "kube-apiserver.yaml", "kube-scheduler.yaml", "kube-controller-manager.yaml"))
    if extra: bad.append("thừa trong manifests/: " + ", ".join(extra))
g, l = cat(f"{LAB}/kube-apiserver.yaml"), cat(f"{MAN}/kube-apiserver.yaml")
if not g: bad.append(NOMARK)
elif l is None: bad.append("thiếu kube-apiserver.yaml")
else:
    try: same = yaml.safe_load(l) == yaml.safe_load(g)
    except Exception: same = False
    if not same: bad.append("kube-apiserver.yaml khác bản tốt")
say("MANIFEST", bad)

# 2. ETCD
bad = []
ETCDCTL = ["sudo", "-n", "timeout", "15", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={E}/ca.crt",
           f"--cert={E}/server.crt", f"--key={E}/server.key", "--command-timeout=5s"]
rc, out, err = run(*ETCDCTL, "endpoint", "health")
if rc != 0 or "is healthy" not in out + err: bad.append("etcd chưa healthy")
rc, out, _ = run(*ETCDCTL, "endpoint", "status", "-w", "json")
try: st = json.loads(out)[0]["Status"] if rc == 0 else None
except Exception: st = None
def mark(f):
    v = (cat(f"{LAB}/{f}") or "").strip()
    return int(v) if v.isdigit() else None
mrev, mraft = mark("rev"), mark("raft")
if st is None: bad.append("không đọc được endpoint status")
elif mrev is None or mraft is None: bad.append(NOMARK)
else:
    if st["header"]["revision"] < mrev: bad.append(f"revision {st['header']['revision']} < {mrev} lúc begin: dữ liệu đã lùi")
    if st["raftIndex"] < mraft: bad.append(f"raft index {st['raftIndex']} < {mraft} lúc begin: data-dir đã restore lại")
if k("get", "--raw", "/readyz")[1].strip() != "ok": bad.append("apiserver /readyz chưa ok")
say("ETCD", bad)

# 3. OPSCERT
bad = []
p = f"{home}/ops.kubeconfig"
seen = set((cat(f"{LAB}/seen") or "").split())
crt = b""
try:
    cfg = yaml.safe_load(open(p)) or {}
    crt = base64.b64decode(((cfg.get("users") or [{}])[0].get("user") or {}).get("client-certificate-data") or "")
except Exception: cfg = None
if cfg is None: bad.append("không đọc được ~/ops.kubeconfig")
elif not crt: bad.append("~/ops.kubeconfig không nhúng client-certificate-data")
elif not seen: bad.append(NOMARK)
else:
    with tempfile.NamedTemporaryFile() as f:
        f.write(crt); f.flush()
        rc, fpr, _ = run("openssl", "x509", "-in", f.name, "-noout", "-fingerprint", "-sha256")
        fpr = fpr.strip().split("=", 1)[-1]
        if not fpr: bad.append("cert nhúng không đọc được")
        else:
            if fpr in seen: bad.append("vẫn là cert có từ trước sự cố (hết hạn hay cert cũ): cấp cert mới")
            rc, subj, _ = run("openssl", "x509", "-in", f.name, "-noout", "-subject", "-nameopt", "RFC2253")
            if sorted(subj.strip()[len("subject="):].split(",")) != ["CN=ops", "O=shop-ops"]: bad.append("cert nhúng " + subj.strip()[8:40])
            rc, _, _ = run("openssl", "x509", "-in", f.name, "-noout", "-checkend", "3600")
            if rc != 0: bad.append("cert nhúng hết hạn hay còn dưới 1 giờ")
            rc, nb, _ = run("openssl", "x509", "-in", f.name, "-noout", "-startdate")
            try:
                if calendar.timegm(time.strptime(nb.strip().split("=", 1)[1], "%b %d %H:%M:%S %Y GMT")) > time.time():
                    bad.append("cert nhúng chưa tới notBefore")
            except Exception: bad.append("không đọc được notBefore")
            rc, out, err = run("openssl", "verify", "-CAfile", f"{PKI}/ca.crt", f.name)
            if rc != 0: bad.append("cert nhúng không do CA cluster ký" if "expired" not in out + err else "openssl verify: cert đã hết hạn")
    rc, out, err = k("--kubeconfig", p, "auth", "whoami", "-o", "json")
    try:
        ui = json.loads(out)["status"]["userInfo"]
        if ui.get("username") != "ops" or "shop-ops" not in (ui.get("groups") or []): bad.append(f"whoami ra {ui.get('username')}"[:40])
    except Exception: bad.append("ops: " + ("Unauthorized" if "Unauthorized" in err else last(err)))
    else:
        if k("--kubeconfig", p, "get", "nodes", "-o", "name")[0] != 0: bad.append("ops: get nodes không được")
        rc, out, err = k("--kubeconfig", p, "-n", "default", "create", "configmap", "lab-s50-probe", "--from-literal=a=b", "--dry-run=server")
        if rc == 0: bad.append("ops: create configmap được (quyền quá rộng?)")
        elif not ("Forbidden" in err or "forbidden" in err) or 'User "ops"' not in err: bad.append("ops create: " + last(err))
say("OPSCERT", bad)

# 4. DEVADMIN
bad = []
rc, out, err = k("--kubeconfig", f"{home}/dev.kubeconfig", "auth", "whoami", "-o", "json")
try:
    ui = json.loads(out)["status"]["userInfo"]
    if ui.get("username") != "dev" or "shop-dev" not in (ui.get("groups") or []): bad.append(f"dev.kubeconfig ra {ui.get('username')}"[:40])
except Exception: bad.append("dev: " + ("Unauthorized" if "Unauthorized" in err else last(err)))
rc, out, err = k("--kubeconfig", f"{home}/.kube/config", "auth", "whoami", "-o", "jsonpath={.status.userInfo.username}")
if out.strip() != "kubernetes-admin": bad.append("~/.kube/config: " + (out.strip()[:20] or last(err)))
elif k("--kubeconfig", f"{home}/.kube/config", "get", "nodes", "-o", "name")[0] != 0: bad.append("admin: get nodes không được")
say("DEVADMIN", bad)

# 5. ANS
bad = []
ans = read_env(f"{home}/drills/s50/answers.env")
flag = set((cat(f"{LAB}/flag") or "").split())
if ans is None: bad.append("chưa có ~/drills/s50/answers.env")
else:
    got = {t.split("=")[0].lstrip("-").lower() for t in re.split(r"[,;\s]+", ans.get("ETCD_FLAG") or "") if t}
    if not flag: bad.append(NOMARK)
    elif not got or not got <= flag or ("etcd-cafile" in flag and got != flag): bad.append(f"ETCD_FLAG={ans.get('ETCD_FLAG')} chưa đúng")
    e = (ans.get("EXPIRED_KUBECONFIG") or "").strip().lower()
    if not re.fullmatch(r"((~|/home/ubuntu)/)?ops(\.kubeconfig)?", e): bad.append(f"EXPIRED_KUBECONFIG={ans.get('EXPIRED_KUBECONFIG')} chưa đúng")
    if st is None: bad.append("không đọc được endpoint status để so")
    else:
        lid = (ans.get("ETCD_LEADER_ID") or "").strip().lower()
        if lid not in (f"{st['leader']:x}", f"0x{st['leader']:x}", str(st["leader"])): bad.append(f"ETCD_LEADER_ID={ans.get('ETCD_LEADER_ID')} chưa đúng")
        if (ans.get("ETCD_VERSION") or "").strip().lower().lstrip("v") != st.get("version"): bad.append(f"ETCD_VERSION={ans.get('ETCD_VERSION')} chưa đúng")
say("ANS", bad)

# 6. RUNBOOK
say("RUNBOOK", runbook_bad(home, "s50"))
PY
