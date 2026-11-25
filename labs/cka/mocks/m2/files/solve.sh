# m2 — lời giải chuẩn trên cka-cp (chỉ dùng trong s53/apply.sh, sau setup.sh). Từng khối là đúng lệnh ở `solution` của câu
# đó trong mocks.js (solve.sh chỉ thêm --dry-run | apply để chạy lại được và vòng chờ). Hai phần, bên gọi đặt PART:
#   PART=1  q1 (kube-scheduler: sửa trước tiên, mọi Pod mới của đề cần nó) và các câu hỏi "lúc sự cố" phải đọc trước khi sửa:
#           q7 (exit code, log lần chạy trước của loader), q16 (reason lúc Pod chờ). Rồi apply.sh chạy solve-node.sh trên cka-w2.
#   PART=2  mọi câu còn lại, rồi chờ có giới hạn tới khi từng tiêu chí đo được (rollout, PVC Bound, quota, policy có hiệu lực,
#           data plane của Gateway đã nạp route, DNS headless, NodePort), để score.sh chạy ngay sau đó được 100/100.
# Chạy lại được (mọi bước là apply/patch/ghi đè tệp; restore etcd bỏ qua khi thư mục đã có). Thường 2–4 phút.
set -e
k() { kubectl --request-timeout=15s "$@"; }
log() { echo "m2/solve: $*"; }
die() { echo "m2/solve: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }
D=/opt/m2
R='{requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}'

if [ "$PART" = 1 ]; then
  log "q1 Pod nightly Pending không event: scheduler chạy mà không giành được lease (log), bỏ cờ namespace gõ sai"
  k -n kube-system logs kube-scheduler-cka-cp --tail=3 2>&1 | cut -c1-160 || true
  printf '%s\n' --leader-elect-resource-namespace > $D/q1-flag.txt
  sudo cp /etc/kubernetes/manifests/kube-scheduler.yaml ~/kube-scheduler.yaml.bak
  sudo sed -i '/--leader-elect-resource-namespace=/d' /etc/kubernetes/manifests/kube-scheduler.yaml
  sched_ok() { [ -n "$(k -n m2-q1 get pod -l app=nightly -o jsonpath='{.items[*].spec.nodeName}')" ]; }
  until_t 150 sched_ok || die "q1: Pod nightly vẫn chưa được xếp lịch sau 150 giây"
  k -n m2-q1 rollout status deploy/nightly --timeout=120s >/dev/null || die "q1: nightly chưa sẵn sàng"

  log "q7 lúc sự cố: exit code lần kết thúc trước của loader, dòng log cuối của lần chạy đó"
  k -n m2-q7 get pod -l app=importer -o jsonpath='{.items[0].status.containerStatuses[?(@.name=="loader")].lastState.terminated.exitCode}' > $D/q7-exitcode.txt
  echo >> $D/q7-exitcode.txt
  grep -qx 137 $D/q7-exitcode.txt || die "q7: exit code đọc được là '$(cat $D/q7-exitcode.txt)'"
  k -n m2-q7 logs deploy/importer -c loader --previous | tail -n1 > $D/q7-last.log

  log "q16 lúc sự cố: reason Pod toolbox đang chờ"
  k -n m2-q16 get pod -l app=toolbox -o jsonpath='{.items[0].status.containerStatuses[0].state.waiting.reason}' > $D/q16-reason.txt
  grep -qx ErrImageNeverPull $D/q16-reason.txt || die "q16: reason đọc được là '$(cat $D/q16-reason.txt)'"
  exit 0
fi
[ "$PART" = 2 ] || die "PART lạ: $PART"

log "q16 (sau solve-node.sh trên cka-w2): tạo lại Pod toolbox để kubelet thử lại ngay"
k -n m2-q16 rollout restart deploy/toolbox >/dev/null

log "q7 limits.memory 64Mi cho loader (requests và container proxy giữ nguyên)"
k -n m2-q7 set resources deploy/importer -c loader --limits=memory=64Mi >/dev/null

log "q2 user m2-auditor qua CSR, kubeconfig, ClusterRole/ClusterRoleBinding cho nhóm m2-audit"
[ -s $D/auditor.key ] || openssl genrsa -out $D/auditor.key 2048 2>/dev/null
openssl req -new -key $D/auditor.key -subj "/CN=m2-auditor/O=m2-audit" -out /tmp/m2-auditor.csr
k delete csr m2-auditor --ignore-not-found >/dev/null
k apply -f - >/dev/null <<EOF
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata: {name: m2-auditor}
spec:
  request: $(base64 -w0 < /tmp/m2-auditor.csr)
  signerName: kubernetes.io/kube-apiserver-client
  usages: [client auth]
EOF
rm -f /tmp/m2-auditor.csr
k certificate approve m2-auditor >/dev/null
issued() { [ -n "$(k get csr m2-auditor -o jsonpath='{.status.certificate}')" ]; }
until_t 60 issued || die "q2: CSR m2-auditor chưa có cert"
k get csr m2-auditor -o jsonpath='{.status.certificate}' | base64 -d > $D/auditor.crt
KC=$D/auditor.kubeconfig
rm -f $KC
server=$(k config view --minify -o jsonpath='{.clusters[0].cluster.server}')
k config set-cluster cka --server="$server" --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig=$KC >/dev/null
k config set-credentials m2-auditor --client-certificate=$D/auditor.crt --client-key=$D/auditor.key --embed-certs --kubeconfig=$KC >/dev/null
k config set-context m2-auditor --cluster=cka --user=m2-auditor --kubeconfig=$KC >/dev/null
k config use-context m2-auditor --kubeconfig=$KC >/dev/null
k create clusterrole m2-pod-reader --verb=get,list,watch --resource=pods --dry-run=client -o yaml | k apply -f - >/dev/null
k create clusterrolebinding m2-auditor --clusterrole=m2-pod-reader --group=m2-audit --dry-run=client -o yaml | k apply -f - >/dev/null
k --kubeconfig=$KC auth whoami

log "q3 ResourceQuota team-quota, LimitRange team-defaults, Pod batch chạy lại để nhận mặc định"
k -n m2-q3 create quota team-quota --hard=pods=4,requests.cpu=200m,requests.memory=256Mi,limits.memory=512Mi --dry-run=client -o yaml | k apply -f - >/dev/null
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: LimitRange
metadata: {name: team-defaults, namespace: m2-q3}
spec:
  limits:
  - type: Container
    defaultRequest: {cpu: 25m, memory: 32Mi}
    default: {memory: 64Mi}
EOF
k -n m2-q3 rollout restart deploy/batch >/dev/null

log "q4 StorageClass m2-standard mặc định duy nhất, rồi PVC logs không ghi class"
k apply -f - >/dev/null <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: {name: m2-standard}
provisioner: rancher.io/local-path
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
EOF
k patch sc local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}' >/dev/null
k patch sc m2-standard -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}' >/dev/null
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: logs, namespace: m2-q4}
spec:
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 64Mi}}
EOF

