# s32 — kiểm đầu vào: NetworkPolicy của shop (có default-deny), ~/shop/*.yaml có Service catalog, order và NetworkPolicy
# gateway, allow-dns-egress (thứ st5-network sửa), ~/drills/s31/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane
# (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
kubectl --request-timeout=10s -n shop get networkpolicy -o json > "$tmp/np.json" 2>/dev/null || echo ERR > "$tmp/np.json"
cp "$HOME/drills/s31/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/shop" <<'PY'
import glob, json, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
try: np = json.load(open(f"{t}/np.json")).get("items", [])
except Exception: np = None
files = set()
for p in glob.glob(f"{shop}/*.yaml") + glob.glob(f"{shop}/*.yml"):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind"): files.add((d["kind"], (d.get("metadata") or {}).get("name")))
    except Exception: pass
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'").lower()
bad = []
if np is None: bad.append("không đọc được NetworkPolicy của shop")
else:
    deny = [p for p in np if not (p["spec"].get("podSelector") or {}) and sorted(p["spec"].get("policyTypes") or []) == ["Egress", "Ingress"]
            and not p["spec"].get("ingress") and not p["spec"].get("egress")]
    if not deny: bad.append("chưa có default-deny trong shop")
for n in ("gateway", "allow-dns-egress"):
    if ("NetworkPolicy", n) not in files: bad.append(f"~/shop/ chưa có NetworkPolicy {n}")
print("NP=" + ("; ".join(bad) or "đạt"))
bad = []
for n in ("catalog", "order"):
    if ("Service", n) not in files: bad.append(f"~/shop/ chưa có Service {n}")
if ans.get("DEFAULT_NS_TO_CATALOG") not in ("blocked", "block", "timeout", "chặn", "bị chặn"): bad.append("DEFAULT_NS_TO_CATALOG của s31 sai")
if ans.get("DRAFT_TWO_PEERS") not in ("open", "opened", "mở", "ok"): bad.append("DRAFT_TWO_PEERS của s31 sai")
print("S31=" + ("; ".join(bad) or "đạt"))
PY
