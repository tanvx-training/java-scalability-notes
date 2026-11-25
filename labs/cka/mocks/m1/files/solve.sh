# m1 — lời giải chuẩn trên cka-cp (chỉ dùng trong s52/apply.sh, sau setup.sh và solve-node.sh trên cka-w1). Từng khối là
# đúng lệnh ở `solution` của câu đó trong mocks.js. Câu hỏi "lúc sự cố" (q4 log/top, q16 reason) làm trước khi sửa gì.
# Chạy lại được (mọi bước là apply/upgrade --install/ghi đè tệp). Thường 3–5 phút (chờ metrics, CoreDNS reload, rollout).
set -e
k() { kubectl --request-timeout=15s "$@"; }
log() { echo "m1/solve: $*"; }
die() { echo "m1/solve: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }
D=/opt/m1

log "q4 log ERROR của parser, Pod ngốn CPU nhất của m1-q4 (metrics của Pod mới cần ~1 phút)"
k -n m1-q4 logs ingest -c parser | grep ERROR > $D/q4-errors.log
top3() { [ "$(k -n m1-q4 top pod --no-headers 2>/dev/null | grep -c .)" = 3 ]; }
until_t 180 top3 || die "q4: metrics của m1-q4 chưa có sau 3 phút"
k -n m1-q4 top pod --sort-by=cpu --no-headers | head -n1 | awk '{print $1}' > $D/q4-top.txt

log "q16 reason Event của Pod worker lúc Pending, rồi sửa"
k -n m1-q16 get events --field-selector involvedObject.kind=Pod,type=Warning --sort-by=.lastTimestamp -o jsonpath='{.items[-1:].reason}' > $D/q16-reason.txt
grep -qx FailedScheduling $D/q16-reason.txt || die "q16: reason đọc được là '$(cat $D/q16-reason.txt)'"
k -n m1-q16 create configmap worker-config --from-literal=MODE=batch --dry-run=client -o yaml | k apply -f - >/dev/null
k -n m1-q16 set resources deploy/worker --requests=cpu=50m >/dev/null

log "q1 RBAC"
k -n m1-q1 create sa deployer --dry-run=client -o yaml | k apply -f - >/dev/null
k apply -f - >/dev/null <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: {name: deployer, namespace: m1-q1}
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: {name: deployer, namespace: m1-q1}
roleRef: {apiGroup: rbac.authorization.k8s.io, kind: Role, name: deployer}
subjects:
- {kind: ServiceAccount, name: deployer, namespace: m1-q1}
EOF

log "q2 HPA"
k -n m1-q2 set resources deploy/web --requests=cpu=20m >/dev/null
k -n m1-q2 autoscale deploy web --min=2 --max=4 --cpu=50% --dry-run=client -o yaml | k apply -f - >/dev/null

log "q3 StorageClass m1-fast, PVC cache, Pod cache-writer"
k apply -f - >/dev/null <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: {name: m1-fast}
provisioner: rancher.io/local-path
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: cache, namespace: m1-q3}
spec:
  storageClassName: m1-fast
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 200Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: cache-writer, namespace: m1-q3}
spec:
  containers:
  - name: writer
    image: busybox:1.37
    command: ["sh", "-c", "date > /cache/started; while :; do sleep 3600; done"]
    volumeMounts: [{name: cache, mountPath: /cache}]
    resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}
  volumes:
  - name: cache
    persistentVolumeClaim: {claimName: cache}
EOF

log "q5 NetworkPolicy api-ingress"
k apply -f - >/dev/null <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: api-ingress, namespace: m1-q5}
spec:
  podSelector: {matchLabels: {app: api}}
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector: {matchLabels: {app: client}}
    ports:
    - {protocol: TCP, port: 8080}
EOF

log "q6 etcd snapshot và lệnh restore (không chạy)"
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save $D/etcd.db 2>&1 | grep -E "saved|error|Error" || true
sudo etcdutl snapshot status $D/etcd.db -w table >/dev/null
echo 'etcdutl snapshot restore /opt/m1/etcd.db --data-dir /var/lib/etcd-m1' > $D/q6-restore.sh

log "q7 rollback về revision có VERSION=v1"
rev=""
for r in $(k -n m1-q7 rollout history deploy/shopfront | awk 'NR > 2 && $1 ~ /^[0-9]+$/ {print $1}'); do
  k -n m1-q7 rollout history deploy/shopfront --revision="$r" | grep -Eq 'VERSION:[[:space:]]+v1$' && rev=$r
