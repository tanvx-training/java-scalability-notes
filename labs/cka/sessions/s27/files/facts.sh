# s27 — đọc Service, Deployment, EndpointSlice của shop, IP node cka-w1, chuỗi iptables của shop/catalog:http (iptables-save
# trên control plane: kube-proxy chạy ở mọi node), chế độ kube-proxy (cổng metrics 10249 trên node), các tệp ~/shop/*.yaml
# (PyYAML, không gọi API) và ~/drills/s27/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu
# (kubectl + python3, sudo không mật khẩu). Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được".
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get svc -o json > "$tmp/svc.json" 2>/dev/null || echo ERR > "$tmp/svc.json"
k -n shop get deploy gateway catalog order -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get endpointslices -o json > "$tmp/eps.json" 2>/dev/null || echo ERR > "$tmp/eps.json"
k get node cka-w1 -o json > "$tmp/node.json" 2>/dev/null || echo ERR > "$tmp/node.json"
timeout 10 sudo iptables-save -t nat > "$tmp/nat.txt" 2>/dev/null || echo ERR > "$tmp/nat.txt"
curl -s --max-time 5 http://127.0.0.1:10249/proxyMode > "$tmp/mode.txt" 2>/dev/null || echo ERR > "$tmp/mode.txt"
cp "$HOME/drills/s27/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/shop" <<'PY'
import glob, json, re, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
NODEPORT = 30180
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
svc_j, dep_j, eps_j, node = (load(x) for x in ("svc", "deploy", "eps", "node"))
svcs = {s["metadata"]["name"]: s for s in (svc_j or {}).get("items", [])}
deps = {d["metadata"]["name"]: d for d in (dep_j or {}).get("items", [])}
# Tệp trong ~/shop/ (mọi tên tệp): tài liệu cuối cùng theo (kind, name) thắng, như `k apply -f ~/shop/`.
files, ferr = {}, []
for p in sorted(glob.glob(f"{shop}/*.yaml") + glob.glob(f"{shop}/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind") and (d.get("metadata") or {}).get("name"):
                files[(d["kind"], d["metadata"]["name"])] = d
    except Exception as e:
        ferr.append(f"{p.rsplit('/', 1)[-1]}: {str(e).splitlines()[0][:60]}")
def ports_of(dep):
    out = {}
    for c in ((dep.get("spec") or {}).get("template") or {}).get("spec", {}).get("containers") or []:
        for p in c.get("ports") or []:
            if p.get("name"): out[p["name"]] = p.get("containerPort")
    return out
def svc_port(s):
    ps = (s.get("spec") or {}).get("ports") or []
    return ps[0] if len(ps) == 1 else None

# 1. Ba Service ClusterIP: một cổng 8080 tên http, targetPort là tên một cổng có trong Pod template (trỏ 8080); ~/shop khớp.
bad = []
if svc_j is None or dep_j is None: bad.append("không đọc được Service/Deployment")
else:
    for name in ("gateway", "catalog", "order"):
        s = svcs.get(name); d = deps.get(name)
        if not s: bad.append(f"không có Service {name}"); continue
        p = svc_port(s)
        if s["spec"].get("type") != "ClusterIP": bad.append(f"{name}: type {s['spec'].get('type')}")
        if (s["spec"].get("selector") or {}) != {"app": name}: bad.append(f"{name}: selector {s['spec'].get('selector')}")
        if not p: bad.append(f"{name}: cần đúng một cổng"); continue
        if p.get("port") != 8080 or p.get("name") != "http": bad.append(f"{name}: cổng {p.get('name') or '(không tên)'}/{p.get('port')} (cần http/8080)")
        tp = p.get("targetPort")
        named = ports_of(d) if d else {}
        if not isinstance(tp, str): bad.append(f"{name}: targetPort {tp} là số (cần tên cổng)")
        elif named.get(tp) != 8080: bad.append(f"{name}: targetPort {tp} không phải cổng 8080 có tên trong Pod")
        f = files.get(("Service", name))
        if not f: bad.append(f"~/shop/ chưa có YAML của Service {name}")
        else:
            fp = ((f.get("spec") or {}).get("ports") or [{}])
            if len(fp) != 1 or fp[0].get("name") != p.get("name") or fp[0].get("port") != p.get("port") or str(fp[0].get("targetPort")) != str(tp):
                bad.append(f"YAML của Service {name} trong ~/shop/ khác cluster")
if ferr: bad.append("tệp YAML lỗi: " + ", ".join(ferr))
print("SERVICES=" + ("; ".join(bad) or "đạt"))

# 2. Deployment: containerPort 8080 tên http, rollout xong; tệp ~/shop/<tên>.yaml có cùng cổng.
bad = []
if dep_j is None: bad.append("không đọc được Deployment")
else:
    for name in ("gateway", "catalog", "order"):
        d = deps.get(name)
        if not d: bad.append(f"không có Deployment {name}"); continue
        if ports_of(d).get("http") != 8080: bad.append(f"{name}: chưa có containerPort 8080 tên http")
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        prog = [x.get("reason") for x in st.get("conditions") or [] if x.get("type") == "Progressing"]
        if not r or st.get("updatedReplicas") != r or st.get("availableReplicas") != r or prog != ["NewReplicaSetAvailable"]:
            bad.append(f"{name}: cập nhật/Available {st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)} trên {r}")
        f = files.get(("Deployment", name))
        if not f: bad.append(f"~/shop/ không có Deployment {name}")
        elif ports_of(f).get("http") != 8080: bad.append(f"Deployment {name} trong ~/shop/ thiếu cổng http (apply lại tệp sẽ xoá tên cổng)")
print("DEPLOYS=" + ("; ".join(bad) or "đạt"))

# 3. EndpointSlice của ba Service: cổng tên http trỏ 8080, số địa chỉ ready (bỏ terminating) bằng replicas.
bad = []
if eps_j is None or dep_j is None: bad.append("không đọc được EndpointSlice")
else:
    for name in ("gateway", "catalog", "order"):
        sl = [e for e in eps_j.get("items", []) if (e["metadata"].get("labels") or {}).get("kubernetes.io/service-name") == name]
        ports = sorted({(p.get("name") or "", p.get("port")) for e in sl for p in e.get("ports") or []})
        n = sum(1 for e in sl for a in e.get("endpoints") or []
                if (a.get("conditions") or {}).get("ready") and not (a.get("conditions") or {}).get("terminating"))
        r = (deps.get(name) or {}).get("spec", {}).get("replicas")
        if ports != [("http", 8080)]: bad.append(f"{name}: cổng của EndpointSlice {ports}")
        if n != r: bad.append(f"{name}: {n} địa chỉ ready, replicas {r}" + (" (Pod mới do HPA/rollout chưa Ready? chạy lại verify sau một phút)" if n < (r or 0) else ""))
print("SLICES=" + ("; ".join(bad) or "đạt"))

# 4. gateway-nodeport: NodePort 30180, cổng 8080 → targetPort tên có trong Pod gateway, selector app=gateway, có endpoint.
bad = []
s = svcs.get("gateway-nodeport")
if svc_j is None: bad.append("không đọc được Service")
elif not s: bad.append("không có Service gateway-nodeport")
else:
    p = svc_port(s) or {}
    if s["spec"].get("type") != "NodePort": bad.append(f"type {s['spec'].get('type')}")
    if p.get("nodePort") != NODEPORT: bad.append(f"nodePort {p.get('nodePort')} (cần {NODEPORT})")
    if p.get("port") != 8080: bad.append(f"port {p.get('port')}")
    if (s["spec"].get("selector") or {}) != {"app": "gateway"}: bad.append(f"selector {s['spec'].get('selector')}")
    tp = p.get("targetPort")
    if ports_of(deps.get("gateway") or {}).get(tp) != 8080 and tp != 8080: bad.append(f"targetPort {tp} không trỏ cổng 8080 của gateway")
print("NODEPORT=" + ("; ".join(bad) or "đạt"))
ip = ""
for a in ((node or {}).get("status") or {}).get("addresses") or []:
    if a.get("type") == "InternalIP": ip = a.get("address"); break
print("W1_IP=" + ip)

# 5. KUBE_SVC_CHAIN: chuỗi KUBE-SVC-… mà KUBE-SERVICES nhảy tới cho shop/catalog:http (đọc lúc chấm).
nat = open(f"{t}/nat.txt").read()
if nat.strip() == "ERR": print("SVC_CHAIN=không đọc được iptables-save")
else:
    m = re.search(r'^-A KUBE-SERVICES .*--comment "shop/catalog:http cluster IP".* -j (KUBE-SVC-[A-Z0-9]+)', nat, re.M)
    want = m.group(1) if m else None
    got = ans.get("KUBE_SVC_CHAIN", "")
    if not want: print("SVC_CHAIN=iptables chưa có chuỗi cho shop/catalog:http (cổng chưa tên http?)")
    elif got != want: print(f"SVC_CHAIN=KUBE_SVC_CHAIN='{got[:40]}'")
    else: print("SVC_CHAIN=đạt")
mode = open(f"{t}/mode.txt").read().strip()
print("NODE_MODE=" + mode)
print("PROXY_MODE=" + ans.get("PROXY_MODE", ""))

# 6. Service nháp đã xoá (không còn Service LoadBalancer nào, không còn catalog-bad); LB_EXTERNAL_IP_STATE.
bad = []
if svc_j is None: bad.append("không đọc được Service")
else:
    left = sorted(n for n, x in svcs.items() if x["spec"].get("type") == "LoadBalancer" or n == "catalog-bad")
    if left: bad.append("Service nháp còn: " + ", ".join(left))
lb = ans.get("LB_EXTERNAL_IP_STATE", "")
if lb != "<pending>": bad.append(f"LB_EXTERNAL_IP_STATE='{lb[:30]}'")
print("DRAFTS=" + ("; ".join(bad) or "đạt"))
PY
