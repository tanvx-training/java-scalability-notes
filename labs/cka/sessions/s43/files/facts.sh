# s43 — dữ kiện của verify s43 trên cka-cp (user ubuntu, sudo không hỏi mật khẩu): snapshot /opt/backup/etcd.db (etcdutl
# snapshot status, và snapshot có chứa key của ConfigMap before-snapshot và Deployment order, không chứa after-snapshot), manifest
# etcd (--data-dir, volumeMount, hostPath), container etcd đang chạy (mount thật qua crictl inspect), sức khoẻ etcd và apiserver,
# trạng thái shop (ConfigMap, order, release), ba node, ~/drills/s43/answers.env. In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh có
# timeout. Lab in tối đa 80 ký tự đầu của lý do đỏ, nên lý do viết ngắn.
python3 - "$HOME" <<'PY'
import json, os, re, subprocess, sys
import yaml
home = sys.argv[1]
SNAP = "/opt/backup/etcd.db"
NEW = "/var/lib/etcd-restore"
PKI = "/etc/kubernetes/pki/etcd"
ETCDCTL = ["sudo", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={PKI}/ca.crt",
           f"--cert={PKI}/server.crt", f"--key={PKI}/server.key", "--command-timeout=10s"]

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a):
    rc, out, err = run("kubectl", "--request-timeout=10s", *a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])

# 1. SNAP: snapshot hợp lệ (etcdutl đọc được, có key), chụp đúng lúc: sau before-snapshot, trước after-snapshot và trước khi xoá
# order. Key của etcd nằm nguyên văn trong tệp bbolt (giá trị là protobuf KeyValue chứa cả key), nên tìm chuỗi byte là đủ.
bad = []
rc, out, err = run("sudo", "etcdutl", "snapshot", "status", SNAP, "-w", "json")
st = None
try: st = json.loads(out) if rc == 0 else None
except Exception: pass
if rc != 0 and "no such file" in (err + out).lower(): bad.append(f"chưa có {SNAP}")
elif st is None: bad.append("etcdutl snapshot status lỗi: " + ((err or out).strip().splitlines() or [""])[-1][:40])
elif not st.get("totalKey"): bad.append("snapshot không có key")
if st is not None:
    has = lambda k: run("sudo", "grep", "-qaF", k, SNAP)[0] == 0
    if not has("/registry/configmaps/shop/before-snapshot"): bad.append("snapshot thiếu before-snapshot")
    if has("/registry/configmaps/shop/after-snapshot"): bad.append("snapshot có after-snapshot")
    if not has("/registry/deployments/shop/order"): bad.append("snapshot thiếu Deployment order")
say("SNAP", bad)
if st: print(f"SNAPREV={st.get('revision')} SNAPKEYS={st.get('totalKey')}")

# 2. ETCD: manifest etcd trỏ data-dir mới ở cả ba chỗ (--data-dir, mountPath của volume đó, hostPath); chỉ một manifest etcd
# trong /etc/kubernetes/manifests (bản sao lưu để trong thư mục đó cũng thành static pod); container etcd đang chạy mount
# /var/lib/etcd-restore vào đúng --data-dir của nó; thư mục đó có dữ liệu thật (member/snap/db); etcd và apiserver khoẻ.
bad = []
rc, ls, _ = run("sudo", "ls", "/etc/kubernetes/manifests")
etcd_files = []
for f in ls.split():
    rc, txt, _ = run("sudo", "cat", f"/etc/kubernetes/manifests/{f}")
    try: doc = yaml.safe_load(txt)
    except Exception: doc = None
    if isinstance(doc, dict) and ((doc.get("metadata") or {}).get("labels") or {}).get("component") == "etcd": etcd_files.append((f, doc))
if len(etcd_files) != 1: bad.append(f"{len(etcd_files)} manifest etcd trong manifests/: " + ",".join(f for f, _ in etcd_files))
dd = None
if etcd_files:
    doc = dict(etcd_files)["etcd.yaml"] if "etcd.yaml" in dict(etcd_files) else etcd_files[0][1]
    c = (doc["spec"].get("containers") or [{}])[0]
    for a in (c.get("command") or []) + (c.get("args") or []):
        if a.startswith("--data-dir="): dd = a.split("=", 1)[1]
    mount = next((m for m in c.get("volumeMounts") or [] if m.get("mountPath", "").rstrip("/") == (dd or "").rstrip("/")), None)
    vol = next((v for v in doc["spec"].get("volumes") or [] if mount and v.get("name") == mount.get("name")), None)
    hp = ((vol or {}).get("hostPath") or {}).get("path")
    if dd != NEW: bad.append(f"--data-dir={dd}")
    if mount is None: bad.append(f"không volumeMount nào ở {dd}")
    elif hp != NEW: bad.append(f"hostPath của {dd} là {hp}")
