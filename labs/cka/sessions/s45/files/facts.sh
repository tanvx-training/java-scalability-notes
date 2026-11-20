# s45 — dữ kiện riêng của verify s45 trên cka-cp (user ubuntu, sudo), cộng với s43/files/facts.sh (etcd, dữ liệu shop): ba node
# Ready, schedulable, kubelet báo v1.37.x (k get node); revision etcd không nhỏ hơn revision lúc gây sự cố (sự cố st8-ops ghi
# vào /root/.lab/st8-ops/rev: khôi phục lại snapshot cũ thay vì sửa manifest là lùi dữ liệu); ~/drills/s45/answers.env.
# FAST=1 (etcd không phục vụ, xem probe.sh): chỉ in ANS, không gọi apiserver hay etcd. In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh
# có timeout.
python3 - "$HOME" "${FAST:-0}" <<'PY'
import json, re, subprocess, sys
home, fast = sys.argv[1], sys.argv[2] == "1"
PKI = "/etc/kubernetes/pki/etcd"
def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def ready(o):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (o.get("status") or {}).get("conditions") or [])

if not fast:
    # 1. NODES: ba node Ready, không cordon, kubelet báo v1.37.x (cùng minor với control plane 1.37).
    bad = []
    rc, out, _ = run("kubectl", "--request-timeout=10s", "get", "node", "-o", "json")
    try: nodes = json.loads(out)["items"] if rc == 0 else None
    except Exception: nodes = None
    if nodes is None: bad.append("không đọc được node")
    else:
        if len(nodes) != 3: bad.append(f"{len(nodes)} node")
        for n in nodes:
            name = n["metadata"]["name"].replace("cka-", "")
            v = n["status"]["nodeInfo"]["kubeletVersion"]
            if not v.startswith("v1.37."): bad.append(f"{name} kubelet {v}")
            if not ready(n): bad.append(f"{name} chưa Ready")
            if n["spec"].get("unschedulable"): bad.append(f"{name} đang cordon")
    say("NODES", bad)

    # 2. REV: revision etcd hiện tại ≥ revision lúc gây sự cố.
    bad = []
    rc, out, _ = run("sudo", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={PKI}/ca.crt", f"--cert={PKI}/server.crt",
                     f"--key={PKI}/server.key", "--command-timeout=5s", "endpoint", "status", "-w", "json")
    try: cur = json.loads(out)[0]["Status"]["header"]["revision"] if rc == 0 else None
    except Exception: cur = None
    rc, out, _ = run("sudo", "cat", "/root/.lab/st8-ops/rev")
    rec = int(out.strip()) if rc == 0 and out.strip().isdigit() else None
    if rec is None: bad.append("chưa có mốc revision của sự cố (chạy begin)")
    elif cur is None: bad.append("không đọc được revision etcd")
    elif cur < rec: bad.append(f"revision etcd {cur} < {rec} lúc gây sự cố: dữ liệu đã lùi")
    say("REV", bad)

# 3. ANS: BROKEN_COMPONENTS là đúng hai thành phần bị phá: etcd (manifest) và kubelet (cka-w2). kube-apiserver không lên chỉ
# vì etcd không lên: nó là nạn nhân, không phải chỗ hỏng. Chấp nhận thứ tự bất kỳ, phân cách bằng dấu phẩy hay khoảng trắng,
# và tên node đi kèm (kubelet@cka-w2, cka-w2/kubelet, kubelet:cka-w2).
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s45/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: ans = None
if ans is None: bad.append("chưa có ~/drills/s45/answers.env")
elif ans.get("BROKEN_COMPONENTS") is None: bad.append("answers.env chưa có BROKEN_COMPONENTS")
else:
    got = set()
    for t in re.split(r"[,;\s]+", ans["BROKEN_COMPONENTS"].strip().lower()):
        if not t: continue
        t = re.sub(r"^cka-(cp|w1|w2)[/:@]|[/:@(]cka-(cp|w1|w2)\)?$", "", t)
        got.add(t)
    if got != {"etcd", "kubelet"}: bad.append(f"BROKEN_COMPONENTS={ans['BROKEN_COMPONENTS']} chưa đúng")
say("ANS", bad)
PY
