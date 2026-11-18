# s31 — đọc NetworkPolicy của shop, ~/shop/*.yaml (PyYAML), Deployment/StatefulSet/HPA của shop, controller ingress-nginx và
# NGF, IP các node, ~/drills/s31/answers.env; rồi THỬ THẬT các luồng: `kubectl exec` vào Pod thật của từng service (image Java
# chỉ có bash + timeout: mở kết nối bằng /dev/tcp, tối đa 3 giây; image nginx của data plane dùng busybox wget), và từ một Pod busybox
# trong namespace tạm lab-verify-s31-… (spec 8.4, xoá trước khi thoát) tới catalog. Luồng bị chặn tốn 3 giây, không treo.
# In dạng KHOÁ=giá-trị; DP_IP/W1_IP cho các lệnh curl từ Mac của verify. Chạy trên control plane bằng user ubuntu (kubectl +
# python3). Chỉ đọc trạng thái buổi học tạo ra. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được".
tmp="$(mktemp -d)"
ns="lab-verify-s31-$(date +%s)-$$"
trap 'kubectl delete namespace "$ns" --ignore-not-found --wait=false >/dev/null 2>&1; rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get networkpolicy -o json > "$tmp/np.json" 2>/dev/null || echo ERR > "$tmp/np.json"
k -n shop get deploy,sts,hpa -o json > "$tmp/shop.json" 2>/dev/null || echo ERR > "$tmp/shop.json"
k -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k get deploy -n ingress-nginx -o json > "$tmp/ing.json" 2>/dev/null || echo ERR > "$tmp/ing.json"
k get deploy -n nginx-gateway -o json > "$tmp/ngf.json" 2>/dev/null || echo ERR > "$tmp/ngf.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
cp "$HOME/drills/s31/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"

# Một Pod Running, chưa bị xoá, Ready của nhãn đã cho (rỗng nếu không có).
pod() {
  k -n shop get pod -l "$1" -o jsonpath='{range .items[*]}{.metadata.name} {.status.phase} {.status.conditions[?(@.type=="Ready")].status} {.metadata.deletionTimestamp}{"\n"}{end}' 2>/dev/null |
    awk '$2=="Running" && $3=="True" && NF==3 {print $1; exit}'
}
# tcp <tên luồng> <Pod> <container> <host> <cổng>: tra tên (2 giây) rồi mở TCP bằng bash /dev/tcp trong container (3 giây). open / timeout (gói bị
# bỏ: NetworkPolicy) / refused (không ai nghe, Service không có endpoint) / dns (không phân giải được) / nopod.
tcp() {
  local out rc r
  if [ -z "$2" ]; then echo "$1 nopod" >> "$tmp/flows.txt"; return; fi
  # Tra tên riêng (tối đa 2 giây, mã 9) để DNS hỏng không bị đọc thành "gói bị chặn".
  out="$(k -n shop exec "$2" -c "$3" -- bash -c "timeout 2 getent hosts $4 >/dev/null || exit 9; timeout 3 bash -c 'exec 3<>/dev/tcp/$4/$5'" 2>&1)"; rc=$?
  case "$rc" in
    0) r=open ;;
    124) r=timeout ;;
    9) r=dns ;;
    *) case "$out" in
         *refused*) r=refused ;;
         *"not known"*|*"Temporary failure"*|*"No address"*) r=dns ;;
         *) r="err$rc" ;;
       esac ;;
  esac
  echo "$1 $r" >> "$tmp/flows.txt"
}
: > "$tmp/flows.txt"
gw=$(pod app=gateway); v1=$(pod app=gateway-v1); cat=$(pod app=catalog); ord=$(pod app=order)
tcp gateway-catalog "$gw" gateway catalog 8080
tcp gateway-order "$gw" gateway order 8080
tcp gateway-v1-catalog "$v1" gateway catalog 8080
tcp gateway-v1-order "$v1" gateway order 8080
tcp order-catalog "$ord" order catalog 8080
tcp order-postgres "$ord" order postgres-0.postgres 5432
tcp order-postgres-rw "$ord" order postgres-rw 5432
tcp catalog-postgres "$cat" catalog postgres-0.postgres 5432
tcp catalog-order "$cat" catalog order 8080
tcp gateway-postgres "$gw" gateway postgres-rw 5432
# DNS từ order (glibc getent qua /etc/resolv.conf của Pod: tới kube-dns 10.96.0.10, tức CoreDNS ở kube-system).
if [ -n "$ord" ]; then
  if k -n shop exec "$ord" -c order -- timeout 5 getent hosts catalog.shop.svc.cluster.local >/dev/null 2>&1; then echo "order-dns open" >> "$tmp/flows.txt"
  else echo "order-dns fail" >> "$tmp/flows.txt"; fi
