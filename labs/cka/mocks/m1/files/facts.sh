# m1 — dữ kiện chấm của score.sh trên cka-cp (user ubuntu, sudo; kubectl, helm, curl, etcdutl, python3). Bên gửi ghép
# files/qlib.sh lên trước (MOCK_QLIB_PY) và đặt W1_ACTIVE, W1_CFG (node.sh STEP=facts trên cka-w1).
# Chỉ đọc (kubectl get/exec/auth can-i, helm list, curl, etcdutl snapshot status); mỗi lệnh có timeout, apiserver không trả
# lời thì phần cần apiserver được 0 ngay (không treo): chậm nhất ~3 phút, thường 30–60 giây.
# In `GOT qN <điểm>` và `WHY qN <lý do>` cho 16 câu; điểm tối đa của từng câu nằm ở score.sh (bảng TABLE, trùng mocks.js).
# Chấm theo sự thật trên cluster và mốc do stage.sh ghi ở /root/.lab/m1/ (tên Pod, mã trang, revision, CRD, CRI/CNI thật),
# không theo chuỗi đoán được. Mỗi câu chấm từng phần: tạo đúng tên mà sai spec chỉ được phần đúng.
python3 - "$HOME" <<'PY'
import json, os, re, sys, time
exec(os.environ.get("MOCK_QLIB_PY", "raise SystemExit('thiếu files/qlib.sh')"))
H = "/root/.lab/m1"
D = "/opt/m1"
STARTED = mark(H, "started")
def ans(name): return rfile(f"{D}/{name}")
def svc_ip(ns, name):
    s = kj("-n", ns, "get", "svc", name) if API else None
    return (s or {}).get("spec", {}).get("clusterIP"), s
def deploy_done(d):
    if not d: return False
    st, want = d.get("status") or {}, d["spec"].get("replicas", 1)
    return (st.get("observedGeneration", 0) >= d["metadata"].get("generation", 0) and st.get("replicas", 0) == want
            and st.get("updatedReplicas", 0) == st.get("readyReplicas", 0) == st.get("availableReplicas", 0) == want)
NOAPI = "apiserver không trả lời"
for q in ["q%d" % i for i in range(1, 17)]: Q.setdefault(q, [0, []])
if not STARTED:
    for q in Q: Q[q][1].append("chưa dựng đề (mock cka m1 start)")
    emit(); sys.exit(0)

# q1 RBAC — SA deployer, Role deployer (deployments: get list watch create update patch; pods: get list), RoleBinding.
if API:
    sa = kj("-n", "m1-q1", "get", "sa", "deployer")
    add("q1", 1, sa is not None, "chưa có ServiceAccount deployer")
    who = "system:serviceaccount:m1-q1:deployer"
    def can(verb, res, ns="m1-q1"):
        rc, out, _ = run("kubectl", "--request-timeout=8s", "auth", "can-i", verb, res, "-n", ns, f"--as={who}", timeout=12)
        return out.strip() == "yes"
    dep_ok = all(can(v, "deployments.apps") for v in ("get", "list", "watch", "create", "update", "patch"))
    add("q1", 1, dep_ok, "SA chưa get/list/watch/create/update/patch được deployments trong m1-q1")
    pod_ok = can("get", "pods") and can("list", "pods")
    add("q1", 1, pod_ok, "SA chưa get/list được pods")
    extra = [x for x, y in (("delete deployments", can("delete", "deployments.apps")), ("get secrets", can("get", "secrets")),
                            ("create pods", can("create", "pods")), ("deployments ở m1-q2", can("create", "deployments.apps", "m1-q2")))
             if y]
    add("q1", 2, dep_ok and pod_ok and not extra, "thừa quyền: " + ", ".join(extra) if extra else "chưa có quyền cần (phần tối thiểu chỉ tính khi đủ quyền)")
    rb = kj("-n", "m1-q1", "get", "rolebinding", "deployer")
    rr = (rb or {}).get("roleRef") or {}
    subj = any(s.get("kind") == "ServiceAccount" and s.get("name") == "deployer" and s.get("namespace", "m1-q1") == "m1-q1"
               for s in (rb or {}).get("subjects") or [])
    add("q1", 1, rr.get("kind") == "Role" and rr.get("name") == "deployer" and subj,
        "RoleBinding deployer chưa gắn Role deployer cho SA deployer" + (f" (roleRef {rr.get('kind')}/{rr.get('name')})" if rb else ""))
