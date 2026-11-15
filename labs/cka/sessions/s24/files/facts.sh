# s24 — đọc StatefulSet/Service/Pod postgres, PVC data-postgres-0 và PV của nó, Deployment catalog/order, Secret db-cred,
# node, ~/shop/{postgres,catalog,order}.yaml (dry-run server), dữ liệu trong PostgreSQL (psql trong postgres-0), /api/products
# qua gateway, ~/drills/s24/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3).
# Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get sts postgres -o json > "$tmp/sts.json" 2>"$tmp/sts.err" || echo ERR > "$tmp/sts.json"
k -n shop get svc postgres -o json > "$tmp/svc.json" 2>"$tmp/svc.err" || echo ERR > "$tmp/svc.json"
k -n shop get pod postgres-0 -o json > "$tmp/pod.json" 2>"$tmp/pod.err" || echo ERR > "$tmp/pod.json"
k -n shop get pvc data-postgres-0 -o json > "$tmp/pvc.json" 2>"$tmp/pvc.err" || echo ERR > "$tmp/pvc.json"
k get pv -o json > "$tmp/pv.json" 2>/dev/null || echo ERR > "$tmp/pv.json"
k -n shop get deploy catalog order -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get secret db-cred -o json > "$tmp/secret.json" 2>/dev/null || echo ERR > "$tmp/secret.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
for f in postgres catalog order; do
  k apply --dry-run=server -f "$HOME/shop/$f.yaml" -o json > "$tmp/file-$f.json" 2>"$tmp/file-$f.err" || : > "$tmp/file-$f.json"
done
# Số sản phẩm, số đơn hàng, thời điểm (epoch) của đơn hàng thứ ba theo id: Pod postgres-0 phải được tạo sau đơn đó.
k -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc \
  "select (select count(*) from products), (select count(*) from orders), coalesce((select floor(extract(epoch from created_at))::bigint from orders order by id offset 2 limit 1), 0)" \
  > "$tmp/psql.txt" 2>"$tmp/psql.err" || echo ERR > "$tmp/psql.txt"
# Ngay sau khi postgres-0 được tạo lại, request đầu có thể lỗi trong lúc HikariCP thay kết nối cũ: thử tối đa 6 lần.
for i in 1 2 3 4 5 6; do
  k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products > "$tmp/products.json" 2>/dev/null \
    && grep -q '"id":3' "$tmp/products.json" && break
  echo ERR > "$tmp/products.json"; sleep 3
done
cp "$HOME/drills/s24/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import base64, calendar, json, re, sys, time
t = sys.argv[1]
WANT_URL = "jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop"
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
def missing(name):
    try: return "NotFound" in open(f"{t}/{name}.err").read()
    except Exception: return False
def epoch(ts):
    try: return calendar.timegm(time.strptime(ts, "%Y-%m-%dT%H:%M:%SZ"))
    except Exception: return None
def file_docs(name):
    f = load(f"file-{name}")
    if not f:
        err = open(f"{t}/file-{name}.err").read().strip().splitlines()
        return None, f"~/shop/{name}.yaml lỗi: {err[-1] if err else 'không có tệp'}"
    return (f.get("items") if f.get("kind") == "List" else [f]), None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
sts, svc, pod, pvc, pv_j, dep_j, sec, nodes_j = (load(x) for x in ("sts", "svc", "pod", "pvc", "pv", "deploy", "secret", "nodes"))
pvs = {p["metadata"]["name"]: p for p in (pv_j or {}).get("items", [])}
deps = {d["metadata"]["name"]: d for d in (dep_j or {}).get("items", [])}
secret = {k: base64.b64decode(v).decode(errors="replace") for k, v in ((sec or {}).get("data") or {}).items()}
def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def env_of(c, name, secrets=True):
    for e in c.get("env") or []:
        if e.get("name") != name: continue
        if "value" in e: return e["value"]
        ref = (e.get("valueFrom") or {}).get("secretKeyRef") or {}
        if secrets and ref.get("name") == "db-cred": return secret.get(ref.get("key"))
        return None
    return None
def ref_of(c, name):
    for e in c.get("env") or []:
        if e.get("name") == name:
            r = (e.get("valueFrom") or {}).get("secretKeyRef") or {}
            return f"{r.get('name')}/{r.get('key')}" if r else "giá trị thẳng"
    return None

