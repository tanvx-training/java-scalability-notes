# s32 — phần riêng của s32 (các dòng của s31 do s31/files/facts.sh đọc): Pod dùng image netshoot (container thường, hay
# container tạm của `kubectl debug` còn chạy) ở mọi namespace, và ~/drills/s32/answers.env. In dạng KHOÁ=giá-trị. Chạy trên
# control plane bằng user ubuntu (kubectl + python3). Chỉ đọc.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
kubectl --request-timeout=10s get pod -A -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
cp "$HOME/drills/s32/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import json, re, sys
t = sys.argv[1]
try: pods = json.load(open(f"{t}/pods.json")).get("items", [])
except Exception: pods = None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
# 1. Không còn Pod netshoot: container thường dùng image nicolaka/netshoot, hay container tạm (kubectl debug) netshoot đang chạy.
if pods is None: print("NETSHOOT=không đọc được danh sách Pod")
else:
    left = []
    for p in pods:
        if p["metadata"].get("deletionTimestamp"): continue
        name = f"{p['metadata']['namespace']}/{p['metadata']['name']}"
        if any("netshoot" in (c.get("image") or "") for c in p["spec"].get("containers") or []): left.append(name)
        eph = {c["name"]: c for c in p["spec"].get("ephemeralContainers") or [] if "netshoot" in (c.get("image") or "")}
        for s in (p.get("status") or {}).get("ephemeralContainerStatuses") or []:
            if s.get("name") in eph and "running" in (s.get("state") or {}): left.append(f"{name} (kubectl debug {s['name']})")
    print("NETSHOOT=" + ("đạt" if not left else "còn " + ", ".join(left)[:70]))
# 2. FIRST_BROKEN_HOP: request http://shop.local:30080/api/products đi Mac → ingress-nginx → gateway → catalog. gateway tự trả
# 503 JSON "không kết nối được catalog" (nên Mac → controller → gateway đi được): chặng hỏng đầu tiên là gateway → catalog
# (Service catalog rỗng, và gateway mất DNS). So khoan dung: hoa thường, dấu cách, mũi tên → hay ->.
v = (ans.get("FIRST_BROKEN_HOP") or "").strip().lower().replace(" ", "").replace("→", "->").replace("=>", "->")
parts = v.split("->")
ok = len(parts) == 2 and parts[0] in ("gateway", "app=gateway", "shop/gateway") and parts[1] in ("catalog", "app=catalog", "shop/catalog")
print("HOP=" + ("đạt" if ok else f"FIRST_BROKEN_HOP='{ans.get('FIRST_BROKEN_HOP', '')[:30]}'"))
PY
