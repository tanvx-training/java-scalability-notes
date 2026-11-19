# s35 — dữ kiện của verify s35 (và s36): quyền của dev và ops hỏi bằng chính /home/ubuntu/{dev,ops}.kubeconfig (`auth can-i`
# và một lệnh get thật, không --as); quyền của SA order hỏi bằng token thật (`kubectl create token`, TokenRequest không lưu
# object nào) qua --kubeconfig /dev/null (để cert admin của ~/.kube/config không chen vào); Deployment, Pod, SA order;
# object RBAC trong cluster so với ~/shop/rbac.yaml. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu
# (kubectl + python3/PyYAML; server đọc từ /etc/kubernetes/admin.conf bằng sudo). Chỉ đọc; mỗi lệnh kubectl có --request-timeout.
python3 - "$HOME" <<'PY'
import glob, json, os, subprocess, sys
import yaml
home = sys.argv[1]
CA = "/etc/kubernetes/pki/ca.crt"
CM = "order-config"          # ConfigMap của order (envFrom), tạo ở s35
RBAC = "rbac.authorization.k8s.io"

def run(*args, timeout=20):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)

def k(*args): return run("kubectl", "--request-timeout=10s", *args)
def lastline(s): return (s.strip().splitlines() or [""])[-1][:60]

def server():
    rc, out, _ = run("sudo", "-n", "cat", "/etc/kubernetes/admin.conf")
    try: cl = ((yaml.safe_load(out) or {}).get("clusters") or []) if rc == 0 else []
    except Exception: cl = []
    return ((cl[0].get("cluster") or {}).get("server") or "").rstrip("/") if cl else ""
SERVER = server()

def cani(auth, *q):
    # "yes" / "no" / thông báo lỗi ngắn (TLS, Unauthorized, không nối được…): can-i trả mã 1 cả khi "no" lẫn khi lỗi.
    rc, out, err = run("kubectl", "--request-timeout=10s", *auth, "auth", "can-i", *q)
    o = out.strip()
    if o in ("yes", "no"): return o
    return "lỗi: " + lastline(err or o)

def role_check(name, auth, yes, no, real):
    bad = []
    for q in yes:
        r = cani(auth, *q)
        if r.startswith("lỗi"): return f"{name}: {r}"
        if r != "yes": bad.append(f"{name} chưa {' '.join(q)}")
    for q in no:
        r = cani(auth, *q)
        if r.startswith("lỗi"): return f"{name}: {r}"
        if r != "no": bad.append(f"{name} không được {' '.join(q)}")
    rc, out, err = run("kubectl", "--request-timeout=10s", *auth, *real)
    if rc != 0: bad.append(f"{name} {' '.join(real)}: {lastline(err)}")
    return "; ".join(bad)[:150] or "đạt"

def kc(u): return ["--kubeconfig", f"{home}/{u}.kubeconfig"]

# 1. dev
if not os.path.isfile(f"{home}/dev.kubeconfig"): print("DEV=chưa có ~/dev.kubeconfig")
else:
    print("DEV=" + role_check("dev", kc("dev"),
        [("create", "deployments.apps", "-n", "shop"), ("patch", "deployments.apps", "-n", "shop"), ("get", "pods", "-n", "shop")],
        [("get", "nodes"), ("list", "pods", "-n", "kube-system"), ("get", "secrets", "-n", "kube-system"),
         ("create", "deployments.apps", "-n", "kube-system"), ("delete", "configmaps", "-n", "kube-system"),
         ("patch", "daemonsets.apps", "-n", "kube-system"), ("create", f"clusterroles.{RBAC}"),
         # Trong shop: những thứ shop-deployer cố ý không cho (Secret, RBAC và hai verb leo quyền, NetworkPolicy, quota,
         # StatefulSet postgres, deployments/scale, đóng vai SA). Role `*` hay RoleBinding tới admin/edit ở shop: đỏ.
         ("get", "secrets", "-n", "shop"), ("list", "secrets", "-n", "shop"),
         ("create", f"roles.{RBAC}", "-n", "shop"), ("create", f"rolebindings.{RBAC}", "-n", "shop"),
         ("escalate", f"roles.{RBAC}", "-n", "shop"), ("bind", f"clusterroles.{RBAC}", "-n", "shop"),
         ("create", "networkpolicies.networking.k8s.io", "-n", "shop"), ("delete", "networkpolicies.networking.k8s.io", "-n", "shop"),
         ("patch", "resourcequotas", "-n", "shop"), ("create", "limitranges", "-n", "shop"),
         ("delete", "statefulsets.apps", "-n", "shop"), ("patch", "deployments.apps", "--subresource=scale", "-n", "shop"),
         ("impersonate", "serviceaccounts", "-n", "shop")],
        ["-n", "shop", "get", "pods"]))