else echo "order-dns nopod" >> "$tmp/flows.txt"; fi
# Data plane của shop-gw (nginx, có busybox wget/nc) tới gateway-v1: 10% request của HTTPRoute đi đường này, nên thử thẳng
# thay vì đếm.
dp=$(pod gateway.networking.k8s.io/gateway-name=shop-gw)
if [ -n "$dp" ]; then
  out=$(k -n shop exec "$dp" -c nginx -- wget -q -T 3 -O /dev/null http://gateway-v1:8080/api/info 2>&1 && echo OPEN)
  case "$out" in *OPEN*) r=open ;; *"timed out"*) r=timeout ;; *refused*) r=refused ;; *"bad address"*) r=dns ;; *) r=err ;; esac
  echo "dataplane-gateway-v1 $r" >> "$tmp/flows.txt"
else echo "dataplane-gateway-v1 nopod" >> "$tmp/flows.txt"; fi

# Từ ngoài shop: Pod busybox trong namespace tạm (không NetworkPolicy nào chọn nó) gọi catalog. DNS của Pod tạm phải chạy để
# "bị chặn" là do NetworkPolicy chứ không do tên.
if k create namespace "$ns" >/dev/null 2>&1 && k -n "$ns" apply -f - >/dev/null 2>&1 <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: probe
spec:
  terminationGracePeriodSeconds: 0
  containers:
  - name: c
    image: busybox:1.37
    command: ["sleep", "3600"]
YAML
then
  if kubectl -n "$ns" wait --for=condition=Ready pod/probe --timeout=90s >/dev/null 2>&1; then
    out=$(k -n "$ns" exec probe -- sh -c 'nslookup catalog.shop.svc.cluster.local >/dev/null 2>&1 || echo NODNS; wget -q -T 3 -O /dev/null http://catalog.shop.svc.cluster.local:8080/actuator/health/readiness 2>&1 && echo OPEN' 2>&1)
    case "$out" in *NODNS*) r=dns ;; *OPEN*) r=open ;; *"timed out"*) r=timeout ;; *refused*) r=refused ;; *) r=err ;; esac
  else r=nopod; fi
else r=nopod; fi
echo "outside-catalog $r" >> "$tmp/flows.txt"

python3 - "$tmp" "$HOME/shop" <<'PY'
import glob, json, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
def items(j, kind=None): return [x for x in (j or {}).get("items", []) if kind is None or x.get("kind") == kind]
np, shopj, pods, ing, ngf, nodes = (load(x) for x in ("np", "shop", "pods", "ing", "ngf", "nodes"))
flows = dict(l.split(None, 1) for l in open(f"{t}/flows.txt").read().split("\n") if " " in l)
flows = {k: v.strip() for k, v in flows.items()}
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
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
pols = {x["metadata"]["name"]: x for x in items(np)}

def norm_sel(s):
    s = s or {}
    return (tuple(sorted((s.get("matchLabels") or {}).items())),
            tuple(sorted((e.get("key"), e.get("operator"), tuple(sorted(e.get("values") or []))) for e in s.get("matchExpressions") or [])))
def norm_spec(sp):
    # So YAML trong ~/shop/ với cluster sau khi điền mặc định của API (protocol TCP, policyTypes suy ra).
    sp = sp or {}
    def peers(lst):
        out = []
        for p in lst or []:
            out.append((norm_sel(p.get("podSelector")) if "podSelector" in p else None,
                        norm_sel(p.get("namespaceSelector")) if "namespaceSelector" in p else None,
                        json.dumps(p.get("ipBlock"), sort_keys=True) if p.get("ipBlock") else None))
        return tuple(sorted(out, key=str))
    def ports(lst):
        return tuple(sorted((p.get("protocol") or "TCP", str(p.get("port")), p.get("endPort")) for p in lst or []))
    ing_ = tuple(sorted(((peers(r.get("from")), ports(r.get("ports"))) for r in sp.get("ingress") or []), key=str))
    eg_ = tuple(sorted(((peers(r.get("to")), ports(r.get("ports"))) for r in sp.get("egress") or []), key=str))
    pt = sp.get("policyTypes") or (["Ingress"] + (["Egress"] if sp.get("egress") else []))
    return (norm_sel(sp.get("podSelector")), tuple(sorted(pt)), ing_, eg_)
