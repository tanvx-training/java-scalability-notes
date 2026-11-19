# s37 — dữ kiện của verify s37: helm, release demo và shop (helm list/history/get values/get manifest -o json), nhãn và
# annotation của mọi object trong shop, Deployment, ~/charts/shop, ~/shop/. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng
# user ubuntu (helm + kubectl + python3/PyYAML). Chỉ đọc; mỗi lệnh kubectl có --request-timeout, mỗi lệnh helm có timeout.
python3 - "$HOME" <<'PY'
import calendar, glob, json, os, subprocess, sys, time
import yaml
home = sys.argv[1]
HELM_VERSION = "v4.3.2"
DEMO_CHART, DEMO_MSG = "podinfo-6.16.0", "Xin chào từ Helm"
RN = ("meta.helm.sh/release-name", "meta.helm.sh/release-namespace")
DEPLOYS = ("gateway", "gateway-v1", "catalog", "order")
CHART = {("Deployment", n) for n in DEPLOYS} | {("Service", n) for n in DEPLOYS} | \
        {("ConfigMap", n) for n in ("shop-config", "gateway-files", "order-config")} | \
        {("HorizontalPodAutoscaler", "catalog"), ("ServiceAccount", "order"),
         ("Role", "order-config-reader"), ("RoleBinding", "order-config-reader")}
VKEY = {"gateway": "gateway", "gateway-v1": "gatewayV1", "catalog": "catalog", "order": "order"}

