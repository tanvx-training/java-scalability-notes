# m2 — dọn lần làm trước rồi dựng đề trên cka-cp (user ubuntu, sudo; kubectl, kubeadm, etcdctl/etcdutl, openssl, python3).
# Gọi bởi setup.sh (cùng đề) ba lần:
#   PHASE=clean  sau khi lõi đã khoẻ: dọn lần làm trước của **chính đề m2** (không đụng m1-*, shop, s51-batch, etcd đang chạy,
#                PV postgres):
#                namespace m2-q* (Pod xoá --force trước, chờ xoá xong); ClusterRole m2-pod-reader, ClusterRoleBinding
#                m2-auditor, CSR m2-auditor, PriorityClass m2-high, StorageClass m2-standard; StorageClass mặc định về như lần
#                dựng đầu (/root/.lab/m2/default-sc: tên các lớp có is-default-class=true lúc đó); PV m2-archive và PV có
#                claimRef trong m2-* hay lớp m2-archive (không theo m2-standard: lớp mặc định sau m2); bootstrap token có description m2-stale hay m2-q15;
#                /opt/m2; /var/lib/etcd-m2-check (thư mục restore thử của q6; chỉ khi etcd không dùng nó); mốc của lần trước.
#   PHASE=main   (sau w2.sh STEP=prep trên cka-w2) dựng mọi câu, chờ mọi Pod của đề được xếp lịch (trừ hai Pod chờ PVC của q4,
#                q12) và Pod lỗi đứng đúng trạng thái lỗi, ghi mốc chấm.
#   PHASE=after  sau khi cp.sh STEP=break đã hỏng kube-scheduler: tạo Deployment nightly của q1, kiểm Pod của nó không được
#                xếp lịch sau 20 giây.
# Không in gì khi thành công (không lộ đề hay lời giải); lỗi thì một dòng `lab: …` ra stderr và trả 1.
#
# Dựng (mỗi câu namespace m2-qN; Pod busybox:1.37 có sẵn trên node, requests 5m/8Mi, limits ≤ 32Mi trừ q7):
#   q1  m2-q1 (nightly: PHASE=after).        q2  không có đối tượng (cluster-scoped, người học tạo).
#   q3  m2-q3: Deployment batch (2 replica, không resources).
#   q4  m2-q4: Pod log-writer chờ PVC logs (chưa có).
#   q5  m2-q5: fetcher (app=fetcher), auditor (app=auditor); m2-q5-db: store, cache (httpd 8080) + Service store, cache.
#   q6  m2-q6: ConfigMap ledger; snapshot /opt/m2/etcd-backup.db chụp lúc dựng (revision, member ID, peer URL ghi mốc).
#   q7  m2-q7: Deployment importer (loader cấp ~20 MB lúc khởi động với limits 16Mi → OOM kill, exit 137; proxy) + Service.
#   q8  m2-q8: ConfigMap rotate-config (target = mã ngẫu nhiên).
#   q9  m2-q9: web-v1, web-v2 + Service; Gateway m2-gw (GatewayClass nginx của s30, listener http 8080, host app.m2.lab).
#   q10 m2-q10 trống; /opt/m2/kustomize/base (Deployment api, Service api, configMapGenerator api-config MODE=dev).
#   q11 m2-q11: Deployment orders (app=orders,tier=backend, cổng tên api 9090), Service orders sai selector (app=order) và
#       targetPort tên http; Deployment frontend.
#   q12 PV m2-archive (hostPath /srv/m2-archive trên cka-w2, Retain): một PVC cũ ghi báo cáo rồi bị xoá → PV Released;
#       m2-q12: Pod reporter chờ PVC archive.
#   q13 m2-q13: Deployment ledger.                q14 m2-q14: StatefulSet kv (2 Pod, serviceName kv chưa có Service), probe.
#   q15 hai bootstrap token description m2-stale.  q16 m2-q16: Deployment toolbox (image m2.lab/tools:1.0, Never, cka-w2).
# Mốc ở /root/.lab/m2/ (root, 700): q5-store, q5-cache, q6-rev, q6-member, q6-name, q6-peer, q7-last, q7-token, q8-target,
# q9-v1, q9-v2, q10-base (sha256 ba tệp base), q11-token, q12-token, q12-uid, q13-system, q14-token, q15-hash, q15-endpoint,
# q15-stale; bản tốt kube-scheduler.yaml (cp.sh), default-sc. /opt/m2/started và /root/.lab/m2/started do setup.sh ghi sau cùng.
set -e
H=/root/.lab/m2
D=/opt/m2
k() { kubectl --request-timeout=15s "$@"; }
fail() { echo "lab: không dựng được đề m2 (bước $1); chạy lại ./labs/lab mock cka m2 start, vẫn lỗi thì ./labs/lab restore cka s52" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
put() { printf '%s\n' "$2" | sudo tee "$H/$1" >/dev/null; }
sudo install -d -m 700 $H
R='{requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}'
HTTPD='mkdir -p /www && echo "$PAGE" > /www/index.html && exec httpd -f -p $PORT -h /www'
SLEEP='["sh", "-c", "while :; do sleep 3600; done"]'

if [ "$PHASE" = clean ]; then
  sudo rm -f $H/started
  for ns in $(k get ns -o name | sed -n 's#^namespace/\(m2-q[0-9][0-9]*\(-[a-z0-9-]*\)\{0,1\}\)$#\1#p'); do
    k -n "$ns" delete pod --all --grace-period=0 --force --wait=false >/dev/null 2>&1 || true
    k delete ns "$ns" --wait=false >/dev/null
  done
  gone() { [ -z "$(k get ns -o name | grep '^namespace/m2-q')" ]; }
  until_t 300 gone || fail "clean/xoá namespace m2-*"
  k delete clusterrolebinding m2-auditor --ignore-not-found >/dev/null
  k delete clusterrole m2-pod-reader --ignore-not-found >/dev/null
  k delete csr m2-auditor --ignore-not-found >/dev/null
  k delete priorityclass m2-high --ignore-not-found >/dev/null
  # StorageClass mặc định: lưu ở lần dựng đầu (trước khi có m2-standard), lần sau đưa về đúng như vậy.
  scs="$(k get sc -o json)" || fail "clean/đọc StorageClass"
  if ! sudo test -f $H/default-sc; then
    printf '%s' "$scs" | python3 -c '
import json, sys
for s in json.load(sys.stdin)["items"]:
    if s["metadata"]["name"] != "m2-standard" and (s["metadata"].get("annotations") or {}).get("storageclass.kubernetes.io/is-default-class") == "true":
        print(s["metadata"]["name"])' | sudo tee $H/default-sc >/dev/null
  fi
  k delete sc m2-standard --ignore-not-found >/dev/null
  printf '%s' "$scs" | WANT="$(sudo cat $H/default-sc)" python3 -c '
import json, os, sys
want = set(os.environ["WANT"].split())
for s in json.load(sys.stdin)["items"]:
    n = s["metadata"]["name"]
    if n == "m2-standard": continue
    cur = (s["metadata"].get("annotations") or {}).get("storageclass.kubernetes.io/is-default-class") == "true"
    if cur != (n in want): print(n, "true" if n in want else "false")' | while read -r n v; do
    k annotate sc "$n" storageclass.kubernetes.io/is-default-class="$v" --overwrite >/dev/null || fail "clean/StorageClass $n"
  done
  for pv in $(k get pv -o json | python3 -c '
import json, sys
for p in json.load(sys.stdin)["items"]:
    n, s = p["metadata"]["name"], p["spec"]
    # Chỉ PV của m2: tên m2-*, hay claim ở namespace m2-*, hay class m2-archive. KHÔNG theo m2-standard (class mặc định sau m2:
    # PV người học tạo sau đó bằng PVC không ghi class cũng mang class này).
    if n.startswith("m2-") or s.get("storageClassName") == "m2-archive" or (s.get("claimRef") or {}).get("namespace", "").startswith("m2-"):
        print(n)'); do k delete pv "$pv" --wait=false >/dev/null; done
  # Bootstrap token của q15 (của đề và của người học): Secret bootstrap-token-<id> trong kube-system, description m2-*.
  for s in $(k -n kube-system get secret --field-selector type=bootstrap.kubernetes.io/token -o json | python3 -c '
import base64, json, sys
for s in json.load(sys.stdin)["items"]:
    d = base64.b64decode((s.get("data") or {}).get("description", "")).decode(errors="replace")
    if d in ("m2-stale", "m2-q15"): print(s["metadata"]["name"])'); do k -n kube-system delete secret "$s" >/dev/null; done
  sudo rm -rf $D
  if ! sudo grep -q 'etcd-m2-check' /etc/kubernetes/manifests/etcd.yaml; then sudo rm -rf /var/lib/etcd-m2-check; fi
  sudo find $H -maxdepth 1 -type f -name 'q*' -delete
  exit 0
fi

if [ "$PHASE" = after ]; then
  k apply -f - >/dev/null <<EOF || fail "after/nightly"
apiVersion: apps/v1
kind: Deployment
metadata: {name: nightly, namespace: m2-q1}
spec:
  replicas: 1
  selector: {matchLabels: {app: nightly}}
  template:
    metadata: {labels: {app: nightly}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: job, image: busybox:1.37, command: $SLEEP, resources: $R}
EOF
  has_pod() { [ -n "$(k -n m2-q1 get pod -l app=nightly -o name 2>/dev/null)" ]; }
  until_t 60 has_pod || fail "after/nightly chưa có Pod"
  sleep 20
  [ -z "$(k -n m2-q1 get pod -l app=nightly -o jsonpath='{.items[*].spec.nodeName}')" ] || fail "after/scheduler vẫn xếp lịch Pod"
  exit 0
fi

[ "$PHASE" = main ] || fail "PHASE lạ: $PHASE"
# 1. Thư mục đáp án, base của Kustomize (q10).
sudo install -d -m 755 -o "$(id -u)" -g "$(id -g)" $D $D/kustomize $D/kustomize/base
cat > $D/kustomize/base/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
configMapGenerator:
- name: api-config
  literals:
  - MODE=dev
EOF
cat > $D/kustomize/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels: {app: api}
spec:
  replicas: 1
  selector:
    matchLabels: {app: api}
  template:
    metadata:
      labels: {app: api}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: api
        image: busybox:1.37
        command: ["sh", "-c", 'mkdir -p /www && echo "api mode=$MODE" > /www/index.html && exec httpd -f -p 8080 -h /www']
        envFrom:
        - configMapRef: {name: api-config}
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources:
          requests: {cpu: 5m, memory: 8Mi}
          limits: {memory: 32Mi}
EOF
cat > $D/kustomize/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector: {app: api}
  ports:
  - {name: http, port: 80, targetPort: http}
EOF

# 2. Đối tượng của các câu. Mã ngẫu nhiên mỗi lần dựng (đáp án không đoán được, không chép được từ lần trước).
h() { openssl rand -hex "$1"; }
t5s=$(h 3); t5c=$(h 3); t7=$(h 3); t8=$(h 4); t9a=$(h 3); t9b=$(h 3); t11=$(h 3); t12=$(h 4); t14=$(h 3)
k get svc -A -o jsonpath='{range .items[*]}{range .spec.ports[*]}{.nodePort}{"\n"}{end}{end}' | grep -qx 30362 && fail "2/nodePort 30362 đã có Service dùng"
k apply -f - >/dev/null <<EOF || fail "2/apply"
apiVersion: v1
kind: Namespace
metadata: {name: m2-q1}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q3}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: batch, namespace: m2-q3}
spec:
  replicas: 2
  selector: {matchLabels: {app: batch}}
  template:
    metadata: {labels: {app: batch}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: batch, image: busybox:1.37, command: $SLEEP}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q4}
