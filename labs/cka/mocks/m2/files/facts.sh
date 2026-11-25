# m2 — dữ kiện chấm của score.sh trên cka-cp (user ubuntu, sudo; kubectl, kubeadm, curl, etcdctl/etcdutl, openssl, python3 +
# PyYAML). Bên gửi ghép mocks/m1/files/qlib.sh lên trước (MOCK_QLIB_PY: run, kj, API, add, emit… — hợp đồng ở đầu tệp đó).
# Chỉ đọc (kubectl get/exec/auth can-i/auth whoami, kubeadm token list, curl, etcdctl member list/endpoint health, etcdutl
# snapshot status, openssl); mỗi lệnh có timeout, apiserver không trả lời thì phần cần apiserver được 0 ngay (không treo).
# In `GOT qN <điểm>` và `WHY qN <lý do>` cho 16 câu; điểm tối đa của từng câu nằm ở score.sh (bảng TABLE, trùng mocks.js).
# Chấm theo sự thật trên cluster và mốc do stage.sh ghi ở /root/.lab/m2/ (mã trang, revision, member ID, uid PV, hash CA…),
# không theo chuỗi đoán được. Chỉ nhìn đồ của m2 (namespace m2-*, tên m2-*, /opt/m2): đồ của m1 không cho điểm nào.
# Mỗi câu chấm từng phần; phần "không thừa / không lách" chỉ tính khi phần chính đã đúng (chưa làm gì thì không có điểm).
python3 - <<'PY'
import base64, datetime, json, os, re, sys, time
import yaml
exec(os.environ.get("MOCK_QLIB_PY", "raise SystemExit('thiếu mocks/m1/files/qlib.sh')"))
H = "/root/.lab/m2"
D = "/opt/m2"
STARTED = mark(H, "started")
NOW = time.time()
def ans(name): return rfile(f"{D}/{name}")
def svc_ip(ns, name):
    s = kj("-n", ns, "get", "svc", name) if API else None
    return (s or {}).get("spec", {}).get("clusterIP"), s
def deploy_done(d):
    if not d: return False
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return (st.get("observedGeneration", 0) >= d["metadata"].get("generation", 0) and st.get("replicas", 0) == want
            and st.get("updatedReplicas", 0) == st.get("readyReplicas", 0) == st.get("availableReplicas", 0) == want)
def ctr(obj, name=None):
    cs = ((obj or {}).get("spec", {}).get("template", {}).get("spec", {}) or (obj or {}).get("spec", {}) or {}).get("containers") or [{}]
    return next((c for c in cs if c.get("name") == name), {}) if name else cs[0]
def ts(s):
    try: return datetime.datetime.fromisoformat(str(s).replace("Z", "+00:00")).timestamp()
    except Exception: return None
def one(text):
    l = lines(text)
    return l[0] if len(l) == 1 else None
NOAPI = "apiserver không trả lời"
for q in ["q%d" % i for i in range(1, 17)]: Q.setdefault(q, [0, []])
if not STARTED:
    for q in Q: Q[q][1].append("chưa dựng đề (mock cka m2 start)")
    emit(); sys.exit(0)
STARTED_AT = float(STARTED) if STARTED.isdigit() else NOW

# q1 kube-scheduler: cờ gây lỗi; manifest như bản tốt (cho phép ghi đúng namespace kube-system); scheduler giữ lease và
# xếp lịch được Pod nightly; không lách bằng namespace kube-sytem.
flag = one(ans("q1-flag.txt"))
add("q1", 1, flag == "--leader-elect-resource-namespace", f"q1-flag.txt='{flag}' chưa đúng tên cờ (dạng --tên-cờ)" if ans("q1-flag.txt") else "chưa có /opt/m2/q1-flag.txt")
good_txt, cur_txt = rfile(f"{H}/kube-scheduler.yaml"), rfile("/etc/kubernetes/manifests/kube-scheduler.yaml")
man_ok, why = False, "không đọc được manifest kube-scheduler"
try:
    g, c = yaml.safe_load(good_txt), yaml.safe_load(cur_txt)
    gc, cc = g["spec"]["containers"][0], c["spec"]["containers"][0]
    gcmd = sorted(gc.get("command") or [])
    ccmd = sorted(a for a in cc.get("command") or [] if a != "--leader-elect-resource-namespace=kube-system")
    rest = lambda d, x: {**d, "spec": {**d["spec"], "containers": [{**x, "command": None}] + d["spec"]["containers"][1:]}}
    man_ok = gcmd == ccmd and rest(g, gc) == rest(c, cc)
    extra = sorted(set(cc.get("command") or []) - set(gc.get("command") or []))
    why = "kube-scheduler.yaml khác bản tốt" + (f": {' '.join(extra)[:80]}" if extra else "")
