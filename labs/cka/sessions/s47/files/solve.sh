# s47 — lời giải trên cka-cp (user ubuntu; kubectl, python3 + PyYAML), gọi bởi apply.sh sau khi setup.sh đã gây sự cố st9-net.
# Đi đúng thứ tự của buổi: phép thử một lệnh từ Pod busybox trên từng worker (nslookup tên rồi wget ClusterIP: tách DNS khỏi
# Service, tách node này khỏi node kia), rồi từng tầng: CoreDNS (log, Corefile: đọc zone TRƯỚC khi sửa, sửa đúng dòng
# kubernetes), kube-proxy (Pod theo node, log của Pod cka-w1, so DaemonSet: rollout undo về template trước, trả updateStrategy
# RollingUpdate như kubeadm, xoá ConfigMap thử), NetworkPolicy (policy nào chọn order, egress của nó; áp lại policy order
# từ ~/shop/, xoá allow-monitoring), phép thử lại, answers.env, mục s47 của sổ tay. Chạy lại được.
set -e
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s47: $*"; }
die() { echo "s47: $*" >&2; exit 1; }
mkdir -p ~/drills/s47 ~/notes
GW=$(k -n shop get svc gateway -o jsonpath='{.spec.clusterIP}')
TEST="nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://$GW:8080/api/info"
probe() {
  local n
  for n in cka-w1 cka-w2; do
    k delete pod "s47-$n" --ignore-not-found --wait=true >/dev/null
    k run "s47-$n" --image=busybox:1.37 --restart=Never --overrides="{\"spec\":{\"nodeName\":\"$n\",\"terminationGracePeriodSeconds\":0,\"containers\":[{\"name\":\"t\",\"image\":\"busybox:1.37\",\"command\":[\"sleep\",\"600\"],\"resources\":{\"requests\":{\"cpu\":\"10m\",\"memory\":\"16Mi\"},\"limits\":{\"memory\":\"32Mi\"}}}]}}" >/dev/null
  done
  k wait pod s47-cka-w1 s47-cka-w2 --for=condition=Ready --timeout=60s >/dev/null
  for n in cka-w1 cka-w2; do
    echo "--- từ $n: $TEST"
    k exec "s47-$n" -- sh -c "$TEST" 2>&1 | grep -E 'NXDOMAIN|Address: 10\.|timed out|service|connection' | head -3 || true
  done
}
log "1. phép thử một lệnh từ Pod busybox trên mỗi worker (namespace default)"
probe
log "2. CoreDNS: log, Corefile"
k -n kube-system logs -l k8s-app=kube-dns --tail=3 --prefix | cut -c1-160
zone=$(k -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | awk '$1 == "kubernetes" {print $2; exit}')
log "   zone của plugin kubernetes: $zone"
[ -n "$zone" ] || die "không đọc được dòng kubernetes trong Corefile"
if [ "$zone" != cluster.local ]; then
  k -n kube-system get cm coredns -o yaml | sed "s/kubernetes $zone /kubernetes cluster.local /" | k replace -f -
fi
log "3. kube-proxy: Pod theo node, log của Pod không Ready, DaemonSet"
k -n kube-system get pod -l k8s-app=kube-proxy -o wide | cut -c1-110
p=$(k -n kube-system get pod -l k8s-app=kube-proxy --field-selector spec.nodeName=cka-w1 -o name)
k -n kube-system logs "$p" --tail=1 2>&1 | cut -c1-240 || true
k -n kube-system get ds kube-proxy -o jsonpath='{.spec.updateStrategy.type} {range .spec.template.spec.volumes[*]}{.configMap.name} {end}{"\n"}'
if [ "$(k -n kube-system get ds kube-proxy -o jsonpath='{.spec.template.spec.volumes[?(@.name=="kube-proxy")].configMap.name}')" != kube-proxy ]; then
  k -n kube-system rollout undo ds/kube-proxy
