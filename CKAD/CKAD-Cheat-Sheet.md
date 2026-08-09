# ⚡ CKAD Cheat Sheet — Tài Liệu Tra Cứu Nhanh

> Tất cả lệnh & YAML mẫu cần thiết cho kỳ thi CKAD. Dùng song song với quá trình học và ôn lại trước ngày thi.

---

## Mục Lục
1. [Setup & kubectl cơ bản](#1-setup--kubectl-cơ-bản)
2. [Pods](#2-pods)
3. [Multi-Container Pods](#3-multi-container-pods-init--sidecar)
4. [Deployments & Rollouts](#4-deployments--rollouts)
5. [Jobs & CronJobs](#5-jobs--cronjobs)
6. [ConfigMaps & Secrets](#6-configmaps--secrets)
7. [Resources, LimitRange, Quota](#7-resources-limitrange-resourcequota)
8. [SecurityContext & ServiceAccount & RBAC](#8-securitycontext--serviceaccount--rbac)
9. [Probes](#9-probes-liveness--readiness--startup)
10. [Services & DNS](#10-services--dns)
11. [Ingress](#11-ingress)
12. [NetworkPolicies](#12-networkpolicies)
13. [Volumes, PV & PVC](#13-volumes-pv--pvc)
14. [Labels, Selectors & Annotations](#14-labels-selectors--annotations)
15. [Helm](#15-helm)
16. [Kustomize](#16-kustomize)
17. [Container Images](#17-container-images-dockerpodman)
18. [Debugging & Troubleshooting](#18-debugging--troubleshooting)
19. [Canary & Blue-Green](#19-canary--blue-green-deployment)
20. [API Versions & CRDs](#20-api-versions-deprecations--crds)

---

## 1. Setup & kubectl Cơ Bản

### Alias & biến môi trường (làm ngay đầu giờ thi)
```bash
alias k=kubectl
export do="--dry-run=client -o yaml"   # generate YAML
export now="--force --grace-period=0"  # xóa nhanh

# Ví dụ sử dụng:
k run nginx --image=nginx $do > pod.yaml
k delete pod nginx $now
```

### ~/.vimrc
```vim
set tabstop=2 expandtab shiftwidth=2
```

### Context & Namespace
```bash
k config get-contexts                          # liệt kê contexts
k config use-context <name>                    # chuyển context (ĐỀ THI YÊU CẦU MỖI CÂU!)
k config set-context --current --namespace=dev # đặt namespace mặc định
k get ns                                       # liệt kê namespaces
k create ns dev
```

### Lệnh nền tảng
```bash
k get pod|deploy|svc|cm|secret|pvc -n <ns>     # xem tài nguyên
k get pod -A                                   # tất cả namespaces
k get pod -o wide                              # thêm IP, node
k get pod <name> -o yaml                       # full YAML
k describe pod <name>                          # chi tiết + events
k delete pod <name>
k apply -f file.yaml                           # tạo/cập nhật declarative
k create -f file.yaml                          # tạo mới
k replace -f file.yaml --force                 # thay thế (xóa + tạo lại)
k edit pod <name>                              # sửa trực tiếp
k explain pod.spec.containers                  # TRA FIELD — cực hữu ích
k explain deploy.spec.strategy --recursive     # xem toàn bộ subfields
k api-resources                                # tên tắt + apiVersion mọi resource
```

### Tên viết tắt hay dùng
| Resource | Viết tắt |
|---|---|
| pods | po |
| deployments | deploy |
| services | svc |
| namespaces | ns |
| configmaps | cm |
| persistentvolumeclaims | pvc |
| persistentvolumes | pv |
| serviceaccounts | sa |
| networkpolicies | netpol |
| cronjobs | cj |
| replicasets | rs |
| ingresses | ing |

---

## 2. Pods

### Imperative
```bash
k run nginx --image=nginx                                  # pod cơ bản
k run nginx --image=nginx --port=80                        # + containerPort
k run nginx --image=nginx --env="VAR=value"                # + env
k run nginx --image=nginx --labels="app=web,tier=front"    # + labels
k run busybox --image=busybox --command -- sleep 3600      # + command
k run tmp --image=busybox --rm -it --restart=Never -- sh   # pod tạm để test
k run nginx --image=nginx $do > pod.yaml                   # generate YAML
```

### YAML mẫu đầy đủ
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  namespace: dev
  labels:
    app: myapp
spec:
  containers:
  - name: myapp
    image: nginx:1.25
    ports:
    - containerPort: 80
    env:
    - name: MY_VAR
      value: "hello"
    command: ["/bin/sh"]        # override ENTRYPOINT
    args: ["-c", "sleep 3600"]  # override CMD
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 256Mi
  restartPolicy: Always          # Always | OnFailure | Never
```

### command vs args
| Docker | Kubernetes |
|---|---|
| ENTRYPOINT | `command` |
| CMD | `args` |

### Thao tác với Pod đang chạy
```bash
k exec -it myapp -- sh                     # vào shell
k exec myapp -- env                        # chạy 1 lệnh
k exec myapp -c sidecar -- ls              # chỉ định container
k logs myapp                               # xem log
k cp myapp:/path/file ./file               # copy file ra ngoài
k port-forward pod/myapp 8080:80           # forward port về máy local
```

---

## 3. Multi-Container Pods (Init & Sidecar)

### Init Container (chạy xong mới đến container chính)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nslookup db-service; do sleep 2; done']
  containers:
  - name: myapp
    image: nginx
```

### Sidecar chia sẻ volume (pattern kinh điển trong đề)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: app
    image: busybox
    command: ['sh', '-c', 'while true; do date >> /var/log/app.log; sleep 5; done']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  - name: log-reader          # sidecar
    image: busybox
    command: ['sh', '-c', 'tail -f /var/log/app.log']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
```

### Native sidecar (K8s 1.29+): init container với restartPolicy
```yaml
  initContainers:
  - name: log-sidecar
    image: busybox
    restartPolicy: Always     # biến init container thành sidecar chạy suốt đời pod
    command: ['sh', '-c', 'tail -f /var/log/app.log']
```

---

## 4. Deployments & Rollouts

### Imperative
```bash
k create deploy web --image=nginx --replicas=3
k create deploy web --image=nginx --replicas=3 $do > deploy.yaml
k scale deploy web --replicas=5
k autoscale deploy web --min=2 --max=10 --cpu-percent=80   # HPA
k set image deploy/web nginx=nginx:1.26                    # update image
k edit deploy web
```

### Rollout
```bash
k rollout status deploy/web            # theo dõi tiến trình
k rollout history deploy/web           # lịch sử revisions
k rollout history deploy/web --revision=2
k rollout undo deploy/web              # rollback về revision trước
k rollout undo deploy/web --to-revision=1
k rollout restart deploy/web           # restart toàn bộ pods
k rollout pause deploy/web
k rollout resume deploy/web
```

### YAML với strategy
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate          # hoặc Recreate
    rollingUpdate:
      maxSurge: 1                # tối đa thêm bao nhiêu pod khi update
      maxUnavailable: 1          # tối đa bao nhiêu pod down khi update
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web                 # PHẢI khớp selector
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
```

> ⚠️ `spec.selector.matchLabels` **phải khớp** `spec.template.metadata.labels`, nếu không sẽ báo lỗi.

---

## 5. Jobs & CronJobs

### Job
```bash
k create job myjob --image=busybox -- sh -c "echo hello"
k create job myjob --image=busybox $do -- sh -c "echo hi" > job.yaml
```
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myjob
spec:
  completions: 5           # tổng số lần chạy thành công cần đạt
  parallelism: 2           # số pod chạy song song
  backoffLimit: 3          # số lần retry khi fail
  activeDeadlineSeconds: 60 # timeout toàn job
  template:
    spec:
      containers:
      - name: myjob
        image: busybox
        command: ["sh", "-c", "echo processing && sleep 10"]
      restartPolicy: Never   # Never hoặc OnFailure (KHÔNG được Always)
```

### CronJob
```bash
k create cronjob mycron --image=busybox --schedule="*/5 * * * *" -- sh -c "date"
k create job manual-run --from=cronjob/mycron    # chạy tay từ cronjob
```
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mycron
spec:
  schedule: "*/5 * * * *"           # phút giờ ngày tháng thứ
  concurrencyPolicy: Forbid         # Allow | Forbid | Replace
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  startingDeadlineSeconds: 30
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          containers:
          - name: mycron
            image: busybox
            command: ["date"]
          restartPolicy: OnFailure
```

### Cron syntax nhanh
```
┌──── phút (0-59)
│ ┌──── giờ (0-23)
│ │ ┌──── ngày trong tháng (1-31)
│ │ │ ┌──── tháng (1-12)
│ │ │ │ ┌──── thứ (0-6, 0=CN)
* * * * *
"0 3 * * *"    → 3h sáng hàng ngày
"*/10 * * * *" → mỗi 10 phút
"0 0 * * 0"    → nửa đêm Chủ nhật
```

---

## 6. ConfigMaps & Secrets

### ConfigMap — tạo
```bash
k create cm mycm --from-literal=KEY1=val1 --from-literal=KEY2=val2
k create cm mycm --from-file=config.txt          # key = tên file
k create cm mycm --from-file=mykey=config.txt    # key tùy chọn
k create cm mycm --from-env-file=app.env
```

### ConfigMap — inject vào Pod (3 cách)
```yaml
spec:
  containers:
  - name: app
    image: nginx
    # Cách 1: từng biến
    env:
    - name: KEY1
      valueFrom:
        configMapKeyRef:
          name: mycm
          key: KEY1
    # Cách 2: toàn bộ CM thành env
    envFrom:
    - configMapRef:
        name: mycm
    # Cách 3: mount thành file
    volumeMounts:
    - name: config-vol
      mountPath: /etc/config
  volumes:
  - name: config-vol
    configMap:
      name: mycm
```

### Secret — tạo
```bash
k create secret generic mysecret --from-literal=password=s3cret
k create secret generic mysecret --from-file=ssh-key=~/.ssh/id_rsa
k create secret docker-registry regcred \
  --docker-server=myregistry.io --docker-username=user \
  --docker-password=pass --docker-email=a@b.c
k create secret tls mytls --cert=tls.crt --key=tls.key

# Base64 thủ công:
echo -n 's3cret' | base64          # encode
echo 'czNjcmV0' | base64 -d        # decode
k get secret mysecret -o jsonpath='{.data.password}' | base64 -d
```

### Secret — inject vào Pod
```yaml
spec:
  containers:
  - name: app
    image: nginx
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mysecret
          key: password
    envFrom:
    - secretRef:
        name: mysecret
    volumeMounts:
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-vol
    secret:
      secretName: mysecret
  imagePullSecrets:              # dùng cho private registry
  - name: regcred
```

---

## 7. Resources, LimitRange, ResourceQuota

### Requests & Limits
```yaml
resources:
  requests:            # đảm bảo tối thiểu — scheduler dựa vào đây
    cpu: 100m          # 100 millicores = 0.1 CPU
    memory: 128Mi
  limits:              # trần tối đa — vượt memory → OOMKilled
    cpu: 500m
    memory: 256Mi
```

**QoS Classes:** Guaranteed (requests = limits) > Burstable (có requests < limits) > BestEffort (không set gì).

### LimitRange (default cho namespace)
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
  namespace: dev
spec:
  limits:
  - default:              # default limit
      memory: 512Mi
      cpu: 500m
    defaultRequest:       # default request
      memory: 256Mi
      cpu: 250m
    max:
      memory: 1Gi
    min:
      memory: 128Mi
    type: Container
```

### ResourceQuota (tổng cho namespace)
```bash
k create quota myquota --hard=pods=10,requests.cpu=4,requests.memory=4Gi,limits.memory=8Gi -n dev
k describe quota -n dev
```

---

## 8. SecurityContext & ServiceAccount & RBAC

### SecurityContext
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:               # POD-LEVEL: áp cho mọi container
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000                # group sở hữu volume (CHỈ có ở pod-level)
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
    securityContext:             # CONTAINER-LEVEL: override pod-level
      runAsUser: 2000
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:              # CHỈ có ở container-level
        add: ["NET_ADMIN", "SYS_TIME"]
        drop: ["ALL"]
```

> 📌 Ghi nhớ: `fsGroup` chỉ ở pod-level; `capabilities` chỉ ở container-level.

### ServiceAccount
```bash
k create sa mysa
k create token mysa                        # tạo token thủ công (K8s mới)
```
```yaml
spec:
  serviceAccountName: mysa
  automountServiceAccountToken: false      # tắt mount token nếu không cần
```

### RBAC
```bash
# Role (giới hạn trong 1 namespace)
k create role pod-reader --verb=get,list,watch --resource=pods -n dev
# RoleBinding
k create rolebinding read-pods --role=pod-reader --serviceaccount=dev:mysa -n dev
k create rolebinding read-pods-user --role=pod-reader --user=jane -n dev

# ClusterRole / ClusterRoleBinding (toàn cluster)
k create clusterrole node-reader --verb=get,list --resource=nodes
k create clusterrolebinding read-nodes --clusterrole=node-reader --user=jane

# Kiểm tra quyền — RẤT HAY RA THI
k auth can-i list pods --as=jane -n dev
k auth can-i create deploy --as=system:serviceaccount:dev:mysa -n dev
k auth can-i --list -n dev
```

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
- apiGroups: [""]              # "" = core API group
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
```

---

## 9. Probes (Liveness / Readiness / Startup)

| Probe | Fail thì sao? | Dùng khi |
|---|---|---|
| **livenessProbe** | Container bị **restart** | Phát hiện app treo/deadlock |
| **readinessProbe** | Pod bị **loại khỏi Service endpoints** (không restart) | App tạm chưa sẵn sàng nhận traffic |
| **startupProbe** | Restart; chặn 2 probe kia cho đến khi pass | App khởi động chậm |

```yaml
spec:
  containers:
  - name: app
    image: nginx
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
        httpHeaders:
        - name: Custom-Header
          value: check
      initialDelaySeconds: 5    # chờ trước lần check đầu
      periodSeconds: 10         # tần suất check
      timeoutSeconds: 1
      failureThreshold: 3       # fail liên tiếp N lần → hành động
      successThreshold: 1
    readinessProbe:
      exec:
        command: ["cat", "/tmp/ready"]
      initialDelaySeconds: 5
      periodSeconds: 5
    startupProbe:
      tcpSocket:
        port: 8080
      failureThreshold: 30      # 30 × 10s = tối đa 300s cho app khởi động
      periodSeconds: 10
```

3 kiểu probe: `httpGet` (2xx/3xx = pass), `exec` (exit 0 = pass), `tcpSocket` (kết nối được = pass). Có thêm `grpc` cho app hỗ trợ gRPC health.

---

## 10. Services & DNS

### Imperative
```bash
k expose deploy web --port=80 --target-port=8080                    # ClusterIP
k expose deploy web --port=80 --type=NodePort                       # NodePort
k expose pod nginx --port=80 --name=nginx-svc
k create svc clusterip mysvc --tcp=80:8080 $do > svc.yaml
```

### YAML
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  type: ClusterIP              # ClusterIP (mặc định) | NodePort | LoadBalancer
  selector:
    app: web                   # PHẢI khớp label của Pod
  ports:
  - port: 80                   # port của Service
    targetPort: 8080           # port của container
    nodePort: 30080            # chỉ với NodePort (30000–32767)
```

### DNS trong cluster
```
<service>.<namespace>.svc.cluster.local
# Cùng namespace:  curl http://web-svc
# Khác namespace:  curl http://web-svc.prod
# Full:            curl http://web-svc.prod.svc.cluster.local
```

### Kiểm tra Service hoạt động
```bash
k get endpoints web-svc        # RỖNG = selector không khớp label pod!
k run tmp --image=busybox --rm -it --restart=Never -- wget -qO- http://web-svc:80
```

---

## 11. Ingress

```bash
k create ingress myingress --rule="myapp.com/app*=web-svc:80" $do > ing.yaml
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
  - hosts: ["myapp.com"]
    secretName: mytls
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /app
        pathType: Prefix        # Prefix | Exact | ImplementationSpecific
        backend:
          service:
            name: web-svc
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 8080
```

```bash
k get ingress
k describe ingress myingress
```

---

## 12. NetworkPolicies

> Mặc định: mọi Pod nói chuyện được với nhau. NetworkPolicy = whitelist (chỉ cho phép những gì khai báo).

### Default deny all (ingress + egress)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: dev
spec:
  podSelector: {}              # {} = áp dụng cho MỌI pod trong namespace
  policyTypes: ["Ingress", "Egress"]
```

### Cho phép frontend → backend
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: dev
spec:
  podSelector:
    matchLabels:
      app: backend             # policy áp cho pod backend
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:             # từ pod có label này (cùng namespace)
        matchLabels:
          app: frontend
    - namespaceSelector:       # HOẶC từ mọi pod trong ns có label này
        matchLabels:
          env: prod
    - ipBlock:
        cidr: 10.0.0.0/16
        except: ["10.0.1.0/24"]
    ports:
    - protocol: TCP
      port: 8080
```

> ⚠️ **Bẫy kinh điển:**
> - `- podSelector` và `- namespaceSelector` là 2 item riêng (có dấu `-`) → **OR**
> - Gộp chung 1 item (namespaceSelector + podSelector không có `-` thứ hai) → **AND** (pod có label X **trong** namespace có label Y)

```yaml
  # AND: pod app=frontend TRONG namespace env=prod
  - from:
    - namespaceSelector:
        matchLabels:
          env: prod
      podSelector:
        matchLabels:
          app: frontend
```

### Egress (đừng quên DNS!)
```yaml
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: db
    ports:
    - protocol: TCP
      port: 5432
  - ports:                     # cho phép DNS
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

---

## 13. Volumes, PV & PVC

### emptyDir & hostPath
```yaml
  volumes:
  - name: cache
    emptyDir: {}               # sống cùng pod, mất khi pod xóa
  - name: host-data
    hostPath:
      path: /data
      type: DirectoryOrCreate
```

### PersistentVolume
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mypv
spec:
  capacity:
    storage: 1Gi
  accessModes: ["ReadWriteOnce"]     # RWO | ROX (ReadOnlyMany) | RWX (ReadWriteMany)
  persistentVolumeReclaimPolicy: Retain   # Retain | Delete | Recycle
  storageClassName: manual
  hostPath:
    path: /mnt/data
```

### PersistentVolumeClaim
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mypvc
spec:
  accessModes: ["ReadWriteOnce"]     # phải tương thích với PV
  storageClassName: manual           # phải khớp PV (hoặc bỏ trống nếu PV trống)
  resources:
    requests:
      storage: 500Mi                 # ≤ capacity của PV
```

### Mount PVC vào Pod
```yaml
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: mypvc
```

```bash
k get pv,pvc          # PVC "Pending" = không tìm được PV khớp (check accessModes, storageClassName, size)
```

---

## 14. Labels, Selectors & Annotations

```bash
k label pod nginx env=prod                 # thêm label
k label pod nginx env=dev --overwrite      # sửa
k label pod nginx env-                     # xóa label
k get pods --show-labels
k get pods -l env=prod                     # filter equality
k get pods -l 'env in (prod,dev)'          # filter set-based
k get pods -l env=prod,tier=frontend       # AND nhiều điều kiện
k annotate pod nginx description="my app"
k annotate pod nginx description-
```

### Node scheduling (mức CKAD)
```yaml
spec:
  nodeSelector:                  # đơn giản nhất
    disktype: ssd
  tolerations:                   # cho phép schedule lên node có taint
  - key: "node-role"
    operator: "Equal"            # Equal | Exists
    value: "special"
    effect: "NoSchedule"         # NoSchedule | PreferNoSchedule | NoExecute
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In         # In | NotIn | Exists | DoesNotExist
            values: ["ssd"]
```

---

## 15. Helm

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm repo list
helm search repo nginx                       # tìm trong repo đã add
helm search repo nginx --versions            # liệt kê mọi version

helm install myrelease bitnami/nginx         # cài
helm install myrelease bitnami/nginx -n web --create-namespace
helm install myrelease bitnami/nginx --set replicaCount=3
helm install myrelease bitnami/nginx -f custom-values.yaml

helm list -A                                 # liệt kê releases mọi namespace
helm status myrelease
helm show values bitnami/nginx               # xem values mặc định
helm get values myrelease                    # values đang dùng

helm upgrade myrelease bitnami/nginx --set replicaCount=5
helm upgrade myrelease bitnami/nginx --version 15.1.0
helm history myrelease
helm rollback myrelease 1                    # rollback về revision 1

helm uninstall myrelease
helm template myrelease bitnami/nginx        # render YAML không cài (xem trước)
```

---

## 16. Kustomize

### Cấu trúc thư mục
```
base/
  kustomization.yaml
  deployment.yaml
  service.yaml
overlays/
  dev/
    kustomization.yaml
  prod/
    kustomization.yaml
```

### base/kustomization.yaml
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
commonLabels:
  app: myapp
```

### overlays/prod/kustomization.yaml
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: prod
namePrefix: prod-
replicas:
- name: myapp
  count: 5
images:
- name: nginx
  newTag: "1.26"
patches:
- path: patch.yaml
```

```bash
k kustomize overlays/prod          # render xem trước
k apply -k overlays/prod           # apply
k delete -k overlays/prod
```

---

## 17. Container Images (Docker/Podman)

```bash
# Dockerfile mẫu
cat <<EOF > Dockerfile
FROM nginx:1.25
COPY index.html /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

docker build -t myapp:v1 .
docker tag myapp:v1 registry.io/myapp:v1
docker push registry.io/myapp:v1
docker images
docker save myapp:v1 -o myapp.tar        # export image ra file (HAY RA THI)
docker load -i myapp.tar
docker run -d -p 8080:80 --name web myapp:v1

# Podman: cú pháp y hệt docker
podman build -t myapp:v1 .
podman save myapp:v1 -o myapp.tar
```

---

## 18. Debugging & Troubleshooting

### Quy trình chuẩn khi Pod lỗi
```bash
k get pod                            # 1. Xem trạng thái
k describe pod <name>                # 2. Đọc Events ở cuối
k logs <name>                        # 3. Log container
k logs <name> --previous             # 4. Log container ĐÃ CRASH trước đó
k logs <name> -c <container>         # multi-container
k logs <name> --all-containers
k get events --sort-by=.metadata.creationTimestamp -n <ns>
k exec -it <name> -- sh              # 5. Vào trong kiểm tra
```

### Bảng chẩn đoán lỗi thường gặp
| Trạng thái | Nguyên nhân phổ biến | Cách kiểm tra |
|---|---|---|
| `ImagePullBackOff` / `ErrImagePull` | Sai tên/tag image, thiếu imagePullSecret | `k describe pod` → Events |
| `CrashLoopBackOff` | App crash liên tục, sai command, thiếu config | `k logs --previous` |
| `Pending` | Không đủ resource, không node khớp selector/taint, PVC pending | `k describe pod` → Events |
| `OOMKilled` | Vượt memory limit | `k describe pod` → Last State: OOMKilled → tăng limit |
| `CreateContainerConfigError` | ConfigMap/Secret được tham chiếu không tồn tại | `k describe pod` |
| Service không hoạt động | Selector không khớp label pod | `k get endpoints <svc>` (rỗng = sai selector) |
| Pod Running nhưng không nhận traffic | Readiness probe fail | `k describe pod` → Conditions: Ready=False |

### JSONPath & output tùy chỉnh (hay ra thi)
```bash
k get pods -o jsonpath='{.items[*].metadata.name}'
k get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.podIP}{"\n"}{end}'
k get pod nginx -o jsonpath='{.spec.containers[0].image}'
k get pods --sort-by=.metadata.creationTimestamp
k get pods -o custom-columns='NAME:.metadata.name,IMAGE:.spec.containers[0].image'
k top pod --sort-by=memory        # cần metrics-server
k top node
```

---

## 19. Canary & Blue-Green Deployment

### Canary (chia traffic theo tỷ lệ replica)
```yaml
# Deployment chính: 4 replicas, labels: app=web, version=v1
# Deployment canary: 1 replica,  labels: app=web, version=v2
# Service selector CHỈ dùng: app=web
# → ~80% traffic vào v1, ~20% vào v2 (theo tỷ lệ pod)
```
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    app: web           # KHÔNG chọn version → cả 2 deployment đều nhận traffic
  ports:
  - port: 80
```

### Blue-Green (chuyển toàn bộ tức thì)
```yaml
# Deployment blue:  labels: app=web, version=blue
# Deployment green: labels: app=web, version=green
# Service selector: app=web, version=blue
# Khi green sẵn sàng → đổi selector sang version=green:
```
```bash
k patch svc web-svc -p '{"spec":{"selector":{"app":"web","version":"green"}}}'
```

---

## 20. API Versions, Deprecations & CRDs

```bash
k api-resources                          # mọi resource + apiVersion + viết tắt
k api-versions                           # mọi API version có trên cluster
k explain deploy | head -2               # xem apiVersion đúng của resource
# Sửa YAML cũ bị deprecated: đổi apiVersion (vd: extensions/v1beta1 → apps/v1)
k convert -f old.yaml --output-version apps/v1   # nếu plugin kubectl-convert có sẵn
```

### apiVersion cần nhớ
| Resource | apiVersion |
|---|---|
| Pod, Service, ConfigMap, Secret, PV, PVC, Namespace, ServiceAccount, LimitRange, ResourceQuota | `v1` |
| Deployment, ReplicaSet, DaemonSet, StatefulSet | `apps/v1` |
| Job, CronJob | `batch/v1` |
| Ingress, NetworkPolicy | `networking.k8s.io/v1` |
| Role, RoleBinding, ClusterRole, ClusterRoleBinding | `rbac.authorization.k8s.io/v1` |
| HorizontalPodAutoscaler | `autoscaling/v2` |
| CustomResourceDefinition | `apiextensions.k8s.io/v1` |

### CRDs (mức CKAD: nhận biết + sử dụng)
```bash
k get crd                                # liệt kê CRDs trên cluster
k describe crd <name>
k explain <custom-resource>              # tra spec của custom resource
k get <custom-resource-name>             # dùng như resource bình thường
```

---

## 🧠 Bộ Nhớ Nhanh Trước Giờ Thi

```bash
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"

k run pod1 --image=nginx $do > p.yaml                # Pod
k create deploy d1 --image=nginx --replicas=3 $do    # Deployment
k expose deploy d1 --port=80 --target-port=8080      # Service
k create cm cm1 --from-literal=k=v                   # ConfigMap
k create secret generic s1 --from-literal=k=v        # Secret
k create job j1 --image=busybox -- echo hi           # Job
k create cronjob c1 --image=busybox --schedule="* * * * *" -- date
k create ingress i1 --rule="host/path*=svc:80" $do   # Ingress
k create role r1 --verb=get,list --resource=pods     # Role
k create rolebinding rb1 --role=r1 --serviceaccount=ns:sa
k create sa sa1                                      # ServiceAccount
k create quota q1 --hard=pods=10                     # ResourceQuota
k explain <resource>.<field> --recursive             # Tra field
k get endpoints <svc>                                # Debug service
k logs <pod> --previous                              # Debug crash
```

**Nguyên tắc 5 chữ:** *Context → Namespace → Imperative → Verify → Next.*

---
*Kết hợp với **CKAD-Study-Guide.md** để có lộ trình học hoàn chỉnh. Chúc bạn thi tốt! 🚀*
