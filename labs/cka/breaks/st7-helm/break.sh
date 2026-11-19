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
# Chạy lại được: release đang kẹt `pending-*` thì gỡ trước (rollback về revision tốt gần nhất, uninstall bản canary), rồi gây
# lại đúng ba lỗi đó. Thiếu trạng thái cuối s39 (helm, release shop/demo, ~/charts/shop) thì dừng, không gây gì.
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
helm repo update podinfo >/dev/null 2>&1

# status <release> <ns>: "<revision> <status>"
status() { helm status "$1" -n "$2" -o json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["version"], d["info"]["status"])' 2>/dev/null || true; }
# good_rev <release> <ns> <python-expr trên values v>: revision mới nhất đã deployed/superseded mà values (-a) không xấu.
good_rev() {
  helm history "$1" -n "$2" --max 30 -o json 2>/dev/null | python3 -c '
import json, subprocess, sys
rel, ns, bad = sys.argv[1], sys.argv[2], sys.argv[3]
for h in sorted(json.load(sys.stdin), key=lambda h: -h["revision"]):
    if h["status"] not in ("deployed", "superseded"): continue
    p = subprocess.run(["helm", "get", "values", rel, "-n", ns, "-a", "--revision", str(h["revision"]), "-o", "json"], capture_output=True)
    if p.returncode: continue
    v = json.loads(p.stdout or b"{}") or {}
    if not eval(bad): print(h["revision"]); break' "$1" "$2" "$3"
}
DEMO_BAD='str((v.get("image") or {}).get("tag")) == "6.99.0"'
SHOP_BAD='str(v.get("javaOpts")) == "-XX:MaxRAMPercentage=150"'
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

# 0. Lần chạy trước còn kẹt: gỡ lặng lẽ.
case "$(status demo demo)" in
  *pending-*|*failed) r="$(good_rev demo demo "$DEMO_BAD")"; [ -n "$r" ] && helm rollback demo "$r" -n demo --wait --timeout 3m >/dev/null 2>&1 || true ;;
esac
helm status demo-canary -n demo >/dev/null 2>&1 && helm uninstall demo-canary -n demo >/dev/null 2>&1 || true
case "$(status shop shop)" in
  *pending-*) r="$(good_rev shop shop "$SHOP_BAD")"; [ -n "$r" ] && helm rollback shop "$r" -n shop --force-conflicts --wait --timeout 5m >/dev/null 2>&1 || true ;;
esac

# 1. demo kẹt pending-upgrade.
log=$(mktemp)
nohup helm upgrade demo podinfo/podinfo --version 6.16.0 -n demo --reuse-values --set image.tag=6.99.0 --wait --timeout 5m >"$log" 2>&1 &
kill_when demo demo pending-upgrade demo-podinfo $!

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

# 3. shop failed sau upgrade --wait với javaOpts xấu (Pod mới không khởi động được, Pod cũ ở lại).
printf 'javaOpts: -XX:MaxRAMPercentage=150\n' > "$log.values"
helm upgrade shop ~/charts/shop -n shop --reuse-values -f "$log.values" --force-conflicts --wait --timeout 60s >"$log" 2>&1 || true
rm -f "$log" "$log.values"
case "$(status shop shop)" in
  *" failed") ;;
  *) echo "lab: không gây được lỗi cho release shop (trạng thái: $(status shop shop))" >&2; exit 1 ;;
esac

# 4. Cache của repo podinfo mất index.
rm -f ~/.cache/helm/repository/podinfo-index.yaml ~/.cache/helm/repository/podinfo-charts.txt
