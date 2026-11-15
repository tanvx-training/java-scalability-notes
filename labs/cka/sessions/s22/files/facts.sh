# s22 — đọc PV shop-data, PVC shop/shop-data, Pod nháp scratch và pvc-probe trong shop, ~/drills/s22/answers.env.
# In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
# Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được", không xanh.
# Tệp trên hostPath nằm ở cka-w2, không đọc được từ đây: verify.sh đọc nó bằng một lần gọi riêng vào cka-w2 theo HOSTPATH.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k get pv shop-data -o json > "$tmp/pv.json" 2>"$tmp/pv.err" || echo ERR > "$tmp/pv.json"
k -n shop get pvc shop-data -o json > "$tmp/pvc.json" 2>"$tmp/pvc.err" || echo ERR > "$tmp/pvc.json"
k -n shop get pod scratch pvc-probe --ignore-not-found -o name > "$tmp/pods.txt" 2>/dev/null || echo ERR > "$tmp/pods.txt"
cp "$HOME/drills/s22/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
def missing(name):
    err = open(f"{t}/{name}.err").read()
    return "NotFound" in err
def gib(q):
    m = re.fullmatch(r"([0-9.]+)([KMGT]i?|)", str(q or ""))
    if not m: return None
    f = {"": 1, "K": 1e3, "M": 1e6, "G": 1e9, "T": 1e12, "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4}[m.group(2)]
    return float(m.group(1)) * f / 1024**3
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")

# 1. PV shop-data: hostPath, 1Gi, RWO, storageClassName manual, Retain, nodeAffinity ghim cka-w2.
pv = load("pv")
bad, path = [], ""
if pv is None:
    bad.append("chưa có PV shop-data" if missing("pv") else "không đọc được PV shop-data")
else:
    s = pv.get("spec", {})
    path = (s.get("hostPath") or {}).get("path", "")
    if not path: bad.append("không phải hostPath")
    if gib((s.get("capacity") or {}).get("storage")) != 1: bad.append(f"capacity {(s.get('capacity') or {}).get('storage')} (cần 1Gi)")
    if s.get("accessModes") != ["ReadWriteOnce"]: bad.append(f"accessModes {s.get('accessModes')} (cần [ReadWriteOnce])")
    if s.get("storageClassName") != "manual": bad.append(f"storageClassName {s.get('storageClassName')!r} (cần manual)")
    if s.get("persistentVolumeReclaimPolicy") != "Retain": bad.append(f"reclaimPolicy {s.get('persistentVolumeReclaimPolicy')} (cần Retain)")
    terms = (((s.get("nodeAffinity") or {}).get("required") or {}).get("nodeSelectorTerms") or [])
    hosts = [v for term in terms for e in term.get("matchExpressions") or []
             if e.get("key") == "kubernetes.io/hostname" and e.get("operator") == "In" for v in e.get("values") or []]
    if len(terms) != 1 or hosts != ["cka-w2"]:
        bad.append("nodeAffinity phải ghim kubernetes.io/hostname In [cka-w2] (dữ liệu hostPath chỉ nằm trên cka-w2)")
print("PV=" + ("; ".join(bad) or "đạt"))
print("HOSTPATH=" + path)

# 2. PVC shop/shop-data: 1Gi, RWO, manual, Bound với PV shop-data (hai chiều).
pvc = load("pvc")
bad = []
if pvc is None:
    bad.append("chưa có PVC shop/shop-data" if missing("pvc") else "không đọc được PVC shop/shop-data")
else:
    s, st = pvc.get("spec", {}), pvc.get("status", {})
    req = ((s.get("resources") or {}).get("requests") or {}).get("storage")
    if gib(req) != 1: bad.append(f"requests.storage {req} (cần 1Gi)")
    if s.get("accessModes") != ["ReadWriteOnce"]: bad.append(f"accessModes {s.get('accessModes')} (cần [ReadWriteOnce])")
    if s.get("storageClassName") != "manual": bad.append(f"storageClassName {s.get('storageClassName')!r} (cần manual)")
    if st.get("phase") != "Bound" or s.get("volumeName") != "shop-data":
        bad.append(f"phase {st.get('phase')}, volumeName {s.get('volumeName') or '(trống)'} (cần Bound với PV shop-data)")
if pv is not None:
    ref = pv.get("spec", {}).get("claimRef") or {}
    if (ref.get("namespace"), ref.get("name")) != ("shop", "shop-data") or pv.get("status", {}).get("phase") != "Bound":
        bad.append(f"PV shop-data: phase {pv.get('status', {}).get('phase')}, claimRef {ref.get('namespace')}/{ref.get('name')}")
print("PVC=" + ("; ".join(bad) or "đạt"))

print("ANSWER=" + ans.get("PVC_REUSE_CONTENT", ""))
left = open(f"{t}/pods.txt").read().strip()
names = sorted(l.split("/", 1)[-1] for l in left.splitlines() if l.strip())
print("PODS=" + ("không đọc được" if left == "ERR" else (f"còn {' '.join(names)}" if names else "đã xoá")))
PY
