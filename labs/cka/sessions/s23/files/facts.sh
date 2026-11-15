# s23 — đọc local-path-provisioner (Deployment, Pod, ConfigMap local-path-config), mọi StorageClass, mọi PV và PVC,
# ~/drills/s23/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3).
# Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n local-path-storage get deploy local-path-provisioner -o json > "$tmp/deploy.json" 2>"$tmp/deploy.err" || echo ERR > "$tmp/deploy.json"
k -n local-path-storage get pod -l app=local-path-provisioner -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k -n local-path-storage get configmap local-path-config -o json > "$tmp/cm.json" 2>"$tmp/cm.err" || echo ERR > "$tmp/cm.json"
k get storageclass -o json > "$tmp/sc.json" 2>/dev/null || echo ERR > "$tmp/sc.json"
k get pv -o json > "$tmp/pv.json" 2>/dev/null || echo ERR > "$tmp/pv.json"
k get pvc -A -o json > "$tmp/pvc.json" 2>/dev/null || echo ERR > "$tmp/pvc.json"
cp "$HOME/drills/s23/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
def missing(name):
    return "NotFound" in open(f"{t}/{name}.err").read()
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")

# 1. Provisioner: image ghim phiên bản, Available, Pod trên cka-cp; image helper Pod trong ConfigMap có tag cụ thể.
dep, pods, cm = load("deploy"), load("pods"), load("cm")
bad = []
if dep is None:
    bad.append("chưa có Deployment local-path-storage/local-path-provisioner" if missing("deploy") else "không đọc được Deployment")
else:
    c = (dep["spec"]["template"]["spec"].get("containers") or [{}])[0]
    if not re.fullmatch(r"(docker\.io/)?rancher/local-path-provisioner:v\d+\.\d+\.\d+", c.get("image", "")):
        bad.append(f"image {c.get('image')} (cần rancher/local-path-provisioner:vX.Y.Z)")
    r, a = dep["spec"].get("replicas") or 0, (dep.get("status") or {}).get("availableReplicas") or 0
    if not r or a != r: bad.append(f"Available {a}/{r}")
if pods is None: bad.append("không đọc được Pod của provisioner")
elif dep is not None:
    live = [p for p in pods.get("items", []) if not p["metadata"].get("deletionTimestamp")
            and p.get("status", {}).get("phase") not in ("Succeeded", "Failed")]
    where = sorted(set(p["spec"].get("nodeName") or "(chưa xếp)" for p in live))
    if where != ["cka-cp"]: bad.append(f"Pod provisioner chạy trên {', '.join(where) or '(không có Pod)'} (cần cka-cp: nodeSelector + toleration control plane)")
if cm is None:
    if dep is not None: bad.append("không có ConfigMap local-path-config" if missing("cm") else "không đọc được ConfigMap local-path-config")
else:
    imgs = re.findall(r"^\s*image:\s*(\S+)", (cm.get("data") or {}).get("helperPod.yaml", ""), re.M)
    pinned = lambda i: "@sha256:" in i or (":" in i.rsplit("/", 1)[-1] and not i.endswith(":latest"))
    if not imgs or not all(pinned(i) for i in imgs):
        bad.append(f"helperPod.yaml trong local-path-config: image {', '.join(imgs) or '(không có)'} chưa ghim tag")
print("PROVISIONER=" + ("; ".join(bad) or "đạt"))

# 2. Đúng một StorageClass mặc định, là local-path (rancher.io/local-path, WaitForFirstConsumer).
sc = load("sc")
bad = []
if sc is None: bad.append("không đọc được StorageClass")
else:
    items = {s["metadata"]["name"]: s for s in sc.get("items", [])}
    ann = lambda s: (s["metadata"].get("annotations") or {})
    default = sorted(n for n, s in items.items() if ann(s).get("storageclass.kubernetes.io/is-default-class") == "true"
                     or ann(s).get("storageclass.beta.kubernetes.io/is-default-class") == "true")
    lp = items.get("local-path")
    if not lp: bad.append("chưa có StorageClass local-path")
    else:
        if lp.get("provisioner") != "rancher.io/local-path": bad.append(f"local-path: provisioner {lp.get('provisioner')}")
        if lp.get("volumeBindingMode") != "WaitForFirstConsumer": bad.append(f"local-path: volumeBindingMode {lp.get('volumeBindingMode')}")
    if default != ["local-path"]: bad.append(f"StorageClass mặc định: {', '.join(default) or '(không có)'} (cần đúng một: local-path)")
print("SC=" + ("; ".join(bad) or "đạt"))

# 3. Không còn PVC/PV nháp; PV shop-data vẫn Retain và Bound với shop/shop-data.
pv, pvc = load("pv"), load("pvc")
bad = []
if pv is None or pvc is None: bad.append("không đọc được PV/PVC")
else:
    pvs = {p["metadata"]["name"]: p for p in pv.get("items", [])}
    extra_pv = sorted(f"{n} ({p.get('status', {}).get('phase')})" for n, p in pvs.items() if n != "shop-data")
    extra_pvc = sorted(f"{c['metadata']['namespace']}/{c['metadata']['name']}" for c in pvc.get("items", [])
                       if (c["metadata"]["namespace"], c["metadata"]["name"]) != ("shop", "shop-data"))
    if extra_pvc: bad.append(f"còn PVC nháp: {' '.join(extra_pvc)}")
    if extra_pv: bad.append(f"còn PV nháp: {' '.join(extra_pv)}")
    sd = pvs.get("shop-data")
    if not sd: bad.append("mất PV shop-data")
    else:
        ref = sd["spec"].get("claimRef") or {}
        if sd["spec"].get("persistentVolumeReclaimPolicy") != "Retain": bad.append(f"PV shop-data: reclaimPolicy {sd['spec'].get('persistentVolumeReclaimPolicy')} (cần Retain)")
        if sd.get("status", {}).get("phase") != "Bound" or (ref.get("namespace"), ref.get("name")) != ("shop", "shop-data"):
            bad.append(f"PV shop-data: {sd.get('status', {}).get('phase')}, claimRef {ref.get('namespace')}/{ref.get('name')}")
print("CLEAN=" + ("; ".join(bad) or "đạt"))
print("WFFC_REASON=" + ans.get("WFFC_REASON", ""))
PY