EMPTY = ((), ())
deny = [p for p in pols.values() if norm_sel(p["spec"].get("podSelector")) == EMPTY
        and sorted(p["spec"].get("policyTypes") or []) == ["Egress", "Ingress"]
        and not p["spec"].get("ingress") and not p["spec"].get("egress")]

# 1. default-deny: podSelector {} (mọi Pod), policyTypes Ingress + Egress, không rule nào; mọi NetworkPolicy của shop có YAML
# trong ~/shop/ khớp cluster.
bad = []
if np is None: bad.append("không đọc được NetworkPolicy của shop")
elif not pols: bad.append("namespace shop chưa có NetworkPolicy nào")
elif not deny:
    d = pols.get("default-deny")
    bad.append("chưa có policy podSelector {} + policyTypes [Ingress, Egress] không rule" + (f" (default-deny: policyTypes {d['spec'].get('policyTypes')})" if d else ""))
for n, p in sorted(pols.items()):
    f = files.get(("NetworkPolicy", n))
    if not f: bad.append(f"~/shop/ chưa có YAML của {n}")
    elif norm_spec(f.get("spec")) != norm_spec(p["spec"]): bad.append(f"YAML của {n} trong ~/shop/ khác cluster")
if ferr: bad.append("tệp YAML lỗi: " + ", ".join(ferr))
print("DENY=" + ("; ".join(bad) or "đạt"))

# 2. Egress DNS: một policy chọn mọi Pod (podSelector {}), egress tới một phần tử có CẢ namespaceSelector kube-system VÀ
# podSelector k8s-app=kube-dns, cổng 53 UDP và TCP; order phân giải được catalog.shop.svc.cluster.local.
def ns_sel_is(sel, name):
    m = (sel or {}).get("matchLabels") or {}
    ex = (sel or {}).get("matchExpressions") or []
    return m.get("kubernetes.io/metadata.name") == name or any(
        e.get("key") == "kubernetes.io/metadata.name" and e.get("operator") == "In" and (e.get("values") or []) == [name] for e in ex)
def dns_rule(r):
    pts = {((p.get("protocol") or "TCP"), str(p.get("port"))) for p in r.get("ports") or []}
    peers = r.get("to") or []
    ok_peer = any("namespaceSelector" in x and "podSelector" in x and ns_sel_is(x["namespaceSelector"], "kube-system")
                  and ((x["podSelector"] or {}).get("matchLabels") or {}).get("k8s-app") == "kube-dns" for x in peers)
    return ok_peer and {("UDP", "53"), ("TCP", "53")} <= pts
bad = []
dns_pols = [n for n, p in pols.items() if norm_sel(p["spec"].get("podSelector")) == EMPTY and any(dns_rule(r) for r in p["spec"].get("egress") or [])]
if np is None: bad.append("không đọc được NetworkPolicy")
elif not dns_pols:
    bad.append("chưa có egress DNS cho mọi Pod: một phần tử to có cả namespaceSelector kube-system và podSelector k8s-app=kube-dns, UDP+TCP 53")
if flows.get("order-dns") != "open": bad.append(f"order không phân giải được catalog.shop.svc.cluster.local ({flows.get('order-dns', '?')})")
print("DNS=" + ("; ".join(bad) or "đạt"))

# 3. Từ ngoài shop: Pod tạm trong namespace tạm của verify tới catalog:8080 phải bị chặn (hết giờ), DNS của Pod tạm vẫn chạy.
r = flows.get("outside-catalog", "?")
print("OUTSIDE=" + {"timeout": "đạt", "open": "Pod ở namespace khác vẫn gọi được catalog:8080 (chưa chặn)",
                    "dns": "Pod tạm không phân giải được catalog.shop (DNS của cluster?)",
                    "nopod": "không tạo được Pod tạm busybox:1.37 trong namespace tạm",
                    "refused": "catalog từ chối kết nối (Service không có endpoint?)"}.get(r, f"Pod tạm → catalog: {r}"))

# 4. Luồng trong shop, thử từ Pod thật: các luồng của ứng dụng mở, luồng không cần thiết bị chặn.
WANT_OPEN = ["gateway-catalog", "gateway-order", "gateway-v1-catalog", "gateway-v1-order", "order-catalog", "order-postgres",
             "order-postgres-rw", "catalog-postgres", "dataplane-gateway-v1"]
