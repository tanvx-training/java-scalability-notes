// Chặng 3 — Scheduling và tài nguyên.
// s17–s19 đã phát hành; s20–s21 là buổi khung (đủ trường cấu trúc, check-data PR7), nội dung đầy đủ ở task sau.

export const sessions = [
  // ───────────────────────────── s17 ─────────────────────────────
  {
    id: "s17",
    stage: "st3",
    title: "Requests, limits, QoS và JVM trong container",
    durationMin: 90,
    domain: "workloads",
    competencies: ["wl-admission-sched"],
    requires: ["s16"],
    status: "published",
    pieces: ["resources"],
    goals: [
      "Đặt requests/limits cho ba service từ số đo thật, sao cho heap + non-heap của JVM nằm dưới memory limit.",
      "Gây và nhận ra OOMKilled trên một Deployment nháp, rồi sửa bằng MaxRAMPercentage thay vì chỉ tăng limit.",
      "Đọc QoS class của từng Pod và tổng Allocated resources của một node.",
    ],
    skills: [
      { skill: "k-set-resources", level: "Gõ được không tra" },
      { skill: "k-resources-yaml", level: "Viết được không tra" },
      { skill: "k-qos-classes", level: "Giải thích được" },
      { skill: "k-oomkilled", level: "Gõ được có tra" },
      { skill: "k-jvm-container", level: "Giải thích được" },
      { skill: "k-node-allocated", level: "Gõ được không tra" },
    ],
    uses: ["k-describe-pod", "k-logs-previous", "k-rollout-status", "lx-proc-ns-cgroup", "k-cm-envfrom-volume"],
    foundation: null,
    mindset: `**requests là lời hứa với scheduler, limits là trần của kernel.** \`requests\` không giới hạn gì lúc chạy: scheduler cộng requests của mọi Pod trên node và chỉ xếp Pod mới lên node còn đủ *allocatable* (cka-w1: 2 CPU, 1899736Ki). \`limits.memory\` thành \`memory.max\` của cgroup container: vượt là kernel giết tiến trình — \`OOMKilled\`, exit code 137 (128 + SIGKILL 9). \`limits.cpu\` thì không giết ai, chỉ *bóp* (CFS throttling): JVM khởi động hay GC bị kéo dài. Shop đặt \`requests.cpu\`, \`requests.memory\`, \`limits.memory\` và **không** đặt \`limits.cpu\`.

**QoS class suy ra từ ba trường đó, không khai trực tiếp:**

| QoS | Điều kiện (mọi container của Pod) | Bị đẩy khỏi node khi node thiếu RAM |
|---|---|---|
| \`Guaranteed\` | requests = limits cho cả CPU và memory | sau cùng |
| \`Burstable\` | có ít nhất một request hoặc limit, nhưng không đạt Guaranteed | ở giữa, theo mức vượt request |
| \`BestEffort\` | không khai gì | trước tiên |

Không có \`limits.cpu\` thì không thể là Guaranteed: shop chọn Burstable có chủ ý — được dùng CPU rảnh của node lúc khởi động, đổi lại xếp sau Guaranteed khi node bị ép. Trên lab, Pod của log-agent, Job seed, CronJob và \`report-once\` vẫn là \`BestEffort\` (chưa khai gì); s18 cho chúng giá trị mặc định.

**JVM nhìn thấy gì.** Container của Pod có cgroup riêng gắn ở \`/sys/fs/cgroup\` (khác \`ctr run\` ở s05): trong Pod gateway có limit 384Mi, \`cat /sys/fs/cgroup/memory.max\` in \`402653184\`, \`cpu.max\` in \`max 100000\` (không giới hạn CPU). JVM 25 đọc \`memory.max\` và tính heap tối đa theo phần trăm của nó. Không có limit thì nó tính theo RAM của **node**: một JVM mới trong Pod chưa có limit in \`MaxHeapSize = 513802240\` (25% mặc định của 1955 MB của cka-w1), còn tiến trình của shop chạy \`-XX:MaxRAMPercentage=75\` (ENTRYPOINT của image) nên được phép mọc tới ~1,4 GB heap trên một worker 2 GB chứa ba JVM.

**Bộ nhớ của JVM = heap + non-heap.** Non-heap gồm metaspace (class của Spring), code cache của JIT, stack của mỗi thread, cấu trúc của GC, bộ đệm NIO. \`memory.max\` chặn **tổng** đó. Đo trên lab với \`/internal/alloc\` (giữ thêm N MB trên heap):

| Cấu hình (limit 384Mi) | Heap tối đa | Gọi alloc | Kết quả |
|---|---|---|---|
| \`-Xmx384m\` (heap = limit) | 384 MiB | 100 rồi 220 | \`OOMKilled\`, 137: heap chưa đầy mà tổng đã chạm trần |
| không \`JAVA_OPTS\` (75% của image) | 288 MiB | 250 | \`OOMKilled\`, 137 |
| \`-XX:MaxRAMPercentage=50\` | 192 MiB | 100 rồi 220 | JVM ném \`OutOfMemoryError: Java heap space\`, HTTP 500, container sống, \`memory.peak\` 320 MiB |

Hàng cuối cho thấy non-heap của một service shop cỡ 130–140 MiB (320 − 192). Vì thế \`-Xmx\` bằng limit luôn sai: chỗ cho non-heap là âm, và người giết JVM là kernel — không heap dump, không log \`OutOfMemoryError\`, chỉ một dòng \`Memory cgroup out of memory: Killed process … (java)\` trong journal của node. Với \`MaxRAMPercentage\`, heap đi theo limit: đổi limit không phải sửa cờ. Quy tắc của buổi: **chừa ít nhất 128 MiB dưới limit cho non-heap**; với limit 384Mi là ≤ 66%, shop dùng 50.

**Chọn số từ đo, không đoán.** Ba service khi chưa có limit dùng 204–249 MiB (\`memory.current\` của cgroup) lúc rảnh và tối đa 278 MiB sau 3000 request \`/api/products\`; heap đó phình vì JVM tưởng có cả node. Với heap 192 MiB, 256Mi request là mức dùng thường ngày, 384Mi limit là trần khi bận. Đây là phần container-aware JVM của bài [Tomcat Thread Pool: pool size bao nhiêu là đủ?](#/docs/java-07): heap, thread và CPU của JVM phải tính từ cgroup, không từ máy.`,
    refs: [
      { label: "Java 07 — container-aware JVM, MaxRAMPercentage, CFS throttling", href: "#/docs/java-07" },
      { label: "Chạy Java trong container (Well-Grounded Java Developer, chương 12)", href: "#/docs/wgjd-12" },
      { label: "Chọn và tinh chỉnh GC cho container", href: "#/docs/uh-13" },
      { label: "Bài lộ trình CKAD: Resource requests & limits; QoS classes", href: "#/roadmap/ckad/w4-3" },
      { label: "Bài lộ trình CKAD: Lỗi phổ biến — … Pending, OOMKilled", href: "#/roadmap/ckad/w5-7" },
      { label: "Bài lộ trình CKA Study Guide: requests/limits, ResourceQuota và LimitRange", href: "#/roadmap/ckabook/cb-w4-1" },
      { label: "CKA Study Guide, chương 13 — Yêu cầu tài nguyên, giới hạn và quota", href: "#/docs/ckabook-13" },
      { label: "Thực hành nhanh: set resources, YAML resources", href: "#/commands" },
      { label: "kubernetes.io: Resource Management for Pods and Containers", href: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" },
      { label: "kubernetes.io: Pod Quality of Service Classes", href: "https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/" },
    ],
    stateIn: "Đầu ra s16: shop chạy đủ (gateway 2.0 ×2, catalog ×2, order ×1, có probe), chưa có requests/limits, gateway không có JAVA_OPTS; manifest ở ~/shop/. `./labs/lab begin cka s17` kiểm đầu vào bằng verify của s16.",
    stateOut: "Ba Deployment có requests.cpu, requests.memory, limits.memory ở mọi container (QoS Burstable) và JAVA_OPTS=-XX:MaxRAMPercentage=50, khớp ~/shop/{gateway,catalog,order}.yaml; Deployment nháp oom-lab đã xoá; ~/drills/s17/answers.env.",
    tasks: [
      { id: "t1", text: "Đo trước khi đặt số. `k -n shop get pod -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass` — QoS hiện tại? Với một Pod catalog: `k -n shop exec <pod> -- cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.max` (bộ nhớ đang dùng, trần). Gọi `/api/products` vài trăm lần qua ClusterIP của gateway rồi đo lại. Trong cùng Pod: `k -n shop exec <pod> -- sh -c 'java -XX:+PrintFlagsFinal -version | grep -E \" (MaxHeapSize|MaxRAMPercentage) \"'` — heap tối đa mà một JVM mới tính được, từ đâu ra?" },
      { id: "t2", text: "`k set resources` thử trên catalog: `k -n shop set resources deploy/catalog --requests=cpu=200m,memory=256Mi --limits=memory=384Mi`, `k -n shop rollout status deploy/catalog`, đọc lại QoS. Rồi viết vào **tệp**: trong `~/shop/{gateway,catalog,order}.yaml` đặt `resources` cho container chính (gateway 100m/256Mi/384Mi, catalog 200m/256Mi/384Mi, order 100m/256Mi/384Mi — requests.cpu/requests.memory/limits.memory, không `limits.cpu`) **và** cho init container `wait-catalog` của gateway (10m/16Mi/32Mi), thêm biến `JAVA_OPTS` với giá trị `-XX:MaxRAMPercentage=50` cho cả ba. Apply catalog trước, rồi order, gateway; `rollout status` từng cái." },
      { id: "t3", text: "Trong Pod gateway mới: `cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max` và `java -XX:MaxRAMPercentage=75 $JAVA_OPTS -XX:+PrintFlagsFinal -version | grep -E \" (MaxHeapSize|MaxRAMPercentage) \"` (đúng thứ tự cờ của ENTRYPOINT: cờ sau thắng). JVM thứ hai này cộng vài chục MiB vào cùng cgroup 384Mi: chạy lúc gateway rảnh, đừng chạy ngay giữa vòng tải. Heap tối đa bây giờ là bao nhiêu MiB?" },
      { id: "t4", text: "Tình huống hỏng: Deployment nháp `oom-lab` (image `shop/catalog:1.0`, 1 replica) với `JAVA_OPTS=-Xmx384m`, requests cpu 50m / memory 384Mi, limit memory 384Mi — tạo trong **một** lần apply (sinh YAML bằng `create deploy $do`, sửa rồi apply). Khi Pod Ready, gọi `k get --raw \"/api/v1/namespaces/shop/pods/<pod>:8080/proxy/internal/alloc?mb=100\"` rồi `…?mb=220`. Đọc `k -n shop get pod -l app=oom-lab` (RESTARTS), `k -n shop describe pod <pod>` (Last State) và `lastState.terminated` bằng jsonpath. Ghi `OOM_REASON=<reason>` và `OOM_EXIT_CODE=<mã>` vào `~/drills/s17/answers.env`. Trên node chạy Pod: `sudo journalctl -k | grep -i 'out of memory'`." },
      { id: "t5", text: "Sửa oom-lab **không tăng limit**: `k -n shop set env deploy/oom-lab JAVA_OPTS=-XX:MaxRAMPercentage=50`, chờ Pod mới, gọi lại alloc 100 rồi 220. Lần này request thứ hai trả lỗi gì, RESTARTS bao nhiêu, `k -n shop logs <pod> | grep -m1 OutOfMemory` in gì? Xoá oom-lab." },
      { id: "t6", text: "`k describe node cka-w1 | grep -A 8 'Allocated resources'` và phần `Non-terminated Pods` phía trên: cộng tay requests của các Pod trên node, so với số trong bảng. Ghi `QOS_GATEWAY=<QoS của Pod gateway>` vào `answers.env`. Trên Mac: `./labs/lab verify cka s17` phải đạt 7/7." },
    ],
    hints: [
      "`k set resources … -c wait-catalog` sửa được cả init container (đã thử trên lab). Trong tệp, init container nằm ở `initContainers`, cùng khoá `resources` như container chính.",
      "Đặt `limits.memory` mà không đặt `requests.memory` thì API server chép limit sang request (thử bằng `--dry-run=server` trên lab: chỉ `limits.memory: 384Mi` → `requests.memory: 384Mi`): Pod khó xếp lịch hơn bạn nghĩ. Luôn khai cả hai.",
      "OOMKilled không sinh Event riêng: nó nằm ở `status.containerStatuses[].lastState.terminated` của Pod (`describe` → Last State). RESTARTS tăng 1, Pod lại Running ngay.",
      "`create deploy` rồi `set env` rồi `set resources` trên Deployment đang chạy là ba ReplicaSet: Pod cũ chưa có limit có thể nhận request alloc của bạn. Gộp vào một YAML, hoặc chờ `get pod -l app=oom-lab` chỉ còn một Pod.",
      "`MaxRAMPercentage` chỉ có tác dụng khi không có `-Xmx`: `-Xmx` đè lên mọi phần trăm.",
    ],
    solution: `Output là của máy soạn bài; tên Pod, PID và thời điểm sẽ khác.

**1. Đo trước**

\`\`\`bash
k -n shop get pod -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
# catalog-…, gateway-…, order-…   BestEffort       (chưa khai gì)
k -n shop exec <pod catalog> -- cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.max
# 210448384
# max
ip=$(k -n shop get svc gateway -o jsonpath='{.spec.clusterIP}')
for i in $(seq 1 3000); do curl -s -o /dev/null -m 3 http://$ip:8080/api/products & [ $((i%30)) = 0 ] && wait; done; wait
k -n shop exec <pod catalog> -- sh -c 'java -XX:+PrintFlagsFinal -version 2>/dev/null | grep -E " (MaxHeapSize|MaxRAMPercentage) "'
#    size_t MaxHeapSize                              = 513802240          {product} {ergonomic}
#    double MaxRAMPercentage                         = 25.000000          {product} {default}
\`\`\`

Đo trên lab: 204–249 MiB lúc rảnh, tối đa 278 MiB sau 3000 request. \`memory.max\` là \`max\`: không trần, JVM tính heap từ 1955 MB của node (25% mặc định của JVM mới = 490 MiB; tiến trình của shop chạy 75%).

**2. requests/limits và JAVA_OPTS**

\`\`\`bash
k -n shop set resources deploy/catalog --requests=cpu=200m,memory=256Mi --limits=memory=384Mi
k -n shop rollout status deploy/catalog
vim ~/shop/catalog.yaml       # và order.yaml, gateway.yaml
\`\`\`

Phần thay đổi trong \`~/shop/gateway.yaml\` (catalog, order giống phần container chính, khác số CPU):

\`\`\`yaml
    spec:
      initContainers:
      - name: wait-catalog
        image: busybox:1.37
        command: ["sh", "-c", "until wget -q -T 2 -O /dev/null http://catalog:8080/actuator/health/readiness; do echo chờ catalog; sleep 2; done"]
        resources:
          requests:
            cpu: 10m
            memory: 16Mi
          limits:
            memory: 32Mi
      containers:
      - image: shop/gateway:2.0
        name: gateway
        env:
        - name: JAVA_OPTS
          value: "-XX:MaxRAMPercentage=50"
        envFrom:
        - configMapRef:
            name: shop-config
        # … ports, volumeMounts, probe, lifecycle như cũ …
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            memory: 384Mi
\`\`\`

Ở catalog và order, \`JAVA_OPTS\` đứng đầu danh sách \`env\` có sẵn (trước \`DB_USER\`, \`DB_PASSWORD\`).

\`\`\`bash
for d in catalog order gateway; do k apply -f ~/shop/$d.yaml && k -n shop rollout status deploy/$d; done
k -n shop get pod -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass,NODE:.spec.nodeName
# catalog-7f56cd647-6bj8g       Burstable    cka-w1
# gateway-59df6877d4-vpbgh      Burstable    cka-w1
# order-6c75b644fb-9z7g8        Burstable    cka-w2
# log-agent-fz9zg               BestEffort   cka-w1
# report-once                   BestEffort   cka-w2
\`\`\`

**3. JVM nhìn thấy limit**

\`\`\`bash
k -n shop exec deploy/gateway -c gateway -- sh -c 'cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max; java -XX:MaxRAMPercentage=75 $JAVA_OPTS -XX:+PrintFlagsFinal -version 2>/dev/null | grep -E " (MaxHeapSize|MaxRAMPercentage) "'
# 402653184
# max 100000
#    size_t MaxHeapSize                              = 201326592          {product} {ergonomic}
#    double MaxRAMPercentage                         = 50.000000          {product} {command line}
\`\`\`

384 MiB × 50% = 192 MiB heap; 192 MiB còn lại cho non-heap. \`cpu.max\` \`max\` nghĩa là không bị bóp CPU.

**4. oom-lab: -Xmx bằng limit**

\`\`\`bash
k -n shop create deploy oom-lab --image=shop/catalog:1.0 $do \\
  | k set env --local -f - JAVA_OPTS=-Xmx384m -o yaml \\
  | k set resources --local -f - --requests=cpu=50m,memory=384Mi --limits=memory=384Mi -o yaml > ~/drills/s17/oom-lab.yaml
k apply -f ~/drills/s17/oom-lab.yaml
k -n shop rollout status deploy/oom-lab
P=$(k -n shop get pod -l app=oom-lab -o jsonpath='{.items[0].metadata.name}')
k get --raw "/api/v1/namespaces/shop/pods/$P:8080/proxy/internal/alloc?mb=100"; echo
# {"allocatedMb":100}
k get --raw "/api/v1/namespaces/shop/pods/$P:8080/proxy/internal/alloc?mb=220"; echo
# Error from server (ServiceUnavailable): error trying to reach service: dial tcp 10.244.95.154:8080: connect: connection refused
k -n shop get pod -l app=oom-lab
# NAME                      READY   STATUS    RESTARTS      AGE
# oom-lab-ff85656b6-4z97x   1/1     Running   1 (10s ago)   16s
k -n shop describe pod $P | sed -n '/Last State/,/Restart Count/p'
#     Last State:     Terminated
#       Reason:       OOMKilled
#       Exit Code:    137
k -n shop get pod $P -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason} {.status.containerStatuses[0].lastState.terminated.exitCode}'; echo
# OOMKilled 137
printf 'OOM_REASON=OOMKilled\\nOOM_EXIT_CODE=137\\n' > ~/drills/s17/answers.env
ssh cka-w1 "sudo journalctl -k | grep -i 'out of memory' | tail -1"     # node trong cột NODE của get pod -o wide
# … Memory cgroup out of memory: Killed process 33961 (java) total-vm:2948700kB, anon-rss:390636kB, file-rss:22272kB, …
\`\`\`

Sau alloc 100, \`memory.current\` đã là 260 MiB; 220 MB nữa trên heap (vẫn dưới \`-Xmx384m\`) đẩy tổng qua 384 MiB. Kernel giết \`java\` (cả container, vì kubelet đặt \`memory.oom.group\`), kubelet chạy lại nó trong cùng Pod. Không có Event nào nói "OOM": chỉ Last State.

**5. Sửa bằng MaxRAMPercentage, không tăng limit**

\`\`\`bash
k -n shop set env deploy/oom-lab JAVA_OPTS=-XX:MaxRAMPercentage=50
k -n shop rollout status deploy/oom-lab
P=$(k -n shop get pod -l app=oom-lab -o jsonpath='{.items[0].metadata.name}')    # chờ Pod cũ biến mất
k get --raw "/api/v1/namespaces/shop/pods/$P:8080/proxy/internal/alloc?mb=100"; echo
# {"allocatedMb":100}
k get --raw "/api/v1/namespaces/shop/pods/$P:8080/proxy/internal/alloc?mb=220"; echo
# Error from server (InternalError): an error on the server ("unknown") has prevented the request from succeeding
k -n shop get pod -l app=oom-lab
# oom-lab-76b5dc45fc-mcv74   1/1     Running   0          29s
k -n shop logs $P | grep -m1 OutOfMemory
# … threw exception [Handler dispatch failed: java.lang.OutOfMemoryError: Java heap space] with root cause
k -n shop exec $P -- cat /sys/fs/cgroup/memory.peak
# 335413248
k -n shop delete deploy oom-lab
\`\`\`

Cùng limit, cùng lượng cấp phát: lần này JVM tự báo \`OutOfMemoryError\` (HTTP 500), container sống, đỉnh 320 MiB. Lỗi giờ nằm ở tầng Java — có log, bắt được, đặt \`-XX:+HeapDumpOnOutOfMemoryError\` được — thay vì một SIGKILL câm từ kernel. Muốn chứa thêm dữ liệu thì tăng limit; heap tự lớn theo.

**6. Allocated resources và QoS**

\`\`\`bash
k describe node cka-w1 | grep -A 14 'Non-terminated Pods'
#   kube-system   calico-node-bhzlq          250m (12%)    0 (0%)      0 (0%)           0 (0%)
#   shop          catalog-7f56cd647-6bj8g    200m (10%)    0 (0%)      256Mi (13%)      384Mi (20%)
#   shop          gateway-59df6877d4-vpbgh   100m (5%)     0 (0%)      256Mi (13%)      384Mi (20%)
#   shop          log-agent-fz9zg            0 (0%)        0 (0%)      0 (0%)           0 (0%)
k describe node cka-w1 | grep -A 8 'Allocated resources'
#   Resource           Requests     Limits
#   cpu                550m (27%)   0 (0%)
#   memory             512Mi (27%)  768Mi (41%)
echo QOS_GATEWAY=$(k -n shop get pod -l app=gateway -o jsonpath='{.items[0].status.qosClass}') >> ~/drills/s17/answers.env
\`\`\`

250m + 200m + 100m = 550m; 256Mi × 2 = 512Mi. Phần trăm tính trên *allocatable*, không trên RAM của VM. Tổng limits được phép vượt 100% (overcommit): kernel chỉ giết khi tiến trình thật sự dùng tới.

Lời giải tự động: \`labs/cka/sessions/s17/apply.sh\` (manifest trong \`labs/cka/sessions/s17/files/\`).`,
    exam: {
      patterns: [
        "\"Đặt requests/limits cho Deployment X\" — `k set resources deploy/x --requests=… --limits=…` (thêm `-c` khi nhiều container).",
        "\"Pod bị khởi động lại liên tục, tìm nguyên nhân\" — `describe pod` → Last State `OOMKilled` / Exit Code 137.",
        "\"Tạo Pod QoS Guaranteed\" — requests = limits cho cả cpu và memory ở mọi container.",
        "\"Node nào còn nhiều CPU chưa được request nhất\" — `k describe node | grep -A 5 'Allocated resources'`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 3 phút: Pod `qos-g` (namespace `shop`, image `busybox:1.37`, lệnh `sleep 3600`) có QoS `Guaranteed` với 100m CPU và 64Mi; in QoS của nó rồi xoá.",
          timeLimitMin: 3,
          solution: "```bash\nk -n shop run qos-g --image=busybox:1.37 $do -- sleep 3600 > qos-g.yaml\n# resources: {requests: {cpu: 100m, memory: 64Mi}, limits: {cpu: 100m, memory: 64Mi}}\nk apply -f qos-g.yaml\nk -n shop get pod qos-g -o jsonpath='{.status.qosClass}'; echo     # Guaranteed\nk -n shop delete pod qos-g\n```\n`kubectl run` không còn cờ `--requests`/`--limits`: sửa YAML. Chỉ khai limits (không requests) cũng ra Guaranteed, vì request được chép từ limit.",
        },
        {
          text: "Trong 2 phút: liệt kê mọi Pod trong cluster có container từng bị OOMKilled.",
          timeLimitMin: 2,
          solution: "```bash\nk get pod -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name} {.status.containerStatuses[*].lastState.terminated.reason}{\"\\n\"}{end}' | grep OOMKilled\n```",
        },
      ],
    },
    tips: [
      "137 = 128 + 9 (SIGKILL): OOMKilled hoặc bị giết sau grace period. 143 = 128 + 15 (SIGTERM): dừng tử tế.",
      "Đề hỏi QoS: đọc `.status.qosClass`, đừng tự suy từ YAML trong lúc vội.",
      "JVM trong container: dùng `-XX:MaxRAMPercentage`, không `-Xmx` bằng limit; chừa 128 MiB trở lên cho non-heap.",
      "Không đặt `limits.cpu` cho JVM trừ khi đề bắt: CFS throttling kéo dài khởi động và GC, probe dễ hết giờ.",
    ],
    outcome: {
      md: `Ba service của shop có requests/limits chọn từ số đo, JVM tính heap theo limit của container. Trên Mac:

\`\`\`bash
./labs/lab verify cka s17
\`\`\`

Verify đọc requests/limits ở mọi container (cả init container), QoS của từng Pod, \`JAVA_OPTS\` và chỗ còn lại cho non-heap, so \`~/shop/*.yaml\` với cluster, kiểm oom-lab đã xoá và ba đáp án.`,
      verifyOutput: "lab: kiểm s17\n  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)\n  ✓ gateway, catalog, order: mọi container (cả init) có requests.cpu, requests.memory, limits.memory ≥ requests\n  ✓ mọi Pod của gateway, catalog, order ở QoS Burstable\n  ✓ JAVA_OPTS của ba Deployment có -XX:MaxRAMPercentage, heap tối đa chừa ≥ 128Mi dưới limits.memory, không -Xmx/-Xms\n  ✓ ~/shop/{gateway,catalog,order}.yaml có resources, khớp Deployment (resources, JAVA_OPTS); Available 2/2/1\n  ✓ answers.env: OOM_REASON=OOMKilled; Deployment oom-lab đã xoá\n  ✓ answers.env: OOM_EXIT_CODE=137 (128 + SIGKILL 9)\n  ✓ answers.env: QOS_GATEWAY=Burstable\n  → 7/7 đạt",
      projectDelta: "shop có requests/limits (QoS Burstable) và JVM đặt MaxRAMPercentage: scheduler biết mỗi Pod cần bao nhiêu, kernel biết trần. Buổi sau đặt hạn mức cho cả namespace.",
    },
    review: [
      { q: "requests và limits khác nhau ở chỗ nào khi Pod đang chạy?", a: "requests chỉ dùng lúc xếp lịch (cộng dồn so với allocatable của node) và làm trọng số CPU; không chặn gì. limits.memory là memory.max của cgroup: vượt là OOMKilled. limits.cpu bóp CPU (throttling), không giết." },
      { q: "Vì sao -Xmx bằng memory limit gần như chắc chắn bị OOMKilled?", a: "memory.max chặn tổng bộ nhớ của tiến trình: heap + metaspace + code cache + stack thread + GC. Heap được phép bằng cả limit thì non-heap không còn chỗ; kernel giết trước khi JVM kịp ném OutOfMemoryError. Trên lab: -Xmx384m với limit 384Mi chết ở alloc 220 MB." },
      { q: "Pod chỉ có requests.cpu, requests.memory và limits.memory thì QoS gì? Muốn Guaranteed phải làm gì?", a: "Burstable. Guaranteed cần requests = limits cho cả CPU và memory ở mọi container, tức phải đặt thêm limits.cpu bằng requests.cpu." },
      { q: "OOMKilled để lại dấu ở đâu?", a: "`status.containerStatuses[].lastState.terminated` (reason OOMKilled, exitCode 137), RESTARTS tăng; journal kernel của node có dòng `Memory cgroup out of memory: Killed process … (java)`. Không có Event riêng." },
      { q: "Allocated resources của node cộng gì, phần trăm tính trên đâu?", a: "Cộng requests và limits của mọi Pod không ở trạng thái kết thúc trên node, cả Pod hệ thống (calico-node 250m CPU). Phần trăm tính trên allocatable của node; limits được phép vượt 100%." },
    ],
  },

  // ───────────────────────────── s18 ─────────────────────────────
  {
    id: "s18",
    stage: "st3",
    title: "Namespace, LimitRange và ResourceQuota",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-admission-sched"],
    requires: ["s17"],
    status: "published",
    pieces: [],
    goals: [
      "Khoá namespace shop bằng ResourceQuota và LimitRange để Pod thiếu requests vẫn được nhận giá trị mặc định.",
      "Đọc lỗi khi một Deployment vượt quota và chỉ ra nó nằm ở ReplicaSet chứ không ở Pod; so với Pod tạo thẳng bị từ chối ngay.",
      "Chuyển namespace mặc định của context để khỏi gõ -n mỗi lệnh.",
    ],
    skills: [
      { skill: "k-create-ns", level: "Gõ được không tra" },
      { skill: "k-set-context-ns", level: "Thành phản xạ" },
      { skill: "k-create-quota", level: "Gõ được không tra" },
      { skill: "k-quota-yaml", level: "Viết được có tra" },
      { skill: "k-limitrange-yaml", level: "Viết được có tra" },
      { skill: "k-describe-quota", level: "Gõ được không tra" },
    ],
    uses: ["k-scale", "k-deploy-rs-pod", "k-events-sorted", "k-resources-yaml"],
    foundation: null,
    mindset: `**Hai object, hai tầng.** **ResourceQuota** là *ngân sách của cả namespace*: tổng requests, limits, số Pod… của mọi Pod đang sống không được vượt \`hard\`. **LimitRange** là *quy định cho từng container*: không khai thì được phát \`defaultRequest\`/\`default\`, khai quá \`max\` thì bị từ chối. Cả hai là **admission plugin**: chạy lúc API server nhận yêu cầu tạo Pod, không đụng Pod đang chạy. Thứ tự trong apiserver: LimitRanger điền mặc định trước, ResourceQuota đếm sau.

**Quota có khoá tài nguyên thì Pod phải khai khoá đó.** Khi \`shop-quota\` có \`requests.cpu\` và \`limits.memory\`, một Pod mới không có hai trường đó bị từ chối — kể cả Pod của CronJob \`order-report\` và Job busybox chưa từng khai gì. LimitRange \`shop-limits\` lấp chỗ đó: trên lab, Pod busybox không khai gì (thử bằng \`--dry-run=server\`) nhận \`requests: {cpu: 50m, memory: 64Mi}\`, \`limits: {memory: 128Mi}\`. Vì vậy tạo LimitRange **trước** quota. Pod đang chạy (log-agent BestEffort) không bị đổi: chỉ Pod tạo sau mới nhận mặc định.

**Lỗi quota nằm ở đâu.** Bạn tạo Pod thẳng mà vượt quota: \`kubectl\` nhận ngay \`Error from server (Forbidden): pods "extra" is forbidden: exceeded quota: …\`. Bạn scale **Deployment**: \`kubectl scale\` trả về thành công, vì thứ bạn sửa là \`spec.replicas\` của Deployment, quota không đếm nó. Người tạo Pod là **ReplicaSet controller**, và chính nó nhận lỗi Forbidden: Event \`FailedCreate\` gắn vào \`replicaset/…\`, \`k get deploy\` ghi \`READY 2/3\`, condition \`ReplicaFailure\`. Không có Pod Pending nào để \`describe\`: Pod chưa bao giờ tồn tại. Tìm ở Events của namespace hoặc \`describe rs\`.

**Chọn số cho shop từ \`used\`.** Sau s17, \`k describe quota\` cho \`requests.cpu 700m\`, \`requests.memory 1280Mi\`, \`limits.memory 1920Mi\`, \`pods 8\` (5 JVM + 3 log-agent). Hạn mức phải chừa chỗ cho: một Pod surge của rolling update (256Mi request), Pod của CronJob, log-agent được tạo lại (nhận mặc định), Pod nháp ở s19 và replica thêm của HPA ở s20. \`shop-quota\`: \`pods 20\`, \`requests.cpu 2\`, \`requests.memory 3Gi\`, \`limits.memory 5Gi\`. \`max.memory 2Gi\` của LimitRange chặn một container xin quá cả node (worker 2 GB).

**Giống pool trong Java.** Quota của namespace là cùng một ý với \`maximumPoolSize\` của HikariCP hay hạn mức theo tenant: một khách hàng (một namespace, một team) không được ăn hết tài nguyên chung, và khi chạm trần thì **yêu cầu mới bị từ chối ngay** thay vì làm chậm mọi người. Bài [Database Connection Pool: pool size bao nhiêu là đủ?](#/docs/java-08) tính trần pool từ tài nguyên thật phía sau; ở đây trần quota tính từ allocatable của hai worker. Và giống pool, quota chỉ có ích khi mọi người phải đi qua nó: LimitRange là cách ép Pod "không khai gì" cũng phải mang số.

**Namespace mặc định của context.** \`kubectl config set-context --current --namespace=shop\` ghi \`namespace: shop\` vào context trong \`~/.kube/config\`: mọi lệnh không có \`-n\` chạy trong shop. Trong phòng thi mỗi câu một namespace: đặt context ngay đầu câu, đừng tin vào trí nhớ. Từ buổi này lời giải bỏ \`-n shop\` khi không cần.`,
    refs: [
      { label: "Bài lộ trình CKAD: LimitRange & ResourceQuota theo namespace", href: "#/roadmap/ckad/w4-4" },
      { label: "Bài lộ trình CKA Study Guide: requests/limits, ResourceQuota và LimitRange", href: "#/roadmap/ckabook/cb-w4-1" },
      { label: "Bài lộ trình CKA Study Guide: Pod và namespace ở tốc độ mệnh lệnh", href: "#/roadmap/ckabook/cb-w3-1" },
      { label: "CKA Study Guide, chương 13 — Yêu cầu tài nguyên, giới hạn và quota", href: "#/docs/ckabook-13" },
      { label: "CKA Study Guide, chương 9 — Pod và Namespace", href: "#/docs/ckabook-09" },
      { label: "Java 08 — Database Connection Pool: pool size bao nhiêu là đủ?", href: "#/docs/java-08" },
      { label: "Thực hành nhanh: create quota, set-context, YAML ResourceQuota/LimitRange", href: "#/commands" },
      { label: "kubernetes.io: Resource Quotas", href: "https://kubernetes.io/docs/concepts/policy/resource-quotas/" },
      { label: "kubernetes.io: Limit Ranges", href: "https://kubernetes.io/docs/concepts/policy/limit-range/" },
    ],
    stateIn: "Đầu ra s17: ba Deployment có requests/limits (QoS Burstable), JAVA_OPTS=-XX:MaxRAMPercentage=50; namespace shop chưa có quota hay LimitRange. `./labs/lab begin cka s18` kiểm đầu vào bằng verify của s17.",
    stateOut: "Context của user ubuntu trên cka-cp mặc định namespace shop; ResourceQuota shop-quota (pods 20, requests.cpu 2, requests.memory 3Gi, limits.memory 5Gi) và LimitRange shop-limits (defaultRequest 50m/64Mi, default 128Mi, max 2Gi) khớp ~/shop/{quota,limits}.yaml; shop chạy đủ trong hạn mức; namespace nháp quota-lab đã xoá; ~/drills/s18/answers.env.",
    tasks: [
      { id: "t1", text: "`k config get-contexts` — cột NAMESPACE đang trống. `k config set-context --current --namespace=shop`, chạy lại `get-contexts` và `k get pod` (không `-n`). Từ đây bỏ `-n shop`." },
      { id: "t2", text: "Thử quota trên namespace nháp: `k create ns quota-lab`, `k -n quota-lab create quota pod-cap --hard=pods=2`, `k -n quota-lab create deploy busy --image=busybox:1.37 -- sleep 3600`. Scale `busy` lên 3: lệnh có báo lỗi không? `k -n quota-lab get deploy,rs,pod`, `k -n quota-lab get events --field-selector reason=FailedCreate`. Event gắn vào object loại gì? Ghi `QUOTA_ERROR_KIND=<loại>` vào `~/drills/s18/answers.env`." },
      { id: "t3", text: "Vẫn trong quota-lab: `k -n quota-lab run extra --image=busybox:1.37 -- sleep 3600`. Lỗi in ra ở đâu, loại gì (chữ trong ngoặc sau `Error from server`)? Ghi `POD_QUOTA_ERROR=<loại>`. `k -n quota-lab describe quota`, trả `busy` về 1 replica, rồi `k delete ns quota-lab`." },
      { id: "t4", text: "`~/shop/limits.yaml`: LimitRange `shop-limits`, `type: Container`, `defaultRequest` cpu 50m / memory 64Mi, `default` memory 128Mi, `max` memory 2Gi (không đặt gì cho CPU ngoài defaultRequest: lý do ở gợi ý). Apply, rồi thử: `k run lr-probe --image=busybox:1.37 --dry-run=server -o jsonpath='{.spec.containers[0].resources}' -- true` — Pod nhận gì? Có Pod nào được tạo không?" },
      { id: "t5", text: "`~/shop/quota.yaml`: ResourceQuota `shop-quota` với `pods: \"20\"`, `requests.cpu: \"2\"`, `requests.memory: 3Gi`, `limits.memory: 5Gi` (viết YAML, đừng dùng `create quota`: tệp phải ở `~/shop/`). Apply, `k describe quota,limitrange`. Cộng tay `used` từ requests của các Pod (s17) và so. Bao nhiêu replica catalog nữa thì chạm `requests.memory`?" },
      { id: "t6", text: "Trên Mac: `./labs/lab verify cka s18` phải đạt 7/7." },
    ],
    hints: [
      "`k scale` thành công không có nghĩa Pod được tạo: quota chặn ở bước ReplicaSet tạo Pod. `READY 2/3` mà không có Pod Pending nào là dấu hiệu.",
      "LimitRange có `max.cpu` thì container không khai `limits.cpu` được gán `default.cpu`, không khai default thì bằng chính `max` (thử trên lab: `max.cpu: 1` → Pod nhận `limits.cpu: 1`): shop sẽ bị đặt CPU limit ngoài ý muốn. Chỉ giới hạn memory.",
      "Quota có khoá `requests.cpu`, `limits.memory` mà chưa có LimitRange: Pod mới không khai gì bị từ chối `failed quota: …: must specify limits.memory for: …; requests.cpu for: …` (thử trên lab). Apply LimitRange trước.",
      "`k describe quota` cho Used/Hard; `k get quota` gọn hơn. Số trong `hard` viết dạng chuỗi trong YAML (`\"20\"`, `\"2\"`) cho chắc.",
    ],
    solution: `Output là của máy soạn bài; tên Pod sẽ khác.

**1. Namespace mặc định của context**

\`\`\`bash
k config set-context --current --namespace=shop
k config get-contexts
# CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
# *         kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   shop
\`\`\`

**2 và 3. Vượt quota ở namespace nháp**

\`\`\`bash
k create ns quota-lab
k -n quota-lab create quota pod-cap --hard=pods=2
k -n quota-lab create deploy busy --image=busybox:1.37 -- sleep 3600
k -n quota-lab scale deploy/busy --replicas=3
# deployment.apps/busy scaled
k -n quota-lab get deploy,rs,pod
# NAME                   READY   UP-TO-DATE   AVAILABLE   AGE
# deployment.apps/busy   2/3     2            2           6s
# NAME                              DESIRED   CURRENT   READY   AGE
# replicaset.apps/busy-74c554c5cc   3         2         2       6s
# NAME                        READY   STATUS    RESTARTS   AGE
# pod/busy-74c554c5cc-9dr9z   1/1     Running   0          5s
# pod/busy-74c554c5cc-kp2mc   1/1     Running   0          6s
k -n quota-lab get events --field-selector reason=FailedCreate
# LAST SEEN   TYPE      REASON         OBJECT                       MESSAGE
# 5s          Warning   FailedCreate   replicaset/busy-74c554c5cc   Error creating: pods "busy-74c554c5cc-pznl2" is forbidden: exceeded quota: pod-cap, requested: pods=1, used: pods=2, limited: pods=2
k -n quota-lab run extra --image=busybox:1.37 -- sleep 3600
# Error from server (Forbidden): pods "extra" is forbidden: exceeded quota: pod-cap, requested: pods=1, used: pods=2, limited: pods=2
k -n quota-lab get quota
# NAME      REQUEST     LIMIT   AGE
# pod-cap   pods: 2/2           7s
printf 'QUOTA_ERROR_KIND=ReplicaSet\\nPOD_QUOTA_ERROR=Forbidden\\n' > ~/drills/s18/answers.env
k -n quota-lab scale deploy/busy --replicas=1
k delete ns quota-lab
\`\`\`

Cùng một lỗi \`exceeded quota\`, hai nơi nhận: \`kubectl\` của bạn khi bạn tạo Pod, ReplicaSet controller khi Deployment tạo Pod. \`DESIRED 3 / CURRENT 2\` ở ReplicaSet là chỗ lộ ra. Thử ở namespace riêng vì thử bằng catalog trên shop là bật thêm vài JVM trên hai worker 2 GB.

**4. LimitRange**

\`\`\`yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: shop-limits
  namespace: shop
spec:
  limits:
  - type: Container
    defaultRequest:
      cpu: 50m
      memory: 64Mi
    default:
      memory: 128Mi
    max:
      memory: 2Gi
\`\`\`

\`\`\`bash
k apply -f ~/shop/limits.yaml
k run lr-probe --image=busybox:1.37 --dry-run=server -o jsonpath='{.metadata.namespace} {.spec.containers[0].resources}' -- true; echo
# shop {"limits":{"memory":"128Mi"},"requests":{"cpu":"50m","memory":"64Mi"}}
k get pod lr-probe
# Error from server (NotFound): pods "lr-probe" not found
\`\`\`

\`--dry-run=server\` chạy qua mọi admission plugin (LimitRanger, ResourceQuota) nhưng không lưu: cách kiểm "Pod này sẽ nhận gì" mà không tạo gì.

**5. ResourceQuota**

\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: shop-quota
  namespace: shop
spec:
  hard:
    pods: "20"
    requests.cpu: "2"
    requests.memory: 3Gi
    limits.memory: 5Gi
\`\`\`

\`\`\`bash
k apply -f ~/shop/quota.yaml
k describe quota,limitrange
# Name:            shop-quota
# Resource         Used    Hard
# --------         ----    ----
# limits.memory    1920Mi  5Gi
# pods             8       20
# requests.cpu     700m    2
# requests.memory  1280Mi  3Gi
#
# Name:       shop-limits
# Type        Resource  Min  Max  Default Request  Default Limit  Max Limit/Request Ratio
# ----        --------  ---  ---  ---------------  -------------  -----------------------
# Container   memory    -    2Gi  64Mi             128Mi          -
# Container   cpu       -    -    50m              -              -
\`\`\`

700m = 2×100m (gateway) + 2×200m (catalog) + 100m (order); 1280Mi = 5×256Mi; log-agent chưa khai gì nên tính 0. Init container \`wait-catalog\` (16Mi) không cộng thêm: request của Pod là max(init, tổng container chính). Còn \`3Gi − 1280Mi = 1792Mi\`: bảy replica catalog nữa (256Mi mỗi cái) thì chạm đúng \`requests.memory\`; nhưng \`requests.cpu\` chạm trước, ở replica thứ bảy (700m + 7 × 200m > 2). Cả hai đều xa hơn RAM thật của hai worker: quota là trần hành chính, không thay cho đo \`free -m\`.

Lời giải tự động: \`labs/cka/sessions/s18/apply.sh\` (manifest trong \`labs/cka/sessions/s18/files/\`).`,
    exam: {
      patterns: [
        "\"Tạo namespace X với ResourceQuota giới hạn N Pod và M CPU\" — `k create ns x; k create quota q -n x --hard=pods=N,requests.cpu=M`.",
        "\"Pod không khai tài nguyên phải nhận mặc định …\" — LimitRange `defaultRequest`/`default`; kiểm bằng `--dry-run=server`.",
        "\"Deployment không đủ replica, tìm lý do\" — `describe rs` / Events `FailedCreate` (quota, LimitRange max).",
        "Mọi câu có namespace: `k config set-context --current --namespace=…` trước tiên.",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Trong 3 phút: namespace `team-a` chỉ cho tổng `limits.memory` 1Gi; Pod `big` (busybox, `sleep 3600`) xin limit 2Gi phải bị từ chối. Đọc lỗi rồi xoá namespace.",
          timeLimitMin: 3,
          solution: "```bash\nk create ns team-a\nk -n team-a create quota mem --hard=limits.memory=1Gi\nk -n team-a run big --image=busybox:1.37 $do -- sleep 3600 > big.yaml\n# thêm resources.limits.memory: 2Gi\nk apply -f big.yaml        # Error from server (Forbidden): … exceeded quota: mem, requested: limits.memory=2Gi …\nk delete ns team-a\n```",
        },
        {
          text: "Trong 1 phút: in namespace của context hiện hành.",
          timeLimitMin: 1,
          solution: "```bash\nk config view --minify -o jsonpath='{..namespace}'; echo\n```",
        },
      ],
    },
    tips: [
      "Context namespace sai là cách mất điểm rẻ nhất: đầu mỗi câu chạy lệnh `use-context` của đề rồi `set-context --current --namespace=…`.",
      "Deployment thiếu replica mà không có Pod Pending: nhìn ReplicaSet (`describe rs`) trước, không phải Pod.",
      "Quota có khoá tài nguyên ⇒ cần LimitRange (hoặc mọi Pod tự khai): nếu không, Pod của Job/CronJob bị từ chối im lặng ở controller.",
      "`--dry-run=server` cho bạn thấy kết quả của admission (mặc định, từ chối) mà không tạo gì.",
    ],
    outcome: {
      md: `Namespace shop có ngân sách và quy định mặc định; Pod mới không khai gì vẫn mang số. Trên Mac:

\`\`\`bash
./labs/lab verify cka s18
\`\`\`

Verify đọc quota và LimitRange (so với \`~/shop/\`), namespace của context, thử một Pod không khai tài nguyên bằng \`--dry-run=server\`, so \`used\` với \`hard\`, và kiểm hai đáp án cùng namespace nháp đã xoá.`,
      verifyOutput: "lab: kiểm s18\n  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)\n  ✓ ResourceQuota shop-quota: pods, requests.cpu, requests.memory, limits.memory; khớp ~/shop/quota.yaml\n  ✓ LimitRange shop-limits (Container): default.memory, defaultRequest.cpu/memory, max.memory; khớp ~/shop/limits.yaml\n  ✓ kubectl config: namespace của context hiện hành là shop\n  ✓ Pod không khai tài nguyên (--dry-run=server) nhận đúng defaultRequest và default của shop-limits\n  ✓ shop-quota: used ≤ hard mọi khoá; gateway, catalog, order Available 2/2/1\n  ✓ answers.env: QUOTA_ERROR_KIND=ReplicaSet; namespace quota-lab đã xoá\n  ✓ answers.env: POD_QUOTA_ERROR=Forbidden (lỗi khi tạo Pod thẳng vượt quota)\n  → 7/7 đạt",
      projectDelta: "shop có ResourceQuota shop-quota và LimitRange shop-limits; context mặc định namespace shop. Buổi sau quyết định Pod chạy trên node nào.",
    },
    review: [
      { q: "Scale Deployment vượt quota: lỗi hiện ở đâu, vì sao không ở kubectl?", a: "Ở Event FailedCreate của ReplicaSet (`describe rs`, `get events`), Deployment READY thiếu. `kubectl scale` chỉ sửa spec.replicas của Deployment (quota không đếm); ReplicaSet controller mới là bên tạo Pod và bị admission từ chối." },
      { q: "Quota có requests.cpu nhưng namespace không có LimitRange. Pod của một CronJob không khai tài nguyên thì sao?", a: "Bị ResourceQuota admission từ chối (`failed quota: …: must specify … requests.cpu for: …`): Job không tạo được Pod, lỗi nằm ở Event FailedCreate của Job. LimitRange defaultRequest/default điền giá trị trước khi quota đếm." },
      { q: "LimitRange có đổi Pod đang chạy không?", a: "Không. Nó là admission plugin, chỉ chạy lúc Pod được tạo. Pod log-agent BestEffort tạo trước đó giữ nguyên tới khi bị tạo lại." },
      { q: "Vì sao không đặt max.cpu trong LimitRange của shop?", a: "Có max cho CPU thì container không khai limits.cpu được gán default.cpu, hoặc chính max nếu không có default (trên lab: max 1 → limits.cpu 1). Shop cố ý không có CPU limit để JVM khởi động và GC không bị throttling." },
    ],
  },

  // ───────────────────────────── s19 ─────────────────────────────
  {
    id: "s19",
    stage: "st3",
    title: "nodeSelector, affinity, taint, toleration, nodeName và PriorityClass",
    durationMin: 90,
    domain: "workloads",
    competencies: ["wl-admission-sched"],
    requires: ["s18"],
    status: "published",
    pieces: [],
    goals: [
      "Đánh dấu cka-w2 cho database bằng nhãn role=db; đi trọn vòng taint → Pod Pending → toleration + nodeAffinity → gỡ taint (hai worker 2 GB không đủ để dành riêng một node).",
      "Trải hai replica catalog ra hai worker bằng podAntiAffinity preferred, và thấy dạng required để replica thứ ba Pending.",
      "Phân biệt bốn cách gắn Pod với node (nodeName, nodeSelector, affinity, static pod), biết cách nào bỏ qua scheduler, và gắn PriorityClass cho gateway.",
    ],
    skills: [
      { skill: "k-label-node", level: "Gõ được không tra" },
      { skill: "k-nodeselector-toleration", level: "Viết được không tra" },
      { skill: "k-node-affinity", level: "Viết được có tra" },
      { skill: "k-taint-node", level: "Gõ được không tra" },
      { skill: "k-pod-antiaffinity", level: "Viết được có tra" },
      { skill: "k-nodename", level: "Viết được không tra" },
      { skill: "k-priorityclass", level: "Viết được có tra" },
    ],
    uses: ["k-get-wide", "k-node-conditions", "k-static-pod-dir", "k-explain", "vim-paste-mode"],
    foundation: null,
    mindset: `**Hút và đẩy.** Nhãn trên node + \`nodeSelector\`/\`nodeAffinity\` trên Pod là lực **hút**: Pod chỉ (hoặc ưu tiên) đi tới node khớp. Taint trên node là lực **đẩy**: mọi Pod không có toleration tương ứng bị từ chối. Hai lực độc lập: toleration chỉ *cho phép* Pod lên node có taint, không *kéo* Pod tới đó. Muốn "chỉ db chạy trên cka-w2, và db chỉ chạy trên cka-w2" thì cần **cả hai**: taint + toleration (đẩy Pod khác ra) và nhãn + affinity (kéo db vào). Buổi này luyện trọn vòng đó trên Pod nháp \`db-probe\`, rồi **gỡ taint**: hai worker 2 GB không đủ để dành riêng một node, nên trạng thái cuối chỉ giữ nhãn \`role=db\` (s24 dùng bằng nodeAffinity).

**Đọc FailedScheduling từng vế.** Scheduler chạy các *filter* lần lượt trên từng node, node bị loại ở filter đầu tiên nó trượt. Trên lab, \`db-probe\` có \`nodeSelector: role=db\` khi cka-w2 mang taint \`dedicated=db:NoSchedule\`:

\`0/3 nodes are available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s).\`

cka-w1 trượt vì không có nhãn; cka-w2 (có nhãn) và cka-cp trượt vì taint — scheduler của 1.36 không in tên taint, \`k describe node | grep Taints\` mới cho biết. Phần \`preemption: … Preemption is not helpful\` nói đẩy Pod khác đi cũng không giúp được (taint và nhãn không đổi khi có Pod bị đuổi).

**Bốn cách gắn Pod với node:**

| Cách | Khai ở đâu | Ai quyết định | Qua scheduler? |
|---|---|---|---|
| \`nodeName\` | \`spec.nodeName\` của Pod | bạn | **Không**: kubelet của node đó nhận Pod luôn, bỏ qua taint NoSchedule và nhãn |
| \`nodeSelector\` | \`spec.nodeSelector\` (khớp nhãn chính xác) | scheduler | có |
| \`nodeAffinity\` / \`podAffinity\` / \`podAntiAffinity\` | \`spec.affinity\`, \`required…\` (bắt buộc) hoặc \`preferred…\` (cộng điểm) | scheduler | có |
| static pod | tệp trong \`/etc/kubernetes/manifests\` của node (s08) | kubelet của node đó | **Không**, cũng không qua API create: kubelet tự chạy rồi tạo *mirror Pod* (\`web-static-cka-w1\`, owner \`Node/cka-w1\`) |

Đo trên lab: Pod \`pinned\` với \`nodeName: cka-cp\` chạy ngay trên control plane dù cka-cp có taint \`node-role.kubernetes.io/control-plane:NoSchedule\`; Events của nó chỉ có \`Pulled\`, \`Created\`, \`Started\` — không có \`Scheduled\` vì scheduler chưa từng thấy nó. Đó là lý do \`nodeName\` hợp với gỡ lỗi khi scheduler chết, không hợp với workload thật.

**required hay preferred.** \`podAntiAffinity\` *required* theo \`kubernetes.io/hostname\` nghĩa là "không bao giờ hai Pod cùng nhãn trên một node": Deployment nháp \`spread-lab\` 3 replica có hai Pod Running (cka-w1, cka-w2) và Pod thứ ba Pending: \`1 node(s) had untolerated taint(s), 2 node(s) didn't match pod anti-affinity rules\`. Với catalog, s20 cho HPA tăng quá 2 replica, nên dùng *preferred*: scheduler cộng điểm cho node chưa có catalog, nhưng vẫn xếp khi hết chỗ. Đổi lại preferred chỉ là điểm lúc xếp lịch: trong rolling update hai Pod mới có thể rơi cùng node (\`IgnoredDuringExecution\` — không ai dời Pod đang chạy). Kiểm \`get pod -o wide\` sau mỗi rollout; xoá một Pod nếu trùng.

**PriorityClass.** Mỗi Pod có \`spec.priority\` (mặc định 0). Pod Pending có priority cao được xếp trước, và nếu không chỗ, scheduler được phép đuổi (preempt) Pod priority thấp hơn (\`PREEMPTIONPOLICY PreemptLowerPriority\`). Hệ thống đã dùng sẵn: calico-node \`system-node-critical\` (2000001000), coredns \`system-cluster-critical\` (2000000000). Gateway là cửa vào của shop: \`shop-critical\` (100000, không \`globalDefault\`) cho nó được ưu tiên hơn Pod nháp hay Job khi node chật. Giống \`Thread.setPriority\` ở chỗ nó chỉ có nghĩa khi có tranh chấp; khác ở chỗ hậu quả là Pod khác bị xoá thật.`,
    refs: [
      { label: "Bài lộ trình CKA: nodeSelector & node affinity (required vs preferred)", href: "#/roadmap/cka/cka-w4-1" },
      { label: "Bài lộ trình CKA: Taints & Tolerations", href: "#/roadmap/cka/cka-w4-2" },
      { label: "Bài lộ trình CKA: Pod affinity / anti-affinity", href: "#/roadmap/cka/cka-w4-3" },
      { label: "Bài lộ trình CKA: Manual scheduling — spec.nodeName", href: "#/roadmap/cka/cka-w4-4" },
      { label: "Bài lộ trình CKA: PriorityClass & ảnh hưởng của requests tới scheduling", href: "#/roadmap/cka/cka-w4-8" },
      { label: "CKA Study Guide, chương 14 — Lập lịch Pod", href: "#/docs/ckabook-14" },
      { label: "Thực hành nhanh: label/taint node, YAML affinity, nodeName, PriorityClass", href: "#/commands" },
      { label: "kubernetes.io: Assigning Pods to Nodes", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/" },
      { label: "kubernetes.io: Taints and Tolerations", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/" },
      { label: "kubernetes.io: Pod Priority and Preemption", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/" },
    ],
    stateIn: "Đầu ra s18: shop chạy đủ trong quota shop-quota và LimitRange shop-limits; context mặc định namespace shop; hai worker chưa có nhãn hay taint nào. `./labs/lab begin cka s19` kiểm đầu vào bằng verify của s18. Manifest nháp của buổi tự viết vào ~/drills/s19/.",
    stateOut: "cka-w2 mang nhãn role=db, hai worker không taint; catalog có podAntiAffinity preferred theo kubernetes.io/hostname, hai Pod ở hai node; PriorityClass shop-critical (100000) gắn cho gateway; ~/shop/{catalog,gateway,priorityclass}.yaml khớp cluster; db-probe, spread-lab, pinned đã xoá; ~/drills/s19/answers.env.",
    tasks: [
      { id: "t1", text: "`k get node -L role` và `k describe node cka-w1 cka-w2 | grep Taints`. `k label node cka-w2 role=db`, rồi `k taint node cka-w2 dedicated=db:NoSchedule`." },
      { id: "t2", text: "`~/drills/s19/db-probe.yaml`: Pod `db-probe` (busybox:1.37, `sleep 3600`) với `nodeSelector: {role: db}`. Apply. `k get pod db-probe -o wide`, rồi đọc Event `FailedScheduling` (`k describe pod db-probe`). Mỗi vế của câu `0/3 nodes are available: …` nói về node nào? Ghi `PENDING_REASON=<cụm từ chỉ lý do cka-w2 bị loại>` vào `~/drills/s19/answers.env`: chép nguyên cụm từ trong Event, không kèm số node." },
      { id: "t3", text: "Sửa `db-probe.yaml`: thêm toleration cho `dedicated=db:NoSchedule` và thay `nodeSelector` bằng `nodeAffinity` required (`role In [db]`) — dán khung từ kubernetes.io thì `:set paste` trước. `k replace --force -f`; Pod phải Running trên cka-w2. Rồi gỡ taint (`k taint node cka-w2 dedicated=db:NoSchedule-`) và xoá db-probe." },
      { id: "t4", text: "Deployment nháp `spread-lab` (busybox, `sleep 3600`, 3 replica) với `podAntiAffinity` **required** theo `kubernetes.io/hostname`, chọn chính nhãn `app: spread-lab` (`k explain deploy.spec.template.spec.affinity.podAntiAffinity` khi quên tên trường). Bao nhiêu Pod Running, Pod còn lại vì sao Pending? Xoá spread-lab." },
      { id: "t5", text: "`~/shop/catalog.yaml`: thêm `podAntiAffinity` **preferred** (weight 100, `kubernetes.io/hostname`, `app: catalog`). Apply, `rollout status`, `k get pod -l app=catalog -o wide`: hai Pod phải ở hai node khác nhau (nếu trùng: xoá một Pod và xem Pod thay thế đi đâu)." },
      { id: "t6", text: "Pod `pinned` (busybox, `sleep 3600`) với `nodeName: cka-cp`. Nó có chạy được dù cka-cp có taint không? `k get events --field-selector involvedObject.name=pinned` — thiếu Event nào so với một Pod thường? So với static pod `web-static-cka-w1` của s08 (`ssh cka-w1 ls /etc/kubernetes/manifests`, owner của mirror Pod). Ghi `NODENAME_SKIPS_SCHEDULER=yes` nếu bạn thấy nodeName bỏ qua scheduler, rồi xoá pinned." },
      { id: "t7", text: "`~/shop/priorityclass.yaml`: PriorityClass `shop-critical`, `value: 100000`, `globalDefault: false`, có `description`. Thêm `priorityClassName: shop-critical` vào Pod template trong `~/shop/gateway.yaml`. Apply cả hai, `rollout status`, `k get pod -l app=gateway -o custom-columns=NAME:.metadata.name,PRIORITY:.spec.priority`. Trên Mac: `./labs/lab verify cka s19` phải đạt 5/5." },
    ],
    hints: [
      "Toleration phải khớp `key`, `value` (với `operator: Equal`) và `effect` của taint. `operator: Exists` thì không cần `value`.",
      "`nodeSelector` và `nodeAffinity` cùng có mặt thì Pod phải thoả **cả hai**. Khi chuyển sang affinity, xoá `nodeSelector` cũ.",
      "`k taint node … -` (dấu trừ cuối) gỡ taint; `k label node cka-w2 role-` gỡ nhãn. Gõ sai key khi gỡ: lệnh báo `not found`, taint vẫn còn — kiểm lại bằng `describe node | grep Taints`.",
      "`priorityClassName` trỏ tới PriorityClass chưa có thì Pod bị admission từ chối (`no PriorityClass with name … was found`, thử trên lab) và ReplicaSet báo `FailedCreate`: tạo PriorityClass trước.",
      "Pod đang có chỉ cho sửa image, `activeDeadlineSeconds` và *thêm* toleration (thử `k patch` nodeSelector trên lab: `pod updates may not change fields other than …`). Đổi nodeSelector/affinity: `k replace --force -f` như s16.",
    ],
    solution: `Output là của máy soạn bài; tên Pod và IP sẽ khác. Context đã ở namespace shop (s18).

**1–3. Nhãn, taint, toleration + nodeAffinity**

\`\`\`bash
k label node cka-w2 role=db
k taint node cka-w2 dedicated=db:NoSchedule
k get node -L role
# NAME     STATUS   ROLES           AGE   VERSION   ROLE
# cka-cp   Ready    control-plane   22h   v1.36.6
# cka-w1   Ready    <none>          22h   v1.36.6
# cka-w2   Ready    <none>          22h   v1.36.6   db
k run db-probe --image=busybox:1.37 $do -- sleep 3600 > ~/drills/s19/db-probe.yaml
vim ~/drills/s19/db-probe.yaml       # spec.nodeSelector: {role: db}
k apply -f ~/drills/s19/db-probe.yaml
k describe pod db-probe | sed -n '/Events/,$p'
#   Warning  FailedScheduling  6s    default-scheduler  0/3 nodes are available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s). no new claims to deallocate, preemption: 0/3 nodes are available: 3 Preemption is not helpful for scheduling.
echo 'PENDING_REASON=untolerated taint' > ~/drills/s19/answers.env
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-probe
  namespace: shop
  labels:
    app: db-probe
spec:
  tolerations:
  - key: dedicated
    operator: Equal
    value: db
    effect: NoSchedule
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: role
            operator: In
            values: ["db"]
  terminationGracePeriodSeconds: 0
  containers:
  - name: probe
    image: busybox:1.37
    command: ["sleep", "3600"]
\`\`\`

\`\`\`bash
k replace --force -f ~/drills/s19/db-probe.yaml
k get pod db-probe -o wide
# db-probe   1/1     Running   0          1s    10.244.62.177   cka-w2
k taint node cka-w2 dedicated=db:NoSchedule-
k delete pod db-probe
\`\`\`

Toleration một mình thì Pod có thể lên cka-w1 *hoặc* cka-w2; nodeAffinity một mình thì Pod bị taint chặn. Cần cả hai.

**4. podAntiAffinity required: replica thứ ba Pending**

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spread-lab
  namespace: shop
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spread-lab
  template:
    metadata:
      labels:
        app: spread-lab
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - topologyKey: kubernetes.io/hostname
            labelSelector:
              matchLabels:
                app: spread-lab
      terminationGracePeriodSeconds: 0
      containers:
      - name: sleep
        image: busybox:1.37
        command: ["sleep", "3600"]
\`\`\`

\`\`\`bash
k apply -f ~/drills/s19/spread-lab.yaml
k get pod -l app=spread-lab -o wide
# spread-lab-69dc76f94-6g7c5   1/1     Running   0          15s   10.244.62.178   cka-w2
# spread-lab-69dc76f94-jv5ll   1/1     Running   0          15s   10.244.95.163   cka-w1
# spread-lab-69dc76f94-sj9j4   0/1     Pending   0          15s   <none>          <none>
k describe pod spread-lab-69dc76f94-sj9j4 | grep FailedScheduling
#   Warning  FailedScheduling  15s   default-scheduler  0/3 nodes are available: 1 node(s) had untolerated taint(s), 2 node(s) didn't match pod anti-affinity rules. …
k delete -f ~/drills/s19/spread-lab.yaml
\`\`\`

Hai worker, ba replica, "không bao giờ chung node": một Pod không có chỗ. cka-cp bị loại vì taint control plane, trước cả khi xét anti-affinity.

**5. catalog: preferred**

\`\`\`yaml
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: kubernetes.io/hostname
              labelSelector:
                matchLabels:
                  app: catalog
      terminationGracePeriodSeconds: 45
\`\`\`

\`\`\`bash
k apply -f ~/shop/catalog.yaml && k rollout status deploy/catalog
k get pod -l app=catalog -o wide
# catalog-75c4d75888-hhq8n   1/1     Running   0          55s   10.244.95.166   cka-w1
# catalog-75c4d75888-tlwjt   1/1     Running   0          39s   10.244.62.181   cka-w2
\`\`\`

Khác dạng required: với preferred, \`podAffinityTerm\` lồng trong một mục có \`weight\` (1–100). Sau khi VM khởi động lại, hai Pod vẫn ở hai node (kubelet chạy lại Pod tại chỗ, không xếp lịch lại).

**6. nodeName: bỏ qua scheduler**

\`\`\`bash
k run pinned --image=busybox:1.37 $do -- sleep 3600 > ~/drills/s19/pinned.yaml
vim ~/drills/s19/pinned.yaml      # spec.nodeName: cka-cp
k apply -f ~/drills/s19/pinned.yaml
k get pod pinned -o wide
# pinned   1/1     Running   0          0s    10.244.160.8   cka-cp
k get events --field-selector involvedObject.name=pinned
# Normal   Pulled    pod/pinned   Container image "busybox:1.37" already present on machine …
# Normal   Created   pod/pinned   Container created
# Normal   Started   pod/pinned   Container started
k -n default get pod web-static-cka-w1 -o jsonpath='{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}'; echo
# Node/cka-w1
echo NODENAME_SKIPS_SCHEDULER=yes >> ~/drills/s19/answers.env
k delete pod pinned
\`\`\`

Không có \`Scheduled\`: không ai "assign" Pod, nó đã mang sẵn tên node. Taint \`NoSchedule\` của control plane không chặn được vì đó là luật của scheduler. Static pod còn đi xa hơn: kubelet đọc tệp trên đĩa, API server chỉ thấy bản phản chiếu.

**7. PriorityClass cho gateway**

\`\`\`yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: shop-critical
value: 100000
globalDefault: false
description: "Cửa vào của shop: được xếp lịch trước và bị đẩy (preempt) sau các Pod khác của shop."
\`\`\`

\`\`\`bash
k apply -f ~/shop/priorityclass.yaml
vim ~/shop/gateway.yaml          # spec.template.spec.priorityClassName: shop-critical
k apply -f ~/shop/gateway.yaml && k rollout status deploy/gateway
k get priorityclass
# NAME                      VALUE        GLOBAL-DEFAULT   AGE   PREEMPTIONPOLICY
# shop-critical             100000       false            56s   PreemptLowerPriority
# system-cluster-critical   2000000000   false            22h   PreemptLowerPriority
# system-node-critical      2000001000   false            22h   PreemptLowerPriority
k get pod -l app=gateway -o custom-columns=NAME:.metadata.name,PRIORITY:.spec.priority,CLASS:.spec.priorityClassName
# gateway-55f6b8dc58-28mp2   100000     shop-critical
# gateway-55f6b8dc58-ckt2x   100000     shop-critical
\`\`\`

PriorityClass là object cấp cluster (không namespace). \`spec.priority\` được admission điền từ tên class lúc tạo Pod, và \`value\` của class không sửa được (\`k patch\` trên lab: \`value: Forbidden: may not be changed in an update\`): muốn đổi thì tạo class mới.

Lời giải tự động: \`labs/cka/sessions/s19/apply.sh\` (manifest trong \`labs/cka/sessions/s19/files/\`).`,
    exam: {
      patterns: [
        "\"Chạy Pod X chỉ trên node có nhãn Y\" — `nodeSelector` hoặc `nodeAffinity` required.",
        "\"Node Z chỉ dành cho Pod có toleration\" — `k taint node z key=value:NoSchedule` + toleration ở Pod.",
        "\"Không để hai replica chung một node\" — `podAntiAffinity` required, `topologyKey: kubernetes.io/hostname`.",
        "\"Xếp Pod lên node X mà không qua scheduler\" — `spec.nodeName`, hoặc static pod trong `/etc/kubernetes/manifests` của node.",
        "\"Tạo PriorityClass và dùng cho Deployment\" — `k create priorityclass … --value=…`, `priorityClassName` trong Pod template.",
      ],
      timeTargetMin: 7,
      drills: [
        {
          text: "Trong 2 phút: tạo PriorityClass `batch-low` value 10, không globalDefault, bằng lệnh mệnh lệnh; in VALUE của nó rồi xoá.",
          timeLimitMin: 2,
          solution: "```bash\nk create priorityclass batch-low --value=10 --description='Job nền'\nk get priorityclass batch-low\nk delete priorityclass batch-low\n```",
        },
        {
          text: "Trong 3 phút: Pod `nginx-fast` (image `busybox:1.37`, `sleep 3600`) chỉ chạy trên node có nhãn `disktype=ssd` nếu có, không có thì chạy đâu cũng được.",
          timeLimitMin: 3,
          solution: "```yaml\nspec:\n  affinity:\n    nodeAffinity:\n      preferredDuringSchedulingIgnoredDuringExecution:\n      - weight: 1\n        preference:\n          matchExpressions:\n          - key: disktype\n            operator: In\n            values: [\"ssd\"]\n```\n\"Nếu có… không thì…\" là `preferred`; nodeAffinity preferred dùng `preference`, không phải `podAffinityTerm`.",
        },
      ],
    },
    tips: [
      "Đọc FailedScheduling theo từng vế `N node(s) …`; tổng các vế bằng số node. Vế nào không tự giải thích được thì `describe node | grep -A3 Taints` và `get node --show-labels`.",
      "`nodeName` bỏ qua scheduler: đừng dùng nó để \"sửa\" Pod Pending trong đề, trừ khi đề bảo vậy.",
      "Gỡ taint: cùng lệnh với dấu `-` ở cuối. Gỡ nhãn: `k label node <n> <key>-`.",
      "Không nhớ tên trường affinity: `k explain pod.spec.affinity --recursive | less`, hoặc chép khung từ kubernetes.io với `:set paste`.",
    ],
    outcome: {
      md: `Shop biết đặt Pod ở đâu: catalog trải hai worker, gateway được ưu tiên, cka-w2 được đánh dấu cho database. Trên Mac:

\`\`\`bash
./labs/lab verify cka s19
\`\`\`

Verify đọc nhãn và taint của hai worker, affinity và vị trí của hai Pod catalog, PriorityClass và priority của Pod gateway, so \`~/shop/\` với cluster, kiểm các Pod nháp đã xoá và hai đáp án.`,
      verifyOutput: "lab: kiểm s19\n  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)\n  ✓ cka-w2 có nhãn role=db (chỉ cka-w2); cka-w1, cka-w2 không còn taint, không cordon\n  ✓ catalog: podAntiAffinity preferred theo kubernetes.io/hostname (app=catalog), 2 Pod Ready ở 2 node khác nhau; ~/shop/catalog.yaml khớp\n  ✓ PriorityClass shop-critical (không globalDefault), Pod gateway mang priority của nó; Available 2/2/1; ~/shop/gateway.yaml khớp\n  ✓ answers.env: PENDING_REASON có 'untolerated taint' (Event FailedScheduling của db-probe); Pod db-probe đã xoá\n  ✓ answers.env: NODENAME_SKIPS_SCHEDULER=yes; Pod pinned và Deployment spread-lab đã xoá\n  → 5/5 đạt",
      projectDelta: "cka-w2 có nhãn role=db (chờ PostgreSQL ở s24); catalog trải hai node, gateway có PriorityClass shop-critical. Buổi sau đo tải thật và co giãn catalog bằng HPA.",
    },
    review: [
      { q: "Taint/toleration và nodeAffinity khác nhau thế nào? Dành riêng một node cho db cần gì?", a: "Taint đẩy mọi Pod không tolerate ra khỏi node; toleration chỉ cho phép, không kéo Pod tới. nodeAffinity/nodeSelector kéo Pod tới node có nhãn. Dành riêng: taint node + toleration ở db (Pod khác không vào) và nhãn + affinity ở db (db không đi nơi khác)." },
      { q: "Cách nào gắn Pod với node mà không qua scheduler?", a: "`spec.nodeName` (kubelet của node nhận thẳng, bỏ qua taint NoSchedule và nhãn; không có Event Scheduled) và static pod (kubelet đọc /etc/kubernetes/manifests, API server chỉ có mirror Pod)." },
      { q: "Vì sao catalog dùng podAntiAffinity preferred thay vì required?", a: "Required với hostname giới hạn số replica bằng số node có thể xếp (2 worker): HPA ở s20 tăng lên 3 thì Pod thứ ba Pending mãi. Preferred vẫn ưu tiên trải ra nhưng cho phép chung node khi hết chỗ." },
      { q: "`0/3 nodes are available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s)` — đọc thế nào?", a: "Ba node đều bị loại: một node không có nhãn mà Pod đòi; hai node có taint mà Pod không tolerate (ở lab: cka-cp với taint control plane và cka-w2 với dedicated=db). Thêm toleration đúng taint của node có nhãn thì Pod xếp được." },
      { q: "PriorityClass ảnh hưởng gì khi node còn dư tài nguyên?", a: "Gần như không: chỉ đổi thứ tự trong hàng đợi của scheduler. Nó có tác dụng khi chật: Pod priority cao Pending có thể khiến scheduler preempt (xoá) Pod priority thấp hơn để lấy chỗ." },
    ],
  },

  {
    id: "s20",
    stage: "st3",
    title: "metrics-server, kubectl top và HPA",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-autoscale"],
    requires: ["s19"],
    status: "skeleton",
    pieces: ["hpa"],
    goals: [
      "Cài metrics-server trên cluster kubeadm và thấy kubectl top trả số.",
      "Tạo HPA cho catalog, bật endpoint ngốn CPU của shop và xem số replica tăng rồi giảm.",
      "Đọc được vì sao HPA hiện TARGETS <unknown>.",
    ],
    skills: [
      { skill: "k-metrics-server-install", level: "Làm được có tra" },
      { skill: "k-top-node", level: "Gõ được không tra" },
      { skill: "k-top-pod", level: "Gõ được không tra" },
      { skill: "k-autoscale", level: "Gõ được không tra" },
      { skill: "k-hpa-v2-yaml", level: "Viết được có tra" },
      { skill: "k-hpa-targets", level: "Giải thích được" },
    ],
    uses: ["k-set-resources", "k-cm-literal", "k-rollout-restart", "k-describe-quota"],
    stateIn: "Đầu ra s19: shop có requests CPU.",
    stateOut: "metrics-server chạy; HPA catalog (min 2, max 5, CPU 60%) đã co giãn thật dưới tải và về lại 2.",
  },
  {
    id: "s21",
    stage: "st3",
    title: "Sự cố chặng 3: Pod Pending và thiếu tài nguyên",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-monitor"],
    requires: ["s20"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Đưa các Pod Pending về Running trong 20 phút bằng cách đọc lý do FailedScheduling.",
      "Tìm Pod và container đang ngốn tài nguyên nhất cụm bằng kubectl top và sắp xếp.",
      "Phân biệt thiếu tài nguyên thật với ràng buộc scheduling sai.",
    ],
    skills: [
      { skill: "k-pending-reasons", level: "Nhận ra trong 30 giây" },
      { skill: "k-failedscheduling-events", level: "Gõ được có tra" },
      { skill: "k-top-containers", level: "Gõ được không tra" },
      { skill: "k-events-all", level: "Gõ được không tra" },
      { skill: "k-custom-columns", level: "Gõ được có tra" },
    ],
    uses: ["k-top-pod", "k-node-allocated", "k-taint-node", "k-node-affinity", "k-describe-quota"],
    stateIn: "Đầu ra s20 cộng `./labs/lab break`: vài Pod Pending vì nhiều nguyên nhân chồng nhau.",
    stateOut: "Mọi Pod của shop Running; ràng buộc scheduling và quota trở lại đúng như cuối s20.",
  },
];
