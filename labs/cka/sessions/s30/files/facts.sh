# s30 — đọc CRD Gateway API, control plane NGINX Gateway Fabric (namespace nginx-gateway), GatewayClass nginx, Gateway và
# HTTPRoute của shop, data plane của shop-gw (Deployment/Service/Pod nhãn gateway.networking.k8s.io/gateway-name=shop-gw, NGF tạo
# ở namespace của Gateway), Deployment/Service gateway và gateway-v1, IP các node, các tệp ~/shop/*.yaml (PyYAML) và
# ~/drills/s30/answers.env. In dạng KHOÁ=giá-trị; DP_IP là InternalIP của node chạy Pod data plane (Service NodePort
# externalTrafficPolicy Local), W1_IP của cka-w1 cho Ingress s29. Chạy trên control plane bằng user ubuntu (kubectl + python3).
# Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được".
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k get crd gatewayclasses.gateway.networking.k8s.io gateways.gateway.networking.k8s.io httproutes.gateway.networking.k8s.io -o json > "$tmp/crd.json" 2>/dev/null || echo ERR > "$tmp/crd.json"
k -n nginx-gateway get deploy,pod -o json > "$tmp/ngf.json" 2>/dev/null || echo ERR > "$tmp/ngf.json"
k get gatewayclass -o json > "$tmp/gc.json" 2>/dev/null || echo ERR > "$tmp/gc.json"
k -n shop get gateway -o json > "$tmp/gw.json" 2>/dev/null || echo ERR > "$tmp/gw.json"
k get httproute -A -o json > "$tmp/rt.json" 2>/dev/null || echo ERR > "$tmp/rt.json"
k -n shop get deploy,svc -o json > "$tmp/shop.json" 2>/dev/null || echo ERR > "$tmp/shop.json"
k -n shop get pod -l gateway.networking.k8s.io/gateway-name=shop-gw -o json > "$tmp/dp.json" 2>/dev/null || echo ERR > "$tmp/dp.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
cp "$HOME/drills/s30/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/shop" <<'PY'
import glob, json, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
GWAPI = "v1.6.3"; NODEPORT = 30280
# Trạng thái cuối đã chốt (README, mục Gateway API): chia 90/10 giữa gateway (2.0) và gateway-v1 (1.0).
WANT_BACKENDS = [("gateway", 8080, 90), ("gateway-v1", 8080, 10)]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
crd, ngf, gc, gw, rt, shopj, dp, nodes = (load(x) for x in ("crd", "ngf", "gc", "gw", "rt", "shop", "dp", "nodes"))
def cond(o, typ):
    for c in (o.get("status") or {}).get("conditions") or []:
        if c.get("type") == typ: return c
    return {}
def items(j, kind=None): return [x for x in (j or {}).get("items", []) if kind is None or x.get("kind") == kind]
node_ip = {}
for n in items(nodes):
    for a in (n.get("status") or {}).get("addresses") or []:
        if a.get("type") == "InternalIP": node_ip[n["metadata"]["name"]] = a.get("address")
