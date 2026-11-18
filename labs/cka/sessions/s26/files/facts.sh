# s26 — đọc Pod catalog (mọi Pod đang chạy), IPPool của Calico (chế độ encapsulation), Deployment/StatefulSet của shop,
# khối IPAM của từng node, ~/drills/s26/answers.env. In dạng KHOÁ=giá-trị, cùng ROUTE_IP (IP hiện tại của Pod mà đáp án chỉ)
# để verify hỏi tiếp trên node đó (route, interface, /etc/cni/net.d). Chạy trên control plane bằng user ubuntu (kubectl + python3). Chỉ đọc. Lệnh lỗi hay
# hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get pod -l app=catalog -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k get ippools.crd.projectcalico.org -o json > "$tmp/pools.json" 2>/dev/null || echo ERR > "$tmp/pools.json"
k get blockaffinities.crd.projectcalico.org -o json > "$tmp/blocks.json" 2>/dev/null || echo ERR > "$tmp/blocks.json"
k -n shop get deploy gateway catalog order -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get sts postgres -o json > "$tmp/sts.json" 2>/dev/null || echo ERR > "$tmp/sts.json"
cp "$HOME/drills/s26/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
stat -c %Y "$HOME/drills/s26/answers.env" > "$tmp/mtime" 2>/dev/null || echo 0 > "$tmp/mtime"
python3 - "$tmp" <<'PY'
import calendar, hashlib, ipaddress, json, sys, time
t = sys.argv[1]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
pods, pools, blocks, dep_j, sts = (load(x) for x in ("pods", "pools", "blocks", "deploy", "sts"))
mtime = int(open(f"{t}/mtime").read().strip() or 0)
def epoch(ts):
    try: return calendar.timegm(time.strptime(ts, "%Y-%m-%dT%H:%M:%SZ"))
    except Exception: return None
def veth(p):
    # Tên đầu veth trên node mà Calico đặt cho Pod: "cali" + 11 ký tự đầu SHA-1 của "<namespace>.<tên Pod>".
    return "cali" + hashlib.sha1(f"{p['metadata']['namespace']}.{p['metadata']['name']}".encode()).hexdigest()[:11]
def in_node_block(addr, nd):
    try: a = ipaddress.ip_address(addr)
    except Exception: return False
    return any(a in ipaddress.ip_network(b["spec"]["cidr"]) for b in (blocks or {}).get("items", [])
               if b["spec"].get("node") == nd and b["spec"].get("state", "confirmed") == "confirmed")
ip, node = ans.get("CATALOG_POD_IP", ""), ans.get("CATALOG_NODE", "")
print("ANS_IP=" + ip); print("ANS_NODE=" + node)
print("ANS_TUNNEL=" + ans.get("TUNNEL_IFACE", "")); print("ANS_VETH=" + ans.get("HOST_VETH", "")); print("ANS_CNI=" + ans.get("CNI_CONF", ""))

# 1. CATALOG_POD_IP, CATALOG_NODE: IP và node của một Pod catalog đang chạy lúc chấm (bất kỳ Pod nào).
bad = []
if pods is None: bad.append("không đọc được Pod catalog")
else:
    run = {(p.get("status") or {}).get("podIP"): p for p in pods.get("items", [])
           if (p.get("status") or {}).get("phase") == "Running" and not p["metadata"].get("deletionTimestamp")}
    p = run.get(ip)
    # VM khởi động lại: Pod giữ tên (nên giữ tên veth) nhưng sandbox mới nhận IP mới. Nhận đáp án cũ khi Pod mang đúng
    # HOST_VETH chạy trên CATALOG_NODE, container của nó khởi động sau lúc ghi answers.env, và IP cũ nằm trong khối IPAM của node.
    q = next((x for x in run.values() if veth(x) == ans.get("HOST_VETH")), None)
    started = epoch(((((q or {}).get("status") or {}).get("containerStatuses") or [{}])[0].get("state") or {}).get("running", {}).get("startedAt", ""))
    if not ip: bad.append("thiếu CATALOG_POD_IP")
    elif p and p["spec"].get("nodeName") != node: bad.append(f"CATALOG_NODE='{node[:20]}', Pod {p['metadata']['name']} chạy trên {p['spec'].get('nodeName')}")
    elif p: print("ROUTE_IP=" + ip)
    elif q and q["spec"].get("nodeName") == node and started and started > mtime and in_node_block(ip, node):
        print("ROUTE_IP=" + q["status"]["podIP"])
    else: bad.append(f"CATALOG_POD_IP={ip[:20]} không phải IP của Pod catalog nào đang chạy (hiện có: {' '.join(sorted(x for x in run if x))})")
print("POD_OK=" + ("; ".join(bad) or "đạt"))

# 2. Chế độ encapsulation của IPPool mặc định → interface tunnel cần có.
want = ""
if pools is None: print("WANT_TUNNEL=ERR")
else:
    sp = [x["spec"] for x in pools.get("items", []) if not x["spec"].get("disabled")]
    if sp:
        s = sp[0]
        if s.get("ipipMode", "Never") != "Never": want = "tunl0"
        elif s.get("vxlanMode", "Never") != "Never": want = "vxlan.calico"
        else: want = "none"
        print(f"POOL_MODE=ipipMode {s.get('ipipMode', 'Never')}, vxlanMode {s.get('vxlanMode', 'Never')}")
    print("WANT_TUNNEL=" + want)

# 3. Cluster không đổi so với cuối s25: ba Deployment và postgres đủ Available.
bad = []
if dep_j is None or sts is None: bad.append("không đọc được Deployment/StatefulSet")
else:
    for d in dep_j.get("items", []):
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        if not r or st.get("availableReplicas") != r or st.get("updatedReplicas") != r: bad.append(f"{d['metadata']['name']} {st.get('availableReplicas', 0)}/{r}")
    if len(dep_j.get("items", [])) != 3: bad.append("thiếu Deployment")
    if (sts.get("status") or {}).get("readyReplicas") != sts["spec"].get("replicas"): bad.append("postgres chưa Ready")
print("SHOP=" + ("; ".join(bad) or "đạt"))
PY