rc, out, _ = run("sudo", "crictl", "ps", "--name", "^etcd$", "--state", "running", "-q")
cid = out.split()[0] if out.split() else None
if not cid: bad.append("container etcd không chạy")
else:
    rc, out, _ = run("sudo", "crictl", "inspect", cid)
    try:
        info = json.loads(out)
        cfg = (info.get("info") or {}).get("config") or {}
        args = (cfg.get("command") or []) + (cfg.get("args") or [])
        live = next((a.split("=", 1)[1] for a in args if a.startswith("--data-dir=")), None)
        mounts = (info.get("status") or {}).get("mounts") or []
        src = next((m.get("hostPath") for m in mounts if (m.get("containerPath") or "").rstrip("/") == (live or "").rstrip("/")), None)
        if src != NEW: bad.append(f"etcd đang chạy dùng {src or 'thư mục trong container'} ({live})")
        print(f"LIVE_DATADIR={live} LIVE_HOSTPATH={src}")
    except Exception: bad.append("crictl inspect etcd lỗi")
rc, _, _ = run("sudo", "test", "-s", f"{NEW}/member/snap/db")
if rc != 0: bad.append(f"{NEW}/member/snap/db chưa có")
rc, out, err = run(*ETCDCTL, "endpoint", "health")
if rc != 0 or "is healthy" not in out + err: bad.append("etcd chưa healthy")
rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "--raw", "/readyz")
if out.strip() != "ok": bad.append("apiserver /readyz chưa ok")
say("ETCD", bad)

# 3. STATE: shop đúng như lúc chụp: có before-snapshot, không có after-snapshot (NotFound thật, không phải lệnh lỗi), order
# Available đủ replica, release shop deployed; ba node Ready.
bad = []
rc, out, err = run("kubectl", "--request-timeout=10s", "-n", "shop", "get", "cm", "before-snapshot", "-o", "name")
if rc != 0: bad.append("thiếu before-snapshot" if "NotFound" in err else "không đọc được ConfigMap")
rc, out, err = run("kubectl", "--request-timeout=10s", "-n", "shop", "get", "cm", "after-snapshot", "-o", "name")
if rc == 0: bad.append("còn after-snapshot")
elif "NotFound" not in err: bad.append("không đọc được after-snapshot")
d = kj("-n", "shop", "get", "deploy", "order")
if d is None: bad.append("không có Deployment order")
else:
    s, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    if s.get("availableReplicas", 0) < want or want < 1: bad.append(f"order {s.get('availableReplicas', 0)}/{want} sẵn sàng")
rc, out, _ = run("helm", "list", "-n", "shop", "-o", "json")
try: r = next((x for x in json.loads(out) if x.get("name") == "shop"), None)
except Exception: r = None
if r is None or r.get("status") != "deployed": bad.append("release shop " + ("chưa có" if r is None else str(r.get("status"))))
nodes = (kj("get", "node") or {}).get("items")
if nodes is None: bad.append("không đọc được node")
else:
    nr = [n["metadata"]["name"].replace("cka-", "") for n in nodes if not ready(n)]
    if nr or len(nodes) != 3: bad.append("node chưa Ready: " + ",".join(nr) if nr else f"{len(nodes)} node")
say("STATE", bad)
ips = {n["metadata"]["name"]: next((a["address"] for a in n["status"]["addresses"] if a["type"] == "InternalIP"), "") for n in nodes or []}
print("W1_IP=" + ips.get("cka-w1", ""))

# 4. ANS: LOST_OBJECT là đối tượng tạo sau snapshot, mất khi restore (ConfigMap after-snapshot).
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s43/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
if ans is None: bad.append("chưa có ~/drills/s43/answers.env")
else:
    v = ans.get("LOST_OBJECT")
    if v is None: bad.append("answers.env chưa có LOST_OBJECT")
    elif not re.fullmatch(r"((configmaps?|cm)/)?after-snapshot", v.strip().lower()): bad.append(f"LOST_OBJECT={v} chưa đúng")
say("ANS", bad)
PY
