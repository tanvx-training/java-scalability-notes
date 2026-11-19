# s40 — phần lời giải chạy trên cka-cp bằng user ubuntu, sau khi apply.sh đã gây sự cố st7-helm. Đi đúng quy trình chẩn đoán
# của buổi rồi sửa: rollback shop (kèm --force-conflicts: release nhận lại từ kubectl apply, s37) và demo về revision tốt gần
# nhất (tìm theo trạng thái trong history, không ghi cứng số), uninstall demo-canary, helm repo update, ghi BAD_VALUE. Chạy
# lại được: release nào đã deployed sau revision hỏng thì bỏ qua.
set -e
k() { kubectl --request-timeout=10s "$@"; }
mkdir -p ~/drills/s40
# rev <release> <ns> <status-hỏng> <python-expr trên values v>: "<revision hỏng mới nhất> <revision tốt> <revision hiện tại>
# <status hiện tại>". Revision tốt: deployed/superseded mới nhất mà values -a mang cấu hình cuối s37 (đọc từng revision,
# theo nội dung, không theo vị trí).
rev() {
  helm history "$1" -n "$2" --max 100 -o json | python3 -c '
import json, subprocess, sys
rel, ns, broken, good = sys.argv[1:5]
h = sorted(json.load(sys.stdin), key=lambda x: x["revision"])
b = [x["revision"] for x in h if x["status"] == broken]
b = b[-1] if b else 0
g = 0
for x in reversed(h):
    if x["status"] not in ("deployed", "superseded"): continue
    p = subprocess.run(["helm", "get", "values", rel, "-n", ns, "-a", "--revision", str(x["revision"]), "-o", "json"], capture_output=True)
    v = (json.loads(p.stdout or b"{}") or {}) if p.returncode == 0 else {}
    if eval(good): g = x["revision"]; break
print(b, g, h[-1]["revision"], h[-1]["status"])' "$1" "$2" "$3" "$4"
}
SHOP_GOOD='str(v.get("javaOpts")) == "-XX:MaxRAMPercentage=50"'
DEMO_GOOD='str((v.get("image") or {}).get("tag")) in ("6.16.0", "", "None")'

echo "== 1. Nhìn toàn cảnh"
helm list -A
echo "-- --failed"; helm list -A --failed
echo "-- --pending"; helm list -A --pending

echo "== 2. shop: status, history, values của revision lỗi so với revision tốt, log Pod mới"
helm status shop -n shop | sed -n '1,7p'
helm history shop -n shop --max 4
set -- $(rev shop shop failed "$SHOP_GOOD"); B=$1 G=$2 C=$3 CS=$4
echo "revision lỗi: $B, revision tốt: $G, hiện tại: $C ($CS)"
echo "-- helm get values --revision $B"; helm get values shop -n shop --revision "$B"
echo "-- helm get values --revision $G"; helm get values shop -n shop --revision "$G"
k -n shop get pod -l 'app in (gateway,gateway-v1,catalog,order)'
p=$(k -n shop get pod -l app=gateway --sort-by=.metadata.creationTimestamp -o name | tail -1)
echo "-- k logs $p --previous"; k -n shop logs "$p" --previous --tail=4 2>/dev/null || k -n shop logs "$p" --tail=4 || true
k get events -n shop --sort-by=.lastTimestamp 2>/dev/null | grep -E 'BackOff|Unhealthy' | tail -2 || true
k -n shop rollout history deploy/gateway | tail -3

echo "== 3. rollback shop về revision $G"
if [ "$CS" = deployed ] && [ "$C" -gt "$B" ]; then
  echo "shop đã deployed ở revision $C (sau revision lỗi $B): bỏ qua"
else
  helm rollback shop "$G" -n shop --force-conflicts --wait --timeout 5m
fi
helm history shop -n shop --max 3
k -n shop get deploy gateway gateway-v1 catalog order

echo "== 4. demo kẹt pending-upgrade: rollback (đo: Helm 4 cho rollback release pending-upgrade; upgrade thì bị từ chối)"
helm history demo -n demo --max 3
set -- $(rev demo demo pending-upgrade "$DEMO_GOOD"); B=$1 G=$2 C=$3 CS=$4
if [ "$CS" = deployed ] && [ "$C" -gt "$B" ]; then
  echo "demo đã deployed ở revision $C: bỏ qua"
else
  helm rollback demo "$G" -n demo --wait --timeout 5m
fi
helm history demo -n demo --max 3
k -n demo get deploy,pod

echo "== 5. demo-canary kẹt pending-install: không có revision để rollback, gỡ hẳn"
if helm status demo-canary -n demo >/dev/null 2>&1; then
  helm rollback demo-canary -n demo 2>&1 | tail -1 || true
  helm uninstall demo-canary -n demo
fi
helm list -n demo

echo "== 6. repo podinfo"
helm search repo podinfo/podinfo --version 6.16.0 2>&1 | tail -2 || true
helm repo update podinfo
helm search repo podinfo/podinfo --version 6.16.0

echo "BAD_VALUE=javaOpts" > ~/drills/s40/answers.env
cat ~/drills/s40/answers.env
