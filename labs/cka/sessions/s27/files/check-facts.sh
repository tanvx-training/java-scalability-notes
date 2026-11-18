# s27 — đầu vào (check.sh): phần bền của cuối s26. Đọc Deployment/StatefulSet của shop, IPPool Calico, /etc/cni/net.d trên
# cka-cp (cùng cấu hình Calico với worker) và ~/drills/s26/answers.env. Không đòi IP Pod catalog đã chọn ở s26 còn chạy: rollout
# ở t2 của s27 hay HPA thay Pod là chuyện bình thường giữa buổi. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu
# (kubectl + python3, sudo không mật khẩu). Chỉ đọc. Lệnh lỗi hay hết giờ → dòng tương ứng "không đọc được", không xanh.
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n shop get deploy gateway catalog order -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n shop get sts postgres -o json > "$tmp/sts.json" 2>/dev/null || echo ERR > "$tmp/sts.json"
k get ippools.crd.projectcalico.org -o json > "$tmp/pools.json" 2>/dev/null || echo ERR > "$tmp/pools.json"
sudo ls -1 /etc/cni/net.d 2>/dev/null | grep -E '\.(conflist|conf|json)$' | LC_ALL=C sort | head -n1 > "$tmp/cni.txt"
cp "$HOME/drills/s26/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" <<'PY'
import ipaddress, json, re, sys
t = sys.argv[1]
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
dep_j, sts, pools = (load(x) for x in ("deploy", "sts", "pools"))

# 1. shop như cuối s26: ba Deployment và postgres đủ Available.
bad = []
if dep_j is None or sts is None: bad.append("không đọc được Deployment/StatefulSet")
else:
    if len(dep_j.get("items", [])) != 3: bad.append("thiếu Deployment")
    for d in dep_j.get("items", []):
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        if not r or st.get("availableReplicas") != r: bad.append(f"{d['metadata']['name']} {st.get('availableReplicas', 0)}/{r}")
    if (sts.get("status") or {}).get("readyReplicas") != sts["spec"].get("replicas"): bad.append("postgres chưa Ready")
print("SHOP=" + ("; ".join(bad) or "đạt"))

# 2. Đáp án s26: đủ năm khoá; phần bền (TUNNEL_IFACE theo IPPool, CNI_CONF theo net.d) đúng; phần theo Pod đúng dạng.
bad = []
want = None
if pools is None: bad.append("không đọc được IPPool")
else:
    sp = [x["spec"] for x in pools.get("items", []) if not x["spec"].get("disabled")]
    if sp:
        want = "tunl0" if sp[0].get("ipipMode", "Never") != "Never" else ("vxlan.calico" if sp[0].get("vxlanMode", "Never") != "Never" else None)
    if not want: bad.append("IPPool không có IPIP hay VXLAN")
missing = [x for x in ("CATALOG_POD_IP", "CATALOG_NODE", "TUNNEL_IFACE", "HOST_VETH", "CNI_CONF") if not ans.get(x)]
if missing: bad.append("~/drills/s26/answers.env thiếu " + ", ".join(missing))
else:
    if want and ans["TUNNEL_IFACE"] != want: bad.append(f"TUNNEL_IFACE={ans['TUNNEL_IFACE']} (IPPool: {want})")
    cni = open(f"{t}/cni.txt").read().strip()
    if ans["CNI_CONF"].rsplit("/", 1)[-1] != cni: bad.append(f"CNI_CONF={ans['CNI_CONF']} (net.d: {cni or '?'})")
    try: ok_ip = ipaddress.ip_address(ans["CATALOG_POD_IP"]) in ipaddress.ip_network("10.244.0.0/16")
    except Exception: ok_ip = False
    if not ok_ip: bad.append(f"CATALOG_POD_IP={ans['CATALOG_POD_IP'][:20]} không thuộc dải Pod")
    if ans["CATALOG_NODE"] not in ("cka-cp", "cka-w1", "cka-w2"): bad.append(f"CATALOG_NODE={ans['CATALOG_NODE'][:20]}")
    if not re.fullmatch(r"cali[0-9a-f]{11}", ans["HOST_VETH"]): bad.append(f"HOST_VETH={ans['HOST_VETH'][:20]}")
print("S26=" + ("; ".join(bad) or "đạt"))
PY
