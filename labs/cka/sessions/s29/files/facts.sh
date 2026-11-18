# s29 — đọc controller ingress-nginx (Deployment, Pod, Service ở namespace ingress-nginx; tìm theo nhãn
# app.kubernetes.io/component=controller nên cài bằng manifest hay Helm đều được), IngressClass, mọi Ingress của shop, Secret
# shop-tls (giải chứng chỉ bằng openssl), IP node cka-w1, /etc/hosts và một lần curl shop.local từ chính cka-cp, các tệp
# ~/shop/*.yaml (PyYAML) và ~/drills/s29/answers.env. In dạng KHOÁ=giá-trị; CA_B64 là chứng chỉ của shop-tls (base64 một dòng)
# để máy Mac gọi https bằng --cacert. Chạy trên control plane bằng user ubuntu (kubectl + python3 + openssl). Chỉ đọc. Lệnh lỗi
# hay hết giờ → tệp ghi ERR: dòng tương ứng in "không đọc được".
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
k() { kubectl --request-timeout=10s "$@"; }
k -n ingress-nginx get deploy -o json > "$tmp/deploy.json" 2>/dev/null || echo ERR > "$tmp/deploy.json"
k -n ingress-nginx get pod -o json > "$tmp/pods.json" 2>/dev/null || echo ERR > "$tmp/pods.json"
k -n ingress-nginx get svc -o json > "$tmp/svc.json" 2>/dev/null || echo ERR > "$tmp/svc.json"
k get ingressclass -o json > "$tmp/ic.json" 2>/dev/null || echo ERR > "$tmp/ic.json"
k get ingress -A -o json > "$tmp/ing.json" 2>/dev/null || echo ERR > "$tmp/ing.json"
k -n shop get svc -o json > "$tmp/shopsvc.json" 2>/dev/null || echo ERR > "$tmp/shopsvc.json"
k get node -o json > "$tmp/nodes.json" 2>/dev/null || echo ERR > "$tmp/nodes.json"
if k -n shop get secret shop-tls -o json > "$tmp/secret.json" 2>/dev/null; then
  python3 -c 'import json,sys,base64; d=json.load(open(sys.argv[1])).get("data") or {}
open(sys.argv[2],"wb").write(base64.b64decode(d.get("tls.crt",""))); open(sys.argv[3],"wb").write(base64.b64decode(d.get("tls.key","")))' \
    "$tmp/secret.json" "$tmp/tls.crt" "$tmp/tls.key" 2>/dev/null
  openssl x509 -in "$tmp/tls.crt" -noout -ext subjectAltName -subject -enddate > "$tmp/cert.txt" 2>/dev/null || echo ERR > "$tmp/cert.txt"
  # Khoá khớp chứng chỉ: so khoá công khai rút ra từ hai phía.
  a="$(openssl x509 -in "$tmp/tls.crt" -noout -pubkey 2>/dev/null | sha256sum)"; b="$(openssl pkey -in "$tmp/tls.key" -pubout 2>/dev/null | sha256sum)"
  [ -n "$a" ] && [ "$a" = "$b" ] && echo yes > "$tmp/pair.txt" || echo no > "$tmp/pair.txt"
  openssl x509 -in "$tmp/tls.crt" -noout -checkend 0 >/dev/null 2>&1 && echo yes > "$tmp/valid.txt" || echo no > "$tmp/valid.txt"
else
  echo NONE > "$tmp/secret.json"
fi
getent hosts shop.local > "$tmp/hosts.txt" 2>/dev/null || : > "$tmp/hosts.txt"
curl -s --noproxy '*' --max-time 5 -o "$tmp/cpcurl.txt" -w '%{http_code}' http://shop.local:30080/api/products > "$tmp/cpcode.txt" 2>/dev/null || :
cp "$HOME/drills/s29/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/shop" <<'PY'
import base64, glob, json, os, re, sys
import yaml
t, shop = sys.argv[1], sys.argv[2]
HTTP, HTTPS = 30080, 30443
def load(name):
    try:
        with open(f"{t}/{name}.json") as f: return json.load(f)
    except Exception: return None
def read(name):
    try: return open(f"{t}/{name}").read()
    except Exception: return ""
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        key, val = line.split("=", 1); ans[key.strip()] = val.strip().strip('"').strip("'")
dep_j, pods_j, svc_j, ic_j, ing_j, shopsvc, nodes = (load(x) for x in ("deploy", "pods", "svc", "ic", "ing", "shopsvc", "nodes"))
CTRL = "app.kubernetes.io/component"
def is_ctrl(o): return ((o.get("metadata") or {}).get("labels") or {}).get(CTRL) == "controller"
node_ip = {}
for n in (nodes or {}).get("items", []):
    for a in (n.get("status") or {}).get("addresses") or []:
        if a.get("type") == "InternalIP": node_ip[n["metadata"]["name"]] = a.get("address")

