# s15 — đọc DaemonSet log-agent, Job seed, CronJob order-report, bằng chứng Job chạy tay và ~/shop/*.yaml của buổi, in
# dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc (get, apply --dry-run=server).
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=15s "$@"; }
k get nodes -o json > "$tmp/nodes.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/nodes.json"
k -n shop get ds log-agent -o json > "$tmp/ds.json" 2>/dev/null || echo '{}' > "$tmp/ds.json"
k -n shop get pod -l app=log-agent -o json > "$tmp/dspods.json" 2>/dev/null || echo '{"items":[]}' > "$tmp/dspods.json"
k -n shop get job seed -o json > "$tmp/seed.json" 2>/dev/null || echo '{}' > "$tmp/seed.json"
k -n shop get cronjob order-report -o json > "$tmp/cron.json" 2>/dev/null || echo '{}' > "$tmp/cron.json"
cp ~/drills/s15/order-report-manual.yaml "$tmp/manual.yaml" 2>/dev/null || : > "$tmp/manual.yaml"
for f in log-agent seed order-report; do
  k apply --dry-run=server -f "$HOME/shop/$f.yaml" -o json > "$tmp/file-$f.json" 2>"$tmp/file-$f.err" || : > "$tmp/file-$f.json"
done
python3 - "$tmp" <<'PY'
import json, re, sys, yaml
t = sys.argv[1]
def load(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None
def c0(spec): return (spec.get("containers") or [{}])[0]
def cmd(c): return " ".join((c.get("command") or []) + (c.get("args") or []))
GW = r"gateway[a-z0-9.-]*:8080/api/orders\b"

# DaemonSet
ds = load(f"{t}/ds.json") or {}
nodes = sorted(n["metadata"]["name"] for n in (load(f"{t}/nodes.json") or {}).get("items", []))
running = sorted(p["spec"].get("nodeName", "?") for p in (load(f"{t}/dspods.json") or {}).get("items", [])
                 if p.get("status", {}).get("phase") == "Running"
                 and all(cs.get("ready") for cs in p["status"].get("containerStatuses") or [{}]))
st = ds.get("status", {})
print(f"NODES={' '.join(nodes)}")
print(f"DS={st.get('desiredNumberScheduled', 0)}/{st.get('numberReady', 0)} {' '.join(running)}")
def ds_sig(d):
    try: s = d["spec"]["template"]["spec"]
    except Exception: return "không có DaemonSet"
    c = c0(s); img = c.get("image", "")
    hp = {v["name"] for v in s.get("volumes") or [] if (v.get("hostPath") or {}).get("path", "").rstrip("/") == "/var/log"}
    ro = sorted(m.get("mountPath", "") for m in c.get("volumeMounts") or [] if m["name"] in hp and m.get("readOnly"))
    tol = sorted(x.get("key", "") for x in s.get("tolerations") or [] if x.get("key") == "node-role.kubernetes.io/control-plane"
                 or (x.get("operator") == "Exists" and not x.get("key")))
    return f"image={img} hostPath-ro={ro} toleration={tol}"
bad = []
img = c0(ds.get("spec", {}).get("template", {}).get("spec", {})).get("image", "")
tag = img.rsplit(":", 1)[1] if ":" in img.rsplit("/", 1)[-1] else ""
if not img.split("/")[-1].startswith("busybox") or tag in ("", "latest"): bad.append(f"image {img!r}")
sig = ds_sig(ds)
if "hostPath-ro=[]" in sig: bad.append("không có mount chỉ đọc từ hostPath /var/log")
print("DSCONF=" + ("; ".join(bad) or "đạt"))

# Job seed
seed = load(f"{t}/seed.json") or {}
bad = []
if not seed: bad.append("không có Job seed")
else:
    s = seed["spec"]; c = c0(s["template"]["spec"])
    got = f"{s.get('completions')}/{s.get('backoffLimit')}/{seed.get('status', {}).get('succeeded', 0)}"
    if got != "3/2/3": bad.append(f"completions/backoffLimit/succeeded {got}")
    if not (re.search(GW, cmd(c)) and "--post-data" in cmd(c)): bad.append("lệnh không POST tới gateway …:8080/api/orders")
print("SEED=" + ("; ".join(bad) or "đạt"))

# CronJob
cron = load(f"{t}/cron.json") or {}
def cron_sig(cj):
    try:
        s = cj["spec"]; c = c0(s["jobTemplate"]["spec"]["template"]["spec"])
    except Exception: return None
    get = "GET /api/orders" if re.search(GW, cmd(c)) and "--post-data" not in cmd(c) else "lệnh không GET gateway …:8080/api/orders"
    return (f"lịch={s.get('schedule')} giữ={s.get('successfulJobsHistoryLimit')}/{s.get('failedJobsHistoryLimit')} "
            f"concurrency={s.get('concurrencyPolicy')} {get}")
cs = cron_sig(cron)
want = "lịch=*/5 * * * * giữ=2/1 concurrency=Forbid GET /api/orders"
if cs is None: print("CRON=không có CronJob order-report")
elif cs != want: print(f"CRON={cs}")
elif not cron.get("status", {}).get("lastSuccessfulTime"): print("CRON=chưa có lastSuccessfulTime")
else: print("CRON=đạt")

# Bằng chứng Job chạy tay (tệp người học lưu): Job đó có thể đã bị dọn theo successfulJobsHistoryLimit.
try:
    m = yaml.safe_load(open(f"{t}/manual.yaml")) or {}
except Exception: m = {}
bad = []
if not m: bad.append("chưa có ~/drills/s15/order-report-manual.yaml")
else:
    md = m.get("metadata", {})
    if m.get("kind") != "Job" or md.get("name") != "order-report-manual": bad.append(f"tệp là {m.get('kind')}/{md.get('name')}")
    own = [o for o in md.get("ownerReferences") or [] if o.get("kind") == "CronJob" and o.get("name") == "order-report"]
    if not own: bad.append("không có ownerReference tới CronJob/order-report")
    elif own[0].get("uid") != cron.get("metadata", {}).get("uid"): bad.append("ownerReference trỏ tới CronJob khác (uid)")
    if (md.get("annotations") or {}).get("cronjob.kubernetes.io/instantiate") != "manual":
        bad.append("thiếu annotation cronjob.kubernetes.io/instantiate=manual")
    if not any(x.get("type") == "Complete" and x.get("status") == "True" for x in m.get("status", {}).get("conditions") or []):
        bad.append("Job chưa Complete lúc lưu")
print("MANUAL=" + ("; ".join(bad) or "đạt"))

def seed_sig(j):
    s = (j or {}).get("spec", {})
    return f"completions={s.get('completions')} parallelism={s.get('parallelism')} backoffLimit={s.get('backoffLimit')}"
# Tệp trong ~/shop/
bad = []
for f, kind in (("log-agent", "DaemonSet"), ("seed", "Job"), ("order-report", "CronJob")):
    d = load(f"{t}/file-{f}.json")
    if not d:
        err = open(f"{t}/file-{f}.err").read().strip().splitlines()
        bad.append(f"{f}.yaml: {err[-1] if err else 'rỗng'}"); continue
    if d.get("kind") != kind: bad.append(f"{f}.yaml không phải đúng một {kind}"); continue
    if kind == "DaemonSet" and ds_sig(d) != ds_sig(ds): bad.append(f"log-agent.yaml khác DaemonSet: {ds_sig(d)}")
    if kind == "CronJob" and cron_sig(d) != cron_sig(cron): bad.append(f"order-report.yaml khác CronJob: {cron_sig(d)}")
    if kind == "Job" and seed_sig(d) != seed_sig(seed): bad.append(f"seed.yaml khác Job seed: {seed_sig(d)}")
print("FILES=" + ("; ".join(bad) or "đạt"))
PY