fi
k -n kube-system patch ds kube-proxy --type=merge -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"maxSurge":0,"maxUnavailable":1}}}}'
k -n kube-system rollout status ds/kube-proxy --timeout=180s
k -n kube-system delete cm kube-proxy-next --ignore-not-found
log "4. NetworkPolicy: policy nào chọn order, egress của nó"
k -n shop get netpol
k -n shop get netpol -o jsonpath='{range .items[?(@.spec.podSelector.matchLabels.app=="order")]}{.metadata.name}: egress {.spec.egress[*].to[*].podSelector.matchLabels.app}{"\n"}{end}'
# Áp lại đúng policy order từ manifest của bạn (~/shop/), rồi xoá allow-monitoring: sau khi order trở lại, nó chỉ cộng quyền.
python3 - "$HOME" <<'PY' | k apply -f -
import glob, sys, yaml
docs = [d for p in sorted(glob.glob(f"{sys.argv[1]}/shop/*.yaml")) for d in yaml.safe_load_all(open(p))
        if isinstance(d, dict) and d.get("kind") == "NetworkPolicy" and (d.get("metadata") or {}).get("name") == "order"]
if not docs: sys.exit("s47: ~/shop/ không có NetworkPolicy order")
print(yaml.safe_dump(docs[-1], sort_keys=False))
PY
k -n shop delete netpol allow-monitoring --ignore-not-found
log "5. chờ CoreDNS nạp lại Corefile (mỗi Pod CoreDNS nạp riêng, đo tới ~1 phút), thử lại"
# Từ cả hai worker và từ mọi Pod order, tối đa 3 phút. Hỏi qua Service kube-dns thì mỗi truy vấn rơi vào một Pod CoreDNS bất
# kỳ: một lần đúng không chứng minh Pod kia đã nạp (đo trong selftest đợt 5: hai Pod nạp cách nhau 34 giây, verify rơi vào
# giữa). Vì vậy hỏi thêm thẳng từng Pod CoreDNS.
ok_all() {
  local n o ip ips
  ips=$(k -n kube-system get pod -l k8s-app=kube-dns -o jsonpath='{range .items[*]}{.status.podIP} {end}' 2>/dev/null) || return 1
  [ -n "$ips" ] || return 1
  for n in cka-w1 cka-w2; do
    k exec "s47-$n" -- nslookup catalog.shop.svc.cluster.local >/dev/null 2>&1 || return 1
    for ip in $ips; do k exec "s47-$n" -- nslookup catalog.shop.svc.cluster.local "$ip" >/dev/null 2>&1 || return 1; done
  done
  for o in $(k -n shop get pod -l app=order -o name); do
    k -n shop exec "$o" -c order -- bash -c "timeout 4 bash -c '</dev/tcp/catalog/8080'" >/dev/null 2>&1 || return 1
  done
}
end=$(($(date +%s) + 180))
until ok_all; do [ "$(date +%s)" -lt "$end" ] || die "sau 3 phút vẫn chưa phân giải được từ cả hai worker hay order chưa nối được catalog"; sleep 5; done
probe
echo "mọi Pod order nối được catalog:8080"
k delete pod s47-cka-w1 s47-cka-w2 --wait=false >/dev/null
log "6. answers.env và mục s47 của sổ tay"
printf 'DNS_ZONE_FOUND=%s\nPROXY_NODE=cka-w1\nBLOCKING_POLICY=allow-monitoring\nONE_TEST="%s"\n' "$zone" "$TEST" > ~/drills/s47/answers.env
cat ~/drills/s47/answers.env
grep -qi '^#.*s47' ~/notes/runbook.md 2>/dev/null || cat >> ~/notes/runbook.md <<'EOF'

## s47 — DNS, kube-proxy, NetworkPolicy
- Triệu chứng: đặt hàng 503, từ cka-w1 ClusterIP treo, mọi Pod NXDOMAIN với tên *.svc.cluster.local.
- Phép thử một lệnh trên từng worker: `nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://<ClusterIP>:8080/api/info`.
- Nguyên nhân 1: Corefile đổi zone của plugin kubernetes; sửa ConfigMap coredns (reload tự nạp, không cần restart).
- Nguyên nhân 2: kube-proxy cka-w1 CrashLoopBackOff (DaemonSet OnDelete + ConfigMap thử); rollout undo, RollingUpdate.
- Nguyên nhân 3: policy order bị thay bằng allow-monitoring thiếu egress tới catalog; áp lại policy từ ~/shop/.
EOF