log "q5 NetworkPolicy fetcher-egress: chỉ store ở m2-q5-db cổng 8080, và DNS"
k apply -f - >/dev/null <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: fetcher-egress, namespace: m2-q5}
spec:
  podSelector: {matchLabels: {app: fetcher}}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: m2-q5-db}}
      podSelector: {matchLabels: {app: store}}
    ports: [{protocol: TCP, port: 8080}]
  - to:
    - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}
      podSelector: {matchLabels: {k8s-app: kube-dns}}
    ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]
EOF

log "q6 etcd: member list ra tệp, revision của bản sao lưu, restore thử vào thư mục mới (etcd đang chạy không đổi)"
P=/etc/kubernetes/pki/etcd
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$P/ca.crt --cert=$P/server.crt --key=$P/server.key member list -w table > $D/q6-members.txt
sudo etcdutl snapshot status $D/etcd-backup.db -w table
sudo etcdutl snapshot status $D/etcd-backup.db -w json | python3 -c 'import json,sys; print(json.load(sys.stdin)["revision"])' > $D/q6-revision.txt
sudo test -d /var/lib/etcd-m2-check || sudo etcdutl snapshot restore $D/etcd-backup.db --data-dir /var/lib/etcd-m2-check 2>&1 | tail -n1
sudo ls /var/lib/etcd-m2-check/member