# 2. ops
if not os.path.isfile(f"{home}/ops.kubeconfig"): print("OPS=chưa có ~/ops.kubeconfig")
else:
    print("OPS=" + role_check("ops", kc("ops"),
        [("get", "nodes"), ("list", "pods", "--all-namespaces")],
        [("create", "deployments.apps", "--all-namespaces"), ("patch", "deployments.apps", "-n", "shop"),
         ("delete", "pods", "-n", "shop"), ("create", "pods", "-n", "default"), ("patch", "nodes"), ("delete", "nodes"),
         ("delete", "namespaces"), ("create", f"clusterrolebindings.{RBAC}"), ("get", "secrets", "-n", "shop"),
         ("list", "secrets", "--all-namespaces"), ("patch", "deployments.apps", "-n", "kube-system"),
         ("create", "pods", "--subresource=exec", "-n", "shop"), ("impersonate", "users"),
         ("impersonate", "serviceaccounts", "-n", "shop")],
        ["get", "nodes"]))

# 3. SA order: SA có, Deployment dùng SA order và ConfigMap order-config, mọi Pod order đang chạy dùng SA order, Available;
# token của SA đọc được order-config, không đọc ConfigMap khác hay Secret db-cred.
bad = []
rc, out, err = k("-n", "shop", "get", "deploy", "order", "-o", "json")
try: dep = json.loads(out)
except Exception: dep = None
if dep is None: bad.append("không đọc được Deployment order")
else:
    ps = dep["spec"]["template"]["spec"]
    if (ps.get("serviceAccountName") or ps.get("serviceAccount")) != "order": bad.append("Deployment order chưa dùng SA order")
    if CM not in json.dumps(ps): bad.append(f"Deployment order không dùng ConfigMap {CM}")
    st = dep.get("status") or {}
    want = dep["spec"].get("replicas", 1)
    if st.get("observedGeneration", 0) < dep["metadata"]["generation"] or st.get("updatedReplicas", 0) != want \
            or st.get("availableReplicas", 0) != want or st.get("replicas", 0) != want:
        bad.append(f"order chưa Available ({st.get('availableReplicas', 0)}/{want})")
