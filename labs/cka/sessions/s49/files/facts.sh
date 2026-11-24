# s49 — dữ kiện riêng của verify s49 trên cka-cp (user ubuntu, sudo; kubectl, python3 + PyYAML), cộng s46/files/core-facts.sh.
# So với bản tốt và mốc mà sự cố st9-cp lưu ở /root/.lab/st9-cp/ (ba manifest tốt, flag, broken.sha256). In dạng KHOÁ=giá-trị.
# Chỉ đọc, trừ namespace tạm lab-verify-s49-… (một Deployment busybox, xoá khi xong, spec 8.4); mỗi lệnh có timeout, apiserver
# chết thì mỗi lệnh kubectl lỗi trong ≤ 10 giây.
#   MANIFESTS  kube-apiserver.yaml, kube-scheduler.yaml, kube-controller-manager.yaml trong /etc/kubernetes/manifests/ giống
#              bản tốt theo NỘI DUNG YAML đã nạp (sửa bằng vim, đổi thứ tự khoá, thêm comment vẫn được; NBSP còn trong một
#              chuỗi là khác); thư mục không có tệp nào khác ngoài bốn manifest (tệp bắt đầu bằng dấu chấm thì kubelet bỏ qua).
#   SCHED      Deployment tạm 2 replica (busybox:1.37, requests nhỏ) trong namespace tạm đạt 2 Pod Ready trong 90 giây: cần
#              controller-manager (ReplicaSet, Pod, ServiceAccount default của namespace mới) và scheduler (nodeName).
#   BACKUP     ~/drills/s49/backup/kube-apiserver.yaml có sha256 bằng bản hỏng lúc begin (chép TRƯỚC khi sửa; chép từ bản
#              tốt hay sau khi sửa thì khác).
#   ANS        ~/drills/s49/answers.env: APISERVER_BAD_FLAG là cờ bị hỏng (bỏ `--`, `=…`, khoảng trắng và NBSP khi so);
#              SCHEDULER_SYMPTOM chứa Pending; CM_SYMPTOM chứa `replica` (ReplicaSet, replicas… — không phân biệt hoa thường).
#   RUNBOOK    ~/notes/runbook.md có heading chứa `s49` với ≥ 3 dòng không rỗng (tới heading cùng cấp hay cao hơn).
# FAST=1 (check.sh của s50): chỉ in BACKUP, ANS, RUNBOOK (đọc tệp, không gọi apiserver; in trước hai dòng kia).
python3 - "$HOME" "${FAST:-0}" <<'PY'
import hashlib, json, os, re, secrets, subprocess, sys, time
import yaml
home, fast = sys.argv[1], sys.argv[2] == "1"
LAB = "/root/.lab/st9-cp"
MAN = "/etc/kubernetes/manifests"
CPS = ("kube-apiserver", "kube-scheduler", "kube-controller-manager")
def run(*args, timeout=20, inp=None):
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
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
def cat(p):
    rc, out, _ = run("sudo", "-n", "cat", p)
    return out if rc == 0 else None
NOMARK = "chưa có bản tốt của sự cố (chạy begin)"

# 3. BACKUP
bad = []
want = {l.split()[1]: l.split()[0] for l in (cat(f"{LAB}/broken.sha256") or "").splitlines() if len(l.split()) == 2}
b = f"{home}/drills/s49/backup/kube-apiserver.yaml"
rc, out, _ = run("sudo", "-n", "cat", b)
if "kube-apiserver.yaml" not in want: bad.append("chưa có mốc của sự cố (chạy begin)")
elif rc != 0: bad.append("chưa có ~/drills/s49/backup/kube-apiserver.yaml")
elif hashlib.sha256(subprocess.run(["sudo", "-n", "cat", b], capture_output=True).stdout).hexdigest() != want["kube-apiserver.yaml"]:
    bad.append("backup không phải bản lúc sự cố (chép sau khi sửa, hay từ bản tốt?)")
say("BACKUP", bad)