files, ferr = {}, []
for p in sorted(glob.glob(f"{shop}/*.yaml") + glob.glob(f"{shop}/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind") and (d.get("metadata") or {}).get("name"):
                files[(d["kind"], d["metadata"]["name"])] = d
    except Exception as e:
        ferr.append(f"{p.rsplit('/', 1)[-1]}: {str(e).splitlines()[0][:60]}")

# 1. CRD Gateway API kênh standard đúng bản, gatewayclasses/gateways/httproutes phục vụ v1.
bad = []
if crd is None: bad.append("thiếu CRD gatewayclasses/gateways/httproutes (hay không đọc được)")
else:
    for c in items(crd):
        n = c["metadata"]["name"].split(".")[0]; an = c["metadata"].get("annotations") or {}
        served = [v["name"] for v in c["spec"].get("versions") or [] if v.get("served")]
        if "v1" not in served: bad.append(f"{n}: không phục vụ v1")
        if an.get("gateway.networking.k8s.io/channel") != "standard": bad.append(f"{n}: kênh {an.get('gateway.networking.k8s.io/channel')}")
        if an.get("gateway.networking.k8s.io/bundle-version") != GWAPI: bad.append(f"{n}: bản {an.get('gateway.networking.k8s.io/bundle-version')} (cần {GWAPI})")
print("CRD=" + ("; ".join(bad) or "đạt"))

# 2. Control plane NGF Available, Pod trên cka-cp; GatewayClass nginx Accepted=True.
bad = []
if ngf is None or gc is None: bad.append("không đọc được namespace nginx-gateway / GatewayClass")
else:
    ds = items(ngf, "Deployment")
    if not ds: bad.append("chưa có Deployment ở namespace nginx-gateway")
    for d in ds:
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        if not r or st.get("availableReplicas") != r: bad.append(f"{d['metadata']['name']}: Available {st.get('availableReplicas', 0)}/{r}")
    where = sorted({p["spec"].get("nodeName") or "?" for p in items(ngf, "Pod")
                    if (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")})
    if ds and where != ["cka-cp"]: bad.append(f"control plane chạy trên {', '.join(where) or '(không Pod Running)'} (cần cka-cp)")
    c = {x["metadata"]["name"]: x for x in items(gc)}.get("nginx")
    if not c: bad.append("chưa có GatewayClass nginx")
    elif cond(c, "Accepted").get("status") != "True": bad.append(f"GatewayClass nginx Accepted={cond(c, 'Accepted').get('status')} {cond(c, 'Accepted').get('reason', '')}")
print("NGF=" + ("; ".join(bad) or "đạt"))

# 3. Gateway shop-gw: class nginx, một listener HTTP :80 hostname shop.local, Programmed=True; Service data plane NodePort 30280 → 80;
# ~/shop/ có Gateway shop-gw.
bad = []
g = {x["metadata"]["name"]: x for x in items(gw)}.get("shop-gw")
svcs = {x["metadata"]["name"]: x for x in items(shopj, "Service")}
deps = {x["metadata"]["name"]: x for x in items(shopj, "Deployment")}
if gw is None: bad.append("không đọc được Gateway")
elif not g: bad.append("không có Gateway shop-gw ở namespace shop")
else:
    if g["spec"].get("gatewayClassName") != "nginx": bad.append(f"gatewayClassName {g['spec'].get('gatewayClassName')}")
    ls = [(l.get("protocol"), l.get("port"), l.get("hostname")) for l in g["spec"].get("listeners") or []]
    if ("HTTP", 80, "shop.local") not in ls: bad.append(f"listeners {ls} (cần HTTP :80 shop.local)")
    pc = cond(g, "Programmed")
    if pc.get("status") != "True": bad.append(f"Programmed={pc.get('status')} {pc.get('reason', '')}".strip())
    dsv = [s for s in svcs.values() if ((s["metadata"].get("labels") or {}).get("gateway.networking.k8s.io/gateway-name")) == "shop-gw"]
    nps = sorted((p.get("port"), p.get("nodePort")) for s in dsv for p in s["spec"].get("ports") or [])
    if (80, NODEPORT) not in nps: bad.append(f"Service data plane: cổng {nps} (cần 80 → NodePort {NODEPORT}: NginxProxy nodePorts)")
if not files.get(("Gateway", "shop-gw")): bad.append("~/shop/ chưa có YAML của Gateway shop-gw")
print("GATEWAY=" + ("; ".join(bad) or "đạt"))
dpods = [p for p in items(dp) if (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")]
print("DP_IP=" + (node_ip.get(dpods[0]["spec"].get("nodeName"), "") if dpods else ""))
print("W1_IP=" + node_ip.get("cka-w1", ""))

# 4. gateway-v1: Deployment 1 replica, image shop/gateway:1.0, probe và tài nguyên như gateway, Available; Service gateway-v1 cổng
# http 8080 → targetPort http, selector chỉ chọn Pod gateway-v1; ~/shop/ có cả hai.
def ctr(d, name=None):
    cs = ((d.get("spec") or {}).get("template") or {}).get("spec", {}).get("containers") or []
    return cs[0] if cs else {}
bad = []
v1, g2 = deps.get("gateway-v1"), deps.get("gateway")
if shopj is None: bad.append("không đọc được Deployment/Service của shop")
elif not v1: bad.append("không có Deployment gateway-v1")
else:
    c1, c2 = ctr(v1), ctr(g2 or {})
    if v1["spec"].get("replicas") != 1: bad.append(f"replicas {v1['spec'].get('replicas')} (cần 1)")
    if c1.get("image") != "shop/gateway:1.0": bad.append(f"image {c1.get('image')}")
    for f in ("readinessProbe", "livenessProbe", "startupProbe", "resources"):
        if c1.get(f) != c2.get(f): bad.append(f"{f} khác gateway")
    st = v1.get("status") or {}
    if st.get("availableReplicas") != 1: bad.append(f"Available {st.get('availableReplicas', 0)}/1")
    sel = (v1["spec"].get("selector") or {}).get("matchLabels") or {}
    gsel = ((svcs.get("gateway") or {}).get("spec") or {}).get("selector") or {}
    tl = v1["spec"]["template"]["metadata"].get("labels") or {}
    if gsel and all(tl.get(k) == v for k, v in gsel.items()): bad.append("Pod gateway-v1 lọt vào Service gateway (nhãn trùng selector app=gateway)")
    s = svcs.get("gateway-v1")
    if not s: bad.append("không có Service gateway-v1")
    else:
        ps = s["spec"].get("ports") or []
        if [(p.get("name"), p.get("port")) for p in ps] != [("http", 8080)]: bad.append(f"Service gateway-v1: cổng {[(p.get('name'), p.get('port')) for p in ps]}")
        ss = s["spec"].get("selector") or {}
        if not ss or any(tl.get(k) != v for k, v in ss.items()): bad.append("selector của Service gateway-v1 không chọn Pod gateway-v1")
    for kind in ("Deployment", "Service"):
        if not files.get((kind, "gateway-v1")): bad.append(f"~/shop/ chưa có {kind} gateway-v1")
print("V1=" + ("; ".join(bad) or "đạt"))

# 5. HTTPRoute shop: parentRefs shop-gw, hostname shop.local, một rule PathPrefix /api, backendRefs theo WANT_BACKENDS; điều kiện
# Accepted=True và ResolvedRefs=True từ shop-gw; ~/shop/ có cùng HTTPRoute.
def route_shape(spec):
    spec = spec or {}
    parents = sorted((p.get("name"), p.get("namespace") or "shop") for p in spec.get("parentRefs") or [])
    rules = []
    for r in spec.get("rules") or []:
        ms = sorted(((m.get("path") or {}).get("type", "PathPrefix"), (m.get("path") or {}).get("value", "/")) for m in r.get("matches") or [{}])
        bs = sorted((b.get("name"), b.get("port"), b.get("weight", 1)) for b in r.get("backendRefs") or [])
        rules.append((ms, bs))
    return parents, sorted(spec.get("hostnames") or []), rules
bad = []
routes = {(x["metadata"]["namespace"], x["metadata"]["name"]): x for x in items(rt)}
r = routes.get(("shop", "shop"))
if rt is None: bad.append("không đọc được HTTPRoute")
elif not r: bad.append("không có HTTPRoute shop ở namespace shop")
else:
    parents, hosts, rules = route_shape(r["spec"])
    if parents != [("shop-gw", "shop")]: bad.append(f"parentRefs {parents}")
    if hosts != ["shop.local"]: bad.append(f"hostnames {hosts}")
    if rules != [([("PathPrefix", "/api")], sorted(WANT_BACKENDS))]:
        bad.append("rules " + "; ".join(f"{m} → {b}" for m, b in rules)[:120])
    ps = [p for p in (r.get("status") or {}).get("parents") or [] if (p.get("parentRef") or {}).get("name") == "shop-gw"]
    cs = {c.get("type"): c for p in ps for c in p.get("conditions") or []}
    for typ in ("Accepted", "ResolvedRefs"):
        if (cs.get(typ) or {}).get("status") != "True": bad.append(f"{typ}={(cs.get(typ) or {}).get('status')} {(cs.get(typ) or {}).get('reason', '')}".strip())
    f = files.get(("HTTPRoute", "shop"))
    if not f: bad.append("~/shop/ chưa có YAML của HTTPRoute shop")
    elif route_shape(f.get("spec")) != route_shape(r["spec"]): bad.append("YAML của HTTPRoute shop trong ~/shop/ khác cluster")
if ferr: bad.append("tệp YAML lỗi: " + ", ".join(ferr))
print("ROUTE=" + ("; ".join(bad) or "đạt"))

# 6. Đáp án: V1_HITS trong 3–20; ROUTE_BAD_REASON là lý do ResolvedRefs khi backend sai tên; HTTPRoute nháp đã xoá.
v = ans.get("V1_HITS", "")
print("HITS=" + ("đạt" if v.isdigit() and 3 <= int(v) <= 20 else f"V1_HITS='{v[:10]}' (cần số lần trúng 1.0 trên 100 request, 3–20)"))
bad = []
got = ans.get("ROUTE_BAD_REASON", "")
if got != "BackendNotFound": bad.append(f"ROUTE_BAD_REASON='{got[:30]}'")
if rt is not None:
    left = sorted(f"{ns}/{n}" for (ns, n) in routes if (ns, n) != ("shop", "shop"))
    if left: bad.append("HTTPRoute nháp còn: " + ", ".join(left))
print("BAD=" + ("; ".join(bad) or "đạt"))
PY