except Exception: pass
add("q1", 3, man_ok, why)
bypass = API and kj("get", "ns", "kube-sytem") is not None
if API:
    d = kj("-n", "m2-q1", "get", "deploy", "nightly")
    ps = pods("m2-q1", "app=nightly")
    add("q1", 2, not bypass and deploy_done(d) and ps and all(p["spec"].get("nodeName") and ready(p) for p in ps),
        "đã tạo namespace kube-sytem để lách (sửa cờ, đừng tạo namespace)" if bypass else "Pod nightly chưa được xếp lịch và Ready")
    ls = (kj("-n", "kube-system", "get", "lease", "kube-scheduler") or {}).get("spec") or {}
    rt = ts(ls.get("renewTime"))
    sp = kj("-n", "kube-system", "get", "pod", "kube-scheduler-cka-cp")
    add("q1", 2, man_ok and not bypass and ready(sp) and (ls.get("holderIdentity") or "").startswith("cka-cp") and rt and NOW - rt < 60,
        "kube-scheduler chưa giữ lease kube-system/kube-scheduler" if man_ok else "")
else: add("q1", 0, False, NOAPI)

# q2 user m2-auditor qua CSR, kubeconfig, ClusterRole m2-pod-reader, ClusterRoleBinding cho nhóm m2-audit.
if API:
    csr = kj("get", "csr", "m2-auditor")
    cs = (csr or {}).get("status") or {}
    appr = any(c.get("type") == "Approved" and c.get("status", "True") == "True" for c in cs.get("conditions") or [])
    add("q2", 1, appr and bool(cs.get("certificate")) and (csr or {}).get("spec", {}).get("signerName") == "kubernetes.io/kube-apiserver-client",
        "CSR m2-auditor chưa Approved/có cert (signer kube-apiserver-client)" if csr else "chưa có CSR m2-auditor")
else: add("q2", 0, False, NOAPI)
rc, subj, _ = run("sudo", "-n", "openssl", "x509", "-in", f"{D}/auditor.crt", "-noout", "-subject", "-nameopt", "RFC2253", timeout=10)
rc2, _, _ = run("sudo", "-n", "openssl", "verify", "-CAfile", "/etc/kubernetes/pki/ca.crt", f"{D}/auditor.crt", timeout=10)
sj = subj.strip()
add("q2", 1, rc == 0 and rc2 == 0 and "CN=m2-auditor" in sj and "O=m2-audit" in sj,
    f"auditor.crt: {sj[:60] or 'không đọc được'}{'' if rc2 == 0 else ', không do CA cluster ký'}" if rc == 0 else "chưa có /opt/m2/auditor.crt")
KC = f"{D}/auditor.kubeconfig"
def ak(*a, t=10):
    return run("sudo", "-n", "kubectl", f"--kubeconfig={KC}", f"--request-timeout={t}s", *a, timeout=t + 5)
if API and rfile(KC) is not None:
    rc, out, _ = ak("auth", "whoami", "-o", "json")
    try: ui = json.loads(out)["status"]["userInfo"] if rc == 0 else {}
    except Exception: ui = {}
    add("q2", 1, ui.get("username") == "m2-auditor" and "m2-audit" in (ui.get("groups") or []),
        f"auditor.kubeconfig: whoami {ui.get('username')} {ui.get('groups')}" if ui else "auditor.kubeconfig chưa dùng được (auth whoami)")
    rc, _, _ = ak("get", "pods", "-A", "-o", "name")
    lp = rc == 0 and ui.get("username") == "m2-auditor"
    add("q2", 1, lp, "auditor.kubeconfig chưa list được pods -A")
    def can(*a):
        rc, out, _ = ak("auth", "can-i", *a)
        return out.strip() == "yes"
    extra = [x for x, y in (("delete pods", can("delete", "pods", "-A")), ("get secrets", can("get", "secrets", "-A")),
                            ("list nodes", can("list", "nodes")), ("create deployments", can("create", "deployments.apps", "-A"))) if y]
    add("q2", 1, lp and not extra, "thừa quyền: " + ", ".join(extra) if extra else "")
else: add("q2", 0, False, NOAPI if not API else "chưa có /opt/m2/auditor.kubeconfig")
if API:
    crb = kj("get", "clusterrolebinding", "m2-auditor")
    cr = kj("get", "clusterrole", "m2-pod-reader")
    rr = (crb or {}).get("roleRef") or {}
    grp = any(s.get("kind") == "Group" and s.get("name") == "m2-audit" for s in (crb or {}).get("subjects") or [])
    rules = (cr or {}).get("rules") or []
    rule_ok = cr is not None and all(set(r.get("resources") or []) <= {"pods"} and set(r.get("verbs") or []) <= {"get", "list", "watch"} for r in rules) \
        and any("pods" in (r.get("resources") or []) and {"get", "list", "watch"} <= set(r.get("verbs") or []) for r in rules)
    add("q2", 1, rr.get("kind") == "ClusterRole" and rr.get("name") == "m2-pod-reader" and grp and rule_ok,
        "ClusterRoleBinding m2-auditor cần ClusterRole m2-pod-reader (get/list/watch pods) cho Group m2-audit" if crb else "chưa có ClusterRoleBinding m2-auditor")

