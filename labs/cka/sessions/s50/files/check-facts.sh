# s50 — dữ kiện của check.sh trên cka-cp (user ubuntu, sudo; python3 + PyYAML): phần của cuối s49 mà sự cố st9-etcd không đụng
# và đọc được khi apiserver không chạy. In dạng KHOÁ=giá-trị. Chỉ đọc tệp.
#   CPFILES  kube-scheduler.yaml, kube-controller-manager.yaml trong /etc/kubernetes/manifests/ giống bản tốt của sự cố st9-cp
#            (/root/.lab/st9-cp/) theo nội dung YAML đã nạp (như verify s49). Không xét kube-apiserver.yaml (sự cố này sửa nó)
#            và tệp thừa trong manifests/ (`begin` dời chúng đi).
python3 - <<'PY'
import subprocess, yaml
def cat(p):
    try:
        r = subprocess.run(["sudo", "-n", "cat", p], capture_output=True, timeout=10)
        return r.stdout.decode(errors="replace") if r.returncode == 0 else None
    except Exception: return None
bad = []
for c in ("kube-scheduler", "kube-controller-manager"):
    g, l = cat(f"/root/.lab/st9-cp/{c}.yaml"), cat(f"/etc/kubernetes/manifests/{c}.yaml")
    if not g: bad.append("chưa có bản tốt của sự cố st9-cp (s49)"); break
    if l is None: bad.append(f"thiếu {c}.yaml"); continue
    try: same = yaml.safe_load(l) == yaml.safe_load(g)
    except Exception: same = False
    if not same: bad.append(f"{c}.yaml khác bản tốt")
print("CPFILES=" + ("; ".join(bad)[:170] or "đạt"))
PY
