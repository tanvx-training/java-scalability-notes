# s41 — phần lời giải chạy trên cka-cp bằng user ubuntu (apply.sh gửi nội dung tệp này qua `vm`, sau khi đã đặt các tệp chart
# đổi ở /tmp/s41-chart.tgz và loop.sh ở ~/drills/s41). Chạy lại được: chart đã như vậy thì upgrade chỉ thêm một revision; mỗi
# lần chạy là một vòng drain/uncordon cka-w1 mới với log mới.
set -e
k() { kubectl --request-timeout=10s "$@"; }
log=~/drills/s41/loop.log
loop=~/drills/s41/loop.sh

echo "== chart 0.2.0: order 2 replica, spread, PDB (chép các tệp đổi đè lên ~/charts/shop)"
rm -rf /tmp/s41-chart && mkdir -p /tmp/s41-chart && tar xzf /tmp/s41-chart.tgz -C /tmp/s41-chart 2>/dev/null
cp -R /tmp/s41-chart/chart/. ~/charts/shop/
rm -rf /tmp/s41-chart
grep -E '^(version|appVersion)' ~/charts/shop/Chart.yaml
helm lint ~/charts/shop >/dev/null
# Lần chạy trước bị ngắt giữa drain thì cka-w1 còn cordon: Pod Pending làm `--wait` hết giờ.
k uncordon cka-w1 >/dev/null

echo "== postgres-0 cùng PriorityClass với gateway (~/shop/postgres.yaml), để Pod thay của gateway không preempt nó lúc drain"
python3 - <<'PY'
import glob, os, re
home = os.path.expanduser("~")
for p in sorted(glob.glob(f"{home}/shop/*.yaml")):
    text = open(p).read()
    docs = re.split(r"(?m)^---\s*$", text)
    for i, d in enumerate(docs):
        if not re.search(r"(?m)^kind:\s*StatefulSet\s*$", d) or not re.search(r"(?m)^  name:\s*postgres\s*$", d): continue
        if "priorityClassName:" in d: print(f"{os.path.basename(p)}: đã có priorityClassName"); raise SystemExit
        # chèn ngay trên dòng nodeSelector của pod template (cùng thụt lề), giữ nguyên comment của tệp
        m = re.search(r"(?m)^(\s+)nodeSelector:", d)
        if not m: raise SystemExit(f"{p}: không thấy nodeSelector của postgres")
        docs[i] = d[:m.start()] + f"{m.group(1)}priorityClassName: shop-critical\n" + d[m.start():]
        open(p, "w").write("---".join(docs)); print(f"{os.path.basename(p)}: thêm priorityClassName: shop-critical"); raise SystemExit
raise SystemExit("không tìm thấy StatefulSet postgres trong ~/shop/*.yaml")
PY
k apply -f ~/shop/postgres.yaml
k -n shop rollout status sts/postgres --timeout=5m
end=$(($(date +%s) + 300)); w1=$(k get node cka-w1 -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}')
until [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://$w1:30180/api/products")" = 200 ] || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
# Lấy output trước rồi mới cắt: `helm upgrade … | sed` (không pipefail) bỏ qua mã lỗi khi upgrade hết giờ.
out=$(helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait --timeout 5m 2>&1) || { printf '%s\n' "$out" >&2; echo "s41: helm upgrade shop lỗi; dừng trước vòng request và drain" >&2; exit 1; }
printf '%s\n' "$out" | sed -n '1,6p'
k -n shop get pdb

# rebalance: Pod của một service dồn hết lên một worker thì rollout restart (matchLabelKeys pod-template-hash trải lại).
rebalance() {
  local n nodes
  for n in gateway catalog order; do
    nodes=$(k -n shop get pod -l app=$n --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort -u | tr '\n' ' ')
    case "$nodes" in *cka-w1*cka-w2*) ;; *) echo "$n chỉ ở: $nodes→ rollout restart"; k -n shop rollout restart deploy/$n
      k -n shop rollout status deploy/$n --timeout=5m ;; esac
  done
}
rebalance

echo "== vòng request, drain cka-w1, uncordon"
"$loop" stop "$log" >/dev/null || true
"$loop" start "$log"
sleep 10
k cordon cka-w1
k drain cka-w1 --ignore-daemonsets --delete-emptydir-data --timeout=5m
k get pod -n shop -o wide --field-selector=spec.nodeName=cka-w1
sleep 10
k uncordon cka-w1
end=$(($(date +%s) + 300))
until [ "$(k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{"\n"}{end}' | awk '$1!=$2' | grep -c .)" = 0 ] \
  || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
rebalance
sleep 6
"$loop" stop "$log"
grep '^#' "$log" | sed -n '1,40p'
k -n shop get pod -l 'app in (gateway,catalog,order)' -o wide
