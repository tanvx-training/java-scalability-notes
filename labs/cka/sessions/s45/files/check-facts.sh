# s45 — dữ kiện của check.sh trên cka-cp (user ubuntu, sudo): phần của cuối s44 (và s43) mà sự cố st8-ops không đụng và đọc
# được khi apiserver không chạy: mười một cert kubeadm ký lại sau ~/drills/s44/started (đọc tệp, như s44/files/facts.sh),
# ha.txt và QUORUM_5 của s44; etcdctl/etcdutl v3.7.0, snapshot /opt/backup/etcd.db đọc được, /var/lib/etcd-restore có dữ liệu
# thật (key /registry/namespaces/shop); control plane: etcd healthy và apiserver /readyz, hoặc sự cố st8-ops của một lần
# begin trước đang dở: manifest etcd hiện tại khác bản tốt mà sự cố đã lưu (/root/.lab/st8-ops/etcd.yaml). In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh có timeout.
python3 - "$HOME" <<'PY'
import base64, calendar, json, re, subprocess, sys, time
import yaml
home = sys.argv[1]
K = "/etc/kubernetes"
NEW = "/var/lib/etcd-restore"
PKI = f"{K}/pki/etcd"
def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))

# 1. S44: cert ký lại sau mốc (notBefore + 300 + 1 ≥ mốc, như s44), ha.txt, QUORUM_5.
bad = []
try: started = int(open(f"{home}/drills/s44/started").read().split()[0])
except Exception: started = None
if started is None: bad.append("chưa có ~/drills/s44/started")
old = []
for f in ["apiserver", "apiserver-kubelet-client", "apiserver-etcd-client", "front-proxy-client", "etcd/server", "etcd/peer",
          "etcd/healthcheck-client", "admin.conf", "super-admin.conf", "controller-manager.conf", "scheduler.conf"]:
    path = f"{K}/{f}" if f.endswith(".conf") else f"{K}/pki/{f}.crt"
    rc, txt, _ = run("sudo", "cat", path)
    pem = txt
    if f.endswith(".conf"):
        try: pem = base64.b64decode(yaml.safe_load(txt)["users"][0]["user"]["client-certificate-data"]).decode()
        except Exception: pem = ""
    rc, out, _ = run("openssl", "x509", "-noout", "-startdate", inp=pem.encode())
    m = re.search(r"notBefore=(.+)", out)
    if rc != 0 or not m: old.append(f); continue
    nb = calendar.timegm(time.strptime(m.group(1).strip(), "%b %d %H:%M:%S %Y %Z"))
    if started is not None and nb + 301 < started: old.append(f.replace(".conf", ""))
if old: bad.append(f"{len(old)}/11 cert chưa gia hạn sau mốc s44")
try: ha = re.sub(r"\\\n", " ", open(f"{home}/drills/s44/ha.txt").read())
except Exception: ha = None
if ha is None: bad.append("chưa có ~/drills/s44/ha.txt")
elif not (re.search(r"kubeadm\s+init\b.*--control-plane-endpoint.*", ha) and re.search(r"kubeadm\s+join\b.*--certificate-key", ha)):
    bad.append("ha.txt thiếu lệnh init/join HA")
try: q = re.search(r"^QUORUM_5=['\"]?(\S+?)['\"]?$", open(f"{home}/drills/s44/answers.env").read(), re.M)
except Exception: q = None
if not q or q.group(1) != "3": bad.append("answers.env của s44 chưa có QUORUM_5=3")
say("S44", bad)

# 2. DATA: công cụ etcd, snapshot, dữ liệu thật trong data-dir của s43.
bad = []
for t in ("etcdctl", "etcdutl"):
    rc, out, _ = run(f"/usr/local/bin/{t}", "version")
    if f"{t} version: 3.7.0" not in out: bad.append(f"chưa có {t} 3.7.0")
rc, out, err = run("sudo", "etcdutl", "snapshot", "status", "/opt/backup/etcd.db", "-w", "json")
if rc != 0: bad.append("/opt/backup/etcd.db không đọc được")
rc, _, _ = run("sudo", "grep", "-qaF", "/registry/namespaces/shop", f"{NEW}/member/snap/db", timeout=60)
if rc != 0: bad.append(f"{NEW} chưa có dữ liệu của cluster")
say("DATA", bad)

# 3. CP: etcd phục vụ và apiserver /readyz, hoặc sự cố st8-ops đang dở (manifest etcd khác bản tốt đã lưu; sửa xong là
# giống hệt, khi đó dòng này đòi control plane khoẻ thật).
bad = []
rc1, _, _ = run("sudo", "test", "-f", "/root/.lab/st8-ops/etcd.yaml")
rc2, _, _ = run("sudo", "cmp", "-s", "/root/.lab/st8-ops/etcd.yaml", f"{K}/manifests/etcd.yaml")
if not (rc1 == 0 and rc2 != 0):
    rc, out, err = run("sudo", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={PKI}/ca.crt", f"--cert={PKI}/server.crt",
                       f"--key={PKI}/server.key", "--command-timeout=5s", "endpoint", "health")
    if rc != 0: bad.append("etcd chưa healthy")
    rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "--raw", "/readyz")
    if out.strip() != "ok": bad.append("apiserver /readyz chưa ok")
say("CP", bad)
PY