else: add("q1", 0, False, NOAPI)

# q2 HPA — web: min 2, max 4, cpu 50%; Deployment có requests.cpu 20m; HPA đọc được metric.
if API:
    h = kj("-n", "m1-q2", "get", "hpa.v2.autoscaling", "web")
    sp = (h or {}).get("spec") or {}
    tr = sp.get("scaleTargetRef") or {}
    add("q2", 1, tr.get("kind") == "Deployment" and tr.get("name") == "web", "chưa có HPA web trỏ Deployment web")
    add("q2", 1, h is not None and sp.get("minReplicas") == 2 and sp.get("maxReplicas") == 4,
        f"min/max {sp.get('minReplicas')}/{sp.get('maxReplicas')}, cần 2/4" if h else "")
    m = [x for x in sp.get("metrics") or [] if x.get("type") == "Resource" and (x.get("resource") or {}).get("name") == "cpu"]
    t = ((m[0]["resource"].get("target") or {}) if m else {})
    add("q2", 1, len(sp.get("metrics") or []) == 1 and t.get("type") == "Utilization" and t.get("averageUtilization") == 50,
        "metric cần đúng một: cpu Utilization 50%" if h else "")
    d = kj("-n", "m1-q2", "get", "deploy", "web")
    c = ((d or {}).get("spec", {}).get("template", {}).get("spec", {}).get("containers") or [{}])[0]
    rq = qty(((c.get("resources") or {}).get("requests") or {}).get("cpu"))
    add("q2", 1, rq is not None and abs(rq - 0.02) < 1e-9 and deploy_done(d), f"Deployment web: requests.cpu {rq}, cần 20m và rollout xong")
    act = cond(h, "ScalingActive").get("status") == "True" and any(
        x.get("type") == "Resource" for x in ((h or {}).get("status") or {}).get("currentMetrics") or [])
    add("q2", 1, act, "HPA chưa đọc được CPU (ScalingActive, currentMetrics)" if h else "")
else: add("q2", 0, False, NOAPI)

# q3 StorageClass m1-fast + PVC cache + Pod cache-writer.
if API:
    sc = kj("get", "sc", "m1-fast")
    default = ((sc or {}).get("metadata", {}).get("annotations") or {}).get("storageclass.kubernetes.io/is-default-class") == "true"
    add("q3", 1, sc is not None and sc.get("provisioner") == "rancher.io/local-path" and sc.get("reclaimPolicy") == "Retain",
        f"StorageClass m1-fast: provisioner {sc.get('provisioner')}, reclaimPolicy {sc.get('reclaimPolicy')}" if sc else "chưa có StorageClass m1-fast")
    add("q3", 1, sc is not None and sc.get("volumeBindingMode") == "WaitForFirstConsumer" and not default,
        "m1-fast cần WaitForFirstConsumer và không là lớp mặc định" if sc else "")
    pvc = kj("-n", "m1-q3", "get", "pvc", "cache")
    ps = (pvc or {}).get("spec") or {}
    req = qty(((ps.get("resources") or {}).get("requests") or {}).get("storage"))
    add("q3", 1, pvc is not None and ps.get("storageClassName") == "m1-fast" and ps.get("accessModes") == ["ReadWriteOnce"]
        and req == 200 * 1024**2, f"PVC cache: class {ps.get('storageClassName')}, {ps.get('accessModes')}, {req}" if pvc else "chưa có PVC cache")
    add("q3", 1, ((pvc or {}).get("status") or {}).get("phase") == "Bound", "PVC cache chưa Bound" if pvc else "")
    p = kj("-n", "m1-q3", "get", "pod", "cache-writer")
    vols = {v["name"]: (v.get("persistentVolumeClaim") or {}).get("claimName") for v in (p or {}).get("spec", {}).get("volumes") or []}
    mnt = any(vols.get(m.get("name")) == "cache" and m.get("mountPath") == "/cache"
              for c in (p or {}).get("spec", {}).get("containers") or [] for m in c.get("volumeMounts") or [])
    add("q3", 1, mnt and ((p or {}).get("status") or {}).get("phase") == "Running", "Pod cache-writer chưa Running với PVC cache ở /cache")
