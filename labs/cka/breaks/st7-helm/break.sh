# Phần chạy trên cka-cp của lỗi st7-helm (run.sh gửi nội dung tệp này qua `vm`). Không in gì khi thành công: đây là đề bài.
# "Một đồng nghiệp" làm ba việc rồi bỏ dở:
# 1. demo: `helm upgrade --reuse-values --set image.tag=6.99.0 --wait` (tag không có trên ghcr.io) rồi tiến trình helm bị
#    kill -9 giữa chừng: release kẹt `pending-upgrade`, Deployment đã mang image xấu.
# 2. demo-canary: `helm install` bản thử cùng image xấu vào namespace demo, cũng bị kill: kẹt `pending-install`.
# 3. shop: `helm upgrade --reuse-values` với values `javaOpts: -XX:MaxRAMPercentage=150` (JVM từ chối khởi động),
#    `--force-conflicts --wait --timeout 60s`: release `failed`. RollingUpdate của gateway (maxUnavailable 0) và của catalog,
#    order, gateway-v1 (25% làm tròn xuống 0) giữ Pod cũ: shop vẫn phục vụ (đo: gateway 2/2 Ready, 30180 trả 200 suốt lần
#    upgrade lỗi).
# Cuối cùng xoá index của repo podinfo trong cache của helm (cần `helm repo update`).
# Chạy lại được: release nào chưa ở cấu hình cuối s37 (kẹt, failed, hay roll forward bằng giá trị khác) thì rollback về
# revision có cấu hình đó (tìm theo values, không theo vị trí), uninstall bản canary, rồi gây lại đúng ba lỗi đó. Bước nào
# không có hiệu lực thì báo lỗi trung tính (chỉ số bước) và dừng. Thiếu trạng thái cuối s39 (helm, release shop/demo, ~/charts/shop) thì dừng, không gây gì.
set -e
k() { kubectl --request-timeout=10s "$@"; }
for i in $(seq 1 90); do k get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
miss=""
command -v helm >/dev/null 2>&1 || miss="$miss helm"
helm status shop -n shop >/dev/null 2>&1 || miss="$miss release-shop"
helm status demo -n demo >/dev/null 2>&1 || miss="$miss release-demo"
[ -f ~/charts/shop/Chart.yaml ] || miss="$miss ~/charts/shop"
helm repo list 2>/dev/null | grep -q '^podinfo' || miss="$miss repo-podinfo"
if [ -n "$miss" ]; then
  echo "lab: thiếu$miss (trạng thái cuối s39); thử: ./labs/lab restore cka s39" >&2; exit 1
fi
# Repo podinfo phải đọc được để gây lỗi (lần chạy trước đã xoá index): cập nhật lặng lẽ.
helm repo update podinfo >/dev/null 2>&1 || { echo "lab: helm repo update podinfo lỗi (cka-cp không ra được mạng? https://stefanprodan.github.io/podinfo); thử lại khi có mạng" >&2; exit 1; }
# fail <bước>: một bước không có hiệu lực. Không nói bước đó làm gì (đây là đề bài sự cố).
fail() { echo "lab: không gây được sự cố st7-helm (bước $1/3); chạy lại ./labs/lab begin cka s40, vẫn lỗi thì ./labs/lab restore cka s39" >&2; exit 1; }