---
apiVersion: v1
kind: Pod
metadata: {name: log-writer, namespace: m2-q4}
spec:
  terminationGracePeriodSeconds: 0
  containers:
  - name: writer
    image: busybox:1.37
    command: ["sh", "-c", "while :; do date >> /logs/app.log; sleep 30; done"]
    volumeMounts: [{name: logs, mountPath: /logs}]
    resources: $R
  volumes:
  - name: logs
    persistentVolumeClaim: {claimName: logs}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q5}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q5-db}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: fetcher, namespace: m2-q5}
spec:
  replicas: 1
  selector: {matchLabels: {app: fetcher}}
  template:
    metadata: {labels: {app: fetcher}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: $SLEEP, resources: $R}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: auditor, namespace: m2-q5}
spec:
  replicas: 1
  selector: {matchLabels: {app: auditor}}
  template:
    metadata: {labels: {app: auditor}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: $SLEEP, resources: $R}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: store, namespace: m2-q5-db}
spec:
  replicas: 1
  selector: {matchLabels: {app: store}}
  template:
    metadata: {labels: {app: store}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: store
        image: busybox:1.37
        env: [{name: PAGE, value: "store-$t5s"}, {name: PORT, value: "8080"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: store, namespace: m2-q5-db}
spec:
  selector: {app: store}
  ports: [{port: 8080, targetPort: 8080}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: cache, namespace: m2-q5-db}
spec:
  replicas: 1
  selector: {matchLabels: {app: cache}}
  template:
    metadata: {labels: {app: cache}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: cache
        image: busybox:1.37
        env: [{name: PAGE, value: "cache-$t5c"}, {name: PORT, value: "8080"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: cache, namespace: m2-q5-db}
spec:
  selector: {app: cache}
  ports: [{port: 8080, targetPort: 8080}]
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q6}
---
apiVersion: v1
kind: ConfigMap
metadata: {name: ledger, namespace: m2-q6}
data: {token: "$(h 6)"}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q7}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: importer, namespace: m2-q7}
spec:
  replicas: 1
  selector: {matchLabels: {app: importer}}
  template:
    metadata: {labels: {app: importer}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: loader
        image: busybox:1.37
        env: [{name: T, value: "$t7"}]
        command: ["sh", "-c", 'echo "importer: start batch \$T"; echo "importer: loading chunk \$T-20mb"; x=\$(head -c 20000000 /dev/zero | tr "\\\\0" a); echo "importer: chunk loaded (\${#x} bytes)"; x=; mkdir -p /www && echo "importer \$T" > /www/index.html && exec httpd -f -p 8080 -h /www']
        ports: [{containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 16Mi}}
      - {name: proxy, image: busybox:1.37, command: $SLEEP, resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 24Mi}}}
