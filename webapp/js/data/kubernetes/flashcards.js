// Bộ flashcard ôn tập — sinh cho ứng dụng luyện thi K8s.
// Nguồn: CKAD-Cheat-Sheet.md & CKAD-Study-Guide.md (Kubernetes >= 1.29).
export const flashcards = [
  // ===== architecture (f001–f005) =====
  {
    id: "f001",
    topic: "architecture",
    front: "Control Plane của Kubernetes gồm những thành phần nào?",
    back: "API Server (cổng vào duy nhất của cluster), etcd (key-value store lưu state), Scheduler (chọn node cho Pod), Controller Manager (chạy các controller duy trì desired state). Mọi thao tác đều đi qua API Server.",
    code: null,
  },
  {
    id: "f002",
    topic: "architecture",
    front: "Worker node chạy những thành phần nào?",
    back: "kubelet (quản lý Pod trên node, giao tiếp với API Server), kube-proxy (duy trì network rules cho Service) và container runtime (vd containerd) để chạy container.",
    code: null,
  },
  {
    id: "f003",
    topic: "architecture",
    front: "kube-scheduler quyết định điều gì và dựa trên những yếu tố nào?",
    back: "Chọn node cho Pod chưa được gán node. Dựa trên resource requests, `nodeSelector`, nodeAffinity, taints/tolerations. Pod không tìm được node phù hợp sẽ ở trạng thái `Pending`.",
    code: null,
  },
  {
    id: "f004",
    topic: "architecture",
    front: "etcd đóng vai trò gì? Component nào được truy cập nó trực tiếp?",
    back: "etcd là key-value store lưu toàn bộ state của cluster (mọi object). Chỉ API Server truy cập etcd trực tiếp — các component khác đều phải đi qua API Server.",
    code: null,
  },
  {
    id: "f005",
    topic: "architecture",
    front: "Phân biệt cách quản lý imperative và declarative trong Kubernetes?",
    back: "Imperative: ra lệnh trực tiếp (`kubectl run`, `kubectl create`). Declarative: khai báo YAML rồi `kubectl apply -f`. Trong thi CKAD ưu tiên imperative + `$do` để sinh YAML rồi chỉnh sửa.",
    code: null,
  },

  // ===== pods (f006–f014) =====
  {
    id: "f006",
    topic: "pods",
    front: "Sự khác nhau giữa `command` và `args` trong Pod spec?",
    back: "`command` ghi đè ENTRYPOINT của image, `args` ghi đè CMD (tương ứng cặp Docker ENTRYPOINT/CMD).",
    code: {
      lang: "yaml",
      text: `containers:
- name: app
  image: busybox
  command: ["/bin/sh"]        # override ENTRYPOINT
  args: ["-c", "sleep 3600"]  # override CMD`,
    },
  },
  {
    id: "f007",
    topic: "pods",
    front: "Nếu chỉ set `args` mà không set `command` thì điều gì xảy ra?",
    back: "ENTRYPOINT gốc của image giữ nguyên, chỉ CMD bị ghi đè bởi `args`. Đây là cách truyền tham số cho entrypoint có sẵn của image.",
    code: null,
  },
  {
    id: "f008",
    topic: "pods",
    front: "`restartPolicy` của Pod có những giá trị nào? Mặc định là gì?",
    back: "`Always` (mặc định) | `OnFailure` | `Never` — áp dụng cho mọi container trong Pod. Riêng Job chỉ dùng được `Never` hoặc `OnFailure`.",
    code: null,
  },
  {
    id: "f009",
    topic: "pods",
    front: "Pod có những phase nào trong lifecycle?",
    back: "`Pending` (chưa được schedule hoặc đang pull image), `Running`, `Succeeded` (mọi container exit 0), `Failed` và `Unknown` (mất liên lạc với node).",
    code: null,
  },
  {
    id: "f010",
    topic: "pods",
    front: "Init container khác container thường ở điểm nào?",
    back: "Init containers chạy tuần tự và phải hoàn thành (exit 0) hết thì các container chính mới start. Fail thì được chạy lại theo `restartPolicy`. Dùng để chờ dependency hoặc chuẩn bị dữ liệu.",
    code: {
      lang: "yaml",
      text: `initContainers:
- name: wait-for-db
  image: busybox
  command: ['sh', '-c', 'until nslookup db-service; do sleep 2; done']`,
    },
  },
  {
    id: "f011",
    topic: "pods",
    front: "Native sidecar (K8s 1.29+) được khai báo như thế nào?",
    back: "Là init container có `restartPolicy: Always` — start trước main container nhưng chạy suốt đời Pod và không chặn Pod kết thúc (quan trọng với Job).",
    code: {
      lang: "yaml",
      text: `initContainers:
- name: log-sidecar
  image: busybox
  restartPolicy: Always     # biến init container thành sidecar
  command: ['sh', '-c', 'tail -f /var/log/app.log']`,
    },
  },
  {
    id: "f012",
    topic: "pods",
    front: "Các container trong cùng một Pod chia sẻ những gì?",
    back: "Cùng network namespace (gọi nhau qua `localhost`), cùng Pod IP, và có thể chia sẻ volumes (thường là `emptyDir`). Filesystem của mỗi container vẫn tách biệt.",
    code: null,
  },
  {
    id: "f013",
    topic: "pods",
    front: "Sidecar pattern dùng để làm gì? Ví dụ kinh điển trong đề thi?",
    back: "Container phụ chạy song song với main container: ship log, proxy, sync dữ liệu. Kinh điển: app ghi log vào `emptyDir`, sidecar `tail -f` file log đó qua volume mount chung.",
    code: null,
  },
  {
    id: "f014",
    topic: "pods",
    front: "Có sửa được spec của Pod đang chạy không?",
    back: "Hầu hết field là immutable — chỉ sửa được `image` và vài field nhỏ. Muốn đổi field khác: export YAML, sửa, rồi `k replace -f pod.yaml --force` (xóa và tạo lại).",
    code: null,
  },

  // ===== workloads (f015–f023) =====
  {
    id: "f015",
    topic: "workloads",
    front: "Quan hệ giữa Deployment và ReplicaSet?",
    back: "Deployment quản lý ReplicaSet; ReplicaSet duy trì đúng số replica Pod. Mỗi lần đổi Pod template, Deployment tạo ReplicaSet mới và dịch chuyển replica dần (rolling update), giữ RS cũ để rollback.",
    code: null,
  },
  {
    id: "f016",
    topic: "workloads",
    front: "Ràng buộc bắt buộc giữa `spec.selector` và Pod template trong Deployment?",
    back: "`spec.selector.matchLabels` phải khớp `spec.template.metadata.labels`, nếu không API server từ chối tạo Deployment.",
    code: null,
  },
  {
    id: "f017",
    topic: "workloads",
    front: "`maxSurge` và `maxUnavailable` trong RollingUpdate nghĩa là gì?",
    back: "`maxSurge`: số pod được tạo THÊM vượt replicas khi update. `maxUnavailable`: số pod được phép down trong khi update. Strategy `Recreate` thì xóa hết pod cũ trước khi tạo mới (có downtime).",
    code: {
      lang: "yaml",
      text: `strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 1`,
    },
  },
  {
    id: "f018",
    topic: "workloads",
    front: "Cách xem lịch sử rollout và rollback Deployment về revision cụ thể?",
    back: "Dùng nhóm lệnh `kubectl rollout` — `history` xem revisions, `undo` để rollback.",
    code: {
      lang: "bash",
      text: `k rollout history deploy/web
k rollout history deploy/web --revision=2
k rollout undo deploy/web                 # về revision trước
k rollout undo deploy/web --to-revision=1`,
    },
  },
  {
    id: "f019",
    topic: "workloads",
    front: "Trong Job: `completions`, `parallelism`, `backoffLimit` nghĩa là gì?",
    back: "`completions`: tổng số lần chạy thành công cần đạt. `parallelism`: số pod chạy song song. `backoffLimit`: số lần retry khi fail. Thêm `activeDeadlineSeconds` là timeout cho cả Job.",
    code: null,
  },
  {
    id: "f020",
    topic: "workloads",
    front: "Job dùng được những `restartPolicy` nào?",
    back: "Chỉ `Never` hoặc `OnFailure` — KHÔNG được `Always`. `OnFailure` restart container tại chỗ; `Never` tạo pod mới khi fail.",
    code: null,
  },
  {
    id: "f021",
    topic: "workloads",
    front: "`concurrencyPolicy` của CronJob có những giá trị nào?",
    back: "`Allow` (mặc định — cho chạy chồng), `Forbid` (bỏ qua lần mới nếu lần cũ chưa xong), `Replace` (hủy job cũ, chạy job mới). Kèm `successfulJobsHistoryLimit` / `failedJobsHistoryLimit` giới hạn lịch sử.",
    code: null,
  },
  {
    id: "f022",
    topic: "workloads",
    front: "5 trường của cron schedule lần lượt là gì? `0 3 * * *` chạy khi nào?",
    back: "Thứ tự: phút, giờ, ngày-trong-tháng, tháng, thứ (0 = Chủ nhật). `0 3 * * *` = 3h sáng hàng ngày; `*/10 * * * *` = mỗi 10 phút; `0 0 * * 0` = nửa đêm Chủ nhật.",
    code: null,
  },
  {
    id: "f023",
    topic: "workloads",
    front: "Canary và Blue-Green được triển khai bằng labels + Service như thế nào?",
    back: "Canary: 2 Deployment chung label `app=web` khác `version`, Service selector CHỈ chọn `app=web` → traffic chia theo tỷ lệ replica. Blue-Green: Service selector kèm `version=blue`; khi green sẵn sàng thì patch selector sang `version=green` — chuyển 100% tức thì.",
    code: {
      lang: "bash",
      text: `k patch svc web-svc -p '{"spec":{"selector":{"app":"web","version":"green"}}}'`,
    },
  },

  // ===== config (f024–f030) =====
  {
    id: "f024",
    topic: "config",
    front: "3 cách inject ConfigMap vào Pod?",
    back: "1) `env` + `valueFrom.configMapKeyRef` (từng key); 2) `envFrom` + `configMapRef` (toàn bộ key thành biến env); 3) mount thành file qua `volumes.configMap` + `volumeMounts`.",
    code: null,
  },
  {
    id: "f025",
    topic: "config",
    front: "Tạo ConfigMap từ file thì key mặc định là gì? Đổi key thế nào?",
    back: "`--from-file=config.txt` → key = tên file. `--from-file=mykey=config.txt` → tự đặt key. `--from-env-file=app.env` đọc từng dòng KEY=VAL thành từng key riêng.",
    code: null,
  },
  {
    id: "f026",
    topic: "config",
    front: "Các loại Secret thường gặp trong CKAD?",
    back: "`generic` (Opaque) — key-value bất kỳ; `docker-registry` — đăng nhập private registry; `tls` — cert/key cho TLS. Tạo bằng `k create secret <type> ...`.",
    code: null,
  },
  {
    id: "f027",
    topic: "config",
    front: "Secret có được mã hóa không? Cách đọc giá trị một key?",
    back: "Không — dữ liệu chỉ được encode base64, không phải mã hóa. Đọc bằng jsonpath rồi decode.",
    code: {
      lang: "bash",
      text: `k get secret mysecret -o jsonpath='{.data.password}' | base64 -d
echo -n 's3cret' | base64      # encode thủ công`,
    },
  },
  {
    id: "f028",
    topic: "config",
    front: "Pod pull image từ private registry cần cấu hình gì?",
    back: "Tạo Secret loại `docker-registry` rồi tham chiếu trong `spec.imagePullSecrets` của Pod.",
    code: {
      lang: "yaml",
      text: `spec:
  imagePullSecrets:
  - name: regcred`,
    },
  },
  {
    id: "f029",
    topic: "config",
    front: "Mount Secret thành file trong container viết thế nào?",
    back: "Khai `volumes` với `secret.secretName` rồi `volumeMounts` trong container (nên kèm `readOnly: true`). Mỗi key của Secret trở thành một file trong `mountPath`.",
    code: null,
  },
  {
    id: "f030",
    topic: "config",
    front: "`env` + `valueFrom` khác `envFrom` thế nào?",
    back: "`env` với `valueFrom.configMapKeyRef/secretKeyRef` chọn từng key và tự đặt tên biến. `envFrom` với `configMapRef/secretRef` nạp TOÀN BỘ key thành biến env, tên biến = tên key.",
    code: null,
  },

  // ===== resources (f031–f035) =====
  {
    id: "f031",
    topic: "resources",
    front: "`requests` khác `limits` thế nào? Vượt limit thì chuyện gì xảy ra?",
    back: "`requests`: mức đảm bảo tối thiểu — scheduler dựa vào đây để chọn node. `limits`: trần tối đa. Vượt memory limit → container bị OOMKilled; vượt CPU limit → bị throttle (không bị kill).",
    code: null,
  },
  {
    id: "f032",
    topic: "resources",
    front: "3 QoS class của Pod và điều kiện đạt được?",
    back: "`Guaranteed`: mọi container có requests = limits (cả CPU và memory). `Burstable`: có set requests nhưng nhỏ hơn limits. `BestEffort`: không set gì. Khi node thiếu memory, BestEffort bị evict trước.",
    code: null,
  },
  {
    id: "f033",
    topic: "resources",
    front: "`cpu: 100m` và `memory: 128Mi` nghĩa là gì?",
    back: "`100m` = 100 millicores = 0.1 CPU (1 CPU = 1000m). Memory dùng đơn vị nhị phân `Mi`/`Gi` (mebibyte/gibibyte).",
    code: null,
  },
  {
    id: "f034",
    topic: "resources",
    front: "LimitRange khác ResourceQuota thế nào?",
    back: "LimitRange: áp default/min/max cho TỪNG container trong namespace (tự gán default requests/limits nếu Pod không khai). ResourceQuota: giới hạn TỔNG tài nguyên và số lượng object của cả namespace — tạo nhanh bằng `k create quota myquota --hard=pods=10,...`.",
    code: null,
  },
  {
    id: "f035",
    topic: "resources",
    front: "Pod `Pending` do thiếu tài nguyên — chẩn đoán thế nào?",
    back: "`k describe pod` → Events sẽ báo `Insufficient cpu/memory` hoặc không node nào khớp selector/taint. Xử lý: giảm `requests`, sửa scheduling constraint hoặc thêm node.",
    code: null,
  },

  // ===== security (f036–f044) =====
  {
    id: "f036",
    topic: "security",
    front: "`fsGroup` và `capabilities` đặt được ở level nào của securityContext?",
    back: "`fsGroup` CHỈ ở pod-level (group sở hữu volume). `capabilities` CHỈ ở container-level. Các field như `runAsUser` đặt được cả hai — container-level override pod-level.",
    code: null,
  },
  {
    id: "f037",
    topic: "security",
    front: "Pod-level securityContext ảnh hưởng thế nào đến các container?",
    back: "Pod-level áp cho MỌI container trong Pod. Container nào khai securityContext riêng thì giá trị container-level override pod-level cho container đó.",
    code: null,
  },
  {
    id: "f038",
    topic: "security",
    front: "`allowPrivilegeEscalation: false` và `readOnlyRootFilesystem: true` làm gì?",
    back: "`allowPrivilegeEscalation: false`: process không thể xin thêm quyền cao hơn process cha (chặn setuid). `readOnlyRootFilesystem: true`: root filesystem chỉ đọc — muốn ghi phải mount volume.",
    code: null,
  },
  {
    id: "f039",
    topic: "security",
    front: "Thêm/bớt Linux capabilities cho container viết thế nào?",
    back: "Dùng `securityContext.capabilities` — chỉ tồn tại ở container-level.",
    code: {
      lang: "yaml",
      text: `securityContext:
  capabilities:
    add: ["NET_ADMIN", "SYS_TIME"]
    drop: ["ALL"]`,
    },
  },
  {
    id: "f040",
    topic: "security",
    front: "Gắn ServiceAccount vào Pod và tắt tự mount token thế nào?",
    back: "`spec.serviceAccountName: mysa`. Khi Pod không cần gọi API: `automountServiceAccountToken: false` (đặt ở Pod spec hoặc ở chính ServiceAccount).",
    code: null,
  },
  {
    id: "f041",
    topic: "security",
    front: "Role khác ClusterRole thế nào?",
    back: "Role: quyền giới hạn trong 1 namespace. ClusterRole: phạm vi toàn cluster — dùng cho resource không thuộc namespace (nodes, pv) hoặc để tái sử dụng qua nhiều namespace.",
    code: null,
  },
  {
    id: "f042",
    topic: "security",
    front: "RoleBinding có bind được ClusterRole không? Kết quả ra sao?",
    back: "Được. Subject nhận các quyền định nghĩa trong ClusterRole nhưng CHỈ trong namespace của RoleBinding — pattern tái sử dụng một ClusterRole chung cho nhiều namespace.",
    code: null,
  },
  {
    id: "f043",
    topic: "security",
    front: "Kiểm tra một ServiceAccount/user có quyền làm hành động nào đó không?",
    back: "Dùng `k auth can-i` với `--as` — với ServiceAccount phải dùng dạng `system:serviceaccount:<ns>:<sa>`.",
    code: {
      lang: "bash",
      text: `k auth can-i create deploy --as=system:serviceaccount:dev:mysa -n dev
k auth can-i list pods --as=jane -n dev
k auth can-i --list -n dev`,
    },
  },
  {
    id: "f044",
    topic: "security",
    front: "Ý nghĩa của `apiGroups: [\"\"]` trong rules của Role?",
    back: "Chuỗi rỗng = core API group (pods, services, configmaps, secrets…). Resource thuộc group khác phải ghi rõ tên group, vd `apps` cho deployments, `batch` cho jobs.",
    code: null,
  },

  // ===== observability (f045–f051) =====
  {
    id: "f045",
    topic: "observability",
    front: "Liveness probe fail khác readiness probe fail thế nào?",
    back: "Liveness fail → container bị RESTART (phát hiện app treo/deadlock). Readiness fail → Pod bị loại khỏi Service endpoints, không nhận traffic nhưng KHÔNG restart.",
    code: {
      lang: "yaml",
      text: `livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3`,
    },
  },
  {
    id: "f046",
    topic: "observability",
    front: "startupProbe dùng khi nào và tương tác với hai probe kia ra sao?",
    back: "Cho app khởi động chậm: chặn liveness/readiness cho đến khi pass. Thời gian khởi động tối đa = `failureThreshold × periodSeconds` (vd 30 × 10s = 300s).",
    code: null,
  },
  {
    id: "f047",
    topic: "observability",
    front: "Các kiểu handler của probe và điều kiện pass?",
    back: "`httpGet` (HTTP status 2xx/3xx), `exec` (exit code 0), `tcpSocket` (mở kết nối thành công), và `grpc` cho app hỗ trợ gRPC health protocol.",
    code: null,
  },
  {
    id: "f048",
    topic: "observability",
    front: "`initialDelaySeconds`, `periodSeconds`, `failureThreshold` nghĩa là gì?",
    back: "`initialDelaySeconds`: chờ trước lần check đầu tiên. `periodSeconds`: tần suất check. `failureThreshold`: số lần fail liên tiếp trước khi hành động (restart container / loại khỏi endpoints).",
    code: null,
  },
  {
    id: "f049",
    topic: "observability",
    front: "Quy trình debug một Pod lỗi theo thứ tự chuẩn?",
    back: "get (xem trạng thái) → describe (đọc Events ở cuối) → logs (thêm `--previous` nếu container đã crash) → exec vào trong kiểm tra.",
    code: {
      lang: "bash",
      text: `k get pod
k describe pod myapp
k logs myapp --previous
k exec -it myapp -- sh`,
    },
  },
  {
    id: "f050",
    topic: "observability",
    front: "`CrashLoopBackOff` và `ImagePullBackOff` khác nhau về nguyên nhân thế nào?",
    back: "`CrashLoopBackOff`: container start rồi crash liên tục (sai command, thiếu config, app lỗi) → xem `k logs --previous`. `ImagePullBackOff`: không pull được image (sai tên/tag, thiếu `imagePullSecrets`) → xem `k describe pod` phần Events.",
    code: null,
  },
  {
    id: "f051",
    topic: "observability",
    front: "Pod bị `OOMKilled` — xác nhận và xử lý thế nào?",
    back: "`k describe pod` → Last State: OOMKilled = container vượt memory limit. Xử lý: tăng `limits.memory` hoặc giảm mức dùng của app. Dùng `k top pod` (cần metrics-server) xem mức dùng thực tế.",
    code: null,
  },

  // ===== networking (f052–f060) =====
  {
    id: "f052",
    topic: "networking",
    front: "Phân biệt ClusterIP, NodePort, LoadBalancer?",
    back: "`ClusterIP` (mặc định): IP chỉ truy cập được trong cluster. `NodePort`: mở một port (30000–32767) trên MỌI node. `LoadBalancer`: xin load balancer từ cloud provider, bao gồm cả NodePort + ClusterIP.",
    code: null,
  },
  {
    id: "f053",
    topic: "networking",
    front: "Trong Service: `port` vs `targetPort` vs `nodePort`?",
    back: "`port`: port của Service (client gọi vào). `targetPort`: port container đang lắng nghe. `nodePort`: port mở trên node — chỉ với type NodePort, dải 30000–32767.",
    code: null,
  },
  {
    id: "f054",
    topic: "networking",
    front: "DNS name đầy đủ của một Service? Khi nào gọi tắt được?",
    back: "`<service>.<namespace>.svc.cluster.local`. Cùng namespace chỉ cần `http://web-svc`; khác namespace cần thêm tên namespace: `http://web-svc.prod`.",
    code: null,
  },
  {
    id: "f055",
    topic: "networking",
    front: "Service không nhận traffic — điều đầu tiên cần kiểm tra là gì?",
    back: "`k get endpoints <svc>` — endpoints RỖNG nghĩa là selector không khớp label Pod, hoặc Pod chưa Ready (readiness probe fail). Test nhanh bằng pod busybox tạm.",
    code: {
      lang: "bash",
      text: `k get endpoints web-svc
k run tmp --image=busybox --rm -it --restart=Never -- wget -qO- http://web-svc:80`,
    },
  },
  {
    id: "f056",
    topic: "networking",
    front: "`pathType` trong Ingress có những giá trị nào?",
    back: "`Prefix` (khớp theo tiền tố path), `Exact` (khớp tuyệt đối), `ImplementationSpecific` (tùy Ingress controller quyết định).",
    code: null,
  },
  {
    id: "f057",
    topic: "networking",
    front: "Ingress cần những gì để thực sự hoạt động?",
    back: "Một Ingress controller đang chạy trong cluster + `spec.ingressClassName` đúng tên class. TLS khai qua `spec.tls` trỏ tới Secret type `tls`.",
    code: null,
  },
  {
    id: "f058",
    topic: "networking",
    front: "NetworkPolicy hoạt động theo nguyên tắc gì khi chưa có / đã có policy?",
    back: "Chưa có policy: mọi Pod nói chuyện tự do. Khi Pod bị một policy chọn: chỉ traffic được whitelist mới đi qua. `podSelector: {}` chọn MỌI pod trong namespace → dùng làm default deny.",
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]`,
    },
  },
  {
    id: "f059",
    topic: "networking",
    front: "Bẫy OR vs AND giữa `podSelector` và `namespaceSelector` trong `from:`?",
    back: "Hai item riêng (mỗi cái có dấu `-`) = OR. Gộp chung một item (namespaceSelector + podSelector không có `-` thứ hai) = AND: pod có label X TRONG namespace có label Y.",
    code: null,
  },
  {
    id: "f060",
    topic: "networking",
    front: "Viết egress NetworkPolicy hay quên điều gì khiến Pod \"mất mạng\"?",
    back: "Quên mở DNS — phải cho phép UDP và TCP port 53, nếu không Pod không resolve được tên service nào cả.",
    code: {
      lang: "yaml",
      text: `egress:
- ports:                 # cho phép DNS
  - protocol: UDP
    port: 53
  - protocol: TCP
    port: 53`,
    },
  },

  // ===== storage (f061–f065) =====
  {
    id: "f061",
    topic: "storage",
    front: "`emptyDir` sống bao lâu? Dùng cho việc gì?",
    back: "Tạo khi Pod được gán lên node, mất khi Pod bị XÓA (container restart không làm mất dữ liệu). Dùng làm cache tạm và chia sẻ file giữa các container trong Pod (pattern sidecar).",
    code: null,
  },
  {
    id: "f062",
    topic: "storage",
    front: "Các accessModes của PV/PVC?",
    back: "`ReadWriteOnce` (RWO — 1 node mount đọc/ghi), `ReadOnlyMany` (ROX), `ReadWriteMany` (RWX — nhiều node), `ReadWriteOncePod` (RWOP — đúng 1 pod duy nhất, GA từ K8s 1.29).",
    code: null,
  },
  {
    id: "f063",
    topic: "storage",
    front: "PVC bind được với PV khi thỏa những điều kiện nào?",
    back: "`accessModes` tương thích, `storageClassName` khớp (hoặc cả hai cùng để trống), capacity của PV ≥ storage request của PVC. Sau khi PVC bị xóa, `persistentVolumeReclaimPolicy` (`Retain`/`Delete`) quyết định số phận PV.",
    code: null,
  },
  {
    id: "f064",
    topic: "storage",
    front: "PVC ở trạng thái `Pending` — nguyên nhân thường gặp?",
    back: "Không tìm được PV khớp: kiểm tra `accessModes`, `storageClassName`, size bằng `k get pv,pvc` và `k describe pvc`. Với dynamic provisioning: sai tên StorageClass.",
    code: null,
  },
  {
    id: "f065",
    topic: "storage",
    front: "Mount PVC vào Pod viết thế nào?",
    back: "Khai `volumes.persistentVolumeClaim.claimName` rồi tham chiếu qua `volumeMounts` trong container.",
    code: {
      lang: "yaml",
      text: `spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: mypvc`,
    },
  },

  // ===== helm (f066–f068) =====
  {
    id: "f066",
    topic: "helm",
    front: "Phân biệt Chart, Release và Values trong Helm?",
    back: "Chart: gói template + metadata. Release: một lần cài chart vào cluster với tên riêng. Values: tham số ghi đè template — truyền qua `--set key=val` hoặc `-f custom-values.yaml`.",
    code: null,
  },
  {
    id: "f067",
    topic: "helm",
    front: "`helm template` khác `helm install` thế nào? Xem values của chart bằng gì?",
    back: "`helm template myrelease bitnami/nginx` chỉ render YAML ra stdout, KHÔNG cài vào cluster. `helm show values <chart>` in values mặc định; `helm get values <release>` in values đang dùng.",
    code: null,
  },
  {
    id: "f068",
    topic: "helm",
    front: "Rollback một Helm release về revision cũ làm thế nào?",
    back: "Xem lịch sử revision rồi rollback theo số revision.",
    code: {
      lang: "bash",
      text: `helm history myrelease
helm rollback myrelease 1`,
    },
  },

  // ===== kubectl (f069–f080) =====
  {
    id: "f069",
    topic: "kubectl",
    front: "Lệnh sinh YAML của Pod mà không tạo Pod?",
    back: "`k run nginx --image=nginx $do > pod.yaml` với `$do` = `--dry-run=client -o yaml`. Áp dụng được cho hầu hết lệnh `create`.",
    code: null,
  },
  {
    id: "f070",
    topic: "kubectl",
    front: "Lệnh tạo Deployment 3 replicas (imperative)?",
    back: "`k create deploy web --image=nginx --replicas=3`. Thêm `$do > deploy.yaml` nếu cần chỉnh YAML trước khi apply.",
    code: null,
  },
  {
    id: "f071",
    topic: "kubectl",
    front: "Lệnh update image của Deployment không cần mở YAML?",
    back: "`k set image deploy/web nginx=nginx:1.26` (bên trái dấu `=` là TÊN CONTAINER). Theo dõi bằng `k rollout status deploy/web`.",
    code: null,
  },
  {
    id: "f072",
    topic: "kubectl",
    front: "Lệnh expose Deployment thành Service?",
    back: "`k expose deploy web --port=80 --target-port=8080` (ClusterIP mặc định). Thêm `--type=NodePort` nếu cần truy cập từ ngoài node.",
    code: null,
  },
  {
    id: "f073",
    topic: "kubectl",
    front: "Lệnh tạo ConfigMap và Secret từ literal?",
    back: "Cùng pattern `--from-literal`, Secret cần thêm subcommand `generic`.",
    code: {
      lang: "bash",
      text: `k create cm mycm --from-literal=KEY1=val1
k create secret generic mysecret --from-literal=password=s3cret`,
    },
  },
  {
    id: "f074",
    topic: "kubectl",
    front: "Lệnh tạo Job và CronJob imperative?",
    back: "Job nhận command sau `--`; CronJob cần thêm `--schedule` theo cú pháp cron.",
    code: {
      lang: "bash",
      text: `k create job myjob --image=busybox -- sh -c "echo hello"
k create cronjob mycron --image=busybox --schedule="*/5 * * * *" -- date`,
    },
  },
  {
    id: "f075",
    topic: "kubectl",
    front: "Lệnh tạo Ingress imperative với rule host/path?",
    back: "`k create ingress myingress --rule=\"myapp.com/app*=web-svc:80\" $do > ing.yaml` — dấu `*` sau path tạo pathType Prefix.",
    code: null,
  },
  {
    id: "f076",
    topic: "kubectl",
    front: "Lệnh tạo Role và RoleBinding cho ServiceAccount?",
    back: "Role khai verbs + resources; RoleBinding trỏ `--serviceaccount=<ns>:<sa>`.",
    code: {
      lang: "bash",
      text: `k create role pod-reader --verb=get,list,watch --resource=pods -n dev
k create rolebinding read-pods --role=pod-reader --serviceaccount=dev:mysa -n dev`,
    },
  },
  {
    id: "f077",
    topic: "kubectl",
    front: "Lệnh chạy Pod tạm để test rồi tự xóa?",
    back: "`k run tmp --image=busybox --rm -it --restart=Never -- sh` — `--rm` xóa Pod ngay khi thoát; hay dùng kèm `wget -qO-` để test Service/NetworkPolicy.",
    code: null,
  },
  {
    id: "f078",
    topic: "kubectl",
    front: "Lệnh tra cứu field của resource ngay trong terminal?",
    back: "`k explain pod.spec.containers` xem mô tả field; thêm `--recursive` để liệt kê toàn bộ subfields. Nhanh hơn lục docs khi chỉ quên tên field.",
    code: null,
  },
  {
    id: "f079",
    topic: "kubectl",
    front: "Lệnh chạy Job thủ công từ một CronJob có sẵn?",
    back: "`k create job manual-run --from=cronjob/mycron` — dùng khi đề yêu cầu trigger CronJob ngay lập tức.",
    code: null,
  },
  {
    id: "f080",
    topic: "kubectl",
    front: "Lệnh lọc Pod theo label và sort theo thời gian tạo?",
    back: "`k get pods -l env=prod,tier=frontend` (AND nhiều điều kiện); `k get pods -l 'env in (prod,dev)'` (set-based); `k get pods --sort-by=.metadata.creationTimestamp`.",
    code: null,
  },

  // ===== exam-tips (f081–f084) =====
  {
    id: "f081",
    topic: "exam-tips",
    front: "Alias và hai biến môi trường nên thiết lập ngay đầu giờ thi là gì?",
    back: "`alias k=kubectl`, `$do` để sinh YAML nhanh và `$now` để xóa không chờ grace period.",
    code: {
      lang: "bash",
      text: `alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
k run nginx --image=nginx $do > pod.yaml
k delete pod nginx $now`,
    },
  },
  {
    id: "f082",
    topic: "exam-tips",
    front: "Cấu hình vim nào giúp tránh lỗi indent YAML trong phòng thi?",
    back: "Tab thật trong YAML gây lỗi parse — ép vim dùng 2 space qua `~/.vimrc`.",
    code: {
      lang: "bash",
      text: `echo 'set tabstop=2 expandtab shiftwidth=2' > ~/.vimrc`,
    },
  },
  {
    id: "f083",
    topic: "exam-tips",
    front: "Chiến lược quản lý thời gian cho 2 giờ thi CKAD?",
    back: "~6 phút/câu với 15–20 câu. Lượt 1 (~80 phút): làm hết câu dễ/trung bình, flag câu khó. Lượt 2 (~30 phút): quay lại câu đã flag. ~10 phút cuối: verify. Đừng dành 15 phút cho một câu 4% điểm.",
    code: null,
  },
  {
    id: "f084",
    topic: "exam-tips",
    front: "Điều ĐẦU TIÊN phải làm ở mỗi câu hỏi trong đề thi?",
    back: "Chạy lệnh chuyển context đề bài cho sẵn (`k config use-context <name>`) — quên là 0 điểm câu đó. Làm nhiều thao tác cùng namespace thì đặt luôn namespace mặc định: `k config set-context --current --namespace=<ns>`.",
    code: null,
  },
];
