# s36 — phần riêng của s36 (các dòng của s35 do s35/files/facts.sh đọc, kubeconfig dev do s34/files/facts.sh): đáp án
# FORBIDDEN_MISSING trong ~/drills/s36/answers.env. In dạng KHOÁ=giá-trị. Chạy trên control plane bằng user ubuntu. Chỉ đọc.
python3 - "$HOME" <<'PY'
import re, sys
ans = {}
try:
    for line in open(f"{sys.argv[1]}/drills/s36/answers.env"):
        if "=" in line:
            k, v = line.split("=", 1); ans[k.strip()] = v.strip().strip('"').strip("'")
except Exception: pass
# Thông báo cho sẵn (forbidden.txt): User "dev" cannot patch resource "deployments/scale" in API group "apps". Dạng
# <verb>,<resource>,<group>; so khoan dung: hoa thường, dấu cách quanh dấu phẩy, deployments.apps/scale như deployments/scale.
raw = ans.get("FORBIDDEN_MISSING", "")
parts = [x.strip().lower() for x in re.split(r"\s*,\s*", raw.strip())]
ok = len(parts) == 3 and parts[0] == "patch" and parts[1] in ("deployments/scale", "deployments.apps/scale") and parts[2] in ("apps", "apps/v1")
print("ANS=" + ("đạt" if ok else f"FORBIDDEN_MISSING='{raw[:40]}'"))
PY
