# st9-multi trên cka-cp (user ubuntu, sudo; kubectl, openssl, python3). Gọi bởi run.sh cùng thư mục; chú thích ở đó.
# Không in gì khi thành công; lỗi đầu vào thì một dòng `lab: …` ra stderr và trả 1 trước khi gây gì. Không đụng namespace shop,
# release shop, etcd hay PV postgres.
set -e
H=/root/.lab/st9-multi
NS=s51-batch
k() { kubectl --request-timeout=10s "$@"; }
miss() { echo "lab: $1; thử: ./labs/lab restore cka s50" >&2; exit 1; }
fail() { echo "lab: không gây được sự cố st9-multi (bước $1); chạy lại ./labs/lab begin cka s51, vẫn lỗi thì ./labs/lab restore cka s50" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
nodes_ok() { [ "$(k get node -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' 2>/dev/null | grep -c '^True$')" = 3 ]; }

# 0. Đầu vào: apiserver và ba node Ready (cuối s50).
until_t 180 readyz || miss "apiserver chưa /readyz sau 3 phút"
until_t 120 nodes_ok || miss "chưa đủ ba node Ready"
sudo install -d -m 700 $H
sudo install -d -m 755 -o "$(id -u)" -g "$(id -g)" /opt/answers

# 1. Về bản tốt: gỡ taint `maintenance` và nhãn của sự cố trên mọi node, xoá cả namespace s51-batch (mọi thứ trong đó do sự
# cố tạo; bản sửa của lần trước không giữ lại), chờ xoá xong.
for n in cka-cp cka-w1 cka-w2; do
  k taint node $n maintenance- >/dev/null 2>&1 || true
  k label node $n disk- >/dev/null 2>&1 || true
  [ $n = cka-w2 ] || k label node $n disktype- >/dev/null 2>&1 || true
done
if k get ns $NS >/dev/null 2>&1; then
  k delete ns $NS --wait=false >/dev/null
  gone() { ! k get ns $NS >/dev/null 2>&1; }
  until_t 180 gone || fail 1
fi

# 2. Dựng lại: cka-w2 mang nhãn disktype=ssd (indexer cần ổ SSD); namespace s51-batch gồm Pod ngốn CPU cruncher-<hex> (limits
# 300m), Pod ingest hai container (app ghi INFO, shipper ghi ERROR, mỗi container bốn dòng mang mã ngẫu nhiên rồi nằm yên),
# report (busybox httpd + CGI gọi gateway.shop:8080/api/products) sau Service report-svc, hai NetworkPolicy.
k label node cka-w2 disktype=ssd --overwrite >/dev/null
tok=$(openssl rand -hex 3)
crunch=cruncher-$(openssl rand -hex 2)
k apply -f - >/dev/null <<EOF || fail 2
apiVersion: v1
kind: Namespace
metadata: {name: $NS}
---
apiVersion: v1
kind: Pod
metadata: {name: $crunch, namespace: $NS, labels: {app: cruncher}}
spec:
  terminationGracePeriodSeconds: 0
  containers:
  - name: burn
    image: busybox:1.37
    command: ["sh", "-c", "while :; do :; done"]
    resources: {requests: {cpu: 50m, memory: 16Mi}, limits: {cpu: 300m, memory: 32Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: ingest, namespace: $NS, labels: {app: ingest}}
spec:
  terminationGracePeriodSeconds: 0
  containers:
  - name: app
    image: busybox:1.37
    env: [{name: T, value: "$tok"}]
    command: ["sh", "-c", "for i in 1 2 3 4; do echo \"INFO ingest batch=\$T-0\$i accepted records=\${i}20\"; done; while :; do sleep 3600; done"]
    resources: {requests: {cpu: 10m, memory: 16Mi}, limits: {cpu: 50m, memory: 32Mi}}
  - name: shipper
    image: busybox:1.37
    env: [{name: T, value: "$tok"}]
    command: ["sh", "-c", "for i in 1 2 3 4; do echo \"ERROR shipper batch=\$T-0\$i upload to s3://archive-\$T failed: 403 Forbidden\"; done; while :; do sleep 3600; done"]
    resources: {requests: {cpu: 10m, memory: 16Mi}, limits: {cpu: 50m, memory: 32Mi}}
---
apiVersion: v1
kind: ConfigMap
metadata: {name: report-cgi, namespace: $NS}
data:
  products: |
    #!/bin/sh
    # report: lấy danh sách sản phẩm của catalog qua gateway.shop (policy của catalog chỉ nhận từ gateway, order trong shop).
    if body=\$(wget -qO- -T 5 http://gateway.shop:8080/api/products 2>&1); then
      printf 'Status: 200 OK\r\nContent-Type: application/json\r\n\r\n%s\n' "\$body"
    else
      printf 'Status: 502 Bad Gateway\r\nContent-Type: text/plain\r\n\r\nreport: %s\n' "\$body"
    fi
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: report, namespace: $NS}
spec:
  replicas: 1
  selector: {matchLabels: {app: report}}
  template:
    metadata: {labels: {app: report}}
    spec:
      terminationGracePeriodSeconds: 0
      containers:
      - name: report
        image: busybox:1.37
        command: ["httpd", "-f", "-v", "-p", "8080", "-h", "/www"]
        ports: [{name: http, containerPort: 8080}]
        volumeMounts: [{name: cgi, mountPath: /www/cgi-bin}]
        resources: {requests: {cpu: 10m, memory: 16Mi}, limits: {cpu: 50m, memory: 32Mi}}
      volumes: [{name: cgi, configMap: {name: report-cgi, defaultMode: 0755}}]
---
apiVersion: v1
kind: Service
metadata: {name: report-svc, namespace: $NS}
spec:
  selector: {app: report}
  ports: [{name: http, port: 8080, targetPort: 8081}]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: default-deny, namespace: $NS}
spec: {podSelector: {}, policyTypes: [Ingress, Egress]}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: report, namespace: $NS}
spec:
  podSelector: {matchLabels: {app: report}}
  policyTypes: [Ingress, Egress]
  ingress: [{ports: [{port: 8080, protocol: TCP}]}]
  egress:
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: shop}}, podSelector: {matchLabels: {app: gateway}}}]
    ports: [{port: 8080, protocol: TCP}]
