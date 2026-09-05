// Thư viện YAML mẫu — skeleton tối thiểu đúng cú pháp để tra cứu khi thực hành.
// Quy ước: dòng có "# ← sửa" là giá trị cần thay theo đề bài (tên, image, port, namespace...).
export const snippets = [
  {
    id: "sn-pod-full",
    kind: "Pod",
    title: "Pod đầy đủ: env, command/args, resources, labels",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: myapp                     # ← sửa
  labels:
    app: myapp                    # ← sửa
spec:
  containers:
  - name: myapp
    image: busybox:1.36           # ← sửa
    command: ["/bin/sh"]          # = ENTRYPOINT của Docker (override image)
    args: ["-c", "sleep 3600"]    # = CMD của Docker (override image)
    env:
    - name: MY_VAR
      value: "hello"              # ← sửa (số cũng phải trong nháy kép)
    ports:
    - containerPort: 80           # ← sửa
    resources:
      requests:                   # scheduler chọn node dựa vào requests
        cpu: 100m
        memory: 128Mi
      limits:                     # vượt memory limit → OOMKilled
        cpu: 500m
        memory: 256Mi
  restartPolicy: Always           # Always | OnFailure | Never`,
    },
    note: "Docker ENTRYPOINT = `command`, CMD = `args` — đề cho \"chạy lệnh X\" thường chỉ cần `args` nếu image đã có ENTRYPOINT đúng; sinh nhanh: `k run myapp --image=... --dry-run=client -o yaml`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"define command and arguments container\".",
    lesson: { track: "ckad", item: "w2-1", label: "Bài học: Tuần 2 — Pod cơ bản" },
  },
  {
    id: "sn-pod-probes",
    kind: "Pod",
    title: "Pod với liveness + readiness + startup probe (3 kiểu)",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: probed
spec:
  containers:
  - name: app
    image: nginx:1.27             # ← sửa
    livenessProbe:                # fail → RESTART container
      httpGet:
        path: /healthz            # ← sửa
        port: 80                  # ← sửa
      initialDelaySeconds: 5      # chờ trước lần check đầu
      periodSeconds: 10
      failureThreshold: 3         # fail liên tiếp N lần mới hành động
    readinessProbe:               # fail → loại khỏi Service endpoints (KHÔNG restart)
      exec:
        command: ["cat", "/tmp/ready"]   # exit 0 = pass
      periodSeconds: 5
    startupProbe:                 # chặn 2 probe kia đến khi pass; fail → restart
      tcpSocket:
        port: 80                  # kết nối TCP được = pass
      failureThreshold: 30        # 30 × 10s = tối đa 300s cho app khởi động
      periodSeconds: 10`,
    },
    note: "Readiness fail chỉ ngắt traffic (endpoints rỗng), liveness fail mới restart — chọn nhầm là mất điểm; httpGet pass khi HTTP 2xx/3xx.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"configure liveness readiness startup probes\".",
    lesson: { track: "ckad", item: "w5-1", label: "Bài học: Tuần 5 — Probes" },
  },
  {
    id: "sn-pod-init",
    kind: "Pod",
    title: "Pod với init container",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  initContainers:                 # chạy TUẦN TỰ, xong hết mới đến containers
  - name: wait-for-db
    image: busybox:1.36
    command: ["sh", "-c", "until nslookup db-service; do sleep 2; done"]  # ← sửa
  containers:
  - name: myapp
    image: nginx:1.27             # ← sửa`,
    },
    note: "Init container fail → pod restart lại từ init đầu tiên; trạng thái `Init:0/1` trong `k get pod` nghĩa là đang kẹt ở init — debug bằng `k logs myapp -c wait-for-db`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"init containers\".",
    lesson: { track: "ckad", item: "w2-3", label: "Bài học: Tuần 2 — Init container" },
  },
  {
    id: "sn-pod-sidecar-native",
    kind: "Pod",
    title: "Native sidecar (initContainer + restartPolicy: Always)",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  initContainers:
  - name: log-sidecar
    image: busybox:1.36
    restartPolicy: Always         # ← chính field này biến init thành sidecar (K8s 1.29+)
    command: ["sh", "-c", "tail -F /var/log/app.log"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  containers:
  - name: app
    image: busybox:1.36           # ← sửa
    command: ["sh", "-c", "while true; do date >> /var/log/app.log; sleep 5; done"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log`,
    },
    note: "Native sidecar khởi động TRƯỚC và kết thúc SAU container chính — khác sidecar kiểu cũ (đặt trong `containers`) vốn không đảm bảo thứ tự.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"sidecar containers\".",
    lesson: { track: "ckad", item: "w2-4", label: "Bài học: Tuần 2 — Sidecar pattern" },
  },
  {
    id: "sn-emptydir-share",
    kind: "Pod",
    title: "emptyDir chia sẻ giữa 2 container",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: shared-pod
spec:
  volumes:
  - name: shared
    emptyDir: {}                  # sống cùng pod, mất khi pod bị xóa
  containers:
  - name: writer
    image: busybox:1.36
    command: ["sh", "-c", "while true; do date >> /data/out.log; sleep 5; done"]
    volumeMounts:
    - name: shared
      mountPath: /data            # ← sửa — mountPath mỗi container có thể khác nhau
  - name: reader
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /data/out.log"]
    volumeMounts:
    - name: shared
      mountPath: /data`,
    },
    note: "`emptyDir` sống sót khi container restart nhưng mất khi pod bị xóa/di dời; thêm `emptyDir: {medium: Memory}` nếu đề yêu cầu tmpfs (RAM).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"volumes emptyDir\".",
    lesson: { track: "ckad", item: "w2-5", label: "Bài học: Tuần 2 — Chia sẻ volume giữa các container" },
  },
  {
    id: "sn-deploy-rollingupdate",
    kind: "Deployment",
    title: "Deployment với strategy RollingUpdate",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web                       # ← sửa
spec:
  replicas: 3                     # ← sửa
  strategy:
    type: RollingUpdate           # RollingUpdate | Recreate
    rollingUpdate:
      maxSurge: 1                 # được TẠO THÊM tối đa bao nhiêu pod khi update
      maxUnavailable: 1           # được phép DOWN tối đa bao nhiêu pod khi update
  selector:
    matchLabels:
      app: web                    # PHẢI khớp template.metadata.labels
  template:
    metadata:
      labels:
        app: web                  # ← sửa (khớp selector ở trên)
    spec:
      containers:
      - name: nginx
        image: nginx:1.27         # ← sửa`,
    },
    note: "`selector.matchLabels` phải khớp `template.metadata.labels` và là field BẤT BIẾN sau khi tạo; rollback nhanh: `k rollout undo deploy/web`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"deployment rolling update strategy\".",
    lesson: { track: "ckad", item: "w3-1", label: "Bài học: Tuần 3 — Deployment & Rollout" },
  },
  {
    id: "sn-job",
    kind: "Job",
    title: "Job với completions / parallelism / backoffLimit",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: batch/v1
kind: Job
metadata:
  name: myjob                     # ← sửa
spec:
  completions: 5                  # tổng số lần chạy thành công cần đạt
  parallelism: 2                  # số pod chạy song song
  backoffLimit: 3                 # số lần retry khi fail (mặc định 6)
  activeDeadlineSeconds: 60       # timeout toàn job — quá hạn = kill hết
  template:
    spec:
      containers:
      - name: worker
        image: busybox:1.36       # ← sửa
        command: ["sh", "-c", "echo processing && sleep 5"]   # ← sửa
      restartPolicy: Never        # Never | OnFailure — KHÔNG được Always`,
    },
    note: "Quên đổi `restartPolicy` là bẫy số 1: pod template mặc định `Always` nhưng Job chỉ chấp nhận `Never`/`OnFailure` — apply sẽ báo lỗi.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"jobs run to completion\".",
    lesson: { track: "ckad", item: "w3-4", label: "Bài học: Tuần 3 — Jobs" },
  },
  {
    id: "sn-cronjob",
    kind: "CronJob",
    title: "CronJob với schedule + concurrencyPolicy + history limits",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: mycron                    # ← sửa
spec:
  schedule: "*/5 * * * *"         # ← sửa — phút giờ ngày tháng thứ
  concurrencyPolicy: Forbid       # Allow | Forbid | Replace
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  startingDeadlineSeconds: 30     # lỡ lịch quá 30s thì bỏ lượt chạy đó
  jobTemplate:
    spec:                         # đây là spec của Job (backoffLimit đặt ở đây)
      backoffLimit: 2
      template:
        spec:
          containers:
          - name: task
            image: busybox:1.36   # ← sửa
            command: ["date"]     # ← sửa
          restartPolicy: OnFailure`,
    },
    note: "Cấu trúc lồng 3 tầng `spec.jobTemplate.spec.template.spec` rất dễ thụt lề sai — sinh khung bằng `k create cronjob ... --schedule='...' --dry-run=client -o yaml` rồi sửa.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"cronjob\".",
    lesson: { track: "ckad", item: "w3-5", label: "Bài học: Tuần 3 — CronJobs" },
  },
  {
    id: "sn-configmap-create",
    kind: "ConfigMap",
    title: "Tạo ConfigMap (key-value + dạng file)",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config                # ← sửa
data:
  APP_MODE: "production"          # ← sửa — key-value dùng cho env
  LOG_LEVEL: "info"
  app.properties: |               # key dạng file — dùng cho volume mount
    server.port=8080
    cache.enabled=true
# Imperative nhanh hơn:
#   k create cm app-config --from-literal=APP_MODE=production \\
#     --from-file=app.properties --dry-run=client -o yaml`,
    },
    note: "Giá trị trong `data:` luôn là string — số/boolean phải bọc nháy kép, nếu không apply sẽ lỗi \"cannot unmarshal\".",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"configure pod configmap\".",
    lesson: { track: "ckad", item: "w4-1", label: "Bài học: Tuần 4 — ConfigMap" },
  },
  {
    id: "sn-pod-use-configmap",
    kind: "Pod",
    title: "Pod dùng ConfigMap qua envFrom + volume",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: busybox:1.36           # ← sửa
    command: ["sh", "-c", "env && sleep 3600"]
    envFrom:                      # TOÀN BỘ key của CM thành biến env
    - configMapRef:
        name: app-config          # ← sửa
    env:                          # hoặc lấy TỪNG key
    - name: MODE
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_MODE
    volumeMounts:                 # mỗi key thành 1 file trong mountPath
    - name: config-vol
      mountPath: /etc/config
  volumes:
  - name: config-vol
    configMap:
      name: app-config            # ← sửa`,
    },
    note: "Sửa ConfigMap KHÔNG cập nhật biến env của pod đang chạy (phải tạo lại pod); mount volume thì file tự cập nhật sau ~1 phút — trừ khi dùng `subPath`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"configure pod configmap\" (mục Define container environment variables).",
    lesson: { track: "ckad", item: "w4-1", label: "Bài học: Tuần 4 — ConfigMap" },
  },
  {
    id: "sn-secret-pod",
    kind: "Secret",
    title: "Secret + Pod dùng qua env và volume",
    certs: ["CKAD", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Secret
metadata:
  name: db-secret                 # ← sửa
type: Opaque
stringData:                       # stringData: ghi plaintext, k8s tự base64
  password: s3cret                # ← sửa
---
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: busybox:1.36           # ← sửa
    command: ["sleep", "3600"]
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    volumeMounts:                 # mount thành file an toàn hơn env
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-vol
    secret:
      secretName: db-secret       # lưu ý: secretName, không phải name`,
    },
    note: "`data:` đòi giá trị ĐÃ base64, `stringData:` nhận plaintext; decode nhanh: `k get secret db-secret -o jsonpath='{.data.password}' | base64 -d`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"secrets\" / \"distribute credentials secure\".",
    lesson: { track: "ckad", item: "w4-2", label: "Bài học: Tuần 4 — Secret" },
  },
  {
    id: "sn-svc-clusterip",
    kind: "Service",
    title: "Service ClusterIP",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Service
metadata:
  name: web-svc                   # ← sửa — cũng là tên DNS: web-svc.<ns>.svc.cluster.local
spec:
  type: ClusterIP                 # mặc định, có thể bỏ dòng này
  selector:
    app: web                      # ← sửa — PHẢI khớp label của Pod
  ports:
  - port: 80                      # port của Service
    targetPort: 8080              # ← sửa — port container đang listen
# Imperative: k expose deploy web --port=80 --target-port=8080`,
    },
    note: "Service không có traffic → kiểm tra ngay `k get endpoints web-svc`: rỗng nghĩa là selector sai label hoặc pod chưa Ready (readiness probe fail).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"service\" (mục Defining a Service).",
    lesson: { track: "ckad", item: "w6-1", label: "Bài học: Tuần 6 — Services" },
  },
  {
    id: "sn-svc-nodeport",
    kind: "Service",
    title: "Service NodePort (port vs targetPort vs nodePort)",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Service
metadata:
  name: web-np                    # ← sửa
spec:
  type: NodePort
  selector:
    app: web                      # ← sửa
  ports:
  - port: 80                      # port NỘI BỘ của Service (ClusterIP:80)
    targetPort: 8080              # ← sửa — port CONTAINER đang listen
    nodePort: 30080               # ← sửa — port mở trên MỌI node (30000–32767)
# Truy cập: http://<IP-bất-kỳ-node-nào>:30080`,
    },
    note: "Bỏ trống `nodePort` thì k8s tự cấp ngẫu nhiên trong 30000–32767 — đề yêu cầu port cụ thể thì phải ghi rõ; ngoài range này apply sẽ lỗi.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"service type nodeport\".",
    lesson: { track: "ckad", item: "w6-1", label: "Bài học: Tuần 6 — Services" },
  },
  {
    id: "sn-svc-headless",
    kind: "Service",
    title: "Headless Service (clusterIP: None)",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Service
metadata:
  name: db-headless               # ← sửa
spec:
  clusterIP: None                 # ← headless: không cấp virtual IP
  selector:
    app: db                       # ← sửa
  ports:
  - port: 5432                    # ← sửa`,
    },
    note: "DNS của headless service trả thẳng IP TỪNG POD (không load-balance) — bắt buộc cho StatefulSet để có tên ổn định dạng `pod-0.db-headless.<ns>.svc`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"headless services\".",
    lesson: { track: "ckad", item: "w6-2", label: "Bài học: Tuần 6 — DNS & Headless Service" },
  },
  {
    id: "sn-ingress",
    kind: "Ingress",
    title: "Ingress 2 paths + TLS",
    certs: ["CKAD", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myingress                 # ← sửa
spec:
  ingressClassName: nginx         # ← sửa — xem tên bằng: k get ingressclass
  tls:                            # bỏ block tls nếu đề không yêu cầu HTTPS
  - hosts: ["myapp.com"]          # ← sửa
    secretName: app-tls           # ← sửa — secret type kubernetes.io/tls
  rules:
  - host: myapp.com               # ← sửa
    http:
      paths:
      - path: /app                # ← sửa
        pathType: Prefix          # Prefix | Exact — BẮT BUỘC phải có
        backend:
          service:
            name: web-svc         # ← sửa
            port:
              number: 80          # ← sửa
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc         # ← sửa
            port:
              number: 8080
# Secret TLS: k create secret tls app-tls --cert=tls.crt --key=tls.key`,
    },
    note: "`pathType` là bắt buộc từ networking.k8s.io/v1 (thiếu là apply lỗi); backend port viết lồng `port: {number: 80}` chứ không phải `servicePort` như API cũ.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"ingress\" (mục TLS) — hoặc sinh khung: k create ingress ... --rule=\"host/path*=svc:80\".",
    lesson: { track: "ckad", item: "w6-3", label: "Bài học: Tuần 6 — Ingress" },
  },
  {
    id: "sn-netpol-default-deny",
    kind: "NetworkPolicy",
    title: "NetworkPolicy default-deny toàn bộ",
    certs: ["CKAD", "CKA", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: dev                  # ← sửa
spec:
  podSelector: {}                 # {} = áp cho MỌI pod trong namespace
  policyTypes: ["Ingress", "Egress"]   # liệt kê mà không khai rule = deny hết`,
    },
    note: "NetworkPolicy là whitelist: chỉ cần MỘT policy khác allow đúng chiều là traffic đó lại thông — deny-all không \"đè\" các policy allow.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"network policies\" (mục Default deny).",
    lesson: { track: "ckad", item: "w6-5", label: "Bài học: Tuần 6 — NetworkPolicy" },
  },
  {
    id: "sn-netpol-frontend-backend",
    kind: "NetworkPolicy",
    title: "NetworkPolicy allow frontend → backend theo port",
    certs: ["CKAD", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: dev                  # ← sửa
spec:
  podSelector:
    matchLabels:
      app: backend                # ← sửa — policy ÁP LÊN pod đích (backend)
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:                # từ pod cùng namespace có label này
        matchLabels:
          app: frontend           # ← sửa
    ports:
    - protocol: TCP
      port: 8080                  # ← sửa — port của BACKEND`,
    },
    note: "`- podSelector` và `- namespaceSelector` là 2 item riêng (2 dấu gạch) = OR; gộp chung 1 item (bỏ dấu gạch thứ hai) = AND — sai 1 dấu `-` là đổi hẳn nghĩa.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"network policies\" (ví dụ trong trang, copy rồi sửa).",
    lesson: { track: "ckad", item: "w6-5", label: "Bài học: Tuần 6 — NetworkPolicy" },
  },
  {
    id: "sn-netpol-dns-egress",
    kind: "NetworkPolicy",
    title: "NetworkPolicy egress cho phép DNS (port 53)",
    certs: ["CKAD", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-dns
  namespace: dev                  # ← sửa
spec:
  podSelector:
    matchLabels:
      app: myapp                  # ← sửa — hoặc {} cho mọi pod
  policyTypes: ["Egress"]
  egress:
  - to:                           # rule 1: tới đích chính (ví dụ DB)
    - podSelector:
        matchLabels:
          app: db                 # ← sửa
    ports:
    - protocol: TCP
      port: 5432                  # ← sửa
  - ports:                        # rule 2: DNS — QUÊN LÀ MỌI THỨ FAIL
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53`,
    },
    note: "Khóa egress mà quên mở port 53 UDP+TCP thì pod hết resolve DNS — app lỗi \"could not resolve host\" dù policy tới đích đã đúng.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"network policies\" (mục egress).",
    lesson: { track: "ckad", item: "w6-6", label: "Bài học: Tuần 6 — NetworkPolicy egress" },
  },
  {
    id: "sn-pv-pvc",
    kind: "PV/PVC",
    title: "PV hostPath + PVC khớp nhau",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: PersistentVolume
metadata:
  name: mypv                      # ← sửa
spec:
  capacity:
    storage: 1Gi                  # ← sửa
  accessModes: ["ReadWriteOnce"]  # RWO | ReadOnlyMany | ReadWriteMany
  persistentVolumeReclaimPolicy: Retain   # Retain | Delete
  storageClassName: manual        # ← sửa — PVC phải ghi Y HỆT
  hostPath:
    path: /mnt/data               # ← sửa
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mypvc                     # ← sửa
  namespace: dev                  # ← sửa — PVC thuộc namespace, PV thì không
spec:
  accessModes: ["ReadWriteOnce"]  # phải nằm trong accessModes của PV
  storageClassName: manual        # khớp PV (PV không có SC thì bỏ hẳn dòng này)
  resources:
    requests:
      storage: 500Mi              # ← sửa — phải ≤ capacity của PV`,
    },
    note: "PVC kẹt Pending = không PV nào khớp cả 3 điều kiện: accessModes, storageClassName, size — so từng cái bằng `k get pv` và `k describe pvc`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"configure persistent volume storage\".",
    lesson: { track: "ckad", item: "w7-2", label: "Bài học: Tuần 7 — PV & PVC" },
  },
  {
    id: "sn-pod-mount-pvc",
    kind: "Pod",
    title: "Pod mount PVC",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: app
  namespace: dev                  # ← sửa — cùng namespace với PVC
spec:
  containers:
  - name: app
    image: nginx:1.27             # ← sửa
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html   # ← sửa
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: mypvc            # ← sửa — tên PVC, không phải tên PV`,
    },
    note: "Pod chỉ tham chiếu PVC (không bao giờ trỏ thẳng PV) và PVC phải cùng namespace với pod; pod Pending kèm event \"unbound PersistentVolumeClaims\" = PVC chưa Bound.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"configure persistent volume storage\" (bước tạo Pod).",
    lesson: { track: "ckad", item: "w7-3", label: "Bài học: Tuần 7 — Mount PVC vào Pod" },
  },
  {
    id: "sn-securitycontext",
    kind: "Pod",
    title: "SecurityContext pod-level + container-level",
    certs: ["CKAD", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:                # POD-LEVEL: áp cho mọi container
    runAsUser: 1000               # ← sửa
    runAsGroup: 3000
    fsGroup: 2000                 # group sở hữu volume — CHỈ có ở pod-level
    runAsNonRoot: true
  containers:
  - name: app
    image: busybox:1.36           # ← sửa
    command: ["sleep", "3600"]
    securityContext:              # CONTAINER-LEVEL: override pod-level
      runAsUser: 2000             # ← sửa
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:               # CHỈ có ở container-level
        drop: ["ALL"]
        add: ["NET_BIND_SERVICE"] # ← sửa — chỉ add khi đề yêu cầu`,
    },
    note: "`fsGroup` chỉ tồn tại ở pod-level, `capabilities`/`readOnlyRootFilesystem` chỉ ở container-level — đặt nhầm chỗ là apply lỗi \"unknown field\".",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"security context pod container\".",
    lesson: { track: "ckad", item: "w4-5", label: "Bài học: Tuần 4 — SecurityContext" },
  },
  {
    id: "sn-sa-role-rolebinding",
    kind: "RBAC",
    title: "ServiceAccount + Role + RoleBinding (3 objects)",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa                    # ← sửa
  namespace: dev                  # ← sửa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader                # ← sửa
  namespace: dev
rules:
- apiGroups: [""]                 # "" = core API group (pods, services, cm...)
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"] # ← sửa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: dev
roleRef:                          # roleRef BẤT BIẾN — đổi role là phải tạo lại binding
  kind: Role
  apiGroup: rbac.authorization.k8s.io
  name: pod-reader
# Verify: k auth can-i list pods --as=system:serviceaccount:dev:app-sa -n dev
# Pod dùng SA: spec.serviceAccountName: app-sa`,
    },
    note: "Deployment nằm ở apiGroup `apps` chứ không phải `\"\"` — cho verb lên deployments mà để apiGroups [\"\"] là quyền không có tác dụng.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"rbac authorization\" — hoặc k create role/rolebinding --dry-run=client -o yaml.",
    lesson: { track: "ckad", item: "w4-7", label: "Bài học: Tuần 4 — RBAC & ServiceAccount" },
  },
  {
    id: "sn-resourcequota",
    kind: "ResourceQuota",
    title: "ResourceQuota cho namespace",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota                 # ← sửa
  namespace: dev                  # ← sửa
spec:
  hard:
    pods: "10"                    # ← sửa
    requests.cpu: "4"
    requests.memory: 4Gi
    limits.cpu: "8"
    limits.memory: 8Gi
# Imperative: k create quota dev-quota --hard=pods=10,requests.cpu=4 -n dev
# Xem mức dùng: k describe quota -n dev`,
    },
    note: "Namespace có quota CPU/memory thì mọi pod BẮT BUỘC khai requests/limits tương ứng — thiếu là pod bị từ chối tạo (trừ khi LimitRange cấp default).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"resource quotas\".",
    lesson: { track: "ckad", item: "w4-3", label: "Bài học: Tuần 4 — ResourceQuota" },
  },
  {
    id: "sn-limitrange",
    kind: "LimitRange",
    title: "LimitRange default request/limit",
    certs: ["CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits            # ← sửa
  namespace: dev                  # ← sửa
spec:
  limits:
  - type: Container
    default:                      # LIMIT mặc định nếu container không khai
      cpu: 500m
      memory: 512Mi               # ← sửa
    defaultRequest:               # REQUEST mặc định nếu container không khai
      cpu: 250m
      memory: 256Mi               # ← sửa
    max:
      memory: 1Gi
    min:
      memory: 128Mi`,
    },
    note: "`default` = limit mặc định còn `defaultRequest` = request mặc định — hai field tên dễ lẫn; LimitRange chỉ áp cho pod TẠO SAU khi nó tồn tại.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"limit range\".",
    lesson: { track: "ckad", item: "w4-4", label: "Bài học: Tuần 4 — LimitRange" },
  },
  {
    id: "sn-pod-nodeselector-toleration",
    kind: "Pod",
    title: "Pod với nodeSelector + toleration",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: pinned
spec:
  nodeSelector:                   # node PHẢI có label này
    disktype: ssd                 # ← sửa — gắn label: k label node node01 disktype=ssd
  tolerations:                    # cho phép (không ép buộc) lên node có taint
  - key: "gpu"                    # ← sửa — khớp taint: k taint node node01 gpu=true:NoSchedule
    operator: "Equal"             # Equal (cần value) | Exists (bỏ value)
    value: "true"
    effect: "NoSchedule"          # NoSchedule | PreferNoSchedule | NoExecute
  containers:
  - name: app
    image: nginx:1.27             # ← sửa`,
    },
    note: "Toleration chỉ CHO PHÉP pod lên node có taint chứ không kéo pod về đó — muốn ép đúng node phải kết hợp nodeSelector/affinity như trên.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"taint and toleration\" / \"assign pods nodes\".",
    lesson: { track: "cka", item: "cka-w4-2", label: "Bài học: CKA Tuần 4 — Taints & Tolerations" },
  },
  {
    id: "sn-kustomization",
    kind: "Kustomization",
    title: "kustomization.yaml cơ bản (base + overlay)",
    certs: ["CKAD", "CKA"],
    code: {
      lang: "yaml",
      text: `# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:                        # các manifest gốc
- deployment.yaml                 # ← sửa
- service.yaml
---
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base                      # kế thừa base
namespace: prod                   # ← sửa — ép namespace cho mọi resource
namePrefix: prod-                 # ← sửa
replicas:
- name: myapp                     # ← sửa — tên Deployment trong base
  count: 5
images:
- name: nginx                     # ← sửa — đổi tag không cần patch
  newTag: "1.27"
# Render xem trước: k kustomize overlays/prod
# Apply:            k apply -k overlays/prod`,
    },
    note: "Dùng `k apply -k <thư-mục>` (chữ k thường, trỏ THƯ MỤC chứa kustomization.yaml) chứ không phải `-f`; file bắt buộc tên đúng `kustomization.yaml`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"declarative management kustomize\".",
    lesson: { track: "ckad", item: "w7-6", label: "Bài học: Tuần 7 — Kustomize" },
  },
  {
    id: "sn-static-pod",
    kind: "Pod",
    title: "Static Pod manifest",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `# Đặt file này vào /etc/kubernetes/manifests/ TRÊN NODE cần chạy
# (xác nhận đường dẫn: grep staticPodPath /var/lib/kubelet/config.yaml)
apiVersion: v1
kind: Pod
metadata:
  name: static-web                # ← sửa — tên hiển thị sẽ có hậu tố -<tên-node>
spec:
  containers:
  - name: web
    image: nginx:1.27             # ← sửa
    ports:
    - containerPort: 80
# Xóa static pod = XÓA FILE này (kubectl delete sẽ bị kubelet tạo lại ngay)`,
    },
    note: "Static pod do kubelet quản lý trực tiếp: nhận diện qua hậu tố tên node (vd `static-web-node01`) và ownerReference là Node — muốn sửa/xóa phải SSH đúng node.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"static pods\".",
    lesson: { track: "cka", item: "cka-w1-4", label: "Bài học: CKA Tuần 1 — Static Pods" },
  },
  {
    id: "sn-pod-nodename",
    kind: "Pod",
    title: "Pod gán thẳng node bằng spec.nodeName",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: manual-pod
spec:
  nodeName: node01                # ← sửa — gán thẳng node, BYPASS scheduler
  containers:
  - name: app
    image: nginx:1.27             # ← sửa`,
    },
    note: "`nodeName` bỏ qua hoàn toàn scheduler nên cũng bỏ qua taint kiểm tra lúc schedule — là cách chạy pod khi kube-scheduler đang chết (dạng bài CKA).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"assign pod node\" (mục nodeName).",
    lesson: { track: "cka", item: "cka-w4-4", label: "Bài học: CKA Tuần 4 — Manual scheduling" },
  },
  {
    id: "sn-daemonset",
    kind: "DaemonSet",
    title: "DaemonSet (1 pod mỗi node)",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent                 # ← sửa
  namespace: kube-system          # ← sửa
spec:
  selector:
    matchLabels:
      app: log-agent
  template:
    metadata:
      labels:
        app: log-agent            # khớp selector
    spec:
      tolerations:                # thêm để chạy cả trên control plane
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
      containers:
      - name: agent
        image: fluentd:v1.16      # ← sửa`,
    },
    note: "Không có lệnh `k create daemonset` — sinh khung bằng `k create deploy ... --dry-run=client -o yaml` rồi đổi `kind: DaemonSet`, xóa `replicas` và `strategy`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"daemonset\".",
    lesson: { track: "cka", item: "cka-w4-7", label: "Bài học: CKA Tuần 4 — DaemonSet" },
  },
  {
    id: "sn-priorityclass",
    kind: "PriorityClass",
    title: "PriorityClass + Pod sử dụng",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority             # ← sửa
value: 1000000                    # ← sửa — số càng lớn ưu tiên càng cao
globalDefault: false              # true = áp cho mọi pod không khai priorityClassName
description: "Cho workload quan trọng"
---
apiVersion: v1
kind: Pod
metadata:
  name: critical-app
spec:
  priorityClassName: high-priority   # ← sửa — phải tồn tại TRƯỚC khi tạo pod
  containers:
  - name: app
    image: nginx:1.27             # ← sửa`,
    },
    note: "Pod ưu tiên cao có thể PREEMPT (đuổi) pod ưu tiên thấp khi node hết chỗ; PriorityClass là resource cluster-scope, không có namespace.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"pod priority preemption\".",
    lesson: { track: "cka", item: "cka-w4-8", label: "Bài học: CKA Tuần 4 — PriorityClass" },
  },
  {
    id: "sn-storageclass",
    kind: "StorageClass",
    title: "StorageClass với WaitForFirstConsumer",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast                      # ← sửa
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # đặt làm default SC
provisioner: kubernetes.io/no-provisioner   # ← sửa — local: no-provisioner; cloud vd: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer     # chờ có pod dùng mới bind (tốt cho local/zonal)
reclaimPolicy: Delete                       # Delete | Retain
allowVolumeExpansion: true                  # cho phép sửa PVC tăng size`,
    },
    note: "PVC Pending với SC `WaitForFirstConsumer` là BÌNH THƯỜNG — nó chỉ Bound khi có pod mount; đừng mất thời gian \"sửa\" khi chưa tạo pod.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"storage classes\".",
    lesson: { track: "cka", item: "cka-w5-2", label: "Bài học: CKA Tuần 5 — StorageClass" },
  },
  {
    id: "sn-node-affinity",
    kind: "Pod",
    title: "Node affinity required + preferred",
    certs: ["CKA", "CKAD"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: affinity-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:    # BẮT BUỘC — không khớp thì Pending
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype         # ← sửa
            operator: In          # In | NotIn | Exists | DoesNotExist | Gt | Lt
            values: ["ssd"]       # ← sửa
      preferredDuringSchedulingIgnoredDuringExecution:   # ƯU TIÊN — không khớp vẫn schedule
      - weight: 1                 # 1–100
        preference:
          matchExpressions:
          - key: zone             # ← sửa
            operator: In
            values: ["az1"]       # ← sửa
  containers:
  - name: app
    image: nginx:1.27             # ← sửa`,
    },
    note: "Tên field dài dễ gõ sai — copy từ docs; `IgnoredDuringExecution` nghĩa là node đổi label SAU khi pod đã chạy thì pod không bị đuổi.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"assign pods nodes affinity\".",
    lesson: { track: "cka", item: "cka-w4-1", label: "Bài học: CKA Tuần 4 — Node affinity" },
  },
  {
    id: "sn-pod-antiaffinity",
    kind: "Deployment",
    title: "Pod anti-affinity — trải replica theo hostname",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web                  # ← sửa
    spec:
      affinity:
        podAntiAffinity:          # KHÔNG đứng cạnh pod có label dưới đây
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: web          # ← sửa — chính label của app này → mỗi node 1 replica
            topologyKey: kubernetes.io/hostname   # "cạnh nhau" = cùng node
      containers:
      - name: nginx
        image: nginx:1.27         # ← sửa`,
    },
    note: "`topologyKey` là bắt buộc với podAffinity/AntiAffinity; dùng `required...` mà replicas > số node thì pod thừa sẽ Pending mãi (cân nhắc `preferred...`).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"inter-pod affinity anti-affinity\".",
    lesson: { track: "cka", item: "cka-w4-3", label: "Bài học: CKA Tuần 4 — Pod affinity/anti-affinity" },
  },
  {
    id: "sn-csr",
    kind: "CertificateSigningRequest",
    title: "CertificateSigningRequest cho user mới",
    certs: ["CKA", "CKS"],
    code: {
      lang: "yaml",
      text: `# B1: openssl genrsa -out dev.key 2048
# B2: openssl req -new -key dev.key -subj "/CN=dev-user" -out dev.csr
# B3: lấy nội dung base64 1 dòng: cat dev.csr | base64 | tr -d '\\n'
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: dev-user                  # ← sửa
spec:
  request: LS0tLS1CRUdJTi...      # ← sửa — dán chuỗi base64 1 dòng của dev.csr
  signerName: kubernetes.io/kube-apiserver-client   # cho client cert user
  expirationSeconds: 86400        # 1 ngày
  usages: ["client auth"]
# B4: k certificate approve dev-user
# B5: k get csr dev-user -o jsonpath='{.status.certificate}' | base64 -d > dev.crt
# B6: cấp quyền bằng Role + RoleBinding với --user=dev-user`,
    },
    note: "`request` phải là CSR đã base64 thành MỘT dòng (`| tr -d '\\n'`); approve xong vẫn chưa có quyền gì — phải tạo thêm RoleBinding cho CN đó.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"certificate signing requests\" (mục Normal user).",
    lesson: { track: "cka", item: "cka-w7-2", label: "Bài học: CKA Tuần 7 — Tạo user bằng CSR" },
  },
  {
    id: "sn-gateway-httproute",
    kind: "Gateway",
    title: "Gateway + HTTPRoute",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway                # ← sửa
spec:
  gatewayClassName: nginx         # ← sửa — xem bằng: k get gatewayclass
  listeners:
  - name: http
    protocol: HTTP
    port: 80                      # ← sửa
    allowedRoutes:
      namespaces:
        from: Same                # Same | All | Selector
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route                 # ← sửa
spec:
  parentRefs:
  - name: my-gateway              # gắn route vào Gateway ở trên
  hostnames: ["app.example.com"]  # ← sửa
  rules:
  - matches:
    - path:
        type: PathPrefix          # PathPrefix | Exact
        value: /login             # ← sửa
    backendRefs:
    - name: web-svc               # ← sửa — Service đích
      port: 80                    # ← sửa`,
    },
    note: "apiVersion là `gateway.networking.k8s.io/v1` (không phải networking.k8s.io như Ingress); HTTPRoute chỉ nhận traffic khi Gateway `allowedRoutes` cho phép namespace của nó.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"gateway api\" — hoặc gateway-api.sigs.k8s.io.",
    lesson: { track: "cka", item: "cka-w6-5", label: "Bài học: CKA Tuần 6 — Gateway API" },
  },
  {
    id: "sn-coredns-corefile",
    kind: "ConfigMap",
    title: "CoreDNS ConfigMap (Corefile) chú thích",
    certs: ["CKA"],
    code: {
      lang: "yaml",
      text: `# Xem bản đang chạy: k get cm coredns -n kube-system -o yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {                        # lắng nghe port 53 cho mọi domain
        errors
        health { lameduck 5s }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {   # ← sửa cluster domain nếu đề yêu cầu
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        forward . /etc/resolv.conf   # ← sửa — DNS ngoài cluster chuyển tiếp đi đâu
        cache 30
        loop
        reload                    # tự nạp lại khi ConfigMap đổi
        loadbalance
    }`,
    },
    note: "Sửa ConfigMap xong nhờ plugin `reload` CoreDNS tự nạp lại sau ~30s; muốn ngay thì `k rollout restart deploy coredns -n kube-system`. Test: nslookup kubernetes.default từ pod busybox:1.28.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"customizing dns service\".",
    lesson: { track: "cka", item: "cka-w6-2", label: "Bài học: CKA Tuần 6 — CoreDNS" },
  },
  {
    id: "sn-clusterrole-crb",
    kind: "ClusterRole",
    title: "ClusterRole + ClusterRoleBinding",
    certs: ["CKA", "CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole                 # cluster-scope: không có namespace
metadata:
  name: node-reader               # ← sửa
rules:
- apiGroups: [""]
  resources: ["nodes"]            # ← sửa — nodes/PV là resource cluster-scope
  verbs: ["get", "list", "watch"] # ← sửa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-nodes
subjects:
- kind: User                      # User | Group | ServiceAccount
  name: jane                      # ← sửa
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  apiGroup: rbac.authorization.k8s.io
  name: node-reader
# Verify: k auth can-i list nodes --as=jane`,
    },
    note: "Resource cluster-scope (nodes, persistentvolumes, namespaces) bắt buộc ClusterRole; RoleBinding cũng trỏ được tới ClusterRole để giới hạn quyền đó trong 1 namespace.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"rbac authorization\" (mục ClusterRole).",
    lesson: { track: "cka", item: "cka-w7-1", label: "Bài học: CKA Tuần 7 — RBAC cluster-scope" },
  },
  {
    id: "sn-encryptionconfig",
    kind: "EncryptionConfiguration",
    title: "EncryptionConfiguration (aescbc + identity)",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `# /etc/kubernetes/etcd/enc.yaml — sinh key: head -c 32 /dev/urandom | base64
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: ["secrets"]          # ← sửa — loại resource cần mã hóa
  providers:
  - aescbc:                       # provider ĐẦU TIÊN dùng để MÃ HÓA khi ghi
      keys:
      - name: key1
        secret: PHViYXNlNjQtMzItYnl0ZS1rZXk+   # ← sửa — base64 của key 32 byte
  - identity: {}                  # đứng SAU → vẫn ĐỌC được secret cũ chưa mã hóa
# Gắn vào kube-apiserver.yaml (kèm mount hostPath thư mục /etc/kubernetes/etcd):
#   - --encryption-provider-config=/etc/kubernetes/etcd/enc.yaml
# Re-encrypt secret cũ: k get secrets -A -o json | k replace -f -
# Verify trong etcd thấy tiền tố: k8s:enc:aescbc:v1:key1`,
    },
    note: "Thứ tự providers quyết định tất cả: đảo `identity: {}` lên ĐẦU nghĩa là GHI PLAINTEXT (dùng khi cần giải mã toàn bộ) — đặt nhầm vị trí là sai đề ngược hẳn.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"encrypt data at rest\".",
    lesson: { track: "cks", item: "cks-w4-3", label: "Bài học: CKS Tuần 4 — Encryption at rest" },
  },
  {
    id: "sn-audit-policy",
    kind: "Audit Policy",
    title: "Audit Policy 4 levels + flags apiserver",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `# /etc/kubernetes/audit/policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:                            # rule KHỚP ĐẦU TIÊN được áp dụng — thứ tự quan trọng
- level: RequestResponse          # log cả request + response body
  resources:
  - group: ""
    resources: ["secrets"]
  namespaces: ["prod"]            # ← sửa
- level: Request                  # + request body (không có response)
  resources:
  - group: ""
    resources: ["configmaps"]
- level: Metadata                 # chỉ user/verb/resource/timestamp — mặc định an toàn
  omitStages: ["RequestReceived"]
- level: None                     # rule cuối: những gì còn lại không log
  users: ["system:kube-proxy"]    # ← sửa
# Flags kube-apiserver.yaml (+ mount hostPath 2 thư mục audit policy & log):
#   - --audit-policy-file=/etc/kubernetes/audit/policy.yaml
#   - --audit-log-path=/var/log/kubernetes/audit/audit.log
#   - --audit-log-maxage=30
#   - --audit-log-maxbackup=5
#   - --audit-log-maxsize=100`,
    },
    note: "Quên mount volume hostPath cho thư mục policy và thư mục log vào static pod là apiserver CHẾT LUÔN (không đọc được file) — backup manifest trước khi sửa.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"auditing\".",
    lesson: { track: "cks", item: "cks-w7-2", label: "Bài học: CKS Tuần 7 — Audit logging" },
  },
  {
    id: "sn-psa-namespace",
    kind: "Namespace",
    title: "Namespace với Pod Security Admission labels",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Namespace
metadata:
  name: secure-ns                 # ← sửa
  labels:
    pod-security.kubernetes.io/enforce: restricted   # CHẶN pod vi phạm
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted     # ghi vào audit log
    pod-security.kubernetes.io/warn: restricted      # cảnh báo trên client
# Imperative: k label ns secure-ns pod-security.kubernetes.io/enforce=restricted
# 3 level: privileged < baseline < restricted
# Test không tạo thật: k apply -f pod.yaml --dry-run=server`,
    },
    note: "`enforce` chỉ chặn POD MỚI — pod đang chạy vi phạm vẫn sống, và Deployment vẫn tạo được (chỉ ReplicaSet không sinh pod, kiểm tra bằng `k get events`).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"pod security admission\" / \"pod security standards\".",
    lesson: { track: "cks", item: "cks-w4-2", label: "Bài học: CKS Tuần 4 — Pod Security Admission" },
  },
  {
    id: "sn-seccomp",
    kind: "Seccomp",
    title: "Seccomp profile JSON + Pod gắn Localhost profile",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `# File 1: /var/lib/kubelet/seccomp/profiles/violation.json (tạo TRÊN NODE)
# {
#   "defaultAction": "SCMP_ACT_ERRNO",
#   "architectures": ["SCMP_ARCH_X86_64"],
#   "syscalls": [
#     { "names": ["read","write","exit","exit_group","futex","nanosleep"],
#       "action": "SCMP_ACT_ALLOW" }
#   ]
# }
# (SCMP_ACT_ERRNO = chặn mặc định; SCMP_ACT_LOG = chỉ log để audit)
---
apiVersion: v1
kind: Pod
metadata:
  name: seccomp-pod
spec:
  securityContext:
    seccompProfile:
      type: Localhost             # Localhost | RuntimeDefault | Unconfined
      localhostProfile: profiles/violation.json   # ← sửa — TƯƠNG ĐỐI so với /var/lib/kubelet/seccomp/
  containers:
  - name: app
    image: nginx:1.27             # ← sửa`,
    },
    note: "`localhostProfile` là đường dẫn tương đối so với `/var/lib/kubelet/seccomp/` trên NODE pod chạy — file không tồn tại ở đúng node thì pod báo CreateContainerError.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"restrict container syscalls seccomp\".",
    lesson: { track: "cks", item: "cks-w3-2", label: "Bài học: CKS Tuần 3 — seccomp" },
  },
  {
    id: "sn-apparmor",
    kind: "Pod",
    title: "Pod với AppArmor profile",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `# Trước tiên load profile TRÊN NODE pod sẽ chạy:
#   apparmor_parser -q /etc/apparmor.d/k8s-deny-write
#   aa-status | grep k8s-deny-write
apiVersion: v1
kind: Pod
metadata:
  name: apparmor-pod
spec:
  securityContext:                # K8s 1.30+: field chính thức (hoặc đặt container-level)
    appArmorProfile:
      type: Localhost             # Localhost | RuntimeDefault | Unconfined
      localhostProfile: k8s-deny-write   # ← sửa — TÊN profile (dòng "profile <tên>" trong file)
  containers:
  - name: app
    image: busybox:1.36           # ← sửa
    command: ["sleep", "3600"]
# Manifest cũ dùng annotation (cần nhận biết):
#   container.apparmor.security.beta.kubernetes.io/<container>: localhost/k8s-deny-write`,
    },
    note: "`localhostProfile` là TÊN profile trong file AppArmor chứ không phải đường dẫn file; profile chưa load trên đúng node → pod Blocked/Error (xem `k describe pod`).",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"apparmor\".",
    lesson: { track: "cks", item: "cks-w3-1", label: "Bài học: CKS Tuần 3 — AppArmor" },
  },
  {
    id: "sn-runtimeclass-gvisor",
    kind: "RuntimeClass",
    title: "RuntimeClass gVisor + Pod sandbox",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor                    # ← sửa
handler: runsc                    # handler đã cấu hình sẵn trong containerd
---
apiVersion: v1
kind: Pod
metadata:
  name: sandboxed
spec:
  runtimeClassName: gvisor        # ← sửa — pod chạy trong sandbox
  containers:
  - name: app
    image: nginx:1.27             # ← sửa
# Verify: k exec sandboxed -- dmesg | head   → thấy "gVisor"`,
    },
    note: "`handler: runsc` phải khớp tên runtime đã khai trong containerd — RuntimeClass tạo được nhưng handler không tồn tại thì pod kẹt ở ContainerCreating.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"runtime class\".",
    lesson: { track: "cks", item: "cks-w5-3", label: "Bài học: CKS Tuần 5 — gVisor sandbox" },
  },
  {
    id: "sn-kyverno-registry",
    kind: "Kyverno",
    title: "Kyverno ClusterPolicy chỉ cho phép registry tin cậy",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-registry         # ← sửa
spec:
  validationFailureAction: Enforce    # Enforce (CHẶN) | Audit (chỉ ghi nhận)
  background: true
  rules:
  - name: only-trusted-registry
    match:
      any:
      - resources:
          kinds: ["Pod"]
    validate:
      message: "Chỉ cho phép image từ docker.io/library/"   # ← sửa
      pattern:
        spec:
          containers:
          - image: "docker.io/library/*"   # ← sửa — registry được phép
# Verify: k get clusterpolicy ; thử k run test --image=quay.io/x/y → bị chặn`,
    },
    note: "`validationFailureAction: Audit` KHÔNG chặn gì cả — đề yêu cầu \"block/deny\" thì phải là `Enforce`; pattern chỉ khớp `containers`, cần thêm rule cho `initContainers` nếu đề đòi.",
    docsHint: "Trong phòng thi: kyverno.io → docs → search \"restrict image registries\".",
    lesson: { track: "cks", item: "cks-w5-2", label: "Bài học: CKS Tuần 5 — OPA/Kyverno" },
  },
  {
    id: "sn-falco-rule",
    kind: "Falco",
    title: "Falco rule tùy chỉnh (sửa output format)",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `# /etc/falco/falco_rules.local.yaml — nơi override rule (KHÔNG sửa falco_rules.yaml)
- macro: custom_shell_procs       # macro = điều kiện đặt tên để tái dùng
  condition: proc.name in (bash, sh, zsh)

- rule: Terminal shell in container       # trùng TÊN rule gốc = override nó
  desc: Shell duoc mo trong container
  condition: >
    spawned_process and container
    and custom_shell_procs and proc.tty != 0
  output: >
    %evt.time,%user.name,%container.id,%container.name    # ← sửa — format đề yêu cầu
  priority: WARNING               # EMERGENCY..DEBUG
# Áp dụng: systemctl restart falco
# Xem alert: journalctl -u falco -f  (trigger bằng: k exec -it <pod> -- sh)`,
    },
    note: "Dạng bài phổ biến: grep rule gốc trong `/etc/falco/falco_rules.yaml`, COPY nguyên sang `falco_rules.local.yaml` (giữ đúng tên rule), chỉ sửa dòng `output`, rồi restart falco.",
    docsHint: "Trong phòng thi: falco.org/docs → search \"rules\" và \"supported fields\" (tra %field).",
    lesson: { track: "cks", item: "cks-w7-1", label: "Bài học: CKS Tuần 7 — Falco" },
  },
  {
    id: "sn-dockerfile-hardened",
    kind: "Dockerfile",
    title: "Dockerfile hardened (multi-stage, USER, digest)",
    certs: ["CKS", "CKAD"],
    code: {
      lang: "dockerfile",
      text: `# Stage 1: build — image build tools KHÔNG vào image cuối
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app .

# Stage 2: runtime tối giản
FROM alpine:3.20                  # ← sửa — tốt hơn nữa: alpine@sha256:<digest>
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app /app       # COPY thay ADD (ADD tự giải nén/tải URL — rủi ro)
USER app                          # ← KHÔNG chạy root
ENTRYPOINT ["/app"]
# Cấm: ENV API_KEY=..., COPY id_rsa — secret không được nằm trong image`,
    },
    note: "Pin image bằng digest `@sha256:...` mới thật sự bất biến (tag ghi đè được); thiếu `USER` = chạy root — là finding kinh điển khi đề bảo \"sửa Dockerfile cho an toàn\".",
    docsHint: "Trong phòng thi: kubernetes.io/docs không có Dockerfile — thuộc lòng checklist; scan lại bằng trivy image (aquasecurity trivy docs).",
    lesson: { track: "cks", item: "cks-w6-1", label: "Bài học: CKS Tuần 6 — Dockerfile hardening" },
  },
  {
    id: "sn-pod-immutable",
    kind: "Pod",
    title: "Pod immutable (readOnlyRootFilesystem + emptyDir /tmp)",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: immutable-app
spec:
  containers:
  - name: app
    image: nginx:1.27             # ← sửa
    securityContext:
      readOnlyRootFilesystem: true    # rootfs chỉ đọc — không cài thêm/sửa binary được
    volumeMounts:                 # app cần ghi chỗ nào → cấp emptyDir đúng chỗ đó
    - name: tmp
      mountPath: /tmp
    - name: cache
      mountPath: /var/cache/nginx # ← sửa theo app (xem lỗi ghi ở k logs)
    - name: run
      mountPath: /var/run
  volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir: {}
  - name: run
    emptyDir: {}`,
    },
    note: "Bật `readOnlyRootFilesystem` xong pod CrashLoop là bình thường — đọc `k logs` xem app đòi ghi đường dẫn nào rồi cấp thêm emptyDir đúng chỗ đó, đừng tắt cờ.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"security context\" (readOnlyRootFilesystem).",
    lesson: { track: "cks", item: "cks-w7-3", label: "Bài học: CKS Tuần 7 — Immutable containers" },
  },
  {
    id: "sn-netpol-block-metadata",
    kind: "NetworkPolicy",
    title: "NetworkPolicy chặn cloud metadata 169.254.169.254",
    certs: ["CKS"],
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-metadata
  namespace: default              # ← sửa
spec:
  podSelector: {}                 # ← sửa — {} = mọi pod trong namespace
  policyTypes: ["Egress"]
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0           # cho phép ra mọi nơi...
        except:
        - 169.254.169.254/32      # ...TRỪ metadata endpoint của cloud`,
    },
    note: "`except` phải là CIDR con của `cidr` và ghi dạng /32 cho 1 IP; policy này vẫn allow mọi egress khác — nếu đề đòi \"chỉ chặn metadata\" thì đây là đáp án chuẩn.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"network policies\" (mục ipBlock).",
    lesson: { track: "cks", item: "cks-w1-6", label: "Bài học: CKS Tuần 1 — Chặn metadata endpoint" },
  },
];