# 1. Controller: Deployment nhãn component=controller Available, Pod chạy trên cka-cp; Service NodePort http 30080, https 30443
# chọn đúng Pod controller.
bad = []
if dep_j is None or pods_j is None or svc_j is None: bad.append("không đọc được namespace ingress-nginx")
else:
    ds = [d for d in dep_j.get("items", []) if is_ctrl(d)]
    if not ds: bad.append("chưa có Deployment controller ở namespace ingress-nginx")
    for d in ds:
        st = d.get("status") or {}; r = d["spec"].get("replicas") or 0
        if not r or st.get("availableReplicas") != r: bad.append(f"{d['metadata']['name']}: Available {st.get('availableReplicas', 0)}/{r}")
    ps = [p for p in pods_j.get("items", []) if is_ctrl(p) and not p["metadata"].get("deletionTimestamp")
          and (p.get("status") or {}).get("phase") == "Running"]
    where = sorted({p["spec"].get("nodeName") or "?" for p in ps})
    if ds and where != ["cka-cp"]: bad.append(f"Pod controller chạy trên {', '.join(where) or '(không có Pod Running)'} (cần cka-cp: nodeSelector + toleration)")
    lab = ((ps or [{}])[0].get("metadata") or {}).get("labels") or {}
    np = {}
    for s in svc_j.get("items", []):
        sel = s["spec"].get("selector") or {}
        if s["spec"].get("type") == "NodePort" and sel and lab and all(lab.get(k) == v for k, v in sel.items()):
            for p in s["spec"].get("ports") or []:
                np[p.get("name")] = p.get("nodePort")
    if not np: bad.append("chưa có Service NodePort chọn Pod controller")
    else:
        if np.get("http") != HTTP: bad.append(f"nodePort http {np.get('http')} (cần {HTTP})")
        if np.get("https") != HTTPS: bad.append(f"nodePort https {np.get('https')} (cần {HTTPS})")
print("CTRL=" + ("; ".join(bad) or "đạt"))

# 2. IngressClass nginx do ingress-nginx xử lý.
if ic_j is None: print("ICLASS=không đọc được IngressClass")
else:
    ic = {i["metadata"]["name"]: i for i in ic_j.get("items", [])}
    c = (ic.get("nginx") or {}).get("spec", {}).get("controller")
    print("ICLASS=" + ("đạt" if c == "k8s.io/ingress-nginx" else ("chưa có IngressClass nginx" if "nginx" not in ic else f"IngressClass nginx: controller {c}")))

# 3. Ingress shop: class nginx, host shop.local, /api Prefix → gateway:8080, /orders Exact → order:8080, tls shop.local/shop-tls,
# đã có ADDRESS (controller nhận); ~/shop/ có cùng Ingress.
def rules_of(spec):
    out = []
    for r in (spec or {}).get("rules") or []:
        for p in ((r.get("http") or {}).get("paths")) or []:
            sv = ((p.get("backend") or {}).get("service")) or {}
            out.append((r.get("host"), p.get("path"), p.get("pathType"), sv.get("name"), (sv.get("port") or {}).get("number") or (sv.get("port") or {}).get("name")))
    return sorted(out, key=str)
def tls_of(spec): return sorted((tuple(sorted(x.get("hosts") or [])), x.get("secretName")) for x in (spec or {}).get("tls") or [])
svcport = {}
for s in (shopsvc or {}).get("items", []):
    for p in s["spec"].get("ports") or []: svcport[(s["metadata"]["name"], p.get("name"))] = p.get("port")
WANT = [("shop.local", "/api", "Prefix", "gateway", 8080), ("shop.local", "/orders", "Exact", "order", 8080)]
bad = []
ings = {(i["metadata"]["namespace"], i["metadata"]["name"]): i for i in (ing_j or {}).get("items", [])}
ing = ings.get(("shop", "shop"))
if ing_j is None: bad.append("không đọc được Ingress")
elif not ing: bad.append("không có Ingress shop ở namespace shop")
else:
    sp = ing["spec"]
    if sp.get("ingressClassName") != "nginx": bad.append(f"ingressClassName {sp.get('ingressClassName')!r} (cần nginx)")
    got = [(h, pa, pt, n, svcport.get((n, po), po) if isinstance(po, str) else po) for h, pa, pt, n, po in rules_of(sp)]
    if sorted(got, key=str) != sorted(WANT, key=str): bad.append("rules " + ", ".join(f"{h} {pa} {pt} → {n}:{po}" for h, pa, pt, n, po in got)[:200])
    if tls_of(sp) != [(("shop.local",), "shop-tls")]: bad.append(f"tls {tls_of(sp)} (cần hosts [shop.local], secretName shop-tls)")
    if not ((ing.get("status") or {}).get("loadBalancer") or {}).get("ingress"): bad.append("chưa có ADDRESS (controller chưa nhận Ingress)")