---
apiVersion: v1
kind: Service
metadata: {name: importer, namespace: m2-q7}
spec:
  selector: {app: importer}
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q8}
---
apiVersion: v1
kind: ConfigMap
metadata: {name: rotate-config, namespace: m2-q8}
data: {target: "bucket-$t8"}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q9}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: web-v1, namespace: m2-q9}
spec:
  replicas: 1
  selector: {matchLabels: {app: web, version: v1}}
  template:
    metadata: {labels: {app: web, version: v1}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: web
        image: busybox:1.37
        env: [{name: PAGE, value: "web-v1-$t9a"}, {name: PORT, value: "8080"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: web-v2, namespace: m2-q9}
spec:
  replicas: 1
  selector: {matchLabels: {app: web, version: v2}}
  template:
    metadata: {labels: {app: web, version: v2}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: web
        image: busybox:1.37
        env: [{name: PAGE, value: "web-v2-$t9b"}, {name: PORT, value: "8080"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: web-v1, namespace: m2-q9}
spec:
  selector: {app: web, version: v1}
  ports: [{port: 80, targetPort: http}]
---
apiVersion: v1
kind: Service
metadata: {name: web-v2, namespace: m2-q9}
spec:
  selector: {app: web, version: v2}
  ports: [{port: 80, targetPort: http}]
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: {name: m2-gw, namespace: m2-q9}
spec:
  gatewayClassName: nginx
  listeners:
  - {name: http, protocol: HTTP, port: 8080, hostname: app.m2.lab}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q10}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q11}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: orders, namespace: m2-q11}
spec:
  replicas: 1
  selector: {matchLabels: {app: orders, tier: backend}}
  template:
    metadata: {labels: {app: orders, tier: backend}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: orders
        image: busybox:1.37
        env: [{name: PAGE, value: "orders-$t11"}, {name: PORT, value: "9090"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{name: api, containerPort: 9090}]
        readinessProbe: {tcpSocket: {port: api}, periodSeconds: 5}
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: orders, namespace: m2-q11}
spec:
  selector: {app: order, tier: backend}
  ports: [{name: http, port: 80, targetPort: http}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: frontend, namespace: m2-q11}
spec:
  replicas: 1
  selector: {matchLabels: {app: frontend}}
  template:
    metadata: {labels: {app: frontend}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: $SLEEP, resources: $R}
---
apiVersion: v1
kind: PersistentVolume
metadata: {name: m2-archive}
spec:
  capacity: {storage: 64Mi}
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: m2-archive
  hostPath: {path: /srv/m2-archive, type: DirectoryOrCreate}
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions: [{key: kubernetes.io/hostname, operator: In, values: [cka-w2]}]
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q12}
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: archive-2026-10, namespace: m2-q12}
spec:
  storageClassName: m2-archive
  volumeName: m2-archive
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 64Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: archiver, namespace: m2-q12}
spec:
  terminationGracePeriodSeconds: 0
  restartPolicy: Never
  containers:
  - name: archiver
    image: busybox:1.37
    command: ["sh", "-c", 'echo "report 2026-10 $t12" > /data/report.txt && sync']
    volumeMounts: [{name: data, mountPath: /data}]
    resources: $R
  volumes:
  - name: data
    persistentVolumeClaim: {claimName: archive-2026-10}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q13}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: ledger, namespace: m2-q13}