# status <release> <ns>: "<revision> <status>"
status() { helm status "$1" -n "$2" -o json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["version"], d["info"]["status"])' 2>/dev/null || true; }
# good_rev <release> <ns> <python-expr trên values v>: revision mới nhất đã deployed/superseded mà values (-a) thoả biểu
# thức (cấu hình như cuối s37). Tìm theo nội dung, không theo vị trí trong history.
good_rev() {
  helm history "$1" -n "$2" --max 30 -o json 2>/dev/null | python3 -c '
import json, subprocess, sys
rel, ns, bad = sys.argv[1], sys.argv[2], sys.argv[3]
for h in sorted(json.load(sys.stdin), key=lambda h: -h["revision"]):
    if h["status"] not in ("deployed", "superseded"): continue
    p = subprocess.run(["helm", "get", "values", rel, "-n", ns, "-a", "--revision", str(h["revision"]), "-o", "json"], capture_output=True)
    if p.returncode: continue
    v = json.loads(p.stdout or b"{}") or {}
    if eval(bad): print(h["revision"]); break' "$1" "$2" "$3"
}
# Cấu hình của cuối s37 mà sự cố đụng tới: javaOpts của shop (values.yaml của chart), image.tag của demo (mặc định của
# podinfo 6.16.0: không ghi đè).
SHOP_GOOD='str(v.get("javaOpts")) == "-XX:MaxRAMPercentage=50"'
DEMO_GOOD='str((v.get("image") or {}).get("tag")) in ("6.16.0", "", "None")'
# at_s37 <release> <ns> <expr> [<deploy>]: revision mới nhất deployed, values -a của nó thoả biểu thức, và (nếu có) Deployment
# trong cluster mang image :6.16.0 (bắt trường hợp xoá Secret release mà cluster còn manifest xấu).
at_s37() {
  case "$(status "$1" "$2")" in *" deployed") ;; *) return 1 ;; esac
  helm get values "$1" -n "$2" -a -o json 2>/dev/null | python3 -c 'import json,sys; v=json.load(sys.stdin) or {}; sys.exit(0 if eval(sys.argv[1]) else 1)' "$3" || return 1
  [ -z "${4:-}" ] && return 0
  case "$(k -n "$2" get deploy "$4" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)" in *:6.16.0) return 0 ;; esac
  return 1
}
# back_to_s37 <release> <ns> <expr> <deploy|""> <cờ helm thêm…>: chưa ở cấu hình cuối s37 thì rollback về revision có cấu
# hình đó (theo nội dung); không tìm được thì dừng.
back_to_s37() {
  local rel="$1" ns="$2" expr="$3" dep="$4" r; shift 4
  at_s37 "$rel" "$ns" "$expr" "$dep" && return 0
  r="$(good_rev "$rel" "$ns" "$expr")"
  [ -n "$r" ] || { echo "lab: history của release $rel không còn revision nào có cấu hình như cuối s37; thử: ./labs/lab restore cka s40" >&2; exit 1; }
  helm rollback "$rel" "$r" -n "$ns" "$@" --wait --timeout 5m >/dev/null 2>&1 || true
  at_s37 "$rel" "$ns" "$expr" "$dep" || { echo "lab: không đưa được release $rel về cấu hình cuối s37 (rollback về revision $r); thử: ./labs/lab restore cka s40" >&2; exit 1; }
}
# kill_when <release> <ns> <pending-status> <deploy> <pid>: đợi release vào trạng thái pending và Deployment mang image
# xấu, chờ thêm 3 giây (Pod mới đã tạo), rồi kill -9 tiến trình helm. Tối đa 60 giây.
kill_when() {
  local i s img
  for i in $(seq 1 120); do
    s="$(status "$1" "$2")"
    img="$(k -n "$2" get deploy "$4" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)"
    case "$s:$img" in *" $3:"*:6.99.0) break ;; esac
    sleep 0.5
  done
  sleep 3
  kill -9 "$5" 2>/dev/null || true
  wait "$5" 2>/dev/null || true
}

# 0. Luôn bắt đầu từ cấu hình cuối s37 (begin chạy lại giữa buổi): release nào chưa deployed với đúng cấu hình đó (đang
# kẹt, failed, hay đã roll forward bằng giá trị khác) thì rollback về revision có cấu hình đó, tìm theo nội dung; gỡ canary.
back_to_s37 demo demo "$DEMO_GOOD" demo-podinfo
helm status demo-canary -n demo >/dev/null 2>&1 && helm uninstall demo-canary -n demo >/dev/null 2>&1 || true
back_to_s37 shop shop "$SHOP_GOOD" "" --force-conflicts

# 1. demo kẹt pending-upgrade.
log=$(mktemp)
nohup helm upgrade demo podinfo/podinfo --version 6.16.0 -n demo --reuse-values --set image.tag=6.99.0 --wait --timeout 5m >"$log" 2>&1 &
kill_when demo demo pending-upgrade demo-podinfo $!
case "$(status demo demo)" in *" pending-upgrade") ;; *) fail 1 ;; esac

# 2. demo-canary kẹt pending-install (cùng values của demo, image xấu).
cat > "$log.values" <<'EOF'
nodeSelector:
  node-role.kubernetes.io/control-plane: ""
tolerations:
- key: node-role.kubernetes.io/control-plane
  operator: Exists
  effect: NoSchedule
resources:
  requests:
    cpu: 10m
    memory: 32Mi
  limits:
    memory: 64Mi
image:
  tag: 6.99.0
EOF
nohup helm install demo-canary podinfo/podinfo --version 6.16.0 -n demo -f "$log.values" --wait --timeout 5m >"$log" 2>&1 &
kill_when demo-canary demo pending-install demo-canary-podinfo $!
case "$(status demo-canary demo)" in *" pending-install") ;; *) fail 2 ;; esac

# 3. shop failed sau upgrade --wait với javaOpts xấu (Pod mới không khởi động được, Pod cũ ở lại).
printf 'javaOpts: -XX:MaxRAMPercentage=150\n' > "$log.values"
helm upgrade shop ~/charts/shop -n shop --reuse-values -f "$log.values" --force-conflicts --wait --timeout 60s >"$log" 2>&1 || true
rm -f "$log" "$log.values"
case "$(status shop shop)" in *" failed") ;; *) fail 3 ;; esac

# 4. Cache của repo podinfo mất index.
rm -f ~/.cache/helm/repository/podinfo-index.yaml ~/.cache/helm/repository/podinfo-charts.txt