done
[ -n "$rev" ] || die "q7: không thấy revision VERSION=v1"
# Ghi số revision TRƯỚC khi rollback: undo chuyển bản đó thành revision mới nhất (số cũ biến mất khỏi history). Chạy lại
# solve sau khi đã rollback thì giữ tệp đã ghi.
[ -s $D/q7-revision.txt ] || echo "$rev" > $D/q7-revision.txt
k -n m1-q7 rollout undo deploy/shopfront --to-revision="$rev" >/dev/null 2>&1 || true

log "q8 image và readinessProbe của web"
k -n m1-q8 set image deploy/web httpd=busybox:1.37 >/dev/null
k -n m1-q8 patch deploy web --type json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/port","value":8080}]' >/dev/null

log "q9 Service echo và HTTPRoute echo"
k -n m1-q9 expose deploy echo --name=echo --port=80 --target-port=8080 --dry-run=client -o yaml | k apply -f - >/dev/null
k apply -f - >/dev/null <<'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: {name: echo, namespace: m1-q9}
spec:
  parentRefs: [{name: m1-gw, sectionName: http}]
  hostnames: [echo.m1.lab]
  rules:
  - matches: [{path: {type: PathPrefix, value: /}}]
    backendRefs: [{name: echo, port: 80}]
EOF

log "q10 helm install notice"
helm upgrade --install notice /opt/m1/charts/notice -n m1-q10 --create-namespace \
  --set replicaCount=2 --set service.port=8088 --set message=maintenance-2200 --wait --timeout 3m >/dev/null

log "q11 PV m1-old Retain, PV m1-data, PVC data"
k patch pv m1-old -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}' >/dev/null
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: PersistentVolume
metadata: {name: m1-data}
spec:
  capacity: {storage: 128Mi}
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: m1-manual
  hostPath: {path: /srv/m1-data, type: DirectoryOrCreate}
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: data, namespace: m1-q11}
spec:
  storageClassName: m1-manual
  volumeName: m1-data
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 100Mi}}
EOF

log "q13 Pod logger với sidecar native"
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: Pod
metadata: {name: logger, namespace: m1-q13}
spec:
  initContainers:
  - name: shipper
    image: busybox:1.37
    restartPolicy: Always
    command: ["sh", "-c", "touch /var/log/app/app.log; tail -F /var/log/app/app.log"]
    volumeMounts: [{name: logs, mountPath: /var/log/app}]
    resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}
  containers:
  - name: app
    image: busybox:1.37
    command: ["sh", "-c", "while :; do echo \"$(date) app tick\" >> /var/log/app/app.log; sleep 2; done"]
    volumeMounts: [{name: logs, mountPath: /var/log/app}]
    resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}
  volumes:
  - name: logs
    emptyDir: {}
EOF

log "q14 CoreDNS: legacy.m1.lab → ClusterIP backend (plugin hosts có sẵn)"
ip=$(k -n m1-q14 get svc backend -o jsonpath='{.spec.clusterIP}')
k -n kube-system get cm coredns -o json | IP="$ip" python3 -c '
import json, os, re, sys
cm = json.load(sys.stdin); cf = cm["data"]["Corefile"]; ip = os.environ["IP"]
line = f"{ip} legacy.m1.lab"
if "legacy.m1.lab" in cf:
    cf = re.sub(r"^(\s*)\S+ legacy\.m1\.lab$", lambda m: m.group(1) + line, cf, flags=re.M)
else:
    cf = re.sub(r"^(\s*)hosts \{\n", lambda m: m.group(0) + m.group(1) + "   " + line + "\n", cf, count=1, flags=re.M)
print(json.dumps({"data": {"Corefile": cf}}))' > /tmp/m1-solve-cf.json
grep -q legacy.m1.lab /tmp/m1-solve-cf.json || die "q14: không thêm được dòng hosts"
k -n kube-system patch cm coredns --type merge --patch-file /tmp/m1-solve-cf.json >/dev/null; rm -f /tmp/m1-solve-cf.json

log "q15 CRD cert-manager, tài liệu spec.subject, CRI và CNI của cka-w2"
k get crd -o name | grep 'cert-manager\.io$' | cut -d/ -f2 > $D/q15-crds.txt
k explain certificates.spec.subject > $D/q15-subject.txt
k get --raw /api/v1/nodes/cka-w2/proxy/configz | python3 -c 'import json,sys; print(json.load(sys.stdin)["kubeletconfig"]["containerRuntimeEndpoint"])' > $D/q15-cri.txt
dbg=$(k debug node/cka-w2 --image=busybox:1.37 --profile=general -- ls /host/etc/cni/net.d 2>&1 | sed -n 's/^Creating debugging pod \([^ ]*\) .*/\1/p')
[ -n "$dbg" ] || die "q15: không tạo được Pod debug trên cka-w2"
done_dbg() { [ "$(k get pod "$dbg" -o jsonpath='{.status.phase}')" = Succeeded ]; }
until_t 90 done_dbg || die "q15: Pod debug $dbg chưa xong"
k logs "$dbg" | grep -E '\.(conf|conflist|json)$' | sort | head -n1 > $D/q15-cni.txt
k delete pod "$dbg" --wait=false >/dev/null

