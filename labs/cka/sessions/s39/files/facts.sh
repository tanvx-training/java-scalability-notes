# s39 — dữ kiện của verify s39: CRD shopfeatures.shop.example.com (đọc + ba lần tạo thử `--dry-run=server` để biết schema
# có chặn thật không), hai ShopFeature, release cert-manager và ba Deployment của nó, Issuer/Certificate/Secret trong shop,
# shop-tls của s29 so với ~/drills/s29/tls.crt, ~/drills/s39/answers.env. In dạng KHOÁ=giá-trị. Chạy trên cka-cp bằng
# user ubuntu (kubectl, helm, openssl, python3/PyYAML). Chỉ đọc: dry-run không lưu gì; mỗi lệnh có timeout.
python3 - "$HOME" <<'PY'
import base64, glob, json, os, subprocess, sys, tempfile
import yaml
home = sys.argv[1]
CRD = "shopfeatures.shop.example.com"
CM_CHART = "cert-manager-v1.21.3"
CM_DEPLOYS = ("cert-manager", "cert-manager-webhook", "cert-manager-cainjector")
FEATURES = {"new-checkout": (True, 20), "dark-mode": (False, 0)}

def run(*args, timeout=30, inp=None):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout, input=inp)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a, inp=None): return run("kubectl", "--request-timeout=10s", *a, inp=inp)
def kj(*a):
    rc, out, _ = k(*a, "-o", "json")
    try: return json.loads(out) if rc == 0 else None
    except Exception: return None
def cond(o, t):
    return next((c.get("status") for c in ((o or {}).get("status") or {}).get("conditions") or [] if c.get("type") == t), None)
def available(d):
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return st.get("observedGeneration", 0) >= d["metadata"]["generation"] and st.get("availableReplicas", 0) == want \
        and st.get("updatedReplicas", 0) == want
def first(s): return (s.strip().splitlines() or [""])[0][:80]

# 1. CRD: group, names, Namespaced, v1 served + storage có openAPIV3Schema; Established; schema chặn thật (dry-run server):
# rolloutPercent 150 và enabled "yes" và thiếu enabled đều bị từ chối, một resource đúng thì được nhận; explain đọc được.
bad = []
c = kj("get", "crd", CRD)
if c is None: bad.append(f"chưa có CRD {CRD}")
else:
    sp = c["spec"]; nm = sp.get("names") or {}
    if sp.get("group") != "shop.example.com": bad.append(f"group {sp.get('group')}")
    if (nm.get("kind"), nm.get("plural"), nm.get("singular")) != ("ShopFeature", "shopfeatures", "shopfeature"):
        bad.append(f"names {nm.get('kind')}/{nm.get('plural')}/{nm.get('singular')}")
    if sp.get("scope") != "Namespaced": bad.append(f"scope {sp.get('scope')}, cần Namespaced")
    v1 = next((v for v in sp.get("versions") or [] if v.get("name") == "v1"), None)
    if v1 is None or not v1.get("served") or not v1.get("storage"): bad.append("cần bản v1 served + storage")
    elif not (((v1.get("schema") or {}).get("openAPIV3Schema") or {}).get("properties") or {}).get("spec"):
        bad.append("v1 chưa có schema cho spec")
    if cond(c, "Established") != "True": bad.append("CRD chưa Established")
    def try_create(spec):
        doc = {"apiVersion": "shop.example.com/v1", "kind": "ShopFeature",
               "metadata": {"name": "lab-verify-probe", "namespace": "shop"}, "spec": spec}
        rc, out, err = k("create", "--dry-run=server", "-f", "-", "-o", "name", inp=json.dumps(doc).encode())
        return rc, err
    if not bad:
        for spec, why in (({"enabled": True, "rolloutPercent": 150}, "rolloutPercent 150"),
                          ({"enabled": "yes", "rolloutPercent": 10}, "enabled \"yes\""),
                          ({"rolloutPercent": 10}, "thiếu enabled")):
            rc, err = try_create(spec)
            if rc == 0: bad.append(f"schema nhận resource sai ({why})")
        rc, err = try_create({"enabled": True, "rolloutPercent": 50})
        if rc != 0: bad.append("schema từ chối resource đúng (enabled true, rolloutPercent 50): " + first(err)[:60])
        rc, out, _ = k("explain", "shopfeature.spec")
        if rc != 0 or "enabled" not in out or "rolloutPercent" not in out: bad.append("kubectl explain shopfeature.spec chưa có enabled/rolloutPercent")
        rc, out, _ = k("api-resources", "--namespaced=true", "--api-group=shop.example.com", "--no-headers")
        if rc != 0 or "shopfeatures" not in out: bad.append("api-resources --namespaced=true chưa có shopfeatures")
