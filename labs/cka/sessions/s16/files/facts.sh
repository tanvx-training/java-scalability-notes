# s16 — đọc trạng thái shop sau buổi sự cố, in dạng KHOÁ=giá-trị. So với trạng thái cuối s15: gateway 2 replica
# shop/gateway:2.0 không có JAVA_OPTS, catalog 2 replica shop/catalog:1.0, order 1 replica shop/order:1.0; envFrom
# shop-config và volume gateway-files trên gateway; DB_USER/DB_PASSWORD từ secretKeyRef db-cred trên catalog, order; ba
# probe, preStop; ~/shop/*.yaml khớp Deployment; Pod report-once; mọi Pod của shop.
# Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc, không chờ: đọc trạng thái hiện tại.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/deploy.json"
k -n shop get endpointslices -o json > "$tmp/eps.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/eps.json"
k -n shop get pod -o json > "$tmp/pods.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/pods.json"
k -n shop get job -o json > "$tmp/jobs.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/jobs.json"
k -n shop get cronjob order-report -o json > "$tmp/cron.json" 2>/dev/null || echo '{}' > "$tmp/cron.json"
for d in gateway catalog order; do
  k apply --dry-run=server -f "$HOME/shop/$d.yaml" -o json > "$tmp/file-$d.json" 2>"$tmp/file-$d.err" || : > "$tmp/file-$d.json"
done
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
deps = {d["metadata"]["name"]: d for d in (load(f"{t}/deploy.json") or {}).get("items", [])}
eps = (load(f"{t}/eps.json") or {}).get("items", [])
pods = (load(f"{t}/pods.json") or {}).get("items", [])
jobs = (load(f"{t}/jobs.json") or {}).get("items", [])
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
    try:
        d = deps.get(name)
        if not d:
            print(f"DEP_{name}=không có Deployment"); continue
        spec = d["spec"]["template"]["spec"]; st = d.get("status", {}); c = c0(spec)
        bad = []
        if c.get("image") != img: bad.append(f"image {c.get('image')}")
        r = f"{d['spec'].get('replicas')}/{st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)}"
        if r != f"{n}/{n}/{n}": bad.append(f"replica/cập nhật/Available {r}")
        prog = [x.get("reason") for x in st.get("conditions", []) if x.get("type") == "Progressing"]
        if prog != ["NewReplicaSetAvailable"]: bad.append(f"rollout chưa xong ({prog[0] if prog else '?'})")
        # Pod đang dừng vẫn nằm trong EndpointSlice với terminating: true tới khi object Pod bị xoá: không đếm.
        addrs = [e for s in eps if s.get("metadata", {}).get("labels", {}).get("kubernetes.io/service-name") == name
                 for e in (s.get("endpoints") or []) if not (e.get("conditions") or {}).get("terminating")]
        ready = sum(1 for e in addrs if (e.get("conditions") or {}).get("ready"))
        if (ready, len(addrs)) != (n, n): bad.append(f"EndpointSlice {ready}/{len(addrs)} ready")
        probes = {k: ((c.get(k) or {}).get("httpGet") or {}).get("path") for k in ("startupProbe", "livenessProbe", "readinessProbe")}
        if probes != {"startupProbe": "/actuator/health/liveness", "livenessProbe": "/actuator/health/liveness",
                      "readinessProbe": "/actuator/health/readiness"}: bad.append(f"probe {probes}")
        if not (c.get("lifecycle") or {}).get("preStop"): bad.append("mất preStop")
        if name == "gateway":
            if "shop-config" not in [(x.get("configMapRef") or {}).get("name") for x in c.get("envFrom") or []]:
                bad.append("mất envFrom shop-config")
            if "gateway-files" not in [(v.get("configMap") or {}).get("name") for v in spec.get("volumes") or []]:
                bad.append("mất volume gateway-files")
        elif secret_refs(spec) != "DB_PASSWORD<-db-cred/DB_PASSWORD DB_USER<-db-cred/DB_USER":
            bad.append(f"secretKeyRef [{secret_refs(spec)}]")
        f = load(f"{t}/file-{name}.json")
        if f and f.get("kind") != "Deployment":
            bad.append(f"~/shop/{name}.yaml phải là đúng một Deployment")
        elif not f:
            err = open(f"{t}/file-{name}.err").read().strip().splitlines()
            bad.append(f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'rỗng'}")
        else:
            fs, ls = sig(f["spec"]["template"]["spec"], f["spec"].get("replicas")), sig(spec, d["spec"].get("replicas"))
            if fs != ls: bad.append(f"~/shop/{name}.yaml khác Deployment: {fs}")
        print(f"DEP_{name}=" + ("; ".join(bad) or "đạt"))
        if name == "gateway":
            jo = java_opts(spec)
            if jo is None: print("JOPTS=không có JAVA_OPTS")
            else:
                odd = " ".join(f"U+{ord(ch):04X}" for ch in jo if not 32 <= ord(ch) < 127)
                print(f"JOPTS=còn JAVA_OPTS={jo!r}" + (f" (ký tự ngoài ASCII: {odd})" if odd else ""))
    except Exception as e:
        print(f"DEP_{name}=lỗi đọc: {e}")

cron = load(f"{t}/cron.json") or {}
try: cron_img = cron["spec"]["jobTemplate"]["spec"]["template"]["spec"]["containers"][0]["image"]
except Exception: cron_img = "?"
print(f"CRON_IMAGE={cron_img}")
ro = [p for p in pods if p["metadata"]["name"] == "report-once"]
if ro:
    p = ro[0]; c = c0(p["spec"])
    cmd = " ".join((c.get("command") or []) + (c.get("args") or []))
    path = "/api/orders" if re.search(r"gateway[a-z0-9.-]*:8080/api/orders\b", cmd) else "lệnh không gọi gateway …:8080/api/orders"
    print(f"REPORT={c.get('image')} {path} {p.get('status', {}).get('phase')}")
else: print("REPORT=không có Pod report-once")

# Job do CronJob order-report tạo (theo lịch hoặc create job --from): sau khi VM khởi động lại nó chạy bù lịch đã lỡ
# trong lúc gateway chưa sẵn sàng, Pod có thể thoáng ở CrashLoopBackOff. Không tính vào dòng "Pod lỗi".
cron_jobs = {j["metadata"]["name"] for j in jobs
             if any(o.get("kind") == "CronJob" and o.get("name") == "order-report" for o in j["metadata"].get("ownerReferences") or [])}
bad = []
for p in pods:
    n = p["metadata"]["name"]; ph = p.get("status", {}).get("phase")
    owners = p["metadata"].get("ownerReferences") or []
    if any(o.get("kind") == "Job" and o.get("name") in cron_jobs for o in owners): continue
    if n != "report-once" and not {o.get("kind") for o in owners} & {"ReplicaSet", "DaemonSet", "Job"}:
        bad.append(f"{n} (Pod lẻ)"); continue
    if ph in ("Failed", "Unknown"): bad.append(f"{n} {ph}"); continue
    for cs in (p.get("status", {}).get("initContainerStatuses") or []) + (p.get("status", {}).get("containerStatuses") or []):
        w = (cs.get("state") or {}).get("waiting")
        if w and w.get("reason") not in ("ContainerCreating", "PodInitializing"):
            bad.append(f"{n} {w.get('reason')}"); break
print("PODS=" + (", ".join(bad) if bad else "sạch"))
PY
