// Bài lab thực hành — mô phỏng đề thi CKAD (performance-based).
// 22 labs: design 5, deployment 4, observability 4, config 5, networking 4.
// Quy ước: alias `k=kubectl`, `export do="--dry-run=client -o yaml"` như trong CKAD-Cheat-Sheet.
export const labs = [
  // ============================================================
  // DESIGN (Application Design and Build) — lab01..lab05
  // ============================================================
  {
    id: "lab01",
    title: "Pod đa container với init container chờ Service",
    domain: "design",
    difficulty: 2,
    timeLimitMin: 6,
    scenario:
      "Làm việc trong namespace `apx` (tạo nếu chưa có). Team backend yêu cầu một Pod web chỉ được khởi động phần chính sau khi Service của database đã tồn tại và phân giải được DNS trong cluster.",
    tasks: [
      "Tạo namespace `apx` nếu chưa có.",
      "Tạo Pod tên `web-101` dùng image `nginx:1.27-alpine`, có init container tên `wait-db` dùng image `busybox:1.36` chạy vòng lặp `until nslookup db-svc; do sleep 2; done` cho đến khi Service `db-svc` phân giải được DNS.",
      "Xác nhận Pod đang kẹt ở trạng thái `Init:0/1` (vì `db-svc` chưa tồn tại).",
      "Tạo Deployment tên `db` dùng image `redis:7-alpine` trong namespace `apx`, rồi expose thành Service tên `db-svc` port `6379`.",
      "Xác nhận Pod `web-101` chuyển sang trạng thái `Running`.",
    ],
    hints: [
      "Generate YAML nhanh: `k run web-101 --image=nginx:1.27-alpine -n apx $do > pod.yaml` rồi thêm phần `initContainers`.",
      "Init container phải kết thúc thành công (exit 0) thì container chính mới khởi động.",
      "Theo dõi init container bằng `k logs web-101 -c wait-db -n apx`.",
    ],
    solution: `Tạo namespace và generate YAML cho Pod:

\`\`\`bash
k create ns apx
k run web-101 --image=nginx:1.27-alpine -n apx $do > pod.yaml
\`\`\`

Sửa \`pod.yaml\` thêm \`initContainers\` — YAML hoàn chỉnh:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-101
  namespace: apx
  labels:
    run: web-101
spec:
  initContainers:
  - name: wait-db
    image: busybox:1.36
    command: ['sh', '-c', 'until nslookup db-svc; do echo waiting for db-svc; sleep 2; done']
  containers:
  - name: web-101
    image: nginx:1.27-alpine
    ports:
    - containerPort: 80
\`\`\`

Apply và quan sát Pod kẹt ở bước init:

\`\`\`bash
k apply -f pod.yaml
k get pod web-101 -n apx          # STATUS: Init:0/1 — đúng như mong đợi
\`\`\`

Tạo database và Service để init container thoát:

\`\`\`bash
k create deploy db --image=redis:7-alpine -n apx
k expose deploy db --name=db-svc --port=6379 -n apx
\`\`\`

Khi \`db-svc\` phân giải được DNS, \`wait-db\` exit 0 và container chính khởi động.`,
    verify: `\`\`\`bash
k get pod web-101 -n apx
# Trước khi có db-svc: STATUS = Init:0/1
# Sau khi tạo db-svc (chờ ~5-10s): STATUS = Running, READY = 1/1

k logs web-101 -c wait-db -n apx
# Thấy vài dòng "waiting for db-svc" rồi kết quả nslookup thành công

k describe pod web-101 -n apx
# Events: wait-db Started → Finished TRƯỚC khi container web-101 Started
\`\`\``,
  },
  {
    id: "lab02",
    title: "Sidecar chia sẻ emptyDir để stream log file",
    domain: "design",
    difficulty: 2,
    timeLimitMin: 7,
    scenario:
      "Làm việc trong namespace `apx` (tạo nếu chưa có). Một ứng dụng legacy ghi log ra file thay vì stdout, nên `kubectl logs` không thấy gì. Bạn cần thêm sidecar đọc file log và stream ra stdout của nó.",
    tasks: [
      "Tạo Pod tên `app-logs` với container chính tên `app` dùng image `busybox:1.36`, chạy lệnh `sh -c 'while true; do date >> /var/log/app.log; sleep 5; done'`.",
      "Khai báo volume tên `shared-logs` kiểu `emptyDir`, mount vào `/var/log` của container `app`.",
      "Thêm sidecar tên `log-reader` dùng image `busybox:1.36` chạy `sh -c 'tail -f /var/log/app.log'`, mount cùng volume `shared-logs` tại `/var/log`.",
      "Đọc log ứng dụng thông qua sidecar bằng `kubectl logs`.",
      "(Biến thể K8s ≥1.29) Viết lại Pod thành `app-logs-native` dùng native sidecar: chuyển `log-reader` vào `initContainers` với `restartPolicy: Always`.",
    ],
    hints: [
      "Hai container mount CÙNG một volume `emptyDir` thì nhìn thấy chung dữ liệu.",
      "Xem log của một container cụ thể: `k logs app-logs -c log-reader -n apx`.",
      "Native sidecar = entry trong `initContainers` có thêm `restartPolicy: Always` — khởi động trước container chính và sống suốt đời Pod.",
    ],
    solution: `YAML hoàn chỉnh cho pattern sidecar kinh điển:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-logs
  namespace: apx
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ['sh', '-c', 'while true; do date >> /var/log/app.log; sleep 5; done']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  - name: log-reader
    image: busybox:1.36
    command: ['sh', '-c', 'tail -f /var/log/app.log']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
\`\`\`

\`\`\`bash
k apply -f app-logs.yaml
k logs app-logs -c log-reader -n apx     # thấy các dòng date
\`\`\`

Biến thể native sidecar (K8s ≥1.29) — sidecar nằm trong \`initContainers\` với \`restartPolicy: Always\`, đảm bảo khởi động TRƯỚC container chính và không chặn Pod kết thúc:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-logs-native
  namespace: apx
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  initContainers:
  - name: log-reader
    image: busybox:1.36
    restartPolicy: Always          # biến init container thành sidecar
    command: ['sh', '-c', 'touch /var/log/app.log; tail -f /var/log/app.log']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  containers:
  - name: app
    image: busybox:1.36
    command: ['sh', '-c', 'while true; do date >> /var/log/app.log; sleep 5; done']
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
\`\`\``,
    verify: `\`\`\`bash
k get pod app-logs -n apx
# READY = 2/2, STATUS = Running

k logs app-logs -c log-reader -n apx
# Mỗi ~5 giây xuất hiện một dòng dạng: Thu Aug 21 10:15:04 UTC 2026

k exec app-logs -c app -n apx -- tail -3 /var/log/app.log
# Cùng nội dung — chứng minh 2 container chia sẻ volume

k get pod app-logs-native -n apx
# READY = 2/2 (native sidecar được tính vào READY như container thường)
\`\`\``,
  },
  {
    id: "lab03",
    title: "Job với completions, parallelism và backoffLimit",
    domain: "design",
    difficulty: 1,
    timeLimitMin: 5,
    scenario:
      "Làm việc trong namespace `moon` (tạo nếu chưa có). Team data cần một batch job xử lý 6 phần dữ liệu, chạy tối đa 2 pod song song, và cho phép retry tối đa 4 lần khi fail.",
    tasks: [
      "Tạo namespace `moon` nếu chưa có.",
      "Tạo Job tên `batch-compute` dùng image `busybox:1.36`, command `sh -c 'echo processing && sleep 3'`.",
      "Cấu hình `completions: 6`, `parallelism: 2`, `backoffLimit: 4`.",
      "Chờ Job hoàn thành và xác nhận có đúng 6 pod ở trạng thái `Completed`.",
    ],
    hints: [
      "Generate nhanh: `k create job batch-compute --image=busybox:1.36 -n moon $do -- sh -c 'echo processing && sleep 3' > job.yaml` rồi thêm 3 field vào `spec`.",
      "`restartPolicy` trong Job chỉ được là `Never` hoặc `OnFailure` (không được `Always`).",
    ],
    solution: `Generate YAML rồi bổ sung 3 field:

\`\`\`bash
k create ns moon
k create job batch-compute --image=busybox:1.36 -n moon $do -- sh -c 'echo processing && sleep 3' > job.yaml
\`\`\`

YAML hoàn chỉnh:

\`\`\`yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-compute
  namespace: moon
spec:
  completions: 6        # cần 6 lần chạy thành công
  parallelism: 2        # tối đa 2 pod song song
  backoffLimit: 4       # retry tối đa 4 lần khi fail
  template:
    spec:
      containers:
      - name: batch-compute
        image: busybox:1.36
        command: ['sh', '-c', 'echo processing && sleep 3']
      restartPolicy: Never
\`\`\`

\`\`\`bash
k apply -f job.yaml
k get job batch-compute -n moon -w     # theo dõi COMPLETIONS tăng dần
\`\`\``,
    verify: `\`\`\`bash
k get job batch-compute -n moon
# COMPLETIONS = 6/6, STATUS = Complete

k get pods -n moon -l job-name=batch-compute
# 6 pod, tất cả STATUS = Completed
# (trong lúc chạy: tối đa 2 pod Running cùng lúc — đúng parallelism)

k logs -n moon -l job-name=batch-compute --tail=1
# Mỗi pod in ra: processing
\`\`\``,
  },
  {
    id: "lab04",
    title: "CronJob backup với concurrencyPolicy",
    domain: "design",
    difficulty: 1,
    timeLimitMin: 5,
    scenario:
      "Làm việc trong namespace `moon` (tạo nếu chưa có). Cần lập lịch backup định kỳ, không cho phép 2 lần backup chạy chồng lên nhau, và phải kiểm chứng ngay mà không cần chờ tới giờ chạy.",
    tasks: [
      "Tạo CronJob tên `db-backup` trong namespace `moon` dùng image `busybox:1.36`, schedule `*/10 * * * *` (mỗi 10 phút), command `sh -c 'date; echo backup done'`.",
      "Cấu hình `concurrencyPolicy: Forbid` và `successfulJobsHistoryLimit: 3`.",
      "Không chờ 10 phút: trigger chạy tay một Job tên `backup-manual` từ CronJob này và xác nhận log in ra `backup done`.",
    ],
    hints: [
      "Generate: `k create cronjob db-backup --image=busybox:1.36 --schedule='*/10 * * * *' -n moon $do -- sh -c 'date; echo backup done'` rồi thêm 2 field vào `spec`.",
      "Chạy tay từ CronJob: `k create job <tên> --from=cronjob/<tên-cronjob>`.",
    ],
    solution: `Generate YAML rồi bổ sung 2 field cấp CronJob spec:

\`\`\`bash
k create cronjob db-backup --image=busybox:1.36 --schedule='*/10 * * * *' \\
  -n moon $do -- sh -c 'date; echo backup done' > cj.yaml
\`\`\`

YAML hoàn chỉnh:

\`\`\`yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: moon
spec:
  schedule: "*/10 * * * *"
  concurrencyPolicy: Forbid            # không cho 2 job chạy chồng nhau
  successfulJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: db-backup
            image: busybox:1.36
            command: ['sh', '-c', 'date; echo backup done']
          restartPolicy: OnFailure
\`\`\`

Apply và trigger chạy tay:

\`\`\`bash
k apply -f cj.yaml
k create job backup-manual --from=cronjob/db-backup -n moon
\`\`\``,
    verify: `\`\`\`bash
k get cj db-backup -n moon
# SCHEDULE = */10 * * * *, SUSPEND = False

k get cj db-backup -n moon -o jsonpath='{.spec.concurrencyPolicy}'
# Forbid

k get job backup-manual -n moon
# COMPLETIONS = 1/1

k logs -n moon -l job-name=backup-manual
# In ra ngày giờ hiện tại, sau đó dòng: backup done
\`\`\``,
  },
  {
    id: "lab05",
    title: "PersistentVolume, PVC và mount vào Pod",
    domain: "design",
    difficulty: 3,
    timeLimitMin: 8,
    scenario:
      "Làm việc trong namespace `earth` (tạo nếu chưa có). Ứng dụng ghi log cần lưu trữ bền vững: bạn phải tạo PersistentVolume kiểu hostPath, claim nó bằng PVC, và mount vào Pod. PV/PVC phải bind được với nhau (khớp accessModes, storageClassName, dung lượng).",
    tasks: [
      "Tạo PersistentVolume tên `pv-log` (PV là tài nguyên cluster, không thuộc namespace): capacity `100Mi`, accessModes `ReadWriteOnce`, `storageClassName: manual`, hostPath `/mnt/pv-log`.",
      "Tạo PersistentVolumeClaim tên `pvc-log` trong namespace `earth`: request `50Mi`, accessModes `ReadWriteOnce`, `storageClassName: manual`.",
      "Xác nhận PVC ở trạng thái `Bound` với PV `pv-log`.",
      "Tạo Pod tên `log-writer` dùng image `busybox:1.36` chạy `sh -c 'while true; do date >> /data/out.log; sleep 5; done'`, mount PVC `pvc-log` vào đường dẫn `/data`.",
    ],
    hints: [
      "Không có lệnh imperative cho PV/PVC — viết YAML tay (tra field bằng `k explain pv.spec` / `k explain pvc.spec`).",
      "PVC `Pending` = không tìm được PV khớp: kiểm tra accessModes, storageClassName và size (PVC ≤ capacity PV).",
      "Trong Pod, volume tham chiếu PVC qua `persistentVolumeClaim.claimName`.",
    ],
    solution: `\`\`\`bash
k create ns earth
\`\`\`

\`pv.yaml\` — PersistentVolume:

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-log
spec:
  capacity:
    storage: 100Mi
  accessModes: ["ReadWriteOnce"]
  storageClassName: manual
  hostPath:
    path: /mnt/pv-log
\`\`\`

\`pvc.yaml\` — PersistentVolumeClaim (phải khớp accessModes + storageClassName, size ≤ 100Mi):

\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-log
  namespace: earth
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: manual
  resources:
    requests:
      storage: 50Mi
\`\`\`

\`pod.yaml\` — Pod mount PVC:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: log-writer
  namespace: earth
spec:
  containers:
  - name: log-writer
    image: busybox:1.36
    command: ['sh', '-c', 'while true; do date >> /data/out.log; sleep 5; done']
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: pvc-log
\`\`\`

\`\`\`bash
k apply -f pv.yaml -f pvc.yaml -f pod.yaml
\`\`\``,
    verify: `\`\`\`bash
k get pv pv-log
# STATUS = Bound, CLAIM = earth/pvc-log

k get pvc pvc-log -n earth
# STATUS = Bound, VOLUME = pv-log, CAPACITY = 100Mi

k get pod log-writer -n earth
# STATUS = Running

k exec log-writer -n earth -- tail -3 /data/out.log
# Các dòng date, mỗi 5 giây thêm 1 dòng — dữ liệu đang được ghi vào PV
\`\`\``,
  },

  // ============================================================
  // DEPLOYMENT (Application Deployment) — lab06..lab09
  // ============================================================
  {
    id: "lab06",
    title: "Rolling update với maxSurge/maxUnavailable, pause và resume",
    domain: "deployment",
    difficulty: 2,
    timeLimitMin: 7,
    scenario:
      "Làm việc trong namespace `sun` (tạo nếu chưa có). Deployment web cần chiến lược update không downtime (không pod cũ nào bị xóa trước khi pod mới Ready), và bạn phải tạm dừng rollout giữa chừng để kiểm tra trước khi cho chạy tiếp.",
    tasks: [
      "Tạo Deployment tên `web-rollout` dùng image `nginx:1.26-alpine`, `replicas: 4` trong namespace `sun`.",
      "Cấu hình strategy `RollingUpdate` với `maxSurge: 1` và `maxUnavailable: 0`.",
      "Update image sang `nginx:1.27-alpine`, ngay lập tức `pause` rollout và kiểm tra trạng thái đang dở dang (tồn tại cả pod cũ lẫn pod mới).",
      "`resume` rollout, chờ hoàn tất, và xác nhận lịch sử rollout có 2 revision.",
    ],
    hints: [
      "`maxUnavailable: 0` = luôn giữ đủ 4 pod Ready; `maxSurge: 1` = được phép dư tối đa 1 pod trong lúc update.",
      "Cặp lệnh cần nhớ: `k rollout pause deploy/web-rollout` và `k rollout resume deploy/web-rollout`.",
      "Xem lịch sử: `k rollout history deploy/web-rollout -n sun`.",
    ],
    solution: `Generate YAML và thêm strategy:

\`\`\`bash
k create ns sun
k create deploy web-rollout --image=nginx:1.26-alpine --replicas=4 -n sun $do > deploy.yaml
\`\`\`

YAML hoàn chỉnh (phần quan trọng là \`strategy\`):

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-rollout
  namespace: sun
  labels:
    app: web-rollout
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-rollout
  template:
    metadata:
      labels:
        app: web-rollout
    spec:
      containers:
      - name: nginx
        image: nginx:1.26-alpine
\`\`\`

Update image, pause giữa chừng rồi resume:

\`\`\`bash
k apply -f deploy.yaml
k rollout status deploy/web-rollout -n sun      # chờ 4/4 Ready

k set image deploy/web-rollout nginx=nginx:1.27-alpine -n sun
k rollout pause deploy/web-rollout -n sun

k get pods -n sun -l app=web-rollout            # thấy lẫn pod cũ + pod mới, rollout đứng yên
k get rs -n sun                                 # 2 ReplicaSet, cái mới chưa scale hết

k rollout resume deploy/web-rollout -n sun
k rollout status deploy/web-rollout -n sun      # chạy tiếp đến khi hoàn tất
k rollout history deploy/web-rollout -n sun
\`\`\``,
    verify: `\`\`\`bash
k get deploy web-rollout -n sun -o jsonpath='{.spec.strategy.rollingUpdate}'
# {"maxSurge":1,"maxUnavailable":0}

k rollout status deploy/web-rollout -n sun
# deployment "web-rollout" successfully rolled out

k rollout history deploy/web-rollout -n sun
# REVISION 1 và 2

k get deploy web-rollout -n sun -o jsonpath='{.spec.template.spec.containers[0].image}'
# nginx:1.27-alpine

k get rs -n sun
# ReplicaSet cũ DESIRED = 0, ReplicaSet mới DESIRED = 4
\`\`\``,
  },
  {
    id: "lab07",
    title: "Canary deployment bằng labels và Service chung",
    domain: "deployment",
    difficulty: 3,
    timeLimitMin: 9,
    scenario:
      "Làm việc trong namespace `sun` (tạo nếu chưa có). Ứng dụng `web` đang chạy phiên bản v1. Hãy triển khai canary v2 nhận khoảng 20% traffic bằng tỷ lệ replica (4 pod v1 : 1 pod v2), cả hai phiên bản đứng sau CÙNG một Service.",
    tasks: [
      "Tạo Deployment `web-v1`: image `nginx:1.26-alpine`, `replicas: 4`, pod labels `app=web` và `version=v1`.",
      "Tạo Service `web-svc` (ClusterIP, port 80) với selector CHỈ gồm `app=web` (không chứa `version`).",
      "Tạo Deployment canary `web-v2`: image `nginx:1.27-alpine`, `replicas: 1`, pod labels `app=web` và `version=v2`.",
      "Xác nhận Service có đúng 5 endpoints — tức ~80% traffic vào v1, ~20% vào v2 theo tỷ lệ pod.",
      "Kiểm chứng bằng cách gọi Service nhiều lần từ pod tạm và quan sát header `Server:` trả về lẫn cả `nginx/1.26.x` và `nginx/1.27.x`.",
    ],
    hints: [
      "Selector của Service KHÔNG được chứa `version` — nếu có, nó chỉ chọn được 1 phiên bản.",
      "Sửa labels của Deployment thì phải sửa đồng bộ cả `spec.selector.matchLabels` lẫn `spec.template.metadata.labels`.",
      "`wget -S` in header ra stderr: `wget -q -S -O /dev/null http://web-svc 2>&1 | grep Server`.",
    ],
    solution: `\`web-v1.yaml\`:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v1
  namespace: sun
spec:
  replicas: 4
  selector:
    matchLabels:
      app: web
      version: v1
  template:
    metadata:
      labels:
        app: web
        version: v1
    spec:
      containers:
      - name: nginx
        image: nginx:1.26-alpine
\`\`\`

\`web-v2.yaml\` (canary — chỉ khác name, replicas, version, image):

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-v2
  namespace: sun
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
      version: v2
  template:
    metadata:
      labels:
        app: web
        version: v2
    spec:
      containers:
      - name: nginx
        image: nginx:1.27-alpine
\`\`\`

\`web-svc.yaml\` — selector chỉ có \`app: web\` nên nhận pod của CẢ 2 Deployment:

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
  namespace: sun
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
\`\`\`

\`\`\`bash
k apply -f web-v1.yaml -f web-v2.yaml -f web-svc.yaml

# Test phân phối traffic từ pod tạm:
k run tmp --image=busybox:1.36 --rm -it --restart=Never -n sun -- sh -c \\
  'for i in 1 2 3 4 5 6 7 8 9 10; do wget -q -S -O /dev/null http://web-svc 2>&1 | grep Server; done'
\`\`\`

Muốn tăng dần canary: \`k scale deploy web-v2 --replicas=2 -n sun\` (và giảm v1 tương ứng) — Service tự cập nhật endpoints.`,
    verify: `\`\`\`bash
k get endpoints web-svc -n sun
# ENDPOINTS chứa đúng 5 địa chỉ IP (4 pod v1 + 1 pod v2)

k get pods -n sun -l app=web --show-labels
# 5 pod: 4 pod version=v1, 1 pod version=v2

# Kết quả vòng lặp wget (10 lần gọi):
# Server: nginx/1.26.x xuất hiện ~8 lần, Server: nginx/1.27.x xuất hiện ~2 lần
# (tỷ lệ xấp xỉ 80/20, không cần chính xác tuyệt đối)
\`\`\``,
  },
  {
    id: "lab08",
    title: "Helm install và upgrade với --set",
    domain: "deployment",
    difficulty: 2,
    timeLimitMin: 6,
    scenario:
      "Cluster đã cài sẵn Helm v3. Triển khai nginx từ chart `bitnami/nginx` vào namespace `mercury` và nâng cấp release bằng cách override giá trị với `--set`.",
    tasks: [
      "Thêm repo tên `bitnami` từ URL `https://charts.bitnami.com/bitnami` và update repo.",
      "Cài release tên `webserver` từ chart `bitnami/nginx` vào namespace `mercury` (tạo namespace ngay khi cài) với `replicaCount=2`.",
      "Upgrade release `webserver` với `replicaCount=3`.",
      "Xác nhận release có 2 revision và Deployment tương ứng có 3 replicas Ready.",
    ],
    hints: [
      "`helm install ... -n mercury --create-namespace --set replicaCount=2`.",
      "Xem values đang áp dụng cho release: `helm get values webserver -n mercury`.",
      "Lịch sử revision: `helm history webserver -n mercury`.",
    ],
    solution: `\`\`\`bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Cài với replicaCount=2, tạo namespace luôn:
helm install webserver bitnami/nginx -n mercury --create-namespace --set replicaCount=2

helm list -n mercury                 # STATUS deployed, REVISION 1
k get pods -n mercury                # 2 pod webserver-nginx

# Upgrade lên 3 replicas:
helm upgrade webserver bitnami/nginx -n mercury --set replicaCount=3
\`\`\`

Lưu ý thi thật: nếu cần rollback thì \`helm rollback webserver 1 -n mercury\`; muốn xem values mặc định của chart thì \`helm show values bitnami/nginx\`.`,
    verify: `\`\`\`bash
helm list -n mercury
# NAME = webserver, REVISION = 2, STATUS = deployed

helm history webserver -n mercury
# 2 dòng: revision 1 (install) và revision 2 (upgrade), cả hai superseded/deployed

helm get values webserver -n mercury
# replicaCount: 3

k get deploy -n mercury
# webserver-nginx READY = 3/3
\`\`\``,
  },
  {
    id: "lab09",
    title: "Kustomize overlay cho môi trường prod",
    domain: "deployment",
    difficulty: 3,
    timeLimitMin: 8,
    scenario:
      "Xây dựng cấu trúc Kustomize gồm `base` và overlay `prod` cho ứng dụng `myapp`, rồi apply overlay vào namespace `mars` (tạo nếu chưa có). Overlay phải đổi tên (prefix), số replica, image tag và namespace mà KHÔNG sửa file nào trong `base`.",
    tasks: [
      "Tạo thư mục `base/` chứa: `deployment.yaml` (Deployment `myapp`, image `nginx:1.26-alpine`, 1 replica, label `app=myapp`), `service.yaml` (Service `myapp`, port 80, selector `app=myapp`) và `kustomization.yaml` liệt kê 2 resource đó.",
      "Tạo `overlays/prod/kustomization.yaml` tham chiếu `base`: đặt `namespace: mars`, `namePrefix: prod-`, tăng replicas của `myapp` lên `3`, đổi image tag sang `1.27-alpine`.",
      "Render xem trước bằng `kubectl kustomize`, tạo namespace `mars`, rồi apply overlay bằng `kubectl apply -k`.",
      "Xác nhận trong `mars` có Deployment `prod-myapp` với 3 replicas chạy image `nginx:1.27-alpine` và Service `prod-myapp`.",
    ],
    hints: [
      "Các field cần trong overlay: `resources: [../../base]`, `namespace`, `namePrefix`, `replicas`, `images`.",
      "`k kustomize overlays/prod` để render xem trước, `k apply -k overlays/prod` để apply.",
      "Generate YAML cho base bằng `k create deploy ... $do` và `k create svc clusterip ... $do` cho nhanh.",
    ],
    solution: `Tạo cấu trúc thư mục và generate YAML base:

\`\`\`bash
mkdir -p kustom/base kustom/overlays/prod
cd kustom
k create deploy myapp --image=nginx:1.26-alpine $do > base/deployment.yaml
k create svc clusterip myapp --tcp=80:80 $do > base/service.yaml
# Sửa selector của service thành app=myapp cho khớp label deployment
\`\`\`

\`base/kustomization.yaml\`:

\`\`\`yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
\`\`\`

\`overlays/prod/kustomization.yaml\`:

\`\`\`yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: mars
namePrefix: prod-
replicas:
- name: myapp
  count: 3
images:
- name: nginx
  newTag: "1.27-alpine"
\`\`\`

Render, tạo namespace và apply:

\`\`\`bash
k kustomize overlays/prod        # xem trước: tên đã thành prod-myapp, replicas 3, tag 1.27-alpine
k create ns mars
k apply -k overlays/prod
\`\`\``,
    verify: `\`\`\`bash
k get deploy,svc -n mars
# deployment.apps/prod-myapp   READY 3/3
# service/prod-myapp           ClusterIP, PORT 80/TCP

k get deploy prod-myapp -n mars -o jsonpath='{.spec.template.spec.containers[0].image}'
# nginx:1.27-alpine

k kustomize overlays/prod | grep -E 'name:|replicas:|image:'
# Xác nhận render đúng trước khi apply (prod-myapp, replicas: 3, nginx:1.27-alpine)
\`\`\``,
  },

  // ============================================================
  // OBSERVABILITY (Application Observability and Maintenance) — lab10..lab13
  // ============================================================
  {
    id: "lab10",
    title: "Sửa Deployment hỏng bằng rollout undo",
    domain: "observability",
    difficulty: 1,
    timeLimitMin: 5,
    scenario:
      "Làm việc trong namespace `venus` (tạo nếu chưa có). Mô phỏng sự cố thường gặp trong đề thi: một lần update image sai khiến Deployment kẹt rollout — nhiệm vụ của bạn là quan sát triệu chứng rồi rollback.",
    tasks: [
      "Tạo Deployment `api` dùng image `nginx:1.26-alpine`, `replicas: 3` trong namespace `venus` và chờ tất cả pod Ready.",
      "Mô phỏng lỗi: update image của Deployment sang `nginx:1.99-nonexist`.",
      "Quan sát: pod mới bị `ErrImagePull`/`ImagePullBackOff`, rollout kẹt không hoàn thành.",
      "Rollback về revision trước đó và xác nhận cả 3 pod Ready trở lại với image `nginx:1.26-alpine`.",
    ],
    hints: [
      "`k describe pod <pod-lỗi> -n venus` — đọc phần Events ở cuối để thấy lý do pull image thất bại.",
      "`k rollout undo deploy/api -n venus` quay về revision liền trước.",
    ],
    solution: `\`\`\`bash
k create ns venus
k create deploy api --image=nginx:1.26-alpine --replicas=3 -n venus
k rollout status deploy/api -n venus            # chờ: successfully rolled out

# Mô phỏng lỗi (container tên nginx do kubectl tự đặt theo image):
k set image deploy/api nginx=nginx:1.99-nonexist -n venus

# Quan sát triệu chứng:
k get pods -n venus                             # pod mới: ErrImagePull / ImagePullBackOff
k describe pod -n venus -l app=api | tail -15   # Events: Failed to pull image "nginx:1.99-nonexist"
k rollout status deploy/api -n venus            # kẹt: 1 out of 3 new replicas have been updated...

# Rollback:
k rollout undo deploy/api -n venus
k rollout status deploy/api -n venus            # successfully rolled out
\`\`\`

Lưu ý: nhờ mặc định \`maxUnavailable: 25%\`, các pod cũ vẫn phục vụ trong lúc pod mới lỗi — đây là lý do rollout "kẹt" chứ không sập hẳn.`,
    verify: `\`\`\`bash
k get pods -n venus -l app=api
# 3 pod STATUS = Running, READY = 1/1, không còn pod ImagePullBackOff

k get deploy api -n venus -o jsonpath='{.spec.template.spec.containers[0].image}'
# nginx:1.26-alpine

k rollout history deploy/api -n venus
# Có revision mới nhất (3) chính là bản rollback từ revision 1
\`\`\``,
  },
  {
    id: "lab11",
    title: "Liveness và readiness probe với tham số cụ thể",
    domain: "observability",
    difficulty: 2,
    timeLimitMin: 6,
    scenario:
      "Làm việc trong namespace `venus` (tạo nếu chưa có). Ứng dụng cần: liveness probe qua HTTP để restart khi treo, và readiness probe qua file cờ — pod chỉ nhận traffic khi file `/tmp/ready` tồn tại.",
    tasks: [
      "Tạo Pod `probe-pod` dùng image `nginx:1.27-alpine` trong namespace `venus`.",
      "Thêm `livenessProbe` kiểu `httpGet` path `/` port `80` với: `initialDelaySeconds: 5`, `periodSeconds: 10`, `failureThreshold: 3`.",
      "Thêm `readinessProbe` kiểu `exec` chạy lệnh `cat /tmp/ready` với: `initialDelaySeconds: 5`, `periodSeconds: 5`.",
      "Xác nhận Pod `Running` nhưng `READY 0/1` (vì file `/tmp/ready` chưa tồn tại).",
      "Tạo file `/tmp/ready` bên trong container và xác nhận Pod chuyển sang `READY 1/1`.",
    ],
    hints: [
      "Readiness fail KHÔNG restart container — chỉ loại pod khỏi Service endpoints; liveness fail mới restart.",
      "Tạo file cờ: `k exec probe-pod -n venus -- touch /tmp/ready`.",
    ],
    solution: `Generate khung rồi thêm 2 probe — YAML hoàn chỉnh:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-pod
  namespace: venus
  labels:
    run: probe-pod
spec:
  containers:
  - name: probe-pod
    image: nginx:1.27-alpine
    ports:
    - containerPort: 80
    livenessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      exec:
        command: ['cat', '/tmp/ready']
      initialDelaySeconds: 5
      periodSeconds: 5
\`\`\`

\`\`\`bash
k apply -f probe-pod.yaml
k get pod probe-pod -n venus          # Running nhưng READY 0/1

# Bật cờ ready:
k exec probe-pod -n venus -- touch /tmp/ready
k get pod probe-pod -n venus -w       # trong ~5s chuyển READY 1/1
\`\`\``,
    verify: `\`\`\`bash
# Trước khi touch:
k get pod probe-pod -n venus
# STATUS = Running, READY = 0/1

k describe pod probe-pod -n venus | grep -A3 Conditions
# Ready = False
# Events có dòng: Readiness probe failed: cat: can't open '/tmp/ready'

# Sau khi touch /tmp/ready (chờ tối đa 5s — periodSeconds):
k get pod probe-pod -n venus
# READY = 1/1

k get pod probe-pod -n venus -o jsonpath='{.spec.containers[0].livenessProbe.failureThreshold}'
# 3
\`\`\``,
  },
  {
    id: "lab12",
    title: "Debug Pod CrashLoopBackOff từ manifest hỏng",
    domain: "observability",
    difficulty: 3,
    timeLimitMin: 8,
    scenario: `Làm việc trong namespace \`neptune\` (tạo nếu chưa có). Một đồng nghiệp để lại manifest dưới đây (lưu thành file \`orders-api.yaml\`) nhưng Pod không bao giờ chạy ổn định. Hãy apply nguyên trạng, chẩn đoán và sửa TẤT CẢ các lỗi.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: orders-api
  namespace: neptune
spec:
  containers:
  - name: main
    image: busybox:1.99
    command: ["sh", "-c", "echo starting && slep 3600"]
\`\`\``,
    tasks: [
      "Tạo namespace `neptune`, lưu manifest như đề bài thành `orders-api.yaml` và apply.",
      "Chẩn đoán lỗi thứ nhất qua `kubectl describe` (trạng thái `ErrImagePull`/`ImagePullBackOff`) và sửa image về tag hợp lệ `busybox:1.36`.",
      "Chẩn đoán lỗi thứ hai: Pod chuyển sang `CrashLoopBackOff` — dùng log của lần chạy đã crash để tìm nguyên nhân.",
      "Sửa manifest và thay thế Pod sao cho trạng thái ổn định `Running`, container thực thi `sleep 3600`.",
    ],
    hints: [
      "Quy trình chuẩn: `k get pod` → `k describe pod` (đọc Events) → `k logs --previous`.",
      "`spec.containers[].command` của Pod là immutable — sửa file rồi `k replace -f orders-api.yaml --force`.",
      "`sh: slep: not found` → exit code 127 → kubelet restart theo backoff → CrashLoopBackOff.",
    ],
    solution: `**Bước 1 — apply và quan sát lỗi image:**

\`\`\`bash
k create ns neptune
k apply -f orders-api.yaml
k get pod orders-api -n neptune
# STATUS: ErrImagePull rồi ImagePullBackOff

k describe pod orders-api -n neptune | tail -10
# Events: Failed to pull image "busybox:1.99": ... not found
\`\`\`

Sửa image trong file thành \`busybox:1.36\` (image là field mutable nên có thể sửa nhanh bằng \`k set image pod/orders-api main=busybox:1.36 -n neptune\`).

**Bước 2 — lỗi thứ hai lộ ra:**

\`\`\`bash
k get pod orders-api -n neptune
# STATUS: CrashLoopBackOff, RESTARTS tăng dần

k logs orders-api -n neptune --previous
# starting
# sh: slep: not found        ← nguyên nhân: gõ nhầm "slep" thay vì "sleep"
\`\`\`

**Bước 3 — sửa command (immutable → phải thay thế Pod):**

\`orders-api.yaml\` sau khi sửa cả 2 lỗi:

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: orders-api
  namespace: neptune
spec:
  containers:
  - name: main
    image: busybox:1.36
    command: ["sh", "-c", "echo starting && sleep 3600"]
\`\`\`

\`\`\`bash
k replace -f orders-api.yaml --force     # xóa pod cũ + tạo lại
\`\`\``,
    verify: `\`\`\`bash
k get pod orders-api -n neptune
# STATUS = Running, READY = 1/1, RESTARTS = 0 (và không tăng sau 1-2 phút)

k logs orders-api -n neptune
# starting

k get pod orders-api -n neptune -o jsonpath='{.spec.containers[0].image}'
# busybox:1.36
\`\`\``,
  },
  {
    id: "lab13",
    title: "Trích xuất logs và JSONPath ra file",
    domain: "observability",
    difficulty: 1,
    timeLimitMin: 4,
    scenario:
      "Làm việc trong namespace `neptune` (tạo nếu chưa có). Team SRE cần bạn trích xuất thông tin runtime ra file để báo cáo — dạng câu hỏi lấy điểm nhanh rất hay gặp trong đề CKAD.",
    tasks: [
      "Tạo Pod `counter` dùng image `busybox:1.36` chạy lệnh `sh -c 'i=1; while true; do echo count $i; i=$((i+1)); sleep 2; done'`.",
      "Lưu toàn bộ log hiện tại của `counter` vào file `/opt/ckad/counter.log` (tạo thư mục nếu chưa có).",
      "Dùng JSONPath liệt kê image của TẤT CẢ pod trong namespace `neptune` (mỗi dòng một image), ghi vào `/opt/ckad/images.txt`.",
      "In danh sách pod với đúng 2 cột `NAME` và `IMAGE` bằng custom-columns.",
    ],
    hints: [
      "Log ra file chỉ là redirect của shell: `k logs counter -n neptune > file`.",
      "Khung JSONPath lặp: `{range .items[*]}{.spec.containers[0].image}{\"\\n\"}{end}`.",
    ],
    solution: `\`\`\`bash
k create ns neptune    # bỏ qua nếu đã có
k run counter --image=busybox:1.36 -n neptune -- sh -c 'i=1; while true; do echo count $i; i=$((i+1)); sleep 2; done'
k get pod counter -n neptune          # chờ Running

# Log ra file:
sudo mkdir -p /opt/ckad
k logs counter -n neptune > /opt/ckad/counter.log

# JSONPath — image của mọi pod, mỗi dòng một image:
k get pods -n neptune -o jsonpath='{range .items[*]}{.spec.containers[0].image}{"\\n"}{end}' > /opt/ckad/images.txt

# Custom-columns:
k get pods -n neptune -o custom-columns='NAME:.metadata.name,IMAGE:.spec.containers[0].image'
\`\`\``,
    verify: `\`\`\`bash
head -3 /opt/ckad/counter.log
# count 1
# count 2
# count 3

cat /opt/ckad/images.txt
# busybox:1.36
# (kèm image của các pod khác trong neptune nếu có, ví dụ orders-api của lab12)

k get pods -n neptune -o custom-columns='NAME:.metadata.name,IMAGE:.spec.containers[0].image'
# NAME      IMAGE
# counter   busybox:1.36
\`\`\``,
  },

  // ============================================================
  // CONFIG (Application Environment, Configuration and Security) — lab14..lab18
  // ============================================================
  {
    id: "lab14",
    title: "ConfigMap từ literal + file, inject qua envFrom và volume",
    domain: "config",
    difficulty: 2,
    timeLimitMin: 7,
    scenario:
      "Làm việc trong namespace `saturn` (tạo nếu chưa có). Ứng dụng cần cấu hình từ 2 nguồn: một biến môi trường đơn giản và một file cấu hình UI — tất cả gói trong MỘT ConfigMap, inject vào Pod bằng cả hai cách.",
    tasks: [
      "Tạo namespace `saturn`. Trên máy làm bài, tạo file `ui.properties` gồm đúng 2 dòng: `color=blue` và `mode=dark`.",
      "Tạo ConfigMap `app-config` từ literal `APP_MODE=production` VÀ từ file `ui.properties`.",
      "Tạo Pod `cfg-pod` dùng image `busybox:1.36` chạy `sleep 3600`: inject toàn bộ ConfigMap qua `envFrom` VÀ mount ConfigMap thành volume tại `/etc/ui`.",
      "Xác nhận trong container: biến môi trường `APP_MODE=production` tồn tại và file `/etc/ui/ui.properties` có đúng nội dung.",
    ],
    hints: [
      "Một lệnh tạo được cả hai: `k create cm app-config --from-literal=... --from-file=... -n saturn`.",
      "`envFrom` + `configMapRef` đưa mọi key thành env; volume `configMap` đưa mọi key thành file.",
      "Key `ui.properties` chứa dấu chấm — không phải tên biến môi trường hợp lệ nên bị bỏ qua ở envFrom (chỉ xuất hiện dưới dạng file). Đây là hành vi đúng, không phải lỗi.",
    ],
    solution: `\`\`\`bash
k create ns saturn
printf 'color=blue\\nmode=dark\\n' > ui.properties

k create cm app-config -n saturn \\
  --from-literal=APP_MODE=production \\
  --from-file=ui.properties
\`\`\`

YAML hoàn chỉnh cho Pod (\`cfg-pod.yaml\`):

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: cfg-pod
  namespace: saturn
spec:
  containers:
  - name: cfg-pod
    image: busybox:1.36
    command: ['sleep', '3600']
    envFrom:
    - configMapRef:
        name: app-config
    volumeMounts:
    - name: config-vol
      mountPath: /etc/ui
  volumes:
  - name: config-vol
    configMap:
      name: app-config
\`\`\`

\`\`\`bash
k apply -f cfg-pod.yaml
\`\`\`

Ghi chú: key \`ui.properties\` không thành env var được (tên chứa dấu chấm) — kubelet bỏ qua và ghi một Event cảnh báo, nhưng Pod vẫn chạy bình thường; nó vẫn xuất hiện đầy đủ dưới dạng file trong volume.`,
    verify: `\`\`\`bash
k get cm app-config -n saturn -o yaml
# data có 2 key: APP_MODE và ui.properties

k exec cfg-pod -n saturn -- env | grep APP_MODE
# APP_MODE=production

k exec cfg-pod -n saturn -- cat /etc/ui/ui.properties
# color=blue
# mode=dark

k exec cfg-pod -n saturn -- ls /etc/ui
# APP_MODE  ui.properties   (mọi key đều thành file trong volume)
\`\`\``,
  },
  {
    id: "lab15",
    title: "Secret: tạo, mount và decode",
    domain: "config",
    difficulty: 1,
    timeLimitMin: 5,
    scenario:
      "Làm việc trong namespace `saturn` (tạo nếu chưa có). Ứng dụng cần credentials của database dưới dạng file read-only trong container, và bạn phải chứng minh được cách decode giá trị Secret từ bên ngoài.",
    tasks: [
      "Tạo Secret generic tên `db-cred` trong namespace `saturn` với 2 key: `user=admin` và `password=S3cret123`.",
      "Tạo Pod `sec-pod` dùng image `busybox:1.36` chạy `sleep 3600`, mount Secret tại `/etc/creds` với `readOnly: true`.",
      "Decode giá trị `password` từ Secret chỉ bằng `kubectl` + `base64` (KHÔNG exec vào pod).",
    ],
    hints: [
      "`k create secret generic db-cred --from-literal=... --from-literal=... -n saturn`.",
      "Decode: `k get secret db-cred -o jsonpath='{.data.password}' | base64 -d`.",
    ],
    solution: `\`\`\`bash
k create ns saturn    # bỏ qua nếu đã có
k create secret generic db-cred -n saturn \\
  --from-literal=user=admin \\
  --from-literal=password=S3cret123
\`\`\`

YAML hoàn chỉnh cho Pod (\`sec-pod.yaml\`):

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: sec-pod
  namespace: saturn
spec:
  containers:
  - name: sec-pod
    image: busybox:1.36
    command: ['sleep', '3600']
    volumeMounts:
    - name: creds
      mountPath: /etc/creds
      readOnly: true
  volumes:
  - name: creds
    secret:
      secretName: db-cred
\`\`\`

\`\`\`bash
k apply -f sec-pod.yaml

# Decode không cần exec:
k get secret db-cred -n saturn -o jsonpath='{.data.password}' | base64 -d
# S3cret123
\`\`\``,
    verify: `\`\`\`bash
k get secret db-cred -n saturn
# TYPE = Opaque, DATA = 2

k exec sec-pod -n saturn -- ls /etc/creds
# password  user

k exec sec-pod -n saturn -- cat /etc/creds/password
# S3cret123   (trong container file đã ở dạng plaintext)

k get secret db-cred -n saturn -o jsonpath='{.data.password}' | base64 -d
# S3cret123
\`\`\``,
  },
  {
    id: "lab16",
    title: "SecurityContext: runAsUser, readOnlyRootFilesystem, drop capabilities",
    domain: "config",
    difficulty: 2,
    timeLimitMin: 6,
    scenario:
      "Làm việc trong namespace `saturn` (tạo nếu chưa có). Team security yêu cầu Pod chạy non-root, filesystem gốc read-only và bỏ toàn bộ Linux capabilities — cấu hình đúng vị trí pod-level và container-level.",
    tasks: [
      "Tạo Pod `secure-app` trong namespace `saturn` dùng image `busybox:1.36` chạy `sleep 3600`.",
      "SecurityContext pod-level: `runAsUser: 1000`, `fsGroup: 2000`.",
      "SecurityContext container-level: `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, capabilities `drop: [ALL]`.",
      "Xác nhận process trong container chạy với uid 1000 và filesystem gốc read-only (lệnh `touch /tmp/x` phải thất bại).",
    ],
    hints: [
      "`fsGroup` CHỈ tồn tại ở pod-level; `capabilities` và `readOnlyRootFilesystem` CHỈ ở container-level.",
      "Tra field nhanh: `k explain pod.spec.securityContext` và `k explain pod.spec.containers.securityContext`.",
    ],
    solution: `YAML hoàn chỉnh (\`secure-app.yaml\`):

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  namespace: saturn
spec:
  securityContext:                 # pod-level
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: secure-app
    image: busybox:1.36
    command: ['sleep', '3600']
    securityContext:               # container-level
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
\`\`\`

\`\`\`bash
k apply -f secure-app.yaml
\`\`\`

Ghi nhớ cho phòng thi: nếu đặt \`capabilities\` hay \`readOnlyRootFilesystem\` nhầm sang pod-level thì \`k apply\` sẽ báo lỗi unknown field — dùng \`k explain\` để xác định đúng vị trí.`,
    verify: `\`\`\`bash
k get pod secure-app -n saturn
# STATUS = Running

k exec secure-app -n saturn -- id
# uid=1000 gid=0(root) groups=2000   ← chạy đúng uid 1000, fsGroup 2000

k exec secure-app -n saturn -- touch /tmp/x
# touch: /tmp/x: Read-only file system   ← readOnlyRootFilesystem hoạt động
# (lệnh trả về exit code khác 0)

k get pod secure-app -n saturn -o jsonpath='{.spec.containers[0].securityContext.capabilities.drop}'
# ["ALL"]
\`\`\``,
  },
  {
    id: "lab17",
    title: "ServiceAccount + Role + RoleBinding, kiểm tra bằng auth can-i",
    domain: "config",
    difficulty: 3,
    timeLimitMin: 8,
    scenario:
      "Làm việc trong namespace `jupiter` (tạo nếu chưa có). Ứng dụng cần quyền đọc danh sách pod trong namespace của nó — không hơn. Bạn phải cấp quyền tối thiểu qua RBAC và chứng minh bằng `kubectl auth can-i`.",
    tasks: [
      "Tạo namespace `jupiter` và ServiceAccount tên `app-sa` trong đó.",
      "Tạo Role tên `pod-reader` cho phép các verb `get`, `list`, `watch` trên resource `pods` trong namespace `jupiter`.",
      "Tạo RoleBinding tên `read-pods` gắn Role `pod-reader` vào ServiceAccount `app-sa`.",
      "Tạo Pod `rbac-pod` dùng image `nginx:1.27-alpine` chạy với `serviceAccountName: app-sa`.",
      "Dùng `kubectl auth can-i` chứng minh: `app-sa` list được pods trong `jupiter` (yes) nhưng KHÔNG delete được pods (no).",
    ],
    hints: [
      "Cả 3 tài nguyên RBAC đều có lệnh imperative: `k create sa`, `k create role`, `k create rolebinding`.",
      "Định danh ServiceAccount khi test: `system:serviceaccount:<namespace>:<tên-sa>`.",
      "Cú pháp gắn SA trong rolebinding: `--serviceaccount=jupiter:app-sa` (namespace:tên).",
    ],
    solution: `Toàn bộ bằng lệnh imperative:

\`\`\`bash
k create ns jupiter
k create sa app-sa -n jupiter

k create role pod-reader -n jupiter \\
  --verb=get,list,watch --resource=pods

k create rolebinding read-pods -n jupiter \\
  --role=pod-reader --serviceaccount=jupiter:app-sa
\`\`\`

Pod dùng ServiceAccount — generate rồi thêm 1 dòng:

\`\`\`bash
k run rbac-pod --image=nginx:1.27-alpine -n jupiter $do > rbac-pod.yaml
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: rbac-pod
  namespace: jupiter
  labels:
    run: rbac-pod
spec:
  serviceAccountName: app-sa
  containers:
  - name: rbac-pod
    image: nginx:1.27-alpine
\`\`\`

\`\`\`bash
k apply -f rbac-pod.yaml

# Kiểm tra quyền:
k auth can-i list pods -n jupiter --as=system:serviceaccount:jupiter:app-sa     # yes
k auth can-i delete pods -n jupiter --as=system:serviceaccount:jupiter:app-sa   # no
\`\`\``,
    verify: `\`\`\`bash
k get sa,role,rolebinding -n jupiter
# serviceaccount/app-sa, role/pod-reader, rolebinding/read-pods đều tồn tại

k describe rolebinding read-pods -n jupiter
# Role: pod-reader; Subjects: ServiceAccount app-sa (namespace jupiter)

k auth can-i list pods -n jupiter --as=system:serviceaccount:jupiter:app-sa
# yes

k auth can-i delete pods -n jupiter --as=system:serviceaccount:jupiter:app-sa
# no

k auth can-i list pods -n default --as=system:serviceaccount:jupiter:app-sa
# no   ← Role chỉ có hiệu lực trong namespace jupiter

k get pod rbac-pod -n jupiter -o jsonpath='{.spec.serviceAccountName}'
# app-sa
\`\`\``,
  },
  {
    id: "lab18",
    title: "ResourceQuota và LimitRange trong namespace",
    domain: "config",
    difficulty: 2,
    timeLimitMin: 7,
    scenario:
      "Làm việc trong namespace `pluto` (tạo nếu chưa có). Team platform muốn giới hạn tổng tài nguyên của namespace bằng ResourceQuota, đồng thời đặt default requests/limits qua LimitRange để pod không khai báo resources vẫn tạo được.",
    tasks: [
      "Tạo namespace `pluto` với ResourceQuota tên `rq-pluto`: `pods=5`, `requests.cpu=1`, `requests.memory=1Gi`, `limits.memory=2Gi`.",
      "Tạo LimitRange tên `lr-pluto` (type `Container`): default limit `cpu: 200m, memory: 256Mi`; defaultRequest `cpu: 100m, memory: 128Mi`.",
      "Tạo Pod `quota-pod` dùng image `nginx:1.27-alpine` KHÔNG khai báo resources — xác nhận pod được tự động gán default từ LimitRange.",
      "Thử tạo Pod `greedy` request `cpu: 2` — xác nhận API server từ chối vì vượt quota.",
    ],
    hints: [
      "Quota có lệnh imperative: `k create quota rq-pluto --hard=... -n pluto`; LimitRange phải viết YAML.",
      "Khi namespace có quota trên `requests.*`, pod bắt buộc phải có requests — LimitRange default chính là thứ cứu các pod không khai báo.",
      "Lỗi vượt quota xuất hiện NGAY khi tạo (Forbidden), không phải lúc schedule.",
    ],
    solution: `\`\`\`bash
k create ns pluto
k create quota rq-pluto -n pluto \\
  --hard=pods=5,requests.cpu=1,requests.memory=1Gi,limits.memory=2Gi
\`\`\`

\`lr.yaml\` — LimitRange:

\`\`\`yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: lr-pluto
  namespace: pluto
spec:
  limits:
  - type: Container
    default:              # limit mặc định
      cpu: 200m
      memory: 256Mi
    defaultRequest:       # request mặc định
      cpu: 100m
      memory: 128Mi
\`\`\`

\`\`\`bash
k apply -f lr.yaml

# Pod không khai báo resources — vẫn tạo được nhờ LimitRange:
k run quota-pod --image=nginx:1.27-alpine -n pluto
\`\`\`

Pod \`greedy\` vượt quota (\`greedy.yaml\`):

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: greedy
  namespace: pluto
spec:
  containers:
  - name: greedy
    image: nginx:1.27-alpine
    resources:
      requests:
        cpu: "2"
\`\`\`

\`\`\`bash
k apply -f greedy.yaml     # bị Forbidden — xem verify
\`\`\``,
    verify: `\`\`\`bash
k describe quota rq-pluto -n pluto
# Used/Hard: pods 1/5, requests.cpu 100m/1, requests.memory 128Mi/1Gi, limits.memory 256Mi/2Gi

k get pod quota-pod -n pluto -o jsonpath='{.spec.containers[0].resources}'
# {"limits":{"cpu":"200m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}
# ← default từ LimitRange được gán tự động

k apply -f greedy.yaml
# Error from server (Forbidden): ... exceeded quota: rq-pluto,
# requested: requests.cpu=2, used: requests.cpu=100m, limited: requests.cpu=1
\`\`\``,
  },

  // ============================================================
  // NETWORKING (Services and Networking) — lab19..lab22
  // ============================================================
  {
    id: "lab19",
    title: "Expose Deployment qua ClusterIP và NodePort",
    domain: "networking",
    difficulty: 2,
    timeLimitMin: 6,
    scenario:
      "Làm việc trong namespace `titan` (tạo nếu chưa có). Ứng dụng web cần được truy cập nội bộ qua ClusterIP và từ ngoài cluster qua NodePort cố định — sau đó kiểm chứng từ trong cluster bằng pod tạm.",
    tasks: [
      "Tạo namespace `titan` và Deployment `hello` dùng image `nginx:1.27-alpine`, `replicas: 2`, container port `80`.",
      "Expose `hello` thành Service ClusterIP tên `hello-svc`, port `80`.",
      "Tạo thêm Service NodePort tên `hello-np`, port `80`, `nodePort: 30080`.",
      "Kiểm chứng từ trong cluster: pod tạm busybox chạy `wget -qO- http://hello-svc` phải trả về trang chào mừng của nginx.",
    ],
    hints: [
      "`k expose deploy hello --name=hello-svc --port=80` cho ClusterIP; thêm `--type=NodePort` cho service thứ hai.",
      "`kubectl expose` không đặt được nodePort cụ thể — generate YAML với `$do` rồi thêm `nodePort: 30080` (dải hợp lệ 30000–32767).",
      "Pod tạm dùng một lần: `k run tmp --image=busybox:1.36 --rm -it --restart=Never -- wget -qO- <url>`.",
    ],
    solution: `\`\`\`bash
k create ns titan
k create deploy hello --image=nginx:1.27-alpine --replicas=2 --port=80 -n titan

# ClusterIP:
k expose deploy hello --name=hello-svc --port=80 -n titan

# NodePort với nodePort cố định — generate rồi thêm field:
k expose deploy hello --name=hello-np --port=80 --type=NodePort -n titan $do > np.yaml
\`\`\`

\`np.yaml\` hoàn chỉnh sau khi thêm \`nodePort\`:

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: hello-np
  namespace: titan
spec:
  type: NodePort
  selector:
    app: hello
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
\`\`\`

\`\`\`bash
k apply -f np.yaml

# Test từ trong cluster:
k run tmp --image=busybox:1.36 --rm -it --restart=Never -n titan -- wget -qO- http://hello-svc
\`\`\``,
    verify: `\`\`\`bash
k get svc -n titan
# hello-svc   ClusterIP   ...   80/TCP
# hello-np    NodePort    ...   80:30080/TCP

k get endpoints hello-svc -n titan
# 2 địa chỉ IP (2 pod của deployment) — KHÔNG rỗng

# Kết quả wget từ pod tạm chứa:
# <title>Welcome to nginx!</title>

# Nếu truy cập được node (ví dụ minikube/kind):
# curl http://<node-ip>:30080  → cùng trang chào nginx
\`\`\``,
  },
  {
    id: "lab20",
    title: "Ingress định tuyến hai path tới hai Service",
    domain: "networking",
    difficulty: 2,
    timeLimitMin: 7,
    scenario:
      "Làm việc trong namespace `titan` (tạo nếu chưa có). Hệ thống có 2 dịch vụ web và api cần được phục vụ dưới cùng một hostname `app.example.com`, tách theo path `/web` và `/api`. Cluster đã có ingress controller với ingressClass `nginx`.",
    tasks: [
      "Trong namespace `titan`, tạo 2 Deployment: `web` và `api`, cùng image `nginx:1.27-alpine`, mỗi cái 1 replica; expose lần lượt thành Service ClusterIP `web-svc` port `80` và `api-svc` port `80`.",
      "Tạo Ingress tên `app-ingress` với `ingressClassName: nginx`, host `app.example.com`: path `/web` (Prefix) → `web-svc:80`, path `/api` (Prefix) → `api-svc:80`.",
      "Xác nhận cả 2 rule bằng `kubectl describe ingress`.",
    ],
    hints: [
      "Lệnh imperative nhận nhiều rule: `k create ingress app-ingress --rule=\"host/path*=svc:port\" --rule=... --class=nginx`.",
      "Dấu `*` cuối path trong `--rule` sinh ra `pathType: Prefix`.",
      "apiVersion của Ingress là `networking.k8s.io/v1`.",
    ],
    solution: `\`\`\`bash
k create deploy web --image=nginx:1.27-alpine -n titan
k create deploy api --image=nginx:1.27-alpine -n titan
k expose deploy web --name=web-svc --port=80 -n titan
k expose deploy api --name=api-svc --port=80 -n titan

# Generate Ingress bằng lệnh imperative:
k create ingress app-ingress -n titan --class=nginx \\
  --rule="app.example.com/web*=web-svc:80" \\
  --rule="app.example.com/api*=api-svc:80" $do > ing.yaml
k apply -f ing.yaml
\`\`\`

YAML hoàn chỉnh tương đương (\`ing.yaml\`):

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: titan
spec:
  ingressClassName: nginx
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /web
        pathType: Prefix
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
              number: 80
\`\`\``,
    verify: `\`\`\`bash
k get ingress app-ingress -n titan
# CLASS = nginx, HOSTS = app.example.com

k describe ingress app-ingress -n titan
# Rules:
#   app.example.com
#     /web   web-svc:80 (<pod-ip>:80)
#     /api   api-svc:80 (<pod-ip>:80)
# Backend hiện IP pod = Service có endpoints, không bị rỗng

# Nếu ingress controller có địa chỉ (cột ADDRESS không rỗng):
# curl -H "Host: app.example.com" http://<ingress-address>/web
# → trang chào nginx (tương tự với /api)
\`\`\``,
  },
  {
    id: "lab21",
    title: "NetworkPolicy: default-deny và cho phép frontend → backend",
    domain: "networking",
    difficulty: 3,
    timeLimitMin: 9,
    scenario:
      "Làm việc trong namespace `orion` (tạo nếu chưa có; CNI của cluster phải hỗ trợ NetworkPolicy). Yêu cầu bảo mật: chặn toàn bộ traffic vào các pod trong namespace, sau đó chỉ mở đúng một đường: frontend gọi backend trên TCP port 80.",
    tasks: [
      "Tạo namespace `orion` với 3 Pod: `backend` (image `nginx:1.27-alpine`, label `app=backend`), `frontend` (image `busybox:1.36`, label `app=frontend`, chạy `sleep 3600`), `intruder` (image `busybox:1.36`, label `app=intruder`, chạy `sleep 3600`).",
      "Tạo NetworkPolicy `default-deny-ingress` chặn toàn bộ ingress tới MỌI pod trong namespace `orion`.",
      "Xác nhận cả `frontend` lẫn `intruder` đều KHÔNG wget được tới IP của `backend` (timeout).",
      "Tạo NetworkPolicy `allow-frontend` chỉ cho phép pod label `app=frontend` truy cập pod label `app=backend` trên TCP port `80`.",
      "Xác nhận lại: `frontend` wget thành công, `intruder` vẫn timeout.",
    ],
    hints: [
      "`podSelector: {}` nghĩa là áp cho MỌI pod trong namespace.",
      "Trong `from`, mỗi item có dấu `-` là một điều kiện OR riêng; NetworkPolicy không có lệnh imperative — viết YAML.",
      "Test có giới hạn thời gian: `wget -qO- --timeout=2 http://<backend-ip>`.",
    ],
    solution: `\`\`\`bash
k create ns orion
k run backend  --image=nginx:1.27-alpine --labels=app=backend  -n orion
k run frontend --image=busybox:1.36 --labels=app=frontend -n orion -- sleep 3600
k run intruder --image=busybox:1.36 --labels=app=intruder -n orion -- sleep 3600

# Lấy IP của backend:
k get pod backend -n orion -o wide
\`\`\`

\`deny.yaml\` — chặn mọi ingress trong namespace:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: orion
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
\`\`\`

\`allow.yaml\` — mở đúng một đường frontend → backend:80:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: orion
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
\`\`\`

\`\`\`bash
k apply -f deny.yaml
# Test: cả 2 đều timeout
k exec frontend -n orion -- wget -qO- --timeout=2 http://<backend-ip>
k exec intruder -n orion -- wget -qO- --timeout=2 http://<backend-ip>

k apply -f allow.yaml
# Test lại: frontend OK, intruder vẫn timeout
k exec frontend -n orion -- wget -qO- --timeout=2 http://<backend-ip>
\`\`\``,
    verify: `\`\`\`bash
k get netpol -n orion
# default-deny-ingress (POD-SELECTOR <none> = mọi pod)
# allow-frontend       (POD-SELECTOR app=backend)

# Sau khi apply deny.yaml (chưa có allow):
k exec frontend -n orion -- wget -qO- --timeout=2 http://<backend-ip>
# wget: download timed out  (exit code 1)

# Sau khi apply allow.yaml:
k exec frontend -n orion -- wget -qO- --timeout=2 http://<backend-ip>
# <title>Welcome to nginx!</title>   ← thành công

k exec intruder -n orion -- wget -qO- --timeout=2 http://<backend-ip>
# wget: download timed out   ← vẫn bị chặn, đúng yêu cầu
\`\`\``,
  },
  {
    id: "lab22",
    title: "Debug Service không có endpoints (selector sai)",
    domain: "networking",
    difficulty: 2,
    timeLimitMin: 6,
    scenario: `Làm việc trong namespace \`orion\` (tạo nếu chưa có). Team triển khai Deployment \`payments\` nhưng Service phía trước (được apply từ manifest dưới đây) không nhận được traffic. Nhiệm vụ: dựng lại hiện trạng, chẩn đoán và sửa.

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: payments-svc
  namespace: orion
spec:
  selector:
    app: payment
  ports:
  - port: 80
    targetPort: 80
\`\`\``,
    tasks: [
      "Tạo Deployment `payments` dùng image `nginx:1.27-alpine`, `replicas: 2` trong namespace `orion`, và apply Service đúng như manifest trong đề.",
      "Xác nhận triệu chứng: từ pod tạm, `wget -qO- --timeout=2 http://payments-svc` thất bại.",
      "Chẩn đoán nguyên nhân bằng cách so sánh endpoints của Service với labels thực tế của pod.",
      "Sửa Service (KHÔNG xóa/sửa Deployment) để traffic hoạt động, rồi kiểm chứng lại.",
    ],
    hints: [
      "`k get endpoints payments-svc -n orion` — endpoints rỗng nghĩa là selector không khớp label pod nào.",
      "So sánh với label thật: `k get pods -n orion --show-labels` (deployment tạo bởi `k create deploy` có label `app=<tên>`).",
      "Sửa nhanh bằng `k edit svc` hoặc `k patch svc`.",
    ],
    solution: `Dựng hiện trạng:

\`\`\`bash
k create deploy payments --image=nginx:1.27-alpine --replicas=2 -n orion
k apply -f payments-svc.yaml     # manifest trong đề

# Triệu chứng:
k run tmp --image=busybox:1.36 --rm -it --restart=Never -n orion -- \\
  wget -qO- --timeout=2 http://payments-svc
# wget: download timed out
\`\`\`

Chẩn đoán — quy trình chuẩn khi Service "chết":

\`\`\`bash
k get endpoints payments-svc -n orion
# ENDPOINTS = <none>   ← dấu hiệu selector sai

k get pods -n orion --show-labels | grep payments
# label thật của pod: app=payments  (selector trong Service lại là app=payment — thiếu chữ s)
\`\`\`

Sửa selector của Service (không đụng Deployment):

\`\`\`bash
k patch svc payments-svc -n orion -p '{"spec":{"selector":{"app":"payments"}}}'
# hoặc: k edit svc payments-svc -n orion  → sửa app: payment thành app: payments
\`\`\``,
    verify: `\`\`\`bash
k get endpoints payments-svc -n orion
# ENDPOINTS có 2 địa chỉ IP:80 — không còn rỗng

k run tmp --image=busybox:1.36 --rm -it --restart=Never -n orion -- \\
  wget -qO- --timeout=2 http://payments-svc
# <title>Welcome to nginx!</title>   ← Service đã nhận traffic

k get svc payments-svc -n orion -o jsonpath='{.spec.selector}'
# {"app":"payments"}
\`\`\``,
  },
];