# 1. StatefulSet + headless Service postgres; Pod postgres-0 Ready trên cka-w2; tệp khớp.
bad = []
if sts is None: bad.append("chưa có StatefulSet postgres" if missing("sts") else "không đọc được StatefulSet")
else:
    s = sts["spec"]; ps = s["template"]["spec"]
    c = [x for x in ps.get("containers") or [] if x.get("name") == "postgres"] or (ps.get("containers") or [{}])[:1]
    c = c[0]
    if s.get("serviceName") != "postgres": bad.append(f"serviceName {s.get('serviceName')} (cần postgres)")
    if s.get("replicas") != 1: bad.append(f"replicas {s.get('replicas')} (cần 1)")
    st = sts.get("status") or {}
    if st.get("readyReplicas") != 1 or st.get("currentRevision") != st.get("updateRevision"): bad.append(f"ready {st.get('readyReplicas') or 0}/1")
    if not re.fullmatch(r"(docker\.io/)?(library/)?postgres:17(\.\d+)?-alpine[0-9.]*(@sha256:[0-9a-f]{64})?", c.get("image", "")):
        bad.append(f"image {c.get('image')} (cần postgres:17…-alpine)")
    if (ps.get("nodeSelector") or {}).get("role") != "db": bad.append("thiếu nodeSelector role=db")
    r = c.get("resources") or {}
    if not ((r.get("requests") or {}).get("cpu") and (r.get("requests") or {}).get("memory") and (r.get("limits") or {}).get("memory")):
        bad.append("container postgres phải khai requests cpu/memory và limits memory")
    probe = json.dumps(((c.get("readinessProbe") or {}).get("exec") or {}).get("command") or [])
    if "pg_isready" not in probe: bad.append("readinessProbe không chạy pg_isready")
    if ref_of(c, "POSTGRES_PASSWORD") != "db-cred/DB_PASSWORD": bad.append("POSTGRES_PASSWORD phải lấy từ Secret db-cred khoá DB_PASSWORD")
    if not any(v.get("metadata", {}).get("name") == "data" for v in s.get("volumeClaimTemplates") or []):
        bad.append("thiếu volumeClaimTemplates tên data")
if svc is None: bad.append("chưa có Service postgres" if missing("svc") else "không đọc được Service")
else:
    if svc["spec"].get("clusterIP") != "None": bad.append(f"Service postgres clusterIP {svc['spec'].get('clusterIP')} (headless: None)")
    if 5432 not in [p.get("port") for p in svc["spec"].get("ports") or []]: bad.append("Service postgres không có cổng 5432")
if pod is None: bad.append("chưa có Pod postgres-0" if missing("pod") else "không đọc được Pod postgres-0")
else:
    if not ready(pod): bad.append("Pod postgres-0 chưa Ready")
    if pod["spec"].get("nodeName") != "cka-w2": bad.append(f"Pod postgres-0 trên {pod['spec'].get('nodeName') or '(chưa xếp)'} (cần cka-w2)")
    if svc is not None:
        sel = svc["spec"].get("selector") or {}
        lab = pod["metadata"].get("labels") or {}
        if not sel or any(lab.get(k) != v for k, v in sel.items()): bad.append("selector của Service postgres không chọn Pod postgres-0")
docs, e = file_docs("postgres")
if e: bad.append(e)
elif sts is not None and svc is not None:
    kinds = sorted(d.get("kind") for d in docs)
    fs = [d for d in docs if d.get("kind") == "StatefulSet"]; fv = [d for d in docs if d.get("kind") == "Service"]
    if kinds != ["Service", "StatefulSet"]: bad.append(f"~/shop/postgres.yaml phải có đúng một Service và một StatefulSet (có: {', '.join(kinds)})")
    elif json.dumps(fs[0]["spec"]["template"]["spec"].get("containers"), sort_keys=True) != json.dumps(sts["spec"]["template"]["spec"].get("containers"), sort_keys=True) \
            or fv[0]["spec"].get("clusterIP") != svc["spec"].get("clusterIP"):
        bad.append("~/shop/postgres.yaml khác cluster: chưa apply từ tệp?")
print("POSTGRES=" + ("; ".join(bad) or "đạt"))

# 2. PVC data-postgres-0 Bound (local-path, 1Gi, RWO), PV của nó Retain, ghim cka-w2; Pod postgres-0 mount nó.
bad = []
if pvc is None: bad.append("chưa có PVC data-postgres-0" if missing("pvc") else "không đọc được PVC")
else:
    sp = pvc["spec"]
    if (pvc.get("status") or {}).get("phase") != "Bound": bad.append(f"PVC data-postgres-0 {(pvc.get('status') or {}).get('phase')}")
    if sp.get("storageClassName") != "local-path": bad.append(f"storageClassName {sp.get('storageClassName')} (cần local-path)")
    if (sp.get("resources") or {}).get("requests", {}).get("storage") != "1Gi": bad.append(f"PVC xin {(sp.get('resources') or {}).get('requests', {}).get('storage')} (cần 1Gi)")
    if sp.get("accessModes") != ["ReadWriteOnce"]: bad.append(f"accessModes {sp.get('accessModes')}")
    pv = pvs.get(sp.get("volumeName") or "")
    if pv_j is None: bad.append("không đọc được PV")
    elif not pv: bad.append("PVC chưa có PV")
    else:
        if pv["spec"].get("persistentVolumeReclaimPolicy") != "Retain":
            bad.append(f"PV {pv['metadata']['name']}: reclaimPolicy {pv['spec'].get('persistentVolumeReclaimPolicy')} (cần Retain)")
        aff = json.dumps(pv["spec"].get("nodeAffinity") or {})
        if '"cka-w2"' not in aff: bad.append(f"PV {pv['metadata']['name']} không ghim cka-w2")
