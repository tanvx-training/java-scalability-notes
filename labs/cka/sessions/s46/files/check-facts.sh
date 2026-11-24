# s46 — dữ kiện của check.sh trên cka-cp (user ubuntu, sudo): phần của cuối s45 mà sự cố st9-app không đụng (nó chỉ sửa
# container của catalog, order, gateway). In dạng KHOÁ=giá-trị. Chỉ đọc; mỗi lệnh có timeout.
#   DATA  dữ liệu như cuối s44/s45: ConfigMap before-snapshot có, after-snapshot NotFound thật (không phải lệnh lỗi), release
#         shop deployed, postgres-0 Ready; revision và raft index của etcd không nhỏ hơn mốc sự cố st8-ops của s45
#         (/root/.lab/st8-ops/rev, raft: restore lại snapshot là lùi dữ liệu).
python3 - <<'PY'
import json, subprocess
PKI = "/etc/kubernetes/pki/etcd"
def run(*args, timeout=20):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def k(*a): return run("kubectl", "--request-timeout=10s", *a)
bad = []
rc, _, err = k("-n", "shop", "get", "cm", "before-snapshot", "-o", "name")
if rc != 0: bad.append("thiếu before-snapshot" if "NotFound" in err else "không đọc được ConfigMap")
rc, _, err = k("-n", "shop", "get", "cm", "after-snapshot", "-o", "name")
if rc == 0: bad.append("còn after-snapshot")
elif "NotFound" not in err: bad.append("không đọc được after-snapshot")
rc, out, _ = run("helm", "list", "-n", "shop", "-o", "json", timeout=30)
try: r = next((x for x in json.loads(out) if x.get("name") == "shop"), None)
except Exception: r = None
if r is None or r.get("status") != "deployed": bad.append("release shop " + ("chưa có" if r is None else str(r.get("status"))))
rc, out, _ = k("-n", "shop", "get", "pod", "postgres-0", "-o", "jsonpath={.status.conditions[?(@.type==\"Ready\")].status}")
if out.strip() != "True": bad.append("postgres-0 chưa Ready")
rc, out, _ = run("sudo", "etcdctl", "--endpoints=https://127.0.0.1:2379", f"--cacert={PKI}/ca.crt", f"--cert={PKI}/server.crt",
                 f"--key={PKI}/server.key", "--command-timeout=5s", "endpoint", "status", "-w", "json")
try: st = json.loads(out)[0]["Status"]; cur, ri = st["header"]["revision"], st["raftIndex"]
except Exception: cur = ri = None
def rec(f):
    rc, out, _ = run("sudo", "cat", f"/root/.lab/st8-ops/{f}")
    return int(out.strip()) if rc == 0 and out.strip().isdigit() else None
rrev, rraft = rec("rev"), rec("raft")
if cur is None: bad.append("không đọc được trạng thái etcd")
elif rrev is None or rraft is None: bad.append("chưa có mốc revision của s45")
elif cur < rrev or ri < rraft: bad.append("revision/raft index etcd nhỏ hơn mốc s45: dữ liệu đã lùi")
print("DATA=" + ("; ".join(bad)[:170] or "đạt"))
PY
