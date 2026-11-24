# m1 — dọn lần làm trước rồi dựng đề trên cka-cp (user ubuntu, sudo; kubectl, openssl, python3). Gọi bởi setup.sh (cùng đề)
# hai lần:
#   PHASE=main   sau khi lõi đã khoẻ và kubelet của cka-w1 đã về bản tốt: dọn rồi dựng mọi câu trừ Pod của q12. Bên gửi đặt
#                CRI_W2 (containerRuntimeEndpoint trong /var/lib/kubelet/config.yaml của cka-w2) và CNI_W2 (tệp đầu tiên
#                theo thứ tự tên trong /etc/cni/net.d/ của cka-w2) — đáp án của q15 đọc thật từ node.
#   PHASE=after  sau khi node.sh đã đổi clusterDNS của kubelet cka-w1 thành DNS_BAD: tạo Deployment dns-probe (ghim cka-w1) và
#                dns-probe-w2 (cùng spec, ghim cka-w2, để so) trong m1-q12, chờ Pod của dns-probe chạy với nameserver DNS_BAD.
# Không in gì khi thành công (không lộ đề hay lời giải); lỗi thì một dòng `lab: …` ra stderr và trả 1.
#
# Dọn (chỉ đồ của m1, không đụng m2-*, shop, s51-batch, etcd hay PV postgres):
#   namespace m1-* (chờ xoá xong); StorageClass m1-fast; PV tên m1-* hay storageClassName m1-fast/m1-manual hay claimRef trong
#   m1-*; Corefile của CoreDNS về bản tốt /root/.lab/m1/Corefile (lưu ở lần dựng đầu tiên, khi Corefile chưa có `m1.lab`);
#   /opt/m1 và /var/lib/etcd-m1 (thư mục restore mà q6 chỉ được viết lệnh, không được chạy; xoá khi etcd không dùng nó).
# Dựng (mỗi câu một namespace m1-qN; Pod busybox:1.37 có sẵn trên node, requests 5m/8Mi, limits ≤ 64Mi trừ Pod ngốn CPU):
#   q1  m1-q1 trống.                               q2  m1-q2: Deployment web (httpd, không có requests cpu).
#   q3  m1-q3 trống.                               q4  m1-q4: Pod cache-<hex> (ngốn CPU, limits 150m), Pod cpu-burner
#       (mồi, limits 40m), Pod ingest (container parser + app, mỗi cái ghi INFO/WARN/ERROR mang mã ngẫu nhiên); ba Pod ghim
#       cka-w2 (Pod lẻ: node hỏng thì mất hẳn bằng chứng).
#   q5  m1-q5: Deployment api (httpd 8080) + Service api, client (app=client), other (app=other).
#   q6  m1-q6: ConfigMap marker (resourceVersion lúc dựng = mốc revision etcd).
#   q7  m1-q7: Deployment shopfront: 1–3 revision mồi (VERSION=v0.N), v1, v2 (chờ xong), rồi v3 hỏng (CrashLoop; v2 vẫn phục vụ).
#   q8  m1-q8: Deployment web (image busybox:1.73 không có, readinessProbe cổng 8081 sai) + ConfigMap web-page + Service web.
#   q9  m1-q9: Deployment echo (httpd 8080) + Gateway m1-gw (GatewayClass nginx của s30, listener HTTP 8080 echo.m1.lab).
#   q10 /opt/m1/charts/notice (chart Helm nhỏ).     q11 PV m1-old (64Mi, Delete, m1-manual, Available); m1-q11 trống.
#   q13 m1-q13 trống.                              q14 m1-q14: Deployment backend + Service backend, dns-client (app=client,
#       ghim cka-w2: Pod mới trên cka-w1 không phân giải được tên cho tới khi q12 được sửa).
#   q16 m1-q16: Deployment worker (requests cpu 3 → Pending; envFrom ConfigMap worker-config chưa có).
#   q12 m1-q12 (PHASE=after): dns-probe, dns-probe-w2 (readinessProbe = nslookup kubernetes.default: Pod trên cka-w1 không Ready).
# Mốc ở /root/.lab/m1/ (root, 700): q4-top, q4-errors, q5-token, q6-rv, q7-rev, q8-token, q9-token, q15-crds, q15-subject,
# q15-cri, q15-cni, Corefile (bản tốt); bản tốt config.yaml của kubelet ở /root/.lab/m1/ trên cka-w1. /opt/m1/started và
# /root/.lab/m1/started do setup.sh ghi sau cùng.
set -e
H=/root/.lab/m1
D=/opt/m1
k() { kubectl --request-timeout=15s "$@"; }
fail() { echo "lab: không dựng được đề m1 (bước $1); chạy lại ./labs/lab mock cka m1 start, vẫn lỗi thì ./labs/lab restore cka s51" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
put() { printf '%s\n' "$2" | sudo tee "$H/$1" >/dev/null; }
sudo install -d -m 700 $H

if [ "$PHASE" = after ]; then
  [ -n "$DNS_BAD" ] || fail "after/DNS_BAD"
  P='{requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}'
  for n in dns-probe dns-probe-w2; do
    node=cka-w1; [ $n = dns-probe ] || node=cka-w2
    k apply -f - >/dev/null <<EOF || fail "after/$n"
apiVersion: v1
kind: Namespace
metadata: {name: m1-q12}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: $n, namespace: m1-q12}
spec:
  replicas: 1
  selector: {matchLabels: {app: $n}}
  template:
    metadata: {labels: {app: $n}}
    spec:
      terminationGracePeriodSeconds: 0
      nodeSelector: {kubernetes.io/hostname: $node}
      containers:
      - name: probe
        image: busybox:1.37
        command: ["sh", "-c", "while :; do nslookup kubernetes.default.svc.cluster.local >/dev/null 2>&1 && echo 'dns ok' || echo 'dns FAIL: kubernetes.default.svc.cluster.local'; sleep 15; done"]
        readinessProbe: {exec: {command: [nslookup, kubernetes.default.svc.cluster.local]}, periodSeconds: 10, timeoutSeconds: 5}
        resources: $P