rc, out, _ = k("-n", "shop", "get", "pod", "-l", "app=order", "-o", "json")
try: pods = [p for p in json.loads(out)["items"] if not p["metadata"].get("deletionTimestamp")
             and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
except Exception: pods = None
if pods is None: bad.append("không đọc được Pod order")
elif not pods: bad.append("không có Pod order")
else:
    other = [p["metadata"]["name"] for p in pods if p["spec"].get("serviceAccountName") != "order"]
    if other: bad.append(f"Pod {other[0]} chạy bằng SA {next(p['spec'].get('serviceAccountName') for p in pods if p['metadata']['name'] == other[0])}")
rc, _, err = k("-n", "shop", "get", "sa", "order")
if rc != 0: bad.append("chưa có SA order")
else:
    rc, tok, err = k("-n", "shop", "create", "token", "order", "--duration=10m")
    if rc != 0: bad.append("create token order: " + lastline(err))
    else:
        auth = ["--kubeconfig", "/dev/null", "--server", SERVER, "--certificate-authority", CA, "--token", tok.strip()]
        for q, w in ((("get", f"configmaps/{CM}", "-n", "shop"), "yes"), (("get", "configmaps/shop-config", "-n", "shop"), "no"),
                     (("list", "configmaps", "-n", "shop"), "no"), (("get", "secrets/db-cred", "-n", "shop"), "no"),
                     (("list", "secrets", "-n", "shop"), "no")):
            r = cani(auth, *q)
            if r != w: bad.append(f"SA order {' '.join(q[:2])}: {r}"); break
        else:
            rc, _, err = run("kubectl", "--request-timeout=10s", *auth, "-n", "shop", "get", "configmap", CM)
            if rc != 0: bad.append(f"SA order get configmap {CM}: {lastline(err)}")
print("SA=" + ("; ".join(bad)[:160] or "đạt"))

# 4. Object RBAC/SA: đúng chủ thể và phạm vi, và ~/shop/rbac.yaml khớp cluster (so rules, subjects, roleRef đã chuẩn hoá);
# ~/shop/ có Deployment order với serviceAccountName order và ConfigMap order-config.
WANT = [("ServiceAccount", "order", True), ("Role", "shop-deployer", True), ("RoleBinding", "shop-dev", True),
        ("ClusterRole", "shop-ops-view", False), ("ClusterRoleBinding", "shop-ops", False),
        ("Role", "order-config-reader", True), ("RoleBinding", "order-config-reader", True)]
RES = {"ServiceAccount": "serviceaccount", "Role": "role", "RoleBinding": "rolebinding",
       "ClusterRole": "clusterrole", "ClusterRoleBinding": "clusterrolebinding"}
def srt(x): return tuple(sorted(x or []))
def rules(d): return sorted((srt(r.get("apiGroups")), srt(r.get("resources")), srt(r.get("verbs")), srt(r.get("resourceNames")),
                             srt(r.get("nonResourceURLs"))) for r in d.get("rules") or [])
def subj(d, ns):
    out = []
    for s in d.get("subjects") or []:
        kind = s.get("kind")
        out.append((kind, s.get("name"), s.get("namespace") or (ns if kind == "ServiceAccount" else ""),
                    s.get("apiGroup") if s.get("apiGroup") is not None else ("" if kind == "ServiceAccount" else RBAC)))
    return sorted(out)
def rref(d): r = d.get("roleRef") or {}; return (r.get("kind"), r.get("name"))
def norm(kind, d, ns):
    if kind in ("Role", "ClusterRole"): return rules(d)
    if kind in ("RoleBinding", "ClusterRoleBinding"): return (subj(d, ns), rref(d))
    return None
bad = []
live = {}
for kind, name, nsd in WANT:
    rc, out, err = k(*(["-n", "shop"] if nsd else []), "get", RES[kind], name, "-o", "json")
    try: live[(kind, name)] = json.loads(out)
    except Exception: bad.append(f"chưa có {kind} {name}")
L = lambda kn: live.get(kn) or {}
if ("RoleBinding", "shop-dev") in live:
    if subj(L(("RoleBinding", "shop-dev")), "shop") != [("Group", "shop-dev", "", RBAC)] or rref(L(("RoleBinding", "shop-dev"))) != ("Role", "shop-deployer"):
        bad.append("RoleBinding shop-dev phải gắn Role shop-deployer cho đúng Group shop-dev")
if ("Role", "shop-deployer") in live:
    if any("*" in (r.get(f) or []) for r in L(("Role", "shop-deployer")).get("rules") or [] for f in ("apiGroups", "resources", "verbs")):
        bad.append("shop-deployer có * trong apiGroups/resources/verbs")
# Ngoài RoleBinding shop-dev, không binding nào (ở mọi namespace hay toàn cluster) cấp thêm cho group shop-dev hay user dev.
extra = []
for res in ("rolebindings", "clusterrolebindings"):
    rc, out, _ = k("get", res, *(["-A"] if res == "rolebindings" else []), "-o", "json")
    try: items = json.loads(out)["items"]
    except Exception: bad.append(f"không đọc được {res}"); continue
    for b in items:
        md = b["metadata"]
        if res == "rolebindings" and (md.get("namespace"), md["name"]) == ("shop", "shop-dev"): continue
        for sj in b.get("subjects") or []:
            if (sj.get("kind"), sj.get("name")) in (("Group", "shop-dev"), ("User", "dev")):
                extra.append(f"{md.get('namespace', '')}/{md['name']}".lstrip("/"))
if extra: bad.append("binding khác cho dev/shop-dev: " + ", ".join(sorted(set(extra)))[:60])
if ("ClusterRoleBinding", "shop-ops") in live:
    if subj(L(("ClusterRoleBinding", "shop-ops")), "") != [("Group", "shop-ops", "", RBAC)] or rref(L(("ClusterRoleBinding", "shop-ops"))) != ("ClusterRole", "shop-ops-view"):
        bad.append("ClusterRoleBinding shop-ops phải gắn ClusterRole shop-ops-view cho đúng Group shop-ops")
if ("ClusterRole", "shop-ops-view") in live:
    rs = L(("ClusterRole", "shop-ops-view")).get("rules") or []
    if L(("ClusterRole", "shop-ops-view")).get("aggregationRule"): bad.append("shop-ops-view có aggregationRule")
    if any(set(r.get("verbs") or []) - {"get", "list", "watch"} for r in rs): bad.append("shop-ops-view có verb ngoài get/list/watch")
    if not any("nodes" in (r.get("resources") or []) or "*" in (r.get("resources") or []) for r in rs): bad.append("shop-ops-view chưa có nodes")
if ("Role", "order-config-reader") in live:
    rs = L(("Role", "order-config-reader")).get("rules") or []
    if not rs or any(srt(r.get("resourceNames")) != (CM,) or set(r.get("verbs") or []) - {"get", "list", "watch"} for r in rs):
        bad.append(f"Role order-config-reader phải chỉ get/list/watch theo resourceNames [{CM}]")
if ("RoleBinding", "order-config-reader") in live:
    if subj(L(("RoleBinding", "order-config-reader")), "shop") != [("ServiceAccount", "order", "shop", "")] \
            or rref(L(("RoleBinding", "order-config-reader"))) != ("Role", "order-config-reader"):
        bad.append("RoleBinding order-config-reader phải gắn Role order-config-reader cho SA shop/order")
# Tệp
files = {}
for p in sorted(glob.glob(f"{home}/shop/*.yaml") + glob.glob(f"{home}/shop/*.yml")):
    try:
        for d in yaml.safe_load_all(open(p)):
            if isinstance(d, dict) and d.get("kind"): files[(d["kind"], (d.get("metadata") or {}).get("name"))] = (p, d)
    except Exception: pass
for kind, name, nsd in WANT:
    p, d = files.get((kind, name), (None, None))
    if d is None or os.path.basename(p) != "rbac.yaml": bad.append(f"~/shop/rbac.yaml chưa có {kind} {name}"); continue
    if nsd and (d.get("metadata") or {}).get("namespace", "shop") != "shop": bad.append(f"{kind} {name} trong tệp không ở shop"); continue
    if (kind, name) in live and norm(kind, d, "shop" if nsd else "") != norm(kind, live[(kind, name)], "shop" if nsd else ""):
        bad.append(f"{kind} {name} trong rbac.yaml khác cluster")
p, d = files.get(("Deployment", "order"), (None, None))
ps = (((d or {}).get("spec") or {}).get("template") or {}).get("spec") or {}
if (ps.get("serviceAccountName") or ps.get("serviceAccount")) != "order" or CM not in json.dumps(ps):
    bad.append(f"~/shop/ chưa có Deployment order với serviceAccountName: order và ConfigMap {CM}")
if ("ConfigMap", CM) not in files: bad.append(f"~/shop/ chưa có ConfigMap {CM}")
print("FILE=" + ("; ".join(bad)[:170] or "đạt"))
PY
