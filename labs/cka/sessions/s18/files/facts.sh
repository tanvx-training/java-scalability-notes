# s18 — đọc ResourceQuota shop-quota, LimitRange shop-limits (và ~/shop/quota.yaml, ~/shop/limits.yaml), namespace của context hiện hành, giá trị mặc định mà một
# Pod không khai tài nguyên nhận được (thử bằng --dry-run=server, không tạo gì), quota used/hard, số replica Available.
# In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get resourcequota shop-quota -o json > "$tmp/quota.json" 2>/dev/null || echo '{}' > "$tmp/quota.json"
k -n shop get limitrange shop-limits -o json > "$tmp/lr.json" 2>/dev/null || echo '{}' > "$tmp/lr.json"
k -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
k -n shop run lr-probe --image=busybox:1.37 --restart=Never --dry-run=server -o json -- true > "$tmp/probe.json" 2>"$tmp/probe.err" \
  || : > "$tmp/probe.json"
k get ns quota-lab -o name > "$tmp/ns.txt" 2>/dev/null || :
for f in quota limits; do
  k apply --dry-run=server -f "$HOME/shop/$f.yaml" -o json > "$tmp/file-$f.json" 2>"$tmp/file-$f.err" || : > "$tmp/file-$f.json"
done
echo "CTX_NS=$(kubectl config view --minify -o jsonpath='{..namespace}' 2>/dev/null)"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
def num(q, kind):
    # Số lượng của Kubernetes → millicore (cpu) hoặc MiB (memory).
    m = re.fullmatch(r"([0-9.]+)(m|[KMGT]i?|k|)", str(q if q is not None else ""))
    if not m: return None
    n, u = float(m.group(1)), m.group(2)
    if kind == "cpu": return n if u == "m" else n * 1000
    f = {"": 1, "m": 1e-3, "k": 1e3, "K": 1e3, "M": 1e6, "G": 1e9, "T": 1e12,
         "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4}[u]
    return n * f / 1024**2
def file_problem(name, kind, live):
    f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        return f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'không có tệp'}"
    if f.get("kind") != kind: return f"~/shop/{name}.yaml phải là đúng một {kind}"
    if json.dumps(f.get("spec"), sort_keys=True) != json.dumps((live or {}).get("spec"), sort_keys=True):
        return f"~/shop/{name}.yaml khác {kind} trong cluster: chưa apply từ tệp?"
    return None
def kind_of(key): return "cpu" if "cpu" in key else ("count" if key == "pods" else "memory")
def eq(a, b, kind):
    if kind == "count": return str(a) == str(b)
    x, y = num(a, kind), num(b, kind)
    return x is not None and y is not None and abs(x - y) < 1e-6

q = load(f"{t}/quota.json") or {}
hard = (q.get("spec") or {}).get("hard") or {}
need = ["pods", "requests.cpu", "requests.memory", "limits.memory"]
miss = [k for k in need if k not in hard]
fp = file_problem("quota", "ResourceQuota", q) if q else None
print("QUOTA=" + ("không có ResourceQuota shop-quota" if not q else
                  (f"thiếu khoá {', '.join(miss)}" if miss else (fp or "đạt"))))

lr = load(f"{t}/lr.json") or {}
lim = [x for x in (lr.get("spec") or {}).get("limits") or [] if x.get("type") == "Container"]
if not lr: print("LR=không có LimitRange shop-limits")
elif not lim: print("LR=không có mục type: Container")
else:
    c = lim[0]; bad = []
    for sect, keys in (("default", ["memory"]), ("defaultRequest", ["cpu", "memory"]), ("max", ["memory"])):
        for kk in keys:
            if kk not in (c.get(sect) or {}): bad.append(f"thiếu {sect}.{kk}")
    fp = file_problem("limits", "LimitRange", lr)
    if fp: bad.append(fp)
    print("LR=" + ("; ".join(bad) or "đạt"))

# Pod không khai tài nguyên, tạo thử bằng --dry-run=server: phải nhận đúng default/defaultRequest của LimitRange.
p = load(f"{t}/probe.json")
if not p:
    err = open(f"{t}/probe.err").read().strip().splitlines()
    print("DEFAULTS=Pod thử bị từ chối: " + (err[-1] if err else "?"))
elif not lim: print("DEFAULTS=không có LimitRange để so")
else:
    r = (p["spec"]["containers"][0].get("resources") or {})
    got = {"requests.cpu": (r.get("requests") or {}).get("cpu"), "requests.memory": (r.get("requests") or {}).get("memory"),
           "limits.memory": (r.get("limits") or {}).get("memory")}
    c = lim[0]
    exp = {"requests.cpu": (c.get("defaultRequest") or {}).get("cpu"), "requests.memory": (c.get("defaultRequest") or {}).get("memory"),
           "limits.memory": (c.get("default") or {}).get("memory")}
    bad = [f"{k}={got[k]} (LimitRange {exp[k]})" for k in exp if not (got[k] and exp[k] and eq(got[k], exp[k], kind_of(k)))]
    print("DEFAULTS=" + ("; ".join(bad) or "đạt"))

# used ≤ hard cho mọi khoá; ba Deployment Available đúng số replica.
bad = []
used = (q.get("status") or {}).get("used") or {}
for k, h in hard.items():
    kd = kind_of(k); u = used.get(k)
    if u is None: bad.append(f"{k}: chưa có used"); continue
    if kd == "count":
        if int(u) > int(h): bad.append(f"{k} {u}/{h}")
    elif (num(u, kd) or 0) > (num(h, kd) or 0) + 1e-6: bad.append(f"{k} {u}/{h}")
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
for name, n in {"gateway": 2, "catalog": 2, "order": 1}.items():
    d = deps.get(name)
    if not d: bad.append(f"{name}: không có Deployment"); continue
    st = d.get("status", {})
    r = f"{d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)}"
    if r != f"{n}/{n}/{n}": bad.append(f"{name}: replica/cập nhật/Available {r}")
print("USED=" + ("; ".join(bad) or ("đạt" if hard else "không có quota")))
print("QUOTA_LAB=" + ("còn" if open(f"{t}/ns.txt").read().strip() else "đã xoá"))
PY
