# s25 — đọc sau sự cố st4-storage: mọi PVC của shop, mọi PV, StatefulSet/Pod postgres, Deployment catalog/order/reports,
# ~/shop/{order,reports}.yaml (dry-run server), dữ liệu trong PostgreSQL (psql trong postgres-0), ~/drills/s25/answers.env.
# In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi
# ERR: dòng tương ứng in "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get pvc -o json > "$tmp/pvc.json" 2>/dev/null || echo ERR > "$tmp/pvc.json"
k get pv -o json > "$tmp/pv.json" 2>/dev/null || echo ERR > "$tmp/pv.json"
k get sc -o json > "$tmp/sc.json" 2>/dev/null || echo ERR > "$tmp/sc.json"
k -n shop get sts postgres -o json > "$tmp/sts.json" 2>"$tmp/sts.err" || echo ERR > "$tmp/sts.json"
k -n shop get pod postgres-0 -o json > "$tmp/pod.json" 2>"$tmp/pod.err" || echo ERR > "$tmp/pod.json"
k -n shop get secret db-cred -o json > "$tmp/secret.json" 2>/dev/null || echo ERR > "$tmp/secret.json"
k -n shop get deploy catalog order reports --ignore-not-found -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
for f in order reports; do
  k apply --dry-run=server -f "$HOME/shop/$f.yaml" -o json > "$tmp/file-$f.json" 2>"$tmp/file-$f.err" || : > "$tmp/file-$f.json"
done
# Số sản phẩm, số đơn hàng, thời điểm (epoch) của đơn hàng đầu tiên: dữ liệu cũ phải có trước PVC data-postgres-0 hiện tại.
k -n shop exec postgres-0 -c postgres -- psql -U shop -d shop -tAc \
  "select (select count(*) from products), (select count(*) from orders), coalesce((select floor(extract(epoch from min(created_at at time zone current_setting('TimeZone'))))::bigint from orders), 0)" \
  > "$tmp/psql.txt" 2>"$tmp/psql.err" || echo ERR > "$tmp/psql.txt"
cp "$HOME/drills/s25/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
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
pvc_j, pv_j, sc_j, sts, pod, dep_j, sec = (load(x) for x in ("pvc", "pv", "sc", "sts", "pod", "deploy", "secret"))
def db_url(c):
    # DB_URL thẳng (value) hay qua secretKeyRef vào db-cred, như verify của s24 chấp nhận.
    for e in c.get("env") or []:
        if e.get("name") != "DB_URL": continue
        if "value" in e: return e["value"]
        ref = (e.get("valueFrom") or {}).get("secretKeyRef") or {}
        if ref.get("name") == "db-cred":
            v = ((sec or {}).get("data") or {}).get(ref.get("key"))
            return base64.b64decode(v).decode(errors="replace") if v else None
    return None
pvcs = {c["metadata"]["name"]: c for c in (pvc_j or {}).get("items", [])}
pvs = {p["metadata"]["name"]: p for p in (pv_j or {}).get("items", [])}
deps = {d["metadata"]["name"]: d for d in (dep_j or {}).get("items", [])}
scs = set(s["metadata"]["name"] for s in (sc_j or {}).get("items", []))
def ready(p):
    return any(c.get("type") == "Ready" and c.get("status") == "True" for c in (p.get("status") or {}).get("conditions") or [])
def avail(name):
    d = deps.get(name)
    if not d: return f"không có Deployment {name}"
    st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
    prog = [x.get("reason") for x in st.get("conditions") or [] if x.get("type") == "Progressing"]
    if not r or st.get("updatedReplicas") != r or st.get("availableReplicas") != r or prog != ["NewReplicaSetAvailable"]:
        return f"{name}: cập nhật/Available {st.get('updatedReplicas', 0)}/{st.get('availableReplicas', 0)} trên {r}, rollout {prog[0] if prog else '?'}"
    return None

# 1. Mọi PVC trong shop Bound; không PV nào của shop (claimRef namespace shop) ở Released.
bad = []
if pvc_j is None or pv_j is None: bad.append("không đọc được PV/PVC")
else:
    nb = sorted(f"{n} ({(c.get('status') or {}).get('phase')})" for n, c in pvcs.items() if (c.get("status") or {}).get("phase") != "Bound")
    if nb: bad.append(f"PVC chưa Bound: {' '.join(nb)}")
    rel = sorted(f"{n} (claim {(p['spec'].get('claimRef') or {}).get('name')})" for n, p in pvs.items()
                 if (p.get("status") or {}).get("phase") == "Released" and (p["spec"].get("claimRef") or {}).get("namespace") == "shop")
    if rel: bad.append(f"PV Released: {' '.join(rel)}")
print("BOUND=" + ("; ".join(bad) or "đạt"))

# 2. postgres: StatefulSet 1/1, postgres-0 Ready trên cka-w2, PVC data-postgres-0 Bound với PV cũ của s24 (PV có trước PVC,
#    tên không theo UID của PVC hiện tại, Retain, thư mục …_shop_data-postgres-0 trên cka-w2).
bad = []
c = pvcs.get("data-postgres-0")
if sts is None: bad.append("chưa có StatefulSet postgres" if missing("sts") else "không đọc được StatefulSet")
else:
    st = sts.get("status") or {}
    if (sts["spec"].get("replicas"), st.get("readyReplicas")) != (1, 1): bad.append(f"StatefulSet postgres ready {st.get('readyReplicas') or 0}/{sts['spec'].get('replicas')}")