else: add("q3", 0, False, NOAPI)

# q4 log và metrics ra tệp (không cần apiserver: chấm theo mốc).
want = lines(mark(H, "q4-errors"))
got = lines(ans("q4-errors.log"))
if not want: add("q4", 0, False, "thiếu mốc q4 (chạy lại mock start)")
elif got == want: add("q4", 4, True, "")
elif got and all(w in got for w in want): add("q4", 2, True, ""); add("q4", 0, False, "q4-errors.log có thêm dòng không phải ERROR của parser")
else: add("q4", 0, False, "q4-errors.log chưa đúng các dòng ERROR của container parser" if got else "chưa có /opt/m1/q4-errors.log")
top, got = mark(H, "q4-top"), lines(ans("q4-top.txt"))
if got == [top]: add("q4", 4, True, "")
elif top and len(got) == 1 and top in got[0].split("/")[-1].split(): add("q4", 2, True, ""); add("q4", 0, False, "q4-top.txt cần đúng tên Pod, không thêm gì")
else: add("q4", 0, False, f"q4-top.txt='{' '.join(got)[:30]}' chưa phải Pod ngốn CPU nhất của m1-q4" if got else "chưa có /opt/m1/q4-top.txt")

# q5 NetworkPolicy api-ingress.
if API:
    np = kj("-n", "m1-q5", "get", "netpol", "api-ingress")
    sp = (np or {}).get("spec") or {}
    add("q5", 2, np is not None and (sp.get("podSelector") or {}).get("matchLabels") == {"app": "api"} and "Ingress" in (sp.get("policyTypes") or ["Ingress"]),
        "NetworkPolicy api-ingress chưa chọn app=api (Ingress)" if np else "chưa có NetworkPolicy api-ingress")
    ip, _ = svc_ip("m1-q5", "api")
    tok = mark(H, "q5-token")
    url = f"http://{ip}:8080/"
    def reach(ns, sel):
        pod = live_pod(ns, sel)
        if not pod: return None
        return tok in wget(ns, pod, url, t=3)
    other, outsider, client = reach("m1-q5", "app=other"), reach("m1-q14", "app=client"), reach("m1-q5", "app=client")
    # "Bị chặn" chỉ tính khi client vẫn tới được api (api chết hay chưa Ready thì mọi phép thử đều "bị chặn" mà không ai làm gì).
    add("q5", 2, other is False and client is True, "Pod other trong m1-q5 vẫn gọi được api" if other else "Pod client chưa gọi được api:8080")
    add("q5", 1, outsider is False and client is True, "Pod app=client ở namespace m1-q14 vẫn gọi được api" if outsider else "")
    add("q5", 2, client is True and np is not None, "Pod client chưa gọi được api:8080" if np else "")
else: add("q5", 0, False, NOAPI)

# q6 etcd snapshot (không cần apiserver).
rc, out, err = run("sudo", "-n", "etcdutl", "snapshot", "status", f"{D}/etcd.db", "-w", "json", timeout=30)
try: st = json.loads(out) if rc == 0 else None
except Exception: st = None
add("q6", 3, st is not None and st.get("revision", 0) > 0, "chưa có snapshot hợp lệ ở /opt/m1/etcd.db" if rc else "etcd.db không đọc được")
rv = mark(H, "q6-rv")
add("q6", 2, st is not None and rv and str(rv).isdigit() and st.get("revision", 0) >= int(rv),
    f"snapshot revision {st.get('revision')} cũ hơn lúc dựng đề ({rv})" if st else "")
cmd = ans("q6-restore.sh") or ""
ok = re.search(r"\bsnapshot\s+restore\b", cmd) and "/opt/m1/etcd.db" in cmd and re.search(r"--data-dir[= ]+/var/lib/etcd-m1/?(\s|$)", cmd)
add("q6", 2, bool(ok), "q6-restore.sh cần lệnh snapshot restore /opt/m1/etcd.db --data-dir /var/lib/etcd-m1" if cmd else "chưa có /opt/m1/q6-restore.sh")