# q3 ResourceQuota team-quota, LimitRange team-defaults, Pod batch nhận mặc định (template không sửa), Used ra tệp.
if API:
    rq = kj("-n", "m2-q3", "get", "resourcequota", "team-quota")
    hard = (rq or {}).get("spec", {}).get("hard") or {}
    want = {"pods": 4, "requests.cpu": 0.2, "requests.memory": 256 * 1024**2, "limits.memory": 512 * 1024**2}
    add("q3", 1, rq is not None and set(hard) == set(want) and all(qty(hard[x]) is not None and abs(qty(hard[x]) - v) < 1e-6 for x, v in want.items()),
        f"team-quota hard: {hard}"[:90] if rq else "chưa có ResourceQuota team-quota")
    lr = kj("-n", "m2-q3", "get", "limitrange", "team-defaults")
    lim = next((l for l in (lr or {}).get("spec", {}).get("limits") or [] if l.get("type") == "Container"), {})
    dr, dl = lim.get("defaultRequest") or {}, lim.get("default") or {}
    add("q3", 1, qty(dr.get("cpu")) == 0.025 and qty(dr.get("memory")) == 32 * 1024**2 and qty(dl.get("memory")) == 64 * 1024**2,
        f"team-defaults: defaultRequest {dr}, default {dl}"[:90] if lr else "chưa có LimitRange team-defaults")
    d = kj("-n", "m2-q3", "get", "deploy", "batch")
    tpl_clean = not (ctr(d, "batch").get("resources") or {})
    ps = pods("m2-q3", "app=batch")
    def got_def(p):
        r = (p["spec"]["containers"][0].get("resources") or {})
        return (qty((r.get("requests") or {}).get("cpu")) == 0.025 and qty((r.get("requests") or {}).get("memory")) == 32 * 1024**2
                and qty((r.get("limits") or {}).get("memory")) == 64 * 1024**2)
    add("q3", 2, d is not None and tpl_clean and deploy_done(d) and len(ps) == 2 and all(ready(p) and got_def(p) for p in ps),
        "template của batch không được thêm resources" if d and not tpl_clean else "Pod batch chưa chạy lại với mặc định của LimitRange (2 Pod Ready)")
    used = ((rq or {}).get("status") or {}).get("used", {}).get("requests.cpu")
    got = one(ans("q3-used.txt"))
    add("q3", 1, used is not None and got is not None and qty(got) is not None and qty(used) > 0 and abs(qty(got) - qty(used)) < 1e-6,
        f"q3-used.txt='{got}', quota dùng {used}" if got else "chưa có /opt/m2/q3-used.txt")
else: add("q3", 0, False, NOAPI)

# q4 StorageClass m2-standard mặc định duy nhất, PVC logs không ghi class, Pod log-writer chạy.
if API:
    scs = (kj("get", "sc") or {}).get("items") or []
    by = {s["metadata"]["name"]: s for s in scs}
    isdef = lambda s: (s["metadata"].get("annotations") or {}).get("storageclass.kubernetes.io/is-default-class") == "true"
    sc = by.get("m2-standard")
    add("q4", 1, sc is not None and sc.get("provisioner") == "rancher.io/local-path" and sc.get("reclaimPolicy") == "Delete"
        and sc.get("volumeBindingMode") == "WaitForFirstConsumer", "StorageClass m2-standard: provisioner/reclaimPolicy/bindingMode chưa đúng" if sc else "chưa có StorageClass m2-standard")
    add("q4", 1, sc is not None and isdef(sc), "m2-standard chưa là lớp mặc định" if sc else "")
    others = [n for n, s in by.items() if n != "m2-standard" and isdef(s)]
    add("q4", 1, sc is not None and isdef(sc) and not others, f"còn lớp mặc định khác: {', '.join(others)}" if others else "")
    pvc = kj("-n", "m2-q4", "get", "pvc", "logs")
    ps = (pvc or {}).get("spec") or {}
    add("q4", 1, pvc is not None and ps.get("storageClassName") == "m2-standard" and ps.get("accessModes") == ["ReadWriteOnce"]
        and qty(((ps.get("resources") or {}).get("requests") or {}).get("storage")) == 64 * 1024**2 and ((pvc.get("status") or {}).get("phase") == "Bound"),
        f"PVC logs: class {ps.get('storageClassName')}, {((pvc or {}).get('status') or {}).get('phase')}" if pvc else "chưa có PVC logs")
    p = kj("-n", "m2-q4", "get", "pod", "log-writer")
    add("q4", 1, pvc is not None and ready(p) and (p.get("status") or {}).get("phase") == "Running", "Pod log-writer chưa Running" if pvc else "")
else: add("q4", 0, False, NOAPI)

# q5 NetworkPolicy fetcher-egress: chỉ store (m2-q5-db) cổng 8080 và DNS. Phép thử chỉ tính khi policy egress đã có.
if API:
    np = kj("-n", "m2-q5", "get", "netpol", "fetcher-egress")
    sp = (np or {}).get("spec") or {}
    is_eg = np is not None and (sp.get("podSelector") or {}).get("matchLabels") == {"app": "fetcher"} and "Egress" in (sp.get("policyTypes") or [])
    add("q5", 1, is_eg, "NetworkPolicy fetcher-egress chưa chọn app=fetcher với policyTypes Egress" if np else "chưa có NetworkPolicy fetcher-egress")
    st_ip, _ = svc_ip("m2-q5-db", "store")
    ca_ip, _ = svc_ip("m2-q5-db", "cache")
    f, a = live_pod("m2-q5", "app=fetcher"), live_pod("m2-q5", "app=auditor")
    ts_, tc = mark(H, "q5-store"), mark(H, "q5-cache")
    store = bool(is_eg and f and st_ip and ts_ and ts_ in wget("m2-q5", f, f"http://{st_ip}:8080/"))
    add("q5", 2, store, "fetcher chưa gọi được store (ClusterIP:8080)" if is_eg else "")
    dns = bool(is_eg and f and ts_ and ts_ in wget("m2-q5", f, "http://store.m2-q5-db.svc.cluster.local:8080/", t=4))
    add("q5", 1, dns, "fetcher chưa gọi được store theo tên (DNS bị chặn?)" if is_eg else "")
    cache_f = bool(f and ca_ip and tc and tc in wget("m2-q5", f, f"http://{ca_ip}:8080/"))
    add("q5", 2, store and not cache_f, "fetcher vẫn gọi được cache (chỉ store được phép)" if store and cache_f else "")
    cache_a = bool(a and ca_ip and tc and tc in wget("m2-q5", a, f"http://{ca_ip}:8080/"))
    add("q5", 1, is_eg and cache_a, "Pod auditor (không phải fetcher) không còn gọi được cache" if is_eg else "")
