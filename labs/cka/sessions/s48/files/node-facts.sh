# s48 — dữ kiện của MỘT node (cka-cp, cka-w1 hay cka-w2; user ubuntu, sudo; python3 + tomllib, PyYAML). Gửi bằng
# `vm <node> "$(cat node-facts.sh)"`, thường qua s48_nodes của files/nodes.sh. Chỉ đọc; mỗi lệnh có timeout. Không gọi
# apiserver (chạy được khi control plane hỏng: check.sh của s49). In dạng KHOÁ=giá-trị:
#   FILES   (chỉ worker) /etc/containerd/config.toml và /var/lib/kubelet/config.yaml giống bản tốt mà sự cố st9-node lưu ở
#           /root/.lab/st9-node/ trên chính node đó: so nội dung đã nạp (TOML, YAML), không so byte, nên thêm comment hay đổi
#           thứ tự khoá vẫn được; tệp không nạp được là "cú pháp lỗi". Lý do không nêu tên trường (đó là đáp án).
#   UNITS   containerd và kubelet `active` (kubelet chạy liền ≥ 15 giây: không phải một lần khởi động sắp thoát của vòng
#           restart) và `enabled`.
#   CGROUP  cgroupDriver trong /var/lib/kubelet/config.yaml của node này (đáp án NODE_DEBUG_CGROUP so với giá trị của cka-w1).
#   FIELD   (cka-w2) trường của config.yaml mà sự cố đã sửa lần begin gần nhất (/root/.lab/st9-node/field), rỗng nếu chưa có.
python3 - <<'PY'
import socket, subprocess, time, tomllib
import yaml
H = "/root/.lab/st9-node"
FILES = (("config.toml", "/etc/containerd/config.toml", tomllib.loads), ("config.yaml", "/var/lib/kubelet/config.yaml", yaml.safe_load))
def run(*args, timeout=15):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.returncode, p.stdout.decode(errors="replace"), p.stderr.decode(errors="replace")
    except Exception as e:
        return 99, "", str(e)
def cat(p):
    rc, out, _ = run("sudo", "-n", "cat", p)
    return out if rc == 0 else None
def say(key, bad): print(f"{key}=" + ("; ".join(bad)[:170] or "đạt"))
worker = socket.gethostname() != "cka-cp"

if worker:
    bad = []
    for name, live, parse in FILES:
        g, l = cat(f"{H}/{name}"), cat(live)
        if not g: bad.append("chưa có bản tốt của sự cố (chạy begin)"); continue
        if l is None: bad.append(f"không đọc được {live}"); continue
        try: lv = parse(l)
        except Exception: bad.append(f"{live} cú pháp lỗi"); continue
        if lv != parse(g): bad.append(f"{live} khác bản tốt")
    say("FILES", bad)

bad = []
for u in ("containerd", "kubelet"):
    a = run("systemctl", "is-active", u)[1].strip()
    e = run("systemctl", "is-enabled", u)[1].strip()
    if a == "active" and u == "kubelet":
        ts = run("systemctl", "show", "-p", "ActiveEnterTimestampMonotonic", "--value", u)[1].strip()
        try:
            up = time.clock_gettime(time.CLOCK_MONOTONIC) - int(ts) / 1e6
            if up < 15: a = "vừa khởi động lại"
        except Exception: pass
    if a != "active": bad.append(f"{u} {a or '?'}")
    if e != "enabled": bad.append(f"{u} {e or '?'}")
say("UNITS", bad)

try: print("CGROUP=" + str((yaml.safe_load(cat("/var/lib/kubelet/config.yaml") or "") or {}).get("cgroupDriver", "")))
except Exception: print("CGROUP=")
print("FIELD=" + (cat(f"{H}/field") or "").strip())
PY
