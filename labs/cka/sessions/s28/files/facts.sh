# s28 — đọc Deployment và ConfigMap coredns, Service kube-dns, Service postgres-rw và EndpointSlice của nó, Pod postgres-0,
# Deployment/StatefulSet của shop, Pod nháp; tra db.shop.internal và catalog.shop.svc.cluster.local từ trong postgres-0 (một
# Pod của shop, getent của musl đi qua /etc/resolv.conf của Pod); ~/drills/s28/answers.env. In dạng KHOÁ=giá-trị. Chạy trên
# control plane bằng user ubuntu (kubectl + python3). Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng in "không đọc được".
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n kube-system get deploy coredns -o json > "$tmp/coredns.json" 2>/dev/null || echo ERR > "$tmp/coredns.json"
k -n kube-system get cm coredns -o json > "$tmp/cm.json" 2>/dev/null || echo ERR > "$tmp/cm.json"
k -n kube-system get pod -l k8s-app=kube-dns -o json > "$tmp/dnspods.json" 2>/dev/null || echo ERR > "$tmp/dnspods.json"
k -n kube-system get svc kube-dns -o json > "$tmp/kubedns.json" 2>/dev/null || echo ERR > "$tmp/kubedns.json"
k -n shop get svc -o json > "$tmp/svc.json" 2>/dev/null || echo ERR > "$tmp/svc.json"
k -n shop get endpointslice -l kubernetes.io/service-name=postgres-rw -o json > "$tmp/eps.json" 2>/dev/null || echo ERR > "$tmp/eps.json"
k -n shop get pod postgres-0 -o json > "$tmp/pod.json" 2>/dev/null || echo ERR > "$tmp/pod.json"
k -n shop get deploy gateway catalog order -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get sts postgres -o json > "$tmp/sts.json" 2>/dev/null || echo ERR > "$tmp/sts.json"
k get pod -A -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
# Tra tên từ một Pod của shop. CoreDNS vừa khởi động lại (VM bật lại, rollout restart) có thể chưa trả lời: thử tối đa 5 lần.
for i in 1 2 3 4 5; do
  k -n shop exec postgres-0 -c postgres -- sh -c 'getent hosts db.shop.internal; echo ---; getent hosts catalog.shop.svc.cluster.local; echo ---; cat /etc/resolv.conf' \
    > "$tmp/lookup.txt" 2>/dev/null && grep -q '^---' "$tmp/lookup.txt" && [ "$(sed -n '1p' "$tmp/lookup.txt")" != --- ] && break
  [ -s "$tmp/lookup.txt" ] || echo ERR > "$tmp/lookup.txt"; sleep 3
done
cp "$HOME/drills/s28/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/shop" <<'PY'
import glob, json, re, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
cd, cm, kd, svc_j, eps_j, pod, dep_j, sts, pods_j = (load(x) for x in ("coredns", "cm", "kubedns", "svc", "eps", "pod", "deploy", "sts", "pods"))
svcs = {s["metadata"]["name"]: s for s in (svc_j or {}).get("items", [])}
rw = svcs.get("postgres-rw")
rw_ip = (rw or {}).get("spec", {}).get("clusterIP")
def avail(d):
    st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
    prog = [x.get("reason") for x in st.get("conditions") or [] if x.get("type") == "Progressing"]
    return r and st.get("updatedReplicas") == r and st.get("availableReplicas") == r and prog == ["NewReplicaSetAvailable"]

# 1. CoreDNS Available; Corefile có khối hosts với "<IP postgres-rw> db.shop.internal" và fallthrough.
bad = []
if cd is None or cm is None: bad.append("không đọc được Deployment/ConfigMap coredns")
else:
    if not avail(cd):
        # Gọi tên nguyên nhân hay gặp sau `rollout restart`: Pod mới trên worker không kéo được image.
        pull = [f"{p['metadata']['name']} trên {p['spec'].get('nodeName')}" for p in (load("dnspods") or {}).get("items", [])
                for c in (p.get("status") or {}).get("containerStatuses") or []
                if ((c.get("state") or {}).get("waiting") or {}).get("reason") in ("ImagePullBackOff", "ErrImagePull")]
        if pull: bad.append("Pod coredns không kéo được image (" + ", ".join(pull) + "): k -n kube-system rollout undo deploy/coredns")
        else: bad.append("Deployment coredns chưa Available/rollout chưa xong")
    core = (cm.get("data") or {}).get("Corefile", "")
    blocks = re.findall(r"^\s*hosts\b[^{\n]*\{([^}]*)\}", core, re.M)
    hb = [b for b in blocks if re.search(r"(^|\s)db\.shop\.internal(\s|$)", b)]
    if not hb: bad.append("Corefile chưa có khối hosts chứa db.shop.internal")
    else:
        b = hb[0]
        m = re.search(r"^\s*(\S+)\s+(?:\S+\s+)*db\.shop\.internal(\s|$)", b, re.M)
        if not rw_ip: bad.append("chưa có Service postgres-rw để so IP")
        elif not m or m.group(1) != rw_ip: bad.append(f"db.shop.internal trỏ {m.group(1) if m else '?'} (ClusterIP postgres-rw: {rw_ip})")
        if not re.search(r"^\s*fallthrough\s*$", b, re.M): bad.append("khối hosts thiếu fallthrough (mọi tên khác sẽ NXDOMAIN)")