EOF
  done
  bad_ns() {
    pod=$(k -n m1-q12 get pod -l app=dns-probe -o jsonpath='{.items[0].metadata.name}' 2>/dev/null) && [ -n "$pod" ] &&
      k -n m1-q12 exec "$pod" -- cat /etc/resolv.conf 2>/dev/null | grep -q "^nameserver $DNS_BAD\$"
  }
  until_t 120 bad_ns || fail "after/dns-probe chưa chạy với nameserver mới của kubelet cka-w1"
  exit 0
fi

# 1. Dọn lần làm trước.
# Pod của người học thường không có terminationGracePeriodSeconds: 0 (sleep/tail bỏ qua SIGTERM, 30 giây mỗi Pod) và PVC chờ
# Pod đi hết (pvc-protection): xoá Pod ngay trước, rồi mới xoá namespace.
for ns in $(k get ns -o name | sed -n 's#^namespace/\(m1-q[0-9]*\)$#\1#p'); do
  k -n "$ns" delete pod --all --grace-period=0 --force --wait=false >/dev/null 2>&1 || true
  k delete ns "$ns" --wait=false >/dev/null
done
gone() { [ -z "$(k get ns -o name | grep '^namespace/m1-q')" ]; }
until_t 300 gone || fail "1/xoá namespace m1-*"
k delete sc m1-fast --ignore-not-found >/dev/null
for pv in $(k get pv -o json | python3 -c '
import json, sys
for p in json.load(sys.stdin)["items"]:
    n, s = p["metadata"]["name"], p["spec"]
    if n.startswith("m1-") or s.get("storageClassName") in ("m1-fast", "m1-manual") or (s.get("claimRef") or {}).get("namespace", "").startswith("m1-"):
        print(n)'); do k delete pv "$pv" --wait=false >/dev/null; done
# Corefile so và lưu đúng từng byte (python), để buổi so Corefile với bản tốt của nó (s47) không đỏ vì một dòng trống.
cm_corefile() { k -n kube-system get cm coredns -o json | python3 -c 'import json,sys; sys.stdout.write(json.load(sys.stdin)["data"]["Corefile"])'; }
cf="$(cm_corefile; echo x)" || fail "1/đọc Corefile"; cf="${cf%x}"
if sudo test -s $H/Corefile; then
  good="$(sudo cat $H/Corefile; echo x)"; good="${good%x}"
  if [ "$cf" != "$good" ]; then
    printf '%s' "$good" | python3 -c 'import json,sys; print(json.dumps({"data": {"Corefile": sys.stdin.read()}}))' > /tmp/m1-corefile.json
    k -n kube-system patch cm coredns --type merge --patch-file /tmp/m1-corefile.json >/dev/null || fail "1/Corefile"
    rm -f /tmp/m1-corefile.json
  fi
else
  case "$cf" in *m1.lab*|'') fail "1/Corefile đã có m1.lab mà chưa có bản tốt" ;; esac
  printf '%s' "$cf" | sudo tee $H/Corefile >/dev/null