if pod is None: bad.append("chưa có Pod postgres-0" if missing("pod") else "không đọc được Pod postgres-0")
else:
    if not ready(pod): bad.append("postgres-0 chưa Ready")
    if pod["spec"].get("nodeName") != "cka-w2": bad.append(f"postgres-0 trên {pod['spec'].get('nodeName') or '(chưa xếp)'}")
if pvc_j is not None and pv_j is not None:
    if not c: bad.append("chưa có PVC data-postgres-0")
    else:
        pv = pvs.get(c["spec"].get("volumeName") or "")
        if not pv: bad.append("PVC data-postgres-0 chưa có PV")
        else:
            name = pv["metadata"]["name"]
            path = (pv["spec"].get("hostPath") or {}).get("path") or (pv["spec"].get("local") or {}).get("path") or ""
            born_pv, born_pvc = epoch(pv["metadata"].get("creationTimestamp", "")), epoch(c["metadata"].get("creationTimestamp", ""))
            if name == "pvc-" + c["metadata"].get("uid", "") or not (born_pv and born_pvc and born_pv < born_pvc):
                bad.append(f"PV {name} là PV mới cấp cho PVC này, không phải PV cũ của s24 (dữ liệu cũ vẫn nằm ở PV kia)")
            elif not path.endswith("_shop_data-postgres-0"): bad.append(f"PV {name} ({path}) không phải thư mục của data-postgres-0")
            if pv["spec"].get("persistentVolumeReclaimPolicy") != "Retain": bad.append(f"PV {name}: reclaimPolicy {pv['spec'].get('persistentVolumeReclaimPolicy')} (cần Retain)")
print("POSTGRES=" + ("; ".join(bad) or "đạt"))

# 3. Dữ liệu: 3 sản phẩm, ≥ 3 đơn, đơn đầu tiên có trước PVC data-postgres-0 hiện tại (dữ liệu của s24, không phải DB mới).
bad = []
raw = open(f"{t}/psql.txt").read().strip()
m = re.fullmatch(r"(\d+)\|(\d+)\|(\d+)", raw)
if not m:
    err = open(f"{t}/psql.err").read().strip().splitlines()
    bad.append("không đọc được bảng bằng psql trong postgres-0" + (f" ({err[-1][:120]})" if err else ""))
else:
    np_, no, first = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if np_ != 3: bad.append(f"products có {np_} dòng (cần 3)")
    if no < 3: bad.append(f"orders có {no} dòng (cuối s24 có ≥ 3)")
    elif c and not (epoch(c["metadata"].get("creationTimestamp", "")) or 0) > first:
        bad.append("đơn hàng cũ nhất mới hơn PVC data-postgres-0: đây không phải dữ liệu của s24")
print("DATA=" + ("; ".join(bad) or "đạt"))

# 4. catalog, order: DB_URL đúng, Available, rollout xong; ~/shop/order.yaml khớp.
bad = []
if dep_j is None: bad.append("không đọc được Deployment")
else:
    for name in ("catalog", "order"):
        d = deps.get(name)
        if not d: bad.append(f"không có Deployment {name}"); continue
        cs = [x for x in d["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == name] or [{}]
        url = db_url(cs[0])
        if url != WANT_URL: bad.append(f"{name}: DB_URL={url}")
        p = avail(name)
        if p: bad.append(p)
    docs, e = file_docs("order")
    if e: bad.append(e)
    elif len(docs) != 1 or docs[0].get("kind") != "Deployment": bad.append("~/shop/order.yaml phải là đúng một Deployment")
    elif "order" in deps:
        f = [x for x in docs[0]["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == "order"] or [{}]
        o = [x for x in deps["order"]["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == "order"] or [{}]
        if json.dumps(f[0].get("env"), sort_keys=True) != json.dumps(o[0].get("env"), sort_keys=True): bad.append("~/shop/order.yaml khác Deployment (env): chưa apply từ tệp?")
print("APPS=" + ("; ".join(bad) or "đạt"))

# 5. reports: PVC reports Bound với StorageClass có thật, Deployment reports Available (đã ghi được heartbeat.log); tệp khớp.
bad = []
if pvc_j is None or dep_j is None or sc_j is None: bad.append("không đọc được PVC/Deployment/StorageClass")
else:
    r = pvcs.get("reports")
    if not r: bad.append("không có PVC reports")
    else:
        sc = r["spec"].get("storageClassName")
        if sc not in scs: bad.append(f"PVC reports xin StorageClass {sc} (không có)")
        if (r.get("status") or {}).get("phase") != "Bound": bad.append(f"PVC reports {(r.get('status') or {}).get('phase')}")
    p = avail("reports")
    if p: bad.append(p)
    docs, e = file_docs("reports")
    if e: bad.append(e)
    elif r:
        fs = [d for d in docs if d.get("kind") == "PersistentVolumeClaim" and d["metadata"].get("name") == "reports"]
        if not fs or fs[0]["spec"].get("storageClassName") != r["spec"].get("storageClassName"):
            bad.append("~/shop/reports.yaml khác PVC reports trong cluster: chưa apply từ tệp?")
print("REPORTS=" + ("; ".join(bad) or "đạt"))
print("PROTECTION_FINALIZER=" + ans.get("PROTECTION_FINALIZER", ""))
PY