else: add("q5", 0, False, NOAPI)

# q6 etcd: member list ra tệp; revision của bản sao lưu; restore thử vào /var/lib/etcd-m2-check, etcd đang chạy giữ nguyên.
mem = ans("q6-members.txt") or ""
mid, mname, mpeer = mark(H, "q6-member"), mark(H, "q6-name"), mark(H, "q6-peer")
add("q6", 2, bool(mid and mid in mem and mname and mname in mem and mpeer and mpeer in mem),
    "q6-members.txt cần output của etcdctl member list (ID, tên, peer URL)" if mem else "chưa có /opt/m2/q6-members.txt")
rev, got = mark(H, "q6-rev"), one(ans("q6-revision.txt"))
add("q6", 2, rev is not None and got == rev, f"q6-revision.txt='{got}' chưa đúng revision của etcd-backup.db" if got else "chưa có /opt/m2/q6-revision.txt")
RD = "/var/lib/etcd-m2-check"
rc, out, _ = run("sudo", "-n", "etcdutl", "snapshot", "status", f"{RD}/member/snap/db", "-w", "json", timeout=40)
try: st = json.loads(out) if rc == 0 else None
except Exception: st = None
wal = run("sudo", "-n", "sh", "-c", f"ls {RD}/member/wal/*.wal", timeout=10)[0] == 0
add("q6", 2, st is not None and wal and rev is not None and str(st.get("revision")) == rev,
    f"{RD}: revision {st.get('revision')} khác bản sao lưu ({rev})" if st else f"chưa có dữ liệu etcd khôi phục ở {RD} (member/snap/db, member/wal)")
man = rfile("/etc/kubernetes/manifests/etcd.yaml") or ""
P = "/etc/kubernetes/pki/etcd"
rc, _, _ = run("sudo", "-n", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={P}/ca.crt", f"--cert={P}/server.crt",
               f"--key={P}/server.key", "--command-timeout=5s", "endpoint", "health", timeout=10)
add("q6", 1, st is not None and rc == 0 and "--data-dir=/var/lib/etcd-restore" in man and "etcd-m2-check" not in man,
    "etcd đang chạy phải giữ --data-dir=/var/lib/etcd-restore và healthy" if st else "")

# q7 importer bị OOM kill: exit code, dòng log cuối của lần chạy trước, limits.memory 64Mi của loader, chạy ổn, Service trả trang.
got = one(ans("q7-exitcode.txt"))
add("q7", 2, got == "137", f"q7-exitcode.txt='{got}' chưa đúng exit code" if ans("q7-exitcode.txt") else "chưa có /opt/m2/q7-exitcode.txt")
last, got = mark(H, "q7-last"), lines(ans("q7-last.log"))
add("q7", 1, bool(last) and got == [last], "q7-last.log cần đúng một dòng: dòng cuối log lần chạy trước của loader" if got else "chưa có /opt/m2/q7-last.log")
if API:
    d = kj("-n", "m2-q7", "get", "deploy", "importer")
    lo, px = ctr(d, "loader").get("resources") or {}, ctr(d, "proxy").get("resources") or {}
    ok = (qty((lo.get("limits") or {}).get("memory")) == 64 * 1024**2 and qty((lo.get("requests") or {}).get("memory")) == 8 * 1024**2
          and qty((lo.get("requests") or {}).get("cpu")) == 0.005 and qty((px.get("limits") or {}).get("memory")) == 24 * 1024**2)
    add("q7", 2, ok, f"loader: {lo}; proxy limits {px.get('limits')} (chỉ đổi limits.memory của loader thành 64Mi)"[:120] if d else "không thấy Deployment importer")
    ps = pods("m2-q7", "app=importer")
    # Ổn định = Ready và lần kết thúc trước (nếu có) không phải OOM kill (137). Không đòi restartCount 0: VM khởi động lại thì
    # mọi container restart một lần (lastState Unknown, 255) dù đã sửa đúng (đo sau down + up).
    oomk = lambda p: any(((c.get("lastState") or {}).get("terminated") or {}).get("exitCode") == 137 for c in (p.get("status") or {}).get("containerStatuses") or [])
    stable = ps and all(ready(p) and not oomk(p) for p in ps)
    add("q7", 2, ok and deploy_done(d) and bool(stable), "importer chưa Available với Pod mới không bị OOM kill" if d else "")
    ip, _ = svc_ip("m2-q7", "importer")
    tok = mark(H, "q7-token")
    add("q7", 1, bool(ip and tok and tok in curl(f"http://{ip}:80/")), "Service importer chưa trả trang" if d else "")