spec:
  replicas: 1
  selector: {matchLabels: {app: ledger}}
  template:
    metadata: {labels: {app: ledger}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: ledger, image: busybox:1.37, command: $SLEEP, resources: $R}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q14}
---
apiVersion: apps/v1
kind: StatefulSet
metadata: {name: kv, namespace: m2-q14}
spec:
  serviceName: kv
  replicas: 2
  podManagementPolicy: Parallel
  selector: {matchLabels: {app: kv}}
  template:
    metadata: {labels: {app: kv}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: kv
        image: busybox:1.37
        env: [{name: T, value: "$t14"}]
        command: ["sh", "-c", 'mkdir -p /www && echo "\$(hostname) \$T" > /www/index.html && exec httpd -f -p 8080 -h /www']
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: probe, namespace: m2-q14}
spec:
  replicas: 1
  selector: {matchLabels: {app: probe}}
  template:
    metadata: {labels: {app: probe}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: $SLEEP, resources: $R}
---
apiVersion: v1
kind: Namespace
metadata: {name: m2-q16}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: toolbox, namespace: m2-q16}
spec:
  replicas: 1
  selector: {matchLabels: {app: toolbox}}
  template:
    metadata: {labels: {app: toolbox}}
    spec:
      terminationGracePeriodSeconds: 0
      nodeSelector: {kubernetes.io/hostname: cka-w2}
      containers:
      - name: tools
        image: m2.lab/tools:1.0
        imagePullPolicy: Never
        command: $SLEEP
        resources: $R