EOF
up() { [ "$(k -n $NS get pod $crunch ingest -o jsonpath='{range .items[*]}{.status.phase}{"\n"}{end}' 2>/dev/null | grep -c '^Running$')" = 2 ] &&
  [ "$(k -n $NS get deploy report -o jsonpath='{.status.availableReplicas}' 2>/dev/null)" = 1 ]; }
until_t 120 up || fail 3
lines() { [ "$(k -n $NS logs ingest -c shipper 2>/dev/null | grep -c .)" = 4 ] && [ "$(k -n $NS logs ingest -c app 2>/dev/null | grep -c .)" = 4 ]; }
until_t 60 lines || fail 3

# 3. cka-w2 bị gắn taint lạ maintenance=planned:NoSchedule (Pod đang chạy không bị đuổi); indexer có nodeSelector sai khoá
# (disk: ssd, nhãn thật là disktype=ssd): Pending, FailedScheduling.
k taint node cka-w2 maintenance=planned:NoSchedule --overwrite >/dev/null
k -n $NS apply -f - >/dev/null <<EOF || fail 4
apiVersion: apps/v1
kind: Deployment
metadata: {name: indexer, namespace: $NS}
spec:
  replicas: 1
  selector: {matchLabels: {app: indexer}}
  template:
    metadata: {labels: {app: indexer}}
    spec:
      terminationGracePeriodSeconds: 0
      nodeSelector: {disk: ssd}
      containers:
      - name: indexer
        image: busybox:1.37
        command: ["sh", "-c", "echo indexer: lập chỉ mục trên ổ SSD; while :; do sleep 3600; done"]
        resources: {requests: {cpu: 10m, memory: 16Mi}, limits: {cpu: 50m, memory: 32Mi}}
EOF
reason() { local p; p=$(k -n $NS get pod -l app=indexer -o jsonpath='{.items[0].metadata.name}' 2>/dev/null) && [ -n "$p" ] &&
  r=$(k -n $NS get events --field-selector "involvedObject.name=$p,type=Warning" --sort-by=.lastTimestamp \
    -o jsonpath='{.items[-1:].reason}' 2>/dev/null) && [ -n "$r" ]; }
until_t 90 reason || fail 5

# 4. Mốc (verify chấm theo sự thật lúc sự cố, không theo chuỗi đoán được): Pod ngốn CPU, reason của Event cảnh báo mới nhất
# của indexer, các dòng log của hai container ingest, spec container của indexer, spec default-deny, lúc gây.
d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
echo "$NS/$crunch" > "$d/top"
echo "$r" > "$d/reason"
k -n $NS logs ingest -c shipper > "$d/shipper.log"
k -n $NS logs ingest -c app > "$d/app.log"
k -n $NS get deploy indexer -o jsonpath='{.spec.template.spec.containers}' > "$d/indexer.json"
k -n $NS get netpol default-deny -o jsonpath='{.spec}' > "$d/default-deny.json"
date +%s > "$d/started"
for f in top reason shipper.log app.log indexer.json default-deny.json started; do sudo install -m 644 -o root -g root "$d/$f" $H/$f; done