else: add("q7", 0, False, NOAPI)

# q8 CronJob rotate (tạm dừng) và Job rotate-manual tạo từ nó.
if API:
    cj = kj("-n", "m2-q8", "get", "cronjob", "rotate")
    s = (cj or {}).get("spec") or {}
    js = (s.get("jobTemplate") or {}).get("spec") or {}
    add("q8", 1, cj is not None and s.get("schedule") == "*/30 * * * *" and s.get("concurrencyPolicy") == "Forbid" and s.get("suspend") is True,
        f"rotate: schedule '{s.get('schedule')}', {s.get('concurrencyPolicy')}, suspend {s.get('suspend')}" if cj else "chưa có CronJob rotate")
    add("q8", 1, cj is not None and s.get("successfulJobsHistoryLimit") == 2 and s.get("failedJobsHistoryLimit") == 1
        and js.get("backoffLimit") == 1 and js.get("activeDeadlineSeconds") == 60, "rotate: history 2/1, backoffLimit 1, activeDeadlineSeconds 60" if cj else "")
    c = next((x for x in ((js.get("template") or {}).get("spec") or {}).get("containers") or [] if x.get("name") == "rotate"), {})
    ref = next((((e.get("valueFrom") or {}).get("configMapKeyRef") or {}) for e in c.get("env") or [] if e.get("name") == "TARGET"), {})
    add("q8", 1, ref.get("name") == "rotate-config" and ref.get("key") == "target", "container rotate cần env TARGET từ ConfigMap rotate-config key target" if cj else "")
    j = kj("-n", "m2-q8", "get", "job", "rotate-manual")
    manual = ((j or {}).get("metadata", {}).get("annotations") or {}).get("cronjob.kubernetes.io/instantiate") == "manual" or any(
        o.get("kind") == "CronJob" and o.get("name") == "rotate" for o in (j or {}).get("metadata", {}).get("ownerReferences") or [])
    add("q8", 1, j is not None and manual and cond(j, "Complete").get("status") == "True",
        "Job rotate-manual chưa Complete (tạo bằng create job --from=cronjob/rotate)" if j else "chưa có Job rotate-manual")
    rc, out, _ = run("kubectl", "--request-timeout=8s", "-n", "m2-q8", "logs", "job/rotate-manual", timeout=12) if j else (1, "", "")
    tgt = mark(H, "q8-target")
    add("q8", 1, rc == 0 and bool(tgt) and f"rotate {tgt}" in out, "log của rotate-manual chưa có 'rotate <target>'" if j else "")
else: add("q8", 0, False, NOAPI)

# q9 HTTPRoute web trên m2-gw: header X-Canary: always → web-v2; /old → 301 về /; còn lại → web-v1.
if API:
    r = kj("-n", "m2-q9", "get", "httproute", "web")
    par = next((p for p in ((r or {}).get("status") or {}).get("parents") or [] if (p.get("parentRef") or {}).get("name") == "m2-gw"), {})
    cs = {c.get("type"): c.get("status") for c in par.get("conditions") or []}
    add("q9", 1, cs.get("Accepted") == "True" and cs.get("ResolvedRefs") == "True",
        f"HTTPRoute web: Accepted={cs.get('Accepted')}, ResolvedRefs={cs.get('ResolvedRefs')}" if r else "chưa có HTTPRoute web")
    dp = (kj("-n", "m2-q9", "get", "svc", "-l", "gateway.networking.k8s.io/gateway-name=m2-gw") or {}).get("items") or []
    dip = dp[0]["spec"].get("clusterIP") if dp else None
    v1, v2 = mark(H, "q9-v1"), mark(H, "q9-v2")
    base = f"http://{dip}:8080"
    def via(path="/", hdr=None):
        if not (dip and r): return ""
        a = ["curl", "-s", "--noproxy", "*", "-m", "4", "-H", "Host: app.m2.lab"] + (["-H", hdr] if hdr else []) + [base + path]
        return run(*a, timeout=8)[1]
    plain = [via("/") for _ in range(3)]
    add("q9", 2, bool(v1) and all(v1 in b for b in plain), "request thường (không header) qua m2-gw chưa tới web-v1" if r else "")
    can = [via("/", "X-Canary: always") for _ in range(3)]
    add("q9", 2, bool(v2) and all(v2 in b for b in can) and not any(v2 in b for b in plain), "request có X-Canary: always chưa tới web-v2" if r else "")
    rc, hd, _ = run("curl", "-s", "--noproxy", "*", "-m", "4", "-o", "/dev/null", "-D", "-", "-H", "Host: app.m2.lab", base + "/old", timeout=8) if dip and r else (1, "", "")
    code = (hd.split() or ["", ""])[1] if hd.startswith("HTTP/") else ""
    loc = next((l.split(":", 1)[1].strip() for l in hd.splitlines() if l.lower().startswith("location:")), "")
    add("q9", 2, code == "301" and re.match(r"^(https?://app\.m2\.lab(:\d+)?)?/$", loc) is not None,
        f"/old trả {code or 'lỗi'} Location '{loc[:40]}', cần 301 về /" if r else "")