# 4. ANS
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s49/answers.env", encoding="utf-8"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, v = l.strip().split("=", 1); ans[a.strip()] = v.strip().strip('"\'')
except Exception: ans = None
flag = (cat(f"{LAB}/flag") or "").strip()
if ans is None: bad.append("chưa có ~/drills/s49/answers.env")
else:
    f = re.sub(r"[\s ]", "", ans.get("APISERVER_BAD_FLAG") or "").split("=")[0].lstrip("-").lower()
    if not flag: bad.append("chưa có mốc của sự cố (chạy begin)")
    elif f != flag: bad.append(f"APISERVER_BAD_FLAG={ans.get('APISERVER_BAD_FLAG')} chưa đúng")
    if "pending" not in (ans.get("SCHEDULER_SYMPTOM") or "").lower(): bad.append(f"SCHEDULER_SYMPTOM={ans.get('SCHEDULER_SYMPTOM')} chưa đúng")
    if "replica" not in (ans.get("CM_SYMPTOM") or "").lower(): bad.append(f"CM_SYMPTOM={ans.get('CM_SYMPTOM')} chưa đúng")
say("ANS", bad)

# 5. RUNBOOK
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
            if cur is None and re.search(r"s49", m.group(2), re.I): cur = [len(m.group(1)), 0]
        elif cur and l.strip(): cur[1] += 1
    if cur: best = max(best, cur[1])
    if best < 3: bad.append("runbook.md chưa có mục s49 ≥ 3 dòng")
say("RUNBOOK", bad)

# FAST=1 (check.sh của s50, apiserver có thể đang hỏng): chỉ ba dòng đọc tệp ở trên.
if fast: sys.exit(0)

# 1. MANIFESTS
bad = []
# Tệp thừa trước: đó là bẫy (bản .bak hỏng trong manifests/ làm apiserver không lên dù tệp chính đã sửa, đo).
rc, out, _ = run("sudo", "-n", "ls", "-A", MAN)
if rc != 0: bad.append("không đọc được /etc/kubernetes/manifests")
else:
    extra = sorted(f for f in out.split() if not f.startswith(".") and f not in ("etcd.yaml",) + tuple(f"{c}.yaml" for c in CPS))
    if extra: bad.append("thừa trong manifests/: " + ", ".join(extra))
for c in CPS:
    g, l = cat(f"{LAB}/{c}.yaml"), cat(f"{MAN}/{c}.yaml")
    if not g: bad.append(NOMARK); break
    if l is None: bad.append(f"thiếu {c}.yaml"); continue
    try: same = yaml.safe_load(l) == yaml.safe_load(g)
    except Exception: same = False
    if not same: bad.append(f"{c}.yaml khác bản tốt")
say("MANIFESTS", bad)

# 2. SCHED: Deployment tạm 2 replica, chờ tối đa 90 giây.
bad = []
ns = f"lab-verify-s49-{secrets.token_hex(3)}"
if k("get", "--raw", "/readyz")[1].strip() != "ok": bad.append("apiserver không trả lời /readyz")
elif k("create", "ns", ns)[0] != 0: bad.append("không tạo được namespace tạm")
else:
    try:
        dep = {"apiVersion": "apps/v1", "kind": "Deployment", "metadata": {"name": "probe", "namespace": ns},
               "spec": {"replicas": 2, "selector": {"matchLabels": {"app": "probe"}},
                        "template": {"metadata": {"labels": {"app": "probe"}},
                                     "spec": {"terminationGracePeriodSeconds": 0,
                                              "containers": [{"name": "t", "image": "busybox:1.37", "command": ["sleep", "300"],
                                                              "resources": {"requests": {"cpu": "10m", "memory": "16Mi"}, "limits": {"memory": "32Mi"}}}]}}}}
        k("create", "-f", "-", inp=json.dumps(dep).encode())
        end, ok = time.time() + 90, False
        while time.time() < end:
            d = kj("-n", ns, "get", "deploy", "probe")
            if d and (d.get("status") or {}).get("availableReplicas", 0) == 2: ok = True; break
            time.sleep(3)
        if not ok:
            rs = (kj("-n", ns, "get", "rs") or {}).get("items", [])
            pods = (kj("-n", ns, "get", "pod") or {}).get("items", [])
            if not rs: bad.append("sau 90 giây Deployment tạm không có ReplicaSet")
            elif not pods: bad.append("sau 90 giây ReplicaSet tạm không có Pod")
            elif any(not p["spec"].get("nodeName") for p in pods): bad.append(f"sau 90 giây {sum(not p['spec'].get('nodeName') for p in pods)} Pod tạm Pending, chưa có node")
            else: bad.append("sau 90 giây Deployment tạm chưa đủ 2 Pod Ready")
    finally:
        k("delete", "ns", ns, "--wait=false")
say("SCHED", bad)
PY
