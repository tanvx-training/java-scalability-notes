# s16 — đọc trạng thái shop sau buổi sự cố, in dạng KHOÁ=giá-trị. So với trạng thái cuối s15: gateway 2 replica
# shop/gateway:2.0, catalog 2 replica shop/catalog:1.0, order 1 replica shop/order:1.0; envFrom shop-config và volume
# gateway-files trên gateway; DB_USER/DB_PASSWORD từ secretKeyRef db-cred trên catalog, order; ba probe; JAVA_OPTS (nếu
# có) chỉ gồm ký tự ASCII; ~/shop/*.yaml khớp Deployment; Pod report-once; mọi Pod của shop.
# Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
kubectl -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
kubectl -n shop get endpointslices -o json > "$tmp/eps.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/eps.json"
kubectl -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/pods.json"
kubectl -n shop get cronjob order-report -o json > "$tmp/cron.json" 2>/dev/null || echo '{}' > "$tmp/cron.json"
for d in gateway catalog order; do
  kubectl apply --dry-run=server -f "$HOME/shop/$d.yaml" -o json > "$tmp/file-$d.json" 2>"$tmp/file-$d.err" || : > "$tmp/file-$d.json"
done
python3 - "$tmp" <<'PY'
import json, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
eps = (load(f"{t}/eps.json") or {}).get("items", [])
pods = (load(f"{t}/pods.json") or {}).get("items", [])
want = {"gateway": ("shop/gateway:2.0", 2), "catalog": ("shop/catalog:1.0", 2), "order": ("shop/order:1.0", 1)}

def c0(spec): return (spec.get("containers") or [{}])[0]
def java_opts(spec):
    for e in c0(spec).get("env") or []:
        if e.get("name") == "JAVA_OPTS": return e.get("value", "")
    return None
def secret_refs(spec):
    out = []
    for e in c0(spec).get("env") or []:
        r = (e.get("valueFrom") or {}).get("secretKeyRef")
        if r: out.append(f"{e['name']}<-{r.get('name')}/{r.get('key')}")
    return " ".join(sorted(out))
def sig(spec, replicas):
    return f"image={c0(spec).get('image')} replicas={replicas} secret=[{secret_refs(spec)}] JAVA_OPTS={java_opts(spec)!r}"

for name, (img, n) in want.items():
    d = deps.get(name)
    if not d:
        for k in ("RUN", "CONF", "FILE"): print(f"{k}_{name}=không có Deployment")
        continue
    spec = d["spec"]["template"]["spec"]; st = d.get("status", {}); c = c0(spec)
    prog = [x.get("reason") for x in st.get("conditions", []) if x.get("type") == "Progressing"]
    addrs = [e for s in eps if s.get("metadata", {}).get("labels", {}).get("kubernetes.io/service-name") == name
             for e in (s.get("endpoints") or [])]
    ready = sum(1 for e in addrs if (e.get("conditions") or {}).get("ready"))
    print(f"RUN_{name}={c.get('image')} {d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)} "
          f"eps={ready}/{len(addrs)} {prog[0] if prog else '?'}")
    bad = []
    probes = {k: ((c.get(k) or {}).get("httpGet") or {}).get("path") for k in ("startupProbe", "livenessProbe", "readinessProbe")}
    if probes != {"startupProbe": "/actuator/health/liveness", "livenessProbe": "/actuator/health/liveness",
                  "readinessProbe": "/actuator/health/readiness"}: bad.append(f"probe {probes}")
    if not (c.get("lifecycle") or {}).get("preStop"): bad.append("mất preStop")
    if name == "gateway":
        if "shop-config" not in [(x.get("configMapRef") or {}).get("name") for x in c.get("envFrom") or []]:
            bad.append("mất envFrom shop-config")
        if "gateway-files" not in [(v.get("configMap") or {}).get("name") for v in spec.get("volumes") or []]:
            bad.append("mất volume gateway-files")
    else:
        if secret_refs(spec) != "DB_PASSWORD<-db-cred/DB_PASSWORD DB_USER<-db-cred/DB_USER":
            bad.append(f"secretKeyRef [{secret_refs(spec)}]")
    print(f"CONF_{name}=" + ("; ".join(bad) or "nguyên"))
    if name == "gateway":
        jo = java_opts(spec)
        if jo is None: print("JOPTS=không có JAVA_OPTS")
        elif all(32 <= ord(ch) < 127 for ch in jo): print("JOPTS=ASCII")
        else: print("JOPTS=có ký tự ngoài ASCII: " + " ".join(f"U+{ord(ch):04X}" for ch in jo if not 32 <= ord(ch) < 127))
    f = load(f"{t}/file-{name}.json")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        print(f"FILE_{name}=lỗi: {err[-1] if err else 'rỗng'}")
    else:
        fs = sig(f["spec"]["template"]["spec"], f["spec"].get("replicas"))
        ls = sig(spec, d["spec"].get("replicas"))
        print(f"FILE_{name}=" + ("khớp" if fs == ls else f"tệp: {fs} | đang chạy: {ls}"))

cron = load(f"{t}/cron.json") or {}
try: cron_img = cron["spec"]["jobTemplate"]["spec"]["template"]["spec"]["containers"][0]["image"]
except Exception: cron_img = "?"
print(f"CRON_IMAGE={cron_img}")
ro = [p for p in pods if p["metadata"]["name"] == "report-once"]
if ro:
    p = ro[0]; print(f"REPORT={c0(p['spec']).get('image')} {p.get('status', {}).get('phase')}")
else: print("REPORT=không có Pod report-once")

bad = []
for p in pods:
    n = p["metadata"]["name"]; ph = p.get("status", {}).get("phase")
    owners = [o.get("kind") for o in p["metadata"].get("ownerReferences") or []]
    if n != "report-once" and not set(owners) & {"ReplicaSet", "DaemonSet", "Job"}:
        bad.append(f"{n} (Pod lẻ)"); continue
    if ph in ("Failed", "Unknown"): bad.append(f"{n} {ph}"); continue
    for cs in (p.get("status", {}).get("initContainerStatuses") or []) + (p.get("status", {}).get("containerStatuses") or []):
        w = (cs.get("state") or {}).get("waiting")
        if w and w.get("reason") not in ("ContainerCreating", "PodInitializing"):
            bad.append(f"{n} {w.get('reason')}"); break
print("PODS=" + (", ".join(bad) if bad else "sạch"))
PY