else: add("q9", 0, False, NOAPI)

# q10 Kustomize overlay prod: build được, base không đổi; prod-api 2 replica nhãn env=prod; Service chọn env=prod; MODE=prod.
OV = f"{D}/kustomize/overlays/prod"
rc, built, _ = run("kubectl", "kustomize", OV, timeout=30)
rc2, sums, _ = run("sh", "-c", f"cd {D}/kustomize/base && sha256sum kustomization.yaml deployment.yaml service.yaml", timeout=10)
base_ok = rc2 == 0 and sums.strip() == (mark(H, "q10-base") or "x")
add("q10", 1, rc == 0 and "prod-api" in built and base_ok, ("thư mục base đã bị sửa" if not base_ok else "kubectl kustomize overlays/prod chưa build được") if rfile(f"{OV}/kustomization.yaml") is not None else "chưa có overlays/prod/kustomization.yaml")
if API:
    d = kj("-n", "m2-q10", "get", "deploy", "prod-api")
    ps = pods("m2-q10", "app=api")
    lab = all((p["metadata"].get("labels") or {}).get("env") == "prod" for p in ps)
    add("q10", 2, d is not None and d["spec"].get("replicas") == 2 and deploy_done(d) and len(ps) == 2 and lab,
        f"prod-api: {(d or {}).get('spec', {}).get('replicas')} replica, nhãn env=prod trên Pod: {lab}" if d else "chưa có Deployment prod-api trong m2-q10")
    _, s = svc_ip("m2-q10", "prod-api")
    sel = (s or {}).get("spec", {}).get("selector") or {}
    eps = [a for e in (kj("-n", "m2-q10", "get", "endpointslice", "-l", "kubernetes.io/service-name=prod-api") or {}).get("items") or []
           for a in e.get("endpoints") or [] if (a.get("conditions") or {}).get("ready")] if s else []
    add("q10", 1, sel.get("env") == "prod" and len(eps) == 2, f"Service prod-api: selector {sel}, {len(eps)} endpoint" if s else "")
    ref = next(((e.get("configMapRef") or {}).get("name") for e in ctr(d, "api").get("envFrom") or []), "") or ""
    pod = live_pod("m2-q10", "app=api")
    rc, out = pexec("m2-q10", pod, "printenv", "MODE", t=8) if pod else (1, "")
    add("q10", 2, re.match(r"^prod-api-config-[a-z0-9]{6,}$", ref) is not None and rc == 0 and out.strip() == "prod",
        f"Pod prod-api: envFrom {ref or '?'}, MODE={out.strip() or '?'} (cần prod-api-config-<hash>, MODE=prod)" if d else "")
else: add("q10", 0, False, NOAPI)

# q11 Service orders: selector và targetPort đúng (sửa Service, không sửa Deployment), frontend gọi được http://orders.
if API:
    _, s = svc_ip("m2-q11", "orders")
    eps = [e for e in (kj("-n", "m2-q11", "get", "endpointslice", "-l", "kubernetes.io/service-name=orders") or {}).get("items") or []] if s else []
    addrs = [a for e in eps for a in e.get("endpoints") or [] if (a.get("conditions") or {}).get("ready")]
    ports = {p.get("port") for e in eps for p in e.get("ports") or []}
    op = {p["status"].get("podIP") for p in pods("m2-q11", "app=orders") if ready(p)}
    add("q11", 2, bool(op) and {x for a in addrs for x in a.get("addresses") or []} == op, f"Service orders: {len(addrs)} endpoint Ready (cần đúng Pod orders)" if s else "không thấy Service orders")
    add("q11", 1, bool(addrs) and ports == {9090}, f"endpoint của orders cổng {sorted(x for x in ports if x)} (Pod nghe 9090)" if s else "")
    fp = live_pod("m2-q11", "app=frontend")
    tok = mark(H, "q11-token")
    body = wget("m2-q11", fp, "http://orders/", t=4) if fp else ""
    add("q11", 3, bool(tok and tok in body), "frontend gọi http://orders chưa nhận trang của orders" if s else "")
    d = kj("-n", "m2-q11", "get", "deploy", "orders")
    tl = (d or {}).get("spec", {}).get("template", {}).get("metadata", {}).get("labels") or {}
    pn = [p.get("name") for p in ctr(d, "orders").get("ports") or []]
    add("q11", 1, bool(tok and tok in body) and tl == {"app": "orders", "tier": "backend"} and pn == ["api"] and (d or {}).get("spec", {}).get("replicas") == 1,
        "Deployment orders đã bị sửa (nhãn, tên cổng, replicas): sửa Service" if body else "")
else: add("q11", 0, False, NOAPI)

