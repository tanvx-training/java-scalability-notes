# s33 — đọc ~/users/{dev,ops}.{key,crt} và ~/users/{dev,ops}-csr.yaml (openssl), CSR trong API, SAN của cert apiserver,
# ~/drills/s33/answers.env. In dạng KHOÁ=giá-trị (một dòng "đạt" hay lý do ngắn cho mỗi dòng chấm). Chạy trên control plane
# bằng user ubuntu (kubectl + openssl + python3/PyYAML). Chỉ đọc. Lệnh lỗi hay hết giờ → tệp ghi ERR: dòng tương ứng in
# "không đọc được".
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
kubectl --request-timeout=10s get csr -o json > "$tmp/csr.json" 2>/dev/null || echo ERR > "$tmp/csr.json"
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -ext subjectAltName > "$tmp/sans" 2>/dev/null || : > "$tmp/sans"
cp "$HOME/drills/s33/answers.env" "$tmp/answers.env" 2>/dev/null || : > "$tmp/answers.env"
python3 - "$tmp" "$HOME/users" <<'PY'
import base64, calendar, json, os, re, subprocess, sys, time
import yaml
t, d = sys.argv[1], sys.argv[2]
CA = "/etc/kubernetes/pki/ca.crt"
USERS = (("dev", "shop-dev"), ("ops", "shop-ops"))

def run(*args, data=None):
    try:
        p = subprocess.run(args, input=data, capture_output=True, timeout=10)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)

def pubkey_of_key(path):
    rc, out, _ = run("openssl", "pkey", "-in", path, "-pubout")
    return out.strip() if rc == 0 else None

def pubkey_of_cert(path):
    rc, out, _ = run("openssl", "x509", "-in", path, "-noout", "-pubkey")
    return out.strip() if rc == 0 else None

def subject(path):
    # RFC2253 in ngược thứ tự DER: signer ghi O rồi CN, nên in "CN=dev,O=shop-dev"; nhiều O gộp thành "O=a+O=b". Trả về danh sách (khoá, giá trị).
    rc, out, _ = run("openssl", "x509", "-in", path, "-noout", "-subject", "-nameopt", "RFC2253")
    if rc != 0: return None
    s = out.strip()
    s = s[len("subject="):] if s.startswith("subject=") else s
    return [tuple(x.split("=", 1)) for x in re.split(r"(?<!\\),", s.strip()) if "=" in x]

def not_before(path):
    rc, out, _ = run("openssl", "x509", "-in", path, "-noout", "-startdate")
    if rc != 0: return None
    try: return calendar.timegm(time.strptime(out.strip().split("=", 1)[1], "%b %d %H:%M:%S %Y %Z"))
    except Exception: return None

def der(pem_text):
    # So hai cert theo nội dung base64 giữa BEGIN/END (bỏ khoảng trắng, dòng thừa).
    m = re.search(r"-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----", pem_text or "", re.S)
    return re.sub(r"\s", "", m.group(1)) if m else None

try: csrs = {c["metadata"]["name"]: c for c in json.load(open(f"{t}/csr.json")).get("items", [])}
except Exception: csrs = None

# 1. Bốn tệp
miss = [f"~/users/{u}.{x}" for u, _ in USERS for x in ("key", "crt") if not os.path.isfile(f"{d}/{u}.{x}") or not os.path.getsize(f"{d}/{u}.{x}")]
print("FILES=" + ("đạt" if not miss else "thiếu " + ", ".join(miss)))

# 2. Ký bởi CA của cluster, cert dùng cho client auth, còn hạn ≥ 30 ngày
bad = []
for u, _ in USERS:
    c = f"{d}/{u}.crt"
    if not os.path.isfile(c): bad.append(f"chưa có {u}.crt"); continue
    rc, out, err = run("openssl", "verify", "-CAfile", CA, c)
    if rc != 0: bad.append(f"{u}.crt không do CA cluster ký"); continue
    rc, out, _ = run("openssl", "x509", "-in", c, "-noout", "-ext", "extendedKeyUsage")
    if "TLS Web Client Authentication" not in out: bad.append(f"{u}.crt không có EKU client auth")
    rc, _, _ = run("openssl", "x509", "-in", c, "-noout", "-checkend", str(30 * 86400))
    if rc != 0: bad.append(f"{u}.crt hết hạn trong 30 ngày tới")
print("CA=" + ("; ".join(bad) or "đạt"))

# 3. Subject: đúng một CN và đúng một O, không trường nào khác
bad = []
for u, o in USERS:
    c = f"{d}/{u}.crt"
    s = subject(c) if os.path.isfile(c) else None
    if s is None: bad.append(f"không đọc được {u}.crt"); continue
    if sorted(s) != sorted([("CN", u), ("O", o)]):
        bad.append(f"{u}.crt subject " + ",".join(f"{k}={v}" for k, v in s)[:40])
print("SUBJ=" + ("; ".join(bad) or "đạt"))

