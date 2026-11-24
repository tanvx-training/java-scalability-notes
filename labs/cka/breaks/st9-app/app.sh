# st9-app trên cka-cp (user ubuntu, sudo; kubectl, helm, python3 + PyYAML). Gọi bởi run.sh cùng thư mục; chú thích ở đó.
# Không in gì khi thành công; lỗi đầu vào thì in một dòng `lab: …` ra stderr và trả 1 trước khi gây gì.
set -e
end=$(($(date +%s) + 180))
until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; do
  [ "$(date +%s)" -lt "$end" ] || { echo "lab: apiserver chưa sẵn sàng sau 3 phút" >&2; exit 1; }
  sleep 2
done
sudo install -d -m 700 /root/.lab/st9-app
python3 - <<'PY'
import json, secrets, subprocess, sys, time
import yaml
LAB = "/root/.lab/st9-app"
BAD_IMAGE = "shop/order:2.1"
BAD_PATH = "/actuator/health/live"

def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a, timeout=20): return run("kubectl", "--request-timeout=10s", *a, timeout=timeout)
def kj(*a):
    rc, out, _ = k(*a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def die(msg):
    sys.stderr.write(f"lab: {msg}\n"); sys.exit(1)
def put(name, text):
    rc, _, err = run("sudo", "tee", f"{LAB}/{name}", inp=text.encode())
    if rc != 0: die(f"không ghi được {LAB}/{name}: {err.strip()[:80]}")
def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def sub(m, l):
    if isinstance(m, dict): return isinstance(l, dict) and all(kk in l and sub(v, l[kk]) for kk, v in m.items())
    if isinstance(m, list): return isinstance(l, list) and len(m) == len(l) and all(sub(a, b) for a, b in zip(m, l))
    return str(m) == str(l)

# 0. Đầu vào: release shop deployed, manifest đọc được, ba Deployment có trong cluster.
rc, out, _ = run("helm", "list", "-n", "shop", "-o", "json")
try: rel = next((x for x in json.loads(out) if x.get("name") == "shop"), None)
except Exception: rel = None
if rel is None or rel.get("status") != "deployed": die("cần release shop deployed (trạng thái cuối s45); thử: ./labs/lab restore cka s45")
rc, out, _ = run("helm", "get", "manifest", "shop", "-n", "shop")
man = {}
for d in yaml.safe_load_all(out if rc == 0 else ""):
    if isinstance(d, dict) and d.get("kind") == "Deployment": man[d["metadata"]["name"]] = d["spec"]["template"]["spec"]["containers"][0]
live = {n: kj("-n", "shop", "get", "deploy", n) for n in ("catalog", "order", "gateway")}
if any(n not in man or live[n] is None for n in live): die("thiếu Deployment catalog/order/gateway trong release shop; thử: ./labs/lab restore cka s45")
rc, _, _ = run("sudo", "test", "-s", f"{LAB}/good.json")
if rc != 0: put("good.json", json.dumps({n: man[n] for n in live}, indent=1))

# 1. Về bản tốt: đúng các trường sự cố sửa (env của catalog, image của order, livenessProbe của gateway), lấy từ manifest.
FIELD = {"catalog": "env", "order": "image", "gateway": "livenessProbe"}
changed = []
for n, f in FIELD.items():
    c = live[n]["spec"]["template"]["spec"]["containers"][0]
    if f in man[n] and sub(man[n][f], c.get(f)) and (f != "env" or len(c.get(f) or []) == len(man[n][f])): continue
    patch = [{"op": "add", "path": f"/spec/template/spec/containers/0/{f}", "value": man[n][f]}]
    rc, _, err = k("-n", "shop", "patch", "deploy", n, "--type=json", "-p", json.dumps(patch))
    if rc != 0: die(f"không đưa được {n} về bản tốt: {err.strip()[:80]}")
    changed.append(n)
procs = [subprocess.Popen(["kubectl", "-n", "shop", "rollout", "status", f"deploy/{n}", "--timeout=300s"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) for n in changed]
for p in procs:
    try: p.wait(timeout=330)
    except Exception: p.kill()
if any(p.returncode != 0 for p in procs): die("shop chưa về bản tốt sau 5 phút (rollout chưa xong)")

# 2. Gây ba lỗi.
cause = f"configserver:http://config-{secrets.token_hex(2)}.shop:8888"
put("cause", cause + "\n")
for args in (("set", "env", "deploy/catalog", f"SPRING_CONFIG_IMPORT={cause}"),
             ("set", "image", "deploy/order", f"order={BAD_IMAGE}"),
             ("patch", "deploy", "gateway", "--type=json", "-p",
              json.dumps([{"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/httpGet/path", "value": BAD_PATH}]))):
    rc, _, err = k("-n", "shop", *args)
    if rc != 0: die(f"kubectl {' '.join(args[:3])} lỗi: {err.strip()[:80]}")

# 3. Chờ Pod hỏng của catalog (đã restart ≥ 1 lần hay đang CrashLoopBackOff) và order (ErrImagePull/ImagePullBackOff), tối
# đa 3 phút, rồi ghi mốc: broken (Pod của ReplicaSet mới, kèm tên ReplicaSet) và ready (Pod đang Ready, mọi namespace).
def new_pods(n):
    d = kj("-n", "shop", "get", "deploy", n)
    rev = ((d or {}).get("metadata") or {}).get("annotations", {}).get("deployment.kubernetes.io/revision")
    rs = next((r["metadata"]["name"] for r in (kj("-n", "shop", "get", "rs", "-l", f"app={n}") or {}).get("items", [])
               if r["metadata"].get("annotations", {}).get("deployment.kubernetes.io/revision") == rev), None)
    if rs is None: return None, []
    pods = [p for p in (kj("-n", "shop", "get", "pod", "-l", f"app={n}") or {}).get("items", [])
            if any(o.get("name") == rs for o in p["metadata"].get("ownerReferences") or []) and not p["metadata"].get("deletionTimestamp")]
    return rs, pods
def cstate(p):
    cs = ((p.get("status") or {}).get("containerStatuses") or [{}])[0]
    return cs.get("restartCount", 0), ((cs.get("state") or {}).get("waiting") or {}).get("reason")
end = time.time() + 180
while True:
    crs, cp = new_pods("catalog"); ors, op = new_pods("order")
    ok_c = any(cstate(p)[0] >= 1 or cstate(p)[1] == "CrashLoopBackOff" for p in cp)
    ok_o = any(cstate(p)[1] in ("ErrImagePull", "ImagePullBackOff") for p in op)
    if (ok_c and ok_o) or time.time() > end: break
    time.sleep(3)
put("broken", "".join(f"shop/{p['metadata']['name']} {rs}\n" for rs, ps in ((crs, cp), (ors, op)) for p in ps))
pods = (kj("get", "pod", "-A") or {}).get("items", [])
put("ready", "".join(f"{p['metadata']['namespace']}/{p['metadata']['name']}\n" for p in pods if ready(p)))
PY
