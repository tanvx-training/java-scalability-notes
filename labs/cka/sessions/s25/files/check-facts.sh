# s25 — kiểm đầu vào: phần của cuối s24 mà sự cố st4-storage không phá. StorageClass mặc định local-path; còn PV Retain
# từng giữ shop/data-postgres-0 (Bound, hay Released/Available khi sự cố đang diễn ra), thư mục trên cka-w2; Service postgres
# headless; ~/shop/postgres.yaml có StatefulSet postgres (volumeClaimTemplates data); catalog có DB_URL trỏ postgres-0;
# cka-w2 schedulable, chỉ cka-w2 mang role=db; ~/drills/s24/answers.env. In KHOÁ=giá-trị. Chạy trên control plane. Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k get sc -o json > "$tmp/sc.json" 2>/dev/null || echo ERR > "$tmp/sc.json"
k get pv -o json > "$tmp/pv.json" 2>/dev/null || echo ERR > "$tmp/pv.json"
k -n shop get svc postgres -o json > "$tmp/svc.json" 2>/dev/null || echo ERR > "$tmp/svc.json"
k -n shop get deploy catalog -o json > "$tmp/catalog.json" 2>/dev/null || echo ERR > "$tmp/catalog.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
python3 -c 'import sys, yaml, json; print(json.dumps([d for d in yaml.safe_load_all(open(sys.argv[1])) if d]))' "$HOME/shop/postgres.yaml" > "$tmp/file.json" 2>/dev/null || echo ERR > "$tmp/file.json"
cp "$HOME/drills/s24/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, sys
t = sys.argv[1]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
sc, pv_j, svc, cat, nodes_j, docs = (load(x) for x in ("sc", "pv", "svc", "catalog", "nodes", "file"))
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")

bad = []
if sc is None or pv_j is None: bad.append("không đọc được StorageClass/PV")
else:
    d = [s["metadata"]["name"] for s in sc.get("items", []) if (s["metadata"].get("annotations") or {}).get("storageclass.kubernetes.io/is-default-class") == "true"]
    if d != ["local-path"]: bad.append(f"StorageClass mặc định: {', '.join(d) or '(không có)'} (cần local-path)")
    pv = [p for p in pv_j.get("items", []) if (p["spec"].get("claimRef") or {}).get("name") == "data-postgres-0"
          and (p["spec"].get("claimRef") or {}).get("namespace") == "shop" and p["spec"].get("persistentVolumeReclaimPolicy") == "Retain"]
    pv += [p for p in pv_j.get("items", []) if not p["spec"].get("claimRef") and p["spec"].get("persistentVolumeReclaimPolicy") == "Retain"
           and ((p["spec"].get("hostPath") or {}).get("path") or "").endswith("_shop_data-postgres-0")]
    if not pv: bad.append("không còn PV Retain nào của shop/data-postgres-0 (dữ liệu cuối s24)")
    elif '"cka-w2"' not in json.dumps(pv[0]["spec"].get("nodeAffinity") or {}): bad.append(f"PV {pv[0]['metadata']['name']} không ghim cka-w2")
print("PV=" + ("; ".join(bad) or "đạt"))

bad = []
if svc is None: bad.append("không có Service postgres")
elif svc["spec"].get("clusterIP") != "None": bad.append("Service postgres không headless")
if not isinstance(docs, list): bad.append("không đọc được ~/shop/postgres.yaml")
else:
    s = [d for d in docs if d.get("kind") == "StatefulSet" and d["metadata"].get("name") == "postgres"]
    if not s: bad.append("~/shop/postgres.yaml không có StatefulSet postgres")
    elif not any(v["metadata"].get("name") == "data" for v in s[0]["spec"].get("volumeClaimTemplates") or []):
        bad.append("StatefulSet trong ~/shop/postgres.yaml không có volumeClaimTemplates data")
if cat is None: bad.append("không đọc được Deployment catalog")
else:
    c = [x for x in cat["spec"]["template"]["spec"].get("containers") or [] if x.get("name") == "catalog"] or [{}]
    url = next((e.get("value") for e in c[0].get("env") or [] if e.get("name") == "DB_URL"), None)
    if url != "jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop": bad.append(f"catalog: DB_URL={url}")
print("SPEC=" + ("; ".join(bad) or "đạt"))

bad = []
if nodes_j is None: bad.append("không đọc được node")
else:
    nodes = {n["metadata"]["name"]: n for n in nodes_j.get("items", [])}
    if (nodes.get("cka-w2", {}).get("spec") or {}).get("unschedulable"): bad.append("cka-w2 đang cordon")
    db = sorted(n for n, o in nodes.items() if (o["metadata"].get("labels") or {}).get("role") == "db")
    if db != ["cka-w2"]: bad.append(f"nhãn role=db trên {', '.join(db) or '(không node nào)'}")
if "persistentvolume's node affinity" not in ans.get("MOVE_REASON", "").lower(): bad.append("~/drills/s24/answers.env: MOVE_REASON chưa đúng")
if ans.get("STS_POD_DNS", "").rstrip(".") != "postgres-0.postgres.shop.svc.cluster.local": bad.append("~/drills/s24/answers.env: STS_POD_DNS chưa đúng")
print("S24=" + ("; ".join(bad) or "đạt"))
PY