# 4. Key khớp cert (so public key)
bad = []
for u, _ in USERS:
    a, b = pubkey_of_key(f"{d}/{u}.key"), pubkey_of_cert(f"{d}/{u}.crt")
    if not a or not b: bad.append(f"không đọc được {u}.key/{u}.crt")
    elif a != b: bad.append(f"{u}.key không khớp {u}.crt")
print("KEYMATCH=" + ("; ".join(bad) or "đạt"))

# 5. CSR: object dev/ops Approved, signer kube-apiserver-client, usages có client auth, cert đã cấp trùng ~/users/<u>.crt.
# kube-controller-manager (csrcleaner) xoá CSR đã duyệt sau 1 giờ: khi object không còn và notBefore của cert đã qua 1 giờ,
# chấm ~/users/<u>-csr.yaml (CSR đúng signer/usages, request mang public key của <u>.key) thay cho object.
bad = []
if csrs is None: bad.append("không đọc được CSR")
else:
    for u, _ in USERS:
        c = csrs.get(u)
        crt = f"{d}/{u}.crt"
        if c is not None:
            sp, st = c.get("spec") or {}, c.get("status") or {}
            conds = {x.get("type"): x.get("status") for x in st.get("conditions") or []}
            if sp.get("signerName") != "kubernetes.io/kube-apiserver-client": bad.append(f"CSR {u} signer {sp.get('signerName')}"); continue
            if "client auth" not in (sp.get("usages") or []): bad.append(f"CSR {u} thiếu usage client auth"); continue
            if conds.get("Approved") != "True": bad.append(f"CSR {u} chưa Approved"); continue
            if conds.get("Failed") == "True": bad.append(f"CSR {u} Failed"); continue
            if not st.get("certificate"): bad.append(f"CSR {u} chưa có cert"); continue
            try: issued = der(base64.b64decode(st["certificate"]).decode())
            except Exception: issued = None
            mine = der(open(crt).read()) if os.path.isfile(crt) else None
            if not issued or issued != mine: bad.append(f"cert của CSR {u} khác ~/users/{u}.crt")
            continue
        nb = not_before(crt) if os.path.isfile(crt) else None
        # notBefore của cert do controller ký lùi 5 phút so với lúc ký.
        if nb is None or time.time() - nb < 60 * 60:
            bad.append(f"chưa có CSR {u}"); continue
        y = f"{d}/{u}-csr.yaml"
        try: doc = next(x for x in yaml.safe_load_all(open(y)) if isinstance(x, dict) and x.get("kind") == "CertificateSigningRequest")
        except Exception: bad.append(f"CSR {u} đã được dọn, không đọc được ~/users/{u}-csr.yaml"); continue
        sp = doc.get("spec") or {}
        if (doc.get("metadata") or {}).get("name") != u or sp.get("signerName") != "kubernetes.io/kube-apiserver-client" \
                or "client auth" not in (sp.get("usages") or []):
            bad.append(f"~/users/{u}-csr.yaml sai tên/signer/usages"); continue
        try: req = base64.b64decode(sp.get("request") or "")
        except Exception: req = b""
        rc, out, _ = run("openssl", "req", "-noout", "-pubkey", data=req)
        if rc != 0 or out.strip() != (pubkey_of_key(f"{d}/{u}.key") or "-"): bad.append(f"request trong ~/users/{u}-csr.yaml không mang key của {u}")
    left = [n for n in ("dev-draft",) if n in csrs]
    if left: bad.append("còn CSR nháp " + ", ".join(left))
print("CSR=" + ("; ".join(bad) or "đạt"))

# 6. Đáp án: APISERVER_SANS (tập tên/IP trong SAN, bỏ tiền tố DNS:/IP Address:), CERT_GROUP_FIELD (O)
ans = {}
for line in open(f"{t}/answers.env"):
    if "=" in line:
        k, v = line.split("=", 1); ans[k.strip()] = v.strip().strip('"').strip("'")
def norm_sans(s):
    s = re.sub(r"(?i)\b(dns|ip address|ip)\s*:", " ", s)
    return {x.lower() for x in re.split(r"[\s,;]+", s) if x}
want = norm_sans(" ".join(open(f"{t}/sans").read().splitlines()[1:]))
bad = []
if not want: bad.append("không đọc được SAN của apiserver.crt")
elif norm_sans(ans.get("APISERVER_SANS", "")) != want:
    got = norm_sans(ans.get("APISERVER_SANS", ""))
    bad.append(f"APISERVER_SANS thiếu {len(want - got)}, thừa {len(got - want)}")
if re.sub(r"[^a-z]", "", ans.get("CERT_GROUP_FIELD", "").lower()) not in ("o", "organization", "organizationname"):
    bad.append(f"CERT_GROUP_FIELD='{ans.get('CERT_GROUP_FIELD', '')[:20]}'")
print("ANS=" + ("; ".join(bad) or "đạt"))
PY