# q7 rollout: shopfront về revision VERSION=v1; số revision của v1 vào q7-revision.txt.
if API:
    d = kj("-n", "m1-q7", "get", "deploy", "shopfront")
    env = {e.get("name"): e.get("value") for c in (d or {}).get("spec", {}).get("template", {}).get("spec", {}).get("containers") or [] for e in c.get("env") or []}
    ps = pods("m1-q7", "app=shopfront")
    penv = [{e.get("name"): e.get("value") for c in p["spec"]["containers"] for e in c.get("env") or []}.get("VERSION") for p in ps]
    add("q7", 3, env.get("VERSION") == "v1" and deploy_done(d) and penv and all(v == "v1" for v in penv),
        f"shopfront: VERSION {env.get('VERSION')}, Pod {','.join(sorted(set(str(v) for v in penv)))[:40]}" if d else "không thấy Deployment shopfront")
else: add("q7", 0, False, NOAPI)
r, got = mark(H, "q7-rev"), lines(ans("q7-revision.txt"))
add("q7", 2, r is not None and got == [r], f"q7-revision.txt='{' '.join(got)[:20]}' chưa đúng revision của v1" if got else "chưa có /opt/m1/q7-revision.txt")

# q8 web không trả lời: image, readinessProbe đúng cổng (không xoá probe), Service trả trang.
if API:
    d = kj("-n", "m1-q8", "get", "deploy", "web")
    c = ((d or {}).get("spec", {}).get("template", {}).get("spec", {}).get("containers") or [{}])[0]
    add("q8", 2, c.get("image") in ("busybox:1.37", "docker.io/library/busybox:1.37") and deploy_done(d) and (d or {})["spec"].get("replicas") == 2,
        f"web: image {c.get('image')}, rollout {'xong' if deploy_done(d) else 'chưa xong'} (cần 2 replica sẵn sàng)" if d else "không thấy Deployment web")
    hg = ((c.get("readinessProbe") or {}).get("httpGet") or {})
    port = hg.get("port")
    named = {p.get("name"): p.get("containerPort") for p in c.get("ports") or []}
    add("q8", 2, port == 8080 or named.get(port) == 8080, "readinessProbe cần httpGet vào cổng 8080 (sửa, đừng xoá)" if c else "")
    ip, _ = svc_ip("m1-q8", "web")
    body = curl(f"http://{ip}:80/") if ip else ""
    add("q8", 3, mark(H, "q8-token") in body if body else False, "curl Service web chưa trả trang")
else: add("q8", 0, False, NOAPI)

# q9 Service echo + HTTPRoute echo qua Gateway m1-gw.
if API:
    ip, s = svc_ip("m1-q9", "echo")
    sp = (s or {}).get("spec") or {}
    tok = mark(H, "q9-token")
    body = curl(f"http://{ip}:80/") if ip and sp.get("type", "ClusterIP") == "ClusterIP" else ""
    add("q9", 3, bool(tok and tok in body), "Service echo (ClusterIP, cổng 80) chưa trả trang của echo" if s else "chưa có Service echo")
    r = kj("-n", "m1-q9", "get", "httproute", "echo")
    par = next((p for p in ((r or {}).get("status") or {}).get("parents") or [] if (p.get("parentRef") or {}).get("name") == "m1-gw"), {})
    cs = {c.get("type"): c.get("status") for c in par.get("conditions") or []}
    rs = (r or {}).get("spec") or {}
    add("q9", 2, cs.get("Accepted") == "True" and cs.get("ResolvedRefs") == "True" and "echo.m1.lab" in (rs.get("hostnames") or ["echo.m1.lab"]),
        f"HTTPRoute echo: Accepted={cs.get('Accepted')}, ResolvedRefs={cs.get('ResolvedRefs')}" if r else "chưa có HTTPRoute echo")
    dp = [x for x in (kj("-n", "m1-q9", "get", "svc", "-l", "gateway.networking.k8s.io/gateway-name=m1-gw") or {}).get("items") or []]
    dip = dp[0]["spec"].get("clusterIP") if dp else None
    via = curl(f"http://{dip}:8080/", host="echo.m1.lab") if dip and r else ""
    add("q9", 2, bool(tok and tok in via), "request qua Gateway m1-gw (echo.m1.lab:8080) chưa tới echo" if r else "")