EOF

# 3. q12: PVC cũ ghi báo cáo rồi bị xoá → PV Released (claimRef còn trỏ PVC cũ); rồi Pod reporter chờ PVC archive.
done_arch() { [ "$(k -n m2-q12 get pod archiver -o jsonpath='{.status.phase}' 2>/dev/null)" = Succeeded ]; }
until_t 150 done_arch || fail "3/archiver"
k -n m2-q12 delete pod archiver --wait=true >/dev/null
k -n m2-q12 delete pvc archive-2026-10 --wait=true >/dev/null
released() { [ "$(k get pv m2-archive -o jsonpath='{.status.phase}')" = Released ]; }
until_t 60 released || fail "3/PV m2-archive chưa Released"
k apply -f - >/dev/null <<EOF || fail "3/reporter"
apiVersion: v1
kind: Pod
metadata: {name: reporter, namespace: m2-q12}
spec:
  terminationGracePeriodSeconds: 0
  containers:
  - name: reporter
    image: busybox:1.37
    command: ["sh", "-c", "cat /data/report.txt; while :; do sleep 3600; done"]
    volumeMounts: [{name: data, mountPath: /data}]
    resources: $R
  volumes:
  - name: data
    persistentVolumeClaim: {claimName: archive}
EOF

# 4. q15: hai token "bị lộ" cần xoá (description m2-stale), hash CA, endpoint apiserver.
stale=""
for i in 1 2; do
  t=$(sudo kubeadm token create --ttl 24h --description m2-stale 2>/dev/null) || fail "4/kubeadm token create"
  stale="$stale${t%%.*} "
done

