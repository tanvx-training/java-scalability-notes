# s51 — lời giải trên cka-cp (user ubuntu; kubectl, curl), gọi bởi apply.sh sau khi setup.sh đã gây sự cố st9-multi. Theo
# thứ tự phòng thi: câu nhanh trước (Q2 Metrics API thô, Q3 reason của Event, Q4 log container phụ, Q1 top khi metrics của Pod
# mới đã có), rồi hai sự cố: (a) report — Endpoints trỏ cổng 8081 trong khi container nghe 8080 (sửa targetPort), rồi 502 `bad
# address` vì default-deny chặn DNS (thêm policy egress DNS cho s51-batch, giữ default-deny); (b) indexer — FailedScheduling:
# nodeSelector sai khoá (disk → disktype), rồi taint lạ trên cka-w2 (gỡ). Cuối cùng: shop còn trải hai worker (rollout restart
# nếu mất), mục s51 của sổ tay, xoá Pod ngốn CPU (dọn trước mock). Chạy lại được.
set -e
NS=s51-batch
A=/opt/answers
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s51: $*"; }
die() { echo "s51: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }

log "Q2 NodeMetrics thô của cka-w1"
k get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w1 > $A/node-metrics.json
python3 -c 'import json,sys; m=json.load(open(sys.argv[1])); print("   ", m["kind"], m["metadata"]["name"], m["usage"])' $A/node-metrics.json

log "Q3 reason của Event cảnh báo mới nhất của indexer"
p=$(k -n $NS get pod -l app=indexer -o jsonpath='{.items[0].metadata.name}')
k -n $NS get events --field-selector "involvedObject.name=$p,type=Warning" --sort-by=.lastTimestamp | tail -n2 | cut -c1-160
k -n $NS get events --field-selector "involvedObject.name=$p,type=Warning" --sort-by=.lastTimestamp -o jsonpath='{.items[-1:].reason}' > $A/events.txt
echo "    events.txt: $(cat $A/events.txt)"

log "Q4 log của container phụ"
k -n $NS get pod ingest -o jsonpath='{.spec.containers[*].name}{"\n"}'
k -n $NS logs ingest -c shipper > $A/sidecar.log
cat $A/sidecar.log

log "Q1 Pod ngốn CPU nhất toàn cluster (chờ metrics của Pod mới, tối đa 3 phút)"
# Metrics API còn giữ Pod vừa bị xoá thêm một lúc (đo: begin lại ngay sau lần trước, dòng đầu là cruncher cũ đã mất): chỉ nhận
# khi Pod đứng đầu còn tồn tại.
topline() {
  t=$(k top pod -A --sort-by=cpu --no-headers 2>/dev/null | head -n1) || return 1
  case "$t" in "$NS "*) ;; *) return 1 ;; esac
  k -n "$NS" get pod "$(printf '%s\n' "$t" | awk '{print $2}')" -o name >/dev/null 2>&1
}
until_t 180 topline || die "chưa thấy Pod của $NS đứng đầu top sau 3 phút: $t"
k top pod -A --sort-by=cpu | head -n4
printf '%s\n' "$t" | awk '{print $1 "/" $2}' > $A/top-cpu.txt
echo "    top-cpu.txt: $(cat $A/top-cpu.txt)"
k top pod -n $NS --containers | head -n6

log "Q5 (a) report-svc"
cip=$(k -n $NS get svc report-svc -o jsonpath='{.spec.clusterIP}')
echo "    curl: $(curl -s -m 10 -o /dev/null -w '%{http_code}' http://$cip:8080/cgi-bin/products || true)"
k -n $NS get endpointslice -l kubernetes.io/service-name=report-svc
k -n $NS get pod -l app=report -o jsonpath='{.items[0].spec.containers[0].ports}{"\n"}'
k -n $NS patch svc report-svc --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'
echo "    curl: $(curl -s -m 40 -w ' %{http_code}' http://$cip:8080/cgi-bin/products | tr '\n' ' ' | cut -c1-120)"
k -n $NS get netpol
k -n $NS apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: allow-dns-egress, namespace: s51-batch}
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}, podSelector: {matchLabels: {k8s-app: kube-dns}}}]
    ports: [{port: 53, protocol: UDP}, {port: 53, protocol: TCP}]
EOF
ok5() { [ "$(curl -s -m 30 -o /dev/null -w '%{http_code}' http://$cip:8080/cgi-bin/products)" = 200 ]; }
until_t 90 ok5 || die "report-svc chưa trả 200 sau khi mở DNS"
echo "    curl: $(curl -s -m 30 -w ' %{http_code}' http://$cip:8080/cgi-bin/products | cut -c1-120)"

log "Q6 (b) indexer"
k -n $NS get pod -l app=indexer -o wide
k -n $NS describe pod -l app=indexer | sed -n '/^Events:/,$p' | tail -n2 | cut -c1-200
k get node -L disktype,disk
k -n $NS patch deploy indexer --type=json -p '[{"op":"replace","path":"/spec/template/spec/nodeSelector","value":{"disktype":"ssd"}}]'
sleep 8
k -n $NS get pod -l app=indexer -o wide
k describe node cka-w2 | grep -A2 '^Taints'
k taint node cka-w2 maintenance-
k -n $NS rollout status deploy/indexer --timeout=120s
k -n $NS get pod -l app=indexer -o wide

log "shop còn trải hai worker? (Pod xếp lại trong lúc cka-w2 có taint thì không về cka-w2)"
for d in gateway catalog order; do
  w=$(k -n shop get pod -l app=$d -o jsonpath='{range .items[?(@.status.phase=="Running")]}{.spec.nodeName}{"\n"}{end}' | sort -u | grep -c 'cka-w')
  if [ "$w" != 2 ]; then echo "    $d: chỉ trên $w worker → rollout restart"; k -n shop rollout restart deploy/$d; k -n shop rollout status deploy/$d --timeout=180s; fi
done

log "sổ tay và dọn Pod ngốn CPU"
grep -qi '^#.*s51' ~/notes/runbook.md 2>/dev/null || cat >> ~/notes/runbook.md <<'RB'

## s51 — tổng hợp bấm giờ: tài nguyên, Event, log, sự cố hai chỗ
- Đo tài nguyên: `k top pod -A --sort-by=cpu`, `--containers`; thô: `k get --raw /apis/metrics.k8s.io/v1beta1/nodes/<node>`.
- Event của một đối tượng: `k get events --field-selector involvedObject.name=<pod>,type=Warning --sort-by=.lastTimestamp`; log container phụ: `k logs <pod> -c <container>`.
- Service không trả lời: so Endpoints/EndpointSlice (cổng) với containerPort; sửa xong vẫn lỗi thì đọc tầng kế (DNS, NetworkPolicy egress 53).
- Pod Pending FailedScheduling: đọc từng vế của message (taint, node affinity/selector); `k get node -L <nhãn>`, `k describe node | grep Taints`.
- Ghi đáp án đúng đường dẫn, đúng định dạng; dọn Pod thử, Pod ngốn tài nguyên trước khi sang việc khác.
RB
k -n $NS delete pod -l app=cruncher --wait=false
ls -l $A