files, ferr = {}, []
for p in sorted(glob.glob(f"{shop}/*.yaml") + glob.glob(f"{shop}/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind") and (d.get("metadata") or {}).get("name"):
                files[(d["kind"], d["metadata"]["name"])] = d
    except Exception as e:
        ferr.append(f"{p.rsplit('/', 1)[-1]}: {str(e).splitlines()[0][:60]}")
f = files.get(("Ingress", "shop"))
if not f: bad.append("~/shop/ chưa có YAML của Ingress shop")
elif ing and (rules_of(f.get("spec")) != rules_of(ing["spec"]) or tls_of(f.get("spec")) != tls_of(ing["spec"])
              or (f.get("spec") or {}).get("ingressClassName") != ing["spec"].get("ingressClassName")):
    bad.append("YAML của Ingress shop trong ~/shop/ khác cluster")
if ferr: bad.append("tệp YAML lỗi: " + ", ".join(ferr))
print("INGRESS=" + ("; ".join(bad) or "đạt"))

# 4. Secret shop-tls: kiểu kubernetes.io/tls, SAN có DNS:shop.local, khoá khớp chứng chỉ, chưa hết hạn.
bad = []
raw = read("secret.json").strip()
if raw == "NONE": bad.append("không có Secret shop-tls ở namespace shop")
else:
    sec = load("secret")
    if sec is None: bad.append("không đọc được Secret shop-tls")
    else:
        if sec.get("type") != "kubernetes.io/tls": bad.append(f"type {sec.get('type')} (cần kubernetes.io/tls: kubectl create secret tls)")
        cert = read("cert.txt")
        if cert.strip() == "ERR" or not cert: bad.append("tls.crt không phải chứng chỉ PEM")
        else:
            if not re.search(r"DNS:shop\.local(,|\s|$)", cert): bad.append("chứng chỉ không có SAN DNS:shop.local (-addext subjectAltName=DNS:shop.local)")
            if read("pair.txt").strip() != "yes": bad.append("tls.key không khớp tls.crt")
            if read("valid.txt").strip() != "yes": bad.append("chứng chỉ đã hết hạn")
print("SECRET=" + ("; ".join(bad) or "đạt"))
crt = open(f"{t}/tls.crt", "rb").read() if os.path.exists(f"{t}/tls.crt") else b""
print("CA_B64=" + base64.b64encode(crt).decode())

# 5. cka-cp: /etc/hosts có shop.local trỏ IP một node của cluster, curl http://shop.local:30080/api/products từ cka-cp trả 200.
bad = []
h = read("hosts.txt").split()
if not h: bad.append("cka-cp chưa phân giải shop.local: thêm vào /etc/hosts và hosts.debian.tmpl (s01)")
elif h[0] not in node_ip.values(): bad.append(f"shop.local → {h[0]} không phải IP của node nào ({', '.join(sorted(node_ip.values()))})")
else:
    code = read("cpcode.txt").strip()
    if code != "200" or '"id":3' not in read("cpcurl.txt"): bad.append(f"curl http://shop.local:30080/api/products trên cka-cp trả {code or '000'}")
print("CPHOSTS=" + ("; ".join(bad) or "đạt"))
print("W1_IP=" + node_ip.get("cka-w1", ""))

# 6. Đáp án và Ingress nháp: PATH_EXACT_RESULT=404; không còn Ingress nào thiếu ingressClassName.
bad = []
got = ans.get("PATH_EXACT_RESULT", "")
if got != "404": bad.append(f"PATH_EXACT_RESULT='{got[:20]}'")
if ing_j is not None:
    left = sorted(f"{ns}/{n}" for (ns, n), i in ings.items() if not i["spec"].get("ingressClassName"))
    if left: bad.append("Ingress không có ingressClassName còn: " + ", ".join(left))
print("ANSWERS=" + ("; ".join(bad) or "đạt"))
PY