else: add("q9", 0, False, NOAPI)

# q10 Helm release notice từ /opt/m1/charts/notice: replicaCount 2, service.port 8088, message maintenance-2200.
if API:
    rc, out, _ = run("helm", "list", "-n", "m1-q10", "-o", "json", timeout=30)
    try: rel = next((x for x in json.loads(out) if x.get("name") == "notice"), None) if rc == 0 else None
    except Exception: rel = None
    add("q10", 1, rel is not None and rel.get("status") == "deployed" and str(rel.get("chart", "")).startswith("notice-"),
        f"release notice {rel.get('status')}" if rel else "chưa có release notice trong m1-q10")
    d = kj("-n", "m1-q10", "get", "deploy", "notice")
    add("q10", 2, rel is not None and d is not None and d["spec"].get("replicas") == 2 and deploy_done(d),
        f"Deployment notice: {(d or {}).get('spec', {}).get('replicas')} replica, cần 2 sẵn sàng" if d else "")
    ip, s = svc_ip("m1-q10", "notice")
    ports = [p.get("port") for p in ((s or {}).get("spec") or {}).get("ports") or []]
    add("q10", 1, rel is not None and ports == [8088], f"Service notice cổng {ports}, cần 8088" if s else "")
    body = curl(f"http://{ip}:8088/") if ip and rel else ""
    add("q10", 2, "maintenance-2200" in body, "Service notice:8088 chưa trả message maintenance-2200" if rel else "")
else: add("q10", 0, False, NOAPI)

# q11 PV tĩnh m1-data + PVC data; PV m1-old sang Retain.
if API:
    old = kj("get", "pv", "m1-old")
    add("q11", 1, (old or {}).get("spec", {}).get("persistentVolumeReclaimPolicy") == "Retain", "PV m1-old chưa Retain" if old else "không thấy PV m1-old")
    pv = kj("get", "pv", "m1-data")
    s = (pv or {}).get("spec") or {}
    probs = [x for x, okk in (("capacity 128Mi", qty((s.get("capacity") or {}).get("storage")) == 128 * 1024**2),
                               ("ReadWriteOnce", s.get("accessModes") == ["ReadWriteOnce"]),
                               ("hostPath /srv/m1-data", (s.get("hostPath") or {}).get("path", "").rstrip("/") == "/srv/m1-data"),
                               ("class m1-manual", s.get("storageClassName") == "m1-manual"),
                               ("Retain", s.get("persistentVolumeReclaimPolicy") == "Retain")) if not okk]
    add("q11", 2, pv is not None and not probs, "PV m1-data thiếu: " + ", ".join(probs) if pv else "chưa có PV m1-data")
    pvc = kj("-n", "m1-q11", "get", "pvc", "data")
    ps = (pvc or {}).get("spec") or {}
    add("q11", 2, pvc is not None and ps.get("storageClassName") == "m1-manual" and ps.get("volumeName") == "m1-data"
        and ((pvc.get("status") or {}).get("phase") == "Bound") and qty(((ps.get("resources") or {}).get("requests") or {}).get("storage")) == 100 * 1024**2,
        f"PVC data: class {ps.get('storageClassName')}, volume {ps.get('volumeName')}, {((pvc or {}).get('status') or {}).get('phase')}" if pvc else "chưa có PVC data")
else: add("q11", 0, False, NOAPI)