print("CRD=" + ("; ".join(bad)[:170] or "đạt"))

# 2. Đúng hai ShopFeature trong shop với spec của đề, và cả CRD lẫn hai resource có trong ~/shop/*.yaml.
bad = []
items = (kj("-n", "shop", "get", "shopfeatures.shop.example.com") or {}).get("items")
if items is None: bad.append("không đọc được ShopFeature ở shop")
else:
    got = {o["metadata"]["name"]: o.get("spec") or {} for o in items}
    if set(got) != set(FEATURES): bad.append("ShopFeature ở shop: " + (", ".join(sorted(got)) or "không có") + "; cần new-checkout, dark-mode")
    for n, (en, pct) in FEATURES.items():
        s = got.get(n)
        if s is not None and (s.get("enabled"), s.get("rolloutPercent")) != (en, pct):
            bad.append(f"{n}: enabled {s.get('enabled')}, rolloutPercent {s.get('rolloutPercent')} (cần {str(en).lower()}, {pct})")
files = set()
for p in sorted(glob.glob(f"{home}/shop/*.yaml") + glob.glob(f"{home}/shop/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict): files.add((d.get("kind"), (d.get("metadata") or {}).get("name")))
    except Exception: pass
miss = [f"{a} {b}" for a, b in [("CustomResourceDefinition", CRD)] + [("ShopFeature", n) for n in FEATURES] if (a, b) not in files]
if miss: bad.append("~/shop/*.yaml chưa có " + ", ".join(miss))
print("FEAT=" + ("; ".join(bad)[:170] or "đạt"))

# 3. cert-manager: release cert-manager ở namespace cert-manager, deployed, chart cert-manager-v1.21.3; CRD do chính release
# cài (crds.enabled=true: CRD mang annotation release); ba Deployment Available, mọi Pod đang chạy ở cka-cp.
bad = []
rc, out, _ = run("helm", "list", "-n", "cert-manager", "-o", "json")
try: rels = json.loads(out) if rc == 0 else None
except Exception: rels = None
r = next((x for x in rels or [] if x.get("name") == "cert-manager"), None)
if r is None: bad.append("chưa có release cert-manager ở namespace cert-manager")
else:
    if r.get("status") != "deployed": bad.append(f"release cert-manager đang {r.get('status')}")
    if r.get("chart") != CM_CHART: bad.append(f"chart {r.get('chart')}, cần {CM_CHART}")
crd = kj("get", "crd", "certificates.cert-manager.io")
if crd is None: bad.append("chưa có CRD certificates.cert-manager.io")
elif ((crd["metadata"].get("annotations") or {}).get("meta.helm.sh/release-name")) != "cert-manager":
    bad.append("CRD của cert-manager không do release cài (cần crds.enabled=true)")
for n in CM_DEPLOYS:
    d = kj("-n", "cert-manager", "get", "deploy", n)
    if d is None: bad.append(f"chưa có Deployment {n}"); continue
    if not available(d): bad.append(f"{n} chưa Available")
pods = [p for p in (kj("-n", "cert-manager", "get", "pod") or {}).get("items", [])
        if not p["metadata"].get("deletionTimestamp") and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
nodes = sorted({p["spec"].get("nodeName") or "(chưa xếp)" for p in pods})
if pods and nodes != ["cka-cp"]: bad.append("Pod cert-manager ở " + ", ".join(nodes) + ", cần cka-cp")
print("CM=" + ("; ".join(bad)[:170] or "đạt"))

# 4. Issuer selfsigned (tự ký) Ready; Certificate shop-local Ready=True, secretName shop-local-cm-tls, dnsNames shop.local,
# issuerRef Issuer/selfsigned; Secret shop-local-cm-tls kubernetes.io/tls, SAN DNS:shop.local, khoá khớp, mang annotation
# của cert-manager; shop-tls (s29) vẫn đúng chứng chỉ trên đĩa ~/drills/s29/tls.crt, không do cert-manager quản; Ingress shop
# vẫn dùng shop-tls.
bad = []
iss = kj("-n", "shop", "get", "issuers.cert-manager.io", "selfsigned")
if iss is None: bad.append("chưa có Issuer selfsigned ở shop")
else:
    if "selfSigned" not in (iss.get("spec") or {}): bad.append("Issuer selfsigned không phải loại selfSigned")
    if cond(iss, "Ready") != "True": bad.append("Issuer selfsigned chưa Ready")
crt = kj("-n", "shop", "get", "certificates.cert-manager.io", "shop-local")
if crt is None: bad.append("chưa có Certificate shop-local ở shop")
else:
    sp = crt.get("spec") or {}; ir = sp.get("issuerRef") or {}
    if sp.get("secretName") != "shop-local-cm-tls": bad.append(f"secretName {sp.get('secretName')}, cần shop-local-cm-tls")
    if "shop.local" not in (sp.get("dnsNames") or []): bad.append("dnsNames chưa có shop.local")
    if (ir.get("name"), ir.get("kind") or "Issuer") != ("selfsigned", "Issuer"): bad.append(f"issuerRef {ir.get('kind')}/{ir.get('name')}")
    if cond(crt, "Ready") != "True": bad.append("Certificate shop-local chưa Ready=True")
tmp = tempfile.mkdtemp()
def pem(secret, key):
    s = kj("-n", "shop", "get", "secret", secret)
    if s is None: return None, None
    v = (s.get("data") or {}).get(key)
    if not v: return s, None
    p = os.path.join(tmp, f"{secret}.{key}")
    open(p, "wb").write(base64.b64decode(v)); return s, p
s, cp = pem("shop-local-cm-tls", "tls.crt")
_, kp = pem("shop-local-cm-tls", "tls.key")
if s is None: bad.append("chưa có Secret shop-local-cm-tls")
else:
    if s.get("type") != "kubernetes.io/tls": bad.append(f"Secret shop-local-cm-tls loại {s.get('type')}")
    if (s["metadata"].get("annotations") or {}).get("cert-manager.io/certificate-name") != "shop-local":
        bad.append("Secret shop-local-cm-tls không do Certificate shop-local tạo")
    if cp is None or kp is None: bad.append("Secret shop-local-cm-tls thiếu tls.crt/tls.key")
    else:
        rc, out, _ = run("openssl", "x509", "-in", cp, "-noout", "-ext", "subjectAltName")
        if "DNS:shop.local" not in out: bad.append("chứng chỉ shop-local-cm-tls không có SAN DNS:shop.local")
        rc1, a, _ = run("openssl", "x509", "-in", cp, "-noout", "-pubkey")
        rc2, b, _ = run("openssl", "pkey", "-in", kp, "-pubout")
        if rc1 or rc2 or a.strip() != b.strip(): bad.append("khoá của shop-local-cm-tls không khớp chứng chỉ")
t, tp = pem("shop-tls", "tls.crt")
if t is None or tp is None: bad.append("mất Secret shop-tls của s29")
else:
    fp = lambda p: run("openssl", "x509", "-in", p, "-noout", "-fingerprint", "-sha256")[1].strip()
    if not os.path.isfile(f"{home}/drills/s29/tls.crt") or fp(tp) != fp(f"{home}/drills/s29/tls.crt"):
        bad.append("shop-tls đã đổi (khác ~/drills/s29/tls.crt)")
    if any(a.startswith("cert-manager.io/") for a in (t["metadata"].get("annotations") or {})):
        bad.append("shop-tls bị cert-manager quản (Certificate ghi vào shop-tls?)")
ing = kj("-n", "shop", "get", "ingress", "shop")
if ing is not None and [x.get("secretName") for x in (ing["spec"].get("tls") or [])] != ["shop-tls"]:
    bad.append("Ingress shop không còn dùng shop-tls")
print("CERT=" + ("; ".join(bad)[:170] or "đạt"))

# 5. answers.env: CERT_MANAGER_CRDS bằng số CRD *.cert-manager.io đang có.
bad = []
ans = {}
try:
    for l in open(f"{home}/drills/s39/answers.env"):
        if "=" in l and not l.lstrip().startswith("#"):
            a, b = l.strip().split("=", 1); ans[a.strip()] = b.strip().strip('"\'')
except Exception: bad.append("chưa có ~/drills/s39/answers.env")
rc, out, _ = k("get", "crd", "-o", "name")
real = sum(1 for l in out.split() if l.endswith(".cert-manager.io")) if rc == 0 else None
if not bad:
    v = ans.get("CERT_MANAGER_CRDS")
    if v is None: bad.append("answers.env chưa có CERT_MANAGER_CRDS")
    elif real is None: bad.append("không đếm được CRD")
    elif real == 0: bad.append("chưa có CRD *.cert-manager.io nào")
    elif v != str(real): bad.append(f"CERT_MANAGER_CRDS={v} chưa đúng")
print("ANS=" + ("; ".join(bad)[:170] or "đạt"))
PY