def run(*args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a): return run("kubectl", "--request-timeout=10s", *a)
def kj(*a):
    rc, out, _ = k(*a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def hj(*a):
    rc, out, _ = run("helm", *a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def last(s): return (s.strip().splitlines() or [""])[-1][:70]
def ts(s):
    # "2026-11-19T13:16:23Z" (API) hoặc "2026-11-19T13:16:23.343039+07:00" (helm history -o json)
    s = s.strip()
    if s.endswith("Z"): return calendar.timegm(time.strptime(s[:19], "%Y-%m-%dT%H:%M:%S"))
    base, off = s[:19], s[-6:]
    sign = 1 if off[0] == "+" else -1
    return calendar.timegm(time.strptime(base, "%Y-%m-%dT%H:%M:%S")) - sign * (int(off[1:3]) * 3600 + int(off[4:6]) * 60)
def available(d):
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return st.get("observedGeneration", 0) >= d["metadata"]["generation"] and st.get("updatedReplicas", 0) == want \
        and st.get("availableReplicas", 0) == want and st.get("replicas", 0) == want

# 1. helm và release demo
bad = []
rc, out, err = run("helm", "version", "--template", "{{.Version}}")
if rc != 0: bad.append("chưa có helm trên cka-cp")
elif out.strip() != HELM_VERSION: bad.append(f"helm {out.strip()}, cần {HELM_VERSION}")
rels = hj("list", "-n", "demo") if rc == 0 else None
r = next((x for x in rels or [] if x.get("name") == "demo"), None)
if rc == 0 and r is None: bad.append("chưa có release demo ở namespace demo")
elif r is not None:
    if r.get("status") != "deployed": bad.append(f"release demo đang {r.get('status')}")
    if r.get("chart") != DEMO_CHART: bad.append(f"release demo là {r.get('chart')}, cần {DEMO_CHART}")
    deps = (kj("-n", "demo", "get", "deploy") or {}).get("items", [])
    deps = [d for d in deps if (d["metadata"].get("annotations") or {}).get(RN[0]) == "demo"]
    if len(deps) != 1: bad.append(f"release demo có {len(deps)} Deployment")
    else:
        d = deps[0]; ps = d["spec"]["template"]["spec"]; c = ps["containers"][0]
        env = {e["name"]: e.get("value") for e in c.get("env") or []}
        if env.get("PODINFO_UI_MESSAGE") != DEMO_MSG: bad.append(f"ui.message (--set) là {env.get('PODINFO_UI_MESSAGE')!r}")
        if ((c.get("resources") or {}).get("limits") or {}).get("memory") != "64Mi": bad.append("limits.memory (-f) chưa là 64Mi")
        if not available(d): bad.append("Deployment của demo chưa Available")
        sel = ",".join(f"{a}={b}" for a, b in d["spec"]["selector"]["matchLabels"].items())
        pods = [p for p in (kj("-n", "demo", "get", "pod", "-l", sel) or {}).get("items", []) if not p["metadata"].get("deletionTimestamp")]
        nodes = sorted({p["spec"].get("nodeName") or "(chưa xếp)" for p in pods})
        if not pods: bad.append("không có Pod demo")
        elif nodes != ["cka-cp"]: bad.append(f"Pod demo ở {', '.join(nodes)}, cần cka-cp (-f: nodeSelector + toleration)")
print("DEMO=" + ("; ".join(bad)[:170] or "đạt"))

# 2. release shop: đúng tên, namespace, chart, deployed, đã upgrade (revision ≥ 2), image/replicas/resources của Deployment
# bằng values của release; ~/charts/shop có Chart.yaml và values.yaml đủ khoá.
bad = []
rels = hj("list", "-A") or []
shop = [x for x in rels if x.get("name") == "shop"]
others = [f"{x.get('name')}/{x.get('namespace')}" for x in rels if x.get("namespace") == "shop" and x.get("name") != "shop"]
r = next((x for x in shop if x.get("namespace") == "shop"), None)
vals = None
if r is None: bad.append("chưa có release shop ở namespace shop" + (f" (có {shop[0].get('namespace')})" if shop else ""))
else:
    if r.get("status") != "deployed": bad.append(f"release shop đang {r.get('status')}")
    if r.get("chart") != "shop-0.1.0": bad.append(f"release shop là {r.get('chart')}, cần shop-0.1.0")
    hist = hj("history", "shop", "-n", "shop") or []
    if int(r.get("revision") or 0) < 2 or len(hist) < 2: bad.append("chưa helm upgrade (cần revision ≥ 2)")
    vals = hj("get", "values", "shop", "-n", "shop", "--all")
    if vals is None: bad.append("không đọc được values của release")
if others: bad.append("release khác trong shop: " + ", ".join(others))
if vals is not None:
    for n in DEPLOYS:
        v = vals.get(VKEY[n]) or {}
        d = kj("-n", "shop", "get", "deploy", n)
        if d is None: bad.append(f"chưa có Deployment {n}"); continue
        c = d["spec"]["template"]["spec"]["containers"][0]
        img = f"{(v.get('image') or {}).get('repository')}:{(v.get('image') or {}).get('tag')}"
        if c.get("image") != img: bad.append(f"{n}: image {c.get('image')} khác values ({img})")
        if (c.get("resources") or {}) != (v.get("resources") or {}): bad.append(f"{n}: resources khác values")
        if n != "catalog" and d["spec"].get("replicas") != v.get("replicas"): bad.append(f"{n}: replicas khác values")
    if str(((vals.get("order") or {}).get("image") or {}).get("tag")) != "2.0": bad.append("order.image.tag của release chưa là 2.0 (bước upgrade)")
try: ch = yaml.safe_load(open(f"{home}/charts/shop/Chart.yaml")) or {}
except Exception: ch = None
if ch is None: bad.append("chưa có ~/charts/shop/Chart.yaml")
elif (ch.get("name"), str(ch.get("version"))) != ("shop", "0.1.0"): bad.append("~/charts/shop/Chart.yaml: cần name shop, version 0.1.0")
try: fv = yaml.safe_load(open(f"{home}/charts/shop/values.yaml")) or {}
except Exception: fv = None
if fv is None: bad.append("chưa có ~/charts/shop/values.yaml")
else:
    miss = [f"{key}.{f}" for key in VKEY.values() for f in ("image.tag", "replicas", "resources")
            if (((fv.get(key) or {}).get("image") or {}).get("tag") if f == "image.tag" else (fv.get(key) or {}).get(f)) in (None, "", {})]
    if miss: bad.append("values.yaml thiếu " + ", ".join(miss)[:60])
print("SHOP=" + ("; ".join(bad)[:170] or "đạt"))

# 3. Nhận lại: đúng 15 object trong manifest của release, mỗi object mang nhãn/annotation của release shop; không object nào
# khác trong shop mang annotation release; Deployment và Service có trước revision 1 (nhận lại, không xoá rồi tạo).
bad = []
rc, out, err = run("helm", "get", "manifest", "shop", "-n", "shop")
man = set()
if rc == 0:
    for d in yaml.safe_load_all(out):
        if isinstance(d, dict) and d.get("kind"):
            man.add((d["kind"], (d.get("metadata") or {}).get("name")))
            # Namespace trong manifest phải để trống (Helm điền -n) hoặc là shop: chart ghi cứng namespace khác thì release
            # quản bản sao ở chỗ khác, không phải object của shop.
            ns = (d.get("metadata") or {}).get("namespace")
            if ns not in (None, "", "shop"): bad.append(f"manifest: {d['kind']}/{d['metadata'].get('name')} ở namespace {ns}")
else: bad.append("không đọc được manifest của release shop")
if rc == 0 and man != CHART:
    extra, miss = sorted(man - CHART), sorted(CHART - man)
    if miss: bad.append("chart thiếu " + ", ".join(f"{a}/{b}" for a, b in miss)[:60])
    if extra: bad.append("chart thừa " + ", ".join(f"{a}/{b}" for a, b in extra)[:60])
hist = hj("history", "shop", "-n", "shop") or []
first = ts(hist[0]["updated"]) if hist else None
RES = "deploy,sts,ds,svc,cm,secret,sa,role,rolebinding,hpa,cronjob,job,pvc,netpol,ingress,resourcequota,limitrange,pdb"
items = (kj("-n", "shop", "get", RES, "--show-managed-fields") or {}).get("items")
if items is None: bad.append("không đọc được object của shop")
else:
    seen = {}
    for o in items:
        kn = (o["kind"], o["metadata"]["name"]); md = o["metadata"]
        an, lb = md.get("annotations") or {}, md.get("labels") or {}
        if kn in CHART: seen[kn] = o
        elif RN[0] in an: bad.append(f"{kn[0]}/{kn[1]} ngoài chart mang annotation release {an[RN[0]]}")
    for kn in sorted(CHART):
        o = seen.get(kn)
        if o is None: bad.append(f"chưa có {kn[0]}/{kn[1]}"); continue
        md = o["metadata"]; an, lb = md.get("annotations") or {}, md.get("labels") or {}
        if (an.get(RN[0]), an.get(RN[1]), lb.get("app.kubernetes.io/managed-by")) != ("shop", "shop", "Helm"):
            bad.append(f"{kn[0]}/{kn[1]}: nhãn/annotation không phải của release shop/shop"); continue
        # Helm đã apply chính object này (field manager "helm"), không chỉ có nhãn/annotation gắn tay.
        if "helm" not in {m.get("manager") for m in md.get("managedFields") or []}:
            bad.append(f"{kn[0]}/{kn[1]}: Helm chưa apply object này (không có field manager helm)"); continue
        if first and kn[0] in ("Deployment", "Service") and ts(md["creationTimestamp"]) >= first:
            bad.append(f"{kn[0]}/{kn[1]} tạo lại khi cài (không phải nhận lại)")
print("ADOPT=" + ("; ".join(bad)[:170] or "đạt"))

# 4. Selector không đổi; bốn Deployment Available; Pod order chạy bằng SA order.
bad = []
for n in DEPLOYS:
    d = kj("-n", "shop", "get", "deploy", n)
    if d is None: bad.append(f"chưa có Deployment {n}"); continue
    if d["spec"]["selector"] != {"matchLabels": {"app": n}}: bad.append(f"{n}: selector {d['spec']['selector']}")
    if (d["spec"]["template"]["metadata"].get("labels") or {}).get("app") != n: bad.append(f"{n}: nhãn Pod mất app={n}")
    if not available(d):
        st = d.get("status") or {}
        bad.append(f"{n} chưa Available ({st.get('availableReplicas', 0)}/{d['spec'].get('replicas', 1)})")
    if n == "order" and d["spec"]["template"]["spec"].get("serviceAccountName") != "order": bad.append("Deployment order không dùng SA order")
pods = [p for p in (kj("-n", "shop", "get", "pod", "-l", "app=order") or {}).get("items", [])
        if not p["metadata"].get("deletionTimestamp") and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
if any(p["spec"].get("serviceAccountName") != "order" for p in pods): bad.append("có Pod order không chạy bằng SA order")
# Role của order nay do chart tạo: chỉ configmaps, chỉ get/list/watch, chỉ theo resourceNames [order-config].
role = kj("-n", "shop", "get", "role", "order-config-reader")
rs = (role or {}).get("rules") or []
if role is None: bad.append("chưa có Role order-config-reader")
elif not rs or any(sorted(r.get("resourceNames") or []) != ["order-config"] or set(r.get("resources") or []) != {"configmaps"}
                   or (r.get("apiGroups") or []) != [""] or set(r.get("verbs") or []) - {"get", "list", "watch"} for r in rs):
    bad.append("Role order-config-reader phải chỉ get/list/watch configmaps theo resourceNames [order-config]")
print("APPS=" + ("; ".join(bad)[:170] or "đạt"))
rc, out, _ = k("get", "node", "cka-w1", "-o", "jsonpath={.status.addresses[?(@.type==\"InternalIP\")].address}")
print("W1_IP=" + (out.strip() if rc == 0 else ""))

# 5. ~/shop/: không tệp nào còn object của chart; ~/shop/pre-helm/ giữ bốn Deployment; ~/shop/rbac.yaml còn bốn object
# RBAC của dev/ops.
bad = []
def docs_in(pattern):
    res = {}
    for p in sorted(glob.glob(pattern + "/*.yaml") + glob.glob(pattern + "/*.yml")):
        try:
            for d in yaml.safe_load_all(open(p)):
                if isinstance(d, dict) and d.get("kind"): res.setdefault((d["kind"], (d.get("metadata") or {}).get("name")), p)
        except Exception: pass
    return res
top, pre = docs_in(f"{home}/shop"), docs_in(f"{home}/shop/pre-helm")
left = sorted(kn for kn in top if kn in CHART)
if left: bad.append(f"~/shop/ còn {len(left)} object của chart: " + ", ".join(f"{os.path.basename(top[kn])}:{kn[1]}" for kn in left)[:80])
miss = [n for n in DEPLOYS if ("Deployment", n) not in pre]
if miss: bad.append("~/shop/pre-helm/ chưa có Deployment " + ", ".join(miss))
RB = [("Role", "shop-deployer"), ("RoleBinding", "shop-dev"), ("ClusterRole", "shop-ops-view"), ("ClusterRoleBinding", "shop-ops")]
nr = [f"{a} {b}" for a, b in RB if os.path.basename(top.get((a, b), "")) != "rbac.yaml"]
if nr: bad.append("~/shop/rbac.yaml thiếu " + ", ".join(nr))
print("FILES=" + ("; ".join(bad)[:170] or "đạt"))
PY