# q12 kubelet cka-w1: cấu hình kubelet đang chạy (configz) có clusterDNS = ClusterIP kube-dns; config.yaml như bản kubeadm
# (sửa tệp, không chèn cờ); Pod dns-probe tạo lại trên cka-w1 nhận nameserver đúng và Ready (phân giải được).
act, cfg = os.environ.get("W1_ACTIVE", ""), os.environ.get("W1_CFG", "")
if API:
    dns_ip, _ = svc_ip("kube-system", "kube-dns")
    rc, out, _ = run("kubectl", "--request-timeout=8s", "get", "--raw", "/api/v1/nodes/cka-w1/proxy/configz", timeout=12)
    try: live = json.loads(out)["kubeletconfig"].get("clusterDNS") if rc == 0 else None
    except Exception: live = None
    add("q12", 3, act == "active" and bool(dns_ip) and live == [dns_ip],
        f"kubelet cka-w1 đang chạy với clusterDNS {live} (kube-dns {dns_ip})" if live is not None else f"không đọc được configz của kubelet cka-w1 (kubelet {act or '?'})")
    add("q12", 2, act == "active" and cfg == "đạt", cfg if cfg and cfg != "đạt" else f"kubelet cka-w1 {act or '?'}")
    d = kj("-n", "m1-q12", "get", "deploy", "dns-probe")
    pod = next((p for p in pods("m1-q12", "app=dns-probe") if p["spec"].get("nodeName") == "cka-w1" and ready(p)), None)
    rc, out = pexec("m1-q12", pod["metadata"]["name"], "cat", "/etc/resolv.conf", t=8) if pod else (1, "")
    ns_ok = rc == 0 and f"nameserver {dns_ip}" in lines(out)
    add("q12", 3, deploy_done(d) and pod is not None and ns_ok,
        "Pod dns-probe trên cka-w1 chưa Ready với nameserver kube-dns (tạo lại Pod sau khi sửa kubelet)" if d else "không thấy Deployment dns-probe")
else: add("q12", 0, False, NOAPI)

# q13 sidecar native: Pod logger, initContainers shipper restartPolicy Always, emptyDir chung, shipper in log của app.
if API:
    p = kj("-n", "m1-q13", "get", "pod", "logger")
    sp = (p or {}).get("spec") or {}
    add("q13", 1, p is not None and ready(p) and (p.get("status") or {}).get("phase") == "Running", "Pod logger chưa Running/Ready" if p else "chưa có Pod logger")
    sh = next((c for c in sp.get("initContainers") or [] if c.get("name") == "shipper"), None)
    add("q13", 2, sh is not None and sh.get("restartPolicy") == "Always", "shipper chưa là sidecar (initContainers + restartPolicy: Always)" if p else "")
    ed = {v["name"] for v in sp.get("volumes") or [] if "emptyDir" in v}
    app = next((c for c in sp.get("containers") or [] if c.get("name") == "app"), None)
    anysh = sh or next((c for c in sp.get("containers") or [] if c.get("name") == "shipper"), None)
    def mounts(c): return {m.get("name") for m in (c or {}).get("volumeMounts") or []}
    add("q13", 1, bool(ed & mounts(app) & mounts(anysh)), "app và shipper chưa dùng chung một emptyDir" if p else "")
    rc, out, _ = run("kubectl", "--request-timeout=8s", "-n", "m1-q13", "logs", "logger", "-c", "shipper", "--tail=20", timeout=12) if p else (1, "", "")
    add("q13", 1, rc == 0 and len(lines(out)) > 0, "log của shipper rỗng (tail -F tệp app ghi?)" if p else "")
else: add("q13", 0, False, NOAPI)

# q14 CoreDNS: legacy.m1.lab → ClusterIP backend; tên cũ còn phân giải; Corefile bền trong ConfigMap, CoreDNS sẵn sàng.
if API:
    ip, _ = svc_ip("m1-q14", "backend")
    pod = live_pod("m1-q14", "app=client")
    def look(name):
        rc, out = pexec("m1-q14", pod, "nslookup", name, t=8)
        a = out.split("Name:", 1)[1] if "Name:" in out else ""
        return set(re.findall(r"Address(?:es)?:?\s+(\d+\.\d+\.\d+\.\d+)", a))
    # Ba lần: hai Pod CoreDNS nạp Corefile mới độc lập (reload ~30–60 giây mỗi Pod); đủ điểm khi cả ba lần đều đúng.
    tries = [look("legacy.m1.lab") for _ in range(3)] if pod else [set()]
    got = next((t for t in tries if t != {ip}), tries[0])
    add("q14", 3, bool(ip) and all(t == {ip} for t in tries), f"legacy.m1.lab → {','.join(sorted(got)) or 'không phân giải'}, cần ClusterIP backend" if pod else "không có Pod dns-client Ready")
    cm = kj("-n", "kube-system", "get", "cm", "coredns")
    cf = ((cm or {}).get("data") or {}).get("Corefile", "")
    good = rfile(f"{H}/Corefile")
    changed = bool(cf) and good is not None and cf != good
    cat_ip, _ = svc_ip("shop", "catalog")
    keep = changed and pod and look("catalog.shop.svc.cluster.local") == {cat_ip} and len(look("db.shop.internal")) == 1
    add("q14", 2, keep, "tên cũ (catalog.shop, db.shop.internal) phải còn phân giải" if changed else "Corefile chưa đổi")
    cd = kj("-n", "kube-system", "get", "deploy", "coredns")
    add("q14", 1, changed and "m1.lab" in cf and deploy_done(cd), "CoreDNS chưa sẵn sàng sau khi sửa" if changed else "")