if pod is not None:
    claims = [(v.get("persistentVolumeClaim") or {}).get("claimName") for v in pod["spec"].get("volumes") or []]
    if "data-postgres-0" not in claims: bad.append("Pod postgres-0 không mount PVC data-postgres-0")
print("STORAGE=" + ("; ".join(bad) or "đạt"))

# 3. catalog, order: DB_URL trỏ postgres-0 (giá trị thẳng hay qua Secret db-cred), DB_USER/DB_PASSWORD từ db-cred, rollout xong; tệp khớp.
bad = []
if dep_j is None or sec is None: bad.append("không đọc được Deployment/Secret")
else:
    for name in ("catalog", "order"):
        d = deps.get(name)
        if not d: bad.append(f"không có Deployment {name}"); continue
        c = [x for x in d["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == name] or [{}]
        url = env_of(c[0], "DB_URL")
        if url != WANT_URL: bad.append(f"{name}: DB_URL={url}")
        if ref_of(c[0], "DB_USER") != "db-cred/DB_USER" or ref_of(c[0], "DB_PASSWORD") != "db-cred/DB_PASSWORD":
            bad.append(f"{name}: DB_USER/DB_PASSWORD phải lấy từ db-cred")
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        prog = [x.get("reason") for x in st.get("conditions") or [] if x.get("type") == "Progressing"]
        if not r or st.get("updatedReplicas") != r or st.get("availableReplicas") != r or prog != ["NewReplicaSetAvailable"]:
            bad.append(f"{name}: cập nhật/Available {st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)} trên {r}, rollout {prog[0] if prog else '?'}")
        docs, e = file_docs(name)
        if e: bad.append(e)
        elif len(docs) != 1 or docs[0].get("kind") != "Deployment": bad.append(f"~/shop/{name}.yaml phải là đúng một Deployment")
        else:
            fc = [x for x in docs[0]["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == name] or [{}]
            if json.dumps(fc[0].get("env"), sort_keys=True) != json.dumps(c[0].get("env"), sort_keys=True):
                bad.append(f"~/shop/{name}.yaml khác Deployment (env): chưa apply từ tệp?")
print("APPS=" + ("; ".join(bad) or "đạt"))

# 4. Dữ liệu trong PostgreSQL: 3 sản phẩm, ≥ 3 đơn; gateway trả đủ 3 sản phẩm; Pod postgres-0 tạo sau đơn thứ ba.
bad = []
raw = open(f"{t}/psql.txt").read().strip()
m = re.fullmatch(r"(\d+)\|(\d+)\|(\d+)", raw)
if not m:
    err = open(f"{t}/psql.err").read().strip().splitlines()
    bad.append("không đọc được bảng bằng psql trong postgres-0" + (f" ({err[-1][:120]})" if err else ""))
else:
    np_, no, third = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if np_ != 3: bad.append(f"bảng products có {np_} dòng (cần 3)")
    if no < 3: bad.append(f"bảng orders có {no} dòng (cần ≥ 3)")
    elif pod is not None:
        made = epoch(pod["metadata"].get("creationTimestamp", ""))
        if made is None or made <= third: bad.append("Pod postgres-0 chưa được xoá và tạo lại sau khi có 3 đơn hàng")
try:
    prods = json.load(open(f"{t}/products.json"))
    ids = sorted(p.get("id") for p in prods) if isinstance(prods, list) else []
    if ids != [1, 2, 3]: bad.append(f"gateway /api/products trả id {ids}")
except Exception:
    bad.append("gateway /api/products không trả JSON")
print("DATA=" + ("; ".join(bad) or "đạt"))

# 5. Node: cka-w2 schedulable, chỉ cka-w2 mang role=db; MOVE_REASON có "didn't match PersistentVolume's node affinity".
bad = []
if nodes_j is None: bad.append("không đọc được node")
else:
    nodes = {n["metadata"]["name"]: n for n in nodes_j.get("items", [])}
    if (nodes.get("cka-w2", {}).get("spec") or {}).get("unschedulable"): bad.append("cka-w2 còn cordon")
    db = sorted(n for n, o in nodes.items() if (o["metadata"].get("labels") or {}).get("role") == "db")
    if db != ["cka-w2"]: bad.append(f"nhãn role=db trên {', '.join(db) or '(không node nào)'} (cần chỉ cka-w2)")
mr = ans.get("MOVE_REASON", "")
if "persistentvolume's node affinity" not in mr.lower(): bad.append(f"MOVE_REASON='{mr[:80]}'")
print("MOVE=" + ("; ".join(bad) or "đạt"))
print("STS_POD_DNS=" + ans.get("STS_POD_DNS", "").rstrip("."))
PY