# q12 PV m2-archive Released: PVC archive gắn vào nó (không xoá PV), reporter chạy, dữ liệu cũ còn.
if API:
    pvc = kj("-n", "m2-q12", "get", "pvc", "archive")
    ps = (pvc or {}).get("spec") or {}
    bound = pvc is not None and ps.get("volumeName") == "m2-archive" and (pvc.get("status") or {}).get("phase") == "Bound"
    add("q12", 2, bound, f"PVC archive: volume {ps.get('volumeName')}, {((pvc or {}).get('status') or {}).get('phase')}" if pvc else "chưa có PVC archive")
    pv = kj("get", "pv", "m2-archive")
    add("q12", 1, bound and (pv or {}).get("metadata", {}).get("uid") == mark(H, "q12-uid") and (pv or {}).get("spec", {}).get("persistentVolumeReclaimPolicy") == "Retain",
        "PV m2-archive đã bị xoá/tạo lại hay đổi reclaimPolicy (gỡ claimRef, đừng tạo lại PV)" if bound else "")
    p = kj("-n", "m2-q12", "get", "pod", "reporter")
    run_ok = ready(p) and (p.get("status") or {}).get("phase") == "Running"
    add("q12", 1, bound and run_ok, "Pod reporter chưa Running" if bound else "")
    rc, out = pexec("m2-q12", "reporter", "cat", "/data/report.txt", t=8) if run_ok else (1, "")
    add("q12", 1, rc == 0 and out.strip() == (mark(H, "q12-token") or "x"), "reporter chưa đọc được báo cáo cũ trong /data/report.txt" if run_ok else "")
else: add("q12", 0, False, NOAPI)

# q13 PriorityClass m2-high (Never, không mặc định), ledger dùng nó, danh sách class hệ thống ra tệp.
if API:
    pc = kj("get", "priorityclass", "m2-high")
    add("q13", 1, pc is not None and pc.get("value") == 50000 and pc.get("preemptionPolicy") == "Never" and not pc.get("globalDefault"),
        f"m2-high: value {pc.get('value')}, preemptionPolicy {pc.get('preemptionPolicy')}, globalDefault {pc.get('globalDefault')}" if pc else "chưa có PriorityClass m2-high")
    d = kj("-n", "m2-q13", "get", "deploy", "ledger")
    tpc = (d or {}).get("spec", {}).get("template", {}).get("spec", {}).get("priorityClassName")
    add("q13", 1, pc is not None and tpc == "m2-high", f"ledger: priorityClassName {tpc}" if d else "không thấy Deployment ledger")
    ps = pods("m2-q13", "app=ledger")
    add("q13", 2, pc is not None and deploy_done(d) and ps and all(p["spec"].get("priority") == 50000 and ready(p) for p in ps),
        "Pod ledger chưa chạy với priority 50000" if d else "")
else: add("q13", 0, False, NOAPI)
want, got = lines(mark(H, "q13-system")), lines(ans("q13-system.txt"))
add("q13", 1, bool(want) and got == want, f"q13-system.txt ({len(got)} dòng) cần tên các PriorityClass có value ≥ 1000000000, sắp theo tên" if got else "chưa có /opt/m2/q13-system.txt")

# q14 Service headless kv (kv-0.kv phân giải ra IP Pod kv-0) và NodePort kv-primary 30362 chỉ tới kv-0.
if API:
    _, s = svc_ip("m2-q14", "kv")
    sp = (s or {}).get("spec") or {}
    add("q14", 1, s is not None and sp.get("clusterIP") == "None" and (sp.get("selector") or {}).get("app") == "kv",
        f"Service kv: clusterIP {sp.get('clusterIP')}, selector {sp.get('selector')}" if s else "chưa có Service kv")
    k0 = kj("-n", "m2-q14", "get", "pod", "kv-0")
    ip0 = ((k0 or {}).get("status") or {}).get("podIP")
    pr = live_pod("m2-q14", "app=probe")
    rc, out = pexec("m2-q14", pr, "nslookup", "kv-0.kv.m2-q14.svc.cluster.local", t=8) if pr and s else (1, "")
    a = out.split("Name:", 1)[1] if "Name:" in out else ""
    add("q14", 2, bool(ip0) and set(re.findall(r"Address(?:es)?:?\s+(\d+\.\d+\.\d+\.\d+)", a)) == {ip0},
        "kv-0.kv.m2-q14.svc.cluster.local chưa phân giải ra IP Pod kv-0" if s else "")
    _, np_ = svc_ip("m2-q14", "kv-primary")
    nps = [(p.get("port"), p.get("nodePort")) for p in ((np_ or {}).get("spec") or {}).get("ports") or []]
    add("q14", 1, np_ is not None and np_["spec"].get("type") == "NodePort" and nps == [(8080, 30362)],
        f"kv-primary: {np_['spec'].get('type')} {nps}" if np_ else "chưa có Service kv-primary")
    n1 = kj("get", "node", "cka-w1")
    w1 = next((x["address"] for x in ((n1 or {}).get("status") or {}).get("addresses") or [] if x.get("type") == "InternalIP"), None)
    tok = mark(H, "q14-token")
    hits = [curl(f"http://{w1}:30362/", t=3) for _ in range(6)] if np_ and w1 else []
    add("q14", 2, bool(hits and tok) and all(h.strip() == f"kv-0 {tok}" for h in hits),
        f"NodePort 30362 trả: {', '.join(sorted(set(h.split()[0] if h.split() else 'lỗi' for h in hits)))} (cần chỉ kv-0)" if np_ else "")
else: add("q14", 0, False, NOAPI)