log "q12 (phần cka-cp, sau solve-node.sh): so resolv.conf hai Pod probe, tạo lại Pod dns-probe trên cka-w1"
for d in dns-probe dns-probe-w2; do
  echo "    $d: $(k -n m1-q12 exec deploy/$d -- cat /etc/resolv.conf | grep '^nameserver')"
done
k -n m1-q12 rollout restart deploy/dns-probe >/dev/null

log "chờ: rollout, PVC Bound, HPA đọc metric, route nạp vào data plane, policy có hiệu lực, CoreDNS phân giải legacy.m1.lab (tối đa ~7 phút)"
for x in m1-q7/shopfront m1-q8/web m1-q16/worker m1-q12/dns-probe; do k -n "${x%/*}" rollout status deploy/"${x#*/}" --timeout=180s >/dev/null || die "rollout $x chưa xong"; done
k -n m1-q3 wait pod cache-writer --for=condition=Ready --timeout=180s >/dev/null || die "q3: cache-writer chưa Ready"
k -n m1-q13 wait pod logger --for=condition=Ready --timeout=120s >/dev/null || die "q13: logger chưa Ready"
hpa_ok() { [ "$(k -n m1-q2 get hpa web -o jsonpath='{.status.conditions[?(@.type=="ScalingActive")].status}')" = True ] &&
  k -n m1-q2 get hpa web -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' | grep -q '[0-9]'; }
until_t 240 hpa_ok || die "q2: HPA chưa đọc được CPU sau 4 phút"
route_ok() { k -n m1-q9 get httproute echo -o jsonpath='{.status.parents[0].conditions[?(@.type=="Accepted")].status}' | grep -qx True; }
until_t 120 route_ok || die "q9: HTTPRoute echo chưa Accepted"
# Accepted chỉ là control plane của NGF đã nhận route; data plane nginx nạp cấu hình sau đó: chờ request thật qua m1-gw.
dip=$(k -n m1-q9 get svc -l gateway.networking.k8s.io/gateway-name=m1-gw -o jsonpath='{.items[0].spec.clusterIP}')
etok=$(k -n m1-q9 get deploy echo -o jsonpath='{.spec.template.spec.containers[0].env[0].value}')
gw_ok() { curl -s --noproxy '*' -m 3 -H 'Host: echo.m1.lab' "http://$dip:8080/" | grep -q "$etok"; }
until_t 120 gw_ok || die "q9: data plane m1-gw chưa nạp route echo"
# q5: policy có hiệu lực ở dataplane (Calico) sau vài giây: client tới được api, other và Pod app=client ở m1-q14 bị chặn.
aip=$(k -n m1-q5 get svc api -o jsonpath='{.spec.clusterIP}')
w5() { k -n "$1" exec deploy/"$2" -- wget -qO- -T 3 "http://$aip:8080/" >/dev/null 2>&1; }
pol_ok() { w5 m1-q5 client && ! w5 m1-q5 other && ! w5 m1-q14 dns-client; }
until_t 120 pol_ok || die "q5: NetworkPolicy api-ingress chưa có hiệu lực"
cli=$(k -n m1-q14 get pod -l app=client -o jsonpath='{.items[0].metadata.name}')
# Hai Pod CoreDNS nạp Corefile mới độc lập: chờ 10 lần liền đúng (mỗi truy vấn rơi vào một Pod bất kỳ).
dns1() { k -n m1-q14 exec "$cli" -- nslookup legacy.m1.lab 2>/dev/null | sed -n '/^Name:/,$p' | grep -q "$ip"; }
dns_ok() { local i=0; while [ $i -lt 10 ]; do dns1 || return 1; i=$((i+1)); done; }
until_t 240 dns_ok || die "q14: legacy.m1.lab chưa phân giải ổn định ra $ip sau 4 phút"
log "dọn hai Pod ngốn CPU của q4 (q4 chấm theo mốc lúc dựng đề; để chúng chạy thì Mock 2 đo CPU lệch)"
k -n m1-q4 delete pod -l 'app in (cache,burner)' --wait=false >/dev/null
log "xong 15 câu trên cka-cp (q12 do solve-node.sh trên cka-w1)"