# 5. Chờ: mọi Pod của đề đã được xếp lịch (trước khi cp.sh hỏng scheduler), Pod lỗi đúng trạng thái lỗi.
sched() {
  local ns="$1" sel="$2" n
  n=$(k -n "$ns" get pod -l "$sel" -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' 2>/dev/null | grep -c .)
  [ "$n" -ge "$3" ]
}
for x in m2-q3:app=batch:2 m2-q5:app=fetcher:1 m2-q5:app=auditor:1 m2-q5-db:app=store:1 m2-q5-db:app=cache:1 \
         m2-q7:app=importer:1 m2-q9:app=web:2 m2-q11:app=orders:1 m2-q11:app=frontend:1 m2-q13:app=ledger:1 \
         m2-q14:app=kv:2 m2-q14:app=probe:1 m2-q16:app=toolbox:1; do
  IFS=: read -r ns sel n <<EOF
$x
EOF
  until_t 120 sched "$ns" "$sel" "$n" || fail "5/Pod $ns $sel chưa được xếp lịch"
done
dp_ready() { [ "$(k -n m2-q9 get deploy -l gateway.networking.k8s.io/gateway-name=m2-gw -o jsonpath='{.items[0].status.readyReplicas}' 2>/dev/null)" = 1 ]; }
until_t 180 dp_ready || fail "5/data plane của Gateway m2-gw"
for x in m2-q5-db:store m2-q5-db:cache m2-q9:web-v1 m2-q9:web-v2 m2-q11:orders m2-q3:batch m2-q13:ledger; do
  k -n "${x%%:*}" rollout status deploy/"${x#*:}" --timeout=120s >/dev/null || fail "5/rollout $x"
done
k -n m2-q14 rollout status sts/kv --timeout=120s >/dev/null || fail "5/StatefulSet kv"
# Đã chết vì OOM ít nhất một lần (exit 137). reason có lúc là Error thay vì OOMKilled (containerd nhận sự kiện exit trước sự kiện
# OOM: đo 2/6 lần trên lab), nên câu q7 hỏi exit code, không hỏi reason.
oom() { k -n m2-q7 get pod -l app=importer -o jsonpath='{.items[0].status.containerStatuses[?(@.name=="loader")].lastState.terminated.exitCode}' 2>/dev/null | grep -qx 137; }
until_t 120 oom || fail "5/importer chưa bị OOM kill"
neverpull() { k -n m2-q16 get pod -l app=toolbox -o jsonpath='{.items[0].status.containerStatuses[0].state.waiting.reason}' 2>/dev/null | grep -qx ErrImageNeverPull; }
until_t 90 neverpull || fail "5/toolbox chưa ErrImageNeverPull"

# 6. q6: snapshot "đêm qua", lấy sau khi đã có ConfigMap ledger.
P=/etc/kubernetes/pki/etcd
EC="sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$P/ca.crt --cert=$P/server.crt --key=$P/server.key --command-timeout=20s"
$EC snapshot save $D/etcd-backup.db >/dev/null 2>&1 || fail "6/snapshot save"
sudo chmod 600 $D/etcd-backup.db
rev=$(sudo etcdutl snapshot status $D/etcd-backup.db -w json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["revision"])') || fail "6/snapshot status"
mem=$($EC member list -w json 2>/dev/null) || fail "6/member list"
put q6-rev "$rev"
put q6-member "$(printf '%s' "$mem" | python3 -c 'import json,sys; print("%x" % json.load(sys.stdin)["members"][0]["ID"])')"
put q6-name "$(printf '%s' "$mem" | python3 -c 'import json,sys; print(json.load(sys.stdin)["members"][0]["name"])')"
put q6-peer "$(printf '%s' "$mem" | python3 -c 'import json,sys; print(json.load(sys.stdin)["members"][0]["peerURLs"][0])')"

# 7. Mốc chấm.
put q5-store "store-$t5s"
put q5-cache "cache-$t5c"
put q7-last "importer: loading chunk $t7-20mb"
put q7-token "importer $t7"
put q8-target "bucket-$t8"
put q9-v1 "web-v1-$t9a"
put q9-v2 "web-v2-$t9b"
put q10-base "$(cd $D/kustomize/base && sha256sum kustomization.yaml deployment.yaml service.yaml)"
put q11-token "orders-$t11"
put q12-token "report 2026-10 $t12"
put q12-uid "$(k get pv m2-archive -o jsonpath='{.metadata.uid}')"
put q13-system "$(k get priorityclass -o json | python3 -c '
import json, sys
print("\n".join(sorted(p["metadata"]["name"] for p in json.load(sys.stdin)["items"] if p.get("value", 0) >= 1000000000)))')"
put q14-token "$t14"
put q15-hash "$(openssl x509 -pubkey -noout -in /etc/kubernetes/pki/ca.crt | openssl pkey -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //')"
put q15-endpoint "$(k config view --minify -o jsonpath='{.clusters[0].cluster.server}' | sed 's#^https://##')"
put q15-stale "$stale"
exit 0