print("COREDNS=" + ("; ".join(bad) or "đạt"))

# 2. postgres-rw: ClusterIP thường, cổng 5432, selector chọn postgres-0, EndpointSlice có đúng IP postgres-0 ready; ~/shop có YAML.
bad = []
if svc_j is None or eps_j is None or pod is None: bad.append("không đọc được Service/EndpointSlice/Pod postgres-0")
elif not rw: bad.append("không có Service postgres-rw")
else:
    s = rw["spec"]
    if s.get("type") != "ClusterIP" or rw_ip in (None, "None"): bad.append(f"postgres-rw: type {s.get('type')}, clusterIP {rw_ip} (cần ClusterIP thường)")
    if [p.get("port") for p in s.get("ports") or []] != [5432]: bad.append(f"postgres-rw: cổng {[p.get('port') for p in s.get('ports') or []]} (cần 5432)")
    sel = s.get("selector") or {}; lab = pod["metadata"].get("labels") or {}
    if not sel or any(lab.get(k) != v for k, v in sel.items()): bad.append("selector của postgres-rw không chọn postgres-0")
    pip = (pod.get("status") or {}).get("podIP")
    addrs = [(a.get("addresses") or [None])[0] for e in eps_j.get("items", []) for a in e.get("endpoints") or []
             if (a.get("conditions") or {}).get("ready") and not (a.get("conditions") or {}).get("terminating")]
    if addrs != [pip]: bad.append(f"EndpointSlice postgres-rw: {addrs} (postgres-0: {pip})")
    if [p.get("port") for e in eps_j.get("items", []) for p in e.get("ports") or []][:1] != [5432]: bad.append("EndpointSlice postgres-rw không trỏ cổng 5432")
found = False
for p in sorted(glob.glob(f"{shop}/*.yaml") + glob.glob(f"{shop}/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind") == "Service" and (d.get("metadata") or {}).get("name") == "postgres-rw": found = True
    except Exception: pass
if not found: bad.append("~/shop/ chưa có YAML của Service postgres-rw")
print("PGRW=" + ("; ".join(bad) or "đạt"))

# 3. Từ postgres-0: db.shop.internal ra IP postgres-rw, catalog.shop.svc.cluster.local ra ClusterIP catalog; shop Available.
bad = []
raw = open(f"{t}/lookup.txt").read()
parts = raw.split("---\n")
if raw.strip() == "ERR" or len(parts) < 3: bad.append("không tra được tên từ postgres-0")
else:
    got = (parts[0].split() or [""])[0]
    if not rw_ip or got != rw_ip: bad.append(f"db.shop.internal → {got or '(không phân giải)'}")
    cat = (svcs.get("catalog") or {}).get("spec", {}).get("clusterIP")
    got = (parts[1].split() or [""])[0]
    if got != cat: bad.append(f"catalog.shop.svc.cluster.local → {got or '(không phân giải)'} (ClusterIP {cat})")
if dep_j is None or sts is None: bad.append("không đọc được Deployment/StatefulSet")
else:
    for d in dep_j.get("items", []):
        if not avail(d): bad.append(f"{d['metadata']['name']} chưa Available")
    if (sts.get("status") or {}).get("readyReplicas") != sts["spec"].get("replicas"): bad.append("postgres chưa Ready")
print("LOOKUP=" + ("; ".join(bad) or "đạt"))

# 4. NDOTS khớp /etc/resolv.conf của Pod shop; Pod nháp dnspolicy-lab, dns-default không còn (mọi namespace).
bad = []
m = re.search(r"ndots:(\d+)", raw)
if not m: bad.append("không đọc được ndots trong Pod")
elif ans.get("NDOTS", "") != m.group(1): bad.append(f"NDOTS='{ans.get('NDOTS', '')[:10]}'")
if pods_j is None: bad.append("không đọc được Pod")
else:
    left = sorted(f"{p['metadata']['namespace']}/{p['metadata']['name']}" for p in pods_j.get("items", []) if p["metadata"]["name"] in ("dnspolicy-lab", "dns-default"))
    if left: bad.append("Pod nháp còn: " + ", ".join(left))
print("NDOTS=" + ("; ".join(bad) or "đạt"))
ip = (kd or {}).get("spec", {}).get("clusterIP")
got = ans.get("KUBE_DNS_IP", "")
print("KUBE_DNS=" + ("không đọc được Service kube-dns" if not ip else ("đạt" if got == ip else f"KUBE_DNS_IP='{got[:20]}'")))
PY