log "q8 CronJob rotate (tạm dừng), chạy thử bằng Job rotate-manual"
k apply -f - >/dev/null <<EOF
apiVersion: batch/v1
kind: CronJob
metadata: {name: rotate, namespace: m2-q8}
spec:
  schedule: "*/30 * * * *"
  suspend: true
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 1
      activeDeadlineSeconds: 60
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: rotate
            image: busybox:1.37
            command: ["sh", "-c", "echo rotate \$TARGET"]
            env:
            - name: TARGET
              valueFrom: {configMapKeyRef: {name: rotate-config, key: target}}
            resources: $R
EOF
k -n m2-q8 delete job rotate-manual --ignore-not-found >/dev/null
k -n m2-q8 create job rotate-manual --from=cronjob/rotate >/dev/null

log "q9 HTTPRoute web: header X-Canary → web-v2, /old → 301 về /, còn lại → web-v1"
k apply -f - >/dev/null <<'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: {name: web, namespace: m2-q9}
spec:
  parentRefs: [{name: m2-gw, sectionName: http}]
  hostnames: [app.m2.lab]
  rules:
  - matches: [{path: {type: PathPrefix, value: /old}}]
    filters:
    - type: RequestRedirect
      requestRedirect: {path: {type: ReplaceFullPath, replaceFullPath: /}, statusCode: 301}
  - matches: [{headers: [{name: X-Canary, value: always}]}]
    backendRefs: [{name: web-v2, port: 80}]
  - backendRefs: [{name: web-v1, port: 80}]
EOF

log "q10 overlay Kustomize prod, áp bằng kubectl apply -k"
mkdir -p $D/kustomize/overlays/prod
cat > $D/kustomize/overlays/prod/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: m2-q10
namePrefix: prod-
resources:
- ../../base
labels:
- pairs: {env: prod}
  includeSelectors: true
replicas:
- name: api
  count: 2
configMapGenerator:
- name: api-config
  behavior: merge
  literals:
  - MODE=prod
EOF
k kustomize $D/kustomize/overlays/prod | grep -E '^  name: prod-' || true
k apply -k $D/kustomize/overlays/prod >/dev/null

log "q11 Service orders: selector theo nhãn thật của Pod, targetPort theo tên cổng thật (api)"
k -n m2-q11 get pod --show-labels | tail -n +2 | awk '{print "    " $1, $NF}'
k -n m2-q11 patch svc orders --type merge -p '{"spec":{"selector":{"app":"orders","tier":"backend"},"ports":[{"name":"http","port":80,"targetPort":"api"}]}}' >/dev/null

log "q12 PV m2-archive Released: gỡ claimRef cũ, PVC archive gắn vào nó"
if [ -n "$(k get pv m2-archive -o jsonpath='{.spec.claimRef.name}')" ] && [ "$(k get pv m2-archive -o jsonpath='{.spec.claimRef.name}')" != archive ]; then
  k patch pv m2-archive --type json -p '[{"op":"remove","path":"/spec/claimRef"}]' >/dev/null
fi
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: archive, namespace: m2-q12}
spec:
  storageClassName: m2-archive
  volumeName: m2-archive
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 64Mi}}
EOF

log "q13 PriorityClass m2-high, Deployment ledger dùng nó, PriorityClass hệ thống ra tệp"
k create priorityclass m2-high --value=50000 --preemption-policy=Never --description="m2: batch quan trọng, không đuổi Pod khác" \
  --dry-run=client -o yaml | k apply -f - >/dev/null
k -n m2-q13 patch deploy ledger -p '{"spec":{"template":{"spec":{"priorityClassName":"m2-high"}}}}' >/dev/null
k get priorityclass --sort-by=.metadata.name -o jsonpath='{range .items[?(@.value>=1000000000)]}{.metadata.name}{"\n"}{end}' > $D/q13-system.txt