fi
sudo rm -rf $D
if ! sudo grep -q 'etcd-m1' /etc/kubernetes/manifests/etcd.yaml; then sudo rm -rf /var/lib/etcd-m1; fi

# 2. Thư mục đáp án và chart của q10.
sudo install -d -m 755 -o "$(id -u)" -g "$(id -g)" $D $D/charts $D/charts/notice $D/charts/notice/templates
cat > $D/charts/notice/Chart.yaml <<'EOF'
apiVersion: v2
name: notice
description: Trang thông báo nhỏ (busybox httpd) cho đề mock m1
type: application
version: 0.3.0
appVersion: "1.37"
EOF
cat > $D/charts/notice/values.yaml <<'EOF'
replicaCount: 1
image:
  repository: busybox
  tag: "1.37"
message: hello
service:
  type: ClusterIP
  port: 80
resources:
  requests: {cpu: 5m, memory: 8Mi}
  limits: {memory: 32Mi}
EOF
cat > $D/charts/notice/templates/configmap.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-page
  labels: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
data:
  index.html: |
    {{ .Values.message }}
EOF
cat > $D/charts/notice/templates/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
  template:
    metadata:
      labels: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: httpd
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: IfNotPresent
        command: ["httpd", "-f", "-p", "8080", "-h", "/www"]
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {httpGet: {path: /, port: http}, periodSeconds: 5}
        resources: {{- toYaml .Values.resources | nindent 10 }}
        volumeMounts: [{name: page, mountPath: /www}]
      volumes:
      - name: page
        configMap: {name: {{ .Release.Name }}-page}
EOF
cat > $D/charts/notice/templates/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
  labels: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
spec:
  type: {{ .Values.service.type }}
  selector: {app.kubernetes.io/name: notice, app.kubernetes.io/instance: {{ .Release.Name }}}
  ports:
  - {name: http, port: {{ .Values.service.port }}, targetPort: http}
EOF