WANT_BLOCKED = ["catalog-order", "gateway-postgres"]
def arrow(f):
    src = next(s for s in ("gateway-v1", "dataplane", "gateway", "catalog", "order") if f.startswith(s + "-"))
    return src.replace("dataplane", "shop-gw-nginx") + "→" + f[len(src) + 1:]
bad = []
for f in WANT_OPEN:
    v = flows.get(f, "?")
    if v != "open": bad.append(f"{arrow(f)}: {v}")
for f in WANT_BLOCKED:
    v = flows.get(f, "?")
    if v != "timeout": bad.append(f"{arrow(f)}: {v} (cần bị chặn)")
print("FLOWS=" + ("; ".join(bad) or "đạt"))

# 5–6. Dưới default-deny: IP cho curl từ Mac; HPA catalog còn số liệu CPU; các Deployment và postgres-0 sẵn sàng.
dpods = [p for p in items(pods) if ((p["metadata"].get("labels") or {}).get("gateway.networking.k8s.io/gateway-name") == "shop-gw")
         and (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")]
print("DENY_OK=" + ("1" if deny else "0"))
print("DP_IP=" + (node_ip.get(dpods[0]["spec"].get("nodeName"), "") if dpods else ""))
print("W1_IP=" + node_ip.get("cka-w1", ""))
bad = []
if not deny: bad.append("chưa có default-deny: chưa có gì để chứng minh")
hpa = {x["metadata"]["name"]: x for x in items(shopj, "HorizontalPodAutoscaler")}.get("catalog")
if shopj is None: bad.append("không đọc được Deployment/HPA của shop")
elif not hpa: bad.append("không có HPA catalog")
else:
    cur = [m for m in (hpa.get("status") or {}).get("currentMetrics") or []
           if ((m.get("resource") or {}).get("current") or {}).get("averageUtilization") is not None]
    sa = [c for c in (hpa.get("status") or {}).get("conditions") or [] if c.get("type") == "ScalingActive"]
    if not cur or not sa or sa[0].get("status") != "True":
        bad.append("HPA catalog không có số liệu CPU" + (f" ({sa[0].get('reason')})" if sa else ""))
deps = {x["metadata"]["name"]: x for x in items(shopj, "Deployment")}
for n in ("gateway", "gateway-v1", "catalog", "order", "shop-gw-nginx"):
    d = deps.get(n)
    if shopj is not None and not d: bad.append(f"không có Deployment {n}")
    elif d:
        r_ = d["spec"].get("replicas") or 0; a_ = (d.get("status") or {}).get("availableReplicas") or 0
        if not r_ or a_ != r_: bad.append(f"{n} Available {a_}/{r_}")
sts = {x["metadata"]["name"]: x for x in items(shopj, "StatefulSet")}.get("postgres")
if shopj is not None and (not sts or (sts.get("status") or {}).get("readyReplicas") != 1): bad.append("postgres chưa 1/1 Ready")
for label, j in (("ingress-nginx", ing), ("nginx-gateway", ngf)):
    ds = items(j)
    if j is None or not ds: bad.append(f"không đọc được controller ở {label}")
    for d in ds:
        r_ = d["spec"].get("replicas") or 0; a_ = (d.get("status") or {}).get("availableReplicas") or 0
        if a_ != r_: bad.append(f"{label}/{d['metadata']['name']} Available {a_}/{r_}")
print("HEALTH=" + ("; ".join(bad) or "đạt"))

# 7. Đáp án: DEFAULT_NS_TO_CATALOG=blocked, DRAFT_TWO_PEERS=open; NetworkPolicy nháp allow-probe đã xoá.
def word(v):
    v = (v or "").strip().lower()
    return {"blocked": "blocked", "block": "blocked", "timeout": "blocked", "chặn": "blocked", "bị chặn": "blocked",
            "open": "open", "opened": "open", "mở": "open", "ok": "open"}.get(v, v)
bad = []
if word(ans.get("DEFAULT_NS_TO_CATALOG")) != "blocked": bad.append(f"DEFAULT_NS_TO_CATALOG='{ans.get('DEFAULT_NS_TO_CATALOG', '')[:20]}'")
if word(ans.get("DRAFT_TWO_PEERS")) != "open": bad.append(f"DRAFT_TWO_PEERS='{ans.get('DRAFT_TWO_PEERS', '')[:20]}'")
if "allow-probe" in pols: bad.append("NetworkPolicy nháp allow-probe còn")
print("ANSWERS=" + ("; ".join(bad) or "đạt"))
PY