log "q14 Service headless kv, NodePort kv-primary 30362 chỉ tới kv-0"
k apply -f - >/dev/null <<'EOF'
apiVersion: v1
kind: Service
metadata: {name: kv, namespace: m2-q14}
spec:
  clusterIP: None
  selector: {app: kv}
  ports: [{name: http, port: 8080, targetPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: kv-primary, namespace: m2-q14}
spec:
  type: NodePort
  selector: {statefulset.kubernetes.io/pod-name: kv-0}
  ports: [{name: http, port: 8080, targetPort: 8080, nodePort: 30362}]
EOF

log "q15 token mới TTL 2h (description m2-q15) và lệnh join; xoá token m2-stale"
sudo kubeadm token create --ttl 2h --description m2-q15 --print-join-command > $D/q15-join.sh
for t in $(sudo kubeadm token list | awk '/m2-stale/ {print $1}'); do sudo kubeadm token delete "$t" >/dev/null; done
sudo kubeadm token list | cut -c1-60

log "chờ: rollout, quota, PVC Bound, policy có hiệu lực, route nạp vào data plane, DNS headless, NodePort (tối đa ~6 phút)"
for x in m2-q3/batch m2-q7/importer m2-q10/prod-api m2-q13/ledger m2-q16/toolbox; do
  k -n "${x%/*}" rollout status deploy/"${x#*/}" --timeout=180s >/dev/null || die "rollout $x chưa xong"
done
k -n m2-q4 wait pod log-writer --for=condition=Ready --timeout=180s >/dev/null || die "q4: log-writer chưa Ready"
k -n m2-q12 wait pod reporter --for=condition=Ready --timeout=180s >/dev/null || die "q12: reporter chưa Ready"
k -n m2-q8 wait job rotate-manual --for=condition=Complete --timeout=120s >/dev/null || die "q8: rotate-manual chưa Complete"
# Quota tính lại sau khi Pod cũ (không requests) đi hết: ghi Used khi đã ổn định ở 2 × 25m.
used_ok() { [ "$(k -n m2-q3 get quota team-quota -o jsonpath='{.status.used.requests\.cpu}')" = 50m ]; }
until_t 120 used_ok || die "q3: quota chưa tính 50m"
k -n m2-q3 get quota team-quota -o jsonpath='{.status.used.requests\.cpu}' > $D/q3-used.txt; echo >> $D/q3-used.txt
f=$(k -n m2-q5 get pod -l app=fetcher -o jsonpath='{.items[0].metadata.name}')
sip=$(k -n m2-q5-db get svc store -o jsonpath='{.spec.clusterIP}'); cip=$(k -n m2-q5-db get svc cache -o jsonpath='{.spec.clusterIP}')
pol_ok() { k -n m2-q5 exec "$f" -- wget -qO- -T 3 "http://store.m2-q5-db.svc.cluster.local:8080/" >/dev/null 2>&1 &&
  ! k -n m2-q5 exec "$f" -- wget -qO- -T 3 "http://$cip:8080/" >/dev/null 2>&1; }
until_t 120 pol_ok || die "q5: policy chưa có hiệu lực (store được, cache bị chặn)"
dip=$(k -n m2-q9 get svc -l gateway.networking.k8s.io/gateway-name=m2-gw -o jsonpath='{.items[0].spec.clusterIP}')
v2=$(k -n m2-q9 get deploy web-v2 -o jsonpath='{.spec.template.spec.containers[0].env[0].value}')
route_ok() { curl -s --noproxy '*' -m 3 -H 'Host: app.m2.lab' -H 'X-Canary: always' "http://$dip:8080/" | grep -q "$v2" &&
  [ "$(curl -s --noproxy '*' -m 3 -o /dev/null -w '%{http_code}' -H 'Host: app.m2.lab' "http://$dip:8080/old")" = 301 ]; }
until_t 120 route_ok || die "q9: data plane m2-gw chưa nạp route web"
pr=$(k -n m2-q14 get pod -l app=probe -o jsonpath='{.items[0].metadata.name}')
ip0=$(k -n m2-q14 get pod kv-0 -o jsonpath='{.status.podIP}')
dns_ok() { k -n m2-q14 exec "$pr" -- nslookup kv-0.kv.m2-q14.svc.cluster.local 2>/dev/null | sed -n '/^Name:/,$p' | grep -q "$ip0"; }
until_t 120 dns_ok || die "q14: kv-0.kv chưa phân giải"
w1=$(k get node cka-w1 -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}')
np_ok() { curl -s --noproxy '*' -m 3 "http://$w1:30362/" | grep -q '^kv-0 '; }
until_t 60 np_ok || die "q14: NodePort 30362 chưa trả kv-0"
log "xong 16 câu (q16 phần node do solve-node.sh trên cka-w2)"
