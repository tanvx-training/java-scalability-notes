# ⚡ CKA Cheat Sheet — Quản Trị Cluster

> Bổ sung cho **CKAD-Cheat-Sheet.md** (Pods, Deployments, Services, ConfigMap/Secret, PV/PVC, RBAC, Helm, Kustomize... vẫn dùng chung). File này chỉ chứa phần **riêng của CKA**: cluster admin, etcd, upgrade, node ops, troubleshooting.

---

## Mục Lục
1. [Kiến trúc & vị trí file quan trọng](#1-kiến-trúc--vị-trí-file-quan-trọng)
2. [kubeadm — cài đặt cluster](#2-kubeadm--cài-đặt-cluster)
3. [etcd Backup & Restore](#3-etcd-backup--restore-)
4. [Cluster Upgrade](#4-cluster-upgrade-kubeadm-)
5. [Node Operations](#5-node-operations-draincordon)
6. [Scheduling nâng cao](#6-scheduling-nâng-cao)
7. [Static Pods](#7-static-pods)
8. [Users & Certificates (CSR)](#8-users--certificates-csr)
9. [Kubeconfig](#9-kubeconfig)
10. [StorageClass & Dynamic Provisioning](#10-storageclass--dynamic-provisioning)
11. [DNS / CoreDNS / CNI](#11-dns--coredns--cni)
12. [Gateway API](#12-gateway-api)
13. [Troubleshooting](#13-troubleshooting-)
14. [DaemonSets & HPA](#14-daemonsets--hpa)

---

## 1. Kiến Trúc & Vị Trí File Quan Trọng

### Đường dẫn phải thuộc lòng
```
/etc/kubernetes/manifests/          # static pod manifests (apiserver, etcd, scheduler, controller-manager)
/etc/kubernetes/pki/                # certificates của cluster
/etc/kubernetes/admin.conf          # kubeconfig của admin
/etc/kubernetes/kubelet.conf        # kubeconfig của kubelet
/var/lib/kubelet/config.yaml        # config của kubelet
/var/lib/etcd/                      # data của etcd (mặc định)
/etc/cni/net.d/                     # config CNI
/opt/cni/bin/                       # binary CNI plugins
/var/log/pods/                      # log pods trên node (khi kubectl chết)
```

### Ports mặc định
| Thành phần | Port |
|---|---|
| kube-apiserver | 6443 |
| etcd | 2379 (client), 2380 (peer) |
| kubelet | 10250 |
| kube-scheduler | 10259 |
| kube-controller-manager | 10257 |
| NodePort range | 30000–32767 |

### Xem thành phần control plane
```bash
k get pods -n kube-system
k get pods -n kube-system -o wide          # pod nào ở node nào
ps aux | grep kube-apiserver               # xem flags đang chạy
```

---

## 2. kubeadm — Cài Đặt Cluster

```bash
# Trên control plane:
kubeadm init --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<IP-master>

# Sau init — cấu hình kubectl cho user:
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Cài CNI (ví dụ Flannel) — node sẽ NotReady cho đến khi có CNI:
k apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Trên worker — join vào cluster:
kubeadm join <IP-master>:6443 --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>

# Quên token? In lại lệnh join từ master:
kubeadm token create --print-join-command
kubeadm token list

# Khác:
kubeadm reset                    # gỡ node khỏi cluster (chạy trên node đó)
kubeadm certs check-expiration   # kiểm tra hạn certificate
kubeadm certs renew all          # gia hạn certs
```

---

## 3. etcd Backup & Restore ⭐

> Câu "quốc dân" của CKA. Học thuộc lòng. Tìm cert paths trong `/etc/kubernetes/manifests/etcd.yaml` (hoặc `ps aux | grep etcd`).

### Backup
```bash
ETCDCTL_API=3 etcdctl snapshot save /opt/backup/etcd.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Kiểm tra snapshot:
ETCDCTL_API=3 etcdctl snapshot status /opt/backup/etcd.db --write-out=table
# (bản etcdctl mới dùng: etcdutl snapshot status)
```

### Restore
```bash
# 1. Restore snapshot ra data-dir MỚI:
ETCDCTL_API=3 etcdctl snapshot restore /opt/backup/etcd.db \
  --data-dir=/var/lib/etcd-restore
# (bản mới: etcdutl snapshot restore ... --data-dir=...)

# 2. Sửa etcd static pod trỏ sang data-dir mới:
vim /etc/kubernetes/manifests/etcd.yaml
#   Sửa volume hostPath:
#   volumes:
#   - hostPath:
#       path: /var/lib/etcd-restore     # ← đổi từ /var/lib/etcd
#     name: etcd-data

# 3. Chờ etcd + apiserver tự restart (30–60s), verify:
k get pods -A
watch crictl ps          # theo dõi container khởi động lại
```

> 📌 Mẹo: chỉ cần đổi `hostPath.path` của volume `etcd-data`; `--data-dir` trong command trỏ tới mountPath bên trong container nên thường không cần sửa.

---

## 4. Cluster Upgrade (kubeadm) ⭐

> Nguyên tắc: **control plane trước, worker sau; từng node một; drain trước khi upgrade kubelet.**

### Trên control plane
```bash
# 0. Xem version khả dụng
kubeadm upgrade plan

# 1. Upgrade kubeadm (Ubuntu/Debian — thay <ver> bằng vd 1.31.1-1.1)
apt-mark unhold kubeadm
apt-get update && apt-get install -y kubeadm=<ver>
apt-mark hold kubeadm

# 2. Apply upgrade control plane
kubeadm upgrade apply v1.31.1

# 3. Drain node control plane
k drain controlplane --ignore-daemonsets

# 4. Upgrade kubelet + kubectl
apt-mark unhold kubelet kubectl
apt-get install -y kubelet=<ver> kubectl=<ver>
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet

# 5. Uncordon
k uncordon controlplane
```

### Trên mỗi worker
```bash
# (Từ máy chính) drain worker:
k drain node01 --ignore-daemonsets --force

# (SSH vào worker):
apt-mark unhold kubeadm && apt-get install -y kubeadm=<ver> && apt-mark hold kubeadm
kubeadm upgrade node                  # ← worker dùng "upgrade node", KHÔNG phải "apply"
apt-mark unhold kubelet && apt-get install -y kubelet=<ver> && apt-mark hold kubelet
systemctl daemon-reload && systemctl restart kubelet
exit

# (Về máy chính):
k uncordon node01
k get nodes            # verify version
```

---

## 5. Node Operations (Drain/Cordon)

```bash
k cordon node01                # đánh dấu unschedulable (pod cũ VẪN chạy)
k drain node01                 # cordon + đuổi hết pod sang node khác
k drain node01 --ignore-daemonsets            # bỏ qua daemonset pods
k drain node01 --ignore-daemonsets --force    # đuổi cả pod "mồ côi" (không thuộc controller — pod này sẽ MẤT)
k drain node01 --delete-emptydir-data         # chấp nhận mất data emptyDir
k uncordon node01              # cho phép schedule lại
k get nodes                    # cột STATUS: Ready,SchedulingDisabled = đang cordon
```

---

## 6. Scheduling Nâng Cao

### Taints & Tolerations
```bash
k taint node node01 key1=value1:NoSchedule        # thêm taint
k taint node node01 key1=value1:NoSchedule-       # XÓA taint (dấu - cuối)
k describe node node01 | grep -i taint
# Control plane mặc định có taint: node-role.kubernetes.io/control-plane:NoSchedule
```
```yaml
# Pod toleration:
spec:
  tolerations:
  - key: "key1"
    operator: "Equal"        # Equal | Exists (Exists không cần value)
    value: "value1"
    effect: "NoSchedule"     # NoSchedule | PreferNoSchedule | NoExecute
```

### Node Affinity
```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:    # bắt buộc
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In            # In | NotIn | Exists | DoesNotExist | Gt | Lt
            values: ["ssd"]
      preferredDuringSchedulingIgnoredDuringExecution:   # ưu tiên
      - weight: 1
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values: ["az1"]
```

### Manual scheduling & label node
```bash
k label node node01 disktype=ssd
```
```yaml
spec:
  nodeName: node01          # gán thẳng node, BYPASS scheduler
  # hoặc:
  nodeSelector:
    disktype: ssd
```

---

## 7. Static Pods

```bash
# Kubelet tự chạy pod từ thư mục manifest (mặc định):
ls /etc/kubernetes/manifests/

# Xác nhận đường dẫn staticPodPath:
grep staticPodPath /var/lib/kubelet/config.yaml

# Tạo static pod: chỉ cần đặt file YAML vào thư mục đó
k run static-web --image=nginx $do > /etc/kubernetes/manifests/static-web.yaml

# Xóa static pod: XÓA FILE (kubectl delete sẽ bị tạo lại ngay)
rm /etc/kubernetes/manifests/static-web.yaml
```

> 📌 Nhận diện static pod: tên có hậu tố tên node (vd `etcd-controlplane`), ownerReference là **Node**. Muốn sửa static pod ở node khác → SSH vào node đó.

---

## 8. Users & Certificates (CSR)

### Quy trình tạo user mới (hay ra thi)
```bash
# 1. User tạo key + CSR:
openssl genrsa -out dev.key 2048
openssl req -new -key dev.key -subj "/CN=dev-user" -out dev.csr

# 2. Tạo CertificateSigningRequest (request phải base64 1 dòng):
cat <<EOF | k apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: dev-user
spec:
  request: $(cat dev.csr | base64 | tr -d '\n')
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400
  usages: ["client auth"]
EOF

# 3. Approve & lấy cert:
k get csr
k certificate approve dev-user
k get csr dev-user -o jsonpath='{.status.certificate}' | base64 -d > dev.crt

# 4. Cấp quyền:
k create role dev-role --verb=get,list --resource=pods
k create rolebinding dev-rb --role=dev-role --user=dev-user

# 5. (Tùy chọn) thêm vào kubeconfig:
k config set-credentials dev-user --client-key=dev.key --client-certificate=dev.crt
k config set-context dev-ctx --cluster=kubernetes --user=dev-user
k auth can-i list pods --as=dev-user      # verify
```

```bash
k certificate deny <csr-name>       # từ chối CSR
```

---

## 9. Kubeconfig

```bash
k config view                              # xem config hiện tại (ẩn cert)
k config view --raw                        # đầy đủ
k config get-contexts
k config use-context <ctx>
k config current-context
k config set-context --current --namespace=dev
KUBECONFIG=/path/custom.conf k get pods    # dùng file config khác
k --kubeconfig=/root/other.conf get nodes
```

Cấu trúc file:
```yaml
apiVersion: v1
kind: Config
clusters:          # danh sách cluster (server URL + CA)
- name: kubernetes
  cluster:
    server: https://172.30.1.2:6443
    certificate-authority-data: ...
users:             # danh sách user (cert/key hoặc token)
- name: admin
contexts:          # cặp (cluster, user, namespace)
- name: admin@kubernetes
  context:
    cluster: kubernetes
    user: admin
current-context: admin@kubernetes
```

> 🔧 Lỗi hay gặp trong đề troubleshooting: sai `server:` port (vd 6433 thay vì 6443) hoặc sai tên cluster/user trong context.

---

## 10. StorageClass & Dynamic Provisioning

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # đặt làm default
provisioner: kubernetes.io/no-provisioner   # local: không dynamic; cloud: vd ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer     # chờ pod dùng mới bind (tốt cho local/zonal)
reclaimPolicy: Delete                       # Delete | Retain
allowVolumeExpansion: true
```

```bash
k get sc
k get pvc      # PVC dùng SC có provisioner → PV tự sinh khi có consumer
```

> PVC Pending + SC `WaitForFirstConsumer` = bình thường, sẽ Bound khi có pod mount nó.

---

## 11. DNS / CoreDNS / CNI

### CoreDNS
```bash
k get pods -n kube-system -l k8s-app=kube-dns     # pod CoreDNS
k get svc -n kube-system kube-dns                 # service DNS (ClusterIP thường x.x.x.10)
k get cm coredns -n kube-system -o yaml           # Corefile config
k logs -n kube-system -l k8s-app=kube-dns

# Test DNS từ pod:
k run tmp --image=busybox:1.28 --rm -it --restart=Never -- nslookup kubernetes.default
# FQDN: <svc>.<ns>.svc.cluster.local ; Pod DNS: <ip-dashed>.<ns>.pod.cluster.local
```

### DNS config trong pod
```bash
k exec <pod> -- cat /etc/resolv.conf     # nameserver = ClusterIP của kube-dns
```

### CNI
```bash
ls /etc/cni/net.d/          # config — THIẾU file ở đây → node NotReady, pod ContainerCreating
ls /opt/cni/bin/            # binaries
k get pods -n kube-system   # pod CNI (flannel/calico/cilium) có chạy không
```

---

## 12. Gateway API

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
spec:
  gatewayClassName: nginx          # do controller cung cấp
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: Same                 # Same | All | Selector
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
spec:
  parentRefs:
  - name: my-gateway
  hostnames: ["app.example.com"]
  rules:
  - matches:
    - path:
        type: PathPrefix           # PathPrefix | Exact
        value: /login
    backendRefs:
    - name: web-svc
      port: 80
```

```bash
k get gatewayclass,gateway,httproute
k describe httproute web-route
```

---

## 13. Troubleshooting ⭐⭐

### Cây quyết định tổng quát
```
kubectl get nodes
 ├─ kubectl KHÔNG chạy được → kiểm tra kubeconfig (server/port), apiserver có sống không
 ├─ Node NotReady           → SSH vào node đó (xem 13.1)
 └─ Node Ready, app lỗi     → kubectl get pods → describe/logs (xem CKAD cheat sheet)
```

### 13.1. Node NotReady
```bash
ssh node01
systemctl status kubelet            # active? failed? inactive?
systemctl start kubelet             # nếu chỉ bị dừng
systemctl enable --now kubelet
journalctl -u kubelet -f            # đọc lỗi (hoặc: journalctl -u kubelet | tail -50)

# Nguyên nhân phổ biến từ log:
# - "failed to load Kubelet config file" → sai path /var/lib/kubelet/config.yaml
# - cert lỗi → kiểm tra /etc/kubernetes/kubelet.conf, đường dẫn cert trong config
# - "no CNI configuration" → thiếu /etc/cni/net.d/ → cài lại CNI
# - runtime lỗi → systemctl status containerd

# Sửa config kubelet xong:
systemctl daemon-reload && systemctl restart kubelet
```

### 13.2. Control plane / apiserver hỏng
```bash
# kubectl treo/từ chối kết nối → apiserver chết. Trên control plane:
crictl ps -a | grep apiserver              # container còn chạy?
crictl logs <container-id>                 # đọc lỗi
ls /var/log/pods/ | grep apiserver         # hoặc đọc log file

# Nguyên nhân phổ biến:
# - Static pod manifest bị sửa sai → vim /etc/kubernetes/manifests/kube-apiserver.yaml
#   (sai image tag, sai flag, sai đường dẫn cert, sai etcd endpoint)
# - etcd chết → kiểm tra etcd.yaml tương tự
# Sửa manifest → kubelet tự restart pod → chờ 30–60s → kubectl hoạt động lại
watch crictl ps
```

### 13.3. Scheduler / Controller-manager hỏng
```bash
# Triệu chứng: pod mãi Pending (scheduler) / deployment không tạo pod (controller-manager)
k get pods -n kube-system              # thành phần nào CrashLoopBackOff?
k logs -n kube-system kube-scheduler-controlplane
# thường do manifest trong /etc/kubernetes/manifests/ bị sửa sai
```

### 13.4. Service không hoạt động
```bash
k get endpoints <svc>          # RỖNG → selector sai hoặc pod chưa Ready (readiness probe)
k describe svc <svc>           # so selector với label pod: k get pods --show-labels
# targetPort có khớp containerPort không?
k get pods -n kube-system | grep kube-proxy    # kube-proxy sống không?
```

### 13.5. Lệnh quan sát node & container runtime
```bash
crictl ps / crictl ps -a       # container đang chạy / tất cả
crictl logs <id>
crictl pods
systemctl status containerd
k get events -A --sort-by=.metadata.creationTimestamp
k top nodes ; k top pods -A    # cần metrics-server
k describe node node01         # conditions: MemoryPressure, DiskPressure, taints...
```

---

## 14. DaemonSets & HPA

### DaemonSet (1 pod trên mỗi node)
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
spec:
  selector:
    matchLabels:
      app: log-agent
  template:
    metadata:
      labels:
        app: log-agent
    spec:
      tolerations:                       # để chạy cả trên control plane
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
      containers:
      - name: agent
        image: fluentd
```
> Mẹo tạo nhanh: `k create deploy x --image=... $do > ds.yaml` → đổi `kind: DaemonSet`, xóa `replicas` và `strategy`.

### HPA
```bash
k autoscale deploy web --min=2 --max=10 --cpu-percent=70
k get hpa
```

---

## 🧠 Bộ Nhớ Nhanh CKA

```bash
# Files
/etc/kubernetes/manifests/     # static pods (sửa = restart component)
/var/lib/kubelet/config.yaml   # kubelet config
/etc/cni/net.d/                # CNI

# etcd backup 1 dòng (điền cert từ etcd.yaml):
ETCDCTL_API=3 etcdctl snapshot save /opt/etcd.db --endpoints=... --cacert=... --cert=... --key=...

# Upgrade: plan → kubeadm apply (master) / upgrade node (worker) → drain → kubelet → uncordon

# Node NotReady: ssh → systemctl status kubelet → journalctl -u kubelet → sửa → restart
# Apiserver chết: crictl ps -a → crictl logs → sửa manifest → chờ 60s

# User mới: openssl key+csr → CSR object → approve → lấy cert → role+rolebinding
# Taint: k taint node n1 k=v:NoSchedule   (xóa: thêm - cuối)
# Drain: k drain n1 --ignore-daemonsets → làm việc → k uncordon n1
```

**Nguyên tắc:** *get nodes → khoanh vùng (cluster? node? app?) → đúng máy → sửa → verify → exit.*

---
*Dùng chung với **CKAD-Cheat-Sheet.md** cho phần workloads/networking cơ bản. 🚀*
