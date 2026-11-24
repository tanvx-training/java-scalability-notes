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
# order, xét theo key còn sống ở revision cuối của snapshot.
bad = []
rc, out, err = run("sudo", "test", "-e", SNAP)
if rc != 0: out, err = "", "no such file"
else: rc, out, err = run("sudo", "etcdutl", "snapshot", "status", SNAP, "-w", "json")
st = None
try: st = json.loads(out) if rc == 0 else None
except Exception: pass
if rc != 0 and "no such file" in (err + out).lower(): bad.append(f"chưa có {SNAP}")
elif st is None: bad.append("etcdutl snapshot status lỗi: " + ((err or out).strip().splitlines() or [""])[-1][:40])
elif not st.get("totalKey"): bad.append("snapshot không có key")
# Key còn sống trong snapshot ở revision cuối: tìm chuỗi byte trong tệp không đủ, vì lịch sử MVCC và tombstone vẫn
# chứa key đã xoá (snapshot chụp lại sau khi xoá after-snapshot thì đỏ oan; chụp sau khi xoá order thì xanh oan). Restore snapshot
# vào một thư mục tạm (mktemp, không phải data-dir nào đang chạy; kiểm luôn hash của snapshot), đọc bucket "key" của db bằng
# live_keys (không khởi động etcd nào), rồi xoá thư mục tạm.
def live_keys(db):
    """Key etcd còn sống ở revision mới nhất trong một tệp bbolt (bytes) của etcd 3.x: đọc bucket "key" (B+tree: key = revision
    8 byte main + '_' + 8 byte sub, thêm 't' nếu là tombstone; value = protobuf mvccpb.KeyValue, trường 1 là key), lấy bản ghi
    revision lớn nhất của từng key, bỏ key mà bản ghi cuối là tombstone. Không khởi động gì, chỉ đọc bytes."""
    import struct
    def meta(off):
        magic, ver, psz, flags, root, seq, freelist, pgid, txid = struct.unpack_from("<IIIIQQQQQ", db, off + 16)
        return (txid, psz, root) if magic == 0xED0CDAED else None
    m0 = meta(0)
    psz0 = m0[1] if m0 else 4096
    ms = [x for x in (m0, meta(psz0)) if x]
    txid, psz, root = max(ms)
    def page(pgid):
        return pgid * psz
    def walk(off, out):  # duyệt một trang (đã biết offset); gom (key, value, flags) của các phần tử lá
        pid, flags, count, overflow = struct.unpack_from("<QHHI", db, off)
        base = off + 16
        if flags & 0x01:  # branch
            for i in range(count):
                e = base + 16 * i
                pos, ksz, child = struct.unpack_from("<IIQ", db, e)
                walk(page(child), out)
        elif flags & 0x02:  # leaf
            for i in range(count):
                e = base + 16 * i
                fl, pos, ksz, vsz = struct.unpack_from("<IIII", db, e)
                k = db[e + pos:e + pos + ksz]; v = db[e + pos + ksz:e + pos + ksz + vsz]
                out.append((k, v, fl, e + pos + ksz))
        return out
    def bucket(name):
        for k, v, fl, voff in walk(page(root), []):
            if k == name and fl & 0x01:
                broot, _ = struct.unpack_from("<QQ", v, 0)
                if broot == 0:  # bucket nội tuyến: trang nằm ngay sau header 16 byte
                    return walk(voff + 16, [])
                return walk(page(broot), [])
        return []
    def pb_key(v):  # trường 1 (bytes) của KeyValue
        i = 0
        while i < len(v):
            tag = v[i]; i += 1
            if tag == 0x0a:
                n = 0; s = 0
                while True:
                    b = v[i]; i += 1; n |= (b & 0x7f) << s; s += 7
                    if b < 0x80: break
                return bytes(v[i:i + n])
            wt = tag & 7
            if wt == 0:
                while v[i] & 0x80: i += 1
                i += 1
            elif wt == 2:
                n = 0; s = 0
                while True:
                    b = v[i]; i += 1; n |= (b & 0x7f) << s; s += 7
                    if b < 0x80: break
                i += n
            else:
                return None
        return None
    last = {}
    for k, v, fl, _ in bucket(b"key"):
        if len(k) < 17: continue
        rev = (struct.unpack(">Q", k[:8])[0], struct.unpack(">Q", k[9:17])[0])
        key = pb_key(v)
        if key is None: continue
        tomb = len(k) == 18 and k[17:18] == b"t"
        if key not in last or rev > last[key][0]: last[key] = (rev, tomb)
    return {k for k, (r, t) in last.items() if not t}

if st is not None:
    rc, tmp, _ = run("mktemp", "-d", "/tmp/s43-verify.XXXXXX")
    tmp = tmp.strip()
    keys = None
    if rc == 0 and tmp.startswith("/tmp/s43-verify."):
        rc, out, err = run("sudo", "etcdutl", "snapshot", "restore", SNAP, "--data-dir", f"{tmp}/r", timeout=120)
        if rc != 0: bad.append("etcdutl snapshot restore (thử) lỗi: " + ((err or out).strip().splitlines() or [""])[-1][:40])
        else:
            try:
                p = subprocess.run(["sudo", "cat", f"{tmp}/r/member/snap/db"], capture_output=True, timeout=60)
                keys = live_keys(p.stdout) if p.returncode == 0 else None
            except Exception: keys = None
            if keys is None: bad.append("không đọc được key trong snapshot")
        run("sudo", "rm", "-rf", "--one-file-system", tmp)
    else: bad.append("không tạo được thư mục tạm")
    if keys is not None:
        if b"/registry/configmaps/shop/before-snapshot" not in keys: bad.append("snapshot thiếu before-snapshot")
        if b"/registry/configmaps/shop/after-snapshot" in keys: bad.append("snapshot có after-snapshot")
        if b"/registry/deployments/shop/order" not in keys: bad.append("snapshot thiếu Deployment order")
        print(f"SNAPLIVE={len(keys)}")
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
# order: đếm Pod Ready không đang xoá, không tin status của Deployment (sau restore nó là status lúc chụp: đo "2/2 available"
# khi chưa Pod order nào chạy). Số đếm này KHÔNG bắt được Pod "bóng ma" của snapshot (chúng mang status Ready cũ):
# bằng chứng order chạy thật là /api/orders gọi từ Mac trong verify.sh (gateway → order → PostgreSQL).
d = kj("-n", "shop", "get", "deploy", "order")
if d is None: bad.append("không có Deployment order")
else:
    want = d["spec"].get("replicas", 1)
    pods = (kj("-n", "shop", "get", "pod", "-l", "app=order") or {}).get("items") or []
    n = sum(1 for p in pods if not p["metadata"].get("deletionTimestamp") and ready(p))
    if n < want or want < 1: bad.append(f"order {n}/{want} Pod Ready")
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
