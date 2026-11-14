# s20 — đọc metrics-server (Deployment, APIService), số dòng của `kubectl top nodes`, HPA catalog (spec, status,
# ~/shop/catalog-hpa.yaml), chỗ trống của shop-quota cho catalog ở maxReplicas, Pod lẻ trong shop, namespace nháp
# hpa-lab, ~/drills/s20/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3).
# Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n kube-system get deploy metrics-server -o json > "$tmp/ms.json" 2>/dev/null || echo ERR > "$tmp/ms.json"
k get apiservice v1beta1.metrics.k8s.io -o json > "$tmp/api.json" 2>/dev/null || echo ERR > "$tmp/api.json"
k -n shop get hpa catalog -o json > "$tmp/hpa.json" 2>/dev/null || echo ERR > "$tmp/hpa.json"
k -n shop get deploy catalog -o json > "$tmp/catalog.json" 2>/dev/null || echo ERR > "$tmp/catalog.json"
k -n shop get resourcequota shop-quota -o json > "$tmp/quota.json" 2>/dev/null || echo ERR > "$tmp/quota.json"
k -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k get ns hpa-lab --ignore-not-found -o name > "$tmp/ns.txt" 2>/dev/null || echo ERR > "$tmp/ns.txt"
if k top nodes --no-headers > "$tmp/top.txt" 2>/dev/null; then :; else echo ERR > "$tmp/top.txt"; fi
k apply --dry-run=server -f "$HOME/shop/catalog-hpa.yaml" -o json > "$tmp/file-hpa.json" 2>"$tmp/file-hpa.err" || : > "$tmp/file-hpa.json"
cp "$HOME/drills/s20/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
MAX = 3  # maxReplicas của HPA catalog (chọn theo free -m đo lúc đỉnh, xem labs/cka/README.md)
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
def num(q, kind):
    m = re.fullmatch(r"([0-9.]+)(m|[KMGT]i?|k|)", str(q if q is not None else ""))
    if not m: return 0.0
    n, u = float(m.group(1)), m.group(2)
    if kind == "cpu": return n if u == "m" else n * 1000
    f = {"": 1, "m": 1e-3, "k": 1e3, "K": 1e3, "M": 1e6, "G": 1e9, "T": 1e12,
         "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4}[u]
    return n * f / 1024**2
def cond(obj, typ):
    return [c.get("status") for c in (obj.get("status") or {}).get("conditions") or [] if c.get("type") == typ]
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"')

# 1. metrics-server: image ghim phiên bản, --kubelet-insecure-tls, Available; APIService Available.
ms, api = load(f"{t}/ms.json"), load(f"{t}/api.json")
bad = []
if ms is None: bad.append("không có Deployment kube-system/metrics-server (hoặc không đọc được)")
else:
    c = (ms["spec"]["template"]["spec"].get("containers") or [{}])[0]
    if not re.fullmatch(r"registry\.k8s\.io/metrics-server/metrics-server:v\d+\.\d+\.\d+", c.get("image", "")):
        bad.append(f"image {c.get('image')} (cần registry.k8s.io/metrics-server/metrics-server:vX.Y.Z)")
    if "--kubelet-insecure-tls" not in (c.get("args") or []) + (c.get("command") or []):
        bad.append("thiếu --kubelet-insecure-tls (kubelet của kubeadm dùng chứng chỉ tự ký)")
    st = ms.get("status", {})
    if not ms["spec"].get("replicas") or st.get("availableReplicas") != ms["spec"].get("replicas"):
        bad.append(f"Available {st.get('availableReplicas', 0)}/{ms['spec'].get('replicas')}")
if api is None: bad.append("không có APIService v1beta1.metrics.k8s.io")
elif cond(api, "Available") != ["True"]: bad.append("APIService v1beta1.metrics.k8s.io chưa Available")
print("MS=" + ("; ".join(bad) or "đạt"))

top = open(f"{t}/top.txt").read()
print("TOP_NODES=" + ("lỗi" if top.strip() == "ERR" else str(len([l for l in top.splitlines() if re.fullmatch(r"[0-9]+m?", (l.split() + ["", ""])[1])]))))

# 2. HPA catalog: v2 trong tệp, đích Deployment catalog, min 2, max MAX, CPU 60%, behavior.scaleDown 60 giây.
hpa, f, dep = load(f"{t}/hpa.json"), load(f"{t}/file-hpa.json"), load(f"{t}/catalog.json")
bad = []
if hpa is None: bad.append("không có HPA shop/catalog (hoặc không đọc được)")
else:
    s = hpa.get("spec", {})
    ref = s.get("scaleTargetRef") or {}
    if (ref.get("kind"), ref.get("name")) != ("Deployment", "catalog"): bad.append(f"scaleTargetRef {ref.get('kind')}/{ref.get('name')}")
    if s.get("minReplicas") != 2: bad.append(f"minReplicas {s.get('minReplicas')}")
    if s.get("maxReplicas") != MAX: bad.append(f"maxReplicas {s.get('maxReplicas')} (cần {MAX})")
    ms_ = s.get("metrics") or []
    cpu = [m for m in ms_ if m.get("type") == "Resource" and (m.get("resource") or {}).get("name") == "cpu"]
    tgt = ((cpu[0].get("resource") or {}).get("target") or {}) if cpu else {}
    if len(ms_) != 1 or tgt.get("type") != "Utilization" or tgt.get("averageUtilization") != 60:
        bad.append("metrics phải là đúng một mục Resource cpu, Utilization 60")
    sw = ((s.get("behavior") or {}).get("scaleDown") or {}).get("stabilizationWindowSeconds")
    if sw != 60: bad.append(f"behavior.scaleDown.stabilizationWindowSeconds {sw} (cần 60)")
    if not f:
        err = open(f"{t}/file-hpa.err").read().strip().splitlines()
        bad.append(f"~/shop/catalog-hpa.yaml lỗi: {err[-1] if err else 'không có tệp'}")
    elif f.get("kind") != "HorizontalPodAutoscaler" or f.get("apiVersion") != "autoscaling/v2":
        bad.append(f"~/shop/catalog-hpa.yaml phải là đúng một HorizontalPodAutoscaler autoscaling/v2 (đang là {f.get('apiVersion')} {f.get('kind')})")
    elif json.dumps(f.get("spec"), sort_keys=True) != json.dumps(s, sort_keys=True):
        bad.append("~/shop/catalog-hpa.yaml khác HPA trong cluster: chưa apply từ tệp?")
print("HPA=" + ("; ".join(bad) or "đạt"))

# 3. HPA đang đọc được số CPU (ScalingActive), catalog Available trong khoảng min..max.
bad = []
if hpa is None: bad.append("không có HPA")
else:
    cur = [((m.get("resource") or {}).get("current") or {}).get("averageUtilization") for m in (hpa.get("status") or {}).get("currentMetrics") or []
           if m.get("type") == "Resource"]
    if not cur or not isinstance(cur[0], int): bad.append("status.currentMetrics chưa có số CPU (TARGETS <unknown>)")
    if cond(hpa, "ScalingActive") != ["True"]: bad.append("condition ScalingActive chưa True")
if dep is None: bad.append("không đọc được Deployment catalog")
else:
    r, a = dep["spec"].get("replicas") or 0, (dep.get("status") or {}).get("availableReplicas") or 0
    if not 2 <= r <= MAX or a != r: bad.append(f"catalog replica/Available {r}/{a}")
print("CURRENT=" + ("; ".join(bad) or "đạt"))

# 4. shop-quota còn chỗ cho catalog ở maxReplicas của HPA: used − (Pod catalog đang tính) + max × (một Pod catalog) ≤ hard.
q, pods = load(f"{t}/quota.json"), load(f"{t}/pods.json")
bad = []
top_n = (hpa or {}).get("spec", {}).get("maxReplicas")
if hpa is None: bad.append("không có HPA catalog (chưa biết maxReplicas)")
elif q is None or pods is None or dep is None: bad.append("không đọc được shop-quota, Pod hoặc Deployment catalog")
else:
    spec = dep["spec"]["template"]["spec"]
    def tot(sect, res, kind):
        main = sum(num(((c.get("resources") or {}).get(sect) or {}).get(res), kind) for c in spec.get("containers") or [])
        init = max([num(((c.get("resources") or {}).get(sect) or {}).get(res), kind) for c in spec.get("initContainers") or []] or [0])
        return max(main, init)
    per = {"pods": 1, "requests.cpu": tot("requests", "cpu", "cpu"), "requests.memory": tot("requests", "memory", "memory"),
           "limits.memory": tot("limits", "memory", "memory")}
    live = [p for p in pods.get("items", []) if p["metadata"].get("labels", {}).get("app") == "catalog"
            and p.get("status", {}).get("phase") not in ("Succeeded", "Failed")]
    hard, used = (q.get("spec") or {}).get("hard") or {}, (q.get("status") or {}).get("used") or {}
    for key, one in per.items():
        if key not in hard: continue
        kind = "count" if key == "pods" else ("cpu" if "cpu" in key else "memory")
        conv = (lambda v: float(v)) if kind == "count" else (lambda v, kd=kind: num(v, kd))
        need = conv(used.get(key, 0)) - len(live) * one + top_n * one
        if need > conv(hard[key]) + 1e-6:
            unit = "" if kind == "count" else ("m" if kind == "cpu" else "Mi")
            bad.append(f"{key}: cần {need:.0f}{unit} khi catalog có {top_n} replica, hard {hard[key]}")
print("QUOTA_ROOM=" + ("; ".join(bad) or "đạt"))

# 5. Đáp án: MAX_REPLICAS_SEEN trong khoảng 3..MAX; không còn Pod lẻ (Pod sinh tải) trong shop.
bad = []
seen = ans.get("MAX_REPLICAS_SEEN", "")
if not seen.isdigit() or not 3 <= int(seen) <= MAX: bad.append(f"MAX_REPLICAS_SEEN={seen or '(rỗng)'} (cần {MAX} = maxReplicas, số replica cao nhất bạn thấy)")
if pods is None: bad.append("không đọc được Pod")
else:
    stray = [p["metadata"]["name"] for p in pods.get("items", []) if not p["metadata"].get("ownerReferences")
             and p["metadata"]["name"] != "report-once" and not p["metadata"].get("deletionTimestamp")]
    if stray: bad.append(f"còn Pod lẻ: {' '.join(sorted(stray))}")
print("SEEN=" + ("; ".join(bad) or "đạt"))
ns = open(f"{t}/ns.txt").read().strip()
print("HPA_LAB=" + ("không đọc được namespace" if ns == "ERR" else ("còn" if ns else "đã xoá")))
print("UNKNOWN_REASON=" + ans.get("UNKNOWN_REASON", ""))
PY