# 3. Đối tượng của các câu. Mã ngẫu nhiên mỗi lần dựng (đáp án không đoán được, không chép được từ lần trước).
hog=cache-$(openssl rand -hex 2)
t4=$(openssl rand -hex 3); t8=$(openssl rand -hex 4); t9=$(openssl rand -hex 4); t5=$(openssl rand -hex 3)
R='{requests: {cpu: 5m, memory: 8Mi}, limits: {memory: 32Mi}}'
HTTPD='mkdir -p /www && echo "$PAGE" > /www/index.html && exec httpd -f -p 8080 -h /www'
k apply -f - >/dev/null <<EOF || fail "3/apply"
apiVersion: v1
kind: Namespace
metadata: {name: m1-q1}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q2}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: web, namespace: m1-q2}
spec:
  replicas: 1
  selector: {matchLabels: {app: web}}
  template:
    metadata: {labels: {app: web}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: web
        image: busybox:1.37
        env: [{name: PAGE, value: "m1-q2 web"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q3}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q4}
---
apiVersion: v1
kind: Pod
metadata: {name: $hog, namespace: m1-q4, labels: {app: cache}}
spec:
  terminationGracePeriodSeconds: 0
  nodeSelector: {kubernetes.io/hostname: cka-w2}
  containers:
  - name: warm
    image: busybox:1.37
    command: ["sh", "-c", "while :; do :; done"]
    resources: {requests: {cpu: 20m, memory: 8Mi}, limits: {cpu: 150m, memory: 16Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: cpu-burner, namespace: m1-q4, labels: {app: burner}}
spec:
  terminationGracePeriodSeconds: 0
  nodeSelector: {kubernetes.io/hostname: cka-w2}
  containers:
  - name: burn
    image: busybox:1.37
    command: ["sh", "-c", "while :; do :; done"]
    resources: {requests: {cpu: 5m, memory: 8Mi}, limits: {cpu: 40m, memory: 16Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: ingest, namespace: m1-q4, labels: {app: ingest}}
spec:
  terminationGracePeriodSeconds: 0
  nodeSelector: {kubernetes.io/hostname: cka-w2}
  containers:
  - name: app
    image: busybox:1.37
    env: [{name: T, value: "$t4"}]
    command: ["sh", "-c", 'echo "INFO app start batch=\$T"; echo "ERROR app cache miss batch=\$T-a"; echo "INFO app ready"; while :; do sleep 3600; done']
    resources: $R
  - name: parser
    image: busybox:1.37
    env: [{name: T, value: "$t4"}]
    command: ["sh", "-c", 'for i in 1 2 3; do echo "INFO parser batch=\$T-\$i rows=\${i}00"; echo "WARN parser batch=\$T-\$i slow disk"; echo "ERROR parser batch=\$T-\$i bad record at line \${i}7"; done; echo "INFO parser done"; while :; do sleep 3600; done']
    resources: $R
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q5}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: api, namespace: m1-q5}
spec:
  replicas: 1
  selector: {matchLabels: {app: api}}
  template:
    metadata: {labels: {app: api}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: api
        image: busybox:1.37
        env: [{name: PAGE, value: "api-$t5"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: api, namespace: m1-q5}
spec:
  selector: {app: api}
  ports: [{port: 8080, targetPort: 8080}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: client, namespace: m1-q5}
spec:
  replicas: 1
  selector: {matchLabels: {app: client}}
  template:
    metadata: {labels: {app: client}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: ["sh", "-c", "while :; do sleep 3600; done"], resources: $R}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: other, namespace: m1-q5}
spec:
  replicas: 1
  selector: {matchLabels: {app: other}}
  template:
    metadata: {labels: {app: other}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - {name: sh, image: busybox:1.37, command: ["sh", "-c", "while :; do sleep 3600; done"], resources: $R}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q6}
---
apiVersion: v1
kind: ConfigMap
metadata: {name: marker, namespace: m1-q6}
data: {token: "$(openssl rand -hex 6)"}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q7}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: shopfront, namespace: m1-q7}
spec:
  replicas: 2
  revisionHistoryLimit: 10
  strategy: {type: RollingUpdate, rollingUpdate: {maxSurge: 1, maxUnavailable: 0}}
  selector: {matchLabels: {app: shopfront}}
  template:
    metadata: {labels: {app: shopfront}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: web
        image: busybox:1.37
        env: [{name: VERSION, value: "v0.1"}]
        command: ["sh", "-c", 'mkdir -p /www && echo "\$VERSION" > /www/index.html && exec httpd -f -p 8080 -h /www']
        ports: [{containerPort: 8080}]
        readinessProbe: {httpGet: {path: /, port: 8080}, periodSeconds: 3}
        resources: $R
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q8}
---
apiVersion: v1
kind: ConfigMap
metadata: {name: web-page, namespace: m1-q8}
data: {index.html: "m1-q8 $t8"}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: web, namespace: m1-q8}
spec:
  replicas: 2
  selector: {matchLabels: {app: web}}
  template:
    metadata: {labels: {app: web}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: httpd
        image: busybox:1.73
        command: ["httpd", "-f", "-p", "8080", "-h", "/www"]
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {httpGet: {path: /, port: 8081}, periodSeconds: 5}
        volumeMounts: [{name: page, mountPath: /www}]
        resources: $R
      volumes: [{name: page, configMap: {name: web-page}}]
---
apiVersion: v1
kind: Service
metadata: {name: web, namespace: m1-q8}
spec:
  selector: {app: web}
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q9}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: echo, namespace: m1-q9}
spec:
  replicas: 1
  selector: {matchLabels: {app: echo}}
  template:
    metadata: {labels: {app: echo}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: echo
        image: busybox:1.37
        env: [{name: PAGE, value: "echo-$t9"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{name: http, containerPort: 8080}]
        readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}
        resources: $R
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: {name: m1-gw, namespace: m1-q9}
spec:
  gatewayClassName: nginx
  listeners:
  - {name: http, protocol: HTTP, port: 8080, hostname: echo.m1.lab}
---
apiVersion: v1
kind: PersistentVolume
metadata: {name: m1-old}
spec:
  capacity: {storage: 64Mi}
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Delete
  storageClassName: m1-manual
  hostPath: {path: /tmp/m1-old, type: DirectoryOrCreate}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q11}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q13}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q14}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: backend, namespace: m1-q14}
spec:
  replicas: 1
  selector: {matchLabels: {app: backend}}
  template:
    metadata: {labels: {app: backend}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: backend
        image: busybox:1.37
        env: [{name: PAGE, value: "legacy backend"}]
        command: ["sh", "-c", '$HTTPD']
        ports: [{containerPort: 8080}]
        resources: $R
---
apiVersion: v1
kind: Service
metadata: {name: backend, namespace: m1-q14}
spec:
  selector: {app: backend}
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: dns-client, namespace: m1-q14}
spec:
  replicas: 1
  selector: {matchLabels: {app: client}}
  template:
    metadata: {labels: {app: client}}
    spec:
      terminationGracePeriodSeconds: 0
      nodeSelector: {kubernetes.io/hostname: cka-w2}
      containers:
      - {name: sh, image: busybox:1.37, command: ["sh", "-c", "while :; do sleep 3600; done"], resources: $R}