else: add("q14", 0, False, NOAPI)

# q15 CRD cert-manager, tài liệu spec.subject, CRI và CNI của cka-w2 (chấm theo mốc đọc thật lúc dựng).
want, got = lines(mark(H, "q15-crds")), lines(ans("q15-crds.txt"))
add("q15", 2, bool(want) and sorted(got) == sorted(want), f"q15-crds.txt ({len(got)} dòng) cần mỗi dòng đúng một tên CRD, đủ {len(want)} CRD *.cert-manager.io" if got else "chưa có /opt/m1/q15-crds.txt")
fields, doc = lines(mark(H, "q15-subject")), ans("q15-subject.txt") or ""
miss = [f for f in fields if not re.search(r"(^|\s)" + re.escape(f) + r"\s", doc, re.M)]
add("q15", 2, bool(fields) and bool(doc) and not miss and "subject" in doc.lower(),
    f"q15-subject.txt thiếu trường {', '.join(miss[:3])}" if doc else "chưa có /opt/m1/q15-subject.txt")
def sock(s): return re.sub(r"^unix://", "", (s or "").strip()).replace("/var/run/", "/run/")
cri, got = mark(H, "q15-cri"), lines(ans("q15-cri.txt"))
add("q15", 1, bool(cri) and len(got) == 1 and sock(got[0]) == sock(cri), "q15-cri.txt chưa đúng containerRuntimeEndpoint của cka-w2" if got else "chưa có /opt/m1/q15-cri.txt")
cni, got = mark(H, "q15-cni"), lines(ans("q15-cni.txt"))
add("q15", 1, bool(cni) and got == [cni], "q15-cni.txt chưa đúng tệp cấu hình CNI cka-w2 dùng" if got else "chưa có /opt/m1/q15-cni.txt")

# q16 worker Pending: reason, requests 50m, ConfigMap worker-config MODE=batch (giữ envFrom), 2 replica chạy, MODE trong Pod.
rs = lines(ans("q16-reason.txt"))
add("q16", 1, [x.lower() for x in rs] == ["failedscheduling"], f"q16-reason.txt='{' '.join(rs)[:30]}' chưa đúng reason" if rs else "chưa có /opt/m1/q16-reason.txt")
if API:
    d = kj("-n", "m1-q16", "get", "deploy", "worker")
    c = ((d or {}).get("spec", {}).get("template", {}).get("spec", {}).get("containers") or [{}])[0]
    rq = qty(((c.get("resources") or {}).get("requests") or {}).get("cpu"))
    add("q16", 1, rq is not None and abs(rq - 0.05) < 1e-9, f"requests.cpu {rq}, cần 50m" if d else "không thấy Deployment worker")
    cm = kj("-n", "m1-q16", "get", "cm", "worker-config")
    ref = any((e.get("configMapRef") or {}).get("name") == "worker-config" for e in c.get("envFrom") or [])
    add("q16", 2, ((cm or {}).get("data") or {}).get("MODE") == "batch" and ref,
        "cần ConfigMap worker-config MODE=batch và container vẫn envFrom nó" if d else "")
    add("q16", 2, d is not None and d["spec"].get("replicas") == 2 and deploy_done(d), "worker chưa đủ 2 replica sẵn sàng" if d else "")
    pod = live_pod("m1-q16", "app=worker")
    rc, out = pexec("m1-q16", pod, "printenv", "MODE", t=8) if pod else (1, "")
    add("q16", 1, rc == 0 and out.strip() == "batch", "MODE trong Pod worker chưa là batch" if pod else "")
else: add("q16", 0, False, NOAPI)

emit()
PY
