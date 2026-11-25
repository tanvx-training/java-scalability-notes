# m2 — câu q1 (kube-scheduler trên cka-cp). Chạy trên cka-cp (user ubuntu, sudo không hỏi mật khẩu; python3 + PyYAML, crictl,
# kubectl). Bên gửi đặt STEP:
#   STEP=restore  (setup.sh của m2 và của m1, TRƯỚC khi kiểm lõi khoẻ) đưa kube-scheduler về bản tốt nếu lần làm trước của m2
#                 còn để lại: manifest khác bản tốt /root/.lab/m2/kube-scheduler.yaml (so YAML đã nạp, không so byte) thì cài
#                 lại bản tốt, chờ apiserver (tối đa 300 giây: VM vừa bật) rồi scheduler chạy, Pod mirror Ready và giữ lease
#                 kube-system/kube-scheduler (tối đa 120 giây); xoá namespace
#                 `kube-sytem` nếu lần trước lách bằng cách tạo nó. Chưa từng gây (không có bản tốt) thì không làm gì. Không in
#                 gì khi thành công.
#   STEP=break    (setup.sh của m2, sau khi mọi Pod của đề đã được xếp lịch) lưu bản tốt nếu chưa có — chỉ khi manifest hiện
#                 tại không có cờ --leader-elect-resource-namespace và scheduler đang giữ lease — rồi thêm cờ
#                 `--leader-elect-resource-namespace=kube-sytem` (namespace gõ sai, không tồn tại) ngay sau --leader-elect=true.
#                 kubelet tạo lại Pod tĩnh: container mới chạy, Pod Running/Ready (healthz không phụ thuộc lease), nhưng không
#                 bao giờ giành được lease nên không xếp lịch Pod nào; Pod đang chạy không bị đụng tới (không evict, không
#                 preempt). Khác s49 (st9-cp: --kubeconfig trỏ tệp không có, container chết): ở đây scheduler "khoẻ" mà không
#                 làm việc, chỉ log nói lý do. Chờ tới khi container scheduler đang chạy mang cờ mới (tối đa 120 giây).
# Lỗi ở restore/break thì một dòng `lab: …` ra stderr và trả 1.
H=/root/.lab/m2
MAN=/etc/kubernetes/manifests/kube-scheduler.yaml
BAD=--leader-elect-resource-namespace=kube-sytem
S() { sudo -n timeout 30 "$@"; }
k() { kubectl --request-timeout=8s "$@"; }
# same <a> <b>: hai manifest giống nhau khi nạp YAML (thứ tự khoá, dòng trống, comment không tính).
same() {
  S python3 - "$1" "$2" <<'PY'
import sys, yaml
try:
    a, b = (yaml.safe_load(open(p)) for p in sys.argv[1:3])
except Exception:
    sys.exit(1)
sys.exit(0 if a == b else 1)
PY
}
# running_has <chuỗi>: container kube-scheduler đang chạy (crictl) có (yes) / không có (no) cờ đó trong lệnh.
running_args() {
  local id; id=$(S crictl ps -q --name '^kube-scheduler$' --state running 2>/dev/null | head -n1)
  [ -n "$id" ] || return 1
  S crictl inspect "$id" 2>/dev/null | python3 -c 'import json,sys; c=json.load(sys.stdin)["info"]["config"]; print(" ".join((c.get("command") or []) + (c.get("args") or [])))'
}
lease_fresh() {
  k -n kube-system get lease kube-scheduler -o json 2>/dev/null | python3 -c '
import json, sys, datetime
s = json.load(sys.stdin).get("spec") or {}
t = s.get("renewTime") or ""
try: age = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(t.replace("Z", "+00:00"))).total_seconds()
except Exception: sys.exit(1)
sys.exit(0 if (s.get("holderIdentity") or "").startswith("cka-cp") and age < 30 else 1)'
}
readyz() { [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ]; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }
mirror_ready() { [ "$(k -n kube-system get pod kube-scheduler-cka-cp -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)" = True ]; }
good_running() { a=$(running_args) && case "$a" in *--leader-elect-resource-namespace=kube-sytem*) return 1 ;; esac && lease_fresh && mirror_ready; }
bad_running() { a=$(running_args) && case "$a" in *"$BAD"*) return 0 ;; esac; return 1; }
case "$STEP" in
  restore)
    S test -f $H/kube-scheduler.yaml || exit 0
    if ! same $H/kube-scheduler.yaml $MAN; then
      S install -m 600 $H/kube-scheduler.yaml $MAN
      # VM vừa bật: apiserver có thể chưa phục vụ (lease đọc qua apiserver) — chờ /readyz trước, tối đa 300 giây.
      until_t 300 readyz || { echo "lab: apiserver chưa sẵn sàng sau 300 giây" >&2; exit 1; }
      until_t 120 good_running || { echo "lab: kube-scheduler chưa chạy lại với bản tốt sau 120 giây" >&2; exit 1; }
    fi
    until_t 300 readyz || { echo "lab: apiserver chưa sẵn sàng sau 300 giây" >&2; exit 1; }
    if k get ns kube-sytem >/dev/null 2>&1; then k delete ns kube-sytem --wait=false >/dev/null 2>&1 || true; fi
    ;;
  break)
    S install -d -m 700 $H
    if ! S test -f $H/kube-scheduler.yaml; then
      S grep -q -- '--leader-elect-resource-namespace' $MAN && { echo "lab: kube-scheduler.yaml đã có --leader-elect-resource-namespace, không lưu bản tốt" >&2; exit 1; }
      until_t 60 good_running || { echo "lab: kube-scheduler không ở trạng thái tốt (không giữ lease), không lưu bản tốt" >&2; exit 1; }
      S cp -p $MAN $H/kube-scheduler.yaml
    fi
    S python3 - $MAN "$BAD" <<'PY' || { echo "lab: không gây được lỗi của câu q1" >&2; exit 1; }
import re, sys
p, bad = sys.argv[1:3]
txt = open(p).read()
if bad in txt: sys.exit(0)
m = re.search(r"^(\s*)- --leader-elect=true\s*$", txt, re.M)
if not m: sys.exit(1)
txt = txt[: m.end()] + "\n" + m.group(1) + "- " + bad + txt[m.end():]
open(p, "w").write(txt)
PY
    until_t 120 bad_running || { echo "lab: kube-scheduler chưa chạy với cấu hình của câu q1 sau 120 giây" >&2; exit 1; }
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 1 ;;
esac