---
apiVersion: v1
kind: Namespace
metadata: {name: m1-q16}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: worker, namespace: m1-q16}
spec:
  replicas: 2
  selector: {matchLabels: {app: worker}}
  template:
    metadata: {labels: {app: worker}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: worker
        image: busybox:1.37
        command: ["sh", "-c", 'echo "worker mode=\$MODE"; while :; do sleep 3600; done']
        envFrom: [{configMapRef: {name: worker-config}}]
        resources: {requests: {cpu: "3", memory: 16Mi}, limits: {memory: 32Mi}}
EOF

# 4. q7: revision mồi rồi v1, v2 (chờ xong), v3 hỏng. Số revision của v1 đổi theo số mồi (1–3).
n=$(( $(od -An -N1 -tu1 /dev/urandom | tr -d ' ') % 3 + 1 ))
# Mỗi lần đổi chờ controller xử lý (observedGeneration = generation) để mỗi bản có ReplicaSet và revision riêng.
gen_ok() { [ "$(k -n m1-q7 get deploy shopfront -o jsonpath='{.metadata.generation} {.status.observedGeneration}' | awk '{print ($1==$2)}')" = 1 ]; }
setv() { k -n m1-q7 set env deploy/shopfront VERSION=$1 >/dev/null && until_t 60 gen_ok; }
until_t 60 gen_ok || fail "4/shopfront"
i=2; while [ $i -le $n ]; do setv v0.$i || fail "4/shopfront v0.$i"; i=$((i+1)); done
setv v1 || fail "4/shopfront v1"
setv v2 || fail "4/shopfront v2"
k -n m1-q7 rollout status deploy/shopfront --timeout=180s >/dev/null || fail "4/shopfront v2"
k -n m1-q7 patch deploy shopfront --type json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/env/0/value","value":"v3"},{"op":"replace","path":"/spec/template/spec/containers/0/command","value":["sh","-c","echo \"$VERSION\" > /www/index.html && exec httpd -f -p 8080 -h /www"]}]' >/dev/null
rev1=$(k -n m1-q7 get rs -l app=shopfront -o json | python3 -c '
import json, sys
for r in json.load(sys.stdin)["items"]:
    env = r["spec"]["template"]["spec"]["containers"][0].get("env") or []
    if any(e.get("name") == "VERSION" and e.get("value") == "v1" for e in env):
        print(r["metadata"]["annotations"]["deployment.kubernetes.io/revision"])')
[ "$rev1" = "$((n+1))" ] || fail "4/revision v1 ($rev1)"

# 5. Mốc chấm.
put q7-rev "$rev1"
put q4-top "$hog"
put q8-token "m1-q8 $t8"
put q9-token "echo-$t9"
put q5-token "api-$t5"
rv=$(k -n m1-q6 get cm marker -o jsonpath='{.metadata.resourceVersion}'); case "$rv" in ''|*[!0-9]*) fail "5/marker" ;; esac
put q6-rv "$rv"
logs_ok() { out=$(k -n m1-q4 logs ingest -c parser 2>/dev/null) && printf '%s\n' "$out" | grep -q 'INFO parser done'; }
until_t 150 logs_ok || fail "5/log ingest"
put q4-errors "$(printf '%s\n' "$out" | grep ERROR)"
k get crd -o name | sed -n 's#^customresourcedefinition.apiextensions.k8s.io/\(.*cert-manager\.io\)$#\1#p' | sort > /tmp/m1-crds
[ -s /tmp/m1-crds ] || fail "5/CRD cert-manager"
sudo cp /tmp/m1-crds $H/q15-crds; rm -f /tmp/m1-crds
k get crd certificates.cert-manager.io -o json | python3 -c '
import json, sys
c = json.load(sys.stdin)
v = next(x for x in c["spec"]["versions"] if x.get("storage"))
print("\n".join(sorted(v["schema"]["openAPIV3Schema"]["properties"]["spec"]["properties"]["subject"]["properties"])))' > /tmp/m1-subj || fail "5/schema Certificate"
sudo cp /tmp/m1-subj $H/q15-subject; rm -f /tmp/m1-subj
[ -n "$CRI_W2" ] && [ -n "$CNI_W2" ] || fail "5/CRI, CNI của cka-w2"
put q15-cri "$CRI_W2"
put q15-cni "$CNI_W2"
exit 0