# q15 lệnh kubeadm join (token mới TTL 2h, description m2-q15, hash CA) và xoá token m2-stale.
join = re.sub(r"\\\n", " ", ans("q15-join.sh") or "")
ep = mark(H, "q15-endpoint") or "x"
m = re.search(r"\bkubeadm\s+join\s+(\S+)", join)
add("q15", 1, bool(m) and m.group(1) == ep, f"q15-join.sh: kubeadm join {m.group(1) if m else '?'} (cần {ep})" if join else "chưa có /opt/m2/q15-join.sh")
tok = re.search(r"--token[= ]+([a-z0-9]{6})\.([a-z0-9]{16})\b", join)
secs = {}
if API:
    for s in (kj("-n", "kube-system", "get", "secret", "--field-selector", "type=bootstrap.kubernetes.io/token") or {}).get("items") or []:
        dd = {k: base64.b64decode(v).decode(errors="replace") for k, v in (s.get("data") or {}).items()}
        dd["_created"] = ts(s["metadata"].get("creationTimestamp"))
        secs[dd.get("token-id")] = dd
# Chấm token theo chính nó, không theo giờ dựng đề: Secret bootstrap-token-<id> có thật, đúng token-secret, description
# m2-q15, tạo sau lúc dựng đề, không phải token m2-stale của đề, TTL = expiration − creationTimestamp ≈ 2 giờ (±5 phút), và
# apiserver nhận nó (`kubectl --token … auth whoami` ra system:bootstrap:<id>). Token đã hết hạn thì tokencleaner xoá Secret:
# không kiểm được nữa thì 0 điểm phần này (không có nhánh "cho qua").
t = secs.get(tok.group(1)) if tok else None
exp, made = ts((t or {}).get("expiration")), (t or {}).get("_created")
ttl = (exp - made) if exp is not None and made is not None else None
real = bool(t) and t.get("token-secret") == tok.group(2) and tok.group(1) not in (mark(H, "q15-stale") or "").split()
who = ""
if real:
    rc, out, _ = run("kubectl", "--kubeconfig=/dev/null", f"--server=https://{ep}", "--certificate-authority=/etc/kubernetes/pki/ca.crt",
                     f"--token={tok.group(1)}.{tok.group(2)}", "--request-timeout=8s", "auth", "whoami", "-o", "json", timeout=12)
    try: who = json.loads(out)["status"]["userInfo"]["username"] if rc == 0 else ""
    except Exception: who = ""
tok_ok = (real and t.get("description") == "m2-q15" and made is not None and made >= STARTED_AT - 5
          and ttl is not None and abs(ttl - 7200) <= 300 and who == f"system:bootstrap:{tok.group(1)}")
add("q15", 2, tok_ok,
    ("q15-join.sh chưa có --token hợp lệ" if join else "") if not tok else NOAPI if not API else
    "token trong q15-join.sh không có trong cluster (hết hạn, bị xoá, hay không phải token thật)" if not real else
    f"token: description '{t.get('description')}', TTL {int(ttl / 60) if ttl is not None else '?'} phút (cần 120), apiserver nhận: {who or 'không'}")
hs = re.search(r"--discovery-token-ca-cert-hash[= ]+sha256:([0-9a-f]{64})\b", join)
add("q15", 2, bool(hs) and hs.group(1) == mark(H, "q15-hash"), "q15-join.sh: --discovery-token-ca-cert-hash sha256:<hash> chưa đúng CA cluster" if join else "")
stale = (mark(H, "q15-stale") or "").split()
left = [x for x in stale if x in secs]
add("q15", 1, API and real and bool(stale) and not left and not any(v.get("description") == "m2-stale" for v in secs.values()),
    "còn token description m2-stale (kubeadm token list)" if left or any(v.get("description") == "m2-stale" for v in secs.values()) else "")

# q16 toolbox: reason, image nạp vào containerd cka-w2 (Pod chạy, template không đổi).
got = one(ans("q16-reason.txt"))
add("q16", 2, got == "ErrImageNeverPull", f"q16-reason.txt='{got}' chưa đúng reason" if ans("q16-reason.txt") else "chưa có /opt/m2/q16-reason.txt")
if API:
    d = kj("-n", "m2-q16", "get", "deploy", "toolbox")
    c = ctr(d, "tools")
    tsp = (d or {}).get("spec", {}).get("template", {}).get("spec", {})
    same = c.get("image") == "m2.lab/tools:1.0" and c.get("imagePullPolicy") == "Never" and tsp.get("nodeSelector") == {"kubernetes.io/hostname": "cka-w2"}
    ps = pods("m2-q16", "app=toolbox")
    up = [p for p in ps if ready(p) and p["spec"].get("nodeName") == "cka-w2" and p["spec"]["containers"][0].get("image") == "m2.lab/tools:1.0"]
    # Image thật của bản xuất (config có M2_TOOLS=1.0), không phải busybox gắn tên mới.
    rc, out = pexec("m2-q16", up[0]["metadata"]["name"], "printenv", "M2_TOOLS", t=8) if up else (1, "")
    add("q16", 3, bool(up) and rc == 0 and out.strip() == "1.0",
        "chưa có Pod toolbox Ready trên cka-w2 chạy image m2.lab/tools:1.0 của /opt/m2-images/tools.tar" if d else "không thấy Deployment toolbox")
    add("q16", 2, bool(up) and same and deploy_done(d), "Deployment toolbox đã bị đổi (image, imagePullPolicy, nodeSelector)" if up and not same else ("toolbox chưa Available" if d else ""))
else: add("q16", 0, False, NOAPI)

emit()
PY
