# s38 — dữ kiện của verify s38: verify tự build hai overlay (`kubectl kustomize`, không apply) và so overlay dev với namespace
# shop-dev; ConfigMap có hậu tố hash mà Pod đang dùng; ReplicaSet của catalog trong shop-dev (đổi literal → rollout); đáp án
# HASHED_CM_NAME; shop không bị overlay chạm. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl +
# python3/PyYAML). Chỉ đọc; mỗi lệnh kubectl có --request-timeout.
python3 - "$HOME" <<'PY'
import json, os, re, subprocess, sys
import yaml
home = sys.argv[1]
K = f"{home}/kustomize/shop"
NS = "shop-dev"
HASHED = re.compile(r"^catalog-config-[a-z0-9]{10}$")
MAXLIM = 256 * 1024 * 1024          # base 384Mi; overlay dev hạ xuống (đo: 208Mi là mức nhỏ nhất chạy ổn)

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def kj(*a):
    rc, out, _ = run("kubectl", "--request-timeout=10s", *a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def last(s): return (s.strip().splitlines() or [""])[-1][:90]
def build(o):
    rc, out, err = run("kubectl", "kustomize", f"{K}/{o}")
    if rc != 0: return None, last(err)
    try: return [d for d in yaml.safe_load_all(out) if isinstance(d, dict)], ""
    except Exception as e: return None, str(e)[:60]
def find(docs, kind, name=None):
    return [d for d in docs if d.get("kind") == kind and (name is None or d["metadata"]["name"] == name)]
def qty(s):
    m = re.match(r"^(\d+)(Ki|Mi|Gi)?$", str(s or ""))
    return int(m.group(1)) * {None: 1, "Ki": 1024, "Mi": 1024 ** 2, "Gi": 1024 ** 3}[m.group(2)] if m else None
def cmref(ps):
    c = ps["containers"][0]
    names = [(e.get("configMapRef") or {}).get("name") for e in c.get("envFrom") or []]
    names += [((e.get("valueFrom") or {}).get("configMapKeyRef") or {}).get("name") for e in c.get("env") or []]
    return [n for n in names if n and n.startswith("catalog-config")]

# 1. Cây thư mục và build overlay dev; kết quả build khớp shop-dev (ConfigMap hash, image, replicas, limit).
bad = []
for d in ("base", "overlays/dev", "overlays/prod"):
    if not any(os.path.isfile(f"{K}/{d}/{f}") for f in ("kustomization.yaml", "kustomization.yml", "Kustomization")):
        bad.append(f"chưa có ~/kustomize/shop/{d}/kustomization.yaml")
dev, err = build("overlays/dev") if not bad else (None, "")
if not bad and dev is None: bad.append("build overlays/dev lỗi: " + err)
devdep = None
if dev is not None:
    deps, cms = find(dev, "Deployment", "catalog"), [d for d in find(dev, "ConfigMap") if d["metadata"]["name"].startswith("catalog-config")]
    if len(deps) != 1: bad.append("build dev không ra đúng một Deployment catalog")
    elif len(cms) != 1 or not HASHED.match(cms[0]["metadata"]["name"]): bad.append("build dev chưa sinh ConfigMap catalog-config-<hash> (configMapGenerator)")
    else:
        devdep = deps[0]; ps = devdep["spec"]["template"]["spec"]; c = ps["containers"][0]
        if {d["metadata"].get("namespace") for d in dev} != {NS}: bad.append(f"build dev: object không cùng namespace {NS}")
        if devdep["spec"].get("replicas") != 1: bad.append("build dev: replicas khác 1")
        if c.get("image") != "shop/catalog:1.0": bad.append(f"build dev: image {c.get('image')}")
        if cmref(ps) != [cms[0]["metadata"]["name"]]: bad.append("build dev: Deployment không trỏ ConfigMap đã sinh")
        if not find(dev, "Service", "catalog"): bad.append("build dev thiếu Service catalog")
        live = kj("-n", NS, "get", "deploy", "catalog")
        if live is None: bad.append(f"chưa có Deployment catalog ở {NS} (apply -k overlays/dev)")
        else:
            lps = live["spec"]["template"]["spec"]; lc = lps["containers"][0]
            if cmref(lps) != cmref(ps): bad.append(f"{NS}: Deployment trỏ {cmref(lps)}, build dev ra {cmref(ps)} (chưa apply lại?)")
            if lc.get("image") != c.get("image") or lc.get("resources") != c.get("resources") or live["spec"].get("replicas") != devdep["spec"].get("replicas"):
                bad.append(f"{NS}: Deployment khác kết quả build dev")
print("KUST=" + ("; ".join(bad)[:170] or "đạt"))

# 2. shop-dev chạy catalog H2 từ overlay dev: Available, 1 replica, tag 1.0, không DB_URL, limit hạ; Pod dùng đúng ConfigMap
# có hash đang tồn tại; ≥ 2 ReplicaSet trỏ hai ConfigMap catalog-config-* khác nhau (đổi literal → rollout).
bad = []
live = kj("-n", NS, "get", "deploy", "catalog")
cmname = None
if live is None: bad.append(f"chưa có Deployment catalog ở {NS}")
else:
    ps = live["spec"]["template"]["spec"]; c = ps["containers"][0]; st = live.get("status") or {}
    want = live["spec"].get("replicas", 1)
    if want != 1: bad.append(f"replicas {want}, cần 1")
    if c.get("image") != "shop/catalog:1.0": bad.append(f"image {c.get('image')}, cần shop/catalog:1.0")
    if any(e.get("name") == "DB_URL" for e in c.get("env") or []): bad.append("có DB_URL (overlay dev chạy H2)")
    lim = qty(((c.get("resources") or {}).get("limits") or {}).get("memory"))
    if lim is None or lim > MAXLIM: bad.append("limits.memory chưa hạ (≤ 256Mi) bằng patch của overlay dev")
    if st.get("observedGeneration", 0) < live["metadata"]["generation"] or st.get("updatedReplicas", 0) != want or st.get("availableReplicas", 0) != want or st.get("replicas", 0) != want:
        bad.append(f"catalog ở {NS} chưa Available ({st.get('availableReplicas', 0)}/{want})")
    refs = cmref(ps)
    if len(refs) != 1 or not HASHED.match(refs[0]): bad.append(f"Deployment chưa dùng ConfigMap catalog-config-<hash> ({refs})")
    else:
        cmname = refs[0]
        if kj("-n", NS, "get", "cm", cmname) is None: bad.append(f"không có ConfigMap {cmname}")
        sel = ",".join(f"{a}={b}" for a, b in live["spec"]["selector"]["matchLabels"].items())
        pods = [p for p in (kj("-n", NS, "get", "pod", "-l", sel) or {}).get("items", []) if not p["metadata"].get("deletionTimestamp")
                and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
        if not pods: bad.append("không có Pod catalog")
        elif any(cmref(p["spec"]) != [cmname] for p in pods): bad.append("có Pod chưa dùng ConfigMap hiện hành (rollout chưa xong)")
        rss = (kj("-n", NS, "get", "rs", "-l", sel) or {}).get("items", [])
        seen = {tuple(cmref(r["spec"]["template"]["spec"])) for r in rss}
        if len(seen) < 2: bad.append("mới một ReplicaSet/ConfigMap: chưa đổi literal rồi apply lại (rollout)")
print("DEV=" + ("; ".join(bad)[:170] or "đạt"))
print("CM_NAME=" + (cmname or ""))

# 3. Overlay prod: verify tự build; 2 replica, tag 2.0, namespace khác shop-dev và shop; không apply.
bad = []
prod, err = build("overlays/prod")
if prod is None: bad.append("build overlays/prod lỗi: " + err)
else:
    deps = find(prod, "Deployment", "catalog")
    if len(deps) != 1: bad.append("build prod không ra đúng một Deployment catalog")
    else:
        d = deps[0]; ns = d["metadata"].get("namespace") or ""
        if d["spec"].get("replicas") != 2: bad.append(f"build prod: replicas {d['spec'].get('replicas')}, cần 2")
        if d["spec"]["template"]["spec"]["containers"][0].get("image") != "shop/catalog:2.0": bad.append("build prod: image chưa là shop/catalog:2.0")
        if ns in ("", NS, "shop", "default"): bad.append(f"build prod: namespace '{ns}' (cần namespace riêng, khác {NS} và shop)")
        elif kj("-n", ns, "get", "deploy", "catalog") is not None: bad.append(f"overlay prod đã bị apply vào {ns} (chỉ build)")
        if not any(HASHED.match(c["metadata"]["name"]) for c in find(prod, "ConfigMap")): bad.append("build prod: không có ConfigMap catalog-config-<hash>")
print("PROD=" + ("; ".join(bad)[:170] or "đạt"))

# 4. Đáp án
ans = {}
try:
    for line in open(f"{home}/drills/s38/answers.env"):
        if "=" in line:
            a, b = line.split("=", 1); ans[a.strip()] = b.strip().strip('"').strip("'")
except Exception: pass
v = ans.get("HASHED_CM_NAME", "")
print("ANS=" + ("đạt" if cmname and v == cmname else f"HASHED_CM_NAME='{v[:40]}'" + (f" (Pod đang dùng {cmname})" if cmname else "")))

# 5. Overlay không chạm shop: không ConfigMap catalog-config* ở shop; catalog của shop vẫn có DB_URL (PostgreSQL).
bad = []
cms = (kj("-n", "shop", "get", "cm") or {}).get("items")
if cms is None: bad.append("không đọc được ConfigMap của shop")
elif any(c["metadata"]["name"].startswith("catalog-config") for c in cms): bad.append("shop có ConfigMap catalog-config-* (overlay dev apply nhầm vào shop)")
d = kj("-n", "shop", "get", "deploy", "catalog")
if d is None: bad.append("chưa có Deployment catalog ở shop")
else:
    c = d["spec"]["template"]["spec"]["containers"][0]
    if not any(e.get("name") == "DB_URL" for e in c.get("env") or []) or cmref(d["spec"]["template"]["spec"]):
        bad.append("Deployment catalog của shop bị overlay ghi đè")
print("SHOPSAFE=" + ("; ".join(bad)[:170] or "đạt"))
PY
